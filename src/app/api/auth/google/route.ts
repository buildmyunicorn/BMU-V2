import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { resolvePublicOrigin } from '@/lib/auth/oauth-helpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  const url = new URL(req.url);
  const from = url.searchParams.get('from') || 'login';
  const returnTo = url.searchParams.get('returnTo');
  // On the register page, clicking "Continue with Google" provides clickwrap consent to terms & privacy
  const termsAccepted = url.searchParams.get('termsAccepted') === 'true' || from === 'register';

  const origin = resolvePublicOrigin(req);

  // If Google OAuth credentials are not configured, redirect back with a helpful explanation
  if (!clientId || !clientSecret) {
    const fallbackPath = from === 'register' ? '/register' : '/login';
    const redirectUrl = new URL(fallbackPath, origin);
    redirectUrl.searchParams.set('error', 'missing_google_keys');
    return NextResponse.redirect(redirectUrl);
  }

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
      secure: origin.startsWith('https://'),
      path: '/',
      maxAge: 10 * 60, // 10 minutes
    }
  );

  return NextResponse.redirect(authUrl.toString());
}
