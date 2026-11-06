'use client';

import React, { useState, useEffect } from 'react';
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
import { BrandLogo } from '@/components/ui/brand-logo';
import { GoogleIcon } from '@/components/ui/google-icon';
import {
  registerNewFounderSession,
  saveBmuSession,
} from '@/lib/auth/session-store';
import { registerFounderAction } from '@/app/actions/auth';
import { StripeSandboxBadge } from '@/components/ui/stripe-sandbox-badge';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showVoucherField, setShowVoucherField] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsHighlightError, setTermsHighlightError] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const err = params.get('error');
      if (err) {
        const messages: Record<string, string> = {
          terms_required:
            'Please agree to the Terms of Service and Privacy Policy before creating your account.',
          missing_google_keys:
            'Google Sign-In is not configured yet. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file.',
          oauth_denied: 'Google registration was canceled or access was denied.',
          oauth_exchange_failed:
            'Failed to verify Google credentials. Please try again.',
          oauth_profile_failed:
            'Unable to retrieve your Google profile details. Please try again.',
          oauth_no_email:
            'No email address was returned by Google. Please check your Google account permissions.',
          invalid_state:
            'Security verification failed (state mismatch). Please try again.',
          account_suspended:
            'This account has been suspended. Please contact support.',
          db_error:
            'Database error during Google sign-up. Please try again or use standard registration.',
          oauth_error:
            'An error occurred during Google registration. Please try again.',
        };
        if (err === 'terms_required') {
          setTermsHighlightError(true);
        }
        setErrorMsg(messages[err] || 'Authentication error. Please try again.');
      }
    }
  }, []);

  function handleGoogleRegister() {
    setErrorMsg(null);
    if (!acceptedTerms) {
      setTermsHighlightError(true);
      setErrorMsg(
        'Please tick the box below to agree to the Terms of Service and Privacy Policy before creating your account.'
      );
      const el = document.getElementById('accept-terms');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
      return;
    }
    setIsSubmitting(true);
    window.location.href = '/api/auth/google?from=register&termsAccepted=true';
  }

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

    if (!acceptedTerms) {
      setTermsHighlightError(true);
      setErrorMsg(
        'Please agree to the Terms of Service and Privacy Policy before creating your account.'
      );
      return;
    }

    if (
      voucherCode.trim() &&
      !voucherCode.trim().toUpperCase().startsWith('SUMO-') &&
      !voucherCode.trim().toUpperCase().startsWith('SPF-') &&
      !voucherCode.trim().toUpperCase().startsWith('BMU-')
    ) {
      setErrorMsg(
        'Please enter a valid Institutional Cohort or Partner Voucher code.'
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
        acceptedTerms: true,
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
      <StripeSandboxBadge />
      <main className="flex flex-1 flex-col justify-center px-6 py-12">
        <div className="mx-auto grid w-full max-w-5xl grid-cols-1 items-center gap-8 lg:grid-cols-12">
          {/* Left Value Prop Column */}
          <div className="space-y-6 lg:col-span-6">
            <Link href="/" className="inline-flex items-center">
              <BrandLogo variant="full" size="md" theme="light" />
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
          <div className="space-y-4 lg:col-span-6">
            <StripeSandboxBadge variant="card" />
            <Card className="border-slate-200 shadow-lg">
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">
                  Create Your Founder Account
                </CardTitle>
                <Badge variant="outline">Step 1 of 2</Badge>
              </div>
              <CardDescription>
                Start free on Module A, or enter an Institutional Cohort /
                Partner code below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* OAuth Quick Buttons */}
              <div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-10 text-xs font-medium border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center gap-2.5 shadow-xs transition-colors"
                  onClick={handleGoogleRegister}
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

                {/* Optional Partner / Cohort Code Accordion */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                  <button
                    type="button"
                    onClick={() => setShowVoucherField(!showVoucherField)}
                    className="flex w-full items-center justify-between text-left text-xs font-semibold text-indigo-700"
                  >
                    <span className="flex items-center gap-1.5">
                      <Ticket className="h-4 w-4 text-amber-600" />
                      Have a University/LEO Cohort or Partner Voucher Code?
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

                {/* Mandatory Terms of Service & Privacy Policy Consent */}
                <div
                  className={`rounded-xl border p-3.5 transition-colors ${
                    termsHighlightError && !acceptedTerms
                      ? 'border-red-300 bg-red-50/70 ring-2 ring-red-100'
                      : acceptedTerms
                        ? 'border-indigo-200 bg-indigo-50/40'
                        : 'border-slate-200 bg-slate-50/60 hover:border-slate-300'
                  }`}
                >
                  <label
                    htmlFor="accept-terms"
                    className="flex cursor-pointer items-start gap-2.5 select-none"
                  >
                    <input
                      id="accept-terms"
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setAcceptedTerms(checked);
                        if (checked) {
                          setTermsHighlightError(false);
                          if (
                            errorMsg?.toLowerCase().includes('terms of service')
                          ) {
                            setErrorMsg(null);
                          }
                        }
                      }}
                      className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    <span className="text-xs leading-relaxed text-slate-700">
                      I have read and agree to the Startup Preflight{' '}
                      <Link
                        href="/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="font-semibold text-indigo-600 underline decoration-indigo-300 underline-offset-2 hover:text-indigo-800"
                      >
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link
                        href="/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="font-semibold text-indigo-600 underline decoration-indigo-300 underline-offset-2 hover:text-indigo-800"
                      >
                        Privacy Policy
                      </Link>
                      . <span className="font-semibold text-red-600">*</span>
                    </span>
                  </label>
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
        </div>
      </main>
    </div>
  );
}
