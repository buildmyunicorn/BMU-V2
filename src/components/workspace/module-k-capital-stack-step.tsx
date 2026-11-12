'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  PieChart,
  ShieldCheck,
  Check,
  AlertTriangle,
  HelpCircle,
  Lightbulb,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Percent,
  DollarSign,
  Scale,
  RotateCcw,
  Plus,
  Trash2,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  type ActiveStartupPlan,
  type CapitalStackPresetType,
  type CapitalAllocationTierItem,
  type ModuleKStep2CapitalStackSavedData,
} from '@/lib/auth/session-store';
import { SUPPORTED_GRANT_PROGRAMS } from '@/lib/grants/module-k-grant-audit';
import { getPlanTrackCapabilities } from '@/lib/localization';
import { generateModuleKCapitalStackNarrativeAction } from '@/app/actions/module-k';

export interface ModuleKCapitalStackStepProps {
  plan: ActiveStartupPlan;
  isVaultReadonly?: boolean;
  onSaveStep2?: (data: ModuleKStep2CapitalStackSavedData, progress?: number) => Promise<void> | void;
  onBackToStep1?: () => void;
  onContinueToNextStep?: () => void;
}

export function ModuleKCapitalStackStep({
  plan,
  isVaultReadonly,
  onSaveStep2,
  onBackToStep1,
  onContinueToNextStep,
}: ModuleKCapitalStackStepProps) {
  const trackCaps = getPlanTrackCapabilities(
    plan.hqCountryCode,
    plan.fundingTrackMode
  );
  const isUK = trackCaps.countryCode === 'GB';
  const isIreland = trackCaps.countryCode === 'IE';
  const isGrantsEnabled = trackCaps.isGrantsEnabled;
  const currencyCode =
    plan.baseCurrency || (isUK ? 'GBP' : isIreland ? 'EUR' : 'USD');
  const currencySymbol =
    currencyCode === 'GBP'
      ? '£'
      : currencyCode === 'EUR'
        ? '€'
        : currencyCode === 'AUD'
          ? 'A$'
          : currencyCode === 'CAD'
            ? 'C$'
            : '$';

  // Selected grant from Step 1 or fallback
  const selectedGrantKey =
    plan.moduleKData?.step1Audit?.selectedGrantKey ||
    (isUK ? 'GB_BBB_START_UP_LOAN' : 'IE_LEO_PRIMING');
  const targetGrantDef = SUPPORTED_GRANT_PROGRAMS[selectedGrantKey];

  // Derive target funding gap from Module J or default reasonable baseline
  const baselineGapFromModJ =
    plan.moduleJData?.step3CashflowGap?.fundingSources?.reduce(
      (acc, s) => acc + (Number(s.amount) || 0),
      0
    ) || (isUK ? 50000 : 60000);

  const existingStep2 = plan.moduleKData?.step2CapitalStack;

  const [totalTargetFundingGap, setTotalTargetFundingGap] = useState<number>(
    existingStep2?.totalTargetFundingGap || baselineGapFromModJ
  );

  const [activePreset, setActivePreset] = useState<CapitalStackPresetType>(
    existingStep2?.presetUsed || 'BALANCED_GRANT_PLUS_FOUNDER_SAVINGS'
  );

  // Initialize funding allocation lines
  const initialSources: CapitalAllocationTierItem[] = useMemo(() => {
    if (existingStep2?.fundingSources && existingStep2.fundingSources.length > 0) {
      return existingStep2.fundingSources;
    }

    const gap = baselineGapFromModJ;
    if (!isGrantsEnabled) {
      const founderAlloc = Math.round(gap * 0.4);
      const bankOrRbfAlloc = Math.round(gap * 0.3);
      const angelAlloc = Math.max(0, gap - founderAlloc - bankOrRbfAlloc);
      return [
        {
          id: 'tier_founder_cash',
          sourceKey: 'FOUNDER_SAVINGS_EQUITY',
          label: 'Founder Savings & Early Customer Pre-Sales',
          amount: founderAlloc,
          percentageOfGap: Math.round((founderAlloc / gap) * 100),
          isDilutive: false,
          description: 'Non-dilutive founder capital and early customer deposits.',
        },
        {
          id: 'tier_loan_or_debt',
          sourceKey: 'GOV_BACKED_LOAN',
          label: `Commercial Bank / Term Loan (${trackCaps.exampleBanksLabel.split(',')[0]})`,
          amount: bankOrRbfAlloc,
          percentageOfGap: Math.round((bankOrRbfAlloc / gap) * 100),
          isDilutive: false,
          description: 'Working capital credit line or revenue-based financing.',
        },
        {
          id: 'tier_angel_equity',
          sourceKey: 'ANGEL_INVESTOR_EQUITY',
          label: 'Angel Syndicate / Pre-Seed SAFE Round',
          amount: angelAlloc,
          percentageOfGap: Math.round((angelAlloc / gap) * 100),
          isDilutive: true,
          description: 'Strategic angel or pre-seed equity capital to accelerate growth.',
        },
      ];
    }

    const grantMax = targetGrantDef?.maxAmountNumeric || (isUK ? 25000 : 40000);
    const grantAlloc = Math.min(gap * 0.5, grantMax);
    const founderAlloc = Math.round(gap * 0.35);
    const loanOrAngelAlloc = Math.max(0, gap - grantAlloc - founderAlloc);

    return [
      {
        id: 'tier_founder_cash',
        sourceKey: 'FOUNDER_SAVINGS_EQUITY',
        label: 'Founder Savings & Skin-in-the-Game',
        amount: founderAlloc,
        percentageOfGap: Math.round((founderAlloc / gap) * 100),
        isDilutive: false,
        description: 'Personal matching funds satisfying state grant co-funding requirements.',
      },
      {
        id: 'tier_primary_grant',
        sourceKey: 'PRIMARY_GRANT',
        label: targetGrantDef?.name || (isUK ? 'Innovate UK Grant' : 'LEO Priming Grant'),
        amount: grantAlloc,
        percentageOfGap: Math.round((grantAlloc / gap) * 100),
        isDilutive: false,
        description: `${targetGrantDef?.fundingBadge || 'Non-Dilutive Cash Grant'} (${targetGrantDef?.matchRatePercent || 50}% co-funding).`,
      },
      {
        id: 'tier_loan_or_debt',
        sourceKey: 'GOV_BACKED_LOAN',
        label: isUK ? 'British Business Bank Start Up Loan' : 'Microfinance Ireland (MFI) Loan',
        amount: loanOrAngelAlloc,
        percentageOfGap: Math.round((loanOrAngelAlloc / gap) * 100),
        isDilutive: false,
        description: 'Unsecured government-backed lending bridge at fixed interest.',
      },
    ];
  }, [existingStep2, baselineGapFromModJ, targetGrantDef, isUK, isGrantsEnabled, trackCaps.exampleBanksLabel]);

  const [fundingSources, setFundingSources] = useState<CapitalAllocationTierItem[]>(initialSources);
  const [activeWhyCard, setActiveWhyCard] = useState<boolean>(false);
  const [activeExampleCard, setActiveExampleCard] = useState<boolean>(false);
  const [fundingStrategyNarrative, setFundingStrategyNarrative] = useState<string>(
    existingStep2?.fundingStrategyNarrative || ''
  );
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [aiAssessorTip, setAiAssessorTip] = useState<string | null>(null);
  const [aiEngineUsed, setAiEngineUsed] = useState<string | null>(null);

  // Synchronize totals & metrics
  const totalAllocated = useMemo(() => {
    return fundingSources.reduce((acc, s) => acc + (Number(s.amount) || 0), 0);
  }, [fundingSources]);

  const skinInTheGame = useMemo(() => {
    const founderLine = fundingSources.find((s) => s.sourceKey === 'FOUNDER_SAVINGS_EQUITY');
    return founderLine ? Number(founderLine.amount) || 0 : 0;
  }, [fundingSources]);

  const skinInTheGamePercent = useMemo(() => {
    if (totalTargetFundingGap <= 0) return 0;
    return Math.round((skinInTheGame / totalTargetFundingGap) * 100);
  }, [skinInTheGame, totalTargetFundingGap]);

  const totalGrants = useMemo(() => {
    return fundingSources
      .filter((s) => s.sourceKey === 'PRIMARY_GRANT' || s.sourceKey === 'SECONDARY_GRANT')
      .reduce((acc, s) => acc + (Number(s.amount) || 0), 0);
  }, [fundingSources]);

  const totalLoans = useMemo(() => {
    return fundingSources
      .filter((s) => s.sourceKey === 'GOV_BACKED_LOAN')
      .reduce((acc, s) => acc + (Number(s.amount) || 0), 0);
  }, [fundingSources]);

  const totalAngel = useMemo(() => {
    return fundingSources
      .filter((s) => s.sourceKey === 'ANGEL_INVESTOR_EQUITY')
      .reduce((acc, s) => acc + (Number(s.amount) || 0), 0);
  }, [fundingSources]);

  // Projected Equity Dilution (assuming typical £/€300k–€750k post-money early valuation)
  const projectedEquityDilution = useMemo(() => {
    if (totalAngel <= 0) return 0;
    const assumedValuation = 500000;
    return Math.min(25, Math.round((totalAngel / assumedValuation) * 100));
  }, [totalAngel]);

  // Assessor Soundness Score (0-100)
  const assessorSoundnessScore = useMemo(() => {
    let score = 50;
    // Skin in the game reward (aim for 20-50%)
    if (skinInTheGamePercent >= 25 && skinInTheGamePercent <= 60) score += 25;
    else if (skinInTheGamePercent > 0) score += 15;
    // Balanced allocation (has grant aid)
    if (totalGrants > 0) score += 15;
    // Difference between target gap and total allocated
    const diff = Math.abs(totalTargetFundingGap - totalAllocated);
    if (diff < totalTargetFundingGap * 0.05) score += 10;
    return Math.min(100, Math.max(20, score));
  }, [skinInTheGamePercent, totalGrants, totalTargetFundingGap, totalAllocated]);

  const handleUpdateAmount = (id: string, newAmount: number) => {
    setFundingSources((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const clean = Math.max(0, newAmount);
        return {
          ...s,
          amount: clean,
          percentageOfGap:
            totalTargetFundingGap > 0 ? Math.round((clean / totalTargetFundingGap) * 100) : 0,
        };
      })
    );
  };

  const handleApplyPreset = (preset: CapitalStackPresetType) => {
    setActivePreset(preset);
    const gap = totalTargetFundingGap;

    if (preset === 'NON_DILUTIVE_LEO_BOOTSTRAP') {
      const grantAmt = Math.min(gap * 0.5, targetGrantDef?.maxAmountNumeric || 40000);
      const founderAmt = gap - grantAmt;
      setFundingSources([
        {
          id: 'tier_founder_cash',
          sourceKey: 'FOUNDER_SAVINGS_EQUITY',
          label: 'Founder Cash Savings (100% Skin in the Game)',
          amount: founderAmt,
          percentageOfGap: Math.round((founderAmt / gap) * 100),
          isDilutive: false,
          description: 'Maximises equity retention. 0% debt, 0% dilution.',
        },
        {
          id: 'tier_primary_grant',
          sourceKey: 'PRIMARY_GRANT',
          label: targetGrantDef?.name || 'Primary Government Grant',
          amount: grantAmt,
          percentageOfGap: Math.round((grantAmt / gap) * 100),
          isDilutive: false,
          description: 'Official non-dilutive grant reimbursement matching 50% of eligible costs.',
        },
      ]);
    } else if (preset === 'MAX_GOV_DEBT_BRIDGE') {
      const grantAmt = Math.min(gap * 0.45, targetGrantDef?.maxAmountNumeric || 35000);
      const loanAmt = Math.min(gap * 0.35, isUK ? 25000 : 25000);
      const founderAmt = Math.max(0, gap - grantAmt - loanAmt);
      setFundingSources([
        {
          id: 'tier_founder_cash',
          sourceKey: 'FOUNDER_SAVINGS_EQUITY',
          label: 'Founder Seed Capital',
          amount: founderAmt,
          percentageOfGap: Math.round((founderAmt / gap) * 100),
          isDilutive: false,
          description: 'Modest founder cash injection to meet minimum grant co-funding requirements.',
        },
        {
          id: 'tier_primary_grant',
          sourceKey: 'PRIMARY_GRANT',
          label: targetGrantDef?.name || 'Primary Government Grant',
          amount: grantAmt,
          percentageOfGap: Math.round((grantAmt / gap) * 100),
          isDilutive: false,
          description: 'Non-dilutive grant drawdown on vouched milestones.',
        },
        {
          id: 'tier_loan_or_debt',
          sourceKey: 'GOV_BACKED_LOAN',
          label: isUK ? 'British Business Bank Start Up Loan' : 'Microfinance Ireland (MFI) Loan',
          amount: loanAmt,
          percentageOfGap: Math.round((loanAmt / gap) * 100),
          isDilutive: false,
          description: 'Fixed 6% government-backed debt preserving complete founder equity.',
        },
      ]);
    } else if (preset === 'ANGEL_MATCH_ACCELERATOR') {
      const angelAmt = Math.round(gap * 0.45);
      const grantAmt = Math.round(gap * 0.35);
      const founderAmt = Math.max(0, gap - angelAmt - grantAmt);
      setFundingSources([
        {
          id: 'tier_founder_cash',
          sourceKey: 'FOUNDER_SAVINGS_EQUITY',
          label: 'Founder Sweat Equity & Seed Match',
          amount: founderAmt,
          percentageOfGap: Math.round((founderAmt / gap) * 100),
          isDilutive: false,
          description: 'Initial founder skin-in-the-game.',
        },
        {
          id: 'tier_primary_grant',
          sourceKey: 'PRIMARY_GRANT',
          label: targetGrantDef?.name || 'Primary Government Grant',
          amount: grantAmt,
          percentageOfGap: Math.round((grantAmt / gap) * 100),
          isDilutive: false,
          description: 'State co-funding backing private angel round.',
        },
        {
          id: 'tier_angel_equity',
          sourceKey: 'ANGEL_INVESTOR_EQUITY',
          label: isUK ? 'SEIS Angel Round (50% Tax Relief)' : 'EII / Angel Seed Investment',
          amount: angelAmt,
          percentageOfGap: Math.round((angelAmt / gap) * 100),
          isDilutive: true,
          equityDilutionPercent: 8,
          description: 'Private angel investor capital accelerated by state investor tax relief.',
        },
      ]);
    }
  };

  const handleGenerateAiNarrative = async () => {
    if (isVaultReadonly || isGeneratingAi) return;
    setIsGeneratingAi(true);
    try {
      const breakdown = fundingSources.map((s) => ({
        label: s.label,
        amount: Number(s.amount) || 0,
        percentage:
          totalTargetFundingGap > 0
            ? Math.round(((Number(s.amount) || 0) / totalTargetFundingGap) * 100)
            : 0,
      }));

      const res = await generateModuleKCapitalStackNarrativeAction({
        planId: plan.id,
        planTitle: plan.title,
        industryCategory: plan.industryCategory || 'Startup',
        hqCountryCode: (plan.hqCountryCode as any) || 'IE',
        targetGrantName: targetGrantDef?.name || 'Primary State Grant',
        targetGrantAgency: targetGrantDef?.agency || 'State Enterprise Agency',
        totalTargetFundingGap,
        totalGrants,
        skinInTheGame,
        totalLoans,
        totalAngel,
        currencySymbol,
        grantMatchPercentage: targetGrantDef?.matchRatePercent || 50,
        strategyPreset: activePreset,
        sourcesBreakdown: breakdown,
      });

      if (res?.narrative) {
        setFundingStrategyNarrative(res.narrative);
        if (res.assessorStrategyTip) {
          setAiAssessorTip(res.assessorStrategyTip);
        }
        setAiEngineUsed(res.engineMode || 'gemini-2.5-flash');
      }
    } catch (err) {
      console.error('[Module K] AI narrative generation failed:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSaveStep2 = async () => {
    if (isVaultReadonly) return;
    isDirtyRef.current = false;
    setIsSaving(true);
    try {
      const payload: ModuleKStep2CapitalStackSavedData = {
        presetUsed: activePreset,
        totalTargetFundingGap,
        fundingSources,
        skinInTheGameCash: skinInTheGame,
        totalGrantsAllocated: totalGrants,
        totalLoansAllocated: totalLoans,
        totalAngelAllocated: totalAngel,
        skinInTheGamePercent,
        projectedEquityDilutionPercent: projectedEquityDilution,
        assessorSoundnessScore,
        fundingStrategyNarrative,
      };

      if (onSaveStep2) {
        await onSaveStep2(payload, 50);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const isFirstRenderRef = useRef(true);
  const isDirtyRef = useRef(false);
  const handleSaveStep2Ref = useRef(handleSaveStep2);
  handleSaveStep2Ref.current = handleSaveStep2;

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    if (isVaultReadonly) return;
    isDirtyRef.current = true;
    const timer = setTimeout(() => {
      if (isDirtyRef.current) {
        void handleSaveStep2Ref.current();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [activePreset, totalTargetFundingGap, fundingSources, fundingStrategyNarrative, isVaultReadonly]);

  useEffect(() => {
    return () => {
      if (isDirtyRef.current) {
        void handleSaveStep2Ref.current();
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
          {isGeneratingAi ? 'Synthesizing with AI...' : 'Auto-Generate Narrative with AI'}
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
          <p className="font-semibold text-slate-950">Why Capital Stacking Decides Grant Approval:</p>
          <p className="mt-1 leading-relaxed">
            Government grant assessors (LEO, Enterprise Ireland, Innovate UK) do not fund 100% of a company.
            They operate on strict <strong>co-funding ratios</strong> (usually 50% or 70%). If your application does not
            clearly demonstrate where the remaining 50% of the money will come from (founder savings, low-interest startup loan,
            or angel investment), your grant will be rejected on "unviable match funding." Step 2 mathematically locks your matching stack.
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
          <p className="font-semibold text-emerald-950">Real Underwriter Capital Stack Breakdown:</p>
          <p className="mt-1 leading-relaxed">
            “For an €80,000 first-year budget: LEO Priming Grant provides €40,000 (50% non-dilutive). The founder provides €15,000
            from personal savings, and bridges the remaining €25,000 via a Microfinance Ireland 5.5% loan. Result: €80,000 funded with
            zero equity dilution, passing all assessor match tests.”
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP SECTION: CAPITAL STACK DIAGNOSTIC SCORECARD                          */}
      {/* ========================================================================= */}
      <Card className="rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/80 via-white to-slate-50/40 p-5 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-600 text-xs font-bold text-white">
                K2
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Capital Stack &amp; Skin-in-the-Game Blend
              </h3>
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-[10px] font-semibold text-emerald-700">
                Co-Funding Architect
              </Badge>
            </div>
            <p className="text-xs text-slate-600 max-w-2xl">
              Target Funding Gap inherited from Module J:{' '}
              <strong className="text-slate-900">
                {currencySymbol}
                {totalTargetFundingGap.toLocaleString()}
              </strong>
              . Match government grants with personal skin-in-the-game and loans.
            </p>
          </div>

          {/* Metric Badges Cluster */}
          <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs shrink-0">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Assessor Soundness
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                  {assessorSoundnessScore}%
                </span>
                <span className="text-xs font-medium text-slate-500">
                  {assessorSoundnessScore >= 80 ? 'Highly Viable' : 'Needs Balance'}
                </span>
              </div>
            </div>
            <div className="h-10 w-px bg-slate-200" />
            <div className="flex flex-col text-xs font-medium space-y-0.5">
              <span className="text-slate-700">
                Skin in Game:{' '}
                <strong className="text-emerald-700">{skinInTheGamePercent}%</strong>
              </span>
              <span className="text-slate-700">
                Grants:{' '}
                <strong className="text-emerald-600">
                  {currencySymbol}
                  {totalGrants.toLocaleString()}
                </strong>
              </span>
              <span className="text-slate-700">
                Equity Dilution:{' '}
                <strong className="text-amber-600">
                  {projectedEquityDilution}%
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Visual Stack Allocation Bar */}
        <div className="mt-5 space-y-2 border-t border-slate-200/80 pt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Capital Stack Composition</span>
            <span className="text-slate-500">
              Allocated: {currencySymbol}
              {totalAllocated.toLocaleString()} of {currencySymbol}
              {totalTargetFundingGap.toLocaleString()} ({Math.round((totalAllocated / (totalTargetFundingGap || 1)) * 100)}%)
            </span>
          </div>

          <div className="flex h-4 w-full overflow-hidden rounded-full bg-slate-100 p-0.5">
            {fundingSources.map((s, idx) => {
              const pct = totalAllocated > 0 ? (s.amount / totalAllocated) * 100 : 0;
              const colorClass =
                s.sourceKey === 'FOUNDER_SAVINGS_EQUITY'
                  ? 'bg-emerald-700'
                  : s.sourceKey === 'PRIMARY_GRANT' || s.sourceKey === 'SECONDARY_GRANT'
                  ? 'bg-emerald-500'
                  : s.sourceKey === 'GOV_BACKED_LOAN'
                  ? 'bg-blue-500'
                  : 'bg-amber-500';

              if (pct <= 0) return null;
              return (
                <div
                  key={s.id}
                  style={{ width: `${pct}%` }}
                  title={`${s.label}: ${currencySymbol}${s.amount.toLocaleString()} (${Math.round(pct)}%)`}
                  className={`${colorClass} transition-all duration-300 first:rounded-l-full last:rounded-r-full`}
                />
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-700" />
              Founder Savings ({currencySymbol}{skinInTheGame.toLocaleString()})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Non-Dilutive Grants ({currencySymbol}{totalGrants.toLocaleString()})
            </span>
            {totalLoans > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                Loans ({currencySymbol}{totalLoans.toLocaleString()})
              </span>
            )}
            {totalAngel > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                Angel Equity ({currencySymbol}{totalAngel.toLocaleString()})
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* 2. PRESET SELECTION TILES (ONE-CLICK CALIBRATION)                         */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900">
            Funding Stack Strategy Presets
          </h4>
          <span className="text-xs text-slate-500">
            One-click presets tailored for {isUK ? 'UK' : 'Irish'} early-stage ventures
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div
            onClick={() => handleApplyPreset('NON_DILUTIVE_LEO_BOOTSTRAP')}
            className={`cursor-pointer rounded-xl border p-4 transition-all ${
              activePreset === 'NON_DILUTIVE_LEO_BOOTSTRAP'
                ? 'border-emerald-700 bg-slate-50 ring-2 ring-emerald-700/20'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">
                0% Dilution
              </Badge>
              <span className="text-xs font-semibold text-slate-500">Pure Bootstrapping</span>
            </div>
            <h5 className="mt-2 text-sm font-bold text-slate-900">
              50% Grant + 50% Founder Cash
            </h5>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              Maximises equity ownership. Zero debt obligations, zero angel dilution. Best for founders with personal cash reserves.
            </p>
          </div>

          <div
            onClick={() => handleApplyPreset('MAX_GOV_DEBT_BRIDGE')}
            className={`cursor-pointer rounded-xl border p-4 transition-all ${
              activePreset === 'MAX_GOV_DEBT_BRIDGE'
                ? 'border-emerald-700 bg-slate-50 ring-2 ring-emerald-700/20'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <Badge className="bg-blue-100 text-blue-800 text-[10px]">
                Low Founder Cash
              </Badge>
              <span className="text-xs font-semibold text-slate-500">Debt Protected</span>
            </div>
            <h5 className="mt-2 text-sm font-bold text-slate-900">
              Grant + 6% Gov Loan Match
            </h5>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              Utilises British Business Bank Start Up Loans or Microfinance Ireland to fulfill grant matching requirements without giving away shares.
            </p>
          </div>

          <div
            onClick={() => handleApplyPreset('ANGEL_MATCH_ACCELERATOR')}
            className={`cursor-pointer rounded-xl border p-4 transition-all ${
              activePreset === 'ANGEL_MATCH_ACCELERATOR'
                ? 'border-emerald-700 bg-slate-50 ring-2 ring-emerald-700/20'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <Badge className="bg-amber-100 text-amber-800 text-[10px]">
                Angel Catalyst
              </Badge>
              <span className="text-xs font-semibold text-slate-500">Fast Scaling</span>
            </div>
            <h5 className="mt-2 text-sm font-bold text-slate-900">
              Angel Round + Grant Co-Fund
            </h5>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              Attracts angel capital leveraging SEIS/EII 50% tax relief as matching funds to unlock major government co-funding.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE ALLOCATION SLIDERS / INPUTS                                 */}
      {/* ========================================================================= */}
      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Interactive Funding Allocation
            </h4>
            <p className="text-xs text-slate-500">
              Adjust each capital line to calibrate your exact funding blend.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs font-medium text-slate-600">Total Gap Target ({currencySymbol}):</Label>
            <Input
              type="number"
              value={totalTargetFundingGap}
              onChange={(e) => setTotalTargetFundingGap(Math.max(1000, Number(e.target.value) || 0))}
              className="h-8 w-28 text-xs font-bold text-slate-900"
              disabled={isVaultReadonly}
            />
          </div>
        </div>

        <div className="space-y-3">
          {fundingSources.map((source) => (
            <div
              key={source.id}
              className="flex flex-col gap-3 rounded-lg border border-slate-200/80 bg-slate-50/60 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {source.label}
                  </span>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {source.isDilutive ? 'Dilutive (Equity)' : 'Non-Dilutive'}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500">{source.description}</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-xs text-slate-500">
                    {currencySymbol}
                  </span>
                  <Input
                    type="number"
                    value={source.amount}
                    onChange={(e) => handleUpdateAmount(source.id, Number(e.target.value) || 0)}
                    className="h-8 w-32 pl-6 text-xs font-bold text-slate-900 bg-white"
                    disabled={isVaultReadonly}
                  />
                </div>
                <span className="w-12 text-right text-xs font-semibold text-slate-600">
                  {totalTargetFundingGap > 0
                    ? Math.round((source.amount / totalTargetFundingGap) * 100)
                    : 0}
                  %
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. WRITTEN STRATEGY & ASSESSOR EXPLANATION                                 */}
      {/* ========================================================================= */}
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <label className="text-xs font-bold text-slate-800">
              Underwriter Strategy &amp; Matching Funds Narrative
            </label>
            <p className="text-[11px] text-slate-500">
              Feeds directly into Module L Appendices A &amp; B, explaining to grant assessors how your co-funding capital will be drawn down safely without cashflow defaults.
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
            {isGeneratingAi ? 'Synthesizing...' : 'Calibrate Narrative with AI'}
          </Button>
        </div>

        <textarea
          value={fundingStrategyNarrative}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFundingStrategyNarrative(e.target.value)}
          placeholder={`e.g., The total project development cost of ${currencySymbol}${totalTargetFundingGap.toLocaleString()} will be co-funded via ${targetGrantDef?.name || 'LEO Priming Grant'} (${currencySymbol}${totalGrants.toLocaleString()}), backed by ${currencySymbol}${skinInTheGame.toLocaleString()} in committed founder personal savings and an approved government-backed loan. Bank statements evidencing matching funds are attached.`}
          className="flex min-h-[90px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 shadow-xs placeholder:text-slate-400 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
          disabled={isVaultReadonly}
        />

        {aiAssessorTip && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200/80 bg-amber-50/70 p-3 text-[11px] text-amber-900">
            <Info className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold text-amber-950">Grant Underwriter Insider Tip:</span>
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
          {onBackToStep1 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onBackToStep1}
              className="text-xs font-semibold"
            >
              ← Back to Step 1 Audit
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSaveStep2}
            disabled={isSaving || isVaultReadonly}
            className="text-xs font-semibold"
          >
            {isSaving ? 'Saving...' : 'Save Capital Stack'}
          </Button>

          {onContinueToNextStep && (
            <Button
              type="button"
              size="sm"
              onClick={async () => {
                await handleSaveStep2();
                onContinueToNextStep();
              }}
              className="bg-emerald-700 text-xs font-bold text-white hover:bg-emerald-800"
            >
              Continue to Step 3: Reimbursement Bridge
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
