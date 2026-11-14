'use server';

import { stripe, isStripeConfigured } from '@/lib/stripe/client';
import { STRIPE_PASS_PRODUCTS } from '@/lib/stripe/products';
import { verifyActiveSessionAndPlanOwnership } from '@/lib/auth/server-auth';
import { getTrustedAppOrigin } from '@/lib/auth/oauth-helpers';
import { db } from '@/db';
import { userEntitlements, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface CreateCheckoutInput {
  planType: 'SIX_MONTH_SOLO' | 'SIX_MONTH_COFOUNDER' | 'LIVING_VAULT_MONTHLY';
  currency?: 'EUR' | 'GBP' | 'USD';
  planId?: string;
  guestEmail?: string;
}

export async function createStripeCheckoutSessionAction(
  input: CreateCheckoutInput
): Promise<{
  success: boolean;
  url?: string;
  redirectToRegister?: string;
  error?: string;
}> {
  try {
    if (!isStripeConfigured()) {
      return {
        success: false,
        error:
          'Stripe payments are not configured on this server. Please ensure STRIPE_SECRET_KEY is configured in your environment or Google Cloud Run.',
      };
    }

    const productConfig = STRIPE_PASS_PRODUCTS[input.planType];
    if (!productConfig) {
      return {
        success: false,
        error: `Invalid pass selection: ${input.planType}`,
      };
    }

    const authCheck = await verifyActiveSessionAndPlanOwnership();

    // Require an authenticated founder session so `metadata.userId` is always populated
    // and Stripe payments are never orphaned.
    if (!authCheck.authorized || !authCheck.userId) {
      return {
        success: false,
        redirectToRegister: `/register?plan=${encodeURIComponent(input.planType)}`,
        error:
          'Please create your free account or sign in first so your pass activates immediately after checkout.',
      };
    }

    const dbUserId = authCheck.userId;

    const [dbUser] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
      })
      .from(users)
      .where(eq(users.id, dbUserId))
      .limit(1);

    if (!dbUser) {
      return {
        success: false,
        redirectToRegister: `/register?plan=${encodeURIComponent(input.planType)}`,
        error: 'Founder account not found. Please sign in and try again.',
      };
    }

    const [entitlement] = await db
      .select({
        planType: userEntitlements.planType,
        stripeCustomerId: userEntitlements.stripeCustomerId,
      })
      .from(userEntitlements)
      .where(eq(userEntitlements.userId, dbUserId))
      .limit(1);

    // Living Vault (€7/mo) is strictly a post-Pass renewal add-on, never a €7 bypass from FREE_HOOK.
    if (input.planType === 'LIVING_VAULT_MONTHLY') {
      const eligibleForLivingVault =
        entitlement?.planType === 'SIX_MONTH_SOLO' ||
        entitlement?.planType === 'SIX_MONTH_COFOUNDER' ||
        entitlement?.planType === 'COHORT_PASS';
      if (!eligibleForLivingVault) {
        return {
          success: false,
          error:
            'The Living Vault micro-subscription is an extension for 6-Month Pass and Cohort Pass holders. Please purchase a 6-Month Solo or Co-Founder Pass first.',
        };
      }
    }

    const selectedCurrency = (input.currency || 'EUR').toUpperCase() as
      | 'EUR'
      | 'GBP'
      | 'USD';
    const unitAmount =
      productConfig.prices[selectedCurrency] || productConfig.prices.EUR;

    let customerId: string | undefined = entitlement?.stripeCustomerId || undefined;
    const customerEmail = dbUser.email;

    if (!customerId && dbUser.email) {
      const customer = await stripe.customers.create({
        email: dbUser.email,
        name: dbUser.name || undefined,
        metadata: {
          spf_user_id: dbUser.id,
        },
      });
      customerId = customer.id;

      if (entitlement) {
        await db
          .update(userEntitlements)
          .set({ stripeCustomerId: customerId, updatedAt: new Date() })
          .where(eq(userEntitlements.userId, dbUser.id));
      }
    }

    const origin = getTrustedAppOrigin();
    const successUrl = `${origin}/workspace?upgrade_success=true&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/workspace?stripe_cancelled=true`;

    const lineItems: any[] = [
      {
        price_data: {
          currency: selectedCurrency.toLowerCase(),
          unit_amount: unitAmount,
          product_data: {
            name: `Startup Preflight — ${productConfig.title}`,
            description: productConfig.description,
          },
          ...(productConfig.mode === 'subscription'
            ? { recurring: { interval: 'month' } }
            : {}),
        },
        quantity: 1,
      },
    ];

    const sessionParams: any = {
      customer: customerId,
      customer_email: customerId ? undefined : customerEmail,
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: productConfig.mode,
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: dbUserId,
      metadata: {
        userId: dbUserId,
        guestEmail: customerEmail || '',
        planType: input.planType,
        planId: input.planId || '',
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session.url) {
      return {
        success: false,
        error: 'Failed to generate Stripe Checkout URL.',
      };
    }

    return {
      success: true,
      url: session.url,
    };
  } catch (err: any) {
    console.error('Failed to create Stripe Checkout session:', err);
    return {
      success: false,
      error:
        err.message || 'An unexpected error occurred while connecting to Stripe.',
    };
  }
}
