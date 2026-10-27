'use server';

import { and, eq, sql } from 'drizzle-orm';
import {
  db,
  startupPlans,
  planModulesData,
  openQuestionsParkingLot,
} from '@/db';
import type {
  ProductVehicleStep1Data,
  ChannelMatrixStep2Data,
  ScopeFilterItem,
  ScopeFilterStep3Data,
  ProductTrackType,
  ProductFormFactorType,
  SalesChannelOptionType,
  SavedModuleDData,
} from '@/lib/auth/session-store';
import type { SupportedCountryCode } from '@/lib/localization';
import { verifyActiveSessionAndPlanOwnership } from '@/lib/auth/server-auth';
import {
  generateModuleDProductVehicleViaRouter,
  generateModuleDChannelMatrixViaRouter,
  generateModuleDScopeFilterViaRouter,
  type ModuleDProductVehicleEstimateResult,
  type ModuleDChannelMatrixGenerationResult,
  type ModuleDScopeFilterGenerationResult,
} from '@/lib/ai/router';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let moduleDEnumEnsured = false;

async function ensureModuleDEnumInPostgres(): Promise<void> {
  if (moduleDEnumEnsured) return;
  try {
    await db.execute(
      sql`ALTER TYPE "public"."module_code" ADD VALUE IF NOT EXISTS 'MOD_D_PRODUCT_BUILD'`
    );
    moduleDEnumEnsured = true;
  } catch {
    // Non-fatal if enum value already exists
  }
}

/**
 * Persists Module D Step 1 (Product Vehicle, Adaptive Track & V1 Format)
 * to `plan_modules_data` (`MOD_D_PRODUCT_BUILD`).
 */
export async function saveModuleDStep1ProductVehicleAction(input: {
  planId: string;
  productVehicle: ProductVehicleStep1Data;
  completionPercentage?: number;
}): Promise<{ ok: boolean; persistedToCloudSql: boolean }> {
  if (!UUID_REGEX.test(input.planId)) {
    return { ok: true, persistedToCloudSql: false };
  }

  const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId);
  if (!authCheck.authorized) {
    return { ok: false, persistedToCloudSql: false };
  }

  try {
    await ensureModuleDEnumInPostgres();

    const existingMod = await db
      .select()
      .from(planModulesData)
      .where(
        and(
          eq(planModulesData.planId, input.planId),
          eq(planModulesData.moduleCode, 'MOD_D_PRODUCT_BUILD')
        )
      )
      .limit(1);

    const existingPayload = (existingMod[0]?.structuredInputsJsonb ??
      {}) as SavedModuleDData;

    const nowIso = new Date().toISOString();
    const updatedPayload: SavedModuleDData = {
      ...existingPayload,
      productVehicle: {
        ...input.productVehicle,
        lastSavedAt: nowIso,
      },
      lastSavedAt: nowIso,
    };

    const nextProgress = Math.max(
      existingMod[0]?.completionPercentage ?? 0,
      input.completionPercentage ?? 20
    );

    if (existingMod.length > 0) {
      await db
        .update(planModulesData)
        .set({
          structuredInputsJsonb: updatedPayload,
          completionPercentage: nextProgress,
          updatedAt: new Date(),
        })
        .where(eq(planModulesData.id, existingMod[0].id));
    } else {
      await db.insert(planModulesData).values({
        planId: input.planId,
        moduleCode: 'MOD_D_PRODUCT_BUILD',
        structuredInputsJsonb: updatedPayload,
        aiThingsToConsiderJsonb: [],
        completionPercentage: nextProgress,
      });
    }

    await db
      .update(startupPlans)
      .set({
        currentModuleStep: 'MOD_D_STEP_1',
        updatedAt: new Date(),
      })
      .where(eq(startupPlans.id, input.planId));

    return { ok: true, persistedToCloudSql: true };
  } catch (err) {
    console.warn(
      '[BMU Module D] Could not persist Step 1 Product Vehicle to Cloud SQL:',
      err instanceof Error ? err.message : err
    );
    return { ok: true, persistedToCloudSql: false };
  }
}

/**
 * Parks a product/technical question into `open_questions_parking_lot` under `MOD_D_PRODUCT_BUILD`.
 */
export async function parkModuleDOpenQuestionAction(input: {
  planId: string;
  questionText: string;
}): Promise<{ ok: boolean; persistedToCloudSql: boolean }> {
  if (!UUID_REGEX.test(input.planId) || !input.questionText.trim()) {
    return { ok: true, persistedToCloudSql: false };
  }

  const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId);
  if (!authCheck.authorized) {
    return { ok: false, persistedToCloudSql: false };
  }

  try {
    await ensureModuleDEnumInPostgres();
    await db.insert(openQuestionsParkingLot).values({
      planId: input.planId,
      sourceModule: 'MOD_D_PRODUCT_BUILD',
      questionText: input.questionText.trim().slice(0, 1000),
      status: 'OPEN',
    });
    return { ok: true, persistedToCloudSql: true };
  } catch {
    return { ok: true, persistedToCloudSql: false };
  }
}

/**
 * Calls the central AI router (`generateModuleDProductVehicleViaRouter`) to draft
 * a track-specific V1 'Aha! Moment' & Product Vehicle rationale.
 */
export async function generateModuleDProductVehicleWithAiAction(input: {
  planId?: string;
  planTitle: string;
  industryCategory: string;
  hqCountryCode: SupportedCountryCode;
  brainDumpText?: string;
  coreProblem?: string;
  targetCustomer?: string;
  proposedSolution?: string;
  unfairAdvantage?: string;
  beachheadSegment?: string;
  validatedPainSummary?: string;
  selectedTrack: ProductTrackType;
  otherProductTrackText?: string;
}): Promise<ModuleDProductVehicleEstimateResult> {
  return generateModuleDProductVehicleViaRouter(input);
}

/**
 * Persists Module D Step 2 (Own vs. Rent Channel & Fulfillment Matrix + Blended Fee %)
 * to `plan_modules_data` (`MOD_D_PRODUCT_BUILD`).
 */
export async function saveModuleDStep2ChannelMatrixAction(input: {
  planId: string;
  channelMatrix: ChannelMatrixStep2Data;
  completionPercentage?: number;
}): Promise<{ ok: boolean; persistedToCloudSql: boolean }> {
  if (!UUID_REGEX.test(input.planId)) {
    return { ok: true, persistedToCloudSql: false };
  }

  const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId);
  if (!authCheck.authorized) {
    return { ok: false, persistedToCloudSql: false };
  }

  try {
    await ensureModuleDEnumInPostgres();

    const existingMod = await db
      .select()
      .from(planModulesData)
      .where(
        and(
          eq(planModulesData.planId, input.planId),
          eq(planModulesData.moduleCode, 'MOD_D_PRODUCT_BUILD')
        )
      )
      .limit(1);

    const existingPayload = (existingMod[0]?.structuredInputsJsonb ??
      {}) as SavedModuleDData;

    const nowIso = new Date().toISOString();
    const updatedPayload: SavedModuleDData = {
      ...existingPayload,
      channelMatrix: {
        ...input.channelMatrix,
        lastSavedAt: nowIso,
      },
      lastSavedAt: nowIso,
    };

    const nextProgress = Math.max(
      existingMod[0]?.completionPercentage ?? 0,
      input.completionPercentage ?? 40
    );

    if (existingMod.length > 0) {
      await db
        .update(planModulesData)
        .set({
          structuredInputsJsonb: updatedPayload,
          completionPercentage: nextProgress,
          updatedAt: new Date(),
        })
        .where(eq(planModulesData.id, existingMod[0].id));
    } else {
      await db.insert(planModulesData).values({
        planId: input.planId,
        moduleCode: 'MOD_D_PRODUCT_BUILD',
        structuredInputsJsonb: updatedPayload,
        aiThingsToConsiderJsonb: [],
        completionPercentage: nextProgress,
      });
    }

    await db
      .update(startupPlans)
      .set({
        currentModuleStep: 'MOD_D_STEP_2',
        updatedAt: new Date(),
      })
      .where(eq(startupPlans.id, input.planId));

    return { ok: true, persistedToCloudSql: true };
  } catch (err) {
    console.warn(
      '[BMU Module D] Could not persist Step 2 Channel Matrix to Cloud SQL:',
      err instanceof Error ? err.message : err
    );
    return { ok: true, persistedToCloudSql: false };
  }
}

/**
 * Calls the central AI router (`generateModuleDChannelMatrixViaRouter`) to draft
 * a track-specific Own vs. Rent Channel & Fulfillment strategy.
 */
export async function generateModuleDChannelMatrixWithAiAction(input: {
  planId?: string;
  planTitle: string;
  industryCategory: string;
  hqCountryCode: SupportedCountryCode;
  selectedTrack: ProductTrackType;
  otherProductTrackText?: string;
  formFactor?: ProductFormFactorType;
  brainDumpText?: string;
  coreProblem?: string;
  targetCustomer?: string;
  proposedSolution?: string;
  beachheadSegment?: string;
}): Promise<ModuleDChannelMatrixGenerationResult> {
  return generateModuleDChannelMatrixViaRouter(input);
}

/**
 * Persists Module D Step 3 (Ruthless V1 Scope Filter: Day-1 Core vs. V1.5 Fast-Follow vs. V2 Icebox)
 * to `plan_modules_data` (`MOD_D_PRODUCT_BUILD`).
 */
export async function saveModuleDStep3ScopeFilterAction(input: {
  planId: string;
  scopeFilter: ScopeFilterStep3Data;
  completionPercentage?: number;
}): Promise<{ ok: boolean; persistedToCloudSql: boolean }> {
  if (!UUID_REGEX.test(input.planId)) {
    return { ok: true, persistedToCloudSql: false };
  }

  const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId);
  if (!authCheck.authorized) {
    return { ok: false, persistedToCloudSql: false };
  }

  try {
    await ensureModuleDEnumInPostgres();

    const existingMod = await db
      .select()
      .from(planModulesData)
      .where(
        and(
          eq(planModulesData.planId, input.planId),
          eq(planModulesData.moduleCode, 'MOD_D_PRODUCT_BUILD')
        )
      )
      .limit(1);

    const existingPayload = (existingMod[0]?.structuredInputsJsonb ??
      {}) as SavedModuleDData;

    const nowIso = new Date().toISOString();
    const updatedPayload: SavedModuleDData = {
      ...existingPayload,
      scopeFilter: {
        ...input.scopeFilter,
        lastSavedAt: nowIso,
      },
      lastSavedAt: nowIso,
    };

    const nextProgress = Math.max(
      existingMod[0]?.completionPercentage ?? 0,
      input.completionPercentage ?? 60
    );

    if (existingMod.length > 0) {
      await db
        .update(planModulesData)
        .set({
          structuredInputsJsonb: updatedPayload,
          completionPercentage: nextProgress,
          updatedAt: new Date(),
        })
        .where(eq(planModulesData.id, existingMod[0].id));
    } else {
      await db.insert(planModulesData).values({
        planId: input.planId,
        moduleCode: 'MOD_D_PRODUCT_BUILD',
        structuredInputsJsonb: updatedPayload,
        aiThingsToConsiderJsonb: [],
        completionPercentage: nextProgress,
      });
    }

    await db
      .update(startupPlans)
      .set({
        currentModuleStep: 'MOD_D_STEP_3',
        updatedAt: new Date(),
      })
      .where(eq(startupPlans.id, input.planId));

    return { ok: true, persistedToCloudSql: true };
  } catch (err) {
    console.warn(
      '[BMU Module D] Could not persist Step 3 Scope Filter to Cloud SQL:',
      err instanceof Error ? err.message : err
    );
    return { ok: true, persistedToCloudSql: false };
  }
}

/**
 * Calls the central AI router (`generateModuleDScopeFilterViaRouter`) to draft
 * a track-specific Ruthless V1 Scope Filter (Day-1 Core vs. V1.5 Fast-Follow vs. V2 Icebox).
 */
export async function generateModuleDScopeFilterWithAiAction(input: {
  planId?: string;
  planTitle: string;
  industryCategory: string;
  hqCountryCode: SupportedCountryCode;
  selectedTrack: ProductTrackType;
  otherProductTrackText?: string;
  formFactor?: ProductFormFactorType;
  primaryChannel?: SalesChannelOptionType;
  brainDumpText?: string;
  coreProblem?: string;
  targetCustomer?: string;
  proposedSolution?: string;
  beachheadSegment?: string;
  validatedPainSummary?: string;
  currentScopeItems?: ScopeFilterItem[];
}): Promise<ModuleDScopeFilterGenerationResult> {
  return generateModuleDScopeFilterViaRouter(input);
}


