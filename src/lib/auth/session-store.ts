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
  | 'BUILD_TO_SELL'
  | 'OTHER';

export type FounderWeeklyHours =
  | '5_TO_10_HRS'
  | '15_TO_25_HRS'
  | '40_PLUS_HRS'
  | 'OTHER';

export interface SavedFounderMotivation {
  primaryMotivation: FounderMotivationType;
  otherMotivationText?: string;
  weeklyHoursAvailable: FounderWeeklyHours;
  otherWeeklyHoursText?: string;
  twelveMonthSuccessVision: string;
}

export type PlanTeamStructureType =
  | 'SOLO_FOUNDER'
  | 'SEEKING_COFOUNDER'
  | 'COFOUNDER_TEAM'
  | 'SOLO_PLUS_CONTRACTORS'
  | 'OTHER';

export type TeamSkillCoverageType =
  | 'BUILD_IN_HOUSE'
  | 'PARTIAL_SKILLS'
  | 'NEED_EXTERNAL_BUILDER'
  | 'OTHER';

export type StartingBudgetBracket =
  | 'ZERO_SWEAT_EQUITY'
  | 'UNDER_1K'
  | '1K_TO_5K'
  | '5K_TO_25K'
  | 'OVER_25K'
  | 'OTHER';

export interface SavedTeamAndBudget {
  teamStructureType: PlanTeamStructureType;
  otherTeamStructureText?: string;
  skillCoverage: TeamSkillCoverageType;
  otherSkillCoverageText?: string;
  startingBudgetBracket: StartingBudgetBracket;
  otherStartingBudgetText?: string;
  otherBudgetText?: string;
  teamAndFundingNotes: string;
}

export type IndustryConnectionLevel =
  | 'LIVED_IT_INSIDER'
  | 'WARM_CONNECTIONS'
  | 'STARTING_COLD'
  | 'OTHER';

export type PersonalIncomeUrgency =
  | 'NO_RUSH_12M_PLUS'
  | 'MEDIUM_6_TO_12M'
  | 'URGENT_1_TO_3M'
  | 'OTHER';

export type FounderDealbreakerType =
  | 'NO_BIG_TEAM'
  | 'NO_PHYSICAL_PREMISES'
  | 'NO_COLD_SALES'
  | 'NO_OUTSIDE_INVESTORS'
  | 'NO_WEEKEND_SUPPORT'
  | 'OTHER';

export type GrowthTradeoffPreference =
  | 'BOOTSTRAP_100_CONTROL'
  | 'SHARE_EQUITY_COFOUNDER'
  | 'NON_DILUTIVE_GRANTS'
  | 'RAISE_INVESTMENT'
  | 'OTHER';

export type BiggestWorryPreset =
  | 'WILL_THEY_PAY'
  | 'HOW_TO_BUILD'
  | 'FINDING_FIRST_10'
  | 'COMPETITION_OR_AI'
  | 'TIME_AND_ENERGY'
  | 'OTHER';

export interface SavedFounderRealityCheck {
  industryConnection: IndustryConnectionLevel;
  otherIndustryConnectionText?: string;
  personalIncomeUrgency: PersonalIncomeUrgency;
  otherIncomeUrgencyText?: string;
  dealbreakers: FounderDealbreakerType[];
  otherDealbreakerText?: string;
  growthTradeoff: GrowthTradeoffPreference;
  otherGrowthTradeoffText?: string;
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
  | 'B2G_PUBLIC_SECTOR'
  | 'OTHER';

export type EndUserVsDecisionMakerType =
  | 'SAME_PERSON'
  | 'DIFFERENT_DECISION_MAKER'
  | 'OTHER';

export type BuyingTriggerPreset =
  | 'LOSING_MONEY_WASTE'
  | 'MANUAL_TIME_BOTTLENECK'
  | 'COMPLIANCE_OR_PENALTY'
  | 'LOST_CUSTOMERS_CHURN'
  | 'LIFE_OR_BUSINESS_MILESTONE'
  | 'OTHER';

export interface BeachheadMarketData {
  buyerType: BuyerModelType;
  buyerTypes?: BuyerModelType[];
  otherBuyerModelText?: string;
  beachheadSegment: string;
  endUserVsDecisionMaker: EndUserVsDecisionMakerType;
  otherDecisionMakerSetupText?: string;
  decisionMakerRole: string;
  buyingTriggerPreset: BuyingTriggerPreset;
  otherBuyingTriggerText?: string;
  buyingTriggerNotes: string;
  targetMarketsArray: string[];
  otherTargetMarketsText?: string;
  otherGeographyText?: string;
  lastSavedAt?: string;
}

export type CustomerWorkaroundType =
  | 'SPREADSHEETS_PAPER'
  | 'WHATSAPP_EMAIL_PHONE'
  | 'FREE_GENERIC_TOOLS'
  | 'EXPENSIVE_CONSULTANTS_AGENCIES'
  | 'DOING_NOTHING_LIVING_WITH_PAIN'
  | 'OTHER';

export type CompetitorCategoryType =
  | 'DIRECT_COMPETITOR'
  | 'INDIRECT_ALTERNATIVE'
  | 'MANUAL_SERVICE_AGENCY'
  | 'OTHER';

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
  | 'PROVEN_RESULTS_OR_COMPLIANCE'
  | 'OTHER';

export interface CompetitorsAndStatusQuoData {
  currentWorkarounds: CustomerWorkaroundType[];
  otherWorkaroundText?: string;
  workaroundFrustrationNotes: string;
  competitors: CompetitorEntry[];
  whySwitchEdges: WhySwitchEdgeType[];
  otherWhySwitchEdgeText?: string;
  whySwitchOneSentence: string;
  lastSavedAt?: string;
  aiEngineUsed?: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export type CustomerBillingCadence =
  | 'YEARLY_OR_ONE_OFF'
  | 'MONTHLY_SUBSCRIPTION'
  | 'OTHER';

export interface MarketSizingSegmentEntry {
  id: string;
  segmentName: string;
  billingCadence: CustomerBillingCadence;
  otherBillingCadenceText?: string;
  pricePerCustomerInput: string;
  year1To2CustomerGoalInput: string;
  reachableCustomersInTargetMarketsInput: string;
}

export type WiderMarketScalePreset = '3X' | '5X' | '10X' | '20X' | 'OTHER';

export interface MarketSizingData {
  segments: MarketSizingSegmentEntry[];
  widerMarketMultiplier: WiderMarketScalePreset;
  otherWiderMarketScaleText?: string;
  sourceAndAssumptionNotes: string;
  lastSavedAt?: string;
  aiEngineUsed?: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export type ComparisonScoreLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface CompetitiveComparisonRow {
  rowId: string;
  label: string;
  isYourStartup?: boolean;
  priceValueScore: ComparisonScoreLevel;
  speedTimeSavedScore: ComparisonScoreLevel;
  easeOfUseScore: ComparisonScoreLevel;
  specialistQualityScore: ComparisonScoreLevel;
}

export type SwitchingFrictionReducerType =
  | 'FREE_TRIAL_OR_FIRST_STEP'
  | 'WORKS_WITH_EXISTING_TOOLS'
  | 'FAST_SETUP_UNDER_15_MINS'
  | 'DONE_FOR_YOU_MIGRATION'
  | 'IMMEDIATE_COST_SAVING'
  | 'NO_LONG_CONTRACT'
  | 'OTHER';

export type UnfairAdvantageMoatType =
  | 'FOUNDER_INSIDER_EXPERIENCE'
  | 'PROPRIETARY_DATA_OR_TEMPLATES'
  | 'LOCAL_COMPLIANCE_OR_GRANTS'
  | 'COMMUNITY_OR_NETWORK_EFFECTS'
  | 'WORKFLOW_HABIT_LOCK_IN'
  | 'EXCLUSIVE_PARTNERSHIPS_OR_ACCREDITATION'
  | 'OTHER';

export interface CompetitiveWedgeData {
  comparisonRows: CompetitiveComparisonRow[];
  switchingFrictionReducers: SwitchingFrictionReducerType[];
  otherSwitchingFrictionText?: string;
  switchingFrictionPlanNotes: string;
  unfairAdvantages: UnfairAdvantageMoatType[];
  otherUnfairAdvantageText?: string;
  competitiveEdgeSummary: string;
  lastSavedAt?: string;
  aiEngineUsed?: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export interface SavedModuleBData {
  beachhead?: BeachheadMarketData;
  competitorsAndStatusQuo?: CompetitorsAndStatusQuoData;
  marketSizing?: MarketSizingData;
  competitiveWedge?: CompetitiveWedgeData;
  thingsToConsider?: BlindSpotItem[];
}

export type SurveyQuestionType =
  | 'MULTIPLE_CHOICE'
  | 'MULTI_SELECT'
  | 'SCALE_1_5'
  | 'OPEN_TEXT';

export type SurveyFocusAreaType =
  | 'PROBLEM_AND_PAIN'
  | 'CURRENT_WORKAROUNDS'
  | 'PAST_SPENDING_BUDGET'
  | 'WORKFLOW_AND_HABITS'
  | 'FEATURE_PRIORITIES'
  | 'OTHER';

export interface SurveyQuestionItem {
  id: string;
  questionText: string;
  type: SurveyQuestionType;
  options?: string[];
  allowOther?: boolean;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
  momTestPassed: boolean;
  momTestFeedback?: string;
  momTestSuggestedRewrite?: string;
}

export interface SurveyResponseAnswerValue {
  selectedOption?: string;
  selectedOptions?: string[];
  otherText?: string;
  scaleValue?: number;
  openText?: string;
}

export interface SavedSurveyResponse {
  id: string;
  surveyId: string;
  answers: Record<string, SurveyResponseAnswerValue>;
  respondentNameOrRole?: string;
  respondentEmail?: string;
  joinedWaitlist: boolean;
  isSimulated?: boolean;
  clientResponseId?: string;
  submittedAt: string;
}

const RESPONSE_UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Produces a canonical signature for a survey response that is invariant to
 * PostgreSQL `jsonb` key sorting vs JavaScript insertion order.
 */
export function getCanonicalResponseSignature(r: SavedSurveyResponse): string {
  const answersObj = r.answers || {};
  const sortedQuestionKeys = Object.keys(answersObj).sort();
  const normalizedAnswers: Record<string, Record<string, unknown>> = {};

  for (const qId of sortedQuestionKeys) {
    const val = answersObj[qId];
    if (!val) continue;
    const entry: Record<string, unknown> = {};
    if (val.selectedOption !== undefined) {
      entry.selectedOption = val.selectedOption;
    }
    if (Array.isArray(val.selectedOptions) && val.selectedOptions.length > 0) {
      entry.selectedOptions = [...val.selectedOptions].sort();
    }
    if (val.otherText !== undefined && val.otherText.trim() !== '') {
      entry.otherText = val.otherText.trim();
    }
    if (typeof val.scaleValue === 'number') {
      entry.scaleValue = val.scaleValue;
    }
    if (val.openText !== undefined && val.openText.trim() !== '') {
      entry.openText = val.openText.trim();
    }
    normalizedAnswers[qId] = entry;
  }

  const emailKey = (r.respondentEmail || '').trim().toLowerCase();
  const nameKey = (r.respondentNameOrRole || '').trim().toLowerCase();
  const simKey = Boolean(r.isSimulated) ? 'sim' : 'real';

  return `${simKey}::${emailKey}::${nameKey}::${JSON.stringify(normalizedAnswers)}`;
}

/**
 * Deduplicates survey responses across localStorage (`resp-...`) and Cloud SQL (`uuid`),
 * preferring UUID-backed database rows so a single submission is never counted twice.
 */
export function deduplicateSurveyResponses(
  responses: SavedSurveyResponse[]
): SavedSurveyResponse[] {
  if (!Array.isArray(responses) || responses.length === 0) return [];

  // Put UUID-backed DB rows first so their authoritative IDs win over local `resp-...` IDs
  const prioritized = [...responses].sort((a, b) => {
    const aIsUuid = RESPONSE_UUID_REGEX.test(a.id) ? 1 : 0;
    const bIsUuid = RESPONSE_UUID_REGEX.test(b.id) ? 1 : 0;
    if (bIsUuid !== aIsUuid) return bIsUuid - aIsUuid;
    return (
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  });

  const seenIds = new Set<string>();
  const seenSignatures = new Set<string>();
  const unique: SavedSurveyResponse[] = [];

  for (const r of prioritized) {
    if (!r || !r.id) continue;
    const sig = getCanonicalResponseSignature(r);

    if (
      seenIds.has(r.id) ||
      (r.clientResponseId && seenIds.has(r.clientResponseId)) ||
      seenSignatures.has(sig)
    ) {
      seenIds.add(r.id);
      if (r.clientResponseId) seenIds.add(r.clientResponseId);
      continue;
    }

    seenIds.add(r.id);
    if (r.clientResponseId) seenIds.add(r.clientResponseId);
    seenSignatures.add(sig);
    unique.push(r);
  }

  return unique.sort(
    (a, b) =>
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );
}

export interface SurveyAiInsightsSummary {
  headlineTakeaway: string;
  signalScoreOutOf100: number;
  validatedPainPoints: string[];
  politenessAlertOrRisks: string[];
  recommendedNextAction: string;
  topWaitlistLeadAdvice?: string;
  lastAnalyzedAt: string;
  aiEngineUsed: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export type OutreachChannelType =
  | 'LINKEDIN_DM'
  | 'COMMUNITY_POST'
  | 'WHATSAPP_SMS'
  | 'COLD_EMAIL'
  | 'IN_PERSON_PITCH'
  | 'OTHER';

export interface SurveyOutreachTemplates {
  linkedinDm: string;
  communityPost: string;
  whatsappBlurb: string;
  coldEmailSubject?: string;
  coldEmailBody?: string;
  inPersonPitch?: string;
  customChannelName?: string;
  customChannelMessage?: string;
  qrFlyerHeadline?: string;
  qrFlyerSubtext?: string;
  lastGeneratedAt?: string;
}

export interface SavedValidationSurvey {
  id: string;
  planId: string;
  publicSlug: string;
  title: string;
  introDescription: string;
  isActive: boolean;
  isPublished?: boolean;
  publishedAt?: string;
  collectLeadEmails: boolean;
  waitlistIncentiveText: string;
  focusAreas?: SurveyFocusAreaType[];
  otherFocusAreaText?: string;
  customAiFocusPrompt?: string;
  questions: SurveyQuestionItem[];
  responses: SavedSurveyResponse[];
  outreachTemplates?: SurveyOutreachTemplates;
  aiInsightsSummary?: SurveyAiInsightsSummary;
  createdAt: string;
  updatedAt: string;
}

export interface SavedModuleCData {
  surveys: SavedValidationSurvey[];
  activeSurveyId?: string;
  thingsToConsider?: BlindSpotItem[];
  lastSavedAt?: string;
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
  moduleCData?: SavedModuleCData;
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
const PUBLIC_SURVEYS_REGISTRY_KEY = 'bmu_v2_public_surveys_registry_v1';

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
    if (Array.isArray(parsed.plans)) {
      parsed.plans = parsed.plans.map((p) => {
        if (!p.moduleCData?.surveys) return p;
        return {
          ...p,
          moduleCData: {
            ...p.moduleCData,
            surveys: p.moduleCData.surveys.map((s) => ({
              ...s,
              responses: deduplicateSurveyResponses(s.responses || []),
            })),
          },
        };
      });
    }
    return parsed;
  } catch {
    return getDefaultDemoSession();
  }
}

export function saveBmuSession(session: BmuLocalSession): void {
  if (typeof window === 'undefined') return;
  const cleanedSession: BmuLocalSession = {
    ...session,
    plans: (session.plans || []).map((p) => {
      if (!p.moduleCData?.surveys) return p;
      return {
        ...p,
        moduleCData: {
          ...p.moduleCData,
          surveys: p.moduleCData.surveys.map((s) => ({
            ...s,
            responses: deduplicateSurveyResponses(s.responses || []),
          })),
        },
      };
    }),
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedSession));
  try {
    const rawRegistry = window.localStorage.getItem(PUBLIC_SURVEYS_REGISTRY_KEY);
    const registry: Record<string, SavedValidationSurvey & { planTitle?: string }> =
      rawRegistry ? JSON.parse(rawRegistry) : {};
    for (const plan of cleanedSession.plans) {
      const surveys = plan.moduleCData?.surveys || [];
      for (const survey of surveys) {
        if (survey.publicSlug) {
          registry[survey.publicSlug] = {
            ...survey,
            responses: deduplicateSurveyResponses(survey.responses || []),
            planTitle: plan.title,
          };
        }
      }
    }
    window.localStorage.setItem(
      PUBLIC_SURVEYS_REGISTRY_KEY,
      JSON.stringify(registry)
    );
  } catch {
    // Ignore localStorage quota/parse issues
  }
}

export function removePublicSurveyFromLocalRegistry(publicSlug: string): void {
  if (typeof window === 'undefined') return;
  try {
    const cleanSlug = decodeURIComponent(publicSlug).trim();
    const rawRegistry = window.localStorage.getItem(PUBLIC_SURVEYS_REGISTRY_KEY);
    if (!rawRegistry) return;
    const registry = JSON.parse(rawRegistry) as Record<
      string,
      SavedValidationSurvey & { planTitle?: string }
    >;
    if (registry[cleanSlug]) {
      delete registry[cleanSlug];
      window.localStorage.setItem(
        PUBLIC_SURVEYS_REGISTRY_KEY,
        JSON.stringify(registry)
      );
    }
  } catch {
    // Ignore localStorage issues
  }
}

export function loadPublicSurveyFromLocalRegistry(
  publicSlug: string
): (SavedValidationSurvey & { planTitle?: string }) | null {
  if (typeof window === 'undefined') return null;
  try {
    const cleanSlug = decodeURIComponent(publicSlug).trim();
    const rawRegistry = window.localStorage.getItem(PUBLIC_SURVEYS_REGISTRY_KEY);
    if (rawRegistry) {
      const registry = JSON.parse(rawRegistry) as Record<
        string,
        SavedValidationSurvey & { planTitle?: string }
      >;
      if (registry[cleanSlug]) {
        const match = registry[cleanSlug];
        return {
          ...match,
          responses: deduplicateSurveyResponses(match.responses || []),
        };
      }
    }
    // Fallback: scan current session
    const session = loadBmuSession();
    for (const plan of session.plans) {
      const found = (plan.moduleCData?.surveys || []).find(
        (s) => s.publicSlug === cleanSlug
      );
      if (found) {
        return {
          ...found,
          responses: deduplicateSurveyResponses(found.responses || []),
          planTitle: plan.title,
        };
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function appendResponseToLocalRegistryAndSession(
  publicSlug: string,
  response: SavedSurveyResponse
): void {
  if (typeof window === 'undefined') return;
  const cleanSlug = decodeURIComponent(publicSlug).trim();
  try {
    const rawRegistry = window.localStorage.getItem(PUBLIC_SURVEYS_REGISTRY_KEY);
    if (rawRegistry) {
      const registry = JSON.parse(rawRegistry) as Record<
        string,
        SavedValidationSurvey & { planTitle?: string }
      >;
      const existing = registry[cleanSlug];
      if (existing) {
        existing.responses = deduplicateSurveyResponses([
          response,
          ...(existing.responses || []),
        ]);
        existing.updatedAt = new Date().toISOString();
        registry[cleanSlug] = existing;
        window.localStorage.setItem(
          PUBLIC_SURVEYS_REGISTRY_KEY,
          JSON.stringify(registry)
        );
      }
    }

    const session = loadBmuSession();
    let changed = false;
    const nextPlans = session.plans.map((plan) => {
      const surveys = plan.moduleCData?.surveys || [];
      const hasMatch = surveys.some((s) => s.publicSlug === cleanSlug);
      if (!hasMatch) return plan;
      changed = true;
      return {
        ...plan,
        moduleCData: {
          ...plan.moduleCData,
          surveys: surveys.map((s) => {
            if (s.publicSlug !== cleanSlug) return s;
            return {
              ...s,
              responses: deduplicateSurveyResponses([
                response,
                ...(s.responses || []),
              ]),
              updatedAt: new Date().toISOString(),
            };
          }),
        },
      };
    });
    if (changed) {
      saveBmuSession({
        ...session,
        plans: nextPlans,
      });
    }
  } catch {
    // Ignore storage error
  }
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
