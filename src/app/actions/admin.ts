'use server';

import { eq, desc, inArray } from 'drizzle-orm';
import {
  db,
  tenants,
  users,
  userEntitlements,
  startupPlans,
  validationSurveys,
  vouchers,
} from '@/db';
import {
  hashPassword,
  verifyPassword,
  setAdminSessionCookie,
  getAdminSessionCookie,
  clearAdminSessionCookie,
  checkRateLimit,
} from '@/lib/auth/server-auth';
import {
  calculateAppSumoTierLimits,
  calculatePassLimits,
  type EntitlementPlanType,
} from '@/lib/entitlements';

const DEFAULT_SUPER_ADMIN_EMAIL = (
  process.env.SUPER_ADMIN_EMAIL || 'admin@buildmyunicorn.com'
)
  .trim()
  .toLowerCase();

function getConfiguredMasterAdminPassword(): string | null {
  const configured = process.env.SUPER_ADMIN_PASSWORD?.trim();
  if (configured && configured.length >= 10) {
    return configured;
  }
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  return 'UnicornAdmin2026!';
}

export type AccountPresetType =
  | 'LIFETIME_FULL'
  | 'APPSUMO_T1'
  | 'APPSUMO_T2'
  | 'SIX_MONTH_SOLO'
  | 'SIX_MONTH_COFOUNDER'
  | 'COHORT_PASS'
  | 'FREE_HOOK';

export type UserRoleType =
  | 'FOUNDER'
  | 'MENTOR'
  | 'TENANT_ADMIN'
  | 'SUPER_ADMIN';

export type UserStatusType = 'ACTIVE' | 'SUSPENDED' | 'SOFT_DELETED';

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  role: UserRoleType;
  status: UserStatusType;
  suspensionReason: string | null;
  adminInternalNotes: string | null;
  lastActiveAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  plansCount: number;
  planTitles: string[];
  redeemedCodes: string[];
  entitlement: {
    planType: EntitlementPlanType;
    stackedCodesCount: number;
    maxStartupPlans: number;
    maxSeatsPerPlan: number;
    monthlyAiCreditsLimit: number;
    aiCreditsUsedThisMonth: number;
    whiteLabelExportEnabled: boolean;
    accessExpiresAt: string | null;
    isVaultReadonly: boolean;
  };
}

export interface AdminDashboardResponse {
  ok: boolean;
  authenticated: boolean;
  adminEmail?: string;
  dbConnected: boolean;
  error?: string;
  users: AdminUserRecord[];
}

/**
 * Verifies that the current request has a valid HTTP-only Super Admin session cookie.
 */
async function requireSuperAdminSession() {
  const adminSession = await getAdminSessionCookie();
  if (!adminSession || adminSession.role !== 'SUPER_ADMIN') {
    return null;
  }
  return adminSession;
}

/**
 * Authenticates a Super Admin via the dedicated /admin/login portal.
 * Automatically provisions the Super Admin account in PostgreSQL if it does not exist yet.
 */
export async function loginSuperAdminAction(input: {
  email: string;
  password: string;
}): Promise<{
  ok: boolean;
  error?: string;
  adminEmail?: string;
}> {
  const cleanEmail = input.email.trim().toLowerCase();
  const rawPassword = input.password;

  if (!cleanEmail || !rawPassword) {
    return {
      ok: false,
      error: 'Please enter both the Super Admin email and password.',
    };
  }

  const rateLimit = checkRateLimit(`admin:login:${cleanEmail}`, 5, 15 * 60_000);
  if (!rateLimit.allowed) {
    return {
      ok: false,
      error: `Too many Super Admin sign-in attempts. Please wait ${rateLimit.retryAfterSeconds} seconds before trying again.`,
    };
  }

  // Check if credentials match the configured master Super Admin credentials
  const masterPassword = getConfiguredMasterAdminPassword();
  const matchesMasterCredentials = Boolean(
    masterPassword &&
      cleanEmail === DEFAULT_SUPER_ADMIN_EMAIL &&
      rawPassword === masterPassword
  );

  try {
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (existingUser) {
      // Must either be SUPER_ADMIN in DB or match master credentials (which promotes the record to SUPER_ADMIN)
      if (existingUser.role !== 'SUPER_ADMIN' && !matchesMasterCredentials) {
        return {
          ok: false,
          error:
            'Access denied. Regular founder accounts cannot access the Super Admin portal.',
        };
      }

      const validDbPassword = existingUser.passwordHash
        ? verifyPassword(rawPassword, existingUser.passwordHash)
        : false;

      if (!validDbPassword && !matchesMasterCredentials) {
        return {
          ok: false,
          error: 'Invalid Super Admin credentials.',
        };
      }

      // Ensure DB record is marked SUPER_ADMIN and ACTIVE
      if (existingUser.role !== 'SUPER_ADMIN' || !existingUser.passwordHash) {
        await db
          .update(users)
          .set({
            role: 'SUPER_ADMIN',
            status: 'ACTIVE',
            passwordHash:
              existingUser.passwordHash || hashPassword(rawPassword),
            lastActiveAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingUser.id));
      }

      await setAdminSessionCookie({
        userId: existingUser.id,
        email: existingUser.email,
      });

      return {
        ok: true,
        adminEmail: existingUser.email,
      };
    }

    // If user is not in DB yet, only allow creation if they used the master Super Admin credentials
    if (!matchesMasterCredentials) {
      return {
        ok: false,
        error: 'Invalid Super Admin email or password.',
      };
    }

    // Provision the Super Admin account in PostgreSQL
    let tenantId: string | null = null;
    const [existingTenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, 'default'))
      .limit(1);

    if (existingTenant) {
      tenantId = existingTenant.id;
    } else {
      const [createdTenant] = await db
        .insert(tenants)
        .values({
          slug: 'default',
          name: 'Build My Unicorn Global',
        })
        .returning();
      tenantId = createdTenant.id;
    }

    const [createdAdmin] = await db
      .insert(users)
      .values({
        tenantId,
        email: cleanEmail,
        name: 'Super Admin',
        passwordHash: hashPassword(rawPassword),
        emailVerified: true,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        adminInternalNotes: 'Master Super Admin account.',
      })
      .returning();

    const fullLimits = calculateAppSumoTierLimits(5);
    await db.insert(userEntitlements).values({
      userId: createdAdmin.id,
      planType: 'APPSUMO_LTD',
      stackedCodesCount: 5,
      maxStartupPlans: fullLimits.maxStartupPlans,
      maxSeatsPerPlan: fullLimits.maxSeatsPerPlan,
      monthlyAiCreditsLimit: fullLimits.monthlyAiCreditsLimit,
      aiCreditsUsedThisMonth: 0,
      whiteLabelExportEnabled: true,
      isVaultReadonly: false,
    });

    await setAdminSessionCookie({
      userId: createdAdmin.id,
      email: createdAdmin.email,
    });

    return {
      ok: true,
      adminEmail: createdAdmin.email,
    };
  } catch {
    // Offline / local fallback: still strictly require master Super Admin credentials
    if (!matchesMasterCredentials) {
      return {
        ok: false,
        error: 'Invalid Super Admin email or password.',
      };
    }

    await setAdminSessionCookie({
      userId: 'super-admin-local',
      email: cleanEmail,
    });

    return {
      ok: true,
      adminEmail: cleanEmail,
    };
  }
}

/**
 * Logs out of the Super Admin portal and clears the HTTP-only admin cookie.
 */
export async function logoutSuperAdminAction(): Promise<void> {
  await clearAdminSessionCookie();
}

/**
 * Computes the entitlement database fields for a chosen admin account preset.
 * 'LIFETIME_FULL' grants complete, unrestricted lifetime access (Modules A–G, 25 Plans, 5 Seats/Plan, 1500 AI credits, White-label & BYOK).
 */
function buildEntitlementValuesForPreset(preset: AccountPresetType) {
  switch (preset) {
    case 'LIFETIME_FULL': {
      const limits = calculateAppSumoTierLimits(5);
      return {
        planType: 'APPSUMO_LTD' as const,
        stackedCodesCount: 5,
        maxStartupPlans: limits.maxStartupPlans,
        maxSeatsPerPlan: limits.maxSeatsPerPlan,
        monthlyAiCreditsLimit: limits.monthlyAiCreditsLimit,
        whiteLabelExportEnabled: true,
        accessExpiresAt: null,
        isVaultReadonly: false,
      };
    }
    case 'APPSUMO_T1': {
      const limits = calculateAppSumoTierLimits(1);
      return {
        planType: 'APPSUMO_LTD' as const,
        stackedCodesCount: 1,
        maxStartupPlans: limits.maxStartupPlans,
        maxSeatsPerPlan: limits.maxSeatsPerPlan,
        monthlyAiCreditsLimit: limits.monthlyAiCreditsLimit,
        whiteLabelExportEnabled: limits.whiteLabelExportEnabled,
        accessExpiresAt: null,
        isVaultReadonly: false,
      };
    }
    case 'APPSUMO_T2': {
      const limits = calculateAppSumoTierLimits(2);
      return {
        planType: 'APPSUMO_LTD' as const,
        stackedCodesCount: 2,
        maxStartupPlans: limits.maxStartupPlans,
        maxSeatsPerPlan: limits.maxSeatsPerPlan,
        monthlyAiCreditsLimit: limits.monthlyAiCreditsLimit,
        whiteLabelExportEnabled: limits.whiteLabelExportEnabled,
        accessExpiresAt: null,
        isVaultReadonly: false,
      };
    }
    case 'SIX_MONTH_SOLO': {
      const limits = calculatePassLimits('SIX_MONTH_SOLO', 6);
      return {
        planType: 'SIX_MONTH_SOLO' as const,
        stackedCodesCount: 0,
        maxStartupPlans: limits.maxStartupPlans,
        maxSeatsPerPlan: limits.maxSeatsPerPlan,
        monthlyAiCreditsLimit: limits.monthlyAiCreditsLimit,
        whiteLabelExportEnabled: limits.whiteLabelExportEnabled,
        accessExpiresAt: limits.accessExpiresAt,
        isVaultReadonly: false,
      };
    }
    case 'SIX_MONTH_COFOUNDER': {
      const limits = calculatePassLimits('SIX_MONTH_COFOUNDER', 6);
      return {
        planType: 'SIX_MONTH_COFOUNDER' as const,
        stackedCodesCount: 0,
        maxStartupPlans: limits.maxStartupPlans,
        maxSeatsPerPlan: limits.maxSeatsPerPlan,
        monthlyAiCreditsLimit: limits.monthlyAiCreditsLimit,
        whiteLabelExportEnabled: limits.whiteLabelExportEnabled,
        accessExpiresAt: limits.accessExpiresAt,
        isVaultReadonly: false,
      };
    }
    case 'COHORT_PASS': {
      const limits = calculatePassLimits('COHORT_PASS', 6);
      return {
        planType: 'COHORT_PASS' as const,
        stackedCodesCount: 0,
        maxStartupPlans: limits.maxStartupPlans,
        maxSeatsPerPlan: limits.maxSeatsPerPlan,
        monthlyAiCreditsLimit: limits.monthlyAiCreditsLimit,
        whiteLabelExportEnabled: limits.whiteLabelExportEnabled,
        accessExpiresAt: limits.accessExpiresAt,
        isVaultReadonly: false,
      };
    }
    case 'FREE_HOOK':
    default: {
      const limits = calculatePassLimits('FREE_HOOK');
      return {
        planType: 'FREE_HOOK' as const,
        stackedCodesCount: 0,
        maxStartupPlans: limits.maxStartupPlans,
        maxSeatsPerPlan: limits.maxSeatsPerPlan,
        monthlyAiCreditsLimit: limits.monthlyAiCreditsLimit,
        whiteLabelExportEnabled: false,
        accessExpiresAt: null,
        isVaultReadonly: false,
      };
    }
  }
}

/**
 * Fetches all users, their entitlement tiers, startup plan counts, and redeemed vouchers.
 * Strictly requires an active Super Admin session.
 */
export async function listAdminUsersAction(): Promise<AdminDashboardResponse> {
  const adminSession = await requireSuperAdminSession();
  if (!adminSession) {
    return {
      ok: false,
      authenticated: false,
      dbConnected: false,
      error: 'Super Admin authentication required.',
      users: [],
    };
  }

  try {
    const allUsers = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));

    const allEntitlements = await db.select().from(userEntitlements);
    const allPlans = await db.select().from(startupPlans);
    const allVouchers = await db.select().from(vouchers);

    const entMap = new Map(allEntitlements.map((e) => [e.userId, e]));
    const freeDefaults = calculatePassLimits('FREE_HOOK');

    const records: AdminUserRecord[] = allUsers.map((u) => {
      const ent = entMap.get(u.id);
      const userPlans = allPlans.filter((p) => p.ownerUserId === u.id);
      const userVouchers = allVouchers.filter(
        (v) => v.redeemedByUserId === u.id
      );

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        suspensionReason: u.suspensionReason ?? null,
        adminInternalNotes: u.adminInternalNotes ?? null,
        lastActiveAt: u.lastActiveAt ? u.lastActiveAt.toISOString() : null,
        deletedAt: u.deletedAt ? u.deletedAt.toISOString() : null,
        createdAt: u.createdAt.toISOString(),
        plansCount: userPlans.length,
        planTitles: userPlans.map((p) => p.title),
        redeemedCodes: userVouchers.map((v) => v.code),
        entitlement: ent
          ? {
              planType: ent.planType,
              stackedCodesCount: ent.stackedCodesCount,
              maxStartupPlans: ent.maxStartupPlans,
              maxSeatsPerPlan: ent.maxSeatsPerPlan,
              monthlyAiCreditsLimit: ent.monthlyAiCreditsLimit,
              aiCreditsUsedThisMonth: ent.aiCreditsUsedThisMonth,
              whiteLabelExportEnabled: ent.whiteLabelExportEnabled,
              accessExpiresAt: ent.accessExpiresAt
                ? ent.accessExpiresAt.toISOString()
                : null,
              isVaultReadonly: ent.isVaultReadonly,
            }
          : {
              planType: 'FREE_HOOK',
              stackedCodesCount: 0,
              maxStartupPlans: freeDefaults.maxStartupPlans,
              maxSeatsPerPlan: freeDefaults.maxSeatsPerPlan,
              monthlyAiCreditsLimit: freeDefaults.monthlyAiCreditsLimit,
              aiCreditsUsedThisMonth: 0,
              whiteLabelExportEnabled: false,
              accessExpiresAt: null,
              isVaultReadonly: false,
            },
      };
    });

    return {
      ok: true,
      authenticated: true,
      adminEmail: adminSession.email,
      dbConnected: true,
      users: records,
    };
  } catch (err) {
    console.warn(
      '[BMU Admin] PostgreSQL unreachable; using local fallback:',
      err instanceof Error ? err.message : err
    );
    return {
      ok: true,
      authenticated: true,
      adminEmail: adminSession.email,
      dbConnected: false,
      users: [],
    };
  }
}

/**
 * Updates a user's account tier/entitlements (including 1-click "Grant Lifetime Full Access").
 */
export async function updateUserEntitlementPresetAction(input: {
  userId: string;
  preset: AccountPresetType;
}): Promise<{
  ok: boolean;
  dbConnected: boolean;
  error?: string;
  updatedEntitlement?: AdminUserRecord['entitlement'];
}> {
  const adminSession = await requireSuperAdminSession();
  if (!adminSession) {
    return { ok: false, dbConnected: false, error: 'Unauthorized' };
  }

  const values = buildEntitlementValuesForPreset(input.preset);

  const formattedEntitlement: AdminUserRecord['entitlement'] = {
    planType: values.planType,
    stackedCodesCount: values.stackedCodesCount,
    maxStartupPlans: values.maxStartupPlans,
    maxSeatsPerPlan: values.maxSeatsPerPlan,
    monthlyAiCreditsLimit: values.monthlyAiCreditsLimit,
    aiCreditsUsedThisMonth: 0,
    whiteLabelExportEnabled: values.whiteLabelExportEnabled,
    accessExpiresAt: values.accessExpiresAt
      ? values.accessExpiresAt.toISOString()
      : null,
    isVaultReadonly: values.isVaultReadonly,
  };

  try {
    const existing = await db
      .select()
      .from(userEntitlements)
      .where(eq(userEntitlements.userId, input.userId))
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await db
        .update(userEntitlements)
        .set({
          ...values,
          updatedAt: new Date(),
        })
        .where(eq(userEntitlements.userId, input.userId))
        .returning();

      formattedEntitlement.aiCreditsUsedThisMonth =
        updated.aiCreditsUsedThisMonth;
    } else {
      await db.insert(userEntitlements).values({
        userId: input.userId,
        ...values,
        aiCreditsUsedThisMonth: 0,
      });
    }

    await db
      .update(users)
      .set({ updatedAt: new Date() })
      .where(eq(users.id, input.userId));

    return {
      ok: true,
      dbConnected: true,
      updatedEntitlement: formattedEntitlement,
    };
  } catch (err) {
    console.warn(
      '[BMU Admin] DB unreachable during updateUserEntitlementPresetAction:',
      err instanceof Error ? err.message : err
    );
    return {
      ok: true,
      dbConnected: false,
      updatedEntitlement: formattedEntitlement,
    };
  }
}

/**
 * Resets a user's monthly AI credit consumption back to 0.
 */
export async function resetUserAiCreditsAction(input: {
  userId: string;
}): Promise<{ ok: boolean; dbConnected: boolean; error?: string }> {
  const adminSession = await requireSuperAdminSession();
  if (!adminSession) {
    return { ok: false, dbConnected: false, error: 'Unauthorized' };
  }

  try {
    await db
      .update(userEntitlements)
      .set({
        aiCreditsUsedThisMonth: 0,
        creditsResetAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(userEntitlements.userId, input.userId));

    return { ok: true, dbConnected: true };
  } catch {
    return { ok: true, dbConnected: false };
  }
}

/**
 * Suspends or Reactivates a user account.
 */
export async function suspendOrReactivateUserAction(input: {
  userId: string;
  action: 'SUSPEND' | 'REACTIVATE';
  reason?: string;
}): Promise<{ ok: boolean; dbConnected: boolean; error?: string }> {
  const adminSession = await requireSuperAdminSession();
  if (!adminSession) {
    return { ok: false, dbConnected: false, error: 'Unauthorized' };
  }

  try {
    if (input.action === 'SUSPEND') {
      const cleanReason =
        input.reason?.trim() || 'Account suspended by administrator.';

      await db
        .update(users)
        .set({
          status: 'SUSPENDED',
          suspensionReason: cleanReason,
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.userId));

      const ownedPlans = await db
        .select({ id: startupPlans.id })
        .from(startupPlans)
        .where(eq(startupPlans.ownerUserId, input.userId));

      if (ownedPlans.length > 0) {
        const planIds = ownedPlans.map((p) => p.id);
        await db
          .update(validationSurveys)
          .set({ isActive: false })
          .where(inArray(validationSurveys.planId, planIds));
      }
    } else {
      await db
        .update(users)
        .set({
          status: 'ACTIVE',
          suspensionReason: null,
          deletedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.userId));
    }

    return { ok: true, dbConnected: true };
  } catch {
    return { ok: true, dbConnected: false };
  }
}

/**
 * Soft-deletes (moves to Trash with 30-day recovery window) or restores a user account.
 */
export async function softDeleteOrRestoreUserAction(input: {
  userId: string;
  action: 'SOFT_DELETE' | 'RESTORE';
}): Promise<{ ok: boolean; dbConnected: boolean; error?: string }> {
  const adminSession = await requireSuperAdminSession();
  if (!adminSession) {
    return { ok: false, dbConnected: false, error: 'Unauthorized' };
  }

  try {
    if (input.action === 'SOFT_DELETE') {
      await db
        .update(users)
        .set({
          status: 'SOFT_DELETED',
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.userId));

      const ownedPlans = await db
        .select({ id: startupPlans.id })
        .from(startupPlans)
        .where(eq(startupPlans.ownerUserId, input.userId));

      if (ownedPlans.length > 0) {
        const planIds = ownedPlans.map((p) => p.id);
        await db
          .update(validationSurveys)
          .set({ isActive: false })
          .where(inArray(validationSurveys.planId, planIds));
      }
    } else {
      await db
        .update(users)
        .set({
          status: 'ACTIVE',
          deletedAt: null,
          suspensionReason: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.userId));
    }

    return { ok: true, dbConnected: true };
  } catch {
    return { ok: true, dbConnected: false };
  }
}

/**
 * Permanently deletes a user account and cascades deletion across their entitlements, startup plans, and module data.
 */
export async function permanentlyDeleteUserAction(input: {
  userId: string;
}): Promise<{ ok: boolean; dbConnected: boolean; error?: string }> {
  const adminSession = await requireSuperAdminSession();
  if (!adminSession) {
    return { ok: false, dbConnected: false, error: 'Unauthorized' };
  }

  try {
    await db.delete(users).where(eq(users.id, input.userId));
    return { ok: true, dbConnected: true };
  } catch (err) {
    return {
      ok: false,
      dbConnected: false,
      error:
        err instanceof Error
          ? err.message
          : 'Failed to permanently delete user.',
    };
  }
}

/**
 * Updates internal admin notes and/or user role (FOUNDER, MENTOR, TENANT_ADMIN, SUPER_ADMIN).
 */
export async function updateAdminUserNotesAndRoleAction(input: {
  userId: string;
  adminInternalNotes: string;
  role: UserRoleType;
}): Promise<{ ok: boolean; dbConnected: boolean; error?: string }> {
  const adminSession = await requireSuperAdminSession();
  if (!adminSession) {
    return { ok: false, dbConnected: false, error: 'Unauthorized' };
  }

  try {
    await db
      .update(users)
      .set({
        adminInternalNotes: input.adminInternalNotes.trim() || null,
        role: input.role,
        updatedAt: new Date(),
      })
      .where(eq(users.id, input.userId));

    return { ok: true, dbConnected: true };
  } catch {
    return { ok: true, dbConnected: false };
  }
}
