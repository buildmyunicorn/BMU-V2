'use server';

import { stripe } from '@/lib/stripe/client';
import { STRIPE_PASS_PRODUCTS } from '@/lib/stripe/products';
import { verifyActiveSessionAndPlanOwnership } from '@/lib/auth/server-auth';
import { db } from '@/db';
import { userEntitlements, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';

export interface CreateCheckoutInput {
  planType: 'SIX_MONTH_SOLO' | 'SIX_MONTH_COFOUNDER' | 'LIVING_VAULT_MONTHLY';
  currency?: 'EUR' | 'GBP' | 'USD';
  planId?: string;
  guestEmail?: string;
}

export async function createStripeCheckoutSessionAction(
  input: CreateCheckoutInput
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const authCheck = await verifyActiveSessionAndPlanOwnership();

    const productConfig = STRIPE_PASS_PRODUCTS[input.planType];
    if (!productConfig) {
      return {
        success: false,
        error: `Invalid pass selection: ${input.planType}`,
      };
    }

    // Determine target currency (EUR, GBP, USD)
    const selectedCurrency = (input.currency || 'EUR').toUpperCase() as
      | 'EUR'
      | 'GBP'
      | 'USD';
    const unitAmount =
      productConfig.prices[selectedCurrency] || productConfig.prices.EUR;

    let dbUserId: string | null = null;
    let customerEmail: string | undefined = input.guestEmail?.trim() || undefined;
    let customerId: string | undefined = undefined;

    if (authCheck.authorized && authCheck.userId) {
      dbUserId = authCheck.userId;
      const [dbUser] = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
        })
        .from(users)
        .where(eq(users.id, authCheck.userId))
        .limit(1);

      if (dbUser) {
        customerEmail = dbUser.email;
        const [entitlement] = await db
          .select({
            stripeCustomerId: userEntitlements.stripeCustomerId,
          })
          .from(userEntitlements)
          .where(eq(userEntitlements.userId, authCheck.userId))
          .limit(1);

        customerId = entitlement?.stripeCustomerId || undefined;

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
              .set({ stripeCustomerId: customerId })
              .where(eq(userEntitlements.userId, dbUser.id));
          }
        }
      }
    }

    // Compute return URLs
    const headerList = await headers();
    const origin =
      headerList.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000';

    const successUrl = dbUserId
      ? `${origin}/workspace?upgrade_success=true&session_id={CHECKOUT_SESSION_ID}`
      : `${origin}/register?stripe_checkout=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/?stripe_cancelled=true`;

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
      client_reference_id: dbUserId || undefined,
      metadata: {
        userId: dbUserId || '',
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
