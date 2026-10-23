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
1. Never criticize the founder's raw idea upfront. Extract and structure their vision into a clear, investor-ready 5-Block "1-Page Mirror" Concept Canvas.
2. Second, generate 3 constructive, encouraging "Things to Consider" blind spots (operational realities, industry traps, or validation questions) framed as supportive coaching prompts.`;

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
 * Smart deterministic synthesizer used when GEMINI_API_KEY is not yet set in .env,
 * ensuring Module A works 100% reliably out-of-the-box and uses the founder's actual inputs & country rules.
 */
function buildSmartFallbackSynthesis(params: {
  planTitle: string;
  brainDumpText: string;
  industryCategory: string;
  hqCountryCode: SupportedCountryCode;
  exportPotential: 'DOMESTIC_ONLY' | 'EXPORTING_INTERNATIONALLY';
}): { canvas: ConceptCanvasBlocks; thingsToConsider: BlindSpotItem[] } {
  const countryPack = getCountryRulePack(params.hqCountryCode);
  const grants = getGrantsForCountry(params.hqCountryCode);
  const topGrant = grants[0]?.grantName || 'National Innovation Support';
  const raw = params.brainDumpText.trim();

  // Extract sentences from the founder's raw brain dump
  const sentences = raw
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const firstSentence =
    sentences[0] ||
    `Customers in ${params.industryCategory} face manual workflow bottlenecks, wasted time, and hidden margin loss.`;
  const secondSentence =
    sentences.slice(1).join(' ') ||
    `${params.planTitle} automates the core workflow so buyers get measurable ROI within their first 30 days.`;

  const benchmarkPrice =
    params.industryCategory.includes('SaaS') ||
    params.industryCategory.includes('Service')
      ? formatPlanCurrency(299, countryPack.defaultCurrency) + '/month recurring'
      : formatPlanCurrency(85, countryPack.defaultCurrency) +
        ' average order value';

  const canvas: ConceptCanvasBlocks = {
    coreProblem: firstSentence,
    targetCustomer: `Decision-makers in ${params.industryCategory} starting in ${countryPack.countryName} (${
      params.exportPotential === 'EXPORTING_INTERNATIONALLY'
        ? 'with international export expansion to UK/EU/US'
        : `focused on the domestic ${countryPack.countryName} market`
    }).`,
    proposedSolution: `${params.planTitle}: ${secondSentence}`,
    unfairAdvantage: `Built specifically for ${params.industryCategory} operators with zero-friction onboarding, localized ${countryPack.countryName} compliance (${countryPack.taxName} ${countryPack.standardTaxRatePercent}%), and fast time-to-value.`,
    revenueAndGrantFit: `Priced in ${countryPack.defaultCurrency} (benchmark: ${benchmarkPrice}). Positioned to explore ${topGrant} (${
      grants[0]?.maxAmountFormatted || 'Co-funded support'
    }).`,
    lastSynthesizedAt: new Date().toISOString(),
    aiEngineUsed: 'smart-synthesizer',
  };

  const thingsToConsider: BlindSpotItem[] = [
    {
      id: `bs-${Date.now()}-1`,
      category: 'OPERATIONAL_REALITY',
      severity: 'INFO',
      title: '🔌 1. Integration & Day-1 Onboarding Friction',
      explanation: `In ${params.industryCategory}, buyers rarely rip-and-replace their existing tools on Day 1. Can a customer test ${params.planTitle} in under 15 minutes using a simple CSV upload, WhatsApp alert, or lightweight plugin before full system integration?`,
      suggestedAction: 'Avoids a 6-month engineering bottleneck before proving customer willingness to pay.',
    },
    {
      id: `bs-${Date.now()}-2`,
      category: 'INDUSTRY_TRAP',
      severity: 'WARNING',
      title: `🎯 2. Who Holds the Budget in ${countryPack.countryName}?`,
      explanation: `Make sure the person feeling the daily pain is also the person authorized to sign off on ${benchmarkPrice}. How much money or staff time does the buyer lose every single week by doing nothing?`,
      suggestedAction: 'Test ROI directly with the budget owner in Module B.',
    },
    {
      id: `bs-${Date.now()}-3`,
      category: 'OPEN_QUESTION',
      severity: 'INFO',
      title: `🏛️ 3. Grant & Cashflow Timing (${topGrant})`,
      explanation: `${
        grants[0]?.reimbursementWarning ||
        'Most government grants reimburse vouchered expenditure after you spend the cash.'
      } Can you validate 5 paying pilot customers before relying on grant funding?`,
      suggestedAction: `Highlight international export scalability from ${countryPack.countryName} early in Module B.`,
    },
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
      const userPrompt = `
Founder Startup Title: ${params.planTitle}
Industry Category: ${params.industryCategory}
Home Country & Currency: ${countryPack.countryName} (${countryPack.defaultCurrency})
Indirect Tax: ${countryPack.taxName} (${countryPack.standardTaxRatePercent}%)
Export Ambition: ${params.exportPotential}
Matched Local Grants: ${grants.map((g) => `${g.grantName} (${g.maxAmountFormatted})`).join('; ')}

Founder's Raw Brain Dump:
"""
${params.brainDumpText}
"""

Return STRICT JSON matching this exact shape (no markdown fences):
{
  "coreProblem": "2 concise sentences describing the painful customer problem and what it costs them.",
  "targetCustomer": "2 concise sentences identifying the exact beachhead buyer in ${countryPack.countryName} and expansion market.",
  "proposedSolution": "2 concise sentences explaining how ${params.planTitle} solves the problem simply.",
  "unfairAdvantage": "2 concise sentences on why this wins against status-quo manual workarounds.",
  "revenueAndGrantFit": "2 concise sentences on pricing in ${countryPack.defaultCurrency} and fit for ${grants[0]?.grantName || 'local grants'}.",
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
