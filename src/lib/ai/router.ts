import { GoogleGenAI, Type } from '@google/genai';
import { eq, sql } from 'drizzle-orm';
import {
  db,
  userEntitlements,
  aiUsageLogs,
  type BlindSpotItem,
} from '@/db';

export type AIModelTier = 'FAST_EXTRACTION' | 'DEEP_AUDIT';

export interface AIRouterCallOptions {
  userId?: string;
  planId?: string;
  promptKey: string;
  tier?: AIModelTier;
  systemInstruction: string;
  userPrompt: string;
  responseSchema?: Record<string, unknown>;
}

export interface ModuleACanvasSynthesisInput {
  userId?: string;
  planId?: string;
  planTitle: string;
  industryCategory: string;
  hqCountryCode: string;
  baseCurrency: string;
  exportPotential: boolean;
  brainDumpText: string;
}

export interface ModuleACanvasSynthesisResult {
  usedLiveVertexAi: boolean;
  modelUsed: string;
  oneLinerSummary: string;
  canvas: {
    coreProblem: string;
    targetCustomer: string;
    solution: string;
    unfairEdge: string;
    revenueAndGrantFit: string;
  };
  blindSpots: BlindSpotItem[];
  recommendedComparatorScores: {
    easeOfLaunch: number;
    founderFit: number;
    timeToRevenue: number;
    capitalRequired: number;
  };
  tokensUsed?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Instantiates the GoogleGenAI client configured for Vertex AI.
 * Supports:
 * 1. User BYOK API key (if AppSumo Tier 3 / configured)
 * 2. Vertex AI Express API Key (`VERTEX_API_KEY` / `GOOGLE_API_KEY` starting with `AQ.`)
 * 3. Standard Vertex AI Application Default Credentials (`project: bmu-v3`, `location: europe-west1`)
 */
function createVertexGenAIClient(customByokKey?: string | null): {
  client: GoogleGenAI;
  usedByokKey: boolean;
} {
  if (customByokKey && customByokKey.trim().length > 10) {
    return {
      client: new GoogleGenAI({
        vertexai: false,
        apiKey: customByokKey.trim(),
      }),
      usedByokKey: true,
    };
  }

  const vertexApiKey =
    process.env.VERTEX_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_API_KEY;

  // Vertex AI Express Mode with API Key (note: project/location and apiKey are mutually exclusive in @google/genai)
  if (
    vertexApiKey &&
    vertexApiKey !== 'your_gemini_api_key_here' &&
    vertexApiKey.trim().length > 10
  ) {
    return {
      client: new GoogleGenAI({
        vertexai: true,
        apiKey: vertexApiKey.trim(),
      }),
      usedByokKey: false,
    };
  }

  // Standard GCP Service Account / Cloud Run ADC
  return {
    client: new GoogleGenAI({
      vertexai: true,
      project: process.env.GOOGLE_CLOUD_PROJECT || 'bmu-v3',
      location: process.env.GOOGLE_CLOUD_LOCATION || 'europe-west1',
    }),
    usedByokKey: false,
  };
}

/**
 * Checks user AI credit guardrails in PostgreSQL (if userId is valid UUID and DB is connected).
 */
async function checkUserAiEntitlement(userId?: string): Promise<{
  allowed: boolean;
  customApiKey?: string | null;
  reason?: string;
}> {
  if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    return { allowed: true };
  }

  try {
    const [entitlement] = await db
      .select()
      .from(userEntitlements)
      .where(eq(userEntitlements.userId, userId))
      .limit(1);

    if (!entitlement) {
      return { allowed: true };
    }

    if (entitlement.isVaultReadonly) {
      return {
        allowed: false,
        reason: 'Your workspace is in Read-Only Vault Mode. Renew your pass to run AI synthesis.',
      };
    }

    if (
      !entitlement.customApiKeyEncrypted &&
      entitlement.aiCreditsUsedThisMonth >= entitlement.monthlyAiCreditsLimit
    ) {
      return {
        allowed: false,
        reason: `Monthly AI credit limit reached (${entitlement.aiCreditsUsedThisMonth}/${entitlement.monthlyAiCreditsLimit}). Upgrade or add your BYOK API key.`,
      };
    }

    return {
      allowed: true,
      customApiKey: entitlement.customApiKeyEncrypted,
    };
  } catch {
    // Graceful fallback if DB is not yet reachable during local preview
    return { allowed: true };
  }
}

/**
 * Logs token usage to `ai_usage_logs` and increments `user_entitlements.ai_credits_used_this_month`.
 */
async function recordAiTelemetry(params: {
  userId?: string;
  planId?: string;
  promptKey: string;
  modelUsed: string;
  inputTokens: number;
  outputTokens: number;
  usedByokKey: boolean;
}) {
  const isUuid = (val?: string) =>
    Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

  try {
    await db.insert(aiUsageLogs).values({
      userId: isUuid(params.userId) ? params.userId! : null,
      planId: isUuid(params.planId) ? params.planId! : null,
      promptKey: params.promptKey,
      modelUsed: params.modelUsed,
      inputTokens: params.inputTokens,
      outputTokens: params.outputTokens,
      usedByokKey: params.usedByokKey,
    });

    if (isUuid(params.userId) && !params.usedByokKey) {
      await db
        .update(userEntitlements)
        .set({
          aiCreditsUsedThisMonth: sql`${userEntitlements.aiCreditsUsedThisMonth} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(userEntitlements.userId, params.userId!));
    }
  } catch {
    // Non-blocking telemetry if DB is not yet provisioned
  }
}

/**
 * Module A: Calls Vertex AI (`gemini-2.5-flash`) to turn the founder's raw Brain Dump
 * into the 5-Block 1-Page Mirror Canvas + 3 Constructive "Things to Consider" Blind Spots.
 */
export async function generateModuleACanvasAndBlindSpots(
  input: ModuleACanvasSynthesisInput
): Promise<ModuleACanvasSynthesisResult> {
  const guardrail = await checkUserAiEntitlement(input.userId);
  if (!guardrail.allowed) {
    throw new Error(guardrail.reason || 'AI credit guardrail triggered.');
  }

  const modelName = 'gemini-2.5-flash';
  const { client, usedByokKey } = createVertexGenAIClient(guardrail.customApiKey);

  const systemInstruction = `You are the "Supportive Co-Founder & Blind-Spot Engine" for Build My Unicorn (BMU) 2.0.
Always follow a "Capture First, Expand Second" philosophy:
1. Never criticize the founder's raw idea upfront. First, extract and structure their vision cleanly into a sharp, investor-ready 1-Page Concept Canvas tailored to their HQ jurisdiction (${input.hqCountryCode}, currency ${input.baseCurrency}).
2. Second, generate 3 constructive, specific "Things to Consider" blind-spot reviews that help them de-risk customer validation, unit economics, and non-dilutive grant eligibility (such as LEO Feasibility / Enterprise Ireland HPSU in IE, SEIS/EIS/Innovate UK in GB, SBIR in US, EMDG in AU, SR&ED in CA, or EIC in EU).`;

  const userPrompt = `Synthesize this startup's Module A Brain Dump into a structured 1-Page Mirror Canvas and 3 "Things to Consider" blind spots:

- Startup Name: ${input.planTitle}
- Industry Sector: ${input.industryCategory}
- HQ Country Code: ${input.hqCountryCode} (${input.baseCurrency})
- International Export / Scalable Focus: ${input.exportPotential ? 'Yes (High-Potential / Export-Oriented)' : 'Domestic / Local Service'}
- Founder's Raw Brain Dump:
"""
${input.brainDumpText}
"""`;

  try {
    const response = await client.models.generateContent({
      model: modelName,
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.35,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            oneLinerSummary: {
              type: Type.STRING,
              description: 'Crisp 1-sentence elevator pitch under 160 characters.',
            },
            canvas: {
              type: Type.OBJECT,
              properties: {
                coreProblem: {
                  type: Type.STRING,
                  description: 'Specific customer pain point and quantified cost of inaction.',
                },
                targetCustomer: {
                  type: Type.STRING,
                  description: 'Primary beachhead customer persona and buyer trigger.',
                },
                solution: {
                  type: Type.STRING,
                  description: 'How the product solves the pain 10x faster or better.',
                },
                unfairEdge: {
                  type: Type.STRING,
                  description: 'Defensible moat, workflow lock-in, or founder advantage.',
                },
                revenueAndGrantFit: {
                  type: Type.STRING,
                  description: `Pricing model in ${input.baseCurrency} and specific ${input.hqCountryCode} non-dilutive grant fit.`,
                },
              },
              required: [
                'coreProblem',
                'targetCustomer',
                'solution',
                'unfairEdge',
                'revenueAndGrantFit',
              ],
            },
            blindSpots: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  category: { type: Type.STRING },
                  severity: {
                    type: Type.STRING,
                    enum: ['INFO', 'WARNING', 'CRITICAL'],
                  },
                  explanation: { type: Type.STRING },
                  suggestedAction: { type: Type.STRING },
                },
                required: [
                  'id',
                  'title',
                  'category',
                  'severity',
                  'explanation',
                  'suggestedAction',
                ],
              },
            },
            recommendedComparatorScores: {
              type: Type.OBJECT,
              properties: {
                easeOfLaunch: { type: Type.INTEGER },
                founderFit: { type: Type.INTEGER },
                timeToRevenue: { type: Type.INTEGER },
                capitalRequired: { type: Type.INTEGER },
              },
              required: [
                'easeOfLaunch',
                'founderFit',
                'timeToRevenue',
                'capitalRequired',
              ],
            },
          },
          required: [
            'oneLinerSummary',
            'canvas',
            'blindSpots',
            'recommendedComparatorScores',
          ],
        },
      },
    });

    const rawText = response.text || '{}';
    const parsed = JSON.parse(rawText);

    const inputTokens = response.usageMetadata?.promptTokenCount ?? 280;
    const outputTokens = response.usageMetadata?.candidatesTokenCount ?? 420;

    await recordAiTelemetry({
      userId: input.userId,
      planId: input.planId,
      promptKey: 'MOD_A_CONCEPT_CANVAS',
      modelUsed: modelName,
      inputTokens,
      outputTokens,
      usedByokKey,
    });

    return {
      usedLiveVertexAi: true,
      modelUsed: modelName,
      oneLinerSummary: parsed.oneLinerSummary || `${input.planTitle} — ${input.industryCategory}`,
      canvas: {
        coreProblem: parsed.canvas?.coreProblem || input.brainDumpText,
        targetCustomer: parsed.canvas?.targetCustomer || `Target buyers in ${input.hqCountryCode}`,
        solution: parsed.canvas?.solution || `${input.planTitle} core platform`,
        unfairEdge: parsed.canvas?.unfairEdge || 'Domain-specific workflow automation',
        revenueAndGrantFit:
          parsed.canvas?.revenueAndGrantFit ||
          `Recurring revenue in ${input.baseCurrency}; eligible for ${input.hqCountryCode} startup supports.`,
      },
      blindSpots: Array.isArray(parsed.blindSpots) ? parsed.blindSpots : [],
      recommendedComparatorScores: {
        easeOfLaunch: Number(parsed.recommendedComparatorScores?.easeOfLaunch) || 7,
        founderFit: Number(parsed.recommendedComparatorScores?.founderFit) || 8,
        timeToRevenue: Number(parsed.recommendedComparatorScores?.timeToRevenue) || 8,
        capitalRequired: Number(parsed.recommendedComparatorScores?.capitalRequired) || 7,
      },
      tokensUsed: {
        inputTokens,
        outputTokens,
      },
    };
  } catch (err) {
    console.warn('[BMU Vertex AI Router] Falling back to deterministic synthesis:', err);
    return {
      usedLiveVertexAi: false,
      modelUsed: 'gemini-2.5-flash (fallback)',
      oneLinerSummary: `${input.planTitle}: ${input.brainDumpText.slice(0, 120)}...`,
      canvas: {
        coreProblem:
          input.brainDumpText.slice(0, 220) ||
          'Target customers lose hours every week to fragmented manual workflows.',
        targetCustomer: `Primary decision-makers in ${input.industryCategory} operating in ${input.hqCountryCode}${input.exportPotential ? ' and international export markets' : ''}.`,
        solution: `${input.planTitle} automates the core workflow into a streamlined, high-ROI platform.`,
        unfairEdge: `Purpose-built ${input.industryCategory} domain workflows with local ${input.hqCountryCode} compliance built in.`,
        revenueAndGrantFit: `Recurring B2B subscription in ${input.baseCurrency}. Strong alignment with ${input.hqCountryCode} early-stage innovation supports.`,
      },
      blindSpots: [
        {
          id: 'bs-live-1',
          title: 'Quantify the Beachhead Buyer Switching Trigger',
          category: 'Customer Validation',
          severity: 'WARNING',
          explanation:
            'Even when a workflow is painful, buyers rarely switch tools unless a specific compliance deadline, revenue loss, or audit event forces action.',
          suggestedAction:
            'Park an open question to interview 5 target buyers in Module B using The Mom Test.',
        },
        {
          id: 'bs-live-2',
          title: `${input.hqCountryCode} Grant Reimbursement Cashflow Timing`,
          category: 'Grants & Runway',
          severity: 'INFO',
          explanation:
            'Most government feasibility and R&D grants reimburse 50%–100% of vouched expenditure only after invoices are paid.',
          suggestedAction:
            'Ensure your initial 90-day pilot budget does not depend on grant cash arriving before customer validation.',
        },
      ],
      recommendedComparatorScores: {
        easeOfLaunch: 7,
        founderFit: 9,
        timeToRevenue: 8,
        capitalRequired: 7,
      },
    };
  }
}

/**
 * Context-aware "Ask Unicorn" Sidekick & "I'm Stuck" Micro-Coach powered by Vertex AI (`gemini-2.5-flash`).
 */
export async function askUnicornCoPilot(params: {
  userId?: string;
  planId?: string;
  planTitle: string;
  hqCountryCode: string;
  baseCurrency: string;
  currentModuleStep: string;
  brainDumpText: string;
  founderQuestion: string;
}): Promise<{
  reply: string;
  suggestedSnippet?: string;
  usedLiveVertexAi: boolean;
}> {
  const guardrail = await checkUserAiEntitlement(params.userId);
  if (!guardrail.allowed) {
    return {
      reply: guardrail.reason || 'AI credit limit reached.',
      usedLiveVertexAi: false,
    };
  }

  const modelName = 'gemini-2.5-flash';
  const { client, usedByokKey } = createVertexGenAIClient(guardrail.customApiKey);

  try {
    const response = await client.models.generateContent({
      model: modelName,
      contents: `Active Startup Plan: "${params.planTitle}"
HQ Country: ${params.hqCountryCode} (${params.baseCurrency})
Current Step: ${params.currentModuleStep}
Founder's Current Draft: """${params.brainDumpText}"""

Founder's Question: "${params.founderQuestion}"`,
      config: {
        systemInstruction: `You are "Ask Unicorn", the supportive AI Co-Founder inside Build My Unicorn (BMU) 2.0.
Give a concise, encouraging, highly practical answer (3-5 sentences max) tailored to ${params.hqCountryCode} (${params.baseCurrency}).
Also provide a ready-to-insert 1-2 sentence snippet the founder can paste directly into their plan if helpful.`,
        temperature: 0.4,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING },
            suggestedSnippet: { type: Type.STRING },
          },
          required: ['reply'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    await recordAiTelemetry({
      userId: params.userId,
      planId: params.planId,
      promptKey: 'ASK_UNICORN_SIDEKICK',
      modelUsed: modelName,
      inputTokens: response.usageMetadata?.promptTokenCount ?? 180,
      outputTokens: response.usageMetadata?.candidatesTokenCount ?? 160,
      usedByokKey,
    });

    return {
      reply:
        parsed.reply ||
        'Focus on naming the exact buyer role, how many hours or currency units they lose each week, and why existing spreadsheets fail them.',
      suggestedSnippet: parsed.suggestedSnippet,
      usedLiveVertexAi: true,
    };
  } catch (err) {
    console.warn('[BMU Ask Unicorn] Fallback response:', err);
    return {
      reply: `For ${params.planTitle} (${params.hqCountryCode}), anchor your answer on one specific customer segment and quantify the time or ${params.baseCurrency} cost they lose every month before adopting your solution.`,
      suggestedSnippet: `We help ${params.planTitle} customers in ${params.hqCountryCode} eliminate costly manual bottlenecks and recover measurable ${params.baseCurrency} margin within 30 days.`,
      usedLiveVertexAi: false,
    };
  }
}
