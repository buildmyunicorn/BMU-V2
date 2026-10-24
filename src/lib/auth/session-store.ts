'use client';

import {
  calculateAppSumoTierLimits,
  calculatePassLimits,
  type EntitlementSnapshot,
} from '@/lib/entitlements';
import {
  getCountryRulePack,
  type SupportedCountryCode,
} from '@/lib/localization';
import type { StartupHat, BlindSpotItem } from '@/db/schema';

export type FounderMotivationType =
  | 'LEAVE_JOB'
  | 'SIDE_HUSTLE'
  | 'SAVE_THE_WORLD'
  | 'SCALE_STARTUP'
  | 'BUILD_TO_SELL';

export type FounderWeeklyHours =
  | '5_TO_10_HRS'
  | '15_TO_25_HRS'
  | '40_PLUS_HRS';

export interface SavedFounderMotivation {
  primaryMotivation: FounderMotivationType;
  weeklyHoursAvailable: FounderWeeklyHours;
  twelveMonthSuccessVision: string;
}

export type PlanTeamStructureType =
  | 'SOLO_FOUNDER'
  | 'SEEKING_COFOUNDER'
  | 'COFOUNDER_TEAM'
  | 'SOLO_PLUS_CONTRACTORS';

export type TeamSkillCoverageType =
  | 'BUILD_IN_HOUSE'
  | 'PARTIAL_SKILLS'
  | 'NEED_EXTERNAL_BUILDER';

export type StartingBudgetBracket =
  | 'ZERO_SWEAT_EQUITY'
  | 'UNDER_1K'
  | '1K_TO_5K'
  | '5K_TO_25K'
  | 'OVER_25K';

export interface SavedTeamAndBudget {
  teamStructureType: PlanTeamStructureType;
  skillCoverage: TeamSkillCoverageType;
  startingBudgetBracket: StartingBudgetBracket;
  teamAndFundingNotes: string;
}

export type IndustryConnectionLevel =
  | 'LIVED_IT_INSIDER'
  | 'WARM_CONNECTIONS'
  | 'STARTING_COLD';

export type PersonalIncomeUrgency =
  | 'NO_RUSH_12M_PLUS'
  | 'MEDIUM_6_TO_12M'
  | 'URGENT_1_TO_3M';

export type FounderDealbreakerType =
  | 'NO_BIG_TEAM'
  | 'NO_PHYSICAL_PREMISES'
  | 'NO_COLD_SALES'
  | 'NO_OUTSIDE_INVESTORS'
  | 'NO_WEEKEND_SUPPORT';

export type GrowthTradeoffPreference =
  | 'BOOTSTRAP_100_CONTROL'
  | 'SHARE_EQUITY_COFOUNDER'
  | 'NON_DILUTIVE_GRANTS'
  | 'RAISE_INVESTMENT';

export type BiggestWorryPreset =
  | 'WILL_THEY_PAY'
  | 'HOW_TO_BUILD'
  | 'FINDING_FIRST_10'
  | 'COMPETITION_OR_AI'
  | 'TIME_AND_ENERGY';

export interface SavedFounderRealityCheck {
  industryConnection: IndustryConnectionLevel;
  personalIncomeUrgency: PersonalIncomeUrgency;
  dealbreakers: FounderDealbreakerType[];
  growthTradeoff: GrowthTradeoffPreference;
  biggestWorryPreset: BiggestWorryPreset;
  biggestWorryNotes: string;
}

export interface SavedConceptCanvas {
  coreProblem: string;
  targetCustomer: string;
  proposedSolution: string;
  unfairAdvantage: string;
  revenueAndGrantFit: string;
  lastSynthesizedAt?: string;
  aiEngineUsed?: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export type BuyerModelType =
  | 'B2B_BUSINESSES'
  | 'B2C_CONSUMERS'
  | 'TWO_SIDED_MARKETPLACE'
  | 'B2G_PUBLIC_SECTOR';

export type EndUserVsDecisionMakerType =
  | 'SAME_PERSON'
  | 'DIFFERENT_DECISION_MAKER';

export type BuyingTriggerPreset =
  | 'LOSING_MONEY_WASTE'
  | 'MANUAL_TIME_BOTTLENECK'
  | 'COMPLIANCE_OR_PENALTY'
  | 'LOST_CUSTOMERS_CHURN'
  | 'LIFE_OR_BUSINESS_MILESTONE';

export interface BeachheadMarketData {
  buyerType: BuyerModelType;
  buyerTypes?: BuyerModelType[];
  beachheadSegment: string;
  endUserVsDecisionMaker: EndUserVsDecisionMakerType;
  decisionMakerRole: string;
  buyingTriggerPreset: BuyingTriggerPreset;
  buyingTriggerNotes: string;
  targetMarketsArray: string[];
  lastSavedAt?: string;
}

export type CustomerWorkaroundType =
  | 'SPREADSHEETS_PAPER'
  | 'WHATSAPP_EMAIL_PHONE'
  | 'FREE_GENERIC_TOOLS'
  | 'EXPENSIVE_CONSULTANTS_AGENCIES'
  | 'DOING_NOTHING_LIVING_WITH_PAIN';

export type CompetitorCategoryType =
  | 'DIRECT_COMPETITOR'
  | 'INDIRECT_ALTERNATIVE'
  | 'MANUAL_SERVICE_AGENCY';

export interface CompetitorEntry {
  id: string;
  name: string;
  category: CompetitorCategoryType;
  typicalPriceText: string;
  whatTheyDoWell: string;
  whereTheyFallShort: string;
}

export type WhySwitchEdgeType =
  | 'SAVES_TIME_AUTOMATIC'
  | 'MORE_AFFORDABLE'
  | 'BUILT_FOR_LOCAL_MARKET'
  | 'EASIER_NO_TRAINING'
  | 'ALL_IN_ONE_WORKFLOW'
  | 'PROVEN_RESULTS_OR_COMPLIANCE';

export interface CompetitorsAndStatusQuoData {
  currentWorkarounds: CustomerWorkaroundType[];
  workaroundFrustrationNotes: string;
  competitors: CompetitorEntry[];
  whySwitchEdges: WhySwitchEdgeType[];
  whySwitchOneSentence: string;
  lastSavedAt?: string;
  aiEngineUsed?: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export interface SavedModuleBData {
  beachhead?: BeachheadMarketData;
  competitorsAndStatusQuo?: CompetitorsAndStatusQuoData;
  thingsToConsider?: BlindSpotItem[];
}

export type FounderStage =
  | 'IDEA_EXPLORER'
  | 'BUILDING_MVP'
  | 'LAUNCHED_SEEKING_FUNDING'
  | 'ACCELERATOR_COHORT';

export type TeamStructure = 'SOLO' | 'CO_FOUNDERS' | 'LOOKING_FOR_COFOUNDER';

export type IndustryCategory =
  | 'B2B SaaS / AI App'
  | 'Consumer App / Marketplace'
  | 'E-Commerce / Physical Product / Food & Drink'
  | 'Service / Agency / Consulting'
  | 'Hardware / MedTech / DeepTech'
  | 'Brick & Mortar / Hospitality / Local Business';

export interface ActiveUserProfile {
  id: string;
  name: string;
  email: string;
  role: 'FOUNDER' | 'MENTOR' | 'TENANT_ADMIN' | 'SUPER_ADMIN';
  founderStage?: FounderStage;
  teamStructure?: TeamStructure;
  primaryHat?: StartupHat;
  regionOrCounty?: string;
  cohortCode?: string;
  onboardingCompleted: boolean;
}

export interface ActiveStartupPlan {
  id: string;
  title: string;
  oneLinerSummary: string;
  industryCategory: IndustryCategory;
  hqCountryCode: SupportedCountryCode;
  baseCurrency: string;
  targetMarketsArray: string[];
  exportPotential: 'DOMESTIC_ONLY' | 'EXPORTING_INTERNATIONALLY';
  currentModuleStep: string;
  isPivot?: boolean;
  brainDumpText?: string;
  conceptCanvas?: SavedConceptCanvas;
  founderMotivation?: SavedFounderMotivation;
  teamAndBudget?: SavedTeamAndBudget;
  founderRealityCheck?: SavedFounderRealityCheck;
  thingsToConsider?: BlindSpotItem[];
  moduleBData?: SavedModuleBData;
  openQuestions: string[];
}

export interface BmuLocalSession {
  user: ActiveUserProfile;
  entitlement: EntitlementSnapshot;
  redeemedCodes: string[];
  plans: ActiveStartupPlan[];
  activePlanId: string;
}

const STORAGE_KEY = 'bmu_v2_session_state_v1';

export function getDefaultDemoSession(): BmuLocalSession {
  const limits = calculatePassLimits('FREE_HOOK');
  return {
    user: {
      id: 'user-aoife-1',
      name: 'Aoife Brennan',
      email: 'founder@buildmyunicorn.com',
      role: 'FOUNDER',
      founderStage: 'IDEA_EXPLORER',
      teamStructure: 'SOLO',
      primaryHat: 'PRODUCT_TECH',
      regionOrCounty: 'Dublin',
      onboardingCompleted: true,
    },
    entitlement: {
      userId: 'user-aoife-1',
      planType: 'FREE_HOOK',
      stackedCodesCount: 0,
      maxStartupPlans: limits.maxStartupPlans,
      maxSeatsPerPlan: limits.maxSeatsPerPlan,
      monthlyAiCreditsLimit: limits.monthlyAiCreditsLimit,
      aiCreditsUsedThisMonth: 8,
      whiteLabelExportEnabled: false,
      isVaultReadonly: false,
    },
    redeemedCodes: [],
    plans: [
      {
        id: 'plan-greencart-1',
        title: 'My Startup Plan',
        oneLinerSummary: '',
        industryCategory: 'B2B SaaS / AI App',
        hqCountryCode: 'IE',
        baseCurrency: 'EUR',
        targetMarketsArray: ['IE'],
        exportPotential: 'DOMESTIC_ONLY',
        currentModuleStep: 'MOD_A_STEP_1',
        brainDumpText: '',
        openQuestions: [],
      },
    ],
    activePlanId: 'plan-greencart-1',
  };
}

export function loadBmuSession(): BmuLocalSession {
  if (typeof window === 'undefined') {
    return getDefaultDemoSession();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return getDefaultDemoSession();
    }
    const parsed = JSON.parse(raw) as BmuLocalSession;
    if (parsed.entitlement.accessExpiresAt) {
      parsed.entitlement.accessExpiresAt = new Date(
        parsed.entitlement.accessExpiresAt
      );
    }
    return parsed;
  } catch {
    return getDefaultDemoSession();
  }
}

export function saveBmuSession(session: BmuLocalSession): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function registerNewFounderSession(params: {
  name: string;
  email: string;
  voucherOrCohortCode?: string;
}): BmuLocalSession {
  const userId = `user-${Date.now()}`;
  const cleanCode = params.voucherOrCohortCode?.trim().toUpperCase() || '';

  let entitlement: EntitlementSnapshot;
  const redeemedCodes: string[] = [];

  if (cleanCode.startsWith('SUMO-')) {
    const sumo = calculateAppSumoTierLimits(1);
    redeemedCodes.push(cleanCode);
    entitlement = {
      userId,
      planType: 'APPSUMO_LTD',
      stackedCodesCount: 1,
      maxStartupPlans: sumo.maxStartupPlans,
      maxSeatsPerPlan: sumo.maxSeatsPerPlan,
      monthlyAiCreditsLimit: sumo.monthlyAiCreditsLimit,
      aiCreditsUsedThisMonth: 0,
      whiteLabelExportEnabled: sumo.whiteLabelExportEnabled,
      isVaultReadonly: false,
    };
  } else if (cleanCode.startsWith('BMU-')) {
    const cohortLimits = calculatePassLimits('COHORT_PASS', 6);
    redeemedCodes.push(cleanCode);
    entitlement = {
      userId,
      planType: 'COHORT_PASS',
      stackedCodesCount: 0,
      maxStartupPlans: cohortLimits.maxStartupPlans,
      maxSeatsPerPlan: cohortLimits.maxSeatsPerPlan,
      monthlyAiCreditsLimit: cohortLimits.monthlyAiCreditsLimit,
      aiCreditsUsedThisMonth: 0,
      whiteLabelExportEnabled: false,
      accessExpiresAt: cohortLimits.accessExpiresAt,
      isVaultReadonly: false,
    };
  } else {
    const freeLimits = calculatePassLimits('FREE_HOOK');
    entitlement = {
      userId,
      planType: 'FREE_HOOK',
      stackedCodesCount: 0,
      maxStartupPlans: freeLimits.maxStartupPlans,
      maxSeatsPerPlan: freeLimits.maxSeatsPerPlan,
      monthlyAiCreditsLimit: freeLimits.monthlyAiCreditsLimit,
      aiCreditsUsedThisMonth: 0,
      whiteLabelExportEnabled: false,
      isVaultReadonly: false,
    };
  }

  const newSession: BmuLocalSession = {
    user: {
      id: userId,
      name: params.name.trim() || 'New Founder',
      email: params.email.trim().toLowerCase(),
      role: 'FOUNDER',
      cohortCode: cleanCode.startsWith('BMU-') ? cleanCode : undefined,
      onboardingCompleted: false,
    },
    entitlement,
    redeemedCodes,
    plans: [],
    activePlanId: '',
  };

  saveBmuSession(newSession);
  return newSession;
}

export function completeFounderOnboarding(params: {
  founderStage: FounderStage;
  teamStructure: TeamStructure;
  primaryHat: StartupHat;
  regionOrCounty: string;
  planTitle: string;
  oneLinerSummary: string;
  hqCountryCode: SupportedCountryCode;
  industryCategory: IndustryCategory;
  exportPotential: 'DOMESTIC_ONLY' | 'EXPORTING_INTERNATIONALLY';
}): BmuLocalSession {
  const current = loadBmuSession();
  const countryPack = getCountryRulePack(params.hqCountryCode);
  const planId = `plan-${Date.now()}`;

  const targetMarkets =
    params.exportPotential === 'EXPORTING_INTERNATIONALLY'
      ? [params.hqCountryCode, 'GB', 'EU', 'US']
      : [params.hqCountryCode];

  const initialTeamType: PlanTeamStructureType =
    params.teamStructure === 'CO_FOUNDERS'
      ? 'COFOUNDER_TEAM'
      : params.teamStructure === 'LOOKING_FOR_COFOUNDER'
        ? 'SEEKING_COFOUNDER'
        : 'SOLO_FOUNDER';

  const firstPlan: ActiveStartupPlan = {
    id: planId,
    title: params.planTitle.trim() || 'My First Unicorn Idea',
    oneLinerSummary: params.oneLinerSummary.trim(),
    industryCategory: params.industryCategory,
    hqCountryCode: params.hqCountryCode,
    baseCurrency: countryPack.defaultCurrency,
    targetMarketsArray: Array.from(new Set(targetMarkets)),
    exportPotential: params.exportPotential,
    currentModuleStep: 'MOD_A_STEP_1',
    brainDumpText: params.oneLinerSummary.trim(),
    teamAndBudget: {
      teamStructureType: initialTeamType,
      skillCoverage: 'BUILD_IN_HOUSE',
      startingBudgetBracket: '1K_TO_5K',
      teamAndFundingNotes: '',
    },
    openQuestions: [],
  };

  const updated: BmuLocalSession = {
    ...current,
    user: {
      ...current.user,
      founderStage: params.founderStage,
      teamStructure: params.teamStructure,
      primaryHat: params.primaryHat,
      regionOrCounty: params.regionOrCounty,
      onboardingCompleted: true,
    },
    plans: [firstPlan, ...current.plans],
    activePlanId: firstPlan.id,
  };

  saveBmuSession(updated);
  return updated;
}
