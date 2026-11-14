'use server';

import { eq, and, lt, sql, isNull } from 'drizzle-orm';
import {
  db,
  ensureDatabaseSchemaSynced,
  vouchers,
  cohorts,
  users,
  userEntitlements,
  startupPlans,
} from '@/db';
import {
  getServerSessionCookie,
  requireVerifiedSuperAdminSession,
  checkRateLimit,
  getTrustedClientIp,
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

/**
 * Strictly resolves the authenticated founder user by verified UUID session cookie.
 * Never promotes non-UUID fallback cookies via email lookup.
 */
async function resolveAuthenticatedFounderUser(): Promise<
  (typeof users.$inferSelect) | null
> {
  await ensureDatabaseSchemaSynced();

  const sessionPayload = await getServerSessionCookie();
  if (sessionPayload && UUID_REGEX.test(sessionPayload.userId)) {
    const [byId] = await db
      .select()
      .from(users)
      .where(eq(users.id, sessionPayload.userId))
      .limit(1);
    if (byId && byId.status === 'ACTIVE' && !byId.deletedAt) {
      return byId;
    }
    return null;
  }

  const adminPayload = await requireVerifiedSuperAdminSession();
  if (adminPayload && UUID_REGEX.test(adminPayload.userId)) {
    const [byAdminId] = await db
      .select()
      .from(users)
      .where(eq(users.id, adminPayload.userId))
      .limit(1);
    if (byAdminId && byAdminId.status === 'ACTIVE' && !byAdminId.deletedAt) {
      return byAdminId;
    }
  }

  return null;
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

export async function getFounderVoucherStateAction(
  _clientContext?: FounderClientContext
): Promise<FounderVoucherStateResult> {
  try {
    const user = await resolveAuthenticatedFounderUser();
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

export async function redeemVoucherOrCohortCodeAction(
  code: string,
  _clientContext?: FounderClientContext
): Promise<RedeemVoucherResult> {
  const cleanCode =
    typeof code === 'string' ? code.trim().toUpperCase().slice(0, 64) : '';
  if (!cleanCode) {
    return {
      ok: false,
      error: 'Please enter a valid voucher or cohort code.',
    };
  }

  try {
    const user = await resolveAuthenticatedFounderUser();
    if (!user) {
      return {
        ok: false,
        error: 'You must be signed in to redeem or stack a voucher code.',
      };
    }

    const clientIp = await getTrustedClientIp();
    const userLimit = checkRateLimit(`voucher:redeem:${user.id}`, 8, 60_000);
    const ipLimit = checkRateLimit(
      `voucher:redeem:ip:${clientIp}`,
      12,
      5 * 60_000
    );
    if (!userLimit.allowed || !ipLimit.allowed) {
      const retryAfter = Math.max(
        userLimit.retryAfterSeconds,
        ipLimit.retryAfterSeconds
      );
      return {
        ok: false,
        error: `Too many redemption attempts. Please wait ${retryAfter}s.`,
      };
    }

    const cleanAlpha = cleanCode.replace(/[^A-Z0-9]/gi, '').toUpperCase();

    // 1. Institutional Cohort Code Check
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

      const { updatedEntRow, userVouchers } = await db.transaction(
        async (tx) => {
          if (!isAlreadyInCohort) {
            const seatClaim = await tx
              .update(cohorts)
              .set({
                seatsUsed: sql`${cohorts.seatsUsed} + 1`,
              })
              .where(
                and(
                  eq(cohorts.id, foundCohort.id),
                  lt(cohorts.seatsUsed, foundCohort.maxSeats)
                )
              )
              .returning({ id: cohorts.id });

            if (seatClaim.length === 0) {
              throw new Error('COHORT_FULL_RACE');
            }
          }

          await tx
            .update(users)
            .set({ cohortId: foundCohort.id, updatedAt: new Date() })
            .where(eq(users.id, user.id));

          await tx
            .update(startupPlans)
            .set({ cohortId: foundCohort.id, updatedAt: new Date() })
            .where(
              and(
                eq(startupPlans.ownerUserId, user.id),
                isNull(startupPlans.cohortId)
              )
            );

          const [currentEnt] = await tx
            .select()
            .from(userEntitlements)
            .where(eq(userEntitlements.userId, user.id))
            .limit(1);

          let entRow: typeof userEntitlements.$inferSelect;
          if (currentEnt) {
            // Preserve lifetime APPSUMO_LTD tier so joining a cohort never downgrades a lifetime pass
            const keepLifetime = currentEnt.planType === 'APPSUMO_LTD';
            const [updated] = await tx
              .update(userEntitlements)
              .set({
                planType: keepLifetime ? 'APPSUMO_LTD' : 'COHORT_PASS',
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
                accessExpiresAt: keepLifetime
                  ? null
                  : foundCohort.expiresAt || cohortLimits.accessExpiresAt,
                isVaultReadonly: false,
                updatedAt: new Date(),
              })
              .where(eq(userEntitlements.id, currentEnt.id))
              .returning();
            entRow = updated;
          } else {
            const [inserted] = await tx
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
            entRow = inserted;
          }

          const redeemedList = await tx
            .select()
            .from(vouchers)
            .where(
              and(
                eq(vouchers.redeemedByUserId, user.id),
                eq(vouchers.status, 'REDEEMED')
              )
            );

          return { updatedEntRow: entRow, userVouchers: redeemedList };
        }
      );

      const cohortExpires =
        foundCohort.expiresAt || cohortLimits.accessExpiresAt;
      const cohortActivatedDate = new Intl.DateTimeFormat('en-IE', {
        dateStyle: 'long',
      }).format(new Date());
      const cohortValidUntilDate =
        updatedEntRow.planType === 'APPSUMO_LTD'
          ? 'Lifetime Access (Never Expires)'
          : cohortExpires
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

    // 2. Single-Use Voucher Redemption (Atomic Conditional Claim)
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
        error: `Voucher ${cleanCode} has already been claimed by another account. Individual voucher codes are single-use.`,
      };
    }

    if (foundVoucher.status !== 'UNCLAIMED') {
      return {
        ok: false,
        error: `Voucher ${cleanCode} has been revoked or refunded and is no longer valid.`,
      };
    }

    const now = new Date();
    const rewardType = foundVoucher.rewardType || 'APPSUMO_LTD';
    const durationMonths = foundVoucher.durationMonths || 6;

    const txResult = await db.transaction(async (tx) => {
      const claimed = await tx
        .update(vouchers)
        .set({
          status: 'REDEEMED',
          redeemedByUserId: user.id,
          redeemedAt: now,
        })
        .where(
          and(
            eq(vouchers.id, foundVoucher.id),
            eq(vouchers.status, 'UNCLAIMED')
          )
        )
        .returning();

      if (claimed.length === 0) {
        throw new Error('VOUCHER_ALREADY_REDEEMED_RACE');
      }

      const userVouchers = await tx
        .select()
        .from(vouchers)
        .where(
          and(
            eq(vouchers.redeemedByUserId, user.id),
            eq(vouchers.status, 'REDEEMED')
          )
        );

      const [currentEnt] = await tx
        .select()
        .from(userEntitlements)
        .where(eq(userEntitlements.userId, user.id))
        .limit(1);

      if (rewardType === 'APPSUMO_LTD') {
        const redeemedAppSumoCount = userVouchers.filter(
          (v) => (v.rewardType || 'APPSUMO_LTD') === 'APPSUMO_LTD'
        ).length;

        const baseStacked =
          currentEnt?.planType === 'APPSUMO_LTD'
            ? currentEnt.stackedCodesCount || 0
            : 0;
        const newStacked = Math.min(
          10,
          Math.max(baseStacked + 1, redeemedAppSumoCount, 1)
        );
        const limits = calculateAppSumoTierLimits(newStacked);

        let updatedEntRow: typeof userEntitlements.$inferSelect;
        if (currentEnt) {
          const [updated] = await tx
            .update(userEntitlements)
            .set({
              planType: 'APPSUMO_LTD',
              stackedCodesCount: newStacked,
              maxStartupPlans: limits.maxStartupPlans,
              maxSeatsPerPlan: limits.maxSeatsPerPlan,
              monthlyAiCreditsLimit: limits.monthlyAiCreditsLimit,
              whiteLabelExportEnabled: limits.whiteLabelExportEnabled,
              isVaultReadonly: false,
              accessExpiresAt: null,
              updatedAt: now,
            })
            .where(eq(userEntitlements.id, currentEnt.id))
            .returning();
          updatedEntRow = updated;
        } else {
          const [inserted] = await tx
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

        return {
          mode: 'APPSUMO_LTD' as const,
          updatedEntRow,
          userVouchers,
          newStacked,
          tierName: limits.tierName,
        };
      }

      const passType =
        rewardType === 'PASS_COFOUNDER'
          ? 'SIX_MONTH_COFOUNDER'
          : 'SIX_MONTH_SOLO';
      const passLimits = calculatePassLimits(passType, durationMonths);

      let updatedEntRow: typeof userEntitlements.$inferSelect;
      if (currentEnt) {
        const keepLifetime = currentEnt.planType === 'APPSUMO_LTD';
        const [updated] = await tx
          .update(userEntitlements)
          .set({
            planType: keepLifetime ? 'APPSUMO_LTD' : passType,
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
            accessExpiresAt: keepLifetime ? null : passLimits.accessExpiresAt,
            isVaultReadonly: false,
            updatedAt: now,
          })
          .where(eq(userEntitlements.id, currentEnt.id))
          .returning();
        updatedEntRow = updated;
      } else {
        const [inserted] = await tx
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

      return {
        mode: 'PARTNER_PASS' as const,
        updatedEntRow,
        userVouchers,
        passLimits,
      };
    });

    if (txResult.mode === 'APPSUMO_LTD') {
      const activatedDate = new Intl.DateTimeFormat('en-IE', {
        dateStyle: 'long',
      }).format(now);
      sendSystemEmail({
        to: user.email,
        replyTo: 'Tom@startuppreflight.com',
        template: 'VOUCHER_REDEEMED',
        subject: `Pass Activated: Code ${cleanCode} Redeemed!`,
        props: {
          founderName: user.name || undefined,
          recipientEmail: user.email,
          voucherCode: cleanCode,
          tierName: txResult.tierName,
          activatedDate,
          validUntilDate: 'Lifetime Access (Never Expires)',
          maxPlans: txResult.updatedEntRow.maxStartupPlans,
          maxSeats: txResult.updatedEntRow.maxSeatsPerPlan,
          aiCreditsMonthly: txResult.updatedEntRow.monthlyAiCreditsLimit,
          loginUrl: `${EMAIL_DEFAULTS.appUrl}/workspace`,
        },
        metadata: {
          userId: user.id,
          trigger: 'APPSUMO_VOUCHER_REDEEMED',
          voucherCode: cleanCode,
          totalStacked: txResult.newStacked,
        },
      }).catch((e) => {
        console.error('[SPF Email] Failed to send voucher confirmation email:', e);
      });

      return {
        ok: true,
        message: `Voucher ${cleanCode} redeemed! Your account is now upgraded to ${txResult.tierName}.`,
        redeemedCode: cleanCode,
        newTierName: txResult.tierName,
        totalStackedCodes: txResult.newStacked,
        maxStartupPlans: txResult.updatedEntRow.maxStartupPlans,
        monthlyAiCreditsLimit: txResult.updatedEntRow.monthlyAiCreditsLimit,
        isVaultReadonly: false,
        entitlement: mapEntitlementSnapshot(user.id, txResult.updatedEntRow),
        redeemedCodes: txResult.userVouchers.map((v) => v.code),
      };
    }

    const passLabel =
      rewardType === 'PASS_COFOUNDER'
        ? `Partner Co-Founder Pass (${durationMonths} Months)`
        : `Partner Solo Pass (${durationMonths} Months)`;
    const passActivatedDate = new Intl.DateTimeFormat('en-IE', {
      dateStyle: 'long',
    }).format(now);
    const passValidUntilDate =
      txResult.updatedEntRow.planType === 'APPSUMO_LTD'
        ? 'Lifetime Access (Never Expires)'
        : txResult.passLimits.accessExpiresAt
          ? new Intl.DateTimeFormat('en-IE', { dateStyle: 'long' }).format(
              txResult.passLimits.accessExpiresAt
            )
          : `${durationMonths} Months`;

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
        maxPlans: txResult.updatedEntRow.maxStartupPlans,
        maxSeats: txResult.updatedEntRow.maxSeatsPerPlan,
        aiCreditsMonthly: txResult.updatedEntRow.monthlyAiCreditsLimit,
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
      maxStartupPlans: txResult.updatedEntRow.maxStartupPlans,
      monthlyAiCreditsLimit: txResult.updatedEntRow.monthlyAiCreditsLimit,
      isVaultReadonly: false,
      entitlement: mapEntitlementSnapshot(user.id, txResult.updatedEntRow),
      redeemedCodes: txResult.userVouchers.map((v) => v.code),
    };
  } catch (err) {
    if (err instanceof Error && err.message === 'VOUCHER_ALREADY_REDEEMED_RACE') {
      return {
        ok: false,
        error: `Voucher ${cleanCode} has already been claimed.`,
      };
    }
    if (err instanceof Error && err.message === 'COHORT_FULL_RACE') {
      return {
        ok: false,
        error: 'This cohort has reached its maximum seat capacity.',
      };
    }
    console.error('[Voucher Redeem] Error:', err);
    return {
      ok: false,
      error: 'An unexpected error occurred while redeeming your voucher.',
    };
  }
}
