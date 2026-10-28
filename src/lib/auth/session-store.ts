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
  moduleDData?: SavedModuleDData;
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
