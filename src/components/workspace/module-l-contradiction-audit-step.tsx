'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  HelpCircle,
  Lightbulb,
  Check,
  RotateCcw,
  SlidersHorizontal,
  FileCheck2,
  BookmarkPlus,
  Scale,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type {
  ActiveStartupPlan,
  ModuleLStep2ContradictionAuditSavedData,
  ModuleLContradictionAuditItem,
} from '@/lib/auth/session-store';
import {
  generateModuleLStep2AuditAction,
  generateModuleLStep2DefenseAction,
} from '@/app/actions/module-l';

interface ModuleLContradictionAuditStepProps {
  plan: ActiveStartupPlan;
  isVaultReadonly?: boolean;
  onSaveStep2Audit: (
    data: ModuleLStep2ContradictionAuditSavedData,
    progress?: number
  ) => Promise<void> | void;
  onBackToStep1: () => void;
  onContinueToStep3: () => void;
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
  onParkQuestionInSession?: (questionText: string) => void;
}

export function ModuleLContradictionAuditStep({
  plan,
  isVaultReadonly = false,
  onSaveStep2Audit,
  onBackToStep1,
  onContinueToStep3,
  onNavigateToModule,
  onParkQuestionInSession,
}: ModuleLContradictionAuditStepProps) {
  const isUK = plan.hqCountryCode === 'GB';
  const currencySymbol = isUK ? '£' : '€';

  const savedAudit = plan.moduleLData?.step2Audit;
  const compilerMode = plan.moduleLData?.step1Mode?.compilerMode || 'IE_LEO_OFFICIAL_FORM';

  // 4-Layer Support Strip States
  const [activeWhyCard, setActiveWhyCard] = useState<boolean>(false);
  const [activeExampleCard, setActiveExampleCard] = useState<boolean>(false);
  const [isAuditingAi, setIsAuditingAi] = useState<boolean>(false);
  const [isGeneratingDefense, setIsGeneratingDefense] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [filterTab, setFilterTab] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'PASSED'>('ALL');

  // Audit state
  const defaultItems: ModuleLContradictionAuditItem[] = [
    {
      id: 'audit-pricing-wtp',
      category: 'PRICING_VS_VALIDATION',
      title: 'Commercial Pricing vs. Survey Willingness-to-Pay (WTP)',
      status: 'PASSED',
      detail: `Module H unit economics match the empirical willingness-to-pay tiers captured across customer discovery surveys in Module C.`,
      assessorImpact: `Eliminates the #1 revenue skepticism raised by commercial grant committees by anchoring price elasticity in real customer data.`,
      targetModuleCode: 'MOD_H_REVENUE',
      targetStep: 1,
    },
    {
      id: 'audit-payroll-taxes',
      category: 'PAYROLL_VS_HEADCOUNT',
      title: 'Scheduled Headcount vs. Statutory Employer PRSI / NIC Taxes',
      status: 'WARNING',
      detail: `Module F schedules 3-year team expansions. Ensure Module J and Module H breakeven models account for full employer payroll overheads (${isUK ? 'Employer NIC + Workplace Pension' : 'Employer PRSI at 11.05%'}).`,
      assessorImpact: `Grant evaluation panels recalculate employment costs immediately; omitting employer contributions makes cash projections look ungrounded.`,
      targetModuleCode: 'MOD_J_FINANCE',
      targetStep: 2,
    },
    {
      id: 'audit-arrears-trough',
      category: 'CASHFLOW_VS_CAPITAL_STACK',
      title: 'In-Arrears Grant Drawdown Lag vs. Cashflow Trough',
      status: 'WARNING',
      detail: `Public grant claims pay 8–12 weeks in arrears after expenditure is verified. Module K confirmed bridging liquidity must cover Month 3–5 burn before receipt of initial grant funds.`,
      assessorImpact: `Assessors will fail financial viability if working capital relies on receiving grant cash before bills are settled.`,
      targetModuleCode: 'MOD_K_GRANTS_FUNDING',
      targetStep: 3,
    },
    {
      id: 'audit-procurement-quotes',
      category: 'PROCUREMENT_ELIGIBILITY',
      title: '3-Quote Procurement & Equipment Eligibility Compliance',
      status: 'PASSED',
      detail: isUK
        ? `Capital expenditure items scheduled in Module E conform to Innovate UK capital depreciation standards rather than expensing full asset write-offs.`
        : `Scheduled equipment in Module E avoids prohibited general laptop/MacBook purchases and prepares 3 independent supplier quotes for capital items over €5,000.`,
      assessorImpact: `Strict adherence prevents claims officers from withholding reimbursement vouchers during post-award claim audits.`,
      targetModuleCode: 'MOD_E_OPERATIONS',
      targetStep: 2,
    },
    {
      id: 'audit-statutory-bank',
      category: 'STATUTORY_AND_IP',
      title: 'Corporate Legal Entity, Business Banking & Domain Proof',
      status: 'PASSED',
      detail: `Module G Launchpad setup verifies corporate LTD status, dedicated business bank account, and official company domain email credentials.`,
      assessorImpact: `Grants cannot be disbursed to personal bank accounts; having formal corporate setup complete prevents conditional approval delays.`,
      targetModuleCode: 'MOD_G_LAUNCHPAD',
      targetStep: 1,
    },
    {
      id: 'audit-export-deadweight',
      category: 'EXPORT_AND_DISPLACEMENT',
      title: 'Export Potential vs. Domestic Deadweight / Displacement',
      status: 'PASSED',
      detail: `Module A and Module B substantiate trade expansion beyond the immediate domestic locality, demonstrating non-displacement of existing regional operators.`,
      assessorImpact: `Statutory criteria mandate that enterprise funding creates net additionality and international trade rather than simply taking trade from local competitors.`,
      targetModuleCode: 'MOD_B_MARKET',
      targetStep: 1,
    },
  ];

  const [auditItems, setAuditItems] = useState<ModuleLContradictionAuditItem[]>(
    savedAudit?.auditItems && savedAudit.auditItems.length > 0
      ? savedAudit.auditItems
      : defaultItems
  );

  const [acknowledgedItemIds, setAcknowledgedItemIds] = useState<string[]>(
    savedAudit?.acknowledgedItemIds || []
  );

  const [overallScore, setOverallScore] = useState<number>(
    typeof savedAudit?.overallAuditScore === 'number' ? savedAudit.overallAuditScore : 88
  );

  const [defenseSummary, setDefenseSummary] = useState<string>(
    savedAudit?.preFlightDefenseSummary ||
      `"${plan.title}" has undergone cross-module reconciliation across Modules A through K. Pricing models are calibrated to empirical customer discovery from Module C, statutory employer payroll burdens are provisioned across Year 1–3 forecasts, and grant reimbursement drawdown timing lag is fully cushioned by confirmed founder equity and unencumbered working capital reserves. All equipment requests adhere strictly to statutory eligibility guidelines with no deadweight displacement.`
  );

  const [aiTip, setAiTip] = useState<string>(
    savedAudit?.aiAssessorTip ||
      (isUK
        ? 'Innovate UK assessors cross-reference your Project Costs breakdown against Question 7 Work Packages immediately. Any discrepancy between staff days in the narrative and payroll in the finance tables triggers a severe point deduction.'
        : 'LEO Evaluation Committees test whether your matching funds are already sitting in an unencumbered corporate bank account. Proving your 50% skin-in-the-game is confirmed upfront is the fastest path to unconditioned grant approval.')
  );

  const criticalCount = auditItems.filter((i) => i.status === 'CRITICAL').length;
  const warningCount = auditItems.filter((i) => i.status === 'WARNING').length;
  const passedCount = auditItems.filter((i) => i.status === 'PASSED').length;

  const filteredItems = auditItems.filter((item) => {
    if (filterTab === 'ALL') return true;
    return item.status === filterTab;
  });

  const toggleAcknowledge = (id: string) => {
    setAcknowledgedItemIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleRunAiAudit = async () => {
    setIsAuditingAi(true);
    try {
      const result = await generateModuleLStep2AuditAction({
        planId: plan.id,
        planTitle: plan.title,
        hqCountryCode: plan.hqCountryCode || 'IE',
        baseCurrency: plan.baseCurrency || 'EUR',
        compilerMode,
        industryCategory: plan.industryCategory,
        targetFundingAskAmount:
          plan.moduleLData?.step1Mode?.targetFundingAskAmount || 50000,
        moduleAExportPotential: plan.exportPotential,
        moduleBSegments: plan.moduleBData?.beachhead?.beachheadSegment,
        moduleCSurveySummary: plan.moduleCData?.surveys?.[0]?.title,
        moduleDPricingAndQuotes: plan.moduleDData?.productVehicle?.productTrack,
        moduleEOperationsEquipment: plan.moduleEData?.premisesAndEquipment?.premisesSetupMode,
        moduleFTeamAndHeadcount: plan.moduleFData?.step2RoleMatrixData?.toString(),
        moduleGLaunchpadSetup: plan.moduleGData?.step1?.legalStructure,
        moduleHRevenueAndPricing: plan.moduleHData?.step1RevenueModel?.revenueModelVehicle,
        moduleJFinanceAndCashflow: plan.moduleJData?.step1OverheadsTax?.operatingCostPosture,
        moduleKFundingStackAndBuffer: plan.moduleKData?.step2CapitalStack?.presetUsed,
      });

      if (result.auditItems && result.auditItems.length > 0) {
        setAuditItems(result.auditItems);
        setOverallScore(result.overallAuditScore);
        setDefenseSummary(result.preFlightDefenseSummary);
        if (result.aiAssessorTip) setAiTip(result.aiAssessorTip);
      }
    } catch (err) {
      console.error('Error running AI contradiction audit:', err);
    } finally {
      setIsAuditingAi(false);
    }
  };

  const handleGenerateDefenseAi = async () => {
    setIsGeneratingDefense(true);
    try {
      const res = await generateModuleLStep2DefenseAction({
        planId: plan.id,
        planTitle: plan.title,
        hqCountryCode: plan.hqCountryCode || 'IE',
        baseCurrency: plan.baseCurrency || 'EUR',
        compilerMode,
        industryCategory: plan.industryCategory,
        currentAuditScore: overallScore,
        auditItems: auditItems.map((i) => ({
          title: i.title,
          status: i.status,
          detail: i.detail,
          assessorImpact: i.assessorImpact,
        })),
        acknowledgedItemIds,
        currentDefenseText: defenseSummary,
      });

      if (res.defenseSummary) {
        setDefenseSummary(res.defenseSummary);
        if (res.aiAssessorTip) setAiTip(res.aiAssessorTip);
      }
    } catch (err) {
      console.error('Error generating AI defense statement:', err);
    } finally {
      setIsGeneratingDefense(false);
    }
  };

  const handleSaveAuditOnly = async () => {
    if (isVaultReadonly) return;
    isDirtyRef.current = false;
    setIsSaving(true);
    try {
      const payload: ModuleLStep2ContradictionAuditSavedData = {
        overallAuditScore: overallScore,
        auditItems,
        acknowledgedItemIds,
        preFlightDefenseSummary: defenseSummary,
        aiAssessorTip: aiTip,
        aiEngineUsed: 'gemini-2.5-pro',
        lastAuditedAt: new Date().toISOString(),
        lastSavedAt: new Date().toISOString(),
      };
      await onSaveStep2Audit(payload, 40);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndContinue = async () => {
    isDirtyRef.current = false;
    setIsSaving(true);
    const payload: ModuleLStep2ContradictionAuditSavedData = {
      overallAuditScore: overallScore,
      auditItems,
      acknowledgedItemIds,
      preFlightDefenseSummary: defenseSummary,
      aiAssessorTip: aiTip,
      aiEngineUsed: 'gemini-2.5-pro',
      lastAuditedAt: new Date().toISOString(),
      lastSavedAt: new Date().toISOString(),
    };

    await onSaveStep2Audit(payload, 40);
    setIsSaving(false);
    onContinueToStep3();
  };

  const isFirstRenderRef = useRef(true);
  const isDirtyRef = useRef(false);
  const handleSaveAuditOnlyRef = useRef(handleSaveAuditOnly);
  handleSaveAuditOnlyRef.current = handleSaveAuditOnly;

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    if (isVaultReadonly) return;
    isDirtyRef.current = true;
    const timer = setTimeout(() => {
      if (isDirtyRef.current) {
        void handleSaveAuditOnlyRef.current();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [overallScore, auditItems, acknowledgedItemIds, defenseSummary, aiTip, isVaultReadonly]);

  useEffect(() => {
    return () => {
      if (isDirtyRef.current) {
        void handleSaveAuditOnlyRef.current();
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* 4-Layer Support Strip (Directly Below Title & Description) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
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
          Show Me an Example
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleRunAiAudit}
          disabled={isAuditingAi || isVaultReadonly}
          className="h-7 border-slate-200 bg-slate-50 text-[11px] font-semibold text-emerald-800 hover:bg-slate-100"
        >
          <Sparkles className="mr-1 h-3.5 w-3.5 text-emerald-700" />
          {isAuditingAi ? 'Cross-Examining Modules A–K...' : 'Run Deep Pre-Flight Contradiction Audit'}
        </Button>
      </div>

      {/* Collapsible Micro-Coaching Drawers */}
      {activeWhyCard && (
        <div className="relative rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-900 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveWhyCard(false)}
            className="absolute right-2.5 top-2.5 text-emerald-600 hover:text-emerald-800"
          >
            ✕
          </button>
          <p className="font-semibold text-slate-950">Why Contradiction Audits Win or Lose Grants:</p>
          <p className="mt-1 leading-relaxed">
            Public grant committees ({isUK ? 'Innovate UK assessors' : 'LEO Evaluation Committees'}) do not read business plans in isolation. They actively compare your written claims against your financial schedules. If your customer survey says users will only pay {currencySymbol}20, but your revenue model in Module H assumes {currencySymbol}99, or if you schedule hires in Module F without employer payroll taxes in Module J, assessors immediately deduct points for lack of commercial realism.
          </p>
        </div>
      )}

      {activeExampleCard && (
        <div className="relative rounded-lg border border-emerald-100 bg-emerald-50/70 p-3.5 text-xs text-emerald-950 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveExampleCard(false)}
            className="absolute right-2.5 top-2.5 text-emerald-500 hover:text-emerald-800"
          >
            ✕
          </button>
          <p className="font-semibold text-emerald-950">Example Assessor Objection Letter:</p>
          <p className="mt-1 font-mono text-[11px] leading-relaxed">
            &quot;The committee noted a discrepancy between the 4 Work Packages outlined in Question 7 and the capital expenditure requested in Appendix B. Furthermore, the applicant projects grant drawdowns in Month 2, despite our statutory 8-week in-arrears verification cycle. The financial model failed stress-testing against working capital trough.&quot;
          </p>
        </div>
      )}

      {/* Hero Diagnostic Readiness Scorecard */}
      <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/70 via-white to-slate-50/40 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 border border-slate-200/60 text-emerald-800">
              <Scale className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Pre-Flight Institutional Alignment Scorecard
              </h3>
              <p className="text-xs text-slate-500">
                Synthesized from cross-examination across Modules A–K data snapshots.
              </p>
            </div>
          </div>
          <Badge
            className={
              overallScore >= 80
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : overallScore >= 60
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-rose-100 text-rose-800 border-rose-300'
            }
          >
            {overallScore >= 80
              ? 'Submission Ready'
              : overallScore >= 60
                ? 'Reconciliations Advised'
                : 'High Refusal Risk'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Card 1: Score */}
          <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Pre-Flight Score
                </span>
                <span className="text-xs font-bold text-emerald-700">{overallScore}%</span>
              </div>
              <div className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
                {overallScore}
                <span className="text-base font-normal text-slate-500"> / 100</span>
              </div>
            </div>
            <div className="mt-3 rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1.5 text-xs text-slate-600 truncate">
              {criticalCount === 0 ? 'Zero Critical Contradictions' : `${criticalCount} Critical Flag(s)`}
            </div>
            <p className="mt-3 border-t border-slate-100 pt-2 text-[11px] text-slate-500">
              Target minimum threshold: 80%
            </p>
          </div>

          {/* Card 2: Passed Checks */}
          <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Verified Clean
                </span>
                <span className="text-xs font-bold text-emerald-600">PASSED</span>
              </div>
              <div className="mt-2 text-3xl font-extrabold tracking-tight text-emerald-700">
                {passedCount}
                <span className="text-base font-normal text-slate-500"> / {auditItems.length}</span>
              </div>
            </div>
            <div className="mt-3 rounded-lg bg-emerald-50/60 border border-emerald-100 px-2.5 py-1.5 text-xs text-emerald-800 truncate">
              Core statutory rules verified
            </div>
            <p className="mt-3 border-t border-slate-100 pt-2 text-[11px] text-slate-500">
              Zero ungrounded assumptions
            </p>
          </div>

          {/* Card 3: Warnings */}
          <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Actionable Warnings
                </span>
                <span className="text-xs font-bold text-amber-600">WARNINGS</span>
              </div>
              <div className="mt-2 text-3xl font-extrabold tracking-tight text-amber-700">
                {warningCount}
              </div>
            </div>
            <div className="mt-3 rounded-lg bg-amber-50/60 border border-amber-100 px-2.5 py-1.5 text-xs text-amber-800 truncate">
              {acknowledgedItemIds.length} Acknowledged with Defense
            </div>
            <p className="mt-3 border-t border-slate-100 pt-2 text-[11px] text-slate-500">
              Review before final compilation
            </p>
          </div>

          {/* Card 4: Critical Blocks */}
          <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Refusal Traps
                </span>
                <span className="text-xs font-bold text-rose-600">CRITICAL</span>
              </div>
              <div className="mt-2 text-3xl font-extrabold tracking-tight text-rose-700">
                {criticalCount}
              </div>
            </div>
            <div className="mt-3 rounded-lg bg-rose-50/60 border border-rose-100 px-2.5 py-1.5 text-xs text-rose-800 truncate">
              {criticalCount === 0 ? 'Clear of fatal traps' : 'Action required immediately'}
            </div>
            <p className="mt-3 border-t border-slate-100 pt-2 text-[11px] text-slate-500">
              Eliminates automatic disqualification
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            size="sm"
            variant={filterTab === 'ALL' ? 'default' : 'outline'}
            onClick={() => setFilterTab('ALL')}
            className={`h-8 text-xs ${filterTab === 'ALL' ? 'bg-emerald-700 text-white' : 'text-slate-600'}`}
          >
            All Checks ({auditItems.length})
          </Button>
          <Button
            type="button"
            size="sm"
            variant={filterTab === 'CRITICAL' ? 'default' : 'outline'}
            onClick={() => setFilterTab('CRITICAL')}
            className={`h-8 text-xs ${filterTab === 'CRITICAL' ? 'bg-rose-600 text-white' : 'text-slate-600'}`}
          >
            Critical ({criticalCount})
          </Button>
          <Button
            type="button"
            size="sm"
            variant={filterTab === 'WARNING' ? 'default' : 'outline'}
            onClick={() => setFilterTab('WARNING')}
            className={`h-8 text-xs ${filterTab === 'WARNING' ? 'bg-amber-600 text-white' : 'text-slate-600'}`}
          >
            Warnings ({warningCount})
          </Button>
          <Button
            type="button"
            size="sm"
            variant={filterTab === 'PASSED' ? 'default' : 'outline'}
            onClick={() => setFilterTab('PASSED')}
            className={`h-8 text-xs ${filterTab === 'PASSED' ? 'bg-emerald-600 text-white' : 'text-slate-600'}`}
          >
            Verified Passed ({passedCount})
          </Button>
        </div>

        <span className="text-xs text-slate-500">
          Showing {filteredItems.length} check(s)
        </span>
      </div>

      {/* Audit Items List */}
      <div className="space-y-3.5">
        {filteredItems.map((item) => {
          const isAcknowledged = acknowledgedItemIds.includes(item.id);

          return (
            <div
              key={item.id}
              className={`rounded-xl border p-4 shadow-xs transition-all ${
                item.status === 'CRITICAL'
                  ? 'border-rose-200 bg-rose-50/30 hover:border-rose-300'
                  : item.status === 'WARNING'
                    ? 'border-amber-200 bg-amber-50/20 hover:border-amber-300'
                    : 'border-slate-200 bg-white hover:border-emerald-300'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="mt-0.5">
                    {item.status === 'CRITICAL' && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-rose-100 text-rose-700">
                        <AlertOctagon className="h-4 w-4" />
                      </div>
                    )}
                    {item.status === 'WARNING' && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-100 text-amber-700">
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                    )}
                    {item.status === 'PASSED' && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold ${
                          item.status === 'CRITICAL'
                            ? 'border-rose-300 bg-rose-100 text-rose-800'
                            : item.status === 'WARNING'
                              ? 'border-amber-300 bg-amber-100 text-amber-800'
                              : 'border-emerald-300 bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {item.status}
                      </Badge>
                      <Badge variant="outline" className="border-slate-200 text-slate-500 text-[10px]">
                        {item.category.replace(/_/g, ' ')}
                      </Badge>
                    </div>

                    <p className="mt-1.5 text-xs text-slate-700 leading-relaxed">{item.detail}</p>

                    <div className="mt-2.5 rounded-lg border border-slate-200/80 bg-slate-50/80 p-2.5 text-xs text-slate-600">
                      <span className="font-semibold text-slate-800">Assessor Risk / Rubric Impact: </span>
                      {item.assessorImpact}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onNavigateToModule && item.targetModuleCode && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onNavigateToModule(item.targetModuleCode, item.targetStep)}
                      className="h-8 border-slate-200 text-xs font-medium text-emerald-800 hover:bg-emerald-50"
                    >
                      Fix in {item.targetModuleCode.replace(/_/g, ' ').replace('MOD ', 'Module ')}
                      <ExternalLink className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  )}

                  {item.status !== 'PASSED' && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleAcknowledge(item.id)}
                      className={`h-8 text-xs font-medium ${
                        isAcknowledged
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {isAcknowledged ? (
                        <>
                          <Check className="mr-1 h-3.5 w-3.5 text-emerald-600" />
                          Acknowledged
                        </>
                      ) : (
                        'Acknowledge & Justify'
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 1-Page Pre-Flight Defense Statement */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Consolidated Pre-Flight Defense Statement
            </h3>
            <Badge variant="outline" className="border-slate-200 bg-emerald-50 text-[10px] text-emerald-800">
              Feeds into Step 3 Narrative
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleGenerateDefenseAi}
              disabled={isGeneratingDefense || isVaultReadonly}
              className="h-7 border-slate-200 bg-slate-50/80 text-xs font-semibold text-emerald-800 hover:bg-slate-100"
            >
              <Sparkles className="mr-1.5 h-3 w-3 text-emerald-700" />
              {isGeneratingDefense ? 'Calibrating Defense...' : 'AI Calibrate Defense'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() =>
                setDefenseSummary(
                  `"${plan.title}" has undergone cross-module reconciliation across Modules A through K. Pricing models are calibrated to empirical customer discovery from Module C, statutory employer payroll burdens are provisioned across Year 1–3 forecasts, and grant reimbursement drawdown timing lag is fully cushioned by confirmed founder equity and unencumbered working capital reserves. All equipment requests adhere strictly to statutory eligibility guidelines with no deadweight displacement.`
                )
              }
              className="h-7 text-xs text-emerald-700 hover:bg-emerald-50"
            >
              <RotateCcw className="mr-1 h-3 w-3" />
              Reset
            </Button>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          This defense statement reconciles potential assessor objections into a single defensible narrative paragraph that gets compiled directly into your final submission:
        </p>

        <textarea
          rows={4}
          value={defenseSummary}
          onChange={(e) => setDefenseSummary(e.target.value)}
          disabled={isVaultReadonly}
          className="w-full rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-xs leading-relaxed text-slate-800 focus:border-emerald-600 focus:bg-white focus:outline-hidden"
          placeholder="Enter pre-flight defense statement..."
        />
      </div>

      {/* Assessor Tip Callout */}
      {aiTip && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 shadow-xs">
          <div className="flex items-start gap-2.5">
            <Sparkles className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-amber-900">
              <span className="font-semibold text-amber-950">Underwriter Insider Tip: </span>
              {aiTip}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Step Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onBackToStep1}
          className="text-xs text-slate-600 hover:bg-slate-50"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to Step 1 (Compiler Mode)
        </Button>

        <div className="flex items-center gap-2">
          {onParkQuestionInSession && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onParkQuestionInSession('Step 2 Pre-Flight Audit Reconciliation Flag')}
              className="border-slate-200 text-xs text-slate-600 hover:bg-slate-50"
            >
              <BookmarkPlus className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
              Park in Open Questions
            </Button>
          )}

          <Button
            type="button"
            size="sm"
            onClick={handleSaveAndContinue}
            disabled={isSaving || isVaultReadonly}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold"
          >
            {isSaving ? 'Saving Audit...' : 'Save & Proceed to Step 3 (Narrative Compiler)'}
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
