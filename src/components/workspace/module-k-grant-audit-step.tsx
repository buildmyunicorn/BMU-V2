'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Check,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Lightbulb,
  ExternalLink,
  ArrowRight,
  Sparkles,
  Info,
  ChevronRight,
  TrendingUp,
  FileCheck,
  Layers,
  Award,
  Clock,
  RotateCcw,
  Building2,
  DollarSign,
  BookmarkCheck,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type {
  ActiveStartupPlan,
  ModuleKGrantKey,
  ModuleKStep1AuditSavedData,
} from '@/lib/auth/session-store';
import {
  SUPPORTED_GRANT_PROGRAMS,
  evaluateAllEligibleGrantsForPlan,
  evaluatePlanGrantCheckpoints,
  type SupportedGrantProgramKey,
  type EvaluatedGrantProgramAudit,
  type GrantAuditCheckpoint,
} from '@/lib/grants/module-k-grant-audit';
import { generateModuleKStep1AuditOverviewAction } from '@/app/actions/module-k';

export interface ModuleKGrantAuditStepProps {
  plan: ActiveStartupPlan;
  isVaultReadonly?: boolean;
  onSaveStep1?: (data: ModuleKStep1AuditSavedData, progress?: number) => Promise<void> | void;
  onContinueToNextStep?: () => void;
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
}

export function ModuleKGrantAuditStep({
  plan,
  isVaultReadonly,
  onSaveStep1,
  onContinueToNextStep,
  onNavigateToModule,
}: ModuleKGrantAuditStepProps) {
  const isUK = plan.hqCountryCode === 'GB';
  const targetCountry = isUK ? 'GB' : 'IE';

  // Evaluate all grants for the country
  const allEvaluations = useMemo(() => {
    return evaluateAllEligibleGrantsForPlan(plan);
  }, [plan]);

  const defaultKey: SupportedGrantProgramKey =
    plan.moduleKData?.step1Audit?.selectedGrantKey ||
    (allEvaluations.length > 0 ? allEvaluations[0].programKey : isUK ? 'GB_BBB_START_UP_LOAN' : 'IE_LEO_PRIMING');

  const [selectedGrantKey, setSelectedGrantKey] = useState<SupportedGrantProgramKey>(defaultKey);
  const [filterTab, setFilterTab] = useState<'ALL' | 'NEEDS_ACTION' | 'PASSED'>('ALL');
  const [activeWhyCard, setActiveWhyCard] = useState<boolean>(false);
  const [activeExampleCard, setActiveExampleCard] = useState<boolean>(false);
  const [founderNotes, setFounderNotes] = useState<string>(
    plan.moduleKData?.step1Audit?.founderNotes || ''
  );
  const [aiAuditOverview, setAiAuditOverview] = useState<string>(
    plan.moduleKData?.step1Audit?.aiAuditOverview || ''
  );
  const [aiAssessorTip, setAiAssessorTip] = useState<string | null>(
    plan.moduleKData?.step1Audit?.aiAssessorTip || null
  );
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Active evaluation audit for the selected grant
  const activeAudit: EvaluatedGrantProgramAudit = useMemo(() => {
    const found = allEvaluations.find((e) => e.programKey === selectedGrantKey);
    if (found) return found;
    return evaluatePlanGrantCheckpoints(plan, selectedGrantKey);
  }, [allEvaluations, selectedGrantKey, plan]);

  // Filtered checkpoints
  const filteredCheckpoints = useMemo(() => {
    if (filterTab === 'NEEDS_ACTION') {
      return activeAudit.checkpoints.filter((c) => c.status === 'WARNING' || c.status === 'FAIL');
    }
    if (filterTab === 'PASSED') {
      return activeAudit.checkpoints.filter((c) => c.status === 'PASS');
    }
    return activeAudit.checkpoints;
  }, [activeAudit, filterTab]);

  const handleGenerateAiOverview = async () => {
    if (isVaultReadonly || isGeneratingAi) return;
    setIsGeneratingAi(true);
    try {
      const blockers = activeAudit.checkpoints
        .filter((c) => c.status === 'FAIL')
        .map((c) => `${c.title}: ${c.assessorRuleDescription}`);
      const warnings = activeAudit.checkpoints
        .filter((c) => c.status === 'WARNING')
        .map((c) => `${c.title}: ${c.assessorRuleDescription}`);
      const passedHighlights = activeAudit.checkpoints
        .filter((c) => c.status === 'PASS')
        .slice(0, 3)
        .map((c) => c.title);

      const res = await generateModuleKStep1AuditOverviewAction({
        planId: plan.id,
        planTitle: plan.title,
        industryCategory: plan.industryCategory || 'Startup',
        hqCountryCode: (plan.hqCountryCode as any) || 'IE',
        selectedGrantName: activeAudit.programDefinition.name,
        selectedGrantAgency: activeAudit.programDefinition.agency,
        readinessScorePercent: activeAudit.readinessScorePercent,
        passedCount: activeAudit.passCount,
        warningCount: activeAudit.warningCount,
        blockerCount: activeAudit.failCount,
        criticalBlockers: blockers,
        warnings,
        passedHighlights,
        founderNotes,
      });

      if (res?.auditOverview) {
        setAiAuditOverview(res.auditOverview);
        if (res.assessorStrategyTip) {
          setAiAssessorTip(res.assessorStrategyTip);
        }
      }
    } catch (err) {
      console.error('[Module K] AI audit overview failed:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSaveAudit = async () => {
    if (isVaultReadonly) return;
    isDirtyRef.current = false;
    setIsSaving(true);
    try {
      const payload: ModuleKStep1AuditSavedData = {
        selectedGrantKey,
        targetCountry,
        overallAssessorReadinessScore: activeAudit.readinessScorePercent,
        stackedFundingRoadmapSelected: false,
        activeFilterTab: filterTab,
        founderNotes,
        aiAuditOverview,
        aiAssessorTip: aiAssessorTip || undefined,
      };
      if (onSaveStep1) {
        await onSaveStep1(payload, 25);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const isFirstRenderRef = useRef(true);
  const isDirtyRef = useRef(false);
  const handleSaveAuditRef = useRef(handleSaveAudit);
  handleSaveAuditRef.current = handleSaveAudit;

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    if (isVaultReadonly) return;
    isDirtyRef.current = true;
    const timer = setTimeout(() => {
      if (isDirtyRef.current) {
        void handleSaveAuditRef.current();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [selectedGrantKey, filterTab, founderNotes, aiAuditOverview, aiAssessorTip, isVaultReadonly]);

  useEffect(() => {
    return () => {
      if (isDirtyRef.current) {
        void handleSaveAuditRef.current();
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* 4-Layer Support Strip: Why & Example */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setActiveWhyCard((prev) => !prev)}
          className="h-7 border-slate-200 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
        >
          <HelpCircle className="mr-1 h-3.5 w-3.5" />
          Why Are We Asking This?
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setActiveExampleCard((prev) => !prev)}
          className="h-7 border-emerald-200 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50"
        >
          <Lightbulb className="mr-1 h-3.5 w-3.5" />
          Show Me an Assessor Example
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleGenerateAiOverview}
          disabled={isGeneratingAi || isVaultReadonly}
          className="h-7 border-slate-200 bg-slate-50/80 text-[11px] font-medium text-slate-800 hover:bg-slate-100"
        >
          <Sparkles className="mr-1 h-3.5 w-3.5 text-emerald-700" />
          {isGeneratingAi ? 'Synthesizing Audit with AI...' : 'Generate AI Audit Overview'}
        </Button>
      </div>

      {activeWhyCard && (
        <div className="relative rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-900">
          <button
            onClick={() => setActiveWhyCard(false)}
            className="absolute right-2 top-2 text-emerald-600 hover:text-emerald-700"
          >
            ✕
          </button>
          <p className="font-semibold text-slate-950">Why Grant Pre-Auditing is Essential:</p>
          <p className="mt-1 leading-relaxed">
            Over 60% of grant applications are rejected at the preliminary screening committee—not because
            the idea is bad, but because of technical disqualifiers (e.g., missing 3 quotes over €5k, claiming
            for standard laptops, or applying for an entity type that isn’t eligible). By scanning your entire
            business plan across Modules A through J before you apply, we de-risk your application so you pass the
            official assessor review on your first attempt.
          </p>
        </div>
      )}

      {activeExampleCard && (
        <div className="relative rounded-lg border border-emerald-100 bg-emerald-50/70 p-3.5 text-xs text-emerald-950">
          <button
            onClick={() => setActiveExampleCard(false)}
            className="absolute right-2 top-2 text-emerald-400 hover:text-emerald-600"
          >
            ✕
          </button>
          <p className="font-semibold text-emerald-950">Real Assessor Evaluation Insight:</p>
          <p className="mt-1 leading-relaxed">
            “An Irish LEO or Innovate UK assessor spends an average of 18 minutes reviewing an early-stage application.
            They look for 3 immediate green lights: (1) Does this company export or create net-new value? (2) Has the founder
            committed cash skin-in-the-game? (3) Are the quotes real and transparent? When they see these pre-verified,
            your likelihood of scoring &gt; 80/100 jumps fourfold.”
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP SECTION: MULTI-GRANT COMPARISON CAROUSEL / GRID                     */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Target Grant &amp; Funding Programs ({targetCountry === 'IE' ? '🇮🇪 Ireland' : '🇬🇧 United Kingdom'})
            </h3>
            <p className="text-xs text-slate-500">
              Select any program below to run the live 10-point cross-platform underwriting audit.
            </p>
          </div>
          <Badge variant="outline" className="border-slate-200 bg-slate-50 text-[11px] font-semibold text-emerald-800">
            {allEvaluations.length} Programs Evaluated
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {allEvaluations.map((audit) => {
            const isSelected = audit.programKey === selectedGrantKey;
            const isHighMatch = audit.readinessScorePercent >= 80;
            const isMediumMatch = audit.readinessScorePercent >= 60 && audit.readinessScorePercent < 80;

            return (
              <div
                key={audit.programKey}
                onClick={() => setSelectedGrantKey(audit.programKey)}
                className={`group relative cursor-pointer rounded-xl border p-4 transition-all duration-200 ${
                  isSelected
                    ? 'border-emerald-700 bg-slate-50 shadow-md ring-2 ring-emerald-700/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                {/* Header with Score Badge & Match Tag */}
                <div className="flex items-start justify-between gap-2">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-bold ${
                      isHighMatch
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                        : isMediumMatch
                        ? 'border-amber-300 bg-amber-50 text-amber-800'
                        : 'border-rose-300 bg-rose-50 text-rose-800'
                    }`}
                  >
                    {audit.readinessScorePercent}% Ready
                  </Badge>
                  <span className="text-[10px] font-medium text-slate-400">
                    {audit.programDefinition.turnaroundLabel}
                  </span>
                </div>

                {/* Grant Name & Agency */}
                <div className="mt-2.5">
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-800">
                    {audit.programDefinition.name}
                  </h4>
                  <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-1">
                    {audit.programDefinition.agency}
                  </p>
                </div>

                {/* Max Value & Stage */}
                <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs">
                  <span className="font-bold text-slate-800">
                    {audit.programDefinition.maxAmountFormatted}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {audit.passCount} of {audit.checkpoints.length} Passed
                  </span>
                </div>

                {/* Selected Indicator */}
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                  <span className="text-slate-500 truncate max-w-[180px]">
                    {audit.programDefinition.stageFit}
                  </span>
                  <span
                    className={`font-semibold ${
                      isSelected ? 'text-emerald-700' : 'text-slate-400 group-hover:text-slate-700'
                    }`}
                  >
                    {isSelected ? '✓ Active Audit' : 'Audit This →'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MIDDLE SECTION: AUDIT HERO CARD FOR ACTIVE PROGRAM                     */}
      {/* ========================================================================= */}
      <Card className="rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/80 via-white to-slate-50/40 p-5 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-700 text-xs font-bold text-white">
                K1
              </span>
              <h3 className="text-base font-bold text-slate-900">
                {activeAudit.programDefinition.name}
              </h3>
              <Badge variant="outline" className="border-slate-200 bg-emerald-50 text-[10px] font-semibold text-emerald-800">
                {activeAudit.programDefinition.fundingBadge}
              </Badge>
            </div>
            <p className="text-xs text-slate-600 max-w-2xl">
              {activeAudit.programDefinition.underwritingSummary}
            </p>
          </div>

          {/* Large Readiness Score Meter */}
          <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs shrink-0">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Assessor Readiness Index
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                  {activeAudit.readinessScorePercent}%
                </span>
                <span className="text-xs font-medium text-slate-500">
                  {activeAudit.readinessScorePercent >= 80
                    ? 'Assessor Ready'
                    : activeAudit.readinessScorePercent >= 60
                    ? 'Minor Fixes Needed'
                    : 'Critical Blockers'}
                </span>
              </div>
            </div>
            <div className="h-10 w-px bg-slate-200" />
            <div className="flex flex-col text-xs font-medium space-y-0.5">
              <span className="text-emerald-700">✓ {activeAudit.passCount} Passed</span>
              <span className="text-amber-700">⚠️ {activeAudit.warningCount} Warnings</span>
              {activeAudit.failCount > 0 && (
                <span className="text-rose-700">✕ {activeAudit.failCount} Blockers</span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 pt-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <Info className="h-4 w-4 text-emerald-700 shrink-0" />
            <span>
              Official Program Provider: <strong>{activeAudit.programDefinition.agency}</strong>
            </span>
          </div>
          <a
            href={activeAudit.programDefinition.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-900"
          >
            Official Guidelines &amp; Form <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* 3. CHECKPOINTS AUDIT TABLE & FIX-IT ACTIONS                                */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-900">
              Cross-Platform Prerequisite Checklist ({filteredCheckpoints.length})
            </h4>
            <span className="text-xs text-slate-500">
              Scanned across Modules A through J
            </span>
          </div>

          {/* Filter Tabs */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setFilterTab('ALL')}
              className={`rounded-md px-2.5 py-1 font-medium transition-all ${
                filterTab === 'ALL'
                  ? 'bg-white font-bold text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({activeAudit.checkpoints.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('NEEDS_ACTION')}
              className={`rounded-md px-2.5 py-1 font-medium transition-all ${
                filterTab === 'NEEDS_ACTION'
                  ? 'bg-white font-bold text-amber-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Needs Action ({activeAudit.warningCount + activeAudit.failCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('PASSED')}
              className={`rounded-md px-2.5 py-1 font-medium transition-all ${
                filterTab === 'PASSED'
                  ? 'bg-white font-bold text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Passed ({activeAudit.passCount})
            </button>
          </div>
        </div>

        {/* Checkpoint Cards List */}
        <div className="space-y-2.5">
          {filteredCheckpoints.map((chk) => {
            const isPass = chk.status === 'PASS';
            const isWarning = chk.status === 'WARNING';
            const isFail = chk.status === 'FAIL';

            return (
              <div
                key={chk.id}
                className={`rounded-xl border p-4 transition-all ${
                  isPass
                    ? 'border-emerald-100 bg-white hover:border-emerald-200'
                    : isWarning
                    ? 'border-amber-200 bg-amber-50/20 hover:border-amber-300'
                    : 'border-rose-200 bg-rose-50/20 hover:border-rose-300'
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  {/* Left Column: Status Icon + Title + Finding */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                        isPass
                          ? 'bg-emerald-100 text-emerald-700'
                          : isWarning
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {isPass ? (
                        <Check className="h-4 w-4" />
                      ) : isWarning ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h5 className="text-sm font-bold text-slate-900">
                          {chk.title}
                        </h5>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold ${
                            isPass
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                              : isWarning
                              ? 'border-amber-200 bg-amber-50 text-amber-800'
                              : 'border-rose-200 bg-rose-50 text-rose-800'
                          }`}
                        >
                          {chk.statusBadge}
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-600">
                        {chk.findingSummary}
                      </p>

                      <p className="text-[11px] text-slate-500 italic">
                        Assessor Rule: {chk.assessorRuleDescription}
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Source Module Badge + Action Button */}
                  <div className="flex flex-row items-center gap-2 shrink-0 sm:flex-col sm:items-end">
                    <span className="text-[10px] font-medium text-slate-500">
                      Found in {chk.sourceModule}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant={isPass ? 'ghost' : 'outline'}
                      onClick={() => {
                        if (onNavigateToModule) {
                          onNavigateToModule(
                            chk.sourceModuleCode,
                            chk.targetStepNumber,
                            chk.highlightTargetId
                          );
                        }
                      }}
                      className={`h-7 px-2.5 text-xs font-semibold ${
                        isPass
                          ? 'text-slate-600 hover:text-emerald-700'
                          : isWarning
                          ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                          : 'border-rose-300 bg-rose-50 text-rose-900 hover:bg-rose-100'
                      }`}
                    >
                      {chk.remedyActionLabel}
                      <ChevronRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. AI AUDIT OVERVIEW & PRE-FLIGHT ROADMAP                                  */}
      {/* ========================================================================= */}
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <label className="text-xs font-bold text-slate-800">
              Executive Grant Audit Overview &amp; Pre-Flight Roadmap
            </label>
            <p className="text-[11px] text-slate-500">
              Assessor-grade diagnostic synthesizing your venture's strengths, critical compliance blockers, and remediation priority.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleGenerateAiOverview}
            disabled={isGeneratingAi || isVaultReadonly}
            className="h-7 border-slate-200 bg-slate-50 text-[11px] font-semibold text-emerald-800 hover:bg-slate-100"
          >
            <Sparkles className="mr-1 h-3.5 w-3.5 text-emerald-700" />
            {isGeneratingAi ? 'Synthesizing...' : 'Calibrate Audit Overview'}
          </Button>
        </div>

        <textarea
          value={aiAuditOverview}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAiAuditOverview(e.target.value)}
          placeholder={`e.g., Based on our cross-platform pre-flight audit for ${activeAudit.programDefinition.name}, ${plan.title} achieves a strong ${activeAudit.readinessScorePercent}% readiness score. The venture satisfies foundational export and entity requirements. However, 3 formal supplier quotes must be gathered in Module E prior to application submission to prevent automatic desk rejection...`}
          className="flex min-h-[90px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 shadow-xs placeholder:text-slate-400 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
          disabled={isVaultReadonly}
        />

        {aiAssessorTip && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200/80 bg-amber-50/70 p-3 text-[11px] text-amber-900">
            <Info className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold text-amber-950">Grant Assessor Committee Tip:</span>
              <p className="leading-relaxed text-amber-900/90">{aiAssessorTip}</p>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. FOUNDER NOTES & CUSTOM CONTEXT                                         */}
      {/* ========================================================================= */}
      <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
        <label className="text-xs font-bold text-slate-800">
          Founder Grant Strategy Notes (Optional)
        </label>
        <p className="text-[11px] text-slate-500">
          Record any preliminary conversations with your local LEO Development Advisor, Innovate UK Innovation Champion, or university tech-transfer office.
        </p>
        <textarea
          value={founderNotes}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFounderNotes(e.target.value)}
          placeholder="e.g., Spoke with Siobhan at Galway LEO on Tuesday. She advised submitting the Feasibility study first for €12,500 prototype testing, then follow up with Priming once the MVP has 50 active users..."
          className="flex min-h-[70px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 shadow-xs placeholder:text-slate-400 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
          disabled={isVaultReadonly}
        />
      </div>

      {/* ========================================================================= */}
      {/* 6. BOTTOM TOOLBAR: SAVE & NEXT STEP                                       */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div className="text-xs text-slate-500">
          Target Grant Locked:{' '}
          <strong className="text-slate-800">
            {activeAudit.programDefinition.name}
          </strong>{' '}
          ({activeAudit.readinessScorePercent}% Readiness Score)
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSaveAudit}
            disabled={isSaving || isVaultReadonly}
            className="text-xs font-semibold"
          >
            {isSaving ? 'Saving Audit...' : 'Save Audit Progress'}
          </Button>

          {onContinueToNextStep && (
            <Button
              type="button"
              size="sm"
              onClick={async () => {
                await handleSaveAudit();
                onContinueToNextStep();
              }}
              className="bg-emerald-700 text-xs font-bold text-white hover:bg-emerald-800"
            >
              Continue to Step 2: Capital Stack
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
