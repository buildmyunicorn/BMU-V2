'use server';

import { eq, and, inArray, sql } from 'drizzle-orm';
import { db, ensureDatabaseSchemaSynced } from '@/db';
import {
  users,
  userEntitlements,
  startupPlans,
  planModulesData,
  validationSurveys,
  surveyResponses,
  type StartupHat,
} from '@/db/schema';
import {
  getVerifiedActiveFounderFromCookie,
  requireVerifiedSuperAdminSession,
  setServerSessionCookie,
  clearServerSessionCookie,
  verifyPassword,
  hashPassword,
} from '@/lib/auth/server-auth';
import { getTrustedAppOrigin } from '@/lib/auth/oauth-helpers';
import { stripe } from '@/lib/stripe/client';
import type { SupportedCountryCode } from '@/lib/localization';

export interface AccountProfileData {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  hasPassword?: boolean;
  createdAt: string;
  lastActiveAt: string | null;
  founderProfile: {
    founderStage?: string;
    teamStructure?: string;
    primaryHat?: StartupHat;
    regionOrCounty?: string;
    defaultCountryCode?: SupportedCountryCode;
    notifyOnSurveyResponse?: boolean;
    notifyOnGrantDeadlines?: boolean;
  };
  entitlement: {
    planType: string;
    stackedCodesCount: number;
    maxStartupPlans: number;
    maxSeatsPerPlan: number;
    monthlyAiCreditsLimit: number;
    aiCreditsUsedThisMonth: number;
    accessExpiresAt: string | null;
    isVaultReadonly: boolean;
    stripeCustomerId: string | null;
  } | null;
  totalPlansCount: number;
}

/**
 * Loads the current authenticated founder's profile, entitlements, and settings.
 */
export async function getAccountDetailsAction(): Promise<{
  ok: boolean;
  profile?: AccountProfileData;
  error?: string;
}> {
  try {
    const activeUser = await getVerifiedActiveFounderFromCookie();
    if (!activeUser) {
      return { ok: false, error: 'Not authenticated or account inactive. Please sign in.' };
    }

    await ensureDatabaseSchemaSynced();

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, activeUser.userId))
      .limit(1);

    if (!user || user.status === 'SUSPENDED' || user.status === 'SOFT_DELETED') {
      return { ok: false, error: 'User account not found or deactivated.' };
    }

    const [entitlement] = await db
      .select()
      .from(userEntitlements)
      .where(eq(userEntitlements.userId, user.id))
      .limit(1);

    const plansList = await db
      .select({ id: startupPlans.id })
      .from(startupPlans)
      .where(eq(startupPlans.ownerUserId, user.id));

    const founderProfile = (user.founderProfileJson as any) || {};

    // Background touch of lastActiveAt if more than 15 minutes since last active
    if (!user.lastActiveAt || Date.now() - new Date(user.lastActiveAt).getTime() > 15 * 60 * 1000) {
      db.update(users)
        .set({ lastActiveAt: new Date() })
        .where(eq(users.id, user.id))
        .catch(() => {});
    }

    return {
      ok: true,
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        hasPassword: Boolean(user.passwordHash),
        createdAt: user.createdAt ? user.createdAt.toISOString() : new Date().toISOString(),
        lastActiveAt: user.lastActiveAt ? user.lastActiveAt.toISOString() : null,
        founderProfile: {
          founderStage: founderProfile.founderStage || 'VALIDATING_IDEA',
          teamStructure: founderProfile.teamStructure || 'SOLO_FOUNDER',
          primaryHat: founderProfile.primaryHat || 'VISION_INVESTOR',
          regionOrCounty: founderProfile.regionOrCounty || '',
          defaultCountryCode: founderProfile.defaultCountryCode || 'IE',
          notifyOnSurveyResponse: founderProfile.notifyOnSurveyResponse ?? true,
          notifyOnGrantDeadlines: founderProfile.notifyOnGrantDeadlines ?? true,
        },
        entitlement: entitlement
          ? {
              planType: entitlement.planType,
              stackedCodesCount: entitlement.stackedCodesCount,
              maxStartupPlans: entitlement.maxStartupPlans,
              maxSeatsPerPlan: entitlement.maxSeatsPerPlan,
              monthlyAiCreditsLimit: entitlement.monthlyAiCreditsLimit,
              aiCreditsUsedThisMonth: entitlement.aiCreditsUsedThisMonth,
              accessExpiresAt: entitlement.accessExpiresAt
                ? entitlement.accessExpiresAt.toISOString()
                : null,
              isVaultReadonly: entitlement.isVaultReadonly,
              stripeCustomerId: entitlement.stripeCustomerId,
            }
          : null,
        totalPlansCount: plansList.length,
      },
    };
  } catch (err: any) {
    console.error('getAccountDetailsAction error:', err);
    return { ok: false, error: err?.message || 'Failed to load account profile.' };
  }
}

/**
 * Updates founder profile attributes (name, primary hat, default country, notification preferences).
 */
export async function updateFounderProfileAction(input: {
  name: string;
  primaryHat?: StartupHat;
  regionOrCounty?: string;
  defaultCountryCode?: SupportedCountryCode;
  notifyOnSurveyResponse?: boolean;
  notifyOnGrantDeadlines?: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const activeUser = await getVerifiedActiveFounderFromCookie();
    if (!activeUser) {
      return { ok: false, error: 'Not authenticated or account suspended.' };
    }

    if (typeof input?.name !== 'string' || input.name.trim().length < 2 || input.name.trim().length > 160) {
      return { ok: false, error: 'Name must be between 2 and 160 characters.' };
    }

    await ensureDatabaseSchemaSynced();

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, activeUser.userId))
      .limit(1);

    if (!user || user.status !== 'ACTIVE') {
      return { ok: false, error: 'User not found or inactive.' };
    }

    const existingJson = (user.founderProfileJson as any) || {};
    const updatedJson = {
      ...existingJson,
      primaryHat: input.primaryHat ?? existingJson.primaryHat,
      regionOrCounty:
        typeof input.regionOrCounty === 'string'
          ? input.regionOrCounty.trim().slice(0, 120)
          : existingJson.regionOrCounty,
      defaultCountryCode: input.defaultCountryCode ?? existingJson.defaultCountryCode ?? 'IE',
      notifyOnSurveyResponse: input.notifyOnSurveyResponse ?? existingJson.notifyOnSurveyResponse ?? true,
      notifyOnGrantDeadlines: input.notifyOnGrantDeadlines ?? existingJson.notifyOnGrantDeadlines ?? true,
    };

    await db
      .update(users)
      .set({
        name: input.name.trim().slice(0, 160),
        founderProfileJson: updatedJson,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return { ok: true };
  } catch (err: any) {
    console.error('updateFounderProfileAction error:', err);
    return { ok: false, error: err?.message || 'Failed to update profile.' };
  }
}

/**
 * Changes founder password after constant-time verification of current password
 * (or recent Google OAuth sign-in within 5 minutes for OAuth-only accounts).
 */
export async function updateFounderPasswordAction(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const activeUser = await getVerifiedActiveFounderFromCookie();
    if (!activeUser) {
      return { ok: false, error: 'Not authenticated or account suspended.' };
    }

    if (typeof input?.newPassword !== 'string' || input.newPassword.length < 8 || input.newPassword.length > 128) {
      return { ok: false, error: 'New password must be between 8 and 128 characters long.' };
    }

    if (input.newPassword !== input.confirmPassword) {
      return { ok: false, error: 'New passwords do not match.' };
    }

    await ensureDatabaseSchemaSynced();

    const [user] = await db
      .select({ id: users.id, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, activeUser.userId))
      .limit(1);

    if (!user) {
      return { ok: false, error: 'User not found.' };
    }

    if (user.passwordHash) {
      if (typeof input.currentPassword !== 'string' || !input.currentPassword) {
        return { ok: false, error: 'Please enter your current password.' };
      }
      const isValid = verifyPassword(input.currentPassword, user.passwordHash);
      if (!isValid) {
        return { ok: false, error: 'Current password is incorrect.' };
      }
    } else {
      // Google OAuth-only account setting a password for the first time:
      // require fresh re-authentication within the last 5 minutes to prevent session-hijack takeover.
      const FIVE_MINUTES_MS = 5 * 60 * 1000;
      if (!activeUser.iat || Date.now() - activeUser.iat > FIVE_MINUTES_MS) {
        return {
          ok: false,
          error:
            'Because your account uses Google Sign-In without a password, please sign out and sign back in with Google within the last 5 minutes before setting a password.',
        };
      }
    }

    const newHash = hashPassword(input.newPassword);

    const [updatedUser] = await db
      .update(users)
      .set({
        passwordHash: newHash,
        sessionVersion: sql`${users.sessionVersion} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning({ sessionVersion: users.sessionVersion });

    // Re-issue cookie for the current device with the rotated sessionVersion while revoking all other sessions
    await setServerSessionCookie({
      userId: user.id,
      email: activeUser.email,
      sessionVersion: updatedUser?.sessionVersion ?? (activeUser.sessionVersion + 1),
    });

    return { ok: true };
  } catch (err: any) {
    console.error('updateFounderPasswordAction error:', err);
    return { ok: false, error: err?.message || 'Failed to update password.' };
  }
}

/**
 * Creates a Stripe Customer Portal session so founders can update payment methods,
 * download VAT invoices, or manage recurring subscriptions.
 */
export async function createStripeCustomerPortalAction(): Promise<{
  ok: boolean;
  portalUrl?: string;
  error?: string;
}> {
  try {
    const activeUser = await getVerifiedActiveFounderFromCookie();
    if (!activeUser) {
      return { ok: false, error: 'Not authenticated or account suspended.' };
    }

    await ensureDatabaseSchemaSynced();

    const [entitlement] = await db
      .select({ stripeCustomerId: userEntitlements.stripeCustomerId })
      .from(userEntitlements)
      .where(eq(userEntitlements.userId, activeUser.userId))
      .limit(1);

    let customerId = entitlement?.stripeCustomerId;

    if (!customerId) {
      // Never look up existing Stripe customers by unverified email (`stripe.customers.list({ email })`),
      // which would let an unverified account open another person's Stripe Billing Portal.
      const newCustomer = await stripe.customers.create({
        email: activeUser.email,
        name: activeUser.name,
        metadata: { spf_user_id: activeUser.userId },
      });
      customerId = newCustomer.id;

      if (customerId) {
        await db
          .insert(userEntitlements)
          .values({
            userId: activeUser.userId,
            stripeCustomerId: customerId,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: userEntitlements.userId,
            set: { stripeCustomerId: customerId, updatedAt: new Date() },
          });
      }
    }

    const origin = getTrustedAppOrigin();

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/account`,
    });

    return { ok: true, portalUrl: portalSession.url };
  } catch (err: any) {
    console.error('createStripeCustomerPortalAction error:', err);
    return {
      ok: false,
      error:
        err?.message ||
        'Unable to launch Stripe Billing Portal. Please ensure Stripe is configured.',
    };
  }
}

/**
 * Cancels auto-renewing subscription and sets vault to Read-Only at the end of the billing cycle.
 */
export async function cancelMicroSubscriptionAction(): Promise<{
  ok: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const activeUser = await getVerifiedActiveFounderFromCookie();
    if (!activeUser) {
      return { ok: false, error: 'Not authenticated or account suspended.' };
    }

    await ensureDatabaseSchemaSynced();

    const [entitlement] = await db
      .select({ stripeCustomerId: userEntitlements.stripeCustomerId })
      .from(userEntitlements)
      .where(eq(userEntitlements.userId, activeUser.userId))
      .limit(1);

    if (entitlement?.stripeCustomerId) {
      const subscriptions = await stripe.subscriptions.list({
        customer: entitlement.stripeCustomerId,
        status: 'active',
        limit: 5,
      });

      for (const sub of subscriptions.data) {
        await stripe.subscriptions.update(sub.id, {
          cancel_at_period_end: true,
        });
      }
    }

    return {
      ok: true,
      message:
        'Your subscription auto-renewal has been cancelled. Your workspace will transition into Read-Only Vault mode at the end of your billing cycle. Your data remains 100% safe and exportable.',
    };
  } catch (err: any) {
    console.error('cancelMicroSubscriptionAction error:', err);
    return { ok: false, error: err?.message || 'Failed to cancel subscription.' };
  }
}

/**
 * GDPR Article 20: Exports complete founder data archive (all startup plans, modules, and surveys).
 */
export async function exportCompleteFounderDataArchive(): Promise<{
  ok: boolean;
  exportData?: any;
  error?: string;
}> {
  try {
    const activeUser = await getVerifiedActiveFounderFromCookie();
    if (!activeUser) {
      return { ok: false, error: 'Not authenticated or account suspended.' };
    }

    await ensureDatabaseSchemaSynced();

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        founderProfileJson: users.founderProfileJson,
      })
      .from(users)
      .where(eq(users.id, activeUser.userId))
      .limit(1);

    if (!user) {
      return { ok: false, error: 'User record not found.' };
    }

    const plans = await db
      .select()
      .from(startupPlans)
      .where(eq(startupPlans.ownerUserId, user.id));

    const enrichedPlans = [];

    for (const plan of plans) {
      const modules = await db
        .select()
        .from(planModulesData)
        .where(eq(planModulesData.planId, plan.id));

      const surveys = await db
        .select()
        .from(validationSurveys)
        .where(eq(validationSurveys.planId, plan.id));

      const surveyDetails = [];
      for (const s of surveys) {
        const responses = await db
          .select()
          .from(surveyResponses)
          .where(eq(surveyResponses.surveyId, s.id));
        surveyDetails.push({
          ...s,
          responses,
        });
      }

      enrichedPlans.push({
        plan,
        modules,
        surveys: surveyDetails,
      });
    }

    const payload = {
      exportMetadata: {
        platform: 'Startup Preflight 2.0',
        exportedAt: new Date().toISOString(),
        version: '2.0.0',
        accountEmail: user.email,
      },
      userProfile: user,
      plans: enrichedPlans,
    };

    return { ok: true, exportData: payload };
  } catch (err: any) {
    console.error('exportCompleteFounderDataArchive error:', err);
    return { ok: false, error: err?.message || 'Failed to generate export archive.' };
  }
}

/**
 * 30-Day Soft Delete Account Action.
 */
export async function softDeleteFounderAccountAction(input: {
  passwordConfirmation: string;
  confirmationPhrase: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    if (
      typeof input?.confirmationPhrase !== 'string' ||
      input.confirmationPhrase.trim().toUpperCase() !== 'DELETE MY ACCOUNT'
    ) {
      return {
        ok: false,
        error: 'Please type "DELETE MY ACCOUNT" exactly to confirm deactivation.',
      };
    }

    const activeUser = await getVerifiedActiveFounderFromCookie();
    if (!activeUser) {
      return { ok: false, error: 'Not authenticated or account already deactivated.' };
    }

    await ensureDatabaseSchemaSynced();

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, activeUser.userId))
      .limit(1);

    if (!user) {
      return { ok: false, error: 'User not found.' };
    }

    if (user.passwordHash) {
      const isValid = verifyPassword(input.passwordConfirmation, user.passwordHash);
      if (!isValid) {
        return { ok: false, error: 'Incorrect password. Account deactivation aborted.' };
      }
    } else {
      // OAuth-only account: require recent login within the last 5 minutes
      const FIVE_MINUTES_MS = 5 * 60 * 1000;
      if (!activeUser.iat || Date.now() - activeUser.iat > FIVE_MINUTES_MS) {
        return {
          ok: false,
          error:
            'For security, Google Sign-In accounts must sign in again within the last 5 minutes before deactivating the account.',
        };
      }
    }

    const now = new Date();

    // 1 & 2. Atomically mark user as SOFT_DELETED, rotate sessionVersion, and take validation surveys offline
    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({
          status: 'SOFT_DELETED',
          sessionVersion: sql`${users.sessionVersion} + 1`,
          deletedAt: now,
          updatedAt: now,
        })
        .where(eq(users.id, user.id));

      const userPlans = await tx
        .select({ id: startupPlans.id })
        .from(startupPlans)
        .where(eq(startupPlans.ownerUserId, user.id));

      if (userPlans.length > 0) {
        const planIds = userPlans.map((p) => p.id);
        await tx
          .update(validationSurveys)
          .set({
            isActive: false,
          })
          .where(inArray(validationSurveys.planId, planIds));
      }
    });

    // 3. Cancel active Stripe subscriptions if any
    const [entitlement] = await db
      .select({ stripeCustomerId: userEntitlements.stripeCustomerId })
      .from(userEntitlements)
      .where(eq(userEntitlements.userId, user.id))
      .limit(1);

    if (entitlement?.stripeCustomerId) {
      try {
        const subs = await stripe.subscriptions.list({
          customer: entitlement.stripeCustomerId,
          status: 'active',
          limit: 5,
        });
        for (const sub of subs.data) {
          await stripe.subscriptions.cancel(sub.id);
        }
      } catch (stripeErr) {
        console.warn('Could not cancel Stripe subscriptions during soft-delete:', stripeErr);
      }
    }

    // 4. Clear HTTP-only session cookie
    await clearServerSessionCookie();

    return { ok: true };
  } catch (err: any) {
    console.error('softDeleteFounderAccountAction error:', err);
    return { ok: false, error: err?.message || 'Failed to deactivate account.' };
  }
}

/**
 * 30-Day Recovery: Restores a soft-deleted account within the 30-day window.
 */
export async function restoreSoftDeletedAccountAction(email: string): Promise<{
  ok: boolean;
  error?: string;
}> {
  try {
    const adminSession = await requireVerifiedSuperAdminSession();
    if (!adminSession) {
      return {
        ok: false,
        error: 'Unauthorized: Only a Super Administrator can restore a deactivated account.',
      };
    }
    if (typeof email !== 'string' || !email.trim()) {
      return { ok: false, error: 'Valid email required.' };
    }
    const cleanEmail = email.trim().toLowerCase();
    await ensureDatabaseSchemaSynced();

    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, cleanEmail), eq(users.status, 'SOFT_DELETED')))
      .limit(1);

    if (!user) {
      return { ok: false, error: 'No deactivated account found with this email.' };
    }

    if (user.deletedAt) {
      const msSinceDelete = Date.now() - user.deletedAt.getTime();
      const daysSinceDelete = msSinceDelete / (1000 * 60 * 60 * 24);
      if (daysSinceDelete > 30) {
        return {
          ok: false,
          error:
            'The 30-day recovery grace period has expired. This account cannot be restored.',
        };
      }
    }

    await db
      .update(users)
      .set({
        status: 'ACTIVE',
        deletedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return { ok: true };
  } catch (err: any) {
    console.error('restoreSoftDeletedAccountAction error:', err);
    return { ok: false, error: err?.message || 'Failed to restore account.' };
  }
}
