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
  return null;
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
      const ai = new GoogleGenAI({ apiKey: authCtx.activeApiKey });
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
      const ai = new GoogleGenAI({ apiKey: authCtx.activeApiKey });
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
      const ai = new GoogleGenAI({ apiKey: authCtx.activeApiKey });
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
      const ai = new GoogleGenAI({ apiKey: authCtx.activeApiKey });
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

  const candidateQuestions: SurveyQuestionItem[] = [];
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

  // 1. PROBLEM & PAIN INTENSITY (Context-shaped around the customer's real workflow, never copy-pasted quotes!)
  if (
    params.focusAreas.includes('PROBLEM_AND_PAIN') ||
    params.focusAreas.length === 0
  ) {
    if (customTopic) {
      candidateQuestions.push({
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
      });
    } else if (isStartupIdea) {
      candidateQuestions.push({
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
      });
    } else {
      candidateQuestions.push({
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
      });
    }

    candidateQuestions.push({
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
    });
  }

  // 2. CURRENT WORKAROUNDS & COMPETITORS (Tailored to Module B Step 2 Competitors & Workarounds)
  if (
    params.focusAreas.includes('CURRENT_WORKAROUNDS') ||
    candidateQuestions.length < 3
  ) {
    candidateQuestions.push({
      id: `q-${nowTs}-3`,
      questionText: isStartupIdea
        ? 'How have you tried to structure your startup idea, validate demand, or build your business plan over the past 6 months? (Select all that apply)'
        : `How are you currently handling ${ctx.customerWorkflowGerund} today—or which of these have you tried in the past 6 months? (Select all that apply)`,
      type: 'MULTI_SELECT',
      options: workaroundOptions.slice(0, 5),
      allowOther: true,
      momTestPassed: true,
      momTestFeedback: `Mom-Test Approved: Tests your Module B Step 2 alternatives (${ctx.competitorNames.join(', ') || 'status-quo habits'}) to see what respondents actively use today.`,
    });

    candidateQuestions.push({
      id: `q-${nowTs}-3b`,
      questionText: isStartupIdea
        ? 'What has been your biggest frustration with the tools, templates, or advice you have used so far?'
        : `What has been your #1 frustration with how your current tools or workarounds handle ${ctx.customerWorkflowGerund}?`,
      type: 'MULTIPLE_CHOICE',
      options: frustrationOptions.slice(0, 4),
      allowOther: true,
      momTestPassed: true,
      momTestFeedback:
        'Mom-Test Approved: Validates whether real customers feel the exact competitor shortfalls you identified in Module B Step 2.',
    });
  }

  // 3. PAST SPENDING & BUDGET REALITY (Tailored to Module B Step 3 Price & Billing Cadence)
  if (params.focusAreas.includes('PAST_SPENDING_BUDGET')) {
    candidateQuestions.push({
      id: `q-${nowTs}-4`,
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
    });
  }

  // 4. WORKFLOW & HABITS (Tailored to Module B Step 1 Buying Trigger & Decision Maker)
  if (params.focusAreas.includes('WORKFLOW_AND_HABITS')) {
    candidateQuestions.push({
      id: `q-${nowTs}-5`,
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
    });
  }

  // 5. FEATURE & OUTCOME PRIORITIES (Tailored to Module A Solution/Unfair Advantage & Module B Step 4 Wedge)
  if (params.focusAreas.includes('FEATURE_PRIORITIES')) {
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

    candidateQuestions.push({
      id: `q-${nowTs}-6`,
      questionText: isStartupIdea
        ? 'If one part of taking your startup from early idea to launch could be 10x easier tomorrow, which outcome would help you the most? (Select up to 2)'
        : `If you could fix ONE part of ${ctx.customerWorkflowGerund} tomorrow, which outcome would be most valuable to you? (Select up to 2)`,
      type: 'MULTI_SELECT',
      options: outcomeOptions.slice(0, 4),
      allowOther: true,
      momTestPassed: true,
      momTestFeedback:
        'Mom-Test Approved: Tests the core value proposition from Module A & Module B Step 4 by asking which outcome solves their biggest bottleneck.',
    });
  }

  // Always include a natural, conversational Mom-Test open story question at the end
  candidateQuestions.push({
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
  });

  // If we still need more questions to hit desiredCount, insert a natural past-switching question
  const desiredCount = Math.min(Math.max(params.questionCount || 5, 3), 8);
  while (candidateQuestions.length < desiredCount) {
    candidateQuestions.splice(candidateQuestions.length - 1, 0, {
      id: `q-${nowTs}-extra-${candidateQuestions.length}`,
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
    });
  }

  const openTextQ = candidateQuestions[candidateQuestions.length - 1];
  const structuredQs = candidateQuestions.slice(0, candidateQuestions.length - 1);
  const finalQuestions = [
    ...structuredQs.slice(0, desiredCount - 1),
    openTextQ,
  ];

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
      const ai = new GoogleGenAI({ apiKey: authCtx.activeApiKey });
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
          const fallback = buildSmartFallbackSurvey(params);
          const normalizeType = (t?: string): SurveyQuestionType =>
            t === 'MULTIPLE_CHOICE' ||
            t === 'MULTI_SELECT' ||
            t === 'SCALE_1_5' ||
            t === 'OPEN_TEXT'
              ? t
              : 'MULTIPLE_CHOICE';

          resultPayload = {
            title: parsed.title?.trim() || fallback.title,
            introDescription:
              parsed.introDescription?.trim() || fallback.introDescription,
            waitlistIncentiveText:
              parsed.waitlistIncentiveText?.trim() ||
              fallback.waitlistIncentiveText,
            questions: parsed.questions.map((q, idx) => {
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
                      : fbQuestion.options || ['Option A', 'Option B', 'Option C']
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
            }),
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
      const ai = new GoogleGenAI({ apiKey: authCtx.activeApiKey });
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

  const existingTexts = params.existingQuestions
    .map((q) => q.questionText.toLowerCase())
    .join(' | ');

  const hasScale = params.existingQuestions.some((q) => q.type === 'SCALE_1_5');
  const hasSpend =
    existingTexts.includes('spend') ||
    existingTexts.includes('spent') ||
    existingTexts.includes('pay') ||
    existingTexts.includes('budget');
  const hasCompetitorCheck =
    (ctx.competitorNames[0] &&
      existingTexts.includes(ctx.competitorNames[0].toLowerCase())) ||
    existingTexts.includes('workaround');

  let suggested: SurveyQuestionItem;

  if (!hasCompetitorCheck) {
    suggested = {
      id: `q-${Date.now()}-ai`,
      questionText: `Which of these tools or workarounds have you used in the past 6 months when ${ctx.customerWorkflowGerund}? (Select all that apply)`,
      type: 'MULTI_SELECT',
      options: [
        ctx.competitorNames.length >= 2
          ? `Using ${ctx.competitorNames[0]} or ${ctx.competitorNames[1]}`
          : `Using ${ctx.competitorNames[0] || 'an existing software tool'}`,
        ctx.competitorNames[2]
          ? `Working with ${ctx.competitorNames[2]}`
          : 'Paying an external consultant, advisor, or agency',
        'Piecing it together manually in spreadsheets, Notion, or Google Docs',
        'Nothing structured yet — figuring it out as I go',
      ],
      allowOther: true,
      momTestPassed: true,
      momTestFeedback: `Mom-Test Approved: Directly tests your Module B Step 2 competitors (${ctx.competitorNames.join(', ') || 'status quo'}) against manual workarounds.`,
    };
  } else if (!hasSpend) {
    suggested = {
      id: `q-${Date.now()}-ai`,
      questionText: `Over the past 12 months, roughly how much have you spent (${ctx.billingCadenceLabel}) on tools, templates, or external help for ${ctx.customerWorkflowGerund}?`,
      type: 'MULTIPLE_CHOICE',
      options: [
        `${formatPlanCurrency(0, ctx.curr)} — only used free tools and my own time so far`,
        `Under ${ctx.lowBracket} ${ctx.billingCadenceLabel}`,
        `${ctx.lowBracket} – ${ctx.midBracket} ${ctx.billingCadenceLabel}`,
        `Over ${ctx.midBracket} ${ctx.billingCadenceLabel}`,
      ],
      allowOther: true,
      momTestPassed: true,
      momTestFeedback: `Mom-Test Approved: Validates real past spending anchored around your Module B Step 3 target price (${ctx.midBracket}).`,
    };
  } else if (!hasScale) {
    suggested = {
      id: `q-${Date.now()}-ai`,
      questionText: `Compared to your other priorities right now, how urgent is it for you to ${ctx.customerGoalInfinitive} over the next 3 months?`,
      type: 'SCALE_1_5',
      scaleMinLabel: '1 = Low priority / Someday maybe',
      scaleMaxLabel: '5 = Top-3 priority to sort out right now',
      momTestPassed: true,
      momTestFeedback:
        'Mom-Test Approved: Measures whether this is a hair-on-fire priority for your beachhead customer.',
    };
  } else {
    suggested = {
      id: `q-${Date.now()}-ai`,
      questionText: `If you tried using ${ctx.competitorNames.slice(0, 2).join(' or ') || 'an existing tool or template'} in the past while ${ctx.customerWorkflowGerund}, what was the #1 reason it fell short for you?`,
      type: 'OPEN_TEXT',
      momTestPassed: true,
      momTestFeedback:
        'Mom-Test Approved: Uncovers real switching triggers and validates the competitor weaknesses you mapped in Module B Step 2.',
    };
  }

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
        `Collected ${totalResponses} survey response(s) and ${totalInterviews} interview(s) so far. Share your public /v/[slug] link or log 3–5 customer discovery calls to unlock stronger pattern confidence.`
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
      const ai = new GoogleGenAI({ apiKey: authCtx.activeApiKey });
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
      const ai = new GoogleGenAI({ apiKey: authCtx.activeApiKey });
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
      const ai = new GoogleGenAI({ apiKey: authCtx.activeApiKey });
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
      const ai = new GoogleGenAI({ apiKey: authCtx.activeApiKey });
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
      const ai = new GoogleGenAI({ apiKey: authCtx.activeApiKey });
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
      const ai = new GoogleGenAI({ apiKey: authCtx.activeApiKey });
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
            'Interactive founder workspace + mobile-ready public validation page (/v/[slug]) capturing live responses in <60 seconds.',
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
          stageTitle: 'Live Public Proof (/v/[slug]) & Official Grant Exports',
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
      const ai = new GoogleGenAI({ apiKey: authCtx.activeApiKey });
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
      const ai = new GoogleGenAI({ apiKey: authCtx.activeApiKey });
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
                'Founder progresses through Modules A–K using rate-limited Gemini 2.5 Flash/Pro synthesis, Mom-Test survey hosting (/v/[slug]), and financial modelling.',
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
    const ai = new GoogleGenAI({ apiKey: authCtx.activeApiKey });
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
    const ai = new GoogleGenAI({ apiKey: authCtx.activeApiKey });
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
    const ai = new GoogleGenAI({ apiKey: authCtx.activeApiKey });
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
    const ai = new GoogleGenAI({ apiKey: authCtx.activeApiKey });
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
    const ai = new GoogleGenAI({ apiKey: authCtx.activeApiKey });
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
    const ai = new GoogleGenAI({ apiKey: authCtx.activeApiKey });
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






