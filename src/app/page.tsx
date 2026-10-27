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
  Globe2,
  Ticket,
  ShieldCheck,
  Bot,
  LogIn,
  UserPlus,
  Wrench,
  Users,
  Landmark,
  Construction,
  Clock,
  Layers,
  Check,
  Terminal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { loadBmuSession, type BmuLocalSession } from '@/lib/auth/session-store';
import {
  submitEarlyAccessWaitlistAction,
  type EarlyAccessLeadRecord,
} from '@/app/actions/admin';

type ModulePhase = 'VALIDATE' | 'BUILD_TEAM' | 'COMMERCIALIZE_FUND';

interface ModulePreviewItem {
  code: string;
  short: string;
  title: string;
  desc: string;
  highlights: string[];
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
  badgeVariant: 'success' | 'default' | 'secondary' | 'warning';
  phase: ModulePhase;
}

const MODULES_PREVIEW: ModulePreviewItem[] = [
  {
    code: 'MOD_A_IDEATION',
    short: 'Module A',
    title: 'Ideation & 1-Page Concept Canvas',
    desc: 'Founder motivations, raw brain dump, 1-Page Concept Canvas, Customer Storyboard, Localization & Grant Sector Pre-Check, and Founder-Idea Fit Scorecard.',
    highlights: [
      'Capture First, Expand Second flow',
      'Grant Eligibility & Sector Pre-Check',
      'Founder-Idea Fit Scorecard',
    ],
    icon: Compass,
    badge: 'Free Forever Hook',
    badgeVariant: 'success',
    phase: 'VALIDATE',
  },
  {
    code: 'MOD_B_MARKET',
    short: 'Module B',
    title: 'Market & Competitive Intelligence',
    desc: 'Beachhead customer persona, AI Competitor Scout, SWOT, State-of-the-Art analysis, plain-English TAM/SAM/SOM sizing, and Export/Non-Displacement check.',
    highlights: [
      'AI Competitor & State-of-the-Art Scout',
      'Bottom-up TAM / SAM / SOM builder',
      'IE/UK Export & Non-Displacement proof',
    ],
    icon: BarChart3,
    badge: 'Full Pass',
    badgeVariant: 'secondary',
    phase: 'VALIDATE',
  },
  {
    code: 'MOD_C_SURVEYS_FEEDBACK',
    short: 'Module C',
    title: 'Customer Surveys, Feedback & Waitlist Engine',
    desc: 'AI "Mom Test" bias-free survey builder, hosted public validation & waitlist page (/v/[slug]), outreach QR kit, 1-on-1 interview logger, and AI sentiment synthesizer.',
    highlights: [
      'Public /v/[slug] Survey & Waitlist Page',
      'Bias-Free "Mom Test" Question Generator',
      '1-on-1 Interview Logger & AI Synthesis',
    ],
    icon: MessageSquare,
    badge: 'Flagship Standalone #1',
    badgeVariant: 'default',
    phase: 'VALIDATE',
  },
  {
    code: 'MOD_D_PRODUCT_BUILD',
    short: 'Module D',
    title: 'What Are We Building? (Product & Build)',
    desc: 'Product vehicle selector, Own vs. Rent channel matrix (Amazon/App Store vs. Shopify/Web), 3-Tier Build-vs-Buy recommender, ruthless V1 filter & Work Packages (WP1..n).',
    highlights: [
      'Own vs. Rent Channel Economics',
      'Ruthless V1 Feature / SKU Filter',
      'Grant-Ready Work Packages (WP1..n)',
    ],
    icon: Wrench,
    badge: 'Full Pass',
    badgeVariant: 'secondary',
    phase: 'BUILD_TEAM',
  },
  {
    code: 'MOD_E_OPERATIONS',
    short: 'Module E',
    title: 'Operations, CapEx Rules & Risk Register',
    desc: 'Day in the Life of an Order, Premises & Equipment schedule enforcing IE LEO 3-quote/laptop rules & UK Innovate UK depreciation, plus 4-Category Project Risk Register.',
    highlights: [
      'IE LEO 3-Quote & Laptop Ban Guardrails',
      'UK Innovate UK Capital Usage Depreciation',
      '4-Category Formal Risk Register',
    ],
    icon: Briefcase,
    badge: 'Full Pass',
    badgeVariant: 'secondary',
    phase: 'BUILD_TEAM',
  },
  {
    code: 'MOD_F_COFOUNDER_TEAM',
    short: 'Module F',
    title: 'Co-Founder Alignment & 7 Startup Hats',
    desc: 'Promoter 150-word profiles, UK Start Up Loans Personal Survival Budget, "7 Startup Hats" role matrix, Blind-Reveal 12 Awkward Questions survey, and 3-Year Job Creation plan.',
    highlights: [
      'Blind-Reveal "12 Awkward Questions" Engine',
      'Side-by-Side Co-Founder Alignment Heatmap',
      'UK Start Up Loans Personal Survival Budget',
    ],
    icon: Users,
    badge: 'Flagship Standalone #2',
    badgeVariant: 'default',
    phase: 'BUILD_TEAM',
  },
  {
    code: 'MOD_G_REVENUE',
    short: 'Module G',
    title: 'Pricing Architect & "Pocket Profit" Unit Economics',
    desc: 'Design your pricing model, document written sales assumptions, and calculate exact single-sale Pocket Profit (auto-pulling COGS from Module D & WTP from Module C).',
    highlights: [
      'Single-Sale "Pocket Profit" Waterfall',
      'Auto-links Module C WTP & Module D Fees',
      'Written Grant-Ready Sales Assumptions',
    ],
    icon: DollarSign,
    badge: 'Full Pass',
    badgeVariant: 'secondary',
    phase: 'COMMERCIALIZE_FUND',
  },
  {
    code: 'MOD_H_MARKETING',
    short: 'Module H',
    title: 'Marketing, 4Ps & First 10 Customers Playbook',
    desc: 'Brand positioning, 4Ps strategy & digital presence, First 10 Customers execution playbook (converting Module C waitlist leads), and reverse-engineered marketing budget.',
    highlights: [
      'First 10 Customers Tactical Playbook',
      'Waitlist Lead Conversion Workflow',
      'Reverse-Engineered CAC & Funnel Budget',
    ],
    icon: Megaphone,
    badge: 'Full Pass',
    badgeVariant: 'secondary',
    phase: 'COMMERCIALIZE_FUND',
  },
  {
    code: 'MOD_I_FINANCE',
    short: 'Module I',
    title: 'No-Spreadsheet 36-Month Finance & Cashflow Trough',
    desc: 'Guided 3-year financial builder with sensitivity analysis, localized overheads (IE PRSI/VAT vs. UK NIC/Pension/VAT), 36-month cashflow trough, and IP/Corporate checklist.',
    highlights: [
      'Localized IE (PRSI/VAT) & UK (NIC/VAT) Rules',
      '36-Month Cashflow Trough & Funding Gap',
      'Best / Base / Downside Sensitivity Toggle',
    ],
    icon: Scale,
    badge: 'Full Pass',
    badgeVariant: 'secondary',
    phase: 'COMMERCIALIZE_FUND',
  },
  {
    code: 'MOD_J_GRANTS_FUNDING',
    short: 'Module J',
    title: 'Non-Dilutive Grants, Loans & Tax Relief Hub',
    desc: 'Automated matcher & readiness scorer for Ireland (LEO Feasibility/Priming, EI, SURE, R&D Tax Credit, EII) and UK (Start Up Loans, Innovate UK, SEIS/EIS) + Reimbursement Bridge.',
    highlights: [
      'Ireland LEO, Enterprise Ireland, SURE & EII',
      'UK Start Up Loans, Innovate UK & SEIS/EIS',
      'Grant Reimbursement Cashflow Timing Bridge',
    ],
    icon: Landmark,
    badge: 'Flagship Standalone #3',
    badgeVariant: 'default',
    phase: 'COMMERCIALIZE_FUND',
  },
  {
    code: 'MOD_K_BUSINESS_PLAN',
    short: 'Module K',
    title: '5-Mode Official Grant & Business Plan Compiler',
    desc: 'Compiles live plan data into IE LEO Official Form (Appendices A–F), UK Innovate UK 9-Question IFS, UK Start Up Loans Workbook, HMRC SEIS/EIS Pack, or Standard Plan + Gemini 2.5 Pro Audit.',
    highlights: [
      '5 Official Export & Dossier Modes',
      'Live Financial & Survey Proof Blocks',
      'Gemini 2.5 Pro Contradiction & Grant Audit',
    ],
    icon: FileText,
    badge: '5-Mode Compiler',
    badgeVariant: 'warning',
    phase: 'COMMERCIALIZE_FUND',
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
  const [session, setSession] = useState<BmuLocalSession | null>(null);
  const [activePhase, setActivePhase] = useState<'ALL' | ModulePhase>('ALL');

  // Early-Access Waitlist Interactive State
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [selectedJurisdiction, setSelectedJurisdiction] =
    useState<string>('IE');
  const [otherJurisdictionText, setOtherJurisdictionText] = useState('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [isSubmittingWaitlist, setIsSubmittingWaitlist] = useState(false);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);

  useEffect(() => {
    setSession(loadBmuSession());
  }, []);

  const filteredModules =
    activePhase === 'ALL'
      ? MODULES_PREVIEW
      : MODULES_PREVIEW.filter((m) => m.phase === activePhase);

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
      {/* Top Sticky "Coming Soon / Under Active Development" Status Banner */}
      <div className="border-b border-amber-200/80 bg-gradient-to-r from-amber-50 via-indigo-50 to-amber-50 px-4 py-2 text-center">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-2 text-xs text-slate-800">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-0.5 font-bold text-amber-900 ring-1 ring-amber-500/30">
            <Construction className="h-3.5 w-3.5 text-amber-700" />
            COMING SOON • UNDER ACTIVE DEVELOPMENT
          </span>
          <span className="font-medium text-slate-700">
            Build My Unicorn 2.0 is currently in active development &amp;
            private testing. Join the early-access list below or use your
            sandbox credentials.
          </span>
        </div>
      </div>

      {/* Navigation Bar with Subtle Beta / Dev Access Controls */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-slate-900">
                  Build My Unicorn
                </span>
                <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-amber-800 uppercase">
                  Coming Soon
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Supportive AI Co-Founder &amp; Blind-Spot Engine
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-6 text-xs font-medium text-slate-600 lg:flex">
            <a
              href="#flagship-pillars"
              className="transition hover:text-indigo-600"
            >
              3 Flagship Pillars
            </a>
            <a
              href="#eleven-modules"
              className="transition hover:text-indigo-600"
            >
              11-Module Architecture (A–K)
            </a>
            <a
              href="#early-access"
              className="transition hover:text-indigo-600"
            >
              Early-Access Waitlist
            </a>
          </div>

          {/* Subtle Beta / Dev Access Controls for easy testing */}
          <nav className="flex flex-wrap items-center gap-2">
            <span className="hidden items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-500 sm:inline-flex">
              <Terminal className="h-3 w-3 text-slate-400" />
              Beta / Dev Access:
            </span>

            {session ? (
              <Link href="/workspace">
                <Button
                  size="sm"
                  className="bg-indigo-600 text-xs text-white hover:bg-indigo-700"
                >
                  Open Dev Workspace
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/redeem">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2.5 text-xs text-slate-600"
                  >
                    <Ticket className="h-3.5 w-3.5 text-amber-600" />
                    <span className="hidden sm:inline">Redeem Code</span>
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 border-slate-200 px-3 text-xs text-slate-700"
                  >
                    <LogIn className="h-3.5 w-3.5 text-slate-500" />
                    Dev Log In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 bg-slate-900 px-3 text-xs text-white hover:bg-slate-800"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Preview</span> Sandbox
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section
          id="early-access"
          className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-white via-indigo-50/30 to-slate-50 px-4 py-14 sm:px-6 lg:py-20"
        >
          <div className="mx-auto max-w-6xl text-center">
            {/* Status Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3.5 py-1 text-xs font-bold text-amber-900 shadow-2xs">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-600" />
                </span>
                Platform Coming Soon • Under Active Development
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3.5 py-1 text-xs font-semibold text-indigo-700 shadow-2xs">
                <Bot className="h-3.5 w-3.5 text-indigo-600" />
                No 20-Minute Videos • Capture First, Expand Second
              </div>
            </div>

            <h1 className="mx-auto mt-6 max-w-4xl text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-[54px] lg:leading-[1.12]">
              Turn your raw startup idea into a{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                validated, grant- &amp; investor-ready business plan
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-lg">
              Most founders stall on blank spreadsheets, biased customer chats,
              or generic AI wrappers. Build My Unicorn guides you through{' '}
              <strong className="font-semibold text-slate-800">
                11 structured founder modules (A–K)
              </strong>
              —uncovering blind spots, validating demand with real buyers,
              aligning co-founders, and compiling official{' '}
              <strong className="font-semibold text-slate-800">
                Ireland (LEO / EI / SURE) &amp; UK (Innovate UK / Start Up Loans
                / SEIS)
              </strong>{' '}
              dossiers.
            </p>

            {/* Early-Access Waitlist Card (Hero Primary Focus) */}
            <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-indigo-200/80 bg-white p-5 text-left shadow-md sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-indigo-600" />
                  <span className="text-xs font-bold tracking-wide text-indigo-950 uppercase">
                    Early-Access Founder Waitlist
                  </span>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                  Module A will be 100% Free Forever at Launch
                </span>
              </div>

              {waitlistSubmitted ? (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-center">
                  <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white">
                    <Check className="h-5 w-5" />
                  </div>
                  <h3 className="mt-2 text-sm font-bold text-emerald-950">
                    You&apos;re on the Build My Unicorn 2.0 Early-Access List!
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
                      Add Another Founder
                    </Button>
                    <Link href="/register">
                      <Button
                        size="sm"
                        className="bg-indigo-600 text-xs text-white hover:bg-indigo-700"
                      >
                        Try the Development Preview Sandbox Now
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleWaitlistSubmit} className="mt-3 space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      Where are you building your startup? (Tailors Grant &amp;
                      Tax Rules)
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
                      placeholder="Enter your founder email for early launch access..."
                      className="flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-hidden sm:text-sm"
                    />
                    <Button
                      type="submit"
                      size="lg"
                      disabled={isSubmittingWaitlist}
                      className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 px-6 text-white shadow-sm hover:from-indigo-700 hover:to-violet-700 sm:w-auto"
                    >
                      {isSubmittingWaitlist
                        ? 'Saving...'
                        : 'Notify Me When Live'}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              )}

              {/* Subtle Sandbox / Tester Access Bar inside the card */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <span>
                  Testing the build or holding an institutional cohort/AppSumo
                  code?
                </span>
                <div className="flex items-center gap-3 font-semibold text-indigo-600">
                  <Link href="/register" className="hover:underline">
                    Enter Dev Sandbox →
                  </Link>
                  <span className="text-slate-300">•</span>
                  <Link href="/login" className="hover:underline">
                    Sign In
                  </Link>
                  <span className="text-slate-300">•</span>
                  <Link href="/redeem" className="hover:underline">
                    Redeem Code
                  </Link>
                </div>
              </div>
            </div>

            {/* 3 Core Philosophy Highlights */}
            <div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-4 text-left sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Capture First, Expand Second
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                  Never criticized upfront. Extract your raw vision cleanly
                  first, then let our constructive{' '}
                  <strong>&ldquo;Things to Consider&rdquo;</strong> Blind-Spot
                  Engine surface hidden risks at the end of each module.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <Globe2 className="h-4 w-4 text-indigo-600" />
                  Localized IE &amp; UK Grant &amp; Tax Rules
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                  Built-in IE PRSI/VAT &amp; LEO 3-quote rules, UK NIC/Pension,
                  Start Up Loans Survival Budget, Innovate UK 9-Question IFS,
                  and HMRC SEIS/EIS compliance checks.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <ShieldCheck className="h-4 w-4 text-violet-600" />
                  4-Layer Built-In Founder Support
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                  Every step includes <em>&ldquo;Why We Ask This&rdquo;</em>{' '}
                  micro-coaching, industry examples, the context-aware{' '}
                  <strong>Ask Unicorn AI</strong> sidekick, and an{' '}
                  <strong>Open Questions Parking Lot</strong>.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3 Flagship Standalone Pillars Spotlight */}
        <section
          id="flagship-pillars"
          className="border-b border-slate-200 bg-white py-16"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center">
              <Badge variant="default">3 Flagship Engines Inside BMU 2.0</Badge>
              <h2 className="mt-2.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Built to solve the 3 biggest reasons early startups fail
              </h2>
              <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600">
                Beyond standard business planning, Build My Unicorn includes
                three deep standalone engines currently in final development.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Flagship #1 */}
              <div className="flex flex-col justify-between rounded-2xl border border-indigo-100 bg-gradient-to-b from-indigo-50/50 to-white p-6 shadow-2xs">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-bold text-white">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Flagship #1 • Module C
                    </span>
                    <span className="text-[11px] font-semibold text-indigo-700">
                      Customer Validation
                    </span>
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-slate-900">
                    Mom-Test Survey, Feedback &amp; Waitlist Engine
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    Stop asking friends if they &ldquo;like your idea.&rdquo;
                    Generate bias-free Mom Test surveys and publish a hosted
                    validation &amp; early waitlist page in one click.
                  </p>

                  <ul className="mt-4 space-y-2 text-xs text-slate-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>
                        <strong>Hosted Public Link (`/v/[slug]`):</strong>{' '}
                        Mobile-ready validation survey + early adopter waitlist
                        capture with QR code kit.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>
                        <strong>1-on-1 Interview Logger &amp; AI Synthesis:</strong>{' '}
                        Extracts willingness-to-pay (WTP) and feeds real proof
                        blocks directly into your pricing and grant application.
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 rounded-xl border border-indigo-100 bg-white p-3 text-[11px] text-slate-500">
                  <strong className="text-slate-800">Auto-wired to:</strong>{' '}
                  Module G Unit Economics (WTP) &amp; Module K Evidence Appendix
                </div>
              </div>

              {/* Flagship #2 */}
              <div className="flex flex-col justify-between rounded-2xl border border-violet-100 bg-gradient-to-b from-violet-50/50 to-white p-6 shadow-2xs">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-2.5 py-1 text-xs font-bold text-white">
                      <Users className="h-3.5 w-3.5" />
                      Flagship #2 • Module F
                    </span>
                    <span className="text-[11px] font-semibold text-violet-700">
                      Co-Founder &amp; Team
                    </span>
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-slate-900">
                    Blind-Reveal Co-Founder Alignment (&ldquo;12 Awkward
                    Questions&rdquo;)
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    Surface unspoken expectations before signing a shareholders
                    agreement, map your team&apos;s 7 Startup Hats, and prove
                    promoter survival affordability.
                  </p>

                  <ul className="mt-4 space-y-2 text-xs text-slate-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>
                        <strong>Blind-Reveal Alignment Heatmap:</strong> Each
                        co-founder answers 12 critical questions privately
                        (cash, hours, exit, runway) before unlocking a
                        side-by-side comparison.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>
                        <strong>7 Startup Hats &amp; Survival Budget:</strong>{' '}
                        Includes the official UK Start Up Loans Personal
                        Survival Budget, Equity Split Calculator &amp; 3-Year
                        Hiring Plan.
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 rounded-xl border border-violet-100 bg-white p-3 text-[11px] text-slate-500">
                  <strong className="text-slate-800">Auto-wired to:</strong>{' '}
                  Module I Payroll Overheads &amp; UK Start Up Loans Workbook
                </div>
              </div>

              {/* Flagship #3 */}
              <div className="flex flex-col justify-between rounded-2xl border border-emerald-100 bg-gradient-to-b from-emerald-50/50 to-white p-6 shadow-2xs">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white">
                      <Landmark className="h-3.5 w-3.5" />
                      Flagship #3 • Modules J &amp; K
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700">
                      Grants &amp; Official Compiler
                    </span>
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-slate-900">
                    IE &amp; UK Grant Hub + 5-Mode Official Plan Compiler
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    Match with non-dilutive grants, model reimbursement cashflow
                    timing gaps, and compile official agency-structured outputs
                    audited by Gemini 2.5 Pro.
                  </p>

                  <ul className="mt-4 space-y-2 text-xs text-slate-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>
                        <strong>Ireland &amp; UK Matcher:</strong> LEO
                        Feasibility/Priming, Enterprise Ireland, SURE, EII,
                        British Business Bank Start Up Loans, Innovate UK Smart
                        Grants &amp; HMRC SEIS/EIS.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>
                        <strong>5 Live Compiler Modes + Pre-Flight Audit:</strong>{' '}
                        Catches cross-module contradictions before an assessor
                        or investor ever reads your application.
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 rounded-xl border border-emerald-100 bg-white p-3 text-[11px] text-slate-500">
                  <strong className="text-slate-800">5 Export Modes:</strong> IE
                  LEO • UK Innovate UK • UK Start Up Loans • UK SEIS/EIS •
                  Standard
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Full 11-Module Guided Architecture (Modules A–K) */}
        <section id="eleven-modules" className="bg-slate-50 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex flex-col items-center justify-between gap-4 text-center lg:flex-row lg:text-left">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wide text-indigo-600 uppercase">
                  <Layers className="h-4 w-4" />
                  Complete 11-Module Architecture (A–K)
                </div>
                <h2 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
                  From raw Day-1 brain dump to grant-ready execution
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Every module feeds structured data forward—so your market
                  sizing, survey evidence, COGS, and hiring plan stay 100%
                  synchronized.
                </p>
              </div>

              {/* Phase Filter Tabs */}
              <div className="grid w-full grid-cols-1 gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5 sm:w-auto sm:flex">
                <button
                  type="button"
                  onClick={() => setActivePhase('ALL')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activePhase === 'ALL'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  All 11 Modules (A–K)
                </button>
                <button
                  type="button"
                  onClick={() => setActivePhase('VALIDATE')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activePhase === 'VALIDATE'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  1. Ideate &amp; Validate (A–C)
                </button>
                <button
                  type="button"
                  onClick={() => setActivePhase('BUILD_TEAM')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activePhase === 'BUILD_TEAM'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  2. Build, Ops &amp; Team (D–F)
                </button>
                <button
                  type="button"
                  onClick={() => setActivePhase('COMMERCIALIZE_FUND')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activePhase === 'COMMERCIALIZE_FUND'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  3. Finance, Grants &amp; Plan (G–K)
                </button>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredModules.map((m) => {
                const Icon = m.icon;
                return (
                  <Card
                    key={m.code}
                    className="flex flex-col justify-between border-slate-200 bg-white transition hover:border-indigo-200 hover:shadow-sm"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                          <Icon className="h-5 w-5" />
                        </div>
                        <Badge variant={m.badgeVariant}>{m.badge}</Badge>
                      </div>
                      <CardTitle className="mt-3 text-sm font-bold text-slate-900">
                        {m.short}: {m.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col justify-between space-y-3">
                      <CardDescription className="text-xs leading-relaxed text-slate-600">
                        {m.desc}
                      </CardDescription>

                      <div className="space-y-1 border-t border-slate-100 pt-2.5">
                        {m.highlights.map((item) => (
                          <div
                            key={item}
                            className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-indigo-600" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* Footer with Clear Development Status & Quick Sandbox Links */}
      <footer className="border-t border-slate-200 bg-slate-900 text-slate-400">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
                  <Sparkles className="h-4 w-4" />
                </div>
                <span className="text-sm font-bold text-white">
                  Build My Unicorn 2.0
                </span>
                <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-amber-300 ring-1 ring-amber-400/30">
                  Coming Soon • Under Active Development
                </span>
              </div>
              <p className="mt-2 max-w-xl text-xs text-slate-400">
                The Supportive AI Co-Founder &amp; Blind-Spot Engine for
                founders, university incubators, Ireland Local Enterprise
                Offices (LEOs), and UK Growth Hubs.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs">
              <a href="#early-access" className="hover:text-white">
                Early-Access Waitlist
              </a>
              <Link href="/register" className="hover:text-white">
                Preview Sandbox
              </Link>
              <Link href="/login" className="hover:text-white">
                Dev Sign In
              </Link>
              <Link href="/redeem" className="hover:text-white">
                Redeem Voucher
              </Link>
              <span className="text-slate-600">
                © {new Date().getFullYear()} Build My Unicorn
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
