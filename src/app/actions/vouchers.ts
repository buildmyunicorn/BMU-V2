'use server';

import { eq, and, sql } from 'drizzle-orm';
import {
  db,
  ensureDatabaseSchemaSynced,
  vouchers,
  cohorts,
  users,
  userEntitlements,
} from '@/db';
import {
  getServerSessionCookie,
  getAdminSessionCookie,
  setServerSessionCookie,
  checkRateLimit,
} from '@/lib/auth/server-auth';
import {
  calculateAppSumoTierLimits,
  calculatePassLimits,
  type EntitlementSnapshot,
} from '@/lib/entitlements';
import { sendSystemEmail } from '@/lib/email/send';
import { EMAIL_DEFAULTS } from '@/lib/email/resend';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface FounderClientContext {
  userId?: string;
  email?: string;
}

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
  entitlement?: EntitlementSnapshot;
  redeemedCodes?: string[];
  cohortCode?: string;
}

export interface FounderVoucherStateResult {
  ok: boolean;
  authenticated: boolean;
  userId?: string;
  userEmail?: string;
  userName?: string;
  entitlement?: EntitlementSnapshot;
  redeemedCodes: string[];
  cohortCode?: string;
}

async function resolveAuthenticatedFounderUser(
  clientContext?: FounderClientContext
): Promise<(typeof users.$inferSelect) | null> {
  await ensureDatabaseSchemaSynced();

  const sessionPayload = await getServerSessionCookie();
  const adminPayload = await getAdminSessionCookie();

  let foundUser: (typeof users.$inferSelect) | undefined;

  // 1. Primary: Check founder HttpOnly session cookie
  if (sessionPayload) {
    if (UUID_REGEX.test(sessionPayload.userId)) {
      const [byId] = await db
        .select()
        .from(users)
        .where(eq(users.id, sessionPayload.userId))
        .limit(1);
      foundUser = byId;
    }

    if (!foundUser && sessionPayload.email) {
      const [byEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, sessionPayload.email.trim().toLowerCase()))
        .limit(1);
      foundUser = byEmail;
    }
  }

  // 2. If an active Super Admin session exists in the same browser and a workspace user email is active
  if (!foundUser && adminPayload) {
    const targetEmail = (
      clientContext?.email ||
      adminPayload.email ||
      ''
    )
      .trim()
      .toLowerCase();
    if (targetEmail) {
      const [byAdminTarget] = await db
        .select()
        .from(users)
        .where(eq(users.email, targetEmail))
        .limit(1);
      foundUser = byAdminTarget;
    }
  }

  // 3. Local development fallback for seeded demo personas (never trust clientContext without cookie in production)
  if (
    !foundUser &&
    process.env.NODE_ENV !== 'production' &&
    clientContext?.email
  ) {
    const [byDevEmail] = await db
      .select()
      .from(users)
      .where(eq(users.email, clientContext.email.trim().toLowerCase()))
      .limit(1);
    foundUser = byDevEmail;
  }

  if (!foundUser || foundUser.status !== 'ACTIVE') {
    return null;
  }

  // Ensure the founder session cookie stays synchronized with the resolved DB user
  if (!sessionPayload || sessionPayload.userId !== foundUser.id) {
    await setServerSessionCookie({
      userId: foundUser.id,
      email: foundUser.email,
    });
  }

  return foundUser;
}

function mapEntitlementSnapshot(
  userId: string,
  entRow?: typeof userEntitlements.$inferSelect | null
): EntitlementSnapshot {
  const freeDefaults = calculatePassLimits('FREE_HOOK');
  if (!entRow) {
    return {
      userId,
      planType: 'FREE_HOOK',
      stackedCodesCount: 0,
      maxStartupPlans: freeDefaults.maxStartupPlans,
      maxSeatsPerPlan: freeDefaults.maxSeatsPerPlan,
      monthlyAiCreditsLimit: freeDefaults.monthlyAiCreditsLimit,
      aiCreditsUsedThisMonth: 0,
      whiteLabelExportEnabled: false,
      isVaultReadonly: false,
    };
  }

  return {
    userId: entRow.userId,
    planType: entRow.planType,
    stackedCodesCount: entRow.stackedCodesCount,
    maxStartupPlans: entRow.maxStartupPlans,
    maxSeatsPerPlan: entRow.maxSeatsPerPlan,
    monthlyAiCreditsLimit: entRow.monthlyAiCreditsLimit,
    aiCreditsUsedThisMonth: entRow.aiCreditsUsedThisMonth,
    whiteLabelExportEnabled: entRow.whiteLabelExportEnabled,
    customApiKeyEncrypted: entRow.customApiKeyEncrypted
      ? 'enc_gemini_byok_active'
      : null,
    accessExpiresAt: entRow.accessExpiresAt,
    isVaultReadonly: entRow.isVaultReadonly,
  };
}

/**
 * Fetches the authenticated founder's live entitlement & redeemed voucher codes from PostgreSQL.
 */
export async function getFounderVoucherStateAction(
  clientContext?: FounderClientContext
): Promise<FounderVoucherStateResult> {
  try {
    const user = await resolveAuthenticatedFounderUser(clientContext);
    if (!user) {
      return {
        ok: true,
        authenticated: false,
        redeemedCodes: [],
      };
    }

    const [entRow] = await db
      .select()
      .from(userEntitlements)
      .where(eq(userEntitlements.userId, user.id))
      .limit(1);

    const userVouchers = await db
      .select()
      .from(vouchers)
      .where(
        and(
          eq(vouchers.redeemedByUserId, user.id),
          eq(vouchers.status, 'REDEEMED')
        )
      );

    let cohortCode: string | undefined;
    if (user.cohortId) {
      const [cohortRow] = await db
        .select()
        .from(cohorts)
        .where(eq(cohorts.id, user.cohortId))
        .limit(1);
      if (cohortRow) {
        cohortCode = cohortRow.inviteCode;
      }
    }

    return {
      ok: true,
      authenticated: true,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      entitlement: mapEntitlementSnapshot(user.id, entRow),
      redeemedCodes: userVouchers.map((v) => v.code),
      cohortCode,
    };
  } catch (err) {
    console.error('[Voucher State] Failed to load founder voucher state:', err);
    return {
      ok: false,
      authenticated: false,
      redeemedCodes: [],
    };
  }
}

/**
 * Redeems an AppSumo, Partner, Promo, or Institutional Cohort code for the active founder session.
 * Supports:
 * - AppSumo Lifetime Stacking (Tier 1 -> Tier 2 -> Tier 3)
 * - Partner & Promo Passes (Lifetime, Pass Solo, Pass Co-Founder with month duration)
 * - Institutional Cohort Codes (SPF-UCD-..., BMU-...)
 */
export async function redeemVoucherOrCohortCodeAction(
  code: string,
  clientContext?: FounderClientContext
): Promise<RedeemVoucherResult> {
  const cleanCode = (code || '').trim().toUpperCase();
  if (!cleanCode) {
    return { ok: false, error: 'Please enter a valid voucher or cohort code.' };
  }

  try {
    const user = await resolveAuthenticatedFounderUser(clientContext);
    if (!user) {
      return {
        ok: false,
        error: 'You must be signed in to redeem or stack a voucher code.',
      };
    }

    const rateLimit = checkRateLimit(`voucher:redeem:${user.id}`, 8, 60_000);
    if (!rateLimit.allowed) {
      return {
        ok: false,
        error: `Too many redemption attempts. Please wait ${rateLimit.retryAfterSeconds}s.`,
      };
    }

    const [currentEnt] = await db
      .select()
      .from(userEntitlements)
      .where(eq(userEntitlements.userId, user.id))
      .limit(1);

    const cleanAlpha = cleanCode.replace(/[^A-Z0-9]/gi, '').toUpperCase();

    // 1. Check if this is an Institutional Cohort Code (exact or hyphen-agnostic match)
    const [foundCohort] = await db
      .select()
      .from(cohorts)
      .where(
        sql`UPPER(${cohorts.inviteCode}) = ${cleanCode} OR UPPER(REPLACE(${cohorts.inviteCode}, '-', '')) = ${cleanAlpha}`
      )
      .limit(1);

    if (foundCohort) {
      if (
        foundCohort.expiresAt &&
        new Date(foundCohort.expiresAt).getTime() < Date.now()
      ) {
        return {
          ok: false,
          error: `Institutional cohort code ${cleanCode} has expired.`,
        };
      }

      const isAlreadyInCohort = user.cohortId === foundCohort.id;
      if (
        !isAlreadyInCohort &&
        foundCohort.seatsUsed >= foundCohort.maxSeats
      ) {
        return {
          ok: false,
          error: `Cohort "${foundCohort.name}" has reached its maximum capacity (${foundCohort.maxSeats} seats).`,
        };
      }

      const durationMonths = foundCohort.accessDurationMonths || 6;
      const cohortLimits = calculatePassLimits('COHORT_PASS', durationMonths);

      await db
        .update(users)
        .set({ cohortId: foundCohort.id, updatedAt: new Date() })
        .where(eq(users.id, user.id));

      if (!isAlreadyInCohort) {
        await db
          .update(cohorts)
          .set({
            seatsUsed: sql`${cohorts.seatsUsed} + 1`,
          })
          .where(eq(cohorts.id, foundCohort.id));
      }

      let updatedEntRow: typeof userEntitlements.$inferSelect;
      if (currentEnt) {
        const [updated] = await db
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
            accessExpiresAt:
              foundCohort.expiresAt || cohortLimits.accessExpiresAt,
            isVaultReadonly: false,
            updatedAt: new Date(),
          })
          .where(eq(userEntitlements.id, currentEnt.id))
          .returning();
        updatedEntRow = updated;
      } else {
        const [inserted] = await db
          .insert(userEntitlements)
          .values({
            userId: user.id,
            planType: 'COHORT_PASS',
            stackedCodesCount: 0,
            maxStartupPlans: cohortLimits.maxStartupPlans,
            maxSeatsPerPlan: cohortLimits.maxSeatsPerPlan,
            monthlyAiCreditsLimit: cohortLimits.monthlyAiCreditsLimit,
            aiCreditsUsedThisMonth: 0,
            whiteLabelExportEnabled: false,
            accessExpiresAt:
              foundCohort.expiresAt || cohortLimits.accessExpiresAt,
            isVaultReadonly: false,
          })
          .returning();
        updatedEntRow = inserted;
      }

      const userVouchers = await db
        .select()
        .from(vouchers)
        .where(
          and(
            eq(vouchers.redeemedByUserId, user.id),
            eq(vouchers.status, 'REDEEMED')
          )
        );

      // Fire asynchronous confirmation email
      const cohortExpires =
        foundCohort.expiresAt || cohortLimits.accessExpiresAt;
      const cohortActivatedDate = new Intl.DateTimeFormat('en-IE', {
        dateStyle: 'long',
      }).format(new Date());
      const cohortValidUntilDate = cohortExpires
        ? new Intl.DateTimeFormat('en-IE', { dateStyle: 'long' }).format(
            cohortExpires
          )
        : 'Active Cohort Term';

      sendSystemEmail({
        to: user.email,
        replyTo: 'Tom@startuppreflight.com',
        template: 'VOUCHER_REDEEMED',
        subject: `Pass Activated: Enrolled in ${foundCohort.name}!`,
        props: {
          founderName: user.name || undefined,
          recipientEmail: user.email,
          voucherCode: cleanCode,
          tierName: `${foundCohort.name} Cohort Pass`,
          activatedDate: cohortActivatedDate,
          validUntilDate: cohortValidUntilDate,
          maxPlans: updatedEntRow.maxStartupPlans,
          maxSeats: updatedEntRow.maxSeatsPerPlan,
          aiCreditsMonthly: updatedEntRow.monthlyAiCreditsLimit,
          loginUrl: `${EMAIL_DEFAULTS.appUrl}/workspace`,
        },
        metadata: {
          userId: user.id,
          trigger: 'COHORT_CODE_REDEEMED',
          voucherCode: cleanCode,
        },
      }).catch((e) => {
        console.error(
          '[SPF Email] Failed to send cohort confirmation email:',
          e
        );
      });

      return {
        ok: true,
        message: `Successfully enrolled in "${foundCohort.name}" Institutional Cohort! Full Module A–L access unlocked.`,
        redeemedCode: cleanCode,
        newTierName: foundCohort.name,
        maxStartupPlans: updatedEntRow.maxStartupPlans,
        monthlyAiCreditsLimit: updatedEntRow.monthlyAiCreditsLimit,
        isVaultReadonly: false,
        entitlement: mapEntitlementSnapshot(user.id, updatedEntRow),
        redeemedCodes: userVouchers.map((v) => v.code),
        cohortCode: cleanCode,
      };
    }

    // 2. Look up Voucher in `vouchers` table (exact or hyphen-agnostic match)
    const [foundVoucher] = await db
      .select()
      .from(vouchers)
      .where(
        sql`UPPER(${vouchers.code}) = ${cleanCode} OR UPPER(REPLACE(${vouchers.code}, '-', '')) = ${cleanAlpha}`
      )
      .limit(1);

    if (!foundVoucher) {
      return {
        ok: false,
        error: `Invalid or unrecognized voucher code "${cleanCode}". Please check the code and try again.`,
      };
    }

    if (foundVoucher.status === 'REDEEMED') {
      if (foundVoucher.redeemedByUserId === user.id) {
        return {
          ok: false,
          error: `Voucher ${cleanCode} has already been applied to your account.`,
        };
      }
      return {
        ok: false,
        error: `Voucher ${cleanCode} has already been claimed by another account. Individual voucher codes are single-use. If you are part of a program or testing cohort, please use your shared cohort invite code.`,
      };
    }

    if (foundVoucher.status === 'REFUNDED_REVOKED') {
      return {
        ok: false,
        error: `Voucher ${cleanCode} has been revoked or refunded and is no longer valid.`,
      };
    }

    const now = new Date();

    // Mark voucher redeemed first so subsequent queries include it
    await db
      .update(vouchers)
      .set({
        status: 'REDEEMED',
        redeemedByUserId: user.id,
        redeemedAt: now,
      })
      .where(eq(vouchers.id, foundVoucher.id));

    // Fetch all active redeemed vouchers for this user
    const userVouchers = await db
      .select()
      .from(vouchers)
      .where(
        and(
          eq(vouchers.redeemedByUserId, user.id),
          eq(vouchers.status, 'REDEEMED')
        )
      );

    const rewardType = foundVoucher.rewardType || 'APPSUMO_LTD';
    const durationMonths = foundVoucher.durationMonths || 6;

    if (rewardType === 'APPSUMO_LTD') {
      const redeemedAppSumoCount = userVouchers.filter(
        (v) => (v.rewardType || 'APPSUMO_LTD') === 'APPSUMO_LTD'
      ).length;

      const baseStacked =
        currentEnt?.planType === 'APPSUMO_LTD'
          ? currentEnt.stackedCodesCount || 0
          : 0;
      const newStacked = Math.max(baseStacked + 1, redeemedAppSumoCount, 1);
      const limits = calculateAppSumoTierLimits(newStacked);

      let updatedEntRow: typeof userEntitlements.$inferSelect;
      if (currentEnt) {
        const [updated] = await db
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
            updatedAt: now,
          })
          .where(eq(userEntitlements.id, currentEnt.id))
          .returning();
        updatedEntRow = updated;
      } else {
        const [inserted] = await db
          .insert(userEntitlements)
          .values({
            userId: user.id,
            planType: 'APPSUMO_LTD',
            stackedCodesCount: newStacked,
            maxStartupPlans: limits.maxStartupPlans,
            maxSeatsPerPlan: limits.maxSeatsPerPlan,
            monthlyAiCreditsLimit: limits.monthlyAiCreditsLimit,
            aiCreditsUsedThisMonth: 0,
            whiteLabelExportEnabled: limits.whiteLabelExportEnabled,
            isVaultReadonly: false,
          })
          .returning();
        updatedEntRow = inserted;
      }

      const activatedDate = new Intl.DateTimeFormat('en-IE', {
        dateStyle: 'long',
      }).format(now);
      const validUntilDate = 'Lifetime Access (Never Expires)';

      // Fire asynchronous confirmation email
      sendSystemEmail({
        to: user.email,
        replyTo: 'Tom@startuppreflight.com',
        template: 'VOUCHER_REDEEMED',
        subject: `Pass Activated: Code ${cleanCode} Redeemed!`,
        props: {
          founderName: user.name || undefined,
          recipientEmail: user.email,
          voucherCode: cleanCode,
          tierName: limits.tierName,
          activatedDate,
          validUntilDate,
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
        message: `Voucher ${cleanCode} redeemed! Your account is now upgraded to ${limits.tierName}.`,
        redeemedCode: cleanCode,
        newTierName: limits.tierName,
        totalStackedCodes: newStacked,
        maxStartupPlans: updatedEntRow.maxStartupPlans,
        monthlyAiCreditsLimit: updatedEntRow.monthlyAiCreditsLimit,
        isVaultReadonly: false,
        entitlement: mapEntitlementSnapshot(user.id, updatedEntRow),
        redeemedCodes: userVouchers.map((v) => v.code),
      };
    } else {
      // Partner Pass (Solo or Co-Founder, time-limited)
      const passType =
        rewardType === 'PASS_COFOUNDER'
          ? 'SIX_MONTH_COFOUNDER'
          : 'SIX_MONTH_SOLO';
      const passLimits = calculatePassLimits(passType, durationMonths);

      let updatedEntRow: typeof userEntitlements.$inferSelect;
      if (currentEnt) {
        const [updated] = await db
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
            updatedAt: now,
          })
          .where(eq(userEntitlements.id, currentEnt.id))
          .returning();
        updatedEntRow = updated;
      } else {
        const [inserted] = await db
          .insert(userEntitlements)
          .values({
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
          })
          .returning();
        updatedEntRow = inserted;
      }

      const passLabel =
        rewardType === 'PASS_COFOUNDER'
          ? `Partner Co-Founder Pass (${durationMonths} Months)`
          : `Partner Solo Pass (${durationMonths} Months)`;

      const passActivatedDate = new Intl.DateTimeFormat('en-IE', {
        dateStyle: 'long',
      }).format(now);
      const passValidUntilDate = passLimits.accessExpiresAt
        ? new Intl.DateTimeFormat('en-IE', { dateStyle: 'long' }).format(
            passLimits.accessExpiresAt
          )
        : `${durationMonths} Months`;

      // Fire asynchronous confirmation email
      sendSystemEmail({
        to: user.email,
        replyTo: 'Tom@startuppreflight.com',
        template: 'VOUCHER_REDEEMED',
        subject: `Pass Activated: Code ${cleanCode} Redeemed!`,
        props: {
          founderName: user.name || undefined,
          recipientEmail: user.email,
          voucherCode: cleanCode,
          tierName: passLabel,
          activatedDate: passActivatedDate,
          validUntilDate: passValidUntilDate,
          maxPlans: updatedEntRow.maxStartupPlans,
          maxSeats: updatedEntRow.maxSeatsPerPlan,
          aiCreditsMonthly: updatedEntRow.monthlyAiCreditsLimit,
          loginUrl: `${EMAIL_DEFAULTS.appUrl}/workspace`,
        },
        metadata: {
          userId: user.id,
          trigger: 'PARTNER_PASS_REDEEMED',
          voucherCode: cleanCode,
        },
      }).catch((e) => {
        console.error(
          '[SPF Email] Failed to send partner pass confirmation email:',
          e
        );
      });

      return {
        ok: true,
        message: `Voucher ${cleanCode} redeemed successfully! You have unlocked ${passLabel}.`,
        redeemedCode: cleanCode,
        newTierName: passLabel,
        maxStartupPlans: updatedEntRow.maxStartupPlans,
        monthlyAiCreditsLimit: updatedEntRow.monthlyAiCreditsLimit,
        isVaultReadonly: false,
        entitlement: mapEntitlementSnapshot(user.id, updatedEntRow),
        redeemedCodes: userVouchers.map((v) => v.code),
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
