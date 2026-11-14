import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { db, ensureDatabaseSchemaSynced } from '@/db';
import { userEntitlements, surveyBoostOrders, partnerReferralEvents } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { calculatePassLimits } from '@/lib/entitlements';
import type Stripe from 'stripe';

export const dynamic = 'force-dynamic';

let webhookEventsTableReady = false;

async function claimIdempotentWebhookEvent(eventId: string, eventType: string): Promise<boolean> {
  await ensureDatabaseSchemaSynced();
  if (!webhookEventsTableReady) {
    await db.execute(
      sql`CREATE TABLE IF NOT EXISTS stripe_webhook_events (
        event_id TEXT PRIMARY KEY,
        event_type TEXT NOT NULL,
        processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`
    );
    webhookEventsTableReady = true;
  }

  const inserted = await db.execute(
    sql`INSERT INTO stripe_webhook_events (event_id, event_type)
        VALUES (${eventId}, ${eventType})
        ON CONFLICT (event_id) DO NOTHING
        RETURNING event_id`
  );
  const rows = Array.isArray(inserted) ? inserted : (inserted as any)?.rows || [];
  return rows.length > 0;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  // Unconditionally require STRIPE_WEBHOOK_SECRET in every environment (never parse unsigned JSON)
  if (!webhookSecret) {
    console.error('⚠️ STRIPE_WEBHOOK_SECRET is not configured — rejecting webhook request.');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 503 }
    );
  }

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('⚠️ Stripe Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  // Deduplicate replayed or retried Stripe deliveries
  try {
    const isNewEvent = await claimIdempotentWebhookEvent(event.id, event.type);
    if (!isNewEvent) {
      return NextResponse.json({ received: true, duplicate: true });
    }
  } catch (idempErr) {
    console.error('⚠️ Failed to record Stripe webhook idempotency key:', idempErr);
    return NextResponse.json(
      { error: 'Database unavailable during webhook processing' },
      { status: 500 }
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

      // 2. Handle Paid Partner Concierge Order Completion
      if (orderType === 'PAID_STRIPE_CONCIERGE') {
        const referralEventId = session.metadata?.referralEventId;
        if (referralEventId) {
          await db
            .update(partnerReferralEvents)
            .set({
              leadStatus: 'BOUNTY_PAID',
            })
            .where(eq(partnerReferralEvents.id, referralEventId));
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

      const [existingEnt] = await db
        .select()
        .from(userEntitlements)
        .where(eq(userEntitlements.userId, userId))
        .limit(1);

      const isLifetime = existingEnt?.planType === 'APPSUMO_LTD';

      if (planType === 'SIX_MONTH_SOLO' || planType === 'SIX_MONTH_COFOUNDER') {
        const limits = calculatePassLimits(planType, 6);

        await db
          .insert(userEntitlements)
          .values({
            userId,
            planType: isLifetime ? 'APPSUMO_LTD' : limits.planType,
            maxStartupPlans: Math.max(existingEnt?.maxStartupPlans ?? 0, limits.maxStartupPlans),
            maxSeatsPerPlan: Math.max(existingEnt?.maxSeatsPerPlan ?? 0, limits.maxSeatsPerPlan),
            monthlyAiCreditsLimit: Math.max(
              existingEnt?.monthlyAiCreditsLimit ?? 0,
              limits.monthlyAiCreditsLimit
            ),
            accessExpiresAt: isLifetime ? null : limits.accessExpiresAt,
            isVaultReadonly: false,
            stripeCustomerId: customerId || null,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: userEntitlements.userId,
            set: {
              planType: isLifetime ? 'APPSUMO_LTD' : limits.planType,
              maxStartupPlans: Math.max(
                existingEnt?.maxStartupPlans ?? 0,
                limits.maxStartupPlans
              ),
              maxSeatsPerPlan: Math.max(
                existingEnt?.maxSeatsPerPlan ?? 0,
                limits.maxSeatsPerPlan
              ),
              monthlyAiCreditsLimit: Math.max(
                existingEnt?.monthlyAiCreditsLimit ?? 0,
                limits.monthlyAiCreditsLimit
              ),
              accessExpiresAt: isLifetime ? null : limits.accessExpiresAt,
              isVaultReadonly: false,
              stripeCustomerId: customerId || undefined,
              updatedAt: new Date(),
            },
          });
      } else if (planType === 'LIVING_VAULT_MONTHLY') {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        // Only extend Living Vault if user previously held a paid pass (never upgrade FREE_HOOK via €7 add-on)
        if (
          existingEnt &&
          (existingEnt.planType === 'SIX_MONTH_SOLO' ||
            existingEnt.planType === 'SIX_MONTH_COFOUNDER')
        ) {
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
      }

      break;
    }

    case 'invoice.paid': {
      // Recurring Living Vault monthly renewal
      const invoice = event.data.object as Stripe.Invoice;
      const customerId =
        typeof invoice.customer === 'string'
          ? invoice.customer
          : invoice.customer?.id;

      if (customerId) {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        const [ent] = await db
          .select()
          .from(userEntitlements)
          .where(eq(userEntitlements.stripeCustomerId, customerId))
          .limit(1);

        if (
          ent &&
          (ent.planType === 'SIX_MONTH_SOLO' ||
            ent.planType === 'SIX_MONTH_COFOUNDER')
        ) {
          await db
            .update(userEntitlements)
            .set({
              isVaultReadonly: false,
              accessExpiresAt: nextMonth,
              updatedAt: new Date(),
            })
            .where(eq(userEntitlements.userId, ent.userId));
        }
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId =
        typeof invoice.customer === 'string'
          ? invoice.customer
          : invoice.customer?.id;
      if (customerId) {
        console.warn(
          `⚠️ Stripe recurring invoice payment failed for customer ${customerId}`
        );
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer?.id;

      if (customerId) {
        const [ent] = await db
          .select()
          .from(userEntitlements)
          .where(eq(userEntitlements.stripeCustomerId, customerId))
          .limit(1);

        if (ent && ent.planType !== 'APPSUMO_LTD') {
          console.log(
            `🔒 Stripe Subscription cancelled for customer ${customerId}: marking vault read-only`
          );
          await db
            .update(userEntitlements)
            .set({
              isVaultReadonly: true,
              updatedAt: new Date(),
            })
            .where(eq(userEntitlements.userId, ent.userId));
        }
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
