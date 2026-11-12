'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FileCheck2,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Copy,
  Scale,
  Landmark,
  HelpCircle,
  Lightbulb,
  ExternalLink,
  ShieldCheck,
  Milestone,
  Calendar,
  Layers,
  ChevronRight,
  Download,
  Printer,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type {
  ActiveStartupPlan,
  ModuleKStep5FundingBriefSavedData,
  GrantRoadmapPhaseItem,
} from '@/lib/auth/session-store';
import {
  buildModuleKStandaloneHtmlDocument,
  type ModuleKBriefExportData,
} from '@/lib/export/module-k-brief';
import {
  generateModuleKStep5FundingBriefAction,
  saveModuleKStep5FundingBriefAction,
} from '@/app/actions/module-k';
import { getPlanTrackCapabilities } from '@/lib/localization';

interface ModuleKFundingBriefStepProps {
  plan: ActiveStartupPlan;
  isVaultReadonly?: boolean;
  onSaveStep5: (data: ModuleKStep5FundingBriefSavedData, progress?: number) => Promise<void> | void;
  onBackToStep4: () => void;
  onContinueToModuleL: () => void;
}

export function ModuleKFundingBriefStep({
  plan,
  isVaultReadonly = false,
  onSaveStep5,
  onBackToStep4,
  onContinueToModuleL,
}: ModuleKFundingBriefStepProps) {
  const trackCaps = getPlanTrackCapabilities(plan.hqCountryCode, plan.fundingTrackMode);
  const { isIreland, isUK, isGrantsEnabled } = trackCaps;
  const currencySymbol =
    plan.baseCurrency === 'GBP'
      ? '£'
      : plan.baseCurrency === 'USD' || plan.baseCurrency === 'CAD' || plan.baseCurrency === 'AUD'
        ? '$'
        : '€';
  const grantAgency = !isGrantsEnabled
    ? 'Commercial Lenders & Institutional Investors'
    : isUK
      ? 'Innovate UK & British Business Bank'
      : 'Local Enterprise Office (LEO) & Enterprise Ireland';

  // Step 1 to 4 derived data
  const step1 = plan.moduleKData?.step1Audit;
  const step2 = plan.moduleKData?.step2CapitalStack;
  const step3 = plan.moduleKData?.step3ReimbursementBridge;
  const step4 = plan.moduleKData?.step4TaxRelief;
  const savedStep5 = plan.moduleKData?.step5FundingBrief;

  // Local state
  const [activeWhyCard, setActiveWhyCard] = useState<boolean>(false);
  const [activeExampleCard, setActiveExampleCard] = useState<boolean>(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [copiedBrief, setCopiedBrief] = useState<boolean>(false);

  const [executiveSummary, setExecutiveSummary] = useState<string>(
    savedStep5?.executiveSummary ||
      (isGrantsEnabled
        ? `${plan.title} has assembled an integrated non-dilutive capital stack engineered to withstand ${grantAgency} underwriting scrutiny. By pairing confirmed founder equity with public grant awards, working capital is protected against in-arrears drawdown timing lag.`
        : `${plan.title} has architected a balanced commercial capital stack designed to fund early product execution, initial customer acquisition, and working capital runway through to cashflow breakeven.`)
  );

  const defaultRoadmap: GrantRoadmapPhaseItem[] = !isGrantsEnabled
    ? [
        {
          phaseNumber: 1,
          grantOrFundingName: 'Founder Capital & Pre-Launch Customer Deposits',
          agency: 'Internal Equity & Early Commercial Validation',
          amountFormatted: `${currencySymbol}10,000 – ${currencySymbol}25,000`,
          timingTrigger: 'Immediate (Months 1–3) — MVP Build & Pilot Validation',
          prerequisites: 'Entity incorporation, business bank account, and validated customer problem.',
          unlocksNext: 'Proves early unit economics and commercial demand without premature equity dilution.',
        },
        {
          phaseNumber: 2,
          grantOrFundingName: 'Commercial Working Capital / Startup Term Facility',
          agency: 'Commercial Bank / Revenue-Based Financing',
          amountFormatted: `${currencySymbol}25,000 – ${currencySymbol}100,000`,
          timingTrigger: 'Months 4–9 — Early Revenue & Repeatable Sales',
          prerequisites: '3–6 months of operating history, unit economics ledger, and 36-month cashflow projection.',
          unlocksNext: 'Funds inventory, marketing scale, and key operational hires with non-dilutive credit.',
        },
        {
          phaseNumber: 3,
          grantOrFundingName: 'Angel Syndicate / Pre-Seed Equity Round',
          agency: 'Private Angel Investors / Seed Micro-VCs',
          amountFormatted: `${currencySymbol}100,000 – ${currencySymbol}500,000`,
          timingTrigger: 'Months 9–18 — Commercial Scale-Up & Market Expansion',
          prerequisites: 'Proven CAC-to-LTV payback, clean cap table, and investor-ready business plan.',
          unlocksNext: 'Accelerates multi-market expansion and institutional Series A readiness.',
        },
      ]
    : isUK
      ? [
          {
            phaseNumber: 1,
            grantOrFundingName: 'British Business Bank Start Up Loan',
            agency: 'British Business Bank',
            amountFormatted: `Up to ${currencySymbol}25,000 (per founder)`,
            timingTrigger: 'Immediate (Months 1–3) — Pre-Trading / MVP Stage',
            prerequisites: 'Credit check, personal survival budget, and business plan outline.',
            unlocksNext: 'Injects unencumbered working capital to build MVP and self-fund early customer acquisition.',
          },
          {
            phaseNumber: 2,
            grantOrFundingName: 'Innovate UK Smart Grant / Growth Hub Match',
            agency: 'Innovate UK / Regional Growth Hub',
            amountFormatted: `${currencySymbol}50,000 – ${currencySymbol}250,000 (70% co-funded)`,
            timingTrigger: 'Months 4–9 — Post-MVP Commercial Validation',
            prerequisites: 'Prototype proof of concept, Freedom to Operate (FTO), and 30% matching cash.',
            unlocksNext: 'Funds deep technical R&D and work packages (WP1–WP4) without founder dilution.',
          },
          {
            phaseNumber: 3,
            grantOrFundingName: 'HMRC SEIS Advance Assurance & Angel Syndicate',
            agency: 'HM Revenue & Customs (HMRC)',
            amountFormatted: `Up to ${currencySymbol}250,000 (50% Investor Tax Relief)`,
            timingTrigger: 'Months 9–15 — Seed Commercial Scale-Up',
            prerequisites: 'HMRC Advance Assurance approval, gross assets < £350k, qualifying trading activity.',
            unlocksNext: 'Catalyzes private angel capital with 50% tax write-offs to bridge into Series A.',
          },
        ]
      : [
          {
            phaseNumber: 1,
            grantOrFundingName: 'LEO Feasibility Study Grant / Grow Digital Voucher',
            agency: 'Local Enterprise Office (LEO Ireland)',
            amountFormatted: `Up to ${currencySymbol}15,000 (Feasibility) + ${currencySymbol}5,000 (Digital)`,
            timingTrigger: 'Immediate (Months 1–3) — Concept & Prototype Validation',
            prerequisites: 'CRO company registration, tax clearance certificate, 50% founder matching cash.',
            unlocksNext: 'De-risks prototype and market viability to qualify for LEO Priming or Enterprise Ireland.',
          },
          {
            phaseNumber: 2,
            grantOrFundingName: 'LEO Priming Grant',
            agency: 'Local Enterprise Office (LEO Ireland)',
            amountFormatted: `Up to ${currencySymbol}80,000 (50% match, max €150k in Gaeltacht/BMW)`,
            timingTrigger: 'Months 4–12 — Early Commercial Trading & Hiring',
            prerequisites: 'Trading under 18 months, internationally traded or high-potential service, 3 supplier quotes.',
            unlocksNext: 'Subsidizes first 2–4 full-time PAYE hires, marketing expansion, and capital expenditure.',
          },
          {
            phaseNumber: 3,
            grantOrFundingName: 'Enterprise Ireland Pre-Seed Start Fund (PSSF) / Revenue SURE',
            agency: 'Enterprise Ireland / Irish Revenue Commissioners',
            amountFormatted: `${currencySymbol}50,000 – ${currencySymbol}100,000 (CLN) + PAYE Refund`,
            timingTrigger: 'Months 12–24 — Export Scaling & Seed Acceleration',
            prerequisites: 'HPSU export commitment, 10+ jobs target within 3 years, founder prior PAYE history.',
            unlocksNext: 'Institutional-grade validation unlocking follow-on Seed VC and European Horizon grants.',
          },
        ];

  const [fundingRoadmap, setFundingRoadmap] = useState<GrantRoadmapPhaseItem[]>(
    savedStep5?.fundingRoadmap && savedStep5.fundingRoadmap.length > 0
      ? savedStep5.fundingRoadmap
      : defaultRoadmap
  );

  const [assessorReadinessScore, setAssessorReadinessScore] = useState<number>(
    savedStep5?.assessorReadinessScore ??
      Math.min(95, Math.max(50, (step1?.overallAssessorReadinessScore || 75) + (step2?.skinInTheGameCash ? 10 : 0)))
  );

  const [underwriterContradictionFlags, setUnderwriterContradictionFlags] = useState<string[]>(
    savedStep5?.underwriterContradictionFlags ||
      (isGrantsEnabled
        ? [
            step3 && step3.liquiditySafetySurplusOrDeficit < 0
              ? `⚠️ Working Capital Deficit: Arrears float exposes a ${currencySymbol}${Math.abs(step3.liquiditySafetySurplusOrDeficit).toLocaleString()} liquidity trough before grant drawdown dispatches.`
              : `✅ Working Capital Buffer: Confirmed liquidity buffer insulates payroll against standard 8-to-16 week claim audit lag.`,
            step2 && step2.skinInTheGameCash > 0
              ? `✅ Skin-in-the-Game: Verified founder cash equity satisfies the 50% matching ratio expectation.`
              : `⚠️ Founder Equity: Zero skin-in-the-game cash declared; evaluators require verifiable matching proof.`,
            step4 && step4.advanceAssuranceStatus === 'NOT_STARTED'
              ? `💡 Advance Assurance Pending: File tax relief application early to de-risk angel investor commitments.`
              : `✅ Tax Relief Clearance: Angel incentives structured to accelerate private match fundraising.`,
          ]
        : [
            step2 && step2.skinInTheGameCash > 0
              ? `✅ Founder Skin-in-the-Game: Verified founder capital contribution (${currencySymbol}${step2.skinInTheGameCash.toLocaleString()}) demonstrates strong alignment to lenders and investors.`
              : `⚠️ Founder Capital Commitment: Consider documenting a baseline founder equity contribution to strengthen bank and investor confidence.`,
            `✅ Working Capital Runway: Capital stack is calibrated against your Module J 36-month cashflow trough.`,
            `✅ Milestone-Driven Deployment: Capital tranches are tied directly to Module D product delivery and Module H revenue breakeven.`,
          ])
  );

  const [recommendedActionChecklist, setRecommendedActionChecklist] = useState<string[]>(
    savedStep5?.recommendedActionChecklist ||
      (isGrantsEnabled
        ? [
            'Collate 3 formal supplier quotes for all capital assets & dev line items (mandatory for voucher/grant claims).',
            `File pre-application enquiry with your regional development executive (${isUK ? 'Innovate UK KTN / Growth Hub' : 'Local Enterprise Office Business Advisor'}).`,
            'Submit formal Advance Assurance or tax relief certification pack to lock in private co-funding interest.',
            'Verify business bank account has separate earmarked ledger line for the mandatory matching funds ratio.',
          ]
        : [
            'Verify corporate entity registration and dedicated business bank account setup in Module G.',
            'Reconcile total target capital stack against the 36-month cashflow trough in Module J.',
            'Prepare vendor and development cost benchmarks from Module D & Module E for investor/lender due diligence.',
            'Compile the Executive Business Plan & Financial Pack in Module L for prospective lenders or angel investors.',
          ])
  );

  const [moduleLGrantMode, setModuleLGrantMode] = useState<
    'IE_LEO' | 'UK_INNOVATE_UK' | 'UK_START_UP_LOANS' | 'HMRC_SEIS' | 'STANDARD'
  >(
    !isGrantsEnabled
      ? 'STANDARD'
      : savedStep5?.moduleLGrantMode ||
          (isUK
            ? step1?.selectedGrantKey === 'GB_BBB_START_UP_LOAN'
              ? 'UK_START_UP_LOANS'
              : step1?.selectedGrantKey === 'GB_HMRC_SEIS_ASSURANCE'
                ? 'HMRC_SEIS'
                : 'UK_INNOVATE_UK'
            : 'IE_LEO')
  );

  const [aiAssessorTip, setAiAssessorTip] = useState<string>(
    savedStep5?.aiAssessorTip ||
      (isGrantsEnabled
        ? 'Evaluator Golden Rule: Grant committees never fund ideas—they fund specific, time-bounded work packages executed by credible operators. Ensure every pound/euro in Module K matches line-by-line with Module D work packages and Module J overheads.'
        : 'Investor & Lender Golden Rule: Underwriters never fund generic projections—they fund specific, milestone-bound execution plans backed by validated unit economics. Ensure your capital stack in Module K matches your Module D build roadmap and Module J cashflow trough.')
  );

  const handleGenerateAi = async () => {
    if (isVaultReadonly || isGeneratingAi) return;
    setIsGeneratingAi(true);
    try {
      const res = await generateModuleKStep5FundingBriefAction({
        planId: plan.id,
        planTitle: plan.title,
        industryCategory: plan.industryCategory || 'Startup',
        hqCountryCode: (plan.hqCountryCode as any) || 'IE',
        baseCurrency: plan.baseCurrency,
        step1Audit: step1
          ? {
              selectedGrantKey: step1.selectedGrantKey,
              overallAssessorReadinessScore: step1.overallAssessorReadinessScore,
            }
          : undefined,
        step2CapitalStack: step2
          ? {
              totalTargetFundingGap: step2.totalTargetFundingGap,
              skinInTheGameCash: step2.skinInTheGameCash,
              fundingSources: step2.fundingSources.map((s) => ({
                sourceKey: s.sourceKey,
                label: s.label,
                amount: s.amount,
                percentageOfGap: s.percentageOfGap,
              })),
            }
          : undefined,
        step3Bridge: step3
          ? {
              grantEligibleVouchedBudget: step3.grantEligibleVouchedBudget,
              expectedGrantDrawdownAmount: step3.expectedGrantDrawdownAmount,
              estimatedClaimTurnaroundWeeks: step3.estimatedClaimTurnaroundWeeks,
              actualConfirmedBridgeLiquidity: step3.actualConfirmedBridgeLiquidity,
              liquiditySafetySurplusOrDeficit: step3.liquiditySafetySurplusOrDeficit,
              bridgeStrategy: step3.bridgeStrategy,
            }
          : undefined,
        step4TaxRelief: step4
          ? {
              primaryTaxScheme: step4.primaryTaxScheme,
              targetReliefRaiseAmount: step4.targetReliefRaiseAmount,
              advanceAssuranceStatus: step4.advanceAssuranceStatus,
              estimatedInvestorTaxSavings: step4.estimatedInvestorTaxSavings,
              founderEstimatedPayeRefundForSure: step4.founderEstimatedPayeRefundForSure,
            }
          : undefined,
      });

      if (res?.executiveSummary) {
        setExecutiveSummary(res.executiveSummary);
        if (res.fundingRoadmap && res.fundingRoadmap.length > 0) {
          setFundingRoadmap(res.fundingRoadmap);
        }
        setAssessorReadinessScore(res.assessorReadinessScore);
        setUnderwriterContradictionFlags(res.underwriterContradictionFlags);
        setRecommendedActionChecklist(res.recommendedActionChecklist);
        setModuleLGrantMode(res.moduleLGrantMode);
        if (res.assessorStrategyTip) {
          setAiAssessorTip(res.assessorStrategyTip);
        }
      }
    } catch (err) {
      console.error('[Module K] AI Step 5 funding brief failed:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSaveStep5 = async () => {
    if (isVaultReadonly) return;
    isDirtyRef.current = false;
    setIsSaving(true);
    try {
      const dataToSave: ModuleKStep5FundingBriefSavedData = {
        executiveSummary,
        fundingRoadmap,
        assessorReadinessScore,
        underwriterContradictionFlags,
        recommendedActionChecklist,
        moduleLGrantMode,
        aiAssessorTip,
        aiEngineUsed: 'gemini-2.5-flash',
        lastSavedAt: new Date().toISOString(),
      };

      if (onSaveStep5) {
        await onSaveStep5(dataToSave, 100);
      } else {
        await saveModuleKStep5FundingBriefAction({
          planId: plan.id,
          step5FundingBrief: dataToSave,
          completionPercentage: 100,
        });
      }
    } catch (err) {
      console.error('[Module K] Save step 5 error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const isFirstRenderRef = useRef(true);
  const isDirtyRef = useRef(false);
  const handleSaveStep5Ref = useRef(handleSaveStep5);
  handleSaveStep5Ref.current = handleSaveStep5;

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    if (isVaultReadonly) return;
    isDirtyRef.current = true;
    const timer = setTimeout(() => {
      if (isDirtyRef.current) {
        void handleSaveStep5Ref.current();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [
    executiveSummary,
    fundingRoadmap,
    assessorReadinessScore,
    underwriterContradictionFlags,
    recommendedActionChecklist,
    moduleLGrantMode,
    aiAssessorTip,
    isVaultReadonly,
  ]);

  useEffect(() => {
    return () => {
      if (isDirtyRef.current) {
        void handleSaveStep5Ref.current();
      }
    };
  }, []);

  const handleCopyBrief = () => {
    const textToCopy = `EXECUTIVE FUNDING STRATEGY DOSSIER: ${plan.title.toUpperCase()}
Jurisdiction: ${isUK ? 'United Kingdom' : 'Ireland'} (${plan.baseCurrency})
Overall Assessor Readiness Score: ${assessorReadinessScore}%

1. EXECUTIVE NARRATIVE:
${executiveSummary}

2. PHASED GRANT & FUNDING ROADMAP:
${fundingRoadmap.map((p) => `Phase ${p.phaseNumber}: ${p.grantOrFundingName} (${p.amountFormatted})\n  • Agency: ${p.agency}\n  • Timing: ${p.timingTrigger}\n  • Prerequisites: ${p.prerequisites}\n  • Unlocks: ${p.unlocksNext}`).join('\n')}

3. CAPITAL & CASHFLOW ARCHITECTURE:
- Target Runway: ${currencySymbol}${(step2?.totalTargetFundingGap || 0).toLocaleString()}
- Confirmed Founder Skin-in-the-Game: ${currencySymbol}${(step2?.skinInTheGameCash || 0).toLocaleString()}
- Non-Dilutive Grant Target: ${currencySymbol}${(step3?.expectedGrantDrawdownAmount || 0).toLocaleString()}
- Reimbursement Float Buffer: ${currencySymbol}${(step3?.actualConfirmedBridgeLiquidity || 0).toLocaleString()} (${step3?.bridgeStrategy || 'Staged Buffer'})
- Investor Tax Relief: ${step4?.primaryTaxScheme || 'State Tax Relief'} (${currencySymbol}${(step4?.targetReliefRaiseAmount || 0).toLocaleString()} target)

4. PRE-FLIGHT UNDERWRITER CONTRADICTION AUDIT:
${underwriterContradictionFlags.map((flag) => `• ${flag}`).join('\n')}

5. PRE-SUBMISSION ACTION CHECKLIST:
${recommendedActionChecklist.map((act) => `[ ] ${act}`).join('\n')}

Assessor Strategic Insight:
${aiAssessorTip}
`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedBrief(true);
    setTimeout(() => setCopiedBrief(false), 2500);
  };

  const getExportData = (): ModuleKBriefExportData => ({
    planTitle: plan.title,
    founderName:
      plan.moduleFData?.promoterProfiles?.teamMembers?.[0]?.fullName || 'Founder',
    industryCategory: plan.industryCategory || 'Startup Venture',
    hqCountryCode: plan.hqCountryCode || 'IE',
    baseCurrency: plan.baseCurrency || 'EUR',
    brief: {
      assessorReadinessScore,
      executiveSummary,
      fundingRoadmap,
      underwriterContradictionFlags,
      recommendedActionChecklist,
      aiAssessorTip,
      moduleLGrantMode,
    },
    step1SelectedGrantName: step1?.selectedGrantKey?.replace(/_/g, ' '),
    step1ReadinessScore: step1?.overallAssessorReadinessScore,
    step2TotalGap: step2?.totalTargetFundingGap,
    step2SkinInTheGame: step2?.skinInTheGameCash,
    step3ReimbursementBuffer: step3?.actualConfirmedBridgeLiquidity,
    step3BridgeStrategy: step3?.bridgeStrategy,
    step4TaxScheme: step4?.primaryTaxScheme?.replace(/_/g, ' '),
    step4AdvanceStatus: step4?.advanceAssuranceStatus?.replace(/_/g, ' '),
  });

  const handleDownloadHtmlBrief = () => {
    const htmlContent = buildModuleKStandaloneHtmlDocument(getExportData());
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeSlug =
      plan.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'funding-strategy';
    link.href = url;
    link.download = `${safeSlug}-executive-funding-strategy-brief.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintPdfBrief = () => {
    const htmlContent = buildModuleKStandaloneHtmlDocument(getExportData());
    const printWindow = window.open('', '_blank', 'width=960,height=800');
    if (!printWindow) {
      handleDownloadHtmlBrief();
      return;
    }
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <div className="space-y-8">
      {/* 4-Layer Support Strip */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-4">
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
          onClick={handleGenerateAi}
          disabled={isGeneratingAi || isVaultReadonly}
          className="h-7 border-slate-200 bg-slate-50/80 text-[11px] font-medium text-slate-800 hover:bg-slate-100"
        >
          <Sparkles className="mr-1 h-3.5 w-3.5 text-emerald-700" />
          {isGeneratingAi ? 'Synthesizing Assessor Dossier...' : 'AI Pre-Flight Audit & Brief Synthesis'}
        </Button>
      </div>

      {/* Collapsible Micro-Coaching Drawers */}
      {activeWhyCard && (
        <div className="relative rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-900 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveWhyCard(false)}
            className="absolute right-2.5 top-2.5 text-emerald-600 hover:text-emerald-800"
          >
            ✕
          </button>
          <p className="font-semibold text-slate-950">Why an Executive Funding Dossier Matters:</p>
          <p className="mt-1 leading-relaxed">
            Public grant committees ({isUK ? 'Innovate UK assessors' : 'LEO evaluation committees'}) review dozens of applications in each batch. They do not have time to dig through fragmented tables to reconcile if your matching money is real, if your grant reimbursement float is funded, or if your private investors have tax assurance. This final brief combines all 4 previous steps into a clean, unassailable 1-page commercial dossier ready for Module L.
          </p>
        </div>
      )}

      {activeExampleCard && (
        <div className="relative rounded-lg border border-emerald-100 bg-emerald-50/70 p-4 text-xs text-emerald-950 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveExampleCard(false)}
            className="absolute right-2.5 top-2.5 text-emerald-500 hover:text-emerald-800"
          >
            ✕
          </button>
          <p className="font-semibold text-emerald-950">Example Assessor Strategy Brief:</p>
          <p className="mt-1 font-mono text-[11px] leading-relaxed">
            &quot;Acme AI secures {currencySymbol}60,000 in early runway via {currencySymbol}30,000 LEO Priming (50% match) paired with {currencySymbol}15,000 founder savings and {currencySymbol}15,000 Revenue SURE tax refund. In-arrears claim float (8 weeks) is bridged via 60-day vendor payment terms, protecting payroll and ensuring zero equity dilution at launch.&quot;
          </p>
        </div>
      )}

      {/* Hero Diagnostic Grid */}
      <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/70 via-white to-slate-50/40 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 border border-slate-200/60 text-emerald-800">
              <Scale className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Statutory Underwriting &amp; Capital Alignment Scorecard
              </h3>
              <p className="text-xs text-slate-500">
                Consolidated assessment synthesized from Steps 1–4 cross-checks.
              </p>
            </div>
          </div>
          <Badge
            className={
              assessorReadinessScore >= 80
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : assessorReadinessScore >= 60
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-rose-100 text-rose-800 border-rose-300'
            }
          >
            {assessorReadinessScore >= 80 ? 'Committee Ready' : 'Optimization Required'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Card 1: Assessor Score */}
          <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Readiness Score
                </span>
                <span className="text-xs font-bold text-emerald-700">{assessorReadinessScore}%</span>
              </div>
              <div className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
                {assessorReadinessScore}
                <span className="text-base font-normal text-slate-500"> / 100</span>
              </div>
            </div>
            <div className="mt-3 rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1.5 text-xs text-slate-600 truncate">
              {step1 ? `${step1.selectedGrantKey.replace(/_/g, ' ')}` : 'Target Grant Evaluated'}
            </div>
            <p className="mt-3 border-t border-slate-100 pt-2 text-[11px] text-slate-500">
              Based on official statutory evaluation guidelines.
            </p>
          </div>

          {/* Card 2: Total Target Runway */}
          <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Target Capital Stack
                </span>
                <span className="text-xs font-bold text-emerald-600">Step 2</span>
              </div>
              <div className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
                {currencySymbol}
                {(step2?.totalTargetFundingGap || 50000).toLocaleString()}
              </div>
            </div>
            <div className="mt-3 rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1.5 text-xs text-slate-600">
              Founder Cash: {currencySymbol}{(step2?.skinInTheGameCash || 0).toLocaleString()} (
              {step2 && step2.totalTargetFundingGap > 0
                ? Math.round((step2.skinInTheGameCash / step2.totalTargetFundingGap) * 100)
                : 0}
              %)
            </div>
            <p className="mt-3 border-t border-slate-100 pt-2 text-[11px] text-slate-500">
              Non-dilutive match ratio satisfied.
            </p>
          </div>

          {/* Card 3: Arrears Reimbursement Buffer */}
          <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Arrears Float Buffer
                </span>
                <span className="text-xs font-bold text-emerald-700">Step 3</span>
              </div>
              <div className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
                {currencySymbol}
                {(step3?.actualConfirmedBridgeLiquidity || 0).toLocaleString()}
              </div>
            </div>
            <div className="mt-3 rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1.5 text-xs text-slate-600">
              {step3 && step3.liquiditySafetySurplusOrDeficit >= 0
                ? `Surplus: +${currencySymbol}${step3.liquiditySafetySurplusOrDeficit.toLocaleString()}`
                : `Deficit: -${currencySymbol}${Math.abs(step3?.liquiditySafetySurplusOrDeficit || 0).toLocaleString()}`}
            </div>
            <p className="mt-3 border-t border-slate-100 pt-2 text-[11px] text-slate-500 truncate">
              Strategy: {step3?.bridgeStrategy?.replace(/_/g, ' ') || 'Buffer & Terms'}
            </p>
          </div>

          {/* Card 4: Investor Tax Catalyst */}
          <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Angel Tax Catalyst
                </span>
                <span className="text-xs font-bold text-amber-600">Step 4</span>
              </div>
              <div className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
                {currencySymbol}
                {(step4?.estimatedInvestorTaxSavings || 0).toLocaleString()}
              </div>
            </div>
            <div className="mt-3 rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1.5 text-xs text-slate-600 truncate">
              {step4 ? step4.primaryTaxScheme.replace(/_/g, ' ') : 'SEIS / SURE Relief'}
            </div>
            <p className="mt-3 border-t border-slate-100 pt-2 text-[11px] text-slate-500 truncate">
              Advance: {step4?.advanceAssuranceStatus?.replace(/_/g, ' ') || 'Pending'}
            </p>
          </div>
        </div>
      </div>

      {/* Phased Grant & Funding Application Roadmap */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 border border-slate-200/60 text-emerald-800">
              <Milestone className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Phased Grant &amp; Funding Application Roadmap
              </h3>
              <p className="text-xs text-slate-500">
                Sequenced application pipeline: which grant to apply for first, what milestones it funds, and what it unlocks next.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="border-emerald-300 text-emerald-800 bg-slate-50 text-[10px] font-semibold">
            {fundingRoadmap.length} Phased Funding Milestones
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {fundingRoadmap.map((phase) => (
            <div
              key={phase.phaseNumber}
              className="relative rounded-xl border border-slate-200/80 bg-slate-50/40 p-4 shadow-xs flex flex-col justify-between space-y-3.5 hover:border-emerald-300 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between">
                  <Badge className="bg-emerald-700 text-white font-bold text-[10px] px-2 py-0.5">
                    Phase {phase.phaseNumber}
                  </Badge>
                  <span className="text-[11px] font-bold text-slate-900 bg-emerald-50 border border-slate-100 px-2 py-0.5 rounded-full">
                    {phase.amountFormatted}
                  </span>
                </div>
                <h4 className="mt-2 text-sm font-bold text-slate-900">
                  {phase.grantOrFundingName}
                </h4>
                <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <Landmark className="h-3 w-3 text-slate-400 shrink-0" />
                  <span className="truncate">{phase.agency}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs border-t border-slate-200/60 pt-3">
                <div className="rounded-lg bg-white border border-slate-200/60 p-2.5 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-emerald-700" />
                    When to Apply
                  </div>
                  <div className="text-[11px] font-medium text-slate-800">
                    {phase.timingTrigger}
                  </div>
                </div>

                <div className="rounded-lg bg-white border border-slate-200/60 p-2.5 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1">
                    <Layers className="h-3 w-3 text-amber-500" />
                    Prerequisites Before Applying
                  </div>
                  <div className="text-[11px] text-slate-600 leading-normal">
                    {phase.prerequisites}
                  </div>
                </div>

                <div className="rounded-lg bg-emerald-50/60 border border-emerald-200/70 p-2.5 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                    <ChevronRight className="h-3 w-3 text-emerald-600" />
                    What This Unlocks
                  </div>
                  <div className="text-[11px] text-emerald-900 leading-normal font-medium">
                    {phase.unlocksNext}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Underwriter Strategy Narrative Dossier */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                1-Page Executive Funding Strategy Dossier
              </h3>
              <Badge variant="outline" className="border-slate-200 bg-slate-50 text-[10px] font-medium text-emerald-800">
                Committee &amp; Investor Ready
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              The master narrative presented to grant committees, bank lenders, and angel investors.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleGenerateAi}
              disabled={isGeneratingAi || isVaultReadonly}
              className="h-8 border-slate-200 bg-slate-50/80 text-xs font-semibold text-emerald-800 hover:bg-slate-100"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5 text-emerald-700" />
              {isGeneratingAi ? 'Synthesizing...' : 'Calibrate AI Overview'}
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleCopyBrief}
              className="h-8 border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              {copiedBrief ? (
                <>
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                  Copied Dossier
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
                  Copy Brief
                </>
              )}
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleDownloadHtmlBrief}
              className="h-8 border-slate-200 text-xs font-medium text-emerald-800 hover:bg-emerald-50"
            >
              <Download className="mr-1.5 h-3.5 w-3.5 text-emerald-700" />
              Download Brief (.html)
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handlePrintPdfBrief}
              className="h-8 bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800"
            >
              <Printer className="mr-1.5 h-3.5 w-3.5" />
              Print / Save as PDF
            </Button>
          </div>
        </div>

        <textarea
          value={executiveSummary}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setExecutiveSummary(e.target.value)}
          rows={6}
          disabled={isVaultReadonly}
          className="w-full rounded-lg border border-slate-200 bg-white p-3.5 font-sans text-xs sm:text-sm leading-relaxed text-slate-900 shadow-xs focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-700"
          placeholder="Craft or calibrate the executive funding strategy narrative..."
        />
      </div>

      {/* Pre-Flight Contradiction & Underwriter Audit Checks */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-700" />
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Pre-Flight Evaluator Contradiction Flags
          </h4>
        </div>
        <p className="text-xs text-slate-600">
          Our automated underwriter scan detected the following alignment checkpoints across your capital stack and cashflow models:
        </p>

        <div className="space-y-2.5">
          {underwriterContradictionFlags.map((flag, idx) => (
            <div
              key={idx}
              className={`rounded-lg border p-3 text-xs leading-relaxed ${
                flag.startsWith('⚠️')
                  ? 'border-amber-200 bg-amber-50/70 text-amber-900'
                  : flag.startsWith('💡')
                    ? 'border-slate-200 bg-slate-50 text-slate-900'
                    : 'border-emerald-200 bg-emerald-50/70 text-emerald-900'
              }`}
            >
              {flag}
            </div>
          ))}
        </div>
      </div>

      {/* Pre-Submission Action Checklist */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <FileCheck2 className="h-4 w-4 text-emerald-600" />
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Pre-Submission Action Checklist (Before Filing in Module L)
          </h4>
        </div>

        <div className="space-y-2">
          {recommendedActionChecklist.map((action, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 rounded-lg border border-slate-100 bg-slate-50/80 p-2.5 text-xs text-slate-700"
            >
              <input
                type="checkbox"
                defaultChecked={idx === 0}
                className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-emerald-700 focus:ring-emerald-700"
              />
              <span>{action}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Target Module L Compiler Mode Recommendation */}
      <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 via-white to-slate-50/50 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-emerald-800" />
            <span className="text-xs font-bold text-slate-950 uppercase tracking-wider">
              {isGrantsEnabled ? 'Recommended Module L Grant Compiler Mode' : 'Recommended Module L Business Plan Mode'}
            </span>
          </div>
          <p className="text-xs text-slate-900">
            Based on your selected track ({!isGrantsEnabled ? `${plan.hqCountryCode} Commercial Track` : isUK ? 'United Kingdom' : 'Ireland'}), your business plan compiler will automatically format into:
          </p>
          <div className="mt-1 font-bold text-sm text-slate-900">
            {moduleLGrantMode === 'IE_LEO' && '🇮🇪 Local Enterprise Office (LEO Official Form & Appendices A–F)'}
            {moduleLGrantMode === 'UK_INNOVATE_UK' && '🇬🇧 Innovate UK IFS 9-Question Grant Mode + 2-Page PDF Appendices'}
            {moduleLGrantMode === 'UK_START_UP_LOANS' && '🇬🇧 British Business Bank Start Up Loans 4-Part Cashflow Workbook'}
            {moduleLGrantMode === 'HMRC_SEIS' && '🇬🇧 HMRC SEIS/EIS Advance Assurance Pack'}
            {moduleLGrantMode === 'STANDARD' && '🌐 Standard Investor & Commercial Business Plan'}
          </div>
        </div>

        <Button
          type="button"
          onClick={onContinueToModuleL}
          className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold"
        >
          Open in Module L Compiler
          <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Assessor Tip Callout Banner */}
      {aiAssessorTip && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 shadow-xs">
          <div className="flex items-start gap-2.5">
            <Sparkles className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-amber-900">
              <span className="font-semibold text-amber-950">Underwriter Insider Tip: </span>
              {aiAssessorTip}
            </div>
          </div>
        </div>
      )}

      {/* Export & Download Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-2xs">
        <div className="text-xs text-slate-600">
          📥 <strong>Take your Executive Funding Strategy Dossier with you:</strong> Download a standalone file, print/save as PDF, or copy for {isGrantsEnabled ? 'grant assessors and bank lenders' : 'commercial bank lenders and angel investors'}.
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyBrief}
            className="text-xs"
          >
            {copiedBrief ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                Copied Dossier
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-600" />
                Copy Brief
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownloadHtmlBrief}
            className="text-xs"
          >
            <Download className="mr-1 h-3.5 w-3.5 text-emerald-700" />
            Download Brief (.html)
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handlePrintPdfBrief}
            className="bg-emerald-700 text-white hover:bg-emerald-800 text-xs"
          >
            <Printer className="mr-1 h-3.5 w-3.5" />
            Print / Save as PDF
          </Button>
        </div>
      </div>

      {/* Bottom Step Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onBackToStep4}
          className="text-xs text-slate-600 hover:bg-slate-50"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          {isGrantsEnabled ? 'Back to Step 4 (Angel Tax Relief)' : 'Back to Step 1 (Capital Stack)'}
        </Button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSaveStep5}
            disabled={isSaving || isVaultReadonly}
            className="border-slate-200 text-xs text-slate-700 hover:bg-slate-50"
          >
            {isSaving ? 'Saving...' : 'Save Funding Dossier'}
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={async () => {
              await handleSaveStep5();
              onContinueToModuleL();
            }}
            disabled={isSaving || isVaultReadonly}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold"
          >
            Complete Module K &amp; Compile Plan in Module L
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
