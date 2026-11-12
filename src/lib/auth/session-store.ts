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
import type { SavedGrantEligibilityCheck } from '@/lib/grants/module-a-grant-checker';

export type { SavedGrantEligibilityCheck };

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

export type InterviewChannelType =
  | 'ZOOM_VIDEO'
  | 'IN_PERSON_COFFEE'
  | 'PHONE_CALL'
  | 'LINKEDIN_DM_CHAT'
  | 'OTHER';

export type InterviewSignalBadgeType =
  | 'STRONG_SIGNAL'
  | 'MIXED_SIGNAL'
  | 'POLITE_FLUFF';

export type InterviewCommitmentOutcomeType =
  | 'ASKED_TO_PILOT_OR_BUY'
  | 'INTRODUCED_PEERS'
  | 'SHARED_DEEP_WORKFLOW_PAIN'
  | 'POLITE_COMPLIMENTS_ONLY'
  | 'NOT_TARGET_PERSONA'
  | 'OTHER';

export interface SavedCustomerInterviewLog {
  id: string;
  intervieweeNameOrRole: string;
  intervieweeEmail?: string;
  date: string;
  channel: InterviewChannelType;
  otherChannelText?: string;
  painScore1To5: number;
  commitmentOutcome: InterviewCommitmentOutcomeType;
  otherCommitmentText?: string;
  rawNotes: string;
  keyTakeaway: string;
  verbatimQuote?: string;
  workaroundAndSpend?: string;
  signalBadge: InterviewSignalBadgeType;
  momTestCoachingNote?: string;
  linkedSurveyId?: string;
  linkedResponseId?: string;
  isSimulated?: boolean;
  createdAt: string;
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
  interviewLogs?: SavedCustomerInterviewLog[];
  aiInsightsSummary?: SurveyAiInsightsSummary;
  createdAt: string;
  updatedAt: string;
}

export interface SavedModuleCData {
  surveys: SavedValidationSurvey[];
  activeSurveyId?: string;
  interviewLogs?: SavedCustomerInterviewLog[];
  thingsToConsider?: BlindSpotItem[];
  lastSavedAt?: string;
}

export type ProductTrackType =
  | 'SAAS_SOFTWARE_AI'
  | 'PHYSICAL_PRODUCT_ECOM'
  | 'MARKETPLACE_PLATFORM'
  | 'EDUCATION_PROGRAM_COHORT'
  | 'PRODUCTIZED_SERVICE_AGENCY'
  | 'HYBRID_HARDWARE_SOFTWARE'
  | 'OTHER';

export type ProductFormFactorType =
  // SaaS / Software / AI
  | 'WEB_PLATFORM'
  | 'MOBILE_APP_IOS_ANDROID'
  | 'WEB_AND_MOBILE_BOTH'
  | 'EXTENSION_PLUGIN_API'
  // Physical Product / Craft / E-Com
  | 'SINGLE_HERO_SKU'
  | 'CURATED_2_3_SKUS'
  | 'CONSUMABLE_REFILL_SUB'
  | 'MADE_TO_ORDER_BESPOKE'
  // Marketplace
  | 'MANAGED_CURATED_MARKETPLACE'
  | 'SELF_SERVE_BOOKING_DIRECTORY'
  | 'B2B_PROCUREMENT_EXCHANGE'
  | 'COMMUNITY_PEER_MARKETPLACE'
  // Education / Digital Curriculum / Parent & Patient Support
  | 'MOBILE_WEB_PORTAL_AUDIO_VIDEO'
  | 'COHORT_LIVE_PLUS_CURRICULUM'
  | 'MEMBERSHIP_COMMUNITY_LIBRARY'
  | 'B2B_SCHOOL_CLINIC_LICENCE'
  // Productized Service / Agency
  | 'FIXED_SCOPE_SPRINT'
  | 'MONTHLY_RETAINER_SUBSCRIPTION'
  | 'TECH_ENABLED_DONE_FOR_YOU'
  | 'DIAGNOSTIC_PAID_PILOT'
  // Hybrid
  | 'DEVICE_PLUS_COMPANION_APP'
  | 'PHYSICAL_PRODUCT_PLUS_DIGITAL_CLUB'
  | 'IN_PERSON_PLUS_DIGITAL_PORTAL'
  | 'CUSTOM_HYBRID_FORMAT'
  | 'OTHER';

export type V1PrototypeApproachType =
  // SaaS / Software
  | 'FOCUSED_FULL_CODE_V1'
  | 'NO_CODE_LOW_CODE_MVP'
  | 'CONCIERGE_AI_ASSISTED_MVP'
  | 'CLICKABLE_PROTOTYPE_PREORDER'
  // Physical Product / Craft
  | 'IN_HOUSE_SMALL_BATCH_WORKSHOP'
  | 'WHITE_LABEL_CUSTOMISED_PILOT'
  | 'LOCAL_CO_PACKER_MAKER_RUN'
  | 'PREORDER_BEFORE_TOOLING'
  // Marketplace
  | 'CONCIERGE_MANUAL_MATCHING'
  | 'SINGLE_SIDE_DIRECTORY_BOOKING'
  | 'NO_CODE_MARKETPLACE_PORTAL'
  | 'CUSTOM_TWO_SIDED_BUILD'
  // Education / Support
  | 'HOSTED_PORTAL_PLUS_LIVE_QA'
  | 'FOUNDING_BETA_COHORT_LIVE'
  | 'MOBILE_PWA_BITE_SIZED_AUDIO'
  | 'CUSTOM_EDUCATION_APP_BUILD'
  // Service
  | 'REPEATABLE_SOP_PLUS_STRIPE'
  | 'CLIENT_PORTAL_PLUS_AUTOMATION'
  | 'PAID_PILOT_SPRINT_FIRST_5'
  // Hybrid
  | 'OFF_THE_SHELF_HARDWARE_PLUS_WEB'
  | 'SMALL_BATCH_PHYSICAL_PLUS_CONCIERGE'
  | 'CUSTOM_HARDWARE_AND_APP'
  | 'OTHER';

export type V1LaunchTimelineType =
  | 'UNDER_4_WEEKS'
  | '1_TO_3_MONTHS'
  | '3_TO_6_MONTHS'
  | 'OVER_6_MONTHS'
  | 'OTHER';

export interface ProductVehicleStep1Data {
  productTrack: ProductTrackType;
  otherProductTrackText?: string;
  isTrackAutoDetected?: boolean;
  formFactor: ProductFormFactorType;
  otherFormFactorText?: string;
  v1PrototypeApproach: V1PrototypeApproachType;
  otherV1PrototypeApproachText?: string;
  launchTimeline: V1LaunchTimelineType;
  otherLaunchTimelineText?: string;
  ahaMomentNarrative: string;
  whyThisVehicleFitsCustomer: string;
  lastSavedAt?: string;
  aiEngineUsed?: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export type SalesChannelOptionType =
  // SaaS / Software / AI
  | 'DIRECT_WEB_STRIPE'
  | 'LTD_LAUNCH_MARKETPLACE'
  | 'B2B_INSTITUTIONAL_INVOICE'
  | 'APP_STORE_PLUGIN_MARKETPLACE'
  // Physical Product / Craft / E-Com
  | 'ETSY_MARKETPLACE'
  | 'AMAZON_FBA'
  | 'AMAZON_FBM'
  | 'DIRECT_WEB_CRAFT_MARKETS'
  | 'WHOLESALE_RETAIL_STOCKISTS'
  // Education / Guided Support Platform
  | 'DIRECT_WEB_PORTAL_STRIPE'
  | 'HOSTED_COURSE_COMMUNITY'
  | 'CHARITY_CLINIC_PARTNERSHIPS'
  | 'MOBILE_IN_APP_PURCHASE'
  // Marketplace
  | 'DIRECT_WEB_MANAGED_ESCROW'
  | 'B2B_ANNUAL_SUBSCRIPTION_PLUS_TAKE'
  | 'SOCIAL_COMMUNITY_REFERRAL_LOOP'
  // Productized Service / Agency
  | 'DIRECT_STRIPE_SUBSCRIPTION_LINK'
  | 'B2B_INVOICE_BANK_TRANSFER'
  | 'FREELANCE_EXPERT_MARKETPLACE'
  // Hybrid Hardware + Software
  | 'DIRECT_HARDWARE_BUNDLE_WEB'
  | 'AMAZON_PLUS_COMPANION_PORTAL'
  | 'B2B_CHANNEL_RESELLER'
  | 'OTHER';

export type DeliveryFulfillmentModelType =
  // SaaS / Software
  | 'INSTANT_SELF_SERVE_ONBOARDING'
  | 'HYBRID_SELF_SERVE_PLUS_COHORT_CODE'
  | 'FOUNDER_CONCIERGE_SETUP_CALL'
  // Physical Product / Craft
  | 'WORKSHOP_PACK_AND_COURIER'
  | 'HYBRID_FBA_STANDARD_WORKSHOP_CUSTOM'
  | 'THIRD_PARTY_3PL_WAREHOUSE'
  | 'LOCAL_PICKUP_AND_MARKETS'
  // Education / Guided Support
  | 'INSTANT_24_7_PORTAL_PLUS_PRINTABLES'
  | 'HYBRID_ON_DEMAND_PLUS_LIVE_QA'
  | 'SCHEDULED_COHORT_START_DATES'
  // Marketplace / Service / Hybrid
  | 'MANUAL_CONCIERGE_FULFILLMENT'
  | 'CLIENT_PORTAL_ASYNC_DELIVERY'
  | 'HARDWARE_SHIP_PLUS_QR_ACTIVATION'
  | 'OTHER';

export interface ChannelMatrixStep2Data {
  primaryChannel: SalesChannelOptionType;
  otherPrimaryChannelText?: string;
  secondaryChannels: SalesChannelOptionType[];
  otherSecondaryChannelText?: string;
  primaryChannelSharePercent: number;
  estimatedBlendedFeePercent: number;
  deliveryFulfillmentModel: DeliveryFulfillmentModelType;
  otherDeliveryFulfillmentText?: string;
  rentToOwnBridgeStrategy: string;
  channelWhyItFitsNotes: string;
  lastSavedAt?: string;
  aiEngineUsed?: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export type ScopeBucketType =
  | 'MUST_HAVE_V1'
  | 'FAST_FOLLOW_V1_5'
  | 'PARKING_LOT_V2';

export type ScopeItemEffortType = 'LOW' | 'MEDIUM' | 'HIGH';

export type V1ScopeDisciplineRuleType =
  // SaaS / Software
  | 'CORE_AHA_FLOW_ONLY_NO_NATIVE_APP'
  | 'MANUAL_ADMIN_BEHIND_SCENES_V1'
  | 'SINGLE_PERSONA_SINGLE_INTEGRATION'
  | 'SINGLE_TENANT_CONCIERGE_FIRST_10'
  | 'NO_CUSTOM_INTEGRATIONS_CSV_EXPORT_FIRST'
  // Physical Product / Craft
  | 'MAX_2_3_HERO_SKUS_STANDARD_JIG'
  | 'STANDARD_BOX_SIZE_UNDER_2KG_TIER'
  | 'MADE_TO_ORDER_ZERO_DEAD_STOCK'
  | 'SINGLE_FLAGSHIP_SKU_ZERO_VARIATIONS'
  | 'PRE_ORDER_BATCH_DROP_ONLY'
  // Education / Support
  | 'BITE_SIZED_5MIN_AUDIO_NO_CUSTOM_APP'
  | 'SELL_PILOT_COHORT_BEFORE_FULL_LIBRARY'
  | 'PRINTABLE_TOOLS_PLUS_WEEKLY_LIVE_QA'
  | 'PILOT_COHORT_LIVE_BEFORE_RECORDING'
  // Marketplace / Service / Hybrid
  | 'CONCIERGE_MATCHING_BEFORE_ALGORITHMS'
  | 'FIXED_SPRINT_SCOPE_NO_CUSTOM_RETROFITS'
  | 'OFF_THE_SHELF_HARDWARE_FOR_FIRST_50'
  | 'OTHER';

export interface ScopeFilterItem {
  id: string;
  title: string;
  bucket: ScopeBucketType;
  categoryTag: string;
  otherCategoryText?: string;
  otherCategoryTagText?: string;
  effortImpact: ScopeItemEffortType;
  rationaleOrNote: string;
}

export interface ScopeFilterStep3Data {
  items: ScopeFilterItem[];
  scopeDisciplineRule: V1ScopeDisciplineRuleType | '';
  otherScopeDisciplineRuleText?: string;
  whatWeRefuseToBuildInV1Narrative: string;
  whyThisLeanV1WinsFasterNarrative: string;
  lastSavedAt?: string;
  aiEngineUsed?: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export type BuildVsBuyTierType =
  | 'BUILD_IN_HOUSE'
  | 'BUY_RENT_OFF_SHELF'
  | 'OUTSOURCE_PARTNER';

export type BuildVsBuyCostModelType =
  | 'MONTHLY_SUBSCRIPTION'
  | 'ONE_OFF_PURCHASE'
  | 'PER_UNIT_COGS'
  | 'SWEAT_EQUITY_ZERO'
  | 'OTHER';

export type CoreIpOwnershipRuleType =
  // SaaS / Software
  | 'OWN_PROPRIETARY_WORKFLOW_RENT_PLUMBING'
  | 'OWN_DOMAIN_DATA_AND_PROMPTS_IN_HOUSE'
  | 'NO_EXTERNAL_DEV_AGENCY_FOR_CORE_IP'
  // Physical Product / Craft
  | 'IN_HOUSE_CRAFT_AND_FINISHING_BUY_STOCK_PACKAGING'
  | 'OWN_JIGS_AND_ENGRAVING_OUTSOURCE_RAW_MILLING'
  | 'BATCH_MATERIALS_ONCE_OFF_ZERO_CUSTOM_TOOLING'
  // Education / Support
  | 'OWN_CURRICULUM_AND_METHOD_RENT_COURSE_PORTAL'
  | 'IN_HOUSE_AUDIO_AND_TOOLKITS_PARTNER_CLINICAL_REVIEW'
  | 'ZERO_CUSTOM_APP_CODE_UNTIL_100_FAMILIES'
  // Marketplace / Service / Hybrid
  | 'OWN_SUPPLY_RELATIONSHIPS_RENT_BOOKING_STACK'
  | 'OWN_DELIVERY_PLAYBOOK_RENT_CLIENT_PORTAL'
  | 'OWN_FIRMWARE_AND_DASHBOARD_BUY_OFF_SHELF_ENCLOSURE'
  | 'OTHER';

export interface BuildVsBuyItem {
  id: string;
  title: string;
  tier: BuildVsBuyTierType;
  categoryTag: string;
  otherCategoryTagText?: string;
  costModel: BuildVsBuyCostModelType;
  otherCostModelText?: string;
  estimatedCostAmount: number;
  vendorOrToolName?: string;
  rationaleOrNote: string;
  isCustom?: boolean;
}

export interface BuildVsBuyStep4Data {
  items: BuildVsBuyItem[];
  coreIpOwnershipRule: CoreIpOwnershipRuleType | '';
  otherCoreIpOwnershipRuleText?: string;
  secretSauceInHouseNarrative: string;
  whyBuyAndPartnerSavesTimeNarrative: string;
  lastSavedAt?: string;
  aiEngineUsed?: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export type WorkPackageExecutionModeType =
  | 'IN_HOUSE'
  | 'SUPPLIER_OFF_SHELF'
  | 'EXTERNAL_PARTNER'
  | 'OTHER';

export type WorkPackageTimelineWindowType =
  | 'WEEKS_1_2'
  | 'WEEKS_1_TO_2'
  | 'WEEKS_3_4'
  | 'WEEKS_3_TO_4'
  | 'WEEKS_5_8'
  | 'MONTH_2'
  | 'MONTH_2_3'
  | 'MONTH_3'
  | 'PRE_LAUNCH_FINAL'
  | 'OTHER';

export type WorkPackageCadenceRuleType =
  // SaaS / Software
  | 'WEEKLY_SHIPPABLE_INCREMENTS_NO_BIG_BANG'
  | 'CORE_DB_AND_AHA_WORKFLOW_BEFORE_BILLING_POLISH'
  | 'PILOT_WITH_10_WAITLIST_USERS_BEFORE_PUBLIC_LAUNCH'
  | 'TWO_WEEK_AGILE_SPRINTS_USER_DEMO'
  | 'MILESTONE_GATED_TECHNICAL_SPRINT'
  // Physical Product / Craft
  | 'JIG_AND_PROTOTYPE_APPROVAL_BEFORE_BATCH_TIMBER_BUY'
  | 'BATCH_OF_20_STANDARD_UNITS_BEFORE_FBA_SHIPMENT'
  | 'DROP_TEST_AND_BARCODE_CHECK_BEFORE_MARKETPLACE_LISTING'
  | 'BATCH_PROTOTYPE_JIG_AND_PILOT_RUN'
  // Education / Support
  | 'RECORD_MODULE_1_AND_QUIZ_BEFORE_FULL_CURRICULUM'
  | 'PILOT_COHORT_OF_10_FAMILIES_BEFORE_SCALING'
  | 'CLINICAL_SAFEGUARDING_SIGN_OFF_BEFORE_PUBLIC_ENROLMENT'
  | 'CURRICULUM_PILOT_COHORT_ITERATION'
  // Marketplace / Service / Hybrid
  | 'ONBOARD_SUPPLY_SIDE_FIRST_BEFORE_BUYER_TRAFFIC'
  | 'STANDARDIZE_SOP_ON_FIRST_5_CLIENTS_BEFORE_AUTOMATION'
  | 'BENCHTOP_PROTOTYPE_VALIDATION_BEFORE_ENCLOSURE_RUN'
  | 'OTHER';

export interface ProductWorkPackageItem {
  id: string;
  wpCode: string; // e.g., 'WP1', 'WP2', 'WP3', 'WP4'
  title: string;
  timelineWindow: WorkPackageTimelineWindowType;
  otherTimelineWindowText?: string;
  executionMode: WorkPackageExecutionModeType;
  otherExecutionModeText?: string;
  costModel: BuildVsBuyCostModelType;
  otherCostModelText?: string;
  estimatedCostAmount: number;
  deliverableMilestoneProof?: string;
  linkedTaskSummary?: string;
  deliverableMilestone?: string;
  verificationGateOrDeRisking?: string;
  isGrantEligibleRAndDOrPrototype?: boolean;
  isCustom?: boolean;
}

export interface ProductFlowStageItem {
  id: string;
  stageNumber: number;
  stageTitle: string;
  executionBadge?: WorkPackageExecutionModeType;
  otherExecutionBadgeText?: string;
  whatHappensHere?: string;
  outputOrHandOff?: string;
  stageSubtitle?: string;
  keyToolsOrMaterials?: string;
  outputOrHandoff?: string;
}

export interface WorkPackagesStep5Data {
  workPackages: ProductWorkPackageItem[];
  flowStages: ProductFlowStageItem[];
  executionCadenceRule: WorkPackageCadenceRuleType | '';
  otherExecutionCadenceRuleText?: string;
  technicalMeritAndInnovationNarrative: string;
  bottleneckAndDeRiskingNarrative: string;
  lastSavedAt?: string;
  aiEngineUsed?: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export type ProductBlindSpotCategoryType =
  | 'SCOPE_CREEP_TIMELINE'
  | 'UNIT_MARGIN_CHANNEL_FEE'
  | 'TECHNICAL_BOTTLENECK'
  | 'SUPPLIER_DEPENDENCY'
  | 'GRANT_COMPLIANCE_IP'
  | 'OTHER';

export type ProductBlindSpotSeverityType = 'WATCH' | 'IMPORTANT' | 'CRITICAL';

export type ProductReadinessConfidenceType =
  | 'READY_TO_BUILD_V1'
  | 'NEEDS_MINOR_DE_RISKING'
  | 'NEEDS_PROTOTYPE_SPIKE_FIRST'
  | 'OTHER';

export interface ProductBlindSpotItem {
  id: string;
  title: string;
  category: ProductBlindSpotCategoryType;
  otherCategoryText?: string;
  severity: ProductBlindSpotSeverityType;
  whyItMatters: string;
  recommendedActionOrFix: string;
  founderMitigationNote?: string;
  isResolved?: boolean;
  isCustom?: boolean;
}

export interface BlindSpotAuditStep6Data {
  blindSpots: ProductBlindSpotItem[];
  readinessConfidence: ProductReadinessConfidenceType | '';
  otherReadinessConfidenceText?: string;
  executiveProductBriefSummary: string;
  keyDeRiskingSignOffNarrative: string;
  lastSavedAt?: string;
  aiEngineUsed?: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export interface SavedModuleDData {
  productVehicle?: ProductVehicleStep1Data;
  channelMatrix?: ChannelMatrixStep2Data;
  scopeFilter?: ScopeFilterStep3Data;
  buildVsBuy?: BuildVsBuyStep4Data;
  workPackagesAndFlow?: WorkPackagesStep5Data;
  blindSpotAudit?: BlindSpotAuditStep6Data;
  thingsToConsider?: BlindSpotItem[];
  lastSavedAt?: string;
}

// ============================================================================
// MODULE E (OPERATIONS, PREMISES, EQUIPMENT SCHEDULE & RISK REGISTER) TYPES
// ============================================================================

export type OperationsFulfillmentModeType =
  | 'AUTOMATED_CLOUD_SELF_SERVE'
  | 'IN_HOUSE_WORKSHOP_BATCH'
  | 'CONTRACT_MANUFACTURED_3PL'
  | 'FOUNDER_LED_CONCIERGE_COHORT'
  | 'HYBRID_AUTOMATED_PLUS_HUMAN'
  | 'OTHER';

export type OrderTurnaroundSlaType =
  | 'INSTANT_UNDER_5_MINS'
  | 'SAME_OR_NEXT_DAY_24_48H'
  | 'STANDARD_CRAFT_CYCLE_3_7_DAYS'
  | 'BESPOKE_OR_SPRINT_2_4_WEEKS'
  | 'COHORT_OR_SCHEDULED_WINDOW'
  | 'OTHER';

export type OperationalCapacityConstraintType =
  | 'FOUNDER_MANUAL_HOURS'
  | 'EQUIPMENT_OR_CURE_BATCH_LIMIT'
  | 'SUPPLIER_OR_PARTNER_TURNAROUND'
  | 'CLOUD_API_RATE_OR_INFRA_GUARDRAIL'
  | 'PROVIDER_SUPPLY_LIQUIDITY'
  | 'OTHER';

export type OrderStageOwnerType =
  | 'AUTOMATED_SYSTEM'
  | 'FOUNDER_MAKER'
  | 'COFOUNDER_TEAM'
  | 'EXTERNAL_SUPPLIER_3PL'
  | 'PARTNER_CONCIERGE'
  | 'OTHER';

export interface OrderLifecycleStageItem {
  id: string;
  stageNumber: number;
  stageTitle: string;
  ownerType: OrderStageOwnerType;
  otherOwnerTypeText?: string;
  whatHappensStepByStep: string;
  toolsEquipmentOrSupplier: string;
  activeMinutesPerOrder: number;
  directVariableCostPerOrder: number;
  isCustom?: boolean;
}

export interface OperationsBlueprintStep1Data {
  fulfillmentMode: OperationsFulfillmentModeType | '';
  otherFulfillmentModeText?: string;
  turnaroundSla: OrderTurnaroundSlaType | '';
  otherTurnaroundSlaText?: string;
  capacityConstraint: OperationalCapacityConstraintType | '';
  otherCapacityConstraintText?: string;
  weeklyOpsHoursAllocated: number;
  orderLifecycleStages: OrderLifecycleStageItem[];
  endToEndFulfillmentNarrative: string;
  scalingAndBottleneckDeRiskingNarrative: string;
  lastSavedAt?: string;
  aiEngineUsed?: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export type PremisesSetupModeType =
  | 'HOME_OFFICE_ZERO_RENT'
  | 'HOME_WORKSHOP_GARAGE_SHED'
  | 'SHARED_COWORKING_MAKER_SPACE'
  | 'COMMERCIAL_INDUSTRIAL_UNIT'
  | 'RETAIL_OR_CLIENT_PREMISES'
  | 'REMOTE_CLOUD_HOME_OFFICE'
  | 'HOME_GARAGE_GARDEN_WORKSHOP'
  | 'SHARED_COWORKING_INCUBATOR_HUB'
  | 'COMMERCIAL_WORKSHOP_INDUSTRIAL_UNIT'
  | 'RETAIL_HIGH_STREET_PREMISES'
  | 'OTHER';

export type PremisesComplianceStatusType =
  | 'NOT_REQUIRED_REMOTE'
  | 'COVERED_EXEMPT_HOME_STUDIO'
  | 'COMMERCIAL_LEASE_COMPLIANT'
  | 'NEEDS_PLANNING_OR_FIRE_CERT_CHECK'
  | 'NO_PERMIT_REQUIRED_REMOTE'
  | 'EXEMPT_DOMESTIC_GARAGE_SHED'
  | 'COMMERCIAL_ZONING_APPROVED'
  | 'PLANNING_OR_HSE_PENDING'
  | 'OTHER';

export type EquipmentAssetCategoryType =
  | 'PRODUCTION_MACHINERY_TOOLS'
  | 'SPECIALIST_R_AND_D_HARDWARE'
  | 'PACKAGING_FULFILLMENT_EQUIPMENT'
  | 'WORKSHOP_EXTRACTION_SAFETY'
  | 'IT_LAPTOP_MOBILE_DEVICE'
  | 'OFFICE_FURNITURE_FITOUT'
  | 'CLOUD_INFRA_RESERVATION'
  | 'SAFETY_EXTRACTION_FOOD_HYGIENE'
  | 'PACKAGING_BENCH_FIXTURES'
  | 'SPECIALIST_RND_TEST_RIG'
  | 'OTHER';

export type EquipmentAcquisitionModeType =
  | 'BUY_NEW_GRANT_ELIGIBLE'
  | 'BUY_SECOND_HAND_BOOTSTRAP'
  | 'LEASE_OR_RENT_MONTHLY'
  | 'ALREADY_OWNED_SWEAT_ASSET'
  | 'BUY_NEW_OUTRIGHT'
  | 'SECOND_HAND_REFURBISHED'
  | 'LEASE_HIRE_PURCHASE'
  | 'ALREADY_OWNED_BYOD'
  | 'OTHER';

export type EquipmentFundingSourceType =
  | 'GRANT_CO_FUNDED'
  | 'OWN_FUNDS_OR_LOAN_100'
  | 'MONTHLY_OPERATING_EXPENSE'
  | 'GRANT_50_MATCH'
  | 'OWN_FUNDS_100'
  | 'STARTUP_LOAN_FINANCE'
  | 'OTHER';

export type EquipmentQuoteComplianceStatusType =
  | 'NOT_REQUIRED_UNDER_THRESHOLD'
  | 'NEEDS_3_QUOTES'
  | 'REQUESTED_VIA_BMU_CONCIERGE'
  | 'THREE_QUOTES_UPLOADED_READY'
  | 'NEEDS_3_QUOTES_CONCIERGE'
  | 'HAVE_3_WRITTEN_QUOTES'
  | 'UNDER_1K_SINGLE_QUOTE_OK'
  | 'ALREADY_OWNED_EXEMPT'
  | 'OTHER';

export interface EquipmentAssetItem {
  id: string;
  assetName: string;
  assetCategory: EquipmentAssetCategoryType;
  otherAssetCategoryText?: string;
  acquisitionMode: EquipmentAcquisitionModeType;
  otherAcquisitionModeText?: string;
  fundingSource: EquipmentFundingSourceType;
  otherFundingSourceText?: string;
  quantity: number;
  unitCostExVat: number;
  totalCostExVat: number;
  usefulLifeMonths: number;
  projectUsagePercent: number;
  quoteComplianceStatus: EquipmentQuoteComplianceStatusType;
  otherQuoteComplianceText?: string;
  otherQuoteComplianceStatusText?: string;
  preferredSuppliersOrSpecs?: string;
  supplierQuotesSummary?: string;
  operationalRoiNote?: string;
  conciergeQuotesRequested?: boolean;
  isMobileOrLaptopIneligibleForLeoGrant?: boolean;
  isFlaggedLaptopOrMobileAsset?: boolean;
  isCustom?: boolean;
}

export interface PremisesAndEquipmentStep2Data {
  premisesSetupMode: PremisesSetupModeType | '';
  otherPremisesSetupModeText?: string;
  premisesLocationSummary: string;
  monthlyPremisesAndUtilitiesCost: number;
  premisesComplianceStatus: PremisesComplianceStatusType | '';
  otherPremisesComplianceStatusText?: string;
  equipmentItems: EquipmentAssetItem[];
  conciergeRfpRequestedAt?: string;
  premisesAndLocationJustificationNarrative: string;
  equipmentRoiAndGrantComplianceNarrative: string;
  lastSavedAt?: string;
  aiEngineUsed?: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export type SupplierRedundancyPostureType =
  | 'DUAL_SOURCED_VERIFIED'
  | 'BUFFER_STOCK_HELD'
  | 'CLOUD_MULTI_REGION_FAILOVER'
  | 'SINGLE_SOURCE_CONTRACTED'
  | 'OTHER';

export type ProjectRiskCategoryType =
  | 'TECHNICAL_PRODUCTION'
  | 'COMMERCIAL_MARKET'
  | 'FINANCIAL_SUPPLY_CHAIN'
  | 'MANAGERIAL_REGULATORY'
  | 'OTHER';

export type ResidualRiskRatingType = 'LOW' | 'MEDIUM' | 'HIGH' | 'OTHER';

export interface ProjectRiskRegisterItem {
  id: string;
  riskCategory: ProjectRiskCategoryType;
  otherRiskCategoryText?: string;
  riskTitle: string;
  likelihoodScore: number; // 1 to 5
  impactScore: number; // 1 to 5
  grossRiskScore: number; // 1 to 25 (likelihoodScore * impactScore)
  mitigationAndContingencyPlan: string;
  ownerAndWorkPackage: string;
  residualRiskRating: ResidualRiskRatingType;
  otherResidualRiskRatingText?: string;
  isCustom?: boolean;
}

export interface RiskRegisterStep3Data {
  supplierRedundancyPosture: SupplierRedundancyPostureType | '';
  otherSupplierRedundancyPostureText?: string;
  leadTimeBufferDays: number;
  primarySuppliersSummary: string;
  backupSuppliersSummary: string;
  riskItems: ProjectRiskRegisterItem[];
  supplyChainResilienceNarrative: string;
  riskManagementGovernanceNarrative: string;
  lastSavedAt?: string;
  aiEngineUsed?: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export type SupportOperatingModelType =
  | 'SELF_SERVE_DOCS_PLUS_FOUNDER_TIER2'
  | 'DIRECT_FOUNDER_CONCIERGE_EMAIL_WHATSAPP'
  | 'AI_TRIAGE_CHATBOT_PLUS_HUMAN_FALLBACK'
  | 'DEDICATED_PART_TIME_SUPPORT_AGENT'
  | 'OTHER';

export type SupportResponseSlaType =
  | 'INSTANT_AUTOMATED_24_7'
  | 'SAME_BUSINESS_DAY_UNDER_4H'
  | 'NEXT_BUSINESS_DAY_24H'
  | 'FORTY_EIGHT_HOUR_STANDARD'
  | 'OTHER';

export type ReturnsAndWarrantyPolicyType =
  | 'STATUTORY_14_DAY_COOLING_OFF'
  | 'BESPOKE_PERSONALIZED_EXEMPT_TRANSIT_REPLACE'
  | 'THIRTY_DAY_MONEY_BACK_OR_TRIAL'
  | 'MILESTONE_ACCEPTANCE_SIGN_OFF'
  | 'OTHER';

export type QcGateTimingType =
  | 'INCOMING_MATERIAL_OR_DATA_CHECK'
  | 'IN_PROCESS_BUILD_OR_CODE_REVIEW'
  | 'PRE_DISPATCH_FINAL_INSPECTION'
  | 'POST_DELIVERY_CUSTOMER_CHECKIN'
  | 'OTHER';

export interface QcCheckpointItem {
  id: string;
  gateTiming: QcGateTimingType;
  otherGateTimingText?: string;
  checkpointName: string;
  passFailStandard: string;
  defectFallbackAction: string;
  ownerRole: string;
  isCustom?: boolean;
}

export interface SupportReturnsAndQcStep4Data {
  supportOperatingModel: SupportOperatingModelType | '';
  otherSupportOperatingModelText?: string;
  supportResponseSla: SupportResponseSlaType | '';
  otherSupportResponseSlaText?: string;
  returnsAndWarrantyPolicy: ReturnsAndWarrantyPolicyType | '';
  otherReturnsAndWarrantyPolicyText?: string;
  estimatedReturnOrRefundRatePercent: number;
  costPerReturnOrRemakeIncident: number;
  warrantyDurationMonths: number;
  qcCheckpoints: QcCheckpointItem[];
  qualityControlAndStandardsNarrative: string;
  customerSupportAndReturnsNarrative: string;
  lastSavedAt?: string;
  aiEngineUsed?: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export type RegulatorySectorPostureType =
  | 'STANDARD_COMMERCIAL_UNREGULATED'
  | 'PHYSICAL_PRODUCT_SAFETY_CE_UKCA'
  | 'FOOD_BEV_HYGIENE_HACCP'
  | 'FINTECH_HEALTH_REGULATED'
  | 'STANDARD_GENERAL_COMMERCIAL'
  | 'PHYSICAL_GOODS_GPSR_CE_PRODUCT_SAFETY'
  | 'FOOD_BEVERAGE_COSMETIC_HYGIENE'
  | 'DIGITAL_AI_FINTECH_REGULATED_DATA'
  | 'OTHER';

export type DataPrivacyPostureType =
  | 'MINIMAL_B2B_CONTACT_DATA'
  | 'STANDARD_CUSTOMER_CRM_COOKIES'
  | 'B2B_DATA_PROCESSOR_DPA_SCC'
  | 'HIGH_RISK_SPECIAL_CATEGORY_DPIA'
  | 'STANDARD_CUSTOMER_CRM_CHECKOUT_GDPR'
  | 'B2B_DATA_PROCESSOR_DPA_EU_UK_HOSTING'
  | 'SENSITIVE_SPECIAL_CATEGORY_DPIA_REQUIRED'
  | 'MINIMAL_NO_PII_STORED'
  | 'OTHER';

export type InsuranceCoverageBundleType =
  | 'PUBLIC_EMPLOYERS_CORE'
  | 'TECH_SAAS_PI_CYBER'
  | 'PRODUCT_PUBLIC_LIABILITY_STOCK'
  | 'COMPREHENSIVE_COMMERCIAL_ALL_RISK'
  | 'PUBLIC_AND_PRODUCT_LIABILITY_PACK'
  | 'PRO_INDEMNITY_AND_CYBER_SAAS_PACK'
  | 'ALL_IN_COMMERCIAL_COMBINED_EMPLOYERS'
  | 'PRE_TRADING_MINIMAL_HOLDING'
  | 'CYBER_PI_TECH_EO'
  | 'PRODUCT_PUBLIC_LIABILITY'
  | 'FULL_COMMERCIAL_COMBINED_EMPLOYERS'
  | 'OTHER';

export type ComplianceItemCategoryType =
  | 'CORPORATE_TAX_GRANT_CLEARANCE'
  | 'DATA_PRIVACY_GDPR_SECURITY'
  | 'HEALTH_SAFETY_PREMISES'
  | 'SECTOR_PRODUCT_LICENSE'
  | 'COMMERCIAL_INSURANCE_POLICY'
  | 'PRODUCT_SECTOR_LICENSING'
  | 'DATA_PRIVACY_CYBER_GDPR'
  | 'OTHER';

export type ComplianceItemStatusType =
  | 'VERIFIED_COMPLETE'
  | 'IN_PROGRESS'
  | 'PLANNED_BEFORE_LAUNCH'
  | 'NOT_APPLICABLE'
  | 'VERIFIED_ACTIVE'
  | 'IN_PROGRESS_PRE_LAUNCH'
  | 'REQUIRED_BEFORE_FIRST_SALE_OR_GRANT'
  | 'OTHER';

export interface ComplianceChecklistItem {
  id: string;
  category: ComplianceItemCategoryType;
  otherCategoryText?: string;
  requirementTitle: string;
  regulatoryBody: string;
  issuingAuthority?: string;
  status: ComplianceItemStatusType;
  otherStatusText?: string;
  evidenceOrReferenceNote: string;
  actionPlanOrEvidenceNote?: string;
  estimatedAnnualCost: number;
  estimatedOneOffFilingCost?: number;
  isCustom?: boolean;
}

export interface PermitsComplianceAndInsuranceStep5Data {
  regulatorySectorPosture: RegulatorySectorPostureType | '';
  otherRegulatorySectorPostureText?: string;
  dataPrivacyPosture: DataPrivacyPostureType | '';
  otherDataPrivacyPostureText?: string;
  insuranceCoverageBundle: InsuranceCoverageBundleType | '';
  otherInsuranceCoverageBundleText?: string;
  estimatedAnnualInsurancePremium: number; // Explicitly indicative estimate; actual coverage & premium may vary
  selectedInsuranceProviderName: string;
  targetIndemnityLimitSummary?: string;
  partnerInsuranceQuoteRequested?: boolean;
  complianceItems: ComplianceChecklistItem[];
  regulatoryAndComplianceNarrative: string;
  insuranceAndLiabilityGovernanceNarrative: string;
  regulatoryAndComplianceReadinessNarrative?: string;
  insuranceAndLiabilityProtectionNarrative?: string;
  aiCoachTip?: string;
  lastSavedAt?: string;
  aiEngineUsed?: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export type OperationsBlindSpotCategoryType =
  | 'CAPACITY_AND_FULFILLMENT_BOTTLENECK'
  | 'UNIT_COGS_AND_RETURN_MARGIN_LEAKAGE'
  | 'GRANT_PROCUREMENT_AND_CAPEX_ELIGIBILITY'
  | 'SINGLE_SUPPLIER_AND_CONTINUITY_EXPOSURE'
  | 'REGULATORY_TAX_AND_INSURANCE_GAP'
  | 'OTHER';

export type OperationsBlindSpotSeverityType =
  | 'WATCH'
  | 'IMPORTANT'
  | 'CRITICAL';

export type OperationsReadinessConfidenceType =
  | 'READY_FOR_V1_FULFILLMENT'
  | 'NEEDS_SUPPLIER_OR_3_QUOTE_VERIFICATION'
  | 'NEEDS_PILOT_BATCH_OR_SLA_STRESS_TEST'
  | 'NEEDS_REGULATORY_OR_INSURANCE_SIGN_OFF'
  | 'OTHER';

export interface OperationsBlindSpotItem {
  id: string;
  title: string;
  category: OperationsBlindSpotCategoryType;
  otherCategoryText?: string;
  severity: OperationsBlindSpotSeverityType;
  whyItMatters: string;
  recommendedActionOrFix: string;
  founderMitigationNote?: string;
  isResolved?: boolean;
  isCustom?: boolean;
}

export interface OperationsBlindSpotAuditStep6Data {
  blindSpots: OperationsBlindSpotItem[];
  readinessConfidence: OperationsReadinessConfidenceType | '';
  otherReadinessConfidenceText?: string;
  executiveOperationsSummaryNarrative: string;
  operationsToFinanceAndTeamHandshakeNarrative: string;
  aiCoachTip?: string;
  lastSavedAt?: string;
  aiEngineUsed?: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export interface SavedModuleEData {
  operationsBlueprint?: OperationsBlueprintStep1Data;
  premisesAndEquipment?: PremisesAndEquipmentStep2Data;
  riskRegister?: RiskRegisterStep3Data;
  supportReturnsAndQc?: SupportReturnsAndQcStep4Data;
  permitsAndInsurance?: PermitsComplianceAndInsuranceStep5Data;
  blindSpotAudit?: OperationsBlindSpotAuditStep6Data;
  thingsToConsider?: BlindSpotItem[];
  lastSavedAt?: string;
}

// ============================================================================
// MODULE F (CO-FOUNDER, TEAM, SURVIVAL BUDGET & ROLES) TYPES
// ============================================================================

export type TeamMemberClassificationType =
  | 'FOUNDER_PROMOTER'
  | 'KEY_TEAM_MEMBER'
  | 'FRACTIONAL_EXECUTIVE'
  | 'ADVISOR_BOARD'
  | 'OTHER';

export type TeamWeeklyCommitmentType =
  | 'FULL_TIME_40H_PLUS'
  | 'PART_TIME_20_TO_30H'
  | 'EVENING_WEEKEND_10_TO_15H'
  | 'FRACTIONAL_ADVISORY_2_TO_5H'
  | 'OTHER';

export interface TeamMemberProfileItem {
  id: string;
  fullName: string;
  roleClassification: TeamMemberClassificationType;
  otherRoleClassificationText?: string;
  jobTitle: string;
  photoUrl?: string; // Uploaded base64 data-URL or external URL
  linkedInUrl?: string;
  email?: string;
  weeklyCommitment: TeamWeeklyCommitmentType;
  otherWeeklyCommitmentText?: string;
  relevantEducationAndDegrees?: string; // e.g. BEng Computer Science, ACCA, Apprentice
  relevantTrainingCourses?: string; // e.g. LEO Start Your Own Business, EI New Frontiers
  priorIndustryExperienceYears?: number;
  keyPastCompaniesOrTrackRecord?: string; // e.g. 8 years senior dev at Stripe / 5 years head chef
  compiled150WordNarrative: string; // Mandatory for IE LEO min 150 words & UK Innovate UK Q8 Team
  cvReadyForAppendixD: boolean;
  cvFileName?: string;
  cvFileSizeBytes?: number;
  cvUploadedAt?: string;
  cvBase64Data?: string; // Stored base64 data URL for viewing/downloading and bundling into Module L Appendix D
  equitySharePercent?: number;
  isCurrentUserFounder?: boolean;
}

export type TeamStructurePostureType =
  | 'SOLO_FOUNDER_CURRENT'
  | 'CO_FOUNDING_DUO_OR_TRIO'
  | 'FOUNDER_PLUS_KEY_TEAM'
  | 'SOLO_ACTIVELY_RECRUITING_COFOUNDER'
  | 'OTHER';

export interface PromoterProfilesStep1Data {
  teamStructurePosture: TeamStructurePostureType | '';
  otherTeamStructurePostureText?: string;
  teamMembers: TeamMemberProfileItem[];
  executiveTeamCapabilityNarrative: string;
  aiCoachTip?: string;
  lastSavedAt?: string;
  aiEngineUsed?: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export type StartupHatKey =
  | 'VISION_FUNDRAISING'
  | 'PRODUCT_TECH_BUILD'
  | 'SALES_COMMERCIAL_BD'
  | 'MARKETING_GROWTH'
  | 'CUSTOMER_SUCCESS_SUPPORT'
  | 'OPS_LEGAL_COMPLIANCE'
  | 'FINANCE_CASHFLOW_GRANTS';

export type HatConfidenceLevel =
  | 'HIGH_MASTERY'
  | 'LEARNING_ON_THE_JOB'
  | 'SKILL_GAP';

export interface StartupHatAssignment {
  hatKey: StartupHatKey;
  title: string;
  scopeSummary: string;
  primaryOwnerMemberId: string; // member.id or 'FRACTIONAL_EXTERNAL' or 'UNASSIGNED'
  backupOwnerMemberId?: string; // member.id or 'NONE'
  weeklyHours: number;
  confidence: HatConfidenceLevel;
  notes?: string;
}

export interface ExternalAdvisorItem {
  id: string;
  name: string;
  roleOrSpecialty: string; // e.g. "Ex-Stripe VP", "Chartered Accountant", "LEO Mentor"
  organizationOrAffiliation?: string;
  cadence: 'MONTHLY' | 'QUARTERLY' | 'BI_WEEKLY' | 'AD_HOC';
  notes?: string;
}

export interface RoleMatrixStep2Data {
  hatAssignments: StartupHatAssignment[];
  advisors: ExternalAdvisorItem[];
  executiveDivisionSummary: string; // 150-250 word AI/human executive summary for LEO Section 1 & Innovate UK Q8
  lastSavedAt?: string;
  aiCoachTip?: string;
  aiEngineUsed?: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export type SurvivalBudgetPresetType =
  | 'LEAN_SOLO'
  | 'SHARED_HOUSEHOLD'
  | 'FAMILY_MORTGAGE'
  | 'CUSTOM';

export interface FounderSurvivalBudgetItem {
  memberId: string;
  memberName: string;
  presetUsed: SurvivalBudgetPresetType;
  // The 6 Essential Core Buckets (monthly in base currency)
  housingAndUtilities: number; // Rent/Mortgage, Council/Property Tax, Utilities, Broadband
  groceriesAndEssentials: number; // Food, household consumables, personal care
  transportAndCommute: number; // Fuel, car insurance, road tax, public transit
  debtAndLoanCommitments: number; // Credit card mins, car finance, student/personal loans
  dependentsAndFamily: number; // Childcare, school/family essentials, medical
  incomeOffsetCushion: number; // Partner contribution, part-time earnings, passive income
  // Savings & Runway
  personalSavingsBuffer: number; // Liquid cash reserves allocated to personal living runway
  targetSalaryDrawingsDate?: string; // Optional target date when company must begin paying full salary
  notes?: string;
}

export interface SurvivalBudgetStep3Data {
  founderBudgets: FounderSurvivalBudgetItem[];
  currencyCode: string; // e.g. 'EUR', 'GBP'
  lastSavedAt?: string;
  aiCoachTip?: string;
}

// ----------------------------------------------------------------------------
// Step 4: 20 Awkward Co-Founder Questions & The Founder Prenup Engine
// ----------------------------------------------------------------------------

export type AwkwardQuestionKey =
  | 'Q1'
  | 'Q2'
  | 'Q3'
  | 'Q4'
  | 'Q5'
  | 'Q6'
  | 'Q7'
  | 'Q8'
  | 'Q9'
  | 'Q10'
  | 'Q11'
  | 'Q12'
  | 'Q13'
  | 'Q14'
  | 'Q15'
  | 'Q16'
  | 'Q17'
  | 'Q18'
  | 'Q19'
  | 'Q20';

export type AwkwardQuestionCategory =
  | 'TIME_COMMITMENT'
  | 'MONEY_SALARIES'
  | 'ROLES_AUTHORITY'
  | 'EQUITY_VESTING'
  | 'VISION_EXIT';

export interface AwkwardQuestionAnswerItem {
  questionKey: AwkwardQuestionKey;
  selectedOption: string; // matches option value, or 'OTHER'
  otherText?: string;
  privateNote?: string;
}

export interface FounderAlignmentResponseItem {
  memberId: string;
  memberName: string;
  answers: Record<string, AwkwardQuestionAnswerItem>; // key is AwkwardQuestionKey
  completedAt?: string;
}

export interface CoFounderAlignmentStep4Data {
  responses: FounderAlignmentResponseItem[];
  isRevealed: boolean;
  notes?: string;
  lastSavedAt?: string;
  aiCoachTip?: string;
}

// ----------------------------------------------------------------------------
// Step 5: 3-Year Job Creation Plan, Headcount Roadmap & Compensation Models
// ----------------------------------------------------------------------------

export type HiringPostureType =
  | 'CONTRACTOR_LEAN_FIRST'
  | 'CORE_TECH_SWEAT_EQUITY'
  | 'BALANCED_PAYE_HIRING'
  | 'SALES_OPS_LED'
  | 'OTHER';

export type RoleDepartmentType =
  | 'ENGINEERING_PRODUCT'
  | 'SALES_MARKETING'
  | 'OPERATIONS_SUPPORT'
  | 'LEADERSHIP_GA'
  | 'OTHER';

export type EmploymentModeType =
  | 'FULL_TIME'
  | 'PART_TIME'
  | 'CONTRACTOR_RETAINER';

export type CompensationModelType =
  | 'FULL_CASH'
  | 'PURE_SWEAT_EQUITY'
  | 'HYBRID_CASH_EQUITY'
  | 'ADVISORY_EQUITY';

export interface PlannedRoleItem {
  id: string;
  title: string;
  department: RoleDepartmentType;
  otherDepartmentText?: string;
  employmentMode: EmploymentModeType; // FULL_TIME (1.0 FTE), PART_TIME (0.5 FTE), CONTRACTOR_RETAINER (0.0 FTE)
  yearScheduled: 1 | 2 | 3;
  targetQuarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  compensationModel: CompensationModelType;
  // Cash compensation
  grossAnnualSalary: number; // in base currency (€ or £)
  isGrantReimbursableEligible?: boolean; // LEO / Innovate UK candidate
  isRdTaxCreditEligible?: boolean; // R&D relief candidate
  // Sweat equity details
  equityGrantPercent?: number; // e.g. 2.5%
  vestingYears?: number; // default 4
  cliffMonths?: number; // default 12
  sweatEquityMilestoneConditions?: string; // e.g. "Converts to €50k cash on Seed round"
  notes?: string;
}

export interface HiringPlanStep5Data {
  hiringPosture: HiringPostureType;
  otherHiringPostureText?: string;
  roles: PlannedRoleItem[];
  contractorBudgetYear1: number; // monthly or annual freelance budget
  contractorBudgetYear2: number;
  contractorBudgetYear3: number;
  executiveHiringStrategyNarrative?: string;
  lastSavedAt?: string;
  aiCoachTip?: string;
}

// ----------------------------------------------------------------------------
// Overview / Final Brief: Team, Governance & Hiring Brief (Blind-Spot Audit)
// ----------------------------------------------------------------------------

export type TeamBlindSpotCategoryType =
  | 'SINGLE_POINT_OF_FAILURE_OR_BURNOUT'
  | 'EQUITY_VESTING_OR_DEAD_EQUITY_RISK'
  | 'SURVIVAL_RUNWAY_VS_GRANT_DRAWDOWN_GAP'
  | 'DECISION_DEADLOCK_OR_GOVERNANCE_SPLIT'
  | 'PAYROLL_TAX_AND_EMPLOYMENT_LAW_COMPLIANCE'
  | 'SWEAT_EQUITY_TAX_AND_IP_ASSIGNMENT'
  | 'OTHER';

export type TeamBlindSpotSeverityType =
  | 'WATCH'
  | 'IMPORTANT'
  | 'CRITICAL';

export type TeamReadinessConfidenceType =
  | 'READY_FOR_GRANT_AUDIT_AND_LEO_APP_D'
  | 'NEEDS_COFOUNDER_ALIGNMENT_OR_VESTING_SIGN_OFF'
  | 'NEEDS_RUNWAY_EXTENSION_OR_SALARY_BRIDGE'
  | 'NEEDS_KEY_HIRE_OR_ADVISORY_BOARD_APPOINTMENT'
  | 'OTHER';

export interface TeamBlindSpotItem {
  id: string;
  title: string;
  category: TeamBlindSpotCategoryType;
  otherCategoryText?: string;
  severity: TeamBlindSpotSeverityType;
  whyItMatters: string;
  recommendedActionOrFix: string;
  founderMitigationNote?: string;
  isResolved?: boolean;
  isCustom?: boolean;
}

export interface TeamBlindSpotAuditBriefData {
  blindSpots: TeamBlindSpotItem[];
  readinessConfidence: TeamReadinessConfidenceType | '';
  otherReadinessConfidenceText?: string;
  executiveTeamCapabilityNarrative: string; // Tailored for IE LEO Appendix D & UK Innovate UK Team Capability
  governanceAndVestingNarrative: string;
  talentRetentionAndHiringNarrative: string;
  aiCoachTip?: string;
  lastSavedAt?: string;
  aiEngineUsed?: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export interface SavedModuleFData {
  promoterProfiles?: PromoterProfilesStep1Data;
  step2RoleMatrixData?: RoleMatrixStep2Data;
  step3SurvivalBudgetData?: SurvivalBudgetStep3Data;
  step4AlignmentData?: CoFounderAlignmentStep4Data;
  step5HiringPlanData?: HiringPlanStep5Data;
  step6BlindSpotAuditData?: TeamBlindSpotAuditBriefData;
  completionPercentage?: number;
  thingsToConsider?: BlindSpotItem[];
  lastSavedAt?: string;
}

// ==========================================
// MODULE G: LAUNCHPAD & OPERATIONS HUB TYPES
// ==========================================

export interface SavedModuleGData {
  step1: {
    state: 'ALREADY_HAVE' | 'HELP_SETUP';
    legalStructure: 'LTD' | 'SOLE_TRADER' | 'DAC' | 'LLP' | 'OTHER';
    customLegalStructure?: string;
    registeredEntityName: string;
    registrationNumber: string; // CRO / Companies House CRN
    registrationDate: string;
    targetFormationTimeline: string;
    incorporationNotes: string;
    incorporationOrder?: any;
  };
  step2: {
    state: 'ALREADY_HAVE' | 'HELP_SETUP';
    primaryDomain: string;
    isDomainLive: boolean;
    officialBusinessEmail: string;
    emailProvider: 'GOOGLE_WORKSPACE' | 'MICROSOFT_365' | 'HOSTING_MAIL' | 'OTHER';
    customEmailProvider?: string;
    notes: string;
  };
  step3: {
    state: 'ALREADY_HAVE' | 'HELP_SETUP';
    bankProvider: 'REVOLUT_BUSINESS' | 'AIB' | 'BANK_OF_IRELAND' | 'BARCLAYS' | 'TIDE' | 'MONZO' | 'OTHER';
    customBankProvider?: string;
    hasDedicatedIban: boolean;
    ibanLast4: string;
    targetOpeningTimeline: string;
    notes: string;
  };
  step4: {
    state: 'ALREADY_HAVE' | 'HELP_SETUP';
    softwareChoice: 'XERO' | 'QUICKBOOKS' | 'SURF_ACCOUNTS' | 'EXCEL' | 'OTHER';
    customSoftwareChoice?: string;
    hasAccountant: boolean;
    accountantFirmName: string;
    vatStatus: 'NOT_REGISTERED' | 'REGISTERED' | 'PLANNING_TO_REGISTER';
    payrollSetup: 'NONE' | 'DIRECTOR_ONLY' | 'EXTERNAL_BUREAU' | 'IN_HOUSE';
    notes: string;
  };
  step5: {
    state: 'ALREADY_HAVE' | 'HELP_SETUP';
    hasPublicLiability: boolean;
    hasEmployersLiability: boolean;
    hasProfessionalIndemnity: boolean;
    hasProductLiability: boolean;
    currentInsurerName: string;
    policyRenewalDate: string;
    targetCoverageTimeline: string;
    notes: string;
  };
  step6: {
    state: 'ALREADY_HAVE' | 'HELP_SETUP';
    hasIpAssignmentSigned: boolean;
    hasPrivacyPolicy: boolean;
    hasTermsOfService: boolean;
    hasStandardNda: boolean;
    gdprOfficerDesignated: boolean;
    legalAdvisorOrPlatform: string;
    notes: string;
  };
  completionPercentage?: number;
  thingsToConsider?: BlindSpotItem[];
  lastSavedAt?: string;
}

// ==========================================
// MODULE H: REVENUE & PRICING ARCHITECT TYPES
// ==========================================

export type RevenueModelVehicle =
  | 'SUBSCRIPTION_RECURRING'
  | 'ONE_OFF_TRANSACTION'
  | 'SERVICE_PROJECT_HOURLY'
  | 'USAGE_BASED_METERED'
  | 'MARKETPLACE_COMMISSION'
  | 'HARDWARE_PLUS_PLAN'
  | 'OTHER';

export type ProductOfferingStructure = 'SINGLE_OFFERING' | 'MULTI_OFFERING_TIERS';

export interface RevenueModelStep1Data {
  revenueModelVehicle: RevenueModelVehicle;
  otherRevenueModelText?: string;
  offeringStructure: ProductOfferingStructure;
  valueMetric: string; // e.g., "per active user / month", "per physical item shipped"
  billingCadenceDefault: 'MONTHLY' | 'ANNUAL' | 'ONE_OFF' | 'PROJECT_MILESTONE';
  offeringRangeSummary: string; // Plain-English summary of what's being charged
  selectedCurrency: string; // EUR, GBP, USD
  lastSavedAt?: string;
}

export interface PricingTierItem {
  id: string;
  name: string; // e.g. "Starter", "Core Flagship", "Premium Bundle"
  targetPersona: string; // e.g. "Early Adopter / Solopreneur"
  priceGross?: number; // Gross sticker price including VAT (what customer pays at checkout)
  priceNetOfTax: number; // Clean turnover net of tax (required for bank & grant due diligence)
  taxRatePercent: number; // e.g. 23% IE, 20% UK, 0% US
  billingFrequency: 'MONTHLY' | 'ANNUAL' | 'ONE_OFF';
  annualDiscountPercent?: number; // e.g. 20% off if billed annually
  salesMixPercent: number; // e.g. 30%, 60%, 10% (sum = 100%)
  deliverablesSummary: string; // 2-3 key deliverables
  isRecommendedDefault?: boolean;
}

export interface PricingTiersStep2Data {
  tiers: PricingTierItem[];
  blendedAveragePriceNet: number;
  pricingStrategyNotes: string;
  lastSavedAt?: string;
}

export interface FrictionCostsStep3Data {
  paymentGatewayPercent: number; // e.g. 1.7% Stripe
  paymentGatewayFixedCents: number; // e.g. 25c
  directVariableCogsPerUnit: number; // materials, hosting, packaging
  disputeRefundBufferPercent: number; // e.g. 2%
  affiliateCommissionPercent: number; // e.g. 0% - 10%
  lastSavedAt?: string;
}

export interface BreakevenYearTarget {
  yearNumber: 1 | 2 | 3;
  monthlyPayrollBaseline: number; // auto-synced from Mod F
  otherFixedMonthlyOverheads: number;
  customersNeededToBreakeven: number;
  monthlyRevenueAtBreakeven: number;
  monthlyPocketProfitAtTarget: number;
}

export type DebtorPaymentTerms = 'INSTANT_PAYMENT' | 'NET_14_DAYS' | 'NET_30_DAYS' | 'NET_60_DAYS' | 'OTHER';

export interface BreakevenCalculatorStep3Data {
  selectedSimulationYear: 1 | 2 | 3;
  activePriceSlider: number;
  activeCustomerSlider: number;
  frictionCosts: FrictionCostsStep3Data;
  isSandboxActive: boolean;
  sandboxMonthlyPayrollOverride?: number;
  sandboxNotes?: string;
  yearTargets: BreakevenYearTarget[];
  // Grant Assessor Calibration & Working Capital Fields
  paymentTerms?: DebtorPaymentTerms;
  otherPaymentTermsText?: string;
  exportSalesPercent?: number; // 0 to 100%
  exportFocusRegions?: string; // e.g. "UK, EU, US"
  breakevenNarrative?: string; // Written assessor justification for breakeven viability & cashflow
  lastSavedAt?: string;
}

export interface SalesAssumptionsStep4Data {
  salesCycleDays: number; // e.g. 1, 14, 30, 90
  primarySalesMotion: 'SELF_SERVE_WEB' | 'INSIDE_SALES_DEMO' | 'ENTERPRISE_RFP' | 'RETAIL_MARKETPLACE' | 'OTHER';
  otherSalesMotionText?: string;
  expectedConversionRatePercent: number; // e.g. 3%
  expectedMonthlyChurnOrRepeatPercent: number; // e.g. 4% churn or 30% repeat
  teamMonthlyCapacityCap: number; // e.g. max 100 clients before hiring
  capacityFeasibilityStatus?: 'CAPACITY_SURPLUS' | 'CAPACITY_DEFICIT' | 'ALIGNED';
  requiredMonthlyLeads?: number;
  writtenAssumptionsNarrative: string;
  assessorTip?: string;
  lastSavedAt?: string;
}

export interface RevenueBlindSpotAuditStep5Data {
  blindSpots: BlindSpotItem[];
  revenueReadinessConfidence: 'READY_FOR_COMMERCIAL_LAUNCH' | 'PRICING_TESTING_RECOMMENDED' | 'WORKING_CAPITAL_GAP_WARNING' | 'NEEDS_CAPACITY_EXPANSION' | 'OTHER' | '';
  otherReadinessConfidenceText?: string;
  executiveCommercialSummaryNarrative: string;
  aiAssessorTip?: string;
  lastSavedAt?: string;
  aiEngineUsed?: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export interface SavedModuleHData {
  step1RevenueModel?: RevenueModelStep1Data;
  step2PricingTiers?: PricingTiersStep2Data;
  step3BreakevenCalculator?: BreakevenCalculatorStep3Data;
  step4SalesAssumptions?: SalesAssumptionsStep4Data;
  step5RevenueBrief?: RevenueBlindSpotAuditStep5Data;
  completionPercentage?: number;
  thingsToConsider?: BlindSpotItem[];
  lastSavedAt?: string;
}

export type BrandToneOfVoice =
  | 'AUTHORITATIVE_TRUSTED'
  | 'APPROACHABLE_FRIENDLY'
  | 'PLAYFUL_BOLD'
  | 'TECHNICAL_TRANSPARENT'
  | 'PREMIUM_CURATED'
  | 'OTHER';

export interface PositioningStatementFormula {
  targetCustomer: string; // "For [target audience]..."
  customerProblem: string; // "...who struggle with [core problem]..."
  solutionCategory: string; // "...[Startup Name] is a [category/vehicle]..."
  primaryBenefit: string; // "...that provides [key transformation/benefit]..."
  competitiveWedge: string; // "...unlike [alternatives], we [key wedge]..."
}

export interface BrandPositioningStep1Data {
  elevatorHook140: string; // 140-char max elevator hook
  positioningFormula: PositioningStatementFormula;
  toneOfVoice: BrandToneOfVoice;
  otherToneOfVoiceText?: string;
  toneOfVoiceBoundary: {
    weAre: string; // e.g. "Direct, expert, and actionable"
    weAreNever: string; // e.g. "Jargon-filled, cynical, or corporate"
  };
  corePillars: [string, string, string]; // 3 distinct value pillars
  lastSavedAt?: string;
  aiEngineUsed?: 'gemini-2.5-flash' | 'smart-synthesizer';
}

// --- MODULE I STEP 2: THE MODERN 4PS STRATEGY & CHANNEL DISTRIBUTION MATRIX ---

export type ProductPackagingType =
  | 'DIGITAL_SAAS_CLOUD'
  | 'PHYSICAL_D2C_PRODUCT'
  | 'HIGH_TOUCH_SERVICE'
  | 'MARKETPLACE_PLATFORM'
  | 'HYBRID_HARDWARE_SOFTWARE'
  | 'OTHER';

export interface FourPsProductP1 {
  packagingType: ProductPackagingType;
  otherPackagingTypeText?: string;
  coreDeliverableSummary: string; // What exactly does the buyer receive upon purchase?
  perceivedValueDriver: string; // e.g. White-glove onboarding, proprietary templates, SLA guarantee, unboxing experience
}

export type PricingStanceType =
  | 'VALUE_BASED_PREMIUM'
  | 'COMPETITIVE_PARITY'
  | 'PENETRATION_LOSS_LEADER'
  | 'FREEMIUM_EXPAND'
  | 'TIERED_FLAT_SUBSCRIPTION'
  | 'USAGE_BASED_METERED'
  | 'OTHER';

export interface FourPsPriceP2 {
  pricingStance: PricingStanceType;
  otherPricingStanceText?: string;
  headlinePricePoint: string; // e.g. "€49/month" or "£120/order"
  priceJustification: string; // Why the customer feels this is a bargain compared to the cost of inaction
  paymentTermsOrFrictionReducer: string; // e.g. "14-day free trial, no credit card required", "Pay on invoice 30 days"
}

export type PrimaryDistributionChannel =
  | 'DIRECT_WEB_SELF_SERVE'
  | 'OUTBOUND_DIRECT_SALES'
  | 'MARKETPLACE_APPSTORE'
  | 'PARTNER_RESELLER_NETWORK'
  | 'EVENTS_RETAIL_COMMUNITY'
  | 'OTHER';

export interface FourPsPlaceP3 {
  primaryChannel: PrimaryDistributionChannel;
  otherPrimaryChannelText?: string;
  secondaryChannels: string[];
  customerJourneyFrictionPoint: string; // Risk of friction/drop-off
  frictionMitigationPlan: string; // Concrete tactical mitigation
}

export type PrimaryAcquisitionEngine =
  | 'FOUNDER_LED_ORGANIC'
  | 'OUTBOUND_ACCOUNT_BASED'
  | 'SEARCH_INTENT_SEO'
  | 'PAID_PERFORMANCE_ADS'
  | 'COMMUNITY_PARTNERSHIP'
  | 'OTHER';

export interface FourPsPromotionP4 {
  primaryAcquisitionEngine: PrimaryAcquisitionEngine;
  otherAcquisitionEngineText?: string;
  beachheadChannelTactics: string; // Step-by-step description of the single beachhead channel
  primarySocialHub: string; // e.g. LinkedIn, X/Twitter, Instagram, YouTube, Discord, etc.
  contentOrCampaignHook: string; // First headline asset or hook
}

export interface Modern4PsStep2Data {
  productP1: FourPsProductP1;
  priceP2: FourPsPriceP2;
  placeP3: FourPsPlaceP3;
  promotionP4: FourPsPromotionP4;
  digitalPresenceChecklist: {
    hasLandingPage: boolean;
    hasDomainEmail: boolean;
    hasAnalyticsTracking: boolean;
    hasSocialProofOrWaitlist: boolean;
  };
  strategicRationale?: string;
  lastSavedAt?: string;
  aiEngineUsed?: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export type First10AcquisitionArchetype =
  | 'WARM_NETWORK_ROLODEX'
  | 'ACCOUNT_BASED_SNIPER'
  | 'COMMUNITY_ADVISORY_COUNCIL'
  | 'MANUAL_CONCIERGE_PILOT'
  | 'EXCLUSIVE_FOUNDING_COHORT'
  | 'OTHER';

export type PipelineProspectStatus =
  | 'TO_CONTACT'
  | 'CONTACTED'
  | 'MEETING_SET'
  | 'PILOT_AGREED'
  | 'CONVERTED_PAID'
  | 'DISQUALIFIED';

export interface First10ProspectItem {
  id: string;
  companyOrPersona: string;
  decisionMakerTitle: string;
  triggerEventOrAngle: string;
  status: PipelineProspectStatus;
  source: 'MANUAL' | 'MODULE_C_WAITLIST' | 'MODULE_C_SURVEY' | 'MODULE_C_INTERVIEW';
  notes?: string;
}

export interface First10PilotOffer {
  pilotStructure: string;
  quidProQuoFounderAsk: string;
  riskReversal: string;
}

export interface First10OutreachScripts {
  advisoryScript: string;
  sniperScript: string;
  foundingCohortScript: string;
}

export interface First10FollowUpCadence {
  day1Icebreaker: string;
  day4Bump: string;
  day8MicroQuestion: string;
  day14Breakup: string;
}

export interface First10ObjectionBusters {
  vendorRisk: string;
  statusQuoInertia: string;
  featureGap: string;
  objection1Title?: string;
  objection1Quote?: string;
  objection2Title?: string;
  objection2Quote?: string;
  objection3Title?: string;
  objection3Quote?: string;
}

export interface First10LetterOfIntent {
  targetCompanyName: string;
  targetContactName: string;
  pilotDurationWeeks: number;
  pilotPricePoint: string;
  primarySuccessKpi: string;
  customTermsText?: string;
  generatedLoiMarkdown: string;
}

export interface First10PlaybookStep3Data {
  acquisitionArchetype: First10AcquisitionArchetype;
  otherAcquisitionArchetypeText?: string;
  strategicRationale?: string;
  pilotOffer: First10PilotOffer;
  targetPipeline: First10ProspectItem[];
  outreachScripts: First10OutreachScripts;
  followUpCadence: First10FollowUpCadence;
  objectionBusters: First10ObjectionBusters;
  letterOfIntent: First10LetterOfIntent;
  lastSavedAt?: string;
  aiEngineUsed?: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export type BudgetGoalPreset =
  | 'FIRST_10_PILOT'
  | 'MOD_H_Y1_BREAKEVEN'
  | 'MOD_H_Y2_SCALE'
  | 'MOD_H_Y3_SCALE'
  | 'CUSTOM_TARGET'
  | 'OTHER';

export type MarketingBudgetBucketType =
  | 'PAID_MEDIA_ADS'
  | 'GROWTH_STACK_TOOLS'
  | 'CONTENT_EVENTS_PR'
  | 'OTHER';

export type MarketingGrantEligibilityStatus =
  | 'ELIGIBLE_CAPABILITY_OR_EXPORT'
  | 'INELIGIBLE_ONGOING_AD_SPEND'
  | 'WORKING_CAPITAL_LOAN_ELIGIBLE';

export type LtvPurchaseModelType =
  | 'RECURRING_SUBSCRIPTION'
  | 'SINGLE_ONE_TIME_PURCHASE'
  | 'REPEAT_PURCHASE_ORDERS'
  | 'OTHER';

export type PaidAdsViabilityDecision =
  | 'ACTIVE'
  | 'OPTED_OUT_UNPROFITABLE'
  | 'DEFERRED_POST_PMF';

export interface MarketingBudgetLineItem {
  id: string;
  bucket: MarketingBudgetBucketType;
  otherBucketText?: string;
  channelOrToolName: string;
  monthlySpend: number;
  grantEligibilityStatus: MarketingGrantEligibilityStatus;
  notes: string;
}

export interface MarketingBudgetStep4Data {
  goalPreset: BudgetGoalPreset;
  otherGoalPresetText?: string;
  targetMonthlyNewCustomers: number;
  deductWarmPipelineLeads: boolean;
  leadToCustomerConversionPercent: number;
  visitorToLeadConversionPercent: number;
  paidTrafficSharePercent: number;
  estimatedCostPerClickOrTouch: number;
  founderHourlyShadowRate: number;
  minutesPerOrganicOutreachOrPiece: number;
  ltvPurchaseModel?: LtvPurchaseModelType;
  otherLtvPurchaseModelText?: string;
  averageCustomerRetentionMonths: number;
  budgetLineItems: MarketingBudgetLineItem[];
  totalPlannedMonthlyMarketingSpend: number;
  calculatedCashCac: number;
  calculatedFullyLoadedCac: number;
  calculatedLtv: number;
  calculatedLtvToCacRatio: number;
  calculatedPaybackMonths: number;
  weeklyFounderMarketingHours: number;
  paidAdsViabilityDecision?: PaidAdsViabilityDecision;
  excludePaidAdsFromModuleJ?: boolean;
  syncedToModuleJOverheads: boolean;
  lastSyncedToModuleJAt?: string;
  cacAndBudgetNarrative: string;
  grantAssessorTip?: string;
  lastSavedAt?: string;
  aiEngineUsed?: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export type MarketingReadinessConfidence =
  | 'ORGANIC_FIRST_10_READY'
  | 'SCALABLE_HYBRID_FUNNEL'
  | 'BOOTSTRAPPED_ZERO_AD_SPEND'
  | 'NEEDS_CONVERSION_TESTING'
  | 'OTHER'
  | '';

export interface MarketingExecutiveBriefStep5Data {
  blindSpots: BlindSpotItem[];
  marketingReadinessConfidence: MarketingReadinessConfidence;
  otherReadinessConfidenceText?: string;
  executiveMarketingSummaryNarrative: string;
  aiAssessorTip?: string;
  lastSavedAt?: string;
  aiEngineUsed?: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export interface SavedModuleIData {
  step1Positioning?: BrandPositioningStep1Data;
  step2FourPs?: Modern4PsStep2Data;
  step3First10?: First10PlaybookStep3Data;
  step4Budget?: MarketingBudgetStep4Data;
  step5MarketingBrief?: MarketingExecutiveBriefStep5Data;
  completionPercentage?: number;
  thingsToConsider?: BlindSpotItem[];
  lastSavedAt?: string;
}

// --- MODULE J: 3-YEAR FINANCIALS, 36-MONTH CASHFLOW & LOCALIZED TAX AUTO-PILOT ---

export type FinanceViewLanguageMode = 'PLAIN_ENGLISH_FOUNDER' | 'OFFICIAL_GRANT_ACCOUNTANT';

export type OperatingCostPostureType =
  | 'BOOTSTRAPPED_HOME_LEAN'
  | 'HYBRID_COWORKING_GROWTH'
  | 'COMMERCIAL_PREMISES_TEAM'
  | 'HIGH_VELOCITY_VENTURE'
  | 'OTHER';

export type OverheadBucketCategory =
  | 'PREMISES_RENT_UTILITIES'
  | 'SOFTWARE_CLOUD_AI'
  | 'MARKETING_GROWTH_EVENTS'
  | 'ACCOUNTING_LEGAL_COMPLIANCE'
  | 'INSURANCE_STATUTORY'
  | 'TRAVEL_ADMIN_SUNDRIES'
  | 'OTHER';

export type VatRegistrationStrategyType =
  | 'REGISTERED_FROM_DAY_1'
  | 'REGISTER_AT_THRESHOLD'
  | 'VAT_EXEMPT_OR_BELOW'
  | 'OTHER';

export type OverheadGrantEligibilityTag =
  | 'ELIGIBLE_INNOVATION_OR_EXPORT'
  | 'WORKING_CAPITAL_LOAN_ELIGIBLE'
  | 'INELIGIBLE_ROUTINE_OPEX';

export interface FinancialOverheadLineItem {
  id: string;
  category: OverheadBucketCategory;
  otherCategoryText?: string;
  plainEnglishLabel: string;
  accountantLabel: string;
  sourceModuleLabel: string;
  monthlyCostYear1: number;
  annualStepUpPercentYear2: number; // e.g. 15% increase in Y2
  annualStepUpPercentYear3: number; // e.g. 20% increase in Y3
  grantEligibilityTag: OverheadGrantEligibilityTag;
  notes: string;
}

export interface FinancialOverheadsTaxStep1Data {
  viewLanguageMode: FinanceViewLanguageMode;
  operatingCostPosture: OperatingCostPostureType;
  otherOperatingCostPostureText?: string;
  overheadLineItems: FinancialOverheadLineItem[];
  // Payroll & Survival Sync (from Module F & Module H)
  monthlyFounderDrawingsYear1: number;
  monthlyTeamSalariesYear1: number;
  monthlyTeamSalariesYear2: number;
  monthlyTeamSalariesYear3: number;
  autoApplyEmployerPayrollTax: boolean;
  employerPayrollTaxRatePercent: number; // e.g. 11.15% IE PRSI or 16.8% UK NIC + Pension
  corporationTaxRatePercent: number; // e.g. 12.5% IE or 19% UK Small Profits
  // VAT & Export Guardrails
  vatRegistrationStrategy: VatRegistrationStrategyType;
  otherVatRegistrationStrategyText?: string;
  standardVatRatePercent: number; // e.g. 23% IE or 20% UK
  exportRevenueSharePercent: number; // 0 to 100% (Mandatory for IE LEO & EI)
  exportTargetMarketsSummary: string;
  // CapEx Depreciation Sync (from Module E)
  totalCapExEquipmentValue: number;
  capExDepreciationYears: number; // default 3 years (36 months)
  // Written justification & AI tips
  overheadsAndTaxNarrative: string;
  grantAssessorTip?: string;
  lastSyncedFromUpstreamAt?: string;
  lastSavedAt?: string;
  aiEngineUsed?: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export type CustomerCollectionTimingType =
  | 'INSTANT_CARD_STRIPE_0'
  | 'NET_15_INVOICE'
  | 'NET_30_STANDARD_B2B'
  | 'NET_60_ENTERPRISE_RETAIL'
  | 'OTHER';

export type InventoryStockTimingType =
  | 'NO_PHYSICAL_STOCK_DIGITAL'
  | 'PAY_ON_DELIVERY_30_DAYS'
  | 'IMPORT_MANUFACTURING_60_90_DAYS'
  | 'OTHER';

export type SeasonalityRampCurveType =
  | 'STEADY_LINEAR_RAMP'
  | 'SLOW_B2B_H2_WEIGHTED'
  | 'Q4_RETAIL_GIFTING_PEAK'
  | 'SUMMER_HOSPITALITY_PEAK'
  | 'OTHER';

export interface WorkingCapitalTimingStep2Data {
  customerCollectionTiming: CustomerCollectionTimingType;
  otherCustomerCollectionTimingText?: string;
  customDebtorDays?: number;
  inventoryStockTiming: InventoryStockTimingType;
  otherInventoryStockTimingText?: string;
  upfrontStockMonthsBuffer: number;
  seasonalityRampCurve: SeasonalityRampCurveType;
  otherSeasonalityRampCurveText?: string;
  monthToStartRevenue: number; // 1 to 12 (e.g. Month 1 or Month 3 after build)
  workingCapitalNarrative: string;
  grantAssessorTip?: string;
  lastSavedAt?: string;
  aiEngineUsed?: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export type PrimaryFundingStrategyType =
  | 'BOOTSTRAPPED_FOUNDER_SAVINGS'
  | 'GRANT_PLUS_MATCH_FUNDING'
  | 'STARTUP_LOAN_DEBT_BRIDGE'
  | 'ANGEL_SEIS_EIS_ROUND'
  | 'OTHER';

export type FundingSourceCategoryType =
  | 'FOUNDER_SAVINGS_EQUITY'
  | 'LEO_EI_INNOVATE_GRANT'
  | 'STARTUP_LOAN_MICROFINANCE'
  | 'ANGEL_SEIS_EIS_EQUITY'
  | 'OTHER';

export interface FundingSourceLineItem {
  id: string;
  sourceType: FundingSourceCategoryType;
  otherSourceTypeText?: string;
  label: string;
  amount: number;
  isReimbursementArrears: boolean; // True for LEO / Innovate UK grants paid after spend
  reimbursementLagMonths: number; // e.g. 2 or 3 months lag
}

export interface CashflowFundingGapStep3Data {
  primaryFundingStrategy?: PrimaryFundingStrategyType;
  otherPrimaryFundingStrategyText?: string;
  startingCashBalanceDay1: number;
  safetyBufferPercent: number; // default 20%
  fundingSources: FundingSourceLineItem[];
  loanInterestRatePercent: number; // e.g. 6% UK Start Up Loan / MFI
  loanTermMonths: number; // e.g. 36 or 60 months
  fundingGapNarrative: string;
  grantAssessorTip?: string;
  lastSavedAt?: string;
  aiEngineUsed?: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export type FinancialStressScenarioType =
  | 'BASE_CASE_OFFICIAL'
  | 'DELAYED_LAUNCH_3_MO'
  | 'UNDERWRITER_STRESS_TEST'
  | 'OTHER';

export type CorporateIpReadinessStatusType =
  | 'LTD_INCORPORATED_IP_ASSIGNED'
  | 'INCORPORATION_IN_PROGRESS'
  | 'SOLE_TRADER_PRE_INCORPORATION'
  | 'OTHER';

export interface StatementsStressTestStep4Data {
  activeStressScenario: FinancialStressScenarioType;
  otherStressScenarioText?: string;
  customRevenueHaircutPercent?: number;
  customCostInflationPercent?: number;
  customDelayMonths?: number;
  corporateIpReadinessStatus?: CorporateIpReadinessStatusType;
  otherCorporateIpReadinessStatusText?: string;
  writtenFinancialAssumptionsBlock: string;
  corporateIpPlaceholderNotes?: string;
  grantAssessorTip?: string;
  lastSavedAt?: string;
  aiEngineUsed?: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export type FinanceReadinessConfidence =
  | 'BANK_AND_GRANT_UNDERWRITING_READY'
  | 'BOOTSTRAP_CASHFLOW_SELF_FUNDED'
  | 'REQUIRES_BRIDGE_OR_LOAN_FACILITY'
  | 'NEEDS_UNIT_ECONOMICS_RECALIBRATION'
  | 'OTHER'
  | '';

export interface FinanceBlindSpotItem {
  id: string;
  title: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  description: string;
  actionableFix: string;
}

export interface FinanceExecutiveBriefStep5Data {
  blindSpots: FinanceBlindSpotItem[];
  financeReadinessConfidence: FinanceReadinessConfidence;
  otherReadinessConfidenceText?: string;
  executiveFinancialSummaryNarrative: string;
  aiAssessorTip?: string;
  lastSavedAt?: string;
  aiEngineUsed?: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export interface SavedModuleJData {
  step1OverheadsTax?: FinancialOverheadsTaxStep1Data;
  step2WorkingCapital?: WorkingCapitalTimingStep2Data;
  step3CashflowGap?: CashflowFundingGapStep3Data;
  step4Statements?: StatementsStressTestStep4Data;
  step5FinanceBrief?: FinanceExecutiveBriefStep5Data;
  completionPercentage?: number;
  thingsToConsider?: BlindSpotItem[];
  lastSavedAt?: string;
}

// ============================================================================
// MODULE K (NON-DILUTIVE GRANTS, LOANS & TAX RELIEF HUB) TYPES
// ============================================================================

export type ModuleKGrantKey =
  | 'IE_LEO_FEASIBILITY'
  | 'IE_LEO_PRIMING'
  | 'IE_LEO_GROW_DIGITAL_AI'
  | 'IE_EI_PSSF'
  | 'IE_REVENUE_SURE_TAX_RELIEF'
  | 'IE_EI_EII_INVESTOR_RELIEF'
  | 'GB_BBB_START_UP_LOAN'
  | 'GB_INNOVATE_UK_SMART'
  | 'GB_HMRC_SEIS_ASSURANCE'
  | 'GB_GROWTH_HUB_MATCH';

export interface ModuleKStep1AuditSavedData {
  selectedGrantKey: ModuleKGrantKey;
  targetCountry: 'IE' | 'GB';
  overallAssessorReadinessScore: number;
  stackedFundingRoadmapSelected: boolean;
  activeFilterTab: 'ALL' | 'NEEDS_ACTION' | 'PASSED';
  founderNotes: string;
  lastAuditedAt?: string;
  aiAuditOverview?: string;
  aiAssessorTip?: string;
  aiEngineUsed?: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export type CapitalStackPresetType =
  | 'NON_DILUTIVE_LEO_BOOTSTRAP'
  | 'BALANCED_GRANT_PLUS_FOUNDER_SAVINGS'
  | 'MAX_GOV_DEBT_BRIDGE'
  | 'ANGEL_MATCH_ACCELERATOR'
  | 'OTHER';

export interface CapitalAllocationTierItem {
  id: string;
  sourceKey:
    | 'FOUNDER_SAVINGS_EQUITY'
    | 'PRIMARY_GRANT'
    | 'SECONDARY_GRANT'
    | 'GOV_BACKED_LOAN'
    | 'ANGEL_INVESTOR_EQUITY'
    | 'OTHER';
  label: string;
  amount: number;
  percentageOfGap: number;
  isDilutive: boolean;
  equityDilutionPercent?: number; // e.g. 5% for angel piece
  matchComplianceRatio?: number; // e.g. 50%
  description: string;
}

export interface ModuleKStep2CapitalStackSavedData {
  presetUsed: CapitalStackPresetType;
  otherPresetText?: string;
  totalTargetFundingGap: number; // Inherited from Module J or calibrated
  fundingSources: CapitalAllocationTierItem[];
  skinInTheGameCash: number;
  totalGrantsAllocated: number;
  totalLoansAllocated: number;
  totalAngelAllocated: number;
  skinInTheGamePercent: number;
  projectedEquityDilutionPercent: number;
  assessorSoundnessScore: number;
  fundingStrategyNarrative: string;
  lastSavedAt?: string;
  aiEngineUsed?: 'gemini-2.5-flash' | 'smart-synthesizer';
}

export type ReimbursementBridgeStrategyType =
  | 'FOUNDER_DIRECTOR_LOAN_BUFFER'
  | 'MICROFINANCE_OR_STARTUP_LOAN_BRIDGE'
  | 'SUPPLIER_60_DAY_STAGGERED_TERMS'
  | 'REVOLVING_CREDIT_LINE'
  | 'OTHER';

export interface ModuleKStep3ReimbursementBridgeSavedData {
  grantEligibleVouchedBudget: number; // e.g. €40k–€80k total project cost
  expectedGrantDrawdownAmount: number; // e.g. €20k–€40k (50%)
  estimatedClaimTurnaroundWeeks: number; // e.g. 8–16 weeks (60–120 days)
  bridgeStrategy: ReimbursementBridgeStrategyType;
  otherBridgeStrategyText?: string;
  minimumLiquidityBufferRequired: number; // Liquid cash required to pay invoices upfront
  actualConfirmedBridgeLiquidity: number; // Founder cash + loans currently available
  liquiditySafetySurplusOrDeficit: number; // confirmed - required
  isAssessorLiquidityCompliant: boolean; // true if surplus >= 0
  vendorPaymentTermsDays: 30 | 60 | 90;
  bridgeRiskMitigationNarrative: string;
  aiAssessorTip?: string;
  aiEngineUsed?: 'gemini-2.5-flash' | 'smart-synthesizer';
  lastSavedAt?: string;
}

export type InvestorTaxReliefSchemeType =
  // UK Schemes
  | 'GB_SEIS_SEED_ENTERPRISE'
  | 'GB_EIS_ENTERPRISE_INVESTMENT'
  // Irish Schemes
  | 'IE_SURE_FOUNDER_PAYE_REFUND'
  | 'IE_EII_EMPLOYMENT_INVESTMENT_INCENTIVE'
  | 'IE_SCIS_SMALL_COMPANY_INVESTMENT'
  | 'OTHER';

export interface ModuleKStep4TaxReliefSavedData {
  primaryTaxScheme: InvestorTaxReliefSchemeType;
  otherTaxSchemeText?: string;
  targetReliefRaiseAmount: number; // e.g. £150,000 SEIS or €100,000 EII / SURE
  investorReliefPercentage: number; // e.g. 50% for SEIS, 40-50% for EII, up to 41% for SURE
  estimatedInvestorTaxSavings: number; // e.g. £75,000 tax back for investors
  founderPriorEmploymentYearsForSure?: number; // 1 to 6 years for SURE
  founderEstimatedPayeRefundForSure?: number; // e.g. up to €100k+
  advanceAssuranceStatus: 'NOT_STARTED' | 'PREPARING_PACK' | 'SUBMITTED' | 'APPROVED';
  grossAssetsWithinThreshold: boolean; // UK SEIS < £350k / IE EII micro cap
  lessThan250Employees: boolean; // Statutory qualification
  qualifyingTradeStatus: 'QUALIFYING' | 'EXCLUDED_TRADE_CHECK_REQUIRED';
  taxCatalystPitchNarrative: string;
  aiAssessorTip?: string;
  aiEngineUsed?: 'gemini-2.5-flash' | 'smart-synthesizer';
  lastSavedAt?: string;
}

export interface GrantRoadmapPhaseItem {
  phaseNumber: number; // 1, 2, 3...
  grantOrFundingName: string;
  agency: string;
  amountFormatted: string;
  timingTrigger: string; // e.g. "Immediate (Months 1–3) — Pre-Trading / MVP"
  prerequisites: string; // e.g. "Company incorporated, 50% matching cash locked in bank"
  unlocksNext: string; // e.g. "Validates prototype to unlock LEO Priming or Seed round"
}

export interface ModuleKStep5FundingBriefSavedData {
  executiveSummary: string;
  fundingRoadmap: GrantRoadmapPhaseItem[];
  assessorReadinessScore: number; // 0 - 100%
  underwriterContradictionFlags: string[];
  recommendedActionChecklist: string[];
  moduleLGrantMode: 'IE_LEO' | 'UK_INNOVATE_UK' | 'UK_START_UP_LOANS' | 'HMRC_SEIS' | 'STANDARD';
  aiAssessorTip?: string;
  aiEngineUsed?: 'gemini-2.5-flash' | 'smart-synthesizer';
  lastSavedAt?: string;
}

export interface SavedModuleKData {
  step1Audit?: ModuleKStep1AuditSavedData;
  step2CapitalStack?: ModuleKStep2CapitalStackSavedData;
  step3ReimbursementBridge?: ModuleKStep3ReimbursementBridgeSavedData;
  step4TaxRelief?: ModuleKStep4TaxReliefSavedData;
  step5FundingBrief?: ModuleKStep5FundingBriefSavedData;
  completionPercentage?: number;
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

export interface SavedMasterDocumentData {
  paragraph1OpportunityAndMarket: string;
  paragraph1Sources: string[];
  paragraph2ValidationAndProduct: string;
  paragraph2Sources: string[];
  paragraph3OperationsAndExecution: string;
  paragraph3Sources: string[];
  isCustomEdited?: boolean;
  showUpcomingChaptersRoadmap?: boolean;
  lastWeavedAt?: string;
  lastSavedAt?: string;
  aiEngineUsed?: 'gemini-2.5-flash' | 'smart-synthesizer';
}

// ============================================================================
// MODULE L (INTERACTIVE BUSINESS PLAN & OFFICIAL GRANT COMPILER) TYPES
// ============================================================================

export type ModuleLCompilerModeType =
  | 'IE_LEO_OFFICIAL_FORM'
  | 'UK_INNOVATE_UK_9Q'
  | 'UK_START_UP_LOANS_WORKBOOK'
  | 'INVESTOR_SEIS_EIS_EII_PACK'
  | 'STANDARD_COMMERCIAL_PLAN'
  | 'OTHER';

export type ModuleLNarrativeToneType =
  | 'EVIDENCE_LED_ASSESSOR'
  | 'UNDERWRITER_CONSERVATIVE'
  | 'VENTURE_GROWTH_THESIS'
  | 'PLAIN_ENGLISH_OPERATOR'
  | 'OTHER';

export type ModuleLSubmissionObjectiveType =
  | 'NON_DILUTIVE_CAPITAL_GRANT'
  | 'GOVERNMENT_LOAN_APPROVAL'
  | 'TAX_RELIEF_CLEARANCE_AND_SEED'
  | 'BANK_OR_COMMERCIAL_PARTNERSHIP'
  | 'OTHER';

export type ModuleLSubmissionWindowType =
  | 'IMMEDIATE_THIS_MONTH'
  | 'NEXT_30_TO_60_DAYS'
  | 'UPCOMING_QUARTER_COHORT'
  | 'INTERNAL_BOARD_ALIGNMENT'
  | 'OTHER';

export interface ModuleLStep1ModeSavedData {
  compilerMode: ModuleLCompilerModeType;
  otherCompilerModeText?: string;
  narrativeTone: ModuleLNarrativeToneType;
  otherNarrativeToneText?: string;
  submissionObjective: ModuleLSubmissionObjectiveType;
  otherSubmissionObjectiveText?: string;
  submissionWindow: ModuleLSubmissionWindowType;
  otherSubmissionWindowText?: string;
  targetAgencyOrCommitteeName: string;
  targetFundingAskAmount: number;
  includeAppendicesBinder: boolean;
  strictWordCountEnforcement: boolean;
  compilerMandateNotes: string;
  aiAssessorTip?: string;
  aiEngineUsed?: 'gemini-2.5-flash' | 'smart-synthesizer';
  lastSavedAt?: string;
}

export interface ModuleLContradictionAuditItem {
  id: string;
  category:
    | 'PRICING_VS_VALIDATION'
    | 'PAYROLL_VS_HEADCOUNT'
    | 'CASHFLOW_VS_CAPITAL_STACK'
    | 'PROCUREMENT_ELIGIBILITY'
    | 'STATUTORY_AND_IP'
    | 'EXPORT_AND_DISPLACEMENT';
  title: string;
  status: 'PASSED' | 'WARNING' | 'CRITICAL';
  detail: string;
  assessorImpact: string;
  targetModuleCode:
    | 'MOD_A_IDEATION'
    | 'MOD_B_MARKET'
    | 'MOD_C_SURVEYS_FEEDBACK'
    | 'MOD_D_PRODUCT_BUILD'
    | 'MOD_E_OPERATIONS'
    | 'MOD_F_COFOUNDER_TEAM'
    | 'MOD_G_LAUNCHPAD'
    | 'MOD_H_REVENUE'
    | 'MOD_I_MARKETING'
    | 'MOD_J_FINANCE'
    | 'MOD_K_GRANTS_FUNDING';
  targetStep?: number;
  resolvedOrAcknowledged?: boolean;
}

export interface ModuleLStep2ContradictionAuditSavedData {
  overallAuditScore: number;
  auditItems: ModuleLContradictionAuditItem[];
  acknowledgedItemIds: string[];
  preFlightDefenseSummary: string;
  aiAssessorTip?: string;
  aiEngineUsed?: 'gemini-2.5-pro' | 'gemini-2.5-flash' | 'smart-synthesizer';
  lastAuditedAt?: string;
  lastSavedAt?: string;
}

export interface ModuleLCompiledSectionItem {
  id: string;
  sectionNumber: number;
  title: string;
  assessorQuestionPrompt: string;
  scoringWeightPercent: number;
  wordLimit: number;
  sourceModules: string[];
  compiledResponseText: string;
  isCustomEdited?: boolean;
}

export interface ModuleLStep3NarrativeCompilerSavedData {
  modeCompiledFor: ModuleLCompilerModeType;
  sections: ModuleLCompiledSectionItem[];
  executiveHookStatement: string;
  aiAssessorTip?: string;
  aiEngineUsed?: 'gemini-2.5-pro' | 'gemini-2.5-flash' | 'smart-synthesizer';
  lastSavedAt?: string;
}

export interface ModuleLAppendixBinderItem {
  code: 'APPENDIX_A' | 'APPENDIX_B' | 'APPENDIX_C' | 'APPENDIX_D' | 'APPENDIX_E' | 'APPENDIX_F';
  title: string;
  included: boolean;
  readinessStatus: 'VERIFIED_READY' | 'PARTIAL_DATA' | 'MISSING_ACTION_REQUIRED';
  sourceModuleCode:
    | 'MOD_C_SURVEYS_FEEDBACK'
    | 'MOD_D_PRODUCT_BUILD'
    | 'MOD_E_OPERATIONS'
    | 'MOD_F_COFOUNDER_TEAM'
    | 'MOD_G_LAUNCHPAD'
    | 'MOD_J_FINANCE'
    | 'MOD_K_GRANTS_FUNDING';
  signOffNote: string;
}

export interface ModuleLStep4AppendicesSavedData {
  appendices: ModuleLAppendixBinderItem[];
  declarationConfirmed: boolean;
  signatoryName: string;
  signatoryTitle: string;
  lastSavedAt?: string;
}

export interface ModuleLStep5SubmissionBriefSavedData {
  executiveDossierSummary: string;
  committeeReadinessScore: number;
  finalSubmissionChecklist: string[];
  aiAssessorTip?: string;
  aiEngineUsed?: 'gemini-2.5-pro' | 'gemini-2.5-flash' | 'smart-synthesizer';
  lastSavedAt?: string;
}

export type BusinessPlanArchetype =
  | 'IE_LEO_OFFICIAL_GRANT'
  | 'UK_INNOVATE_UK_9Q'
  | 'UK_START_UP_LOANS_WORKBOOK'
  | 'COMMERCIAL_BANK_LOAN'
  | 'INVESTOR_ANGEL_MEMO'
  | 'LEAN_ONE_PAGER'
  | 'STANDARD_COMPREHENSIVE_PLAN';

export interface BusinessPlanVersionItem {
  id: string;
  title: string;
  archetype: BusinessPlanArchetype;
  createdAt: string;
  lastEditedAt: string;
  isPrimary?: boolean;
  targetAudience: 'GRANT_COMMITTEE' | 'COMMERCIAL_BANK' | 'ANGEL_INVESTOR' | 'ADVISOR_BOARD' | 'INTERNAL_TEAM';
  targetTone: 'EVIDENCE_LED_ASSESSOR' | 'UNDERWRITER_CONSERVATIVE' | 'VENTURE_HIGH_GROWTH' | 'EXECUTIVE_CRISP';
  targetFundingAsk?: number;
  sections: ModuleLCompiledSectionItem[];
  executiveHookStatement?: string;
  auditScore?: number;
  auditItems?: ModuleLContradictionAuditItem[];
  lastAuditedAt?: string;
  appendices?: ModuleLAppendixBinderItem[];
}

export type GrantApplicationStatusType =
  | 'NOT_STARTED'
  | 'PREPARING_PLAN'
  | 'ADVISOR_CALL_BOOKED'
  | 'PORTAL_SUBMITTED'
  | 'APPROVED_WON'
  | 'UNSUCCESSFUL';

export interface SavedCustomPortalQuestion {
  id: string;
  grantSlug?: string;
  questionText: string;
  targetLength: 'SHORT' | 'STANDARD' | 'DETAILED';
  assessorLens: 'ECONOMIC_EXPORT' | 'R_AND_D_INNOVATION' | 'UNDERWRITING_REPAYMENT' | 'COMMERCIAL_INVESTOR';
  answerText: string;
  sourceModuleCitations: string[];
  missingDataWarnings?: string[];
  askedAt: string;
  lastEditedAt?: string;
}

export interface SavedGrantApplicationTracker {
  grantSlug: string;
  status: GrantApplicationStatusType;
  selectedLeoOfficeId?: string;
  advisorName?: string;
  advisorCallDate?: string;
  submissionDate?: string;
  portalReferenceNumber?: string;
  targetAskAmount?: number;
  founderNotes?: string;
  completedChecklistKeys?: string[];
  lastUpdatedAt?: string;
}

export interface SavedGrantCenterData {
  applications?: Record<string, SavedGrantApplicationTracker>;
  customQuestions?: SavedCustomPortalQuestion[];
  activeGrantSlug?: string;
  lastVisitedAt?: string;
}

export interface SavedModuleLData {
  step1Mode?: ModuleLStep1ModeSavedData;
  step2Audit?: ModuleLStep2ContradictionAuditSavedData;
  step3Compiler?: ModuleLStep3NarrativeCompilerSavedData;
  step4Appendices?: ModuleLStep4AppendicesSavedData;
  step5DossierBrief?: ModuleLStep5SubmissionBriefSavedData;
  versions?: BusinessPlanVersionItem[];
  activeVersionId?: string;
  completionPercentage?: number;
  thingsToConsider?: BlindSpotItem[];
  lastSavedAt?: string;
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
  fundingTrackMode?: 'GRANT_AND_INVESTOR' | 'COMMERCIAL_ONLY';
  currentModuleStep: string;
  isPivot?: boolean;
  brainDumpText?: string;
  conceptCanvas?: SavedConceptCanvas;
  founderMotivation?: SavedFounderMotivation;
  teamAndBudget?: SavedTeamAndBudget;
  founderRealityCheck?: SavedFounderRealityCheck;
  grantEligibilityCheck?: SavedGrantEligibilityCheck;
  thingsToConsider?: BlindSpotItem[];
  moduleBData?: SavedModuleBData;
  moduleCData?: SavedModuleCData;
  moduleDData?: SavedModuleDData;
  moduleEData?: SavedModuleEData;
  moduleFData?: SavedModuleFData;
  moduleGData?: SavedModuleGData;
  moduleHData?: SavedModuleHData;
  moduleIData?: SavedModuleIData;
  moduleJData?: SavedModuleJData;
  moduleKData?: SavedModuleKData;
  moduleLData?: SavedModuleLData;
  grantCenterData?: SavedGrantCenterData;
  masterDocumentData?: SavedMasterDocumentData;
  openQuestions: string[];
  updatedAtIso?: string;
}

export interface BmuLocalSession {
  user: ActiveUserProfile;
  entitlement: EntitlementSnapshot;
  redeemedCodes: string[];
  plans: ActiveStartupPlan[];
  activePlanId: string;
}

const STORAGE_KEY = 'spf_v2_session_state_v1';
const LEGACY_STORAGE_KEY = 'bmu_v2_session_state_v1';
const PER_USER_STORAGE_PREFIX = 'spf_v2_session_by_email_v1::';
const LEGACY_PER_USER_STORAGE_PREFIX = 'bmu_v2_session_by_email_v1::';
const PUBLIC_SURVEYS_REGISTRY_KEY = 'spf_v2_public_surveys_registry_v1';
const LEGACY_PUBLIC_SURVEYS_REGISTRY_KEY = 'bmu_v2_public_surveys_registry_v1';
const REAL_PLANS_VAULT_KEY = 'spf_v2_real_founder_plans_vault_v1';
const DELETED_PLAN_IDS_KEY = 'spf_v2_deleted_plan_ids_vault_v1';

export function getDeletedPlanIdsFromStorage(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(DELETED_PLAN_IDS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function markPlanAsDeletedInBrowserStorage(planId: string): void {
  if (typeof window === 'undefined' || !planId) return;
  try {
    const deletedSet = getDeletedPlanIdsFromStorage();
    deletedSet.add(planId);
    window.localStorage.setItem(
      DELETED_PLAN_IDS_KEY,
      JSON.stringify(Array.from(deletedSet))
    );

    // Remove from REAL_PLANS_VAULT_KEY
    const rawVault = window.localStorage.getItem(REAL_PLANS_VAULT_KEY);
    if (rawVault) {
      const existingVault: ActiveStartupPlan[] = JSON.parse(rawVault);
      const filtered = (existingVault || []).filter((p) => p.id !== planId);
      window.localStorage.setItem(REAL_PLANS_VAULT_KEY, JSON.stringify(filtered));
    }
  } catch {
    // Ignore storage errors
  }
}

export function isSyntheticPersonaPlan(
  plan?: Partial<ActiveStartupPlan> | null
): boolean {
  if (!plan?.id) return false;
  return plan.id.startsWith('plan-persona-');
}

export function hasRealFounderContent(
  plan?: Partial<ActiveStartupPlan> | null
): boolean {
  if (!plan || isSyntheticPersonaPlan(plan)) return false;
  if (plan.brainDumpText && plan.brainDumpText.trim().length > 0) return true;
  if (
    plan.title &&
    plan.title.trim().length > 0 &&
    plan.title.trim() !== 'My Startup Plan'
  ) {
    return true;
  }
  if (plan.oneLinerSummary && plan.oneLinerSummary.trim().length > 0) {
    return true;
  }
  if (
    plan.conceptCanvas?.coreProblem ||
    plan.conceptCanvas?.proposedSolution ||
    plan.conceptCanvas?.targetCustomer
  ) {
    return true;
  }
  if (plan.founderMotivation?.twelveMonthSuccessVision?.trim()) return true;
  if (
    plan.moduleBData ||
    plan.moduleCData ||
    plan.moduleDData ||
    plan.moduleEData ||
    plan.moduleFData ||
    plan.moduleGData ||
    plan.moduleHData ||
    plan.moduleIData ||
    plan.moduleJData ||
    plan.masterDocumentData
  ) {
    return true;
  }
  if (Array.isArray(plan.openQuestions) && plan.openQuestions.length > 0) {
    return true;
  }
  return false;
}

function getLatestPlanTimestampMs(
  plan?: Partial<ActiveStartupPlan> | null
): number {
  if (!plan) return 0;
  let maxTs = 0;
  const checkIso = (iso?: string | null) => {
    if (!iso || typeof iso !== 'string') return;
    const t = Date.parse(iso);
    if (!Number.isNaN(t) && t > maxTs) {
      maxTs = t;
    }
  };

  checkIso(plan.updatedAtIso);
  checkIso(plan.grantEligibilityCheck?.lastCheckedAt);
  checkIso(plan.masterDocumentData?.lastSavedAt);

  const scanObj = (obj: unknown, depth = 0) => {
    if (!obj || typeof obj !== 'object' || depth > 3) return;
    const rec = obj as Record<string, unknown>;
    if (typeof rec.lastSavedAt === 'string') checkIso(rec.lastSavedAt);
    if (typeof rec.updatedAt === 'string') checkIso(rec.updatedAt);
    if (typeof rec.lastAuditedAt === 'string') checkIso(rec.lastAuditedAt);
    if (typeof rec.lastEditedAt === 'string') checkIso(rec.lastEditedAt);
    for (const val of Object.values(rec)) {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        scanObj(val, depth + 1);
      }
    }
  };

  scanObj(plan.moduleBData);
  scanObj(plan.moduleCData);
  scanObj(plan.moduleDData);
  scanObj(plan.moduleEData);
  scanObj(plan.moduleFData);
  scanObj(plan.moduleGData);
  scanObj(plan.moduleHData);
  scanObj(plan.moduleIData);
  scanObj(plan.moduleJData);
  scanObj(plan.moduleKData);
  scanObj(plan.moduleLData);

  return maxTs;
}

function isCandidatePlanNewerOrRicher(
  candidate: ActiveStartupPlan,
  existing: ActiveStartupPlan
): boolean {
  const candTs = getLatestPlanTimestampMs(candidate);
  const existTs = getLatestPlanTimestampMs(existing);
  if (candTs > 0 || existTs > 0) {
    if (candTs !== existTs) {
      return candTs > existTs;
    }
  }
  return scorePlanRichness(candidate) > scorePlanRichness(existing);
}

function scorePlanRichness(plan: ActiveStartupPlan): number {
  if (isSyntheticPersonaPlan(plan)) return -1;
  let score = 0;
  if (plan.title && plan.title !== 'My Startup Plan') score += 10;
  if (plan.brainDumpText?.trim()) score += 15 + Math.min(plan.brainDumpText.length, 500) / 50;
  if (plan.oneLinerSummary?.trim()) score += 5;
  if (plan.conceptCanvas?.coreProblem) score += 15;
  if (plan.founderMotivation?.twelveMonthSuccessVision) score += 10;
  if (plan.teamAndBudget) score += 5;
  if (plan.founderRealityCheck) score += 5;
  if (plan.grantEligibilityCheck) score += 10;
  if (plan.moduleBData) score += 20;
  if (plan.moduleCData?.surveys?.length) score += 25;
  if (plan.moduleDData) score += 20;
  if (plan.moduleEData) score += 20;
  if (plan.moduleFData) score += 20;
  if (plan.moduleGData) score += 20;
  if (plan.moduleHData) score += 20;
  if (plan.moduleIData) score += 20;
  if (plan.moduleJData) score += 20;
  if (plan.moduleKData) score += 20;
  if (plan.moduleLData) score += 20;
  if (plan.masterDocumentData) score += 20;
  return score;
}

function backupRealPlansToVault(plans: ActiveStartupPlan[]): void {
  if (typeof window === 'undefined') return;
  try {
    const deletedSet = getDeletedPlanIdsFromStorage();
    const realCandidates = (plans || []).filter(
      (p) => hasRealFounderContent(p) && !deletedSet.has(p.id)
    );
    if (realCandidates.length === 0) return;

    const rawVault = window.localStorage.getItem(REAL_PLANS_VAULT_KEY);
    const existingVault: ActiveStartupPlan[] = rawVault
      ? JSON.parse(rawVault)
      : [];
    const byId = new Map<string, ActiveStartupPlan>();

    for (const existing of existingVault) {
      if (existing?.id && !isSyntheticPersonaPlan(existing) && !deletedSet.has(existing.id)) {
        byId.set(existing.id, existing);
      }
    }
    for (const candidate of realCandidates) {
      const prev = byId.get(candidate.id);
      if (!prev || isCandidatePlanNewerOrRicher(candidate, prev)) {
        byId.set(candidate.id, candidate);
      }
    }

    window.localStorage.setItem(
      REAL_PLANS_VAULT_KEY,
      JSON.stringify(Array.from(byId.values()))
    );
  } catch {
    // Ignore storage quota errors
  }
}

export function recoverAllRealPlansFromBrowserStorage(): ActiveStartupPlan[] {
  if (typeof window === 'undefined') return [];
  const deletedSet = getDeletedPlanIdsFromStorage();
  const byId = new Map<string, ActiveStartupPlan>();

  const considerPlans = (plans?: ActiveStartupPlan[]) => {
    if (!Array.isArray(plans)) return;
    for (const p of plans) {
      if (!p?.id || isSyntheticPersonaPlan(p)) continue;
      if (deletedSet.has(p.id)) continue;
      if (!hasRealFounderContent(p)) continue;
      const existing = byId.get(p.id);
      if (!existing || isCandidatePlanNewerOrRicher(p, existing)) {
        byId.set(p.id, p);
      }
    }
  };

  // Prefer the primary STORAGE_KEY first so active session edits win ties
  try {
    const primaryRaw = window.localStorage.getItem(STORAGE_KEY);
    if (primaryRaw) {
      const parsed = JSON.parse(primaryRaw) as BmuLocalSession;
      considerPlans(parsed?.plans);
    }
  } catch {
    // Ignore parse error
  }

  try {
    const rawVault = window.localStorage.getItem(REAL_PLANS_VAULT_KEY);
    if (rawVault) {
      considerPlans(JSON.parse(rawVault) as ActiveStartupPlan[]);
    }
  } catch {
    // Ignore parse error
  }

  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key || key === STORAGE_KEY) continue;
      if (
        key === LEGACY_STORAGE_KEY ||
        key.startsWith(PER_USER_STORAGE_PREFIX) ||
        key.startsWith(LEGACY_PER_USER_STORAGE_PREFIX)
      ) {
        try {
          const raw = window.localStorage.getItem(key);
          if (!raw) continue;
          const parsed = JSON.parse(raw) as BmuLocalSession;
          considerPlans(parsed?.plans);
        } catch {
          // Ignore malformed entry
        }
      }
    }
  } catch {
    // Ignore storage enumeration errors
  }

  const recovered = Array.from(byId.values()).sort((a, b) => {
    const tsDiff = getLatestPlanTimestampMs(b) - getLatestPlanTimestampMs(a);
    if (tsDiff !== 0) return tsDiff;
    return scorePlanRichness(b) - scorePlanRichness(a);
  });
  return recovered;
}

function isPersonaPreviewUrlActive(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('persona_preview') === '1';
  } catch {
    return false;
  }
}

function sanitizeAndRestoreRealPlansInSession(
  session: BmuLocalSession,
  allowPersonaPreview: boolean
): BmuLocalSession {
  const deletedSet = getDeletedPlanIdsFromStorage();
  const rawPlans = (Array.isArray(session.plans) ? session.plans : []).filter(
    (p) => !p?.id || !deletedSet.has(p.id)
  );
  const recoveredRealPlans = recoverAllRealPlansFromBrowserStorage();

  // Merge non-persona plans from session with recovered real plans from browser storage
  const realById = new Map<string, ActiveStartupPlan>();
  for (const p of rawPlans) {
    if (p?.id && !isSyntheticPersonaPlan(p)) {
      realById.set(p.id, p);
    }
  }
  for (const rec of recoveredRealPlans) {
    const existing = realById.get(rec.id);
    if (
      !existing ||
      (!hasRealFounderContent(existing) && hasRealFounderContent(rec)) ||
      isCandidatePlanNewerOrRicher(rec, existing)
    ) {
      realById.set(rec.id, rec);
    }
  }

  let realPlans = Array.from(realById.values());
  const populatedRealPlans = realPlans.filter((p) => hasRealFounderContent(p));
  if (populatedRealPlans.length > 0) {
    // Drop blank default placeholder if user has real populated plan(s)
    realPlans = [
      ...populatedRealPlans,
      ...realPlans.filter(
        (p) => !hasRealFounderContent(p) && p.id !== 'plan-greencart-1'
      ),
    ];
  }

  if (allowPersonaPreview) {
    const personaPlans = rawPlans.filter((p) => isSyntheticPersonaPlan(p));
    const combined = [...personaPlans, ...realPlans];
    return {
      ...session,
      plans: combined.length > 0 ? combined : getDefaultDemoSession().plans,
      activePlanId:
        session.activePlanId ||
        combined[0]?.id ||
        'plan-greencart-1',
    };
  }

  const finalPlans =
    realPlans.length > 0 ? realPlans : getDefaultDemoSession().plans;
  const currentActiveIsReal = finalPlans.some(
    (p) => p.id === session.activePlanId && !isSyntheticPersonaPlan(p)
  );

  return {
    ...session,
    plans: finalPlans,
    activePlanId: currentActiveIsReal
      ? session.activePlanId
      : finalPlans[0]?.id || 'plan-greencart-1',
  };
}

function getPerUserStorageKey(email: string): string {
  return `${PER_USER_STORAGE_PREFIX}${email.trim().toLowerCase()}`;
}

function getLegacyPerUserStorageKey(email: string): string {
  return `${LEGACY_PER_USER_STORAGE_PREFIX}${email.trim().toLowerCase()}`;
}

export function loadBmuSessionForEmail(email: string): BmuLocalSession | null {
  if (typeof window === 'undefined' || !email?.trim()) return null;
  try {
    const cleanEmail = email.trim().toLowerCase();
    const raw =
      window.localStorage.getItem(getPerUserStorageKey(cleanEmail)) ||
      window.localStorage.getItem(getLegacyPerUserStorageKey(cleanEmail));
    if (!raw) {
      // Also check if the active STORAGE_KEY currently belongs to this email
      const activeRaw =
        window.localStorage.getItem(STORAGE_KEY) ||
        window.localStorage.getItem(LEGACY_STORAGE_KEY);
      if (activeRaw) {
        const activeParsed = JSON.parse(activeRaw) as BmuLocalSession;
        if (activeParsed?.user?.email?.trim().toLowerCase() === cleanEmail) {
          return sanitizeAndRestoreRealPlansInSession(activeParsed, false);
        }
      }
      return null;
    }
    const parsed = JSON.parse(raw) as BmuLocalSession;
    if (parsed.entitlement?.accessExpiresAt) {
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
    return sanitizeAndRestoreRealPlansInSession(parsed, false);
  } catch {
    return null;
  }
}

export function createFreshStartupPlan(
  hqCountryCode: SupportedCountryCode = 'IE'
): ActiveStartupPlan {
  const pack = getCountryRulePack(hqCountryCode);
  const isGrantRegion = hqCountryCode === 'IE' || hqCountryCode === 'GB';
  return {
    id: `plan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: 'My Startup Plan',
    oneLinerSummary: '',
    industryCategory: 'B2B SaaS / AI App',
    hqCountryCode,
    baseCurrency: pack.defaultCurrency,
    targetMarketsArray: [hqCountryCode],
    exportPotential: 'DOMESTIC_ONLY',
    fundingTrackMode: isGrantRegion ? 'GRANT_AND_INVESTOR' : 'COMMERCIAL_ONLY',
    currentModuleStep: 'MOD_A_STEP_1',
    brainDumpText: '',
    openQuestions: [],
  };
}

export function getDefaultDemoSession(): BmuLocalSession {
  const limits = calculatePassLimits('FREE_HOOK');
  return {
    user: {
      id: 'user-default-1',
      name: '',
      email: '',
      role: 'FOUNDER',
      founderStage: 'IDEA_EXPLORER',
      teamStructure: 'SOLO',
      primaryHat: 'PRODUCT_TECH',
      regionOrCounty: 'Dublin',
      onboardingCompleted: true,
    },
    entitlement: {
      userId: 'user-default-1',
      planType: 'FREE_HOOK',
      stackedCodesCount: 0,
      maxStartupPlans: limits.maxStartupPlans,
      maxSeatsPerPlan: limits.maxSeatsPerPlan,
      monthlyAiCreditsLimit: limits.monthlyAiCreditsLimit,
      aiCreditsUsedThisMonth: 0,
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

export function hasActiveBmuSession(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ||
      window.localStorage.getItem(LEGACY_STORAGE_KEY);
    return Boolean(raw);
  } catch {
    return false;
  }
}

export function clearActiveBmuSession(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Ignore storage removal errors
  }
}

export function loadBmuSession(): BmuLocalSession {
  if (typeof window === 'undefined') {
    return getDefaultDemoSession();
  }
  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ||
      window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) {
      const fallback = getDefaultDemoSession();
      return sanitizeAndRestoreRealPlansInSession(fallback, false);
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
    const allowPersonaPreview = isPersonaPreviewUrlActive();
    const restored = sanitizeAndRestoreRealPlansInSession(
      parsed,
      allowPersonaPreview
    );
    // Persist the cleaned/restored session if a synthetic persona plan was stripped
    if (
      !allowPersonaPreview &&
      (parsed.activePlanId !== restored.activePlanId ||
        (parsed.plans || []).length !== restored.plans.length)
    ) {
      saveBmuSession(restored);
    }
    return restored;
  } catch {
    return getDefaultDemoSession();
  }
}

export function exitPersonaPreviewAndRestoreRealPlans(): BmuLocalSession {
  if (typeof window === 'undefined') {
    return getDefaultDemoSession();
  }
  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ||
      window.localStorage.getItem(LEGACY_STORAGE_KEY);
    const base = raw
      ? (JSON.parse(raw) as BmuLocalSession)
      : getDefaultDemoSession();
    const restored = sanitizeAndRestoreRealPlansInSession(base, false);
    saveBmuSession(restored);
    return restored;
  } catch {
    return getDefaultDemoSession();
  }
}

export function saveBmuSession(session: BmuLocalSession): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_PUBLIC_SURVEYS_REGISTRY_KEY);
  } catch {
    // Ignore storage removal errors
  }

  // Before overwriting STORAGE_KEY, always preserve any real founder plans currently in STORAGE_KEY or incoming session
  try {
    const existingRaw =
      window.localStorage.getItem(STORAGE_KEY) ||
      window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (existingRaw) {
      const existingParsed = JSON.parse(existingRaw) as BmuLocalSession;
      if (Array.isArray(existingParsed?.plans)) {
        backupRealPlansToVault(existingParsed.plans);
      }
    }
  } catch {
    // Ignore parse issues
  }
  backupRealPlansToVault(session.plans || []);

  const cleanedSession: BmuLocalSession = {
    ...session,
    entitlement: {
      ...session.entitlement,
      // Security Invariant: Never store raw BYOK API keys in browser localStorage
      customApiKeyEncrypted: session.entitlement?.customApiKeyEncrypted
        ? 'enc_gemini_byok_active'
        : undefined,
    },
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

  const serializedSession = JSON.stringify(cleanedSession);
  try {
    window.localStorage.setItem(STORAGE_KEY, serializedSession);
  } catch {
    // QuotaExceededError recovery: evict secondary caches so primary STORAGE_KEY always succeeds
    try {
      window.localStorage.removeItem(REAL_PLANS_VAULT_KEY);
      window.localStorage.removeItem(PUBLIC_SURVEYS_REGISTRY_KEY);
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (
          k &&
          (k.startsWith(PER_USER_STORAGE_PREFIX) ||
            k.startsWith(LEGACY_PER_USER_STORAGE_PREFIX))
        ) {
          keysToRemove.push(k);
        }
      }
      for (const k of keysToRemove) {
        window.localStorage.removeItem(k);
      }
      window.localStorage.setItem(STORAGE_KEY, serializedSession);
    } catch {
      // Never throw out of saveBmuSession so React state & PostgreSQL server actions still complete
    }
  }
  try {
    const cleanEmail = cleanedSession.user?.email?.trim().toLowerCase();
    if (
      cleanEmail &&
      cleanEmail !== 'founder@startuppreflight.com' &&
      cleanEmail !== 'founder@buildmyunicorn.com'
    ) {
      const perUserKey = getPerUserStorageKey(cleanEmail);
      // Never pollute a user's per-email account vault with synthetic test persona plans
      const realUserPlans = cleanedSession.plans.filter(
        (p) => !isSyntheticPersonaPlan(p)
      );
      const isBlankDemoFallback =
        cleanedSession.user.id === 'user-default-1' &&
        realUserPlans.length === 1 &&
        realUserPlans[0]?.id === 'plan-greencart-1' &&
        !realUserPlans[0]?.brainDumpText;

      if (!isBlankDemoFallback && realUserPlans.length > 0) {
        const realActiveId = realUserPlans.some(
          (p) => p.id === cleanedSession.activePlanId
        )
          ? cleanedSession.activePlanId
          : realUserPlans[0].id;
        const perUserSession: BmuLocalSession = {
          ...cleanedSession,
          plans: realUserPlans,
          activePlanId: realActiveId,
        };
        window.localStorage.setItem(perUserKey, JSON.stringify(perUserSession));
      }
    }
  } catch {
    // Ignore localStorage quota issues
  }
  try {
    const rawRegistry =
      window.localStorage.getItem(PUBLIC_SURVEYS_REGISTRY_KEY) ||
      window.localStorage.getItem(LEGACY_PUBLIC_SURVEYS_REGISTRY_KEY);
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
    const rawRegistry =
      window.localStorage.getItem(PUBLIC_SURVEYS_REGISTRY_KEY) ||
      window.localStorage.getItem(LEGACY_PUBLIC_SURVEYS_REGISTRY_KEY);
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
    const rawRegistry =
      window.localStorage.getItem(PUBLIC_SURVEYS_REGISTRY_KEY) ||
      window.localStorage.getItem(LEGACY_PUBLIC_SURVEYS_REGISTRY_KEY);
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
    const rawRegistry =
      window.localStorage.getItem(PUBLIC_SURVEYS_REGISTRY_KEY) ||
      window.localStorage.getItem(LEGACY_PUBLIC_SURVEYS_REGISTRY_KEY);
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
  } else if (cleanCode) {
    // If a non-Sumo code was provided (e.g. GOOGLE-TESTERS-2006, SPF-..., BMU-..., or custom cohort)
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
      cohortCode: cleanCode || undefined,
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
  fundingTrackMode?: 'GRANT_AND_INVESTOR' | 'COMMERCIAL_ONLY';
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

  const isGrantRegion =
    params.hqCountryCode === 'IE' || params.hqCountryCode === 'GB';
  const resolvedTrack: 'GRANT_AND_INVESTOR' | 'COMMERCIAL_ONLY' = isGrantRegion
    ? params.fundingTrackMode === 'COMMERCIAL_ONLY'
      ? 'COMMERCIAL_ONLY'
      : 'GRANT_AND_INVESTOR'
    : 'COMMERCIAL_ONLY';

  const firstPlan: ActiveStartupPlan = {
    id: planId,
    title: params.planTitle.trim() || 'My First Startup Plan',
    oneLinerSummary: params.oneLinerSummary.trim(),
    industryCategory: params.industryCategory,
    hqCountryCode: params.hqCountryCode,
    baseCurrency: countryPack.defaultCurrency,
    targetMarketsArray: Array.from(new Set(targetMarkets)),
    exportPotential: params.exportPotential,
    fundingTrackMode: resolvedTrack,
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
