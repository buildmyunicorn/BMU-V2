import crypto from 'crypto';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'bmu_session_token';
const ADMIN_SESSION_COOKIE_NAME = 'bmu_super_admin_token';
const SESSION_SECRET =
  process.env.BETTER_AUTH_SECRET ||
  process.env.AUTH_SECRET ||
  'bmu-v2-cloud-run-default-secret-change-in-prod-2026';

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

function signPayload(payload: SessionTokenPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(data)
    .digest('base64url');
  return `${data}.${signature}`;
}

function verifyPayload(token: string): SessionTokenPayload | null {
  try {
    const [data, signature] = token.split('.');
    if (!data || !signature) return null;
    const expectedSig = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(data)
      .digest('base64url');
    if (signature !== expectedSig) return null;
    const decoded = JSON.parse(
      Buffer.from(data, 'base64url').toString('utf8')
    ) as SessionTokenPayload;
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
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyPayload(token);
  } catch {
    return null;
  }
}

export async function clearServerSessionCookie(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
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
    const token = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    const payload = verifyPayload(token);
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
  } catch {
    // Ignore if called outside request context
  }
}
