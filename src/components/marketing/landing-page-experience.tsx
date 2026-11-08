'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Check,
  ChevronDown,
  ChevronUp,
  Coins,
  Lightbulb,
  ShieldCheck,
  Globe2,
  XCircle,
  HelpCircle,
  Ticket,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/ui/brand-logo';
import { Badge } from '@/components/ui/badge';
import { GlobalFeedbackButton } from '@/components/feedback/global-feedback-dialog';
import { clearActiveBmuSession } from '@/lib/auth/session-store';
import { logoutFounderAction } from '@/app/actions/auth';
import { MarketingHeader } from '@/components/marketing/marketing-layout-nav';
import {
  HeroInteractiveProductShowcase,
  BentoFeatureVisualCards,
  type LandingEdition,
} from '@/components/marketing/platform-ui-previews';
import { getFaqsForEdition } from '@/components/marketing/landing-faqs';

interface ModuleCardConfig {
  code: string;
  short: string;
  title: string;
  plainDesc: string;
  outcomeHook: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
  badgeVariant: 'success' | 'default' | 'secondary' | 'warning';
}

function getModulesForEdition(edition: LandingEdition): ModuleCardConfig[] {
  const isGlobal = edition === 'GLOBAL';
  const isIE = edition === 'IE';

  return [
    {
      code: 'MOD_A_IDEATION',
      short: 'Module A',
      title: isGlobal
        ? 'Plain-English Idea Canvas & Blind-Spot Check'
        : 'Plain-English Idea Canvas & Grant Fit Check',
      plainDesc: isGlobal
        ? 'Dump your raw idea in plain English. We turn it into a 1-Page Concept Canvas, gently spot blind spots, check domain availability, and score Founder-Idea Fit.'
        : 'Dump your raw idea in plain English. We turn it into a 1-Page Concept Canvas, gently spot blind spots, and pre-check your sector eligibility for grants.',
      outcomeHook: isGlobal
        ? 'Instant 1-Page Concept Canvas & Fit Scorecard'
        : isIE
          ? 'Instant Ireland LEO & Enterprise Ireland Fit Check'
          : 'Instant UK Start Up Loans, Innovate UK & SEIS Check',
      icon: Compass,
      badge: '100% Free Forever',
      badgeVariant: 'success',
    },
    {
      code: 'MOD_B_MARKET',
      short: 'Module B',
      title: 'Customers, Competitors & Market Size',
      plainDesc:
        'Define your first beachhead buyer, scout real competitors with AI, and calculate realistic market numbers (TAM/SAM/SOM) without confusing acronyms.',
      outcomeHook: isGlobal
        ? 'Clear Competitive Wedge & Defensible Market Sizing'
        : isIE
          ? 'Proves International Export Potential & Non-Displacement'
          : 'Proves Addressable Market & Competitive Edge for Assessors',
      icon: BarChart3,
      badge: 'Full Pass',
      badgeVariant: 'secondary',
    },
    {
      code: 'MOD_C_SURVEYS_FEEDBACK',
      short: 'Module C',
      title: '1-Click Customer Survey & Waitlist Link',
      plainDesc:
        'Generate unbiased "Mom Test" customer questions, share a hosted customer validation & waitlist link with QR code, and log 1-on-1 interviews.',
      outcomeHook: isGlobal
        ? 'Real Customer Demand & Willingness-to-Pay Proof'
        : 'Builds Verified Buyer Proof Grant Assessors Demand',
      icon: MessageSquare,
      badge: 'Flagship Tool',
      badgeVariant: 'default',
    },
    {
      code: 'MOD_D_PRODUCT_BUILD',
      short: 'Module D',
      title: 'What Are We Building? (V1 Product Roadmap)',
      plainDesc:
        'Pick the simplest way to build V1, compare selling channels (Web vs. App Store/Amazon), filter out V1 feature bloat, and map clear milestones.',
      outcomeHook: isGlobal
        ? 'Ruthless V1 Scope & Build-vs-Buy Technical Roadmap'
        : 'Structures Grant Work Packages (WP1–n) & Build Quotes',
      icon: Wrench,
      badge: 'Full Pass',
      badgeVariant: 'secondary',
    },
    {
      code: 'MOD_E_OPERATIONS',
      short: 'Module E',
      title: 'Day-to-Day Operations, Equipment & Risks',
      plainDesc:
        'Map how an order flows from purchase to delivery, list equipment you need to buy, and generate a structured 4-category project risk register.',
      outcomeHook: isGlobal
        ? 'Complete Operational Workflow & Risk Register'
        : isIE
          ? 'Enforces IE LEO 3-Quote Rules & Laptop Ban Compliance'
          : 'Enforces UK Innovate UK Capital Usage & Risk Register Rules',
      icon: Briefcase,
      badge: 'Full Pass',
      badgeVariant: 'secondary',
    },
    {
      code: 'MOD_F_COFOUNDER_TEAM',
      short: 'Module F',
      title: 'Co-Founder Alignment & Team Plan',
      plainDesc:
        'Answer 12 awkward co-founder questions privately before comparing side-by-side, map the 7 Startup Hats, calculate equity, and plan 3-year hiring.',
      outcomeHook: isGlobal
        ? 'Side-by-Side Alignment Heatmap & Equity Calculator'
        : isIE
          ? 'Promoter 150-Word Profiles & 3-Year Job Creation Schedule'
          : 'Includes UK Start Up Loans Personal Survival Budget & Job Plan',
      icon: Users,
      badge: 'Flagship Tool',
      badgeVariant: 'default',
    },
    {
      code: 'MOD_G_LAUNCHPAD',
      short: 'Module G',
      title: 'Getting Set Up (Launchpad & Operations Hub)',
      plainDesc:
        'Track your 0–100% Operations Readiness Score across 6 practical cards: Company Registration, live Domain & @company Email check, Business Banking, Accounting, Insurance, and IP/GDPR.',
      outcomeHook: isGlobal
        ? '6-Step Incorporation, Domain, Banking & Legal Checklist'
        : isIE
          ? 'CRO Registration, .ie Domain, Banking & Tax Clearance Prep'
          : 'Companies House, .co.uk Domain, Banking & Insurance Prep',
      icon: ShieldCheck,
      badge: 'Full Pass',
      badgeVariant: 'secondary',
    },
    {
      code: 'MOD_H_REVENUE',
      short: 'Module H',
      title: 'Pricing & "Pocket Profit" 3-Year Breakeven',
      plainDesc:
        'Set your price, see how much cash stays in your pocket per sale after friction costs, and test Worst-Case vs. Ramen Survival in the What-If Sandbox.',
      outcomeHook: isGlobal
        ? 'Interactive Crossover Graph & What-If Stress-Test Sandbox'
        : 'Writes Defensible Written Sales Assumptions for Assessors',
      icon: DollarSign,
      badge: 'Full Pass',
      badgeVariant: 'secondary',
    },
    {
      code: 'MOD_I_MARKETING',
      short: 'Module I',
      title: 'Getting Your First 10 Customers',
      plainDesc:
        'Turn your early waitlist leads into paying customers with a practical outreach playbook, 4Ps positioning, and reverse-engineered marketing budget.',
      outcomeHook: 'Concrete First-10-Customers Acquisition Playbook',
      icon: Megaphone,
      badge: 'Full Pass',
      badgeVariant: 'secondary',
    },
    {
      code: 'MOD_J_FINANCE',
      short: 'Module J',
      title: 'No-Spreadsheet 3-Year Financial Builder',
      plainDesc:
        'Answer guided plain-English questions to generate 36-month cashflow projections, localized tax/payroll overheads, and your exact funding trough.',
      outcomeHook: 'Auto-Builds 36-Month Cashflow & Exact Funding Need',
      icon: Scale,
      badge: 'Full Pass',
      badgeVariant: 'secondary',
    },
    {
      code: 'MOD_K_GRANTS_FUNDING',
      short: 'Module K',
      title: isGlobal
        ? 'Funding Readiness & Capital Strategy Hub'
        : 'Grant, Loan & Investor Tax Relief Matcher',
      plainDesc: isGlobal
        ? 'Compare bootstrapping, revenue-based financing, bank loans, non-dilutive grants, and angel investment against your 36-month cashflow trough.'
        : isIE
          ? 'See every Irish grant, loan, or tax scheme you match with (LEO, Enterprise Ireland, SURE, R&D Tax Credit, EII) and plan around reimbursement delays.'
          : 'See every UK scheme you match with (Start Up Loans, Innovate UK Smart Grants, HMRC SEIS/EIS Advance Assurance, R&D Tax Relief) and score your readiness.',
      outcomeHook: isGlobal
        ? 'Matches Your Funding Gap to the Right Capital Vehicle'
        : isIE
          ? 'Matches LEO Feasibility/Priming, Digital Vouchers, EI & SURE'
          : 'Matches BBB Start Up Loans, Innovate UK & HMRC SEIS/EIS',
      icon: Landmark,
      badge: 'Flagship Tool',
      badgeVariant: 'default',
    },
    {
      code: 'MOD_L_BUSINESS_PLAN',
      short: 'Module L',
      title: isGlobal
        ? '1-Click Business Plan Compiler & AI Audit'
        : '1-Click Grant & Business Plan Compiler',
      plainDesc: isGlobal
        ? 'Compile your work across Modules A–K into a cohesive, investor-ready Business Plan—audited by AI so your narrative and 3-year financials never contradict.'
        : 'Compile your answers into official agency formats or a clean Business Plan—checked by AI for contradictions before you submit.',
      outcomeHook: isGlobal
        ? 'Pre-Flight AI Contradiction Audit + Clean Document Export'
        : '5 Export Modes (IE LEO, Innovate UK, Start Up Loans, SEIS, Standard)',
      icon: FileText,
      badge: 'Pre-Flight Audited',
      badgeVariant: 'warning',
    },
  ];
}

export function LandingPageExperience({
  edition,
}: {
  edition: LandingEdition;
}) {
  const router = useRouter();
  const [showAllModules, setShowAllModules] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const modulesList = getModulesForEdition(edition);
  const faqs = getFaqsForEdition(edition);

  // Sync region cookie + auto-detect browser timezone/locale on first visit
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Persist explicit region cookie when visiting /ie or /uk so Onboarding pre-selects it
    if (edition === 'IE') {
      document.cookie =
        'spf_region=IE; path=/; max-age=7776000; SameSite=Lax';
      window.localStorage.setItem('spf_region', 'IE');
      return;
    }
    if (edition === 'UK') {
      document.cookie =
        'spf_region=GB; path=/; max-age=7776000; SameSite=Lax';
      window.localStorage.setItem('spf_region', 'GB');
      return;
    }

    // 2. When on Global ('/'), inspect browser timezone & locale if user hasn't manually chosen Global
    const manualChoice = window.sessionStorage.getItem('spf_edition_manual');
    if (manualChoice) return;

    try {
      const tz =
        Intl.DateTimeFormat().resolvedOptions().timeZone?.toLowerCase() || '';
      const lang = (navigator.language || '').toLowerCase();

      if (tz === 'europe/dublin' || lang === 'en-ie' || lang === 'ga-ie') {
        document.cookie =
          'spf_region=IE; path=/; max-age=7776000; SameSite=Lax';
        window.localStorage.setItem('spf_region', 'IE');
        router.replace('/ie');
      } else if (
        tz === 'europe/london' ||
        tz === 'europe/belfast' ||
        lang === 'en-gb'
      ) {
        document.cookie =
          'spf_region=GB; path=/; max-age=7776000; SameSite=Lax';
        window.localStorage.setItem('spf_region', 'GB');
        router.replace('/uk');
      }
    } catch {
      // Ignore Intl errors in restricted environments
    }
  }, [edition, router]);

  const handleSwitchEdition = (target: LandingEdition) => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('spf_edition_manual', target);
      if (target === 'IE') {
        document.cookie =
          'spf_region=IE; path=/; max-age=7776000; SameSite=Lax';
        window.localStorage.setItem('spf_region', 'IE');
      } else if (target === 'UK') {
        document.cookie =
          'spf_region=GB; path=/; max-age=7776000; SameSite=Lax';
        window.localStorage.setItem('spf_region', 'GB');
      } else {
        document.cookie =
          'spf_region=US; path=/; max-age=7776000; SameSite=Lax';
        window.localStorage.setItem('spf_region', 'US');
      }
    }
  };

  // Pricing values per edition
  const pricingCurrency =
    edition === 'IE'
      ? { symbol: '€', solo: '129', cofounder: '199', vault: '9' }
      : edition === 'UK'
        ? { symbol: '£', solo: '109', cofounder: '169', vault: '8' }
        : { symbol: '$', solo: '139', cofounder: '219', vault: '9' };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      {/* Clean, Single-Bar Modern SaaS Navbar */}
      <MarketingHeader
        edition={edition}
        onSwitchEdition={handleSwitchEdition}
      />

      <main className="flex-1">
        {/* SECTION 1: HERO + INTERACTIVE LIVE UI PRODUCT SHOWCASE (OPTION 1) */}
        <section
          id="platform-preview"
          className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-white via-indigo-50/35 to-slate-50 px-4 pt-12 pb-16 sm:px-6 lg:pt-16 lg:pb-20"
        >
          <div className="mx-auto max-w-4xl text-center">
            {/* Edition Pill Badge */}
            <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-indigo-200 bg-white px-3.5 py-1 text-xs font-semibold text-indigo-950 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600" />
              </span>
              {edition === 'GLOBAL' && (
                <span>
                  Capture First, Expand Second • Zero Blank Spreadsheets
                </span>
              )}
              {edition === 'IE' && (
                <span>
                  🇮🇪 Built for Ireland Founders • LEO, Enterprise Ireland &amp;
                  SURE Ready
                </span>
              )}
              {edition === 'UK' && (
                <span>
                  🇬🇧 Built for UK Founders • Start Up Loans, Innovate UK &amp;
                  SEIS Ready
                </span>
              )}
            </div>

            {/* Edition-Specific Headline */}
            {edition === 'GLOBAL' && (
              <h1 className="mx-auto mt-5 max-w-3xl text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:leading-[1.12]">
                Turn your raw startup idea into a{' '}
                <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  stress-tested, structured Business Plan.
                </span>
              </h1>
            )}

            {edition === 'IE' && (
              <h1 className="mx-auto mt-5 max-w-3xl text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:leading-[1.12]">
                Shape your startup idea.{' '}
                <span className="bg-gradient-to-r from-emerald-600 to-indigo-600 bg-clip-text text-transparent">
                  Unlock €2,500 to €80,000+ in Irish startup grants.
                </span>
              </h1>
            )}

            {edition === 'UK' && (
              <h1 className="mx-auto mt-5 max-w-3xl text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:leading-[1.12]">
                Shape your startup idea.{' '}
                <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  Unlock UK Start Up Loans, Innovate UK &amp; SEIS.
                </span>
              </h1>
            )}

            {/* Edition-Specific Subheadline */}
            {edition === 'GLOBAL' && (
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
                Stop staring at blank Word documents and intimidating 12-tab
                Excel templates. Tell us your idea in plain English—our
                supportive AI Co-Founder helps you spot blind spots, validate
                real customer demand, align with your co-founder, and build a{' '}
                <strong className="font-semibold text-slate-900">
                  bank- and investor-ready Business Plan &amp; 3-Year Financial
                  Model
                </strong>{' '}
                step by step.
              </p>
            )}

            {edition === 'IE' && (
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
                Every year, Irish founders leave{' '}
                <strong className="font-semibold text-slate-900">
                  LEO Feasibility (€15k), Priming (€80k+), Digital Vouchers
                  (€5k), New Frontiers (€30k stipend), and SURE tax refunds
                </strong>{' '}
                on the table because applications and cashflow spreadsheets look
                too intimidating. Tell us your idea in plain English—we help you
                gather real buyer proof and compile the exact pack Irish
                assessors ask for.
              </p>
            )}

            {edition === 'UK' && (
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
                Every year, UK founders miss out on{' '}
                <strong className="font-semibold text-slate-900">
                  British Business Bank Start Up Loans (£25k/founder), Innovate
                  UK Smart Grants, and HMRC 50% SEIS angel tax relief
                </strong>{' '}
                because survival budgets, 9-question applications, and
                36-month cashflows look too complex. Tell us your idea in plain
                English—we guide you from raw concept to submission-ready.
              </p>
            )}

            {/* Primary Live CTAs */}
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/register" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="h-12 w-full bg-gradient-to-r from-indigo-600 to-violet-600 px-7 text-sm font-bold text-white shadow-md hover:from-indigo-700 hover:to-violet-700 sm:w-auto"
                >
                  {edition === 'GLOBAL'
                    ? 'Start Your Business Plan Free (Module A)'
                    : edition === 'IE'
                      ? 'Start Free Idea & Irish Grant Check'
                      : 'Start Free Idea & UK Funding Check'}
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
              <a href="#how-it-works" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 w-full border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:w-auto"
                >
                  See How All 12 Modules Work
                </Button>
              </a>
            </div>

            {/* Trust Micro-Bar */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Module A (Steps 1–8) is 100% Free Forever
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                No credit card required to start
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Takes ~10 minutes for your first 1-Page Canvas
              </span>
            </div>
          </div>

          {/* OPTION 1: Interactive 4-Tab Live UI Product Showcase */}
          <HeroInteractiveProductShowcase edition={edition} />
        </section>

        {/* SECTION 2: EDITION-SPECIFIC VALUE PROP (Global = Structured Plan vs Chaos | IE = Irish Grants | UK = UK Grants & Loans) */}
        <section
          id="why-preflight"
          className="border-b border-slate-200 bg-white py-16"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            {edition === 'GLOBAL' && (
              <>
                <div className="text-center">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-800">
                    <Lightbulb className="h-3.5 w-3.5 text-indigo-600" />
                    Why Founders Switch to Startup Preflight
                  </div>
                  <h2 className="mt-2.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    Why blank docs, generic AI prompts, and spreadsheets fail
                    early ideas
                  </h2>
                  <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600">
                    When you have a new business idea, you don&apos;t need a
                    40-page corporate template or a chatbot that blindly tells
                    you every idea is a billion-dollar unicorn. You need a
                    structured co-founder.
                  </p>
                </div>

                <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Left: The Old Way */}
                  <div className="rounded-2xl border border-rose-200/80 bg-rose-50/30 p-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-rose-950">
                        The Old Way (Why Ideas Stall Out)
                      </span>
                      <Badge variant="secondary">Guesswork &amp; Burnout</Badge>
                    </div>
                    <ul className="mt-4 space-y-3 text-xs text-slate-700 sm:text-sm">
                      <li className="flex items-start gap-2.5">
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                        <span>
                          <strong>Generic AI Chatbots Flatter You:</strong> Ask
                          a standard chatbot for a business plan and it writes
                          15 pages of buzzwords without ever testing if your
                          unit economics actually work.
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                        <span>
                          <strong>Scary 12-Tab Excel Templates:</strong> One
                          broken formula ruins your cashflow forecast, and your
                          pricing assumptions never match what is written in
                          your narrative doc.
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                        <span>
                          <strong>Polite Lies Instead of Buyer Proof:</strong>{' '}
                          Friends say &ldquo;great idea!&rdquo;, you spend 6
                          months building V1, and nobody pays at launch.
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                        <span>
                          <strong>Unspoken Co-Founder Friction:</strong> Splitting
                          equity 50/50 on a handshake before discussing hours,
                          salaries, or vesting.
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* Right: The Startup Preflight Way */}
                  <div className="rounded-2xl border border-emerald-200/90 bg-gradient-to-b from-emerald-50/40 to-white p-6 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">
                        The Startup Preflight Engine
                      </span>
                      <Badge variant="success">Structured &amp; Verified</Badge>
                    </div>
                    <ul className="mt-4 space-y-3 text-xs text-slate-700 sm:text-sm">
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span>
                          <strong>&ldquo;Capture First, Expand Second&rdquo;:</strong>{' '}
                          We help you structure your raw vision cleanly first,
                          then generate constructive{' '}
                          <em>&ldquo;Things to Consider&rdquo;</em> blind-spot
                          reviews at the end of every module.
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span>
                          <strong>1-Click Customer Validation Link:</strong>{' '}
                          Publish a hosted &ldquo;Mom Test&rdquo; survey &amp;
                          waitlist link to collect real buyer data before writing
                          code.
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span>
                          <strong>No-Spreadsheet 36-Month Financials:</strong>{' '}
                          Interactive &ldquo;Pocket Profit&rdquo; sliders and
                          What-If stress tests that automatically sync to your
                          hiring and pricing steps.
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span>
                          <strong>Pre-Flight AI Contradiction Audit:</strong>{' '}
                          Checks your entire plan before export so your story,
                          headcount, and cashflow numbers are 100% consistent.
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </>
            )}

            {edition === 'IE' && (
              <>
                <div className="text-center">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                    <Coins className="h-3.5 w-3.5 text-emerald-600" />
                    🇮🇪 Non-Dilutive Irish Startup Grants, Vouchers &amp; Tax
                    Relief
                  </div>
                  <h2 className="mt-2.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    Every Irish grant &amp; tax scheme Startup Preflight
                    prepares you for
                  </h2>
                  <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600">
                    Local Enterprise Office (LEO) and Enterprise Ireland
                    evaluation committees don&apos;t reject founders because
                    their idea is bad—they reject vague plans missing primary
                    buyer proof, export justification, or compliant quotes.
                  </p>
                </div>

                <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
                  {/* Card 1: LEO Feasibility & Priming */}
                  <div className="flex flex-col justify-between rounded-2xl border border-emerald-200/90 bg-gradient-to-b from-emerald-50/40 to-white p-6 shadow-2xs">
                    <div>
                      <Badge variant="success">Local Enterprise Office</Badge>
                      <h3 className="mt-3 text-base font-bold text-slate-900">
                        LEO Feasibility (€15k) &amp; Priming Grants (€80k+)
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
                        Covers 50%–60% of eligible prototype development, market
                        research, specialist consultancy, capital equipment, and
                        first full-time salaries in Year 1.
                      </p>
                    </div>
                    <div className="mt-4 border-t border-emerald-100 pt-3 text-xs font-semibold text-emerald-800">
                      ✓ Exports directly into Official LEO Application +
                      Appendices A–F
                    </div>
                  </div>

                  {/* Card 2: Digital Vouchers & New Frontiers */}
                  <div className="flex flex-col justify-between rounded-2xl border border-indigo-200/90 bg-gradient-to-b from-indigo-50/40 to-white p-6 shadow-2xs">
                    <div>
                      <Badge variant="default">
                        Enterprise Ireland &amp; LEO Digital
                      </Badge>
                      <h3 className="mt-3 text-base font-bold text-slate-900">
                        New Frontiers (€30k Stipend), PSSF &amp; €5k Digital/AI
                        Vouchers
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
                        Prepare your competitive wedge, international export
                        thesis, and technical work packages (`WP1–n`) for EI New
                        Frontiers Phase 2, Pre-Seed Start Fund (PSSF), and 50%–80%
                        Digital Vouchers.
                      </p>
                    </div>
                    <div className="mt-4 border-t border-indigo-100 pt-3 text-xs font-semibold text-indigo-800">
                      ✓ Built-in Non-Displacement &amp; Export Potential Builder
                    </div>
                  </div>

                  {/* Card 3: Revenue SURE & R&D Tax Credit */}
                  <div className="flex flex-col justify-between rounded-2xl border border-violet-200/90 bg-gradient-to-b from-violet-50/40 to-white p-6 shadow-2xs">
                    <div>
                      <Badge variant="secondary">Revenue Commissioners</Badge>
                      <h3 className="mt-3 text-base font-bold text-slate-900">
                        SURE PAYE Tax Refund (Up to 41%) &amp; EII Investor
                        Relief
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
                        Leaving a PAYE job to start an Irish LTD company? You
                        may be able to reclaim up to 41% of the income tax you
                        paid over the previous 4 years under the Startup
                        Refunds for Entrepreneurs (SURE) scheme.
                      </p>
                    </div>
                    <div className="mt-4 border-t border-violet-100 pt-3 text-xs font-semibold text-violet-800">
                      ✓ Includes Reimbursement Cashflow Bridge Calculator
                    </div>
                  </div>
                </div>
              </>
            )}

            {edition === 'UK' && (
              <>
                <div className="text-center">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-800">
                    <Coins className="h-3.5 w-3.5 text-indigo-600" />
                    🇬🇧 UK Startup Loans, Non-Dilutive Grants &amp; SEIS/EIS Tax
                    Relief
                  </div>
                  <h2 className="mt-2.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    Every UK funding &amp; tax scheme Startup Preflight prepares
                    you for
                  </h2>
                  <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600">
                    UK loan underwriters, Innovate UK assessors, and HMRC
                    caseworkers reject applications when your survival budget,
                    cashflow forecast, and narrative don&apos;t line up. We wire
                    them together automatically.
                  </p>
                </div>

                <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
                  {/* Card 1: British Business Bank Start Up Loans */}
                  <div className="flex flex-col justify-between rounded-2xl border border-indigo-200/90 bg-gradient-to-b from-indigo-50/40 to-white p-6 shadow-2xs">
                    <div>
                      <Badge variant="default">British Business Bank</Badge>
                      <h3 className="mt-3 text-base font-bold text-slate-900">
                        UK Start Up Loans (Up to £25,000 per Co-Founder)
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
                        Government-backed personal loan for business use (up to
                        £100k per company across co-founders) with 12 months of
                        free mentoring. Includes the mandatory{' '}
                        <strong>Personal Survival Budget</strong> &amp; 4-Part
                        Workbook export.
                      </p>
                    </div>
                    <div className="mt-4 border-t border-indigo-100 pt-3 text-xs font-semibold text-indigo-800">
                      ✓ Exports 4-Part Start Up Loans Business Plan &amp;
                      Survival Budget
                    </div>
                  </div>

                  {/* Card 2: Innovate UK Smart & Feasibility Grants */}
                  <div className="flex flex-col justify-between rounded-2xl border border-emerald-200/90 bg-gradient-to-b from-emerald-50/40 to-white p-6 shadow-2xs">
                    <div>
                      <Badge variant="success">Innovate UK (UKRI)</Badge>
                      <h3 className="mt-3 text-base font-bold text-slate-900">
                        Innovate UK Smart &amp; Feasibility Grants
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
                        Non-dilutive R&amp;D funding for innovative UK products
                        and services. Automatically structures your project into
                        Work Packages (`WP1–n`), a 4-category Risk Register, UK
                        capital usage depreciation, and the{' '}
                        <strong>Official 9-Question IFS format</strong>.
                      </p>
                    </div>
                    <div className="mt-4 border-t border-emerald-100 pt-3 text-xs font-semibold text-emerald-800">
                      ✓ Exports 9-Question IFS Narrative + 2-Page PDF Appendices
                    </div>
                  </div>

                  {/* Card 3: HMRC SEIS / EIS Advance Assurance */}
                  <div className="flex flex-col justify-between rounded-2xl border border-violet-200/90 bg-gradient-to-b from-violet-50/40 to-white p-6 shadow-2xs">
                    <div>
                      <Badge variant="secondary">HMRC Investor Relief</Badge>
                      <h3 className="mt-3 text-base font-bold text-slate-900">
                        HMRC SEIS (50% Tax Relief) &amp; EIS Advance Assurance
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
                        UK angel investors strongly prefer startups with HMRC
                        SEIS Advance Assurance because they get 50% of their
                        investment back in income tax relief. We verify
                        qualifying trade rules and compile your HMRC business
                        plan pack.
                      </p>
                    </div>
                    <div className="mt-4 border-t border-violet-100 pt-3 text-xs font-semibold text-violet-800">
                      ✓ Includes UK ERIS / RDEC R&amp;D Tax Relief Eligibility
                      Check
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* SECTION 3: FLAGSHIP TOOLS BENTO SHOWCASE */}
        <section
          id="flagship-tools"
          className="border-b border-slate-200 bg-slate-50 py-16"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              <Badge variant="default">Built-In Founder Power Tools</Badge>
              <h2 className="mt-2.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                More than a document builder—four practical startup tools in one
                workspace
              </h2>
              <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600">
                Every tool feeds live data directly into your financial model
                and final Business Plan so you never copy-paste between apps.
              </p>
            </div>

            <BentoFeatureVisualCards edition={edition} />
          </div>
        </section>

        {/* SECTION 4: 4-STAGE FLOW + EXPANDABLE 12 MODULES (A–L) */}
        <section
          id="how-it-works"
          className="border-b border-slate-200 bg-white py-16"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              <Badge variant="secondary">
                Guided Step-by-Step • Zero Jargon • No 20-Min Videos
              </Badge>
              <h2 className="mt-2.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                How Startup Preflight takes you from raw idea to{' '}
                {edition === 'GLOBAL'
                  ? 'a complete Business Plan'
                  : 'grant- & investor-ready'}
              </h2>
              <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600">
                Every single question includes a{' '}
                <strong>&ldquo;Why Are We Asking This?&rdquo;</strong> coaching
                card, an <strong>Industry Example</strong>, and a{' '}
                <strong>&ldquo;Park It in Open Questions&rdquo;</strong> button
                so you never get stuck.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Step 1 */}
              <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/50 p-6 shadow-2xs">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
                      1
                    </span>
                    <Badge variant="success">100% Free Forever</Badge>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-slate-900">
                    {edition === 'GLOBAL'
                      ? 'Brain-Dump Your Idea & Spot Blind Spots'
                      : 'Brain-Dump Your Idea & Check Grant Fit'}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {edition === 'GLOBAL'
                      ? 'Explain your idea in everyday language. Our supportive AI Co-Founder structures your 1-Page Concept Canvas, checks domain availability, gently flags blind spots to think about, and scores your Founder-Idea Fit.'
                      : 'Explain your idea in everyday language. Our supportive AI Co-Founder structures your 1-Page Concept Canvas, gently flags blind spots to think about, and checks which grant sectors you match with.'}
                  </p>
                </div>
                <div className="mt-5 rounded-xl bg-white px-3.5 py-2.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200/80">
                  ⏱ Takes ~10 mins • No business background needed
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/50 p-6 shadow-2xs">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-sm font-bold text-white">
                      2
                    </span>
                    <Badge variant="default">Guided Evidence Builder</Badge>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-slate-900">
                    Validate Demand, Align Co-Founders &amp; Price It
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Launch a 1-click public customer survey &amp; waitlist link,
                    align privately with your co-founder on 12 awkward
                    questions, track your company setup checklist, and answer
                    plain-English questions to build a 36-month financial model.
                  </p>
                </div>
                <div className="mt-5 rounded-xl bg-white px-3.5 py-2.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200/80">
                  ✓ Includes Hosted Survey Link + No-Spreadsheet Finance
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/50 p-6 shadow-2xs">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
                      3
                    </span>
                    <Badge variant="warning">Pre-Flight AI Audit</Badge>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-slate-900">
                    {edition === 'GLOBAL'
                      ? 'Audit & Export Your Complete Business Plan'
                      : 'Audit & Export Your Official Grant or Business Plan'}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {edition === 'GLOBAL' ? (
                      <>
                        Compile your work into a clean, cohesive{' '}
                        <strong>
                          Executive Business Plan &amp; 3-Year Financial Pack
                        </strong>
                        —pre-audited by AI so your pricing, hiring schedule, and
                        cashflow numbers never contradict.
                      </>
                    ) : edition === 'IE' ? (
                      <>
                        Compile everything into an official{' '}
                        <strong>
                          Ireland LEO Application + Appendices A–F, Enterprise
                          Ireland brief, or Standard Business Plan
                        </strong>
                        —pre-audited by AI so your numbers and story never
                        contradict.
                      </>
                    ) : (
                      <>
                        Compile everything into an official{' '}
                        <strong>
                          UK Start Up Loans 4-Part Workbook, Innovate UK
                          9-Question pack, HMRC SEIS pack, or Standard Business
                          Plan
                        </strong>
                        —pre-audited by AI before you submit.
                      </>
                    )}
                  </p>
                </div>
                <div className="mt-5 rounded-xl bg-white px-3.5 py-2.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200/80">
                  ✓ Catches contradictions before{' '}
                  {edition === 'GLOBAL'
                    ? 'investors or banks'
                    : 'grant assessors'}{' '}
                  do
                </div>
              </div>
            </div>

            {/* Expandable Drawer for All 12 Guided Modules (A–L) */}
            <div className="mt-10 text-center">
              <button
                type="button"
                onClick={() => setShowAllModules((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-indigo-300 hover:text-indigo-700 sm:text-sm"
              >
                {showAllModules ? (
                  <>
                    Hide the 12 guided modules (A–L)
                    <ChevronUp className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Explore all 12 guided modules under the hood (Modules A–L)
                    <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </button>

              {showAllModules && (
                <div className="mt-6 grid grid-cols-1 gap-3.5 text-left md:grid-cols-2 lg:grid-cols-3">
                  {modulesList.map((m) => {
                    const Icon = m.icon;
                    return (
                      <div
                        key={m.code}
                        className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/40 p-4 shadow-2xs"
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

                        <div className="mt-3 flex items-center gap-1.5 border-t border-slate-200/80 pt-2.5 text-[11px] font-semibold text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                          <span>{m.outcomeHook}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SECTION 5: TRANSPARENT PRICING & PASSES */}
        <section
          id="pricing"
          className="border-b border-slate-200 bg-slate-50 py-16"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              <Badge variant="success">
                Start Free • No Recurring Subscription Trap
              </Badge>
              <h2 className="mt-2.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Simple, founder-friendly pricing
              </h2>
              <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600">
                Start with <strong>Module A 100% Free Forever</strong>. Only
                upgrade to a 6-Month Builder Pass when you&apos;re ready to
                unlock Modules B–L, live customer surveys, 3-year financials,
                and full plan exports.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Tier 1: Free Hook */}
              <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">
                      Starter (Module A)
                    </span>
                    <Badge variant="success">Free Forever</Badge>
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-900">
                      {pricingCurrency.symbol}0
                    </span>
                    <span className="text-xs text-slate-500">
                      forever • no card needed
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-600">
                    Perfect for getting your raw idea out of your head and
                    testing if it has legs in 10 minutes.
                  </p>
                  <ul className="mt-5 space-y-2.5 text-xs text-slate-700">
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>Full Module A (Steps 1–8) Ideation &amp; Vision</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>1-Page Concept Canvas &amp; Customer Storyboard</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>
                        Live Domain (<code>.ie / .co.uk / .com</code>) Check
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>
                        Supportive AI &ldquo;Things to Consider&rdquo; Blind-Spot
                        Review
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>
                        Founder-Idea Fit Scorecard (0–100)
                        {edition !== 'GLOBAL' && ' & Grant Sector Pre-Check'}
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6">
                  <Link href="/register">
                    <Button
                      variant="outline"
                      className="w-full border-indigo-200 font-semibold text-indigo-700 hover:bg-indigo-50"
                    >
                      Start Module A Free →
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Tier 2: Solo Founder 6-Month Pass */}
              <div className="relative flex flex-col justify-between rounded-2xl border-2 border-indigo-600 bg-white p-6 shadow-md">
                <div className="absolute -top-3 right-5 rounded-full bg-indigo-600 px-3 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase">
                  Most Popular
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">
                      Solo Founder Pass
                    </span>
                    <Badge variant="default">6-Month Full Access</Badge>
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-900">
                      {pricingCurrency.symbol}
                      {pricingCurrency.solo}
                    </span>
                    <span className="text-xs text-slate-500">
                      one-time 6-month pass
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-600">
                    Everything a solo founder needs to validate customers, build
                    3-year financials, and compile a complete plan.
                  </p>
                  <ul className="mt-5 space-y-2.5 text-xs text-slate-700">
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                      <span>
                        <strong>All 12 Guided Modules (A–L)</strong> unlocked
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                      <span>
                        1 Startup Plan + 1 Founder Seat
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                      <span>
                        Hosted Public Customer Survey &amp; Waitlist Link + QR
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                      <span>
                        &ldquo;Pocket Profit&rdquo; Breakeven &amp; 36-Month
                        Cashflow Builder
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                      <span>
                        {edition === 'GLOBAL'
                          ? 'Pre-Flight AI Contradiction Audit & Full Business Plan Export'
                          : 'Grant Readiness Matcher + All 5 Official Export Modes'}
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6">
                  <Link href="/register">
                    <Button className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 font-semibold text-white hover:from-indigo-700 hover:to-violet-700">
                      Start Free, Upgrade Anytime →
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Tier 3: Co-Founder & Multi-Idea Pass */}
              <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">
                      Co-Founder &amp; Pivot Pass
                    </span>
                    <Badge variant="secondary">3 Plans • 3 Seats</Badge>
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-900">
                      {pricingCurrency.symbol}
                      {pricingCurrency.cofounder}
                    </span>
                    <span className="text-xs text-slate-500">
                      one-time 6-month pass
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-600">
                    For co-founder teams or serial founders testing &amp;
                    comparing up to 3 different startup concepts.
                  </p>
                  <ul className="mt-5 space-y-2.5 text-xs text-slate-700">
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                      <span>
                        Everything in Solo Pass + <strong>Up to 3 Plans</strong>
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                      <span>
                        <strong>Up to 3 Co-Founder / Mentor Seats</strong>
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                      <span>
                        Unlocks Multi-Seat{' '}
                        <strong>
                          Blind-Reveal Co-Founder Alignment Survey (12 Awkward
                          Questions)
                        </strong>
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                      <span>
                        1-Click Plan Clone &amp; Pivot Engine
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                      <span>
                        Keep read-only vault forever after 6 mos (or{' '}
                        {pricingCurrency.symbol}
                        {pricingCurrency.vault}/mo Living Vault)
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6">
                  <Link href="/register">
                    <Button
                      variant="outline"
                      className="w-full border-violet-200 font-semibold text-violet-700 hover:bg-violet-50"
                    >
                      Start With Co-Founder Team →
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Cohort / Voucher Redemption Callout */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4 text-indigo-600" />
                <span>
                  Part of a{' '}
                  <strong>
                    University Incubator, Ireland LEO, UK Growth Hub, or Partner
                    Cohort
                  </strong>
                  ?
                </span>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  href="/cohorts"
                  className="font-medium text-slate-500 hover:text-indigo-600 transition"
                >
                  Program Licensing ↗
                </Link>
                <Link
                  href="/redeem"
                  className="font-bold text-indigo-600 hover:underline"
                >
                  Redeem Your Cohort Code →
                </Link>
              </div>
            </div>

            {/* Founder Credibility Banner with Photo & LinkedIn */}
            <div className="mt-6 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-8">
              <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
                    <img
                      src="/images/founder-thomas-walsh.jpg"
                      alt="Thomas Walsh — Founder of Startup Preflight"
                      width={96}
                      height={96}
                      className="h-full w-full object-cover object-top"
                    />
                  </div>
                  <div className="max-w-2xl">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[11px] font-bold text-indigo-700">
                      <Sparkles className="h-3.5 w-3.5" />
                      Built by a Practitioner — Meet Founder Thomas Walsh
                    </span>
                    <h3 className="mt-2 text-lg font-black text-slate-900 sm:text-xl">
                      20+ Years in Software &amp; Cloud Architecture • 400+ Startups Scaled
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600 sm:text-sm">
                      &ldquo;I watched hundreds of brilliant founders get rejected because their
                      great idea was trapped in a messy document or broken spreadsheet. Startup
                      Preflight puts our 12-module commercial, technical, and financial underwriting
                      playbook in your hands.&rdquo;
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-2.5 sm:flex-row md:flex-col">
                  <Link href="/about-founder">
                    <Button
                      variant="outline"
                      className="h-10 w-full rounded-xl border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Read Thomas&apos;s Story →
                    </Button>
                  </Link>
                  <a
                    href="https://www.linkedin.com/in/twalsh-start-ups/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50/70 px-4 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"
                  >
                    Connect on LinkedIn ↗
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6: SEO-RICH FAQ ACCORDION */}
        <section className="border-b border-slate-200 bg-white py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div className="text-center">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                <HelpCircle className="h-3.5 w-3.5 text-indigo-600" />
                Frequently Asked Questions
              </div>
              <h2 className="mt-2.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {edition === 'GLOBAL'
                  ? 'Questions about building your Business Plan'
                  : edition === 'IE'
                    ? 'Questions about Irish Startup Grants & LEO Readiness'
                    : 'Questions about UK Start Up Loans, Innovate UK & SEIS'}
              </h2>
            </div>

            <div className="mt-8 space-y-3">
              {faqs.map((item, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={item.question}
                    className="rounded-xl border border-slate-200 bg-slate-50/60 transition hover:border-indigo-200"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenFaqIndex(isOpen ? null : idx)
                      }
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-bold text-slate-900"
                    >
                      <span>{item.question}</span>
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4 shrink-0 text-indigo-600" />
                      ) : (
                        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="border-t border-slate-200/70 bg-white px-5 py-4 text-xs leading-relaxed text-slate-600 sm:text-sm">
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 7: FINAL BOTTOM CTA BANNER */}
        <section className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-950 px-4 py-14 text-center text-white sm:px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              {edition === 'GLOBAL'
                ? 'Ready to get your startup idea out of your head and onto paper?'
                : edition === 'IE'
                  ? 'Check which Irish grants your startup idea qualifies for in 10 minutes.'
                  : 'Check which UK loans, grants, or SEIS relief your idea qualifies for in 10 minutes.'}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-indigo-100/90">
              Start with Module A for free—build your 1-Page Concept Canvas,
              spot blind spots early, and see your Founder-Idea Fit score with
              zero risk.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-white px-7 text-sm font-bold text-indigo-950 hover:bg-indigo-50"
                >
                  Start Module A Free Now
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-indigo-400/50 bg-transparent px-6 text-sm font-semibold text-white hover:bg-indigo-800/50"
                >
                  Sign In to Existing Plan
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer with Regional SEO Links & Company Metadata */}
      <footer className="border-t border-slate-800 bg-slate-950 text-slate-400">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
            <div className="md:col-span-5">
              <div className="flex flex-wrap items-center gap-2.5">
                <BrandLogo variant="full" size="sm" theme="dark" />
              </div>
              <p className="mt-2.5 max-w-sm text-xs leading-relaxed text-slate-400">
                The Supportive AI Co-Founder, Customer Validation &amp;
                No-Spreadsheet Business Plan Engine for early-stage founders,
                university incubators, Ireland Local Enterprise Offices (LEOs),
                and UK Growth Hubs.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                <span>Founding Date: 2026</span>
                <span>•</span>
                <span>Dublin, Ireland</span>
                <span>•</span>
                <a
                  href="mailto:hello@startuppreflight.com"
                  className="hover:text-slate-300"
                >
                  hello@startuppreflight.com
                </a>
              </div>
            </div>

            {/* Regional Editions Column (Important for internal SEO linking) */}
            <div className="md:col-span-4">
              <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-white uppercase">
                <Globe2 className="h-3.5 w-3.5 text-indigo-400" />
                Regional Editions
              </div>
              <ul className="mt-3 space-y-2 text-xs">
                <li>
                  <Link
                    href="/"
                    onClick={() => handleSwitchEdition('GLOBAL')}
                    className={`transition hover:text-white ${
                      edition === 'GLOBAL' ? 'font-bold text-indigo-400' : ''
                    }`}
                  >
                    🌍 Global — Startup Business Plan &amp; Financial Builder
                  </Link>
                </li>
                <li>
                  <Link
                    href="/ie"
                    onClick={() => handleSwitchEdition('IE')}
                    className={`transition hover:text-white ${
                      edition === 'IE' ? 'font-bold text-emerald-400' : ''
                    }`}
                  >
                    🇮🇪 Ireland — LEO Grants, Enterprise Ireland &amp; SURE
                    Builder
                  </Link>
                </li>
                <li>
                  <Link
                    href="/uk"
                    onClick={() => handleSwitchEdition('UK')}
                    className={`transition hover:text-white ${
                      edition === 'UK' ? 'font-bold text-indigo-400' : ''
                    }`}
                  >
                    🇬🇧 United Kingdom — Start Up Loans, Innovate UK &amp; SEIS
                    Builder
                  </Link>
                </li>
              </ul>
            </div>

            {/* Quick Links Column */}
            <div className="md:col-span-3">
              <div className="text-xs font-bold tracking-wider text-white uppercase">
                Platform &amp; Legal
              </div>
              <ul className="mt-3 space-y-2 text-xs">
                <li>
                  <Link href="/register" className="hover:text-white">
                    Start Module A Free
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white">
                    Founder Sign In
                  </Link>
                </li>
                <li>
                  <Link href="/redeem" className="hover:text-white">
                    Redeem Cohort / Partner Code
                  </Link>
                </li>
                <li>
                  <Link href="/cohorts" className="hover:text-white font-medium text-indigo-300">
                    Preflight for Accelerators &amp; Cohorts
                  </Link>
                </li>
                <li>
                  <Link href="/about-founder" className="hover:text-white">
                    Meet the Founder
                  </Link>
                </li>
                <li>
                  <Link href="/grants" className="hover:text-white">
                    Startup Grants Directory
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <a
                    href="https://www.linkedin.com/in/twalsh-start-ups/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white"
                  >
                    LinkedIn
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-800/80 pt-6 text-center text-[11px] text-slate-500">
            © {new Date().getFullYear()} Startup Preflight. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
