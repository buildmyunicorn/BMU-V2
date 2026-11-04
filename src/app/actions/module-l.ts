'use server';

import { and, eq, sql } from 'drizzle-orm';
import { db, startupPlans, planModulesData, openQuestionsParkingLot } from '@/db';
import type {
  ModuleLStep1ModeSavedData,
  ModuleLStep2ContradictionAuditSavedData,
  ModuleLStep3NarrativeCompilerSavedData,
  ModuleLStep4AppendicesSavedData,
  ModuleLStep5SubmissionBriefSavedData,
} from '@/lib/auth/session-store';
import { verifyActiveSessionAndPlanOwnership } from '@/lib/auth/server-auth';
import {
  generateModuleLStep1MandateViaRouter,
  type GenerateModuleLStep1MandateParams,
  type GenerateModuleLStep1MandateResult,
  generateModuleLStep2AuditViaRouter,
  type GenerateModuleLStep2AuditParams,
  type GenerateModuleLStep2AuditResult,
  generateModuleLStep2DefenseViaRouter,
  type GenerateModuleLStep2DefenseParams,
  type GenerateModuleLStep2DefenseResult,
  generateModuleLStep3SectionViaRouter,
  type GenerateModuleLStep3SectionParams,
  type GenerateModuleLStep3SectionResult,
  generateModuleLStep4AuditViaRouter,
  type GenerateModuleLStep4AuditParams,
  type GenerateModuleLStep4AuditResult,
  generateModuleLStep5DossierViaRouter,
  type GenerateModuleLStep5DossierParams,
  type GenerateModuleLStep5DossierResult,
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
 * Persists Module L Step 1 (Compiler Mode & Assessor Rubric Selection) to `plan_modules_data`
 * while preserving any existing `masterDocumentData` or Steps 2–5 data.
 */
export async function saveModuleLStep1ModeAction(input: {
  planId: string;
  step1Mode: ModuleLStep1ModeSavedData;
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
    const cleanStep1: ModuleLStep1ModeSavedData = {
      ...input.step1Mode,
      lastSavedAt: nowIso,
    };

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
      input.completionPercentage ?? 20
    );

    const updatedJson: Record<string, unknown> = {
      ...currentJson,
      step1Mode: cleanStep1,
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
        currentModuleStep: 'MOD_L_STEP_1_MODE',
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
 * Generates or calibrates the Module L Step 1 Compiler Mandate & Assessor Tip via the central AI router.
 */
export async function generateModuleLStep1MandateAction(
  params: GenerateModuleLStep1MandateParams
): Promise<GenerateModuleLStep1MandateResult> {
  if (params.planId && UUID_REGEX.test(params.planId)) {
    const authCheck = await verifyActiveSessionAndPlanOwnership(params.planId);
    if (!authCheck.authorized) {
      return {
        allowed: false,
        reason: authCheck.reason || 'Unauthorized plan access.',
        compilerMandateNotes: '',
        assessorStrategyTip: '',
        recommendedNarrativeTone: 'EVIDENCE_LED_ASSESSOR',
        recommendedSubmissionObjective: 'NON_DILUTIVE_CAPITAL_GRANT',
        engineMode: 'smart-synthesizer',
      };
    }
  }

  return generateModuleLStep1MandateViaRouter(params);
}

/**
 * Runs the deep Cross-Module Contradiction and Pre-Flight Underwriter Audit via the central AI router.
 */
export async function generateModuleLStep2AuditAction(
  params: GenerateModuleLStep2AuditParams
): Promise<GenerateModuleLStep2AuditResult> {
  if (params.planId && UUID_REGEX.test(params.planId)) {
    const authCheck = await verifyActiveSessionAndPlanOwnership(params.planId);
    if (!authCheck.authorized) {
      return {
        allowed: false,
        reason: authCheck.reason || 'Unauthorized plan access.',
        overallAuditScore: 0,
        auditItems: [],
        preFlightDefenseSummary: '',
        aiAssessorTip: '',
        engineMode: 'smart-synthesizer',
      };
    }
  }

  return generateModuleLStep2AuditViaRouter(params);
}

/**
 * Calibrates or re-generates the Consolidated Pre-Flight Defense Statement via AI.
 */
export async function generateModuleLStep2DefenseAction(
  params: GenerateModuleLStep2DefenseParams
): Promise<GenerateModuleLStep2DefenseResult> {
  if (params.planId && UUID_REGEX.test(params.planId)) {
    const authCheck = await verifyActiveSessionAndPlanOwnership(params.planId);
    if (!authCheck.authorized) {
      return {
        allowed: false,
        reason: authCheck.reason || 'Unauthorized plan access.',
        defenseSummary: '',
        aiAssessorTip: '',
        engineMode: 'smart-synthesizer',
      };
    }
  }

  return generateModuleLStep2DefenseViaRouter(params);
}

/**
 * Parks an open question from Module L into `open_questions_parking_lot`.
 */
export async function parkModuleLOpenQuestionAction(input: {
  planId: string;
  questionText: string;
}): Promise<{ ok: boolean; persistedToCloudSql: boolean }> {
  const trimmed = input.questionText.trim();
  if (!trimmed || !UUID_REGEX.test(input.planId)) {
    return { ok: true, persistedToCloudSql: false };
  }

  try {
    const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId);
    if (!authCheck.authorized) {
      return { ok: false, persistedToCloudSql: false };
    }

    await db.insert(openQuestionsParkingLot).values({
      planId: input.planId,
      sourceModule: 'MOD_L_BUSINESS_PLAN',
      questionText: trimmed.slice(0, 400),
      status: 'OPEN',
    });

    return { ok: true, persistedToCloudSql: true };
  } catch {
    return { ok: true, persistedToCloudSql: false };
  }
}

/**
 * Compiles or polishes an individual section of the Module L Step 3 Narrative Compiler via the central AI router.
 */
export async function generateModuleLStep3SectionAction(
  params: GenerateModuleLStep3SectionParams
): Promise<GenerateModuleLStep3SectionResult> {
  const auth = await verifyActiveSessionAndPlanOwnership(params.planId);
  if (!auth.authorized) {
    return {
      allowed: false,
      compiledResponseText: params.currentResponseText || '',
      wordCount: (params.currentResponseText || '').split(/\s+/).filter(Boolean).length,
      aiAssessorTip: 'Session verification failed.',
      engineMode: 'smart-synthesizer',
    };
  }

  return generateModuleLStep3SectionViaRouter(params);
}

/**
 * Audits the Module L Step 4 Appendices Evidence Binder via the central AI router.
 */
export async function generateModuleLStep4AuditAction(
  params: GenerateModuleLStep4AuditParams
): Promise<GenerateModuleLStep4AuditResult> {
  const auth = await verifyActiveSessionAndPlanOwnership(params.planId);
  if (!auth.authorized) {
    return {
      allowed: false,
      aiBinderAssessment:
        'All appendices must be verified before submission.',
      aiAssessorTip: 'Session verification failed.',
      engineMode: 'smart-synthesizer',
    };
  }

  return generateModuleLStep4AuditViaRouter(params);
}

/**
 * Generates or calibrates the Module L Step 5 Final Dossier Brief & Readiness Review via the central AI router.
 */
export async function generateModuleLStep5DossierAction(
  params: GenerateModuleLStep5DossierParams
): Promise<GenerateModuleLStep5DossierResult> {
  const auth = await verifyActiveSessionAndPlanOwnership(params.planId);
  if (!auth.authorized) {
    return {
      allowed: false,
      executiveDossierSummary:
        'All sections and appendices must be compiled and signed off prior to submission.',
      committeeReadinessScore: 85,
      finalSubmissionChecklist: [
        'Review narrative sections',
        'Verify matching funds',
        'Confirm appendices A-F',
      ],
      aiAssessorTip: 'Session verification failed.',
      engineMode: 'smart-synthesizer',
    };
  }

  return generateModuleLStep5DossierViaRouter(params);
}


/**
 * Persists Module L Steps 2–5 payloads cleanly to `plan_modules_data`.
 */
export async function saveModuleLPartialDataAction(input: {
  planId: string;
  stepKey: 'step2Audit' | 'step3Compiler' | 'step4Appendices' | 'step5DossierBrief';
  payload:
    | ModuleLStep2ContradictionAuditSavedData
    | ModuleLStep3NarrativeCompilerSavedData
    | ModuleLStep4AppendicesSavedData
    | ModuleLStep5SubmissionBriefSavedData;
  completionPercentage?: number;
}): Promise<{ ok: boolean; persistedToCloudSql: boolean }> {
  if (!UUID_REGEX.test(input.planId)) {
    return { ok: true, persistedToCloudSql: false };
  }

  try {
    const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId);
    if (!authCheck.authorized) {
      return { ok: false, persistedToCloudSql: false };
    }

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
      input.completionPercentage ?? 40
    );

    const updatedJson: Record<string, unknown> = {
      ...currentJson,
      [input.stepKey]: {
        ...input.payload,
        lastSavedAt: nowIso,
      },
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

    return { ok: true, persistedToCloudSql: true };
  } catch {
    return { ok: true, persistedToCloudSql: false };
  }
}

