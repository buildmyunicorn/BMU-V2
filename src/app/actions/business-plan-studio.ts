'use server';

import { and, eq, sql } from 'drizzle-orm';
import { db, ensureDatabaseSchemaSynced, startupPlans, planModulesData } from '@/db';
import type {
  BusinessPlanVersionItem,
  BusinessPlanArchetype,
  ModuleLCompiledSectionItem,
  ModuleLAppendixBinderItem,
  ModuleLContradictionAuditItem,
} from '@/lib/auth/session-store';
import { verifyActiveSessionAndPlanOwnership } from '@/lib/auth/server-auth';
import {
  generateModuleLStep2AuditViaRouter,
  generateModuleLStep3SectionViaRouter,
  generateBusinessPlanBatchViaRouter,
  polishBusinessPlanTextViaRouter,
  type GenerateModuleLStep3SectionResult,
  type GenerateModuleLStep2AuditResult,
  type PolishBusinessPlanTextResult,
} from '@/lib/ai/router';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let moduleLEnumEnsured = false;

async function ensureModuleLEnumInPostgres(): Promise<void> {
  if (moduleLEnumEnsured) return;
  try {
    await db.execute(
      sql`ALTER TYPE "public"."module_code" ADD VALUE IF NOT EXISTS 'MOD_L_BUSINESS_PLAN'`
    );
    moduleLEnumEnsured = true;
  } catch {
    // Non-fatal if enum value already exists
  }
}

/**
 * Persists the entire list of Business Plan Studio versions into `plan_modules_data`
 * under `MOD_L_BUSINESS_PLAN`.
 */
export async function saveBusinessPlanStudioVersionsAction(input: {
  planId: string;
  versions: BusinessPlanVersionItem[];
  activeVersionId?: string;
  completionPercentage?: number;
}): Promise<{ ok: boolean; persistedToCloudSql: boolean; error?: string }> {
  if (!UUID_REGEX.test(input.planId)) {
    return { ok: true, persistedToCloudSql: false };
  }

  try {
    const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId, {
      requiredModule: 'MOD_L_BUSINESS_PLAN',
      requireWrite: true,
    });
    if (!authCheck.authorized) {
      return {
        ok: false,
        persistedToCloudSql: false,
        error: authCheck.reason || 'Unauthorized plan access.',
      };
    }

    await ensureDatabaseSchemaSynced();
    await ensureModuleLEnumInPostgres();

    const existingMod = await db
      .select()
      .from(planModulesData)
      .where(
        and(
          eq(planModulesData.planId, input.planId),
          eq(planModulesData.moduleCode, 'MOD_L_BUSINESS_PLAN')
        )
      )
      .limit(1);

    const nowIso = new Date().toISOString();
    const currentJson: Record<string, unknown> =
      existingMod.length > 0 &&
      typeof existingMod[0].structuredInputsJsonb === 'object' &&
      existingMod[0].structuredInputsJsonb !== null
        ? (existingMod[0].structuredInputsJsonb as Record<string, unknown>)
        : {};

    const nextProgress = Math.max(
      typeof currentJson.completionPercentage === 'number'
        ? currentJson.completionPercentage
        : existingMod[0]?.completionPercentage || 0,
      input.completionPercentage ?? 35
    );

    const updatedJson: Record<string, unknown> = {
      ...currentJson,
      versions: input.versions,
      activeVersionId: input.activeVersionId ?? (input.versions[0]?.id || null),
      completionPercentage: nextProgress,
      lastSavedAt: nowIso,
    };

    if (existingMod.length > 0) {
      await db
        .update(planModulesData)
        .set({
          structuredInputsJsonb: updatedJson,
          completionPercentage: nextProgress,
          updatedAt: new Date(),
        })
        .where(eq(planModulesData.id, existingMod[0].id));
    } else {
      await db.insert(planModulesData).values({
        planId: input.planId,
        moduleCode: 'MOD_L_BUSINESS_PLAN',
        completionPercentage: nextProgress,
        structuredInputsJsonb: updatedJson,
        aiThingsToConsiderJsonb: [],
      });
    }

    await db
      .update(startupPlans)
      .set({
        currentModuleStep: 'BUSINESS_PLAN_STUDIO',
        updatedAt: new Date(),
      })
      .where(eq(startupPlans.id, input.planId));

    return { ok: true, persistedToCloudSql: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown database error';
    return { ok: false, persistedToCloudSql: false, error: message };
  }
}

/**
 * Compiles a specific section of a Business Plan Version calibrated to the version's archetype and length.
 */
export async function compileBusinessPlanSectionAction(input: {
  planId: string;
  versionId: string;
  archetype?: BusinessPlanArchetype;
  sectionNumber: number;
  sectionTitle: string;
  assessorPrompt: string;
  wordLimit: number;
  scoringWeightPercent?: number;
  planTitle: string;
  industryCategory?: string;
  hqCountryCode: string;
  baseCurrency: string;
  targetTone: string;
  currentResponseText?: string;
  planContextSummary: string;
}): Promise<GenerateModuleLStep3SectionResult> {
  if (!UUID_REGEX.test(input.planId)) {
    return {
      allowed: false,
      compiledResponseText: input.currentResponseText || '',
      wordCount: 0,
      aiAssessorTip: 'A valid saved Startup Plan is required.',
      engineMode: 'smart-synthesizer',
    };
  }
  const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId, {
    requiredModule: 'MOD_L_BUSINESS_PLAN',
    requireWrite: true,
  });
  if (!authCheck.authorized) {
    return {
      allowed: false,
      compiledResponseText: input.currentResponseText || '',
      wordCount: 0,
      aiAssessorTip: authCheck.reason || 'Session expired or plan ownership could not be verified.',
      engineMode: 'smart-synthesizer',
    };
  }

  const resolvedCompilerMode =
    input.archetype ||
    (input.targetTone === 'UNDERWRITER_CONSERVATIVE'
      ? 'COMMERCIAL_BANK_LOAN'
      : input.targetTone === 'VENTURE_HIGH_GROWTH'
        ? 'INVESTOR_ANGEL_MEMO'
        : input.wordLimit <= 220
          ? 'LEAN_ONE_PAGER'
          : input.targetTone === 'EXECUTIVE_CRISP'
            ? 'STANDARD_COMPREHENSIVE_PLAN'
            : input.hqCountryCode === 'GB'
              ? 'UK_INNOVATE_UK_9Q'
              : 'IE_LEO_OFFICIAL_GRANT');

  return await generateModuleLStep3SectionViaRouter({
    planId: input.planId,
    planTitle: input.planTitle,
    industryCategory: input.industryCategory,
    hqCountryCode: input.hqCountryCode,
    baseCurrency: input.baseCurrency,
    compilerMode: resolvedCompilerMode,
    sectionNumber: input.sectionNumber,
    sectionTitle: input.sectionTitle,
    assessorPrompt: input.assessorPrompt,
    scoringWeightPercent: input.scoringWeightPercent ?? 20,
    wordLimit: input.wordLimit,
    currentResponseText: input.currentResponseText,
    planContextSummary: input.planContextSummary,
  });
}

/**
 * Runs a pre-flight cross-module contradiction and assessor audit on a business plan version
 * using `gemini-2.5-pro`.
 */
export async function auditBusinessPlanVersionAction(input: {
  planId: string;
  planTitle: string;
  hqCountryCode: string;
  baseCurrency: string;
  industryCategory?: string;
  targetFundingAskAmount?: number;
  archetype: BusinessPlanArchetype;
  moduleAExportPotential?: string;
  moduleBSegments?: string;
  moduleCSurveySummary?: string;
  moduleDPricingAndQuotes?: string;
  moduleEOperationsEquipment?: string;
  moduleFTeamAndHeadcount?: string;
  moduleGLaunchpadSetup?: string;
  moduleHRevenueAndPricing?: string;
  moduleJFinanceAndCashflow?: string;
  moduleKFundingStackAndBuffer?: string;
}): Promise<GenerateModuleLStep2AuditResult> {
  if (!UUID_REGEX.test(input.planId)) {
    return {
      allowed: false,
      overallAuditScore: 0,
      auditItems: [],
      preFlightDefenseSummary: 'A valid saved Startup Plan is required.',
      aiAssessorTip: 'Please save your plan before running live assessor audits.',
      engineMode: 'smart-synthesizer',
    };
  }
  const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId, {
    requiredModule: 'MOD_L_BUSINESS_PLAN',
  });
  if (!authCheck.authorized) {
    return {
      allowed: false,
      overallAuditScore: 0,
      auditItems: [],
      preFlightDefenseSummary: authCheck.reason || 'Unauthorized session.',
      aiAssessorTip: 'Please log in with an active Paid Pass to run live assessor audits.',
      engineMode: 'smart-synthesizer',
    };
  }

  const compilerMode =
    input.archetype === 'COMMERCIAL_BANK_LOAN' || input.archetype === 'UK_START_UP_LOANS_WORKBOOK'
      ? 'UK_START_UP_LOANS_WORKBOOK'
      : input.archetype === 'UK_INNOVATE_UK_9Q'
        ? 'UK_INNOVATE_UK_9Q'
        : input.archetype === 'INVESTOR_ANGEL_MEMO'
          ? 'STANDARD_COMMERCIAL_PLAN'
          : 'IE_LEO_OFFICIAL_FORM';

  return await generateModuleLStep2AuditViaRouter({
    planTitle: input.planTitle,
    hqCountryCode: input.hqCountryCode,
    baseCurrency: input.baseCurrency,
    compilerMode,
    industryCategory: input.industryCategory,
    targetFundingAskAmount: input.targetFundingAskAmount,
    moduleAExportPotential: input.moduleAExportPotential,
    moduleBSegments: input.moduleBSegments,
    moduleCSurveySummary: input.moduleCSurveySummary,
    moduleDPricingAndQuotes: input.moduleDPricingAndQuotes,
    moduleEOperationsEquipment: input.moduleEOperationsEquipment,
    moduleFTeamAndHeadcount: input.moduleFTeamAndHeadcount,
    moduleGLaunchpadSetup: input.moduleGLaunchpadSetup,
    moduleHRevenueAndPricing: input.moduleHRevenueAndPricing,
    moduleJFinanceAndCashflow: input.moduleJFinanceAndCashflow,
    moduleKFundingStackAndBuffer: input.moduleKFundingStackAndBuffer,
  });
}

/**
 * Polishes or rewrites an individual chapter's narrative in the continuous document
 * based on an inline prompt or quick preset calibrated to the plan archetype.
 */
export async function polishBusinessPlanChapterAction(input: {
  planId: string;
  chapterTitle: string;
  currentText: string;
  instruction: string;
  targetTone: string;
  archetype?: BusinessPlanArchetype;
  wordLimit?: number;
  assessorPrompt?: string;
  planContextSummary?: string;
  planTitle: string;
  industryCategory?: string;
  hqCountryCode: string;
  baseCurrency: string;
}): Promise<PolishBusinessPlanTextResult> {
  if (!UUID_REGEX.test(input.planId)) {
    return {
      allowed: false,
      polishedText: input.currentText,
      summaryOfChanges: 'A valid saved Startup Plan is required.',
      engineMode: 'smart-synthesizer',
    };
  }
  const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId, {
    requiredModule: 'MOD_L_BUSINESS_PLAN',
    requireWrite: true,
  });
  if (!authCheck.authorized) {
    return {
      allowed: false,
      polishedText: input.currentText,
      summaryOfChanges: authCheck.reason || 'Session unauthorized.',
      engineMode: 'smart-synthesizer',
    };
  }

  return await polishBusinessPlanTextViaRouter({
    planId: input.planId,
    planTitle: input.planTitle,
    industryCategory: input.industryCategory,
    hqCountryCode: input.hqCountryCode,
    baseCurrency: input.baseCurrency,
    targetTone: input.targetTone,
    archetype: input.archetype,
    wordLimit: input.wordLimit,
    assessorPrompt: input.assessorPrompt,
    planContextSummary: input.planContextSummary,
    chapterTitle: input.chapterTitle,
    currentText: input.currentText,
    instruction: input.instruction,
  });
}

/**
 * Compiles/refreshes all sections of a business plan version in archetype-calibrated batches.
 */
export async function compileAllBusinessPlanSectionsAction(input: {
  planId: string;
  versionId: string;
  archetype: BusinessPlanArchetype;
  targetTone: string;
  planTitle: string;
  industryCategory?: string;
  hqCountryCode: string;
  baseCurrency: string;
  planContextSummary: string;
  sections: {
    sectionNumber: number;
    title: string;
    assessorPrompt: string;
    wordLimit: number;
    scoringWeightPercent?: number;
    currentResponseText?: string;
  }[];
}): Promise<{
  ok: boolean;
  compiledSections: {
    sectionNumber: number;
    compiledResponseText: string;
    wordCount?: number;
    aiAssessorTip?: string;
  }[];
  engineMode?: 'gemini-2.5-flash' | 'smart-synthesizer';
  error?: string;
}> {
  if (!UUID_REGEX.test(input.planId)) {
    return {
      ok: false,
      compiledSections: [],
      error: 'A valid saved Startup Plan is required.',
    };
  }
  const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId, {
    requiredModule: 'MOD_L_BUSINESS_PLAN',
    requireWrite: true,
  });
  if (!authCheck.authorized) {
    return {
      ok: false,
      compiledSections: [],
      error: authCheck.reason || 'Unauthorized session.',
    };
  }

  const batchResult = await generateBusinessPlanBatchViaRouter({
    planId: input.planId,
    planTitle: input.planTitle,
    industryCategory: input.industryCategory,
    hqCountryCode: input.hqCountryCode,
    baseCurrency: input.baseCurrency,
    compilerMode: input.archetype,
    targetTone: input.targetTone,
    planContextSummary: input.planContextSummary,
    sections: input.sections,
  });

  return {
    ok: true,
    compiledSections: batchResult.compiledSections,
    engineMode: batchResult.engineMode,
  };
}
