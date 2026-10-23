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

export interface SavedConceptCanvas {
  coreProblem: string;
  targetCustomer: string;
  proposedSolution: string;
  unfairAdvantage: string;
  revenueAndGrantFit: string;
  lastSynthesizedAt?: string;
  aiEngineUsed?: 'gemini-2.5-flash' | 'smart-synthesizer';
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
  thingsToConsider?: BlindSpotItem[];
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
        title: 'GreenCart AI — Zero-Waste Grocery',
        oneLinerSummary:
          'Automated expiry prediction & dynamic markdowns for independent supermarkets.',
        industryCategory: 'B2B SaaS / AI App',
        hqCountryCode: 'IE',
        baseCurrency: 'EUR',
        targetMarketsArray: ['IE', 'GB'],
        exportPotential: 'EXPORTING_INTERNATIONALLY',
        currentModuleStep: 'MOD_A_STEP_1',
        brainDumpText:
          'Independent grocery stores throw away 4–6% of fresh produce every week because staff manually walk the aisles with sticker guns too late in the evening. GreenCart AI connects to their inventory system, predicts which fresh items will expire 72 hours early, and pushes automatic markdowns to electronic shelf labels and local wholesale buyers.',
        openQuestions: [
          'Verify if independent supermarkets in Ireland use Oracle Micros or custom POS systems.',
        ],
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

  const firstPlan: ActiveStartupPlan = {
    id: planId,
    title: params.planTitle.trim() || 'My First Unicorn Idea',
    oneLinerSummary:
      params.oneLinerSummary.trim() ||
      `Building a ${params.industryCategory} startup headquartered in ${countryPack.countryName}.`,
    industryCategory: params.industryCategory,
    hqCountryCode: params.hqCountryCode,
    baseCurrency: countryPack.defaultCurrency,
    targetMarketsArray: Array.from(new Set(targetMarkets)),
    exportPotential: params.exportPotential,
    currentModuleStep: 'MOD_A_STEP_1',
    brainDumpText: params.oneLinerSummary.trim() || '',
    openQuestions: [
      `Validate urgent buyer pain points with 5 target customers in ${countryPack.countryName}.`,
    ],
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
