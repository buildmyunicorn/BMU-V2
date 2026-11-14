import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { db, ensureDatabaseSchemaSynced } from '@/db';
import { userEntitlements, surveyBoostOrders, partnerReferralEvents } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { calculatePassLimits } from '@/lib/entitlements';
import type Stripe from 'stripe';

export const dynamic = 'force-dynamic';

function pickLaterExpiryDate(
  existingExpiry?: Date | null,
  candidateExpiry?: Date | null
): Date | null {
  if (!existingExpiry && !candidateExpiry) return null;
  if (!existingExpiry) return candidateExpiry ?? null;
  if (!candidateExpiry) return existingExpiry ?? null;
  return existingExpiry.getTime() > candidateExpiry.getTime()
    ? existingExpiry
    : candidateExpiry;
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

  try {
    await ensureDatabaseSchemaSynced();

    // Execute idempotency claim AND all downstream state updates inside a single atomic DB transaction
    // so transient DB errors roll back the idempotency key and allow Stripe retries to succeed cleanly.
    const outcome = await db.transaction(async (tx) => {
      const inserted = await tx.execute(
        sql`INSERT INTO stripe_webhook_events (event_id, event_type)
            VALUES (${event.id}, ${event.type})
            ON CONFLICT (event_id) DO NOTHING
            RETURNING event_id`
      );
      const rows = Array.isArray(inserted)
        ? inserted
        : (inserted as any)?.rows || [];
      if (rows.length === 0) {
        return { duplicate: true };
      }

      switch (event.type) {
        case 'checkout.session.completed':
        case 'checkout.session.async_payment_succeeded': {
          const session = event.data.object as Stripe.Checkout.Session;

          // Never fulfill unpaid async checkout sessions until payment_status === 'paid'
          if (
            event.type === 'checkout.session.completed' &&
            session.payment_status !== 'paid'
          ) {
            break;
          }

          const orderType = session.metadata?.orderType;

          // 1. Handle Survey Boost Order Completion
          if (orderType === 'SURVEY_BOOST') {
            const orderId = session.metadata?.orderId;
            const paymentIntentId =
              typeof session.payment_intent === 'string'
                ? session.payment_intent
                : session.payment_intent?.id;

            if (orderId) {
              console.log(
                `🚀 Stripe: Survey Boost Order ${orderId} successfully paid!`
              );
              await tx
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
            const currencyUpper = (session.currency || 'eur').toUpperCase();
            const sym =
              currencyUpper === 'GBP'
                ? '£'
                : currencyUpper === 'USD'
                  ? '$'
                  : '€';
            const paidAmount =
              typeof session.amount_total === 'number'
                ? Math.round(session.amount_total) / 100
                : Number(session.metadata?.basePriceAmount || 0);

            if (
              referralEventId &&
              /^[0-9a-f-]{36}$/i.test(referralEventId)
            ) {
              await tx
                .update(partnerReferralEvents)
                .set({
                  leadStatus: 'BOUNTY_PAID',
                  estimatedBountyAmount: `${sym}${paidAmount} Paid via Stripe`,
                  adminNotes: `Stripe Webhook Verified Payment (${session.id})`,
                })
                .where(eq(partnerReferralEvents.id, referralEventId));
            } else {
              await tx.insert(partnerReferralEvents).values({
                partnerId: session.metadata?.partnerSlug || 'concierge-partner',
                partnerName:
                  session.metadata?.partnerName || 'Formation Concierge Partner',
                partnerSlug: session.metadata?.partnerSlug || 'concierge-partner',
                slotKey:
                  session.metadata?.slotKey || 'OPS_STEP_1_INCORPORATION',
                eventType: 'PAID_CONCIERGE_ORDER',
                planId:
                  session.metadata?.planId &&
                  /^[0-9a-f-]{36}$/i.test(session.metadata.planId)
                    ? session.metadata.planId
                    : null,
                planTitle: 'Paid Incorporation Order',
                founderName: 'Founder',
                founderEmail:
                  session.metadata?.founderEmail ||
                  session.customer_details?.email ||
                  '',
                countryCode: currencyUpper === 'GBP' ? 'GB' : 'IE',
                selectedDomain: null,
                destinationUrl: null,
                intakeAnswersJson: {
                  stripe_payment_status: `PAID ${sym}${paidAmount} (${currencyUpper}) • Ref: ${session.id}`,
                  verified_addon_ids:
                    session.metadata?.verifiedAddonIds || '',
                  concierge_email_dispatched: 'false',
                },
                leadStatus: 'BOUNTY_PAID',
                estimatedBountyAmount: `${sym}${paidAmount} Paid via Stripe`,
                adminNotes: `Stripe Webhook Verified Payment (${session.id})`,
              });
            }
            break;
          }

          const userId =
            session.client_reference_id || session.metadata?.userId;
          const planType = session.metadata?.planType as
            | 'SIX_MONTH_SOLO'
            | 'SIX_MONTH_COFOUNDER'
            | 'LIVING_VAULT_MONTHLY'
            | 'LIVING_VAULT_ANNUAL'
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

          const [existingEnt] = await tx
            .select()
            .from(userEntitlements)
            .where(eq(userEntitlements.userId, userId))
            .for('update');

          const isLifetime = existingEnt?.planType === 'APPSUMO_LTD';

          if (
            planType === 'SIX_MONTH_SOLO' ||
            planType === 'SIX_MONTH_COFOUNDER'
          ) {
            const limits = calculatePassLimits(planType, 6);
            const resetCreditsOnUpgrade =
              !existingEnt || existingEnt.planType === 'FREE_HOOK';
            const mergedExpiry = isLifetime
              ? null
              : pickLaterExpiryDate(
                  existingEnt?.accessExpiresAt,
                  limits.accessExpiresAt
                );

            await tx
              .insert(userEntitlements)
              .values({
                userId,
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
                aiCreditsUsedThisMonth: 0,
                accessExpiresAt: mergedExpiry,
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
                  ...(resetCreditsOnUpgrade
                    ? { aiCreditsUsedThisMonth: 0 }
                    : {}),
                  accessExpiresAt: mergedExpiry,
                  isVaultReadonly: false,
                  stripeCustomerId: customerId || undefined,
                  updatedAt: new Date(),
                },
              });
          } else if (
            planType === 'LIVING_VAULT_MONTHLY' ||
            planType === 'LIVING_VAULT_ANNUAL'
          ) {
            const candidatePeriodEnd = new Date();
            candidatePeriodEnd.setMonth(
              candidatePeriodEnd.getMonth() +
                (planType === 'LIVING_VAULT_ANNUAL' ? 12 : 1)
            );

            // Extend Living Vault for Paid Pass and Cohort Pass holders without clobbering longer remaining access
            if (
              existingEnt &&
              (existingEnt.planType === 'SIX_MONTH_SOLO' ||
                existingEnt.planType === 'SIX_MONTH_COFOUNDER' ||
                existingEnt.planType === 'COHORT_PASS')
            ) {
              const preservedExpiry = pickLaterExpiryDate(
                existingEnt.accessExpiresAt,
                candidatePeriodEnd
              );
              await tx
                .update(userEntitlements)
                .set({
                  isVaultReadonly: false,
                  accessExpiresAt: preservedExpiry,
                  stripeCustomerId: customerId || undefined,
                  updatedAt: new Date(),
                })
                .where(eq(userEntitlements.userId, userId));
            }
          }

          break;
        }

        case 'invoice.paid': {
          const invoice = event.data.object as Stripe.Invoice;
          const customerId =
            typeof invoice.customer === 'string'
              ? invoice.customer
              : invoice.customer?.id;

          if (customerId) {
            const fallbackNextMonth = new Date();
            fallbackNextMonth.setMonth(fallbackNextMonth.getMonth() + 1);
            const stripeLinePeriodEndUnix =
              invoice.lines?.data?.[0]?.period?.end;
            const invoicePeriodEnd =
              typeof stripeLinePeriodEndUnix === 'number' &&
              stripeLinePeriodEndUnix > 0
                ? new Date(stripeLinePeriodEndUnix * 1000)
                : fallbackNextMonth;

            const [ent] = await tx
              .select()
              .from(userEntitlements)
              .where(eq(userEntitlements.stripeCustomerId, customerId))
              .for('update');

            if (
              ent &&
              (ent.planType === 'SIX_MONTH_SOLO' ||
                ent.planType === 'SIX_MONTH_COFOUNDER' ||
                ent.planType === 'COHORT_PASS')
            ) {
              const preservedExpiry = pickLaterExpiryDate(
                ent.accessExpiresAt,
                invoicePeriodEnd
              );
              await tx
                .update(userEntitlements)
                .set({
                  isVaultReadonly: false,
                  accessExpiresAt: preservedExpiry,
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
            const [ent] = await tx
              .select()
              .from(userEntitlements)
              .where(eq(userEntitlements.stripeCustomerId, customerId))
              .for('update');

            if (ent && ent.planType !== 'APPSUMO_LTD') {
              const hasUnexpiredPass = Boolean(
                ent.accessExpiresAt &&
                  new Date(ent.accessExpiresAt).getTime() > Date.now()
              );
              if (!hasUnexpiredPass) {
                console.log(
                  `🔒 Stripe Subscription cancelled for customer ${customerId}: marking vault read-only`
                );
                await tx
                  .update(userEntitlements)
                  .set({
                    isVaultReadonly: true,
                    updatedAt: new Date(),
                  })
                  .where(eq(userEntitlements.userId, ent.userId));
              }
            }
          }
          break;
        }

        case 'charge.refunded': {
          const charge = event.data.object as Stripe.Charge;
          const paymentIntentId =
            typeof charge.payment_intent === 'string'
              ? charge.payment_intent
              : charge.payment_intent?.id;
          const customerId =
            typeof charge.customer === 'string'
              ? charge.customer
              : charge.customer?.id;

          if (paymentIntentId) {
            await tx
              .update(surveyBoostOrders)
              .set({ status: 'REFUNDED' })
              .where(
                eq(surveyBoostOrders.stripePaymentIntentId, paymentIntentId)
              );
          }

          // Full refund of a 6-Month Pass (>= 50.00 in major currency) reverts non-Lifetime pass back to FREE_HOOK
          const isFullRefund =
            typeof charge.amount === 'number' &&
            charge.amount > 0 &&
            charge.amount_refunded >= charge.amount;
          if (isFullRefund && charge.amount >= 5000 && customerId) {
            const [ent] = await tx
              .select()
              .from(userEntitlements)
              .where(eq(userEntitlements.stripeCustomerId, customerId))
              .for('update');

            if (
              ent &&
              (ent.planType === 'SIX_MONTH_SOLO' ||
                ent.planType === 'SIX_MONTH_COFOUNDER')
            ) {
              const freeLimits = calculatePassLimits('FREE_HOOK');
              await tx
                .update(userEntitlements)
                .set({
                  planType: 'FREE_HOOK',
                  maxStartupPlans: freeLimits.maxStartupPlans,
                  maxSeatsPerPlan: freeLimits.maxSeatsPerPlan,
                  monthlyAiCreditsLimit: freeLimits.monthlyAiCreditsLimit,
                  accessExpiresAt: null,
                  isVaultReadonly: false,
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

      return { duplicate: false };
    });

    if (outcome.duplicate) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    return NextResponse.json({ received: true });
  } catch (webhookErr) {
    console.error('⚠️ Stripe webhook transaction failed:', webhookErr);
    return NextResponse.json(
      { error: 'Database error during webhook processing' },
      { status: 500 }
    );
  }
}
