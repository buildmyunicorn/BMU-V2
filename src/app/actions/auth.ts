'use server';

import { eq, desc, and, lt, sql } from 'drizzle-orm';
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
  getTrustedClientIp,
  getVerifiedActiveFounderFromCookie,
  verifyActiveSessionAndPlanOwnership,
  ensureDefaultTenantId,
} from '@/lib/auth/server-auth';
import {
  VALID_BYOK_GEMINI_KEY_REGEX,
  calculateAppSumoTierLimits,
  calculatePassLimits,
  isEntitlementInVaultMode,
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
  type SavedModuleFData,
  type SavedModuleGData,
  type SavedModuleHData,
  type SavedModuleIData,
  type SavedModuleJData,
  type SavedModuleKData,
  type SavedModuleLData,
  type SavedMasterDocumentData,
  type SavedValidationSurvey,
  type SavedSurveyResponse,
  type SurveyQuestionItem,
  type SurveyResponseAnswerValue,
  type SurveyAiInsightsSummary,
  type SurveyOutreachTemplates,
  type SavedCustomerInterviewLog,
} from '@/lib/auth/session-store';
import { sendSystemEmail } from '@/lib/email/send';
import { EMAIL_DEFAULTS } from '@/lib/email/resend';
import { dispatchAdminSignupAlert } from '@/lib/email/admin-alerts';

export interface AuthActionResult {
  ok: boolean;
  error?: string;
  mode: 'cloud_sql' | 'local_fallback';
  session?: BmuLocalSession;
}

// Internal tenant helper moved to src/lib/auth/server-auth.ts so it is not exposed as a public Server Action.

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
      .where(
        and(
          eq(vouchers.redeemedByUserId, dbUser.id),
          eq(vouchers.status, 'REDEEMED')
        )
      );
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
    const modF = modRows.find((m) => m.moduleCode === 'MOD_F_COFOUNDER_TEAM');
    const modG = modRows.find((m) => m.moduleCode === 'MOD_G_LAUNCHPAD');
    const modH = modRows.find((m) => m.moduleCode === 'MOD_H_REVENUE');
    const modI = modRows.find((m) => m.moduleCode === 'MOD_I_MARKETING');
    const modJ = modRows.find((m) => m.moduleCode === 'MOD_J_FINANCE');
    const modKGrants = modRows.find(
      (m) => m.moduleCode === 'MOD_K_GRANTS_FUNDING'
    );
    const modL = modRows.find(
      (m) =>
        m.moduleCode === 'MOD_L_BUSINESS_PLAN' ||
        (m.moduleCode as string) === 'MOD_K_BUSINESS_PLAN'
    );
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
    const modFInputs = (modF?.structuredInputsJsonb ?? {}) as SavedModuleFData;
    const modGInputs = (modG?.structuredInputsJsonb ?? {}) as SavedModuleGData;
    const modHInputs = (modH?.structuredInputsJsonb ?? {}) as SavedModuleHData;
    const modIInputs = (modI?.structuredInputsJsonb ?? {}) as SavedModuleIData;
    const modJInputs = (modJ?.structuredInputsJsonb ?? {}) as SavedModuleJData;
    const modKGrantsInputs = (modKGrants?.structuredInputsJsonb ??
      {}) as SavedModuleKData;
    const modLInputs = (modL?.structuredInputsJsonb ?? {}) as SavedModuleLData & {
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
      fundingTrackMode:
        (plan.grantComplianceMetadataJson as { fundingTrackMode?: 'GRANT_AND_INVESTOR' | 'COMMERCIAL_ONLY' } | null)?.fundingTrackMode ||
        (structuredInputs as { fundingTrackMode?: 'GRANT_AND_INVESTOR' | 'COMMERCIAL_ONLY' })?.fundingTrackMode ||
        (plan.hqCountryCode === 'IE' || plan.hqCountryCode === 'GB'
          ? 'GRANT_AND_INVESTOR'
          : 'COMMERCIAL_ONLY'),
      currentModuleStep: plan.currentModuleStep || 'MOD_A_STEP_1',
      isPivot: Boolean(plan.parentPlanId),
      brainDumpText: structuredInputs.brainDumpText || plan.oneLinerSummary || '',
      conceptCanvas: structuredInputs.conceptCanvas,
      founderMotivation: structuredInputs.founderMotivation,
      teamAndBudget: structuredInputs.teamAndBudget,
      founderRealityCheck: structuredInputs.founderRealityCheck
        ? {
            ...structuredInputs.founderRealityCheck,
            dealbreakers: Array.isArray(
              structuredInputs.founderRealityCheck.dealbreakers
            )
              ? structuredInputs.founderRealityCheck.dealbreakers
              : [],
          }
        : undefined,
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
      moduleFData: modF
        ? (() => {
            const callerEmail = (dbUser.email || '').trim().toLowerCase();
            const teamMembers = modFInputs.promoterProfiles?.teamMembers || [];
            const rawStep4 = modFInputs.step4AlignmentData;
            const redactedStep4 =
              rawStep4 && !rawStep4.isRevealed && Array.isArray(rawStep4.responses)
                ? {
                    ...rawStep4,
                    responses: rawStep4.responses.map((resp) => {
                      const matchedMember = teamMembers.find(
                        (m) => m.id === resp.memberId
                      );
                      const memberEmail = (matchedMember?.email || '')
                        .trim()
                        .toLowerCase();
                      const isOtherVerifiedParticipant =
                        (Boolean(memberEmail) && memberEmail !== callerEmail) ||
                        (plan.ownerUserId !== dbUser.id &&
                          (!memberEmail || memberEmail !== callerEmail));
                      if (!isOtherVerifiedParticipant) {
                        return resp;
                      }
                      const lockedAnswers: typeof resp.answers = {};
                      for (const [qKey, ans] of Object.entries(
                        resp.answers || {}
                      )) {
                        if (ans) {
                          lockedAnswers[qKey] = {
                            questionKey: ans.questionKey,
                            selectedOption: '[LOCKED_UNTIL_REVEAL]',
                          };
                        }
                      }
                      return {
                        ...resp,
                        answers: lockedAnswers,
                      };
                    }),
                  }
                : rawStep4;

            return {
              ...modFInputs,
              ...(redactedStep4 ? { step4AlignmentData: redactedStep4 } : {}),
              completionPercentage:
                modF.completionPercentage ?? modFInputs.completionPercentage,
              thingsToConsider: Array.isArray(modF.aiThingsToConsiderJsonb)
                ? modF.aiThingsToConsiderJsonb
                : modFInputs.thingsToConsider,
            };
          })()
        : undefined,
      moduleGData: modG
        ? {
            ...modGInputs,
            completionPercentage:
              modG.completionPercentage ?? modGInputs.completionPercentage,
            thingsToConsider: Array.isArray(modG.aiThingsToConsiderJsonb)
              ? modG.aiThingsToConsiderJsonb
              : modGInputs.thingsToConsider,
          }
        : undefined,
      moduleHData: modH
        ? {
            ...modHInputs,
            completionPercentage:
              modH.completionPercentage ?? modHInputs.completionPercentage,
            thingsToConsider: Array.isArray(modH.aiThingsToConsiderJsonb)
              ? modH.aiThingsToConsiderJsonb
              : modHInputs.thingsToConsider,
          }
        : undefined,
      moduleIData: modI
        ? {
            ...modIInputs,
            completionPercentage:
              modI.completionPercentage ?? modIInputs.completionPercentage,
            thingsToConsider: Array.isArray(modI.aiThingsToConsiderJsonb)
              ? modI.aiThingsToConsiderJsonb
              : modIInputs.thingsToConsider,
          }
        : undefined,
      moduleJData: modJ
        ? {
            ...modJInputs,
            completionPercentage:
              modJ.completionPercentage ?? modJInputs.completionPercentage,
            thingsToConsider: Array.isArray(modJ.aiThingsToConsiderJsonb)
              ? modJ.aiThingsToConsiderJsonb
              : modJInputs.thingsToConsider,
          }
        : undefined,
      moduleKData: modKGrants
        ? {
            ...modKGrantsInputs,
            completionPercentage:
              modKGrants.completionPercentage ??
              modKGrantsInputs.completionPercentage,
            thingsToConsider: Array.isArray(modKGrants.aiThingsToConsiderJsonb)
              ? modKGrants.aiThingsToConsiderJsonb
              : modKGrantsInputs.thingsToConsider,
          }
        : undefined,
      grantCenterData: modKGrantsInputs.grantCenterData,
      moduleLData: modL
        ? {
            ...modLInputs,
            step1Mode: modLInputs.step1Mode,
            step2Audit: modLInputs.step2Audit,
            step3Compiler: modLInputs.step3Compiler,
            step4Appendices: modLInputs.step4Appendices,
            step5DossierBrief: modLInputs.step5DossierBrief,
            versions: modLInputs.versions,
            activeVersionId: modLInputs.activeVersionId,
            completionPercentage:
              modL.completionPercentage ?? modLInputs.completionPercentage,
            thingsToConsider: Array.isArray(modL.aiThingsToConsiderJsonb)
              ? modL.aiThingsToConsiderJsonb
              : modLInputs.thingsToConsider,
            lastSavedAt: modLInputs.lastSavedAt,
          }
        : undefined,
      masterDocumentData:
        modLInputs.masterDocumentData || structuredInputs.masterDocumentData,
      openQuestions: questionRows.map((q) => q.questionText),
    });
  }

  let cohortCode: string | undefined;
  if (dbUser.cohortId) {
    try {
      const [cohortRow] = await db
        .select({ inviteCode: cohorts.inviteCode })
        .from(cohorts)
        .where(eq(cohorts.id, dbUser.cohortId))
        .limit(1);
      if (cohortRow) {
        cohortCode = cohortRow.inviteCode;
      }
    } catch {
      // Non-fatal
    }
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
        isVaultReadonly: isEntitlementInVaultMode({
          planType: entRow.planType,
          accessExpiresAt: entRow.accessExpiresAt,
          isVaultReadonly: entRow.isVaultReadonly,
        }),
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
      cohortCode,
      founderStage: (profile.founderStage as FounderStage) || undefined,
      teamStructure: (profile.teamStructure as TeamStructure) || undefined,
      primaryHat: profile.primaryHat || undefined,
      regionOrCounty: profile.regionOrCounty || undefined,
      onboardingCompleted: mappedPlans.length > 0,
    },
    entitlement,
    redeemedCodes: userVouchers.map((v) => v.code),
    plans: mappedPlans,
    activePlanId:
      typeof profile.lastActivePlanId === 'string' &&
      mappedPlans.some((p) => p.id === profile.lastActivePlanId)
        ? profile.lastActivePlanId
        : mappedPlans[0]?.id || '',
  };
}

/**
 * Persists the user's active plan selection to their profile in Cloud SQL PostgreSQL.
 */
export async function setActivePlanServerAction(planId: string): Promise<void> {
  try {
    const cleanPlanId = typeof planId === 'string' ? planId.trim() : '';
    if (!cleanPlanId) return;

    const verified = await verifyActiveSessionAndPlanOwnership(cleanPlanId);
    if (!verified.authorized || !verified.userId) return;

    const [dbUser] = await db
      .select({ id: users.id, founderProfileJson: users.founderProfileJson })
      .from(users)
      .where(eq(users.id, verified.userId))
      .limit(1);

    if (!dbUser) return;

    const existingProfile =
      (dbUser.founderProfileJson as Record<string, unknown>) || {};
    await db
      .update(users)
      .set({
        founderProfileJson: {
          ...existingProfile,
          lastActivePlanId: cleanPlanId,
        },
        updatedAt: new Date(),
      })
      .where(eq(users.id, dbUser.id));
  } catch (err) {
    console.warn('[SPF Auth] Non-fatal error persisting active plan to DB:', err);
  }
}

/**
 * Registers a new founder in Cloud SQL PostgreSQL with hashed password and entitlement row.
 */
export async function registerFounderAction(input: {
  name: string;
  email: string;
  password: string;
  voucherOrCohortCode?: string;
  acceptedTerms?: boolean;
}): Promise<AuthActionResult> {
  if (
    typeof input?.email !== 'string' ||
    typeof input?.password !== 'string' ||
    typeof input?.name !== 'string'
  ) {
    return {
      ok: false,
      error: 'Invalid registration payload.',
      mode: 'cloud_sql',
    };
  }

  const cleanEmail = input.email.trim().toLowerCase();
  const cleanName = input.name.trim().slice(0, 120) || 'New Founder';
  const cleanCode =
    typeof input.voucherOrCohortCode === 'string'
      ? input.voucherOrCohortCode.trim().toUpperCase().slice(0, 64)
      : '';

  if (!input.acceptedTerms) {
    return {
      ok: false,
      error:
        'Please agree to the Terms of Service and Privacy Policy before creating your account.',
      mode: 'cloud_sql',
    };
  }

  if (
    !cleanEmail ||
    !cleanEmail.includes('@') ||
    input.password.length < 8 ||
    input.password.length > 128
  ) {
    return {
      ok: false,
      error:
        'Please enter a valid email and a password between 8 and 128 characters.',
      mode: 'cloud_sql',
    };
  }

  const clientIp = await getTrustedClientIp();
  const emailRateLimit = checkRateLimit(
    `auth:register:${cleanEmail}`,
    5,
    10 * 60_000
  );
  const ipRateLimit = checkRateLimit(
    `auth:register:ip:${clientIp}`,
    10,
    10 * 60_000
  );
  if (!emailRateLimit.allowed || !ipRateLimit.allowed) {
    const retryAfter = Math.max(
      emailRateLimit.retryAfterSeconds,
      ipRateLimit.retryAfterSeconds
    );
    return {
      ok: false,
      error: `Too many registration attempts. Please wait ${retryAfter} seconds and try again.`,
      mode: 'cloud_sql',
    };
  }

  if (cleanCode) {
    const codeIpLimit = checkRateLimit(
      `auth:register:code:${clientIp}`,
      6,
      15 * 60_000
    );
    if (!codeIpLimit.allowed) {
      return {
        ok: false,
        error: `Too many voucher/cohort code attempts. Please wait ${codeIpLimit.retryAfterSeconds} seconds.`,
        mode: 'cloud_sql',
      };
    }
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

    let matchedCohort: (typeof cohorts.$inferSelect) | null = null;
    let matchedVoucher: (typeof vouchers.$inferSelect) | null = null;

    if (cleanCode) {
      await ensureDatabaseSchemaSynced();
      const cleanAlpha = cleanCode.replace(/[^A-Z0-9]/gi, '').toUpperCase();

      // 1. Check Institutional Cohort (exact match or hyphen-agnostic match)
      const [foundCohort] = await db
        .select()
        .from(cohorts)
        .where(
          sql`UPPER(${cohorts.inviteCode}) = ${cleanCode} OR UPPER(REPLACE(${cohorts.inviteCode}, '-', '')) = ${cleanAlpha}`
        )
        .limit(1);

      if (foundCohort) {
        if (
          foundCohort.expiresAt &&
          new Date(foundCohort.expiresAt).getTime() < Date.now()
        ) {
          return {
            ok: false,
            error: `Institutional cohort code "${cleanCode}" has expired.`,
            mode: 'cloud_sql',
          };
        }
        if (foundCohort.seatsUsed >= foundCohort.maxSeats) {
          return {
            ok: false,
            error: `Cohort "${foundCohort.name}" has reached its maximum capacity (${foundCohort.maxSeats} seats). Please contact your program administrator.`,
            mode: 'cloud_sql',
          };
        }
        matchedCohort = foundCohort;
      } else {
        // 2. Check Single-Use Voucher (exact match or hyphen-agnostic match)
        const [foundVoucher] = await db
          .select()
          .from(vouchers)
          .where(
            sql`UPPER(${vouchers.code}) = ${cleanCode} OR UPPER(REPLACE(${vouchers.code}, '-', '')) = ${cleanAlpha}`
          )
          .limit(1);

        if (!foundVoucher) {
          return {
            ok: false,
            error: `Invalid voucher or cohort code "${cleanCode}". Please check your code or leave it blank to start on the Free tier.`,
            mode: 'cloud_sql',
          };
        }
        if (foundVoucher.status === 'REDEEMED') {
          return {
            ok: false,
            error: `This voucher code (${cleanCode}) has already been redeemed by another account. Individual voucher codes are single-use. If you are part of an accelerator or testing cohort, please use your shared cohort invite code.`,
            mode: 'cloud_sql',
          };
        }
        if (foundVoucher.status !== 'UNCLAIMED') {
          return {
            ok: false,
            error: `Voucher ${cleanCode} has been revoked or is no longer valid.`,
            mode: 'cloud_sql',
          };
        }
        matchedVoucher = foundVoucher;
      }
    }

    const cohortId: string | null = matchedCohort ? matchedCohort.id : null;
    const passwordHash = hashPassword(input.password);

    const createdUser = await db.transaction(async (tx) => {
      if (matchedCohort) {
        const claimedCohort = await tx
          .update(cohorts)
          .set({ seatsUsed: sql`${cohorts.seatsUsed} + 1` })
          .where(
            and(
              eq(cohorts.id, matchedCohort.id),
              lt(cohorts.seatsUsed, cohorts.maxSeats)
            )
          )
          .returning({ id: cohorts.id });
        if (claimedCohort.length === 0) {
          throw new Error('COHORT_FULL_RACE');
        }
      }

      const [insertedUser] = await tx
        .insert(users)
        .values({
          tenantId,
          cohortId,
          email: cleanEmail,
          name: cleanName,
          passwordHash,
          // Password signups start with emailVerified: false until confirmed via email or Google OAuth
          // (Founders still enter Module A immediately with zero UX friction, while Cohort Staff & OAuth merge require verified email)
          emailVerified: false,
          role: 'FOUNDER',
          status: 'ACTIVE',
          founderProfileJson: {
            termsAcceptedAt: new Date().toISOString(),
            termsVersion: '2026-04',
          },
        })
        .returning();

      if (matchedVoucher) {
        const claimedVoucher = await tx
          .update(vouchers)
          .set({
            status: 'REDEEMED',
            redeemedByUserId: insertedUser.id,
            redeemedAt: new Date(),
          })
          .where(
            and(
              eq(vouchers.id, matchedVoucher.id),
              eq(vouchers.status, 'UNCLAIMED')
            )
          )
          .returning({ id: vouchers.id });
        if (claimedVoucher.length === 0) {
          throw new Error('VOUCHER_ALREADY_REDEEMED_RACE');
        }
      }

      if (matchedCohort) {
        const durationMonths = matchedCohort.accessDurationMonths || 6;
        const cohortLimits = calculatePassLimits('COHORT_PASS', durationMonths);
        await tx.insert(userEntitlements).values({
          userId: insertedUser.id,
          planType: 'COHORT_PASS',
          stackedCodesCount: 0,
          maxStartupPlans: cohortLimits.maxStartupPlans,
          maxSeatsPerPlan: cohortLimits.maxSeatsPerPlan,
          monthlyAiCreditsLimit: cohortLimits.monthlyAiCreditsLimit,
          aiCreditsUsedThisMonth: 0,
          whiteLabelExportEnabled: false,
          accessExpiresAt:
            matchedCohort.expiresAt || cohortLimits.accessExpiresAt,
          isVaultReadonly: false,
        });
      } else if (matchedVoucher) {
        const rewardType = matchedVoucher.rewardType || 'APPSUMO_LTD';
        const durationMonths = matchedVoucher.durationMonths || 6;

        if (rewardType === 'APPSUMO_LTD') {
          const sumoLimits = calculateAppSumoTierLimits(1);
          await tx.insert(userEntitlements).values({
            userId: insertedUser.id,
            planType: 'APPSUMO_LTD',
            stackedCodesCount: 1,
            maxStartupPlans: sumoLimits.maxStartupPlans,
            maxSeatsPerPlan: sumoLimits.maxSeatsPerPlan,
            monthlyAiCreditsLimit: sumoLimits.monthlyAiCreditsLimit,
            aiCreditsUsedThisMonth: 0,
            whiteLabelExportEnabled: sumoLimits.whiteLabelExportEnabled,
            isVaultReadonly: false,
          });
        } else {
          const passType =
            rewardType === 'PASS_COFOUNDER'
              ? 'SIX_MONTH_COFOUNDER'
              : 'SIX_MONTH_SOLO';
          const passLimits = calculatePassLimits(passType, durationMonths);
          await tx.insert(userEntitlements).values({
            userId: insertedUser.id,
            planType: passType,
            stackedCodesCount: 0,
            maxStartupPlans: passLimits.maxStartupPlans,
            maxSeatsPerPlan: passLimits.maxSeatsPerPlan,
            monthlyAiCreditsLimit: passLimits.monthlyAiCreditsLimit,
            aiCreditsUsedThisMonth: 0,
            whiteLabelExportEnabled: false,
            accessExpiresAt: passLimits.accessExpiresAt,
            isVaultReadonly: false,
          });
        }
      } else {
        const freeLimits = calculatePassLimits('FREE_HOOK');
        await tx.insert(userEntitlements).values({
          userId: insertedUser.id,
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

      return insertedUser;
    });

    await setServerSessionCookie({
      userId: createdUser.id,
      email: createdUser.email,
      sessionVersion: createdUser.sessionVersion ?? 1,
    });

    const now = new Date();
    const activatedDateStr = new Intl.DateTimeFormat('en-IE', {
      dateStyle: 'long',
    }).format(now);

    let emailTierName = 'Free Hook (Module A)';
    let emailValidUntilStr: string | undefined;
    let emailMaxPlans: number | undefined;
    let emailMaxSeats: number | undefined;
    let emailAiCredits: number | undefined;

    if (matchedCohort) {
      const durationMonths = matchedCohort.accessDurationMonths || 6;
      const cohortLimits = calculatePassLimits('COHORT_PASS', durationMonths);
      const cohortExpires =
        matchedCohort.expiresAt || cohortLimits.accessExpiresAt;
      emailTierName = `${matchedCohort.name} Cohort Pass`;
      emailValidUntilStr = cohortExpires
        ? new Intl.DateTimeFormat('en-IE', { dateStyle: 'long' }).format(cohortExpires)
        : 'Active Cohort Term';
      emailMaxPlans = cohortLimits.maxStartupPlans;
      emailMaxSeats = cohortLimits.maxSeatsPerPlan;
      emailAiCredits = cohortLimits.monthlyAiCreditsLimit;
    } else if (matchedVoucher) {
      const rewardType = matchedVoucher.rewardType || 'APPSUMO_LTD';
      const durationMonths = matchedVoucher.durationMonths || 6;
      if (rewardType === 'APPSUMO_LTD') {
        const sumoLimits = calculateAppSumoTierLimits(1);
        emailTierName = sumoLimits.tierName;
        emailValidUntilStr = 'Lifetime Access (Never Expires)';
        emailMaxPlans = sumoLimits.maxStartupPlans;
        emailMaxSeats = sumoLimits.maxSeatsPerPlan;
        emailAiCredits = sumoLimits.monthlyAiCreditsLimit;
      } else {
        const passType =
          rewardType === 'PASS_COFOUNDER'
            ? 'SIX_MONTH_COFOUNDER'
            : 'SIX_MONTH_SOLO';
        const passLimits = calculatePassLimits(passType, durationMonths);
        emailTierName =
          rewardType === 'PASS_COFOUNDER'
            ? `Partner Co-Founder Pass (${durationMonths} Months)`
            : `Partner Solo Pass (${durationMonths} Months)`;
        emailValidUntilStr = passLimits.accessExpiresAt
          ? new Intl.DateTimeFormat('en-IE', { dateStyle: 'long' }).format(passLimits.accessExpiresAt)
          : `${durationMonths} Months`;
        emailMaxPlans = passLimits.maxStartupPlans;
        emailMaxSeats = passLimits.maxSeatsPerPlan;
        emailAiCredits = passLimits.monthlyAiCreditsLimit;
      }
    }

    // Fire asynchronous Welcome Email via Resend without blocking registration
    sendSystemEmail({
      to: createdUser.email,
      replyTo: 'Tom@startuppreflight.com',
      template: 'WELCOME_FOUNDER',
      subject: matchedVoucher || matchedCohort
        ? `Pass Activated: Welcome to Startup Preflight — ${emailTierName}`
        : 'Welcome to Startup Preflight — Your Founder Workspace is Ready',
      props: {
        founderName: createdUser.name || undefined,
        loginEmail: createdUser.email,
        loginUrl: `${EMAIL_DEFAULTS.appUrl}/workspace`,
        tierName: emailTierName,
        hqCountry: 'IE',
        activatedDate: activatedDateStr,
        validUntilDate: emailValidUntilStr,
        voucherCode: cleanCode || undefined,
        maxPlans: emailMaxPlans,
        maxSeats: emailMaxSeats,
        aiCreditsMonthly: emailAiCredits,
      },
      metadata: {
        userId: createdUser.id,
        trigger: 'REGISTRATION',
        cohortId: cohortId,
        inviteCode: cleanCode || undefined,
      },
    }).catch((emailErr) => {
      console.error('[SPF Email] Failed to send welcome email upon registration:', emailErr);
    });

    // Notify admin asynchronously if configured (zero latency on registration response)
    dispatchAdminSignupAlert({
      founderName: cleanName,
      founderEmail: cleanEmail,
      authMethod: 'EMAIL_PASSWORD',
      tierName: emailTierName,
      hqCountry: 'IE',
      voucherCode: cleanCode || undefined,
      cohortName: cohortId ? `Cohort #${cohortId}` : undefined,
    }).catch((adminAlertErr) => {
      console.warn('[SPF Email] Failed to dispatch admin signup alert:', adminAlertErr);
    });

    const session = await buildSessionFromDbUser(createdUser);
    return {
      ok: true,
      mode: 'cloud_sql',
      session,
    };
  } catch (err) {
    if (err instanceof Error && err.message === 'VOUCHER_ALREADY_REDEEMED_RACE') {
      return {
        ok: false,
        error: 'This voucher code was just claimed. Please use an unclaimed voucher code.',
        mode: 'cloud_sql',
      };
    }
    if (err instanceof Error && err.message === 'COHORT_FULL_RACE') {
      return {
        ok: false,
        error: 'This cohort has reached its maximum seat capacity.',
        mode: 'cloud_sql',
      };
    }

    const isDevOfflineAllowed =
      process.env.NODE_ENV === 'development' &&
      process.env.ALLOW_OFFLINE_DEV_AUTH === 'true';
    if (isDevOfflineAllowed) {
      await setServerSessionCookie({
        userId: 'local-founder-session',
        email: cleanEmail,
      });
      return {
        ok: true,
        mode: 'local_fallback',
      };
    }

    console.error(
      '[SPF Auth] Registration error:',
      err instanceof Error ? err.message : err
    );
    return {
      ok: false,
      error:
        'Authentication service is temporarily unavailable. Please try again shortly.',
      mode: 'cloud_sql',
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
  if (
    typeof input?.email !== 'string' ||
    typeof input?.password !== 'string' ||
    input.password.length === 0 ||
    input.password.length > 128
  ) {
    return {
      ok: false,
      error: 'Invalid email or password.',
      mode: 'cloud_sql',
    };
  }

  const cleanEmail = input.email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return {
      ok: false,
      error: 'Please enter a valid email address.',
      mode: 'cloud_sql',
    };
  }

  const clientIp = await getTrustedClientIp();
  const emailRateLimit = checkRateLimit(
    `auth:login:${cleanEmail}`,
    8,
    10 * 60_000
  );
  const ipRateLimit = checkRateLimit(
    `auth:login:ip:${clientIp}`,
    15,
    10 * 60_000
  );
  if (!emailRateLimit.allowed || !ipRateLimit.allowed) {
    const retryAfter = Math.max(
      emailRateLimit.retryAfterSeconds,
      ipRateLimit.retryAfterSeconds
    );
    return {
      ok: false,
      error: `Too many sign-in attempts. Please wait ${retryAfter} seconds before trying again.`,
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

    // Verify password hash strictly. Never allow unauthenticated password overwrite on Google OAuth accounts.
    if (foundUser.passwordHash) {
      const isValid = verifyPassword(input.password, foundUser.passwordHash);
      if (!isValid) {
        return {
          ok: false,
          error: 'Invalid email or password. Please try again.',
          mode: 'cloud_sql',
        };
      }
    } else if (
      process.env.NODE_ENV !== 'production' &&
      (cleanEmail.endsWith('@startuppreflight.com') ||
        cleanEmail.endsWith('@buildmyunicorn.com') ||
        cleanEmail.endsWith('@example.com'))
    ) {
      // Only allow upgrading seeded demo user rows in local development
      const upgradedHash = hashPassword(input.password);
      await db
        .update(users)
        .set({ passwordHash: upgradedHash, lastActiveAt: new Date() })
        .where(eq(users.id, foundUser.id));
    } else {
      return {
        ok: false,
        error:
          'This account was created with Google Sign-In. Please click "Continue with Google" above, or use "Forgot Password" to set a password.',
        mode: 'cloud_sql',
      };
    }

    await db
      .update(users)
      .set({ lastActiveAt: new Date() })
      .where(eq(users.id, foundUser.id));

    await setServerSessionCookie({
      userId: foundUser.id,
      email: foundUser.email,
      sessionVersion: foundUser.sessionVersion ?? 1,
    });

    const session = await buildSessionFromDbUser(foundUser);
    return {
      ok: true,
      mode: 'cloud_sql',
      session,
    };
  } catch (err) {
    const isDevOfflineAllowed =
      process.env.NODE_ENV === 'development' &&
      process.env.ALLOW_OFFLINE_DEV_AUTH === 'true';
    if (isDevOfflineAllowed) {
      await setServerSessionCookie({
        userId: 'local-founder-session',
        email: cleanEmail,
      });
      return {
        ok: true,
        mode: 'local_fallback',
      };
    }

    console.error(
      '[SPF Auth] Login error:',
      err instanceof Error ? err.message : err
    );
    return {
      ok: false,
      error:
        'Authentication service is temporarily unavailable. Please try again shortly.',
      mode: 'cloud_sql',
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
  fundingTrackMode?: 'GRANT_AND_INVESTOR' | 'COMMERCIAL_ONLY';
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

    if (
      !dbUser ||
      dbUser.status !== 'ACTIVE' ||
      dbUser.deletedAt ||
      (cookiePayload.sv ?? 1) !== (dbUser.sessionVersion ?? 1)
    ) {
      return {
        ok: false,
        error: 'Unauthorized or suspended account.',
        mode: 'cloud_sql',
      };
    }

    const countryPack = getCountryRulePack(input.hqCountryCode);
    const isGrantRegion =
      input.hqCountryCode === 'IE' || input.hqCountryCode === 'GB';
    const resolvedTrack: 'GRANT_AND_INVESTOR' | 'COMMERCIAL_ONLY' = isGrantRegion
      ? input.fundingTrackMode === 'COMMERCIAL_ONLY'
        ? 'COMMERCIAL_ONLY'
        : 'GRANT_AND_INVESTOR'
      : 'COMMERCIAL_ONLY';
    const targetMarkets =
      input.exportPotential === 'EXPORTING_INTERNATIONALLY'
        ? Array.from(new Set([input.hqCountryCode, 'GB', 'EU', 'US']))
        : [input.hqCountryCode];

    const cleanTitle = input.planTitle.trim() || 'My First Startup Plan';
    const cleanSummary = input.oneLinerSummary.trim();
    const initialTeamType =
      input.teamStructure === 'CO_FOUNDERS'
        ? 'COFOUNDER_TEAM'
        : input.teamStructure === 'LOOKING_FOR_COFOUNDER'
          ? 'SEEKING_COFOUNDER'
          : 'SOLO_FOUNDER';

    const updatedUser = await db.transaction(async (tx) => {
      const [lockedEntRow] = await tx
        .select()
        .from(userEntitlements)
        .where(eq(userEntitlements.userId, dbUser.id))
        .for('update');

      const existingPlans = await tx
        .select({ id: startupPlans.id })
        .from(startupPlans)
        .where(eq(startupPlans.ownerUserId, dbUser.id));

      const maxAllowed = lockedEntRow?.maxStartupPlans ?? 1;
      if (existingPlans.length >= maxAllowed) {
        return dbUser;
      }

      const [createdPlan] = await tx
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
          grantComplianceMetadataJson: {
            fundingTrackMode: resolvedTrack,
          },
          currentModuleStep: 'MOD_A_STEP_1',
          status: 'ACTIVE',
        })
        .returning();

      await tx.insert(planModulesData).values({
        planId: createdPlan.id,
        moduleCode: 'MOD_A_IDEATION',
        structuredInputsJsonb: {
          brainDumpText: cleanSummary,
          exportPotential: input.exportPotential,
          fundingTrackMode: resolvedTrack,
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

      const [savedUser] = await tx
        .update(users)
        .set({
          founderProfileJson: {
            ...(dbUser.founderProfileJson || {}),
            founderStage: input.founderStage,
            teamStructure: input.teamStructure,
            primaryHat: input.primaryHat,
            regionOrCounty: input.regionOrCounty.trim(),
            lastActivePlanId: createdPlan.id,
          },
          updatedAt: new Date(),
        })
        .where(eq(users.id, dbUser.id))
        .returning();

      return savedUser ?? dbUser;
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

    if (
      !dbUser ||
      dbUser.status !== 'ACTIVE' ||
      dbUser.deletedAt ||
      (cookiePayload.sv ?? 1) !== (dbUser.sessionVersion ?? 1)
    ) {
      await clearServerSessionCookie();
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
    if (typeof rawApiKey !== 'string' || rawApiKey.length > 512) {
      return { ok: false, hasActiveKey: false, error: 'Invalid API key format.' };
    }

    const activeUser = await getVerifiedActiveFounderFromCookie();
    if (!activeUser) {
      return { ok: false, hasActiveKey: false, error: 'Not authenticated' };
    }

    const trimmed = rawApiKey.trim();
    if (trimmed) {
      if (!VALID_BYOK_GEMINI_KEY_REGEX.test(trimmed)) {
        return {
          ok: false,
          hasActiveKey: false,
          error:
            'Please enter a valid Google AI Studio API key (starting with "AIza...") or Vertex Express key ("AQ...").',
        };
      }

      const [entRow] = await db
        .select()
        .from(userEntitlements)
        .where(eq(userEntitlements.userId, activeUser.userId))
        .limit(1);

      if (
        activeUser.role !== 'SUPER_ADMIN' &&
        (!entRow ||
          entRow.planType !== 'APPSUMO_LTD' ||
          entRow.stackedCodesCount < 3)
      ) {
        return {
          ok: false,
          hasActiveKey: false,
          error:
            'Bring Your Own API Key (BYOK) requires Lifetime Tier 3 (3+ Stacked Codes).',
        };
      }
    }

    const encryptedValue = trimmed ? encryptByokApiKey(trimmed) : null;

    await db
      .update(userEntitlements)
      .set({
        customApiKeyEncrypted: encryptedValue,
        updatedAt: new Date(),
      })
      .where(eq(userEntitlements.userId, activeUser.userId));

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
