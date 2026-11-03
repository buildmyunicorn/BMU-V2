'use server';

import { and, eq, sql } from 'drizzle-orm';
import { db, startupPlans, planModulesData, openQuestionsParkingLot } from '@/db';
import type {
  ModuleKStep1AuditSavedData,
  ModuleKStep2CapitalStackSavedData,
  ModuleKStep3ReimbursementBridgeSavedData,
  ModuleKStep4TaxReliefSavedData,
  ModuleKStep5FundingBriefSavedData,
} from '@/lib/auth/session-store';
import { verifyActiveSessionAndPlanOwnership } from '@/lib/auth/server-auth';
import {
  generateModuleKCapitalStackNarrativeViaRouter,
  type GenerateModuleKCapitalStackNarrativeParams,
  type GenerateModuleKCapitalStackNarrativeResult,
  generateModuleKStep1AuditOverviewViaRouter,
  type GenerateModuleKStep1AuditOverviewParams,
  type GenerateModuleKStep1AuditOverviewResult,
  generateModuleKStep3ReimbursementBridgeViaRouter,
  type GenerateModuleKStep3ReimbursementBridgeParams,
  type GenerateModuleKStep3ReimbursementBridgeResult,
  generateModuleKStep4TaxReliefViaRouter,
  type GenerateModuleKStep4TaxReliefParams,
  type GenerateModuleKStep4TaxReliefResult,
  generateModuleKStep5FundingBriefViaRouter,
  type GenerateModuleKStep5FundingBriefParams,
  type GenerateModuleKStep5FundingBriefResult,
} from '@/lib/ai/router';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let moduleKEnumEnsured = false;

async function ensureModuleKEnumInPostgres(): Promise<void> {
  if (moduleKEnumEnsured) return;
  try {
    await db.execute(
      sql`ALTER TYPE "public"."module_code" ADD VALUE IF NOT EXISTS 'MOD_K_GRANTS_FUNDING'`
    );
    moduleKEnumEnsured = true;
  } catch {
    // Non-fatal if enum value already exists
  }
}

/**
 * Persists Module K Step 1 (Grant Audit & Checklist) to `plan_modules_data`.
 */
export async function saveModuleKStep1AuditAction(input: {
  planId: string;
  step1Audit: ModuleKStep1AuditSavedData;
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

    await ensureModuleKEnumInPostgres();

    const existingMod = await db
      .select()
      .from(planModulesData)
      .where(
        and(
          eq(planModulesData.planId, input.planId),
          eq(planModulesData.moduleCode, 'MOD_K_GRANTS_FUNDING')
        )
      )
      .limit(1);

    const nowIso = new Date().toISOString();
    const cleanStep1: ModuleKStep1AuditSavedData = {
      ...input.step1Audit,
      lastAuditedAt: nowIso,
    };

    const currentJson: Record<string, unknown> =
      existingMod.length > 0 &&
      typeof existingMod[0].structuredInputsJsonb === 'object' &&
      existingMod[0].structuredInputsJsonb !== null
        ? (existingMod[0].structuredInputsJsonb as Record<string, unknown>)
        : {};

    const updatedJson: Record<string, unknown> = {
      ...currentJson,
      step1Audit: cleanStep1,
      lastSavedAt: nowIso,
    };

    if (existingMod.length > 0) {
      await db
        .update(planModulesData)
        .set({
          structuredInputsJsonb: updatedJson,
          updatedAt: new Date(),
        })
        .where(eq(planModulesData.id, existingMod[0].id));
    } else {
      await db.insert(planModulesData).values({
        planId: input.planId,
        moduleCode: 'MOD_K_GRANTS_FUNDING',
        structuredInputsJsonb: updatedJson,
      });
    }

    // Update active step in startup_plans
    await db
      .update(startupPlans)
      .set({
        currentModuleStep: 'MOD_K_STEP_1_AUDIT',
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
 * Persists Module K Step 2 (Capital Stack & Funding Blend) to `plan_modules_data`.
 */
export async function saveModuleKStep2CapitalStackAction(input: {
  planId: string;
  step2CapitalStack: ModuleKStep2CapitalStackSavedData;
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

    await ensureModuleKEnumInPostgres();

    const existingMod = await db
      .select()
      .from(planModulesData)
      .where(
        and(
          eq(planModulesData.planId, input.planId),
          eq(planModulesData.moduleCode, 'MOD_K_GRANTS_FUNDING')
        )
      )
      .limit(1);

    const nowIso = new Date().toISOString();
    const cleanStep2: ModuleKStep2CapitalStackSavedData = {
      ...input.step2CapitalStack,
      lastSavedAt: nowIso,
    };

    const currentJson: Record<string, unknown> =
      existingMod.length > 0 &&
      typeof existingMod[0].structuredInputsJsonb === 'object' &&
      existingMod[0].structuredInputsJsonb !== null
        ? (existingMod[0].structuredInputsJsonb as Record<string, unknown>)
        : {};

    const updatedJson: Record<string, unknown> = {
      ...currentJson,
      step2CapitalStack: cleanStep2,
      lastSavedAt: nowIso,
    };

    if (existingMod.length > 0) {
      await db
        .update(planModulesData)
        .set({
          structuredInputsJsonb: updatedJson,
          updatedAt: new Date(),
        })
        .where(eq(planModulesData.id, existingMod[0].id));
    } else {
      await db.insert(planModulesData).values({
        planId: input.planId,
        moduleCode: 'MOD_K_GRANTS_FUNDING',
        structuredInputsJsonb: updatedJson,
      });
    }

    // Update active step in startup_plans
    await db
      .update(startupPlans)
      .set({
        currentModuleStep: 'MOD_K_STEP_2_CAPITAL_STACK',
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
 * Park an unresolved grant question into the Open Questions Parking Lot.
 */
export async function parkModuleKOpenQuestionAction(input: {
  planId: string;
  questionText: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!UUID_REGEX.test(input.planId)) {
    return { ok: true };
  }

  try {
    const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId);
    if (!authCheck.authorized) {
      return { ok: false, error: 'Unauthorized' };
    }

    await db.insert(openQuestionsParkingLot).values({
      planId: input.planId,
      sourceModule: 'MOD_K_GRANTS_FUNDING',
      questionText: input.questionText.trim(),
      status: 'OPEN',
    });

    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to park question';
    return { ok: false, error: message };
  }
}

/**
 * Generate Underwriter Strategy & Matching Funds Narrative via AI Router.
 */
export async function generateModuleKCapitalStackNarrativeAction(
  params: GenerateModuleKCapitalStackNarrativeParams & { planId: string }
): Promise<GenerateModuleKCapitalStackNarrativeResult> {
  if (params.planId && UUID_REGEX.test(params.planId)) {
    try {
      const authCheck = await verifyActiveSessionAndPlanOwnership(params.planId);
      if (!authCheck.authorized) {
        return {
          allowed: false,
          narrative: '',
          assessorStrategyTip: 'Unauthorized',
          engineMode: 'smart-synthesizer',
        };
      }
    } catch {
      // Continue to router fallback if auth check fails gracefully
    }
  }

  return generateModuleKCapitalStackNarrativeViaRouter(params);
}

/**
 * Generate Step 1 Grant Audit Overview & Pre-Flight Roadmap via AI Router.
 */
export async function generateModuleKStep1AuditOverviewAction(
  params: GenerateModuleKStep1AuditOverviewParams & { planId: string }
): Promise<GenerateModuleKStep1AuditOverviewResult> {
  if (params.planId && UUID_REGEX.test(params.planId)) {
    try {
      const authCheck = await verifyActiveSessionAndPlanOwnership(params.planId);
      if (!authCheck.authorized) {
        return {
          allowed: false,
          auditOverview: '',
          assessorStrategyTip: 'Unauthorized',
          engineMode: 'smart-synthesizer',
        };
      }
    } catch {
      // Continue to router fallback if auth check fails gracefully
    }
  }

  return generateModuleKStep1AuditOverviewViaRouter(params);
}

/**
 * Persists Module K Step 3 (Grant Reimbursement Bridge) to `plan_modules_data`.
 */
export async function saveModuleKStep3ReimbursementBridgeAction(input: {
  planId: string;
  step3Bridge: ModuleKStep3ReimbursementBridgeSavedData;
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

    await ensureModuleKEnumInPostgres();

    const existingMod = await db
      .select()
      .from(planModulesData)
      .where(
        and(
          eq(planModulesData.planId, input.planId),
          eq(planModulesData.moduleCode, 'MOD_K_GRANTS_FUNDING')
        )
      )
      .limit(1);

    const nowIso = new Date().toISOString();
    const existingJson =
      existingMod.length > 0 && existingMod[0].structuredInputsJsonb
        ? (existingMod[0].structuredInputsJsonb as Record<string, unknown>)
        : {};

    const updatedJson = {
      ...existingJson,
      step3ReimbursementBridge: {
        ...input.step3Bridge,
        lastSavedAt: nowIso,
      },
      completionPercentage: Math.max(
        Number(existingJson.completionPercentage) || 0,
        input.completionPercentage || 65
      ),
      lastSavedAt: nowIso,
    };

    if (existingMod.length > 0) {
      await db
        .update(planModulesData)
        .set({
          structuredInputsJsonb: updatedJson,
          updatedAt: new Date(),
        })
        .where(eq(planModulesData.id, existingMod[0].id));
    } else {
      await db.insert(planModulesData).values({
        planId: input.planId,
        moduleCode: 'MOD_K_GRANTS_FUNDING',
        structuredInputsJsonb: updatedJson,
      });
    }

    await db
      .update(startupPlans)
      .set({
        currentModuleStep: 'MOD_K_STEP_3_REIMBURSEMENT_BRIDGE',
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
 * Generate Step 3 Reimbursement Bridge Narrative via AI Router.
 */
export async function generateModuleKStep3ReimbursementBridgeAction(
  params: GenerateModuleKStep3ReimbursementBridgeParams & { planId: string }
): Promise<GenerateModuleKStep3ReimbursementBridgeResult> {
  if (params.planId && UUID_REGEX.test(params.planId)) {
    try {
      const authCheck = await verifyActiveSessionAndPlanOwnership(params.planId);
      if (!authCheck.authorized) {
        return {
          allowed: false,
          narrative: '',
          assessorStrategyTip: 'Unauthorized',
          engineMode: 'smart-synthesizer',
        };
      }
    } catch {
      // Continue to router fallback if auth check fails gracefully
    }
  }

  return generateModuleKStep3ReimbursementBridgeViaRouter(params);
}

/**
 * Persists Module K Step 4 (Investor Tax Relief & Angel Catalyst) to `plan_modules_data`.
 */
export async function saveModuleKStep4TaxReliefAction(input: {
  planId: string;
  step4TaxRelief: ModuleKStep4TaxReliefSavedData;
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

    await ensureModuleKEnumInPostgres();

    const existingMod = await db
      .select()
      .from(planModulesData)
      .where(
        and(
          eq(planModulesData.planId, input.planId),
          eq(planModulesData.moduleCode, 'MOD_K_GRANTS_FUNDING')
        )
      )
      .limit(1);

    const nowIso = new Date().toISOString();
    const existingJson =
      existingMod.length > 0 && existingMod[0].structuredInputsJsonb
        ? (existingMod[0].structuredInputsJsonb as Record<string, unknown>)
        : {};

    const updatedJson = {
      ...existingJson,
      step4TaxRelief: {
        ...input.step4TaxRelief,
        lastSavedAt: nowIso,
      },
      completionPercentage: Math.max(
        Number(existingJson.completionPercentage) || 0,
        input.completionPercentage || 80
      ),
      lastSavedAt: nowIso,
    };

    if (existingMod.length > 0) {
      await db
        .update(planModulesData)
        .set({
          structuredInputsJsonb: updatedJson,
          updatedAt: new Date(),
        })
        .where(eq(planModulesData.id, existingMod[0].id));
    } else {
      await db.insert(planModulesData).values({
        planId: input.planId,
        moduleCode: 'MOD_K_GRANTS_FUNDING',
        structuredInputsJsonb: updatedJson,
      });
    }

    await db
      .update(startupPlans)
      .set({
        currentModuleStep: 'MOD_K_STEP_4_TAX_RELIEF',
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
 * Generate Step 4 Investor Tax Relief Strategy Narrative via AI Router.
 */
export async function generateModuleKStep4TaxReliefAction(
  params: GenerateModuleKStep4TaxReliefParams & { planId: string }
): Promise<GenerateModuleKStep4TaxReliefResult> {
  if (params.planId && UUID_REGEX.test(params.planId)) {
    try {
      const authCheck = await verifyActiveSessionAndPlanOwnership(params.planId);
      if (!authCheck.authorized) {
        return {
          allowed: false,
          narrative: '',
          assessorStrategyTip: 'Unauthorized',
          engineMode: 'smart-synthesizer',
        };
      }
    } catch {
      // Continue to router fallback if auth check fails gracefully
    }
  }

  return generateModuleKStep4TaxReliefViaRouter(params);
}


/**
 * Persists Module K Step 5 (Funding Strategy Brief & Pre-Flight Assessor Audit) to `plan_modules_data`.
 */
export async function saveModuleKStep5FundingBriefAction(input: {
  planId: string;
  step5FundingBrief: ModuleKStep5FundingBriefSavedData;
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

    await ensureModuleKEnumInPostgres();

    const existingMod = await db
      .select()
      .from(planModulesData)
      .where(
        and(
          eq(planModulesData.planId, input.planId),
          eq(planModulesData.moduleCode, 'MOD_K_GRANTS_FUNDING')
        )
      )
      .limit(1);

    const nowIso = new Date().toISOString();
    const existingJson =
      existingMod.length > 0 && existingMod[0].structuredInputsJsonb
        ? (existingMod[0].structuredInputsJsonb as Record<string, unknown>)
        : {};

    const updatedJson = {
      ...existingJson,
      step5FundingBrief: {
        ...input.step5FundingBrief,
        lastSavedAt: nowIso,
      },
      completionPercentage: Math.max(
        Number(existingJson.completionPercentage) || 0,
        input.completionPercentage || 100
      ),
      lastSavedAt: nowIso,
    };

    if (existingMod.length > 0) {
      await db
        .update(planModulesData)
        .set({
          structuredInputsJsonb: updatedJson,
          updatedAt: new Date(),
        })
        .where(eq(planModulesData.id, existingMod[0].id));
    } else {
      await db.insert(planModulesData).values({
        planId: input.planId,
        moduleCode: 'MOD_K_GRANTS_FUNDING',
        structuredInputsJsonb: updatedJson,
      });
    }

    await db
      .update(startupPlans)
      .set({
        currentModuleStep: 'MOD_K_STEP_5_FUNDING_BRIEF',
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
 * Generate Step 5 Executive Funding Strategy Brief via AI Router.
 */
export async function generateModuleKStep5FundingBriefAction(
  params: GenerateModuleKStep5FundingBriefParams & { planId: string }
): Promise<GenerateModuleKStep5FundingBriefResult> {
  if (params.planId && UUID_REGEX.test(params.planId)) {
    try {
      const authCheck = await verifyActiveSessionAndPlanOwnership(params.planId);
      if (!authCheck.authorized) {
        return {
          allowed: false,
          executiveSummary: '',
          fundingRoadmap: [],
          assessorReadinessScore: 50,
          underwriterContradictionFlags: [],
          recommendedActionChecklist: [],
          moduleLGrantMode: 'STANDARD',
          assessorStrategyTip: 'Unauthorized',
          engineMode: 'smart-synthesizer',
        };
      }
    } catch {
      // Continue to router fallback if auth check fails gracefully
    }
  }

  return generateModuleKStep5FundingBriefViaRouter(params);
}
