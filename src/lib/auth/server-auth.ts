import crypto from 'crypto';
import { cookies, headers } from 'next/headers';
import { and, eq } from 'drizzle-orm';
import { db, ensureDatabaseSchemaSynced } from '@/db';
import {
  planCollaborators,
  startupPlans,
  tenants,
  userEntitlements,
  users,
} from '@/db/schema';
import {
  canAccessModule,
  checkFeatureEntitlement,
  isEntitlementInVaultMode,
  type EntitlementSnapshot,
  type ModuleCode,
  type PaywallFeature,
} from '@/lib/entitlements';

const SESSION_COOKIE_NAME = 'spf_session_token';
const LEGACY_SESSION_COOKIE_NAME = 'bmu_session_token';
const ADMIN_SESSION_COOKIE_NAME = 'spf_super_admin_token';
const LEGACY_ADMIN_SESSION_COOKIE_NAME = 'bmu_super_admin_token';

function getSessionSecret(): string {
  const configured =
    process.env.BETTER_AUTH_SECRET?.trim() || process.env.AUTH_SECRET?.trim();
  if (configured && configured.length >= 16) {
    return configured;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[Startup Preflight SECURITY] BETTER_AUTH_SECRET (>= 16 chars) is required in production.'
    );
  }
  return 'bmu-v2-local-dev-only-secret-do-not-use-in-prod-2026';
}

function derivePurposeKey(purpose: string): Buffer {
  const masterSecret = getSessionSecret();
  return Buffer.from(
    crypto.hkdfSync('sha256', masterSecret, '', purpose, 32)
  );
}

const FOUNDER_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const ADMIN_TOKEN_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface SessionTokenPayload {
  userId: string;
  email: string;
  role?: 'SUPER_ADMIN' | 'FOUNDER';
  iat: number;
}

export interface PlanAuthOptions {
  requiredModule?: ModuleCode;
  requireWrite?: boolean;
  requiredFeature?: PaywallFeature;
}

/**
 * Hash a plaintext password with a random 16-byte salt using Node's native scrypt.
 * Enforces runtime string type and bounded length (8..128 chars) to prevent scrypt DoS or TypeError.
 */
export function hashPassword(password: string): string {
  if (typeof password !== 'string') {
    throw new Error('Password must be a string.');
  }
  if (password.length < 8 || password.length > 128) {
    throw new Error('Password must be between 8 and 128 characters.');
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}

/**
 * Verify a plaintext password against a stored `salt:hash` string using constant-time comparison.
 * Accepts 1..128 chars so existing legacy 6-7 char passwords still verify without throwing TypeError.
 */
export function verifyPassword(password: unknown, storedHash: unknown): boolean {
  if (typeof password !== 'string' || typeof storedHash !== 'string') {
    return false;
  }
  if (password.length === 0 || password.length > 128) {
    return false;
  }
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  if (!salt || !keyHex || keyHex.length !== 128) return false;
  try {
    const keyBuffer = Buffer.from(keyHex, 'hex');
    const derivedBuffer = crypto.scryptSync(password, salt, 64);
    if (keyBuffer.length !== derivedBuffer.length) return false;
    return crypto.timingSafeEqual(keyBuffer, derivedBuffer);
  } catch {
    return false;
  }
}

/**
 * AES-256-GCM encryption for Bring-Your-Own-Key (BYOK) Gemini API keys at rest.
 * Writes `enc:v2:<ivHex>:<authTagHex>:<ciphertextHex>` using HKDF-separated subkey,
 * while preserving backward-compatible decryption for existing `enc:v1:...` rows.
 */
function getByokEncryptionKeyV2(): Buffer {
  const explicitKey = process.env.BYOK_ENCRYPTION_KEY?.trim();
  if (explicitKey && explicitKey.length >= 16) {
    return Buffer.from(
      crypto.hkdfSync('sha256', explicitKey, '', 'spf-byok-aes256gcm-v2', 32)
    );
  }
  return derivePurposeKey('spf-byok-aes256gcm-v2');
}

function getLegacyByokEncryptionKeyV1(): Buffer {
  const rawSecret =
    process.env.BYOK_ENCRYPTION_KEY?.trim() || getSessionSecret();
  return crypto.createHash('sha256').update(`bmu-byok-v1:${rawSecret}`).digest();
}

export function encryptByokApiKey(rawApiKey: string): string {
  if (typeof rawApiKey !== 'string') return '';
  const trimmed = rawApiKey.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('enc:v2:') || trimmed.startsWith('enc:v1:')) {
    return trimmed;
  }
  const key = getByokEncryptionKeyV2();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(trimmed, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `enc:v2:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptByokApiKey(
  storedValue: string | null | undefined
): string | null {
  if (!storedValue || typeof storedValue !== 'string') return null;
  const trimmed = storedValue.trim();
  if (!trimmed || trimmed === 'enc_gemini_byok_active') return null;
  if (!trimmed.startsWith('enc:v1:') && !trimmed.startsWith('enc:v2:')) {
    return trimmed.length >= 20 ? trimmed : null;
  }
  try {
    const parts = trimmed.split(':');
    if (parts.length !== 5) return null;
    const [, version, ivHex, authTagHex, cipherHex] = parts;
    const key =
      version === 'v2'
        ? getByokEncryptionKeyV2()
        : getLegacyByokEncryptionKeyV1();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(cipherHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString('utf8');
    return decrypted.trim() || null;
  } catch {
    return null;
  }
}

function signPayload(
  payload: SessionTokenPayload,
  purpose: 'spf-founder-cookie-v1' | 'spf-super-admin-cookie-v1'
): string {
  const key = derivePurposeKey(purpose);
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', key)
    .update(data)
    .digest('base64url');
  return `${data}.${signature}`;
}

function verifyPayload(
  token: string,
  purpose: 'spf-founder-cookie-v1' | 'spf-super-admin-cookie-v1',
  maxAgeMs: number
): SessionTokenPayload | null {
  try {
    const [data, signature] = token.split('.');
    if (!data || !signature) return null;
    const key = derivePurposeKey(purpose);
    const expectedSig = crypto
      .createHmac('sha256', key)
      .update(data)
      .digest('base64url');
    const sigBuf = Buffer.from(signature, 'utf8');
    const expectedBuf = Buffer.from(expectedSig, 'utf8');
    if (
      sigBuf.length !== expectedBuf.length ||
      !crypto.timingSafeEqual(sigBuf, expectedBuf)
    ) {
      return null;
    }
    const decoded = JSON.parse(
      Buffer.from(data, 'base64url').toString('utf8')
    ) as SessionTokenPayload;
    if (
      !decoded ||
      typeof decoded.iat !== 'number' ||
      typeof decoded.userId !== 'string' ||
      !decoded.userId
    ) {
      return null;
    }
    const ageMs = Date.now() - decoded.iat;
    if (ageMs < -60_000 || ageMs > maxAgeMs) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export async function setServerSessionCookie(payload: {
  userId: string;
  email: string;
}): Promise<void> {
  const token = signPayload(
    {
      userId: payload.userId,
      email: payload.email,
      role: 'FOUNDER',
      iat: Date.now(),
    },
    'spf-founder-cookie-v1'
  );
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function getServerSessionCookie(): Promise<SessionTokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const token =
      cookieStore.get(SESSION_COOKIE_NAME)?.value ||
      cookieStore.get(LEGACY_SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyPayload(token, 'spf-founder-cookie-v1', FOUNDER_TOKEN_TTL_MS);
  } catch {
    return null;
  }
}

export async function clearServerSessionCookie(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
    cookieStore.delete(LEGACY_SESSION_COOKIE_NAME);
  } catch {
    // Ignore if called outside request context
  }
}

export async function setAdminSessionCookie(payload: {
  userId: string;
  email: string;
}): Promise<void> {
  const token = signPayload(
    {
      userId: payload.userId,
      email: payload.email,
      role: 'SUPER_ADMIN',
      iat: Date.now(),
    },
    'spf-super-admin-cookie-v1'
  );
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12, // 12 hours
  });
}

export async function getAdminSessionCookie(): Promise<SessionTokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const token =
      cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value ||
      cookieStore.get(LEGACY_ADMIN_SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    const payload = verifyPayload(
      token,
      'spf-super-admin-cookie-v1',
      ADMIN_TOKEN_TTL_MS
    );
    if (!payload || payload.role !== 'SUPER_ADMIN') return null;
    return payload;
  } catch {
    return null;
  }
}

export async function clearAdminSessionCookie(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(ADMIN_SESSION_COOKIE_NAME);
    cookieStore.delete(LEGACY_ADMIN_SESSION_COOKIE_NAME);
  } catch {
    // Ignore if called outside request context
  }
}

/**
 * Resolves the client IP safely behind Google Cloud Run / Cloudflare reverse proxies
 * for anti-brute-force rate limiting. Uses the rightmost X-Forwarded-For hop when
 * cf-connecting-ip is absent so client-forged left-side XFF entries cannot rotate buckets.
 */
export async function getTrustedClientIp(): Promise<string> {
  try {
    const hdrs = await headers();
    const cfIp = hdrs.get('cf-connecting-ip')?.trim();
    if (cfIp) return cfIp.slice(0, 64);
    const xff = hdrs.get('x-forwarded-for');
    if (xff) {
      const hops = xff
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const trustedHop = hops.length >= 2 ? hops[hops.length - 2] : hops[0];
      if (trustedHop) return trustedHop.slice(0, 64);
    }
    const realIp = hdrs.get('x-real-ip')?.trim();
    if (realIp) return realIp.slice(0, 64);
  } catch {
    // Outside request context
  }
  return 'unknown-ip';
}

/**
 * Verifies the founder cookie against PostgreSQL (`users`) so suspended, soft-deleted,
 * or non-UUID sessions are immediately rejected.
 */
export async function getVerifiedActiveFounderFromCookie(): Promise<{
  userId: string;
  email: string;
  name: string;
  role: 'FOUNDER' | 'MENTOR' | 'TENANT_ADMIN' | 'SUPER_ADMIN';
  emailVerified: boolean;
  hasPassword: boolean;
  cohortId: string | null;
  iat: number;
} | null> {
  const session = await getServerSessionCookie();
  if (!session || !UUID_REGEX.test(session.userId)) {
    return null;
  }
  try {
    await ensureDatabaseSchemaSynced();
    const [dbUser] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        status: users.status,
        deletedAt: users.deletedAt,
        emailVerified: users.emailVerified,
        passwordHash: users.passwordHash,
        cohortId: users.cohortId,
      })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!dbUser || dbUser.status !== 'ACTIVE' || dbUser.deletedAt) {
      return null;
    }

    return {
      userId: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      emailVerified: dbUser.emailVerified,
      hasPassword: Boolean(dbUser.passwordHash),
      cohortId: dbUser.cohortId,
      iat: session.iat,
    };
  } catch {
    return null;
  }
}

/**
 * Verifies the Super Admin cookie against PostgreSQL (`users`) so demoted or suspended
 * admins lose privileges immediately rather than after the 12-hour cookie TTL.
 */
export async function requireVerifiedSuperAdminSession(): Promise<SessionTokenPayload | null> {
  const adminSession = await getAdminSessionCookie();
  if (!adminSession || adminSession.role !== 'SUPER_ADMIN') {
    return null;
  }

  const isDevOfflineAllowed =
    process.env.NODE_ENV === 'development' &&
    process.env.ALLOW_OFFLINE_DEV_AUTH === 'true';

  if (!UUID_REGEX.test(adminSession.userId)) {
    return isDevOfflineAllowed && adminSession.userId === 'super-admin-local'
      ? adminSession
      : null;
  }

  try {
    await ensureDatabaseSchemaSynced();
    const [dbAdmin] = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        status: users.status,
        deletedAt: users.deletedAt,
      })
      .from(users)
      .where(eq(users.id, adminSession.userId))
      .limit(1);

    if (
      !dbAdmin ||
      dbAdmin.role !== 'SUPER_ADMIN' ||
      dbAdmin.status !== 'ACTIVE' ||
      dbAdmin.deletedAt
    ) {
      return null;
    }

    return {
      userId: dbAdmin.id,
      email: dbAdmin.email,
      role: 'SUPER_ADMIN',
      iat: adminSession.iat,
    };
  } catch {
    return null;
  }
}

/**
 * Lightweight in-memory sliding-window rate limiter to protect auth endpoints,
 * public survey submissions, and per-user AI burst calls.
 */
const rateLimitBuckets = new Map<string, number[]>();

export function checkRateLimit(
  bucketKey: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  const windowStart = now - windowMs;
  const existing = rateLimitBuckets.get(bucketKey) ?? [];
  const activeTimestamps = existing.filter((ts) => ts > windowStart);

  if (activeTimestamps.length >= maxRequests) {
    rateLimitBuckets.set(bucketKey, activeTimestamps);
    const oldest = activeTimestamps[0] ?? now;
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldest + windowMs - now) / 1000)
    );
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  activeTimestamps.push(now);
  rateLimitBuckets.set(bucketKey, activeTimestamps);

  if (rateLimitBuckets.size > 5000) {
    for (const [key, timestamps] of rateLimitBuckets.entries()) {
      const filtered = timestamps.filter((ts) => ts > now - 3600_000);
      if (filtered.length === 0) {
        rateLimitBuckets.delete(key);
      } else {
        rateLimitBuckets.set(key, filtered);
      }
    }
  }

  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - activeTimestamps.length),
    retryAfterSeconds: 0,
  };
}

export function mapDbEntitlementRowToSnapshot(
  entRow: typeof userEntitlements.$inferSelect
): EntitlementSnapshot {
  return {
    userId: entRow.userId,
    planType: entRow.planType,
    stackedCodesCount: entRow.stackedCodesCount,
    maxStartupPlans: entRow.maxStartupPlans,
    maxSeatsPerPlan: entRow.maxSeatsPerPlan,
    monthlyAiCreditsLimit: entRow.monthlyAiCreditsLimit,
    aiCreditsUsedThisMonth: entRow.aiCreditsUsedThisMonth,
    whiteLabelExportEnabled: entRow.whiteLabelExportEnabled,
    customApiKeyEncrypted: entRow.customApiKeyEncrypted,
    accessExpiresAt: entRow.accessExpiresAt,
    isVaultReadonly: entRow.isVaultReadonly,
  };
}

/**
 * Strict server-side authorization, IDOR prevention & entitlement enforcement helper.
 * Verifies:
 * 1. Valid signed HttpOnly session cookie (founder or super_admin).
 * 2. Active non-deleted user in PostgreSQL (`users.status === 'ACTIVE'`).
 * 3. Plan ownership (`startup_plans.owner_user_id`) or accepted collaborator seat (`plan_collaborators`).
 * 4. Optional server-side module paywall (`requiredModule`), Read-Only Vault lock (`requireWrite`), and feature gate (`requiredFeature`).
 */
export async function verifyActiveSessionAndPlanOwnership(
  planId?: string,
  options?: PlanAuthOptions
): Promise<{
  authorized: boolean;
  isLocalPreview: boolean;
  userId: string | null;
  email: string | null;
  isSuperAdmin: boolean;
  role?: 'OWNER' | 'COLLABORATOR' | 'SUPER_ADMIN';
  reason?: string;
}> {
  const isLocalPlanId =
    !planId ||
    planId.startsWith('demo-') ||
    planId.startsWith('local-') ||
    planId.startsWith('plan-') ||
    !UUID_REGEX.test(planId);

  const founderSession = await getServerSessionCookie();
  const adminSession = await getAdminSessionCookie();
  const activeSession = founderSession || adminSession;

  if (!activeSession) {
    return {
      authorized: false,
      isLocalPreview: false,
      userId: null,
      email: null,
      isSuperAdmin: false,
      reason: 'UNAUTHENTICATED_SESSION',
    };
  }

  const isDevOfflineAllowed =
    process.env.NODE_ENV === 'development' &&
    process.env.ALLOW_OFFLINE_DEV_AUTH === 'true';

  if (!UUID_REGEX.test(activeSession.userId)) {
    if (isDevOfflineAllowed && isLocalPlanId) {
      return {
        authorized: true,
        isLocalPreview: true,
        userId: activeSession.userId,
        email: activeSession.email,
        isSuperAdmin: activeSession.role === 'SUPER_ADMIN',
      };
    }
    return {
      authorized: false,
      isLocalPreview: false,
      userId: null,
      email: null,
      isSuperAdmin: false,
      reason: 'INVALID_SESSION_USER_ID',
    };
  }

  try {
    await ensureDatabaseSchemaSynced();

    const [dbUser] = await db
      .select({
        id: users.id,
        email: users.email,
        status: users.status,
        deletedAt: users.deletedAt,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, activeSession.userId))
      .limit(1);

    if (!dbUser || dbUser.status !== 'ACTIVE' || dbUser.deletedAt) {
      return {
        authorized: false,
        isLocalPreview: false,
        userId: activeSession.userId,
        email: activeSession.email,
        isSuperAdmin: false,
        reason: 'USER_SUSPENDED_OR_NOT_FOUND',
      };
    }

    const isSuperAdmin = dbUser.role === 'SUPER_ADMIN';
    let entitlementOwnerUserId = dbUser.id;
    let resolvedRole: 'OWNER' | 'COLLABORATOR' | 'SUPER_ADMIN' = isSuperAdmin
      ? 'SUPER_ADMIN'
      : 'OWNER';

    if (planId && !isLocalPlanId && !isSuperAdmin) {
      const [planRow] = await db
        .select({
          id: startupPlans.id,
          ownerUserId: startupPlans.ownerUserId,
        })
        .from(startupPlans)
        .where(eq(startupPlans.id, planId))
        .limit(1);

      if (!planRow) {
        return {
          authorized: false,
          isLocalPreview: false,
          userId: dbUser.id,
          email: dbUser.email,
          isSuperAdmin,
          reason: 'PLAN_NOT_FOUND',
        };
      }

      if (planRow.ownerUserId !== dbUser.id) {
        const [collabRow] = await db
          .select({
            id: planCollaborators.id,
            role: planCollaborators.role,
          })
          .from(planCollaborators)
          .where(
            and(
              eq(planCollaborators.planId, planId),
              eq(planCollaborators.userId, dbUser.id),
              eq(planCollaborators.inviteAccepted, true)
            )
          )
          .limit(1);

        if (!collabRow) {
          return {
            authorized: false,
            isLocalPreview: false,
            userId: dbUser.id,
            email: dbUser.email,
            isSuperAdmin,
            reason: 'PLAN_OWNERSHIP_MISMATCH',
          };
        }

        if (options?.requireWrite && collabRow.role === 'ADVISOR_READONLY') {
          return {
            authorized: false,
            isLocalPreview: false,
            userId: dbUser.id,
            email: dbUser.email,
            isSuperAdmin,
            role: 'COLLABORATOR',
            reason: 'ADVISOR_READ_ONLY',
          };
        }

        entitlementOwnerUserId = planRow.ownerUserId;
        resolvedRole = 'COLLABORATOR';
      }
    }

    if (!isSuperAdmin && options) {
      const [entRow] = await db
        .select()
        .from(userEntitlements)
        .where(eq(userEntitlements.userId, entitlementOwnerUserId))
        .limit(1);

      if (!entRow) {
        return {
          authorized: false,
          isLocalPreview: false,
          userId: dbUser.id,
          email: dbUser.email,
          isSuperAdmin: false,
          reason: 'MISSING_ENTITLEMENT_RECORD',
        };
      }

      const snapshot = mapDbEntitlementRowToSnapshot(entRow);

      if (options.requiredModule) {
        const modAccess = canAccessModule(snapshot, options.requiredModule);
        if (!modAccess.allowed) {
          return {
            authorized: false,
            isLocalPreview: false,
            userId: dbUser.id,
            email: dbUser.email,
            isSuperAdmin: false,
            reason: modAccess.reason || 'PAYWALL_MODULE_LOCKED',
          };
        }
      }

      if (options.requireWrite && isEntitlementInVaultMode(snapshot)) {
        return {
          authorized: false,
          isLocalPreview: false,
          userId: dbUser.id,
          email: dbUser.email,
          isSuperAdmin: false,
          reason: 'VAULT_READONLY',
        };
      }

      if (options.requiredFeature) {
        const featAccess = checkFeatureEntitlement(
          snapshot,
          options.requiredFeature
        );
        if (!featAccess.allowed) {
          return {
            authorized: false,
            isLocalPreview: false,
            userId: dbUser.id,
            email: dbUser.email,
            isSuperAdmin: false,
            reason: featAccess.reason || 'FEATURE_LOCKED',
          };
        }
      }
    }

    return {
      authorized: true,
      isLocalPreview: isLocalPlanId,
      userId: dbUser.id,
      email: dbUser.email,
      isSuperAdmin,
      role: resolvedRole,
    };
  } catch {
    return {
      authorized: false,
      isLocalPreview: false,
      userId: activeSession.userId,
      email: activeSession.email,
      isSuperAdmin: false,
      reason: 'DATABASE_UNAVAILABLE',
    };
  }
}

/**
 * Server-only helper (not a public Server Action) that ensures the global 'default' tenant exists.
 */
export async function ensureDefaultTenantId(): Promise<string> {
  const existing = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, 'default'))
    .limit(1);

  if (existing.length > 0) {
    return existing[0].id;
  }

  const [created] = await db
    .insert(tenants)
    .values({
      slug: 'default',
      name: 'Startup Preflight Global',
      brandingJson: {
        primaryColor: '#047857',
        accentColor: '#0f172a',
      },
    })
    .returning();

  return created.id;
}
