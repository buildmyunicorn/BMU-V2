import { NextRequest } from 'next/server';

const DEFAULT_PROD_ORIGIN = 'https://startuppreflight.com';

/**
 * Returns the canonical, server-trusted application origin for Stripe return URLs,
 * OAuth callbacks, and transactional email links. Never trusts raw client `Origin`
 * or `Host` headers when a canonical URL is configured or in production.
 */
export function getTrustedAppOrigin(): string {
  const configured = (
    process.env.APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    ''
  ).replace(/\/+$/, '');

  if (configured) {
    try {
      const parsed = new URL(configured);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        return parsed.origin;
      }
    } catch {
      // Fall through
    }
  }

  if (process.env.NODE_ENV === 'production') {
    return DEFAULT_PROD_ORIGIN;
  }

  return 'http://localhost:3000';
}

/**
 * Sanitizes an internal post-login `returnTo` path to strictly prevent
 * open redirects (including protocol-relative `//evil.com` and `/\evil.com` bypasses).
 */
export function sanitizeInternalReturnPath(
  raw?: string | null,
  fallback = '/workspace'
): string {
  if (!raw || typeof raw !== 'string') return fallback;
  const trimmed = raw.trim();
  if (
    !trimmed.startsWith('/') ||
    trimmed.startsWith('//') ||
    trimmed.includes('\\') ||
    /[\r\n\0]/.test(trimmed)
  ) {
    return fallback;
  }

  try {
    const parsed = new URL(trimmed, 'https://spf.internal');
    if (parsed.origin !== 'https://spf.internal') {
      return fallback;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

/**
 * Resolves the true public origin (protocol + host) of the application,
 * prioritizing configured APP_URL / NEXT_PUBLIC_APP_URL so forged X-Forwarded-* headers
 * cannot hijack OAuth redirect_uri or strip Secure cookie flags in production.
 */
export function resolvePublicOrigin(req: NextRequest): string {
  const envUrl = (
    process.env.APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    ''
  ).replace(/\/+$/, '');

  if (
    envUrl &&
    !envUrl.includes('localhost') &&
    !envUrl.includes('0.0.0.0') &&
    !envUrl.includes('127.0.0.1')
  ) {
    return envUrl;
  }

  if (process.env.NODE_ENV === 'production') {
    return DEFAULT_PROD_ORIGIN;
  }

  const xForwardedHost = req.headers.get('x-forwarded-host');
  const host = xForwardedHost || req.headers.get('host');
  const xForwardedProto = req.headers.get('x-forwarded-proto');

  if (host && !host.startsWith('0.0.0.0') && !host.startsWith('127.0.0.1')) {
    const isLocalhost = host.includes('localhost');
    const proto =
      xForwardedProto === 'https' || (!isLocalhost && xForwardedProto !== 'http')
        ? 'https'
        : 'http';
    return `${proto}://${host}`;
  }

  if (envUrl) {
    return envUrl;
  }

  const proto = req.nextUrl.protocol.startsWith('https') ? 'https' : 'http';
  const finalHost =
    req.nextUrl.host.startsWith('0.0.0.0') ||
    req.nextUrl.host.startsWith('127.0.0.1')
      ? 'localhost:3000'
      : req.nextUrl.host;

  return `${proto}://${finalHost}`;
}
