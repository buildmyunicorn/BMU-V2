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
import type { SavedFounderMotivation } from '@/lib/auth/session-store';

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

  const mot = params.founderMotivation?.primaryMotivation || 'LEAVE_JOB';
  const motivationBlindSpot: BlindSpotItem =
    mot === 'SIDE_HUSTLE'
      ? {
          id: `bs-${Date.now()}-3`,
          category: 'OPERATIONAL_REALITY',
          severity: 'INFO',
          title: '🌱 3. Protecting Your Evening & Weekend Time',
          explanation:
            'Because you are building this as a side hustle alongside your main commitments, make sure customers can buy and use the product without needing live daytime phone support.',
          suggestedAction:
            'Design self-serve onboarding or automated scheduling from Day 1.',
        }
      : mot === 'SAVE_THE_WORLD'
        ? {
            id: `bs-${Date.now()}-3`,
            category: 'OPEN_QUESTION',
            severity: 'INFO',
            title: '🌍 3. Fueling Your Mission with Sustainable Revenue',
            explanation:
              'Mission-driven businesses make the biggest impact when they are financially self-sustaining. Who has the budget to pay for this today so your mission can grow without running out of cash?',
            suggestedAction: `Explore both paying pilot customers and ${topGrant} support.`,
          }
        : mot === 'SCALE_STARTUP'
          ? {
              id: `bs-${Date.now()}-3`,
              category: 'OPEN_QUESTION',
              severity: 'INFO',
              title: `🚀 3. High-Growth & Grant Readiness (${topGrant})`,
              explanation: `${
                grants[0]?.reimbursementWarning ||
                'Investors and grant agencies look for repeatable customer acquisition and international export potential.'
              } Can you line up 5 paying pilot customers to prove demand early?`,
              suggestedAction: `Highlight export scalability beyond ${countryPack.countryName} in Module B.`,
            }
          : mot === 'BUILD_TO_SELL'
            ? {
                id: `bs-${Date.now()}-3`,
                category: 'OPERATIONAL_REALITY',
                severity: 'INFO',
                title: '🏆 3. Building an Asset Someone Can Buy',
                explanation:
                  'Acquirers buy businesses that run without the founder doing every job personally. From Day 1, aim for recurring contracts and documented processes rather than one-off personal favours.',
                suggestedAction:
                  'Design the business so a future buyer can step in and run it smoothly.',
              }
            : {
              id: `bs-${Date.now()}-3`,
              category: 'OPEN_QUESTION',
              severity: 'INFO',
              title: '🏃 3. Your Path to Replacing Your 9-to-5 Income',
              explanation: `To safely leave your job, recurring monthly revenue is your best friend. How many paying customers at ${benchmarkPrice} would you need to cover your core monthly living expenses?`,
              suggestedAction:
                'Focus on fast-paying customers with a short sales cycle in Module B.',
            };

  const thingsToConsider: BlindSpotItem[] = [
    {
      id: `bs-${Date.now()}-1`,
      category: 'OPERATIONAL_REALITY',
      severity: 'INFO',
      title: '🔌 1. Keep Day-1 Setup Simple',
      explanation: `In ${params.industryCategory}, buyers rarely rip-and-replace their existing tools on Day 1. Can a customer test ${params.planTitle} in under 15 minutes before any complex setup?`,
      suggestedAction: 'Avoids a 6-month build before proving customer willingness to pay.',
    },
    {
      id: `bs-${Date.now()}-2`,
      category: 'INDUSTRY_TRAP',
      severity: 'WARNING',
      title: `🎯 2. Who Holds the Budget in ${countryPack.countryName}?`,
      explanation: `Make sure the person feeling the daily pain is also the person authorized to sign off on ${benchmarkPrice}. How much money or time does the buyer lose every week by doing nothing?`,
      suggestedAction: 'Test ROI directly with the budget owner in Module B.',
    },
    motivationBlindSpot,
  ];

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
