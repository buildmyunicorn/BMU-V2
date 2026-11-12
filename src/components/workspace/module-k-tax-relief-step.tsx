'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Sparkles,
  HelpCircle,
  Lightbulb,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Info,
  Scale,
  Award,
  FileCheck,
  Percent,
  Check,
  Building2,
  RotateCcw,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  type ActiveStartupPlan,
  type InvestorTaxReliefSchemeType,
  type ModuleKStep4TaxReliefSavedData,
} from '@/lib/auth/session-store';
import { generateModuleKStep4TaxReliefAction } from '@/app/actions/module-k';

export interface ModuleKTaxReliefStepProps {
  plan: ActiveStartupPlan;
  isVaultReadonly?: boolean;
  onSaveStep4?: (data: ModuleKStep4TaxReliefSavedData, progress?: number) => Promise<void> | void;
  onBackToStep3?: () => void;
  onContinueToNextStep?: () => void;
}

export function ModuleKTaxReliefStep({
  plan,
  isVaultReadonly,
  onSaveStep4,
  onBackToStep3,
  onContinueToNextStep,
}: ModuleKTaxReliefStepProps) {
  const isUK = plan.hqCountryCode === 'GB';
  const currencySymbol = isUK ? '£' : '€';

  const existingStep4 = plan.moduleKData?.step4TaxRelief;
  const step2 = plan.moduleKData?.step2CapitalStack;

  // Initial scheme selection
  const defaultScheme: InvestorTaxReliefSchemeType = isUK
    ? 'GB_SEIS_SEED_ENTERPRISE'
    : 'IE_EII_EMPLOYMENT_INVESTMENT_INCENTIVE';

  const [primaryTaxScheme, setPrimaryTaxScheme] = useState<InvestorTaxReliefSchemeType>(
    existingStep4?.primaryTaxScheme || defaultScheme
  );
  const [otherTaxSchemeText, setOtherTaxSchemeText] = useState<string>(
    existingStep4?.otherTaxSchemeText || ''
  );

  // Target raise under relief
  const defaultRaise =
    step2?.totalAngelAllocated && step2.totalAngelAllocated > 0
      ? step2.totalAngelAllocated
      : isUK
      ? 150000
      : 100000;

  const [targetReliefRaiseAmount, setTargetReliefRaiseAmount] = useState<number>(
    existingStep4?.targetReliefRaiseAmount || defaultRaise
  );

  // Dynamic relief percentage by scheme
  const investorReliefPercentage = useMemo(() => {
    switch (primaryTaxScheme) {
      case 'GB_SEIS_SEED_ENTERPRISE':
        return 50; // HMRC 50% income tax relief
      case 'GB_EIS_ENTERPRISE_INVESTMENT':
        return 30; // HMRC 30% relief
      case 'IE_SURE_FOUNDER_PAYE_REFUND':
        return 41; // Irish Revenue up to 41% PAYE refund
      case 'IE_EII_EMPLOYMENT_INVESTMENT_INCENTIVE':
        return 50; // Irish Revenue up to 50% relief
      case 'IE_SCIS_SMALL_COMPANY_INVESTMENT':
        return 35;
      default:
        return 50;
    }
  }, [primaryTaxScheme]);

  // Tax savings calculated
  const estimatedInvestorTaxSavings = useMemo(() => {
    return Math.round(targetReliefRaiseAmount * (investorReliefPercentage / 100));
  }, [targetReliefRaiseAmount, investorReliefPercentage]);

  // Irish SURE specific fields
  const [founderPriorEmploymentYearsForSure, setFounderPriorEmploymentYearsForSure] = useState<number>(
    existingStep4?.founderPriorEmploymentYearsForSure || 4
  );
  const [founderEstimatedPayeRefundForSure, setFounderEstimatedPayeRefundForSure] = useState<number>(
    existingStep4?.founderEstimatedPayeRefundForSure || 35000
  );

  // Statutory Qualification Gates
  const [advanceAssuranceStatus, setAdvanceAssuranceStatus] = useState<
    'NOT_STARTED' | 'PREPARING_PACK' | 'SUBMITTED' | 'APPROVED'
  >(existingStep4?.advanceAssuranceStatus || 'PREPARING_PACK');

  const [grossAssetsWithinThreshold, setGrossAssetsWithinThreshold] = useState<boolean>(
    existingStep4?.grossAssetsWithinThreshold ?? true
  );
  const [lessThan250Employees, setLessThan250Employees] = useState<boolean>(
    existingStep4?.lessThan250Employees ?? true
  );
  const [qualifyingTradeStatus, setQualifyingTradeStatus] = useState<
    'QUALIFYING' | 'EXCLUDED_TRADE_CHECK_REQUIRED'
  >(existingStep4?.qualifyingTradeStatus || 'QUALIFYING');

  const [taxCatalystPitchNarrative, setTaxCatalystPitchNarrative] = useState<string>(
    existingStep4?.taxCatalystPitchNarrative || ''
  );
  const [aiAssessorTip, setAiAssessorTip] = useState<string | null>(
    existingStep4?.aiAssessorTip || null
  );

  const [activeWhyCard, setActiveWhyCard] = useState<boolean>(false);
  const [activeExampleCard, setActiveExampleCard] = useState<boolean>(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleGenerateAiNarrative = async () => {
    if (isVaultReadonly || isGeneratingAi) return;
    setIsGeneratingAi(true);
    try {
      const res = await generateModuleKStep4TaxReliefAction({
        planId: plan.id,
        planTitle: plan.title,
        industryCategory: plan.industryCategory || 'Startup',
        hqCountryCode: (plan.hqCountryCode as any) || 'IE',
        primaryTaxScheme,
        targetReliefRaiseAmount,
        investorReliefPercentage,
        estimatedInvestorTaxSavings:
          primaryTaxScheme === 'IE_SURE_FOUNDER_PAYE_REFUND'
            ? founderEstimatedPayeRefundForSure
            : estimatedInvestorTaxSavings,
        founderPriorEmploymentYearsForSure:
          primaryTaxScheme === 'IE_SURE_FOUNDER_PAYE_REFUND'
            ? founderPriorEmploymentYearsForSure
            : undefined,
        founderEstimatedPayeRefundForSure:
          primaryTaxScheme === 'IE_SURE_FOUNDER_PAYE_REFUND'
            ? founderEstimatedPayeRefundForSure
            : undefined,
        advanceAssuranceStatus,
        currencySymbol,
      });

      if (res?.narrative) {
        setTaxCatalystPitchNarrative(res.narrative);
        if (res.assessorStrategyTip) {
          setAiAssessorTip(res.assessorStrategyTip);
        }
      }
    } catch (err) {
      console.error('[Module K] AI Step 4 tax relief narrative failed:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSaveStep4 = async () => {
    if (isVaultReadonly) return;
    isDirtyRef.current = false;
    setIsSaving(true);
    try {
      const payload: ModuleKStep4TaxReliefSavedData = {
        primaryTaxScheme,
        otherTaxSchemeText: primaryTaxScheme === 'OTHER' ? otherTaxSchemeText : undefined,
        targetReliefRaiseAmount,
        investorReliefPercentage,
        estimatedInvestorTaxSavings,
        founderPriorEmploymentYearsForSure:
          primaryTaxScheme === 'IE_SURE_FOUNDER_PAYE_REFUND'
            ? founderPriorEmploymentYearsForSure
            : undefined,
        founderEstimatedPayeRefundForSure:
          primaryTaxScheme === 'IE_SURE_FOUNDER_PAYE_REFUND'
            ? founderEstimatedPayeRefundForSure
            : undefined,
        advanceAssuranceStatus,
        grossAssetsWithinThreshold,
        lessThan250Employees,
        qualifyingTradeStatus,
        taxCatalystPitchNarrative,
        aiAssessorTip: aiAssessorTip || undefined,
      };

      if (onSaveStep4) {
        await onSaveStep4(payload, 80);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const isFirstRenderRef = useRef(true);
  const isDirtyRef = useRef(false);
  const handleSaveStep4Ref = useRef(handleSaveStep4);
  handleSaveStep4Ref.current = handleSaveStep4;

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    if (isVaultReadonly) return;
    isDirtyRef.current = true;
    const timer = setTimeout(() => {
      if (isDirtyRef.current) {
        void handleSaveStep4Ref.current();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [
    primaryTaxScheme,
    otherTaxSchemeText,
    targetReliefRaiseAmount,
    founderPriorEmploymentYearsForSure,
    founderEstimatedPayeRefundForSure,
    advanceAssuranceStatus,
    grossAssetsWithinThreshold,
    lessThan250Employees,
    qualifyingTradeStatus,
    taxCatalystPitchNarrative,
    aiAssessorTip,
    isVaultReadonly,
  ]);

  useEffect(() => {
    return () => {
      if (isDirtyRef.current) {
        void handleSaveStep4Ref.current();
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
          Show Me an Investor Pitch Example
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
          {isGeneratingAi ? 'Synthesizing Tax Strategy...' : 'Auto-Generate Tax Pitch with AI'}
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
            How State Tax Relief Turns "Maybe" Angels into Immediate "Yes":
          </p>
          <p className="mt-1 leading-relaxed">
            In the UK and Ireland, government tax relief is the single most powerful fundraising catalyst.
            Under <strong>UK SEIS</strong>, an angel investing £10,000 immediately gets £5,000 refunded by HMRC off their income tax bill,
            reducing their actual downside risk to just 27.5p per £1.
            In Ireland, <strong>Revenue SURE</strong> allows founders leaving a job to reclaim up to 41% of prior PAYE income tax, injecting
            €50k–€100k+ in cash without giving up a single share.
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
          <p className="font-semibold text-emerald-950">
            {isUK ? 'UK SEIS Advance Assurance Deck Pitch' : 'Irish SURE Founder Cash Extraction Example'}
          </p>
          <p className="mt-1 leading-relaxed">
            {isUK ? (
              <>
                "We are raising £150,000 under HMRC SEIS Advance Assurance. For high-rate UK taxpayers, 50% is written off your income tax bill immediately. Combined with 0% capital gains on exit and loss relief, your downside exposure is limited to 27.5%."
              </>
            ) : (
              <>
                "The founder was an enterprise tech lead earning €95,000/year for the past 5 years. By filing Revenue SURE Form 11, the founder extracts €74,000 in direct PAYE income tax cash refunds straight into the startup's bank account, completely funding the LEO Priming 50% match requirement."
              </>
            )}
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. INVESTOR TAX RELIEF SCHEME SELECTOR TILES                               */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900">
            Target Tax Relief Scheme ({isUK ? 'HMRC United Kingdom' : 'Revenue Commissioners Ireland'})
          </h4>
          <span className="text-xs text-slate-500">
            Statutory schemes recognized by early-stage investors
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(isUK
            ? [
                {
                  id: 'GB_SEIS_SEED_ENTERPRISE' as const,
                  badge: '50% Relief • Up to £250k',
                  name: 'Seed Enterprise Investment Scheme (SEIS)',
                  desc: 'HMRC flagship for pre-seed/seed startups. 50% income tax relief + 100% CGT exemption on exit.',
                },
                {
                  id: 'GB_EIS_ENTERPRISE_INVESTMENT' as const,
                  badge: '30% Relief • Up to £5M/yr',
                  name: 'Enterprise Investment Scheme (EIS)',
                  desc: 'Scale-up relief for rounds > £250k. 30% upfront tax relief for angel syndicates & VCs.',
                },
                {
                  id: 'OTHER' as const,
                  badge: 'Custom Structure',
                  name: 'Other Scheme / R&D Relief',
                  desc: 'SME R&D / ERIS relief or custom hybrid angel investment structure.',
                },
              ]
            : [
                {
                  id: 'IE_EII_EMPLOYMENT_INVESTMENT_INCENTIVE' as const,
                  badge: 'Up to 50% Relief • €500k/yr',
                  name: 'Employment Investment Incentive (EII)',
                  desc: 'Irish Revenue flagship angel incentive. Up to 50% income tax relief against total income.',
                },
                {
                  id: 'IE_SURE_FOUNDER_PAYE_REFUND' as const,
                  badge: 'Up to 41% Cash Back • Founder Cash',
                  name: 'Startup Relief for Entrepreneurs (SURE)',
                  desc: 'Extract up to €100k+ in cash refunds from PAYE income tax paid over the past 6 employment years.',
                },
                {
                  id: 'IE_SCIS_SMALL_COMPANY_INVESTMENT' as const,
                  badge: '35% Relief',
                  name: 'Small Company Investment Relief (SCIS)',
                  desc: 'Targeted relief for micro-enterprises and non-executive seed directors.',
                },
              ]
          ).map((sch) => {
            const isSelected = primaryTaxScheme === sch.id;
            return (
              <div
                key={sch.id}
                onClick={() => !isVaultReadonly && setPrimaryTaxScheme(sch.id)}
                className={`cursor-pointer rounded-xl border p-3.5 transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-emerald-700 bg-slate-50 ring-1 ring-emerald-700 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="border-slate-200 bg-slate-100/60 text-slate-900 text-[10px]">
                      {sch.badge}
                    </Badge>
                    {isSelected && <CheckCircle2 className="h-4 w-4 text-emerald-700" />}
                  </div>
                  <h5 className="mt-2 text-xs font-bold text-slate-900">{sch.name}</h5>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600">{sch.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {primaryTaxScheme === 'OTHER' && (
          <div className="pt-1">
            <Label className="text-xs font-semibold text-slate-700">Custom Tax Scheme Description</Label>
            <Input
              type="text"
              value={otherTaxSchemeText}
              onChange={(e) => setOtherTaxSchemeText(e.target.value)}
              placeholder="e.g., Enterprise M&A incentive, cross-border US/UK Section 1202 QSBS relief..."
              className="mt-1 text-xs"
              disabled={isVaultReadonly}
            />
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. VALUE CALCULATOR & UNDERWRITING HERO METRICS                           */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/70 via-white to-slate-50/40 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 border border-emerald-200/60 text-emerald-700">
              <DollarSign className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                {primaryTaxScheme === 'IE_SURE_FOUNDER_PAYE_REFUND'
                  ? 'Founder PAYE Cash Extraction Calculator'
                  : 'Investor Value Catalyst & Tax Savings Engine'}
              </h4>
              <p className="text-xs text-slate-500">
                Direct statutory financial incentive driving faster funding commitments.
              </p>
            </div>
          </div>
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs font-bold">
            {investorReliefPercentage}% Tax Relief Rate
          </Badge>
        </div>

        {primaryTaxScheme === 'IE_SURE_FOUNDER_PAYE_REFUND' ? (
          // Irish SURE Founder Extraction Inputs
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1.5 rounded-xl border border-slate-200 bg-white p-4">
              <Label className="text-xs font-semibold text-slate-700">Prior Employment PAYE Years</Label>
              <Input
                type="number"
                min={1}
                max={6}
                value={founderPriorEmploymentYearsForSure}
                onChange={(e) => setFounderPriorEmploymentYearsForSure(Number(e.target.value) || 1)}
                className="text-xs font-bold"
                disabled={isVaultReadonly}
              />
              <p className="text-[10px] text-slate-500">Revenue looks back up to 6 prior tax years.</p>
            </div>

            <div className="space-y-1.5 rounded-xl border border-slate-200 bg-white p-4">
              <Label className="text-xs font-semibold text-slate-700">Estimated Total PAYE Paid ({currencySymbol})</Label>
              <Input
                type="number"
                value={founderEstimatedPayeRefundForSure}
                onChange={(e) => setFounderEstimatedPayeRefundForSure(Number(e.target.value) || 0)}
                className="text-xs font-bold"
                disabled={isVaultReadonly}
              />
              <p className="text-[10px] text-slate-500">Total income tax paid on P60/Employment Detail Summaries.</p>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 flex flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                Direct Founder Cash Extraction
              </span>
              <div className="my-1">
                <div className="text-2xl font-extrabold tracking-tight text-emerald-700">
                  {currencySymbol}{founderEstimatedPayeRefundForSure.toLocaleString()}
                </div>
                <div className="text-[11px] text-emerald-900">
                  100% Non-Dilutive Match Capital
                </div>
              </div>
              <p className="text-[10px] text-emerald-800">
                Replaces private loans and satisfies LEO match rules without giving away equity.
              </p>
            </div>
          </div>
        ) : (
          // Standard Angel Tax Relief Calculator
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1.5 rounded-xl border border-slate-200 bg-white p-4">
              <Label className="text-xs font-semibold text-slate-700">
                Target Relief Raise ({currencySymbol})
              </Label>
              <Input
                type="number"
                value={targetReliefRaiseAmount}
                onChange={(e) => setTargetReliefRaiseAmount(Number(e.target.value) || 0)}
                className="text-xs font-bold"
                disabled={isVaultReadonly}
              />
              <p className="text-[10px] text-slate-500">
                {isUK ? 'HMRC SEIS max is £250,000' : 'EII max €500,000 per tax year'}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Immediate Investor Tax Back
              </span>
              <div className="my-1">
                <div className="text-2xl font-extrabold tracking-tight text-emerald-700">
                  {currencySymbol}{estimatedInvestorTaxSavings.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-500">
                  Deducted directly off investor income tax
                </div>
              </div>
              <p className="text-[10px] text-slate-500">
                Direct statutory deduction from year-end liability.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Effective Angel Capital at Risk
              </span>
              <div className="my-1">
                <div className="text-2xl font-extrabold tracking-tight text-slate-900">
                  {currencySymbol}{(targetReliefRaiseAmount - estimatedInvestorTaxSavings).toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-500">
                  Net downside exposure (pre-loss relief)
                </div>
              </div>
              <p className="text-[10px] text-slate-500">
                With loss relief, downside is capped at ~27.5%.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. STATUTORY COMPLIANCE & ADVANCE ASSURANCE AUDIT CHECKLIST               */}
      {/* ========================================================================= */}
      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Statutory Eligibility &amp; Advance Assurance Audit
            </h4>
            <p className="text-xs text-slate-500">
              Assessor verification gates required by {isUK ? 'HMRC' : 'Revenue'} before issuing certificates.
            </p>
          </div>
        </div>

        {/* Advance Assurance Status Selector */}
        <div className="space-y-1.5 pt-1">
          <Label className="text-xs font-semibold text-slate-700">
            {isUK ? 'HMRC Advance Assurance Status' : 'Revenue Outline Qualification Status'}
          </Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { id: 'NOT_STARTED' as const, label: 'Not Started' },
              { id: 'PREPARING_PACK' as const, label: 'Preparing Pack' },
              { id: 'SUBMITTED' as const, label: 'Submitted to Revenue' },
              { id: 'APPROVED' as const, label: 'Approved & Granted' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => !isVaultReadonly && setAdvanceAssuranceStatus(st.id)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all border ${
                  advanceAssuranceStatus === st.id
                    ? 'border-emerald-700 bg-emerald-50 text-slate-900 ring-1 ring-emerald-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3 Qualification Gates */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-2">
          <div
            onClick={() => !isVaultReadonly && setGrossAssetsWithinThreshold((p) => !p)}
            className={`cursor-pointer rounded-xl border p-3 transition-all ${
              grossAssetsWithinThreshold
                ? 'border-emerald-300 bg-emerald-50/50'
                : 'border-rose-200 bg-rose-50/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Gross Assets Ceiling</span>
              {grossAssetsWithinThreshold ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Badge variant="outline" className="border-rose-300 text-rose-700 text-[10px]">Over Limit</Badge>
              )}
            </div>
            <p className="mt-1 text-[11px] text-slate-600">
              {isUK ? 'Gross assets < £350k pre-round' : 'Gross assets < €15M statutory cap'}
            </p>
          </div>

          <div
            onClick={() => !isVaultReadonly && setLessThan250Employees((p) => !p)}
            className={`cursor-pointer rounded-xl border p-3 transition-all ${
              lessThan250Employees
                ? 'border-emerald-300 bg-emerald-50/50'
                : 'border-rose-200 bg-rose-50/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Headcount Threshold</span>
              {lessThan250Employees ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Badge variant="outline" className="border-rose-300 text-rose-700 text-[10px]">Over Limit</Badge>
              )}
            </div>
            <p className="mt-1 text-[11px] text-slate-600">
              {isUK ? '< 25 FTE employees (SEIS)' : '< 250 employees (EII qualifying)'}
            </p>
          </div>

          <div
            onClick={() =>
              !isVaultReadonly &&
              setQualifyingTradeStatus((p) =>
                p === 'QUALIFYING' ? 'EXCLUDED_TRADE_CHECK_REQUIRED' : 'QUALIFYING'
              )
            }
            className={`cursor-pointer rounded-xl border p-3 transition-all ${
              qualifyingTradeStatus === 'QUALIFYING'
                ? 'border-emerald-300 bg-emerald-50/50'
                : 'border-amber-300 bg-amber-50/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Qualifying Trade Gate</span>
              {qualifyingTradeStatus === 'QUALIFYING' ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Badge variant="outline" className="border-amber-300 text-amber-700 text-[10px]">Excluded?</Badge>
              )}
            </div>
            <p className="mt-1 text-[11px] text-slate-600">
              {qualifyingTradeStatus === 'QUALIFYING'
                ? 'Not in excluded banking/property sectors'
                : 'Check required (e.g. finance, leasing)'}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. AI INVESTOR PITCH NARRATIVE & ASSESSOR TIP                             */}
      {/* ========================================================================= */}
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <label className="text-xs font-bold text-slate-800">
              Investor Tax Relief Strategy &amp; Angel Catalyst Narrative
            </label>
            <p className="text-[11px] text-slate-500">
              Feeds directly into Module L Appendix E and angel investor pitch decks, showcasing verified tax efficiency.
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
            {isGeneratingAi ? 'Synthesizing...' : 'Calibrate Tax Pitch with AI'}
          </Button>
        </div>

        <textarea
          value={taxCatalystPitchNarrative}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setTaxCatalystPitchNarrative(e.target.value)
          }
          placeholder={`e.g., To accelerate private angel participation, ${plan.title} is raising ${currencySymbol}${targetReliefRaiseAmount.toLocaleString()} under ${primaryTaxScheme.replace(/_/g, ' ')}. Qualifying investors receive ${investorReliefPercentage}% upfront income tax relief (${currencySymbol}${estimatedInvestorTaxSavings.toLocaleString()} in immediate tax deduction), alongside 0% capital gains tax and downside loss relief...`}
          className="flex min-h-[90px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 shadow-xs placeholder:text-slate-400 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
          disabled={isVaultReadonly}
        />

        {aiAssessorTip && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200/80 bg-amber-50/70 p-3 text-[11px] text-amber-900">
            <Info className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold text-amber-950">Angel Underwriting Insider Tip:</span>
              <p className="leading-relaxed text-amber-900/90">{aiAssessorTip}</p>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. BOTTOM TOOLBAR: SAVE & ADVANCE                                         */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div className="flex items-center gap-2">
          {onBackToStep3 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onBackToStep3}
              className="text-xs font-semibold"
            >
              ← Back to Step 3: Reimbursement Bridge
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSaveStep4}
            disabled={isSaving || isVaultReadonly}
            className="text-xs font-semibold"
          >
            {isSaving ? 'Saving...' : 'Save Tax Relief Strategy'}
          </Button>

          {onContinueToNextStep && (
            <Button
              type="button"
              size="sm"
              onClick={async () => {
                await handleSaveStep4();
                onContinueToNextStep();
              }}
              className="bg-emerald-700 text-xs font-bold text-white hover:bg-emerald-800"
            >
              Continue to Step 5: Funding Brief
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
