'use server';

import { and, eq, sql } from 'drizzle-orm';
import {
  db,
  startupPlans,
  planModulesData,
  openQuestionsParkingLot,
  type BlindSpotItem,
} from '@/db';
import type {
  BrandPositioningStep1Data,
  Modern4PsStep2Data,
  First10PlaybookStep3Data,
  MarketingBudgetStep4Data,
  MarketingExecutiveBriefStep5Data,
  SavedModuleIData,
} from '@/lib/auth/session-store';
import { verifyActiveSessionAndPlanOwnership } from '@/lib/auth/server-auth';
import type { SupportedCountryCode } from '@/lib/localization';
import {
  generateModuleIPositioningViaRouter,
  type GenerateModuleIPositioningResult,
  type GenerateModuleIPositioningParams,
  generateModuleIFourPsViaRouter,
  type GenerateModuleIFourPsResult,
  type GenerateModuleIFourPsParams,
  generateModuleIFirst10ViaRouter,
  type GenerateModuleIFirst10Result,
  type GenerateModuleIFirst10Params,
  generateModuleIObjectionBustersViaRouter,
  type GenerateModuleIObjectionBustersResult,
  type GenerateModuleIObjectionBustersParams,
  generateModuleIBudgetViaRouter,
  type GenerateModuleIBudgetResult,
  type GenerateModuleIBudgetParams,
  generateModuleIMarketingBriefViaRouter,
  type GenerateModuleIMarketingBriefResult,
  type GenerateModuleIMarketingBriefParams,
  generateLetterOfIntentMarkdown,
} from '@/lib/ai/router';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let moduleIEnumEnsured = false;

async function ensureModuleIEnumInPostgres(): Promise<void> {
  if (moduleIEnumEnsured) return;
  try {
    await db.execute(
      sql`ALTER TYPE "public"."module_code" ADD VALUE IF NOT EXISTS 'MOD_I_MARKETING'`
    );
    moduleIEnumEnsured = true;
  } catch {
    // Non-fatal if enum value already exists
  }
}

/**
 * Persists Module I Step 1 (Brand Positioning, Value Proposition & 3-Second Hook) to `plan_modules_data`.
 */
export async function saveModuleIStep1PositioningAction(input: {
  planId: string;
  positioning: BrandPositioningStep1Data;
  completionPercentage?: number;
}): Promise<{ ok: boolean; persistedToCloudSql: boolean; error?: string }> {
  if (!UUID_REGEX.test(input.planId)) {
    return { ok: true, persistedToCloudSql: false };
  }

  try {
    const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId);
    if (!authCheck.authorized) {
      // Local preview or unauthenticated session — allow client-side state to continue smoothly
      return { ok: true, persistedToCloudSql: false };
    }

    await ensureModuleIEnumInPostgres();

    const existingMod = await db
      .select()
      .from(planModulesData)
      .where(
        and(
          eq(planModulesData.planId, input.planId),
          eq(planModulesData.moduleCode, 'MOD_I_MARKETING')
        )
      )
      .limit(1);

    const nowIso = new Date().toISOString();
    const cleanStep1: BrandPositioningStep1Data = {
      ...input.positioning,
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
      step1Positioning: cleanStep1,
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
        .where(
          and(
            eq(planModulesData.planId, input.planId),
            eq(planModulesData.moduleCode, 'MOD_I_MARKETING')
          )
        );
    } else {
      await db.insert(planModulesData).values({
        planId: input.planId,
        moduleCode: 'MOD_I_MARKETING',
        structuredInputsJsonb: updatedJson,
        completionPercentage: newCompletion,
        aiThingsToConsiderJsonb: [],
        updatedAt: new Date(),
      });
    }

    // Touch startupPlans currentModuleStep and updatedAt
    await db
      .update(startupPlans)
      .set({
        currentModuleStep: 'MOD_I_STEP_1',
        updatedAt: new Date(),
      })
      .where(eq(startupPlans.id, input.planId));

    return { ok: true, persistedToCloudSql: true };
  } catch (err: any) {
    console.error('Error saving Module I Step 1 to PostgreSQL:', err);
    // Non-fatal fallback for offline or unmigrated environments
    return { ok: true, persistedToCloudSql: false, error: err?.message };
  }
}

/**
 * AI Generator for Module I Step 1 (Brand Positioning & 3-Second Hook).
 */
export async function generateModuleIPositioningAction(params: {
  planId?: string;
  planTitle?: string;
  industryCategory?: string;
  hqCountryCode?: SupportedCountryCode;
  oneLinerSummary?: string;
  problemStatement?: string;
  solutionStatement?: string;
  uvpStatement?: string;
  targetCustomer?: string;
  beachheadPersona?: string;
  competitiveWedge?: string;
  preferredTone?: string;
}): Promise<GenerateModuleIPositioningResult> {
  // If planId provided, attempt optional DB verification without blocking fallback synthesis
  if (params.planId && UUID_REGEX.test(params.planId)) {
    try {
      await verifyActiveSessionAndPlanOwnership(params.planId);
    } catch {
      // Continue to router for graceful synthesis/fallback
    }
  }

  return generateModuleIPositioningViaRouter(params);
}

/**
 * Persists Module I Step 2 (Modern 4Ps Strategy & Channel Distribution Matrix) to `plan_modules_data`.
 */
export async function saveModuleIStep2FourPsAction(input: {
  planId: string;
  fourPs: Modern4PsStep2Data;
  completionPercentage?: number;
}): Promise<{ ok: boolean; persistedToCloudSql: boolean; error?: string }> {
  if (!UUID_REGEX.test(input.planId)) {
    return { ok: true, persistedToCloudSql: false };
  }

  try {
    const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId);
    if (!authCheck.authorized) {
      // Local preview or unauthenticated session
      return { ok: true, persistedToCloudSql: false };
    }

    await ensureModuleIEnumInPostgres();

    const existingMod = await db
      .select()
      .from(planModulesData)
      .where(
        and(
          eq(planModulesData.planId, input.planId),
          eq(planModulesData.moduleCode, 'MOD_I_MARKETING')
        )
      )
      .limit(1);

    const nowIso = new Date().toISOString();
    const cleanStep2: Modern4PsStep2Data = {
      ...input.fourPs,
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
      step2FourPs: cleanStep2,
      lastSavedAt: nowIso,
    };

    const newCompletion = Math.max(
      existingMod[0]?.completionPercentage || 0,
      input.completionPercentage ?? 45
    );

    if (existingMod.length > 0) {
      await db
        .update(planModulesData)
        .set({
          structuredInputsJsonb: updatedJson,
          completionPercentage: newCompletion,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(planModulesData.planId, input.planId),
            eq(planModulesData.moduleCode, 'MOD_I_MARKETING')
          )
        );
    } else {
      await db.insert(planModulesData).values({
        planId: input.planId,
        moduleCode: 'MOD_I_MARKETING',
        structuredInputsJsonb: updatedJson,
        completionPercentage: newCompletion,
        aiThingsToConsiderJsonb: [],
        updatedAt: new Date(),
      });
    }

    // Touch startupPlans currentModuleStep and updatedAt
    await db
      .update(startupPlans)
      .set({
        currentModuleStep: 'MOD_I_STEP_2',
        updatedAt: new Date(),
      })
      .where(eq(startupPlans.id, input.planId));

    return { ok: true, persistedToCloudSql: true };
  } catch (err: any) {
    console.error('Error saving Module I Step 2 to PostgreSQL:', err);
    return { ok: true, persistedToCloudSql: false, error: err?.message };
  }
}

/**
 * AI Generator for Module I Step 2 (The Modern 4Ps Strategy & Channel Distribution Matrix).
 */
export async function generateModuleIFourPsAction(
  params: GenerateModuleIFourPsParams & { planId?: string }
): Promise<GenerateModuleIFourPsResult> {
  if (params.planId && UUID_REGEX.test(params.planId)) {
    try {
      await verifyActiveSessionAndPlanOwnership(params.planId);
    } catch {
      // Continue to router for graceful synthesis/fallback
    }
  }

  return generateModuleIFourPsViaRouter(params);
}

/**
 * Persists Module I Step 3 (First 10 Customers Playbook, Pilot Offer & LOI) to `plan_modules_data`.
 */
export async function saveModuleIStep3First10Action(input: {
  planId: string;
  first10: First10PlaybookStep3Data;
  completionPercentage?: number;
}): Promise<{ ok: boolean; persistedToCloudSql: boolean; error?: string }> {
  if (!UUID_REGEX.test(input.planId)) {
    return { ok: true, persistedToCloudSql: false };
  }

  try {
    const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId);
    if (!authCheck.authorized) {
      return { ok: false, persistedToCloudSql: false, error: 'Unauthorized' };
    }

    await ensureModuleIEnumInPostgres();

    const existingMod = await db
      .select({
        id: planModulesData.id,
        structuredInputsJsonb: planModulesData.structuredInputsJsonb,
        completionPercentage: planModulesData.completionPercentage,
      })
      .from(planModulesData)
      .where(
        and(
          eq(planModulesData.planId, input.planId),
          eq(planModulesData.moduleCode, 'MOD_I_MARKETING')
        )
      )
      .limit(1);

    const nowIso = new Date().toISOString();
    const cleanStep3: First10PlaybookStep3Data = {
      ...input.first10,
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
      step3First10: cleanStep3,
      lastSavedAt: nowIso,
    };

    const newCompletion = Math.max(
      existingMod[0]?.completionPercentage || 0,
      input.completionPercentage ?? 65
    );

    if (existingMod.length > 0) {
      await db
        .update(planModulesData)
        .set({
          structuredInputsJsonb: updatedJson,
          completionPercentage: newCompletion,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(planModulesData.planId, input.planId),
            eq(planModulesData.moduleCode, 'MOD_I_MARKETING')
          )
        );
    } else {
      await db.insert(planModulesData).values({
        planId: input.planId,
        moduleCode: 'MOD_I_MARKETING',
        structuredInputsJsonb: updatedJson,
        completionPercentage: newCompletion,
        aiThingsToConsiderJsonb: [],
        updatedAt: new Date(),
      });
    }

    // Touch startupPlans currentModuleStep and updatedAt
    await db
      .update(startupPlans)
      .set({
        currentModuleStep: 'MOD_I_STEP_3',
        updatedAt: new Date(),
      })
      .where(eq(startupPlans.id, input.planId));

    return { ok: true, persistedToCloudSql: true };
  } catch (err: any) {
    console.error('Error saving Module I Step 3 to PostgreSQL:', err);
    return { ok: true, persistedToCloudSql: false, error: err?.message };
  }
}

/**
 * AI Generator for Module I Step 3 (First 10 Customers Playbook, Outreach Scripts & LOI).
 */
export async function generateModuleIFirst10Action(
  params: GenerateModuleIFirst10Params & { planId?: string }
): Promise<GenerateModuleIFirst10Result> {
  if (params.planId && UUID_REGEX.test(params.planId)) {
    try {
      await verifyActiveSessionAndPlanOwnership(params.planId);
    } catch {
      // Continue to router for graceful synthesis/fallback
    }
  }

  return generateModuleIFirst10ViaRouter(params);
}

/**
 * AI Generator for Module I Step 3 Section 3.6 (Top 3 Early-Stage Objection Busters & Rebuttals).
 */
export async function generateModuleIObjectionBustersAction(
  params: GenerateModuleIObjectionBustersParams & { planId?: string }
): Promise<GenerateModuleIObjectionBustersResult> {
  if (params.planId && UUID_REGEX.test(params.planId)) {
    try {
      await verifyActiveSessionAndPlanOwnership(params.planId);
    } catch {
      // Continue to router for graceful synthesis/fallback
    }
  }

  return generateModuleIObjectionBustersViaRouter(params);
}

/**
 * Persists Module I Step 4 (Reverse-Engineered Marketing Budget & CAC Calculator) to `plan_modules_data`.
 */
export async function saveModuleIStep4BudgetAction(input: {
  planId: string;
  budget: MarketingBudgetStep4Data;
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

    await ensureModuleIEnumInPostgres();

    const existingMod = await db
      .select()
      .from(planModulesData)
      .where(
        and(
          eq(planModulesData.planId, input.planId),
          eq(planModulesData.moduleCode, 'MOD_I_MARKETING')
        )
      )
      .limit(1);

    const nowIso = new Date().toISOString();
    const cleanStep4: MarketingBudgetStep4Data = {
      ...input.budget,
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
      step4Budget: cleanStep4,
      lastSavedAt: nowIso,
    };

    const newCompletion = Math.max(
      existingMod[0]?.completionPercentage || 0,
      input.completionPercentage ?? 90
    );

    if (existingMod.length > 0) {
      await db
        .update(planModulesData)
        .set({
          structuredInputsJsonb: updatedJson,
          completionPercentage: newCompletion,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(planModulesData.planId, input.planId),
            eq(planModulesData.moduleCode, 'MOD_I_MARKETING')
          )
        );
    } else {
      await db.insert(planModulesData).values({
        planId: input.planId,
        moduleCode: 'MOD_I_MARKETING',
        structuredInputsJsonb: updatedJson,
        completionPercentage: newCompletion,
        aiThingsToConsiderJsonb: [],
        updatedAt: new Date(),
      });
    }

    await db
      .update(startupPlans)
      .set({
        currentModuleStep: 'MOD_I_STEP_4',
        updatedAt: new Date(),
      })
      .where(eq(startupPlans.id, input.planId));

    return { ok: true, persistedToCloudSql: true };
  } catch (err: any) {
    console.error('Error saving Module I Step 4 to PostgreSQL:', err);
    return { ok: true, persistedToCloudSql: false, error: err?.message };
  }
}

/**
 * AI Generator for Module I Step 4 (Reverse-Engineered Marketing Budget, CAC & Funnel Reality Calculator).
 */
export async function generateModuleIBudgetAction(
  params: GenerateModuleIBudgetParams & { planId?: string }
): Promise<GenerateModuleIBudgetResult> {
  if (params.planId && UUID_REGEX.test(params.planId)) {
    try {
      await verifyActiveSessionAndPlanOwnership(params.planId);
    } catch {
      // Continue to router for graceful synthesis/fallback
    }
  }

  return generateModuleIBudgetViaRouter(params);
}

// Note: pure synchronous markdown helper is exported from @/lib/export/loi-document for client components
// so it is not wrapped in a Server Action Promise.

/**
 * Persists Module I Step 5 (Marketing & Customer Acquisition Executive Brief) to `plan_modules_data`.
 */
export async function saveModuleIStep5BriefAction(input: {
  planId: string;
  brief: MarketingExecutiveBriefStep5Data;
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

    await ensureModuleIEnumInPostgres();

    const existingMod = await db
      .select()
      .from(planModulesData)
      .where(
        and(
          eq(planModulesData.planId, input.planId),
          eq(planModulesData.moduleCode, 'MOD_I_MARKETING')
        )
      )
      .limit(1);

    const nowIso = new Date().toISOString();
    const cleanStep5: MarketingExecutiveBriefStep5Data = {
      ...input.brief,
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
      step5MarketingBrief: cleanStep5,
      thingsToConsider: cleanStep5.blindSpots,
      lastSavedAt: nowIso,
    };

    const completion =
      typeof input.completionPercentage === 'number'
        ? input.completionPercentage
        : 100;

    if (existingMod.length > 0) {
      await db
        .update(planModulesData)
        .set({
          structuredInputsJsonb: updatedJson,
          completionPercentage: completion,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(planModulesData.planId, input.planId),
            eq(planModulesData.moduleCode, 'MOD_I_MARKETING')
          )
        );
    } else {
      await db.insert(planModulesData).values({
        planId: input.planId,
        moduleCode: 'MOD_I_MARKETING',
        completionPercentage: completion,
        structuredInputsJsonb: updatedJson,
      });
    }

    return { ok: true, persistedToCloudSql: true };
  } catch (err: any) {
    console.error('Error saving Module I Step 5 to PostgreSQL:', err);
    return { ok: true, persistedToCloudSql: false, error: err?.message };
  }
}

/**
 * AI Generator for Module I Step 5 Executive Marketing Brief & Blind-Spot Review.
 */
export async function generateModuleIMarketingBriefAction(
  params: GenerateModuleIMarketingBriefParams
): Promise<GenerateModuleIMarketingBriefResult> {
  if (params.planId && UUID_REGEX.test(params.planId)) {
    try {
      await verifyActiveSessionAndPlanOwnership(params.planId);
    } catch {
      // Continue to router
    }
  }

  return generateModuleIMarketingBriefViaRouter(params);
}

/**
 * Parks an unresolved open question from Module I into the Open Questions Parking Lot.
 */
export async function parkModuleIOpenQuestionAction(input: {
  planId: string;
  questionText: string;
}): Promise<{ ok: boolean; questionId?: string; error?: string }> {
  if (!UUID_REGEX.test(input.planId)) {
    return { ok: true, questionId: `mock-${Date.now()}` };
  }

  try {
    const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId);
    if (!authCheck.authorized) {
      return { ok: true, questionId: `local-${Date.now()}` };
    }

    await ensureModuleIEnumInPostgres();

    const [inserted] = await db
      .insert(openQuestionsParkingLot)
      .values({
        planId: input.planId,
        sourceModule: 'MOD_I_MARKETING',
        questionText: input.questionText.trim(),
        status: 'OPEN',
      })
      .returning({ id: openQuestionsParkingLot.id });

    return { ok: true, questionId: inserted?.id };
  } catch (err: any) {
    console.error('Error parking open question for Module I:', err);
    return { ok: true, questionId: `fallback-${Date.now()}` };
  }
}
