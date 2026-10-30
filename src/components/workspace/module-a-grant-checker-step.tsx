'use client';

import React, { useState, useEffect } from 'react';
import {
  Award,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  HelpCircle,
  Lightbulb,
  Loader2,
  Pencil,
  Save,
  Sparkles,
  TrendingUp,
  Wand2,
  ArrowRight,
  ArrowLeft,
  BookmarkPlus,
  X,
  Search,
  Building2,
  Briefcase,
  UserCheck,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  evaluateModuleAGrantEligibility,
  GRANT_ACTIVITY_TYPE_LABELS,
  GRANT_LEGAL_ENTITY_LABELS,
  GRANT_PAYE_STATUS_LABELS,
  GRANT_REGIONAL_TIER_LABELS,
  type GrantCommercialActivityType,
  type GrantFounderPayeStatus,
  type GrantLegalEntityStage,
  type GrantRegionalLocationTier,
  type SavedGrantEligibilityCheck,
  type EvaluatedGrantMatch,
} from '@/lib/grants/module-a-grant-checker';
import type { SupportedCountryCode } from '@/lib/localization';
import type {
  SavedConceptCanvas,
  SavedFounderMotivation,
  SavedFounderRealityCheck,
  SavedTeamAndBudget,
} from '@/lib/auth/session-store';

interface ModuleAGrantCheckerStepProps {
  planTitle: string;
  hqCountryCode: SupportedCountryCode;
  exportPotential: 'DOMESTIC_ONLY' | 'EXPORTING_INTERNATIONALLY';
  industryCategory: string;
  brainDumpText: string;
  conceptCanvas: SavedConceptCanvas;
  founderMotivation: SavedFounderMotivation;
  teamAndBudget: SavedTeamAndBudget;
  founderRealityCheck: SavedFounderRealityCheck;
  grantCheck: SavedGrantEligibilityCheck;
  onChangeGrantCheck: (next: SavedGrantEligibilityCheck) => void;
  onSaveGrantCheck: (overrideCheck?: SavedGrantEligibilityCheck) => Promise<void>;
  onRunAiGrantPositioning: (
    overrideCheck?: SavedGrantEligibilityCheck
  ) => Promise<void>;
  onParkOpenQuestion: (questionText: string) => void;
  onContinueToBrief: () => void;
  onContinueToModuleB: () => void;
  onOpenModuleJGrantsHub: () => void;
  isSaving: boolean;
  isRunningAiAdvisor: boolean;
  isVaultReadonly: boolean;
  isOpen: boolean;
  isAllExpanded: boolean;
  onExpandStep: () => void;
  onCollapseStep: () => void;
}

export function ModuleAGrantCheckerStep({
  planTitle,
  hqCountryCode,
  exportPotential,
  industryCategory,
  brainDumpText,
  conceptCanvas,
  founderMotivation,
  teamAndBudget,
  founderRealityCheck,
  grantCheck,
  onChangeGrantCheck,
  onSaveGrantCheck,
  onRunAiGrantPositioning,
  onParkOpenQuestion,
  onContinueToBrief,
  onContinueToModuleB,
  onOpenModuleJGrantsHub,
  isSaving,
  isRunningAiAdvisor,
  isVaultReadonly,
  isOpen,
  isAllExpanded,
  onExpandStep,
  onCollapseStep,
}: ModuleAGrantCheckerStepProps) {
  const [showWhyAsking, setShowWhyAsking] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const [showNotEligible, setShowNotEligible] = useState(false);
  const [parkedConfirm, setParkedConfirm] = useState(false);

  // Pop-Out 4-Step Micro-Question Wizard Modal State
  const [isWizardModalOpen, setIsWizardModalOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [draftCheck, setDraftCheck] =
    useState<SavedGrantEligibilityCheck>(grantCheck);
  const [hasRevealedGrants, setHasRevealedGrants] = useState<boolean>(() =>
    Boolean(grantCheck.lastCheckedAt)
  );

  useEffect(() => {
    setHasRevealedGrants(Boolean(grantCheck.lastCheckedAt));
  }, [grantCheck.lastCheckedAt]);

  const isGrantsRevealed = hasRevealedGrants || Boolean(grantCheck.lastCheckedAt);

  const evaluation = evaluateModuleAGrantEligibility({
    hqCountryCode,
    exportPotential,
    industryCategory,
    brainDumpText,
    conceptCanvas,
    founderMotivation,
    teamAndBudget,
    founderRealityCheck,
    grantCheck,
  });

  const isIreland = evaluation.countryCode === 'IE';
  const countryFlag = isIreland ? '🇮🇪' : '🇬🇧';
  const countryLabel = isIreland
    ? 'Ireland (LEO, Enterprise Ireland & Revenue)'
    : 'United Kingdom (Start Up Loans, Innovate UK & HMRC)';

  const regionalOptions: GrantRegionalLocationTier[] = isIreland
    ? [
        'IE_STANDARD_50_MATCH',
        'IE_BMW_REGIONAL_60_MATCH',
        'IE_GAELTACHT_UDARAS',
        'OTHER',
      ]
    : [
        'GB_ENGLAND_GROWTH_HUB',
        'GB_SCOTLAND_SE',
        'GB_WALES_DBW',
        'GB_NORTHERN_IRELAND_INVEST_NI',
        'OTHER',
      ];

  function handleOpenWizardModal(initialStep: 1 | 2 | 3 | 4 = 1) {
    setDraftCheck(grantCheck);
    setWizardStep(initialStep);
    setIsWizardModalOpen(true);
  }

  async function handleSaveWizardAndRevealGrants() {
    const stamped: SavedGrantEligibilityCheck = {
      ...draftCheck,
      lastCheckedAt: new Date().toISOString(),
    };
    onChangeGrantCheck(stamped);
    setHasRevealedGrants(true);
    setIsWizardModalOpen(false);

    if (!isVaultReadonly) {
      await onSaveGrantCheck(stamped);
      await onRunAiGrantPositioning(stamped);
    }
  }

  const displayedPositioningTips =
    grantCheck.aiGrantPositioningAdvice &&
    grantCheck.aiGrantPositioningAdvice.length > 0
      ? grantCheck.aiGrantPositioningAdvice
      : evaluation.strategicPositioningTips;

  if (!isOpen && !isAllExpanded) {
    return (
      <div
        id="mod-a-step-7"
        onClick={onExpandStep}
        className="group scroll-mt-24 cursor-pointer rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50/60 via-white to-indigo-50/40 p-4 shadow-xs transition-all hover:border-emerald-400 hover:shadow-sm"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                isGrantsRevealed
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 text-white'
              }`}
            >
              {isGrantsRevealed ? <Check className="h-4 w-4" /> : '7'}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-sm font-bold text-slate-900">
                  Step 7: {countryFlag} Instant Grant &amp; Funding Eligibility Checker
                </h2>
                {isGrantsRevealed ? (
                  <Badge variant="success" className="shrink-0 text-[10px]">
                    {evaluation.qualifiesNowGrants.length} Qualified Now • Up to{' '}
                    {evaluation.immediateQualifiedPoolFormatted}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="shrink-0 border-emerald-300 bg-emerald-50 text-[10px] text-emerald-800">
                    Ready to Check Eligibility
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {isGrantsRevealed
                  ? `Revealed ${evaluation.qualifiesNowGrants.length} immediate grants & ${evaluation.unlockableNextGrants.length} Phase 2 schemes for ${planTitle}.`
                  : `Answer 4 quick micro-questions to see which ${isIreland ? 'Irish' : 'UK'} grants, loans, and tax reliefs you qualify for.`}
              </p>
            </div>
          </div>
          <div className="ml-3 flex shrink-0 items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 shrink-0 px-2.5 text-xs font-medium text-emerald-700 group-hover:bg-emerald-50"
            >
              <span>{isGrantsRevealed ? 'View Grants' : 'Check Grants'}</span>
              <ChevronDown className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id="mod-a-step-7"
      className="scroll-mt-24 rounded-xl border border-emerald-200 bg-white p-4 shadow-xs sm:p-6"
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
              7
            </span>
            <h2 className="text-base font-bold text-slate-900">
              Step 7: {countryFlag} Instant Grant &amp; Non-Dilutive Funding Checker
            </h2>
            <Badge variant="success" className="shrink-0 text-[10px]">
              {countryLabel}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-600">
            {isGrantsRevealed ? (
              <>
                Here is your personalized {isIreland ? 'Irish' : 'UK'} grant &amp; funding breakdown for{' '}
                <strong className="text-slate-900">{planTitle}</strong> based on Steps 1–5 and your 4 eligibility answers. Your qualified grants are automatically included in your Step 8 1-Page Brief.
              </>
            ) : (
              <>
                We have pre-loaded your Concept Canvas, Export Scope, and Starting Budget from Steps 1–5. Click{' '}
                <strong className="text-slate-900">Check What Grants I Qualify For</strong> below to answer 4 quick micro-questions and unlock your grant pool before generating your Step 8 1-Page Brief.
              </>
            )}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {isGrantsRevealed && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleOpenWizardModal(1)}
              className="h-8 border-emerald-300 bg-emerald-50/70 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5 text-emerald-700" />
              Edit Answers / Re-Check Grants
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowWhyAsking((prev) => !prev)}
            className="h-8 border-slate-200 text-xs text-slate-700"
          >
            <HelpCircle className="mr-1 h-3.5 w-3.5 text-indigo-600" />
            Why We Ask This
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowExample((prev) => !prev)}
            className="h-8 border-slate-200 text-xs text-slate-700"
          >
            <Lightbulb className="mr-1 h-3.5 w-3.5 text-amber-500" />
            Show Example
          </Button>
          {!isAllExpanded && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onCollapseStep();
              }}
              className="h-8 shrink-0 text-xs text-slate-500 hover:text-slate-900"
            >
              <span>Collapse Step</span>
              <ChevronUp className="ml-1 h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Micro-Coaching: Why Are We Asking This? & Show Example */}
      {(showWhyAsking || showExample) && (
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {showWhyAsking && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 text-xs text-slate-700">
              <div className="font-bold text-indigo-950">
                🎯 Why Are We Asking These 4 Micro-Questions?
              </div>
              <p className="mt-1 leading-relaxed">
                {isIreland
                  ? 'Irish state agencies (LEO, Enterprise Ireland, and Revenue) enforce strict eligibility gates: LEO Priming/Feasibility require export or manufacturing non-displacement, BMW regional counties get a 60% grant rate instead of 50%, and Revenue SURE refunds up to 41% of your past 6 years of PAYE income tax when you incorporate an LTD.'
                  : 'UK funding bodies split sharply by stage and activity: British Business Bank Start Up Loans (£25k/founder) work pre-incorporation for almost any sector, HMRC SEIS requires a UK Ltd company < 3 years old, and Innovate UK Smart Grants require high-risk R&D plus 30% match funding.'}
              </p>
            </div>
          )}
          {showExample && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 text-xs text-slate-700">
              <div className="font-bold text-amber-950">
                💡 Example Founder Grant Stack ({isIreland ? 'Ireland' : 'UK'})
              </div>
              <p className="mt-1 leading-relaxed">
                {isIreland
                  ? 'Example: A solo SaaS founder leaving a PAYE job starts with New Frontiers Phase 2 (€15,000 tax-free stipend) + a LEO Feasibility Study Grant (€15,000 at 50%–60% match). Upon incorporating their Irish LTD, they claim a €12,000 Revenue SURE PAYE tax refund and unlock the LEO Priming Grant (€50k–€150k).'
                  : 'Example: A UK two-founder B2B software team claims £50,000 (£25k each) via British Business Bank Start Up Loans for Day-1 runway, claims a £5,000 regional Growth Hub digital voucher, and secures HMRC SEIS Advance Assurance to raise £150,000 from UK angels with 50% tax relief.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* STAGE 1: LAUNCHPAD CARD (BEFORE CHECKING GRANTS)                  */}
      {/* ================================================================= */}
      {!isGrantsRevealed ? (
        <div className="mt-5 overflow-hidden rounded-2xl border border-emerald-300/80 bg-gradient-to-br from-slate-900 via-indigo-950 to-emerald-950 p-6 text-white shadow-sm sm:p-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-300 ring-1 ring-emerald-400/30">
              <Award className="h-4 w-4" />
              {countryFlag} {isIreland ? 'Ireland' : 'UK'} Grant &amp; Funding Eligibility Scanner
            </div>

            <h3 className="mt-3 text-xl font-extrabold text-white sm:text-2xl">
              See What Grants, Vouchers &amp; Tax Reliefs{' '}
              <span className="text-emerald-300">{planTitle}</span> Qualifies For
            </h3>

            <p className="mx-auto mt-2 max-w-2xl text-xs leading-relaxed text-slate-300 sm:text-sm">
              We already captured your core startup signals from Steps 1–5. Answer{' '}
              <strong className="text-white">4 quick micro-questions</strong> in a 30-second pop-out check to calculate your exact grant pool value, see which schemes you qualify for today, and auto-generate your AI grant positioning strategy.
            </p>

            {/* Auto-Pulled Signals Pill Strip */}
            <div className="mt-5 grid grid-cols-2 gap-2.5 text-left sm:grid-cols-4">
              <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-2.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  1. Jurisdiction
                </div>
                <div className="mt-0.5 truncate text-xs font-bold text-white">
                  {countryFlag} {isIreland ? 'Ireland (EUR €)' : 'United Kingdom (GBP £)'}
                </div>
              </div>

              <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-2.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  2. Sector Profile
                </div>
                <div className="mt-0.5 truncate text-xs font-bold text-white">
                  {industryCategory}
                </div>
              </div>

              <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-2.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  3. Market Scope
                </div>
                <div className="mt-0.5 truncate text-xs font-bold text-white">
                  {exportPotential === 'EXPORTING_INTERNATIONALLY'
                    ? '🌍 Export / International'
                    : '🏠 Domestic Focus'}
                </div>
              </div>

              <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-2.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  4. Starting Runway
                </div>
                <div className="mt-0.5 truncate text-xs font-bold text-white">
                  {teamAndBudget.startingBudgetBracket.replace(/_/g, ' ')}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                type="button"
                size="lg"
                onClick={() => handleOpenWizardModal(1)}
                className="w-full bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 shadow-md hover:bg-emerald-400 sm:w-auto"
              >
                <Search className="mr-2 h-4 w-4" />
                Check What Grants I Qualify For
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={onContinueToBrief}
                className="w-full border-white/25 bg-white/10 px-4 py-3 text-xs font-semibold text-white hover:bg-white/20 sm:w-auto"
              >
                Continue to Step 8: 1-Page Brief
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>

            <p className="mt-3 text-[11px] text-slate-400">
              Takes ~30 seconds • Evaluates{' '}
              {isIreland
                ? 'LEO Feasibility, Priming, Digital Vouchers, EI New Frontiers, PSSF, Revenue SURE & R&D Tax Credits'
                : 'British Business Bank Start Up Loans, Regional Growth Hubs, HMRC SEIS/EIS & Innovate UK Smart Grants'}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* ================================================================= */}
          {/* STAGE 3: REVEALED GRANT VALUE POOL & ELIGIBILITY DASHBOARD        */}
          {/* ================================================================= */}
          <div className="mt-5 overflow-hidden rounded-2xl border border-emerald-300/80 bg-gradient-to-br from-slate-900 via-indigo-950 to-emerald-950 p-5 text-white shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-300 ring-1 ring-emerald-400/30">
                  <Award className="h-3.5 w-3.5" />
                  Live {isIreland ? 'Ireland' : 'UK'} Grant &amp; Funding Pool Estimate
                </div>
                <h3 className="mt-2.5 text-lg font-bold text-white sm:text-xl">
                  You qualify for{' '}
                  <span className="text-emerald-300">
                    {evaluation.qualifiesNowGrants.length} immediate schemes
                  </span>{' '}
                  worth up to{' '}
                  <span className="underline decoration-emerald-400/70 decoration-2 underline-offset-4">
                    {evaluation.immediateQualifiedPoolFormatted}
                  </span>
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-300">
                  Plus up to{' '}
                  <strong className="text-amber-300">
                    {evaluation.unlockableScalePoolFormatted}
                  </strong>{' '}
                  across{' '}
                  <strong>
                    {evaluation.unlockableNextGrants.length} Phase 2 scale schemes
                  </strong>{' '}
                  as soon as you complete their next unlock milestone (such as incorporating your Limited company or proving export demand).
                </p>
              </div>

              <div className="grid w-full grid-cols-1 gap-2.5 sm:w-auto sm:grid-cols-3">
                <div className="rounded-xl border border-emerald-400/30 bg-emerald-950/60 px-3.5 py-2.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                    🟢 Qualifies Now Pool
                  </div>
                  <div className="mt-1 text-base font-extrabold text-white sm:text-lg">
                    {evaluation.immediateQualifiedPoolFormatted}
                  </div>
                  <div className="text-[11px] text-emerald-200/80">
                    {evaluation.qualifiesNowGrants.length} schemes ready now
                  </div>
                </div>

                <div className="rounded-xl border border-amber-400/30 bg-amber-950/40 px-3.5 py-2.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                    🟡 Unlockable Next
                  </div>
                  <div className="mt-1 text-base font-extrabold text-white sm:text-lg">
                    {evaluation.unlockableScalePoolFormatted}
                  </div>
                  <div className="text-[11px] text-amber-200/80">
                    {evaluation.unlockableNextGrants.length} Phase 2 scale schemes
                  </div>
                </div>

                <div className="rounded-xl border border-indigo-400/30 bg-indigo-950/60 px-3.5 py-2.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                    🚀 Combined Potential
                  </div>
                  <div className="mt-1 text-base font-extrabold text-white sm:text-lg">
                    {evaluation.totalCombinedPotentialFormatted}
                  </div>
                  <div className="text-[11px] text-indigo-200/80">
                    Total {evaluation.currency} support ceiling
                  </div>
                </div>
              </div>
            </div>

            {/* Starting Budget & Reimbursement Reality Bar */}
            <div className="mt-4 rounded-xl border border-white/15 bg-white/10 p-3 text-xs text-slate-100">
              <span className="font-bold text-amber-300">
                💰 Co-Funding &amp; Reimbursement Reality Check (Synced with Step 4):{' '}
              </span>
              {evaluation.budgetCashflowRealityWarning}
            </div>
          </div>

          {/* ================================================================= */}
          {/* COMPACT SUMMARY OF SAVED MICRO-QUESTION ANSWERS + RE-OPEN MODAL   */}
          {/* ================================================================= */}
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-950">
                  Your 4 Eligibility Answers (Click Any Pill to Update in Pop-Out)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Want to test how incorporating an LTD or changing region affects your grant pool? Click any answer below.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleOpenWizardModal(1)}
                className="h-8 border-indigo-200 bg-white text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
              >
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Retake 4-Question Check
              </Button>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <button
                type="button"
                onClick={() => handleOpenWizardModal(1)}
                className="rounded-xl border border-slate-200 bg-white p-2.5 text-left transition-all hover:border-indigo-300 hover:shadow-2xs"
              >
                <div className="text-[10px] font-bold uppercase text-slate-400">
                  1. Legal Entity Stage
                </div>
                <div className="mt-0.5 truncate text-xs font-semibold text-slate-800">
                  {grantCheck.legalEntityStage === 'OTHER' &&
                  grantCheck.otherLegalEntityText
                    ? `Other: ${grantCheck.otherLegalEntityText}`
                    : GRANT_LEGAL_ENTITY_LABELS[grantCheck.legalEntityStage]}
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleOpenWizardModal(2)}
                className="rounded-xl border border-slate-200 bg-white p-2.5 text-left transition-all hover:border-indigo-300 hover:shadow-2xs"
              >
                <div className="text-[10px] font-bold uppercase text-slate-400">
                  2. Commercial Activity
                </div>
                <div className="mt-0.5 truncate text-xs font-semibold text-slate-800">
                  {grantCheck.commercialActivityType === 'OTHER' &&
                  grantCheck.otherCommercialActivityText
                    ? `Other: ${grantCheck.otherCommercialActivityText}`
                    : GRANT_ACTIVITY_TYPE_LABELS[
                        grantCheck.commercialActivityType
                      ]}
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleOpenWizardModal(3)}
                className="rounded-xl border border-slate-200 bg-white p-2.5 text-left transition-all hover:border-indigo-300 hover:shadow-2xs"
              >
                <div className="text-[10px] font-bold uppercase text-slate-400">
                  3. Tax &amp; PAYE History
                </div>
                <div className="mt-0.5 truncate text-xs font-semibold text-slate-800">
                  {grantCheck.founderPayeStatus === 'OTHER' &&
                  grantCheck.otherFounderPayeText
                    ? `Other: ${grantCheck.otherFounderPayeText}`
                    : GRANT_PAYE_STATUS_LABELS[grantCheck.founderPayeStatus]}
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleOpenWizardModal(4)}
                className="rounded-xl border border-slate-200 bg-white p-2.5 text-left transition-all hover:border-indigo-300 hover:shadow-2xs"
              >
                <div className="text-[10px] font-bold uppercase text-slate-400">
                  4. Regional Match Tier
                </div>
                <div className="mt-0.5 truncate text-xs font-semibold text-slate-800">
                  {grantCheck.regionalLocationTier === 'OTHER' &&
                  grantCheck.otherRegionalLocationText
                    ? `Other: ${grantCheck.otherRegionalLocationText}`
                    : GRANT_REGIONAL_TIER_LABELS[
                        grantCheck.regionalLocationTier
                      ]}
                </div>
              </button>
            </div>
          </div>

          {/* ================================================================= */}
          {/* BUCKET 1: QUALIFIES NOW (IMMEDIATE GRANTS & FUNDING)               */}
          {/* ================================================================= */}
          <div className="mt-6 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
                  ✓
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  Qualifies Now — Actionable Immediately ({evaluation.qualifiesNowGrants.length})
                </h3>
              </div>
              <span className="text-xs font-semibold text-emerald-700">
                Immediate Pool: Up to {evaluation.immediateQualifiedPoolFormatted}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {evaluation.qualifiesNowGrants.map((grant) => (
                <GrantMatchCard key={grant.slug} grant={grant} />
              ))}
            </div>
          </div>

          {/* ================================================================= */}
          {/* BUCKET 2: UNLOCKABLE NEXT (PHASE 2 SCALE & INCORPORATION)          */}
          {/* ================================================================= */}
          {evaluation.unlockableNextGrants.length > 0 && (
            <div className="mt-6 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">
                    ↗
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">
                    Unlockable Next — 1 Milestone Away ({evaluation.unlockableNextGrants.length})
                  </h3>
                </div>
                <span className="text-xs font-semibold text-amber-700">
                  Phase 2 Scale Pool: Up to {evaluation.unlockableScalePoolFormatted}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {evaluation.unlockableNextGrants.map((grant) => (
                  <GrantMatchCard key={grant.slug} grant={grant} />
                ))}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* BUCKET 3: CURRENTLY FILTERED OUT (TRANSPARENT REASONS)             */}
          {/* ================================================================= */}
          {evaluation.notEligibleGrants.length > 0 && (
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <button
                type="button"
                onClick={() => setShowNotEligible((prev) => !prev)}
                className="flex w-full items-center justify-between text-left text-xs font-bold text-slate-700"
              >
                <span>
                  🔍 Why {evaluation.notEligibleGrants.length} other {isIreland ? 'Irish' : 'UK'}{' '}
                  {evaluation.notEligibleGrants.length === 1 ? 'scheme is' : 'schemes are'} currently filtered out (Click to view rules &amp; alternatives)
                </span>
                {showNotEligible ? (
                  <ChevronUp className="h-4 w-4 text-slate-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                )}
              </button>

              {showNotEligible && (
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  {evaluation.notEligibleGrants.map((grant) => (
                    <div
                      key={grant.slug}
                      className="rounded-xl border border-rose-200/80 bg-white p-3.5 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900">
                          {grant.grantName}
                        </span>
                        <Badge
                          variant="outline"
                          className="border-rose-200 bg-rose-50 text-[10px] text-rose-800"
                        >
                          Filtered Out
                        </Badge>
                      </div>
                      <p className="mt-1.5 text-slate-600">{grant.whyYouMatchOrMiss}</p>
                      <div className="mt-2 rounded-lg bg-amber-50/70 p-2 text-[11px] text-amber-950">
                        <strong>Alternative Path:</strong>{' '}
                        {grant.reimbursementAndTrapWarning}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* AI GRANT POSITIONING ADVISOR & STRATEGY NOTES                      */}
          {/* ================================================================= */}
          <div className="mt-6 rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50/70 via-white to-emerald-50/50 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Tailored Grant Positioning Strategy for {planTitle}
                  </h3>
                  {isRunningAiAdvisor ? (
                    <Badge
                      variant="outline"
                      className="border-indigo-300 bg-indigo-50 text-[10px] text-indigo-700"
                    >
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      AI Tailoring Your Grant Pitch...
                    </Badge>
                  ) : (
                    grantCheck.aiEngineUsed && (
                      <Badge
                        variant="outline"
                        className="text-[10px] text-indigo-700"
                      >
                        {grantCheck.aiEngineUsed === 'gemini-2.5-flash'
                          ? '✨ Gemini 2.5 Flash'
                          : '⚡ Smart Rules Engine'}
                      </Badge>
                    )
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-600">
                  How to frame your specific idea so{' '}
                  {isIreland
                    ? 'LEO & Enterprise Ireland'
                    : 'Start Up Loans, Growth Hub & Innovate UK'}{' '}
                  evaluators say yes.
                </p>
              </div>

              {!isVaultReadonly && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isRunningAiAdvisor}
                  onClick={() => onRunAiGrantPositioning(grantCheck)}
                  className="border-indigo-300 bg-white text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                >
                  {isRunningAiAdvisor ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Analyzing Idea Against Grant Rules...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
                      Refresh AI Grant Pitch &amp; Sync Canvas
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2.5 md:grid-cols-3">
              {displayedPositioningTips.map((tip, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-indigo-100 bg-white p-3 text-xs leading-relaxed text-slate-700 shadow-2xs"
                >
                  {tip}
                </div>
              ))}
            </div>

            {/* Optional Founder Grant Notes */}
            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-800">
                Your Grant &amp; Funding Notes (Optional — Saved to your 1-Page Brief)
              </label>
              <textarea
                rows={2}
                disabled={isVaultReadonly}
                value={grantCheck.customGrantNotes || ''}
                onChange={(e) =>
                  onChangeGrantCheck({
                    ...grantCheck,
                    customGrantNotes: e.target.value,
                  })
                }
                placeholder={
                  isIreland
                    ? 'e.g., Book initial mentor call with local LEO office; check New Frontiers Phase 1 intake dates at TU Dublin / ATU / MTU...'
                    : 'e.g., Prepare Personal Survival Budget for £25k Start Up Loan; apply for HMRC SEIS Advance Assurance after incorporating Ltd...'
                }
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base text-slate-900 shadow-2xs focus:border-indigo-600 focus:outline-none sm:text-xs"
              />
            </div>
          </div>

          {/* ================================================================= */}
          {/* BOTTOM ACTION BAR: SAVE, PARK QUESTION, OR CONTINUE TO MODULE B/J  */}
          {/* ================================================================= */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const topGrantName =
                    evaluation.qualifiesNowGrants[0]?.grantName ||
                    'startup grant';
                  onParkOpenQuestion(
                    `Verify exact match-funding and pre-approval timeline for ${topGrantName} (${evaluation.immediateQualifiedPoolFormatted} pool) before incurring supplier costs.`
                  );
                  setParkedConfirm(true);
                  setTimeout(() => setParkedConfirm(false), 3000);
                }}
                className="text-xs"
              >
                {parkedConfirm ? (
                  <>
                    <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                    Parked in Open Questions!
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
                    Park Grant Timing Question
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onOpenModuleJGrantsHub}
                className="border-emerald-200 bg-emerald-50/60 text-xs font-medium text-emerald-800 hover:bg-emerald-100/70"
              >
                <TrendingUp className="mr-1.5 h-3.5 w-3.5 text-emerald-700" />
                Explore Full Module J Grants Hub
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {!isVaultReadonly && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isSaving}
                  onClick={() => onSaveGrantCheck(grantCheck)}
                  className="border-indigo-200 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-1.5 h-3.5 w-3.5" />
                      Save Grant Check
                    </>
                  )}
                </Button>
              )}

              <Button
                type="button"
                size="sm"
                onClick={onContinueToBrief}
                className="bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                View Startup Overview &amp; Summary Brief
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* ================================================================= */}
      {/* STAGE 2: POP-OUT 1-BY-1 MINI-WIZARD MODAL (QUESTIONS 1 TO 4)      */}
      {/* ================================================================= */}
      {isWizardModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-xs sm:p-6"
          onClick={() => setIsWizardModalOpen(false)}
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Header */}
            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-900 via-indigo-950 to-emerald-950 px-5 py-4 text-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                    {countryFlag} Step {wizardStep} of 4 • High-Accuracy Grant Check
                  </div>
                  <h3 className="mt-1.5 text-base font-bold text-white sm:text-lg">
                    {countryFlag} {isIreland ? 'Ireland' : 'UK'} Grant &amp; Funding Eligibility Check
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsWizardModalOpen(false)}
                  className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Close modal"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* 4-Step Clickable Progress Bar */}
              <div className="mt-4 grid grid-cols-4 gap-2">
                {[
                  { num: 1 as const, label: '1. Legal Stage', icon: Building2 },
                  { num: 2 as const, label: '2. Activity Type', icon: Briefcase },
                  { num: 3 as const, label: '3. Tax / PAYE', icon: UserCheck },
                  { num: 4 as const, label: '4. Region Tier', icon: MapPin },
                ].map((item) => {
                  const active = wizardStep === item.num;
                  const completed = wizardStep > item.num;
                  return (
                    <button
                      key={item.num}
                      type="button"
                      onClick={() => setWizardStep(item.num)}
                      className={`flex flex-col rounded-xl border px-2.5 py-1.5 text-left transition-all ${
                        active
                          ? 'border-emerald-400 bg-white/15 text-white shadow-2xs'
                          : completed
                            ? 'border-emerald-500/40 bg-emerald-950/50 text-emerald-200'
                            : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="truncate">{item.label}</span>
                        {completed && (
                          <Check className="h-3 w-3 shrink-0 text-emerald-400" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Scrollable Question Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              {/* QUESTION 1: LEGAL ENTITY STAGE */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                      Question 1 of 4 • Legal &amp; Incorporation Stage
                    </span>
                    <h4 className="mt-1 text-base font-bold text-slate-900">
                      What is your current Legal Entity &amp; Trading Stage?
                    </h4>
                    <p className="mt-1 text-xs text-slate-600">
                      {isIreland
                        ? 'Why this matters: LEO Feasibility, New Frontiers, and Microfinance Ireland work pre-incorporation or for sole traders, while LEO Priming, EI PSSF, and Revenue SURE require an incorporated Limited (LTD) company.'
                        : 'Why this matters: British Business Bank Start Up Loans (£25k/founder) work pre-incorporation or for sole traders, whereas HMRC SEIS/EIS and Innovate UK Smart Grants require a registered UK Limited company.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {(
                      [
                        'PRE_INCORPORATION',
                        'SOLE_TRADER',
                        'LTD_UNDER_18M',
                        'LTD_OVER_18M',
                        'OTHER',
                      ] as GrantLegalEntityStage[]
                    ).map((stage) => {
                      const selected = draftCheck.legalEntityStage === stage;
                      return (
                        <button
                          key={stage}
                          type="button"
                          disabled={isVaultReadonly}
                          onClick={() =>
                            setDraftCheck((prev) => ({
                              ...prev,
                              legalEntityStage: stage,
                            }))
                          }
                          className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-xs font-medium transition-all ${
                            selected
                              ? 'border-indigo-600 bg-indigo-50/90 text-indigo-950 shadow-2xs ring-1 ring-indigo-600'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-slate-50'
                          }`}
                        >
                          <span>{GRANT_LEGAL_ENTITY_LABELS[stage]}</span>
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                              selected
                                ? 'border-indigo-600 bg-indigo-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {selected && <Check className="h-3 w-3" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {draftCheck.legalEntityStage === 'OTHER' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-800">
                        Describe your legal entity setup:
                      </label>
                      <input
                        type="text"
                        disabled={isVaultReadonly}
                        value={draftCheck.otherLegalEntityText || ''}
                        onChange={(e) =>
                          setDraftCheck((prev) => ({
                            ...prev,
                            otherLegalEntityText: e.target.value,
                          }))
                        }
                        placeholder="e.g., DAC, CLG, UK LLP, University Spin-Out..."
                        className="mt-1.5 w-full rounded-xl border border-indigo-300 bg-white px-3 py-2.5 text-base text-slate-900 shadow-2xs focus:border-indigo-600 focus:outline-none sm:text-xs"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* QUESTION 2: PRIMARY COMMERCIAL ACTIVITY */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                      Question 2 of 4 • Commercial Activity &amp; Non-Displacement Test
                    </span>
                    <h4 className="mt-1 text-base font-bold text-slate-900">
                      Which best describes your primary commercial activity?
                    </h4>
                    <p className="mt-1 text-xs text-slate-600">
                      {isIreland
                        ? 'Why this matters: LEO Priming & Feasibility grants strictly exclude purely local retail, hospitality, or domestic services that displace existing local businesses — but local businesses STILL qualify for LEO Digital Vouchers (€7.7k) and Microfinance Ireland (€25k).'
                        : 'Why this matters: Innovate UK Smart Grants require high-risk R&D innovation, while HMRC SEIS excludes financial/property trades, and Start Up Loans support almost all commercial activities.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {(
                      [
                        'EXPORT_SOFTWARE_DIGITAL',
                        'PHYSICAL_MANUFACTURING_FOOD',
                        'DEEPTECH_AI_RD',
                        'LOCAL_DOMESTIC_SERVICE_RETAIL',
                        'OTHER',
                      ] as GrantCommercialActivityType[]
                    ).map((act) => {
                      const selected = draftCheck.commercialActivityType === act;
                      return (
                        <button
                          key={act}
                          type="button"
                          disabled={isVaultReadonly}
                          onClick={() =>
                            setDraftCheck((prev) => ({
                              ...prev,
                              commercialActivityType: act,
                            }))
                          }
                          className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-xs font-medium transition-all ${
                            selected
                              ? 'border-indigo-600 bg-indigo-50/90 text-indigo-950 shadow-2xs ring-1 ring-indigo-600'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-slate-50'
                          }`}
                        >
                          <span>{GRANT_ACTIVITY_TYPE_LABELS[act]}</span>
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                              selected
                                ? 'border-indigo-600 bg-indigo-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {selected && <Check className="h-3 w-3" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {draftCheck.commercialActivityType === 'OTHER' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-800">
                        Describe your commercial activity &amp; revenue model:
                      </label>
                      <input
                        type="text"
                        disabled={isVaultReadonly}
                        value={draftCheck.otherCommercialActivityText || ''}
                        onChange={(e) =>
                          setDraftCheck((prev) => ({
                            ...prev,
                            otherCommercialActivityText: e.target.value,
                          }))
                        }
                        placeholder="Describe what you sell and who buys it..."
                        className="mt-1.5 w-full rounded-xl border border-indigo-300 bg-white px-3 py-2.5 text-base text-slate-900 shadow-2xs focus:border-indigo-600 focus:outline-none sm:text-xs"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* QUESTION 3: FOUNDER EMPLOYMENT & PAYE TAX HISTORY */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                      Question 3 of 4 • Founder Employment &amp; Tax Background
                    </span>
                    <h4 className="mt-1 text-base font-bold text-slate-900">
                      What is your Employment &amp; Tax History?
                    </h4>
                    <p className="mt-1 text-xs text-slate-600">
                      {isIreland
                        ? 'Why this matters: If you paid PAYE income tax in Ireland in any of the last 6 years and invest cash into your new LTD, Revenue SURE can refund up to 41% of your capital back as a personal tax rebate. Full-time commitment also unlocks the €15,000 New Frontiers stipend.'
                        : 'Why this matters: Full-time founder commitment strengthens Innovate UK and SEIS readiness, while Start Up Loans support both full-time and part-time founders.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {(
                      [
                        'PAYE_LAST_6_YRS_GOING_FULLTIME',
                        'PAYE_LAST_6_YRS_PARTTIME',
                        'SELF_EMPLOYED_OR_OUTSIDE_PAYE_FULLTIME',
                        'SELF_EMPLOYED_OR_OUTSIDE_PAYE_PARTTIME',
                        'OTHER',
                      ] as GrantFounderPayeStatus[]
                    ).map((status) => {
                      const selected = draftCheck.founderPayeStatus === status;
                      return (
                        <button
                          key={status}
                          type="button"
                          disabled={isVaultReadonly}
                          onClick={() =>
                            setDraftCheck((prev) => ({
                              ...prev,
                              founderPayeStatus: status,
                            }))
                          }
                          className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-xs font-medium transition-all ${
                            selected
                              ? 'border-indigo-600 bg-indigo-50/90 text-indigo-950 shadow-2xs ring-1 ring-indigo-600'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-slate-50'
                          }`}
                        >
                          <span>{GRANT_PAYE_STATUS_LABELS[status]}</span>
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                              selected
                                ? 'border-indigo-600 bg-indigo-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {selected && <Check className="h-3 w-3" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {draftCheck.founderPayeStatus === 'OTHER' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-800">
                        Describe your employment / tax background:
                      </label>
                      <input
                        type="text"
                        disabled={isVaultReadonly}
                        value={draftCheck.otherFounderPayeText || ''}
                        onChange={(e) =>
                          setDraftCheck((prev) => ({
                            ...prev,
                            otherFounderPayeText: e.target.value,
                          }))
                        }
                        placeholder="Describe your employment situation..."
                        className="mt-1.5 w-full rounded-xl border border-indigo-300 bg-white px-3 py-2.5 text-base text-slate-900 shadow-2xs focus:border-indigo-600 focus:outline-none sm:text-xs"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* QUESTION 4: REGIONAL LOCATION & MATCH TIER */}
              {wizardStep === 4 && (
                <div className="space-y-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                      Question 4 of 4 • Regional Co-Funding &amp; Agency Tier
                    </span>
                    <h4 className="mt-1 text-base font-bold text-slate-900">
                      {isIreland
                        ? 'Which Irish Regional Grant Match Tier applies to you?'
                        : 'Which UK Nation / Regional Growth Hub applies to you?'}
                    </h4>
                    <p className="mt-1 text-xs text-slate-600">
                      {isIreland
                        ? 'Why this matters: LEO Feasibility grants reimburse 50% in Dublin/East/South-West, 60% in Border/Midlands/West (BMW) counties, and Údarás na Gaeltachta offers dedicated Gaeltacht supports.'
                        : 'Why this matters: Alongside UK-wide schemes (Start Up Loans, Innovate UK, SEIS), Scottish Enterprise, Business Wales, Invest NI, and English Growth Hubs offer regional capital/digital grants.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {regionalOptions.map((tier) => {
                      const selected = draftCheck.regionalLocationTier === tier;
                      return (
                        <button
                          key={tier}
                          type="button"
                          disabled={isVaultReadonly}
                          onClick={() =>
                            setDraftCheck((prev) => ({
                              ...prev,
                              regionalLocationTier: tier,
                            }))
                          }
                          className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-xs font-medium transition-all ${
                            selected
                              ? 'border-indigo-600 bg-indigo-50/90 text-indigo-950 shadow-2xs ring-1 ring-indigo-600'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-slate-50'
                          }`}
                        >
                          <span>{GRANT_REGIONAL_TIER_LABELS[tier]}</span>
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                              selected
                                ? 'border-indigo-600 bg-indigo-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {selected && <Check className="h-3 w-3" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {draftCheck.regionalLocationTier === 'OTHER' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-800">
                        Enter your county, city, or local enterprise area:
                      </label>
                      <input
                        type="text"
                        disabled={isVaultReadonly}
                        value={draftCheck.otherRegionalLocationText || ''}
                        onChange={(e) =>
                          setDraftCheck((prev) => ({
                            ...prev,
                            otherRegionalLocationText: e.target.value,
                          }))
                        }
                        placeholder="e.g., Galway, Cork, Manchester, Belfast..."
                        className="mt-1.5 w-full rounded-xl border border-indigo-300 bg-white px-3 py-2.5 text-base text-slate-900 shadow-2xs focus:border-indigo-600 focus:outline-none sm:text-xs"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3.5">
              <div>
                {wizardStep > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setWizardStep(
                        (prev) => Math.max(1, prev - 1) as 1 | 2 | 3 | 4
                      )
                    }
                    className="text-xs"
                  >
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                    Previous Question
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsWizardModalOpen(false)}
                    className="text-xs text-slate-500"
                  >
                    Cancel
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {wizardStep < 4 ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      setWizardStep(
                        (prev) => Math.min(4, prev + 1) as 1 | 2 | 3 | 4
                      )
                    }
                    className="bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-700"
                  >
                    Next Question ({wizardStep + 1} of 4)
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveWizardAndRevealGrants}
                    className="bg-emerald-600 px-4 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
                  >
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    Save Answers &amp; Show My Grants
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GrantMatchCard({ grant }: { grant: EvaluatedGrantMatch }) {
  const isNow = grant.matchTier === 'QUALIFIES_NOW';

  return (
    <div
      className={`flex flex-col justify-between rounded-2xl border p-4 shadow-2xs transition-all ${
        isNow
          ? 'border-emerald-200 bg-gradient-to-b from-emerald-50/40 to-white'
          : 'border-amber-200 bg-gradient-to-b from-amber-50/40 to-white'
      }`}
    >
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
              isNow
                ? 'bg-emerald-100 text-emerald-900'
                : 'bg-amber-100 text-amber-900'
            }`}
          >
            {isNow ? '🟢 Qualifies Now' : '🟡 Unlockable Next'} •{' '}
            {grant.matchScorePercent}% Fit
          </span>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
            {grant.fundingTypeBadge}
          </span>
        </div>

        <div className="mt-2.5 flex items-start justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              {grant.grantName}
            </h4>
            <div className="text-[11px] font-medium text-slate-500">
              {grant.providerAgency}
            </div>
          </div>
        </div>

        {/* Potential Value Callout */}
        <div
          className={`mt-2.5 rounded-xl border px-3 py-2 ${
            isNow
              ? 'border-emerald-200/80 bg-emerald-50/70 text-emerald-950'
              : 'border-amber-200/80 bg-amber-50/70 text-amber-950'
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider opacity-75">
            Potential Grant / Support Value
          </div>
          <div className="text-xs font-extrabold sm:text-sm">
            {grant.potentialValueFormatted}
          </div>
          <div className="mt-0.5 text-[11px] opacity-90">
            {grant.coFundingOrMatchRequirement}
          </div>
        </div>

        <p className="mt-2.5 text-xs leading-relaxed text-slate-700">
          <strong className="text-slate-900">Why you match: </strong>
          {grant.whyYouMatchOrMiss}
        </p>

        {grant.unlockRequirement && (
          <div className="mt-2 rounded-xl border border-amber-300/80 bg-amber-50/90 p-2.5 text-xs text-amber-950">
            <strong>🔑 Milestone to Unlock: </strong>
            {grant.unlockRequirement}
          </div>
        )}

        <div className="mt-2.5 rounded-xl border border-slate-200/80 bg-slate-50 p-2.5 text-[11px] text-slate-600">
          <span className="font-bold text-slate-800">
            ⚠️ Reimbursement &amp; Rule Watch-Out:{' '}
          </span>
          {grant.reimbursementAndTrapWarning}
        </div>
      </div>

      <div className="mt-3 border-t border-slate-100 pt-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">
              Built in:
            </span>
            {grant.preflightModulesToWin.map((mod) => (
              <span
                key={mod}
                className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-800"
              >
                {mod}
              </span>
            ))}
          </div>
          <a
            href={grant.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
          >
            Official Guide
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
