'use server';

import { db } from '@/db';
import {
  surveyBoostPricingTiers,
  surveyBoostOrders,
  validationSurveys,
} from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { stripe, isStripeConfigured } from '@/lib/stripe/client';
import {
  verifyActiveSessionAndPlanOwnership,
  getVerifiedActiveFounderFromCookie,
  requireVerifiedSuperAdminSession,
  getTrustedClientIp,
  checkRateLimit,
} from '@/lib/auth/server-auth';
import { getTrustedAppOrigin } from '@/lib/auth/oauth-helpers';
import { ProlificService } from '@/lib/panels/prolific-service';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolves a survey's Postgres UUID primary key scoped strictly to `planId`.
 */
async function resolveDbSurveyRecord(
  surveyIdentifier: string,
  planId: string,
  allowCreatePlaceholder = false
): Promise<typeof validationSurveys.$inferSelect | null> {
  if (!planId || !UUID_REGEX.test(planId)) return null;

  if (surveyIdentifier && UUID_REGEX.test(surveyIdentifier)) {
    const [row] = await db
      .select()
      .from(validationSurveys)
      .where(
        and(
          eq(validationSurveys.id, surveyIdentifier as any),
          eq(validationSurveys.planId, planId as any)
        )
      )
      .limit(1);
    if (row) return row;
  }

  // Fallback 1: match by publicSlug AND planId
  if (surveyIdentifier) {
    const [rowBySlug] = await db
      .select()
      .from(validationSurveys)
      .where(
        and(
          eq(validationSurveys.publicSlug, surveyIdentifier),
          eq(validationSurveys.planId, planId as any)
        )
      )
      .limit(1);
    if (rowBySlug) return rowBySlug;
  }

  // Fallback 2: match any existing survey for this plan
  const [rowByPlan] = await db
    .select()
    .from(validationSurveys)
    .where(eq(validationSurveys.planId, planId as any))
    .limit(1);
  if (rowByPlan) return rowByPlan;

  // Fallback 3: Create a placeholder survey record only during checkout if requested
  if (allowCreatePlaceholder) {
    const fallbackSlug =
      surveyIdentifier && !surveyIdentifier.startsWith('survey-')
        ? `${surveyIdentifier}-${Date.now().toString(36)}`
        : `survey-${Date.now().toString(36)}`;
    const [created] = await db
      .insert(validationSurveys)
      .values({
        planId: planId as any,
        publicSlug: fallbackSlug,
        title: 'Customer Validation Survey',
        questionsJsonb: [],
      })
      .returning();
    return created || null;
  }

  return null;
}

export interface SurveyBoostTierItem {
  id: string;
  tierName: string;
  responseCount: number;
  priceEurCents: number;
  priceGbpCents: number;
  priceUsdCents: number;
  turnaroundHours: number;
  targetAudienceType: string;
  badgeLabel?: string | null;
  description: string;
  features: string[];
  isActive: boolean;
  displayOrder: number;
}

export interface CreateSurveyBoostOrderInput {
  planId: string;
  surveyId: string;
  tierId: string;
  currency?: 'EUR' | 'GBP' | 'USD';
  targetCountryCode?: 'IE' | 'GB' | 'US' | 'ALL';
  ageRanges?: string[];
  gender?: string;
  employmentStatus?: string[];
  livingStatus?: string[];
  screenerQuestion?: string;
  screenerAcceptAnswer?: string;
}

/**
 * Fetch active pricing tiers for Module C Guaranteed Responses modal
 */
export async function getSurveyBoostTiersAction(): Promise<{
  success: boolean;
  tiers: SurveyBoostTierItem[];
}> {
  try {
    const rows = await db
      .select()
      .from(surveyBoostPricingTiers)
      .where(eq(surveyBoostPricingTiers.isActive, true))
      .orderBy(surveyBoostPricingTiers.displayOrder);

    const tiers: SurveyBoostTierItem[] = rows.map((r) => ({
      id: r.id,
      tierName: r.tierName,
      responseCount: r.responseCount,
      priceEurCents: r.priceEurCents,
      priceGbpCents: r.priceGbpCents,
      priceUsdCents: r.priceUsdCents,
      turnaroundHours: r.turnaroundHours,
      targetAudienceType: r.targetAudienceType,
      badgeLabel: r.badgeLabel,
      description: r.description,
      features: (r.featuresJson as string[]) || [],
      isActive: r.isActive,
      displayOrder: r.displayOrder,
    }));

    return { success: true, tiers };
  } catch (err) {
    console.error('[getSurveyBoostTiersAction] Error:', err);
    return { success: false, tiers: [] };
  }
}

/**
 * Fetch existing orders for a survey to show live delivery progress
 */
export async function getSurveyBoostOrdersAction(
  surveyIdOrSlug: string,
  planId?: string
): Promise<{
  success: boolean;
  orders: any[];
}> {
  try {
    if (!planId || !UUID_REGEX.test(planId)) {
      return { success: false, orders: [] };
    }

    const authCheck = await verifyActiveSessionAndPlanOwnership(planId, {
      requiredModule: 'MOD_C_SURVEYS_FEEDBACK',
    });
    if (!authCheck.authorized) {
      return { success: false, orders: [] };
    }

    if (!surveyIdOrSlug) {
      return { success: true, orders: [] };
    }

    const resolved = await resolveDbSurveyRecord(surveyIdOrSlug, planId, false);
    if (!resolved) {
      return { success: true, orders: [] };
    }

    const rows = await db
      .select()
      .from(surveyBoostOrders)
      .where(
        and(
          eq(surveyBoostOrders.surveyId, resolved.id as any),
          eq(surveyBoostOrders.planId, planId as any)
        )
      )
      .orderBy(desc(surveyBoostOrders.createdAt));

    return { success: true, orders: rows };
  } catch (err) {
    console.error('[getSurveyBoostOrdersAction] Error:', err);
    return { success: false, orders: [] };
  }
}

/**
 * Check real-time panel participant availability BEFORE the founder pays
 */
export async function checkSurveyBoostAvailabilityAction(input: {
  countryCode?: 'IE' | 'GB' | 'US' | 'ALL';
  ageBracket?: string;
  gender?: string;
  employment?: string;
}): Promise<{
  success: boolean;
  availableCount?: number;
  recommendation?: string;
  error?: string;
}> {
  try {
    const founderSession = await getVerifiedActiveFounderFromCookie();
    const adminSession = await requireVerifiedSuperAdminSession();
    if (!founderSession && !adminSession) {
      return {
        success: false,
        error: 'Authentication required to check panel availability.',
      };
    }
    const clientIp = await getTrustedClientIp();
    const callerKey =
      founderSession?.userId || adminSession?.userId || clientIp;
    const rl = checkRateLimit(`prolific_avail:${callerKey}`, 15, 60_000);
    if (!rl.allowed) {
      return {
        success: false,
        error: 'Too many panel availability checks. Please wait a moment.',
      };
    }
    let ageMin: number | undefined;
    let ageMax: number | undefined;

    if (input.ageBracket === '18-24') {
      ageMin = 18;
      ageMax = 24;
    } else if (input.ageBracket === '25-34') {
      ageMin = 25;
      ageMax = 34;
    } else if (input.ageBracket === '35-54') {
      ageMin = 35;
      ageMax = 54;
    } else if (input.ageBracket === '55+') {
      ageMin = 55;
      ageMax = 99;
    }

    let gender: 'ANY' | 'FEMALE' | 'MALE' = 'ANY';
    if (input.gender === 'FEMALE') gender = 'FEMALE';
    else if (input.gender === 'MALE') gender = 'MALE';

    let employmentStatus: 'ANY' | 'FULL_TIME' | 'PART_TIME' | 'UNEMPLOYED' = 'ANY';
    if (input.employment === 'FULL_TIME') employmentStatus = 'FULL_TIME';
    else if (input.employment === 'PART_TIME') employmentStatus = 'PART_TIME';

    const res = await ProlificService.checkEligibilityCount({
      countryCode: input.countryCode || 'IE',
      ageMin,
      ageMax,
      gender,
      employmentStatus,
    });

    if (!res.success) {
      return { success: false, error: res.error };
    }

    const count = res.count || 0;
    let recommendation: string | undefined;

    if (count < 50 && input.countryCode === 'IE') {
      recommendation =
        'Very high demographic filtering in Ireland. Consider expanding to "UK + Ireland" for 10x-50x larger sample pool, widely accepted by LEO & Enterprise Ireland.';
    } else if (count >= 50 && count < 150) {
      recommendation =
        'Available pool is tight for this specific slice. Responses may take 24–48 hours to complete.';
    }

    return {
      success: true,
      availableCount: count,
      recommendation,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Create Stripe Checkout session for a Survey Response Pack
 */
export async function createSurveyBoostCheckoutAction(
  input: CreateSurveyBoostOrderInput
): Promise<{ success: boolean; checkoutUrl?: string; error?: string }> {
  try {
    if (!isStripeConfigured()) {
      return {
        success: false,
        error:
          'Stripe payments are not configured on this server. Please ensure STRIPE_SECRET_KEY is configured in your environment or Google Cloud Run.',
      };
    }

    if (!input.planId || !UUID_REGEX.test(input.planId)) {
      return { success: false, error: 'Valid startup plan ID is required.' };
    }

    const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId, {
      requiredModule: 'MOD_C_SURVEYS_FEEDBACK',
      requireWrite: true,
    });
    if (!authCheck.authorized || !authCheck.userId) {
      return { success: false, error: authCheck.reason || 'Unauthorized or invalid session.' };
    }

    let [tier] = await db
      .select()
      .from(surveyBoostPricingTiers)
      .where(
        and(
          eq(surveyBoostPricingTiers.id, input.tierId),
          eq(surveyBoostPricingTiers.isActive, true)
        )
      )
      .limit(1);

    // If tier not found by exact ID, try matching case-insensitively or by prefix
    if (!tier) {
      const allActiveTiers = await db
        .select()
        .from(surveyBoostPricingTiers)
        .where(eq(surveyBoostPricingTiers.isActive, true));

      const matched = allActiveTiers.find(
        (t) =>
          t.id.toLowerCase() === input.tierId.toLowerCase() ||
          t.tierName.toLowerCase().includes(input.tierId.toLowerCase()) ||
          input.tierId.toLowerCase().includes(t.id.toLowerCase())
      );
      if (matched) {
        tier = matched;
      }
    }

    if (!tier) {
      return { success: false, error: 'Selected response pack is unavailable.' };
    }

    // Resolve real survey record from DB scoped to planId
    const survey = await resolveDbSurveyRecord(input.surveyId, input.planId, true);

    if (!survey) {
      return { success: false, error: 'Survey not found. Please save your survey before ordering responses.' };
    }

    const selectedCurrency = (input.currency || 'EUR').toUpperCase() as
      | 'EUR'
      | 'GBP'
      | 'USD';
    const unitAmount =
      selectedCurrency === 'GBP'
        ? tier.priceGbpCents
        : selectedCurrency === 'USD'
        ? tier.priceUsdCents
        : tier.priceEurCents;

    // Create a pending record in survey_boost_orders
    const [order] = await db
      .insert(surveyBoostOrders)
      .values({
        planId: input.planId as any,
        surveyId: survey.id,
        userId: authCheck.userId,
        tierId: tier.id,
        tierName: tier.tierName,
        targetResponses: tier.responseCount,
        deliveredResponses: 0,
        amountPaidCents: unitAmount,
        currency: selectedCurrency,
        status: 'PENDING_PAYMENT',
        targetCountryCode: input.targetCountryCode || 'IE',
        targetAudienceType: tier.targetAudienceType,
        targetDemographicsJson: {
          ageRanges: input.ageRanges || [],
          gender: input.gender || 'ALL',
          employmentStatus: input.employmentStatus || [],
          livingStatus: input.livingStatus || [],
        },
        screenerQuestion: input.screenerQuestion?.trim() || null,
        screenerAcceptAnswer: input.screenerAcceptAnswer?.trim() || null,
        panelProvider: 'PROLIFIC',
      })
      .returning();

    const origin = getTrustedAppOrigin();

    const successUrl = `${origin}/workspace?planId=${encodeURIComponent(input.planId)}&module=MOD_C_SURVEYS_FEEDBACK&boost_success=true&order_id=${encodeURIComponent(order.id)}`;
    const cancelUrl = `${origin}/workspace?planId=${encodeURIComponent(input.planId)}&module=MOD_C_SURVEYS_FEEDBACK&boost_canceled=true`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      client_reference_id: authCheck.userId,
      line_items: [
        {
          price_data: {
            currency: selectedCurrency.toLowerCase(),
            product_data: {
              name: `${tier.tierName} (${tier.responseCount} Verified Responses)`,
              description: `Guaranteed human survey responses with ${tier.turnaroundHours}h delivery for ${survey.title || 'Validation Survey'}.`,
              metadata: {
                orderType: 'SURVEY_BOOST',
                orderId: order.id,
                planId: input.planId,
                surveyId: input.surveyId,
                tierId: tier.id,
              },
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        orderType: 'SURVEY_BOOST',
        orderId: order.id,
        planId: input.planId,
        surveyId: input.surveyId,
        tierId: tier.id,
        userId: authCheck.userId,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    // Update order with stripeSessionId
    await db
      .update(surveyBoostOrders)
      .set({ stripeSessionId: session.id })
      .where(eq(surveyBoostOrders.id, order.id));

    return { success: true, checkoutUrl: session.url || undefined };
  } catch (err: unknown) {
    console.error('[createSurveyBoostCheckoutAction] Error:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}
