'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Rocket,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Layers,
  Award,
  KeyRound,
  Users,
  MessageSquareText,
  X,
  Lock,
  Globe,
  Check,
  ChevronDown,
  Zap,
  FileSpreadsheet,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BrandLogo } from '@/components/ui/brand-logo';
import {
  HeroInteractiveProductShowcase,
  BentoFeatureVisualCards,
} from '@/components/marketing/platform-ui-previews';

const TWELVE_MODULES = [
  {
    code: 'Module A',
    title: 'Idea, Storyboard & Fit Scorecard',
    desc: 'Capture your vision in plain English, map a 4-panel customer storyboard, check live domain availability, and score your Founder-Idea Fit out of 100.',
    tag: 'Ideation',
  },
  {
    code: 'Module B',
    title: 'Market Sizing & Competitor Scout',
    desc: 'Build a bottom-up TAM/SAM/SOM model in plain English, define your beachhead customer persona, and map your competitive wedge.',
    tag: 'Market',
  },
  {
    code: 'Module C',
    title: 'Customer Surveys & Waitlist Engine',
    desc: 'Publish a hosted "Mom Test" validation survey & waitlist page (/v/[slug]) with QR code distribution and AI sentiment synthesis.',
    tag: 'Validation',
  },
  {
    code: 'Module D',
    title: 'Product Build & V1 Scope Filter',
    desc: 'Compare Own vs. Rent channels, get a 3-Tier Build-vs-Buy recommendation, ruthlessly filter V1 features, and structure Work Packages (WP1–WPn).',
    tag: 'Product',
  },
  {
    code: 'Module E',
    title: 'Operations, Suppliers & Risk Register',
    desc: 'Map a Day in the Life of an Order, build your equipment schedule, and complete a 4-category risk register & compliance checklist.',
    tag: 'Operations',
  },
  {
    code: 'Module F',
    title: 'Co-Founder Alignment & Team',
    desc: 'Run the Blind-Reveal 12 Awkward Questions Survey, view your Side-by-Side Alignment Heatmap, calculate fair equity splits, and plan 3-year hiring.',
    tag: 'Team',
  },
  {
    code: 'Module G',
    title: 'Getting Set Up (Launchpad Hub)',
    desc: 'Track your 0–100% Operations Readiness Score across entity registration, domain/email, banking, bookkeeping, insurance, and baseline IP/GDPR.',
    tag: 'Setup',
  },
  {
    code: 'Module H',
    title: 'Pricing & 3-Year Pocket Profit Engine',
    desc: 'Interactive visual breakeven graph pulling COGS, fees, and payroll automatically — plus a non-destructive What-If stress-test sandbox.',
    tag: 'Unit Economics',
  },
  {
    code: 'Module I',
    title: 'Go-To-Market & First 10 Customers',
    desc: 'Build your brand positioning, 4Ps strategy, First 10 Customers playbook, and reverse-engineered marketing budget calculator.',
    tag: 'Marketing',
  },
  {
    code: 'Module J',
    title: 'No-Spreadsheet 36-Month Finance',
    desc: 'Generate 3-year P&L, localized employer taxes/VAT, sensitivity analysis, and your 36-month cashflow trough & funding gap automatically.',
    tag: 'Finance',
  },
  {
    code: 'Module K',
    title: 'Funding, Loans & Tax Relief Hub',
    desc: 'Match against non-dilutive startup grants, loans, and investor tax relief schemes (including IE & UK programmes where applicable).',
    tag: 'Funding',
  },
  {
    code: 'Module L',
    title: 'Business Plan & Compiler Vault',
    desc: 'Compile your live modules, financials, and customer survey proof into a boardroom-ready Business Plan & Pre-Flight AI Audit.',
    tag: 'Compiler',
  },
];

const APPSUMO_FAQS = [
  {
    q: 'How does the AppSumo Lifetime Deal work compared to the 6-Month Pass?',
    a: 'Standard customers pay $139–$219 every 6 months (or a recurring monthly vault fee). With an AppSumo Lifetime Deal code, you pay once and unlock permanent lifetime access to all 12 Startup Preflight modules (Modules A–L) with zero recurring subscription fees.',
  },
  {
    q: 'How does stacking work (Tier 1 vs. Tier 2)?',
    a: '1 Code (Tier 1) is ideal for a solo founder working on a single startup idea (1 Plan, 1 Seat, 150 AI credits/month). 2 Codes (Tier 2 — Most Popular) unlocks 3 Active Startup Plans, 3 Team Seats, 450 AI credits/month, and the flagship Module F Blind-Reveal Co-Founder Alignment Engine with side-by-side alignment heatmap.',
  },
  {
    q: 'Does Startup Preflight work for my country and currency?',
    a: 'Yes! Every startup plan supports USD ($), EUR (€), GBP (£), CAD ($), and AUD ($). You can use the Global Business Plan compiler anywhere in the world, and if you are incorporating or expanding in Ireland or the UK, you also get full access to the localized IE (LEO / Enterprise Ireland) and UK (Start Up Loans / Innovate UK / HMRC SEIS) compilers.',
  },
  {
    q: 'How do monthly AI credits work?',
    a: 'Every AppSumo tier includes a generous monthly allowance of built-in Gemini AI calls that resets automatically every month for life (150/mo on Tier 1, 450/mo on Tier 2). There are no surprise bills or pay-per-token overage fees.',
  },
  {
    q: 'How do I redeem my AppSumo code?',
    a: 'Click "Redeem Code" in the top navigation bar (or visit /redeem), create or sign in to your founder account, and enter your AppSumo code(s). Your account entitlement upgrades immediately and stacks automatically if you enter 2 codes.',
  },
];

export function AppSumoClientPage() {
  const [isModulesModalOpen, setIsModulesModalOpen] = useState(false);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-600 selection:text-white">
      {/* ===================================================================== */}
      {/* MODERN SINGLE-BAR FLOATING-PILL HEADER                                */}
      {/* ===================================================================== */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/70 bg-white/85 backdrop-blur-md">
        <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-12">
          {/* Left: Clean Brand Logo + AppSumo Pill */}
          <div className="flex items-center gap-2.5">
            <Link href="/" className="group flex items-center">
              <BrandLogo variant="full" size="sm" theme="light" />
            </Link>
            <span className="hidden items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-900 sm:inline-flex">
              🌮 AppSumo LTD
            </span>
          </div>

          {/* Center: Modern Floating Pill Links */}
          <nav className="hidden items-center gap-1 rounded-full border border-slate-200/80 bg-slate-100/75 p-1 lg:flex">
            <a
              href="#preview"
              className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:bg-white hover:text-slate-900 hover:shadow-2xs"
            >
              Live Preview
            </a>
            <a
              href="#features"
              className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:bg-white hover:text-slate-900 hover:shadow-2xs"
            >
              4 Flagship Engines
            </a>
            <button
              type="button"
              onClick={() => setIsModulesModalOpen(true)}
              className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:bg-white hover:text-slate-900 hover:shadow-2xs"
            >
              12 Modules
            </button>
            <a
              href="#comparison"
              className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:bg-white hover:text-slate-900 hover:shadow-2xs"
            >
              Compare
            </a>
            <a
              href="#tiers"
              className="rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-900 shadow-2xs transition-all"
            >
              Deal Tiers
            </a>
            <a
              href="#faq"
              className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:bg-white hover:text-slate-900 hover:shadow-2xs"
            >
              FAQ
            </a>
          </nav>

          {/* Right: Redeem & Claim Actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:text-slate-900 sm:inline-block"
            >
              Sign In
            </Link>
            <Link href="/redeem">
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-full border-amber-300 bg-amber-50/80 px-3.5 text-xs font-bold text-amber-900 hover:bg-amber-100"
              >
                <KeyRound className="mr-1.5 h-3.5 w-3.5 text-amber-600" />
                Redeem Code
              </Button>
            </Link>
            <a href="#tiers">
              <Button
                size="sm"
                className="h-9 rounded-full bg-slate-900 px-4 text-xs font-semibold text-white shadow-xs hover:bg-indigo-600"
              >
                View LTD Tiers
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* HERO SECTION WITH LIVE INTERACTIVE WORKSPACE PREVIEW                  */}
      {/* ===================================================================== */}
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-white via-amber-50/20 to-slate-50 pt-10 pb-16 sm:pt-14 sm:pb-24">
        <div className="pointer-events-none absolute top-0 left-1/2 -z-10 h-[500px] w-[1000px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-amber-200/35 via-indigo-200/30 to-emerald-100/25 blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-4xl text-center">
            {/* Top AppSumo Badge */}
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-300/90 bg-amber-50 px-4 py-1.5 text-xs font-bold text-amber-900 shadow-2xs">
              <Award className="h-3.5 w-3.5 text-amber-600" />
              <span>EXCLUSIVE APPSUMO LIFETIME DEAL • PAY ONCE, OWN FOREVER</span>
            </div>

            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-[54px] lg:leading-[1.08]">
              Turn Raw Startup Ideas Into{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-amber-600 bg-clip-text text-transparent">
                Validated Business Plans &amp; 3-Year Financials
              </span>{' '}
              — For Life.
            </h1>

            <p className="mx-auto mt-5 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-lg">
              Ditch fragile Excel spreadsheets, $30/mo doc tools, and generic AI wrappers that only
              agree with you. Startup Preflight is the 12-module{' '}
              <strong className="font-semibold text-slate-900">
                Supportive Co-Founder &amp; Blind-Spot Engine
              </strong>{' '}
              that validates customer demand, aligns co-founders, models 3-year Pocket Profit, and
              compiles investor-ready plans.
            </p>

            {/* Primary CTAs */}
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a href="#tiers" className="w-full sm:w-auto">
                <Button className="h-12 w-full rounded-xl bg-indigo-600 px-7 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 sm:w-auto">
                  Explore Lifetime Deal Tiers ($59)
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
              <Link href="/redeem" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="h-12 w-full rounded-xl border-amber-300 bg-amber-50/70 px-6 text-sm font-bold text-amber-950 hover:bg-amber-100 sm:w-auto"
                >
                  <KeyRound className="mr-2 h-4 w-4 text-amber-600" />
                  Redeem AppSumo Code
                </Button>
              </Link>
              <button
                type="button"
                onClick={() => setIsModulesModalOpen(true)}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 sm:w-auto"
              >
                <Layers className="h-4 w-4 text-indigo-600" />
                See All 12 Modules
              </button>
            </div>

            {/* Trust Strip */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Zero recurring subscription fees
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Supports USD ($), EUR (€), GBP (£), CAD &amp; AUD
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Stack 2 codes for 3 Plans &amp; Co-Founder Alignment
              </span>
            </div>
          </div>

          {/* LIVE INTERACTIVE PLATFORM UI SHOWCASE */}
          <div id="preview" className="mt-10 scroll-mt-24 sm:mt-12">
            <HeroInteractiveProductShowcase edition="GLOBAL" />
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 4 STANDALONE TOOLS INCLUDED IN ONE LIFETIME DEAL                      */}
      {/* ===================================================================== */}
      <section id="features" className="scroll-mt-20 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="border-indigo-200 bg-indigo-50 text-indigo-700">
              4 Flagship Engines in 1 Deal
            </Badge>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Replace 4 Separate SaaS Subscriptions With One Connected Workspace
            </h2>
            <p className="mt-3 text-sm text-slate-600 sm:text-base">
              Every module shares a single source of truth. Change a hiring role in Module F or a
              product channel in Module D, and your 3-year Pocket Profit breakeven in Module H
              updates automatically.
            </p>
          </div>

          <div className="mt-12">
            <BentoFeatureVisualCards edition="GLOBAL" />
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* COMPARISON TABLE: WHY APPSUMO BUYERS SWITCH TO STARTUP PREFLIGHT      */}
      {/* ===================================================================== */}
      <section
        id="comparison"
        className="scroll-mt-20 border-y border-slate-200/80 bg-white py-16 sm:py-24"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="border-emerald-200 bg-emerald-50 text-emerald-800">
              Head-to-Head Comparison
            </Badge>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Why Founders Ditch Generic Chatbots &amp; Legacy Plan Builders
            </h2>
            <p className="mt-3 text-sm text-slate-600 sm:text-base">
              Most tools just generate walls of generic AI text that investors immediately ignore.
              Startup Preflight builds an interconnected commercial, financial, and validation data
              model.
            </p>
          </div>

          <div className="mt-10 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full min-w-[680px] border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="p-4 font-bold text-slate-700">Capability</th>
                  <th className="bg-indigo-50/80 p-4 font-black text-indigo-950">
                    Startup Preflight (LTD)
                  </th>
                  <th className="p-4 font-semibold text-slate-500">
                    Generic AI / ChatGPT Wrappers
                  </th>
                  <th className="p-4 font-semibold text-slate-500">
                    Legacy Plan Software ($30/mo)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-4 font-semibold text-slate-900">
                    &ldquo;Capture First, Expand Second&rdquo; Blind-Spot AI
                  </td>
                  <td className="bg-indigo-50/40 p-4 font-bold text-emerald-700">
                    ✓ Built-in across all 12 Modules
                  </td>
                  <td className="p-4 text-slate-500">✗ Sycophantic — agrees with bad ideas</td>
                  <td className="p-4 text-slate-500">✗ Static text boxes only</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-slate-900">
                    Hosted Public Customer Survey &amp; Waitlist (/v/[slug])
                  </td>
                  <td className="bg-indigo-50/40 p-4 font-bold text-emerald-700">
                    ✓ Included + QR Kit &amp; AI Sentiment
                  </td>
                  <td className="p-4 text-slate-500">✗ Cannot host public forms</td>
                  <td className="p-4 text-slate-500">✗ Requires separate Typeform ($29/mo)</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-slate-900">
                    Blind-Reveal Co-Founder Alignment &amp; Equity Calculator
                  </td>
                  <td className="bg-indigo-50/40 p-4 font-bold text-emerald-700">
                    ✓ 12 Awkward Questions + Heatmap
                  </td>
                  <td className="p-4 text-slate-500">✗ None</td>
                  <td className="p-4 text-slate-500">✗ None</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-slate-900">
                    3-Year &ldquo;Pocket Profit&rdquo; &amp; What-If Stress Sandbox
                  </td>
                  <td className="bg-indigo-50/40 p-4 font-bold text-emerald-700">
                    ✓ Interactive visual breakeven engine
                  </td>
                  <td className="p-4 text-slate-500">✗ Hallucinates financial math</td>
                  <td className="p-4 text-slate-500">✗ Rigid accounting tables</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-slate-900">
                    Pre-Flight Contradiction &amp; Underwriting Audit
                  </td>
                  <td className="bg-indigo-50/40 p-4 font-bold text-emerald-700">
                    ✓ Cross-checks narrative vs. financials
                  </td>
                  <td className="p-4 text-slate-500">✗ No cross-module memory</td>
                  <td className="p-4 text-slate-500">✗ Manual human review required</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-slate-900">Cost Over 3 Years</td>
                  <td className="bg-indigo-50/40 p-4 font-black text-indigo-700">
                    $59 – $118 Once (Lifetime)
                  </td>
                  <td className="p-4 text-slate-500">$720+ ($20/mo recurring)</td>
                  <td className="p-4 text-slate-500">$1,080+ ($30/mo recurring)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* APPSUMO 2-TIER STACKABLE DEAL BREAKDOWN                               */}
      {/* ===================================================================== */}
      <section id="tiers" className="scroll-mt-20 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="border-amber-300 bg-amber-50 text-amber-900">
              Stackable AppSumo Lifetime Tiers
            </Badge>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Choose Your Lifetime Tier (Stack Up to 2 Codes)
            </h2>
            <p className="mt-3 text-sm text-slate-600 sm:text-base">
              Every tier includes lifetime access to all 12 Startup Preflight modules (A–L), the
              hosted Customer Survey &amp; Waitlist engine, and the 3-Year Pocket Profit model.
              Stack 2 codes to unlock 3 Active Plans, 3 Co-Founder Seats, and the Blind-Reveal Co-Founder Alignment Engine.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-6 lg:grid-cols-2">
            {/* TIER 1: 1 CODE */}
            <div className="flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-8">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                    License Tier 1 • 1 Code
                  </span>
                  <span className="text-xs font-semibold text-slate-400 line-through">
                    $278/yr value
                  </span>
                </div>
                <h3 className="mt-4 text-xl font-black text-slate-900">Solo Founder LTD</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Ideal for a solo founder turning one startup idea into a validated business plan.
                </p>

                <div className="mt-5 flex items-baseline gap-2 border-b border-slate-100 pb-5">
                  <span className="text-4xl font-black tracking-tight text-slate-900">$59</span>
                  <span className="text-xs font-semibold text-slate-500">
                    one-time payment • lifetime access
                  </span>
                </div>

                <ul className="mt-5 space-y-3 text-xs text-slate-700">
                  <li className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>
                      <strong>1 Active Startup Plan</strong> (with Clone/Pivot support)
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>
                      <strong>1 Founder Seat</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>
                      <strong>All 12 Founder Modules (A–L)</strong> unlocked for life
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>
                      <strong>Hosted Public Validation Survey &amp; Waitlist</strong> (/v/[slug])
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>
                      <strong>150 AI Credits / month</strong> (resets monthly for life)
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>
                      <strong>Standard Business Plan + IE/UK Compilers</strong>
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 space-y-2.5">
                <Link href="/redeem?tier=1" className="block">
                  <Button className="h-11 w-full rounded-xl bg-slate-900 text-xs font-bold text-white hover:bg-indigo-600">
                    <KeyRound className="mr-1.5 h-4 w-4" />
                    Redeem Tier 1 Code
                  </Button>
                </Link>
                <Link
                  href="/register"
                  className="block text-center text-[11px] font-semibold text-slate-500 hover:text-indigo-600"
                >
                  New here? Create account &amp; redeem →
                </Link>
              </div>
            </div>

            {/* TIER 2: 2 CODES (MOST POPULAR) */}
            <div className="relative flex flex-col justify-between rounded-3xl border-2 border-indigo-600 bg-white p-6 shadow-xl shadow-indigo-900/10 sm:p-8">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-[11px] font-bold tracking-wider text-white uppercase shadow-sm">
                Most Popular • Co-Founder Ready
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                    License Tier 2 • 2 Codes
                  </span>
                  <span className="text-xs font-semibold text-slate-400 line-through">
                    $438/yr value
                  </span>
                </div>
                <h3 className="mt-4 text-xl font-black text-slate-900">
                  Co-Founder &amp; Multi-Bet LTD
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Test up to 3 startup ideas and unlock the Blind-Reveal Co-Founder Alignment
                  Engine.
                </p>

                <div className="mt-5 flex items-baseline gap-2 border-b border-slate-100 pb-5">
                  <span className="text-4xl font-black tracking-tight text-slate-900">$118</span>
                  <span className="text-xs font-semibold text-slate-500">
                    2 codes stacked • lifetime access
                  </span>
                </div>

                <ul className="mt-5 space-y-3 text-xs text-slate-700">
                  <li className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                    <span>
                      <strong>3 Active Startup Plans</strong> (compare multiple ideas side by side)
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                    <span>
                      <strong>3 Collaborator / Co-Founder Seats</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                    <span>
                      <strong>Unlocks Multi-Seat Module F Co-Founder Alignment:</strong> Blind-Reveal
                      12 Awkward Questions Survey &amp; Heatmap
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                    <span>
                      <strong>450 AI Credits / month</strong> (resets monthly for life)
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                    <span>
                      <strong>Full Module L Pre-Flight Contradiction Audit</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                    <span>Everything in Tier 1 included</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 space-y-2.5">
                <Link href="/redeem?tier=2" className="block">
                  <Button className="h-11 w-full rounded-xl bg-indigo-600 text-xs font-bold text-white shadow-md hover:bg-indigo-500">
                    <KeyRound className="mr-1.5 h-4 w-4" />
                    Redeem / Stack 2 Codes (Tier 2)
                  </Button>
                </Link>
                <Link
                  href="/register"
                  className="block text-center text-[11px] font-semibold text-indigo-600 hover:underline"
                >
                  New here? Create account &amp; stack codes →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* FOUNDER NOTE FOR SUMO-LINGS                                           */}
      {/* ===================================================================== */}
      <section className="border-t border-slate-200/80 bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="rounded-3xl border border-slate-200/90 bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 p-6 shadow-xs sm:p-10">
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
                <div className="max-w-xl">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[11px] font-bold text-indigo-700">
                    <Sparkles className="h-3.5 w-3.5" />A Note to Sumo-lings from Founder Thomas
                    Walsh
                  </span>
                  <h3 className="mt-2.5 text-xl font-black text-slate-900 sm:text-2xl">
                    Built on 20+ Years of Engineering &amp; 400+ Startups Scaled
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
                    &ldquo;We didn&apos;t build Startup Preflight as a quick weekend AI wrapper.
                    Every module encodes two decades of real-world software architecture, commercial
                    modeling, and startup underwriting. Whether you&apos;re launching your first
                    SaaS, opening a physical business, or advising clients, our goal is to help you
                    spot fatal blind spots on paper before they cost you real money.&rdquo;
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

      {/* ===================================================================== */}
      {/* APPSUMO FAQ ACCORDION                                                 */}
      {/* ===================================================================== */}
      <section id="faq" className="scroll-mt-20 border-t border-slate-200/80 bg-slate-50 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center">
            <Badge className="border-slate-300 bg-white text-slate-700">
              AppSumo Buyer FAQ
            </Badge>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Frequently Asked Questions About the Lifetime Deal
            </h2>
          </div>

          <div className="mt-10 space-y-3">
            {APPSUMO_FAQS.map((item, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div
                  key={item.q}
                  className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-bold text-slate-900 hover:bg-slate-50/70"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                        isOpen ? 'rotate-180 text-indigo-600' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="border-t border-slate-100 px-5 py-4 text-xs leading-relaxed text-slate-600 sm:text-sm">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 12-MODULE DRAWER MODAL                                                */}
      {/* ===================================================================== */}
      {isModulesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="relative max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <Badge className="border-indigo-200 bg-indigo-50 text-indigo-700">
                  Complete 12-Module System
                </Badge>
                <h3 className="mt-1 text-xl font-black text-slate-900">
                  All 12 Modules Included in Every AppSumo Tier
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Every step includes &ldquo;Why Are We Asking This?&rdquo; micro-coaching, industry
                  examples, and a &ldquo;Things to Consider&rdquo; blind-spot review.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModulesModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {TWELVE_MODULES.map((m) => (
                <div
                  key={m.code}
                  className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-indigo-600">{m.code}</span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      {m.tag}
                    </span>
                  </div>
                  <h4 className="mt-1.5 text-sm font-bold text-slate-900">{m.title}</h4>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* UNIFIED MODERN FOOTER                                                 */}
      {/* ===================================================================== */}
      <footer className="border-t border-slate-200 bg-slate-950 py-12 text-slate-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-8 pb-10 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5">
                <BrandLogo variant="full" size="sm" theme="dark" />
              </div>
              <p className="mt-3 max-w-md text-xs leading-relaxed text-slate-400">
                The Supportive Co-Founder &amp; Blind-Spot Engine. Capture your vision in plain
                English, validate customer demand, align co-founders, model 3-year Pocket Profit,
                and compile investor- and grant-ready business plans.
              </p>
            </div>

            <div>
              <p className="text-xs font-bold tracking-wider text-white uppercase">
                Regional Editions
              </p>
              <ul className="mt-3 space-y-2 text-xs">
                <li>
                  <Link href="/" className="hover:text-white">
                    🌍 Global Business Plan Edition
                  </Link>
                </li>
                <li>
                  <Link href="/ie" className="hover:text-white">
                    🇮🇪 Ireland Grants &amp; LEO Edition (/ie)
                  </Link>
                </li>
                <li>
                  <Link href="/uk" className="hover:text-white">
                    🇬🇧 UK Loans, Innovate UK &amp; SEIS Edition (/uk)
                  </Link>
                </li>
                <li>
                  <Link href="/appsumo" className="text-white">
                    🌮 AppSumo Lifetime Deal Hub
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold tracking-wider text-white uppercase">Platform</p>
              <ul className="mt-3 space-y-2 text-xs">
                <li>
                  <Link href="/redeem" className="hover:text-white">
                    Redeem AppSumo Code
                  </Link>
                </li>
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
                  <Link href="/about-founder" className="hover:text-white">
                    Meet the Founder (Thomas Walsh)
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-800/80 pt-6 text-[11px] text-slate-500 sm:flex-row">
            <p>© {new Date().getFullYear()} Startup Preflight. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1">
                <Globe className="h-3.5 w-3.5 text-indigo-400" />
                GDPR Compliant • AES-256 Encrypted Vault
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
