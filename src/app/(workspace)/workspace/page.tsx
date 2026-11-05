'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  ChevronUp,
  GitBranch,
  Plus,
  Check,
  Wand2,
  X,
  Compass,
  BarChart3,
  MessageSquare,
  Briefcase,
  DollarSign,
  Megaphone,
  Scale,
  FileText,
  Info,
  UserCheck,
  User,
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
  BookOpen,
  Trash2,
  LayoutGrid,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createStripeCheckoutSessionAction } from '@/app/actions/stripe';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PreflightMark, BrandLogo } from '@/components/ui/brand-logo';
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
  hasActiveBmuSession,
  clearActiveBmuSession,
  loadBmuSession,
  loadBmuSessionForEmail,
  saveBmuSession,
  getDefaultDemoSession,
  createFreshStartupPlan,
  markPlanAsDeletedInBrowserStorage,
  deduplicateSurveyResponses,
  isSyntheticPersonaPlan,
  exitPersonaPreviewAndRestoreRealPlans,
  type BmuLocalSession,
  type SavedConceptCanvas,
  type ActiveStartupPlan,
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
  type BeachheadMarketData,
  type CompetitorsAndStatusQuoData,
  type MarketSizingData,
  type CompetitiveWedgeData,
  type BuyerModelType,
  type SavedValidationSurvey,
  type SavedSurveyResponse,
  type SurveyFocusAreaType,
  type SurveyQuestionItem,
  type SavedCustomerInterviewLog,
  type InterviewChannelType,
  type ProductVehicleStep1Data,
  type ProductTrackType,
  type ProductFormFactorType,
  type SalesChannelOptionType,
  type DeliveryFulfillmentModelType,
  type ChannelMatrixStep2Data,
  type ScopeFilterItem,
  type ScopeFilterStep3Data,
  type BuildVsBuyItem,
  type BuildVsBuyStep4Data,
  type ProductWorkPackageItem,
  type ProductFlowStageItem,
  type WorkPackagesStep5Data,
  type V1LaunchTimelineType,
  type ProductBlindSpotItem,
  type BlindSpotAuditStep6Data,
  type OperationsFulfillmentModeType,
  type OrderTurnaroundSlaType,
  type OperationalCapacityConstraintType,
  type OrderLifecycleStageItem,
  type OperationsBlueprintStep1Data,
  type PremisesSetupModeType,
  type PremisesComplianceStatusType,
  type EquipmentAssetItem,
  type PremisesAndEquipmentStep2Data,
  type SupplierRedundancyPostureType,
  type ProjectRiskRegisterItem,
  type RiskRegisterStep3Data,
  type SupportOperatingModelType,
  type SupportResponseSlaType,
  type ReturnsAndWarrantyPolicyType,
  type QcCheckpointItem,
  type SupportReturnsAndQcStep4Data,
  type RegulatorySectorPostureType,
  type DataPrivacyPostureType,
  type InsuranceCoverageBundleType,
  type ComplianceChecklistItem,
  type PermitsComplianceAndInsuranceStep5Data,
  type OperationsReadinessConfidenceType,
  type OperationsBlindSpotItem,
  type OperationsBlindSpotAuditStep6Data,
  type SavedMasterDocumentData,
  type SavedGrantEligibilityCheck,
  type PromoterProfilesStep1Data,
  type RoleMatrixStep2Data,
  type SurvivalBudgetStep3Data,
  type CoFounderAlignmentStep4Data,
  type HiringPlanStep5Data,
  type TeamBlindSpotAuditBriefData,
  type SavedModuleLData,
  type BusinessPlanVersionItem,
} from '@/lib/auth/session-store';
import {
  getCurrentCloudSessionAction,
  logoutFounderAction,
  setActivePlanServerAction,
} from '@/app/actions/auth';
import {
  saveMasterDocumentDataAction,
  weaveMasterDocumentStoryWithAiAction,
} from '@/app/actions/master-document';
import {
  generateModuleAConceptCanvasAction,
  saveModuleACanvasEditsAction,
  parkOpenQuestionAction,
  deleteStartupPlanAction,
  cloneStartupPlanAction,
  generateModuleAGrantPositioningAdviceAction,
} from '@/app/actions/module-a';
import {
  isGrantCheckerSupportedForCountry,
  getDefaultGrantEligibilityCheck,
  evaluateModuleAGrantEligibility,
} from '@/lib/grants/module-a-grant-checker';
import { ModuleAGrantCheckerStep } from '@/components/workspace/module-a-grant-checker-step';
import {
  saveModuleBStep1BeachheadAction,
  saveModuleBStep2CompetitorsAction,
  scoutModuleBCompetitorsWithAiAction,
  saveModuleBStep3MarketSizingAction,
  estimateModuleBMarketSizingWithAiAction,
  saveModuleBStep4CompetitiveWedgeAction,
  generateModuleBCompetitiveEdgeWithAiAction,
  saveModuleBStep5CompleteAction,
  parkModuleBOpenQuestionAction,
} from '@/app/actions/module-b';
import {
  saveValidationSurveyAction,
  deleteValidationSurveyAction,
  generateModuleCSurveyWithAiAction,
  checkMomTestQuestionWithAiAction,
  suggestNextMomTestQuestionWithAiAction,
  analyzeSurveyResultsWithAiAction,
  saveCustomerInterviewLogsAction,
  extractMomTestInterviewWithAiAction,
  saveModuleCBlindSpotsAction,
} from '@/app/actions/module-c';
import {
  saveModuleDStep1ProductVehicleAction,
  saveModuleDStep2ChannelMatrixAction,
  saveModuleDStep3ScopeFilterAction,
  saveModuleDStep4BuildVsBuyAction,
  saveModuleDStep5WorkPackagesAction,
  saveModuleDStep6BlindSpotAuditAction,
  parkModuleDOpenQuestionAction,
  generateModuleDProductVehicleWithAiAction,
  generateModuleDChannelMatrixWithAiAction,
  generateModuleDScopeFilterWithAiAction,
  generateModuleDBuildVsBuyWithAiAction,
  generateModuleDWorkPackagesWithAiAction,
  generateModuleDBlindSpotAuditWithAiAction,
} from '@/app/actions/module-d';
import {
  saveModuleEStep1OperationsBlueprintAction,
  saveModuleEStep2PremisesEquipmentAction,
  saveModuleEStep3RiskRegisterAction,
  saveModuleEStep4SupportReturnsAndQcAction,
  saveModuleEStep5PermitsAndInsuranceAction,
  saveModuleEStep6BlindSpotAuditAction,
  parkModuleEOpenQuestionAction,
  generateModuleEOperationsBlueprintWithAiAction,
  generateModuleEPremisesEquipmentWithAiAction,
  generateModuleERiskRegisterWithAiAction,
  generateModuleESupportReturnsAndQcWithAiAction,
  generateModuleEPermitsAndInsuranceWithAiAction,
  generateModuleEBlindSpotAuditWithAiAction,
} from '@/app/actions/module-e';
import {
  saveModuleFStep1PromoterProfilesAction,
  saveModuleFStep2RoleMatrixAction,
  saveModuleFStep3SurvivalBudgetAction,
  saveModuleFStep4AlignmentAction,
  saveModuleFStep5HiringPlanAction,
  saveModuleFStep6BlindSpotAuditAction,
  parkModuleFOpenQuestionAction,
} from '@/app/actions/module-f';
import { saveModuleGLaunchpadDataAction } from '@/app/actions/module-g';
import { ModuleBWorkspace } from '@/components/workspace/module-b-workspace';
import { ModuleCWorkspace } from '@/components/workspace/module-c-workspace';
import { ModuleDWorkspace } from '@/components/workspace/module-d-workspace';
import { ModuleEWorkspace } from '@/components/workspace/module-e-workspace';
import { ModuleFWorkspace } from '@/components/workspace/module-f-workspace';
import { ModuleGWorkspace } from '@/components/workspace/module-g-workspace';
import { ModuleHWorkspace } from '@/components/workspace/module-h-workspace';
import { ModuleIWorkspace } from '@/components/workspace/module-i-workspace';
import { ModuleJWorkspace } from '@/components/workspace/module-j-workspace';
import { ModuleKWorkspace } from '@/components/workspace/module-k-workspace';
import { ModuleLWorkspace } from '@/components/workspace/module-l-workspace';
import { BusinessPlanStudioWorkspace } from '@/components/workspace/business-plan-studio-workspace';
import { ProjectDashboardView } from '@/components/workspace/project-dashboard-view';
import {
  saveModuleLStep1ModeAction,
  saveModuleLPartialDataAction,
} from '@/app/actions/module-l';
import { MasterDocumentWorkspace } from '@/components/workspace/master-document-workspace';
import { LocalBugCaptureWidget } from '@/components/workspace/local-bug-capture-widget';
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
import {
  buildDeterministicMasterStory,
  type MasterDocumentVerifiedFacts,
} from '@/lib/export/master-document-brief';
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
    title: 'Market & Competitive Intelligence',
    subtitle: 'Target Customers, Competitor Habits, Market Size & Edge',
    icon: BarChart3,
    progress: 0,
  },
  {
    code: 'MOD_C_SURVEYS_FEEDBACK',
    short: 'Module C',
    title: 'Customer Surveys & Feedback',
    subtitle: 'Public Validation Surveys, Waitlist & 1-on-1 Interview Log',
    icon: MessageSquare,
    progress: 0,
  },
  {
    code: 'MOD_D_PRODUCT_BUILD',
    short: 'Module D',
    title: 'What Are We Building? (Product)',
    subtitle: 'Product Vehicle, Own vs Rent Channel, Work Packages & Tech Spec',
    icon: Wrench,
    progress: 0,
  },
  {
    code: 'MOD_E_OPERATIONS',
    short: 'Module E',
    title: 'Operations, Equipment & Risk Register',
    subtitle: 'Fulfillment, LEO/Innovate UK Asset Rules & 4-Category Risk Table',
    icon: Briefcase,
    progress: 0,
  },
  {
    code: 'MOD_F_COFOUNDER_TEAM',
    short: 'Module F',
    title: 'Team, Survival Budget & Co-Founder Fit',
    subtitle: 'Promoter CVs, Survival Budget, 7 Hats & Blind-Reveal Alignment',
    icon: Users,
    progress: 0,
  },
  {
    code: 'MOD_G_LAUNCHPAD',
    short: 'Module G',
    title: 'Getting Set Up (Launchpad & Operations)',
    subtitle: 'Legal Entity, Domain & Email, Banking, VAT/Payroll, Insurance & IP',
    icon: ShieldCheck,
    progress: 0,
  },
  {
    code: 'MOD_H_REVENUE',
    short: 'Module H',
    title: 'Selling, Sales Assumptions & Pocket Profit',
    subtitle: 'Pricing Architect, Written Sales Assumptions & Unit Economics',
    icon: DollarSign,
    progress: 0,
  },
  {
    code: 'MOD_I_MARKETING',
    short: 'Module I',
    title: 'Marketing, 4Ps & First 10 Customers',
    subtitle: '3-Second Hook, 4Ps Strategy, Day-1 Hustle & Reverse Budget',
    icon: Megaphone,
    progress: 0,
  },
  {
    code: 'MOD_J_FINANCE',
    short: 'Module J',
    title: 'Financials, 36-Mo Cashflow & Legal Shield',
    subtitle: 'No-Spreadsheet Builder, Localized Taxes, Cash Trough & IP Shield',
    icon: Scale,
    progress: 0,
  },
  {
    code: 'MOD_K_GRANTS_FUNDING',
    short: 'Module K',
    title: 'Grants, Loans & Tax Relief Hub',
    subtitle: 'IE LEO / EI / SURE & UK Start Up Loans / Innovate UK / SEIS Matcher',
    icon: Sparkles,
    progress: 0,
  },
  {
    code: 'MOD_L_BUSINESS_PLAN',
    short: 'Module L',
    title: 'Living Business Plan & Grant Compiler',
    subtitle: '5 Official Modes (IE LEO, Innovate UK, Start Up Loans, SEIS, Plan)',
    icon: FileText,
    progress: 0,
  },
];

function resolveModuleFromParam(
  param?: string | null
): ModuleCode | null {
  if (!param) return null;
  const clean = param.trim().toUpperCase();
  const validCodes: ModuleCode[] = [
    'MOD_A_IDEATION',
    'MOD_B_MARKET',
    'MOD_C_SURVEYS_FEEDBACK',
    'MOD_D_PRODUCT_BUILD',
    'MOD_E_OPERATIONS',
    'MOD_F_COFOUNDER_TEAM',
    'MOD_G_LAUNCHPAD',
    'MOD_H_REVENUE',
    'MOD_I_MARKETING',
    'MOD_J_FINANCE',
    'MOD_K_GRANTS_FUNDING',
    'MOD_L_BUSINESS_PLAN',
  ];
  if (validCodes.includes(clean as ModuleCode)) {
    return clean as ModuleCode;
  }
  const aliases: Record<string, ModuleCode> = {
    A: 'MOD_A_IDEATION',
    MOD_A: 'MOD_A_IDEATION',
    IDEATION: 'MOD_A_IDEATION',
    B: 'MOD_B_MARKET',
    MOD_B: 'MOD_B_MARKET',
    MARKET: 'MOD_B_MARKET',
    C: 'MOD_C_SURVEYS_FEEDBACK',
    MOD_C: 'MOD_C_SURVEYS_FEEDBACK',
    SURVEYS: 'MOD_C_SURVEYS_FEEDBACK',
    FEEDBACK: 'MOD_C_SURVEYS_FEEDBACK',
    D: 'MOD_D_PRODUCT_BUILD',
    MOD_D: 'MOD_D_PRODUCT_BUILD',
    PRODUCT: 'MOD_D_PRODUCT_BUILD',
    BUILD: 'MOD_D_PRODUCT_BUILD',
    E: 'MOD_E_OPERATIONS',
    MOD_E: 'MOD_E_OPERATIONS',
    OPERATIONS: 'MOD_E_OPERATIONS',
    F: 'MOD_F_COFOUNDER_TEAM',
    MOD_F: 'MOD_F_COFOUNDER_TEAM',
    TEAM: 'MOD_F_COFOUNDER_TEAM',
    COFOUNDER: 'MOD_F_COFOUNDER_TEAM',
    G: 'MOD_G_LAUNCHPAD',
    MOD_G: 'MOD_G_LAUNCHPAD',
    LAUNCHPAD: 'MOD_G_LAUNCHPAD',
    H: 'MOD_H_REVENUE',
    MOD_H: 'MOD_H_REVENUE',
    REVENUE: 'MOD_H_REVENUE',
    PRICING: 'MOD_H_REVENUE',
    I: 'MOD_I_MARKETING',
    MOD_I: 'MOD_I_MARKETING',
    MARKETING: 'MOD_I_MARKETING',
    J: 'MOD_J_FINANCE',
    MOD_J: 'MOD_J_FINANCE',
    FINANCE: 'MOD_J_FINANCE',
    K: 'MOD_K_GRANTS_FUNDING',
    MOD_K: 'MOD_K_GRANTS_FUNDING',
    GRANTS: 'MOD_K_GRANTS_FUNDING',
    FUNDING: 'MOD_K_GRANTS_FUNDING',
    L: 'MOD_L_BUSINESS_PLAN',
    MOD_L: 'MOD_L_BUSINESS_PLAN',
    PLAN: 'MOD_L_BUSINESS_PLAN',
    BUSINESS_PLAN: 'MOD_L_BUSINESS_PLAN',
  };
  return aliases[clean] || null;
}

function resolveModuleFromStep(step?: string | null): ModuleCode | null {
  if (!step) return null;
  if (step.startsWith('MOD_L')) return 'MOD_L_BUSINESS_PLAN';
  if (step.startsWith('MOD_K')) return 'MOD_K_GRANTS_FUNDING';
  if (step.startsWith('MOD_J')) return 'MOD_J_FINANCE';
  if (step.startsWith('MOD_I')) return 'MOD_I_MARKETING';
  if (step.startsWith('MOD_H')) return 'MOD_H_REVENUE';
  if (step.startsWith('MOD_G')) return 'MOD_G_LAUNCHPAD';
  if (step.startsWith('MOD_F')) return 'MOD_F_COFOUNDER_TEAM';
  if (step.startsWith('MOD_E')) return 'MOD_E_OPERATIONS';
  if (step.startsWith('MOD_D')) return 'MOD_D_PRODUCT_BUILD';
  if (step.startsWith('MOD_C')) return 'MOD_C_SURVEYS_FEEDBACK';
  if (step.startsWith('MOD_B')) return 'MOD_B_MARKET';
  if (step.startsWith('MOD_A')) return 'MOD_A_IDEATION';
  return null;
}

export default function WorkspacePage() {
  const router = useRouter();
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
  const [isDashboardOpen, setIsDashboardOpen] = useState(true);
  const [activeModule, setActiveModule] =
    useState<ModuleCode>('MOD_A_IDEATION');
  const [isMasterDocumentOpen, setIsMasterDocumentOpen] = useState(false);
  const [isBusinessPlanStudioOpen, setIsBusinessPlanStudioOpen] = useState(false);
  const [hasHydratedLocation, setHasHydratedLocation] = useState(false);
  const hasHydratedLocationRef = useRef(false);
  const sessionRef = useRef(session);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);
  const [pendingModuleAfterUnlock, setPendingModuleAfterUnlock] =
    useState<ModuleCode | null>(null);
  const [planDropdownOpen, setPlanDropdownOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [isDeletingPlan, setIsDeletingPlan] = useState(false);
  const [deletePlanError, setDeletePlanError] = useState<string | null>(null);
  const [isCloningPlan, setIsCloningPlan] = useState(false);
  const [clonePlanError, setClonePlanError] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showWhyCard, setShowWhyCard] = useState(true);
  const [showExamples, setShowExamples] = useState(false);
  const [showImStuckHelper, setShowImStuckHelper] = useState(false);
  const [askUnicornOpen, setAskUnicornOpen] = useState(false);
  const [paywallModalFeature, setPaywallModalFeature] = useState<string | null>(
    null
  );
  const [isRedirectingToStripe, setIsRedirectingToStripe] = useState(false);
  const [stripeCheckoutError, setStripeCheckoutError] = useState<string | null>(
    null
  );
  const [openQuestions, setOpenQuestions] = useState<string[]>([]);
  const [showAllOpenQuestions, setShowAllOpenQuestions] = useState(false);
  const [brainDumpText, setBrainDumpText] = useState('');
  const [cloudDbConnected, setCloudDbConnected] = useState<boolean | null>(
    null
  );

  // Module A Step Accordion / Dropdown View State (0 = all collapsed, 1..7, or 'ALL')
  const [openStep, setOpenStep] = useState<number | 'ALL'>(0);

  // Deep-link cross-module navigation targeting (step number + element id highlight)
  const [moduleNavTarget, setModuleNavTarget] = useState<{
    step?: number;
    highlightTarget?: string;
  } | null>(null);

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
  const [grantEligibilityCheck, setGrantEligibilityCheck] =
    useState<SavedGrantEligibilityCheck>(() =>
      getDefaultGrantEligibilityCheck({
        hqCountryCode: 'IE',
        industryCategory: 'B2B SaaS / AI App',
        exportPotential: 'DOMESTIC_ONLY',
      })
    );
  const [isRunningGrantAdvisor, setIsRunningGrantAdvisor] = useState(false);
  const [thingsToConsider, setThingsToConsider] = useState<BlindSpotItem[]>([]);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isEditingCanvas, setIsEditingCanvas] = useState(false);
  const [isSavingCanvas, setIsSavingCanvas] = useState(false);
  const [synthesisBanner, setSynthesisBanner] = useState<string | null>(null);

  // Hydrate from localStorage first, then sync with Cloud SQL PostgreSQL session cookie if present
  useEffect(() => {
    function applySessionToWorkspace(loaded: BmuLocalSession) {
      let resolvedPlanId = loaded.activePlanId;
      if (typeof window !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search);
        const urlPlanId = searchParams.get('planId');
        const storedPlanId = localStorage.getItem('spf_last_active_plan_id');
        if (urlPlanId && loaded.plans.some((p) => p.id === urlPlanId)) {
          resolvedPlanId = urlPlanId;
        } else if (storedPlanId && loaded.plans.some((p) => p.id === storedPlanId)) {
          resolvedPlanId = storedPlanId;
        }
      }

      const activePlan =
        loaded.plans.find((p) => p.id === resolvedPlanId) ||
        loaded.plans.find((p) => p.id === loaded.activePlanId) ||
        loaded.plans[0];

      if (activePlan) {
        if (loaded.activePlanId !== activePlan.id) {
          loaded = { ...loaded, activePlanId: activePlan.id };
          saveBmuSession(loaded);
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('spf_last_active_plan_id', activePlan.id);
            } catch {}
          }
        }
        setSession(loaded);
        setSelectedCountry(activePlan.hqCountryCode);
        setBrainDumpText(activePlan.brainDumpText ?? '');
        setConceptCanvas(activePlan.conceptCanvas || null);
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
        setGrantEligibilityCheck(
          activePlan.grantEligibilityCheck ||
            getDefaultGrantEligibilityCheck({
              hqCountryCode: activePlan.hqCountryCode,
              industryCategory: activePlan.industryCategory,
              exportPotential: activePlan.exportPotential,
            })
        );
        setThingsToConsider(activePlan.thingsToConsider || []);
        setOpenQuestions(activePlan.openQuestions || []);
        // Resolve initial module / view:
        // Default on login (/workspace with no view/module params) is the Project Dashboard.
        let resolvedDashboard = true;
        let resolvedMasterDoc = false;
        let resolvedBpStudio = false;
        let resolvedInitialMod: ModuleCode | null = null;

        if (typeof window !== 'undefined') {
          const searchParams = new URLSearchParams(window.location.search);
          const viewParam = searchParams.get('view');
          const moduleParam = searchParams.get('module');

          if (viewParam === 'dashboard') {
            resolvedDashboard = true;
          } else if (
            viewParam === 'business_plan_studio' ||
            viewParam === 'bp_studio' ||
            moduleParam === 'business_plan_studio'
          ) {
            resolvedDashboard = false;
            resolvedBpStudio = true;
          } else if (
            viewParam === 'master_doc' ||
            moduleParam === 'master_doc'
          ) {
            resolvedDashboard = false;
            resolvedMasterDoc = true;
          } else if (moduleParam) {
            const fromParam = resolveModuleFromParam(moduleParam);
            if (fromParam) {
              resolvedDashboard = false;
              resolvedInitialMod = fromParam;
              const stepParam = searchParams.get('step');
              if (stepParam) {
                const parsedStep = parseInt(stepParam, 10);
                if (!isNaN(parsedStep) && parsedStep > 0) {
                  setModuleNavTarget({ step: parsedStep });
                  if (fromParam === 'MOD_A_IDEATION') {
                    setOpenStep(parsedStep);
                  }
                }
              }
            }
          }

          if (!resolvedInitialMod) {
            const storedModule =
              localStorage.getItem(`spf_active_module_${activePlan.id}`) ||
              localStorage.getItem('spf_last_active_module');
            const fromStorage = resolveModuleFromParam(storedModule);
            if (fromStorage) {
              resolvedInitialMod = fromStorage;
            }
          }
        }

        if (!resolvedInitialMod) {
          resolvedInitialMod =
            resolveModuleFromStep(activePlan.currentModuleStep) ||
            'MOD_A_IDEATION';
        }

        setActiveModule(resolvedInitialMod);

        if (resolvedDashboard) {
          setIsDashboardOpen(true);
          setIsBusinessPlanStudioOpen(false);
          setIsMasterDocumentOpen(false);
        } else if (resolvedBpStudio) {
          setIsDashboardOpen(false);
          setIsBusinessPlanStudioOpen(true);
          setIsMasterDocumentOpen(false);
        } else if (resolvedMasterDoc) {
          setIsDashboardOpen(false);
          setIsBusinessPlanStudioOpen(false);
          setIsMasterDocumentOpen(true);
        } else {
          setIsDashboardOpen(false);
          setIsBusinessPlanStudioOpen(false);
          setIsMasterDocumentOpen(false);
        }

        hasHydratedLocationRef.current = true;
        setHasHydratedLocation(true);
      }
    }

    const hasLocalSession = hasActiveBmuSession();
    if (!hasLocalSession) {
      // First attempt hydration from Cloud SQL session cookie (e.g. after Google OAuth or fresh browser)
      getCurrentCloudSessionAction()
        .then((res) => {
          setCloudDbConnected(res.dbConnected);
          if (res.authenticated && res.session) {
            saveBmuSession(res.session);
            applySessionToWorkspace(res.session);
          } else {
            router.replace('/login');
          }
        })
        .catch(() => {
          router.replace('/login');
        });
      return;
    }

    const loaded = loadBmuSession();
    applySessionToWorkspace(loaded);

    getCurrentCloudSessionAction()
      .then((res) => {
        setCloudDbConnected(res.dbConnected);
        if (res.authenticated && res.session) {
          setSession((prev) => {
            const pickNewerBySavedAt = <T extends { lastSavedAt?: string }>(
              localVal?: T,
              dbVal?: T
            ): T | undefined => {
              if (localVal && !dbVal) return localVal;
              if (!localVal && dbVal) return dbVal;
              if (!localVal && !dbVal) return undefined;
              const localTs = localVal?.lastSavedAt
                ? new Date(localVal.lastSavedAt).getTime()
                : 0;
              const dbTs = dbVal?.lastSavedAt
                ? new Date(dbVal.lastSavedAt).getTime()
                : 0;
              return localTs >= dbTs ? localVal : dbVal;
            };

            const cloudEmail = res.session!.user.email.trim().toLowerCase();
            const localSourcePlans =
              prev.user.email?.trim().toLowerCase() === cloudEmail
                ? prev.plans
                : loadBmuSessionForEmail(cloudEmail)?.plans || [];

            const mergedPlans = res.session!.plans.map((dbPlan) => {
              const localPlan = localSourcePlans.find(
                (lp) => lp.id === dbPlan.id
              );
              if (!localPlan) return dbPlan;

              // Merge moduleCData surveys & responses by publicSlug so neither local nor cloud loses questions or responses
              const dbSurveys = dbPlan.moduleCData?.surveys || [];
              const localSurveys = localPlan.moduleCData?.surveys || [];
              const surveyBySlug = new Map<string, SavedValidationSurvey>();

              for (const s of localSurveys) {
                const key = s.publicSlug || s.id;
                surveyBySlug.set(key, {
                  ...s,
                  responses: deduplicateSurveyResponses(s.responses || []),
                });
              }
              for (const dbS of dbSurveys) {
                const key = dbS.publicSlug || dbS.id;
                const existing = surveyBySlug.get(key);
                if (!existing) {
                  surveyBySlug.set(key, {
                    ...dbS,
                    responses: deduplicateSurveyResponses(dbS.responses || []),
                  });
                } else {
                  const mergedResponses = deduplicateSurveyResponses([
                    ...(dbS.responses || []),
                    ...(existing.responses || []),
                  ]);
                  surveyBySlug.set(key, {
                    ...existing,
                    ...dbS,
                    questions:
                      dbS.questions && dbS.questions.length > 0
                        ? dbS.questions
                        : existing.questions || [],
                    responses: mergedResponses,
                    aiInsightsSummary:
                      dbS.aiInsightsSummary || existing.aiInsightsSummary,
                  });
                }
              }

              const combinedSurveys = Array.from(surveyBySlug.values());
              const hasNonEmpty = combinedSurveys.some(
                (s) => s.questions.length > 0 || s.responses.length > 0
              );
              const cleanedSurveys = hasNonEmpty
                ? combinedSurveys.filter(
                    (s, idx) =>
                      s.questions.length > 0 ||
                      s.responses.length > 0 ||
                      idx === combinedSurveys.length - 1
                  )
                : combinedSurveys.slice(0, 1);

              const mergedModuleDData =
                localPlan.moduleDData || dbPlan.moduleDData
                  ? {
                      ...(dbPlan.moduleDData || {}),
                      ...(localPlan.moduleDData || {}),
                      productVehicle: pickNewerBySavedAt(
                        localPlan.moduleDData?.productVehicle,
                        dbPlan.moduleDData?.productVehicle
                      ),
                      channelMatrix: pickNewerBySavedAt(
                        localPlan.moduleDData?.channelMatrix,
                        dbPlan.moduleDData?.channelMatrix
                      ),
                      scopeFilter: pickNewerBySavedAt(
                        localPlan.moduleDData?.scopeFilter,
                        dbPlan.moduleDData?.scopeFilter
                      ),
                      buildVsBuy: pickNewerBySavedAt(
                        localPlan.moduleDData?.buildVsBuy,
                        dbPlan.moduleDData?.buildVsBuy
                      ),
                      workPackagesAndFlow: pickNewerBySavedAt(
                        localPlan.moduleDData?.workPackagesAndFlow,
                        dbPlan.moduleDData?.workPackagesAndFlow
                      ),
                      blindSpotAudit: pickNewerBySavedAt(
                        localPlan.moduleDData?.blindSpotAudit,
                        dbPlan.moduleDData?.blindSpotAudit
                      ),
                      thingsToConsider:
                        dbPlan.moduleDData?.thingsToConsider ||
                        localPlan.moduleDData?.thingsToConsider,
                      lastSavedAt:
                        pickNewerBySavedAt(
                          localPlan.moduleDData,
                          dbPlan.moduleDData
                        )?.lastSavedAt ||
                        localPlan.moduleDData?.lastSavedAt ||
                        dbPlan.moduleDData?.lastSavedAt,
                    }
                  : undefined;

              const mergedModuleEData =
                localPlan.moduleEData || dbPlan.moduleEData
                  ? {
                      ...(dbPlan.moduleEData || {}),
                      ...(localPlan.moduleEData || {}),
                      operationsBlueprint: pickNewerBySavedAt(
                        localPlan.moduleEData?.operationsBlueprint,
                        dbPlan.moduleEData?.operationsBlueprint
                      ),
                      premisesAndEquipment: pickNewerBySavedAt(
                        localPlan.moduleEData?.premisesAndEquipment,
                        dbPlan.moduleEData?.premisesAndEquipment
                      ),
                      thingsToConsider:
                        dbPlan.moduleEData?.thingsToConsider ||
                        localPlan.moduleEData?.thingsToConsider,
                      lastSavedAt:
                        pickNewerBySavedAt(
                          localPlan.moduleEData,
                          dbPlan.moduleEData
                        )?.lastSavedAt ||
                        localPlan.moduleEData?.lastSavedAt ||
                        dbPlan.moduleEData?.lastSavedAt,
                    }
                  : undefined;

              const mergedModuleFData =
                localPlan.moduleFData || dbPlan.moduleFData
                  ? {
                      ...(dbPlan.moduleFData || {}),
                      ...(localPlan.moduleFData || {}),
                      promoterProfiles: pickNewerBySavedAt(
                        localPlan.moduleFData?.promoterProfiles,
                        dbPlan.moduleFData?.promoterProfiles
                      ),
                      step2RoleMatrixData: pickNewerBySavedAt(
                        localPlan.moduleFData?.step2RoleMatrixData,
                        dbPlan.moduleFData?.step2RoleMatrixData
                      ),
                      step3SurvivalBudgetData: pickNewerBySavedAt(
                        localPlan.moduleFData?.step3SurvivalBudgetData,
                        dbPlan.moduleFData?.step3SurvivalBudgetData
                      ),
                      step4AlignmentData: pickNewerBySavedAt(
                        localPlan.moduleFData?.step4AlignmentData,
                        dbPlan.moduleFData?.step4AlignmentData
                      ),
                      step5HiringPlanData: pickNewerBySavedAt(
                        localPlan.moduleFData?.step5HiringPlanData,
                        dbPlan.moduleFData?.step5HiringPlanData
                      ),
                      step6BlindSpotAuditData: pickNewerBySavedAt(
                        localPlan.moduleFData?.step6BlindSpotAuditData,
                        dbPlan.moduleFData?.step6BlindSpotAuditData
                      ),
                      completionPercentage:
                        localPlan.moduleFData?.completionPercentage ??
                        dbPlan.moduleFData?.completionPercentage,
                      thingsToConsider:
                        dbPlan.moduleFData?.thingsToConsider ||
                        localPlan.moduleFData?.thingsToConsider,
                      lastSavedAt:
                        pickNewerBySavedAt(
                          localPlan.moduleFData,
                          dbPlan.moduleFData
                        )?.lastSavedAt ||
                        localPlan.moduleFData?.lastSavedAt ||
                        dbPlan.moduleFData?.lastSavedAt,
                    }
                  : undefined;

              const mergedModuleHData =
                localPlan.moduleHData || dbPlan.moduleHData
                  ? {
                      ...(dbPlan.moduleHData || {}),
                      ...(localPlan.moduleHData || {}),
                      step1RevenueModel: pickNewerBySavedAt(
                        localPlan.moduleHData?.step1RevenueModel,
                        dbPlan.moduleHData?.step1RevenueModel
                      ),
                      step2PricingTiers: pickNewerBySavedAt(
                        localPlan.moduleHData?.step2PricingTiers,
                        dbPlan.moduleHData?.step2PricingTiers
                      ),
                      step3BreakevenCalculator: pickNewerBySavedAt(
                        localPlan.moduleHData?.step3BreakevenCalculator,
                        dbPlan.moduleHData?.step3BreakevenCalculator
                      ),
                      step4SalesAssumptions: pickNewerBySavedAt(
                        localPlan.moduleHData?.step4SalesAssumptions,
                        dbPlan.moduleHData?.step4SalesAssumptions
                      ),
                      step5RevenueBrief: pickNewerBySavedAt(
                        localPlan.moduleHData?.step5RevenueBrief,
                        dbPlan.moduleHData?.step5RevenueBrief
                      ),
                      completionPercentage:
                        localPlan.moduleHData?.completionPercentage ??
                        dbPlan.moduleHData?.completionPercentage,
                      thingsToConsider:
                        dbPlan.moduleHData?.thingsToConsider ||
                        localPlan.moduleHData?.thingsToConsider,
                      lastSavedAt:
                        pickNewerBySavedAt(
                          localPlan.moduleHData,
                          dbPlan.moduleHData
                        )?.lastSavedAt ||
                        localPlan.moduleHData?.lastSavedAt ||
                        dbPlan.moduleHData?.lastSavedAt,
                    }
                  : undefined;

              const primaryModuleGData = pickNewerBySavedAt(
                localPlan.moduleGData,
                dbPlan.moduleGData
              );
              const mergedModuleGData = primaryModuleGData
                ? {
                    ...primaryModuleGData,
                    completionPercentage:
                      localPlan.moduleGData?.completionPercentage ??
                      dbPlan.moduleGData?.completionPercentage,
                    thingsToConsider:
                      dbPlan.moduleGData?.thingsToConsider ||
                      localPlan.moduleGData?.thingsToConsider,
                    lastSavedAt:
                      primaryModuleGData.lastSavedAt ||
                      localPlan.moduleGData?.lastSavedAt ||
                      dbPlan.moduleGData?.lastSavedAt,
                  }
                : undefined;

              const mergedModuleIData =
                localPlan.moduleIData || dbPlan.moduleIData
                  ? {
                      ...(dbPlan.moduleIData || {}),
                      ...(localPlan.moduleIData || {}),
                      step1Positioning: pickNewerBySavedAt(
                        localPlan.moduleIData?.step1Positioning,
                        dbPlan.moduleIData?.step1Positioning
                      ),
                      step2FourPs: pickNewerBySavedAt(
                        localPlan.moduleIData?.step2FourPs,
                        dbPlan.moduleIData?.step2FourPs
                      ),
                      step3First10: pickNewerBySavedAt(
                        localPlan.moduleIData?.step3First10,
                        dbPlan.moduleIData?.step3First10
                      ),
                      step4Budget: pickNewerBySavedAt(
                        localPlan.moduleIData?.step4Budget,
                        dbPlan.moduleIData?.step4Budget
                      ),
                      step5MarketingBrief: pickNewerBySavedAt(
                        localPlan.moduleIData?.step5MarketingBrief,
                        dbPlan.moduleIData?.step5MarketingBrief
                      ),
                      completionPercentage:
                        localPlan.moduleIData?.completionPercentage ??
                        dbPlan.moduleIData?.completionPercentage,
                      thingsToConsider:
                        dbPlan.moduleIData?.thingsToConsider ||
                        localPlan.moduleIData?.thingsToConsider,
                      lastSavedAt:
                        pickNewerBySavedAt(
                          localPlan.moduleIData,
                          dbPlan.moduleIData
                        )?.lastSavedAt ||
                        localPlan.moduleIData?.lastSavedAt ||
                        dbPlan.moduleIData?.lastSavedAt,
                    }
                  : undefined;

              const mergedModuleJData =
                localPlan.moduleJData || dbPlan.moduleJData
                  ? {
                      ...(dbPlan.moduleJData || {}),
                      ...(localPlan.moduleJData || {}),
                      lastSavedAt:
                        pickNewerBySavedAt(
                          localPlan.moduleJData,
                          dbPlan.moduleJData
                        )?.lastSavedAt ||
                        localPlan.moduleJData?.lastSavedAt ||
                        dbPlan.moduleJData?.lastSavedAt,
                    }
                  : undefined;

              const mergedModuleKData =
                localPlan.moduleKData || dbPlan.moduleKData
                  ? {
                      ...(dbPlan.moduleKData || {}),
                      ...(localPlan.moduleKData || {}),
                      lastSavedAt:
                        pickNewerBySavedAt(
                          localPlan.moduleKData,
                          dbPlan.moduleKData
                        )?.lastSavedAt ||
                        localPlan.moduleKData?.lastSavedAt ||
                        dbPlan.moduleKData?.lastSavedAt,
                    }
                  : undefined;

              const localModL = localPlan.moduleLData;
              const dbModL = dbPlan.moduleLData;

              // Merge versions by ID: preserve all versions created locally or in the cloud
              const versionsById = new Map<string, BusinessPlanVersionItem>();
              for (const v of dbModL?.versions || []) {
                if (v?.id) versionsById.set(v.id, v);
              }
              for (const v of localModL?.versions || []) {
                if (v?.id) {
                  const existing = versionsById.get(v.id);
                  if (!existing) {
                    versionsById.set(v.id, v);
                  } else {
                    const localTs = v.lastEditedAt ? new Date(v.lastEditedAt).getTime() : 0;
                    const dbTs = existing.lastEditedAt ? new Date(existing.lastEditedAt).getTime() : 0;
                    versionsById.set(v.id, localTs >= dbTs ? v : existing);
                  }
                }
              }
              const mergedVersions = Array.from(versionsById.values());

              const mergedModuleLData: SavedModuleLData | undefined = (localModL || dbModL)
                ? {
                    ...(dbModL || {}),
                    ...(localModL || {}),
                    step1Mode: pickNewerBySavedAt(
                      localModL?.step1Mode,
                      dbModL?.step1Mode
                    ),
                    step2Audit: pickNewerBySavedAt(
                      localModL?.step2Audit,
                      dbModL?.step2Audit
                    ),
                    step3Compiler: pickNewerBySavedAt(
                      localModL?.step3Compiler,
                      dbModL?.step3Compiler
                    ),
                    step4Appendices: pickNewerBySavedAt(
                      localModL?.step4Appendices,
                      dbModL?.step4Appendices
                    ),
                    step5DossierBrief: pickNewerBySavedAt(
                      localModL?.step5DossierBrief,
                      dbModL?.step5DossierBrief
                    ),
                    versions:
                      mergedVersions.length > 0
                        ? mergedVersions
                        : localModL?.versions || dbModL?.versions,
                    activeVersionId:
                      localModL?.activeVersionId ||
                      dbModL?.activeVersionId ||
                      mergedVersions[0]?.id,
                    completionPercentage:
                      localModL?.completionPercentage ?? dbModL?.completionPercentage,
                    thingsToConsider:
                      dbModL?.thingsToConsider || localModL?.thingsToConsider,
                    lastSavedAt:
                      pickNewerBySavedAt(localModL, dbModL)?.lastSavedAt ||
                      localModL?.lastSavedAt ||
                      dbModL?.lastSavedAt,
                  }
                : undefined;

              const resolvedCurrentStep =
                localPlan.currentModuleStep === 'BUSINESS_PLAN_STUDIO'
                  ? 'BUSINESS_PLAN_STUDIO'
                  : localPlan.currentModuleStep?.startsWith('MOD_L') &&
                    !dbPlan.currentModuleStep?.startsWith('MOD_L')
                  ? localPlan.currentModuleStep
                  : localPlan.currentModuleStep?.startsWith('MOD_I') &&
                    !dbPlan.currentModuleStep?.startsWith('MOD_I')
                  ? localPlan.currentModuleStep
                  : localPlan.currentModuleStep?.startsWith('MOD_H') &&
                    !dbPlan.currentModuleStep?.startsWith('MOD_H')
                  ? localPlan.currentModuleStep
                  : localPlan.currentModuleStep?.startsWith('MOD_G') &&
                    !dbPlan.currentModuleStep?.startsWith('MOD_G')
                  ? localPlan.currentModuleStep
                  : localPlan.currentModuleStep?.startsWith('MOD_F') &&
                    !dbPlan.currentModuleStep?.startsWith('MOD_F')
                  ? localPlan.currentModuleStep
                  : localPlan.currentModuleStep?.startsWith('MOD_E') &&
                      !dbPlan.currentModuleStep?.startsWith('MOD_E')
                    ? localPlan.currentModuleStep
                    : localPlan.currentModuleStep?.startsWith('MOD_D') &&
                        !dbPlan.currentModuleStep?.startsWith('MOD_D')
                      ? localPlan.currentModuleStep
                      : dbPlan.currentModuleStep || localPlan.currentModuleStep;

              return {
                ...localPlan,
                ...dbPlan,
                currentModuleStep: resolvedCurrentStep,
                moduleBData: dbPlan.moduleBData || localPlan.moduleBData,
                moduleCData:
                  cleanedSurveys.length > 0
                    ? {
                        surveys: cleanedSurveys,
                        activeSurveyId:
                          dbPlan.moduleCData?.activeSurveyId ||
                          localPlan.moduleCData?.activeSurveyId ||
                          cleanedSurveys[0]?.id,
                      }
                    : dbPlan.moduleCData || localPlan.moduleCData,
                moduleDData: mergedModuleDData,
                moduleEData: mergedModuleEData,
                moduleFData: mergedModuleFData,
                moduleGData: mergedModuleGData,
                moduleHData: mergedModuleHData,
                moduleIData: mergedModuleIData,
                moduleJData: mergedModuleJData,
                moduleKData: mergedModuleKData,
                moduleLData: mergedModuleLData,
                masterDocumentData: pickNewerBySavedAt(
                  localPlan.masterDocumentData,
                  dbPlan.masterDocumentData
                ),
              };
            });

            // Determine the intended active plan ID without blindly resetting to the first plan
            let candidatePlanId = prev.activePlanId;
            if (typeof window !== 'undefined') {
              const urlPlanId = new URLSearchParams(window.location.search).get('planId');
              const storedPlanId = localStorage.getItem('spf_last_active_plan_id');
              if (urlPlanId && mergedPlans.some((p) => p.id === urlPlanId)) {
                candidatePlanId = urlPlanId;
              } else if (prev.activePlanId && mergedPlans.some((p) => p.id === prev.activePlanId)) {
                candidatePlanId = prev.activePlanId;
              } else if (storedPlanId && mergedPlans.some((p) => p.id === storedPlanId)) {
                candidatePlanId = storedPlanId;
              }
            }

            if (!candidatePlanId || !mergedPlans.some((p) => p.id === candidatePlanId)) {
              candidatePlanId =
                res.session?.activePlanId && mergedPlans.some((p) => p.id === res.session!.activePlanId)
                  ? res.session.activePlanId
                  : mergedPlans[0]?.id || '';
            }

            const next: BmuLocalSession = {
              ...res.session!,
              plans: mergedPlans,
              activePlanId: candidatePlanId,
            };
            saveBmuSession(next);
            if (typeof window !== 'undefined' && candidatePlanId) {
              try {
                localStorage.setItem('spf_last_active_plan_id', candidatePlanId);
              } catch {}
            }
            return next;
          });

          // Resolve active plan using the preserved activePlanId rather than hardcoding to res.session.plans[0]
          const activePlanId =
            (typeof window !== 'undefined'
              ? new URLSearchParams(window.location.search).get('planId') ||
                localStorage.getItem('spf_last_active_plan_id')
              : null) ||
            sessionRef.current?.activePlanId ||
            res.session?.activePlanId;

          const dbPlan =
            res.session.plans.find((p) => p.id === activePlanId) ||
            sessionRef.current?.plans?.find((p) => p.id === activePlanId) ||
            res.session.plans.find(
              (p) => p.id === res.session?.activePlanId
            ) || res.session.plans[0];
          if (dbPlan) {
            setSelectedCountry(dbPlan.hqCountryCode);
            setBrainDumpText(dbPlan.brainDumpText ?? '');
            setConceptCanvas(dbPlan.conceptCanvas || null);
            if (dbPlan.founderMotivation) {
              setFounderMotivation(dbPlan.founderMotivation);
            }
            if (dbPlan.teamAndBudget) {
              setTeamAndBudget(dbPlan.teamAndBudget);
            }
            if (dbPlan.founderRealityCheck) {
              setFounderRealityCheck(dbPlan.founderRealityCheck);
            }
            if (dbPlan.grantEligibilityCheck) {
              setGrantEligibilityCheck(dbPlan.grantEligibilityCheck);
            }
            setThingsToConsider(dbPlan.thingsToConsider || []);
            setOpenQuestions(dbPlan.openQuestions || []);
            // Only fall back to cloud currentModuleStep if location wasn't already hydrated from URL/storage
            if (!hasHydratedLocationRef.current) {
              const cloudFromStep = resolveModuleFromStep(
                dbPlan.currentModuleStep
              );
              if (cloudFromStep) {
                setIsBusinessPlanStudioOpen(false);
                setIsMasterDocumentOpen(false);
                setActiveModule(cloudFromStep);
              }
            }
          }
        }
      })
      .catch(() => {
        setCloudDbConnected(false);
      });
  }, []);

  // Keep URL search params and localStorage strictly in sync with the active module and view
  useEffect(() => {
    if (!hasHydratedLocation) return;
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    const activePlanId = session?.activePlanId;
    if (activePlanId) {
      url.searchParams.set('planId', activePlanId);
      try {
        localStorage.setItem('spf_last_active_plan_id', activePlanId);
      } catch {}
    }

    if (isDashboardOpen) {
      url.searchParams.delete('module');
      url.searchParams.delete('step');
      url.searchParams.delete('view');
    } else if (isBusinessPlanStudioOpen) {
      url.searchParams.delete('module');
      url.searchParams.delete('step');
      url.searchParams.set('view', 'business_plan_studio');
    } else if (isMasterDocumentOpen) {
      url.searchParams.delete('module');
      url.searchParams.delete('step');
      url.searchParams.set('view', 'master_doc');
    } else {
      url.searchParams.delete('view');
      url.searchParams.set('module', activeModule);
      if (activeModule === 'MOD_A_IDEATION' && typeof openStep === 'number' && openStep > 0) {
        url.searchParams.set('step', String(openStep));
      } else if (moduleNavTarget?.step && moduleNavTarget.step > 0) {
        url.searchParams.set('step', String(moduleNavTarget.step));
      } else {
        url.searchParams.delete('step');
      }
    }

    if (url.search !== window.location.search) {
      window.history.replaceState(null, '', url.toString());
    }

    try {
      const activePlanId = session?.activePlanId;
      if (isDashboardOpen) {
        localStorage.setItem('spf_last_active_view', 'dashboard');
        if (activePlanId) {
          localStorage.setItem(`spf_active_view_${activePlanId}`, 'dashboard');
        }
      } else if (isBusinessPlanStudioOpen) {
        localStorage.setItem('spf_last_active_view', 'business_plan_studio');
        if (activePlanId) {
          localStorage.setItem(`spf_active_view_${activePlanId}`, 'business_plan_studio');
        }
      } else if (isMasterDocumentOpen) {
        localStorage.setItem('spf_last_active_view', 'master_doc');
        if (activePlanId) {
          localStorage.setItem(`spf_active_view_${activePlanId}`, 'master_doc');
        }
      } else {
        localStorage.removeItem('spf_last_active_view');
        localStorage.setItem('spf_last_active_module', activeModule);
        if (activePlanId) {
          localStorage.removeItem(`spf_active_view_${activePlanId}`);
          localStorage.setItem(
            `spf_active_module_${activePlanId}`,
            activeModule
          );
        }
      }
    } catch {
      // Storage quota / private mode fallback
    }
  }, [
    hasHydratedLocation,
    isDashboardOpen,
    activeModule,
    openStep,
    moduleNavTarget,
    isMasterDocumentOpen,
    isBusinessPlanStudioOpen,
    session?.activePlanId,
  ]);

  function handleSelectPlan(planId: string, pushHistory = true) {
    const currentSession = sessionRef.current || session;
    const found =
      currentSession.plans.find((p) => p.id === planId) ||
      session.plans.find((p) => p.id === planId);
    if (!found) return;

    const updated: BmuLocalSession = {
      ...currentSession,
      activePlanId: found.id,
    };
    setSession(updated);
    saveBmuSession(updated);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('spf_last_active_plan_id', found.id);
      } catch {}
    }

    // Persist active plan to user profile in Cloud SQL
    setActivePlanServerAction(found.id).catch(() => {});

    setSelectedCountry(found.hqCountryCode);
    setBrainDumpText(found.brainDumpText ?? '');
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
    setGrantEligibilityCheck(
      found.grantEligibilityCheck ||
        getDefaultGrantEligibilityCheck({
          hqCountryCode: found.hqCountryCode,
          industryCategory: found.industryCategory,
          exportPotential: found.exportPotential,
        })
    );
    if (!isGrantCheckerSupportedForCountry(found.hqCountryCode) && openStep === 8) {
      setOpenStep(7);
    }
    setThingsToConsider(found.thingsToConsider || []);
    setOpenQuestions(found.openQuestions || []);
    setPlanDropdownOpen(false);

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('planId', found.id);

      // Only determine view from storage or step if user explicitly switched plan (pushHistory = true)
      if (pushHistory) {
        const storedPlanView = localStorage.getItem(`spf_active_view_${found.id}`);
        if (storedPlanView === 'master_doc') {
          setIsDashboardOpen(false);
          setIsBusinessPlanStudioOpen(false);
          setIsMasterDocumentOpen(true);
          url.searchParams.delete('module');
          url.searchParams.delete('step');
          url.searchParams.set('view', 'master_doc');
        } else if (
          storedPlanView === 'business_plan_studio' ||
          storedPlanView === 'bp_studio'
        ) {
          setIsDashboardOpen(false);
          setIsBusinessPlanStudioOpen(true);
          setIsMasterDocumentOpen(false);
          url.searchParams.delete('module');
          url.searchParams.delete('step');
          url.searchParams.set('view', 'business_plan_studio');
        } else if (storedPlanView === 'dashboard') {
          setIsDashboardOpen(true);
          setIsBusinessPlanStudioOpen(false);
          setIsMasterDocumentOpen(false);
          url.searchParams.delete('module');
          url.searchParams.delete('step');
          url.searchParams.delete('view');
        } else {
          const storedPlanModule = localStorage.getItem(`spf_active_module_${found.id}`);
          const resolvedStored = resolveModuleFromParam(storedPlanModule);
          if (resolvedStored) {
            setIsDashboardOpen(false);
            setIsBusinessPlanStudioOpen(false);
            setIsMasterDocumentOpen(false);
            setActiveModule(resolvedStored);
            url.searchParams.delete('view');
            url.searchParams.set('module', resolvedStored);
          } else {
            const fromStep = resolveModuleFromStep(found.currentModuleStep);
            if (fromStep) {
              setIsDashboardOpen(false);
              setIsBusinessPlanStudioOpen(false);
              setIsMasterDocumentOpen(false);
              setActiveModule(fromStep);
              url.searchParams.delete('view');
              url.searchParams.set('module', fromStep);
            }
          }
        }
        window.history.pushState(null, '', url.toString());
      } else {
        window.history.replaceState(null, '', url.toString());
      }
    }
  }

  // Handle browser Back / Forward navigation smoothly with step restoration
  useEffect(() => {
    const handlePopState = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const planIdParam = searchParams.get('planId');
      const viewParam = searchParams.get('view');
      const moduleParam = searchParams.get('module');
      const stepParam = searchParams.get('step');
      const parsedStep = stepParam ? parseInt(stepParam, 10) : undefined;
      const validStep = parsedStep && !isNaN(parsedStep) && parsedStep > 0 ? parsedStep : undefined;

      // 1. If planId in URL differs from current activePlanId, switch plan state without pushing new history
      if (planIdParam && planIdParam !== sessionRef.current?.activePlanId) {
        const matchingPlan = sessionRef.current?.plans?.find((p) => p.id === planIdParam);
        if (matchingPlan) {
          handleSelectPlan(matchingPlan.id, false);
        }
      }

      // 2. Synchronize view / module / step with the popped URL state
      if (viewParam === 'dashboard') {
        setIsDashboardOpen(true);
        setIsBusinessPlanStudioOpen(false);
        setIsMasterDocumentOpen(false);
        setModuleNavTarget(null);
      } else if (
        viewParam === 'business_plan_studio' ||
        viewParam === 'bp_studio' ||
        moduleParam === 'business_plan_studio'
      ) {
        setIsDashboardOpen(false);
        setIsBusinessPlanStudioOpen(true);
        setIsMasterDocumentOpen(false);
        setModuleNavTarget(null);
      } else if (
        viewParam === 'master_doc' ||
        moduleParam === 'master_doc'
      ) {
        setIsDashboardOpen(false);
        setIsBusinessPlanStudioOpen(false);
        setIsMasterDocumentOpen(true);
        setModuleNavTarget(null);
      } else if (moduleParam) {
        const resolved = resolveModuleFromParam(moduleParam);
        if (resolved) {
          setIsDashboardOpen(false);
          setIsBusinessPlanStudioOpen(false);
          setIsMasterDocumentOpen(false);
          setActiveModule(resolved);
          if (validStep) {
            setModuleNavTarget({ step: validStep });
            if (resolved === 'MOD_A_IDEATION') {
              setOpenStep(validStep);
            }
          } else {
            setModuleNavTarget(null);
            setOpenStep(0);
          }
        }
      } else {
        setIsDashboardOpen(true);
        setIsBusinessPlanStudioOpen(false);
        setIsMasterDocumentOpen(false);
        setModuleNavTarget(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  function openProjectDashboardWithHistory() {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('module');
      url.searchParams.delete('step');
      url.searchParams.delete('view');
      const activeId = sessionRef.current?.activePlanId || session.activePlanId;
      if (activeId) {
        url.searchParams.set('planId', activeId);
      }
      window.history.pushState(null, '', url.toString());
    }
    setIsDashboardOpen(true);
    setIsBusinessPlanStudioOpen(false);
    setIsMasterDocumentOpen(false);
    setMobileSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openMasterDocumentWithHistory() {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('module');
      url.searchParams.delete('step');
      url.searchParams.set('view', 'master_doc');
      const activeId = sessionRef.current?.activePlanId || session.activePlanId;
      if (activeId) {
        url.searchParams.set('planId', activeId);
      }
      window.history.pushState(null, '', url.toString());
    }
    setIsDashboardOpen(false);
    setIsMasterDocumentOpen(true);
    setIsBusinessPlanStudioOpen(false);
    setMobileSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openBusinessPlanStudioWithHistory() {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('module');
      url.searchParams.delete('step');
      url.searchParams.set('view', 'business_plan_studio');
      const activeId = sessionRef.current?.activePlanId || session.activePlanId;
      if (activeId) {
        url.searchParams.set('planId', activeId);
      }
      window.history.pushState(null, '', url.toString());
    }
    setIsDashboardOpen(false);
    setIsBusinessPlanStudioOpen(true);
    setIsMasterDocumentOpen(false);
    setMobileSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function navigateToModuleWithHistory(modCode: ModuleCode, stepNum?: number, highlightId?: string) {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('view');
      url.searchParams.set('module', modCode);
      if (stepNum && stepNum > 0) {
        url.searchParams.set('step', String(stepNum));
      } else {
        url.searchParams.delete('step');
      }
      const activeId = sessionRef.current?.activePlanId || session.activePlanId;
      if (activeId) {
        url.searchParams.set('planId', activeId);
      }
      window.history.pushState(null, '', url.toString());
    }
    setIsDashboardOpen(false);
    setIsBusinessPlanStudioOpen(false);
    setIsMasterDocumentOpen(false);
    setActiveModule(modCode);
    if (modCode === 'MOD_A_IDEATION') {
      setOpenStep(stepNum || 0);
    }
    setModuleNavTarget(stepNum ? { step: stepNum, highlightTarget: highlightId } : null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  useEffect(() => {
    if (!isGrantCheckerSupportedForCountry(selectedCountry) && openStep === 8) {
      setOpenStep(7);
    }
    setGrantEligibilityCheck((prev) => {
      if (selectedCountry === 'IE' && prev.regionalLocationTier.startsWith('GB_')) {
        return { ...prev, regionalLocationTier: 'IE_STANDARD_50_MATCH' };
      }
      if (selectedCountry === 'GB' && prev.regionalLocationTier.startsWith('IE_')) {
        return { ...prev, regionalLocationTier: 'GB_ENGLAND_GROWTH_HUB' };
      }
      return prev;
    });
  }, [selectedCountry, openStep]);

  const currentPlan =
    session.plans.find((p) => p.id === session.activePlanId) ||
    session.plans[0] || {
      id: 'plan-default',
      title: 'My Startup Plan',
      oneLinerSummary: '',
      industryCategory: 'B2B SaaS / AI App' as const,
      hqCountryCode: selectedCountry,
      baseCurrency: 'EUR',
      targetMarketsArray: [selectedCountry],
      exportPotential: 'DOMESTIC_ONLY' as const,
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



  async function handleConfirmDeletePlan() {
    if (!planToDelete || isDeletingPlan) return;
    setIsDeletingPlan(true);
    setDeletePlanError(null);

    try {
      const planIdToDelete = planToDelete.id;
      // Mark as deleted in localStorage tombstones and remove from browser vault immediately
      markPlanAsDeletedInBrowserStorage(planIdToDelete);

      // Invoke server action to delete from Cloud SQL (with ownership verification)
      const res = await deleteStartupPlanAction({ planId: planIdToDelete });
      if (
        !res.ok &&
        res.error &&
        !res.error.includes('not found') &&
        !res.error.includes('DATABASE_UNAVAILABLE') &&
        !res.error.includes('UNAUTHENTICATED')
      ) {
        setDeletePlanError(res.error);
        setIsDeletingPlan(false);
        return;
      }

      // Filter out deleted plan from current session plans
      const remainingPlans = session.plans.filter((p) => p.id !== planIdToDelete);

      if (remainingPlans.length > 0) {
        // If the active plan was deleted, switch to the first remaining plan
        const nextActivePlan =
          session.activePlanId === planIdToDelete
            ? remainingPlans[0]
            : remainingPlans.find((p) => p.id === session.activePlanId) || remainingPlans[0];

        const nextSession: BmuLocalSession = {
          ...session,
          plans: remainingPlans,
          activePlanId: nextActivePlan.id,
        };
        setSession(nextSession);
        saveBmuSession(nextSession);
        handleSelectPlan(nextActivePlan.id);
      } else {
        // All plans were deleted, generate a fresh clean plan
        const freshPlan = createFreshStartupPlan(selectedCountry || 'IE');
        const nextSession: BmuLocalSession = {
          ...session,
          plans: [freshPlan],
          activePlanId: freshPlan.id,
        };
        setSession(nextSession);
        saveBmuSession(nextSession);
        handleSelectPlan(freshPlan.id);
      }

      setPlanToDelete(null);
      setPlanDropdownOpen(false);
    } catch (err: any) {
      setDeletePlanError(err?.message || 'Failed to delete plan.');
    } finally {
      setIsDeletingPlan(false);
    }
  }

  async function handleClonePlan() {
    if (isCloningPlan) return;

    if (!multiPlanCheck.allowed) {
      setPlanDropdownOpen(false);
      setPaywallModalFeature(
        'Clone & Pivot Plan (Test a B2B vs. B2C variation without losing your original plan)'
      );
      return;
    }

    if (!currentPlan) return;

    setIsCloningPlan(true);
    setClonePlanError(null);

    try {
      const pivotTitle = `${currentPlan.title} (Pivot)`;
      const res = await cloneStartupPlanAction({
        sourcePlanId: currentPlan.id,
        newTitle: pivotTitle,
      });

      if (!res.ok) {
        if (res.limitReached) {
          setPlanDropdownOpen(false);
          setPaywallModalFeature(
            'Clone & Pivot Plan (Test a B2B vs. B2C variation without losing your original plan)'
          );
          return;
        }
        setClonePlanError(res.error || 'Failed to clone plan.');
        return;
      }

      const newPlanId =
        res.newPlanId ||
        (typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `plan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);

      const clonedPlan: ActiveStartupPlan = {
        ...JSON.parse(JSON.stringify(currentPlan)),
        id: newPlanId,
        title: res.newPlanTitle || pivotTitle,
        isPivot: true,
      };

      // If survey data exists in module C, reset response data and generate unique survey slugs for the pivot
      if (clonedPlan.moduleCData?.surveys) {
        clonedPlan.moduleCData = {
          ...clonedPlan.moduleCData,
          surveys: clonedPlan.moduleCData.surveys.map((s: SavedValidationSurvey) => ({
            ...s,
            id: `srv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            publicSlug: `${s.publicSlug.slice(0, 36)}-pivot-${Math.random().toString(36).slice(2, 6)}`,
            title: `${s.title} (Pivot)`,
            responses: [],
            publishedAt: undefined,
          })),
        };
      }

      const updatedPlans = [clonedPlan, ...session.plans];
      const updatedSession: BmuLocalSession = {
        ...session,
        plans: updatedPlans,
        activePlanId: clonedPlan.id,
      };

      setSession(updatedSession);
      saveBmuSession(updatedSession);
      handleSelectPlan(clonedPlan.id);
      setPlanDropdownOpen(false);
    } catch (err: any) {
      setClonePlanError(err?.message || 'Failed to clone plan.');
    } finally {
      setIsCloningPlan(false);
    }
  }

  async function handleParkSpecificQuestion(questionText: string) {
    const clean = questionText.trim();
    if (!clean) return;
    if (!openQuestions.includes(clean)) {
      const next = [...openQuestions, clean];
      setOpenQuestions(next);
      const updatedPlans = session.plans.map((p) =>
        p.id === currentPlan.id ? { ...p, openQuestions: next } : p
      );
      const nextSession = { ...session, plans: updatedPlans };
      setSession(nextSession);
      saveBmuSession(nextSession);
      await parkOpenQuestionAction({
        planId: currentPlan.id,
        questionText: clean,
      });
    }
  }

  function handleResolveOpenQuestion(indexToRemove: number) {
    const next = openQuestions.filter((_, idx) => idx !== indexToRemove);
    setOpenQuestions(next);
    const updatedPlans = session.plans.map((p) =>
      p.id === currentPlan.id ? { ...p, openQuestions: next } : p
    );
    const nextSession = { ...session, plans: updatedPlans };
    setSession(nextSession);
    saveBmuSession(nextSession);
  }

  function handleParkQuestion() {
    const newQ = `Confirm urgent customer pain point & average unit price (${countryPack.defaultCurrency}) with 3 target buyers in ${countryPack.countryName}.`;
    handleParkSpecificQuestion(newQ);
  }

  async function handleParkModuleBQuestion(questionText: string) {
    const clean = questionText.trim();
    if (!clean) return;
    if (!openQuestions.includes(clean)) {
      const next = [...openQuestions, clean];
      setOpenQuestions(next);
      const updatedPlans = session.plans.map((p) =>
        p.id === currentPlan.id ? { ...p, openQuestions: next } : p
      );
      const nextSession = { ...session, plans: updatedPlans };
      setSession(nextSession);
      saveBmuSession(nextSession);
      await parkModuleBOpenQuestionAction({
        planId: currentPlan.id,
        questionText: clean,
      });
    }
  }

  async function handleSaveModuleBStep1(
    beachhead: BeachheadMarketData,
    progressPercent: number
  ) {
    const updatedPlans = session.plans.map((p) => {
      if (p.id !== currentPlan.id) return p;
      const isExport =
        beachhead.targetMarketsArray.some((m) => m !== p.hqCountryCode) ||
        beachhead.targetMarketsArray.includes('EU') ||
        beachhead.targetMarketsArray.includes('ROW');
      return {
        ...p,
        targetMarketsArray: beachhead.targetMarketsArray,
        exportPotential: isExport
          ? ('EXPORTING_INTERNATIONALLY' as const)
          : ('DOMESTIC_ONLY' as const),
        currentModuleStep: 'MOD_B_STEP_1',
        moduleBData: {
          ...(p.moduleBData || {}),
          beachhead,
        },
      };
    });

    const nextSession: BmuLocalSession = {
      ...session,
      plans: updatedPlans,
    };
    setSession(nextSession);
    saveBmuSession(nextSession);

    await saveModuleBStep1BeachheadAction({
      planId: currentPlan.id,
      beachhead,
      completionPercentage: progressPercent,
    });
  }

  async function handleSaveModuleBStep2(
    competitorsAndStatusQuo: CompetitorsAndStatusQuoData,
    progressPercent: number
  ) {
    const updatedPlans = session.plans.map((p) => {
      if (p.id !== currentPlan.id) return p;
      return {
        ...p,
        currentModuleStep: 'MOD_B_STEP_2',
        moduleBData: {
          ...(p.moduleBData || {}),
          competitorsAndStatusQuo,
        },
      };
    });

    const nextSession: BmuLocalSession = {
      ...session,
      plans: updatedPlans,
    };
    setSession(nextSession);
    saveBmuSession(nextSession);

    await saveModuleBStep2CompetitorsAction({
      planId: currentPlan.id,
      competitorsAndStatusQuo,
      completionPercentage: progressPercent,
    });
  }

  async function handleScoutModuleBCompetitors(params: {
    targetCustomerDescription: string;
    targetMarketsArray: string[];
    buyerTypes: BuyerModelType[];
  }) {
    if (!aiCreditCheck.allowed) {
      setPaywallModalFeature(
        `AI Market Scout (${aiCreditCheck.reason})`
      );
      return null;
    }

    const result = await scoutModuleBCompetitorsWithAiAction({
      userId: session.user.id,
      planId: currentPlan.id,
      planTitle: currentPlan.title,
      brainDumpText,
      coreProblem: effectiveCanvas.coreProblem,
      proposedSolution: effectiveCanvas.proposedSolution,
      targetCustomerDescription: params.targetCustomerDescription,
      industryCategory: currentPlan.industryCategory,
      hqCountryCode: selectedCountry,
      targetMarketsArray: params.targetMarketsArray,
      buyerTypes: params.buyerTypes,
    });

    const updatedSession: BmuLocalSession = {
      ...session,
      entitlement: {
        ...session.entitlement,
        aiCreditsUsedThisMonth:
          result.creditsUsedAfter ??
          session.entitlement.aiCreditsUsedThisMonth + 1,
      },
    };
    setSession(updatedSession);
    saveBmuSession(updatedSession);

    return {
      competitors: result.competitors,
      suggestedWhySwitchSentence: result.suggestedWhySwitchSentence,
      engineMode: result.engineMode,
    };
  }

  async function handleSaveModuleBStep3(
    marketSizing: MarketSizingData,
    progressPercent: number
  ) {
    const updatedPlans = session.plans.map((p) => {
      if (p.id !== currentPlan.id) return p;
      return {
        ...p,
        currentModuleStep: 'MOD_B_STEP_3',
        moduleBData: {
          ...(p.moduleBData || {}),
          marketSizing,
        },
      };
    });

    const nextSession: BmuLocalSession = {
      ...session,
      plans: updatedPlans,
    };
    setSession(nextSession);
    saveBmuSession(nextSession);

    await saveModuleBStep3MarketSizingAction({
      planId: currentPlan.id,
      marketSizing,
      completionPercentage: progressPercent,
    });
  }

  async function handleEstimateModuleBMarketSizing(params: {
    targetCustomerDescription: string;
    targetMarketsArray: string[];
    buyerTypes: BuyerModelType[];
  }) {
    if (!aiCreditCheck.allowed) {
      setPaywallModalFeature(
        `AI Market Sizing Estimator (${aiCreditCheck.reason})`
      );
      return null;
    }

    const result = await estimateModuleBMarketSizingWithAiAction({
      userId: session.user.id,
      planId: currentPlan.id,
      planTitle: currentPlan.title,
      brainDumpText,
      targetCustomerDescription: params.targetCustomerDescription,
      industryCategory: currentPlan.industryCategory,
      hqCountryCode: selectedCountry,
      targetMarketsArray: params.targetMarketsArray,
      buyerTypes: params.buyerTypes,
    });

    const updatedSession: BmuLocalSession = {
      ...session,
      entitlement: {
        ...session.entitlement,
        aiCreditsUsedThisMonth:
          result.creditsUsedAfter ??
          session.entitlement.aiCreditsUsedThisMonth + 1,
      },
    };
    setSession(updatedSession);
    saveBmuSession(updatedSession);

    return {
      segments: result.segments,
      widerMarketMultiplier: result.widerMarketMultiplier,
      sourceAndAssumptionNotes: result.sourceAndAssumptionNotes,
      engineMode: result.engineMode,
    };
  }

  async function handleSaveModuleBStep4(
    competitiveWedge: CompetitiveWedgeData,
    progressPercent: number
  ) {
    const updatedPlans = session.plans.map((p) => {
      if (p.id !== currentPlan.id) return p;
      return {
        ...p,
        currentModuleStep: 'MOD_B_STEP_4',
        moduleBData: {
          ...(p.moduleBData || {}),
          competitiveWedge,
        },
      };
    });

    const nextSession: BmuLocalSession = {
      ...session,
      plans: updatedPlans,
    };
    setSession(nextSession);
    saveBmuSession(nextSession);

    await saveModuleBStep4CompetitiveWedgeAction({
      planId: currentPlan.id,
      competitiveWedge,
      completionPercentage: progressPercent,
    });
  }

  async function handleGenerateModuleBCompetitiveEdge(params: {
    targetCustomerDescription: string;
    targetMarketsArray: string[];
    competitorNames: string[];
  }) {
    if (!aiCreditCheck.allowed) {
      setPaywallModalFeature(
        `AI Competitive Edge Builder (${aiCreditCheck.reason})`
      );
      return null;
    }

    const result = await generateModuleBCompetitiveEdgeWithAiAction({
      userId: session.user.id,
      planId: currentPlan.id,
      planTitle: currentPlan.title,
      brainDumpText,
      targetCustomerDescription: params.targetCustomerDescription,
      industryCategory: currentPlan.industryCategory,
      hqCountryCode: selectedCountry,
      targetMarketsArray: params.targetMarketsArray,
      competitorNames: params.competitorNames,
    });

    const updatedSession: BmuLocalSession = {
      ...session,
      entitlement: {
        ...session.entitlement,
        aiCreditsUsedThisMonth:
          result.creditsUsedAfter ??
          session.entitlement.aiCreditsUsedThisMonth + 1,
      },
    };
    setSession(updatedSession);
    saveBmuSession(updatedSession);

    return {
      comparisonRows: result.comparisonRows,
      switchingFrictionReducers: result.switchingFrictionReducers,
      switchingFrictionPlanNotes: result.switchingFrictionPlanNotes,
      unfairAdvantages: result.unfairAdvantages,
      competitiveEdgeSummary: result.competitiveEdgeSummary,
      engineMode: result.engineMode,
    };
  }

  async function handleSaveModuleBStep5(thingsToConsider: BlindSpotItem[]) {
    if (!session || !currentPlan || activeEntitlement.isVaultReadonly) return;

    const updatedPlans = session.plans.map((p) => {
      if (p.id !== currentPlan.id) return p;
      return {
        ...p,
        moduleBData: {
          ...p.moduleBData,
          thingsToConsider,
        },
        updatedAtIso: new Date().toISOString(),
      };
    });

    const updatedSession: BmuLocalSession = {
      ...session,
      plans: updatedPlans,
    };
    setSession(updatedSession);
    saveBmuSession(updatedSession);

    await saveModuleBStep5CompleteAction({
      planId: currentPlan.id,
      thingsToConsider,
    });
  }

  // =========================================================================
  // MODULE C: CUSTOMER VALIDATION SURVEY BUILDER & INSIGHTS HANDLERS
  // =========================================================================
  async function handleSaveModuleCSurvey(
    survey: SavedValidationSurvey,
    allSurveys: SavedValidationSurvey[]
  ) {
    if (!session || !currentPlan || activeEntitlement.isVaultReadonly) return;
    const planId = currentPlan.id;

    setSession((prev) => {
      const updatedPlans = prev.plans.map((p) => {
        if (p.id !== planId) return p;
        return {
          ...p,
          currentModuleStep: 'MOD_C_SURVEYS_FEEDBACK',
          moduleCData: {
            ...(p.moduleCData || { surveys: [] }),
            surveys: allSurveys,
            activeSurveyId: survey.id,
          },
          updatedAtIso: new Date().toISOString(),
        };
      });
      const nextSession: BmuLocalSession = {
        ...prev,
        plans: updatedPlans,
      };
      saveBmuSession(nextSession);
      return nextSession;
    });

    await saveValidationSurveyAction({
      planId,
      survey,
      allSurveys,
    });
  }

  async function handleDeleteModuleCSurvey(
    surveyId: string,
    publicSlug: string,
    remainingSurveys: SavedValidationSurvey[]
  ) {
    if (!session || !currentPlan || activeEntitlement.isVaultReadonly) return;
    const planId = currentPlan.id;

    setSession((prev) => {
      const updatedPlans = prev.plans.map((p) => {
        if (p.id !== planId) return p;
        return {
          ...p,
          moduleCData: {
            ...(p.moduleCData || { surveys: [] }),
            surveys: remainingSurveys,
            activeSurveyId: remainingSurveys[0]?.id,
          },
          updatedAtIso: new Date().toISOString(),
        };
      });
      const nextSession: BmuLocalSession = {
        ...prev,
        plans: updatedPlans,
      };
      saveBmuSession(nextSession);
      return nextSession;
    });

    await deleteValidationSurveyAction({
      planId,
      publicSlug,
      remainingSurveys,
    });
  }

  async function handleGenerateModuleCSurveyWithAi(params: {
    focusAreas: SurveyFocusAreaType[];
    otherFocusAreaText?: string;
    customAiFocusPrompt?: string;
    questionCount: number;
  }) {
    if (!aiCreditCheck.allowed) {
      setPaywallModalFeature(
        `AI Mom-Test Survey Builder (${aiCreditCheck.reason})`
      );
      return null;
    }

    const targetDesc =
      currentPlan.moduleBData?.beachhead?.beachheadSegment ||
      effectiveCanvas.targetCustomer ||
      'Target customers';

    const result = await generateModuleCSurveyWithAiAction({
      userId: session.user.id,
      planId: currentPlan.id,
      planTitle: currentPlan.title,
      brainDumpText,
      coreProblem: effectiveCanvas.coreProblem,
      proposedSolution: effectiveCanvas.proposedSolution,
      unfairAdvantage: effectiveCanvas.unfairAdvantage,
      revenueAndGrantFit: effectiveCanvas.revenueAndGrantFit,
      targetCustomer: targetDesc,
      moduleBData: currentPlan.moduleBData,
      industryCategory: currentPlan.industryCategory,
      hqCountryCode: selectedCountry,
      focusAreas: params.focusAreas,
      otherFocusAreaText: params.otherFocusAreaText,
      customAiFocusPrompt: params.customAiFocusPrompt,
      questionCount: params.questionCount,
    });

    setSession((prev) => {
      const updatedSession: BmuLocalSession = {
        ...prev,
        entitlement: {
          ...prev.entitlement,
          aiCreditsUsedThisMonth:
            result.creditsUsedAfter ??
            prev.entitlement.aiCreditsUsedThisMonth + 1,
        },
      };
      saveBmuSession(updatedSession);
      return updatedSession;
    });

    return {
      title: result.title,
      introDescription: result.introDescription,
      waitlistIncentiveText: result.waitlistIncentiveText,
      questions: result.questions,
      engineMode: result.engineMode,
    };
  }

  async function handleCheckMomTestQuestionWithAi(params: {
    questionText: string;
    questionType: SurveyQuestionItem['type'];
    currentOptions?: string[];
  }) {
    if (!aiCreditCheck.allowed) {
      setPaywallModalFeature(
        `AI Mom-Test Question Check (${aiCreditCheck.reason})`
      );
      return null;
    }

    const targetDesc =
      currentPlan.moduleBData?.beachhead?.beachheadSegment ||
      effectiveCanvas.targetCustomer ||
      'Target customers';

    const result = await checkMomTestQuestionWithAiAction({
      userId: session.user.id,
      planId: currentPlan.id,
      planTitle: currentPlan.title,
      industryCategory: currentPlan.industryCategory,
      hqCountryCode: selectedCountry,
      coreProblem: effectiveCanvas.coreProblem,
      targetCustomer: targetDesc,
      moduleBData: currentPlan.moduleBData,
      questionText: params.questionText,
      questionType: params.questionType,
      currentOptions: params.currentOptions,
    });

    setSession((prev) => {
      const updatedSession: BmuLocalSession = {
        ...prev,
        entitlement: {
          ...prev.entitlement,
          aiCreditsUsedThisMonth:
            result.creditsUsedAfter ??
            prev.entitlement.aiCreditsUsedThisMonth + 1,
        },
      };
      saveBmuSession(updatedSession);
      return updatedSession;
    });

    return {
      momTestPassed: result.momTestPassed,
      momTestFeedback: result.momTestFeedback,
      momTestSuggestedRewrite: result.momTestSuggestedRewrite,
      suggestedOptions: result.suggestedOptions,
    };
  }

  async function handleSuggestNextQuestionWithAi(params: {
    existingQuestions: SurveyQuestionItem[];
    focusAreas?: SurveyFocusAreaType[];
  }) {
    if (!aiCreditCheck.allowed) {
      setPaywallModalFeature(
        `AI Next Question Suggestion (${aiCreditCheck.reason})`
      );
      return null;
    }

    const targetDesc =
      currentPlan.moduleBData?.beachhead?.beachheadSegment ||
      effectiveCanvas.targetCustomer ||
      'Target customers';

    const result = await suggestNextMomTestQuestionWithAiAction({
      planTitle: currentPlan.title,
      industryCategory: currentPlan.industryCategory,
      hqCountryCode: selectedCountry,
      coreProblem: effectiveCanvas.coreProblem,
      targetCustomer: targetDesc,
      proposedSolution: effectiveCanvas.proposedSolution,
      unfairAdvantage: effectiveCanvas.unfairAdvantage,
      moduleBData: currentPlan.moduleBData,
      existingQuestions: params.existingQuestions,
      focusAreas: params.focusAreas,
    });

    setSession((prev) => {
      const updatedSession: BmuLocalSession = {
        ...prev,
        entitlement: {
          ...prev.entitlement,
          aiCreditsUsedThisMonth:
            prev.entitlement.aiCreditsUsedThisMonth + 1,
        },
      };
      saveBmuSession(updatedSession);
      return updatedSession;
    });

    return result.question;
  }

  async function handleAnalyzeSurveyResultsWithAi(params: {
    surveyTitle: string;
    questions: SurveyQuestionItem[];
    responses: SavedSurveyResponse[];
    interviewLogs?: SavedCustomerInterviewLog[];
  }) {
    if (!aiCreditCheck.allowed) {
      setPaywallModalFeature(
        `AI Survey Insights Synthesizer (${aiCreditCheck.reason})`
      );
      return null;
    }

    const result = await analyzeSurveyResultsWithAiAction({
      userId: session.user.id,
      planId: currentPlan.id,
      planTitle: currentPlan.title,
      surveyTitle: params.surveyTitle,
      questions: params.questions,
      responses: params.responses,
      interviewLogs: params.interviewLogs,
    });

    setSession((prev) => {
      const updatedSession: BmuLocalSession = {
        ...prev,
        entitlement: {
          ...prev.entitlement,
          aiCreditsUsedThisMonth:
            result.creditsUsedAfter ??
            prev.entitlement.aiCreditsUsedThisMonth + 1,
        },
      };
      saveBmuSession(updatedSession);
      return updatedSession;
    });

    return result.insights;
  }

  async function handleSaveModuleCInterviewLogs(
    interviewLogs: SavedCustomerInterviewLog[]
  ) {
    setSession((prev) => {
      const updatedPlans = prev.plans.map((p) => {
        if (p.id !== currentPlan.id) return p;
        const existingModC = p.moduleCData || {
          surveys: [],
          activeSurveyId: undefined,
        };
        return {
          ...p,
          moduleCData: {
            ...existingModC,
            interviewLogs,
          },
        };
      });
      const updatedSession: BmuLocalSession = {
        ...prev,
        plans: updatedPlans,
      };
      saveBmuSession(updatedSession);
      return updatedSession;
    });

    await saveCustomerInterviewLogsAction({
      planId: currentPlan.id,
      interviewLogs,
    });
  }

  async function handleSaveModuleCBlindSpots(
    modCThingsToConsider: BlindSpotItem[]
  ) {
    setSession((prev) => {
      const updatedPlans = prev.plans.map((p) => {
        if (p.id !== currentPlan.id) return p;
        const existingModC = p.moduleCData || {
          surveys: [],
          activeSurveyId: undefined,
          interviewLogs: [],
        };
        const hasValidation =
          (existingModC.surveys || []).some((s) => s.questions.length > 0) ||
          (existingModC.interviewLogs || []).length > 0;
        return {
          ...p,
          moduleCData: {
            ...existingModC,
            thingsToConsider: hasValidation ? modCThingsToConsider : [],
          },
        };
      });
      const updatedSession: BmuLocalSession = {
        ...prev,
        plans: updatedPlans,
      };
      saveBmuSession(updatedSession);
      return updatedSession;
    });

    await saveModuleCBlindSpotsAction({
      planId: currentPlan.id,
      thingsToConsider: modCThingsToConsider,
    });
  }

  async function handleExtractMomTestInterviewWithAi(params: {
    intervieweeNameOrRole: string;
    channel: InterviewChannelType;
    otherChannelText?: string;
    rawNotes: string;
  }) {
    if (!aiCreditCheck.allowed) {
      setPaywallModalFeature(
        `AI Mom-Test Interview Extractor (${aiCreditCheck.reason})`
      );
      return null;
    }

    const targetDesc =
      currentPlan.moduleBData?.beachhead?.beachheadSegment ||
      effectiveCanvas.targetCustomer ||
      'Target customers';

    const result = await extractMomTestInterviewWithAiAction({
      userId: session.user.id,
      planId: currentPlan.id,
      planTitle: currentPlan.title,
      industryCategory: currentPlan.industryCategory,
      hqCountryCode: selectedCountry,
      intervieweeName: params.intervieweeNameOrRole,
      intervieweeRoleOrCompany: targetDesc,
      rawNotes: params.rawNotes,
    });

    setSession((prev) => {
      const updatedSession: BmuLocalSession = {
        ...prev,
        entitlement: {
          ...prev.entitlement,
          aiCreditsUsedThisMonth:
            result.creditsUsedAfter ??
            prev.entitlement.aiCreditsUsedThisMonth + 1,
        },
      };
      saveBmuSession(updatedSession);
      return updatedSession;
    });

    return {
      keyTakeaway: result.keyTakeaway,
      verbatimQuote: result.verbatimQuote,
      workaroundAndSpend: result.workaroundAndSpend,
      painScore1To5: result.painScore1To5,
      commitmentOutcome: result.commitmentOutcome,
      signalBadge: result.signalBadge,
      momTestCoachingNote: result.momTestCoachingNote,
    };
  }

  async function handleSaveModuleDStep1ProductVehicle(
    productVehicle: ProductVehicleStep1Data,
    progress: number
  ) {
    setSession((prev) => {
      const updatedPlans = prev.plans.map((p) => {
        if (p.id !== currentPlan.id) return p;
        return {
          ...p,
          currentModuleStep: 'MOD_D_STEP_1',
          moduleDData: {
            ...(p.moduleDData || {}),
            productVehicle,
            lastSavedAt: new Date().toISOString(),
          },
        };
      });
      const updatedSession: BmuLocalSession = {
        ...prev,
        plans: updatedPlans,
      };
      saveBmuSession(updatedSession);
      return updatedSession;
    });

    await saveModuleDStep1ProductVehicleAction({
      planId: currentPlan.id,
      productVehicle,
      completionPercentage: progress,
    });
  }

  async function handleSaveModuleDStep2ChannelMatrix(
    channelMatrix: ChannelMatrixStep2Data
  ) {
    const progress =
      channelMatrix.rentToOwnBridgeStrategy.trim().length > 10 &&
      channelMatrix.channelWhyItFitsNotes.trim().length > 10
        ? 50
        : 35;

    setSession((prev) => {
      const updatedPlans = prev.plans.map((p) => {
        if (p.id !== currentPlan.id) return p;
        return {
          ...p,
          currentModuleStep: 'MOD_D_STEP_2',
          moduleDData: {
            ...(p.moduleDData || {}),
            channelMatrix,
            lastSavedAt: new Date().toISOString(),
          },
        };
      });
      const updatedSession: BmuLocalSession = {
        ...prev,
        plans: updatedPlans,
      };
      saveBmuSession(updatedSession);
      return updatedSession;
    });

    await saveModuleDStep2ChannelMatrixAction({
      planId: currentPlan.id,
      channelMatrix,
      completionPercentage: progress,
    });
  }

  async function handleSaveModuleDStep3ScopeFilter(
    scopeFilter: ScopeFilterStep3Data
  ) {
    const v1Count = scopeFilter.items.filter(
      (i) => i.bucket === 'MUST_HAVE_V1'
    ).length;
    const deferredCount = scopeFilter.items.filter(
      (i) => i.bucket !== 'MUST_HAVE_V1'
    ).length;
    const progress =
      v1Count > 0 &&
      deferredCount > 0 &&
      scopeFilter.whatWeRefuseToBuildInV1Narrative.trim().length > 10 &&
      scopeFilter.whyThisLeanV1WinsFasterNarrative.trim().length > 10
        ? 75
        : 60;

    setSession((prev) => {
      const updatedPlans = prev.plans.map((p) => {
        if (p.id !== currentPlan.id) return p;
        return {
          ...p,
          currentModuleStep: 'MOD_D_STEP_3',
          moduleDData: {
            ...(p.moduleDData || {}),
            scopeFilter,
            lastSavedAt: new Date().toISOString(),
          },
        };
      });
      const updatedSession: BmuLocalSession = {
        ...prev,
        plans: updatedPlans,
      };
      saveBmuSession(updatedSession);
      return updatedSession;
    });

    await saveModuleDStep3ScopeFilterAction({
      planId: currentPlan.id,
      scopeFilter,
      completionPercentage: progress,
    });
  }

  async function handleSaveModuleDStep4BuildVsBuy(
    buildVsBuy: BuildVsBuyStep4Data
  ) {
    const inHouseCount = buildVsBuy.items.filter(
      (i) => i.tier === 'BUILD_IN_HOUSE'
    ).length;
    const progress =
      inHouseCount > 0 &&
      buildVsBuy.secretSauceInHouseNarrative.trim().length > 10 &&
      buildVsBuy.whyBuyAndPartnerSavesTimeNarrative.trim().length > 10
        ? 85
        : 75;

    setSession((prev) => {
      const updatedPlans = prev.plans.map((p) => {
        if (p.id !== currentPlan.id) return p;
        return {
          ...p,
          currentModuleStep: 'MOD_D_STEP_4',
          moduleDData: {
            ...(p.moduleDData || {}),
            buildVsBuy,
            lastSavedAt: new Date().toISOString(),
          },
        };
      });
      const updatedSession: BmuLocalSession = {
        ...prev,
        plans: updatedPlans,
      };
      saveBmuSession(updatedSession);
      return updatedSession;
    });

    await saveModuleDStep4BuildVsBuyAction({
      planId: currentPlan.id,
      buildVsBuy,
      completionPercentage: progress,
    });
  }

  async function handleSaveModuleDStep5WorkPackages(
    workPackagesAndFlow: WorkPackagesStep5Data
  ) {
    const wpCount = workPackagesAndFlow.workPackages.length;
    const progress =
      wpCount > 0 &&
      workPackagesAndFlow.technicalMeritAndInnovationNarrative.trim().length >
        10 &&
      workPackagesAndFlow.bottleneckAndDeRiskingNarrative.trim().length > 10
        ? 95
        : 85;

    setSession((prev) => {
      const updatedPlans = prev.plans.map((p) => {
        if (p.id !== currentPlan.id) return p;
        return {
          ...p,
          currentModuleStep: 'MOD_D_STEP_5',
          moduleDData: {
            ...(p.moduleDData || {}),
            workPackagesAndFlow,
            lastSavedAt: new Date().toISOString(),
          },
        };
      });
      const updatedSession: BmuLocalSession = {
        ...prev,
        plans: updatedPlans,
      };
      saveBmuSession(updatedSession);
      return updatedSession;
    });

    await saveModuleDStep5WorkPackagesAction({
      planId: currentPlan.id,
      workPackagesAndFlow,
      completionPercentage: progress,
    });
  }

  async function handleSaveModuleDStep6BlindSpotAudit(
    blindSpotAudit: BlindSpotAuditStep6Data
  ) {
    const progress =
      blindSpotAudit.readinessConfidence &&
      (blindSpotAudit.executiveProductBriefSummary.trim().length > 10 ||
        blindSpotAudit.blindSpots.length > 0)
        ? 100
        : 95;

    setSession((prev) => {
      const updatedPlans = prev.plans.map((p) => {
        if (p.id !== currentPlan.id) return p;
        return {
          ...p,
          currentModuleStep: 'MOD_D_STEP_6',
          moduleDData: {
            ...(p.moduleDData || {}),
            blindSpotAudit,
            lastSavedAt: new Date().toISOString(),
          },
        };
      });
      const updatedSession: BmuLocalSession = {
        ...prev,
        plans: updatedPlans,
      };
      saveBmuSession(updatedSession);
      return updatedSession;
    });

    await saveModuleDStep6BlindSpotAuditAction({
      planId: currentPlan.id,
      blindSpotAudit,
      completionPercentage: progress,
    });
  }

  async function handleParkModuleDQuestion(questionText: string) {
    const clean = questionText.trim();
    if (!clean) return;
    const nextQuestions = [...openQuestions, `[Module D] ${clean}`];
    setOpenQuestions(nextQuestions);

    setSession((prev) => {
      const updatedPlans = prev.plans.map((p) =>
        p.id === currentPlan.id ? { ...p, openQuestions: nextQuestions } : p
      );
      const updatedSession = { ...prev, plans: updatedPlans };
      saveBmuSession(updatedSession);
      return updatedSession;
    });

    await parkModuleDOpenQuestionAction({
      planId: currentPlan.id,
      questionText: `[Module D] ${clean}`,
    });
  }

  async function handleGenerateModuleDProductVehicleWithAi(params: {
    selectedTrack: ProductTrackType;
    otherProductTrackText?: string;
    validatedPainSummary?: string;
  }) {
    if (!aiCreditCheck.allowed) {
      setPaywallModalFeature(
        `AI Product Vehicle & Aha! Moment Draft (${aiCreditCheck.reason})`
      );
      return {
        allowed: false,
        reason: aiCreditCheck.reason,
        ahaMomentNarrative: '',
        whyThisVehicleFitsCustomer: '',
        engineMode: 'smart-synthesizer' as const,
      };
    }

    const res = await generateModuleDProductVehicleWithAiAction({
      planId: currentPlan.id,
      planTitle: currentPlan.title,
      industryCategory: currentPlan.industryCategory,
      hqCountryCode: selectedCountry,
      brainDumpText,
      coreProblem: effectiveCanvas.coreProblem,
      targetCustomer: effectiveCanvas.targetCustomer,
      proposedSolution: effectiveCanvas.proposedSolution,
      unfairAdvantage: effectiveCanvas.unfairAdvantage,
      beachheadSegment: currentPlan.moduleBData?.beachhead?.beachheadSegment,
      validatedPainSummary: params.validatedPainSummary,
      selectedTrack: params.selectedTrack,
      otherProductTrackText: params.otherProductTrackText,
    });

    setSession((prev) => {
      const updatedSession: BmuLocalSession = {
        ...prev,
        entitlement: {
          ...prev.entitlement,
          aiCreditsUsedThisMonth:
            res.creditsUsedAfter ?? prev.entitlement.aiCreditsUsedThisMonth + 1,
        },
      };
      saveBmuSession(updatedSession);
      return updatedSession;
    });

    return {
      allowed: res.allowed,
      reason: res.reason,
      ahaMomentNarrative: res.ahaMomentNarrative,
      whyThisVehicleFitsCustomer: res.whyThisVehicleFitsCustomer,
      engineMode: res.engineMode,
    };
  }

  async function handleGenerateModuleDChannelMatrixWithAi(params: {
    selectedTrack: ProductTrackType;
    otherProductTrackText?: string;
    formFactor?: ProductFormFactorType;
  }) {
    if (!aiCreditCheck.allowed) {
      setPaywallModalFeature(
        `AI Channel Matrix & Rent-to-Own Bridge Draft (${aiCreditCheck.reason})`
      );
      return {
        allowed: false,
        reason: aiCreditCheck.reason,
        primaryChannel: 'DIRECT_WEB_STRIPE' as const,
        secondaryChannels: [],
        primaryChannelSharePercent: 100,
        estimatedBlendedFeePercent: 3.5,
        deliveryFulfillmentModel: 'INSTANT_SELF_SERVE_ONBOARDING' as const,
        rentToOwnBridgeStrategy: '',
        channelWhyItFitsNotes: '',
        engineMode: 'smart-synthesizer' as const,
      };
    }

    const res = await generateModuleDChannelMatrixWithAiAction({
      planId: currentPlan.id,
      planTitle: currentPlan.title,
      industryCategory: currentPlan.industryCategory,
      hqCountryCode: selectedCountry,
      brainDumpText,
      coreProblem: effectiveCanvas.coreProblem,
      targetCustomer: effectiveCanvas.targetCustomer,
      proposedSolution: effectiveCanvas.proposedSolution,
      beachheadSegment: currentPlan.moduleBData?.beachhead?.beachheadSegment,
      selectedTrack: params.selectedTrack,
      otherProductTrackText: params.otherProductTrackText,
      formFactor: params.formFactor,
    });

    setSession((prev) => {
      const updatedSession: BmuLocalSession = {
        ...prev,
        entitlement: {
          ...prev.entitlement,
          aiCreditsUsedThisMonth:
            res.creditsUsedAfter ?? prev.entitlement.aiCreditsUsedThisMonth + 1,
        },
      };
      saveBmuSession(updatedSession);
      return updatedSession;
    });

    return {
      allowed: res.allowed,
      reason: res.reason,
      primaryChannel: res.primaryChannel,
      secondaryChannels: res.secondaryChannels,
      primaryChannelSharePercent: res.primaryChannelSharePercent,
      estimatedBlendedFeePercent: res.estimatedBlendedFeePercent,
      deliveryFulfillmentModel: res.deliveryFulfillmentModel,
      rentToOwnBridgeStrategy: res.rentToOwnBridgeStrategy,
      channelWhyItFitsNotes: res.channelWhyItFitsNotes,
      engineMode: res.engineMode,
    };
  }

  async function handleGenerateModuleDScopeFilterWithAi(params: {
    selectedTrack: ProductTrackType;
    otherProductTrackText?: string;
    formFactor?: ProductFormFactorType;
    primaryChannel?: SalesChannelOptionType;
    validatedPainSummary?: string;
    currentScopeItems?: ScopeFilterItem[];
  }) {
    if (!aiCreditCheck.allowed) {
      setPaywallModalFeature(
        `AI Anti-Scope-Creep Charter & Grant Justification Draft (${aiCreditCheck.reason})`
      );
      return {
        allowed: false,
        reason: aiCreditCheck.reason,
        scopeDisciplineRule: '' as const,
        items: params.currentScopeItems || [],
        whatWeRefuseToBuildInV1Narrative: '',
        whyThisLeanV1WinsFasterNarrative: '',
        engineMode: 'smart-synthesizer' as const,
      };
    }

    const res = await generateModuleDScopeFilterWithAiAction({
      planId: currentPlan.id,
      planTitle: currentPlan.title,
      industryCategory: currentPlan.industryCategory,
      hqCountryCode: selectedCountry,
      brainDumpText,
      coreProblem: effectiveCanvas.coreProblem,
      targetCustomer: effectiveCanvas.targetCustomer,
      proposedSolution: effectiveCanvas.proposedSolution,
      beachheadSegment: currentPlan.moduleBData?.beachhead?.beachheadSegment,
      selectedTrack: params.selectedTrack,
      otherProductTrackText: params.otherProductTrackText,
      formFactor: params.formFactor,
      primaryChannel: params.primaryChannel,
      validatedPainSummary: params.validatedPainSummary,
      currentScopeItems: params.currentScopeItems,
    });

    setSession((prev) => {
      const updatedSession: BmuLocalSession = {
        ...prev,
        entitlement: {
          ...prev.entitlement,
          aiCreditsUsedThisMonth:
            res.creditsUsedAfter ?? prev.entitlement.aiCreditsUsedThisMonth + 1,
        },
      };
      saveBmuSession(updatedSession);
      return updatedSession;
    });

    return {
      allowed: res.allowed,
      reason: res.reason,
      scopeDisciplineRule: res.scopeDisciplineRule,
      items: res.items,
      whatWeRefuseToBuildInV1Narrative: res.whatWeRefuseToBuildInV1Narrative,
      whyThisLeanV1WinsFasterNarrative: res.whyThisLeanV1WinsFasterNarrative,
      engineMode: res.engineMode,
    };
  }

  async function handleGenerateModuleDBuildVsBuyWithAi(params: {
    selectedTrack: ProductTrackType;
    otherProductTrackText?: string;
    formFactor?: ProductFormFactorType;
    primaryChannel?: SalesChannelOptionType;
    validatedPainSummary?: string;
    v1MustHaveTitles?: string[];
    currentBoardItems?: BuildVsBuyItem[];
    mode?: 'POPULATE_BOARD_AND_CHARTER' | 'CHARTER_ONLY';
  }) {
    if (!aiCreditCheck.allowed) {
      setPaywallModalFeature(
        `AI Build-vs-Buy & Secret Sauce Matrix (${aiCreditCheck.reason})`
      );
      return {
        allowed: false,
        reason: aiCreditCheck.reason,
        coreIpOwnershipRule: '' as const,
        items: params.currentBoardItems || [],
        secretSauceInHouseNarrative: '',
        whyBuyAndPartnerSavesTimeNarrative: '',
        engineMode: 'smart-synthesizer' as const,
      };
    }

    const res = await generateModuleDBuildVsBuyWithAiAction({
      planId: currentPlan.id,
      planTitle: currentPlan.title,
      industryCategory: currentPlan.industryCategory,
      hqCountryCode: selectedCountry,
      brainDumpText,
      coreProblem: effectiveCanvas.coreProblem,
      targetCustomer: effectiveCanvas.targetCustomer,
      proposedSolution: effectiveCanvas.proposedSolution,
      beachheadSegment: currentPlan.moduleBData?.beachhead?.beachheadSegment,
      selectedTrack: params.selectedTrack,
      otherProductTrackText: params.otherProductTrackText,
      formFactor: params.formFactor,
      primaryChannel: params.primaryChannel,
      validatedPainSummary: params.validatedPainSummary,
      v1MustHaveTitles: params.v1MustHaveTitles,
      currentBoardItems: params.currentBoardItems,
      mode: params.mode,
    });

    setSession((prev) => {
      const updatedSession: BmuLocalSession = {
        ...prev,
        entitlement: {
          ...prev.entitlement,
          aiCreditsUsedThisMonth:
            res.creditsUsedAfter ?? prev.entitlement.aiCreditsUsedThisMonth + 1,
        },
      };
      saveBmuSession(updatedSession);
      return updatedSession;
    });

    return {
      allowed: res.allowed,
      reason: res.reason,
      coreIpOwnershipRule: res.coreIpOwnershipRule,
      items: res.items,
      secretSauceInHouseNarrative: res.secretSauceInHouseNarrative,
      whyBuyAndPartnerSavesTimeNarrative: res.whyBuyAndPartnerSavesTimeNarrative,
      engineMode: res.engineMode,
    };
  }

  async function handleGenerateModuleDWorkPackagesWithAi(params: {
    selectedTrack: ProductTrackType;
    otherProductTrackText?: string;
    formFactor?: ProductFormFactorType;
    primaryChannel?: SalesChannelOptionType;
    validatedPainSummary?: string;
    v1MustHaveTitles?: string[];
    buildVsBuyItems?: BuildVsBuyItem[];
    currentWorkPackages?: ProductWorkPackageItem[];
    currentFlowStages?: ProductFlowStageItem[];
    mode?: 'POPULATE_WPS_AND_FLOW' | 'CHARTER_ONLY';
  }) {
    if (!aiCreditCheck.allowed) {
      setPaywallModalFeature(
        `AI Work Packages & Technical Flow Diagram (${aiCreditCheck.reason})`
      );
      return {
        allowed: false,
        reason: aiCreditCheck.reason,
        executionCadenceRule: '' as const,
        workPackages: params.currentWorkPackages || [],
        flowStages: params.currentFlowStages || [],
        technicalMeritAndInnovationNarrative: '',
        bottleneckAndDeRiskingNarrative: '',
        engineMode: 'smart-synthesizer' as const,
      };
    }

    const res = await generateModuleDWorkPackagesWithAiAction({
      planId: currentPlan.id,
      planTitle: currentPlan.title,
      industryCategory: currentPlan.industryCategory,
      hqCountryCode: selectedCountry,
      brainDumpText,
      coreProblem: effectiveCanvas.coreProblem,
      targetCustomer: effectiveCanvas.targetCustomer,
      proposedSolution: effectiveCanvas.proposedSolution,
      beachheadSegment: currentPlan.moduleBData?.beachhead?.beachheadSegment,
      selectedTrack: params.selectedTrack,
      otherProductTrackText: params.otherProductTrackText,
      formFactor: params.formFactor,
      primaryChannel: params.primaryChannel,
      validatedPainSummary: params.validatedPainSummary,
      v1MustHaveTitles: params.v1MustHaveTitles,
      buildVsBuyItems: params.buildVsBuyItems,
      currentWorkPackages: params.currentWorkPackages,
      currentFlowStages: params.currentFlowStages,
      mode: params.mode,
    });

    setSession((prev) => {
      const updatedSession: BmuLocalSession = {
        ...prev,
        entitlement: {
          ...prev.entitlement,
          aiCreditsUsedThisMonth:
            res.creditsUsedAfter ?? prev.entitlement.aiCreditsUsedThisMonth + 1,
        },
      };
      saveBmuSession(updatedSession);
      return updatedSession;
    });

    return {
      allowed: res.allowed,
      reason: res.reason,
      executionCadenceRule: res.executionCadenceRule,
      workPackages: res.workPackages,
      flowStages: res.flowStages,
      technicalMeritAndInnovationNarrative:
        res.technicalMeritAndInnovationNarrative,
      bottleneckAndDeRiskingNarrative: res.bottleneckAndDeRiskingNarrative,
      engineMode: res.engineMode,
    };
  }

  async function handleGenerateModuleDBlindSpotAuditWithAi(params: {
    selectedTrack: ProductTrackType;
    otherProductTrackText?: string;
    formFactor?: ProductFormFactorType;
    v1LaunchTimeline?: V1LaunchTimelineType;
    primaryChannel?: SalesChannelOptionType;
    estimatedBlendedFeePercent?: number;
    v1MustHaveCount?: number;
    v1HighEffortCount?: number;
    monthlyBurnTotal?: number;
    onceOffCapExTotal?: number;
    perUnitCogsTotal?: number;
    workPackageCount?: number;
    grantEligibleWpCount?: number;
    currentBlindSpots?: ProductBlindSpotItem[];
    mode?: 'FULL_AUDIT' | 'SUMMARY_ONLY';
  }) {
    if (!aiCreditCheck.allowed) {
      setPaywallModalFeature(
        `AI Blind-Spot Audit & Executive Brief (${aiCreditCheck.reason})`
      );
      return {
        allowed: false,
        reason: aiCreditCheck.reason,
        blindSpots: params.currentBlindSpots || [],
        readinessConfidence: 'READY_TO_BUILD_V1' as const,
        executiveProductBriefSummary: '',
        keyDeRiskingSignOffNarrative: '',
        engineMode: 'smart-synthesizer' as const,
      };
    }

    const res = await generateModuleDBlindSpotAuditWithAiAction({
      planId: currentPlan.id,
      planTitle: currentPlan.title,
      industryCategory: currentPlan.industryCategory,
      hqCountryCode: selectedCountry,
      selectedTrack: params.selectedTrack,
      otherProductTrackText: params.otherProductTrackText,
      formFactor: params.formFactor,
      v1LaunchTimeline: params.v1LaunchTimeline,
      primaryChannel: params.primaryChannel,
      estimatedBlendedFeePercent: params.estimatedBlendedFeePercent,
      v1MustHaveCount: params.v1MustHaveCount,
      v1HighEffortCount: params.v1HighEffortCount,
      monthlyBurnTotal: params.monthlyBurnTotal,
      onceOffCapExTotal: params.onceOffCapExTotal,
      perUnitCogsTotal: params.perUnitCogsTotal,
      workPackageCount: params.workPackageCount,
      grantEligibleWpCount: params.grantEligibleWpCount,
      currentBlindSpots: params.currentBlindSpots,
      mode: params.mode,
    });

    setSession((prev) => {
      const updatedSession: BmuLocalSession = {
        ...prev,
        entitlement: {
          ...prev.entitlement,
          aiCreditsUsedThisMonth:
            res.creditsUsedAfter ?? prev.entitlement.aiCreditsUsedThisMonth + 1,
        },
      };
      saveBmuSession(updatedSession);
      return updatedSession;
    });

    return {
      allowed: res.allowed,
      reason: res.reason,
      blindSpots: res.blindSpots,
      readinessConfidence: res.readinessConfidence,
      executiveProductBriefSummary: res.executiveProductBriefSummary,
      keyDeRiskingSignOffNarrative: res.keyDeRiskingSignOffNarrative,
      engineMode: res.engineMode,
    };
  }

  async function handleSaveModuleEStep1OperationsBlueprint(
    operationsBlueprint: OperationsBlueprintStep1Data,
    progress = 25
  ) {
    setSession((prev) => {
      const updatedPlans = prev.plans.map((p) => {
        if (p.id !== currentPlan.id) return p;
        return {
          ...p,
          currentModuleStep: 'MOD_E_STEP_1',
          moduleEData: {
            ...(p.moduleEData || {}),
            operationsBlueprint,
            lastSavedAt: new Date().toISOString(),
          },
        };
      });
      const updatedSession: BmuLocalSession = {
        ...prev,
        plans: updatedPlans,
      };
      saveBmuSession(updatedSession);
      return updatedSession;
    });

    await saveModuleEStep1OperationsBlueprintAction({
      planId: currentPlan.id,
      operationsBlueprint,
      completionPercentage: progress,
    });
  }

  async function handleParkModuleEQuestion(questionText: string) {
    const clean = questionText.trim();
    if (!clean) return;
    const nextQuestions = [...openQuestions, `[Module E] ${clean}`];
    setOpenQuestions(nextQuestions);

    setSession((prev) => {
      const updatedPlans = prev.plans.map((p) =>
        p.id === currentPlan.id ? { ...p, openQuestions: nextQuestions } : p
      );
      const updatedSession = { ...prev, plans: updatedPlans };
      saveBmuSession(updatedSession);
      return updatedSession;
    });

    await parkModuleEOpenQuestionAction({
      planId: currentPlan.id,
      questionText: `[Module E] ${clean}`,
    });
  }

  async function handleGenerateModuleEOperationsBlueprintWithAi(params: {
    selectedTrack: ProductTrackType;
    otherProductTrackText?: string;
    primaryChannel?: SalesChannelOptionType;
    deliveryFulfillmentModel?: DeliveryFulfillmentModelType;
    weeklyOpsHoursAllocated?: number;
    currentFulfillmentMode?: OperationsFulfillmentModeType | '';
    currentTurnaroundSla?: OrderTurnaroundSlaType | '';
    currentCapacityConstraint?: OperationalCapacityConstraintType | '';
    currentStages?: OrderLifecycleStageItem[];
    mode?: 'POPULATE_STAGES_AND_NARRATIVES' | 'NARRATIVES_ONLY';
  }) {
    if (!aiCreditCheck.allowed) {
      setPaywallModalFeature(
        `AI Day in the Life of an Order Blueprint (${aiCreditCheck.reason})`
      );
      return {
        allowed: false,
        reason: aiCreditCheck.reason,
        fulfillmentMode:
          (params.currentFulfillmentMode as OperationsFulfillmentModeType) ||
          'HYBRID_AUTOMATED_PLUS_HUMAN',
        turnaroundSla:
          (params.currentTurnaroundSla as OrderTurnaroundSlaType) ||
          'INSTANT_UNDER_5_MINS',
        capacityConstraint:
          (params.currentCapacityConstraint as OperationalCapacityConstraintType) ||
          'FOUNDER_MANUAL_HOURS',
        orderLifecycleStages: params.currentStages || [],
        endToEndFulfillmentNarrative: '',
        scalingAndBottleneckDeRiskingNarrative: '',
        engineMode: 'smart-synthesizer' as const,
      };
    }

    const res = await generateModuleEOperationsBlueprintWithAiAction({
      planId: currentPlan.id,
      planTitle: currentPlan.title,
      industryCategory: currentPlan.industryCategory,
      hqCountryCode: selectedCountry,
      baseCurrency: currentPlan.baseCurrency,
      brainDumpText,
      coreProblem: effectiveCanvas.coreProblem,
      targetCustomer: effectiveCanvas.targetCustomer,
      proposedSolution: effectiveCanvas.proposedSolution,
      selectedTrack: params.selectedTrack,
      otherProductTrackText: params.otherProductTrackText,
      primaryChannel: params.primaryChannel,
      deliveryFulfillmentModel: params.deliveryFulfillmentModel,
      weeklyOpsHoursAllocated: params.weeklyOpsHoursAllocated,
      currentFulfillmentMode: params.currentFulfillmentMode,
      currentTurnaroundSla: params.currentTurnaroundSla,
      currentCapacityConstraint: params.currentCapacityConstraint,
      currentStages: params.currentStages,
      mode: params.mode,
    });

    setSession((prev) => {
      const updatedSession: BmuLocalSession = {
        ...prev,
        entitlement: {
          ...prev.entitlement,
          aiCreditsUsedThisMonth:
            res.creditsUsedAfter ?? prev.entitlement.aiCreditsUsedThisMonth + 1,
        },
      };
      saveBmuSession(updatedSession);
      return updatedSession;
    });

    return {
      allowed: res.allowed,
      reason: res.reason,
      fulfillmentMode: res.fulfillmentMode,
      turnaroundSla: res.turnaroundSla,
      capacityConstraint: res.capacityConstraint,
      orderLifecycleStages: res.orderLifecycleStages,
      endToEndFulfillmentNarrative: res.endToEndFulfillmentNarrative,
      scalingAndBottleneckDeRiskingNarrative:
        res.scalingAndBottleneckDeRiskingNarrative,
      engineMode: res.engineMode,
    };
  }

  async function handleSaveModuleEStep2PremisesEquipment(
    premisesAndEquipment: PremisesAndEquipmentStep2Data,
    progress = 45
  ) {
    setSession((prev) => {
      const updatedPlans = prev.plans.map((p) => {
        if (p.id !== currentPlan.id) return p;
        return {
          ...p,
          currentModuleStep: 'MOD_E_STEP_2',
          moduleEData: {
            ...(p.moduleEData || {}),
            premisesAndEquipment,
            lastSavedAt: new Date().toISOString(),
          },
        };
      });
      const updatedSession: BmuLocalSession = {
        ...prev,
        plans: updatedPlans,
      };
      saveBmuSession(updatedSession);
      return updatedSession;
    });

    await saveModuleEStep2PremisesEquipmentAction({
      planId: currentPlan.id,
      premisesAndEquipment,
      completionPercentage: progress,
    });
  }

  async function handleGenerateModuleEPremisesEquipmentWithAi(params: {
    selectedTrack: ProductTrackType;
    otherProductTrackText?: string;
    currentPremisesSetupMode?: PremisesSetupModeType | '';
    currentPremisesLocationSummary?: string;
    currentMonthlyPremisesCost?: number;
    currentPremisesComplianceStatus?: PremisesComplianceStatusType | '';
    currentEquipmentItems?: EquipmentAssetItem[];
    mode?: 'POPULATE_ASSETS_AND_NARRATIVES' | 'NARRATIVES_ONLY';
  }) {
    if (!aiCreditCheck.allowed) {
      setPaywallModalFeature(
        `AI Premises & Equipment Schedule (${aiCreditCheck.reason})`
      );
      return {
        allowed: false,
        reason: aiCreditCheck.reason,
        premisesSetupMode:
          (params.currentPremisesSetupMode as PremisesSetupModeType) ||
          'REMOTE_CLOUD_HOME_OFFICE',
        premisesLocationSummary: params.currentPremisesLocationSummary || '',
        monthlyPremisesAndUtilitiesCost:
          params.currentMonthlyPremisesCost ?? 95,
        premisesComplianceStatus:
          (params.currentPremisesComplianceStatus as PremisesComplianceStatusType) ||
          'NO_PERMIT_REQUIRED_REMOTE',
        equipmentItems: params.currentEquipmentItems || [],
        premisesAndLocationJustificationNarrative: '',
        equipmentRoiAndGrantComplianceNarrative: '',
        engineMode: 'smart-synthesizer' as const,
      };
    }

    const res = await generateModuleEPremisesEquipmentWithAiAction({
      planId: currentPlan.id,
      planTitle: currentPlan.title,
      industryCategory: currentPlan.industryCategory,
      hqCountryCode: selectedCountry,
      baseCurrency: currentPlan.baseCurrency,
      brainDumpText,
      coreProblem: effectiveCanvas.coreProblem,
      targetCustomer: effectiveCanvas.targetCustomer,
      proposedSolution: effectiveCanvas.proposedSolution,
      selectedTrack: params.selectedTrack,
      otherProductTrackText: params.otherProductTrackText,
      currentPremisesSetupMode: params.currentPremisesSetupMode,
      currentPremisesLocationSummary: params.currentPremisesLocationSummary,
      currentMonthlyPremisesCost: params.currentMonthlyPremisesCost,
      currentPremisesComplianceStatus: params.currentPremisesComplianceStatus,
      currentEquipmentItems: params.currentEquipmentItems,
      mode: params.mode,
    });

    setSession((prev) => {
      const updatedSession: BmuLocalSession = {
        ...prev,
        entitlement: {
          ...prev.entitlement,
          aiCreditsUsedThisMonth:
            res.creditsUsedAfter ?? prev.entitlement.aiCreditsUsedThisMonth + 1,
        },
      };
      saveBmuSession(updatedSession);
      return updatedSession;
    });

    return {
      allowed: res.allowed,
      reason: res.reason,
      premisesSetupMode: res.premisesSetupMode,
      premisesLocationSummary: res.premisesLocationSummary,
      monthlyPremisesAndUtilitiesCost: res.monthlyPremisesAndUtilitiesCost,
      premisesComplianceStatus: res.premisesComplianceStatus,
      equipmentItems: res.equipmentItems,
      premisesAndLocationJustificationNarrative:
        res.premisesAndLocationJustificationNarrative,
      equipmentRoiAndGrantComplianceNarrative:
        res.equipmentRoiAndGrantComplianceNarrative,
      engineMode: res.engineMode,
    };
  }

  async function handleSaveModuleEStep3RiskRegister(
    riskRegister: RiskRegisterStep3Data,
    progress = 70
  ) {
    setSession((prev) => {
      const updatedPlans = prev.plans.map((p) => {
        if (p.id !== currentPlan.id) return p;
        return {
          ...p,
          currentModuleStep: 'MOD_E_STEP_3',
          moduleEData: {
            ...(p.moduleEData || {}),
            riskRegister,
            lastSavedAt: new Date().toISOString(),
          },
        };
      });
      const updatedSession: BmuLocalSession = {
        ...prev,
        plans: updatedPlans,
      };
      saveBmuSession(updatedSession);
      return updatedSession;
    });

    await saveModuleEStep3RiskRegisterAction({
      planId: currentPlan.id,
      riskRegister,
      completionPercentage: progress,
    });
  }

  async function handleGenerateModuleERiskRegisterWithAi(params: {
    selectedTrack: ProductTrackType;
    otherProductTrackText?: string;
    currentSupplierRedundancyPosture?: SupplierRedundancyPostureType | '';
    currentLeadTimeBufferDays?: number;
    currentPrimarySuppliersSummary?: string;
    currentBackupSuppliersSummary?: string;
    currentRiskItems?: ProjectRiskRegisterItem[];
    mode?: 'POPULATE_RISKS_AND_NARRATIVES' | 'NARRATIVES_ONLY';
  }) {
    if (!aiCreditCheck.allowed) {
      setPaywallModalFeature(
        `AI Risk Register & Supply-Chain Resilience (${aiCreditCheck.reason})`
      );
      return {
        allowed: false,
        reason: aiCreditCheck.reason,
        supplierRedundancyPosture:
          (params.currentSupplierRedundancyPosture as SupplierRedundancyPostureType) ||
          'DUAL_SOURCED_VERIFIED',
        leadTimeBufferDays: params.currentLeadTimeBufferDays ?? 7,
        primarySuppliersSummary: params.currentPrimarySuppliersSummary || '',
        backupSuppliersSummary: params.currentBackupSuppliersSummary || '',
        riskItems: params.currentRiskItems || [],
        supplyChainResilienceNarrative: '',
        riskManagementGovernanceNarrative: '',
        engineMode: 'smart-synthesizer' as const,
      };
    }

    const res = await generateModuleERiskRegisterWithAiAction({
      planId: currentPlan.id,
      planTitle: currentPlan.title,
      industryCategory: currentPlan.industryCategory,
      hqCountryCode: selectedCountry,
      baseCurrency: currentPlan.baseCurrency,
      brainDumpText,
      coreProblem: effectiveCanvas.coreProblem,
      targetCustomer: effectiveCanvas.targetCustomer,
      proposedSolution: effectiveCanvas.proposedSolution,
      selectedTrack: params.selectedTrack,
      otherProductTrackText: params.otherProductTrackText,
      currentSupplierRedundancyPosture: params.currentSupplierRedundancyPosture,
      currentLeadTimeBufferDays: params.currentLeadTimeBufferDays,
      currentPrimarySuppliersSummary: params.currentPrimarySuppliersSummary,
      currentBackupSuppliersSummary: params.currentBackupSuppliersSummary,
      currentRiskItems: params.currentRiskItems,
      mode: params.mode,
    });

    setSession((prev) => {
      const updatedSession: BmuLocalSession = {
        ...prev,
        entitlement: {
          ...prev.entitlement,
          aiCreditsUsedThisMonth:
            res.creditsUsedAfter ?? prev.entitlement.aiCreditsUsedThisMonth + 1,
        },
      };
      saveBmuSession(updatedSession);
      return updatedSession;
    });

    return {
      allowed: res.allowed,
      reason: res.reason,
      supplierRedundancyPosture: res.supplierRedundancyPosture,
      leadTimeBufferDays: res.leadTimeBufferDays,
      primarySuppliersSummary: res.primarySuppliersSummary,
      backupSuppliersSummary: res.backupSuppliersSummary,
      riskItems: res.riskItems,
      supplyChainResilienceNarrative: res.supplyChainResilienceNarrative,
      riskManagementGovernanceNarrative: res.riskManagementGovernanceNarrative,
      engineMode: res.engineMode,
    };
  }

  async function handleSaveModuleEStep4SupportReturnsAndQc(
    supportReturnsAndQc: SupportReturnsAndQcStep4Data,
    progress = 80
  ) {
    setSession((prev) => {
      const updatedPlans = prev.plans.map((p) => {
        if (p.id !== currentPlan.id) return p;
        return {
          ...p,
          currentModuleStep: 'MOD_E_STEP_4',
          moduleEData: {
            ...(p.moduleEData || {}),
            supportReturnsAndQc,
            lastSavedAt: new Date().toISOString(),
          },
        };
      });
      const updatedSession: BmuLocalSession = {
        ...prev,
        plans: updatedPlans,
      };
      saveBmuSession(updatedSession);
      return updatedSession;
    });

    await saveModuleEStep4SupportReturnsAndQcAction({
      planId: currentPlan.id,
      supportReturnsAndQc,
      completionPercentage: progress,
    });
  }

  async function handleGenerateModuleESupportReturnsAndQcWithAi(params: {
    selectedTrack: ProductTrackType;
    otherProductTrackText?: string;
    currentSupportOperatingModel?: SupportOperatingModelType | '';
    currentSupportResponseSla?: SupportResponseSlaType | '';
    currentReturnsAndWarrantyPolicy?: ReturnsAndWarrantyPolicyType | '';
    currentEstimatedReturnRatePercent?: number;
    currentCostPerReturnIncident?: number;
    currentWarrantyDurationMonths?: number;
    currentQcCheckpoints?: QcCheckpointItem[];
    mode?: 'POPULATE_QC_AND_NARRATIVES' | 'NARRATIVES_ONLY';
  }) {
    if (!aiCreditCheck.allowed) {
      setPaywallModalFeature(
        `AI Customer Support, Returns & QC SOP (${aiCreditCheck.reason})`
      );
      return {
        allowed: false,
        reason: aiCreditCheck.reason,
        supportOperatingModel:
          (params.currentSupportOperatingModel as SupportOperatingModelType) ||
          'SELF_SERVE_DOCS_PLUS_FOUNDER_TIER2',
        supportResponseSla:
          (params.currentSupportResponseSla as SupportResponseSlaType) ||
          'SAME_BUSINESS_DAY_UNDER_4H',
        returnsAndWarrantyPolicy:
          (params.currentReturnsAndWarrantyPolicy as ReturnsAndWarrantyPolicyType) ||
          'STATUTORY_14_DAY_COOLING_OFF',
        estimatedReturnOrRefundRatePercent:
          params.currentEstimatedReturnRatePercent ?? 2.0,
        costPerReturnOrRemakeIncident:
          params.currentCostPerReturnIncident ?? 20,
        warrantyDurationMonths: params.currentWarrantyDurationMonths ?? 12,
        qcCheckpoints: params.currentQcCheckpoints || [],
        qualityControlAndStandardsNarrative: '',
        customerSupportAndReturnsNarrative: '',
        engineMode: 'smart-synthesizer' as const,
      };
    }

    const res = await generateModuleESupportReturnsAndQcWithAiAction({
      planId: currentPlan.id,
      planTitle: currentPlan.title,
      industryCategory: currentPlan.industryCategory,
      hqCountryCode: selectedCountry,
      baseCurrency: currentPlan.baseCurrency,
      brainDumpText,
      coreProblem: effectiveCanvas.coreProblem,
      targetCustomer: effectiveCanvas.targetCustomer,
      proposedSolution: effectiveCanvas.proposedSolution,
      selectedTrack: params.selectedTrack,
      otherProductTrackText: params.otherProductTrackText,
      currentSupportOperatingModel: params.currentSupportOperatingModel,
      currentSupportResponseSla: params.currentSupportResponseSla,
      currentReturnsAndWarrantyPolicy: params.currentReturnsAndWarrantyPolicy,
      currentEstimatedReturnRatePercent:
        params.currentEstimatedReturnRatePercent,
      currentCostPerReturnIncident: params.currentCostPerReturnIncident,
      currentWarrantyDurationMonths: params.currentWarrantyDurationMonths,
      currentQcCheckpoints: params.currentQcCheckpoints,
      mode: params.mode,
    });

    setSession((prev) => {
      const updatedSession: BmuLocalSession = {
        ...prev,
        entitlement: {
          ...prev.entitlement,
          aiCreditsUsedThisMonth:
            res.creditsUsedAfter ?? prev.entitlement.aiCreditsUsedThisMonth + 1,
        },
      };
      saveBmuSession(updatedSession);
      return updatedSession;
    });

    return {
      allowed: res.allowed,
      reason: res.reason,
      supportOperatingModel: res.supportOperatingModel,
      supportResponseSla: res.supportResponseSla,
      returnsAndWarrantyPolicy: res.returnsAndWarrantyPolicy,
      estimatedReturnOrRefundRatePercent:
        res.estimatedReturnOrRefundRatePercent,
      costPerReturnOrRemakeIncident: res.costPerReturnOrRemakeIncident,
      warrantyDurationMonths: res.warrantyDurationMonths,
      qcCheckpoints: res.qcCheckpoints,
      qualityControlAndStandardsNarrative:
        res.qualityControlAndStandardsNarrative,
      customerSupportAndReturnsNarrative:
        res.customerSupportAndReturnsNarrative,
      engineMode: res.engineMode,
    };
  }

  async function handleSaveModuleEStep5PermitsAndInsurance(
    permitsAndInsurance: PermitsComplianceAndInsuranceStep5Data,
    progress = 90
  ) {
    setSession((prev) => {
      const updatedPlans = prev.plans.map((p) => {
        if (p.id !== currentPlan.id) return p;
        return {
          ...p,
          currentModuleStep: 'MOD_E_STEP_5',
          moduleEData: {
            ...(p.moduleEData || {}),
            permitsAndInsurance,
            lastSavedAt: new Date().toISOString(),
          },
        };
      });
      const updatedSession: BmuLocalSession = {
        ...prev,
        plans: updatedPlans,
      };
      saveBmuSession(updatedSession);
      return updatedSession;
    });

    await saveModuleEStep5PermitsAndInsuranceAction({
      planId: currentPlan.id,
      permitsAndInsurance,
      completionPercentage: progress,
    });
  }

  async function handleGenerateModuleEPermitsAndInsuranceWithAi(params: {
    selectedTrack: ProductTrackType;
    otherProductTrackText?: string;
    currentRegulatorySectorPosture?: RegulatorySectorPostureType | '';
    currentDataPrivacyPosture?: DataPrivacyPostureType | '';
    currentInsuranceCoverageBundle?: InsuranceCoverageBundleType | '';
    currentEstimatedAnnualInsurancePremium?: number;
    currentSelectedInsuranceProviderName?: string;
    currentComplianceItems?: ComplianceChecklistItem[];
    mode?: 'POPULATE_COMPLIANCE_AND_NARRATIVES' | 'NARRATIVES_ONLY';
  }) {
    if (!aiCreditCheck.allowed) {
      setPaywallModalFeature(
        `AI Regulatory, GDPR & Startup Insurance Matcher (${aiCreditCheck.reason})`
      );
      return {
        allowed: false,
        reason: aiCreditCheck.reason,
        regulatorySectorPosture:
          (params.currentRegulatorySectorPosture as RegulatorySectorPostureType) ||
          'STANDARD_COMMERCIAL_UNREGULATED',
        otherRegulatorySectorPostureText: '',
        dataPrivacyPosture:
          (params.currentDataPrivacyPosture as DataPrivacyPostureType) ||
          'B2B_DATA_PROCESSOR_DPA_SCC',
        otherDataPrivacyPostureText: '',
        insuranceCoverageBundle:
          (params.currentInsuranceCoverageBundle as InsuranceCoverageBundleType) ||
          'TECH_SAAS_PI_CYBER',
        otherInsuranceCoverageBundleText: '',
        estimatedAnnualInsurancePremium:
          params.currentEstimatedAnnualInsurancePremium ?? 850,
        selectedInsuranceProviderName:
          params.currentSelectedInsuranceProviderName || '',
        complianceItems: params.currentComplianceItems || [],
        regulatoryAndComplianceNarrative: '',
        insuranceAndLiabilityGovernanceNarrative: '',
        engineMode: 'smart-synthesizer' as const,
      };
    }

    const res = await generateModuleEPermitsAndInsuranceWithAiAction({
      planId: currentPlan.id,
      planTitle: currentPlan.title,
      industryCategory: currentPlan.industryCategory,
      hqCountryCode: selectedCountry,
      baseCurrency: currentPlan.baseCurrency,
      brainDumpText,
      coreProblem: effectiveCanvas.coreProblem,
      targetCustomer: effectiveCanvas.targetCustomer,
      proposedSolution: effectiveCanvas.proposedSolution,
      selectedTrack: params.selectedTrack,
      otherProductTrackText: params.otherProductTrackText,
      currentRegulatorySectorPosture: params.currentRegulatorySectorPosture,
      currentDataPrivacyPosture: params.currentDataPrivacyPosture,
      currentInsuranceCoverageBundle: params.currentInsuranceCoverageBundle,
      currentEstimatedAnnualInsurancePremium:
        params.currentEstimatedAnnualInsurancePremium,
      currentSelectedInsuranceProviderName:
        params.currentSelectedInsuranceProviderName,
      currentComplianceItems: params.currentComplianceItems,
      mode: params.mode,
    });

    setSession((prev) => {
      const updatedSession: BmuLocalSession = {
        ...prev,
        entitlement: {
          ...prev.entitlement,
          aiCreditsUsedThisMonth:
            res.creditsUsedAfter ?? prev.entitlement.aiCreditsUsedThisMonth + 1,
        },
      };
      saveBmuSession(updatedSession);
      return updatedSession;
    });

    return {
      allowed: res.allowed,
      reason: res.reason,
      regulatorySectorPosture: res.regulatorySectorPosture,
      otherRegulatorySectorPostureText: res.otherRegulatorySectorPostureText,
      dataPrivacyPosture: res.dataPrivacyPosture,
      otherDataPrivacyPostureText: res.otherDataPrivacyPostureText,
      insuranceCoverageBundle: res.insuranceCoverageBundle,
      otherInsuranceCoverageBundleText: res.otherInsuranceCoverageBundleText,
      estimatedAnnualInsurancePremium: res.estimatedAnnualInsurancePremium,
      selectedInsuranceProviderName: res.selectedInsuranceProviderName,
      complianceItems: res.complianceItems,
      regulatoryAndComplianceNarrative: res.regulatoryAndComplianceNarrative,
      insuranceAndLiabilityGovernanceNarrative:
        res.insuranceAndLiabilityGovernanceNarrative,
      engineMode: res.engineMode,
    };
  }

  async function handleSaveModuleEStep6BlindSpotAudit(
    blindSpotAudit: OperationsBlindSpotAuditStep6Data,
    progress = 100
  ) {
    setSession((prev) => {
      const updatedPlans = prev.plans.map((p) => {
        if (p.id !== currentPlan.id) return p;
        return {
          ...p,
          currentModuleStep: 'MOD_E_STEP_6',
          moduleEData: {
            ...(p.moduleEData || {}),
            blindSpotAudit,
            lastSavedAt: new Date().toISOString(),
          },
        };
      });
      const updatedSession: BmuLocalSession = {
        ...prev,
        plans: updatedPlans,
      };
      saveBmuSession(updatedSession);
      return updatedSession;
    });

    await saveModuleEStep6BlindSpotAuditAction({
      planId: currentPlan.id,
      blindSpotAudit,
      completionPercentage: progress,
    });
  }

  async function handleGenerateModuleEBlindSpotAuditWithAi(params: {
    selectedTrack: ProductTrackType;
    otherProductTrackText?: string;
    fulfillmentMode?: OperationsFulfillmentModeType | '';
    activeMinutesPerOrder?: number;
    directVariableCostPerOrder?: number;
    maxOrdersPerWeekCeiling?: number;
    premisesSetupMode?: PremisesSetupModeType | '';
    monthlyPremisesOverheadCost?: number;
    totalEquipmentCapexExVat?: number;
    supplierRedundancyPosture?: SupplierRedundancyPostureType | '';
    estimatedReturnRatePercent?: number;
    expectedReturnBufferPerOrder?: number;
    estimatedAnnualInsurancePremium?: number;
    selectedInsuranceProviderName?: string;
    currentReadinessConfidence?: OperationsReadinessConfidenceType | '';
    currentBlindSpots?: OperationsBlindSpotItem[];
    mode?: 'POPULATE_BLIND_SPOTS_AND_NARRATIVES' | 'NARRATIVES_ONLY';
  }) {
    if (!aiCreditCheck.allowed) {
      setPaywallModalFeature(
        `AI Operations Blind-Spot Audit & Executive Brief (${aiCreditCheck.reason})`
      );
      return {
        allowed: false,
        reason: aiCreditCheck.reason,
        readinessConfidence:
          (params.currentReadinessConfidence as OperationsReadinessConfidenceType) ||
          'READY_FOR_V1_FULFILLMENT',
        blindSpots: params.currentBlindSpots || [],
        executiveOperationsSummaryNarrative: '',
        operationsToFinanceAndTeamHandshakeNarrative: '',
        engineMode: 'smart-synthesizer' as const,
      };
    }

    const res = await generateModuleEBlindSpotAuditWithAiAction({
      planId: currentPlan.id,
      planTitle: currentPlan.title,
      industryCategory: currentPlan.industryCategory,
      hqCountryCode: selectedCountry,
      baseCurrency: currentPlan.baseCurrency,
      selectedTrack: params.selectedTrack,
      otherProductTrackText: params.otherProductTrackText,
      fulfillmentMode: params.fulfillmentMode,
      activeMinutesPerOrder: params.activeMinutesPerOrder,
      directVariableCostPerOrder: params.directVariableCostPerOrder,
      maxOrdersPerWeekCeiling: params.maxOrdersPerWeekCeiling,
      premisesSetupMode: params.premisesSetupMode,
      monthlyPremisesOverheadCost: params.monthlyPremisesOverheadCost,
      totalEquipmentCapexExVat: params.totalEquipmentCapexExVat,
      supplierRedundancyPosture: params.supplierRedundancyPosture,
      estimatedReturnRatePercent: params.estimatedReturnRatePercent,
      expectedReturnBufferPerOrder: params.expectedReturnBufferPerOrder,
      estimatedAnnualInsurancePremium: params.estimatedAnnualInsurancePremium,
      selectedInsuranceProviderName: params.selectedInsuranceProviderName,
      currentReadinessConfidence: params.currentReadinessConfidence,
      currentBlindSpots: params.currentBlindSpots,
      mode: params.mode,
    });

    setSession((prev) => {
      const updatedSession: BmuLocalSession = {
        ...prev,
        entitlement: {
          ...prev.entitlement,
          aiCreditsUsedThisMonth:
            res.creditsUsedAfter ?? prev.entitlement.aiCreditsUsedThisMonth + 1,
        },
      };
      saveBmuSession(updatedSession);
      return updatedSession;
    });

    return {
      allowed: res.allowed,
      reason: res.reason,
      readinessConfidence: res.readinessConfidence,
      blindSpots: res.blindSpots,
      executiveOperationsSummaryNarrative:
        res.executiveOperationsSummaryNarrative,
      operationsToFinanceAndTeamHandshakeNarrative:
        res.operationsToFinanceAndTeamHandshakeNarrative,
      aiCoachTip: res.aiCoachTip,
      engineMode: res.engineMode,
    };
  }

  async function handleSaveMasterDocumentData(
    masterDocumentData: SavedMasterDocumentData
  ) {
    setSession((prev) => {
      const updatedPlans = prev.plans.map((p) => {
        if (p.id !== currentPlan.id) return p;
        return {
          ...p,
          masterDocumentData: {
            ...masterDocumentData,
            lastSavedAt: new Date().toISOString(),
          },
        };
      });
      const updatedSession: BmuLocalSession = {
        ...prev,
        plans: updatedPlans,
      };
      saveBmuSession(updatedSession);
      return updatedSession;
    });

    await saveMasterDocumentDataAction({
      planId: currentPlan.id,
      masterDocumentData,
    });
  }

  async function handleWeaveMasterDocumentStoryWithAi(
    facts: MasterDocumentVerifiedFacts
  ) {
    if (!aiCreditCheck.allowed) {
      setPaywallModalFeature(
        `AI Master Document Story Weaver (${aiCreditCheck.reason})`
      );
      return {
        allowed: false,
        reason: aiCreditCheck.reason,
        story: buildDeterministicMasterStory(facts),
        engineMode: 'smart-synthesizer' as const,
      };
    }

    const res = await weaveMasterDocumentStoryWithAiAction({
      planId: currentPlan.id,
      facts,
    });

    setSession((prev) => {
      const updatedPlans = prev.plans.map((p) => {
        if (p.id !== currentPlan.id) return p;
        return {
          ...p,
          masterDocumentData: {
            ...res.story,
            lastSavedAt: new Date().toISOString(),
          },
        };
      });
      const updatedSession: BmuLocalSession = {
        ...prev,
        entitlement: {
          ...prev.entitlement,
          aiCreditsUsedThisMonth:
            res.creditsUsedAfter ?? prev.entitlement.aiCreditsUsedThisMonth + 1,
        },
        plans: updatedPlans,
      };
      saveBmuSession(updatedSession);
      return updatedSession;
    });

    return {
      allowed: res.allowed,
      reason: res.reason,
      story: res.story,
      engineMode: res.engineMode,
    };
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

  async function handleSaveCanvasEdits(
    overrideGrantCheck?: SavedGrantEligibilityCheck | React.MouseEvent
  ) {
    setIsSavingCanvas(true);
    setSynthesisBanner(null);
    try {
      const toSave = effectiveCanvas;
      const validOverride =
        overrideGrantCheck &&
        typeof overrideGrantCheck === 'object' &&
        'legalEntityStage' in overrideGrantCheck
          ? (overrideGrantCheck as SavedGrantEligibilityCheck)
          : undefined;
      const grantCheckToSave: SavedGrantEligibilityCheck = validOverride
        ? {
            ...validOverride,
            lastCheckedAt:
              validOverride.lastCheckedAt || new Date().toISOString(),
          }
        : grantEligibilityCheck;
      await saveModuleACanvasEditsAction({
        planId: currentPlan.id,
        brainDumpText,
        exportPotential: currentPlan.exportPotential,
        canvas: toSave,
        founderMotivation,
        teamAndBudget,
        founderRealityCheck,
        grantEligibilityCheck: grantCheckToSave,
        thingsToConsider: liveThingsToConsider,
      });
      setConceptCanvas(toSave);
      setGrantEligibilityCheck(grantCheckToSave);
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
              grantEligibilityCheck: grantCheckToSave,
              thingsToConsider: liveThingsToConsider,
            }
          : p
      );
      const updatedSession = { ...session, plans: updatedPlans };
      setSession(updatedSession);
      saveBmuSession(updatedSession);

      setSynthesisBanner(
        validOverride
          ? '✅ Your Grant Eligibility Check answers have been saved!'
          : '✅ Your notes and Step 6 Blind-Spot Review have been updated and saved!'
      );
    } finally {
      setIsSavingCanvas(false);
    }
  }

  async function handleRunAiGrantPositioning(
    overrideGrantCheck?: SavedGrantEligibilityCheck
  ) {
    const activeCheck = overrideGrantCheck || grantEligibilityCheck;
    if (!aiCreditCheck.allowed) {
      setPaywallModalFeature(
        `AI Grant Positioning Advisor (${aiCreditCheck.reason})`
      );
      return;
    }

    setIsRunningGrantAdvisor(true);
    setSynthesisBanner(null);
    try {
      const res = await generateModuleAGrantPositioningAdviceAction({
        userId: session.user.id,
        planId: currentPlan.id,
        planTitle: currentPlan.title,
        hqCountryCode: selectedCountry,
        industryCategory: currentPlan.industryCategory,
        exportPotential: currentPlan.exportPotential,
        brainDumpText,
        canvas: effectiveCanvas,
        founderMotivation,
        teamAndBudget,
        founderRealityCheck,
        grantCheck: activeCheck,
      });

      const updatedGrantCheck: SavedGrantEligibilityCheck = {
        ...activeCheck,
        aiGrantPositioningAdvice: res.positioningTips,
        aiEngineUsed: res.engineMode,
        lastCheckedAt: new Date().toISOString(),
      };
      const updatedCanvas: SavedConceptCanvas = {
        ...effectiveCanvas,
        revenueAndGrantFit: res.updatedRevenueAndGrantFit,
      };

      setGrantEligibilityCheck(updatedGrantCheck);
      setConceptCanvas(updatedCanvas);

      const updatedPlans = session.plans.map((p) =>
        p.id === currentPlan.id
          ? {
              ...p,
              conceptCanvas: updatedCanvas,
              grantEligibilityCheck: updatedGrantCheck,
            }
          : p
      );
      const updatedSession: BmuLocalSession = {
        ...session,
        entitlement: {
          ...session.entitlement,
          aiCreditsUsedThisMonth:
            res.creditsUsedAfter ?? session.entitlement.aiCreditsUsedThisMonth + 1,
        },
        plans: updatedPlans,
      };
      setSession(updatedSession);
      saveBmuSession(updatedSession);

      setSynthesisBanner(
        '🎯 Revealed your qualified grants, AI Grant Positioning Strategy, and synced Box 5 (Revenue & Grant Fit)!'
      );
    } finally {
      setIsRunningGrantAdvisor(false);
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

  const isGrantCheckerSupported =
    isGrantCheckerSupportedForCountry(selectedCountry);
  const liveGrantEvaluation = isGrantCheckerSupported
    ? evaluateModuleAGrantEligibility({
        hqCountryCode: selectedCountry,
        exportPotential: currentPlan.exportPotential,
        industryCategory: currentPlan.industryCategory,
        brainDumpText,
        conceptCanvas: effectiveCanvas,
        founderMotivation,
        teamAndBudget,
        founderRealityCheck,
        grantCheck: grantEligibilityCheck,
      })
    : null;

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
    ...(isGrantCheckerSupported && liveGrantEvaluation
      ? [
          {
            stepNumber: 7,
            label: 'Grant & Funding Eligibility Check',
            isComplete: Boolean(grantEligibilityCheck?.lastCheckedAt),
            summary: grantEligibilityCheck?.lastCheckedAt
              ? `${liveGrantEvaluation.qualifiesNowGrants.length} Qualified Now (${liveGrantEvaluation.immediateQualifiedPoolFormatted}) • ${liveGrantEvaluation.unlockableNextGrants.length} Phase 2`
              : 'Click "Check What Grants I Qualify For" in Step 7',
          },
        ]
      : []),
  ];

  const totalReadinessStepsCount = moduleAReadinessSteps.length;
  const completedReadinessCount = moduleAReadinessSteps.filter(
    (s) => s.isComplete
  ).length;
  const briefStepNumber = isGrantCheckerSupported ? 8 : 7;
  const briefStepId = isGrantCheckerSupported ? 'mod-a-step-8' : 'mod-a-step-7';

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

  const savedBeachhead = currentPlan.moduleBData?.beachhead;
  const savedStep2Competitors =
    currentPlan.moduleBData?.competitorsAndStatusQuo;
  const savedStep3MarketSizing = currentPlan.moduleBData?.marketSizing;
  const savedStep4CompetitiveWedge = currentPlan.moduleBData?.competitiveWedge;
  const step1ModBScore = savedBeachhead?.beachheadSegment ? 20 : 0;
  const step2ModBScore =
    savedStep2Competitors?.competitors?.length ||
    savedStep2Competitors?.whySwitchOneSentence
      ? 20
      : 0;
  const step3ModBScore = savedStep3MarketSizing?.segments?.some(
    (s) => s.pricePerCustomerInput.trim().length > 0
  )
    ? 20
    : 0;
  const step4ModBScore =
    savedStep4CompetitiveWedge?.competitiveEdgeSummary?.trim() ||
    savedStep4CompetitiveWedge?.unfairAdvantages?.length
      ? 20
      : 0;
  const step5ModBScore =
    (currentPlan.moduleBData?.thingsToConsider?.length ?? 0) > 0 ? 20 : 0;
  const totalModBScore =
    step1ModBScore +
    step2ModBScore +
    step3ModBScore +
    step4ModBScore +
    step5ModBScore;
  const moduleBProgressPercent =
    totalModBScore > 0
      ? totalModBScore
      : activeModule === 'MOD_B_MARKET'
        ? 10
        : 0;

  const savedSurveys = currentPlan.moduleCData?.surveys || [];
  const savedInterviewLogs = currentPlan.moduleCData?.interviewLogs || [];
  const hasSurveyWithQuestions = savedSurveys.some(
    (s) => s.questions.length > 0 && s.title.trim().length > 0
  );
  const hasLoggedInterviews = savedInterviewLogs.length > 0;
  const hasSurveyResponses = savedSurveys.some((s) => s.responses.length > 0);
  const hasSurveyInsightsOrBlindSpots =
    savedSurveys.some((s) => Boolean(s.aiInsightsSummary)) ||
    (currentPlan.moduleCData?.thingsToConsider?.length ?? 0) > 0;
  const totalModCScore =
    !hasSurveyWithQuestions && !hasLoggedInterviews
      ? 0
      : (hasSurveyWithQuestions || hasLoggedInterviews ? 50 : 0) +
        (hasSurveyResponses || hasLoggedInterviews ? 25 : 0) +
        (hasSurveyInsightsOrBlindSpots ? 25 : 0);
  const moduleCProgressPercent =
    totalModCScore > 0
      ? totalModCScore
      : activeModule === 'MOD_C_SURVEYS_FEEDBACK'
        ? 10
        : 0;

  const savedModDVehicle = currentPlan.moduleDData?.productVehicle;
  const savedModDChannelMatrix = currentPlan.moduleDData?.channelMatrix;
  const savedModDScopeFilter = currentPlan.moduleDData?.scopeFilter;
  const savedModDBuildVsBuy = currentPlan.moduleDData?.buildVsBuy;
  const savedModDWorkPackages = currentPlan.moduleDData?.workPackagesAndFlow;
  const savedModDBlindSpotAudit = currentPlan.moduleDData?.blindSpotAudit;
  const step1ModDScore = savedModDVehicle
    ? savedModDVehicle.ahaMomentNarrative.trim().length > 10 &&
      savedModDVehicle.whyThisVehicleFitsCustomer.trim().length > 10
      ? 18
      : 10
    : 0;
  const step2ModDScore = savedModDChannelMatrix
    ? savedModDChannelMatrix.rentToOwnBridgeStrategy.trim().length > 10 &&
      savedModDChannelMatrix.channelWhyItFitsNotes.trim().length > 10
      ? 16
      : 8
    : 0;
  const step3ModDScore = savedModDScopeFilter
    ? savedModDScopeFilter.items.some((i) => i.bucket === 'MUST_HAVE_V1') &&
      savedModDScopeFilter.whatWeRefuseToBuildInV1Narrative.trim().length > 10 &&
      savedModDScopeFilter.whyThisLeanV1WinsFasterNarrative.trim().length > 10
      ? 16
      : 8
    : 0;
  const step4ModDScore = savedModDBuildVsBuy
    ? savedModDBuildVsBuy.items.some((i) => i.tier === 'BUILD_IN_HOUSE') &&
      savedModDBuildVsBuy.secretSauceInHouseNarrative.trim().length > 10 &&
      savedModDBuildVsBuy.whyBuyAndPartnerSavesTimeNarrative.trim().length > 10
      ? 16
      : 8
    : 0;
  const step5ModDScore = savedModDWorkPackages
    ? savedModDWorkPackages.workPackages.length > 0 &&
      savedModDWorkPackages.technicalMeritAndInnovationNarrative.trim().length >
        10 &&
      savedModDWorkPackages.bottleneckAndDeRiskingNarrative.trim().length > 10
      ? 18
      : 9
    : 0;
  const step6ModDScore = savedModDBlindSpotAudit
    ? savedModDBlindSpotAudit.readinessConfidence &&
      (savedModDBlindSpotAudit.executiveProductBriefSummary.trim().length >
        10 ||
        savedModDBlindSpotAudit.blindSpots.length > 0)
      ? 16
      : 8
    : 0;
  const totalModDScore =
    step1ModDScore +
    step2ModDScore +
    step3ModDScore +
    step4ModDScore +
    step5ModDScore +
    step6ModDScore;
  const moduleDProgressPercent =
    totalModDScore > 0
      ? Math.min(100, totalModDScore)
      : activeModule === 'MOD_D_PRODUCT_BUILD'
        ? 10
        : 0;

  const savedModEBlueprint = currentPlan.moduleEData?.operationsBlueprint;
  const savedModEPremisesEquipment =
    currentPlan.moduleEData?.premisesAndEquipment;
  const savedModERiskRegister = currentPlan.moduleEData?.riskRegister;
  const savedModESupport = currentPlan.moduleEData?.supportReturnsAndQc;
  const savedModECompliance = currentPlan.moduleEData?.permitsAndInsurance;
  const savedModEBlindSpotAudit = currentPlan.moduleEData?.blindSpotAudit;
  const step1ModEScore = savedModEBlueprint
    ? savedModEBlueprint.orderLifecycleStages.length >= 3 &&
      savedModEBlueprint.endToEndFulfillmentNarrative.trim().length > 10 &&
      savedModEBlueprint.scalingAndBottleneckDeRiskingNarrative.trim().length >
        10
      ? 20
      : 12
    : 0;
  const step2ModEScore = savedModEPremisesEquipment
    ? savedModEPremisesEquipment.equipmentItems.length >= 1 &&
      savedModEPremisesEquipment.equipmentRoiAndGrantComplianceNarrative.trim()
        .length > 10
      ? 20
      : 12
    : 0;
  const step3ModEScore = savedModERiskRegister?.riskItems?.length ? 15 : 0;
  const step4ModEScore = savedModESupport?.qcCheckpoints?.length ? 15 : 0;
  const step5ModEScore = savedModECompliance?.complianceItems?.length ? 15 : 0;
  const step6ModEScore = savedModEBlindSpotAudit?.blindSpots?.length ? 15 : 0;
  const totalModEScore =
    step1ModEScore +
    step2ModEScore +
    step3ModEScore +
    step4ModEScore +
    step5ModEScore +
    step6ModEScore;
  const moduleEProgressPercent =
    totalModEScore > 0
      ? Math.min(100, totalModEScore)
      : activeModule === 'MOD_E_OPERATIONS'
        ? 10
        : 0;

  const savedModFStep1 = currentPlan.moduleFData?.promoterProfiles;
  const savedModFStep2 = currentPlan.moduleFData?.step2RoleMatrixData;
  const savedModFStep3 = currentPlan.moduleFData?.step3SurvivalBudgetData;
  const savedModFStep4 = currentPlan.moduleFData?.step4AlignmentData;
  const savedModFStep5 = currentPlan.moduleFData?.step5HiringPlanData;
  const savedModFStep6 = currentPlan.moduleFData?.step6BlindSpotAuditData;

  const step1ModFScore = savedModFStep1
    ? (savedModFStep1.teamMembers && savedModFStep1.teamMembers.length >= 1) ||
      Boolean(savedModFStep1.teamStructurePosture)
      ? savedModFStep1.teamMembers &&
        savedModFStep1.teamMembers.length >= 1 &&
        savedModFStep1.teamMembers.every(
          (m) => m.fullName?.trim() && m.jobTitle?.trim()
        )
        ? 20
        : 10
      : 0
    : 0;

  const step2ModFScore = savedModFStep2
    ? savedModFStep2.hatAssignments &&
      savedModFStep2.hatAssignments.some(
        (h) => h.primaryOwnerMemberId && h.primaryOwnerMemberId !== 'UNASSIGNED'
      )
      ? savedModFStep2.hatAssignments.filter(
          (h) =>
            h.primaryOwnerMemberId && h.primaryOwnerMemberId !== 'UNASSIGNED'
        ).length === 7
        ? 20
        : 12
      : 0
    : 0;

  const step3ModFScore = savedModFStep3
    ? savedModFStep3.founderBudgets && savedModFStep3.founderBudgets.length > 0
      ? savedModFStep3.founderBudgets.some(
          (b) =>
            (b.housingAndUtilities || 0) +
              (b.groceriesAndEssentials || 0) +
              (b.transportAndCommute || 0) >
            0
        )
        ? 20
        : 12
      : 0
    : 0;

  const step4ModFScore = savedModFStep4
    ? savedModFStep4.responses && savedModFStep4.responses.length > 0
      ? savedModFStep4.responses.some(
          (r) => Object.keys(r.answers || {}).length >= 12
        ) || savedModFStep4.isRevealed
        ? 20
        : 12
      : 0
    : 0;

  const step5ModFScore = savedModFStep5
    ? savedModFStep5.roles && savedModFStep5.roles.length > 0
      ? Boolean(savedModFStep5.hiringPosture) &&
        savedModFStep5.roles.every((r) => r.title?.trim().length > 0)
        ? 20
        : 12
      : 0
    : 0;

  const step6ModFScore = savedModFStep6
    ? savedModFStep6.executiveTeamCapabilityNarrative?.trim().length > 20 ||
      Boolean(savedModFStep6.readinessConfidence) ||
      (savedModFStep6.blindSpots && savedModFStep6.blindSpots.length > 0) ||
      (currentPlan.moduleFData?.thingsToConsider?.length ?? 0) > 0
      ? 20
      : 0
    : 0;

  const totalModFScore =
    step1ModFScore +
    step2ModFScore +
    step3ModFScore +
    step4ModFScore +
    step5ModFScore +
    step6ModFScore;

  const moduleFProgressPercent =
    currentPlan.moduleFData?.completionPercentage &&
    currentPlan.moduleFData.completionPercentage > totalModFScore
      ? currentPlan.moduleFData.completionPercentage
      : totalModFScore > 0
        ? Math.min(100, totalModFScore)
        : activeModule === 'MOD_F_COFOUNDER_TEAM'
          ? 10
          : 0;

  // Module H Progress Calculation (Steps 1–5)
  const savedModHStep1 = currentPlan.moduleHData?.step1RevenueModel;
  const savedModHStep2 = currentPlan.moduleHData?.step2PricingTiers;
  const savedModHStep3 = currentPlan.moduleHData?.step3BreakevenCalculator;
  const savedModHStep4 = currentPlan.moduleHData?.step4SalesAssumptions;
  const savedModHStep5 = currentPlan.moduleHData?.step5RevenueBrief;

  const step1ModHScore = savedModHStep1
    ? Boolean(savedModHStep1.revenueModelVehicle) &&
      Boolean(savedModHStep1.offeringStructure) &&
      Boolean(savedModHStep1.valueMetric?.trim())
      ? 20
      : 10
    : 0;

  const step2ModHScore = savedModHStep2
    ? savedModHStep2.tiers && savedModHStep2.tiers.length > 0
      ? savedModHStep2.tiers.some((t) => (t.priceNetOfTax ?? 0) > 0 || (t.priceGross ?? 0) > 0 || t.name?.trim().length > 0)
        ? 20
        : 10
      : 0
    : 0;

  const step3ModHScore = savedModHStep3
    ? Boolean(
        (savedModHStep3.activePriceSlider ?? 0) > 0 ||
        (savedModHStep3.activeCustomerSlider ?? 0) > 0 ||
        (savedModHStep3.yearTargets && savedModHStep3.yearTargets.length > 0) ||
        (savedModHStep3.breakevenNarrative?.trim().length ?? 0) > 10
      )
      ? 20
      : 10
    : 0;

  const step4ModHScore = savedModHStep4
    ? Boolean(
        (savedModHStep4.expectedConversionRatePercent ?? 0) > 0 ||
        (savedModHStep4.salesCycleDays ?? 0) > 0 ||
        (savedModHStep4.teamMonthlyCapacityCap ?? 0) > 0 ||
        (savedModHStep4.writtenAssumptionsNarrative?.trim().length ?? 0) > 10
      )
      ? 20
      : 10
    : 0;

  const step5ModHScore = savedModHStep5
    ? Boolean(
        (savedModHStep5.executiveCommercialSummaryNarrative?.trim().length ?? 0) > 20 ||
        savedModHStep5.revenueReadinessConfidence ||
        (savedModHStep5.blindSpots && savedModHStep5.blindSpots.length > 0) ||
        (currentPlan.moduleHData?.thingsToConsider?.length ?? 0) > 0
      )
      ? 20
      : 0
    : 0;

  const totalModHScore =
    step1ModHScore +
    step2ModHScore +
    step3ModHScore +
    step4ModHScore +
    step5ModHScore;

  const moduleHProgressPercent =
    currentPlan.moduleHData?.completionPercentage &&
    currentPlan.moduleHData.completionPercentage > totalModHScore
      ? currentPlan.moduleHData.completionPercentage
      : totalModHScore > 0
        ? Math.min(100, totalModHScore)
        : activeModule === 'MOD_H_REVENUE'
          ? 10
          : 0;

  // Module I Progress Calculation (Step 1)
  const savedModIStep1 = currentPlan.moduleIData?.step1Positioning;
  const step1ModIScore = savedModIStep1
    ? Boolean(savedModIStep1.elevatorHook140?.trim()) &&
      Boolean(savedModIStep1.positioningFormula?.targetCustomer?.trim()) &&
      Boolean(savedModIStep1.positioningFormula?.customerProblem?.trim())
      ? 25
      : 15
    : 0;

  const totalModIScore = step1ModIScore;

  const moduleIProgressPercent =
    currentPlan.moduleIData?.completionPercentage &&
    currentPlan.moduleIData.completionPercentage > totalModIScore
      ? currentPlan.moduleIData.completionPercentage
      : totalModIScore > 0
        ? Math.min(100, totalModIScore)
        : activeModule === 'MOD_I_MARKETING'
          ? 10
          : 0;

  const savedModJStep1 = currentPlan.moduleJData?.step1OverheadsTax;
  const step1ModJScore = savedModJStep1
    ? (savedModJStep1.overheadLineItems?.length || 0) >= 2 &&
      Boolean(savedModJStep1.overheadsAndTaxNarrative?.trim())
      ? 20
      : 10
    : 0;

  const savedModJStep2 = currentPlan.moduleJData?.step2WorkingCapital;
  const step2ModJScore = savedModJStep2
    ? Boolean(savedModJStep2.customerCollectionTiming) &&
      Boolean(savedModJStep2.workingCapitalNarrative?.trim())
      ? 20
      : 10
    : 0;

  const savedModJStep3 = currentPlan.moduleJData?.step3CashflowGap;
  const step3ModJScore = savedModJStep3
    ? (savedModJStep3.fundingSources?.length || 0) >= 1 &&
      Boolean(savedModJStep3.fundingGapNarrative?.trim())
      ? 20
      : 10
    : 0;

  const savedModJStep4 = currentPlan.moduleJData?.step4Statements;
  const step4ModJScore = savedModJStep4
    ? Boolean(savedModJStep4.activeStressScenario) &&
      Boolean(savedModJStep4.writtenFinancialAssumptionsBlock?.trim())
      ? 20
      : 10
    : 0;

  const savedModJStep5 = currentPlan.moduleJData?.step5FinanceBrief;
  const step5ModJScore = savedModJStep5
    ? Boolean(savedModJStep5.executiveFinancialSummaryNarrative?.trim()) &&
      Boolean(savedModJStep5.financeReadinessConfidence)
      ? 20
      : 10
    : 0;

  const totalModJScore =
    step1ModJScore +
    step2ModJScore +
    step3ModJScore +
    step4ModJScore +
    step5ModJScore;

  const moduleJProgressPercent =
    currentPlan.moduleJData?.completionPercentage &&
    currentPlan.moduleJData.completionPercentage > totalModJScore
      ? currentPlan.moduleJData.completionPercentage
      : totalModJScore > 0
        ? Math.min(100, totalModJScore)
        : activeModule === 'MOD_J_FINANCE'
          ? 10
          : 0;

  const masterDocChapterPills: Array<{
    short: string;
    code: ModuleCode;
    progress: number;
  }> = [
    { short: 'A', code: 'MOD_A_IDEATION', progress: moduleAProgressPercent },
    { short: 'B', code: 'MOD_B_MARKET', progress: moduleBProgressPercent },
    {
      short: 'C',
      code: 'MOD_C_SURVEYS_FEEDBACK',
      progress: moduleCProgressPercent,
    },
    {
      short: 'D',
      code: 'MOD_D_PRODUCT_BUILD',
      progress: moduleDProgressPercent,
    },
    { short: 'E', code: 'MOD_E_OPERATIONS', progress: moduleEProgressPercent },
    { short: 'F', code: 'MOD_F_COFOUNDER_TEAM', progress: moduleFProgressPercent },
  ];
  const syncedChaptersCount = masterDocChapterPills.filter(
    (c) => c.progress > 0
  ).length;
  const overallSyncedProgressPercent = Math.round(
    masterDocChapterPills.reduce((acc, c) => acc + c.progress, 0) /
      masterDocChapterPills.length
  );

  const moduleGProgressPercent =
    currentPlan.moduleGData?.completionPercentage || 0;
  const moduleKProgressPercent =
    currentPlan.moduleKData?.completionPercentage ||
    (activeModule === 'MOD_K_GRANTS_FUNDING' ? 15 : 0);
  const moduleLProgressPercent =
    currentPlan.moduleLData?.completionPercentage ||
    (activeModule === 'MOD_L_BUSINESS_PLAN' ? 20 : 0);

  const dashboardModuleProgressList = MODULES_LIST.map((mod) => {
    const access = canAccessModule(activeEntitlement, mod.code);
    const modProgress =
      mod.code === 'MOD_A_IDEATION'
        ? moduleAProgressPercent
        : mod.code === 'MOD_B_MARKET'
          ? moduleBProgressPercent
          : mod.code === 'MOD_C_SURVEYS_FEEDBACK'
            ? moduleCProgressPercent
            : mod.code === 'MOD_D_PRODUCT_BUILD'
              ? moduleDProgressPercent
              : mod.code === 'MOD_E_OPERATIONS'
                ? moduleEProgressPercent
                : mod.code === 'MOD_F_COFOUNDER_TEAM'
                  ? moduleFProgressPercent
                  : mod.code === 'MOD_G_LAUNCHPAD'
                    ? moduleGProgressPercent
                    : mod.code === 'MOD_H_REVENUE'
                      ? moduleHProgressPercent
                      : mod.code === 'MOD_I_MARKETING'
                        ? moduleIProgressPercent
                        : mod.code === 'MOD_J_FINANCE'
                          ? moduleJProgressPercent
                          : mod.code === 'MOD_K_GRANTS_FUNDING'
                            ? moduleKProgressPercent
                            : mod.code === 'MOD_L_BUSINESS_PLAN'
                              ? moduleLProgressPercent
                              : mod.progress;
    return {
      code: mod.code,
      short: mod.short,
      title: mod.title,
      progress: modProgress,
      allowed: access.allowed,
      lockReason: access.reason,
    };
  });

  const activeModuleMeta =
    MODULES_LIST.find((m) => m.code === activeModule) || MODULES_LIST[0];

  const allPlanSurveys = currentPlan.moduleCData?.surveys || [];
  const dashboardSurveyResponsesCount = allPlanSurveys.reduce(
    (sum, s) => sum + (s.responses?.length || 0),
    0
  );
  const dashboardWaitlistLeadsCount = allPlanSurveys.reduce(
    (sum, s) =>
      sum +
      (s.responses?.filter(
        (r) => Boolean(r.respondentEmail?.trim()) || Boolean(r.joinedWaitlist)
      ).length || 0),
    0
  );
  const primaryPublicSurveySlug =
    allPlanSurveys.find((s) => Boolean(s.publicSlug))?.publicSlug ||
    allPlanSurveys[0]?.publicSlug;

  const dashboardLaunchpadCompletedCount = Math.min(
    6,
    Math.round((moduleGProgressPercent / 100) * 6)
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
    grantEligibilityCheck,
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
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 print:bg-white">
      {isSyntheticPersonaPlan(currentPlan) && (
        <div className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-xs text-amber-950">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-600 text-[10px] text-white">
                Persona Sandbox Preview
              </Badge>
              <span>
                You are previewing synthetic persona{' '}
                <strong>{currentPlan.title}</strong>. Your real startup plan is
                safely preserved in your vault.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                onClick={() => {
                  const restored = exitPersonaPreviewAndRestoreRealPlans();
                  setSession(restored);
                  const realPlan =
                    restored.plans.find(
                      (p) => p.id === restored.activePlanId
                    ) || restored.plans[0];
                  if (realPlan) {
                    handleSelectPlan(realPlan.id);
                  }
                  router.replace('/workspace');
                }}
                className="h-7 bg-amber-900 px-3 text-xs font-semibold text-white hover:bg-amber-800"
              >
                Exit Sandbox &amp; Restore My Real Plan
              </Button>
              <Link
                href="/admin?tab=persona-lab"
                className="rounded-md border border-amber-400 bg-white px-2.5 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100"
              >
                Back to Persona Lab
              </Link>
            </div>
          </div>
        </div>
      )}
      {/* Clean Production Top Navigation Bar with Google Cloud-Style Project Switcher */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur no-print print:hidden">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 sm:gap-4 sm:px-6 sm:py-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={openProjectDashboardWithHistory}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-900 shadow-xs transition-opacity hover:opacity-95 sm:h-9 sm:w-9"
              title="Project Dashboard Home"
            >
              <PreflightMark size={24} />
            </button>

            <button
              type="button"
              onClick={openProjectDashboardWithHistory}
              className="hidden text-base font-bold tracking-tight text-slate-900 hover:text-indigo-700 sm:inline"
            >
              Startup Preflight
            </button>

            <span className="hidden text-slate-300 sm:inline">/</span>

            {/* Google Cloud-Style Top Project Switcher Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setPlanDropdownOpen(!planDropdownOpen)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/90 px-2.5 py-1.5 text-left shadow-2xs transition-all hover:border-indigo-300 hover:bg-white sm:px-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="max-w-[140px] truncate text-xs font-bold text-slate-900 sm:max-w-[220px] sm:text-sm">
                      {currentPlan.title}
                    </span>
                    {currentPlan.isPivot && (
                      <span className="shrink-0 rounded bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold text-violet-700">
                        Pivot
                      </span>
                    )}
                    <Badge
                      variant="secondary"
                      className="hidden border-slate-200 bg-white px-1.5 py-0 text-[10px] font-semibold text-slate-700 md:inline-flex"
                    >
                      {selectedCountry} • {countryPack.defaultCurrency}
                    </Badge>
                  </div>
                  <div className="hidden truncate text-[10px] text-slate-500 sm:block">
                    {countryPack.countryName} • {currentPlan.industryCategory} (
                    {session.plans.length || 1}/
                    {activeEntitlement.maxStartupPlans} Projects)
                  </div>
                </div>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${
                    planDropdownOpen ? 'rotate-180 text-indigo-600' : ''
                  }`}
                />
              </button>

              {planDropdownOpen && (
                <div className="absolute left-0 top-full z-40 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xl sm:w-80">
                  <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <span>Switch Active Venture</span>
                    <span>
                      {session.plans.length || 1} /{' '}
                      {activeEntitlement.maxStartupPlans} Used
                    </span>
                  </div>
                  <div className="mt-1 max-h-60 space-y-1 overflow-y-auto">
                    {session.plans.map((p) => (
                      <div
                        key={p.id}
                        className={`group/plan flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs transition-colors ${
                          p.id === currentPlan.id
                            ? 'bg-indigo-50/90 font-semibold text-indigo-950 ring-1 ring-indigo-200'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectPlan(p.id)}
                          className="min-w-0 flex-1 truncate pr-2 text-left"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="truncate font-bold">{p.title}</span>
                            {p.isPivot && (
                              <span className="shrink-0 rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">
                                Pivot
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 text-[11px] font-normal text-slate-500">
                            {p.hqCountryCode} ({p.baseCurrency}) •{' '}
                            {p.industryCategory}
                          </div>
                        </button>
                        <div className="flex shrink-0 items-center gap-1">
                          {p.id === currentPlan.id && (
                            <Check className="mr-1 h-4 w-4 shrink-0 text-indigo-600" />
                          )}
                          <button
                            type="button"
                            title={`Delete ${p.title}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setPlanDropdownOpen(false);
                              setPlanToDelete({ id: p.id, title: p.title });
                            }}
                            className="rounded p-1 text-slate-400 opacity-60 transition-opacity hover:bg-red-50 hover:text-red-600 hover:opacity-100 group-hover/plan:opacity-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="my-2 border-t border-slate-100" />

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
                    className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
                  >
                    <span className="flex items-center gap-1.5">
                      <Plus className="h-3.5 w-3.5" />+ Create New Venture
                    </span>
                    {!multiPlanCheck.allowed && (
                      <Lock className="h-3.5 w-3.5 text-amber-600" />
                    )}
                  </button>

                  {clonePlanError && (
                    <div className="mx-2 mb-1 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                      {clonePlanError}
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={isCloningPlan}
                    onClick={handleClonePlan}
                    className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <span className="flex items-center gap-1.5">
                      {isCloningPlan ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-600" />
                      ) : (
                        <GitBranch className="h-3.5 w-3.5 text-violet-600" />
                      )}
                      {isCloningPlan
                        ? 'Cloning Venture & Modules...'
                        : 'Clone & Pivot Current Venture'}
                    </span>
                    {!multiPlanCheck.allowed && (
                      <Lock className="h-3.5 w-3.5 text-amber-600" />
                    )}
                  </button>
                </div>
              )}
            </div>

            {!isDashboardOpen && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={openProjectDashboardWithHistory}
                className="h-8 border-indigo-200 bg-indigo-50/70 px-2.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100"
              >
                <LayoutGrid className="mr-1.5 h-3.5 w-3.5" />
                <span className="hidden sm:inline">Project Dashboard</span>
                <span className="sm:hidden">Dashboard</span>
              </Button>
            )}
          </div>

          {/* Right User & Co-Pilot Actions */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs xl:flex">
              <span className="font-semibold text-slate-800">
                {session.user.name}
              </span>
              <Badge variant="secondary" className="text-[10px]">
                {activeEntitlement.planType}
              </Badge>
            </div>

            <LocalBugCaptureWidget
              activeModule={activeModule}
              activeStepContext={currentPlan.currentModuleStep}
              planId={currentPlan.id}
              planTitle={currentPlan.title}
              userEmail={session.user.email}
            />

            <Link href="/account" title="My Account & Billing">
              <Button
                variant="ghost"
                size="sm"
                className="px-2 text-xs text-slate-600 sm:px-3"
              >
                <User className="h-3.5 w-3.5 text-indigo-600" />
                <span className="hidden sm:inline">My Account</span>
              </Button>
            </Link>

            <Link href="/onboarding" title="Plan Settings">
              <Button
                variant="ghost"
                size="sm"
                className="px-2 text-xs text-slate-600 sm:px-3"
              >
                <UserCheck className="h-3.5 w-3.5 text-slate-500" />
                <span className="hidden sm:inline">Plan Settings</span>
              </Button>
            </Link>

            <Link
              href="/login"
              title="Sign Out"
              onClick={() => {
                clearActiveBmuSession();
                logoutFounderAction().catch(() => {});
              }}
            >
              <Button
                variant="ghost"
                size="sm"
                className="px-2 text-xs text-slate-600 sm:px-3"
              >
                <LogOut className="h-3.5 w-3.5 text-slate-500" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* MAIN FOUNDER COMMAND CENTER OR WORKSPACE                  */}
      {/* ========================================================= */}
      <div className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 gap-4 px-3.5 py-4 sm:gap-6 sm:px-6 sm:py-6 lg:grid-cols-12 print:block print:w-full print:max-w-none print:p-0 print:m-0 print:bg-white">
        {/* LEFT SIDEBAR: Shown ONLY when inside the Step-by-Step Founder Workspace (Modules A–L) */}
        {!isDashboardOpen && !isBusinessPlanStudioOpen && !isMasterDocumentOpen && (
          <aside className="space-y-3.5 sm:space-y-4 lg:col-span-4 xl:col-span-3 no-print print:hidden">
            {/* Slim Back to Project Dashboard + Quick Switch Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={openProjectDashboardWithHistory}
                className="w-full justify-start border-indigo-200 bg-indigo-50/50 text-xs font-bold text-indigo-800 hover:bg-indigo-100/80"
              >
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                Back to Project Dashboard
              </Button>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={openMasterDocumentWithHistory}
                  className="flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-[11px] font-semibold text-slate-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50/60 hover:text-emerald-800"
                >
                  <BookOpen className="h-3 w-3 text-emerald-600" />
                  Master Doc
                </button>
                <button
                  type="button"
                  onClick={openBusinessPlanStudioWithHistory}
                  className="flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-[11px] font-semibold text-slate-700 transition-colors hover:border-violet-300 hover:bg-violet-50/60 hover:text-violet-800"
                >
                  <Sparkles className="h-3 w-3 text-violet-600" />
                  Plan Studio
                </button>
              </div>
            </div>

            {/* Mobile/Tablet Collapsible Module & Parking Lot Toggle (< lg only) */}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="flex w-full items-center justify-between rounded-xl border border-indigo-200 bg-white px-3.5 py-2.5 text-left shadow-xs transition-colors hover:bg-indigo-50/40 lg:hidden"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
                  {activeModule.replace('MOD_', '').split('_')[0] || 'A'}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-xs font-bold text-slate-900">
                    {activeModuleMeta.short}: {activeModuleMeta.title}
                  </div>
                  <div className="text-[11px] text-indigo-700">
                    {mobileSidebarOpen
                      ? 'Hide Modules (A–L) & Parked Questions'
                      : `Tap to Switch Module (A–L) • ${openQuestions.length} Parked`}
                  </div>
                </div>
              </div>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-indigo-600 transition-transform ${
                  mobileSidebarOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            <div
              className={`${
                mobileSidebarOpen ? 'block' : 'hidden'
              } space-y-3.5 sm:space-y-4 lg:block`}
            >
              {/* Clean Module A - L Navigation List */}
              <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Founder Workspace (Modules A–L)
                </div>
                <div className="space-y-1">
                  {MODULES_LIST.map((mod) => {
                    const access = canAccessModule(activeEntitlement, mod.code);
                    const IconComponent = mod.icon;
                    const isCurrent = activeModule === mod.code;
                    const modProgress =
                      dashboardModuleProgressList.find(
                        (m) => m.code === mod.code
                      )?.progress ?? mod.progress;

                    return (
                      <button
                        key={mod.code}
                        type="button"
                        onClick={() => {
                          if (!access.allowed) {
                            setPendingModuleAfterUnlock(mod.code);
                            setPaywallModalFeature(
                              `${mod.short}: ${mod.title} — ${access.reason}`
                            );
                            return;
                          }
                          setMobileSidebarOpen(false);
                          navigateToModuleWithHistory(mod.code);
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
                            ) : isCurrent || modProgress > 0 ? (
                              <span
                                className={`text-[10px] font-bold ${
                                  modProgress === 100
                                    ? 'text-emerald-600'
                                    : 'text-indigo-600'
                                }`}
                              >
                                {modProgress}%
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-0.5 truncate text-[11px] text-slate-500">
                            {mod.subtitle}
                          </p>
                          {(isCurrent || modProgress > 0) && access.allowed && (
                            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-indigo-100">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  modProgress === 100
                                    ? 'bg-emerald-500'
                                    : 'bg-indigo-600'
                                }`}
                                style={{ width: `${modProgress}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Open Questions Parking Lot Sidebar Card */}
              <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-3.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                    <BookmarkPlus className="h-3.5 w-3.5 text-amber-600" />
                    Open Questions Parking Lot
                  </span>
                  <Badge
                    variant="secondary"
                    className="bg-amber-100 text-[10px] text-amber-900"
                  >
                    {openQuestions.length} Parked
                  </Badge>
                </div>
                <p className="mt-1 text-[11px] text-amber-900/80">
                  Tricky questions you parked so you never lose momentum:
                </p>
                {openQuestions.length === 0 ? (
                  <div className="mt-2.5 rounded-lg border border-dashed border-amber-200/80 bg-white/70 px-2.5 py-2 text-[11px] text-slate-500">
                    No open questions parked yet. Use &ldquo;Park Question&rdquo; on any step when you want to come back to a detail later.
                  </div>
                ) : (
                  <>
                    <ul className="mt-2.5 space-y-1.5 text-xs text-slate-700">
                      {(showAllOpenQuestions
                        ? openQuestions
                        : openQuestions.slice(0, 4)
                      ).map((q, idx) => (
                        <li
                          key={idx}
                          className="group flex items-start justify-between gap-1.5 rounded-lg border border-amber-200/60 bg-white px-2.5 py-1.5 text-[11px] leading-snug"
                        >
                          <span>• {q}</span>
                          {!activeEntitlement.isVaultReadonly && (
                            <button
                              type="button"
                              onClick={() => handleResolveOpenQuestion(idx)}
                              title="Mark resolved & remove from Parking Lot"
                              className="mt-0.5 shrink-0 rounded p-0.5 text-slate-400 opacity-70 transition-opacity hover:bg-amber-100 hover:text-amber-900 group-hover:opacity-100"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                    {openQuestions.length > 4 && (
                      <button
                        type="button"
                        onClick={() =>
                          setShowAllOpenQuestions(!showAllOpenQuestions)
                        }
                        className="mt-2 w-full rounded-lg border border-amber-200/70 bg-white/80 py-1 text-center text-[11px] font-semibold text-amber-900 hover:bg-amber-100/60"
                      >
                        {showAllOpenQuestions
                          ? 'Show Fewer Questions'
                          : `Show All ${openQuestions.length} Parked Questions`}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </aside>
        )}

        {/* CENTER WORKSPACE OR FULL-WIDTH DASHBOARD / MASTER DOC / PLAN STUDIO */}
        <main
          className={`space-y-6 print:block print:w-full print:max-w-none print:p-0 print:m-0 print:space-y-0 print:bg-white ${
            isDashboardOpen || isBusinessPlanStudioOpen || isMasterDocumentOpen
              ? 'lg:col-span-12'
              : 'lg:col-span-8 xl:col-span-9'
          }`}
        >
          {/* Read-Only Vault Banner if Expired */}
          {activeEntitlement.isVaultReadonly && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 no-print print:hidden">
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

          {/* Global Workspace Status / Save Banner */}
          {synthesisBanner && (
            <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-950 shadow-2xs no-print print:hidden">
              <span>{synthesisBanner}</span>
              <button
                type="button"
                onClick={() => setSynthesisBanner(null)}
                className="ml-3 rounded-md px-2 py-0.5 text-[11px] font-bold text-emerald-900 underline opacity-80 hover:bg-emerald-100 hover:opacity-100"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Full-Width Navigation Strip when in Master Document or Business Plan Studio */}
          {!isDashboardOpen &&
            (isMasterDocumentOpen || isBusinessPlanStudioOpen) && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-2xs no-print print:hidden">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={openProjectDashboardWithHistory}
                    className="h-8 border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                    Back to Project Dashboard
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => navigateToModuleWithHistory(activeModule)}
                    className="h-8 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                  >
                    Open Founder Workspace ({activeModuleMeta.short})
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={isMasterDocumentOpen ? 'default' : 'outline'}
                    onClick={openMasterDocumentWithHistory}
                    className={`h-8 text-xs font-bold ${
                      isMasterDocumentOpen
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                    Living Master Document
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={isBusinessPlanStudioOpen ? 'default' : 'outline'}
                    onClick={openBusinessPlanStudioWithHistory}
                    className={`h-8 text-xs font-bold ${
                      isBusinessPlanStudioOpen
                        ? 'bg-violet-600 text-white hover:bg-violet-700'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    Business Plan Studio
                  </Button>
                </div>
              </div>
            )}

          {isDashboardOpen ? (
            <ProjectDashboardView
              founderName={session.user.name}
              planId={currentPlan.id}
              planTitle={currentPlan.title}
              oneLinerSummary={
                currentPlan.oneLinerSummary ||
                effectiveCanvas?.proposedSolution
              }
              industryCategory={currentPlan.industryCategory}
              hqCountryCode={selectedCountry}
              countryName={countryPack.countryName}
              currencyCode={countryPack.defaultCurrency}
              isPivot={currentPlan.isPivot}
              activeModule={activeModule}
              activeModuleTitle={`${activeModuleMeta.short}: ${activeModuleMeta.title}`}
              moduleProgressList={dashboardModuleProgressList}
              masterDocSyncedChaptersCount={syncedChaptersCount}
              masterDocTotalChaptersCount={masterDocChapterPills.length}
              masterDocOverallProgressPercent={overallSyncedProgressPercent}
              savedDossiersCount={currentPlan.moduleLData?.versions?.length || 1}
              surveyResponsesCount={dashboardSurveyResponsesCount}
              waitlistLeadsCount={dashboardWaitlistLeadsCount}
              publicSurveySlug={primaryPublicSurveySlug}
              matchedGrantsCount={getGrantsForCountry(selectedCountry).length}
              launchpadStepsCompletedCount={dashboardLaunchpadCompletedCount}
              launchpadProgressPercent={moduleGProgressPercent}
              openQuestionsCount={openQuestions.length}
              openQuestionsPreview={openQuestions}
              moduleAProgressPercent={moduleAProgressPercent}
              moduleHProgressPercent={moduleHProgressPercent}
              onEnterWorkspace={(targetMod, targetStep) => {
                const modToOpen = targetMod || activeModule;
                const access = canAccessModule(activeEntitlement, modToOpen);
                if (!access.allowed) {
                  setPendingModuleAfterUnlock(modToOpen);
                  setPaywallModalFeature(
                    `${modToOpen} — ${access.reason || 'Requires an upgraded pass.'}`
                  );
                  return;
                }
                navigateToModuleWithHistory(modToOpen, targetStep);
              }}
              onOpenMasterDocument={openMasterDocumentWithHistory}
              onOpenBusinessPlanStudio={openBusinessPlanStudioWithHistory}
            />
          ) : isBusinessPlanStudioOpen ? (
            <BusinessPlanStudioWorkspace
              key={`bp-studio-${currentPlan.id}`}
              plan={{
                ...currentPlan,
                hqCountryCode: selectedCountry,
                brainDumpText,
                conceptCanvas: effectiveCanvas,
                founderMotivation,
                teamAndBudget,
                founderRealityCheck,
                thingsToConsider: liveThingsToConsider,
                openQuestions,
              }}
              selectedCountry={selectedCountry}
              founderName={session.user.name}
              isVaultReadonly={activeEntitlement.isVaultReadonly}
              whiteLabelEnabled={activeEntitlement.whiteLabelExportEnabled}
              onUpdatePlanModuleLData={(updatedModuleL: SavedModuleLData) => {
                setSession((prev) => {
                  const updatedPlans = prev.plans.map((p) => {
                    if (p.id !== currentPlan.id) return p;
                    return {
                      ...p,
                      moduleLData: updatedModuleL,
                    };
                  });
                  const updatedSession: BmuLocalSession = {
                    ...prev,
                    plans: updatedPlans,
                  };
                  saveBmuSession(updatedSession);
                  return updatedSession;
                });
              }}
              onJumpToModule={(modCode: ModuleCode, targetStep?: number) => {
                const access = canAccessModule(activeEntitlement, modCode);
                if (!access.allowed) {
                  setPendingModuleAfterUnlock(modCode);
                  setPaywallModalFeature(
                    access.reason || 'This module requires an upgraded plan.'
                  );
                  return;
                }
                setIsBusinessPlanStudioOpen(false);
                navigateToModuleWithHistory(modCode, targetStep);
              }}
            />
          ) : isMasterDocumentOpen ? (
            <MasterDocumentWorkspace
              key={`master-doc-${currentPlan.id}`}
              plan={{
                ...currentPlan,
                hqCountryCode: selectedCountry,
                brainDumpText,
                conceptCanvas: effectiveCanvas,
                founderMotivation,
                teamAndBudget,
                founderRealityCheck,
                thingsToConsider: liveThingsToConsider,
                openQuestions,
              }}
              founderName={session.user.name}
              brainDumpText={brainDumpText}
              conceptCanvas={effectiveCanvas}
              founderMotivation={founderMotivation}
              teamAndBudget={teamAndBudget}
              founderRealityCheck={founderRealityCheck}
              moduleABlindSpots={liveThingsToConsider}
              isVaultReadonly={activeEntitlement.isVaultReadonly}
              whiteLabelEnabled={activeEntitlement.whiteLabelExportEnabled}
              onSaveMasterDocumentData={handleSaveMasterDocumentData}
              onWeaveStoryWithAi={handleWeaveMasterDocumentStoryWithAi}
              onJumpToModule={(modCode) => {
                const access = canAccessModule(activeEntitlement, modCode);
                if (!access.allowed) {
                  setPendingModuleAfterUnlock(modCode);
                  setPaywallModalFeature(
                    `${modCode} — ${access.reason}`
                  );
                  return;
                }
                navigateToModuleWithHistory(modCode);
              }}
            />
          ) : activeModule === 'MOD_F_COFOUNDER_TEAM' ? (
            <ModuleFWorkspace
              key={currentPlan.id}
              plan={{
                ...currentPlan,
                conceptCanvas: effectiveCanvas,
              }}
              selectedCountry={selectedCountry}
              isVaultReadonly={activeEntitlement.isVaultReadonly}
              onSaveStep1PromoterProfiles={async (promoterProfiles, progress = 20) => {
                setSession((prev) => {
                  const updatedPlans = prev.plans.map((p) => {
                    if (p.id !== currentPlan.id) return p;
                    return {
                      ...p,
                      currentModuleStep: 'MOD_F_STEP_1',
                      moduleFData: {
                        ...(p.moduleFData || {}),
                        promoterProfiles,
                        completionPercentage: Math.max(
                          p.moduleFData?.completionPercentage || 0,
                          progress
                        ),
                        lastSavedAt: new Date().toISOString(),
                      },
                    };
                  });
                  const updatedSession: BmuLocalSession = {
                    ...prev,
                    plans: updatedPlans,
                  };
                  saveBmuSession(updatedSession);
                  return updatedSession;
                });

                await saveModuleFStep1PromoterProfilesAction({
                  planId: currentPlan.id,
                  promoterProfiles,
                  completionPercentage: progress,
                });
              }}
              onSaveStep2RoleMatrix={async (step2RoleMatrixData, progress = 40) => {
                setSession((prev) => {
                  const updatedPlans = prev.plans.map((p) => {
                    if (p.id !== currentPlan.id) return p;
                    return {
                      ...p,
                      currentModuleStep: 'MOD_F_STEP_2',
                      moduleFData: {
                        ...(p.moduleFData || {}),
                        step2RoleMatrixData,
                        completionPercentage: Math.max(
                          p.moduleFData?.completionPercentage || 0,
                          progress
                        ),
                        lastSavedAt: new Date().toISOString(),
                      },
                    };
                  });
                  const updatedSession: BmuLocalSession = {
                    ...prev,
                    plans: updatedPlans,
                  };
                  saveBmuSession(updatedSession);
                  return updatedSession;
                });

                await saveModuleFStep2RoleMatrixAction({
                  planId: currentPlan.id,
                  roleMatrix: step2RoleMatrixData,
                  completionPercentage: progress,
                });
              }}
              onSaveStep3SurvivalBudget={async (step3SurvivalBudgetData, progress = 60) => {
                setSession((prev) => {
                  const updatedPlans = prev.plans.map((p) => {
                    if (p.id !== currentPlan.id) return p;
                    return {
                      ...p,
                      currentModuleStep: 'MOD_F_STEP_3',
                      moduleFData: {
                        ...(p.moduleFData || {}),
                        step3SurvivalBudgetData,
                        completionPercentage: Math.max(
                          p.moduleFData?.completionPercentage || 0,
                          progress
                        ),
                        lastSavedAt: new Date().toISOString(),
                      },
                    };
                  });
                  const updatedSession: BmuLocalSession = {
                    ...prev,
                    plans: updatedPlans,
                  };
                  saveBmuSession(updatedSession);
                  return updatedSession;
                });

                await saveModuleFStep3SurvivalBudgetAction({
                  planId: currentPlan.id,
                  survivalBudget: step3SurvivalBudgetData,
                  completionPercentage: progress,
                });
              }}
              onSaveStep4Alignment={async (step4AlignmentData, progress = 80) => {
                setSession((prev) => {
                  const updatedPlans = prev.plans.map((p) => {
                    if (p.id !== currentPlan.id) return p;
                    return {
                      ...p,
                      currentModuleStep: 'MOD_F_STEP_4',
                      moduleFData: {
                        ...(p.moduleFData || {}),
                        step4AlignmentData,
                        completionPercentage: Math.max(
                          p.moduleFData?.completionPercentage || 0,
                          progress
                        ),
                        lastSavedAt: new Date().toISOString(),
                      },
                    };
                  });
                  const updatedSession: BmuLocalSession = {
                    ...prev,
                    plans: updatedPlans,
                  };
                  saveBmuSession(updatedSession);
                  return updatedSession;
                });

                await saveModuleFStep4AlignmentAction({
                  planId: currentPlan.id,
                  step4AlignmentData,
                  completionPercentage: progress,
                });
              }}
              onSaveStep5HiringPlan={async (step5HiringPlanData, progress = 90) => {
                setSession((prev) => {
                  const updatedPlans = prev.plans.map((p) => {
                    if (p.id !== currentPlan.id) return p;
                    return {
                      ...p,
                      currentModuleStep: 'MOD_F_STEP_5',
                      moduleFData: {
                        ...(p.moduleFData || {}),
                        step5HiringPlanData,
                        completionPercentage: Math.max(
                          p.moduleFData?.completionPercentage || 0,
                          progress
                        ),
                        lastSavedAt: new Date().toISOString(),
                      },
                    };
                  });
                  const updatedSession: BmuLocalSession = {
                    ...prev,
                    plans: updatedPlans,
                  };
                  saveBmuSession(updatedSession);
                  return updatedSession;
                });

                await saveModuleFStep5HiringPlanAction({
                  planId: currentPlan.id,
                  hiringPlan: step5HiringPlanData,
                  completionPercentage: progress,
                });
              }}
              onSaveBriefOverview={async (step6BlindSpotAuditData, progress = 100) => {
                setSession((prev) => {
                  const updatedPlans = prev.plans.map((p) => {
                    if (p.id !== currentPlan.id) return p;
                    return {
                      ...p,
                      currentModuleStep: 'MOD_F_STEP_6',
                      moduleFData: {
                        ...(p.moduleFData || {}),
                        step6BlindSpotAuditData,
                        completionPercentage: Math.max(
                          p.moduleFData?.completionPercentage || 0,
                          progress
                        ),
                        lastSavedAt: new Date().toISOString(),
                      },
                    };
                  });
                  const updatedSession: BmuLocalSession = {
                    ...prev,
                    plans: updatedPlans,
                  };
                  saveBmuSession(updatedSession);
                  return updatedSession;
                });

                await saveModuleFStep6BlindSpotAuditAction({
                  planId: currentPlan.id,
                  blindSpotAudit: step6BlindSpotAuditData,
                  thingsToConsider: step6BlindSpotAuditData.blindSpots.map((b) => ({
                    id: b.id,
                    title: b.title,
                    category: b.category,
                    explanation: b.whyItMatters,
                    suggestedAction: b.recommendedActionOrFix,
                    severity: b.severity === 'CRITICAL' ? 'WARNING' : 'INFO',
                  })),
                  completionPercentage: progress,
                });
              }}
              userId={session.user.id}
              userName={session.user.name}
              userEmail={session.user.email}
              onParkOpenQuestion={(question) => {
                handleParkSpecificQuestion(question);
                parkModuleFOpenQuestionAction({
                  planId: currentPlan.id,
                  questionText: question,
                });
              }}
              onBackToModuleE={() => {
                navigateToModuleWithHistory('MOD_E_OPERATIONS', 6, 'module-e-step-6');
              }}
              initialStep={moduleNavTarget?.step}
              highlightTarget={moduleNavTarget?.highlightTarget}
              onContinueToModuleG={() => {
                const access = canAccessModule(
                  activeEntitlement,
                  'MOD_G_LAUNCHPAD'
                );
                if (!access.allowed) {
                  setPendingModuleAfterUnlock('MOD_G_LAUNCHPAD');
                  setPaywallModalFeature(
                    `Module G: Launchpad & Operations Hub — ${access.reason}`
                  );
                  return;
                }
                navigateToModuleWithHistory('MOD_G_LAUNCHPAD');
              }}
            />
          ) : activeModule === 'MOD_G_LAUNCHPAD' ? (
            <ModuleGWorkspace
              key={currentPlan.id}
              plan={{
                ...currentPlan,
                conceptCanvas: effectiveCanvas,
              }}
              selectedCountry={selectedCountry}
              isVaultReadonly={activeEntitlement.isVaultReadonly}
              initialData={currentPlan.moduleGData}
              initialStep={moduleNavTarget?.step}
              highlightTarget={moduleNavTarget?.highlightTarget}
              onSave={async (modGData) => {
                const nowIso = new Date().toISOString();
                const isS1 =
                  modGData.step1.state === 'ALREADY_HAVE'
                    ? !!modGData.step1.registeredEntityName.trim() && !!modGData.step1.registrationNumber.trim()
                    : !!modGData.step1.targetFormationTimeline;
                const isS2 =
                  modGData.step2.state === 'ALREADY_HAVE'
                    ? !!modGData.step2.primaryDomain.trim() && !!modGData.step2.officialBusinessEmail.trim()
                    : !!modGData.step2.primaryDomain.trim() || !!modGData.step2.emailProvider;
                const isS3 =
                  modGData.step3.state === 'ALREADY_HAVE'
                    ? !!modGData.step3.bankProvider && (modGData.step3.hasDedicatedIban || !!modGData.step3.ibanLast4.trim())
                    : !!modGData.step3.targetOpeningTimeline;
                const isS4 =
                  modGData.step4.state === 'ALREADY_HAVE'
                    ? !!modGData.step4.softwareChoice || modGData.step4.hasAccountant
                    : !!modGData.step4.vatStatus;
                const isS5 =
                  modGData.step5.state === 'ALREADY_HAVE'
                    ? modGData.step5.hasPublicLiability || modGData.step5.hasProfessionalIndemnity || !!modGData.step5.currentInsurerName.trim()
                    : !!modGData.step5.targetCoverageTimeline;
                const isS6 =
                  modGData.step6.state === 'ALREADY_HAVE'
                    ? modGData.step6.hasIpAssignmentSigned || modGData.step6.hasPrivacyPolicy
                    : !!modGData.step6.legalAdvisorOrPlatform || modGData.step6.hasIpAssignmentSigned;
                const doneCount = [isS1, isS2, isS3, isS4, isS5, isS6].filter(Boolean).length;
                const completionPct = Math.round((doneCount / 6) * 100);

                const savedPayload = {
                  ...modGData,
                  completionPercentage: completionPct,
                  lastSavedAt: nowIso,
                };

                setSession((prev) => {
                  const updatedPlans = prev.plans.map((p) => {
                    if (p.id !== currentPlan.id) return p;
                    return {
                      ...p,
                      currentModuleStep: 'MOD_G_LAUNCHPAD',
                      moduleGData: savedPayload,
                    };
                  });
                  const next = { ...prev, plans: updatedPlans };
                  saveBmuSession(next);
                  return next;
                });

                await saveModuleGLaunchpadDataAction({
                  planId: currentPlan.id,
                  data: savedPayload,
                  completionPercentage: completionPct,
                });
              }}
              onBackToModuleF={() => {
                navigateToModuleWithHistory('MOD_F_COFOUNDER_TEAM', 6, 'module-f-step-6');
              }}
              onContinueToModuleH={() => {
                const access = canAccessModule(
                  activeEntitlement,
                  'MOD_H_REVENUE'
                );
                if (!access.allowed) {
                  setPendingModuleAfterUnlock('MOD_H_REVENUE');
                  setPaywallModalFeature(
                    `Module H: Selling, Sales Assumptions & Pocket Profit — ${access.reason}`
                  );
                  return;
                }
                navigateToModuleWithHistory('MOD_H_REVENUE');
              }}
            />
          ) : activeModule === 'MOD_H_REVENUE' ? (
            <ModuleHWorkspace
              key={currentPlan.id}
              plan={{
                ...currentPlan,
                conceptCanvas: effectiveCanvas,
              }}
              selectedCountry={selectedCountry}
              isVaultReadonly={activeEntitlement.isVaultReadonly}
              onSaveStep1RevenueModel={async (step1Data, progress = 20) => {
                setSession((prev) => {
                  const updatedPlans = prev.plans.map((p) => {
                    if (p.id !== currentPlan.id) return p;
                    return {
                      ...p,
                      currentModuleStep: 'MOD_H_STEP_1_REVENUE_MODEL',
                      moduleHData: {
                        ...(p.moduleHData || {}),
                        step1RevenueModel: step1Data,
                        completionPercentage: Math.max(
                          p.moduleHData?.completionPercentage || 0,
                          progress
                        ),
                        lastSavedAt: new Date().toISOString(),
                      },
                    };
                  });
                  const updatedSession: BmuLocalSession = {
                    ...prev,
                    plans: updatedPlans,
                  };
                  saveBmuSession(updatedSession);
                  return updatedSession;
                });
              }}
              onSaveStep2PricingTiers={async (step2Data, progress = 40) => {
                setSession((prev) => {
                  const updatedPlans = prev.plans.map((p) => {
                    if (p.id !== currentPlan.id) return p;
                    return {
                      ...p,
                      currentModuleStep: 'MOD_H_STEP_2_PRICING_TIERS',
                      moduleHData: {
                        ...(p.moduleHData || {}),
                        step2PricingTiers: step2Data,
                        completionPercentage: Math.max(
                          p.moduleHData?.completionPercentage || 0,
                          progress
                        ),
                        lastSavedAt: new Date().toISOString(),
                      },
                    };
                  });
                  const updatedSession: BmuLocalSession = {
                    ...prev,
                    plans: updatedPlans,
                  };
                  saveBmuSession(updatedSession);
                  return updatedSession;
                });
              }}
              onSaveStep3BreakevenCalculator={async (step3Data, progress = 65) => {
                setSession((prev) => {
                  const updatedPlans = prev.plans.map((p) => {
                    if (p.id !== currentPlan.id) return p;
                    return {
                      ...p,
                      currentModuleStep: 'MOD_H_STEP_3_BREAKEVEN_ENGINE',
                      moduleHData: {
                        ...(p.moduleHData || {}),
                        step3BreakevenCalculator: step3Data,
                        completionPercentage: Math.max(
                          p.moduleHData?.completionPercentage || 0,
                          progress
                        ),
                        lastSavedAt: new Date().toISOString(),
                      },
                    };
                  });
                  const updatedSession: BmuLocalSession = {
                    ...prev,
                    plans: updatedPlans,
                  };
                  saveBmuSession(updatedSession);
                  return updatedSession;
                });
              }}
              onSaveStep4SalesAssumptions={async (step4Data, progress = 85) => {
                setSession((prev) => {
                  const updatedPlans = prev.plans.map((p) => {
                    if (p.id !== currentPlan.id) return p;
                    return {
                      ...p,
                      currentModuleStep: 'MOD_H_STEP_4_SALES_ASSUMPTIONS',
                      moduleHData: {
                        ...(p.moduleHData || {}),
                        step4SalesAssumptions: step4Data,
                        completionPercentage: Math.max(
                          p.moduleHData?.completionPercentage || 0,
                          progress
                        ),
                        lastSavedAt: new Date().toISOString(),
                      },
                    };
                  });
                  const updatedSession: BmuLocalSession = {
                    ...prev,
                    plans: updatedPlans,
                  };
                  saveBmuSession(updatedSession);
                  return updatedSession;
                });
              }}
              onSaveStep5RevenueBrief={async (step5Data, thingsToConsider, progress = 100) => {
                setSession((prev) => {
                  const updatedPlans = prev.plans.map((p) => {
                    if (p.id !== currentPlan.id) return p;
                    return {
                      ...p,
                      currentModuleStep: 'MOD_H_STEP_5_REVENUE_BRIEF',
                      moduleHData: {
                        ...(p.moduleHData || {}),
                        step5RevenueBrief: step5Data,
                        thingsToConsider: thingsToConsider ?? p.moduleHData?.thingsToConsider,
                        completionPercentage: Math.max(
                          p.moduleHData?.completionPercentage || 0,
                          progress
                        ),
                        lastSavedAt: new Date().toISOString(),
                      },
                    };
                  });
                  const updatedSession: BmuLocalSession = {
                    ...prev,
                    plans: updatedPlans,
                  };
                  saveBmuSession(updatedSession);
                  return updatedSession;
                });
              }}
              initialStep={moduleNavTarget?.step}
              highlightTarget={moduleNavTarget?.highlightTarget}
              onBackToModuleG={() => {
                navigateToModuleWithHistory('MOD_G_LAUNCHPAD', 7, 'mod-g-step-7');
              }}
              onNavigateToModule={(modCode, targetStep, highlightId) => {
                const access = canAccessModule(activeEntitlement, modCode);
                if (!access.allowed) {
                  setPendingModuleAfterUnlock(modCode);
                  setPaywallModalFeature(access.reason || 'This module requires an upgraded plan.');
                  return;
                }
                navigateToModuleWithHistory(modCode, targetStep, highlightId);
              }}
              onContinueToModuleI={() => {
                const access = canAccessModule(
                  activeEntitlement,
                  'MOD_I_MARKETING'
                );
                if (!access.allowed) {
                  setPendingModuleAfterUnlock('MOD_I_MARKETING');
                  setPaywallModalFeature(
                    `Module I: Marketing & Customer Acquisition — ${access.reason}`
                  );
                  return;
                }
                navigateToModuleWithHistory('MOD_I_MARKETING');
              }}
            />
          ) : activeModule === 'MOD_I_MARKETING' ? (
            <ModuleIWorkspace
              key={currentPlan.id}
              plan={{
                ...currentPlan,
                conceptCanvas: effectiveCanvas,
              }}
              selectedCountry={selectedCountry}
              isVaultReadonly={activeEntitlement.isVaultReadonly}
              onSaveStep1Positioning={async (step1Data, progress = 25) => {
                setSession((prev) => {
                  const updatedPlans = prev.plans.map((p) => {
                    if (p.id !== currentPlan.id) return p;
                    return {
                      ...p,
                      currentModuleStep: 'MOD_I_STEP_1_POSITIONING',
                      moduleIData: {
                        ...(p.moduleIData || {}),
                        step1Positioning: step1Data,
                        completionPercentage: Math.max(
                          p.moduleIData?.completionPercentage || 0,
                          progress
                        ),
                        lastSavedAt: new Date().toISOString(),
                      },
                    };
                  });
                  const updatedSession: BmuLocalSession = {
                    ...prev,
                    plans: updatedPlans,
                  };
                  saveBmuSession(updatedSession);
                  return updatedSession;
                });
              }}
              onSaveStep2FourPs={async (step2Data, progress = 45) => {
                setSession((prev) => {
                  const updatedPlans = prev.plans.map((p) => {
                    if (p.id !== currentPlan.id) return p;
                    return {
                      ...p,
                      currentModuleStep: 'MOD_I_STEP_2_FOUR_PS',
                      moduleIData: {
                        ...(p.moduleIData || {}),
                        step2FourPs: step2Data,
                        completionPercentage: Math.max(
                          p.moduleIData?.completionPercentage || 0,
                          progress
                        ),
                        lastSavedAt: new Date().toISOString(),
                      },
                    };
                  });
                  const updatedSession: BmuLocalSession = {
                    ...prev,
                    plans: updatedPlans,
                  };
                  saveBmuSession(updatedSession);
                  return updatedSession;
                });
              }}
              onSaveStep3First10={async (step3Data, progress = 65) => {
                setSession((prev) => {
                  const updatedPlans = prev.plans.map((p) => {
                    if (p.id !== currentPlan.id) return p;
                    return {
                      ...p,
                      currentModuleStep: 'MOD_I_STEP_3_FIRST_10',
                      moduleIData: {
                        ...(p.moduleIData || {}),
                        step3First10: step3Data,
                        completionPercentage: Math.max(
                          p.moduleIData?.completionPercentage || 0,
                          progress
                        ),
                        lastSavedAt: new Date().toISOString(),
                      },
                    };
                  });
                  const updatedSession: BmuLocalSession = {
                    ...prev,
                    plans: updatedPlans,
                  };
                  saveBmuSession(updatedSession);
                  return updatedSession;
                });
              }}
              onSaveStep4Budget={async (step4Data, progress = 90) => {
                setSession((prev) => {
                  const updatedPlans = prev.plans.map((p) => {
                    if (p.id !== currentPlan.id) return p;
                    return {
                      ...p,
                      currentModuleStep: 'MOD_I_STEP_4_BUDGET',
                      moduleIData: {
                        ...(p.moduleIData || {}),
                        step4Budget: step4Data,
                        completionPercentage: Math.max(
                          p.moduleIData?.completionPercentage || 0,
                          progress
                        ),
                        lastSavedAt: new Date().toISOString(),
                      },
                    };
                  });
                  const updatedSession: BmuLocalSession = {
                    ...prev,
                    plans: updatedPlans,
                  };
                  saveBmuSession(updatedSession);
                  return updatedSession;
                });
              }}
              onSaveStep5Brief={async (step5Data, progress = 100) => {
                setSession((prev) => {
                  const updatedPlans = prev.plans.map((p) => {
                    if (p.id !== currentPlan.id) return p;
                    return {
                      ...p,
                      currentModuleStep: 'MOD_I_STEP_5_BRIEF',
                      moduleIData: {
                        ...(p.moduleIData || {}),
                        step5MarketingBrief: step5Data,
                        thingsToConsider: step5Data.blindSpots,
                        completionPercentage: Math.max(
                          p.moduleIData?.completionPercentage || 0,
                          progress
                        ),
                        lastSavedAt: new Date().toISOString(),
                      },
                    };
                  });
                  const updatedSession: BmuLocalSession = {
                    ...prev,
                    plans: updatedPlans,
                  };
                  saveBmuSession(updatedSession);
                  return updatedSession;
                });
              }}
              initialStep={moduleNavTarget?.step}
              highlightTarget={moduleNavTarget?.highlightTarget}
              onBackToModuleH={() => {
                navigateToModuleWithHistory('MOD_H_REVENUE', 5, 'module-h-step-5');
              }}
              onContinueToModuleJ={() => {
                const access = canAccessModule(
                  activeEntitlement,
                  'MOD_J_FINANCE'
                );
                if (!access.allowed) {
                  setPendingModuleAfterUnlock('MOD_J_FINANCE');
                  setPaywallModalFeature(
                    `Module J: Financial Projections & Cashflow — ${access.reason}`
                  );
                  return;
                }
                navigateToModuleWithHistory('MOD_J_FINANCE');
              }}
              onNavigateToModule={(modCode, targetStep, highlightId) => {
                const access = canAccessModule(activeEntitlement, modCode);
                if (!access.allowed) {
                  setPendingModuleAfterUnlock(modCode);
                  setPaywallModalFeature(
                    access.reason || 'This module requires an upgraded plan.'
                  );
                  return;
                }
                navigateToModuleWithHistory(modCode, targetStep, highlightId);
              }}
            />
          ) : activeModule === 'MOD_J_FINANCE' ? (
            <ModuleJWorkspace
              key={currentPlan.id}
              plan={{
                ...currentPlan,
                conceptCanvas: effectiveCanvas,
              }}
              selectedCountry={selectedCountry}
              isVaultReadonly={activeEntitlement.isVaultReadonly}
              initialStep={moduleNavTarget?.step}
              highlightTarget={moduleNavTarget?.highlightTarget}
              onSaveStep1OverheadsTax={async (step1Data, progress = 25) => {
                setSession((prev) => {
                  const updatedPlans = prev.plans.map((p) => {
                    if (p.id !== currentPlan.id) return p;
                    return {
                      ...p,
                      currentModuleStep: 'MOD_J_STEP_1_OVERHEADS_TAX',
                      moduleJData: {
                        ...(p.moduleJData || {}),
                        step1OverheadsTax: step1Data,
                        completionPercentage: Math.max(
                          p.moduleJData?.completionPercentage || 0,
                          progress
                        ),
                        lastSavedAt: new Date().toISOString(),
                      },
                    };
                  });
                  const updatedSession: BmuLocalSession = {
                    ...prev,
                    plans: updatedPlans,
                  };
                  saveBmuSession(updatedSession);
                  return updatedSession;
                });
              }}
              onSaveStep2WorkingCapital={async (step2Data, progress = 50) => {
                setSession((prev) => {
                  const updatedPlans = prev.plans.map((p) => {
                    if (p.id !== currentPlan.id) return p;
                    return {
                      ...p,
                      currentModuleStep: 'MOD_J_STEP_2_WORKING_CAPITAL',
                      moduleJData: {
                        ...(p.moduleJData || {}),
                        step2WorkingCapital: step2Data,
                        completionPercentage: Math.max(
                          p.moduleJData?.completionPercentage || 0,
                          progress
                        ),
                        lastSavedAt: new Date().toISOString(),
                      },
                    };
                  });
                  const updatedSession: BmuLocalSession = {
                    ...prev,
                    plans: updatedPlans,
                  };
                  saveBmuSession(updatedSession);
                  return updatedSession;
                });
              }}
              onSaveStep3CashflowGap={async (step3Data, progress = 65) => {
                setSession((prev) => {
                  const updatedPlans = prev.plans.map((p) => {
                    if (p.id !== currentPlan.id) return p;
                    return {
                      ...p,
                      currentModuleStep: 'MOD_J_STEP_3_CASHFLOW_GAP',
                      moduleJData: {
                        ...(p.moduleJData || {}),
                        step3CashflowGap: step3Data,
                        completionPercentage: Math.max(
                          p.moduleJData?.completionPercentage || 0,
                          progress
                        ),
                        lastSavedAt: new Date().toISOString(),
                      },
                    };
                  });
                  const updatedSession: BmuLocalSession = {
                    ...prev,
                    plans: updatedPlans,
                  };
                  saveBmuSession(updatedSession);
                  return updatedSession;
                });
              }}
              onSaveStep4Statements={async (step4Data, progress = 85) => {
                setSession((prev) => {
                  const updatedPlans = prev.plans.map((p) => {
                    if (p.id !== currentPlan.id) return p;
                    return {
                      ...p,
                      currentModuleStep: 'MOD_J_STEP_4_STATEMENTS_STRESS_TEST',
                      moduleJData: {
                        ...(p.moduleJData || {}),
                        step4Statements: step4Data,
                        completionPercentage: Math.max(
                          p.moduleJData?.completionPercentage || 0,
                          progress
                        ),
                        lastSavedAt: new Date().toISOString(),
                      },
                    };
                  });
                  const updatedSession: BmuLocalSession = {
                    ...prev,
                    plans: updatedPlans,
                  };
                  saveBmuSession(updatedSession);
                  return updatedSession;
                });
              }}
              onSaveStep5Brief={async (step5Data, progress = 100) => {
                setSession((prev) => {
                  const updatedPlans = prev.plans.map((p) => {
                    if (p.id !== currentPlan.id) return p;
                    return {
                      ...p,
                      currentModuleStep: 'MOD_J_STEP_5_EXECUTIVE_FINANCE_BRIEF',
                      moduleJData: {
                        ...(p.moduleJData || {}),
                        step5FinanceBrief: step5Data,
                        completionPercentage: Math.max(
                          p.moduleJData?.completionPercentage || 0,
                          progress
                        ),
                        lastSavedAt: new Date().toISOString(),
                      },
                    };
                  });
                  const updatedSession: BmuLocalSession = {
                    ...prev,
                    plans: updatedPlans,
                  };
                  saveBmuSession(updatedSession);
                  return updatedSession;
                });
              }}
              onBackToModuleI={() => {
                navigateToModuleWithHistory('MOD_I_MARKETING', 5, 'module-i-step-5');
              }}
              onContinueToModuleK={() => {
                const access = canAccessModule(
                  activeEntitlement,
                  'MOD_K_GRANTS_FUNDING'
                );
                if (!access.allowed) {
                  setPendingModuleAfterUnlock('MOD_K_GRANTS_FUNDING');
                  setPaywallModalFeature(
                    `Module K: Non-Dilutive Grants & Tax Relief — ${access.reason}`
                  );
                  return;
                }
                navigateToModuleWithHistory('MOD_K_GRANTS_FUNDING');
              }}
              onNavigateToModule={(modCode, targetStep, highlightId) => {
                const access = canAccessModule(activeEntitlement, modCode);
                if (!access.allowed) {
                  setPendingModuleAfterUnlock(modCode);
                  setPaywallModalFeature(
                    access.reason || 'This module requires an upgraded plan.'
                  );
                  return;
                }
                navigateToModuleWithHistory(modCode, targetStep, highlightId);
              }}
            />
          ) : activeModule === 'MOD_K_GRANTS_FUNDING' ? (
            <ModuleKWorkspace
              key={currentPlan.id}
              plan={{
                ...currentPlan,
                conceptCanvas: effectiveCanvas,
              }}
              selectedCountry={selectedCountry}
              isVaultReadonly={activeEntitlement.isVaultReadonly}
              initialStep={moduleNavTarget?.step}
              highlightTarget={moduleNavTarget?.highlightTarget}
              onSaveStep1Audit={async (step1Data, progress = 25) => {
                setSession((prev) => {
                  const updatedPlans = prev.plans.map((p) => {
                    if (p.id !== currentPlan.id) return p;
                    return {
                      ...p,
                      currentModuleStep: 'MOD_K_STEP_1_AUDIT',
                      moduleKData: {
                        ...(p.moduleKData || {}),
                        step1Audit: step1Data,
                        completionPercentage: Math.max(
                          p.moduleKData?.completionPercentage || 0,
                          progress
                        ),
                        lastSavedAt: new Date().toISOString(),
                      },
                    };
                  });
                  const updatedSession: BmuLocalSession = {
                    ...prev,
                    plans: updatedPlans,
                  };
                  saveBmuSession(updatedSession);
                  return updatedSession;
                });
              }}
              onSaveStep2CapitalStack={async (step2Data, progress = 50) => {
                setSession((prev) => {
                  const updatedPlans = prev.plans.map((p) => {
                    if (p.id !== currentPlan.id) return p;
                    return {
                      ...p,
                      currentModuleStep: 'MOD_K_STEP_2_CAPITAL_STACK',
                      moduleKData: {
                        ...(p.moduleKData || {}),
                        step2CapitalStack: step2Data,
                        completionPercentage: Math.max(
                          p.moduleKData?.completionPercentage || 0,
                          progress
                        ),
                        lastSavedAt: new Date().toISOString(),
                      },
                    };
                  });
                  const updatedSession: BmuLocalSession = {
                    ...prev,
                    plans: updatedPlans,
                  };
                  saveBmuSession(updatedSession);
                  return updatedSession;
                });
              }}
              onSaveStep3Bridge={async (step3Data, progress = 65) => {
                setSession((prev) => {
                  const updatedPlans = prev.plans.map((p) => {
                    if (p.id !== currentPlan.id) return p;
                    return {
                      ...p,
                      currentModuleStep: 'MOD_K_STEP_3_REIMBURSEMENT_BRIDGE',
                      moduleKData: {
                        ...(p.moduleKData || {}),
                        step3ReimbursementBridge: step3Data,
                        completionPercentage: Math.max(
                          p.moduleKData?.completionPercentage || 0,
                          progress
                        ),
                        lastSavedAt: new Date().toISOString(),
                      },
                    };
                  });
                  const updatedSession: BmuLocalSession = {
                    ...prev,
                    plans: updatedPlans,
                  };
                  saveBmuSession(updatedSession);
                  return updatedSession;
                });
              }}
              onSaveStep4TaxRelief={async (step4Data, progress = 85) => {
                setSession((prev) => {
                  const updatedPlans = prev.plans.map((p) => {
                    if (p.id !== currentPlan.id) return p;
                    return {
                      ...p,
                      currentModuleStep: 'MOD_K_STEP_4_TAX_RELIEF',
                      moduleKData: {
                        ...(p.moduleKData || {}),
                        step4TaxRelief: step4Data,
                        completionPercentage: Math.max(
                          p.moduleKData?.completionPercentage || 0,
                          progress
                        ),
                        lastSavedAt: new Date().toISOString(),
                      },
                    };
                  });
                  const updatedSession: BmuLocalSession = {
                    ...prev,
                    plans: updatedPlans,
                  };
                  saveBmuSession(updatedSession);
                  return updatedSession;
                });
              }}
              onSaveStep5Brief={async (step5Data, progress = 100) => {
                setSession((prev) => {
                  const updatedPlans = prev.plans.map((p) => {
                    if (p.id !== currentPlan.id) return p;
                    return {
                      ...p,
                      currentModuleStep: 'MOD_K_STEP_5_FUNDING_BRIEF',
                      moduleKData: {
                        ...(p.moduleKData || {}),
                        step5FundingBrief: step5Data,
                        completionPercentage: Math.max(
                          p.moduleKData?.completionPercentage || 0,
                          progress
                        ),
                        lastSavedAt: new Date().toISOString(),
                      },
                    };
                  });
                  const updatedSession: BmuLocalSession = {
                    ...prev,
                    plans: updatedPlans,
                  };
                  saveBmuSession(updatedSession);
                  return updatedSession;
                });
              }}
              onBackToModuleJ={() => {
                navigateToModuleWithHistory('MOD_J_FINANCE', 5, 'module-j-step-5');
              }}
              onContinueToModuleL={() => {
                const access = canAccessModule(
                  activeEntitlement,
                  'MOD_L_BUSINESS_PLAN'
                );
                if (!access.allowed) {
                  setPendingModuleAfterUnlock('MOD_L_BUSINESS_PLAN');
                  setPaywallModalFeature(
                    `Module L: Official Plan & Grant Compiler — ${access.reason}`
                  );
                  return;
                }
                navigateToModuleWithHistory('MOD_L_BUSINESS_PLAN');
              }}
              onNavigateToModule={(modCode, targetStep, highlightId) => {
                const access = canAccessModule(activeEntitlement, modCode);
                if (!access.allowed) {
                  setPendingModuleAfterUnlock(modCode);
                  setPaywallModalFeature(
                    access.reason || 'This module requires an upgraded plan.'
                  );
                  return;
                }
                navigateToModuleWithHistory(modCode, targetStep, highlightId);
              }}
            />
          ) : activeModule === 'MOD_L_BUSINESS_PLAN' ? (
            <ModuleLWorkspace
              key={`mod-l-${currentPlan.id}`}
              plan={{
                ...currentPlan,
                hqCountryCode: selectedCountry,
                brainDumpText,
                conceptCanvas: effectiveCanvas,
                founderMotivation,
                teamAndBudget,
                founderRealityCheck,
                thingsToConsider: liveThingsToConsider,
                openQuestions,
              }}
              selectedCountry={selectedCountry}
              isVaultReadonly={activeEntitlement.isVaultReadonly}
              initialStep={moduleNavTarget?.step}
              onSaveStep1Mode={async (step1Data, progress = 20) => {
                setSession((prev) => {
                  const updatedPlans = prev.plans.map((p) => {
                    if (p.id !== currentPlan.id) return p;
                    return {
                      ...p,
                      currentModuleStep: 'MOD_L_STEP_1_MODE',
                      moduleLData: {
                        ...(p.moduleLData || {}),
                        step1Mode: step1Data,
                        completionPercentage: Math.max(
                          p.moduleLData?.completionPercentage || 0,
                          progress
                        ),
                        lastSavedAt: new Date().toISOString(),
                      },
                    };
                  });
                  const updatedSession: BmuLocalSession = {
                    ...prev,
                    plans: updatedPlans,
                  };
                  saveBmuSession(updatedSession);
                  return updatedSession;
                });

                await saveModuleLStep1ModeAction({
                  planId: currentPlan.id,
                  step1Mode: step1Data,
                  completionPercentage: progress,
                });
              }}
              onSaveStep2Audit={async (step2Data, progress = 40) => {
                setSession((prev) => {
                  const updatedPlans = prev.plans.map((p) => {
                    if (p.id !== currentPlan.id) return p;
                    return {
                      ...p,
                      currentModuleStep: 'MOD_L_STEP_2_AUDIT',
                      moduleLData: {
                        ...(p.moduleLData || {}),
                        step2Audit: step2Data,
                        completionPercentage: Math.max(
                          p.moduleLData?.completionPercentage || 0,
                          progress
                        ),
                        lastSavedAt: new Date().toISOString(),
                      },
                    };
                  });
                  const updatedSession: BmuLocalSession = {
                    ...prev,
                    plans: updatedPlans,
                  };
                  saveBmuSession(updatedSession);
                  return updatedSession;
                });

                await saveModuleLPartialDataAction({
                  planId: currentPlan.id,
                  stepKey: 'step2Audit',
                  payload: step2Data,
                  completionPercentage: progress,
                });
              }}
              onSaveStep3Compiler={async (step3Data, progress = 60) => {
                setSession((prev) => {
                  const updatedPlans = prev.plans.map((p) => {
                    if (p.id !== currentPlan.id) return p;
                    return {
                      ...p,
                      currentModuleStep: 'MOD_L_STEP_3_COMPILER',
                      moduleLData: {
                        ...(p.moduleLData || {}),
                        step3Compiler: step3Data,
                        completionPercentage: Math.max(
                          p.moduleLData?.completionPercentage || 0,
                          progress
                        ),
                        lastSavedAt: new Date().toISOString(),
                      },
                    };
                  });
                  const updatedSession: BmuLocalSession = {
                    ...prev,
                    plans: updatedPlans,
                  };
                  saveBmuSession(updatedSession);
                  return updatedSession;
                });

                await saveModuleLPartialDataAction({
                  planId: currentPlan.id,
                  stepKey: 'step3Compiler',
                  payload: step3Data,
                  completionPercentage: progress,
                });
              }}
              onSaveStep4Appendices={async (step4Data, progress = 80) => {
                setSession((prev) => {
                  const updatedPlans = prev.plans.map((p) => {
                    if (p.id !== currentPlan.id) return p;
                    return {
                      ...p,
                      currentModuleStep: 'MOD_L_STEP_4_APPENDICES',
                      moduleLData: {
                        ...(p.moduleLData || {}),
                        step4Appendices: step4Data,
                        completionPercentage: Math.max(
                          p.moduleLData?.completionPercentage || 0,
                          progress
                        ),
                        lastSavedAt: new Date().toISOString(),
                      },
                    };
                  });
                  const updatedSession: BmuLocalSession = {
                    ...prev,
                    plans: updatedPlans,
                  };
                  saveBmuSession(updatedSession);
                  return updatedSession;
                });

                await saveModuleLPartialDataAction({
                  planId: currentPlan.id,
                  stepKey: 'step4Appendices',
                  payload: step4Data,
                  completionPercentage: progress,
                });
              }}
              onSaveStep5Brief={async (step5Data, progress = 100) => {
                setSession((prev) => {
                  const updatedPlans = prev.plans.map((p) => {
                    if (p.id !== currentPlan.id) return p;
                    return {
                      ...p,
                      currentModuleStep: 'MOD_L_STEP_5_BRIEF',
                      moduleLData: {
                        ...(p.moduleLData || {}),
                        step5DossierBrief: step5Data,
                        completionPercentage: Math.max(
                          p.moduleLData?.completionPercentage || 0,
                          progress
                        ),
                        lastSavedAt: new Date().toISOString(),
                      },
                    };
                  });
                  const updatedSession: BmuLocalSession = {
                    ...prev,
                    plans: updatedPlans,
                  };
                  saveBmuSession(updatedSession);
                  return updatedSession;
                });

                await saveModuleLPartialDataAction({
                  planId: currentPlan.id,
                  stepKey: 'step5DossierBrief',
                  payload: step5Data,
                  completionPercentage: progress,
                });
              }}
              onParkQuestionInSession={handleParkSpecificQuestion}
              onBackToModuleK={() => {
                navigateToModuleWithHistory('MOD_K_GRANTS_FUNDING', 5, 'module-k-step-5');
              }}
              onOpenMasterBlueprint={() => {
                setIsMasterDocumentOpen(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onNavigateToModule={(modCode, targetStep, highlightId) => {
                const access = canAccessModule(activeEntitlement, modCode);
                if (!access.allowed) {
                  setPendingModuleAfterUnlock(modCode);
                  setPaywallModalFeature(
                    access.reason || 'This module requires an upgraded plan.'
                  );
                  return;
                }
                navigateToModuleWithHistory(modCode, targetStep, highlightId);
              }}
            />
          ) : activeModule === 'MOD_E_OPERATIONS' ? (
            <ModuleEWorkspace
              key={currentPlan.id}
              plan={{
                ...currentPlan,
                conceptCanvas: effectiveCanvas,
              }}
              selectedCountry={selectedCountry}
              isVaultReadonly={activeEntitlement.isVaultReadonly}
              onSaveStep1OperationsBlueprint={
                handleSaveModuleEStep1OperationsBlueprint
              }
              onGenerateAiOperationsBlueprint={
                handleGenerateModuleEOperationsBlueprintWithAi
              }
              onSaveStep2PremisesEquipment={
                handleSaveModuleEStep2PremisesEquipment
              }
              onGenerateAiPremisesEquipment={
                handleGenerateModuleEPremisesEquipmentWithAi
              }
              onSaveStep3RiskRegister={handleSaveModuleEStep3RiskRegister}
              onGenerateAiRiskRegister={
                handleGenerateModuleERiskRegisterWithAi
              }
              onSaveStep4SupportReturnsAndQc={
                handleSaveModuleEStep4SupportReturnsAndQc
              }
              onGenerateAiSupportReturnsAndQc={
                handleGenerateModuleESupportReturnsAndQcWithAi
              }
              onSaveStep5PermitsAndInsurance={
                handleSaveModuleEStep5PermitsAndInsurance
              }
              onGenerateAiPermitsAndInsurance={
                handleGenerateModuleEPermitsAndInsuranceWithAi
              }
              onSaveStep6BlindSpotAudit={handleSaveModuleEStep6BlindSpotAudit}
              onGenerateAiBlindSpotAudit={
                handleGenerateModuleEBlindSpotAuditWithAi
              }
              userId={session.user.id}
              initialStep={moduleNavTarget?.step}
              highlightTarget={moduleNavTarget?.highlightTarget}
              onParkOpenQuestion={handleParkModuleEQuestion}
              onBackToModuleD={() => {
                navigateToModuleWithHistory('MOD_D_PRODUCT_BUILD', 6, 'module-d-step-6');
              }}
              onContinueToModuleF={() => {
                const access = canAccessModule(
                  activeEntitlement,
                  'MOD_F_COFOUNDER_TEAM'
                );
                if (!access.allowed) {
                  setPendingModuleAfterUnlock('MOD_F_COFOUNDER_TEAM');
                  setPaywallModalFeature(
                    `Module F: Co-Founder, Team & Roles — ${access.reason}`
                  );
                  return;
                }
                setSynthesisBanner(
                  '✅ Module E Operations & Logistics Complete! Welcome to Module F (Co-Founder, Team & Roles).'
                );
                navigateToModuleWithHistory('MOD_F_COFOUNDER_TEAM');
              }}
            />
          ) : activeModule === 'MOD_D_PRODUCT_BUILD' ? (
            <ModuleDWorkspace
              key={currentPlan.id}
              founderName={session.user.name}
              plan={{
                ...currentPlan,
                conceptCanvas: effectiveCanvas,
              }}
              selectedCountry={selectedCountry}
              isVaultReadonly={activeEntitlement.isVaultReadonly}
              onSaveStep1ProductVehicle={handleSaveModuleDStep1ProductVehicle}
              onSaveStep2ChannelMatrix={handleSaveModuleDStep2ChannelMatrix}
              onSaveStep3ScopeFilter={handleSaveModuleDStep3ScopeFilter}
              onSaveStep4BuildVsBuy={handleSaveModuleDStep4BuildVsBuy}
              onSaveStep5WorkPackages={handleSaveModuleDStep5WorkPackages}
              onSaveStep6BlindSpotAudit={handleSaveModuleDStep6BlindSpotAudit}
              onGenerateAiProductVehicle={
                handleGenerateModuleDProductVehicleWithAi
              }
              onGenerateAiChannelMatrix={
                handleGenerateModuleDChannelMatrixWithAi
              }
              onGenerateAiScopeFilter={
                handleGenerateModuleDScopeFilterWithAi
              }
              onGenerateAiBuildVsBuy={
                handleGenerateModuleDBuildVsBuyWithAi
              }
              onGenerateAiWorkPackages={
                handleGenerateModuleDWorkPackagesWithAi
              }
              onGenerateAiBlindSpotAudit={
                handleGenerateModuleDBlindSpotAuditWithAi
              }
              onParkOpenQuestion={handleParkModuleDQuestion}
              initialStep={moduleNavTarget?.step}
              highlightTarget={moduleNavTarget?.highlightTarget}
              onBackToModuleC={() => {
                navigateToModuleWithHistory('MOD_C_SURVEYS_FEEDBACK', 4, 'module-c-step-4');
              }}
              onContinueToModuleE={() => {
                navigateToModuleWithHistory('MOD_E_OPERATIONS');
              }}
              whiteLabelEnabled={activeEntitlement.whiteLabelExportEnabled}
            />
          ) : activeModule === 'MOD_C_SURVEYS_FEEDBACK' ? (
            <ModuleCWorkspace
              key={currentPlan.id}
              plan={{
                ...currentPlan,
                conceptCanvas: effectiveCanvas,
              }}
              selectedCountry={selectedCountry}
              isVaultReadonly={activeEntitlement.isVaultReadonly}
              founderName={session.user.name}
              whiteLabelEnabled={activeEntitlement.whiteLabelExportEnabled}
              initialStep={moduleNavTarget?.step}
              highlightTarget={moduleNavTarget?.highlightTarget}
              onSaveSurvey={handleSaveModuleCSurvey}
              onDeleteSurvey={handleDeleteModuleCSurvey}
              onSaveInterviewLogs={handleSaveModuleCInterviewLogs}
              onSaveModuleCBlindSpots={handleSaveModuleCBlindSpots}
              onExtractMomTestInterviewWithAi={
                handleExtractMomTestInterviewWithAi
              }
              onGenerateSurveyWithAi={handleGenerateModuleCSurveyWithAi}
              onCheckMomTestQuestionWithAi={handleCheckMomTestQuestionWithAi}
              onSuggestNextQuestionWithAi={handleSuggestNextQuestionWithAi}
              onAnalyzeResultsWithAi={handleAnalyzeSurveyResultsWithAi}
              onParkQuestion={handleParkModuleBQuestion}
              onBackToModuleB={() => {
                navigateToModuleWithHistory('MOD_B_MARKET', 5, 'module-b-step-5');
              }}
              onContinueToModuleD={() => {
                const access = canAccessModule(
                  activeEntitlement,
                  'MOD_D_PRODUCT_BUILD'
                );
                if (!access.allowed) {
                  setPendingModuleAfterUnlock('MOD_D_PRODUCT_BUILD');
                  setPaywallModalFeature(
                    `Module D: Product & Build Vehicle — ${access.reason}`
                  );
                  return;
                }
                setSynthesisBanner(
                  '✅ Module C Customer Validation Surveys & Insights saved! Welcome to Module D (Step 1: Adaptive Product Vehicle).'
                );
                navigateToModuleWithHistory('MOD_D_PRODUCT_BUILD');
              }}
            />
          ) : activeModule === 'MOD_B_MARKET' ? (
            <ModuleBWorkspace
              key={currentPlan.id}
              plan={{
                ...currentPlan,
                conceptCanvas: effectiveCanvas,
              }}
              selectedCountry={selectedCountry}
              isVaultReadonly={activeEntitlement.isVaultReadonly}
              founderName={session.user.name}
              whiteLabelEnabled={activeEntitlement.whiteLabelExportEnabled}
              initialStep={moduleNavTarget?.step}
              highlightTarget={moduleNavTarget?.highlightTarget}
              onSaveStep1Beachhead={handleSaveModuleBStep1}
              onSaveStep2Competitors={handleSaveModuleBStep2}
              onScoutCompetitorsWithAi={handleScoutModuleBCompetitors}
              onSaveStep3MarketSizing={handleSaveModuleBStep3}
              onEstimateMarketSizingWithAi={handleEstimateModuleBMarketSizing}
              onSaveStep4CompetitiveWedge={handleSaveModuleBStep4}
              onGenerateCompetitiveEdgeWithAi={
                handleGenerateModuleBCompetitiveEdge
              }
              onSaveStep5Complete={handleSaveModuleBStep5}
              onParkQuestion={handleParkModuleBQuestion}
              onBackToModuleA={() => {
                navigateToModuleWithHistory('MOD_A_IDEATION', 8, 'module-a-step-8');
              }}
              onContinueToModuleC={() => {
                const modCAccess = canAccessModule(
                  activeEntitlement,
                  'MOD_C_SURVEYS_FEEDBACK'
                );
                if (!modCAccess.allowed) {
                  setPendingModuleAfterUnlock('MOD_C_SURVEYS_FEEDBACK');
                  setPaywallModalFeature(
                    `Module C: Customer Surveys, Feedback & Early Waitlist — ${modCAccess.reason}`
                  );
                  return;
                }
                navigateToModuleWithHistory('MOD_C_SURVEYS_FEEDBACK');
              }}
            />
          ) : (
            <>
              {/* Module A Top Header Banner (Matches Module B Top Tile Style) */}
              <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-950 via-indigo-900 to-violet-900 p-6 text-white shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="border-indigo-400/40 bg-indigo-500/30 text-indigo-100">
                        Module A • Ideation &amp; Founder Readiness
                      </Badge>
                      <Badge className="border-emerald-400/30 bg-emerald-500/20 text-emerald-200">
                        <Sparkles className="mr-1 h-3 w-3" />
                        Capture First, Expand Second
                      </Badge>
                    </div>
                    <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                      Module A: Ideation, Concept Canvas &amp; Founder Fit
                    </h1>
                    <p className="max-w-2xl text-xs text-indigo-100/90 sm:text-sm">
                      Capture your core idea for <strong className="text-white">{currentPlan.title}</strong>, shape a clean 1-page canvas, set your starting runway, and uncover your blind spots before spending a penny.
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setOpenStep((prev) => (prev === 'ALL' ? 0 : 'ALL'))
                        }
                        className="border-indigo-400/40 bg-white/10 text-xs text-white hover:bg-white/20"
                      >
                        {openStep === 'ALL'
                          ? 'Focus Step-by-Step'
                          : 'Expand All Steps'}
                      </Button>
                    </div>
                    <div className="text-right text-[11px] text-indigo-200">
                      Module A Progress:{' '}
                      <strong className="text-white">
                        {moduleAProgressPercent}%
                      </strong>{' '}
                      ({completedReadinessCount} of {totalReadinessStepsCount} Core Steps Ready)
                    </div>
                  </div>
                </div>

                {/* Progress Strip inside Module A Top Tile (7 steps default, 8 steps when in IE or GB) */}
                <div
                  className={`mt-5 grid grid-cols-2 gap-2 border-t border-indigo-800/70 pt-4 sm:grid-cols-4 ${
                    isGrantCheckerSupportedForCountry(selectedCountry)
                      ? 'lg:grid-cols-8'
                      : 'lg:grid-cols-7'
                  }`}
                >
                  {[
                    {
                      step: 'Step 1',
                      title: 'Idea Dump',
                      targetId: 'mod-a-step-1',
                      stepNum: 1,
                      done: moduleAReadinessSteps[0]?.isComplete ?? false,
                    },
                    {
                      step: 'Step 2',
                      title: 'Concept Canvas',
                      targetId: 'mod-a-step-2',
                      stepNum: 2,
                      done: moduleAReadinessSteps[1]?.isComplete ?? false,
                    },
                    {
                      step: 'Step 3',
                      title: 'Your "Why"',
                      targetId: 'mod-a-step-3',
                      stepNum: 3,
                      done: moduleAReadinessSteps[2]?.isComplete ?? false,
                    },
                    {
                      step: 'Step 4',
                      title: 'Team & Budget',
                      targetId: 'mod-a-step-4',
                      stepNum: 4,
                      done: moduleAReadinessSteps[3]?.isComplete ?? false,
                    },
                    {
                      step: 'Step 5',
                      title: 'Reality Check',
                      targetId: 'mod-a-step-5',
                      stepNum: 5,
                      done: moduleAReadinessSteps[4]?.isComplete ?? false,
                    },
                    {
                      step: 'Step 6',
                      title: 'Blind Spots',
                      targetId: 'mod-a-step-6',
                      stepNum: 6,
                      done: moduleAReadinessSteps[5]?.isComplete ?? false,
                    },
                    ...(isGrantCheckerSupported
                      ? [
                          {
                            step: 'Step 7',
                            title: 'Grant Checker',
                            targetId: 'mod-a-step-7',
                            stepNum: 7,
                            done: Boolean(grantEligibilityCheck?.lastCheckedAt),
                          },
                          {
                            step: 'Overview',
                            title: 'Startup Summary',
                            targetId: 'mod-a-step-8',
                            stepNum: 8,
                            done:
                              completedReadinessCount ===
                              totalReadinessStepsCount,
                          },
                        ]
                      : [
                          {
                            step: 'Overview',
                            title: 'Startup Summary',
                            targetId: 'mod-a-step-7',
                            stepNum: 7,
                            done:
                              completedReadinessCount ===
                              totalReadinessStepsCount,
                          },
                        ]),
                  ].map((item, idx, arr) => {
                    const firstIncompleteIdx = arr.findIndex((s) => !s.done);
                    const isStepOpen =
                      openStep === 'ALL'
                        ? (firstIncompleteIdx === -1
                            ? idx === arr.length - 1
                            : idx === firstIncompleteIdx)
                        : openStep === item.stepNum;
                    return (
                      <button
                        key={item.step}
                        type="button"
                        onClick={() => {
                          setOpenStep(item.stepNum);
                          setTimeout(() => {
                            const el = document.getElementById(item.targetId);
                            if (el) {
                              el.scrollIntoView({
                                behavior: 'smooth',
                                block: 'start',
                              });
                            }
                          }, 40);
                        }}
                        className={`rounded-xl border px-3 py-2 text-left text-xs transition-all hover:border-white/50 hover:bg-white/15 ${
                          isStepOpen
                            ? 'border-amber-300/80 bg-white/20 text-white shadow-xs ring-1 ring-amber-300/50'
                            : item.done
                              ? 'border-emerald-400/40 bg-emerald-950/30 text-emerald-100'
                              : 'border-indigo-800/60 bg-indigo-950/40 text-indigo-300/70'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span>{item.step}</span>
                          {item.done ? (
                            <Check className="h-3.5 w-3.5 text-emerald-300" />
                          ) : isStepOpen ? (
                            <span className="h-2 w-2 rounded-full bg-amber-400" />
                          ) : null}
                        </div>
                        <div className="mt-0.5 truncate text-[11px]">
                          {item.title}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STEP 1: RAW IDEA BRAIN DUMP CARD */}
              {openStep !== 'ALL' && openStep !== 1 ? (
                <div
                  id="mod-a-step-1"
                  onClick={() => setOpenStep(1)}
                  className="group scroll-mt-24 cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          moduleAReadinessSteps[0]?.isComplete
                            ? 'bg-emerald-600 text-white'
                            : 'bg-indigo-600 text-white'
                        }`}
                      >
                        {moduleAReadinessSteps[0]?.isComplete ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          '1'
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h2 className="truncate text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                            Step 1: Tell us your idea in your own words
                          </h2>
                          {moduleAReadinessSteps[0]?.isComplete ? (
                            <Badge variant="success" className="shrink-0 text-[10px]">
                              Completed
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="shrink-0 text-[10px] text-slate-600">
                              In Progress
                            </Badge>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {brainDumpText.trim().length >= 20
                            ? `"${brainDumpText.trim().slice(0, 90)}..."`
                            : 'Don’t worry about sounding polished. Write a rough sentence or two to kick off.'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 shrink-0 px-2.5 text-xs font-medium text-indigo-600 group-hover:bg-indigo-50"
                      >
                        <span>Edit Step</span>
                        <ChevronDown className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  id="mod-a-step-1"
                  className="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-6 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            moduleAReadinessSteps[0]?.isComplete
                              ? 'bg-emerald-600 text-white'
                              : 'bg-indigo-600 text-white'
                          }`}
                        >
                          {moduleAReadinessSteps[0]?.isComplete ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            '1'
                          )}
                        </span>
                        <h2 className="text-base font-bold text-slate-900">
                          Step 1: Tell us your idea in your own words ({currentPlan.title})
                        </h2>
                        <Badge variant="success" className="shrink-0">Plain English</Badge>
                      </div>
                      <p className="mt-1 text-xs text-slate-600">
                        Don&apos;t worry about sounding polished. Bullet points, rough notes, or a quick paragraph all work.
                      </p>
                    </div>

                    {openStep !== 'ALL' && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenStep(0);
                        }}
                        className="h-8 shrink-0 text-xs text-slate-500 hover:text-slate-900"
                      >
                        <span>Collapse Step</span>
                        <ChevronUp className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    )}
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
                        💡 Why this matters
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
                        📝 Example ({currentPlan.industryCategory})
                      </button>
                    </div>

                    {/* Inline Jargon Pill */}
                    <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                      <Info className="h-3.5 w-3.5 text-slate-400" />
                      <span>Value Proposition = Why someone pays you instead of doing nothing</span>
                    </div>
                  </div>

                  {/* Collapsible Micro-Coaching Card (Replaces Videos!) */}
                  {showWhyCard && (
                    <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/70 p-4 text-xs text-indigo-950">
                      <div className="font-bold text-indigo-900">
                        💡 Why this matters:
                      </div>
                      <p className="mt-1 leading-relaxed text-indigo-900/90">
                        Grant assessors (like your Local Enterprise Office or Innovate UK) and early customers want to know who is hurting today, what manual hacks they use, and how your solution saves them time or money. Keep it simple and direct.
                      </p>
                    </div>
                  )}

                  {/* Collapsible Industry Examples Card */}
                  {showExamples && (
                    <div className="mt-3 grid grid-cols-1 gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs md:grid-cols-3">
                      <div className="flex flex-col justify-between rounded-lg bg-white p-3 shadow-2xs">
                        <div>
                          <div className="font-bold text-emerald-800">
                            1. B2B / Software
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
                            2. Service / Agency
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
                          I&apos;m Stuck — 3 Simple Prompts
                        </button>
                      </div>
                    </div>

                    {/* "I'm Stuck" 3-Question Sub-Prompt Helper */}
                    {showImStuckHelper && (
                      <div className="mb-3 rounded-xl border border-violet-200 bg-violet-50/70 p-3.5 text-xs text-violet-950">
                        <div className="font-bold">
                          ✨ 3 Quick Questions to Unstick You:
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
                      placeholder="e.g. Independent plumbers waste 3 hours every Friday chasing unpaid invoices. Our WhatsApp tool sends 1-click payment links with automatic reminders..."
                      className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-sm leading-relaxed text-slate-900 shadow-2xs focus:border-indigo-600 focus:outline-none disabled:opacity-60"
                    />

                    {/* Step 1 Save Bar: Keep Founder's Exact Words */}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-xs text-slate-500">
                        💬 <strong>Your exact words are saved.</strong> We never overwrite what you write.
                      </div>
                      {!activeEntitlement.isVaultReadonly && (
                        <div className="flex flex-wrap items-center gap-2">
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
                          <Button
                            type="button"
                            size="sm"
                            disabled={isSavingCanvas}
                            onClick={() => {
                              handleSaveCanvasEdits();
                              setOpenStep(2);
                              setTimeout(() => {
                                const el = document.getElementById('mod-a-step-2');
                                if (el)
                                  el.scrollIntoView({
                                    behavior: 'smooth',
                                    block: 'start',
                                  });
                              }, 40);
                            }}
                            className="bg-indigo-600 text-white hover:bg-indigo-700"
                          >
                            Next: Concept Canvas
                            <ArrowRight className="ml-1 h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

          {/* STEP 2: FLESH OUT YOUR IDEA (USER-TYPED 5-BLOCK CONCEPT CANVAS + AI TIDY UP) */}
          {openStep !== 'ALL' && openStep !== 2 ? (
            <div
              id="mod-a-step-2"
              onClick={() => setOpenStep(2)}
              className="group scroll-mt-24 cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      filledCanvasBoxesCount === 5
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 text-white'
                    }`}
                  >
                    {filledCanvasBoxesCount === 5 ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      '2'
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                        Step 2: Your 1-Page Concept Canvas
                      </h2>
                      {moduleAReadinessSteps[1]?.isComplete ? (
                        <Badge variant="success" className="shrink-0 text-[10px]">
                          Completed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="shrink-0 text-[10px] text-slate-600">
                          In Progress
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {effectiveCanvas.coreProblem
                        ? `Problem: ${effectiveCanvas.coreProblem.slice(0, 80)}...`
                        : 'Define the problem, target customer, solution, unfair edge, and revenue model.'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 shrink-0 px-2.5 text-xs font-medium text-indigo-600 group-hover:bg-indigo-50"
                  >
                    <span>Edit Step</span>
                    <ChevronDown className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div
              id="mod-a-step-2"
              className="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-6 shadow-xs"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        filledCanvasBoxesCount === 5
                          ? 'bg-emerald-600 text-white'
                          : 'bg-indigo-600 text-white'
                      }`}
                    >
                      {filledCanvasBoxesCount === 5 ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        '2'
                      )}
                    </span>
                    <h2 className="text-base font-bold text-slate-900">
                      Step 2: Your 1-Page Concept Canvas
                    </h2>
                    <Badge variant="outline" className="shrink-0 border-indigo-200 bg-indigo-50/50 text-[10px] text-indigo-700">
                      {filledCanvasBoxesCount}/5 Boxes Filled
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    Shape your raw idea into 5 simple building blocks. Write in plain English or click <strong className="text-indigo-700">Tidy Up My Notes with AI</strong> anytime to polish your wording.
                  </p>
                </div>

                {openStep !== 'ALL' && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenStep(0);
                    }}
                    className="h-8 shrink-0 text-xs text-slate-500 hover:text-slate-900"
                  >
                    <span>Collapse Step</span>
                    <ChevronUp className="ml-1 h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              <div className="mt-5 space-y-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {/* Box 1: The Core Problem */}
                  <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                        1. What&apos;s broken today? (The Problem)
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">
                        What frustrating problem are people dealing with, and what does it cost them?
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
                      placeholder="e.g., Shop owners waste 3 hours every Friday checking expiry dates by hand..."
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs leading-relaxed text-slate-800 shadow-2xs focus:border-indigo-600 focus:outline-none disabled:opacity-60"
                    />
                  </div>

                  {/* Box 2: Target Customer / First Core Customer Group */}
                  <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                        2. Your First Core Customer Group (Who buys first?)
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Who is the very first type of customer you want to help in {countryPack.countryName}? (A &ldquo;Beachhead&rdquo; simply means the very first specific group of customers you focus on winning before expanding to everyone else.)
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
                      placeholder={`e.g., Independent grocers and convenience store owners in ${countryPack.countryName}...`}
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs leading-relaxed text-slate-800 shadow-2xs focus:border-indigo-600 focus:outline-none disabled:opacity-60"
                    />
                  </div>

                  {/* Box 3: Your Solution */}
                  <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                        3. How does your product fix it? (The Solution)
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">
                        In plain English, what does your product or service actually do? Promised Delivery &amp; Reply Speed — (SLA (Service Level Agreement) means how quickly you promise to deliver an order or reply when a customer has a problem.)
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
                      placeholder="e.g., A mobile app that scans shelf barcodes and automatically alerts staff 48 hours before items expire..."
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs leading-relaxed text-slate-800 shadow-2xs focus:border-indigo-600 focus:outline-none disabled:opacity-60"
                    />
                  </div>

                  {/* Box 4: Why You Win (Unfair Edge) */}
                  <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                        4. Why pick you? (Your Edge)
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Why will customers choose your idea over doing nothing or using spreadsheets?
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
                      placeholder="e.g., Takes 5 minutes to set up with zero hardware and works directly with their existing pos barcodes..."
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs leading-relaxed text-slate-800 shadow-2xs focus:border-indigo-600 focus:outline-none disabled:opacity-60"
                    />
                  </div>

                  {/* Box 5: How You Make Money & Grant Fit */}
                  <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 md:col-span-2 lg:col-span-2">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                        5. How will you charge? (Pricing &amp; Grants)
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Subscription, one-off price, commission? Any rough number in {countryPack.defaultCurrency} works!
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
                      placeholder={`e.g., Monthly subscription of ${formatPlanCurrency(99, countryPack.defaultCurrency)}/month per shop, plus exploring ${countryGrants[0]?.grantName || 'local startup grants'}...`}
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs leading-relaxed text-slate-800 shadow-2xs focus:border-indigo-600 focus:outline-none disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Step 2 Bottom Save & AI Tidy Up Bar */}
                {!activeEntitlement.isVaultReadonly && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3.5">
                    <div className="text-xs text-slate-500">
                      💡 Save your notes directly, or let Ask Preflight AI tidy up your wording without changing your meaning.
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
                        variant="outline"
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
                      <Button
                        type="button"
                        size="sm"
                        disabled={isSavingCanvas}
                        onClick={() => {
                          handleSaveCanvasEdits();
                          setOpenStep(3);
                          setTimeout(() => {
                            const el = document.getElementById('mod-a-step-3');
                            if (el)
                              el.scrollIntoView({
                                behavior: 'smooth',
                                block: 'start',
                              });
                          }, 40);
                        }}
                        className="bg-indigo-600 text-white hover:bg-indigo-700"
                      >
                        Next: Your &ldquo;Why&rdquo;
                        <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: YOUR PERSONAL "WHY" & AMBITION (FOUNDER MOTIVATION) */}
          {openStep !== 'ALL' && openStep !== 3 ? (
            <div
              id="mod-a-step-3"
              onClick={() => setOpenStep(3)}
              className="group scroll-mt-24 cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      moduleAReadinessSteps[2]?.isComplete
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 text-white'
                    }`}
                  >
                    {moduleAReadinessSteps[2]?.isComplete ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      '3'
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                        Step 3: Your Personal &ldquo;Why&rdquo; &amp; Ambition
                      </h2>
                      {moduleAReadinessSteps[2]?.isComplete ? (
                        <Badge variant="success" className="shrink-0 text-[10px]">
                          Completed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="shrink-0 text-[10px] text-slate-600">
                          In Progress
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {moduleAReadinessSteps[2]?.summary}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 shrink-0 px-2.5 text-xs font-medium text-indigo-600 group-hover:bg-indigo-50"
                  >
                    <span>Edit Step</span>
                    <ChevronDown className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div
              id="mod-a-step-3"
              className="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-6 shadow-xs"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        moduleAReadinessSteps[2]?.isComplete
                          ? 'bg-emerald-600 text-white'
                          : 'bg-indigo-600 text-white'
                      }`}
                    >
                      {moduleAReadinessSteps[2]?.isComplete ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        '3'
                      )}
                    </span>
                    <h2 className="text-base font-bold text-slate-900">
                      Step 3: Your Personal &ldquo;Why&rdquo; &amp; Ambition
                    </h2>
                    <Badge variant="success" className="shrink-0">Personalized</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    We adapt our coaching to match your personal goals — whether you want a steady side-income, freedom from your 9-to-5, or a fast-growing scaleup.
                  </p>
                </div>

                {openStep !== 'ALL' && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenStep(0);
                    }}
                    className="h-8 shrink-0 text-xs text-slate-500 hover:text-slate-900"
                  >
                    <span>Collapse Step</span>
                    <ChevronUp className="ml-1 h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              <div className="mt-5 space-y-5">
                {/* 1. Primary Motivation Cards */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    1. What is driving you to build this?
                  </label>
                  <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {(
                      [
                        {
                          id: 'LEAVE_JOB' as FounderMotivationType,
                          emoji: '💼',
                          title: 'Leave My 9-to-5 & Be My Own Boss',
                          subtitle:
                            'Replace my current income and build a sustainable business I own.',
                        },
                        {
                          id: 'SIDE_HUSTLE' as FounderMotivationType,
                          emoji: '🌙',
                          title: 'Build a Profitable Side Hustle',
                          subtitle:
                            'Keep my day job while creating an extra income stream on evenings & weekends.',
                        },
                        {
                          id: 'SAVE_THE_WORLD' as FounderMotivationType,
                          emoji: '🌍',
                          title: 'Solve a Problem I Care About',
                          subtitle:
                            'Fix a broken issue in my industry or community with real impact.',
                        },
                        {
                          id: 'SCALE_STARTUP' as FounderMotivationType,
                          emoji: '🚀',
                          title: 'Scale a High-Growth Startup',
                          subtitle:
                            'Build a fast-growing tech company, hire a team, and seek grants or investor funding.',
                        },
                        {
                          id: 'BUILD_TO_SELL' as FounderMotivationType,
                          emoji: '🏆',
                          title: 'Build to Sell',
                          subtitle:
                            'Create a systematised, valuable asset designed to be acquired.',
                        },
                        {
                          id: 'OTHER' as FounderMotivationType,
                          emoji: '✨',
                          title: 'Other (Custom Goal)',
                          subtitle:
                            'Describe your personal motivation in your own words below.',
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
                  {founderMotivation.primaryMotivation === 'OTHER' && (
                    <div className="mt-2.5 rounded-xl border border-indigo-200 bg-indigo-50/40 p-3">
                      <label className="block text-[11px] font-bold text-indigo-950">
                        ✨ Tell us what is driving you in your own words:
                      </label>
                      <input
                        type="text"
                        disabled={activeEntitlement.isVaultReadonly}
                        value={founderMotivation.otherMotivationText || ''}
                        onChange={(e) =>
                          setFounderMotivation({
                            ...founderMotivation,
                            otherMotivationText: e.target.value,
                          })
                        }
                        placeholder="e.g. Spinning out a tool we built internally, or creating a seasonal lifestyle business..."
                        className="mt-1.5 w-full rounded-lg border border-indigo-300 bg-white px-3 py-2 text-xs text-slate-800 shadow-2xs focus:border-indigo-600 focus:outline-none disabled:opacity-60"
                      />
                    </div>
                  )}
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
                        {
                          id: 'OTHER' as FounderWeeklyHours,
                          label: '✨ Other (Custom Schedule)',
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
                  {founderMotivation.weeklyHoursAvailable === 'OTHER' && (
                    <div className="mt-2.5 rounded-xl border border-indigo-200 bg-indigo-50/40 p-3">
                      <label className="block text-[11px] font-bold text-indigo-950">
                        ✨ Describe your weekly schedule or availability:
                      </label>
                      <input
                        type="text"
                        disabled={activeEntitlement.isVaultReadonly}
                        value={founderMotivation.otherWeeklyHoursText || ''}
                        onChange={(e) =>
                          setFounderMotivation({
                            ...founderMotivation,
                            otherWeeklyHoursText: e.target.value,
                          })
                        }
                        placeholder="e.g. 2 full days per week (Thurs/Fri), or seasonal sprints..."
                        className="mt-1.5 w-full rounded-lg border border-indigo-300 bg-white px-3 py-2 text-xs text-slate-800 shadow-2xs focus:border-indigo-600 focus:outline-none disabled:opacity-60"
                      />
                    </div>
                  )}
                </div>

                {/* 3. Personal 12-Month Success Vision */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    3. What does &ldquo;success&rdquo; look like 12 months from today?
                  </label>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Be honest with yourself — e.g., &ldquo;Making {formatPlanCurrency(4000, countryPack.defaultCurrency)}/month so I can hand in my notice&rdquo; or &ldquo;10 paying shops in {countryPack.countryName} using it weekly&rdquo;.
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
                    placeholder="e.g. Hit €4,000/month recurring revenue, or help 100 paying customers..."
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs leading-relaxed text-slate-800 shadow-2xs focus:border-indigo-600 focus:outline-none disabled:opacity-60"
                  />
                </div>

                {/* Step 3 Bottom Save Bar */}
                {!activeEntitlement.isVaultReadonly && (
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3.5">
                    <div className="text-xs text-slate-500">
                      🎯 Your ambition shapes how the AI co-pilot guides you across future modules.
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
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
                      <Button
                        size="sm"
                        disabled={isSavingCanvas}
                        onClick={() => {
                          handleSaveCanvasEdits();
                          setOpenStep(4);
                          setTimeout(() => {
                            const el = document.getElementById('mod-a-step-4');
                            if (el)
                              el.scrollIntoView({
                                behavior: 'smooth',
                                block: 'start',
                              });
                          }, 40);
                        }}
                        className="bg-indigo-600 text-white hover:bg-indigo-700"
                      >
                        Next: Team &amp; Budget
                        <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: YOUR TEAM & STARTING BUDGET (DAY-1 RESOURCES) */}
          {openStep !== 'ALL' && openStep !== 4 ? (
            <div
              id="mod-a-step-4"
              onClick={() => setOpenStep(4)}
              className="group scroll-mt-24 cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      moduleAReadinessSteps[3]?.isComplete
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 text-white'
                    }`}
                  >
                    {moduleAReadinessSteps[3]?.isComplete ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      '4'
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                        Step 4: Your Team &amp; Starting Budget
                      </h2>
                      {moduleAReadinessSteps[3]?.isComplete ? (
                        <Badge variant="success" className="shrink-0 text-[10px]">
                          Completed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="shrink-0 text-[10px] text-slate-600">
                          In Progress
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {moduleAReadinessSteps[3]?.summary}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 shrink-0 px-2.5 text-xs font-medium text-indigo-600 group-hover:bg-indigo-50"
                  >
                    <span>Edit Step</span>
                    <ChevronDown className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div
              id="mod-a-step-4"
              className="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-6 shadow-xs"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        moduleAReadinessSteps[3]?.isComplete
                          ? 'bg-emerald-600 text-white'
                          : 'bg-indigo-600 text-white'
                      }`}
                    >
                      {moduleAReadinessSteps[3]?.isComplete ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        '4'
                      )}
                    </span>
                    <h2 className="text-base font-bold text-slate-900">
                      Step 4: Your Team &amp; Starting Budget
                    </h2>
                    <Badge variant="secondary" className="shrink-0">Runway Guardrails</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    Knowing your team setup and savings helps us recommend the right MVP build scope and verify {countryPack.countryName} grant match-funding rules.
                  </p>
                </div>

                {openStep !== 'ALL' && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenStep(0);
                    }}
                    className="h-8 shrink-0 text-xs text-slate-500 hover:text-slate-900"
                  >
                    <span>Collapse Step</span>
                    <ChevronUp className="ml-1 h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              <div className="mt-5 space-y-5">
              {/* 1. Team Structure Cards */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  1. Who is building this right now?
                </label>
                <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {(
                    [
                      {
                        id: 'SOLO_FOUNDER' as PlanTeamStructureType,
                        emoji: '👤',
                        title: 'Flying Solo (100% Me)',
                        subtitle:
                          'Building, testing, and running this on my own for now.',
                      },
                      {
                        id: 'SEEKING_COFOUNDER' as PlanTeamStructureType,
                        emoji: '🤝',
                        title: 'Solo, Looking for Co-Founder',
                        subtitle:
                          'Starting alone today, but want a partner to share skills & workload.',
                      },
                      {
                        id: 'COFOUNDER_TEAM' as PlanTeamStructureType,
                        emoji: '👥',
                        title: 'Co-Founder Team (2+ Founders)',
                        subtitle:
                          'Splitting ownership and building the business together.',
                      },
                      {
                        id: 'SOLO_PLUS_CONTRACTORS' as PlanTeamStructureType,
                        emoji: '🛠️',
                        title: 'Solo + Freelancers / Agency',
                        subtitle:
                          'Solo owner, bringing in paid contractors or agencies for specific tasks.',
                      },
                      {
                        id: 'OTHER' as PlanTeamStructureType,
                        emoji: '✨',
                        title: 'Other (Custom Team)',
                        subtitle:
                          'Family business, university spin-out, or other structure.',
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
                {teamAndBudget.teamStructureType === 'OTHER' && (
                  <div className="mt-2.5 rounded-xl border border-indigo-200 bg-indigo-50/40 p-3">
                    <label className="block text-[11px] font-bold text-indigo-950">
                      ✨ Describe your team setup in your own words:
                    </label>
                    <input
                      type="text"
                      disabled={activeEntitlement.isVaultReadonly}
                      value={teamAndBudget.otherTeamStructureText || ''}
                      onChange={(e) =>
                        setTeamAndBudget({
                          ...teamAndBudget,
                          otherTeamStructureText: e.target.value,
                        })
                      }
                      placeholder="e.g. University research spin-out with 2 advisors, or part-time partnership..."
                      className="mt-1.5 w-full rounded-lg border border-indigo-300 bg-white px-3 py-2 text-xs text-slate-800 shadow-2xs focus:border-indigo-600 focus:outline-none disabled:opacity-60"
                    />
                  </div>
                )}

                {/* Micro-Coaching: Earning Co-Founder Shares Over Time (Reverse Vesting & Cliff) */}
                <div className="mt-2.5 rounded-xl border border-indigo-100 bg-indigo-50/40 p-3 text-xs text-indigo-950">
                  <div className="flex items-start gap-2">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                    <div>
                      <span className="font-semibold text-indigo-900">
                        Earning Co-Founder Shares Over Time (Protects Everyone If Someone Leaves Early)
                      </span>{' '}
                      — (Vesting means co-founders earn their shares month-by-month over 3–4 years (with a 12-month trial &ldquo;cliff&rdquo;) so nobody walks away after 3 months owning 50% of the company.)
                    </div>
                  </div>
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
                          '✅ Yes — We can build & deliver V1 ourselves',
                      },
                      {
                        id: 'PARTIAL_SKILLS' as TeamSkillCoverageType,
                        label:
                          '🧩 Mostly — Need help with tech or build',
                      },
                      {
                        id: 'NEED_EXTERNAL_BUILDER' as TeamSkillCoverageType,
                        label:
                          '🚨 No — Need a technical partner or agency',
                      },
                      {
                        id: 'OTHER' as TeamSkillCoverageType,
                        label: '✨ Other (Custom Skill Setup)',
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
                {teamAndBudget.skillCoverage === 'OTHER' && (
                  <div className="mt-2.5 rounded-xl border border-indigo-200 bg-indigo-50/40 p-3">
                    <label className="block text-[11px] font-bold text-indigo-950">
                      ✨ Describe your skill coverage or build arrangement:
                    </label>
                    <input
                      type="text"
                      disabled={activeEntitlement.isVaultReadonly}
                      value={teamAndBudget.otherSkillCoverageText || ''}
                      onChange={(e) =>
                        setTeamAndBudget({
                          ...teamAndBudget,
                          otherSkillCoverageText: e.target.value,
                        })
                      }
                      placeholder="e.g. Using no-code tools + our own consulting team, or partnering with a manufacturer..."
                      className="mt-1.5 w-full rounded-lg border border-indigo-300 bg-white px-3 py-2 text-xs text-slate-800 shadow-2xs focus:border-indigo-600 focus:outline-none disabled:opacity-60"
                    />
                  </div>
                )}
              </div>

              {/* 3. Starting Capital / Investment Buckets */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  3. How much starting money or savings do you have allocated? ({countryPack.defaultCurrency})
                </label>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Pick the range that feels realistic for your savings — we use this to protect your cashflow and check grant match-funding rules.
                </p>
                <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {(
                    [
                      {
                        id: 'ZERO_SWEAT_EQUITY' as StartingBudgetBracket,
                        emoji: '🌱',
                        amountLabel: `${formatPlanCurrency(0, countryPack.defaultCurrency)} (Sweat Equity)`,
                        subtitle:
                          'Bootstrapping with time, free tools, and customer pre-sales.',
                      },
                      {
                        id: 'UNDER_1K' as StartingBudgetBracket,
                        emoji: '☕',
                        amountLabel: `Under ${formatPlanCurrency(1000, countryPack.defaultCurrency)}`,
                        subtitle:
                          'Micro-budget for domain, no-code tools, and initial tests.',
                      },
                      {
                        id: '1K_TO_5K' as StartingBudgetBracket,
                        emoji: '🧱',
                        amountLabel: `${formatPlanCurrency(1000, countryPack.defaultCurrency)} – ${formatPlanCurrency(5000, countryPack.defaultCurrency)}`,
                        subtitle:
                          'Lean prototype, company registration, and initial customer outreach.',
                      },
                      {
                        id: '5K_TO_25K' as StartingBudgetBracket,
                        emoji: '🚀',
                        amountLabel: `${formatPlanCurrency(5000, countryPack.defaultCurrency)} – ${formatPlanCurrency(25000, countryPack.defaultCurrency)}`,
                        subtitle:
                          'Fund MVP build, equipment, or upfront grant match-funding.',
                      },
                      {
                        id: 'OVER_25K' as StartingBudgetBracket,
                        emoji: '🏦',
                        amountLabel: `${formatPlanCurrency(25000, countryPack.defaultCurrency)}+`,
                        subtitle:
                          'Well capitalized with personal savings or early backing ready to deploy.',
                      },
                      {
                        id: 'OTHER' as StartingBudgetBracket,
                        emoji: '✨',
                        amountLabel: 'Other (Custom Budget)',
                        subtitle:
                          'Grant voucher, cashflow from existing business, or other setup.',
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
                {teamAndBudget.startingBudgetBracket === 'OTHER' && (
                  <div className="mt-2.5 rounded-xl border border-emerald-200 bg-emerald-50/40 p-3">
                    <label className="block text-[11px] font-bold text-emerald-950">
                      ✨ Describe your starting budget or funding arrangement ({countryPack.defaultCurrency}):
                    </label>
                    <input
                      type="text"
                      disabled={activeEntitlement.isVaultReadonly}
                      value={teamAndBudget.otherBudgetText || ''}
                      onChange={(e) =>
                        setTeamAndBudget({
                          ...teamAndBudget,
                          otherBudgetText: e.target.value,
                        })
                      }
                      placeholder={`e.g. Funded out of cashflow from existing consultancy, or ${formatPlanCurrency(10000, countryPack.defaultCurrency)} voucher...`}
                      className="mt-1.5 w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs text-slate-800 shadow-2xs focus:border-emerald-600 focus:outline-none disabled:opacity-60"
                    />
                  </div>
                )}
              </div>

              {/* 4. Deeper Team & Funding Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  4. Extra Team &amp; Funding Notes (Optional)
                </label>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  e.g., &ldquo;I have 8 years in retail operations, looking for a technical co-founder&rdquo; or &ldquo;Putting in {formatPlanCurrency(3000, countryPack.defaultCurrency)} from savings and hoping to apply for {countryGrants[0]?.grantName || 'local grants'}&rdquo;.
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
                    🛡️ Your team setup and starting budget automatically update your blind-spot review below.
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
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
                    <Button
                      size="sm"
                      disabled={isSavingCanvas}
                      onClick={() => {
                        handleSaveCanvasEdits();
                        setOpenStep(5);
                        setTimeout(() => {
                          const el = document.getElementById('mod-a-step-5');
                          if (el)
                            el.scrollIntoView({
                              behavior: 'smooth',
                              block: 'start',
                            });
                        }, 40);
                      }}
                      className="bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      Next: Reality Check
                      <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
          )}

          {/* STEP 5: FOUNDER FIT, DEALBREAKERS & REALITY CHECK */}
          {openStep !== 'ALL' && openStep !== 5 ? (
            <div
              id="mod-a-step-5"
              onClick={() => setOpenStep(5)}
              className="group scroll-mt-24 cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      moduleAReadinessSteps[4]?.isComplete
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 text-white'
                    }`}
                  >
                    {moduleAReadinessSteps[4]?.isComplete ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      '5'
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                        Step 5: Founder Fit &amp; Reality Check
                      </h2>
                      {moduleAReadinessSteps[4]?.isComplete ? (
                        <Badge variant="success" className="shrink-0 text-[10px]">
                          Completed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="shrink-0 text-[10px] text-slate-600">
                          In Progress
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {moduleAReadinessSteps[4]?.summary}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 shrink-0 px-2.5 text-xs font-medium text-indigo-600 group-hover:bg-indigo-50"
                  >
                    <span>Edit Step</span>
                    <ChevronDown className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div
              id="mod-a-step-5"
              className="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-6 shadow-xs"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        moduleAReadinessSteps[4]?.isComplete
                          ? 'bg-emerald-600 text-white'
                          : 'bg-indigo-600 text-white'
                      }`}
                    >
                      {moduleAReadinessSteps[4]?.isComplete ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        '5'
                      )}
                    </span>
                    <h2 className="text-base font-bold text-slate-900">
                      Step 5: Founder Fit &amp; Reality Check
                    </h2>
                    <Badge variant="secondary" className="shrink-0">Protect Your Sanity</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    Let&apos;s make sure this business fits your real life — your warm network, personal income timeline, and lifestyle boundaries.
                  </p>
                </div>

                {openStep !== 'ALL' && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenStep(0);
                    }}
                    className="h-8 shrink-0 text-xs text-slate-500 hover:text-slate-900"
                  >
                    <span>Collapse Step</span>
                    <ChevronUp className="ml-1 h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              <div className="mt-5 space-y-5">
              {/* 1. Insider Advantage & Warm Contacts ("The Monday Morning Test") */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  1. The Monday Morning Test: How well do you know this industry?
                </label>
                <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {(
                    [
                      {
                        id: 'LIVED_IT_INSIDER' as IndustryConnectionLevel,
                        emoji: '🔑',
                        title: 'Industry Insider',
                        subtitle:
                          'I worked in this space or lived this exact problem — I know the jargon and buyers.',
                      },
                      {
                        id: 'WARM_CONNECTIONS' as IndustryConnectionLevel,
                        emoji: '🤝',
                        title: 'Warm Network',
                        subtitle:
                          'I can message 3–5 potential buyers on LinkedIn/WhatsApp for honest feedback.',
                      },
                      {
                        id: 'STARTING_COLD' as IndustryConnectionLevel,
                        emoji: '🧭',
                        title: 'Starting Cold',
                        subtitle:
                          'Spotted this opportunity from the outside; building my network from scratch.',
                      },
                      {
                        id: 'OTHER' as IndustryConnectionLevel,
                        emoji: '✨',
                        title: 'Other (Custom Access)',
                        subtitle:
                          'Trade body, partner network, co-founder network, or another setup.',
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
                {founderRealityCheck.industryConnection === 'OTHER' && (
                  <div className="mt-2.5 rounded-xl border border-indigo-200 bg-indigo-50/40 p-3">
                    <label className="block text-[11px] font-bold text-indigo-950">
                      ✨ Describe your connection to this industry or target buyers:
                    </label>
                    <input
                      type="text"
                      disabled={activeEntitlement.isVaultReadonly}
                      value={
                        founderRealityCheck.otherIndustryConnectionText || ''
                      }
                      onChange={(e) =>
                        setFounderRealityCheck({
                          ...founderRealityCheck,
                          otherIndustryConnectionText: e.target.value,
                        })
                      }
                      placeholder="e.g. My advisor runs a trade body, or we already serve an adjacent market..."
                      className="mt-1.5 w-full rounded-lg border border-indigo-300 bg-white px-3 py-2 text-xs text-slate-800 shadow-2xs focus:border-indigo-600 focus:outline-none disabled:opacity-60"
                    />
                  </div>
                )}
              </div>

              {/* 2. Personal Income Urgency */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  2. How soon do you need this business to pay you an income?
                </label>
                <div className="mt-2 flex flex-wrap gap-2.5">
                  {(
                    [
                      {
                        id: 'NO_RUSH_12M_PLUS' as PersonalIncomeUrgency,
                        label:
                          '🛡️ No Rush (12+ Months) — Covered by day job or savings',
                      },
                      {
                        id: 'MEDIUM_6_TO_12M' as PersonalIncomeUrgency,
                        label:
                          '⏳ Within 6–12 Months — Need steady progress to replace income',
                      },
                      {
                        id: 'URGENT_1_TO_3M' as PersonalIncomeUrgency,
                        label:
                          '⚡ Urgent (Within 1–3 Months) — Need fast customer cashflow now',
                      },
                      {
                        id: 'OTHER' as PersonalIncomeUrgency,
                        label: '✨ Other (Custom Timeline)',
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
                {founderRealityCheck.personalIncomeUrgency === 'OTHER' && (
                  <div className="mt-2.5 rounded-xl border border-indigo-200 bg-indigo-50/40 p-3">
                    <label className="block text-[11px] font-bold text-indigo-950">
                      ✨ Describe your personal income timeline:
                    </label>
                    <input
                      type="text"
                      disabled={activeEntitlement.isVaultReadonly}
                      value={founderRealityCheck.otherIncomeUrgencyText || ''}
                      onChange={(e) =>
                        setFounderRealityCheck({
                          ...founderRealityCheck,
                          otherIncomeUrgencyText: e.target.value,
                        })
                      }
                      placeholder="e.g. On Enterprise Allowance for 12 months, or reinvesting all profits for 2 years..."
                      className="mt-1.5 w-full rounded-lg border border-indigo-300 bg-white px-3 py-2 text-xs text-slate-800 shadow-2xs focus:border-indigo-600 focus:outline-none disabled:opacity-60"
                    />
                  </div>
                )}
              </div>

              {/* 3. Lifestyle Dealbreakers / Anti-Goals (Multi-Select) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  3. Your Dealbreakers: What do you REFUSE to do? (Select all that apply)
                </label>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Set your boundaries now so our AI never nudges you into a business model you hate running.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(
                    [
                      {
                        id: 'NO_BIG_TEAM' as FounderDealbreakerType,
                        label: '🚫 No big staff management',
                      },
                      {
                        id: 'NO_PHYSICAL_PREMISES' as FounderDealbreakerType,
                        label: '🚫 No physical shop / lease',
                      },
                      {
                        id: 'NO_COLD_SALES' as FounderDealbreakerType,
                        label: '🚫 No cold outbound calling',
                      },
                      {
                        id: 'NO_OUTSIDE_INVESTORS' as FounderDealbreakerType,
                        label: '🚫 No outside VC investors',
                      },
                      {
                        id: 'NO_WEEKEND_SUPPORT' as FounderDealbreakerType,
                        label: '🚫 No weekend 24/7 emergencies (Promised Delivery & Reply Speed)',
                      },
                      {
                        id: 'OTHER' as FounderDealbreakerType,
                        label: '✨ Other (Custom Boundary)',
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
                {founderRealityCheck.dealbreakers.includes('OTHER') && (
                  <div className="mt-2.5 rounded-xl border border-rose-200 bg-rose-50/40 p-3">
                    <label className="block text-[11px] font-bold text-rose-950">
                      ✨ Write any other boundaries or things you refuse to do:
                    </label>
                    <input
                      type="text"
                      disabled={activeEntitlement.isVaultReadonly}
                      value={founderRealityCheck.otherDealbreakerText || ''}
                      onChange={(e) =>
                        setFounderRealityCheck({
                          ...founderRealityCheck,
                          otherDealbreakerText: e.target.value,
                        })
                      }
                      placeholder="e.g. No international travel away from family, or no perishable inventory..."
                      className="mt-1.5 w-full rounded-lg border border-rose-300 bg-white px-3 py-2 text-xs text-slate-800 shadow-2xs focus:border-rose-600 focus:outline-none disabled:opacity-60"
                    />
                  </div>
                )}

                {/* Micro-Coaching: Promised Delivery & Reply Speed (SLA) */}
                <div className="mt-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-700">
                  <div className="flex items-start gap-2">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                    <div>
                      <span className="font-semibold text-slate-900">
                        Promised Delivery &amp; Reply Speed
                      </span>{' '}
                      — (SLA (Service Level Agreement) means how quickly you promise to deliver an order or reply when a customer has a problem.)
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Ownership, Grants & Control Trade-Off */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  4. Ownership &amp; Funding Philosophy
                </label>
                <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {(
                    [
                      {
                        id: 'BOOTSTRAP_100_CONTROL' as GrowthTradeoffPreference,
                        emoji: '👑',
                        title: '100% Bootstrap',
                        subtitle:
                          'Grow using customer revenue — keep full ownership and total freedom.',
                      },
                      {
                        id: 'NON_DILUTIVE_GRANTS' as GrowthTradeoffPreference,
                        emoji: '🏛️',
                        title: 'Customer Sales + Grants',
                        subtitle: `Keep equity while leveraging ${countryPack.countryName} state grants (${countryGrants[0]?.grantName || 'local enterprise support'}).`,
                      },
                      {
                        id: 'SHARE_EQUITY_COFOUNDER' as GrowthTradeoffPreference,
                        emoji: '🤝',
                        title: 'Co-Founder Partnership',
                        subtitle:
                          'Share equity with the right partner so I don’t carry the whole load alone. Earning Co-Founder Shares Over Time (Protects Everyone If Someone Leaves Early) — (Vesting means co-founders earn their shares month-by-month over 3–4 years (with a 12-month trial "cliff") so nobody walks away after 3 months owning 50% of the company.)',
                      },
                      {
                        id: 'RAISE_INVESTMENT' as GrowthTradeoffPreference,
                        emoji: '📈',
                        title: 'Open to Investors',
                        subtitle:
                          'Willing to trade equity for capital and mentorship to grow much faster.',
                      },
                      {
                        id: 'OTHER' as GrowthTradeoffPreference,
                        emoji: '✨',
                        title: 'Other (Custom View)',
                        subtitle:
                          'Revenue-share, community-owned, or still deciding.',
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
                {founderRealityCheck.growthTradeoff === 'OTHER' && (
                  <div className="mt-2.5 rounded-xl border border-indigo-200 bg-indigo-50/40 p-3">
                    <label className="block text-[11px] font-bold text-indigo-950">
                      ✨ Describe your ownership or funding preference:
                    </label>
                    <input
                      type="text"
                      disabled={activeEntitlement.isVaultReadonly}
                      value={founderRealityCheck.otherGrowthTradeoffText || ''}
                      onChange={(e) =>
                        setFounderRealityCheck({
                          ...founderRealityCheck,
                          otherGrowthTradeoffText: e.target.value,
                        })
                      }
                      placeholder="e.g. Open to strategic industry partner taking a minority stake, or revenue-based financing..."
                      className="mt-1.5 w-full rounded-lg border border-indigo-300 bg-white px-3 py-2 text-xs text-slate-800 shadow-2xs focus:border-indigo-600 focus:outline-none disabled:opacity-60"
                    />
                  </div>
                )}
              </div>

              {/* 5. Your #1 Secret Worry (Honest Gut-Check) */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    5. Honest Gut-Check: What is your #1 worry right now?
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
                        OTHER:
                          'Validate and de-risk my #1 custom worry with 5 target customers before committing major budget.',
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
                  Every founder has a worry. Naming it now lets us turn it into your #1 validation test in Module B.
                </p>
                <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {(
                    [
                      {
                        id: 'WILL_THEY_PAY' as BiggestWorryPreset,
                        emoji: '💳',
                        title: 'Will Anyone Actually Pay?',
                        subtitle:
                          'Will people buy or stick to free hacks & spreadsheets?',
                      },
                      {
                        id: 'FINDING_FIRST_10' as BiggestWorryPreset,
                        emoji: '📣',
                        title: 'Finding First 10 Customers',
                        subtitle:
                          'How to reach target buyers without burning cash on ads.',
                      },
                      {
                        id: 'HOW_TO_BUILD' as BiggestWorryPreset,
                        emoji: '🛠️',
                        title: 'How to Actually Build It',
                        subtitle:
                          'Worried the tech or build will cost too much.',
                      },
                      {
                        id: 'COMPETITION_OR_AI' as BiggestWorryPreset,
                        emoji: '🦈',
                        title: 'Big Competitors / AI Copycats',
                        subtitle:
                          'What stops existing tools or AI from copying this?',
                      },
                      {
                        id: 'TIME_AND_ENERGY' as BiggestWorryPreset,
                        emoji: '🔋',
                        title: 'Running Out of Time & Energy',
                        subtitle:
                          'Balancing this with work/life without burning out.',
                      },
                      {
                        id: 'OTHER' as BiggestWorryPreset,
                        emoji: '✨',
                        title: 'Other (Write Your Own Worry)',
                        subtitle:
                          'Something else is on my mind — write it below.',
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
                  placeholder="Optional: Tell us what worries you most or where you feel least confident..."
                  className="mt-2.5 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs leading-relaxed text-slate-800 shadow-2xs focus:border-indigo-600 focus:outline-none disabled:opacity-60"
                />
              </div>

              {/* Step 5 Bottom Save Bar */}
              {!activeEntitlement.isVaultReadonly && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3.5">
                  <div className="text-xs text-slate-500">
                    🧭 Your dealbreakers, income timeline, and #1 worry directly shape your Step 6 blind-spot review below.
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
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
                    <Button
                      size="sm"
                      disabled={isSavingCanvas}
                      onClick={() => {
                        handleSaveCanvasEdits();
                        setOpenStep(6);
                        setTimeout(() => {
                          const el = document.getElementById('mod-a-step-6');
                          if (el)
                            el.scrollIntoView({
                              behavior: 'smooth',
                              block: 'start',
                            });
                        }, 40);
                      }}
                      className="bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      Next: Blind Spots
                      <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
          )}

          {/* STEP 6: CONSTRUCTIVE "THINGS TO CONSIDER" BLIND-SPOT CARD */}
          {openStep !== 'ALL' && openStep !== 6 ? (
            <div
              id="mod-a-step-6"
              onClick={() => setOpenStep(6)}
              className="group scroll-mt-24 cursor-pointer rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50/50 via-white to-violet-50/40 p-4 shadow-xs transition-all hover:border-indigo-400 hover:shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      moduleAReadinessSteps[5]?.isComplete
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 text-white'
                    }`}
                  >
                    {moduleAReadinessSteps[5]?.isComplete ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      '6'
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                        Step 6: Blind-Spot Review (&ldquo;Things to Consider&rdquo;)
                      </h2>
                      {moduleAReadinessSteps[5]?.isComplete ? (
                        <Badge variant="success" className="shrink-0 text-[10px]">
                          Completed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="shrink-0 text-[10px] text-slate-600">
                          In Progress
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {moduleAReadinessSteps[5]?.summary}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 shrink-0 px-2.5 text-xs font-medium text-indigo-600 group-hover:bg-indigo-50"
                  >
                    <span>Edit Step</span>
                    <ChevronDown className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div
              id="mod-a-step-6"
              className="scroll-mt-24 rounded-xl border border-indigo-200 bg-white p-6 shadow-xs"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        moduleAReadinessSteps[5]?.isComplete
                          ? 'bg-emerald-600 text-white'
                          : 'bg-indigo-600 text-white'
                      }`}
                    >
                      {moduleAReadinessSteps[5]?.isComplete ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        '6'
                      )}
                    </span>
                    <h2 className="text-base font-bold text-slate-900">
                      Step 6: Blind-Spot Review (&ldquo;Things to Consider&rdquo;)
                    </h2>
                    <Badge variant="default" className="shrink-0">Co-Founder Perspective</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    Live co-founder check combining your idea, budget, and worry into constructive advice.
                  </p>
                </div>

                {openStep !== 'ALL' && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenStep(0);
                    }}
                    className="h-8 shrink-0 text-xs text-slate-500 hover:text-slate-900"
                  >
                    <span>Collapse Step</span>
                    <ChevronUp className="ml-1 h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              <div className="mt-5 space-y-5">
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
                    ✨ Change any option or add notes in Steps 1–5 above and watch these cards adapt immediately.
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
                    <Button
                      size="sm"
                      onClick={() => {
                        setOpenStep(7);
                        setTimeout(() => {
                          const el = document.getElementById('mod-a-step-7');
                          if (el)
                            el.scrollIntoView({
                              behavior: 'smooth',
                              block: 'start',
                            });
                        }, 40);
                      }}
                      className="bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      {isGrantCheckerSupported
                        ? 'Next: Step 7 — Check Grant Eligibility'
                        : 'View Startup Overview & Summary'}
                      <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 7: INSTANT GRANT & FUNDING ELIGIBILITY CHECKER       */}
          {/* (Only visible for supported regions: IE & GB)             */}
          {/* ========================================================= */}
          {isGrantCheckerSupported && (
            <ModuleAGrantCheckerStep
              isOpen={openStep === 'ALL' || openStep === 7}
              isAllExpanded={openStep === 'ALL'}
              onExpandStep={() => setOpenStep(7)}
              onCollapseStep={() => setOpenStep(6)}
              hqCountryCode={selectedCountry}
              planTitle={currentPlan.title}
              industryCategory={currentPlan.industryCategory}
              exportPotential={currentPlan.exportPotential}
              brainDumpText={brainDumpText}
              conceptCanvas={effectiveCanvas}
              founderMotivation={founderMotivation}
              teamAndBudget={teamAndBudget}
              founderRealityCheck={founderRealityCheck}
              grantCheck={grantEligibilityCheck}
              onChangeGrantCheck={(next) => setGrantEligibilityCheck(next)}
              onSaveGrantCheck={handleSaveCanvasEdits}
              isSaving={isSavingCanvas}
              onRunAiGrantPositioning={handleRunAiGrantPositioning}
              isRunningAiAdvisor={isRunningGrantAdvisor}
              onParkOpenQuestion={handleParkSpecificQuestion}
              onContinueToBrief={() => {
                setOpenStep(8);
                setTimeout(() => {
                  const el = document.getElementById('mod-a-step-8');
                  if (el) {
                    el.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start',
                    });
                  }
                }, 40);
              }}
              onContinueToModuleB={() => {
                const modBAccess = canAccessModule(
                  activeEntitlement,
                  'MOD_B_MARKET'
                );
                if (!modBAccess.allowed) {
                  setPendingModuleAfterUnlock('MOD_B_MARKET');
                  setPaywallModalFeature(
                    `Module B: Market Sizing, Competitor Scout & Buyer Persona (${modBAccess.reason})`
                  );
                  return;
                }
                navigateToModuleWithHistory('MOD_B_MARKET');
              }}
              onOpenModuleJGrantsHub={() => {
                const modKAccess = canAccessModule(
                  activeEntitlement,
                  'MOD_K_GRANTS_FUNDING'
                );
                if (!modKAccess.allowed) {
                  setPendingModuleAfterUnlock('MOD_K_GRANTS_FUNDING');
                  setPaywallModalFeature(
                    `Module K: Full Non-Dilutive Grants, Loans & Tax Relief Hub (${modKAccess.reason})`
                  );
                  return;
                }
                setActiveModule('MOD_K_GRANTS_FUNDING');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              isVaultReadonly={activeEntitlement.isVaultReadonly}
            />
          )}

          {/* ========================================================= */}
          {/* STARTUP OVERVIEW & SUMMARY BRIEF (LIVE DOCUMENT)          */}
          {/* ========================================================= */}
          {openStep !== 'ALL' && openStep !== briefStepNumber ? (
            <div
              id={briefStepId}
              onClick={() => setOpenStep(briefStepNumber)}
              className="group scroll-mt-24 cursor-pointer rounded-xl border border-indigo-200 bg-gradient-to-r from-white via-indigo-50/40 to-violet-50/40 p-4 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      completedReadinessCount === totalReadinessStepsCount
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 text-white'
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                        Startup Overview &amp; Summary Brief
                      </h2>
                      {completedReadinessCount === totalReadinessStepsCount ? (
                        <Badge variant="success" className="shrink-0 text-[10px]">
                          Ready to Export
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="shrink-0 text-[10px] text-slate-600">
                          {completedReadinessCount}/{totalReadinessStepsCount} Sections Ready
                        </Badge>
                      )}
                      {isGrantCheckerSupported && liveGrantEvaluation && (
                        <Badge variant="success" className="shrink-0 text-[10px]">
                          Includes {liveGrantEvaluation.qualifiesNowGrants.length} Qualified Grants ({liveGrantEvaluation.immediateQualifiedPoolFormatted})
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      Your complete Module A startup summary &amp; grant eligibility brief — ready to view, print to PDF, or share before starting Module B.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 shrink-0 px-2.5 text-xs font-medium text-indigo-600 group-hover:bg-indigo-50"
                  >
                    <span>Open Overview</span>
                    <ChevronDown className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div
              id={briefStepId}
              className="scroll-mt-24 rounded-xl border border-indigo-200 bg-white p-6 shadow-xs"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        completedReadinessCount === totalReadinessStepsCount
                          ? 'bg-emerald-600 text-white'
                          : 'bg-indigo-600 text-white'
                      }`}
                    >
                      <FileText className="h-3.5 w-3.5" />
                    </span>
                    <h2 className="text-base font-bold text-slate-900">
                      Startup Overview &amp; Summary Brief
                    </h2>
                    <Badge
                      variant={
                        completedReadinessCount === totalReadinessStepsCount
                          ? 'success'
                          : 'secondary'
                      }
                      className="shrink-0 text-[10px]"
                    >
                      {completedReadinessCount}/{totalReadinessStepsCount} Sections Ready
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    A live 1-page summary of your startup concept, founder profile, blind-spot review, and qualified grants — ready to download, print to PDF, or share with an advisor or co-founder.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBriefPreview(!showBriefPreview)}
                    className="h-8 shrink-0 border-indigo-200 text-xs text-indigo-700 hover:bg-indigo-50"
                  >
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    {showBriefPreview
                      ? 'Hide Document Preview'
                      : 'Show Document Preview'}
                  </Button>
                  {openStep !== 'ALL' && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenStep(0);
                      }}
                      className="h-8 shrink-0 text-xs text-slate-500 hover:text-slate-900"
                    >
                      <span>Collapse Overview</span>
                      <ChevronUp className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-5 space-y-5">
              {/* OPTION C: MODULE A READINESS CHECKLIST */}
              <div className="rounded-xl border border-indigo-100 bg-white p-4 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Module A Readiness Checklist (Steps 1–{totalReadinessStepsCount} Included in Your Brief)
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
                          : 'Startup Preflight • Startup Concept & Readiness Brief'}
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
                            {founderMotivation.primaryMotivation === 'OTHER' &&
                            founderMotivation.otherMotivationText?.trim()
                              ? `✨ Other: ${founderMotivation.otherMotivationText.trim()}`
                              : MOTIVATION_LABELS[
                                  founderMotivation.primaryMotivation
                                ]}
                          </div>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200/70">
                          <div className="text-[10px] font-bold uppercase text-slate-400">
                            Weekly Bandwidth
                          </div>
                          <div className="mt-1 font-semibold text-slate-900">
                            {founderMotivation.weeklyHoursAvailable ===
                              'OTHER' &&
                            founderMotivation.otherWeeklyHoursText?.trim()
                              ? `✨ Other: ${founderMotivation.otherWeeklyHoursText.trim()}`
                              : WEEKLY_HOURS_LABELS[
                                  founderMotivation.weeklyHoursAvailable
                                ]}
                          </div>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200/70">
                          <div className="text-[10px] font-bold uppercase text-slate-400">
                            Team &amp; Version 1 Skills
                          </div>
                          <div className="mt-1 font-semibold text-slate-900">
                            {teamAndBudget.teamStructureType === 'OTHER' &&
                            teamAndBudget.otherTeamStructureText?.trim()
                              ? `✨ Other: ${teamAndBudget.otherTeamStructureText.trim()}`
                              : TEAM_STRUCTURE_LABELS[
                                  teamAndBudget.teamStructureType
                                ]}
                          </div>
                          <div className="mt-0.5 text-[11px] text-slate-600">
                            {teamAndBudget.skillCoverage === 'OTHER' &&
                            teamAndBudget.otherSkillCoverageText?.trim()
                              ? `✨ Other: ${teamAndBudget.otherSkillCoverageText.trim()}`
                              : SKILL_COVERAGE_LABELS[
                                  teamAndBudget.skillCoverage
                                ]}
                          </div>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200/70">
                          <div className="text-[10px] font-bold uppercase text-slate-400">
                            Starting Cash Budget
                          </div>
                          <div className="mt-1 font-semibold text-emerald-800">
                            {formatStartingBudgetBracket(
                              teamAndBudget.startingBudgetBracket,
                              countryPack.defaultCurrency,
                              teamAndBudget.otherBudgetText
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
                            {founderRealityCheck.industryConnection ===
                              'OTHER' &&
                            founderRealityCheck.otherIndustryConnectionText?.trim()
                              ? `✨ Other: ${founderRealityCheck.otherIndustryConnectionText.trim()}`
                              : INDUSTRY_CONNECTION_LABELS[
                                  founderRealityCheck.industryConnection
                                ]}
                          </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 p-3">
                          <div className="text-[10px] font-bold uppercase text-slate-400">
                            Personal Income Timeline
                          </div>
                          <div className="mt-1 font-medium text-slate-800">
                            {founderRealityCheck.personalIncomeUrgency ===
                              'OTHER' &&
                            founderRealityCheck.otherIncomeUrgencyText?.trim()
                              ? `✨ Other: ${founderRealityCheck.otherIncomeUrgencyText.trim()}`
                              : INCOME_URGENCY_LABELS[
                                  founderRealityCheck.personalIncomeUrgency
                                ]}
                          </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 p-3">
                          <div className="text-[10px] font-bold uppercase text-slate-400">
                            Control vs. Speed Trade-Off
                          </div>
                          <div className="mt-1 font-medium text-slate-800">
                            {founderRealityCheck.growthTradeoff === 'OTHER' &&
                            founderRealityCheck.otherGrowthTradeoffText?.trim()
                              ? `✨ Other: ${founderRealityCheck.otherGrowthTradeoffText.trim()}`
                              : GROWTH_TRADEOFF_LABELS[
                                  founderRealityCheck.growthTradeoff
                                ]}
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
                            {db === 'OTHER' &&
                            founderRealityCheck.otherDealbreakerText?.trim()
                              ? `✨ Other: ${founderRealityCheck.otherDealbreakerText.trim()}`
                              : DEALBREAKER_LABELS[db]}
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
                    <div className="py-5">
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

                    {/* Section 5: Grants & Non-Dilutive Funding You Qualify For Right Now (Step 7 — IE & GB) */}
                    {isGrantCheckerSupported && liveGrantEvaluation && (
                      <div className="pt-5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                            5. Grants &amp; Non-Dilutive Funding You Qualify For Right Now (Step 7)
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-900">
                              🟢 Qualified Now Pool: {liveGrantEvaluation.immediateQualifiedPoolFormatted}
                            </span>
                            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
                              🟡 Phase 2 Unlockable: {liveGrantEvaluation.unlockableScalePoolFormatted}
                            </span>
                          </div>
                        </div>

                        {!grantEligibilityCheck?.lastCheckedAt && (
                          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-3.5 py-2.5 text-xs text-amber-950">
                            <span>
                              💡 <strong>Tip:</strong> Want to lock in your exact legal entity, PAYE tax history, and regional match rate? Run the 4-question pop-out check in Step 7.
                            </span>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setOpenStep(7);
                                setTimeout(() => {
                                  const el = document.getElementById('mod-a-step-7');
                                  if (el) {
                                    el.scrollIntoView({
                                      behavior: 'smooth',
                                      block: 'start',
                                    });
                                  }
                                }, 40);
                              }}
                              className="h-7 border-amber-300 bg-white text-[11px] font-semibold text-amber-900 hover:bg-amber-100"
                            >
                              Open Step 7 Grant Checker
                            </Button>
                          </div>
                        )}

                        <div className="mt-3">
                          <div className="text-xs font-bold text-emerald-900">
                            🟢 Grants &amp; Supports You Qualify For Right Now ({liveGrantEvaluation.qualifiesNowGrants.length} Schemes)
                          </div>
                          <div className="mt-2 grid grid-cols-1 gap-2.5 md:grid-cols-2">
                            {liveGrantEvaluation.qualifiesNowGrants.map((grant) => (
                              <div
                                key={grant.slug}
                                className="flex flex-col justify-between rounded-xl border border-emerald-200 bg-emerald-50/35 p-3.5"
                              >
                                <div>
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                                      Qualifies Now
                                    </span>
                                    <span className="rounded-md border border-emerald-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-emerald-900">
                                      {grant.fundingTypeBadge}
                                    </span>
                                  </div>
                                  <div className="mt-1.5 text-sm font-bold leading-snug text-slate-900">
                                    {grant.grantName}
                                  </div>
                                  <div className="mt-0.5 text-[11px] font-medium text-slate-500">
                                    {grant.providerAgency}
                                  </div>
                                  <div className="mt-2 rounded-lg border border-emerald-200/90 bg-emerald-100/75 px-2.5 py-1.5 text-[11px] font-extrabold leading-snug text-emerald-950 break-words">
                                    💰 {grant.potentialValueFormatted}
                                  </div>
                                  <p className="mt-2 text-[11px] leading-relaxed text-slate-700">
                                    <strong className="text-slate-900">Why you qualify: </strong>
                                    {grant.whyYouMatchOrMiss}
                                  </p>
                                </div>
                                <p className="mt-2 border-t border-emerald-200/60 pt-1.5 text-[11px] leading-relaxed text-emerald-900">
                                  <strong>Match / Co-Funding Rule: </strong>
                                  {grant.coFundingOrMatchRequirement}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {liveGrantEvaluation.unlockableNextGrants.length > 0 && (
                          <div className="mt-3.5">
                            <div className="text-xs font-bold text-amber-900">
                              🟡 Phase 2 Scale Schemes (Unlockable Next — Up to {liveGrantEvaluation.unlockableScalePoolFormatted})
                            </div>
                            <div className="mt-2 grid grid-cols-1 gap-2.5 md:grid-cols-2">
                              {liveGrantEvaluation.unlockableNextGrants.map((grant) => (
                                <div
                                  key={grant.slug}
                                  className="flex flex-col justify-between rounded-xl border border-amber-200/80 bg-amber-50/30 p-3"
                                >
                                  <div>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                                        Phase 2 Unlockable
                                      </span>
                                      <span className="rounded-md border border-amber-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-amber-900">
                                        {grant.fundingTypeBadge}
                                      </span>
                                    </div>
                                    <div className="mt-1.5 text-sm font-bold leading-snug text-slate-900">
                                      {grant.grantName}
                                    </div>
                                    <div className="mt-0.5 text-[11px] font-medium text-slate-500">
                                      {grant.providerAgency}
                                    </div>
                                    <div className="mt-2 rounded-lg border border-amber-200/90 bg-amber-100/75 px-2.5 py-1.5 text-[11px] font-bold leading-snug text-amber-950 break-words">
                                      🎯 {grant.potentialValueFormatted}
                                    </div>
                                  </div>
                                  {grant.unlockRequirement && (
                                    <p className="mt-2 border-t border-amber-200/60 pt-1.5 text-[11px] leading-relaxed text-amber-950">
                                      <strong>🔑 Unlock Milestone: </strong>
                                      {grant.unlockRequirement}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {((grantEligibilityCheck?.aiGrantPositioningAdvice &&
                          grantEligibilityCheck.aiGrantPositioningAdvice.length > 0) ||
                          liveGrantEvaluation.strategicPositioningTips.length > 0) && (
                          <div className="mt-3.5 rounded-xl border border-indigo-100 bg-indigo-50/40 p-3">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-900">
                              ✨ Grant Positioning Strategy for Evaluators
                            </div>
                            <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[11px] text-slate-700">
                              {(grantEligibilityCheck?.aiGrantPositioningAdvice &&
                              grantEligibilityCheck.aiGrantPositioningAdvice.length > 0
                                ? grantEligibilityCheck.aiGrantPositioningAdvice
                                : liveGrantEvaluation.strategicPositioningTips
                              ).map((tip, idx) => (
                                <li key={idx}>{tip}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 8 BOTTOM ACTION BAR: DOWNLOAD, PRINT TO PDF, OR COPY BRIEF */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-200 bg-white px-4 py-3.5 shadow-2xs">
                <div className="text-xs text-slate-600">
                  📥 <strong>Take your Concept &amp; Grant Readiness Brief with you:</strong>{' '}
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
                  Continue to <strong>Module B</strong> to map your Target
                  Customer Persona, run the AI Competitor Scout, calculate
                  Bottom-Up Market Sizing (TAM/SAM/SOM), and unlock{' '}
                  <strong>Module C</strong> (<code>/v/{currentPlan.moduleCData?.surveys?.[0]?.publicSlug || 'my-startup'}</code>{' '}
                  Surveys &amp; 1-on-1 Interviews).
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      const modBAccess = canAccessModule(
                        activeEntitlement,
                        'MOD_B_MARKET'
                      );
                      if (!modBAccess.allowed) {
                        setPendingModuleAfterUnlock('MOD_B_MARKET');
                        setPaywallModalFeature(
                          `Module B: Market Sizing, Competitor Scout & Buyer Persona (${modBAccess.reason})`
                        );
                        return;
                      }
                      navigateToModuleWithHistory('MOD_B_MARKET');
                    }}
                    className="bg-indigo-500 text-white hover:bg-indigo-400"
                  >
                    Continue to Module B
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          )}
          </>
          )}
        </main>
      </div>

      {/* Clean Production Footer */}
      <footer className="mt-12 border-t border-slate-200 bg-white text-slate-500 no-print print:hidden">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5 text-xs">
          <div className="flex items-center gap-2">
            <PreflightMark size={16} />
            <span className="font-semibold text-slate-800">
              Startup Preflight
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
      {/* LAYER 2: SLIDE-OUT "ASK PREFLIGHT AI" SIDEKICK DRAWER     */}
      {/* ========================================================= */}
      {askUnicornOpen && (
        <div className="fixed bottom-3 left-3 right-3 z-40 rounded-2xl border border-indigo-200 bg-white shadow-2xl sm:bottom-5 sm:left-auto sm:right-5 sm:w-96 no-print print:hidden">
          <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <div>
                <div className="text-xs font-bold">
                  Ask Preflight AI (Co-Founder AI)
                </div>
                <div className="text-[10px] text-indigo-100">
                  Context: {currentPlan.title} •{' '}
                  {activeModule === 'MOD_A_IDEATION'
                    ? 'Module A (Ideation)'
                    : activeModule === 'MOD_B_MARKET'
                      ? 'Module B (Market & Competitors)'
                      : activeModule === 'MOD_C_SURVEYS_FEEDBACK'
                        ? 'Module C (Surveys & Interviews)'
                        : 'Module D (Product & Build Vehicle)'}{' '}
                  • {selectedCountry}
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
              {countryPack.countryName} • {countryPack.defaultCurrency}) in{' '}
              <strong>
                {activeModule === 'MOD_A_IDEATION'
                  ? 'Module A: Ideation & Founder Fit'
                  : activeModule === 'MOD_B_MARKET'
                    ? 'Module B: Market & Competitors'
                    : activeModule === 'MOD_C_SURVEYS_FEEDBACK'
                      ? 'Module C: Customer Surveys & Interviews'
                      : 'Module D: Product & Build Vehicle'}
              </strong>
              .{' '}
              {activeModule === 'MOD_A_IDEATION'
                ? 'Want me to suggest a sharper way to quantify your customer pain point or park a pricing question for later?'
                : activeModule === 'MOD_B_MARKET'
                  ? 'Focus on your First Core Customer Group (Who buys first?) — (A "Beachhead" simply means the very first specific group of customers you focus on winning before expanding to everyone else.)—and don’t forget to include the "Do Nothing / Spreadsheets" status quo in your competitor list!'
                  : activeModule === 'MOD_C_SURVEYS_FEEDBACK'
                    ? 'Keep your survey & interview questions focused on past behaviour and real workarounds ("The Mom Test") rather than asking if people like your idea.'
                    : 'Choose the Product Track that matches what your buyer actually receives so every downstream question stays 100% relevant to your business model.'}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {activeModule === 'MOD_A_IDEATION' && (
                <button
                  type="button"
                  onClick={() =>
                    setBrainDumpText(
                      brainDumpText +
                        '\n\n[Preflight AI Suggestion]: Highlight how much money or time the customer loses every single week before buying your solution.'
                    )
                  }
                  className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 font-medium text-indigo-700 hover:bg-indigo-100"
                >
                  ✨ Quantify weekly customer pain
                </button>
              )}
              {activeModule === 'MOD_B_MARKET' && (
                <button
                  type="button"
                  onClick={() =>
                    handleParkSpecificQuestion(
                      `Verify bottom-up target customer count & annual spend in ${countryPack.countryName} (${countryPack.defaultCurrency}) with 3 industry buyers.`
                    )
                  }
                  className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 font-medium text-indigo-700 hover:bg-indigo-100"
                >
                  📌 Park TAM/SAM/SOM check
                </button>
              )}
              {activeModule === 'MOD_C_SURVEYS_FEEDBACK' && (
                <button
                  type="button"
                  onClick={() =>
                    handleParkSpecificQuestion(
                      `Follow up with our first 5 waitlist leads & interview respondents to test V1 feature priorities in Module D.`
                    )
                  }
                  className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 font-medium text-indigo-700 hover:bg-indigo-100"
                >
                  📌 Park Waitlist follow-up for Module D
                </button>
              )}
              {activeModule === 'MOD_D_PRODUCT_BUILD' && (
                <button
                  type="button"
                  onClick={() =>
                    handleParkSpecificQuestion(
                      `Verify V1 unit cost / hosting stack or supplier minimums before locking pricing in Module G.`
                    )
                  }
                  className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 font-medium text-indigo-700 hover:bg-indigo-100"
                >
                  📌 Park V1 Cost &amp; Supplier Check
                </button>
              )}
              <button
                type="button"
                onClick={handleParkQuestion}
                className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 font-medium text-amber-800 hover:bg-amber-100"
              >
                📌 Park pricing question for Module F
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PAYWALL / UPGRADE MODAL (WHEN CLICKING LOCKED FEATURES)   */}
      {/* ========================================================= */}
      {paywallModalFeature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs no-print print:hidden">
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
                    Module A is 100% free. Upgrade to unlock Modules B–I &amp;
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

            {stripeCheckoutError && (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                {stripeCheckoutError}
              </div>
            )}

            <div className="mt-4 space-y-2.5 text-xs">
              <div className="rounded-xl border-2 border-indigo-500 bg-indigo-50/80 p-3.5 shadow-xs">
                <div className="flex items-center justify-between font-bold text-indigo-950">
                  <span className="text-sm">6-Month Co-Founder Pass</span>
                  <span className="rounded-md bg-indigo-600 px-2 py-0.5 text-xs font-semibold text-white">
                    {countryPack.defaultCurrency === 'GBP' ? '£169' : '€199'}
                  </span>
                </div>
                <p className="mt-1 text-indigo-900/90 text-[11px] leading-relaxed">
                  3 Startup Plans • 3 Co-Founder Seats • Full Modules A–L • Module F Awkward Questions Alignment • 500 AI Credits/mo.
                </p>
                <div className="mt-3">
                  <Button
                    size="sm"
                    className="w-full bg-indigo-600 font-semibold text-white hover:bg-indigo-700"
                    disabled={isRedirectingToStripe}
                    onClick={async () => {
                      setIsRedirectingToStripe(true);
                      setStripeCheckoutError(null);
                      const res = await createStripeCheckoutSessionAction({
                        planType: 'SIX_MONTH_COFOUNDER',
                        currency: (countryPack.defaultCurrency as any) || 'EUR',
                        planId: currentPlan?.id,
                      });
                      if (res.success && res.url) {
                        window.location.href = res.url;
                      } else {
                        setIsRedirectingToStripe(false);
                        setStripeCheckoutError(
                          res.error || 'Failed to initialize Stripe checkout.'
                        );
                      }
                    }}
                  >
                    {isRedirectingToStripe ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Connecting to Stripe...
                      </>
                    ) : (
                      <>
                        Purchase Co-Founder Pass
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>6-Month Solo Pass</span>
                  <span className="text-xs font-semibold text-slate-700">
                    {countryPack.defaultCurrency === 'GBP' ? '£109' : '€129'}
                  </span>
                </div>
                <p className="mt-1 text-slate-600 text-[11px]">
                  1 Active Startup Plan • 1 Seat • Full Modules A–L • 250 AI Credits/mo.
                </p>
                <div className="mt-2.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs font-medium"
                    disabled={isRedirectingToStripe}
                    onClick={async () => {
                      setIsRedirectingToStripe(true);
                      setStripeCheckoutError(null);
                      const res = await createStripeCheckoutSessionAction({
                        planType: 'SIX_MONTH_SOLO',
                        currency: (countryPack.defaultCurrency as any) || 'EUR',
                        planId: currentPlan?.id,
                      });
                      if (res.success && res.url) {
                        window.location.href = res.url;
                      } else {
                        setIsRedirectingToStripe(false);
                        setStripeCheckoutError(
                          res.error || 'Failed to initialize Stripe checkout.'
                        );
                      }
                    }}
                  >
                    Purchase Solo Pass
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>
                    {activeEntitlement.planType === 'APPSUMO_LTD'
                      ? 'Stack Another AppSumo Voucher?'
                      : 'Have a Cohort or Partner Voucher?'}
                  </span>
                  <Ticket className="h-4 w-4 text-amber-600" />
                </div>
                <p className="mt-1 text-slate-600 text-[11px]">
                  {activeEntitlement.planType === 'APPSUMO_LTD'
                    ? 'Stack an additional AppSumo code to unlock more Startup Plans, team seats, and AI credits.'
                    : 'Already have a university, accelerator, or partner voucher code?'}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Link href="/redeem" className="flex-1">
                    <Button variant="ghost" size="sm" className="w-full text-xs text-indigo-600 hover:bg-indigo-50">
                      Redeem Voucher Code →
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-[10px] text-slate-400">
                Encrypted via Stripe 256-bit SSL
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPaywallModalFeature(null)}
                className="text-xs text-slate-500"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DELETE PLAN CONFIRMATION MODAL                            */}
      {/* ========================================================= */}
      {planToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs no-print print:hidden">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Delete Startup Plan?
                  </h3>
                  <p className="text-xs text-slate-500">
                    This action will permanently remove this plan and its module data.
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isDeletingPlan}
                onClick={() => {
                  setPlanToDelete(null);
                  setDeletePlanError(null);
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-red-100 bg-red-50/70 p-3.5 text-xs text-red-950">
              <p className="font-semibold text-red-900">
                Are you sure you want to delete &ldquo;{planToDelete.title}&rdquo;?
              </p>
              <p className="mt-1 text-[11px] text-red-700">
                All associated ideation canvas, customer surveys, financial models, and research in this plan will be permanently deleted.
              </p>
            </div>

            {deletePlanError && (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                {deletePlanError}
              </div>
            )}

            <div className="mt-5 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isDeletingPlan}
                onClick={() => {
                  setPlanToDelete(null);
                  setDeletePlanError(null);
                }}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isDeletingPlan}
                onClick={handleConfirmDeletePlan}
                className="bg-red-600 text-xs font-semibold text-white hover:bg-red-700 shadow-xs"
              >
                {isDeletingPlan ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Delete Plan
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
