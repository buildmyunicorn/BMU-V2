import crypto from 'crypto';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import { db, ensureDatabaseSchemaSynced } from '@/db';
import { startupPlans, users } from '@/db/schema';

const SESSION_COOKIE_NAME = 'spf_session_token';
const LEGACY_SESSION_COOKIE_NAME = 'bmu_session_token';
const ADMIN_SESSION_COOKIE_NAME = 'spf_super_admin_token';
const LEGACY_ADMIN_SESSION_COOKIE_NAME = 'bmu_super_admin_token';

// Never fall back to a static public secret in production.
// If BETTER_AUTH_SECRET is missing in production, generate an ephemeral per-instance secret
// and log a critical warning so tokens cannot be forged externally.
const EPHEMERAL_FALLBACK_SECRET = crypto.randomBytes(32).toString('hex');

function getSessionSecret(): string {
  const configured =
    process.env.BETTER_AUTH_SECRET?.trim() || process.env.AUTH_SECRET?.trim();
  if (configured && configured.length >= 16) {
    return configured;
  }
  if (process.env.NODE_ENV === 'production') {
    console.error(
      '[Startup Preflight SECURITY WARNING] BETTER_AUTH_SECRET is missing or too short in production! Using ephemeral secret.'
    );
    return EPHEMERAL_FALLBACK_SECRET;
  }
  return 'bmu-v2-local-dev-only-secret-do-not-use-in-prod-2026';
}

const FOUNDER_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const ADMIN_TOKEN_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

export interface SessionTokenPayload {
  userId: string;
  email: string;
  role?: 'SUPER_ADMIN' | 'FOUNDER';
  iat: number;
}

/**
 * Hash a plaintext password with a random 16-byte salt using Node's native scrypt.
 * Zero native C++ dependencies required inside Docker / Cloud Run.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}

/**
 * Verify a plaintext password against a stored `salt:hash` string using constant-time comparison.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const keyBuffer = Buffer.from(keyHex, 'hex');
  const derivedBuffer = crypto.scryptSync(password, salt, 64);
  if (keyBuffer.length !== derivedBuffer.length) return false;
  return crypto.timingSafeEqual(keyBuffer, derivedBuffer);
}

/**
 * AES-256-GCM encryption for Bring-Your-Own-Key (BYOK) Gemini API keys at rest.
 * Format: `enc:v1:<ivHex>:<authTagHex>:<ciphertextHex>`
 */
function getByokEncryptionKey(): Buffer {
  const rawSecret =
    process.env.BYOK_ENCRYPTION_KEY?.trim() || getSessionSecret();
  return crypto.createHash('sha256').update(`bmu-byok-v1:${rawSecret}`).digest();
}

export function encryptByokApiKey(rawApiKey: string): string {
  const trimmed = rawApiKey.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('enc:v1:')) return trimmed;
  const key = getByokEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(trimmed, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `enc:v1:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptByokApiKey(storedValue: string | null | undefined): string | null {
  if (!storedValue) return null;
  const trimmed = storedValue.trim();
  if (!trimmed || trimmed === 'enc_gemini_byok_active') return null;
  if (!trimmed.startsWith('enc:v1:')) {
    // Legacy plaintext key compatibility (only if it looks like a valid Gemini API key)
    return trimmed.length >= 20 ? trimmed : null;
  }
  try {
    const parts = trimmed.split(':');
    if (parts.length !== 5) return null;
    const [, , ivHex, authTagHex, cipherHex] = parts;
    const key = getByokEncryptionKey();
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

function signPayload(payload: SessionTokenPayload): string {
  const secret = getSessionSecret();
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64url');
  return `${data}.${signature}`;
}

function verifyPayload(token: string, maxAgeMs: number = FOUNDER_TOKEN_TTL_MS): SessionTokenPayload | null {
  try {
    const [data, signature] = token.split('.');
    if (!data || !signature) return null;
    const secret = getSessionSecret();
    const expectedSig = crypto
      .createHmac('sha256', secret)
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
    if (!decoded || typeof decoded.iat !== 'number' || !decoded.userId) {
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
  const token = signPayload({
    userId: payload.userId,
    email: payload.email,
    iat: Date.now(),
  });
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
    return verifyPayload(token, FOUNDER_TOKEN_TTL_MS);
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
  const token = signPayload({
    userId: payload.userId,
    email: payload.email,
    role: 'SUPER_ADMIN',
    iat: Date.now(),
  });
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12, // 12 hours for admin session security
  });
}

export async function getAdminSessionCookie(): Promise<SessionTokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const token =
      cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value ||
      cookieStore.get(LEGACY_ADMIN_SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    const payload = verifyPayload(token, ADMIN_TOKEN_TTL_MS);
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

  // Periodic cleanup to prevent unbounded Map growth
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

/**
 * Strict server-side authorization & IDOR prevention helper.
 * Verifies:
 * 1. The request has a valid signed HttpOnly session cookie (founder or super_admin).
 * 2. The user exists in PostgreSQL and has status === 'ACTIVE'.
 * 3. If a real database `planId` is supplied, the plan belongs to `session.userId` (or caller is SUPER_ADMIN).
 */
export async function verifyActiveSessionAndPlanOwnership(planId?: string): Promise<{
  authorized: boolean;
  isLocalPreview: boolean;
  userId: string | null;
  email: string | null;
  isSuperAdmin: boolean;
  reason?: string;
}> {
  const isLocalPlanId =
    !planId || planId.startsWith('demo-') || planId.startsWith('local-');

  const founderSession = await getServerSessionCookie();
  const adminSession = await getAdminSessionCookie();
  const activeSession = founderSession || adminSession;

  if (!activeSession) {
    return {
      authorized: false,
      isLocalPreview: isLocalPlanId,
      userId: null,
      email: null,
      isSuperAdmin: false,
      reason: 'UNAUTHENTICATED_SESSION',
    };
  }

  try {
    await ensureDatabaseSchemaSynced();

    // Super-admin virtual session (master env credentials) or DB user check
    let isSuperAdmin = Boolean(adminSession && adminSession.role === 'SUPER_ADMIN');
    if (
      activeSession.userId !== 'super-admin-root' &&
      activeSession.userId !== 'super-admin-local'
    ) {
      const [dbUser] = await db
        .select({
          id: users.id,
          status: users.status,
          role: users.role,
        })
        .from(users)
        .where(eq(users.id, activeSession.userId))
        .limit(1);

      if (!dbUser || dbUser.status !== 'ACTIVE') {
        return {
          authorized: false,
          isLocalPreview: false,
          userId: activeSession.userId,
          email: activeSession.email,
          isSuperAdmin: false,
          reason: 'USER_SUSPENDED_OR_NOT_FOUND',
        };
      }
      if (dbUser.role === 'SUPER_ADMIN') {
        isSuperAdmin = true;
      }
    }

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
          userId: activeSession.userId,
          email: activeSession.email,
          isSuperAdmin,
          reason: 'PLAN_NOT_FOUND',
        };
      }

      if (planRow.ownerUserId !== activeSession.userId) {
        return {
          authorized: false,
          isLocalPreview: false,
          userId: activeSession.userId,
          email: activeSession.email,
          isSuperAdmin,
          reason: 'PLAN_OWNERSHIP_MISMATCH',
        };
      }
    }

    return {
      authorized: true,
      isLocalPreview: isLocalPlanId,
      userId: activeSession.userId,
      email: activeSession.email,
      isSuperAdmin,
    };
  } catch {
    return {
      authorized: false,
      isLocalPreview: isLocalPlanId,
      userId: activeSession.userId,
      email: activeSession.email,
      isSuperAdmin: false,
      reason: 'DATABASE_UNAVAILABLE',
    };
  }
}
