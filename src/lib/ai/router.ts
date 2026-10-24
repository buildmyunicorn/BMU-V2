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
