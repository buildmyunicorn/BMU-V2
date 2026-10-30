'use server';

import { and, eq } from 'drizzle-orm';
import {
  db,
  startupPlans,
  planModulesData,
  openQuestionsParkingLot,
  type BlindSpotItem,
} from '@/db';
import {
  getServerSessionCookie,
  verifyActiveSessionAndPlanOwnership,
} from '@/lib/auth/server-auth';
import {
  synthesizeModuleAConceptCanvasViaRouter,
  synthesizeModuleAGrantPositioningViaRouter,
  type ConceptCanvasBlocks,
} from '@/lib/ai/router';
import type { SupportedCountryCode } from '@/lib/localization';
import type {
  SavedFounderMotivation,
  SavedTeamAndBudget,
  SavedFounderRealityCheck,
  SavedGrantEligibilityCheck,
} from '@/lib/auth/session-store';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateModuleAConceptCanvasAction(input: {
  userId?: string;
  planId: string;
  planTitle: string;
  brainDumpText: string;
  industryCategory: string;
  hqCountryCode: SupportedCountryCode;
  exportPotential: 'DOMESTIC_ONLY' | 'EXPORTING_INTERNATIONALLY';
  draftCanvas?: Partial<ConceptCanvasBlocks>;
  founderMotivation?: SavedFounderMotivation;
  teamAndBudget?: SavedTeamAndBudget;
  founderRealityCheck?: SavedFounderRealityCheck;
}): Promise<{
  ok: boolean;
  error?: string;
  persistedToCloudSql: boolean;
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
  canvas: ConceptCanvasBlocks;
  thingsToConsider: BlindSpotItem[];
  creditsUsedAfter?: number;
}> {
  const cookieUser = await getServerSessionCookie();
  const effectiveUserId = cookieUser?.userId || input.userId;

  const aiResult = await synthesizeModuleAConceptCanvasViaRouter({
    userId: effectiveUserId,
    planId: input.planId,
    planTitle: input.planTitle,
    brainDumpText: input.brainDumpText,
    industryCategory: input.industryCategory,
    hqCountryCode: input.hqCountryCode,
    exportPotential: input.exportPotential,
    draftCanvas: input.draftCanvas,
    founderMotivation: input.founderMotivation,
    teamAndBudget: input.teamAndBudget,
    founderRealityCheck: input.founderRealityCheck,
  });

  if (!aiResult.allowed) {
    return {
      ok: false,
      error: aiResult.reason || 'Monthly AI credit limit reached.',
      persistedToCloudSql: false,
      engineMode: aiResult.engineMode,
      canvas: aiResult.canvas,
      thingsToConsider: aiResult.thingsToConsider,
      creditsUsedAfter: aiResult.creditsUsedAfter,
    };
  }

  let persistedToCloudSql = false;

  if (UUID_REGEX.test(input.planId)) {
    const ownership = await verifyActiveSessionAndPlanOwnership(input.planId);
    if (!ownership.authorized) {
      return {
        ok: true,
        persistedToCloudSql: false,
        engineMode: aiResult.engineMode,
        canvas: aiResult.canvas,
        thingsToConsider: aiResult.thingsToConsider,
        creditsUsedAfter: aiResult.creditsUsedAfter,
      };
    }

    try {
      const existingMod = await db
        .select()
        .from(planModulesData)
        .where(
          and(
            eq(planModulesData.planId, input.planId),
            eq(planModulesData.moduleCode, 'MOD_A_IDEATION')
          )
        )
        .limit(1);

      const structuredPayload = {
        brainDumpText: input.brainDumpText,
        exportPotential: input.exportPotential,
        conceptCanvas: aiResult.canvas,
        founderMotivation: input.founderMotivation,
        teamAndBudget: input.teamAndBudget,
        founderRealityCheck: input.founderRealityCheck,
      };

      if (existingMod.length > 0) {
        await db
          .update(planModulesData)
          .set({
            structuredInputsJsonb: structuredPayload,
            aiThingsToConsiderJsonb: aiResult.thingsToConsider,
            completionPercentage: 75,
            updatedAt: new Date(),
          })
          .where(eq(planModulesData.id, existingMod[0].id));
      } else {
        await db.insert(planModulesData).values({
          planId: input.planId,
          moduleCode: 'MOD_A_IDEATION',
          structuredInputsJsonb: structuredPayload,
          aiThingsToConsiderJsonb: aiResult.thingsToConsider,
          completionPercentage: 75,
        });
      }

      await db
        .update(startupPlans)
        .set({
          currentModuleStep: 'MOD_A_STEP_2',
          updatedAt: new Date(),
        })
        .where(eq(startupPlans.id, input.planId));

      persistedToCloudSql = true;
    } catch (err) {
      console.warn(
        '[SPF Module A] Could not persist Concept Canvas to Cloud SQL:',
        err instanceof Error ? err.message : err
      );
    }
  }

  return {
    ok: true,
    persistedToCloudSql,
    engineMode: aiResult.engineMode,
    canvas: aiResult.canvas,
    thingsToConsider: aiResult.thingsToConsider,
    creditsUsedAfter: aiResult.creditsUsedAfter,
  };
}

/**
 * Saves manual founder edits to the 5 Concept Canvas cards and raw brain dump into Cloud SQL.
 */
export async function saveModuleACanvasEditsAction(input: {
  planId: string;
  brainDumpText: string;
  exportPotential: 'DOMESTIC_ONLY' | 'EXPORTING_INTERNATIONALLY';
  canvas: ConceptCanvasBlocks;
  founderMotivation?: SavedFounderMotivation;
  teamAndBudget?: SavedTeamAndBudget;
  founderRealityCheck?: SavedFounderRealityCheck;
  grantEligibilityCheck?: SavedGrantEligibilityCheck;
  thingsToConsider?: BlindSpotItem[];
}): Promise<{ ok: boolean; persistedToCloudSql: boolean }> {
  if (!UUID_REGEX.test(input.planId)) {
    return { ok: true, persistedToCloudSql: false };
  }

  const ownership = await verifyActiveSessionAndPlanOwnership(input.planId);
  if (!ownership.authorized) {
    return { ok: false, persistedToCloudSql: false };
  }

  try {
    const existingMod = await db
      .select()
      .from(planModulesData)
      .where(
        and(
          eq(planModulesData.planId, input.planId),
          eq(planModulesData.moduleCode, 'MOD_A_IDEATION')
        )
      )
      .limit(1);

    const prevInputs = (existingMod[0]?.structuredInputsJsonb ?? {}) as {
      grantEligibilityCheck?: SavedGrantEligibilityCheck;
    };

    const structuredPayload = {
      brainDumpText: input.brainDumpText,
      exportPotential: input.exportPotential,
      conceptCanvas: {
        ...input.canvas,
        lastSynthesizedAt: new Date().toISOString(),
      },
      founderMotivation: input.founderMotivation,
      teamAndBudget: input.teamAndBudget,
      founderRealityCheck: input.founderRealityCheck,
      grantEligibilityCheck:
        input.grantEligibilityCheck ?? prevInputs.grantEligibilityCheck,
    };

    if (existingMod.length > 0) {
      await db
        .update(planModulesData)
        .set({
          structuredInputsJsonb: structuredPayload,
          ...(input.thingsToConsider
            ? { aiThingsToConsiderJsonb: input.thingsToConsider }
            : {}),
          updatedAt: new Date(),
        })
        .where(eq(planModulesData.id, existingMod[0].id));
    } else {
      await db.insert(planModulesData).values({
        planId: input.planId,
        moduleCode: 'MOD_A_IDEATION',
        structuredInputsJsonb: structuredPayload,
        aiThingsToConsiderJsonb: input.thingsToConsider ?? [],
        completionPercentage: 75,
      });
    }

    return { ok: true, persistedToCloudSql: true };
  } catch {
    return { ok: true, persistedToCloudSql: false };
  }
}

/**
 * Runs the AI Grant Positioning Advisor for Module A Step 8 (IE & UK) and persists
 * the founder's Step 8 micro-question answers + AI advice into Cloud SQL.
 */
export async function generateModuleAGrantPositioningAdviceAction(input: {
  userId?: string;
  planId: string;
  planTitle: string;
  brainDumpText: string;
  industryCategory: string;
  hqCountryCode: SupportedCountryCode;
  exportPotential: 'DOMESTIC_ONLY' | 'EXPORTING_INTERNATIONALLY';
  canvas: ConceptCanvasBlocks;
  founderMotivation?: SavedFounderMotivation;
  teamAndBudget?: SavedTeamAndBudget;
  founderRealityCheck?: SavedFounderRealityCheck;
  grantCheck: SavedGrantEligibilityCheck;
}): Promise<{
  ok: boolean;
  error?: string;
  persistedToCloudSql: boolean;
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
  positioningTips: string[];
  updatedRevenueAndGrantFit: string;
  creditsUsedAfter?: number;
}> {
  const cookieUser = await getServerSessionCookie();
  const effectiveUserId = cookieUser?.userId || input.userId;

  const aiResult = await synthesizeModuleAGrantPositioningViaRouter({
    userId: effectiveUserId,
    planId: input.planId,
    planTitle: input.planTitle,
    brainDumpText: input.brainDumpText,
    industryCategory: input.industryCategory,
    hqCountryCode: input.hqCountryCode,
    exportPotential: input.exportPotential,
    conceptCanvas: input.canvas,
    founderMotivation: input.founderMotivation,
    teamAndBudget: input.teamAndBudget,
    founderRealityCheck: input.founderRealityCheck,
    grantCheck: input.grantCheck,
  });

  if (!aiResult.allowed) {
    return {
      ok: false,
      error: aiResult.reason || 'Monthly AI credit limit reached.',
      persistedToCloudSql: false,
      engineMode: aiResult.engineMode,
      positioningTips: aiResult.positioningTips,
      updatedRevenueAndGrantFit: aiResult.updatedRevenueAndGrantFit,
      creditsUsedAfter: aiResult.creditsUsedAfter,
    };
  }

  let persistedToCloudSql = false;

  if (UUID_REGEX.test(input.planId)) {
    const ownership = await verifyActiveSessionAndPlanOwnership(input.planId);
    if (ownership.authorized) {
      try {
        const existingMod = await db
          .select()
          .from(planModulesData)
          .where(
            and(
              eq(planModulesData.planId, input.planId),
              eq(planModulesData.moduleCode, 'MOD_A_IDEATION')
            )
          )
          .limit(1);

        const updatedGrantCheck: SavedGrantEligibilityCheck = {
          ...input.grantCheck,
          aiGrantPositioningAdvice: aiResult.positioningTips,
          aiEngineUsed: aiResult.engineMode,
          lastCheckedAt: new Date().toISOString(),
        };

        const structuredPayload = {
          brainDumpText: input.brainDumpText,
          exportPotential: input.exportPotential,
          conceptCanvas: {
            ...input.canvas,
            revenueAndGrantFit:
              aiResult.updatedRevenueAndGrantFit ||
              input.canvas.revenueAndGrantFit,
            lastSynthesizedAt: new Date().toISOString(),
          },
          founderMotivation: input.founderMotivation,
          teamAndBudget: input.teamAndBudget,
          founderRealityCheck: input.founderRealityCheck,
          grantEligibilityCheck: updatedGrantCheck,
        };

        if (existingMod.length > 0) {
          await db
            .update(planModulesData)
            .set({
              structuredInputsJsonb: structuredPayload,
              completionPercentage: 100,
              updatedAt: new Date(),
            })
            .where(eq(planModulesData.id, existingMod[0].id));
        } else {
          await db.insert(planModulesData).values({
            planId: input.planId,
            moduleCode: 'MOD_A_IDEATION',
            structuredInputsJsonb: structuredPayload,
            aiThingsToConsiderJsonb: [],
            completionPercentage: 100,
          });
        }

        await db
          .update(startupPlans)
          .set({
            currentModuleStep: 'MOD_A_STEP_8',
            updatedAt: new Date(),
          })
          .where(eq(startupPlans.id, input.planId));

        persistedToCloudSql = true;
      } catch {
        // Non-blocking fallback
      }
    }
  }

  return {
    ok: true,
    persistedToCloudSql,
    engineMode: aiResult.engineMode,
    positioningTips: aiResult.positioningTips,
    updatedRevenueAndGrantFit: aiResult.updatedRevenueAndGrantFit,
    creditsUsedAfter: aiResult.creditsUsedAfter,
  };
}

/**
 * Saves an item to the Open Questions Parking Lot (`open_questions_parking_lot`) in Cloud SQL.
 */
export async function parkOpenQuestionAction(input: {
  planId: string;
  questionText: string;
}): Promise<{ ok: boolean; persistedToCloudSql: boolean }> {
  if (!UUID_REGEX.test(input.planId) || !input.questionText.trim()) {
    return { ok: true, persistedToCloudSql: false };
  }

  const ownership = await verifyActiveSessionAndPlanOwnership(input.planId);
  if (!ownership.authorized) {
    return { ok: false, persistedToCloudSql: false };
  }

  try {
    await db.insert(openQuestionsParkingLot).values({
      planId: input.planId,
      sourceModule: 'MOD_A_IDEATION',
      questionText: input.questionText.trim().slice(0, 1000),
      status: 'OPEN',
    });
    return { ok: true, persistedToCloudSql: true };
  } catch {
    return { ok: true, persistedToCloudSql: false };
  }
}
