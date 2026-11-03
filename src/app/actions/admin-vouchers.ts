'use server';

import crypto from 'crypto';
import { eq, desc, and, sql, inArray } from 'drizzle-orm';
import {
  db,
  vouchers,
  cohorts,
  users,
  userEntitlements,
  tenants,
} from '@/db';
import { getAdminSessionCookie, checkRateLimit } from '@/lib/auth/server-auth';
import {
  calculateAppSumoTierLimits,
  calculatePassLimits,
} from '@/lib/entitlements';

export type VoucherSourceType = 'APPSUMO' | 'COHORT' | 'PROMO' | 'PARTNER';
export type VoucherRewardType = 'APPSUMO_LTD' | 'PASS_SOLO' | 'PASS_COFOUNDER';
export type VoucherStatusType = 'UNCLAIMED' | 'REDEEMED' | 'REFUNDED_REVOKED';

export interface AdminVoucherSummary {
  id: string;
  code: string;
  batchName: string;
  source: VoucherSourceType;
  rewardType: VoucherRewardType;
  durationMonths: number | null;
  status: VoucherStatusType;
  redeemedByUserId: string | null;
  redeemedByUserEmail?: string | null;
  redeemedByUserName?: string | null;
  redeemedAt: string | null;
  revokedAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface AdminCohortSummary {
  id: string;
  tenantId: string;
  name: string;
  inviteCode: string;
  maxSeats: number;
  seatsUsed: number;
  accessDurationMonths: number;
  expiresAt: string | null;
  createdAt: string;
}

/**
 * Verifies caller has an active Super Admin server session
 */
async function verifyAdminAuth(): Promise<boolean> {
  const session = await getAdminSessionCookie();
  return Boolean(session && session.role === 'SUPER_ADMIN');
}

/**
 * Generate a random, cryptographically secure code segment
 */
function generateRandomCodePart(length: number): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Exclude ambiguous chars like 0, 1, I, O
  let result = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

/**
 * Generates formatted voucher code: e.g. SUMO-SPF-8F92-K41A or PRTN-ALPHA-7B2K-9X4M
 */
function formatVoucherCode(prefix: string): string {
  const cleanPrefix = prefix.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
  const part1 = generateRandomCodePart(4);
  const part2 = generateRandomCodePart(4);
  const finalPrefix = cleanPrefix.endsWith('-') ? cleanPrefix : `${cleanPrefix}-`;
  return `${finalPrefix}${part1}-${part2}`;
}

/**
 * 1. LIST VOUCHERS & COHORTS FOR ADMIN STUDIO
 */
export async function listAdminVouchersAndCohortsAction(): Promise<{
  ok: boolean;
  error?: string;
  vouchers: AdminVoucherSummary[];
  cohorts: AdminCohortSummary[];
  stats: {
    totalVouchers: number;
    unclaimedVouchers: number;
    redeemedVouchers: number;
    refundedVouchers: number;
    totalCohorts: number;
  };
}> {
  const isAdmin = await verifyAdminAuth();
  if (!isAdmin) {
    return {
      ok: false,
      error: 'Unauthorized: Super Admin access required.',
      vouchers: [],
      cohorts: [],
      stats: {
        totalVouchers: 0,
        unclaimedVouchers: 0,
        redeemedVouchers: 0,
        refundedVouchers: 0,
        totalCohorts: 0,
      },
    };
  }

  try {
    const rawVouchers = await db
      .select({
        voucher: vouchers,
        userEmail: users.email,
        userName: users.name,
      })
      .from(vouchers)
      .leftJoin(users, eq(vouchers.redeemedByUserId, users.id))
      .orderBy(desc(vouchers.createdAt))
      .limit(1000);

    const formattedVouchers: AdminVoucherSummary[] = rawVouchers.map((row) => ({
      id: row.voucher.id,
      code: row.voucher.code,
      batchName: row.voucher.batchName,
      source: row.voucher.source as VoucherSourceType,
      rewardType: (row.voucher.rewardType as VoucherRewardType) || 'APPSUMO_LTD',
      durationMonths: row.voucher.durationMonths,
      status: row.voucher.status as VoucherStatusType,
      redeemedByUserId: row.voucher.redeemedByUserId,
      redeemedByUserEmail: row.userEmail || null,
      redeemedByUserName: row.userName || null,
      redeemedAt: row.voucher.redeemedAt?.toISOString() || null,
      revokedAt: row.voucher.revokedAt?.toISOString() || null,
      notes: row.voucher.notes || null,
      createdAt: row.voucher.createdAt.toISOString(),
    }));

    const rawCohorts = await db
      .select()
      .from(cohorts)
      .orderBy(desc(cohorts.createdAt));

    const formattedCohorts: AdminCohortSummary[] = rawCohorts.map((c) => ({
      id: c.id,
      tenantId: c.tenantId,
      name: c.name,
      inviteCode: c.inviteCode,
      maxSeats: c.maxSeats,
      seatsUsed: c.seatsUsed,
      accessDurationMonths: c.accessDurationMonths,
      expiresAt: c.expiresAt?.toISOString() || null,
      createdAt: c.createdAt.toISOString(),
    }));

    const stats = {
      totalVouchers: formattedVouchers.length,
      unclaimedVouchers: formattedVouchers.filter((v) => v.status === 'UNCLAIMED').length,
      redeemedVouchers: formattedVouchers.filter((v) => v.status === 'REDEEMED').length,
      refundedVouchers: formattedVouchers.filter((v) => v.status === 'REFUNDED_REVOKED').length,
      totalCohorts: formattedCohorts.length,
    };

    return {
      ok: true,
      vouchers: formattedVouchers,
      cohorts: formattedCohorts,
      stats,
    };
  } catch (err: unknown) {
    console.error('[Admin Vouchers] Failed to load data:', err);
    return {
      ok: false,
      error: 'Failed to retrieve vouchers and cohorts.',
      vouchers: [],
      cohorts: [],
      stats: {
        totalVouchers: 0,
        unclaimedVouchers: 0,
        redeemedVouchers: 0,
        refundedVouchers: 0,
        totalCohorts: 0,
      },
    };
  }
}

/**
 * 2. BULK GENERATE VOUCHER BATCH
 */
export async function generateVoucherBatchAction(params: {
  batchName: string;
  source: VoucherSourceType;
  rewardType: VoucherRewardType;
  durationMonths?: number;
  quantity: number;
  prefix?: string;
  notes?: string;
}): Promise<{
  ok: boolean;
  error?: string;
  batchName?: string;
  generatedCount?: number;
  sampleCodes?: string[];
  csvContent?: string;
}> {
  const isAdmin = await verifyAdminAuth();
  if (!isAdmin) {
    return { ok: false, error: 'Unauthorized: Super Admin access required.' };
  }

  const batchName = params.batchName?.trim();
  if (!batchName) {
    return { ok: false, error: 'Batch name is required.' };
  }

  const quantity = Math.min(Math.max(1, params.quantity || 1), 5000);
  const source = params.source || 'APPSUMO';
  const rewardType = params.rewardType || 'APPSUMO_LTD';
  const durationMonths =
    rewardType === 'APPSUMO_LTD' ? null : params.durationMonths || 6;

  let defaultPrefix = 'SUMO-SPF-';
  if (source === 'PARTNER') defaultPrefix = 'PRTN-SPF-';
  if (source === 'PROMO') defaultPrefix = 'PROMO-SPF-';
  const prefix = (params.prefix?.trim() || defaultPrefix).toUpperCase();

  try {
    const generatedCodesSet = new Set<string>();
    while (generatedCodesSet.size < quantity) {
      generatedCodesSet.add(formatVoucherCode(prefix));
    }
    const codesArray = Array.from(generatedCodesSet);

    // Insert in chunks of 500 to keep queries snappy
    const CHUNK_SIZE = 500;
    for (let i = 0; i < codesArray.length; i += CHUNK_SIZE) {
      const chunk = codesArray.slice(i, i + CHUNK_SIZE).map((code) => ({
        code,
        batchName,
        source,
        rewardType,
        durationMonths,
        status: 'UNCLAIMED' as const,
        notes: params.notes?.trim() || null,
      }));
      await db.insert(vouchers).values(chunk);
    }

    // Build standard CSV for AppSumo / Partners
    const csvHeader = 'Code,Batch,Source,Reward,DurationMonths\n';
    const csvRows = codesArray
      .map(
        (code) =>
          `"${code}","${batchName}","${source}","${rewardType}","${
            durationMonths ?? 'Lifetime'
          }"`
      )
      .join('\n');
    const csvContent = csvHeader + csvRows;

    return {
      ok: true,
      batchName,
      generatedCount: codesArray.length,
      sampleCodes: codesArray.slice(0, 5),
      csvContent,
    };
  } catch (err: unknown) {
    console.error('[Admin Vouchers] Failed to generate batch:', err);
    return {
      ok: false,
      error: 'Failed to generate voucher batch. Please ensure batch parameters are valid.',
    };
  }
}

/**
 * 3. CREATE INSTITUTIONAL COHORT
 */
export async function createCohortAction(params: {
  name: string;
  inviteCode: string;
  maxSeats: number;
  accessDurationMonths?: number;
  tenantSlug?: string;
}): Promise<{
  ok: boolean;
  error?: string;
  cohort?: AdminCohortSummary;
}> {
  const isAdmin = await verifyAdminAuth();
  if (!isAdmin) {
    return { ok: false, error: 'Unauthorized: Super Admin access required.' };
  }

  const name = params.name?.trim();
  const rawCode = params.inviteCode?.trim().toUpperCase();
  if (!name || !rawCode) {
    return { ok: false, error: 'Cohort name and shared invite code are required.' };
  }

  // Ensure default tenant exists
  let tenantId: string | null = null;
  const [defaultTenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, 'default'))
    .limit(1);

  if (defaultTenant) {
    tenantId = defaultTenant.id;
  } else {
    const [created] = await db
      .insert(tenants)
      .values({
        name: 'Startup Preflight Global',
        slug: 'default',
      })
      .returning();
    tenantId = created.id;
  }

  try {
    const maxSeats = Math.max(1, params.maxSeats || 30);
    const accessDurationMonths = params.accessDurationMonths || 6;
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + accessDurationMonths);

    const [created] = await db
      .insert(cohorts)
      .values({
        tenantId,
        name,
        inviteCode: rawCode,
        maxSeats,
        seatsUsed: 0,
        accessDurationMonths,
        expiresAt,
      })
      .returning();

    return {
      ok: true,
      cohort: {
        id: created.id,
        tenantId: created.tenantId,
        name: created.name,
        inviteCode: created.inviteCode,
        maxSeats: created.maxSeats,
        seatsUsed: created.seatsUsed,
        accessDurationMonths: created.accessDurationMonths,
        expiresAt: created.expiresAt?.toISOString() || null,
        createdAt: created.createdAt.toISOString(),
      },
    };
  } catch (err: unknown) {
    console.error('[Admin Vouchers] Failed to create cohort:', err);
    return {
      ok: false,
      error: 'Failed to create cohort. That invite code may already be in use.',
    };
  }
}

/**
 * 4. 1-CLICK REFUND / REVOCATION ENGINE
 * Revokes a single voucher (e.g. AppSumo refund within 60 days).
 * - Decrements user's stacked count
 * - If user drops to 0 codes: transitions to FREE_HOOK + is_vault_readonly = true (no data loss)
 */
export async function revokeVoucherAction(params: {
  voucherId?: string;
  voucherCode?: string;
  reason?: string;
}): Promise<{
  ok: boolean;
  error?: string;
  revokedCode?: string;
  affectedUserEmail?: string | null;
  newPlanType?: string;
  newStackedCount?: number;
  vaultReadonlyApplied?: boolean;
}> {
  const isAdmin = await verifyAdminAuth();
  if (!isAdmin) {
    return { ok: false, error: 'Unauthorized: Super Admin access required.' };
  }

  try {
    let voucherQuery = db.select().from(vouchers);
    if (params.voucherId) {
      voucherQuery = voucherQuery.where(eq(vouchers.id, params.voucherId)) as any;
    } else if (params.voucherCode) {
      voucherQuery = voucherQuery.where(
        eq(vouchers.code, params.voucherCode.trim().toUpperCase())
      ) as any;
    } else {
      return { ok: false, error: 'Either voucherId or voucherCode must be provided.' };
    }

    const [voucher] = await voucherQuery.limit(1);
    if (!voucher) {
      return { ok: false, error: 'Voucher not found.' };
    }

    if (voucher.status === 'REFUNDED_REVOKED') {
      return { ok: false, error: 'This voucher has already been revoked / refunded.' };
    }

    const redeemedUserId = voucher.redeemedByUserId;
    const now = new Date();

    // Mark voucher as REFUNDED_REVOKED
    await db
      .update(vouchers)
      .set({
        status: 'REFUNDED_REVOKED',
        revokedAt: now,
        notes: params.reason
          ? `${voucher.notes || ''}\n[Revoked: ${params.reason.trim()}]`.trim()
          : voucher.notes,
      })
      .where(eq(vouchers.id, voucher.id));

    let affectedUserEmail: string | null = null;
    let newPlanType: string | undefined;
    let newStackedCount: number | undefined;
    let vaultReadonlyApplied = false;

    // If the voucher was already redeemed by a user, adjust their entitlement
    if (redeemedUserId) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, redeemedUserId))
        .limit(1);
      affectedUserEmail = user?.email || null;

      // Find remaining active/redeemed vouchers for this user
      const userActiveVouchers = await db
        .select()
        .from(vouchers)
        .where(
          and(
            eq(vouchers.redeemedByUserId, redeemedUserId),
            eq(vouchers.status, 'REDEEMED')
          )
        );

      const remainingAppSumoCodes = userActiveVouchers.filter(
        (v) => v.rewardType === 'APPSUMO_LTD'
      ).length;

      const [entitlement] = await db
        .select()
        .from(userEntitlements)
        .where(eq(userEntitlements.userId, redeemedUserId))
        .limit(1);

      if (entitlement) {
        if (voucher.rewardType === 'APPSUMO_LTD') {
          if (remainingAppSumoCodes > 0) {
            // User still has 1 or more codes stacked: re-calculate AppSumo limits
            const limits = calculateAppSumoTierLimits(remainingAppSumoCodes);
            await db
              .update(userEntitlements)
              .set({
                stackedCodesCount: limits.stackedCodesCount,
                maxStartupPlans: limits.maxStartupPlans,
                maxSeatsPerPlan: limits.maxSeatsPerPlan,
                monthlyAiCreditsLimit: limits.monthlyAiCreditsLimit,
                whiteLabelExportEnabled: limits.whiteLabelExportEnabled,
                updatedAt: now,
              })
              .where(eq(userEntitlements.id, entitlement.id));

            newPlanType = 'APPSUMO_LTD';
            newStackedCount = limits.stackedCodesCount;
          } else {
            // User refunded their only code!
            // Transition to FREE_HOOK and enable Read-Only Vault mode (prevents data loss)
            const freeLimits = calculatePassLimits('FREE_HOOK');
            await db
              .update(userEntitlements)
              .set({
                planType: 'FREE_HOOK',
                stackedCodesCount: 0,
                maxStartupPlans: freeLimits.maxStartupPlans,
                maxSeatsPerPlan: freeLimits.maxSeatsPerPlan,
                monthlyAiCreditsLimit: freeLimits.monthlyAiCreditsLimit,
                whiteLabelExportEnabled: false,
                isVaultReadonly: true,
                updatedAt: now,
              })
              .where(eq(userEntitlements.id, entitlement.id));

            newPlanType = 'FREE_HOOK';
            newStackedCount = 0;
            vaultReadonlyApplied = true;
          }
        } else {
          // If it was a time pass and no other active pass remains, switch to vault mode
          if (userActiveVouchers.length === 0) {
            await db
              .update(userEntitlements)
              .set({
                isVaultReadonly: true,
                updatedAt: now,
              })
              .where(eq(userEntitlements.id, entitlement.id));
            vaultReadonlyApplied = true;
          }
        }
      }
    }

    return {
      ok: true,
      revokedCode: voucher.code,
      affectedUserEmail,
      newPlanType,
      newStackedCount,
      vaultReadonlyApplied,
    };
  } catch (err: unknown) {
    console.error('[Admin Vouchers] Failed to revoke voucher:', err);
    return {
      ok: false,
      error: 'Failed to revoke voucher.',
    };
  }
}
