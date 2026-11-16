'use server';

import { and, eq } from 'drizzle-orm';
import {
  db,
  users,
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
    const ownership = await verifyActiveSessionAndPlanOwnership(input.planId, {
      requireWrite: true,
    });
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

  const ownership = await verifyActiveSessionAndPlanOwnership(input.planId, {
    requireWrite: true,
  });
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
    const ownership = await verifyActiveSessionAndPlanOwnership(input.planId, {
      requireWrite: true,
    });
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

export type OpenQuestionModuleCode =
  | 'MOD_A_IDEATION'
  | 'MOD_B_MARKET'
  | 'MOD_C_SURVEYS_FEEDBACK'
  | 'MOD_D_PRODUCT_BUILD'
  | 'MOD_E_OPERATIONS'
  | 'MOD_F_COFOUNDER_TEAM'
  | 'MOD_G_LAUNCHPAD'
  | 'MOD_H_REVENUE'
  | 'MOD_I_MARKETING'
  | 'MOD_J_FINANCE'
  | 'MOD_K_GRANTS_FUNDING'
  | 'MOD_L_BUSINESS_PLAN';

/**
 * Saves an item to the Open Questions Parking Lot (`open_questions_parking_lot`) in Cloud SQL.
 */
export async function parkOpenQuestionAction(input: {
  planId: string;
  questionText: string;
  sourceModule?: OpenQuestionModuleCode;
}): Promise<{ ok: boolean; persistedToCloudSql: boolean }> {
  if (!UUID_REGEX.test(input.planId) || !input.questionText.trim()) {
    return { ok: true, persistedToCloudSql: false };
  }

  const ownership = await verifyActiveSessionAndPlanOwnership(input.planId, {
    requireWrite: true,
  });
  if (!ownership.authorized) {
    return { ok: false, persistedToCloudSql: false };
  }

  try {
    await db.insert(openQuestionsParkingLot).values({
      planId: input.planId,
      sourceModule: input.sourceModule || 'MOD_A_IDEATION',
      questionText: input.questionText.trim().slice(0, 1000),
      status: 'OPEN',
    });
    return { ok: true, persistedToCloudSql: true };
  } catch {
    return { ok: true, persistedToCloudSql: false };
  }
}

/**
 * Deletes / removes an item from the Open Questions Parking Lot (`open_questions_parking_lot`) in Cloud SQL.
 */
export async function deleteOpenQuestionAction(input: {
  planId: string;
  questionText: string;
}): Promise<{ ok: boolean; deletedCount: number }> {
  if (!UUID_REGEX.test(input.planId) || !input.questionText.trim()) {
    return { ok: true, deletedCount: 0 };
  }

  const ownership = await verifyActiveSessionAndPlanOwnership(input.planId, {
    requireWrite: true,
  });
  if (!ownership.authorized) {
    return { ok: false, deletedCount: 0 };
  }

  try {
    const res = await db
      .delete(openQuestionsParkingLot)
      .where(
        and(
          eq(openQuestionsParkingLot.planId, input.planId),
          eq(openQuestionsParkingLot.questionText, input.questionText.trim())
        )
      );
    return { ok: true, deletedCount: 1 };
  } catch {
    return { ok: true, deletedCount: 0 };
  }
}

/**
 * Updates core plan settings in-place (`title`, `oneLinerSummary`, `hqCountryCode`, `baseCurrency`,
 * `industryCategory`, and `fundingTrackMode`) without creating a duplicate plan or hitting plan limits.
 */
export async function updateStartupPlanSettingsAction(input: {
  planId: string;
  title: string;
  oneLinerSummary?: string;
  hqCountryCode: SupportedCountryCode;
  baseCurrency: string;
  industryCategory: string;
  fundingTrackMode?: 'GRANT_AND_INVESTOR' | 'COMMERCIAL_ONLY';
}): Promise<{ ok: boolean; persistedToCloudSql: boolean; error?: string }> {
  const cleanTitle = input.title.trim();
  if (!cleanTitle) {
    return {
      ok: false,
      persistedToCloudSql: false,
      error: 'Plan title cannot be empty.',
    };
  }

  if (!UUID_REGEX.test(input.planId)) {
    return { ok: true, persistedToCloudSql: false };
  }

  const ownership = await verifyActiveSessionAndPlanOwnership(input.planId, {
    requireWrite: true,
  });
  if (!ownership.authorized) {
    return {
      ok: false,
      persistedToCloudSql: false,
      error: ownership.reason || 'Unauthorized access to this plan.',
    };
  }

  try {
    const [existingPlan] = await db
      .select()
      .from(startupPlans)
      .where(eq(startupPlans.id, input.planId))
      .limit(1);

    if (!existingPlan) {
      return { ok: false, persistedToCloudSql: false, error: 'Plan not found.' };
    }

    const updatedComplianceMeta = {
      ...(existingPlan.grantComplianceMetadataJson || {}),
      ...(input.fundingTrackMode
        ? { fundingTrackMode: input.fundingTrackMode }
        : {}),
    };

    await db
      .update(startupPlans)
      .set({
        title: cleanTitle.slice(0, 160),
        ...(typeof input.oneLinerSummary === 'string'
          ? { oneLinerSummary: input.oneLinerSummary.trim().slice(0, 500) }
          : {}),
        hqCountryCode: input.hqCountryCode,
        baseCurrency: input.baseCurrency,
        industryCategory: input.industryCategory.trim().slice(0, 120),
        grantComplianceMetadataJson: updatedComplianceMeta,
        updatedAt: new Date(),
      })
      .where(eq(startupPlans.id, input.planId));

    if (input.fundingTrackMode) {
      const [modARow] = await db
        .select()
        .from(planModulesData)
        .where(
          and(
            eq(planModulesData.planId, input.planId),
            eq(planModulesData.moduleCode, 'MOD_A_IDEATION')
          )
        )
        .limit(1);

      if (modARow) {
        const currentJson = (modARow.structuredInputsJsonb || {}) as Record<
          string,
          unknown
        >;
        await db
          .update(planModulesData)
          .set({
            structuredInputsJsonb: {
              ...currentJson,
              fundingTrackMode: input.fundingTrackMode,
            },
            updatedAt: new Date(),
          })
          .where(eq(planModulesData.id, modARow.id));
      }
    }

    return { ok: true, persistedToCloudSql: true };
  } catch (err) {
    console.warn('[SPF Plan Settings] Failed to update plan settings:', err);
    return {
      ok: false,
      persistedToCloudSql: false,
      error: 'Database unavailable while updating plan settings.',
    };
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
    const ownership = await verifyActiveSessionAndPlanOwnership(input.planId, {
      requireWrite: true,
    });
    if (
      !ownership.authorized ||
      (ownership.role !== 'OWNER' && !ownership.isSuperAdmin)
    ) {
      return {
        ok: false,
        error: ownership.reason || 'You are not authorized to delete this plan.',
      };
    }

    // startupPlans has onDelete: 'cascade' on child tables (planModulesData, validationSurveys, openQuestionsParkingLot, etc.)
    await db.delete(startupPlans).where(eq(startupPlans.id, input.planId));
    return { ok: true };
  } catch (err: any) {
    console.warn('[SPF Plan Delete] Database deletion error:', err);
    return { ok: false, error: 'Database unavailable while deleting plan.' };
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

  const ownership = await verifyActiveSessionAndPlanOwnership(input.sourcePlanId, {
    requireWrite: true,
    requiredFeature: 'CLONE_AND_PIVOT',
  });
  if (!ownership.authorized || !ownership.userId) {
    return {
      ok: false,
      error: ownership.reason || 'You are not authorized to clone this plan.',
    };
  }

  // Only the plan owner (or Super Admin) may clone a plan into their own account
  if (ownership.role === 'COLLABORATOR' && !ownership.isSuperAdmin) {
    return {
      ok: false,
      error: 'Only the primary plan owner can clone and pivot this startup plan.',
    };
  }

  const callerUserId = ownership.userId;
  const callerEmail = (ownership.email || '').trim().toLowerCase();

  try {
    const txResult = await db.transaction(async (tx) => {
      // Lock caller's entitlement row to serialize concurrent clone requests against maxStartupPlans
      const [lockedEnt] = await tx
        .select({ maxStartupPlans: userEntitlements.maxStartupPlans })
        .from(userEntitlements)
        .where(eq(userEntitlements.userId, callerUserId))
        .for('update');

      if (!ownership.isSuperAdmin) {
        const maxPlans = lockedEnt?.maxStartupPlans ?? 1;
        const existingPlans = await tx
          .select({ id: startupPlans.id })
          .from(startupPlans)
          .where(eq(startupPlans.ownerUserId, callerUserId));

        if (existingPlans.length >= maxPlans) {
          return {
            ok: false as const,
            limitReached: true,
            error: `You have reached your limit of ${maxPlans} active Startup Plan${maxPlans === 1 ? '' : 's'}. Upgrade your pass to create additional plans.`,
          };
        }
      }

      const [callerUserRow] = await tx
        .select({ cohortId: users.cohortId, tenantId: users.tenantId })
        .from(users)
        .where(eq(users.id, callerUserId))
        .limit(1);

      const [sourcePlan] = await tx
        .select()
        .from(startupPlans)
        .where(eq(startupPlans.id, input.sourcePlanId))
        .limit(1);

      if (!sourcePlan) {
        return { ok: false as const, error: 'Source plan not found.' };
      }

      const cleanTitle = input.newTitle?.trim() || `${sourcePlan.title} (Pivot)`;
      // Only carry cohortId forward if the cloning owner actually belongs to that cohort
      const safeCohortId =
        sourcePlan.cohortId && callerUserRow?.cohortId === sourcePlan.cohortId
          ? sourcePlan.cohortId
          : null;

      const [createdPlan] = await tx
        .insert(startupPlans)
        .values({
          ownerUserId: callerUserId,
          tenantId: callerUserRow?.tenantId || sourcePlan.tenantId,
          cohortId: safeCohortId,
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

      const sourceModules = await tx
        .select()
        .from(planModulesData)
        .where(eq(planModulesData.planId, sourcePlan.id));

      if (sourceModules.length > 0) {
        await tx.insert(planModulesData).values(
          sourceModules.map((mod) => {
            let safeInputs = mod.structuredInputsJsonb;
            // Preserve Blind-Reveal Co-Founder Alignment secrecy on unrevealed MOD_F responses from other team members
            if (
              mod.moduleCode === 'MOD_F_COFOUNDER_TEAM' &&
              safeInputs &&
              typeof safeInputs === 'object'
            ) {
              const modFObj = safeInputs as Record<string, any>;
              const rawStep4 = modFObj.step4AlignmentData;
              if (
                rawStep4 &&
                !rawStep4.isRevealed &&
                Array.isArray(rawStep4.responses)
              ) {
                const members: Array<{ id?: string; email?: string }> =
                  modFObj.promoterProfiles?.teamMembers || [];
                safeInputs = {
                  ...modFObj,
                  step4AlignmentData: {
                    ...rawStep4,
                    responses: rawStep4.responses.filter((resp: any) => {
                      const matched = members.find((m) => m.id === resp?.memberId);
                      const mEmail = (matched?.email || '').trim().toLowerCase();
                      return Boolean(callerEmail && mEmail === callerEmail);
                    }),
                  },
                };
              }
            }

            return {
              planId: createdPlan.id,
              moduleCode: mod.moduleCode,
              structuredInputsJsonb: safeInputs,
              aiThingsToConsiderJsonb: mod.aiThingsToConsiderJsonb,
              completionPercentage: mod.completionPercentage,
            };
          })
        );
      }

      const sourceQuestions = await tx
        .select()
        .from(openQuestionsParkingLot)
        .where(eq(openQuestionsParkingLot.planId, sourcePlan.id));

      if (sourceQuestions.length > 0) {
        await tx.insert(openQuestionsParkingLot).values(
          sourceQuestions.map((q) => ({
            planId: createdPlan.id,
            sourceModule: q.sourceModule,
            questionText: q.questionText,
            status: q.status,
            resolutionNotes: q.resolutionNotes,
          }))
        );
      }

      const sourceSurveys = await tx
        .select()
        .from(validationSurveys)
        .where(eq(validationSurveys.planId, sourcePlan.id));

      for (const srv of sourceSurveys) {
        const newSlug = `${srv.publicSlug.slice(0, 36)}-pivot-${Math.random().toString(36).slice(2, 7)}`;
        await tx.insert(validationSurveys).values({
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

      return {
        ok: true as const,
        newPlanId: createdPlan.id,
        newPlanTitle: createdPlan.title,
      };
    });

    return txResult;
  } catch (err: any) {
    console.error('[SPF Clone Plan] DB clone transaction failed:', err);
    return {
      ok: false,
      error:
        'Unable to clone your startup plan right now. Please try again in a moment.',
    };
  }
}
