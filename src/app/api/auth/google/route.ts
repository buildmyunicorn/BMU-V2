import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  const url = new URL(req.url);
  const from = url.searchParams.get('from') || 'login';
  const returnTo = url.searchParams.get('returnTo');

  // If Google OAuth credentials are not configured, redirect back with a helpful explanation
  if (!clientId || !clientSecret) {
    const fallbackPath = from === 'register' ? '/register' : '/login';
    const redirectUrl = new URL(fallbackPath, req.url);
    redirectUrl.searchParams.set('error', 'missing_google_keys');
    return NextResponse.redirect(redirectUrl);
  }

  // Determine origin (support custom NEXT_PUBLIC_APP_URL, x-forwarded-host, or standard request host)
  const forwardedProto = req.headers.get('x-forwarded-proto') || req.nextUrl.protocol.replace(':', '');
  const forwardedHost = req.headers.get('x-forwarded-host') || req.nextUrl.host;
  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '') ||
    `${forwardedProto}://${forwardedHost}`;

  const redirectUri = `${origin}/api/auth/callback/google`;
  const state = crypto.randomBytes(24).toString('hex');

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'select_account');

  // Store CSRF state & original intent in a secure HttpOnly cookie (10 min TTL)
  const cookieStore = await cookies();
  cookieStore.set(
    'spf_oauth_state',
    JSON.stringify({
      state,
      from: from === 'register' ? 'register' : 'login',
      returnTo: returnTo && returnTo.startsWith('/') ? returnTo : undefined,
    }),
    {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 10 * 60, // 10 minutes
    }
  );

  return NextResponse.redirect(authUrl.toString());
}
