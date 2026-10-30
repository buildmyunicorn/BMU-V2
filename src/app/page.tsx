'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Compass,
  BarChart3,
  MessageSquare,
  Briefcase,
  DollarSign,
  Megaphone,
  Scale,
  FileText,
  LogIn,
  Wrench,
  Users,
  Landmark,
  Construction,
  Clock,
  Check,
  ChevronDown,
  ChevronUp,
  Coins,
  Lightbulb,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { clearActiveBmuSession } from '@/lib/auth/session-store';
import { logoutFounderAction } from '@/app/actions/auth';
import {
  submitEarlyAccessWaitlistAction,
  type EarlyAccessLeadRecord,
} from '@/app/actions/admin';

interface ModulePreviewItem {
  code: string;
  short: string;
  title: string;
  plainDesc: string;
  grantLink: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
  badgeVariant: 'success' | 'default' | 'secondary' | 'warning';
}

const MODULES_PREVIEW: ModulePreviewItem[] = [
  {
    code: 'MOD_A_IDEATION',
    short: 'Module A',
    title: 'Plain-English Idea Canvas & Grant Fit Check',
    plainDesc:
      'Dump your raw idea in plain English. We turn it into a 1-Page Concept Canvas, gently spot blind spots, and check your sector eligibility for grants.',
    grantLink: 'Instant IE / UK Grant Sector Pre-Check',
    icon: Compass,
    badge: '100% Free at Launch',
    badgeVariant: 'success',
  },
  {
    code: 'MOD_B_MARKET',
    short: 'Module B',
    title: 'Customers, Competitors & Market Size',
    plainDesc:
      'Define your first buyer, scout real competitors with AI, and calculate realistic market numbers without confusing acronyms.',
    grantLink: 'Proves Export Potential & Non-Displacement',
    icon: BarChart3,
    badge: 'Full Pass',
    badgeVariant: 'secondary',
  },
  {
    code: 'MOD_C_SURVEYS_FEEDBACK',
    short: 'Module C',
    title: '1-Click Customer Survey & Waitlist Link',
    plainDesc:
      'Generate unbiased customer questions, share a hosted customer validation & waitlist link, and log 1-on-1 interviews.',
    grantLink: 'Builds Real Buyer Proof Grant Assessors Demand',
    icon: MessageSquare,
    badge: 'Flagship Tool',
    badgeVariant: 'default',
  },
  {
    code: 'MOD_D_PRODUCT_BUILD',
    short: 'Module D',
    title: 'What Are We Building? (V1 Product Roadmap)',
    plainDesc:
      'Pick the simplest way to build V1, compare selling channels (Web vs. App Store/Amazon), and break work into clear milestones.',
    grantLink: 'Structures Grant Work Packages & Build Quotes',
    icon: Wrench,
    badge: 'Full Pass',
    badgeVariant: 'secondary',
  },
  {
    code: 'MOD_E_OPERATIONS',
    short: 'Module E',
    title: 'Day-to-Day Operations, Equipment & Risks',
    plainDesc:
      'Map how an order flows, list equipment you need to buy, and generate a simple project risk checklist.',
    grantLink: 'Enforces IE LEO 3-Quote Rules & UK CapEx Rules',
    icon: Briefcase,
    badge: 'Full Pass',
    badgeVariant: 'secondary',
  },
  {
    code: 'MOD_F_COFOUNDER_TEAM',
    short: 'Module F',
    title: 'Co-Founder Alignment & Team Plan',
    plainDesc:
      'Answer 12 awkward co-founder questions privately before comparing side-by-side, map roles, and plan 3-year hiring.',
    grantLink: 'Includes UK Start Up Loans Survival Budget & Job Plan',
    icon: Users,
    badge: 'Flagship Tool',
    badgeVariant: 'default',
  },
  {
    code: 'MOD_G_LAUNCHPAD',
    short: 'Module G',
    title: 'Getting Set Up (Launchpad & Operations)',
    plainDesc:
      'Track your 0–100% Operations Readiness Score across 6 setup cards: Legal Entity (CRO / Companies House), live .ie/.co.uk/.com Domain & @company Email check, Business Banking, Bookkeeping/VAT/Payroll, Startup Insurance, and Legal/GDPR.',
    grantLink: 'Unlocks Incorporation, Bank Bounties & Partner Perks',
    icon: ShieldCheck,
    badge: 'Full Pass',
    badgeVariant: 'secondary',
  },
  {
    code: 'MOD_H_REVENUE',
    short: 'Module H',
    title: 'Pricing & "Pocket Profit" Per Sale',
    plainDesc:
      'Set your price and see exactly how much cash stays in your pocket on a single sale after fees and delivery costs.',
    grantLink: 'Writes Clear Sales Assumptions for Assessors',
    icon: DollarSign,
    badge: 'Full Pass',
    badgeVariant: 'secondary',
  },
  {
    code: 'MOD_I_MARKETING',
    short: 'Module I',
    title: 'Getting Your First 10 Customers',
    plainDesc:
      'Turn your early waitlist leads into paying customers with a practical outreach playbook and realistic marketing budget.',
    grantLink: 'Proves a Credible Route-to-Market',
    icon: Megaphone,
    badge: 'Full Pass',
    badgeVariant: 'secondary',
  },
  {
    code: 'MOD_J_FINANCE',
    short: 'Module J',
    title: 'No-Spreadsheet 3-Year Financial Builder',
    plainDesc:
      'Answer guided questions to generate 3-year cashflow projections, localized tax/PRSI/NIC overheads, and your exact funding gap.',
    grantLink: 'Auto-Builds 36-Month Cashflow & Funding Need',
    icon: Scale,
    badge: 'Full Pass',
    badgeVariant: 'secondary',
  },
  {
    code: 'MOD_K_GRANTS_FUNDING',
    short: 'Module K',
    title: 'Grant, Loan & Investor Tax Relief Matcher',
    plainDesc:
      'See every Ireland & UK grant, loan, or tax scheme you match with, score your readiness, and plan around reimbursement delays.',
    grantLink: 'Matches LEO, EI, SURE, Innovate UK, SUL & SEIS',
    icon: Landmark,
    badge: 'Flagship Tool',
    badgeVariant: 'default',
  },
  {
    code: 'MOD_L_BUSINESS_PLAN',
    short: 'Module L',
    title: '1-Click Grant & Business Plan Compiler',
    plainDesc:
      'Compile your answers into official agency formats or a clean Business Plan—checked by AI for contradictions before you send.',
    grantLink: '5 Export Modes (IE LEO, Innovate UK, SUL, SEIS, Standard)',
    icon: FileText,
    badge: '5-Mode Export',
    badgeVariant: 'warning',
  },
];

const JURISDICTION_OPTIONS = [
  { code: 'IE', label: '🇮🇪 Ireland (LEO / EI / SURE)' },
  { code: 'GB', label: '🇬🇧 UK (Innovate UK / SEIS / SUL)' },
  { code: 'EU', label: '🇪🇺 European Union' },
  { code: 'US', label: '🇺🇸 United States' },
  { code: 'AU_CA', label: '🇦🇺 🇨🇦 Australia / Canada' },
  { code: 'OTHER', label: '🌍 Other Region' },
] as const;

export default function LandingPage() {
  const [showAllModules, setShowAllModules] = useState(false);

  // Early-Access Waitlist Interactive State
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [selectedJurisdiction, setSelectedJurisdiction] =
    useState<string>('IE');
  const [otherJurisdictionText, setOtherJurisdictionText] = useState('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [isSubmittingWaitlist, setIsSubmittingWaitlist] = useState(false);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);

  useEffect(() => {
    clearActiveBmuSession();
  }, []);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = waitlistEmail.trim().toLowerCase();
    if (!cleanEmail) return;

    setIsSubmittingWaitlist(true);
    setWaitlistError(null);

    try {
      const res = await submitEarlyAccessWaitlistAction({
        email: cleanEmail,
        jurisdictionCode: selectedJurisdiction,
        customJurisdictionText:
          selectedJurisdiction === 'OTHER' ? otherJurisdictionText : undefined,
      });

      if (!res.ok) {
        setWaitlistError(res.error || 'Could not register email.');
        return;
      }

      if (res.lead && typeof window !== 'undefined') {
        try {
          const raw = window.localStorage.getItem(
            'bmu_early_access_waitlist_v1'
          );
          const existing: EarlyAccessLeadRecord[] = raw ? JSON.parse(raw) : [];
          const filtered = existing.filter(
            (item) => item.email.toLowerCase() !== res.lead!.email.toLowerCase()
          );
          filtered.unshift(res.lead);
          window.localStorage.setItem(
            'bmu_early_access_waitlist_v1',
            JSON.stringify(filtered)
          );
        } catch {
          // ignore localStorage quota errors
        }
      }

      setWaitlistSubmitted(true);
    } finally {
      setIsSubmittingWaitlist(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      {/* Early Access Public Beta Top Banner */}
      <div className="border-b border-indigo-200/80 bg-indigo-50/80 px-4 py-2 text-center">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-2 text-xs text-slate-800">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/15 px-2.5 py-0.5 font-bold text-indigo-950 ring-1 ring-indigo-500/30">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            EARLY ACCESS • PUBLIC BETA
          </span>
          <span className="font-medium text-slate-700">
            Startup Preflight is in active Early-Access Beta. Join the priority
            founder list below or sign in to your workspace.
          </span>
        </div>
      </div>

      {/* Simplified, Clean Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-slate-900">
                  Startup Preflight
                </span>
                <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-indigo-700 uppercase ring-1 ring-indigo-200">
                  Early Access
                </span>
              </div>
              <p className="hidden text-xs text-slate-500 sm:block">
                Your Supportive AI Co-Founder &amp; Grant Readiness Builder
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-6 text-xs font-medium text-slate-600 md:flex">
            <a
              href="#grant-opportunity"
              className="transition hover:text-indigo-600"
            >
              Grants You Could Unlock
            </a>
            <a
              href="#how-it-works"
              className="transition hover:text-indigo-600"
            >
              How It Works (3 Steps)
            </a>
            <Link
              href="/about-founder"
              className="transition hover:text-indigo-600"
            >
              Meet the Founder
            </Link>
            <a
              href="#early-access"
              className="transition hover:text-indigo-600"
            >
              Early Access
            </a>
          </div>

          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              onClick={() => {
                clearActiveBmuSession();
                logoutFounderAction().catch(() => {});
              }}
            >
              <Button
                size="sm"
                className="h-8 bg-indigo-600 px-3 text-xs text-white hover:bg-indigo-700"
              >
                <LogIn className="h-3.5 w-3.5" />
                Sign In
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* SECTION 1: Friendly, Grant-Motivated Hero */}
        <section
          id="early-access"
          className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-white via-indigo-50/30 to-slate-50 px-4 py-12 sm:px-6 lg:py-16"
        >
          <div className="mx-auto max-w-4xl text-center">
            {/* Single Clean Early-Access Status Badge */}
            <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1 text-xs font-semibold text-indigo-950 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-600" />
              </span>
              Early-Access Public Beta • Priority Onboarding Open
            </div>

            <h1 className="mx-auto mt-5 max-w-3xl text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:leading-[1.14]">
              Shape your startup idea.{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Unlock the grants you qualify for.
              </span>
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Every year, early founders leave{' '}
              <strong className="font-semibold text-slate-900">
                €2,500 to €50,000+ in government grants and startup funding
              </strong>{' '}
              on the table simply because business plans and spreadsheets look
              too intimidating. Tell us your idea in plain English—we help you
              stress-test it and generate the exact plan &amp; proof grant
              officers ask for.
            </p>

            {/* The "No-Brainer" Value Callout */}
            <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-2 text-xs font-medium text-emerald-900 sm:text-sm">
              <Lightbulb className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>
                <strong>Why wouldn&apos;t you check?</strong> Step 1 is{' '}
                <strong className="underline">100% Free Forever</strong> at
                launch and tells you in 10 minutes which grants fit your idea.
              </span>
            </div>

            {/* Waitlist & Early Access Card */}
            <div className="mx-auto mt-7 max-w-xl rounded-2xl border border-indigo-200/80 bg-white p-5 text-left shadow-md sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-indigo-600" />
                  <span className="text-xs font-bold tracking-wide text-indigo-950 uppercase">
                    Get Early Launch Access
                  </span>
                </div>
                <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-800">
                  Public Beta Priority
                </span>
              </div>

              {waitlistSubmitted ? (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-center">
                  <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white">
                    <Check className="h-5 w-5" />
                  </div>
                  <h3 className="mt-2 text-sm font-bold text-emerald-950">
                    You&apos;re on the Early-Access List!
                  </h3>
                  <p className="mt-1 text-xs text-emerald-800">
                    We&apos;ve registered{' '}
                    <span className="font-semibold">{waitlistEmail}</span> for
                    priority launch access (
                    {selectedJurisdiction === 'OTHER' &&
                    otherJurisdictionText.trim()
                      ? otherJurisdictionText.trim()
                      : selectedJurisdiction}
                    ).
                  </p>
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setWaitlistSubmitted(false);
                        setWaitlistEmail('');
                      }}
                      className="text-xs"
                    >
                      Add Another Email
                    </Button>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleWaitlistSubmit}
                  className="mt-3 space-y-3.5"
                >
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      Where are you based? (So we match your local grants &amp;
                      tax rules)
                    </label>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {JURISDICTION_OPTIONS.map((opt) => {
                        const active = selectedJurisdiction === opt.code;
                        return (
                          <button
                            key={opt.code}
                            type="button"
                            onClick={() => setSelectedJurisdiction(opt.code)}
                            className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                              active
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-800 shadow-2xs'
                                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>

                    {selectedJurisdiction === 'OTHER' && (
                      <div className="mt-2">
                        <input
                          type="text"
                          value={otherJurisdictionText}
                          onChange={(e) =>
                            setOtherJurisdictionText(e.target.value)
                          }
                          placeholder="Specify your country or startup hub (e.g., Singapore, Germany, UAE)..."
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-hidden sm:text-xs"
                        />
                      </div>
                    )}
                  </div>

                  {waitlistError && (
                    <p className="text-xs font-medium text-rose-600">
                      {waitlistError}
                    </p>
                  )}

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="email"
                      required
                      disabled={isSubmittingWaitlist}
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      placeholder="Enter your email for early launch access..."
                      className="flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-hidden sm:text-sm"
                    />
                    <Button
                      type="submit"
                      size="lg"
                      disabled={isSubmittingWaitlist}
                      className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-white shadow-sm hover:from-indigo-700 hover:to-violet-700 sm:w-auto"
                    >
                      {isSubmittingWaitlist
                        ? 'Saving...'
                        : 'Join Early Access'}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* SECTION 2: "Don't Leave Grant Money on the Table" Strip */}
        <section
          id="grant-opportunity"
          className="border-b border-slate-200 bg-white py-14"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                <Coins className="h-3.5 w-3.5 text-emerald-600" />
                Non-Dilutive Grants, Loans &amp; Tax Relief
              </div>
              <h2 className="mt-2.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Funding exists for your idea—if you hand in what assessors ask
                for
              </h2>
              <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600">
                Grant boards don&apos;t reject founders because their idea is
                bad; they reject vague applications with missing customer proof
                or guesswork numbers. Startup Preflight prepares you for:
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Ireland Card */}
              <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/40 to-white p-6 shadow-2xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-base font-bold text-slate-900">
                    🇮🇪 Building in Ireland?
                  </span>
                  <Badge variant="success">LEO • Enterprise Ireland • Revenue</Badge>
                </div>
                <ul className="mt-4 space-y-2.5 text-xs text-slate-700 sm:text-sm">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>
                      <strong>LEO Feasibility &amp; Priming Grants:</strong>{' '}
                      €15,000 to €80,000+ towards market research, prototypes,
                      and first salaries.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>
                      <strong>Digital &amp; AI Vouchers:</strong> Up to €5,000
                      support from your Local Enterprise Office or Enterprise
                      Ireland.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>
                      <strong>New Frontiers &amp; SURE Tax Refund:</strong>{' '}
                      €30,000 tax-free founder stipend + reclaim up to 41% of
                      past PAYE tax when starting your company.
                    </span>
                  </li>
                </ul>
              </div>

              {/* UK Card */}
              <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-b from-indigo-50/40 to-white p-6 shadow-2xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-base font-bold text-slate-900">
                    🇬🇧 Building in the UK?
                  </span>
                  <Badge variant="default">Innovate UK • BBB • HMRC</Badge>
                </div>
                <ul className="mt-4 space-y-2.5 text-xs text-slate-700 sm:text-sm">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                    <span>
                      <strong>British Business Bank Start Up Loans:</strong> Up
                      to £25,000 per co-founder (with built-in Personal Survival
                      Budget templates).
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                    <span>
                      <strong>Innovate UK Smart &amp; Feasibility Grants:</strong>{' '}
                      Non-dilutive R&amp;D funding structured into the official
                      9-Question format.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                    <span>
                      <strong>HMRC SEIS / EIS Advance Assurance:</strong> Unlock
                      up to 50% tax relief for your first angel investors so
                      raising money is 2x easier.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: Simple 3-Step Journey (Instead of 11 overwhelming cards) */}
        <section id="how-it-works" className="bg-slate-50 py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              <Badge variant="secondary">Simple 3-Step Flow • Zero Jargon</Badge>
              <h2 className="mt-2.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                How Startup Preflight takes you from raw idea to grant-ready
              </h2>
              <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600">
                No 20-minute lecture videos and no scary blank spreadsheets. We
                guide you one simple question at a time.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Step 1 */}
              <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
                      1
                    </span>
                    <Badge variant="success">100% Free Forever</Badge>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-slate-900">
                    Brain-Dump Your Idea &amp; Check Grant Fit
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Explain your idea in everyday language. Our supportive AI
                    Co-Founder structures your 1-Page Concept Canvas, gently
                    flags blind spots to think about, and checks which grant
                    sectors you match with.
                  </p>
                </div>
                <div className="mt-5 rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-700">
                  ⏱ Takes ~10 mins • No business background needed
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-sm font-bold text-white">
                      2
                    </span>
                    <Badge variant="default">Guided Evidence Builder</Badge>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-slate-900">
                    Gather Real Customer Proof &amp; Simple Numbers
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Grant officers want proof people will buy. Launch a 1-click
                    public customer survey &amp; waitlist link, align with your
                    co-founder, and answer plain-English questions to build a
                    3-year financial plan without touching Excel.
                  </p>
                </div>
                <div className="mt-5 rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-700">
                  ✓ Includes 1-click Survey Link + No-Spreadsheet Finance
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
                      3
                    </span>
                    <Badge variant="warning">5 Official Export Modes</Badge>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-slate-900">
                    Export Your Grant Pack or Business Plan
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Compile everything into an official{' '}
                    <strong>
                      Ireland LEO Application, UK Innovate UK 9-Question pack,
                      UK Start Up Loans workbook, HMRC SEIS pack, or Standard
                      Business Plan
                    </strong>
                    —pre-audited by AI so your numbers and story never
                    contradict.
                  </p>
                </div>
                <div className="mt-5 rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-700">
                  ✓ Catches application mistakes before assessors do
                </div>
              </div>
            </div>

            {/* Optional Expandable Drawer for the Full 12 Modules */}
            <div className="mt-10 text-center">
              <button
                type="button"
                onClick={() => setShowAllModules((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-indigo-300 hover:text-indigo-700 sm:text-sm"
              >
                {showAllModules ? (
                  <>
                    Hide the 12 under-the-hood modules (A–L)
                    <ChevronUp className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Curious what happens under the hood? See all 12 guided
                    modules (A–L)
                    <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </button>

              {showAllModules && (
                <div className="mt-6 grid grid-cols-1 gap-3.5 text-left md:grid-cols-2 lg:grid-cols-3">
                  {MODULES_PREVIEW.map((m) => {
                    const Icon = m.icon;
                    return (
                      <div
                        key={m.code}
                        className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-2xs"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                <Icon className="h-4 w-4" />
                              </div>
                              <span className="text-xs font-bold text-indigo-700">
                                {m.short}
                              </span>
                            </div>
                            <Badge variant={m.badgeVariant}>{m.badge}</Badge>
                          </div>
                          <h4 className="mt-2.5 text-sm font-bold text-slate-900">
                            {m.title}
                          </h4>
                          <p className="mt-1 text-xs leading-relaxed text-slate-600">
                            {m.plainDesc}
                          </p>
                        </div>

                        <div className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-2.5 text-[11px] font-semibold text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                          <span>{m.grantLink}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer with Company, Legal & Contact Metadata */}
      <footer className="border-t border-slate-200 bg-slate-900 text-slate-400">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
                  <Sparkles className="h-4 w-4" />
                </div>
                <span className="text-sm font-bold text-white">
                  Startup Preflight
                </span>
                <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-300 ring-1 ring-indigo-400/30">
                  Early Access • Public Beta
                </span>
              </div>
              <p className="mt-2 max-w-xl text-xs text-slate-400">
                The Supportive AI Co-Founder &amp; Grant Readiness Builder for
                early-stage founders, university incubators, Ireland Local
                Enterprise Offices (LEOs), and UK Growth Hubs.
              </p>
            </div>

            <div className="flex flex-col gap-2 text-xs sm:items-end">
              <div className="flex flex-wrap items-center gap-4">
                <Link href="/about-founder" className="hover:text-white">
                  Meet the Founder
                </Link>
                <Link href="/privacy" className="hover:text-white">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="hover:text-white">
                  Terms of Service
                </Link>
                <a
                  href="https://www.linkedin.com/in/twalsh-start-ups/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  LinkedIn
                </a>
                <a
                  href="mailto:hello@startuppreflight.com"
                  className="hover:text-white"
                >
                  Contact
                </a>
                <Link href="/login" className="hover:text-white">
                  Sign In
                </Link>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                <span>Founding Date: 2026</span>
                <span>•</span>
                <span>Dublin, Ireland</span>
                <span>•</span>
                <a
                  href="mailto:hello@startuppreflight.com"
                  className="hover:text-slate-400"
                >
                  hello@startuppreflight.com
                </a>
                <span>•</span>
                <span>© {new Date().getFullYear()} Startup Preflight</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
