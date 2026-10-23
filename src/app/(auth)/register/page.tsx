'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ArrowRight,
  Ticket,
  CheckCircle2,
  ChevronDown,
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
import { Badge } from '@/components/ui/badge';
import {
  registerNewFounderSession,
  saveBmuSession,
} from '@/lib/auth/session-store';
import { registerFounderAction } from '@/app/actions/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showVoucherField, setShowVoucherField] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('Please enter your name, email address, and a password.');
      return;
    }

    if (password.trim().length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (
      voucherCode.trim() &&
      !voucherCode.trim().toUpperCase().startsWith('SUMO-') &&
      !voucherCode.trim().toUpperCase().startsWith('BMU-')
    ) {
      setErrorMsg(
        'Voucher codes must start with SUMO- (AppSumo) or BMU- (University/LEO Cohort).'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await registerFounderAction({
        name: fullName,
        email,
        password,
        voucherOrCohortCode: voucherCode,
      });

      if (!result.ok) {
        setErrorMsg(result.error || 'Could not create your account.');
        setIsSubmitting(false);
        return;
      }

      if (result.session) {
        saveBmuSession(result.session);
      } else {
        registerNewFounderSession({
          name: fullName,
          email,
          voucherOrCohortCode: voucherCode,
        });
      }

      router.push('/onboarding');
    } catch {
      registerNewFounderSession({
        name: fullName,
        email,
        voucherOrCohortCode: voucherCode,
      });
      router.push('/onboarding');
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-between bg-slate-50">
      <main className="flex flex-1 flex-col justify-center px-6 py-12">
        <div className="mx-auto grid w-full max-w-5xl grid-cols-1 items-center gap-8 lg:grid-cols-12">
          {/* Left Value Prop Column */}
          <div className="space-y-6 lg:col-span-6">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-xs">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                Build My Unicorn
              </span>
            </Link>

            <div className="space-y-3">
              <Badge variant="default">Free Forever Ideation Hook</Badge>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Your Supportive AI Co-Founder &amp; Blind-Spot Engine.
              </h1>
              <p className="text-base leading-relaxed text-slate-600">
                Get your raw startup idea out of your head and structured onto a
                clean 1-Page Concept Canvas in 5 minutes—with localized tax,
                grant, and unit economics rules baked in from Day 1.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {[
                {
                  title: 'Capture First, Expand Second',
                  desc: 'Zero harsh criticism upfront. Extract your vision cleanly, then review constructive blind spots.',
                },
                {
                  title: 'Localized to Your Home Country',
                  desc: 'Pre-loaded rules & grants for Ireland (LEO/EI), UK (SEIS/Innovate UK), US, Australia, Canada & EU.',
                },
                {
                  title: 'No Credit Card Required',
                  desc: 'Complete Module A (Brain Dump → Concept Canvas → Things to Consider) 100% free.',
                },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {item.title}
                    </div>
                    <div className="text-xs text-slate-500">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Sign-Up Card */}
          <Card className="border-slate-200 shadow-lg lg:col-span-6">
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">
                  Create Your Founder Account
                </CardTitle>
                <Badge variant="outline">Step 1 of 2</Badge>
              </div>
              <CardDescription>
                Start free on Module A, or enter an AppSumo / University Cohort
                code below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* OAuth Quick Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-xs"
                  onClick={() => {
                    registerNewFounderSession({
                      name: 'Sarah Kelly',
                      email: 'sarah.kelly@founder.ie',
                    });
                    router.push('/onboarding');
                  }}
                >
                  Continue with Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-xs"
                  onClick={() => {
                    registerNewFounderSession({
                      name: 'Sarah Kelly',
                      email: 'sarah.kelly@linkedin.com',
                    });
                    router.push('/onboarding');
                  }}
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

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="full-name">Your Full Name</Label>
                  <Input
                    id="full-name"
                    placeholder="e.g. Aoife Brennan"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Work or Personal Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Create Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                {/* Optional AppSumo / Cohort Code Accordion */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                  <button
                    type="button"
                    onClick={() => setShowVoucherField(!showVoucherField)}
                    className="flex w-full items-center justify-between text-left text-xs font-semibold text-indigo-700"
                  >
                    <span className="flex items-center gap-1.5">
                      <Ticket className="h-4 w-4 text-amber-600" />
                      Have an AppSumo Voucher or University/LEO Cohort Code?
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        showVoucherField ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {showVoucherField && (
                    <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                      <Input
                        placeholder="Enter voucher or cohort code"
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value)}
                        className="bg-white font-mono text-xs uppercase"
                      />
                    </div>
                  )}
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
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Continue to 60-Second Idea Setup
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                <span>Already have an account?</span>
                <Link
                  href="/login"
                  className="font-semibold text-indigo-600 hover:underline"
                >
                  Log in here →
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Demo Test Codes Moved to Footer */}
      <footer className="border-t border-slate-200 bg-slate-900 px-6 py-4 text-slate-400">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Wrench className="h-4 w-4 text-indigo-400" />
            <span className="font-semibold text-white">
              Demo Voucher &amp; Cohort Test Codes (Click to Fill):
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setShowVoucherField(true);
                setVoucherCode('SUMO-BMU-1001-ALPHA');
              }}
              className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 font-mono text-amber-300 hover:border-amber-500"
            >
              SUMO-BMU-1001-ALPHA (AppSumo Tier 1)
            </button>
            <button
              type="button"
              onClick={() => {
                setShowVoucherField(true);
                setVoucherCode('BMU-UCD-2027');
              }}
              className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 font-mono text-emerald-300 hover:border-emerald-500"
            >
              BMU-UCD-2027 (UCD Nova Cohort)
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
