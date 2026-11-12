'use client';

import React, { useState } from 'react';
import {
  FileText,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  Layers,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Lightbulb,
  X,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  formatPlanCurrency,
  getPlanTrackCapabilities,
} from '@/lib/localization';
import type {
  ActiveStartupPlan,
  ModuleLStep1ModeSavedData,
  ModuleLStep2ContradictionAuditSavedData,
  ModuleLStep3NarrativeCompilerSavedData,
  ModuleLStep4AppendicesSavedData,
  ModuleLStep5SubmissionBriefSavedData,
} from '@/lib/auth/session-store';
import {
  ModuleLModeSelectorStep,
  MODULE_L_COMPILER_MODES,
} from '@/components/workspace/module-l-mode-selector-step';
import { ModuleLContradictionAuditStep } from '@/components/workspace/module-l-contradiction-audit-step';
import { ModuleLNarrativeCompilerStep } from '@/components/workspace/module-l-narrative-compiler-step';
import { ModuleLAppendicesBinderStep } from '@/components/workspace/module-l-appendices-binder-step';
import { ModuleLSubmissionDossierStep } from '@/components/workspace/module-l-submission-dossier-step';

export interface ModuleLWorkspaceProps {
  plan: ActiveStartupPlan;
  selectedCountry?: string;
  isVaultReadonly?: boolean;
  onSaveStep1Mode?: (
    step1Data: ModuleLStep1ModeSavedData,
    progress?: number
  ) => Promise<void> | void;
  onSaveStep2Audit?: (
    step2Data: ModuleLStep2ContradictionAuditSavedData,
    progress?: number
  ) => Promise<void> | void;
  onSaveStep3Compiler?: (
    step3Data: ModuleLStep3NarrativeCompilerSavedData,
    progress?: number
  ) => Promise<void> | void;
  onSaveStep4Appendices?: (
    step4Data: ModuleLStep4AppendicesSavedData,
    progress?: number
  ) => Promise<void> | void;
  onSaveStep5Brief?: (
    step5Data: ModuleLStep5SubmissionBriefSavedData,
    progress?: number
  ) => Promise<void> | void;
  onParkQuestionInSession?: (questionText: string) => void;
  onBackToModuleK?: () => void;
  onOpenMasterBlueprint?: () => void;
  onNavigateToModule?: (
    moduleCode:
      | 'MOD_A_IDEATION'
      | 'MOD_B_MARKET'
      | 'MOD_C_SURVEYS_FEEDBACK'
      | 'MOD_D_PRODUCT_BUILD'
      | 'MOD_E_OPERATIONS'
      | 'MOD_F_COFOUNDER_TEAM'
      | 'MOD_G_LAUNCHPAD'
      | 'MOD_H_REVENUE'
      | 'MOD_I_MARKETING'
      | 'MOD_J_FINANCE'
      | 'MOD_K_GRANTS_FUNDING'
      | 'MOD_L_BUSINESS_PLAN',
    targetStep?: number,
    highlightId?: string
  ) => void;
  initialStep?: number;
}

export function ModuleLWorkspace({
  plan,
  isVaultReadonly = false,
  onSaveStep1Mode,
  onSaveStep2Audit,
  onSaveStep3Compiler,
  onSaveStep4Appendices,
  onSaveStep5Brief,
  onParkQuestionInSession,
  onBackToModuleK,
  onOpenMasterBlueprint,
  onNavigateToModule,
  initialStep,
}: ModuleLWorkspaceProps) {
  const isStep1Complete = Boolean(plan.moduleLData?.step1Mode?.lastSavedAt);
  const isStep2Complete = Boolean(plan.moduleLData?.step2Audit?.lastSavedAt);
  const isStep3Complete = Boolean(plan.moduleLData?.step3Compiler?.lastSavedAt);
  const isStep4Complete = Boolean(plan.moduleLData?.step4Appendices?.lastSavedAt);
  const isStep5Complete = Boolean(plan.moduleLData?.step5DossierBrief?.lastSavedAt);

  const defaultOpenStep =
    initialStep ??
    (!isStep1Complete
      ? 1
      : !isStep2Complete
        ? 2
        : !isStep3Complete
          ? 3
          : !isStep4Complete
            ? 4
            : 5);

  const [openStep, setOpenStep] = useState<number | 'ALL'>(defaultOpenStep);

  const trackCaps = getPlanTrackCapabilities(
    plan.hqCountryCode,
    plan.fundingTrackMode
  );
  const isUK = trackCaps.countryCode === 'GB';
  const isIreland = trackCaps.countryCode === 'IE';
  const isGrantsEnabled = trackCaps.isGrantsEnabled;
  const countryFlag = trackCaps.countryFlag;
  const countryName = trackCaps.countryName;
  const currency =
    plan.baseCurrency || (isUK ? 'GBP' : isIreland ? 'EUR' : 'USD');

  const completedCoreStepsCount =
    (isStep1Complete ? 1 : 0) +
    (isStep2Complete ? 1 : 0) +
    (isStep3Complete ? 1 : 0) +
    (isStep4Complete ? 1 : 0) +
    (isStep5Complete ? 1 : 0);

  const savedCompilerMode = plan.moduleLData?.step1Mode?.compilerMode;
  const activeCompilerMode = !isGrantsEnabled
    ? savedCompilerMode === 'OTHER'
      ? 'OTHER'
      : 'STANDARD_COMMERCIAL_PLAN'
    : savedCompilerMode ||
      (isIreland
        ? 'IE_LEO_OFFICIAL_FORM'
        : isUK
          ? 'UK_INNOVATE_UK_9Q'
          : 'STANDARD_COMMERCIAL_PLAN');

  const activeCatalogItem =
    MODULE_L_COMPILER_MODES.find((m) => m.mode === activeCompilerMode) ||
    MODULE_L_COMPILER_MODES[0];

  function scrollToStep(stepNum: number, targetId: string) {
    setOpenStep(stepNum);
    setTimeout(() => {
      const el = document.getElementById(targetId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 40);
  }

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER MODULE CARD (Strict GEMINI.md Section 6.1 Standard)         */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-slate-200 border border-slate-800 bg-slate-950 text-white shadow-xs p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-emerald-400/40 bg-emerald-500/30 text-slate-200 text-[10px] shrink-0">
                Module L • Capstone Official Compiler
              </Badge>
              <Badge className="border-emerald-400/30 bg-emerald-500/20 text-emerald-200 text-[10px] shrink-0">
                <Sparkles className="mr-1 h-3 w-3" />
                {countryFlag} {countryName}{' '}
                {isGrantsEnabled
                  ? 'Grant & Business Plan Compiler'
                  : 'Commercial & Investor Plan Compiler'}
              </Badge>
              <Badge className="border-emerald-600/40 bg-slate-500/20 text-slate-200 text-[10px] shrink-0">
                {activeCatalogItem.badge}
              </Badge>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              {isGrantsEnabled
                ? 'Module L: Interactive Business Plan & Official Grant Compiler'
                : 'Module L: Interactive Commercial & Investor Business Plan Compiler'}
            </h1>
            <p className="max-w-2xl text-xs text-slate-200/90 sm:text-sm">
              {isGrantsEnabled
                ? 'Transform your verified answers across Modules A–K into committee-ready IE LEO forms, UK Innovate UK 9-Question applications, Start Up Loan workbooks, or SEIS/EIS/EII investor packs with Appendices A–F.'
                : 'Transform your verified answers across Modules A–K into bank-ready commercial business plans, angel/seed investor memos, or custom accelerator applications with Appendices A–F.'}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              {onBackToModuleK && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onBackToModuleK}
                  className="border-emerald-400/40 bg-white/10 text-xs text-white hover:bg-white/20"
                >
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                  Back to Module K
                </Button>
              )}
              {onOpenMasterBlueprint && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onOpenMasterBlueprint}
                  className="border-emerald-400/50 bg-emerald-500/20 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/30"
                >
                  <BookOpen className="mr-1.5 h-3.5 w-3.5 text-emerald-300" />
                  View Master Blueprint
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setOpenStep((prev) => (prev === 'ALL' ? 1 : 'ALL'))
                }
                className="border-emerald-400/40 bg-white/10 text-xs text-white hover:bg-white/20"
              >
                {openStep === 'ALL' ? 'Focus Step-by-Step' : 'Expand All Steps'}
              </Button>
            </div>
            <div className="text-right text-[11px] text-slate-300">
              Module L Progress:{' '}
              <strong className="text-white">
                {Math.round((completedCoreStepsCount / 5) * 100)}%
              </strong>{' '}
              ({completedCoreStepsCount} of 5 Steps Ready)
            </div>
          </div>
        </div>

        {/* Step Navigation Strip (Tile Grid Standard) */}
        <div className="mt-5 grid grid-cols-2 gap-2 border-t border-slate-850 pt-4 sm:grid-cols-3 lg:grid-cols-5">
          {[
            {
              step: 'Step 1',
              title: '1. Compiler Mode & Rubric',
              done: isStep1Complete,
              targetId: 'module-l-step-1',
              stepNum: 1,
            },
            {
              step: 'Step 2',
              title: '2. Pre-Flight Grant Audit',
              done: isStep2Complete,
              targetId: 'module-l-step-2',
              stepNum: 2,
            },
            {
              step: 'Step 3',
              title: '3. Section Narrative Compiler',
              done: isStep3Complete,
              targetId: 'module-l-step-3',
              stepNum: 3,
            },
            {
              step: 'Step 4',
              title: '4. Appendices A–F Binder',
              done: isStep4Complete,
              targetId: 'module-l-step-4',
              stepNum: 4,
            },
            {
              step: 'Overview',
              title: 'Submission Dossier Brief',
              done: isStep5Complete,
              targetId: 'module-l-step-5',
              stepNum: 5,
            },
          ].map((item, idx, arr) => {
            const firstIncompleteIdx = arr.findIndex((s) => !s.done);
            const isStepOpen =
              openStep === 'ALL'
                ? firstIncompleteIdx === -1
                  ? idx === arr.length - 1
                  : idx === firstIncompleteIdx
                : openStep === item.stepNum;
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => scrollToStep(item.stepNum, item.targetId)}
                className={`rounded-xl border px-3 py-2 text-left text-xs transition-all hover:border-white/50 hover:bg-white/15 ${
                  isStepOpen
                    ? 'border-amber-300/80 bg-white/20 text-white shadow-xs ring-1 ring-amber-300/50'
                    : item.done
                      ? 'border-emerald-400/50 bg-emerald-500/20 text-white'
                      : 'border-slate-200 bg-slate-950/40 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-semibold text-white/90 text-xs">
                    {item.step}
                  </span>
                  {item.done ? (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-400/25 px-1.5 py-0.5 text-[10px] font-bold text-emerald-200">
                      <Check className="h-2.5 w-2.5" /> Ready
                    </span>
                  ) : isStepOpen ? (
                    <span className="inline-flex items-center rounded-full bg-amber-400/25 px-1.5 py-0.5 text-[10px] font-bold text-amber-200">
                      Open
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-300">Pending</span>
                  )}
                </div>
                <div className="mt-0.5 truncate text-[11px] text-slate-200/80">
                  {item.title}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: COMPILER MODE, TARGET COMMITTEE & SCORING RUBRIC                  */}
      {/* ========================================================================= */}
      <ModuleLModeSelectorStep
        plan={plan}
        isOpen={openStep === 'ALL' || openStep === 1}
        onOpenStep={() => setOpenStep(1)}
        onToggleCollapse={() => setOpenStep(0)}
        isVaultReadonly={isVaultReadonly}
        onSaveStep1={async (step1Data, progress = 20) => {
          await onSaveStep1Mode?.(step1Data, progress);
        }}
        onAdvanceToStep2={() => scrollToStep(2, 'module-l-step-2')}
        onJumpToCompilerStep3={() => scrollToStep(3, 'module-l-step-3')}
        onParkQuestionInSession={onParkQuestionInSession}
      />

      {/* ========================================================================= */}
      {/* STEP 2: PRE-FLIGHT CONTRADICTION & GRANT AUDIT (Collapsed / Preview)      */}
      {/* ========================================================================= */}
      {openStep !== 'ALL' && openStep !== 2 ? (
        <div
          id="module-l-step-2"
          onClick={() => setOpenStep(2)}
          className="group scroll-mt-24 cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-emerald-300 hover:shadow-sm"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  isStep2Complete
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 text-white'
                }`}
              >
                {isStep2Complete ? <Check className="h-4 w-4" /> : '2'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-sm font-bold text-slate-900 group-hover:text-emerald-800">
                    2. Cross-Module Contradiction &amp; Grant Audit (Pre-Flight Gatekeeper)
                  </h2>
                  <Badge
                    variant="outline"
                    className="shrink-0 border-slate-300 text-slate-600 text-[10px] font-medium"
                  >
                    {isStep2Complete ? 'Audit Complete' : 'Next Up'}
                  </Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  Reconciles pricing vs. survey WTP, headcount vs. payroll, cashflow trough vs. capital stack, and 3-quote compliance across Modules A–K.
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 shrink-0 px-2.5 text-xs font-medium text-emerald-700 group-hover:bg-emerald-50"
            >
              {isStep2Complete ? 'Edit Step' : 'Open Step'}
              <ChevronDown className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <Card
          id="module-l-step-2"
          className="scroll-mt-24 rounded-xl border border-slate-200 bg-white shadow-xs"
        >
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-xs font-bold text-white">
                  2
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base font-bold text-slate-900">
                      2. Cross-Module Contradiction &amp; Grant Audit (Pre-Flight Gatekeeper)
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className="shrink-0 border-slate-200 bg-emerald-50 text-emerald-800 text-[10px] font-medium"
                    >
                      Synced to {activeCatalogItem.badge}
                    </Badge>
                  </div>
                  <CardDescription className="mt-1 text-xs text-slate-600">
                    Automated cross-examination of your numbers and narratives across Modules A–K before compiling your final submission sections.
                  </CardDescription>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setOpenStep(0)}
                className="shrink-0 text-xs text-slate-500 hover:bg-slate-100"
              >
                Collapse Step
                <ChevronUp className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <ModuleLContradictionAuditStep
              plan={plan}
              isVaultReadonly={isVaultReadonly}
              onSaveStep2Audit={async (data, progress = 40) => {
                if (onSaveStep2Audit) {
                  await onSaveStep2Audit(data, progress);
                }
              }}
              onBackToStep1={() => {
                setOpenStep(1);
                const el = document.getElementById('module-l-step-1');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              onContinueToStep3={() => {
                setOpenStep(3);
                const el = document.getElementById('module-l-step-3');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              onNavigateToModule={onNavigateToModule}
              onParkQuestionInSession={onParkQuestionInSession}
            />
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: SECTION-BY-SECTION NARRATIVE COMPILER                             */}
      {/* ========================================================================= */}
      {openStep !== 3 && openStep !== 'ALL' ? (
        <div
          id="module-l-step-3"
          onClick={() => setOpenStep(3)}
          className="group scroll-mt-24 cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-emerald-300 hover:shadow-sm"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  isStep3Complete
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 text-white'
                }`}
              >
                {isStep3Complete ? <Check className="h-4 w-4" /> : '3'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-sm font-bold text-slate-900 group-hover:text-emerald-800">
                    3. Interactive Section-by-Section Narrative &amp; Question Compiler
                  </h2>
                  <Badge
                    variant="outline"
                    className="shrink-0 border-slate-300 text-slate-600 text-[10px] font-medium"
                  >
                    {activeCatalogItem.sectionStructureLabel}
                  </Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  Auto-assembles your official application responses from Modules A–K with live word-limit gauges, scoring rubrics, and inline AI calibration.
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 shrink-0 px-2.5 text-xs font-medium text-emerald-700 group-hover:bg-emerald-50"
            >
              {isStep3Complete ? 'Edit Step' : 'Open Step'}
              <ChevronDown className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <Card
          id="module-l-step-3"
          className="scroll-mt-24 rounded-xl border border-slate-200 bg-white shadow-xs"
        >
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-xs font-bold text-white">
                  3
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base font-bold text-slate-900">
                      3. Interactive Section-by-Section Narrative &amp; Question Compiler
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className="shrink-0 border-slate-200 bg-emerald-50 text-emerald-800 text-[10px] font-medium"
                    >
                      {activeCatalogItem.sectionStructureLabel}
                    </Badge>
                  </div>
                  <CardDescription className="mt-1 text-xs text-slate-600">
                    Auto-assembles your official application responses from Modules A–K with live word-limit gauges, scoring rubrics, and inline AI calibration.
                  </CardDescription>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setOpenStep(0)}
                className="shrink-0 text-xs text-slate-500 hover:bg-slate-100"
              >
                Collapse Step
                <ChevronUp className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <ModuleLNarrativeCompilerStep
              plan={plan}
              isVaultReadonly={isVaultReadonly}
              onSaveStep3Compiler={async (data, progress = 60) => {
                if (onSaveStep3Compiler) {
                  await onSaveStep3Compiler(data, progress);
                }
              }}
              onBackToStep2={() => {
                setOpenStep(2);
                const el = document.getElementById('module-l-step-2');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              onContinueToStep4={() => {
                setOpenStep(4);
                const el = document.getElementById('module-l-step-4');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              onNavigateToModule={onNavigateToModule}
              onParkQuestionInSession={onParkQuestionInSession}
            />
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: MANDATORY APPENDICES A–F EVIDENCE BINDER                           */}
      {/* ========================================================================= */}
      {openStep !== 4 && openStep !== 'ALL' ? (
        <div
          id="module-l-step-4"
          onClick={() => setOpenStep(4)}
          className="group scroll-mt-24 cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-emerald-300 hover:shadow-sm"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  isStep4Complete
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 text-white'
                }`}
              >
                {isStep4Complete ? <Check className="h-4 w-4" /> : '4'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-sm font-bold text-slate-900 group-hover:text-emerald-800">
                    4. Mandatory Appendices &amp; Verifiable Proof Binder (Appendices A–F)
                  </h2>
                  <Badge
                    variant="outline"
                    className="shrink-0 border-slate-300 text-slate-600 text-[10px] font-medium"
                  >
                    Appendices A–F
                  </Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  Attaches 36-Month Financials (App A), Technical Work Packages (App B), 3-Quotes (App C), Promoter CVs (App D), Survey Proof (App E) &amp; Statutory Setup (App F).
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 shrink-0 px-2.5 text-xs font-medium text-emerald-700 group-hover:bg-emerald-50"
            >
              {isStep4Complete ? 'Edit Step' : 'Open Step'}
              <ChevronDown className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <Card
          id="module-l-step-4"
          className="scroll-mt-24 rounded-xl border border-slate-200 bg-white shadow-xs"
        >
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-xs font-bold text-white">
                  4
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base font-bold text-slate-900">
                      4. Mandatory Appendices &amp; Verifiable Proof Binder (Appendices A–F)
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className="shrink-0 border-slate-200 bg-emerald-50 text-emerald-800 text-[10px] font-medium"
                    >
                      Appendices A–F
                    </Badge>
                  </div>
                  <CardDescription className="mt-1 text-xs text-slate-600">
                    Attaches 36-Month Financials (App A), Technical Work Packages (App B), 3-Quotes (App C), Promoter CVs (App D), Survey Proof (App E) &amp; Statutory Setup (App F).
                  </CardDescription>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setOpenStep(0)}
                className="shrink-0 text-xs text-slate-500 hover:bg-slate-100"
              >
                Collapse Step
                <ChevronUp className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <ModuleLAppendicesBinderStep
              plan={plan}
              isVaultReadonly={isVaultReadonly}
              onSaveStep4Appendices={async (data, progress = 80) => {
                if (onSaveStep4Appendices) {
                  await onSaveStep4Appendices(data, progress);
                }
              }}
              onBackToStep3={() => {
                setOpenStep(3);
                const el = document.getElementById('module-l-step-3');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              onContinueToStep5={() => {
                setOpenStep(5);
                const el = document.getElementById('module-l-step-5');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              onNavigateToModule={onNavigateToModule}
              onParkQuestionInSession={onParkQuestionInSession}
            />
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* STEP 5 (OVERVIEW): OFFICIAL SUBMISSION DOSSIER BRIEF (Strict Section 6.4) */}
      {/* ========================================================================= */}
      {openStep !== 5 && openStep !== 'ALL' ? (
        <div
          id="module-l-step-5"
          onClick={() => setOpenStep(5)}
          className="group scroll-mt-24 cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-emerald-300 hover:shadow-sm"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  isStep5Complete
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 text-white'
                }`}
              >
                {isStep5Complete ? <Check className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-sm font-bold text-slate-900 group-hover:text-emerald-800">
                    5. Official Submission Dossier &amp; Executive Brief
                  </h2>
                  <Badge
                    variant="outline"
                    className="shrink-0 border-slate-200 bg-emerald-50 text-emerald-800 text-[10px] font-medium"
                  >
                    {completedCoreStepsCount}/5 Sections Ready
                  </Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  Final committee submission checklist, Things to Consider review, and 1-click PDF / Standalone HTML / Markdown dossier export.
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 shrink-0 px-2.5 text-xs font-medium text-emerald-700 group-hover:bg-emerald-50"
            >
              <span>{isStep5Complete ? 'Open Overview' : 'Review Overview'}</span>
              <ChevronDown className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <Card
          id="module-l-step-5"
          className="scroll-mt-24 rounded-xl border border-slate-200 bg-white shadow-xs"
        >
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-slate-50 via-white to-slate-50/30 pb-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-xs font-bold text-white">
                  5
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base font-bold text-slate-900">
                      5. Official Submission Dossier &amp; Executive Brief
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className="shrink-0 border-slate-200 bg-emerald-50 text-emerald-800 text-[10px] font-medium"
                    >
                      Final Capstone &amp; Submission
                    </Badge>
                  </div>
                  <CardDescription className="mt-1 text-xs text-slate-600">
                    Comprehensive final gatekeeper, assessor audit score, statutory checklist &amp; standalone printable dossier export.
                  </CardDescription>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setOpenStep(0)}
                className="shrink-0 text-xs text-slate-500 hover:bg-slate-100"
              >
                Collapse Step
                <ChevronUp className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <ModuleLSubmissionDossierStep
              plan={plan}
              isVaultReadonly={isVaultReadonly}
              onSaveStep5Brief={async (data, progress = 100) => {
                if (onSaveStep5Brief) {
                  await onSaveStep5Brief(data, progress);
                }
              }}
              onBackToStep4={() => {
                setOpenStep(4);
                const el = document.getElementById('module-l-step-4');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              onOpenMasterBlueprint={onOpenMasterBlueprint}
              onNavigateToModule={onNavigateToModule}
              onParkQuestionInSession={onParkQuestionInSession}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
