'use server';

import { eq, desc } from 'drizzle-orm';
import {
  db,
  ensureDatabaseSchemaSynced,
  tenants,
  cohorts,
  users,
  userEntitlements,
  vouchers,
  startupPlans,
  planModulesData,
  validationSurveys,
  surveyResponses,
  openQuestionsParkingLot,
  type StartupHat,
} from '@/db';
import {
  hashPassword,
  verifyPassword,
  setServerSessionCookie,
  getServerSessionCookie,
  clearServerSessionCookie,
  checkRateLimit,
  encryptByokApiKey,
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
import {
  deduplicateSurveyResponses,
  type BmuLocalSession,
  type FounderStage,
  type IndustryCategory,
  type TeamStructure,
  type ActiveStartupPlan,
  type SavedFounderMotivation,
  type SavedTeamAndBudget,
  type SavedFounderRealityCheck,
  type SavedGrantEligibilityCheck,
  type SavedModuleBData,
  type SavedModuleCData,
  type SavedModuleDData,
  type SavedModuleEData,
  type SavedMasterDocumentData,
  type SavedValidationSurvey,
  type SavedSurveyResponse,
  type SurveyQuestionItem,
  type SurveyResponseAnswerValue,
  type SurveyAiInsightsSummary,
  type SurveyOutreachTemplates,
  type SavedCustomerInterviewLog,
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
      name: 'Startup Preflight Global',
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
  await ensureDatabaseSchemaSynced();

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

  let userVouchers: Array<typeof vouchers.$inferSelect> = [];
  try {
    userVouchers = await db
      .select()
      .from(vouchers)
      .where(eq(vouchers.redeemedByUserId, dbUser.id));
  } catch (err) {
    console.warn('[SPF Auth] Non-fatal error loading user vouchers:', err);
  }

  const mappedPlans: ActiveStartupPlan[] = [];

  for (const plan of userPlans) {
    const modRows = await db
      .select()
      .from(planModulesData)
      .where(eq(planModulesData.planId, plan.id));

    const modA = modRows.find((m) => m.moduleCode === 'MOD_A_IDEATION');
    const modB = modRows.find((m) => m.moduleCode === 'MOD_B_MARKET');
    const modC = modRows.find((m) => m.moduleCode === 'MOD_C_SURVEYS_FEEDBACK');
    const modD = modRows.find((m) => m.moduleCode === 'MOD_D_PRODUCT_BUILD');
    const modE = modRows.find((m) => m.moduleCode === 'MOD_E_OPERATIONS');
    const modK = modRows.find((m) => m.moduleCode === 'MOD_K_BUSINESS_PLAN');
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
      founderMotivation?: SavedFounderMotivation;
      teamAndBudget?: SavedTeamAndBudget;
      founderRealityCheck?: SavedFounderRealityCheck;
      grantEligibilityCheck?: SavedGrantEligibilityCheck;
      masterDocumentData?: SavedMasterDocumentData;
    };

    const modBInputs = (modB?.structuredInputsJsonb ?? {}) as SavedModuleBData;
    const modCInputs = (modC?.structuredInputsJsonb ?? {}) as SavedModuleCData;
    const modDInputs = (modD?.structuredInputsJsonb ?? {}) as SavedModuleDData;
    const modEInputs = (modE?.structuredInputsJsonb ?? {}) as SavedModuleEData;
    const modKInputs = (modK?.structuredInputsJsonb ?? {}) as {
      masterDocumentData?: SavedMasterDocumentData;
    };

    const mergedSurveysBySlug = new Map<string, SavedValidationSurvey>();

    for (const s of modCInputs.surveys || []) {
      if (s.publicSlug) {
        mergedSurveysBySlug.set(s.publicSlug, s);
      }
    }

    // Also load relational surveys & responses from validation_surveys + survey_responses
    try {
      const dbSurveyRows = await db
        .select()
        .from(validationSurveys)
        .where(eq(validationSurveys.planId, plan.id))
        .orderBy(desc(validationSurveys.createdAt));

      for (const row of dbSurveyRows) {
        const dbRespRows = await db
          .select()
          .from(surveyResponses)
          .where(eq(surveyResponses.surveyId, row.id))
          .orderBy(desc(surveyResponses.submittedAt));

        const mappedDbResponses: Array<
          SavedSurveyResponse & { clientResponseId?: string }
        > = dbRespRows.map((r) => {
          const rawAns = (r.answersJsonb || {}) as {
            answers?: Record<string, SurveyResponseAnswerValue>;
            respondentNameOrRole?: string;
            isSimulated?: boolean;
            clientResponseId?: string;
          } & Record<string, SurveyResponseAnswerValue>;

          const answersMap =
            rawAns.answers && typeof rawAns.answers === 'object'
              ? rawAns.answers
              : (rawAns as Record<string, SurveyResponseAnswerValue>);

          return {
            id: r.id,
            surveyId: r.surveyId,
            answers: answersMap,
            respondentNameOrRole:
              typeof rawAns.respondentNameOrRole === 'string'
                ? rawAns.respondentNameOrRole
                : undefined,
            respondentEmail: r.respondentEmail || undefined,
            joinedWaitlist: r.joinedWaitlist,
            isSimulated: Boolean(rawAns.isSimulated),
            submittedAt: r.submittedAt.toISOString(),
            clientResponseId:
              typeof rawAns.clientResponseId === 'string'
                ? rawAns.clientResponseId
                : undefined,
          };
        });

        const existingInMod = mergedSurveysBySlug.get(row.publicSlug);
        const dbQuestions = (row.questionsJsonb || []) as SurveyQuestionItem[];
        const chosenQuestions =
          (existingInMod?.questions?.length || 0) >= dbQuestions.length &&
          (existingInMod?.questions?.length || 0) > 0
            ? existingInMod!.questions
            : dbQuestions;

        const mergedResponses = deduplicateSurveyResponses([
          ...mappedDbResponses,
          ...(existingInMod?.responses || []),
        ]);

        const dbInsights =
          row.aiInsightsSummaryJsonb &&
          Object.keys(row.aiInsightsSummaryJsonb as object).length > 0
            ? (row.aiInsightsSummaryJsonb as SurveyAiInsightsSummary)
            : undefined;

        const rowMeta = (row.outreachTemplatesJsonb || {}) as Partial<SurveyOutreachTemplates> & {
          isPublished?: boolean;
          publishedAt?: string;
        };
        const isPublished =
          typeof rowMeta.isPublished === 'boolean'
            ? rowMeta.isPublished
            : Boolean(existingInMod?.isPublished) ||
              mergedResponses.some((r) => !r.isSimulated);
        const publishedAt =
          rowMeta.publishedAt ||
          existingInMod?.publishedAt ||
          (isPublished ? row.createdAt.toISOString() : undefined);

        const dbOutreachTemplates: SurveyOutreachTemplates | undefined =
          rowMeta.linkedinDm || rowMeta.communityPost || rowMeta.whatsappBlurb
            ? {
                linkedinDm: rowMeta.linkedinDm || '',
                communityPost: rowMeta.communityPost || '',
                whatsappBlurb: rowMeta.whatsappBlurb || '',
                coldEmailSubject: rowMeta.coldEmailSubject,
                coldEmailBody: rowMeta.coldEmailBody,
                inPersonPitch: rowMeta.inPersonPitch,
                customChannelName: rowMeta.customChannelName,
                customChannelMessage: rowMeta.customChannelMessage,
                qrFlyerHeadline: rowMeta.qrFlyerHeadline,
                qrFlyerSubtext: rowMeta.qrFlyerSubtext,
                lastGeneratedAt: rowMeta.lastGeneratedAt,
              }
            : undefined;

        mergedSurveysBySlug.set(row.publicSlug, {
          id: existingInMod?.id || row.id,
          planId: row.planId,
          publicSlug: row.publicSlug,
          title:
            row.title === 'Untitled Customer Survey' && existingInMod?.title
              ? existingInMod.title
              : row.title === 'Untitled Customer Survey'
                ? ''
                : row.title,
          introDescription:
            existingInMod?.introDescription || row.introDescription || '',
          isActive: row.isActive,
          isPublished,
          publishedAt,
          collectLeadEmails: row.collectLeadEmails,
          waitlistIncentiveText:
            existingInMod?.waitlistIncentiveText ||
            row.waitlistIncentiveText ||
            '',
          focusAreas: existingInMod?.focusAreas || [
            'PROBLEM_AND_PAIN',
            'CURRENT_WORKAROUNDS',
          ],
          otherFocusAreaText: existingInMod?.otherFocusAreaText || '',
          customAiFocusPrompt: existingInMod?.customAiFocusPrompt || '',
          questions: chosenQuestions,
          responses: mergedResponses,
          outreachTemplates:
            existingInMod?.outreachTemplates || dbOutreachTemplates,
          interviewLogs:
            existingInMod?.interviewLogs ||
            (Array.isArray(row.interviewLogsJsonb)
              ? (row.interviewLogsJsonb as SavedCustomerInterviewLog[])
              : []),
          aiInsightsSummary: existingInMod?.aiInsightsSummary || dbInsights,
          createdAt: existingInMod?.createdAt || row.createdAt.toISOString(),
          updatedAt: existingInMod?.updatedAt || row.createdAt.toISOString(),
        });
      }
    } catch (err) {
      console.warn(
        `[SPF Auth] Non-fatal error hydrating relational surveys for plan ${plan.id}:`,
        err
      );
    }

    const explicitSlugsInModC = new Set(
      (modCInputs.surveys || [])
        .map((s) => s?.publicSlug)
        .filter((slug): slug is string => Boolean(slug))
    );
    const allCandidateSurveys = Array.from(mergedSurveysBySlug.values());
    const nonBlankSurveys = allCandidateSurveys.filter(
      (s) =>
        s.questions.length > 0 ||
        s.responses.length > 0 ||
        Boolean(s.aiInsightsSummary) ||
        Boolean(s.title.trim()) ||
        s.id === modCInputs.activeSurveyId ||
        explicitSlugsInModC.has(s.publicSlug)
    );
    const finalSurveys =
      nonBlankSurveys.length > 0
        ? nonBlankSurveys
        : allCandidateSurveys.slice(0, 1);

    const resolvedActiveSurveyId =
      modCInputs.activeSurveyId &&
      finalSurveys.some((s) => s.id === modCInputs.activeSurveyId)
        ? modCInputs.activeSurveyId
        : finalSurveys[0]?.id;

    // Merge interview logs from modCInputs and any relational surveys
    const mergedInterviewsById = new Map<string, SavedCustomerInterviewLog>();
    for (const log of modCInputs.interviewLogs || []) {
      if (log?.id) mergedInterviewsById.set(log.id, log);
    }
    for (const srv of allCandidateSurveys) {
      for (const log of srv.interviewLogs || []) {
        if (log?.id && !mergedInterviewsById.has(log.id)) {
          mergedInterviewsById.set(log.id, log);
        }
      }
    }
    const finalInterviewLogs = Array.from(mergedInterviewsById.values());

    const hasModCData =
      Boolean(modC) || finalSurveys.length > 0 || finalInterviewLogs.length > 0;

    let questionRows: Array<typeof openQuestionsParkingLot.$inferSelect> = [];
    try {
      questionRows = await db
        .select()
        .from(openQuestionsParkingLot)
        .where(eq(openQuestionsParkingLot.planId, plan.id));
    } catch (err) {
      console.warn(
        `[SPF Auth] Non-fatal error loading open questions for plan ${plan.id}:`,
        err
      );
    }

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
      founderMotivation: structuredInputs.founderMotivation,
      teamAndBudget: structuredInputs.teamAndBudget,
      founderRealityCheck: structuredInputs.founderRealityCheck,
      grantEligibilityCheck: structuredInputs.grantEligibilityCheck,
      thingsToConsider: Array.isArray(modA?.aiThingsToConsiderJsonb)
        ? modA.aiThingsToConsiderJsonb
        : undefined,
      moduleBData: modB
        ? {
            ...modBInputs,
            thingsToConsider: Array.isArray(modB.aiThingsToConsiderJsonb)
              ? modB.aiThingsToConsiderJsonb
              : modBInputs.thingsToConsider,
          }
        : undefined,
      moduleCData: hasModCData
        ? {
            ...modCInputs,
            surveys: finalSurveys,
            activeSurveyId: resolvedActiveSurveyId,
            interviewLogs: finalInterviewLogs,
            thingsToConsider: Array.isArray(modC?.aiThingsToConsiderJsonb)
              ? modC.aiThingsToConsiderJsonb
              : modCInputs.thingsToConsider,
          }
        : undefined,
      moduleDData: modD
        ? {
            ...modDInputs,
            thingsToConsider: Array.isArray(modD.aiThingsToConsiderJsonb)
              ? modD.aiThingsToConsiderJsonb
              : modDInputs.thingsToConsider,
          }
        : undefined,
      moduleEData: modE
        ? {
            ...modEInputs,
            thingsToConsider: Array.isArray(modE.aiThingsToConsiderJsonb)
              ? modE.aiThingsToConsiderJsonb
              : modEInputs.thingsToConsider,
          }
        : undefined,
      masterDocumentData:
        modKInputs.masterDocumentData || structuredInputs.masterDocumentData,
      openQuestions: questionRows.map((q) => q.questionText),
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
        // Never transmit raw or encrypted BYOK key material to the browser
        customApiKeyEncrypted: entRow.customApiKeyEncrypted
          ? 'enc_gemini_byok_active'
          : null,
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

  const rateLimit = checkRateLimit(`auth:register:${cleanEmail}`, 5, 10 * 60_000);
  if (!rateLimit.allowed) {
    return {
      ok: false,
      error: `Too many registration attempts. Please wait ${rateLimit.retryAfterSeconds} seconds and try again.`,
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
    if (cleanCode.startsWith('SPF-') || cleanCode.startsWith('BMU-')) {
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
    } else if (cleanCode.startsWith('SPF-') || cleanCode.startsWith('BMU-')) {
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
      '[SPF Auth] PostgreSQL unreachable during register; using local fallback:',
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

  const rateLimit = checkRateLimit(`auth:login:${cleanEmail}`, 8, 10 * 60_000);
  if (!rateLimit.allowed) {
    return {
      ok: false,
      error: `Too many sign-in attempts. Please wait ${rateLimit.retryAfterSeconds} seconds before trying again.`,
      mode: 'cloud_sql',
    };
  }

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

    if (foundUser.status === 'SOFT_DELETED') {
      return {
        ok: false,
        error:
          'This account has been deactivated and moved to trash. Please contact support to restore your account.',
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
      '[SPF Auth] PostgreSQL unreachable during login; using local fallback:',
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

    await ensureDatabaseSchemaSynced();

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

    const cleanTitle = input.planTitle.trim() || 'My First Startup Plan';
    const cleanSummary = input.oneLinerSummary.trim();

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

    const initialTeamType =
      input.teamStructure === 'CO_FOUNDERS'
        ? 'COFOUNDER_TEAM'
        : input.teamStructure === 'LOOKING_FOR_COFOUNDER'
          ? 'SEEKING_COFOUNDER'
          : 'SOLO_FOUNDER';

    await db.insert(planModulesData).values({
      planId: createdPlan.id,
      moduleCode: 'MOD_A_IDEATION',
      structuredInputsJsonb: {
        brainDumpText: cleanSummary,
        exportPotential: input.exportPotential,
        teamAndBudget: {
          teamStructureType: initialTeamType,
          skillCoverage: 'BUILD_IN_HOUSE',
          startingBudgetBracket: '1K_TO_5K',
          teamAndFundingNotes: '',
        },
      },
      aiThingsToConsiderJsonb: [],
      completionPercentage: cleanSummary ? 15 : 0,
    });

    const session = await buildSessionFromDbUser(updatedUser);
    return {
      ok: true,
      mode: 'cloud_sql',
      session,
    };
  } catch (err) {
    console.warn(
      '[SPF Auth] PostgreSQL unreachable during onboarding; using local fallback:',
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

    if (!dbUser || dbUser.status === 'SUSPENDED' || dbUser.status === 'SOFT_DELETED') {
      if (dbUser && (dbUser.status === 'SUSPENDED' || dbUser.status === 'SOFT_DELETED')) {
        await clearServerSessionCookie();
      }
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

/**
 * Encrypts and stores (or clears) a Bring-Your-Own-Key (BYOK) Gemini API key at rest
 * using AES-256-GCM in PostgreSQL (`user_entitlements.custom_api_key_encrypted`).
 * Never returns raw key material to the browser.
 */
export async function saveByokApiKeyServerAction(rawApiKey: string): Promise<{
  ok: boolean;
  hasActiveKey: boolean;
  error?: string;
}> {
  try {
    const cookiePayload = await getServerSessionCookie();
    if (!cookiePayload) {
      return { ok: false, hasActiveKey: false, error: 'Not authenticated' };
    }
    const trimmed = rawApiKey.trim();
    const encryptedValue = trimmed ? encryptByokApiKey(trimmed) : null;

    await db
      .update(userEntitlements)
      .set({
        customApiKeyEncrypted: encryptedValue,
        updatedAt: new Date(),
      })
      .where(eq(userEntitlements.userId, cookiePayload.userId));

    return {
      ok: true,
      hasActiveKey: Boolean(encryptedValue),
    };
  } catch (err) {
    return {
      ok: false,
      hasActiveKey: false,
      error: err instanceof Error ? err.message : 'Failed to save BYOK key',
    };
  }
}
