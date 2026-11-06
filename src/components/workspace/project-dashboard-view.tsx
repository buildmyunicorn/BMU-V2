'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  BookOpen,
  Compass,
  MessageSquare,
  DollarSign,
  Scale,
  Wrench,
  Briefcase,
  BookmarkPlus,
  Calendar,
  Users,
  Presentation,
  UserCheck,
  ArrowRight,
  Check,
  Copy,
  Lock,
  ShieldCheck,
  Layers,
  Bell,
  CheckCircle2,
  GitBranch,
  Plus,
  Landmark,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ModuleCode } from '@/lib/entitlements';
import type { SupportedCountryCode } from '@/lib/localization';
import { isGrantCheckerSupportedForCountry } from '@/lib/grants/module-a-grant-checker';

export interface ProjectDashboardModuleProgress {
  code: ModuleCode;
  short: string;
  title: string;
  progress: number;
  allowed: boolean;
  lockReason?: string;
}

export interface ProjectDashboardViewProps {
  founderName: string;
  planId: string;
  planTitle: string;
  oneLinerSummary?: string;
  industryCategory: string;
  hqCountryCode: SupportedCountryCode;
  countryName: string;
  currencyCode: string;
  isPivot?: boolean;
  activeModule: ModuleCode;
  activeModuleTitle: string;
  moduleProgressList: ProjectDashboardModuleProgress[];
  masterDocSyncedChaptersCount: number;
  masterDocTotalChaptersCount: number;
  masterDocOverallProgressPercent: number;
  savedDossiersCount: number;
  surveyResponsesCount: number;
  waitlistLeadsCount: number;
  publicSurveySlug?: string;
  matchedGrantsCount: number;
  grantReadinessPercent?: number;
  grantReadinessCompletedCount?: number;
  grantReadinessTotalCriteria?: number;
  launchpadStepsCompletedCount: number;
  launchpadProgressPercent: number;
  openQuestionsCount: number;
  openQuestionsPreview: string[];
  moduleAProgressPercent: number;
  moduleHProgressPercent: number;
  onEnterWorkspace: (targetModule?: ModuleCode, targetStep?: number) => void;
  onOpenMasterDocument: () => void;
  onOpenBusinessPlanStudio: () => void;
  onOpenGrantCenter?: () => void;
  onCreateNewPlan?: () => void;
  onClonePlan?: () => void;
  isCloningPlan?: boolean;
}

const COMING_SOON_FEATURES = [
  {
    id: 'go_live_countdown',
    title: 'Go-Live Countdown Calendar',
    badge: 'COMING SOON',
    icon: Calendar,
    accentBg: 'bg-indigo-50 text-indigo-700 border-indigo-200/70',
    description:
      'Enter your target launch date and get a reverse-engineered, week-by-week execution schedule across MVP build, legal setup, grant lead times, and launch marketing.',
    highlightPill: 'Reverse Launch Planner',
  },
  {
    id: 'find_cofounder',
    title: 'Find a Co-Founder Directory',
    badge: 'COMING SOON',
    icon: Users,
    accentBg: 'bg-violet-50 text-violet-700 border-violet-200/70',
    description:
      'Match with technical, commercial, or operations co-founders based on your missing "7 Startup Hats" and pre-screen compatibility before you commit.',
    highlightPill: 'Complementary Skill Matcher',
  },
  {
    id: 'ai_pitch_deck',
    title: 'AI Pitch Deck & Teaser Studio',
    badge: 'COMING SOON',
    icon: Presentation,
    accentBg: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
    description:
      'Auto-convert your synced Living Master Document into a 10-slide angel/seed investor pitch deck and a 1-page executive teaser PDF.',
    highlightPill: '10-Slide Deck Generator',
  },
  {
    id: 'mentor_review_room',
    title: 'Mentor & LEO Advisor Room',
    badge: 'COMING SOON',
    icon: UserCheck,
    accentBg: 'bg-amber-50 text-amber-800 border-amber-200/70',
    description:
      'Share a secure, read-only review link of your plan so your accountant, startup mentor, or grant advisor can leave inline feedback.',
    highlightPill: 'Stakeholder Review Link',
  },
] as const;

export function ProjectDashboardView({
  founderName,
  planId,
  planTitle,
  oneLinerSummary,
  industryCategory,
  hqCountryCode,
  countryName,
  currencyCode,
  isPivot,
  activeModule,
  activeModuleTitle,
  moduleProgressList,
  masterDocSyncedChaptersCount,
  masterDocTotalChaptersCount,
  masterDocOverallProgressPercent,
  savedDossiersCount,
  surveyResponsesCount,
  waitlistLeadsCount,
  publicSurveySlug,
  matchedGrantsCount,
  grantReadinessPercent,
  grantReadinessCompletedCount,
  grantReadinessTotalCriteria,
  launchpadStepsCompletedCount,
  launchpadProgressPercent,
  openQuestionsCount,
  openQuestionsPreview,
  moduleAProgressPercent,
  moduleHProgressPercent,
  onEnterWorkspace,
  onOpenMasterDocument,
  onOpenBusinessPlanStudio,
  onOpenGrantCenter,
}: ProjectDashboardViewProps) {
  const [notifiedFeatures, setNotifiedFeatures] = useState<string[]>([]);
  const [copiedSurveyLink, setCopiedSurveyLink] = useState(false);
  const isGrantSupported = isGrantCheckerSupportedForCountry(hqCountryCode);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('spf_coming_soon_waitlist');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setNotifiedFeatures(parsed);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  function handleToggleNotifyFeature(featureId: string) {
    setNotifiedFeatures((prev) => {
      const next = prev.includes(featureId)
        ? prev.filter((id) => id !== featureId)
        : [...prev, featureId];
      try {
        localStorage.setItem('spf_coming_soon_waitlist', JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  }

  async function handleCopySurveyLink(e: React.MouseEvent) {
    e.stopPropagation();
    if (!publicSurveySlug || typeof window === 'undefined') return;
    const url = `${window.location.origin}/v/${publicSurveySlug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedSurveyLink(true);
      setTimeout(() => setCopiedSurveyLink(false), 2500);
    } catch {
      // Ignore clipboard fallback
    }
  }

  const startedModulesCount = moduleProgressList.filter(
    (m) => m.progress > 0
  ).length;
  const completedModulesCount = moduleProgressList.filter(
    (m) => m.progress >= 100
  ).length;
  const overallVentureReadiness = Math.round(
    moduleProgressList.reduce((acc, m) => acc + m.progress, 0) /
      Math.max(1, moduleProgressList.length)
  );

  const firstName = founderName?.trim().split(' ')[0] || 'Founder';

  return (
    <div className="space-y-7 pb-10">
      {/* =================================================================== */}
      {/* TOP HERO BANNER: Signature Platform Indigo-to-Violet Gradient Card  */}
      {/* =================================================================== */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-900/60 bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 p-5 text-white shadow-md sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-indigo-400/40 bg-indigo-500/25 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-100">
                Founder Command Center
              </Badge>
              <Badge className="border-white/20 bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-100">
                {countryName} ({currencyCode}) • {industryCategory}
              </Badge>
              {isPivot && (
                <Badge className="border-violet-300/40 bg-violet-500/30 px-2 py-0.5 text-[10px] font-bold text-violet-100">
                  Pivot Branch
                </Badge>
              )}
            </div>

            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl lg:text-3xl">
              Welcome back, {firstName}. Here is your project hub for{' '}
              <span className="underline decoration-emerald-400/70 decoration-2 underline-offset-4">
                {planTitle}
              </span>
              .
            </h1>

            <p className="text-xs leading-relaxed text-indigo-100/90 sm:text-sm">
              {oneLinerSummary?.trim()
                ? oneLinerSummary
                : 'Build your venture step-by-step in the Founder Workspace, review your whole-picture Master Document, or launch any standalone tool below.'}
            </p>
          </div>

          {/* Right Vitals & Primary Resume CTA */}
          <div className="flex flex-col items-stretch gap-3 rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-xs sm:flex-row sm:items-center lg:flex-col lg:items-end lg:min-w-[290px]">
            <div className="flex w-full items-center justify-between gap-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">
                  Venture Preflight Readiness
                </div>
                <div className="mt-0.5 flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold tracking-tight text-white">
                    {overallVentureReadiness}%
                  </span>
                  <span className="text-xs text-indigo-200">
                    ({startedModulesCount} of {moduleProgressList.length}{' '}
                    Modules Active)
                  </span>
                </div>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 ring-1 ring-emerald-400/40">
                <ShieldCheck className="h-5 w-5 text-emerald-300" />
              </div>
            </div>

            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-300"
                style={{ width: `${Math.max(6, overallVentureReadiness)}%` }}
              />
            </div>

            <div className="flex w-full flex-wrap items-center gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                onClick={() => onEnterWorkspace(activeModule)}
                className="w-full bg-emerald-500 text-xs font-bold text-slate-950 shadow-xs hover:bg-emerald-400 sm:flex-1"
              >
                Resume {activeModuleTitle}
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Module Mini Progress Strip inside Hero */}
        <div className="mt-5 border-t border-white/15 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-indigo-200">
            <span className="font-semibold uppercase tracking-wider text-indigo-200/90">
              Quick Jump to Module (A–L):
            </span>
            <span>
              {completedModulesCount} Completed • {openQuestionsCount} Parked
              Open Question{openQuestionsCount === 1 ? '' : 's'}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-1.5 sm:grid-cols-6 lg:grid-cols-12">
            {moduleProgressList.map((mod) => (
              <button
                key={mod.code}
                type="button"
                onClick={() => onEnterWorkspace(mod.code)}
                title={`${mod.short}: ${mod.title} (${mod.progress}%)`}
                className={`group flex flex-col items-start justify-between rounded-lg border px-2.5 py-1.5 text-left transition-all ${
                  mod.code === activeModule
                    ? 'border-emerald-400/70 bg-white/20 text-white shadow-2xs'
                    : mod.progress > 0
                      ? 'border-white/20 bg-white/10 text-indigo-100 hover:bg-white/20'
                      : 'border-white/10 bg-white/5 text-indigo-200/75 hover:bg-white/15 hover:text-white'
                }`}
              >
                <div className="flex w-full items-center justify-between gap-1">
                  <span className="text-[11px] font-extrabold">
                    {mod.short.replace('Module ', '')}
                  </span>
                  {!mod.allowed ? (
                    <Lock className="h-3 w-3 text-amber-300" />
                  ) : mod.progress >= 100 ? (
                    <Check className="h-3 w-3 text-emerald-300" />
                  ) : (
                    <span className="text-[10px] font-semibold opacity-80">
                      {mod.progress}%
                    </span>
                  )}
                </div>
                <span className="mt-0.5 w-full truncate text-[10px] text-indigo-100/80">
                  {mod.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* ROW 1: CORE VENTURE PIPELINE (BUILD -> REVIEW -> COMPILE -> APPLY)  */}
      {/* =================================================================== */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
              {isGrantSupported
                ? '1. Core Venture Pipeline — Build, Review, Compile & Apply'
                : '1. Core Venture Pipeline — Build, Review & Compile'}
            </h2>
            <p className="text-xs text-slate-500">
              {isGrantSupported
                ? 'Your guided pathway: build modules, review the master blueprint, compile official dossiers, and walk through grant applications.'
                : 'Your guided pathway: build modules, review the master blueprint, and compile official investor & commercial dossiers.'}
            </p>
          </div>
          <Badge
            variant="outline"
            className="border-indigo-200 bg-indigo-50/70 text-[10px] font-bold text-indigo-700"
          >
            {isGrantSupported
              ? 'BUILD → REVIEW → COMPILE → APPLY'
              : 'BUILD → REVIEW → COMPILE'}
          </Badge>
        </div>

        <div
          className={`grid grid-cols-1 gap-4 ${
            isGrantSupported
              ? 'sm:grid-cols-2 xl:grid-cols-4'
              : 'sm:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {/* Card 1: Founder Workspace (Modules A–L) */}
          <div
            onClick={() => onEnterWorkspace(activeModule)}
            className="group relative flex cursor-pointer flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-indigo-400 hover:shadow-md"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                  <Compass className="h-5 w-5" />
                </div>
                <Badge className="border-indigo-200 bg-indigo-50 text-[10px] font-bold text-indigo-800">
                  STEP 1 • BUILD
                </Badge>
              </div>

              <h3 className="mt-4 text-base font-bold text-slate-900 group-hover:text-indigo-600">
                Founder Workspace (Modules A–L)
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                Your guided step-by-step builder to stress-test your startup
                idea, market sizing, product build, operations, team, and 3-year
                financials.
              </p>
            </div>

            <div className="mt-5 space-y-3 border-t border-slate-100 pt-3.5">
              <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs">
                <span className="font-medium text-slate-600">Active Step:</span>
                <span className="font-bold text-indigo-700 truncate max-w-[180px]">
                  {activeModuleTitle}
                </span>
              </div>

              <Button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEnterWorkspace(activeModule);
                }}
                className="w-full bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700"
              >
                Continue Building
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Card 2: Living Master Document */}
          <div
            onClick={onOpenMasterDocument}
            className="group relative flex cursor-pointer flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-emerald-400 hover:shadow-md"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                  <BookOpen className="h-5 w-5" />
                </div>
                <Badge className="border-emerald-200 bg-emerald-50 text-[10px] font-bold text-emerald-800">
                  STEP 2 • REVIEW
                </Badge>
              </div>

              <h3 className="mt-4 text-base font-bold text-slate-900 group-hover:text-emerald-700">
                Living Master Document
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                Your single source of truth. Read your entire startup blueprint
                from top to bottom in one continuous, zero-hallucination
                executive document.
              </p>
            </div>

            <div className="mt-5 space-y-3 border-t border-slate-100 pt-3.5">
              <div className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50/50 px-3 py-2 text-xs">
                <span className="font-medium text-slate-600">
                  Blueprint Sync:
                </span>
                <span className="font-bold text-emerald-800">
                  {masterDocSyncedChaptersCount}/{masterDocTotalChaptersCount}{' '}
                  Chapters • {masterDocOverallProgressPercent}%
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenMasterDocument();
                }}
                className="w-full border-emerald-300 bg-white text-xs font-bold text-emerald-800 hover:bg-emerald-50"
              >
                Open Master Document
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Card 3: Business Plan Studio (Multi-Version) */}
          <div
            onClick={onOpenBusinessPlanStudio}
            className="group relative flex cursor-pointer flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-violet-400 hover:shadow-md"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-xs">
                  <Sparkles className="h-5 w-5" />
                </div>
                <Badge className="border-violet-200 bg-violet-50 text-[10px] font-bold text-violet-800">
                  STEP 3 • COMPILE &amp; EXPORT
                </Badge>
              </div>

              <h3 className="mt-4 text-base font-bold text-slate-900 group-hover:text-violet-700">
                Business Plan Studio
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                Compile and export tailored business plans for IE LEO Grants, UK
                Innovate UK, Start Up Loans, commercial banks, or angel investors.
              </p>
            </div>

            <div className="mt-5 space-y-3 border-t border-slate-100 pt-3.5">
              <div className="flex items-center justify-between rounded-lg border border-violet-100 bg-violet-50/50 px-3 py-2 text-xs">
                <span className="font-medium text-slate-600">
                  Saved Versions:
                </span>
                <span className="font-bold text-violet-900">
                  {savedDossiersCount} Dossier
                  {savedDossiersCount === 1 ? '' : 's'} Ready
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenBusinessPlanStudio();
                }}
                className="w-full border-violet-300 bg-white text-xs font-bold text-violet-800 hover:bg-violet-50"
              >
                Open Plan Studio
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Card 4: Grant Application Center (IE & GB only) */}
          {isGrantSupported && (
            <div
              onClick={onOpenGrantCenter}
              className="group relative flex cursor-pointer flex-col justify-between rounded-2xl border border-amber-200/90 bg-gradient-to-b from-amber-50/40 via-white to-white p-5 shadow-xs transition-all hover:border-amber-400 hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-xs">
                    <Landmark className="h-5 w-5" />
                  </div>
                  <Badge className="border-amber-200 bg-amber-100/80 text-[10px] font-bold text-amber-900">
                    STEP 4 • APPLY
                  </Badge>
                </div>

                <h3 className="mt-4 text-base font-bold text-slate-900 group-hover:text-amber-800">
                  Apply for Grants
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                  Direct portal links, plan completeness checklist, 31 Irish LEO contacts, and AI portal question answerer.
                </p>
              </div>

              <div className="mt-5 space-y-3 border-t border-slate-100 pt-3.5">
                <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs">
                  <span className="font-medium text-amber-900">
                    Plan Readiness:
                  </span>
                  <span className="font-bold text-amber-950">
                    {grantReadinessCompletedCount ?? 0}/{grantReadinessTotalCriteria ?? 10} Ready ({grantReadinessPercent ?? 0}%)
                  </span>
                </div>

                <Button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenGrantCenter?.();
                  }}
                  className="w-full bg-amber-600 text-xs font-bold text-white hover:bg-amber-700 shadow-2xs"
                >
                  Apply for Grants
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =================================================================== */}
      {/* ROW 2: VALIDATION, PRICING & GRANTS (LIVE STANDALONE TOOLS)         */}
      {/* =================================================================== */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
              2. Validation, Pricing &amp; Non-Dilutive Funding
            </h2>
            <p className="text-xs text-slate-500">
              Jump straight into customer surveys, interactive breakeven
              stress-testing, and grant matching for {planTitle}.
            </p>
          </div>
          <Badge
            variant="outline"
            className="border-emerald-200 bg-emerald-50/70 text-[10px] font-bold text-emerald-800"
          >
            LIVE TOOLS
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Card 1: Customer Surveys & Waitlist (Module C) */}
          <div
            onClick={() => onEnterWorkspace('MOD_C_SURVEYS_FEEDBACK')}
            className="group flex cursor-pointer flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-indigo-300 hover:shadow-md"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-indigo-200/70 bg-indigo-50 text-indigo-700">
                  <MessageSquare className="h-4.5 w-4.5" />
                </div>
                <Badge
                  variant="outline"
                  className="border-slate-200 bg-slate-50 text-[10px] font-semibold text-slate-700"
                >
                  Module C • Validation
                </Badge>
              </div>

              <h3 className="mt-3.5 text-base font-bold text-slate-900 group-hover:text-indigo-600">
                Customer Surveys &amp; Waitlist
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Build bias-free &ldquo;Mom Test&rdquo; customer surveys, share
                your public validation link &amp; QR code, and capture early
                waitlist leads.
              </p>
            </div>

            <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs">
                <span className="text-slate-600">Live Validation Feed:</span>
                <span className="font-bold text-slate-900">
                  {surveyResponsesCount} Response
                  {surveyResponsesCount === 1 ? '' : 's'} • {waitlistLeadsCount}{' '}
                  Waitlist
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEnterWorkspace('MOD_C_SURVEYS_FEEDBACK');
                  }}
                  className="flex-1 border-slate-200 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                >
                  Open Survey Studio
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
                {publicSurveySlug && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={handleCopySurveyLink}
                    title="Copy Public Survey URL"
                    className="px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                  >
                    {copiedSurveyLink ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Pocket Profit & What-If Breakeven Sandbox (Module H) */}
          <div
            onClick={() => onEnterWorkspace('MOD_H_REVENUE', 3)}
            className="group flex cursor-pointer flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-indigo-300 hover:shadow-md"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-200/70 bg-emerald-50 text-emerald-700">
                  <DollarSign className="h-4.5 w-4.5" />
                </div>
                <Badge
                  variant="outline"
                  className="border-slate-200 bg-slate-50 text-[10px] font-semibold text-slate-700"
                >
                  Module H • Unit Economics
                </Badge>
              </div>

              <h3 className="mt-3.5 text-base font-bold text-slate-900 group-hover:text-indigo-600">
                Pocket Profit &amp; What-If Sandbox
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Interactive 3-year breakeven crossover engine. Stress-test your
                pricing, customer targets, and personal survival salary without
                spreadsheets.
              </p>
            </div>

            <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs">
                <span className="text-slate-600">Commercial Model:</span>
                <span className="font-bold text-emerald-700">
                  {moduleHProgressPercent > 0
                    ? `${moduleHProgressPercent}% Calibrated`
                    : 'Ready to Stress-Test'}
                </span>
              </div>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onEnterWorkspace('MOD_H_REVENUE', 3);
                }}
                className="w-full border-slate-200 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
              >
                Open Pocket Profit Sandbox
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Card 3: Grants, Loans & Tax Relief Radar (Module K) */}
          <div
            onClick={() => onEnterWorkspace('MOD_K_GRANTS_FUNDING')}
            className="group flex cursor-pointer flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-indigo-300 hover:shadow-md"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-200/70 bg-violet-50 text-violet-700">
                  <Scale className="h-4.5 w-4.5" />
                </div>
                <Badge
                  variant="outline"
                  className="border-slate-200 bg-slate-50 text-[10px] font-semibold text-slate-700"
                >
                  Module K • {hqCountryCode} Funding
                </Badge>
              </div>

              <h3 className="mt-3.5 text-base font-bold text-slate-900 group-hover:text-indigo-600">
                Grants &amp; Funding Radar
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                {hqCountryCode === 'IE'
                  ? 'Match with LEO Feasibility, Priming, Digital Vouchers, Enterprise Ireland New Frontiers, SURE & R&D Tax Credits.'
                  : hqCountryCode === 'GB'
                    ? 'Match with British Business Bank Start Up Loans, Innovate UK Smart Grants, HMRC SEIS/EIS & R&D relief.'
                    : 'Explore non-dilutive startup grants, government loans, and investor tax relief schemes for your jurisdiction.'}
              </p>
            </div>

            <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs">
                <span className="text-slate-600">Matched Programs:</span>
                <span className="font-bold text-violet-800">
                  {matchedGrantsCount} {countryName} Program
                  {matchedGrantsCount === 1 ? '' : 's'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEnterWorkspace('MOD_K_GRANTS_FUNDING');
                  }}
                  className="flex-1 border-slate-200 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                >
                  Explore Grants
                </Button>
                {isGrantSupported && onOpenGrantCenter && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenGrantCenter();
                    }}
                    className="bg-amber-600 text-xs font-bold text-white hover:bg-amber-700"
                  >
                    Apply Now
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* ROW 3: OPERATIONS, LAUNCHPAD & SUPPLIER QUOTES (LIVE SETUP TOOLS)   */}
      {/* =================================================================== */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
              3. Operations Setup, Supplier Quotes &amp; Idea Vault
            </h2>
            <p className="text-xs text-slate-500">
              Practical company setup checklists, grant-compliant supplier RFPs,
              and your parked open questions.
            </p>
          </div>
          <Badge
            variant="outline"
            className="border-slate-200 bg-white text-[10px] font-bold text-slate-700"
          >
            OPERATIONS &amp; SETUP
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Card 1: Getting Set Up / Launchpad (Module G) */}
          <div
            onClick={() => onEnterWorkspace('MOD_G_LAUNCHPAD')}
            className="group flex cursor-pointer flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-indigo-300 hover:shadow-md"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-indigo-200/70 bg-indigo-50 text-indigo-700">
                  <Wrench className="h-4.5 w-4.5" />
                </div>
                <Badge
                  variant="outline"
                  className="border-slate-200 bg-slate-50 text-[10px] font-semibold text-slate-700"
                >
                  Module G • Launchpad
                </Badge>
              </div>

              <h3 className="mt-3.5 text-base font-bold text-slate-900 group-hover:text-indigo-600">
                Getting Set Up (Launchpad Hub)
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Company registration, live{' '}
                <code>
                  {hqCountryCode === 'IE'
                    ? '.ie'
                    : hqCountryCode === 'GB'
                      ? '.co.uk'
                      : '.com'}
                </code>{' '}
                domain availability checker, business banking bounties,
                accounting &amp; startup insurance.
              </p>
            </div>

            <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs">
                <span className="text-slate-600">Operations Readiness:</span>
                <span className="font-bold text-indigo-700">
                  {launchpadStepsCompletedCount} of 6 Cards ({launchpadProgressPercent}%)
                </span>
              </div>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onEnterWorkspace('MOD_G_LAUNCHPAD');
                }}
                className="w-full border-slate-200 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
              >
                Open Launchpad Checklist
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Card 2: 3-Quote Supplier Concierge (Modules D & E) */}
          <div
            onClick={() => onEnterWorkspace('MOD_E_OPERATIONS', 2)}
            className="group flex cursor-pointer flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-indigo-300 hover:shadow-md"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-200/70 bg-emerald-50 text-emerald-700">
                  <Briefcase className="h-4.5 w-4.5" />
                </div>
                <Badge className="border-emerald-200 bg-emerald-50 text-[10px] font-bold text-emerald-800">
                  3-QUOTE CONCIERGE
                </Badge>
              </div>

              <h3 className="mt-3.5 text-base font-bold text-slate-900 group-hover:text-indigo-600">
                3-Quote Supplier Concierge
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Need 3 official supplier quotes for a LEO or Innovate UK grant
                claim? Generate standardized RFPs for software build or capital
                equipment.
              </p>
            </div>

            <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs">
                <span className="text-slate-600">Procurement Rule:</span>
                <span className="font-bold text-emerald-800">
                  Grant Appendix C Ready
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEnterWorkspace('MOD_D_PRODUCT_BUILD', 4);
                  }}
                  className="border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  Dev/Tech Quotes
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEnterWorkspace('MOD_E_OPERATIONS', 2);
                  }}
                  className="border-slate-200 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-50"
                >
                  Equipment Quotes
                </Button>
              </div>
            </div>
          </div>

          {/* Card 3: Open Questions & Concept Fit Vault (Module A) */}
          <div
            onClick={() => onEnterWorkspace('MOD_A_IDEATION', 7)}
            className="group flex cursor-pointer flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-amber-300 hover:shadow-md"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-200/80 bg-amber-50 text-amber-700">
                  <BookmarkPlus className="h-4.5 w-4.5" />
                </div>
                <Badge className="border-amber-200 bg-amber-50 text-[10px] font-bold text-amber-900">
                  {openQuestionsCount} PARKED QUESTION
                  {openQuestionsCount === 1 ? '' : 'S'}
                </Badge>
              </div>

              <h3 className="mt-3.5 text-base font-bold text-slate-900 group-hover:text-indigo-600">
                Open Questions &amp; Concept Vault
              </h3>
              {openQuestionsPreview.length > 0 ? (
                <ul className="mt-1.5 space-y-1 text-xs text-slate-600">
                  {openQuestionsPreview.slice(0, 2).map((q, idx) => (
                    <li
                      key={idx}
                      className="truncate rounded bg-amber-50/60 px-2 py-1 text-[11px] text-amber-950"
                    >
                      • {q}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Review your 1-Page Concept Canvas, Founder-Idea Fit Scorecard,
                  and resolve any open questions you parked while building.
                </p>
              )}
            </div>

            <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs">
                <span className="text-slate-600">Module A Concept Fit:</span>
                <span className="font-bold text-slate-900">
                  {moduleAProgressPercent}% Complete
                </span>
              </div>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onEnterWorkspace('MOD_A_IDEATION', 7);
                }}
                className="w-full border-slate-200 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
              >
                Review Concept Brief &amp; Questions
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* ROW 4: COMING SOON TO STARTUP PREFLIGHT (4-COLUMN ROADMAP)          */}
      {/* =================================================================== */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
              4. Coming Soon to Startup Preflight — Ecosystem &amp; Roadmap
            </h2>
            <p className="text-xs text-slate-500">
              Upcoming founder tools currently in development. Request early
              access on the tools most valuable to your launch.
            </p>
          </div>
          <Badge
            variant="outline"
            className="border-violet-200 bg-violet-50/70 text-[10px] font-bold text-violet-800"
          >
            COMING SOON • EARLY ACCESS
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {COMING_SOON_FEATURES.map((item) => {
            const IconComponent = item.icon;
            const isNotified = notifiedFeatures.includes(item.id);

            return (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white via-white to-slate-50/60 p-4.5 shadow-xs transition-all hover:border-slate-300"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${item.accentBg}`}
                    >
                      <IconComponent className="h-4.5 w-4.5" />
                    </div>
                    <Badge
                      variant="outline"
                      className="border-amber-300/80 bg-amber-50 text-[9px] font-extrabold uppercase tracking-wider text-amber-900"
                    >
                      {item.badge}
                    </Badge>
                  </div>

                  <h3 className="mt-3.5 text-sm font-bold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                    {item.description}
                  </p>
                </div>

                <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-3">
                  <div className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                    ✦ {item.highlightPill}
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant={isNotified ? 'secondary' : 'outline'}
                    onClick={() => handleToggleNotifyFeature(item.id)}
                    className={`w-full text-xs font-semibold transition-all ${
                      isNotified
                        ? 'border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-indigo-700'
                    }`}
                  >
                    {isNotified ? (
                      <>
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                        On Early Access List
                      </>
                    ) : (
                      <>
                        <Bell className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
                        Notify Me When Live
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
