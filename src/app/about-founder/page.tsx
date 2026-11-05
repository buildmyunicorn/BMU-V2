'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Rocket,
  ArrowRight,
  Award,
  Code2,
  Briefcase,
  Globe,
  CheckCircle2,
  Sparkles,
  Linkedin,
  Building2,
  ShieldCheck,
  TrendingUp,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StripeSandboxBadge } from '@/components/ui/stripe-sandbox-badge';
import { BrandLogo } from '@/components/ui/brand-logo';

export default function AboutFounderPage() {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-600 selection:text-white">
      <StripeSandboxBadge />

      {/* ===================================================================== */}
      {/* MODERN SINGLE-BAR FLOATING-PILL HEADER                                */}
      {/* ===================================================================== */}
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Left: Clean Brand Logo */}
          <Link href="/" className="group flex items-center">
            <BrandLogo variant="full" size="sm" theme="light" />
          </Link>

          {/* Center: Modern Floating Pill Links */}
          <nav className="hidden items-center gap-1 rounded-full border border-slate-200/80 bg-slate-100/75 p-1 md:flex">
            <Link
              href="/#platform-preview"
              className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:bg-white hover:text-slate-900 hover:shadow-2xs"
            >
              Product
            </Link>
            <Link
              href="/#how-it-works"
              className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:bg-white hover:text-slate-900 hover:shadow-2xs"
            >
              12 Modules
            </Link>
            <Link
              href="/#pricing"
              className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:bg-white hover:text-slate-900 hover:shadow-2xs"
            >
              Pricing
            </Link>
            <Link
              href="/about-founder"
              className="rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-900 shadow-2xs transition-all"
            >
              Founder
            </Link>
          </nav>

          {/* Right: Compact Edition Switcher + Auth Actions */}
          <div className="flex items-center gap-2.5">
            <div
              className="hidden items-center rounded-full border border-slate-200 bg-slate-100/80 p-0.5 text-[11px] font-semibold sm:flex"
              aria-label="Select Regional Edition"
            >
              <Link
                href="/"
                className="rounded-full px-2.5 py-1 text-slate-600 transition-colors hover:text-slate-900"
              >
                🌍 Global
              </Link>
              <Link
                href="/ie"
                className="rounded-full px-2.5 py-1 text-slate-600 transition-colors hover:text-slate-900"
              >
                🇮🇪 IE
              </Link>
              <Link
                href="/uk"
                className="rounded-full px-2.5 py-1 text-slate-600 transition-colors hover:text-slate-900"
              >
                🇬🇧 UK
              </Link>
            </div>

            <Link
              href="/login"
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:text-slate-900"
            >
              Sign In
            </Link>

            <Link href="/register">
              <Button
                size="sm"
                className="h-9 rounded-full bg-slate-900 px-4 text-xs font-semibold text-white shadow-xs hover:bg-indigo-600"
              >
                Get Started
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* HERO & FOUNDER BIO SECTION                                            */}
      {/* ===================================================================== */}
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-white via-indigo-50/25 to-slate-50 pt-12 pb-20 sm:pt-16 sm:pb-24">
        <div className="pointer-events-none absolute top-0 left-1/2 -z-10 h-[460px] w-[960px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-200/35 via-violet-100/25 to-emerald-100/25 blur-3xl" />

        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {/* Top Pill */}
          <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-white px-4 py-1.5 text-xs font-semibold text-indigo-950 shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              <span>Built by a Practitioner — Not a Prompt-Wrapper Agency</span>
            </div>

            <Link
              href="/"
              className="text-xs font-semibold text-slate-600 transition-colors hover:text-indigo-600"
            >
              ← Back to Startup Preflight Overview
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
            {/* LEFT COLUMN: FOUNDER PROFILE CARD */}
            <div className="lg:col-span-4">
              <div className="sticky top-24 overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-lg shadow-slate-900/5">
                {/* Founder Portrait */}
                <div className="relative mx-auto mb-6 h-[260px] w-full max-w-[260px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-md">
                  <img
                    src="/images/founder-thomas-walsh.jpg"
                    alt="Thomas Walsh — Founder of Startup Preflight"
                    width={260}
                    height={260}
                    className="h-full w-full object-cover object-top"
                  />

                  {/* Bottom status badge overlay */}
                  <div className="absolute right-3 bottom-3 left-3 rounded-xl border border-slate-200/90 bg-white/95 px-3 py-2 shadow-sm backdrop-blur-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-900">Thomas Walsh</p>
                        <p className="text-[10px] font-medium text-indigo-600">
                          Founder, Startup Preflight
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        Dublin, IE 🇮🇪
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Career Proof Pills */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 px-3.5 py-2.5">
                    <TrendingUp className="h-4 w-4 shrink-0 text-emerald-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">400+ Startups Scaled</p>
                      <p className="text-[11px] text-slate-500">
                        Mentored &amp; scaled across Ireland &amp; Europe
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 px-3.5 py-2.5">
                    <Code2 className="h-4 w-4 shrink-0 text-indigo-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        20+ Years in Tech &amp; Cloud
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Software Dev, Solution Architecture &amp; CTO Advisory
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 px-3.5 py-2.5">
                    <Award className="h-4 w-4 shrink-0 text-amber-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">3x Builder</p>
                      <p className="text-[11px] text-slate-500">
                        Founded 2 companies • Brought 3rd from zero to life
                      </p>
                    </div>
                  </div>
                </div>

                {/* Social / Connect Links */}
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <a
                    href="https://www.linkedin.com/in/twalsh-start-ups/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50/60 hover:text-indigo-700"
                  >
                    <Linkedin className="h-4 w-4 text-indigo-600" />
                    Connect with Thomas on LinkedIn
                  </a>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: BIO & WHY STARTUP PREFLIGHT EXISTS */}
            <div className="space-y-8 lg:col-span-8">
              <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-10">
                <p className="text-xs font-bold tracking-wider text-indigo-600 uppercase">
                  Meet the Founder
                </p>
                <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-4xl">
                  &ldquo;I watched hundreds of brilliant founders get rejected because their great
                  idea was trapped in a messy document or broken spreadsheet.&rdquo;
                </h1>

                <div className="mt-6 space-y-4 text-sm leading-relaxed text-slate-600 sm:text-base">
                  <p>
                    Hi, I&apos;m <strong className="text-slate-900">Thomas Walsh</strong>. Over the
                    last two decades, I&apos;ve lived on both sides of the startup table — as a
                    hands-on software engineer and solution architect, and as a commercial growth
                    advisor who has helped{' '}
                    <strong className="text-slate-900">over 400 startups scale</strong> across
                    Ireland, the UK, and internationally.
                  </p>
                  <p>
                    I&apos;ve founded two of my own companies and helped bring a third from a blank
                    sheet of paper to market reality. Along the way, I kept seeing the exact same
                    painful pattern repeat itself:
                  </p>
                  <p>
                    A founder has genuine domain expertise and a real customer problem worth
                    solving. Then someone asks them for a{' '}
                    <strong className="text-slate-900">
                      structured business plan, a 36-month cashflow model, or an official Local
                      Enterprise Office (LEO), Enterprise Ireland, or UK Start Up Loan / Innovate UK
                      application
                    </strong>
                    . Suddenly, momentum grinds to a halt.
                  </p>
                  <p>
                    They either waste six weeks wrestling with fragile Excel templates and generic
                    AI prompts that hallucinate market sizes, or they pay €3,000+ to a consultant to
                    write a static 30-page PDF that goes out of date the moment a customer changes
                    their mind.
                  </p>
                </div>

                {/* Highlight Quote Box */}
                <div className="mt-8 rounded-2xl border border-indigo-200/80 bg-indigo-50/60 p-5 sm:p-6">
                  <p className="text-xs font-bold tracking-wider text-indigo-700 uppercase">
                    Why I Built Startup Preflight
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">
                    I built <strong className="text-slate-900">Startup Preflight</strong> to put my
                    entire 20-year playbook — technical architecture, commercial strategy, unit
                    economics, and grant underwriting rules — into an opinionated, 12-module
                    co-pilot. It follows one simple rule:{' '}
                    <span className="font-semibold text-indigo-700">
                      Capture First, Expand Second.
                    </span>{' '}
                    We never criticize a raw idea upfront. First, we help you extract and structure
                    your vision cleanly; then, we stress-test the blind spots before an investor,
                    bank manager, or grant committee ever sees it.
                  </p>
                </div>
              </div>

              {/* TWO PILLARS: BUSINESS + TECHNICAL EXPERIENCE */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Business & Startup Track Record */}
                <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">
                    The Commercial &amp; Grant Brain
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    Having worked directly with hundreds of early-stage founders and enterprise
                    programmes, Thomas built Startup Preflight around what real-world evaluators
                    actually look for:
                  </p>
                  <ul className="mt-4 space-y-2.5 text-xs text-slate-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>
                        <strong>400+ Startups Mentored &amp; Scaled:</strong> Deep pattern
                        recognition across B2B SaaS, e-commerce, services, food, and hardware.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>
                        <strong>Real Customer Proof (&ldquo;Mom Test&rdquo;):</strong> Why Module C
                        forces real customer interviews and waitlist evidence instead of wishful
                        assumptions.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>
                        <strong>Co-Founder Survival:</strong> Why Module F tackles the 12 awkward
                        questions on equity, cash burn, and exit expectations before incorporation.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>
                        <strong>Grant &amp; Investor Readiness:</strong> Built-in rules for IE LEO,
                        Enterprise Ireland, UK Start Up Loans, Innovate UK, and HMRC SEIS/EIS.
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Technical & Architecture Track Record */}
                <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700">
                    <Code2 className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">
                    The Technical &amp; Architecture Brain
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    With 20+ years across software development, cloud engineering, and solution
                    architecture, Thomas designed Module D &amp; E specifically to save non-technical
                    and technical founders alike from costly build mistakes:
                  </p>
                  <ul className="mt-4 space-y-2.5 text-xs text-slate-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                      <span>
                        <strong>20+ Years in Software &amp; Cloud:</strong> Hands-on engineering
                        and enterprise solution architecture experience from code to cloud scale.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                      <span>
                        <strong>Build-vs-Buy Guardrails:</strong> Preventing founders from spending
                        €25,000+ custom-coding features that can be validated with off-the-shelf
                        tools in week one.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                      <span>
                        <strong>Technical Merit &amp; Work Packages:</strong> Automatically
                        structuring product roadmaps into grant-compliant Work Packages (WP1–WPn).
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                      <span>
                        <strong>Unit Economics &amp; Margin Reality:</strong> Factoring cloud costs,
                        app store commissions, and payment fees directly into Module H breakeven.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* DIRECT FOUNDER CONTACT CARD */}
              <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-8">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <div className="inline-flex items-center gap-2 text-xs font-bold tracking-wider text-indigo-600 uppercase">
                      <Building2 className="h-3.5 w-3.5" />
                      <span>Accelerators, Universities, LEOs &amp; Growth Hubs</span>
                    </div>
                    <h3 className="mt-1 text-lg font-bold text-slate-900">
                      Running a startup cohort or mentoring programme?
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-sm">
                      We partner directly with Local Enterprise Offices, University Incubators, and
                      UK Growth Hubs via our Cohort Pass &amp; Mentor Portal. Reach out to Thomas
                      directly to discuss a pilot cohort.
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-3">
                    <a
                      href="mailto:tom@startuppreflight.com?subject=Startup%20Preflight%20Enquiry"
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      <Mail className="h-4 w-4 text-indigo-600" />
                      tom@startuppreflight.com
                    </a>
                  </div>
                </div>
              </div>

              {/* BOTTOM CTA BANNER */}
              <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl sm:p-8">
                <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                      <ShieldCheck className="h-4 w-4" />
                      <span>Start With Module A Free — No Credit Card Required</span>
                    </div>
                    <h3 className="mt-1 text-xl font-black text-white">
                      Ready to stress-test your startup idea with Thomas&apos;s 12-module system?
                    </h3>
                    <p className="mt-1 text-xs text-indigo-100/80 sm:text-sm">
                      Complete your 1-Page Concept Canvas, Customer Storyboard, and 100-Point
                      Founder-Idea Fit Scorecard in 10 minutes.
                    </p>
                  </div>
                  <div className="flex w-full shrink-0 flex-col gap-2.5 sm:w-auto sm:flex-row">
                    <Link href="/register" className="w-full sm:w-auto">
                      <Button className="h-11 w-full rounded-xl bg-indigo-600 px-6 text-xs font-bold text-white shadow-md hover:bg-indigo-500 sm:w-auto">
                        Start Module A Free
                        <ArrowRight className="ml-1.5 h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/" className="w-full sm:w-auto">
                      <Button
                        variant="outline"
                        className="h-11 w-full rounded-xl border-white/20 bg-white/10 px-5 text-xs font-semibold text-white hover:bg-white/15 sm:w-auto"
                      >
                        Explore Platform
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* UNIFIED MODERN FOOTER                                                 */}
      {/* ===================================================================== */}
      <footer className="border-t border-slate-200 bg-slate-950 py-12 text-slate-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-8 pb-10 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                  <Rocket className="h-4 w-4" />
                </div>
                <span className="text-base font-extrabold text-white">
                  Startup<span className="text-indigo-400">Preflight</span>
                </span>
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
                  <Link href="/appsumo" className="hover:text-white">
                    🌮 AppSumo Lifetime Deal Hub
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold tracking-wider text-white uppercase">Platform</p>
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
                    Redeem Partner / Cohort Code
                  </Link>
                </li>
                <li>
                  <Link href="/about-founder" className="text-white">
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
