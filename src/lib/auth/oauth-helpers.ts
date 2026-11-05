import { NextRequest } from 'next/server';

/**
 * Resolves the true public origin (protocol + host) of the application,
 * reliably handling Cloud Run, Docker containers, reverse proxies (Nginx, Cloudflare),
 * and local development without ever leaking internal container addresses (0.0.0.0 / 127.0.0.1).
 */
export function resolvePublicOrigin(req: NextRequest): string {
  // 1. Check if user configured an explicit public production URL in env
  const envUrl = (
    process.env.APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    ''
  ).replace(/\/$/, '');

  // If envUrl is set to a real production domain, prioritize it
  if (
    envUrl &&
    !envUrl.includes('localhost') &&
    !envUrl.includes('0.0.0.0') &&
    !envUrl.includes('127.0.0.1')
  ) {
    return envUrl;
  }

  // 2. Extract from standard reverse proxy headers (Cloud Run, Cloudflare, App Engine, AWS, Nginx)
  const xForwardedHost = req.headers.get('x-forwarded-host');
  const host = xForwardedHost || req.headers.get('host');
  const xForwardedProto = req.headers.get('x-forwarded-proto');

  // If host is a real public domain or hostname (not internal container 0.0.0.0 or 127.0.0.1)
  if (host && !host.startsWith('0.0.0.0') && !host.startsWith('127.0.0.1')) {
    const isLocalhost = host.includes('localhost');
    const proto = xForwardedProto || (isLocalhost ? 'http' : 'https');
    return `${proto}://${host}`;
  }

  // 3. If running locally with an explicit envUrl (e.g. http://localhost:3000)
  if (envUrl) {
    return envUrl;
  }

  // 4. Safe fallback: if request nextUrl host is internal, default to localhost:3000
  const proto = req.nextUrl.protocol.startsWith('https') ? 'https' : 'http';
  const finalHost =
    req.nextUrl.host.startsWith('0.0.0.0') || req.nextUrl.host.startsWith('127.0.0.1')
      ? 'localhost:3000'
      : req.nextUrl.host;

  return `${proto}://${finalHost}`;
}
