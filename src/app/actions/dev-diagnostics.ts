'use server';

import { db } from '@/db';
import { aiUsageLogs } from '@/db/schema';
import { sql, gte } from 'drizzle-orm';
import {
  getServerSessionCookie,
  requireVerifiedSuperAdminSession,
} from '@/lib/auth/server-auth';

export interface DevDiagnosticsData {
  isLocal: boolean;
  nodeEnv: string;
  dbConnected: boolean;
  dbError: string | null;
  aiCallsToday: number;
  aiDailyCeiling: number;
  stripeMode: 'TEST' | 'LIVE' | 'NOT_CONFIGURED';
  stripeKeyPrefix: string | null;
  userSession: {
    userId: string;
    email: string;
    role?: string;
  } | null;
  adminSession: {
    userId: string;
    email: string;
  } | null;
  uptimeSeconds: number;
  serverTimeIso: string;
}

/**
 * Server Action to fetch local development diagnostics.
 * Only intended to assist debugging during local development.
 */
export async function getLocalDevDiagnosticsAction(): Promise<DevDiagnosticsData> {
  const isDev = process.env.NODE_ENV !== 'production';
  const verifiedAdmin = await requireVerifiedSuperAdminSession();

  if (!isDev && !verifiedAdmin) {
    return {
      isLocal: false,
      nodeEnv: 'production',
      dbConnected: false,
      dbError: null,
      aiCallsToday: 0,
      aiDailyCeiling: 500,
      stripeMode: 'NOT_CONFIGURED',
      stripeKeyPrefix: null,
      userSession: null,
      adminSession: null,
      uptimeSeconds: 0,
      serverTimeIso: new Date().toISOString(),
    };
  }

  // 1. Check Database connection
  let dbConnected = false;
  let dbError: string | null = null;
  try {
    await db.execute(sql`SELECT 1 as ping`);
    dbConnected = true;
  } catch (err: unknown) {
    dbConnected = false;
    dbError = isDev
      ? err instanceof Error
        ? err.message
        : 'Unknown database connectivity error'
      : 'Database connectivity check failed';
  }

  // 2. AI usage today
  let aiCallsToday = 0;
  const aiDailyCeiling = parseInt(
    process.env.MAX_DAILY_PLATFORM_AI_CALLS || '500',
    10
  );
  if (dbConnected) {
    try {
      const startOfUtcDay = new Date();
      startOfUtcDay.setUTCHours(0, 0, 0, 0);

      const usageCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(aiUsageLogs)
        .where(gte(aiUsageLogs.createdAt, startOfUtcDay));

      if (usageCountResult?.[0]?.count) {
        aiCallsToday = Number(usageCountResult[0].count);
      }
    } catch {
      // Non-fatal fallback for ai usage query
      aiCallsToday = 0;
    }
  }

  // 3. Stripe Mode
  const publishableKey =
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() || '';
  let stripeMode: 'TEST' | 'LIVE' | 'NOT_CONFIGURED' = 'NOT_CONFIGURED';
  if (publishableKey) {
    if (
      publishableKey.startsWith('pk_test_') ||
      publishableKey.toLowerCase().includes('test')
    ) {
      stripeMode = 'TEST';
    } else {
      stripeMode = 'LIVE';
    }
  }

  // 4. Session tokens
  let userSession: DevDiagnosticsData['userSession'] = null;
  let adminSession: DevDiagnosticsData['adminSession'] = null;
  try {
    const rawUser = await getServerSessionCookie();
    if (rawUser) {
      userSession = {
        userId: rawUser.userId,
        email: rawUser.email,
        role: rawUser.role,
      };
    }
    if (verifiedAdmin) {
      adminSession = {
        userId: verifiedAdmin.userId,
        email: verifiedAdmin.email,
      };
    }
  } catch {
    // Non-fatal
  }

  return {
    isLocal: isDev,
    nodeEnv: process.env.NODE_ENV || 'development',
    dbConnected,
    dbError,
    aiCallsToday,
    aiDailyCeiling,
    stripeMode,
    stripeKeyPrefix: null,
    userSession,
    adminSession,
    uptimeSeconds: Math.floor(process.uptime()),
    serverTimeIso: new Date().toISOString(),
  };
}
