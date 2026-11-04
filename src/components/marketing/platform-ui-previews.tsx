'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Users,
  TrendingUp,
  FileText,
  ShieldCheck,
  QrCode,
  ArrowUpRight,
  Lock,
  Check,
  Sliders,
  Compass,
  Landmark,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type LandingEdition = 'GLOBAL' | 'IE' | 'UK';

interface PreviewCurrencyConfig {
  symbol: string;
  code: string;
  samplePrice: number;
  sampleCogs: number;
  sampleFixed: number;
  exportBadgeLabel: string;
  exportModeTitle: string;
  exportSubItems: string[];
  sampleLocation: string;
  sampleDomain: string;
}

export function getEditionPreviewConfig(
  edition: LandingEdition
): PreviewCurrencyConfig {
  if (edition === 'IE') {
    return {
      symbol: '€',
      code: 'EUR',
      samplePrice: 149,
      sampleCogs: 24,
      sampleFixed: 4200,
      exportBadgeLabel: 'Official LEO & Enterprise Ireland Ready',
      exportModeTitle:
        'Ireland LEO Official Application + Appendices A–F & Cashflow Pack',
      exportSubItems: [
        'LEO Feasibility (€15k) & Priming (€80k+) Narrative Mapped',
        '3-Quote Procurement Schedule & Laptop Ban Verified',
        'Non-Displacement & International Export Case Proven',
        'Revenue SURE Tax Refund & Digital Voucher Check Passed',
      ],
      sampleLocation: 'Dublin, Ireland',
      sampleDomain: 'fieldflow.ie',
    };
  }

  if (edition === 'UK') {
    return {
      symbol: '£',
      code: 'GBP',
      samplePrice: 129,
      sampleCogs: 20,
      sampleFixed: 3600,
      exportBadgeLabel: 'Start Up Loans, Innovate UK & SEIS Ready',
      exportModeTitle:
        'UK Start Up Loans 4-Part Workbook + Innovate UK 9-Question IFS Pack',
      exportSubItems: [
        'British Business Bank £25k/Founder Personal Survival Budget Attached',
        'Innovate UK 9-Question Scoring Criteria & Work Packages Mapped',
        'HMRC SEIS / EIS Advance Assurance Qualifying Trade Verified',
        '36-Month Cashflow & Capital Usage Depreciation Verified',
      ],
      sampleLocation: 'Manchester, UK',
      sampleDomain: 'fieldflow.co.uk',
    };
  }

  return {
    symbol: '$',
    code: 'USD',
    samplePrice: 149,
    sampleCogs: 24,
    sampleFixed: 4500,
    exportBadgeLabel: 'Investor & Bank-Ready Business Plan',
    exportModeTitle:
      'Executive Business Plan + 36-Month Financial Model & Customer Proof Appendix',
    exportSubItems: [
      'Zero Contradictions Between Narrative Story & 3-Year Financials',
      'Live Customer Survey Sentiment & Waitlist Proof Embedded',
      'Co-Founder Roles, Equity Split & 3-Year Hiring Plan Verified',
      'Unit Economics, Gross Margin & Cashflow Trough Stress-Tested',
    ],
    sampleLocation: 'Austin, TX',
    sampleDomain: 'getfieldflow.com',
  };
}

export function HeroInteractiveProductShowcase({
  edition,
}: {
  edition: LandingEdition;
}) {
  const [activeTab, setActiveTab] = useState<
    'CANVAS' | 'SURVEY' | 'COFOUNDER' | 'BREAKEVEN'
  >('CANVAS');
  const [sandboxPreset, setSandboxPreset] = useState<
    'BASELINE' | 'RAMEN' | 'GROWTH'
  >('BASELINE');

  const cfg = getEditionPreviewConfig(edition);

  // Interactive Sandbox Numbers for Tab 4
  const pricePerUnit =
    sandboxPreset === 'BASELINE'
      ? cfg.samplePrice
      : sandboxPreset === 'RAMEN'
        ? Math.round(cfg.samplePrice * 0.9)
        : Math.round(cfg.samplePrice * 1.25);

  const unitCost = cfg.sampleCogs;
  const pocketProfitPerSale = pricePerUnit - unitCost;
  const monthlyOverhead =
    sandboxPreset === 'BASELINE'
      ? cfg.sampleFixed
      : sandboxPreset === 'RAMEN'
        ? Math.round(cfg.sampleFixed * 0.62)
        : Math.round(cfg.sampleFixed * 1.35);

  const breakevenCustomers = Math.max(
    1,
    Math.ceil(monthlyOverhead / pocketProfitPerSale)
  );
  const month12ProjectedCustomers =
    sandboxPreset === 'BASELINE' ? 68 : sandboxPreset === 'RAMEN' ? 48 : 112;
  const month12NetMonthlyProfit =
    month12ProjectedCustomers * pocketProfitPerSale - monthlyOverhead;

  return (
    <div className="mx-auto mt-10 max-w-6xl">
      {/* Interactive Screen Selector Pills */}
      <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('CANVAS')}
          className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all sm:text-sm ${
            activeTab === 'CANVAS'
              ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
              : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:text-indigo-700'
          }`}
        >
          <Compass className="h-4 w-4" />
          <span>1. Idea Canvas &amp; Blind-Spot AI</span>
          <span
            className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
              activeTab === 'CANVAS'
                ? 'bg-white/20 text-white'
                : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            Free
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SURVEY')}
          className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all sm:text-sm ${
            activeTab === 'SURVEY'
              ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
              : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:text-indigo-700'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>2. Customer Survey &amp; Waitlist</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('COFOUNDER')}
          className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all sm:text-sm ${
            activeTab === 'COFOUNDER'
              ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
              : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:text-indigo-700'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>3. Co-Founder Alignment</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('BREAKEVEN')}
          className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all sm:text-sm ${
            activeTab === 'BREAKEVEN'
              ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
              : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:text-indigo-700'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          <span>
            4. Pocket Profit &amp;{' '}
            {edition === 'GLOBAL' ? 'Plan Compiler' : 'Grant Compiler'}
          </span>
        </button>
      </div>

      {/* Browser / Workspace Frame */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xl ring-1 ring-slate-900/5">
        {/* Top Browser Chrome */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-900 px-4 py-2.5 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
            <span className="ml-2 hidden rounded-md bg-slate-800 px-2.5 py-1 font-mono text-[11px] text-slate-300 sm:inline-block">
              startuppreflight.com/workspace • Plan: FieldFlow AI (
              {cfg.sampleLocation})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
              <CheckCircle2 className="h-3 w-3" />
              {cfg.exportBadgeLabel}
            </span>
          </div>
        </div>

        {/* Workspace Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left Mini Sidebar (Desktop) */}
          <div className="hidden border-r border-slate-200 bg-slate-50/80 p-4 lg:col-span-3 lg:block">
            <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              12 Guided Modules (A–L)
            </div>
            <div className="mt-2.5 space-y-1.5 text-xs">
              {[
                {
                  id: 'CANVAS' as const,
                  code: 'Mod A',
                  label: 'Idea Canvas & Fit Check',
                  done: true,
                },
                {
                  id: 'CANVAS' as const,
                  code: 'Mod B',
                  label: 'Competitors & Market Size',
                  done: true,
                },
                {
                  id: 'SURVEY' as const,
                  code: 'Mod C',
                  label: 'Customer Survey & Waitlist',
                  done: true,
                },
                {
                  id: 'CANVAS' as const,
                  code: 'Mod D–E',
                  label: 'V1 Product & Operations',
                  done: true,
                },
                {
                  id: 'COFOUNDER' as const,
                  code: 'Mod F',
                  label: 'Co-Founder 12 Questions',
                  done: true,
                },
                {
                  id: 'COFOUNDER' as const,
                  code: 'Mod G',
                  label: 'Operations Launchpad (84%)',
                  done: true,
                },
                {
                  id: 'BREAKEVEN' as const,
                  code: 'Mod H–J',
                  label: 'Pocket Profit & 3-Yr Finance',
                  done: true,
                },
                {
                  id: 'BREAKEVEN' as const,
                  code: 'Mod K–L',
                  label:
                    edition === 'GLOBAL'
                      ? '1-Click Business Plan'
                      : 'Grant Matcher & Compiler',
                  done: true,
                },
              ].map((item, idx) => {
                const isSelected = activeTab === item.id && idx % 2 === 0;
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition ${
                      isSelected
                        ? 'bg-indigo-600 font-semibold text-white shadow-2xs'
                        : 'text-slate-700 hover:bg-slate-200/70'
                    }`}
                  >
                    <span className="truncate">
                      <strong className="mr-1.5">{item.code}:</strong>
                      {item.label}
                    </span>
                    <CheckCircle2
                      className={`h-3.5 w-3.5 shrink-0 ${
                        isSelected ? 'text-indigo-200' : 'text-emerald-600'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <div className="mt-4 rounded-xl border border-indigo-200/80 bg-indigo-50/70 p-3 text-left">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-950">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                Ask Preflight AI Sidekick
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-indigo-900/90">
                &ldquo;Stuck on a number? Click <strong>Park It</strong> or use
                an <strong>Industry Benchmark</strong> so you never lose
                momentum.&rdquo;
              </p>
            </div>
          </div>

          {/* Right Main Interactive Preview Canvas */}
          <div className="p-5 sm:p-6 lg:col-span-9">
            {activeTab === 'CANVAS' && (
              <div className="space-y-4 text-left">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="success">Module A • 100% Free</Badge>
                      <span className="text-xs font-semibold text-slate-500">
                        Capture First, Expand Second
                      </span>
                    </div>
                    <h3 className="mt-1 text-base font-bold text-slate-900 sm:text-lg">
                      1-Page Concept Canvas &amp; Supportive Blind-Spot Review
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-2">
                    <div>
                      <div className="text-[10px] font-bold tracking-wider text-emerald-800 uppercase">
                        Founder-Idea Fit
                      </div>
                      <div className="text-lg font-extrabold text-emerald-950">
                        86 / 100
                      </div>
                    </div>
                    <div className="h-8 w-8 rounded-lg bg-emerald-600 text-center text-xs leading-8 font-bold text-white">
                      A
                    </div>
                  </div>
                </div>

                {/* 3 Concept Cards */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
                    <div className="text-[11px] font-bold text-indigo-700 uppercase">
                      Problem Extracted
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-700">
                      Independent trade contractors lose 6+ hours a week chasing
                      quote approvals and late deposit payments over WhatsApp.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
                    <div className="text-[11px] font-bold text-indigo-700 uppercase">
                      First Beachhead Buyer
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-700">
                      2–10 person electrical &amp; HVAC firms in{' '}
                      {cfg.sampleLocation} doing {cfg.symbol}250k–{cfg.symbol}
                      1.2M annual turnover.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
                    <div className="text-[11px] font-bold text-indigo-700 uppercase">
                      Revenue &amp; Domain Check
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-700">
                      {cfg.symbol}
                      {cfg.samplePrice}/month SaaS + 1% instant card deposit fee.
                    </p>
                    <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-emerald-100/80 px-2 py-0.5 text-[10px] font-semibold text-emerald-900">
                      <Check className="h-3 w-3" /> {cfg.sampleDomain} available
                    </div>
                  </div>
                </div>

                {/* Constructive Blind-Spot Engine Output */}
                <div className="rounded-xl border border-amber-200/90 bg-gradient-to-r from-amber-50/80 via-white to-indigo-50/40 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <span className="text-xs font-bold text-slate-900">
                        AI Co-Founder &ldquo;Things to Consider&rdquo; Blind-Spot
                        Review
                      </span>
                    </div>
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold text-amber-900">
                      2 Blind Spots Caught Early
                    </span>
                  </div>
                  <div className="mt-2.5 grid grid-cols-1 gap-2.5 text-xs text-slate-700 sm:grid-cols-2">
                    <div className="rounded-lg border border-amber-200/60 bg-white p-2.5">
                      <strong className="text-slate-900">
                        1. Field Adoption Friction:
                      </strong>{' '}
                      Tradespeople rarely sit at a desktop. Make sure V1 works
                      via 1-tap voice-note or SMS quote links on mobile.
                    </div>
                    <div className="rounded-lg border border-indigo-200/60 bg-white p-2.5">
                      <strong className="text-slate-900">
                        2.{' '}
                        {edition === 'IE'
                          ? 'LEO Non-Displacement Proof:'
                          : edition === 'UK'
                            ? 'Start Up Loans Survival Buffer:'
                            : 'Payment Processing Margin:'}
                      </strong>{' '}
                      {edition === 'IE'
                        ? 'Highlight how your software exports to UK/EU trades so your Local Enterprise Office scores it as internationally traded SaaS.'
                        : edition === 'UK'
                          ? 'Include your personal mortgage/rent runway in Module F so British Business Bank underwriters see a realistic Month 1–6 draw.'
                          : 'Stripe connect fees (~1.5% + 20c) will eat into low-ticket deposits; pass card fees to the end homeowner or bundle into the monthly tier.'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'SURVEY' && (
              <div className="space-y-4 text-left">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Module C • Flagship Tool</Badge>
                      <span className="text-xs font-semibold text-slate-500">
                        Bias-Free &ldquo;Mom Test&rdquo; Validation
                      </span>
                    </div>
                    <h3 className="mt-1 text-base font-bold text-slate-900 sm:text-lg">
                      Hosted Public Customer Survey, QR Code &amp; Waitlist
                      Engine
                    </h3>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 py-1.5 text-xs font-semibold text-indigo-900">
                    <QrCode className="h-4 w-4 text-indigo-600" />
                    <span>startuppreflight.com/v/fieldflow-ai</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
                  {/* Left: Public Survey Preview */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:col-span-7">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-indigo-700 uppercase">
                        Auto-Generated Non-Leading Questions
                      </span>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        42 Real Responses
                      </span>
                    </div>
                    <div className="mt-3 space-y-2.5 text-xs">
                      <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                        <div className="font-semibold text-slate-900">
                          Q1. Think back to the last job quote you sent last
                          week—how long did it take from site visit to deposit?
                        </div>
                        <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-600">
                          <span>Top answer: &ldquo;3 to 5 evenings&rdquo;</span>
                          <span className="font-bold text-indigo-700">67%</span>
                        </div>
                        <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100">
                          <div className="h-1.5 w-2/3 rounded-full bg-indigo-600" />
                        </div>
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                        <div className="font-semibold text-slate-900">
                          Q2. What do you currently pay per month for quoting or
                          job-management tools?
                        </div>
                        <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-600">
                          <span>
                            Verified Willingness-to-Pay Anchor: {cfg.symbol}110–
                            {cfg.symbol}160/mo
                          </span>
                          <span className="font-bold text-emerald-700">
                            Synced to Mod H
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Sentiment & Waitlist Proof */}
                  <div className="flex flex-col justify-between rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-4 sm:col-span-5">
                    <div>
                      <div className="text-[11px] font-bold text-emerald-900 uppercase">
                        Live Buyer Proof Block
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div className="rounded-lg bg-white p-2.5 shadow-2xs">
                          <div className="text-[10px] text-slate-500">
                            Survey Replies
                          </div>
                          <div className="text-xl font-extrabold text-slate-900">
                            42
                          </div>
                        </div>
                        <div className="rounded-lg bg-white p-2.5 shadow-2xs">
                          <div className="text-[10px] text-slate-500">
                            Pilot Waitlist Leads
                          </div>
                          <div className="text-xl font-extrabold text-emerald-700">
                            19 Opt-Ins
                          </div>
                        </div>
                      </div>
                      <p className="mt-3 text-xs leading-relaxed text-slate-700">
                        {edition === 'GLOBAL'
                          ? 'Automatically embeds real customer demand charts into your Business Plan executive summary.'
                          : 'Grant assessors reject applications that rely on guesswork. This block auto-attaches verified primary market research to your application.'}
                      </p>
                    </div>
                    <div className="mt-3 rounded-lg bg-emerald-600/10 px-3 py-2 text-[11px] font-semibold text-emerald-900">
                      ✓ Ready to convert into First 10 Customers in Module I
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'COFOUNDER' && (
              <div className="space-y-4 text-left">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Module F • Flagship Tool</Badge>
                      <span className="text-xs font-semibold text-slate-500">
                        12 Awkward Questions Engine
                      </span>
                    </div>
                    <h3 className="mt-1 text-base font-bold text-slate-900 sm:text-lg">
                      Blind-Reveal Co-Founder Alignment Heatmap &amp; Equity
                      Calculator
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-900">
                    <Lock className="h-3.5 w-3.5 text-violet-700" />
                    Answered Privately Before Reveal
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase">
                        <th className="py-2.5 pr-3 pl-3">Alignment Topic</th>
                        <th className="px-3 py-2.5">Founder A (You)</th>
                        <th className="px-3 py-2.5">Founder B (Co-Founder)</th>
                        <th className="py-2.5 pr-3 pl-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-2.5 pr-3 pl-3 font-semibold text-slate-900">
                          Weekly Time Commitment (First 6 Mos)
                        </td>
                        <td className="px-3 py-2.5 text-slate-700">
                          45 hrs/wk (Full-Time)
                        </td>
                        <td className="px-3 py-2.5 text-slate-700">
                          40+ hrs/wk (Full-Time)
                        </td>
                        <td className="py-2.5 pr-3 pl-3">
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            Aligned
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 pr-3 pl-3 font-semibold text-slate-900">
                          Minimum Monthly Survival Salary Needed
                        </td>
                        <td className="px-3 py-2.5 text-slate-700">
                          {cfg.symbol}2,400 / mo from Month 4
                        </td>
                        <td className="px-3 py-2.5 text-slate-700">
                          {cfg.symbol}0 for 6 mos, then {cfg.symbol}2,800 / mo
                        </td>
                        <td className="py-2.5 pr-3 pl-3">
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            Synced to Cashflow
                          </span>
                        </td>
                      </tr>
                      <tr className="bg-amber-50/50">
                        <td className="py-2.5 pr-3 pl-3 font-semibold text-slate-900">
                          What Happens If Someone Leaves in Year 1?
                        </td>
                        <td className="px-3 py-2.5 text-slate-700">
                          4-Year Vesting + 1-Year Cliff
                        </td>
                        <td className="px-3 py-2.5 text-slate-700">
                          Keep 50% of shares immediately
                        </td>
                        <td className="py-2.5 pr-3 pl-3">
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                            Discuss Now
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-700">
                  <strong>Why founders love this:</strong> Surfaces awkward
                  expectations around cash contributions, hours, and vesting{' '}
                  <em>before</em> you pay a solicitor to incorporate in Module
                  G.
                </div>
              </div>
            )}

            {activeTab === 'BREAKEVEN' && (
              <div className="space-y-4 text-left">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="warning">Modules H, J &amp; L</Badge>
                      <span className="text-xs font-semibold text-slate-500">
                        Interactive What-If Sandbox + Pre-Flight Audit
                      </span>
                    </div>
                    <h3 className="mt-1 text-base font-bold text-slate-900 sm:text-lg">
                      &ldquo;Pocket Profit&rdquo; Breakeven &amp; 1-Click
                      Compiler
                    </h3>
                  </div>

                  {/* Interactive Preset Switcher inside the Landing Page Preview! */}
                  <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1">
                    <span className="px-2 text-[10px] font-bold text-slate-500 uppercase">
                      <Sliders className="mr-1 inline h-3 w-3" />
                      Try Stress-Test:
                    </span>
                    {(
                      [
                        { id: 'BASELINE', label: 'Official Plan' },
                        { id: 'RAMEN', label: 'Ramen Survival' },
                        { id: 'GROWTH', label: 'Aggressive Growth' },
                      ] as const
                    ).map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setSandboxPreset(preset.id)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                          sandboxPreset === preset.id
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4 Metric Cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">
                      Pocket Profit / Sale
                    </div>
                    <div className="mt-1 text-xl font-extrabold text-slate-900">
                      {cfg.symbol}
                      {pocketProfitPerSale}
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-500">
                      ({cfg.symbol}
                      {pricePerUnit} price − {cfg.symbol}
                      {unitCost} cost)
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">
                      Monthly Fixed Burn
                    </div>
                    <div className="mt-1 text-xl font-extrabold text-slate-900">
                      {cfg.symbol}
                      {monthlyOverhead.toLocaleString()}
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-500">
                      Includes ops &amp; survival draw
                    </div>
                  </div>

                  <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3">
                    <div className="text-[10px] font-bold text-indigo-800 uppercase">
                      Breakeven Point
                    </div>
                    <div className="mt-1 text-xl font-extrabold text-indigo-950">
                      {breakevenCustomers} customers
                    </div>
                    <div className="mt-0.5 text-[11px] text-indigo-700">
                      Covers 100% of overheads
                    </div>
                  </div>

                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                    <div className="text-[10px] font-bold text-emerald-800 uppercase">
                      Month 12 Net Surplus
                    </div>
                    <div className="mt-1 text-xl font-extrabold text-emerald-950">
                      +{cfg.symbol}
                      {month12NetMonthlyProfit.toLocaleString()}/mo
                    </div>
                    <div className="mt-0.5 text-[11px] text-emerald-700">
                      At {month12ProjectedCustomers} active customers
                    </div>
                  </div>
                </div>

                {/* Export Compiler Strip */}
                <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50/80 via-white to-indigo-50/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-emerald-700" />
                      <span className="text-xs font-bold text-slate-900">
                        {cfg.exportModeTitle}
                      </span>
                    </div>
                    <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold text-white">
                      Pre-Flight AI Audit: 0 Contradictions
                    </span>
                  </div>
                  <div className="mt-2.5 grid grid-cols-1 gap-1.5 text-xs text-slate-700 sm:grid-cols-2">
                    {cfg.exportSubItems.map((line) => (
                      <div key={line} className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        <span>{line}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BentoFeatureVisualCards({
  edition,
}: {
  edition: LandingEdition;
}) {
  const cfg = getEditionPreviewConfig(edition);

  return (
    <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Card 1: Module C Customer Validation & Waitlist */}
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition hover:border-indigo-200 hover:shadow-md">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
              <MessageSquare className="h-3.5 w-3.5" />
              Module C • Flagship #1
            </span>
            <Badge variant="default">Hosted Public Link + QR</Badge>
          </div>
          <h3 className="mt-3 text-lg font-bold text-slate-900">
            1-Click Customer Validation Survey &amp; Waitlist Page
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            Most founders ask leading questions (&ldquo;Would you use my
            app?&rdquo;) and get polite lies. We generate bias-free{' '}
            <strong>&ldquo;Mom Test&rdquo; questions</strong>, host your public
            survey &amp; waitlist page at{' '}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-indigo-700">
              startuppreflight.com/v/your-slug
            </code>
            , and synthesize customer willingness-to-pay automatically.
          </p>
        </div>

        {/* Mini UI Card inside Bento */}
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs">
          <div className="flex items-center justify-between font-semibold text-slate-800">
            <span>Live Sentiment &amp; Price Anchor</span>
            <span className="text-emerald-700">
              42 Responses • 19 Waitlist Emails
            </span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-white p-2 shadow-2xs">
              <div className="text-[10px] text-slate-500">Acute Pain</div>
              <div className="text-sm font-extrabold text-indigo-700">78%</div>
            </div>
            <div className="rounded-lg bg-white p-2 shadow-2xs">
              <div className="text-[10px] text-slate-500">Sweet-Spot Price</div>
              <div className="text-sm font-extrabold text-slate-900">
                {cfg.symbol}
                {cfg.samplePrice}/mo
              </div>
            </div>
            <div className="rounded-lg bg-white p-2 shadow-2xs">
              <div className="text-[10px] text-slate-500">Pilot Opt-Ins</div>
              <div className="text-sm font-extrabold text-emerald-700">45%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Module F Co-Founder Alignment */}
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition hover:border-indigo-200 hover:shadow-md">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700">
              <Users className="h-3.5 w-3.5" />
              Module F • Flagship #2
            </span>
            <Badge variant="secondary">Solo or Co-Founder Teams</Badge>
          </div>
          <h3 className="mt-3 text-lg font-bold text-slate-900">
            Blind-Reveal Co-Founder Alignment &amp; Survival Budget
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            Building with a partner? Both co-founders privately answer{' '}
            <strong>12 awkward questions</strong> on hours, personal salary
            needs, cash contributions, and exit goals before revealing a
            side-by-side alignment heatmap. Solo founder? Map your{' '}
            <strong>7 Startup Hats</strong> and Personal Survival Budget.
          </p>
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs">
          <div className="flex items-center justify-between font-semibold text-slate-800">
            <span>Side-by-Side Alignment Score</span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
              10 / 12 Aligned • 2 To Discuss
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-md bg-white px-2 py-1 text-[11px] font-medium text-slate-700 shadow-2xs">
              ✓ Equity Split &amp; Vesting
            </span>
            <span className="rounded-md bg-white px-2 py-1 text-[11px] font-medium text-slate-700 shadow-2xs">
              ✓ Personal Survival Runway
            </span>
            <span className="rounded-md bg-white px-2 py-1 text-[11px] font-medium text-slate-700 shadow-2xs">
              ✓ 3-Year Hiring Roadmap
            </span>
          </div>
        </div>
      </div>

      {/* Card 3: Module G Getting Set Up Launchpad */}
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition hover:border-indigo-200 hover:shadow-md">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Module G • Launchpad Hub
            </span>
            <Badge variant="success">0–100% Readiness Tracker</Badge>
          </div>
          <h3 className="mt-3 text-lg font-bold text-slate-900">
            Getting Set Up: Domain, Incorporation, Banking &amp; Compliance
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            Stop juggling 15 browser tabs to set up your company. Track your{' '}
            <strong>Operations Readiness Score</strong> across 6 practical
            cards: Legal Entity Registration
            {edition === 'IE'
              ? ' (CRO Ireland)'
              : edition === 'UK'
                ? ' (Companies House UK)'
                : ''}
            , live <code className="text-xs">.ie / .co.uk / .com</code> domain
            availability &amp; official <code className="text-xs">@company</code>{' '}
            email check, Business Banking, Bookkeeping, Insurance, and IP/GDPR.
          </p>
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs">
          <div className="flex items-center justify-between font-semibold text-slate-800">
            <span>Operations Readiness Score</span>
            <span className="font-bold text-emerald-700">5 of 6 Complete</span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
            <div className="h-2 w-5/6 rounded-full bg-emerald-600" />
          </div>
        </div>
      </div>

      {/* Card 4: Module H/J/K/L Numbers & Export */}
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition hover:border-indigo-200 hover:shadow-md">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">
              <Landmark className="h-3.5 w-3.5" />
              {edition === 'GLOBAL'
                ? 'Modules H, J & L • Finance & Compiler'
                : 'Modules H, J, K & L • Grants & Finance'}
            </span>
            <Badge variant="warning">Zero Spreadsheets</Badge>
          </div>
          <h3 className="mt-3 text-lg font-bold text-slate-900">
            {edition === 'GLOBAL'
              ? '"Pocket Profit" Financials & Pre-Flight AI Plan Audit'
              : edition === 'IE'
                ? 'Irish Grant Matcher, 36-Month Cashflow & LEO Form Compiler'
                : 'UK Grant/Loan Matcher, 36-Month Cashflow & Official Compiler'}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            {edition === 'GLOBAL'
              ? 'Answer plain-English questions to build a 36-month cashflow projection, test "What-If" survival scenarios, and compile an investor-ready Business Plan audited by AI so your story and numbers never contradict.'
              : edition === 'IE'
                ? 'Automatically score your readiness for LEO Feasibility, Priming, Digital Vouchers, Enterprise Ireland New Frontiers, and SURE—then export directly into the official Ireland LEO Application structure.'
                : 'Automatically score your readiness for British Business Bank Start Up Loans, Innovate UK Smart Grants, and HMRC SEIS/EIS Advance Assurance—then export directly into official assessor formats.'}
          </p>
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs">
          <div className="flex items-center justify-between font-semibold text-slate-800">
            <span>Pre-Flight Contradiction Check</span>
            <span className="text-indigo-700">
              Narrative ↔ 36-Mo Cashflow Synced
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-md bg-white px-2 py-1 text-[11px] font-medium text-slate-700 shadow-2xs">
              ✓ Pricing ↔ Revenue Synced
            </span>
            <span className="rounded-md bg-white px-2 py-1 text-[11px] font-medium text-slate-700 shadow-2xs">
              ✓ Hiring ↔ Payroll Synced
            </span>
            <span className="rounded-md bg-white px-2 py-1 text-[11px] font-medium text-slate-700 shadow-2xs">
              ✓ Funding Gap Calculated
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
