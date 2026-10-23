'use server';

import { eq, desc } from 'drizzle-orm';
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
  type StartupHat,
} from '@/db';
import {
  hashPassword,
  verifyPassword,
  setServerSessionCookie,
  getServerSessionCookie,
  clearServerSessionCookie,
} from '@/lib/auth/server-auth';
import {
  calculateAppSumoTierLimits,
  calculatePassLimits,
  type EntitlementSnapshot,
} from '@/lib/entitlements';
import {
  getCountryRulePack,
  type SupportedCountryCode,
} from '@/lib/localization';
import type {
  BmuLocalSession,
  FounderStage,
  IndustryCategory,
  TeamStructure,
  ActiveStartupPlan,
} from '@/lib/auth/session-store';

export interface AuthActionResult {
  ok: boolean;
  error?: string;
  mode: 'cloud_sql' | 'local_fallback';
  session?: BmuLocalSession;
}

/**
 * Ensures the global 'default' tenant exists in PostgreSQL before inserting users/plans.
 */
async function ensureDefaultTenantId(): Promise<string> {
  const existing = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, 'default'))
    .limit(1);

  if (existing.length > 0) {
    return existing[0].id;
  }

  const [created] = await db
    .insert(tenants)
    .values({
      slug: 'default',
      name: 'Build My Unicorn Global',
      brandingJson: {
        primaryColor: '#4f46e5',
        accentColor: '#f59e0b',
      },
    })
    .returning();

  return created.id;
}

/**
 * Builds a complete BmuLocalSession from a database user row.
 */
async function buildSessionFromDbUser(
  dbUser: typeof users.$inferSelect
): Promise<BmuLocalSession> {
  const [entRow] = await db
    .select()
    .from(userEntitlements)
    .where(eq(userEntitlements.userId, dbUser.id))
    .limit(1);

  const userPlans = await db
    .select()
    .from(startupPlans)
    .where(eq(startupPlans.ownerUserId, dbUser.id))
    .orderBy(desc(startupPlans.createdAt));

  const userVouchers = await db
    .select()
    .from(vouchers)
    .where(eq(vouchers.redeemedByUserId, dbUser.id));

  const mappedPlans: ActiveStartupPlan[] = [];

  for (const plan of userPlans) {
    const modRows = await db
      .select()
      .from(planModulesData)
      .where(eq(planModulesData.planId, plan.id));

    const modA = modRows.find((m) => m.moduleCode === 'MOD_A_IDEATION');
    const structuredInputs = (modA?.structuredInputsJsonb ?? {}) as {
      brainDumpText?: string;
      exportPotential?: 'DOMESTIC_ONLY' | 'EXPORTING_INTERNATIONALLY';
      conceptCanvas?: {
        coreProblem: string;
        targetCustomer: string;
        proposedSolution: string;
        unfairAdvantage: string;
        revenueAndGrantFit: string;
        lastSynthesizedAt?: string;
        aiEngineUsed?: 'gemini-2.5-flash' | 'smart-synthesizer';
      };
    };

    const questionRows = await db
      .select()
      .from(openQuestionsParkingLot)
      .where(eq(openQuestionsParkingLot.planId, plan.id));

    const targetMarkets = Array.isArray(plan.targetMarketsArray)
      ? plan.targetMarketsArray
      : [plan.hqCountryCode];

    mappedPlans.push({
      id: plan.id,
      title: plan.title,
      oneLinerSummary: plan.oneLinerSummary || '',
      industryCategory:
        (plan.industryCategory as IndustryCategory) || 'B2B SaaS / AI App',
      hqCountryCode: (plan.hqCountryCode as SupportedCountryCode) || 'IE',
      baseCurrency: plan.baseCurrency || 'EUR',
      targetMarketsArray: targetMarkets,
      exportPotential:
        structuredInputs.exportPotential ||
        (targetMarkets.length > 1
          ? 'EXPORTING_INTERNATIONALLY'
          : 'DOMESTIC_ONLY'),
      currentModuleStep: plan.currentModuleStep || 'MOD_A_STEP_1',
      isPivot: Boolean(plan.parentPlanId),
      brainDumpText: structuredInputs.brainDumpText || plan.oneLinerSummary || '',
      conceptCanvas: structuredInputs.conceptCanvas,
      thingsToConsider: Array.isArray(modA?.aiThingsToConsiderJsonb)
        ? modA.aiThingsToConsiderJsonb
        : undefined,
      openQuestions:
        questionRows.length > 0
          ? questionRows.map((q) => q.questionText)
          : [
              `Validate urgent buyer pain points with 5 target customers in ${plan.hqCountryCode}.`,
            ],
    });
  }

  const profile = dbUser.founderProfileJson || {};
  const freeDefaults = calculatePassLimits('FREE_HOOK');

  const entitlement: EntitlementSnapshot = entRow
    ? {
        userId: dbUser.id,
        planType: entRow.planType,
        stackedCodesCount: entRow.stackedCodesCount,
        maxStartupPlans: entRow.maxStartupPlans,
        maxSeatsPerPlan: entRow.maxSeatsPerPlan,
        monthlyAiCreditsLimit: entRow.monthlyAiCreditsLimit,
        aiCreditsUsedThisMonth: entRow.aiCreditsUsedThisMonth,
        whiteLabelExportEnabled: entRow.whiteLabelExportEnabled,
        customApiKeyEncrypted: entRow.customApiKeyEncrypted,
        accessExpiresAt: entRow.accessExpiresAt,
        isVaultReadonly: entRow.isVaultReadonly,
      }
    : {
        userId: dbUser.id,
        planType: 'FREE_HOOK',
        stackedCodesCount: 0,
        maxStartupPlans: freeDefaults.maxStartupPlans,
        maxSeatsPerPlan: freeDefaults.maxSeatsPerPlan,
        monthlyAiCreditsLimit: freeDefaults.monthlyAiCreditsLimit,
        aiCreditsUsedThisMonth: 0,
        whiteLabelExportEnabled: false,
        isVaultReadonly: false,
      };

  return {
    user: {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      founderStage: (profile.founderStage as FounderStage) || undefined,
      teamStructure: (profile.teamStructure as TeamStructure) || undefined,
      primaryHat: profile.primaryHat || undefined,
      regionOrCounty: profile.regionOrCounty || undefined,
      onboardingCompleted: mappedPlans.length > 0,
    },
    entitlement,
    redeemedCodes: userVouchers.map((v) => v.code),
    plans: mappedPlans,
    activePlanId: mappedPlans[0]?.id || '',
  };
}

/**
 * Registers a new founder in Cloud SQL PostgreSQL with hashed password and entitlement row.
 */
export async function registerFounderAction(input: {
  name: string;
  email: string;
  password: string;
  voucherOrCohortCode?: string;
}): Promise<AuthActionResult> {
  const cleanEmail = input.email.trim().toLowerCase();
  const cleanName = input.name.trim() || 'New Founder';
  const cleanCode = input.voucherOrCohortCode?.trim().toUpperCase() || '';

  if (!cleanEmail || !input.password || input.password.length < 6) {
    return {
      ok: false,
      error: 'Please enter a valid email and a password of at least 6 characters.',
      mode: 'cloud_sql',
    };
  }

  try {
    const tenantId = await ensureDefaultTenantId();

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (existing.length > 0) {
      return {
        ok: false,
        error:
          'An account with this email already exists. Please sign in instead.',
        mode: 'cloud_sql',
      };
    }

    let cohortId: string | null = null;
    if (cleanCode.startsWith('BMU-')) {
      const [foundCohort] = await db
        .select()
        .from(cohorts)
        .where(eq(cohorts.inviteCode, cleanCode))
        .limit(1);
      if (foundCohort) {
        cohortId = foundCohort.id;
      }
    }

    const passwordHash = hashPassword(input.password);

    const [createdUser] = await db
      .insert(users)
      .values({
        tenantId,
        cohortId,
        email: cleanEmail,
        name: cleanName,
        passwordHash,
        emailVerified: true,
        role: 'FOUNDER',
        status: 'ACTIVE',
        founderProfileJson: {},
      })
      .returning();

    if (cleanCode.startsWith('SUMO-')) {
      const sumoLimits = calculateAppSumoTierLimits(1);
      await db.insert(userEntitlements).values({
        userId: createdUser.id,
        planType: 'APPSUMO_LTD',
        stackedCodesCount: 1,
        maxStartupPlans: sumoLimits.maxStartupPlans,
        maxSeatsPerPlan: sumoLimits.maxSeatsPerPlan,
        monthlyAiCreditsLimit: sumoLimits.monthlyAiCreditsLimit,
        aiCreditsUsedThisMonth: 0,
        whiteLabelExportEnabled: sumoLimits.whiteLabelExportEnabled,
        isVaultReadonly: false,
      });

      const [existingVoucher] = await db
        .select()
        .from(vouchers)
        .where(eq(vouchers.code, cleanCode))
        .limit(1);

      if (existingVoucher && existingVoucher.status === 'UNCLAIMED') {
        await db
          .update(vouchers)
          .set({
            status: 'REDEEMED',
            redeemedByUserId: createdUser.id,
            redeemedAt: new Date(),
          })
          .where(eq(vouchers.id, existingVoucher.id));
      } else if (!existingVoucher) {
        await db.insert(vouchers).values({
          code: cleanCode,
          batchName: 'Cloud_Signup_Redemption',
          source: 'APPSUMO',
          status: 'REDEEMED',
          redeemedByUserId: createdUser.id,
          redeemedAt: new Date(),
        });
      }
    } else if (cleanCode.startsWith('BMU-')) {
      const cohortLimits = calculatePassLimits('COHORT_PASS', 6);
      await db.insert(userEntitlements).values({
        userId: createdUser.id,
        planType: 'COHORT_PASS',
        stackedCodesCount: 0,
        maxStartupPlans: cohortLimits.maxStartupPlans,
        maxSeatsPerPlan: cohortLimits.maxSeatsPerPlan,
        monthlyAiCreditsLimit: cohortLimits.monthlyAiCreditsLimit,
        aiCreditsUsedThisMonth: 0,
        whiteLabelExportEnabled: false,
        accessExpiresAt: cohortLimits.accessExpiresAt,
        isVaultReadonly: false,
      });
    } else {
      const freeLimits = calculatePassLimits('FREE_HOOK');
      await db.insert(userEntitlements).values({
        userId: createdUser.id,
        planType: 'FREE_HOOK',
        stackedCodesCount: 0,
        maxStartupPlans: freeLimits.maxStartupPlans,
        maxSeatsPerPlan: freeLimits.maxSeatsPerPlan,
        monthlyAiCreditsLimit: freeLimits.monthlyAiCreditsLimit,
        aiCreditsUsedThisMonth: 0,
        whiteLabelExportEnabled: false,
        isVaultReadonly: false,
      });
    }

    await setServerSessionCookie({
      userId: createdUser.id,
      email: createdUser.email,
    });

    const session = await buildSessionFromDbUser(createdUser);
    return {
      ok: true,
      mode: 'cloud_sql',
      session,
    };
  } catch (err) {
    console.warn(
      '[BMU Auth] PostgreSQL unreachable during register; using local fallback:',
      err instanceof Error ? err.message : err
    );
    return {
      ok: true,
      mode: 'local_fallback',
    };
  }
}

/**
 * Authenticates a founder against Cloud SQL PostgreSQL using email & password.
 */
export async function loginFounderAction(input: {
  email: string;
  password: string;
}): Promise<AuthActionResult> {
  const cleanEmail = input.email.trim().toLowerCase();

  try {
    const [foundUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (!foundUser) {
      return {
        ok: false,
        error:
          'No account found with that email address. Create a new founder account first.',
        mode: 'cloud_sql',
      };
    }

    if (foundUser.status === 'SUSPENDED') {
      return {
        ok: false,
        error: `Account suspended: ${foundUser.suspensionReason || 'Contact support.'}`,
        mode: 'cloud_sql',
      };
    }

    // If user was seeded before passwordHash was set, allow setting/verifying demo password
    if (foundUser.passwordHash) {
      const isValid = verifyPassword(input.password, foundUser.passwordHash);
      if (!isValid) {
        return {
          ok: false,
          error: 'Invalid email or password. Please try again.',
          mode: 'cloud_sql',
        };
      }
    } else {
      // Upgrade legacy seeded user row with the provided password hash
      const upgradedHash = hashPassword(input.password);
      await db
        .update(users)
        .set({ passwordHash: upgradedHash, lastActiveAt: new Date() })
        .where(eq(users.id, foundUser.id));
    }

    await db
      .update(users)
      .set({ lastActiveAt: new Date() })
      .where(eq(users.id, foundUser.id));

    await setServerSessionCookie({
      userId: foundUser.id,
      email: foundUser.email,
    });

    const session = await buildSessionFromDbUser(foundUser);
    return {
      ok: true,
      mode: 'cloud_sql',
      session,
    };
  } catch (err) {
    console.warn(
      '[BMU Auth] PostgreSQL unreachable during login; using local fallback:',
      err instanceof Error ? err.message : err
    );
    return {
      ok: true,
      mode: 'local_fallback',
    };
  }
}

/**
 * Saves the 60-Second Founder Onboarding profile and creates the first Startup Plan in Cloud SQL.
 */
export async function completeOnboardingAction(input: {
  founderStage: FounderStage;
  teamStructure: TeamStructure;
  primaryHat: StartupHat;
  regionOrCounty: string;
  planTitle: string;
  oneLinerSummary: string;
  hqCountryCode: SupportedCountryCode;
  industryCategory: IndustryCategory;
  exportPotential: 'DOMESTIC_ONLY' | 'EXPORTING_INTERNATIONALLY';
}): Promise<AuthActionResult> {
  try {
    const cookiePayload = await getServerSessionCookie();
    if (!cookiePayload) {
      return {
        ok: true,
        mode: 'local_fallback',
      };
    }

    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, cookiePayload.userId))
      .limit(1);

    if (!dbUser) {
      return {
        ok: true,
        mode: 'local_fallback',
      };
    }

    const countryPack = getCountryRulePack(input.hqCountryCode);
    const targetMarkets =
      input.exportPotential === 'EXPORTING_INTERNATIONALLY'
        ? Array.from(new Set([input.hqCountryCode, 'GB', 'EU', 'US']))
        : [input.hqCountryCode];

    const [updatedUser] = await db
      .update(users)
      .set({
        founderProfileJson: {
          founderStage: input.founderStage,
          teamStructure: input.teamStructure,
          primaryHat: input.primaryHat,
          regionOrCounty: input.regionOrCounty.trim(),
        },
        updatedAt: new Date(),
      })
      .where(eq(users.id, dbUser.id))
      .returning();

    const cleanTitle = input.planTitle.trim() || 'My First Unicorn Idea';
    const cleanSummary =
      input.oneLinerSummary.trim() ||
      `Building a ${input.industryCategory} startup headquartered in ${countryPack.countryName}.`;

    const [createdPlan] = await db
      .insert(startupPlans)
      .values({
        ownerUserId: dbUser.id,
        tenantId: dbUser.tenantId,
        cohortId: dbUser.cohortId,
        title: cleanTitle,
        oneLinerSummary: cleanSummary,
        industryCategory: input.industryCategory,
        hqCountryCode: input.hqCountryCode,
        baseCurrency: countryPack.defaultCurrency,
        targetMarketsArray: targetMarkets,
        currentModuleStep: 'MOD_A_STEP_1',
        status: 'ACTIVE',
      })
      .returning();

    await db.insert(planModulesData).values({
      planId: createdPlan.id,
      moduleCode: 'MOD_A_IDEATION',
      structuredInputsJsonb: {
        brainDumpText: cleanSummary,
        exportPotential: input.exportPotential,
      },
      aiThingsToConsiderJsonb: [],
      completionPercentage: 15,
    });

    await db.insert(openQuestionsParkingLot).values({
      planId: createdPlan.id,
      sourceModule: 'MOD_A_IDEATION',
      questionText: `Validate urgent buyer pain points with 5 target customers in ${countryPack.countryName}.`,
      status: 'OPEN',
    });

    const session = await buildSessionFromDbUser(updatedUser);
    return {
      ok: true,
      mode: 'cloud_sql',
      session,
    };
  } catch (err) {
    console.warn(
      '[BMU Auth] PostgreSQL unreachable during onboarding; using local fallback:',
      err instanceof Error ? err.message : err
    );
    return {
      ok: true,
      mode: 'local_fallback',
    };
  }
}

/**
 * Fetches the active Cloud SQL session if an HTTP-only session cookie is present.
 */
export async function getCurrentCloudSessionAction(): Promise<{
  dbConnected: boolean;
  authenticated: boolean;
  session: BmuLocalSession | null;
}> {
  try {
    const cookiePayload = await getServerSessionCookie();
    if (!cookiePayload) {
      // Still test lightweight DB connectivity so the footer can report live Cloud SQL status
      await db.select({ id: tenants.id }).from(tenants).limit(1);
      return {
        dbConnected: true,
        authenticated: false,
        session: null,
      };
    }

    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, cookiePayload.userId))
      .limit(1);

    if (!dbUser) {
      return {
        dbConnected: true,
        authenticated: false,
        session: null,
      };
    }

    const session = await buildSessionFromDbUser(dbUser);
    return {
      dbConnected: true,
      authenticated: true,
      session,
    };
  } catch {
    return {
      dbConnected: false,
      authenticated: false,
      session: null,
    };
  }
}

/**
 * Logs out the current founder and clears the HTTP-only session cookie.
 */
export async function logoutFounderAction(): Promise<void> {
  await clearServerSessionCookie();
}
