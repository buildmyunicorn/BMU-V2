'use server';

import { eq, and } from 'drizzle-orm';
import {
  db,
  tenants,
  cohorts,
  users,
  userEntitlements,
  vouchers,
  startupPlans,
  planModulesData,
  openQuestionsParkingLot,
  type BlindSpotItem,
  type StartupHat,
} from '@/db';
import {
  calculateAppSumoTierLimits,
  calculatePassLimits,
  type EntitlementSnapshot,
} from '@/lib/entitlements';
import {
  getCountryRulePack,
  type SupportedCountryCode,
} from '@/lib/localization';
import {
  generateModuleACanvasAndBlindSpots,
  askUnicornCoPilot,
  type ModuleACanvasSynthesisResult,
} from '@/lib/ai/router';

/**
 * Ensures the default 'default' BMU tenant exists in PostgreSQL.
 */
async function ensureDefaultTenantId(): Promise<string> {
  const [existing] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, 'default'))
    .limit(1);

  if (existing) {
    return existing.id;
  }

  const [created] = await db
    .insert(tenants)
    .values({
      name: 'Build My Unicorn Global',
      slug: 'default',
    })
    .returning();

  return created.id;
}

/**
 * 1. Register a new founder in PostgreSQL (`users` + `user_entitlements` + optional `vouchers` / `cohorts`).
 */
export async function registerUserAction(params: {
  name: string;
  email: string;
  password?: string;
  voucherOrCohortCode?: string;
}): Promise<{
  persistedToDb: boolean;
  userId: string;
  entitlement: EntitlementSnapshot;
  redeemedCode?: string;
  error?: string;
}> {
  const cleanEmail = params.email.trim().toLowerCase();
  const cleanName = params.name.trim() || 'Founder';
  const cleanCode = params.voucherOrCohortCode?.trim().toUpperCase() || '';

  try {
    const tenantId = await ensureDefaultTenantId();

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    let cohortId: string | null = null;
    if (cleanCode.startsWith('BMU-')) {
      const [cohort] = await db
        .select()
        .from(cohorts)
        .where(eq(cohorts.inviteCode, cleanCode))
        .limit(1);
      if (cohort) {
        cohortId = cohort.id;
      }
    }

    const userRecord =
      existingUser ??
      (
        await db
          .insert(users)
          .values({
            tenantId,
            cohortId,
            email: cleanEmail,
            name: cleanName,
            emailVerified: true,
            role: 'FOUNDER',
            status: 'ACTIVE',
          })
          .returning()
      )[0];

    // Calculate initial entitlement
    let planType: EntitlementSnapshot['planType'] = 'FREE_HOOK';
    let stackedCodesCount = 0;
    let maxStartupPlans = 1;
    let maxSeatsPerPlan = 1;
    let monthlyAiCreditsLimit = 50;
    let whiteLabelExportEnabled = false;
    let accessExpiresAt: Date | null = null;

    if (cleanCode.startsWith('SUMO-')) {
      const sumoLimits = calculateAppSumoTierLimits(1);
      planType = 'APPSUMO_LTD';
      stackedCodesCount = 1;
      maxStartupPlans = sumoLimits.maxStartupPlans;
      maxSeatsPerPlan = sumoLimits.maxSeatsPerPlan;
      monthlyAiCreditsLimit = sumoLimits.monthlyAiCreditsLimit;
      whiteLabelExportEnabled = sumoLimits.whiteLabelExportEnabled;

      // Mark voucher redeemed if present in DB
      await db
        .update(vouchers)
        .set({
          status: 'REDEEMED',
          redeemedByUserId: userRecord.id,
          redeemedAt: new Date(),
        })
        .where(eq(vouchers.code, cleanCode));
    } else if (cleanCode.startsWith('BMU-')) {
      const cohortLimits = calculatePassLimits('COHORT_PASS', 6);
      planType = 'COHORT_PASS';
      maxStartupPlans = cohortLimits.maxStartupPlans;
      maxSeatsPerPlan = cohortLimits.maxSeatsPerPlan;
      monthlyAiCreditsLimit = cohortLimits.monthlyAiCreditsLimit;
      accessExpiresAt = cohortLimits.accessExpiresAt;
    } else {
      const freeLimits = calculatePassLimits('FREE_HOOK');
      maxStartupPlans = freeLimits.maxStartupPlans;
      maxSeatsPerPlan = freeLimits.maxSeatsPerPlan;
      monthlyAiCreditsLimit = freeLimits.monthlyAiCreditsLimit;
    }

    const [existingEnt] = await db
      .select()
      .from(userEntitlements)
      .where(eq(userEntitlements.userId, userRecord.id))
      .limit(1);

    const entRecord =
      existingEnt ??
      (
        await db
          .insert(userEntitlements)
          .values({
            userId: userRecord.id,
            planType,
            stackedCodesCount,
            maxStartupPlans,
            maxSeatsPerPlan,
            monthlyAiCreditsLimit,
            aiCreditsUsedThisMonth: 0,
            whiteLabelExportEnabled,
            accessExpiresAt,
            isVaultReadonly: false,
          })
          .returning()
      )[0];

    return {
      persistedToDb: true,
      userId: userRecord.id,
      entitlement: {
        userId: userRecord.id,
        planType: entRecord.planType,
        stackedCodesCount: entRecord.stackedCodesCount,
        maxStartupPlans: entRecord.maxStartupPlans,
        maxSeatsPerPlan: entRecord.maxSeatsPerPlan,
        monthlyAiCreditsLimit: entRecord.monthlyAiCreditsLimit,
        aiCreditsUsedThisMonth: entRecord.aiCreditsUsedThisMonth,
        whiteLabelExportEnabled: entRecord.whiteLabelExportEnabled,
        accessExpiresAt: entRecord.accessExpiresAt,
        isVaultReadonly: entRecord.isVaultReadonly,
      },
      redeemedCode: cleanCode || undefined,
    };
  } catch (err) {
    console.warn('[BMU DB] registerUserAction fallback (DB offline):', err);
    const fallbackUserId = `user-${Date.now()}`;
    const freeLimits = calculatePassLimits('FREE_HOOK');
    return {
      persistedToDb: false,
      userId: fallbackUserId,
      entitlement: {
        userId: fallbackUserId,
        planType: cleanCode.startsWith('SUMO-')
          ? 'APPSUMO_LTD'
          : cleanCode.startsWith('BMU-')
            ? 'COHORT_PASS'
            : 'FREE_HOOK',
        stackedCodesCount: cleanCode.startsWith('SUMO-') ? 1 : 0,
        maxStartupPlans: cleanCode ? 3 : freeLimits.maxStartupPlans,
        maxSeatsPerPlan: cleanCode ? 3 : freeLimits.maxSeatsPerPlan,
        monthlyAiCreditsLimit: cleanCode ? 500 : freeLimits.monthlyAiCreditsLimit,
        aiCreditsUsedThisMonth: 0,
        whiteLabelExportEnabled: false,
        isVaultReadonly: false,
      },
      redeemedCode: cleanCode || undefined,
    };
  }
}

/**
 * 2. Log in an existing user by email from PostgreSQL (`users` + `user_entitlements` + `startup_plans`).
 */
export async function loginUserAction(params: { email: string }): Promise<{
  foundInDb: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    role: 'FOUNDER' | 'MENTOR' | 'TENANT_ADMIN' | 'SUPER_ADMIN';
  };
  entitlement?: EntitlementSnapshot;
  plans?: Array<{
    id: string;
    title: string;
    oneLinerSummary: string;
    industryCategory: string;
    hqCountryCode: SupportedCountryCode;
    baseCurrency: string;
    targetMarketsArray: string[];
    currentModuleStep: string;
    brainDumpText?: string;
    openQuestions: string[];
  }>;
}> {
  const cleanEmail = params.email.trim().toLowerCase();

  try {
    const [userRecord] = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (!userRecord) {
      return { foundInDb: false };
    }

    const [entRecord] = await db
      .select()
      .from(userEntitlements)
      .where(eq(userEntitlements.userId, userRecord.id))
      .limit(1);

    const dbPlans = await db
      .select()
      .from(startupPlans)
      .where(eq(startupPlans.ownerUserId, userRecord.id));

    const hydratedPlans = await Promise.all(
      dbPlans.map(async (p) => {
        const [modA] = await db
          .select()
          .from(planModulesData)
          .where(
            and(
              eq(planModulesData.planId, p.id),
              eq(planModulesData.moduleCode, 'MOD_A_IDEATION')
            )
          )
          .limit(1);

        const openQs = await db
          .select()
          .from(openQuestionsParkingLot)
          .where(eq(openQuestionsParkingLot.planId, p.id));

        const structured = (modA?.structuredInputsJsonb || {}) as Record<
          string,
          unknown
        >;

        return {
          id: p.id,
          title: p.title,
          oneLinerSummary: p.oneLinerSummary || p.title,
          industryCategory: p.industryCategory || 'B2B SaaS / AI App',
          hqCountryCode: (p.hqCountryCode as SupportedCountryCode) || 'IE',
          baseCurrency: p.baseCurrency || 'EUR',
          targetMarketsArray: p.targetMarketsArray || ['IE'],
          currentModuleStep: p.currentModuleStep || 'MOD_A_STEP_1',
          brainDumpText:
            typeof structured.brainDumpText === 'string'
              ? structured.brainDumpText
              : p.oneLinerSummary || '',
          openQuestions: openQs.map((q) => q.questionText),
        };
      })
    );

    const freeLimits = calculatePassLimits('FREE_HOOK');

    return {
      foundInDb: true,
      user: {
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        role: userRecord.role,
      },
      entitlement: entRecord
        ? {
            userId: userRecord.id,
            planType: entRecord.planType,
            stackedCodesCount: entRecord.stackedCodesCount,
            maxStartupPlans: entRecord.maxStartupPlans,
            maxSeatsPerPlan: entRecord.maxSeatsPerPlan,
            monthlyAiCreditsLimit: entRecord.monthlyAiCreditsLimit,
            aiCreditsUsedThisMonth: entRecord.aiCreditsUsedThisMonth,
            whiteLabelExportEnabled: entRecord.whiteLabelExportEnabled,
            accessExpiresAt: entRecord.accessExpiresAt,
            isVaultReadonly: entRecord.isVaultReadonly,
          }
        : {
            userId: userRecord.id,
            planType: 'FREE_HOOK',
            stackedCodesCount: 0,
            maxStartupPlans: freeLimits.maxStartupPlans,
            maxSeatsPerPlan: freeLimits.maxSeatsPerPlan,
            monthlyAiCreditsLimit: freeLimits.monthlyAiCreditsLimit,
            aiCreditsUsedThisMonth: 0,
            whiteLabelExportEnabled: false,
            isVaultReadonly: false,
          },
      plans: hydratedPlans,
    };
  } catch (err) {
    console.warn('[BMU DB] loginUserAction fallback (DB offline):', err);
    return { foundInDb: false };
  }
}

/**
 * 3. Complete 60-Second Onboarding:
 *    - Saves the founder's first `startup_plans` row in PostgreSQL
 *    - Calls Vertex AI (`generateModuleACanvasAndBlindSpots`) to synthesize the initial Module A Mirror Canvas
 *    - Stores `plan_modules_data` and `open_questions_parking_lot`
 */
export async function completeOnboardingAction(params: {
  userId: string;
  userEmail: string;
  userName: string;
  founderStage: string;
  teamStructure: string;
  primaryHat: StartupHat;
  regionOrCounty: string;
  planTitle: string;
  oneLinerSummary: string;
  hqCountryCode: SupportedCountryCode;
  industryCategory: string;
  exportPotential: 'DOMESTIC_ONLY' | 'EXPORTING_INTERNATIONALLY';
}): Promise<{
  persistedToDb: boolean;
  planId: string;
  aiSynthesis: ModuleACanvasSynthesisResult;
}> {
  const countryPack = getCountryRulePack(params.hqCountryCode);
  const targetMarkets =
    params.exportPotential === 'EXPORTING_INTERNATIONALLY'
      ? Array.from(new Set([params.hqCountryCode, 'GB', 'EU', 'US']))
      : [params.hqCountryCode];

  // Run live Vertex AI synthesis for their initial concept
  const aiSynthesis = await generateModuleACanvasAndBlindSpots({
    userId: params.userId,
    planTitle: params.planTitle,
    industryCategory: params.industryCategory,
    hqCountryCode: params.hqCountryCode,
    baseCurrency: countryPack.defaultCurrency,
    exportPotential: params.exportPotential === 'EXPORTING_INTERNATIONALLY',
    brainDumpText:
      params.oneLinerSummary ||
      `${params.planTitle} (${params.industryCategory}) operating in ${countryPack.countryName}.`,
  });

  try {
    const tenantId = await ensureDefaultTenantId();

    // Ensure user exists in PostgreSQL
    let [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, params.userEmail.trim().toLowerCase()))
      .limit(1);

    if (!dbUser) {
      [dbUser] = await db
        .insert(users)
        .values({
          tenantId,
          email: params.userEmail.trim().toLowerCase(),
          name: params.userName || 'Founder',
          emailVerified: true,
          role: 'FOUNDER',
          status: 'ACTIVE',
        })
        .returning();
    }

    const [createdPlan] = await db
      .insert(startupPlans)
      .values({
        ownerUserId: dbUser.id,
        tenantId,
        title: params.planTitle.trim() || 'My First Unicorn Plan',
        oneLinerSummary: aiSynthesis.oneLinerSummary,
        industryCategory: params.industryCategory,
        hqCountryCode: params.hqCountryCode,
        baseCurrency: countryPack.defaultCurrency,
        targetMarketsArray: targetMarkets,
        currentModuleStep: 'MOD_A_STEP_1',
        ideaComparatorScoresJson: aiSynthesis.recommendedComparatorScores,
        status: 'ACTIVE',
      })
      .returning();

    await db.insert(planModulesData).values({
      planId: createdPlan.id,
      moduleCode: 'MOD_A_IDEATION',
      structuredInputsJsonb: {
        brainDumpText: params.oneLinerSummary,
        exportPotential: params.exportPotential === 'EXPORTING_INTERNATIONALLY',
        founderStage: params.founderStage,
        teamStructure: params.teamStructure,
        primaryHat: params.primaryHat,
        regionOrCounty: params.regionOrCounty,
        canvas: aiSynthesis.canvas,
      },
      aiThingsToConsiderJsonb: aiSynthesis.blindSpots,
      completionPercentage: 50,
    });

    await db.insert(openQuestionsParkingLot).values({
      planId: createdPlan.id,
      sourceModule: 'MOD_A_IDEATION',
      questionText: `Validate urgent buyer pain points with 5 target customers in ${countryPack.countryName}.`,
      status: 'OPEN',
    });

    return {
      persistedToDb: true,
      planId: createdPlan.id,
      aiSynthesis,
    };
  } catch (err) {
    console.warn('[BMU DB] completeOnboardingAction fallback (DB offline):', err);
    return {
      persistedToDb: false,
      planId: `plan-${Date.now()}`,
      aiSynthesis,
    };
  }
}

/**
 * 4. Live Module A Vertex AI Synthesis + PostgreSQL Persistence (`synthesizeModuleACanvasAction`).
 */
export async function synthesizeModuleACanvasAction(params: {
  userId?: string;
  planId?: string;
  planTitle: string;
  industryCategory: string;
  hqCountryCode: SupportedCountryCode;
  exportPotential: boolean;
  brainDumpText: string;
}): Promise<ModuleACanvasSynthesisResult & { persistedToDb: boolean }> {
  const countryPack = getCountryRulePack(params.hqCountryCode);

  const result = await generateModuleACanvasAndBlindSpots({
    userId: params.userId,
    planId: params.planId,
    planTitle: params.planTitle,
    industryCategory: params.industryCategory,
    hqCountryCode: params.hqCountryCode,
    baseCurrency: countryPack.defaultCurrency,
    exportPotential: params.exportPotential,
    brainDumpText: params.brainDumpText,
  });

  let persistedToDb = false;
  const isUuid =
    params.planId &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      params.planId
    );

  if (isUuid && params.planId) {
    try {
      await db
        .update(startupPlans)
        .set({
          oneLinerSummary: result.oneLinerSummary,
          hqCountryCode: params.hqCountryCode,
          baseCurrency: countryPack.defaultCurrency,
          ideaComparatorScoresJson: result.recommendedComparatorScores,
          updatedAt: new Date(),
        })
        .where(eq(startupPlans.id, params.planId));

      const [existingMod] = await db
        .select()
        .from(planModulesData)
        .where(
          and(
            eq(planModulesData.planId, params.planId),
            eq(planModulesData.moduleCode, 'MOD_A_IDEATION')
          )
        )
        .limit(1);

      if (existingMod) {
        await db
          .update(planModulesData)
          .set({
            structuredInputsJsonb: {
              ...(existingMod.structuredInputsJsonb as Record<string, unknown>),
              brainDumpText: params.brainDumpText,
              exportPotential: params.exportPotential,
              canvas: result.canvas,
            },
            aiThingsToConsiderJsonb: result.blindSpots,
            completionPercentage: 100,
            updatedAt: new Date(),
          })
          .where(eq(planModulesData.id, existingMod.id));
      } else {
        await db.insert(planModulesData).values({
          planId: params.planId,
          moduleCode: 'MOD_A_IDEATION',
          structuredInputsJsonb: {
            brainDumpText: params.brainDumpText,
            exportPotential: params.exportPotential,
            canvas: result.canvas,
          },
          aiThingsToConsiderJsonb: result.blindSpots,
          completionPercentage: 100,
        });
      }
      persistedToDb = true;
    } catch (err) {
      console.warn('[BMU DB] synthesizeModuleACanvasAction DB update skipped:', err);
    }
  }

  return {
    ...result,
    persistedToDb,
  };
}

/**
 * 5. Live "Ask Unicorn" Sidekick Server Action powered by Vertex AI.
 */
export async function askUnicornAction(params: {
  userId?: string;
  planId?: string;
  planTitle: string;
  hqCountryCode: SupportedCountryCode;
  currentModuleStep: string;
  brainDumpText: string;
  founderQuestion: string;
}) {
  const countryPack = getCountryRulePack(params.hqCountryCode);
  return askUnicornCoPilot({
    ...params,
    baseCurrency: countryPack.defaultCurrency,
  });
}

/**
 * 6. Park an Open Question into PostgreSQL (`open_questions_parking_lot`).
 */
export async function parkOpenQuestionAction(params: {
  planId?: string;
  questionText: string;
}): Promise<{ persistedToDb: boolean }> {
  const isUuid =
    params.planId &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      params.planId
    );

  if (!isUuid || !params.planId) {
    return { persistedToDb: false };
  }

  try {
    await db.insert(openQuestionsParkingLot).values({
      planId: params.planId,
      sourceModule: 'MOD_A_IDEATION',
      questionText: params.questionText,
      status: 'OPEN',
    });
    return { persistedToDb: true };
  } catch {
    return { persistedToDb: false };
  }
}

/**
 * 7. Redeem an AppSumo or Institutional Cohort Voucher in PostgreSQL (`vouchers` / `cohorts` + `user_entitlements`).
 */
export async function redeemVoucherCodeInDbAction(params: {
  userId?: string;
  code: string;
  currentStackedCount: number;
}): Promise<{
  persistedToDb: boolean;
  entitlement?: EntitlementSnapshot;
}> {
  const cleanCode = params.code.trim().toUpperCase();
  const isUuid =
    params.userId &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      params.userId
    );

  if (!isUuid || !params.userId) {
    return { persistedToDb: false };
  }

  try {
    if (cleanCode.startsWith('SUMO-')) {
      const nextCount = params.currentStackedCount + 1;
      const sumoLimits = calculateAppSumoTierLimits(nextCount);

      await db
        .update(vouchers)
        .set({
          status: 'REDEEMED',
          redeemedByUserId: params.userId,
          redeemedAt: new Date(),
        })
        .where(eq(vouchers.code, cleanCode));

      const [updated] = await db
        .update(userEntitlements)
        .set({
          planType: 'APPSUMO_LTD',
          stackedCodesCount: nextCount,
          maxStartupPlans: sumoLimits.maxStartupPlans,
          maxSeatsPerPlan: sumoLimits.maxSeatsPerPlan,
          monthlyAiCreditsLimit: sumoLimits.monthlyAiCreditsLimit,
          whiteLabelExportEnabled: sumoLimits.whiteLabelExportEnabled,
          accessExpiresAt: null,
          isVaultReadonly: false,
          updatedAt: new Date(),
        })
        .where(eq(userEntitlements.userId, params.userId))
        .returning();

      if (updated) {
        return {
          persistedToDb: true,
          entitlement: {
            userId: params.userId,
            planType: updated.planType,
            stackedCodesCount: updated.stackedCodesCount,
            maxStartupPlans: updated.maxStartupPlans,
            maxSeatsPerPlan: updated.maxSeatsPerPlan,
            monthlyAiCreditsLimit: updated.monthlyAiCreditsLimit,
            aiCreditsUsedThisMonth: updated.aiCreditsUsedThisMonth,
            whiteLabelExportEnabled: updated.whiteLabelExportEnabled,
            accessExpiresAt: updated.accessExpiresAt,
            isVaultReadonly: updated.isVaultReadonly,
          },
        };
      }
    } else if (cleanCode.startsWith('BMU-')) {
      const cohortLimits = calculatePassLimits('COHORT_PASS', 6);
      const [updated] = await db
        .update(userEntitlements)
        .set({
          planType: 'COHORT_PASS',
          maxStartupPlans: cohortLimits.maxStartupPlans,
          maxSeatsPerPlan: cohortLimits.maxSeatsPerPlan,
          monthlyAiCreditsLimit: cohortLimits.monthlyAiCreditsLimit,
          accessExpiresAt: cohortLimits.accessExpiresAt,
          isVaultReadonly: false,
          updatedAt: new Date(),
        })
        .where(eq(userEntitlements.userId, params.userId))
        .returning();

      if (updated) {
        return {
          persistedToDb: true,
          entitlement: {
            userId: params.userId,
            planType: updated.planType,
            stackedCodesCount: updated.stackedCodesCount,
            maxStartupPlans: updated.maxStartupPlans,
            maxSeatsPerPlan: updated.maxSeatsPerPlan,
            monthlyAiCreditsLimit: updated.monthlyAiCreditsLimit,
            aiCreditsUsedThisMonth: updated.aiCreditsUsedThisMonth,
            whiteLabelExportEnabled: updated.whiteLabelExportEnabled,
            accessExpiresAt: updated.accessExpiresAt,
            isVaultReadonly: updated.isVaultReadonly,
          },
        };
      }
    }
    return { persistedToDb: false };
  } catch {
    return { persistedToDb: false };
  }
}
