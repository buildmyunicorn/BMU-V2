'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Ticket,
  Sparkles,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Layers,
  ShieldCheck,
  KeyRound,
  Loader2,
  AlertCircle,
  LogIn,
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
import { Badge } from '@/components/ui/badge';
import {
  calculateAppSumoTierLimits,
  calculatePassLimits,
  getPlanTypeDisplayName,
  type EntitlementSnapshot,
} from '@/lib/entitlements';
import {
  hasActiveBmuSession,
  loadBmuSession,
  saveBmuSession,
} from '@/lib/auth/session-store';
import {
  getFounderVoucherStateAction,
  redeemVoucherOrCohortCodeAction,
} from '@/app/actions/vouchers';

export default function RedeemPage() {
  const [isLoadingState, setIsLoadingState] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeUserId, setActiveUserId] = useState<string>('');
  const [activeUserEmail, setActiveUserEmail] = useState<string>('');
  const [entitlement, setEntitlement] = useState<EntitlementSnapshot>(() => {
    const freeDefaults = calculatePassLimits('FREE_HOOK');
    return {
      userId: '',
      planType: 'FREE_HOOK',
      stackedCodesCount: 0,
      maxStartupPlans: freeDefaults.maxStartupPlans,
      maxSeatsPerPlan: freeDefaults.maxSeatsPerPlan,
      monthlyAiCreditsLimit: freeDefaults.monthlyAiCreditsLimit,
      aiCreditsUsedThisMonth: 0,
      whiteLabelExportEnabled: false,
      isVaultReadonly: false,
    };
  });
  const [redeemedCodes, setRedeemedCodes] = useState<string[]>([]);
  const [cohortCode, setCohortCode] = useState<string | undefined>(undefined);
  const [inputCode, setInputCode] = useState('');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function hydrateVoucherState() {
      const hasLocal = hasActiveBmuSession();
      const localSession = hasLocal ? loadBmuSession() : null;

      if (localSession) {
        setActiveUserId(localSession.user.id);
        setActiveUserEmail(localSession.user.email);
        setEntitlement(localSession.entitlement);
        setRedeemedCodes(localSession.redeemedCodes || []);
        setCohortCode(localSession.user.cohortCode);
        setIsAuthenticated(true);
      }

      try {
        const res = await getFounderVoucherStateAction(
          localSession
            ? {
                userId: localSession.user.id,
                email: localSession.user.email,
              }
            : undefined
        );

        if (cancelled) return;

        if (res.ok && res.authenticated && res.entitlement) {
          setIsAuthenticated(true);
          setActiveUserId(res.userId || localSession?.user.id || '');
          setActiveUserEmail(res.userEmail || localSession?.user.email || '');
          setEntitlement(res.entitlement);
          setRedeemedCodes(res.redeemedCodes || []);
          setCohortCode(res.cohortCode);

          // Synchronize localStorage session so /workspace reflects current DB entitlements
          const currentLocal = loadBmuSession();
          saveBmuSession({
            ...currentLocal,
            user: {
              ...currentLocal.user,
              id: res.userId || currentLocal.user.id,
              email: res.userEmail || currentLocal.user.email,
              name: res.userName || currentLocal.user.name,
              cohortCode: res.cohortCode || currentLocal.user.cohortCode,
            },
            entitlement: res.entitlement,
            redeemedCodes: res.redeemedCodes || [],
          });
        }
      } catch {
        // Keep local session fallback if network/DB is unreachable
      } finally {
        if (!cancelled) {
          setIsLoadingState(false);
        }
      }
    }

    void hydrateVoucherState();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleRedeemCode(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = inputCode.trim().toUpperCase();

    if (!cleaned) {
      setFeedback({
        type: 'error',
        message: 'Please enter a valid Partner, Promo, or Cohort voucher code.',
      });
      return;
    }

    if (redeemedCodes.includes(cleaned) || cohortCode === cleaned) {
      setFeedback({
        type: 'error',
        message: `Voucher ${cleaned} has already been applied to your account.`,
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await redeemVoucherOrCohortCodeAction(cleaned, {
        userId: activeUserId || undefined,
        email: activeUserEmail || undefined,
      });

      if (!res.ok) {
        setFeedback({
          type: 'error',
          message:
            res.error || 'Could not redeem that voucher code. Please try again.',
        });
        return;
      }

      const nextEntitlement = res.entitlement || entitlement;
      const nextCodes =
        res.redeemedCodes && res.redeemedCodes.length > 0
          ? res.redeemedCodes
          : Array.from(new Set([...redeemedCodes, cleaned]));

      setEntitlement(nextEntitlement);
      setRedeemedCodes(nextCodes);
      if (res.cohortCode) {
        setCohortCode(res.cohortCode);
      }
      setInputCode('');

      // Persist immediately to localStorage so returning to /workspace unlocks Modules B–L right away
      const currentLocal = loadBmuSession();
      saveBmuSession({
        ...currentLocal,
        user: {
          ...currentLocal.user,
          cohortCode: res.cohortCode || currentLocal.user.cohortCode,
        },
        entitlement: nextEntitlement,
        redeemedCodes: nextCodes,
      });

      setFeedback({
        type: 'success',
        message:
          res.message ||
          `Code ${cleaned} redeemed! Your account is now upgraded to ${
            res.newTierName ||
            getPlanTypeDisplayName(nextEntitlement.planType, {
              isVaultReadonly: nextEntitlement.isVaultReadonly,
              stackedCodesCount: nextEntitlement.stackedCodesCount,
            })
          }.`,
      });
    } catch {
      setFeedback({
        type: 'error',
        message:
          'An unexpected network error occurred while redeeming your code. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const effectiveStackedCount =
    entitlement.planType === 'APPSUMO_LTD'
      ? Math.max(entitlement.stackedCodesCount || 0, redeemedCodes.length)
      : redeemedCodes.length;

  const displayTierTitle =
    entitlement.planType === 'APPSUMO_LTD' && effectiveStackedCount > 0
      ? calculateAppSumoTierLimits(effectiveStackedCount).tierName
      : getPlanTypeDisplayName(entitlement.planType, {
          isVaultReadonly: entitlement.isVaultReadonly,
          stackedCodesCount: entitlement.stackedCodesCount,
        });

  return (
    <div className="flex min-h-screen flex-col justify-between bg-slate-50">
      <main className="mx-auto w-full max-w-4xl flex-1 space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link
            href="/workspace"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Workspace
          </Link>
          <div className="flex items-center gap-2">
            {activeUserEmail && (
              <span className="text-xs text-slate-500">
                Signed in as{' '}
                <strong className="font-semibold text-slate-800">
                  {activeUserEmail}
                </strong>
              </span>
            )}
            <Badge variant="default">Voucher &amp; Cohort Redemption</Badge>
          </div>
        </div>

        {!isLoadingState && !isAuthenticated && (
          <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
              <span>
                You must be signed in to your founder account so your voucher code attaches to your workspace.
              </span>
            </div>
            <Link href="/login">
              <Button size="sm" className="h-8 text-xs">
                <LogIn className="mr-1.5 h-3.5 w-3.5" />
                Sign In / Create Account
              </Button>
            </Link>
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
                <Ticket className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  Redeem &amp; Stack Your Voucher Codes
                </CardTitle>
                <CardDescription>
                  Stack 1, 2, or 3+ codes to unlock Multi-Plan Clone &amp;
                  Pivot, Co-Founder Alignment Interviews, White-Label PDF
                  Exports, and BYOK.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleRedeemCode} className="space-y-3">
              <Label htmlFor="voucher-code">
                Enter Voucher Code, Partner Pass, or University Cohort Code
              </Label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  id="voucher-code"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder="e.g. PREFLIGHT-VIP-2027 or LEO-DUBLIN-BATCH"
                  className="font-mono text-base uppercase sm:text-sm"
                  disabled={isSubmitting}
                />
                <Button
                  type="submit"
                  disabled={isSubmitting || isLoadingState}
                  className="w-full shrink-0 sm:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      Redeeming...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-1.5 h-4 w-4" />
                      Redeem Code
                    </>
                  )}
                </Button>
              </div>
            </form>

            {feedback && (
              <div
                className={`flex flex-col justify-between gap-3 rounded-xl border p-3.5 text-sm sm:flex-row sm:items-center ${
                  feedback.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                    : 'border-red-200 bg-red-50 text-red-900'
                }`}
              >
                <div className="flex items-start gap-2">
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                  )}
                  <span>{feedback.message}</span>
                </div>
                {feedback.type === 'success' && (
                  <Link href="/workspace" className="shrink-0">
                    <Button
                      size="sm"
                      className="h-8 w-full bg-emerald-700 text-xs text-white hover:bg-emerald-800 sm:w-auto"
                    >
                      Open Unlocked Workspace
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                )}
              </div>
            )}

            {/* Current Unlocked Tier Summary */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                    Active Account Entitlement
                  </div>
                  <div className="text-lg font-bold text-slate-900">
                    {isLoadingState ? 'Loading account entitlement...' : displayTierTitle}
                  </div>
                </div>
                <Badge variant="default">
                  {effectiveStackedCount} Code(s) Stacked
                </Badge>
              </div>

              {redeemedCodes.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-medium text-slate-500">
                    Applied Vouchers:
                  </span>
                  {redeemedCodes.map((code) => (
                    <span
                      key={code}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-900"
                    >
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      {code}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl bg-white p-3 shadow-2xs">
                  <div className="text-xs text-slate-500">Startup Plans</div>
                  <div className="mt-1 text-lg font-bold text-slate-900">
                    {entitlement.maxStartupPlans} Plans
                  </div>
                </div>
                <div className="rounded-xl bg-white p-3 shadow-2xs">
                  <div className="text-xs text-slate-500">Team Seats / Plan</div>
                  <div className="mt-1 text-lg font-bold text-slate-900">
                    {entitlement.maxSeatsPerPlan} Seats
                  </div>
                </div>
                <div className="rounded-xl bg-white p-3 shadow-2xs">
                  <div className="text-xs text-slate-500">Monthly AI Credits</div>
                  <div className="mt-1 text-lg font-bold text-slate-900">
                    {entitlement.monthlyAiCreditsLimit} / mo
                  </div>
                </div>
                <div className="rounded-xl bg-white p-3 shadow-2xs">
                  <div className="text-xs text-slate-500">
                    White-Label &amp; BYOK
                  </div>
                  <div className="mt-1 text-sm font-bold text-slate-900">
                    {entitlement.whiteLabelExportEnabled
                      ? 'Enabled (Tier 3)'
                      : 'Requires 3 Codes'}
                  </div>
                </div>
              </div>
            </div>

            {/* 3-Tier Stacking Breakdown Table */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                {
                  codes: 1,
                  title: 'Tier 1: Solo Founder',
                  plans: '1 Active Startup Plan',
                  seats: '1 User Seat (Solo)',
                  credits: '150 AI Credits / month',
                  extras: 'Full Modules A–L + Unlimited Exports',
                },
                {
                  codes: 2,
                  title: 'Tier 2: Co-Founder & Pivot',
                  plans: '3 Active Startup Plans (Clone & Pivot)',
                  seats: '3 Team Seats / Plan',
                  credits: '450 AI Credits / month',
                  extras:
                    'Unlocks Blind-Reveal Co-Founder Interview & Idea Comparator',
                },
                {
                  codes: 3,
                  title: 'Tier 3: Serial Entrepreneur',
                  plans: '10+ Active Startup Plans',
                  seats: '5 Team Seats / Plan',
                  credits: '1,500 AI Credits / month',
                  extras:
                    'White-Label PDF Exports + Bring Your Own API Key (BYOK)',
                },
              ].map((tier) => {
                const isUnlocked = effectiveStackedCount >= tier.codes;
                return (
                  <div
                    key={tier.codes}
                    className={`rounded-xl border p-4 ${
                      isUnlocked
                        ? 'border-emerald-600 bg-white ring-1 ring-emerald-700'
                        : 'border-slate-200 bg-slate-50 opacity-80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-emerald-700">
                        {tier.codes} {tier.codes === 1 ? 'Code' : 'Codes'}
                      </span>
                      {isUnlocked && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      )}
                    </div>
                    <div className="mt-1 font-semibold text-slate-900">
                      {tier.title}
                    </div>
                    <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
                      <li className="flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-emerald-700" />
                        {tier.plans}
                      </li>
                      <li className="flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                        {tier.seats}
                      </li>
                      <li className="flex items-center gap-1.5">
                        <KeyRound className="h-3.5 w-3.5 text-emerald-700" />
                        {tier.credits}
                      </li>
                    </ul>
                    <p className="mt-3 border-t border-slate-100 pt-2 text-[11px] text-slate-500">
                      {tier.extras}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
