'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Globe2,
  ShieldCheck,
  Lock,
  AlertTriangle,
  Users,
  Ticket,
  ArrowRight,
  HelpCircle,
  Lightbulb,
  BookmarkPlus,
  Bot,
  ChevronDown,
  GitBranch,
  Plus,
  Check,
  Wand2,
  X,
  Compass,
  BarChart3,
  Briefcase,
  DollarSign,
  Megaphone,
  Scale,
  FileText,
  Info,
  UserCheck,
  LogOut,
  Wrench,
  Loader2,
  Pencil,
  Save,
  Download,
  Printer,
  Copy,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  calculateAppSumoTierLimits,
  calculatePassLimits,
  canAccessModule,
  canCreateStartupPlan,
  canInviteCollaborator,
  canConsumeAiCredits,
  type EntitlementSnapshot,
  type ModuleCode,
} from '@/lib/entitlements';
import {
  getCountryRulePack,
  getGrantsForCountry,
  formatPlanCurrency,
  type SupportedCountryCode,
} from '@/lib/localization';
import {
  loadBmuSession,
  saveBmuSession,
  getDefaultDemoSession,
  type BmuLocalSession,
  type SavedConceptCanvas,
  type SavedFounderMotivation,
  type FounderMotivationType,
  type FounderWeeklyHours,
  type SavedTeamAndBudget,
  type PlanTeamStructureType,
  type TeamSkillCoverageType,
  type StartingBudgetBracket,
  type SavedFounderRealityCheck,
  type IndustryConnectionLevel,
  type PersonalIncomeUrgency,
  type FounderDealbreakerType,
  type GrowthTradeoffPreference,
  type BiggestWorryPreset,
} from '@/lib/auth/session-store';
import {
  getCurrentCloudSessionAction,
  logoutFounderAction,
} from '@/app/actions/auth';
import {
  generateModuleAConceptCanvasAction,
  saveModuleACanvasEditsAction,
  parkOpenQuestionAction,
} from '@/app/actions/module-a';
import { buildDynamicModuleABlindSpots } from '@/lib/ai/module-a-blindspots';
import {
  buildModuleAMarkdownBrief,
  buildModuleAStandaloneHtmlDocument,
  formatStartingBudgetBracket,
  MOTIVATION_LABELS,
  WEEKLY_HOURS_LABELS,
  TEAM_STRUCTURE_LABELS,
  SKILL_COVERAGE_LABELS,
  INDUSTRY_CONNECTION_LABELS,
  INCOME_URGENCY_LABELS,
  DEALBREAKER_LABELS,
  GROWTH_TRADEOFF_LABELS,
  BIGGEST_WORRY_LABELS,
  type ModuleABriefData,
} from '@/lib/export/module-a-brief';
import type { BlindSpotItem } from '@/db/schema';

const MODULES_LIST: Array<{
  code: ModuleCode;
  short: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  progress: number;
}> = [
  {
    code: 'MOD_A_IDEATION',
    short: 'Module A',
    title: 'Ideation & Concept Canvas',
    subtitle: 'Brain Dump → 1-Page Mirror Canvas → Things to Consider',
    icon: Compass,
    progress: 75,
  },
  {
    code: 'MOD_B_MARKET',
    short: 'Module B',
    title: 'Market & Validation Survey',
    subtitle: 'AI Market Scout, TAM/SAM/SOM & Public /v/[slug] Survey',
    icon: BarChart3,
    progress: 0,
  },
  {
    code: 'MOD_C_OPERATIONS_TEAM',
    short: 'Module C',
    title: 'Operations, Hats & Co-Founders',
    subtitle: 'MVP Filter, 7 Startup Hats & Blind-Reveal Interview',
    icon: Briefcase,
    progress: 0,
  },
  {
    code: 'MOD_D_REVENUE',
    short: 'Module D',
    title: 'Selling & Pocket Profit',
    subtitle: 'Buying Journey Friction & Single-Sale Unit Economics',
    icon: DollarSign,
    progress: 0,
  },
  {
    code: 'MOD_E_MARKETING',
    short: 'Module E',
    title: 'Marketing & First 100 Customers',
    subtitle: '3-Second Pitch, Day-1 Hustle & Reverse Budget Funnel',
    icon: Megaphone,
    progress: 0,
  },
  {
    code: 'MOD_F_FINANCE_GRANTS',
    short: 'Module F',
    title: 'Financials, Grants & Legal Shield',
    subtitle: '36-Month Cashflow, Localized Grants & IP Checklist',
    icon: Scale,
    progress: 0,
  },
  {
    code: 'MOD_G_BUSINESS_PLAN',
    short: 'Module G',
    title: 'Living Business Plan & Export',
    subtitle: 'Audience Templates, Live Data Blocks & Red-Flag Audit',
    icon: FileText,
    progress: 0,
  },
];

export default function WorkspacePage() {
  const [session, setSession] = useState<BmuLocalSession>(() =>
    getDefaultDemoSession()
  );

  // Simulator override controls (housed in Footer)
  const [selectedTierPreset, setSelectedTierPreset] = useState<
    | 'SESSION_ACTIVE'
    | 'FREE_HOOK'
    | 'SIX_MONTH_SOLO'
    | 'SIX_MONTH_COFOUNDER'
    | 'APPSUMO_T1'
    | 'APPSUMO_T2'
    | 'APPSUMO_T3'
    | 'VAULT_EXPIRED'
  >('SESSION_ACTIVE');

  const [selectedCountry, setSelectedCountry] =
    useState<SupportedCountryCode>('IE');
  const [showEngineInspector, setShowEngineInspector] = useState(false);

  // Workspace UX Interactive States
  const [planDropdownOpen, setPlanDropdownOpen] = useState(false);
  const [showWhyCard, setShowWhyCard] = useState(true);
  const [showExamples, setShowExamples] = useState(false);
  const [showImStuckHelper, setShowImStuckHelper] = useState(false);
  const [askUnicornOpen, setAskUnicornOpen] = useState(false);
  const [paywallModalFeature, setPaywallModalFeature] = useState<string | null>(
    null
  );
  const [openQuestions, setOpenQuestions] = useState<string[]>([
    'Verify if independent supermarkets in Ireland use Oracle Micros or custom POS systems.',
  ]);
  const [brainDumpText, setBrainDumpText] = useState(
    'Independent grocery stores throw away 4–6% of fresh produce every week because staff manually walk the aisles with sticker guns too late in the evening. GreenCart AI connects to their inventory system, predicts which fresh items will expire 72 hours early, and pushes automatic markdowns to electronic shelf labels and local wholesale buyers.'
  );
  const [cloudDbConnected, setCloudDbConnected] = useState<boolean | null>(
    null
  );

  // Module A Step 2, Step 3, Step 4 & Step 5 Live State
  const [conceptCanvas, setConceptCanvas] = useState<SavedConceptCanvas | null>(
    null
  );
  const [founderMotivation, setFounderMotivation] =
    useState<SavedFounderMotivation>({
      primaryMotivation: 'LEAVE_JOB',
      weeklyHoursAvailable: '15_TO_25_HRS',
      twelveMonthSuccessVision: '',
    });
  const [teamAndBudget, setTeamAndBudget] = useState<SavedTeamAndBudget>({
    teamStructureType: 'SOLO_FOUNDER',
    skillCoverage: 'BUILD_IN_HOUSE',
    startingBudgetBracket: '1K_TO_5K',
    teamAndFundingNotes: '',
  });
  const [founderRealityCheck, setFounderRealityCheck] =
    useState<SavedFounderRealityCheck>({
      industryConnection: 'WARM_CONNECTIONS',
      personalIncomeUrgency: 'MEDIUM_6_TO_12M',
      dealbreakers: ['NO_PHYSICAL_PREMISES'],
      growthTradeoff: 'NON_DILUTIVE_GRANTS',
      biggestWorryPreset: 'FINDING_FIRST_10',
      biggestWorryNotes: '',
    });
  const [thingsToConsider, setThingsToConsider] = useState<BlindSpotItem[]>([]);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isEditingCanvas, setIsEditingCanvas] = useState(false);
  const [isSavingCanvas, setIsSavingCanvas] = useState(false);
  const [synthesisBanner, setSynthesisBanner] = useState<string | null>(null);

  // Hydrate from localStorage first, then sync with Cloud SQL PostgreSQL session cookie if present
  useEffect(() => {
    const loaded = loadBmuSession();
    setSession(loaded);
    const activePlan =
      loaded.plans.find((p) => p.id === loaded.activePlanId) || loaded.plans[0];
    if (activePlan) {
      setSelectedCountry(activePlan.hqCountryCode);
      if (activePlan.brainDumpText) {
        setBrainDumpText(activePlan.brainDumpText);
      }
      if (activePlan.conceptCanvas) {
        setConceptCanvas(activePlan.conceptCanvas);
      }
      if (activePlan.founderMotivation) {
        setFounderMotivation(activePlan.founderMotivation);
      }
      if (activePlan.teamAndBudget) {
        setTeamAndBudget(activePlan.teamAndBudget);
      } else if (loaded.user.teamStructure) {
        setTeamAndBudget((prev) => ({
          ...prev,
          teamStructureType:
            loaded.user.teamStructure === 'CO_FOUNDERS'
              ? 'COFOUNDER_TEAM'
              : loaded.user.teamStructure === 'LOOKING_FOR_COFOUNDER'
                ? 'SEEKING_COFOUNDER'
                : 'SOLO_FOUNDER',
        }));
      }
      if (activePlan.founderRealityCheck) {
        setFounderRealityCheck(activePlan.founderRealityCheck);
      }
      if (activePlan.thingsToConsider?.length) {
        setThingsToConsider(activePlan.thingsToConsider);
      }
      if (activePlan.openQuestions?.length) {
        setOpenQuestions(activePlan.openQuestions);
      }
    }

    getCurrentCloudSessionAction()
      .then((res) => {
        setCloudDbConnected(res.dbConnected);
        if (res.authenticated && res.session) {
          setSession(res.session);
          saveBmuSession(res.session);
          const dbPlan =
            res.session.plans.find(
              (p) => p.id === res.session?.activePlanId
            ) || res.session.plans[0];
          if (dbPlan) {
            setSelectedCountry(dbPlan.hqCountryCode);
            if (dbPlan.brainDumpText) {
              setBrainDumpText(dbPlan.brainDumpText);
            }
            if (dbPlan.conceptCanvas) {
              setConceptCanvas(dbPlan.conceptCanvas);
            }
            if (dbPlan.founderMotivation) {
              setFounderMotivation(dbPlan.founderMotivation);
            }
            if (dbPlan.teamAndBudget) {
              setTeamAndBudget(dbPlan.teamAndBudget);
            }
            if (dbPlan.founderRealityCheck) {
              setFounderRealityCheck(dbPlan.founderRealityCheck);
            }
            if (dbPlan.thingsToConsider?.length) {
              setThingsToConsider(dbPlan.thingsToConsider);
            }
            if (dbPlan.openQuestions?.length) {
              setOpenQuestions(dbPlan.openQuestions);
            }
          }
        }
      })
      .catch(() => {
        setCloudDbConnected(false);
      });
  }, []);

  const currentPlan =
    session.plans.find((p) => p.id === session.activePlanId) ||
    session.plans[0] || {
      id: 'plan-default',
      title: 'GreenCart AI — Zero-Waste Grocery',
      oneLinerSummary:
        'Automated expiry prediction & dynamic markdowns for independent supermarkets.',
      industryCategory: 'B2B SaaS / AI App' as const,
      hqCountryCode: selectedCountry,
      baseCurrency: 'EUR',
      targetMarketsArray: ['IE', 'GB'],
      exportPotential: 'EXPORTING_INTERNATIONALLY' as const,
      currentModuleStep: 'MOD_A_STEP_1',
      openQuestions: [],
    };

  // Build interactive EntitlementSnapshot from either the logged-in user's session or footer simulator override
  const activeEntitlement: EntitlementSnapshot = (() => {
    if (selectedTierPreset === 'SESSION_ACTIVE') {
      return session.entitlement;
    }
    switch (selectedTierPreset) {
      case 'FREE_HOOK': {
        const limits = calculatePassLimits('FREE_HOOK');
        return {
          userId: session.user.id,
          planType: 'FREE_HOOK',
          stackedCodesCount: 0,
          maxStartupPlans: limits.maxStartupPlans,
          maxSeatsPerPlan: limits.maxSeatsPerPlan,
          monthlyAiCreditsLimit: limits.monthlyAiCreditsLimit,
          aiCreditsUsedThisMonth: 12,
          whiteLabelExportEnabled: false,
          isVaultReadonly: false,
        };
      }
      case 'SIX_MONTH_SOLO': {
        const limits = calculatePassLimits('SIX_MONTH_SOLO');
        return {
          userId: session.user.id,
          planType: 'SIX_MONTH_SOLO',
          stackedCodesCount: 0,
          maxStartupPlans: limits.maxStartupPlans,
          maxSeatsPerPlan: limits.maxSeatsPerPlan,
          monthlyAiCreditsLimit: limits.monthlyAiCreditsLimit,
          aiCreditsUsedThisMonth: 35,
          whiteLabelExportEnabled: false,
          accessExpiresAt: limits.accessExpiresAt,
          isVaultReadonly: false,
        };
      }
      case 'SIX_MONTH_COFOUNDER': {
        const limits = calculatePassLimits('SIX_MONTH_COFOUNDER');
        return {
          userId: session.user.id,
          planType: 'SIX_MONTH_COFOUNDER',
          stackedCodesCount: 0,
          maxStartupPlans: limits.maxStartupPlans,
          maxSeatsPerPlan: limits.maxSeatsPerPlan,
          monthlyAiCreditsLimit: limits.monthlyAiCreditsLimit,
          aiCreditsUsedThisMonth: 60,
          whiteLabelExportEnabled: false,
          accessExpiresAt: limits.accessExpiresAt,
          isVaultReadonly: false,
        };
      }
      case 'APPSUMO_T1':
      case 'APPSUMO_T2':
      case 'APPSUMO_T3': {
        const codeCount =
          selectedTierPreset === 'APPSUMO_T1'
            ? 1
            : selectedTierPreset === 'APPSUMO_T2'
              ? 2
              : 3;
        const sumo = calculateAppSumoTierLimits(codeCount);
        return {
          userId: session.user.id,
          planType: 'APPSUMO_LTD',
          stackedCodesCount: sumo.stackedCodesCount,
          maxStartupPlans: sumo.maxStartupPlans,
          maxSeatsPerPlan: sumo.maxSeatsPerPlan,
          monthlyAiCreditsLimit: sumo.monthlyAiCreditsLimit,
          aiCreditsUsedThisMonth: 45,
          whiteLabelExportEnabled: sumo.whiteLabelExportEnabled,
          customApiKeyEncrypted: codeCount >= 3 ? 'enc_gemini_byok_active' : null,
          accessExpiresAt: null,
          isVaultReadonly: false,
        };
      }
      case 'VAULT_EXPIRED': {
        return {
          userId: session.user.id,
          planType: 'SIX_MONTH_SOLO',
          stackedCodesCount: 0,
          maxStartupPlans: 1,
          maxSeatsPerPlan: 1,
          monthlyAiCreditsLimit: 250,
          aiCreditsUsedThisMonth: 180,
          whiteLabelExportEnabled: false,
          accessExpiresAt: new Date(Date.now() - 86400 * 1000 * 10),
          isVaultReadonly: true,
        };
      }
    }
  })();

  const countryPack = getCountryRulePack(selectedCountry);
  const countryGrants = getGrantsForCountry(selectedCountry);

  const multiPlanCheck = canCreateStartupPlan(
    activeEntitlement,
    session.plans.length || 1
  );
  const coFounderCheck = canInviteCollaborator(activeEntitlement, 1);
  const aiCreditCheck = canConsumeAiCredits(activeEntitlement, 1);

  function handleSelectPlan(planId: string) {
    const found = session.plans.find((p) => p.id === planId);
    if (!found) return;
    const updated: BmuLocalSession = {
      ...session,
      activePlanId: found.id,
    };
    setSession(updated);
    saveBmuSession(updated);
    setSelectedCountry(found.hqCountryCode);
    if (found.brainDumpText) setBrainDumpText(found.brainDumpText);
    setConceptCanvas(found.conceptCanvas || null);
    setFounderMotivation(
      found.founderMotivation || {
        primaryMotivation: 'LEAVE_JOB',
        weeklyHoursAvailable: '15_TO_25_HRS',
        twelveMonthSuccessVision: '',
      }
    );
    setTeamAndBudget(
      found.teamAndBudget || {
        teamStructureType:
          session.user.teamStructure === 'CO_FOUNDERS'
            ? 'COFOUNDER_TEAM'
            : session.user.teamStructure === 'LOOKING_FOR_COFOUNDER'
              ? 'SEEKING_COFOUNDER'
              : 'SOLO_FOUNDER',
        skillCoverage: 'BUILD_IN_HOUSE',
        startingBudgetBracket: '1K_TO_5K',
        teamAndFundingNotes: '',
      }
    );
    setFounderRealityCheck(
      found.founderRealityCheck || {
        industryConnection: 'WARM_CONNECTIONS',
        personalIncomeUrgency: 'MEDIUM_6_TO_12M',
        dealbreakers: ['NO_PHYSICAL_PREMISES'],
        growthTradeoff: 'NON_DILUTIVE_GRANTS',
        biggestWorryPreset: 'FINDING_FIRST_10',
        biggestWorryNotes: '',
      }
    );
    setThingsToConsider(found.thingsToConsider || []);
    if (found.openQuestions) setOpenQuestions(found.openQuestions);
    setPlanDropdownOpen(false);
  }

  async function handleParkSpecificQuestion(questionText: string) {
    const clean = questionText.trim();
    if (!clean) return;
    if (!openQuestions.includes(clean)) {
      const next = [...openQuestions, clean];
      setOpenQuestions(next);
      await parkOpenQuestionAction({
        planId: currentPlan.id,
        questionText: clean,
      });
    }
  }

  function handleParkQuestion() {
    const newQ = `Confirm urgent customer pain point & average unit price (${countryPack.defaultCurrency}) with 3 target buyers in ${countryPack.countryName}.`;
    handleParkSpecificQuestion(newQ);
  }

  const effectiveCanvas: SavedConceptCanvas = conceptCanvas || {
    coreProblem: '',
    targetCustomer: '',
    proposedSolution: '',
    unfairAdvantage: '',
    revenueAndGrantFit: '',
  };

  // Live-computed 6-card Blind-Spot review that updates immediately as Steps 1-5 change
  const liveThingsToConsider: BlindSpotItem[] = buildDynamicModuleABlindSpots({
    planTitle: currentPlan.title,
    brainDumpText,
    industryCategory: currentPlan.industryCategory,
    hqCountryCode: selectedCountry,
    exportPotential: currentPlan.exportPotential,
    conceptCanvas: effectiveCanvas,
    founderMotivation,
    teamAndBudget,
    founderRealityCheck,
  });

  async function handleTidyUpNotesWithAi() {
    if (!aiCreditCheck.allowed) {
      setPaywallModalFeature(
        `AI Note Tidying (${aiCreditCheck.reason})`
      );
      return;
    }

    setIsSynthesizing(true);
    setSynthesisBanner(null);

    try {
      const result = await generateModuleAConceptCanvasAction({
        userId: session.user.id,
        planId: currentPlan.id,
        planTitle: currentPlan.title,
        brainDumpText,
        industryCategory: currentPlan.industryCategory,
        hqCountryCode: selectedCountry,
        exportPotential: currentPlan.exportPotential,
        draftCanvas: effectiveCanvas,
        founderMotivation,
        teamAndBudget,
        founderRealityCheck,
      });

      setConceptCanvas(result.canvas);
      setThingsToConsider(result.thingsToConsider);

      // Update local session store as well
      const updatedPlans = session.plans.map((p) =>
        p.id === currentPlan.id
          ? {
              ...p,
              brainDumpText,
              conceptCanvas: result.canvas,
              founderMotivation,
              teamAndBudget,
              founderRealityCheck,
              thingsToConsider: result.thingsToConsider,
            }
          : p
      );
      const updatedSession: BmuLocalSession = {
        ...session,
        entitlement: {
          ...session.entitlement,
          aiCreditsUsedThisMonth:
            result.creditsUsedAfter ??
            session.entitlement.aiCreditsUsedThisMonth + 1,
        },
        plans: updatedPlans,
      };
      setSession(updatedSession);
      saveBmuSession(updatedSession);

      setSynthesisBanner('✨ Your notes have been tidied up and saved!');
    } finally {
      setIsSynthesizing(false);
    }
  }

  async function handleSaveCanvasEdits() {
    setIsSavingCanvas(true);
    setSynthesisBanner(null);
    try {
      const toSave = effectiveCanvas;
      await saveModuleACanvasEditsAction({
        planId: currentPlan.id,
        brainDumpText,
        exportPotential: currentPlan.exportPotential,
        canvas: toSave,
        founderMotivation,
        teamAndBudget,
        founderRealityCheck,
        thingsToConsider: liveThingsToConsider,
      });
      setConceptCanvas(toSave);
      setThingsToConsider(liveThingsToConsider);
      setIsEditingCanvas(false);

      const updatedPlans = session.plans.map((p) =>
        p.id === currentPlan.id
          ? {
              ...p,
              brainDumpText,
              conceptCanvas: toSave,
              founderMotivation,
              teamAndBudget,
              founderRealityCheck,
              thingsToConsider: liveThingsToConsider,
            }
          : p
      );
      const updatedSession = { ...session, plans: updatedPlans };
      setSession(updatedSession);
      saveBmuSession(updatedSession);

      setSynthesisBanner('✅ Your notes and Step 6 Blind-Spot Review have been updated and saved!');
    } finally {
      setIsSavingCanvas(false);
    }
  }

  // Step 7: Live-Synced Startup Concept & Readiness Brief Data + Readiness Checklist
  const [showBriefPreview, setShowBriefPreview] = useState(true);
  const [briefCopied, setBriefCopied] = useState(false);

  const briefGeneratedDate = new Date().toLocaleDateString('en-IE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const canvasBoxValues = [
    effectiveCanvas.coreProblem,
    effectiveCanvas.targetCustomer,
    effectiveCanvas.proposedSolution,
    effectiveCanvas.unfairAdvantage,
    effectiveCanvas.revenueAndGrantFit,
  ];
  const filledCanvasBoxesCount = canvasBoxValues.filter(
    (val) => val.trim().length > 5
  ).length;

  const moduleAReadinessSteps = [
    {
      stepNumber: 1,
      label: 'Raw Idea Capture',
      isComplete: brainDumpText.trim().length >= 20,
      summary:
        brainDumpText.trim().length >= 20
          ? `${brainDumpText.trim().split(/\s+/).length} words captured`
          : 'Write your raw idea in Step 1 (at least a sentence)',
    },
    {
      stepNumber: 2,
      label: '1-Page Concept Canvas',
      isComplete: filledCanvasBoxesCount === 5,
      summary:
        filledCanvasBoxesCount === 5
          ? 'All 5/5 concept canvas boxes answered'
          : `${filledCanvasBoxesCount}/5 concept boxes answered in Step 2`,
    },
    {
      stepNumber: 3,
      label: 'Personal Ambition & Weekly Time',
      isComplete: Boolean(
        founderMotivation.primaryMotivation &&
          founderMotivation.weeklyHoursAvailable &&
          founderMotivation.twelveMonthSuccessVision.trim().length > 5
      ),
      summary:
        founderMotivation.twelveMonthSuccessVision.trim().length > 5
          ? `${MOTIVATION_LABELS[founderMotivation.primaryMotivation].replace(/^[^\w]+/, '')} • ${WEEKLY_HOURS_LABELS[founderMotivation.weeklyHoursAvailable]}`
          : 'Add your 12-month success vision note in Step 3',
    },
    {
      stepNumber: 4,
      label: 'Team Structure & Starting Budget',
      isComplete: Boolean(
        teamAndBudget.teamStructureType &&
          teamAndBudget.skillCoverage &&
          teamAndBudget.startingBudgetBracket &&
          teamAndBudget.teamAndFundingNotes.trim().length > 5
      ),
      summary:
        teamAndBudget.teamAndFundingNotes.trim().length > 5
          ? `${TEAM_STRUCTURE_LABELS[teamAndBudget.teamStructureType].replace(/^[^\w]+/, '')} • ${formatStartingBudgetBracket(teamAndBudget.startingBudgetBracket, countryPack.defaultCurrency)}`
          : 'Add your team & budget plan notes in Step 4',
    },
    {
      stepNumber: 5,
      label: 'Reality Check & Non-Negotiables',
      isComplete: Boolean(
        founderRealityCheck.industryConnection &&
          founderRealityCheck.personalIncomeUrgency &&
          founderRealityCheck.dealbreakers.length > 0 &&
          founderRealityCheck.growthTradeoff &&
          founderRealityCheck.biggestWorryPreset &&
          founderRealityCheck.biggestWorryNotes.trim().length > 5
      ),
      summary:
        founderRealityCheck.biggestWorryNotes.trim().length > 5
          ? `${founderRealityCheck.dealbreakers.length} dealbreaker(s) • ${GROWTH_TRADEOFF_LABELS[founderRealityCheck.growthTradeoff].replace(/^[^\w]+/, '')}`
          : 'Write a quick note on your #1 worry in Step 5',
    },
    {
      stepNumber: 6,
      label: 'Co-Founder Blind-Spot Review',
      isComplete:
        liveThingsToConsider.length >= 6 && filledCanvasBoxesCount === 5,
      summary:
        filledCanvasBoxesCount === 5
          ? `${liveThingsToConsider.length} tailored blind-spot cards reviewed`
          : `${liveThingsToConsider.length} live cards adapting as you answer Steps 1–5`,
    },
  ];

  const completedReadinessCount = moduleAReadinessSteps.filter(
    (s) => s.isComplete
  ).length;

  // Granular live progress percentage across all 20 required inputs in Module A (Steps 1-6)
  const moduleACheckpoints = [
    brainDumpText.trim().length >= 20,
    effectiveCanvas.coreProblem.trim().length > 5,
    effectiveCanvas.targetCustomer.trim().length > 5,
    effectiveCanvas.proposedSolution.trim().length > 5,
    effectiveCanvas.unfairAdvantage.trim().length > 5,
    effectiveCanvas.revenueAndGrantFit.trim().length > 5,
    Boolean(founderMotivation.primaryMotivation),
    Boolean(founderMotivation.weeklyHoursAvailable),
    founderMotivation.twelveMonthSuccessVision.trim().length > 5,
    Boolean(teamAndBudget.teamStructureType),
    Boolean(teamAndBudget.skillCoverage),
    Boolean(teamAndBudget.startingBudgetBracket),
    teamAndBudget.teamAndFundingNotes.trim().length > 5,
    Boolean(founderRealityCheck.industryConnection),
    Boolean(founderRealityCheck.personalIncomeUrgency),
    founderRealityCheck.dealbreakers.length > 0,
    Boolean(founderRealityCheck.growthTradeoff),
    Boolean(founderRealityCheck.biggestWorryPreset),
    founderRealityCheck.biggestWorryNotes.trim().length > 5,
    liveThingsToConsider.length >= 6,
  ];
  const moduleAProgressPercent = Math.round(
    (moduleACheckpoints.filter(Boolean).length / moduleACheckpoints.length) *
      100
  );

  const moduleABriefData: ModuleABriefData = {
    planTitle: currentPlan.title,
    founderName: session.user.name,
    industryCategory: currentPlan.industryCategory,
    hqCountryCode: selectedCountry,
    exportPotential: currentPlan.exportPotential,
    brainDumpText,
    conceptCanvas: effectiveCanvas,
    founderMotivation,
    teamAndBudget,
    founderRealityCheck,
    thingsToConsider: liveThingsToConsider,
    openQuestions,
    whiteLabelEnabled: activeEntitlement.whiteLabelExportEnabled,
  };

  function handleDownloadBriefHtml() {
    if (!activeEntitlement.isVaultReadonly) {
      handleSaveCanvasEdits().catch(() => {});
    }
    const htmlContent = buildModuleAStandaloneHtmlDocument(moduleABriefData);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeSlug =
      currentPlan.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'startup';
    link.href = url;
    link.download = `${safeSlug}-concept-readiness-brief.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setSynthesisBanner(
      '📄 Downloaded your standalone Startup Concept & Readiness Brief (.html)!'
    );
  }

  function handlePrintBriefPdf() {
    if (!activeEntitlement.isVaultReadonly) {
      handleSaveCanvasEdits().catch(() => {});
    }
    const htmlContent = buildModuleAStandaloneHtmlDocument(moduleABriefData);
    const printWindow = window.open('', '_blank', 'width=960,height=800');
    if (!printWindow) {
      handleDownloadBriefHtml();
      return;
    }
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }

  async function handleCopyBriefMarkdown() {
    const markdown = buildModuleAMarkdownBrief(moduleABriefData);
    try {
      await navigator.clipboard.writeText(markdown);
      setBriefCopied(true);
      setSynthesisBanner(
        '📋 Copied your complete Module A Startup Concept & Readiness Brief to clipboard!'
      );
      setTimeout(() => setBriefCopied(false), 3000);
    } catch {
      // Fallback if clipboard API is restricted
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      {/* Clean Production Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-3.5">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-xs hover:opacity-95"
              title="Back to Home"
            >
              <Sparkles className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-slate-900">
                  Build My Unicorn
                </span>
                <span className="text-slate-300">/</span>
                <span className="text-sm font-semibold text-indigo-700">
                  {currentPlan.title}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {countryPack.countryName} ({countryPack.defaultCurrency}) •{' '}
                {currentPlan.industryCategory}
              </p>
            </div>
          </div>

          {/* Right User & Co-Pilot Actions */}
          <div className="flex items-center gap-2.5">
            <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs sm:flex">
              <span className="font-semibold text-slate-800">
                {session.user.name}
              </span>
              <Badge variant="secondary" className="text-[10px]">
                {activeEntitlement.planType}
              </Badge>
            </div>

            <Link href="/onboarding">
              <Button variant="ghost" size="sm" className="text-xs text-slate-600">
                <UserCheck className="h-3.5 w-3.5 text-indigo-600" />
                Plan Settings
              </Button>
            </Link>

            <Link
              href="/login"
              onClick={() => {
                logoutFounderAction().catch(() => {});
              }}
            >
              <Button variant="ghost" size="sm" className="text-xs text-slate-600">
                <LogOut className="h-3.5 w-3.5 text-slate-500" />
                Sign Out
              </Button>
            </Link>

            <Button
              size="sm"
              onClick={() => setAskUnicornOpen(!askUnicornOpen)}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700"
            >
              <Bot className="h-4 w-4" />
              Ask Unicorn AI
            </Button>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* MAIN FOUNDER WORKSPACE                                    */}
      {/* ========================================================= */}
      <div className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-12">
        {/* LEFT SIDEBAR: Multi-Plan Switcher + Modules A-G + Open Questions Parking Lot */}
        <aside className="space-y-5 lg:col-span-4 xl:col-span-3">
          {/* Multi-Plan Switcher Card */}
          <div className="relative rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
            <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <span>Active Startup Plan</span>
              <span>
                {session.plans.length || 1} /{' '}
                {activeEntitlement.maxStartupPlans} Plans
              </span>
            </div>
            <button
              type="button"
              onClick={() => setPlanDropdownOpen(!planDropdownOpen)}
              className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-left transition-colors hover:bg-slate-100"
            >
              <div className="min-w-0 pr-2">
                <div className="truncate text-sm font-bold text-slate-900">
                  {currentPlan.title}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                    {selectedCountry} • {countryPack.defaultCurrency}
                  </Badge>
                  <span className="truncate">
                    {currentPlan.industryCategory}
                  </span>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
            </button>

            {/* Dropdown Menu for Switching Plans, Creating New Plan, or Cloning Pivot */}
            {planDropdownOpen && (
              <div className="absolute left-0 right-0 top-full z-20 mt-1.5 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                <div className="px-2 py-1 text-[11px] font-semibold text-slate-400">
                  YOUR STARTUP PLANS
                </div>
                {session.plans.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPlan(p.id)}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs ${
                      p.id === currentPlan.id
                        ? 'bg-indigo-50 font-semibold text-indigo-900'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div>{p.title}</div>
                      <div className="text-[11px] text-slate-400">
                        {p.hqCountryCode} ({p.baseCurrency}) •{' '}
                        {p.industryCategory}
                      </div>
                    </div>
                    {p.id === currentPlan.id && (
                      <Check className="h-4 w-4 shrink-0 text-indigo-600" />
                    )}
                  </button>
                ))}

                <div className="my-1.5 border-t border-slate-100" />

                <button
                  type="button"
                  onClick={() => {
                    setPlanDropdownOpen(false);
                    if (!multiPlanCheck.allowed) {
                      setPaywallModalFeature(
                        `Create a 2nd Startup Plan (${multiPlanCheck.reason})`
                      );
                    } else {
                      window.location.href = '/onboarding';
                    }
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                >
                  <span className="flex items-center gap-1.5">
                    <Plus className="h-3.5 w-3.5" />+ Create New Startup Idea
                  </span>
                  {!multiPlanCheck.allowed && (
                    <Lock className="h-3.5 w-3.5 text-amber-600" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPlanDropdownOpen(false);
                    if (!multiPlanCheck.allowed) {
                      setPaywallModalFeature(
                        'Clone & Pivot Plan (Test a B2B vs. B2C variation without losing your original plan)'
                      );
                    }
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <span className="flex items-center gap-1.5">
                    <GitBranch className="h-3.5 w-3.5 text-violet-600" />
                    Clone &amp; Pivot Current Plan
                  </span>
                  {!multiPlanCheck.allowed && (
                    <Lock className="h-3.5 w-3.5 text-amber-600" />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Module A - G Navigation List */}
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
            <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Founder Journey (Modules A–G)
            </div>
            <div className="space-y-1">
              {MODULES_LIST.map((mod, idx) => {
                const access = canAccessModule(activeEntitlement, mod.code);
                const IconComponent = mod.icon;
                const isCurrent = idx === 0;
                return (
                  <button
                    key={mod.code}
                    type="button"
                    onClick={() => {
                      if (!access.allowed) {
                        setPaywallModalFeature(
                          `${mod.short}: ${mod.title} — ${access.reason}`
                        );
                      }
                    }}
                    className={`group flex w-full items-start gap-2.5 rounded-lg p-2.5 text-left transition-all ${
                      isCurrent
                        ? 'bg-indigo-50/90 ring-1 ring-indigo-200'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                        isCurrent
                          ? 'bg-indigo-600 text-white'
                          : access.allowed
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-xs font-bold ${
                            isCurrent ? 'text-indigo-950' : 'text-slate-800'
                          }`}
                        >
                          {mod.short}: {mod.title}
                        </span>
                        {!access.allowed ? (
                          <Lock className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                        ) : isCurrent ? (
                          <span
                            className={`text-[10px] font-bold ${
                              moduleAProgressPercent === 100
                                ? 'text-emerald-600'
                                : 'text-indigo-600'
                            }`}
                          >
                            {moduleAProgressPercent}%
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-slate-500">
                        {mod.subtitle}
                      </p>
                      {isCurrent && (
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-indigo-100">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              moduleAProgressPercent === 100
                                ? 'bg-emerald-500'
                                : 'bg-indigo-600'
                            }`}
                            style={{ width: `${moduleAProgressPercent}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* CENTER WORKSPACE: Module A Guided Step + 4-Layer Support + 1-Page Mirror + Blind-Spot Engine */}
        <main className="space-y-6 lg:col-span-8 xl:col-span-9">
          {/* Read-Only Vault Banner if Expired */}
          {activeEntitlement.isVaultReadonly && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <strong>Read-Only Vault Mode Active:</strong> Your 6-Month
                  Pass has expired. Your startup plan is safely preserved for
                  viewing and exporting, but AI editing is paused.
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => setSelectedTierPreset('SIX_MONTH_COFOUNDER')}
              >
                Reactivate Pass (€29)
              </Button>
            </div>
          )}

          {/* Step Header Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="default">Module A • Ideation</Badge>
                  <span className="text-xs font-medium text-slate-500">
                    Steps 1–7: Idea → Canvas → Why → Team &amp; Budget → Reality Check → Blind-Spots → Download Brief
                  </span>
                </div>
                <h1 className="mt-2 text-xl font-bold text-slate-900">
                  Let&apos;s capture your raw idea for{' '}
                  <span className="text-indigo-600">{currentPlan.title}</span>
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Follow our <strong>Capture First, Expand Second</strong> rule:
                  don&apos;t worry about buzzwords. Tell us what breaks today
                  and who you are helping.
                </p>
              </div>

              {/* Co-Founder Invite Button (Shows Entitlement Gate) */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!coFounderCheck.allowed) {
                    setPaywallModalFeature(
                      `Invite Co-Founder (${coFounderCheck.reason})`
                    );
                  }
                }}
              >
                <Users className="h-4 w-4 text-indigo-600" />
                Invite Co-Founder
                {!coFounderCheck.allowed && (
                  <Lock className="ml-1 h-3 w-3 text-amber-500" />
                )}
              </Button>
            </div>

            {/* LAYER 1 SUPPORT BAR: Why Are We Asking This? + Show Me an Example + Jargon Tooltip */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowWhyCard(!showWhyCard)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    showWhyCard
                      ? 'bg-indigo-100 text-indigo-900'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <HelpCircle className="h-3.5 w-3.5 text-indigo-600" />
                  Why Are We Asking This?
                </button>

                <button
                  type="button"
                  onClick={() => setShowExamples(!showExamples)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    showExamples
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Lightbulb className="h-3.5 w-3.5 text-emerald-600" />
                  Show Me an Example ({currentPlan.industryCategory})
                </button>
              </div>

              {/* Inline Jargon Pill */}
              <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                <Info className="h-3.5 w-3.5 text-slate-400" />
                <span>Jargon Free:</span>
                <span
                  className="cursor-help font-semibold text-indigo-600 underline decoration-dotted"
                  title="Value Proposition simply means: Why would a busy customer pick your solution instead of doing nothing?"
                >
                  What is a Value Proposition?
                </span>
              </div>
            </div>

            {/* Collapsible Micro-Coaching Card (Replaces Videos!) */}
            {showWhyCard && (
              <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/70 p-4 text-xs text-indigo-950">
                <div className="font-bold text-indigo-900">
                  💡 Micro-Coaching (30-Second Read — No 20-Minute Videos):
                </div>
                <p className="mt-1 leading-relaxed text-indigo-900/90">
                  90% of first-time founders get stuck trying to sound like a
                  corporate textbook. Investors and grant boards (like{' '}
                  <strong>
                    {countryGrants[0]?.grantName || 'Local Enterprise Grants'}
                  </strong>
                  ) actually want to hear the{' '}
                  <strong>specific real-world trigger</strong>: who loses time
                  or money today, how they currently hack around it with
                  spreadsheets, and what your product automates.
                </p>
              </div>
            )}

            {/* Collapsible Industry Examples Card */}
            {showExamples && (
              <div className="mt-3 grid grid-cols-1 gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs md:grid-cols-3">
                <div className="flex flex-col justify-between rounded-lg bg-white p-3 shadow-2xs">
                  <div>
                    <div className="font-bold text-emerald-800">
                      1. B2B SaaS Example
                    </div>
                    <p className="mt-1 text-slate-600">
                      &ldquo;Independent grocers lose{' '}
                      {formatPlanCurrency(1800, countryPack.defaultCurrency)}/wk
                      in expired fresh food because staff check dates manually on
                      Friday nights.&rdquo;
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setBrainDumpText(
                        `Independent grocers lose ${formatPlanCurrency(1800, countryPack.defaultCurrency)}/wk in expired fresh food because staff check dates manually on Friday nights. Our mobile app scans shelf labels and automatically triggers 40% markdown alerts 48 hours before expiry.`
                      )
                    }
                    className="mt-2 self-start text-[11px] font-semibold text-emerald-700 underline hover:text-emerald-900"
                  >
                    Use This Example →
                  </button>
                </div>
                <div className="flex flex-col justify-between rounded-lg bg-white p-3 shadow-2xs">
                  <div>
                    <div className="font-bold text-emerald-800">
                      2. Service / Agency Example
                    </div>
                    <p className="mt-1 text-slate-600">
                      &ldquo;Local dental clinics miss 30% of new patient calls
                      during lunch hours. We provide a 24/7 AI WhatsApp booking
                      concierge.&rdquo;
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setBrainDumpText(
                        'Local dental clinics miss 30% of new patient calls during lunch hours and evenings. We provide a 24/7 AI WhatsApp booking concierge that books hygiene & emergency slots directly into their calendar.'
                      )
                    }
                    className="mt-2 self-start text-[11px] font-semibold text-emerald-700 underline hover:text-emerald-900"
                  >
                    Use This Example →
                  </button>
                </div>
                <div className="flex flex-col justify-between rounded-lg bg-white p-3 shadow-2xs">
                  <div>
                    <div className="font-bold text-emerald-800">
                      3. Physical / Consumer Product
                    </div>
                    <p className="mt-1 text-slate-600">
                      &ldquo;Commuters in rainy cities ruin leather work shoes. We
                      make breathable waterproof merino slip-ons.&rdquo;
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setBrainDumpText(
                        'Urban bike and rail commuters in rainy cities ruin smart leather work shoes or have to carry a spare pair in their backpack. We make breathable waterproof merino wool dress slip-ons.'
                      )
                    }
                    className="mt-2 self-start text-[11px] font-semibold text-emerald-700 underline hover:text-emerald-900"
                  >
                    Use This Example →
                  </button>
                </div>
              </div>
            )}

            {/* Guided Brain Dump Input */}
            <div className="mt-5">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <label className="text-sm font-semibold text-slate-800">
                  Your Raw Idea Brain Dump
                </label>
                <div className="flex items-center gap-2">
                  {/* Layer 2: "I'm Stuck — Help Me Break This Down" */}
                  <button
                    type="button"
                    onClick={() => setShowImStuckHelper(!showImStuckHelper)}
                    className="inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-100"
                  >
                    <Wand2 className="h-3.5 w-3.5" />
                    I&apos;m Stuck — Break This Into 3 Easy Questions
                  </button>
                </div>
              </div>

              {/* "I'm Stuck" 3-Question Sub-Prompt Helper */}
              {showImStuckHelper && (
                <div className="mb-3 rounded-xl border border-violet-200 bg-violet-50/70 p-3.5 text-xs text-violet-950">
                  <div className="font-bold">
                    ✨ Ask Unicorn Sub-Question Breakdown:
                  </div>
                  <ol className="mt-1.5 list-inside list-decimal space-y-1 text-violet-900">
                    <li>
                      Who is the exact person getting frustrated every week?
                    </li>
                    <li>
                      What annoying manual task are they doing right now to
                      cope?
                    </li>
                    <li>
                      If your product worked like magic tomorrow, what result
                      would they get in 10 minutes?
                    </li>
                  </ol>
                </div>
              )}

              <textarea
                rows={4}
                disabled={activeEntitlement.isVaultReadonly || isSavingCanvas}
                value={brainDumpText}
                onChange={(e) => setBrainDumpText(e.target.value)}
                placeholder="Write your idea in your own words — who is struggling, what costs them time or money today, and how your product helps..."
                className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-sm leading-relaxed text-slate-900 shadow-2xs focus:border-indigo-600 focus:outline-none disabled:opacity-60"
              />

              {/* Step 1 Save Bar: Keep Founder's Exact Words */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  💬 <strong>Your exact words stay here.</strong> There are no
                  right or wrong answers — just get your initial thoughts down.
                </div>
                {!activeEntitlement.isVaultReadonly && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isSavingCanvas}
                    onClick={handleSaveCanvasEdits}
                  >
                    {isSavingCanvas ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" />
                        Save My Raw Idea
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* STEP 2: FLESH OUT YOUR IDEA (USER-TYPED 5-BLOCK CONCEPT CANVAS + AI TIDY UP) */}
          <Card>
            <CardHeader className="pb-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  Step 2: Flesh Out Your Idea (1-Page Concept Canvas)
                </CardTitle>
                <CardDescription className="mt-1">
                  Type your thoughts into the 5 boxes below to help you think
                  through how your idea works.{' '}
                  <strong className="text-slate-700">
                    There are no right or wrong answers
                  </strong>{' '}
                  — write in plain English, save your exact notes, or click{' '}
                  <strong className="text-indigo-700">
                    Tidy Up My Notes with AI
                  </strong>{' '}
                  at the bottom of this card anytime to polish your wording.
                </CardDescription>
              </div>

              {synthesisBanner && (
                <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-900">
                  <span>{synthesisBanner}</span>
                  <button
                    type="button"
                    onClick={() => setSynthesisBanner(null)}
                    className="ml-3 text-[11px] font-bold underline opacity-75 hover:opacity-100"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Box 1: The Core Problem */}
                <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                      1. The Core Problem
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      What frustrating problem are people dealing with today,
                      and what does it cost them?
                    </p>
                  </div>
                  <textarea
                    rows={4}
                    disabled={activeEntitlement.isVaultReadonly}
                    value={effectiveCanvas.coreProblem}
                    onChange={(e) =>
                      setConceptCanvas({
                        ...effectiveCanvas,
                        coreProblem: e.target.value,
                      })
                    }
                    placeholder="Type your answer here... (e.g., Shop owners waste 3 hours every Friday checking expiry dates by hand)"
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs leading-relaxed text-slate-800 shadow-2xs focus:border-indigo-600 focus:outline-none disabled:opacity-60"
                  />
                </div>

                {/* Box 2: Target Customer */}
                <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                      2. Target Customer
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Who is the very first type of customer you want to help in{' '}
                      {countryPack.countryName} (or beyond)?
                    </p>
                  </div>
                  <textarea
                    rows={4}
                    disabled={activeEntitlement.isVaultReadonly}
                    value={effectiveCanvas.targetCustomer}
                    onChange={(e) =>
                      setConceptCanvas({
                        ...effectiveCanvas,
                        targetCustomer: e.target.value,
                      })
                    }
                    placeholder={`Type your answer here... (e.g., Independent grocers and convenience stores in ${countryPack.countryName})`}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs leading-relaxed text-slate-800 shadow-2xs focus:border-indigo-600 focus:outline-none disabled:opacity-60"
                  />
                </div>

                {/* Box 3: Your Solution */}
                <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                      3. Your Solution
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      In plain English, how does your product or service fix the
                      problem for them?
                    </p>
                  </div>
                  <textarea
                    rows={4}
                    disabled={activeEntitlement.isVaultReadonly}
                    value={effectiveCanvas.proposedSolution}
                    onChange={(e) =>
                      setConceptCanvas({
                        ...effectiveCanvas,
                        proposedSolution: e.target.value,
                      })
                    }
                    placeholder="Type your answer here... (e.g., A simple phone app that scans shelf labels and alerts staff 48 hours before items expire)"
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs leading-relaxed text-slate-800 shadow-2xs focus:border-indigo-600 focus:outline-none disabled:opacity-60"
                  />
                </div>

                {/* Box 4: Why You Win (Unfair Edge) */}
                <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                      4. Why Customers Pick You
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Why will customers choose your idea over doing nothing or
                      using spreadsheets?
                    </p>
                  </div>
                  <textarea
                    rows={4}
                    disabled={activeEntitlement.isVaultReadonly}
                    value={effectiveCanvas.unfairAdvantage}
                    onChange={(e) =>
                      setConceptCanvas({
                        ...effectiveCanvas,
                        unfairAdvantage: e.target.value,
                      })
                    }
                    placeholder="Type your answer here... (e.g., Takes 5 minutes to set up with no complicated IT systems needed)"
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs leading-relaxed text-slate-800 shadow-2xs focus:border-indigo-600 focus:outline-none disabled:opacity-60"
                  />
                </div>

                {/* Box 5: How You Make Money & Grant Fit */}
                <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 md:col-span-2 lg:col-span-2">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                      5. How You Charge &amp; Funding Thoughts (
                      {countryPack.countryName} — {countryPack.defaultCurrency})
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      How do you think you&apos;ll charge customers (e.g.,
                      monthly fee, one-off sale, commission)? Any rough price in{' '}
                      {countryPack.defaultCurrency} is fine!
                    </p>
                  </div>
                  <textarea
                    rows={4}
                    disabled={activeEntitlement.isVaultReadonly}
                    value={effectiveCanvas.revenueAndGrantFit}
                    onChange={(e) =>
                      setConceptCanvas({
                        ...effectiveCanvas,
                        revenueAndGrantFit: e.target.value,
                      })
                    }
                    placeholder={`Type your answer here... (e.g., Monthly subscription around ${formatPlanCurrency(99, countryPack.defaultCurrency)}/month per shop, plus exploring ${countryGrants[0]?.grantName || 'local startup grants'})`}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs leading-relaxed text-slate-800 shadow-2xs focus:border-indigo-600 focus:outline-none disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Step 2 Bottom Save & AI Tidy Up Bar */}
              {!activeEntitlement.isVaultReadonly && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3.5">
                  <div className="text-xs text-slate-500">
                    💡 Save your own notes directly, or let Ask Unicorn tidy up your wording while keeping your meaning.
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isSavingCanvas || isSynthesizing}
                      onClick={handleSaveCanvasEdits}
                    >
                      {isSavingCanvas ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-3.5 w-3.5" />
                          Save My Notes
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={isSynthesizing || isSavingCanvas}
                      onClick={handleTidyUpNotesWithAi}
                    >
                      {isSynthesizing ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Tidying Up Your Notes...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5" />
                          Tidy Up My Notes with AI
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* STEP 3: YOUR PERSONAL "WHY" & AMBITION (FOUNDER MOTIVATION) */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                    3
                  </span>
                  Step 3: Your Personal &ldquo;Why&rdquo; &amp; Ambition
                  <Badge variant="success">No Right or Wrong Answer</Badge>
                </CardTitle>
                <CardDescription className="mt-1">
                  Build My Unicorn adapts its coaching to match <strong>your</strong> personal goals — whether you want to replace your 9-to-5 salary, build a weekend side hustle, champion a mission, or scale a venture-backed company.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* 1. Primary Motivation Cards */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  1. What is driving you to build this? (Pick what fits best right now)
                </label>
                <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {(
                    [
                      {
                        id: 'LEAVE_JOB' as FounderMotivationType,
                        emoji: '💼',
                        title: 'Leave My 9-to-5 & Be My Own Boss',
                        subtitle:
                          'Replace my current income, gain freedom over my schedule, and build a sustainable business I own.',
                      },
                      {
                        id: 'SIDE_HUSTLE' as FounderMotivationType,
                        emoji: '🌙',
                        title: 'Build a Profitable Side Hustle',
                        subtitle:
                          'Keep my day job for now while building a low-overhead extra income stream on evenings and weekends.',
                      },
                      {
                        id: 'SAVE_THE_WORLD' as FounderMotivationType,
                        emoji: '🌍',
                        title: 'Solve a Mission I Care About',
                        subtitle:
                          'Fix a broken problem in my community or industry and create meaningful social, environmental, or human impact.',
                      },
                      {
                        id: 'SCALE_STARTUP' as FounderMotivationType,
                        emoji: '🚀',
                        title: 'Scale a High-Growth Startup',
                        subtitle:
                          'Build a fast-growing company, hire a team, and potentially apply for state grants or raise investor funding.',
                      },
                      {
                        id: 'BUILD_TO_SELL' as FounderMotivationType,
                        emoji: '🏆',
                        title: 'Build a Company & Sell It',
                        subtitle:
                          'Create a valuable, systemised business asset with recurring revenue that an acquirer or competitor will want to buy.',
                      },
                    ] as const
                  ).map((option) => {
                    const isSelected =
                      founderMotivation.primaryMotivation === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        disabled={activeEntitlement.isVaultReadonly}
                        onClick={() =>
                          setFounderMotivation({
                            ...founderMotivation,
                            primaryMotivation: option.id,
                          })
                        }
                        className={`flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-600/20 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                        } disabled:opacity-60`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xl">{option.emoji}</span>
                            {isSelected && (
                              <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                Selected
                              </span>
                            )}
                          </div>
                          <div className="mt-2 text-xs font-bold text-slate-900">
                            {option.title}
                          </div>
                          <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                            {option.subtitle}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Weekly Hours Available */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  2. How much time can you realistically give this each week?
                </label>
                <div className="mt-2 flex flex-wrap gap-2.5">
                  {(
                    [
                      {
                        id: '5_TO_10_HRS' as FounderWeeklyHours,
                        label: '⏰ 5–10 hrs / week (Evenings & Weekends)',
                      },
                      {
                        id: '15_TO_25_HRS' as FounderWeeklyHours,
                        label: '⚡ 15–25 hrs / week (Part-Time Focus)',
                      },
                      {
                        id: '40_PLUS_HRS' as FounderWeeklyHours,
                        label: '🔥 40+ hrs / week (Full-Time All-In)',
                      },
                    ] as const
                  ).map((pill) => {
                    const isSelected =
                      founderMotivation.weeklyHoursAvailable === pill.id;
                    return (
                      <button
                        key={pill.id}
                        type="button"
                        disabled={activeEntitlement.isVaultReadonly}
                        onClick={() =>
                          setFounderMotivation({
                            ...founderMotivation,
                            weeklyHoursAvailable: pill.id,
                          })
                        }
                        className={`rounded-lg border px-3.5 py-2 text-xs font-semibold transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-600 text-white shadow-2xs'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                        } disabled:opacity-60`}
                      >
                        {pill.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Personal 12-Month Success Vision */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  3. In your own words: What does &ldquo;success&rdquo; look like for you 12 months from today?
                </label>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Be honest with yourself — e.g., &ldquo;Making {formatPlanCurrency(4000, countryPack.defaultCurrency)}/month so I can hand in my notice&rdquo;, &ldquo;10 paying local shops using it every week&rdquo;, or &ldquo;Helping 500 families in my community&rdquo;.
                </p>
                <textarea
                  rows={3}
                  disabled={activeEntitlement.isVaultReadonly}
                  value={founderMotivation.twelveMonthSuccessVision}
                  onChange={(e) =>
                    setFounderMotivation({
                      ...founderMotivation,
                      twelveMonthSuccessVision: e.target.value,
                    })
                  }
                  placeholder="Write what 12-month success looks like for your life and business..."
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs leading-relaxed text-slate-800 shadow-2xs focus:border-indigo-600 focus:outline-none disabled:opacity-60"
                />
              </div>

              {/* Step 3 Bottom Save Bar */}
              {!activeEntitlement.isVaultReadonly && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3.5">
                  <div className="text-xs text-slate-500">
                    🎯 Your personal ambition shapes how Ask Unicorn coaches you across Modules A–G.
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isSavingCanvas}
                    onClick={handleSaveCanvasEdits}
                  >
                    {isSavingCanvas ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" />
                        Save My Motivation
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* STEP 4: YOUR TEAM & STARTING BUDGET (DAY-1 RESOURCES) */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                    4
                  </span>
                  Step 4: Your Team &amp; Starting Budget (Day-1 Resources)
                  <Badge variant="secondary">Realistic Guardrails</Badge>
                </CardTitle>
                <CardDescription className="mt-1">
                  Whether you are a solo founder bootstrapping with{' '}
                  {formatPlanCurrency(0, countryPack.defaultCurrency)} or a
                  co-founder team with savings ready to invest, knowing your
                  starting team and budget helps us tailor your MVP path and{' '}
                  {countryPack.countryName} grant options.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* 1. Team Structure Cards */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  1. Who is building this right now? (Solo vs. Team)
                </label>
                <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {(
                    [
                      {
                        id: 'SOLO_FOUNDER' as PlanTeamStructureType,
                        emoji: '👤',
                        title: 'Flying Solo (100% Me)',
                        subtitle:
                          'I am building, testing, and running this on my own for now.',
                      },
                      {
                        id: 'SEEKING_COFOUNDER' as PlanTeamStructureType,
                        emoji: '🤝',
                        title: 'Solo, Looking for a Co-Founder',
                        subtitle:
                          'Starting alone today, but I want to bring on a partner to share skills & workload.',
                      },
                      {
                        id: 'COFOUNDER_TEAM' as PlanTeamStructureType,
                        emoji: '👥',
                        title: 'Co-Founder Team (2+ Founders)',
                        subtitle:
                          'We are splitting ownership and building this business together.',
                      },
                      {
                        id: 'SOLO_PLUS_CONTRACTORS' as PlanTeamStructureType,
                        emoji: '🛠️',
                        title: 'Solo + Freelancers / Agency',
                        subtitle:
                          'I own it solo, bringing in paid contractors or specialists for specific tasks.',
                      },
                    ] as const
                  ).map((option) => {
                    const isSelected =
                      teamAndBudget.teamStructureType === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        disabled={activeEntitlement.isVaultReadonly}
                        onClick={() =>
                          setTeamAndBudget({
                            ...teamAndBudget,
                            teamStructureType: option.id,
                          })
                        }
                        className={`flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-600/20 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                        } disabled:opacity-60`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xl">{option.emoji}</span>
                            {isSelected && (
                              <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                Selected
                              </span>
                            )}
                          </div>
                          <div className="mt-2 text-xs font-bold text-slate-900">
                            {option.title}
                          </div>
                          <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                            {option.subtitle}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. In-House Skill Coverage Check */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  2. Do you have the skills in-house to build &amp; deliver Version 1?
                </label>
                <div className="mt-2 flex flex-wrap gap-2.5">
                  {(
                    [
                      {
                        id: 'BUILD_IN_HOUSE' as TeamSkillCoverageType,
                        label:
                          '✅ Yes — I/we can build & deliver Version 1 ourselves',
                      },
                      {
                        id: 'PARTIAL_SKILLS' as TeamSkillCoverageType,
                        label:
                          '🧩 Mostly — I/we have domain/sales skills, but need help with tech or build',
                      },
                      {
                        id: 'NEED_EXTERNAL_BUILDER' as TeamSkillCoverageType,
                        label:
                          '🚨 No — I/we will need to hire someone or find a co-founder to build it',
                      },
                    ] as const
                  ).map((pill) => {
                    const isSelected =
                      teamAndBudget.skillCoverage === pill.id;
                    return (
                      <button
                        key={pill.id}
                        type="button"
                        disabled={activeEntitlement.isVaultReadonly}
                        onClick={() =>
                          setTeamAndBudget({
                            ...teamAndBudget,
                            skillCoverage: pill.id,
                          })
                        }
                        className={`rounded-lg border px-3.5 py-2 text-xs font-semibold transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-600 text-white shadow-2xs'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                        } disabled:opacity-60`}
                      >
                        {pill.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Starting Capital / Investment Buckets */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  3. How much money do you have to invest in getting this idea started? ({countryPack.defaultCurrency})
                </label>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Pick the bucket that feels realistic for your personal savings or current team kitty — we use this to protect your cashflow and check grant match-funding rules.
                </p>
                <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {(
                    [
                      {
                        id: 'ZERO_SWEAT_EQUITY' as StartingBudgetBracket,
                        emoji: '🌱',
                        amountLabel: `${formatPlanCurrency(0, countryPack.defaultCurrency)} (Sweat Equity)`,
                        subtitle:
                          'Bootstrapping with my time, free tools, and early customer pre-sales only.',
                      },
                      {
                        id: 'UNDER_1K' as StartingBudgetBracket,
                        emoji: '☕',
                        amountLabel: `Under ${formatPlanCurrency(1000, countryPack.defaultCurrency)}`,
                        subtitle:
                          'Micro-budget for a domain, basic software tools, and scrappy validation tests.',
                      },
                      {
                        id: '1K_TO_5K' as StartingBudgetBracket,
                        emoji: '🧱',
                        amountLabel: `${formatPlanCurrency(1000, countryPack.defaultCurrency)} – ${formatPlanCurrency(5000, countryPack.defaultCurrency)}`,
                        subtitle:
                          'Seed savings for a lean prototype, company registration, and initial marketing.',
                      },
                      {
                        id: '5K_TO_25K' as StartingBudgetBracket,
                        emoji: '🚀',
                        amountLabel: `${formatPlanCurrency(5000, countryPack.defaultCurrency)} – ${formatPlanCurrency(25000, countryPack.defaultCurrency)}`,
                        subtitle:
                          'Solid runway to fund MVP build, equipment, or upfront match-funding for state grants.',
                      },
                      {
                        id: 'OVER_25K' as StartingBudgetBracket,
                        emoji: '🏦',
                        amountLabel: `${formatPlanCurrency(25000, countryPack.defaultCurrency)}+`,
                        subtitle:
                          'Well capitalized with personal funds or early backing ready to deploy carefully.',
                      },
                    ] as const
                  ).map((bucket) => {
                    const isSelected =
                      teamAndBudget.startingBudgetBracket === bucket.id;
                    return (
                      <button
                        key={bucket.id}
                        type="button"
                        disabled={activeEntitlement.isVaultReadonly}
                        onClick={() =>
                          setTeamAndBudget({
                            ...teamAndBudget,
                            startingBudgetBracket: bucket.id,
                          })
                        }
                        className={`flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-600/20 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                        } disabled:opacity-60`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xl">{bucket.emoji}</span>
                            {isSelected && (
                              <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                Selected
                              </span>
                            )}
                          </div>
                          <div className="mt-2 text-xs font-bold text-slate-900">
                            {bucket.amountLabel}
                          </div>
                          <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                            {bucket.subtitle}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Deeper Team & Funding Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  4. Go Deeper: Tell us about your team skills, missing roles, or how you plan to fund the gap
                </label>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  E.g., &ldquo;I have 8 years in grocery retail operations, looking for a technical co-founder&rdquo; or &ldquo;Putting in {formatPlanCurrency(3000, countryPack.defaultCurrency)} from savings and hoping to apply for {countryGrants[0]?.grantName || 'a local feasibility grant'}&rdquo;.
                </p>
                <textarea
                  rows={3}
                  disabled={activeEntitlement.isVaultReadonly}
                  value={teamAndBudget.teamAndFundingNotes}
                  onChange={(e) =>
                    setTeamAndBudget({
                      ...teamAndBudget,
                      teamAndFundingNotes: e.target.value,
                    })
                  }
                  placeholder="Write any extra details about who is involved, what skills you need, or your budget plans..."
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs leading-relaxed text-slate-800 shadow-2xs focus:border-indigo-600 focus:outline-none disabled:opacity-60"
                />
              </div>

              {/* Step 4 Bottom Save Bar */}
              {!activeEntitlement.isVaultReadonly && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3.5">
                  <div className="text-xs text-slate-500">
                    🛡️ Your team setup and {countryPack.defaultCurrency} starting budget automatically update your blind-spot guardrails below.
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isSavingCanvas}
                    onClick={handleSaveCanvasEdits}
                  >
                    {isSavingCanvas ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" />
                        Save Team &amp; Budget
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* STEP 5: FOUNDER FIT, DEALBREAKERS & REALITY CHECK */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                    5
                  </span>
                  Step 5: Founder Fit, Dealbreakers &amp; Reality Check
                  <Badge variant="secondary">Protect Your Sanity</Badge>
                </CardTitle>
                <CardDescription className="mt-1">
                  Before you start building or spending money, let&apos;s make sure
                  this business fits your real life — your industry contacts, how
                  soon you need a personal wage, what you refuse to do, and your
                  honest #1 worry.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* 1. Insider Advantage & Warm Contacts ("The Monday Morning Test") */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  1. The Monday Morning Test: How well do you know this industry &amp; your first 5 buyers?
                </label>
                <div className="mt-2.5 grid grid-cols-1 gap-3 md:grid-cols-3">
                  {(
                    [
                      {
                        id: 'LIVED_IT_INSIDER' as IndustryConnectionLevel,
                        emoji: '🔑',
                        title: 'I’ve Lived It (Industry Insider)',
                        subtitle:
                          'I worked in this industry or experienced this exact problem firsthand — I already know the jargon and key buyers.',
                      },
                      {
                        id: 'WARM_CONNECTIONS' as IndustryConnectionLevel,
                        emoji: '🤝',
                        title: 'I Know a Few People (Warm Network)',
                        subtitle:
                          'I could message 3–5 target buyers on WhatsApp or LinkedIn on Monday morning to ask for honest feedback.',
                      },
                      {
                        id: 'STARTING_COLD' as IndustryConnectionLevel,
                        emoji: '🧭',
                        title: 'Starting Cold (Outsider)',
                        subtitle:
                          'I spotted this opportunity from the outside and don’t personally know target buyers yet.',
                      },
                    ] as const
                  ).map((option) => {
                    const isSelected =
                      founderRealityCheck.industryConnection === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        disabled={activeEntitlement.isVaultReadonly}
                        onClick={() =>
                          setFounderRealityCheck({
                            ...founderRealityCheck,
                            industryConnection: option.id,
                          })
                        }
                        className={`flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-600/20 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                        } disabled:opacity-60`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xl">{option.emoji}</span>
                            {isSelected && (
                              <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                Selected
                              </span>
                            )}
                          </div>
                          <div className="mt-2 text-xs font-bold text-slate-900">
                            {option.title}
                          </div>
                          <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                            {option.subtitle}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Personal Income Urgency */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  2. Personal Income Pressure: How soon do you need this business to pay you a personal wage?
                </label>
                <div className="mt-2 flex flex-wrap gap-2.5">
                  {(
                    [
                      {
                        id: 'NO_RUSH_12M_PLUS' as PersonalIncomeUrgency,
                        label:
                          '🛡️ No Rush (12+ Months) — Covered by day job, partner, or savings',
                      },
                      {
                        id: 'MEDIUM_6_TO_12M' as PersonalIncomeUrgency,
                        label:
                          '⏳ Within 6–12 Months — Need steady progress toward replacing income',
                      },
                      {
                        id: 'URGENT_1_TO_3M' as PersonalIncomeUrgency,
                        label:
                          '⚡ Urgent (Within 1–3 Months) — I need fast cashflow from customers now',
                      },
                    ] as const
                  ).map((pill) => {
                    const isSelected =
                      founderRealityCheck.personalIncomeUrgency === pill.id;
                    return (
                      <button
                        key={pill.id}
                        type="button"
                        disabled={activeEntitlement.isVaultReadonly}
                        onClick={() =>
                          setFounderRealityCheck({
                            ...founderRealityCheck,
                            personalIncomeUrgency: pill.id,
                          })
                        }
                        className={`rounded-lg border px-3.5 py-2 text-xs font-semibold transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-600 text-white shadow-2xs'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                        } disabled:opacity-60`}
                      >
                        {pill.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Lifestyle Dealbreakers / Anti-Goals (Multi-Select) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  3. Your Dealbreakers (Anti-Goals): What do you REFUSE to do in this business? (Select all that apply)
                </label>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Plenty of founders accidentally build a business they hate running. Pick your boundaries now so our AI never pushes you into the wrong model.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(
                    [
                      {
                        id: 'NO_BIG_TEAM' as FounderDealbreakerType,
                        label: '🚫 I don’t want to manage a big team of staff',
                      },
                      {
                        id: 'NO_PHYSICAL_PREMISES' as FounderDealbreakerType,
                        label:
                          '🚫 I don’t want a physical shop, lease, or warehouse',
                      },
                      {
                        id: 'NO_COLD_SALES' as FounderDealbreakerType,
                        label:
                          '🚫 I hate cold calling & high-pressure B2B enterprise sales',
                      },
                      {
                        id: 'NO_OUTSIDE_INVESTORS' as FounderDealbreakerType,
                        label:
                          '🚫 I don’t want VCs or outside investors telling me what to do',
                      },
                      {
                        id: 'NO_WEEKEND_SUPPORT' as FounderDealbreakerType,
                        label:
                          '🚫 I don’t want 24/7 customer emergencies on weekends',
                      },
                    ] as const
                  ).map((item) => {
                    const isChecked =
                      founderRealityCheck.dealbreakers.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={activeEntitlement.isVaultReadonly}
                        onClick={() => {
                          const exists =
                            founderRealityCheck.dealbreakers.includes(item.id);
                          const next = exists
                            ? founderRealityCheck.dealbreakers.filter(
                                (d) => d !== item.id
                              )
                            : [...founderRealityCheck.dealbreakers, item.id];
                          setFounderRealityCheck({
                            ...founderRealityCheck,
                            dealbreakers: next,
                          });
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                          isChecked
                            ? 'border-rose-600 bg-rose-50 font-semibold text-rose-900 ring-1 ring-rose-600/20'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                        } disabled:opacity-60`}
                      >
                        {isChecked && (
                          <Check className="h-3.5 w-3.5 text-rose-600" />
                        )}
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Ownership, Grants & Control Trade-Off */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  4. Ownership &amp; Funding Philosophy: How do you feel about sharing equity vs. staying 100% in control?
                </label>
                <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {(
                    [
                      {
                        id: 'BOOTSTRAP_100_CONTROL' as GrowthTradeoffPreference,
                        emoji: '👑',
                        title: '100% My Own Boss (Bootstrap)',
                        subtitle:
                          'Grow at my own pace using customer revenue — keep 100% ownership and total freedom.',
                      },
                      {
                        id: 'NON_DILUTIVE_GRANTS' as GrowthTradeoffPreference,
                        emoji: '🏛️',
                        title: 'Customer Sales + State Grants',
                        subtitle: `Keep my equity while tapping ${countryPack.countryName} non-dilutive grants (${countryGrants[0]?.grantName || 'local enterprise support'}).`,
                      },
                      {
                        id: 'SHARE_EQUITY_COFOUNDER' as GrowthTradeoffPreference,
                        emoji: '🤝',
                        title: 'Share Equity with a Co-Founder',
                        subtitle:
                          'Happy to split ownership with the right partner so I don’t have to carry the whole load alone.',
                      },
                      {
                        id: 'RAISE_INVESTMENT' as GrowthTradeoffPreference,
                        emoji: '📈',
                        title: 'Open to Angel / VC Investment',
                        subtitle:
                          'Willing to trade a slice of equity for capital and mentorship to grow much faster.',
                      },
                    ] as const
                  ).map((option) => {
                    const isSelected =
                      founderRealityCheck.growthTradeoff === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        disabled={activeEntitlement.isVaultReadonly}
                        onClick={() =>
                          setFounderRealityCheck({
                            ...founderRealityCheck,
                            growthTradeoff: option.id,
                          })
                        }
                        className={`flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-600/20 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                        } disabled:opacity-60`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xl">{option.emoji}</span>
                            {isSelected && (
                              <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                Selected
                              </span>
                            )}
                          </div>
                          <div className="mt-2 text-xs font-bold text-slate-900">
                            {option.title}
                          </div>
                          <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                            {option.subtitle}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. Your #1 Secret Worry (Honest Gut-Check) */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    5. Honest Gut-Check: What is your #1 worry or fear about this idea right now?
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const worryMap: Record<BiggestWorryPreset, string> = {
                        WILL_THEY_PAY: `Validate whether target buyers in ${countryPack.countryName} will actually pay ${countryPack.defaultCurrency} for this or stick with their current workaround.`,
                        HOW_TO_BUILD:
                          'Map out how to deliver a lean Version 1 MVP without getting stuck in an expensive technical build.',
                        FINDING_FIRST_10: `Identify the exact channel to reach and sign our first 10 paying customers in ${countryPack.countryName}.`,
                        COMPETITION_OR_AI:
                          'Define our unfair advantage so a bigger competitor or generic AI tool cannot easily copy us.',
                        TIME_AND_ENERGY:
                          'Design a repeatable weekly workflow so we can launch without burning out or running out of cash.',
                      };
                      const customText =
                        founderRealityCheck.biggestWorryNotes.trim();
                      const questionToPark = customText
                        ? `Resolve #1 Founder Worry: ${customText}`
                        : worryMap[founderRealityCheck.biggestWorryPreset];
                      handleParkSpecificQuestion(questionToPark);
                    }}
                    className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-900 ring-1 ring-amber-200 hover:bg-amber-100"
                  >
                    <BookmarkPlus className="h-3.5 w-3.5 text-amber-700" />
                    Park My #1 Worry in Open Questions
                  </button>
                </div>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Every founder has a secret worry. Naming it now lets us turn it into your #1 validation test in Module B.
                </p>
                <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
                  {(
                    [
                      {
                        id: 'WILL_THEY_PAY' as BiggestWorryPreset,
                        emoji: '💳',
                        title: 'Will Anyone Actually Pay?',
                        subtitle:
                          'People might say "nice idea", but stick with spreadsheets or doing nothing.',
                      },
                      {
                        id: 'FINDING_FIRST_10' as BiggestWorryPreset,
                        emoji: '📣',
                        title: 'Finding My First 10 Customers',
                        subtitle:
                          'I don’t know how to get in front of buyers without spending a fortune on ads.',
                      },
                      {
                        id: 'HOW_TO_BUILD' as BiggestWorryPreset,
                        emoji: '🛠️',
                        title: 'How to Actually Build It',
                        subtitle:
                          'Worried the tech, operations, or regulations will be too complex or costly.',
                      },
                      {
                        id: 'COMPETITION_OR_AI' as BiggestWorryPreset,
                        emoji: '🦈',
                        title: 'Big Competitors or AI Copying It',
                        subtitle:
                          'What stops an existing software company or AI tool from doing this?',
                      },
                      {
                        id: 'TIME_AND_ENERGY' as BiggestWorryPreset,
                        emoji: '🔋',
                        title: 'Running Out of Time or Cash',
                        subtitle:
                          'Trying to juggle this alongside life/work without burning out.',
                      },
                    ] as const
                  ).map((worry) => {
                    const isSelected =
                      founderRealityCheck.biggestWorryPreset === worry.id;
                    return (
                      <button
                        key={worry.id}
                        type="button"
                        disabled={activeEntitlement.isVaultReadonly}
                        onClick={() =>
                          setFounderRealityCheck({
                            ...founderRealityCheck,
                            biggestWorryPreset: worry.id,
                          })
                        }
                        className={`flex flex-col justify-between rounded-xl border p-3 text-left transition-all ${
                          isSelected
                            ? 'border-amber-600 bg-amber-50/70 ring-2 ring-amber-600/20 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                        } disabled:opacity-60`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-lg">{worry.emoji}</span>
                            {isSelected && (
                              <span className="rounded-full bg-amber-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                #1 Worry
                              </span>
                            )}
                          </div>
                          <div className="mt-1.5 text-xs font-bold text-slate-900">
                            {worry.title}
                          </div>
                          <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                            {worry.subtitle}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <textarea
                  rows={2}
                  disabled={activeEntitlement.isVaultReadonly}
                  value={founderRealityCheck.biggestWorryNotes}
                  onChange={(e) =>
                    setFounderRealityCheck({
                      ...founderRealityCheck,
                      biggestWorryNotes: e.target.value,
                    })
                  }
                  placeholder="Optional: Tell us in your own words what worries you most or where you feel least confident..."
                  className="mt-2.5 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs leading-relaxed text-slate-800 shadow-2xs focus:border-indigo-600 focus:outline-none disabled:opacity-60"
                />
              </div>

              {/* Step 5 Bottom Save Bar */}
              {!activeEntitlement.isVaultReadonly && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3.5">
                  <div className="text-xs text-slate-500">
                    🧭 Your dealbreakers, income timeline, and #1 worry directly shape your Step 6 blind-spot review below.
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isSavingCanvas}
                    onClick={handleSaveCanvasEdits}
                  >
                    {isSavingCanvas ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" />
                        Save Reality Check
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* STEP 6: CONSTRUCTIVE "THINGS TO CONSIDER" BLIND-SPOT CARD */}
          <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/90 via-white to-violet-50/80 p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Step 6: Constructive &ldquo;Things to Consider&rdquo;
                    (Blind-Spot Engine)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Updates live as you fill in Steps 1–5 — combining your idea,
                    motivation, {countryPack.defaultCurrency} budget,
                    dealbreakers, and #1 worry.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-900">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  Live-Synced with Steps 1–5
                </span>
                <Badge variant="default">Co-Founder Perspective</Badge>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
              {liveThingsToConsider.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className={`flex flex-col justify-between rounded-xl border p-4 shadow-2xs transition-all ${
                    item.severity === 'WARNING'
                      ? 'border-amber-300 bg-amber-50/40'
                      : 'border-slate-200/90 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          item.severity === 'WARNING'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-indigo-50 text-indigo-800'
                        }`}
                      >
                        {item.severity === 'WARNING'
                          ? '⚠️ Priority Blind Spot'
                          : '💡 Co-Founder Check'}
                      </span>
                    </div>
                    <div className="mt-2 text-xs font-bold text-slate-900">
                      {item.title}
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                      {item.explanation}
                    </p>
                    {item.suggestedAction && (
                      <div className="mt-2.5 rounded-lg bg-slate-50 p-2 text-[11px] text-indigo-900 ring-1 ring-slate-200/70">
                        <strong>Action Step:</strong> {item.suggestedAction}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Step 6 Bottom Save & AI Tidy Bar */}
            {!activeEntitlement.isVaultReadonly && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-white/90 px-4 py-3">
                <div className="text-xs text-slate-600">
                  ✨ Change any option or add notes in Steps 1–5 above and watch these 6 cards adapt immediately.
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isSynthesizing}
                    onClick={handleTidyUpNotesWithAi}
                  >
                    {isSynthesizing ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Tidying...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-3.5 w-3.5 text-indigo-600" />
                        AI Tidy Up All Notes
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    disabled={isSavingCanvas}
                    onClick={handleSaveCanvasEdits}
                    className="bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    {isSavingCanvas ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Saving Module A...
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" />
                        Save All Module A Progress
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* STEP 7: DOWNLOADABLE STARTUP CONCEPT & READINESS BRIEF     */}
          {/* ========================================================= */}
          <Card className="border-indigo-200 bg-gradient-to-br from-white via-indigo-50/30 to-violet-50/40 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="default">
                      Step 7 • Module A Summary Document
                    </Badge>
                    <Badge
                      variant={
                        completedReadinessCount === 6 ? 'success' : 'secondary'
                      }
                      className="text-[10px]"
                    >
                      {completedReadinessCount}/6 Sections Ready
                    </Badge>
                  </div>
                  <CardTitle className="mt-2 flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4 text-indigo-600" />
                    Step 7: Your Startup Concept &amp; Readiness Brief
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Everything you captured across Steps 1–6 is compiled below
                    into a clean executive summary document you can download,
                    print to PDF, or share with a co-founder, mentor, or Local
                    Enterprise advisor before moving into Module B.
                  </CardDescription>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBriefPreview(!showBriefPreview)}
                  className="text-xs"
                >
                  <Eye className="h-3.5 w-3.5 text-indigo-600" />
                  {showBriefPreview
                    ? 'Hide Live Document Preview'
                    : 'Show Live Document Preview'}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* OPTION C: 6-STEP MODULE A READINESS CHECKLIST */}
              <div className="rounded-xl border border-indigo-100 bg-white p-4 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Module A Readiness Checklist (Steps 1–6 Included in Your
                    Brief)
                  </div>
                  <span className="text-xs font-semibold text-indigo-700">
                    Live-Synced with Your Answers Above
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {moduleAReadinessSteps.map((step) => (
                    <div
                      key={step.stepNumber}
                      className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs transition-all ${
                        step.isComplete
                          ? 'border-emerald-200 bg-emerald-50/40'
                          : 'border-amber-200 bg-amber-50/40'
                      }`}
                    >
                      <CheckCircle2
                        className={`mt-0.5 h-4 w-4 shrink-0 ${
                          step.isComplete
                            ? 'text-emerald-600'
                            : 'text-amber-500'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-900">
                          Step {step.stepNumber}: {step.label}
                        </div>
                        <p className="mt-0.5 truncate text-[11px] text-slate-600">
                          {step.summary}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* OPTION A: LIVE EXECUTIVE BRIEF DOCUMENT PREVIEW */}
              {showBriefPreview && (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  {/* Document Header Banner */}
                  <div className="border-b border-slate-200 bg-slate-900 px-6 py-5 text-white">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-300">
                        {activeEntitlement.whiteLabelExportEnabled
                          ? 'Startup Concept & Readiness Brief'
                          : 'Build My Unicorn 2.0 • Startup Concept & Readiness Brief'}
                      </span>
                      <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-slate-200">
                        {countryPack.countryName} ({countryPack.defaultCurrency})
                        • {currentPlan.industryCategory}
                      </span>
                    </div>
                    <h2 className="mt-1.5 text-lg font-bold text-white">
                      {currentPlan.title}
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-300">
                      Prepared by {session.user.name} • {briefGeneratedDate}
                    </p>
                  </div>

                  {/* Document Body Sections */}
                  <div className="divide-y divide-slate-100 p-6 text-xs">
                    {/* Section 1: Raw Idea & 1-Page Concept Canvas */}
                    <div className="pb-5">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                        1. Core Concept &amp; 1-Page Canvas (Steps 1 &amp; 2)
                      </div>
                      <div className="mt-2.5 rounded-xl bg-slate-50 p-3.5 text-slate-700 ring-1 ring-slate-200/70">
                        <span className="font-semibold text-slate-900">
                          Founder&apos;s Raw Idea:{' '}
                        </span>
                        &ldquo;{brainDumpText}&rdquo;
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="rounded-xl border border-slate-200 p-3">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Problem Worth Solving
                          </div>
                          <p className="mt-1 leading-relaxed text-slate-800">
                            {effectiveCanvas.coreProblem}
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-200 p-3">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Target Customer Segment
                          </div>
                          <p className="mt-1 leading-relaxed text-slate-800">
                            {effectiveCanvas.targetCustomer}
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-200 p-3">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Proposed Solution &amp; MVP
                          </div>
                          <p className="mt-1 leading-relaxed text-slate-800">
                            {effectiveCanvas.proposedSolution}
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-200 p-3">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Unfair Advantage &amp; Revenue/Grant Fit
                          </div>
                          <p className="mt-1 leading-relaxed text-slate-800">
                            {effectiveCanvas.unfairAdvantage}
                            {effectiveCanvas.revenueAndGrantFit
                              ? ` • ${effectiveCanvas.revenueAndGrantFit}`
                              : ''}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Founder Ambition, Team & Starting Budget */}
                    <div className="py-5">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                        2. Founder Ambition, Team &amp; Starting Budget (Steps 3
                        &amp; 4)
                      </div>
                      <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200/70">
                          <div className="text-[10px] font-bold uppercase text-slate-400">
                            Primary Motivation
                          </div>
                          <div className="mt-1 font-semibold text-slate-900">
                            {
                              MOTIVATION_LABELS[
                                founderMotivation.primaryMotivation
                              ]
                            }
                          </div>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200/70">
                          <div className="text-[10px] font-bold uppercase text-slate-400">
                            Weekly Bandwidth
                          </div>
                          <div className="mt-1 font-semibold text-slate-900">
                            {
                              WEEKLY_HOURS_LABELS[
                                founderMotivation.weeklyHoursAvailable
                              ]
                            }
                          </div>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200/70">
                          <div className="text-[10px] font-bold uppercase text-slate-400">
                            Team &amp; Version 1 Skills
                          </div>
                          <div className="mt-1 font-semibold text-slate-900">
                            {
                              TEAM_STRUCTURE_LABELS[
                                teamAndBudget.teamStructureType
                              ]
                            }
                          </div>
                          <div className="mt-0.5 text-[11px] text-slate-600">
                            {SKILL_COVERAGE_LABELS[teamAndBudget.skillCoverage]}
                          </div>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200/70">
                          <div className="text-[10px] font-bold uppercase text-slate-400">
                            Starting Cash Budget
                          </div>
                          <div className="mt-1 font-semibold text-emerald-800">
                            {formatStartingBudgetBracket(
                              teamAndBudget.startingBudgetBracket,
                              countryPack.defaultCurrency
                            )}
                          </div>
                        </div>
                      </div>

                      {(founderMotivation.twelveMonthSuccessVision.trim() ||
                        teamAndBudget.teamAndFundingNotes.trim()) && (
                        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                          {founderMotivation.twelveMonthSuccessVision.trim() && (
                            <div className="rounded-xl border border-slate-200 p-3">
                              <span className="font-semibold text-slate-900">
                                12-Month Success Vision:{' '}
                              </span>
                              <span className="text-slate-700">
                                {founderMotivation.twelveMonthSuccessVision}
                              </span>
                            </div>
                          )}
                          {teamAndBudget.teamAndFundingNotes.trim() && (
                            <div className="rounded-xl border border-slate-200 p-3">
                              <span className="font-semibold text-slate-900">
                                Team &amp; Budget Notes:{' '}
                              </span>
                              <span className="text-slate-700">
                                {teamAndBudget.teamAndFundingNotes}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Section 3: Reality Check & Non-Negotiables */}
                    <div className="py-5">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                        3. Founder Fit, Dealbreakers &amp; Reality Check (Step
                        5)
                      </div>
                      <div className="mt-2.5 grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div className="rounded-xl border border-slate-200 p-3">
                          <div className="text-[10px] font-bold uppercase text-slate-400">
                            Industry Access
                          </div>
                          <div className="mt-1 font-medium text-slate-800">
                            {
                              INDUSTRY_CONNECTION_LABELS[
                                founderRealityCheck.industryConnection
                              ]
                            }
                          </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 p-3">
                          <div className="text-[10px] font-bold uppercase text-slate-400">
                            Personal Income Timeline
                          </div>
                          <div className="mt-1 font-medium text-slate-800">
                            {
                              INCOME_URGENCY_LABELS[
                                founderRealityCheck.personalIncomeUrgency
                              ]
                            }
                          </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 p-3">
                          <div className="text-[10px] font-bold uppercase text-slate-400">
                            Control vs. Speed Trade-Off
                          </div>
                          <div className="mt-1 font-medium text-slate-800">
                            {
                              GROWTH_TRADEOFF_LABELS[
                                founderRealityCheck.growthTradeoff
                              ]
                            }
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-semibold text-slate-700">
                          Protected Non-Negotiables:
                        </span>
                        {founderRealityCheck.dealbreakers.map((db) => (
                          <span
                            key={db}
                            className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-medium text-indigo-900 ring-1 ring-indigo-200"
                          >
                            {DEALBREAKER_LABELS[db]}
                          </span>
                        ))}
                      </div>

                      <div className="mt-2.5 rounded-xl bg-amber-50/70 p-3 text-amber-950 ring-1 ring-amber-200/80">
                        <span className="font-semibold">
                          #1 Worry on Your Mind:{' '}
                        </span>
                        {
                          BIGGEST_WORRY_LABELS[
                            founderRealityCheck.biggestWorryPreset
                          ]
                        }
                        {founderRealityCheck.biggestWorryNotes.trim() && (
                          <span>
                            {' '}
                            — &ldquo;{founderRealityCheck.biggestWorryNotes}
                            &rdquo;
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Section 4: Top Co-Founder Blind-Spot Takeaways & Open Questions */}
                    <div className="pt-5">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                        4. Co-Founder Blind-Spot Review &amp; Next Validation
                        Steps (Step 6)
                      </div>
                      <div className="mt-2.5 grid grid-cols-1 gap-2.5 md:grid-cols-2">
                        {liveThingsToConsider.map((item, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl border border-slate-200 bg-slate-50/60 p-3"
                          >
                            <div className="font-bold text-slate-900">
                              {item.title}
                            </div>
                            <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                              {item.suggestedAction || item.explanation}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 7 BOTTOM ACTION BAR: DOWNLOAD, PRINT TO PDF, OR COPY BRIEF */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-200 bg-white px-4 py-3.5 shadow-2xs">
                <div className="text-xs text-slate-600">
                  📥 <strong>Take your Concept &amp; Readiness Brief with you:</strong>{' '}
                  Download a standalone file, print/save as PDF, or copy for your
                  notes.
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyBriefMarkdown}
                  >
                    {briefCopied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        Copied to Clipboard!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-slate-600" />
                        Copy Summary
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadBriefHtml}
                  >
                    <Download className="h-3.5 w-3.5 text-indigo-600" />
                    Download Brief (.html)
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    onClick={handlePrintBriefPdf}
                    className="bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print / Save as PDF
                  </Button>
                </div>
              </div>

              {/* Conversion Hook CTA into Module B */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-900 px-4 py-3.5 text-white">
                <div className="text-xs">
                  <span className="font-semibold text-indigo-300">
                    Ready to validate {currentPlan.title} in the real world?
                  </span>{' '}
                  Unlock Module B to auto-generate your shareable Customer
                  Validation Survey link (<code>/v/my-startup</code>) &amp; AI
                  Market Scout.
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    const modBAccess = canAccessModule(
                      activeEntitlement,
                      'MOD_B_MARKET'
                    );
                    if (!modBAccess.allowed) {
                      setPaywallModalFeature(
                        `Module B: Market & Validation Survey (${modBAccess.reason})`
                      );
                    }
                  }}
                  className="bg-indigo-500 text-white hover:bg-indigo-400"
                >
                  Continue to Module B
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Clean Production Footer */}
      <footer className="mt-12 border-t border-slate-200 bg-white text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <span className="font-semibold text-slate-800">
              Build My Unicorn 2.0
            </span>
            <span>© {new Date().getFullYear()} All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/redeem" className="hover:text-slate-900">
              Redeem Code
            </Link>
          </div>
        </div>
      </footer>

      {/* ========================================================= */}
      {/* LAYER 2: SLIDE-OUT "ASK UNICORN" AI SIDEKICK DRAWER       */}
      {/* ========================================================= */}
      {askUnicornOpen && (
        <div className="fixed bottom-5 right-5 z-40 w-96 max-w-[calc(100vw-2.5rem)] rounded-2xl border border-indigo-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <div>
                <div className="text-xs font-bold">
                  Ask Unicorn (Co-Founder AI)
                </div>
                <div className="text-[10px] text-indigo-100">
                  Context: {currentPlan.title} • {selectedCountry}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAskUnicornOpen(false)}
              className="rounded-lg p-1 text-indigo-100 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3 p-4 text-xs">
            <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
              👋 Hi <strong>{session.user.name.split(' ')[0]}</strong>! I can
              see you&apos;re working on <strong>{currentPlan.title}</strong> (
              {countryPack.countryName} • {countryPack.defaultCurrency}). Want me
              to suggest 3 sharper ways to phrase your customer pain point?
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() =>
                  setBrainDumpText(
                    brainDumpText +
                      '\n\n[Unicorn Suggestion]: Highlight how much money or time the customer loses every single week before buying your solution.'
                  )
                }
                className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 font-medium text-indigo-700 hover:bg-indigo-100"
              >
                ✨ Quantify weekly customer pain
              </button>
              <button
                type="button"
                onClick={handleParkQuestion}
                className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 font-medium text-amber-800 hover:bg-amber-100"
              >
                📌 Park pricing question for Module D
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PAYWALL / UPGRADE MODAL (WHEN CLICKING LOCKED FEATURES)   */}
      {/* ========================================================= */}
      {paywallModalFeature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Unlock Full Founder Workspace
                  </h3>
                  <p className="text-xs text-slate-500">
                    Module A is 100% free. Upgrade to unlock Modules B–G &amp;
                    Multi-Plan.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPaywallModalFeature(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-950">
              <strong>Feature Requested:</strong> {paywallModalFeature}
            </div>

            <div className="mt-4 space-y-2.5 text-xs">
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3.5">
                <div className="flex items-center justify-between font-bold text-indigo-950">
                  <span>6-Month Co-Founder Pass</span>
                  <span className="text-sm text-indigo-700">€149 one-time</span>
                </div>
                <p className="mt-1 text-indigo-900/80">
                  3 Startup Plans • 3 Co-Founder Seats • Full Modules A–G • 750
                  AI Credits/mo.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>Have an AppSumo or University Cohort Code?</span>
                  <Ticket className="h-4 w-4 text-amber-600" />
                </div>
                <p className="mt-1 text-slate-600">
                  Redeem your voucher code or test tier upgrades via the
                  footer simulator.
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <Link href="/redeem">
                <Button variant="outline" size="sm">
                  Redeem Code
                </Button>
              </Link>
              <Button
                size="sm"
                onClick={() => {
                  setSelectedTierPreset('SIX_MONTH_COFOUNDER');
                  setPaywallModalFeature(null);
                }}
              >
                Unlock Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
