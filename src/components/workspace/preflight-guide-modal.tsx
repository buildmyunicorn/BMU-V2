'use client';

import React, { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  HelpCircle,
  Lightbulb,
  BookmarkPlus,
  Check,
  Target,
  Layers,
  Compass,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import {
  STARTUP_JARGON_GLOSSARY,
  JARGON_STAGE_LABELS,
  type JargonStageGroup,
} from '@/components/workspace/jargon-tooltip';

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
  const [jargonSearch, setJargonSearch] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState<'ALL' | JargonStageGroup>('ALL');

  const filteredGlossary = useMemo(() => {
    const q = jargonSearch.trim().toLowerCase();
    return STARTUP_JARGON_GLOSSARY.filter((item) => {
      if (selectedStageFilter !== 'ALL' && item.stageGroup !== selectedStageFilter) {
        return false;
      }
      if (!q) return true;
      return (
        item.term.toLowerCase().includes(q) ||
        item.shortLabel.toLowerCase().includes(q) ||
        item.plainEnglish.toLowerCase().includes(q) ||
        item.moduleBadge.toLowerCase().includes(q)
      );
    });
  }, [jargonSearch, selectedStageFilter]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto p-0 sm:rounded-2xl">
        {/* Header Hero */}
        <div className="border-b border-slate-800 bg-slate-950 px-6 py-6 text-white sm:px-8">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40">
              <Lightbulb className="h-4 w-4" />
            </span>
            <Badge className="border-emerald-400/30 bg-emerald-500/20 text-[10px] font-bold uppercase tracking-wider text-emerald-200">
              Founder Quick Guide
            </Badge>
          </div>
          <DialogTitle className="mt-3 text-xl font-bold tracking-tight text-white sm:text-2xl">
            Preflight Visual Guide &amp; Plain-English Jargon Key
          </DialogTitle>
          <DialogDescription className="mt-1 text-xs text-slate-300/90 sm:text-sm">
            Everything you need to navigate the workspace, understand the coaching buttons, and decode 30+ startup, banking, and grant terms.
          </DialogDescription>

          {/* Tab Selector */}
          <div className="mt-5 grid grid-cols-1 gap-1.5 rounded-xl border border-slate-800 bg-slate-900 p-1 text-xs sm:inline-flex">
            <button
              type="button"
              onClick={() => setActiveTab('colors')}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
                activeTab === 'colors'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Support Tools &amp; Badges</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('jargon')}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
                activeTab === 'jargon'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Target className="h-3.5 w-3.5" />
              <span>Jargon Decoder ({STARTUP_JARGON_GLOSSARY.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rules')}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
                activeTab === 'rules'
                  ? 'bg-emerald-700 text-white shadow-xs'
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
          {/* TAB 1: SUPPORT TOOLS & BADGES */}
          {activeTab === 'colors' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  The 4-Layer Support Strip on Every Step
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Every step includes these consistent coaching controls so you never face a blank page alone.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                {/* 1. WHY ARE WE ASKING THIS? */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700">
                      <HelpCircle className="h-4 w-4" />
                    </span>
                    <Badge variant="outline" className="border-slate-300 bg-white text-[11px] font-semibold text-slate-800">
                      Slate Outline Button
                    </Badge>
                  </div>
                  <div className="mt-2.5 text-sm font-bold text-slate-900">
                    Why Are We Asking This?
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    Explains <strong className="text-slate-900">why customers, banks, or grant assessors care</strong> about this question in everyday language before you write a word.
                  </p>
                </div>

                {/* 2. SHOW ME AN EXAMPLE */}
                <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                      <Lightbulb className="h-4 w-4" />
                    </span>
                    <Badge className="border-emerald-300 bg-emerald-100 text-[11px] font-semibold text-emerald-900">
                      Emerald Outline Button
                    </Badge>
                  </div>
                  <div className="mt-2.5 text-sm font-bold text-slate-900">
                    Show Me an Example
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    Opens realistic sample answers across <strong className="text-emerald-900">Local Businesses, Physical Products, and B2B Software</strong> so you can model a strong answer fast.
                  </p>
                </div>

                {/* 3. CALIBRATE / DRAFT HELPER */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-emerald-700">
                      <SlidersHorizontal className="h-4 w-4" />
                    </span>
                    <Badge variant="outline" className="border-slate-300 bg-white text-[11px] font-semibold text-slate-800">
                      Calibrate / Draft Helper
                    </Badge>
                  </div>
                  <div className="mt-2.5 text-sm font-bold text-slate-900">
                    Calibrate with Evidence / Use Benchmark
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    Synthesizes a grounded first draft from <strong className="text-slate-900">your saved customer, product, and cost inputs</strong>—or fills realistic industry benchmarks when you are unsure.
                  </p>
                </div>

                {/* 4. PARK IN OPEN QUESTIONS */}
                <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                      <BookmarkPlus className="h-4 w-4" />
                    </span>
                    <Badge className="border-amber-300 bg-amber-100 text-[11px] font-semibold text-amber-900">
                      Amber / Parking Lot Button
                    </Badge>
                  </div>
                  <div className="mt-2.5 text-sm font-bold text-slate-900">
                    Not Sure Yet? Park Question
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    <strong className="text-amber-900">Never get stuck on unknowns.</strong> Save any open question (e.g. VAT rate or supplier quote) to your Parking Lot to ask a mentor or accountant later, and keep moving.
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
                      <div className="text-[11px] text-slate-500">Step saved &amp; synced across your plan</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-900 text-xs font-bold text-white">
                      2
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Active Step (Deep Slate)</div>
                      <div className="text-[11px] text-slate-500">Current step open in your workspace</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-200 text-xs font-bold text-slate-600">
                      3
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Upcoming (Neutral Slate)</div>
                      <div className="text-[11px] text-slate-500">Ready whenever you want to open it</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SEARCHABLE 30+ TERM STARTUP JARGON DECODER */}
          {activeTab === 'jargon' && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Kitchen-Table Startup, Banking &amp; Grant Jargon Decoder
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Search any financial, legal, or grant acronym in plain everyday English.
                  </p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="pointer-events-none absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={jargonSearch}
                    onChange={(e) => setJargonSearch(e.target.value)}
                    placeholder="Search e.g. DSCR, SURE, COGS..."
                    className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pr-3 pl-8 text-base sm:text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Stage Filter Pills */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'ALL' as const, label: 'All Stages' },
                  { id: 'STAGE_1_VALIDATION' as const, label: 'Stage 1 (Mod A–C)' },
                  { id: 'STAGE_2_BUILD_TEAM_SETUP' as const, label: 'Stage 2 (Mod D–G)' },
                  { id: 'STAGE_3_PRICING_FINANCE' as const, label: 'Stage 3 (Mod H–J)' },
                  { id: 'STAGE_4_GRANTS_LEGAL' as const, label: 'Stage 4 (Mod K–L)' },
                ].map((f) => {
                  const active = selectedStageFilter === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setSelectedStageFilter(f.id)}
                      className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                        active
                          ? 'border-emerald-700 bg-emerald-700 text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>

              {filteredGlossary.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-600">
                  No terms matched &ldquo;{jargonSearch}&rdquo;. Try clearing your search or switching stage filters.
                </div>
              ) : (
                <div className="space-y-5">
                  {(
                    [
                      'STAGE_1_VALIDATION',
                      'STAGE_2_BUILD_TEAM_SETUP',
                      'STAGE_3_PRICING_FINANCE',
                      'STAGE_4_GRANTS_LEGAL',
                    ] as JargonStageGroup[]
                  ).map((groupKey) => {
                    const groupItems = filteredGlossary.filter(
                      (item) => item.stageGroup === groupKey
                    );
                    if (groupItems.length === 0) return null;
                    return (
                      <div key={groupKey} className="space-y-2.5">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                          {JARGON_STAGE_LABELS[groupKey]}
                        </div>
                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                          {groupItems.map((item) => (
                            <div
                              key={item.key}
                              className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-xs font-bold text-slate-900">
                                  {item.term}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="shrink-0 border-slate-200 bg-slate-50 text-[10px] text-emerald-800"
                                >
                                  {item.moduleBadge}
                                </Badge>
                              </div>
                              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                                {item.plainEnglish}
                              </p>
                              {item.example && (
                                <p className="mt-1.5 rounded-md bg-emerald-50/70 px-2.5 py-1.5 text-[11px] leading-relaxed text-emerald-950">
                                  <strong>Example:</strong> {item.example}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
                    <h4 className="text-sm font-bold text-slate-900">
                      Capture First, Expand Second
                    </h4>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                      Never stress about polished corporate prose upfront. Jot your rough notes in your own everyday words first—then use the workspace helpers to structure, stress-test, and format them when ready.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-emerald-200/80 bg-emerald-50/30 p-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold text-white">
                    2
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Move at Your Own Pace (With Clear Stage Landmarks)
                    </h4>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                      Want to test whether your pricing works today? Jump straight to <strong>Module H (Pocket Profit Pricing)</strong> in <strong>Stage 3 (Modules H–J: Pricing, Marketing &amp; Finance)</strong>. Want to test customer demand first? Start in <strong>Stage 1 (Modules A–C: Idea, Market &amp; Customer Surveys)</strong>. Ready for company setup or grants? Explore <strong>Stage 2 (Modules D–G: Product, Team &amp; Launchpad)</strong> and <strong>Stage 4 (Modules K–L: Grants &amp; Business Plan)</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50 p-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-xs font-bold text-white">
                    3
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Write Once, Auto-Compile Everywhere
                    </h4>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                      You never have to re-type answers. Every figure and decision you save automatically feeds your 3-year cashflow, grant readiness checks, and Module L business plan drafts.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Bar */}
          <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
            <span className="text-xs text-slate-500">
              Need help on your current step? Open the <strong className="text-slate-800">Ask Preflight AI</strong> drawer anytime.
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
