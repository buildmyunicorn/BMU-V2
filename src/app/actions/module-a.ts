'use server';

import { and, eq } from 'drizzle-orm';
import {
  db,
  startupPlans,
  planModulesData,
  openQuestionsParkingLot,
  validationSurveys,
  userEntitlements,
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

/**
 * Permanently deletes a startup plan and all cascading module data.
 * Enforces ownership verification (IDOR protection) via verifyActiveSessionAndPlanOwnership.
 */
export async function deleteStartupPlanAction(input: {
  planId: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!input.planId) {
    return { ok: false, error: 'Plan ID is required.' };
  }

  // If it's a local/demo plan ID, no Cloud SQL deletion needed
  if (!UUID_REGEX.test(input.planId)) {
    return { ok: true };
  }

  try {
    const ownership = await verifyActiveSessionAndPlanOwnership(input.planId);
    if (!ownership.authorized) {
      if (
        ownership.reason === 'DATABASE_UNAVAILABLE' ||
        ownership.reason === 'UNAUTHENTICATED_SESSION' ||
        ownership.isLocalPreview
      ) {
        // Database offline or local session — allow workspace local cleanup
        return { ok: true };
      }
      return {
        ok: false,
        error: ownership.reason || 'You are not authorized to delete this plan.',
      };
    }

    // startupPlans has onDelete: 'cascade' on child tables (planModulesData, validationSurveys, openQuestionsParkingLot, etc.)
    await db.delete(startupPlans).where(eq(startupPlans.id, input.planId));
    return { ok: true };
  } catch (err: any) {
    console.warn('[SPF Plan Delete] Database deletion error or offline:', err);
    // Don't trap the user in the UI if DB is offline
    return { ok: true };
  }
}

/**
 * Clones and pivots an existing startup plan and all associated module data.
 * Enforces ownership verification (IDOR protection) and plan quota limits.
 */
export async function cloneStartupPlanAction(input: {
  sourcePlanId: string;
  newTitle?: string;
}): Promise<{
  ok: boolean;
  newPlanId?: string;
  newPlanTitle?: string;
  error?: string;
  limitReached?: boolean;
}> {
  if (!input.sourcePlanId) {
    return { ok: false, error: 'Source plan ID is required.' };
  }

  // Handle local / demo preview plans
  if (!UUID_REGEX.test(input.sourcePlanId)) {
    const fallbackId = `plan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    return {
      ok: true,
      newPlanId: fallbackId,
      newPlanTitle: input.newTitle?.trim() || 'Cloned Plan (Pivot)',
    };
  }

  const ownership = await verifyActiveSessionAndPlanOwnership(input.sourcePlanId);
  if (!ownership.authorized || !ownership.userId) {
    if (
      ownership.reason === 'DATABASE_UNAVAILABLE' ||
      ownership.reason === 'UNAUTHENTICATED_SESSION' ||
      ownership.isLocalPreview
    ) {
      const fallbackId = `plan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      return {
        ok: true,
        newPlanId: fallbackId,
        newPlanTitle: input.newTitle?.trim() || 'Cloned Plan (Pivot)',
      };
    }
    return {
      ok: false,
      error: ownership.reason || 'You are not authorized to clone this plan.',
    };
  }

  try {
    // Check user entitlements for plan limits
    const [entRow] = await db
      .select({ maxStartupPlans: userEntitlements.maxStartupPlans })
      .from(userEntitlements)
      .where(eq(userEntitlements.userId, ownership.userId))
      .limit(1);

    const maxPlans = entRow?.maxStartupPlans ?? 1;

    // Count user's current plans
    const existingPlans = await db
      .select({ id: startupPlans.id })
      .from(startupPlans)
      .where(eq(startupPlans.ownerUserId, ownership.userId));

    if (existingPlans.length >= maxPlans) {
      return {
        ok: false,
        limitReached: true,
        error: `You have reached your limit of ${maxPlans} active Startup Plan${maxPlans === 1 ? '' : 's'}. Upgrade your pass to create additional plans.`,
      };
    }

    // Query the source plan
    const [sourcePlan] = await db
      .select()
      .from(startupPlans)
      .where(eq(startupPlans.id, input.sourcePlanId))
      .limit(1);

    if (!sourcePlan) {
      return { ok: false, error: 'Source plan not found.' };
    }

    const cleanTitle = input.newTitle?.trim() || `${sourcePlan.title} (Pivot)`;

    // Insert cloned plan row with parentPlanId pointing to source plan
    const [createdPlan] = await db
      .insert(startupPlans)
      .values({
        ownerUserId: ownership.userId,
        tenantId: sourcePlan.tenantId,
        cohortId: sourcePlan.cohortId,
        parentPlanId: sourcePlan.id,
        title: cleanTitle,
        oneLinerSummary: sourcePlan.oneLinerSummary,
        industryCategory: sourcePlan.industryCategory,
        grantEligibilitySector: sourcePlan.grantEligibilitySector,
        innovateUkResearchCategory: sourcePlan.innovateUkResearchCategory,
        productVehicleType: sourcePlan.productVehicleType,
        primarySalesChannel: sourcePlan.primarySalesChannel,
        selectedBuildTier: sourcePlan.selectedBuildTier,
        hqCountryCode: sourcePlan.hqCountryCode,
        localAuthorityOrRegion: sourcePlan.localAuthorityOrRegion,
        baseCurrency: sourcePlan.baseCurrency,
        targetMarketsArray: sourcePlan.targetMarketsArray,
        targetLaunchDate: sourcePlan.targetLaunchDate,
        currentModuleStep: sourcePlan.currentModuleStep,
        grantComplianceMetadataJson: sourcePlan.grantComplianceMetadataJson,
        ideaComparatorScoresJson: sourcePlan.ideaComparatorScoresJson,
        status: 'ACTIVE',
      })
      .returning();

    // Copy all planModulesData
    const sourceModules = await db
      .select()
      .from(planModulesData)
      .where(eq(planModulesData.planId, sourcePlan.id));

    if (sourceModules.length > 0) {
      await db.insert(planModulesData).values(
        sourceModules.map((mod) => ({
          planId: createdPlan.id,
          moduleCode: mod.moduleCode,
          structuredInputsJsonb: mod.structuredInputsJsonb,
          aiThingsToConsiderJsonb: mod.aiThingsToConsiderJsonb,
          completionPercentage: mod.completionPercentage,
        }))
      );
    }

    // Copy open questions
    try {
      const sourceQuestions = await db
        .select()
        .from(openQuestionsParkingLot)
        .where(eq(openQuestionsParkingLot.planId, sourcePlan.id));

      if (sourceQuestions.length > 0) {
        await db.insert(openQuestionsParkingLot).values(
          sourceQuestions.map((q) => ({
            planId: createdPlan.id,
            sourceModule: q.sourceModule,
            questionText: q.questionText,
            status: q.status,
            resolutionNotes: q.resolutionNotes,
          }))
        );
      }
    } catch (qErr) {
      console.warn('[SPF Clone] Non-fatal error copying open questions:', qErr);
    }

    // Copy surveys with unique slugs
    try {
      const sourceSurveys = await db
        .select()
        .from(validationSurveys)
        .where(eq(validationSurveys.planId, sourcePlan.id));

      for (const srv of sourceSurveys) {
        const newSlug = `${srv.publicSlug.slice(0, 36)}-pivot-${Math.random().toString(36).slice(2, 7)}`;
        await db.insert(validationSurveys).values({
          planId: createdPlan.id,
          publicSlug: newSlug,
          title: `${srv.title} (Pivot)`,
          introDescription: srv.introDescription,
          isActive: false,
          collectLeadEmails: srv.collectLeadEmails,
          waitlistIncentiveText: srv.waitlistIncentiveText,
          questionsJsonb: srv.questionsJsonb,
          outreachTemplatesJsonb: srv.outreachTemplatesJsonb,
          interviewLogsJsonb: srv.interviewLogsJsonb,
        });
      }
    } catch (surveyErr) {
      console.warn('[SPF Clone] Non-fatal error copying surveys:', surveyErr);
    }

    return {
      ok: true,
      newPlanId: createdPlan.id,
      newPlanTitle: createdPlan.title,
    };
  } catch (err: any) {
    console.warn('[SPF Clone Plan] DB clone failed, falling back to local clone:', err);
    // Graceful fallback: return ok: true with generated local UUID so the founder's session is not blocked
    const fallbackId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `plan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    return {
      ok: true,
      newPlanId: fallbackId,
      newPlanTitle: (input.newTitle || 'My Cloned Plan').trim(),
    };
  }
}
