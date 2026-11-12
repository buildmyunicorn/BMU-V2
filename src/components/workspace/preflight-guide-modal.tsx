'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  HelpCircle,
  Lightbulb,
  Sparkles,
  BookmarkPlus,
  Check,
  Target,
  Shield,
  Layers,
  Coins,
  Compass,
  ArrowRight,
  TrendingUp,
  Cpu,
  Store,
  CheckCircle2,
} from 'lucide-react';

interface PreflightGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'colors' | 'jargon' | 'rules';
}

export function PreflightGuideModal({
  isOpen,
  onClose,
  initialTab = 'colors',
}: PreflightGuideModalProps) {
  const [activeTab, setActiveTab] = useState<'colors' | 'jargon' | 'rules'>(initialTab);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto p-0 sm:rounded-2xl">
        {/* Header Hero */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-6 py-6 text-white sm:px-8">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/20 text-amber-300 ring-1 ring-amber-400/40">
              <Lightbulb className="h-4 w-4" />
            </span>
            <Badge className="border-amber-400/30 bg-amber-400/20 text-[10px] font-bold uppercase tracking-wider text-amber-200">
              Founder Quick Guide
            </Badge>
          </div>
          <DialogTitle className="mt-3 text-xl font-bold tracking-tight text-white sm:text-2xl">
            Preflight Visual Guide & Jargon Key
          </DialogTitle>
          <DialogDescription className="mt-1 text-xs text-slate-300/90 sm:text-sm">
            Everything you need to navigate the workspace, understand the button colors, and decode startup terminology.
          </DialogDescription>

          {/* Tab Selector */}
          <div className="mt-5 flex gap-1.5 rounded-xl border border-white/10 bg-white/5 p-1 text-xs sm:inline-flex">
            <button
              type="button"
              onClick={() => setActiveTab('colors')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
                activeTab === 'colors'
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Button Colors &amp; Tools</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('jargon')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
                activeTab === 'jargon'
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Target className="h-3.5 w-3.5" />
              <span>Startup Jargon Decoder</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rules')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
                activeTab === 'rules'
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              <span>3 Rules of the Road</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8">
          {/* TAB 1: BUTTON COLORS & TOOLS */}
          {activeTab === 'colors' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  The 4-Layer Support Strip on Every Step
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  You will see these consistent color-coded tools across every module to help you whenever you need guidance.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                {/* 1. WHY ARE WE ASKING THIS? */}
                <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-4 transition-all hover:bg-emerald-50/70">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-emerald-800">
                      <HelpCircle className="h-4 w-4" />
                    </span>
                    <Badge className="border-emerald-300 bg-slate-100 text-[11px] font-semibold text-slate-900">
                      Indigo Button
                    </Badge>
                  </div>
                  <div className="mt-2.5 font-bold text-slate-900 text-sm">
                    Why Are We Asking This?
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    Explains <strong className="text-slate-900">why investors, banks, or grant assessors care</strong> about this specific question. Cuts through corporate jargon so you understand the purpose before writing a word.
                  </p>
                </div>

                {/* 2. SHOW ME AN EXAMPLE */}
                <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-4 transition-all hover:bg-emerald-50/70">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                      <Lightbulb className="h-4 w-4" />
                    </span>
                    <Badge className="border-emerald-300 bg-emerald-100 text-[11px] font-semibold text-emerald-900">
                      Emerald Button
                    </Badge>
                  </div>
                  <div className="mt-2.5 font-bold text-slate-900 text-sm">
                    Show Me an Example
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    Opens real-world sample answers across <strong className="text-emerald-900">B2B SaaS, Physical Hardware/DTC, and Local Services</strong>. Look at how successful startups answer so you never start with a blank page.
                  </p>
                </div>

                {/* 3. I'M STUCK / AUTO-DRAFT */}
                <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-4 transition-all hover:bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-emerald-800">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    <Badge className="border-slate-300 bg-slate-100 text-[11px] font-semibold text-slate-900">
                      Violet Button
                    </Badge>
                  </div>
                  <div className="mt-2.5 font-bold text-slate-900 text-sm">
                    I&apos;m Stuck &amp; Calibrate with AI
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    Feeling writer&apos;s block? Click this to let the AI co-pilot <strong className="text-slate-900">auto-generate a contextual first draft</strong> tailored to your specific venture summary. You can then edit and refine it in seconds.
                  </p>
                </div>

                {/* 4. PARK IN OPEN QUESTIONS */}
                <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 transition-all hover:bg-amber-50/70">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                      <BookmarkPlus className="h-4 w-4" />
                    </span>
                    <Badge className="border-amber-300 bg-amber-100 text-[11px] font-semibold text-amber-900">
                      Amber Button
                    </Badge>
                  </div>
                  <div className="mt-2.5 font-bold text-slate-900 text-sm">
                    Park in Open Questions
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    <strong className="text-amber-900">Never get blocked on unknowns.</strong> If you don&apos;t know a competitor&apos;s exact pricing or your exact launch date yet, click to park it into your Open Questions list and keep your momentum going.
                  </p>
                </div>
              </div>

              {/* Progress Badges */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Step &amp; Module Status Indicators
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-600 text-white">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Completed (Emerald)</div>
                      <div className="text-[11px] text-slate-500">Step saved &amp; synced to Master Doc</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-700 text-xs font-bold text-white">
                      2
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-900">In Progress (Indigo)</div>
                      <div className="text-[11px] text-slate-500">Active step currently being filled</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-200 text-xs font-bold text-slate-600">
                      3
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Not Started (Slate)</div>
                      <div className="text-[11px] text-slate-500">Upcoming step ready when you are</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STARTUP JARGON DECODER */}
          {activeTab === 'jargon' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Kitchen-Table Startup Jargon Decoder
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Plain-English explanations for startup terms you will encounter across the modules.
                </p>
              </div>

              <div className="space-y-3">
                {/* Beachhead */}
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Target className="h-4 w-4 text-emerald-700" />
                      Beachhead Customer
                    </span>
                    <Badge variant="outline" className="border-slate-200 bg-emerald-50 text-[10px] text-emerald-800">
                      Module B
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    The single, ultra-specific group of early adopters whose &ldquo;hair is on fire&rdquo; for your solution. Instead of targeting &ldquo;all coffee shops in Europe&rdquo;, a beachhead is &ldquo;specialty independent cafes with &gt;3 baristas in Dublin or London&rdquo;. Conquer them first, then expand.
                  </p>
                </div>

                {/* Competitive Wedge */}
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Shield className="h-4 w-4 text-emerald-600" />
                      Competitive Wedge &amp; Moat
                    </span>
                    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700">
                      Module B &amp; D
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    The unfair advantage that lets you pry customers away from entrenched incumbents and stops fast copycats from replicating you (e.g. proprietary IP, network effects, switching barriers, or an exclusive supplier partnership).
                  </p>
                </div>

                {/* Product Vehicle */}
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Cpu className="h-4 w-4 text-emerald-700" />
                      Product Vehicle
                    </span>
                    <Badge variant="outline" className="border-slate-200 bg-slate-50 text-[10px] text-emerald-800">
                      Module D
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    What you are literally manufacturing, building, or delivering to buyers: a Physical Hardware SKU, B2B Cloud Software, Two-Sided Marketplace, Mobile App, or Productized Service.
                  </p>
                </div>

                {/* Own vs Rent Channels */}
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Store className="h-4 w-4 text-sky-600" />
                      Own vs. Rent Distribution Channels
                    </span>
                    <Badge variant="outline" className="border-sky-200 bg-sky-50 text-[10px] text-sky-700">
                      Module D &amp; H
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    <strong>Owned channels</strong> (your own website, Shopify, Stripe) let you keep ~97% of each sale and own customer emails. <strong>Rented channels</strong> (Amazon, Apple App Store, Google Play) bring instant traffic but take 15% to 30% cuts and can shut your store down anytime.
                  </p>
                </div>

                {/* Pocket Profit */}
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Coins className="h-4 w-4 text-amber-600" />
                      Pocket Profit &amp; Breakeven
                    </span>
                    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-[10px] text-amber-700">
                      Module H
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    The actual cash left in your company after COGS, merchant fees, host servers, taxes, <em>and your own founder survival salary</em> are paid. Real breakeven is when pocket profit reaches zero—not just when revenue covers software subscriptions.
                  </p>
                </div>

                {/* TAM SAM SOM */}
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-teal-600" />
                      TAM / SAM / SOM
                    </span>
                    <Badge variant="outline" className="border-teal-200 bg-teal-50 text-[10px] text-teal-700">
                      Module B &amp; L
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    <strong>TAM (Total Market):</strong> Everyone worldwide who could theoretically use your product. <br />
                    <strong>SAM (Serviceable Market):</strong> Those within your initial language, legal geography, and category. <br />
                    <strong>SOM (Obtainable Market):</strong> The realistic percentage you can sign in Years 1–3 with your marketing budget.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 3 RULES OF THE ROAD */}
          {activeTab === 'rules' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  The 3 Golden Preflight Principles
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Keep these three truths in mind whenever you work on your startup plan.
                </p>
              </div>

              <div className="space-y-3.5">
                <div className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50 p-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-xs font-bold text-white">
                    1
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      Capture First, Expand Second
                    </h4>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                      Never stress about polished corporate prose in Step 1. Get your raw idea down in your own natural words. The platform and AI will help you expand, validate, and professionally format it afterwards.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-emerald-200/80 bg-emerald-50/30 p-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold text-white">
                    2
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      Move at Your Own Pace (No Strict Linear Order)
                    </h4>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                      You are never trapped in a linear conveyor belt. If you feel energized about testing pricing today, jump directly to Stage 3. If you want to run a customer survey first, jump to Stage 1.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/30 p-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-xs font-bold text-white">
                    3
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      Write Once, Auto-Compile Everywhere
                    </h4>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                      You will never have to re-type answers. Every data point you enter automatically connects to your financial projections, competitive matrix, and bank/grant dossiers in the background.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Bar */}
          <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
            <span className="text-xs text-slate-500">
              Need more help? Check the <strong className="text-slate-800">Ask Preflight AI</strong> co-pilot drawer anytime.
            </span>
            <Button
              type="button"
              onClick={onClose}
              className="bg-emerald-700 text-xs font-bold text-white hover:bg-emerald-800"
            >
              Got It, Let&apos;s Build
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
