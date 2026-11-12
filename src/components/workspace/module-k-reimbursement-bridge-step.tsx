'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Clock,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Lightbulb,
  Sparkles,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  RotateCcw,
  Info,
  Calendar,
  CheckCircle2,
  DollarSign,
  Briefcase,
  Layers,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  type ActiveStartupPlan,
  type ReimbursementBridgeStrategyType,
  type ModuleKStep3ReimbursementBridgeSavedData,
} from '@/lib/auth/session-store';
import { SUPPORTED_GRANT_PROGRAMS } from '@/lib/grants/module-k-grant-audit';
import { generateModuleKStep3ReimbursementBridgeAction } from '@/app/actions/module-k';

export interface ModuleKReimbursementBridgeStepProps {
  plan: ActiveStartupPlan;
  isVaultReadonly?: boolean;
  onSaveStep3?: (data: ModuleKStep3ReimbursementBridgeSavedData, progress?: number) => Promise<void> | void;
  onBackToStep2?: () => void;
  onContinueToNextStep?: () => void;
}

export function ModuleKReimbursementBridgeStep({
  plan,
  isVaultReadonly,
  onSaveStep3,
  onBackToStep2,
  onContinueToNextStep,
}: ModuleKReimbursementBridgeStepProps) {
  const isUK = plan.hqCountryCode === 'GB';
  const currencySymbol = isUK ? '£' : '€';

  // Inherit grant context from Step 1 or fallback
  const selectedGrantKey =
    plan.moduleKData?.step1Audit?.selectedGrantKey ||
    (isUK ? 'GB_BBB_START_UP_LOAN' : 'IE_LEO_PRIMING');
  const targetGrantDef = SUPPORTED_GRANT_PROGRAMS[selectedGrantKey];

  // Inherit total budget and grant allocation from Step 2
  const step2 = plan.moduleKData?.step2CapitalStack;
  const initialVouchedBudget =
    step2?.totalTargetFundingGap && step2.totalTargetFundingGap > 0
      ? step2.totalTargetFundingGap
      : 50000;
  const initialGrantDrawdown =
    step2?.totalGrantsAllocated && step2.totalGrantsAllocated > 0
      ? step2.totalGrantsAllocated
      : Math.round(initialVouchedBudget * 0.5);

  const existingStep3 = plan.moduleKData?.step3ReimbursementBridge;

  // Local state
  const [grantEligibleVouchedBudget, setGrantEligibleVouchedBudget] = useState<number>(
    existingStep3?.grantEligibleVouchedBudget || initialVouchedBudget
  );
  const [expectedGrantDrawdownAmount, setExpectedGrantDrawdownAmount] = useState<number>(
    existingStep3?.expectedGrantDrawdownAmount || initialGrantDrawdown
  );
  const [estimatedClaimTurnaroundWeeks, setEstimatedClaimTurnaroundWeeks] = useState<number>(
    existingStep3?.estimatedClaimTurnaroundWeeks || (isUK ? 10 : 12)
  );
  const [bridgeStrategy, setBridgeStrategy] = useState<ReimbursementBridgeStrategyType>(
    existingStep3?.bridgeStrategy || 'FOUNDER_DIRECTOR_LOAN_BUFFER'
  );
  const [otherBridgeStrategyText, setOtherBridgeStrategyText] = useState<string>(
    existingStep3?.otherBridgeStrategyText || ''
  );
  const [vendorPaymentTermsDays, setVendorPaymentTermsDays] = useState<30 | 60 | 90>(
    (existingStep3?.vendorPaymentTermsDays as 30 | 60 | 90) || 60
  );

  // Confirmed liquid capital available to bridge
  const defaultConfirmedBridge =
    step2?.skinInTheGameCash && step2.skinInTheGameCash > 0
      ? step2.skinInTheGameCash + (step2.totalLoansAllocated || 0)
      : Math.round(initialVouchedBudget * 0.5);

  const [actualConfirmedBridgeLiquidity, setActualConfirmedBridgeLiquidity] = useState<number>(
    existingStep3?.actualConfirmedBridgeLiquidity || defaultConfirmedBridge
  );
  const [bridgeRiskMitigationNarrative, setBridgeRiskMitigationNarrative] = useState<string>(
    existingStep3?.bridgeRiskMitigationNarrative || ''
  );
  const [aiAssessorTip, setAiAssessorTip] = useState<string | null>(
    existingStep3?.aiAssessorTip || null
  );

  const [activeWhyCard, setActiveWhyCard] = useState<boolean>(false);
  const [activeExampleCard, setActiveExampleCard] = useState<boolean>(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Core Underwriting Calculations:
  // How much cash must be disbursed before grant reimbursement check clears?
  // If vendor terms are 60 days and turnaround is 12 weeks (~84 days), company floats invoices for ~24 days.
  // Peak liquidity required is the vouched milestone cost that must be paid upfront to get stamped receipt.
  const minimumLiquidityBufferRequired = useMemo(() => {
    // Under assessor guidelines, companies must clear 100% of the invoice before submitting claim
    // The peak cash required is at least the grant amount itself plus milestone operating buffer
    return Math.round(expectedGrantDrawdownAmount * 1.15);
  }, [expectedGrantDrawdownAmount]);

  const liquiditySafetySurplusOrDeficit = useMemo(() => {
    return actualConfirmedBridgeLiquidity - minimumLiquidityBufferRequired;
  }, [actualConfirmedBridgeLiquidity, minimumLiquidityBufferRequired]);

  const isAssessorLiquidityCompliant = liquiditySafetySurplusOrDeficit >= 0;

  // Timeline phases
  const claimLagDays = estimatedClaimTurnaroundWeeks * 7;
  const netFloatLagDays = Math.max(0, claimLagDays - vendorPaymentTermsDays);

  const handleGenerateAiNarrative = async () => {
    if (isVaultReadonly || isGeneratingAi) return;
    setIsGeneratingAi(true);
    try {
      const res = await generateModuleKStep3ReimbursementBridgeAction({
        planId: plan.id,
        planTitle: plan.title,
        industryCategory: plan.industryCategory || 'Startup',
        hqCountryCode: (plan.hqCountryCode as any) || 'IE',
        targetGrantName: targetGrantDef?.name || 'Primary State Grant',
        targetGrantAgency: targetGrantDef?.agency || 'State Enterprise Agency',
        grantEligibleVouchedBudget,
        expectedGrantDrawdownAmount,
        estimatedClaimTurnaroundWeeks,
        minimumLiquidityBufferRequired,
        actualConfirmedBridgeLiquidity,
        liquiditySafetySurplusOrDeficit,
        bridgeStrategy:
          bridgeStrategy === 'OTHER' ? otherBridgeStrategyText || 'Custom Bridge' : bridgeStrategy,
        vendorPaymentTermsDays,
        currencySymbol,
      });

      if (res?.narrative) {
        setBridgeRiskMitigationNarrative(res.narrative);
        if (res.assessorStrategyTip) {
          setAiAssessorTip(res.assessorStrategyTip);
        }
      }
    } catch (err) {
      console.error('[Module K] AI Step 3 bridge narrative failed:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSaveStep3 = async () => {
    if (isVaultReadonly) return;
    isDirtyRef.current = false;
    setIsSaving(true);
    try {
      const payload: ModuleKStep3ReimbursementBridgeSavedData = {
        grantEligibleVouchedBudget,
        expectedGrantDrawdownAmount,
        estimatedClaimTurnaroundWeeks,
        bridgeStrategy,
        otherBridgeStrategyText: bridgeStrategy === 'OTHER' ? otherBridgeStrategyText : undefined,
        minimumLiquidityBufferRequired,
        actualConfirmedBridgeLiquidity,
        liquiditySafetySurplusOrDeficit,
        isAssessorLiquidityCompliant,
        vendorPaymentTermsDays,
        bridgeRiskMitigationNarrative,
        aiAssessorTip: aiAssessorTip || undefined,
      };

      if (onSaveStep3) {
        await onSaveStep3(payload, 65);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const isFirstRenderRef = useRef(true);
  const isDirtyRef = useRef(false);
  const handleSaveStep3Ref = useRef(handleSaveStep3);
  handleSaveStep3Ref.current = handleSaveStep3;

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    if (isVaultReadonly) return;
    isDirtyRef.current = true;
    const timer = setTimeout(() => {
      if (isDirtyRef.current) {
        void handleSaveStep3Ref.current();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [
    grantEligibleVouchedBudget,
    expectedGrantDrawdownAmount,
    estimatedClaimTurnaroundWeeks,
    bridgeStrategy,
    otherBridgeStrategyText,
    vendorPaymentTermsDays,
    actualConfirmedBridgeLiquidity,
    bridgeRiskMitigationNarrative,
    aiAssessorTip,
    isVaultReadonly,
  ]);

  useEffect(() => {
    return () => {
      if (isDirtyRef.current) {
        void handleSaveStep3Ref.current();
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
          onClick={handleGenerateAiNarrative}
          disabled={isGeneratingAi || isVaultReadonly}
          className="h-7 border-slate-200 bg-slate-50/80 text-[11px] font-medium text-slate-800 hover:bg-slate-100"
        >
          <Sparkles className="mr-1 h-3.5 w-3.5 text-emerald-700" />
          {isGeneratingAi ? 'Synthesizing Bridge Plan...' : 'Auto-Generate Bridge Plan with AI'}
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
          <p className="font-semibold text-slate-950">
            The #1 Reason Funded Startups Fail: The Arrears Reimbursement Lag
          </p>
          <p className="mt-1 leading-relaxed">
            Government grants (LEO Ireland, Innovate UK, Scottish Enterprise) <strong>never pay upfront</strong>.
            You must first spend the money, wait for the supplier invoice to clear your bank account, submit paid bank statements,
            and wait <strong>60 to 120 days</strong> for the claim officer to verify and wire the reimbursement check.
            If you do not have a committed liquidity bridge, your startup will run out of cash and face insolvency while waiting for approved grant money.
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
          <p className="font-semibold text-emerald-950">Assessor Example: €40,000 LEO Priming Grant</p>
          <p className="mt-1 leading-relaxed">
            <strong>The Situation:</strong> A software startup is awarded a €40,000 LEO Priming Grant (50% match on an €80,000 project).
            <br />
            <strong>The Trap:</strong> In Month 3, they incur €40,000 in agency and developer invoices. To claim their €20,000 first tranche, they must prove the €40,000 left their bank account. If their bank balance only has €10,000, they cannot pay the developer, cannot produce cleared bank statements, and the claim is frozen.
            <br />
            <strong>The Solution:</strong> The founder pairs a €25,000 Microfinance Ireland (MFI) 6-month interest-only bridge with 60-day agency payment terms. Invoices are paid, bank statement clears, LEO reimburses €20,000 within 8 weeks, and the MFI bridge is repaid.
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. VISUAL REIMBURSEMENT TIMING TIMELINE (THE CASH CHASM)                   */}
      {/* ========================================================================= */}
      <Card className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-700" />
              Grant Reimbursement Timing Timeline ({claimLagDays} Days Cash Lag)
            </h3>
            <p className="text-xs text-slate-500">
              Visualizing the cash-float gap between incurring milestone invoices and receiving cleared state grant funds.
            </p>
          </div>
          <Badge
            variant="outline"
            className={
              isAssessorLiquidityCompliant
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800 text-[11px]'
                : 'border-rose-300 bg-rose-50 text-rose-800 text-[11px]'
            }
          >
            {isAssessorLiquidityCompliant ? '✓ Liquidity Bridge Solvent' : '⚠ Cash Pinch-Point Risk'}
          </Badge>
        </div>

        {/* 4-Stage Horizontal Flow */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phase 1: Day 0</div>
            <div className="text-xs font-bold text-slate-900">Incur Milestone Cost</div>
            <p className="text-[11px] text-slate-600">
              Developer/Vendor starts work package. Invoices issued on {vendorPaymentTermsDays}-day terms.
            </p>
            <div className="pt-1 text-xs font-semibold text-slate-800">
              Total: {currencySymbol}{grantEligibleVouchedBudget.toLocaleString()}
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
              Phase 2: Day {vendorPaymentTermsDays}
            </div>
            <div className="text-xs font-bold text-amber-950">Peak Cash Drawdown</div>
            <p className="text-[11px] text-amber-900">
              Invoice due. Must clear your bank account in full to generate vouched proof for the grant officer.
            </p>
            <div className="pt-1 text-xs font-bold text-amber-800">
              Outflow: {currencySymbol}{minimumLiquidityBufferRequired.toLocaleString()}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
              Phase 3: Days {vendorPaymentTermsDays}–{claimLagDays}
            </div>
            <div className="text-xs font-bold text-slate-950">Assessor Review Float</div>
            <p className="text-[11px] text-slate-900">
              {targetGrantDef?.agency || 'Agency'} reviews tax clearance, timesheets, and cleared bank lines.
            </p>
            <div className="pt-1 text-xs font-semibold text-emerald-900">
              Wait: ~{netFloatLagDays} Days Float
            </div>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              Phase 4: Day {claimLagDays}
            </div>
            <div className="text-xs font-bold text-emerald-950">Grant Reimbursement</div>
            <p className="text-[11px] text-emerald-900">
              Reimbursement check wires directly into startup bank account, replenishing working capital.
            </p>
            <div className="pt-1 text-xs font-bold text-emerald-700">
              + {currencySymbol}{expectedGrantDrawdownAmount.toLocaleString()} Cash Arrives
            </div>
          </div>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* 2. UNDERWRITING LIQUIDITY METRICS GRID                                    */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/70 via-white to-slate-50/40 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 border border-slate-200/60 text-emerald-800">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Assessor Working Capital &amp; Liquidity Diagnostics
            </h4>
            <p className="text-xs text-slate-500">
              Underwriting checks verified by evaluation committees prior to grant sanction.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Minimum Required Liquidity */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Peak Cash Required
            </div>
            <div className="my-2">
              <div className="text-2xl font-extrabold tracking-tight text-slate-900">
                {currencySymbol}{minimumLiquidityBufferRequired.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500">
                Upfront invoice capital + 15% buffer
              </div>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-100 p-2 text-[11px] text-slate-600">
              Must clear bank account before claim filing
            </div>
          </div>

          {/* Confirmed Liquid Buffer */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Confirmed Liquid Buffer
            </div>
            <div className="my-2">
              <div className="text-2xl font-extrabold tracking-tight text-slate-900">
                {currencySymbol}{actualConfirmedBridgeLiquidity.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500">
                Founder Cash + Gov Loan commitments
              </div>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-100 p-2 text-[11px] text-slate-600">
              Verified from Step 2 Capital Stack
            </div>
          </div>

          {/* Safety Surplus or Deficit */}
          <div
            className={`rounded-xl border p-4 shadow-xs flex flex-col justify-between ${
              isAssessorLiquidityCompliant
                ? 'border-emerald-200 bg-emerald-50/40'
                : 'border-rose-200 bg-rose-50/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Liquidity Safety Margin
              </span>
              <Badge
                className={
                  isAssessorLiquidityCompliant
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]'
                    : 'bg-rose-100 text-rose-800 border-rose-300 text-[10px]'
                }
              >
                {isAssessorLiquidityCompliant ? 'SOLVENT' : 'DEFICIT'}
              </Badge>
            </div>
            <div className="my-2">
              <div
                className={`text-2xl font-extrabold tracking-tight ${
                  isAssessorLiquidityCompliant ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {liquiditySafetySurplusOrDeficit >= 0 ? '+' : ''}
                {currencySymbol}{liquiditySafetySurplusOrDeficit.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500">
                {isAssessorLiquidityCompliant
                  ? 'Surplus cushion to absorb claim delays'
                  : 'Cash shortfall risking unpaid invoices'}
              </div>
            </div>
            <div className="text-[11px] text-slate-600 pt-1">
              Assessor Rating:{' '}
              <strong>{isAssessorLiquidityCompliant ? 'Approved (Green Flag)' : 'High Risk (Requires Remedy)'}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. INPUT CONFIGURATION: BUDGET, TURNAROUND & STRATEGY                     */}
      {/* ========================================================================= */}
      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <h4 className="text-sm font-bold text-slate-900">
          Reimbursement Bridge Configuration &amp; Vendor Terms
        </h4>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Vouched Project Budget */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">
              Vouched Milestone Budget ({currencySymbol})
            </Label>
            <Input
              type="number"
              value={grantEligibleVouchedBudget}
              onChange={(e) => setGrantEligibleVouchedBudget(Number(e.target.value) || 0)}
              disabled={isVaultReadonly}
              className="text-xs font-semibold"
            />
            <p className="text-[10px] text-slate-500">
              Total invoiced cost for this grant milestone.
            </p>
          </div>

          {/* Expected Grant Drawdown */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">
              Expected Grant Claim ({currencySymbol})
            </Label>
            <Input
              type="number"
              value={expectedGrantDrawdownAmount}
              onChange={(e) => setExpectedGrantDrawdownAmount(Number(e.target.value) || 0)}
              disabled={isVaultReadonly}
              className="text-xs font-semibold"
            />
            <p className="text-[10px] text-slate-500">
              Amount reimbursed after invoice clearance (usually 50%).
            </p>
          </div>

          {/* Claim Turnaround Weeks */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">
              Claim Processing Turnaround (Weeks)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={4}
                max={24}
                value={estimatedClaimTurnaroundWeeks}
                onChange={(e) => setEstimatedClaimTurnaroundWeeks(Number(e.target.value) || 8)}
                disabled={isVaultReadonly}
                className="text-xs font-semibold"
              />
              <span className="text-xs text-slate-500 whitespace-nowrap">
                (~{claimLagDays} days)
              </span>
            </div>
            <p className="text-[10px] text-slate-500">
              Official agency SLA (typically 8–12 weeks).
            </p>
          </div>
        </div>

        {/* Strategy Selector (With Mandatory OTHER Option) */}
        <div className="pt-2 space-y-2">
          <Label className="text-xs font-semibold text-slate-700">
            Primary Reimbursement Bridge Strategy
          </Label>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                id: 'FOUNDER_DIRECTOR_LOAN_BUFFER' as const,
                title: 'Director / Founder Cash Float',
                desc: 'Committed personal savings in business account floating invoice until check clears.',
              },
              {
                id: 'MICROFINANCE_OR_STARTUP_LOAN_BRIDGE' as const,
                title: isUK ? 'BBB Start Up Loan Bridge' : 'Microfinance Ireland (MFI) Loan',
                desc: 'Low-interest state loan providing immediate liquidity to pay suppliers.',
              },
              {
                id: 'SUPPLIER_60_DAY_STAGGERED_TERMS' as const,
                title: '60/90-Day Vendor Stagger',
                desc: 'Agreed phased agency milestones aligning payments closely with claim submission.',
              },
              {
                id: 'OTHER' as const,
                title: 'Other Custom Bridging Structure',
                desc: 'Specify overdraft, invoice financing, or custom angel bridge arrangement.',
              },
            ].map((st) => {
              const isSelected = bridgeStrategy === st.id;
              return (
                <div
                  key={st.id}
                  onClick={() => !isVaultReadonly && setBridgeStrategy(st.id)}
                  className={`cursor-pointer rounded-xl border p-3 transition-all ${
                    isSelected
                      ? 'border-emerald-700 bg-slate-50 ring-1 ring-emerald-700'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{st.title}</span>
                    {isSelected && <CheckCircle2 className="h-4 w-4 text-emerald-700" />}
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600">{st.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Conditional "Other" Input */}
          {bridgeStrategy === 'OTHER' && (
            <div className="pt-2">
              <Label className="text-xs font-semibold text-slate-700">
                Custom Bridging Facility Description
              </Label>
              <Input
                type="text"
                value={otherBridgeStrategyText}
                onChange={(e) => setOtherBridgeStrategyText(e.target.value)}
                placeholder="e.g., A €20,000 convertible bridge note from an existing advisor to cover contractor milestones..."
                className="mt-1 text-xs"
                disabled={isVaultReadonly}
              />
            </div>
          )}
        </div>

        {/* Vendor Terms Selector */}
        <div className="pt-2 flex flex-wrap items-center gap-3">
          <Label className="text-xs font-semibold text-slate-700">
            Contractor &amp; Vendor Invoice Payment Terms:
          </Label>
          <div className="flex items-center gap-2">
            {[30, 60, 90].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setVendorPaymentTermsDays(days as 30 | 60 | 90)}
                disabled={isVaultReadonly}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                  vendorPaymentTermsDays === days
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {days} Days Net
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. AI BRIDGE PLAN NARRATIVE & ASSESSOR MITIGATION                         */}
      {/* ========================================================================= */}
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <label className="text-xs font-bold text-slate-800">
              Grant Reimbursement Bridge &amp; Liquidity Survival Narrative
            </label>
            <p className="text-[11px] text-slate-500">
              Feeds directly into Module L Appendix D, providing the formal underwriter justification that this business will not fail during claim reimbursement lag.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleGenerateAiNarrative}
            disabled={isGeneratingAi || isVaultReadonly}
            className="h-7 border-slate-200 bg-slate-50 text-[11px] font-semibold text-emerald-800 hover:bg-slate-100"
          >
            <Sparkles className="mr-1 h-3.5 w-3.5 text-emerald-700" />
            {isGeneratingAi ? 'Synthesizing...' : 'Calibrate Bridge Plan with AI'}
          </Button>
        </div>

        <textarea
          value={bridgeRiskMitigationNarrative}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setBridgeRiskMitigationNarrative(e.target.value)
          }
          placeholder={`e.g., Grant reimbursement for the ${targetGrantDef?.name || 'LEO Priming Grant'} operates on an arrears basis with an estimated ${claimLagDays}-day turnaround post-milestone delivery. To eliminate liquidity strain, ${plan.title} maintains a dedicated ${currencySymbol}${actualConfirmedBridgeLiquidity.toLocaleString()} working capital buffer backed by ${bridgeStrategy.replace(/_/g, ' ').toLowerCase()}, comfortably absorbing invoice clearance cycles prior to claim release...`}
          className="flex min-h-[90px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 shadow-xs placeholder:text-slate-400 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
          disabled={isVaultReadonly}
        />

        {aiAssessorTip && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200/80 bg-amber-50/70 p-3 text-[11px] text-amber-900">
            <Info className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold text-amber-950">Grant Assessor Liquidity Rule:</span>
              <p className="leading-relaxed text-amber-900/90">{aiAssessorTip}</p>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. BOTTOM TOOLBAR: SAVE & NEXT STEP                                       */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div className="flex items-center gap-2">
          {onBackToStep2 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onBackToStep2}
              className="text-xs font-semibold"
            >
              ← Back to Step 2: Capital Stack
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSaveStep3}
            disabled={isSaving || isVaultReadonly}
            className="text-xs font-semibold"
          >
            {isSaving ? 'Saving...' : 'Save Reimbursement Bridge'}
          </Button>

          {onContinueToNextStep && (
            <Button
              type="button"
              size="sm"
              onClick={async () => {
                await handleSaveStep3();
                onContinueToNextStep();
              }}
              className="bg-emerald-700 text-xs font-bold text-white hover:bg-emerald-800"
            >
              Continue to Step 4: Angel Tax Relief
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
