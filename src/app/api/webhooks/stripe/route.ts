import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { db } from '@/db';
import { userEntitlements, surveyBoostOrders } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { calculatePassLimits } from '@/lib/entitlements';
import type Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      // In local dev without Stripe CLI webhook signature, parse the event directly
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err: any) {
    console.error('⚠️ Stripe Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  // Handle relevant Stripe event types
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderType = session.metadata?.orderType;

      // 1. Handle Survey Boost Order Completion
      if (orderType === 'SURVEY_BOOST') {
        const orderId = session.metadata?.orderId;
        const paymentIntentId =
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id;

        if (orderId) {
          console.log(`🚀 Stripe: Survey Boost Order ${orderId} successfully paid!`);
          await db
            .update(surveyBoostOrders)
            .set({
              status: 'PAID',
              stripePaymentIntentId: paymentIntentId || null,
            })
            .where(eq(surveyBoostOrders.id, orderId as any));
        }
        break;
      }

      const userId = session.client_reference_id || session.metadata?.userId;
      const planType = session.metadata?.planType as
        | 'SIX_MONTH_SOLO'
        | 'SIX_MONTH_COFOUNDER'
        | 'LIVING_VAULT_MONTHLY'
        | undefined;
      const customerId =
        typeof session.customer === 'string'
          ? session.customer
          : session.customer?.id;

      if (!userId || !planType) {
        console.warn(
          'Stripe checkout session missing userId or planType metadata:',
          session.id
        );
        break;
      }

      console.log(
        `💳 Stripe Checkout completed for User ${userId}: Activating ${planType}`
      );

      if (planType === 'SIX_MONTH_SOLO' || planType === 'SIX_MONTH_COFOUNDER') {
        const limits = calculatePassLimits(planType, 6);

        await db
          .insert(userEntitlements)
          .values({
            userId,
            planType: limits.planType,
            maxStartupPlans: limits.maxStartupPlans,
            maxSeatsPerPlan: limits.maxSeatsPerPlan,
            monthlyAiCreditsLimit: limits.monthlyAiCreditsLimit,
            accessExpiresAt: limits.accessExpiresAt,
            isVaultReadonly: false,
            stripeCustomerId: customerId || null,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: userEntitlements.userId,
            set: {
              planType: limits.planType,
              maxStartupPlans: limits.maxStartupPlans,
              maxSeatsPerPlan: limits.maxSeatsPerPlan,
              monthlyAiCreditsLimit: limits.monthlyAiCreditsLimit,
              accessExpiresAt: limits.accessExpiresAt,
              isVaultReadonly: false,
              stripeCustomerId: customerId || undefined,
              updatedAt: new Date(),
            },
          });
      } else if (planType === 'LIVING_VAULT_MONTHLY') {
        // Living Vault extension: unfreeze vault and keep active
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        await db
          .update(userEntitlements)
          .set({
            isVaultReadonly: false,
            accessExpiresAt: nextMonth,
            stripeCustomerId: customerId || undefined,
            updatedAt: new Date(),
          })
          .where(eq(userEntitlements.userId, userId));
      }

      break;
    }

    case 'customer.subscription.deleted': {
      // Living Vault cancelled or lapsed
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer?.id;

      if (customerId) {
        console.log(
          `🔒 Stripe Subscription cancelled for customer ${customerId}: marking vault read-only`
        );
        await db
          .update(userEntitlements)
          .set({
            isVaultReadonly: true,
            updatedAt: new Date(),
          })
          .where(eq(userEntitlements.stripeCustomerId, customerId));
      }
      break;
    }

    default:
      // Ignore other events
      break;
  }

  return NextResponse.json({ received: true });
}
