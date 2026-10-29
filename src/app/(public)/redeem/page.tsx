'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Ticket,
  Sparkles,
  CheckCircle2,
  ArrowLeft,
  Layers,
  ShieldCheck,
  KeyRound,
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
import { Badge } from '@/components/ui/badge';
import { calculateAppSumoTierLimits } from '@/lib/entitlements';

const VALID_DEMO_CODES = [
  'SUMO-SPF-1001-ALPHA',
  'SUMO-SPF-1002-BRAVO',
  'SUMO-SPF-1003-CHARLIE',
  'SUMO-SPF-1004-DELTA',
  'SUMO-SPF-1005-ECHO',
];

export default function RedeemPage() {
  const [redeemedCodes, setRedeemedCodes] = useState<string[]>([
    'SUMO-SPF-1001-ALPHA',
  ]);
  const [inputCode, setInputCode] = useState('');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const currentTier = calculateAppSumoTierLimits(redeemedCodes.length);

  function handleRedeemCode(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = inputCode.trim().toUpperCase();

    if (!cleaned) {
      setFeedback({
        type: 'error',
        message: 'Please enter a valid AppSumo or Cohort voucher code.',
      });
      return;
    }

    if (redeemedCodes.includes(cleaned)) {
      setFeedback({
        type: 'error',
        message: `Voucher ${cleaned} has already been stacked on your account.`,
      });
      return;
    }

    if (
      !cleaned.startsWith('SUMO-') &&
      !cleaned.startsWith('SPF-') &&
      !cleaned.startsWith('BMU-')
    ) {
      setFeedback({
        type: 'error',
        message:
          'Unrecognized code format. Use SUMO-SPF-XXXX or SPF-UCD-2027.',
      });
      return;
    }

    const updated = [...redeemedCodes, cleaned];
    setRedeemedCodes(updated);
    setInputCode('');
    const newTier = calculateAppSumoTierLimits(updated.length);
    setFeedback({
      type: 'success',
      message: `Code ${cleaned} redeemed! Your account is now upgraded to ${newTier.tierName}.`,
    });
  }

  return (
    <div className="flex min-h-screen flex-col justify-between bg-slate-50">
      <main className="mx-auto w-full max-w-4xl flex-1 space-y-6 px-6 py-10">
        <div className="flex items-center justify-between">
          <Link
            href="/workspace"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Workspace
          </Link>
          <Badge variant="default">Lifetime Deal &amp; Cohort Redemption</Badge>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 text-white">
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
                Enter AppSumo Voucher or University Cohort Code
              </Label>
              <div className="flex gap-3">
                <Input
                  id="voucher-code"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder="Enter your voucher code"
                  className="font-mono uppercase"
                />
                <Button type="submit">
                  <Sparkles className="h-4 w-4" />
                  Redeem Code
                </Button>
              </div>
            </form>

            {feedback && (
              <div
                className={`rounded-xl border p-3.5 text-sm ${
                  feedback.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                    : 'border-red-200 bg-red-50 text-red-900'
                }`}
              >
                {feedback.message}
              </div>
            )}

            {/* Current Unlocked Tier Summary */}
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                    Active Account Entitlement
                  </div>
                  <div className="text-lg font-bold text-slate-900">
                    {currentTier.tierName}
                  </div>
                </div>
                <Badge variant="default">
                  {currentTier.stackedCodesCount} Code(s) Stacked
                </Badge>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl bg-white p-3 shadow-2xs">
                  <div className="text-xs text-slate-500">Startup Plans</div>
                  <div className="mt-1 text-lg font-bold text-slate-900">
                    {currentTier.maxStartupPlans} Plans
                  </div>
                </div>
                <div className="rounded-xl bg-white p-3 shadow-2xs">
                  <div className="text-xs text-slate-500">Team Seats / Plan</div>
                  <div className="mt-1 text-lg font-bold text-slate-900">
                    {currentTier.maxSeatsPerPlan} Seats
                  </div>
                </div>
                <div className="rounded-xl bg-white p-3 shadow-2xs">
                  <div className="text-xs text-slate-500">Monthly AI Credits</div>
                  <div className="mt-1 text-lg font-bold text-slate-900">
                    {currentTier.monthlyAiCreditsLimit} / mo
                  </div>
                </div>
                <div className="rounded-xl bg-white p-3 shadow-2xs">
                  <div className="text-xs text-slate-500">
                    White-Label &amp; BYOK
                  </div>
                  <div className="mt-1 text-sm font-bold text-slate-900">
                    {currentTier.whiteLabelExportEnabled
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
                  extras: 'Full Modules A–G + Unlimited Exports',
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
                const isUnlocked = redeemedCodes.length >= tier.codes;
                return (
                  <div
                    key={tier.codes}
                    className={`rounded-xl border p-4 ${
                      isUnlocked
                        ? 'border-indigo-500 bg-white ring-1 ring-indigo-500'
                        : 'border-slate-200 bg-slate-50 opacity-80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-indigo-600">
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
                        <Layers className="h-3.5 w-3.5 text-indigo-500" />
                        {tier.plans}
                      </li>
                      <li className="flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" />
                        {tier.seats}
                      </li>
                      <li className="flex items-center gap-1.5">
                        <KeyRound className="h-3.5 w-3.5 text-indigo-500" />
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
