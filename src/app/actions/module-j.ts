'use server';

import { and, eq, sql } from 'drizzle-orm';
import {
  db,
  startupPlans,
  planModulesData,
  openQuestionsParkingLot,
} from '@/db';
import type {
  FinancialOverheadsTaxStep1Data,
  WorkingCapitalTimingStep2Data,
  CashflowFundingGapStep3Data,
  StatementsStressTestStep4Data,
  FinanceExecutiveBriefStep5Data,
} from '@/lib/auth/session-store';
import { verifyActiveSessionAndPlanOwnership } from '@/lib/auth/server-auth';
import {
  generateModuleJOverheadsTaxViaRouter,
  generateModuleJWorkingCapitalViaRouter,
  generateModuleJCashflowFundingGapViaRouter,
  generateModuleJStatementsStressTestViaRouter,
  generateModuleJExecutiveBriefViaRouter,
  type GenerateModuleJOverheadsTaxParams,
  type GenerateModuleJOverheadsTaxResult,
  type GenerateModuleJWorkingCapitalParams,
  type GenerateModuleJWorkingCapitalResult,
  type GenerateModuleJCashflowFundingGapParams,
  type GenerateModuleJCashflowFundingGapResult,
  type GenerateModuleJStatementsStressTestParams,
  type GenerateModuleJStatementsStressTestResult,
  type GenerateModuleJExecutiveBriefParams,
  type GenerateModuleJExecutiveBriefResult,
} from '@/lib/ai/router';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let moduleJEnumEnsured = false;

async function ensureModuleJEnumInPostgres(): Promise<void> {
  if (moduleJEnumEnsured) return;
  try {
    await db.execute(
      sql`ALTER TYPE "public"."module_code" ADD VALUE IF NOT EXISTS 'MOD_J_FINANCE'`
    );
    moduleJEnumEnsured = true;
  } catch {
    // Non-fatal if enum value already exists
  }
}

/**
 * Persists Module J Step 1 (Monthly Running Costs & Localized Tax Auto-Pilot) to `plan_modules_data`.
 */
export async function saveModuleJStep1OverheadsTaxAction(input: {
  planId: string;
  step1OverheadsTax: FinancialOverheadsTaxStep1Data;
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

    await ensureModuleJEnumInPostgres();

    const existingMod = await db
      .select()
      .from(planModulesData)
      .where(
        and(
          eq(planModulesData.planId, input.planId),
          eq(planModulesData.moduleCode, 'MOD_J_FINANCE')
        )
      )
      .limit(1);

    const nowIso = new Date().toISOString();
    const cleanStep1: FinancialOverheadsTaxStep1Data = {
      ...input.step1OverheadsTax,
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
      step1OverheadsTax: cleanStep1,
      lastSavedAt: nowIso,
    };

    const newCompletion = Math.max(
      existingMod[0]?.completionPercentage || 0,
      input.completionPercentage ?? 20
    );

    if (existingMod.length > 0) {
      await db
        .update(planModulesData)
        .set({
          structuredInputsJsonb: updatedJson,
          completionPercentage: newCompletion,
          updatedAt: new Date(),
        })
        .where(eq(planModulesData.id, existingMod[0].id));
    } else {
      await db.insert(planModulesData).values({
        planId: input.planId,
        moduleCode: 'MOD_J_FINANCE',
        structuredInputsJsonb: updatedJson,
        aiThingsToConsiderJsonb: [],
        completionPercentage: newCompletion,
      });
    }

    await db
      .update(startupPlans)
      .set({
        currentModuleStep: 'MOD_J_STEP_1_OVERHEADS_TAX',
        updatedAt: new Date(),
      })
      .where(eq(startupPlans.id, input.planId));

    return { ok: true, persistedToCloudSql: true };
  } catch (err: any) {
    console.warn(
      '[Module J Step 1 Action] Database save warning (local state preserved):',
      err?.message || err
    );
    return {
      ok: true,
      persistedToCloudSql: false,
      error: err?.message,
    };
  }
}

/**
 * Generates or calibrates Module J Step 1 Overheads & Localized Tax Compliance justification via AI Router.
 */
export async function generateModuleJOverheadsTaxAction(
  params: GenerateModuleJOverheadsTaxParams
): Promise<GenerateModuleJOverheadsTaxResult> {
  return generateModuleJOverheadsTaxViaRouter(params);
}

/**
 * Persists Module J Step 2 (Payment Timing, Working Capital & Seasonality) to `plan_modules_data`.
 */
export async function saveModuleJStep2WorkingCapitalAction(input: {
  planId: string;
  step2WorkingCapital: WorkingCapitalTimingStep2Data;
  completionPercentage?: number;
}): Promise<{ ok: boolean; persistedToCloudSql: boolean }> {
  return saveModuleJStepGenericAction({
    planId: input.planId,
    stepKey: 'step2WorkingCapital',
    stepPayload: input.step2WorkingCapital,
    currentModuleStepCode: 'MOD_J_STEP_2_WORKING_CAPITAL',
    completionPercentage: input.completionPercentage ?? 50,
  });
}

/**
 * Generates or calibrates Module J Step 2 Working Capital, Payment Timing & Seasonality justification via AI Router.
 */
export async function generateModuleJWorkingCapitalAction(
  params: GenerateModuleJWorkingCapitalParams
): Promise<GenerateModuleJWorkingCapitalResult> {
  return generateModuleJWorkingCapitalViaRouter(params);
}

/**
 * Persists Module J Step 3 (36-Month Cashflow Curve, Cash Trough & Grant Reimbursement Bridge) to `plan_modules_data`.
 */
export async function saveModuleJStep3CashflowGapAction(input: {
  planId: string;
  step3CashflowGap: CashflowFundingGapStep3Data;
  completionPercentage?: number;
}): Promise<{ ok: boolean; persistedToCloudSql: boolean }> {
  return saveModuleJStepGenericAction({
    planId: input.planId,
    stepKey: 'step3CashflowGap',
    stepPayload: input.step3CashflowGap,
    currentModuleStepCode: 'MOD_J_STEP_3_CASHFLOW_TROUGH',
    completionPercentage: input.completionPercentage ?? 75,
  });
}

/**
 * Generates or calibrates Module J Step 3 36-Month Cashflow Trough & Grant Reimbursement Bridge justification via AI Router.
 */
export async function generateModuleJCashflowFundingGapAction(
  params: GenerateModuleJCashflowFundingGapParams
): Promise<GenerateModuleJCashflowFundingGapResult> {
  return generateModuleJCashflowFundingGapViaRouter(params);
}

/**
 * Persists Module J Step 4 (Official 3-Year P&L, 36-Month Cashflow Table, Stress-Tester & IP Shield Placeholder) to `plan_modules_data`.
 */
export async function saveModuleJStep4StatementsAction(input: {
  planId: string;
  step4Statements: StatementsStressTestStep4Data;
  completionPercentage?: number;
}): Promise<{ ok: boolean; persistedToCloudSql: boolean }> {
  return saveModuleJStepGenericAction({
    planId: input.planId,
    stepKey: 'step4Statements',
    stepPayload: input.step4Statements,
    currentModuleStepCode: 'MOD_J_STEP_4_STATEMENTS_STRESS',
    completionPercentage: input.completionPercentage ?? 85,
  });
}

/**
 * Generates or calibrates Module J Step 4 Official 3-Year P&L, Cashflow & Sensitivity Stress-Test narrative via AI Router.
 */
export async function generateModuleJStatementsStressTestAction(
  params: GenerateModuleJStatementsStressTestParams
): Promise<GenerateModuleJStatementsStressTestResult> {
  return generateModuleJStatementsStressTestViaRouter(params);
}

/**
 * Persists Module J Step 5 (Executive Financial Overview Brief & Underwriter Blind-Spot Audit) to `plan_modules_data`.
 */
export async function saveModuleJStep5BriefAction(input: {
  planId: string;
  step5FinanceBrief: FinanceExecutiveBriefStep5Data;
  completionPercentage?: number;
}): Promise<{ ok: boolean; persistedToCloudSql: boolean }> {
  return saveModuleJStepGenericAction({
    planId: input.planId,
    stepKey: 'step5FinanceBrief',
    stepPayload: input.step5FinanceBrief,
    currentModuleStepCode: 'MOD_J_STEP_5_FINANCE_BRIEF',
    completionPercentage: input.completionPercentage ?? 100,
  });
}

/**
 * Generates or calibrates Module J Step 5 Executive Financial Overview Brief & Blind-Spot Audit via AI Router.
 */
export async function generateModuleJExecutiveBriefAction(
  params: GenerateModuleJExecutiveBriefParams
): Promise<GenerateModuleJExecutiveBriefResult> {
  return generateModuleJExecutiveBriefViaRouter(params);
}

/**
 * Persists an Open Question from any step of Module J into `open_questions_parking_lot`.
 */
export async function parkModuleJOpenQuestionAction(input: {
  planId: string;
  questionText: string;
  stepLabel?: string;
}): Promise<{ ok: boolean; persistedToCloudSql: boolean }> {
  const cleanText = input.questionText.trim();
  if (!cleanText || !UUID_REGEX.test(input.planId)) {
    return { ok: true, persistedToCloudSql: false };
  }

  try {
    const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId);
    if (!authCheck.authorized) {
      return { ok: true, persistedToCloudSql: false };
    }

    await ensureModuleJEnumInPostgres();

    await db.insert(openQuestionsParkingLot).values({
      planId: input.planId,
      sourceModule: 'MOD_J_FINANCE',
      questionText: input.stepLabel
        ? `[${input.stepLabel}] ${cleanText}`
        : cleanText,
      status: 'OPEN',
    });

    return { ok: true, persistedToCloudSql: true };
  } catch (err: any) {
    console.warn(
      '[Module J Open Question] Database warning:',
      err?.message || err
    );
    return { ok: true, persistedToCloudSql: false };
  }
}

/**
 * Pre-staged persistence helpers for Steps 2, 3, 4, and 5 of Module J.
 */
export async function saveModuleJStepGenericAction(input: {
  planId: string;
  stepKey:
    | 'step2WorkingCapital'
    | 'step3CashflowGap'
    | 'step4Statements'
    | 'step5FinanceBrief';
  stepPayload:
    | WorkingCapitalTimingStep2Data
    | CashflowFundingGapStep3Data
    | StatementsStressTestStep4Data
    | FinanceExecutiveBriefStep5Data;
  currentModuleStepCode: string;
  completionPercentage: number;
}): Promise<{ ok: boolean; persistedToCloudSql: boolean }> {
  if (!UUID_REGEX.test(input.planId)) {
    return { ok: true, persistedToCloudSql: false };
  }

  try {
    const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId);
    if (!authCheck.authorized) {
      return { ok: true, persistedToCloudSql: false };
    }

    await ensureModuleJEnumInPostgres();

    const existingMod = await db
      .select()
      .from(planModulesData)
      .where(
        and(
          eq(planModulesData.planId, input.planId),
          eq(planModulesData.moduleCode, 'MOD_J_FINANCE')
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

    const updatedJson: Record<string, unknown> = {
      ...currentJson,
      [input.stepKey]: {
        ...input.stepPayload,
        lastSavedAt: nowIso,
      },
      lastSavedAt: nowIso,
    };

    const newCompletion = Math.max(
      existingMod[0]?.completionPercentage || 0,
      input.completionPercentage
    );

    if (existingMod.length > 0) {
      await db
        .update(planModulesData)
        .set({
          structuredInputsJsonb: updatedJson,
          completionPercentage: newCompletion,
          updatedAt: new Date(),
        })
        .where(eq(planModulesData.id, existingMod[0].id));
    } else {
      await db.insert(planModulesData).values({
        planId: input.planId,
        moduleCode: 'MOD_J_FINANCE',
        structuredInputsJsonb: updatedJson,
        aiThingsToConsiderJsonb: [],
        completionPercentage: newCompletion,
      });
    }

    await db
      .update(startupPlans)
      .set({
        currentModuleStep: input.currentModuleStepCode,
        updatedAt: new Date(),
      })
      .where(eq(startupPlans.id, input.planId));

    return { ok: true, persistedToCloudSql: true };
  } catch {
    return { ok: true, persistedToCloudSql: false };
  }
}
