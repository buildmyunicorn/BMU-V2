'use client';

import React, { useState, useMemo } from 'react';
import {
  Landmark,
  Check,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Building2,
  DollarSign,
  PieChart,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  getPlanTrackCapabilities,
  getGrantsForCountry,
} from '@/lib/localization';
import type {
  ActiveStartupPlan,
  ModuleKStep1AuditSavedData,
  ModuleKStep2CapitalStackSavedData,
  ModuleKStep3ReimbursementBridgeSavedData,
  ModuleKStep4TaxReliefSavedData,
  ModuleKStep5FundingBriefSavedData,
} from '@/lib/auth/session-store';
import type { BlindSpotItem } from '@/db/schema';
import { ModuleKGrantAuditStep } from '@/components/workspace/module-k-grant-audit-step';
import { ModuleKCapitalStackStep } from '@/components/workspace/module-k-capital-stack-step';
import { ModuleKReimbursementBridgeStep } from '@/components/workspace/module-k-reimbursement-bridge-step';
import { ModuleKTaxReliefStep } from '@/components/workspace/module-k-tax-relief-step';
import { ModuleKFundingBriefStep } from '@/components/workspace/module-k-funding-brief-step';
import {
  saveModuleKStep1AuditAction,
  saveModuleKStep2CapitalStackAction,
  saveModuleKStep3ReimbursementBridgeAction,
  saveModuleKStep4TaxReliefAction,
  saveModuleKStep5FundingBriefAction,
} from '@/app/actions/module-k';

export interface ModuleKWorkspaceProps {
  plan: ActiveStartupPlan;
  selectedCountry?: string;
  isVaultReadonly?: boolean;
  onSaveStep1Audit?: (
    step1Data: ModuleKStep1AuditSavedData,
    progress?: number
  ) => Promise<void> | void;
  onSaveStep2CapitalStack?: (
    step2Data: ModuleKStep2CapitalStackSavedData,
    progress?: number
  ) => Promise<void> | void;
  onSaveStep3Bridge?: (
    step3Data: ModuleKStep3ReimbursementBridgeSavedData,
    progress?: number
  ) => Promise<void> | void;
  onSaveStep4TaxRelief?: (
    step4Data: ModuleKStep4TaxReliefSavedData,
    progress?: number
  ) => Promise<void> | void;
  onSaveStep5Brief?: (
    step5Data: ModuleKStep5FundingBriefSavedData,
    progress?: number
  ) => Promise<void> | void;
  onBackToModuleJ?: () => void;
  onContinueToModuleL?: () => void;
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
  highlightTarget?: string;
}

export function ModuleKWorkspace({
  plan,
  selectedCountry,
  isVaultReadonly,
  onSaveStep1Audit,
  onSaveStep2CapitalStack,
  onSaveStep3Bridge,
  onSaveStep4TaxRelief,
  onSaveStep5Brief,
  onBackToModuleJ,
  onContinueToModuleL,
  onNavigateToModule,
  initialStep = 0,
  highlightTarget,
}: ModuleKWorkspaceProps) {
  const [openStep, setOpenStep] = useState<number | 'ALL'>(initialStep);

  const trackCaps = getPlanTrackCapabilities(
    plan.hqCountryCode || selectedCountry,
    plan.fundingTrackMode
  );
  const isGrantsEnabled = trackCaps.isGrantsEnabled;
  const countryFlag = trackCaps.countryFlag;
  const countryName = trackCaps.countryName;
  const regionalPerks = getGrantsForCountry(trackCaps.countryCode);

  const isStep1Complete = !!plan.moduleKData?.step1Audit?.lastAuditedAt;
  const isStep2Complete = !!plan.moduleKData?.step2CapitalStack?.lastSavedAt;
  const isStep3Complete = !!plan.moduleKData?.step3ReimbursementBridge?.lastSavedAt;
  const isStep4Complete = !!plan.moduleKData?.step4TaxRelief?.lastSavedAt;
  const isStep5Complete = !!plan.moduleKData?.step5FundingBrief?.lastSavedAt;

  const totalCoreSteps = isGrantsEnabled ? 5 : 2;
  const completedCoreStepsCount = isGrantsEnabled
    ? (isStep1Complete ? 1 : 0) +
      (isStep2Complete ? 1 : 0) +
      (isStep3Complete ? 1 : 0) +
      (isStep4Complete ? 1 : 0) +
      (isStep5Complete ? 1 : 0)
    : (isStep2Complete ? 1 : 0) + (isStep5Complete ? 1 : 0);

  const stepStripItems = isGrantsEnabled
    ? [
        {
          step: 'Step 1',
          title: '1. Grant Audit & Checklist',
          done: isStep1Complete,
          targetId: 'module-k-step-1',
          stepNum: 1,
        },
        {
          step: 'Step 2',
          title: '2. Capital Stack & Blend',
          done: isStep2Complete,
          targetId: 'module-k-step-2',
          stepNum: 2,
        },
        {
          step: 'Step 3',
          title: '3. Reimbursement Bridge',
          done: isStep3Complete,
          targetId: 'module-k-step-3',
          stepNum: 3,
        },
        {
          step: 'Step 4',
          title: '4. Angel Tax Relief',
          done: isStep4Complete,
          targetId: 'module-k-step-4',
          stepNum: 4,
        },
        {
          step: 'Overview',
          title: 'Funding Overview Brief',
          done: isStep5Complete,
          targetId: 'module-k-step-5',
          stepNum: 5,
        },
      ]
    : [
        {
          step: 'Step 1',
          title: '1. Capital Stack & Funding Blend',
          done: isStep2Complete,
          targetId: 'module-k-step-2',
          stepNum: 2,
        },
        {
          step: 'Overview',
          title: 'Funding Strategy Overview Brief',
          done: isStep5Complete,
          targetId: 'module-k-step-5',
          stepNum: 5,
        },
      ];

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER MODULE CARD (Strict GEMINI.md Baseline Standard)            */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-950 via-indigo-900 to-violet-900 p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-indigo-400/40 bg-indigo-500/30 text-indigo-100 text-[10px] shrink-0">
                Module K • {isGrantsEnabled ? 'Flagship Standalone #3' : 'Capital & Runway Hub'}
              </Badge>
              <Badge className="border-emerald-400/30 bg-emerald-500/20 text-emerald-200 text-[10px] shrink-0">
                <Sparkles className="mr-1 h-3 w-3" />
                {countryFlag} {countryName}{' '}
                {isGrantsEnabled ? 'Grants & Tax Relief Hub' : 'Capital & Funding Strategy'}
              </Badge>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              {isGrantsEnabled
                ? 'Module K: Non-Dilutive Grants, Loans & Investor Tax Relief Hub'
                : 'Module K: Capital Stack, Runway & Funding Readiness Hub'}
            </h1>
            <p className="max-w-2xl text-xs text-indigo-100/90 sm:text-sm">
              {isGrantsEnabled
                ? 'Cross-examine your startup plan against official assessor underwriting criteria, match non-dilutive government capital, and bridge grant cashflow timing lag.'
                : 'Structure your funding blend across founder bootstrapping, commercial bank facilities, angel/seed equity, and non-dilutive startup perks.'}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="flex items-center gap-2">
              {onBackToModuleJ && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onBackToModuleJ}
                  className="border-indigo-400/40 bg-white/10 text-xs text-white hover:bg-white/20"
                >
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                  Back to Module J
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpenStep((prev) => (prev === 'ALL' ? 0 : 'ALL'))}
                className="border-indigo-400/40 bg-white/10 text-xs text-white hover:bg-white/20"
              >
                {openStep === 'ALL' ? 'Focus Step-by-Step' : 'Expand All Steps'}
              </Button>
            </div>
            <div className="text-right text-[11px] text-indigo-200">
              Module K Progress:{' '}
              <strong className="text-white">
                {Math.round((completedCoreStepsCount / totalCoreSteps) * 100)}%
              </strong>{' '}
              ({completedCoreStepsCount} of {totalCoreSteps} Steps Ready)
            </div>
          </div>
        </div>

        {/* Step Navigation Strip (Tile Grid Standard) */}
        <div
          className={`mt-5 grid grid-cols-2 gap-2 border-t border-indigo-800/70 pt-4 ${
            isGrantsEnabled ? 'sm:grid-cols-3 lg:grid-cols-5' : 'sm:grid-cols-2'
          }`}
        >
          {stepStripItems.map((item, idx, arr) => {
            const firstIncompleteIdx = arr.findIndex((s) => !s.done);
            const isStepOpen =
              openStep === 'ALL'
                ? (firstIncompleteIdx === -1 ? idx === arr.length - 1 : idx === firstIncompleteIdx)
                : openStep === item.stepNum;
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => {
                  setOpenStep(item.stepNum);
                  setTimeout(() => {
                    const el = document.getElementById(item.targetId);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 40);
                }}
                className={`rounded-xl border px-3 py-2 text-left text-xs transition-all hover:border-white/50 hover:bg-white/15 ${
                  isStepOpen
                    ? 'border-amber-300/80 bg-white/20 text-white shadow-xs ring-1 ring-amber-300/50'
                    : item.done
                      ? 'border-emerald-400/40 bg-emerald-950/30 text-emerald-100'
                      : 'border-indigo-800/60 bg-indigo-950/40 text-indigo-300/70'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span>{item.step}</span>
                  {item.done ? (
                    <Check className="h-3.5 w-3.5 text-emerald-300" />
                  ) : isStepOpen ? (
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                  ) : null}
                </div>
                <div className="mt-0.5 truncate text-[11px]">{item.title}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Regional Non-Dilutive R&D & Startup Cloud Credits Banner for Non-IE/GB Commercial Plans */}
      {!isGrantsEnabled && (
        <div className="rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50/70 via-white to-emerald-50/50 p-4 shadow-xs">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-indigo-600 text-[10px] text-white">
                  {countryFlag} {countryName} Commercial Funding Mode
                </Badge>
                <span className="text-xs font-bold text-slate-900">
                  Streamlined Capital Stack (Government Grant Forms Hidden)
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Your workspace is configured for commercial execution in {countryName}. Below you can model your capital stack across bootstrapping, commercial bank facilities ({trackCaps.exampleBanksLabel}), and angel/seed equity.
              </p>
              {regionalPerks.length > 0 && (
                <p className="text-[11px] font-medium text-emerald-800 pt-1">
                  💡 <strong>Regional R&amp;D Incentive Note ({countryName}):</strong>{' '}
                  {regionalPerks[0].grantName} — {regionalPerks[0].maxAmountFormatted}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. STEP 1: AUTOMATED GRANT AUDIT & MULTI-GRANT PREREQUISITE CHECKLIST      */}
      {/* ========================================================================= */}
      {isGrantsEnabled && (
      <div id="module-k-step-1" className="scroll-mt-24">
        {openStep !== 'ALL' && openStep !== 1 ? (
          // Collapsed Step 1 Card
          <div
            onClick={() => setOpenStep(1)}
            className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    isStep1Complete ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
                  }`}
                >
                  {isStep1Complete ? <Check className="h-4 w-4" /> : '1'}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                    Step 1: Automated Cross-Platform Grant Audit &amp; Prerequisite Checklist
                  </h2>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    Live scan across Modules A–J evaluating legal structure, 3-quote rule, non-displacement, and match funds.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant="outline"
                  className={
                    isStep1Complete
                      ? 'border-emerald-300 bg-emerald-100 text-emerald-800 text-[10px]'
                      : 'border-slate-300 text-slate-600 text-[10px]'
                  }
                >
                  {isStep1Complete ? 'Audited' : 'In Progress'}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 shrink-0 px-2.5 text-xs font-medium text-indigo-600 group-hover:bg-indigo-50"
                >
                  {isStep1Complete ? 'Edit Step' : 'Open Step'}
                  <ChevronDown className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Expanded Step 1 Card
          <Card className="rounded-xl border border-slate-200 bg-white shadow-xs">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
                    1
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">
                      Step 1: Automated Cross-Platform Grant Audit &amp; Multi-Grant Checklist
                    </CardTitle>
                    <CardDescription className="mt-1 text-xs text-slate-600">
                      Select your target grant to test your business against official underwriting criteria. We automatically cross-check your legal structure, quote compliance, and export potential.
                    </CardDescription>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setOpenStep(0)}
                  className="text-xs text-slate-500 hover:bg-slate-100"
                >
                  Collapse Step
                  <ChevronUp className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              <ModuleKGrantAuditStep
                plan={plan}
                isVaultReadonly={isVaultReadonly}
                onSaveStep1={async (step1Data, progress) => {
                  if (onSaveStep1Audit) {
                    await onSaveStep1Audit(step1Data, progress);
                  } else {
                    await saveModuleKStep1AuditAction({
                      planId: plan.id,
                      step1Audit: step1Data,
                      completionPercentage: progress,
                    });
                  }
                }}
                onContinueToNextStep={() => setOpenStep(2)}
                onNavigateToModule={onNavigateToModule}
              />
            </CardContent>
          </Card>
        )}
      </div>
      )}

      {/* ========================================================================= */}
      {/* 3. STEP 2: CAPITAL STACK & SKIN-IN-THE-GAME BLEND                         */}
      {/* ========================================================================= */}
      <div id="module-k-step-2" className="scroll-mt-24">
        {openStep !== 'ALL' && openStep !== 2 ? (
          // Collapsed Step 2 Card
          <div
            onClick={() => setOpenStep(2)}
            className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    isStep2Complete ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
                  }`}
                >
                  {isStep2Complete ? <Check className="h-4 w-4" /> : isGrantsEnabled ? '2' : '1'}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                    {isGrantsEnabled
                      ? 'Step 2: Capital Stack & Skin-in-the-Game Blend'
                      : 'Step 1: Capital Stack & Funding Blend'}
                  </h2>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {isGrantsEnabled
                      ? 'Architect your funding blend between non-dilutive grants, founder equity, and soft government debt.'
                      : 'Architect your commercial funding blend across founder equity, commercial loans, angel investment, and customer revenue.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant="outline"
                  className={
                    isStep2Complete
                      ? 'border-emerald-300 bg-emerald-100 text-emerald-800 text-[10px]'
                      : 'border-slate-300 text-slate-600 text-[10px]'
                  }
                >
                  {isStep2Complete ? 'Configured' : 'In Progress'}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 shrink-0 px-2.5 text-xs font-medium text-indigo-600 group-hover:bg-indigo-50"
                >
                  {isStep2Complete ? 'Edit Step' : 'Open Step'}
                  <ChevronDown className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Expanded Step 2 Card
          <Card className="rounded-xl border border-slate-200 bg-white shadow-xs">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
                    {isGrantsEnabled ? '2' : '1'}
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">
                      {isGrantsEnabled
                        ? 'Step 2: Capital Stack & Skin-in-the-Game Blend'
                        : 'Step 1: Capital Stack & Funding Blend'}
                    </CardTitle>
                    <CardDescription className="mt-1 text-xs text-slate-600">
                      {isGrantsEnabled
                        ? 'Balance non-dilutive grants, founder matching equity, and soft government loans against your cashflow gap. Assessor rules require 50% skin-in-the-game.'
                        : 'Model your funding stack across founder capital, commercial credit, angel/VC equity, and early customer revenue against your Module J cashflow trough.'}
                    </CardDescription>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setOpenStep(0)}
                  className="text-xs text-slate-500 hover:bg-slate-100"
                >
                  Collapse Step
                  <ChevronUp className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              <ModuleKCapitalStackStep
                plan={plan}
                isVaultReadonly={isVaultReadonly}
                onSaveStep2={async (step2Data, progress) => {
                  if (onSaveStep2CapitalStack) {
                    await onSaveStep2CapitalStack(step2Data, progress);
                  } else {
                    await saveModuleKStep2CapitalStackAction({
                      planId: plan.id,
                      step2CapitalStack: step2Data,
                      completionPercentage: progress,
                    });
                  }
                }}
                onBackToStep1={() => setOpenStep(isGrantsEnabled ? 1 : 2)}
                onContinueToNextStep={() => setOpenStep(isGrantsEnabled ? 3 : 5)}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. STEP 3: GRANT REIMBURSEMENT TIMING BRIDGE                              */}
      {/* ========================================================================= */}
      {isGrantsEnabled && (
      <div id="module-k-step-3" className="scroll-mt-24">
        {openStep !== 'ALL' && openStep !== 3 ? (
          // Collapsed Step 3 Card
          <div
            onClick={() => setOpenStep(3)}
            className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    isStep3Complete ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
                  }`}
                >
                  {isStep3Complete ? <Check className="h-4 w-4" /> : '3'}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                    Step 3: Grant Reimbursement Timing Bridge (Cashflow Survival)
                  </h2>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    Map the 60–120 day arrears reimbursement lag to secure liquid working capital and avoid insolvency.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant="outline"
                  className={
                    isStep3Complete
                      ? 'border-emerald-300 bg-emerald-100 text-emerald-800 text-[10px]'
                      : 'border-slate-300 text-slate-600 text-[10px]'
                  }
                >
                  {isStep3Complete ? 'Bridged' : 'In Progress'}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 shrink-0 px-2.5 text-xs font-medium text-indigo-600 group-hover:bg-indigo-50"
                >
                  {isStep3Complete ? 'Edit Step' : 'Open Step'}
                  <ChevronDown className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Expanded Step 3 Card
          <Card className="rounded-xl border border-slate-200 bg-white shadow-xs">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
                    3
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">
                      Step 3: Grant Reimbursement Timing Bridge (Cashflow Survival)
                    </CardTitle>
                    <CardDescription className="mt-1 text-xs text-slate-600">
                      Government grants are paid strictly in arrears. Prove to assessors that you have sufficient liquid capital to pay supplier invoices upfront before claim vouchers clear.
                    </CardDescription>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setOpenStep(0)}
                  className="text-xs text-slate-500 hover:bg-slate-100"
                >
                  Collapse Step
                  <ChevronUp className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              <ModuleKReimbursementBridgeStep
                plan={plan}
                isVaultReadonly={isVaultReadonly}
                onSaveStep3={async (step3Data, progress) => {
                  if (onSaveStep3Bridge) {
                    await onSaveStep3Bridge(step3Data, progress);
                  } else {
                    await saveModuleKStep3ReimbursementBridgeAction({
                      planId: plan.id,
                      step3Bridge: step3Data,
                      completionPercentage: progress,
                    });
                  }
                }}
                onBackToStep2={() => setOpenStep(2)}
                onContinueToNextStep={() => setOpenStep(4)}
              />
            </CardContent>
          </Card>
        )}
      </div>
      )}

      {/* ========================================================================= */}
      {/* 5. STEP 4: INVESTOR TAX RELIEF & ANGEL CATALYST (SEIS/EIS & SURE/EII)       */}
      {/* ========================================================================= */}
      {isGrantsEnabled && (
      <div id="module-k-step-4">
        {openStep !== 'ALL' && openStep !== 4 ? (
          <div
            onClick={() => setOpenStep(4)}
            className="group scroll-mt-24 cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    isStep4Complete
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  {isStep4Complete ? <Check className="h-4 w-4" /> : '4'}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                    Step 4: Investor Tax Relief &amp; Angel Catalyst (SEIS/EIS &amp; SURE/EII)
                  </h2>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {plan.moduleKData?.step4TaxRelief?.targetReliefRaiseAmount
                      ? `Target round: ${plan.baseCurrency} ${plan.moduleKData.step4TaxRelief.targetReliefRaiseAmount.toLocaleString()} • Status: ${plan.moduleKData.step4TaxRelief.advanceAssuranceStatus.replace(/_/g, ' ')}`
                      : 'Structure up to 50% income tax relief (UK SEIS/EIS) or 41% PAYE refunds (IE SURE) to de-risk equity investors.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isStep4Complete ? (
                  <Badge className="border-emerald-300 bg-emerald-100 text-emerald-800 text-[10px] shrink-0 font-medium">
                    <Check className="mr-1 h-3 w-3" /> Relief Structured
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-slate-300 text-slate-600 text-[10px] shrink-0 font-medium">
                    In Progress
                  </Badge>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 shrink-0 px-2.5 text-xs font-medium text-indigo-600 group-hover:bg-indigo-50"
                >
                  {isStep4Complete ? 'Edit Step' : 'Open Step'}
                  <ChevronDown className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Card className="rounded-xl border border-slate-200 bg-white shadow-xs">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
                    4
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-base font-bold text-slate-900">
                        Step 4: Investor Tax Relief &amp; Angel Catalyst (SEIS/EIS &amp; SURE/EII)
                      </CardTitle>
                      {isStep4Complete && (
                        <Badge className="border-emerald-300 bg-emerald-100 text-emerald-800 text-[10px] shrink-0 font-medium">
                          <Check className="mr-1 h-3 w-3" /> Relief Structured
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="mt-1 text-xs text-slate-600">
                      Structure state-backed angel incentives (UK HMRC SEIS/EIS 50% tax write-off or Irish Revenue SURE 41% PAYE refunds) to unlock private matching capital.
                    </CardDescription>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setOpenStep(0)}
                  className="text-xs text-slate-500 hover:bg-slate-100"
                >
                  Collapse Step
                  <ChevronUp className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              <ModuleKTaxReliefStep
                plan={plan}
                isVaultReadonly={isVaultReadonly}
                onSaveStep4={async (step4Data, progress) => {
                  if (onSaveStep4TaxRelief) {
                    await onSaveStep4TaxRelief(step4Data, progress);
                  } else {
                    await saveModuleKStep4TaxReliefAction({
                      planId: plan.id,
                      step4TaxRelief: step4Data,
                      completionPercentage: progress,
                    });
                  }
                }}
                onBackToStep3={() => setOpenStep(3)}
                onContinueToNextStep={() => setOpenStep(5)}
              />
            </CardContent>
          </Card>
        )}
      </div>
      )}

      {/* Module K Final Overview Brief & Phased Funding Roadmap */}
      <div id="module-k-step-5" className="scroll-mt-24">
        {openStep !== 'ALL' && openStep !== 5 ? (
          <div
            onClick={() => setOpenStep(5)}
            className="group scroll-mt-24 cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    isStep5Complete
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  {isStep5Complete ? <Check className="h-4 w-4" /> : <Landmark className="h-4 w-4" />}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                    Module K Final Overview Brief &amp; Phased Funding Strategy
                  </h2>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {isStep5Complete
                      ? isGrantsEnabled
                        ? 'Phased grant application roadmap and executive funding brief compiled for Module L.'
                        : 'Phased capital raising roadmap and executive funding brief compiled for Module L.'
                      : isGrantsEnabled
                        ? 'Generate your phased grant application pipeline, assessor pre-flight audit, and 1-click dossier for Module L.'
                        : 'Generate your phased fundraising milestones, capital readiness audit, and 1-click dossier for Module L.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isStep5Complete ? (
                  <Badge className="border-emerald-300 bg-emerald-100 text-emerald-800 text-[10px] shrink-0 font-medium">
                    <Check className="mr-1 h-3 w-3" /> Overview Ready
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-slate-300 text-slate-600 text-[10px] shrink-0 font-medium">
                    Overview
                  </Badge>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 shrink-0 px-2.5 text-xs font-medium text-indigo-600 group-hover:bg-indigo-50"
                >
                  {isStep5Complete ? 'Review Overview' : 'Open Overview'}
                  <ChevronDown className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Card className="rounded-xl border border-slate-200 bg-white shadow-xs">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                      isStep5Complete
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 text-white'
                    }`}
                  >
                    {isStep5Complete ? <Check className="h-4 w-4" /> : <Landmark className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-base font-bold text-slate-900">
                        Module K Final Overview Brief &amp; Phased Funding Strategy
                      </CardTitle>
                      {isStep5Complete && (
                        <Badge className="border-emerald-300 bg-emerald-100 text-emerald-800 text-[10px] shrink-0 font-medium">
                          <Check className="mr-1 h-3 w-3" /> Overview Ready
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="mt-1 text-xs text-slate-600">
                      {isGrantsEnabled
                        ? 'Review your sequenced grant application roadmap (apply for Grant A, then Grant B, then Angel match), underwriter contradiction flags, and 1-click dossier export to Module L.'
                        : 'Review your sequenced commercial fundraising roadmap, capital alignment audit, and 1-click dossier export to Module L.'}
                    </CardDescription>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setOpenStep(0)}
                  className="text-xs text-slate-500 hover:bg-slate-100"
                >
                  Collapse
                  <ChevronUp className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              <ModuleKFundingBriefStep
                plan={plan}
                isVaultReadonly={isVaultReadonly}
                onSaveStep5={async (step5Data, progress) => {
                  if (onSaveStep5Brief) {
                    await onSaveStep5Brief(step5Data, progress);
                  } else {
                    await saveModuleKStep5FundingBriefAction({
                      planId: plan.id,
                      step5FundingBrief: step5Data,
                      completionPercentage: progress,
                    });
                  }
                }}
                onBackToStep4={() => setOpenStep(isGrantsEnabled ? 4 : 2)}
                onContinueToModuleL={() => {
                  if (onContinueToModuleL) {
                    onContinueToModuleL();
                  } else if (onNavigateToModule) {
                    onNavigateToModule('MOD_L_BUSINESS_PLAN');
                  }
                }}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
