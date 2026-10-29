'use server';

import { and, desc, eq, sql } from 'drizzle-orm';
import {
  db,
  startupPlans,
  planModulesData,
  validationSurveys,
  surveyResponses,
  openQuestionsParkingLot,
  type BlindSpotItem,
} from '@/db';
import {
  deduplicateSurveyResponses,
  getCanonicalResponseSignature,
  type SavedValidationSurvey,
  type SavedSurveyResponse,
  type SurveyQuestionItem,
  type SurveyFocusAreaType,
  type SurveyQuestionType,
  type SurveyResponseAnswerValue,
  type SurveyAiInsightsSummary,
  type SurveyOutreachTemplates,
  type SavedCustomerInterviewLog,
  type SavedModuleCData,
  type SavedModuleBData,
} from '@/lib/auth/session-store';
import type { SupportedCountryCode } from '@/lib/localization';
import {
  verifyActiveSessionAndPlanOwnership,
  checkRateLimit,
} from '@/lib/auth/server-auth';
import {
  generateModuleCSurveyViaRouter,
  checkAndRewriteMomTestQuestionViaRouter,
  suggestNextMomTestQuestionViaRouter,
  analyzeModuleCSurveyResultsViaRouter,
  extractMomTestInterviewInsightsViaRouter,
  type ModuleCSurveyGenerationResult,
  type MomTestCheckResult,
  type SuggestNextQuestionResult,
  type AnalyzeSurveyResultsOutput,
  type ExtractMomTestInterviewOutput,
} from '@/lib/ai/router';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let moduleEnumEnsured = false;

async function ensureModuleCodeEnumValues(): Promise<void> {
  if (moduleEnumEnsured) return;
  try {
    await db.execute(
      sql`ALTER TYPE "public"."module_code" ADD VALUE IF NOT EXISTS 'MOD_C_SURVEYS_FEEDBACK'`
    );
    await db.execute(
      sql`ALTER TYPE "public"."module_code" ADD VALUE IF NOT EXISTS 'MOD_D_PRODUCT_BUILD'`
    );
    await db.execute(
      sql`ALTER TYPE "public"."module_code" ADD VALUE IF NOT EXISTS 'MOD_E_OPERATIONS'`
    );
    await db.execute(
      sql`ALTER TYPE "public"."module_code" ADD VALUE IF NOT EXISTS 'MOD_F_COFOUNDER_TEAM'`
    );
    await db.execute(
      sql`ALTER TYPE "public"."module_code" ADD VALUE IF NOT EXISTS 'MOD_G_REVENUE'`
    );
    await db.execute(
      sql`ALTER TYPE "public"."module_code" ADD VALUE IF NOT EXISTS 'MOD_H_MARKETING'`
    );
    await db.execute(
      sql`ALTER TYPE "public"."module_code" ADD VALUE IF NOT EXISTS 'MOD_I_FINANCE'`
    );
    await db.execute(
      sql`ALTER TYPE "public"."module_code" ADD VALUE IF NOT EXISTS 'MOD_J_GRANTS_FUNDING'`
    );
    await db.execute(
      sql`ALTER TYPE "public"."module_code" ADD VALUE IF NOT EXISTS 'MOD_K_BUSINESS_PLAN'`
    );
    moduleEnumEnsured = true;
  } catch {
    // Ignore if already added or lacks DDL privilege
  }
}

function mapDbResponseRowToSavedResponse(
  r: typeof surveyResponses.$inferSelect
): SavedSurveyResponse & { clientResponseId?: string } {
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
}

/**
 * Saves or updates a Validation Survey in PostgreSQL (`validation_surveys`, `survey_responses`, and `plan_modules_data`).
 */
export async function saveValidationSurveyAction(input: {
  planId: string;
  survey: SavedValidationSurvey;
  allSurveys: SavedValidationSurvey[];
}): Promise<{ ok: boolean; persistedToCloudSql: boolean }> {
  if (!UUID_REGEX.test(input.planId)) {
    return { ok: true, persistedToCloudSql: false };
  }

  const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId);
  if (!authCheck.authorized) {
    return { ok: false, persistedToCloudSql: false };
  }

  try {
    await ensureModuleCodeEnumValues();
    // 1. Upsert into validation_surveys by publicSlug
    const existingBySlug = await db
      .select()
      .from(validationSurveys)
      .where(eq(validationSurveys.publicSlug, input.survey.publicSlug))
      .limit(1);

    let surveyDbId: string;
    let effectiveQuestions = input.survey.questions || [];
    let effectiveTitle = input.survey.title || 'Untitled Customer Survey';
    let effectiveIntro = input.survey.introDescription || '';
    let effectiveWaitlist = input.survey.waitlistIncentiveText || '';
    let effectiveCollectEmails = input.survey.collectLeadEmails;
    let effectiveAiInsights = input.survey.aiInsightsSummary;
    let effectiveIsPublished = Boolean(input.survey.isPublished);
    let effectivePublishedAt = input.survey.publishedAt;

    if (existingBySlug.length > 0) {
      const existingRow = existingBySlug[0];
      if (existingRow.planId !== input.planId) {
        return { ok: false, persistedToCloudSql: false };
      }
      surveyDbId = existingRow.id;
      const dbQuestions = (existingRow.questionsJsonb || []) as SurveyQuestionItem[];
      const existingMeta = (existingRow.outreachTemplatesJsonb || {}) as {
        isPublished?: boolean;
        publishedAt?: string;
      };
      const wasAlreadyPublished = Boolean(existingMeta.isPublished);

      if (wasAlreadyPublished && dbQuestions.length > 0) {
        // SERVER-SIDE AUDIT LOCK: Once published, questions, title, and options cannot be altered
        effectiveIsPublished = true;
        effectivePublishedAt =
          existingMeta.publishedAt ||
          input.survey.publishedAt ||
          existingRow.createdAt.toISOString();
        effectiveQuestions = dbQuestions;
        if (existingRow.title && existingRow.title !== 'Untitled Customer Survey') {
          effectiveTitle = existingRow.title;
        }
        effectiveIntro = existingRow.introDescription || effectiveIntro;
        effectiveWaitlist = existingRow.waitlistIncentiveText || effectiveWaitlist;
        effectiveCollectEmails = existingRow.collectLeadEmails;
      } else {
        // Guard against accidental blank overwrite if DB already has questions and incoming has 0 while responses exist
        if (
          effectiveQuestions.length === 0 &&
          dbQuestions.length > 0 &&
          (input.survey.responses?.length || 0) > 0
        ) {
          effectiveQuestions = dbQuestions;
        }
        if (
          (!input.survey.title ||
            input.survey.title === 'Untitled Customer Survey') &&
          existingRow.title &&
          existingRow.title !== 'Untitled Customer Survey'
        ) {
          effectiveTitle = existingRow.title;
        }
        effectiveIntro =
          input.survey.introDescription || existingRow.introDescription || '';
        effectiveWaitlist =
          input.survey.waitlistIncentiveText ||
          existingRow.waitlistIncentiveText ||
          '';
        if (effectiveIsPublished && !effectivePublishedAt) {
          effectivePublishedAt = new Date().toISOString();
        }
      }

      const existingInsights = existingRow.aiInsightsSummaryJsonb as
        | SurveyAiInsightsSummary
        | undefined;
      if (
        !effectiveAiInsights &&
        existingInsights &&
        typeof existingInsights === 'object' &&
        'headlineTakeaway' in existingInsights
      ) {
        effectiveAiInsights = existingInsights;
      }

      await db
        .update(validationSurveys)
        .set({
          title: effectiveTitle,
          introDescription: effectiveIntro,
          isActive: input.survey.isActive,
          collectLeadEmails: effectiveCollectEmails,
          waitlistIncentiveText: effectiveWaitlist,
          questionsJsonb: effectiveQuestions,
          aiInsightsSummaryJsonb: effectiveAiInsights || {},
          ...(input.survey.interviewLogs
            ? { interviewLogsJsonb: input.survey.interviewLogs }
            : {}),
          outreachTemplatesJsonb: {
            ...existingMeta,
            ...(input.survey.outreachTemplates || {}),
            isPublished: effectiveIsPublished,
            publishedAt: effectivePublishedAt,
          },
        })
        .where(eq(validationSurveys.id, surveyDbId));
    } else {
      if (effectiveIsPublished && !effectivePublishedAt) {
        effectivePublishedAt = new Date().toISOString();
      }
      const [inserted] = await db
        .insert(validationSurveys)
        .values({
          ...(UUID_REGEX.test(input.survey.id) ? { id: input.survey.id } : {}),
          planId: input.planId,
          publicSlug: input.survey.publicSlug,
          title: effectiveTitle,
          introDescription: effectiveIntro,
          isActive: input.survey.isActive,
          collectLeadEmails: effectiveCollectEmails,
          waitlistIncentiveText: effectiveWaitlist,
          questionsJsonb: effectiveQuestions,
          aiInsightsSummaryJsonb: effectiveAiInsights || {},
          interviewLogsJsonb: input.survey.interviewLogs || [],
          outreachTemplatesJsonb: {
            ...(input.survey.outreachTemplates || {}),
            isPublished: effectiveIsPublished,
            publishedAt: effectivePublishedAt,
          },
        })
        .returning({ id: validationSurveys.id });
      surveyDbId = inserted.id;
    }

    // 2. Sync responses between input.survey.responses and the survey_responses table
    const existingDbRespRows = await db
      .select()
      .from(surveyResponses)
      .where(eq(surveyResponses.surveyId, surveyDbId))
      .orderBy(desc(surveyResponses.submittedAt));

    const mappedDbResponses = existingDbRespRows.map(
      mapDbResponseRowToSavedResponse
    );

    const incomingResponses = input.survey.responses || [];
    const incomingIds = new Set(incomingResponses.map((r) => r.id));

    // Delete any simulated responses in DB that were explicitly cleared in incomingResponses
    for (const dbResp of mappedDbResponses) {
      if (
        dbResp.isSimulated &&
        !incomingIds.has(dbResp.id) &&
        (!dbResp.clientResponseId || !incomingIds.has(dbResp.clientResponseId))
      ) {
        await db
          .delete(surveyResponses)
          .where(eq(surveyResponses.id, dbResp.id));
      }
    }

    // Insert any incoming responses (e.g. simulated or local-registry responses) that aren't in DB yet
    const knownDbIds = new Set<string>();
    const knownDbSignatures = new Set<string>();
    for (const dbResp of mappedDbResponses) {
      knownDbIds.add(dbResp.id);
      if (dbResp.clientResponseId) {
        knownDbIds.add(dbResp.clientResponseId);
      }
      knownDbSignatures.add(getCanonicalResponseSignature(dbResp));
    }

    for (const incResp of deduplicateSurveyResponses(incomingResponses)) {
      const incSig = getCanonicalResponseSignature(incResp);
      if (
        !knownDbIds.has(incResp.id) &&
        (!incResp.clientResponseId || !knownDbIds.has(incResp.clientResponseId)) &&
        !knownDbSignatures.has(incSig)
      ) {
        knownDbIds.add(incResp.id);
        knownDbSignatures.add(incSig);
        await db.insert(surveyResponses).values({
          ...(UUID_REGEX.test(incResp.id) ? { id: incResp.id } : {}),
          surveyId: surveyDbId,
          answersJsonb: {
            answers: incResp.answers,
            respondentNameOrRole: incResp.respondentNameOrRole,
            isSimulated: incResp.isSimulated ?? false,
            clientResponseId: incResp.clientResponseId || incResp.id,
          },
          respondentEmail: incResp.respondentEmail || null,
          joinedWaitlist: Boolean(incResp.joinedWaitlist),
          submittedAt: incResp.submittedAt
            ? new Date(incResp.submittedAt)
            : new Date(),
        });
      }
    }

    // Re-fetch authoritative responses for this survey after sync
    const finalDbRespRows = await db
      .select()
      .from(surveyResponses)
      .where(eq(surveyResponses.surveyId, surveyDbId))
      .orderBy(desc(surveyResponses.submittedAt));

    const authoritativeResponses: SavedSurveyResponse[] =
      deduplicateSurveyResponses(
        finalDbRespRows.map((r) => mapDbResponseRowToSavedResponse(r))
      );

    const syncedActiveSurvey: SavedValidationSurvey = {
      ...input.survey,
      title:
        effectiveTitle === 'Untitled Customer Survey'
          ? input.survey.title
          : effectiveTitle,
      introDescription: effectiveIntro,
      collectLeadEmails: effectiveCollectEmails,
      waitlistIncentiveText: effectiveWaitlist,
      isPublished: effectiveIsPublished,
      publishedAt: effectivePublishedAt,
      questions: effectiveQuestions,
      responses: authoritativeResponses,
      aiInsightsSummary: effectiveAiInsights,
    };

    const syncedAllSurveys = input.allSurveys.map((s) =>
      s.publicSlug === input.survey.publicSlug || s.id === input.survey.id
        ? syncedActiveSurvey
        : {
            ...s,
            responses: deduplicateSurveyResponses(s.responses || []),
          }
    );

    // 3. Persist the full multi-survey array into plan_modules_data (MOD_C_SURVEYS_FEEDBACK)
    const existingMod = await db
      .select()
      .from(planModulesData)
      .where(
        and(
          eq(planModulesData.planId, input.planId),
          eq(planModulesData.moduleCode, 'MOD_C_SURVEYS_FEEDBACK')
        )
      )
      .limit(1);

    const hasQuestions = syncedAllSurveys.some((s) => s.questions.length > 0);
    const hasResponses = syncedAllSurveys.some((s) => s.responses.length > 0);
    const hasInsights = syncedAllSurveys.some((s) =>
      Boolean(s.aiInsightsSummary)
    );

    const progress = hasInsights
      ? 100
      : hasResponses
        ? 75
        : hasQuestions
          ? 50
          : 20;

    const existingModInputs = (existingMod[0]?.structuredInputsJsonb ||
      {}) as Partial<SavedModuleCData>;

    const modulePayload: SavedModuleCData = {
      surveys: syncedAllSurveys,
      activeSurveyId: syncedActiveSurvey.id,
      interviewLogs:
        input.survey.interviewLogs || existingModInputs.interviewLogs || [],
      thingsToConsider: existingModInputs.thingsToConsider,
      lastSavedAt: new Date().toISOString(),
    };

    if (existingMod.length > 0) {
      await db
        .update(planModulesData)
        .set({
          structuredInputsJsonb: modulePayload,
          completionPercentage: Math.max(
            existingMod[0].completionPercentage,
            progress
          ),
          updatedAt: new Date(),
        })
        .where(eq(planModulesData.id, existingMod[0].id));
    } else {
      await db.insert(planModulesData).values({
        planId: input.planId,
        moduleCode: 'MOD_C_SURVEYS_FEEDBACK',
        structuredInputsJsonb: modulePayload,
        aiThingsToConsiderJsonb: [],
        completionPercentage: progress,
      });
    }

    await db
      .update(startupPlans)
      .set({
        currentModuleStep: 'MOD_C_SURVEYS_FEEDBACK',
        updatedAt: new Date(),
      })
      .where(eq(startupPlans.id, input.planId));

    return { ok: true, persistedToCloudSql: true };
  } catch (err) {
    console.warn(
      '[SPF Module C] Could not persist survey to Cloud SQL:',
      err instanceof Error ? err.message : err
    );
    return { ok: true, persistedToCloudSql: false };
  }
}

/**
 * Deletes a Validation Survey from PostgreSQL (`validation_surveys` + `plan_modules_data`).
 */
export async function deleteValidationSurveyAction(input: {
  planId: string;
  publicSlug: string;
  remainingSurveys: SavedValidationSurvey[];
}): Promise<{ ok: boolean; persistedToCloudSql: boolean }> {
  if (!UUID_REGEX.test(input.planId)) {
    return { ok: true, persistedToCloudSql: false };
  }

  const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId);
  if (!authCheck.authorized) {
    return { ok: false, persistedToCloudSql: false };
  }

  try {
    await db
      .delete(validationSurveys)
      .where(
        and(
          eq(validationSurveys.publicSlug, input.publicSlug),
          eq(validationSurveys.planId, input.planId)
        )
      );

    if (input.remainingSurveys.length === 0) {
      await db
        .delete(validationSurveys)
        .where(eq(validationSurveys.planId, input.planId));
    } else {
      const keptSlugs = new Set(input.remainingSurveys.map((s) => s.publicSlug));
      const allPlanRows = await db
        .select({ id: validationSurveys.id, publicSlug: validationSurveys.publicSlug })
        .from(validationSurveys)
        .where(eq(validationSurveys.planId, input.planId));
      for (const r of allPlanRows) {
        if (!keptSlugs.has(r.publicSlug)) {
          await db
            .delete(validationSurveys)
            .where(eq(validationSurveys.id, r.id));
        }
      }
    }

    const existingMod = await db
      .select()
      .from(planModulesData)
      .where(
        and(
          eq(planModulesData.planId, input.planId),
          eq(planModulesData.moduleCode, 'MOD_C_SURVEYS_FEEDBACK')
        )
      )
      .limit(1);

    const existingModInputs = (existingMod[0]?.structuredInputsJsonb ||
      {}) as Partial<SavedModuleCData>;

    const payload: SavedModuleCData = {
      surveys: input.remainingSurveys,
      activeSurveyId: input.remainingSurveys[0]?.id,
      interviewLogs: existingModInputs.interviewLogs || [],
      thingsToConsider: existingModInputs.thingsToConsider,
      lastSavedAt: new Date().toISOString(),
    };

    if (existingMod.length > 0) {
      await db
        .update(planModulesData)
        .set({
          structuredInputsJsonb: payload,
          updatedAt: new Date(),
        })
        .where(eq(planModulesData.id, existingMod[0].id));
    } else {
      await db.insert(planModulesData).values({
        planId: input.planId,
        moduleCode: 'MOD_C_SURVEYS_FEEDBACK',
        structuredInputsJsonb: payload,
        aiThingsToConsiderJsonb: [],
        completionPercentage: 0,
      });
    }

    return { ok: true, persistedToCloudSql: true };
  } catch {
    return { ok: true, persistedToCloudSql: false };
  }
}

/**
 * Fetches a public survey by its slug (`startuppreflight.com/v/[slug]`) with zero login required.
 * SECURITY PRIVACY INVARIANT: Never return respondent emails, answers, or internal AI insights
 * to anonymous public visitors. Use `getFounderSurveyResponsesBySlugAction` inside the authenticated workspace.
 */
export async function getPublicSurveyBySlugAction(publicSlug: string): Promise<{
  found: boolean;
  survey?: SavedValidationSurvey & { planTitle?: string };
}> {
  const cleanSlug = decodeURIComponent(publicSlug).trim().slice(0, 140);
  if (!cleanSlug) {
    return { found: false };
  }

  try {
    const rows = await db
      .select()
      .from(validationSurveys)
      .where(eq(validationSurveys.publicSlug, cleanSlug))
      .limit(1);

    if (rows.length === 0) {
      return { found: false };
    }

    const row = rows[0];
    let planTitle = 'Startup Discovery Survey';
    try {
      const planRows = await db
        .select({ title: startupPlans.title })
        .from(startupPlans)
        .where(eq(startupPlans.id, row.planId))
        .limit(1);
      if (planRows[0]?.title) {
        planTitle = planRows[0].title;
      }
    } catch {
      // Ignore
    }

    const rowMeta = (row.outreachTemplatesJsonb || {}) as {
      isPublished?: boolean;
      publishedAt?: string;
    };
    const isPublished =
      typeof rowMeta.isPublished === 'boolean' ? rowMeta.isPublished : true;

    return {
      found: true,
      survey: {
        id: row.id,
        planId: row.planId,
        publicSlug: row.publicSlug,
        title: row.title,
        introDescription: row.introDescription || '',
        isActive: row.isActive,
        isPublished,
        publishedAt:
          rowMeta.publishedAt ||
          (isPublished ? row.createdAt.toISOString() : undefined),
        collectLeadEmails: row.collectLeadEmails,
        waitlistIncentiveText: row.waitlistIncentiveText || '',
        questions: (row.questionsJsonb || []) as SurveyQuestionItem[],
        // Privacy protection: public route never receives respondent answers or waitlist emails
        responses: [],
        aiInsightsSummary: undefined,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.createdAt.toISOString(),
        planTitle,
      },
    };
  } catch {
    return { found: false };
  }
}

/**
 * Authenticated founder-only action to sync full survey responses (including waitlist emails
 * and AI insights) into the Module C workspace. Verifies plan ownership before returning PII.
 */
export async function getFounderSurveyResponsesBySlugAction(input: {
  planId: string;
  publicSlug: string;
}): Promise<{
  found: boolean;
  survey?: SavedValidationSurvey & { planTitle?: string };
}> {
  const cleanSlug = decodeURIComponent(input.publicSlug).trim().slice(0, 140);
  if (!cleanSlug) {
    return { found: false };
  }

  const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId);
  if (!authCheck.authorized) {
    return { found: false };
  }

  try {
    const rows = await db
      .select()
      .from(validationSurveys)
      .where(eq(validationSurveys.publicSlug, cleanSlug))
      .limit(1);

    if (rows.length === 0) {
      return { found: false };
    }

    const row = rows[0];
    if (UUID_REGEX.test(input.planId) && row.planId !== input.planId) {
      return { found: false };
    }

    let planTitle = 'Startup Discovery Survey';
    try {
      const planRows = await db
        .select({ title: startupPlans.title })
        .from(startupPlans)
        .where(eq(startupPlans.id, row.planId))
        .limit(1);
      if (planRows[0]?.title) {
        planTitle = planRows[0].title;
      }
    } catch {
      // Ignore
    }

    const dbResponses = await db
      .select()
      .from(surveyResponses)
      .where(eq(surveyResponses.surveyId, row.id))
      .orderBy(desc(surveyResponses.submittedAt));

    const mappedResponses: SavedSurveyResponse[] = deduplicateSurveyResponses(
      dbResponses.map((r) => mapDbResponseRowToSavedResponse(r))
    );

    const rowMeta = (row.outreachTemplatesJsonb || {}) as {
      isPublished?: boolean;
      publishedAt?: string;
    };
    const isPublished =
      typeof rowMeta.isPublished === 'boolean'
        ? rowMeta.isPublished
        : mappedResponses.some((r) => !r.isSimulated);

    return {
      found: true,
      survey: {
        id: row.id,
        planId: row.planId,
        publicSlug: row.publicSlug,
        title: row.title,
        introDescription: row.introDescription || '',
        isActive: row.isActive,
        isPublished,
        publishedAt:
          rowMeta.publishedAt ||
          (isPublished ? row.createdAt.toISOString() : undefined),
        collectLeadEmails: row.collectLeadEmails,
        waitlistIncentiveText: row.waitlistIncentiveText || '',
        questions: (row.questionsJsonb || []) as SurveyQuestionItem[],
        responses: mappedResponses,
        aiInsightsSummary:
          row.aiInsightsSummaryJsonb &&
          Object.keys(row.aiInsightsSummaryJsonb as object).length > 0
            ? (row.aiInsightsSummaryJsonb as SurveyAiInsightsSummary)
            : undefined,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.createdAt.toISOString(),
        planTitle,
      },
    };
  } catch {
    return { found: false };
  }
}

const MAX_PUBLIC_RESPONSES_PER_SURVEY = 2500;

function sanitizeSurveyAnswersMap(
  rawAnswers: Record<string, SurveyResponseAnswerValue>
): Record<string, SurveyResponseAnswerValue> {
  const sanitized: Record<string, SurveyResponseAnswerValue> = {};
  const entries = Object.entries(rawAnswers || {}).slice(0, 50);
  for (const [questionId, val] of entries) {
    const cleanQId = String(questionId).slice(0, 80);
    if (!val || typeof val !== 'object') continue;
    const cleanSelectedOption =
      typeof val.selectedOption === 'string'
        ? val.selectedOption.trim().slice(0, 500)
        : undefined;
    const cleanSelectedOptions = Array.isArray(val.selectedOptions)
      ? val.selectedOptions
          .slice(0, 20)
          .map((opt) => String(opt).trim().slice(0, 500))
      : undefined;
    const cleanOtherText =
      typeof val.otherText === 'string'
        ? val.otherText.trim().slice(0, 600)
        : undefined;
    const cleanOpenText =
      typeof val.openText === 'string'
        ? val.openText.trim().slice(0, 1500)
        : undefined;
    const cleanScale =
      typeof val.scaleValue === 'number' && Number.isFinite(val.scaleValue)
        ? Math.max(0, Math.min(10, val.scaleValue))
        : undefined;

    sanitized[cleanQId] = {
      ...(cleanSelectedOption !== undefined
        ? { selectedOption: cleanSelectedOption }
        : {}),
      ...(cleanSelectedOptions !== undefined
        ? { selectedOptions: cleanSelectedOptions }
        : {}),
      ...(cleanOtherText !== undefined ? { otherText: cleanOtherText } : {}),
      ...(cleanOpenText !== undefined ? { openText: cleanOpenText } : {}),
      ...(cleanScale !== undefined ? { scaleValue: cleanScale } : {}),
    };
  }
  return sanitized;
}

/**
 * Submits an anonymous or waitlist-opted-in response from the public `/v/[slug]` page.
 * Does NOT require any user login, but enforces anti-spam rate limiting, payload sanitization,
 * and forces `isSimulated: false`.
 */
export async function submitPublicSurveyResponseAction(input: {
  publicSlug: string;
  response: SavedSurveyResponse;
}): Promise<{
  ok: boolean;
  persistedToCloudSql: boolean;
  savedResponseId?: string;
}> {
  const cleanSlug = decodeURIComponent(input.publicSlug).trim().slice(0, 140);
  if (!cleanSlug) {
    return { ok: false, persistedToCloudSql: false };
  }

  // Anti-spam rate limit: max 15 submissions per minute per public survey slug
  const rateLimit = checkRateLimit(`survey:submit:${cleanSlug}`, 15, 60_000);
  if (!rateLimit.allowed) {
    return { ok: false, persistedToCloudSql: false };
  }

  const sanitizedAnswers = sanitizeSurveyAnswersMap(
    input.response?.answers || {}
  );
  const sanitizedNameOrRole =
    typeof input.response?.respondentNameOrRole === 'string'
      ? input.response.respondentNameOrRole.trim().slice(0, 120) || undefined
      : undefined;
  const sanitizedEmail =
    typeof input.response?.respondentEmail === 'string'
      ? input.response.respondentEmail.trim().toLowerCase().slice(0, 200) ||
        undefined
      : undefined;

  try {
    await ensureModuleCodeEnumValues();
    const surveyRows = await db
      .select()
      .from(validationSurveys)
      .where(eq(validationSurveys.publicSlug, cleanSlug))
      .limit(1);

    if (surveyRows.length === 0) {
      return { ok: true, persistedToCloudSql: false };
    }

    const surveyRow = surveyRows[0];
    if (!surveyRow.isActive) {
      return { ok: false, persistedToCloudSql: false };
    }

    // Cap total stored responses per survey to prevent DB bloat
    const countRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(surveyResponses)
      .where(eq(surveyResponses.surveyId, surveyRow.id));
    if ((countRows[0]?.count ?? 0) >= MAX_PUBLIC_RESPONSES_PER_SURVEY) {
      return { ok: false, persistedToCloudSql: false };
    }

    const [insertedResp] = await db
      .insert(surveyResponses)
      .values({
        surveyId: surveyRow.id,
        answersJsonb: {
          answers: sanitizedAnswers,
          respondentNameOrRole: sanitizedNameOrRole,
          // Public route submissions are always real respondents, never simulated
          isSimulated: false,
          clientResponseId: String(
            input.response.clientResponseId || input.response.id || ''
          ).slice(0, 100),
        },
        respondentEmail: sanitizedEmail || null,
        joinedWaitlist: Boolean(input.response.joinedWaitlist),
      })
      .returning();

    // Also sync the new response into plan_modules_data (MOD_C_SURVEYS_FEEDBACK) for this plan
    const existingMod = await db
      .select()
      .from(planModulesData)
      .where(
        and(
          eq(planModulesData.planId, surveyRow.planId),
          eq(planModulesData.moduleCode, 'MOD_C_SURVEYS_FEEDBACK')
        )
      )
      .limit(1);

    const savedRespObj: SavedSurveyResponse = {
      id: insertedResp.id,
      surveyId: surveyRow.id,
      answers: sanitizedAnswers,
      respondentNameOrRole: sanitizedNameOrRole,
      respondentEmail: sanitizedEmail,
      joinedWaitlist: Boolean(input.response.joinedWaitlist),
      isSimulated: false,
      clientResponseId: String(
        input.response.clientResponseId || input.response.id || ''
      ).slice(0, 100),
      submittedAt: insertedResp.submittedAt.toISOString(),
    };

    if (existingMod.length > 0) {
      const modCInputs = (existingMod[0].structuredInputsJsonb ||
        {}) as SavedModuleCData;
      const existingSurveys = modCInputs.surveys || [];
      const updatedSurveys = existingSurveys.map((s) => {
        if (s.publicSlug !== cleanSlug && s.id !== surveyRow.id) return s;
        return {
          ...s,
          responses: deduplicateSurveyResponses([
            savedRespObj,
            ...(s.responses || []),
          ]),
          updatedAt: new Date().toISOString(),
        };
      });

      await db
        .update(planModulesData)
        .set({
          structuredInputsJsonb: {
            ...modCInputs,
            surveys: updatedSurveys,
            lastSavedAt: new Date().toISOString(),
          },
          completionPercentage: Math.max(
            existingMod[0].completionPercentage,
            75
          ),
          updatedAt: new Date(),
        })
        .where(eq(planModulesData.id, existingMod[0].id));
    }

    return {
      ok: true,
      persistedToCloudSql: true,
      savedResponseId: insertedResp.id,
    };
  } catch {
    return { ok: true, persistedToCloudSql: false };
  }
}

/**
 * Generates a full Mom-Test Survey via the Central AI Router (`src/lib/ai/router.ts`).
 */
export async function generateModuleCSurveyWithAiAction(input: {
  userId?: string;
  planId?: string;
  planTitle: string;
  industryCategory: string;
  hqCountryCode: SupportedCountryCode;
  brainDumpText?: string;
  coreProblem?: string;
  targetCustomer?: string;
  proposedSolution?: string;
  unfairAdvantage?: string;
  revenueAndGrantFit?: string;
  moduleBData?: SavedModuleBData;
  focusAreas: SurveyFocusAreaType[];
  otherFocusAreaText?: string;
  customAiFocusPrompt?: string;
  questionCount?: number;
}): Promise<ModuleCSurveyGenerationResult> {
  return generateModuleCSurveyViaRouter(input);
}

/**
 * Checks a single survey question against "The Mom Test" and offers a 1-click rewrite.
 */
export async function checkMomTestQuestionWithAiAction(input: {
  userId?: string;
  planId?: string;
  planTitle: string;
  industryCategory?: string;
  hqCountryCode?: SupportedCountryCode;
  coreProblem?: string;
  targetCustomer?: string;
  moduleBData?: SavedModuleBData;
  questionText: string;
  questionType: SurveyQuestionType;
  currentOptions?: string[];
}): Promise<MomTestCheckResult> {
  return checkAndRewriteMomTestQuestionViaRouter(input);
}

/**
 * Suggests 1 additional Mom-Test question based on what's already in the survey.
 */
export async function suggestNextMomTestQuestionWithAiAction(input: {
  planTitle: string;
  industryCategory?: string;
  hqCountryCode?: SupportedCountryCode;
  coreProblem?: string;
  targetCustomer?: string;
  proposedSolution?: string;
  unfairAdvantage?: string;
  moduleBData?: SavedModuleBData;
  existingQuestions: SurveyQuestionItem[];
  focusAreas?: SurveyFocusAreaType[];
}): Promise<SuggestNextQuestionResult> {
  return suggestNextMomTestQuestionViaRouter(input);
}

/**
 * Synthesizes survey responses + 1-on-1 interviews into a "Signal vs. Polite Noise" Insights Summary.
 */
export async function analyzeSurveyResultsWithAiAction(input: {
  userId?: string;
  planId?: string;
  planTitle: string;
  surveyTitle: string;
  questions: SurveyQuestionItem[];
  responses: SavedSurveyResponse[];
  interviewLogs?: SavedCustomerInterviewLog[];
}): Promise<AnalyzeSurveyResultsOutput> {
  return analyzeModuleCSurveyResultsViaRouter(input);
}

/**
 * Extracts structured Mom-Test signal from messy 1-on-1 customer interview notes via the Central AI Router.
 */
export async function extractMomTestInterviewWithAiAction(input: {
  userId?: string;
  planId?: string;
  planTitle: string;
  industryCategory?: string;
  hqCountryCode?: SupportedCountryCode;
  intervieweeName: string;
  intervieweeRoleOrCompany: string;
  rawNotes: string;
}): Promise<ExtractMomTestInterviewOutput> {
  return extractMomTestInterviewInsightsViaRouter(input);
}

/**
 * Persists 1-on-1 Customer Interview Logs into `plan_modules_data` (`MOD_C_SURVEYS_FEEDBACK`)
 * and mirrors to the active survey row in `validation_surveys.interview_logs_jsonb` if present.
 */
export async function saveCustomerInterviewLogsAction(input: {
  planId: string;
  interviewLogs: SavedCustomerInterviewLog[];
  activeSurveySlug?: string;
}): Promise<{ ok: boolean; persistedToCloudSql: boolean }> {
  if (!UUID_REGEX.test(input.planId)) {
    return { ok: true, persistedToCloudSql: false };
  }

  const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId);
  if (!authCheck.authorized) {
    return { ok: false, persistedToCloudSql: false };
  }

  try {
    await ensureModuleCodeEnumValues();

    if (input.activeSurveySlug) {
      await db
        .update(validationSurveys)
        .set({
          interviewLogsJsonb: input.interviewLogs,
        })
        .where(
          and(
            eq(validationSurveys.publicSlug, input.activeSurveySlug),
            eq(validationSurveys.planId, input.planId)
          )
        );
    }

    const existingMod = await db
      .select()
      .from(planModulesData)
      .where(
        and(
          eq(planModulesData.planId, input.planId),
          eq(planModulesData.moduleCode, 'MOD_C_SURVEYS_FEEDBACK')
        )
      )
      .limit(1);

    const existingInputs = (existingMod[0]?.structuredInputsJsonb ||
      {}) as Partial<SavedModuleCData>;

    const updatedSurveys = (existingInputs.surveys || []).map((s) =>
      input.activeSurveySlug && s.publicSlug === input.activeSurveySlug
        ? { ...s, interviewLogs: input.interviewLogs }
        : s
    );

    const payload: SavedModuleCData = {
      surveys: updatedSurveys,
      activeSurveyId: existingInputs.activeSurveyId,
      interviewLogs: input.interviewLogs,
      thingsToConsider: existingInputs.thingsToConsider,
      lastSavedAt: new Date().toISOString(),
    };

    const progress = input.interviewLogs.length > 0 ? 75 : 20;

    if (existingMod.length > 0) {
      await db
        .update(planModulesData)
        .set({
          structuredInputsJsonb: payload,
          completionPercentage: Math.max(
            existingMod[0].completionPercentage,
            progress
          ),
          updatedAt: new Date(),
        })
        .where(eq(planModulesData.id, existingMod[0].id));
    } else {
      await db.insert(planModulesData).values({
        planId: input.planId,
        moduleCode: 'MOD_C_SURVEYS_FEEDBACK',
        structuredInputsJsonb: payload,
        aiThingsToConsiderJsonb: [],
        completionPercentage: progress,
      });
    }

    return { ok: true, persistedToCloudSql: true };
  } catch (err) {
    console.warn(
      '[SPF Module C] Could not persist 1-on-1 interview logs to Cloud SQL:',
      err instanceof Error ? err.message : err
    );
    return { ok: true, persistedToCloudSql: false };
  }
}

/**
 * Parks an open question from Module C into `open_questions_parking_lot`.
 */
export async function parkModuleCOpenQuestionAction(input: {
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
    await db.insert(openQuestionsParkingLot).values({
      planId: input.planId,
      sourceModule: 'MOD_C_SURVEYS_FEEDBACK',
      questionText: input.questionText.trim().slice(0, 1000),
      status: 'OPEN',
    });
    return { ok: true, persistedToCloudSql: true };
  } catch {
    return { ok: true, persistedToCloudSql: false };
  }
}

/**
 * Persists Module C Blind-Spot Review ("Things to Consider") & marks Module C 100% complete
 * when at least one survey or 1-on-1 interview exists.
 */
export async function saveModuleCBlindSpotsAction(input: {
  planId: string;
  thingsToConsider: BlindSpotItem[];
}): Promise<{ ok: boolean; persistedToCloudSql: boolean }> {
  if (!UUID_REGEX.test(input.planId)) {
    return { ok: true, persistedToCloudSql: false };
  }

  const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId);
  if (!authCheck.authorized) {
    return { ok: false, persistedToCloudSql: false };
  }

  try {
    await ensureModuleCodeEnumValues();

    const existingMod = await db
      .select()
      .from(planModulesData)
      .where(
        and(
          eq(planModulesData.planId, input.planId),
          eq(planModulesData.moduleCode, 'MOD_C_SURVEYS_FEEDBACK')
        )
      )
      .limit(1);

    const existingInputs = (existingMod[0]?.structuredInputsJsonb ||
      {}) as Partial<SavedModuleCData>;

    const hasSurveys =
      Array.isArray(existingInputs.surveys) &&
      existingInputs.surveys.some((s) => s.questions.length > 0);
    const hasInterviews =
      Array.isArray(existingInputs.interviewLogs) &&
      existingInputs.interviewLogs.length > 0;

    // Never persist blind-spots if there are no surveys and no 1-on-1 interviews
    const safeBlindSpots =
      hasSurveys || hasInterviews ? input.thingsToConsider : [];

    const payload: SavedModuleCData = {
      surveys: existingInputs.surveys || [],
      activeSurveyId: existingInputs.activeSurveyId,
      interviewLogs: existingInputs.interviewLogs || [],
      thingsToConsider: safeBlindSpots,
      lastSavedAt: new Date().toISOString(),
    };

    const progress =
      safeBlindSpots.length > 0 ? 100 : hasSurveys || hasInterviews ? 75 : 0;

    if (existingMod.length > 0) {
      await db
        .update(planModulesData)
        .set({
          structuredInputsJsonb: payload,
          aiThingsToConsiderJsonb: safeBlindSpots,
          completionPercentage: progress,
          updatedAt: new Date(),
        })
        .where(eq(planModulesData.id, existingMod[0].id));
    } else {
      await db.insert(planModulesData).values({
        planId: input.planId,
        moduleCode: 'MOD_C_SURVEYS_FEEDBACK',
        structuredInputsJsonb: payload,
        aiThingsToConsiderJsonb: safeBlindSpots,
        completionPercentage: progress,
      });
    }

    return { ok: true, persistedToCloudSql: true };
  } catch {
    return { ok: true, persistedToCloudSql: false };
  }
}
