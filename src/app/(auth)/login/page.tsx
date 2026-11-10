'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ArrowRight,
  UserCheck,
  Ticket,
  GraduationCap,
  ShieldAlert,
  Wrench,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BrandLogo } from '@/components/ui/brand-logo';
import { GoogleIcon } from '@/components/ui/google-icon';
import {
  getDefaultDemoSession,
  hasActiveBmuSession,
  loadBmuSessionForEmail,
  recoverAllRealPlansFromBrowserStorage,
  saveBmuSession,
  type BmuLocalSession,
} from '@/lib/auth/session-store';
import {
  calculateAppSumoTierLimits,
  calculatePassLimits,
} from '@/lib/entitlements';
import { loginFounderAction } from '@/app/actions/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const err = params.get('error');
      if (err) {
        const messages: Record<string, string> = {
          missing_google_keys:
            'Google Sign-In is not configured yet. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file.',
          oauth_denied: 'Google sign-in was canceled or access was denied.',
          oauth_exchange_failed:
            'Failed to verify Google credentials. Please try signing in again.',
          oauth_profile_failed:
            'Unable to retrieve your Google profile details. Please try again.',
          oauth_no_email:
            'No email address was returned by Google. Please check your Google account permissions.',
          invalid_state:
            'Security verification failed (state mismatch). Please try again.',
          account_suspended:
            'This account has been suspended. Please contact support.',
          db_error:
            'Database error while signing in with Google. Please try again or use email login.',
          oauth_error:
            'An error occurred during Google sign-in. Please try again.',
        };
        setErrorMsg(messages[err] || 'Authentication error. Please try again.');
      }
    }

    if (hasActiveBmuSession()) {
      const returnUrl = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('returnUrl') ||
          new URLSearchParams(window.location.search).get('redirect')
        : null;
      if (returnUrl && returnUrl.startsWith('/')) {
        router.replace(returnUrl);
      } else {
        router.replace('/workspace');
      }
    }
  }, [router]);

  async function handleStandardLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    const returnUrl = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('returnUrl') ||
        new URLSearchParams(window.location.search).get('redirect')
      : null;
    const destination = returnUrl && returnUrl.startsWith('/') ? returnUrl : '/workspace';

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await loginFounderAction({
        email,
        password,
      });

      if (!result.ok) {
        setErrorMsg(result.error || 'Invalid login credentials.');
        setIsSubmitting(false);
        return;
      }

      if (result.session) {
        const cachedForEmail = loadBmuSessionForEmail(result.session.user.email);
        const mergedSession: BmuLocalSession = cachedForEmail
          ? {
              ...result.session,
              plans: result.session.plans.map((dbPlan) => {
                const localMatch = cachedForEmail.plans.find(
                  (lp) => lp.id === dbPlan.id
                );
                if (!localMatch) return dbPlan;
                return {
                  ...localMatch,
                  ...dbPlan,
                  moduleBData: dbPlan.moduleBData || localMatch.moduleBData,
                  moduleCData: dbPlan.moduleCData || localMatch.moduleCData,
                  moduleDData: dbPlan.moduleDData || localMatch.moduleDData,
                  moduleEData: dbPlan.moduleEData || localMatch.moduleEData,
                };
              }),
            }
          : result.session;

        saveBmuSession(mergedSession);
        if (!mergedSession.user.onboardingCompleted && !returnUrl) {
          router.push('/onboarding');
        } else {
          router.replace(destination);
        }
        return;
      }

      // Offline / local fallback: restore per-email cached session or any recovered real plans
      const cachedForEmail = loadBmuSessionForEmail(email);
      if (cachedForEmail && cachedForEmail.plans.length > 0) {
        saveBmuSession(cachedForEmail);
      } else {
        const base = getDefaultDemoSession();
        base.user.email = email.trim();
        const recoveredPlans = recoverAllRealPlansFromBrowserStorage();
        if (recoveredPlans.length > 0) {
          base.plans = recoveredPlans;
          base.activePlanId = recoveredPlans[0].id;
        }
        saveBmuSession(base);
      }
      router.replace(destination);
    } catch {
      const cachedForEmail = loadBmuSessionForEmail(email);
      if (cachedForEmail && cachedForEmail.plans.length > 0) {
        saveBmuSession(cachedForEmail);
      } else {
        const base = getDefaultDemoSession();
        if (email.trim()) {
          base.user.email = email.trim();
        }
        const recoveredPlans = recoverAllRealPlansFromBrowserStorage();
        if (recoveredPlans.length > 0) {
          base.plans = recoveredPlans;
          base.activePlanId = recoveredPlans[0].id;
        }
        saveBmuSession(base);
      }
      router.replace(destination);
    }
  }

  function handleGoogleLogin() {
    setIsSubmitting(true);
    setErrorMsg(null);
    const returnUrl = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('returnUrl') ||
        new URLSearchParams(window.location.search).get('redirect')
      : null;
    const dest = returnUrl && returnUrl.startsWith('/')
      ? `/api/auth/google?from=login&returnTo=${encodeURIComponent(returnUrl)}`
      : '/api/auth/google?from=login';
    window.location.href = dest;
  }

  function loginWithDevPersona(
    persona: 'FREE' | 'APPSUMO_T2' | 'UCD_COHORT' | 'SUPER_ADMIN'
  ) {
    const base = getDefaultDemoSession();

    if (persona === 'FREE') {
      saveBmuSession(base);
    } else if (persona === 'APPSUMO_T2') {
      const sumo = calculateAppSumoTierLimits(2);
      const session: BmuLocalSession = {
        ...base,
        user: {
          ...base.user,
          name: 'Liam O’Connor',
          email: 'appsumo@startuppreflight.com',
        },
        entitlement: {
          userId: 'user-liam-sumo',
          planType: 'APPSUMO_LTD',
          stackedCodesCount: 2,
          maxStartupPlans: sumo.maxStartupPlans,
          maxSeatsPerPlan: sumo.maxSeatsPerPlan,
          monthlyAiCreditsLimit: sumo.monthlyAiCreditsLimit,
          aiCreditsUsedThisMonth: 24,
          whiteLabelExportEnabled: false,
          isVaultReadonly: false,
        },
        redeemedCodes: ['SUMO-SPF-1001-ALPHA', 'SUMO-SPF-1002-BRAVO'],
      };
      saveBmuSession(session);
    } else if (persona === 'UCD_COHORT') {
      const cohort = calculatePassLimits('COHORT_PASS', 6);
      const session: BmuLocalSession = {
        ...base,
        user: {
          ...base.user,
          name: 'Ciara Murphy',
          email: 'ciara@ucdconnect.ie',
          founderStage: 'ACCELERATOR_COHORT',
          cohortCode: 'SPF-UCD-2027',
        },
        entitlement: {
          userId: 'user-ciara-cohort',
          planType: 'COHORT_PASS',
          stackedCodesCount: 0,
          maxStartupPlans: cohort.maxStartupPlans,
          maxSeatsPerPlan: cohort.maxSeatsPerPlan,
          monthlyAiCreditsLimit: cohort.monthlyAiCreditsLimit,
          aiCreditsUsedThisMonth: 15,
          whiteLabelExportEnabled: false,
          accessExpiresAt: cohort.accessExpiresAt,
          isVaultReadonly: false,
        },
      };
      saveBmuSession(session);
    } else if (persona === 'SUPER_ADMIN') {
      const sumo3 = calculateAppSumoTierLimits(5);
      const session: BmuLocalSession = {
        ...base,
        user: {
          ...base.user,
          name: 'Tomo (Super Admin)',
          email: 'admin@startuppreflight.com',
          role: 'SUPER_ADMIN',
        },
        entitlement: {
          userId: 'user-admin',
          planType: 'APPSUMO_LTD',
          stackedCodesCount: 5,
          maxStartupPlans: sumo3.maxStartupPlans,
          maxSeatsPerPlan: sumo3.maxSeatsPerPlan,
          monthlyAiCreditsLimit: 5000,
          aiCreditsUsedThisMonth: 0,
          whiteLabelExportEnabled: true,
          isVaultReadonly: false,
        },
      };
      saveBmuSession(session);
    }

    router.replace('/workspace');
  }

  return (
    <div className="flex min-h-screen flex-col justify-between bg-slate-50">
      {/* Main Centered Login Card */}
      <main className="flex flex-1 flex-col justify-center px-6 py-12">
        <div className="mx-auto w-full max-w-md space-y-6">
          <div className="space-y-2 text-center">
            <Link href="/" className="inline-flex items-center justify-center">
              <BrandLogo variant="full" size="md" theme="light" />
            </Link>
            <p className="text-xs text-slate-500">
              Sign in to access your Startup Plans and AI Co-Founder Workspace.
            </p>
          </div>

          <Card className="border-slate-200 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Welcome Back</CardTitle>
              <CardDescription>
                Continue with Google or your email address.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* OAuth Buttons */}
              <div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-10 text-xs font-medium border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center gap-2.5 shadow-xs transition-colors"
                  onClick={handleGoogleLogin}
                  disabled={isSubmitting}
                >
                  <GoogleIcon className="h-4 w-4 shrink-0" />
                  <span>Continue with Google</span>
                </Button>
              </div>

              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-slate-200" />
                <span className="bg-white px-3 text-[11px] uppercase tracking-wider text-slate-400">
                  Or with email
                </span>
                <div className="w-full border-t border-slate-200" />
              </div>

              <form onSubmit={handleStandardLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="login-email">Email Address</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Password</Label>
                    <span className="cursor-pointer text-xs font-medium text-indigo-600 hover:underline">
                      Forgot password?
                    </span>
                  </div>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                {errorMsg && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-800">
                    {errorMsg}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      Sign In to Workspace
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                <span>New to Startup Preflight?</span>
                <Link
                  href="/register"
                  className="font-semibold text-indigo-600 hover:underline"
                >
                  Create a free account →
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
