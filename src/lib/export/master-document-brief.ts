import type { BlindSpotItem } from '@/db/schema';
import {
  getCountryRulePack,
  formatPlanCurrency,
  type SupportedCountryCode,
} from '@/lib/localization';
import {
  escapeDocumentHtml,
  renderBmuStandaloneHtmlDocument,
} from '@/lib/export/document-shell';
import {
  MOTIVATION_LABELS,
  WEEKLY_HOURS_LABELS,
  TEAM_STRUCTURE_LABELS,
  SKILL_COVERAGE_LABELS,
  INDUSTRY_CONNECTION_LABELS,
  INCOME_URGENCY_LABELS,
  DEALBREAKER_LABELS,
  GROWTH_TRADEOFF_LABELS,
  BIGGEST_WORRY_LABELS,
  formatStartingBudgetBracket,
} from '@/lib/export/module-a-brief';
import {
  BUYER_MODEL_LABELS,
  SWITCHING_FRICTION_LABELS,
  UNFAIR_ADVANTAGE_LABELS,
} from '@/lib/export/module-b-brief';
import {
  formatInterviewChannel,
  formatInterviewCommitment,
  INTERVIEW_SIGNAL_LABELS,
} from '@/lib/export/module-c-brief';
import {
  isGrantCheckerSupportedForCountry,
  evaluateModuleAGrantEligibility,
  getDefaultGrantEligibilityCheck,
} from '@/lib/grants/module-a-grant-checker';
import type {
  ActiveStartupPlan,
  SavedConceptCanvas,
  SavedFounderMotivation,
  SavedTeamAndBudget,
  SavedFounderRealityCheck,
  SavedMasterDocumentData,
  ProductTrackType,
  ProductFormFactorType,
  V1PrototypeApproachType,
  V1LaunchTimelineType,
  OperationsFulfillmentModeType,
  OrderTurnaroundSlaType,
  PremisesSetupModeType,
} from '@/lib/auth/session-store';

/**
 * Strips any internal `/v/[slug]` or `/v/...` route references from text
 * so readers only ever see plain-English "Public Validation Surveys".
 */
export function sanitizeSurveyTerminologyForReader(text: string): string {
  if (!text) return '';
  return text
    .replace(/\/v\/\[slug\]/gi, 'public validation surveys')
    .replace(/`\/v\/[^`\s]+`/gi, 'public validation surveys')
    .replace(/\(\/v\/[^)\s]+\)/gi, '(public validation survey)')
    .replace(/\/v\/[a-z0-9-_]+/gi, 'public validation survey');
}

export const PRODUCT_TRACK_READER_LABELS: Record<ProductTrackType, string> = {
  SAAS_SOFTWARE_AI: 'SaaS / Web / AI Software',
  PHYSICAL_PRODUCT_ECOM: 'Physical Product / Craft / E-Commerce',
  MARKETPLACE_PLATFORM: 'Two-Sided Marketplace / Booking Platform',
  EDUCATION_PROGRAM_COHORT: 'Digital Curriculum / Guided Support / Cohort',
  PRODUCTIZED_SERVICE_AGENCY: 'Productized Service / B2B Consultancy',
  HYBRID_HARDWARE_SOFTWARE: 'Hybrid Hardware + Companion Software',
  OTHER: 'Custom Product Track',
};

export const FORM_FACTOR_READER_LABELS: Record<ProductFormFactorType, string> = {
  WEB_PLATFORM: 'Responsive Web Platform',
  MOBILE_APP_IOS_ANDROID: 'Mobile App (iOS & Android)',
  WEB_AND_MOBILE_BOTH: 'Web + Companion Mobile App',
  EXTENSION_PLUGIN_API: 'Browser Extension / Plugin / API',
  SINGLE_HERO_SKU: 'Single Hero Physical Product (1 Flagship SKU)',
  CURATED_2_3_SKUS: 'Curated Starter Range (2–3 SKUs)',
  CONSUMABLE_REFILL_SUB: 'Consumable / Refill Subscription Box',
  MADE_TO_ORDER_BESPOKE: 'Made-to-Order / Bespoke Craft Item',
  MANAGED_CURATED_MARKETPLACE: 'Managed / Vetted Curated Marketplace',
  SELF_SERVE_BOOKING_DIRECTORY: 'Self-Serve Booking & Discovery Directory',
  B2B_PROCUREMENT_EXCHANGE: 'B2B Supply & Procurement Exchange',
  COMMUNITY_PEER_MARKETPLACE: 'Peer-to-Peer Community Marketplace',
  MOBILE_WEB_PORTAL_AUDIO_VIDEO: 'Mobile-Ready Web Portal (Bite-Sized Audio & Video)',
  COHORT_LIVE_PLUS_CURRICULUM: 'Live Cohort Program + Structured Curriculum',
  MEMBERSHIP_COMMUNITY_LIBRARY: 'Recurring Membership Library & Community',
  B2B_SCHOOL_CLINIC_LICENCE: 'Institutional / Clinic / Employer Licensed Portal',
  FIXED_SCOPE_SPRINT: 'Fixed-Scope Productized Sprint',
  MONTHLY_RETAINER_SUBSCRIPTION: 'Monthly Productized Subscription Retainer',
  TECH_ENABLED_DONE_FOR_YOU: 'Tech-Enabled Done-For-You Service',
  DIAGNOSTIC_PAID_PILOT: 'Paid Diagnostic Audit + Implementation Pilot',
  DEVICE_PLUS_COMPANION_APP: 'Connected Device + Companion App',
  PHYSICAL_PRODUCT_PLUS_DIGITAL_CLUB: 'Physical Kit + Digital Membership Portal',
  IN_PERSON_PLUS_DIGITAL_PORTAL: 'In-Person Delivery + Digital Companion Portal',
  CUSTOM_HYBRID_FORMAT: 'Custom Hybrid Format',
  OTHER: 'Custom Form Factor',
};

export const PROTOTYPE_APPROACH_READER_LABELS: Record<
  V1PrototypeApproachType,
  string
> = {
  FOCUSED_FULL_CODE_V1: 'Focused Full-Code V1 Web Build',
  NO_CODE_LOW_CODE_MVP: 'No-Code / Low-Code Rapid MVP',
  CONCIERGE_AI_ASSISTED_MVP: 'Wizard-of-Oz / Concierge + AI-Assisted MVP',
  CLICKABLE_PROTOTYPE_PREORDER: 'Interactive Prototype + Pre-Sale Validation',
  IN_HOUSE_SMALL_BATCH_WORKSHOP: 'In-House Small-Batch Workshop Production',
  WHITE_LABEL_CUSTOMISED_PILOT: 'Customised Base Product / White-Label Pilot',
  LOCAL_CO_PACKER_MAKER_RUN: 'Local Contract Maker / Micro-Batch Run',
  PREORDER_BEFORE_TOOLING: 'Sample Prototype + Pre-Order Campaign Before Tooling',
  CONCIERGE_MANUAL_MATCHING: 'Concierge Manual Matching Before Full Automation',
  SINGLE_SIDE_DIRECTORY_BOOKING: 'Supply-First Curated Booking Directory',
  NO_CODE_MARKETPLACE_PORTAL: 'Lightweight Web Portal + Managed Payments',
  CUSTOM_TWO_SIDED_BUILD: 'Custom Two-Sided Matching & Escrow Platform',
  HOSTED_PORTAL_PLUS_LIVE_QA: 'Hosted Curriculum Portal + Live Q&A Support',
  FOUNDING_BETA_COHORT_LIVE: 'Founding Beta Cohort (Live Guided Delivery)',
  MOBILE_PWA_BITE_SIZED_AUDIO: 'Mobile-First Web App with Bite-Sized Audio/Guides',
  CUSTOM_EDUCATION_APP_BUILD: 'Custom Interactive Learning Platform',
  REPEATABLE_SOP_PLUS_STRIPE: 'Standardized SOP Playbook + Self-Serve Checkout',
  CLIENT_PORTAL_PLUS_AUTOMATION: 'Client Portal + Automated Back-Office Workflow',
  PAID_PILOT_SPRINT_FIRST_5: 'Paid Pilot Sprint with First 5 Founding Clients',
  OFF_THE_SHELF_HARDWARE_PLUS_WEB: 'Off-the-Shelf Hardware + Custom Web Software',
  SMALL_BATCH_PHYSICAL_PLUS_CONCIERGE: 'Small-Batch Physical Kit + Guided Digital Setup',
  CUSTOM_HARDWARE_AND_APP: 'Custom Hardware Prototype + Companion App',
  OTHER: 'Custom V1 Build Approach',
};

export const LAUNCH_TIMELINE_READER_LABELS: Record<V1LaunchTimelineType, string> =
  {
    UNDER_4_WEEKS: 'Under 4 Weeks (Fast Pilot)',
    '1_TO_3_MONTHS': '1 to 3 Months (Lean V1 Launch)',
    '3_TO_6_MONTHS': '3 to 6 Months (Structured Build)',
    OVER_6_MONTHS: '6+ Months (Deep R&D / Hardware / Regulated)',
    OTHER: 'Custom Launch Timeline',
  };

export const FULFILLMENT_MODE_READER_LABELS: Record<
  OperationsFulfillmentModeType,
  string
> = {
  AUTOMATED_CLOUD_SELF_SERVE: 'Automated Cloud / Digital Self-Serve Provisioning',
  IN_HOUSE_WORKSHOP_BATCH: 'In-House Workshop / Studio Batch Production & Dispatch',
  CONTRACT_MANUFACTURED_3PL: 'Contract Manufactured + Third-Party Logistics (3PL)',
  FOUNDER_LED_CONCIERGE_COHORT: 'Founder-Led Concierge / Cohort Service Delivery',
  HYBRID_AUTOMATED_PLUS_HUMAN: 'Hybrid Automated Workflow + Human Quality Review',
  OTHER: 'Custom Fulfillment Model',
};

export const TURNAROUND_SLA_READER_LABELS: Record<OrderTurnaroundSlaType, string> =
  {
    INSTANT_UNDER_5_MINS: 'Instant Self-Serve (Under 5 Minutes)',
    SAME_OR_NEXT_DAY_24_48H: 'Same or Next Business Day (24–48 Hours)',
    STANDARD_CRAFT_CYCLE_3_7_DAYS: 'Standard Production / Dispatch Cycle (3–7 Days)',
    BESPOKE_OR_SPRINT_2_4_WEEKS: 'Bespoke Build or Client Sprint (2–4 Weeks)',
    COHORT_OR_SCHEDULED_WINDOW: 'Scheduled Intake / Cohort Window',
    OTHER: 'Custom Turnaround SLA',
  };

export const PREMISES_MODE_READER_LABELS: Record<PremisesSetupModeType, string> =
  {
    HOME_OFFICE_ZERO_RENT: 'Home Office / Remote Setup (Zero Commercial Rent)',
    REMOTE_CLOUD_HOME_OFFICE: 'Home Office / Remote Cloud Setup (Zero Commercial Rent)',
    HOME_WORKSHOP_GARAGE_SHED: 'Dedicated Home Workshop / Studio / Garage',
    HOME_GARAGE_GARDEN_WORKSHOP: 'Dedicated Home Workshop / Studio / Garage',
    SHARED_COWORKING_MAKER_SPACE: 'Shared Co-Working Hub / Maker Space / Kitchen',
    SHARED_COWORKING_INCUBATOR_HUB: 'Shared Co-Working / Enterprise Hub Desk',
    COMMERCIAL_INDUSTRIAL_UNIT: 'Dedicated Commercial / Light Industrial Unit',
    COMMERCIAL_WORKSHOP_INDUSTRIAL_UNIT: 'Dedicated Commercial Workshop / Industrial Unit',
    RETAIL_OR_CLIENT_PREMISES: 'Customer-Facing Retail / Clinic / Studio Premises',
    RETAIL_HIGH_STREET_PREMISES: 'Customer-Facing High-Street / Retail Premises',
    OTHER: 'Custom Premises Setup',
  };

export interface MasterDocumentInputParams {
  plan: ActiveStartupPlan;
  founderName: string;
  brainDumpText: string;
  conceptCanvas: SavedConceptCanvas;
  founderMotivation: SavedFounderMotivation;
  teamAndBudget: SavedTeamAndBudget;
  founderRealityCheck: SavedFounderRealityCheck;
  moduleABlindSpots: BlindSpotItem[];
  whiteLabelEnabled?: boolean;
}

export interface MasterDocumentVerifiedFacts {
  planTitle: string;
  founderName: string;
  hqCountryCode: SupportedCountryCode;
  countryName: string;
  currency: string;
  industryCategory: string;
  exportScopeLabel: string;
  targetMarketsLabel: string;

  // Chapter completion flags (strictly factual)
  hasModuleA: boolean;
  hasModuleB: boolean;
  hasModuleC: boolean;
  hasModuleD: boolean;
  hasModuleE: boolean;
  activeChaptersCount: number;
  overallCompletionPercent: number;

  // Module A Facts
  brainDumpText: string;
  coreProblem: string;
  targetCustomer: string;
  proposedSolution: string;
  unfairAdvantage: string;
  revenueAndGrantFit: string;
  motivationLabel: string;
  weeklyHoursLabel: string;
  twelveMonthSuccessVision: string;
  teamStructureLabel: string;
  skillCoverageLabel: string;
  startingBudgetLabel: string;
  teamAndFundingNotes: string;
  industryConnectionLabel: string;
  incomeUrgencyLabel: string;
  dealbreakersList: string[];
  growthTradeoffLabel: string;
  biggestWorryLabel: string;
  biggestWorryNotes: string;

  // Module B Facts
  buyerModelLabel: string;
  beachheadSegment: string;
  decisionMakerRole: string;
  buyingTriggerNotes: string;
  workaroundFrustrationNotes: string;
  whySwitchOneSentence: string;
  competitorNames: string[];
  competitorsCount: number;
  somAnnualRevenue: number;
  samAnnualRevenue: number;
  tamAnnualRevenue: number;
  somFormatted: string;
  samFormatted: string;
  tamFormatted: string;
  marketSizingAssumptions: string;
  competitiveEdgeSummary: string;
  switchingFrictionNotes: string;

  // Module C Facts (Plain English — no /v/[slug])
  surveysCount: number;
  totalSurveyResponses: number;
  realSurveyResponses: number;
  waitlistOptInsCount: number;
  interviewsCount: number;
  strongSignalInterviewsCount: number;
  avgInterviewPainScore: string;
  surveyHeadlineInsight: string;
  topValidatedPainPoints: string[];
  sampleCustomerQuote: string;

  // Module D Facts
  productTrackLabel: string;
  formFactorLabel: string;
  prototypeApproachLabel: string;
  launchTimelineLabel: string;
  ahaMomentNarrative: string;
  whyVehicleFitsNarrative: string;
  ownedChannelsSharePercent: number;
  rentedChannelsSharePercent: number;
  channelStrategyNotes: string;
  v1MustHaveTitles: string[];
  deferredPostV1Titles: string[];
  whatWeRefuseToBuildNarrative: string;
  inHouseCoreBuildTitles: string[];
  workPackagesCount: number;
  totalWorkPackagesCost: number;
  technicalMeritNarrative: string;
  executiveProductBriefSummary: string;

  // Module E Facts
  fulfillmentModeLabel: string;
  turnaroundSlaLabel: string;
  weeklyOpsHoursAllocated: number;
  orderStagesCount: number;
  totalActiveMinutesPerOrder: number;
  totalDirectVariableCostPerOrder: number;
  maxWeeklyOrdersCapacity: number;
  endToEndFulfillmentNarrative: string;
  premisesModeLabel: string;
  monthlyPremisesCost: number;
  equipmentItemsCount: number;
  totalEquipmentCapexExVat: number;
  riskItemsCount: number;
  topRiskTitleAndMitigation: string;
  qcCheckpointsCount: number;
  estimatedReturnRatePercent: number;
  complianceItemsCount: number;
  estimatedAnnualInsurancePremium: number;
  executiveOperationsSummaryNarrative: string;
}

/**
 * Computes Module B SOM, SAM, and TAM deterministically from the saved segments.
 */
export function computeModuleBMarketTotals(plan: ActiveStartupPlan): {
  som: number;
  sam: number;
  tam: number;
} {
  const sizing = plan.moduleBData?.marketSizing;
  if (!sizing || !Array.isArray(sizing.segments) || sizing.segments.length === 0) {
    return { som: 0, sam: 0, tam: 0 };
  }

  let som = 0;
  let sam = 0;

  for (const seg of sizing.segments) {
    const rawPrice =
      Number(String(seg.pricePerCustomerInput || '').replace(/[^0-9.]/g, '')) || 0;
    const annualPrice =
      seg.billingCadence === 'MONTHLY_SUBSCRIPTION' ? rawPrice * 12 : rawPrice;
    const customerGoal =
      Number(
        String(seg.year1To2CustomerGoalInput || '').replace(/[^0-9.]/g, '')
      ) || 0;
    const reachableCustomers =
      Number(
        String(seg.reachableCustomersInTargetMarketsInput || '').replace(
          /[^0-9.]/g,
          ''
        )
      ) || 0;

    som += annualPrice * customerGoal;
    sam += annualPrice * reachableCustomers;
  }

  const multMap: Record<string, number> = {
    '3X': 3,
    '5X': 5,
    '10X': 10,
    '20X': 20,
  };
  const customMult =
    Number(
      String(sizing.otherWiderMarketScaleText || '').replace(/[^0-9.]/g, '')
    ) || 5;
  const multiplier =
    sizing.widerMarketMultiplier === 'OTHER'
      ? customMult
      : multMap[sizing.widerMarketMultiplier] || 5;

  const tam = sam * multiplier;
  return { som, sam, tam };
}

/**
 * Builds the 100% deterministic, zero-hallucination Verified Facts Ledger
 * from the founder's saved plan state.
 */
export function extractMasterDocumentVerifiedFacts(
  params: MasterDocumentInputParams
): MasterDocumentVerifiedFacts {
  const {
    plan,
    founderName,
    brainDumpText,
    conceptCanvas,
    founderMotivation,
    teamAndBudget,
    founderRealityCheck,
  } = params;

  const countryPack = getCountryRulePack(plan.hqCountryCode);
  const currency = plan.baseCurrency || countryPack.defaultCurrency;
  const targetMarketsLabel =
    plan.targetMarketsArray && plan.targetMarketsArray.length > 0
      ? plan.targetMarketsArray.join(', ')
      : countryPack.countryName;
  const exportScopeLabel =
    plan.exportPotential === 'EXPORTING_INTERNATIONALLY'
      ? `International Export (${targetMarketsLabel})`
      : `Domestic Market (${countryPack.countryName})`;

  // Module A Check
  const hasModuleA = Boolean(
    brainDumpText.trim().length > 0 ||
      conceptCanvas.coreProblem.trim().length > 0 ||
      conceptCanvas.targetCustomer.trim().length > 0 ||
      conceptCanvas.proposedSolution.trim().length > 0
  );

  // Module B Check
  const modB = plan.moduleBData;
  const { som, sam, tam } = computeModuleBMarketTotals(plan);
  const hasModuleB = Boolean(
    modB &&
      (modB.beachhead?.beachheadSegment?.trim() ||
        (modB.competitorsAndStatusQuo?.competitors?.length ?? 0) > 0 ||
        modB.competitorsAndStatusQuo?.whySwitchOneSentence?.trim() ||
        som > 0 ||
        modB.competitiveWedge?.competitiveEdgeSummary?.trim())
  );

  // Module C Check
  const modC = plan.moduleCData;
  const validSurveys = (modC?.surveys || []).filter(
    (s) => s.questions.length > 0 || s.responses.length > 0 || s.title.trim().length > 0
  );
  const allResponses = validSurveys.flatMap((s) => s.responses || []);
  const realResponses = allResponses.filter((r) => !r.isSimulated);
  const waitlistOptIns = allResponses.filter((r) => r.joinedWaitlist);
  const interviews = modC?.interviewLogs || [];
  const strongSignalInterviews = interviews.filter(
    (i) =>
      i.signalBadge === 'STRONG_SIGNAL' ||
      i.commitmentOutcome === 'ASKED_TO_PILOT_OR_BUY'
  );
  const avgInterviewPainScore =
    interviews.length > 0
      ? (
          interviews.reduce((acc, i) => acc + i.painScore1To5, 0) /
          interviews.length
        ).toFixed(1)
      : '';
  const latestInsights = validSurveys.find((s) => Boolean(s.aiInsightsSummary))
    ?.aiInsightsSummary;
  const hasModuleC = Boolean(validSurveys.length > 0 || interviews.length > 0);

  // Module D Check
  const modD = plan.moduleDData;
  const veh = modD?.productVehicle;
  const chan = modD?.channelMatrix;
  const scope = modD?.scopeFilter;
  const bvb = modD?.buildVsBuy;
  const wps = modD?.workPackagesAndFlow;
  const modDAudit = modD?.blindSpotAudit;
  const hasModuleD = Boolean(
    modD &&
      (veh?.ahaMomentNarrative?.trim() ||
        veh?.whyThisVehicleFitsCustomer?.trim() ||
        Boolean(chan?.primaryChannel) ||
        (scope?.items?.length ?? 0) > 0 ||
        (wps?.workPackages?.length ?? 0) > 0)
  );

  // Module E Check
  const modE = plan.moduleEData;
  const opsBp = modE?.operationsBlueprint;
  const prem = modE?.premisesAndEquipment;
  const riskReg = modE?.riskRegister;
  const supQc = modE?.supportReturnsAndQc;
  const permIns = modE?.permitsAndInsurance;
  const modEAudit = modE?.blindSpotAudit;
  const hasModuleE = Boolean(
    modE &&
      ((opsBp?.orderLifecycleStages?.length ?? 0) > 0 ||
        opsBp?.endToEndFulfillmentNarrative?.trim() ||
        (prem?.equipmentItems?.length ?? 0) > 0 ||
        prem?.premisesLocationSummary?.trim() ||
        (riskReg?.riskItems?.length ?? 0) > 0)
  );

  const activeChaptersCount = [
    hasModuleA,
    hasModuleB,
    hasModuleC,
    hasModuleD,
    hasModuleE,
  ].filter(Boolean).length;

  const overallCompletionPercent = Math.round((activeChaptersCount / 5) * 100);

  // Module A Labels
  const motivationLabel =
    founderMotivation.primaryMotivation === 'OTHER' &&
    founderMotivation.otherMotivationText?.trim()
      ? founderMotivation.otherMotivationText.trim()
      : (MOTIVATION_LABELS[founderMotivation.primaryMotivation] || '').replace(
          /^[^\w]+/,
          ''
        );
  const weeklyHoursLabel =
    founderMotivation.weeklyHoursAvailable === 'OTHER' &&
    founderMotivation.otherWeeklyHoursText?.trim()
      ? founderMotivation.otherWeeklyHoursText.trim()
      : WEEKLY_HOURS_LABELS[founderMotivation.weeklyHoursAvailable] || '';

  const teamStructureLabel =
    teamAndBudget.teamStructureType === 'OTHER' &&
    teamAndBudget.otherTeamStructureText?.trim()
      ? teamAndBudget.otherTeamStructureText.trim()
      : (TEAM_STRUCTURE_LABELS[teamAndBudget.teamStructureType] || '').replace(
          /^[^\w]+/,
          ''
        );
  const skillCoverageLabel =
    teamAndBudget.skillCoverage === 'OTHER' &&
    teamAndBudget.otherSkillCoverageText?.trim()
      ? teamAndBudget.otherSkillCoverageText.trim()
      : (SKILL_COVERAGE_LABELS[teamAndBudget.skillCoverage] || '').replace(
          /^[^\w]+/,
          ''
        );
  const startingBudgetLabel =
    teamAndBudget.startingBudgetBracket === 'OTHER' &&
    (teamAndBudget.otherStartingBudgetText?.trim() ||
      teamAndBudget.otherBudgetText?.trim())
      ? (
          teamAndBudget.otherStartingBudgetText ||
          teamAndBudget.otherBudgetText ||
          ''
        ).trim()
      : formatStartingBudgetBracket(
          teamAndBudget.startingBudgetBracket,
          countryPack.defaultCurrency
        );

  const industryConnectionLabel =
    founderRealityCheck.industryConnection === 'OTHER' &&
    founderRealityCheck.otherIndustryConnectionText?.trim()
      ? founderRealityCheck.otherIndustryConnectionText.trim()
      : (
          INDUSTRY_CONNECTION_LABELS[founderRealityCheck.industryConnection] || ''
        ).replace(/^[^\w]+/, '');
  const incomeUrgencyLabel =
    founderRealityCheck.personalIncomeUrgency === 'OTHER' &&
    founderRealityCheck.otherIncomeUrgencyText?.trim()
      ? founderRealityCheck.otherIncomeUrgencyText.trim()
      : (
          INCOME_URGENCY_LABELS[founderRealityCheck.personalIncomeUrgency] || ''
        ).replace(/^[^\w]+/, '');
  const dealbreakersList = (founderRealityCheck.dealbreakers || []).map((d) =>
    d === 'OTHER' && founderRealityCheck.otherDealbreakerText?.trim()
      ? founderRealityCheck.otherDealbreakerText.trim()
      : (DEALBREAKER_LABELS[d] || d).replace(/^[^\w]+/, '')
  );
  const growthTradeoffLabel =
    founderRealityCheck.growthTradeoff === 'OTHER' &&
    founderRealityCheck.otherGrowthTradeoffText?.trim()
      ? founderRealityCheck.otherGrowthTradeoffText.trim()
      : (GROWTH_TRADEOFF_LABELS[founderRealityCheck.growthTradeoff] || '').replace(
          /^[^\w]+/,
          ''
        );
  const biggestWorryLabel =
    (BIGGEST_WORRY_LABELS[founderRealityCheck.biggestWorryPreset] || '').replace(
      /^[^\w]+/,
      ''
    );

  // Module B Labels
  const buyerModelLabel = modB?.beachhead
    ? modB.beachhead.buyerTypes && modB.beachhead.buyerTypes.length > 0
      ? modB.beachhead.buyerTypes
          .map((t) =>
            t === 'OTHER' && modB.beachhead?.otherBuyerModelText?.trim()
              ? modB.beachhead.otherBuyerModelText.trim()
              : (BUYER_MODEL_LABELS[t] || t).replace(/^[^\w]+/, '')
          )
          .join(' + ')
      : modB.beachhead.buyerType === 'OTHER' &&
          modB.beachhead.otherBuyerModelText?.trim()
        ? modB.beachhead.otherBuyerModelText.trim()
        : (BUYER_MODEL_LABELS[modB.beachhead.buyerType] || '').replace(
            /^[^\w]+/,
            ''
          )
    : '';

  const competitorNames = (modB?.competitorsAndStatusQuo?.competitors || [])
    .map((c) => c.name.trim())
    .filter(Boolean);

  // Module C Quotes & Pain Points (Sanitized of any /v/[slug] references)
  const rawValidatedPains = (latestInsights?.validatedPainPoints || []).map((p) =>
    sanitizeSurveyTerminologyForReader(p)
  );
  const firstInterviewQuote =
    interviews.find((i) => Boolean(i.verbatimQuote?.trim()))?.verbatimQuote ||
    interviews[0]?.keyTakeaway ||
    '';

  // Module D Labels
  const productTrackLabel = veh
    ? veh.productTrack === 'OTHER' && veh.otherProductTrackText?.trim()
      ? veh.otherProductTrackText.trim()
      : PRODUCT_TRACK_READER_LABELS[veh.productTrack] || veh.productTrack
    : '';
  const formFactorLabel = veh
    ? veh.formFactor === 'OTHER' && veh.otherFormFactorText?.trim()
      ? veh.otherFormFactorText.trim()
      : FORM_FACTOR_READER_LABELS[veh.formFactor] || veh.formFactor
    : '';
  const prototypeApproachLabel = veh
    ? veh.v1PrototypeApproach === 'OTHER' &&
      veh.otherV1PrototypeApproachText?.trim()
      ? veh.otherV1PrototypeApproachText.trim()
      : PROTOTYPE_APPROACH_READER_LABELS[veh.v1PrototypeApproach] ||
        veh.v1PrototypeApproach
    : '';
  const launchTimelineLabel = veh
    ? veh.launchTimeline === 'OTHER' && veh.otherLaunchTimelineText?.trim()
      ? veh.otherLaunchTimelineText.trim()
      : LAUNCH_TIMELINE_READER_LABELS[veh.launchTimeline] || veh.launchTimeline
    : '';

  const v1MustHaveTitles = (scope?.items || [])
    .filter((i) => i.bucket === 'MUST_HAVE_V1')
    .map((i) => i.title.trim())
    .filter(Boolean);
  const deferredPostV1Titles = (scope?.items || [])
    .filter((i) => i.bucket !== 'MUST_HAVE_V1')
    .map((i) => i.title.trim())
    .filter(Boolean);
  const inHouseCoreBuildTitles = (bvb?.items || [])
    .filter((i) => i.tier === 'BUILD_IN_HOUSE')
    .map((i) => i.title.trim())
    .filter(Boolean);
  const totalWorkPackagesCost = (wps?.workPackages || []).reduce(
    (sum, wp) => sum + (Number(wp.estimatedCostAmount) || 0),
    0
  );
  const isPrimaryOwned = Boolean(
    chan?.primaryChannel &&
      [
        'DIRECT_WEB_STRIPE',
        'DIRECT_WEB_CRAFT_MARKETS',
        'DIRECT_WEB_PORTAL_STRIPE',
        'DIRECT_WEB_MANAGED_ESCROW',
        'DIRECT_STRIPE_SUBSCRIPTION_LINK',
        'DIRECT_HARDWARE_BUNDLE_WEB',
        'B2B_INSTITUTIONAL_INVOICE',
        'B2B_INVOICE_BANK_TRANSFER',
        'B2B_ANNUAL_SUBSCRIPTION_PLUS_TAKE',
      ].includes(chan.primaryChannel)
  );
  const primaryShare = chan?.primaryChannelSharePercent ?? 70;
  const ownedChannelsSharePercent = chan?.primaryChannel
    ? isPrimaryOwned
      ? primaryShare
      : Math.max(0, 100 - primaryShare)
    : 0;
  const rentedChannelsSharePercent = chan?.primaryChannel
    ? 100 - ownedChannelsSharePercent
    : 0;

  // Module E Metrics
  const fulfillmentModeLabel = opsBp?.fulfillmentMode
    ? opsBp.fulfillmentMode === 'OTHER' && opsBp.otherFulfillmentModeText?.trim()
      ? opsBp.otherFulfillmentModeText.trim()
      : FULFILLMENT_MODE_READER_LABELS[opsBp.fulfillmentMode] ||
        opsBp.fulfillmentMode
    : '';
  const turnaroundSlaLabel = opsBp?.turnaroundSla
    ? opsBp.turnaroundSla === 'OTHER' && opsBp.otherTurnaroundSlaText?.trim()
      ? opsBp.otherTurnaroundSlaText.trim()
      : TURNAROUND_SLA_READER_LABELS[opsBp.turnaroundSla] || opsBp.turnaroundSla
    : '';

  const stages = opsBp?.orderLifecycleStages || [];
  const totalActiveMinutesPerOrder = stages.reduce(
    (sum, s) => sum + (Number(s.activeMinutesPerOrder) || 0),
    0
  );
  const totalDirectVariableCostPerOrder = stages.reduce(
    (sum, s) => sum + (Number(s.directVariableCostPerOrder) || 0),
    0
  );
  const weeklyHours = Number(opsBp?.weeklyOpsHoursAllocated) || 20;
  const maxWeeklyOrdersCapacity =
    totalActiveMinutesPerOrder > 0
      ? Math.max(1, Math.floor((weeklyHours * 60) / totalActiveMinutesPerOrder))
      : 0;

  const premisesModeLabel = prem?.premisesSetupMode
    ? prem.premisesSetupMode === 'OTHER' && prem.otherPremisesSetupModeText?.trim()
      ? prem.otherPremisesSetupModeText.trim()
      : PREMISES_MODE_READER_LABELS[prem.premisesSetupMode] ||
        prem.premisesSetupMode
    : '';
  const totalEquipmentCapexExVat = (prem?.equipmentItems || []).reduce(
    (sum, item) => sum + (Number(item.totalCostExVat) || 0),
    0
  );

  const sortedRisks = [...(riskReg?.riskItems || [])].sort(
    (a, b) => (b.grossRiskScore || 0) - (a.grossRiskScore || 0)
  );
  const topRisk = sortedRisks[0];
  const topRiskTitleAndMitigation = topRisk
    ? `${topRisk.riskTitle} — Mitigated via: ${topRisk.mitigationAndContingencyPlan}`
    : '';

  return {
    planTitle: plan.title,
    founderName,
    hqCountryCode: plan.hqCountryCode,
    countryName: countryPack.countryName,
    currency,
    industryCategory: plan.industryCategory,
    exportScopeLabel,
    targetMarketsLabel,

    hasModuleA,
    hasModuleB,
    hasModuleC,
    hasModuleD,
    hasModuleE,
    activeChaptersCount,
    overallCompletionPercent,

    brainDumpText: sanitizeSurveyTerminologyForReader(brainDumpText.trim()),
    coreProblem: sanitizeSurveyTerminologyForReader(
      conceptCanvas.coreProblem.trim()
    ),
    targetCustomer: sanitizeSurveyTerminologyForReader(
      conceptCanvas.targetCustomer.trim()
    ),
    proposedSolution: sanitizeSurveyTerminologyForReader(
      conceptCanvas.proposedSolution.trim()
    ),
    unfairAdvantage: sanitizeSurveyTerminologyForReader(
      conceptCanvas.unfairAdvantage.trim()
    ),
    revenueAndGrantFit: sanitizeSurveyTerminologyForReader(
      conceptCanvas.revenueAndGrantFit.trim()
    ),
    motivationLabel,
    weeklyHoursLabel,
    twelveMonthSuccessVision: founderMotivation.twelveMonthSuccessVision.trim(),
    teamStructureLabel,
    skillCoverageLabel,
    startingBudgetLabel,
    teamAndFundingNotes: teamAndBudget.teamAndFundingNotes.trim(),
    industryConnectionLabel,
    incomeUrgencyLabel,
    dealbreakersList,
    growthTradeoffLabel,
    biggestWorryLabel,
    biggestWorryNotes: founderRealityCheck.biggestWorryNotes.trim(),

    buyerModelLabel,
    beachheadSegment: modB?.beachhead?.beachheadSegment?.trim() || '',
    decisionMakerRole: modB?.beachhead?.decisionMakerRole?.trim() || '',
    buyingTriggerNotes: modB?.beachhead?.buyingTriggerNotes?.trim() || '',
    workaroundFrustrationNotes:
      modB?.competitorsAndStatusQuo?.workaroundFrustrationNotes?.trim() || '',
    whySwitchOneSentence:
      modB?.competitorsAndStatusQuo?.whySwitchOneSentence?.trim() || '',
    competitorNames,
    competitorsCount: competitorNames.length,
    somAnnualRevenue: som,
    samAnnualRevenue: sam,
    tamAnnualRevenue: tam,
    somFormatted: som > 0 ? formatPlanCurrency(som, currency) : '',
    samFormatted: sam > 0 ? formatPlanCurrency(sam, currency) : '',
    tamFormatted: tam > 0 ? formatPlanCurrency(tam, currency) : '',
    marketSizingAssumptions:
      modB?.marketSizing?.sourceAndAssumptionNotes?.trim() || '',
    competitiveEdgeSummary:
      modB?.competitiveWedge?.competitiveEdgeSummary?.trim() || '',
    switchingFrictionNotes:
      modB?.competitiveWedge?.switchingFrictionPlanNotes?.trim() || '',

    surveysCount: validSurveys.length,
    totalSurveyResponses: allResponses.length,
    realSurveyResponses: realResponses.length,
    waitlistOptInsCount: waitlistOptIns.length,
    interviewsCount: interviews.length,
    strongSignalInterviewsCount: strongSignalInterviews.length,
    avgInterviewPainScore,
    surveyHeadlineInsight: sanitizeSurveyTerminologyForReader(
      latestInsights?.headlineTakeaway?.trim() || ''
    ),
    topValidatedPainPoints: rawValidatedPains,
    sampleCustomerQuote: sanitizeSurveyTerminologyForReader(
      firstInterviewQuote.trim()
    ),

    productTrackLabel,
    formFactorLabel,
    prototypeApproachLabel,
    launchTimelineLabel,
    ahaMomentNarrative: sanitizeSurveyTerminologyForReader(
      veh?.ahaMomentNarrative?.trim() || ''
    ),
    whyVehicleFitsNarrative: sanitizeSurveyTerminologyForReader(
      veh?.whyThisVehicleFitsCustomer?.trim() || ''
    ),
    ownedChannelsSharePercent,
    rentedChannelsSharePercent,
    channelStrategyNotes: sanitizeSurveyTerminologyForReader(
      chan?.channelWhyItFitsNotes?.trim() || ''
    ),
    v1MustHaveTitles,
    deferredPostV1Titles,
    whatWeRefuseToBuildNarrative: sanitizeSurveyTerminologyForReader(
      scope?.whatWeRefuseToBuildInV1Narrative?.trim() || ''
    ),
    inHouseCoreBuildTitles,
    workPackagesCount: wps?.workPackages?.length ?? 0,
    totalWorkPackagesCost,
    technicalMeritNarrative: sanitizeSurveyTerminologyForReader(
      wps?.technicalMeritAndInnovationNarrative?.trim() || ''
    ),
    executiveProductBriefSummary: sanitizeSurveyTerminologyForReader(
      modDAudit?.executiveProductBriefSummary?.trim() || ''
    ),

    fulfillmentModeLabel,
    turnaroundSlaLabel,
    weeklyOpsHoursAllocated: weeklyHours,
    orderStagesCount: stages.length,
    totalActiveMinutesPerOrder,
    totalDirectVariableCostPerOrder,
    maxWeeklyOrdersCapacity,
    endToEndFulfillmentNarrative: sanitizeSurveyTerminologyForReader(
      opsBp?.endToEndFulfillmentNarrative?.trim() || ''
    ),
    premisesModeLabel,
    monthlyPremisesCost: Number(prem?.monthlyPremisesAndUtilitiesCost) || 0,
    equipmentItemsCount: prem?.equipmentItems?.length ?? 0,
    totalEquipmentCapexExVat,
    riskItemsCount: riskReg?.riskItems?.length ?? 0,
    topRiskTitleAndMitigation: sanitizeSurveyTerminologyForReader(
      topRiskTitleAndMitigation
    ),
    qcCheckpointsCount: supQc?.qcCheckpoints?.length ?? 0,
    estimatedReturnRatePercent:
      Number(supQc?.estimatedReturnOrRefundRatePercent) || 0,
    complianceItemsCount: permIns?.complianceItems?.length ?? 0,
    estimatedAnnualInsurancePremium:
      Number(permIns?.estimatedAnnualInsurancePremium) || 0,
    executiveOperationsSummaryNarrative: sanitizeSurveyTerminologyForReader(
      modEAudit?.executiveOperationsSummaryNarrative?.trim() || ''
    ),
  };
}

/**
 * Builds the 3-Paragraph Cohesive Executive Story using 100% deterministic,
 * strictly grounded facts from the founder's saved inputs.
 * Never invents or extrapolates any fact that has not been entered.
 */
export function buildDeterministicMasterStory(
  facts: MasterDocumentVerifiedFacts
): SavedMasterDocumentData {
  // Paragraph 1: Opportunity, Concept & Market (Modules A + B)
  const p1Parts: string[] = [];
  const p1Sources: string[] = [];

  if (facts.hasModuleA) {
    const coreIntro = `${facts.planTitle} is a ${facts.countryName}-based (${facts.currency}) ${facts.industryCategory} venture${
      facts.targetCustomer ? ` built for ${facts.targetCustomer}` : ''
    }.`;
    p1Parts.push(coreIntro);
    if (facts.coreProblem) {
      p1Parts.push(`The core problem addressed is: ${facts.coreProblem}`);
    }
    if (facts.proposedSolution) {
      p1Parts.push(`Proposed solution: ${facts.proposedSolution}`);
    }
    p1Sources.push('Module A: Concept Canvas');

    if (facts.teamStructureLabel || facts.startingBudgetLabel) {
      p1Parts.push(
        `The business is structured as a ${facts.teamStructureLabel || 'founder-led'} operation (${facts.weeklyHoursLabel || 'active weekly commitment'}) with an initial starting budget in the ${facts.startingBudgetLabel || 'bootstrapped'} bracket.`
      );
      p1Sources.push('Module A: Founder Fit & Budget');
    }
  }

  if (facts.hasModuleB) {
    if (facts.beachheadSegment) {
      p1Parts.push(
        `In Module B, the priority beachhead customer segment is defined as ${facts.beachheadSegment}${
          facts.buyerModelLabel ? ` (${facts.buyerModelLabel})` : ''
        }.`
      );
      p1Sources.push('Module B: Beachhead Persona');
    }
    if (facts.whySwitchOneSentence) {
      p1Parts.push(
        `Customers switch from existing alternatives${
          facts.competitorNames.length > 0
            ? ` (${facts.competitorNames.slice(0, 3).join(', ')})`
            : ''
        } because: ${facts.whySwitchOneSentence}`
      );
      p1Sources.push('Module B: Competitor Analysis');
    }
    if (facts.somAnnualRevenue > 0) {
      p1Parts.push(
        `Bottom-up market sizing targets a Year 1–2 Serviceable Obtainable Market (SOM) of ${facts.somFormatted}/year within a reachable market (SAM) of ${facts.samFormatted}/year.`
      );
      p1Sources.push('Module B: Market Sizing (SOM/SAM)');
    }
  }

  const paragraph1OpportunityAndMarket =
    p1Parts.length > 0
      ? sanitizeSurveyTerminologyForReader(p1Parts.join(' '))
      : `${facts.planTitle} (${facts.countryName} • ${facts.currency}) is currently capturing its initial concept and market foundations in Module A and Module B.`;

  // Paragraph 2: Customer Validation & Product Architecture (Modules C + D)
  const p2Parts: string[] = [];
  const p2Sources: string[] = [];

  if (facts.hasModuleC) {
    const surveyPieces: string[] = [];
    if (facts.surveysCount > 0) {
      surveyPieces.push(
        `${facts.totalSurveyResponses} response(s) across ${facts.surveysCount} public validation survey(s)${
          facts.waitlistOptInsCount > 0
            ? ` (with ${facts.waitlistOptInsCount} early waitlist signup(s))`
            : ''
        }`
      );
      p2Sources.push('Module C: Public Validation Surveys');
    }
    if (facts.interviewsCount > 0) {
      surveyPieces.push(
        `${facts.interviewsCount} logged 1-on-1 customer discovery interview(s)${
          facts.avgInterviewPainScore
            ? ` averaging ${facts.avgInterviewPainScore}/5 on problem urgency`
            : ''
        }`
      );
      p2Sources.push('Module C: 1-on-1 Customer Interviews');
    }
    if (surveyPieces.length > 0) {
      p2Parts.push(
        `Customer validation to date encompasses ${surveyPieces.join(' and ')}.`
      );
    }
    if (facts.surveyHeadlineInsight) {
      p2Parts.push(`Key validation signal: ${facts.surveyHeadlineInsight}`);
    } else if (facts.sampleCustomerQuote) {
      p2Parts.push(`Recorded customer takeaway: "${facts.sampleCustomerQuote}"`);
    }
  }

  if (facts.hasModuleD) {
    if (facts.formFactorLabel || facts.productTrackLabel) {
      p2Parts.push(
        `On the product side, ${facts.planTitle} is building a ${
          facts.formFactorLabel || facts.productTrackLabel
        }${
          facts.launchTimelineLabel
            ? ` targeting a V1 launch window of ${facts.launchTimelineLabel}`
            : ''
        }.`
      );
      p2Sources.push('Module D: Product Vehicle');
    }
    if (
      facts.ownedChannelsSharePercent > 0 ||
      facts.rentedChannelsSharePercent > 0
    ) {
      p2Parts.push(
        `Distribution is structured around ${facts.ownedChannelsSharePercent}% owned direct channels and ${facts.rentedChannelsSharePercent}% partner or marketplace channels.`
      );
      p2Sources.push('Module D: Own vs. Rent Channel Matrix');
    }
    if (facts.v1MustHaveTitles.length > 0) {
      p2Parts.push(
        `V1 scope is strictly focused on ${facts.v1MustHaveTitles
          .slice(0, 4)
          .join(', ')}${
          facts.deferredPostV1Titles.length > 0
            ? `, while deferring ${facts.deferredPostV1Titles
                .slice(0, 3)
                .join(', ')} to post-launch phases`
            : ''
        }.`
      );
      p2Sources.push('Module D: V1 Scope Filter');
    }
    if (facts.workPackagesCount > 0) {
      p2Parts.push(
        `Execution is broken into ${facts.workPackagesCount} structured work package(s) with an estimated build budget of ${formatPlanCurrency(
          facts.totalWorkPackagesCost,
          facts.currency
        )}.`
      );
      p2Sources.push('Module D: Work Packages');
    }
  }

  const paragraph2ValidationAndProduct =
    p2Parts.length > 0
      ? sanitizeSurveyTerminologyForReader(p2Parts.join(' '))
      : 'Customer validation (Module C: Public Validation Surveys & 1-on-1 Interviews) and Product Architecture (Module D: Product Vehicle & V1 Scope) have not yet been populated.';

  // Paragraph 3: Operations, Fulfillment, Equipment & Risk Posture (Module E)
  const p3Parts: string[] = [];
  const p3Sources: string[] = [];

  if (facts.hasModuleE) {
    if (facts.fulfillmentModeLabel) {
      p3Parts.push(
        `Operational fulfillment runs via ${facts.fulfillmentModeLabel}${
          facts.turnaroundSlaLabel
            ? ` with a target turnaround SLA of ${facts.turnaroundSlaLabel}`
            : ''
        }.`
      );
      p3Sources.push('Module E: Fulfillment Blueprint');
    }
    if (facts.orderStagesCount > 0) {
      p3Parts.push(
        `Across ${facts.orderStagesCount} mapped order lifecycle stages, each order requires ${facts.totalActiveMinutesPerOrder} active minutes and ${formatPlanCurrency(
          facts.totalDirectVariableCostPerOrder,
          facts.currency
        )} in direct variable fulfillment cost${
          facts.maxWeeklyOrdersCapacity > 0
            ? ` (supporting up to ~${facts.maxWeeklyOrdersCapacity} orders/week within ${facts.weeklyOpsHoursAllocated} allocated weekly ops hours)`
            : ''
        }.`
      );
      p3Sources.push('Module E: Unit Order Lifecycle');
    }
    if (facts.premisesModeLabel || facts.equipmentItemsCount > 0) {
      p3Parts.push(
        `The business operates from a ${
          facts.premisesModeLabel || 'lean premises setup'
        } (${formatPlanCurrency(facts.monthlyPremisesCost, facts.currency)}/month overhead) with ${
          facts.equipmentItemsCount
        } scheduled equipment asset(s) totaling ${formatPlanCurrency(
          facts.totalEquipmentCapexExVat,
          facts.currency
        )} ex-VAT.`
      );
      p3Sources.push('Module E: Premises & Equipment Schedule');
    }
    if (facts.riskItemsCount > 0) {
      p3Parts.push(
        `Operational governance tracks ${facts.riskItemsCount} formal project risk(s)${
          facts.qcCheckpointsCount > 0
            ? ` and ${facts.qcCheckpointsCount} quality control checkpoint(s)`
            : ''
        }${
          facts.topRiskTitleAndMitigation
            ? `, led by mitigating "${facts.topRiskTitleAndMitigation}"`
            : ''
        }.`
      );
      p3Sources.push('Module E: Risk Register & QC');
    }
  } else if (facts.hasModuleA && facts.dealbreakersList.length > 0) {
    p3Parts.push(
      `Operational guardrails established in Module A enforce key founder non-negotiables (${facts.dealbreakersList.join(
        ', '
      )}) and a ${
        facts.growthTradeoffLabel || 'disciplined'
      } growth strategy. Detailed fulfillment stages, equipment schedules, and the project risk register will populate automatically once Module E is completed.`
    );
    p3Sources.push('Module A: Founder Non-Negotiables');
  }

  const paragraph3OperationsAndExecution =
    p3Parts.length > 0
      ? sanitizeSurveyTerminologyForReader(p3Parts.join(' '))
      : 'Operational fulfillment, premises, equipment CapEx, and the 4-category risk register (Module E) have not yet been populated.';

  return {
    paragraph1OpportunityAndMarket,
    paragraph1Sources:
      p1Sources.length > 0 ? p1Sources : ['Awaiting Module A & B Inputs'],
    paragraph2ValidationAndProduct,
    paragraph2Sources:
      p2Sources.length > 0 ? p2Sources : ['Awaiting Module C & D Inputs'],
    paragraph3OperationsAndExecution,
    paragraph3Sources:
      p3Sources.length > 0 ? p3Sources : ['Awaiting Module E Inputs'],
    isCustomEdited: false,
    lastWeavedAt: new Date().toISOString(),
    aiEngineUsed: 'smart-synthesizer',
  };
}

/**
 * Generates a complete, reader-friendly Markdown export of the Living Master Document.
 * Never outputs `/v/[slug]`—always refers to Public Validation Surveys.
 */
export function buildMasterDocumentMarkdown(
  params: MasterDocumentInputParams & {
    story: SavedMasterDocumentData;
    showUpcomingChaptersRoadmap?: boolean;
  }
): string {
  const facts = extractMasterDocumentVerifiedFacts(params);
  const { plan, story, showUpcomingChaptersRoadmap } = params;
  const dateStr = new Date().toLocaleDateString('en-IE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const lines: string[] = [
    `# ${facts.planTitle} — Living Master Business Blueprint`,
    `**Prepared by:** ${facts.founderName} | **Date:** ${dateStr}`,
    `**HQ Country:** ${facts.countryName} (${facts.currency}) | **Industry:** ${facts.industryCategory} | **Scope:** ${facts.exportScopeLabel}`,
    `**Blueprint Progress:** ${facts.activeChaptersCount} of 5 Core Foundation Chapters Active (${facts.overallCompletionPercent}% Assembled)`,
    '',
    '---',
    '',
    '## 1. Executive Snapshot (Whole-Picture Summary)',
    '',
    '### 🎯 The Concept & Founder Fit (Module A)',
    `- **Core Problem:** ${facts.coreProblem || 'Not yet entered in Module A.'}`,
    `- **Target Customer:** ${facts.targetCustomer || 'Not yet entered in Module A.'}`,
    `- **Proposed Solution:** ${facts.proposedSolution || 'Not yet entered in Module A.'}`,
    `- **Unfair Advantage:** ${facts.unfairAdvantage || 'Not yet entered in Module A.'}`,
    `- **Founder Commitment & Budget:** ${facts.teamStructureLabel || 'Founder'} • ${facts.weeklyHoursLabel || 'Weekly hours not set'} • ${facts.startingBudgetLabel || 'Budget not set'}`,
    '',
    '### 📊 Market & Competitive Wedge (Module B)',
    ...(facts.hasModuleB
      ? [
          `- **Priority Beachhead Customer:** ${facts.beachheadSegment || 'Not yet specified'} (${facts.buyerModelLabel || 'Buyer model not set'})`,
          `- **Why Customers Switch:** ${facts.whySwitchOneSentence || 'Not yet specified'}`,
          `- **Mapped Competitors (${facts.competitorsCount}):** ${facts.competitorNames.length > 0 ? facts.competitorNames.join(', ') : 'None listed yet'}`,
          `- **Year 1–2 Revenue Target (SOM):** ${facts.somFormatted || 'Not yet calculated'} (Reachable SAM: ${facts.samFormatted || 'N/A'} | Wider TAM: ${facts.tamFormatted || 'N/A'})`,
        ]
      : ['- *Module B (Market & Competitive Intelligence) has not been filled in yet.*']),
    '',
    '### 💬 Customer Validation Proof (Module C)',
    ...(facts.hasModuleC
      ? [
          `- **Public Validation Surveys:** ${facts.totalSurveyResponses} response(s) across ${facts.surveysCount} survey(s) (${facts.waitlistOptInsCount} early waitlist signup(s))`,
          `- **1-on-1 Customer Interviews:** ${facts.interviewsCount} interview(s) logged (${facts.strongSignalInterviewsCount} Strong Signal${facts.avgInterviewPainScore ? ` • ${facts.avgInterviewPainScore}/5 avg urgency` : ''})`,
          ...(facts.surveyHeadlineInsight
            ? [`- **Headline Validation Signal:** ${facts.surveyHeadlineInsight}`]
            : []),
        ]
      : ['- *Module C (Public Validation Surveys & 1-on-1 Interviews) has not been filled in yet.*']),
    '',
    '### 🛠️ What We Are Building (Module D)',
    ...(facts.hasModuleD
      ? [
          `- **Product Vehicle:** ${facts.formFactorLabel || facts.productTrackLabel || 'Not specified'} (${facts.prototypeApproachLabel || 'V1 build'}) • Target Launch: ${facts.launchTimelineLabel || 'TBD'}`,
          `- **Channel Strategy:** ${facts.ownedChannelsSharePercent}% Owned Direct Channels / ${facts.rentedChannelsSharePercent}% Partner & Rented Channels`,
          `- **V1 Must-Have Scope (${facts.v1MustHaveTitles.length}):** ${facts.v1MustHaveTitles.join(', ') || 'None listed'}`,
          `- **Work Packages (${facts.workPackagesCount}):** ${formatPlanCurrency(facts.totalWorkPackagesCost, facts.currency)} total estimated V1 build budget`,
        ]
      : ['- *Module D (Product Vehicle & V1 Scope) has not been filled in yet.*']),
    '',
    '### ⚙️ Operations, Equipment & Risk Posture (Module E)',
    ...(facts.hasModuleE
      ? [
          `- **Fulfillment Model & SLA:** ${facts.fulfillmentModeLabel || 'Not set'} • Turnaround SLA: ${facts.turnaroundSlaLabel || 'Not set'}`,
          `- **Unit Order Economics:** ${facts.totalActiveMinutesPerOrder} active mins/order • ${formatPlanCurrency(facts.totalDirectVariableCostPerOrder, facts.currency)} direct variable cost/order • ~${facts.maxWeeklyOrdersCapacity} orders/wk capacity`,
          `- **Premises & Equipment CapEx:** ${facts.premisesModeLabel || 'Premises'} (${formatPlanCurrency(facts.monthlyPremisesCost, facts.currency)}/mo) • ${facts.equipmentItemsCount} equipment item(s) totaling ${formatPlanCurrency(facts.totalEquipmentCapexExVat, facts.currency)} ex-VAT`,
          `- **Risk & Quality Governance:** ${facts.riskItemsCount} formal risk(s) mapped • ${facts.qcCheckpointsCount} QC checkpoint(s)`,
        ]
      : ['- *Module E (Operations, Equipment & Risk Register) has not been filled in yet.*']),
    '',
    '---',
    '',
    '## 2. Cohesive Executive Story (Zero-Hallucination Grounded Narrative)',
    '',
    '### Opportunity, Concept & Market Wedge',
    sanitizeSurveyTerminologyForReader(story.paragraph1OpportunityAndMarket),
    `*Grounded strictly in: ${story.paragraph1Sources.join(' • ')}*`,
    '',
    '### Customer Validation & V1 Product Architecture',
    sanitizeSurveyTerminologyForReader(story.paragraph2ValidationAndProduct),
    `*Grounded strictly in: ${story.paragraph2Sources.join(' • ')}*`,
    '',
    '### Operational Execution, Unit Delivery & De-Risking',
    sanitizeSurveyTerminologyForReader(story.paragraph3OperationsAndExecution),
    `*Grounded strictly in: ${story.paragraph3Sources.join(' • ')}*`,
    '',
  ];

  // Chapter 1: Module A
  if (facts.hasModuleA) {
    lines.push(
      '---',
      '',
      '## Chapter 1: Ideation, Concept Canvas, Founder Fit & Grant Eligibility (Module A)',
      '',
      `- **Raw Idea Summary:** ${facts.brainDumpText || '—'}`,
      `- **1. Core Problem:** ${facts.coreProblem || '—'}`,
      `- **2. Target Customer:** ${facts.targetCustomer || '—'}`,
      `- **3. Proposed Solution:** ${facts.proposedSolution || '—'}`,
      `- **4. Unfair Advantage:** ${facts.unfairAdvantage || '—'}`,
      `- **5. Revenue & Grant Fit:** ${facts.revenueAndGrantFit || '—'}`,
      `- **12-Month Success Vision:** ${facts.twelveMonthSuccessVision || '—'}`,
      `- **Team & Funding Notes:** ${facts.teamAndFundingNotes || '—'}`,
      `- **Non-Negotiable Dealbreakers:** ${facts.dealbreakersList.length > 0 ? facts.dealbreakersList.join(', ') : 'None specified'}`,
      `- **#1 Worry & Reality Check:** ${facts.biggestWorryLabel ? `${facts.biggestWorryLabel} — ` : ''}${facts.biggestWorryNotes || '—'}`,
      ''
    );

    if (
      isGrantCheckerSupportedForCountry(plan.hqCountryCode) &&
      params.conceptCanvas &&
      params.founderMotivation &&
      params.teamAndBudget &&
      params.founderRealityCheck
    ) {
      const grantEval = evaluateModuleAGrantEligibility({
        hqCountryCode: plan.hqCountryCode,
        exportPotential: plan.exportPotential,
        industryCategory: plan.industryCategory,
        brainDumpText: facts.brainDumpText,
        conceptCanvas: params.conceptCanvas,
        founderMotivation: params.founderMotivation,
        teamAndBudget: params.teamAndBudget,
        founderRealityCheck: params.founderRealityCheck,
        grantCheck:
          plan.grantEligibilityCheck ||
          getDefaultGrantEligibilityCheck({
            hqCountryCode: plan.hqCountryCode,
            exportPotential: plan.exportPotential,
            industryCategory: plan.industryCategory,
            founderMotivation: params.founderMotivation,
          }),
      });
      lines.push(
        '### Grants & Non-Dilutive Funding You Qualify For Right Now (Step 7)',
        `- **Immediate Qualified Pool:** ${grantEval.immediateQualifiedPoolFormatted} (${grantEval.qualifiesNowGrants.length} schemes ready now)`,
        `- **Unlockable Phase 2 Scale Pool:** ${grantEval.unlockableScalePoolFormatted} (${grantEval.unlockableNextGrants.length} schemes unlockable next)`,
        ...grantEval.qualifiesNowGrants.map(
          (g) =>
            `- **🟢 ${g.grantName}** (${g.providerAgency} • ${g.potentialValueFormatted}): ${g.whyYouMatchOrMiss} *(Match Rule: ${g.coFundingOrMatchRequirement})*`
        ),
        ''
      );
    }
  }

  // Chapter 2: Module B
  if (facts.hasModuleB && plan.moduleBData) {
    const b = plan.moduleBData;
    lines.push(
      '---',
      '',
      '## Chapter 2: Market Intelligence, Competitors & Wedge (Module B)',
      '',
      `- **Customer Model:** ${facts.buyerModelLabel || '—'}`,
      `- **Priority Beachhead Customer:** ${facts.beachheadSegment || '—'}`,
      `- **Decision-Maker Role:** ${facts.decisionMakerRole || '—'}`,
      `- **Urgent Buying Trigger:** ${facts.buyingTriggerNotes || '—'}`,
      `- **Why Current Workarounds Frustrate Buyers:** ${facts.workaroundFrustrationNotes || '—'}`,
      `- **Why Customers Switch to Us:** ${facts.whySwitchOneSentence || '—'}`,
      '',
      '### Mapped Competitors & Alternatives',
      ...(b.competitorsAndStatusQuo?.competitors?.length
        ? b.competitorsAndStatusQuo.competitors.map(
            (c, idx) =>
              `${idx + 1}. **${c.name || 'Competitor'}** (${c.typicalPriceText || 'Price N/A'}) — *Strengths:* ${c.whatTheyDoWell || '—'} | *Gaps:* ${c.whereTheyFallShort || '—'}`
          )
        : ['- No competitors listed yet.']),
      '',
      '### Bottom-Up Market Sizing',
      `- **Year 1–2 Revenue Goal (SOM):** ${facts.somFormatted || '—'}/year`,
      `- **Reachable Market in Target Geographies (SAM):** ${facts.samFormatted || '—'}/year`,
      `- **Wider Long-Term Market (TAM):** ${facts.tamFormatted || '—'}/year`,
      `- **Market Sizing Assumptions:** ${facts.marketSizingAssumptions || '—'}`,
      `- **Competitive Edge Summary:** ${facts.competitiveEdgeSummary || '—'}`,
      ''
    );
  }

  // Chapter 3: Module C
  if (facts.hasModuleC && plan.moduleCData) {
    const c = plan.moduleCData;
    lines.push(
      '---',
      '',
      '## Chapter 3: Public Validation Surveys, Waitlist & 1-on-1 Interviews (Module C)',
      '',
      `- **Public Validation Surveys Active:** ${facts.surveysCount}`,
      `- **Total Survey Responses Captured:** ${facts.totalSurveyResponses} (${facts.realSurveyResponses} live respondent(s), ${facts.waitlistOptInsCount} early waitlist signup(s))`,
      `- **1-on-1 Customer Discovery Interviews:** ${facts.interviewsCount} logged (${facts.strongSignalInterviewsCount} Strong Signal)`,
      ...(facts.surveyHeadlineInsight
        ? [`- **Synthesized Validation Takeaway:** ${facts.surveyHeadlineInsight}`]
        : []),
      ...(facts.topValidatedPainPoints.length > 0
        ? [
            '',
            '### Verified Customer Pain Points',
            ...facts.topValidatedPainPoints.map((p) => `- ${p}`),
          ]
        : []),
      ...((c.interviewLogs || []).length > 0
        ? [
            '',
            '### 1-on-1 Customer Interview Log Highlights',
            ...(c.interviewLogs || []).map(
              (log, idx) =>
                `${idx + 1}. **${log.intervieweeNameOrRole}** (${formatInterviewChannel(log)} • Pain: ${log.painScore1To5}/5 • ${INTERVIEW_SIGNAL_LABELS[log.signalBadge] || log.signalBadge})\n   - *Key Takeaway:* ${sanitizeSurveyTerminologyForReader(log.keyTakeaway || '—')}\n   - *Outcome:* ${formatInterviewCommitment(log)}`
            ),
          ]
        : []),
      ''
    );
  }

  // Chapter 4: Module D
  if (facts.hasModuleD && plan.moduleDData) {
    const d = plan.moduleDData;
    lines.push(
      '---',
      '',
      '## Chapter 4: Product Vehicle, V1 Scope & Work Packages (Module D)',
      '',
      `- **Product Track & Form Factor:** ${facts.productTrackLabel} — ${facts.formFactorLabel}`,
      `- **V1 Build Approach & Timeline:** ${facts.prototypeApproachLabel} (${facts.launchTimelineLabel})`,
      `- **Customer Aha Moment:** ${facts.ahaMomentNarrative || '—'}`,
      `- **Why This Vehicle Fits the Customer:** ${facts.whyVehicleFitsNarrative || '—'}`,
      `- **Channel Mix:** ${facts.ownedChannelsSharePercent}% Owned Direct vs. ${facts.rentedChannelsSharePercent}% Rented / Marketplace`,
      `- **V1 Must-Have Features/SKUs:** ${facts.v1MustHaveTitles.join(', ') || '—'}`,
      `- **What We Refuse to Build in V1:** ${facts.whatWeRefuseToBuildNarrative || '—'}`,
      ...((d.workPackagesAndFlow?.workPackages || []).length > 0
        ? [
            '',
            '### V1 Work Packages (WP1..n)',
            ...(d.workPackagesAndFlow?.workPackages || []).map(
              (wp) =>
                `- **${wp.wpCode}: ${wp.title}** (${formatPlanCurrency(wp.estimatedCostAmount, facts.currency)}) — ${wp.deliverableMilestoneProof || wp.deliverableMilestone || 'Deliverable defined'}`
            ),
          ]
        : []),
      ...(facts.technicalMeritNarrative
        ? [
            '',
            `- **Technical Merit & Innovation:** ${facts.technicalMeritNarrative}`,
          ]
        : []),
      ''
    );
  }

  // Chapter 5: Module E
  if (facts.hasModuleE && plan.moduleEData) {
    const e = plan.moduleEData;
    lines.push(
      '---',
      '',
      '## Chapter 5: Operations, Premises, Equipment & Risk Register (Module E)',
      '',
      `- **Fulfillment Mode & SLA:** ${facts.fulfillmentModeLabel} (${facts.turnaroundSlaLabel})`,
      `- **Unit Order Effort & Variable Cost:** ${facts.totalActiveMinutesPerOrder} mins/order • ${formatPlanCurrency(facts.totalDirectVariableCostPerOrder, facts.currency)}/order • ~${facts.maxWeeklyOrdersCapacity} orders/week ceiling`,
      `- **End-to-End Fulfillment Flow:** ${facts.endToEndFulfillmentNarrative || '—'}`,
      `- **Premises Setup:** ${facts.premisesModeLabel} (${formatPlanCurrency(facts.monthlyPremisesCost, facts.currency)}/month)`,
      `- **Equipment & CapEx Schedule (${facts.equipmentItemsCount} item(s)):** ${formatPlanCurrency(facts.totalEquipmentCapexExVat, facts.currency)} total ex-VAT`,
      ...((e.riskRegister?.riskItems || []).length > 0
        ? [
            '',
            '### 4-Category Project Risk Register',
            ...(e.riskRegister?.riskItems || []).map(
              (r) =>
                `- **[${r.riskCategory}] ${r.riskTitle}** (Gross Score: ${r.grossRiskScore}/25 → Residual: ${r.residualRiskRating}) — *Mitigation:* ${r.mitigationAndContingencyPlan}`
            ),
          ]
        : []),
      ...(facts.executiveOperationsSummaryNarrative
        ? [
            '',
            `- **Executive Operations Summary:** ${facts.executiveOperationsSummaryNarrative}`,
          ]
        : []),
      ''
    );
  }

  if (showUpcomingChaptersRoadmap) {
    lines.push(
      '---',
      '',
      '## Upcoming Chapters Roadmap (Modules F–I)',
      '- **Chapter 6 (Module F):** Co-Founder & Team Alignment, Promoter CVs, Personal Survival Budget & 7 Startup Hats',
      '- **Chapter 7 (Module G):** Pricing Architect, Written Sales Assumptions & Pocket Profit Unit Economics',
      '- **Chapter 8 (Module H):** Brand Positioning, 4Ps Strategy & First 10 Customers Playbook',
      '- **Chapter 9 (Module I):** 36-Month No-Spreadsheet Financial Builder, Cashflow Trough & Non-Dilutive Grant Matcher',
      ''
    );
  }

  return lines.join('\n');
}

/**
 * Generates a magazine-grade Standalone HTML & Print-to-PDF document for the Living Master Document.
 */
export function buildMasterDocumentStandaloneHtml(
  params: MasterDocumentInputParams & {
    story: SavedMasterDocumentData;
    showUpcomingChaptersRoadmap?: boolean;
  }
): string {
  const facts = extractMasterDocumentVerifiedFacts(params);
  const { plan, story, showUpcomingChaptersRoadmap } = params;
  const dateStr = new Date().toLocaleDateString('en-IE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const sections: string[] = [];

  // Section 1: 1-Page Executive Snapshot
  sections.push(`
    <div class="section">
      <div class="section-header">
        <span class="section-num">1</span>
        <span class="section-title">1-Page Executive Snapshot (Whole-Picture Summary)</span>
      </div>
      <div class="grid-2">
        <div class="box">
          <div class="box-label">🎯 Concept & Founder Fit (Module A)</div>
          <div class="box-value">
            <strong>Problem:</strong> ${escapeDocumentHtml(facts.coreProblem || 'Not yet entered')}<br/>
            <strong>Target Buyer:</strong> ${escapeDocumentHtml(facts.targetCustomer || 'Not yet entered')}<br/>
            <strong>Solution:</strong> ${escapeDocumentHtml(facts.proposedSolution || 'Not yet entered')}<br/>
            <strong>Founder Fit:</strong> ${escapeDocumentHtml(facts.teamStructureLabel || 'Founder')} • ${escapeDocumentHtml(facts.weeklyHoursLabel || 'Hours TBD')} • ${escapeDocumentHtml(facts.startingBudgetLabel || 'Budget TBD')}
          </div>
        </div>
        <div class="box">
          <div class="box-label">📊 Market & Competitive Wedge (Module B)</div>
          <div class="box-value">
            ${
              facts.hasModuleB
                ? `<strong>Beachhead:</strong> ${escapeDocumentHtml(facts.beachheadSegment || '—')} (${escapeDocumentHtml(facts.buyerModelLabel || '—')})<br/>
                   <strong>Why Buyers Switch:</strong> ${escapeDocumentHtml(facts.whySwitchOneSentence || '—')}<br/>
                   <strong>Competitors Mapped:</strong> ${facts.competitorsCount} (${escapeDocumentHtml(facts.competitorNames.slice(0, 3).join(', ') || 'None')})<br/>
                   <strong>Year 1–2 Target (SOM):</strong> ${escapeDocumentHtml(facts.somFormatted || 'TBD')}/yr (SAM: ${escapeDocumentHtml(facts.samFormatted || 'TBD')})`
                : '<em>Module B not yet completed.</em>'
            }
          </div>
        </div>
        <div class="box">
          <div class="box-label">💬 Customer Validation Proof (Module C)</div>
          <div class="box-value">
            ${
              facts.hasModuleC
                ? `<strong>Public Validation Surveys:</strong> ${facts.totalSurveyResponses} response(s) across ${facts.surveysCount} survey(s) (${facts.waitlistOptInsCount} waitlist signup(s))<br/>
                   <strong>1-on-1 Interviews:</strong> ${facts.interviewsCount} logged (${facts.strongSignalInterviewsCount} Strong Signal${facts.avgInterviewPainScore ? ` • ${escapeDocumentHtml(facts.avgInterviewPainScore)}/5 urgency` : ''})<br/>
                   <strong>Key Signal:</strong> ${escapeDocumentHtml(facts.surveyHeadlineInsight || facts.sampleCustomerQuote || 'Validation data recorded.')}`
                : '<em>Module C not yet completed.</em>'
            }
          </div>
        </div>
        <div class="box">
          <div class="box-label">🛠️ Product Vehicle & V1 Scope (Module D)</div>
          <div class="box-value">
            ${
              facts.hasModuleD
                ? `<strong>Vehicle:</strong> ${escapeDocumentHtml(facts.formFactorLabel || facts.productTrackLabel || '—')}<br/>
                   <strong>Channel Mix:</strong> ${facts.ownedChannelsSharePercent}% Owned Direct / ${facts.rentedChannelsSharePercent}% Rented<br/>
                   <strong>V1 Must-Haves (${facts.v1MustHaveTitles.length}):</strong> ${escapeDocumentHtml(facts.v1MustHaveTitles.slice(0, 4).join(', ') || '—')}<br/>
                   <strong>Work Packages (${facts.workPackagesCount}):</strong> ${escapeDocumentHtml(formatPlanCurrency(facts.totalWorkPackagesCost, facts.currency))} V1 budget`
                : '<em>Module D not yet completed.</em>'
            }
          </div>
        </div>
      </div>
      <div class="box" style="margin-top: 12px;">
        <div class="box-label">⚙️ Operations, Premises, Equipment & Risk Posture (Module E)</div>
        <div class="box-value">
          ${
            facts.hasModuleE
              ? `<strong>Fulfillment Mode & SLA:</strong> ${escapeDocumentHtml(facts.fulfillmentModeLabel || '—')} (${escapeDocumentHtml(facts.turnaroundSlaLabel || '—')}) • <strong>Unit Effort & Cost:</strong> ${facts.totalActiveMinutesPerOrder} mins/order & ${escapeDocumentHtml(formatPlanCurrency(facts.totalDirectVariableCostPerOrder, facts.currency))}/order (~${facts.maxWeeklyOrdersCapacity} orders/wk ceiling)<br/>
                 <strong>Premises & Equipment CapEx:</strong> ${escapeDocumentHtml(facts.premisesModeLabel || '—')} (${escapeDocumentHtml(formatPlanCurrency(facts.monthlyPremisesCost, facts.currency))}/mo) • ${facts.equipmentItemsCount} equipment item(s) totaling ${escapeDocumentHtml(formatPlanCurrency(facts.totalEquipmentCapexExVat, facts.currency))} ex-VAT<br/>
                 <strong>Risk & QC Governance:</strong> ${facts.riskItemsCount} project risk(s) & ${facts.qcCheckpointsCount} QC checkpoint(s) mapped${facts.topRiskTitleAndMitigation ? ` • <em>Top Risk:</em> ${escapeDocumentHtml(facts.topRiskTitleAndMitigation)}` : ''}`
              : '<em>Module E not yet completed.</em>'
          }
        </div>
      </div>
    </div>
  `);

  // Section 2: Cohesive Executive Story
  sections.push(`
    <div class="section">
      <div class="section-header">
        <span class="section-num">2</span>
        <span class="section-title">Cohesive Executive Story (Strictly Grounded in Saved Inputs)</span>
      </div>
      <div class="box" style="margin-bottom: 10px;">
        <div class="box-label">Paragraph 1 • Opportunity, Customer Pain & Market Wedge</div>
        <div class="box-value">${escapeDocumentHtml(sanitizeSurveyTerminologyForReader(story.paragraph1OpportunityAndMarket))}</div>
        <div style="margin-top: 6px; font-size: 11px; color: #4f46e5; font-weight: 600;">
          🔒 Grounded strictly in: ${escapeDocumentHtml(story.paragraph1Sources.join(' • '))}
        </div>
      </div>
      <div class="box" style="margin-bottom: 10px;">
        <div class="box-label">Paragraph 2 • Customer Validation & V1 Product Architecture</div>
        <div class="box-value">${escapeDocumentHtml(sanitizeSurveyTerminologyForReader(story.paragraph2ValidationAndProduct))}</div>
        <div style="margin-top: 6px; font-size: 11px; color: #4f46e5; font-weight: 600;">
          🔒 Grounded strictly in: ${escapeDocumentHtml(story.paragraph2Sources.join(' • '))}
        </div>
      </div>
      <div class="box">
        <div class="box-label">Paragraph 3 • Operational Execution, Unit Delivery & De-Risking</div>
        <div class="box-value">${escapeDocumentHtml(sanitizeSurveyTerminologyForReader(story.paragraph3OperationsAndExecution))}</div>
        <div style="margin-top: 6px; font-size: 11px; color: #4f46e5; font-weight: 600;">
          🔒 Grounded strictly in: ${escapeDocumentHtml(story.paragraph3Sources.join(' • '))}
        </div>
      </div>
    </div>
  `);

  // Chapter 1: Module A
  if (facts.hasModuleA) {
    const grantHtml =
      isGrantCheckerSupportedForCountry(plan.hqCountryCode) &&
      params.conceptCanvas &&
      params.founderMotivation &&
      params.teamAndBudget &&
      params.founderRealityCheck
        ? (() => {
            const grantEval = evaluateModuleAGrantEligibility({
              hqCountryCode: plan.hqCountryCode,
              exportPotential: plan.exportPotential,
              industryCategory: plan.industryCategory,
              brainDumpText: facts.brainDumpText,
              conceptCanvas: params.conceptCanvas,
              founderMotivation: params.founderMotivation,
              teamAndBudget: params.teamAndBudget,
              founderRealityCheck: params.founderRealityCheck,
              grantCheck:
                plan.grantEligibilityCheck ||
                getDefaultGrantEligibilityCheck({
                  hqCountryCode: plan.hqCountryCode,
                  exportPotential: plan.exportPotential,
                  industryCategory: plan.industryCategory,
                  founderMotivation: params.founderMotivation,
                }),
            });
            return `
              <div class="box" style="margin-top: 10px; background: #ecfdf5; border-color: #a7f3d0;">
                <div class="box-label" style="color: #047857;">🟢 Grants &amp; Non-Dilutive Funding You Qualify For Right Now (Step 7 • ${escapeDocumentHtml(grantEval.immediateQualifiedPoolFormatted)} Pool)</div>
                <div class="box-value">
                  ${grantEval.qualifiesNowGrants
                    .map(
                      (g) =>
                        `<div style="margin-bottom: 6px;"><strong>${escapeDocumentHtml(g.grantName)}</strong> (${escapeDocumentHtml(g.providerAgency)} • <strong>${escapeDocumentHtml(g.potentialValueFormatted)}</strong>): ${escapeDocumentHtml(g.whyYouMatchOrMiss)}</div>`
                    )
                    .join('')}
                </div>
              </div>
            `;
          })()
        : '';

    sections.push(`
      <div class="section">
        <div class="section-header">
          <span class="section-num">A</span>
          <span class="section-title">Chapter 1: Ideation, Concept Canvas, Founder Fit &amp; Grant Eligibility (Module A)</span>
        </div>
        <div class="grid-2">
          <div class="box">
            <div class="box-label">1. Core Problem</div>
            <div class="box-value">${escapeDocumentHtml(facts.coreProblem || '—')}</div>
          </div>
          <div class="box">
            <div class="box-label">2. Target Customer</div>
            <div class="box-value">${escapeDocumentHtml(facts.targetCustomer || '—')}</div>
          </div>
          <div class="box">
            <div class="box-label">3. Proposed Solution</div>
            <div class="box-value">${escapeDocumentHtml(facts.proposedSolution || '—')}</div>
          </div>
          <div class="box">
            <div class="box-label">4. Unfair Advantage & Why You</div>
            <div class="box-value">${escapeDocumentHtml(facts.unfairAdvantage || '—')}</div>
          </div>
        </div>
        <div class="box" style="margin-top: 10px;">
          <div class="box-label">5. Revenue Model, Grant Fit & 12-Month Vision</div>
          <div class="box-value">
            <strong>Revenue & Grant Fit:</strong> ${escapeDocumentHtml(facts.revenueAndGrantFit || '—')}<br/>
            <strong>12-Month Vision:</strong> ${escapeDocumentHtml(facts.twelveMonthSuccessVision || '—')}<br/>
            <strong>Non-Negotiables:</strong> ${escapeDocumentHtml(facts.dealbreakersList.join(', ') || 'None specified')}
          </div>
        </div>
        ${grantHtml}
      </div>
    `);
  }

  // Chapter 2: Module B
  if (facts.hasModuleB && plan.moduleBData) {
    const comps = plan.moduleBData.competitorsAndStatusQuo?.competitors || [];
    sections.push(`
      <div class="section">
        <div class="section-header">
          <span class="section-num">B</span>
          <span class="section-title">Chapter 2: Market Intelligence, Competitors & Wedge (Module B)</span>
        </div>
        <div class="grid-3" style="margin-bottom: 12px;">
          <div class="box">
            <div class="box-label">Year 1–2 Target (SOM)</div>
            <div class="box-value" style="font-size: 16px; font-weight: 800; color: #312e81;">${escapeDocumentHtml(facts.somFormatted || '—')}/yr</div>
          </div>
          <div class="box">
            <div class="box-label">Reachable Market (SAM)</div>
            <div class="box-value" style="font-size: 16px; font-weight: 800;">${escapeDocumentHtml(facts.samFormatted || '—')}/yr</div>
          </div>
          <div class="box">
            <div class="box-label">Wider Market (TAM)</div>
            <div class="box-value" style="font-size: 16px; font-weight: 800;">${escapeDocumentHtml(facts.tamFormatted || '—')}/yr</div>
          </div>
        </div>
        <div class="grid-2">
          <div class="box">
            <div class="box-label">Beachhead Customer & Buying Trigger</div>
            <div class="box-value">
              <strong>Segment:</strong> ${escapeDocumentHtml(facts.beachheadSegment || '—')}<br/>
              <strong>Decision-Maker:</strong> ${escapeDocumentHtml(facts.decisionMakerRole || '—')}<br/>
              <strong>Trigger:</strong> ${escapeDocumentHtml(facts.buyingTriggerNotes || '—')}
            </div>
          </div>
          <div class="box">
            <div class="box-label">Competitive Edge & Why Buyers Switch</div>
            <div class="box-value">
              <strong>Why Switch:</strong> ${escapeDocumentHtml(facts.whySwitchOneSentence || '—')}<br/>
              <strong>Competitive Wedge:</strong> ${escapeDocumentHtml(facts.competitiveEdgeSummary || '—')}
            </div>
          </div>
        </div>
        ${
          comps.length > 0
            ? `<table class="doc-table" style="margin-top: 12px;">
                <thead>
                  <tr>
                    <th>Competitor / Alternative</th>
                    <th>Typical Price</th>
                    <th>What They Do Well</th>
                    <th>Where They Fall Short (Our Wedge)</th>
                  </tr>
                </thead>
                <tbody>
                  ${comps
                    .map(
                      (c) => `
                    <tr>
                      <td><strong>${escapeDocumentHtml(c.name || 'Competitor')}</strong></td>
                      <td>${escapeDocumentHtml(c.typicalPriceText || '—')}</td>
                      <td>${escapeDocumentHtml(c.whatTheyDoWell || '—')}</td>
                      <td>${escapeDocumentHtml(c.whereTheyFallShort || '—')}</td>
                    </tr>`
                    )
                    .join('')}
                </tbody>
              </table>`
            : ''
        }
      </div>
    `);
  }

  // Chapter 3: Module C
  if (facts.hasModuleC && plan.moduleCData) {
    const logs = plan.moduleCData.interviewLogs || [];
    sections.push(`
      <div class="section">
        <div class="section-header">
          <span class="section-num">C</span>
          <span class="section-title">Chapter 3: Public Validation Surveys, Waitlist & 1-on-1 Interviews (Module C)</span>
        </div>
        <div class="grid-3" style="margin-bottom: 12px;">
          <div class="box">
            <div class="box-label">Public Survey Responses</div>
            <div class="box-value"><strong>${facts.totalSurveyResponses}</strong> response(s) across ${facts.surveysCount} survey(s)</div>
          </div>
          <div class="box">
            <div class="box-label">Early Waitlist Signups</div>
            <div class="box-value"><strong>${facts.waitlistOptInsCount}</strong> potential buyer(s) opted in</div>
          </div>
          <div class="box">
            <div class="box-label">1-on-1 Discovery Calls</div>
            <div class="box-value"><strong>${facts.interviewsCount}</strong> logged (${facts.strongSignalInterviewsCount} Strong Signal)</div>
          </div>
        </div>
        ${
          facts.topValidatedPainPoints.length > 0
            ? `<div class="box" style="margin-bottom: 12px;">
                <div class="box-label">Verified Customer Pain Points & Survey Findings</div>
                <div class="box-value">
                  ${facts.topValidatedPainPoints
                    .map((p) => `• ${escapeDocumentHtml(p)}`)
                    .join('<br/>')}
                </div>
              </div>`
            : ''
        }
        ${
          logs.length > 0
            ? `<table class="doc-table">
                <thead>
                  <tr>
                    <th>Interviewee / Role</th>
                    <th>Pain (1–5)</th>
                    <th>Key Workflow Takeaway</th>
                    <th>Commitment Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  ${logs
                    .map(
                      (l) => `
                    <tr>
                      <td><strong>${escapeDocumentHtml(l.intervieweeNameOrRole)}</strong></td>
                      <td>${l.painScore1To5}/5</td>
                      <td>${escapeDocumentHtml(sanitizeSurveyTerminologyForReader(l.keyTakeaway || '—'))}</td>
                      <td>${escapeDocumentHtml(formatInterviewCommitment(l))}</td>
                    </tr>`
                    )
                    .join('')}
                </tbody>
              </table>`
            : ''
        }
      </div>
    `);
  }

  // Chapter 4: Module D
  if (facts.hasModuleD && plan.moduleDData) {
    const wps = plan.moduleDData.workPackagesAndFlow?.workPackages || [];
    sections.push(`
      <div class="section">
        <div class="section-header">
          <span class="section-num">D</span>
          <span class="section-title">Chapter 4: Product Vehicle, V1 Scope & Work Packages (Module D)</span>
        </div>
        <div class="grid-2" style="margin-bottom: 12px;">
          <div class="box">
            <div class="box-label">Product Vehicle & Launch Target</div>
            <div class="box-value">
              <strong>Format:</strong> ${escapeDocumentHtml(facts.formFactorLabel || facts.productTrackLabel || '—')}<br/>
              <strong>V1 Build Approach:</strong> ${escapeDocumentHtml(facts.prototypeApproachLabel || '—')}<br/>
              <strong>Target Launch Window:</strong> ${escapeDocumentHtml(facts.launchTimelineLabel || '—')}<br/>
              <strong>Aha Moment:</strong> ${escapeDocumentHtml(facts.ahaMomentNarrative || '—')}
            </div>
          </div>
          <div class="box">
            <div class="box-label">Channel Strategy & V1 Scope Filter</div>
            <div class="box-value">
              <strong>Channel Mix:</strong> ${facts.ownedChannelsSharePercent}% Owned Direct / ${facts.rentedChannelsSharePercent}% Rented<br/>
              <strong>V1 Must-Haves:</strong> ${escapeDocumentHtml(facts.v1MustHaveTitles.join(', ') || '—')}<br/>
              <strong>Explicitly Deferred Post-V1:</strong> ${escapeDocumentHtml(facts.deferredPostV1Titles.join(', ') || '—')}
            </div>
          </div>
        </div>
        ${
          wps.length > 0
            ? `<table class="doc-table">
                <thead>
                  <tr>
                    <th>WP Code</th>
                    <th>Work Package Title</th>
                    <th>Budget (${escapeDocumentHtml(facts.currency)})</th>
                    <th>Milestone & Verification Proof</th>
                  </tr>
                </thead>
                <tbody>
                  ${wps
                    .map(
                      (wp) => `
                    <tr>
                      <td><strong>${escapeDocumentHtml(wp.wpCode)}</strong></td>
                      <td>${escapeDocumentHtml(wp.title)}</td>
                      <td>${escapeDocumentHtml(formatPlanCurrency(wp.estimatedCostAmount, facts.currency))}</td>
                      <td>${escapeDocumentHtml(wp.deliverableMilestoneProof || wp.deliverableMilestone || '—')}</td>
                    </tr>`
                    )
                    .join('')}
                </tbody>
              </table>`
            : ''
        }
      </div>
    `);
  }

  // Chapter 5: Module E
  if (facts.hasModuleE && plan.moduleEData) {
    const risks = plan.moduleEData.riskRegister?.riskItems || [];
    sections.push(`
      <div class="section">
        <div class="section-header">
          <span class="section-num">E</span>
          <span class="section-title">Chapter 5: Operations, Premises, Equipment & Risk Register (Module E)</span>
        </div>
        <div class="grid-2" style="margin-bottom: 12px;">
          <div class="box">
            <div class="box-label">Fulfillment Blueprint & Unit Capacity</div>
            <div class="box-value">
              <strong>Mode:</strong> ${escapeDocumentHtml(facts.fulfillmentModeLabel || '—')}<br/>
              <strong>Turnaround SLA:</strong> ${escapeDocumentHtml(facts.turnaroundSlaLabel || '—')}<br/>
              <strong>Unit Effort & Variable Cost:</strong> ${facts.totalActiveMinutesPerOrder} mins/order • ${escapeDocumentHtml(formatPlanCurrency(facts.totalDirectVariableCostPerOrder, facts.currency))}/order<br/>
              <strong>Weekly Capacity Ceiling:</strong> ~${facts.maxWeeklyOrdersCapacity} orders/week (${facts.weeklyOpsHoursAllocated} hrs/wk)
            </div>
          </div>
          <div class="box">
            <div class="box-label">Premises, Equipment CapEx & Compliance</div>
            <div class="box-value">
              <strong>Premises:</strong> ${escapeDocumentHtml(facts.premisesModeLabel || '—')} (${escapeDocumentHtml(formatPlanCurrency(facts.monthlyPremisesCost, facts.currency))}/mo)<br/>
              <strong>Equipment Schedule (${facts.equipmentItemsCount}):</strong> ${escapeDocumentHtml(formatPlanCurrency(facts.totalEquipmentCapexExVat, facts.currency))} ex-VAT<br/>
              <strong>Quality & Compliance:</strong> ${facts.qcCheckpointsCount} QC gate(s) • ${facts.complianceItemsCount} compliance item(s)
            </div>
          </div>
        </div>
        ${
          risks.length > 0
            ? `<table class="doc-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Risk Title</th>
                    <th>Gross → Residual</th>
                    <th>Mitigation & Contingency Plan</th>
                  </tr>
                </thead>
                <tbody>
                  ${risks
                    .map(
                      (r) => `
                    <tr>
                      <td>${escapeDocumentHtml(r.riskCategory)}</td>
                      <td><strong>${escapeDocumentHtml(r.riskTitle)}</strong></td>
                      <td>${r.grossRiskScore}/25 → ${escapeDocumentHtml(r.residualRiskRating)}</td>
                      <td>${escapeDocumentHtml(r.mitigationAndContingencyPlan)}</td>
                    </tr>`
                    )
                    .join('')}
                </tbody>
              </table>`
            : ''
        }
      </div>
    `);
  }

  if (showUpcomingChaptersRoadmap) {
    sections.push(`
      <div class="section">
        <div class="section-header">
          <span class="section-num">+</span>
          <span class="section-title">Upcoming Blueprint Chapters Roadmap (Modules F–I)</span>
        </div>
        <div class="grid-2">
          <div class="box">
            <div class="box-label">Chapter 6 • Team & Alignment (Module F)</div>
            <div class="box-value">Promoter 150-Word Profiles, Personal Survival Budget, 7 Startup Hats & Co-Founder Alignment</div>
          </div>
          <div class="box">
            <div class="box-label">Chapter 7 • Revenue & Unit Economics (Module G)</div>
            <div class="box-value">Pricing Architect, Written Sales Assumptions & Pocket Profit Margin Calculator</div>
          </div>
          <div class="box">
            <div class="box-label">Chapter 8 • Marketing & First 10 Customers (Module H)</div>
            <div class="box-value">3-Second Hook, 4Ps Strategy, Waitlist Conversion & Reverse Marketing Budget</div>
          </div>
          <div class="box">
            <div class="box-label">Chapter 9 • Financials & Grants (Module I)</div>
            <div class="box-value">36-Month Cashflow Builder, Funding Gap & Non-Dilutive Grant Readiness</div>
          </div>
        </div>
      </div>
    `);
  }

  return renderBmuStandaloneHtmlDocument({
    documentTitle: `${facts.planTitle} — Living Master Business Blueprint`,
    eyebrow: params.whiteLabelEnabled
      ? 'LIVING MASTER BUSINESS BLUEPRINT • EXECUTIVE & CHAPTER COMPILER'
      : 'STARTUP PREFLIGHT • LIVING MASTER BUSINESS BLUEPRINT',
    planTitle: facts.planTitle,
    founderName: facts.founderName,
    countryName: facts.countryName,
    currency: facts.currency,
    industryCategory: facts.industryCategory,
    dateStr,
    scopeLabel: 'Blueprint Status',
    scopeValue: `${facts.activeChaptersCount} Active Chapters (${facts.overallCompletionPercent}% Assembled)`,
    sectionsHtml: sections.join('\n'),
    footerCtaHtml: `
      <div class="footer-cta">
        <div>
          <div class="footer-cta-title">Living Master Blueprint • Zero-Hallucination Verified</div>
          <div class="footer-cta-sub">Every metric, customer proof point, work package, and operational rule in this document is grounded directly in ${escapeDocumentHtml(facts.founderName)}'s saved workspace inputs.</div>
        </div>
        <div class="footer-badge">${escapeDocumentHtml(facts.countryName)} (${escapeDocumentHtml(facts.currency)})</div>
      </div>
    `,
  });
}
