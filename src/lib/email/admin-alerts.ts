import { db } from '@/db';
import { systemSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendSystemEmail } from './send';
import { EMAIL_DEFAULTS } from './resend';

export const ADMIN_NOTIFICATION_SETTINGS_KEY = 'ADMIN_NOTIFICATION_SETTINGS';

export interface AdminNotificationSettings {
  notifyOnNewSignup: boolean;
  recipientEmail: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export const DEFAULT_ADMIN_NOTIFICATION_SETTINGS: AdminNotificationSettings = {
  notifyOnNewSignup: true,
  recipientEmail: process.env.ADMIN_NOTIFICATION_EMAIL || 'Tom@startuppreflight.com',
};

/**
 * Reads the admin notification settings from PostgreSQL system_settings,
 * falling back to defaults if not yet customized.
 */
export async function getAdminNotificationSettings(): Promise<AdminNotificationSettings> {
  try {
    const row = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, ADMIN_NOTIFICATION_SETTINGS_KEY))
      .limit(1);

    if (row.length > 0 && row[0]?.valueJson) {
      const data = row[0].valueJson as Partial<AdminNotificationSettings>;
      return {
        notifyOnNewSignup:
          typeof data.notifyOnNewSignup === 'boolean'
            ? data.notifyOnNewSignup
            : DEFAULT_ADMIN_NOTIFICATION_SETTINGS.notifyOnNewSignup,
        recipientEmail:
          typeof data.recipientEmail === 'string' && data.recipientEmail.trim()
            ? data.recipientEmail.trim()
            : DEFAULT_ADMIN_NOTIFICATION_SETTINGS.recipientEmail,
        updatedAt: row[0].updatedAt ? row[0].updatedAt.toISOString() : undefined,
      };
    }
  } catch (err) {
    console.warn(
      '[Admin Alerts] Failed to read system_settings (using default fallback):',
      err
    );
  }

  return DEFAULT_ADMIN_NOTIFICATION_SETTINGS;
}

/**
 * Saves updated notification settings to PostgreSQL system_settings.
 */
export async function saveAdminNotificationSettings(
  settings: Partial<AdminNotificationSettings>
): Promise<AdminNotificationSettings> {
  const current = await getAdminNotificationSettings();
  const nextSettings: AdminNotificationSettings = {
    notifyOnNewSignup:
      typeof settings.notifyOnNewSignup === 'boolean'
        ? settings.notifyOnNewSignup
        : current.notifyOnNewSignup,
    recipientEmail:
      typeof settings.recipientEmail === 'string' && settings.recipientEmail.trim()
        ? settings.recipientEmail.trim()
        : current.recipientEmail,
    updatedAt: new Date().toISOString(),
  };

  try {
    await db
      .insert(systemSettings)
      .values({
        key: ADMIN_NOTIFICATION_SETTINGS_KEY,
        valueJson: nextSettings,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: {
          valueJson: nextSettings,
          updatedAt: new Date(),
        },
      });
  } catch (err) {
    console.error('[Admin Alerts] Failed to persist system_settings:', err);
    throw err;
  }

  return nextSettings;
}

export interface DispatchAdminSignupAlertParams {
  founderName?: string;
  founderEmail: string;
  authMethod: 'EMAIL_PASSWORD' | 'GOOGLE_OAUTH';
  tierName?: string;
  hqCountry?: 'IE' | 'GB' | 'GLOBAL';
  voucherCode?: string;
  cohortName?: string;
}

/**
 * Checks admin notification preferences and asynchronously dispatches
 * the ADMIN_NEW_SIGNUP email if enabled.
 * Designed to be fire-and-forget so user registration latency is never increased.
 */
export async function dispatchAdminSignupAlert(
  params: DispatchAdminSignupAlertParams
): Promise<void> {
  try {
    const settings = await getAdminNotificationSettings();
    if (!settings.notifyOnNewSignup || !settings.recipientEmail) {
      return;
    }

    const adminDashboardUrl = `${EMAIL_DEFAULTS.appUrl}/admin`;
    const registeredAtStr = new Intl.DateTimeFormat('en-IE', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'UTC',
    }).format(new Date()) + ' (UTC)';

    await sendSystemEmail({
      to: settings.recipientEmail,
      template: 'ADMIN_NEW_SIGNUP',
      subject: `⚡ New Founder Signup: ${params.founderEmail} (${params.tierName || 'Free Hook'})`,
      props: {
        founderName: params.founderName,
        founderEmail: params.founderEmail,
        authMethod: params.authMethod,
        tierName: params.tierName || 'Free Ideation Hook',
        hqCountry: params.hqCountry || 'IE',
        registeredAt: registeredAtStr,
        voucherCode: params.voucherCode,
        cohortName: params.cohortName,
        adminDashboardUrl,
      },
      metadata: {
        trigger: 'ADMIN_SIGNUP_NOTIFICATION',
        authMethod: params.authMethod,
        founderEmail: params.founderEmail,
      },
    });
  } catch (err) {
    console.error('[Admin Alerts] Non-fatal error dispatching admin signup alert:', err);
  }
}
