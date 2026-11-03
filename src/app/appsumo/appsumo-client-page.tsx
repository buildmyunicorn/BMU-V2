'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  BarChart3,
  MessageSquare,
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Zap,
  Globe2,
  Lock,
  Layers,
  Flame,
  Check,
  X,
  Target,
  QrCode,
  Share2,
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

export default function AppSumoLandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 selection:bg-amber-500 selection:text-slate-950">
      {/* Top AppSumo Exclusive Banner */}
      <div className="border-b border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-amber-500/10 px-4 py-2.5 text-center text-xs font-medium text-amber-200">
        <span className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-amber-400">
          <Sparkles className="h-3.5 w-3.5" /> AppSumo Exclusive Lifetime Deal
        </span>
        <span className="mx-2 hidden text-amber-400/50 sm:inline">•</span>
        <span className="hidden sm:inline">
          Get lifetime access with zero monthly recurring software fees.
        </span>
        <Link
          href="/redeem"
          className="ml-3 inline-flex items-center font-bold text-amber-300 underline decoration-amber-400/50 underline-offset-2 hover:text-white"
        >
          Redeem Your Code <ArrowRight className="ml-1 h-3 w-3" />
        </Link>
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-amber-500 text-white shadow-lg shadow-indigo-500/20">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-white">
                  Startup Preflight
                </span>
                <Badge className="border-amber-500/30 bg-amber-500/10 text-[10px] font-semibold text-amber-300">
                  AppSumo Edition
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/redeem">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-700 bg-slate-900/80 text-xs font-semibold text-slate-200 hover:border-slate-600 hover:bg-slate-800 hover:text-white"
              >
                Redeem Code
              </Button>
            </Link>
            <Link href="/register?deal=appsumo">
              <Button
                size="sm"
                className="bg-amber-500 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/20"
              >
                Get Started
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pt-16 pb-20 sm:px-6 lg:pt-24 lg:pb-28">
        {/* Glow ambient background effects */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="pointer-events-none absolute top-1/3 -right-20 -z-10 h-80 w-80 rounded-full bg-amber-500/10 blur-[100px]" />

        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold text-indigo-300 backdrop-blur-xs">
            <Flame className="h-3.5 w-3.5 text-amber-400" />
            <span>Built for Founders, Indie Hackers &amp; Early-Stage Builders</span>
          </div>

          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Stop staring at a blank page.{' '}
            <span className="block mt-2 bg-gradient-to-r from-indigo-400 via-indigo-200 to-amber-300 bg-clip-text text-transparent">
              Build your business plan, validation waitlist &amp; financials in hours.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-slate-300 sm:text-lg sm:leading-relaxed">
            Turn your raw founder brain-dump into an investor-ready business plan, 
            instant hosted customer validation waitlist, and interactive 3-year financial model — 
            without expensive consultants or complex spreadsheets.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link href="/register?deal=appsumo" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full bg-amber-500 px-8 font-bold text-slate-950 hover:bg-amber-400 shadow-xl shadow-amber-500/20 sm:w-auto"
              >
                Claim Your Lifetime Deal
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/redeem" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full border-slate-700 bg-slate-900/60 font-semibold text-slate-200 hover:border-slate-600 hover:bg-slate-800 hover:text-white sm:w-auto"
              >
                Already have an AppSumo Code?
              </Button>
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Lifetime access • Zero subscriptions</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Bank &amp; Investor Ready</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>60-Day Money-Back Guarantee</span>
            </div>
          </div>
        </div>

        {/* Hero Interactive App Mockup Preview */}
        <div className="mx-auto mt-14 max-w-5xl rounded-2xl border border-slate-800 bg-slate-900/70 p-2 shadow-2xl backdrop-blur-xl sm:p-4">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 pb-3">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-rose-500/80" />
              <div className="h-3 w-3 rounded-full bg-amber-500/80" />
              <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-xs font-medium text-slate-400">
                Startup Preflight OS — Active Workspace
              </span>
            </div>
            <Badge className="bg-indigo-500/20 text-indigo-300 text-[10px] border-indigo-500/30">
              Live AI Co-Founder Active
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-12">
            {/* Left Column: Flow & Validation */}
            <div className="space-y-4 lg:col-span-7">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/20 text-xs font-bold text-indigo-400">
                      1
                    </span>
                    <span className="text-sm font-bold text-slate-200">
                      Idea Dump ➔ 1-Page Concept Canvas
                    </span>
                  </div>
                  <Badge variant="outline" className="border-emerald-500/30 text-[10px] text-emerald-400">
                    Auto-Synthesized
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Extracts core customer pain points, competitive edge, and unit model from unstructured notes in seconds.
                </p>
              </div>

              <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/20 text-xs font-bold text-amber-400">
                      2
                    </span>
                    <span className="text-sm font-bold text-slate-200">
                      Hosted Waitlist &amp; Mom-Test Survey Engine
                    </span>
                  </div>
                  <Badge className="bg-amber-500/20 text-[10px] text-amber-300 border-amber-500/30">
                    Live Public Page Included
                  </Badge>
                </div>
                <div className="mt-3 flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/90 p-2.5 font-mono text-xs text-indigo-300">
                  <span>startuppreflight.com/v/your-startup</span>
                  <Share2 className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Capture early customer emails and unbiased willingness-to-pay quotes before writing a line of code.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/20 text-xs font-bold text-indigo-400">
                      3
                    </span>
                    <span className="text-sm font-bold text-slate-200">
                      12 Awkward Co-Founder Questions
                    </span>
                  </div>
                  <Badge variant="outline" className="border-slate-700 text-[10px] text-slate-400">
                    Blind-Reveal
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Uncover founder misalignments on equity, time commitment, and exit expectations before they sink the company.
                </p>
              </div>
            </div>

            {/* Right Column: Pocket-Profit Financial Visualizer */}
            <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-4 lg:col-span-5">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    &quot;Pocket Profit&quot; Visual Breakeven
                  </span>
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="mt-3 rounded-lg border border-slate-800/80 bg-slate-900/50 p-3">
                  <div className="text-[11px] text-slate-400">Monthly Breakeven Target</div>
                  <div className="mt-1 text-2xl font-extrabold text-white">
                    42 Customers <span className="text-xs font-normal text-emerald-400">(@ $99/mo)</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800 pt-2">
                    <span>COGS + Platform Fees: $8.50/user</span>
                    <span className="text-emerald-400 font-semibold">91.4% Gross Margin</span>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  <div className="rounded-lg bg-slate-900/40 p-2.5 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Worst-Case Sandbox</span>
                      <span className="text-rose-400 font-mono">68 Users</span>
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-900/40 p-2.5 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Ramen Survival Runway</span>
                      <span className="text-amber-400 font-mono">14 Months</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-2.5 text-center text-xs font-medium text-emerald-300">
                ✨ Zero spreadsheet formulas required
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The 4 Core Engines for Global & US Founders */}
      <section className="border-t border-slate-900 bg-slate-950/40 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">
              The Startup Preflight Operating System
            </h2>
            <p className="mt-2 text-2xl font-extrabold text-white sm:text-4xl">
              Everything you need to launch with conviction
            </p>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400">
              Stop stitching together 5 different tools. We replaced expensive consultants, 
              confusing financial templates, and survey builders with a unified founder hub.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Engine 1: Validation */}
            <Card className="border-slate-800 bg-slate-900/60 transition-all hover:border-indigo-500/50">
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <CardTitle className="mt-2 text-lg font-bold text-white">
                  1. Hosted Customer Validation &amp; Waitlist Engine
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Generate unbiased &quot;Mom Test&quot; surveys that uncover genuine customer pain without leading questions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>Instant public survey page (<code className="text-indigo-300 font-mono">startuppreflight.com/v/[slug]</code>)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>Lead capture waitlist with automated early-adopter tagging</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>1-on-1 interview logger with AI sentiment analysis</span>
                </div>
              </CardContent>
            </Card>

            {/* Engine 2: Pocket Profit */}
            <Card className="border-slate-800 bg-slate-900/60 transition-all hover:border-indigo-500/50">
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                  <DollarSign className="h-5 w-5" />
                </div>
                <CardTitle className="mt-2 text-lg font-bold text-white">
                  2. &quot;Pocket Profit&quot; Visual Breakeven Engine
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Understand your true unit economics including platform friction (Stripe fees, Shopify, App Store cuts).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>Interactive Price vs. Volume vs. Friction Crossover Graph</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>3-Year Time Horizon Switcher (Year 1, Year 2, Year 3 projection)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>&quot;What-If Sandbox&quot; presets: Worst-Case, Ramen Survival, Aggressive Growth</span>
                </div>
              </CardContent>
            </Card>

            {/* Engine 3: Co-Founder Alignment */}
            <Card className="border-slate-800 bg-slate-900/60 transition-all hover:border-indigo-500/50">
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Users className="h-5 w-5" />
                </div>
                <CardTitle className="mt-2 text-lg font-bold text-white">
                  3. Blind-Reveal Co-Founder Alignment Survey
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  The #1 killer of early startups is founder conflict. Solve it before you incorporate.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>12 Awkward Questions covering equity, vesting, work hours &amp; exit goals</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>Blind-reveal mechanism (neither founder sees answers until both complete)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>Side-by-side alignment heatmap highlighting dangerous friction points</span>
                </div>
              </CardContent>
            </Card>

            {/* Engine 4: Document Compiler */}
            <Card className="border-slate-800 bg-slate-900/60 transition-all hover:border-indigo-500/50">
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                  <FileText className="h-5 w-5" />
                </div>
                <CardTitle className="mt-2 text-lg font-bold text-white">
                  4. Bank &amp; Investor Business Plan Compiler
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Compile your structured data into executive-grade PDF and presentation briefs in 1 click.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>Ready for US SBA 7(a) Bank Loans, Angels &amp; Venture Investors</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>AI Pre-Flight Audit: Finds narrative contradictions &amp; financial math errors</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>Live customer proof blocks directly injected from your validation surveys</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Comparison: Startup Preflight vs The Rest */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Why Founders Choose Startup Preflight
            </h2>
            <p className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">
              Better than static templates. Cheaper than consultants.
            </p>
          </div>

          <div className="mt-10 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/50">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-900 text-slate-300">
                <tr>
                  <th className="p-3.5 font-semibold">Capability</th>
                  <th className="p-3.5 font-bold text-amber-400">Startup Preflight (LTD)</th>
                  <th className="p-3.5 text-slate-400">LivePlan / Standard SaaS</th>
                  <th className="p-3.5 text-slate-400">Raw ChatGPT / Claude</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                <tr>
                  <td className="p-3.5 font-medium">Pricing Model</td>
                  <td className="p-3.5 font-bold text-emerald-400">Lifetime Deal (Pay Once)</td>
                  <td className="p-3.5 text-rose-400">$20–$40/mo ongoing</td>
                  <td className="p-3.5 text-slate-400">$20/mo subscription</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-medium">Interactive Financial Sandbox</td>
                  <td className="p-3.5 font-semibold text-emerald-400">
                    <Check className="inline h-4 w-4 mr-1" /> Built-in (No spreadsheets)
                  </td>
                  <td className="p-3.5 text-slate-400">Complex tables required</td>
                  <td className="p-3.5 text-rose-400">
                    <X className="inline h-4 w-4 mr-1" /> Hallucinates math
                  </td>
                </tr>
                <tr>
                  <td className="p-3.5 font-medium">Hosted Validation Survey &amp; Waitlist</td>
                  <td className="p-3.5 font-semibold text-emerald-400">
                    <Check className="inline h-4 w-4 mr-1" /> Included (1-click link)
                  </td>
                  <td className="p-3.5 text-rose-400">
                    <X className="inline h-4 w-4 mr-1" /> No (Requires Typeform)
                  </td>
                  <td className="p-3.5 text-rose-400">
                    <X className="inline h-4 w-4 mr-1" /> No hosting capability
                  </td>
                </tr>
                <tr>
                  <td className="p-3.5 font-medium">Co-Founder Blind Alignment Survey</td>
                  <td className="p-3.5 font-semibold text-emerald-400">
                    <Check className="inline h-4 w-4 mr-1" /> Included (12 questions)
                  </td>
                  <td className="p-3.5 text-rose-400">
                    <X className="inline h-4 w-4 mr-1" /> Not available
                  </td>
                  <td className="p-3.5 text-rose-400">
                    <X className="inline h-4 w-4 mr-1" /> Not available
                  </td>
                </tr>
                <tr>
                  <td className="p-3.5 font-medium">Contradiction &amp; Blind-Spot Audit</td>
                  <td className="p-3.5 font-semibold text-emerald-400">
                    <Check className="inline h-4 w-4 mr-1" /> Automated Pre-Flight AI
                  </td>
                  <td className="p-3.5 text-rose-400">
                    <X className="inline h-4 w-4 mr-1" /> Static fill-in-the-blank
                  </td>
                  <td className="p-3.5 text-slate-400">Requires prompt engineering</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* AppSumo Tier Breakdown (Tier 1 vs Tier 2) */}
      <section className="border-t border-slate-900 bg-gradient-to-b from-slate-950 via-slate-900/40 to-slate-950 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs">
              Simple 2-Tier Stacking
            </Badge>
            <h2 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">
              Choose Your AppSumo Tier
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Stack 1 or 2 codes to match your team size and startup portfolio.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Tier 1 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Tier 1 • 1 Code
                </span>
                <Badge variant="outline" className="border-slate-700 text-xs text-slate-300">
                  Solo Founder
                </Badge>
              </div>

              <div className="mt-4">
                <div className="text-3xl font-extrabold text-white">Lifetime Access</div>
                <p className="mt-1 text-xs text-slate-400">
                  Ideal for solo creators and entrepreneurs building their flagship business.
                </p>
              </div>

              <div className="mt-6 border-t border-slate-800 pt-6">
                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span><strong>1 Active Startup Plan</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span><strong>1 Team Seat</strong> (Solo workspace)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>All 12 Core Business Modules (A–L)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Hosted Customer Validation &amp; Waitlist Page</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>&quot;Pocket Profit&quot; 3-Year Visual Breakeven Sandbox</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Unlimited PDF &amp; Document Brief Exports</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>150 Monthly AI Credits</span>
                  </li>
                </ul>
              </div>

              <Link href="/register?deal=appsumo" className="mt-8 block">
                <Button className="w-full bg-slate-800 text-xs font-bold text-white hover:bg-slate-700">
                  Get Tier 1 Deal
                </Button>
              </Link>
            </div>

            {/* Tier 2 */}
            <div className="relative rounded-2xl border-2 border-amber-500/80 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-2xl shadow-amber-500/10">
              <div className="absolute -top-3 right-6">
                <span className="rounded-full bg-amber-500 px-3 py-1 text-[10px] font-extrabold uppercase text-slate-950">
                  Most Popular
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Tier 2 • 2 Codes Stacked
                </span>
                <Badge className="bg-amber-500/20 text-xs font-bold text-amber-300 border-amber-500/30">
                  Co-Founder &amp; Multi-Plan
                </Badge>
              </div>

              <div className="mt-4">
                <div className="text-3xl font-extrabold text-white">Lifetime Access</div>
                <p className="mt-1 text-xs text-slate-400">
                  For co-founders, agencies, and serial founders exploring multiple ventures or pivots.
                </p>
              </div>

              <div className="mt-6 border-t border-slate-800 pt-6">
                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2 text-amber-200">
                    <Check className="h-4 w-4 text-amber-400 shrink-0" />
                    <span><strong>3 Active Startup Plans</strong> (Clone &amp; Pivot enabled)</span>
                  </li>
                  <li className="flex items-center gap-2 text-amber-200">
                    <Check className="h-4 w-4 text-amber-400 shrink-0" />
                    <span><strong>3 Team Seats per Plan</strong> (Real-time collaboration)</span>
                  </li>
                  <li className="flex items-center gap-2 text-amber-200">
                    <Check className="h-4 w-4 text-amber-400 shrink-0" />
                    <span><strong>Blind-Reveal Co-Founder Alignment Engine</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>All 12 Core Business Modules (A–L)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Hosted Customer Validation &amp; Waitlist Page</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>&quot;Pocket Profit&quot; 3-Year Visual Breakeven Sandbox</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Unlimited PDF &amp; Document Brief Exports</span>
                  </li>
                  <li className="flex items-center gap-2 text-amber-200">
                    <Check className="h-4 w-4 text-amber-400 shrink-0" />
                    <span><strong>450 Monthly AI Credits</strong></span>
                  </li>
                </ul>
              </div>

              <Link href="/register?deal=appsumo" className="mt-8 block">
                <Button className="w-full bg-amber-500 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20">
                  Get Tier 2 Deal
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">
              Got Questions?
            </h2>
            <p className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">
              Frequently Asked Questions
            </p>
          </div>

          <div className="mt-10 space-y-3">
            {[
              {
                q: 'Can I use this for US companies (LLCs, C-Corps, Sole Proprietorships)?',
                a: 'Yes! Startup Preflight natively supports USD ($), US market sizing (TAM/SAM/SOM), US competitor scouting, and produces business plans formatted for US SBA 7(a) bank loans, Angel syndicates, and Venture Capital seed rounds.',
              },
              {
                q: 'How does code stacking work?',
                a: 'You can buy 1 code for solo access or 2 codes to unlock 3 startup plans, 3 collaborator seats, and the multi-user Co-Founder Alignment Engine. You can stack your second code immediately at redemption or later inside your account settings.',
              },
              {
                q: 'How does the hosted customer validation waitlist work?',
                a: 'When you build your survey in Module C, you can publish a public link (startuppreflight.com/v/[your-slug]). Customers can view your proposition, answer your bias-free questions, and sign up for your waitlist. All answers and leads flow directly into your private dashboard.',
              },
              {
                q: 'Can I export my plan and financial tables?',
                a: 'Yes, both Tier 1 and Tier 2 include unlimited PDF exports of your complete business plan, executive summaries, risk registers, and financial breakeven diagnostics.',
              },
              {
                q: 'What is the 60-day money-back guarantee?',
                a: 'All AppSumo purchases are backed by AppSumo’s official 60-day money-back guarantee. If Startup Preflight is not the right fit for your venture, you can request a full refund through AppSumo with zero friction.',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="flex w-full items-center justify-between text-left text-sm font-bold text-slate-200"
                >
                  <span>{item.q}</span>
                  {openFaq === idx ? (
                    <ChevronUp className="h-4 w-4 text-amber-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  )}
                </button>
                {openFaq === idx && (
                  <p className="mt-3 text-xs leading-relaxed text-slate-400 border-t border-slate-800/60 pt-3">
                    {item.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call to Action Strip */}
      <section className="border-t border-slate-800/80 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-amber-950/30 px-4 py-16 text-center sm:px-6">
        <div className="mx-auto max-w-2xl">
          <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs">
            AppSumo Special
          </Badge>
          <h2 className="mt-4 text-2xl font-extrabold text-white sm:text-4xl">
            Start building your venture today.
          </h2>
          <p className="mt-3 text-sm text-slate-400">
            No recurring monthly fees. Instant access to all 12 modules and customer validation engines.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/register?deal=appsumo" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full bg-amber-500 px-8 font-bold text-slate-950 hover:bg-amber-400 shadow-xl shadow-amber-500/20 sm:w-auto"
              >
                Claim Lifetime Deal
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/redeem" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full border-slate-700 bg-slate-900 font-semibold text-slate-200 hover:bg-slate-800 hover:text-white sm:w-auto"
              >
                Redeem Voucher Code
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Simple Footer (Unlinked from Main Site) */}
      <footer className="border-t border-slate-900 bg-slate-950 px-4 py-8 text-center text-xs text-slate-500 sm:px-6">
        <div className="mx-auto max-w-4xl flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">Startup Preflight</span>
            <span>•</span>
            <span>AppSumo Lifetime Partner Edition</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-slate-400">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-slate-400">
              Terms of Service
            </Link>
            <Link href="/redeem" className="hover:text-amber-400 text-slate-400 font-medium">
              Voucher Redemption
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
