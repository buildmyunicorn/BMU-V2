import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import { db, ensureDatabaseSchemaSynced } from '@/db';
import { users, userEntitlements, startupPlans } from '@/db/schema';
import { setServerSessionCookie } from '@/lib/auth/server-auth';
import { ensureDefaultTenantId } from '@/app/actions/auth';
import { calculatePassLimits } from '@/lib/entitlements';
import { sendSystemEmail } from '@/lib/email/send';
import { EMAIL_DEFAULTS } from '@/lib/email/resend';
import { resolvePublicOrigin } from '@/lib/auth/oauth-helpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const errorParam = url.searchParams.get('error');

  const origin = resolvePublicOrigin(req);

  const cookieStore = await cookies();
  const rawSavedState = cookieStore.get('spf_oauth_state')?.value;
  let savedState: { state: string; from?: string; returnTo?: string } | null = null;

  if (rawSavedState) {
    try {
      savedState = JSON.parse(rawSavedState);
    } catch {
      savedState = { state: rawSavedState };
    }
  }

  // Clear state cookie immediately to prevent replay
  cookieStore.delete('spf_oauth_state');

  const fallbackPath = savedState?.from === 'register' ? '/register' : '/login';

  // Check if Google returned an error (e.g. user canceled consent)
  if (errorParam) {
    const redirectUrl = new URL(fallbackPath, origin);
    redirectUrl.searchParams.set(
      'error',
      errorParam === 'access_denied' ? 'oauth_denied' : 'oauth_error'
    );
    return NextResponse.redirect(redirectUrl);
  }

  // Check state and code
  if (!code || !state || !savedState || savedState.state !== state) {
    const redirectUrl = new URL(fallbackPath, origin);
    redirectUrl.searchParams.set('error', 'invalid_state');
    return NextResponse.redirect(redirectUrl);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    const redirectUrl = new URL(fallbackPath, origin);
    redirectUrl.searchParams.set('error', 'missing_google_keys');
    return NextResponse.redirect(redirectUrl);
  }

  const redirectUri = `${origin}/api/auth/callback/google`;

  // 1. Exchange authorization code for Google access token
  let tokenData: { access_token?: string; id_token?: string };
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('[SPF Google OAuth] Token exchange failed:', errText);
      const redirectUrl = new URL(fallbackPath, origin);
      redirectUrl.searchParams.set('error', 'oauth_exchange_failed');
      return NextResponse.redirect(redirectUrl);
    }

    tokenData = await tokenRes.json();
  } catch (err) {
    console.error('[SPF Google OAuth] Network error during token exchange:', err);
    const redirectUrl = new URL(fallbackPath, origin);
    redirectUrl.searchParams.set('error', 'oauth_exchange_failed');
    return NextResponse.redirect(redirectUrl);
  }

  if (!tokenData.access_token) {
    const redirectUrl = new URL(fallbackPath, origin);
    redirectUrl.searchParams.set('error', 'oauth_exchange_failed');
    return NextResponse.redirect(redirectUrl);
  }

  // 2. Fetch user profile from Google UserInfo endpoint
  let googleProfile: {
    sub?: string;
    email?: string;
    name?: string;
    picture?: string;
    email_verified?: boolean;
  };
  try {
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!profileRes.ok) {
      const redirectUrl = new URL(fallbackPath, origin);
      redirectUrl.searchParams.set('error', 'oauth_profile_failed');
      return NextResponse.redirect(redirectUrl);
    }

    googleProfile = await profileRes.json();
  } catch (err) {
    console.error('[SPF Google OAuth] Error fetching user profile:', err);
    const redirectUrl = new URL(fallbackPath, origin);
    redirectUrl.searchParams.set('error', 'oauth_profile_failed');
    return NextResponse.redirect(redirectUrl);
  }

  const cleanEmail = googleProfile.email?.trim().toLowerCase();
  if (!cleanEmail) {
    const redirectUrl = new URL(fallbackPath, origin);
    redirectUrl.searchParams.set('error', 'oauth_no_email');
    return NextResponse.redirect(redirectUrl);
  }

  const cleanName =
    googleProfile.name?.trim() || cleanEmail.split('@')[0] || 'Founder';
  const cleanImage = googleProfile.picture || null;

  try {
    await ensureDatabaseSchemaSynced();

    // 3. Look up user by email in PostgreSQL
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    let userId: string;
    let isNewUser = false;

    if (existingUser) {
      if (
        existingUser.status === 'SUSPENDED' ||
        existingUser.status === 'SOFT_DELETED'
      ) {
        const redirectUrl = new URL(fallbackPath, origin);
        redirectUrl.searchParams.set('error', 'account_suspended');
        return NextResponse.redirect(redirectUrl);
      }

      userId = existingUser.id;

      // Update image and emailVerified if needed
      await db
        .update(users)
        .set({
          image: existingUser.image || cleanImage,
          emailVerified: true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser.id));
    } else {
      isNewUser = true;
      const tenantId = await ensureDefaultTenantId();

      const [createdUser] = await db
        .insert(users)
        .values({
          tenantId,
          email: cleanEmail,
          name: cleanName,
          image: cleanImage,
          emailVerified: true,
          role: 'FOUNDER',
          status: 'ACTIVE',
          founderProfileJson: {},
        })
        .returning();

      userId = createdUser.id;

      // Create initial FREE_HOOK entitlements
      const freeLimits = calculatePassLimits('FREE_HOOK');
      await db.insert(userEntitlements).values({
        userId: createdUser.id,
        planType: 'FREE_HOOK',
        stackedCodesCount: 0,
        maxStartupPlans: freeLimits.maxStartupPlans,
        maxSeatsPerPlan: freeLimits.maxSeatsPerPlan,
        monthlyAiCreditsLimit: freeLimits.monthlyAiCreditsLimit,
        aiCreditsUsedThisMonth: 0,
        whiteLabelExportEnabled: false,
        isVaultReadonly: false,
      });

      // Fire welcome email asynchronously
      sendSystemEmail({
        to: cleanEmail,
        template: 'WELCOME_FOUNDER',
        subject:
          'Welcome to Startup Preflight — Your Founder Workspace is Ready',
        props: {
          founderName: cleanName,
          loginEmail: cleanEmail,
          loginUrl: `${EMAIL_DEFAULTS.appUrl}/workspace`,
          tierName: 'Free Ideation Hook',
          hqCountry: 'IE',
        },
        metadata: {
          userId: createdUser.id,
          trigger: 'GOOGLE_OAUTH_REGISTRATION',
        },
      }).catch((emailErr) => {
        console.error(
          '[SPF Email] Failed to send welcome email upon Google registration:',
          emailErr
        );
      });
    }

    // 4. Issue authenticated HttpOnly session cookie
    await setServerSessionCookie({
      userId,
      email: cleanEmail,
    });

    // 5. Route to onboarding for brand new users or founders without plans
    if (isNewUser) {
      return NextResponse.redirect(new URL('/onboarding', origin));
    }

    const existingPlans = await db
      .select({ id: startupPlans.id })
      .from(startupPlans)
      .where(eq(startupPlans.ownerUserId, userId))
      .limit(1);

    if (existingPlans.length === 0) {
      return NextResponse.redirect(new URL('/onboarding', origin));
    }

    const destination =
      savedState?.returnTo && savedState.returnTo.startsWith('/')
        ? savedState.returnTo
        : '/workspace';

    return NextResponse.redirect(new URL(destination, origin));
  } catch (dbErr) {
    console.error('[SPF Google OAuth] Database error processing user:', dbErr);
    const redirectUrl = new URL(fallbackPath, origin);
    redirectUrl.searchParams.set('error', 'db_error');
    return NextResponse.redirect(redirectUrl);
  }
}
