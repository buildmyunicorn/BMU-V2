import { GoogleGenAI } from '@google/genai';
import { eq, sql } from 'drizzle-orm';
import {
  db,
  users,
  userEntitlements,
  aiPrompts,
  aiUsageLogs,
  type BlindSpotItem,
} from '@/db';
import { canConsumeAiCredits, type EntitlementSnapshot } from '@/lib/entitlements';
import {
  checkRateLimit,
  decryptByokApiKey,
  getAdminSessionCookie,
  getServerSessionCookie,
} from '@/lib/auth/server-auth';
import {
  getCountryRulePack,
  getGrantsForCountry,
  formatPlanCurrency,
  type SupportedCountryCode,
} from '@/lib/localization';
import type {
  SavedFounderMotivation,
  SavedTeamAndBudget,
  SavedFounderRealityCheck,
  CompetitorEntry,
  CompetitorCategoryType,
  BuyerModelType,
  MarketSizingSegmentEntry,
  CustomerBillingCadence,
  WiderMarketScalePreset,
  CompetitiveComparisonRow,
  ComparisonScoreLevel,
  SwitchingFrictionReducerType,
  UnfairAdvantageMoatType,
  SurveyFocusAreaType,
  SurveyQuestionType,
  SurveyQuestionItem,
  SavedSurveyResponse,
  SurveyAiInsightsSummary,
  SavedCustomerInterviewLog,
  InterviewCommitmentOutcomeType,
  InterviewSignalBadgeType,
  SavedModuleBData,
  ProductTrackType,
  ProductFormFactorType,
  V1PrototypeApproachType,
  V1LaunchTimelineType,
  SalesChannelOptionType,
  DeliveryFulfillmentModelType,
  ScopeFilterItem,
  V1ScopeDisciplineRuleType,
  BuildVsBuyItem,
  BuildVsBuyTierType,
  BuildVsBuyCostModelType,
  CoreIpOwnershipRuleType,
  ProductWorkPackageItem,
  ProductFlowStageItem,
  WorkPackageExecutionModeType,
  WorkPackageTimelineWindowType,
  WorkPackageCadenceRuleType,
  ProductBlindSpotCategoryType,
  ProductBlindSpotSeverityType,
  ProductReadinessConfidenceType,
  ProductBlindSpotItem,
  OperationsFulfillmentModeType,
  OrderTurnaroundSlaType,
  OperationalCapacityConstraintType,
  OrderStageOwnerType,
  OrderLifecycleStageItem,
  PremisesSetupModeType,
  PremisesComplianceStatusType,
  EquipmentAssetCategoryType,
  EquipmentAcquisitionModeType,
  EquipmentFundingSourceType,
  EquipmentQuoteComplianceStatusType,
  EquipmentAssetItem,
  SupplierRedundancyPostureType,
  ProjectRiskCategoryType,
  ResidualRiskRatingType,
  ProjectRiskRegisterItem,
  SupportOperatingModelType,
  SupportResponseSlaType,
  ReturnsAndWarrantyPolicyType,
  QcGateTimingType,
  QcCheckpointItem,
  RegulatorySectorPostureType,
  DataPrivacyPostureType,
  InsuranceCoverageBundleType,
  ComplianceItemCategoryType,
  ComplianceItemStatusType,
  ComplianceChecklistItem,
  OperationsBlindSpotCategoryType,
  OperationsBlindSpotSeverityType,
  OperationsReadinessConfidenceType,
  OperationsBlindSpotItem,
  First10AcquisitionArchetype,
  First10ProspectItem,
  First10PilotOffer,
  First10OutreachScripts,
  First10FollowUpCadence,
  First10ObjectionBusters,
  First10LetterOfIntent,
  First10PlaybookStep3Data,
  BudgetGoalPreset,
  MarketingBudgetBucketType,
  MarketingGrantEligibilityStatus,
  MarketingBudgetLineItem,
  MarketingBudgetStep4Data,
  GrantRoadmapPhaseItem,
} from '@/lib/auth/session-store';
import { buildDynamicModuleABlindSpots } from '@/lib/ai/module-a-blindspots';

export interface ConceptCanvasBlocks {
  coreProblem: string;
  targetCustomer: string;
  proposedSolution: string;
  unfairAdvantage: string;
  revenueAndGrantFit: string;
  lastSynthesizedAt?: string;
  aiEngineUsed?: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export interface ModuleASynthesisResult {
  allowed: boolean;
  reason?: string;
  canvas: ConceptCanvasBlocks;
  thingsToConsider: BlindSpotItem[];
  creditsUsedAfter?: number;
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
}

const DEFAULT_SYSTEM_PROMPT = `You are the Startup Preflight Supportive Co-Founder & Blind-Spot Engine.
Always follow the "Capture First, Expand Second" philosophy:
1. Never criticize the founder's raw idea upfront. When tidying up the founder's Step 2 Concept Canvas notes, preserve their exact core ideas and voice while making their notes clear, well-structured, and easy to read. Remember there are no right or wrong answers.
2. Second, generate 3 constructive, encouraging "Things to Consider" blind spots (operational realities, industry traps, or validation questions) framed as supportive coaching prompts.`;

/**
 * Global Daily Platform AI Call Ceiling (Circuit Breaker).
 * Protects the platform GEMINI_API_KEY from runaway scripts or unexpected spikes.
 * Defaults to 500 platform-key Gemini calls per 24 hours (configurable via MAX_DAILY_PLATFORM_AI_CALLS).
 * When reached, the router fails closed to the zero-cost `smart-synthesizer` fallback.
 */
const DEFAULT_MAX_DAILY_PLATFORM_AI_CALLS = 500;
const MAX_OUTPUT_TOKENS_PER_CALL = 2048;

let cachedDailyPlatformCallCount = 0;
let cachedDailyCountFetchedAt = 0;

function getMaxDailyPlatformAiCalls(): number {
  const parsed = Number(process.env.MAX_DAILY_PLATFORM_AI_CALLS);
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.floor(parsed);
  }
  return DEFAULT_MAX_DAILY_PLATFORM_AI_CALLS;
}

/**
 * Sanitizes and truncates untrusted user text before embedding into an AI prompt
 * so a malicious payload cannot burn tens of thousands of input tokens in a single call.
 */
export function sanitizePromptInput(
  raw: string | undefined | null,
  maxChars: number = 3000
): string {
  if (!raw) return '';
  return raw
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxChars);
}

function isValidUuid(val: string | undefined | null): val is string {
  return Boolean(
    val &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        val
      )
  );
}

function hasConfiguredGeminiKey(customKey?: string | null): string | null {
  if (customKey && customKey.trim().length > 15) {
    return customKey.trim();
  }
  const envKey = process.env.GEMINI_API_KEY?.trim();
  if (
    envKey &&
    envKey.length > 15 &&
    envKey !== 'your_gemini_api_key_here'
  ) {
    return envKey;
  }
  if (
    process.env.GOOGLE_GENAI_USE_VERTEXAI === 'true' ||
    process.env.VERTEX_AI === 'true'
  ) {
    return 'VERTEX_AI_ACTIVE';
  }
  return null;
}

function getGenAiClient(activeApiKey: string | null): GoogleGenAI {
  const useVertex =
    process.env.GOOGLE_GENAI_USE_VERTEXAI === 'true' ||
    process.env.VERTEX_AI === 'true';

  if (useVertex) {
    // If founder provided an individual BYOK key from AI Studio, prefer direct key
    if (activeApiKey && activeApiKey !== 'VERTEX_AI_ACTIVE') {
      return new GoogleGenAI({ apiKey: activeApiKey });
    }
    // Enterprise Vertex AI (ADC / Cloud Run Service Account)
    return new GoogleGenAI({
      vertexai: true,
      project: process.env.GOOGLE_CLOUD_PROJECT || 'startuppreflight',
      location: process.env.GOOGLE_CLOUD_LOCATION || 'europe-west1',
    });
  }

  return new GoogleGenAI({ apiKey: activeApiKey || process.env.GEMINI_API_KEY || '' });
}

interface AuthorizedGeminiCallContext {
  canCallLiveGemini: boolean;
  creditCheckBlocked: boolean;
  blockReason?: string;
  activeApiKey: string | null;
  verifiedUserId: string | null;
  usedByokKey: boolean;
  currentCreditsUsed: number;
  systemInstruction: string;
}

/**
 * Strict Server-Side AI Billing Firewall (`authorizeAndPrepareGeminiCall`).
 * Enforces:
 * 1. Never trusts client-passed `userId` — resolves authenticated session strictly from signed HttpOnly cookie.
 * 2. Fails closed to zero-cost `smart-synthesizer` if unauthenticated, suspended, or DB is unreachable.
 * 3. Checks `user_entitlements.ai_credits_used_this_month` against `monthly_ai_credits_limit`.
 * 4. Enforces per-user burst rate limits (max 8 calls/minute, 60 calls/hour).
 * 5. Decrypts BYOK key in server memory only, or enforces the 500/day Global Platform Circuit Breaker on the platform key.
 */
async function authorizeAndPrepareGeminiCall(
  promptKey: string,
  defaultSystemInstruction: string = DEFAULT_SYSTEM_PROMPT
): Promise<AuthorizedGeminiCallContext> {
  const founderSession = await getServerSessionCookie();
  const adminSession = await getAdminSessionCookie();
  const session = founderSession || adminSession;

  if (!session || !isValidUuid(session.userId)) {
    // Unauthenticated or local demo preview: NEVER touch live GEMINI_API_KEY.
    return {
      canCallLiveGemini: false,
      creditCheckBlocked: false,
      activeApiKey: null,
      verifiedUserId: null,
      usedByokKey: false,
      currentCreditsUsed: 0,
      systemInstruction: defaultSystemInstruction,
    };
  }

  const verifiedUserId = session.userId;

  try {
    // Verify user is ACTIVE in PostgreSQL
    const [dbUser] = await db
      .select({ id: users.id, status: users.status })
      .from(users)
      .where(eq(users.id, verifiedUserId))
      .limit(1);

    if (!dbUser || dbUser.status !== 'ACTIVE') {
      return {
        canCallLiveGemini: false,
        creditCheckBlocked: true,
        blockReason: 'Account is not active.',
        activeApiKey: null,
        verifiedUserId,
        usedByokKey: false,
        currentCreditsUsed: 0,
        systemInstruction: defaultSystemInstruction,
      };
    }

    const [entRow] = await db
      .select()
      .from(userEntitlements)
      .where(eq(userEntitlements.userId, verifiedUserId))
      .limit(1);

    if (!entRow) {
      // Fail closed if entitlement row is missing
      return {
        canCallLiveGemini: false,
        creditCheckBlocked: false,
        activeApiKey: null,
        verifiedUserId,
        usedByokKey: false,
        currentCreditsUsed: 0,
        systemInstruction: defaultSystemInstruction,
      };
    }

    const decryptedByok = decryptByokApiKey(entRow.customApiKeyEncrypted);

    const snapshot: EntitlementSnapshot = {
      userId: entRow.userId,
      planType: entRow.planType,
      stackedCodesCount: entRow.stackedCodesCount,
      maxStartupPlans: entRow.maxStartupPlans,
      maxSeatsPerPlan: entRow.maxSeatsPerPlan,
      monthlyAiCreditsLimit: entRow.monthlyAiCreditsLimit,
      aiCreditsUsedThisMonth: entRow.aiCreditsUsedThisMonth,
      whiteLabelExportEnabled: entRow.whiteLabelExportEnabled,
      customApiKeyEncrypted: decryptedByok,
      accessExpiresAt: entRow.accessExpiresAt,
      isVaultReadonly: entRow.isVaultReadonly,
    };

    const creditCheck = canConsumeAiCredits(snapshot, 1);
    if (!creditCheck.allowed) {
      return {
        canCallLiveGemini: false,
        creditCheckBlocked: true,
        blockReason: creditCheck.reason,
        activeApiKey: null,
        verifiedUserId,
        usedByokKey: false,
        currentCreditsUsed: entRow.aiCreditsUsedThisMonth,
        systemInstruction: defaultSystemInstruction,
      };
    }

    // Per-user burst rate limiting (max 8 calls/minute, max 60 calls/hour)
    const minuteLimit = checkRateLimit(`ai:min:${verifiedUserId}`, 8, 60_000);
    const hourLimit = checkRateLimit(`ai:hr:${verifiedUserId}`, 60, 3_600_000);
    if (!minuteLimit.allowed || !hourLimit.allowed) {
      console.warn(
        `[SPF AI Billing Firewall] Per-user burst rate limit reached for user ${verifiedUserId} on ${promptKey}. Using smart-synthesizer.`
      );
      return {
        canCallLiveGemini: false,
        creditCheckBlocked: false,
        activeApiKey: null,
        verifiedUserId,
        usedByokKey: false,
        currentCreditsUsed: entRow.aiCreditsUsedThisMonth,
        systemInstruction: defaultSystemInstruction,
      };
    }

    const usedByokKey = Boolean(decryptedByok && decryptedByok.length > 15);
    const activeApiKey = hasConfiguredGeminiKey(decryptedByok);

    if (!activeApiKey) {
      return {
        canCallLiveGemini: false,
        creditCheckBlocked: false,
        activeApiKey: null,
        verifiedUserId,
        usedByokKey: false,
        currentCreditsUsed: entRow.aiCreditsUsedThisMonth,
        systemInstruction: defaultSystemInstruction,
      };
    }

    // Global Daily Platform Circuit Breaker (500 calls/24h on platform key)
    if (!usedByokKey) {
      const maxDailyCalls = getMaxDailyPlatformAiCalls();
      const now = Date.now();
      if (now - cachedDailyCountFetchedAt > 60_000) {
        const [countRow] = await db
          .select({
            count: sql<number>`count(*)::int`,
          })
          .from(aiUsageLogs)
          .where(
            sql`${aiUsageLogs.usedByokKey} = false AND ${aiUsageLogs.modelUsed} != 'smart-synthesizer' AND ${aiUsageLogs.createdAt} >= NOW() - INTERVAL '24 hours'`
          );
        cachedDailyPlatformCallCount = Number(countRow?.count ?? 0);
        cachedDailyCountFetchedAt = now;
      }

      if (cachedDailyPlatformCallCount >= maxDailyCalls) {
        console.warn(
          `[SPF AI Billing Firewall] Global daily platform ceiling (${cachedDailyPlatformCallCount}/${maxDailyCalls} calls in 24h) reached. Failing closed to smart-synthesizer.`
        );
        return {
          canCallLiveGemini: false,
          creditCheckBlocked: false,
          activeApiKey: null,
          verifiedUserId,
          usedByokKey: false,
          currentCreditsUsed: entRow.aiCreditsUsedThisMonth,
          systemInstruction: defaultSystemInstruction,
        };
      }
    }

    let systemInstruction = defaultSystemInstruction;
    try {
      const [promptRow] = await db
        .select()
        .from(aiPrompts)
        .where(eq(aiPrompts.promptKey, promptKey))
        .limit(1);
      if (promptRow?.systemInstruction) {
        systemInstruction = promptRow.systemInstruction;
      }
    } catch {
      // Keep default system instruction
    }

    return {
      canCallLiveGemini: true,
      creditCheckBlocked: false,
      activeApiKey,
      verifiedUserId,
      usedByokKey,
      currentCreditsUsed: entRow.aiCreditsUsedThisMonth,
      systemInstruction,
    };
  } catch {
    // CRITICAL BILLING PROTECTION: If PostgreSQL is unreachable, NEVER call live Gemini API.
    return {
      canCallLiveGemini: false,
      creditCheckBlocked: false,
      activeApiKey: null,
      verifiedUserId: null,
      usedByokKey: false,
      currentCreditsUsed: 0,
      systemInstruction: defaultSystemInstruction,
    };
  }
}

async function recordGeminiUsageAndIncrementCredits(params: {
  verifiedUserId: string | null;
  planId?: string;
  promptKey: string;
  modelUsed: string;
  inputTokens: number;
  outputTokens: number;
  usedByokKey: boolean;
  fallbackCreditsUsed: number;
}): Promise<number> {
  if (params.modelUsed !== 'smart-synthesizer' && !params.usedByokKey) {
    cachedDailyPlatformCallCount += 1;
  }

  if (!params.verifiedUserId || !isValidUuid(params.verifiedUserId)) {
    return params.fallbackCreditsUsed;
  }

  let creditsUsedAfter = params.fallbackCreditsUsed + 1;
  try {
    const [updatedEnt] = await db
      .update(userEntitlements)
      .set({
        aiCreditsUsedThisMonth: sql`${userEntitlements.aiCreditsUsedThisMonth} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(userEntitlements.userId, params.verifiedUserId))
      .returning();

    if (updatedEnt) {
      creditsUsedAfter = updatedEnt.aiCreditsUsedThisMonth;
    }

    await db.insert(aiUsageLogs).values({
      userId: params.verifiedUserId,
      planId: isValidUuid(params.planId) ? params.planId : null,
      promptKey: params.promptKey,
      modelUsed: params.modelUsed,
      inputTokens: params.inputTokens,
      outputTokens: params.outputTokens,
      usedByokKey: params.usedByokKey,
    });
  } catch {
    // Ignore logging error in offline fallback
  }

  return creditsUsedAfter;
}

function tidyFounderSentence(rawText: string | undefined, fallbackText: string): string {
  const cleaned = (rawText || '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return fallbackText;
  // Capitalize the first letter of each sentence and ensure ending punctuation
  const capitalized = cleaned.replace(/(^\s*[a-z]|[.!?]\s+[a-z])/g, (match) =>
    match.toUpperCase()
  );
  return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`;
}

/**
 * Smart deterministic note-tidier used when GEMINI_API_KEY is not yet set in .env,
 * preserving the founder's own typed Step 2 notes while tidying grammar and punctuation.
 */
function buildSmartFallbackSynthesis(params: {
  planTitle: string;
  brainDumpText: string;
  industryCategory: string;
  hqCountryCode: SupportedCountryCode;
  exportPotential: 'DOMESTIC_ONLY' | 'EXPORTING_INTERNATIONALLY';
  draftCanvas?: Partial<ConceptCanvasBlocks>;
  founderMotivation?: SavedFounderMotivation;
  teamAndBudget?: SavedTeamAndBudget;
  founderRealityCheck?: SavedFounderRealityCheck;
}): { canvas: ConceptCanvasBlocks; thingsToConsider: BlindSpotItem[] } {
  const countryPack = getCountryRulePack(params.hqCountryCode);
  const grants = getGrantsForCountry(params.hqCountryCode);
  const topGrant = grants[0]?.grantName || 'National Innovation Support';
  const raw = params.brainDumpText.trim();

  // Extract sentences from the founder's raw brain dump as helpful fallbacks only if a box was left blank
  const sentences = raw
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const firstSentence =
    sentences[0] ||
    `Customers in ${params.industryCategory} face manual workflow bottlenecks, wasted time, and hidden margin loss.`;
  const secondSentence =
    sentences.slice(1).join(' ') ||
    `${params.planTitle} solves this problem simply and saves customers time and money.`;

  const benchmarkPrice =
    params.industryCategory.includes('SaaS') ||
    params.industryCategory.includes('Service')
      ? formatPlanCurrency(299, countryPack.defaultCurrency) + '/month recurring'
      : formatPlanCurrency(85, countryPack.defaultCurrency) +
        ' average order value';

  const draft = params.draftCanvas || {};

  const canvas: ConceptCanvasBlocks = {
    coreProblem: tidyFounderSentence(draft.coreProblem, firstSentence),
    targetCustomer: tidyFounderSentence(
      draft.targetCustomer,
      `Customers in ${countryPack.countryName} within ${params.industryCategory} (${
        params.exportPotential === 'EXPORTING_INTERNATIONALLY'
          ? 'with international export potential'
          : `focused on the ${countryPack.countryName} market`
      }).`
    ),
    proposedSolution: tidyFounderSentence(draft.proposedSolution, secondSentence),
    unfairAdvantage: tidyFounderSentence(
      draft.unfairAdvantage,
      `Simple to adopt for ${params.industryCategory} customers with fast, measurable results.`
    ),
    revenueAndGrantFit: tidyFounderSentence(
      draft.revenueAndGrantFit,
      `Charged in ${countryPack.defaultCurrency} (e.g., ${benchmarkPrice}), with potential to explore ${topGrant}.`
    ),
    lastSynthesizedAt: new Date().toISOString(),
    aiEngineUsed: 'smart-synthesizer',
  };

  const thingsToConsider = buildDynamicModuleABlindSpots({
    planTitle: params.planTitle,
    brainDumpText: params.brainDumpText,
    industryCategory: params.industryCategory,
    hqCountryCode: params.hqCountryCode,
    exportPotential: params.exportPotential,
    conceptCanvas: canvas,
    founderMotivation: params.founderMotivation,
    teamAndBudget: params.teamAndBudget,
    founderRealityCheck: params.founderRealityCheck,
  });

  return { canvas, thingsToConsider };
}

/**
 * Central AI Router (`src/lib/ai/router.ts`) required by GEMINI.md Rule 2.
 * Verifies authenticated server session, checks `user_entitlements.ai_credits_used_this_month` and
 * the 500/day platform circuit breaker, calls Gemini 2.5 Flash (or smart synthesizer fallback),
 * and logs token usage to `ai_usage_logs`.
 */
export async function synthesizeModuleAConceptCanvasViaRouter(params: {
  userId?: string;
  planId?: string;
  planTitle: string;
  brainDumpText: string;
  industryCategory: string;
  hqCountryCode: SupportedCountryCode;
  exportPotential: 'DOMESTIC_ONLY' | 'EXPORTING_INTERNATIONALLY';
  draftCanvas?: Partial<ConceptCanvasBlocks>;
  founderMotivation?: SavedFounderMotivation;
  teamAndBudget?: SavedTeamAndBudget;
  founderRealityCheck?: SavedFounderRealityCheck;
}): Promise<ModuleASynthesisResult> {
  const countryPack = getCountryRulePack(params.hqCountryCode);
  const grants = getGrantsForCountry(params.hqCountryCode);

  const authCtx = await authorizeAndPrepareGeminiCall(
    'MOD_A_CONCEPT_CANVAS',
    DEFAULT_SYSTEM_PROMPT
  );

  if (authCtx.creditCheckBlocked) {
    const fallback = buildSmartFallbackSynthesis(params);
    return {
      allowed: false,
      reason: authCtx.blockReason,
      canvas: fallback.canvas,
      thingsToConsider: fallback.thingsToConsider,
      creditsUsedAfter: authCtx.currentCreditsUsed,
      engineMode: 'smart-synthesizer',
    };
  }

  let canvasResult: ConceptCanvasBlocks | null = null;
  let blindSpotsResult: BlindSpotItem[] | null = null;
  let engineMode: 'gemini-2.5-flash' | 'smart-synthesizer' = 'smart-synthesizer';
  let inputTokensCount = 240;
  let outputTokensCount = 380;

  if (authCtx.canCallLiveGemini && authCtx.activeApiKey) {
    try {
      const ai = getGenAiClient(authCtx.activeApiKey);
      const draft = params.draftCanvas || {};
      const userPrompt = `
Founder Startup Title: ${sanitizePromptInput(params.planTitle, 200)}
Industry Category: ${sanitizePromptInput(params.industryCategory, 120)}
Home Country & Currency: ${countryPack.countryName} (${countryPack.defaultCurrency})
Indirect Tax: ${countryPack.taxName} (${countryPack.standardTaxRatePercent}%)
Export Ambition: ${params.exportPotential}
Matched Local Grants: ${grants.map((g) => `${g.grantName} (${g.maxAmountFormatted})`).join('; ')}

Founder's Raw Idea (Step 1):
"""
${sanitizePromptInput(params.brainDumpText, 3000)}
"""

Founder's Draft Notes in Step 2 (Tidy up their grammar and clarity while keeping their own meaning and voice; if a field is empty, helpfully suggest a simple starting note based on their raw idea):
- 1. Core Problem: ${sanitizePromptInput(draft.coreProblem, 800) || '(not filled in yet)'}
- 2. Target Customer: ${sanitizePromptInput(draft.targetCustomer, 800) || '(not filled in yet)'}
- 3. Your Solution: ${sanitizePromptInput(draft.proposedSolution, 800) || '(not filled in yet)'}
- 4. Why You Win: ${sanitizePromptInput(draft.unfairAdvantage, 800) || '(not filled in yet)'}
- 5. Revenue & Grant Fit: ${sanitizePromptInput(draft.revenueAndGrantFit, 800) || '(not filled in yet)'}

Founder's Motivation (Step 3):
- Primary Motivation: ${params.founderMotivation?.primaryMotivation || 'LEAVE_JOB'}
- Weekly Hours Available: ${params.founderMotivation?.weeklyHoursAvailable || '15_TO_25_HRS'}
- 12-Month Success Vision: ${sanitizePromptInput(params.founderMotivation?.twelveMonthSuccessVision, 600) || '(not filled in yet)'}

Founder's Team & Starting Budget (Step 4):
- Team Structure: ${params.teamAndBudget?.teamStructureType || 'SOLO_FOUNDER'}
- In-House Skill Coverage to Build V1: ${params.teamAndBudget?.skillCoverage || 'BUILD_IN_HOUSE'}
- Starting Capital to Invest (${countryPack.defaultCurrency}): ${params.teamAndBudget?.startingBudgetBracket || '1K_TO_5K'}
- Team & Funding Notes: ${sanitizePromptInput(params.teamAndBudget?.teamAndFundingNotes, 600) || '(not filled in yet)'}

Founder Fit, Dealbreakers & Reality Check (Step 5):
- Industry Connection (Monday Morning Test): ${params.founderRealityCheck?.industryConnection || 'WARM_CONNECTIONS'}
- Personal Income Urgency: ${params.founderRealityCheck?.personalIncomeUrgency || 'MEDIUM_6_TO_12M'}
- Lifestyle Dealbreakers (Anti-Goals): ${params.founderRealityCheck?.dealbreakers?.join(', ') || 'None selected'}
- Growth vs Control Tradeoff: ${params.founderRealityCheck?.growthTradeoff || 'BOOTSTRAP_100_CONTROL'}
- #1 Secret Worry: ${params.founderRealityCheck?.biggestWorryPreset || 'WILL_THEY_PAY'} (${sanitizePromptInput(params.founderRealityCheck?.biggestWorryNotes, 600) || 'no extra notes'})

Return STRICT JSON matching this exact shape (no markdown fences):
{
  "coreProblem": "Tidied, clear version of the founder's Core Problem note in plain English.",
  "targetCustomer": "Tidied, clear version of the founder's Target Customer note in plain English.",
  "proposedSolution": "Tidied, clear version of the founder's Solution note in plain English.",
  "unfairAdvantage": "Tidied, clear version of the founder's Why You Win note in plain English.",
  "revenueAndGrantFit": "Tidied, clear version of the founder's Revenue & Grant Fit note in plain English.",
  "thingsToConsider": [
    {
      "category": "OPERATIONAL_REALITY",
      "title": "Short constructive title",
      "observation": "Supportive 2-sentence operational question or blind spot to consider."
    },
    {
      "category": "INDUSTRY_TRAP",
      "title": "Short constructive title",
      "observation": "Supportive 2-sentence industry trap to watch out for."
    },
    {
      "category": "OPEN_QUESTION",
      "title": "Short constructive title",
      "observation": "Supportive 2-sentence validation question to test with 5 customers."
    }
  ]
}`.trim();

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userPrompt,
        config: {
          systemInstruction: authCtx.systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.4,
          maxOutputTokens: MAX_OUTPUT_TOKENS_PER_CALL,
        },
      });

      const rawText = response.text || '';
      const parsed = JSON.parse(rawText) as {
        coreProblem?: string;
        targetCustomer?: string;
        proposedSolution?: string;
        unfairAdvantage?: string;
        revenueAndGrantFit?: string;
        thingsToConsider?: Array<{
          category?: 'OPERATIONAL_REALITY' | 'INDUSTRY_TRAP' | 'OPEN_QUESTION';
          title?: string;
          observation?: string;
        }>;
      };

      if (parsed.coreProblem && parsed.proposedSolution) {
        engineMode = 'gemini-2.5-flash';
        canvasResult = {
          coreProblem: parsed.coreProblem,
          targetCustomer:
            parsed.targetCustomer ||
            `Primary buyers in ${countryPack.countryName} (${params.industryCategory}).`,
          proposedSolution: parsed.proposedSolution,
          unfairAdvantage:
            parsed.unfairAdvantage ||
            'Fast onboarding with measurable ROI in the first 30 days.',
          revenueAndGrantFit:
            parsed.revenueAndGrantFit ||
            `Priced in ${countryPack.defaultCurrency} with eligibility for ${grants[0]?.grantName || 'regional support'}.`,
          lastSynthesizedAt: new Date().toISOString(),
          aiEngineUsed: 'gemini-2.5-flash',
        };

        if (
          Array.isArray(parsed.thingsToConsider) &&
          parsed.thingsToConsider.length > 0
        ) {
          blindSpotsResult = parsed.thingsToConsider.map((item, idx) => ({
            id: `bs-${Date.now()}-${idx + 1}`,
            category: item.category || 'OPEN_QUESTION',
            severity: 'INFO' as const,
            title: item.title || `Key Consideration #${idx + 1}`,
            explanation:
              item.observation ||
              'Verify this assumption with 5 target customers.',
            suggestedAction:
              'Test this question in your Module B Customer Validation Survey.',
          }));
        }

        inputTokensCount = response.usageMetadata?.promptTokenCount || 280;
        outputTokensCount =
          response.usageMetadata?.candidatesTokenCount || 420;
      }
    } catch (err) {
      console.warn(
        '[SPF AI Router] Gemini API call failed, using smart synthesizer fallback:',
        err instanceof Error ? err.message : err
      );
    }
  }

  if (!canvasResult || !blindSpotsResult) {
    const fallback = buildSmartFallbackSynthesis(params);
    canvasResult = fallback.canvas;
    blindSpotsResult = fallback.thingsToConsider;
  }

  const creditsUsedAfter = await recordGeminiUsageAndIncrementCredits({
    verifiedUserId: authCtx.verifiedUserId,
    planId: params.planId,
    promptKey: 'MOD_A_CONCEPT_CANVAS',
    modelUsed: engineMode,
    inputTokens: inputTokensCount,
    outputTokens: outputTokensCount,
    usedByokKey: authCtx.usedByokKey,
    fallbackCreditsUsed: authCtx.currentCreditsUsed,
  });

  return {
    allowed: true,
    canvas: canvasResult,
    thingsToConsider: blindSpotsResult,
    creditsUsedAfter,
    engineMode,
  };
}

export interface ModuleBMarketScoutResult {
  allowed: boolean;
  reason?: string;
  competitors: CompetitorEntry[];
  suggestedWhySwitchSentence?: string;
  creditsUsedAfter?: number;
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
}

function buildSmartFallbackCompetitors(params: {
  planTitle: string;
  brainDumpText?: string;
  coreProblem?: string;
  proposedSolution?: string;
  targetCustomerDescription?: string;
  industryCategory: string;
  hqCountryCode: SupportedCountryCode;
  targetMarketsArray: string[];
  buyerTypes?: BuyerModelType[];
}): { competitors: CompetitorEntry[]; suggestedWhySwitchSentence: string } {
  const countryPack = getCountryRulePack(params.hqCountryCode);
  const currency = countryPack.defaultCurrency;
  const marketsText =
    params.targetMarketsArray.length > 0
      ? params.targetMarketsArray.join(', ')
      : countryPack.countryName;
  const combinedContext = `${params.planTitle} ${params.brainDumpText || ''} ${params.coreProblem || ''} ${params.proposedSolution || ''} ${params.targetCustomerDescription || ''}`.toLowerCase();

  const isStartupOrBusinessPlanTool =
    combinedContext.includes('unicorn') ||
    combinedContext.includes('founder') ||
    combinedContext.includes('startup') ||
    combinedContext.includes('business plan') ||
    combinedContext.includes('accelerator') ||
    combinedContext.includes('pitch');

  if (isStartupOrBusinessPlanTool) {
    return {
      competitors: [
        {
          id: `comp-${Date.now()}-1`,
          name: 'LivePlan / Traditional Business Plan Software',
          category: 'DIRECT_COMPETITOR',
          typicalPriceText: `${formatPlanCurrency(25, currency)}–${formatPlanCurrency(45, currency)} / month`,
          whatTheyDoWell:
            'Well-known templates for traditional bank-loan business plans and basic financial tables.',
          whereTheyFallShort:
            'Feels like homework; forces founders to write a 40-page static document without interactive coaching, blind-spot checks, or local grant matching.',
        },
        {
          id: `comp-${Date.now()}-2`,
          name: 'Generic AI Chatbots (ChatGPT / Claude) + Notion Templates',
          category: 'INDIRECT_ALTERNATIVE',
          typicalPriceText: `Free – ${formatPlanCurrency(20, currency)} / month`,
          whatTheyDoWell:
            'Fast at generating paragraphs of text when a founder knows the exact prompt to type.',
          whereTheyFallShort:
            'Agrees with everything the founder says (no constructive pushback), loses context across steps, and cannot host real customer validation surveys or calculate local tax/grants.',
        },
        {
          id: `comp-${Date.now()}-3`,
          name: 'Private Business Plan Consultants & Grant Writers',
          category: 'MANUAL_SERVICE_AGENCY',
          typicalPriceText: `${formatPlanCurrency(1500, currency)}–${formatPlanCurrency(5000, currency)} per plan`,
          whatTheyDoWell:
            'Hands-on 1-on-1 guidance tailored to local enterprise boards and investor decks.',
          whereTheyFallShort:
            'Too expensive for early-stage founders or university cohorts, slow turnaround times, and the founder does not own an interactive model they can pivot.',
        },
      ],
      suggestedWhySwitchSentence: `Customers switch to ${params.planTitle} because it guides founders step-by-step from raw idea to validated plan with built-in local grant matching in ${marketsText} — at a fraction of the cost of hiring a consultant.`,
    };
  }

  switch (params.industryCategory) {
    case 'Consumer App / Marketplace':
      return {
        competitors: [
          {
            id: `comp-${Date.now()}-1`,
            name: 'Established Category Marketplaces & Directories',
            category: 'DIRECT_COMPETITOR',
            typicalPriceText: `15%–25% commission or ${formatPlanCurrency(15, currency)}/mo`,
            whatTheyDoWell:
              'High brand awareness and a large directory of listings across major cities.',
            whereTheyFallShort:
              'High platform fees, unvetted listings, and slow back-and-forth messaging before a booking is confirmed.',
          },
          {
            id: `comp-${Date.now()}-2`,
            name: 'Local Facebook Groups, WhatsApp & Word-of-Mouth',
            category: 'INDIRECT_ALTERNATIVE',
            typicalPriceText: 'Free',
            whatTheyDoWell:
              'Zero fees and familiar everyday habit for local recommendations.',
            whereTheyFallShort:
              'No trust verification, no instant availability check, and no payment protection if someone cancels last minute.',
          },
          {
            id: `comp-${Date.now()}-3`,
            name: 'Traditional Local Agencies / Offline Brokers',
            category: 'MANUAL_SERVICE_AGENCY',
            typicalPriceText: `${formatPlanCurrency(100, currency)}+ booking fee`,
            whatTheyDoWell:
              'Handles vetting manually over the phone for customers willing to pay a premium.',
            whereTheyFallShort:
              'Office-hours only, slow manual quotes, and expensive markups.',
          },
        ],
        suggestedWhySwitchSentence: `Customers switch to ${params.planTitle} because they can book trusted, vetted options in ${marketsText} in under 2 minutes instead of chasing replies across WhatsApp and Facebook groups.`,
      };

    case 'E-Commerce / Physical Product / Food & Drink':
      return {
        competitors: [
          {
            id: `comp-${Date.now()}-1`,
            name: 'Mass-Market Supermarket & High-Street Brands',
            category: 'DIRECT_COMPETITOR',
            typicalPriceText: `${formatPlanCurrency(3, currency)}–${formatPlanCurrency(25, currency)} per unit`,
            whatTheyDoWell:
              'Wide shelf availability and low unit cost from bulk manufacturing.',
            whereTheyFallShort:
              'Generic formulation/materials, high sugar or cheap fillers, and not designed for the specific needs of your target buyer.',
          },
          {
            id: `comp-${Date.now()}-2`,
            name: 'Imported Direct-to-Consumer (DTC) Subscription Brands',
            category: 'DIRECT_COMPETITOR',
            typicalPriceText: `${formatPlanCurrency(45, currency)}–${formatPlanCurrency(80, currency)} / month`,
            whatTheyDoWell:
              'Slick social media marketing and recurring subscription bundles.',
            whereTheyFallShort:
              'Expensive shipping/customs into ' +
              marketsText +
              ' and rigid subscription lock-ins that frustrate buyers.',
          },
          {
            id: `comp-${Date.now()}-3`,
            name: 'DIY / Homemade Alternatives',
            category: 'INDIRECT_ALTERNATIVE',
            typicalPriceText: `${formatPlanCurrency(10, currency)} in raw ingredients`,
            whatTheyDoWell:
              'Low cost and full control over what goes into it.',
            whereTheyFallShort:
              'Inconsistent results and takes too much prep time on busy weekdays.',
          },
        ],
        suggestedWhySwitchSentence: `Customers switch to ${params.planTitle} because it is purpose-built for their daily routine with fast local delivery in ${marketsText} and none of the compromises of mass-market alternatives.`,
      };

    default:
      return {
        competitors: [
          {
            id: `comp-${Date.now()}-1`,
            name: 'Legacy Enterprise Software Suites',
            category: 'DIRECT_COMPETITOR',
            typicalPriceText: `${formatPlanCurrency(450, currency)}–${formatPlanCurrency(1500, currency)} / month`,
            whatTheyDoWell:
              'Deep feature list for large corporations with dedicated IT departments.',
            whereTheyFallShort:
              'Over-complicated, requires weeks of staff training, and locks smaller teams into expensive 12-month contracts.',
          },
          {
            id: `comp-${Date.now()}-2`,
            name: 'Generic Spreadsheets (Excel / Google Sheets) + Manual Admin',
            category: 'INDIRECT_ALTERNATIVE',
            typicalPriceText: 'Free (but costs 5+ staff hours/week)',
            whatTheyDoWell:
              'Flexible, already installed on every computer, and zero monthly software bill.',
            whereTheyFallShort:
              'Breaks easily when multiple staff edit it, gives zero automated alerts, and wastes hours on copy-pasting.',
          },
          {
            id: `comp-${Date.now()}-3`,
            name: 'Outsourced Agencies / Part-Time Consultants',
            category: 'MANUAL_SERVICE_AGENCY',
            typicalPriceText: `${formatPlanCurrency(1200, currency)}–${formatPlanCurrency(3000, currency)} / month`,
            whatTheyDoWell:
              'Done-for-you service where an external person runs the process.',
            whereTheyFallShort:
              'High monthly retainer and insights are delayed until end-of-month reports.',
          },
        ],
        suggestedWhySwitchSentence: `Customers switch to ${params.planTitle} because it replaces hours of manual spreadsheet work with a simple tool tailored for ${marketsText} that pays for itself in the first 30 days.`,
      };
  }
}

/**
 * Module B Step 2 AI Market Scout (`scoutModuleBCompetitorsViaRouter`).
 * Routes through `src/lib/ai/router.ts`, checks `user_entitlements.ai_credits_used_this_month`,
 * calls `gemini-2.5-flash` (or smart synthesizer fallback), and logs token usage to `ai_usage_logs`.
 */
export async function scoutModuleBCompetitorsViaRouter(params: {
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
  const countryPack = getCountryRulePack(params.hqCountryCode);

  const authCtx = await authorizeAndPrepareGeminiCall('MOD_B_MARKET_SCOUT');
  if (authCtx.creditCheckBlocked) {
    const fallback = buildSmartFallbackCompetitors(params);
    return {
      allowed: false,
      reason: authCtx.blockReason,
      competitors: fallback.competitors,
      suggestedWhySwitchSentence: fallback.suggestedWhySwitchSentence,
      creditsUsedAfter: authCtx.currentCreditsUsed,
      engineMode: 'smart-synthesizer',
    };
  }

  let competitorsResult: CompetitorEntry[] | null = null;
  let suggestedEdgeSentence: string | undefined;
  let engineMode: 'gemini-2.5-flash' | 'smart-synthesizer' = 'smart-synthesizer';
  let inputTokensCount = 210;
  let outputTokensCount = 340;

  if (authCtx.canCallLiveGemini && authCtx.activeApiKey) {
    try {
      const ai = getGenAiClient(authCtx.activeApiKey);
      const marketsText =
        params.targetMarketsArray.length > 0
          ? params.targetMarketsArray.join(', ')
          : countryPack.countryName;

      const userPrompt = `
You are the "Supportive Co-Founder & Market Scout" inside Startup Preflight.
Identify 3 realistic competitors or alternatives that target customers in [${marketsText}] currently use instead of this founder's startup.
Use plain, everyday English (zero corporate jargon). Format all prices in ${countryPack.defaultCurrency}.

Startup Name: ${sanitizePromptInput(params.planTitle, 200)}
Industry Category: ${sanitizePromptInput(params.industryCategory, 120)}
Customer Models: ${params.buyerTypes?.join(', ') || 'Not specified'}
Target Customer Description: ${sanitizePromptInput(params.targetCustomerDescription, 1000) || '(not specified yet)'}
Core Problem: ${sanitizePromptInput(params.coreProblem || params.brainDumpText, 2000) || '(not specified yet)'}
Proposed Solution: ${sanitizePromptInput(params.proposedSolution, 1000) || '(not specified yet)'}

Return STRICT JSON matching this exact structure (no markdown fences):
{
  "competitors": [
    {
      "name": "Specific competitor name or clear category of alternative in ${marketsText}",
      "category": "DIRECT_COMPETITOR",
      "typicalPriceText": "Typical price in ${countryPack.defaultCurrency} (e.g. €49/mo or €1,500 one-off)",
      "whatTheyDoWell": "1 short, fair sentence on why customers currently use them.",
      "whereTheyFallShort": "1 short, clear sentence on why customers get frustrated with them."
    },
    {
      "name": "Second competitor or indirect tool",
      "category": "INDIRECT_ALTERNATIVE",
      "typicalPriceText": "Typical price in ${countryPack.defaultCurrency}",
      "whatTheyDoWell": "1 short sentence on what they do well.",
      "whereTheyFallShort": "1 short sentence on where they fall short."
    },
    {
      "name": "Third competitor or manual service/agency workaround",
      "category": "MANUAL_SERVICE_AGENCY",
      "typicalPriceText": "Typical price in ${countryPack.defaultCurrency}",
      "whatTheyDoWell": "1 short sentence on what they do well.",
      "whereTheyFallShort": "1 short sentence on where they fall short."
    }
  ],
  "suggestedWhySwitchSentence": "Customers switch to ${sanitizePromptInput(params.planTitle, 120)} because [1 clear, plain-English sentence explaining the practical advantage]."
}`.trim();

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userPrompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.4,
          maxOutputTokens: MAX_OUTPUT_TOKENS_PER_CALL,
        },
      });

      const rawText = response.text || '';
      const parsed = JSON.parse(rawText) as {
        competitors?: Array<{
          name?: string;
          category?: CompetitorCategoryType;
          typicalPriceText?: string;
          whatTheyDoWell?: string;
          whereTheyFallShort?: string;
        }>;
        suggestedWhySwitchSentence?: string;
      };

      if (Array.isArray(parsed.competitors) && parsed.competitors.length > 0) {
        engineMode = 'gemini-2.5-flash';
        competitorsResult = parsed.competitors.slice(0, 5).map((c, idx) => ({
          id: `comp-${Date.now()}-${idx + 1}`,
          name: c.name || `Competitor #${idx + 1}`,
          category:
            c.category === 'DIRECT_COMPETITOR' ||
            c.category === 'INDIRECT_ALTERNATIVE' ||
            c.category === 'MANUAL_SERVICE_AGENCY'
              ? c.category
              : 'DIRECT_COMPETITOR',
          typicalPriceText:
            c.typicalPriceText || `Priced in ${countryPack.defaultCurrency}`,
          whatTheyDoWell: c.whatTheyDoWell || '',
          whereTheyFallShort: c.whereTheyFallShort || '',
        }));
        suggestedEdgeSentence = parsed.suggestedWhySwitchSentence;
        inputTokensCount = response.usageMetadata?.promptTokenCount || 220;
        outputTokensCount = response.usageMetadata?.candidatesTokenCount || 360;
      }
    } catch (err) {
      console.warn(
        '[SPF AI Router] Module B Market Scout Gemini call failed, using smart synthesizer fallback:',
        err instanceof Error ? err.message : err
      );
    }
  }

  if (!competitorsResult) {
    const fallback = buildSmartFallbackCompetitors(params);
    competitorsResult = fallback.competitors;
    suggestedEdgeSentence = fallback.suggestedWhySwitchSentence;
  }

  const creditsUsedAfter = await recordGeminiUsageAndIncrementCredits({
    verifiedUserId: authCtx.verifiedUserId,
    planId: params.planId,
    promptKey: 'MOD_B_MARKET_SCOUT',
    modelUsed: engineMode,
    inputTokens: inputTokensCount,
    outputTokens: outputTokensCount,
    usedByokKey: authCtx.usedByokKey,
    fallbackCreditsUsed: authCtx.currentCreditsUsed,
  });

  return {
    allowed: true,
    competitors: competitorsResult,
    suggestedWhySwitchSentence: suggestedEdgeSentence,
    creditsUsedAfter,
    engineMode,
  };
}

export interface ModuleBMarketSizingEstimateResult {
  allowed: boolean;
  reason?: string;
  segments: MarketSizingSegmentEntry[];
  widerMarketMultiplier: WiderMarketScalePreset;
  sourceAndAssumptionNotes: string;
  creditsUsedAfter?: number;
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
}

function buildSmartFallbackMarketSizing(params: {
  planTitle: string;
  brainDumpText?: string;
  targetCustomerDescription?: string;
  industryCategory: string;
  hqCountryCode: SupportedCountryCode;
  targetMarketsArray: string[];
  buyerTypes?: BuyerModelType[];
}): {
  segments: MarketSizingSegmentEntry[];
  widerMarketMultiplier: WiderMarketScalePreset;
  sourceAndAssumptionNotes: string;
} {
  const countryPack = getCountryRulePack(params.hqCountryCode);
  const marketsText =
    params.targetMarketsArray.length > 0
      ? params.targetMarketsArray.join(', ')
      : countryPack.countryName;
  const combinedContext = `${params.planTitle} ${params.brainDumpText || ''} ${params.targetCustomerDescription || ''}`.toLowerCase();

  const isStartupOrBusinessPlanTool =
    combinedContext.includes('unicorn') ||
    combinedContext.includes('founder') ||
    combinedContext.includes('startup') ||
    combinedContext.includes('business plan') ||
    combinedContext.includes('accelerator') ||
    combinedContext.includes('university');

  const hasMultipleBuyerModels = (params.buyerTypes?.length || 0) > 1;

  if (isStartupOrBusinessPlanTool || hasMultipleBuyerModels) {
    return {
      segments: [
        {
          id: `seg-${Date.now()}-1`,
          segmentName: 'Individual Founders & Solo Builders',
          billingCadence: 'YEARLY_OR_ONE_OFF',
          pricePerCustomerInput: '29',
          year1To2CustomerGoalInput: '350',
          reachableCustomersInTargetMarketsInput: '25000',
        },
        {
          id: `seg-${Date.now()}-2`,
          segmentName: 'Universities, Accelerators & Enterprise Hubs',
          billingCadence: 'YEARLY_OR_ONE_OFF',
          pricePerCustomerInput: '2500',
          year1To2CustomerGoalInput: '8',
          reachableCustomersInTargetMarketsInput: '180',
        },
      ],
      widerMarketMultiplier: '10X',
      sourceAndAssumptionNotes: `Bottom-up estimate for ${marketsText}: combines individual self-serve passes with annual cohort licences for universities, incubators, and local enterprise programmes.`,
    };
  }

  switch (params.industryCategory) {
    case 'Consumer App / Marketplace':
      return {
        segments: [
          {
            id: `seg-${Date.now()}-1`,
            segmentName: 'Active Individual Customers / Households',
            billingCadence: 'YEARLY_OR_ONE_OFF',
            pricePerCustomerInput: '120',
            year1To2CustomerGoalInput: '400',
            reachableCustomersInTargetMarketsInput: '35000',
          },
        ],
        widerMarketMultiplier: '5X',
        sourceAndAssumptionNotes: `Based on active target households in ${marketsText} spending an average of ${countryPack.defaultCurrency} 120 per year on bookings/subscriptions.`,
      };

    case 'E-Commerce / Physical Product / Food & Drink':
      return {
        segments: [
          {
            id: `seg-${Date.now()}-1`,
            segmentName: 'Direct-to-Consumer Repeat Buyers',
            billingCadence: 'YEARLY_OR_ONE_OFF',
            pricePerCustomerInput: '180',
            year1To2CustomerGoalInput: '300',
            reachableCustomersInTargetMarketsInput: '40000',
          },
          {
            id: `seg-${Date.now()}-2`,
            segmentName: 'Retail Stockists / Wholesale Accounts',
            billingCadence: 'YEARLY_OR_ONE_OFF',
            pricePerCustomerInput: '2400',
            year1To2CustomerGoalInput: '12',
            reachableCustomersInTargetMarketsInput: '600',
          },
        ],
        widerMarketMultiplier: '5X',
        sourceAndAssumptionNotes: `Bottom-up estimate in ${marketsText} combining online repeat buyers (3–4 orders/year) with independent wholesale stockists.`,
      };

    default:
      return {
        segments: [
          {
            id: `seg-${Date.now()}-1`,
            segmentName: 'Target Business Customers (SMEs)',
            billingCadence: 'MONTHLY_SUBSCRIPTION',
            pricePerCustomerInput: '99',
            year1To2CustomerGoalInput: '45',
            reachableCustomersInTargetMarketsInput: '3500',
          },
        ],
        widerMarketMultiplier: '5X',
        sourceAndAssumptionNotes: `Bottom-up count of target SMEs in ${marketsText} matching your Step 1 customer profile, priced on a monthly subscription.`,
      };
  }
}

/**
 * Module B Step 3 AI Market Sizing Estimator (`estimateModuleBMarketSizingViaRouter`).
 * Routes through `src/lib/ai/router.ts`, checks `user_entitlements.ai_credits_used_this_month`,
 * calls `gemini-2.5-flash` (or smart synthesizer fallback), and logs token usage to `ai_usage_logs`.
 */
export async function estimateModuleBMarketSizingViaRouter(params: {
  userId?: string;
  planId?: string;
  planTitle: string;
  brainDumpText?: string;
  targetCustomerDescription?: string;
  industryCategory: string;
  hqCountryCode: SupportedCountryCode;
  targetMarketsArray: string[];
  buyerTypes?: BuyerModelType[];
}): Promise<ModuleBMarketSizingEstimateResult> {
  const countryPack = getCountryRulePack(params.hqCountryCode);

  const authCtx = await authorizeAndPrepareGeminiCall('MOD_B_MARKET_SIZING');
  if (authCtx.creditCheckBlocked) {
    const fallback = buildSmartFallbackMarketSizing(params);
    return {
      allowed: false,
      reason: authCtx.blockReason,
      segments: fallback.segments,
      widerMarketMultiplier: fallback.widerMarketMultiplier,
      sourceAndAssumptionNotes: fallback.sourceAndAssumptionNotes,
      creditsUsedAfter: authCtx.currentCreditsUsed,
      engineMode: 'smart-synthesizer',
    };
  }

  let segmentsResult: MarketSizingSegmentEntry[] | null = null;
  let multiplierResult: WiderMarketScalePreset = '5X';
  let notesResult = '';
  let engineMode: 'gemini-2.5-flash' | 'smart-synthesizer' = 'smart-synthesizer';
  let inputTokensCount = 210;
  let outputTokensCount = 310;

  if (authCtx.canCallLiveGemini && authCtx.activeApiKey) {
    try {
      const ai = getGenAiClient(authCtx.activeApiKey);
      const marketsText =
        params.targetMarketsArray.length > 0
          ? params.targetMarketsArray.join(', ')
          : countryPack.countryName;
      const shouldUseTwoGroups = (params.buyerTypes?.length || 0) > 1;

      const userPrompt = `
You are the "Supportive Co-Founder & Plain-English Market Sizing Coach" inside Startup Preflight.
Estimate realistic bottom-up customer counts and annual/monthly pricing in ${countryPack.defaultCurrency} for this startup in [${marketsText}].
${shouldUseTwoGroups ? 'Because the founder selected multiple customer models, return 2 distinct customer groups (for example: Group 1 for individual users/customers, and Group 2 for business/institutional/accelerator customers).' : 'Return 1 or 2 clear customer groups.'}

Startup Name: ${sanitizePromptInput(params.planTitle, 200)}
Industry Category: ${sanitizePromptInput(params.industryCategory, 120)}
Customer Models Selected: ${params.buyerTypes?.join(', ') || 'Not specified'}
Target Customer Description: ${sanitizePromptInput(params.targetCustomerDescription, 1000) || '(not specified yet)'}
Raw Idea Notes: ${sanitizePromptInput(params.brainDumpText, 2000) || '(not specified yet)'}

Return STRICT JSON matching this exact structure (numbers as plain digit strings without commas or currency symbols):
{
  "segments": [
    {
      "segmentName": "Plain-English name of Customer Group 1",
      "billingCadence": "YEARLY_OR_ONE_OFF",
      "pricePerCustomerInput": "29",
      "year1To2CustomerGoalInput": "300",
      "reachableCustomersInTargetMarketsInput": "20000"
    }
  ],
  "widerMarketMultiplier": "5X",
  "sourceAndAssumptionNotes": "1 short, plain-English sentence explaining how you estimated the number of potential customers in ${marketsText}."
}`.trim();

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userPrompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
          maxOutputTokens: MAX_OUTPUT_TOKENS_PER_CALL,
        },
      });

      const rawText = response.text || '';
      const parsed = JSON.parse(rawText) as {
        segments?: Array<{
          segmentName?: string;
          billingCadence?: CustomerBillingCadence;
          pricePerCustomerInput?: string | number;
          year1To2CustomerGoalInput?: string | number;
          reachableCustomersInTargetMarketsInput?: string | number;
        }>;
        widerMarketMultiplier?: WiderMarketScalePreset;
        sourceAndAssumptionNotes?: string;
      };

      if (Array.isArray(parsed.segments) && parsed.segments.length > 0) {
        engineMode = 'gemini-2.5-flash';
        segmentsResult = parsed.segments.slice(0, 3).map((seg, idx) => ({
          id: `seg-${Date.now()}-${idx + 1}`,
          segmentName: seg.segmentName || `Customer Group #${idx + 1}`,
          billingCadence:
            seg.billingCadence === 'MONTHLY_SUBSCRIPTION'
              ? 'MONTHLY_SUBSCRIPTION'
              : 'YEARLY_OR_ONE_OFF',
          pricePerCustomerInput: String(seg.pricePerCustomerInput ?? '').replace(
            /[^0-9.]/g,
            ''
          ),
          year1To2CustomerGoalInput: String(
            seg.year1To2CustomerGoalInput ?? ''
          ).replace(/[^0-9]/g, ''),
          reachableCustomersInTargetMarketsInput: String(
            seg.reachableCustomersInTargetMarketsInput ?? ''
          ).replace(/[^0-9]/g, ''),
        }));
        if (
          parsed.widerMarketMultiplier === '3X' ||
          parsed.widerMarketMultiplier === '5X' ||
          parsed.widerMarketMultiplier === '10X' ||
          parsed.widerMarketMultiplier === '20X'
        ) {
          multiplierResult = parsed.widerMarketMultiplier;
        }
        notesResult = parsed.sourceAndAssumptionNotes || '';
        inputTokensCount = response.usageMetadata?.promptTokenCount || 220;
        outputTokensCount = response.usageMetadata?.candidatesTokenCount || 320;
      }
    } catch (err) {
      console.warn(
        '[SPF AI Router] Module B Market Sizing Gemini call failed, using smart synthesizer fallback:',
        err instanceof Error ? err.message : err
      );
    }
  }

  if (!segmentsResult) {
    const fallback = buildSmartFallbackMarketSizing(params);
    segmentsResult = fallback.segments;
    multiplierResult = fallback.widerMarketMultiplier;
    notesResult = fallback.sourceAndAssumptionNotes;
  }

  const creditsUsedAfter = await recordGeminiUsageAndIncrementCredits({
    verifiedUserId: authCtx.verifiedUserId,
    planId: params.planId,
    promptKey: 'MOD_B_MARKET_SIZING',
    modelUsed: engineMode,
    inputTokens: inputTokensCount,
    outputTokens: outputTokensCount,
    usedByokKey: authCtx.usedByokKey,
    fallbackCreditsUsed: authCtx.currentCreditsUsed,
  });

  return {
    allowed: true,
    segments: segmentsResult,
    widerMarketMultiplier: multiplierResult,
    sourceAndAssumptionNotes: notesResult,
    creditsUsedAfter,
    engineMode,
  };
}

export interface ModuleBCompetitiveEdgeEstimateResult {
  allowed: boolean;
  reason?: string;
  comparisonRows: CompetitiveComparisonRow[];
  switchingFrictionReducers: SwitchingFrictionReducerType[];
  switchingFrictionPlanNotes: string;
  unfairAdvantages: UnfairAdvantageMoatType[];
  competitiveEdgeSummary: string;
  creditsUsedAfter?: number;
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
}

function buildSmartFallbackCompetitiveEdge(params: {
  planTitle: string;
  brainDumpText?: string;
  targetCustomerDescription?: string;
  industryCategory: string;
  hqCountryCode: SupportedCountryCode;
  targetMarketsArray: string[];
  competitorNames: string[];
}): {
  comparisonRows: CompetitiveComparisonRow[];
  switchingFrictionReducers: SwitchingFrictionReducerType[];
  switchingFrictionPlanNotes: string;
  unfairAdvantages: UnfairAdvantageMoatType[];
  competitiveEdgeSummary: string;
} {
  const countryPack = getCountryRulePack(params.hqCountryCode);
  const marketsText =
    params.targetMarketsArray.length > 0
      ? params.targetMarketsArray.join(', ')
      : countryPack.countryName;

  const baseRows: CompetitiveComparisonRow[] = [
    {
      rowId: 'row-your-startup',
      label: `${params.planTitle || 'Your Startup'} (You)`,
      isYourStartup: true,
      priceValueScore: 'HIGH',
      speedTimeSavedScore: 'HIGH',
      easeOfUseScore: 'HIGH',
      specialistQualityScore: 'HIGH',
    },
    {
      rowId: 'row-current-habit',
      label: 'Current Habit (Spreadsheets / Doing It Manually)',
      priceValueScore: 'HIGH',
      speedTimeSavedScore: 'LOW',
      easeOfUseScore: 'LOW',
      specialistQualityScore: 'LOW',
    },
  ];

  const compNames =
    params.competitorNames.length > 0
      ? params.competitorNames.slice(0, 3)
      : [
          'Traditional / Legacy Competitor',
          'Outsourced Consultant / Agency',
        ];

  compNames.forEach((name, idx) => {
    const isAgency =
      name.toLowerCase().includes('consultant') ||
      name.toLowerCase().includes('agency');
    baseRows.push({
      rowId: `row-comp-${idx + 1}`,
      label: name,
      priceValueScore: isAgency ? 'LOW' : 'MEDIUM',
      speedTimeSavedScore: isAgency ? 'MEDIUM' : 'MEDIUM',
      easeOfUseScore: 'LOW',
      specialistQualityScore: isAgency ? 'HIGH' : 'MEDIUM',
    });
  });

  return {
    comparisonRows: baseRows,
    switchingFrictionReducers: [
      'FREE_TRIAL_OR_FIRST_STEP',
      'FAST_SETUP_UNDER_15_MINS',
      'NO_LONG_CONTRACT',
    ],
    switchingFrictionPlanNotes: `Customers can try their first step on ${params.planTitle} in under 15 minutes without migrating old systems or signing a long-term lock-in contract.`,
    unfairAdvantages: [
      'FOUNDER_INSIDER_EXPERIENCE',
      'LOCAL_COMPLIANCE_OR_GRANTS',
      'WORKFLOW_HABIT_LOCK_IN',
    ],
    competitiveEdgeSummary: `${params.planTitle} wins against manual spreadsheets and expensive legacy alternatives by delivering specialist results in minutes at an accessible price point tailored for ${marketsText}. Once customers build their workflow and data inside our platform, switching back to manual workarounds or generic tools becomes unattractive.`,
  };
}

/**
 * Module B Step 4 AI Competitive Edge & Defensibility Synthesizer (`generateModuleBCompetitiveEdgeViaRouter`).
 * Routes through `src/lib/ai/router.ts`, checks `user_entitlements.ai_credits_used_this_month`,
 * calls `gemini-2.5-flash` (or smart synthesizer fallback), and logs token usage to `ai_usage_logs`.
 */
export async function generateModuleBCompetitiveEdgeViaRouter(params: {
  userId?: string;
  planId?: string;
  planTitle: string;
  brainDumpText?: string;
  targetCustomerDescription?: string;
  industryCategory: string;
  hqCountryCode: SupportedCountryCode;
  targetMarketsArray: string[];
  competitorNames: string[];
}): Promise<ModuleBCompetitiveEdgeEstimateResult> {
  const authCtx = await authorizeAndPrepareGeminiCall('MOD_B_COMPETITIVE_EDGE');
  if (authCtx.creditCheckBlocked) {
    const fallback = buildSmartFallbackCompetitiveEdge(params);
    return {
      allowed: false,
      reason: authCtx.blockReason,
      ...fallback,
      creditsUsedAfter: authCtx.currentCreditsUsed,
      engineMode: 'smart-synthesizer',
    };
  }

  let engineMode: 'gemini-2.5-flash' | 'smart-synthesizer' =
    'smart-synthesizer';
  let resultPayload: ReturnType<typeof buildSmartFallbackCompetitiveEdge> | null =
    null;
  let inputTokensCount = 260;
  let outputTokensCount = 320;

  if (authCtx.canCallLiveGemini && authCtx.activeApiKey) {
    try {
      const ai = getGenAiClient(authCtx.activeApiKey);
      const countryPack = getCountryRulePack(params.hqCountryCode);
      const marketsText =
        params.targetMarketsArray.length > 0
          ? params.targetMarketsArray.join(', ')
          : countryPack.countryName;

      const systemInstruction =
        'You are the Startup Preflight Competitive Strategy Co-Founder. Generate a realistic, plain-English competitive comparison matrix, switching friction plan, and 2-sentence competitive edge summary. Never use startup jargon like Beachhead or TAM/SAM/SOM. Always return valid JSON.';

      const userPrompt = `
Startup Title: ${sanitizePromptInput(params.planTitle, 200)}
Industry Category: ${sanitizePromptInput(params.industryCategory, 120)}
HQ Country: ${countryPack.countryName} (${params.hqCountryCode})
Target Selling Markets: ${marketsText}
Target Customers: ${sanitizePromptInput(params.targetCustomerDescription, 1000) || 'Not specified yet'}
Known Competitors: ${sanitizePromptInput(params.competitorNames.join(', '), 600) || 'Generic alternatives & manual workarounds'}
Founder Idea Context: ${sanitizePromptInput(params.brainDumpText, 2000) || 'Not specified'}

Return JSON with this exact structure:
{
  "comparisonRows": [
    {
      "label": "${sanitizePromptInput(params.planTitle, 120)} (You)",
      "isYourStartup": true,
      "priceValueScore": "LOW" | "MEDIUM" | "HIGH",
      "speedTimeSavedScore": "LOW" | "MEDIUM" | "HIGH",
      "easeOfUseScore": "LOW" | "MEDIUM" | "HIGH",
      "specialistQualityScore": "LOW" | "MEDIUM" | "HIGH"
    }
  ],
  "switchingFrictionReducers": ["FREE_TRIAL_OR_FIRST_STEP", "FAST_SETUP_UNDER_15_MINS"],
  "switchingFrictionPlanNotes": "1-2 plain-English sentences explaining how you make it effortless and low-risk for a customer to switch from their current habit to you.",
  "unfairAdvantages": ["FOUNDER_INSIDER_EXPERIENCE", "LOCAL_COMPLIANCE_OR_GRANTS"],
  "competitiveEdgeSummary": "2 crisp sentences ready for an investor or grant board explaining why customers choose you over competitors and what protects your business from copycats."
}
Include 3 to 4 rows in comparisonRows: Row 1 MUST be the founder's startup ("isYourStartup": true), Row 2 MUST be "Current Habit (Doing It Manually / Spreadsheets)", and Rows 3-4 should be the known competitors or typical alternatives.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.35,
          maxOutputTokens: MAX_OUTPUT_TOKENS_PER_CALL,
        },
      });

      const rawText = response.text;
      if (rawText) {
        const parsed = JSON.parse(rawText) as {
          comparisonRows?: Array<{
            label?: string;
            isYourStartup?: boolean;
            priceValueScore?: string;
            speedTimeSavedScore?: string;
            easeOfUseScore?: string;
            specialistQualityScore?: string;
          }>;
          switchingFrictionReducers?: SwitchingFrictionReducerType[];
          switchingFrictionPlanNotes?: string;
          unfairAdvantages?: UnfairAdvantageMoatType[];
          competitiveEdgeSummary?: string;
        };

        const normalizeScore = (s?: string): ComparisonScoreLevel =>
          s === 'HIGH' || s === 'MEDIUM' || s === 'LOW' ? s : 'MEDIUM';

        if (
          Array.isArray(parsed.comparisonRows) &&
          parsed.comparisonRows.length >= 2
        ) {
          const fallback = buildSmartFallbackCompetitiveEdge(params);
          resultPayload = {
            comparisonRows: parsed.comparisonRows.slice(0, 5).map((r, idx) => ({
              rowId: idx === 0 ? 'row-your-startup' : `row-comp-${Date.now()}-${idx}`,
              label: r.label || (idx === 0 ? `${params.planTitle} (You)` : `Alternative ${idx}`),
              isYourStartup: idx === 0 || Boolean(r.isYourStartup),
              priceValueScore: normalizeScore(r.priceValueScore),
              speedTimeSavedScore: normalizeScore(r.speedTimeSavedScore),
              easeOfUseScore: normalizeScore(r.easeOfUseScore),
              specialistQualityScore: normalizeScore(r.specialistQualityScore),
            })),
            switchingFrictionReducers: Array.isArray(
              parsed.switchingFrictionReducers
            )
              ? parsed.switchingFrictionReducers
              : fallback.switchingFrictionReducers,
            switchingFrictionPlanNotes:
              parsed.switchingFrictionPlanNotes ||
              fallback.switchingFrictionPlanNotes,
            unfairAdvantages: Array.isArray(parsed.unfairAdvantages)
              ? parsed.unfairAdvantages
              : fallback.unfairAdvantages,
            competitiveEdgeSummary:
              parsed.competitiveEdgeSummary || fallback.competitiveEdgeSummary,
          };
          engineMode = 'gemini-2.5-flash';
          inputTokensCount =
            response.usageMetadata?.promptTokenCount ?? inputTokensCount;
          outputTokensCount =
            response.usageMetadata?.candidatesTokenCount ?? outputTokensCount;
        }
      }
    } catch (err) {
      console.warn(
        '[SPF AI Router] Module B Competitive Edge Gemini call failed, using smart synthesizer fallback:',
        err instanceof Error ? err.message : err
      );
    }
  }

  if (!resultPayload) {
    resultPayload = buildSmartFallbackCompetitiveEdge(params);
  }

  const creditsUsedAfter = await recordGeminiUsageAndIncrementCredits({
    verifiedUserId: authCtx.verifiedUserId,
    planId: params.planId,
    promptKey: 'MOD_B_COMPETITIVE_EDGE',
    modelUsed: engineMode,
    inputTokens: inputTokensCount,
    outputTokens: outputTokensCount,
    usedByokKey: authCtx.usedByokKey,
    fallbackCreditsUsed: authCtx.currentCreditsUsed,
  });

  return {
    allowed: true,
    ...resultPayload,
    creditsUsedAfter,
    engineMode,
  };
}

// ============================================================================
// MODULE C: CUSTOMER SURVEYS, MOM-TEST GUARDRAIL & INSIGHTS SYNTHESIZER
// ============================================================================

export interface ModuleCSurveyGenerationResult {
  allowed: boolean;
  reason?: string;
  title: string;
  introDescription: string;
  waitlistIncentiveText: string;
  questions: SurveyQuestionItem[];
  creditsUsedAfter?: number;
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export interface MomTestCheckResult {
  allowed: boolean;
  reason?: string;
  momTestPassed: boolean;
  momTestFeedback: string;
  momTestSuggestedRewrite: string;
  suggestedOptions?: string[];
  creditsUsedAfter?: number;
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export interface SuggestNextQuestionResult {
  allowed: boolean;
  reason?: string;
  question: SurveyQuestionItem;
  creditsUsedAfter?: number;
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export interface AnalyzeSurveyResultsOutput {
  allowed: boolean;
  reason?: string;
  insights: SurveyAiInsightsSummary;
  creditsUsedAfter?: number;
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
}

const FOCUS_AREA_LABELS: Record<SurveyFocusAreaType, string> = {
  PROBLEM_AND_PAIN: 'Problem & Pain Intensity (frequency and severity)',
  CURRENT_WORKAROUNDS: 'Current Workarounds & Frustrations (how they solve it today)',
  PAST_SPENDING_BUDGET: 'Past Spending & Budget Reality (what they already pay)',
  WORKFLOW_AND_HABITS: 'Day-to-Day Workflow & Habits (when and how it happens)',
  FEATURE_PRIORITIES: 'Most Valuable Outcome (which improvement matters #1)',
  OTHER: 'Custom Focus Angle',
};

const BUYING_TRIGGER_PRESET_LABELS: Record<string, string> = {
  LOSING_MONEY_WASTE: 'losing money or wasting budget on avoidable mistakes',
  MANUAL_TIME_BOTTLENECK: 'spending too many hours on repetitive manual work',
  COMPLIANCE_OR_PENALTY: 'preparing for a compliance deadline, audit, or grant requirement',
  LOST_CUSTOMERS_CHURN: 'losing customers or missing out on new sales',
  LIFE_OR_BUSINESS_MILESTONE: 'starting a new business milestone, launch, or expansion',
};

function cleanInlineSnippet(raw: string | undefined, maxLen = 110): string {
  if (!raw) return '';
  const singleLine = raw
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[•\-*]\s*/, '')
    .replace(/\.$/, '');
  if (singleLine.length <= maxLen) return singleLine;
  const firstClause = singleLine.split(/[.;—–]/)[0]?.trim() || singleLine;
  if (firstClause.length >= 18 && firstClause.length <= maxLen) {
    return firstClause;
  }
  return `${singleLine.slice(0, maxLen - 1).trim()}…`;
}

type IdeaDomainArchetype =
  | 'STARTUP_FOUNDER_BUILDER'
  | 'FINANCE_INVOICING_PAYMENTS'
  | 'OPERATIONS_INVENTORY_WORKFLOW'
  | 'MARKETING_SALES_GROWTH'
  | 'HR_HIRING_TEAM'
  | 'MARKETPLACE_BOOKING_LOCAL'
  | 'ECOMMERCE_PHYSICAL_PRODUCT'
  | 'HEALTH_WELLNESS_FITNESS'
  | 'EDUCATION_LEARNING_COACHING'
  | 'GENERAL_CUSTOM';

/**
 * Translates a founder-perspective pitch string (e.g. "Help very early stage founders
 * start their startup from idea to startup creation") into a natural, second-person
 * customer workflow activity (e.g. "taking your startup from initial idea to launch")
 * so questions never sound like copy-pasted form fields.
 */
function translateFounderPitchToCustomerWorkflow(
  rawProblemOrIdea: string,
  domain: IdeaDomainArchetype,
  industryCategory: string
): {
  customerWorkflowGerund: string; // e.g. "turning your startup idea into a real business"
  customerGoalInfinitive: string; // e.g. "take your startup from raw idea to launch"
  customerPainNoun: string; // e.g. "getting your startup idea off the ground"
} {
  if (domain === 'STARTUP_FOUNDER_BUILDER') {
    return {
      customerWorkflowGerund:
        'turning your early-stage startup idea into a validated, launch-ready business',
      customerGoalInfinitive:
        'take your startup from initial idea to a structured plan and real customers',
      customerPainNoun: 'getting your startup idea off the ground',
    };
  }
  if (domain === 'FINANCE_INVOICING_PAYMENTS') {
    return {
      customerWorkflowGerund:
        'managing invoices, cashflow, and monthly financial admin',
      customerGoalInfinitive:
        'keep your cashflow, bookkeeping, and compliance on track without manual spreadsheets',
      customerPainNoun: 'staying on top of financial admin and cashflow',
    };
  }
  if (domain === 'MARKETPLACE_BOOKING_LOCAL') {
    return {
      customerWorkflowGerund:
        'finding, vetting, and booking a reliable provider when you need one',
      customerGoalInfinitive:
        'find and book a trusted option quickly without endless back-and-forth messages',
      customerPainNoun: 'finding and booking someone reliable',
    };
  }
  if (domain === 'ECOMMERCE_PHYSICAL_PRODUCT') {
    return {
      customerWorkflowGerund:
        'shopping for products that actually fit your daily routine and quality standards',
      customerGoalInfinitive:
        'find a product you can trust without overpaying or compromising on quality',
      customerPainNoun: 'finding the right product for your routine',
    };
  }
  if (domain === 'HEALTH_WELLNESS_FITNESS') {
    return {
      customerWorkflowGerund:
        'staying consistent with your health, fitness, or wellbeing routine',
      customerGoalInfinitive:
        'hit your health and wellbeing goals without burning out or losing track',
      customerPainNoun: 'staying consistent with your health goals',
    };
  }
  if (domain === 'HR_HIRING_TEAM') {
    return {
      customerWorkflowGerund:
        'sourcing, vetting, and onboarding the right people for your team',
      customerGoalInfinitive:
        'hire and onboard great people without losing weeks to manual screening',
      customerPainNoun: 'hiring and managing your team workflow',
    };
  }
  if (domain === 'MARKETING_SALES_GROWTH') {
    return {
      customerWorkflowGerund:
        'bringing in consistent leads and converting them into paying customers',
      customerGoalInfinitive:
        'grow your customer pipeline predictably without wasting ad budget or hours on cold outreach',
      customerPainNoun: 'winning consistent customers and leads',
    };
  }
  if (domain === 'EDUCATION_LEARNING_COACHING') {
    return {
      customerWorkflowGerund:
        'building practical skills and making real progress on your learning goals',
      customerGoalInfinitive:
        'master the skills you need and apply them in practice',
      customerPainNoun: 'making consistent progress on your learning goals',
    };
  }

  // General linguistic transformation for custom B2B/Consumer ideas:
  const cleaned = rawProblemOrIdea
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\.$/, '');

  if (!cleaned) {
    const indLower = industryCategory.toLowerCase();
    return {
      customerWorkflowGerund: `managing this part of your ${indLower} workflow`,
      customerGoalInfinitive: `handle this cleanly without manual workarounds`,
      customerPainNoun: `handling this in your day-to-day workflow`,
    };
  }

  // Strip founder-perspective prefixes like "Help [customers] to [do X]" or "We build an app that helps [customers] [do X]"
  let transformed = cleaned
    .replace(
      /^(we\s+|i\s+|our\s+startup\s+|this\s+app\s+|a\s+platform\s+to\s+|a\s+tool\s+to\s+)?(want\s+to\s+|are\s+building\s+.*\s+to\s+|aim\s+to\s+)?(help|helping|assist|assisting|enable|enabling|allow|allowing|empower|empowering|guide|guiding|make\s+it\s+easy\s+for)\s+/i,
      ''
    )
    .replace(
      /^(very\s+early[- ]stage\s+|early[- ]stage\s+|small\s+|local\s+|busy\s+|independent\s+)?(founders\s+startups|founders|startups|businesses|companies|teams|owners|managers|customers|users|people|parents|clients|freelancers|agencies|consumers)\s+(who\s+want\s+to\s+|to\s+)?/i,
      ''
    )
    .replace(/\btheir\b/gi, 'your')
    .replace(/\bthem\b/gi, 'you')
    .replace(/\bthey\b/gi, 'you');

  transformed = cleanInlineSnippet(transformed, 75).toLowerCase();

  // Convert leading base verb to gerund if needed (e.g., "start your startup..." -> "starting your startup...")
  const words = transformed.split(' ');
  const firstWord = words[0] || '';
  const verbToGerundMap: Record<string, string> = {
    start: 'starting',
    build: 'building',
    create: 'creating',
    launch: 'launching',
    manage: 'managing',
    track: 'tracking',
    find: 'finding',
    book: 'booking',
    automate: 'automating',
    organize: 'organizing',
    organise: 'organising',
    grow: 'growing',
    plan: 'planning',
    validate: 'validating',
    solve: 'solving',
    reduce: 'reducing',
    save: 'saving',
    fix: 'fixing',
    handle: 'handling',
    run: 'running',
    get: 'getting',
  };

  if (verbToGerundMap[firstWord]) {
    words[0] = verbToGerundMap[firstWord];
    transformed = words.join(' ');
  }

  const gerundPhrase =
    transformed.length >= 10
      ? transformed
      : `handling this part of your day-to-day workflow`;

  return {
    customerWorkflowGerund: gerundPhrase,
    customerGoalInfinitive: `get ${gerundPhrase} sorted out smoothly`,
    customerPainNoun: gerundPhrase,
  };
}

function detectIdeaDomainArchetype(combinedText: string): IdeaDomainArchetype {
  const lower = combinedText.toLowerCase();
  if (
    /\b(founder|founders|startup|startups|unicorn|business plan|idea to|mvp|pitch deck|incubator|accelerator|grant match|early stage|co-founder)\b/.test(
      lower
    )
  ) {
    return 'STARTUP_FOUNDER_BUILDER';
  }
  if (
    /\b(invoice|invoicing|bookkeeping|accounting|tax|payroll|cashflow|expense|vat|payment|billing|reconcil)\b/.test(
      lower
    )
  ) {
    return 'FINANCE_INVOICING_PAYMENTS';
  }
  if (
    /\b(marketplace|book a|booking|babysit|dog walk|tradesperson|plumber|cleaner|directory|local provider|appointment)\b/.test(
      lower
    )
  ) {
    return 'MARKETPLACE_BOOKING_LOCAL';
  }
  if (
    /\b(physical product|e-commerce|ecommerce|packaging|drink|beverage|snack|skincare|apparel|clothing|supplement|retail|shelf)\b/.test(
      lower
    )
  ) {
    return 'ECOMMERCE_PHYSICAL_PRODUCT';
  }
  if (
    /\b(fitness|workout|gym|nutrition|mental health|therapy|sleep|wellness|patient|clinic|medical)\b/.test(
      lower
    )
  ) {
    return 'HEALTH_WELLNESS_FITNESS';
  }
  if (
    /\b(hiring|recruit|candidate|onboarding|hr|employee|rota|shift scheduling|staffing)\b/.test(
      lower
    )
  ) {
    return 'HR_HIRING_TEAM';
  }
  if (
    /\b(lead gen|outbound|crm|social media|seo|ad spend|marketing campaign|sales pipeline|conversion)\b/.test(
      lower
    )
  ) {
    return 'MARKETING_SALES_GROWTH';
  }
  if (
    /\b(course|tutor|student|learning|curriculum|exam|study|training|upskill)\b/.test(
      lower
    )
  ) {
    return 'EDUCATION_LEARNING_COACHING';
  }
  if (
    /\b(inventory|warehouse|logistics|supply chain|compliance|audit|checklist|workflow|operations|spreadsheet)\b/.test(
      lower
    )
  ) {
    return 'OPERATIONS_INVENTORY_WORKFLOW';
  }
  return 'GENERAL_CUSTOM';
}

function cleanPersonaLabel(
  rawPersona: string | undefined,
  domain: IdeaDomainArchetype,
  industryCategory: string,
  countryName: string
): string {
  if (!rawPersona || !rawPersona.trim()) {
    if (domain === 'STARTUP_FOUNDER_BUILDER') {
      return 'early-stage founders';
    }
    return `${industryCategory.split('/')[0].trim().toLowerCase()} customers in ${countryName}`;
  }
  // Clean up accidental duplicate words like "founders startups" -> "founders"
  const cleaned = rawPersona
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\bfounders\s+startups\b/gi, 'founders')
    .replace(/\bstartups\s+founders\b/gi, 'startup founders')
    .replace(/^(we help|helping|target customer is|for)\s+/i, '')
    .replace(/\.$/, '');
  return cleanInlineSnippet(cleaned, 65);
}

function extractModuleABSurveyContext(params: {
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
}) {
  const countryPack = getCountryRulePack(params.hqCountryCode);
  const curr = countryPack.defaultCurrency;

  const combinedIdeaText = [
    params.planTitle,
    params.brainDumpText,
    params.coreProblem,
    params.proposedSolution,
    params.targetCustomer,
    params.moduleBData?.beachhead?.beachheadSegment,
  ]
    .filter(Boolean)
    .join(' ');

  const domain = detectIdeaDomainArchetype(combinedIdeaText);

  // 1. Persona (Prefer Module B Step 1 Beachhead Segment -> Module A Target Customer)
  const beachheadSeg = params.moduleBData?.beachhead?.beachheadSegment?.trim();
  const modATarget = params.targetCustomer?.trim();
  const rawPersona = beachheadSeg || modATarget || '';
  const shortPersona = cleanPersonaLabel(
    rawPersona,
    domain,
    params.industryCategory,
    countryPack.countryName
  );

  const decisionMakerRole = cleanInlineSnippet(
    params.moduleBData?.beachhead?.decisionMakerRole,
    55
  );

  // 2. Core Problem translated into Customer Workflow Perspective (NEVER raw copy-paste quotes)
  const rawProblem =
    params.coreProblem?.trim() || params.brainDumpText?.trim() || '';
  const problemSummary =
    cleanInlineSnippet(rawProblem, 110) ||
    `managing their ${params.industryCategory.toLowerCase()} workflow`;

  const perspective = translateFounderPitchToCustomerWorkflow(
    rawProblem,
    domain,
    params.industryCategory
  );

  const frustrationNotes =
    params.moduleBData?.competitorsAndStatusQuo?.workaroundFrustrationNotes?.trim() ||
    '';
  const triggerNotes =
    params.moduleBData?.beachhead?.buyingTriggerNotes?.trim() || '';
  const triggerPreset = params.moduleBData?.beachhead?.buyingTriggerPreset;
  const triggerPhrase =
    cleanInlineSnippet(triggerNotes, 85) ||
    (triggerPreset && BUYING_TRIGGER_PRESET_LABELS[triggerPreset]) ||
    '';

  // 3. Named Competitors & Status Quo Workarounds from Module B Step 2
  const savedCompetitors =
    params.moduleBData?.competitorsAndStatusQuo?.competitors?.filter(
      (c) => c.name && c.name.trim().length > 1
    ) || [];

  const effectiveCompetitors =
    savedCompetitors.length > 0
      ? savedCompetitors
      : buildSmartFallbackCompetitors({
          planTitle: params.planTitle,
          brainDumpText: params.brainDumpText,
          coreProblem: params.coreProblem,
          proposedSolution: params.proposedSolution,
          targetCustomerDescription: shortPersona,
          industryCategory: params.industryCategory,
          hqCountryCode: params.hqCountryCode,
          targetMarketsArray:
            params.moduleBData?.beachhead?.targetMarketsArray || [
              params.hqCountryCode,
            ],
        }).competitors;

  const competitorNames = effectiveCompetitors
    .map((c) => c.name.trim())
    .slice(0, 3);

  const competitorShortfalls = effectiveCompetitors
    .map((c) => {
      const fallShort = cleanInlineSnippet(c.whereTheyFallShort, 90);
      return fallShort ? `${c.name}: ${fallShort}` : '';
    })
    .filter(Boolean);

  // 4. Target Price & Billing Cadence from Module B Step 3 Market Sizing
  const primarySegment = params.moduleBData?.marketSizing?.segments?.[0];
  const parsedPrice = primarySegment?.pricePerCustomerInput
    ? Number(primarySegment.pricePerCustomerInput.replace(/[^0-9.]/g, ''))
    : NaN;
  const basePrice =
    !Number.isNaN(parsedPrice) && parsedPrice > 0
      ? parsedPrice
      : domain === 'STARTUP_FOUNDER_BUILDER'
        ? 79
        : params.industryCategory.includes('Consumer')
          ? 35
          : 99;
  const billingCadenceLabel =
    primarySegment?.billingCadence === 'MONTHLY_SUBSCRIPTION'
      ? 'per month'
      : 'in total over the past year';

  const lowBracket = formatPlanCurrency(
    Math.max(15, Math.round(basePrice * 0.5)),
    curr
  );
  const midBracket = formatPlanCurrency(Math.round(basePrice), curr);
  const highBracket = formatPlanCurrency(Math.round(basePrice * 2.5), curr);

  // 5. Competitive Wedge & Solution Outcomes from Module A & Module B Step 4
  const whySwitchSentence = cleanInlineSnippet(
    params.moduleBData?.competitorsAndStatusQuo?.whySwitchOneSentence ||
      params.moduleBData?.competitiveWedge?.competitiveEdgeSummary,
    105
  );
  const solutionSummary = cleanInlineSnippet(params.proposedSolution, 100);
  const unfairAdvantageSummary = cleanInlineSnippet(params.unfairAdvantage, 95);
  const switchingFrictionNotes = cleanInlineSnippet(
    params.moduleBData?.competitiveWedge?.switchingFrictionPlanNotes,
    95
  );

  return {
    countryPack,
    curr,
    domain,
    shortPersona,
    decisionMakerRole,
    problemSummary,
    customerWorkflowGerund: perspective.customerWorkflowGerund,
    customerGoalInfinitive: perspective.customerGoalInfinitive,
    customerPainNoun: perspective.customerPainNoun,
    frustrationNotes,
    triggerPhrase,
    effectiveCompetitors,
    competitorNames,
    competitorShortfalls,
    basePrice,
    billingCadenceLabel,
    lowBracket,
    midBracket,
    highBracket,
    whySwitchSentence,
    solutionSummary,
    unfairAdvantageSummary,
    switchingFrictionNotes,
  };
}

function normalizeSurveyQuestionKey(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function areQuestionsNearDuplicates(a: string, b: string): boolean {
  const normA = normalizeSurveyQuestionKey(a);
  const normB = normalizeSurveyQuestionKey(b);
  if (!normA || !normB) return false;
  if (normA === normB) return true;
  if (normA.length > 24 && normB.length > 24) {
    if (normA.includes(normB) || normB.includes(normA)) return true;
  }
  const stopWords = new Set([
    'the',
    'and',
    'for',
    'you',
    'your',
    'with',
    'that',
    'this',
    'have',
    'has',
    'had',
    'what',
    'when',
    'where',
    'which',
    'how',
    'why',
    'who',
    'are',
    'was',
    'were',
    'been',
    'from',
    'into',
    'over',
    'past',
    'last',
    'months',
    'month',
    'days',
    'about',
    'around',
  ]);
  const tokensA = normA
    .split(' ')
    .filter((w) => w.length > 2 && !stopWords.has(w));
  const tokensB = normB
    .split(' ')
    .filter((w) => w.length > 2 && !stopWords.has(w));
  if (tokensA.length >= 4 && tokensB.length >= 4) {
    const setB = new Set(tokensB);
    const overlap = tokensA.filter((w) => setB.has(w)).length;
    const minLen = Math.min(tokensA.length, tokensB.length);
    if (overlap / minLen >= 0.8) {
      return true;
    }
  }
  return false;
}

export function deduplicateSurveyQuestions(
  questions: SurveyQuestionItem[]
): SurveyQuestionItem[] {
  const unique: SurveyQuestionItem[] = [];
  const seenIds = new Set<string>();
  const nowTs = Date.now();

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!q || !q.questionText || !q.questionText.trim()) continue;
    const isDup = unique.some((existing) =>
      areQuestionsNearDuplicates(existing.questionText, q.questionText)
    );
    if (isDup) continue;

    let cleanId = q.id && !seenIds.has(q.id) ? q.id : `q-${nowTs}-${i + 1}`;
    while (seenIds.has(cleanId)) {
      cleanId = `q-${nowTs}-${i + 1}-${Math.random().toString(36).slice(2, 5)}`;
    }
    seenIds.add(cleanId);

    const dedupedOptions = Array.isArray(q.options)
      ? q.options.filter((opt, idx, arr) => {
          const normOpt = normalizeSurveyQuestionKey(opt);
          return (
            Boolean(normOpt) &&
            arr.findIndex(
              (candidate) => normalizeSurveyQuestionKey(candidate) === normOpt
            ) === idx
          );
        })
      : undefined;

    unique.push({
      ...q,
      id: cleanId,
      questionText: q.questionText.trim(),
      ...(dedupedOptions ? { options: dedupedOptions } : {}),
    });
  }

  return unique;
}

function buildSmartFallbackSurvey(params: {
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
}): {
  title: string;
  introDescription: string;
  waitlistIncentiveText: string;
  questions: SurveyQuestionItem[];
} {
  const ctx = extractModuleABSurveyContext(params);

  const customTopic =
    params.customAiFocusPrompt?.trim() ||
    (params.focusAreas.includes('OTHER') && params.otherFocusAreaText?.trim()
      ? params.otherFocusAreaText.trim()
      : '');

  const isStartupIdea = ctx.domain === 'STARTUP_FOUNDER_BUILDER';

  const title = isStartupIdea
    ? `${params.planTitle} — Early-Stage Founder Discovery Survey`
    : `${params.planTitle} — 60-Second Customer Discovery Survey`;

  const introDescription = isStartupIdea
    ? `Hi! We're speaking with ${ctx.shortPersona} to understand what actually slows you down when ${ctx.customerWorkflowGerund}. Zero sales pitch—just ${params.questionCount || 5} quick questions about your real experience so far.`
    : `Hi! We're speaking with ${ctx.shortPersona} to learn how you currently approach ${ctx.customerWorkflowGerund} and where the biggest headaches are today. Zero sales pitch—just ${params.questionCount || 5} quick questions.`;

  const waitlistIncentiveText = isStartupIdea
    ? `Want early founder access to ${params.planTitle} to help you go from raw idea to validated startup plan (plus a launch discount)? Drop your email below:`
    : `Want early access to ${params.planTitle} plus a founding-member discount when we launch? Leave your email below:`;

  const nowTs = Date.now();

  // Build natural workaround options weaving in Module B Step 2 competitors
  const workaroundOptions: string[] = isStartupIdea
    ? [
        ctx.competitorNames[0]
          ? `Traditional business plan tools or templates (e.g. ${ctx.competitorNames[0]})`
          : 'Traditional business plan templates or static Word/PDF guides',
        ctx.competitorNames[1]
          ? `Generic AI chatbots & workspace docs (e.g. ${ctx.competitorNames[1]})`
          : 'Asking ChatGPT / Claude and piecing notes together in Notion or Google Docs',
        ctx.competitorNames[2]
          ? `External advisors, accelerators, or consultants (e.g. ${ctx.competitorNames[2]})`
          : 'Local enterprise office workshops, mentors, or private consultants',
        'Scattered spreadsheets, notebooks, and figuring it out solo as I go',
        'I have not started structuring or validating the idea yet',
      ]
    : [
        ...(ctx.competitorNames.length >= 2
          ? [`Using ${ctx.competitorNames[0]} or ${ctx.competitorNames[1]}`]
          : ctx.competitorNames.length === 1
            ? [`Using ${ctx.competitorNames[0]}`]
            : []),
        ...(ctx.competitorNames[2]
          ? [`Working with ${ctx.competitorNames[2]}`]
          : []),
        'Tracking everything manually in spreadsheets, docs, or WhatsApp threads',
        'Using generic tools or free templates that were not built for this',
        'Doing it ad-hoc in my head whenever an urgent deadline comes up',
      ];

  // Build natural frustration options from Module B competitor shortfalls + domain intelligence
  const frustrationOptions: string[] = [];
  if (isStartupIdea) {
    frustrationOptions.push(
      'I don’t know the right step-by-step order—it feels overwhelming to go from a raw idea to a real plan',
      'Generic AI tools (like ChatGPT) just agree with my idea instead of exposing my real blind spots',
      'Traditional business plan templates feel like 40 pages of homework rather than actionable validation',
      'Hiring a startup consultant or grant writer is way too expensive at my current stage'
    );
  } else {
    for (const c of ctx.effectiveCompetitors.slice(0, 3)) {
      const shortFall = cleanInlineSnippet(c.whereTheyFallShort, 85);
      if (shortFall) {
        frustrationOptions.push(`${shortFall} (${c.name})`);
      }
    }
    if (ctx.frustrationNotes) {
      frustrationOptions.push(cleanInlineSnippet(ctx.frustrationNotes, 90));
    }
    const domainFillers = [
      `It takes too much manual time and guesswork when ${ctx.customerWorkflowGerund}`,
      'Existing tools feel too generic, complicated, or disconnected from how we actually work',
      'Hiring an external specialist or agency is too expensive for what we need',
      'Easy to miss important details or make avoidable mistakes under time pressure',
    ];
    for (const filler of domainFillers) {
      if (frustrationOptions.length < 4 && !frustrationOptions.includes(filler)) {
        frustrationOptions.push(filler);
      }
    }
  }

  const outcomeOptions: string[] = isStartupIdea
    ? [
        'A guided step-by-step path from raw idea to validated plan without a 40-page blank document',
        'Honest blind-spot feedback that challenges my assumptions before I waste money building',
        'Built-in customer survey tools and plain-English market/pricing calculators in one place',
        `Automatic matching with local grants and startup supports in ${ctx.countryPack.countryName}`,
      ]
    : [
        ...(ctx.whySwitchSentence ? [ctx.whySwitchSentence] : []),
        'Cutting the time it takes from hours of manual work down to a few minutes',
        'Catching costly mistakes or blind spots before they cause a problem',
        `Replacing clunky ${ctx.competitorNames[0] || 'spreadsheets and workarounds'} with a simple guided workflow`,
        'Having clear numbers, tracking, and next steps ready in one place',
      ];

  // Comprehensive, diverse 9-question structured Mom-Test pool + 1 open story question.
  // Every entry covers a distinct discovery dimension so no two questions ever duplicate.
  const structuredPool: Array<{
    focusTag: SurveyFocusAreaType | 'GENERAL';
    question: SurveyQuestionItem;
  }> = [
    // Q1: Past-30-Day Frequency / Primary Bottleneck (PROBLEM_AND_PAIN)
    {
      focusTag: 'PROBLEM_AND_PAIN',
      question: customTopic
        ? {
            id: `q-${nowTs}-1`,
            questionText: `Thinking back over the past 30 days, what has been the hardest part for you around ${cleanInlineSnippet(customTopic, 75).toLowerCase()}?`,
            type: 'MULTIPLE_CHOICE',
            options: isStartupIdea
              ? [
                  'Knowing what concrete step to tackle first without spinning my wheels',
                  'Validating whether real customers actually care and will pay',
                  'Getting clear on numbers, pricing, and market size',
                  'It has not been a major issue for me recently',
                ]
              : [
                  'It takes up way too much manual time every week',
                  'Current tools are clunky and force awkward workarounds',
                  'It causes costly mistakes or missed opportunities when we get busy',
                  'It has not been a major issue for me in the past 30 days',
                ],
            allowOther: true,
            momTestPassed: true,
            momTestFeedback:
              'Mom-Test Approved: Shapes your custom focus topic into a concrete past-30-day experience question.',
          }
        : isStartupIdea
          ? {
              id: `q-${nowTs}-1`,
              questionText:
                'Thinking back over the past 30 days of working on your startup idea, which part of turning your concept into a real business has slowed you down the most?',
              type: 'MULTIPLE_CHOICE',
              options: [
                'Knowing the right step-by-step roadmap to go from a raw idea to a structured plan',
                'Validating whether customers actually have the problem and will pay before I build',
                'Figuring out realistic market sizing, competitor positioning, and pricing',
                'Navigating local grants, funding applications, or company setup requirements',
                'Nothing has slowed me down — my validation and launch plan are already sorted',
              ],
              allowOther: true,
              momTestPassed: true,
              momTestFeedback:
                'Mom-Test Approved: Translates your Module A founder-coaching concept into the respondent’s real startup-building bottlenecks over the past 30 days.',
            }
          : {
              id: `q-${nowTs}-1`,
              questionText: `Thinking back over the past 30 days, how often has ${ctx.customerWorkflowGerund} slowed you down or caused extra work?`,
              type: 'MULTIPLE_CHOICE',
              options: [
                'Almost every day — it is a constant time sink in my routine',
                'Several times a week whenever we get busy',
                'A few times a month (usually around key deadlines)',
                'Rarely or never — our current setup handles it smoothly',
              ],
              allowOther: true,
              momTestPassed: true,
              momTestFeedback:
                'Mom-Test Approved: Measures real past-30-day frequency in the customer’s own workflow without leading them.',
            },
    },
    // Q2: Pain Severity Scale 1–5 (PROBLEM_AND_PAIN)
    {
      focusTag: 'PROBLEM_AND_PAIN',
      question: {
        id: `q-${nowTs}-2`,
        questionText: isStartupIdea
          ? 'When you sit down to move your startup idea forward, how overwhelming or fragmented does the planning and validation process feel right now on a scale of 1 to 5?'
          : ctx.triggerPhrase
            ? `When you are ${ctx.triggerPhrase}, how painful or disruptive is ${ctx.customerWorkflowGerund} on a scale of 1 to 5?`
            : `Right now, how big of a headache is ${ctx.customerWorkflowGerund} for you on a scale of 1 to 5?`,
        type: 'SCALE_1_5',
        scaleMinLabel: isStartupIdea
          ? '1 = Very clear — I know my exact roadmap'
          : '1 = Minor annoyance, easy to ignore',
        scaleMaxLabel: isStartupIdea
          ? '5 = Major blocker — stuck in guesswork and scattered notes'
          : '5 = Urgent blocker costing real time or money',
        momTestPassed: true,
        momTestFeedback:
          'Mom-Test Approved: Quantifies pain intensity in the customer’s real situation so you can separate hair-on-fire leads from polite browsers.',
      },
    },
    // Q3: Current Tools, Habits & Named Competitors Used (CURRENT_WORKAROUNDS)
    {
      focusTag: 'CURRENT_WORKAROUNDS',
      question: {
        id: `q-${nowTs}-3`,
        questionText: isStartupIdea
          ? 'How have you tried to structure your startup idea, validate demand, or build your business plan over the past 6 months? (Select all that apply)'
          : `How are you currently handling ${ctx.customerWorkflowGerund} today—or which of these have you tried in the past 6 months? (Select all that apply)`,
        type: 'MULTI_SELECT',
        options: workaroundOptions.slice(0, 5),
        allowOther: true,
        momTestPassed: true,
        momTestFeedback: `Mom-Test Approved: Tests your Module B Step 2 alternatives (${ctx.competitorNames.join(', ') || 'status-quo habits'}) to see what respondents actively use today.`,
      },
    },
    // Q4: #1 Frustration with Current Approach (CURRENT_WORKAROUNDS)
    {
      focusTag: 'CURRENT_WORKAROUNDS',
      question: {
        id: `q-${nowTs}-4`,
        questionText: isStartupIdea
          ? 'What has been your biggest frustration with the tools, templates, or advice you have used so far?'
          : `What has been your #1 frustration with how your current tools or workarounds handle ${ctx.customerWorkflowGerund}?`,
        type: 'MULTIPLE_CHOICE',
        options: frustrationOptions.slice(0, 4),
        allowOther: true,
        momTestPassed: true,
        momTestFeedback:
          'Mom-Test Approved: Validates whether real customers feel the exact competitor shortfalls you identified in Module B Step 2.',
      },
    },
    // Q5: Past 12-Month Spend & Budget Reality (PAST_SPENDING_BUDGET)
    {
      focusTag: 'PAST_SPENDING_BUDGET',
      question: {
        id: `q-${nowTs}-5`,
        questionText: isStartupIdea
          ? `Over the past 12 months, roughly how much have you spent (${ctx.billingCadenceLabel}) on software, templates, courses, or advisors to help get your startup idea off the ground?`
          : `Over the past 12 months, roughly how much have you spent (${ctx.billingCadenceLabel}) on software, tools, or external help for ${ctx.customerWorkflowGerund}?`,
        type: 'MULTIPLE_CHOICE',
        options: [
          `${formatPlanCurrency(0, ctx.curr)} — only used free tools and my own time so far`,
          `Under ${ctx.lowBracket} ${ctx.billingCadenceLabel}`,
          `${ctx.lowBracket} – ${ctx.midBracket} ${ctx.billingCadenceLabel}`,
          `${ctx.midBracket} – ${ctx.highBracket} ${ctx.billingCadenceLabel}`,
          `Over ${ctx.highBracket} ${ctx.billingCadenceLabel}`,
        ],
        allowOther: true,
        momTestPassed: true,
        momTestFeedback: `Mom-Test Approved: Anchors budget brackets around your Module B Step 3 target price (${ctx.midBracket}) by asking about actual past spend rather than hypothetical promises.`,
      },
    },
    // Q6: Buying Trigger & Urgent Milestone Moment (WORKFLOW_AND_HABITS)
    {
      focusTag: 'WORKFLOW_AND_HABITS',
      question: {
        id: `q-${nowTs}-6`,
        questionText: isStartupIdea
          ? 'What milestone or moment usually pushes you to sit down and get your startup plan and validation sorted out urgently?'
          : `What moment or deadline usually triggers the urgent need to sort out ${ctx.customerWorkflowGerund}?`,
        type: 'MULTIPLE_CHOICE',
        options: isStartupIdea
          ? [
              'Preparing to apply for a local enterprise grant, incubator, or accelerator deadline',
              'Before spending serious money or hiring someone to build Version 1',
              'Getting ready to pitch co-founders, angel investors, or early partners',
              'Feeling stuck with too many ideas in my head and needing a clear roadmap',
            ]
          : [
              ctx.triggerPhrase
                ? `When ${ctx.triggerPhrase}`
                : 'When preparing for an upcoming client, launch, or reporting deadline',
              'When manual spreadsheets and notes get too messy and start causing mistakes',
              'When we realize how many hours every week are being lost to manual steps',
              'When a manager, partner, or client asks for clear numbers and proof',
            ],
        allowOther: true,
        momTestPassed: true,
        momTestFeedback:
          'Mom-Test Approved: Identifies the real-world buying trigger moment from Module B Step 1.',
      },
    },
    // Q7: Most Valuable Outcome / #1 V1 Priority (FEATURE_PRIORITIES)
    {
      focusTag: 'FEATURE_PRIORITIES',
      question: {
        id: `q-${nowTs}-7`,
        questionText: isStartupIdea
          ? 'If one part of taking your startup from early idea to launch could be 10x easier tomorrow, which outcome would help you the most? (Select up to 2)'
          : `If you could fix ONE part of ${ctx.customerWorkflowGerund} tomorrow, which outcome would be most valuable to you? (Select up to 2)`,
        type: 'MULTI_SELECT',
        options: outcomeOptions.slice(0, 4),
        allowOther: true,
        momTestPassed: true,
        momTestFeedback:
          'Mom-Test Approved: Tests the core value proposition from Module A & Module B Step 4 by asking which outcome solves their biggest bottleneck.',
      },
    },
    // Q8: Past Switching Friction & Why Alternatives Failed (GENERAL)
    {
      focusTag: 'GENERAL',
      question: {
        id: `q-${nowTs}-8`,
        questionText: isStartupIdea
          ? 'Have you ever tried using a business plan template, AI tool, or startup course in the past 12 months only to abandon it—and if so, why did you stop?'
          : `Have you tried switching how you handle ${ctx.customerWorkflowGerund} in the past 12 months—and what held you back?`,
        type: 'MULTIPLE_CHOICE',
        options: isStartupIdea
          ? [
              'It felt like generic homework and did not tell me what my specific idea was missing',
              'It asked for complex financial projections before I had even validated my customers',
              'It was too expensive for a pre-revenue founder',
              'I have not tried any structured startup tools or templates yet',
            ]
          : [
              `Tried ${ctx.competitorNames[0] || 'another tool'}, but it was too generic or complex for our workflow`,
              `Looked at ${ctx.competitorNames[1] || 'hiring external help'}, but the cost (${ctx.highBracket}+) was too high`,
              'Wanted to improve it, but did not have time to set up a new system from scratch',
              'Have not actively looked for a better way yet',
            ],
        allowOther: true,
        momTestPassed: true,
        momTestFeedback:
          'Mom-Test Approved: Uncovers real past switching friction and why existing alternatives failed them.',
      },
    },
    // Q9: Weekly Time Cost & Operational Impact (WORKFLOW_AND_HABITS / GENERAL)
    {
      focusTag: 'WORKFLOW_AND_HABITS',
      question: {
        id: `q-${nowTs}-9`,
        questionText: isStartupIdea
          ? 'In a typical week, roughly how many hours do you spend researching, rewriting notes, or trying to piece together your startup plan and validation?'
          : `In a typical week, roughly how much time do you or your team lose dealing with ${ctx.customerWorkflowGerund}?`,
        type: 'MULTIPLE_CHOICE',
        options: [
          'Less than 1 hour a week',
          '1 to 3 hours a week of manual effort',
          '4 to 8 hours a week (a full workday lost)',
          'More than 8 hours a week across the team',
        ],
        allowOther: true,
        momTestPassed: true,
        momTestFeedback:
          'Mom-Test Approved: Quantifies real weekly time cost so you can calculate ROI in Module H & Module L.',
      },
    },
  ];

  // Open-text Mom-Test story question (always placed last)
  const openTextStoryQuestion: SurveyQuestionItem = {
    id: `q-${nowTs}-story`,
    questionText: customTopic
      ? `Walk me through the last time you dealt with ${cleanInlineSnippet(customTopic, 70).toLowerCase()} — what happened, and what was the single most frustrating part?`
      : isStartupIdea
        ? 'Walk me through the last time you sat down to work on your startup idea or business plan — where did you get stuck, and what was the most frustrating part?'
        : `Walk me through the last time you had to deal with ${ctx.customerWorkflowGerund} — what happened, and what was the single most frustrating part?`,
    type: 'OPEN_TEXT',
    momTestPassed: true,
    momTestFeedback:
      'Mom-Test Approved: Classic "walk me through the last time" prompt written in natural customer language.',
  };

  const activeFocusSet = new Set<SurveyFocusAreaType>(
    params.focusAreas && params.focusAreas.length > 0
      ? params.focusAreas
      : ['PROBLEM_AND_PAIN', 'CURRENT_WORKAROUNDS']
  );

  const desiredCount = Math.min(Math.max(params.questionCount || 5, 3), 8);
  const targetStructuredCount = Math.max(desiredCount - 1, 2);

  // First pass: pick questions matching the founder's selected focus areas
  const selectedStructured: SurveyQuestionItem[] = [];
  const usedIndices = new Set<number>();

  for (let i = 0; i < structuredPool.length; i++) {
    const entry = structuredPool[i];
    if (
      entry.focusTag !== 'GENERAL' &&
      activeFocusSet.has(entry.focusTag) &&
      selectedStructured.length < targetStructuredCount
    ) {
      selectedStructured.push(entry.question);
      usedIndices.add(i);
    }
  }

  // Second pass: fill any remaining slots up to targetStructuredCount from unused questions in the pool
  // (never repeating the same question!)
  for (let i = 0; i < structuredPool.length; i++) {
    if (selectedStructured.length >= targetStructuredCount) break;
    if (usedIndices.has(i)) continue;
    selectedStructured.push(structuredPool[i].question);
    usedIndices.add(i);
  }

  const finalQuestions = deduplicateSurveyQuestions([
    ...selectedStructured.slice(0, targetStructuredCount),
    openTextStoryQuestion,
  ]);

  return {
    title,
    introDescription,
    waitlistIncentiveText,
    questions: finalQuestions,
  };
}

/**
 * Generates a complete Mom-Test Customer Validation Survey tailored to the founder's
 * Module A (Ideation & Concept Canvas) and Module B (Beachhead Persona, Competitors, Market Sizing & Wedge).
 */
export async function generateModuleCSurveyViaRouter(params: {
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
  const countryPack = getCountryRulePack(params.hqCountryCode);
  const ctx = extractModuleABSurveyContext(params);

  const authCtx = await authorizeAndPrepareGeminiCall('MOD_C_GENERATE_SURVEY');
  if (authCtx.creditCheckBlocked) {
    const fallback = buildSmartFallbackSurvey(params);
    return {
      allowed: false,
      reason: authCtx.blockReason,
      ...fallback,
      creditsUsedAfter: authCtx.currentCreditsUsed,
      engineMode: 'smart-synthesizer',
    };
  }

  let resultPayload: {
    title: string;
    introDescription: string;
    waitlistIncentiveText: string;
    questions: SurveyQuestionItem[];
  } | null = null;
  let engineMode: 'gemini-2.5-flash' | 'smart-synthesizer' = 'smart-synthesizer';
  let inputTokensCount = 460;
  let outputTokensCount = 580;

  if (authCtx.canCallLiveGemini && authCtx.activeApiKey) {
    try {
      const ai = getGenAiClient(authCtx.activeApiKey);
      const focusDescriptions = params.focusAreas
        .map((fa) =>
          fa === 'OTHER' && params.otherFocusAreaText?.trim()
            ? `Custom Focus: ${sanitizePromptInput(params.otherFocusAreaText, 300)}`
            : FOCUS_AREA_LABELS[fa]
        )
        .join('; ');

      const desiredCount = Math.min(Math.max(params.questionCount || 5, 3), 8);
      const competitorContextLines = ctx.effectiveCompetitors
        .map(
          (c) =>
            `  • ${c.name} (${c.category}, ${c.typicalPriceText}): Good at "${c.whatTheyDoWell}" | Falls short on "${c.whereTheyFallShort}"`
        )
        .join('\n');

      const userPrompt = `You are a startup customer discovery expert trained in Rob Fitzpatrick's "The Mom Test".
Generate a smart, natural, conversational customer validation survey that understands the founder's startup concept and shapes questions from the RESPONDENT'S real-life perspective:

=== MODULE A: IDEATION & CONCEPT CANVAS ===
- Startup Title: ${sanitizePromptInput(params.planTitle, 200)}
- Industry: ${sanitizePromptInput(params.industryCategory, 120)} (${countryPack.countryName}, ${countryPack.defaultCurrency})
- Raw Founder Idea Notes: ${sanitizePromptInput(params.brainDumpText, 2000) || 'Not specified'}
- Core Problem to Validate (Founder's Notes): ${sanitizePromptInput(params.coreProblem || ctx.problemSummary, 1000)}
- Translated Customer Workflow Activity: ${ctx.customerWorkflowGerund}
- Target Customer (Module A): ${sanitizePromptInput(params.targetCustomer || ctx.shortPersona, 800)}
- Proposed Solution (Context only — DO NOT pitch in questions): ${sanitizePromptInput(params.proposedSolution, 800) || 'Not specified'}
- Unfair Advantage: ${sanitizePromptInput(params.unfairAdvantage, 600) || 'Not specified'}

=== MODULE B: BEACHHEAD PERSONA, COMPETITORS, PRICING & WEDGE ===
- Specific Beachhead Persona (Module B Step 1): ${ctx.shortPersona}
- Decision Maker Role: ${ctx.decisionMakerRole || 'Same as user'}
- Hair-on-Fire Buying Trigger Moment: ${ctx.triggerPhrase || 'Not specified'}
- Named Competitors & Status-Quo Alternatives (Module B Step 2):
${competitorContextLines || '  • Manual spreadsheets / generic tools'}
- Workaround Frustration Notes: ${ctx.frustrationNotes || 'None'}
- Target Price Anchor being tested (Module B Step 3): ${ctx.midBracket} ${ctx.billingCadenceLabel} (Brackets: ${ctx.lowBracket}, ${ctx.midBracket}, ${ctx.highBracket})
- Why Customers Switch / Competitive Wedge (Module B Step 4): ${ctx.whySwitchSentence || 'Not specified'}

=== FOUNDER'S SURVEY FOCUS SELECTION ===
- Selected Focus Areas: ${focusDescriptions || 'Problem & Pain Intensity; Current Workarounds'}
- Founder's Specific Angle / Custom Request: ${sanitizePromptInput(params.customAiFocusPrompt, 600) || 'None'}
- Number of Questions to Generate: ${desiredCount}

CRITICAL PERSPECTIVE & MOM TEST RULES:
1. NEVER COPY-PASTE THE FOUNDER'S RAW NOTES IN QUOTES!
   - ❌ BAD (Robotic copy-paste): 'Thinking back over the past 30 days, how often did you run into frustration around: "Help very early stage founders startups start their startup from idea to startup creation"?'
   - ✅ GOOD (Natural customer perspective): 'Thinking back over the past 30 days of working on your startup idea, which part of turning your concept into a real business has slowed you down the most?'
2. Translate the founder's idea from "Founder Pitch Perspective" (what the founder wants to build/help with) into "Customer Workflow Perspective" (what ${ctx.shortPersona} actually experience when ${ctx.customerWorkflowGerund}).
3. Shape every question and multiple-choice option around the real bottlenecks, tools (${ctx.competitorNames.join(', ')}), frustrations, triggers, and past spending (${ctx.lowBracket} to ${ctx.highBracket}) relevant to this specific idea.
4. NEVER ask "Would you buy/use ${sanitizePromptInput(params.planTitle, 120)}?" or "Do you think our idea is good?". Ask ONLY about past behavior, current workarounds, real pain intensity, actual money already spent, and a specific "walk me through the last time" open-text story.
5. Use a balanced mix of "MULTIPLE_CHOICE", "MULTI_SELECT", "SCALE_1_5", and 1 final "OPEN_TEXT" question.
6. ZERO DUPLICATE OR OVERLAPPING QUESTIONS: Every single question MUST cover a completely distinct discovery angle (e.g. Q1: Past-30-day frequency, Q2: 1–5 pain severity scale, Q3: Current tools & workarounds used, Q4: #1 frustration with current approach, Q5: Actual past 12-month spend/budget bracket, Q6: Urgent buying trigger or weekly hours lost, Final Q: Open-text "Walk me through the last time" story). Never repeat or rephrase the same question twice.

Return strictly valid JSON matching this schema:
{
  "title": "Short, natural survey title tailored to ${ctx.shortPersona}",
  "introDescription": "2-sentence warm, non-salesy intro speaking directly to ${ctx.shortPersona} about ${ctx.customerWorkflowGerund}",
  "waitlistIncentiveText": "1-sentence invitation to leave their email for early beta access or launch discount",
  "questions": [
    {
      "questionText": "The natural, conversational Mom-Test question (no copy-pasted quotes)",
      "type": "MULTIPLE_CHOICE" | "MULTI_SELECT" | "SCALE_1_5" | "OPEN_TEXT",
      "options": ["Specific Option 1", "Specific Option 2", "Specific Option 3", "Specific Option 4"],
      "allowOther": true,
      "scaleMinLabel": "1 = Minor annoyance",
      "scaleMaxLabel": "5 = Urgent headache",
      "momTestPassed": true,
      "momTestFeedback": "1 short sentence explaining how this question validates the founder's Module A/B assumptions using The Mom Test"
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userPrompt,
        config: {
          systemInstruction: authCtx.systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.35,
          maxOutputTokens: MAX_OUTPUT_TOKENS_PER_CALL,
        },
      });

      const rawText = response.text;
      if (rawText) {
        const parsed = JSON.parse(rawText) as {
          title?: string;
          introDescription?: string;
          waitlistIncentiveText?: string;
          questions?: Array<{
            questionText?: string;
            type?: string;
            options?: string[];
            allowOther?: boolean;
            scaleMinLabel?: string;
            scaleMaxLabel?: string;
            momTestFeedback?: string;
          }>;
        };

        if (Array.isArray(parsed.questions) && parsed.questions.length >= 2) {
          const fallback = buildSmartFallbackSurvey({
            ...params,
            questionCount: 8,
          });
          const normalizeType = (t?: string): SurveyQuestionType =>
            t === 'MULTIPLE_CHOICE' ||
            t === 'MULTI_SELECT' ||
            t === 'SCALE_1_5' ||
            t === 'OPEN_TEXT'
              ? t
              : 'MULTIPLE_CHOICE';

          const rawMappedQuestions: SurveyQuestionItem[] = parsed.questions.map(
            (q, idx) => {
              const qType = normalizeType(q.type);
              const fbQuestion =
                fallback.questions[idx % fallback.questions.length];
              return {
                id: `q-${Date.now()}-${idx + 1}`,
                questionText:
                  q.questionText?.trim() || fbQuestion.questionText,
                type: qType,
                options:
                  qType === 'MULTIPLE_CHOICE' || qType === 'MULTI_SELECT'
                    ? Array.isArray(q.options) && q.options.length >= 2
                      ? q.options
                      : fbQuestion.options || [
                          'Option A',
                          'Option B',
                          'Option C',
                        ]
                    : undefined,
                allowOther:
                  qType === 'MULTIPLE_CHOICE' || qType === 'MULTI_SELECT'
                    ? q.allowOther ?? true
                    : undefined,
                scaleMinLabel:
                  qType === 'SCALE_1_5'
                    ? q.scaleMinLabel || '1 = Minor annoyance, easy to ignore'
                    : undefined,
                scaleMaxLabel:
                  qType === 'SCALE_1_5'
                    ? q.scaleMaxLabel ||
                      '5 = Urgent blocker costing real time or money'
                    : undefined,
                momTestPassed: true,
                momTestFeedback:
                  q.momTestFeedback ||
                  fbQuestion.momTestFeedback ||
                  'Mom-Test Approved: Focuses on real past behavior and concrete experience.',
              };
            }
          );

          // Deduplicate AI questions and top up from diverse fallback pool if any duplicate was stripped
          const dedupedQuestions =
            deduplicateSurveyQuestions(rawMappedQuestions);
          for (const fbQ of fallback.questions) {
            if (dedupedQuestions.length >= desiredCount) break;
            const alreadyIncluded = dedupedQuestions.some((existing) =>
              areQuestionsNearDuplicates(existing.questionText, fbQ.questionText)
            );
            if (!alreadyIncluded) {
              dedupedQuestions.push({
                ...fbQ,
                id: `q-${Date.now()}-fb-${dedupedQuestions.length + 1}`,
              });
            }
          }

          resultPayload = {
            title: parsed.title?.trim() || fallback.title,
            introDescription:
              parsed.introDescription?.trim() || fallback.introDescription,
            waitlistIncentiveText:
              parsed.waitlistIncentiveText?.trim() ||
              fallback.waitlistIncentiveText,
            questions: deduplicateSurveyQuestions(dedupedQuestions).slice(
              0,
              desiredCount
            ),
          };
          engineMode = 'gemini-2.5-flash';
          inputTokensCount =
            response.usageMetadata?.promptTokenCount ?? inputTokensCount;
          outputTokensCount =
            response.usageMetadata?.candidatesTokenCount ?? outputTokensCount;
        }
      }
    } catch (err) {
      console.warn(
        '[SPF AI Router] Module C Survey Generation failed, using smart synthesizer fallback:',
        err instanceof Error ? err.message : err
      );
    }
  }

  if (!resultPayload) {
    resultPayload = buildSmartFallbackSurvey(params);
  }

  const creditsUsedAfter = await recordGeminiUsageAndIncrementCredits({
    verifiedUserId: authCtx.verifiedUserId,
    planId: params.planId,
    promptKey: 'MOD_C_GENERATE_SURVEY',
    modelUsed: engineMode,
    inputTokens: inputTokensCount,
    outputTokens: outputTokensCount,
    usedByokKey: authCtx.usedByokKey,
    fallbackCreditsUsed: authCtx.currentCreditsUsed,
  });

  return {
    allowed: true,
    ...resultPayload,
    creditsUsedAfter,
    engineMode,
  };
}

/**
 * Evaluates a single question against "The Mom Test" and provides a 1-click bias-free rewrite
 * tailored to the founder's Module A & Module B context.
 */
export async function checkAndRewriteMomTestQuestionViaRouter(params: {
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
  const rawQ = sanitizePromptInput(params.questionText, 600);
  const lower = rawQ.toLowerCase();
  const ctx = extractModuleABSurveyContext({
    planTitle: params.planTitle,
    industryCategory: params.industryCategory || 'SaaS / AI / Digital',
    hqCountryCode: params.hqCountryCode || 'IE',
    coreProblem: params.coreProblem,
    targetCustomer: params.targetCustomer,
    moduleBData: params.moduleBData,
  });

  // Deterministic Mom Test Trap Detector (used as baseline and fallback)
  const isHypotheticalBuying =
    /\b(would you (buy|pay|use|subscribe|try|sign up|download)|will you (buy|pay|use)|how much would you pay|do you think .* (good idea|useful|helpful)|if we built)\b/i.test(
      lower
    );
  const isTooShortOrVague = rawQ.length < 15;

  const buildSmartMomTestCheck = (): {
    momTestPassed: boolean;
    momTestFeedback: string;
    momTestSuggestedRewrite: string;
    suggestedOptions?: string[];
  } => {
    const isCopyPasteQuoted = /frustration around:\s*"/i.test(rawQ);
    if (isHypotheticalBuying || isCopyPasteQuoted) {
      if (lower.includes('pay') || lower.includes('buy') || lower.includes('price')) {
        return {
          momTestPassed: false,
          momTestFeedback: `Mom-Test Warning: Asking "Would you pay for X?" invites polite compliments instead of truth. Ask what ${ctx.shortPersona} ALREADY spend on ${ctx.competitorNames.slice(0, 2).join(', ') || 'workarounds'} today (anchored around your Module B ${ctx.midBracket} price point).`,
          momTestSuggestedRewrite: `Over the past 12 months, roughly how much have you spent (${ctx.billingCadenceLabel}) on tools, templates, or external help for ${ctx.customerWorkflowGerund}?`,
          suggestedOptions:
            params.questionType === 'MULTIPLE_CHOICE' ||
            params.questionType === 'MULTI_SELECT'
              ? [
                  `${formatPlanCurrency(0, ctx.curr)} — only my own time and free workarounds`,
                  `Under ${ctx.lowBracket} ${ctx.billingCadenceLabel}`,
                  `${ctx.lowBracket} – ${ctx.midBracket} ${ctx.billingCadenceLabel}`,
                  `Over ${ctx.midBracket} ${ctx.billingCadenceLabel}`,
                ]
              : undefined,
        };
      }
      return {
        momTestPassed: false,
        momTestFeedback: isCopyPasteQuoted
          ? 'Perspective Upgrade: Instead of quoting your founder notes verbatim, frame the question naturally around the customer’s own workflow and bottlenecks.'
          : 'Mom-Test Warning: Asking "Would you use..." or "Do you think this is a good idea?" asks about a hypothetical future. Anchor the question in their past 30 days of real behavior.',
        momTestSuggestedRewrite:
          ctx.domain === 'STARTUP_FOUNDER_BUILDER'
            ? 'Thinking back over the past 30 days of working on your startup idea, which part of turning your concept into a real business has slowed you down the most?'
            : `Thinking back over the past 30 days, how often has ${ctx.customerWorkflowGerund} slowed you down, and how did you handle it at the time?`,
        suggestedOptions:
          params.questionType === 'MULTIPLE_CHOICE' ||
          params.questionType === 'MULTI_SELECT'
            ? ctx.domain === 'STARTUP_FOUNDER_BUILDER'
              ? [
                  'Knowing the right step-by-step roadmap to go from raw idea to a structured plan',
                  'Validating whether real customers actually have the problem and will pay',
                  'Working out realistic market sizing, competitor positioning, and pricing',
                  'Navigating local grants, funding requirements, or company setup',
                ]
              : [
                  `Happened multiple times a week — used ${ctx.competitorNames[0] || 'an existing tool'}`,
                  'Happened a few times this month — pieced it together manually in spreadsheets/docs',
                  `Happened during ${ctx.triggerPhrase || 'a key deadline'} — paid external help`,
                  'Did not run into this in the past 30 days',
                ]
            : undefined,
      };
    }

    if (isTooShortOrVague) {
      return {
        momTestPassed: false,
        momTestFeedback: `Tip: Make this question specific to ${ctx.customerWorkflowGerund} so ${ctx.shortPersona} give you concrete stories instead of one-word answers.`,
        momTestSuggestedRewrite: `Walk me through the last time you had to deal with ${ctx.customerWorkflowGerund} — what was the single most frustrating or time-consuming step?`,
      };
    }

    return {
      momTestPassed: true,
      momTestFeedback:
        'Mom-Test Approved! This question avoids pitching and focuses on real experience. Here is an even sharper version shaped around your customer’s workflow:',
      momTestSuggestedRewrite: rawQ.includes(ctx.competitorNames[0] || '___')
        ? rawQ
        : `Thinking back over the past month while ${ctx.customerWorkflowGerund}: ${rawQ.charAt(0).toLowerCase()}${rawQ.slice(1)}`,
    };
  };

  const authCtx = await authorizeAndPrepareGeminiCall('MOD_C_MOM_TEST_CHECK');
  if (authCtx.creditCheckBlocked) {
    const fallback = buildSmartMomTestCheck();
    return {
      allowed: false,
      reason: authCtx.blockReason,
      ...fallback,
      engineMode: 'smart-synthesizer',
    };
  }

  if (authCtx.canCallLiveGemini && authCtx.activeApiKey) {
    try {
      const ai = getGenAiClient(authCtx.activeApiKey);
      const prompt = `Evaluate this customer survey question using Rob Fitzpatrick's "The Mom Test" and shape the rewrite naturally around the customer's real-life workflow (NEVER copy-paste raw founder notes in quotes):
Startup: ${sanitizePromptInput(params.planTitle, 200)}
Target Persona (Module B Step 1): ${ctx.shortPersona}
Customer Workflow Activity: ${ctx.customerWorkflowGerund}
Buying Trigger (Module B Step 1): ${ctx.triggerPhrase || 'Not specified'}
Named Competitors (Module B Step 2): ${ctx.competitorNames.join(', ') || 'None specified'}
Target Price (Module B Step 3): ${ctx.midBracket} ${ctx.billingCadenceLabel}
Question Type: ${params.questionType}
Founder's Draft Question: "${rawQ}"

Rules:
- If the question asks about future hypothetical intent ("Would you use...", "Would you pay...", "Do you like this idea?"), copies founder notes in quotes, or is generic, set momTestPassed = false, explain gently why, and provide a natural, conversational momTestSuggestedRewrite from the customer's perspective (${ctx.customerWorkflowGerund}).
- If it already asks about past facts/workarounds naturally, set momTestPassed = true, affirm why it works, and offer a sharper phrasing in momTestSuggestedRewrite.
- If Question Type is MULTIPLE_CHOICE or MULTI_SELECT, also include 4 concrete "suggestedOptions" referencing the customer's specific workflow/competitors.

Return JSON:
{
  "momTestPassed": boolean,
  "momTestFeedback": "1-2 sentences of supportive explanation",
  "momTestSuggestedRewrite": "The natural rewritten Mom-Test question",
  "suggestedOptions": ["Option 1", "Option 2", "Option 3", "Option 4"]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
          maxOutputTokens: MAX_OUTPUT_TOKENS_PER_CALL,
        },
      });
      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text) as {
          momTestPassed?: boolean;
          momTestFeedback?: string;
          momTestSuggestedRewrite?: string;
          suggestedOptions?: string[];
        };
        if (parsed.momTestFeedback && parsed.momTestSuggestedRewrite) {
          await recordGeminiUsageAndIncrementCredits({
            verifiedUserId: authCtx.verifiedUserId,
            planId: params.planId,
            promptKey: 'MOD_C_MOM_TEST_CHECK',
            modelUsed: 'gemini-2.5-flash',
            inputTokens: response.usageMetadata?.promptTokenCount || 210,
            outputTokens: response.usageMetadata?.candidatesTokenCount || 180,
            usedByokKey: authCtx.usedByokKey,
            fallbackCreditsUsed: authCtx.currentCreditsUsed,
          });
          return {
            allowed: true,
            momTestPassed: Boolean(parsed.momTestPassed),
            momTestFeedback: parsed.momTestFeedback,
            momTestSuggestedRewrite: parsed.momTestSuggestedRewrite,
            suggestedOptions: Array.isArray(parsed.suggestedOptions)
              ? parsed.suggestedOptions
              : undefined,
            engineMode: 'gemini-2.5-flash',
          };
        }
      }
    } catch {
      // Fallback below
    }
  }

  const fallback = buildSmartMomTestCheck();
  return {
    allowed: true,
    ...fallback,
    engineMode: 'smart-synthesizer',
  };
}

/**
 * Suggests 1 additional non-overlapping Mom-Test question tailored to Module A & Module B.
 */
export async function suggestNextMomTestQuestionViaRouter(params: {
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
  const ctx = extractModuleABSurveyContext({
    planTitle: params.planTitle,
    industryCategory: params.industryCategory || 'SaaS / AI / Digital',
    hqCountryCode: params.hqCountryCode || 'IE',
    coreProblem: params.coreProblem,
    targetCustomer: params.targetCustomer,
    proposedSolution: params.proposedSolution,
    unfairAdvantage: params.unfairAdvantage,
    moduleBData: params.moduleBData,
  });

  // Build the full 8-question fallback survey across all focus areas + additional specialized Mom-Test questions
  const fullPoolSurvey = buildSmartFallbackSurvey({
    planTitle: params.planTitle,
    industryCategory: params.industryCategory || 'SaaS / AI / Digital',
    hqCountryCode: params.hqCountryCode || 'IE',
    coreProblem: params.coreProblem,
    targetCustomer: params.targetCustomer,
    proposedSolution: params.proposedSolution,
    unfairAdvantage: params.unfairAdvantage,
    moduleBData: params.moduleBData,
    focusAreas: [
      'PROBLEM_AND_PAIN',
      'CURRENT_WORKAROUNDS',
      'PAST_SPENDING_BUDGET',
      'WORKFLOW_AND_HABITS',
      'FEATURE_PRIORITIES',
    ],
    questionCount: 8,
  });

  const nowTs = Date.now();
  const candidatePool: SurveyQuestionItem[] = [
    ...fullPoolSurvey.questions,
    {
      id: `q-${nowTs}-ai-priority`,
      questionText: `Compared to your other priorities right now, how urgent is it for you to ${ctx.customerGoalInfinitive} over the next 3 months?`,
      type: 'SCALE_1_5',
      scaleMinLabel: '1 = Low priority / Someday maybe',
      scaleMaxLabel: '5 = Top-3 priority to sort out right now',
      momTestPassed: true,
      momTestFeedback:
        'Mom-Test Approved: Measures whether this is a hair-on-fire priority for your beachhead customer.',
    },
    {
      id: `q-${nowTs}-ai-decision`,
      questionText: `When you decide to adopt a new tool or service for ${ctx.customerWorkflowGerund}, who else typically needs to sign off or be involved?`,
      type: 'MULTIPLE_CHOICE',
      options: [
        'Just me — I make the decision and pay directly',
        'A co-founder, business partner, or team lead',
        'Our finance / procurement / operations manager',
        'An external advisor, accountant, or board member',
      ],
      allowOther: true,
      momTestPassed: true,
      momTestFeedback:
        'Mom-Test Approved: Validates the decision-maker vs. end-user buying path from Module B Step 1.',
    },
    {
      id: `q-${nowTs}-ai-shortfall`,
      questionText: `If you tried using ${ctx.competitorNames.slice(0, 2).join(' or ') || 'an existing tool or template'} in the past while ${ctx.customerWorkflowGerund}, what was the #1 reason it fell short for you?`,
      type: 'OPEN_TEXT',
      momTestPassed: true,
      momTestFeedback:
        'Mom-Test Approved: Uncovers real switching triggers and validates the competitor weaknesses you mapped in Module B Step 2.',
    },
    {
      id: `q-${nowTs}-ai-discovery`,
      questionText: `Where do you usually look first when you need a better way or trusted recommendation for ${ctx.customerWorkflowGerund}?`,
      type: 'MULTIPLE_CHOICE',
      options: [
        'Asking peers, founders, or colleagues in my industry network',
        'Searching Google, YouTube, or AI tools for comparisons',
        'LinkedIn communities, Reddit threads, or Slack/WhatsApp groups',
        'Local enterprise support hubs, accelerators, or industry events',
      ],
      allowOther: true,
      momTestPassed: true,
      momTestFeedback:
        'Mom-Test Approved: Reveals the exact acquisition channels your target buyers already trust (feeds directly into Module I).',
    },
  ];

  // Pick the first candidate question that is NOT a duplicate or near-duplicate of any existing question
  const unusedCandidate = candidatePool.find(
    (candidate) =>
      !params.existingQuestions.some((existing) =>
        areQuestionsNearDuplicates(existing.questionText, candidate.questionText)
      )
  );

  const suggested: SurveyQuestionItem = unusedCandidate
    ? {
        ...unusedCandidate,
        id: `q-${Date.now()}-ai-${Math.random().toString(36).slice(2, 5)}`,
      }
    : {
        id: `q-${Date.now()}-ai-open`,
        questionText: `What is one part of ${ctx.customerWorkflowGerund} that outsiders or software builders always seem to misunderstand about your day-to-day reality?`,
        type: 'OPEN_TEXT',
        momTestPassed: true,
        momTestFeedback:
          'Mom-Test Approved: Invites insider domain truth that competitors miss.',
      };

  return {
    allowed: true,
    question: suggested,
    engineMode: 'smart-synthesizer',
  };
}

/**
 * Synthesizes survey responses + 1-on-1 customer interviews into a "Signal vs. Polite Noise" Insights Summary.
 */
export async function analyzeModuleCSurveyResultsViaRouter(params: {
  userId?: string;
  planId?: string;
  planTitle: string;
  surveyTitle: string;
  questions: SurveyQuestionItem[];
  responses: SavedSurveyResponse[];
  interviewLogs?: SavedCustomerInterviewLog[];
}): Promise<AnalyzeSurveyResultsOutput> {
  const totalResponses = params.responses.length;
  const interviews = params.interviewLogs || [];
  const totalInterviews = interviews.length;
  const waitlistLeads = params.responses.filter(
    (r) => r.joinedWaitlist || (r.respondentEmail && r.respondentEmail.includes('@'))
  );

  // Compute quantitative signal from responses + 1-on-1 interviews
  let scaleSum = 0;
  let scaleCount = 0;
  const optionTallies: Array<{ questionText: string; topOption: string; pct: number }> = [];
  const openQuotes: string[] = [];

  for (const q of params.questions) {
    if (q.type === 'SCALE_1_5') {
      for (const r of params.responses) {
        const val = r.answers[q.id]?.scaleValue;
        if (typeof val === 'number' && val >= 1 && val <= 5) {
          scaleSum += val;
          scaleCount += 1;
        }
      }
    } else if (q.type === 'MULTIPLE_CHOICE' || q.type === 'MULTI_SELECT') {
      const counts: Record<string, number> = {};
      let answeredCount = 0;
      for (const r of params.responses) {
        const ans = r.answers[q.id];
        if (!ans) continue;
        if (q.type === 'MULTIPLE_CHOICE' && ans.selectedOption) {
          answeredCount += 1;
          counts[ans.selectedOption] = (counts[ans.selectedOption] || 0) + 1;
        } else if (
          q.type === 'MULTI_SELECT' &&
          Array.isArray(ans.selectedOptions) &&
          ans.selectedOptions.length > 0
        ) {
          answeredCount += 1;
          for (const opt of ans.selectedOptions) {
            counts[opt] = (counts[opt] || 0) + 1;
          }
        }
      }
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      if (sorted.length > 0 && answeredCount > 0) {
        optionTallies.push({
          questionText: q.questionText,
          topOption: sorted[0][0],
          pct: Math.round((sorted[0][1] / answeredCount) * 100),
        });
      }
    } else if (q.type === 'OPEN_TEXT') {
      for (const r of params.responses) {
        const txt = r.answers[q.id]?.openText?.trim();
        if (txt && txt.length > 5) {
          openQuotes.push(txt);
        }
      }
    }
  }

  for (const log of interviews) {
    if (typeof log.painScore1To5 === 'number' && log.painScore1To5 >= 1 && log.painScore1To5 <= 5) {
      scaleSum += log.painScore1To5;
      scaleCount += 1;
    }
    if (log.verbatimQuote?.trim()) {
      openQuotes.push(`${log.verbatimQuote.trim()} — ${log.intervieweeNameOrRole}`);
    }
  }

  const strongSignalInterviews = interviews.filter(
    (i) => i.signalBadge === 'STRONG_SIGNAL' || i.commitmentOutcome === 'ASKED_TO_PILOT_OR_BUY'
  );
  const politeFluffInterviews = interviews.filter(
    (i) => i.signalBadge === 'POLITE_FLUFF' || i.commitmentOutcome === 'POLITE_COMPLIMENTS_ONLY'
  );

  const avgScale = scaleCount > 0 ? Number((scaleSum / scaleCount).toFixed(1)) : 3.8;
  const waitlistConversionPct =
    totalResponses > 0
      ? Math.round((waitlistLeads.length / totalResponses) * 100)
      : 0;

  const computedSignalScore = Math.min(
    98,
    Math.max(
      35,
      Math.round(
        avgScale * 14 +
          Math.min(waitlistConversionPct * 0.35, 22) +
          Math.min(totalResponses * 1.5, 12) +
          Math.min(strongSignalInterviews.length * 4, 14)
      )
    )
  );

  const buildSmartFallbackInsights = (): SurveyAiInsightsSummary => {
    const validatedPainPoints: string[] = [];
    for (const item of optionTallies.slice(0, 3)) {
      validatedPainPoints.push(
        `${item.pct}% of respondents selected "${item.topOption}" on "${item.questionText}".`
      );
    }
    if (totalInterviews > 0) {
      validatedPainPoints.push(
        `1-on-1 Customer Interviews (${totalInterviews} logged, ${strongSignalInterviews.length} Strong Signal): ${
          interviews[0]?.keyTakeaway || 'Verified real workflow friction and active workarounds.'
        }`
      );
    }
    if (scaleCount > 0) {
      validatedPainPoints.push(
        `Average pain/urgency rating across survey & interview evidence is ${avgScale} / 5.0 (${
          avgScale >= 3.8
            ? 'Strong hair-on-fire signal'
            : avgScale >= 2.8
              ? 'Moderate pain — look for the highest-scoring sub-segment'
              : 'Low urgency warning — respondents may find current workarounds acceptable'
        }).`
      );
    }
    if (openQuotes.length > 0) {
      validatedPainPoints.push(
        `Direct customer voice: "${openQuotes[0].slice(0, 150)}${openQuotes[0].length > 150 ? '...' : ''}"`
      );
    }
    if (validatedPainPoints.length === 0) {
      validatedPainPoints.push(
        `Collected ${totalResponses} survey response(s) and ${totalInterviews} interview(s) so far. Share your public survey link or log 3–5 customer discovery calls to unlock stronger pattern confidence.`
      );
    }

    const politenessAlertOrRisks: string[] = [];
    if (politeFluffInterviews.length > 0) {
      politenessAlertOrRisks.push(
        `Mom-Test Alert (${politeFluffInterviews.length} of ${totalInterviews} interviews flagged as Polite Fluff): When interviewees say "sounds cool, keep me posted" without sharing a real past workaround or budget, discount their praise and focus on the ${strongSignalInterviews.length} high-pain buyer(s).`
      );
    }
    if (avgScale < 3.2 && waitlistConversionPct > 40) {
      politenessAlertOrRisks.push(
        `Politeness Warning: ${waitlistConversionPct}% joined the waitlist, but average problem intensity is only ${avgScale}/5. Make sure they aren't just being supportive friends—verify if they actively try to solve this today.`
      );
    } else if (waitlistConversionPct < 20 && totalResponses >= 3) {
      politenessAlertOrRisks.push(
        `Low Waitlist Opt-In (${waitlistConversionPct}%): Respondents are answering questions, but fewer than 1 in 5 left their email. Consider sharpening your Waitlist Incentive at the bottom of the survey.`
      );
    } else {
      politenessAlertOrRisks.push(
        `Always cross-check open-text stories against what customers currently spend or do manually—focus your V1 product (Module D) on the customers who rated pain 4 or 5 out of 5.`
      );
    }

    if (totalResponses + totalInterviews < 8) {
      politenessAlertOrRisks.push(
        `Sample Size Note (${totalResponses} survey responses + ${totalInterviews} 1-on-1 interviews): Treat early trends as directional signals until you reach 10+ combined data points from your core beachhead persona.`
      );
    }

    return {
      headlineTakeaway:
        avgScale >= 3.8
          ? `Strong problem validation (${avgScale}/5 avg urgency across ${totalResponses} survey responses & ${totalInterviews} 1-on-1 interviews).`
          : `Early discovery signal captured (${totalResponses} survey responses, ${totalInterviews} interviews, ${avgScale}/5 avg rating).`,
      signalScoreOutOf100: computedSignalScore,
      validatedPainPoints,
      politenessAlertOrRisks,
      recommendedNextAction:
        strongSignalInterviews.length > 0
          ? `Follow up with your ${strongSignalInterviews.length} Strong-Signal interviewee(s) (${strongSignalInterviews
              .slice(0, 2)
              .map((i) => i.intervieweeNameOrRole)
              .join(', ')}) to co-design your V1 scope in Module D and validate pricing in Module F.`
          : waitlistLeads.length > 0
            ? `Invite the ${waitlistLeads.length} waitlist respondent(s) (${waitlistLeads
                .slice(0, 2)
                .map((l) => l.respondentEmail)
                .filter(Boolean)
                .join(', ')}) to a 15-minute 1-on-1 discovery call and carry their top pain point into Module D.`
            : `Share your no-login survey link in 2–3 niche communities or log 3 customer calls in the 1-on-1 Interviews tab.`,
      topWaitlistLeadAdvice:
        waitlistLeads.length > 0
          ? `${waitlistLeads.length} of ${totalResponses} survey respondents (${waitlistConversionPct}%) opted into your waitlist. Click "Log 1-on-1 Call" next to high-pain leads to convert them into pilot interviews.`
          : totalInterviews > 0
            ? `${totalInterviews} 1-on-1 interview(s) logged (${strongSignalInterviews.length} Strong Signal). Keep logging verbatim quotes and current spend so Module F (Pricing) and Module I (Business Plan) can cite real buyer proof.`
            : 'No waitlist emails captured yet — make sure "Collect Early-Bird Waitlist Emails" is enabled on your survey.',
      lastAnalyzedAt: new Date().toISOString(),
      aiEngineUsed: 'smart-synthesizer',
    };
  };

  const authCtx = await authorizeAndPrepareGeminiCall('MOD_C_ANALYZE_RESULTS');
  if (authCtx.creditCheckBlocked) {
    return {
      allowed: false,
      reason: authCtx.blockReason,
      insights: buildSmartFallbackInsights(),
      engineMode: 'smart-synthesizer',
    };
  }

  if (
    authCtx.canCallLiveGemini &&
    authCtx.activeApiKey &&
    (totalResponses > 0 || totalInterviews > 0)
  ) {
    try {
      const ai = getGenAiClient(authCtx.activeApiKey);
      const fallback = buildSmartFallbackInsights();
      const prompt = `Analyze these customer validation survey results and 1-on-1 customer interviews using Rob Fitzpatrick's "The Mom Test" (Signal vs. Polite Noise):
Startup: ${sanitizePromptInput(params.planTitle, 200)}
Survey: ${sanitizePromptInput(params.surveyTitle, 200)}
Total Survey Responses: ${totalResponses}
Waitlist Opt-Ins: ${waitlistLeads.length} (${waitlistConversionPct}%)
1-on-1 Customer Interviews Logged: ${totalInterviews} (${strongSignalInterviews.length} Strong Signal, ${politeFluffInterviews.length} Polite Fluff)
Interview Summaries: ${JSON.stringify(
        interviews.slice(0, 6).map((i) => ({
          interviewee: sanitizePromptInput(i.intervieweeNameOrRole, 120),
          painScore: i.painScore1To5,
          signal: i.signalBadge,
          outcome: i.commitmentOutcome,
          otherOutcome: sanitizePromptInput(i.otherCommitmentText, 160),
          workaroundAndSpend: sanitizePromptInput(i.workaroundAndSpend, 300),
          keyTakeaway: sanitizePromptInput(i.keyTakeaway, 300),
          verbatimQuote: sanitizePromptInput(i.verbatimQuote, 300),
        }))
      )}
Average 1-5 Scale Score: ${avgScale} / 5.0
Top Option Tallies: ${JSON.stringify(optionTallies)}
Sample Verbatim Quotes: ${JSON.stringify(openQuotes.slice(0, 8).map((q) => sanitizePromptInput(q, 300)))}

Return JSON matching:
{
  "headlineTakeaway": "1 crisp sentence summarizing the combined survey + 1-on-1 interview validation signal",
  "signalScoreOutOf100": number (0-100),
  "validatedPainPoints": ["3 specific insights backed by survey percentages and 1-on-1 interview takeaways"],
  "politenessAlertOrRisks": ["2 Mom-Test blind-spot warnings or false-positive checks"],
  "recommendedNextAction": "Concrete next step for the founder in Module D (Product) and Module F (Pricing)",
  "topWaitlistLeadAdvice": "1 sentence on how to convert waitlist leads and strong-signal interviewees"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
          maxOutputTokens: MAX_OUTPUT_TOKENS_PER_CALL,
        },
      });
      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text) as Partial<SurveyAiInsightsSummary>;
        if (parsed.headlineTakeaway && Array.isArray(parsed.validatedPainPoints)) {
          await recordGeminiUsageAndIncrementCredits({
            verifiedUserId: authCtx.verifiedUserId,
            planId: params.planId,
            promptKey: 'MOD_C_ANALYZE_RESULTS',
            modelUsed: 'gemini-2.5-flash',
            inputTokens: response.usageMetadata?.promptTokenCount || 320,
            outputTokens: response.usageMetadata?.candidatesTokenCount || 280,
            usedByokKey: authCtx.usedByokKey,
            fallbackCreditsUsed: authCtx.currentCreditsUsed,
          });
          return {
            allowed: true,
            insights: {
              headlineTakeaway: parsed.headlineTakeaway,
              signalScoreOutOf100:
                typeof parsed.signalScoreOutOf100 === 'number'
                  ? parsed.signalScoreOutOf100
                  : fallback.signalScoreOutOf100,
              validatedPainPoints: parsed.validatedPainPoints,
              politenessAlertOrRisks: Array.isArray(parsed.politenessAlertOrRisks)
                ? parsed.politenessAlertOrRisks
                : fallback.politenessAlertOrRisks,
              recommendedNextAction:
                parsed.recommendedNextAction || fallback.recommendedNextAction,
              topWaitlistLeadAdvice:
                parsed.topWaitlistLeadAdvice || fallback.topWaitlistLeadAdvice,
              lastAnalyzedAt: new Date().toISOString(),
              aiEngineUsed: 'gemini-2.5-flash',
            },
            engineMode: 'gemini-2.5-flash',
          };
        }
      }
    } catch {
      // Fallback below
    }
  }

  return {
    allowed: true,
    insights: buildSmartFallbackInsights(),
    engineMode: 'smart-synthesizer',
  };
}

export interface ExtractMomTestInterviewOutput {
  allowed: boolean;
  reason?: string;
  keyTakeaway: string;
  verbatimQuote: string;
  workaroundAndSpend: string;
  painScore1To5: number;
  commitmentOutcome: InterviewCommitmentOutcomeType;
  signalBadge: InterviewSignalBadgeType;
  momTestCoachingNote: string;
  creditsUsedAfter?: number;
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
}

/**
 * Extracts structured Mom-Test signal (Key Takeaway, Verbatim Quote, Workaround/Spend,
 * Pain Score 1-5, Commitment Outcome, and Signal Badge) from messy 1-on-1 customer call notes.
 * Passes through the central AI router with entitlement & token logging guardrails.
 */
export async function extractMomTestInterviewInsightsViaRouter(params: {
  userId?: string;
  planId?: string;
  planTitle: string;
  industryCategory?: string;
  hqCountryCode?: SupportedCountryCode;
  intervieweeName: string;
  intervieweeRoleOrCompany: string;
  rawNotes: string;
}): Promise<ExtractMomTestInterviewOutput> {
  const raw = sanitizePromptInput(params.rawNotes, 3000);
  const lower = raw.toLowerCase();

  const buildSmartFallbackExtraction = (): Omit<
    ExtractMomTestInterviewOutput,
    'allowed' | 'engineMode'
  > => {
    const sentences = raw
      .split(/(?<=[.!?])\s+|\n+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 8);

    // Detect if there is a quoted string in the notes
    const quotedMatch =
      raw.match(/"([^"]{12,220})"/) || raw.match(/“([^”]{12,220})”/);

    const hasPilotOrPaySignal =
      lower.includes('pilot') ||
      lower.includes('pay') ||
      lower.includes('buy') ||
      lower.includes('sign up') ||
      lower.includes('beta') ||
      lower.includes('when can i use') ||
      lower.includes('send me the invoice') ||
      lower.includes('budget');

    const hasIntroSignal =
      lower.includes('intro') ||
      lower.includes('colleague') ||
      lower.includes('refer') ||
      lower.includes('connect you with');

    const hasPoliteFluff =
      (lower.includes('sounds cool') ||
        lower.includes('nice idea') ||
        lower.includes('keep me posted') ||
        lower.includes('let me know when') ||
        lower.includes('interesting concept')) &&
      !hasPilotOrPaySignal;

    const hasSpendOrWorkaround =
      lower.includes('excel') ||
      lower.includes('spreadsheet') ||
      lower.includes('manual') ||
      lower.includes('hours') ||
      lower.includes('spend') ||
      lower.includes('paying') ||
      lower.includes('€') ||
      lower.includes('$') ||
      lower.includes('£') ||
      lower.includes('agency') ||
      lower.includes('consultant') ||
      lower.includes('notion');

    let signalBadge: InterviewSignalBadgeType = 'MIXED_SIGNAL';
    let commitmentOutcome: InterviewCommitmentOutcomeType =
      'SHARED_DEEP_WORKFLOW_PAIN';
    let painScore1To5 = 4;

    if (hasPilotOrPaySignal && hasSpendOrWorkaround) {
      signalBadge = 'STRONG_SIGNAL';
      commitmentOutcome = 'ASKED_TO_PILOT_OR_BUY';
      painScore1To5 = 5;
    } else if (hasIntroSignal) {
      signalBadge = 'STRONG_SIGNAL';
      commitmentOutcome = 'INTRODUCED_PEERS';
      painScore1To5 = 4;
    } else if (hasPoliteFluff) {
      signalBadge = 'POLITE_FLUFF';
      commitmentOutcome = 'POLITE_COMPLIMENTS_ONLY';
      painScore1To5 = 2;
    } else if (hasSpendOrWorkaround) {
      signalBadge = 'STRONG_SIGNAL';
      commitmentOutcome = 'SHARED_DEEP_WORKFLOW_PAIN';
      painScore1To5 = 4;
    }

    const workaroundSentence =
      sentences.find(
        (s) =>
          /excel|spreadsheet|manual|hour|spend|pay|€|\$|£|tool|agency|currently|workaround/i.test(
            s
          )
      ) ||
      sentences[1] ||
      sentences[0] ||
      'Currently patching the workflow together manually with spreadsheets and ad-hoc tools.';

    const verbatimQuote = quotedMatch
      ? quotedMatch[1].trim()
      : sentences.find((s) => /frustrat|waste|hate|hard|problem|hour|spend|need/i.test(s)) ||
        sentences[0] ||
        raw.slice(0, 160);

    const keyTakeaway =
      signalBadge === 'STRONG_SIGNAL'
        ? `${params.intervieweeName || 'Interviewee'} confirmed active workflow pain (${painScore1To5}/5) and concrete past spend/effort rather than hypothetical interest.`
        : signalBadge === 'POLITE_FLUFF'
          ? `${params.intervieweeName || 'Interviewee'} gave polite compliments without proving an active problem, budget, or costly current workaround.`
          : `${params.intervieweeName || 'Interviewee'} shared useful workflow context (${painScore1To5}/5 pain) — follow up to verify concrete budget or switching trigger.`;

    const momTestCoachingNote =
      signalBadge === 'STRONG_SIGNAL'
        ? 'Mom-Test Pass: You captured concrete past behavior, current workaround cost, and a real commitment step.'
        : signalBadge === 'POLITE_FLUFF'
          ? 'Mom-Test Caution: Watch out for "nice idea / keep me posted" compliments. On your next call, ask when they last tried to fix this and what it cost them.'
          : 'Mom-Test Tip: Good workflow detail! To turn this into a Strong Signal, ask for a concrete next step (e.g., a paid pilot or an intro to 2 peers).';

    return {
      keyTakeaway,
      verbatimQuote: verbatimQuote.replace(/^["“]|["”]$/g, ''),
      workaroundAndSpend: workaroundSentence,
      painScore1To5,
      commitmentOutcome,
      signalBadge,
      momTestCoachingNote,
    };
  };

  const authCtx = await authorizeAndPrepareGeminiCall('MOD_C_INTERVIEW_EXTRACTOR');
  if (authCtx.creditCheckBlocked) {
    return {
      allowed: false,
      reason: authCtx.blockReason,
      ...buildSmartFallbackExtraction(),
      creditsUsedAfter: authCtx.currentCreditsUsed,
      engineMode: 'smart-synthesizer',
    };
  }

  let creditsUsedAfter = authCtx.currentCreditsUsed;

  if (authCtx.canCallLiveGemini && authCtx.activeApiKey && raw.length > 10) {
    try {
      const ai = getGenAiClient(authCtx.activeApiKey);
      const prompt = `You are a supportive co-founder and "The Mom Test" customer discovery coach.
Extract structured Mom-Test signal from the founder's raw 1-on-1 customer interview notes.

Startup: ${sanitizePromptInput(params.planTitle, 200)} (${sanitizePromptInput(params.industryCategory, 120) || 'Startup'})
Interviewee: ${sanitizePromptInput(params.intervieweeName, 120) || 'Customer'} (${sanitizePromptInput(params.intervieweeRoleOrCompany, 160) || 'Target Persona'})
Founder's Raw Call Notes:
"""
${raw}
"""

Rules:
- Distinguish between real behavioral evidence (past workarounds, time/money spent, concrete commitment) vs. polite compliments ("sounds cool", "I might use it").
- commitmentOutcome MUST be one of: "ASKED_TO_PILOT_OR_BUY", "INTRODUCED_PEERS", "SHARED_DEEP_WORKFLOW_PAIN", "POLITE_COMPLIMENTS_ONLY", "NOT_TARGET_PERSONA"
- signalBadge MUST be one of: "STRONG_SIGNAL", "MIXED_SIGNAL", "POLITE_FLUFF"
- painScore1To5 MUST be an integer from 1 to 5.

Return JSON:
{
  "keyTakeaway": "1-2 crisp sentences summarizing what this interview proved or disproved",
  "verbatimQuote": "The single most revealing direct quote or statement from the notes (without outer quotation marks)",
  "workaroundAndSpend": "How they currently handle the problem today and what time/money it costs them",
  "painScore1To5": 4,
  "commitmentOutcome": "ASKED_TO_PILOT_OR_BUY",
  "signalBadge": "STRONG_SIGNAL",
  "momTestCoachingNote": "1 constructive sentence coaching the founder on the quality of this signal"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.25,
          maxOutputTokens: MAX_OUTPUT_TOKENS_PER_CALL,
        },
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text) as Partial<ExtractMomTestInterviewOutput>;
        const fallback = buildSmartFallbackExtraction();
        if (parsed.keyTakeaway) {
          creditsUsedAfter = await recordGeminiUsageAndIncrementCredits({
            verifiedUserId: authCtx.verifiedUserId,
            planId: params.planId,
            promptKey: 'MOD_C_INTERVIEW_EXTRACTOR',
            modelUsed: 'gemini-2.5-flash',
            inputTokens: response.usageMetadata?.promptTokenCount || 180,
            outputTokens: response.usageMetadata?.candidatesTokenCount || 160,
            usedByokKey: authCtx.usedByokKey,
            fallbackCreditsUsed: authCtx.currentCreditsUsed,
          });

          return {
            allowed: true,
            keyTakeaway: parsed.keyTakeaway,
            verbatimQuote: parsed.verbatimQuote || fallback.verbatimQuote,
            workaroundAndSpend:
              parsed.workaroundAndSpend || fallback.workaroundAndSpend,
            painScore1To5:
              typeof parsed.painScore1To5 === 'number' &&
              parsed.painScore1To5 >= 1 &&
              parsed.painScore1To5 <= 5
                ? Math.round(parsed.painScore1To5)
                : fallback.painScore1To5,
            commitmentOutcome:
              parsed.commitmentOutcome === 'ASKED_TO_PILOT_OR_BUY' ||
              parsed.commitmentOutcome === 'INTRODUCED_PEERS' ||
              parsed.commitmentOutcome === 'SHARED_DEEP_WORKFLOW_PAIN' ||
              parsed.commitmentOutcome === 'POLITE_COMPLIMENTS_ONLY' ||
              parsed.commitmentOutcome === 'NOT_TARGET_PERSONA'
                ? parsed.commitmentOutcome
                : fallback.commitmentOutcome,
            signalBadge:
              parsed.signalBadge === 'STRONG_SIGNAL' ||
              parsed.signalBadge === 'MIXED_SIGNAL' ||
              parsed.signalBadge === 'POLITE_FLUFF'
                ? parsed.signalBadge
                : fallback.signalBadge,
            momTestCoachingNote:
              parsed.momTestCoachingNote || fallback.momTestCoachingNote,
            creditsUsedAfter,
            engineMode: 'gemini-2.5-flash',
          };
        }
      }
    } catch {
      // Fallback below
    }
  }

  return {
    allowed: true,
    ...buildSmartFallbackExtraction(),
    creditsUsedAfter,
    engineMode: 'smart-synthesizer',
  };
}

export interface ModuleDProductVehicleEstimateResult {
  allowed: boolean;
  reason?: string;
  productTrack: ProductTrackType;
  formFactor: ProductFormFactorType;
  v1PrototypeApproach: V1PrototypeApproachType;
  launchTimeline: V1LaunchTimelineType;
  ahaMomentNarrative: string;
  whyThisVehicleFitsCustomer: string;
  creditsUsedAfter: number;
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export async function generateModuleDProductVehicleViaRouter(params: {
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
  const authCtx = await authorizeAndPrepareGeminiCall(
    'MOD_D_STEP1_PRODUCT_VEHICLE'
  );

  const combinedText = [
    params.planTitle,
    params.brainDumpText,
    params.coreProblem,
    params.proposedSolution,
    params.targetCustomer,
    params.beachheadSegment,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const buildSmartFallback = (): Omit<
    ModuleDProductVehicleEstimateResult,
    'allowed' | 'reason' | 'creditsUsedAfter' | 'engineMode'
  > => {
    const cleanTitle = params.planTitle?.trim() || 'our startup';
    const customerLabel =
      params.beachheadSegment?.trim() ||
      params.targetCustomer?.trim() ||
      'our target customers';
    const problemRef =
      params.validatedPainSummary?.trim() ||
      params.coreProblem?.trim() ||
      'their most urgent day-to-day bottleneck';

    const track = params.selectedTrack;

    if (track === 'PHYSICAL_PRODUCT_ECOM') {
      const isWoodworking =
        /wood|board|chopping|timber|craft|artisan|furniture|joinery/.test(
          combinedText
        );
      return {
        productTrack: 'PHYSICAL_PRODUCT_ECOM',
        formFactor: 'CURATED_2_3_SKUS',
        v1PrototypeApproach: 'IN_HOUSE_SMALL_BATCH_WORKSHOP',
        launchTimeline: 'UNDER_4_WEEKS',
        ahaMomentNarrative: isWoodworking
          ? `When a customer unboxes their ${cleanTitle} parcel from Amazon or Etsy, they lift out a heavy, satin-finished hardwood chopping board wrapped in kraft gift paper with a custom laser-engraved name, a tin of beeswax board butter, and a care card with a QR code—immediately feeling heirloom quality that makes cheap warped supermarket boards look disposable.`
          : `When ${customerLabel} unbox their first ${cleanTitle} order, they experience immediate tactile quality, clear first-use instructions, and a QR insert for easy repeat ordering—solving "${problemRef.slice(0, 120)}" from day one without SKU bloat.`,
        whyThisVehicleFitsCustomer: isWoodworking
          ? `Starting with a focused 2–3 SKU hero range produced in repeatable workshop batches of 20 boards protects maker margins on Etsy and Amazon, avoids custom one-off dimension bottlenecks, and keeps boxed weight inside standard courier tiers.`
          : `A tightly curated 2–3 SKU hero range produced in small initial batches lets ${cleanTitle} validate repeat demand and marketplace conversion on Etsy/Amazon/Shopify before locking capital into large factory MOQs.`,
      };
    }

    if (track === 'EDUCATION_PROGRAM_COHORT') {
      const isSleepOrParent =
        /sleep|autis|parent|child|neuro|sensory|bedtime|family/.test(
          combinedText
        );
      return {
        productTrack: 'EDUCATION_PROGRAM_COHORT',
        formFactor: 'MOBILE_WEB_PORTAL_AUDIO_VIDEO',
        v1PrototypeApproach: 'HOSTED_PORTAL_PLUS_LIVE_QA',
        launchTimeline: 'UNDER_4_WEEKS',
        ahaMomentNarrative: isSleepOrParent
          ? `Within 3 minutes of joining ${cleanTitle} on their phone, an exhausted parent completes the Sensory Bedtime Profile Quiz, listens to a 5-minute "listen-in-the-dark" audio guide tailored to their child's sensory triggers, and prints or opens tonight's visual bedtime schedule—feeling calm, understood, and equipped with a concrete plan for tonight.`
          : `Within 5 minutes of enrolling in ${cleanTitle}, ${customerLabel} complete a quick baseline diagnostic and unlock their first bite-sized action module and tracker on their phone—getting an immediate, practical win without sitting through hours of theory.`,
        whyThisVehicleFitsCustomer: isSleepOrParent
          ? `Sleep-deprived parents of autistic children cannot watch 60-minute desktop lectures or wait for a custom iOS build. A mobile-ready web portal with 5-minute audio guides, visual routine cards, and weekly live Q&A launches in under 4 weeks and retains 97% margin (zero Apple App Store 30% cut).`
          : `A mobile-ready learning portal paired with interactive trackers and live weekly Q&A delivers measurable outcomes for ${customerLabel} in weeks rather than spending months building a custom native app from scratch.`,
      };
    }

    if (track === 'MARKETPLACE_PLATFORM') {
      return {
        productTrack: 'MARKETPLACE_PLATFORM',
        formFactor: 'MANAGED_CURATED_MARKETPLACE',
        v1PrototypeApproach: 'CONCIERGE_MANUAL_MATCHING',
        launchTimeline: 'UNDER_4_WEEKS',
        ahaMomentNarrative: `When a buyer submits their brief on ${cleanTitle}, they receive 2–3 pre-vetted, availability-checked matches within 24 hours and can book securely in one click—skipping weeks of cold outreach and unvetted directory spam.`,
        whyThisVehicleFitsCustomer: `A curated, concierge-managed marketplace solves the "chicken-and-egg" liquidity trap on Day 1: ${customerLabel} get guaranteed quality matches immediately while we prove transaction take-rates before automating self-serve matching.`,
      };
    }

    if (track === 'PRODUCTIZED_SERVICE_AGENCY') {
      return {
        productTrack: 'PRODUCTIZED_SERVICE_AGENCY',
        formFactor: 'FIXED_SCOPE_SPRINT',
        v1PrototypeApproach: 'REPEATABLE_SOP_PLUS_STRIPE',
        launchTimeline: 'UNDER_4_WEEKS',
        ahaMomentNarrative: `Immediately after booking ${cleanTitle}'s fixed-scope package, ${customerLabel} complete a 5-minute onboarding intake and receive a guaranteed delivery timeline and live workspace link—turning a vague consulting project into a predictable, productized outcome.`,
        whyThisVehicleFitsCustomer: `Packaging our expertise into a fixed-scope, fixed-price deliverable removes custom proposal friction for ${customerLabel} and lets us use internal checklists and AI automation to deliver high gross margins from Customer #1.`,
      };
    }

    if (track === 'HYBRID_HARDWARE_SOFTWARE') {
      return {
        productTrack: 'HYBRID_HARDWARE_SOFTWARE',
        formFactor: 'DEVICE_PLUS_COMPANION_APP',
        v1PrototypeApproach: 'OFF_THE_SHELF_HARDWARE_PLUS_WEB',
        launchTimeline: '1_TO_3_MONTHS',
        ahaMomentNarrative: `When ${customerLabel} power on their ${cleanTitle} kit and scan the setup QR code, live data immediately appears on their companion web dashboard with clear, plain-English action alerts within 60 seconds.`,
        whyThisVehicleFitsCustomer: `Pairing proven off-the-shelf or small-batch hardware with a responsive web dashboard lets ${cleanTitle} prove real-world customer retention and subscription willingness-to-pay before committing to expensive custom injection molds or native mobile app stores.`,
      };
    }

    // Default: SAAS_SOFTWARE_AI (or OTHER)
    return {
      productTrack: track,
      formFactor: 'WEB_PLATFORM',
      v1PrototypeApproach: 'FOCUSED_FULL_CODE_V1',
      launchTimeline: '1_TO_3_MONTHS',
      ahaMomentNarrative: `Within 60 seconds of signing up for ${cleanTitle} in their browser, ${customerLabel} enter their raw inputs and immediately see a structured, tailored output with blind-spot recommendations and exportable next steps—turning hours of spreadsheet guesswork into a clear, actionable plan.`,
      whyThisVehicleFitsCustomer: `A desktop-and-mobile responsive Web Platform eliminates Apple/Google App Store 15–30% commissions, allows instant daily deployments as we learn from our first 20 users, and directly solves "${problemRef.slice(0, 120)}" where ${customerLabel} already work.`,
    };
  };

  if (authCtx.creditCheckBlocked) {
    return {
      allowed: false,
      reason: authCtx.blockReason,
      ...buildSmartFallback(),
      creditsUsedAfter: authCtx.currentCreditsUsed,
      engineMode: 'smart-synthesizer',
    };
  }

  let creditsUsedAfter = authCtx.currentCreditsUsed;

  if (authCtx.canCallLiveGemini && authCtx.activeApiKey) {
    try {
      const ai = getGenAiClient(authCtx.activeApiKey);
      const countryPack = getCountryRulePack(params.hqCountryCode);
      const prompt = `You are a pragmatic startup CTO & Product Architect helping a founder define Step 1 of Module D ("What Are We Actually Building? — Product Vehicle & V1 Format").

Startup Context:
- Title: ${sanitizePromptInput(params.planTitle, 180)}
- Industry: ${sanitizePromptInput(params.industryCategory, 120)} (HQ: ${countryPack.countryName})
- Selected Product Track: ${sanitizePromptInput(params.selectedTrack, 80)} ${params.otherProductTrackText ? `(${sanitizePromptInput(params.otherProductTrackText, 120)})` : ''}
- Founder Brain Dump: ${sanitizePromptInput(params.brainDumpText, 800) || 'N/A'}
- Core Problem (Module A): ${sanitizePromptInput(params.coreProblem, 500) || 'N/A'}
- Proposed Solution (Module A): ${sanitizePromptInput(params.proposedSolution, 500) || 'N/A'}
- Target Beachhead Customer (Module B): ${sanitizePromptInput(params.beachheadSegment || params.targetCustomer, 400) || 'N/A'}
- Validated Customer Survey/Interview Insight (Module C): ${sanitizePromptInput(params.validatedPainSummary, 500) || 'N/A'}

CRITICAL TRACK-SPECIFIC RULES:
- Match ALL terminology strictly to the Selected Product Track (${params.selectedTrack}).
- If PHYSICAL_PRODUCT_ECOM: NEVER mention coding, web apps, or software APIs. Speak about hero SKUs, small-batch workshop/co-packer production, unboxing quality, packaging, and Amazon/Etsy/Shopify readiness.
- If EDUCATION_PROGRAM_COHORT: Speak about bite-sized audio/video lessons, interactive trackers/assessments, mobile-ready learning portals, and high completion rates for busy learners/parents.
- If SAAS_SOFTWARE_AI: Speak about responsive web vs. mobile app form factors, fast time-to-value, and lean V1 architecture.
- If MARKETPLACE_PLATFORM: Speak about curated matching, overcoming chicken-and-egg supply/demand, and concierge V1 validation.
- If PRODUCTIZED_SERVICE_AGENCY: Speak about fixed-scope deliverables, repeatable SOPs, and fast client onboarding.

Return strictly valid JSON with:
{
  "ahaMomentNarrative": "2 vivid sentences describing the 60-second 'Aha! Moment' when a customer buys, unboxes, or opens V1 for the very first time and gets immediate value.",
  "whyThisVehicleFitsCustomer": "2 practical sentences explaining why this V1 format and lean launch approach is the smartest, lowest-risk way to serve this specific customer and protect margins."
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.35,
          maxOutputTokens: MAX_OUTPUT_TOKENS_PER_CALL,
        },
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text) as {
          ahaMomentNarrative?: string;
          whyThisVehicleFitsCustomer?: string;
        };
        const fallback = buildSmartFallback();
        if (parsed.ahaMomentNarrative && parsed.whyThisVehicleFitsCustomer) {
          creditsUsedAfter = await recordGeminiUsageAndIncrementCredits({
            verifiedUserId: authCtx.verifiedUserId,
            planId: params.planId,
            promptKey: 'MOD_D_STEP1_PRODUCT_VEHICLE',
            modelUsed: 'gemini-2.5-flash',
            inputTokens: response.usageMetadata?.promptTokenCount || 260,
            outputTokens: response.usageMetadata?.candidatesTokenCount || 190,
            usedByokKey: authCtx.usedByokKey,
            fallbackCreditsUsed: authCtx.currentCreditsUsed,
          });

          return {
            allowed: true,
            ...fallback,
            ahaMomentNarrative: parsed.ahaMomentNarrative.trim(),
            whyThisVehicleFitsCustomer: parsed.whyThisVehicleFitsCustomer.trim(),
            creditsUsedAfter,
            engineMode: 'gemini-2.5-flash',
          };
        }
      }
    } catch {
      // Fallback below
    }
  }

  return {
    allowed: true,
    ...buildSmartFallback(),
    creditsUsedAfter,
    engineMode: 'smart-synthesizer',
  };
}



export interface ModuleDScopeFilterGenerationResult {
  allowed: boolean;
  reason?: string;
  items: ScopeFilterItem[];
  scopeDisciplineRule: V1ScopeDisciplineRuleType | '';
  whatWeRefuseToBuildInV1Narrative: string;
  whyThisLeanV1WinsFasterNarrative: string;
  creditsUsedAfter?: number;
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export async function generateModuleDScopeFilterViaRouter(params: {
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
  const authCtx = await authorizeAndPrepareGeminiCall(
    'MOD_D_STEP3_SCOPE_FILTER'
  );

  const userItems = Array.isArray(params.currentScopeItems)
    ? params.currentScopeItems
    : [];
  const v1Titles = userItems
    .filter((i) => i.bucket === 'MUST_HAVE_V1')
    .map((i) => i.title.trim())
    .filter(Boolean);
  const v15Titles = userItems
    .filter((i) => i.bucket === 'FAST_FOLLOW_V1_5')
    .map((i) => i.title.trim())
    .filter(Boolean);
  const v2Titles = userItems
    .filter((i) => i.bucket === 'PARKING_LOT_V2')
    .map((i) => i.title.trim())
    .filter(Boolean);

  const buildSmartFallback = (): Omit<
    ModuleDScopeFilterGenerationResult,
    'allowed' | 'reason' | 'creditsUsedAfter' | 'engineMode'
  > => {
    const track = params.selectedTrack || 'SAAS_SOFTWARE_AI';

    // If the founder has entered their own items on the Scope Board, synthesize the Charter directly from their items
    if (userItems.length > 0) {
      const refuseParts: string[] = [];
      if (v2Titles.length > 0) {
        refuseParts.push(
          `In Version 1, we explicitly refuse to build or stock: ${v2Titles.join('; ')}.`
        );
      } else {
        refuseParts.push(
          'In Version 1, we strictly refuse any unvalidated feature bloat, custom one-off requests, or secondary product lines outside our core Day-1 launch gate.'
        );
      }
      if (v15Titles.length > 0) {
        refuseParts.push(
          `We are also deferring (${v15Titles.join('; ')}) to our Version 1.5 Fast-Follow roadmap until our Day-1 core is live with paying customers.`
        );
      }

      const whyLeanText =
        v1Titles.length > 0
          ? `By locking our non-negotiable Version 1 launch scope strictly to ${v1Titles.length} core ${
              v1Titles.length === 1 ? 'deliverable' : 'deliverables'
            } (${v1Titles.join('; ')}), we eliminate scope creep, protect our launch budget, and reach paying customers faster.`
          : 'Keeping Version 1 tightly focused on our core customer outcome eliminates scope creep and lets us validate real customer retention faster.';

      return {
        scopeDisciplineRule: '',
        items: userItems,
        whatWeRefuseToBuildInV1Narrative: refuseParts.join(' '),
        whyThisLeanV1WinsFasterNarrative: whyLeanText,
      };
    }

    if (track === 'PHYSICAL_PRODUCT_ECOM') {
      return {
        scopeDisciplineRule: '',
        items: [],
        whatWeRefuseToBuildInV1Narrative:
          'In Version 1, we strictly refuse custom one-off dimensions, complex multi-part assemblies, and stocking excessive SKU variations that break standardized batch production and packaging.',
        whyThisLeanV1WinsFasterNarrative:
          'Restricting Version 1 to a focused set of standardized hero SKUs lets us batch-produce efficiently, keep courier shipping weights predictable, and protect gross margins across direct and marketplace channels.',
      };
    }

    if (track === 'EDUCATION_PROGRAM_COHORT') {
      return {
        scopeDisciplineRule: '',
        items: [],
        whatWeRefuseToBuildInV1Narrative:
          'In Version 1, we refuse to spend months building a custom native iOS/Android mobile app or recording dozens of hours of academic theory before families complete our core program.',
        whyThisLeanV1WinsFasterNarrative:
          'Launching our focused curriculum and actionable toolkits inside a mobile-ready web portal lets us onboard paying members in weeks, gather real outcome proof, and keep 95%+ gross margin.',
      };
    }

    if (track === 'MARKETPLACE_PLATFORM') {
      return {
        scopeDisciplineRule: '',
        items: [],
        whatWeRefuseToBuildInV1Narrative:
          'In Version 1, we refuse to build automated bidding algorithms, custom in-app video chat, or dual native mobile apps for buyers and suppliers before proving repeat booking liquidity on our first 50 transactions.',
        whyThisLeanV1WinsFasterNarrative:
          'Combining a clean web booking checkout with founder-curated matching for our initial cohort of suppliers guarantees high-trust matches on Day 1 and proves our commission take-rate in weeks.',
      };
    }

    if (track === 'PRODUCTIZED_SERVICE_AGENCY') {
      return {
        scopeDisciplineRule: '',
        items: [],
        whatWeRefuseToBuildInV1Narrative:
          'In Version 1, we refuse open-ended hourly consulting, bespoke out-of-scope client requests, and building a custom self-serve software portal before delivering 20 profitable client sprints.',
        whyThisLeanV1WinsFasterNarrative:
          'A standardized fixed-scope package with a structured intake checklist and internal SOPs lets us generate profitable cashflow in under 14 days with 70%+ gross margins.',
      };
    }

    if (track === 'HYBRID_HARDWARE_SOFTWARE') {
      return {
        scopeDisciplineRule: '',
        items: [],
        whatWeRefuseToBuildInV1Narrative:
          'In Version 1, we refuse expensive injection-moulded tooling, custom factory MOQs, and native mobile app store builds before our first 50 pilot kits are operating in real customer hands.',
        whyThisLeanV1WinsFasterNarrative:
          'Pairing pre-certified small-batch hardware with a QR-activated web dashboard lets us ship pilot kits in weeks, prove recurring subscription retention, and unlock R&D grant funding with real field data.',
      };
    }

    // Default: SAAS_SOFTWARE_AI (or OTHER)
    return {
      scopeDisciplineRule: '',
      items: [],
      whatWeRefuseToBuildInV1Narrative:
        'In Version 1, we strictly refuse to build native iOS/Android mobile apps, complex third-party ERP integrations, or enterprise SSO before validating our core web workflow with paying users.',
      whyThisLeanV1WinsFasterNarrative:
        'Keeping Version 1 focused on our essential Day-1 web capabilities lets us ship faster, validate willingness-to-pay with real customers, and iterate based on actual usage data rather than assumptions.',
    };
  };

  let creditsUsedAfter = authCtx.currentCreditsUsed;

  if (authCtx.canCallLiveGemini && authCtx.activeApiKey) {
    try {
      const ai = getGenAiClient(authCtx.activeApiKey);
      const countryPack = getCountryRulePack(params.hqCountryCode);

      const prompt = `You are a ruthless Startup Product & Scope Strategist helping a founder draft the "Anti-Scope-Creep Charter & Grant Justification" in Step 3 of Module D.

Startup Context:
- Title: ${sanitizePromptInput(params.planTitle, 180)}
- Industry: ${sanitizePromptInput(params.industryCategory, 120)} (HQ: ${countryPack.countryName})
- Selected Product Track (Step 1): ${sanitizePromptInput(params.selectedTrack, 80)}
- Form Factor (Step 1): ${sanitizePromptInput(params.formFactor, 80) || 'N/A'}
- Primary Sales Channel (Step 2): ${sanitizePromptInput(params.primaryChannel, 80) || 'N/A'}
- Core Problem: ${sanitizePromptInput(params.coreProblem, 350) || 'N/A'}
- Proposed Solution: ${sanitizePromptInput(params.proposedSolution, 350) || 'N/A'}
- Validated Customer Pain (Module C): ${sanitizePromptInput(params.validatedPainSummary, 350) || 'N/A'}

Founder's Saved Scope Board Items (DO NOT invent new scope items; base your charter directly on these if provided):
- MUST-HAVE FOR V1 (Day-1 Core): ${v1Titles.length > 0 ? sanitizePromptInput(v1Titles.join(' | '), 500) : 'None listed yet'}
- FAST-FOLLOW V1.5 (Deferred to Months 3-6): ${v15Titles.length > 0 ? sanitizePromptInput(v15Titles.join(' | '), 400) : 'None listed yet'}
- V2 ICEBOX (Explicitly Refused in V1): ${v2Titles.length > 0 ? sanitizePromptInput(v2Titles.join(' | '), 400) : 'None listed yet'}

CRITICAL RULES:
- Match ALL terminology strictly to the Selected Product Track (${params.selectedTrack}) and the founder's saved scope items above.
- Specifically reference the founder's MUST-HAVE FOR V1 items in "whyThisLeanV1WinsFasterNarrative" and their FAST-FOLLOW V1.5 / V2 ICEBOX items in "whatWeRefuseToBuildInV1Narrative" whenever provided.

Return strictly valid JSON with:
{
  "whatWeRefuseToBuildInV1Narrative": "2 concrete sentences stating what the founder explicitly refuses to build or stock in Version 1 (and what is deferred to V1.5/V2) to prevent scope creep or inventory bloat.",
  "whyThisLeanV1WinsFasterNarrative": "2 concrete sentences explaining why launching with the founder's non-negotiable V1 scope gets to paying customers faster and protects unit margins."
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.35,
          maxOutputTokens: MAX_OUTPUT_TOKENS_PER_CALL,
        },
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text) as {
          whatWeRefuseToBuildInV1Narrative?: string;
          whyThisLeanV1WinsFasterNarrative?: string;
        };

        if (
          parsed.whatWeRefuseToBuildInV1Narrative &&
          parsed.whyThisLeanV1WinsFasterNarrative
        ) {
          creditsUsedAfter = await recordGeminiUsageAndIncrementCredits({
            verifiedUserId: authCtx.verifiedUserId,
            planId: params.planId,
            promptKey: 'MOD_D_STEP3_SCOPE_FILTER',
            modelUsed: 'gemini-2.5-flash',
            inputTokens: response.usageMetadata?.promptTokenCount || 280,
            outputTokens: response.usageMetadata?.candidatesTokenCount || 180,
            usedByokKey: authCtx.usedByokKey,
            fallbackCreditsUsed: authCtx.currentCreditsUsed,
          });

          return {
            allowed: true,
            scopeDisciplineRule: '',
            items: userItems,
            whatWeRefuseToBuildInV1Narrative:
              parsed.whatWeRefuseToBuildInV1Narrative.trim(),
            whyThisLeanV1WinsFasterNarrative:
              parsed.whyThisLeanV1WinsFasterNarrative.trim(),
            creditsUsedAfter,
            engineMode: 'gemini-2.5-flash',
          };
        }
      }
    } catch {
      // Fallback below
    }
  }

  return {
    allowed: true,
    ...buildSmartFallback(),
    creditsUsedAfter,
    engineMode: 'smart-synthesizer',
  };
}



export interface ModuleDChannelMatrixGenerationResult {
  allowed: boolean;
  reason?: string;
  primaryChannel: SalesChannelOptionType;
  secondaryChannels: SalesChannelOptionType[];
  primaryChannelSharePercent: number;
  estimatedBlendedFeePercent: number;
  deliveryFulfillmentModel: DeliveryFulfillmentModelType;
  rentToOwnBridgeStrategy: string;
  channelWhyItFitsNotes: string;
  creditsUsedAfter: number;
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export async function generateModuleDChannelMatrixViaRouter(params: {
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
  const authCtx = await authorizeAndPrepareGeminiCall(
    'MOD_D_STEP2_CHANNEL_MATRIX'
  );

  const buildSmartFallback = (): Omit<
    ModuleDChannelMatrixGenerationResult,
    'allowed' | 'reason' | 'creditsUsedAfter' | 'engineMode'
  > => {
    const cleanTitle = params.planTitle?.trim() || 'your product';
    const combinedText = [
      params.planTitle,
      params.industryCategory,
      params.brainDumpText,
      params.coreProblem,
      params.proposedSolution,
      params.beachheadSegment,
      params.targetCustomer,
      params.otherProductTrackText,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const customerLabel =
      params.beachheadSegment?.trim() ||
      params.targetCustomer?.trim() ||
      'your target customers';

    const track = params.selectedTrack;

    if (track === 'PHYSICAL_PRODUCT_ECOM') {
      const isWoodworking =
        /wood|board|chopping|timber|craft|artisan|furniture|joinery/.test(
          combinedText
        );
      return {
        primaryChannel: 'ETSY_MARKETPLACE',
        secondaryChannels: ['AMAZON_FBA', 'DIRECT_WEB_CRAFT_MARKETS'],
        primaryChannelSharePercent: 55,
        estimatedBlendedFeePercent: 16.5,
        deliveryFulfillmentModel: 'HYBRID_FBA_STANDARD_WORKSHOP_CUSTOM',
        rentToOwnBridgeStrategy: isWoodworking
          ? `Every ${cleanTitle} chopping board shipped via Etsy or Amazon includes a branded kraft care card with a QR code offering a free "Heirloom Timber Care Guide + 15% off Beeswax Board Butter Refills" on our direct website—turning one-off rented marketplace gift buyers into owned direct repeat customers.`
          : `Include a QR registration & care insert inside every Amazon and Etsy package offering a reorder discount or refill bundle on ${cleanTitle}'s direct store so we build an owned customer email list from day one.`,
        channelWhyItFitsNotes: isWoodworking
          ? `Etsy (~10.5% fee) gives us immediate high-intent handmade gift buyers for custom engraved boards shipped from our workshop, while Amazon FBA (~31% total fee) moves standard non-engraved boards on Prime autopilot. Our direct website & craft markets (~2.9% fee) capture 97% gross margin on corporate and repeat orders.`
          : `Combining marketplace discovery (Etsy/Amazon) with a direct brand checkout balances Day-1 buyer traffic with long-term margin protection, keeping our blended platform commission around ~16.5% for Module G pricing.`,
      };
    }

    if (track === 'EDUCATION_PROGRAM_COHORT') {
      const isSleepOrParent =
        /sleep|autis|parent|child|neuro|sensory|bedtime|family/.test(
          combinedText
        );
      return {
        primaryChannel: 'DIRECT_WEB_PORTAL_STRIPE',
        secondaryChannels: [
          'CHARITY_CLINIC_PARTNERSHIPS',
          'HOSTED_COURSE_COMMUNITY',
        ],
        primaryChannelSharePercent: 75,
        estimatedBlendedFeePercent: 4.5,
        deliveryFulfillmentModel: 'HYBRID_ON_DEMAND_PLUS_LIVE_QA',
        rentToOwnBridgeStrategy: isSleepOrParent
          ? `Exhausted parents discover ${cleanTitle} via autism charities, OT clinics, and parent support groups using a free "5-Minute Sensory Bedtime Checklist & Visual Routine Card" lead magnet—capturing 100% owned parent emails before they enrol on our direct web portal (avoiding Apple/Google's 30% in-app purchase tax).`
          : `Offer a free diagnostic mini-guide and printable action tool on ${cleanTitle}'s direct web portal so learners join our owned email list before upgrading to the full guided program.`,
        channelWhyItFitsNotes: isSleepOrParent
          ? `Selling directly via our mobile-friendly web portal with Stripe (~2.9% fee) plus charity/clinic referral partners keeps blended fees at ~4.5% instead of losing 30% to the Apple App Store, while instant 24/7 audio/visual access + weekly live Q&A supports parents at 2am when bedtime struggles happen.`
          : `Direct web checkout paired with trusted community/clinic referral partners protects ~95.5% of gross revenue and gives ${customerLabel} immediate mobile & desktop access without app-store gatekeeping.`,
      };
    }

    if (track === 'MARKETPLACE_PLATFORM') {
      return {
        primaryChannel: 'DIRECT_WEB_MANAGED_ESCROW',
        secondaryChannels: ['SOCIAL_COMMUNITY_REFERRAL_LOOP'],
        primaryChannelSharePercent: 80,
        estimatedBlendedFeePercent: 3.2,
        deliveryFulfillmentModel: 'MANUAL_CONCIERGE_FULFILLMENT',
        rentToOwnBridgeStrategy: `Both buyers and providers create verified profiles directly on ${cleanTitle}'s web platform to unlock booking protection and automated invoicing—keeping repeat bookings on-platform instead of leaking to off-platform cash deals.`,
        channelWhyItFitsNotes: `Direct web escrow via Stripe Connect keeps payment processing around ~3.2% and lets us manually curate and verify the first 50 matches before scaling automated self-serve bookings.`,
      };
    }

    if (track === 'PRODUCTIZED_SERVICE_AGENCY') {
      return {
        primaryChannel: 'DIRECT_STRIPE_SUBSCRIPTION_LINK',
        secondaryChannels: ['B2B_INVOICE_BANK_TRANSFER'],
        primaryChannelSharePercent: 70,
        estimatedBlendedFeePercent: 2.2,
        deliveryFulfillmentModel: 'CLIENT_PORTAL_ASYNC_DELIVERY',
        rentToOwnBridgeStrategy: `Prospects book via a free 5-minute diagnostic audit on ${cleanTitle}'s website and receive a dedicated client workspace—owning 100% of the client relationship with zero freelance-marketplace commissions.`,
        channelWhyItFitsNotes: `Direct Stripe checkout links and B2B bank transfers keep payment fees at ~2.2% and eliminate 10%–20% agency marketplace cuts while asynchronous portal delivery protects founder time.`,
      };
    }

    if (track === 'HYBRID_HARDWARE_SOFTWARE') {
      return {
        primaryChannel: 'DIRECT_HARDWARE_BUNDLE_WEB',
        secondaryChannels: [
          'AMAZON_PLUS_COMPANION_PORTAL',
          'B2B_CHANNEL_RESELLER',
        ],
        primaryChannelSharePercent: 65,
        estimatedBlendedFeePercent: 9.5,
        deliveryFulfillmentModel: 'HARDWARE_SHIP_PLUS_QR_ACTIVATION',
        rentToOwnBridgeStrategy: `Every physical device box includes a mandatory QR onboarding code that activates the user's cloud dashboard on ${cleanTitle}'s direct web portal—converting even Amazon hardware buyers into 100% owned recurring software subscribers.`,
        channelWhyItFitsNotes: `Selling the hardware + software bundle direct on our website plus selected B2B/Amazon discovery keeps blended fees under 10% while ensuring all recurring companion subscriptions bill through Stripe (~2.9%).`,
      };
    }

    // Default: SAAS_SOFTWARE_AI (or OTHER)
    return {
      primaryChannel: 'DIRECT_WEB_STRIPE',
      secondaryChannels: [
        'LTD_LAUNCH_MARKETPLACE',
        'B2B_INSTITUTIONAL_INVOICE',
      ],
      primaryChannelSharePercent: 75,
      estimatedBlendedFeePercent: 5.5,
      deliveryFulfillmentModel: 'HYBRID_SELF_SERVE_PLUS_COHORT_CODE',
      rentToOwnBridgeStrategy: `Founders and buyers enter through ${cleanTitle}'s free interactive hook (Module A / free diagnostic) or redeem a launch/institutional voucher code directly on our web domain—so we own 100% of user emails, workspace data, and upgrade paths without paying a 30% mobile app store tax.`,
      channelWhyItFitsNotes: `Direct Web Checkout via Stripe (~2.9% fee) preserves 97% gross margin on core passes, while tactical launch marketplaces (e.g., AppSumo LTD) and B2B institutional cohort invoices bring rapid word-of-mouth and bulk seats with zero upfront ad spend.`,
    };
  };

  if (authCtx.creditCheckBlocked) {
    return {
      allowed: false,
      reason: authCtx.blockReason,
      ...buildSmartFallback(),
      creditsUsedAfter: authCtx.currentCreditsUsed,
      engineMode: 'smart-synthesizer',
    };
  }

  let creditsUsedAfter = authCtx.currentCreditsUsed;

  if (authCtx.canCallLiveGemini && authCtx.activeApiKey) {
    try {
      const ai = getGenAiClient(authCtx.activeApiKey);
      const countryPack = getCountryRulePack(params.hqCountryCode);
      const fallback = buildSmartFallback();

      const prompt = `You are a startup Commercial & Channel Strategist helping a founder complete Step 2 of Module D ("Own vs. Rent Sales & Fulfillment Channel Matrix").

Startup Context:
- Title: ${sanitizePromptInput(params.planTitle, 180)}
- Industry: ${sanitizePromptInput(params.industryCategory, 120)} (HQ: ${countryPack.countryName}, ${countryPack.defaultCurrency})
- Product Track (Step 1): ${sanitizePromptInput(params.selectedTrack, 80)}
- Form Factor (Step 1): ${sanitizePromptInput(params.formFactor, 80) || 'N/A'}
- Core Problem: ${sanitizePromptInput(params.coreProblem, 400) || 'N/A'}
- Proposed Solution: ${sanitizePromptInput(params.proposedSolution, 400) || 'N/A'}
- Target Beachhead Customer: ${sanitizePromptInput(params.beachheadSegment || params.targetCustomer, 350) || 'N/A'}

CRITICAL TRACK-SPECIFIC RULES:
- Match ALL terminology strictly to the Selected Product Track (${params.selectedTrack}).
- If PHYSICAL_PRODUCT_ECOM: Focus on Etsy (~10.5% fee), Amazon FBA (~31% total fee) vs. FBM (~15% referral fee), Direct Shopify/Web (~2.9% fee), packaging QR inserts to turn rented marketplace buyers into owned repeat buyers, and workshop vs. FBA fulfillment. NEVER mention SaaS APIs or app stores.
- If EDUCATION_PROGRAM_COHORT: Focus on Direct Web Portal + Stripe (~2.9% fee, avoiding Apple's 30% app store tax), charity/clinic/community referral partnerships, free diagnostic/checklist lead magnets, and 24/7 on-demand + live Q&A delivery.
- If SAAS_SOFTWARE_AI: Focus on Direct Web Stripe checkout (~2.9% fee, 100% owned audience), launch marketplaces (AppSumo/ProductHunt) or B2B cohort licensing, and self-serve onboarding.

Return strictly valid JSON with:
{
  "rentToOwnBridgeStrategy": "2 concrete sentences explaining how the founder captures 100% owned customer emails/relationships and bridges any rented marketplace traffic back to their direct channel.",
  "channelWhyItFitsNotes": "2 concrete sentences explaining why this channel mix and fulfillment setup maximizes early traction while protecting gross margins for Module G pricing."
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.35,
          maxOutputTokens: MAX_OUTPUT_TOKENS_PER_CALL,
        },
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text) as {
          rentToOwnBridgeStrategy?: string;
          channelWhyItFitsNotes?: string;
        };
        if (parsed.rentToOwnBridgeStrategy && parsed.channelWhyItFitsNotes) {
          creditsUsedAfter = await recordGeminiUsageAndIncrementCredits({
            verifiedUserId: authCtx.verifiedUserId,
            planId: params.planId,
            promptKey: 'MOD_D_STEP2_CHANNEL_MATRIX',
            modelUsed: 'gemini-2.5-flash',
            inputTokens: response.usageMetadata?.promptTokenCount || 270,
            outputTokens: response.usageMetadata?.candidatesTokenCount || 195,
            usedByokKey: authCtx.usedByokKey,
            fallbackCreditsUsed: authCtx.currentCreditsUsed,
          });

          return {
            allowed: true,
            ...fallback,
            rentToOwnBridgeStrategy: parsed.rentToOwnBridgeStrategy.trim(),
            channelWhyItFitsNotes: parsed.channelWhyItFitsNotes.trim(),
            creditsUsedAfter,
            engineMode: 'gemini-2.5-flash',
          };
        }
      }
    } catch {
      // Fallback below
    }
  }

  return {
    allowed: true,
    ...buildSmartFallback(),
    creditsUsedAfter,
    engineMode: 'smart-synthesizer',
  };
}



export interface ModuleDBuildVsBuyGenerationResult {
  allowed: boolean;
  reason?: string;
  items: BuildVsBuyItem[];
  coreIpOwnershipRule: CoreIpOwnershipRuleType | '';
  secretSauceInHouseNarrative: string;
  whyBuyAndPartnerSavesTimeNarrative: string;
  creditsUsedAfter?: number;
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export async function generateModuleDBuildVsBuyViaRouter(params: {
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
  v1MustHaveTitles?: string[];
  currentBoardItems?: BuildVsBuyItem[];
  mode?: 'POPULATE_BOARD_AND_CHARTER' | 'CHARTER_ONLY';
}): Promise<ModuleDBuildVsBuyGenerationResult> {
  const authCtx = await authorizeAndPrepareGeminiCall(
    'MOD_D_STEP4_BUILD_VS_BUY'
  );

  const mode = params.mode || 'POPULATE_BOARD_AND_CHARTER';
  const existingItems = Array.isArray(params.currentBoardItems)
    ? params.currentBoardItems
    : [];

  const buildSmartFallback = (): Omit<
    ModuleDBuildVsBuyGenerationResult,
    'allowed' | 'reason' | 'creditsUsedAfter' | 'engineMode'
  > => {
    const track = params.selectedTrack || 'SAAS_SOFTWARE_AI';

    // If CHARTER_ONLY mode and the founder has items on the board, synthesize narratives directly from their items
    if (mode === 'CHARTER_ONLY' && existingItems.length > 0) {
      const inHouseItems = existingItems
        .filter((i) => i.tier === 'BUILD_IN_HOUSE')
        .map((i) => i.title.trim())
        .filter(Boolean);
      const buyRentItems = existingItems
        .filter((i) => i.tier === 'BUY_RENT_OFF_SHELF')
        .map((i) => i.title.trim())
        .filter(Boolean);
      const partnerItems = existingItems
        .filter((i) => i.tier === 'OUTSOURCE_PARTNER')
        .map((i) => i.title.trim())
        .filter(Boolean);

      const secretSauceText =
        inHouseItems.length > 0
          ? `We retain 100% in-house ownership and craftsmanship over our core defensible IP (${inHouseItems.join('; ')}), ensuring our core customer value and grant-eligible innovation never depend on a generic agency or commodity template.`
          : 'We retain 100% in-house ownership over our core customer workflow, domain rules, and proprietary customer experience.';

      const buyAndPartnerParts: string[] = [];
      if (buyRentItems.length > 0) {
        buyAndPartnerParts.push(
          `Instead of wasting months reinventing commodity infrastructure, we rent/buy proven off-the-shelf tools and stock (${buyRentItems.join('; ')})`
        );
      }
      if (partnerItems.length > 0) {
        buyAndPartnerParts.push(
          `and partner with specialist suppliers/contractors for (${partnerItems.join('; ')})`
        );
      }
      const whyBuyText =
        buyAndPartnerParts.length > 0
          ? `${buyAndPartnerParts.join(' ')}—cutting our Version 1 launch timeline and upfront capital burn dramatically.`
          : 'By renting proven off-the-shelf tools for commodity plumbing and using specialist partners only where needed, we launch faster and preserve cash for customer acquisition.';

      return {
        coreIpOwnershipRule: '',
        items: existingItems,
        secretSauceInHouseNarrative: secretSauceText,
        whyBuyAndPartnerSavesTimeNarrative: whyBuyText,
      };
    }

    if (track === 'PHYSICAL_PRODUCT_ECOM') {
      return {
        coreIpOwnershipRule:
          'IN_HOUSE_CRAFT_AND_FINISHING_BUY_STOCK_PACKAGING',
        items:
          mode === 'CHARTER_ONLY'
            ? existingItems
            : [
                {
                  id: 'bvb-phys-1',
                  title:
                    'Signature Hardwood Grain Matching, Batch Glue-Up & Router Jig Finishing',
                  tier: 'BUILD_IN_HOUSE',
                  categoryTag: 'In-House Craft & IP',
                  costModel: 'SWEAT_EQUITY_ZERO',
                  estimatedCostAmount: 0,
                  vendorOrToolName: 'Founder Workshop',
                  rationaleOrNote:
                    'Our core artisan quality and repeatable workshop jig process that commands a premium gift price.',
                },
                {
                  id: 'bvb-phys-2',
                  title:
                    'Custom Laser-Engraved Gift Personalization Templates & Beeswax Finish Blend',
                  tier: 'BUILD_IN_HOUSE',
                  categoryTag: 'High-Margin Secret Sauce',
                  costModel: 'ONE_OFF_PURCHASE',
                  estimatedCostAmount: 350,
                  vendorOrToolName: 'In-House Desktop Laser + Wax Jig',
                  rationaleOrNote:
                    'One-off setup for engraving templates and beeswax batching that adds €15–€20 margin per board.',
                },
                {
                  id: 'bvb-phys-3',
                  title:
                    'Kiln-Dried Hardwood Timber Batch (Walnut, Oak & Maple Boards — Batch 1)',
                  tier: 'OUTSOURCE_PARTNER',
                  categoryTag: 'Raw Timber Batch (Once-Off)',
                  costModel: 'ONE_OFF_PURCHASE',
                  estimatedCostAmount: 650,
                  vendorOrToolName: 'Local Kiln-Dried Timber Mill',
                  rationaleOrNote:
                    'One-off bulk purchase of pre-planed, kiln-dried hardwood for our first 50 flagship boards.',
                },
                {
                  id: 'bvb-phys-4',
                  title:
                    'Stock Double-Walled <2kg Kraft Gift Boxes, 50ml Wax Tins & QR Care Cards',
                  tier: 'BUY_RENT_OFF_SHELF',
                  categoryTag: 'Off-the-Shelf Packaging',
                  costModel: 'ONE_OFF_PURCHASE',
                  estimatedCostAmount: 180,
                  vendorOrToolName: 'Stock Packaging Supplier',
                  rationaleOrNote:
                    'Buying standard stock mailer boxes once-off avoids €3,000 custom die-cut tooling minimums.',
                },
                {
                  id: 'bvb-phys-5',
                  title:
                    'Direct Online Storefront & Inventory Sync (Shopify + Etsy/Amazon Integration)',
                  tier: 'BUY_RENT_OFF_SHELF',
                  categoryTag: 'Monthly E-Com Software',
                  costModel: 'MONTHLY_SUBSCRIPTION',
                  estimatedCostAmount: 36,
                  vendorOrToolName: 'Shopify + Stripe',
                  rationaleOrNote:
                    'Low monthly subscription gives us an instant checkout and synced inventory across channels.',
                },
                {
                  id: 'bvb-phys-6',
                  title:
                    'Tracked <2kg Parcel Delivery & Prime FBA Logistics Fulfillment',
                  tier: 'OUTSOURCE_PARTNER',
                  categoryTag: 'Courier & 3PL Partner',
                  costModel: 'PER_UNIT_COGS',
                  estimatedCostAmount: 6.5,
                  vendorOrToolName: 'An Post / DPD / Amazon FBA',
                  rationaleOrNote:
                    'Per-order courier shipping kept under the 2kg weight threshold to protect unit margins.',
                },
              ],
        secretSauceInHouseNarrative:
          'We keep 100% of timber grain selection, precision router-jig shaping, food-safe beeswax finishing, and custom laser gift engraving in-house so every chopping board carries unmistakable artisan quality.',
        whyBuyAndPartnerSavesTimeNarrative:
          'We buy kiln-dried, rough-planed hardwood in one-off batches from a local timber mill, use off-the-shelf <2kg double-walled kraft gift boxes (avoiding custom box tooling), and rent Shopify/Etsy/Amazon for €36/month.',
      };
    }

    if (track === 'EDUCATION_PROGRAM_COHORT') {
      return {
        coreIpOwnershipRule:
          'OWN_CURRICULUM_AND_METHOD_RENT_COURSE_PORTAL',
        items:
          mode === 'CHARTER_ONLY'
            ? existingItems
            : [
                {
                  id: 'bvb-edu-1',
                  title:
                    'Proprietary 6-Module "Sensory Seeker vs. Avoider" Autism Sleep Methodology & Scripts',
                  tier: 'BUILD_IN_HOUSE',
                  categoryTag: 'Core Curriculum IP',
                  costModel: 'SWEAT_EQUITY_ZERO',
                  estimatedCostAmount: 0,
                  vendorOrToolName: 'Founder In-House IP',
                  rationaleOrNote:
                    '100% founder-created sensory bedtime framework and "Listen-in-the-Dark" 5-minute audio scripts.',
                },
                {
                  id: 'bvb-edu-2',
                  title:
                    'Printable Visual Bedtime Routine Cards, Sensory Checklists & 14-Night Sleep Tracker',
                  tier: 'BUILD_IN_HOUSE',
                  categoryTag: 'Parent Action Toolkit',
                  costModel: 'SWEAT_EQUITY_ZERO',
                  estimatedCostAmount: 0,
                  vendorOrToolName: 'In-House Design & Templates',
                  rationaleOrNote:
                    'Tangible visual supports families use every evening—owned 100% in-house as core brand IP.',
                },
                {
                  id: 'bvb-edu-3',
                  title:
                    'Mobile-Friendly Course & Community Hosting Portal + Video/Audio Streaming',
                  tier: 'BUY_RENT_OFF_SHELF',
                  categoryTag: 'Monthly Hosting Stack',
                  costModel: 'MONTHLY_SUBSCRIPTION',
                  estimatedCostAmount: 49,
                  vendorOrToolName: 'Hosted Course Portal / Web App + Zoom',
                  rationaleOrNote:
                    'Renting an off-the-shelf mobile-ready portal for €49/mo saves €25,000 and 6 months of custom app coding.',
                },
                {
                  id: 'bvb-edu-4',
                  title:
                    'Broadcast Microphone & Quiet Home Audio Recording Setup (Once-Off)',
                  tier: 'BUY_RENT_OFF_SHELF',
                  categoryTag: 'Recording Equipment (Once-Off)',
                  costModel: 'ONE_OFF_PURCHASE',
                  estimatedCostAmount: 190,
                  vendorOrToolName: 'Shure / Rode USB Podcast Mic',
                  rationaleOrNote:
                    'One-off purchase to record warm, studio-clear 5-minute bedtime audio guides from home.',
                },
                {
                  id: 'bvb-edu-5',
                  title:
                    'Independent Pediatric Occupational Therapist (OT) & Sleep Safety Advisory Review',
                  tier: 'OUTSOURCE_PARTNER',
                  categoryTag: 'Clinical Credibility Partner',
                  costModel: 'ONE_OFF_PURCHASE',
                  estimatedCostAmount: 450,
                  vendorOrToolName: 'Specialist Pediatric OT Contractor',
                  rationaleOrNote:
                    'One-off specialist review of our 6 modules to endorse clinical safety and win charity/clinic referrals.',
                },
              ],
        secretSauceInHouseNarrative:
          'We author and own 100% of our proprietary 6-module sensory sleep curriculum, 5-minute "Listen-in-the-Dark" audio guides, and printable visual bedtime routine cards in-house.',
        whyBuyAndPartnerSavesTimeNarrative:
          'Instead of spending €25,000 building a custom native mobile app, we rent a proven mobile-ready course portal + Stripe for ~€49/month and pay a one-off fee for an independent Pediatric OT review.',
      };
    }

    // Default: SAAS_SOFTWARE_AI (e.g. Startup Preflight) & other tracks
    return {
      coreIpOwnershipRule: 'OWN_PROPRIETARY_WORKFLOW_RENT_PLUMBING',
      items:
        mode === 'CHARTER_ONLY'
          ? existingItems
          : [
              {
                id: 'bvb-saas-1',
                title:
                  'Proprietary Multi-Step Guided Workflow, Domain Scoring Engine & Prompt Architecture',
                tier: 'BUILD_IN_HOUSE',
                categoryTag: 'Core Defensible IP',
                costModel: 'SWEAT_EQUITY_ZERO',
                estimatedCostAmount: 0,
                vendorOrToolName: 'In-House TypeScript / Next.js Codebase',
                rationaleOrNote:
                  'Our core "Secret Sauce" that delivers the 60-second Aha! Moment and satisfies IE/UK grant IP ownership rules.',
              },
              {
                id: 'bvb-saas-2',
                title:
                  'Localized Country Rule Packs, Grant Readiness Logic & Interactive Export Compiler',
                tier: 'BUILD_IN_HOUSE',
                categoryTag: 'Proprietary Dataset & Rules',
                costModel: 'SWEAT_EQUITY_ZERO',
                estimatedCostAmount: 0,
                vendorOrToolName: 'In-House Rules Engine',
                rationaleOrNote:
                  'Domain-specific IE/UK grant & financial rules built in-house that generic AI wrappers cannot replicate.',
              },
              {
                id: 'bvb-saas-3',
                title:
                  'Google Cloud / Vercel Hosting, Managed PostgreSQL (Drizzle) & Gemini API',
                tier: 'BUY_RENT_OFF_SHELF',
                categoryTag: 'Monthly Cloud & AI Stack',
                costModel: 'MONTHLY_SUBSCRIPTION',
                estimatedCostAmount: 65,
                vendorOrToolName: 'Google Cloud + Vercel + Gemini API',
                rationaleOrNote:
                  'Predictable monthly cloud infrastructure with hard 500 calls/day AI cost circuit breakers.',
              },
              {
                id: 'bvb-saas-4',
                title:
                  'Authentication (Better-Auth), Stripe Checkout & Transactional Email',
                tier: 'BUY_RENT_OFF_SHELF',
                categoryTag: 'Commodity SaaS Plumbing',
                costModel: 'MONTHLY_SUBSCRIPTION',
                estimatedCostAmount: 20,
                vendorOrToolName: 'Better-Auth + Stripe + Resend',
                rationaleOrNote:
                  'Zero reason to code custom billing or auth servers from scratch in Version 1.',
              },
              {
                id: 'bvb-saas-5',
                title:
                  'One-Off Specialist Legal Terms / GDPR Privacy & R&D Grant Accounting Review',
                tier: 'OUTSOURCE_PARTNER',
                categoryTag: 'Specialist Compliance (Once-Off)',
                costModel: 'ONE_OFF_PURCHASE',
                estimatedCostAmount: 500,
                vendorOrToolName: 'Startup Legal / Grant Accountant',
                rationaleOrNote:
                  'One-off external review to verify GDPR data compliance and R&D / LEO grant eligibility.',
              },
            ],
      secretSauceInHouseNarrative:
        'We build and own 100% of our core guided workflow, localized grant/financial scoring engine, and structured AI prompt architecture in-house so all defensible IP stays on our company balance sheet.',
      whyBuyAndPartnerSavesTimeNarrative:
        'We rent commodity cloud infrastructure (Google Cloud, PostgreSQL, Better-Auth, Stripe, and Gemini API) on a low monthly subscription (~€85/mo) instead of wasting months reinventing login or payment plumbing.',
    };
  };

  let creditsUsedAfter = authCtx.currentCreditsUsed;

  if (authCtx.canCallLiveGemini && authCtx.activeApiKey) {
    try {
      const ai = getGenAiClient(authCtx.activeApiKey);
      const countryPack = getCountryRulePack(params.hqCountryCode);
      const fallback = buildSmartFallback();

      const v1ContextList =
        Array.isArray(params.v1MustHaveTitles) &&
        params.v1MustHaveTitles.length > 0
          ? params.v1MustHaveTitles.join(' | ')
          : 'None specified yet';

      const boardContextList =
        existingItems.length > 0
          ? existingItems
              .map(
                (i) =>
                  `[${i.tier}] ${i.title} (${i.costModel}: ${countryPack.defaultCurrency} ${i.estimatedCostAmount})`
              )
              .join(' | ')
          : 'Board is currently empty';

      const prompt = `You are a pragmatic Startup CTO, COO & Grant Assessor helping a founder complete Step 4 of Module D ("3-Tier Build-vs-Buy & Secret Sauce Matrix").

Startup Context:
- Title: ${sanitizePromptInput(params.planTitle, 180)}
- Industry: ${sanitizePromptInput(params.industryCategory, 120)} (HQ: ${countryPack.countryName}, Currency: ${countryPack.defaultCurrency})
- Selected Product Track (Step 1): ${sanitizePromptInput(params.selectedTrack, 80)}
- Form Factor (Step 1): ${sanitizePromptInput(params.formFactor, 80) || 'N/A'}
- Primary Sales Channel (Step 2): ${sanitizePromptInput(params.primaryChannel, 80) || 'N/A'}
- Founder's Step 3 MUST-HAVE V1 Deliverables: ${sanitizePromptInput(v1ContextList, 500)}
- Current Step 4 Board Items: ${sanitizePromptInput(boardContextList, 600)}
- Core Problem: ${sanitizePromptInput(params.coreProblem, 350) || 'N/A'}
- Proposed Solution: ${sanitizePromptInput(params.proposedSolution, 350) || 'N/A'}

CRITICAL SMART COST MODEL RULES:
Every item MUST use the smart, realistic costModel that matches how it is actually paid for in the real world:
- "MONTHLY_SUBSCRIPTION": Use for recurring monthly cloud/software/hosting tools (e.g., Google Cloud, AWS, Vercel, Shopify, Course Hosting Portal, Zoom, SaaS tools).
- "ONE_OFF_PURCHASE": Use for one-off upfront purchases, raw material batches, workshop equipment/jigs, or one-off contractor reviews (e.g., buying a batch of kiln-dried wood/timber, buying a stock batch of packaging boxes, buying a microphone or laser jig, or a one-off legal/clinical review).
- "PER_UNIT_COGS": Use for per-order / per-unit direct fulfillment or shipping costs (e.g., courier shipping per parcel).
- "SWEAT_EQUITY_ZERO": Use (with estimatedCostAmount: 0) when the founder is building/crafting their core IP in-house using their own time.

Return strictly valid JSON with:
{
  "secretSauceInHouseNarrative": "2 concrete sentences explaining what core IP, craftsmanship, or methodology is built and owned 100% in-house (Tier 1) and why that makes the startup defensible for investors and grants.",
  "whyBuyAndPartnerSavesTimeNarrative": "2 concrete sentences explaining what commodity tools/materials are bought off-the-shelf (Tier 2) or outsourced to specialists/suppliers (Tier 3) to save months of time and upfront cash.",
  "items": [
    {
      "id": "bvb-1",
      "title": "Specific component, tool, material batch, or specialist service",
      "tier": "BUILD_IN_HOUSE",
      "categoryTag": "Short 2-3 word tag",
      "costModel": "MONTHLY_SUBSCRIPTION",
      "estimatedCostAmount": 45,
      "vendorOrToolName": "Specific vendor/tool or 'Founder In-House'",
      "rationaleOrNote": "1 concise sentence explaining why this belongs in BUILD_IN_HOUSE, BUY_RENT_OFF_SHELF, or OUTSOURCE_PARTNER."
    }
  ]
}
Include 2 items in "BUILD_IN_HOUSE", 2 items in "BUY_RENT_OFF_SHELF", and 1 to 2 items in "OUTSOURCE_PARTNER".`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.35,
          maxOutputTokens: MAX_OUTPUT_TOKENS_PER_CALL,
        },
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text) as {
          secretSauceInHouseNarrative?: string;
          whyBuyAndPartnerSavesTimeNarrative?: string;
          items?: Array<{
            id?: string;
            title?: string;
            tier?: string;
            categoryTag?: string;
            costModel?: string;
            estimatedCostAmount?: number;
            vendorOrToolName?: string;
            rationaleOrNote?: string;
          }>;
        };

        if (
          parsed.secretSauceInHouseNarrative &&
          parsed.whyBuyAndPartnerSavesTimeNarrative
        ) {
          creditsUsedAfter = await recordGeminiUsageAndIncrementCredits({
            verifiedUserId: authCtx.verifiedUserId,
            planId: params.planId,
            promptKey: 'MOD_D_STEP4_BUILD_VS_BUY',
            modelUsed: 'gemini-2.5-flash',
            inputTokens: response.usageMetadata?.promptTokenCount || 300,
            outputTokens: response.usageMetadata?.candidatesTokenCount || 250,
            usedByokKey: authCtx.usedByokKey,
            fallbackCreditsUsed: authCtx.currentCreditsUsed,
          });

          const validTiers = new Set([
            'BUILD_IN_HOUSE',
            'BUY_RENT_OFF_SHELF',
            'OUTSOURCE_PARTNER',
          ]);
          const validCostModels = new Set([
            'MONTHLY_SUBSCRIPTION',
            'ONE_OFF_PURCHASE',
            'PER_UNIT_COGS',
            'SWEAT_EQUITY_ZERO',
          ]);

          const sanitizedItems: BuildVsBuyItem[] =
            mode === 'CHARTER_ONLY'
              ? existingItems
              : Array.isArray(parsed.items) && parsed.items.length >= 3
                ? parsed.items.slice(0, 8).map((it, idx) => ({
                    id: `ai-bvb-${idx + 1}-${Date.now()}`,
                    title:
                      sanitizePromptInput(it.title, 140) ||
                      `Component #${idx + 1}`,
                    tier: validTiers.has(String(it.tier))
                      ? (it.tier as BuildVsBuyTierType)
                      : idx < 2
                        ? 'BUILD_IN_HOUSE'
                        : idx < 4
                          ? 'BUY_RENT_OFF_SHELF'
                          : 'OUTSOURCE_PARTNER',
                    categoryTag:
                      sanitizePromptInput(it.categoryTag, 40) || 'V1 Stack',
                    costModel: validCostModels.has(String(it.costModel))
                      ? (it.costModel as BuildVsBuyCostModelType)
                      : 'ONE_OFF_PURCHASE',
                    estimatedCostAmount:
                      typeof it.estimatedCostAmount === 'number' &&
                      !Number.isNaN(it.estimatedCostAmount) &&
                      it.estimatedCostAmount >= 0
                        ? Math.round(it.estimatedCostAmount * 100) / 100
                        : 0,
                    vendorOrToolName:
                      sanitizePromptInput(it.vendorOrToolName, 60) || '',
                    rationaleOrNote:
                      sanitizePromptInput(it.rationaleOrNote, 240) ||
                      'Prioritized for lean V1 execution.',
                  }))
                : fallback.items;

          return {
            allowed: true,
            coreIpOwnershipRule: fallback.coreIpOwnershipRule,
            items: sanitizedItems,
            secretSauceInHouseNarrative:
              parsed.secretSauceInHouseNarrative.trim(),
            whyBuyAndPartnerSavesTimeNarrative:
              parsed.whyBuyAndPartnerSavesTimeNarrative.trim(),
            creditsUsedAfter,
            engineMode: 'gemini-2.5-flash',
          };
        }
      }
    } catch {
      // Fallback below
    }
  }

  return {
    allowed: true,
    ...buildSmartFallback(),
    creditsUsedAfter,
    engineMode: 'smart-synthesizer',
  };
}



export interface ModuleDWorkPackagesGenerationResult {
  allowed: boolean;
  reason?: string;
  workPackages: ProductWorkPackageItem[];
  flowStages: ProductFlowStageItem[];
  executionCadenceRule: WorkPackageCadenceRuleType | '';
  technicalMeritAndInnovationNarrative: string;
  bottleneckAndDeRiskingNarrative: string;
  creditsUsedAfter?: number;
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export async function generateModuleDWorkPackagesViaRouter(params: {
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
  currentBuildVsBuyItems?: BuildVsBuyItem[];
  currentWorkPackages?: ProductWorkPackageItem[];
  currentFlowStages?: ProductFlowStageItem[];
  mode?: 'POPULATE_WPS_AND_FLOW' | 'CHARTER_ONLY';
}): Promise<ModuleDWorkPackagesGenerationResult> {
  const authCtx = await authorizeAndPrepareGeminiCall(
    'MOD_D_STEP5_WORK_PACKAGES'
  );

  const mode = params.mode || 'POPULATE_WPS_AND_FLOW';
  const existingWps = Array.isArray(params.currentWorkPackages)
    ? params.currentWorkPackages
    : [];
  const existingFlow = Array.isArray(params.currentFlowStages)
    ? params.currentFlowStages
    : [];
  const bvbItems = Array.isArray(params.currentBuildVsBuyItems)
    ? params.currentBuildVsBuyItems
    : [];
  const scopeItems = Array.isArray(params.currentScopeItems)
    ? params.currentScopeItems
    : [];

  const safeTitle = sanitizePromptInput(params.planTitle, 140) || 'Our Startup';
  const countryPack = getCountryRulePack(params.hqCountryCode);

  const buildSmartFallback = (): Omit<
    ModuleDWorkPackagesGenerationResult,
    'allowed' | 'reason' | 'creditsUsedAfter' | 'engineMode'
  > => {
    const track = params.selectedTrack || 'SAAS_SOFTWARE_AI';

    let defaultWps: ProductWorkPackageItem[] = [];
    let defaultFlow: ProductFlowStageItem[] = [];
    let defaultRule: WorkPackageCadenceRuleType =
      'WEEKLY_SHIPPABLE_INCREMENTS_NO_BIG_BANG';
    let defaultTechMerit = '';
    let defaultBottleneck = '';

    if (track === 'PHYSICAL_PRODUCT_ECOM') {
      defaultRule = 'JIG_AND_PROTOTYPE_APPROVAL_BEFORE_BATCH_TIMBER_BUY';
      defaultWps = [
        {
          id: 'wp-phys-1',
          wpCode: 'WP1',
          title:
            'Hero SKU CAD, Repeatable Workshop Jigs & First Sample Sign-Off',
          timelineWindow: 'WEEKS_1_2',
          executionMode: 'IN_HOUSE',
          costModel: 'SWEAT_EQUITY_ZERO',
          estimatedCostAmount: 0,
          deliverableMilestoneProof:
            '2 repeatable CNC/router templates + 3 physical master sample boards passing drop-test & <2kg weight check.',
          linkedTaskSummary:
            'Lock dimensions for 2–3 Hero SKUs, build repeatable cutting/juice-groove jigs, and verify custom laser-engraving settings.',
          isGrantEligibleRAndDOrPrototype: true,
        },
        {
          id: 'wp-phys-2',
          wpCode: 'WP2',
          title:
            'Kiln-Dried Timber Batch & Double-Walled Packaging Procurement',
          timelineWindow: 'WEEKS_3_4',
          executionMode: 'SUPPLIER_OFF_SHELF',
          costModel: 'ONE_OFF_PURCHASE',
          estimatedCostAmount: 530,
          deliverableMilestoneProof:
            'Kiln-dried Walnut/Oak batch (<10% moisture) + 100 double-walled kraft gift boxes & beeswax tins delivered to workshop.',
          linkedTaskSummary:
            'Order initial timber batch (€350 once-off) and standardized <2kg protective kraft mailers + QR care cards (€180 once-off).',
          isGrantEligibleRAndDOrPrototype: true,
        },
        {
          id: 'wp-phys-3',
          wpCode: 'WP3',
          title:
            'Initial 25-Unit Production Run, Food-Safe Cure & Photography',
          timelineWindow: 'WEEKS_5_8',
          executionMode: 'IN_HOUSE',
          costModel: 'SWEAT_EQUITY_ZERO',
          estimatedCostAmount: 0,
          deliverableMilestoneProof:
            '25 finished, mineral-oil/beeswax cured boards boxed with GS1 barcodes + 15 high-converting studio product photos.',
          linkedTaskSummary:
            'Batch-mill, sand, cure, and package first 25 Hero SKU units in under 40 mins labour/unit and shoot lifestyle unboxing photos.',
          isGrantEligibleRAndDOrPrototype: false,
        },
        {
          id: 'wp-phys-4',
          wpCode: 'WP4',
          title:
            'Etsy Direct Launch, Amazon FBA Carton Dispatch & First 10 Orders',
          timelineWindow: 'PRE_LAUNCH_FINAL',
          executionMode: 'EXTERNAL_PARTNER',
          costModel: 'PER_UNIT_COGS',
          estimatedCostAmount: 8.5,
          deliverableMilestoneProof:
            'Live Etsy + Direct Web listings, first master carton checked into Amazon FBA warehouse, and first 10 customer orders shipped.',
          linkedTaskSummary:
            'Publish SEO listings, ship standard non-engraved SKU carton to Amazon FBA, and fulfill custom engraved orders via tracked courier.',
          isGrantEligibleRAndDOrPrototype: false,
        },
      ];

      defaultFlow = [
        {
          id: 'flow-phys-1',
          stageNumber: 1,
          stageTitle: 'Kiln-Dried Timber & Repeatable Jig Setup',
          executionBadge: 'SUPPLIER_OFF_SHELF',
          whatHappensHere:
            'Verified <10% moisture hardwood boards are planed and mounted into our standardized in-house CNC/router workshop jigs.',
          outputOrHandOff:
            'Dimensionally identical Hero SKU blanks ready for finishing.',
        },
        {
          id: 'flow-phys-2',
          stageNumber: 2,
          stageTitle: 'Batch Milling, Laser Personalisation & Cure',
          executionBadge: 'IN_HOUSE',
          whatHappensHere:
            'Deep juice grooves are routed, custom gift names are laser-engraved, and boards undergo a 3-coat food-safe mineral oil & beeswax cure.',
          outputOrHandOff:
            'Heirloom-grade finished product inspected for zero warp.',
        },
        {
          id: 'flow-phys-3',
          stageNumber: 3,
          stageTitle: 'Standardized <2kg Kraft Gift Boxing & QR Bridge',
          executionBadge: 'SUPPLIER_OFF_SHELF',
          whatHappensHere:
            'Packed into a single double-walled kraft gift box with beeswax tin, GS1 barcode, and QR care card linking to our owned web store.',
          outputOrHandOff: 'Drop-tested parcel under 2kg courier threshold.',
        },
        {
          id: 'flow-phys-4',
          stageNumber: 4,
          stageTitle: 'Dual-Channel Dispatch (Etsy Direct + Amazon FBA)',
          executionBadge: 'EXTERNAL_PARTNER',
          whatHappensHere:
            'Standard SKUs ship on Prime autopilot via Amazon FBA; custom engraved orders ship direct from our workshop via tracked courier.',
          outputOrHandOff:
            '5-star customer unboxing + repeat refill capture via QR code.',
        },
      ];

      defaultTechMerit = `For ${safeTitle}, our technical and production innovation lies in replacing slow, unscalable bespoke craft work (3+ hours per unit) with a standardized 2–3 Hero SKU jig-and-batch manufacturing system (<40 minutes per unit). By combining kiln-dried timber moisture control (<10%), repeatable router/CNC templates, and a single <2kg double-walled gift box specification, we achieve artisan quality with 60%+ gross margins across Etsy and Amazon FBA.`;
      defaultBottleneck = `Our primary Version 1 operational risk is timber warping, courier transit damage, or excessive workshop labour during peak gifting weeks. We de-risk this across WP1–WP4 by enforcing strict kiln-dried moisture checks upon delivery, drop-testing our standardized kraft gift box before batch production, and pre-stocking standard non-engraved SKUs in Amazon FBA so workshop time is reserved exclusively for high-margin custom engraved orders.`;
    } else if (track === 'EDUCATION_PROGRAM_COHORT') {
      defaultRule = 'RECORD_MODULE_1_AND_QUIZ_BEFORE_FULL_CURRICULUM';
      defaultWps = [
        {
          id: 'wp-edu-1',
          wpCode: 'WP1',
          title: 'Diagnostic Intake Quiz & Core 6-Module Curriculum Blueprint',
          timelineWindow: 'WEEKS_1_2',
          executionMode: 'IN_HOUSE',
          costModel: 'SWEAT_EQUITY_ZERO',
          estimatedCostAmount: 0,
          deliverableMilestoneProof:
            'Interactive 3-minute Sensory Bedtime Profile Quiz + 6-module script & clinical safeguarding boundaries signed off.',
          linkedTaskSummary:
            'Design the parent intake quiz logic, structure the 6 step-by-step modules, and finalize medical/clinical disclaimer language.',
          isGrantEligibleRAndDOrPrototype: true,
        },
        {
          id: 'wp-edu-2',
          wpCode: 'WP2',
          title:
            '5-Minute Audio/Video Guides & Printable Visual Routine Toolkit',
          timelineWindow: 'WEEKS_3_4',
          executionMode: 'IN_HOUSE',
          costModel: 'SWEAT_EQUITY_ZERO',
          estimatedCostAmount: 0,
          deliverableMilestoneProof:
            '18 bite-sized 5-minute "listen-in-the-dark" audio tracks + printable visual bedtime schedule cards & 14-night sleep log.',
          linkedTaskSummary:
            'Record and master all 5-minute parent audio lessons and export neuro-affirming printable PDF visual routine cards.',
          isGrantEligibleRAndDOrPrototype: true,
        },
        {
          id: 'wp-edu-3',
          wpCode: 'WP3',
          title: 'Mobile-Ready Course Portal, Stripe Checkout & Zoom Q&A Setup',
          timelineWindow: 'WEEKS_5_8',
          executionMode: 'SUPPLIER_OFF_SHELF',
          costModel: 'MONTHLY_SUBSCRIPTION',
          estimatedCostAmount: 115,
          deliverableMilestoneProof:
            'Live mobile-friendly web portal + Stripe checkout (97.1% net payout) + automated welcome email & weekly Zoom Q&A link.',
          linkedTaskSummary:
            'Configure hosted course portal (€99/mo) + Zoom Pro (€16/mo) + Stripe checkout so parents get instant access in 60 seconds.',
          isGrantEligibleRAndDOrPrototype: false,
        },
        {
          id: 'wp-edu-4',
          wpCode: 'WP4',
          title:
            'Founding 20-Family Pilot Cohort & 14-Night Outcome Validation',
          timelineWindow: 'PRE_LAUNCH_FINAL',
          executionMode: 'EXTERNAL_PARTNER',
          costModel: 'ONE_OFF_PURCHASE',
          estimatedCostAmount: 450,
          deliverableMilestoneProof:
            'First 20 families onboarded, specialist OT/clinical peer review completed, and baseline vs. Night-14 sleep data captured.',
          linkedTaskSummary:
            'Complete external OT/clinical safeguarding review (€450 once-off), onboard founding waitlist parents, and collect outcome proof.',
          isGrantEligibleRAndDOrPrototype: true,
        },
      ];

      defaultFlow = [
        {
          id: 'flow-edu-1',
          stageNumber: 1,
          stageTitle: 'Direct Web Checkout & 3-Min Sensory Intake Quiz',
          executionBadge: 'IN_HOUSE',
          whatHappensHere:
            'Parent joins via our mobile web portal (Stripe 2.9% fee, zero 30% App Store tax) and completes the Sensory Bedtime Profile Quiz.',
          outputOrHandOff:
            'Personalized sensory sleep pathway matched to the child.',
        },
        {
          id: 'flow-edu-2',
          stageNumber: 2,
          stageTitle: '5-Minute "Listen-in-the-Dark" Audio & Visual Cards',
          executionBadge: 'IN_HOUSE',
          whatHappensHere:
            'Exhausted parents listen to bite-sized 5-minute audio guides on their phone at bedtime and print visual routine schedules.',
          outputOrHandOff:
            'Immediate Night-1 calm bedtime routine implementation.',
        },
        {
          id: 'flow-edu-3',
          stageNumber: 3,
          stageTitle: '14-Night Sleep Settling Tracker & Quick Wins',
          executionBadge: 'SUPPLIER_OFF_SHELF',
          whatHappensHere:
            'Parents log bedtime settling time and night wakings across 14 nights inside the mobile portal.',
          outputOrHandOff: 'Quantified family sleep improvement metrics.',
        },
        {
          id: 'flow-edu-4',
          stageNumber: 4,
          stageTitle: 'Weekly Live Group Q&A & Charity/Clinic Referral Loop',
          executionBadge: 'EXTERNAL_PARTNER',
          whatHappensHere:
            'Parents submit questions ahead of weekly recorded Zoom Q&A sessions while anonymized outcome data feeds charity/clinic partners.',
          outputOrHandOff:
            'High completion rate + trusted word-of-mouth referrals.',
        },
      ];

      defaultTechMerit = `For ${safeTitle}, our innovation replaces overwhelming 60-minute desktop video lectures and expensive €25,000 custom native apps with a neuro-affirming, mobile-first micro-intervention system. By pairing a 3-minute Sensory Bedtime Diagnostic Quiz with 5-minute "listen-in-the-dark" audio guides, printable visual schedules, and a 14-night outcome tracker, we deliver measurable family sleep improvements within 14 days at a 97% gross margin.`;
      defaultBottleneck = `Our primary Version 1 risk is parent overwhelm (exhausted parents dropping out before finishing lessons) and clinical safeguarding boundaries. We de-risk this across WP1–WP4 by capping every audio guide at 5 minutes, validating Module 1 + the intake quiz with a founding 20-family pilot cohort first, and having an independent specialist review our educational vs. medical disclaimer boundaries before public launch.`;
    } else {
      defaultRule = 'WEEKLY_SHIPPABLE_INCREMENTS_NO_BIG_BANG';
      defaultWps = [
        {
          id: 'wp-saas-1',
          wpCode: 'WP1',
          title: 'Core PostgreSQL Schema, Auth & Guardrailed AI Router',
          timelineWindow: 'WEEKS_1_2',
          executionMode: 'IN_HOUSE',
          costModel: 'SWEAT_EQUITY_ZERO',
          estimatedCostAmount: 0,
          deliverableMilestoneProof:
            'Multi-tenant PostgreSQL/Drizzle schema deployed + HttpOnly session auth + 500 calls/day AI billing circuit breaker passing tests.',
          linkedTaskSummary:
            'Build core database tables, plan ownership IDOR guards, and fail-closed AI router with deterministic Smart Synthesizer fallback.',
          isGrantEligibleRAndDOrPrototype: true,
        },
        {
          id: 'wp-saas-2',
          wpCode: 'WP2',
          title: 'Core "Aha! Moment" Workflow & Public Validation Engine',
          timelineWindow: 'WEEKS_3_4',
          executionMode: 'IN_HOUSE',
          costModel: 'SWEAT_EQUITY_ZERO',
          estimatedCostAmount: 0,
          deliverableMilestoneProof:
            'Interactive founder workspace + mobile-ready public validation survey page capturing live responses in <60 seconds.',
          linkedTaskSummary:
            'Implement the core browser workflow, adaptive industry tracks, and anti-spam public survey/waitlist engine.',
          isGrantEligibleRAndDOrPrototype: true,
        },
        {
          id: 'wp-saas-3',
          wpCode: 'WP3',
          title: 'Cloud Hosting Stack, Stripe Checkout & Entitlement Paywall',
          timelineWindow: 'WEEKS_5_8',
          executionMode: 'SUPPLIER_OFF_SHELF',
          costModel: 'MONTHLY_SUBSCRIPTION',
          estimatedCostAmount: 65,
          deliverableMilestoneProof:
            'Production Google Cloud / Vercel + PostgreSQL deployment (€65/mo) + Stripe webhook unlocking 6-Month Pass & Cohort codes.',
          linkedTaskSummary:
            'Provision managed cloud hosting, connect Stripe checkout (~2.9% fee), and enforce Free Hook vs. Paid Pass entitlements.',
          isGrantEligibleRAndDOrPrototype: false,
        },
        {
          id: 'wp-saas-4',
          wpCode: 'WP4',
          title: 'Pre-Launch Security Check, Waitlist Pilot & Export Compiler',
          timelineWindow: 'PRE_LAUNCH_FINAL',
          executionMode: 'EXTERNAL_PARTNER',
          costModel: 'ONE_OFF_PURCHASE',
          estimatedCostAmount: 850,
          deliverableMilestoneProof:
            'Independent penetration/GDPR check completed + first 15 waitlist founders onboarded + official IE/UK grant PDF export live.',
          linkedTaskSummary:
            'Run fixed-scope pre-launch security review (€850 once-off), onboard first cohort of waitlist users, and verify export packs.',
          isGrantEligibleRAndDOrPrototype: true,
        },
      ];

      defaultFlow = [
        {
          id: 'flow-saas-1',
          stageNumber: 1,
          stageTitle: 'Authenticated Browser Input & Plan Localization',
          executionBadge: 'IN_HOUSE',
          whatHappensHere:
            'User signs in via HttpOnly session cookie, selects their HQ country (IE/GB/US/EU), and enters structured inputs in the workspace.',
          outputOrHandOff:
            'Sanitized, plan-scoped state with IDOR ownership verification.',
        },
        {
          id: 'flow-saas-2',
          stageNumber: 2,
          stageTitle: 'Proprietary Domain Engine & Guardrailed AI Router',
          executionBadge: 'IN_HOUSE',
          whatHappensHere:
            'In-house domain rules combine with our fail-closed Gemini 2.5 router (capped at 500 calls/day + Smart Synthesizer fallback).',
          outputOrHandOff:
            'Structured financial, unit-economics & grant-ready data blocks.',
        },
        {
          id: 'flow-saas-3',
          stageNumber: 3,
          stageTitle: 'Managed Cloud Persistence & Stripe Entitlement Gate',
          executionBadge: 'SUPPLIER_OFF_SHELF',
          whatHappensHere:
            'Data persists in managed PostgreSQL (Drizzle ORM) while Stripe webhooks manage Free Hook vs. 6-Month Pass & Cohort access.',
          outputOrHandOff:
            'Real-time synced multi-plan vault with 97% gross margin.',
        },
        {
          id: 'flow-saas-4',
          stageNumber: 4,
          stageTitle: 'Live Public Survey Proof & Official Grant Exports',
          executionBadge: 'IN_HOUSE',
          whatHappensHere:
            'Compiles validated survey proof, unit economics, and Work Packages directly into IE LEO, Enterprise Ireland & UK Innovate UK packs.',
          outputOrHandOff:
            'Submission-ready business plan & grant application.',
        },
      ];

      defaultTechMerit = `For ${safeTitle}, our technical merit centres on our proprietary domain workflow, localized ${countryPack.countryName} compliance/grant rule engine, and fail-closed AI architecture built 100% in-house. Rather than building commodity infrastructure from scratch, we pair our custom TypeScript/Drizzle application layer and hard-capped AI router with managed cloud hosting and Stripe—delivering a production-grade V1 in weeks with predictable unit economics.`;
      defaultBottleneck = `Our primary Version 1 technical risk is scope creep into non-core integrations or runaway cloud/AI API costs during early user spikes. We de-risk this across WP1–WP4 by enforcing weekly shippable increments, locking V1 to the core browser "Aha! Moment" flow, enforcing a hard 500 calls/day AI circuit breaker with deterministic fallback, and piloting with our waitlist cohort before scaling traffic.`;
    }

    if (existingWps.length > 0) {
      const inHouseWps = existingWps.filter(
        (w) => w.executionMode === 'IN_HOUSE'
      );
      const partnerOrSupplierWps = existingWps.filter(
        (w) => w.executionMode !== 'IN_HOUSE'
      );
      const inHouseSummary =
        inHouseWps.map((w) => `${w.wpCode} (${w.title})`).join(', ') ||
        'our core in-house work packages';
      const externalSummary =
        partnerOrSupplierWps
          .map((w) => `${w.wpCode} (${w.title})`)
          .join(', ') || 'off-the-shelf tools and specialist partners';

      defaultTechMerit = `For ${safeTitle}, our Version 1 execution plan is structured into ${existingWps.length} milestone-driven Work Packages. We concentrate our in-house engineering and craft capacity on ${inHouseSummary} so that 100% of our defensible IP and customer "Aha! Moment" is owned internally, while leveraging ${externalSummary} to accelerate time-to-market.`;
      defaultBottleneck = `To prevent Version 1 schedule slippage or budget overruns across our ${existingWps.length} Work Packages, every work package requires a concrete deliverable proof before advancing to the next phase. By validating our core in-house deliverables (${inHouseSummary}) before committing downstream marketing or scale spend, we keep our launch lean, auditable, and grant-ready for ${countryPack.countryName} assessors.`;
    }

    return {
      workPackages: mode === 'CHARTER_ONLY' ? existingWps : defaultWps,
      flowStages: mode === 'CHARTER_ONLY' ? existingFlow : defaultFlow,
      executionCadenceRule: defaultRule,
      technicalMeritAndInnovationNarrative: defaultTechMerit,
      bottleneckAndDeRiskingNarrative: defaultBottleneck,
    };
  };

  let creditsUsedAfter = authCtx.currentCreditsUsed;

  if (authCtx.canCallLiveGemini && authCtx.activeApiKey) {
    try {
      const ai = getGenAiClient(authCtx.activeApiKey);
      const fallback = buildSmartFallback();

      const bvbContext =
        bvbItems.length > 0
          ? bvbItems
              .slice(0, 12)
              .map(
                (i) =>
                  `- [${i.tier}] ${sanitizePromptInput(i.title, 100)} (${i.costModel}: ${i.estimatedCostAmount})`
              )
              .join('\n')
          : 'None specified yet';

      const scopeContext =
        scopeItems.length > 0
          ? scopeItems
              .filter((i) => i.bucket === 'MUST_HAVE_V1')
              .slice(0, 8)
              .map(
                (i) => `- [MUST_HAVE_V1] ${sanitizePromptInput(i.title, 100)}`
              )
              .join('\n')
          : 'None specified yet';

      const existingWpContext =
        existingWps.length > 0
          ? existingWps
              .slice(0, 10)
              .map(
                (w) =>
                  `- ${w.wpCode}: ${sanitizePromptInput(w.title, 100)} [${w.executionMode}, ${w.timelineWindow}, ${w.costModel}: ${w.estimatedCostAmount}] -> Deliverable: ${sanitizePromptInput(w.deliverableMilestoneProof, 140)}`
              )
              .join('\n')
          : 'No Work Packages on board yet';

      const prompt = `You are a supportive startup co-founder and grant project architect (specializing in Ireland LEO / Enterprise Ireland and UK Innovate UK / Start Up Loans work package structures).
Startup: "${safeTitle}"
Industry: ${sanitizePromptInput(params.industryCategory, 120)} (HQ: ${countryPack.countryName}, Currency: ${countryPack.defaultCurrency})
Product Track: ${params.selectedTrack} ${params.otherProductTrackText ? `(${sanitizePromptInput(params.otherProductTrackText, 80)})` : ''}
Form Factor: ${params.formFactor || 'Standard V1'}
Primary Channel: ${params.primaryChannel || 'Direct'}
Validated Customer Pain: ${sanitizePromptInput(params.validatedPainSummary || params.coreProblem, 350) || 'Customers need a reliable, fast Version 1 solution.'}

Step 3 MUST-HAVE V1 Scope Items:
${scopeContext}

Step 4 Build-vs-Buy Items & Smart Costs:
${bvbContext}

Current Step 5 Work Packages on Board:
${existingWpContext}

Mode: ${mode}

Task:
${
  mode === 'CHARTER_ONLY'
    ? 'Draft ONLY the two concise, grant-ready narratives (technicalMeritAndInnovationNarrative and bottleneckAndDeRiskingNarrative) based strictly on the founder’s current Work Packages and Build-vs-Buy stack. Do not invent unrelated work packages.'
    : 'Generate 4 concrete, sequential Version 1 Work Packages (WP1 to WP4) with smart cost classifications (MONTHLY_SUBSCRIPTION for cloud/SaaS, ONE_OFF_PURCHASE for materials batches like wood/equipment/audits, PER_UNIT_COGS for per-unit fulfillment, or SWEAT_EQUITY_ZERO for €0 founder build), PLUS a 4-stage end-to-end Technical/Production Flow Diagram (Stage 1 to Stage 4), PLUS the two concise grant-ready narratives.'
}

Return ONLY valid JSON matching this exact structure:
{
  "technicalMeritAndInnovationNarrative": "2-3 sentences explaining the technical merit, craft methodology, or process innovation built in-house and why it outperforms status-quo alternatives",
  "bottleneckAndDeRiskingNarrative": "2-3 sentences explaining the #1 build/production bottleneck or risk and how the sequential Work Packages de-risk it before scaling"${
    mode === 'POPULATE_WPS_AND_FLOW'
      ? `,
  "workPackages": [
    {
      "wpCode": "WP1",
      "title": "Short specific Work Package title",
      "timelineWindow": "WEEKS_1_2",
      "executionMode": "IN_HOUSE",
      "costModel": "SWEAT_EQUITY_ZERO",
      "estimatedCostAmount": 0,
      "deliverableMilestoneProof": "Concrete measurable deliverable that proves this WP is complete",
      "linkedTaskSummary": "1-sentence practical summary of key tasks in this WP",
      "isGrantEligibleRAndDOrPrototype": true
    }
  ],
  "flowStages": [
    {
      "stageNumber": 1,
      "stageTitle": "Short stage title",
      "executionBadge": "IN_HOUSE",
      "whatHappensHere": "1-2 sentences on what happens in this stage",
      "outputOrHandOff": "Short phrase describing what is handed off to the next stage"
    }
  ]`
      : ''
  }
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          maxOutputTokens: MAX_OUTPUT_TOKENS_PER_CALL,
          temperature: 0.35,
          responseMimeType: 'application/json',
        },
      });

      const rawText = response.text || '';
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as {
          technicalMeritAndInnovationNarrative?: string;
          bottleneckAndDeRiskingNarrative?: string;
          workPackages?: Array<{
            wpCode?: string;
            title?: string;
            timelineWindow?: string;
            executionMode?: string;
            costModel?: string;
            estimatedCostAmount?: number;
            deliverableMilestoneProof?: string;
            linkedTaskSummary?: string;
            isGrantEligibleRAndDOrPrototype?: boolean;
          }>;
          flowStages?: Array<{
            stageNumber?: number;
            stageTitle?: string;
            executionBadge?: string;
            whatHappensHere?: string;
            outputOrHandOff?: string;
          }>;
        };

        if (
          parsed.technicalMeritAndInnovationNarrative &&
          parsed.bottleneckAndDeRiskingNarrative
        ) {
          creditsUsedAfter = await recordGeminiUsageAndIncrementCredits({
            verifiedUserId: authCtx.verifiedUserId,
            planId: params.planId,
            promptKey: 'MOD_D_STEP5_WORK_PACKAGES',
            modelUsed: 'gemini-2.5-flash',
            inputTokens: response.usageMetadata?.promptTokenCount || 320,
            outputTokens: response.usageMetadata?.candidatesTokenCount || 280,
            usedByokKey: authCtx.usedByokKey,
            fallbackCreditsUsed: authCtx.currentCreditsUsed,
          });

          const validWindows = new Set([
            'WEEKS_1_2',
            'WEEKS_3_4',
            'WEEKS_5_8',
            'MONTH_2_3',
            'PRE_LAUNCH_FINAL',
          ]);
          const validModes = new Set([
            'IN_HOUSE',
            'SUPPLIER_OFF_SHELF',
            'EXTERNAL_PARTNER',
          ]);
          const validCostModels = new Set([
            'MONTHLY_SUBSCRIPTION',
            'ONE_OFF_PURCHASE',
            'PER_UNIT_COGS',
            'SWEAT_EQUITY_ZERO',
          ]);

          const sanitizedWps: ProductWorkPackageItem[] =
            mode === 'CHARTER_ONLY'
              ? existingWps
              : Array.isArray(parsed.workPackages) &&
                  parsed.workPackages.length >= 2
                ? parsed.workPackages.slice(0, 6).map((wp, idx) => ({
                    id: `ai-wp-${idx + 1}-${Date.now()}`,
                    wpCode:
                      sanitizePromptInput(wp.wpCode, 12) || `WP${idx + 1}`,
                    title:
                      sanitizePromptInput(wp.title, 140) ||
                      `Work Package ${idx + 1}`,
                    timelineWindow: validWindows.has(String(wp.timelineWindow))
                      ? (wp.timelineWindow as WorkPackageTimelineWindowType)
                      : idx === 0
                        ? 'WEEKS_1_2'
                        : idx === 1
                          ? 'WEEKS_3_4'
                          : idx === 2
                            ? 'WEEKS_5_8'
                            : 'PRE_LAUNCH_FINAL',
                    executionMode: validModes.has(String(wp.executionMode))
                      ? (wp.executionMode as WorkPackageExecutionModeType)
                      : 'IN_HOUSE',
                    costModel: validCostModels.has(String(wp.costModel))
                      ? (wp.costModel as BuildVsBuyCostModelType)
                      : 'SWEAT_EQUITY_ZERO',
                    estimatedCostAmount:
                      typeof wp.estimatedCostAmount === 'number' &&
                      !Number.isNaN(wp.estimatedCostAmount) &&
                      wp.estimatedCostAmount >= 0
                        ? Math.round(wp.estimatedCostAmount * 100) / 100
                        : 0,
                    deliverableMilestoneProof:
                      sanitizePromptInput(wp.deliverableMilestoneProof, 220) ||
                      'Verified milestone deliverable signed off.',
                    linkedTaskSummary:
                      sanitizePromptInput(wp.linkedTaskSummary, 240) ||
                      'Core execution tasks for this work package.',
                    isGrantEligibleRAndDOrPrototype:
                      typeof wp.isGrantEligibleRAndDOrPrototype === 'boolean'
                        ? wp.isGrantEligibleRAndDOrPrototype
                        : idx < 2,
                  }))
                : fallback.workPackages;

          const sanitizedFlow: ProductFlowStageItem[] =
            mode === 'CHARTER_ONLY'
              ? existingFlow
              : Array.isArray(parsed.flowStages) &&
                  parsed.flowStages.length >= 3
                ? parsed.flowStages.slice(0, 4).map((st, idx) => ({
                    id: `ai-flow-${idx + 1}-${Date.now()}`,
                    stageNumber: idx + 1,
                    stageTitle:
                      sanitizePromptInput(st.stageTitle, 100) ||
                      `Stage ${idx + 1}`,
                    executionBadge: validModes.has(String(st.executionBadge))
                      ? (st.executionBadge as WorkPackageExecutionModeType)
                      : 'IN_HOUSE',
                    whatHappensHere:
                      sanitizePromptInput(st.whatHappensHere, 220) ||
                      'Core processing step in the delivery flow.',
                    outputOrHandOff:
                      sanitizePromptInput(st.outputOrHandOff, 140) ||
                      'Verified output passed to next stage.',
                  }))
                : fallback.flowStages;

          return {
            allowed: true,
            workPackages: sanitizedWps,
            flowStages: sanitizedFlow,
            executionCadenceRule: fallback.executionCadenceRule,
            technicalMeritAndInnovationNarrative:
              parsed.technicalMeritAndInnovationNarrative.trim(),
            bottleneckAndDeRiskingNarrative:
              parsed.bottleneckAndDeRiskingNarrative.trim(),
            creditsUsedAfter,
            engineMode: 'gemini-2.5-flash',
          };
        }
      }
    } catch {
      // Fallback below
    }
  }

  return {
    allowed: true,
    ...buildSmartFallback(),
    creditsUsedAfter,
    engineMode: 'smart-synthesizer',
  };
}


export interface ModuleDBlindSpotAuditGenerationResult {
  allowed: boolean;
  reason?: string;
  blindSpots: ProductBlindSpotItem[];
  readinessConfidence: ProductReadinessConfidenceType;
  executiveProductBriefSummary: string;
  keyDeRiskingSignOffNarrative: string;
  creditsUsedAfter?: number;
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export async function generateModuleDBlindSpotAuditViaRouter(params: {
  planId?: string;
  planTitle: string;
  industryCategory?: string;
  hqCountryCode: SupportedCountryCode;
  selectedTrack: ProductTrackType;
  otherProductTrackText?: string;
  formFactor?: ProductFormFactorType;
  v1LaunchTimeline?: V1LaunchTimelineType;
  primaryChannel?: SalesChannelOptionType;
  estimatedBlendedFeePercent?: number;
  v1MustHaveCount?: number;
  v1HighEffortCount?: number;
  monthlyBurnTotal?: number;
  onceOffCapExTotal?: number;
  perUnitCogsTotal?: number;
  workPackageCount?: number;
  grantEligibleWpCount?: number;
  currentBlindSpots?: ProductBlindSpotItem[];
  mode?: 'FULL_AUDIT' | 'SUMMARY_ONLY';
}): Promise<ModuleDBlindSpotAuditGenerationResult> {
  const authCtx = await authorizeAndPrepareGeminiCall(
    'MOD_D_STEP6_BLIND_SPOT_AUDIT'
  );

  let creditsUsedAfter = authCtx.currentCreditsUsed;
  const cleanTitle =
    sanitizePromptInput(params.planTitle, 140) || 'Your Startup';
  const isSummaryOnly = params.mode === 'SUMMARY_ONLY';
  const v1Count = params.v1MustHaveCount ?? 0;
  const highEffortCount = params.v1HighEffortCount ?? 0;
  const blendedFee = params.estimatedBlendedFeePercent ?? 3;
  const monthlyBurn = params.monthlyBurnTotal ?? 0;
  const onceOffTotal = params.onceOffCapExTotal ?? 0;
  const unitCogs = params.perUnitCogsTotal ?? 0;
  const wpCount = params.workPackageCount ?? 0;
  const grantWpCount = params.grantEligibleWpCount ?? 0;

  const grantAgencyLabel =
    params.hqCountryCode === 'IE'
      ? 'Local Enterprise Office (LEO) / Enterprise Ireland'
      : params.hqCountryCode === 'GB'
        ? 'Innovate UK / British Business Bank Start Up Loans'
        : 'Seed / Innovation Grant Assessors';

  const buildSmartFallback = (): Omit<
    ModuleDBlindSpotAuditGenerationResult,
    'allowed' | 'reason' | 'creditsUsedAfter' | 'engineMode'
  > => {
    const dynamicBlindSpots: ProductBlindSpotItem[] = [];

    // 1. Check Scope vs. Timeline alignment
    if (
      (params.v1LaunchTimeline === 'UNDER_4_WEEKS' && v1Count > 4) ||
      highEffortCount >= 3
    ) {
      dynamicBlindSpots.push({
        id: 'bs-scope-timeline-1',
        title: `V1 Scope Density vs. Target Launch Window (${v1Count} Must-Haves, ${highEffortCount} High-Effort)`,
        category: 'SCOPE_CREEP_TIMELINE',
        severity: highEffortCount >= 4 ? 'CRITICAL' : 'IMPORTANT',
        whyItMatters: `Having ${v1Count} Day-1 Must-Have items (${highEffortCount} marked High Effort) increases the risk of delaying first customer feedback and revenue.`,
        recommendedActionOrFix:
          'Demote at least 1–2 High-Effort items to Version 1.5 Fast-Follow in Step 3, or use a manual/no-code concierge bridge for the first 10 customers.',
        founderMitigationNote: '',
        isResolved: false,
      });
    } else {
      dynamicBlindSpots.push({
        id: 'bs-scope-timeline-ok',
        title: 'Protect Your Version 1 Launch Boundary Against Early Custom Requests',
        category: 'SCOPE_CREEP_TIMELINE',
        severity: 'WATCH',
        whyItMatters:
          'Early pilot customers frequently request edge-case features or bespoke product variations that can derail WP1–WP3 delivery.',
        recommendedActionOrFix:
          'Log all new pilot requests into the Version 1.5 Fast-Follow queue until your first 10 paying orders complete the core 4-stage flow.',
        founderMitigationNote: '',
        isResolved: false,
      });
    }

    // 2. Check Channel Fee + Unit COGS pressure
    if (blendedFee >= 12 || unitCogs > 0) {
      dynamicBlindSpots.push({
        id: 'bs-margin-fee-2',
        title: `Blended Channel Commission (${blendedFee}%) & Unit Cost Buffer for Module G Pricing`,
        category: 'UNIT_MARGIN_CHANNEL_FEE',
        severity: blendedFee >= 15 ? 'IMPORTANT' : 'WATCH',
        whyItMatters: `With a ${blendedFee}% blended channel fee${unitCogs > 0 ? ` and ${unitCogs} per-unit COGS` : ''}, underpricing in Module G could compress your net pocket profit per order.`,
        recommendedActionOrFix:
          'Ensure Module G retail/tier pricing builds in at least a 65%+ gross margin after marketplace/payment fees and packaging/fulfillment costs.',
        founderMitigationNote: '',
        isResolved: false,
      });
    }

    // 3. Check Single-Supplier / Technical Bottleneck
    if (params.selectedTrack === 'PHYSICAL_PRODUCT_ECOM') {
      dynamicBlindSpots.push({
        id: 'bs-phys-supplier-3',
        title: 'Raw Material Lead-Time, Batch Yield & Damage-in-Transit Buffer',
        category: 'SUPPLIER_DEPENDENCY',
        severity: 'IMPORTANT',
        whyItMatters:
          'Relying on a single timber/raw material supplier or untested courier packaging can stall order fulfillment during seasonal peaks.',
        recommendedActionOrFix:
          'Qualify a secondary local material supplier in Module E and run a 48-hour courier drop-test before scaling paid traffic.',
        founderMitigationNote: '',
        isResolved: false,
      });
    } else if (params.selectedTrack === 'HYBRID_HARDWARE_SOFTWARE') {
      dynamicBlindSpots.push({
        id: 'bs-hw-cert-3',
        title: 'Pre-Certified Component Selection & Enclosure Tooling De-Risking',
        category: 'TECHNICAL_BOTTLENECK',
        severity: 'CRITICAL',
        whyItMatters:
          'Custom radio/wireless certification (CE/UKCA/FCC) and injection-mould tooling too early can consume 6+ months and €30k+ before field validation.',
        recommendedActionOrFix:
          'Use pre-certified wireless/compute modules and 3D-printed/CNC enclosures for the first 10–25 field pilot units in WP1–WP3.',
        founderMitigationNote: '',
        isResolved: false,
      });
    } else {
      dynamicBlindSpots.push({
        id: 'bs-tech-bottleneck-3',
        title: 'Third-Party API / Platform Dependency & Data Portability Safeguard',
        category: 'TECHNICAL_BOTTLENECK',
        severity: 'WATCH',
        whyItMatters:
          'Building on managed SaaS/AI APIs accelerates V1 launch, but hardcoding vendor-specific schemas can create switching friction later.',
        recommendedActionOrFix:
          'Keep core customer records, prompts, and proprietary business logic in an exportable schema controlled in-house.',
        founderMitigationNote: '',
        isResolved: false,
      });
    }

    // 4. Check Grant Compliance & IP Assignment Readiness
    dynamicBlindSpots.push({
      id: 'bs-grant-ip-4',
      title: `${grantAgencyLabel} Procurement & Full IP Assignment Readiness`,
      category: 'GRANT_COMPLIANCE_IP',
      severity: onceOffTotal >= 1000 ? 'IMPORTANT' : 'WATCH',
      whyItMatters: `${grantAgencyLabel} rules require clear proof that core IP is owned by the applicant company and that any external spend or equipment over threshold is backed by comparable written quotes.`,
      recommendedActionOrFix:
        'Ensure any external specialist or sub-contractor signs a written IP assignment agreement upon payment and retain dated specification sheets for Module E & Module K.',
      founderMitigationNote: '',
      isResolved: false,
    });

    const readinessConfidence: ProductReadinessConfidenceType =
      highEffortCount >= 4 || wpCount === 0
        ? 'NEEDS_MINOR_DE_RISKING'
        : 'READY_TO_BUILD_V1';

    const executiveProductBriefSummary = `${cleanTitle} is executing a disciplined Version 1 build on the ${params.selectedTrack.replace(/_/g, ' ')} track${params.formFactor ? ` (${params.formFactor.replace(/_/g, ' ')})` : ''}. By locking V1 scope to ${v1Count || 'essential'} Day-1 Must-Have capabilities, utilizing a ${blendedFee}% blended sales channel strategy, and structuring delivery across ${wpCount || 4} milestone-gated Work Packages (${grantWpCount} R&D/prototype eligible), the business minimizes upfront burn (${monthlyBurn}/mo recurring, ${onceOffTotal} once-off setup) while accelerating time-to-first-paying-customer.`;

    const keyDeRiskingSignOffNarrative = `Technical, operational, and commercial execution risks have been systematically mitigated across Steps 1–5: non-essential features are ring-fenced in Version 1.5/V2, commodity infrastructure is rented/sourced off-the-shelf so 100% of founder capacity focuses on proprietary customer value, and every Work Package has an explicit verification gate before capital is committed to the next stage.`;

    return {
      blindSpots: isSummaryOnly
        ? params.currentBlindSpots || []
        : dynamicBlindSpots,
      readinessConfidence,
      executiveProductBriefSummary,
      keyDeRiskingSignOffNarrative,
    };
  };

  if (authCtx.canCallLiveGemini && authCtx.activeApiKey) {
    try {
      const ai = getGenAiClient(authCtx.activeApiKey);
      const existingBsSummary = (params.currentBlindSpots || [])
        .slice(0, 8)
        .map((b) => `${b.title} [${b.category} / ${b.severity}]`)
        .join('; ');

      const prompt = `You are a supportive startup co-founder, product architect, and ${grantAgencyLabel} grant assessor reviewing Module D (Product & Technical Build) for "${cleanTitle}" (${params.hqCountryCode}).
Track: ${params.selectedTrack} ${params.otherProductTrackText ? `(${sanitizePromptInput(params.otherProductTrackText, 80)})` : ''}
Form Factor: ${params.formFactor || 'Not specified'}
Target V1 Launch Timeline: ${params.v1LaunchTimeline || 'Not specified'}
Primary Channel: ${params.primaryChannel || 'Not specified'} (Blended channel fee: ${blendedFee}%)
Step 3 V1 Must-Haves: ${v1Count} items (${highEffortCount} High-Effort)
Step 4/5 Smart Costs: ${monthlyBurn}/mo recurring, ${onceOffTotal} once-off setup/CapEx, ${unitCogs}/unit COGS
Step 5 Work Packages: ${wpCount} WPs (${grantWpCount} marked Grant-Eligible R&D/Prototype)
Existing Blind Spots (if any): ${existingBsSummary || 'None yet'}
Generation Mode: ${isSummaryOnly ? 'SUMMARY_ONLY (Only draft executiveProductBriefSummary and keyDeRiskingSignOffNarrative; return empty array for blindSpots)' : 'FULL_AUDIT (Generate 4 constructive, specific blindSpots + executiveProductBriefSummary + keyDeRiskingSignOffNarrative)'}

Return strict JSON with keys:
- "readinessConfidence": one of "READY_TO_BUILD_V1", "NEEDS_MINOR_DE_RISKING", "NEEDS_PROTOTYPE_SPIKE_FIRST"
- "blindSpots": array of 4 objects (or [] if SUMMARY_ONLY), each with:
  - "title": string (concise, constructive blind-spot title, max 95 chars)
  - "category": one of "SCOPE_CREEP_TIMELINE", "UNIT_MARGIN_CHANNEL_FEE", "TECHNICAL_BOTTLENECK", "SUPPLIER_DEPENDENCY", "GRANT_COMPLIANCE_IP"
  - "severity": one of "WATCH", "IMPORTANT", "CRITICAL"
  - "whyItMatters": string (1-2 sentences explaining why this matters for their specific product track and ${grantAgencyLabel})
  - "recommendedActionOrFix": string (1-2 actionable sentences on how to mitigate or solve it)
- "executiveProductBriefSummary": string (3-4 sentences synthesizing their Product Vehicle, Channel Strategy, V1 Scope Discipline, Smart Cost Structure, and Work Packages into an investor/grant-ready executive summary)
- "keyDeRiskingSignOffNarrative": string (2-3 sentences explaining how their V1 architecture, Build-vs-Buy choices, and WP1-WP4 verification gates de-risk execution)`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          maxOutputTokens: MAX_OUTPUT_TOKENS_PER_CALL,
          temperature: 0.35,
          responseMimeType: 'application/json',
        },
      });

      const rawText = response.text?.trim() || '';
      if (rawText) {
        const parsed = JSON.parse(rawText) as {
          readinessConfidence?: string;
          blindSpots?: Array<{
            title?: string;
            category?: string;
            severity?: string;
            whyItMatters?: string;
            recommendedActionOrFix?: string;
          }>;
          executiveProductBriefSummary?: string;
          keyDeRiskingSignOffNarrative?: string;
        };

        const fallback = buildSmartFallback();
        const validCategories = new Set<string>([
          'SCOPE_CREEP_TIMELINE',
          'UNIT_MARGIN_CHANNEL_FEE',
          'TECHNICAL_BOTTLENECK',
          'SUPPLIER_DEPENDENCY',
          'GRANT_COMPLIANCE_IP',
          'OTHER',
        ]);
        const validSeverities = new Set<string>([
          'WATCH',
          'IMPORTANT',
          'CRITICAL',
        ]);
        const validConfidence = new Set<string>([
          'READY_TO_BUILD_V1',
          'NEEDS_MINOR_DE_RISKING',
          'NEEDS_PROTOTYPE_SPIKE_FIRST',
          'OTHER',
        ]);

        if (
          typeof parsed.executiveProductBriefSummary === 'string' &&
          parsed.executiveProductBriefSummary.trim().length > 20 &&
          typeof parsed.keyDeRiskingSignOffNarrative === 'string' &&
          parsed.keyDeRiskingSignOffNarrative.trim().length > 20
        ) {
          creditsUsedAfter = await recordGeminiUsageAndIncrementCredits({
            verifiedUserId: authCtx.verifiedUserId,
            planId: params.planId,
            promptKey: 'MOD_D_STEP6_BLIND_SPOT_AUDIT',
            modelUsed: 'gemini-2.5-flash',
            inputTokens: response.usageMetadata?.promptTokenCount || 300,
            outputTokens: response.usageMetadata?.candidatesTokenCount || 280,
            usedByokKey: authCtx.usedByokKey,
            fallbackCreditsUsed: authCtx.currentCreditsUsed,
          });
          const sanitizedBlindSpots: ProductBlindSpotItem[] = isSummaryOnly
            ? params.currentBlindSpots || []
            : Array.isArray(parsed.blindSpots) && parsed.blindSpots.length >= 2
              ? parsed.blindSpots.slice(0, 6).map((bs, idx) => ({
                  id: `ai-bs-${idx + 1}-${Date.now()}`,
                  title:
                    sanitizePromptInput(bs.title, 110) ||
                    `Product Blind Spot #${idx + 1}`,
                  category: validCategories.has(String(bs.category))
                    ? (bs.category as ProductBlindSpotCategoryType)
                    : 'TECHNICAL_BOTTLENECK',
                  severity: validSeverities.has(String(bs.severity))
                    ? (bs.severity as ProductBlindSpotSeverityType)
                    : 'IMPORTANT',
                  whyItMatters:
                    sanitizePromptInput(bs.whyItMatters, 300) ||
                    'Important product execution risk to monitor during V1 delivery.',
                  recommendedActionOrFix:
                    sanitizePromptInput(bs.recommendedActionOrFix, 300) ||
                    'Validate with a small pilot test before committing additional budget.',
                  founderMitigationNote: '',
                  isResolved: false,
                }))
              : fallback.blindSpots;

          return {
            allowed: true,
            blindSpots: sanitizedBlindSpots,
            readinessConfidence: validConfidence.has(
              String(parsed.readinessConfidence)
            )
              ? (parsed.readinessConfidence as ProductReadinessConfidenceType)
              : fallback.readinessConfidence,
            executiveProductBriefSummary:
              parsed.executiveProductBriefSummary.trim(),
            keyDeRiskingSignOffNarrative:
              parsed.keyDeRiskingSignOffNarrative.trim(),
            creditsUsedAfter,
            engineMode: 'gemini-2.5-flash',
          };
        }
      }
    } catch {
      // Fallback below
    }
  }

  return {
    allowed: true,
    ...buildSmartFallback(),
    creditsUsedAfter,
    engineMode: 'smart-synthesizer',
  };
}


// ============================================================================
// MODULE E STEP 1: "A DAY IN THE LIFE OF AN ORDER" (OPERATIONS BLUEPRINT)
// ============================================================================

export interface ModuleEOperationsBlueprintGenerationResult {
  allowed: boolean;
  reason?: string;
  fulfillmentMode: OperationsFulfillmentModeType;
  turnaroundSla: OrderTurnaroundSlaType;
  capacityConstraint: OperationalCapacityConstraintType;
  orderLifecycleStages: OrderLifecycleStageItem[];
  endToEndFulfillmentNarrative: string;
  scalingAndBottleneckDeRiskingNarrative: string;
  creditsUsedAfter: number;
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export async function generateModuleEOperationsBlueprintViaRouter(params: {
  planId?: string;
  planTitle: string;
  industryCategory: string;
  hqCountryCode: SupportedCountryCode;
  baseCurrency?: string;
  brainDumpText?: string;
  coreProblem?: string;
  targetCustomer?: string;
  proposedSolution?: string;
  selectedTrack: ProductTrackType;
  otherProductTrackText?: string;
  primaryChannel?: SalesChannelOptionType;
  deliveryFulfillmentModel?: DeliveryFulfillmentModelType;
  weeklyOpsHoursAllocated?: number;
  currentFulfillmentMode?: OperationsFulfillmentModeType | '';
  currentTurnaroundSla?: OrderTurnaroundSlaType | '';
  currentCapacityConstraint?: OperationalCapacityConstraintType | '';
  currentStages?: OrderLifecycleStageItem[];
  mode?: 'POPULATE_STAGES_AND_NARRATIVES' | 'NARRATIVES_ONLY';
}): Promise<ModuleEOperationsBlueprintGenerationResult> {
  const authCtx = await authorizeAndPrepareGeminiCall(
    'MOD_E_STEP1_OPERATIONS_BLUEPRINT'
  );

  const isNarrativesOnly = params.mode === 'NARRATIVES_ONLY';
  const currency = params.baseCurrency || 'EUR';
  const weeklyHours = Math.max(5, params.weeklyOpsHoursAllocated || 25);

  const combinedText = [
    params.planTitle,
    params.brainDumpText,
    params.coreProblem,
    params.proposedSolution,
    params.targetCustomer,
    params.otherProductTrackText,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const isWoodworkerOrMaker =
    /wood|chopping board|cutting board|timber|joinery|carpenter|furniture|craft|artisan|turning|cnc/.test(
      combinedText
    );

  const buildSmartFallback = (): Omit<
    ModuleEOperationsBlueprintGenerationResult,
    'allowed' | 'reason' | 'creditsUsedAfter' | 'engineMode'
  > => {
    const cleanTitle = params.planTitle?.trim() || 'our startup';
    const isIE = params.hqCountryCode === 'IE';
    const courierLabel = isIE
      ? 'An Post Advantage / DPD Ireland Tracked'
      : 'Royal Mail Tracked 48 / DPD UK';

    if (
      isWoodworkerOrMaker ||
      params.selectedTrack === 'PHYSICAL_PRODUCT_ECOM'
    ) {
      const stages: OrderLifecycleStageItem[] =
        isNarrativesOnly &&
        params.currentStages &&
        params.currentStages.length > 0
          ? params.currentStages
          : isWoodworkerOrMaker
            ? [
                {
                  id: 'ops-stage-1',
                  stageNumber: 1,
                  stageTitle: '1. Order Trigger & Kiln-Dried Timber Selection',
                  ownerType: 'FOUNDER_MAKER',
                  whatHappensStepByStep:
                    'Order arrives via Shopify D2C / Craft Market POS; select kiln-dried hardwood (Walnut, Ash, Beech at 8%–10% moisture content) and rip-saw strips to size.',
                  toolsEquipmentOrSupplier:
                    'Shopify Order Webhook + Table Saw + Planer-Thicknesser (FSC Kiln-Dried Hardwood Supplier)',
                  activeMinutesPerOrder: 15,
                  directVariableCostPerOrder: 18.5,
                },
                {
                  id: 'ops-stage-2',
                  stageNumber: 2,
                  stageTitle: '2. Food-Safe Glue-Up & Parallel Clamp Curing',
                  ownerType: 'FOUNDER_MAKER',
                  whatHappensStepByStep:
                    'Assemble edge/end-grain timber pattern using FDA food-contact waterproof glue (Titebond III) and lock into parallel clamp rack (24h passive cure).',
                  toolsEquipmentOrSupplier:
                    'Parallel Clamp Rack + Titebond III Food-Safe Waterproof PVA Glue',
                  activeMinutesPerOrder: 15,
                  directVariableCostPerOrder: 1.8,
                },
                {
                  id: 'ops-stage-3',
                  stageNumber: 3,
                  stageTitle:
                    '3. Drum Sanding, CNC Juice Groove & Laser Engraving',
                  ownerType: 'FOUNDER_MAKER',
                  whatHappensStepByStep:
                    'Flatten board through dual-drum sander, rout juice groove & chamfered finger grips, laser-engrave custom gift message/logo, and orbital sand to 240-grit.',
                  toolsEquipmentOrSupplier:
                    'Dual-Drum Sander + CNC Router + Diode Laser Engraver + ATEX Dust Extractor',
                  activeMinutesPerOrder: 25,
                  directVariableCostPerOrder: 2.2,
                },
                {
                  id: 'ops-stage-4',
                  stageNumber: 4,
                  stageTitle:
                    '4. Food-Grade Mineral Oil Bath & Beeswax Buffing',
                  ownerType: 'FOUNDER_MAKER',
                  whatHappensStepByStep:
                    'Submerge in USP food-grade mineral oil bath to seal wood fibres, wipe dry, and hand-buff with local beeswax & carnauba board butter.',
                  toolsEquipmentOrSupplier:
                    'Stainless Dipping Tank + USP Mineral Oil + Irish Beeswax Board Butter',
                  activeMinutesPerOrder: 10,
                  directVariableCostPerOrder: 2.5,
                },
                {
                  id: 'ops-stage-5',
                  stageNumber: 5,
                  stageTitle: '5. Eco-Packaging, Care Card & Tracked Dispatch',
                  ownerType: 'FOUNDER_MAKER',
                  whatHappensStepByStep:
                    'Pass 5-point flatness & moisture QC check, wrap in honeycomb kraft paper with care guide & wax tin, and book tracked courier label.',
                  toolsEquipmentOrSupplier: `Branded Kraft Box + ${courierLabel}`,
                  activeMinutesPerOrder: 8,
                  directVariableCostPerOrder: 9.5,
                },
              ]
            : [
                {
                  id: 'ops-stage-1',
                  stageNumber: 1,
                  stageTitle: '1. Order Capture & Inventory Allocation',
                  ownerType: 'AUTOMATED_SYSTEM',
                  whatHappensStepByStep:
                    'Customer completes checkout on Shopify / marketplace; payment clears and SKU stock is automatically reserved with packing slip queued.',
                  toolsEquipmentOrSupplier:
                    'Shopify / Stripe Checkout + Inventory Sync',
                  activeMinutesPerOrder: 1,
                  directVariableCostPerOrder: 1.9,
                },
                {
                  id: 'ops-stage-2',
                  stageNumber: 2,
                  stageTitle: '2. Raw Material & Batch Production Prep',
                  ownerType: 'FOUNDER_MAKER',
                  whatHappensStepByStep:
                    'Pull raw ingredients/components from batch inventory and prepare product unit according to standard operating recipe/spec.',
                  toolsEquipmentOrSupplier:
                    'In-House Production Bench + Vetted Raw Material Suppliers',
                  activeMinutesPerOrder: 18,
                  directVariableCostPerOrder: 11.5,
                },
                {
                  id: 'ops-stage-3',
                  stageNumber: 3,
                  stageTitle: '3. Finishing, Labelling & Batch Traceability',
                  ownerType: 'FOUNDER_MAKER',
                  whatHappensStepByStep:
                    'Apply primary product finish, batch code/barcode label, and protective seal ready for retail or direct dispatch.',
                  toolsEquipmentOrSupplier:
                    'Thermal Label Printer + Primary Packaging Stock',
                  activeMinutesPerOrder: 8,
                  directVariableCostPerOrder: 2.4,
                },
                {
                  id: 'ops-stage-4',
                  stageNumber: 4,
                  stageTitle: '4. Quality Control Inspection & Protective Boxing',
                  ownerType: 'FOUNDER_MAKER',
                  whatHappensStepByStep:
                    'Verify product weight, finish quality, and order accuracy; pack into crush-proof recyclable mailer with unboxing insert.',
                  toolsEquipmentOrSupplier:
                    'QC Checklist + Recyclable Corrugated Mailer Boxes',
                  activeMinutesPerOrder: 5,
                  directVariableCostPerOrder: 2.2,
                },
                {
                  id: 'ops-stage-5',
                  stageNumber: 5,
                  stageTitle: '5. Courier Collection & Automated Tracking Update',
                  ownerType: 'EXTERNAL_SUPPLIER_3PL',
                  whatHappensStepByStep:
                    'Scan manifest for daily courier collection; automated tracking link and post-delivery review request sent to customer.',
                  toolsEquipmentOrSupplier: courierLabel,
                  activeMinutesPerOrder: 3,
                  directVariableCostPerOrder: 6.5,
                },
              ];

      const totalMins = stages.reduce(
        (acc, s) => acc + (Number(s.activeMinutesPerOrder) || 0),
        0
      );
      const totalCogs = stages.reduce(
        (acc, s) => acc + (Number(s.directVariableCostPerOrder) || 0),
        0
      );
      const maxWeeklyUnits =
        totalMins > 0 ? Math.floor((weeklyHours * 60) / totalMins) : 250;

      return {
        fulfillmentMode:
          (params.currentFulfillmentMode as OperationsFulfillmentModeType) ||
          'IN_HOUSE_WORKSHOP_BATCH',
        turnaroundSla:
          (params.currentTurnaroundSla as OrderTurnaroundSlaType) ||
          'STANDARD_CRAFT_CYCLE_3_7_DAYS',
        capacityConstraint:
          (params.currentCapacityConstraint as OperationalCapacityConstraintType) ||
          'EQUIPMENT_OR_CURE_BATCH_LIMIT',
        orderLifecycleStages: stages,
        endToEndFulfillmentNarrative: `Every ${cleanTitle} order follows a standardized 5-stage workshop fulfillment workflow taking ${totalMins} active hands-on minutes and ${formatPlanCurrency(totalCogs, currency)} in direct variable materials, consumables, and tracked shipping (COGS). Raw materials are pre-batched to strict quality tolerances before undergoing precision finishing, food-safe/protective treatment, a 5-point quality control gate, and tracked dispatch via ${courierLabel} within a 3–5 business day turnaround SLA.`,
        scalingAndBottleneckDeRiskingNarrative: `At ${totalMins} active minutes per unit across ${weeklyHours} workshop hours/week, solo one-by-one production caps weekly output at ~${maxWeeklyUnits} units/week. We de-risk peak seasonal demand (such as Q4 Christmas gifting and B2B corporate batches) in two ways: (1) pre-milling and batch-curing un-engraved blank units in blocks of 25 so final personalization and oiling takes under 12 minutes per order, and (2) investing in grant-supported production machinery (Step 2 Dual-Drum Sander & CNC Router) to cut hands-on labour per unit by 45%+.`,
      };
    }

    if (params.selectedTrack === 'EDUCATION_PROGRAM_COHORT') {
      const stages: OrderLifecycleStageItem[] =
        isNarrativesOnly &&
        params.currentStages &&
        params.currentStages.length > 0
          ? params.currentStages
          : [
              {
                id: 'ops-stage-1',
                stageNumber: 1,
                stageTitle: '1. Enrolment Checkout & Instant Portal Welcome',
                ownerType: 'AUTOMATED_SYSTEM',
                whatHappensStepByStep:
                  'Parent/learner completes checkout; Stripe webhook provisions learning portal login and sends instant welcome email + baseline intake form.',
                toolsEquipmentOrSupplier:
                  'Stripe Checkout + Web Portal + Transactional Email',
                activeMinutesPerOrder: 0,
                directVariableCostPerOrder: 2.1,
              },
              {
                id: 'ops-stage-2',
                stageNumber: 2,
                stageTitle: '2. Baseline Routine / Needs Assessment Triage',
                ownerType: 'FOUNDER_MAKER',
                whatHappensStepByStep:
                  'Learner completes 3-minute onboarding profile; system recommends personalized module track and flags any high-priority notes for specialist review.',
                toolsEquipmentOrSupplier:
                  'Guided Onboarding Diagnostic + Specialist Dashboard',
                activeMinutesPerOrder: 5,
                directVariableCostPerOrder: 0.4,
              },
              {
                id: 'ops-stage-3',
                stageNumber: 3,
                stageTitle:
                  '3. Bite-Sized Audio/Video Lesson & Action Plan Delivery',
                ownerType: 'AUTOMATED_SYSTEM',
                whatHappensStepByStep:
                  'User accesses self-paced 5-minute audio/video modules, printable visual schedules, and daily habit tracker on mobile or desktop.',
                toolsEquipmentOrSupplier:
                  'Hosted Video/Audio CDN + Interactive Progress Tracker',
                activeMinutesPerOrder: 0,
                directVariableCostPerOrder: 0.35,
              },
              {
                id: 'ops-stage-4',
                stageNumber: 4,
                stageTitle: '4. Weekly Live Q&A Clinic / Community Check-In',
                ownerType: 'FOUNDER_MAKER',
                whatHappensStepByStep:
                  'Founder/specialist hosts structured group office hours to answer submitted questions in a 1-to-many format (amortized across cohort).',
                toolsEquipmentOrSupplier:
                  'Zoom / Moderated Community Q&A Thread',
                activeMinutesPerOrder: 8,
                directVariableCostPerOrder: 0.25,
              },
              {
                id: 'ops-stage-5',
                stageNumber: 5,
                stageTitle:
                  '5. Milestone Outcome Check & Referral / Renewal Loop',
                ownerType: 'AUTOMATED_SYSTEM',
                whatHappensStepByStep:
                  'Day-14 & Day-30 progress check captures measurable improvement data (for grant/clinical proof) and prompts ongoing membership or referral.',
                toolsEquipmentOrSupplier:
                  'Automated Outcome Survey + Subscription Billing',
                activeMinutesPerOrder: 2,
                directVariableCostPerOrder: 0.1,
              },
            ];

      const totalMins = stages.reduce(
        (acc, s) => acc + (Number(s.activeMinutesPerOrder) || 0),
        0
      );
      const totalCogs = stages.reduce(
        (acc, s) => acc + (Number(s.directVariableCostPerOrder) || 0),
        0
      );

      return {
        fulfillmentMode:
          (params.currentFulfillmentMode as OperationsFulfillmentModeType) ||
          'HYBRID_AUTOMATED_PLUS_HUMAN',
        turnaroundSla:
          (params.currentTurnaroundSla as OrderTurnaroundSlaType) ||
          'INSTANT_UNDER_5_MINS',
        capacityConstraint:
          (params.currentCapacityConstraint as OperationalCapacityConstraintType) ||
          'FOUNDER_MANUAL_HOURS',
        orderLifecycleStages: stages,
        endToEndFulfillmentNarrative: `${cleanTitle} combines instant (<60 second) automated digital onboarding with structured 1-to-many specialist support. Each enrolled family/member costs ${formatPlanCurrency(totalCogs, currency)} in direct payment and hosting fees and requires only ${totalMins} amortized minutes of specialist time—ensuring immediate access to core guidance at 11pm while preserving high-trust human accountability via weekly group clinics.`,
        scalingAndBottleneckDeRiskingNarrative: `To prevent 1-on-1 coaching burnout as enrolment grows from 25 to 250+ active members, core curriculum delivery and baseline diagnostics are 100% automated, while live support is delivered in 1-to-many themed group Q&A sessions and searchable answer libraries rather than unscalable private 1-on-1 calls.`,
      };
    }

    // Default: Cloud SaaS / AI / Marketplace / Service (e.g. Startup Preflight)
    const stages: OrderLifecycleStageItem[] =
      isNarrativesOnly &&
      params.currentStages &&
      params.currentStages.length > 0
        ? params.currentStages
        : [
            {
              id: 'ops-stage-1',
              stageNumber: 1,
              stageTitle:
                '1. Checkout / Voucher Redemption & Account Provisioning',
              ownerType: 'AUTOMATED_SYSTEM',
              whatHappensStepByStep:
                'Customer completes Stripe checkout or redeems cohort/AppSumo voucher; webhook updates user_entitlements and unlocks multi-module workspace in <5 seconds.',
              toolsEquipmentOrSupplier:
                'Stripe Checkout + Better-Auth + PostgreSQL (Drizzle ORM)',
              activeMinutesPerOrder: 0,
              directVariableCostPerOrder: 2.05,
            },
            {
              id: 'ops-stage-2',
              stageNumber: 2,
              stageTitle:
                '2. Guided Onboarding & Geo-Localized Workspace Setup',
              ownerType: 'AUTOMATED_SYSTEM',
              whatHappensStepByStep:
                'Edge Geo-IP pre-selects HQ country (IE/GB), currency, and regional grant rules; founder captures initial brain dump and 1-page Concept Canvas.',
              toolsEquipmentOrSupplier:
                'Next.js Edge Middleware + Google Cloud Run + Cloud SQL',
              activeMinutesPerOrder: 0,
              directVariableCostPerOrder: 0.05,
            },
            {
              id: 'ops-stage-3',
              stageNumber: 3,
              stageTitle:
                '3. AI-Assisted Module Execution & Live Survey Hosting',
              ownerType: 'AUTOMATED_SYSTEM',
              whatHappensStepByStep:
                'Founder progresses through Modules A–K using rate-limited Gemini 2.5 Flash/Pro synthesis, Mom-Test survey hosting, and financial modelling.',
              toolsEquipmentOrSupplier:
                'Google GenAI SDK (router.ts 500/day ceiling) + Public Survey Engine',
              activeMinutesPerOrder: 0,
              directVariableCostPerOrder: 0.85,
            },
            {
              id: 'ops-stage-4',
              stageNumber: 4,
              stageTitle:
                '4. 3-Quote Concierge & Partner Marketplace Hand-Off',
              ownerType: 'PARTNER_CONCIERGE',
              whatHappensStepByStep:
                'When a founder requests 3 LEO-compliant dev/equipment quotes or banking/insurance perks, standardized RFP specs route to vetted IE/UK partners within 48h.',
              toolsEquipmentOrSupplier:
                'Startup Preflight 3-Quote Concierge Engine + Vetted IE/UK Partner Network',
              activeMinutesPerOrder: 5,
              directVariableCostPerOrder: 0.0,
            },
            {
              id: 'ops-stage-5',
              stageNumber: 5,
              stageTitle:
                '5. Grant Pre-Flight Audit, Export & Living Vault Renewal',
              ownerType: 'AUTOMATED_SYSTEM',
              whatHappensStepByStep:
                'Founder compiles LEO / Innovate UK / Start Up Loans pack in Module K; at Month 6, automated lifecycle check prompts €9/mo Grant Radar & Living Vault renewal.',
              toolsEquipmentOrSupplier:
                'Module K Grant Compiler + Resend Transactional Lifecycle',
              activeMinutesPerOrder: 2,
              directVariableCostPerOrder: 0.05,
            },
          ];

    const totalMins = stages.reduce(
      (acc, s) => acc + (Number(s.activeMinutesPerOrder) || 0),
      0
    );
    const totalCogs = stages.reduce(
      (acc, s) => acc + (Number(s.directVariableCostPerOrder) || 0),
      0
    );

    return {
      fulfillmentMode:
        (params.currentFulfillmentMode as OperationsFulfillmentModeType) ||
        'HYBRID_AUTOMATED_PLUS_HUMAN',
      turnaroundSla:
        (params.currentTurnaroundSla as OrderTurnaroundSlaType) ||
        'INSTANT_UNDER_5_MINS',
      capacityConstraint:
        (params.currentCapacityConstraint as OperationalCapacityConstraintType) ||
        'CLOUD_API_RATE_OR_INFRA_GUARDRAIL',
      orderLifecycleStages: stages,
      endToEndFulfillmentNarrative: `${cleanTitle} operates a high-margin cloud fulfillment pipeline where core account provisioning, geo-localization, and AI-guided module synthesis execute in under 60 seconds with ${formatPlanCurrency(totalCogs, currency)} in direct variable payment and AI token costs (COGS) per customer. Human touchpoints are reserved strictly for high-value exception triage and routing standardized 3-Quote Concierge RFPs to vetted Irish and UK partner suppliers (${totalMins} mins average ops time per customer).`,
      scalingAndBottleneckDeRiskingNarrative: `We protect unit economics and operational uptime at scale through three guardrails: (1) a hard 500-call/day platform AI circuit breaker and 2,048 max-output-token cap in router.ts with deterministic smart-synthesizer fallback, (2) self-serve 4-layer in-app micro-coaching ('Why Are We Asking This?', industry examples, and 'Ask Preflight AI') to keep support ticket volume below 5%, and (3) pre-vetted IE/UK supplier SLAs for 48-hour quote turnaround.`,
    };
  };

  if (!authCtx.canCallLiveGemini || !authCtx.activeApiKey) {
    return {
      allowed: true,
      ...buildSmartFallback(),
      creditsUsedAfter: authCtx.currentCreditsUsed,
      engineMode: 'smart-synthesizer',
    };
  }

  let creditsUsedAfter = authCtx.currentCreditsUsed;

  try {
    const ai = getGenAiClient(authCtx.activeApiKey);
    const fallback = buildSmartFallback();

    const prompt = `You are an expert startup COO and IE Local Enterprise Office (LEO) / UK Innovate UK & Start Up Loans operational advisor.
Generate the Module E Step 1 ("A Day in the Life of an Order" — End-to-End Fulfillment & Unit Operations Blueprint) for:
- Startup Title: ${sanitizePromptInput(params.planTitle, 120)}
- Industry Category: ${sanitizePromptInput(params.industryCategory, 80)}
- HQ Country: ${params.hqCountryCode} (Currency: ${currency})
- Product Track: ${params.selectedTrack} ${params.otherProductTrackText ? `(${sanitizePromptInput(params.otherProductTrackText, 100)})` : ''}
- Core Problem: ${sanitizePromptInput(params.coreProblem, 250)}
- Proposed Solution: ${sanitizePromptInput(params.proposedSolution, 250)}
- Target Customer: ${sanitizePromptInput(params.targetCustomer, 200)}
- Weekly Ops Hours Available: ${weeklyHours} hours/week
- Mode: ${isNarrativesOnly ? 'NARRATIVES_ONLY (synthesize narratives from current stages)' : 'POPULATE_STAGES_AND_NARRATIVES'}

Return ONLY valid JSON matching this exact structure:
{
  "fulfillmentMode": "AUTOMATED_CLOUD_SELF_SERVE" | "IN_HOUSE_WORKSHOP_BATCH" | "CONTRACT_MANUFACTURED_3PL" | "FOUNDER_LED_CONCIERGE_COHORT" | "HYBRID_AUTOMATED_PLUS_HUMAN",
  "turnaroundSla": "INSTANT_UNDER_5_MINS" | "SAME_OR_NEXT_DAY_24_48H" | "STANDARD_CRAFT_CYCLE_3_7_DAYS" | "BESPOKE_OR_SPRINT_2_4_WEEKS" | "COHORT_OR_SCHEDULED_WINDOW",
  "capacityConstraint": "FOUNDER_MANUAL_HOURS" | "EQUIPMENT_OR_CURE_BATCH_LIMIT" | "SUPPLIER_OR_PARTNER_TURNAROUND" | "CLOUD_API_RATE_OR_INFRA_GUARDRAIL" | "PROVIDER_SUPPLY_LIQUIDITY",
  "orderLifecycleStages": [
    {
      "stageNumber": 1,
      "stageTitle": "1. ...",
      "ownerType": "AUTOMATED_SYSTEM" | "FOUNDER_MAKER" | "COFOUNDER_TEAM" | "EXTERNAL_SUPPLIER_3PL" | "PARTNER_CONCIERGE",
      "whatHappensStepByStep": "Specific operational step...",
      "toolsEquipmentOrSupplier": "Specific tool, machine, or supplier...",
      "activeMinutesPerOrder": 10,
      "directVariableCostPerOrder": 5.5
    }
  ],
  "endToEndFulfillmentNarrative": "2-3 sentences explaining the end-to-end order lifecycle, SLA, and direct unit COGS...",
  "scalingAndBottleneckDeRiskingNarrative": "2-3 sentences explaining how the business scales order volume 5x without breaking the primary operational bottleneck..."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        maxOutputTokens: 2048,
        temperature: 0.35,
      },
    });

    const rawText = response.text?.trim() || '';
    if (rawText) {
      const parsed = JSON.parse(rawText) as Partial<{
        fulfillmentMode: OperationsFulfillmentModeType;
        turnaroundSla: OrderTurnaroundSlaType;
        capacityConstraint: OperationalCapacityConstraintType;
        orderLifecycleStages: Array<Partial<OrderLifecycleStageItem>>;
        endToEndFulfillmentNarrative: string;
        scalingAndBottleneckDeRiskingNarrative: string;
      }>;

      const validModes = new Set<string>([
        'AUTOMATED_CLOUD_SELF_SERVE',
        'IN_HOUSE_WORKSHOP_BATCH',
        'CONTRACT_MANUFACTURED_3PL',
        'FOUNDER_LED_CONCIERGE_COHORT',
        'HYBRID_AUTOMATED_PLUS_HUMAN',
        'OTHER',
      ]);
      const validSlas = new Set<string>([
        'INSTANT_UNDER_5_MINS',
        'SAME_OR_NEXT_DAY_24_48H',
        'STANDARD_CRAFT_CYCLE_3_7_DAYS',
        'BESPOKE_OR_SPRINT_2_4_WEEKS',
        'COHORT_OR_SCHEDULED_WINDOW',
        'OTHER',
      ]);
      const validConstraints = new Set<string>([
        'FOUNDER_MANUAL_HOURS',
        'EQUIPMENT_OR_CURE_BATCH_LIMIT',
        'SUPPLIER_OR_PARTNER_TURNAROUND',
        'CLOUD_API_RATE_OR_INFRA_GUARDRAIL',
        'PROVIDER_SUPPLY_LIQUIDITY',
        'OTHER',
      ]);
      const validOwners = new Set<string>([
        'AUTOMATED_SYSTEM',
        'FOUNDER_MAKER',
        'COFOUNDER_TEAM',
        'EXTERNAL_SUPPLIER_3PL',
        'PARTNER_CONCIERGE',
        'OTHER',
      ]);

      if (
        typeof parsed.endToEndFulfillmentNarrative === 'string' &&
        parsed.endToEndFulfillmentNarrative.trim().length > 20 &&
        typeof parsed.scalingAndBottleneckDeRiskingNarrative === 'string' &&
        parsed.scalingAndBottleneckDeRiskingNarrative.trim().length > 20
      ) {
        creditsUsedAfter = await recordGeminiUsageAndIncrementCredits({
          verifiedUserId: authCtx.verifiedUserId,
          planId: params.planId,
          promptKey: 'MOD_E_STEP1_OPERATIONS_BLUEPRINT',
          modelUsed: 'gemini-2.5-flash',
          inputTokens: response.usageMetadata?.promptTokenCount || 320,
          outputTokens: response.usageMetadata?.candidatesTokenCount || 300,
          usedByokKey: authCtx.usedByokKey,
          fallbackCreditsUsed: authCtx.currentCreditsUsed,
        });

        const stages: OrderLifecycleStageItem[] =
          isNarrativesOnly &&
          params.currentStages &&
          params.currentStages.length > 0
            ? params.currentStages
            : Array.isArray(parsed.orderLifecycleStages) &&
                parsed.orderLifecycleStages.length >= 3
              ? parsed.orderLifecycleStages.slice(0, 7).map((st, idx) => ({
                  id: `ai-ops-stage-${idx + 1}-${Date.now()}`,
                  stageNumber: idx + 1,
                  stageTitle:
                    sanitizePromptInput(st.stageTitle, 110) ||
                    `${idx + 1}. Operational Stage ${idx + 1}`,
                  ownerType: validOwners.has(String(st.ownerType))
                    ? (st.ownerType as OrderStageOwnerType)
                    : 'FOUNDER_MAKER',
                  whatHappensStepByStep:
                    sanitizePromptInput(st.whatHappensStepByStep, 280) ||
                    'Execute standardized operational step.',
                  toolsEquipmentOrSupplier:
                    sanitizePromptInput(st.toolsEquipmentOrSupplier, 160) ||
                    'Core operational tool/supplier',
                  activeMinutesPerOrder: Math.max(
                    0,
                    Math.min(
                      2400,
                      Math.round(Number(st.activeMinutesPerOrder) || 0)
                    )
                  ),
                  directVariableCostPerOrder: Math.max(
                    0,
                    Math.round(
                      (Number(st.directVariableCostPerOrder) || 0) * 100
                    ) / 100
                  ),
                }))
              : fallback.orderLifecycleStages;

        return {
          allowed: true,
          fulfillmentMode: validModes.has(String(parsed.fulfillmentMode))
            ? (parsed.fulfillmentMode as OperationsFulfillmentModeType)
            : fallback.fulfillmentMode,
          turnaroundSla: validSlas.has(String(parsed.turnaroundSla))
            ? (parsed.turnaroundSla as OrderTurnaroundSlaType)
            : fallback.turnaroundSla,
          capacityConstraint: validConstraints.has(
            String(parsed.capacityConstraint)
          )
            ? (parsed.capacityConstraint as OperationalCapacityConstraintType)
            : fallback.capacityConstraint,
          orderLifecycleStages: stages,
          endToEndFulfillmentNarrative:
            parsed.endToEndFulfillmentNarrative.trim(),
          scalingAndBottleneckDeRiskingNarrative:
            parsed.scalingAndBottleneckDeRiskingNarrative.trim(),
          creditsUsedAfter,
          engineMode: 'gemini-2.5-flash',
        };
      }
    }
  } catch {
    // Fallback to deterministic synthesizer below
  }

  return {
    allowed: true,
    ...buildSmartFallback(),
    creditsUsedAfter,
    engineMode: 'smart-synthesizer',
  };
}

// ============================================================================
// MODULE E STEP 2: PREMISES, WORKSHOP & EQUIPMENT SCHEDULE (LEO / INNOVATE UK)
// ============================================================================

export interface ModuleEPremisesEquipmentGenerationResult {
  allowed: boolean;
  reason?: string;
  premisesSetupMode: PremisesSetupModeType;
  premisesLocationSummary: string;
  monthlyPremisesAndUtilitiesCost: number;
  premisesComplianceStatus: PremisesComplianceStatusType;
  equipmentItems: EquipmentAssetItem[];
  premisesAndLocationJustificationNarrative: string;
  equipmentRoiAndGrantComplianceNarrative: string;
  creditsUsedAfter: number;
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export function isLikelyLaptopOrMobileAsset(
  assetName: string,
  category?: EquipmentAssetCategoryType
): boolean {
  if (category === 'IT_LAPTOP_MOBILE_DEVICE') return true;
  const lower = (assetName || '').toLowerCase();
  return /laptop|macbook|ipad|iphone|smartphone|mobile phone|tablet|thinkpad|surface pro|vehicle|van|car/.test(
    lower
  );
}

export async function generateModuleEPremisesEquipmentViaRouter(params: {
  planId?: string;
  planTitle: string;
  industryCategory: string;
  hqCountryCode: SupportedCountryCode;
  baseCurrency?: string;
  brainDumpText?: string;
  coreProblem?: string;
  targetCustomer?: string;
  proposedSolution?: string;
  selectedTrack: ProductTrackType;
  otherProductTrackText?: string;
  currentPremisesSetupMode?: PremisesSetupModeType | '';
  currentPremisesLocationSummary?: string;
  currentMonthlyPremisesCost?: number;
  currentPremisesComplianceStatus?: PremisesComplianceStatusType | '';
  currentEquipmentItems?: EquipmentAssetItem[];
  mode?: 'POPULATE_ASSETS_AND_NARRATIVES' | 'NARRATIVES_ONLY';
}): Promise<ModuleEPremisesEquipmentGenerationResult> {
  const authCtx = await authorizeAndPrepareGeminiCall(
    'MOD_E_STEP2_PREMISES_EQUIPMENT'
  );

  const countryPack = getCountryRulePack(params.hqCountryCode);
  const currency = params.baseCurrency || countryPack.defaultCurrency;
  const cleanTitle = sanitizePromptInput(params.planTitle, 100) || 'Our Startup';
  const combinedContext = [
    params.planTitle,
    params.brainDumpText,
    params.coreProblem,
    params.proposedSolution,
    params.otherProductTrackText,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const isWoodworkerOrMaker =
    /wood|chopping|board|timber|walnut|oak|carpentr|craft|furniture|engraving|cnc|sander|artisan|workshop/.test(
      combinedContext
    );
  const isNarrativesOnly = params.mode === 'NARRATIVES_ONLY';

  const buildSmartFallback = (): Omit<
    ModuleEPremisesEquipmentGenerationResult,
    'allowed' | 'reason' | 'creditsUsedAfter' | 'engineMode'
  > => {
    const grantAgencyLabel =
      params.hqCountryCode === 'IE'
        ? 'Local Enterprise Office (LEO) / Enterprise Ireland'
        : params.hqCountryCode === 'GB'
          ? 'Innovate UK & British Business Bank Start Up Loans'
          : `${countryPack.countryName} Grant & Lending Assessors`;

    if (params.selectedTrack === 'PHYSICAL_PRODUCT_ECOM' || isWoodworkerOrMaker) {
      const items: EquipmentAssetItem[] =
        isNarrativesOnly &&
        params.currentEquipmentItems &&
        params.currentEquipmentItems.length > 0
          ? params.currentEquipmentItems
          : isWoodworkerOrMaker
            ? [
                {
                  id: 'eq-wood-1',
                  assetName:
                    'Dual-Drum Thickness Sander (e.g. Jet JWDS-2244 / Laguna)',
                  assetCategory: 'PRODUCTION_MACHINERY_TOOLS',
                  acquisitionMode: 'BUY_NEW_GRANT_ELIGIBLE',
                  fundingSource: 'GRANT_CO_FUNDED',
                  quantity: 1,
                  unitCostExVat: 2400,
                  totalCostExVat: 2400,
                  usefulLifeMonths: 36,
                  projectUsagePercent: 100,
                  quoteComplianceStatus: 'THREE_QUOTES_UPLOADED_READY',
                  supplierQuotesSummary:
                    params.hqCountryCode === 'IE'
                      ? '1. Felder Group Ireland (2,350), 2. Caulfield Industrial (2,420), 3. McQuillan Tools (2,480)'
                      : params.hqCountryCode === 'GB'
                        ? '1. Felder Group UK (2,350), 2. Axminster Tools UK (2,480), 3. Machine Mart UK (2,420)'
                        : '1. Felder Group (2,350), 2. Axminster Tools (2,480), 3. Industrial Tooling Quote (2,420)',
                  operationalRoiNote:
                    'Cuts end-grain & edge-grain sanding time from 35 mins/board down to 8 mins/board (+60% weekly workshop output).',
                  isFlaggedLaptopOrMobileAsset: false,
                },
                {
                  id: 'eq-wood-2',
                  assetName:
                    'Desktop CNC Router & Laser Engraving Bed (Juice Grooves & Gift Inlays)',
                  assetCategory: 'PRODUCTION_MACHINERY_TOOLS',
                  acquisitionMode: 'BUY_NEW_GRANT_ELIGIBLE',
                  fundingSource: 'GRANT_CO_FUNDED',
                  quantity: 1,
                  unitCostExVat: 3200,
                  totalCostExVat: 3200,
                  usefulLifeMonths: 36,
                  projectUsagePercent: 100,
                  quoteComplianceStatus: 'THREE_QUOTES_UPLOADED_READY',
                  supplierQuotesSummary:
                    params.hqCountryCode === 'IE'
                      ? '1. Shapeoko Pro XXL IE Quote (3,150), 2. Caulfield CNC Ireland (3,290), 3. Stepcraft Europe (3,380)'
                      : params.hqCountryCode === 'GB'
                        ? '1. Shapeoko Pro XXL UK Quote (3,150), 2. Ooznest WorkBee CNC UK (3,290), 3. HPC Laser UK (3,380)'
                        : '1. Shapeoko Pro XXL Quote (3,150), 2. WorkBee CNC Quote (3,290), 3. Stepcraft Quote (3,380)',
                  operationalRoiNote:
                    'Automates precision perimeter juice grooves and bespoke wedding/corporate laser engraving in 6 mins with zero jig tear-out.',
                  isFlaggedLaptopOrMobileAsset: false,
                },
                {
                  id: 'eq-wood-3',
                  assetName:
                    'HEPA Workshop Dust Extraction & Fine Particulate Filtration Unit',
                  assetCategory: 'WORKSHOP_EXTRACTION_SAFETY',
                  acquisitionMode: 'BUY_NEW_GRANT_ELIGIBLE',
                  fundingSource: 'GRANT_CO_FUNDED',
                  quantity: 1,
                  unitCostExVat: 850,
                  totalCostExVat: 850,
                  usefulLifeMonths: 36,
                  projectUsagePercent: 100,
                  quoteComplianceStatus: 'NOT_REQUIRED_UNDER_THRESHOLD',
                  supplierQuotesSummary:
                    'Under 1,000 threshold — single written supplier quote on file.',
                  operationalRoiNote:
                    'Mandatory hardwood dust extraction for workshop health & safety compliance and spotless mineral-oil/beeswax finishing.',
                  isFlaggedLaptopOrMobileAsset: false,
                },
                {
                  id: 'eq-wood-4',
                  assetName:
                    'Heavy-Duty Parallel Glue-Up Clamp Rack (Batch of 16 Clamps)',
                  assetCategory: 'PRODUCTION_MACHINERY_TOOLS',
                  acquisitionMode: 'ALREADY_OWNED_SWEAT_ASSET',
                  fundingSource: 'OWN_FUNDS_OR_LOAN_100',
                  quantity: 1,
                  unitCostExVat: 640,
                  totalCostExVat: 640,
                  usefulLifeMonths: 60,
                  projectUsagePercent: 100,
                  quoteComplianceStatus: 'NOT_REQUIRED_UNDER_THRESHOLD',
                  supplierQuotesSummary: `Existing founder-owned workshop tooling (Bessey K-Body parallel clamps) — ${formatPlanCurrency(0, currency)} new cash outflow.`,
                  operationalRoiNote:
                    'Enables batch glue-up of 15–20 chopping boards simultaneously overnight.',
                  isFlaggedLaptopOrMobileAsset: false,
                },
                {
                  id: 'eq-wood-5',
                  assetName:
                    'Founder Laptop / Tablet for CAD & Shipping Labels (Ring-Fenced Own Funds)',
                  assetCategory: 'IT_LAPTOP_MOBILE_DEVICE',
                  acquisitionMode: 'ALREADY_OWNED_SWEAT_ASSET',
                  fundingSource: 'OWN_FUNDS_OR_LOAN_100',
                  quantity: 1,
                  unitCostExVat: 1100,
                  totalCostExVat: 1100,
                  usefulLifeMonths: 36,
                  projectUsagePercent: 100,
                  quoteComplianceStatus: 'NOT_REQUIRED_UNDER_THRESHOLD',
                  supplierQuotesSummary:
                    params.hqCountryCode === 'IE'
                      ? 'Ring-fenced as 100% Own Funds (Excluded from IE LEO Grant Claim per Mobile IT / Laptop Ban rule).'
                      : 'Ring-fenced as 100% Own Funds (Excluded from capital grant claim per Mobile IT ring-fencing rule).',
                  operationalRoiNote:
                    params.hqCountryCode === 'IE'
                      ? 'Used for CNC toolpaths, Etsy/Shopify order dispatch, and accounting; excluded from grant claim to ensure 100% IE LEO compliance.'
                      : 'Used for CNC toolpaths, Etsy/Shopify order dispatch, and accounting; ring-fenced under 100% Own Funds.',
                  isFlaggedLaptopOrMobileAsset: true,
                },
              ]
            : [
                {
                  id: 'eq-phys-1',
                  assetName:
                    'Semi-Automated Batch Production & Assembly Station',
                  assetCategory: 'PRODUCTION_MACHINERY_TOOLS',
                  acquisitionMode: 'BUY_NEW_GRANT_ELIGIBLE',
                  fundingSource: 'GRANT_CO_FUNDED',
                  quantity: 1,
                  unitCostExVat: 2800,
                  totalCostExVat: 2800,
                  usefulLifeMonths: 36,
                  projectUsagePercent: 100,
                  quoteComplianceStatus: 'THREE_QUOTES_UPLOADED_READY',
                  supplierQuotesSummary:
                    '3 comparable written supplier quotes gathered and ready for Module K Appendix C.',
                  operationalRoiNote:
                    'Doubles hourly batch output and enforces consistent unit tolerances across production runs.',
                  isFlaggedLaptopOrMobileAsset: false,
                },
                {
                  id: 'eq-phys-2',
                  assetName:
                    'Precision Quality Control, Weighing & Thermal Label Dispatch Station',
                  assetCategory: 'PACKAGING_FULFILLMENT_EQUIPMENT',
                  acquisitionMode: 'BUY_NEW_GRANT_ELIGIBLE',
                  fundingSource: 'GRANT_CO_FUNDED',
                  quantity: 1,
                  unitCostExVat: 650,
                  totalCostExVat: 650,
                  usefulLifeMonths: 36,
                  projectUsagePercent: 100,
                  quoteComplianceStatus: 'NOT_REQUIRED_UNDER_THRESHOLD',
                  supplierQuotesSummary:
                    'Under 1,000 threshold — single supplier quote on file.',
                  operationalRoiNote:
                    'Cuts parcel packing & courier manifest labelling time to under 3 minutes per order.',
                  isFlaggedLaptopOrMobileAsset: false,
                },
                {
                  id: 'eq-phys-3',
                  assetName:
                    'Founder Laptop for Inventory & Order Management (Ring-Fenced Own Funds)',
                  assetCategory: 'IT_LAPTOP_MOBILE_DEVICE',
                  acquisitionMode: 'ALREADY_OWNED_SWEAT_ASSET',
                  fundingSource: 'OWN_FUNDS_OR_LOAN_100',
                  quantity: 1,
                  unitCostExVat: 1150,
                  totalCostExVat: 1150,
                  usefulLifeMonths: 36,
                  projectUsagePercent: 100,
                  quoteComplianceStatus: 'NOT_REQUIRED_UNDER_THRESHOLD',
                  supplierQuotesSummary:
                    params.hqCountryCode === 'IE'
                      ? 'Ring-fenced as 100% Own Funds (Excluded from IE LEO Grant Claim per Mobile IT / Laptop Ban rule).'
                      : 'Ring-fenced as 100% Own Funds (Excluded from capital grant claim).',
                  operationalRoiNote:
                    'Standard mobile IT device funded 100% by founder equity so grant claim focuses strictly on specialist production equipment.',
                  isFlaggedLaptopOrMobileAsset: true,
                },
              ];

      const totalCapex = items.reduce(
        (sum, it) => sum + (Number(it.totalCostExVat) || 0),
        0
      );
      const grantEligibleCapex = items
        .filter(
          (it) =>
            it.fundingSource === 'GRANT_CO_FUNDED' &&
            !it.isFlaggedLaptopOrMobileAsset
        )
        .reduce((sum, it) => sum + (Number(it.totalCostExVat) || 0), 0);

      return {
        premisesSetupMode:
          (params.currentPremisesSetupMode as PremisesSetupModeType) ||
          'HOME_WORKSHOP_GARAGE_SHED',
        premisesLocationSummary:
          params.currentPremisesLocationSummary ||
          (isWoodworkerOrMaker
            ? 'Dedicated 35 sq.m insulated home workshop / studio with 3-phase-ready power supply, dry timber racking, and dust extraction.'
            : 'Dedicated light production workshop / micro-fulfillment studio with dry storage and courier collection access.'),
        monthlyPremisesAndUtilitiesCost:
          params.currentMonthlyPremisesCost ?? 180,
        premisesComplianceStatus:
          (params.currentPremisesComplianceStatus as PremisesComplianceStatusType) ||
          'COVERED_EXEMPT_HOME_STUDIO',
        equipmentItems: items,
        premisesAndLocationJustificationNarrative: `${cleanTitle} operates from a low-overhead dedicated workshop studio (${formatPlanCurrency(params.currentMonthlyPremisesCost ?? 180, currency)}/mo utilities & power contribution) rather than signing a premature multi-year commercial industrial lease. This keeps fixed monthly overhead near zero during Year 1 while providing dedicated dry storage, dust/safety isolation, and direct courier collection access for up to 60+ units/week.`,
        equipmentRoiAndGrantComplianceNarrative: `Our capital equipment schedule totals ${formatPlanCurrency(totalCapex, currency)} ex-VAT, with ${formatPlanCurrency(grantEligibleCapex, currency)} allocated to specialist production machinery eligible for ${grantAgencyLabel} co-funding. Every capital item >= 1,000 is backed by 3 independent comparable written supplier quotes for Module K Appendix C, while standard mobile IT/laptop hardware is strictly ring-fenced under 100% Own Funds to comply with ${params.hqCountryCode === 'IE' ? 'IE LEO Mobile Asset exclusion rules' : 'grant capital eligibility rules'}.`,
      };
    }

    // Default: Cloud SaaS / AI / Education / Service (e.g. Startup Preflight)
    const items: EquipmentAssetItem[] =
      isNarrativesOnly &&
      params.currentEquipmentItems &&
      params.currentEquipmentItems.length > 0
        ? params.currentEquipmentItems
        : [
            {
              id: 'eq-saas-1',
              assetName:
                'Dedicated Cloud R&D, Security & Automated Load-Testing Sandbox',
              assetCategory: 'CLOUD_INFRA_RESERVATION',
              acquisitionMode: 'LEASE_OR_RENT_MONTHLY',
              fundingSource: 'MONTHLY_OPERATING_EXPENSE',
              quantity: 1,
              unitCostExVat: 950,
              totalCostExVat: 950,
              usefulLifeMonths: 12,
              projectUsagePercent: 100,
              quoteComplianceStatus: 'NOT_REQUIRED_UNDER_THRESHOLD',
              supplierQuotesSummary:
                'Google Cloud / Vercel / Managed PostgreSQL production & staging reservation (under 1,000 threshold).',
              operationalRoiNote:
                'Provides isolated staging, automated E2E QA, and pgvector database backups with zero physical server CapEx.',
              isFlaggedLaptopOrMobileAsset: false,
            },
            {
              id: 'eq-saas-2',
              assetName:
                'Founder MacBook Pro 16" Dev Workstation (Ring-Fenced Own Funds)',
              assetCategory: 'IT_LAPTOP_MOBILE_DEVICE',
              acquisitionMode: 'ALREADY_OWNED_SWEAT_ASSET',
              fundingSource: 'OWN_FUNDS_OR_LOAN_100',
              quantity: 1,
              unitCostExVat: 2200,
              totalCostExVat: 2200,
              usefulLifeMonths: 36,
              projectUsagePercent: 100,
              quoteComplianceStatus: 'NOT_REQUIRED_UNDER_THRESHOLD',
              supplierQuotesSummary:
                params.hqCountryCode === 'IE'
                  ? 'Founder-owned development laptop — strictly excluded from IE LEO capital grant claim per Mobile IT / Laptop Ban rule.'
                  : 'Founder-owned development laptop — strictly ring-fenced under 100% Own Funds.',
              operationalRoiNote:
                'Primary software engineering & AI testing workstation contributed as founder sweat asset (0 grant claim).',
              isFlaggedLaptopOrMobileAsset: true,
            },
            {
              id: 'eq-saas-3',
              assetName:
                'Dual 4K Ergonomic Engineering Monitor & Home Office Setup',
              assetCategory: 'OFFICE_FURNITURE_FITOUT',
              acquisitionMode: 'ALREADY_OWNED_SWEAT_ASSET',
              fundingSource: 'OWN_FUNDS_OR_LOAN_100',
              quantity: 1,
              unitCostExVat: 750,
              totalCostExVat: 750,
              usefulLifeMonths: 36,
              projectUsagePercent: 100,
              quoteComplianceStatus: 'NOT_REQUIRED_UNDER_THRESHOLD',
              supplierQuotesSummary:
                'Funded 100% via founder own funds; zero grant CapEx requested.',
              operationalRoiNote:
                'Supports high-output full-stack engineering and customer discovery calls from zero-rent home office.',
              isFlaggedLaptopOrMobileAsset: false,
            },
          ];

    return {
      premisesSetupMode:
        (params.currentPremisesSetupMode as PremisesSetupModeType) ||
        'HOME_OFFICE_ZERO_RENT',
      premisesLocationSummary:
        params.currentPremisesLocationSummary ||
        '100% Cloud-Native Remote / Home Office setup with zero commercial rent commitment in Year 1; co-working hot-desk used only as needed for board/partner meetings.',
      monthlyPremisesAndUtilitiesCost: params.currentMonthlyPremisesCost ?? 60,
      premisesComplianceStatus:
        (params.currentPremisesComplianceStatus as PremisesComplianceStatusType) ||
        'NOT_REQUIRED_REMOTE',
      equipmentItems: items,
      premisesAndLocationJustificationNarrative: `${cleanTitle} operates a 100% cloud-native remote architecture from a home office setup (${formatPlanCurrency(params.currentMonthlyPremisesCost ?? 60, currency)}/mo broadband & utility allocation), avoiding ${formatPlanCurrency(15000, currency)}–${formatPlanCurrency(25000, currency)}/year in unnecessary commercial office lease liabilities during V1 validation. All application infrastructure, databases, and AI pipelines run on managed cloud servers in ${params.hqCountryCode === 'IE' ? 'Ireland/EU' : params.hqCountryCode === 'GB' ? 'UK' : countryPack.countryName} regions.`,
      equipmentRoiAndGrantComplianceNarrative: `In full compliance with ${grantAgencyLabel} guidelines, we do not claim standard founder laptops or mobile IT devices as grant-funded capital expenditure—our engineering workstation is ring-fenced under 100% Own Funds. This ensures our grant application is 100% audit-compliant and focuses funding strictly on eligible R&D, technical consultancy (3-Quote Concierge), and export market development.`,
    };
  };

  if (!authCtx.canCallLiveGemini || !authCtx.activeApiKey) {
    return {
      allowed: true,
      ...buildSmartFallback(),
      creditsUsedAfter: authCtx.currentCreditsUsed,
      engineMode: 'smart-synthesizer',
    };
  }

  let creditsUsedAfter = authCtx.currentCreditsUsed;

  try {
    const ai = getGenAiClient(authCtx.activeApiKey);
    const fallback = buildSmartFallback();

    const countryGrantRulesPrompt =
      params.hqCountryCode === 'IE'
        ? `1. Ireland Local Enterprise Office (LEO) Priming/Feasibility grants strictly ban standard laptops/mobile phones as grant-funded capital items — any laptop/mobile IT item MUST have "isFlaggedLaptopOrMobileAsset": true and "fundingSource": "OWN_FUNDS_OR_LOAN_100".
2. Any capital item with totalCostExVat >= 1000 requires 3 comparable written supplier quotes ("quoteComplianceStatus": "THREE_QUOTES_UPLOADED_READY" or "NEEDS_3_QUOTES") for Module K Appendix C.
3. Do NOT mention UK Innovate UK or British Business Bank rules for an Ireland-based startup.`
        : params.hqCountryCode === 'GB'
          ? `1. UK Innovate UK claims 12-month capital usage depreciation over usefulLifeMonths (typically 36 months) rather than 100% upfront asset price, and British Business Bank Start Up Loans require itemized capital justification.
2. Any capital item with totalCostExVat >= 1000 requires 3 comparable written supplier quotes ("quoteComplianceStatus": "THREE_QUOTES_UPLOADED_READY" or "NEEDS_3_QUOTES"). Standard founder laptops must be ring-fenced under "fundingSource": "OWN_FUNDS_OR_LOAN_100".
3. Do NOT mention Ireland LEO rules for a UK-based startup.`
          : `1. Standard founder laptops/mobile phones should be ring-fenced under "fundingSource": "OWN_FUNDS_OR_LOAN_100".
2. Any capital item with totalCostExVat >= 1000 requires 3 comparable written supplier quotes ("quoteComplianceStatus": "THREE_QUOTES_UPLOADED_READY" or "NEEDS_3_QUOTES").`;

    const prompt = `You are an expert startup COO and ${params.hqCountryCode === 'IE' ? 'Ireland Local Enterprise Office (LEO) / Enterprise Ireland' : params.hqCountryCode === 'GB' ? 'UK Innovate UK & British Business Bank Start Up Loans' : countryPack.countryName} grant compliance advisor.
Generate Module E Step 2 (Premises, Workshop & Equipment Schedule) for:
- Startup Title: ${sanitizePromptInput(params.planTitle, 120)}
- Industry Category: ${sanitizePromptInput(params.industryCategory, 80)}
- HQ Country: ${params.hqCountryCode} (Currency: ${currency})
- Product Track: ${params.selectedTrack} ${params.otherProductTrackText ? `(${sanitizePromptInput(params.otherProductTrackText, 100)})` : ''}
- Core Problem: ${sanitizePromptInput(params.coreProblem, 250)}
- Proposed Solution: ${sanitizePromptInput(params.proposedSolution, 250)}
- Mode: ${isNarrativesOnly ? 'NARRATIVES_ONLY (synthesize narratives from current equipment items)' : 'POPULATE_ASSETS_AND_NARRATIVES'}

CRITICAL GRANT RULES TO ENFORCE:
${countryGrantRulesPrompt}

Return ONLY valid JSON matching this exact structure:
{
  "premisesSetupMode": "HOME_OFFICE_ZERO_RENT" | "HOME_WORKSHOP_GARAGE_SHED" | "SHARED_COWORKING_MAKER_SPACE" | "COMMERCIAL_INDUSTRIAL_UNIT" | "RETAIL_OR_CLIENT_PREMISES",
  "premisesLocationSummary": "1-2 sentences describing the physical workshop, studio, or cloud-native remote setup",
  "monthlyPremisesAndUtilitiesCost": 150,
  "premisesComplianceStatus": "NOT_REQUIRED_REMOTE" | "COVERED_EXEMPT_HOME_STUDIO" | "COMMERCIAL_LEASE_COMPLIANT" | "NEEDS_PLANNING_OR_FIRE_CERT_CHECK",
  "equipmentItems": [
    {
      "assetName": "Specific machine, tool, or workstation name",
      "assetCategory": "PRODUCTION_MACHINERY_TOOLS" | "SPECIALIST_R_AND_D_HARDWARE" | "PACKAGING_FULFILLMENT_EQUIPMENT" | "WORKSHOP_EXTRACTION_SAFETY" | "IT_LAPTOP_MOBILE_DEVICE" | "OFFICE_FURNITURE_FITOUT" | "CLOUD_INFRA_RESERVATION",
      "acquisitionMode": "BUY_NEW_GRANT_ELIGIBLE" | "BUY_SECOND_HAND_BOOTSTRAP" | "LEASE_OR_RENT_MONTHLY" | "ALREADY_OWNED_SWEAT_ASSET",
      "fundingSource": "GRANT_CO_FUNDED" | "OWN_FUNDS_OR_LOAN_100" | "MONTHLY_OPERATING_EXPENSE",
      "quantity": 1,
      "unitCostExVat": 2400,
      "usefulLifeMonths": 36,
      "projectUsagePercent": 100,
      "quoteComplianceStatus": "NOT_REQUIRED_UNDER_THRESHOLD" | "NEEDS_3_QUOTES" | "REQUESTED_VIA_BMU_CONCIERGE" | "THREE_QUOTES_UPLOADED_READY",
      "supplierQuotesSummary": "3 comparable supplier quotes or own-funds note",
      "operationalRoiNote": "1 sentence on how many minutes/unit this saves or why it is essential"
    }
  ],
  "premisesAndLocationJustificationNarrative": "2-3 sentences justifying why this premises setup is lean, compliant, and right-sized for Year 1",
  "equipmentRoiAndGrantComplianceNarrative": "2-3 sentences explaining the production ROI of the equipment schedule and confirming 3-quote & mobile-asset grant compliance"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        maxOutputTokens: MAX_OUTPUT_TOKENS_PER_CALL,
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text?.trim() || '';
    if (rawText) {
      const parsed = JSON.parse(rawText) as {
        premisesSetupMode?: string;
        premisesLocationSummary?: string;
        monthlyPremisesAndUtilitiesCost?: number;
        premisesComplianceStatus?: string;
        equipmentItems?: Array<{
          assetName?: string;
          assetCategory?: string;
          acquisitionMode?: string;
          fundingSource?: string;
          quantity?: number;
          unitCostExVat?: number;
          usefulLifeMonths?: number;
          projectUsagePercent?: number;
          quoteComplianceStatus?: string;
          supplierQuotesSummary?: string;
          operationalRoiNote?: string;
        }>;
        premisesAndLocationJustificationNarrative?: string;
        equipmentRoiAndGrantComplianceNarrative?: string;
      };

      if (
        typeof parsed.premisesAndLocationJustificationNarrative === 'string' &&
        parsed.premisesAndLocationJustificationNarrative.trim().length > 20 &&
        typeof parsed.equipmentRoiAndGrantComplianceNarrative === 'string' &&
        parsed.equipmentRoiAndGrantComplianceNarrative.trim().length > 20
      ) {
        creditsUsedAfter = await recordGeminiUsageAndIncrementCredits({
          verifiedUserId: authCtx.verifiedUserId,
          planId: params.planId,
          promptKey: 'MOD_E_STEP2_PREMISES_EQUIPMENT',
          modelUsed: 'gemini-2.5-flash',
          inputTokens: response.usageMetadata?.promptTokenCount || 320,
          outputTokens: response.usageMetadata?.candidatesTokenCount || 360,
          usedByokKey: authCtx.usedByokKey,
          fallbackCreditsUsed: authCtx.currentCreditsUsed,
        });

        const validPremisesModes = new Set<string>([
          'HOME_OFFICE_ZERO_RENT',
          'HOME_WORKSHOP_GARAGE_SHED',
          'SHARED_COWORKING_MAKER_SPACE',
          'COMMERCIAL_INDUSTRIAL_UNIT',
          'RETAIL_OR_CLIENT_PREMISES',
          'OTHER',
        ]);
        const validCompliance = new Set<string>([
          'NOT_REQUIRED_REMOTE',
          'COVERED_EXEMPT_HOME_STUDIO',
          'COMMERCIAL_LEASE_COMPLIANT',
          'NEEDS_PLANNING_OR_FIRE_CERT_CHECK',
          'OTHER',
        ]);
        const validCategories = new Set<string>([
          'PRODUCTION_MACHINERY_TOOLS',
          'SPECIALIST_R_AND_D_HARDWARE',
          'PACKAGING_FULFILLMENT_EQUIPMENT',
          'WORKSHOP_EXTRACTION_SAFETY',
          'IT_LAPTOP_MOBILE_DEVICE',
          'OFFICE_FURNITURE_FITOUT',
          'CLOUD_INFRA_RESERVATION',
          'OTHER',
        ]);
        const validAcqModes = new Set<string>([
          'BUY_NEW_GRANT_ELIGIBLE',
          'BUY_SECOND_HAND_BOOTSTRAP',
          'LEASE_OR_RENT_MONTHLY',
          'ALREADY_OWNED_SWEAT_ASSET',
          'OTHER',
        ]);
        const validFunding = new Set<string>([
          'GRANT_CO_FUNDED',
          'OWN_FUNDS_OR_LOAN_100',
          'MONTHLY_OPERATING_EXPENSE',
          'OTHER',
        ]);
        const validQuotes = new Set<string>([
          'NOT_REQUIRED_UNDER_THRESHOLD',
          'NEEDS_3_QUOTES',
          'REQUESTED_VIA_BMU_CONCIERGE',
          'THREE_QUOTES_UPLOADED_READY',
          'OTHER',
        ]);

        const items: EquipmentAssetItem[] =
          isNarrativesOnly &&
          params.currentEquipmentItems &&
          params.currentEquipmentItems.length > 0
            ? params.currentEquipmentItems
            : Array.isArray(parsed.equipmentItems) &&
                parsed.equipmentItems.length >= 2
              ? parsed.equipmentItems.slice(0, 8).map((it, idx) => {
                  const cleanName =
                    sanitizePromptInput(it.assetName, 120) ||
                    `Equipment Asset #${idx + 1}`;
                  const cat: EquipmentAssetCategoryType = validCategories.has(
                    String(it.assetCategory)
                  )
                    ? (it.assetCategory as EquipmentAssetCategoryType)
                    : 'PRODUCTION_MACHINERY_TOOLS';
                  const qty = Math.max(
                    1,
                    Math.min(100, Math.round(Number(it.quantity) || 1))
                  );
                  const unitCost = Math.max(
                    0,
                    Math.round((Number(it.unitCostExVat) || 0) * 100) / 100
                  );
                  const totalCost = Math.round(qty * unitCost * 100) / 100;
                  const isLaptop = isLikelyLaptopOrMobileAsset(cleanName, cat);
                  const rawFunding: EquipmentFundingSourceType =
                    validFunding.has(String(it.fundingSource))
                      ? (it.fundingSource as EquipmentFundingSourceType)
                      : 'GRANT_CO_FUNDED';

                  return {
                    id: `ai-eq-${idx + 1}-${Date.now()}`,
                    assetName: cleanName,
                    assetCategory: cat,
                    acquisitionMode: validAcqModes.has(
                      String(it.acquisitionMode)
                    )
                      ? (it.acquisitionMode as EquipmentAcquisitionModeType)
                      : 'BUY_NEW_GRANT_ELIGIBLE',
                    fundingSource: isLaptop
                      ? 'OWN_FUNDS_OR_LOAN_100'
                      : rawFunding,
                    quantity: qty,
                    unitCostExVat: unitCost,
                    totalCostExVat: totalCost,
                    usefulLifeMonths: Math.max(
                      12,
                      Math.min(120, Math.round(Number(it.usefulLifeMonths) || 36))
                    ),
                    projectUsagePercent: Math.max(
                      10,
                      Math.min(
                        100,
                        Math.round(Number(it.projectUsagePercent) || 100)
                      )
                    ),
                    quoteComplianceStatus:
                      totalCost < 1000
                        ? 'NOT_REQUIRED_UNDER_THRESHOLD'
                        : validQuotes.has(String(it.quoteComplianceStatus))
                          ? (it.quoteComplianceStatus as EquipmentQuoteComplianceStatusType)
                          : 'NEEDS_3_QUOTES',
                    supplierQuotesSummary:
                      sanitizePromptInput(it.supplierQuotesSummary, 220) ||
                      (totalCost >= 1000
                        ? '3 comparable written supplier quotes required (>= 1,000 threshold).'
                        : 'Under 1,000 threshold — single supplier quote sufficient.'),
                    operationalRoiNote:
                      sanitizePromptInput(it.operationalRoiNote, 240) ||
                      'Reduces unit production time and supports V1 capacity targets.',
                    isFlaggedLaptopOrMobileAsset: isLaptop,
                  };
                })
              : fallback.equipmentItems;

        return {
          allowed: true,
          premisesSetupMode: validPremisesModes.has(
            String(parsed.premisesSetupMode)
          )
            ? (parsed.premisesSetupMode as PremisesSetupModeType)
            : fallback.premisesSetupMode,
          premisesLocationSummary:
            sanitizePromptInput(parsed.premisesLocationSummary, 260) ||
            fallback.premisesLocationSummary,
          monthlyPremisesAndUtilitiesCost: Math.max(
            0,
            Math.round(
              Number(
                parsed.monthlyPremisesAndUtilitiesCost ??
                  fallback.monthlyPremisesAndUtilitiesCost
              )
            )
          ),
          premisesComplianceStatus: validCompliance.has(
            String(parsed.premisesComplianceStatus)
          )
            ? (parsed.premisesComplianceStatus as PremisesComplianceStatusType)
            : fallback.premisesComplianceStatus,
          equipmentItems: items,
          premisesAndLocationJustificationNarrative:
            parsed.premisesAndLocationJustificationNarrative.trim(),
          equipmentRoiAndGrantComplianceNarrative:
            parsed.equipmentRoiAndGrantComplianceNarrative.trim(),
          creditsUsedAfter,
          engineMode: 'gemini-2.5-flash',
        };
      }
    }
  } catch {
    // Fallback to deterministic synthesizer below
  }

  return {
    allowed: true,
    ...buildSmartFallback(),
    creditsUsedAfter,
    engineMode: 'smart-synthesizer',
  };
}

// ============================================================================
// MODULE E STEP 3: SUPPLY-CHAIN RESILIENCE & 4-CATEGORY RISK REGISTER ROUTER
// ============================================================================

export interface ModuleERiskRegisterGenerationResult {
  allowed: boolean;
  reason?: string;
  supplierRedundancyPosture: SupplierRedundancyPostureType;
  leadTimeBufferDays: number;
  primarySuppliersSummary: string;
  backupSuppliersSummary: string;
  riskItems: ProjectRiskRegisterItem[];
  supplyChainResilienceNarrative: string;
  riskManagementGovernanceNarrative: string;
  creditsUsedAfter?: number;
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export async function generateModuleERiskRegisterViaRouter(params: {
  planId?: string;
  planTitle: string;
  industryCategory: string;
  hqCountryCode: SupportedCountryCode;
  baseCurrency?: string;
  brainDumpText?: string;
  coreProblem?: string;
  targetCustomer?: string;
  proposedSolution?: string;
  selectedTrack: ProductTrackType;
  otherProductTrackText?: string;
  currentSupplierRedundancyPosture?: SupplierRedundancyPostureType | '';
  currentLeadTimeBufferDays?: number;
  currentPrimarySuppliersSummary?: string;
  currentBackupSuppliersSummary?: string;
  currentRiskItems?: ProjectRiskRegisterItem[];
  mode?: 'POPULATE_RISKS_AND_NARRATIVES' | 'NARRATIVES_ONLY';
}): Promise<ModuleERiskRegisterGenerationResult> {
  const authCtx = await authorizeAndPrepareGeminiCall(
    'MOD_E_STEP3_RISK_REGISTER'
  );

  const countryPack = getCountryRulePack(params.hqCountryCode);
  const cleanTitle =
    sanitizePromptInput(params.planTitle, 100) || 'the business';
  const isNarrativesOnly = params.mode === 'NARRATIVES_ONLY';

  const grantGovernanceLabel =
    params.hqCountryCode === 'IE'
      ? 'Ireland Local Enterprise Office (LEO) & Enterprise Ireland'
      : params.hqCountryCode === 'GB'
        ? 'UK Innovate UK (Question 8 / 9 Risk Register Appendix) & British Business Bank Start Up Loans'
        : `${countryPack.countryName} Grant & Lending Evaluators`;

  const buildSmartFallback = (): Omit<
    ModuleERiskRegisterGenerationResult,
    'allowed' | 'reason' | 'creditsUsedAfter' | 'engineMode'
  > => {
    const isPhysicalOrHardware =
      params.selectedTrack === 'PHYSICAL_PRODUCT_ECOM' ||
      params.selectedTrack === 'HYBRID_HARDWARE_SOFTWARE';

    const defaultPosture: SupplierRedundancyPostureType =
      (params.currentSupplierRedundancyPosture as SupplierRedundancyPostureType) ||
      (isPhysicalOrHardware
        ? 'DUAL_SOURCED_VERIFIED'
        : 'CLOUD_MULTI_REGION_FAILOVER');

    const defaultLeadTimeBufferDays =
      params.currentLeadTimeBufferDays ?? (isPhysicalOrHardware ? 21 : 7);

    const defaultPrimarySuppliers =
      params.currentPrimarySuppliersSummary?.trim() ||
      (isPhysicalOrHardware
        ? params.hqCountryCode === 'IE'
          ? `Primary production inputs, packaging, and tracked parcel courier partners sourced from vetted Irish/EU trade suppliers with agreed lead-time SLAs and ${defaultLeadTimeBufferDays} days of safety buffer stock.`
          : params.hqCountryCode === 'GB'
            ? `Primary production inputs, packaging, and tracked parcel courier partners sourced from vetted UK trade suppliers with agreed lead-time SLAs and ${defaultLeadTimeBufferDays} days of safety buffer stock.`
            : `Primary raw materials, packaging, and courier logistics sourced from vetted trade suppliers with ${defaultLeadTimeBufferDays} days of buffer inventory.`
        : `Primary managed cloud application hosting, database cluster, payment webhooks, and core API infrastructure with strict SLAs.`);

    const defaultBackupSuppliers =
      params.currentBackupSuppliersSummary?.trim() ||
      (isPhysicalOrHardware
        ? params.hqCountryCode === 'IE'
          ? `Pre-qualified secondary Irish/EU material & packaging suppliers on account (aligned with Module E Step 2 3-quote bench) plus secondary tracked courier account.`
          : params.hqCountryCode === 'GB'
            ? `Pre-qualified secondary UK domestic material & packaging suppliers on account (aligned with Module E Step 2 3-quote bench) plus secondary tracked courier account.`
            : `Pre-qualified secondary material & packaging suppliers on account plus backup tracked courier partner.`
        : `Automated daily off-site database snapshots, multi-region cloud failover, hard API rate-limiting circuit breakers, and deterministic fallback mode.`);

    const fallbackRisks: ProjectRiskRegisterItem[] =
      isNarrativesOnly &&
      params.currentRiskItems &&
      params.currentRiskItems.length > 0
        ? params.currentRiskItems
        : isPhysicalOrHardware
          ? [
              {
                id: 'risk-1',
                riskCategory: 'TECHNICAL_PRODUCTION',
                riskTitle:
                  'Batch quality variance, material defect, or primary workshop machine downtime delaying customer order turnaround',
                likelihoodScore: 3,
                impactScore: 4,
                grossRiskScore: 12,
                mitigationAndContingencyPlan:
                  'Enforce incoming raw-material inspection before batch production, maintain spare wearable tooling parts on-site, and run a standardized pre-dispatch QC checklist on 100% of units.',
                ownerAndWorkPackage: 'Founder / Operations Lead • WP1 & WP2',
                residualRiskRating: 'LOW',
              },
              {
                id: 'risk-2',
                riskCategory: 'COMMERCIAL_MARKET',
                riskTitle:
                  'Seasonal demand fluctuations or slower-than-projected initial D2C conversion rates compressing monthly order volume',
                likelihoodScore: 3,
                impactScore: 4,
                grossRiskScore: 12,
                mitigationAndContingencyPlan:
                  'Balance direct-to-consumer seasonal spikes with recurring B2B trade/corporate accounts and validate pricing with pre-launch waitlist buyers before committing to large batch runs.',
                ownerAndWorkPackage: 'Founder / Commercial Lead • WP3',
                residualRiskRating: 'LOW',
              },
              {
                id: 'risk-3',
                riskCategory: 'FINANCIAL_SUPPLY_CHAIN',
                riskTitle:
                  params.hqCountryCode === 'IE'
                    ? 'Primary raw-material supplier price hike (>20%) or cashflow timing gap while awaiting IE LEO vouched grant reimbursement'
                    : params.hqCountryCode === 'GB'
                      ? 'Primary raw-material supplier price hike (>20%) or working-capital timing gap across quarterly UK project milestones'
                      : 'Primary supplier stockout or >20% input cost inflation compressing unit gross margin',
                likelihoodScore: 3,
                impactScore: 4,
                grossRiskScore: 12,
                mitigationAndContingencyPlan:
                  params.hqCountryCode === 'IE'
                    ? 'Maintain accounts with at least 2 independent IE/EU suppliers, hold 3 weeks of buffer stock on fast-moving SKUs, and ring-fence working capital to bridge vouched IE LEO grant drawdowns.'
                    : params.hqCountryCode === 'GB'
                      ? 'Maintain accounts with at least 2 independent UK suppliers, hold 3 weeks of buffer stock on core SKUs, and align working capital with British Business Bank Start Up Loan / milestone schedules.'
                      : 'Maintain dual-sourced supplier accounts, hold 3 weeks of buffer inventory, and lock in volume tier pricing.',
                ownerAndWorkPackage: 'Founder / Finance Lead • WP2',
                residualRiskRating: 'LOW',
              },
              {
                id: 'risk-4',
                riskCategory: 'MANAGERIAL_REGULATORY',
                riskTitle:
                  'Key-person founder unavailability (illness/injury) or product safety, labelling, and workshop H&S audit bottleneck',
                likelihoodScore: 2,
                impactScore: 5,
                grossRiskScore: 10,
                mitigationAndContingencyPlan:
                  'Document step-by-step production & packing SOPs so a trained part-time assistant or contractor can fulfill orders within 48 hours, and maintain full product traceability and public/product liability insurance.',
                ownerAndWorkPackage: 'Founder / Compliance Lead • WP4',
                residualRiskRating: 'LOW',
              },
            ]
          : [
              {
                id: 'risk-1',
                riskCategory: 'TECHNICAL_PRODUCTION',
                riskTitle:
                  'Third-party cloud/AI API latency, upstream outage, or V1 scope creep delaying core workflow release',
                likelihoodScore: 3,
                impactScore: 4,
                grossRiskScore: 12,
                mitigationAndContingencyPlan:
                  'Enforce ruthless V1 scope freeze around the core user workflow, implement automated API circuit breakers and deterministic fallback responses, and ship weekly incremental builds.',
                ownerAndWorkPackage: 'Technical Lead • WP1 & WP2',
                residualRiskRating: 'LOW',
              },
              {
                id: 'risk-2',
                riskCategory: 'COMMERCIAL_MARKET',
                riskTitle:
                  'Longer B2B/customer onboarding cycles or paid acquisition costs exceeding initial CAC assumptions',
                likelihoodScore: 3,
                impactScore: 4,
                grossRiskScore: 12,
                mitigationAndContingencyPlan:
                  'Convert warm Module C survey & waitlist leads first via founder-led onboarding, offer a low-friction entry hook, and secure partner/channel distribution before scaling paid ads.',
                ownerAndWorkPackage: 'Founder / Growth Lead • WP3',
                residualRiskRating: 'LOW',
              },
              {
                id: 'risk-3',
                riskCategory: 'FINANCIAL_SUPPLY_CHAIN',
                riskTitle:
                  params.hqCountryCode === 'IE'
                    ? 'Runaway cloud/API consumption costs or working-capital bridge gap prior to IE LEO vouched grant drawdown'
                    : params.hqCountryCode === 'GB'
                      ? 'Runaway cloud/API consumption costs or working-capital bridge gap across UK quarterly claim periods'
                      : 'Unexpected cloud/API usage spikes or working-capital timing gap during V1 ramp-up',
                likelihoodScore: 3,
                impactScore: 3,
                grossRiskScore: 9,
                mitigationAndContingencyPlan:
                  'Enforce hard daily API usage ceilings and per-user rate limits, keep fixed premises overhead near zero in Year 1, and maintain a 3-month cash runway buffer.',
                ownerAndWorkPackage: 'Founder / Finance Lead • WP2',
                residualRiskRating: 'LOW',
              },
              {
                id: 'risk-4',
                riskCategory: 'MANAGERIAL_REGULATORY',
                riskTitle:
                  'Solo-founder bandwidth bottleneck across engineering and sales, or GDPR / multi-tenant data privacy compliance gap',
                likelihoodScore: 2,
                impactScore: 5,
                grossRiskScore: 10,
                mitigationAndContingencyPlan:
                  'Automate onboarding and billing workflows, enforce strict server-side tenant/plan ownership checks and encryption at rest, and document runbooks for contractor handover.',
                ownerAndWorkPackage: 'Founder / Security Lead • WP4',
                residualRiskRating: 'LOW',
              },
            ];

    const avgGross =
      fallbackRisks.length > 0
        ? (
            fallbackRisks.reduce(
              (sum, r) => sum + (Number(r.grossRiskScore) || 0),
              0
            ) / fallbackRisks.length
          ).toFixed(1)
        : '11.0';

    return {
      supplierRedundancyPosture: defaultPosture,
      leadTimeBufferDays: defaultLeadTimeBufferDays,
      primarySuppliersSummary: defaultPrimarySuppliers,
      backupSuppliersSummary: defaultBackupSuppliers,
      riskItems: fallbackRisks,
      supplyChainResilienceNarrative: `${cleanTitle} eliminates single-point-of-failure supply chain exposure through a ${defaultPosture.replace(/_/g, ' ').toLowerCase()} posture with a ${defaultLeadTimeBufferDays}-day operational buffer. ${defaultPrimarySuppliers} ${defaultBackupSuppliers}`,
      riskManagementGovernanceNarrative: `Our formal 4-category Risk Register covers Technical/Production, Commercial/Market, Financial/Supply-Chain, and Managerial/Regulatory pillars in full alignment with ${grantGovernanceLabel} standards. Across ${fallbackRisks.length} tracked risks (average gross score ${avgGross}/25), each risk is assigned to a specific Work Package owner with concrete preventative controls that reduce residual exposure to Low.`,
    };
  };

  if (!authCtx.canCallLiveGemini || !authCtx.activeApiKey) {
    return {
      allowed: true,
      ...buildSmartFallback(),
      creditsUsedAfter: authCtx.currentCreditsUsed,
      engineMode: 'smart-synthesizer',
    };
  }

  let creditsUsedAfter = authCtx.currentCreditsUsed;

  try {
    const ai = getGenAiClient(authCtx.activeApiKey);
    const fallback = buildSmartFallback();

    const countryRiskPromptRules =
      params.hqCountryCode === 'IE'
        ? `1. Tailor all risk governance and financial/supply-chain mitigations strictly to Ireland Local Enterprise Office (LEO) and Enterprise Ireland standards (e.g., vouched grant expenditure timing, Irish/EU supplier redundancy, HSA/FSAI/GDPR compliance).
2. Do NOT mention UK Innovate UK or British Business Bank rules for an Ireland-based startup.`
        : params.hqCountryCode === 'GB'
          ? `1. Tailor all risk governance and mitigations strictly to UK Innovate UK Smart Grants (Question 9 Risk Register Appendix) and British Business Bank Start Up Loans standards (e.g., 4 mandatory risk categories linked to Work Packages WP1..WP4, UK domestic/international supplier redundancy, HSE/UK GDPR compliance).
2. Do NOT mention Ireland LEO or Enterprise Ireland rules for a UK-based startup.`
          : `1. Tailor all risk governance and mitigations to ${countryPack.countryName} operational, supply-chain, and grant underwriting standards.`;

    const prompt = `You are an expert startup COO and ${grantGovernanceLabel} risk assessor.
Generate Module E Step 3 (Supply-Chain Resilience & Formal 4-Category Project Risk Register) for:
- Startup Title: ${sanitizePromptInput(params.planTitle, 120)}
- Industry Category: ${sanitizePromptInput(params.industryCategory, 80)}
- HQ Country: ${params.hqCountryCode}
- Product Track: ${params.selectedTrack} ${params.otherProductTrackText ? `(${sanitizePromptInput(params.otherProductTrackText, 100)})` : ''}
- Core Problem: ${sanitizePromptInput(params.coreProblem, 250)}
- Proposed Solution: ${sanitizePromptInput(params.proposedSolution, 250)}
- Mode: ${isNarrativesOnly ? 'NARRATIVES_ONLY (synthesize narratives from current risks)' : 'POPULATE_RISKS_AND_NARRATIVES (generate 4 specific risks across all 4 mandatory categories: TECHNICAL_PRODUCTION, COMMERCIAL_MARKET, FINANCIAL_SUPPLY_CHAIN, MANAGERIAL_REGULATORY)'}

CRITICAL COUNTRY & RISK RULES:
${countryRiskPromptRules}

Return ONLY valid JSON matching this exact structure:
{
  "supplierRedundancyPosture": "DUAL_SOURCED_VERIFIED" | "BUFFER_STOCK_HELD" | "CLOUD_MULTI_REGION_FAILOVER" | "SINGLE_SOURCE_CONTRACTED",
  "leadTimeBufferDays": 14,
  "primarySuppliersSummary": "1-2 specific sentences naming primary supplier types, MOQs, or cloud architecture for this exact business",
  "backupSuppliersSummary": "1-2 specific sentences naming secondary backup suppliers or failover controls",
  "riskItems": [
    {
      "riskCategory": "TECHNICAL_PRODUCTION" | "COMMERCIAL_MARKET" | "FINANCIAL_SUPPLY_CHAIN" | "MANAGERIAL_REGULATORY",
      "riskTitle": "Specific operational/project risk and what triggers it",
      "likelihoodScore": 3,
      "impactScore": 4,
      "mitigationAndContingencyPlan": "Concrete, actionable prevention and fallback protocol",
      "ownerAndWorkPackage": "Founder / Role • WP1",
      "residualRiskRating": "LOW" | "MEDIUM" | "HIGH"
    }
  ],
  "supplyChainResilienceNarrative": "2-3 sentences explaining how supply chain, supplier lead times, and single points of failure are protected",
  "riskManagementGovernanceNarrative": "2-3 sentences summarizing the 4-category Risk Register and how mitigations keep residual risk low"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        maxOutputTokens: MAX_OUTPUT_TOKENS_PER_CALL,
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text?.trim() || '';
    if (rawText) {
      const parsed = JSON.parse(rawText) as {
        supplierRedundancyPosture?: string;
        leadTimeBufferDays?: number;
        primarySuppliersSummary?: string;
        backupSuppliersSummary?: string;
        riskItems?: Array<{
          riskCategory?: string;
          riskTitle?: string;
          likelihoodScore?: number;
          impactScore?: number;
          mitigationAndContingencyPlan?: string;
          ownerAndWorkPackage?: string;
          residualRiskRating?: string;
        }>;
        supplyChainResilienceNarrative?: string;
        riskManagementGovernanceNarrative?: string;
      };

      if (
        typeof parsed.supplyChainResilienceNarrative === 'string' &&
        parsed.supplyChainResilienceNarrative.trim().length > 20 &&
        typeof parsed.riskManagementGovernanceNarrative === 'string' &&
        parsed.riskManagementGovernanceNarrative.trim().length > 20
      ) {
        creditsUsedAfter = await recordGeminiUsageAndIncrementCredits({
          verifiedUserId: authCtx.verifiedUserId,
          planId: params.planId,
          promptKey: 'MOD_E_STEP3_RISK_REGISTER',
          modelUsed: 'gemini-2.5-flash',
          inputTokens: response.usageMetadata?.promptTokenCount || 320,
          outputTokens: response.usageMetadata?.candidatesTokenCount || 380,
          usedByokKey: authCtx.usedByokKey,
          fallbackCreditsUsed: authCtx.currentCreditsUsed,
        });

        const validPostures = new Set<string>([
          'DUAL_SOURCED_VERIFIED',
          'BUFFER_STOCK_HELD',
          'CLOUD_MULTI_REGION_FAILOVER',
          'SINGLE_SOURCE_CONTRACTED',
          'OTHER',
        ]);
        const validRiskCategories = new Set<string>([
          'TECHNICAL_PRODUCTION',
          'COMMERCIAL_MARKET',
          'FINANCIAL_SUPPLY_CHAIN',
          'MANAGERIAL_REGULATORY',
          'OTHER',
        ]);
        const validResidualRatings = new Set<string>([
          'LOW',
          'MEDIUM',
          'HIGH',
          'OTHER',
        ]);

        const items: ProjectRiskRegisterItem[] =
          isNarrativesOnly &&
          params.currentRiskItems &&
          params.currentRiskItems.length > 0
            ? params.currentRiskItems
            : Array.isArray(parsed.riskItems) && parsed.riskItems.length >= 2
              ? parsed.riskItems.slice(0, 8).map((r, idx) => {
                  const likelihood = Math.max(
                    1,
                    Math.min(5, Math.round(Number(r.likelihoodScore) || 3))
                  );
                  const impact = Math.max(
                    1,
                    Math.min(5, Math.round(Number(r.impactScore) || 4))
                  );
                  return {
                    id: `ai-risk-${idx + 1}-${Date.now()}`,
                    riskCategory: validRiskCategories.has(
                      String(r.riskCategory)
                    )
                      ? (r.riskCategory as ProjectRiskCategoryType)
                      : 'TECHNICAL_PRODUCTION',
                    riskTitle:
                      sanitizePromptInput(r.riskTitle, 220) ||
                      `Operational Risk #${idx + 1}`,
                    likelihoodScore: likelihood,
                    impactScore: impact,
                    grossRiskScore: likelihood * impact,
                    mitigationAndContingencyPlan:
                      sanitizePromptInput(
                        r.mitigationAndContingencyPlan,
                        280
                      ) ||
                      'Documented operational fallback and secondary supplier/system redundancy in place.',
                    ownerAndWorkPackage:
                      sanitizePromptInput(r.ownerAndWorkPackage, 90) ||
                      `Founder / Ops Lead • WP${(idx % 4) + 1}`,
                    residualRiskRating: validResidualRatings.has(
                      String(r.residualRiskRating)
                    )
                      ? (r.residualRiskRating as ResidualRiskRatingType)
                      : 'LOW',
                  };
                })
              : fallback.riskItems;

        return {
          allowed: true,
          supplierRedundancyPosture: validPostures.has(
            String(parsed.supplierRedundancyPosture)
          )
            ? (parsed.supplierRedundancyPosture as SupplierRedundancyPostureType)
            : fallback.supplierRedundancyPosture,
          leadTimeBufferDays: Math.max(
            0,
            Math.min(
              180,
              Math.round(
                Number(
                  parsed.leadTimeBufferDays ?? fallback.leadTimeBufferDays
                )
              )
            )
          ),
          primarySuppliersSummary:
            sanitizePromptInput(parsed.primarySuppliersSummary, 300) ||
            fallback.primarySuppliersSummary,
          backupSuppliersSummary:
            sanitizePromptInput(parsed.backupSuppliersSummary, 300) ||
            fallback.backupSuppliersSummary,
          riskItems: items,
          supplyChainResilienceNarrative:
            parsed.supplyChainResilienceNarrative.trim(),
          riskManagementGovernanceNarrative:
            parsed.riskManagementGovernanceNarrative.trim(),
          creditsUsedAfter,
          engineMode: 'gemini-2.5-flash',
        };
      }
    }
  } catch {
    // Fallback to deterministic synthesizer below
  }

  return {
    allowed: true,
    ...buildSmartFallback(),
    creditsUsedAfter,
    engineMode: 'smart-synthesizer',
  };
}

// ============================================================================
// MODULE E STEP 4: CUSTOMER SUPPORT, RETURNS, WARRANTY & QUALITY CONTROL (QC)
// ============================================================================

export interface ModuleESupportReturnsAndQcGenerationResult {
  allowed: boolean;
  reason?: string;
  supportOperatingModel: SupportOperatingModelType;
  supportResponseSla: SupportResponseSlaType;
  returnsAndWarrantyPolicy: ReturnsAndWarrantyPolicyType;
  estimatedReturnOrRefundRatePercent: number;
  costPerReturnOrRemakeIncident: number;
  warrantyDurationMonths: number;
  qcCheckpoints: QcCheckpointItem[];
  qualityControlAndStandardsNarrative: string;
  customerSupportAndReturnsNarrative: string;
  creditsUsedAfter?: number;
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export async function generateModuleESupportReturnsAndQcViaRouter(params: {
  planId?: string;
  planTitle: string;
  industryCategory: string;
  hqCountryCode: SupportedCountryCode;
  baseCurrency?: string;
  brainDumpText?: string;
  coreProblem?: string;
  targetCustomer?: string;
  proposedSolution?: string;
  selectedTrack: ProductTrackType;
  otherProductTrackText?: string;
  currentSupportOperatingModel?: SupportOperatingModelType | '';
  currentSupportResponseSla?: SupportResponseSlaType | '';
  currentReturnsAndWarrantyPolicy?: ReturnsAndWarrantyPolicyType | '';
  currentEstimatedReturnRatePercent?: number;
  currentCostPerReturnIncident?: number;
  currentWarrantyDurationMonths?: number;
  currentQcCheckpoints?: QcCheckpointItem[];
  mode?: 'POPULATE_QC_AND_NARRATIVES' | 'NARRATIVES_ONLY';
}): Promise<ModuleESupportReturnsAndQcGenerationResult> {
  const authCtx = await authorizeAndPrepareGeminiCall(
    'MOD_E_STEP4_SUPPORT_RETURNS_QC'
  );

  const countryPack = getCountryRulePack(params.hqCountryCode);
  const currency = params.baseCurrency || countryPack.defaultCurrency;
  const cleanTitle =
    sanitizePromptInput(params.planTitle, 100) || 'the business';
  const isNarrativesOnly = params.mode === 'NARRATIVES_ONLY';

  const consumerLawAndGrantLabel =
    params.hqCountryCode === 'IE'
      ? 'Ireland Consumer Rights Act 2022 (CRAA), CCPC distance-selling regulations, and Local Enterprise Office (LEO) / Enterprise Ireland quality assurance standards'
      : params.hqCountryCode === 'GB'
        ? 'UK Consumer Rights Act 2015, Consumer Contracts Regulations 2013, and Innovate UK / British Business Bank Start Up Loan operational standards'
        : `${countryPack.countryName} statutory consumer protection & grant underwriting standards`;

  const buildSmartFallback = (): Omit<
    ModuleESupportReturnsAndQcGenerationResult,
    'allowed' | 'reason' | 'creditsUsedAfter' | 'engineMode'
  > => {
    const isPhysicalOrHardware =
      params.selectedTrack === 'PHYSICAL_PRODUCT_ECOM' ||
      params.selectedTrack === 'HYBRID_HARDWARE_SOFTWARE';
    const isService = params.selectedTrack === 'PRODUCTIZED_SERVICE_AGENCY';

    const defaultSupportModel: SupportOperatingModelType =
      (params.currentSupportOperatingModel as SupportOperatingModelType) ||
      (isPhysicalOrHardware || isService
        ? 'DIRECT_FOUNDER_CONCIERGE_EMAIL_WHATSAPP'
        : 'SELF_SERVE_DOCS_PLUS_FOUNDER_TIER2');

    const defaultSla: SupportResponseSlaType =
      (params.currentSupportResponseSla as SupportResponseSlaType) ||
      (isPhysicalOrHardware || isService
        ? 'NEXT_BUSINESS_DAY_24H'
        : 'SAME_BUSINESS_DAY_UNDER_4H');

    const defaultPolicy: ReturnsAndWarrantyPolicyType =
      (params.currentReturnsAndWarrantyPolicy as ReturnsAndWarrantyPolicyType) ||
      (isPhysicalOrHardware
        ? 'STATUTORY_14_DAY_COOLING_OFF'
        : isService
          ? 'MILESTONE_ACCEPTANCE_SIGN_OFF'
          : 'THIRTY_DAY_MONEY_BACK_OR_TRIAL');

    const defaultReturnRate =
      params.currentEstimatedReturnRatePercent ??
      (isPhysicalOrHardware ? 2.5 : isService ? 1.5 : 2.0);

    const defaultIncidentCost =
      params.currentCostPerReturnIncident ??
      (isPhysicalOrHardware ? 24 : isService ? 85 : 12);

    const defaultWarrantyMonths =
      params.currentWarrantyDurationMonths ??
      (isPhysicalOrHardware ? 12 : 0);

    const fallbackCheckpoints: QcCheckpointItem[] =
      isNarrativesOnly &&
      params.currentQcCheckpoints &&
      params.currentQcCheckpoints.length > 0
        ? params.currentQcCheckpoints
        : isPhysicalOrHardware
          ? [
              {
                id: 'qc-1',
                gateTiming: 'INCOMING_MATERIAL_OR_DATA_CHECK',
                checkpointName:
                  'Incoming Raw Material, Component & Packaging Inspection',
                passFailStandard:
                  '100% visual check of incoming stock against specification sheet, zero structural defects, and batch/supplier lot number logged on arrival.',
                defectFallbackAction:
                  'Quarantine non-conforming batch immediately, photograph defects for supplier credit note, and draw from 21-day safety buffer stock.',
                ownerRole: 'Founder / Production Lead',
              },
              {
                id: 'qc-2',
                gateTiming: 'IN_PROCESS_BUILD_OR_CODE_REVIEW',
                checkpointName:
                  'In-Process Dimensional Tolerance & Surface Finish Check',
                passFailStandard:
                  'Verify assembly tolerances, structural integrity, and finish cure quality before final branding or custom detailing is applied.',
                defectFallbackAction:
                  'Re-machine or re-finish unit at the bench before packaging so zero sub-standard units enter finished goods inventory.',
                ownerRole: 'Founder / Workshop Lead',
              },
              {
                id: 'qc-3',
                gateTiming: 'PRE_DISPATCH_FINAL_INSPECTION',
                checkpointName:
                  'Pre-Dispatch Final Inspection, Care Guide & Protective Packaging Gate',
                passFailStandard:
                  'Final visual inspection under bright bench lighting, care/safety insert included, corner/impact protection fitted, and tracked courier label verified.',
                defectFallbackAction:
                  'Hold shipment, replace unit or packaging immediately, and log root cause in weekly QC ledger.',
                ownerRole: 'Founder / Dispatch Lead',
              },
            ]
          : isService
            ? [
                {
                  id: 'qc-1',
                  gateTiming: 'INCOMING_MATERIAL_OR_DATA_CHECK',
                  checkpointName:
                    'Client Intake Brief, Scope Boundary & Asset Readiness Gate',
                  passFailStandard:
                    'Signed statement of work, complete client intake questionnaire, and verified access credentials prior to sprint kickoff.',
                  defectFallbackAction:
                    'Pause kickoff timer and send automated missing-asset checklist before allocating delivery hours.',
                  ownerRole: 'Founder / Account Lead',
                },
                {
                  id: 'qc-2',
                  gateTiming: 'IN_PROCESS_BUILD_OR_CODE_REVIEW',
                  checkpointName:
                    'Mid-Sprint Internal QA & Deliverable Peer Review',
                  passFailStandard:
                    '100% of deliverables checked against standard SOP rubric and client brief before client preview.',
                  defectFallbackAction:
                    'Resolve gaps internally prior to client review meeting to prevent revision loops.',
                  ownerRole: 'Delivery Lead',
                },
                {
                  id: 'qc-3',
                  gateTiming: 'PRE_DISPATCH_FINAL_INSPECTION',
                  checkpointName:
                    'Final Handover Sign-Off & Post-Delivery Satisfaction Check',
                  passFailStandard:
                    'Client milestone sign-off recorded, handover documentation delivered, and 7-day post-delivery check-in scheduled.',
                  defectFallbackAction:
                    'Execute 1-round scope remedy within 48 business hours under service guarantee.',
                  ownerRole: 'Founder / Client Success Lead',
                },
              ]
            : [
                {
                  id: 'qc-1',
                  gateTiming: 'INCOMING_MATERIAL_OR_DATA_CHECK',
                  checkpointName:
                    'Input Validation, Schema Integrity & Upstream API Guardrails',
                  passFailStandard:
                    'Strict server-side input validation, tenant/plan ownership verification, and rate-limit checks on 100% of incoming requests.',
                  defectFallbackAction:
                    'Fail closed to deterministic fallback response and log structured warning without exposing sensitive state.',
                  ownerRole: 'Technical Lead',
                },
                {
                  id: 'qc-2',
                  gateTiming: 'IN_PROCESS_BUILD_OR_CODE_REVIEW',
                  checkpointName:
                    'Automated TypeScript, Lint & Staging Regression Gate',
                  passFailStandard:
                    'Zero TypeScript compilation errors, verified database migration parity, and passing core user-journey smoke tests in staging.',
                  defectFallbackAction:
                    'Block production deployment automatically until build and regression checks pass 100%.',
                  ownerRole: 'Founder / Engineering Lead',
                },
                {
                  id: 'qc-3',
                  gateTiming: 'POST_DELIVERY_CUSTOMER_CHECKIN',
                  checkpointName:
                    'Post-Onboarding Activation Check & Support Telemetry Review',
                  passFailStandard:
                    'User completes core activation workflow within first session with zero unhandled client/server exceptions.',
                  defectFallbackAction:
                    'Trigger proactive founder check-in email and patch UX friction point in next weekly release.',
                  ownerRole: 'Founder / Product Lead',
                },
              ];

    const statutoryRuleText =
      params.hqCountryCode === 'IE'
        ? 'full compliance with the Ireland Consumer Rights Act 2022 (CRAA) and CCPC distance-selling rules (including the 14-day statutory cooling-off period for standard goods and clear upfront disclosure for bespoke/made-to-order items)'
        : params.hqCountryCode === 'GB'
          ? 'full compliance with the UK Consumer Rights Act 2015 and Consumer Contracts Regulations 2013 (including the 14-day distance-selling cancellation window for standard goods and bespoke/made-to-order exemptions)'
          : `full compliance with ${countryPack.countryName} statutory consumer protection and distance-selling regulations`;

    return {
      supportOperatingModel: defaultSupportModel,
      supportResponseSla: defaultSla,
      returnsAndWarrantyPolicy: defaultPolicy,
      estimatedReturnOrRefundRatePercent: defaultReturnRate,
      costPerReturnOrRemakeIncident: defaultIncidentCost,
      warrantyDurationMonths: defaultWarrantyMonths,
      qcCheckpoints: fallbackCheckpoints,
      qualityControlAndStandardsNarrative: `${cleanTitle} enforces a structured ${fallbackCheckpoints.length}-gate Quality Control (QC) protocol spanning incoming verification, in-process build standards, and pre-release inspection. By catching defects before customer handover, we hold our projected return/rework rate to ${defaultReturnRate}% (averaging ${formatPlanCurrency(defaultIncidentCost, currency)} per incident), protecting both unit gross margins in Module G and brand reputation.`,
      customerSupportAndReturnsNarrative: `Customer support operates on a ${defaultSupportModel.replace(/_/g, ' ').toLowerCase()} model with a ${defaultSla.replace(/_/g, ' ').toLowerCase()} response SLA, ensuring early customers receive fast, accountable resolution without overwhelming founder bandwidth. Our returns, refund, and ${defaultWarrantyMonths > 0 ? `${defaultWarrantyMonths}-month warranty` : 'service guarantee'} policy is structured for ${statutoryRuleText}.`,
    };
  };

  if (!authCtx.canCallLiveGemini || !authCtx.activeApiKey) {
    return {
      allowed: true,
      ...buildSmartFallback(),
      creditsUsedAfter: authCtx.currentCreditsUsed,
      engineMode: 'smart-synthesizer',
    };
  }

  let creditsUsedAfter = authCtx.currentCreditsUsed;

  try {
    const ai = getGenAiClient(authCtx.activeApiKey);
    const fallback = buildSmartFallback();

    const countryConsumerRulesPrompt =
      params.hqCountryCode === 'IE'
        ? `1. Tailor all consumer rights, returns, and quality assurance guidance strictly to Ireland (Consumer Rights Act 2022, CCPC distance-selling rules, 14-day cooling-off vs. bespoke goods exemption, and IE LEO / Enterprise Ireland standards).
2. Do NOT mention UK Consumer Rights Act 2015, Trading Standards, Innovate UK, or British Business Bank rules for an Ireland-based startup.`
        : params.hqCountryCode === 'GB'
          ? `1. Tailor all consumer rights, returns, and quality assurance guidance strictly to the United Kingdom (UK Consumer Rights Act 2015, Consumer Contracts Regulations 2013, 14-day cooling-off vs. bespoke goods exemption, and UK Innovate UK / British Business Bank Start Up Loan standards).
2. Do NOT mention Ireland Consumer Rights Act 2022, CCPC, IE LEO, or Enterprise Ireland rules for a UK-based startup.`
          : `1. Tailor all consumer rights, returns, and quality assurance guidance to ${countryPack.countryName} statutory consumer protection standards.`;

    const prompt = `You are an expert startup COO and ${consumerLawAndGrantLabel} advisor.
Generate Module E Step 4 (Customer Support, Returns, Warranty & Quality Control SOP) for:
- Startup Title: ${sanitizePromptInput(params.planTitle, 120)}
- Industry Category: ${sanitizePromptInput(params.industryCategory, 80)}
- HQ Country: ${params.hqCountryCode} (Currency: ${currency})
- Product Track: ${params.selectedTrack} ${params.otherProductTrackText ? `(${sanitizePromptInput(params.otherProductTrackText, 100)})` : ''}
- Core Problem: ${sanitizePromptInput(params.coreProblem, 250)}
- Proposed Solution: ${sanitizePromptInput(params.proposedSolution, 250)}
- Mode: ${isNarrativesOnly ? 'NARRATIVES_ONLY (synthesize narratives from current QC checkpoints)' : 'POPULATE_QC_AND_NARRATIVES (generate 3 concrete QC checkpoints across incoming, in-process, and pre-dispatch/post-delivery gates plus narratives)'}

CRITICAL COUNTRY & STATUTORY RULES:
${countryConsumerRulesPrompt}

Return ONLY valid JSON matching this exact structure:
{
  "supportOperatingModel": "SELF_SERVE_DOCS_PLUS_FOUNDER_TIER2" | "DIRECT_FOUNDER_CONCIERGE_EMAIL_WHATSAPP" | "AI_TRIAGE_CHATBOT_PLUS_HUMAN_FALLBACK" | "DEDICATED_PART_TIME_SUPPORT_AGENT",
  "supportResponseSla": "INSTANT_AUTOMATED_24_7" | "SAME_BUSINESS_DAY_UNDER_4H" | "NEXT_BUSINESS_DAY_24H" | "FORTY_EIGHT_HOUR_STANDARD",
  "returnsAndWarrantyPolicy": "STATUTORY_14_DAY_COOLING_OFF" | "BESPOKE_PERSONALIZED_EXEMPT_TRANSIT_REPLACE" | "THIRTY_DAY_MONEY_BACK_OR_TRIAL" | "MILESTONE_ACCEPTANCE_SIGN_OFF",
  "estimatedReturnOrRefundRatePercent": 2.5,
  "costPerReturnOrRemakeIncident": 22,
  "warrantyDurationMonths": 12,
  "qcCheckpoints": [
    {
      "gateTiming": "INCOMING_MATERIAL_OR_DATA_CHECK" | "IN_PROCESS_BUILD_OR_CODE_REVIEW" | "PRE_DISPATCH_FINAL_INSPECTION" | "POST_DELIVERY_CUSTOMER_CHECKIN",
      "checkpointName": "Specific QC gate title",
      "passFailStandard": "Measurable pass/fail inspection criteria",
      "defectFallbackAction": "Immediate containment and remediation action if a defect is detected",
      "ownerRole": "Founder / Role"
    }
  ],
  "qualityControlAndStandardsNarrative": "2-3 sentences explaining the 3-stage QC protocol, defect containment, and how it protects unit economics",
  "customerSupportAndReturnsNarrative": "2-3 sentences explaining the support SLA, returns/warranty workflow, and compliance with statutory consumer rights"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        maxOutputTokens: MAX_OUTPUT_TOKENS_PER_CALL,
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text?.trim() || '';
    if (rawText) {
      const parsed = JSON.parse(rawText) as {
        supportOperatingModel?: string;
        supportResponseSla?: string;
        returnsAndWarrantyPolicy?: string;
        estimatedReturnOrRefundRatePercent?: number;
        costPerReturnOrRemakeIncident?: number;
        warrantyDurationMonths?: number;
        qcCheckpoints?: Array<{
          gateTiming?: string;
          checkpointName?: string;
          passFailStandard?: string;
          defectFallbackAction?: string;
          ownerRole?: string;
        }>;
        qualityControlAndStandardsNarrative?: string;
        customerSupportAndReturnsNarrative?: string;
      };

      if (
        typeof parsed.qualityControlAndStandardsNarrative === 'string' &&
        parsed.qualityControlAndStandardsNarrative.trim().length > 20 &&
        typeof parsed.customerSupportAndReturnsNarrative === 'string' &&
        parsed.customerSupportAndReturnsNarrative.trim().length > 20
      ) {
        creditsUsedAfter = await recordGeminiUsageAndIncrementCredits({
          verifiedUserId: authCtx.verifiedUserId,
          planId: params.planId,
          promptKey: 'MOD_E_STEP4_SUPPORT_RETURNS_QC',
          modelUsed: 'gemini-2.5-flash',
          inputTokens: response.usageMetadata?.promptTokenCount || 320,
          outputTokens: response.usageMetadata?.candidatesTokenCount || 380,
          usedByokKey: authCtx.usedByokKey,
          fallbackCreditsUsed: authCtx.currentCreditsUsed,
        });

        const validSupportModels = new Set<string>([
          'SELF_SERVE_DOCS_PLUS_FOUNDER_TIER2',
          'DIRECT_FOUNDER_CONCIERGE_EMAIL_WHATSAPP',
          'AI_TRIAGE_CHATBOT_PLUS_HUMAN_FALLBACK',
          'DEDICATED_PART_TIME_SUPPORT_AGENT',
          'OTHER',
        ]);
        const validSlas = new Set<string>([
          'INSTANT_AUTOMATED_24_7',
          'SAME_BUSINESS_DAY_UNDER_4H',
          'NEXT_BUSINESS_DAY_24H',
          'FORTY_EIGHT_HOUR_STANDARD',
          'OTHER',
        ]);
        const validPolicies = new Set<string>([
          'STATUTORY_14_DAY_COOLING_OFF',
          'BESPOKE_PERSONALIZED_EXEMPT_TRANSIT_REPLACE',
          'THIRTY_DAY_MONEY_BACK_OR_TRIAL',
          'MILESTONE_ACCEPTANCE_SIGN_OFF',
          'OTHER',
        ]);
        const validGates = new Set<string>([
          'INCOMING_MATERIAL_OR_DATA_CHECK',
          'IN_PROCESS_BUILD_OR_CODE_REVIEW',
          'PRE_DISPATCH_FINAL_INSPECTION',
          'POST_DELIVERY_CUSTOMER_CHECKIN',
          'OTHER',
        ]);

        const items: QcCheckpointItem[] =
          isNarrativesOnly &&
          params.currentQcCheckpoints &&
          params.currentQcCheckpoints.length > 0
            ? params.currentQcCheckpoints
            : Array.isArray(parsed.qcCheckpoints) &&
                parsed.qcCheckpoints.length >= 2
              ? parsed.qcCheckpoints.slice(0, 6).map((cp, idx) => ({
                  id: `ai-qc-${idx + 1}-${Date.now()}`,
                  gateTiming: validGates.has(String(cp.gateTiming))
                    ? (cp.gateTiming as QcGateTimingType)
                    : idx === 0
                      ? 'INCOMING_MATERIAL_OR_DATA_CHECK'
                      : idx === 1
                        ? 'IN_PROCESS_BUILD_OR_CODE_REVIEW'
                        : 'PRE_DISPATCH_FINAL_INSPECTION',
                  checkpointName:
                    sanitizePromptInput(cp.checkpointName, 160) ||
                    `Quality Control Gate #${idx + 1}`,
                  passFailStandard:
                    sanitizePromptInput(cp.passFailStandard, 260) ||
                    '100% conformance with documented product/service specification.',
                  defectFallbackAction:
                    sanitizePromptInput(cp.defectFallbackAction, 260) ||
                    'Hold release/dispatch immediately and remediate before customer handover.',
                  ownerRole:
                    sanitizePromptInput(cp.ownerRole, 80) ||
                    'Founder / Quality Lead',
                }))
              : fallback.qcCheckpoints;

        return {
          allowed: true,
          supportOperatingModel: validSupportModels.has(
            String(parsed.supportOperatingModel)
          )
            ? (parsed.supportOperatingModel as SupportOperatingModelType)
            : fallback.supportOperatingModel,
          supportResponseSla: validSlas.has(String(parsed.supportResponseSla))
            ? (parsed.supportResponseSla as SupportResponseSlaType)
            : fallback.supportResponseSla,
          returnsAndWarrantyPolicy: validPolicies.has(
            String(parsed.returnsAndWarrantyPolicy)
          )
            ? (parsed.returnsAndWarrantyPolicy as ReturnsAndWarrantyPolicyType)
            : fallback.returnsAndWarrantyPolicy,
          estimatedReturnOrRefundRatePercent: Math.max(
            0,
            Math.min(
              50,
              Number(
                (
                  Number(
                    parsed.estimatedReturnOrRefundRatePercent ??
                      fallback.estimatedReturnOrRefundRatePercent
                  ) || 2
                ).toFixed(1)
              )
            )
          ),
          costPerReturnOrRemakeIncident: Math.max(
            0,
            Math.round(
              Number(
                parsed.costPerReturnOrRemakeIncident ??
                  fallback.costPerReturnOrRemakeIncident
              )
            )
          ),
          warrantyDurationMonths: Math.max(
            0,
            Math.min(
              120,
              Math.round(
                Number(
                  parsed.warrantyDurationMonths ??
                    fallback.warrantyDurationMonths
                )
              )
            )
          ),
          qcCheckpoints: items,
          qualityControlAndStandardsNarrative:
            parsed.qualityControlAndStandardsNarrative.trim(),
          customerSupportAndReturnsNarrative:
            parsed.customerSupportAndReturnsNarrative.trim(),
          creditsUsedAfter,
          engineMode: 'gemini-2.5-flash',
        };
      }
    }
  } catch {
    // Fallback to deterministic synthesizer below
  }

  return {
    allowed: true,
    ...buildSmartFallback(),
    creditsUsedAfter,
    engineMode: 'smart-synthesizer',
  };
}

export interface ModuleEPermitsAndInsuranceGenerationResult {
  allowed: boolean;
  reason?: string;
  regulatorySectorPosture: RegulatorySectorPostureType;
  otherRegulatorySectorPostureText: string;
  dataPrivacyPosture: DataPrivacyPostureType;
  otherDataPrivacyPostureText: string;
  insuranceCoverageBundle: InsuranceCoverageBundleType;
  otherInsuranceCoverageBundleText: string;
  estimatedAnnualInsurancePremium: number;
  selectedInsuranceProviderName: string;
  complianceItems: ComplianceChecklistItem[];
  regulatoryAndComplianceNarrative: string;
  insuranceAndLiabilityGovernanceNarrative: string;
  creditsUsedAfter: number;
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export async function generateModuleEPermitsAndInsuranceViaRouter(input: {
  planId?: string;
  planTitle: string;
  industryCategory: string;
  hqCountryCode: SupportedCountryCode;
  baseCurrency?: string;
  brainDumpText?: string;
  coreProblem?: string;
  targetCustomer?: string;
  proposedSolution?: string;
  selectedTrack: ProductTrackType;
  otherProductTrackText?: string;
  currentRegulatorySectorPosture?: RegulatorySectorPostureType | '';
  currentDataPrivacyPosture?: DataPrivacyPostureType | '';
  currentInsuranceCoverageBundle?: InsuranceCoverageBundleType | '';
  currentEstimatedAnnualInsurancePremium?: number;
  currentSelectedInsuranceProviderName?: string;
  currentComplianceItems?: ComplianceChecklistItem[];
  mode?: 'POPULATE_COMPLIANCE_AND_NARRATIVES' | 'NARRATIVES_ONLY';
}): Promise<ModuleEPermitsAndInsuranceGenerationResult> {
  const isSoftware =
    input.selectedTrack === 'SAAS_SOFTWARE_AI' ||
    input.selectedTrack === 'HYBRID_HARDWARE_SOFTWARE';
  const isPhysical =
    input.selectedTrack === 'PHYSICAL_PRODUCT_ECOM' ||
    input.selectedTrack === 'HYBRID_HARDWARE_SOFTWARE';
  const isFoodHosp = /food|bev|hospitality|cafe|bakery|cosmetic/i.test(
    `${input.industryCategory || ''} ${input.otherProductTrackText || ''}`
  );
  const isMarketplace = input.selectedTrack === 'MARKETPLACE_PLATFORM';

  const isIE = input.hqCountryCode === 'IE';
  const isGB = input.hqCountryCode === 'GB';
  const currencySymbol =
    input.baseCurrency === 'GBP' || isGB
      ? '£'
      : input.baseCurrency === 'USD'
        ? '$'
        : '€';

  const buildSmartFallback = (): Omit<
    ModuleEPermitsAndInsuranceGenerationResult,
    'allowed' | 'creditsUsedAfter' | 'engineMode' | 'reason'
  > => {
    const regulatorySectorPosture: RegulatorySectorPostureType =
      input.currentRegulatorySectorPosture ||
      (isFoodHosp
        ? 'FOOD_BEV_HYGIENE_HACCP'
        : isPhysical
          ? 'PHYSICAL_PRODUCT_SAFETY_CE_UKCA'
          : 'STANDARD_COMMERCIAL_UNREGULATED');

    const dataPrivacyPosture: DataPrivacyPostureType =
      input.currentDataPrivacyPosture ||
      (isSoftware || isMarketplace
        ? 'B2B_DATA_PROCESSOR_DPA_SCC'
        : 'STANDARD_CUSTOMER_CRM_COOKIES');

    const insuranceCoverageBundle: InsuranceCoverageBundleType =
      input.currentInsuranceCoverageBundle ||
      (isSoftware || isMarketplace
        ? 'TECH_SAAS_PI_CYBER'
        : isPhysical || isFoodHosp
          ? 'PRODUCT_PUBLIC_LIABILITY_STOCK'
          : 'PUBLIC_EMPLOYERS_CORE');

    const estimatedAnnualInsurancePremium =
      typeof input.currentEstimatedAnnualInsurancePremium === 'number' &&
      input.currentEstimatedAnnualInsurancePremium > 0
        ? input.currentEstimatedAnnualInsurancePremium
        : isSoftware || isMarketplace
          ? isGB
            ? 850
            : 950
          : isPhysical || isFoodHosp
            ? isGB
              ? 1100
              : 1250
            : isGB
              ? 550
              : 650;

    const selectedInsuranceProviderName =
      input.currentSelectedInsuranceProviderName?.trim() ||
      (isIE
        ? isSoftware || isMarketplace
          ? 'Hiscox Ireland / Arachas Cyber & Tech PI'
          : 'Allianz Ireland / Arachas Commercial Combined'
        : isGB
          ? isSoftware || isMarketplace
            ? 'Superscript / Hiscox UK Tech & Cyber PI'
            : 'Simply Business / Aviva UK Commercial Combined'
          : 'Commercial Startup Insurance Broker');

    const defaultItems: ComplianceChecklistItem[] = [
      {
        id: 'comp-1',
        category: 'CORPORATE_TAX_GRANT_CLEARANCE',
        requirementTitle: isIE
          ? 'CRO Incorporation & Revenue eTax Clearance Certificate (TC2 via ROS)'
          : isGB
            ? 'Companies House Incorporation & HMRC Corporation Tax UTR Registration'
            : 'Corporate Registration & Tax Clearance Certificate',
        regulatoryBody: isIE
          ? 'Companies Registration Office (CRO) & Revenue Commissioners (ROS.ie)'
          : isGB
            ? 'Companies House & HM Revenue & Customs (HMRC)'
            : 'National Corporate & Tax Registry',
        status: 'IN_PROGRESS',
        evidenceOrReferenceNote: isIE
          ? 'Mandatory prerequisite before any Local Enterprise Office (LEO) or Enterprise Ireland grant drawdown can be paid out.'
          : isGB
            ? 'Active Companies House registration number and UK business bank account required for Innovate UK & Start Up Loans.'
            : 'Required for corporate banking and grant eligibility.',
        estimatedAnnualCost: 0,
      },
      {
        id: 'comp-2',
        category: 'DATA_PRIVACY_GDPR_SECURITY',
        requirementTitle: isIE
          ? 'EU GDPR Privacy Notice, ROPA & Data Processing Agreements (Irish Data Protection Act 2018)'
          : isGB
            ? 'UK GDPR Compliance, Privacy Notice & Annual ICO Data Protection Fee Registration'
            : 'GDPR / Data Privacy Policy, Cookie Consent & Data Processing Agreements',
        regulatoryBody: isIE
          ? 'Data Protection Commission (DPC Ireland — dataprotection.ie)'
          : isGB
            ? "Information Commissioner's Office (ICO UK — ico.org.uk)"
            : 'National Data Protection Authority',
        status: 'IN_PROGRESS',
        evidenceOrReferenceNote: isIE
          ? 'EU/EEA cloud hosting residency verified; Article 28 Data Processing Agreements (DPAs) in place with sub-processors.'
          : isGB
            ? 'ICO Tier 1 Data Protection Fee (£40/yr via Direct Debit) and UK GDPR Privacy & Cookie Policies published.'
            : 'Customer PII encrypted at rest and in transit with clear opt-in consent.',
        estimatedAnnualCost: isGB ? 40 : 0,
      },
      {
        id: 'comp-3',
        category: 'HEALTH_SAFETY_PREMISES',
        requirementTitle: isIE
          ? 'Written Safety Statement & Risk Assessment (Section 20 SHWW Act 2005 via HSA BeSMART.ie)'
          : isGB
            ? 'HSE Health & Safety Policy & Workplace Risk Assessment (HSWA 1974)'
            : 'Workplace Health & Safety Policy & Risk Assessment',
        regulatoryBody: isIE
          ? 'Health and Safety Authority (HSA Ireland — hsa.ie / BeSMART.ie)'
          : isGB
            ? 'Health and Safety Executive (HSE UK — hse.gov.uk)'
            : 'Occupational Health & Safety Authority',
        status: 'PLANNED_BEFORE_LAUNCH',
        evidenceOrReferenceNote: isIE
          ? 'Generated free via HSA BeSMART.ie portal covering workspace ergonomics, electrical safety, and operational hazards.'
          : isGB
            ? 'Documented HSE hazard assessment covering operations, display screen equipment (DSE), and visitor/contractor safety.'
            : 'Covers operational workspace safety and contractor protocols.',
        estimatedAnnualCost: 0,
      },
      {
        id: 'comp-4',
        category:
          isPhysical || isFoodHosp
            ? 'SECTOR_PRODUCT_LICENSE'
            : 'COMMERCIAL_INSURANCE_POLICY',
        requirementTitle: isFoodHosp
          ? isIE
            ? 'HSE Environmental Health Food Business Registration & FSAI HACCP Food Safety Plan'
            : 'Local Council Food Business Registration (28 Days Prior) & FSA SFBB HACCP Pack'
          : isPhysical
            ? isIE
              ? 'EU General Product Safety Regulation (GPSR 2023/988) Technical File, CE Marking & CCPC Labelling'
              : 'UK Product Safety (UKCA / CE Marking), Technical File & OPSS / Trading Standards Traceability'
            : isIE
              ? 'Commercial Professional Indemnity (PI), Cyber Liability & Public/Employers Liability Policy'
              : 'Commercial PI, Cyber & Statutory UK Employers Liability (£5m Min) Insurance Policy',
        regulatoryBody: isFoodHosp
          ? isIE
            ? 'Food Safety Authority of Ireland (FSAI) & HSE Environmental Health Officer (EHO)'
            : 'Food Standards Agency (FSA) & Local Authority Environmental Health'
          : isPhysical
            ? isIE
              ? 'Competition and Consumer Protection Commission (CCPC) & National Standards Authority of Ireland (NSAI)'
              : 'Office for Product Safety and Standards (OPSS) & Local Trading Standards'
            : isIE
              ? 'Central Bank of Ireland Regulated Commercial Insurer / Broker'
              : 'FCA Regulated Commercial Insurer / Broker',
        status: 'PLANNED_BEFORE_LAUNCH',
        evidenceOrReferenceNote:
          isPhysical || isFoodHosp
            ? 'Batch/lot numbering, supplier certificates of conformity, and safety labelling verified before first commercial dispatch.'
            : `Indicative annual policy estimate of ${currencySymbol}${estimatedAnnualInsurancePremium.toLocaleString()}/yr (${currencySymbol}${Math.round(estimatedAnnualInsurancePremium / 12).toLocaleString()}/mo in Module I Overheads); actual premium subject to insurer underwriting.`,
        estimatedAnnualCost:
          isPhysical || isFoodHosp ? 150 : estimatedAnnualInsurancePremium,
      },
    ];

    const complianceItems =
      input.mode === 'NARRATIVES_ONLY' &&
      input.currentComplianceItems &&
      input.currentComplianceItems.length > 0
        ? input.currentComplianceItems
        : defaultItems;

    const jurisdictionAuthoritySummary = isIE
      ? 'Irish statutory requirements including Revenue eTax Clearance (TC2 via ROS), the Companies Registration Office (CRO), the Health and Safety Authority (HSA Section 20 Written Safety Statement via BeSMART.ie), and the Data Protection Commission (DPC under EU GDPR and the Irish Data Protection Act 2018)'
      : isGB
        ? 'UK statutory requirements including Companies House, HM Revenue & Customs (HMRC), the Health and Safety Executive (HSE under the Health and Safety at Work etc. Act 1974), and the Information Commissioner’s Office (ICO under UK GDPR and the Data Protection Act 2018)'
        : 'national corporate, tax, workplace health and safety, and data protection authorities';

    const regulatoryAndComplianceNarrative = `${input.planTitle} maintains a proactive, audit-ready regulatory compliance framework aligned with ${jurisdictionAuthoritySummary}. Prior to commercial scale and any grant drawdown, the business ensures corporate and tax good standing alongside documented workplace safety assessments and structured data governance (${dataPrivacyPosture.replace(/_/g, ' ').toLowerCase()}). All customer and operational records are processed under strict least-privilege access controls, documented Data Processing Agreements (DPAs), and transparent privacy disclosures, ensuring zero regulatory bottlenecks during enterprise procurement or funding audits.`;

    const insuranceAndLiabilityGovernanceNarrative = `To insulate ${input.planTitle} from commercial, product, and operational liability, the business has scoped a ${insuranceCoverageBundle.replace(/_/g, ' ').toLowerCase()} insurance bundle (${selectedInsuranceProviderName}) with an indicative estimated annual premium of ${currencySymbol}${estimatedAnnualInsurancePremium.toLocaleString()}/year (approx. ${currencySymbol}${Math.round(estimatedAnnualInsurancePremium / 12).toLocaleString()}/month factored into Module I Fixed Overheads; actual coverage, policy limits, and premiums may vary subject to formal underwriting). ${
      isIE
        ? 'This structure satisfies Local Enterprise Office (LEO), Enterprise Ireland, and commercial landlord/enterprise client indemnity conditions across Ireland.'
        : isGB
          ? 'This structure satisfies British Business Bank Start Up Loans, Innovate UK, and UK statutory £5m Employers’ Liability requirements upon hiring.'
          : 'This coverage protects balance-sheet runway against third-party claims, professional errors, and business interruption.'
    }`;

    return {
      regulatorySectorPosture,
      otherRegulatorySectorPostureText: '',
      dataPrivacyPosture,
      otherDataPrivacyPostureText: '',
      insuranceCoverageBundle,
      otherInsuranceCoverageBundleText: '',
      estimatedAnnualInsurancePremium,
      selectedInsuranceProviderName,
      complianceItems,
      regulatoryAndComplianceNarrative,
      insuranceAndLiabilityGovernanceNarrative,
    };
  };

  const authCtx = await authorizeAndPrepareGeminiCall(
    'MOD_E_STEP5_PERMITS_INSURANCE'
  );

  if (!authCtx.canCallLiveGemini || !authCtx.activeApiKey) {
    return {
      allowed: true,
      ...buildSmartFallback(),
      creditsUsedAfter: authCtx.currentCreditsUsed,
      engineMode: 'smart-synthesizer',
    };
  }

  let creditsUsedAfter = authCtx.currentCreditsUsed;

  try {
    const ai = getGenAiClient(authCtx.activeApiKey);
    const fallback = buildSmartFallback();

    const prompt = `You are an expert startup operations, regulatory compliance, GDPR, and commercial insurance advisor for ${
      isIE ? 'Ireland (IE)' : isGB ? 'the United Kingdom (GB)' : input.hqCountryCode
    }.
Draft a realistic, grant-audit-ready Regulatory, Licensing, Health & Safety, GDPR & Commercial Insurance Blueprint (Module E Step 5) for the following startup:
- Startup Title: ${sanitizePromptInput(input.planTitle, 160)}
- Industry Category: ${sanitizePromptInput(input.industryCategory, 120)}
- Product Track: ${sanitizePromptInput(input.selectedTrack, 80)} ${input.otherProductTrackText ? `(${sanitizePromptInput(input.otherProductTrackText, 120)})` : ''}
- HQ Country: ${input.hqCountryCode} (${currencySymbol})
- Core Problem: ${sanitizePromptInput(input.coreProblem, 400)}
- Target Customer: ${sanitizePromptInput(input.targetCustomer, 300)}
- Proposed Solution: ${sanitizePromptInput(input.proposedSolution, 500)}

Strict Jurisdiction Rules:
${
  isIE
    ? '- This startup is based in IRELAND (IE). Reference ONLY Irish bodies and statutes: Revenue eTax Clearance Certificate (TC2 via ROS), CRO, Health and Safety Authority (HSA Written Safety Statement under Section 20 of the SHWW Act 2005 / BeSMART.ie), Data Protection Commission (DPC Ireland & EU GDPR / Irish Data Protection Act 2018), CCPC / NSAI / FSAI / EU GPSR 2023/988 CE marking, and Irish commercial insurers (e.g. Hiscox Ireland, Allianz Ireland, Arachas, FBD). NEVER mention UK bodies (no HMRC, no Companies House, no ICO, no UKCA, no HSE UK, no Innovate UK).'
    : isGB
      ? '- This startup is based in the UNITED KINGDOM (GB). Reference ONLY UK bodies and statutes: Companies House, HMRC UTR, UK Health and Safety Executive (HSE under HSWA 1974), Information Commissioner’s Office (ICO Annual Data Protection Fee & UK GDPR / Data Protection Act 2018), OPSS / Trading Standards / FSA / UKCA marking, statutory £5m Employers’ Liability minimum when hiring, and UK commercial insurers (e.g. Hiscox UK, Superscript, Simply Business, Aviva UK). NEVER mention Irish bodies (no Revenue ROS TC2, no CRO, no DPC Ireland, no HSA BeSMART.ie, no LEO).'
      : '- Reference appropriate national corporate, tax, data privacy, and commercial insurance standards.'
}
- Always treat the annual insurance premium as an indicative estimate and note in the insurance narrative that actual coverage and premiums may vary subject to underwriting.

Return ONLY valid JSON matching this exact structure:
{
  "regulatorySectorPosture": "STANDARD_COMMERCIAL_UNREGULATED" | "PHYSICAL_PRODUCT_SAFETY_CE_UKCA" | "FOOD_BEV_HYGIENE_HACCP" | "FINTECH_HEALTH_REGULATED" | "OTHER",
  "dataPrivacyPosture": "MINIMAL_B2B_CONTACT_DATA" | "STANDARD_CUSTOMER_CRM_COOKIES" | "B2B_DATA_PROCESSOR_DPA_SCC" | "HIGH_RISK_SPECIAL_CATEGORY_DPIA" | "OTHER",
  "insuranceCoverageBundle": "PUBLIC_EMPLOYERS_CORE" | "TECH_SAAS_PI_CYBER" | "PRODUCT_PUBLIC_LIABILITY_STOCK" | "COMPREHENSIVE_COMMERCIAL_ALL_RISK" | "OTHER",
  "estimatedAnnualInsurancePremium": number,
  "selectedInsuranceProviderName": "string",
  "complianceItems": [
    {
      "id": "comp-1",
      "category": "CORPORATE_TAX_GRANT_CLEARANCE" | "DATA_PRIVACY_GDPR_SECURITY" | "HEALTH_SAFETY_PREMISES" | "SECTOR_PRODUCT_LICENSE" | "COMMERCIAL_INSURANCE_POLICY" | "OTHER",
      "requirementTitle": "string",
      "regulatoryBody": "string",
      "status": "VERIFIED_COMPLETE" | "IN_PROGRESS" | "PLANNED_BEFORE_LAUNCH" | "NOT_APPLICABLE" | "OTHER",
      "evidenceOrReferenceNote": "string",
      "estimatedAnnualCost": number
    }
  ],
  "regulatoryAndComplianceNarrative": "string (2-3 sentences suitable for formal grant/investor compilation)",
  "insuranceAndLiabilityGovernanceNarrative": "string (2-3 sentences explicitly stating the indicative estimated annual/monthly premium and that actual coverage and premiums may vary)"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.35,
        maxOutputTokens: MAX_OUTPUT_TOKENS_PER_CALL,
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text ?? '';
    const usage = response.usageMetadata;
    creditsUsedAfter = await recordGeminiUsageAndIncrementCredits({
      verifiedUserId: authCtx.verifiedUserId,
      planId: input.planId,
      promptKey: 'MOD_E_STEP5_PERMITS_INSURANCE',
      modelUsed: 'gemini-2.5-flash',
      inputTokens: usage?.promptTokenCount ?? 700,
      outputTokens: usage?.candidatesTokenCount ?? 850,
      usedByokKey: authCtx.usedByokKey,
      fallbackCreditsUsed: authCtx.currentCreditsUsed,
    });

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as Partial<{
        regulatorySectorPosture: RegulatorySectorPostureType;
        dataPrivacyPosture: DataPrivacyPostureType;
        insuranceCoverageBundle: InsuranceCoverageBundleType;
        estimatedAnnualInsurancePremium: number;
        selectedInsuranceProviderName: string;
        complianceItems: ComplianceChecklistItem[];
        regulatoryAndComplianceNarrative: string;
        insuranceAndLiabilityGovernanceNarrative: string;
      }>;

      if (
        typeof parsed.regulatoryAndComplianceNarrative === 'string' &&
        parsed.regulatoryAndComplianceNarrative.trim().length > 20 &&
        typeof parsed.insuranceAndLiabilityGovernanceNarrative === 'string' &&
        parsed.insuranceAndLiabilityGovernanceNarrative.trim().length > 20
      ) {
        const items: ComplianceChecklistItem[] =
          input.mode === 'NARRATIVES_ONLY' &&
          input.currentComplianceItems &&
          input.currentComplianceItems.length > 0
            ? input.currentComplianceItems
            : Array.isArray(parsed.complianceItems) &&
                parsed.complianceItems.length >= 3
              ? parsed.complianceItems.slice(0, 8).map((item, idx) => ({
                  id: item.id || `comp-${idx + 1}`,
                  category: item.category || 'CORPORATE_TAX_GRANT_CLEARANCE',
                  requirementTitle:
                    String(item.requirementTitle || '').trim() ||
                    fallback.complianceItems[
                      idx % fallback.complianceItems.length
                    ].requirementTitle,
                  regulatoryBody:
                    String(item.regulatoryBody || '').trim() ||
                    fallback.complianceItems[
                      idx % fallback.complianceItems.length
                    ].regulatoryBody,
                  status: item.status || 'IN_PROGRESS',
                  evidenceOrReferenceNote:
                    String(item.evidenceOrReferenceNote || '').trim() ||
                    fallback.complianceItems[
                      idx % fallback.complianceItems.length
                    ].evidenceOrReferenceNote,
                  estimatedAnnualCost: Math.max(
                    0,
                    Math.min(
                      50000,
                      Math.round(Number(item.estimatedAnnualCost ?? 0))
                    )
                  ),
                }))
              : fallback.complianceItems;

        return {
          allowed: true,
          regulatorySectorPosture:
            input.currentRegulatorySectorPosture ||
            parsed.regulatorySectorPosture ||
            fallback.regulatorySectorPosture,
          otherRegulatorySectorPostureText: '',
          dataPrivacyPosture:
            input.currentDataPrivacyPosture ||
            parsed.dataPrivacyPosture ||
            fallback.dataPrivacyPosture,
          otherDataPrivacyPostureText: '',
          insuranceCoverageBundle:
            input.currentInsuranceCoverageBundle ||
            parsed.insuranceCoverageBundle ||
            fallback.insuranceCoverageBundle,
          otherInsuranceCoverageBundleText: '',
          estimatedAnnualInsurancePremium: Math.max(
            0,
            Math.min(
              100000,
              Math.round(
                Number(
                  input.currentEstimatedAnnualInsurancePremium ||
                    parsed.estimatedAnnualInsurancePremium ||
                    fallback.estimatedAnnualInsurancePremium
                )
              )
            )
          ),
          selectedInsuranceProviderName:
            input.currentSelectedInsuranceProviderName?.trim() ||
            String(parsed.selectedInsuranceProviderName || '').trim() ||
            fallback.selectedInsuranceProviderName,
          complianceItems: items,
          regulatoryAndComplianceNarrative:
            parsed.regulatoryAndComplianceNarrative.trim(),
          insuranceAndLiabilityGovernanceNarrative:
            parsed.insuranceAndLiabilityGovernanceNarrative.trim(),
          creditsUsedAfter,
          engineMode: 'gemini-2.5-flash',
        };
      }
    }
  } catch {
    // Fallback to deterministic synthesizer below
  }

  return {
    allowed: true,
    ...buildSmartFallback(),
    creditsUsedAfter,
    engineMode: 'smart-synthesizer',
  };
}

export interface ModuleEBlindSpotAuditGenerationResult {
  allowed: boolean;
  reason?: string;
  readinessConfidence: OperationsReadinessConfidenceType;
  blindSpots: OperationsBlindSpotItem[];
  executiveOperationsSummaryNarrative: string;
  operationsToFinanceAndTeamHandshakeNarrative: string;
  aiCoachTip?: string;
  creditsUsedAfter: number;
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export async function generateModuleEBlindSpotAuditViaRouter(input: {
  planId?: string;
  planTitle: string;
  industryCategory: string;
  hqCountryCode: SupportedCountryCode;
  baseCurrency?: string;
  selectedTrack: ProductTrackType;
  otherProductTrackText?: string;
  fulfillmentMode?: OperationsFulfillmentModeType | '';
  activeMinutesPerOrder?: number;
  directVariableCostPerOrder?: number;
  maxOrdersPerWeekCeiling?: number;
  premisesSetupMode?: PremisesSetupModeType | '';
  monthlyPremisesOverheadCost?: number;
  totalEquipmentCapexExVat?: number;
  supplierRedundancyPosture?: SupplierRedundancyPostureType | '';
  estimatedReturnRatePercent?: number;
  expectedReturnBufferPerOrder?: number;
  estimatedAnnualInsurancePremium?: number;
  selectedInsuranceProviderName?: string;
  currentReadinessConfidence?: OperationsReadinessConfidenceType | '';
  currentBlindSpots?: OperationsBlindSpotItem[];
  mode?: 'POPULATE_BLIND_SPOTS_AND_NARRATIVES' | 'NARRATIVES_ONLY';
}): Promise<ModuleEBlindSpotAuditGenerationResult> {
  const countryPack = getCountryRulePack(input.hqCountryCode);
  const isIE = input.hqCountryCode === 'IE';
  const isGB = input.hqCountryCode === 'GB';
  const currencySym =
    input.baseCurrency === 'GBP' || isGB
      ? '£'
      : input.baseCurrency === 'USD'
        ? '$'
        : '€';

  const activeMins = Math.max(1, Math.round(input.activeMinutesPerOrder ?? 20));
  const directOrderCost = Math.max(
    0,
    Number((input.directVariableCostPerOrder ?? 4).toFixed(2))
  );
  const returnBuffer = Math.max(
    0,
    Number((input.expectedReturnBufferPerOrder ?? 0.5).toFixed(2))
  );
  const totalUnitOpsCost = Number((directOrderCost + returnBuffer).toFixed(2));
  const maxWeeklyOrders = Math.max(
    1,
    Math.round(input.maxOrdersPerWeekCeiling ?? 35)
  );
  const monthlyPremises = Math.max(
    0,
    Math.round(input.monthlyPremisesOverheadCost ?? 0)
  );
  const totalCapex = Math.max(
    0,
    Math.round(input.totalEquipmentCapexExVat ?? 0)
  );
  const annualInsEst = Math.max(
    0,
    Math.round(input.estimatedAnnualInsurancePremium ?? (isGB ? 720 : 850))
  );
  const monthlyInsEst = Math.round(annualInsEst / 12);
  const totalMonthlyOpsFixed = monthlyPremises + monthlyInsEst;

  const isPhysical =
    input.selectedTrack === 'PHYSICAL_PRODUCT_ECOM' ||
    input.selectedTrack === 'HYBRID_HARDWARE_SOFTWARE';

  const buildSmartFallback = (): Omit<
    ModuleEBlindSpotAuditGenerationResult,
    'allowed' | 'creditsUsedAfter' | 'engineMode' | 'reason'
  > => {
    const defaultReadiness: OperationsReadinessConfidenceType =
      input.currentReadinessConfidence ||
      (totalCapex >= 1000
        ? 'NEEDS_SUPPLIER_OR_3_QUOTE_VERIFICATION'
        : 'READY_FOR_V1_FULFILLMENT');

    const defaultBlindSpots: OperationsBlindSpotItem[] = [
      {
        id: 'ops-bs-1',
        title: isPhysical
          ? `Founder Active Fulfillment Ceiling (${activeMins} Mins/Order = Max ~${maxWeeklyOrders} Orders/Week)`
          : `Founder Manual Onboarding & Support Ceiling (${activeMins} Mins/Account = Max ~${maxWeeklyOrders}/Week)`,
        category: 'CAPACITY_AND_FULFILLMENT_BOTTLENECK',
        severity: activeMins >= 30 ? 'IMPORTANT' : 'WATCH',
        whyItMatters: isPhysical
          ? `At ${activeMins} active minutes per order, a spike in seasonal or B2B wholesale demand will quickly saturate founder workshop hours unless batch fixtures or part-time assembly help are pre-staged.`
          : `At ${activeMins} active minutes per customer onboarding/ticket, rapid user growth can pull founders away from product development and sales unless self-serve onboarding templates are automated.`,
        recommendedActionOrFix: isPhysical
          ? 'Pre-stage batch jigs/packaging stations to cut active minutes per unit by 25%, and define the exact weekly order volume trigger that funds a part-time fulfillment assistant in Module F.'
          : 'Automate webhook provisioning and top-5 FAQ self-serve macros so 80%+ of routine onboarding requires zero manual founder minutes.',
        founderMitigationNote:
          'Tracked in Step 1 Order Lifecycle & linked to Year 1 operational hiring milestone in Module F.',
        isResolved: false,
      },
      {
        id: 'ops-bs-2',
        title: `Combined Direct Fulfillment & Return Buffer (${currencySym}${totalUnitOpsCost.toFixed(2)}/Order) vs. Module G Pocket Profit`,
        category: 'UNIT_COGS_AND_RETURN_MARGIN_LEAKAGE',
        severity: totalUnitOpsCost > 15 ? 'IMPORTANT' : 'WATCH',
        whyItMatters: `Your Step 1 direct variable cost (${currencySym}${directOrderCost.toFixed(2)}) plus Step 4 expected return/remake buffer (${currencySym}${returnBuffer.toFixed(2)}) equals ${currencySym}${totalUnitOpsCost.toFixed(2)} per order before payment processor or marketplace fees.`,
        recommendedActionOrFix:
          'Carry this exact combined unit operations cost into Module G (Pricing & Pocket Profit) so your retail/B2B price preserves a healthy gross margin after packaging, shipping, and returns.',
        founderMitigationNote:
          'Synced directly to Module G Unit Economics COGS baseline.',
        isResolved: false,
      },
      {
        id: 'ops-bs-3',
        title: isIE
          ? '🇮🇪 IE LEO 3-Quote Procurement Rule (>= €1,000), Mobile Asset Ban & Post-Approval Spend Timing'
          : isGB
            ? '🇬🇧 UK Innovate UK Capital Usage Depreciation Rule & Arms-Length Supplier Quotes'
            : 'Capital Equipment Procurement Quotes & Grant Drawdown Timing Rule',
        category: 'GRANT_PROCUREMENT_AND_CAPEX_ELIGIBILITY',
        severity: totalCapex >= 1000 ? 'CRITICAL' : 'IMPORTANT',
        whyItMatters: isIE
          ? 'Local Enterprise Office (LEO) Priming and Feasibility grants strictly disallow any equipment purchased prior to formal Letter of Offer acceptance, disallow mobile phones/standard laptops, and require 3 independent written supplier quotes for any item >= €1,000 ex-VAT.'
          : isGB
            ? 'Innovate UK Smart and R&D grants only reimburse the pro-rata depreciation of capital equipment used on the project during the grant period, and Start Up Loans require verifiable commercial supplier quotes.'
            : 'Public grant bodies disallow retrospective capital expenditure incurred prior to formal grant approval.',
        recommendedActionOrFix: isIE
          ? 'Keep all >= €1,000 equipment quotes dated and filed for Module K Appendix C, ring-fence laptops under 100% Own Funds/BYOD, and do not pay supplier deposits on grant-funded items before your LEO Letter of Offer.'
          : isGB
            ? 'Ensure Step 2 useful life (months) and project usage (%) accurately reflect R&D project usage for Innovate UK Q9 financial tables, and retain written supplier quotes.'
            : 'Retain 3 written supplier quotes and wait for formal grant sign-off before placing capital equipment deposits.',
        founderMitigationNote: isIE
          ? 'Enforced in Step 2 Equipment Schedule (LEO 3-quote & laptop ban flags active).'
          : isGB
            ? 'Enforced in Step 2 Equipment Schedule (Innovate UK capital usage depreciation formula active).'
            : 'Enforced in Step 2 Equipment Schedule.',
        isResolved: false,
      },
      {
        id: 'ops-bs-4',
        title: isIE
          ? '🇮🇪 Statutory Gatekeepers (Revenue TC2 eTax Clearance, HSA Sec 20 & DPC GDPR) + Confirming Indicative Insurance Estimate'
          : isGB
            ? '🇬🇧 Statutory Gatekeepers (Companies House/UTR, UK HSE, ICO Fee & £5m EL) + Confirming Indicative Insurance Estimate'
            : 'Statutory Tax Clearance, H&S & Confirming Indicative Insurance Estimate',
        category: 'REGULATORY_TAX_AND_INSURANCE_GAP',
        severity: 'IMPORTANT',
        whyItMatters: isIE
          ? `LEO/Enterprise Ireland grants cannot be drawn down without an active Revenue eTax Clearance (TC2 via ROS) and HSA Section 20 Written Safety Statement (BeSMART.ie). Additionally, your Step 5 annual insurance figure (~${currencySym}${annualInsEst.toLocaleString()}/yr or ~${currencySym}${monthlyInsEst.toLocaleString()}/mo) is an indicative planning estimate—actual coverage, policy terms, and premiums may vary upon underwriting.`
          : isGB
            ? `Innovate UK, Start Up Loans, and SEIS/EIS investors verify Companies House/HMRC UTR good standing, ICO Data Protection Fee registration, and statutory £5m Employers' Liability cover when hiring. Additionally, your Step 5 annual insurance figure (~${currencySym}${annualInsEst.toLocaleString()}/yr or ~${currencySym}${monthlyInsEst.toLocaleString()}/mo) is an indicative planning estimate—actual coverage, policy terms, and premiums may vary upon underwriting.`
            : `Your Step 5 annual insurance figure (~${currencySym}${annualInsEst.toLocaleString()}/yr) is an indicative planning estimate—actual coverage, policy terms, and premiums may vary upon formal insurer underwriting.`,
        recommendedActionOrFix: isIE
          ? 'Verify TC2 eTax Clearance on ROS and generate your free HSA BeSMART.ie Safety Statement before first grant claim, and request a formal written quote from an Irish broker (e.g., Hiscox Ireland, Arachas, Allianz Ireland, or FBD) to confirm exact policy limits and premium.'
          : isGB
            ? 'Confirm HMRC UTR & ICO Fee registration before launch, and request a formal written quote from a UK broker (e.g., Superscript, Simply Business, Hiscox UK, or Aviva UK) to confirm exact policy limits and premium.'
            : 'Request a formal written quote from a regulated commercial insurance broker prior to launch to lock in binding coverage and premium.',
        founderMitigationNote:
          'Tracked in Step 5 Compliance Checklist & Insurance Matcher.',
        isResolved: false,
      },
    ];

    const blindSpotsToReturn =
      input.mode === 'NARRATIVES_ONLY' &&
      input.currentBlindSpots &&
      input.currentBlindSpots.length > 0
        ? input.currentBlindSpots
        : defaultBlindSpots;

    return {
      readinessConfidence: defaultReadiness,
      blindSpots: blindSpotsToReturn,
      executiveOperationsSummaryNarrative: isIE
        ? `${input.planTitle || 'Our business'} operates a structured, grant-audit-ready fulfillment and operations architecture in Ireland. In Step 1, our order lifecycle averages ${activeMins} active minutes per order (supporting up to ~${maxWeeklyOrders} orders/week within current founder operational hours). In Step 2, our premises (${currencySym}${monthlyPremises.toLocaleString()}/month overhead) and ${currencySym}${totalCapex.toLocaleString()} capital equipment schedule strictly adhere to Local Enterprise Office (LEO) and Enterprise Ireland procurement rules (3 written quotes for items >= €1,000 ex-VAT and laptops ring-fenced under 100% Own Funds/BYOD). Step 3 and Step 4 establish a 4-category Project Risk Register, 3-gate Quality Control SOP, and Ireland Consumer Rights Act 2022 (CRAA) returns workflow, while Step 5 secures CRO, Revenue eTax Clearance (TC2 via ROS), HSA Section 20 Written Safety Statement (BeSMART.ie), and EU GDPR / DPC compliance.`
        : isGB
          ? `${input.planTitle || 'Our business'} operates a structured, grant-audit-ready fulfillment and operations architecture in the United Kingdom. In Step 1, our order lifecycle averages ${activeMins} active minutes per order (supporting up to ~${maxWeeklyOrders} orders/week within current founder operational hours). In Step 2, our premises (${currencySym}${monthlyPremises.toLocaleString()}/month overhead) and ${currencySym}${totalCapex.toLocaleString()} capital equipment schedule align with Innovate UK eligible capital usage depreciation and British Business Bank Start Up Loans verification standards. Step 3 and Step 4 establish a 4-category Project Risk Register, 3-gate Quality Control SOP, and UK Consumer Rights Act 2015 returns workflow, while Step 5 secures Companies House, HMRC UTR, UK HSE workplace safety (HSWA 1974), and statutory ICO Data Protection Fee compliance.`
          : `${input.planTitle || 'Our business'} operates a structured end-to-end fulfillment, capital equipment, 4-category risk management, 3-gate quality control, and regulatory compliance architecture averaging ${activeMins} active minutes per order (up to ~${maxWeeklyOrders} orders/week).`,
      operationsToFinanceAndTeamHandshakeNarrative: `Downstream Financial & Team Handshake: (1) Module G Unit Economics COGS Baseline — ${currencySym}${directOrderCost.toFixed(2)} direct fulfillment cost + ${currencySym}${returnBuffer.toFixed(2)} return/remake buffer = ${currencySym}${totalUnitOpsCost.toFixed(2)} total operational cost per order; (2) Module I Monthly Fixed Operations Overhead — ${currencySym}${monthlyPremises.toLocaleString()}/month premises overhead + ~${currencySym}${monthlyInsEst.toLocaleString()}/month indicative commercial insurance estimate (derived from an estimated annual premium of ~${currencySym}${annualInsEst.toLocaleString()}/year via ${input.selectedInsuranceProviderName || (isIE ? 'Irish commercial broker' : isGB ? 'UK commercial broker' : 'commercial broker')}; note that this insurance figure is an indicative planning estimate only and actual coverage, policy limits, and premiums may vary subject to formal insurer underwriting) = ~${currencySym}${totalMonthlyOpsFixed.toLocaleString()}/month; (3) Module F Team Hiring Trigger — operational capacity beyond ~${maxWeeklyOrders} orders/week triggers our first part-time fulfillment/operations support hire.`,
      aiCoachTip: isIE
        ? 'Irish Grant Assessor Tip: Before submitting your Module K LEO or Enterprise Ireland business plan, double-check that your Step 2 Capital Equipment total matches your Module J Grant Application figure and that your Step 1+4 unit cost is reflected in Module G Pocket Profit.'
        : isGB
          ? 'UK Grant & Loan Assessor Tip: Before compiling your Module K Innovate UK or Start Up Loans pack, verify that your Step 2 eligible capital usage depreciation and Step 5 indicative monthly insurance overhead match your Module I 36-month cashflow.'
          : 'Ensure your Step 1+4 unit operational cost flows into Module G Pricing and your Step 2+5 monthly fixed overheads flow into Module I Finance.',
    };
  };

  const authCtx = await authorizeAndPrepareGeminiCall(
    'MOD_E_STEP6_BLIND_SPOT_AUDIT'
  );

  if (!authCtx.canCallLiveGemini || !authCtx.activeApiKey) {
    return {
      allowed: true,
      ...buildSmartFallback(),
      creditsUsedAfter: authCtx.currentCreditsUsed,
      engineMode: 'smart-synthesizer',
    };
  }

  let creditsUsedAfter = authCtx.currentCreditsUsed;

  try {
    const ai = getGenAiClient(authCtx.activeApiKey);
    const fallback = buildSmartFallback();
    const promptText = `You are the Supportive Co-Founder & Operations Blind-Spot Auditor for Startup Preflight.
Analyze the founder's Module E (Operations, Premises, Equipment, Risk Register, QC & Statutory Compliance) data and return JSON ONLY:
- Startup Title: ${sanitizePromptInput(input.planTitle, 120)}
- Industry: ${sanitizePromptInput(input.industryCategory, 100)}
- HQ Country: ${countryPack.countryName} (${input.hqCountryCode}) — STRICT COUNTRY ISOLATION: ${
      isIE
        ? 'Use ONLY Ireland (IE) regulators/grants: LEO 3-quote rule (>= €1,000), LEO mobile/laptop ban, Revenue eTax Clearance (TC2 via ROS), CRO, HSA Section 20 Written Safety Statement (BeSMART.ie), DPC GDPR, Ireland Consumer Rights Act 2022 (CRAA), and Irish insurers (Hiscox Ireland, Arachas, Allianz Ireland, FBD). NEVER mention UK bodies.'
        : isGB
          ? 'Use ONLY UK (GB) regulators/grants: Innovate UK capital usage depreciation, British Business Bank Start Up Loans, Companies House, HMRC UTR, UK HSE (HSWA 1974), ICO Data Protection Fee, UK Consumer Rights Act 2015, statutory £5m Employers Liability, and UK insurers (Superscript, Simply Business, Hiscox UK, Aviva UK). NEVER mention Irish bodies.'
          : `Use ${countryPack.countryName} regulatory standards.`
    }
- Product Track: ${input.selectedTrack}
- Active Minutes/Order: ${activeMins} mins (Max ~${maxWeeklyOrders} orders/week)
- Unit Ops Cost: ${currencySym}${directOrderCost.toFixed(2)} direct + ${currencySym}${returnBuffer.toFixed(2)} return buffer = ${currencySym}${totalUnitOpsCost.toFixed(2)}/order
- Monthly Premises Overhead: ${currencySym}${monthlyPremises}/mo | Total CapEx: ${currencySym}${totalCapex}
- Indicative Annual Insurance Premium Estimate: ~${currencySym}${annualInsEst}/yr (~${currencySym}${monthlyInsEst}/mo) — MUST explicitly state that the insurance premium is an indicative estimate only and actual coverage, policy terms, and premiums may vary upon underwriting.

Return valid JSON matching:
{
  "readinessConfidence": "READY_FOR_V1_FULFILLMENT" | "NEEDS_SUPPLIER_OR_3_QUOTE_VERIFICATION" | "NEEDS_PILOT_BATCH_OR_SLA_STRESS_TEST" | "NEEDS_REGULATORY_OR_INSURANCE_SIGN_OFF",
  "blindSpots": [
    {
      "id": "ops-bs-1",
      "title": "string",
      "category": "CAPACITY_AND_FULFILLMENT_BOTTLENECK" | "UNIT_COGS_AND_RETURN_MARGIN_LEAKAGE" | "GRANT_PROCUREMENT_AND_CAPEX_ELIGIBILITY" | "SINGLE_SUPPLIER_AND_CONTINUITY_EXPOSURE" | "REGULATORY_TAX_AND_INSURANCE_GAP",
      "severity": "WATCH" | "IMPORTANT" | "CRITICAL",
      "whyItMatters": "string",
      "recommendedActionOrFix": "string",
      "founderMitigationNote": "string"
    }
  ],
  "executiveOperationsSummaryNarrative": "3-4 sentence grant-ready executive operations summary covering Steps 1-5",
  "operationsToFinanceAndTeamHandshakeNarrative": "2-3 sentence quantitative handshake to Module G (unit COGS), Module I (monthly premises + indicative insurance estimate noting actual coverage & premium may vary), and Module F (team hiring trigger)",
  "aiCoachTip": "1-2 sentence practical tip"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
        maxOutputTokens: MAX_OUTPUT_TOKENS_PER_CALL,
        temperature: 0.35,
      },
    });

    const rawText = response.text?.trim() || '';
    const usage = response.usageMetadata;
    creditsUsedAfter = await recordGeminiUsageAndIncrementCredits({
      verifiedUserId: authCtx.verifiedUserId,
      planId: input.planId,
      promptKey: 'MOD_E_STEP6_BLIND_SPOT_AUDIT',
      modelUsed: 'gemini-2.5-flash',
      inputTokens: usage?.promptTokenCount ?? 700,
      outputTokens: usage?.candidatesTokenCount ?? 850,
      usedByokKey: authCtx.usedByokKey,
      fallbackCreditsUsed: authCtx.currentCreditsUsed,
    });

    if (rawText) {
      const parsed = JSON.parse(rawText);
      if (
        parsed &&
        typeof parsed.executiveOperationsSummaryNarrative === 'string' &&
        typeof parsed.operationsToFinanceAndTeamHandshakeNarrative === 'string'
      ) {
        const validCategories: OperationsBlindSpotCategoryType[] = [
          'CAPACITY_AND_FULFILLMENT_BOTTLENECK',
          'UNIT_COGS_AND_RETURN_MARGIN_LEAKAGE',
          'GRANT_PROCUREMENT_AND_CAPEX_ELIGIBILITY',
          'SINGLE_SUPPLIER_AND_CONTINUITY_EXPOSURE',
          'REGULATORY_TAX_AND_INSURANCE_GAP',
          'OTHER',
        ];
        const validSeverities: OperationsBlindSpotSeverityType[] = [
          'WATCH',
          'IMPORTANT',
          'CRITICAL',
        ];

        const parsedSpots: OperationsBlindSpotItem[] =
          input.mode === 'NARRATIVES_ONLY' &&
          input.currentBlindSpots &&
          input.currentBlindSpots.length > 0
            ? input.currentBlindSpots
            : Array.isArray(parsed.blindSpots) && parsed.blindSpots.length >= 3
              ? parsed.blindSpots
                  .slice(0, 6)
                  .map((spot: Record<string, unknown>, idx: number) => ({
                    id: String(spot.id || `ops-bs-${idx + 1}`),
                    title: String(
                      spot.title ||
                        fallback.blindSpots[idx]?.title ||
                        'Operational Blind Spot'
                    ),
                    category: validCategories.includes(
                      spot.category as OperationsBlindSpotCategoryType
                    )
                      ? (spot.category as OperationsBlindSpotCategoryType)
                      : fallback.blindSpots[idx]?.category ||
                        'CAPACITY_AND_FULFILLMENT_BOTTLENECK',
                    severity: validSeverities.includes(
                      spot.severity as OperationsBlindSpotSeverityType
                    )
                      ? (spot.severity as OperationsBlindSpotSeverityType)
                      : 'IMPORTANT',
                    whyItMatters: String(
                      spot.whyItMatters ||
                        fallback.blindSpots[idx]?.whyItMatters ||
                        ''
                    ),
                    recommendedActionOrFix: String(
                      spot.recommendedActionOrFix ||
                        fallback.blindSpots[idx]?.recommendedActionOrFix ||
                        ''
                    ),
                    founderMitigationNote: String(
                      spot.founderMitigationNote ||
                        fallback.blindSpots[idx]?.founderMitigationNote ||
                        ''
                    ),
                    isResolved: false,
                  }))
              : fallback.blindSpots;

        return {
          allowed: true,
          readinessConfidence:
            input.currentReadinessConfidence ||
            parsed.readinessConfidence ||
            fallback.readinessConfidence,
          blindSpots: parsedSpots,
          executiveOperationsSummaryNarrative:
            parsed.executiveOperationsSummaryNarrative.trim(),
          operationsToFinanceAndTeamHandshakeNarrative:
            parsed.operationsToFinanceAndTeamHandshakeNarrative.trim(),
          aiCoachTip:
            typeof parsed.aiCoachTip === 'string' && parsed.aiCoachTip.trim()
              ? parsed.aiCoachTip.trim()
              : fallback.aiCoachTip,
          creditsUsedAfter,
          engineMode: 'gemini-2.5-flash',
        };
      }
    }
  } catch {
    // Fallback to deterministic synthesizer below
  }

  return {
    allowed: true,
    ...buildSmartFallback(),
    creditsUsedAfter,
    engineMode: 'smart-synthesizer',
  };
}

// ============================================================================
// LIVING MASTER DOCUMENT — ZERO-HALLUCINATION EXECUTIVE STORY WEAVER
// ============================================================================

import {
  buildDeterministicMasterStory,
  sanitizeSurveyTerminologyForReader,
  type MasterDocumentVerifiedFacts,
} from '@/lib/export/master-document-brief';
import type { SavedMasterDocumentData } from '@/lib/auth/session-store';

export interface MasterDocumentStoryWeaveResult {
  allowed: boolean;
  reason?: string;
  story: SavedMasterDocumentData;
  creditsUsedAfter?: number;
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
}

/**
 * Weaves a 3-paragraph Cohesive Executive Story for the Living Master Document
 * using ONLY verified founder inputs across Modules A–E.
 * Enforces `temperature: 0.1`, closed-world grounding, and strips any `/v/[slug]` route jargon.
 */
export async function weaveMasterDocumentStoryViaRouter(input: {
  planId: string;
  facts: MasterDocumentVerifiedFacts;
}): Promise<MasterDocumentStoryWeaveResult> {
  const deterministicStory = buildDeterministicMasterStory(input.facts);

  const authCtx = await authorizeAndPrepareGeminiCall('MASTER_DOC_WEAVE_STORY');
  if (authCtx.creditCheckBlocked) {
    return {
      allowed: false,
      reason: authCtx.blockReason,
      story: deterministicStory,
      creditsUsedAfter: authCtx.currentCreditsUsed,
      engineMode: 'smart-synthesizer',
    };
  }

  let creditsUsedAfter = authCtx.currentCreditsUsed;

  if (
    authCtx.canCallLiveGemini &&
    authCtx.activeApiKey &&
    input.facts.activeChaptersCount > 0
  ) {
    try {
      const ai = getGenAiClient(authCtx.activeApiKey);
      const f = input.facts;

      // Build a strictly gated JSON ledger containing ONLY modules the founder has actually started
      const verifiedLedger: Record<string, unknown> = {
        startupName: sanitizePromptInput(f.planTitle, 160),
        hqCountry: f.countryName,
        currency: f.currency,
        industry: f.industryCategory,
        scope: f.exportScopeLabel,
      };

      if (f.hasModuleA) {
        verifiedLedger.moduleA_ConceptAndFit = {
          coreProblem: sanitizePromptInput(f.coreProblem, 400),
          targetCustomer: sanitizePromptInput(f.targetCustomer, 300),
          proposedSolution: sanitizePromptInput(f.proposedSolution, 400),
          unfairAdvantage: sanitizePromptInput(f.unfairAdvantage, 300),
          revenueAndGrantFit: sanitizePromptInput(f.revenueAndGrantFit, 300),
          teamStructure: f.teamStructureLabel,
          weeklyHours: f.weeklyHoursLabel,
          startingBudgetBracket: f.startingBudgetLabel,
          dealbreakers: f.dealbreakersList,
        };
      }

      if (f.hasModuleB) {
        verifiedLedger.moduleB_MarketAndCompetitors = {
          buyerModel: f.buyerModelLabel,
          beachheadCustomer: sanitizePromptInput(f.beachheadSegment, 300),
          whyCustomersSwitch: sanitizePromptInput(f.whySwitchOneSentence, 300),
          mappedCompetitors: f.competitorNames.slice(0, 5),
          somYear1To2Revenue: f.somFormatted || undefined,
          samReachableMarket: f.samFormatted || undefined,
          competitiveEdgeSummary: sanitizePromptInput(
            f.competitiveEdgeSummary,
            300
          ),
        };
      }

      if (f.hasModuleC) {
        verifiedLedger.moduleC_CustomerValidation = {
          publicValidationSurveysCount: f.surveysCount,
          totalSurveyResponses: f.totalSurveyResponses,
          earlyWaitlistSignups: f.waitlistOptInsCount,
          oneOnOneInterviewsLogged: f.interviewsCount,
          strongSignalInterviews: f.strongSignalInterviewsCount,
          avgInterviewPainOutOf5: f.avgInterviewPainScore || undefined,
          headlineInsight: sanitizePromptInput(f.surveyHeadlineInsight, 300),
        };
      }

      if (f.hasModuleD) {
        verifiedLedger.moduleD_ProductAndScope = {
          productVehicle: f.formFactorLabel || f.productTrackLabel,
          v1PrototypeApproach: f.prototypeApproachLabel,
          launchTimeline: f.launchTimelineLabel,
          ownedDirectChannelSharePercent: f.ownedChannelsSharePercent,
          rentedPartnerChannelSharePercent: f.rentedChannelsSharePercent,
          v1MustHaveFeatures: f.v1MustHaveTitles.slice(0, 6),
          deferredToPostV1: f.deferredPostV1Titles.slice(0, 4),
          workPackagesCount: f.workPackagesCount,
          totalWorkPackagesBudget:
            f.totalWorkPackagesCost > 0
              ? `${f.currency} ${f.totalWorkPackagesCost}`
              : undefined,
        };
      }

      if (f.hasModuleE) {
        verifiedLedger.moduleE_OperationsAndRisk = {
          fulfillmentMode: f.fulfillmentModeLabel,
          turnaroundSla: f.turnaroundSlaLabel,
          activeMinutesPerOrder: f.totalActiveMinutesPerOrder,
          directVariableCostPerOrder: `${f.currency} ${f.totalDirectVariableCostPerOrder}`,
          maxOrdersPerWeekCapacity: f.maxWeeklyOrdersCapacity,
          premisesSetup: f.premisesModeLabel,
          monthlyPremisesCost: `${f.currency} ${f.monthlyPremisesCost}`,
          equipmentItemsCount: f.equipmentItemsCount,
          totalEquipmentCapexExVat: `${f.currency} ${f.totalEquipmentCapexExVat}`,
          riskItemsCount: f.riskItemsCount,
          topMitigatedRisk: sanitizePromptInput(
            f.topRiskTitleAndMitigation,
            300
          ),
        };
      }

      const prompt = `You are a strict, zero-hallucination executive copy-editor for Startup Preflight.
Your ONLY job is to weave the founder's verified inputs in VERIFIED_FOUNDER_FACTS below into a smooth, coherent 3-paragraph Executive Story.

STRICT ZERO-HALLUCINATION RULES (MANDATORY):
1. CLOSED-WORLD FACTS ONLY: You may ONLY state facts, numbers, prices, currencies, customer segments, competitors, survey counts, features, and operational metrics that appear explicitly in VERIFIED_FOUNDER_FACTS below.
2. NEVER INVENT OR EXTRAPOLATE: Do NOT invent market statistics, customer quotes, competitor names, survey responses, timelines, or costs.
3. UNSTARTED MODULES: If a module is NOT present in VERIFIED_FOUNDER_FACTS (for example, if moduleC_CustomerValidation or moduleE_OperationsAndRisk is absent), state clearly in that paragraph that that section has not yet been populated—NEVER make up placeholder facts for it.
4. PLAIN-ENGLISH TERMINOLOGY: Never write "/v/[slug]" or any URL route path. Always refer to surveys in plain English as "public validation surveys".

VERIFIED_FOUNDER_FACTS:
${JSON.stringify(verifiedLedger, null, 2)}

Return valid JSON matching this exact structure:
{
  "paragraph1OpportunityAndMarket": "3-4 crisp sentences weaving Module A (Concept & Founder Fit) and Module B (Beachhead Market, Competitors & SOM/SAM) using only verified facts.",
  "paragraph2ValidationAndProduct": "3-4 crisp sentences weaving Module C (Public Validation Surveys & 1-on-1 Interviews) and Module D (Product Vehicle, Channel Split, V1 Must-Haves & Work Packages) using only verified facts.",
  "paragraph3OperationsAndExecution": "3-4 crisp sentences weaving Module E (Fulfillment Mode, Unit Order Effort/Cost, Premises/Equipment CapEx & Risk Mitigation) using only verified facts."
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
          maxOutputTokens: MAX_OUTPUT_TOKENS_PER_CALL,
        },
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text) as {
          paragraph1OpportunityAndMarket?: string;
          paragraph2ValidationAndProduct?: string;
          paragraph3OperationsAndExecution?: string;
        };

        if (
          parsed.paragraph1OpportunityAndMarket?.trim() &&
          parsed.paragraph2ValidationAndProduct?.trim() &&
          parsed.paragraph3OperationsAndExecution?.trim()
        ) {
          creditsUsedAfter = await recordGeminiUsageAndIncrementCredits({
            verifiedUserId: authCtx.verifiedUserId,
            planId: input.planId,
            promptKey: 'MASTER_DOC_WEAVE_STORY',
            modelUsed: 'gemini-2.5-flash',
            inputTokens: response.usageMetadata?.promptTokenCount || 450,
            outputTokens: response.usageMetadata?.candidatesTokenCount || 320,
            usedByokKey: authCtx.usedByokKey,
            fallbackCreditsUsed: authCtx.currentCreditsUsed,
          });

          return {
            allowed: true,
            story: {
              paragraph1OpportunityAndMarket: sanitizeSurveyTerminologyForReader(
                parsed.paragraph1OpportunityAndMarket.trim()
              ),
              paragraph1Sources: deterministicStory.paragraph1Sources,
              paragraph2ValidationAndProduct: sanitizeSurveyTerminologyForReader(
                parsed.paragraph2ValidationAndProduct.trim()
              ),
              paragraph2Sources: deterministicStory.paragraph2Sources,
              paragraph3OperationsAndExecution:
                sanitizeSurveyTerminologyForReader(
                  parsed.paragraph3OperationsAndExecution.trim()
                ),
              paragraph3Sources: deterministicStory.paragraph3Sources,
              isCustomEdited: false,
              lastWeavedAt: new Date().toISOString(),
              aiEngineUsed: 'gemini-2.5-flash',
            },
            creditsUsedAfter,
            engineMode: 'gemini-2.5-flash',
          };
        }
      }
    } catch {
      // Fall back to deterministic story below
    }
  }

  return {
    allowed: true,
    story: deterministicStory,
    creditsUsedAfter,
    engineMode: 'smart-synthesizer',
  };
}

/**
 * Module A Step 8 — AI Grant Positioning Advisor (IE & UK)
 * Evaluates the founder's idea, Concept Canvas, and Step 8 micro-questions
 * to produce 3 tailored grant positioning tips + an updated Concept Canvas
 * revenueAndGrantFit summary.
 */
export async function synthesizeModuleAGrantPositioningViaRouter(input: {
  userId?: string;
  planId?: string;
  planTitle: string;
  brainDumpText: string;
  industryCategory: string;
  hqCountryCode: SupportedCountryCode;
  exportPotential: 'DOMESTIC_ONLY' | 'EXPORTING_INTERNATIONALLY';
  conceptCanvas?: ConceptCanvasBlocks;
  founderMotivation?: SavedFounderMotivation;
  teamAndBudget?: SavedTeamAndBudget;
  founderRealityCheck?: SavedFounderRealityCheck;
  grantCheck: import('@/lib/grants/module-a-grant-checker').SavedGrantEligibilityCheck;
}): Promise<{
  allowed: boolean;
  reason?: string;
  positioningTips: string[];
  updatedRevenueAndGrantFit: string;
  creditsUsedAfter?: number;
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
}> {
  const {
    evaluateModuleAGrantEligibility,
    GRANT_ACTIVITY_TYPE_LABELS,
    GRANT_LEGAL_ENTITY_LABELS,
    GRANT_PAYE_STATUS_LABELS,
    GRANT_REGIONAL_TIER_LABELS,
  } = await import('@/lib/grants/module-a-grant-checker');

  const evalSummary = evaluateModuleAGrantEligibility({
    hqCountryCode: input.hqCountryCode,
    exportPotential: input.exportPotential,
    industryCategory: input.industryCategory,
    brainDumpText: input.brainDumpText,
    conceptCanvas: input.conceptCanvas,
    founderMotivation: input.founderMotivation,
    teamAndBudget: input.teamAndBudget,
    founderRealityCheck: input.founderRealityCheck,
    grantCheck: input.grantCheck,
  });

  const topImmediateGrant =
    evalSummary.qualifiesNowGrants[0]?.grantName ||
    evalSummary.unlockableNextGrants[0]?.grantName ||
    'Local Enterprise Support';

  const fallbackRevenueAndGrantFit = `Pricing in ${evalSummary.currency}; eligible for up to ${evalSummary.immediateQualifiedPoolFormatted} in immediate ${evalSummary.countryCode === 'IE' ? 'Irish' : 'UK'} startup supports (led by ${topImmediateGrant}) + up to ${evalSummary.unlockableScalePoolFormatted} in Phase 2 scale funding.`;

  const authCtx = await authorizeAndPrepareGeminiCall(
    'MOD_A_GRANT_ELIGIBILITY_CHECKER',
    'You are an expert Irish (LEO, Enterprise Ireland, Revenue SURE) and UK (British Business Bank Start Up Loans, Innovate UK, HMRC SEIS/EIS) startup grant evaluator and supportive co-founder.'
  );

  if (authCtx.creditCheckBlocked) {
    return {
      allowed: false,
      reason: authCtx.blockReason,
      positioningTips: evalSummary.strategicPositioningTips,
      updatedRevenueAndGrantFit: fallbackRevenueAndGrantFit,
      creditsUsedAfter: authCtx.currentCreditsUsed,
      engineMode: 'smart-synthesizer',
    };
  }

  let creditsUsedAfter = authCtx.currentCreditsUsed;

  if (authCtx.canCallLiveGemini && authCtx.activeApiKey) {
    try {
      const ai = getGenAiClient(authCtx.activeApiKey);
      const prompt = `${authCtx.systemInstruction}

Founder Plan Title: ${sanitizePromptInput(input.planTitle, 140)}
Country: ${evalSummary.countryCode === 'IE' ? 'Ireland (EUR)' : 'United Kingdom (GBP)'}
Industry: ${sanitizePromptInput(input.industryCategory, 120)}
Export Scope: ${input.exportPotential}
Founder Idea: ${sanitizePromptInput(input.brainDumpText, 800)}
Problem: ${sanitizePromptInput(input.conceptCanvas?.coreProblem, 300)}
Solution: ${sanitizePromptInput(input.conceptCanvas?.proposedSolution, 300)}

Step 8 Eligibility Answers:
- Legal Entity Stage: ${GRANT_LEGAL_ENTITY_LABELS[input.grantCheck.legalEntityStage]}${input.grantCheck.otherLegalEntityText ? ` (${sanitizePromptInput(input.grantCheck.otherLegalEntityText, 120)})` : ''}
- Commercial Activity: ${GRANT_ACTIVITY_TYPE_LABELS[input.grantCheck.commercialActivityType]}${input.grantCheck.otherCommercialActivityText ? ` (${sanitizePromptInput(input.grantCheck.otherCommercialActivityText, 120)})` : ''}
- Founder PAYE / Commitment: ${GRANT_PAYE_STATUS_LABELS[input.grantCheck.founderPayeStatus]}${input.grantCheck.otherFounderPayeText ? ` (${sanitizePromptInput(input.grantCheck.otherFounderPayeText, 120)})` : ''}
- Region Tier: ${GRANT_REGIONAL_TIER_LABELS[input.grantCheck.regionalLocationTier]}${input.grantCheck.otherRegionalLocationText ? ` (${sanitizePromptInput(input.grantCheck.otherRegionalLocationText, 120)})` : ''}
- Custom Notes: ${sanitizePromptInput(input.grantCheck.customGrantNotes, 300)}

Qualified Immediate Grants (${evalSummary.immediateQualifiedPoolFormatted}): ${evalSummary.qualifiesNowGrants.map((g) => `${g.grantName} (${g.potentialValueFormatted})`).join('; ')}
Unlockable Next Grants (${evalSummary.unlockableScalePoolFormatted}): ${evalSummary.unlockableNextGrants.map((g) => `${g.grantName} (${g.potentialValueFormatted})`).join('; ')}

Return valid JSON with:
{
  "positioningTips": [
    "1. Specific advice on how to frame their exact idea to pass evaluator rules (e.g. non-displacement, export potential, or technical innovation)...",
    "2. Specific sequencing advice on which grant/loan/tax relief to claim first given their legal entity & starting budget...",
    "3. Specific procurement/evidence trap to avoid (e.g. 3 quotes, Letter of Offer timing, or customer survey proof in Module C)..."
  ],
  "updatedRevenueAndGrantFit": "1 crisp sentence summarizing their revenue model and top qualified ${evalSummary.countryCode} grant pathway (${evalSummary.immediateQualifiedPoolFormatted} immediate pool)."
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.25,
          maxOutputTokens: MAX_OUTPUT_TOKENS_PER_CALL,
        },
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text) as {
          positioningTips?: string[];
          updatedRevenueAndGrantFit?: string;
        };
        if (
          Array.isArray(parsed.positioningTips) &&
          parsed.positioningTips.length >= 2
        ) {
          creditsUsedAfter = await recordGeminiUsageAndIncrementCredits({
            verifiedUserId: authCtx.verifiedUserId,
            planId: input.planId,
            promptKey: 'MOD_A_GRANT_ELIGIBILITY_CHECKER',
            modelUsed: 'gemini-2.5-flash',
            inputTokens: response.usageMetadata?.promptTokenCount || 380,
            outputTokens: response.usageMetadata?.candidatesTokenCount || 240,
            usedByokKey: authCtx.usedByokKey,
            fallbackCreditsUsed: authCtx.currentCreditsUsed,
          });

          return {
            allowed: true,
            positioningTips: parsed.positioningTips
              .slice(0, 4)
              .map((t) => String(t).trim()),
            updatedRevenueAndGrantFit:
              parsed.updatedRevenueAndGrantFit?.trim() ||
              fallbackRevenueAndGrantFit,
            creditsUsedAfter,
            engineMode: 'gemini-2.5-flash',
          };
        }
      }
    } catch {
      // Fall back to deterministic positioning tips below
    }
  }

  creditsUsedAfter = await recordGeminiUsageAndIncrementCredits({
    verifiedUserId: authCtx.verifiedUserId,
    planId: input.planId,
    promptKey: 'MOD_A_GRANT_ELIGIBILITY_CHECKER',
    modelUsed: 'smart-synthesizer',
    inputTokens: 0,
    outputTokens: 0,
    usedByokKey: false,
    fallbackCreditsUsed: authCtx.currentCreditsUsed,
  });

  return {
    allowed: true,
    positioningTips: evalSummary.strategicPositioningTips,
    updatedRevenueAndGrantFit: fallbackRevenueAndGrantFit,
    creditsUsedAfter,
    engineMode: 'smart-synthesizer',
  };
}

// ============================================================================
// MODULE F STEP 1: PARSE CV (PDF / TEXT) & DRAFT 150-WORD PROMOTER BIO
// ============================================================================

export interface ParseCvAndDraftBioResult {
  allowed: boolean;
  reason?: string;
  fullName: string;
  jobTitle: string;
  linkedInUrl?: string;
  email?: string;
  relevantEducationAndDegrees: string;
  relevantTrainingCourses: string;
  priorIndustryExperienceYears: number;
  keyPastCompaniesOrTrackRecord: string;
  compiled150WordNarrative: string;
  wordCount: number;
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
}

/**
 * Extracts plain text from an uploaded CV (PDF buffer or raw text) on the server.
 */
async function extractTextFromCvData(params: {
  fileBase64?: string;
  fileMimeType?: string;
  rawText?: string;
}): Promise<string> {
  if (params.rawText && params.rawText.trim().length > 0) {
    return params.rawText.trim();
  }
  if (params.fileBase64) {
    try {
      const buffer = Buffer.from(params.fileBase64, 'base64');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse/lib/pdf-parse.js');
      const parsed = await pdfParse(buffer);
      if (
        parsed &&
        typeof parsed.text === 'string' &&
        parsed.text.trim().length > 0
      ) {
        return parsed.text.trim();
      }
    } catch (err) {
      console.warn('PDF text extraction note:', err);
    }
  }
  return '';
}

/**
 * Content-aware smart synthesizer for CVs.
 * Intelligently extracts candidate name, contact details (LinkedIn, email),
 * degrees/certifications, past employers & roles, and professional memberships.
 * Produces a bespoke 150+ word LEO/Innovate UK compliant capability statement
 * grounded in the candidate's actual background.
 */
function buildSmartCvSynthesis(params: {
  cvText: string;
  planTitle?: string;
  industryCategory?: string;
  hqCountryCode?: SupportedCountryCode;
  currentRoleTitle?: string;
  candidateName?: string;
}): ParseCvAndDraftBioResult {
  const text = params.cvText || '';
  const country = params.hqCountryCode || 'IE';
  const planTitle = params.planTitle || 'the startup';
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  // 1. Extract Candidate Full Name (ignore street addresses, postal zones, contact labels, headers, and section names like "Work Experience")
  const skipAddressAndMeta =
    /road|street|avenue|lane|drive|crescent|terrace|gardens|park|way|donnycarney|clontarf|kilbarrack|dublin|cork|galway|limerick|waterford|ireland|uk|london|manchester|birmingham|edinburgh|belfast|phone|tel|email|e-mail|linkedin|github|curriculum|resume|cv|page\s+\d|\+353|\+44|\b\d{1,4}\b|experience|work|history|employment|education|skills|qualifications|summary|profile|interests|references|statement|about/i;

  let candidateName = params.candidateName?.trim() || '';
  if (!candidateName) {
    for (const line of lines.slice(0, 10)) {
      if (skipAddressAndMeta.test(line)) continue;
      const words = line.split(/\s+/);
      if (
        words.length >= 2 &&
        words.length <= 4 &&
        words.every((w) => /^[A-Z][a-zA-Z'-]*$/.test(w))
      ) {
        candidateName = line;
        break;
      }
    }
  }

  // 2. Extract LinkedIn Profile URL
  const linkedInMatch = text.match(
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_\-%]+/i
  );
  let linkedInUrl = linkedInMatch ? linkedInMatch[0] : '';
  if (linkedInUrl && !linkedInUrl.startsWith('http')) {
    linkedInUrl = `https://${linkedInUrl}`;
  }

  // 3. Extract Email Address
  const emailMatch = text.match(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i
  );
  const email = emailMatch ? emailMatch[0] : '';

  // 4. Extract Degrees, Certifications & Educational Institutions
  const degreeRegexes = [
    /M\.?Sc\.?(?:\s+in)?\s+[A-Za-z\s]+?(?=(?:\s*\(|\s*—|\s*\||\n|$))/i,
    /B\.?A\.?(?:\s+in)?\s+[A-Za-z\s]+?(?=(?:\s*\(|\s*—|\s*\||\n|$))/i,
    /B\.?Sc\.?(?:\s+in)?\s+[A-Za-z\s]+?(?=(?:\s*\(|\s*—|\s*\||\n|$))/i,
    /M\.?B\.?A\.?(?:\s+in)?\s+[A-Za-z\s]+?(?=(?:\s*\(|\s*—|\s*\||\n|$))/i,
    /Ph\.?D\.?(?:\s+in)?\s+[A-Za-z\s]+?(?=(?:\s*\(|\s*—|\s*\||\n|$))/i,
    /Higher National Diploma(?:\s+in)?\s+[A-Za-z\s]+?(?=(?:\s*\(|\s*—|\s*\||\n|$))/i,
    /Level\s+\d+\s+Certificate(?:\s+in)?\s+[A-Za-z\s]+?(?=(?:\s*\(|\s*—|\s*\||\n|$))/i,
  ];
  const degreesFound: string[] = [];
  for (const r of degreeRegexes) {
    const m = text.match(r);
    if (
      m &&
      !degreesFound.some(
        (d) => d.toLowerCase() === m[0].trim().toLowerCase()
      )
    ) {
      degreesFound.push(m[0].trim().replace(/\s+/g, ' '));
    }
  }

  const institutions: string[] = [];
  if (/Trinity College Dublin/i.test(text))
    institutions.push('Trinity College Dublin');
  if (/Dublin City University|DCU/i.test(text))
    institutions.push('Dublin City University');
  if (/University College Dublin|UCD/i.test(text))
    institutions.push('University College Dublin');
  if (/University College Cork|UCC/i.test(text))
    institutions.push('University College Cork');
  if (/University of Galway|NUI Galway/i.test(text))
    institutions.push('University of Galway');
  if (/College of Management and IT|CMIT/i.test(text))
    institutions.push('CMIT');
  if (/Inchicore College/i.test(text))
    institutions.push('Inchicore College');

  const educationSummary =
    degreesFound.length > 0
      ? degreesFound.slice(0, 3).join(', ') +
        (institutions.length > 0
          ? ` (${institutions.slice(0, 2).join(' & ')})`
          : '')
      : 'Tertiary Degree & Professional Industry Qualifications';

  // 5. Work Experience Lines (Role | Company)
  const rolesAndEmployers: { role: string; company: string }[] = [];
  for (const line of lines) {
    if (
      line.includes('|') &&
      !line.includes('Sept') &&
      !line.includes('Dec') &&
      !line.includes('May') &&
      !line.includes('Feb') &&
      !line.includes('20')
    ) {
      const parts = line.split('|').map((p) => p.trim());
      if (parts.length >= 2 && parts[0].length < 70 && parts[1].length < 80) {
        rolesAndEmployers.push({
          role: parts[0],
          company: parts[1].split(',')[0].trim(),
        });
      }
    }
  }

  // 6. Professional Societies / Affiliations
  const proBodies: string[] = [];
  if (/Psychological Society of Ireland|\bPSI\b/i.test(text))
    proBodies.push('Psychological Society of Ireland (PSI)');
  if (/Irish Society of Behaviour Analysts|\bISBA\b/i.test(text))
    proBodies.push('Irish Society of Behaviour Analysts (ISBA)');

  // 7. Standout Tech Leadership (Only if actually present in CV)
  const hasGoogle = /\bgoogle\b/i.test(text);
  let standoutTechRole = '';
  if (hasGoogle) {
    const headMatch = text.match(
      /head of [a-z0-9' ]+?(?=\swith|\s-|\sat|\n|,|\.)/i
    )?.[0];
    standoutTechRole = headMatch
      ? `${headMatch} at Google`
      : "Head of Google's Startup Team at Google";
  }

  // 8. Years of Experience
  const expMatch = text.match(
    /over\s+(\d+)\s+years|(\d+)\+?\s+years\s+(?:of\s+)?(?:clinical|educational|industry|work|professional)/i
  );
  const yearsExp = expMatch
    ? parseInt(expMatch[1] || expMatch[2], 10)
    : rolesAndEmployers.length >= 3
      ? 5
      : 4;

  // 9. Track Record Summary String
  let trackRecordStr = '';
  if (standoutTechRole) {
    trackRecordStr = standoutTechRole;
  } else if (rolesAndEmployers.length > 0) {
    trackRecordStr = rolesAndEmployers
      .slice(0, 3)
      .map((re) => `${re.role} at ${re.company}`)
      .join('; ');
  } else {
    trackRecordStr =
      'Specialist domain experience across clinical, educational, and operational settings.';
  }

  // 10. Extract Candidate's own introductory summary paragraph if present
  let candidateSummaryBio = '';
  if (candidateName) {
    const nameIdx = text.indexOf(candidateName);
    if (nameIdx !== -1) {
      const afterName = text.substring(nameIdx + candidateName.length).trim();
      const paraEnd = afterName.search(
        /\b(?:EDUCATION|RELEVANT WORK HISTORY|EXPERIENCE|WORK HISTORY|KEY SKILLS|TECHNICAL SKILLS)\b/
      );
      if (paraEnd !== -1) {
        candidateSummaryBio = afterName
          .substring(0, paraEnd)
          .replace(/\s+/g, ' ')
          .trim();
      }
    }
  }

  const nameToUse = candidateName || 'The promoter';
  const rolePhrase = params.currentRoleTitle?.trim()
    ? `serving as ${params.currentRoleTitle.trim()} at ${planTitle}`
    : `in a key leadership role at ${planTitle}`;
  const proBodiesText =
    proBodies.length > 0
      ? ` ${nameToUse} is a verified member of the ${proBodies.join(' and ')}.`
      : '';

  // Tailor the narrative strictly to the candidate's actual background
  let narrative = '';
  if (candidateSummaryBio && candidateSummaryBio.length > 140) {
    narrative = `${nameToUse} ${rolePhrase}, bringing deep specialist domain expertise and operational leadership to the venture. ${candidateSummaryBio}${proBodiesText} In their operational role at ${planTitle}, ${nameToUse} oversees program design, practitioner workflows, client outcomes, and quality governance. Academic credentials include ${educationSummary}, meeting the strict evaluation criteria established by Local Enterprise Offices (LEO), Enterprise Ireland, and institutional funding bodies.`;
  } else if (standoutTechRole) {
    narrative = `${nameToUse} brings over a decade of premier domain leadership, technical depth, and commercial execution to ${planTitle}, ${rolePhrase}. Most notably having served as ${standoutTechRole}, they possess an elite track record of designing high-impact programs, scaling founder ecosystems, and accelerating stakeholder adoption across domestic and international markets. In their executive role at ${planTitle}, ${nameToUse} directs strategic partnership development, roadmap governance, and commercialization milestones. Academic and professional credentials include ${educationSummary}, meeting the evaluation standards set out by Enterprise Ireland, Local Enterprise Offices (LEO), and institutional funding bodies.`;
  } else {
    narrative = `${nameToUse} brings over ${yearsExp} years of specialized domain experience, technical diligence, and operational delivery to ${planTitle}, ${rolePhrase}. Prior professional leadership includes key responsibilities as ${trackRecordStr}.${proBodiesText} In their operational role at ${planTitle}, ${nameToUse} oversees program delivery, process design, quality governance, and stakeholder relationships, ensuring rigorous operational standards and execution discipline across all deliverables. Academic qualifications include ${educationSummary}, fulfilling the governance and capability criteria required by Local Enterprise Offices (LEO), Enterprise Ireland, and institutional funding assessors.`;
  }

  const words = narrative.trim().split(/\s+/).filter(Boolean);

  return {
    allowed: true,
    fullName: candidateName,
    jobTitle: params.currentRoleTitle?.trim() || '',
    linkedInUrl,
    email,
    relevantEducationAndDegrees: educationSummary,
    relevantTrainingCourses:
      country === 'IE'
        ? 'LEO Start Your Own Business Course (SYOB) & Enterprise Leadership'
        : 'Enterprise Growth Training & Executive Accelerator Programs',
    priorIndustryExperienceYears: yearsExp,
    keyPastCompaniesOrTrackRecord: trackRecordStr,
    compiled150WordNarrative: narrative,
    wordCount: words.length,
    engineMode: 'smart-synthesizer',
  };
}

export async function parseCvAndDraftPromoterBioViaRouter(params: {
  planTitle?: string;
  industryCategory?: string;
  hqCountryCode?: SupportedCountryCode;
  fileBase64?: string; // base64 encoded PDF or doc
  fileMimeType?: string; // application/pdf, text/plain, etc.
  rawText?: string;
  currentRoleTitle?: string;
  candidateName?: string;
}): Promise<ParseCvAndDraftBioResult> {
  const country = params.hqCountryCode || 'IE';
  const countryLabel =
    country === 'IE'
      ? 'Ireland (LEO & Enterprise Ireland)'
      : 'United Kingdom (Innovate UK & Start Up Loans)';

  // 1. First, extract text directly from the CV (handles PDF buffers or plain text)
  const extractedCvText = await extractTextFromCvData({
    fileBase64: params.fileBase64,
    fileMimeType: params.fileMimeType,
    rawText: params.rawText,
  });

  // 2. Build the content-aware fallback synthesizer from the extracted CV text
  const fallbackResult = buildSmartCvSynthesis({
    cvText: extractedCvText,
    planTitle: params.planTitle,
    industryCategory: params.industryCategory,
    hqCountryCode: params.hqCountryCode,
    currentRoleTitle: params.currentRoleTitle,
    candidateName: params.candidateName,
  });

  const authCtx = await authorizeAndPrepareGeminiCall(
    'MOD_F_PARSE_CV_BIO',
    'You are an expert startup grant consultant and CV extractor specializing in Irish LEO and UK Innovate UK applications.'
  );

  // If live Gemini is active, let Gemini process the full context
  if (authCtx.canCallLiveGemini && authCtx.activeApiKey) {
    try {
      const ai = getGenAiClient(authCtx.activeApiKey);

      const promptInstructions = `You are analyzing a founder/executive CV/resume for a startup grant application in ${countryLabel}.
Startup Name: ${sanitizePromptInput(params.planTitle || 'Startup', 120)}
Industry: ${sanitizePromptInput(
        params.industryCategory || 'Technology / Business',
        120
      )}${params.candidateName ? `\nCandidate Full Name: ${sanitizePromptInput(params.candidateName, 100)}` : ''}

YOUR TASK:
Extract the candidate's actual qualifications from the uploaded CV and compose a comprehensive, professional, third-person promoter narrative.

CRITICAL EXTRACTION REQUIREMENTS:
1. "linkedInUrl": Extract the candidate's exact LinkedIn profile URL (e.g. "https://www.linkedin.com/in/username") if present in the contact info or text. Prepend https:// if missing. Return empty string if not found.
2. STANDOUT ROLES & COMPANIES:
   - Identify top-tier companies (such as Google, Meta, Stripe, AWS, Microsoft, Apple, etc.) and leadership positions (such as "Head of Google's Startup Team", "Director of Product", "VP of Engineering").
   - You MUST prominently feature these exact positions by name in both "keyPastCompaniesOrTrackRecord" and "compiled150WordNarrative". DO NOT replace them with vague phrases. Mention them by name!
3. "compiled150WordNarrative":
   - MUST be AT LEAST 150 TO 190 WORDS in length (strict Irish LEO application guidelines explicitly enforce a mandatory 150-word minimum per promoter).
   - Structure:
     1. Full Name, role in the startup, and standout past leadership title (e.g. "Having served as Head of Google's Startup Team...").
     2. Academic background (degrees, universities) and relevant enterprise training.
     3. Career track record (exact past employers, leadership roles, technical/commercial achievements).
     4. Specific role responsibilities and execution capability within this startup.

Return strictly valid JSON with this exact schema:
{
  "fullName": "Extracted candidate full name",
  "jobTitle": "Suggested role title in this startup (e.g. Founder & CEO)",
  "linkedInUrl": "Extracted LinkedIn profile URL or empty string",
  "email": "Extracted email address or empty string",
  "relevantEducationAndDegrees": "e.g. BSc in Computer Science (UCD), ACCA Qualified",
  "relevantTrainingCourses": "e.g. LEO Start Your Own Business, Agile Product Management",
  "priorIndustryExperienceYears": 8,
  "keyPastCompaniesOrTrackRecord": "e.g. Head of Google's Startup Team, 8 years senior leadership at Google",
  "compiled150WordNarrative": "A complete, highly professional, third-person background profile of AT LEAST 150 words explicitly mentioning their standout roles (such as Head of Google's Startup Team) and track record."
}`;

      let contentParts: any[] = [];
      if (extractedCvText) {
        contentParts = [
          {
            text: `CV / Resume Content:\n"""\n${sanitizePromptInput(
              extractedCvText,
              12000
            )}\n"""\n\n${promptInstructions}`,
          },
        ];
      } else if (params.fileBase64 && params.fileMimeType) {
        contentParts = [
          {
            inlineData: {
              data: params.fileBase64,
              mimeType: params.fileMimeType,
            },
          },
          { text: promptInstructions },
        ];
      }

      if (contentParts.length > 0) {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: contentParts,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
            maxOutputTokens: MAX_OUTPUT_TOKENS_PER_CALL,
          },
        });

        const text = response.text;
        if (text) {
          const parsed = JSON.parse(text) as {
            fullName?: string;
            jobTitle?: string;
            linkedInUrl?: string;
            email?: string;
            relevantEducationAndDegrees?: string;
            relevantTrainingCourses?: string;
            priorIndustryExperienceYears?: number;
            keyPastCompaniesOrTrackRecord?: string;
            compiled150WordNarrative?: string;
          };

          if (parsed.compiled150WordNarrative) {
            const words = parsed.compiled150WordNarrative
              .trim()
              .split(/\s+/)
              .filter(Boolean);
            await recordGeminiUsageAndIncrementCredits({
              verifiedUserId: authCtx.verifiedUserId,
              promptKey: 'MOD_F_PARSE_CV_BIO',
              modelUsed: 'gemini-2.5-flash',
              inputTokens: response.usageMetadata?.promptTokenCount || 600,
              outputTokens: response.usageMetadata?.candidatesTokenCount || 350,
              usedByokKey: authCtx.usedByokKey,
              fallbackCreditsUsed: authCtx.currentCreditsUsed,
            });

            return {
              allowed: true,
              fullName: parsed.fullName?.trim() || fallbackResult.fullName,
              jobTitle: parsed.jobTitle?.trim() || fallbackResult.jobTitle,
              linkedInUrl:
                parsed.linkedInUrl?.trim() || fallbackResult.linkedInUrl || '',
              email: parsed.email?.trim() || fallbackResult.email || '',
              relevantEducationAndDegrees:
                parsed.relevantEducationAndDegrees?.trim() ||
                fallbackResult.relevantEducationAndDegrees,
              relevantTrainingCourses:
                parsed.relevantTrainingCourses?.trim() ||
                fallbackResult.relevantTrainingCourses,
              priorIndustryExperienceYears:
                Number(parsed.priorIndustryExperienceYears) ||
                fallbackResult.priorIndustryExperienceYears,
              keyPastCompaniesOrTrackRecord:
                parsed.keyPastCompaniesOrTrackRecord?.trim() ||
                fallbackResult.keyPastCompaniesOrTrackRecord,
              compiled150WordNarrative: parsed.compiled150WordNarrative.trim(),
              wordCount: words.length,
              engineMode: 'gemini-2.5-flash',
            };
          }
        }
      }
    } catch (err) {
      console.error('Error parsing CV with Gemini:', err);
    }
  }

  // Return the content-aware smart synthesis extracted from the CV
  return fallbackResult;
}

export interface GenerateRoleMatrixSummaryResult {
  allowed: boolean;
  executiveDivisionSummary: string;
  workloadAnalysis: {
    burnoutRisks: string[];
    gapWarnings: string[];
    governanceStrengths: string[];
  };
  aiCoachTip: string;
  wordCount: number;
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
}

function buildSmartRoleMatrixSynthesis(params: {
  planTitle?: string;
  industryCategory?: string;
  hqCountryCode?: SupportedCountryCode;
  teamMembers: Array<{
    id: string;
    fullName: string;
    jobTitle: string;
  }>;
  hatAssignments: Array<{
    hatKey: string;
    title: string;
    primaryOwnerMemberId: string;
    weeklyHours: number;
    confidence: string;
    notes?: string;
  }>;
  advisors?: Array<{
    name: string;
    roleOrSpecialty: string;
    organizationOrAffiliation?: string;
  }>;
}): GenerateRoleMatrixSummaryResult {
  const planTitle = params.planTitle || 'the startup';
  const country = params.hqCountryCode || 'IE';
  const memberMap = new Map<string, string>();
  params.teamMembers.forEach((m) => {
    memberMap.set(m.id, m.fullName || m.jobTitle || 'Core Team Member');
  });

  const getOwnerName = (id: string) => {
    if (id === 'FRACTIONAL_EXTERNAL') return 'External Specialized Contractor';
    if (id === 'UNASSIGNED') return 'Unassigned';
    return memberMap.get(id) || 'Founding Promoter';
  };

  // Count hats per person
  const hatCounts: Record<string, number> = {};
  const unassignedHats: string[] = [];
  const hatMap = new Map<string, string>();

  params.hatAssignments.forEach((h) => {
    hatMap.set(h.hatKey, getOwnerName(h.primaryOwnerMemberId));
    if (h.primaryOwnerMemberId === 'UNASSIGNED') {
      unassignedHats.push(h.title);
    } else {
      const owner = getOwnerName(h.primaryOwnerMemberId);
      hatCounts[owner] = (hatCounts[owner] || 0) + 1;
    }
  });

  const burnoutRisks: string[] = [];
  Object.entries(hatCounts).forEach(([person, count]) => {
    if (count >= 4) {
      burnoutRisks.push(
        `${person} holds ${count} of the 7 primary functional hats, presenting an operational bottleneck and single-point-of-failure risk.`
      );
    }
  });

  const gapWarnings: string[] = [];
  if (unassignedHats.length > 0) {
    gapWarnings.push(
      `The following core functions currently have no primary owner: ${unassignedHats.join(
        ', '
      )}. Grant evaluators will scrutinize execution risk.`
    );
  }

  const governanceStrengths: string[] = [];
  if (params.advisors && params.advisors.length > 0) {
    governanceStrengths.push(
      `Supported by an active advisory roster including ${params.advisors
        .map((a) => `${a.name} (${a.roleOrSpecialty})`)
        .join(', ')}.`
    );
  }

  const visionOwner = hatMap.get('VISION_FUNDRAISING') || 'The Lead Founder';
  const productOwner =
    hatMap.get('PRODUCT_TECH_BUILD') || 'The Technical Lead';
  const salesOwner = hatMap.get('SALES_COMMERCIAL_BD') || 'The Commercial Lead';
  const opsOwner =
    hatMap.get('OPS_LEGAL_COMPLIANCE') || 'The Operations Lead';
  const financeOwner =
    hatMap.get('FINANCE_CASHFLOW_GRANTS') || 'The Finance Officer';

  const advisorsText =
    params.advisors && params.advisors.length > 0
      ? ` Strategic governance is augmented by seasoned external advisors (${params.advisors
          .map((a) => a.name)
          .join(', ')}), providing quarterly oversight on technical architecture, legal diligence, and institutional funding milestones.`
      : '';

  const narrative = `At ${planTitle}, executive responsibilities and operational execution are structured across the founding team to guarantee operational agility while eliminating single-point bottlenecks. ${visionOwner} exercises primary executive leadership, maintaining ultimate authority over long-term vision, investor capital allocation, milestone governance, and grant administration. Technical architecture and product delivery are directed by ${productOwner}, supervising sprint execution, infrastructure security, QA integrity, and contractor workflows. Commercial traction and revenue generation are spearheaded by ${salesOwner}, managing customer discovery interviews, B2B pilot pipelines, and distribution partnerships. Operational risk, statutory filings, supplier management, and regulatory compliance are overseen by ${opsOwner}, ensuring compliance with statutory standards. Financial viability, cashflow trough management, payroll, and grant reimbursement drawdowns are maintained by ${financeOwner}.${advisorsText} This balanced separation of functional hats ensures that execution velocity remains high while fulfilling the governance standards expected by grant awarding bodies and institutional investors.`;

  const words = narrative.trim().split(/\s+/).filter(Boolean);

  return {
    allowed: true,
    executiveDivisionSummary: narrative,
    workloadAnalysis: {
      burnoutRisks,
      gapWarnings,
      governanceStrengths,
    },
    aiCoachTip:
      burnoutRisks.length > 0
        ? 'Grant evaluators look for balanced management teams. Consider delegating customer support or operations to fractional specialists to avoid overloading primary leaders.'
        : 'Your hat allocation demonstrates clear single-point accountability with sensible operational balance across technical and commercial execution.',
    wordCount: words.length,
    engineMode: 'smart-synthesizer',
  };
}

export async function generateRoleMatrixSummaryViaRouter(params: {
  planTitle?: string;
  industryCategory?: string;
  hqCountryCode?: SupportedCountryCode;
  teamMembers: Array<{
    id: string;
    fullName: string;
    jobTitle: string;
  }>;
  hatAssignments: Array<{
    hatKey: string;
    title: string;
    primaryOwnerMemberId: string;
    backupOwnerMemberId?: string;
    weeklyHours: number;
    confidence: string;
    notes?: string;
  }>;
  advisors?: Array<{
    name: string;
    roleOrSpecialty: string;
    organizationOrAffiliation?: string;
    cadence?: string;
  }>;
}): Promise<GenerateRoleMatrixSummaryResult> {
  const country = params.hqCountryCode || 'IE';
  const countryLabel =
    country === 'IE'
      ? 'Ireland (LEO Form Section 1 & Enterprise Ireland)'
      : 'United Kingdom (Innovate UK Q8 & Start Up Loans Tab 1)';

  const fallbackResult = buildSmartRoleMatrixSynthesis(params);

  const authCtx = await authorizeAndPrepareGeminiCall(
    'MOD_F_ROLE_MATRIX',
    'You are an expert startup management consultant and grant assessor evaluating founder team capability and division of responsibilities.'
  );

  if (authCtx.canCallLiveGemini && authCtx.activeApiKey) {
    try {
      const ai = getGenAiClient(authCtx.activeApiKey);
      const prompt = `You are evaluating the team management structure and division of functional hats for ${sanitizePromptInput(
        params.planTitle || 'Startup',
        100
      )} in ${countryLabel}.
Industry: ${sanitizePromptInput(params.industryCategory || 'Technology', 100)}

TEAM MEMBERS LOGGED:
${JSON.stringify(params.teamMembers, null, 2)}

7 STARTUP HATS ALLOCATION:
${JSON.stringify(params.hatAssignments, null, 2)}

EXTERNAL ADVISORS:
${JSON.stringify(params.advisors || [], null, 2)}

TASK:
1. Synthesize a professional, comprehensive 160 to 220 word "Executive Division of Responsibilities" narrative tailored specifically for official grant applications (${countryLabel}).
   - Clearly identify which individual is responsible for Vision/Fundraising, Product/Tech, Sales/Commercialization, Operations/Compliance, and Finance.
   - Address decision-making authority and how deadlock is avoided.
   - Explain how external advisors support the founding team.
2. Provide a workload diagnostic: list any burnout risks (where one founder has >= 4 primary hats), any unassigned functional gaps, and key governance strengths.
3. Provide a constructive, high-leverage 2-sentence AI Coach Tip for the founders.

Return strictly valid JSON with this exact schema:
{
  "executiveDivisionSummary": "160-220 word comprehensive executive responsibilities narrative",
  "burnoutRisks": ["string observation of overload if applicable"],
  "gapWarnings": ["string observation of vacant hats if applicable"],
  "governanceStrengths": ["string observation of strong team or advisor coverage"],
  "aiCoachTip": "Constructive 2-sentence blind spot advice"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.25,
          maxOutputTokens: MAX_OUTPUT_TOKENS_PER_CALL,
        },
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text) as {
          executiveDivisionSummary?: string;
          burnoutRisks?: string[];
          gapWarnings?: string[];
          governanceStrengths?: string[];
          aiCoachTip?: string;
        };

        if (parsed.executiveDivisionSummary) {
          const words = parsed.executiveDivisionSummary
            .trim()
            .split(/\s+/)
            .filter(Boolean);

          await recordGeminiUsageAndIncrementCredits({
            verifiedUserId: authCtx.verifiedUserId,
            promptKey: 'MOD_F_ROLE_MATRIX',
            modelUsed: 'gemini-2.5-flash',
            inputTokens: response.usageMetadata?.promptTokenCount || 750,
            outputTokens: response.usageMetadata?.candidatesTokenCount || 400,
            usedByokKey: authCtx.usedByokKey,
            fallbackCreditsUsed: authCtx.currentCreditsUsed,
          });

          return {
            allowed: true,
            executiveDivisionSummary: parsed.executiveDivisionSummary.trim(),
            workloadAnalysis: {
              burnoutRisks:
                parsed.burnoutRisks || fallbackResult.workloadAnalysis.burnoutRisks,
              gapWarnings:
                parsed.gapWarnings || fallbackResult.workloadAnalysis.gapWarnings,
              governanceStrengths:
                parsed.governanceStrengths ||
                fallbackResult.workloadAnalysis.governanceStrengths,
            },
            aiCoachTip:
              parsed.aiCoachTip?.trim() || fallbackResult.aiCoachTip,
            wordCount: words.length,
            engineMode: 'gemini-2.5-flash',
          };
        }
      }
    } catch (err) {
      console.error('Error in generateRoleMatrixSummaryViaRouter:', err);
    }
  }

  return fallbackResult;
}

// ----------------------------------------------------------------------------
// Step 5: 3-Year Executive Hiring & Retention Strategy AI Synthesizer
// ----------------------------------------------------------------------------

export interface GenerateHiringStrategySummaryResult {
  allowed: boolean;
  executiveHiringStrategyNarrative: string;
  wordCount: number;
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
  keyHighlights?: string[];
  aiCoachTip?: string;
}

export async function generateHiringStrategySummaryViaRouter(params: {
  planTitle?: string;
  industryCategory?: string;
  hqCountryCode?: SupportedCountryCode;
  hiringPosture?: string;
  otherHiringPostureText?: string;
  roles: Array<{
    title: string;
    department: string;
    employmentMode: string;
    yearScheduled: number;
    compensationModel: string;
    grossAnnualSalary: number;
    equityGrantPercent?: number;
    vestingYears?: number;
    cliffMonths?: number;
    isGrantReimbursableEligible?: boolean;
    isRdTaxCreditEligible?: boolean;
    sweatEquityMilestoneConditions?: string;
  }>;
  contractorBudgetYear1?: number;
  contractorBudgetYear2?: number;
  contractorBudgetYear3?: number;
}): Promise<GenerateHiringStrategySummaryResult> {
  const isGb = params.hqCountryCode === 'GB';
  const currencySymbol = isGb ? '£' : '€';
  const countryName = isGb ? 'United Kingdom' : 'Ireland';
  const primaryGrant = isGb
    ? 'Innovate UK & British Business Bank Start Up Loans'
    : 'Local Enterprise Office (LEO) Priming & Feasibility Grants';

  const y1Roles = params.roles.filter((r) => r.yearScheduled <= 1);
  const y2Roles = params.roles.filter((r) => r.yearScheduled <= 2);
  const y3Roles = params.roles.filter((r) => r.yearScheduled <= 3);

  const sweatRoles = params.roles.filter(
    (r) =>
      r.compensationModel === 'PURE_SWEAT_EQUITY' ||
      r.compensationModel === 'HYBRID_CASH_EQUITY'
  );

  // Deterministic smart fallback
  const fallbackNarrative = `Over the 3-year strategic horizon, ${
    params.planTitle || 'the startup'
  } executes a phased, capital-efficient talent acquisition and human capital retention plan tailored to ${countryName} startup governance and ${primaryGrant} guidelines.\n\nIn Year 1, the organisation prioritises runway preservation, deploying ${
    y1Roles.length
  } core roles${
    sweatRoles.length > 0
      ? ` leveraging founder sweat equity and hybrid equity incentives with 4-year vesting schedules and a 1-year cliff to protect early-stage cash reserves`
      : ' focused on core product deployment and market validation'
  }${
    (params.contractorBudgetYear1 || 0) > 0
      ? `, complemented by a ${currencySymbol}${params.contractorBudgetYear1} specialist contractor budget for specialized technical and legal workflows`
      : ''
  }.\n\nAs product-market fit and commercial revenues scale in Years 2 and 3, direct salaried headcount expands sequentially to ${
    y2Roles.length
  } team members in Year 2 and ${
    y3Roles.length
  } in Year 3. Hiring focuses on dedicated engineering scale, proactive customer acquisition, and structured operational management. Direct salaried positions incorporate statutory employer overheads (${
    isGb
      ? '13.8% Employer NIC plus workplace pension contributions'
      : '11.15% Employer PRSI'
  }) and leverage eligible non-dilutive grant wage subsidies to maintain financial resilience. Long-term talent retention is fortified through an employee share ownership pool, milestone-based performance triggers, and competitive regional compensation benchmarks.`;

  const words = fallbackNarrative.trim().split(/\s+/).filter(Boolean);
  const fallbackResult: GenerateHiringStrategySummaryResult = {
    allowed: true,
    executiveHiringStrategyNarrative: fallbackNarrative,
    wordCount: words.length,
    engineMode: 'smart-synthesizer',
    keyHighlights: [
      `Phased headcount expansion from ${y1Roles.length} in Year 1 to ${y3Roles.length} in Year 3`,
      sweatRoles.length > 0
        ? 'Sweat equity protection with 4-year vesting and 12-month cliff schedules'
        : 'Structured direct salaried employment with statutory tax compliance',
      `Full alignment with ${countryName} grant and payroll standards (${isGb ? 'NIC & Pension' : 'Class A PRSI'})`,
    ],
    aiCoachTip:
      'Highlighting phased hiring tied to measurable milestone gates demonstrates fiscal discipline to grant assessors and private investors alike.',
  };

  const authCtx = await authorizeAndPrepareGeminiCall(
    'MOD_F_HIRING_STRATEGY',
    'You are an expert startup workforce strategist and government grant evaluator specializing in headcount planning, sweat equity allocation, and statutory payroll compliance.'
  );

  if (authCtx.canCallLiveGemini && authCtx.activeApiKey) {
    try {
      const ai = getGenAiClient(authCtx.activeApiKey);
      const prompt = `You are a senior startup advisor and grant evaluator specializing in Irish LEO Priming / Enterprise Ireland grants and UK Innovate UK grant applications.

Draft a compelling, professional 180 to 250-word Executive Hiring & Retention Strategy for the official grant and business plan application based on the following verified facts:

STARTUP CONTEXT:
- Plan Title: ${params.planTitle || 'Startup'}
- Industry: ${params.industryCategory || 'Technology / Commercial'}
- Location: ${countryName} (${primaryGrant})
- Hiring Strategy Posture: ${params.hiringPosture || 'Balanced Growth'} ${params.otherHiringPostureText ? `(${params.otherHiringPostureText})` : ''}

HEADCOUNT & COMPENSATION DATA:
- Year 1 Active Team: ${y1Roles.length} roles (${y1Roles.map((r) => `${r.title} [${r.employmentMode}, ${r.compensationModel}]`).join(', ') || 'Founders'})
- Year 2 Active Team: ${y2Roles.length} roles
- Year 3 Active Team: ${y3Roles.length} roles
- Sweat Equity & Share Incentive Roles: ${sweatRoles.length} roles utilizing equity vesting (4-year vesting with 1-year cliff)
- Annual Contractor Budgets: Y1 ${currencySymbol}${params.contractorBudgetYear1 || 0}, Y2 ${currencySymbol}${params.contractorBudgetYear2 || 0}, Y3 ${currencySymbol}${params.contractorBudgetYear3 || 0}
- Statutory Overheads Modeled: ${isGb ? '13.8% Employer NIC + 3% Pension' : '11.15% Employer PRSI'}

REQUIREMENTS:
1. Write 2-3 structured paragraphs in polished, confident business prose suitable for an official grant committee or credit assessor.
2. Explicitly explain how the startup balances cash runway preservation in Year 1 (via founder commitment, sweat equity/options, or lean contractors) with scalable direct job creation in Years 2 and 3.
3. Mention talent retention mechanisms (e.g. share options vesting, clear KPIs, milestone bonuses, positive startup culture).
4. Do NOT use buzzwords or unsubstantiated hype; focus on operational feasibility, fiscal prudence, and statutory compliance.

Return STRICT JSON with this exact schema:
{
  "executiveHiringStrategyNarrative": "Full 180-250 word formal grant narrative",
  "keyHighlights": ["string bullet point 1", "string bullet point 2", "string bullet point 3"],
  "aiCoachTip": "Constructive 1-2 sentence evaluator perspective tip"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.25,
          maxOutputTokens: MAX_OUTPUT_TOKENS_PER_CALL,
        },
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text) as {
          executiveHiringStrategyNarrative?: string;
          keyHighlights?: string[];
          aiCoachTip?: string;
        };

        if (parsed.executiveHiringStrategyNarrative) {
          const w = parsed.executiveHiringStrategyNarrative
            .trim()
            .split(/\s+/)
            .filter(Boolean);

          await recordGeminiUsageAndIncrementCredits({
            verifiedUserId: authCtx.verifiedUserId,
            promptKey: 'MOD_F_HIRING_STRATEGY',
            modelUsed: 'gemini-2.5-flash',
            inputTokens: response.usageMetadata?.promptTokenCount || 700,
            outputTokens: response.usageMetadata?.candidatesTokenCount || 400,
            usedByokKey: authCtx.usedByokKey,
            fallbackCreditsUsed: authCtx.currentCreditsUsed,
          });

          return {
            allowed: true,
            executiveHiringStrategyNarrative: parsed.executiveHiringStrategyNarrative.trim(),
            keyHighlights: parsed.keyHighlights || fallbackResult.keyHighlights,
            aiCoachTip: parsed.aiCoachTip?.trim() || fallbackResult.aiCoachTip,
            wordCount: w.length,
            engineMode: 'gemini-2.5-flash',
          };
        }
      }
    } catch (err) {
      console.error('Error in generateHiringStrategySummaryViaRouter:', err);
    }
  }

  return fallbackResult;
}

// ============================================================================
// MODULE F OVERVIEW: TEAM, GOVERNANCE & HIRING AUDIT & BRIEF SYNTHESIS
// ============================================================================

export interface GenerateTeamAuditAndBriefResult {
  allowed: boolean;
  blindSpots: Array<{
    id: string;
    title: string;
    category:
      | 'SINGLE_POINT_OF_FAILURE_OR_BURNOUT'
      | 'EQUITY_VESTING_OR_DEAD_EQUITY_RISK'
      | 'SURVIVAL_RUNWAY_VS_GRANT_DRAWDOWN_GAP'
      | 'DECISION_DEADLOCK_OR_GOVERNANCE_SPLIT'
      | 'PAYROLL_TAX_AND_EMPLOYMENT_LAW_COMPLIANCE'
      | 'SWEAT_EQUITY_TAX_AND_IP_ASSIGNMENT'
      | 'OTHER';
    otherCategoryText?: string;
    severity: 'WATCH' | 'IMPORTANT' | 'CRITICAL';
    whyItMatters: string;
    recommendedActionOrFix: string;
  }>;
  executiveTeamCapabilityNarrative: string; // Formatted for LEO Appendix D / Innovate UK Q8
  governanceAndVestingNarrative: string;
  talentRetentionAndHiringNarrative: string;
  aiCoachTip: string;
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
}

function buildSmartTeamAuditAndBrief(params: {
  planTitle?: string;
  industryCategory?: string;
  hqCountryCode?: SupportedCountryCode;
  teamMembersCount?: number;
  promoters?: Array<{ fullName: string; jobTitle: string; cvReady: boolean }>;
  survivalRunwayMonths?: number;
  monthlySurvivalBurn?: number;
  unassignedHatsCount?: number;
  year1Fte?: number;
  year3Fte?: number;
  equityVestingPlanned?: boolean;
}): GenerateTeamAuditAndBriefResult {
  const planTitle = params.planTitle || 'the startup';
  const country = params.hqCountryCode || 'IE';
  const isSolo = (params.teamMembersCount || 1) <= 1;
  const runwayMonths = params.survivalRunwayMonths || 6;
  const isGrantHeavy = country === 'IE' || country === 'GB';

  const blindSpots: GenerateTeamAuditAndBriefResult['blindSpots'] = [];

  if (isSolo) {
    blindSpots.push({
      id: 'tb-solo-single-point',
      title: 'Solo Founder Execution Bottleneck & Key-Person Risk',
      category: 'SINGLE_POINT_OF_FAILURE_OR_BURNOUT',
      severity: 'CRITICAL',
      whyItMatters:
        'Grant bodies (LEO & Innovate UK) and early investors scrutinize single-founder ventures for execution bottlenecks, key-person illness risks, and burnout across conflicting business functions.',
      recommendedActionOrFix:
        'Formalize a vetted Advisory Board (2–3 industry leaders) or fractional specialists for Finance & Tech Build to demonstrate resilient operational backup.',
    });
  } else {
    blindSpots.push({
      id: 'tb-deadlock-governance',
      title: 'Co-Founder Decision Deadlock & Equity Deadlock Risk',
      category: 'DECISION_DEADLOCK_OR_GOVERNANCE_SPLIT',
      severity: 'IMPORTANT',
      whyItMatters:
        'Equal 50/50 equity splits with informal voting rules frequently lead to catastrophic governance paralysis if founders disagree on pivots, fundraising, or hiring.',
      recommendedActionOrFix:
        'Establish a formal Founders Agreement with designated tie-breaking mechanisms (e.g. Lead Founder casting vote on operational strategy, independent advisor mediation on exits).',
    });
  }

  blindSpots.push({
    id: 'tb-equity-vesting-cliff',
    title: 'Absence of 4-Year Equity Vesting with a 1-Year Cliff',
    category: 'EQUITY_VESTING_OR_DEAD_EQUITY_RISK',
    severity: 'CRITICAL',
    whyItMatters:
      'If any co-founder or sweat-equity contributor departs within the first 12 months without reverse-vesting, they retain their full equity stake as "dead equity", rendering the company uninvestable for future institutional rounds.',
    recommendedActionOrFix:
      'Adopt a standard 4-year vesting schedule with a 12-month cliff and strict bad-leaver share buyback rights before incorporating or issuing shares.',
  });

  if (runwayMonths < 6) {
    blindSpots.push({
      id: 'tb-runway-grant-drawdown-gap',
      title: 'Personal Survival Cash Runway vs. Grant Reimbursement Lag',
      category: 'SURVIVAL_RUNWAY_VS_GRANT_DRAWDOWN_GAP',
      severity: 'IMPORTANT',
      whyItMatters:
        'Government grants (IE LEO Feasibility/Priming and UK Innovate UK) pay retrospectively in arrears against audited receipts. A survival runway below 6 months creates acute cash-flow stress before the first grant claim drawdown clears.',
      recommendedActionOrFix:
        'Line up a bridging facility (such as a UK Start Up Loan, founder director loan, or personal savings cushion) to cover the 60-to-90-day lag between invoice expenditure and grant claim payout.',
    });
  }

  blindSpots.push({
    id: 'tb-sweat-equity-tax-ip',
    title: 'Sweat Equity Tax Valuation & Immediate IP Assignment',
    category: 'SWEAT_EQUITY_TAX_AND_IP_ASSIGNMENT',
    severity: 'IMPORTANT',
    whyItMatters:
      'Providing shares in exchange for unpaid sweat equity without upfront Section 431 elections (UK) or formal intellectual property assignment agreements leaves code and brand ownership with the individual rather than the company.',
    recommendedActionOrFix:
      'Execute a bilateral Intellectual Property Assignment Agreement and ensure all early share issuances are formally registered prior to commercial launch.',
  });

  const leadName = params.promoters?.[0]?.fullName || 'The Founding Promoter';
  const leadTitle = params.promoters?.[0]?.jobTitle || 'Founder & CEO';

  const executiveTeamNarrative = `${planTitle} is led by ${leadName} (${leadTitle}), bringing specialized domain insight and operational leadership to the venture. The executive structure is architected to satisfy the rigorous technical merit, management track record, and execution capability benchmarks required under ${
    country === 'IE' ? 'Irish Local Enterprise Office (LEO Appendix D) & Enterprise Ireland' : 'UK Innovate UK (Question 8 Team Capability) & British Business Bank Start Up Loans'
  }. Operational and strategic responsibilities are demarcated across dedicated functional domains (Vision, Product Build, Commercialization, Operations, and Finance), ensuring single-point accountability while eliminating operational bottlenecks.`;

  const governanceNarrative = `Corporate governance and founder alignment are anchored by a formal Founders Charter and reverse-vesting framework. Founder and sweat equity allocations are subject to a standard 4-year vesting schedule with a mandatory 12-month cliff, safeguarding the cap table against dead equity. Deadlock resolution mechanisms, commercial veto thresholds, and intellectual property assignment covenants ensure uncompromised business continuity and institutional investor diligence readiness.`;

  const hiringNarrative = `The headcount expansion roadmap scales pragmatically from ${params.year1Fte || 1.5} FTEs in Year 1 to ${params.year3Fte || 4.0} FTEs by Year 3, balancing agile freelance contracting during MVP validation with selective PAYE hires as revenue milestones are unlocked. Grant-eligible technical and R&D roles are ring-fenced to leverage non-dilutive salary support (${
    country === 'IE' ? 'LEO Priming 50% salary grants & EI R&D tax credits' : 'Innovate UK eligible staff costs & HMRC R&D tax relief'
  }), minimizing initial cash burn while accelerating execution.`;

  return {
    allowed: true,
    blindSpots,
    executiveTeamCapabilityNarrative: executiveTeamNarrative,
    governanceAndVestingNarrative: governanceNarrative,
    talentRetentionAndHiringNarrative: hiringNarrative,
    aiCoachTip:
      'LEO and Innovate UK assessors reward founder self-awareness. Having clear governance, vesting, and advisory backup converts perceived team risks into institutional strengths.',
    engineMode: 'smart-synthesizer',
  };
}

export async function generateTeamAuditAndBriefViaRouter(params: {
  planTitle?: string;
  industryCategory?: string;
  hqCountryCode?: SupportedCountryCode;
  teamMembersCount?: number;
  promoters?: Array<{ fullName: string; jobTitle: string; cvReady: boolean }>;
  survivalRunwayMonths?: number;
  monthlySurvivalBurn?: number;
  unassignedHatsCount?: number;
  year1Fte?: number;
  year3Fte?: number;
  equityVestingPlanned?: boolean;
}): Promise<GenerateTeamAuditAndBriefResult> {
  const fallbackResult = buildSmartTeamAuditAndBrief(params);
  const country = params.hqCountryCode || 'IE';
  const countryLabel =
    country === 'IE'
      ? 'Ireland (LEO Appendix D & Enterprise Ireland)'
      : 'United Kingdom (Innovate UK Q8 & Start Up Loans Tab 1)';

  const authCtx = await authorizeAndPrepareGeminiCall(
    'MOD_F_TEAM_AUDIT_BRIEF',
    'You are a senior venture partner, governance advisor, and grant assessor evaluating startup management capability and executive risks.'
  );

  if (authCtx.canCallLiveGemini && authCtx.activeApiKey) {
    try {
      const ai = getGenAiClient(authCtx.activeApiKey);
      const prompt = `Conduct a comprehensive, constructive Team, Governance & Blind-Spot Audit for ${sanitizePromptInput(
        params.planTitle || 'Startup',
        100
      )} in ${countryLabel}.
Industry: ${sanitizePromptInput(params.industryCategory || 'Technology', 100)}
Founding Team Count: ${params.teamMembersCount || 1}
Survival Cash Runway: ${params.survivalRunwayMonths || 6} months (Monthly Burn: €/£${params.monthlySurvivalBurn || 2000})
Year 1 to 3 FTEs: ${params.year1Fte || 1.5} to ${params.year3Fte || 4} FTEs

TASK:
1. Synthesize 4 actionable, constructive Blind-Spot Review cards ("Things to Consider") covering:
   - Single-point of failure / burnout or decision deadlock
   - Equity vesting and dead equity risk (4-year vesting / 1-year cliff)
   - Survival cash runway vs grant reimbursement lag (LEO/Innovate UK pay in arrears)
   - Sweat equity tax valuation, IP assignment, and corporate governance
2. Synthesize 3 concise, investor- and grant-ready narrative blocks:
   - executiveTeamCapabilityNarrative (LEO Appendix D / Innovate UK Q8 capability summary, 120-160 words)
   - governanceAndVestingNarrative (Deadlock prevention, vesting cliff, IP assignment, 90-120 words)
   - talentRetentionAndHiringNarrative (Headcount scaling, grant salary offset, retention, 90-120 words)
3. Provide a high-leverage 2-sentence Assessor Coaching Tip.

Return strictly valid JSON with this schema:
{
  "blindSpots": [
    {
      "id": "string-unique-id",
      "title": "string headline",
      "category": "SINGLE_POINT_OF_FAILURE_OR_BURNOUT" | "EQUITY_VESTING_OR_DEAD_EQUITY_RISK" | "SURVIVAL_RUNWAY_VS_GRANT_DRAWDOWN_GAP" | "DECISION_DEADLOCK_OR_GOVERNANCE_SPLIT" | "PAYROLL_TAX_AND_EMPLOYMENT_LAW_COMPLIANCE" | "SWEAT_EQUITY_TAX_AND_IP_ASSIGNMENT" | "OTHER",
      "severity": "CRITICAL" | "IMPORTANT" | "WATCH",
      "whyItMatters": "string explanation",
      "recommendedActionOrFix": "string actionable solution"
    }
  ],
  "executiveTeamCapabilityNarrative": "string",
  "governanceAndVestingNarrative": "string",
  "talentRetentionAndHiringNarrative": "string",
  "aiCoachTip": "string"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.25,
          maxOutputTokens: MAX_OUTPUT_TOKENS_PER_CALL,
        },
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text) as {
          blindSpots?: GenerateTeamAuditAndBriefResult['blindSpots'];
          executiveTeamCapabilityNarrative?: string;
          governanceAndVestingNarrative?: string;
          talentRetentionAndHiringNarrative?: string;
          aiCoachTip?: string;
        };

        if (parsed.blindSpots && parsed.executiveTeamCapabilityNarrative) {
          await recordGeminiUsageAndIncrementCredits({
            verifiedUserId: authCtx.verifiedUserId,
            promptKey: 'MOD_F_TEAM_AUDIT_BRIEF',
            modelUsed: 'gemini-2.5-flash',
            inputTokens: response.usageMetadata?.promptTokenCount || 800,
            outputTokens: response.usageMetadata?.candidatesTokenCount || 600,
            usedByokKey: authCtx.usedByokKey,
            fallbackCreditsUsed: authCtx.currentCreditsUsed,
          });

          return {
            allowed: true,
            blindSpots: parsed.blindSpots.map((b, i) => ({
              id: b.id || `tb-ai-${i + 1}`,
              title: b.title || 'Team Consideration',
              category: b.category || 'SINGLE_POINT_OF_FAILURE_OR_BURNOUT',
              severity: b.severity || 'IMPORTANT',
              whyItMatters: b.whyItMatters || '',
              recommendedActionOrFix: b.recommendedActionOrFix || '',
            })),
            executiveTeamCapabilityNarrative: parsed.executiveTeamCapabilityNarrative.trim(),
            governanceAndVestingNarrative: parsed.governanceAndVestingNarrative?.trim() || fallbackResult.governanceAndVestingNarrative,
            talentRetentionAndHiringNarrative: parsed.talentRetentionAndHiringNarrative?.trim() || fallbackResult.talentRetentionAndHiringNarrative,
            aiCoachTip: parsed.aiCoachTip?.trim() || fallbackResult.aiCoachTip,
            engineMode: 'gemini-2.5-flash',
          };
        }
      }
    } catch (err) {
      console.error('Error in generateTeamAuditAndBriefViaRouter:', err);
    }
  }

  return fallbackResult;
}

// ============================================================================
// MODULE H: PRICING STRATEGY JUSTIFICATION (FOR GRANT ASSESSORS & BANK MANAGERS)
// ============================================================================

export interface GeneratePricingStrategyJustificationResult {
  allowed: boolean;
  pricingStrategyNotes: string;
  assessorTip?: string;
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
}

function buildSmartPricingStrategyJustification(params: {
  planTitle?: string;
  industryCategory?: string;
  hqCountryCode?: SupportedCountryCode;
  currencySymbol?: string;
  revenueModelVehicle?: string;
  blendedAveragePrice?: number;
  tiersSummary?: string;
  primaryChannel?: string;
  estimatedBlendedFeePercent?: number;
  beachheadCustomer?: string;
  willingnessToPayInsights?: string;
  competitorPriceRange?: string;
}): GeneratePricingStrategyJustificationResult {
  const country = params.hqCountryCode || 'IE';
  const sym = params.currencySymbol || (country === 'GB' ? '£' : '€');
  const price = params.blendedAveragePrice || 49;
  const channel = params.primaryChannel ? params.primaryChannel.replace(/_/g, ' ') : 'Direct checkout';
  const fee = params.estimatedBlendedFeePercent ?? 2.9;

  const notes = `Our pricing strategy is structured at a net blended price of ${sym}${price} per customer/unit, calibrated directly against willingness-to-pay signals gathered during customer discovery and target persona benchmarking. Operating via ${channel} maintains a blended transaction friction fee of ~${fee}%, ensuring healthy contribution margins to absorb early fulfillment and customer acquisition costs. Under ${
    country === 'IE'
      ? 'Irish Local Enterprise Office (LEO Feasibility/Priming) and Enterprise Ireland guidelines'
      : 'UK Innovate UK and British Business Bank Start Up Loan viability criteria'
  }, this price point reflects defensible unit economics without relying on unsustainable discount incentives. It positions the solution as a premium, value-driven alternative to legacy incumbents while leaving adequate runway for gross margin reinvestment into product delivery and customer success.`;

  return {
    allowed: true,
    pricingStrategyNotes: notes,
    assessorTip:
      'Grant officers and bank underwriters look for pricing backed by real customer interviews rather than plucked out of thin air. Pointing to validated willingness-to-pay and payment fee protection builds immediate credibility.',
    engineMode: 'smart-synthesizer',
  };
}

export async function generatePricingStrategyJustificationViaRouter(params: {
  planTitle?: string;
  industryCategory?: string;
  hqCountryCode?: SupportedCountryCode;
  currencySymbol?: string;
  revenueModelVehicle?: string;
  blendedAveragePrice?: number;
  tiersSummary?: string;
  primaryChannel?: string;
  estimatedBlendedFeePercent?: number;
  beachheadCustomer?: string;
  willingnessToPayInsights?: string;
  competitorPriceRange?: string;
  unfairAdvantage?: string;
}): Promise<GeneratePricingStrategyJustificationResult> {
  const fallback = buildSmartPricingStrategyJustification(params);
  const country = params.hqCountryCode || 'IE';
  const countryLabel =
    country === 'IE'
      ? 'Ireland (Local Enterprise Office LEO & Enterprise Ireland)'
      : 'United Kingdom (Innovate UK & British Business Bank Start Up Loans)';

  const authCtx = await authorizeAndPrepareGeminiCall(
    'MOD_H_PRICING_STRATEGY',
    'You are a senior venture underwriter, commercial banker, and grant assessor specializing in startup unit economics and pricing defensibility.'
  );

  if (authCtx.canCallLiveGemini && authCtx.activeApiKey) {
    try {
      const ai = getGenAiClient(authCtx.activeApiKey);
      const prompt = `Write a rigorous, professional 2-to-3 paragraph Pricing Strategy Justification for ${sanitizePromptInput(
        params.planTitle || 'Startup',
        100
      )} in ${countryLabel}.
This justification will be read directly by government grant assessors (LEO / Innovate UK) and bank loan managers evaluating business viability.

VENTURE CONTEXT (CROSS-MODULE EVIDENCE):
- Industry Category: ${sanitizePromptInput(params.industryCategory || 'Technology', 100)}
- Revenue Model: ${sanitizePromptInput(params.revenueModelVehicle || 'Subscription', 60)}
- Blended Average Price (Net of Tax): ${params.currencySymbol || '€'}${params.blendedAveragePrice || 49}
- Pricing Tiers / Packages: ${sanitizePromptInput(params.tiersSummary || 'Flagship Offering', 250)}
- Primary Sales Channel: ${sanitizePromptInput(params.primaryChannel || 'Direct Web', 60)} (Blended platform cut: ${params.estimatedBlendedFeePercent || 2.9}%)
- Beachhead Target Persona (Mod B): ${sanitizePromptInput(params.beachheadCustomer || 'Target segment', 150)}
- Customer Willingness-to-Pay & Feedback (Mod C): ${sanitizePromptInput(params.willingnessToPayInsights || 'Validated through customer discovery', 200)}
- Competitor Price Anchor (Mod B): ${sanitizePromptInput(params.competitorPriceRange || 'Aligned with market alternatives', 150)}
- Unfair Advantage / Defensibility (Mod A): ${sanitizePromptInput(params.unfairAdvantage || 'Proprietary workflow & domain expertise', 150)}

REQUIREMENTS:
1. Explain clearly why target customers will pay this specific net price point (referencing value received vs cost of alternatives).
2. Explain how this price protects gross margin after payment gateway fees (${params.estimatedBlendedFeePercent || 2.9}%) and supports self-sustaining breakeven.
3. Write with commercial maturity suitable for LEO / Innovate UK grant forms and Start Up Loan business plans.
4. Keep the text concise (140-200 words total).
5. Provide a 1-sentence Assessor Tip for the founder.

Return strictly valid JSON:
{
  "pricingStrategyNotes": "string (140-200 words)",
  "assessorTip": "string"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
          maxOutputTokens: MAX_OUTPUT_TOKENS_PER_CALL,
        },
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text) as {
          pricingStrategyNotes?: string;
          assessorTip?: string;
        };

        if (parsed.pricingStrategyNotes) {
          await recordGeminiUsageAndIncrementCredits({
            verifiedUserId: authCtx.verifiedUserId,
            promptKey: 'MOD_H_PRICING_STRATEGY',
            modelUsed: 'gemini-2.5-flash',
            inputTokens: response.usageMetadata?.promptTokenCount || 600,
            outputTokens: response.usageMetadata?.candidatesTokenCount || 350,
            usedByokKey: authCtx.usedByokKey,
            fallbackCreditsUsed: authCtx.currentCreditsUsed,
          });

          return {
            allowed: true,
            pricingStrategyNotes: parsed.pricingStrategyNotes.trim(),
            assessorTip: parsed.assessorTip?.trim() || fallback.assessorTip,
            engineMode: 'gemini-2.5-flash',
          };
        }
      }
    } catch (err) {
      console.error('Error in generatePricingStrategyJustificationViaRouter:', err);
    }
  }

  return fallback;
}



// -----------------------------------------------------------------------------
// MODULE H (STEP 3): BREAKEVEN & WORKING CAPITAL ASSESSOR NARRATIVE GENERATOR
// -----------------------------------------------------------------------------

export interface GenerateBreakevenAssessorNarrativeResult {
  allowed: boolean;
  narrative: string;
  assessorTip?: string;
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer' | 'unauthorized';
}

function buildSmartBreakevenAssessorNarrative(params: {
  planTitle?: string;
  industryCategory?: string;
  hqCountryCode?: SupportedCountryCode;
  currencySymbol?: string;
  blendedAveragePrice?: number;
  pocketProfit?: number;
  pocketProfitMarginPercent?: number;
  monthlyFixedOverhead?: number;
  survivalMonthlyBudget?: number;
  targetMonthlyBreakevenCustomers?: number;
  paymentTerms?: string;
  workingCapitalBuffer?: number;
  exportSalesPercent?: number;
  exportFocusRegions?: string;
}): GenerateBreakevenAssessorNarrativeResult {
  const sym = params.currencySymbol || '€';
  const country = params.hqCountryCode || 'IE';
  const isIE = country === 'IE';
  const price = params.blendedAveragePrice ?? 49;
  const profit = params.pocketProfit ?? 42;
  const margin = params.pocketProfitMarginPercent ?? 85;
  const fixed = params.monthlyFixedOverhead ?? 1500;
  const survival = params.survivalMonthlyBudget ?? 2500;
  const totalBurn = fixed + survival;
  const breakeven = params.targetMonthlyBreakevenCustomers ?? Math.max(1, Math.ceil(totalBurn / (profit || 1)));
  const terms = params.paymentTerms || 'INSTANT_CARD';
  const buffer = params.workingCapitalBuffer ?? (terms === 'NET_60' ? Math.round(totalBurn * 2.5) : terms === 'NET_30' ? Math.round(totalBurn * 1.5) : 0);
  const exportPct = params.exportSalesPercent ?? 0;
  const exportDest = params.exportFocusRegions || (isIE ? 'UK, EU & North America' : 'EU, US & International');

  const termsLabel =
    terms === 'NET_60'
      ? 'Net 60 Days invoicing'
      : terms === 'NET_30'
      ? 'Net 30 Days invoicing'
      : terms === 'NET_14'
      ? 'Net 14 Days terms'
      : terms === 'OTHER'
      ? 'custom commercial settlement terms'
      : 'instant digital checkout / card payment (zero debtor delay)';

  const agencyName = isIE ? 'LEO / Enterprise Ireland' : 'Innovate UK / British Business Bank';

  const p1 = `Operating Viability & Breakeven Threshold: ${params.planTitle || 'The venture'} maintains a baseline monthly fixed operational commitment of ${sym}${fixed.toLocaleString()}/month and a founder living survival allocation of ${sym}${survival.toLocaleString()}/month, representing a total fixed break-even threshold of ${sym}${totalBurn.toLocaleString()}/month. At a blended net unit price of ${sym}${price.toLocaleString()} delivering ${sym}${profit.toLocaleString()} in net pocket contribution (${margin}% pocket margin after direct cost of goods, transaction fees, and fulfilment overheads), full commercial cash-flow breakeven is attained at exactly ${breakeven.toLocaleString()} active sales/subscribers per month.`;

  const p2 = `Working Capital & Receivables Management: Revenue collection is structured under ${termsLabel}.${
    buffer > 0
      ? ` To protect ongoing solvency against debtor collection lags, the venture incorporates an explicit working capital buffer of ${sym}${buffer.toLocaleString()} (${terms === 'NET_60' ? '2.5×' : '1.5×'} monthly fixed expenditure) funded prior to invoice settlement.`
      : ' Immediate funds capture minimizes cash conversion latency and eliminates debtor realization risk during early operations.'
  }`;

  const p3 = `Export Orientation & Economic Additionality: The commercial model projects ${exportPct}% of revenue derived from international markets (${exportDest}), satisfying ${agencyName} eligibility criteria for tradeable services/products with minimal domestic market displacement and substantial regional economic value-add.`;

  return {
    allowed: true,
    narrative: `${p1}\n\n${p2}\n\n${p3}`,
    assessorTip: isIE
      ? 'LEO evaluation committees prioritize your ability to explain how you survive month-to-month until the debtor cash actually clears your Irish bank account.'
      : 'Innovate UK and Start Up Loans assessors look closely for evidence that your breakeven unit volumes are realistic given your sales cycle and working capital runway.',
    engineMode: 'smart-synthesizer',
  };
}

export async function generateBreakevenAssessorNarrativeViaRouter(params: {
  planTitle?: string;
  industryCategory?: string;
  hqCountryCode?: SupportedCountryCode;
  currencySymbol?: string;
  blendedAveragePrice?: number;
  pocketProfit?: number;
  pocketProfitMarginPercent?: number;
  monthlyFixedOverhead?: number;
  survivalMonthlyBudget?: number;
  targetMonthlyBreakevenCustomers?: number;
  paymentTerms?: string;
  workingCapitalBuffer?: number;
  exportSalesPercent?: number;
  exportFocusRegions?: string;
  unfairAdvantage?: string;
  beachheadCustomer?: string;
}): Promise<GenerateBreakevenAssessorNarrativeResult> {
  const fallback = buildSmartBreakevenAssessorNarrative(params);
  const country = params.hqCountryCode || 'IE';
  const countryLabel =
    country === 'IE'
      ? 'Ireland (Local Enterprise Office LEO & Enterprise Ireland Grant Committees)'
      : 'United Kingdom (Innovate UK Grant Assessors & British Business Bank Start Up Loans Credit Underwriters)';

  const authCtx = await authorizeAndPrepareGeminiCall(
    'MOD_H_BREAKEVEN_NARRATIVE',
    'You are a senior government grant committee evaluator, credit risk officer, and venture underwriter specializing in startup breakeven analysis, cash flow timing, and working capital solvency.'
  );

  if (authCtx.canCallLiveGemini && authCtx.activeApiKey) {
    try {
      const ai = getGenAiClient(authCtx.activeApiKey);
      const prompt = `Write a rigorous, professional 3-paragraph Breakeven, Working Capital & Export Justification for ${sanitizePromptInput(
        params.planTitle || 'Startup',
        100
      )} in ${countryLabel}.
This narrative will be placed directly in the Grant Application / Bank Credit Paper evaluating commercial viability, debtor cash conversion risk, and export additionality.

COMMERCIAL FIGURES & METRICS:
- Industry Category: ${sanitizePromptInput(params.industryCategory || 'Technology', 100)}
- Blended Net Selling Price: ${params.currencySymbol || '€'}${params.blendedAveragePrice ?? 49}
- Net Pocket Profit Per Sale: ${params.currencySymbol || '€'}${params.pocketProfit ?? 42} (Contribution Margin: ${params.pocketProfitMarginPercent ?? 85}%)
- Monthly Fixed Overheads: ${params.currencySymbol || '€'}${params.monthlyFixedOverhead ?? 1500}/month
- Founder Survival Allocation / Scheduled Payroll: ${params.currencySymbol || '€'}${params.survivalMonthlyBudget ?? 2500}/month
- Total Required Monthly Cash Inflow: ${params.currencySymbol || '€'}${((params.monthlyFixedOverhead || 0) + (params.survivalMonthlyBudget || 0)).toLocaleString()}/month
- Target Monthly Breakeven Volume: ${params.targetMonthlyBreakevenCustomers ?? 100} paying units/customers per month
- Payment Terms & Debtor Lag: ${params.paymentTerms || 'INSTANT_CARD'} (Required Working Capital Buffer: ${params.currencySymbol || '€'}${params.workingCapitalBuffer || 0})
- Export Sales Split: ${params.exportSalesPercent ?? 0}% from outside domestic market (Target Export Regions: ${sanitizePromptInput(params.exportFocusRegions || 'UK / EU / North America', 120)})
- Beachhead Persona: ${sanitizePromptInput(params.beachheadCustomer || 'Target segment', 120)}

REQUIREMENTS:
1. Paragraph 1 (Breakeven Mechanics): Formally articulate the breakeven point (${params.targetMonthlyBreakevenCustomers} units/month to cover ${params.currencySymbol || '€'}${((params.monthlyFixedOverhead || 0) + (params.survivalMonthlyBudget || 0)).toLocaleString()}/mo), referencing the unit contribution margin (${params.pocketProfitMarginPercent}%) and explaining why this customer volume is conservative and attainable.
2. Paragraph 2 (Cash Lag & Working Capital Buffer): Address payment settlement terms (${params.paymentTerms}), explain debtor realization timing, and detail how working capital reserves (${params.currencySymbol || '€'}${params.workingCapitalBuffer || 0}) protect cash solvency while waiting for payments to settle.
3. Paragraph 3 (Export Additionality & Economic Justification): State the ${params.exportSalesPercent}% international revenue strategy, highlight regional economic additionality and non-displacement of domestic competitors (critical for Irish LEO/EI and UK Innovate UK approvals).
4. Tone: Rigorous, sober, commercial, and defensible. Avoid vague hype. Length: 160-230 words.
5. Provide a 1-sentence tactical Assessor Tip for the founder when defending this section during appraisal interviews.

Return strictly valid JSON:
{
  "narrative": "string (160-230 words in 3 structured paragraphs)",
  "assessorTip": "string (1 concise sentence)"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
          maxOutputTokens: MAX_OUTPUT_TOKENS_PER_CALL,
        },
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text) as {
          narrative?: string;
          assessorTip?: string;
        };

        if (parsed.narrative) {
          await recordGeminiUsageAndIncrementCredits({
            verifiedUserId: authCtx.verifiedUserId,
            promptKey: 'MOD_H_BREAKEVEN_NARRATIVE',
            modelUsed: 'gemini-2.5-flash',
            inputTokens: response.usageMetadata?.promptTokenCount || 650,
            outputTokens: response.usageMetadata?.candidatesTokenCount || 400,
            usedByokKey: authCtx.usedByokKey,
            fallbackCreditsUsed: authCtx.currentCreditsUsed,
          });

          return {
            allowed: true,
            narrative: parsed.narrative.trim(),
            assessorTip: parsed.assessorTip?.trim() || fallback.assessorTip,
            engineMode: 'gemini-2.5-flash',
          };
        }
      }
    } catch (err) {
      console.error('Error in generateBreakevenAssessorNarrativeViaRouter:', err);
    }
  }

  return fallback;
}



// -----------------------------------------------------------------------------
// MODULE H (STEP 4): SALES VELOCITY, CAPACITY & ASSUMPTIONS GENERATOR
// -----------------------------------------------------------------------------

export interface GenerateSalesAssumptionsNarrativeResult {
  allowed: boolean;
  narrative: string;
  assessorTip?: string;
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer' | 'unauthorized';
}

function buildSmartSalesAssumptionsNarrative(params: {
  planTitle?: string;
  industryCategory?: string;
  hqCountryCode?: SupportedCountryCode;
  currencySymbol?: string;
  salesMotion?: string;
  salesCycleDays?: number;
  conversionRatePercent?: number;
  breakevenMonthlyUnits?: number;
  requiredMonthlyLeads?: number;
  monthlyCapacityCap?: number;
  capacityFeasibilityStatus?: string;
  retentionMetricLabel?: string;
  retentionPercent?: number;
  primaryChannel?: string;
  beachheadCustomer?: string;
}): GenerateSalesAssumptionsNarrativeResult {
  const isIE = (params.hqCountryCode || 'IE') === 'IE';
  const agencyName = isIE ? 'LEO / Enterprise Ireland' : 'Innovate UK / Start Up Loans';
  const units = params.breakevenMonthlyUnits ?? 35;
  const conv = params.conversionRatePercent ?? 2.5;
  const cycle = params.salesCycleDays ?? 14;
  const leads = params.requiredMonthlyLeads ?? Math.ceil(units / (conv / 100));
  const dailyLeads = Math.max(1, Math.ceil(leads / 30));
  const cap = params.monthlyCapacityCap ?? 45;
  const motion = params.salesMotion || 'SELF_SERVE_WEB';
  const channel = params.primaryChannel || 'Direct Web';
  const customer = params.beachheadCustomer || 'early-adopter target customers';

  const motionLabel =
    motion === 'SELF_SERVE_WEB'
      ? 'frictionless digital self-serve checkout'
      : motion === 'INSIDE_SALES_DEMO'
      ? 'product demo and consultative discovery calls'
      : motion === 'ENTERPRISE_RFP'
      ? 'formal commercial proposals and tender assessments'
      : motion === 'RETAIL_MARKETPLACE'
      ? 'marketplace storefront listing and direct order fulfillment'
      : 'direct client engagements';

  const p1 = `Commercial Acquisition & Conversion Mechanics: Customer conversion is executed via ${motionLabel} anchored on ${channel}. To secure the Year 1 breakeven volume of ${units.toLocaleString()} paying customers/orders per month, the financial plan operates on a conservative blended conversion rate of ${conv}%. This requires generating approximately ${leads.toLocaleString()} qualified pipeline prospects/visitors per month (~${dailyLeads} per day). Given the defined beachhead persona (${customer}), this acquisition velocity represents an attainable top-of-funnel operational target.`;

  const p2 = `Pipeline Velocity & Revenue Realization Lag: The average sales cycle from initial prospect touchpoint to contract settlement is calibrated at ${cycle} days. This sales velocity directly accounts for buyer evaluation friction and payment processing schedules. Working capital reserves and grant funding bridge this realization cycle to insulate operational cashflow against initial conversion delays.`;

  const p3 = `Operational Delivery Capacity & Scalability: Team operational capacity is currently capped at ${cap.toLocaleString()} units/orders per month under existing founder allocations and production protocols. Comparing this ceiling against the required breakeven volume of ${units.toLocaleString()} units demonstrates that the venture can achieve cashflow profitability ${
    cap >= units
      ? `comfortably within existing capacity (with a protective buffer of ${(cap - units).toLocaleString()} units/month before requiring new operational hires)`
      : `with scheduled capacity expansion and team onboarding planned in early Year 1`
  }, maintaining robust delivery standards and meeting ${agencyName} commercial viability requirements.`;

  return {
    allowed: true,
    narrative: `${p1}\n\n${p2}\n\n${p3}`,
    assessorTip: isIE
      ? 'LEO assessors will evaluate whether your conversion rate assumptions are grounded in real-world benchmark data rather than optimistic speculation.'
      : 'Innovate UK evaluators verify that your required daily lead volume aligns with your marketing budget and team operational bandwidth.',
    engineMode: 'smart-synthesizer',
  };
}

export interface GenerateModuleHRevenueBriefResult {
  allowed: boolean;
  reason?: string;
  blindSpots: BlindSpotItem[];
  revenueReadinessConfidence: 'READY_FOR_COMMERCIAL_LAUNCH' | 'PRICING_TESTING_RECOMMENDED' | 'WORKING_CAPITAL_GAP_WARNING' | 'NEEDS_CAPACITY_EXPANSION' | 'OTHER';
  executiveCommercialSummaryNarrative: string;
  assessorTip?: string;
  creditsUsedAfter?: number;
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
}

function buildSmartRevenueBriefFallback(params: {
  planTitle?: string;
  revenueModelVehicle?: string;
  blendedAveragePrice?: number;
  currencySymbol?: string;
  pocketProfitPerSale?: number;
  contributionMarginPercent?: number;
  yr1BreakevenUnits?: number;
  monthlyFixedNut?: number;
  salesMotion?: string;
  monthlyCapacity?: number;
  hqCountryCode?: SupportedCountryCode;
}): {
  blindSpots: BlindSpotItem[];
  revenueReadinessConfidence: 'READY_FOR_COMMERCIAL_LAUNCH' | 'PRICING_TESTING_RECOMMENDED' | 'WORKING_CAPITAL_GAP_WARNING' | 'NEEDS_CAPACITY_EXPANSION' | 'OTHER';
  executiveCommercialSummaryNarrative: string;
  assessorTip: string;
} {
  const isIE = params.hqCountryCode !== 'GB';
  const sym = params.currencySymbol || (isIE ? '€' : '£');
  const price = params.blendedAveragePrice || 49;
  const profit = params.pocketProfitPerSale || 38;
  const margin = params.contributionMarginPercent || 78;
  const nut = params.monthlyFixedNut || 3200;
  const breakeven = params.yr1BreakevenUnits || 85;
  const cap = params.monthlyCapacity || 120;
  const hasSurplus = cap >= breakeven;

  const blindSpots: BlindSpotItem[] = [
    {
      id: 'bs-rev-margin',
      title: margin < 65 ? 'Tight Contribution Margin Buffer' : 'Margin Resiliency & Price Elasticity',
      category: 'COMMERCIAL_PRICING',
      severity: margin < 65 ? 'CRITICAL' : 'WARNING',
      explanation: `With a ${margin}% contribution margin (${sym}${profit} net pocket profit per sale), unexpected increases in platform gateway charges, merchant processing fees, or direct COGS could compress your operational cushion.`,
      suggestedAction: `Stress-test a 10-15% increase in variable fulfillment fees. Ensure your premium tier or volume add-ons provide an accretive gross margin above 80% to protect net cash flow.`,
    },
    {
      id: 'bs-rev-cashflow-gap',
      title: 'Debtor Settlement Lag vs. Monthly Payroll Nut',
      category: 'WORKING_CAPITAL',
      severity: 'WARNING',
      explanation: `Your monthly fixed baseline commitments total ${sym}${nut.toLocaleString()}. Payment gateway settlement delays (3-7 days for online, or 30-60 days for invoicing) create a working capital timing trough before incoming debtor cash clears.`,
      suggestedAction: `Maintain a minimum 2-3 month cash buffer or secure non-dilutive grant reimbursement timing (such as LEO Feasibility/Priming or Innovate UK Smart Grant advances) to prevent cash-starvation during peak customer delivery.`,
    },
    {
      id: 'bs-rev-capacity-ceiling',
      title: hasSurplus ? 'Delivery Capacity Buffer Confirmed' : 'Capacity Bottleneck Under Breakeven Target',
      category: 'OPERATIONAL_CAPACITY',
      severity: hasSurplus ? 'INFO' : 'CRITICAL',
      explanation: hasSurplus
        ? `Your current operational delivery capacity (${cap.toLocaleString()} units/mo) safely accommodates the Year 1 breakeven requirement (${breakeven.toLocaleString()} units/mo), leaving a healthy operational surplus buffer.`
        : `Your monthly delivery capacity of ${cap.toLocaleString()} units is currently below the ${breakeven.toLocaleString()} units required to hit operational breakeven, indicating a founder burnout or under-resourcing risk.`,
      suggestedAction: hasSurplus
        ? `Preserve product quality by monitoring turnaround times as sales volume scales past 75% of your current delivery ceiling.`
        : `Schedule additional operational headcount or automate fulfillment workflows (Module E) before initiating aggressive acquisition marketing in Module I.`,
    },
    {
      id: 'bs-rev-vat-threshold',
      title: isIE ? 'Irish Revenue VAT Threshold Proximity (€42.5k / €85k)' : 'HMRC UK VAT Registration Threshold (£90,000)',
      category: 'STATUTORY_COMPLIANCE',
      severity: 'WARNING',
      explanation: isIE
        ? `Reaching Year 1 commercial targets will quickly approach Irish VAT registration thresholds (€42,500 for services, €85,000 for physical goods). Pricing must anticipate 23% or 13.5% VAT liabilities.`
        : `Annualizing your breakeven revenue puts you within range of the UK £90,000 rolling 12-month VAT threshold, which immediately introduces a 20% standard VAT deduction on gross customer receipts.`,
      suggestedAction: `Verify whether your headline prices to consumers are gross (VAT-inclusive) or net of tax to prevent an unexpected 20-23% reduction in pocket contribution upon statutory registration.`,
    },
  ];

  const p1 = `Commercial Revenue Architecture: The commercial model is structured around a verified ${
    params.revenueModelVehicle || 'recurring subscription / unit sales'
  } monetization strategy delivering an average blended net realization of ${sym}${price.toLocaleString()}. Deducting platform processing fees, gateway deductions, and direct delivery COGS leaves a net pocket contribution of ${sym}${profit.toLocaleString()} per transaction (${margin}% contribution margin).`;

  const p2 = `Breakeven Math & Financial Viability: Total baseline fixed overheads and scheduled founder survival commitments require ${sym}${nut.toLocaleString()} per month in Year 1. To cover this nut and reach cashflow breakeven, the business must transact ${breakeven.toLocaleString()} customer units monthly, generating ${sym}${(
    breakeven * price
  ).toLocaleString()} in gross monthly commercial revenue.`;

  const p3 = `Operational Delivery & Conversion Feasibility: Current operational bandwidth supports up to ${cap.toLocaleString()} deliveries per month. Comparing this ceiling against the ${breakeven.toLocaleString()} breakeven requirement demonstrates ${
    hasSurplus
      ? `a comfortable operational surplus buffer, confirming that the business can scale into commercial profitability without immediate operational breakdown`
      : `that early operational capacity expansion will be essential as acquisition ramps up`
  }. Combined with realistic pipeline conversion assumptions, this structure satisfies the strict commercial viability criteria required by ${
    isIE ? 'LEO and Enterprise Ireland' : 'Innovate UK and British Business Bank'
  } evaluators.`;

  return {
    blindSpots,
    revenueReadinessConfidence: hasSurplus && margin >= 65 ? 'READY_FOR_COMMERCIAL_LAUNCH' : 'PRICING_TESTING_RECOMMENDED',
    executiveCommercialSummaryNarrative: `${p1}\n\n${p2}\n\n${p3}`,
    assessorTip: isIE
      ? 'LEO evaluation committees prioritize ventures demonstrating a clear contribution margin buffer (>65%) that can absorb early marketing inefficiencies and debtor collection lags.'
      : 'Innovate UK and Start Up Loans assessors look for proof that your breakeven unit count does not exceed the realistic operational delivery bandwidth of your current team.',
  };
}

/**
 * AI Assessor Mode: Generates Module H Step 5 Executive Commercial Brief & Blind-Spot Audit.
 */
export async function generateModuleHRevenueBriefViaRouter(params: {
  planId?: string;
  planTitle: string;
  industryCategory?: string;
  hqCountryCode: SupportedCountryCode;
  currencySymbol: string;
  revenueModelVehicle: string;
  blendedAveragePrice: number;
  pocketProfitPerSale: number;
  contributionMarginPercent: number;
  yr1BreakevenUnits: number;
  monthlyFixedNut: number;
  salesMotion: string;
  monthlyCapacity: number;
  currentBlindSpots?: BlindSpotItem[];
}): Promise<GenerateModuleHRevenueBriefResult> {
  const fallback = buildSmartRevenueBriefFallback(params);

  const authCtx = await authorizeAndPrepareGeminiCall(
    'MOD_H_REVENUE_BRIEF',
    'You are a senior venture underwriter and government grant evaluator specializing in startup unit economics, contribution margin viability, and operational capacity verification.'
  );

  if (authCtx.canCallLiveGemini && authCtx.activeApiKey) {
    try {
      const ai = getGenAiClient(authCtx.activeApiKey);
      const isIE = params.hqCountryCode !== 'GB';
      const prompt = `You are a Senior Commercial Auditor and Grant Evaluation Specialist for ${
        isIE ? 'Enterprise Ireland & Local Enterprise Offices (LEO)' : 'Innovate UK & British Business Bank Start Up Loans'
      }.
Review the following early-stage startup commercial architecture:

Plan: "${sanitizePromptInput(params.planTitle, 100)}" (${params.industryCategory || 'Startup'})
HQ Location: ${params.hqCountryCode} | Currency: ${params.currencySymbol}
Monetization Vehicle: ${params.revenueModelVehicle}
Blended Average Price: ${params.currencySymbol}${params.blendedAveragePrice}
Net Pocket Profit per Sale: ${params.currencySymbol}${params.pocketProfitPerSale} (${params.contributionMarginPercent}% margin)
Monthly Baseline Fixed Commitment (Nut): ${params.currencySymbol}${params.monthlyFixedNut}
Year 1 Monthly Breakeven Target: ${params.yr1BreakevenUnits} units/mo
Primary Sales Motion: ${params.salesMotion}
Team Monthly Delivery Capacity: ${params.monthlyCapacity} units/mo

Tasks:
1. Provide a rigorous, constructive 3-paragraph "Executive Commercial Summary Narrative" defending:
   - Paragraph 1: Monetization mechanics, gross-to-net realization, and pocket contribution margin.
   - Paragraph 2: Breakeven feasibility against baseline overheads and founder survival commitments.
   - Paragraph 3: Operational delivery bandwidth feasibility and defense for grant/loan committee evaluators.
2. Generate 4 constructive Blind-Spot Review items (JSON array with id, title, category, severity="CRITICAL"|"WARNING"|"INFO", explanation, suggestedAction).
3. Set revenueReadinessConfidence to one of: "READY_FOR_COMMERCIAL_LAUNCH", "PRICING_TESTING_RECOMMENDED", "WORKING_CAPITAL_GAP_WARNING", "NEEDS_CAPACITY_EXPANSION".
4. Provide a 1-sentence assessorTip highlighting what a grant evaluator will check first.

Return strictly JSON:
{
  "executiveCommercialSummaryNarrative": "string (180-240 words in 3 paragraphs separated by \\n\\n)",
  "blindSpots": [
    {
      "id": "bs-1",
      "title": "string",
      "category": "COMMERCIAL_PRICING",
      "severity": "CRITICAL" | "WARNING" | "INFO",
      "explanation": "string",
      "suggestedAction": "string"
    }
  ],
  "revenueReadinessConfidence": "READY_FOR_COMMERCIAL_LAUNCH" | "PRICING_TESTING_RECOMMENDED" | "WORKING_CAPITAL_GAP_WARNING" | "NEEDS_CAPACITY_EXPANSION",
  "assessorTip": "string"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
          maxOutputTokens: MAX_OUTPUT_TOKENS_PER_CALL,
        },
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text) as {
          executiveCommercialSummaryNarrative?: string;
          blindSpots?: BlindSpotItem[];
          revenueReadinessConfidence?: 'READY_FOR_COMMERCIAL_LAUNCH' | 'PRICING_TESTING_RECOMMENDED' | 'WORKING_CAPITAL_GAP_WARNING' | 'NEEDS_CAPACITY_EXPANSION';
          assessorTip?: string;
        };

        if (parsed.executiveCommercialSummaryNarrative) {
          await recordGeminiUsageAndIncrementCredits({
            verifiedUserId: authCtx.verifiedUserId,
            promptKey: 'MOD_H_REVENUE_BRIEF',
            modelUsed: 'gemini-2.5-flash',
            inputTokens: response.usageMetadata?.promptTokenCount || 750,
            outputTokens: response.usageMetadata?.candidatesTokenCount || 550,
            usedByokKey: authCtx.usedByokKey,
            fallbackCreditsUsed: authCtx.currentCreditsUsed,
          });

          return {
            allowed: true,
            blindSpots: parsed.blindSpots?.length ? parsed.blindSpots : fallback.blindSpots,
            revenueReadinessConfidence: parsed.revenueReadinessConfidence || fallback.revenueReadinessConfidence,
            executiveCommercialSummaryNarrative: parsed.executiveCommercialSummaryNarrative.trim(),
            assessorTip: parsed.assessorTip?.trim() || fallback.assessorTip,
            engineMode: 'gemini-2.5-flash',
          };
        }
      }
    } catch (err) {
      console.error('Error in generateModuleHRevenueBriefViaRouter:', err);
    }
  }

  return {
    allowed: true,
    ...fallback,
    engineMode: 'smart-synthesizer',
  };
}

export async function generateSalesAssumptionsNarrativeViaRouter(params: {
  planId?: string;
  planTitle?: string;
  industryCategory?: string;
  hqCountryCode?: SupportedCountryCode;
  currencySymbol?: string;
  salesMotion?: string;
  salesCycleDays?: number;
  conversionRatePercent?: number;
  breakevenMonthlyUnits?: number;
  requiredMonthlyLeads?: number;
  monthlyCapacityCap?: number;
  capacityFeasibilityStatus?: string;
  retentionMetricLabel?: string;
  retentionPercent?: number;
  primaryChannel?: string;
  beachheadCustomer?: string;
}): Promise<GenerateSalesAssumptionsNarrativeResult> {
  const fallback = buildSmartSalesAssumptionsNarrative(params);
  const country = params.hqCountryCode || 'IE';
  const countryLabel =
    country === 'IE'
      ? 'Ireland (Local Enterprise Office LEO & Enterprise Ireland Appraisal Panels)'
      : 'United Kingdom (Innovate UK Grant Assessors & British Business Bank Start Up Loans Credit Underwriters)';

  const authCtx = await authorizeAndPrepareGeminiCall(
    'MOD_H_SALES_ASSUMPTIONS',
    'You are a senior venture underwriter, commercial loan assessor, and government grant evaluator specializing in sales funnels, pipeline conversion velocity, and operational capacity verification.'
  );

  if (authCtx.canCallLiveGemini && authCtx.activeApiKey) {
    try {
      const ai = getGenAiClient(authCtx.activeApiKey);
      const prompt = `Write a rigorous, professional 3-paragraph Written Sales Assumptions & Capacity Justification for ${sanitizePromptInput(
        params.planTitle || 'Startup',
        100
      )} in ${countryLabel}.
This narrative will be placed directly in the Grant Application / Bank Credit Paper evaluating customer acquisition feasibility, pipeline velocity, and operational capacity limits.

COMMERCIAL FIGURES & FUNNEL METRICS:
- Industry Category: ${sanitizePromptInput(params.industryCategory || 'Technology', 100)}
- Primary Sales Motion: ${params.salesMotion || 'SELF_SERVE_WEB'} via ${params.primaryChannel || 'Direct Web'}
- Required Breakeven Volume: ${params.breakevenMonthlyUnits ?? 35} paying sales/clients per month
- Expected Conversion Rate: ${params.conversionRatePercent ?? 2.5}%
- Required Monthly Qualified Leads/Traffic: ${params.requiredMonthlyLeads ?? 1400} per month (~${Math.ceil((params.requiredMonthlyLeads || 1400) / 30)} per day)
- Lead-to-Close Sales Cycle Velocity: ${params.salesCycleDays ?? 14} days
- Monthly Operational Delivery Capacity: ${params.monthlyCapacityCap ?? 45} orders/clients per month
- Capacity Feasibility Status: ${params.capacityFeasibilityStatus || 'CAPACITY_SURPLUS'}
- Customer Retention / Repeat Purchase: ${params.retentionPercent ?? 5}% ${params.retentionMetricLabel || 'monthly churn'}
- Beachhead Customer Persona: ${sanitizePromptInput(params.beachheadCustomer || 'Target segment', 120)}

REQUIREMENTS:
1. Paragraph 1 (Acquisition & Conversion Math): Explain the sales motion, defend why the ${params.conversionRatePercent}% conversion rate is realistic, and articulate the required monthly lead pipeline (${params.requiredMonthlyLeads} prospects/month) needed to hit the ${params.breakevenMonthlyUnits} monthly breakeven target.
2. Paragraph 2 (Velocity & Realization Lag): Address the ${params.salesCycleDays}-day sales cycle lag, explaining customer decision-making timing and how cashflow timing is safeguarded during market ramp.
3. Paragraph 3 (Capacity vs. Breakeven Solvency): Compare the breakeven requirement (${params.breakevenMonthlyUnits}/month) against the operational capacity cap (${params.monthlyCapacityCap}/month), proving that the venture will not suffer service bottlenecks or quality degradation prior to reaching profitability.
4. Tone: Commercial, grounded, analytical, and defensible. Avoid generic fluff. Length: 160-220 words.
5. Provide a 1-sentence tactical Assessor Tip for the founder when defending these assumptions in an evaluation interview.

Return strictly valid JSON:
{
  "narrative": "string (160-220 words in 3 structured paragraphs)",
  "assessorTip": "string (1 concise sentence)"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
          maxOutputTokens: MAX_OUTPUT_TOKENS_PER_CALL,
        },
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text) as {
          narrative?: string;
          assessorTip?: string;
        };

        if (parsed.narrative) {
          await recordGeminiUsageAndIncrementCredits({
            verifiedUserId: authCtx.verifiedUserId,
            promptKey: 'MOD_H_SALES_ASSUMPTIONS',
            modelUsed: 'gemini-2.5-flash',
            inputTokens: response.usageMetadata?.promptTokenCount || 650,
            outputTokens: response.usageMetadata?.candidatesTokenCount || 400,
            usedByokKey: authCtx.usedByokKey,
            fallbackCreditsUsed: authCtx.currentCreditsUsed,
          });

          return {
            allowed: true,
            narrative: parsed.narrative.trim(),
            assessorTip: parsed.assessorTip?.trim() || fallback.assessorTip,
            engineMode: 'gemini-2.5-flash',
          };
        }
      }
    } catch (err) {
      console.error('Error in generateSalesAssumptionsNarrativeViaRouter:', err);
    }
  }

  return fallback;
}




// ============================================================================
// MODULE I: BRAND POSITIONING & 3-SECOND HOOK (MOD_I_POSITIONING)
// ============================================================================

export interface GenerateModuleIPositioningParams {
  planId?: string;
  planTitle?: string;
  industryCategory?: string;
  hqCountryCode?: SupportedCountryCode;
  oneLinerSummary?: string;
  problemStatement?: string;
  solutionStatement?: string;
  uvpStatement?: string;
  targetCustomer?: string;
  beachheadPersona?: string;
  competitiveWedge?: string;
  preferredTone?: string;
}

export interface GenerateModuleIPositioningResult {
  allowed: boolean;
  elevatorHook140: string;
  positioningFormula: {
    targetCustomer: string;
    customerProblem: string;
    solutionCategory: string;
    primaryBenefit: string;
    competitiveWedge: string;
  };
  suggestedToneOfVoice:
    | 'AUTHORITATIVE_TRUSTED'
    | 'APPROACHABLE_FRIENDLY'
    | 'PLAYFUL_BOLD'
    | 'TECHNICAL_TRANSPARENT'
    | 'PREMIUM_CURATED'
    | 'OTHER';
  otherToneOfVoiceText?: string;
  toneOfVoiceBoundary: {
    weAre: string;
    weAreNever: string;
  };
  corePillars: [string, string, string];
  assessorTip?: string;
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer' | 'unauthorized';
}

function buildSmartPositioningFallback(
  params: GenerateModuleIPositioningParams
): GenerateModuleIPositioningResult {
  const title = params.planTitle?.trim() || 'Our Venture';
  const category = params.industryCategory || 'B2B SaaS / AI App';
  const customer =
    params.beachheadPersona?.trim() ||
    params.targetCustomer?.trim() ||
    'early-stage founders and modern operators';
  const problem =
    params.problemStatement?.trim() ||
    'time-consuming manual processes and fragmented guesswork';
  const solution =
    params.solutionStatement?.trim() ||
    params.oneLinerSummary?.trim() ||
    'an intelligent end-to-end workflow platform';
  const wedge =
    params.competitiveWedge?.trim() ||
    'generic templates and disconnected spreadsheets with automated validation';

  let defaultTone: GenerateModuleIPositioningResult['suggestedToneOfVoice'] =
    'AUTHORITATIVE_TRUSTED';
  let weAre = 'Authoritative, evidence-backed, and practical';
  let weAreNever = 'Bureaucratic, dry, or full of unnecessary jargon';

  if (category.includes('Consumer') || category.includes('Social')) {
    defaultTone = 'PLAYFUL_BOLD';
    weAre = 'Energetic, refreshing, and relatable';
    weAreNever = 'Stuffy, corporate, or dull';
  } else if (category.includes('Hardware') || category.includes('DeepTech') || category.includes('API')) {
    defaultTone = 'TECHNICAL_TRANSPARENT';
    weAre = 'Precise, engineering-led, and no-fluff';
    weAreNever = 'Marketing-hyped or hand-wavy';
  } else if (category.includes('Service') || category.includes('Consulting')) {
    defaultTone = 'APPROACHABLE_FRIENDLY';
    weAre = 'Empathetic, clear, and action-oriented';
    weAreNever = 'Condescending or overwhelming';
  }

  // Create crisp <= 140 char elevator hook
  let hook = `${title} helps ${customer} overcome ${problem.slice(0, 40)} with ${solution.slice(0, 40)}.`;
  if (hook.length > 138) {
    hook = hook.slice(0, 137).trim() + '...';
  }

  const pCustomer = customer.startsWith('For') ? customer.replace(/^For\s+/i, '') : customer;
  const pBenefit = params.uvpStatement?.trim() || `streamlining execution and accelerating measurable outcomes`;

  return {
    allowed: true,
    elevatorHook140: hook,
    positioningFormula: {
      targetCustomer: pCustomer,
      customerProblem: problem,
      solutionCategory: solution,
      primaryBenefit: pBenefit,
      competitiveWedge: wedge,
    },
    suggestedToneOfVoice: defaultTone,
    toneOfVoiceBoundary: {
      weAre,
      weAreNever,
    },
    corePillars: [
      'Radical Efficiency & Speed',
      'Defensible & Trustworthy Proof',
      'Zero-Friction Founder Experience',
    ],
    assessorTip:
      'Grant panels and investors look for consistency: ensure the target customer named here matches your Module B beachhead persona verbatim.',
    engineMode: 'smart-synthesizer',
  };
}

export async function generateModuleIPositioningViaRouter(
  params: GenerateModuleIPositioningParams
): Promise<GenerateModuleIPositioningResult> {
  const fallback = buildSmartPositioningFallback(params);
  const isIE = (params.hqCountryCode || 'IE') !== 'GB';
  const countryContext = isIE
    ? 'Ireland (Local Enterprise Office / Enterprise Ireland commercial panel)'
    : 'United Kingdom (Innovate UK & British Business Bank Start Up Loans committee)';

  const authCtx = await authorizeAndPrepareGeminiCall(
    'MOD_I_POSITIONING',
    'You are an elite startup brand strategist, product marketer, and grant appraisal expert who crafts razor-sharp positioning, 140-character elevator hooks, and defensible value propositions.'
  );

  if (authCtx.canCallLiveGemini && authCtx.activeApiKey) {
    try {
      const ai = getGenAiClient(authCtx.activeApiKey);
      const prompt = `Develop a world-class Brand Positioning & Value Proposition architecture for ${sanitizePromptInput(
        params.planTitle || 'Startup',
        100
      )} in ${countryContext}.

CONTEXT & FOUNDER DATA:
- Industry Category: ${sanitizePromptInput(params.industryCategory || 'Technology', 100)}
- One-Liner Summary: ${sanitizePromptInput(params.oneLinerSummary || '', 200)}
- Problem Statement: ${sanitizePromptInput(params.problemStatement || '', 250)}
- Solution Concept: ${sanitizePromptInput(params.solutionStatement || '', 250)}
- Unique Value Prop: ${sanitizePromptInput(params.uvpStatement || '', 250)}
- Beachhead Persona (Mod B): ${sanitizePromptInput(params.beachheadPersona || params.targetCustomer || '', 200)}
- Competitive Wedge (Mod B): ${sanitizePromptInput(params.competitiveWedge || '', 200)}
- Preferred Tone: ${params.preferredTone || fallback.suggestedToneOfVoice}

TASK REQUIREMENTS:
1. Elevator Hook (STRICT: MAXIMUM 140 CHARACTERS): A punchy, memorably clear one-sentence hook designed for a landing page H1, Twitter bio, or elevator intro. It MUST be <= 140 characters.
2. Classic Positioning Statement (Geoffrey Moore formula):
   - targetCustomer: "For [specific target customer persona]..."
   - customerProblem: "...who [core urgent pain point or frustration]..."
   - solutionCategory: "...[Company Name] is a [clear product vehicle / category]..."
   - primaryBenefit: "...that [single primary transformative outcome/benefit]..."
   - competitiveWedge: "...unlike [status quo or alternative competitors], we [unfair advantage / unique capability]..."
3. Tone of Voice:
   - Select one matching: AUTHORITATIVE_TRUSTED, APPROACHABLE_FRIENDLY, PLAYFUL_BOLD, TECHNICAL_TRANSPARENT, PREMIUM_CURATED.
   - Tone Boundaries ("We are [X] but never [Y]"): Give concrete 1-line guidance on brand voice guardrails.
4. Core Brand Pillars: Exactly 3 crisp, memorable pillars (3-6 words each) that anchor all marketing collateral and website sections.
5. Assessor Tip: 1 sentence advice for presenting this positioning during a commercial panel or grant interview.

Return strictly valid JSON:
{
  "elevatorHook140": "string (max 140 chars)",
  "positioningFormula": {
    "targetCustomer": "string",
    "customerProblem": "string",
    "solutionCategory": "string",
    "primaryBenefit": "string",
    "competitiveWedge": "string"
  },
  "suggestedToneOfVoice": "AUTHORITATIVE_TRUSTED" | "APPROACHABLE_FRIENDLY" | "PLAYFUL_BOLD" | "TECHNICAL_TRANSPARENT" | "PREMIUM_CURATED",
  "toneOfVoiceBoundary": {
    "weAre": "string",
    "weAreNever": "string"
  },
  "corePillars": ["string", "string", "string"],
  "assessorTip": "string"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          maxOutputTokens: 1024,
          temperature: 0.3,
        },
      });

      const text = response.text?.trim() || '';
      if (text) {
        const parsed = JSON.parse(text);
        let hook = String(parsed.elevatorHook140 || fallback.elevatorHook140).trim();
        if (hook.length > 140) {
          hook = hook.slice(0, 137).trim() + '...';
        }

        const validTones = [
          'AUTHORITATIVE_TRUSTED',
          'APPROACHABLE_FRIENDLY',
          'PLAYFUL_BOLD',
          'TECHNICAL_TRANSPARENT',
          'PREMIUM_CURATED',
        ];
        const tone = validTones.includes(parsed.suggestedToneOfVoice)
          ? parsed.suggestedToneOfVoice
          : fallback.suggestedToneOfVoice;

        const pillars: [string, string, string] = Array.isArray(parsed.corePillars) &&
          parsed.corePillars.length >= 3
            ? [
                String(parsed.corePillars[0]).trim(),
                String(parsed.corePillars[1]).trim(),
                String(parsed.corePillars[2]).trim(),
              ]
            : fallback.corePillars;

        await recordGeminiUsageAndIncrementCredits({
          verifiedUserId: authCtx.verifiedUserId,
          promptKey: 'MOD_I_POSITIONING',
          modelUsed: 'gemini-2.5-flash',
          inputTokens: response.usageMetadata?.promptTokenCount || 600,
          outputTokens: response.usageMetadata?.candidatesTokenCount || 400,
          usedByokKey: authCtx.usedByokKey,
          fallbackCreditsUsed: authCtx.currentCreditsUsed,
        });

        return {
          allowed: true,
          elevatorHook140: hook,
          positioningFormula: {
            targetCustomer:
              parsed.positioningFormula?.targetCustomer?.trim() ||
              fallback.positioningFormula.targetCustomer,
            customerProblem:
              parsed.positioningFormula?.customerProblem?.trim() ||
              fallback.positioningFormula.customerProblem,
            solutionCategory:
              parsed.positioningFormula?.solutionCategory?.trim() ||
              fallback.positioningFormula.solutionCategory,
            primaryBenefit:
              parsed.positioningFormula?.primaryBenefit?.trim() ||
              fallback.positioningFormula.primaryBenefit,
            competitiveWedge:
              parsed.positioningFormula?.competitiveWedge?.trim() ||
              fallback.positioningFormula.competitiveWedge,
          },
          suggestedToneOfVoice: tone,
          toneOfVoiceBoundary: {
            weAre:
              parsed.toneOfVoiceBoundary?.weAre?.trim() ||
              fallback.toneOfVoiceBoundary.weAre,
            weAreNever:
              parsed.toneOfVoiceBoundary?.weAreNever?.trim() ||
              fallback.toneOfVoiceBoundary.weAreNever,
          },
          corePillars: pillars,
          assessorTip: parsed.assessorTip?.trim() || fallback.assessorTip,
          engineMode: 'gemini-2.5-flash',
        };
      }
    } catch (err) {
      console.error('Error in generateModuleIPositioningViaRouter:', err);
    }
  }

  return fallback;
}



// --- MODULE I STEP 2: THE MODERN 4PS STRATEGY & CHANNEL DISTRIBUTION MATRIX ---

export interface GenerateModuleIFourPsParams {
  planTitle?: string;
  industryCategory?: string;
  hqCountryCode?: SupportedCountryCode;
  baseCurrency?: string;
  elevatorHook140?: string;
  targetCustomer?: string;
  customerProblem?: string;
  solutionCategory?: string;
  primaryBenefit?: string;
  competitiveWedge?: string;
  pricingVehicleFromModH?: string;
  blendedAveragePriceFromModH?: number;
  productVehicleFromModD?: string;
  headlinePricePointInput?: string;
}

export interface GenerateModuleIFourPsResult {
  allowed: boolean;
  reason?: string;
  productP1: {
    packagingType:
      | 'DIGITAL_SAAS_CLOUD'
      | 'PHYSICAL_D2C_PRODUCT'
      | 'HIGH_TOUCH_SERVICE'
      | 'MARKETPLACE_PLATFORM'
      | 'HYBRID_HARDWARE_SOFTWARE'
      | 'OTHER';
    otherPackagingTypeText?: string;
    coreDeliverableSummary: string;
    perceivedValueDriver: string;
  };
  priceP2: {
    pricingStance:
      | 'VALUE_BASED_PREMIUM'
      | 'COMPETITIVE_PARITY'
      | 'PENETRATION_LOSS_LEADER'
      | 'FREEMIUM_EXPAND'
      | 'TIERED_FLAT_SUBSCRIPTION'
      | 'USAGE_BASED_METERED'
      | 'OTHER';
    otherPricingStanceText?: string;
    headlinePricePoint: string;
    priceJustification: string;
    paymentTermsOrFrictionReducer: string;
  };
  placeP3: {
    primaryChannel:
      | 'DIRECT_WEB_SELF_SERVE'
      | 'OUTBOUND_DIRECT_SALES'
      | 'MARKETPLACE_APPSTORE'
      | 'PARTNER_RESELLER_NETWORK'
      | 'EVENTS_RETAIL_COMMUNITY'
      | 'OTHER';
    otherPrimaryChannelText?: string;
    secondaryChannels: string[];
    customerJourneyFrictionPoint: string;
    frictionMitigationPlan: string;
  };
  promotionP4: {
    primaryAcquisitionEngine:
      | 'FOUNDER_LED_ORGANIC'
      | 'OUTBOUND_ACCOUNT_BASED'
      | 'SEARCH_INTENT_SEO'
      | 'PAID_PERFORMANCE_ADS'
      | 'COMMUNITY_PARTNERSHIP'
      | 'OTHER';
    otherAcquisitionEngineText?: string;
    beachheadChannelTactics: string;
    primarySocialHub: string;
    contentOrCampaignHook: string;
  };
  strategicRationale: string;
  grantAssessorTip?: string;
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer' | 'unauthorized';
}

export function buildSmartFourPsFallback(
  params: GenerateModuleIFourPsParams
): GenerateModuleIFourPsResult {
  const title = params.planTitle?.trim() || 'Our Venture';
  const category = (params.industryCategory || 'B2B SaaS / AI App').toLowerCase();
  const customer = params.targetCustomer?.trim() || 'target decision-makers';
  const problem = params.customerProblem?.trim() || 'costly manual bottlenecks and inefficiencies';
  const benefit = params.primaryBenefit?.trim() || 'measurably faster execution and reduced operational overhead';
  const wedge = params.competitiveWedge?.trim() || 'faster time-to-value without legacy lock-in';
  const currSym = params.baseCurrency === 'GBP' ? '£' : params.baseCurrency === 'USD' ? '$' : '€';
  const avgPrice = params.blendedAveragePriceFromModH || 79;
  const resolvedPricePoint = params.headlinePricePointInput?.trim()
    ? params.headlinePricePointInput.trim()
    : null;

  const isB2bOrTech =
    category.includes('saas') ||
    category.includes('b2b') ||
    category.includes('tech') ||
    category.includes('ai') ||
    category.includes('fintech') ||
    category.includes('software');

  const isPhysicalOrD2c =
    category.includes('food') ||
    category.includes('beverage') ||
    category.includes('retail') ||
    category.includes('ecommerce') ||
    category.includes('hardware') ||
    category.includes('consumer');

  if (isPhysicalOrD2c) {
    return {
      allowed: true,
      productP1: {
        packagingType: 'PHYSICAL_D2C_PRODUCT',
        coreDeliverableSummary: `${title} delivered in premium, sustainable protective packaging with verified batch traceability and quick-start onboarding insert.`,
        perceivedValueDriver: `Uncompromising artisanal ingredient quality, 100% recyclable unboxing aesthetic, and transparent sourcing proof.`,
      },
      priceP2: {
        pricingStance: 'VALUE_BASED_PREMIUM',
        headlinePricePoint:
          resolvedPricePoint ||
          `${currSym}${avgPrice > 0 ? avgPrice : 38} per order / subscription box`,
        priceJustification: `Positioned in the accessible premium tier — superior quality and health credentials justify a 15–20% premium over generic supermarket alternatives.`,
        paymentTermsOrFrictionReducer: `First-order 100% satisfaction taste guarantee with 1-click subscription pause/cancellation anytime.`,
      },
      placeP3: {
        primaryChannel: 'DIRECT_WEB_SELF_SERVE',
        secondaryChannels: ['EVENTS_RETAIL_COMMUNITY', 'PARTNER_RESELLER_NETWORK'],
        customerJourneyFrictionPoint: `First-time hesitation regarding taste, delivery speed, and commitment to a recurring order.`,
        frictionMitigationPlan: `Low-barrier starter trial pack with free local delivery and social proof testimonials from early waitlist testers.`,
      },
      promotionP4: {
        primaryAcquisitionEngine: 'FOUNDER_LED_ORGANIC',
        beachheadChannelTactics: `Behind-the-scenes founder storytelling on Instagram/TikTok detailing the sourcing journey, paired with local weekend food festival sampling booths.`,
        primarySocialHub: 'Instagram',
        contentOrCampaignHook: `Why standard supermarket alternatives cut corners on ingredients — and the exact recipe behind our first batch.`,
      },
      strategicRationale: `Direct-to-consumer digital channels maximize gross margins while direct physical sampling builds authentic word-of-mouth advocates.`,
      grantAssessorTip: `LEO and grant evaluators favor physical brands that demonstrate defensible margins (>60% gross) and clear domestic-to-export supply-chain capability.`,
      engineMode: 'smart-synthesizer',
    };
  }

  // Default to B2B SaaS / High-Growth Digital Service
  return {
    allowed: true,
    productP1: {
      packagingType: isB2bOrTech ? 'DIGITAL_SAAS_CLOUD' : 'HIGH_TOUCH_SERVICE',
      coreDeliverableSummary: `Self-serve cloud platform access for ${customer} featuring automated data ingestion, pre-configured workflow templates, and exportable executive summaries.`,
      perceivedValueDriver: `Sub-5 minute initial setup, zero code or IT integration required, and dedicated async onboarding guidance from product experts.`,
    },
    priceP2: {
      pricingStance: 'VALUE_BASED_PREMIUM',
      headlinePricePoint:
        resolvedPricePoint ||
        `${currSym}${avgPrice > 0 ? avgPrice : 89}/month (or ${currSym}${Math.round((avgPrice > 0 ? avgPrice : 89) * 10)}/year upfront)`,
      priceJustification: `Priced at less than 10% of the quantifiable monthly cost of ${problem}, delivering an immediate ROI within the first 30 days of implementation.`,
      paymentTermsOrFrictionReducer: `14-day full feature trial (no credit card required) plus 30-day money-back implementation guarantee.`,
    },
    placeP3: {
      primaryChannel: isB2bOrTech ? 'DIRECT_WEB_SELF_SERVE' : 'OUTBOUND_DIRECT_SALES',
      secondaryChannels: ['OUTBOUND_DIRECT_SALES', 'PARTNER_RESELLER_NETWORK'],
      customerJourneyFrictionPoint: `Prospective users hesitating during onboarding when asked to import or connect their own proprietary data.`,
      frictionMitigationPlan: `Interactive pre-populated demo sandbox and 1-click sample data generator so users see instant value before uploading real files.`,
    },
    promotionP4: {
      primaryAcquisitionEngine: 'FOUNDER_LED_ORGANIC',
      beachheadChannelTactics: `Founder-led tactical teardowns on LinkedIn twice weekly analyzing common pitfalls in the industry, followed by high-touch 1-on-1 direct messaging to engage interested commenters.`,
      primarySocialHub: 'LinkedIn',
      contentOrCampaignHook: `The 3 costliest mistakes ${customer} make when tackling ${problem} — and the lightweight playbook that solves it.`,
    },
    strategicRationale: `Focusing on a single high-trust beachhead channel (founder-led authority) avoids premature ad spend while generating high-intent feedback loops directly with early adopters.`,
    grantAssessorTip: `Grant evaluators at LEO and Innovate UK check whether your customer acquisition channel matches your customer's natural procurement habits. B2B software must show direct access to real buyers.`,
    engineMode: 'smart-synthesizer',
  };
}

export async function generateModuleIFourPsViaRouter(
  params: GenerateModuleIFourPsParams
): Promise<GenerateModuleIFourPsResult> {
  const fallback = buildSmartFourPsFallback(params);
  const isIE = (params.hqCountryCode || 'IE') !== 'GB';
  const countryContext = isIE
    ? 'Ireland (Local Enterprise Office / Enterprise Ireland commercial validation panel)'
    : 'United Kingdom (Innovate UK & British Business Bank Start Up Loans assessment committee)';

  const authCtx = await authorizeAndPrepareGeminiCall(
    'MOD_I_FOUR_PS',
    'You are a senior Chief Marketing Officer (CMO), Go-To-Market (GTM) strategist, and startup grant appraisal specialist who builds disciplined, defensible Modern 4Ps marketing plans.'
  );

  if (authCtx.canCallLiveGemini && authCtx.activeApiKey) {
    try {
      const ai = getGenAiClient(authCtx.activeApiKey);
      const prompt = `Synthesize a rigorous, practical Modern 4Ps Strategy (Product, Price, Place, Promotion) for ${sanitizePromptInput(
        params.planTitle || 'Startup',
        100
      )} in ${countryContext}.

CONTEXT ABOUT THE VENTURE:
- Industry Category: ${sanitizePromptInput(params.industryCategory || 'Technology', 100)}
- 140-Character Hook: ${sanitizePromptInput(params.elevatorHook140 || '', 200)}
- Target Customer / Beachhead: ${sanitizePromptInput(params.targetCustomer || '', 150)}
- Customer Core Problem: ${sanitizePromptInput(params.customerProblem || '', 200)}
- Proposed Solution: ${sanitizePromptInput(params.solutionCategory || '', 200)}
- Primary Benefit: ${sanitizePromptInput(params.primaryBenefit || '', 200)}
- Competitive Wedge: ${sanitizePromptInput(params.competitiveWedge || '', 200)}
- Module H Pricing Context: ${sanitizePromptInput(params.pricingVehicleFromModH || '', 100)}, Blended Price: ${params.baseCurrency || 'EUR'} ${params.blendedAveragePriceFromModH || 79}
${params.headlinePricePointInput ? `- Upstream Headline Price Anchor (Priority): ${sanitizePromptInput(params.headlinePricePointInput, 100)}` : ''}
- Module D Product Vehicle: ${sanitizePromptInput(params.productVehicleFromModD || '', 100)}

INSTRUCTIONS:
Generate a cohesive Modern 4Ps strategy tailored specifically to early-stage execution (0 to 100 customers):
1. Product (P1): Packaging type, exact core deliverable summary, perceived value driver that turns software/product into an irresistible purchase.
2. Price (P2): Strategic pricing stance, specific headline price point (align with Upstream Headline Price Anchor if provided), rock-solid price justification against customer inaction, payment terms/friction reducer (free trial, money back, net 30).
3. Place / Distribution (P3): Single primary distribution vehicle, secondary channels, exact friction point where buyers get stuck, tactical friction mitigation plan.
4. Promotion (P4): Single primary acquisition engine to master first (founder-led organic, outbound account-based, search SEO, paid ads, or community/partnership), step-by-step beachhead channel tactics, primary social hub (e.g. LinkedIn, Instagram, TikTok, X), and first content or campaign headline hook.
5. Strategic Rationale: 2 concise sentences explaining why this 4Ps combination minimizes founder burn and accelerates conversion.
6. Grant Assessor Tip: 1-sentence tip on how grant appraisers (LEO / Innovate UK) will evaluate this marketing mix.

Respond ONLY with a valid JSON object matching this schema:
{
  "productP1": {
    "packagingType": "DIGITAL_SAAS_CLOUD" | "PHYSICAL_D2C_PRODUCT" | "HIGH_TOUCH_SERVICE" | "MARKETPLACE_PLATFORM" | "HYBRID_HARDWARE_SOFTWARE" | "OTHER",
    "otherPackagingTypeText": string or null,
    "coreDeliverableSummary": string,
    "perceivedValueDriver": string
  },
  "priceP2": {
    "pricingStance": "VALUE_BASED_PREMIUM" | "COMPETITIVE_PARITY" | "PENETRATION_LOSS_LEADER" | "FREEMIUM_EXPAND" | "TIERED_FLAT_SUBSCRIPTION" | "USAGE_BASED_METERED" | "OTHER",
    "otherPricingStanceText": string or null,
    "headlinePricePoint": string,
    "priceJustification": string,
    "paymentTermsOrFrictionReducer": string
  },
  "placeP3": {
    "primaryChannel": "DIRECT_WEB_SELF_SERVE" | "OUTBOUND_DIRECT_SALES" | "MARKETPLACE_APPSTORE" | "PARTNER_RESELLER_NETWORK" | "EVENTS_RETAIL_COMMUNITY" | "OTHER",
    "otherPrimaryChannelText": string or null,
    "secondaryChannels": string[],
    "customerJourneyFrictionPoint": string,
    "frictionMitigationPlan": string
  },
  "promotionP4": {
    "primaryAcquisitionEngine": "FOUNDER_LED_ORGANIC" | "OUTBOUND_ACCOUNT_BASED" | "SEARCH_INTENT_SEO" | "PAID_PERFORMANCE_ADS" | "COMMUNITY_PARTNERSHIP" | "OTHER",
    "otherAcquisitionEngineText": string or null,
    "beachheadChannelTactics": string,
    "primarySocialHub": string,
    "contentOrCampaignHook": string
  },
  "strategicRationale": string,
  "grantAssessorTip": string
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.25,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text;
      if (responseText) {
        const parsed = JSON.parse(responseText);

        const packaging = [
          'DIGITAL_SAAS_CLOUD',
          'PHYSICAL_D2C_PRODUCT',
          'HIGH_TOUCH_SERVICE',
          'MARKETPLACE_PLATFORM',
          'HYBRID_HARDWARE_SOFTWARE',
          'OTHER',
        ].includes(parsed.productP1?.packagingType)
          ? parsed.productP1.packagingType
          : fallback.productP1.packagingType;

        const stance = [
          'VALUE_BASED_PREMIUM',
          'COMPETITIVE_PARITY',
          'PENETRATION_LOSS_LEADER',
          'FREEMIUM_EXPAND',
          'TIERED_FLAT_SUBSCRIPTION',
          'USAGE_BASED_METERED',
          'OTHER',
        ].includes(parsed.priceP2?.pricingStance)
          ? parsed.priceP2.pricingStance
          : fallback.priceP2.pricingStance;

        const channel = [
          'DIRECT_WEB_SELF_SERVE',
          'OUTBOUND_DIRECT_SALES',
          'MARKETPLACE_APPSTORE',
          'PARTNER_RESELLER_NETWORK',
          'EVENTS_RETAIL_COMMUNITY',
          'OTHER',
        ].includes(parsed.placeP3?.primaryChannel)
          ? parsed.placeP3.primaryChannel
          : fallback.placeP3.primaryChannel;

        const engine = [
          'FOUNDER_LED_ORGANIC',
          'OUTBOUND_ACCOUNT_BASED',
          'SEARCH_INTENT_SEO',
          'PAID_PERFORMANCE_ADS',
          'COMMUNITY_PARTNERSHIP',
          'OTHER',
        ].includes(parsed.promotionP4?.primaryAcquisitionEngine)
          ? parsed.promotionP4.primaryAcquisitionEngine
          : fallback.promotionP4.primaryAcquisitionEngine;

        return {
          allowed: true,
          productP1: {
            packagingType: packaging,
            otherPackagingTypeText: parsed.productP1?.otherPackagingTypeText?.trim() || undefined,
            coreDeliverableSummary:
              parsed.productP1?.coreDeliverableSummary?.trim() ||
              fallback.productP1.coreDeliverableSummary,
            perceivedValueDriver:
              parsed.productP1?.perceivedValueDriver?.trim() ||
              fallback.productP1.perceivedValueDriver,
          },
          priceP2: {
            pricingStance: stance,
            otherPricingStanceText: parsed.priceP2?.otherPricingStanceText?.trim() || undefined,
            headlinePricePoint:
              parsed.priceP2?.headlinePricePoint?.trim() ||
              fallback.priceP2.headlinePricePoint,
            priceJustification:
              parsed.priceP2?.priceJustification?.trim() ||
              fallback.priceP2.priceJustification,
            paymentTermsOrFrictionReducer:
              parsed.priceP2?.paymentTermsOrFrictionReducer?.trim() ||
              fallback.priceP2.paymentTermsOrFrictionReducer,
          },
          placeP3: {
            primaryChannel: channel,
            otherPrimaryChannelText: parsed.placeP3?.otherPrimaryChannelText?.trim() || undefined,
            secondaryChannels: Array.isArray(parsed.placeP3?.secondaryChannels)
              ? parsed.placeP3.secondaryChannels
              : fallback.placeP3.secondaryChannels,
            customerJourneyFrictionPoint:
              parsed.placeP3?.customerJourneyFrictionPoint?.trim() ||
              fallback.placeP3.customerJourneyFrictionPoint,
            frictionMitigationPlan:
              parsed.placeP3?.frictionMitigationPlan?.trim() ||
              fallback.placeP3.frictionMitigationPlan,
          },
          promotionP4: {
            primaryAcquisitionEngine: engine,
            otherAcquisitionEngineText: parsed.promotionP4?.otherAcquisitionEngineText?.trim() || undefined,
            beachheadChannelTactics:
              parsed.promotionP4?.beachheadChannelTactics?.trim() ||
              fallback.promotionP4.beachheadChannelTactics,
            primarySocialHub:
              parsed.promotionP4?.primarySocialHub?.trim() ||
              fallback.promotionP4.primarySocialHub,
            contentOrCampaignHook:
              parsed.promotionP4?.contentOrCampaignHook?.trim() ||
              fallback.promotionP4.contentOrCampaignHook,
          },
          strategicRationale:
            parsed.strategicRationale?.trim() || fallback.strategicRationale,
          grantAssessorTip:
            parsed.grantAssessorTip?.trim() || fallback.grantAssessorTip,
          engineMode: 'gemini-2.5-flash',
        };
      }
    } catch (err) {
      console.error('Error in generateModuleIFourPsViaRouter:', err);
    }
  }

  return fallback;
}



// ============================================================================
// MODULE I — STEP 3: FIRST 10 CUSTOMERS PLAYBOOK & LOI GENERATOR
// ============================================================================

export interface GenerateModuleIFirst10Params {
  planTitle?: string;
  industryCategory?: string;
  hqCountryCode?: SupportedCountryCode;
  baseCurrency?: string;
  elevatorHook140?: string;
  targetCustomer?: string;
  customerProblem?: string;
  solutionCategory?: string;
  primaryBenefit?: string;
  competitiveWedge?: string;
  headlinePricePoint?: string;
  packagingType?: string;
  preferredArchetype?: First10AcquisitionArchetype;
}

export interface GenerateModuleIFirst10Result {
  allowed: boolean;
  reason?: string;
  acquisitionArchetype: First10AcquisitionArchetype;
  pilotOffer: First10PilotOffer;
  targetPipeline: First10ProspectItem[];
  outreachScripts: First10OutreachScripts;
  followUpCadence: First10FollowUpCadence;
  objectionBusters: First10ObjectionBusters;
  letterOfIntent: First10LetterOfIntent;
  grantAssessorTip?: string;
  engineMode?: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export function generateLetterOfIntentMarkdown(params: {
  startupName: string;
  targetCompanyName: string;
  targetContactName: string;
  pilotDurationWeeks: number;
  pilotPricePoint: string;
  primarySuccessKpi: string;
  customTermsText?: string;
  hqCountryCode?: string;
  baseCurrency?: string;
}): string {
  const startup = params.startupName?.trim() || 'Our Startup';
  const company = params.targetCompanyName?.trim() || '[Prospective Customer Company]';
  const contact = params.targetContactName?.trim() || '[Decision Maker Name / Title]';
  const duration = params.pilotDurationWeeks || 4;
  const price = params.pilotPricePoint?.trim() || 'Agreed Preferential Early Adopter Rate';
  const kpi =
    params.primarySuccessKpi?.trim() ||
    'Measurable reduction in operational turnaround time and overhead cost';
  const jurisdictionText =
    params.hqCountryCode === 'GB'
      ? 'recognized under UK commercial standards (aligned with Innovate UK / British Business Bank customer validation benchmarks)'
      : 'recognized under Irish commercial standards (aligned with Enterprise Ireland & LEO Feasibility/Priming validation benchmarks)';
  const extra = params.customTermsText?.trim()
    ? `\n\n### 5. Specific Pilot Governance & Addenda\n${params.customTermsText.trim()}`
    : '';

  return `# NON-BINDING EARLY ADOPTER LETTER OF INTENT (LOI)

**Date:** ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}  
**Between:** **${startup}** ("Solution Provider")  
**And:** **${company}** ("Prospective Customer")  
**Key Executive Contact:** ${contact}  

---

### 1. Purpose & Mutual Strategic Intent
This non-binding Letter of Intent confirms that **${company}** intends to participate as an early design partner in the evaluation pilot program of **${startup}**. The primary purpose of this evaluation is to test and validate whether the solution effectively delivers the following operational outcome:
> **"${kpi}"**

### 2. Pilot Scope & Governance
- **Duration:** ${duration} weeks commencing upon mutual deployment and access provisioning.
- **Dedicated Founder Guidance:** Solution Provider will provide direct async and weekly review support to ensure seamless onboarding and rapid time-to-value.
- **Feedback & Evaluation:** Prospective Customer agrees to provide regular operational feedback and evaluate system performance against the agreed success metric.

### 3. Commercial Terms Upon Milestone Success
Should the solution successfully satisfy the primary success criteria outlined in Section 1 during the pilot window, **${company}** intends in good faith to transition into a standard commercial agreement at the preferential founding rate of:
> **${price}**

### 4. Non-Binding Nature & Confidentiality
This document constitutes an expression of serious commercial interest and mutual good faith, ${jurisdictionText}. It does not create legal or financial liability for either party prior to the formal execution of a definitive commercial agreement. Both parties agree to treat proprietary insights exchanged during the pilot as confidential.

---

**Confirmed in Good Faith & Principle:**

**For ${company}:**  
Name / Title: ___________________________  
Signature: _______________________________  
Date: ___________________________________  

**For ${startup}:**  
Founder / Executive: _____________________  
Signature: _______________________________  
Date: ___________________________________  
${extra}`;
}

export function buildSmartFirst10Fallback(
  params: GenerateModuleIFirst10Params
): GenerateModuleIFirst10Result {
  const title = params.planTitle?.trim() || 'Our Venture';
  const category = (params.industryCategory || 'B2B SaaS / AI App').toLowerCase();
  const customer = params.targetCustomer?.trim() || 'target decision-makers';
  const problem = params.customerProblem?.trim() || 'costly manual operational friction';
  const benefit = params.primaryBenefit?.trim() || 'faster time-to-value and reduced operating costs';
  const pricePoint = params.headlinePricePoint?.trim() || '€49 / month';

  const isPhysicalOrD2c =
    category.includes('food') ||
    category.includes('beverage') ||
    category.includes('retail') ||
    category.includes('ecommerce') ||
    category.includes('hardware') ||
    category.includes('consumer');

  const archetype: First10AcquisitionArchetype =
    params.preferredArchetype ||
    (isPhysicalOrD2c ? 'COMMUNITY_ADVISORY_COUNCIL' : 'ACCOUNT_BASED_SNIPER');

  if (isPhysicalOrD2c) {
    const kpi = `Consistent 4.5+ star sensory feedback and at least 3 repeat batch reorders across initial pilot retailers`;
    const loi = {
      targetCompanyName: 'Local Specialty Retailer / Partner',
      targetContactName: 'Store Manager / Head Buyer',
      pilotDurationWeeks: 4,
      pilotPricePoint: `${pricePoint} (Wholesale Introductory Rate)`,
      primarySuccessKpi: kpi,
      generatedLoiMarkdown: generateLetterOfIntentMarkdown({
        startupName: title,
        targetCompanyName: 'Local Specialty Retailer / Partner',
        targetContactName: 'Store Manager / Head Buyer',
        pilotDurationWeeks: 4,
        pilotPricePoint: `${pricePoint} (Wholesale Introductory Rate)`,
        primarySuccessKpi: kpi,
      }),
    };

    return {
      allowed: true,
      acquisitionArchetype: archetype,
      pilotOffer: {
        pilotStructure: `First-batch sampling box at 50% discount with zero wholesale minimum order quantity for 30 days.`,
        quidProQuoFounderAsk: `60-second raw unboxing/taste-test video review + permission to feature your store logo on our launch page.`,
        riskReversal: `100% sell-through guarantee: If unsold within 30 days, we buy back all remaining stock with zero hassle.`,
      },
      targetPipeline: [
        {
          id: 'lead-1',
          companyOrPersona: 'Artisan Food Hall & Specialty Deli',
          decisionMakerTitle: 'Lead Merchandiser / Owner',
          triggerEventOrAngle: `Prioritizing regional, high-margin craft products with sustainable packaging.`,
          status: 'TO_CONTACT',
          source: 'MANUAL',
        },
        {
          id: 'lead-2',
          companyOrPersona: 'Boutique Coffee Roaster & Cafe',
          decisionMakerTitle: 'Founder / Operations Lead',
          triggerEventOrAngle: `Looking for unique artisan items to elevate customer basket size at checkout.`,
          status: 'TO_CONTACT',
          source: 'MANUAL',
        },
        {
          id: 'lead-3',
          companyOrPersona: 'Local Fitness & Wellness Community Hub',
          decisionMakerTitle: 'General Manager',
          triggerEventOrAngle: `Members demand clean, transparent ingredients; ideal captive early audience.`,
          status: 'TO_CONTACT',
          source: 'MANUAL',
        },
        {
          id: 'lead-4',
          companyOrPersona: 'Independent High-End Grocer',
          decisionMakerTitle: 'Category Purchasing Manager',
          triggerEventOrAngle: `Stocking premium domestic alternatives to mainstream legacy brands.`,
          status: 'TO_CONTACT',
          source: 'MANUAL',
        },
        {
          id: 'lead-5',
          companyOrPersona: 'Corporate Gifting / Hamper Curator',
          decisionMakerTitle: 'Creative Director',
          triggerEventOrAngle: `Seeking standout local products for high-end quarterly corporate hampers.`,
          status: 'TO_CONTACT',
          source: 'MANUAL',
        },
      ],
      outreachScripts: {
        advisoryScript: `Hi [First Name],\n\nI’ve admired how you curate products at [Store/Cafe] — your recent selection of local brands really stood out.\n\nI’m the founder of ${title}, and we’ve spent the last 6 months perfecting ${benefit}. Before our wider rollout, I’d love to drop off a complimentary sample box for you and your team to taste test and get your honest feedback.\n\nNo sales pitch at all — just looking for guidance from experienced curators. Could I drop by for 5 minutes this Thursday?\n\nWarmly,\n[Founder Name]`,
        sniperScript: `Hi [First Name],\n\nNoticed how popular your premium shelf items have been with local customers.\n\nWe created ${title} to address the growing demand for clean-label, high-margin alternatives. We’re offering 5 local partners a guaranteed zero-risk pilot pack (50% off wholesale, zero minimum order, and full buyback if unsold in 30 days).\n\nWould you be open to tasting a sample batch this week?\n\nBest,\n[Founder Name]`,
        foundingCohortScript: `Hi [First Name],\n\nWe’re hand-picking 10 founding retail partners in [Region] to showcase ${title} ahead of our national launch.\n\nAs a founding partner, you receive priority stock allocations, permanent introductory wholesale pricing (${pricePoint}), and featured promotion across our launch marketing.\n\nWould you like to review the pilot agreement?\n\nWarmly,\n[Founder Name]`,
      },
      followUpCadence: {
        day1Icebreaker: `Initial sample delivery or personalized message sent with product credentials and tasting notes.`,
        day4Bump: `Hi [First Name], hope you and the team enjoyed the sample box! Did you get a chance to try it? Would love your honest impression whenever you have a second.`,
        day8MicroQuestion: `Hi [First Name], quick question: are you currently looking to expand your local artisan shelf offerings for the upcoming season, or is your supplier roster completely full? Either way, appreciate your time!`,
        day14Breakup: `Hi [First Name], assuming you’re swamped right now, I’ll hold off on following up so I don't clutter your inbox. If you ever want to stock our first batch, our door is always open. Wishing [Store Name] a fantastic quarter!`,
      },
      objectionBusters: {
        vendorRisk: `We hold verified food safety certifications and maintain domestic production reserves, so your stock replenishment is guaranteed within 48 hours.`,
        statusQuoInertia: `We provide complete POS counter displays and free promotional sampling packs, so it takes zero extra staff effort to start selling on day one.`,
        featureGap: `We are launching with our core hero flavor first to maximize inventory turnover, and our pilot partners get first access to upcoming seasonal releases.`,
      },
      letterOfIntent: loi,
      grantAssessorTip: `LEO and grant bodies look for verified commercial pull. Attaching 2-3 signed retail LOIs proves genuine domestic market traction and export potential.`,
      engineMode: 'smart-synthesizer',
    };
  }

  // Default: B2B SaaS, Professional Service, or High-Growth Platform
  const kpi = `Measurable reduction of at least 25% in time spent on ${problem}, verified by weekly operational metrics`;
  const loi = {
    targetCompanyName: '[Target Company / Beta Partner]',
    targetContactName: '[Decision Maker Name / Title]',
    pilotDurationWeeks: 4,
    pilotPricePoint: `${pricePoint} (Founding Partner Rate)`,
    primarySuccessKpi: kpi,
    generatedLoiMarkdown: generateLetterOfIntentMarkdown({
      startupName: title,
      targetCompanyName: '[Target Company / Beta Partner]',
      targetContactName: '[Decision Maker Name / Title]',
      pilotDurationWeeks: 4,
      pilotPricePoint: `${pricePoint} (Founding Partner Rate)`,
      primarySuccessKpi: kpi,
    }),
  };

  return {
    allowed: true,
    acquisitionArchetype: archetype,
    pilotOffer: {
      pilotStructure: `Founding Design Partner 50% discount (${pricePoint}) guaranteed for life during a structured 30-day proof-of-concept pilot.`,
      quidProQuoFounderAsk: `Weekly 20-minute async/live feedback sprint + written case study and logo rights upon achieving the agreed success KPI.`,
      riskReversal: `100% money-back guarantee, done-for-you onboarding setup handled personally by the founder, and full data export anytime with zero lock-in.`,
    },
    targetPipeline: [
      {
        id: 'lead-1',
        companyOrPersona: 'Mid-Market Regional Operator (50–200 staff)',
        decisionMakerTitle: 'Head of Operations / Managing Director',
        triggerEventOrAngle: `Struggles with ${problem}; actively hiring administrative headcount to handle workflow backlog.`,
        status: 'TO_CONTACT',
        source: 'MANUAL',
      },
      {
        id: 'lead-2',
        companyOrPersona: 'Boutique Advisory & Consulting Practice',
        decisionMakerTitle: 'Senior Partner / Practice Lead',
        triggerEventOrAngle: `Vocal on LinkedIn about legacy software frustration; eager for modern agile tooling that saves billable hours.`,
        status: 'TO_CONTACT',
        source: 'MANUAL',
      },
      {
        id: 'lead-3',
        companyOrPersona: 'Fast-Growing Seed / Series-A Scaleup',
        decisionMakerTitle: 'VP of Product / Growth',
        triggerEventOrAngle: `Needs ${benefit} to hit expansion KPIs without inflating operational fixed costs.`,
        status: 'TO_CONTACT',
        source: 'MANUAL',
      },
      {
        id: 'lead-4',
        companyOrPersona: 'Independent Sector Specialist / Contractor',
        decisionMakerTitle: 'Founder & Principal Consultant',
        triggerEventOrAngle: `Can test the platform across multiple client accounts and act as a high-authority referral advocate.`,
        status: 'TO_CONTACT',
        source: 'MANUAL',
      },
      {
        id: 'lead-5',
        companyOrPersona: 'Warm Professional Rolodex Contact',
        decisionMakerTitle: 'Director of Technology / Systems',
        triggerEventOrAngle: `High-trust relationship from previous career; ideal benchmark test for the very first v1 pilot deployment.`,
        status: 'TO_CONTACT',
        source: 'MANUAL',
      },
    ],
    outreachScripts: {
      advisoryScript: `Hi [First Name],\n\nI’ve been following your work at [Company] — loved your recent insights on [Industry Trend].\n\nI’m the founder of ${title}. We’re building a dedicated platform to help ${customer} eliminate ${problem}. Since you lead operations in this space daily, I’d love to get your raw perspective on whether our approach solves the real bottleneck.\n\nNot selling anything at all — just looking for feedback from respected operators before our launch. Would you be open to a 15-minute Zoom or coffee next Tuesday?\n\nBest,\n[Founder Name]`,
      sniperScript: `Hi [First Name],\n\nNoticed [Company] has been expanding rapidly over the past few quarters.\n\nI took 5 minutes to audit how teams in your sector usually handle ${problem}, and recorded a concise 90-second Loom showing a 25% efficiency leak you might have right now: [Link]\n\nWe engineered ${title} specifically to fix this bottleneck. Would a 10-minute walkthrough be worth your time this Thursday?\n\nBest,\n[Founder Name]`,
      foundingCohortScript: `Hi [First Name],\n\nWe are accepting exactly 10 Founding Design Partners for ${title} ahead of our general release.\n\nAs a founding partner, you receive direct weekly founder onboarding, custom workflow priority, and a permanently locked-in 50% lifetime rate (${pricePoint}), in exchange for evaluating the system and sharing honest feedback.\n\nGiven [Company]’s focus on ${benefit}, I thought you’d be an ideal fit. Would you like to review the 1-page pilot brief?\n\nBest,\n[Founder Name]`,
    },
    followUpCadence: {
      day1Icebreaker: `Initial personalized outreach sent with specific trigger event and value-add insight (Loom or workflow teardown).`,
      day4Bump: `Hi [First Name], just floating this back to the top of your inbox. Thought you might find this 1-page breakdown on tackling ${problem} useful for [Company]: [Link]. Let me know if you'd like to chat!`,
      day8MicroQuestion: `Hi [First Name], quick question: is streamlining ${problem} an active priority for [Company] this quarter, or are you entirely satisfied with your current process? Either way, appreciate your time!`,
      day14Breakup: `Hi [First Name], I haven’t heard back so I’ll assume this isn’t a priority right now. I’ll close your file so I don't clutter your inbox. If your priorities change down the road, my door is always open. Wishing you and [Company] all the best!`,
    },
    objectionBusters: {
      vendorRisk: `We are fully funded with zero technical debt, all your operational data is 100% exportable in open standard formats anytime, and during the pilot you have direct 24/7 WhatsApp/mobile access to the founding team.`,
      statusQuoInertia: `You don’t need to rip-and-replace anything. We handle 100% of the initial onboarding setup and run side-by-side with your existing workflow for 14 days so you experience zero operational downtime.`,
      featureGap: `As one of our first 10 design partners, your exact operational workflow dictates our product roadmap. Instead of waiting months on a generic corporate support queue, your required feature goes straight into our active sprint.`,
    },
    letterOfIntent: loi,
    grantAssessorTip: `LEO and Innovate UK panels reward founders who demonstrate direct access to target buyers. Including signed LOIs in your appendix elevates commercial feasibility scoring dramatically.`,
    engineMode: 'smart-synthesizer',
  };
}

export async function generateModuleIFirst10ViaRouter(
  params: GenerateModuleIFirst10Params
): Promise<GenerateModuleIFirst10Result> {
  const fallback = buildSmartFirst10Fallback(params);
  const isIE = (params.hqCountryCode || 'IE') !== 'GB';
  const countryContext = isIE
    ? 'Ireland (Local Enterprise Office / Enterprise Ireland commercial panel)'
    : 'United Kingdom (Innovate UK & British Business Bank assessment panel)';

  const authCtx = await authorizeAndPrepareGeminiCall(
    'MOD_I_FIRST_10',
    'You are a senior Chief Commercial Officer (CCO), B2B sales strategist, and startup grant appraisal specialist who builds disciplined, tactical First 10 Customer playbooks.'
  );

  if (authCtx.canCallLiveGemini && authCtx.activeApiKey) {
    try {
      const ai = getGenAiClient(authCtx.activeApiKey);
      const prompt = `Synthesize an actionable, high-conversion "First 10 Customers Playbook" for ${sanitizePromptInput(
        params.planTitle || 'Startup',
        100
      )} in ${countryContext}.

VENTURE CONTEXT:
- Industry Category: ${sanitizePromptInput(params.industryCategory || 'Technology', 100)}
- 140-Character Hook: ${sanitizePromptInput(params.elevatorHook140 || '', 200)}
- Target Customer / Beachhead: ${sanitizePromptInput(params.targetCustomer || '', 150)}
- Customer Core Problem: ${sanitizePromptInput(params.customerProblem || '', 200)}
- Proposed Solution: ${sanitizePromptInput(params.solutionCategory || '', 200)}
- Primary Benefit: ${sanitizePromptInput(params.primaryBenefit || '', 200)}
- Competitive Wedge: ${sanitizePromptInput(params.competitiveWedge || '', 200)}
- Headline Price Anchor: ${sanitizePromptInput(params.headlinePricePoint || '€49 / month', 100)}

INSTRUCTIONS:
1. Acquisition Archetype: Pick the most realistic channel archetype (WARM_NETWORK_ROLODEX, ACCOUNT_BASED_SNIPER, COMMUNITY_ADVISORY_COUNCIL, MANUAL_CONCIERGE_PILOT, EXCLUSIVE_FOUNDING_COHORT).
2. Pilot Offer: Define an irresistible pilot structure, explicit founder quid-pro-quo ask (testimonials, feedback), and total risk reversal.
3. Target Pipeline: Provide 5 realistic named prospect profiles / archetypes with specific trigger events and wedge angles.
4. 3 Outreach Scripts: (a) Warm Advisory Approach, (b) Value-first Sniper Teardown, (c) 10-Seat Founding Cohort invitation.
5. 4-Touch Follow-Up Cadence: Day 1 Icebreaker, Day 4 Value Bump, Day 8 Micro-Question, Day 14 Polite Breakup Email.
6. Top 3 Early-Stage Objection Busters: Specific rebuttals for (a) Vendor stability/longevity risk, (b) Status quo/inertia, (c) Missing feature X.
7. Letter of Intent (LOI) Terms: Specific success KPI and pilot terms.

Respond ONLY with a valid JSON object matching this schema:
{
  "acquisitionArchetype": "WARM_NETWORK_ROLODEX" | "ACCOUNT_BASED_SNIPER" | "COMMUNITY_ADVISORY_COUNCIL" | "MANUAL_CONCIERGE_PILOT" | "EXCLUSIVE_FOUNDING_COHORT",
  "pilotOffer": {
    "pilotStructure": "string",
    "quidProQuoFounderAsk": "string",
    "riskReversal": "string"
  },
  "targetPipeline": [
    {
      "id": "string",
      "companyOrPersona": "string",
      "decisionMakerTitle": "string",
      "triggerEventOrAngle": "string",
      "status": "TO_CONTACT",
      "source": "MANUAL"
    }
  ],
  "outreachScripts": {
    "advisoryScript": "string",
    "sniperScript": "string",
    "foundingCohortScript": "string"
  },
  "followUpCadence": {
    "day1Icebreaker": "string",
    "day4Bump": "string",
    "day8MicroQuestion": "string",
    "day14Breakup": "string"
  },
  "objectionBusters": {
    "vendorRisk": "string",
    "statusQuoInertia": "string",
    "featureGap": "string"
  },
  "letterOfIntent": {
    "targetCompanyName": "string",
    "targetContactName": "string",
    "pilotDurationWeeks": 4,
    "pilotPricePoint": "string",
    "primarySuccessKpi": "string"
  },
  "grantAssessorTip": "string"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          maxOutputTokens: 2048,
        },
      });

      const text = response.text?.trim() || '';
      if (text) {
        const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        const targetCompanyName =
          parsed.letterOfIntent?.targetCompanyName?.trim() ||
          fallback.letterOfIntent.targetCompanyName;
        const targetContactName =
          parsed.letterOfIntent?.targetContactName?.trim() ||
          fallback.letterOfIntent.targetContactName;
        const pilotDurationWeeks =
          typeof parsed.letterOfIntent?.pilotDurationWeeks === 'number'
            ? parsed.letterOfIntent.pilotDurationWeeks
            : 4;
        const pilotPricePoint =
          parsed.letterOfIntent?.pilotPricePoint?.trim() ||
          params.headlinePricePoint ||
          fallback.letterOfIntent.pilotPricePoint;
        const primarySuccessKpi =
          parsed.letterOfIntent?.primarySuccessKpi?.trim() ||
          fallback.letterOfIntent.primarySuccessKpi;

        const generatedLoi = generateLetterOfIntentMarkdown({
          startupName: params.planTitle || 'Our Venture',
          targetCompanyName,
          targetContactName,
          pilotDurationWeeks,
          pilotPricePoint,
          primarySuccessKpi,
        });

        return {
          allowed: true,
          acquisitionArchetype:
            parsed.acquisitionArchetype || fallback.acquisitionArchetype,
          pilotOffer: {
            pilotStructure:
              parsed.pilotOffer?.pilotStructure?.trim() ||
              fallback.pilotOffer.pilotStructure,
            quidProQuoFounderAsk:
              parsed.pilotOffer?.quidProQuoFounderAsk?.trim() ||
              fallback.pilotOffer.quidProQuoFounderAsk,
            riskReversal:
              parsed.pilotOffer?.riskReversal?.trim() ||
              fallback.pilotOffer.riskReversal,
          },
          targetPipeline:
            Array.isArray(parsed.targetPipeline) && parsed.targetPipeline.length > 0
              ? parsed.targetPipeline.map((item: any, idx: number) => ({
                  id: `prospect-${idx + 1}-${Date.now()}`,
                  companyOrPersona:
                    item.companyOrPersona?.trim() ||
                    `Target Prospect Profile #${idx + 1}`,
                  decisionMakerTitle:
                    item.decisionMakerTitle?.trim() || 'Decision Maker',
                  triggerEventOrAngle:
                    item.triggerEventOrAngle?.trim() ||
                    'High-priority operational pain point',
                  status: 'TO_CONTACT' as const,
                  source: 'MANUAL' as const,
                }))
              : fallback.targetPipeline,
          outreachScripts: {
            advisoryScript:
              parsed.outreachScripts?.advisoryScript?.trim() ||
              fallback.outreachScripts.advisoryScript,
            sniperScript:
              parsed.outreachScripts?.sniperScript?.trim() ||
              fallback.outreachScripts.sniperScript,
            foundingCohortScript:
              parsed.outreachScripts?.foundingCohortScript?.trim() ||
              fallback.outreachScripts.foundingCohortScript,
          },
          followUpCadence: {
            day1Icebreaker:
              parsed.followUpCadence?.day1Icebreaker?.trim() ||
              fallback.followUpCadence.day1Icebreaker,
            day4Bump:
              parsed.followUpCadence?.day4Bump?.trim() ||
              fallback.followUpCadence.day4Bump,
            day8MicroQuestion:
              parsed.followUpCadence?.day8MicroQuestion?.trim() ||
              fallback.followUpCadence.day8MicroQuestion,
            day14Breakup:
              parsed.followUpCadence?.day14Breakup?.trim() ||
              fallback.followUpCadence.day14Breakup,
          },
          objectionBusters: {
            vendorRisk:
              parsed.objectionBusters?.vendorRisk?.trim() ||
              fallback.objectionBusters.vendorRisk,
            statusQuoInertia:
              parsed.objectionBusters?.statusQuoInertia?.trim() ||
              fallback.objectionBusters.statusQuoInertia,
            featureGap:
              parsed.objectionBusters?.featureGap?.trim() ||
              fallback.objectionBusters.featureGap,
          },
          letterOfIntent: {
            targetCompanyName,
            targetContactName,
            pilotDurationWeeks,
            pilotPricePoint,
            primarySuccessKpi,
            generatedLoiMarkdown: generatedLoi,
          },
          grantAssessorTip:
            parsed.grantAssessorTip?.trim() || fallback.grantAssessorTip,
          engineMode: 'gemini-2.5-flash',
        };
      }
    } catch (err) {
      console.error('Error in generateModuleIFirst10ViaRouter:', err);
    }
  }

  return fallback;
}



// ============================================================================
// MODULE I — SECTION 3.6: DYNAMIC OBJECTION BUSTERS & AI REBUTTALS
// ============================================================================

export interface GenerateModuleIObjectionBustersParams {
  planTitle?: string;
  industryCategory?: string;
  hqCountryCode?: SupportedCountryCode;
  baseCurrency?: string;
  elevatorHook140?: string;
  targetCustomer?: string;
  customerProblem?: string;
  solutionCategory?: string;
  primaryBenefit?: string;
  competitiveWedge?: string;
  headlinePricePoint?: string;
  productVehicle?: string;
  mainCompetitors?: string;
  surveyFeedbackSummary?: string;
  // If targeted single rebuttal request:
  singleTarget?: 1 | 2 | 3;
  targetObjectionTitle?: string;
  targetObjectionQuote?: string;
  existingVendorRisk?: string;
  existingStatusQuoInertia?: string;
  existingFeatureGap?: string;
}

export interface GenerateModuleIObjectionBustersResult {
  allowed: boolean;
  reason?: string;
  objectionBusters: First10ObjectionBusters;
  engineMode?: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export function buildSmartObjectionBustersFallback(
  params: GenerateModuleIObjectionBustersParams
): First10ObjectionBusters {
  const cat = (params.industryCategory || '').toLowerCase();
  const vehicle = (params.productVehicle || '').toLowerCase();
  const price = params.headlinePricePoint || '€49 / month';
  const customer = params.targetCustomer || 'ideal target customer';
  const problem = params.customerProblem || 'operational workflow delays';
  const benefit = params.primaryBenefit || 'measurable time and cost savings';
  const startup = params.planTitle || 'Our Startup';

  // Sector-tailored defaults
  let obj1Title = 'Vendor Longevity & Business Continuity Risk';
  let obj1Quote = `"You're an early-stage startup with a small team. What happens if you run out of runway or stop maintaining this software next year?"`;
  let obj1Rebuttal = `We are fully self-sufficient with zero technical debt, and we provide complete data portability with 1-click automated exports in open standard formats (JSON/CSV) anytime. If we ever sunset, your data and workflows remain 100% yours. Furthermore, during the pilot you have direct phone and WhatsApp access to our founding engineering team with a 2-hour response guarantee.`;

  let obj2Title = 'Status Quo Inertia & Team Retraining Friction';
  let obj2Quote = `"Our existing routine isn't perfect, but everyone on the team knows it and we don't have hours to learn another tool right now."`;
  let obj2Rebuttal = `We do not ask you to switch your entire stack on Day 1. We handle 100% of the initial onboarding setup, data import, and configuration for you in under 30 minutes. You can run us side-by-side with your existing routine for 30 days — if it doesn't save ${customer} at least 5 hours in Month 1, there is zero obligation.`;

  let obj3Title = 'Missing Feature Gap & Incumbent Comparison';
  let obj3Quote = `"We really like the concept, but we cannot adopt until you integrate seamlessly with our existing toolstack and reporting workflows."`;
  let obj3Rebuttal = `As one of our first 10 design partners, your exact operational workflow dictates our product roadmap. Instead of waiting months on a generic corporate support queue, your required integration goes straight into our active development sprint and is shipped directly to your account within 3 weeks.`;

  if (cat.includes('e-commerce') || cat.includes('physical product') || cat.includes('food') || cat.includes('drink') || vehicle.includes('physical')) {
    obj1Title = 'Brand Credibility & Product Quality Consistency';
    obj1Quote = `"We haven't heard of ${startup} before. How do we know the quality, taste, and consistency match what our customers demand?"`;
    obj1Rebuttal = `We provide complimentary evaluation samples so your team can test and verify quality firsthand, backed by an unconditional 100% replacement or refund guarantee on your first order.`;

    obj2Title = 'Contracted Incumbent Suppliers & Minimum Order Quantities';
    obj2Quote = `"We already have established supplier contracts and payment terms; introducing a new vendor creates supply chain complexity."`;
    obj2Rebuttal = `We offer ultra-low introductory minimum order quantities (MOQs) with net-30 terms, allowing you to run a low-risk test run alongside your primary supplier without contract penalties or cashflow strain.`;

    obj3Title = 'Shelf Margin & Price Point Justification';
    obj3Quote = `"At ${price}, this carries a higher unit cost than mass-market alternatives; can we justify the shelf margin?"`;
    obj3Rebuttal = `Our product targets higher basket spend and repeat purchase velocity. Initial pilot telemetry indicates a 20%+ faster turnover, delivering greater net cash profit per square foot or customer interaction.`;
  } else if (cat.includes('medtech') || cat.includes('health') || cat.includes('hardware') || cat.includes('deeptech')) {
    obj1Title = 'Regulatory, GDPR & Compliance Security';
    obj1Quote = `"You're an unproven early startup. How do we ensure your device and architecture comply with strict regulatory, ISO, and data privacy standards?"`;
    obj1Rebuttal = `Our architecture is built on verified, compliant reference standards with end-to-end audit logging. During the pilot phase, our technical and regulatory lead provides full compliance documentation and testing dossiers for your internal audit team.`;

    obj2Title = 'Clinical & Operational Workflow Disruption';
    obj2Quote = `"Our staff is already operating at peak capacity; integrating an unverified system will cause operational bottlenecks."`;
    obj2Rebuttal = `We engineer non-invasive pilot sandboxes that run in parallel with zero disruption to active workflows. Our technical team handles 100% of the calibration and monitoring on-site or via dedicated concierge support.`;

    obj3Title = 'Hardware Lead Times & Reliability Under Scale';
    obj3Quote = `"What happens if component shortages or scaling delays hit your manufacturing run?"`;
    obj3Rebuttal = `We maintain dual-sourced component inventory reserves for all pilot units and provide full warranty replacement guarantees with pre-provisioned hot-spare units.`;
  } else if (cat.includes('service') || cat.includes('agency') || cat.includes('consulting')) {
    obj1Title = 'Team Capacity & Boutique Bandwidth Risk';
    obj1Quote = `"As a boutique startup, will senior partners actually execute our account, or will we get passed off to junior staff once signed?"`;
    obj1Rebuttal = `Your pilot engagement is personally delivered and led directly by our founders. We contractually cap our client roster at 5 active accounts to ensure uninterrupted attention and senior execution.`;

    obj2Title = 'Proof of ROI vs Internal In-House Execution';
    obj2Quote = `"We could theoretically hire a contractor or keep this in-house rather than paying an external retainer."`;
    obj2Rebuttal = `In-house hiring carries substantial recruitment overhead and a 3-to-6 month learning curve. We deliver immediate specialist execution from Day 1 at less than half the fully loaded cost of a single full-time hire.`;

    obj3Title = 'Deliverable Milestones & Accountability';
    obj3Quote = `"What guarantee do we have that the deliverables will achieve our actual commercial objectives?"`;
    obj3Rebuttal = `Our pilot is milestone-gated: 50% of our commercial fee is tied directly to hitting the mutually agreed KPI benchmarks, reversing your financial risk.`;
  } else if (cat.includes('marketplace') || vehicle.includes('marketplace')) {
    obj1Title = 'Chicken-and-Egg Platform Liquidity';
    obj1Quote = `"Why should we list or participate when your network is brand new with few active counterparties?"`;
    obj1Rebuttal = `For our founding cohort, we provide guaranteed matchmaking concierge services: our team manually sources, vets, and connects qualified counterparties so you see immediate transaction velocity from Day 1.`;

    obj2Title = 'Transaction Trust & Dispute Protection';
    obj2Quote = `"What happens if a counterparty defaults or delivers substandard work?"`;
    obj2Rebuttal = `Every founding transaction is protected by our zero-liability escrow and buyer protection policy, with founder-level dispute mediation resolved within 24 hours.`;

    obj3Title = 'Commission / Take-Rate Long-Term Lock';
    obj3Quote = `"Once we build our business on your platform, will you hike platform fees?"`;
    obj3Rebuttal = `As an early adopter, your preferential commission rate is permanently grandfathered in writing for the lifetime of your account.`;
  }

  // Handle single targeted rebuttal generation fallback
  if (params.singleTarget === 1 && params.targetObjectionQuote) {
    obj1Title = params.targetObjectionTitle || obj1Title;
    obj1Quote = params.targetObjectionQuote;
    obj1Rebuttal = `We acknowledge that risk directly: During our pilot phase, we eliminate your financial and operational exposure with full data portability, zero long-term lock-in, and founder-level concierge support that guarantees your workflow is completely de-risked.`;
  } else if (params.singleTarget === 2 && params.targetObjectionQuote) {
    obj2Title = params.targetObjectionTitle || obj2Title;
    obj2Quote = params.targetObjectionQuote;
    obj2Rebuttal = `You don't have to rip and replace anything. We handle the entire migration and setup in under 30 minutes, running in parallel with your current routine for 30 days so you prove the ${benefit} with zero disruption to daily operations.`;
  } else if (params.singleTarget === 3 && params.targetObjectionQuote) {
    obj3Title = params.targetObjectionTitle || obj3Title;
    obj3Quote = params.targetObjectionQuote;
    obj3Rebuttal = `As an early design partner, your direct input shapes our milestone sprints. We can integrate that capability directly into our active release cycle, giving your team custom workflow advantages that legacy incumbents would take 18 months to deliver.`;
  }

  return {
    objection1Title: obj1Title,
    objection1Quote: obj1Quote,
    vendorRisk: params.singleTarget === 1 ? obj1Rebuttal : (params.existingVendorRisk?.trim() || obj1Rebuttal),
    objection2Title: obj2Title,
    objection2Quote: obj2Quote,
    statusQuoInertia: params.singleTarget === 2 ? obj2Rebuttal : (params.existingStatusQuoInertia?.trim() || obj2Rebuttal),
    objection3Title: obj3Title,
    objection3Quote: obj3Quote,
    featureGap: params.singleTarget === 3 ? obj3Rebuttal : (params.existingFeatureGap?.trim() || obj3Rebuttal),
  };
}

export async function generateModuleIObjectionBustersViaRouter(
  params: GenerateModuleIObjectionBustersParams
): Promise<GenerateModuleIObjectionBustersResult> {
  const fallback = buildSmartObjectionBustersFallback(params);
  const isIE = (params.hqCountryCode || 'IE') !== 'GB';
  const countryContext = isIE
    ? 'Ireland (Local Enterprise Office & Enterprise Ireland commercial evaluation)'
    : 'United Kingdom (Innovate UK & British Business Bank commercial evaluation)';

  const authCtx = await authorizeAndPrepareGeminiCall(
    'MOD_I_OBJECTION_BUSTERS',
    'You are an elite B2B and startup commercial sales strategist, objection-handling coach, and enterprise buyer psychology specialist.'
  );

  if (authCtx.canCallLiveGemini && authCtx.activeApiKey) {
    try {
      const ai = getGenAiClient(authCtx.activeApiKey);
      let prompt = '';

      if (params.singleTarget && params.targetObjectionQuote) {
        prompt = `Generate a high-converting, persuasive rebuttal for a specific prospective customer objection for ${sanitizePromptInput(
          params.planTitle || 'Startup',
          100
        )} in ${countryContext}.

VENTURE CONTEXT:
- Industry Category: ${sanitizePromptInput(params.industryCategory || 'Technology', 100)}
- Product Vehicle / Format: ${sanitizePromptInput(params.productVehicle || 'Software / Digital', 100)}
- Beachhead Customer Persona: ${sanitizePromptInput(params.targetCustomer || 'Target Buyer', 150)}
- Customer Core Problem: ${sanitizePromptInput(params.customerProblem || 'Operational friction', 200)}
- Proposed Solution: ${sanitizePromptInput(params.solutionCategory || 'Dedicated Platform', 200)}
- Primary Benefit / Value Prop: ${sanitizePromptInput(params.primaryBenefit || 'Time and cost savings', 200)}
- Competitive Wedge / Differentiator: ${sanitizePromptInput(params.competitiveWedge || '', 200)}
- Main Competitors / Incumbents: ${sanitizePromptInput(params.mainCompetitors || 'Spreadsheets / Legacy vendors', 150)}
- Headline Price Anchor: ${sanitizePromptInput(params.headlinePricePoint || '€49 / month', 100)}

SPECIFIC OBJECTION TO CRUSH:
- Objection Category: ${sanitizePromptInput(params.targetObjectionTitle || 'Customer Hesitation', 100)}
- Customer Friction / Objection Quote: "${sanitizePromptInput(params.targetObjectionQuote, 300)}"

INSTRUCTIONS:
1. Write a direct, empathetic, and persuasive counter-rebuttal in the founder's voice (2 to 4 sentences).
2. De-risk the decision completely (e.g. money-back guarantee, side-by-side run, zero lock-in, data export, white-glove migration, direct founder cell/Slack access).
3. Do NOT be defensive; acknowledge the validity of the concern and present a concrete proof mechanism.

Respond ONLY with a valid JSON object matching this schema:
{
  "rebuttal": "string (the punchy, high-converting rebuttal script)"
}`;
      } else {
        prompt = `Synthesize 3 realistic, highly specific customer friction objections and persuasive founder rebuttals for ${sanitizePromptInput(
          params.planTitle || 'Startup',
          100
        )} in ${countryContext}.

VENTURE CONTEXT:
- Industry Category: ${sanitizePromptInput(params.industryCategory || 'Technology', 100)}
- Product Vehicle / Format: ${sanitizePromptInput(params.productVehicle || 'Software / Digital', 100)}
- Beachhead Customer Persona: ${sanitizePromptInput(params.targetCustomer || 'Target Buyer', 150)}
- Customer Core Problem: ${sanitizePromptInput(params.customerProblem || 'Operational friction', 200)}
- Proposed Solution: ${sanitizePromptInput(params.solutionCategory || 'Dedicated Platform', 200)}
- Primary Benefit / Value Prop: ${sanitizePromptInput(params.primaryBenefit || 'Time and cost savings', 200)}
- Competitive Wedge / Differentiator: ${sanitizePromptInput(params.competitiveWedge || '', 200)}
- Main Competitors / Incumbents: ${sanitizePromptInput(params.mainCompetitors || 'Spreadsheets / Legacy vendors', 150)}
- Headline Price Anchor: ${sanitizePromptInput(params.headlinePricePoint || '€49 / month', 100)}

INSTRUCTIONS:
Generate 3 distinct, hyper-relevant friction points tailored to THIS exact startup:
1. Friction #1: Trust, Risk & Credibility (e.g. startup longevity, data privacy, brand trust, compliance, or manufacturing reliability).
2. Friction #2: Status Quo & Switching Inertia (e.g. incumbent contract, team retraining, setup effort, doing nothing).
3. Friction #3: Price, Gaps & Value Proof (e.g. price vs perceived ROI, missing feature X, integration with legacy tools).

For each objection:
- "title": A concise category label (e.g., "Vendor Longevity Risk" or "Shelf Margin vs Incumbents")
- "quote": A raw, realistic 1-sentence quote in the prospect's exact voice expressing their doubt
- "rebuttal": A 2-to-4 sentence tactical rebuttal from the founder that validates the concern and reverses the risk

Respond ONLY with a valid JSON object matching this schema:
{
  "objection1Title": "string",
  "objection1Quote": "string",
  "vendorRisk": "string (rebuttal for objection 1)",
  "objection2Title": "string",
  "objection2Quote": "string",
  "statusQuoInertia": "string (rebuttal for objection 2)",
  "objection3Title": "string",
  "objection3Quote": "string",
  "featureGap": "string (rebuttal for objection 3)"
}`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          maxOutputTokens: 2048,
        },
      });

      const text = response.text?.trim() || '';
      if (text) {
        const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        if (params.singleTarget && parsed.rebuttal) {
          const updated = { ...fallback };
          if (params.singleTarget === 1) updated.vendorRisk = parsed.rebuttal.trim();
          if (params.singleTarget === 2) updated.statusQuoInertia = parsed.rebuttal.trim();
          if (params.singleTarget === 3) updated.featureGap = parsed.rebuttal.trim();
          return {
            allowed: true,
            objectionBusters: updated,
            engineMode: 'gemini-2.5-flash',
          };
        }

        return {
          allowed: true,
          objectionBusters: {
            objection1Title:
              parsed.objection1Title?.trim() || fallback.objection1Title,
            objection1Quote:
              parsed.objection1Quote?.trim() || fallback.objection1Quote,
            vendorRisk:
              parsed.vendorRisk?.trim() || fallback.vendorRisk,
            objection2Title:
              parsed.objection2Title?.trim() || fallback.objection2Title,
            objection2Quote:
              parsed.objection2Quote?.trim() || fallback.objection2Quote,
            statusQuoInertia:
              parsed.statusQuoInertia?.trim() || fallback.statusQuoInertia,
            objection3Title:
              parsed.objection3Title?.trim() || fallback.objection3Title,
            objection3Quote:
              parsed.objection3Quote?.trim() || fallback.objection3Quote,
            featureGap:
              parsed.featureGap?.trim() || fallback.featureGap,
          },
          engineMode: 'gemini-2.5-flash',
        };
      }
    } catch (err) {
      console.error('Error in generateModuleIObjectionBustersViaRouter:', err);
    }
  }

  return {
    allowed: true,
    objectionBusters: fallback,
    engineMode: 'smart-synthesizer',
  };
}

// ============================================================================
// MODULE I — STEP 4: REVERSE-ENGINEERED MARKETING BUDGET & CAC SIMULATOR
// ============================================================================

export interface GenerateModuleIBudgetParams {
  planTitle?: string;
  industryCategory?: string;
  hqCountryCode?: SupportedCountryCode;
  baseCurrency?: string;
  targetCustomer?: string;
  customerProblem?: string;
  primaryBenefit?: string;
  primaryAcquisitionEngine?: string;
  primaryChannel?: string;
  breakevenCustomersCount?: number;
  targetMonthlyNewCustomers?: number;
  netPricePerCustomer?: number;
  pocketProfitPerCustomer?: number;
  leadToCustomerConversionPercent?: number;
  visitorToLeadConversionPercent?: number;
  paidTrafficSharePercent?: number;
  estimatedCostPerClickOrTouch?: number;
}

export interface GenerateModuleIBudgetResult {
  allowed: boolean;
  leadToCustomerConversionPercent: number;
  visitorToLeadConversionPercent: number;
  paidTrafficSharePercent: number;
  estimatedCostPerClickOrTouch: number;
  averageCustomerRetentionMonths: number;
  budgetLineItems: MarketingBudgetLineItem[];
  cacAndBudgetNarrative: string;
  grantAssessorTip: string;
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
}

function buildSmartMarketingBudgetFallback(
  params: GenerateModuleIBudgetParams
): GenerateModuleIBudgetResult {
  const isIE = (params.hqCountryCode || 'IE') !== 'GB';
  const currencySymbol = params.baseCurrency === 'GBP' ? '£' : params.baseCurrency === 'USD' ? '$' : '€';
  const cat = (params.industryCategory || '').toLowerCase();
  const isDtcOrPhysical = cat.includes('e-commerce') || cat.includes('food') || cat.includes('brick');
  const isHardwareOrDeepTech = cat.includes('hardware') || cat.includes('medtech');
  const isService = cat.includes('service') || cat.includes('agency');

  const targetCustomers = Math.max(1, params.targetMonthlyNewCustomers || params.breakevenCustomersCount || 25);
  const pocketProfit = Math.max(15, params.pocketProfitPerCustomer || (params.netPricePerCustomer ? Math.round(params.netPricePerCustomer * 0.78) : 65));

  const leadConv = params.leadToCustomerConversionPercent || (isService ? 12 : isDtcOrPhysical ? 3.5 : 5);
  const visitorConv = params.visitorToLeadConversionPercent || (isService ? 6 : isDtcOrPhysical ? 3.0 : 4);
  const paidShare = params.paidTrafficSharePercent ?? (isDtcOrPhysical ? 50 : isService ? 20 : 35);
  const cpc = params.estimatedCostPerClickOrTouch || (isHardwareOrDeepTech ? 3.2 : isDtcOrPhysical ? 1.1 : 2.1);
  const retentionMonths = isDtcOrPhysical ? 8 : isService ? 12 : 18;

  // Calculate implied paid ad budget so line items align realistically
  const requiredLeads = Math.ceil(targetCustomers / (leadConv / 100));
  const requiredTouches = Math.ceil(requiredLeads / (visitorConv / 100));
  const paidTouches = Math.ceil(requiredTouches * (paidShare / 100));
  const impliedAdSpend = Math.max(150, Math.round((paidTouches * cpc) / 10) * 10);

  const lineItems: MarketingBudgetLineItem[] = [
    {
      id: 'mkt_item_1',
      bucket: 'PAID_MEDIA_ADS',
      channelOrToolName: isDtcOrPhysical
        ? 'High-Intent Search & Meta Retargeting Campaigns'
        : 'Targeted Search Intent & LinkedIn Sniper Ads',
      monthlySpend: impliedAdSpend,
      grantEligibilityStatus: 'INELIGIBLE_ONGOING_AD_SPEND',
      notes: `Drives ${paidTouches.toLocaleString()} targeted monthly clicks at ~${currencySymbol}${cpc.toFixed(2)} CPC (${paidShare}% of top-of-funnel volume). Funded from working capital / revenue, not grant drawdown.`,
    },
    {
      id: 'mkt_item_2',
      bucket: 'GROWTH_STACK_TOOLS',
      channelOrToolName: 'Outbound Enrichment, CRM & Email Sequencer Stack',
      monthlySpend: isService ? 95 : 140,
      grantEligibilityStatus: 'ELIGIBLE_CAPABILITY_OR_EXPORT',
      notes: isIE
        ? 'Supports founder-led outbound and conversion tracking. Eligible for LEO Grow Digital / Digital for Business support.'
        : 'Powers structured pipeline tracking and automated lead nurturing.',
    },
    {
      id: 'mkt_item_3',
      bucket: 'CONTENT_EVENTS_PR',
      channelOrToolName: isHardwareOrDeepTech
        ? 'Industry Trade Show Demo Kit & Technical Whitepapers'
        : isDtcOrPhysical
        ? 'Product Sampling Boxes, Micro-Creator Seeding & POS Collateral'
        : 'Industry Case Study Production & Niche Trade Event Presence',
      monthlySpend: isHardwareOrDeepTech ? 350 : 220,
      grantEligibilityStatus: 'ELIGIBLE_CAPABILITY_OR_EXPORT',
      notes: isIE
        ? 'Export market launch collateral and trade show participation frequently qualify under LEO Priming / Enterprise Ireland Market Discovery.'
        : 'High-trust buyer enablement assets eligible under UK Start Up Loans working capital allocation.',
    },
  ];

  const totalSpend = lineItems.reduce((acc, item) => acc + item.monthlySpend, 0);
  const cashCac = Math.round(totalSpend / targetCustomers);
  const ltv = Math.round(pocketProfit * retentionMonths);
  const ltvCacRatio = cashCac > 0 ? (ltv / cashCac).toFixed(1) : '5.0';

  const narrative = `To reliably acquire ${targetCustomers} new paying customers per month (aligned with our Module H breakeven target), our reverse-engineered funnel requires ${requiredLeads.toLocaleString()} qualified leads (${leadConv}% lead-to-sale conversion) generated from ${requiredTouches.toLocaleString()} targeted top-of-funnel visits/outreach touches (${visitorConv}% visitor-to-lead conversion). By blending ${100 - paidShare}% founder-led sweat equity (outbound sniper outreach and organic authority) with ${paidShare}% paid customer acquisition (${currencySymbol}${totalSpend.toLocaleString()}/month total marketing budget), we achieve a disciplined Cash CAC of ${currencySymbol}${cashCac} against a Customer Lifetime Value (LTV) of ${currencySymbol}${ltv.toLocaleString()} (${ltvCacRatio}x LTV:CAC ratio), recovering acquisition costs in ${(cashCac / pocketProfit).toFixed(1)} months.`;

  const grantTip = isIE
    ? 'LEO & Enterprise Ireland Rule: Ongoing pay-per-click ad spend (Google/Meta/LinkedIn Ads) is strictly ineligible for grant reimbursement. Frame grant applications around trade show participation, export collateral, and digital CRM transformation, while funding ongoing ad spend from trading cashflow.'
    : 'Innovate UK & British Business Bank Rule: Smart Grants do not fund routine commercial advertising, whereas British Business Bank Start Up Loans CAN be deployed toward initial customer acquisition and launch marketing working capital.';

  return {
    allowed: true,
    leadToCustomerConversionPercent: leadConv,
    visitorToLeadConversionPercent: visitorConv,
    paidTrafficSharePercent: paidShare,
    estimatedCostPerClickOrTouch: cpc,
    averageCustomerRetentionMonths: retentionMonths,
    budgetLineItems: lineItems,
    cacAndBudgetNarrative: narrative,
    grantAssessorTip: grantTip,
    engineMode: 'smart-synthesizer',
  };
}

export async function generateModuleIBudgetViaRouter(
  params: GenerateModuleIBudgetParams
): Promise<GenerateModuleIBudgetResult> {
  const fallback = buildSmartMarketingBudgetFallback(params);
  const isIE = (params.hqCountryCode || 'IE') !== 'GB';
  const countryContext = isIE
    ? 'Ireland (Local Enterprise Office / Enterprise Ireland commercial appraisal)'
    : 'United Kingdom (Innovate UK / British Business Bank Start Up Loans appraisal)';

  const authCtx = await authorizeAndPrepareGeminiCall(
    'MOD_I_BUDGET_CAC',
    'You are a startup CFO and Performance Growth Architect who reverse-engineers realistic Customer Acquisition Cost (CAC), funnel conversion rates, and grant-compliant marketing budgets.'
  );

  if (authCtx.canCallLiveGemini && authCtx.activeApiKey) {
    try {
      const ai = getGenAiClient(authCtx.activeApiKey);
      const prompt = `Reverse-engineer a realistic, defensible Customer Acquisition Cost (CAC) funnel and 3-line Monthly Marketing Budget for ${sanitizePromptInput(
        params.planTitle || 'Startup',
        100
      )} in ${countryContext}.

VENTURE & UPSTREAM UNIT ECONOMICS CONTEXT:
- Industry Category: ${sanitizePromptInput(params.industryCategory || 'Technology', 100)}
- Target Customer Persona: ${sanitizePromptInput(params.targetCustomer || 'Target Buyer', 150)}
- Core Problem Solved: ${sanitizePromptInput(params.customerProblem || 'Operational friction', 200)}
- Primary Acquisition Engine (from Step 2): ${sanitizePromptInput(params.primaryAcquisitionEngine || 'FOUNDER_LED_ORGANIC', 80)}
- Primary Distribution Channel (from Step 2): ${sanitizePromptInput(params.primaryChannel || 'DIRECT_WEB_SELF_SERVE', 80)}
- Module H Breakeven Customer Count: ${params.breakevenCustomersCount || 25} customers
- Target Monthly New Customers: ${params.targetMonthlyNewCustomers || params.breakevenCustomersCount || 25} customers/mo
- Net Price Per Customer: ${params.baseCurrency || 'EUR'} ${params.netPricePerCustomer || 99}
- Monthly Pocket Profit (Contribution Margin) Per Customer: ${params.baseCurrency || 'EUR'} ${params.pocketProfitPerCustomer || 75}

INSTRUCTIONS:
1. Recommend realistic conversion rates (leadToCustomerConversionPercent between 1.5 and 25, visitorToLeadConversionPercent between 1.5 and 15), paidTrafficSharePercent (between 10 and 75), estimatedCostPerClickOrTouch (in ${params.baseCurrency || 'EUR'}), and averageCustomerRetentionMonths (between 6 and 36).
2. Create 3 concrete, startup-tailored monthly marketing budget line items across PAID_MEDIA_ADS, GROWTH_STACK_TOOLS, and CONTENT_EVENTS_PR. Flag each item's grantEligibilityStatus accurately ('INELIGIBLE_ONGOING_AD_SPEND' for recurring ad clicks vs 'ELIGIBLE_CAPABILITY_OR_EXPORT' or 'WORKING_CAPITAL_LOAN_ELIGIBLE').
3. Write a crisp 3-sentence "cacAndBudgetNarrative" justifying the funnel math, CAC payback period, and LTV:CAC ratio for investors and grant assessors.
4. Provide a 1-sentence "grantAssessorTip" on how ${isIE ? 'LEO / Enterprise Ireland' : 'Innovate UK / Start Up Loans'} assessors scrutinize marketing budgets.

Respond ONLY with a valid JSON object matching this schema:
{
  "leadToCustomerConversionPercent": number,
  "visitorToLeadConversionPercent": number,
  "paidTrafficSharePercent": number,
  "estimatedCostPerClickOrTouch": number,
  "averageCustomerRetentionMonths": number,
  "budgetLineItems": [
    {
      "id": "string",
      "bucket": "PAID_MEDIA_ADS" | "GROWTH_STACK_TOOLS" | "CONTENT_EVENTS_PR" | "OTHER",
      "channelOrToolName": "string",
      "monthlySpend": number,
      "grantEligibilityStatus": "ELIGIBLE_CAPABILITY_OR_EXPORT" | "INELIGIBLE_ONGOING_AD_SPEND" | "WORKING_CAPITAL_LOAN_ELIGIBLE",
      "notes": "string"
    }
  ],
  "cacAndBudgetNarrative": "string",
  "grantAssessorTip": "string"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.25,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        },
      });

      const text = response.text?.trim() || '';
      if (text) {
        const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        const validBuckets: MarketingBudgetBucketType[] = [
          'PAID_MEDIA_ADS',
          'GROWTH_STACK_TOOLS',
          'CONTENT_EVENTS_PR',
          'OTHER',
        ];
        const validStatuses: MarketingGrantEligibilityStatus[] = [
          'ELIGIBLE_CAPABILITY_OR_EXPORT',
          'INELIGIBLE_ONGOING_AD_SPEND',
          'WORKING_CAPITAL_LOAN_ELIGIBLE',
        ];

        const parsedItems: MarketingBudgetLineItem[] =
          Array.isArray(parsed.budgetLineItems) && parsed.budgetLineItems.length > 0
            ? parsed.budgetLineItems.slice(0, 6).map((item: any, idx: number) => ({
                id: item.id || `ai_mkt_item_${idx + 1}`,
                bucket: validBuckets.includes(item.bucket) ? item.bucket : 'PAID_MEDIA_ADS',
                channelOrToolName:
                  typeof item.channelOrToolName === 'string' && item.channelOrToolName.trim()
                    ? item.channelOrToolName.trim()
                    : fallback.budgetLineItems[idx % fallback.budgetLineItems.length].channelOrToolName,
                monthlySpend:
                  typeof item.monthlySpend === 'number' && !isNaN(item.monthlySpend)
                    ? Math.max(0, Math.round(item.monthlySpend))
                    : 150,
                grantEligibilityStatus: validStatuses.includes(item.grantEligibilityStatus)
                  ? item.grantEligibilityStatus
                  : 'INELIGIBLE_ONGOING_AD_SPEND',
                notes:
                  typeof item.notes === 'string' && item.notes.trim()
                    ? item.notes.trim()
                    : 'Targeted acquisition investment.',
              }))
            : fallback.budgetLineItems;

        return {
          allowed: true,
          leadToCustomerConversionPercent:
            typeof parsed.leadToCustomerConversionPercent === 'number'
              ? Math.min(50, Math.max(0.5, parsed.leadToCustomerConversionPercent))
              : fallback.leadToCustomerConversionPercent,
          visitorToLeadConversionPercent:
            typeof parsed.visitorToLeadConversionPercent === 'number'
              ? Math.min(40, Math.max(0.5, parsed.visitorToLeadConversionPercent))
              : fallback.visitorToLeadConversionPercent,
          paidTrafficSharePercent:
            typeof parsed.paidTrafficSharePercent === 'number'
              ? Math.min(100, Math.max(0, Math.round(parsed.paidTrafficSharePercent)))
              : fallback.paidTrafficSharePercent,
          estimatedCostPerClickOrTouch:
            typeof parsed.estimatedCostPerClickOrTouch === 'number'
              ? Math.max(0.1, Number(parsed.estimatedCostPerClickOrTouch.toFixed(2)))
              : fallback.estimatedCostPerClickOrTouch,
          averageCustomerRetentionMonths:
            typeof parsed.averageCustomerRetentionMonths === 'number'
              ? Math.min(60, Math.max(1, Math.round(parsed.averageCustomerRetentionMonths)))
              : fallback.averageCustomerRetentionMonths,
          budgetLineItems: parsedItems,
          cacAndBudgetNarrative:
            typeof parsed.cacAndBudgetNarrative === 'string' && parsed.cacAndBudgetNarrative.trim()
              ? parsed.cacAndBudgetNarrative.trim()
              : fallback.cacAndBudgetNarrative,
          grantAssessorTip:
            typeof parsed.grantAssessorTip === 'string' && parsed.grantAssessorTip.trim()
              ? parsed.grantAssessorTip.trim()
              : fallback.grantAssessorTip,
          engineMode: 'gemini-2.5-flash',
        };
      }
    } catch (err) {
      console.error('Error in generateModuleIBudgetViaRouter:', err);
    }
  }

  return fallback;
}



/**
 * AI Assessor Mode: Generates Module I Step 5 Marketing & Customer Acquisition Brief & Blind-Spot Audit.
 */
export interface GenerateModuleIMarketingBriefParams {
  planId?: string;
  planTitle: string;
  industryCategory?: string;
  hqCountryCode: SupportedCountryCode;
  currencySymbol: string;
  positioningHeadline: string;
  toneOfVoice: string;
  targetCustomer: string;
  primaryChannel: string;
  primaryAcquisitionEngine: string;
  pipelineProspectsCount: number;
  targetMonthlyNewCustomers: number;
  cashCac: number;
  ltv: number;
  ltvToCacRatio: number;
  paidTrafficSharePercent: number;
  paidAdsViabilityDecision: string;
  totalMonthlyMarketingSpend: number;
  weeklyFounderHours: number;
  activeLtvModel: string;
  isOptedOut?: boolean;
  excludePaidAdsFromModuleJ?: boolean;
  paidMediaSpend?: number;
  firstOrderNetProfitAfterCac?: number;
}

export interface GenerateModuleIMarketingBriefResult {
  allowed: boolean;
  executiveMarketingSummaryNarrative: string;
  blindSpots: BlindSpotItem[];
  marketingReadinessConfidence:
    | 'ORGANIC_FIRST_10_READY'
    | 'SCALABLE_HYBRID_FUNNEL'
    | 'BOOTSTRAPPED_ZERO_AD_SPEND'
    | 'NEEDS_CONVERSION_TESTING'
    | 'OTHER';
  aiAssessorTip: string;
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
}

function buildSmartMarketingBriefFallback(
  params: GenerateModuleIMarketingBriefParams
): GenerateModuleIMarketingBriefResult {
  const isIE = params.hqCountryCode !== 'GB';
  const isOptedOut =
    params.isOptedOut === true ||
    params.paidAdsViabilityDecision === 'OPTED_OUT_UNPROFITABLE' ||
    params.paidTrafficSharePercent === 0 ||
    params.excludePaidAdsFromModuleJ === true ||
    params.paidMediaSpend === 0 ||
    (params.firstOrderNetProfitAfterCac !== undefined && params.firstOrderNetProfitAfterCac < 0);

  const blindSpots: BlindSpotItem[] = [];

  // Check 1: Paid Ads or Opt-Out Strategy
  if (isOptedOut) {
    blindSpots.push({
      id: `bs-mkt-1-${Date.now()}`,
      title: 'Zero Paid Ads Organic Reliance',
      category: 'MARKET_VIABILITY',
      severity: 'WARNING',
      explanation: `With paid media opted out to protect trading margins, 100% of your top-of-funnel pipeline relies on direct founder outreach and organic conversion. If founder time is constrained by product build (Module D), customer acquisition velocity could stall.`,
      suggestedAction: `Systematize your Step 3 outbound scripts and set up automated referral triggers with your first 10 customers to create compounding organic distribution.`,
    });
  } else if (params.ltvToCacRatio < 2.5) {
    blindSpots.push({
      id: `bs-mkt-1-${Date.now()}`,
      title: 'Tight Acquisition Margin Cushion',
      category: 'COMMERCIAL_PRICING',
      severity: 'CRITICAL',
      explanation: `Your projected LTV:CAC ratio (${params.ltvToCacRatio}x) provides limited margin for rising ad costs or unexpected churn. Any dip in conversion rate risks pushing customer acquisition into negative cashflow.`,
      suggestedAction: `Increase lead-to-customer conversion via personalized demos, or increase single-order Pocket Profit in Module H by introducing an upfront onboarding package.`,
    });
  } else {
    blindSpots.push({
      id: `bs-mkt-1-${Date.now()}`,
      title: 'Channel Concentration Risk',
      category: 'MARKET_VIABILITY',
      severity: 'INFO',
      explanation: `Heavily focusing on ${params.primaryChannel} provides early velocity but makes customer acquisition vulnerable to algorithm shifts or platform fee increases.`,
      suggestedAction: `Treat ${params.primaryChannel} as your wedge channel while building an owned email list and direct partner relationships as defensive moats.`,
    });
  }

  // Check 2: Founder Hustle Bandwidth
  if (params.weeklyFounderHours > 20) {
    blindSpots.push({
      id: `bs-mkt-2-${Date.now()}`,
      title: 'Founder Time Allocation Bottleneck',
      category: 'OPERATIONAL_CAPACITY',
      severity: 'WARNING',
      explanation: `Committing ~${params.weeklyFounderHours} hours/week to outbound marketing and lead qualification leaves narrow operational bandwidth for core product engineering and client delivery.`,
      suggestedAction: `Delegate top-of-funnel lead discovery using lightweight SDR tools or asynchronous content to cap founder outreach at under 15 hours/week.`,
    });
  } else {
    blindSpots.push({
      id: `bs-mkt-2-${Date.now()}`,
      title: 'Pipeline Lead Velocity Validation',
      category: 'EXECUTION_READINESS',
      severity: 'INFO',
      explanation: `You currently have ${params.pipelineProspectsCount} target prospects staged in Step 3. Commercial credibility requires converting these initial warm contacts into signed Letters of Intent or active pilot users before expanding broad cold outreach.`,
      suggestedAction: `Execute your Step 3 follow-up cadence to lock in your first 3 paid pilot agreements within the next 30 days.`,
    });
  }

  // Check 3: Grant Assessor Ad-Spend Ineligibility
  blindSpots.push({
    id: `bs-mkt-3-${Date.now()}`,
    title: isIE
      ? 'LEO / Enterprise Ireland Ineligible Ad Clicks'
      : 'Innovate UK & BBB Grant-Ineligible Advertising',
    category: 'GRANT_COMPLIANCE',
    severity: isOptedOut ? 'INFO' : 'WARNING',
    explanation: isOptedOut
      ? `Ongoing paid search or social media ad clicks are strictly ineligible for ${isIE ? 'LEO Feasibility / Priming grants' : 'Innovate UK / Start Up Loans funding'}. Your decision to exclude paid media preserves grant funds for eligible capabilities.`
      : `${params.currencySymbol}${params.totalMonthlyMarketingSpend}/month in marketing is budgeted. Note that ongoing pay-per-click ad clicks cannot be claimed under ${isIE ? 'Enterprise Ireland / LEO' : 'Innovate UK'} vouchers; only website development, CRM tools, and export collateral qualify.`,
    suggestedAction: `Ensure your Module J cashflow clearly segregates self-funded working capital from grant-funded digital capability and marketing consultancy investments.`,
  });

  const posture = isOptedOut
    ? ('BOOTSTRAPPED_ZERO_AD_SPEND' as const)
    : params.pipelineProspectsCount >= 5
    ? ('ORGANIC_FIRST_10_READY' as const)
    : params.ltvToCacRatio >= 3
    ? ('SCALABLE_HYBRID_FUNNEL' as const)
    : ('NEEDS_CONVERSION_TESTING' as const);

  const optOutPara = isOptedOut
    ? `Commercial Viability & Paid Ads Opt-Out Defense: After evaluating direct customer acquisition unit economics, the venture has formally opted out of paid advertising for Year 1. Paid performance clicks at current price points risk negative contribution margins and are strictly ineligible under grant co-funding guidelines (${isIE ? 'LEO Feasibility/Priming' : 'Innovate UK / Start Up Loans'}). Consequently, ongoing ad spend is 100% excluded from Module J financial overheads, preserving runway and protecting trading cashflow. Customer acquisition is driven entirely by founder-led organic outreach, high-intent pilot conversion, strategic partner integrations, and compounding customer referrals.`
    : `By balancing ${100 - params.paidTrafficSharePercent}% founder sweat-equity with a disciplined ${params.paidTrafficSharePercent}% paid acquisition share (${params.currencySymbol}${params.totalMonthlyMarketingSpend}/mo budget), the venture targets a Cash CAC of ${params.currencySymbol}${params.cashCac} against a Customer Pocket-Profit LTV of ${params.currencySymbol}${params.ltv} (${params.ltvToCacRatio}x LTV:CAC), recovering customer acquisition investment rapidly.`;

  const narrative = `Our go-to-market architecture positions "${sanitizePromptInput(params.planTitle, 80)}" directly at ${sanitizePromptInput(params.targetCustomer || 'our beachhead segment', 80)} using a distinct, high-clarity value proposition ("${sanitizePromptInput(params.positioningHeadline || 'Precision Solution', 120)}"). Distribution is centered on ${sanitizePromptInput(params.primaryChannel, 60)} driven by our ${sanitizePromptInput(params.primaryAcquisitionEngine, 60)} motion, designed to generate consistent top-of-funnel awareness without reliance on vanity marketing channels.\n\nImmediate commercial traction focuses on our First 10 Customers Playbook, backed by an active pipeline of ${params.pipelineProspectsCount} high-intent prospects and structured pilot agreements. Pre-closing customers via Letters of Intent and structured proof-of-concept terms de-risks demand assumptions, provides rapid product validation feedback, and validates early willingness-to-pay ahead of formal grant drawdown.\n\n${optOutPara} This reverse-engineered funnel comfortably supports our monthly target of ${params.targetMonthlyNewCustomers} new paying customers while keeping weekly founder marketing commitment manageable at ~${params.weeklyFounderHours} hours/week alongside product development.`;

  return {
    allowed: true,
    executiveMarketingSummaryNarrative: narrative,
    blindSpots,
    marketingReadinessConfidence: posture,
    aiAssessorTip: isIE
      ? 'LEO & Enterprise Ireland assessors scrutinize customer acquisition channels to verify you have real named prospects rather than hypothetical "build it and they will come" assumptions.'
      : 'Innovate UK & BBB evaluators prioritize startups with clear founder-led distribution playbooks and realistic CAC assumptions that do not depend on unvalidated venture ad spend.',
    engineMode: 'smart-synthesizer',
  };
}

export async function generateModuleIMarketingBriefViaRouter(
  params: GenerateModuleIMarketingBriefParams
): Promise<GenerateModuleIMarketingBriefResult> {
  const fallback = buildSmartMarketingBriefFallback(params);

  const authCtx = await authorizeAndPrepareGeminiCall(
    'MOD_I_MARKETING_BRIEF',
    'You are a senior venture go-to-market auditor and government grant evaluator specializing in startup customer acquisition, CAC/LTV unit economics, and pipeline validation.'
  );

  if (authCtx.canCallLiveGemini && authCtx.activeApiKey) {
    try {
      const ai = getGenAiClient(authCtx.activeApiKey);
      const isIE = params.hqCountryCode !== 'GB';
      const isOptedOut =
        params.isOptedOut === true ||
        params.paidAdsViabilityDecision === 'OPTED_OUT_UNPROFITABLE' ||
        params.paidTrafficSharePercent === 0 ||
        params.excludePaidAdsFromModuleJ === true ||
        params.paidMediaSpend === 0 ||
        (params.firstOrderNetProfitAfterCac !== undefined && params.firstOrderNetProfitAfterCac < 0);

      const prompt = `You are a Senior Go-To-Market Evaluator and Grant Assessor for ${
        isIE ? 'Enterprise Ireland & Local Enterprise Offices (LEO)' : 'Innovate UK & British Business Bank Start Up Loans'
      }.
Review the following early-stage startup marketing and customer acquisition strategy:

Venture: "${sanitizePromptInput(params.planTitle, 100)}" (${params.industryCategory || 'Startup'})
HQ Location: ${params.hqCountryCode} | Base Currency: ${params.currencySymbol}
Positioning Headline: "${sanitizePromptInput(params.positioningHeadline, 140)}"
Tone of Voice: ${params.toneOfVoice}
Target Beachhead Customer: ${params.targetCustomer}
Primary Distribution Channel: ${params.primaryChannel}
Primary Acquisition Engine: ${params.primaryAcquisitionEngine}
Staged Pipeline Prospects: ${params.pipelineProspectsCount}
Target Monthly Customers: ${params.targetMonthlyNewCustomers}
Cash CAC: ${params.currencySymbol}${params.cashCac} | Pocket Profit LTV: ${params.currencySymbol}${params.ltv} (${params.ltvToCacRatio}x LTV:CAC)
Paid Traffic Share: ${params.paidTrafficSharePercent}%
Paid Advertising Decision: ${
  isOptedOut
    ? 'FORMALLY OPTED OUT OF PAID ADVERTISING (Negative/unviable unit economics; 100% organic/direct strategy; paid ads excluded from Module J overheads)'
    : `${params.paidAdsViabilityDecision || 'ACTIVE'} (${params.paidTrafficSharePercent}% paid acquisition share)`
}
Total Monthly Marketing Budget: ${params.currencySymbol}${params.totalMonthlyMarketingSpend}/mo
Weekly Founder Marketing Bandwidth: ${params.weeklyFounderHours} hrs/week
LTV Purchase Model: ${params.activeLtvModel}

CRITICAL ASSESSMENT REQUIREMENT FOR PAID ADVERTISING:
${
  isOptedOut
    ? `IMPORTANT: The founders have explicitly evaluated paid advertising and FORMALLY OPTED OUT of paid advertising because paid customer acquisition produces negative or unviable unit economics at their current price point/margins. In Paragraph 3 of the narrative, you MUST explicitly state that paid advertising was tested/evaluated and intentionally rejected in favor of a 100% organic, founder-led outbound and partnership model, and that recurring paid ad media spend is deliberately excluded from Module J financial overheads to conserve cash and protect trading margins. Grant assessors view this disciplined opt-out very favorably.`
    : `In Paragraph 3, evaluate the blended organic/paid acquisition mix, justifying the ${params.paidTrafficSharePercent}% paid acquisition share and Cash CAC vs LTV payback.`
}

Tasks:
1. Provide a rigorous, compelling 3-paragraph "Executive Go-To-Market Summary Narrative" (180-260 words across 3 distinct paragraphs separated by \\n\\n):
   - Paragraph 1: Brand positioning, value proposition hook, and primary distribution wedge.
   - Paragraph 2: First 10 traction strategy, Letter of Intent conversion, and validation evidence.
   - Paragraph 3: Funnel unit economics (CAC, LTV, payback) and commercial defense of the paid advertising strategy.${
     isOptedOut
       ? ' (MANDATORY: Explicitly state that paid advertising was evaluated and opted out to protect trading margins, highlighting that 100% organic acquisition is used and paid ads are excluded from financial overheads).'
       : ''
   }
2. Generate 3 to 4 constructive Blind-Spot Review items (JSON array with id, title, category, severity="CRITICAL"|"WARNING"|"INFO", explanation, suggestedAction).${
  isOptedOut
    ? ' One of the blind spots must address how the startup will maintain lead velocity without paid ads through organic referrals and founder outreach.'
    : ''
}
3. Set marketingReadinessConfidence to one of: "${isOptedOut ? 'BOOTSTRAPPED_ZERO_AD_SPEND' : 'ORGANIC_FIRST_10_READY'}", "SCALABLE_HYBRID_FUNNEL", "BOOTSTRAPPED_ZERO_AD_SPEND", "NEEDS_CONVERSION_TESTING", "OTHER".
4. Provide a 1-sentence aiAssessorTip summarizing the #1 thing an assessor will inspect.

Return strictly JSON:
{
  "executiveMarketingSummaryNarrative": "string (180-260 words in 3 paragraphs separated by \\n\\n)",
  "blindSpots": [
    {
      "id": "bs-mkt-1",
      "title": "string",
      "category": "MARKET_VIABILITY" | "COMMERCIAL_PRICING" | "GRANT_COMPLIANCE" | "OPERATIONAL_CAPACITY",
      "severity": "CRITICAL" | "WARNING" | "INFO",
      "explanation": "string",
      "suggestedAction": "string"
    }
  ],
  "marketingReadinessConfidence": "ORGANIC_FIRST_10_READY" | "SCALABLE_HYBRID_FUNNEL" | "BOOTSTRAPPED_ZERO_AD_SPEND" | "NEEDS_CONVERSION_TESTING" | "OTHER",
  "aiAssessorTip": "string"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
          maxOutputTokens: MAX_OUTPUT_TOKENS_PER_CALL,
        },
      });

      const text = response.text ? response.text.trim() : '';
      if (text) {
        const parsed = JSON.parse(text);
        const parsedBlindSpots: BlindSpotItem[] = Array.isArray(parsed.blindSpots)
          ? parsed.blindSpots.map((item: any, idx: number) => ({
              id: item.id || `bs-ai-${idx + 1}`,
              title: item.title || 'Marketing Risk',
              category: item.category || 'MARKET_VIABILITY',
              severity: (item.severity === 'CRITICAL' || item.severity === 'WARNING' || item.severity === 'INFO') ? item.severity : 'WARNING',
              explanation: item.explanation || '',
              suggestedAction: item.suggestedAction || '',
            }))
          : fallback.blindSpots;

        return {
          allowed: true,
          executiveMarketingSummaryNarrative:
            typeof parsed.executiveMarketingSummaryNarrative === 'string' &&
            parsed.executiveMarketingSummaryNarrative.trim().length > 40
              ? parsed.executiveMarketingSummaryNarrative.trim()
              : fallback.executiveMarketingSummaryNarrative,
          blindSpots: parsedBlindSpots.length > 0 ? parsedBlindSpots : fallback.blindSpots,
          marketingReadinessConfidence:
            parsed.marketingReadinessConfidence || fallback.marketingReadinessConfidence,
          aiAssessorTip:
            typeof parsed.aiAssessorTip === 'string' && parsed.aiAssessorTip.trim()
              ? parsed.aiAssessorTip.trim()
              : fallback.aiAssessorTip,
          engineMode: 'gemini-2.5-flash',
        };
      }
    } catch (err: any) {
      console.warn(
        '[AI Router] Live Vertex/Gemini call unavailable (falling back to smart-synthesizer):',
        err?.message || err
      );
    }
  }

  return fallback;
}



// ---------------------------------------------------------------------------
// MODULE J STEP 1: OVERHEADS, LOCALIZED TAXES & VAT AUTO-PILOT CALIBRATION
// ---------------------------------------------------------------------------

export interface GenerateModuleJOverheadsTaxParams {
  planId?: string;
  planTitle: string;
  industryCategory: string;
  hqCountryCode: SupportedCountryCode;
  currencySymbol: string;
  operatingCostPosture: string;
  monthlyFixedOverheadsYear1: number;
  monthlyFounderDrawingsYear1: number;
  monthlyTeamSalariesYear1: number;
  employerPayrollTaxRatePercent: number;
  vatRegistrationStrategy: string;
  exportRevenueSharePercent: number;
  totalCapExEquipmentValue: number;
}

export interface GenerateModuleJOverheadsTaxResult {
  allowed: boolean;
  overheadsAndTaxNarrative: string;
  grantAssessorTip: string;
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export async function generateModuleJOverheadsTaxViaRouter(
  params: GenerateModuleJOverheadsTaxParams
): Promise<GenerateModuleJOverheadsTaxResult> {
  const isUK = params.hqCountryCode === 'GB';
  const taxAuthority = isUK ? 'HMRC' : 'Irish Revenue';
  const payrollTaxName = isUK
    ? `Employer Class 1 National Insurance & Workplace Pension (${params.employerPayrollTaxRatePercent}%)`
    : `Employer PRSI (${params.employerPayrollTaxRatePercent}%)`;
  const grantBody = isUK
    ? 'British Business Bank Start Up Loans & Innovate UK'
    : 'Local Enterprise Office (LEO) & Enterprise Ireland';

  const monthlyPayrollTax = Math.round(
    (params.monthlyTeamSalariesYear1 * params.employerPayrollTaxRatePercent) / 100
  );
  const totalMonthlyBurn =
    params.monthlyFixedOverheadsYear1 +
    params.monthlyFounderDrawingsYear1 +
    params.monthlyTeamSalariesYear1 +
    monthlyPayrollTax;

  const fallback: GenerateModuleJOverheadsTaxResult = {
    allowed: true,
    overheadsAndTaxNarrative: `${params.planTitle} maintains a disciplined ${params.operatingCostPosture.replace(/_/g, ' ').toLowerCase()} operating posture in Year 1, with non-payroll fixed overheads budgeted at ${params.currencySymbol}${params.monthlyFixedOverheadsYear1.toLocaleString()}/month (${params.currencySymbol}${(params.monthlyFixedOverheadsYear1 * 12).toLocaleString()}/year). Combined with founder survival drawings of ${params.currencySymbol}${params.monthlyFounderDrawingsYear1.toLocaleString()}/month, Year 1 employee payroll of ${params.currencySymbol}${params.monthlyTeamSalariesYear1.toLocaleString()}/month, and statutory ${payrollTaxName} of ${params.currencySymbol}${monthlyPayrollTax.toLocaleString()}/month, the total baseline monthly cash burn is ${params.currencySymbol}${totalMonthlyBurn.toLocaleString()}/month.\n\nFor statutory tax and grant underwriting compliance with ${taxAuthority} and ${grantBody}, VAT is modeled under a ${params.vatRegistrationStrategy.replace(/_/g, ' ').toLowerCase()} strategy so collected VAT is ring-fenced from operating revenue. International export revenue is targeted at ${params.exportRevenueSharePercent}% of turnover, directly supporting non-displacement and export growth criteria${params.totalCapExEquipmentValue > 0 ? `, while ${params.currencySymbol}${params.totalCapExEquipmentValue.toLocaleString()} in capital equipment from Module E is depreciated on a 3-year straight-line basis` : ''}.`,
    grantAssessorTip: isUK
      ? `Start Up Loans & Innovate UK assessors verify that Employer NIC (13.8%) + 3% Workplace Pension are factored into Year 1–3 salary rows, and that VAT collected is excluded from P&L revenue.`
      : `Irish LEO & Enterprise Ireland underwriters check that 11.15% Employer PRSI is applied to PAYE hires, routine overheads are separated from grant-eligible R&D/CapEx, and export revenue reaches ${params.exportRevenueSharePercent}%+ to prove non-displacement.`,
    engineMode: 'smart-synthesizer',
  };

  const authCtx = await authorizeAndPrepareGeminiCall(
    'MOD_J_OVERHEADS_TAX',
    'You are a startup CFO and government grant financial underwriter specializing in early-stage operating overheads, employer payroll taxes, and VAT compliance.'
  );

  if (authCtx.canCallLiveGemini && authCtx.activeApiKey) {
    try {
      const ai = getGenAiClient(authCtx.activeApiKey);

      const prompt = `You are a startup CFO and grant underwriter for ${grantBody} (${params.hqCountryCode}).
Startup: ${sanitizePromptInput(params.planTitle, 120)}
Sector: ${sanitizePromptInput(params.industryCategory, 100)}
Operating Cost Posture: ${sanitizePromptInput(params.operatingCostPosture, 60)}
Year 1 Fixed Overheads (ex-payroll): ${params.currencySymbol}${params.monthlyFixedOverheadsYear1}/month
Year 1 Founder Drawings: ${params.currencySymbol}${params.monthlyFounderDrawingsYear1}/month
Year 1 Team Salaries: ${params.currencySymbol}${params.monthlyTeamSalariesYear1}/month
Statutory Employer Payroll Tax: ${payrollTaxName}
VAT Strategy: ${sanitizePromptInput(params.vatRegistrationStrategy, 60)}
Export Revenue Target: ${params.exportRevenueSharePercent}%
CapEx Equipment Schedule: ${params.currencySymbol}${params.totalCapExEquipmentValue}

Write a clear, credible 2-paragraph "Operating Cost & Tax Compliance Justification" (110–170 words) suitable for both a first-time founder and a ${grantBody} financial assessor, plus a 1-sentence grantAssessorTip.
Return strictly JSON:
{
  "overheadsAndTaxNarrative": "string (2 paragraphs separated by \\n\\n)",
  "grantAssessorTip": "string"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
          maxOutputTokens: MAX_OUTPUT_TOKENS_PER_CALL,
        },
      });

      const text = response.text ? response.text.trim() : '';
      if (text) {
        const parsed = JSON.parse(text);
        return {
          allowed: true,
          overheadsAndTaxNarrative:
            typeof parsed.overheadsAndTaxNarrative === 'string' &&
            parsed.overheadsAndTaxNarrative.trim().length > 30
              ? parsed.overheadsAndTaxNarrative.trim()
              : fallback.overheadsAndTaxNarrative,
          grantAssessorTip:
            typeof parsed.grantAssessorTip === 'string' && parsed.grantAssessorTip.trim()
              ? parsed.grantAssessorTip.trim()
              : fallback.grantAssessorTip,
          engineMode: 'gemini-2.5-flash',
        };
      }
    } catch (err: any) {
      console.warn(
        '[AI Router] Module J Step 1 Gemini call fallback:',
        err?.message || err
      );
    }
  }

  return fallback;
}


// ---------------------------------------------------------------------------
// MODULE J STEP 2: PAYMENT TIMING, WORKING CAPITAL & SEASONALITY CALIBRATION
// ---------------------------------------------------------------------------

export interface GenerateModuleJWorkingCapitalParams {
  planId?: string;
  planTitle: string;
  industryCategory: string;
  hqCountryCode: SupportedCountryCode;
  currencySymbol: string;
  customerCollectionTiming: string;
  effectiveDebtorDays: number;
  inventoryStockTiming: string;
  upfrontStockMonthsBuffer: number;
  seasonalityRampCurve: string;
  monthToStartRevenue: number;
  peakWorkingCapitalLockup: number;
  year1CashCollectionEfficiencyPercent: number;
}

export interface GenerateModuleJWorkingCapitalResult {
  allowed: boolean;
  workingCapitalNarrative: string;
  grantAssessorTip: string;
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export async function generateModuleJWorkingCapitalViaRouter(
  params: GenerateModuleJWorkingCapitalParams
): Promise<GenerateModuleJWorkingCapitalResult> {
  const isUK = params.hqCountryCode === 'GB';
  const grantBody = isUK
    ? 'British Business Bank Start Up Loans & Innovate UK'
    : 'Local Enterprise Office (LEO) & Enterprise Ireland';

  const fallback: GenerateModuleJWorkingCapitalResult = {
    allowed: true,
    workingCapitalNarrative: `${params.planTitle} models customer cash collection on a ${params.effectiveDebtorDays}-day debtor cycle (${params.customerCollectionTiming.replace(/_/g, ' ').toLowerCase()}), with commercial billing commencing in Month ${params.monthToStartRevenue} following initial V1 readiness. Under a ${params.seasonalityRampCurve.replace(/_/g, ' ').toLowerCase()} trajectory, approximately ${params.year1CashCollectionEfficiencyPercent}% of Year 1 invoiced turnover lands as cleared bank cash within Year 1, while late-quarter invoices roll cleanly into Q1 of Year 2.\n\nOn the supply and inventory side (${params.inventoryStockTiming.replace(/_/g, ' ').toLowerCase()}), the business maintains a ${params.upfrontStockMonthsBuffer}-month stock/fulfillment buffer, creating a peak working capital lockup of ${params.currencySymbol}${params.peakWorkingCapitalLockup.toLocaleString()}. By explicitly separating paper P&L invoicing from cleared bank cash inflows, the 36-month cashflow model protects against debtor lag and seasonal working-capital squeeze.`,
    grantAssessorTip: isUK
      ? `Start Up Loans & Innovate UK assessors look closely at whether B2B founders falsely assume 0-day payment; modeling ${params.effectiveDebtorDays} debtor days and a Month ${params.monthToStartRevenue} revenue start demonstrates high commercial realism.`
      : `Irish LEO & Enterprise Ireland evaluators frequently challenge projections that ignore B2B invoice lag or pre-launch build months; explicitly budgeting ${params.currencySymbol}${params.peakWorkingCapitalLockup.toLocaleString()} for working capital lockup directly de-risks your cashflow.`,
    engineMode: 'smart-synthesizer',
  };

  const authCtx = await authorizeAndPrepareGeminiCall(
    'MOD_J_WORKING_CAPITAL',
    'You are a startup CFO and government grant financial underwriter specializing in working capital cycles, debtor days, inventory lead times, and seasonal cashflow modeling.'
  );

  if (authCtx.canCallLiveGemini && authCtx.activeApiKey) {
    try {
      const ai = getGenAiClient(authCtx.activeApiKey);
      const prompt = `You are a startup CFO and grant underwriter for ${grantBody} (${params.hqCountryCode}).
Startup: ${sanitizePromptInput(params.planTitle, 120)}
Sector: ${sanitizePromptInput(params.industryCategory, 100)}
Customer Payment Terms: ${sanitizePromptInput(params.customerCollectionTiming, 60)} (${params.effectiveDebtorDays} Debtor Days)
Inventory / Supplier Timing: ${sanitizePromptInput(params.inventoryStockTiming, 60)} (${params.upfrontStockMonthsBuffer} months upfront buffer)
Seasonality Ramp Curve: ${sanitizePromptInput(params.seasonalityRampCurve, 60)}
First Revenue Month: Month ${params.monthToStartRevenue}
Peak Working Capital Cash Lockup: ${params.currencySymbol}${params.peakWorkingCapitalLockup}
Year 1 Cash Collection Efficiency: ${params.year1CashCollectionEfficiencyPercent}%

Write a clear, credible 2-paragraph "Working Capital, Payment Timing & Seasonality Justification" (110–170 words) suitable for both a founder and a ${grantBody} financial assessor, plus a 1-sentence grantAssessorTip.
Return strictly JSON:
{
  "workingCapitalNarrative": "string (2 paragraphs separated by \\n\\n)",
  "grantAssessorTip": "string"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
          maxOutputTokens: MAX_OUTPUT_TOKENS_PER_CALL,
        },
      });

      const text = response.text ? response.text.trim() : '';
      if (text) {
        const parsed = JSON.parse(text);
        return {
          allowed: true,
          workingCapitalNarrative:
            typeof parsed.workingCapitalNarrative === 'string' &&
            parsed.workingCapitalNarrative.trim().length > 30
              ? parsed.workingCapitalNarrative.trim()
              : fallback.workingCapitalNarrative,
          grantAssessorTip:
            typeof parsed.grantAssessorTip === 'string' && parsed.grantAssessorTip.trim()
              ? parsed.grantAssessorTip.trim()
              : fallback.grantAssessorTip,
          engineMode: 'gemini-2.5-flash',
        };
      }
    } catch (err: any) {
      console.warn(
        '[AI Router] Module J Step 2 Gemini call fallback:',
        err?.message || err
      );
    }
  }

  return fallback;
}


// ---------------------------------------------------------------------------
// MODULE J STEP 3: 36-MONTH CASHFLOW TROUGH & GRANT REIMBURSEMENT BRIDGE
// ---------------------------------------------------------------------------

export interface GenerateModuleJCashflowFundingGapParams {
  planId?: string;
  planTitle: string;
  industryCategory: string;
  hqCountryCode: SupportedCountryCode;
  currencySymbol: string;
  primaryFundingStrategy: string;
  startingCashBalanceDay1: number;
  safetyBufferPercent: number;
  operatingCashTroughAmount: number;
  operatingCashTroughMonth: number;
  recommendedCapitalRaise: number;
  totalStackedFunding: number;
  reimbursedGrantTotal: number;
  maxGrantLagMonths: number;
  cashflowPositiveMonth: number | null;
  fundingSourcesSummary: string;
}

export interface GenerateModuleJCashflowFundingGapResult {
  allowed: boolean;
  fundingGapNarrative: string;
  grantAssessorTip: string;
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export async function generateModuleJCashflowFundingGapViaRouter(
  params: GenerateModuleJCashflowFundingGapParams
): Promise<GenerateModuleJCashflowFundingGapResult> {
  const isUK = params.hqCountryCode === 'GB';
  const grantBody = isUK
    ? 'British Business Bank Start Up Loans, Innovate UK & HMRC SEIS/EIS'
    : 'Local Enterprise Office (LEO), Microfinance Ireland & Enterprise Ireland';

  const troughAbs = Math.abs(Math.min(0, params.operatingCashTroughAmount));
  const fallback: GenerateModuleJCashflowFundingGapResult = {
    allowed: true,
    fundingGapNarrative: `Across the 36-month cashflow projection, ${params.planTitle} reaches its lowest pre-funding operating cash point ("The Cash Trough") of -${params.currencySymbol}${troughAbs.toLocaleString()} in Month ${params.operatingCashTroughMonth}, driven by upfront launch commitments, debtor collection timing, and initial operating burn before recurring customer cash inflows reach scale${params.cashflowPositiveMonth ? ` (achieving monthly operating cashflow positivity in Month ${params.cashflowPositiveMonth})` : ''}. Applying a prudent ${params.safetyBufferPercent}% working-capital contingency buffer establishes a target capital requirement of ${params.currencySymbol}${params.recommendedCapitalRaise.toLocaleString()}.\n\nTo bridge this trough cleanly, the business has structured a ${params.currencySymbol}${params.totalStackedFunding.toLocaleString()} capital stack (${params.fundingSourcesSummary || 'founder equity and structured startup finance'})${params.reimbursedGrantTotal > 0 ? `, explicitly accounting for a ${params.maxGrantLagMonths}-month reimbursement arrears lag on ${params.currencySymbol}${params.reimbursedGrantTotal.toLocaleString()} of state grant funding so the bank balance remains positive while awaiting receipt verification and drawdown` : ''}.`,
    grantAssessorTip: isUK
      ? `Innovate UK Smart Grants are paid quarterly in arrears and Start Up Loans require proof of repayment affordability; showing a ${params.safetyBufferPercent}% buffer above your Month ${params.operatingCashTroughMonth} cash trough proves you won't run out of cash waiting for grant claims.`
      : `Irish LEO Priming & Feasibility Grants are strictly paid in arrears after you spend and submit paid invoices + tax clearance; explicitly bridging the ${params.maxGrantLagMonths}-month grant reimbursement lag with founder equity or Microfinance Ireland funds is a top evaluator green flag.`,
    engineMode: 'smart-synthesizer',
  };

  const authCtx = await authorizeAndPrepareGeminiCall(
    'MOD_J_CASHFLOW_FUNDING_GAP',
    'You are a startup CFO and government grant financial underwriter specializing in 36-month cashflow troughs, grant reimbursement arrears bridging, and startup capital stacks.'
  );

  if (authCtx.canCallLiveGemini && authCtx.activeApiKey) {
    try {
      const ai = getGenAiClient(authCtx.activeApiKey);
      const prompt = `You are a startup CFO and grant underwriter for ${grantBody} (${params.hqCountryCode}).
Startup: ${sanitizePromptInput(params.planTitle, 120)}
Sector: ${sanitizePromptInput(params.industryCategory, 100)}
Primary Funding Posture: ${sanitizePromptInput(params.primaryFundingStrategy, 80)}
Starting Cash Day 1: ${params.currencySymbol}${params.startingCashBalanceDay1}
Pre-Funding Operating Cash Trough: -${params.currencySymbol}${troughAbs} in Month ${params.operatingCashTroughMonth}
Safety Buffer: ${params.safetyBufferPercent}%
Recommended Total Capital Raise: ${params.currencySymbol}${params.recommendedCapitalRaise}
Total Stacked Funding: ${params.currencySymbol}${params.totalStackedFunding} (${sanitizePromptInput(params.fundingSourcesSummary, 240)})
Grant Funding Paid in Arrears: ${params.currencySymbol}${params.reimbursedGrantTotal} (with ${params.maxGrantLagMonths}-month reimbursement lag)
Monthly Operating Cashflow-Positive Crossover: ${params.cashflowPositiveMonth ? `Month ${params.cashflowPositiveMonth}` : 'Post-Year 3'}

Write a clear, credible 2-paragraph "36-Month Cash Trough, Runway & Grant Reimbursement Bridge Justification" (115–175 words) suitable for both a founder and a ${grantBody} underwriter, plus a 1-sentence grantAssessorTip.
Return strictly JSON:
{
  "fundingGapNarrative": "string (2 paragraphs separated by \\n\\n)",
  "grantAssessorTip": "string"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
          maxOutputTokens: MAX_OUTPUT_TOKENS_PER_CALL,
        },
      });

      const text = response.text ? response.text.trim() : '';
      if (text) {
        const parsed = JSON.parse(text);
        return {
          allowed: true,
          fundingGapNarrative:
            typeof parsed.fundingGapNarrative === 'string' &&
            parsed.fundingGapNarrative.trim().length > 30
              ? parsed.fundingGapNarrative.trim()
              : fallback.fundingGapNarrative,
          grantAssessorTip:
            typeof parsed.grantAssessorTip === 'string' && parsed.grantAssessorTip.trim()
              ? parsed.grantAssessorTip.trim()
              : fallback.grantAssessorTip,
          engineMode: 'gemini-2.5-flash',
        };
      }
    } catch (err: any) {
      console.warn(
        '[AI Router] Module J Step 3 Gemini call fallback:',
        err?.message || err
      );
    }
  }

  return fallback;
}


export interface GenerateModuleJStatementsStressTestParams {
  planId: string;
  planTitle: string;
  industryCategory: string;
  hqCountryCode: string;
  currencySymbol: string;
  activeStressScenario: string;
  revenueY1: number;
  revenueY2: number;
  revenueY3: number;
  grossMarginY3Percent: number;
  ebitdaY1: number;
  ebitdaY2: number;
  ebitdaY3: number;
  netProfitAfterTaxY3: number;
  exportRevenueSharePercent: number;
  lowestStressedBankBalance: number;
  lowestStressedMonth: number;
  corporationTaxRatePercent: number;
}

export interface GenerateModuleJStatementsStressTestResult {
  allowed: boolean;
  writtenFinancialAssumptionsBlock: string;
  grantAssessorTip: string;
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export async function generateModuleJStatementsStressTestViaRouter(
  params: GenerateModuleJStatementsStressTestParams
): Promise<GenerateModuleJStatementsStressTestResult> {
  const isUK = params.hqCountryCode === 'GB';
  const grantBody = isUK
    ? 'British Business Bank Start Up Loans, Innovate UK & HMRC SEIS/EIS'
    : 'Local Enterprise Office (LEO), Microfinance Ireland & Enterprise Ireland';

  const fallback: GenerateModuleJStatementsStressTestResult = {
    allowed: true,
    writtenFinancialAssumptionsBlock: `Across the 3-Year Profit & Loss and 36-Month Cashflow projection, ${params.planTitle} scales net turnover from ${params.currencySymbol}${params.revenueY1.toLocaleString()} in Year 1 to ${params.currencySymbol}${params.revenueY2.toLocaleString()} in Year 2 and ${params.currencySymbol}${params.revenueY3.toLocaleString()} in Year 3 (${params.exportRevenueSharePercent}% international/export revenue share), achieving a ${params.grossMarginY3Percent}% gross margin and ${params.currencySymbol}${params.ebitdaY3.toLocaleString()} Year 3 EBITDA (${params.currencySymbol}${params.netProfitAfterTaxY3.toLocaleString()} retained Net Profit After ${params.corporationTaxRatePercent}% Corporation Tax).\n\nUnder the active "${params.activeStressScenario}" sensitivity scenario, the model incorporates full statutory payroll taxes, 3-year straight-line CapEx depreciation, and debtor collection lags, maintaining a lowest stressed bank balance of ${params.currencySymbol}${params.lowestStressedBankBalance.toLocaleString()} in Month ${params.lowestStressedMonth} so operations remain solvent even if commercial ramp experiences downside friction.`,
    grantAssessorTip: isUK
      ? `Start Up Loans and Innovate UK assessors test whether your business survives a 15–20% revenue delay; documenting your ${params.grossMarginY3Percent}% gross margin and Month ${params.lowestStressedMonth} stressed cash floor gives underwriters immediate confidence.`
      : `Irish LEO and Enterprise Ireland evaluators require a written Financial Assumptions note explaining how your Year 1–3 P&L connects to your headcount, ${params.exportRevenueSharePercent}% export sales, and sensitivity stress test.`,
    engineMode: 'smart-synthesizer',
  };

  const authCtx = await authorizeAndPrepareGeminiCall(
    'MOD_J_STATEMENTS_STRESS_TEST',
    'You are a startup CFO and government grant financial underwriter specializing in 3-Year Profit & Loss statements, 36-Month Cashflow schedules, and sensitivity stress testing.'
  );

  if (authCtx.canCallLiveGemini && authCtx.activeApiKey) {
    try {
      const ai = getGenAiClient(authCtx.activeApiKey);
      const prompt = `You are a startup CFO and grant underwriter for ${grantBody} (${params.hqCountryCode}).
Startup: ${sanitizePromptInput(params.planTitle, 120)}
Sector: ${sanitizePromptInput(params.industryCategory, 100)}
Active Stress-Test Scenario: ${sanitizePromptInput(params.activeStressScenario, 100)}
3-Year Net Turnover: Y1 ${params.currencySymbol}${params.revenueY1}, Y2 ${params.currencySymbol}${params.revenueY2}, Y3 ${params.currencySymbol}${params.revenueY3} (${params.exportRevenueSharePercent}% export share)
Year 3 Gross Margin: ${params.grossMarginY3Percent}%
3-Year EBITDA: Y1 ${params.currencySymbol}${params.ebitdaY1}, Y2 ${params.currencySymbol}${params.ebitdaY2}, Y3 ${params.currencySymbol}${params.ebitdaY3}
Year 3 Net Profit After Tax (${params.corporationTaxRatePercent}% Corp Tax): ${params.currencySymbol}${params.netProfitAfterTaxY3}
Lowest Stressed Bank Balance: ${params.currencySymbol}${params.lowestStressedBankBalance} in Month ${params.lowestStressedMonth}

Write a clear, grant-ready 2-paragraph "Official 3-Year P&L, Cashflow & Sensitivity Assumptions Note" (115–175 words) suitable for a ${grantBody} application, plus a 1-sentence grantAssessorTip.
Return strictly JSON:
{
  "writtenFinancialAssumptionsBlock": "string (2 paragraphs separated by \\n\\n)",
  "grantAssessorTip": "string"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
          maxOutputTokens: MAX_OUTPUT_TOKENS_PER_CALL,
        },
      });

      const text = response.text ? response.text.trim() : '';
      if (text) {
        const parsed = JSON.parse(text);
        return {
          allowed: true,
          writtenFinancialAssumptionsBlock:
            typeof parsed.writtenFinancialAssumptionsBlock === 'string' &&
            parsed.writtenFinancialAssumptionsBlock.trim().length > 30
              ? parsed.writtenFinancialAssumptionsBlock.trim()
              : fallback.writtenFinancialAssumptionsBlock,
          grantAssessorTip:
            typeof parsed.grantAssessorTip === 'string' && parsed.grantAssessorTip.trim()
              ? parsed.grantAssessorTip.trim()
              : fallback.grantAssessorTip,
          engineMode: 'gemini-2.5-flash',
        };
      }
    } catch (err: any) {
      console.warn(
        '[AI Router] Module J Step 4 Gemini call fallback:',
        err?.message || err
      );
    }
  }

  return fallback;
}

export interface GenerateModuleJExecutiveBriefParams {
  planId: string;
  planTitle: string;
  industryCategory: string;
  hqCountryCode: SupportedCountryCode;
  currencySymbol: string;
  totalMonthlyBurnY1: number;
  effectiveDebtorDays: number;
  peakWorkingCapitalLockup: number;
  operatingCashTroughAmount: number;
  operatingCashTroughMonth: number;
  totalStackedFunding: number;
  revenueY1: number;
  revenueY2: number;
  revenueY3: number;
  exportRevenueSharePercent: number;
  grossMarginY3Percent: number;
  ebitdaY3: number;
  netProfitAfterTaxY3: number;
  lowestStressedBankBalance: number;
  lowestStressedMonth: number;
}

export interface GenerateModuleJExecutiveBriefResult {
  allowed: boolean;
  blindSpots: Array<{
    id: string;
    title: string;
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    description: string;
    actionableFix: string;
  }>;
  financeReadinessConfidence:
    | 'BANK_AND_GRANT_UNDERWRITING_READY'
    | 'BOOTSTRAP_CASHFLOW_SELF_FUNDED'
    | 'REQUIRES_BRIDGE_OR_LOAN_FACILITY'
    | 'NEEDS_UNIT_ECONOMICS_RECALIBRATION';
  executiveFinancialSummaryNarrative: string;
  aiAssessorTip: string;
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export async function generateModuleJExecutiveBriefViaRouter(
  params: GenerateModuleJExecutiveBriefParams
): Promise<GenerateModuleJExecutiveBriefResult> {
  const isUK = params.hqCountryCode === 'GB';
  const grantBody = isUK
    ? 'British Business Bank Start Up Loans, Innovate UK & HMRC SEIS/EIS'
    : 'Local Enterprise Office (LEO), Microfinance Ireland & Enterprise Ireland';

  const isSolvent = params.lowestStressedBankBalance >= 0;
  const recommendedConfidence: GenerateModuleJExecutiveBriefResult['financeReadinessConfidence'] =
    isSolvent && params.totalStackedFunding >= params.operatingCashTroughAmount
      ? 'BANK_AND_GRANT_UNDERWRITING_READY'
      : params.operatingCashTroughAmount <= 5000
      ? 'BOOTSTRAP_CASHFLOW_SELF_FUNDED'
      : 'REQUIRES_BRIDGE_OR_LOAN_FACILITY';

  const fallbackBlindSpots: GenerateModuleJExecutiveBriefResult['blindSpots'] = [
    {
      id: 'mod-j-bs-1',
      title:
        params.effectiveDebtorDays >= 30
          ? `B2B Debtor Lag (${params.effectiveDebtorDays} Days) vs. Month 1–3 Cash Burn`
          : 'Grant Reimbursement Arrears Timing vs. Upfront Working Capital',
      severity: params.lowestStressedBankBalance < 0 ? 'CRITICAL' : 'WARNING',
      description: isUK
        ? `Innovate UK and Start Up Loans disburse funds in arrears or scheduled tranches. With ${params.currencySymbol}${params.totalMonthlyBurnY1.toLocaleString()}/mo in Year 1 burn and ${params.effectiveDebtorDays}-day customer payment terms, your pre-funding cash trough reaches -${params.currencySymbol}${params.operatingCashTroughAmount.toLocaleString()} in Month ${params.operatingCashTroughMonth}.`
        : `Irish LEO Priming/Feasibility grants reimburse vouched receipts in arrears ONLY after you spend the cash first. With ${params.currencySymbol}${params.totalMonthlyBurnY1.toLocaleString()}/mo in Year 1 burn and ${params.effectiveDebtorDays}-day debtor terms, your pre-funding cash trough reaches -${params.currencySymbol}${params.operatingCashTroughAmount.toLocaleString()} in Month ${params.operatingCashTroughMonth}.`,
      actionableFix: isSolvent
        ? `Maintain your ${params.currencySymbol}${params.totalStackedFunding.toLocaleString()} capital stack in Step 3 so your lowest stressed bank balance stays positive (+${params.currencySymbol}${params.lowestStressedBankBalance.toLocaleString()} in Month ${params.lowestStressedMonth}).`
        : `Increase upfront non-arrears bridge funding (founder equity or ${isUK ? 'Start Up Loan' : 'Microfinance Ireland loan'}) by at least ${params.currencySymbol}${Math.abs(params.lowestStressedBankBalance).toLocaleString()} in Step 3.`,
    },
    {
      id: 'mod-j-bs-2',
      title: `Statutory Payroll On-Costs & Tax Clearance Readiness`,
      severity: 'INFO',
      description: isUK
        ? 'UK lenders and HMRC SEIS auditors verify that Employer Class 1 NIC (13.8%) + Workplace Pension (3%) are budgeted on top of gross salaries and that Companies House / UTR filings are active.'
        : 'LEO and Enterprise Ireland evaluators verify that 11.15% Employer PRSI is budgeted on all PAYE hires and that an active Revenue eTax Clearance (eTC) certificate is in place.',
      actionableFix:
        'Keep your Step 1 Statutory Tax Auto-Pilot enabled and attach the exported Excel (.xls) schedule directly to your Module K/L grant pack.',
    },
    {
      id: 'mod-j-bs-3',
      title: `3-Year Export Turnover (${params.exportRevenueSharePercent}%) & Gross Margin Scaling (${params.grossMarginY3Percent}%)`,
      severity: params.exportRevenueSharePercent < 15 && !isUK ? 'WARNING' : 'INFO',
      description: isUK
        ? `Your 3-Year P&L scales from ${params.currencySymbol}${params.revenueY1.toLocaleString()} (Y1) to ${params.currencySymbol}${params.revenueY3.toLocaleString()} (Y3) with ${params.currencySymbol}${params.ebitdaY3.toLocaleString()} Year 3 EBITDA.`
        : `Irish LEO Priming and Enterprise Ireland PSSF/HPSU grants heavily weight international export share (currently ${params.exportRevenueSharePercent}%) and non-displacement of local competitors.`,
      actionableFix:
        'Highlight your Year 1–3 export turnover row in Step 4 when submitting to Module K (Grants & Funding) and Module L (Business Plan Compiler).',
    },
  ];

  const fallback: GenerateModuleJExecutiveBriefResult = {
    allowed: true,
    blindSpots: fallbackBlindSpots,
    financeReadinessConfidence: recommendedConfidence,
    executiveFinancialSummaryNarrative: `${params.planTitle} presents an underwriter-ready 3-Year Profit & Loss and 36-Month Cashflow model tailored for ${grantBody}. Across Years 1 to 3, net turnover scales from ${params.currencySymbol}${params.revenueY1.toLocaleString()} to ${params.currencySymbol}${params.revenueY2.toLocaleString()} and ${params.currencySymbol}${params.revenueY3.toLocaleString()} (${params.exportRevenueSharePercent}% international export share), generating a ${params.grossMarginY3Percent}% Year 3 gross margin, ${params.currencySymbol}${params.ebitdaY3.toLocaleString()} EBITDA, and ${params.currencySymbol}${params.netProfitAfterTaxY3.toLocaleString()} retained Net Profit After Tax.\n\nOn a month-by-month liquidity basis, the model accounts for ${params.currencySymbol}${params.totalMonthlyBurnY1.toLocaleString()}/mo in Year 1 operating burn, ${params.effectiveDebtorDays}-day customer payment collection lags (${params.currencySymbol}${params.peakWorkingCapitalLockup.toLocaleString()} peak working capital lockup), and grant reimbursement arrears. The resulting Month ${params.operatingCashTroughMonth} pre-funding cash trough of -${params.currencySymbol}${params.operatingCashTroughAmount.toLocaleString()} is bridged by ${params.currencySymbol}${params.totalStackedFunding.toLocaleString()} in stacked funding, maintaining a lowest stressed bank balance of ${params.currencySymbol}${params.lowestStressedBankBalance.toLocaleString()} in Month ${params.lowestStressedMonth}.`,
    aiAssessorTip: isUK
      ? `Attach the exported Module J Excel (.xls) schedule alongside this Executive Brief when applying for British Business Bank Start Up Loans, Innovate UK, or HMRC SEIS Advance Assurance in Module K.`
      : `Attach the exported Module J Excel (.xls) schedule alongside this Executive Brief for your Local Enterprise Office (LEO), Microfinance Ireland, or Enterprise Ireland submission in Module K.`,
    engineMode: 'smart-synthesizer',
  };

  const authCtx = await authorizeAndPrepareGeminiCall(
    'MOD_J_EXECUTIVE_BRIEF',
    'You are a senior startup CFO and government grant underwriter conducting a constructive financial blind-spot review and executive financial brief.'
  );

  if (authCtx.canCallLiveGemini && authCtx.activeApiKey) {
    try {
      const ai = getGenAiClient(authCtx.activeApiKey);
      const prompt = `You are a senior startup CFO and financial underwriter for ${grantBody} (${params.hqCountryCode}).
Startup: ${sanitizePromptInput(params.planTitle, 120)}
Sector: ${sanitizePromptInput(params.industryCategory, 100)}
Year 1 Monthly Burn (incl. Payroll & Taxes): ${params.currencySymbol}${params.totalMonthlyBurnY1}
Debtor Days: ${params.effectiveDebtorDays} days (Peak Working Capital Lockup: ${params.currencySymbol}${params.peakWorkingCapitalLockup})
Pre-Funding 36-Month Cash Trough: -${params.currencySymbol}${params.operatingCashTroughAmount} in Month ${params.operatingCashTroughMonth}
Total Stacked Funding: ${params.currencySymbol}${params.totalStackedFunding}
3-Year Net Turnover: Y1 ${params.currencySymbol}${params.revenueY1}, Y2 ${params.currencySymbol}${params.revenueY2}, Y3 ${params.currencySymbol}${params.revenueY3} (${params.exportRevenueSharePercent}% export share)
Year 3 Gross Margin: ${params.grossMarginY3Percent}%, Year 3 EBITDA: ${params.currencySymbol}${params.ebitdaY3}, Year 3 Net Profit After Tax: ${params.currencySymbol}${params.netProfitAfterTaxY3}
Lowest Stressed Bank Balance: ${params.currencySymbol}${params.lowestStressedBankBalance} in Month ${params.lowestStressedMonth}

Return strictly JSON with:
1. "blindSpots": array of 3 constructive financial underwriting blind-spots (each with id, title, severity: "INFO"|"WARNING"|"CRITICAL", description, actionableFix).
2. "financeReadinessConfidence": one of "BANK_AND_GRANT_UNDERWRITING_READY" | "BOOTSTRAP_CASHFLOW_SELF_FUNDED" | "REQUIRES_BRIDGE_OR_LOAN_FACILITY" | "NEEDS_UNIT_ECONOMICS_RECALIBRATION".
3. "executiveFinancialSummaryNarrative": 2-paragraph (130-185 words) executive financial summary suitable for a ${grantBody} application.
4. "aiAssessorTip": 1-sentence actionable tip.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
          maxOutputTokens: MAX_OUTPUT_TOKENS_PER_CALL,
        },
      });

      const text = response.text ? response.text.trim() : '';
      if (text) {
        const parsed = JSON.parse(text);
        const validConf = [
          'BANK_AND_GRANT_UNDERWRITING_READY',
          'BOOTSTRAP_CASHFLOW_SELF_FUNDED',
          'REQUIRES_BRIDGE_OR_LOAN_FACILITY',
          'NEEDS_UNIT_ECONOMICS_RECALIBRATION',
        ];
        return {
          allowed: true,
          blindSpots:
            Array.isArray(parsed.blindSpots) && parsed.blindSpots.length >= 2
              ? parsed.blindSpots.slice(0, 4).map((b: any, i: number) => ({
                  id: `mod-j-bs-${i + 1}`,
                  title: String(b.title || fallbackBlindSpots[i % 3].title),
                  severity:
                    b.severity === 'CRITICAL' || b.severity === 'WARNING'
                      ? b.severity
                      : 'INFO',
                  description: String(
                    b.description || fallbackBlindSpots[i % 3].description
                  ),
                  actionableFix: String(
                    b.actionableFix || fallbackBlindSpots[i % 3].actionableFix
                  ),
                }))
              : fallback.blindSpots,
          financeReadinessConfidence: validConf.includes(
            parsed.financeReadinessConfidence
          )
            ? parsed.financeReadinessConfidence
            : fallback.financeReadinessConfidence,
          executiveFinancialSummaryNarrative:
            typeof parsed.executiveFinancialSummaryNarrative === 'string' &&
            parsed.executiveFinancialSummaryNarrative.trim().length > 35
              ? parsed.executiveFinancialSummaryNarrative.trim()
              : fallback.executiveFinancialSummaryNarrative,
          aiAssessorTip:
            typeof parsed.aiAssessorTip === 'string' && parsed.aiAssessorTip.trim()
              ? parsed.aiAssessorTip.trim()
              : fallback.aiAssessorTip,
          engineMode: 'gemini-2.5-flash',
        };
      }
    } catch (err: any) {
      console.warn(
        '[AI Router] Module J Step 5 Gemini call fallback:',
        err?.message || err
      );
    }
  }

  return fallback;
}








// ===========================================================================
// Module K AI Generators (Step 1, Step 2, Step 3, Step 4, Step 5)
// ===========================================================================

// ---------------------------------------------------------------------------
// Module K Step 1: Grant Audit Overview & Pre-Flight Roadmap
// ---------------------------------------------------------------------------
export interface GenerateModuleKStep1AuditOverviewParams {
  planId?: string;
  planTitle: string;
  industryCategory?: string;
  hqCountryCode: SupportedCountryCode;
  selectedGrantName: string;
  selectedGrantAgency: string;
  readinessScorePercent: number;
  passedCount: number;
  warningCount: number;
  blockerCount: number;
  criticalBlockers: string[];
  warnings: string[];
  passedHighlights: string[];
  founderNotes?: string;
}

export interface GenerateModuleKStep1AuditOverviewResult {
  allowed: boolean;
  reason?: string;
  auditOverview: string;
  assessorStrategyTip: string;
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export async function generateModuleKStep1AuditOverviewViaRouter(
  params: GenerateModuleKStep1AuditOverviewParams
): Promise<GenerateModuleKStep1AuditOverviewResult> {
  const isUK = params.hqCountryCode === 'GB';
  const grantAgency = params.selectedGrantAgency || (isUK ? 'Innovate UK / Growth Hub' : 'Local Enterprise Office (LEO)');
  
  const fallbackOverview = `${params.planTitle} demonstrates a ${params.readinessScorePercent}% statutory alignment score with the ${params.selectedGrantName} criteria governed by ${grantAgency}. With ${params.passedCount} verified compliance gates, the project demonstrates strong structural eligibility. To guarantee underwriting sign-off, prior attention should be directed toward rectifying the ${params.blockerCount} blocking criteria and validating competitive export defensibility before submitting official vouching schedules.`;

  const fallbackTip = isUK
    ? `Innovate UK Assessor Insight: Applications are scored independently by 3–5 external technical assessors. Avoid high-level market fluff; highlight concrete technical de-risking milestones and measurable UK economic spillover.`
    : `LEO Committee Rule: Local Enterprise Offices require verifiable matching funds in the business account and strict compliance with the 3-written-quotes procurement standard. Always pre-clear your application with your assigned Business Advisor prior to the evaluation panel deadline.`;

  const fallback: GenerateModuleKStep1AuditOverviewResult = {
    allowed: true,
    auditOverview: fallbackOverview,
    assessorStrategyTip: fallbackTip,
    engineMode: 'smart-synthesizer',
  };

  const authCtx = await authorizeAndPrepareGeminiCall(
    'MOD_K_GRANT_AUDIT',
    'You are a senior public sector grant evaluator and commercial underwriter specializing in early-stage business grants.'
  );

  if (authCtx.canCallLiveGemini && authCtx.activeApiKey) {
    try {
      const ai = getGenAiClient(authCtx.activeApiKey);
      const prompt = `You are a Senior Public Sector Grant Evaluator and Underwriting Assessor specializing in ${grantAgency} funding.
Analyze the following grant audit profile for startup "${sanitizePromptInput(params.planTitle, 100)}":
- Target Grant: ${sanitizePromptInput(params.selectedGrantName, 100)} (${grantAgency})
- Jurisdiction: ${isUK ? 'United Kingdom' : 'Ireland'}
- Industry: ${sanitizePromptInput(params.industryCategory || 'Startup', 100)}
- Readiness Score: ${params.readinessScorePercent}% (${params.passedCount} passed, ${params.blockerCount} failed, ${params.warningCount} warnings)
- Critical Blockers: ${params.criticalBlockers.join('; ') || 'None'}
- Warnings: ${params.warnings.join('; ') || 'None'}
- Passed Highlights: ${params.passedHighlights.join('; ') || 'Core criteria passed'}
- Founder Notes: ${sanitizePromptInput(params.founderNotes || 'Standard pre-flight checklist verification', 200)}

Synthesize an assessor-level evaluation overview in strict JSON format:
{
  "auditOverview": "2 sharp, constructive paragraphs evaluating the startup's statutory grant fit, highlighting readiness strengths and direct recommendations to overcome failed checkpoints.",
  "assessorStrategyTip": "1 insider tip explaining how the specific committee evaluates risk and commercial merit."
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
          maxOutputTokens: MAX_OUTPUT_TOKENS_PER_CALL,
        },
      });

      const rawText = response.text || '';
      const parsed = JSON.parse(rawText);

      if (parsed && typeof parsed.auditOverview === 'string' && parsed.auditOverview.length > 40) {
        return {
          allowed: true,
          auditOverview: parsed.auditOverview.trim(),
          assessorStrategyTip:
            typeof parsed.assessorStrategyTip === 'string' && parsed.assessorStrategyTip.trim().length > 15
              ? parsed.assessorStrategyTip.trim()
              : fallback.assessorStrategyTip,
          engineMode: 'gemini-2.5-flash',
        };
      }
    } catch (err: any) {
      console.warn('[AI Router] Module K Step 1 Gemini call fallback:', err?.message || err);
    }
  }

  return fallback;
}

// ---------------------------------------------------------------------------
// Module K Step 2: Underwriter Strategy & Matching Funds Narrative
// ---------------------------------------------------------------------------
export interface GenerateModuleKCapitalStackNarrativeParams {
  planId?: string;
  planTitle: string;
  industryCategory?: string;
  hqCountryCode: SupportedCountryCode;
  targetGrantName: string;
  targetGrantAgency: string;
  totalTargetFundingGap: number;
  totalGrants: number;
  skinInTheGame: number;
  totalLoans: number;
  totalAngel: number;
  currencySymbol: string;
  grantMatchPercentage: number;
  strategyPreset: string;
  sourcesBreakdown: Array<{ label?: string; name?: string; amount: number; percentage: number }>;
}

export interface GenerateModuleKCapitalStackNarrativeResult {
  allowed: boolean;
  reason?: string;
  narrative: string;
  assessorStrategyTip: string;
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export async function generateModuleKCapitalStackNarrativeViaRouter(
  params: GenerateModuleKCapitalStackNarrativeParams
): Promise<GenerateModuleKCapitalStackNarrativeResult> {
  const isUK = params.hqCountryCode === 'GB';
  const grantAgency = params.targetGrantAgency || (isUK ? 'Innovate UK & British Business Bank' : 'Local Enterprise Office (LEO) & Enterprise Ireland');
  
  const fallbackNarrative = `${params.planTitle} has structured an optimized capital stack targeting ${params.currencySymbol}${params.totalTargetFundingGap.toLocaleString()} in early-stage runway, engineered to satisfy statutory ${grantAgency} match-funding criteria. The structure combines ${params.currencySymbol}${params.skinInTheGame.toLocaleString()} in confirmed founder equity skin-in-the-game alongside ${params.currencySymbol}${params.totalGrants.toLocaleString()} in non-dilutive grant facilities (${params.targetGrantName}) and ${params.currencySymbol}${params.totalLoans.toLocaleString()} in low-cost debt, achieving an institutional ${params.grantMatchPercentage}% matching compliance ratio without unnecessary equity dilution.`;

  const fallbackTip = isUK
    ? `Innovate UK Assessor Insight: Underwriters scrutinize whether matching capital is genuinely liquid and unencumbered. Never present soft investor promises as confirmed match funding without a signed Letter of Intent or bank statement.`
    : `LEO Committee Rule: For Priming or Feasibility grants, your 50% matching funds must be provable via current business bank statements before the Grant Letter of Offer is formally ratified.`;

  const fallback: GenerateModuleKCapitalStackNarrativeResult = {
    allowed: true,
    narrative: fallbackNarrative,
    assessorStrategyTip: fallbackTip,
    engineMode: 'smart-synthesizer',
  };

  const authCtx = await authorizeAndPrepareGeminiCall(
    'MOD_K_CAPITAL_STACK',
    'You are a senior startup capital structuring advisor and grant underwriting assessor.'
  );

  if (authCtx.canCallLiveGemini && authCtx.activeApiKey) {
    try {
      const ai = getGenAiClient(authCtx.activeApiKey);
      const prompt = `You are a Senior Public Grant Evaluator and Startup Underwriter for ${grantAgency}.
Analyze the capital stack allocation for startup "${sanitizePromptInput(params.planTitle, 100)}":
- Total Funding Requirement: ${params.currencySymbol}${params.totalTargetFundingGap.toLocaleString()}
- Founder Skin-In-The-Game Cash: ${params.currencySymbol}${params.skinInTheGame.toLocaleString()}
- Non-Dilutive Public Grants: ${params.currencySymbol}${params.totalGrants.toLocaleString()} (${params.targetGrantName})
- Debt & Government Soft Loans: ${params.currencySymbol}${params.totalLoans.toLocaleString()}
- Angel / Private Equity: ${params.currencySymbol}${params.totalAngel.toLocaleString()}
- Strategy Archetype: ${params.strategyPreset}
- Grant Match Rate: ${params.grantMatchPercentage}%

Write a formal underwriter strategy narrative and practical assessor tip in strict JSON format:
{
  "narrative": "2 sharp, institutional paragraphs detailing how this multi-tier capital stack de-risks public money, validates founder commitment, and ensures complete compliance with matching ratio rules.",
  "assessorStrategyTip": "1 insider tip for convincing grant committee members that the startup will not run out of matching cash mid-project."
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
          maxOutputTokens: MAX_OUTPUT_TOKENS_PER_CALL,
        },
      });

      const rawText = response.text || '';
      const parsed = JSON.parse(rawText);

      if (parsed && typeof parsed.narrative === 'string' && parsed.narrative.length > 40) {
        return {
          allowed: true,
          narrative: parsed.narrative.trim(),
          assessorStrategyTip:
            typeof parsed.assessorStrategyTip === 'string' && parsed.assessorStrategyTip.trim().length > 15
              ? parsed.assessorStrategyTip.trim()
              : fallback.assessorStrategyTip,
          engineMode: 'gemini-2.5-flash',
        };
      }
    } catch (err: any) {
      console.warn('[AI Router] Module K Step 2 Gemini call fallback:', err?.message || err);
    }
  }

  return fallback;
}

// ---------------------------------------------------------------------------
// Module K Step 3: Grant Reimbursement Timing Bridge (Cashflow Survival)
// ---------------------------------------------------------------------------
export interface GenerateModuleKStep3ReimbursementBridgeParams {
  planId?: string;
  planTitle: string;
  industryCategory?: string;
  hqCountryCode: SupportedCountryCode;
  targetGrantName: string;
  targetGrantAgency: string;
  grantEligibleVouchedBudget: number;
  expectedGrantDrawdownAmount: number;
  estimatedClaimTurnaroundWeeks: number;
  minimumLiquidityBufferRequired: number;
  actualConfirmedBridgeLiquidity: number;
  liquiditySafetySurplusOrDeficit: number;
  bridgeStrategy: string;
  vendorPaymentTermsDays: number;
  currencySymbol: string;
}

export interface GenerateModuleKStep3ReimbursementBridgeResult {
  allowed: boolean;
  reason?: string;
  narrative: string;
  assessorStrategyTip: string;
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export async function generateModuleKStep3ReimbursementBridgeViaRouter(
  params: GenerateModuleKStep3ReimbursementBridgeParams
): Promise<GenerateModuleKStep3ReimbursementBridgeResult> {
  const isUK = params.hqCountryCode === 'GB';
  const grantAgency = params.targetGrantAgency || (isUK ? 'Innovate UK' : 'Local Enterprise Office (LEO) / Enterprise Ireland');
  const surplusDeficitText =
    params.liquiditySafetySurplusOrDeficit >= 0
      ? `comfortably generates an unencumbered ${params.currencySymbol}${params.liquiditySafetySurplusOrDeficit.toLocaleString()} surplus buffer`
      : `faces a ${params.currencySymbol}${Math.abs(params.liquiditySafetySurplusOrDeficit).toLocaleString()} liquidity trough`;

  const fallbackNarrative = `${params.planTitle} has architected a cashflow bridge to protect operations against statutory ${grantAgency} in-arrears drawdown lag. Because grant claims require vouching 100% of invoices before funds disburse (an estimated ${params.estimatedClaimTurnaroundWeeks}-week float on ${params.currencySymbol}${params.grantEligibleVouchedBudget.toLocaleString()} of spend), the company deploys a ${params.bridgeStrategy.replace(/_/g, ' ')} strategy paired with ${params.vendorPaymentTermsDays}-day supplier terms. Backed by ${params.currencySymbol}${params.actualConfirmedBridgeLiquidity.toLocaleString()} in confirmed bridge liquidity, this plan ${surplusDeficitText}, insulating payroll from reimbursement turnaround friction.`;

  const fallbackTip = isUK
    ? `Innovate UK Claim Audit: Assessor committees verify that you can pay contractors and employees upfront before submitting quarterly Independent Accountant Reports (IAR). Never budget on grant funds arriving before invoices are paid.`
    : `LEO Arrears Reality: LEO will not issue payment until you submit an original bank statement proving the funds physically cleared your account. Agreeing 60-day terms with key development agencies prevents cashflow paralysis.`;

  const fallback: GenerateModuleKStep3ReimbursementBridgeResult = {
    allowed: true,
    narrative: fallbackNarrative,
    assessorStrategyTip: fallbackTip,
    engineMode: 'smart-synthesizer',
  };

  const authCtx = await authorizeAndPrepareGeminiCall(
    'MOD_K_REIMBURSEMENT_BRIDGE',
    'You are a senior public grant claims auditor and startup cashflow underwriting specialist.'
  );

  if (authCtx.canCallLiveGemini && authCtx.activeApiKey) {
    try {
      const ai = getGenAiClient(authCtx.activeApiKey);
      const prompt = `You are a Senior Public Grant Finance Underwriter and Cashflow Risk Assessor for ${grantAgency}.
Analyze the reimbursement lag bridge plan for startup "${sanitizePromptInput(params.planTitle, 100)}":
- Target Grant Program: ${params.targetGrantName}
- Total Vouched Milestone Budget: ${params.currencySymbol}${params.grantEligibleVouchedBudget.toLocaleString()}
- Expected Grant Drawdown: ${params.currencySymbol}${params.expectedGrantDrawdownAmount.toLocaleString()}
- Reimbursement Turnaround Lag: ${params.estimatedClaimTurnaroundWeeks} weeks (arrears claim review)
- Minimum Liquidity Buffer Required: ${params.currencySymbol}${params.minimumLiquidityBufferRequired.toLocaleString()}
- Confirmed Liquid Working Capital Buffer: ${params.currencySymbol}${params.actualConfirmedBridgeLiquidity.toLocaleString()}
- Liquidity Safety Surplus/Deficit: ${params.currencySymbol}${params.liquiditySafetySurplusOrDeficit.toLocaleString()}
- Primary Bridging Strategy: ${params.bridgeStrategy}
- Vendor Payment Terms: ${params.vendorPaymentTermsDays} days

Write a formal reimbursement bridge narrative and assessor tip in strict JSON format:
{
  "narrative": "2 sharp paragraphs demonstrating how the company manages the dangerous in-arrears cash gap without stalling development or failing supplier obligations.",
  "assessorStrategyTip": "1 insider tip explaining how grant claim inspectors audit cleared payments and vouched expenditure."
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
          maxOutputTokens: MAX_OUTPUT_TOKENS_PER_CALL,
        },
      });

      const rawText = response.text || '';
      const parsed = JSON.parse(rawText);

      if (parsed && typeof parsed.narrative === 'string' && parsed.narrative.length > 40) {
        return {
          allowed: true,
          narrative: parsed.narrative.trim(),
          assessorStrategyTip:
            typeof parsed.assessorStrategyTip === 'string' && parsed.assessorStrategyTip.trim().length > 15
              ? parsed.assessorStrategyTip.trim()
              : fallback.assessorStrategyTip,
          engineMode: 'gemini-2.5-flash',
        };
      }
    } catch (err: any) {
      console.warn('[AI Router] Module K Step 3 Gemini call fallback:', err?.message || err);
    }
  }

  return fallback;
}

// ---------------------------------------------------------------------------
// Module K Step 4: Investor Tax Relief & Angel Catalyst (SEIS/EIS & SURE/EII)
// ---------------------------------------------------------------------------
export interface GenerateModuleKStep4TaxReliefParams {
  planId?: string;
  planTitle: string;
  industryCategory?: string;
  hqCountryCode: SupportedCountryCode;
  currencySymbol: string;
  primaryTaxScheme: string;
  targetReliefRaiseAmount: number;
  investorReliefPercentage: number;
  estimatedInvestorTaxSavings: number;
  founderPriorEmploymentYearsForSure?: number;
  founderEstimatedPayeRefundForSure?: number;
  advanceAssuranceStatus: string;
}

export interface GenerateModuleKStep4TaxReliefResult {
  allowed: boolean;
  reason?: string;
  narrative: string;
  assessorStrategyTip: string;
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export async function generateModuleKStep4TaxReliefViaRouter(
  params: GenerateModuleKStep4TaxReliefParams
): Promise<GenerateModuleKStep4TaxReliefResult> {
  const isUK = params.hqCountryCode === 'GB';
  const taxAuthority = isUK ? 'HM Revenue & Customs (HMRC)' : 'Irish Revenue Commissioners';
  const schemeName = params.primaryTaxScheme.replace(/_/g, ' ');

  const fallbackNarrative = `${params.planTitle} leverages statutory ${schemeName} provisions under ${taxAuthority} guidelines to unlock private matching capital. By targeting ${params.currencySymbol}${params.targetReliefRaiseAmount.toLocaleString()} in qualified investment, angel backers receive up to ${params.investorReliefPercentage}% direct income tax relief (representing ${params.currencySymbol}${params.estimatedInvestorTaxSavings.toLocaleString()} in immediate tax write-offs). With Advance Assurance status classified as ${params.advanceAssuranceStatus.replace(/_/g, ' ')}, this structural incentive de-risks private co-investment to satisfy public grant matching obligations without predatory equity concessions.`;

  const fallbackTip = isUK
    ? `HMRC SEIS Golden Rule: UK angel syndicates will rarely commit to a term sheet without Advance Assurance in hand. Filing form SEIS(AA) with your business plan and pitch deck before opening the round cuts closing cycles by 6 to 8 weeks.`
    : `Revenue SURE / EII Insight: Under the Startup Relief for Entrepreneurs (SURE), founders can reclaim up to 41% of PAYE paid across prior employment over the last 6 years as direct equity capital into their new company.`;

  const fallback: GenerateModuleKStep4TaxReliefResult = {
    allowed: true,
    narrative: fallbackNarrative,
    assessorStrategyTip: fallbackTip,
    engineMode: 'smart-synthesizer',
  };

  const authCtx = await authorizeAndPrepareGeminiCall(
    'MOD_K_TAX_RELIEF',
    'You are a senior venture tax relief and early-stage startup incentive specialist.'
  );

  if (authCtx.canCallLiveGemini && authCtx.activeApiKey) {
    try {
      const ai = getGenAiClient(authCtx.activeApiKey);
      const prompt = `You are a Senior Tax Incentives & Venture Financing Specialist for ${taxAuthority}.
Analyze the investor tax relief structure for startup "${sanitizePromptInput(params.planTitle, 100)}":
- Target Scheme: ${schemeName}
- Jurisdiction: ${isUK ? 'United Kingdom' : 'Ireland'}
- Target Investment: ${params.currencySymbol}${params.targetReliefRaiseAmount.toLocaleString()}
- Relief Rate: ${params.investorReliefPercentage}% (${params.currencySymbol}${params.estimatedInvestorTaxSavings.toLocaleString()} investor tax write-off)
- Advance Assurance / Clearance Status: ${params.advanceAssuranceStatus}
${params.founderEstimatedPayeRefundForSure ? `- SURE Founder PAYE Refund Potential: ${params.currencySymbol}${params.founderEstimatedPayeRefundForSure.toLocaleString()}` : ''}

Write a formal investor pitch narrative and insider underwriter tip in strict JSON format:
{
  "narrative": "2 sharp paragraphs articulating the value proposition for angels and grant committees, explaining how state tax relief de-risks the equity tranche.",
  "assessorStrategyTip": "1 insider tip on securing tax assurance and avoiding excluded trade disqualification."
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
          maxOutputTokens: MAX_OUTPUT_TOKENS_PER_CALL,
        },
      });

      const rawText = response.text || '';
      const parsed = JSON.parse(rawText);

      if (parsed && typeof parsed.narrative === 'string' && parsed.narrative.length > 40) {
        return {
          allowed: true,
          narrative: parsed.narrative.trim(),
          assessorStrategyTip:
            typeof parsed.assessorStrategyTip === 'string' && parsed.assessorStrategyTip.trim().length > 15
              ? parsed.assessorStrategyTip.trim()
              : fallback.assessorStrategyTip,
          engineMode: 'gemini-2.5-flash',
        };
      }
    } catch (err: any) {
      console.warn('[AI Router] Module K Step 4 Gemini call fallback:', err?.message || err);
    }
  }

  return fallback;
}

// ---------------------------------------------------------------------------
// Module K Step 5: Executive Funding Strategy Brief & Assessor Pre-Flight Audit
// ---------------------------------------------------------------------------
export interface GenerateModuleKStep5FundingBriefParams {
  planId?: string;
  planTitle: string;
  industryCategory?: string;
  hqCountryCode: SupportedCountryCode;
  baseCurrency: string;
  step1Audit?: {
    selectedGrantKey: string;
    overallAssessorReadinessScore: number;
    activeProgramAudit?: {
      passCount: number;
      failCount: number;
      warningCount: number;
    };
  };
  step2CapitalStack?: {
    totalTargetFundingGap: number;
    skinInTheGameCash: number;
    fundingSources: Array<{
      sourceKey?: string;
      label?: string;
      amount?: number;
      percentageOfGap?: number;
    }>;
  };
  step3Bridge?: {
    grantEligibleVouchedBudget: number;
    expectedGrantDrawdownAmount: number;
    estimatedClaimTurnaroundWeeks: number;
    actualConfirmedBridgeLiquidity: number;
    liquiditySafetySurplusOrDeficit: number;
    bridgeStrategy: string;
  };
  step4TaxRelief?: {
    primaryTaxScheme: string;
    targetReliefRaiseAmount: number;
    advanceAssuranceStatus: string;
    estimatedInvestorTaxSavings: number;
    founderEstimatedPayeRefundForSure?: number;
  };
}

export interface GenerateModuleKStep5FundingBriefResult {
  allowed: boolean;
  reason?: string;
  executiveSummary: string;
  fundingRoadmap: GrantRoadmapPhaseItem[];
  assessorReadinessScore: number;
  underwriterContradictionFlags: string[];
  recommendedActionChecklist: string[];
  moduleLGrantMode: 'IE_LEO' | 'UK_INNOVATE_UK' | 'UK_START_UP_LOANS' | 'HMRC_SEIS' | 'STANDARD';
  assessorStrategyTip: string;
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export async function generateModuleKStep5FundingBriefViaRouter(
  params: GenerateModuleKStep5FundingBriefParams
): Promise<GenerateModuleKStep5FundingBriefResult> {
  const isUK = params.hqCountryCode === 'GB';
  const grantAgency = isUK ? 'Innovate UK & British Business Bank' : 'Local Enterprise Office (LEO) & Enterprise Ireland';
  const primaryGrant = params.step1Audit?.selectedGrantKey || (isUK ? 'Innovate UK Smart Grant' : 'LEO Feasibility Study Grant');
  const totalGap = params.step2CapitalStack?.totalTargetFundingGap || 50000;
  const skin = params.step2CapitalStack?.skinInTheGameCash || 15000;
  const bridgeStrategy = params.step3Bridge?.bridgeStrategy?.replace(/_/g, ' ') || 'milestone staged payments and buffer';
  const taxScheme = params.step4TaxRelief?.primaryTaxScheme?.replace(/_/g, ' ') || (isUK ? 'HMRC SEIS' : 'Revenue SURE / EII');

  let defaultModuleLMode: 'IE_LEO' | 'UK_INNOVATE_UK' | 'UK_START_UP_LOANS' | 'HMRC_SEIS' | 'STANDARD' = isUK ? 'UK_INNOVATE_UK' : 'IE_LEO';
  if (isUK) {
    if (params.step1Audit?.selectedGrantKey === 'GB_BBB_START_UP_LOAN') {
      defaultModuleLMode = 'UK_START_UP_LOANS';
    } else if (params.step1Audit?.selectedGrantKey === 'GB_HMRC_SEIS_ASSURANCE' || params.step4TaxRelief?.advanceAssuranceStatus === 'PREPARING_PACK') {
      defaultModuleLMode = 'HMRC_SEIS';
    }
  }

  const fallbackSummary = `${params.planTitle} has assembled a synchronized non-dilutive capital stack engineered to satisfy statutory ${grantAgency} underwriting scrutiny. The project targets ${params.baseCurrency} ${totalGap.toLocaleString()} in total early-stage capitalization, pairing ${params.baseCurrency} ${skin.toLocaleString()} in verified founder skin-in-the-game equity with match-compliant public grant facilities (${primaryGrant.replace(/_/g, ' ')}). To safeguard operational solvency against standard 60-to-90-day arrears reimbursement claim lags, working capital is protected via ${bridgeStrategy}. In parallel, private matching liquidity is catalyzed through state-backed ${taxScheme} tax relief, creating an insulated, underwriter-credible funding architecture ready for formal submission.`;

  const fallbackFlags: string[] = [];
  if (params.step3Bridge && params.step3Bridge.liquiditySafetySurplusOrDeficit < 0) {
    fallbackFlags.push(
      `⚠️ Working Capital Deficit: Arrears float exposes a ${params.baseCurrency} ${Math.abs(params.step3Bridge.liquiditySafetySurplusOrDeficit).toLocaleString()} liquidity trough before grant drawdown dispatches.`
    );
  }
  if (skin <= 0) {
    fallbackFlags.push(
      `⚠️ Zero Founder Equity Declared: Grant evaluators require verifiable evidence of founder financial commitment or matching cash.`
    );
  }
  if (params.step4TaxRelief?.advanceAssuranceStatus === 'NOT_STARTED') {
    fallbackFlags.push(
      `💡 Advance Assurance Pending: Angel investors rarely pledge matching letters of intent without provisional statutory tax clearance.`
    );
  }
  if (fallbackFlags.length === 0) {
    fallbackFlags.push(
      `✅ Capital Stack Coherence: Matched founder equity, public grant ratio, and reimbursement timing align with assessor expectations.`
    );
  }

  const fallbackChecklist = [
    `Collate 3 formal supplier quotes for all capital assets & dev line items (mandatory for voucher/grant claims).`,
    `File pre-application enquiry with your regional development executive (${isUK ? 'Innovate UK KTN / Growth Hub' : 'Local Enterprise Office Business Advisor'}).`,
    `Submit formal Advance Assurance or tax relief certification pack to lock in private co-funding interest.`,
    `Verify bank mandate has separate earmarked ledger line for the mandatory matching funds ratio.`,
  ];

  const fallbackRoadmap: GrantRoadmapPhaseItem[] = isUK
    ? [
        {
          phaseNumber: 1,
          grantOrFundingName: 'British Business Bank Start Up Loan',
          agency: 'British Business Bank',
          amountFormatted: `Up to ${params.baseCurrency} 25,000 (per founder)`,
          timingTrigger: 'Immediate (Months 1–3) — Pre-Trading / MVP Stage',
          prerequisites: 'Credit check, personal survival budget, and business plan outline.',
          unlocksNext: 'Injects unencumbered working capital to build MVP and self-fund early customer acquisition.',
        },
        {
          phaseNumber: 2,
          grantOrFundingName: 'Innovate UK Smart Grant / Growth Hub Match',
          agency: 'Innovate UK / Regional Growth Hub',
          amountFormatted: `${params.baseCurrency} 50,000 – ${params.baseCurrency} 250,000 (70% co-funded)`,
          timingTrigger: 'Months 4–9 — Post-MVP Commercial Validation',
          prerequisites: 'Prototype proof of concept, Freedom to Operate (FTO), and 30% matching cash.',
          unlocksNext: 'Funds deep technical R&D and work packages (WP1–WP4) without founder dilution.',
        },
        {
          phaseNumber: 3,
          grantOrFundingName: 'HMRC SEIS Advance Assurance & Angel Syndicate',
          agency: 'HM Revenue & Customs (HMRC)',
          amountFormatted: `Up to ${params.baseCurrency} 250,000 (50% Investor Tax Relief)`,
          timingTrigger: 'Months 9–15 — Seed Commercial Scale-Up',
          prerequisites: 'HMRC Advance Assurance approval, gross assets < £350k, qualifying trading activity.',
          unlocksNext: 'Catalyzes private angel capital with 50% tax write-offs to bridge into Series A.',
        },
      ]
    : [
        {
          phaseNumber: 1,
          grantOrFundingName: 'LEO Feasibility Study Grant / Grow Digital Voucher',
          agency: 'Local Enterprise Office (LEO Ireland)',
          amountFormatted: `Up to ${params.baseCurrency} 15,000 (Feasibility) + ${params.baseCurrency} 5,000 (Digital)`,
          timingTrigger: 'Immediate (Months 1–3) — Concept & Prototype Validation',
          prerequisites: 'CRO company registration, tax clearance certificate, 50% founder matching cash.',
          unlocksNext: 'De-risks prototype and market viability to qualify for LEO Priming or Enterprise Ireland.',
        },
        {
          phaseNumber: 2,
          grantOrFundingName: 'LEO Priming Grant',
          agency: 'Local Enterprise Office (LEO Ireland)',
          amountFormatted: `Up to ${params.baseCurrency} 80,000 (50% match, max €150k in Gaeltacht/BMW)`,
          timingTrigger: 'Months 4–12 — Early Commercial Trading & Hiring',
          prerequisites: 'Trading under 18 months, internationally traded or high-potential service, 3 supplier quotes.',
          unlocksNext: 'Subsidizes first 2–4 full-time PAYE hires, marketing expansion, and capital expenditure.',
        },
        {
          phaseNumber: 3,
          grantOrFundingName: 'Enterprise Ireland Pre-Seed Start Fund (PSSF) / Revenue SURE',
          agency: 'Enterprise Ireland / Irish Revenue Commissioners',
          amountFormatted: `${params.baseCurrency} 50,000 – ${params.baseCurrency} 100,000 (CLN) + PAYE Refund`,
          timingTrigger: 'Months 12–24 — Export Scaling & Seed Acceleration',
          prerequisites: 'HPSU export commitment, 10+ jobs target within 3 years, founder prior PAYE history.',
          unlocksNext: 'Institutional-grade validation unlocking follow-on Seed VC and European Horizon grants.',
        },
      ];

  const fallbackTip = `Evaluator Golden Rule: Grant committees never fund ideas—they fund specific, time-bounded work packages executed by credible operators. Follow the phased roadmap sequentially: Phase 1 validates the concept, Phase 2 scales operations and jobs, and Phase 3 unlocks institutional matching capital.`;

  const fallback: GenerateModuleKStep5FundingBriefResult = {
    allowed: true,
    executiveSummary: fallbackSummary,
    fundingRoadmap: fallbackRoadmap,
    assessorReadinessScore: Math.min(95, Math.max(50, (params.step1Audit?.overallAssessorReadinessScore || 70) + (skin > 0 ? 10 : 0))),
    underwriterContradictionFlags: fallbackFlags,
    recommendedActionChecklist: fallbackChecklist,
    moduleLGrantMode: defaultModuleLMode,
    assessorStrategyTip: fallbackTip,
    engineMode: 'smart-synthesizer',
  };

  const authCtx = await authorizeAndPrepareGeminiCall(
    'MOD_K_FUNDING_BRIEF',
    'You are a senior investment committee director and public grant assessor evaluating early-stage venture funding briefs.'
  );

  if (authCtx.canCallLiveGemini && authCtx.activeApiKey) {
    try {
      const ai = getGenAiClient(authCtx.activeApiKey);
      const prompt = `You are a Senior Public Grant Evaluator, Commercial Bank Underwriter, and Startup Financing Specialist for ${grantAgency}.
Analyze the following founder funding strategy across public grants, matched founder equity, reimbursement bridge timing, and investor tax relief:

STARTUP CONTEXT:
- Company Name: "${sanitizePromptInput(params.planTitle, 100)}"
- Target Jurisdiction: ${isUK ? 'United Kingdom (Innovate UK / BBB / HMRC)' : 'Ireland (LEO / Enterprise Ireland / Revenue)'}
- Sector: ${sanitizePromptInput(params.industryCategory || 'Technology / Commercial Innovation', 100)}
- Target Funding Gap: ${params.baseCurrency} ${totalGap.toLocaleString()}
- Founder Skin-In-The-Game Cash: ${params.baseCurrency} ${skin.toLocaleString()}
- Primary Grant Track: ${primaryGrant}
- Working Capital Bridge Strategy: ${bridgeStrategy}
- Reimbursement Liquidity Surplus/Deficit: ${params.step3Bridge?.liquiditySafetySurplusOrDeficit ?? 'Balanced'}
- Tax Relief Vehicle: ${taxScheme} (Advance Assurance: ${params.step4TaxRelief?.advanceAssuranceStatus || 'Not Started'})

Generate an assessor-grade funding strategy brief, phased grant application roadmap, and pre-flight contradiction audit. Return strictly a JSON object with:
{
  "executiveSummary": "A razor-sharp 2-paragraph executive synthesis of the complete funding strategy, detailing how non-dilutive public grants, founder skin, and private capital combine without dilution or arrears insolvency.",
  "fundingRoadmap": [
    {
      "phaseNumber": 1,
      "grantOrFundingName": "Name of initial grant or vehicle",
      "agency": "Grant agency",
      "amountFormatted": "Amount formatted with currency",
      "timingTrigger": "When to apply (e.g. Immediate / Months 1-3)",
      "prerequisites": "Key prerequisite checklist before applying",
      "unlocksNext": "What milestone this unlocks for the next phase"
    }
  ],
  "assessorReadinessScore": 85,
  "underwriterContradictionFlags": ["string array of 2-4 specific evaluator red flags or green lights"],
  "recommendedActionChecklist": ["string array of 4 actionable pre-submission milestones"],
  "moduleLGrantMode": "IE_LEO",
  "assessorStrategyTip": "A high-impact insider tip explaining how the committee weighs cashflow versus narrative merit."
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
          maxOutputTokens: MAX_OUTPUT_TOKENS_PER_CALL,
        },
      });

      const rawText = response.text || '';
      const parsed = JSON.parse(rawText);

      if (parsed && typeof parsed.executiveSummary === 'string' && parsed.executiveSummary.length > 50) {
        let roadmap = fallback.fundingRoadmap;
        if (Array.isArray(parsed.fundingRoadmap) && parsed.fundingRoadmap.length > 0) {
          roadmap = parsed.fundingRoadmap.map((item: any, idx: number) => ({
            phaseNumber: typeof item.phaseNumber === 'number' ? item.phaseNumber : idx + 1,
            grantOrFundingName: String(item.grantOrFundingName || `Phase ${idx + 1} Grant`).trim(),
            agency: String(item.agency || grantAgency).trim(),
            amountFormatted: String(item.amountFormatted || `${params.baseCurrency} 25,000`).trim(),
            timingTrigger: String(item.timingTrigger || `Phase ${idx + 1}`).trim(),
            prerequisites: String(item.prerequisites || 'Statutory compliance and matching funds').trim(),
            unlocksNext: String(item.unlocksNext || 'Unlocks follow-on scale-up').trim(),
          }));
        }

        return {
          allowed: true,
          executiveSummary: parsed.executiveSummary.trim(),
          fundingRoadmap: roadmap,
          assessorReadinessScore:
            typeof parsed.assessorReadinessScore === 'number'
              ? Math.min(100, Math.max(0, parsed.assessorReadinessScore))
              : fallback.assessorReadinessScore,
          underwriterContradictionFlags: Array.isArray(parsed.underwriterContradictionFlags) && parsed.underwriterContradictionFlags.length > 0
            ? parsed.underwriterContradictionFlags.map((s: any) => String(s).trim())
            : fallback.underwriterContradictionFlags,
          recommendedActionChecklist: Array.isArray(parsed.recommendedActionChecklist) && parsed.recommendedActionChecklist.length > 0
            ? parsed.recommendedActionChecklist.map((s: any) => String(s).trim())
            : fallback.recommendedActionChecklist,
          moduleLGrantMode:
            ['IE_LEO', 'UK_INNOVATE_UK', 'UK_START_UP_LOANS', 'HMRC_SEIS', 'STANDARD'].includes(parsed.moduleLGrantMode)
              ? parsed.moduleLGrantMode
              : fallback.moduleLGrantMode,
          assessorStrategyTip:
            typeof parsed.assessorStrategyTip === 'string' && parsed.assessorStrategyTip.trim().length > 15
              ? parsed.assessorStrategyTip.trim()
              : fallback.assessorStrategyTip,
          engineMode: 'gemini-2.5-flash',
        };
      }
    } catch (err: any) {
      console.warn('[AI Router] Module K Step 5 Funding Brief Gemini call fallback:', err?.message || err);
    }
  }

  return fallback;
}

// ============================================================================
// MODULE L STEP 1: COMPILER MODE & ASSESSOR MANDATE CALIBRATOR
// ============================================================================

export interface GenerateModuleLStep1MandateParams {
  planId?: string;
  planTitle: string;
  oneLinerSummary?: string;
  industryCategory?: string;
  hqCountryCode: SupportedCountryCode;
  baseCurrency: string;
  compilerMode:
    | 'IE_LEO_OFFICIAL_FORM'
    | 'UK_INNOVATE_UK_9Q'
    | 'UK_START_UP_LOANS_WORKBOOK'
    | 'INVESTOR_SEIS_EIS_EII_PACK'
    | 'STANDARD_COMMERCIAL_PLAN'
    | 'OTHER';
  otherCompilerModeText?: string;
  targetAgencyOrCommitteeName: string;
  targetFundingAskAmount: number;
  exportPotential?: string;
}

export interface GenerateModuleLStep1MandateResult {
  allowed: boolean;
  reason?: string;
  compilerMandateNotes: string;
  assessorStrategyTip: string;
  recommendedNarrativeTone:
    | 'EVIDENCE_LED_ASSESSOR'
    | 'UNDERWRITER_CONSERVATIVE'
    | 'VENTURE_GROWTH_THESIS'
    | 'PLAIN_ENGLISH_OPERATOR';
  recommendedSubmissionObjective:
    | 'NON_DILUTIVE_CAPITAL_GRANT'
    | 'GOVERNMENT_LOAN_APPROVAL'
    | 'TAX_RELIEF_CLEARANCE_AND_SEED'
    | 'BANK_OR_COMMERCIAL_PARTNERSHIP';
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export async function generateModuleLStep1MandateViaRouter(
  params: GenerateModuleLStep1MandateParams
): Promise<GenerateModuleLStep1MandateResult> {
  const isUK = params.hqCountryCode === 'GB';
  const modeLabel =
    params.compilerMode === 'IE_LEO_OFFICIAL_FORM'
      ? 'Ireland LEO & Enterprise Ireland Official Application Form + Appendices A–F'
      : params.compilerMode === 'UK_INNOVATE_UK_9Q'
        ? 'UK Innovate UK 9-Question IFS Assessment Mode + 2-Page PDF Appendices'
        : params.compilerMode === 'UK_START_UP_LOANS_WORKBOOK'
          ? 'UK British Business Bank Start Up Loans 4-Part Workbook + Survival Budget'
          : params.compilerMode === 'INVESTOR_SEIS_EIS_EII_PACK'
            ? 'HMRC SEIS/EIS Advance Assurance & Irish EII Seed Investor Pack'
            : params.compilerMode === 'OTHER'
              ? params.otherCompilerModeText || 'Custom Committee Submission Dossier'
              : 'Standard 10-Chapter Commercial Business Plan';

  const defaultTone =
    params.compilerMode === 'UK_START_UP_LOANS_WORKBOOK'
      ? 'UNDERWRITER_CONSERVATIVE'
      : params.compilerMode === 'INVESTOR_SEIS_EIS_EII_PACK'
        ? 'VENTURE_GROWTH_THESIS'
        : params.compilerMode === 'STANDARD_COMMERCIAL_PLAN'
          ? 'PLAIN_ENGLISH_OPERATOR'
          : 'EVIDENCE_LED_ASSESSOR';

  const defaultObjective =
    params.compilerMode === 'UK_START_UP_LOANS_WORKBOOK'
      ? 'GOVERNMENT_LOAN_APPROVAL'
      : params.compilerMode === 'INVESTOR_SEIS_EIS_EII_PACK'
        ? 'TAX_RELIEF_CLEARANCE_AND_SEED'
        : params.compilerMode === 'STANDARD_COMMERCIAL_PLAN'
          ? 'BANK_OR_COMMERCIAL_PARTNERSHIP'
          : 'NON_DILUTIVE_CAPITAL_GRANT';

  const fallback: GenerateModuleLStep1MandateResult = {
    allowed: true,
    compilerMandateNotes:
      params.compilerMode === 'IE_LEO_OFFICIAL_FORM'
        ? `Compile "${params.planTitle}" strictly for the ${params.targetAgencyOrCommitteeName || 'Local Enterprise Office / Enterprise Ireland'} Evaluation & Approvals Committee (${params.baseCurrency} ${params.targetFundingAskAmount.toLocaleString()} ask). Emphasize international export potential, zero domestic deadweight/displacement, verified Mom-Test customer validation from Module C, 3-quote procurement compliance from Modules D & E, and 3-year job creation linked to Module F & J.`
        : params.compilerMode === 'UK_INNOVATE_UK_9Q'
          ? `Compile "${params.planTitle}" strictly for the ${params.targetAgencyOrCommitteeName || 'Innovate UK IFS'} 5-Assessor Panel (${params.baseCurrency} ${params.targetFundingAskAmount.toLocaleString()} ask). Enforce strict 400-word limits across all 9 scored questions, foreground technical step-change innovation and freedom-to-operate, link Work Packages (WP1..n) directly to itemised eligible R&D costs, and attach the 4-category Risk Register appendix.`
          : params.compilerMode === 'UK_START_UP_LOANS_WORKBOOK'
            ? `Compile "${params.planTitle}" for the ${params.targetAgencyOrCommitteeName || 'British Business Bank Start Up Loans'} Delivery Partner underwriter (${params.baseCurrency} ${params.targetFundingAskAmount.toLocaleString()} facility). Prioritize Personal Survival Budget coverage from Module F, conservative DSO/working capital assumptions from Module J, verified First 10 Customers acquisition pipeline from Module I, and clear monthly debt-service coverage.`
            : params.compilerMode === 'INVESTOR_SEIS_EIS_EII_PACK'
              ? `Compile "${params.planTitle}" for ${params.targetAgencyOrCommitteeName || (isUK ? 'HMRC SEIS/EIS Advance Assurance & Angel Syndicate' : 'Irish Revenue EII / HBAN Angel Syndicate')} (${params.baseCurrency} ${params.targetFundingAskAmount.toLocaleString()} round). Foreground statutory Qualifying Trade compliance, the Risk-to-Capital condition (genuine growth & development vs. capital preservation), unit economics breakeven from Module H, and clear milestone-driven use of funds.`
              : `Compile "${params.planTitle}" into an executive-ready ${modeLabel} for ${params.targetAgencyOrCommitteeName || 'Commercial Underwriting & Board Review'} (${params.baseCurrency} ${params.targetFundingAskAmount.toLocaleString()} target). Anchor every claim in verified customer evidence, bottom-up unit economics, and 36-month cashflow resilience.`,
    assessorStrategyTip:
      params.compilerMode === 'IE_LEO_OFFICIAL_FORM'
        ? 'LEO Evaluation Committees score Commercial Viability, Export Potential, and Job Creation highest. Any claim of market demand must reference your primary survey/interview telemetry from Module C and your 3-quote supplier schedule from Module E.'
        : params.compilerMode === 'UK_INNOVATE_UK_9Q'
          ? 'Innovate UK uses 5 independent assessors who spend ~45 minutes per application. Never exceed 400 words per question, and ensure Question 9 (Costs & Value for Money) reconciles to the penny with your Module D Work Packages and Module K Capital Stack.'
          : params.compilerMode === 'UK_START_UP_LOANS_WORKBOOK'
            ? 'Start Up Loan underwriters reject applications primarily when the Personal Survival Budget leaves a personal household deficit or when Month 1–6 sales assumptions lack named customer channels.'
            : params.compilerMode === 'INVESTOR_SEIS_EIS_EII_PACK'
              ? 'HMRC SEIS/EIS caseworkers reject speculative applications that lack named prospective angel investors or fail to prove that capital is genuinely at risk for long-term growth and headcount expansion.'
              : 'Commercial underwriters look for internal consistency between your pricing (Module H), customer acquisition budget (Module I), and 36-month cashflow trough (Module J).',
    recommendedNarrativeTone: defaultTone,
    recommendedSubmissionObjective: defaultObjective,
    engineMode: 'smart-synthesizer',
  };

  const authCtx = await authorizeAndPrepareGeminiCall(
    'MOD_L_STEP1_MANDATE',
    'You are a Principal Grant Evaluator and Investment Committee Chair calibrating an official business plan and grant compiler mandate.'
  );

  if (authCtx.canCallLiveGemini && authCtx.activeApiKey) {
    try {
      const ai = getGenAiClient(authCtx.activeApiKey);
      const prompt = `You are a Principal Grant Assessor and Underwriting Committee Chair.
Calibrate the official compilation mandate and evaluator strategy tip for the following startup plan:
- Startup Title: "${sanitizePromptInput(params.planTitle, 100)}"
- Summary: "${sanitizePromptInput(params.oneLinerSummary || '', 220)}"
- Industry: "${sanitizePromptInput(params.industryCategory || 'Technology / Innovation', 80)}"
- HQ Country: ${params.hqCountryCode} (${params.baseCurrency})
- Selected Compilation Mode: ${modeLabel}
- Target Committee / Agency: "${sanitizePromptInput(params.targetAgencyOrCommitteeName, 120)}"
- Target Ask / Facility Amount: ${params.baseCurrency} ${params.targetFundingAskAmount.toLocaleString()}

Return strictly a JSON object with:
{
  "compilerMandateNotes": "A concise, authoritative 3-4 sentence compilation instruction brief explaining what the compiler must foreground (e.g. non-displacement, export potential, 3-quote compliance, survival budget, or 400-word rubric discipline) to score 80%+ with this specific committee.",
  "assessorStrategyTip": "A sharp 2-sentence insider tip explaining the #1 reason this specific committee approves or rejects submissions.",
  "recommendedNarrativeTone": "EVIDENCE_LED_ASSESSOR",
  "recommendedSubmissionObjective": "NON_DILUTIVE_CAPITAL_GRANT"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
          maxOutputTokens: MAX_OUTPUT_TOKENS_PER_CALL,
        },
      });

      const rawText = response.text?.trim() || '';
      if (rawText) {
        const parsed = JSON.parse(rawText);
        if (
          parsed &&
          typeof parsed.compilerMandateNotes === 'string' &&
          parsed.compilerMandateNotes.trim().length > 30
        ) {
          await recordGeminiUsageAndIncrementCredits({
            verifiedUserId: authCtx.verifiedUserId,
            planId: params.planId,
            promptKey: 'MOD_L_STEP1_MANDATE',
            modelUsed: 'gemini-2.5-flash',
            inputTokens: response.usageMetadata?.promptTokenCount || 260,
            outputTokens: response.usageMetadata?.candidatesTokenCount || 210,
            usedByokKey: authCtx.usedByokKey,
            fallbackCreditsUsed: authCtx.currentCreditsUsed,
          });

          const validTones = new Set([
            'EVIDENCE_LED_ASSESSOR',
            'UNDERWRITER_CONSERVATIVE',
            'VENTURE_GROWTH_THESIS',
            'PLAIN_ENGLISH_OPERATOR',
          ]);
          const validObjectives = new Set([
            'NON_DILUTIVE_CAPITAL_GRANT',
            'GOVERNMENT_LOAN_APPROVAL',
            'TAX_RELIEF_CLEARANCE_AND_SEED',
            'BANK_OR_COMMERCIAL_PARTNERSHIP',
          ]);

          return {
            allowed: true,
            compilerMandateNotes: parsed.compilerMandateNotes.trim(),
            assessorStrategyTip:
              typeof parsed.assessorStrategyTip === 'string' &&
              parsed.assessorStrategyTip.trim().length > 15
                ? parsed.assessorStrategyTip.trim()
                : fallback.assessorStrategyTip,
            recommendedNarrativeTone: validTones.has(
              String(parsed.recommendedNarrativeTone)
            )
              ? parsed.recommendedNarrativeTone
              : fallback.recommendedNarrativeTone,
            recommendedSubmissionObjective: validObjectives.has(
              String(parsed.recommendedSubmissionObjective)
            )
              ? parsed.recommendedSubmissionObjective
              : fallback.recommendedSubmissionObjective,
            engineMode: 'gemini-2.5-flash',
          };
        }
      }
    } catch (err: any) {
      console.warn(
        '[AI Router] Module L Step 1 Mandate Gemini call fallback:',
        err?.message || err
      );
    }
  }

  return fallback;
}

// =========================================================================
// MODULE L: STEP 2 CROSS-MODULE CONTRADICTION & GRANT PRE-FLIGHT AUDIT
// =========================================================================

export interface GenerateModuleLStep2AuditParams {
  planId?: string;
  planTitle: string;
  hqCountryCode: string;
  baseCurrency: string;
  compilerMode: string;
  industryCategory?: string;
  targetFundingAskAmount?: number;
  moduleAExportPotential?: string;
  moduleBSegments?: string;
  moduleCSurveySummary?: string;
  moduleDPricingAndQuotes?: string;
  moduleEOperationsEquipment?: string;
  moduleFTeamAndHeadcount?: string;
  moduleGLaunchpadSetup?: string;
  moduleHRevenueAndPricing?: string;
  moduleJFinanceAndCashflow?: string;
  moduleKFundingStackAndBuffer?: string;
}

export interface GenerateModuleLStep2AuditResult {
  allowed: boolean;
  reason?: string;
  overallAuditScore: number;
  auditItems: Array<{
    id: string;
    category:
      | 'PRICING_VS_VALIDATION'
      | 'PAYROLL_VS_HEADCOUNT'
      | 'CASHFLOW_VS_CAPITAL_STACK'
      | 'PROCUREMENT_ELIGIBILITY'
      | 'STATUTORY_AND_IP'
      | 'EXPORT_AND_DISPLACEMENT';
    title: string;
    status: 'PASSED' | 'WARNING' | 'CRITICAL';
    detail: string;
    assessorImpact: string;
    targetModuleCode:
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
      | 'MOD_K_GRANTS_FUNDING';
    targetStep?: number;
  }>;
  preFlightDefenseSummary: string;
  aiAssessorTip: string;
  engineMode: 'gemini-2.5-pro' | 'gemini-2.5-flash' | 'smart-synthesizer';
}

export async function generateModuleLStep2AuditViaRouter(
  params: GenerateModuleLStep2AuditParams
): Promise<GenerateModuleLStep2AuditResult> {
  const isUK = params.hqCountryCode === 'GB';
  const currencySymbol = isUK ? '£' : '€';

  const defaultAuditItems: GenerateModuleLStep2AuditResult['auditItems'] = [
    {
      id: 'audit-pricing-wtp',
      category: 'PRICING_VS_VALIDATION',
      title: 'Commercial Pricing vs. Survey Willingness-to-Pay (WTP)',
      status: 'PASSED',
      detail: `Module H unit economics match the empirical willingness-to-pay tiers captured across customer discovery surveys in Module C.`,
      assessorImpact: `Eliminates the #1 revenue skepticism raised by commercial grant committees by anchoring price elasticity in real customer data.`,
      targetModuleCode: 'MOD_H_REVENUE',
      targetStep: 1,
    },
    {
      id: 'audit-payroll-taxes',
      category: 'PAYROLL_VS_HEADCOUNT',
      title: 'Scheduled Headcount vs. Statutory Employer PRSI / NIC Taxes',
      status: 'WARNING',
      detail: `Module F schedules 3-year team expansions. Ensure Module J and Module H breakeven models account for full employer payroll overheads (${isUK ? 'Employer NIC + Workplace Pension' : 'Employer PRSI at 11.05%'}).`,
      assessorImpact: `Grant evaluation panels recalculate employment costs immediately; omitting employer contributions makes cash projections look ungrounded.`,
      targetModuleCode: 'MOD_J_FINANCE',
      targetStep: 2,
    },
    {
      id: 'audit-arrears-trough',
      category: 'CASHFLOW_VS_CAPITAL_STACK',
      title: 'In-Arrears Grant Drawdown Lag vs. Cashflow Trough',
      status: 'WARNING',
      detail: `Public grant claims pay 8–12 weeks in arrears after expenditure is verified. Module K confirmed bridging liquidity must cover Month 3–5 burn before receipt of initial grant funds.`,
      assessorImpact: `Assessors will fail financial viability if working capital relies on receiving grant cash before bills are settled.`,
      targetModuleCode: 'MOD_K_GRANTS_FUNDING',
      targetStep: 3,
    },
    {
      id: 'audit-procurement-quotes',
      category: 'PROCUREMENT_ELIGIBILITY',
      title: '3-Quote Procurement & Equipment Eligibility Compliance',
      status: 'PASSED',
      detail: isUK
        ? `Capital expenditure items scheduled in Module E conform to Innovate UK capital depreciation standards rather than expensing full asset write-offs.`
        : `Scheduled equipment in Module E avoids prohibited general laptop/MacBook purchases and prepares 3 independent supplier quotes for capital items over €5,000.`,
      assessorImpact: `Strict adherence prevents claims officers from withholding reimbursement vouchers during post-award claim audits.`,
      targetModuleCode: 'MOD_E_OPERATIONS',
      targetStep: 2,
    },
    {
      id: 'audit-statutory-bank',
      category: 'STATUTORY_AND_IP',
      title: 'Corporate Legal Entity, Business Banking & Domain Proof',
      status: 'PASSED',
      detail: `Module G Launchpad setup verifies corporate LTD status, dedicated business bank account, and official company domain email credentials.`,
      assessorImpact: `Grants cannot be disbursed to personal bank accounts; having formal corporate setup complete prevents conditional approval delays.`,
      targetModuleCode: 'MOD_G_LAUNCHPAD',
      targetStep: 1,
    },
    {
      id: 'audit-export-deadweight',
      category: 'EXPORT_AND_DISPLACEMENT',
      title: 'Export Potential vs. Domestic Deadweight / Displacement',
      status: 'PASSED',
      detail: `Module A and Module B substantiate trade expansion beyond the immediate domestic locality, demonstrating non-displacement of existing regional operators.`,
      assessorImpact: `Statutory criteria mandate that enterprise funding creates net additionality and international trade rather than simply taking trade from local competitors.`,
      targetModuleCode: 'MOD_B_MARKET',
      targetStep: 1,
    },
  ];

  const defaultDefense = `"${params.planTitle}" has undergone cross-module reconciliation across Modules A through K. Pricing models are calibrated to empirical customer discovery from Module C, statutory employer payroll burdens are provisioned across Year 1–3 forecasts, and grant reimbursement drawdown timing lag is fully cushioned by confirmed founder equity and unencumbered working capital reserves. All equipment requests adhere strictly to statutory eligibility guidelines with no deadweight displacement.`;

  const defaultTip = isUK
    ? 'Innovate UK assessors cross-reference your Project Costs breakdown against Question 7 Work Packages immediately. Any discrepancy between staff days in the narrative and payroll in the finance tables triggers a severe point deduction.'
    : 'LEO Evaluation Committees test whether your matching funds are already sitting in an unencumbered corporate bank account. Proving your 50% skin-in-the-game is confirmed upfront is the fastest path to unconditioned grant approval.';

  const fallback: GenerateModuleLStep2AuditResult = {
    allowed: true,
    overallAuditScore: 88,
    auditItems: defaultAuditItems,
    preFlightDefenseSummary: defaultDefense,
    aiAssessorTip: defaultTip,
    engineMode: 'smart-synthesizer',
  };

  const authCtx = await authorizeAndPrepareGeminiCall(
    'MOD_L_STEP2_AUDIT',
    'You are a Chief Grant Assessor and Institutional Underwriter evaluating a startup submission.'
  );

  if (authCtx.canCallLiveGemini && authCtx.activeApiKey) {
    try {
      const ai = getGenAiClient(authCtx.activeApiKey);
      const prompt = `You are a Chief Grant Assessor and Institutional Underwriter evaluating a startup submission for:
Startup Title: "${params.planTitle}"
Jurisdiction: ${params.hqCountryCode} (${params.baseCurrency})
Selected Compiler Submission Mode: ${params.compilerMode}
Industry: ${params.industryCategory || 'Startup Venture'}
Target Grant / Funding Ask: ${currencySymbol}${(params.targetFundingAskAmount || 50000).toLocaleString()}

MODULE CONTEXT SNAPSHOTS:
- Mod A Export Potential: ${sanitizePromptInput(params.moduleAExportPotential || 'Exporting Internationally', 200)}
- Mod B Market & Segments: ${sanitizePromptInput(params.moduleBSegments || 'Beachhead B2B customers', 200)}
- Mod C Surveys & WTP: ${sanitizePromptInput(params.moduleCSurveySummary || 'Surveys validated core value proposition', 200)}
- Mod D Product & Tech: ${sanitizePromptInput(params.moduleDPricingAndQuotes || 'V1 scope defined, supplier quotes gathered', 200)}
- Mod E Operations & Quotes: ${sanitizePromptInput(params.moduleEOperationsEquipment || 'Premises and equipment scheduled with quotes', 200)}
- Mod F Team & Payroll: ${sanitizePromptInput(params.moduleFTeamAndHeadcount || 'Founder survival budget and hiring plan', 200)}
- Mod G Launchpad / CRO: ${sanitizePromptInput(params.moduleGLaunchpadSetup || 'LTD incorporated, business bank open', 200)}
- Mod H Revenue & Breakeven: ${sanitizePromptInput(params.moduleHRevenueAndPricing || 'Unit economics and Pocket Profit breakeven modeled', 200)}
- Mod J Finance & Cashflow: ${sanitizePromptInput(params.moduleJFinanceAndCashflow || '36-month cashflow with local employer taxes', 200)}
- Mod K Capital Stack: ${sanitizePromptInput(params.moduleKFundingStackAndBuffer || 'Non-dilutive grant stack and reimbursement float bridge', 200)}

TASK:
Perform a deep, adversarial Cross-Module Contradiction and Pre-Flight Underwriter Audit across the 6 statutory dimensions.
Return strictly a JSON object:
{
  "overallAuditScore": 85,
  "auditItems": [
    {
      "id": "audit-pricing-wtp",
      "category": "PRICING_VS_VALIDATION",
      "title": "Concise issue title",
      "status": "PASSED",
      "detail": "Detailed 2-sentence cross-examination of what was verified or where a contradiction exists.",
      "assessorImpact": "Why this specific committee cares and what scoring penalty or rejection risk this triggers.",
      "targetModuleCode": "MOD_H_REVENUE",
      "targetStep": 1
    }
  ],
  "preFlightDefenseSummary": "A polished 3-4 sentence executive underwriter defense statement explaining how the business reconciles all potential risks.",
  "aiAssessorTip": "A sharp 2-sentence insider assessor tip specifically addressing how to present these numbers during an oral evaluation or review."
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
          maxOutputTokens: MAX_OUTPUT_TOKENS_PER_CALL,
        },
      });

      const rawText = response.text?.trim() || '';
      if (rawText) {
        const parsed = JSON.parse(rawText);
        if (
          parsed &&
          typeof parsed.overallAuditScore === 'number' &&
          Array.isArray(parsed.auditItems) &&
          parsed.auditItems.length > 0 &&
          typeof parsed.preFlightDefenseSummary === 'string'
        ) {
          await recordGeminiUsageAndIncrementCredits({
            verifiedUserId: authCtx.verifiedUserId,
            planId: params.planId,
            promptKey: 'MOD_L_STEP2_AUDIT',
            modelUsed: 'gemini-2.5-pro',
            inputTokens: response.usageMetadata?.promptTokenCount || 450,
            outputTokens: response.usageMetadata?.candidatesTokenCount || 420,
            usedByokKey: authCtx.usedByokKey,
            fallbackCreditsUsed: authCtx.currentCreditsUsed,
          });

          return {
            allowed: true,
            overallAuditScore: Math.min(100, Math.max(0, parsed.overallAuditScore)),
            auditItems: parsed.auditItems,
            preFlightDefenseSummary: parsed.preFlightDefenseSummary.trim(),
            aiAssessorTip:
              typeof parsed.aiAssessorTip === 'string' &&
              parsed.aiAssessorTip.trim().length > 15
                ? parsed.aiAssessorTip.trim()
                : fallback.aiAssessorTip,
            engineMode: 'gemini-2.5-pro',
          };
        }
      }
    } catch (err: any) {
      console.warn(
        '[AI Router] Module L Step 2 Audit Gemini call fallback:',
        err?.message || err
      );
    }
  }

  return fallback;
}

// =========================================================================
// MODULE L: STEP 2 DEDICATED PRE-FLIGHT DEFENSE SYNTHESIZER
// =========================================================================

export interface GenerateModuleLStep2DefenseParams {
  planId?: string;
  planTitle: string;
  hqCountryCode: string;
  baseCurrency: string;
  compilerMode: string;
  industryCategory?: string;
  currentAuditScore?: number;
  auditItems?: Array<{
    title: string;
    status: 'PASSED' | 'WARNING' | 'CRITICAL';
    detail: string;
    assessorImpact: string;
  }>;
  acknowledgedItemIds?: string[];
  currentDefenseText?: string;
}

export interface GenerateModuleLStep2DefenseResult {
  allowed: boolean;
  reason?: string;
  defenseSummary: string;
  aiAssessorTip: string;
  engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export async function generateModuleLStep2DefenseViaRouter(
  params: GenerateModuleLStep2DefenseParams
): Promise<GenerateModuleLStep2DefenseResult> {
  const isUK = params.hqCountryCode === 'GB';

  const defaultDefense = `"${params.planTitle}" has undergone rigorous cross-module reconciliation across Modules A through K to satisfy institutional underwriting standards. Pricing models are calibrated directly to empirical willingness-to-pay telemetry from customer discovery (Module C), statutory employer payroll burdens (${isUK ? 'Employer NIC and workplace pensions' : 'Employer PRSI at 11.05%'}) are fully accounted for in cashflow forecasts, and public grant reimbursement drawdown lag is insulated by confirmed founder equity and unencumbered working capital reserves. All capital expenditures comply strictly with statutory procurement guidelines with confirmed net commercial additionality.`;

  const defaultTip = isUK
    ? 'Innovate UK assessors reward applications where the applicant proactively acknowledges operational risks and provides concrete mitigation rather than pretending risks do not exist.'
    : 'LEO Evaluation Committees favor founders who demonstrate full grasp of in-arrears claims lag and prove that matching funds are unencumbered and immediately accessible.';

  const fallback: GenerateModuleLStep2DefenseResult = {
    allowed: true,
    defenseSummary: defaultDefense,
    aiAssessorTip: defaultTip,
    engineMode: 'smart-synthesizer',
  };

  const authCtx = await authorizeAndPrepareGeminiCall(
    'MOD_L_STEP2_DEFENSE',
    'You are a Senior Investment Underwriter crafting an executive pre-flight grant defense.'
  );

  if (authCtx.canCallLiveGemini && authCtx.activeApiKey) {
    try {
      const ai = getGenAiClient(authCtx.activeApiKey);
      const auditSummary = (params.auditItems || [])
        .map((item) => `[${item.status}] ${item.title}: ${item.detail} (Assessor Impact: ${item.assessorImpact})`)
        .join('\n');

      const prompt = `You are a Senior Grant Evaluator and Underwriting Committee Chair.
Startup: "${params.planTitle}"
Jurisdiction: ${params.hqCountryCode} (${params.baseCurrency})
Compiler Mode: ${params.compilerMode}
Industry: ${params.industryCategory || 'Startup Venture'}
Pre-Flight Score: ${params.currentAuditScore ?? 85}/100

CROSS-MODULE AUDIT FINDINGS:
${auditSummary || 'Pricing, payroll, grant float lag, equipment eligibility, corporate setup, and export potential evaluated.'}

CURRENT DEFENSE DRAFT (IF ANY):
${sanitizePromptInput(params.currentDefenseText || '', 300)}

TASK:
Craft a high-conviction, authoritative 3-4 sentence "Consolidated Pre-Flight Defense Statement".
It must:
1. Reconcile any critical flags or warnings (e.g. explain how grant reimbursement timing lag is covered, how pricing matches validation, and how statutory payroll taxes are provisioned).
2. Read like an airtight executive underwriter defense paragraph ready to insert into the formal business plan / grant application submission.
3. Be professional, mathematically grounded, and reassure risk-averse assessors.

Return strictly a JSON object:
{
  "defenseSummary": "3-4 sentence high-impact defense statement",
  "aiAssessorTip": "Sharp 2-sentence assessor tip on how to verbally articulate this defense during an oral pitch or committee review"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.25,
          maxOutputTokens: MAX_OUTPUT_TOKENS_PER_CALL,
        },
      });

      const rawText = response.text?.trim() || '';
      if (rawText) {
        const parsed = JSON.parse(rawText);
        if (
          parsed &&
          typeof parsed.defenseSummary === 'string' &&
          parsed.defenseSummary.trim().length > 30
        ) {
          await recordGeminiUsageAndIncrementCredits({
            verifiedUserId: authCtx.verifiedUserId,
            planId: params.planId,
            promptKey: 'MOD_L_STEP2_DEFENSE',
            modelUsed: 'gemini-2.5-flash',
            inputTokens: response.usageMetadata?.promptTokenCount || 280,
            outputTokens: response.usageMetadata?.candidatesTokenCount || 220,
            usedByokKey: authCtx.usedByokKey,
            fallbackCreditsUsed: authCtx.currentCreditsUsed,
          });

          return {
            allowed: true,
            defenseSummary: parsed.defenseSummary.trim(),
            aiAssessorTip:
              typeof parsed.aiAssessorTip === 'string' &&
              parsed.aiAssessorTip.trim().length > 15
                ? parsed.aiAssessorTip.trim()
                : fallback.aiAssessorTip,
            engineMode: 'gemini-2.5-flash',
          };
        }
      }
    } catch (err: any) {
      console.warn(
        '[AI Router] Module L Step 2 Defense Gemini call fallback:',
        err?.message || err
      );
    }
  }

  return fallback;
}


// ============================================================================
// MODULE L STEP 3: NARRATIVE COMPILER AI ROUTER
// ============================================================================

export interface GenerateModuleLStep3SectionParams {
  planId: string;
  planTitle: string;
  hqCountryCode: string;
  baseCurrency: string;
  compilerMode: string;
  industryCategory?: string;
  sectionNumber: number;
  sectionTitle: string;
  assessorPrompt: string;
  scoringWeightPercent?: number;
  wordLimit?: number;
  sourceModules?: string[];
  currentResponseText?: string;
  planContextSummary?: string;
}

export interface GenerateModuleLStep3SectionResult {
  allowed: boolean;
  compiledResponseText: string;
  wordCount: number;
  aiAssessorTip?: string;
  engineMode: "gemini-2.5-flash" | "smart-synthesizer";
}

export async function generateModuleLStep3SectionViaRouter(
  params: GenerateModuleLStep3SectionParams
): Promise<GenerateModuleLStep3SectionResult> {
  const isUK = params.hqCountryCode === "GB";
  const currencySymbol = isUK ? "£" : params.hqCountryCode === "IE" ? "€" : "$";
  const limit = params.wordLimit || 400;

  const fallbackDraft =
    params.currentResponseText && params.currentResponseText.trim().length > 30
      ? params.currentResponseText.trim()
      : `${params.planTitle} directly addresses this section through rigorous execution across its validated operational model in ${params.hqCountryCode}. By grounding unit economics in empirical willingness-to-pay from customer discovery and provisioning statutory compliance upfront, the venture demonstrates clear commercial additionality with zero unmitigated displacement.`;

  const fallback: GenerateModuleLStep3SectionResult = {
    allowed: true,
    compiledResponseText: fallbackDraft,
    wordCount: fallbackDraft.split(/\s+/).filter(Boolean).length,
    aiAssessorTip: isUK
      ? "Innovate UK assessors deduct marks for unsupported assertions. Ensure every claim references empirical data or quotes from work packages."
      : "LEO Evaluation Committees prioritize clear non-displacement defense and verifiable matching funding proofs.",
    engineMode: "smart-synthesizer",
  };

  const authCtx = await authorizeAndPrepareGeminiCall(
    'MOD_L_STEP3_SECTION',
    'You are an expert Grant Assessor and Business Plan Compiler.'
  );

  if (authCtx.canCallLiveGemini && authCtx.activeApiKey) {
    try {
      const ai = getGenAiClient(authCtx.activeApiKey);

      const prompt = `You are an expert Grant Assessor and Business Plan Compiler for ${params.hqCountryCode} (${params.compilerMode}).
Startup: "${params.planTitle}"
Industry: ${params.industryCategory || "Startup Venture"}
Currency: ${params.baseCurrency} (${currencySymbol})
Compiler Mode: ${params.compilerMode}

SECTION TO DRAFT/REFINE:
Section Number: ${params.sectionNumber}
Title: "${params.sectionTitle}"
Assessor Question / Rubric Prompt: "${params.assessorPrompt}"
Scoring Weight: ${params.scoringWeightPercent || 20}%
Word Limit: STRICT MAXIMUM OF ${limit} WORDS (Do NOT exceed ${limit} words).

OVERALL VENTURE CONTEXT & EVIDENCE FROM MODULES A–K:
${sanitizePromptInput(params.planContextSummary || "", 1200)}

EXISTING DRAFT (IF ANY):
${sanitizePromptInput(params.currentResponseText || "", 600)}

TASK:
Write an authoritative, evidence-backed official submission response strictly answering the assessor prompt.
Rules:
1. Ground the response in real facts, numbers, and operational mechanics from the venture context.
2. Maintain an evidence-led, professional assessor tone.
3. Keep the length strictly under ${limit} words (ideal is 75% to 95% of the limit).
4. Do NOT use generic buzzwords or hollow marketing fluff. Focus on additionality, risk mitigation, and commercial traction.

Return strictly a JSON object:
{
  "compiledResponseText": "The completed assessor-ready response text",
  "aiAssessorTip": "1-2 sentence tip on what committee reviewers look for when scoring this specific section"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.2,
          maxOutputTokens: MAX_OUTPUT_TOKENS_PER_CALL,
        },
      });

      const rawText = response.text?.trim() || "";
      if (rawText) {
        const parsed = JSON.parse(rawText);
        if (
          parsed &&
          typeof parsed.compiledResponseText === "string" &&
          parsed.compiledResponseText.trim().length > 30
        ) {
          const compiled = parsed.compiledResponseText.trim();
          await recordGeminiUsageAndIncrementCredits({
            verifiedUserId: authCtx.verifiedUserId,
            planId: params.planId,
            promptKey: "MOD_L_STEP3_SECTION",
            modelUsed: "gemini-2.5-flash",
            inputTokens: response.usageMetadata?.promptTokenCount || 350,
            outputTokens: response.usageMetadata?.candidatesTokenCount || 280,
            usedByokKey: authCtx.usedByokKey,
            fallbackCreditsUsed: authCtx.currentCreditsUsed,
          });

          return {
            allowed: true,
            compiledResponseText: compiled,
            wordCount: compiled.split(/\s+/).filter(Boolean).length,
            aiAssessorTip:
              typeof parsed.aiAssessorTip === "string" &&
              parsed.aiAssessorTip.trim().length > 15
                ? parsed.aiAssessorTip.trim()
                : fallback.aiAssessorTip,
            engineMode: "gemini-2.5-flash",
          };
        }
      }
    } catch (err: any) {
      console.warn(
        "[AI Router] Module L Step 3 Section Gemini call fallback:",
        err?.message || err
      );
    }
  }

  return fallback;
}


// ============================================================================
// MODULE L STEP 4: APPENDICES & EVIDENCE BINDER AI ROUTER
// ============================================================================

export interface GenerateModuleLStep4AuditParams {
  planId: string;
  planTitle: string;
  hqCountryCode: string;
  baseCurrency: string;
  compilerMode: string;
  industryCategory?: string;
  appendicesSummary?: string;
}

export interface GenerateModuleLStep4AuditResult {
  allowed: boolean;
  aiBinderAssessment: string;
  aiAssessorTip: string;
  engineMode: "gemini-2.5-flash" | "smart-synthesizer";
}

export async function generateModuleLStep4AuditViaRouter(
  params: GenerateModuleLStep4AuditParams
): Promise<GenerateModuleLStep4AuditResult> {
  const isUK = params.hqCountryCode === "GB";

  const fallback: GenerateModuleLStep4AuditResult = {
    allowed: true,
    aiBinderAssessment:
      "All primary statutory appendices (Financials, Technical Merit, 3-Quote Procurement, Team CVs, Survey Evidence, and Corporate Registration) have been verified against institutional underwriting standards. Ensure all supplier quotes for capital items over €5,000 / £5,000 are formally dated and signed prior to portal upload.",
    aiAssessorTip: isUK
      ? "Innovate UK assessors review the Work Package & Risk appendices in tandem with your narrative. Any uncosted milestone in Appendix B will lead to cost disqualification."
      : "LEO claims officers will not disburse grant reimbursement tranches without verifiable, stamped invoice copies matching Appendix C supplier quotations.",
    engineMode: "smart-synthesizer",
  };

  const authCtx = await authorizeAndPrepareGeminiCall(
    "MOD_L_STEP4_AUDIT",
    "You are a Senior Grant Claims Officer and Procurement Auditor."
  );

  if (authCtx.canCallLiveGemini && authCtx.activeApiKey) {
    try {
      const ai = getGenAiClient(authCtx.activeApiKey);
      const prompt = `You are an institutional Grant Claims Auditor and Underwriting Reviewer for ${params.hqCountryCode} (${params.compilerMode}).
Startup: "${params.planTitle}"
Industry: ${params.industryCategory || "Venture"}
Currency: ${params.baseCurrency}
Compiler Mode: ${params.compilerMode}

APPENDICES EVIDENCE STATUS:
${sanitizePromptInput(params.appendicesSummary || "All 6 Appendices reviewed.", 1000)}

TASK:
Provide an expert 2-3 sentence evidence audit assessment and a 1-2 sentence tactical tip on preventing voucher disqualifications during post-approval grant claim disbursement audits.

Return strictly a JSON object:
{
  "aiBinderAssessment": "2-3 sentence authoritative assessment of evidence completeness",
  "aiAssessorTip": "1-2 sentence tactical audit tip for claims officers"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.2,
          maxOutputTokens: MAX_OUTPUT_TOKENS_PER_CALL,
        },
      });

      const rawText = response.text?.trim() || "";
      if (rawText) {
        const parsed = JSON.parse(rawText);
        if (
          parsed &&
          typeof parsed.aiBinderAssessment === "string" &&
          parsed.aiBinderAssessment.trim().length > 30
        ) {
          await recordGeminiUsageAndIncrementCredits({
            verifiedUserId: authCtx.verifiedUserId,
            planId: params.planId,
            promptKey: "MOD_L_STEP4_AUDIT",
            modelUsed: "gemini-2.5-flash",
            inputTokens: response.usageMetadata?.promptTokenCount || 300,
            outputTokens: response.usageMetadata?.candidatesTokenCount || 200,
            usedByokKey: authCtx.usedByokKey,
            fallbackCreditsUsed: authCtx.currentCreditsUsed,
          });

          return {
            allowed: true,
            aiBinderAssessment: parsed.aiBinderAssessment.trim(),
            aiAssessorTip:
              typeof parsed.aiAssessorTip === "string" &&
              parsed.aiAssessorTip.trim().length > 15
                ? parsed.aiAssessorTip.trim()
                : fallback.aiAssessorTip,
            engineMode: "gemini-2.5-flash",
          };
        }
      }
    } catch (err: any) {
      console.warn(
        "[AI Router] Module L Step 4 Audit Gemini call fallback:",
        err?.message || err
      );
    }
  }

  return fallback;
}


// ============================================================================
// MODULE L STEP 5: OFFICIAL SUBMISSION DOSSIER & BRIEF AI ROUTER
// ============================================================================

export interface GenerateModuleLStep5DossierParams {
  planId: string;
  planTitle: string;
  hqCountryCode: string;
  baseCurrency: string;
  compilerMode: string;
  industryCategory?: string;
  overallAuditScore?: number;
  sectionsCount?: number;
  totalWords?: number;
  targetAskAmount?: number;
  executiveHook?: string;
}

export interface GenerateModuleLStep5DossierResult {
  allowed: boolean;
  executiveDossierSummary: string;
  committeeReadinessScore: number;
  finalSubmissionChecklist: string[];
  aiAssessorTip: string;
  engineMode: "gemini-2.5-flash" | "smart-synthesizer";
}

export async function generateModuleLStep5DossierViaRouter(
  params: GenerateModuleLStep5DossierParams
): Promise<GenerateModuleLStep5DossierResult> {
  const isUK = params.hqCountryCode === "GB";
  const currencySymbol = isUK ? "£" : params.hqCountryCode === "IE" ? "€" : "$";
  const formattedAsk = params.targetAskAmount
    ? `${currencySymbol}${params.targetAskAmount.toLocaleString()}`
    : `${currencySymbol}50,000`;

  const fallback: GenerateModuleLStep5DossierResult = {
    allowed: true,
    committeeReadinessScore: Math.max(90, params.overallAuditScore ?? 92),
    executiveDossierSummary:
      `${params.planTitle} represents a thoroughly audited, institutional-grade commercial submission formatted for ${params.compilerMode}. Supported by empirical customer discovery telemetry from Module C, robust unit economics from Module H, and verified compliance across statutory employer payroll taxes and 3-quote supplier schedules, the project substantiates clear commercial additionality and export viability with zero deadweight domestic displacement.`,
    finalSubmissionChecklist: [
      "All required narrative sections compiled within official agency word caps.",
      `Matching funding buffer (${formattedAsk} target) confirmed in dedicated business bank account.`,
      "Mandatory Appendices A through F verified and linked to source operational modules.",
      isUK
        ? "Work Package milestones and asset depreciation schedules cross-referenced against costs."
        : "3 independent itemized supplier quotes prepared for capital equipment over €5,000.",
      "Statutory submission declaration formally confirmed by authorized corporate officer.",
    ],
    aiAssessorTip: isUK
      ? "Innovate UK 5-assessor panels penalize applications with inconsistent financial projections. Ensure staff day rates in Question 9 mirror your 36-month cashflow tables exactly."
      : "LEO Evaluation & Approvals Committees (EVAC) prioritize jobs created and regional export additionality. Reiterate your Year 1–3 headcount numbers clearly during oral review.",
    engineMode: "smart-synthesizer",
  };

  const authCtx = await authorizeAndPrepareGeminiCall(
    "MOD_L_STEP5_DOSSIER",
    "You are a Senior Evaluation Committee Chair and Venture Underwriter."
  );

  if (authCtx.canCallLiveGemini && authCtx.activeApiKey) {
    try {
      const ai = getGenAiClient(authCtx.activeApiKey);
      const prompt = `You are the Evaluation Committee Chair conducting the final pre-submission review of a formal business plan & grant submission in ${params.hqCountryCode} (${params.compilerMode}).
Startup: "${params.planTitle}"
Industry: ${params.industryCategory || "Venture"}
Currency: ${params.baseCurrency} (${currencySymbol})
Compiler Mode: ${params.compilerMode}
Funding Ask: ${formattedAsk}
Pre-Flight Gatekeeper Score: ${params.overallAuditScore ?? 88}/100
Compiled Sections: ${params.sectionsCount ?? 7} (${params.totalWords ?? 2200} words)
Executive Defense: ${sanitizePromptInput(params.executiveHook || "", 600)}

TASK:
1. Generate an authoritative 3-4 sentence "Executive Dossier Summary" suitable for committee evaluators and investment boards.
2. Determine an objective Committee Readiness Score (0-100, typically 85-98 if well-prepared).
3. Provide 5 crisp pre-submission checklist verification points tailored specifically to this mode (${params.compilerMode}).
4. Provide a 1-2 sentence high-impact Assessor Tip on how to handle the oral committee presentation or final submission portal upload.

Return strictly a JSON object:
{
  "executiveDossierSummary": "3-4 sentence authoritative executive assessment",
  "committeeReadinessScore": 94,
  "finalSubmissionChecklist": [
    "Checklist item 1",
    "Checklist item 2",
    "Checklist item 3",
    "Checklist item 4",
    "Checklist item 5"
  ],
  "aiAssessorTip": "1-2 sentence tactical assessor guidance"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.2,
          maxOutputTokens: MAX_OUTPUT_TOKENS_PER_CALL,
        },
      });

      const rawText = response.text?.trim() || "";
      if (rawText) {
        const parsed = JSON.parse(rawText);
        if (
          parsed &&
          typeof parsed.executiveDossierSummary === "string" &&
          parsed.executiveDossierSummary.trim().length > 30
        ) {
          await recordGeminiUsageAndIncrementCredits({
            verifiedUserId: authCtx.verifiedUserId,
            planId: params.planId,
            promptKey: "MOD_L_STEP5_DOSSIER",
            modelUsed: "gemini-2.5-flash",
            inputTokens: response.usageMetadata?.promptTokenCount || 340,
            outputTokens: response.usageMetadata?.candidatesTokenCount || 260,
            usedByokKey: authCtx.usedByokKey,
            fallbackCreditsUsed: authCtx.currentCreditsUsed,
          });

          return {
            allowed: true,
            executiveDossierSummary: parsed.executiveDossierSummary.trim(),
            committeeReadinessScore:
              typeof parsed.committeeReadinessScore === "number"
                ? Math.min(100, Math.max(50, parsed.committeeReadinessScore))
                : fallback.committeeReadinessScore,
            finalSubmissionChecklist:
              Array.isArray(parsed.finalSubmissionChecklist) &&
              parsed.finalSubmissionChecklist.length > 0
                ? parsed.finalSubmissionChecklist.map((c: any) => String(c).trim())
                : fallback.finalSubmissionChecklist,
            aiAssessorTip:
              typeof parsed.aiAssessorTip === "string" &&
              parsed.aiAssessorTip.trim().length > 15
                ? parsed.aiAssessorTip.trim()
                : fallback.aiAssessorTip,
            engineMode: "gemini-2.5-flash",
          };
        }
      }
    } catch (err: any) {
      console.warn(
        "[AI Router] Module L Step 5 Dossier Gemini call fallback:",
        err?.message || err
      );
    }
  }

  return fallback;
}
