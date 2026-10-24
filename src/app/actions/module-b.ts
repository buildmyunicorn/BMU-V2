'use server';

import { and, eq } from 'drizzle-orm';
import {
  db,
  startupPlans,
  planModulesData,
  openQuestionsParkingLot,
} from '@/db';
import type {
  BeachheadMarketData,
  CompetitorsAndStatusQuoData,
  BuyerModelType,
  SavedModuleBData,
} from '@/lib/auth/session-store';
import type { SupportedCountryCode } from '@/lib/localization';
import {
  scoutModuleBCompetitorsViaRouter,
  type ModuleBMarketScoutResult,
} from '@/lib/ai/router';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Persists Module B Step 1 (Beachhead Market & Target Selling Geographies)
 * to `plan_modules_data` (MOD_B_MARKET) and updates `startup_plans.target_markets_array`.
 */
export async function saveModuleBStep1BeachheadAction(input: {
  planId: string;
  beachhead: BeachheadMarketData;
  completionPercentage?: number;
}): Promise<{ ok: boolean; persistedToCloudSql: boolean }> {
  if (!UUID_REGEX.test(input.planId)) {
    return { ok: true, persistedToCloudSql: false };
  }

  try {
    const existingMod = await db
      .select()
      .from(planModulesData)
      .where(
        and(
          eq(planModulesData.planId, input.planId),
          eq(planModulesData.moduleCode, 'MOD_B_MARKET')
        )
      )
      .limit(1);

    const existingPayload = (existingMod[0]?.structuredInputsJsonb ??
      {}) as SavedModuleBData;

    const updatedPayload: SavedModuleBData = {
      ...existingPayload,
      beachhead: {
        ...input.beachhead,
        lastSavedAt: new Date().toISOString(),
      },
    };

    const nextProgress = Math.max(
      existingMod[0]?.completionPercentage ?? 0,
      input.completionPercentage ?? 25
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
        moduleCode: 'MOD_B_MARKET',
        structuredInputsJsonb: updatedPayload,
        aiThingsToConsiderJsonb: [],
        completionPercentage: nextProgress,
      });
    }

    await db
      .update(startupPlans)
      .set({
        targetMarketsArray:
          input.beachhead.targetMarketsArray.length > 0
            ? input.beachhead.targetMarketsArray
            : ['IE'],
        currentModuleStep: 'MOD_B_STEP_1',
        updatedAt: new Date(),
      })
      .where(eq(startupPlans.id, input.planId));

    return { ok: true, persistedToCloudSql: true };
  } catch (err) {
    console.warn(
      '[BMU Module B] Could not persist Step 1 Beachhead to Cloud SQL:',
      err instanceof Error ? err.message : err
    );
    return { ok: true, persistedToCloudSql: false };
  }
}

/**
 * Parks a market research question into `open_questions_parking_lot` under `MOD_B_MARKET`.
 */
export async function parkModuleBOpenQuestionAction(input: {
  planId: string;
  questionText: string;
}): Promise<{ ok: boolean; persistedToCloudSql: boolean }> {
  if (!UUID_REGEX.test(input.planId) || !input.questionText.trim()) {
    return { ok: true, persistedToCloudSql: false };
  }

  try {
    await db.insert(openQuestionsParkingLot).values({
      planId: input.planId,
      sourceModule: 'MOD_B_MARKET',
      questionText: input.questionText.trim(),
      status: 'OPEN',
    });
    return { ok: true, persistedToCloudSql: true };
  } catch {
    return { ok: true, persistedToCloudSql: false };
  }
}

/**
 * Persists Module B Step 2 (Competitors & How Customers Deal With This Today)
 * to `plan_modules_data` (MOD_B_MARKET).
 */
export async function saveModuleBStep2CompetitorsAction(input: {
  planId: string;
  competitorsAndStatusQuo: CompetitorsAndStatusQuoData;
  completionPercentage?: number;
}): Promise<{ ok: boolean; persistedToCloudSql: boolean }> {
  if (!UUID_REGEX.test(input.planId)) {
    return { ok: true, persistedToCloudSql: false };
  }

  try {
    const existingMod = await db
      .select()
      .from(planModulesData)
      .where(
        and(
          eq(planModulesData.planId, input.planId),
          eq(planModulesData.moduleCode, 'MOD_B_MARKET')
        )
      )
      .limit(1);

    const existingPayload = (existingMod[0]?.structuredInputsJsonb ??
      {}) as SavedModuleBData;

    const updatedPayload: SavedModuleBData = {
      ...existingPayload,
      competitorsAndStatusQuo: {
        ...input.competitorsAndStatusQuo,
        lastSavedAt: new Date().toISOString(),
      },
    };

    const nextProgress = Math.max(
      existingMod[0]?.completionPercentage ?? 0,
      input.completionPercentage ?? 45
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
        moduleCode: 'MOD_B_MARKET',
        structuredInputsJsonb: updatedPayload,
        aiThingsToConsiderJsonb: [],
        completionPercentage: nextProgress,
      });
    }

    await db
      .update(startupPlans)
      .set({
        currentModuleStep: 'MOD_B_STEP_2',
        updatedAt: new Date(),
      })
      .where(eq(startupPlans.id, input.planId));

    return { ok: true, persistedToCloudSql: true };
  } catch (err) {
    console.warn(
      '[BMU Module B] Could not persist Step 2 Competitors to Cloud SQL:',
      err instanceof Error ? err.message : err
    );
    return { ok: true, persistedToCloudSql: false };
  }
}

/**
 * Calls the central AI router (`scoutModuleBCompetitorsViaRouter`) to find 3 realistic
 * competitors or alternatives in the founder's target selling countries.
 */
export async function scoutModuleBCompetitorsWithAiAction(input: {
  userId?: string;
  planId?: string;
  planTitle: string;
  brainDumpText?: string;
  coreProblem?: string;
  proposedSolution?: string;
  targetCustomerDescription?: string;
  industryCategory: string;
  hqCountryCode: SupportedCountryCode;
  targetMarketsArray: string[];
  buyerTypes?: BuyerModelType[];
}): Promise<ModuleBMarketScoutResult> {
  return scoutModuleBCompetitorsViaRouter(input);
}
