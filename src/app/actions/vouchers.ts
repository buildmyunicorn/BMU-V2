'use server';

import { eq, and } from 'drizzle-orm';
import {
  db,
  vouchers,
  cohorts,
  users,
  userEntitlements,
} from '@/db';
import { getServerSessionCookie, checkRateLimit } from '@/lib/auth/server-auth';
import {
  calculateAppSumoTierLimits,
  calculatePassLimits,
} from '@/lib/entitlements';
import { sendSystemEmail } from '@/lib/email/send';
import { EMAIL_DEFAULTS } from '@/lib/email/resend';

export interface RedeemVoucherResult {
  ok: boolean;
  error?: string;
  message?: string;
  redeemedCode?: string;
  newTierName?: string;
  totalStackedCodes?: number;
  maxStartupPlans?: number;
  monthlyAiCreditsLimit?: number;
  isVaultReadonly?: boolean;
}

/**
 * Redeems an AppSumo, Partner, or Institutional Cohort code for the active founder session.
 * Supports:
 * - AppSumo Lifetime Stacking (Tier 1 -> Tier 2 -> Tier 3)
 * - Partner Passes (Lifetime, Pass Solo, Pass Co-Founder with month duration)
 * - Institutional Cohort Codes (SPF-UCD-..., BMU-...)
 */
export async function redeemVoucherOrCohortCodeAction(
  code: string
): Promise<RedeemVoucherResult> {
  const cleanCode = (code || '').trim().toUpperCase();
  if (!cleanCode) {
    return { ok: false, error: 'Please enter a valid voucher or cohort code.' };
  }

  const sessionPayload = await getServerSessionCookie();
  if (!sessionPayload) {
    return {
      ok: false,
      error: 'You must be signed in to redeem or stack a voucher code.',
    };
  }

  const rateLimit = checkRateLimit(
    `voucher:redeem:${sessionPayload.userId}`,
    8,
    60_000
  );
  if (!rateLimit.allowed) {
    return {
      ok: false,
      error: `Too many redemption attempts. Please wait ${rateLimit.retryAfterSeconds}s.`,
    };
  }

  try {
    // 1. Fetch current user & entitlement
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, sessionPayload.userId))
      .limit(1);

    if (!user) {
      return { ok: false, error: 'User account not found.' };
    }

    const [currentEnt] = await db
      .select()
      .from(userEntitlements)
      .where(eq(userEntitlements.userId, user.id))
      .limit(1);

    // 2. Check if this is an Institutional Cohort Code
    const [foundCohort] = await db
      .select()
      .from(cohorts)
      .where(eq(cohorts.inviteCode, cleanCode))
      .limit(1);

    if (foundCohort) {
      // Enroll in cohort
      const cohortLimits = calculatePassLimits('COHORT_PASS', 6);
      await db
        .update(users)
        .set({ cohortId: foundCohort.id, updatedAt: new Date() })
        .where(eq(users.id, user.id));

      if (currentEnt) {
        await db
          .update(userEntitlements)
          .set({
            planType: 'COHORT_PASS',
            maxStartupPlans: Math.max(
              currentEnt.maxStartupPlans,
              cohortLimits.maxStartupPlans
            ),
            maxSeatsPerPlan: Math.max(
              currentEnt.maxSeatsPerPlan,
              cohortLimits.maxSeatsPerPlan
            ),
            monthlyAiCreditsLimit: Math.max(
              currentEnt.monthlyAiCreditsLimit,
              cohortLimits.monthlyAiCreditsLimit
            ),
            accessExpiresAt: cohortLimits.accessExpiresAt,
            isVaultReadonly: false,
            updatedAt: new Date(),
          })
          .where(eq(userEntitlements.id, currentEnt.id));
      } else {
        await db.insert(userEntitlements).values({
          userId: user.id,
          planType: 'COHORT_PASS',
          stackedCodesCount: 0,
          maxStartupPlans: cohortLimits.maxStartupPlans,
          maxSeatsPerPlan: cohortLimits.maxSeatsPerPlan,
          monthlyAiCreditsLimit: cohortLimits.monthlyAiCreditsLimit,
          aiCreditsUsedThisMonth: 0,
          whiteLabelExportEnabled: false,
          accessExpiresAt: cohortLimits.accessExpiresAt,
          isVaultReadonly: false,
        });
      }

      return {
        ok: true,
        message: `Successfully enrolled in "${foundCohort.name}" Institutional Cohort! Full Module A–L access unlocked.`,
        redeemedCode: cleanCode,
        newTierName: foundCohort.name,
        maxStartupPlans: cohortLimits.maxStartupPlans,
        monthlyAiCreditsLimit: cohortLimits.monthlyAiCreditsLimit,
        isVaultReadonly: false,
      };
    }

    // 3. Look up Voucher in `vouchers` table
    const [foundVoucher] = await db
      .select()
      .from(vouchers)
      .where(eq(vouchers.code, cleanCode))
      .limit(1);

    if (foundVoucher) {
      if (foundVoucher.status === 'REDEEMED') {
        if (foundVoucher.redeemedByUserId === user.id) {
          return {
            ok: false,
            error: `Voucher ${cleanCode} has already been applied to your account.`,
          };
        }
        return {
          ok: false,
          error: `Voucher ${cleanCode} has already been claimed by another account.`,
        };
      }
      if (foundVoucher.status === 'REFUNDED_REVOKED') {
        return {
          ok: false,
          error: `Voucher ${cleanCode} has been revoked or refunded and is no longer valid.`,
        };
      }
    }

    // Determine voucher type & source
    const isSumo =
      foundVoucher?.source === 'APPSUMO' || cleanCode.startsWith('SUMO-');
    const rewardType = foundVoucher?.rewardType || (isSumo ? 'APPSUMO_LTD' : 'PASS_SOLO');
    const durationMonths = foundVoucher?.durationMonths || 6;

    if (rewardType === 'APPSUMO_LTD') {
      // Stack AppSumo Code
      const currentStacked = currentEnt?.stackedCodesCount || 0;
      const newStacked = currentStacked + 1;
      const limits = calculateAppSumoTierLimits(newStacked);

      if (currentEnt) {
        await db
          .update(userEntitlements)
          .set({
            planType: 'APPSUMO_LTD',
            stackedCodesCount: newStacked,
            maxStartupPlans: limits.maxStartupPlans,
            maxSeatsPerPlan: limits.maxSeatsPerPlan,
            monthlyAiCreditsLimit: limits.monthlyAiCreditsLimit,
            whiteLabelExportEnabled: limits.whiteLabelExportEnabled,
            isVaultReadonly: false,
            accessExpiresAt: null, // Lifetime
            updatedAt: new Date(),
          })
          .where(eq(userEntitlements.id, currentEnt.id));
      } else {
        await db.insert(userEntitlements).values({
          userId: user.id,
          planType: 'APPSUMO_LTD',
          stackedCodesCount: 1,
          maxStartupPlans: limits.maxStartupPlans,
          maxSeatsPerPlan: limits.maxSeatsPerPlan,
          monthlyAiCreditsLimit: limits.monthlyAiCreditsLimit,
          aiCreditsUsedThisMonth: 0,
          whiteLabelExportEnabled: limits.whiteLabelExportEnabled,
          isVaultReadonly: false,
        });
      }

      // Mark voucher redeemed
      if (foundVoucher) {
        await db
          .update(vouchers)
          .set({
            status: 'REDEEMED',
            redeemedByUserId: user.id,
            redeemedAt: new Date(),
          })
          .where(eq(vouchers.id, foundVoucher.id));
      } else {
        // Auto-create voucher record if it didn't exist in DB yet
        await db.insert(vouchers).values({
          code: cleanCode,
          batchName: 'Direct_Redemption',
          source: 'APPSUMO',
          rewardType: 'APPSUMO_LTD',
          status: 'REDEEMED',
          redeemedByUserId: user.id,
          redeemedAt: new Date(),
        });
      }

      // Fire asynchronous confirmation email
      sendSystemEmail({
        to: user.email,
        template: 'VOUCHER_REDEEMED',
        subject: `Pass Activated: Code ${cleanCode} Redeemed!`,
        props: {
          founderName: user.name || undefined,
          recipientEmail: user.email,
          voucherCode: cleanCode,
          tierName: limits.tierName,
          maxPlans: limits.maxStartupPlans,
          maxSeats: limits.maxSeatsPerPlan,
          aiCreditsMonthly: limits.monthlyAiCreditsLimit,
          loginUrl: `${EMAIL_DEFAULTS.appUrl}/workspace`,
        },
        metadata: {
          userId: user.id,
          trigger: 'APPSUMO_VOUCHER_REDEEMED',
          voucherCode: cleanCode,
          totalStacked: newStacked,
        },
      }).catch((e) => {
        console.error('[SPF Email] Failed to send voucher confirmation email:', e);
      });

      return {
        ok: true,
        message: `Voucher ${cleanCode} stacked successfully! Upgraded to ${limits.tierName}.`,
        redeemedCode: cleanCode,
        newTierName: limits.tierName,
        totalStackedCodes: newStacked,
        maxStartupPlans: limits.maxStartupPlans,
        monthlyAiCreditsLimit: limits.monthlyAiCreditsLimit,
        isVaultReadonly: false,
      };
    } else {
      // Partner Pass (Solo or Co-Founder, time-limited)
      const passType =
        rewardType === 'PASS_COFOUNDER'
          ? 'SIX_MONTH_COFOUNDER'
          : 'SIX_MONTH_SOLO';
      const passLimits = calculatePassLimits(passType, durationMonths);

      if (currentEnt) {
        await db
          .update(userEntitlements)
          .set({
            planType: passType,
            maxStartupPlans: Math.max(
              currentEnt.maxStartupPlans,
              passLimits.maxStartupPlans
            ),
            maxSeatsPerPlan: Math.max(
              currentEnt.maxSeatsPerPlan,
              passLimits.maxSeatsPerPlan
            ),
            monthlyAiCreditsLimit: Math.max(
              currentEnt.monthlyAiCreditsLimit,
              passLimits.monthlyAiCreditsLimit
            ),
            accessExpiresAt: passLimits.accessExpiresAt,
            isVaultReadonly: false,
            updatedAt: new Date(),
          })
          .where(eq(userEntitlements.id, currentEnt.id));
      } else {
        await db.insert(userEntitlements).values({
          userId: user.id,
          planType: passType,
          stackedCodesCount: 0,
          maxStartupPlans: passLimits.maxStartupPlans,
          maxSeatsPerPlan: passLimits.maxSeatsPerPlan,
          monthlyAiCreditsLimit: passLimits.monthlyAiCreditsLimit,
          aiCreditsUsedThisMonth: 0,
          whiteLabelExportEnabled: false,
          accessExpiresAt: passLimits.accessExpiresAt,
          isVaultReadonly: false,
        });
      }

      if (foundVoucher) {
        await db
          .update(vouchers)
          .set({
            status: 'REDEEMED',
            redeemedByUserId: user.id,
            redeemedAt: new Date(),
          })
          .where(eq(vouchers.id, foundVoucher.id));
      } else {
        await db.insert(vouchers).values({
          code: cleanCode,
          batchName: 'Partner_Pass_Redemption',
          source: 'PARTNER',
          rewardType,
          durationMonths,
          status: 'REDEEMED',
          redeemedByUserId: user.id,
          redeemedAt: new Date(),
        });
      }

      const passLabel =
        rewardType === 'PASS_COFOUNDER'
          ? `Partner Co-Founder Pass (${durationMonths} Months)`
          : `Partner Solo Pass (${durationMonths} Months)`;

      return {
        ok: true,
        message: `Voucher ${cleanCode} redeemed successfully! You have unlocked ${passLabel}.`,
        redeemedCode: cleanCode,
        newTierName: passLabel,
        maxStartupPlans: passLimits.maxStartupPlans,
        monthlyAiCreditsLimit: passLimits.monthlyAiCreditsLimit,
        isVaultReadonly: false,
      };
    }
  } catch (err) {
    console.error('[Voucher Redeem] Error:', err);
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while redeeming your voucher.',
    };
  }
}
