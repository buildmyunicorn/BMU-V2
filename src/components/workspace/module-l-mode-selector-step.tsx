'use client';

import React, { useState, useMemo } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Lightbulb,
  Sparkles,
  ArrowRight,
  Save,
  Landmark,
  FileText,
  ShieldCheck,
  Scale,
  BookOpen,
  Building2,
  Loader2,
  BookmarkPlus,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPlanCurrency } from '@/lib/localization';
import type {
  ActiveStartupPlan,
  ModuleLCompilerModeType,
  ModuleLNarrativeToneType,
  ModuleLSubmissionObjectiveType,
  ModuleLSubmissionWindowType,
  ModuleLStep1ModeSavedData,
} from '@/lib/auth/session-store';
import {
  generateModuleLStep1MandateAction,
  parkModuleLOpenQuestionAction,
} from '@/app/actions/module-l';

export interface CompilerModeCatalogItem {
  mode: ModuleLCompilerModeType;
  badge: string;
  countryTag: 'IE' | 'GB' | 'IE_GB' | 'GLOBAL';
  title: string;
  defaultAgencyName: string;
  defaultTone: ModuleLNarrativeToneType;
  defaultObjective: ModuleLSubmissionObjectiveType;
  sectionStructureLabel: string;
  wordLimitDisciplineLabel: string;
  passThresholdLabel: string;
  rubricWeightsSummary: string;
  description: string;
  keySectionsPreview: string[];
  underwriterFootNote: string;
}

export const MODULE_L_COMPILER_MODES: CompilerModeCatalogItem[] = [
  {
    mode: 'IE_LEO_OFFICIAL_FORM',
    badge: '🇮🇪 Ireland Official Grant Form',
    countryTag: 'IE',
    title: 'IE LEO & Enterprise Ireland Official Application Mode',
    defaultAgencyName: 'Local Enterprise Office (LEO) / Enterprise Ireland EVAC',
    defaultTone: 'EVIDENCE_LED_ASSESSOR',
    defaultObjective: 'NON_DILUTIVE_CAPITAL_GRANT',
    sectionStructureLabel: '7 Official Sections + Appendices A–F',
    wordLimitDisciplineLabel: '2,800w Structured Form',
    passThresholdLabel: '70%+ EVAC Score',
    rubricWeightsSummary: 'Export & Viability 30% • Promoter 25% • Jobs 25% • Non-Displacement 20%',
    description:
      'Formats your workspace data into the official Irish Local Enterprise Office (Feasibility, Priming, Business Expansion) & Enterprise Ireland PSSF structure, complete with Export & Non-Displacement defense and mandatory Appendices A–F.',
    keySectionsPreview: [
      '1. Promoter Background & Track Record (Mod A & F)',
      '2. Product/Service Innovation & Technical Merit (Mod D)',
      '3. Market Sizing, Export Potential & Non-Displacement Defense (Mod B)',
      '4. Primary Customer Validation & Mom-Test Proof (Mod C)',
      '5. Operations, 3-Quote Procurement & Risk Controls (Mod E & G)',
      '6. 3-Year Job Creation Schedule & Salary Plan (Mod F & J)',
      '7. 36-Month Financial Projections & Vouched Grant Ask (Mod H, J & K)',
    ],
    underwriterFootNote:
      'IE LEO Evaluation & Approvals Committees (EVAC) require proof of international export potential or import substitution, zero domestic displacement, and 3 independent supplier quotes for items ≥ €5,000.',
  },
  {
    mode: 'UK_INNOVATE_UK_9Q',
    badge: '🇬🇧 UK Innovate UK IFS Rubric',
    countryTag: 'GB',
    title: 'UK Innovate UK 9-Question IFS Assessment Mode',
    defaultAgencyName: 'Innovate UK (UKRI) Independent 5-Assessor Panel',
    defaultTone: 'EVIDENCE_LED_ASSESSOR',
    defaultObjective: 'NON_DILUTIVE_CAPITAL_GRANT',
    sectionStructureLabel: '9 Scored Questions + 2 PDF Appendices',
    wordLimitDisciplineLabel: '400w Strict Cap / Question',
    passThresholdLabel: '80%+ Panel Threshold',
    rubricWeightsSummary: 'Innovation 30% • Market 25% • Work Packages & Risk 25% • VFM 20%',
    description:
      'Compiles your workspace into the strict 9-Question Innovation Funding Service (IFS) application format (Smart Grants / Catalyst) with live 400-word gauges per question plus technical Work Package (WP1..n) and Risk Register appendices.',
    keySectionsPreview: [
      'Q1. Need or Challenge (Problem & Market Failure — Mod A & C)',
      'Q2. Approach & Innovation (Technical Step-Change & FTO — Mod B & D)',
      'Q3. Team & Resources (Skills, 7 Hats & Subcontractors — Mod F)',
      'Q4. Market Awareness & Route to Market (TAM/SAM/SOM — Mod B & I)',
      'Q5. Project Management & Work Packages WP1..n (Mod D & E)',
      'Q6. Risks & Mitigation Matrix (4-Category Register — Mod E)',
      'Q7–Q9. Added Value, Impact & Costs / Value for Money (Mod H, J & K)',
    ],
    underwriterFootNote:
      'Innovate UK applications are scored by 5 independent assessors. Answers exceeding 400 words are truncated in the IFS portal, and Question 9 must prove why public R&D funding is essential.',
  },
  {
    mode: 'UK_START_UP_LOANS_WORKBOOK',
    badge: '🇬🇧 UK Start Up Loans Workbook',
    countryTag: 'GB',
    title: 'UK British Business Bank Start Up Loans 4-Part Workbook',
    defaultAgencyName: 'British Business Bank Start Up Loans Delivery Partner',
    defaultTone: 'UNDERWRITER_CONSERVATIVE',
    defaultObjective: 'GOVERNMENT_LOAN_APPROVAL',
    sectionStructureLabel: '4-Part Workbook + Survival Budget',
    wordLimitDisciplineLabel: '2,200w Credit Dossier',
    passThresholdLabel: 'DSCR ≥ 1.25x & Household Surplus',
    rubricWeightsSummary: 'Survival Budget & Affordability 35% • First 10 Customers 25% • Cashflow 40%',
    description:
      'Designed specifically for British Business Bank Start Up Loan underwriters (£500–£25,000 per founder at 6% fixed). Connects your Module F Personal Survival Budget directly to your Module J 36-Month Cashflow and repayment affordability.',
    keySectionsPreview: [
      'Part 1. Business Overview, Promoter Experience & Statutory Setup (Mod A, F & G)',
      'Part 2. Customer Evidence, Pricing & First 10 Customers Playbook (Mod C, H & I)',
      'Part 3. Personal Survival Budget & Household Drawings Reconciliation (Mod F)',
      'Part 4. 36-Month Cashflow Forecast, Working Capital & Loan Repayment Cover (Mod J & K)',
    ],
    underwriterFootNote:
      'Start Up Loan underwriters assess personal affordability first: your Personal Survival Budget (Module F) must balance without forcing unsustainable Month 1–6 business drawings.',
  },
  {
    mode: 'INVESTOR_SEIS_EIS_EII_PACK',
    badge: '🇮🇪 / 🇬🇧 HMRC SEIS/EIS & Irish EII',
    countryTag: 'IE_GB',
    title: 'Investor Tax Relief & Seed Memo (HMRC SEIS/EIS & Irish EII)',
    defaultAgencyName: 'HMRC Small Company Enterprise Centre / EII & Angel Syndicate',
    defaultTone: 'VENTURE_GROWTH_THESIS',
    defaultObjective: 'TAX_RELIEF_CLEARANCE_AND_SEED',
    sectionStructureLabel: 'Statutory Clearance Pack + 10-Pt Memo',
    wordLimitDisciplineLabel: '3,000w Investor & Tax Dossier',
    passThresholdLabel: 'Risk-to-Capital & Qualifying Trade',
    rubricWeightsSummary: 'Qualifying Trade & Risk-to-Capital 30% • Wedge & TAM 25% • Unit Economics 25% • Team 20%',
    description:
      'Dual-purpose dossier for HMRC SEIS/EIS Advance Assurance (or Irish EII/SURE) and pre-seed angel syndicates. Foregrounds the statutory Risk-to-Capital defense, Qualifying Trade confirmation, Cap Table, and 3-year growth trajectory.',
    keySectionsPreview: [
      '1. Qualifying Trade Statement & Permanent Establishment (Mod A, G & K)',
      '2. Statutory Risk-to-Capital Condition Defense (Growth vs. Preservation — Mod K)',
      '3. Problem, Beachhead Persona & Verified Customer Pull (Mod B & C)',
      '4. Defensible Product Architecture & IP Ownership (Mod D & G)',
      '5. Unit Economics, Pocket Profit Crossover & Go-to-Market (Mod H & I)',
      '6. Founding Team, Cap Table & 3-Year Use of Funds (Mod F, J & K)',
    ],
    underwriterFootNote:
      'HMRC SEIS/EIS Advance Assurance requires proving that funds are raised for long-term commercial growth and job creation (Risk-to-Capital) rather than short-term subcontracted project execution.',
  },
  {
    mode: 'STANDARD_COMMERCIAL_PLAN',
    badge: '🌍 Global Commercial Standard',
    countryTag: 'GLOBAL',
    title: 'Standard Commercial Business Plan (Bank, Partner & Board)',
    defaultAgencyName: 'Commercial Bank Underwriter / Strategic Partner / Board',
    defaultTone: 'PLAIN_ENGLISH_OPERATOR',
    defaultObjective: 'BANK_OR_COMMERCIAL_PARTNERSHIP',
    sectionStructureLabel: '10-Chapter Executive Plan + Appendices',
    wordLimitDisciplineLabel: '3,500w Executive Standard',
    passThresholdLabel: 'Positive Unit Margin & Cash Buffer',
    rubricWeightsSummary: 'Business Model 30% • Unit Economics & Cashflow 30% • GTM 20% • Operations 20%',
    description:
      'Clean, authoritative 10-chapter commercial business plan stripped of government grant bureaucracy—ideal for commercial banks, enterprise vendor onboarding, commercial leases, and co-founder alignment.',
    keySectionsPreview: [
      'Ch 1–2. Executive Summary, Founder Thesis & Market Opportunity (Mod A & B)',
      'Ch 3–4. Customer Validation Proof & Product Architecture (Mod C & D)',
      'Ch 5–6. Operations Blueprint, Statutory Readiness & Team Governance (Mod E, F & G)',
      'Ch 7–8. Pricing, Breakeven Economics & Go-to-Market Execution (Mod H & I)',
      'Ch 9–10. 36-Month Financial Model, Stress Tests & Capital Strategy (Mod J & K)',
    ],
    underwriterFootNote:
      'Commercial bank managers and enterprise partners focus on gross margin durability, debtor/creditor payment timing (DSO/DPO), and operational continuity.',
  },
  {
    mode: 'OTHER',
    badge: '✨ Custom Submission Format',
    countryTag: 'GLOBAL',
    title: 'Other / Custom Accelerator, Tender or University Spin-Out Pack',
    defaultAgencyName: 'Custom Evaluation Committee / Accelerator Panel',
    defaultTone: 'EVIDENCE_LED_ASSESSOR',
    defaultObjective: 'NON_DILUTIVE_CAPITAL_GRANT',
    sectionStructureLabel: 'Custom Multi-Section Dossier + Appendices',
    wordLimitDisciplineLabel: 'Flexible Rubric Calibration',
    passThresholdLabel: 'Custom Committee Criteria',
    rubricWeightsSummary: 'Tailored to your custom evaluator mandate and sector requirements',
    description:
      'Tailor the compiler for a specific accelerator (Y Combinator, NDRC, Techstars), EU Horizon/EIC application, public procurement tender, or university commercialisation board.',
    keySectionsPreview: [
      '1. Executive Thesis & Custom Committee Mandate Alignment',
      '2. Market Opportunity, Customer Proof & Competitive Wedge',
      '3. Technical Delivery, Operations & Governance',
      '4. Financial Model, Unit Economics & Capital Ask',
    ],
    underwriterFootNote:
      'Specify your custom target committee and scoring priorities below so the AI compiler and contradiction audit calibrate to your exact format.',
  },
];

const NARRATIVE_TONE_OPTIONS: Array<{
  value: ModuleLNarrativeToneType;
  label: string;
  subtitle: string;
}> = [
  {
    value: 'EVIDENCE_LED_ASSESSOR',
    label: 'Evidence-Led Grant Assessor',
    subtitle: 'Zero hype; leads with Mom-Test metrics, export ratio, job creation & compliance',
  },
  {
    value: 'UNDERWRITER_CONSERVATIVE',
    label: 'Prudent Credit Underwriter',
    subtitle: 'Emphasizes downside protection, survival budget cover, DSO & debt affordability',
  },
  {
    value: 'VENTURE_GROWTH_THESIS',
    label: 'Venture & Angel Growth Thesis',
    subtitle: 'Highlights TAM/SAM/SOM wedge, LTV:CAC scalability, IP moat & tax-relief catalyst',
  },
  {
    value: 'PLAIN_ENGLISH_OPERATOR',
    label: 'Plain-English Commercial Operator',
    subtitle: 'Direct, jargon-free operational execution plan for banks, landlords & partners',
  },
  {
    value: 'OTHER',
    label: 'Other / Custom Tone',
    subtitle: 'Define a custom voice or institutional style',
  },
];

const SUBMISSION_OBJECTIVE_OPTIONS: Array<{
  value: ModuleLSubmissionObjectiveType;
  label: string;
  subtitle: string;
}> = [
  {
    value: 'NON_DILUTIVE_CAPITAL_GRANT',
    label: 'Unlock Non-Dilutive R&D / Priming Grant',
    subtitle: 'Prove match-funding liquidity, technical/export merit & value for public money',
  },
  {
    value: 'GOVERNMENT_LOAN_APPROVAL',
    label: 'Secure Government-Backed Start Up Loan',
    subtitle: 'Demonstrate household survival coverage & monthly debt-service safety',
  },
  {
    value: 'TAX_RELIEF_CLEARANCE_AND_SEED',
    label: 'SEIS / EIS / EII Clearance & Angel Round',
    subtitle: 'Satisfy statutory Risk-to-Capital condition & close pre-seed/seed equity',
  },
  {
    value: 'BANK_OR_COMMERCIAL_PARTNERSHIP',
    label: 'Commercial Bank, Lease or Enterprise Approval',
    subtitle: 'Prove working capital resilience, insurance & operational SLA readiness',
  },
  {
    value: 'OTHER',
    label: 'Other Submission Objective',
    subtitle: 'Specify a custom milestone or committee approval goal',
  },
];

const SUBMISSION_WINDOW_OPTIONS: Array<{
  value: ModuleLSubmissionWindowType;
  label: string;
  subtitle: string;
}> = [
  {
    value: 'IMMEDIATE_THIS_MONTH',
    label: 'Immediate Submission (This Month)',
    subtitle: 'Targeting the next evaluation committee sitting or rolling intake',
  },
  {
    value: 'NEXT_30_TO_60_DAYS',
    label: 'Next 30–60 Days',
    subtitle: 'Completing final supplier quotes / incorporation before submitting',
  },
  {
    value: 'UPCOMING_QUARTER_COHORT',
    label: 'Upcoming Quarter / Grant Call',
    subtitle: 'Preparing ahead of a scheduled competitive call or investor roadshow',
  },
  {
    value: 'INTERNAL_BOARD_ALIGNMENT',
    label: 'Internal Co-Founder & Advisor Alignment',
    subtitle: 'Locking the master operating plan before external applications',
  },
  {
    value: 'OTHER',
    label: 'Other Timeline / Window',
    subtitle: 'Specify a custom deadline or cohort intake date',
  },
];

export interface ModuleLModeSelectorStepProps {
  plan: ActiveStartupPlan;
  isOpen: boolean;
  onOpenStep: () => void;
  onToggleCollapse: () => void;
  isVaultReadonly?: boolean;
  onSaveStep1: (
    data: ModuleLStep1ModeSavedData,
    progress?: number
  ) => Promise<void> | void;
  onAdvanceToStep2: () => void;
  onJumpToCompilerStep3?: () => void;
  onParkQuestionInSession?: (questionText: string) => void;
}

export function ModuleLModeSelectorStep({
  plan,
  isOpen,
  onOpenStep,
  onToggleCollapse,
  isVaultReadonly = false,
  onSaveStep1,
  onAdvanceToStep2,
  onJumpToCompilerStep3,
  onParkQuestionInSession,
}: ModuleLModeSelectorStepProps) {
  const isUK = plan.hqCountryCode === 'GB';
  const currency = plan.baseCurrency || (isUK ? 'GBP' : 'EUR');

  // Derive intelligent default mode from Module K or HQ Country
  const syncedRecommendedMode: ModuleLCompilerModeType = useMemo(() => {
    const modKMode = plan.moduleKData?.step5FundingBrief?.moduleLGrantMode;
    if (modKMode === 'IE_LEO') return 'IE_LEO_OFFICIAL_FORM';
    if (modKMode === 'UK_INNOVATE_UK') return 'UK_INNOVATE_UK_9Q';
    if (modKMode === 'UK_START_UP_LOANS') return 'UK_START_UP_LOANS_WORKBOOK';
    if (modKMode === 'HMRC_SEIS') return 'INVESTOR_SEIS_EIS_EII_PACK';

    const selectedGrant = plan.moduleKData?.step1Audit?.selectedGrantKey;
    if (selectedGrant === 'GB_INNOVATE_UK_SMART') return 'UK_INNOVATE_UK_9Q';
    if (selectedGrant === 'GB_BBB_START_UP_LOAN') return 'UK_START_UP_LOANS_WORKBOOK';
    if (
      selectedGrant === 'GB_HMRC_SEIS_ASSURANCE' ||
      selectedGrant === 'IE_EI_EII_INVESTOR_RELIEF'
    ) {
      return 'INVESTOR_SEIS_EIS_EII_PACK';
    }
    if (plan.hqCountryCode === 'IE') return 'IE_LEO_OFFICIAL_FORM';
    if (plan.hqCountryCode === 'GB') return 'UK_INNOVATE_UK_9Q';
    return 'STANDARD_COMMERCIAL_PLAN';
  }, [plan.hqCountryCode, plan.moduleKData]);

  // Derive intelligent default ask amount from Module K or Module J
  const syncedDefaultAskAmount = useMemo(() => {
    const modKGrants = plan.moduleKData?.step2CapitalStack?.totalGrantsAllocated || 0;
    const modKLoans = plan.moduleKData?.step2CapitalStack?.totalLoansAllocated || 0;
    const modKAngel = plan.moduleKData?.step2CapitalStack?.totalAngelAllocated || 0;
    const modKTotalGap = plan.moduleKData?.step2CapitalStack?.totalTargetFundingGap || 0;
    if (modKGrants > 0) return modKGrants;
    if (modKLoans > 0) return modKLoans;
    if (modKAngel > 0) return modKAngel;
    if (modKTotalGap > 0) return modKTotalGap;
    return isUK ? 25000 : 25000;
  }, [plan.moduleKData, isUK]);

  const saved = plan.moduleLData?.step1Mode;
  const initialCatalog =
    MODULE_L_COMPILER_MODES.find(
      (m) => m.mode === (saved?.compilerMode || syncedRecommendedMode)
    ) || MODULE_L_COMPILER_MODES[0];

  const [compilerMode, setCompilerMode] = useState<ModuleLCompilerModeType>(
    saved?.compilerMode || syncedRecommendedMode
  );
  const [otherCompilerModeText, setOtherCompilerModeText] = useState<string>(
    saved?.otherCompilerModeText || ''
  );
  const [narrativeTone, setNarrativeTone] = useState<ModuleLNarrativeToneType>(
    saved?.narrativeTone || initialCatalog.defaultTone
  );
  const [otherNarrativeToneText, setOtherNarrativeToneText] = useState<string>(
    saved?.otherNarrativeToneText || ''
  );
  const [submissionObjective, setSubmissionObjective] =
    useState<ModuleLSubmissionObjectiveType>(
      saved?.submissionObjective || initialCatalog.defaultObjective
    );
  const [otherSubmissionObjectiveText, setOtherSubmissionObjectiveText] =
    useState<string>(saved?.otherSubmissionObjectiveText || '');
  const [submissionWindow, setSubmissionWindow] =
    useState<ModuleLSubmissionWindowType>(
      saved?.submissionWindow || 'IMMEDIATE_THIS_MONTH'
    );
  const [otherSubmissionWindowText, setOtherSubmissionWindowText] =
    useState<string>(saved?.otherSubmissionWindowText || '');
  const [targetAgencyOrCommitteeName, setTargetAgencyOrCommitteeName] =
    useState<string>(
      saved?.targetAgencyOrCommitteeName || initialCatalog.defaultAgencyName
    );
  const [targetFundingAskAmount, setTargetFundingAskAmount] = useState<number>(
    saved?.targetFundingAskAmount ?? syncedDefaultAskAmount
  );
  const [includeAppendicesBinder, setIncludeAppendicesBinder] =
    useState<boolean>(saved?.includeAppendicesBinder ?? true);
  const [strictWordCountEnforcement, setStrictWordCountEnforcement] =
    useState<boolean>(saved?.strictWordCountEnforcement ?? true);
  const [compilerMandateNotes, setCompilerMandateNotes] = useState<string>(
    saved?.compilerMandateNotes ||
      `Compile "${plan.title}" for ${initialCatalog.defaultAgencyName} (${formatPlanCurrency(syncedDefaultAskAmount, currency)} target ask). Anchor every section in verified customer validation from Module C, product work packages from Module D, 3-quote operational controls from Module E, and 36-month cashflow projections from Module J.`
  );
  const [aiAssessorTip, setAiAssessorTip] = useState<string>(
    saved?.aiAssessorTip || initialCatalog.underwriterFootNote
  );
  const [aiEngineUsed, setAiEngineUsed] = useState<
    'gemini-2.5-flash' | 'smart-synthesizer' | undefined
  >(saved?.aiEngineUsed);

  const [showWhyDrawer, setShowWhyDrawer] = useState(false);
  const [showExampleDrawer, setShowExampleDrawer] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const activeCatalogItem = useMemo(
    () =>
      MODULE_L_COMPILER_MODES.find((m) => m.mode === compilerMode) ||
      MODULE_L_COMPILER_MODES[0],
    [compilerMode]
  );

  // Calculate live cross-module telemetry for the 4-Card Underwriting Diagnostic Grid
  const moduleSyncTelemetry = useMemo(() => {
    const modules = [
      { code: 'Mod A (Concept)', ready: Boolean(plan.conceptCanvas?.coreProblem || plan.brainDumpText) },
      { code: 'Mod B (Market)', ready: Boolean(plan.moduleBData?.beachhead || plan.moduleBData?.marketSizing) },
      { code: 'Mod C (Validation)', ready: Boolean((plan.moduleCData?.surveys?.length || 0) > 0 || (plan.moduleCData?.interviewLogs?.length || 0) > 0) },
      { code: 'Mod D (Product)', ready: Boolean(plan.moduleDData?.productVehicle || plan.moduleDData?.workPackagesAndFlow) },
      { code: 'Mod E (Operations)', ready: Boolean(plan.moduleEData?.operationsBlueprint || plan.moduleEData?.riskRegister) },
      { code: 'Mod F (Team)', ready: Boolean(plan.moduleFData?.promoterProfiles || plan.moduleFData?.step3SurvivalBudgetData) },
      { code: 'Mod G (Launchpad)', ready: Boolean(plan.moduleGData?.step1) },
      { code: 'Mod H (Revenue)', ready: Boolean(plan.moduleHData?.step1RevenueModel || plan.moduleHData?.step3BreakevenCalculator) },
      { code: 'Mod I (Marketing)', ready: Boolean(plan.moduleIData?.step1Positioning || plan.moduleIData?.step3First10) },
      { code: 'Mod J (Finance)', ready: Boolean(plan.moduleJData?.step1OverheadsTax || plan.moduleJData?.step3CashflowGap) },
      { code: 'Mod K (Grants)', ready: Boolean(plan.moduleKData?.step1Audit || plan.moduleKData?.step2CapitalStack) },
    ];
    const syncedCount = modules.filter((m) => m.ready).length;

    const appendicesReady = [
      Boolean(plan.moduleFData?.promoterProfiles), // App A: CVs & Cap Table
      Boolean(plan.moduleJData?.step1OverheadsTax || plan.moduleHData?.step3BreakevenCalculator), // App B: 3-Yr Financials
      Boolean(plan.moduleDData?.workPackagesAndFlow || plan.moduleEData?.premisesAndEquipment), // App C: Work Packages & Quotes
      Boolean((plan.moduleCData?.surveys?.length || 0) > 0 || (plan.moduleCData?.interviewLogs?.length || 0) > 0), // App D: Survey Proof
      Boolean(plan.moduleEData?.riskRegister), // App E: Risk Register
      Boolean(plan.moduleGData?.step1 || plan.moduleKData?.step2CapitalStack), // App F: Statutory & Capital Stack
    ].filter(Boolean).length;

    return {
      syncedCount,
      totalModules: 11,
      appendicesReady,
      totalAppendices: 6,
    };
  }, [plan]);

  const isStepComplete = Boolean(saved?.lastSavedAt);

  function handleSelectMode(nextMode: ModuleLCompilerModeType) {
    if (isVaultReadonly) return;
    setCompilerMode(nextMode);
    const catalog =
      MODULE_L_COMPILER_MODES.find((m) => m.mode === nextMode) ||
      MODULE_L_COMPILER_MODES[0];
    setNarrativeTone(catalog.defaultTone);
    setSubmissionObjective(catalog.defaultObjective);
    setTargetAgencyOrCommitteeName(catalog.defaultAgencyName);
    setAiAssessorTip(catalog.underwriterFootNote);
    setCompilerMandateNotes(
      `Compile "${plan.title}" for ${catalog.defaultAgencyName} (${formatPlanCurrency(targetFundingAskAmount, currency)} target ask) using the ${catalog.title} rubric (${catalog.rubricWeightsSummary}).`
    );
  }

  async function handleCalibrateWithAi() {
    if (isVaultReadonly || isGeneratingAi) return;
    setIsGeneratingAi(true);
    setStatusMessage(null);
    try {
      const res = await generateModuleLStep1MandateAction({
        planId: plan.id,
        planTitle: plan.title,
        oneLinerSummary: plan.oneLinerSummary,
        industryCategory: plan.industryCategory,
        hqCountryCode: plan.hqCountryCode,
        baseCurrency: currency,
        compilerMode,
        otherCompilerModeText,
        targetAgencyOrCommitteeName,
        targetFundingAskAmount,
        exportPotential: plan.exportPotential,
      });

      if (res.allowed) {
        setCompilerMandateNotes(res.compilerMandateNotes);
        setAiAssessorTip(res.assessorStrategyTip);
        setNarrativeTone(res.recommendedNarrativeTone);
        setSubmissionObjective(res.recommendedSubmissionObjective);
        setAiEngineUsed(res.engineMode);
        setStatusMessage(
          res.engineMode === 'gemini-2.5-flash'
            ? '✨ Calibrated compilation mandate and evaluator scoring tip with Preflight AI!'
            : '✨ Calibrated compilation mandate and evaluator scoring rubric from your workspace data!'
        );
      }
    } finally {
      setIsGeneratingAi(false);
    }
  }

  function handleApplyIndustryBenchmark() {
    if (isVaultReadonly) return;
    const catalog = activeCatalogItem;
    const benchmarkAsk =
      compilerMode === 'IE_LEO_OFFICIAL_FORM'
        ? 25000
        : compilerMode === 'UK_INNOVATE_UK_9Q'
          ? 100000
          : compilerMode === 'UK_START_UP_LOANS_WORKBOOK'
            ? 25000
            : compilerMode === 'INVESTOR_SEIS_EIS_EII_PACK'
              ? 150000
              : 50000;
    setTargetFundingAskAmount(benchmarkAsk);
    setTargetAgencyOrCommitteeName(catalog.defaultAgencyName);
    setNarrativeTone(catalog.defaultTone);
    setSubmissionObjective(catalog.defaultObjective);
    setIncludeAppendicesBinder(true);
    setStrictWordCountEnforcement(true);
    setCompilerMandateNotes(
      `Compile "${plan.title}" for ${catalog.defaultAgencyName} (${formatPlanCurrency(benchmarkAsk, currency)} benchmark ask). Enforce ${catalog.wordLimitDisciplineLabel} discipline and attach Appendices A–F.`
    );
    setStatusMessage(
      `✅ Applied standard ${catalog.badge} committee benchmark (${formatPlanCurrency(benchmarkAsk, currency)} target ask).`
    );
  }

  async function handleParkOpenQuestion() {
    const question = `Module L Step 1 (Compiler Mode): Confirm exact submission window and committee ceiling for ${targetAgencyOrCommitteeName} (${formatPlanCurrency(targetFundingAskAmount, currency)} target).`;
    onParkQuestionInSession?.(question);
    await parkModuleLOpenQuestionAction({
      planId: plan.id,
      questionText: question,
    });
    setStatusMessage(
      '📌 Parked committee deadline & ask verification in your Open Questions Parking Lot!'
    );
  }

  function buildPayload(): ModuleLStep1ModeSavedData {
    return {
      compilerMode,
      otherCompilerModeText:
        compilerMode === 'OTHER' ? otherCompilerModeText.trim() : undefined,
      narrativeTone,
      otherNarrativeToneText:
        narrativeTone === 'OTHER' ? otherNarrativeToneText.trim() : undefined,
      submissionObjective,
      otherSubmissionObjectiveText:
        submissionObjective === 'OTHER'
          ? otherSubmissionObjectiveText.trim()
          : undefined,
      submissionWindow,
      otherSubmissionWindowText:
        submissionWindow === 'OTHER'
          ? otherSubmissionWindowText.trim()
          : undefined,
      targetAgencyOrCommitteeName:
        targetAgencyOrCommitteeName.trim() || activeCatalogItem.defaultAgencyName,
      targetFundingAskAmount: Math.max(0, Number(targetFundingAskAmount) || 0),
      includeAppendicesBinder,
      strictWordCountEnforcement,
      compilerMandateNotes: compilerMandateNotes.trim(),
      aiAssessorTip,
      aiEngineUsed: aiEngineUsed || 'smart-synthesizer',
      lastSavedAt: new Date().toISOString(),
    };
  }

  async function handleSaveOnly() {
    if (isVaultReadonly || isSaving) return;
    setIsSaving(true);
    try {
      const payload = buildPayload();
      await onSaveStep1(payload, 20);
      setStatusMessage('✅ Saved Step 1 Compiler Mode & Committee Rubric settings!');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveAndContinue() {
    if (isSaving) return;
    setIsSaving(true);
    try {
      if (!isVaultReadonly) {
        const payload = buildPayload();
        await onSaveStep1(payload, 20);
      }
      onAdvanceToStep2();
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveAndJumpToCompiler() {
    if (isSaving) return;
    setIsSaving(true);
    try {
      if (!isVaultReadonly) {
        const payload = buildPayload();
        await onSaveStep1(payload, 20);
      }
      if (onJumpToCompilerStep3) {
        onJumpToCompilerStep3();
      } else {
        onAdvanceToStep2();
      }
    } finally {
      setIsSaving(false);
    }
  }

  // ===========================================================================
  // COLLAPSED STEP STATE (Strict GEMINI.md Section 6.1 Standard)
  // ===========================================================================
  if (!isOpen) {
    return (
      <div
        id="module-l-step-1"
        onClick={onOpenStep}
        className="group scroll-mt-24 cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                isStepComplete
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 text-white'
              }`}
            >
              {isStepComplete ? <Check className="h-4 w-4" /> : '1'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                  1. Compiler Mode, Target Committee &amp; Scoring Rubric
                </h2>
                <Badge
                  variant={isStepComplete ? 'default' : 'outline'}
                  className={
                    isStepComplete
                      ? 'shrink-0 bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-medium'
                      : 'shrink-0 border-slate-300 text-slate-600 text-[10px] font-medium'
                  }
                >
                  {isStepComplete ? 'Mode Locked' : 'In Progress'}
                </Badge>
                <Badge
                  variant="outline"
                  className="shrink-0 border-indigo-200 bg-indigo-50 text-indigo-700 text-[10px] font-medium"
                >
                  {activeCatalogItem.badge}
                </Badge>
              </div>
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {compilerMode === 'OTHER' && otherCompilerModeText
                  ? `Custom Mode: ${otherCompilerModeText}`
                  : activeCatalogItem.title}{' '}
                • Target: {targetAgencyOrCommitteeName} (
                {formatPlanCurrency(targetFundingAskAmount, currency)})
              </p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 shrink-0 px-2.5 text-xs font-medium text-indigo-600 group-hover:bg-indigo-50"
          >
            {isStepComplete ? 'Edit Step' : 'Open Step'}
            <ChevronDown className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // EXPANDED STEP STATE (Strict GEMINI.md Section 6.1 & 6.2 Standard)
  // ===========================================================================
  return (
    <Card
      id="module-l-step-1"
      className="scroll-mt-24 rounded-xl border border-slate-200 bg-white shadow-xs"
    >
      <CardHeader className="border-b border-slate-100 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                isStepComplete
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 text-white'
              }`}
            >
              {isStepComplete ? <Check className="h-4 w-4" /> : '1'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base font-bold text-slate-900">
                  1. Compiler Mode, Target Committee &amp; Scoring Rubric
                </CardTitle>
                <Badge
                  variant={isStepComplete ? 'default' : 'outline'}
                  className={
                    isStepComplete
                      ? 'shrink-0 bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-medium'
                      : 'shrink-0 border-slate-300 text-slate-600 text-[10px] font-medium'
                  }
                >
                  {isStepComplete ? 'Completed' : 'Step 1 of 5'}
                </Badge>
                <Badge
                  variant="outline"
                  className="shrink-0 border-indigo-200 bg-indigo-50 text-indigo-700 text-[10px] font-medium"
                >
                  {activeCatalogItem.badge}
                </Badge>
              </div>
              <CardDescription className="mt-1 text-xs text-slate-600">
                Choose the official grant application form, loan workbook, or investor pack format so the compiler structures your answers from Modules A–K into the exact questions, word limits, and appendices your evaluator grades on.
              </CardDescription>
            </div>
          </div>

          {/* Top-Right Header Actions (CLEAN RULE: Collapse Step ONLY) */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onToggleCollapse}
              className="text-xs text-slate-500 hover:bg-slate-100"
            >
              Collapse Step
              <ChevronUp className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Dedicated 4-Layer Support Strip (Directly Below Title & Description) */}
        <div className="mt-3 flex flex-wrap items-center gap-2 pt-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setShowWhyDrawer((prev) => !prev)}
            className="h-7 border-indigo-200 text-[11px] font-medium text-indigo-700 hover:bg-indigo-50"
          >
            <HelpCircle className="mr-1 h-3.5 w-3.5" />
            Why Are We Asking This?
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setShowExampleDrawer((prev) => !prev)}
            className="h-7 border-emerald-200 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50"
          >
            <Lightbulb className="mr-1 h-3.5 w-3.5" />
            Show Me an Example
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleCalibrateWithAi}
            disabled={isGeneratingAi || isVaultReadonly}
            className="h-7 border-violet-200 bg-violet-50/60 text-[11px] font-medium text-violet-700 hover:bg-violet-100"
          >
            {isGeneratingAi ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin text-violet-600" />
            ) : (
              <Sparkles className="mr-1 h-3.5 w-3.5 text-violet-600" />
            )}
            Auto-Calibrate Mandate with AI
          </Button>
        </div>

        {/* Collapsible Micro-Coaching Drawer 1: Why Are We Asking This? */}
        {showWhyDrawer && (
          <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50/70 p-3.5 text-xs text-indigo-900">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1.5">
                <p className="font-bold text-indigo-950">
                  Why the Compiler Mode changes your entire business plan output:
                </p>
                <p className="leading-relaxed">
                  A generic 30-page business plan will fail an <strong>Innovate UK 9-Question IFS</strong> panel (which enforces a strict 400-word limit per question) and will frustrate a <strong>UK Start Up Loans</strong> underwriter (who looks first at your Personal Survival Budget vs. Month 1–6 drawings). Conversely, an <strong>Irish LEO Evaluation Committee (EVAC)</strong> requires explicit proof of non-displacement (that you aren&apos;t simply taking market share from another local business in the same county) and 3 independent supplier quotes.
                </p>
                <p className="leading-relaxed">
                  Selecting your primary target mode here configures the <strong>Step 2 Pre-Flight Contradiction Audit</strong>, the <strong>Step 3 Question-by-Question Narrative Compiler</strong>, and the <strong>Step 4 Appendices A–F Evidence Binder</strong> automatically.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowWhyDrawer(false)}
                className="rounded-md p-1 text-indigo-700 hover:bg-indigo-100"
                aria-label="Close Why Drawer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Collapsible Micro-Coaching Drawer 2: Show Me an Example */}
        {showExampleDrawer && (
          <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/70 p-3.5 text-xs text-emerald-950">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1.5">
                <p className="font-bold text-emerald-950">
                  Example Compiler Mode Calibration ({plan.industryCategory}):
                </p>
                <ul className="list-disc space-y-1 pl-4 leading-relaxed">
                  <li>
                    <strong>🇮🇪 Irish B2B SaaS / Manufacturing Founder applying for €25k LEO Priming:</strong> Selects <em>IE LEO &amp; Enterprise Ireland Official Form Mode</em> + <em>Evidence-Led Grant Assessor Tone</em>. The compiler automatically highlights international export revenue outside Ireland, 3-year full-time job creation (from Module F), and 3-quote software/equipment compliance (from Modules D &amp; E).
                  </li>
                  <li>
                    <strong>🇬🇧 UK DeepTech / AI Founder applying for £100k Innovate UK Smart Grant:</strong> Selects <em>UK Innovate UK 9-Question IFS Mode</em>. The compiler maps Module D Work Packages (`WP1..n`) to Question 5, Module E&apos;s 4-category Risk Register to Question 6, and caps every answer at 400 words.
                  </li>
                  <li>
                    <strong>🇬🇧 / 🇮🇪 Seed Founder raising £150k / €150k from Angels:</strong> Selects <em>Investor Tax Relief &amp; Seed Memo (HMRC SEIS/EIS &amp; Irish EII)</em>. The compiler foregrounds statutory Qualifying Trade compliance, the Risk-to-Capital condition, and your Module H Pocket Profit breakeven curve.
                  </li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => setShowExampleDrawer(false)}
                className="rounded-md p-1 text-emerald-800 hover:bg-emerald-100"
                aria-label="Close Example Drawer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6 pt-5">
        {statusMessage && (
          <div className="flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50/80 px-4 py-2.5 text-xs font-medium text-indigo-950">
            <span>{statusMessage}</span>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="ml-3 text-[11px] font-bold text-indigo-700 underline hover:text-indigo-900"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* =================================================================== */}
        {/* AUTO-SYNC BANNER FROM MODULE K & HQ GEO-ROUTING                     */}
        {/* =================================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50/80 via-white to-indigo-50/50 p-3.5">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <div className="text-xs text-slate-700">
              <span className="font-bold text-slate-900">
                Synced from Module K &amp; Geo-Profile ({plan.hqCountryCode}):
              </span>{' '}
              Based on your workspace funding strategy, your recommended compilation format is{' '}
              <strong className="text-indigo-700">
                {
                  MODULE_L_COMPILER_MODES.find(
                    (m) => m.mode === syncedRecommendedMode
                  )?.title
                }
              </strong>
              . You can switch between all 5 official modes at any time without losing data.
            </div>
          </div>
          {compilerMode !== syncedRecommendedMode && !isVaultReadonly && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleSelectMode(syncedRecommendedMode)}
              className="h-7 shrink-0 border-emerald-300 bg-white text-[11px] font-semibold text-emerald-800 hover:bg-emerald-50"
            >
              Restore Recommended Mode
            </Button>
          )}
        </div>

        {/* =================================================================== */}
        {/* 2. PRIMARY COMPILATION MODE SELECTOR (5 Official Modes + "OTHER")   */}
        {/* =================================================================== */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Select Official Compilation Mode &amp; Committee Format
              </label>
              <p className="text-xs text-slate-500">
                Click any mode card to preview its official question structure and evaluator scoring weights.
              </p>
            </div>
            <span
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-600"
              title="Jargon Tooltip: Each agency uses a specific scoring rubric (e.g., EVAC in Ireland or IFS 9-Question in the UK). Switching modes reformats your data without erasing anything."
            >
              <Info className="h-3 w-3 text-indigo-600" />
              Non-Destructive Mode Switcher
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {MODULE_L_COMPILER_MODES.map((item) => {
              const isSelected = compilerMode === item.mode;
              const isRecommended = syncedRecommendedMode === item.mode;
              return (
                <button
                  key={item.mode}
                  type="button"
                  disabled={isVaultReadonly}
                  onClick={() => handleSelectMode(item.mode)}
                  className={`flex flex-col justify-between rounded-xl border p-4 text-left transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-2 ring-indigo-600/20'
                      : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-800">
                        {item.badge}
                      </span>
                      <div className="flex items-center gap-1">
                        {isRecommended && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            Recommended
                          </span>
                        )}
                        {isSelected && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">
                      {item.title}
                    </h4>
                    <p className="text-xs leading-relaxed text-slate-600">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-3 space-y-1.5 border-t border-slate-200/80 pt-2.5 text-[11px]">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="font-semibold text-slate-700">Format:</span>
                      <span>{item.sectionStructureLabel}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="font-semibold text-slate-700">Hurdle:</span>
                      <span className="font-semibold text-indigo-700">
                        {item.passThresholdLabel}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Mandatory Inline "OTHER" Input when compilerMode === 'OTHER' */}
          {compilerMode === 'OTHER' && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-2">
              <label className="block text-xs font-bold text-indigo-950">
                Specify Your Custom Submission Format, Accelerator, or Tender Name
              </label>
              <input
                type="text"
                disabled={isVaultReadonly}
                value={otherCompilerModeText}
                onChange={(e) => setOtherCompilerModeText(e.target.value)}
                placeholder="e.g., Enterprise Ireland HPSU Feasibility, Y Combinator Application, EU EIC Accelerator, or University Spin-Out Board..."
                className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-base sm:text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* =================================================================== */}
        {/* SELECTED MODE STRUCTURE & RUBRIC PREVIEW CARD                       */}
        {/* =================================================================== */}
        <div className="rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50/60 via-white to-violet-50/40 p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-950">
                  Compiler Blueprint Output Preview: {activeCatalogItem.title}
                </h4>
                <p className="text-[11px] text-slate-500">
                  Format: <span className="font-semibold text-slate-700">{activeCatalogItem.sectionStructureLabel}</span> ({activeCatalogItem.wordLimitDisciplineLabel}) • Scoring Weights: <span className="font-semibold text-indigo-700">{activeCatalogItem.rubricWeightsSummary}</span>
                </p>
              </div>
            </div>
            {onJumpToCompilerStep3 && (
              <Button
                type="button"
                size="sm"
                onClick={handleSaveAndJumpToCompiler}
                disabled={isSaving}
                className="bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs"
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5 text-emerald-200" />
                ⚡ Auto-Compile This Blueprint Now (Step 3)
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          <div className="rounded-lg border border-indigo-100 bg-white/90 p-3">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              The Compiler will automatically construct answers for these {activeCatalogItem.keySectionsPreview.length} questions from your 11 modules:
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {activeCatalogItem.keySectionsPreview.map((sec, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2 text-xs text-slate-800"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <span className="truncate font-medium">{sec}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-600 pt-1">
            <p className="max-w-xl">
              <strong className="text-slate-900">Evaluator Underwriting Note:</strong>{' '}
              {activeCatalogItem.underwriterFootNote}
            </p>
            <div className="text-xs font-semibold text-indigo-700">
              Ready to compile immediately or customize committee parameters below ▾
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* 3. EVALUATOR TONE & PRIMARY OBJECTIVE SELECTORS (with "OTHER")      */}
        {/* =================================================================== */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Tone Selector */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Evaluator Narrative Tone &amp; Voice
            </label>
            <div className="grid grid-cols-1 gap-2">
              {NARRATIVE_TONE_OPTIONS.map((opt) => {
                const active = narrativeTone === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={isVaultReadonly}
                    onClick={() => setNarrativeTone(opt.value)}
                    className={`flex items-start justify-between gap-3 rounded-xl border p-3 text-left transition-all ${
                      active
                        ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600/20'
                        : 'border-slate-200 bg-white hover:border-indigo-200'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {opt.label}
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-500">
                        {opt.subtitle}
                      </div>
                    </div>
                    <div
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                        active
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-slate-300'
                      }`}
                    >
                      {active && <Check className="h-2.5 w-2.5" />}
                    </div>
                  </button>
                );
              })}
            </div>
            {narrativeTone === 'OTHER' && (
              <input
                type="text"
                disabled={isVaultReadonly}
                value={otherNarrativeToneText}
                onChange={(e) => setOtherNarrativeToneText(e.target.value)}
                placeholder="Describe your custom evaluator tone (e.g., Academic Clinical Peer-Review, Social Enterprise Impact)..."
                className="mt-2 w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-base sm:text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            )}
          </div>

          {/* Primary Submission Objective Selector */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Primary Committee Approval Objective
            </label>
            <div className="grid grid-cols-1 gap-2">
              {SUBMISSION_OBJECTIVE_OPTIONS.map((opt) => {
                const active = submissionObjective === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={isVaultReadonly}
                    onClick={() => setSubmissionObjective(opt.value)}
                    className={`flex items-start justify-between gap-3 rounded-xl border p-3 text-left transition-all ${
                      active
                        ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600/20'
                        : 'border-slate-200 bg-white hover:border-indigo-200'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {opt.label}
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-500">
                        {opt.subtitle}
                      </div>
                    </div>
                    <div
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                        active
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-slate-300'
                      }`}
                    >
                      {active && <Check className="h-2.5 w-2.5" />}
                    </div>
                  </button>
                );
              })}
            </div>
            {submissionObjective === 'OTHER' && (
              <input
                type="text"
                disabled={isVaultReadonly}
                value={otherSubmissionObjectiveText}
                onChange={(e) => setOtherSubmissionObjectiveText(e.target.value)}
                placeholder="Specify your custom submission objective..."
                className="mt-2 w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-base sm:text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            )}
          </div>
        </div>

        {/* =================================================================== */}
        {/* 4. TARGET COMMITTEE PARAMETERS, TIMELINE & MANDATE CALIBRATION      */}
        {/* =================================================================== */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Target Committee Parameters &amp; Submission Window
              </h4>
              <p className="text-xs text-slate-500">
                Fine-tune the recipient agency name, grant/funding ask amount, and formatting guardrails.
              </p>
            </div>
            {/* Momentum Protection Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isVaultReadonly}
                onClick={handleApplyIndustryBenchmark}
                className="h-7 border-slate-300 bg-white text-[11px] font-medium text-slate-700 hover:bg-slate-100"
              >
                <Sliders className="mr-1 h-3 w-3 text-indigo-600" />
                Use Industry Benchmark
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleParkOpenQuestion}
                className="h-7 border-amber-300 bg-amber-50/80 text-[11px] font-medium text-amber-900 hover:bg-amber-100"
              >
                <BookmarkPlus className="mr-1 h-3 w-3 text-amber-700" />
                Park It in Open Questions
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Target Agency, Underwriter, or Committee Name
              </label>
              <input
                type="text"
                disabled={isVaultReadonly}
                value={targetAgencyOrCommitteeName}
                onChange={(e) => setTargetAgencyOrCommitteeName(e.target.value)}
                placeholder="e.g., Local Enterprise Office Dublin City / Innovate UK Smart Grants"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base sm:text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Target Grant / Loan / Investment Ask ({currency})
              </label>
              <input
                type="number"
                min={0}
                step={500}
                disabled={isVaultReadonly}
                value={targetFundingAskAmount}
                onChange={(e) =>
                  setTargetFundingAskAmount(Math.max(0, Number(e.target.value) || 0))
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base sm:text-xs font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Target Submission Window Pills (with "OTHER") */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Target Submission Window / Committee Intake
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {SUBMISSION_WINDOW_OPTIONS.map((win) => {
                const active = submissionWindow === win.value;
                return (
                  <button
                    key={win.value}
                    type="button"
                    disabled={isVaultReadonly}
                    onClick={() => setSubmissionWindow(win.value)}
                    className={`rounded-xl border p-2.5 text-left transition-all ${
                      active
                        ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-600/20'
                        : 'border-slate-200 bg-white hover:border-indigo-200'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900">
                      {win.label}
                    </div>
                    <div className="mt-0.5 text-[10px] leading-snug text-slate-500">
                      {win.subtitle}
                    </div>
                  </button>
                );
              })}
            </div>
            {submissionWindow === 'OTHER' && (
              <input
                type="text"
                disabled={isVaultReadonly}
                value={otherSubmissionWindowText}
                onChange={(e) => setOtherSubmissionWindowText(e.target.value)}
                placeholder="Specify your exact committee deadline or cohort date..."
                className="mt-2 w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-base sm:text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            )}
          </div>

          {/* Compiler Guardrail Toggles */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-1">
            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-3">
              <input
                type="checkbox"
                disabled={isVaultReadonly}
                checked={includeAppendicesBinder}
                onChange={(e) => setIncludeAppendicesBinder(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="text-xs">
                <div className="font-bold text-slate-900">
                  Auto-Attach Mandatory Appendices A–F Binder
                </div>
                <div className="text-[11px] text-slate-500">
                  Includes Promoter CVs, 36-Month Financials, 3-Quote Schedule, Mom-Test Survey Telemetry &amp; Risk Register
                </div>
              </div>
            </label>

            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-3">
              <input
                type="checkbox"
                disabled={isVaultReadonly}
                checked={strictWordCountEnforcement}
                onChange={(e) =>
                  setStrictWordCountEnforcement(e.target.checked)
                }
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="text-xs">
                <div className="font-bold text-slate-900">
                  Enforce Official Portal Word-Limit Gauges
                </div>
                <div className="text-[11px] text-slate-500">
                  Displays live word/character meters (e.g., 400w cap for Innovate UK IFS or LEO section limits)
                </div>
              </div>
            </label>
          </div>

          {/* Compiler Mandate Instructions Textarea */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-semibold text-slate-700">
                Compiler Mandate &amp; Committee Emphasis Notes
              </label>
              <span className="text-[11px] text-slate-500">
                Guides Step 2 Contradiction Audit &amp; Step 3 Section Compiler
              </span>
            </div>
            <textarea
              rows={3}
              disabled={isVaultReadonly}
              value={compilerMandateNotes}
              onChange={(e) => setCompilerMandateNotes(e.target.value)}
              placeholder="Specify any special angles or evaluator priorities to emphasize across the compiled plan..."
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-base sm:text-xs leading-relaxed text-slate-900 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Assessor Strategy Tip Callout */}
          {aiAssessorTip && (
            <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-3.5 text-xs text-violet-950">
              <div className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                <div>
                  <span className="font-bold">
                    Committee Evaluator Insider Tip:
                  </span>{' '}
                  {aiAssessorTip}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* =================================================================== */}
        {/* BOTTOM STEP TOOLBAR (Save & Advance to Step 2)                      */}
        {/* =================================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleCalibrateWithAi}
              disabled={isGeneratingAi || isVaultReadonly}
              className="border-violet-200 bg-violet-50/70 text-xs font-medium text-violet-700 hover:bg-violet-100"
            >
              {isGeneratingAi ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              )}
              Calibrate Mandate with AI
            </Button>
            {!isVaultReadonly && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleSaveOnly}
                disabled={isSaving}
                className="border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                <Save className="mr-1.5 h-3.5 w-3.5" />
                {isSaving ? 'Saving...' : 'Save Step 1'}
              </Button>
            )}
          </div>

          <Button
            type="button"
            size="sm"
            onClick={handleSaveAndContinue}
            disabled={isSaving}
            className="bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700"
          >
            Save &amp; Continue to Step 2: Pre-Flight Audit
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
