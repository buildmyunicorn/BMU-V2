'use client';

import React, { useState } from 'react';
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
import {
  getDefaultDemoSession,
  saveBmuSession,
  type BmuLocalSession,
  type IndustryCategory,
} from '@/lib/auth/session-store';
import {
  calculateAppSumoTierLimits,
  calculatePassLimits,
} from '@/lib/entitlements';
import { loginUserAction } from '@/app/actions/bmu-actions';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  async function handleStandardLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const base = getDefaultDemoSession();
      if (email.trim()) {
        const dbRes = await loginUserAction({ email: email.trim() });
        if (dbRes.foundInDb && dbRes.user && dbRes.entitlement) {
          const loadedPlans =
            dbRes.plans && dbRes.plans.length > 0
              ? dbRes.plans.map((p) => ({
                  id: p.id,
                  title: p.title,
                  oneLinerSummary: p.oneLinerSummary,
                  industryCategory:
                    (p.industryCategory as IndustryCategory) ||
                    'B2B SaaS / AI App',
                  hqCountryCode: p.hqCountryCode,
                  baseCurrency: p.baseCurrency,
                  targetMarketsArray: p.targetMarketsArray,
                  exportPotential:
                    p.targetMarketsArray.length > 1
                      ? ('EXPORTING_INTERNATIONALLY' as const)
                      : ('DOMESTIC_ONLY' as const),
                  currentModuleStep: p.currentModuleStep,
                  brainDumpText: p.brainDumpText,
                  openQuestions: p.openQuestions,
                }))
              : base.plans;

          saveBmuSession({
            user: {
              ...base.user,
              id: dbRes.user.id,
              name: dbRes.user.name,
              email: dbRes.user.email,
              role: dbRes.user.role,
              onboardingCompleted: true,
            },
            entitlement: dbRes.entitlement,
            redeemedCodes: [],
            plans: loadedPlans,
            activePlanId: loadedPlans[0].id,
          });
          router.push('/workspace');
          return;
        }
        base.user.email = email.trim();
      }
      saveBmuSession(base);
      router.push('/workspace');
    } finally {
      setIsLoggingIn(false);
    }
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
          email: 'appsumo@buildmyunicorn.com',
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
        redeemedCodes: ['SUMO-BMU-1001-ALPHA', 'SUMO-BMU-1002-BRAVO'],
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
          cohortCode: 'BMU-UCD-2027',
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
          email: 'admin@buildmyunicorn.com',
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

    router.push('/workspace');
  }

  return (
    <div className="flex min-h-screen flex-col justify-between bg-slate-50">
      {/* Main Centered Login Card */}
      <main className="flex flex-1 flex-col justify-center px-6 py-12">
        <div className="mx-auto w-full max-w-md space-y-6">
          <div className="space-y-2 text-center">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-xs">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Build My Unicorn
              </span>
            </Link>
            <p className="text-xs text-slate-500">
              Sign in to access your Startup Plans and AI Co-Founder Workspace.
            </p>
          </div>

          <Card className="border-slate-200 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Welcome Back</CardTitle>
              <CardDescription>
                Continue with Google, LinkedIn, or your email address.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* OAuth Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-xs"
                  onClick={() => loginWithDevPersona('FREE')}
                >
                  Continue with Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-xs"
                  onClick={() => loginWithDevPersona('FREE')}
                >
                  Continue with LinkedIn
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
                <Button type="submit" className="w-full" size="lg">
                  Sign In to Workspace
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                <span>New to Build My Unicorn?</span>
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

      {/* Developer & Demo Persona Switcher Moved to Footer */}
      <footer className="border-t border-slate-200 bg-slate-900 px-6 py-5 text-slate-400">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Wrench className="h-4 w-4 text-indigo-400" />
            <span className="font-semibold text-white">
              Demo Persona Quick-Login (Dev Mode):
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => loginWithDevPersona('FREE')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 font-medium text-slate-200 hover:border-indigo-500 hover:text-white"
            >
              <UserCheck className="h-3.5 w-3.5 text-indigo-400" />
              Aoife (Free Hook)
            </button>

            <button
              type="button"
              onClick={() => loginWithDevPersona('APPSUMO_T2')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 font-medium text-slate-200 hover:border-amber-500 hover:text-white"
            >
              <Ticket className="h-3.5 w-3.5 text-amber-400" />
              Liam (AppSumo Tier 2)
            </button>

            <button
              type="button"
              onClick={() => loginWithDevPersona('UCD_COHORT')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 font-medium text-slate-200 hover:border-emerald-500 hover:text-white"
            >
              <GraduationCap className="h-3.5 w-3.5 text-emerald-400" />
              Ciara (UCD Nova Cohort)
            </button>

            <button
              type="button"
              onClick={() => loginWithDevPersona('SUPER_ADMIN')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 font-medium text-slate-200 hover:border-violet-500 hover:text-white"
            >
              <ShieldAlert className="h-3.5 w-3.5 text-violet-400" />
              Tomo (Super Admin • BYOK)
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
