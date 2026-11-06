'use server';

import { db, grantsDirectory } from '@/db';
import { eq, desc } from 'drizzle-orm';
import { getAdminSessionCookie } from '@/lib/auth/server-auth';
import { GoogleGenAI, Type } from '@google/genai';
import { ensureDefaultGrantsSeededInDb } from '@/lib/grants/ensure-grants';
import {
  authorizeAndPrepareGeminiCall,
  recordGeminiUsageAndIncrementCredits,
  sanitizePromptInput,
} from '@/lib/ai/router';

function getGenAiClient(apiKey: string): GoogleGenAI {
  const isVertex =
    process.env.GOOGLE_GENAI_USE_VERTEXAI === 'true' ||
    process.env.VERTEX_AI === 'true';

  if (isVertex) {
    if (apiKey && apiKey !== 'VERTEX_AI_ACTIVE') {
      return new GoogleGenAI({ apiKey });
    }
    return new GoogleGenAI({
      vertexai: true,
      project: process.env.GOOGLE_CLOUD_PROJECT || 'startuppreflight',
      location: process.env.GOOGLE_CLOUD_LOCATION || 'europe-west1',
    });
  }

  return new GoogleGenAI({ apiKey: apiKey || process.env.GEMINI_API_KEY || '' });
}

export type GrantDirectoryRecord = typeof grantsDirectory.$inferSelect;

export interface ExtractedGrantResult {
  slug: string;
  countryCode: string;
  grantName: string;
  providerAgency: string;
  fundingType: string;
  currency: string;
  maxAmountFormatted: string;
  maxFundingAmount: number;
  matchRatePercentage: number;
  isRepayable: boolean;
  minEmployees: number;
  maxEmployees: number;
  maxTradingMonths?: number;
  stageFit: string;
  turnaroundLabel: string;
  turnaroundSpeed: string;
  leoThreeQuoteEnforced: boolean;
  summary: string;
  descriptionMarkdown: string;
  eligibleCosts: string[];
  ineligibleCosts: string[];
  applicationRequirements: string[];
  disqualificationRedFlags: string[];
  reimbursementWarning: string;
  officialUrl: string;
  confidenceScore: number;
  sourceSnippets: string[];
}

export async function listAdminGrantsAction(): Promise<{
  success: boolean;
  grants: GrantDirectoryRecord[];
  error?: string;
}> {
  try {
    const adminSession = await getAdminSessionCookie();
    if (!adminSession) {
      return { success: false, grants: [], error: 'Unauthorized admin session' };
    }

    await ensureDefaultGrantsSeededInDb();

    const grants = await db
      .select()
      .from(grantsDirectory)
      .orderBy(desc(grantsDirectory.createdAt));

    return { success: true, grants };
  } catch (err: unknown) {
    console.error('[AdminGrants] Error listing grants:', err);
    return { success: false, grants: [], error: 'Failed to retrieve grants list' };
  }
}

export async function aiExtractGrantFromPromptAction(input: {
  prompt: string;
  officialUrl?: string;
}): Promise<{
  success: boolean;
  grant?: ExtractedGrantResult;
  error?: string;
}> {
  try {
    const adminSession = await getAdminSessionCookie();
    if (!adminSession || adminSession.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Unauthorized: Super Admin session required' };
    }

    const authCtx = await authorizeAndPrepareGeminiCall(
      'ADMIN_GRANT_EXTRACT',
      'You are a Senior Government Grant Assessor & Enterprise Auditor.'
    );
    if (!authCtx.canCallLiveGemini || !authCtx.activeApiKey) {
      return {
        success: false,
        error:
          authCtx.blockReason ||
          'AI Billing Firewall active (daily platform limit or burst limit reached). Please try again shortly.',
      };
    }

    const ai = getGenAiClient(authCtx.activeApiKey);

    const systemInstruction = `You are a Senior Government Grant Assessor & Enterprise Auditor for Ireland (LEO, Enterprise Ireland, Revenue) and the United Kingdom (Innovate UK, British Business Bank, HMRC).
Your task is to take a natural language request or grant URL from an administrator and extract the complete, rigorous scheme specifications into a structured JSON schema.
Be realistic, accurate with statutory funding rules, and highlight strict assessor disqualification rules (e.g. LEO three-quote rules, laptop exclusions, de minimis state aid).`;

    const cleanPrompt = sanitizePromptInput(input.prompt, 1200);
    const cleanUrl = input.officialUrl ? sanitizePromptInput(input.officialUrl, 300) : '';

    const userPrompt = `Extract and structure the complete grant specification for this scheme:
Prompt / Request: "${cleanPrompt}"
${cleanUrl ? `Official Scheme URL: ${cleanUrl}` : ''}

Be precise with:
- Country Code ('IE' for Ireland, 'GB' for UK, 'ALL' for international)
- Max funding amount numeric and formatted
- Co-funding / match rate percentage (e.g. 50 for 50%)
- Whether it is a cash grant, loan, tax relief, or voucher
- High-priority list of eligible costs and strictly ineligible costs
- Common traps and disqualification red flags`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.2,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            slug: { type: Type.STRING, description: 'kebab-case URL slug e.g. ie-leo-priming-grant' },
            countryCode: { type: Type.STRING, description: 'IE or GB or ALL' },
            grantName: { type: Type.STRING },
            providerAgency: { type: Type.STRING },
            fundingType: { type: Type.STRING, description: 'GRANT, LOAN, TAX_RELIEF, VOUCHER, or R_AND_D_CREDIT' },
            currency: { type: Type.STRING, description: 'EUR or GBP' },
            maxAmountFormatted: { type: Type.STRING, description: 'e.g. Up to €150,000 (50% match)' },
            maxFundingAmount: { type: Type.INTEGER, description: 'Maximum numeric cap e.g. 150000' },
            matchRatePercentage: { type: Type.INTEGER, description: 'e.g. 50 or 70 or 100' },
            isRepayable: { type: Type.BOOLEAN },
            minEmployees: { type: Type.INTEGER },
            maxEmployees: { type: Type.INTEGER },
            maxTradingMonths: { type: Type.INTEGER },
            stageFit: { type: Type.STRING },
            turnaroundLabel: { type: Type.STRING, description: 'e.g. 4–6 Weeks Turnaround' },
            turnaroundSpeed: { type: Type.STRING },
            leoThreeQuoteEnforced: { type: Type.BOOLEAN },
            summary: { type: Type.STRING, description: '2 sentence plain-English summary for founders' },
            descriptionMarkdown: { type: Type.STRING, description: 'Detailed 2-3 paragraph overview' },
            eligibleCosts: { type: Type.ARRAY, items: { type: Type.STRING } },
            ineligibleCosts: { type: Type.ARRAY, items: { type: Type.STRING } },
            applicationRequirements: { type: Type.ARRAY, items: { type: Type.STRING } },
            disqualificationRedFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
            reimbursementWarning: { type: Type.STRING },
            officialUrl: { type: Type.STRING },
            confidenceScore: { type: Type.INTEGER, description: '0 to 100 confidence score' },
            sourceSnippets: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: [
            'slug',
            'countryCode',
            'grantName',
            'providerAgency',
            'fundingType',
            'currency',
            'maxAmountFormatted',
            'maxFundingAmount',
            'matchRatePercentage',
            'summary',
            'descriptionMarkdown',
            'eligibleCosts',
            'ineligibleCosts',
            'applicationRequirements',
            'disqualificationRedFlags',
            'reimbursementWarning',
          ],
        },
      },
    });

    await recordGeminiUsageAndIncrementCredits({
      verifiedUserId: authCtx.verifiedUserId,
      promptKey: 'ADMIN_GRANT_EXTRACT',
      modelUsed: 'gemini-2.5-flash',
      inputTokens: response.usageMetadata?.promptTokenCount || 250,
      outputTokens: response.usageMetadata?.candidatesTokenCount || 350,
      usedByokKey: authCtx.usedByokKey,
      fallbackCreditsUsed: authCtx.currentCreditsUsed,
    });

    const text = response.text?.trim() || '{}';
    const parsed = JSON.parse(text) as ExtractedGrantResult;

    if (!parsed.slug || !parsed.grantName) {
      return { success: false, error: 'AI response did not include required grant fields' };
    }

    // Auto-prefix slug with country code if missing
    const prefix = (parsed.countryCode || 'ie').toLowerCase();
    let finalSlug = parsed.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (!finalSlug.startsWith(prefix)) {
      finalSlug = `${prefix}-${finalSlug}`;
    }
    parsed.slug = finalSlug;

    return {
      success: true,
      grant: parsed,
    };
  } catch (err: unknown) {
    console.error('[AdminGrants] AI extraction error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'AI Grant Extraction failed',
    };
  }
}

export async function stageExtractedGrantAction(grant: ExtractedGrantResult): Promise<{
  success: boolean;
  grantId?: string;
  error?: string;
}> {
  try {
    const adminSession = await getAdminSessionCookie();
    if (!adminSession) {
      return { success: false, error: 'Unauthorized admin session' };
    }

    const [inserted] = await db
      .insert(grantsDirectory)
      .values({
        slug: grant.slug,
        countryCode: grant.countryCode,
        grantName: grant.grantName,
        providerAgency: grant.providerAgency,
        fundingType: grant.fundingType,
        currency: grant.currency || (grant.countryCode === 'GB' ? 'GBP' : 'EUR'),
        maxAmountFormatted: grant.maxAmountFormatted,
        maxFundingAmount: grant.maxFundingAmount,
        matchRatePercentage: grant.matchRatePercentage,
        isRepayable: grant.isRepayable ?? false,
        minEmployees: grant.minEmployees ?? 0,
        maxEmployees: grant.maxEmployees ?? 10,
        maxTradingMonths: grant.maxTradingMonths,
        stageFit: grant.stageFit,
        turnaroundLabel: grant.turnaroundLabel,
        turnaroundSpeed: grant.turnaroundSpeed,
        leoThreeQuoteEnforced: grant.leoThreeQuoteEnforced ?? false,
        summary: grant.summary,
        descriptionMarkdown: grant.descriptionMarkdown,
        eligibleCosts: grant.eligibleCosts || [],
        ineligibleCosts: grant.ineligibleCosts || [],
        applicationRequirements: grant.applicationRequirements || [],
        disqualificationRedFlags: grant.disqualificationRedFlags || [],
        reimbursementWarning: grant.reimbursementWarning || 'Vouched expenditure only.',
        officialUrl: grant.officialUrl || '',
        confidenceScore: grant.confidenceScore || 90,
        sourceSnippets: grant.sourceSnippets || [],
        discoveredVia: 'ADMIN_PROMPT',
        status: 'PENDING_REVIEW', // Land in staging queue
        isActive: false, // Hidden from public and workspace until approved
      })
      .returning({ id: grantsDirectory.id });

    return { success: true, grantId: inserted.id };
  } catch (err: unknown) {
    console.error('[AdminGrants] Error staging grant:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to stage grant in database',
    };
  }
}

export async function updateGrantStatusAction(
  grantId: string,
  newStatus: 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'PENDING_REVIEW'
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminSession = await getAdminSessionCookie();
    if (!adminSession) {
      return { success: false, error: 'Unauthorized admin session' };
    }

    await db
      .update(grantsDirectory)
      .set({
        status: newStatus,
        isActive: newStatus === 'ACTIVE',
        updatedAt: new Date(),
      })
      .where(eq(grantsDirectory.id, grantId));

    return { success: true };
  } catch (err: unknown) {
    console.error('[AdminGrants] Error updating status:', err);
    return { success: false, error: 'Failed to update grant status' };
  }
}

export async function updateGrantFieldsAction(
  grantId: string,
  updates: Partial<GrantDirectoryRecord>
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminSession = await getAdminSessionCookie();
    if (!adminSession) {
      return { success: false, error: 'Unauthorized admin session' };
    }

    await db
      .update(grantsDirectory)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(grantsDirectory.id, grantId));

    return { success: true };
  } catch (err: unknown) {
    console.error('[AdminGrants] Error updating grant fields:', err);
    return { success: false, error: 'Failed to save grant updates' };
  }
}

export async function deleteGrantPermanentlyAction(
  grantId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminSession = await getAdminSessionCookie();
    if (!adminSession) {
      return { success: false, error: 'Unauthorized admin session' };
    }

    await db.delete(grantsDirectory).where(eq(grantsDirectory.id, grantId));
    return { success: true };
  } catch (err: unknown) {
    console.error('[AdminGrants] Error deleting grant:', err);
    return { success: false, error: 'Failed to delete grant' };
  }
}
