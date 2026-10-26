import { GoogleGenAI } from '@google/genai';
import { eq, sql } from 'drizzle-orm';
import {
  db,
  userEntitlements,
  aiPrompts,
  aiUsageLogs,
  type BlindSpotItem,
} from '@/db';
import { canConsumeAiCredits, type EntitlementSnapshot } from '@/lib/entitlements';
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
  SavedModuleBData,
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

const DEFAULT_SYSTEM_PROMPT = `You are the Build My Unicorn (BMU) 2.0 Supportive Co-Founder & Blind-Spot Engine.
Always follow the "Capture First, Expand Second" philosophy:
1. Never criticize the founder's raw idea upfront. When tidying up the founder's Step 2 Concept Canvas notes, preserve their exact core ideas and voice while making their notes clear, well-structured, and easy to read. Remember there are no right or wrong answers.
2. Second, generate 3 constructive, encouraging "Things to Consider" blind spots (operational realities, industry traps, or validation questions) framed as supportive coaching prompts.`;

function tidyFounderSentence(rawText: string | undefined, fallbackText: string): string {
  const cleaned = (rawText || '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return fallbackText;
  // Capitalize the first letter of each sentence and ensure ending punctuation
  const capitalized = cleaned.replace(/(^\s*[a-z]|[.!?]\s+[a-z])/g, (match) =>
    match.toUpperCase()
  );
  return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`;
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
 * Checks `user_entitlements.ai_credits_used_this_month`, calls Gemini 2.5 Flash (or smart synthesizer fallback),
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

  let customByokKey: string | null = null;
  let creditsUsedAfter = 1;

  // 1. Check Entitlement & Credit Guardrail in PostgreSQL if userId is a valid UUID
  const isUuid =
    params.userId &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      params.userId
    );

  if (isUuid && params.userId) {
    try {
      const [entRow] = await db
        .select()
        .from(userEntitlements)
        .where(eq(userEntitlements.userId, params.userId))
        .limit(1);

      if (entRow) {
        const snapshot: EntitlementSnapshot = {
          userId: entRow.userId,
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
        };

        const creditCheck = canConsumeAiCredits(snapshot, 1);
        if (!creditCheck.allowed) {
          const fallback = buildSmartFallbackSynthesis(params);
          return {
            allowed: false,
            reason: creditCheck.reason,
            canvas: fallback.canvas,
            thingsToConsider: fallback.thingsToConsider,
            creditsUsedAfter: entRow.aiCreditsUsedThisMonth,
            engineMode: 'smart-synthesizer',
          };
        }

        customByokKey = entRow.customApiKeyEncrypted;
      }
    } catch {
      // Continue if DB check fails in offline preview
    }
  }

  // 2. Check if Gemini API Key is configured
  const activeApiKey = hasConfiguredGeminiKey(customByokKey);
  let canvasResult: ConceptCanvasBlocks | null = null;
  let blindSpotsResult: BlindSpotItem[] | null = null;
  let engineMode: 'gemini-2.5-flash' | 'smart-synthesizer' = 'smart-synthesizer';
  let inputTokensCount = 240;
  let outputTokensCount = 380;

  if (activeApiKey) {
    try {
      let systemInstruction = DEFAULT_SYSTEM_PROMPT;
      try {
        const [promptRow] = await db
          .select()
          .from(aiPrompts)
          .where(eq(aiPrompts.promptKey, 'MOD_A_CONCEPT_CANVAS'))
          .limit(1);
        if (promptRow?.systemInstruction) {
          systemInstruction = promptRow.systemInstruction;
        }
      } catch {
        // Use default prompt
      }

      const ai = new GoogleGenAI({ apiKey: activeApiKey });
      const draft = params.draftCanvas || {};
      const userPrompt = `
Founder Startup Title: ${params.planTitle}
Industry Category: ${params.industryCategory}
Home Country & Currency: ${countryPack.countryName} (${countryPack.defaultCurrency})
Indirect Tax: ${countryPack.taxName} (${countryPack.standardTaxRatePercent}%)
Export Ambition: ${params.exportPotential}
Matched Local Grants: ${grants.map((g) => `${g.grantName} (${g.maxAmountFormatted})`).join('; ')}

Founder's Raw Idea (Step 1):
"""
${params.brainDumpText}
"""

Founder's Draft Notes in Step 2 (Tidy up their grammar and clarity while keeping their own meaning and voice; if a field is empty, helpfully suggest a simple starting note based on their raw idea):
- 1. Core Problem: ${draft.coreProblem || '(not filled in yet)'}
- 2. Target Customer: ${draft.targetCustomer || '(not filled in yet)'}
- 3. Your Solution: ${draft.proposedSolution || '(not filled in yet)'}
- 4. Why You Win: ${draft.unfairAdvantage || '(not filled in yet)'}
- 5. Revenue & Grant Fit: ${draft.revenueAndGrantFit || '(not filled in yet)'}

Founder's Motivation (Step 3):
- Primary Motivation: ${params.founderMotivation?.primaryMotivation || 'LEAVE_JOB'}
- Weekly Hours Available: ${params.founderMotivation?.weeklyHoursAvailable || '15_TO_25_HRS'}
- 12-Month Success Vision: ${params.founderMotivation?.twelveMonthSuccessVision || '(not filled in yet)'}

Founder's Team & Starting Budget (Step 4):
- Team Structure: ${params.teamAndBudget?.teamStructureType || 'SOLO_FOUNDER'}
- In-House Skill Coverage to Build V1: ${params.teamAndBudget?.skillCoverage || 'BUILD_IN_HOUSE'}
- Starting Capital to Invest (${countryPack.defaultCurrency}): ${params.teamAndBudget?.startingBudgetBracket || '1K_TO_5K'}
- Team & Funding Notes: ${params.teamAndBudget?.teamAndFundingNotes || '(not filled in yet)'}

Founder Fit, Dealbreakers & Reality Check (Step 5):
- Industry Connection (Monday Morning Test): ${params.founderRealityCheck?.industryConnection || 'WARM_CONNECTIONS'}
- Personal Income Urgency: ${params.founderRealityCheck?.personalIncomeUrgency || 'MEDIUM_6_TO_12M'}
- Lifestyle Dealbreakers (Anti-Goals): ${params.founderRealityCheck?.dealbreakers?.join(', ') || 'None selected'}
- Growth vs Control Tradeoff: ${params.founderRealityCheck?.growthTradeoff || 'BOOTSTRAP_100_CONTROL'}
- #1 Secret Worry: ${params.founderRealityCheck?.biggestWorryPreset || 'WILL_THEY_PAY'} (${params.founderRealityCheck?.biggestWorryNotes || 'no extra notes'})

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
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.4,
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
        '[BMU AI Router] Gemini API call failed, using smart synthesizer fallback:',
        err instanceof Error ? err.message : err
      );
    }
  }

  if (!canvasResult || !blindSpotsResult) {
    const fallback = buildSmartFallbackSynthesis(params);
    canvasResult = fallback.canvas;
    blindSpotsResult = fallback.thingsToConsider;
  }

  // 3. Log AI usage and increment credit counter in PostgreSQL if userId is a valid UUID
  if (isUuid && params.userId) {
    try {
      const [updatedEnt] = await db
        .update(userEntitlements)
        .set({
          aiCreditsUsedThisMonth: sql`${userEntitlements.aiCreditsUsedThisMonth} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(userEntitlements.userId, params.userId))
        .returning();

      if (updatedEnt) {
        creditsUsedAfter = updatedEnt.aiCreditsUsedThisMonth;
      }

      const isPlanUuid =
        params.planId &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          params.planId
        );

      await db.insert(aiUsageLogs).values({
        userId: params.userId,
        planId: isPlanUuid ? params.planId : null,
        promptKey: 'MOD_A_CONCEPT_CANVAS',
        modelUsed: engineMode,
        inputTokens: inputTokensCount,
        outputTokens: outputTokensCount,
        usedByokKey: Boolean(customByokKey),
      });
    } catch {
      // Ignore logging error in offline fallback
    }
  }

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
  let customByokKey: string | null = null;
  let creditsUsedAfter = 1;

  const isUuid =
    params.userId &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      params.userId
    );

  if (isUuid && params.userId) {
    try {
      const [entRow] = await db
        .select()
        .from(userEntitlements)
        .where(eq(userEntitlements.userId, params.userId))
        .limit(1);

      if (entRow) {
        const snapshot: EntitlementSnapshot = {
          userId: entRow.userId,
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
        };

        const creditCheck = canConsumeAiCredits(snapshot, 1);
        if (!creditCheck.allowed) {
          const fallback = buildSmartFallbackCompetitors(params);
          return {
            allowed: false,
            reason: creditCheck.reason,
            competitors: fallback.competitors,
            suggestedWhySwitchSentence: fallback.suggestedWhySwitchSentence,
            creditsUsedAfter: entRow.aiCreditsUsedThisMonth,
            engineMode: 'smart-synthesizer',
          };
        }

        customByokKey = entRow.customApiKeyEncrypted;
      }
    } catch {
      // Continue if DB check fails in offline preview
    }
  }

  const activeApiKey = hasConfiguredGeminiKey(customByokKey);
  let competitorsResult: CompetitorEntry[] | null = null;
  let suggestedEdgeSentence: string | undefined;
  let engineMode: 'gemini-2.5-flash' | 'smart-synthesizer' = 'smart-synthesizer';
  let inputTokensCount = 210;
  let outputTokensCount = 340;

  if (activeApiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: activeApiKey });
      const marketsText =
        params.targetMarketsArray.length > 0
          ? params.targetMarketsArray.join(', ')
          : countryPack.countryName;

      const userPrompt = `
You are the "Supportive Co-Founder & Market Scout" inside Build My Unicorn 2.0.
Identify 3 realistic competitors or alternatives that target customers in [${marketsText}] currently use instead of this founder's startup.
Use plain, everyday English (zero corporate jargon). Format all prices in ${countryPack.defaultCurrency}.

Startup Name: ${params.planTitle}
Industry Category: ${params.industryCategory}
Customer Models: ${params.buyerTypes?.join(', ') || 'Not specified'}
Target Customer Description: ${params.targetCustomerDescription || '(not specified yet)'}
Core Problem: ${params.coreProblem || params.brainDumpText || '(not specified yet)'}
Proposed Solution: ${params.proposedSolution || '(not specified yet)'}

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
  "suggestedWhySwitchSentence": "Customers switch to ${params.planTitle} because [1 clear, plain-English sentence explaining the practical advantage]."
}`.trim();

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userPrompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.4,
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
        '[BMU AI Router] Module B Market Scout Gemini call failed, using smart synthesizer fallback:',
        err instanceof Error ? err.message : err
      );
    }
  }

  if (!competitorsResult) {
    const fallback = buildSmartFallbackCompetitors(params);
    competitorsResult = fallback.competitors;
    suggestedEdgeSentence = fallback.suggestedWhySwitchSentence;
  }

  if (isUuid && params.userId) {
    try {
      const [updatedEnt] = await db
        .update(userEntitlements)
        .set({
          aiCreditsUsedThisMonth: sql`${userEntitlements.aiCreditsUsedThisMonth} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(userEntitlements.userId, params.userId))
        .returning();

      if (updatedEnt) {
        creditsUsedAfter = updatedEnt.aiCreditsUsedThisMonth;
      }

      const isPlanUuid =
        params.planId &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          params.planId
        );

      await db.insert(aiUsageLogs).values({
        userId: params.userId,
        planId: isPlanUuid ? params.planId : null,
        promptKey: 'MOD_B_MARKET_SCOUT',
        modelUsed: engineMode,
        inputTokens: inputTokensCount,
        outputTokens: outputTokensCount,
        usedByokKey: Boolean(customByokKey),
      });
    } catch {
      // Ignore logging error in offline fallback
    }
  }

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
  let customByokKey: string | null = null;
  let creditsUsedAfter = 1;

  const isUuid =
    params.userId &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      params.userId
    );

  if (isUuid && params.userId) {
    try {
      const [entRow] = await db
        .select()
        .from(userEntitlements)
        .where(eq(userEntitlements.userId, params.userId))
        .limit(1);

      if (entRow) {
        const snapshot: EntitlementSnapshot = {
          userId: entRow.userId,
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
        };

        const creditCheck = canConsumeAiCredits(snapshot, 1);
        if (!creditCheck.allowed) {
          const fallback = buildSmartFallbackMarketSizing(params);
          return {
            allowed: false,
            reason: creditCheck.reason,
            segments: fallback.segments,
            widerMarketMultiplier: fallback.widerMarketMultiplier,
            sourceAndAssumptionNotes: fallback.sourceAndAssumptionNotes,
            creditsUsedAfter: entRow.aiCreditsUsedThisMonth,
            engineMode: 'smart-synthesizer',
          };
        }

        customByokKey = entRow.customApiKeyEncrypted;
      }
    } catch {
      // Continue if DB check fails in offline preview
    }
  }

  const activeApiKey = hasConfiguredGeminiKey(customByokKey);
  let segmentsResult: MarketSizingSegmentEntry[] | null = null;
  let multiplierResult: WiderMarketScalePreset = '5X';
  let notesResult = '';
  let engineMode: 'gemini-2.5-flash' | 'smart-synthesizer' = 'smart-synthesizer';
  let inputTokensCount = 210;
  let outputTokensCount = 310;

  if (activeApiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: activeApiKey });
      const marketsText =
        params.targetMarketsArray.length > 0
          ? params.targetMarketsArray.join(', ')
          : countryPack.countryName;
      const shouldUseTwoGroups = (params.buyerTypes?.length || 0) > 1;

      const userPrompt = `
You are the "Supportive Co-Founder & Plain-English Market Sizing Coach" inside Build My Unicorn 2.0.
Estimate realistic bottom-up customer counts and annual/monthly pricing in ${countryPack.defaultCurrency} for this startup in [${marketsText}].
${shouldUseTwoGroups ? 'Because the founder selected multiple customer models, return 2 distinct customer groups (for example: Group 1 for individual users/customers, and Group 2 for business/institutional/accelerator customers).' : 'Return 1 or 2 clear customer groups.'}

Startup Name: ${params.planTitle}
Industry Category: ${params.industryCategory}
Customer Models Selected: ${params.buyerTypes?.join(', ') || 'Not specified'}
Target Customer Description: ${params.targetCustomerDescription || '(not specified yet)'}
Raw Idea Notes: ${params.brainDumpText || '(not specified yet)'}

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
        '[BMU AI Router] Module B Market Sizing Gemini call failed, using smart synthesizer fallback:',
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

  if (isUuid && params.userId) {
    try {
      const [updatedEnt] = await db
        .update(userEntitlements)
        .set({
          aiCreditsUsedThisMonth: sql`${userEntitlements.aiCreditsUsedThisMonth} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(userEntitlements.userId, params.userId))
        .returning();

      if (updatedEnt) {
        creditsUsedAfter = updatedEnt.aiCreditsUsedThisMonth;
      }

      const isPlanUuid =
        params.planId &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          params.planId
        );

      await db.insert(aiUsageLogs).values({
        userId: params.userId,
        planId: isPlanUuid ? params.planId : null,
        promptKey: 'MOD_B_MARKET_SIZING',
        modelUsed: engineMode,
        inputTokens: inputTokensCount,
        outputTokens: outputTokensCount,
        usedByokKey: Boolean(customByokKey),
      });
    } catch {
      // Ignore logging error in offline fallback
    }
  }

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
  const isUuid =
    params.userId &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      params.userId
    );

  let customByokKey: string | null = null;
  let creditsUsedAfter = 0;

  if (isUuid && params.userId) {
    try {
      const [ent] = await db
        .select()
        .from(userEntitlements)
        .where(eq(userEntitlements.userId, params.userId))
        .limit(1);

      if (ent) {
        const snapshot: EntitlementSnapshot = {
          userId: ent.userId,
          planType: ent.planType,
          stackedCodesCount: ent.stackedCodesCount,
          maxStartupPlans: ent.maxStartupPlans,
          maxSeatsPerPlan: ent.maxSeatsPerPlan,
          monthlyAiCreditsLimit: ent.monthlyAiCreditsLimit,
          aiCreditsUsedThisMonth: ent.aiCreditsUsedThisMonth,
          whiteLabelExportEnabled: ent.whiteLabelExportEnabled,
          customApiKeyEncrypted: ent.customApiKeyEncrypted,
          accessExpiresAt: ent.accessExpiresAt,
          isVaultReadonly: ent.isVaultReadonly,
        };

        const check = canConsumeAiCredits(snapshot, 1);
        if (!check.allowed) {
          const fallback = buildSmartFallbackCompetitiveEdge(params);
          return {
            allowed: false,
            reason: check.reason,
            ...fallback,
            creditsUsedAfter: ent.aiCreditsUsedThisMonth,
            engineMode: 'smart-synthesizer',
          };
        }
        customByokKey = ent.customApiKeyEncrypted;
        creditsUsedAfter = ent.aiCreditsUsedThisMonth;
      }
    } catch {
      // Offline / local fallback
    }
  }

  const apiKey = customByokKey || process.env.GEMINI_API_KEY;
  let engineMode: 'gemini-2.5-flash' | 'smart-synthesizer' =
    'smart-synthesizer';
  let resultPayload: ReturnType<typeof buildSmartFallbackCompetitiveEdge> | null =
    null;
  let inputTokensCount = 260;
  let outputTokensCount = 320;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const countryPack = getCountryRulePack(params.hqCountryCode);
      const marketsText =
        params.targetMarketsArray.length > 0
          ? params.targetMarketsArray.join(', ')
          : countryPack.countryName;

      const systemInstruction =
        'You are the Build My Unicorn (BMU) 2.0 Competitive Strategy Co-Founder. Generate a realistic, plain-English competitive comparison matrix, switching friction plan, and 2-sentence competitive edge summary. Never use startup jargon like Beachhead or TAM/SAM/SOM. Always return valid JSON.';

      const userPrompt = `
Startup Title: ${params.planTitle}
Industry Category: ${params.industryCategory}
HQ Country: ${countryPack.countryName} (${params.hqCountryCode})
Target Selling Markets: ${marketsText}
Target Customers: ${params.targetCustomerDescription || 'Not specified yet'}
Known Competitors: ${params.competitorNames.join(', ') || 'Generic alternatives & manual workarounds'}
Founder Idea Context: ${params.brainDumpText || 'Not specified'}

Return JSON with this exact structure:
{
  "comparisonRows": [
    {
      "label": "${params.planTitle} (You)",
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
        '[BMU AI Router] Module B Competitive Edge Gemini call failed, using smart synthesizer fallback:',
        err instanceof Error ? err.message : err
      );
    }
  }

  if (!resultPayload) {
    resultPayload = buildSmartFallbackCompetitiveEdge(params);
  }

  if (isUuid && params.userId) {
    try {
      const [updatedEnt] = await db
        .update(userEntitlements)
        .set({
          aiCreditsUsedThisMonth: sql`${userEntitlements.aiCreditsUsedThisMonth} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(userEntitlements.userId, params.userId))
        .returning();

      if (updatedEnt) {
        creditsUsedAfter = updatedEnt.aiCreditsUsedThisMonth;
      }

      const isPlanUuid =
        params.planId &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          params.planId
        );

      await db.insert(aiUsageLogs).values({
        userId: params.userId,
        planId: isPlanUuid ? params.planId : null,
        promptKey: 'MOD_B_COMPETITIVE_EDGE',
        modelUsed: engineMode,
        inputTokens: inputTokensCount,
        outputTokens: outputTokensCount,
        usedByokKey: Boolean(customByokKey),
      });
    } catch {
      // Ignore logging error in offline fallback
    }
  }

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
  let customByokKey: string | null = null;
  let creditsUsedAfter = 1;

  const isUuid =
    params.userId &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      params.userId
    );

  if (isUuid && params.userId) {
    try {
      const [entRow] = await db
        .select()
        .from(userEntitlements)
        .where(eq(userEntitlements.userId, params.userId))
        .limit(1);

      if (entRow) {
        const snapshot: EntitlementSnapshot = {
          userId: entRow.userId,
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
        };
        const check = canConsumeAiCredits(snapshot, 1);
        if (!check.allowed) {
          const fallback = buildSmartFallbackSurvey(params);
          return {
            allowed: false,
            reason: check.reason,
            ...fallback,
            engineMode: 'smart-synthesizer',
          };
        }
        customByokKey = entRow.customApiKeyEncrypted || null;
        creditsUsedAfter = entRow.aiCreditsUsedThisMonth + 1;
      }
    } catch {
      // Offline fallback
    }
  }

  const activeApiKey = hasConfiguredGeminiKey(customByokKey);
  let resultPayload: {
    title: string;
    introDescription: string;
    waitlistIncentiveText: string;
    questions: SurveyQuestionItem[];
  } | null = null;
  let engineMode: 'gemini-2.5-flash' | 'smart-synthesizer' = 'smart-synthesizer';
  let inputTokensCount = 460;
  let outputTokensCount = 580;

  if (activeApiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: activeApiKey });
      const focusDescriptions = params.focusAreas
        .map((fa) =>
          fa === 'OTHER' && params.otherFocusAreaText?.trim()
            ? `Custom Focus: ${params.otherFocusAreaText.trim()}`
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
- Startup Title: ${params.planTitle}
- Industry: ${params.industryCategory} (${countryPack.countryName}, ${countryPack.defaultCurrency})
- Raw Founder Idea Notes: ${params.brainDumpText || 'Not specified'}
- Core Problem to Validate (Founder's Notes): ${params.coreProblem || ctx.problemSummary}
- Translated Customer Workflow Activity: ${ctx.customerWorkflowGerund}
- Target Customer (Module A): ${params.targetCustomer || ctx.shortPersona}
- Proposed Solution (Context only — DO NOT pitch in questions): ${params.proposedSolution || 'Not specified'}
- Unfair Advantage: ${params.unfairAdvantage || 'Not specified'}

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
- Founder's Specific Angle / Custom Request: ${params.customAiFocusPrompt || 'None'}
- Number of Questions to Generate: ${desiredCount}

CRITICAL PERSPECTIVE & MOM TEST RULES:
1. NEVER COPY-PASTE THE FOUNDER'S RAW NOTES IN QUOTES!
   - ❌ BAD (Robotic copy-paste): 'Thinking back over the past 30 days, how often did you run into frustration around: "Help very early stage founders startups start their startup from idea to startup creation"?'
   - ✅ GOOD (Natural customer perspective): 'Thinking back over the past 30 days of working on your startup idea, which part of turning your concept into a real business has slowed you down the most?'
2. Translate the founder's idea from "Founder Pitch Perspective" (what the founder wants to build/help with) into "Customer Workflow Perspective" (what ${ctx.shortPersona} actually experience when ${ctx.customerWorkflowGerund}).
3. Shape every question and multiple-choice option around the real bottlenecks, tools (${ctx.competitorNames.join(', ')}), frustrations, triggers, and past spending (${ctx.lowBracket} to ${ctx.highBracket}) relevant to this specific idea.
4. NEVER ask "Would you buy/use ${params.planTitle}?" or "Do you think our idea is good?". Ask ONLY about past behavior, current workarounds, real pain intensity, actual money already spent, and a specific "walk me through the last time" open-text story.
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
          systemInstruction: DEFAULT_SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          temperature: 0.35,
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
        '[BMU AI Router] Module C Survey Generation failed, using smart synthesizer fallback:',
        err instanceof Error ? err.message : err
      );
    }
  }

  if (!resultPayload) {
    resultPayload = buildSmartFallbackSurvey(params);
  }

  if (isUuid && params.userId) {
    try {
      await db
        .update(userEntitlements)
        .set({
          aiCreditsUsedThisMonth: sql`${userEntitlements.aiCreditsUsedThisMonth} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(userEntitlements.userId, params.userId));

      const isPlanUuid =
        params.planId &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          params.planId
        );

      await db.insert(aiUsageLogs).values({
        userId: params.userId,
        planId: isPlanUuid ? params.planId : null,
        promptKey: 'MOD_C_GENERATE_SURVEY',
        modelUsed: engineMode,
        inputTokens: inputTokensCount,
        outputTokens: outputTokensCount,
        usedByokKey: Boolean(customByokKey),
      });
    } catch {
      // Ignore logging error in offline fallback
    }
  }

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
  const rawQ = params.questionText.trim();
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

  const activeApiKey = hasConfiguredGeminiKey(null);
  if (activeApiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: activeApiKey });
      const prompt = `Evaluate this customer survey question using Rob Fitzpatrick's "The Mom Test" and shape the rewrite naturally around the customer's real-life workflow (NEVER copy-paste raw founder notes in quotes):
Startup: ${params.planTitle}
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
 * Synthesizes survey responses into a "Signal vs. Polite Noise" Insights Summary.
 */
export async function analyzeModuleCSurveyResultsViaRouter(params: {
  userId?: string;
  planId?: string;
  planTitle: string;
  surveyTitle: string;
  questions: SurveyQuestionItem[];
  responses: SavedSurveyResponse[];
}): Promise<AnalyzeSurveyResultsOutput> {
  const totalResponses = params.responses.length;
  const waitlistLeads = params.responses.filter(
    (r) => r.joinedWaitlist || (r.respondentEmail && r.respondentEmail.includes('@'))
  );

  // Compute quantitative signal from responses
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
          Math.min(totalResponses * 1.5, 12)
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
    if (scaleCount > 0) {
      validatedPainPoints.push(
        `Average pain/urgency rating across scale questions is ${avgScale} / 5.0 (${
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
        `Direct respondent voice: "${openQuotes[0].slice(0, 140)}${openQuotes[0].length > 140 ? '...' : ''}"`
      );
    }
    if (validatedPainPoints.length === 0) {
      validatedPainPoints.push(
        `Collected ${totalResponses} response(s) so far. Share your public /v/[slug] link with at least 10–15 target customers to unlock stronger pattern confidence.`
      );
    }

    const politenessAlertOrRisks: string[] = [];
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
        `Always cross-check open-text stories against what respondents currently spend or do manually—focus your V1 product (Module D) on the respondents who rated pain 4 or 5 out of 5.`
      );
    }

    if (totalResponses < 10) {
      politenessAlertOrRisks.push(
        `Sample Size Note (${totalResponses} responses): Treat early trends as directional signals until you reach 10–20 responses from your core beachhead persona.`
      );
    }

    return {
      headlineTakeaway:
        avgScale >= 3.8
          ? `Strong problem validation (${avgScale}/5 avg urgency & ${waitlistConversionPct}% waitlist opt-in across ${totalResponses} responses).`
          : `Early discovery signal captured (${totalResponses} responses, ${avgScale}/5 avg rating, ${waitlistConversionPct}% waitlist opt-in).`,
      signalScoreOutOf100: computedSignalScore,
      validatedPainPoints,
      politenessAlertOrRisks,
      recommendedNextAction:
        waitlistLeads.length > 0
          ? `Follow up 1-on-1 with the ${waitlistLeads.length} respondent(s) who left their email (${waitlistLeads
              .slice(0, 2)
              .map((l) => l.respondentEmail)
              .filter(Boolean)
              .join(', ')}) and carry their top pain point directly into Module D (V1 Feature Filter).`
          : `Share your no-login survey link in 2–3 niche communities where your target customers hang out to capture your first 5 waitlist leads.`,
      topWaitlistLeadAdvice:
        waitlistLeads.length > 0
          ? `${waitlistLeads.length} of ${totalResponses} respondents (${waitlistConversionPct}%) opted into your early-bird waitlist. Prioritize contacting those who scored 4–5/5 on pain intensity first.`
          : 'No waitlist emails captured yet — make sure "Collect Early-Bird Waitlist Emails" is enabled on your survey.',
      lastAnalyzedAt: new Date().toISOString(),
      aiEngineUsed: 'smart-synthesizer',
    };
  };

  const activeApiKey = hasConfiguredGeminiKey(null);
  if (activeApiKey && totalResponses > 0) {
    try {
      const ai = new GoogleGenAI({ apiKey: activeApiKey });
      const fallback = buildSmartFallbackInsights();
      const prompt = `Analyze these customer validation survey results using Rob Fitzpatrick's "The Mom Test" (Signal vs. Polite Noise):
Startup: ${params.planTitle}
Survey: ${params.surveyTitle}
Total Responses: ${totalResponses}
Waitlist Opt-Ins: ${waitlistLeads.length} (${waitlistConversionPct}%)
Average 1-5 Scale Score: ${avgScale} / 5.0
Top Option Tallies: ${JSON.stringify(optionTallies)}
Sample Verbatim Open-Text Answers: ${JSON.stringify(openQuotes.slice(0, 8))}

Return JSON matching:
{
  "headlineTakeaway": "1 crisp sentence summarizing the validation signal",
  "signalScoreOutOf100": number (0-100),
  "validatedPainPoints": ["3 specific insights backed by the percentages and quotes"],
  "politenessAlertOrRisks": ["2 Mom-Test blind-spot warnings or false-positive checks"],
  "recommendedNextAction": "Concrete next step for the founder in Module D (Product) and Module F (Pricing)",
  "topWaitlistLeadAdvice": "1 sentence on how to convert the waitlist leads"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });
      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text) as Partial<SurveyAiInsightsSummary>;
        if (parsed.headlineTakeaway && Array.isArray(parsed.validatedPainPoints)) {
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

