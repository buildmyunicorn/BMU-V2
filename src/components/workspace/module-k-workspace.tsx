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
import type {
  ActiveStartupPlan,
  ModuleKStep1AuditSavedData,
  ModuleKStep2CapitalStackSavedData,
} from '@/lib/auth/session-store';
import type { BlindSpotItem } from '@/db/schema';
import { ModuleKGrantAuditStep } from '@/components/workspace/module-k-grant-audit-step';
import { ModuleKCapitalStackStep } from '@/components/workspace/module-k-capital-stack-step';
import {
  saveModuleKStep1AuditAction,
  saveModuleKStep2CapitalStackAction,
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
  onBackToModuleJ,
  onContinueToModuleL,
  onNavigateToModule,
  initialStep = 1,
  highlightTarget,
}: ModuleKWorkspaceProps) {
  const [openStep, setOpenStep] = useState<number | 'ALL'>(initialStep);

  const isUK = plan.hqCountryCode === 'GB';
  const countryFlag = isUK ? '🇬🇧' : '🇮🇪';
  const countryName = isUK ? 'United Kingdom' : 'Ireland';

  const isStep1Complete = !!plan.moduleKData?.step1Audit?.lastAuditedAt;
  const isStep2Complete = !!plan.moduleKData?.step2CapitalStack?.lastSavedAt;

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER MODULE CARD                                                 */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-indigo-950 p-6 text-white shadow-lg sm:p-8">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 text-[11px] font-bold uppercase tracking-wider">
                Module K • Flagship Standalone #3
              </Badge>
              <Badge variant="outline" className="border-white/20 bg-white/10 text-white text-[11px]">
                {countryFlag} {countryName} Grants &amp; Tax Relief Hub
              </Badge>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Non-Dilutive Grants, Loans &amp; Investor Tax Relief Hub
            </h1>
            <p className="max-w-2xl text-xs text-emerald-100/90 sm:text-sm">
              Cross-examine your startup plan against official assessor underwriting criteria, match non-dilutive government capital, and bridge grant cashflow timing lag.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onBackToModuleJ && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBackToModuleJ}
                className="border-white/20 bg-white/10 text-xs font-semibold text-white hover:bg-white/20"
              >
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                Back to Module J
              </Button>
            )}
          </div>
        </div>

        {/* Step Navigation Strip */}
        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4 text-xs">
          <button
            type="button"
            onClick={() => setOpenStep(1)}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 font-medium transition-all ${
              openStep === 1
                ? 'bg-white/20 text-white font-bold shadow-xs'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                isStep1Complete ? 'bg-emerald-500' : 'bg-white/20'
              }`}
            >
              {isStep1Complete ? '✓' : '1'}
            </span>
            <span>Step 1: Grant Audit &amp; Checklist</span>
          </button>

          <button
            type="button"
            onClick={() => setOpenStep(2)}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 font-medium transition-all ${
              openStep === 2
                ? 'bg-white/20 text-white font-bold shadow-xs'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                isStep2Complete ? 'bg-emerald-500' : 'bg-white/20'
              }`}
            >
              {isStep2Complete ? '✓' : '2'}
            </span>
            <span>Step 2: Capital Stack</span>
          </button>

          <button
            type="button"
            onClick={() => setOpenStep(3)}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 font-medium transition-all ${
              openStep === 3
                ? 'bg-white/20 text-white font-bold shadow-xs'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold text-white">
              3
            </span>
            <span>Step 3: Reimbursement Bridge</span>
          </button>

          <button
            type="button"
            onClick={() => setOpenStep(4)}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 font-medium transition-all ${
              openStep === 4
                ? 'bg-white/20 text-white font-bold shadow-xs'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold text-white">
              4
            </span>
            <span>Step 4: Angel Tax Relief</span>
          </button>

          <button
            type="button"
            onClick={() => setOpenStep(5)}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 font-medium transition-all ${
              openStep === 5
                ? 'bg-white/20 text-white font-bold shadow-xs'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold text-white">
              5
            </span>
            <span>Step 5: Funding Brief</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. STEP 1: AUTOMATED GRANT AUDIT & MULTI-GRANT PREREQUISITE CHECKLIST      */}
      {/* ========================================================================= */}
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
                  {isStep2Complete ? <Check className="h-4 w-4" /> : '2'}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                    Step 2: Capital Stack &amp; Skin-in-the-Game Blend
                  </h2>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    Architect your funding blend between non-dilutive grants, founder equity, and soft government debt.
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
                    2
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">
                      Step 2: Capital Stack &amp; Skin-in-the-Game Blend
                    </CardTitle>
                    <CardDescription className="mt-1 text-xs text-slate-600">
                      Balance non-dilutive grants, founder matching equity, and soft government loans against your cashflow gap. Assessor rules require 50% skin-in-the-game.
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
                onBackToStep1={() => setOpenStep(1)}
                onContinueToNextStep={() => setOpenStep(3)}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Placeholder previews for Steps 3 to 5 */}
      {[3, 4, 5].map((stepNum) => {
        const stepTitles: Record<number, { title: string; subtitle: string }> = {
          2: {
            title: 'Step 2: Capital Stack & Skin-in-the-Game Blend',
            subtitle:
              'Balance non-dilutive grants, founder equity match, and government-backed loans against your Module J Cashflow Gap.',
          },
          3: {
            title: 'Step 3: Grant Reimbursement Timing Bridge (Cashflow Survival)',
            subtitle:
              'Map the 60–120 day delay between paying invoices and receiving grant reimbursement to prevent insolvency.',
          },
          4: {
            title: 'Step 4: Investor Tax Relief & Angel Catalyst (SEIS/EIS & SURE/EII)',
            subtitle:
              'Activate 50% income tax relief to close angel rounds and claim PAYE cash refunds from prior employment.',
          },
          5: {
            title: 'Step 5: Executive Funding Strategy Brief & Assessor Audit',
            subtitle:
              'Generate an assessor-ready summary brief and pre-flight contradiction audit ready for Module L.',
          },
        };

        const info = stepTitles[stepNum];

        return (
          <div
            key={stepNum}
            onClick={() => setOpenStep(stepNum)}
            className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">
                  {stepNum}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                    {info.title}
                  </h2>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{info.subtitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="border-slate-300 text-slate-500 text-[10px]">
                  Upcoming Step
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 shrink-0 px-2.5 text-xs font-medium text-slate-500 group-hover:bg-slate-50"
                >
                  Preview
                  <ChevronDown className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
