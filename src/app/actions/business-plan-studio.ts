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
    const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId);
    if (!authCheck.authorized) {
      return { ok: true, persistedToCloudSql: false };
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
 * Compiles a specific section of a Business Plan Version using `gemini-2.5-pro`.
 */
export async function compileBusinessPlanSectionAction(input: {
  planId: string;
  versionId: string;
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
  if (UUID_REGEX.test(input.planId)) {
    const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId);
    if (!authCheck.authorized) {
      return {
        allowed: false,
        compiledResponseText: input.currentResponseText || '',
        wordCount: 0,
        aiAssessorTip: 'Session expired or plan ownership could not be verified.',
        engineMode: 'smart-synthesizer',
      };
    }
  }

  return await generateModuleLStep3SectionViaRouter({
    planId: input.planId,
    planTitle: input.planTitle,
    industryCategory: input.industryCategory,
    hqCountryCode: input.hqCountryCode,
    baseCurrency: input.baseCurrency,
    compilerMode: input.targetTone === 'UNDERWRITER_CONSERVATIVE'
      ? 'UK_START_UP_LOANS_WORKBOOK'
      : input.targetTone === 'VENTURE_HIGH_GROWTH'
        ? 'STANDARD_COMMERCIAL_PLAN'
        : input.hqCountryCode === 'GB'
          ? 'UK_INNOVATE_UK_9Q'
          : 'IE_LEO_OFFICIAL_FORM',
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
  if (UUID_REGEX.test(input.planId)) {
    const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId);
    if (!authCheck.authorized) {
      return {
        allowed: false,
        overallAuditScore: 0,
        auditItems: [],
        preFlightDefenseSummary: 'Unauthorized session.',
        aiAssessorTip: 'Please log in to run live assessor audits.',
        engineMode: 'smart-synthesizer',
      };
    }
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
 * based on an inline prompt or quick preset using `gemini-2.5-pro`.
 */
export async function polishBusinessPlanChapterAction(input: {
  planId: string;
  chapterTitle: string;
  currentText: string;
  instruction: string;
  targetTone: string;
  planTitle: string;
  industryCategory?: string;
  hqCountryCode: string;
  baseCurrency: string;
}): Promise<PolishBusinessPlanTextResult> {
  if (UUID_REGEX.test(input.planId)) {
    const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId);
    if (!authCheck.authorized) {
      return {
        allowed: false,
        polishedText: input.currentText,
        summaryOfChanges: 'Session unauthorized.',
        engineMode: 'smart-synthesizer',
      };
    }
  }

  return await polishBusinessPlanTextViaRouter({
    planId: input.planId,
    planTitle: input.planTitle,
    industryCategory: input.industryCategory,
    hqCountryCode: input.hqCountryCode,
    baseCurrency: input.baseCurrency,
    targetTone: input.targetTone,
    chapterTitle: input.chapterTitle,
    currentText: input.currentText,
    instruction: input.instruction,
  });
}

/**
 * Compiles/refreshes all sections of a business plan version in one unified batch using `gemini-2.5-pro`.
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
  compiledSections: { sectionNumber: number; compiledResponseText: string }[];
  error?: string;
}> {
  if (UUID_REGEX.test(input.planId)) {
    const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId);
    if (!authCheck.authorized) {
      return {
        ok: false,
        compiledSections: [],
        error: 'Unauthorized session.',
      };
    }
  }

  const results: { sectionNumber: number; compiledResponseText: string }[] = [];

  for (const sec of input.sections) {
    try {
      const res = await generateModuleLStep3SectionViaRouter({
        planId: input.planId,
        planTitle: input.planTitle,
        industryCategory: input.industryCategory,
        hqCountryCode: input.hqCountryCode,
        baseCurrency: input.baseCurrency,
        compilerMode:
          input.targetTone === 'UNDERWRITER_CONSERVATIVE'
            ? 'UK_START_UP_LOANS_WORKBOOK'
            : input.targetTone === 'VENTURE_HIGH_GROWTH'
              ? 'STANDARD_COMMERCIAL_PLAN'
              : input.hqCountryCode === 'GB'
                ? 'UK_INNOVATE_UK_9Q'
                : 'IE_LEO_OFFICIAL_FORM',
        sectionNumber: sec.sectionNumber,
        sectionTitle: sec.title,
        assessorPrompt: sec.assessorPrompt,
        scoringWeightPercent: sec.scoringWeightPercent ?? 20,
        wordLimit: sec.wordLimit,
        currentResponseText: sec.currentResponseText,
        planContextSummary: input.planContextSummary,
      });

      results.push({
        sectionNumber: sec.sectionNumber,
        compiledResponseText: res.compiledResponseText,
      });
    } catch {
      results.push({
        sectionNumber: sec.sectionNumber,
        compiledResponseText: sec.currentResponseText || '',
      });
    }
  }

  return { ok: true, compiledSections: results };
}
