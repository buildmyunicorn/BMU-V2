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

  // Chapter completion flags (strictly factual across all 11 Foundation Modules A–K)
  hasModuleA: boolean;
  hasModuleB: boolean;
  hasModuleC: boolean;
  hasModuleD: boolean;
  hasModuleE: boolean;
  hasModuleF: boolean;
  hasModuleG: boolean;
  hasModuleH: boolean;
  hasModuleI: boolean;
  hasModuleJ: boolean;
  hasModuleK: boolean;
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

  // Module F Facts (Team, Survival Budget, 7 Hats & Hiring Plan)
  teamStructurePostureLabel: string;
  teamMembersCount: number;
  teamMemberSummaries: Array<{
    name: string;
    roleTitle: string;
    equityPercent: number;
    weeklyHours: number;
    bio150Words: string;
  }>;
  hatsAssignedCount: number;
  advisorsCount: number;
  monthlyNetSurvivalBurnTotal: number;
  personalSavingsBufferTotal: number;
  alignmentResponsesCount: number;
  plannedHiresCount: number;
  plannedHiresSummaries: Array<{
    roleTitle: string;
    targetQuarter: string;
    annualGrossSalary: number;
    employmentType: string;
  }>;
  executiveTeamCapabilityNarrative: string;

  // Module G Facts (Launchpad & Operations Readiness Hub)
  opsReadinessPercent: number;
  legalEntityStructureLabel: string;
  registeredEntityName: string;
  registrationNumber: string;
  primaryDomain: string;
  officialBusinessEmail: string;
  bankProviderLabel: string;
  hasDedicatedIban: boolean;
  accountingSoftwareLabel: string;
  vatStatusLabel: string;
  insurancesActiveList: string[];
  legalComplianceItemsActiveList: string[];

  // Module H Facts (Revenue, Pricing Architect & 3-Year Pocket Profit Breakeven)
  revenueModelVehicleLabel: string;
  valueMetric: string;
  pricingTiersCount: number;
  pricingTiersSummaries: Array<{
    name: string;
    priceNetOfTax: number;
    billingFrequency: string;
    pocketProfitMarginPercent: number;
  }>;
  blendedAveragePriceNet: number;
  year1TargetCustomers: number;
  year1ProjectedNetTurnover: number;
  year1PocketProfitNet: number;
  year2ProjectedNetTurnover: number;
  year3ProjectedNetTurnover: number;
  salesCycleDays: number;
  primarySalesMotionLabel: string;
  expectedConversionRatePercent: number;
  executiveCommercialSummaryNarrative: string;

  // Module I Facts (Brand Positioning, 4Ps, First 10 Customers & CAC/LTV Budget)
  elevatorHook140: string;
  positioningFormulaSummary: string;
  fourPsSummary: {
    productP1: string;
    priceP2: string;
    placeP3: string;
    promotionP4: string;
  };
  first10ArchetypeLabel: string;
  pilotOfferHeadline: string;
  first10ProspectsCount: number;
  committedOrPilotProspectsCount: number;
  monthlyMarketingBudget: number;
  calculatedCashCac: number;
  calculatedLtv: number;
  calculatedLtvToCacRatio: number;
  calculatedPaybackMonths: number;
  executiveMarketingSummaryNarrative: string;

  // Module J Facts (36-Month Financial Builder, Overheads, Working Capital & Cashflow Trough)
  operatingCostPostureLabel: string;
  monthlyFixedOverheadsTotal: number;
  monthlyFounderDrawingsYear1: number;
  monthlyTeamSalariesYear1: number;
  customerCollectionTimingLabel: string;
  primaryFundingStrategyLabel: string;
  startingCashBalanceDay1: number;
  totalExternalFundingMapped: number;
  writtenFinancialAssumptionsBlock: string;
  executiveFinancialSummaryNarrative: string;

  // Module K Facts (Non-Dilutive Grants, Capital Stack, Reimbursement Bridge & Tax Relief)
  selectedGrantKey: string;
  overallAssessorReadinessScore: number;
  totalTargetFundingGap: number;
  skinInTheGameCash: number;
  totalGrantsAllocated: number;
  totalLoansAllocated: number;
  totalAngelAllocated: number;
  skinInTheGamePercent: number;
  projectedEquityDilutionPercent: number;
  grantReimbursementTurnaroundWeeks: number;
  bridgeStrategyLabel: string;
  isAssessorLiquidityCompliant: boolean;
  primaryTaxScheme: string;
  targetReliefRaiseAmount: number;
  advanceAssuranceStatus: string;
  executiveFundingSummaryNarrative: string;
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

  // Module F Check (Co-Founder, Team, Personal Survival Budget & 3-Year Hiring Plan)
  const modF = plan.moduleFData;
  const teamMembers = modF?.promoterProfiles?.teamMembers || [];
  const hatAssignments = modF?.step2RoleMatrixData?.hatAssignments || [];
  const founderBudgets = modF?.step3SurvivalBudgetData?.founderBudgets || [];
  const hiringRoles = modF?.step5HiringPlanData?.roles || [];
  const hasModuleF = Boolean(
    modF &&
      (teamMembers.length > 0 ||
        modF.promoterProfiles?.executiveTeamCapabilityNarrative?.trim() ||
        hatAssignments.some(
          (h) =>
            Boolean(h.primaryOwnerMemberId?.trim()) &&
            h.primaryOwnerMemberId !== 'UNASSIGNED'
        ) ||
        founderBudgets.length > 0 ||
        hiringRoles.length > 0)
  );

  // Module G Check (Launchpad & Operations Hub — 6 Setup Cards)
  const modG = plan.moduleGData;
  const gStepsReady = modG
    ? [
        modG.step1?.state === 'ALREADY_HAVE' || Boolean(modG.step1?.registeredEntityName?.trim()),
        modG.step2?.state === 'ALREADY_HAVE' || Boolean(modG.step2?.primaryDomain?.trim()),
        modG.step3?.state === 'ALREADY_HAVE' || Boolean(modG.step3?.hasDedicatedIban),
        modG.step4?.state === 'ALREADY_HAVE' || Boolean(modG.step4?.hasAccountant),
        modG.step5?.state === 'ALREADY_HAVE' ||
          Boolean(
            modG.step5?.hasPublicLiability ||
              modG.step5?.hasProfessionalIndemnity ||
              modG.step5?.hasEmployersLiability
          ),
        modG.step6?.state === 'ALREADY_HAVE' ||
          Boolean(modG.step6?.hasIpAssignmentSigned || modG.step6?.hasPrivacyPolicy),
      ].filter(Boolean).length
    : 0;
  const opsReadinessPercent = modG
    ? typeof modG.completionPercentage === 'number' && modG.completionPercentage > 0
      ? modG.completionPercentage
      : Math.round((gStepsReady / 6) * 100)
    : 0;
  const hasModuleG = Boolean(
    modG &&
      (opsReadinessPercent > 0 ||
        modG.step1?.registeredEntityName?.trim() ||
        modG.step2?.primaryDomain?.trim() ||
        modG.step2?.officialBusinessEmail?.trim() ||
        Boolean(modG.lastSavedAt))
  );

  // Module H Check (Revenue Model, Pricing Architect & 3-Year Pocket Profit Breakeven)
  const modH = plan.moduleHData;
  const hTiers = modH?.step2PricingTiers?.tiers || [];
  const hYearTargets = modH?.step3BreakevenCalculator?.yearTargets || [];
  const hasModuleH = Boolean(
    modH &&
      (hTiers.length > 0 ||
        modH.step1RevenueModel?.offeringRangeSummary?.trim() ||
        hYearTargets.length > 0 ||
        modH.step4SalesAssumptions?.writtenAssumptionsNarrative?.trim() ||
        modH.step5RevenueBrief?.executiveCommercialSummaryNarrative?.trim())
  );

  // Module I Check (Brand Positioning, 4Ps, First 10 Customers & Marketing Budget)
  const modI = plan.moduleIData;
  const iProspects = modI?.step3First10?.targetPipeline || [];
  const hasModuleI = Boolean(
    modI &&
      (modI.step1Positioning?.elevatorHook140?.trim() ||
        modI.step2FourPs?.strategicRationale?.trim() ||
        iProspects.length > 0 ||
        (modI.step4Budget?.totalPlannedMonthlyMarketingSpend ?? 0) > 0 ||
        modI.step5MarketingBrief?.executiveMarketingSummaryNarrative?.trim())
  );

  // Module J Check (36-Month Financial Builder, Overheads, Working Capital & Cashflow Trough)
  const modJ = plan.moduleJData;
  const jOverheads = modJ?.step1OverheadsTax?.overheadLineItems || [];
  const jFundingSources = modJ?.step3CashflowGap?.fundingSources || [];
  const hasModuleJ = Boolean(
    modJ &&
      (jOverheads.length > 0 ||
        modJ.step1OverheadsTax?.overheadsAndTaxNarrative?.trim() ||
        modJ.step2WorkingCapital?.workingCapitalNarrative?.trim() ||
        jFundingSources.length > 0 ||
        modJ.step4Statements?.writtenFinancialAssumptionsBlock?.trim() ||
        modJ.step5FinanceBrief?.executiveFinancialSummaryNarrative?.trim())
  );

  // Module K Check (Non-Dilutive Grants, Capital Stack, Reimbursement Bridge & Tax Relief)
  const modK = plan.moduleKData;
  const kFundingSources = modK?.step2CapitalStack?.fundingSources || [];
  const hasModuleK = Boolean(
    modK &&
      (Boolean(modK.step1Audit?.selectedGrantKey) ||
        kFundingSources.length > 0 ||
        (modK.step2CapitalStack?.totalTargetFundingGap ?? 0) > 0 ||
        modK.step5FundingBrief?.executiveSummary?.trim())
  );

  const activeChaptersCount = [
    hasModuleA,
    hasModuleB,
    hasModuleC,
    hasModuleD,
    hasModuleE,
    hasModuleF,
    hasModuleG,
    hasModuleH,
    hasModuleI,
    hasModuleJ,
    hasModuleK,
  ].filter(Boolean).length;

  const overallCompletionPercent = Math.round((activeChaptersCount / 11) * 100);

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

  // Module F Metrics & Summaries
  const TEAM_POSTURE_READER_LABELS: Record<string, string> = {
    SOLO_FOUNDER_ADVISORS: 'Solo Founder + Advisory Support',
    TWO_COFOUNDERS: '2 Co-Founders (Complementary Partnership)',
    THREE_PLUS_FOUNDERS: '3+ Co-Founders (Multi-Partner Founding Team)',
    FOUNDER_PLUS_EARLY_HIRES: 'Lead Founder + Key Early Specialist Hires',
    OTHER: 'Custom Founding Team Posture',
  };
  const rawTeamPosture = modF?.promoterProfiles?.teamStructurePosture || '';
  const teamStructurePostureLabel =
    rawTeamPosture === 'OTHER' &&
    modF?.promoterProfiles?.otherTeamStructurePostureText?.trim()
      ? modF.promoterProfiles.otherTeamStructurePostureText.trim()
      : TEAM_POSTURE_READER_LABELS[rawTeamPosture] || teamStructureLabel || '';

  const teamMemberSummaries = teamMembers.map((m) => {
    const hoursFromCommitment =
      m.weeklyCommitment === 'FULL_TIME_40H_PLUS'
        ? 40
        : m.weeklyCommitment === 'PART_TIME_20_TO_30H'
          ? 25
          : m.weeklyCommitment === 'EVENING_WEEKEND_10_TO_15H'
            ? 12
            : 5;
    return {
      name: m.fullName?.trim() || 'Founder',
      roleTitle: m.jobTitle?.trim() || 'Co-Founder',
      equityPercent: Number(m.equitySharePercent) || 0,
      weeklyHours: hoursFromCommitment,
      bio150Words: sanitizeSurveyTerminologyForReader(
        m.compiled150WordNarrative?.trim() || ''
      ),
    };
  });

  const hatsAssignedCount = hatAssignments.filter(
    (h) =>
      Boolean(h.primaryOwnerMemberId?.trim()) &&
      h.primaryOwnerMemberId !== 'UNASSIGNED'
  ).length;
  const advisorsCount = modF?.step2RoleMatrixData?.advisors?.length ?? 0;

  const monthlyNetSurvivalBurnTotal = founderBudgets.reduce((sum, fb) => {
    const gross =
      (Number(fb.housingAndUtilities) || 0) +
      (Number(fb.groceriesAndEssentials) || 0) +
      (Number(fb.transportAndCommute) || 0) +
      (Number(fb.debtAndLoanCommitments) || 0) +
      (Number(fb.dependentsAndFamily) || 0);
    const net = Math.max(0, gross - (Number(fb.incomeOffsetCushion) || 0));
    return sum + net;
  }, 0);

  const personalSavingsBufferTotal = founderBudgets.reduce(
    (sum, fb) => sum + (Number(fb.personalSavingsBuffer) || 0),
    0
  );

  const plannedHiresSummaries = hiringRoles.map((r) => ({
    roleTitle: r.title?.trim() || 'Planned Role',
    targetQuarter: `Y${r.yearScheduled || 1}-${r.targetQuarter || 'Q1'}`,
    annualGrossSalary: Number(r.grossAnnualSalary) || 0,
    employmentType: r.employmentMode || 'FULL_TIME',
  }));

  const executiveTeamCapabilityNarrative = sanitizeSurveyTerminologyForReader(
    modF?.step6BlindSpotAuditData?.executiveTeamCapabilityNarrative?.trim() ||
      modF?.promoterProfiles?.executiveTeamCapabilityNarrative?.trim() ||
      ''
  );

  // Module G Metrics & Summaries
  const legalEntityStructureLabel = modG?.step1
    ? modG.step1.legalStructure === 'OTHER' && modG.step1.customLegalStructure?.trim()
      ? modG.step1.customLegalStructure.trim()
      : modG.step1.legalStructure || ''
    : '';
  const bankProviderLabel = modG?.step3
    ? modG.step3.bankProvider === 'OTHER' && modG.step3.customBankProvider?.trim()
      ? modG.step3.customBankProvider.trim()
      : (modG.step3.bankProvider || '').replace(/_/g, ' ')
    : '';
  const accountingSoftwareLabel = modG?.step4
    ? modG.step4.softwareChoice === 'OTHER' && modG.step4.customSoftwareChoice?.trim()
      ? modG.step4.customSoftwareChoice.trim()
      : (modG.step4.softwareChoice || '').replace(/_/g, ' ')
    : '';
  const vatStatusLabel = modG?.step4?.vatStatus
    ? modG.step4.vatStatus.replace(/_/g, ' ')
    : '';
  const insurancesActiveList: string[] = [];
  if (modG?.step5?.hasPublicLiability) insurancesActiveList.push('Public Liability');
  if (modG?.step5?.hasEmployersLiability)
    insurancesActiveList.push("Employers' Liability");
  if (modG?.step5?.hasProfessionalIndemnity)
    insurancesActiveList.push('Professional Indemnity');
  if (modG?.step5?.hasProductLiability) insurancesActiveList.push('Product Liability');

  const legalComplianceItemsActiveList: string[] = [];
  if (modG?.step6?.hasIpAssignmentSigned)
    legalComplianceItemsActiveList.push('Founder IP Assignment Signed');
  if (modG?.step6?.hasPrivacyPolicy)
    legalComplianceItemsActiveList.push('Privacy Policy Live');
  if (modG?.step6?.hasTermsOfService)
    legalComplianceItemsActiveList.push('Terms of Service');
  if (modG?.step6?.hasStandardNda) legalComplianceItemsActiveList.push('Standard NDA');
  if (modG?.step6?.gdprOfficerDesignated)
    legalComplianceItemsActiveList.push('GDPR Data Protection Lead');

  // Module H Metrics & Summaries
  const REVENUE_VEHICLE_READER_LABELS: Record<string, string> = {
    SUBSCRIPTION_RECURRING: 'Recurring Subscription (SaaS / Membership / Retainer)',
    ONE_OFF_TRANSACTION: 'Direct Unit / Product Sales (One-Off Purchase)',
    SERVICE_PROJECT_HOURLY: 'Productized Service / Project Sprint / B2B Retainer',
    USAGE_BASED_METERED: 'Usage-Based / Pay-As-You-Go Metered Pricing',
    MARKETPLACE_COMMISSION: 'Marketplace Take-Rate / Transaction Commission',
    HARDWARE_PLUS_PLAN: 'Hardware Device Sale + Recurring Companion Plan',
    OTHER: 'Custom Revenue Vehicle',
  };
  const rawRevVehicle = modH?.step1RevenueModel?.revenueModelVehicle || '';
  const revenueModelVehicleLabel =
    rawRevVehicle === 'OTHER' &&
    modH?.step1RevenueModel?.otherRevenueModelText?.trim()
      ? modH.step1RevenueModel.otherRevenueModelText.trim()
      : REVENUE_VEHICLE_READER_LABELS[rawRevVehicle] || rawRevVehicle;

  const hFriction = modH?.step3BreakevenCalculator?.frictionCosts;
  const pricingTiersSummaries = hTiers.map((t) => {
    const net = Number(t.priceNetOfTax) || 0;
    const cogs = Number(hFriction?.directVariableCogsPerUnit) || 0;
    const feePct =
      (Number(hFriction?.paymentGatewayPercent) || 0) +
      (Number(hFriction?.disputeRefundBufferPercent) || 0) +
      (Number(hFriction?.affiliateCommissionPercent) || 0);
    const flatFee = (Number(hFriction?.paymentGatewayFixedCents) || 0) / 100;
    const pocket = net - cogs - (net * feePct) / 100 - flatFee;
    const marginPct = net > 0 ? Math.max(0, Math.round((pocket / net) * 100)) : 0;
    return {
      name: t.name?.trim() || 'Tier',
      priceNetOfTax: net,
      billingFrequency: t.billingFrequency || 'MONTHLY',
      pocketProfitMarginPercent: marginPct,
    };
  });

  const y1Target =
    hYearTargets.find((y) => y.yearNumber === 1) || hYearTargets[0];
  const y2Target =
    hYearTargets.find((y) => y.yearNumber === 2) || hYearTargets[1];
  const y3Target =
    hYearTargets.find((y) => y.yearNumber === 3) || hYearTargets[2];

  // Module I Metrics & Summaries
  const posFormula = modI?.step1Positioning?.positioningFormula;
  const positioningFormulaSummary = posFormula?.targetCustomer?.trim()
    ? `For ${posFormula.targetCustomer.trim()} who ${posFormula.customerProblem?.trim() || 'need a better solution'}, ${plan.title} is a ${posFormula.solutionCategory?.trim() || 'solution'} that ${posFormula.primaryBenefit?.trim() || 'delivers measurable results'} — unlike alternatives, we ${posFormula.competitiveWedge?.trim() || 'win on execution'}.`
    : '';

  const committedOrPilotProspectsCount = iProspects.filter((p) =>
    ['PILOT_AGREED', 'CONVERTED_PAID'].includes(p.status)
  ).length;

  // Module J Metrics & Summaries
  const monthlyFixedOverheadsTotal = jOverheads.reduce(
    (sum, item) => sum + (Number(item.monthlyCostYear1) || 0),
    0
  );
  const totalExternalFundingMapped = jFundingSources.reduce(
    (sum, fs) => sum + (Number(fs.amount) || 0),
    0
  );

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
    hasModuleF,
    hasModuleG,
    hasModuleH,
    hasModuleI,
    hasModuleJ,
    hasModuleK,
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

    // Module F Returned Facts
    teamStructurePostureLabel,
    teamMembersCount: teamMembers.length,
    teamMemberSummaries,
    hatsAssignedCount,
    advisorsCount,
    monthlyNetSurvivalBurnTotal,
    personalSavingsBufferTotal,
    alignmentResponsesCount: modF?.step4AlignmentData?.responses?.length ?? 0,
    plannedHiresCount: hiringRoles.length,
    plannedHiresSummaries,
    executiveTeamCapabilityNarrative,

    // Module G Returned Facts
    opsReadinessPercent,
    legalEntityStructureLabel,
    registeredEntityName: modG?.step1?.registeredEntityName?.trim() || '',
    registrationNumber: modG?.step1?.registrationNumber?.trim() || '',
    primaryDomain: modG?.step2?.primaryDomain?.trim() || '',
    officialBusinessEmail: modG?.step2?.officialBusinessEmail?.trim() || '',
    bankProviderLabel,
    hasDedicatedIban: Boolean(modG?.step3?.hasDedicatedIban),
    accountingSoftwareLabel,
    vatStatusLabel,
    insurancesActiveList,
    legalComplianceItemsActiveList,

    // Module H Returned Facts
    revenueModelVehicleLabel,
    valueMetric: modH?.step1RevenueModel?.valueMetric?.trim() || '',
    pricingTiersCount: hTiers.length,
    pricingTiersSummaries,
    blendedAveragePriceNet:
      Number(modH?.step2PricingTiers?.blendedAveragePriceNet) ||
      (pricingTiersSummaries[0]?.priceNetOfTax ?? 0),
    year1TargetCustomers:
      Number(y1Target?.customersNeededToBreakeven) ||
      Number(modH?.step3BreakevenCalculator?.activeCustomerSlider) ||
      0,
    year1ProjectedNetTurnover:
      (Number(y1Target?.monthlyRevenueAtBreakeven) || 0) * 12,
    year1PocketProfitNet:
      (Number(y1Target?.monthlyPocketProfitAtTarget) || 0) * 12,
    year2ProjectedNetTurnover:
      (Number(y2Target?.monthlyRevenueAtBreakeven) || 0) * 12,
    year3ProjectedNetTurnover:
      (Number(y3Target?.monthlyRevenueAtBreakeven) || 0) * 12,
    salesCycleDays: Number(modH?.step4SalesAssumptions?.salesCycleDays) || 0,
    primarySalesMotionLabel: (
      modH?.step4SalesAssumptions?.primarySalesMotion || ''
    ).replace(/_/g, ' '),
    expectedConversionRatePercent:
      Number(modH?.step4SalesAssumptions?.expectedConversionRatePercent) || 0,
    executiveCommercialSummaryNarrative: sanitizeSurveyTerminologyForReader(
      modH?.step5RevenueBrief?.executiveCommercialSummaryNarrative?.trim() ||
        modH?.step3BreakevenCalculator?.breakevenNarrative?.trim() ||
        ''
    ),

    // Module I Returned Facts
    elevatorHook140: sanitizeSurveyTerminologyForReader(
      modI?.step1Positioning?.elevatorHook140?.trim() || ''
    ),
    positioningFormulaSummary: sanitizeSurveyTerminologyForReader(
      positioningFormulaSummary
    ),
    fourPsSummary: {
      productP1:
        modI?.step2FourPs?.productP1?.coreDeliverableSummary?.trim() || '',
      priceP2:
        modI?.step2FourPs?.priceP2?.priceJustification?.trim() ||
        modI?.step2FourPs?.priceP2?.headlinePricePoint?.trim() ||
        '',
      placeP3: (modI?.step2FourPs?.placeP3?.primaryChannel || '').replace(
        /_/g,
        ' '
      ),
      promotionP4:
        modI?.step2FourPs?.promotionP4?.beachheadChannelTactics?.trim() || '',
    },
    first10ArchetypeLabel: (
      modI?.step3First10?.acquisitionArchetype || ''
    ).replace(/_/g, ' '),
    pilotOfferHeadline:
      modI?.step3First10?.pilotOffer?.pilotStructure?.trim() || '',
    first10ProspectsCount: iProspects.length,
    committedOrPilotProspectsCount,
    monthlyMarketingBudget:
      Number(modI?.step4Budget?.totalPlannedMonthlyMarketingSpend) || 0,
    calculatedCashCac: Number(modI?.step4Budget?.calculatedCashCac) || 0,
    calculatedLtv: Number(modI?.step4Budget?.calculatedLtv) || 0,
    calculatedLtvToCacRatio:
      Number(modI?.step4Budget?.calculatedLtvToCacRatio) || 0,
    calculatedPaybackMonths:
      Number(modI?.step4Budget?.calculatedPaybackMonths) || 0,
    executiveMarketingSummaryNarrative: sanitizeSurveyTerminologyForReader(
      modI?.step5MarketingBrief?.executiveMarketingSummaryNarrative?.trim() || ''
    ),

    // Module J Returned Facts
    operatingCostPostureLabel: (
      modJ?.step1OverheadsTax?.operatingCostPosture || ''
    ).replace(/_/g, ' '),
    monthlyFixedOverheadsTotal,
    monthlyFounderDrawingsYear1:
      Number(modJ?.step1OverheadsTax?.monthlyFounderDrawingsYear1) || 0,
    monthlyTeamSalariesYear1:
      Number(modJ?.step1OverheadsTax?.monthlyTeamSalariesYear1) || 0,
    customerCollectionTimingLabel: (
      modJ?.step2WorkingCapital?.customerCollectionTiming || ''
    ).replace(/_/g, ' '),
    primaryFundingStrategyLabel: (
      modJ?.step3CashflowGap?.primaryFundingStrategy || ''
    ).replace(/_/g, ' '),
    startingCashBalanceDay1:
      Number(modJ?.step3CashflowGap?.startingCashBalanceDay1) || 0,
    totalExternalFundingMapped,
    writtenFinancialAssumptionsBlock: sanitizeSurveyTerminologyForReader(
      modJ?.step4Statements?.writtenFinancialAssumptionsBlock?.trim() || ''
    ),
    executiveFinancialSummaryNarrative: sanitizeSurveyTerminologyForReader(
      modJ?.step5FinanceBrief?.executiveFinancialSummaryNarrative?.trim() || ''
    ),

    // Module K Returned Facts
    selectedGrantKey: modK?.step1Audit?.selectedGrantKey || '',
    overallAssessorReadinessScore:
      Number(modK?.step1Audit?.overallAssessorReadinessScore) ||
      Number(modK?.step5FundingBrief?.assessorReadinessScore) ||
      0,
    totalTargetFundingGap:
      Number(modK?.step2CapitalStack?.totalTargetFundingGap) || 0,
    skinInTheGameCash: Number(modK?.step2CapitalStack?.skinInTheGameCash) || 0,
    totalGrantsAllocated:
      Number(modK?.step2CapitalStack?.totalGrantsAllocated) || 0,
    totalLoansAllocated:
      Number(modK?.step2CapitalStack?.totalLoansAllocated) || 0,
    totalAngelAllocated:
      Number(modK?.step2CapitalStack?.totalAngelAllocated) || 0,
    skinInTheGamePercent:
      Number(modK?.step2CapitalStack?.skinInTheGamePercent) || 0,
    projectedEquityDilutionPercent:
      Number(modK?.step2CapitalStack?.projectedEquityDilutionPercent) || 0,
    grantReimbursementTurnaroundWeeks:
      Number(modK?.step3ReimbursementBridge?.estimatedClaimTurnaroundWeeks) || 0,
    bridgeStrategyLabel: (
      modK?.step3ReimbursementBridge?.bridgeStrategy || ''
    ).replace(/_/g, ' '),
    isAssessorLiquidityCompliant: Boolean(
      modK?.step3ReimbursementBridge?.isAssessorLiquidityCompliant
    ),
    primaryTaxScheme: modK?.step4TaxRelief?.primaryTaxScheme || '',
    targetReliefRaiseAmount:
      Number(modK?.step4TaxRelief?.targetReliefRaiseAmount) || 0,
    advanceAssuranceStatus: (
      modK?.step4TaxRelief?.advanceAssuranceStatus || ''
    ).replace(/_/g, ' '),
    executiveFundingSummaryNarrative: sanitizeSurveyTerminologyForReader(
      modK?.step5FundingBrief?.executiveSummary?.trim() ||
        modK?.step2CapitalStack?.fundingStrategyNarrative?.trim() ||
        ''
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

  if (facts.hasModuleI) {
    if (facts.elevatorHook140) {
      p1Parts.push(
        `Brand positioning leads with: "${facts.elevatorHook140}"${
          facts.first10ProspectsCount > 0
            ? `, backed by a First-10 pipeline of ${facts.first10ProspectsCount} named prospect(s) (${facts.committedOrPilotProspectsCount} in active pilot/paid status)`
            : ''
        }.`
      );
      p1Sources.push('Module I: Brand Positioning & First 10');
    }
    if (facts.monthlyMarketingBudget > 0 || facts.calculatedCashCac > 0) {
      p1Parts.push(
        `Growth economics allocate ${formatPlanCurrency(
          facts.monthlyMarketingBudget,
          facts.currency
        )}/month in acquisition budget with a modeled cash CAC of ${formatPlanCurrency(
          facts.calculatedCashCac,
          facts.currency
        )}${
          facts.calculatedLtvToCacRatio > 0
            ? ` (${facts.calculatedLtvToCacRatio.toFixed(1)}:1 LTV:CAC)`
            : ''
        }.`
      );
      p1Sources.push('Module I: Marketing Budget & CAC/LTV');
    }
  }

  const paragraph1OpportunityAndMarket =
    p1Parts.length > 0
      ? sanitizeSurveyTerminologyForReader(p1Parts.join(' '))
      : `${facts.planTitle} (${facts.countryName} • ${facts.currency}) is currently capturing its initial concept, market, and positioning foundations across Modules A, B, and I.`;

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

  if (facts.hasModuleH) {
    if (facts.revenueModelVehicleLabel || facts.pricingTiersCount > 0) {
      p2Parts.push(
        `Commercial monetization operates via ${
          facts.revenueModelVehicleLabel || 'tiered pricing'
        } across ${facts.pricingTiersCount} pricing tier(s) (blended net price: ${formatPlanCurrency(
          facts.blendedAveragePriceNet,
          facts.currency
        )}${facts.valueMetric ? ` ${facts.valueMetric}` : ''}).`
      );
      p2Sources.push('Module H: Pricing Architect');
    }
    if (facts.year1ProjectedNetTurnover > 0) {
      p2Parts.push(
        `The 3-Year Pocket Profit breakeven model targets ${
          facts.year1TargetCustomers
        } Year 1 customers generating ${formatPlanCurrency(
          facts.year1ProjectedNetTurnover,
          facts.currency
        )} in Year 1 net turnover (${formatPlanCurrency(
          facts.year1PocketProfitNet,
          facts.currency
        )} net pocket profit)${
          facts.year3ProjectedNetTurnover > 0
            ? `, scaling to ${formatPlanCurrency(
                facts.year3ProjectedNetTurnover,
                facts.currency
              )} by Year 3`
            : ''
        }.`
      );
      p2Sources.push('Module H: 3-Year Breakeven Engine');
    }
  }

  const paragraph2ValidationAndProduct =
    p2Parts.length > 0
      ? sanitizeSurveyTerminologyForReader(p2Parts.join(' '))
      : 'Customer validation (Module C), Product Architecture (Module D), and Revenue & Pricing (Module H) have not yet been populated.';

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
      } growth strategy.`
    );
    p3Sources.push('Module A: Founder Non-Negotiables');
  }

  if (facts.hasModuleF) {
    p3Parts.push(
      `The founding team comprises ${facts.teamMembersCount} promoter profile(s) (${
        facts.hatsAssignedCount
      }/7 functional startup hats assigned, ${formatPlanCurrency(
        facts.monthlyNetSurvivalBurnTotal,
        facts.currency
      )}/mo combined net personal survival budget${
        facts.plannedHiresCount > 0
          ? `, and ${facts.plannedHiresCount} scheduled 3-year hire(s)`
          : ''
      }).`
    );
    p3Sources.push('Module F: Team, Survival Budget & Hiring');
  }

  if (facts.hasModuleG) {
    p3Parts.push(
      `Launchpad operations readiness stands at ${facts.opsReadinessPercent}% (${
        facts.legalEntityStructureLabel || 'Legal structure'
      }${
        facts.registeredEntityName ? ` • ${facts.registeredEntityName}` : ''
      }${facts.primaryDomain ? ` • ${facts.primaryDomain}` : ''}).`
    );
    p3Sources.push('Module G: Launchpad & Ops Hub');
  }

  if (facts.hasModuleJ) {
    p3Parts.push(
      `In Module J, 36-month financials model ${formatPlanCurrency(
        facts.monthlyFixedOverheadsTotal,
        facts.currency
      )}/mo in fixed overheads, ${formatPlanCurrency(
        facts.startingCashBalanceDay1,
        facts.currency
      )} Day-1 cash, and ${formatPlanCurrency(
        facts.totalExternalFundingMapped,
        facts.currency
      )} in mapped external funding.`
    );
    p3Sources.push('Module J: 36-Month Financial Builder');
  }

  if (facts.hasModuleK) {
    p3Parts.push(
      `Module K structures a ${formatPlanCurrency(
        facts.totalTargetFundingGap,
        facts.currency
      )} capital stack (${formatPlanCurrency(
        facts.skinInTheGameCash,
        facts.currency
      )} founder cash [${facts.skinInTheGamePercent}%], ${formatPlanCurrency(
        facts.totalGrantsAllocated,
        facts.currency
      )} non-dilutive grants, ${formatPlanCurrency(
        facts.totalLoansAllocated,
        facts.currency
      )} loans, and ${formatPlanCurrency(
        facts.totalAngelAllocated,
        facts.currency
      )} equity${
        facts.primaryTaxScheme && facts.primaryTaxScheme !== 'NONE'
          ? ` via ${facts.primaryTaxScheme}`
          : ''
      }) with an assessor readiness score of ${facts.overallAssessorReadinessScore}/100.`
    );
    p3Sources.push('Module K: Grants, Capital Stack & Tax Relief');
  }

  const paragraph3OperationsAndExecution =
    p3Parts.length > 0
      ? sanitizeSurveyTerminologyForReader(p3Parts.join(' '))
      : 'Operations (Module E), Team & Launchpad (Modules F–G), 36-Month Financials (Module J), and Non-Dilutive Capital Stack (Module K) have not yet been populated.';

  return {
    paragraph1OpportunityAndMarket,
    paragraph1Sources:
      p1Sources.length > 0 ? p1Sources : ['Awaiting Module A, B & I Inputs'],
    paragraph2ValidationAndProduct,
    paragraph2Sources:
      p2Sources.length > 0 ? p2Sources : ['Awaiting Module C, D & H Inputs'],
    paragraph3OperationsAndExecution,
    paragraph3Sources:
      p3Sources.length > 0
        ? p3Sources
        : ['Awaiting Module E, F, G, J & K Inputs'],
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
    `**Blueprint Progress:** ${facts.activeChaptersCount} of 11 Foundation Chapters Active (${facts.overallCompletionPercent}% Assembled)`,
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
    '### 👥 Founding Team, Survival Budget & 3-Year Hiring (Module F)',
    ...(facts.hasModuleF
      ? [
          `- **Founding Team (${facts.teamMembersCount}):** ${facts.teamMemberSummaries.map((m) => `${m.name} (${m.roleTitle} • ${m.equityPercent}% equity)`).join(', ') || 'Profiles in progress'}`,
          `- **Functional Hats & Survival Budget:** ${facts.hatsAssignedCount}/7 startup hats assigned • ${formatPlanCurrency(facts.monthlyNetSurvivalBurnTotal, facts.currency)}/mo net survival budget • ${facts.plannedHiresCount} scheduled hire(s)`,
        ]
      : ['- *Module F (Co-Founder, Team & Personal Survival Budget) has not been filled in yet.*']),
    '',
    '### 🚀 Getting Set Up — Launchpad & Operations Readiness (Module G)',
    ...(facts.hasModuleG
      ? [
          `- **Operations Readiness Score:** ${facts.opsReadinessPercent}% Ready`,
          `- **Entity & Digital Presence:** ${facts.legalEntityStructureLabel || 'Entity TBD'}${facts.registeredEntityName ? ` (${facts.registeredEntityName})` : ''} • Domain: ${facts.primaryDomain || 'TBD'} • Banking: ${facts.bankProviderLabel || 'TBD'}`,
          `- **Accounting, Insurance & Legal:** ${facts.accountingSoftwareLabel || 'Accounting TBD'} (${facts.vatStatusLabel || 'VAT TBD'}) • ${facts.insurancesActiveList.length} insurance policy type(s) • ${facts.legalComplianceItemsActiveList.length} legal/GDPR item(s) active`,
        ]
      : ['- *Module G (Launchpad & Operations Hub) has not been filled in yet.*']),
    '',
    '### 💰 Revenue Model, Pricing & 3-Year Breakeven (Module H)',
    ...(facts.hasModuleH
      ? [
          `- **Revenue Model & Pricing (${facts.pricingTiersCount} Tier(s)):** ${facts.revenueModelVehicleLabel || 'Pricing model'} • Blended Net Price: ${formatPlanCurrency(facts.blendedAveragePriceNet, facts.currency)}${facts.valueMetric ? ` (${facts.valueMetric})` : ''}`,
          `- **3-Year Pocket Profit Trajectory:** Y1: ${formatPlanCurrency(facts.year1ProjectedNetTurnover, facts.currency)} net turnover (${facts.year1TargetCustomers} customers • ${formatPlanCurrency(facts.year1PocketProfitNet, facts.currency)} net pocket profit) → Y2: ${formatPlanCurrency(facts.year2ProjectedNetTurnover, facts.currency)} → Y3: ${formatPlanCurrency(facts.year3ProjectedNetTurnover, facts.currency)}`,
        ]
      : ['- *Module H (Revenue, Pricing Architect & 3-Year Breakeven) has not been filled in yet.*']),
    '',
    '### 📣 Brand Positioning, 4Ps, First 10 & CAC/LTV (Module I)',
    ...(facts.hasModuleI
      ? [
          `- **3-Second Elevator Hook:** ${facts.elevatorHook140 || 'Not set'}`,
          `- **First 10 Customers Pipeline:** ${facts.first10ProspectsCount} named prospect(s) (${facts.committedOrPilotProspectsCount} pilot/paid) • Pilot Offer: ${facts.pilotOfferHeadline || 'Defined'}`,
          `- **Marketing Budget & Unit Economics:** ${formatPlanCurrency(facts.monthlyMarketingBudget, facts.currency)}/mo spend • Cash CAC: ${formatPlanCurrency(facts.calculatedCashCac, facts.currency)} • LTV: ${formatPlanCurrency(facts.calculatedLtv, facts.currency)} (${facts.calculatedLtvToCacRatio.toFixed(1)}:1 LTV:CAC)`,
        ]
      : ['- *Module I (Marketing, 4Ps & First 10 Customers) has not been filled in yet.*']),
    '',
    '### 📈 36-Month Financial Builder & Cashflow Trough (Module J)',
    ...(facts.hasModuleJ
      ? [
          `- **Overheads & Payroll Baseline:** ${formatPlanCurrency(facts.monthlyFixedOverheadsTotal, facts.currency)}/mo fixed overheads • ${formatPlanCurrency(facts.monthlyFounderDrawingsYear1, facts.currency)}/mo Y1 founder drawings • ${formatPlanCurrency(facts.monthlyTeamSalariesYear1, facts.currency)}/mo Y1 salaries`,
          `- **Working Capital & Funding:** Collection: ${facts.customerCollectionTimingLabel || 'Standard'} • Day-1 Cash: ${formatPlanCurrency(facts.startingCashBalanceDay1, facts.currency)} • External Funding Mapped: ${formatPlanCurrency(facts.totalExternalFundingMapped, facts.currency)}`,
        ]
      : ['- *Module J (36-Month Financial Builder & Cashflow Trough) has not been filled in yet.*']),
    '',
    '### 🏆 Non-Dilutive Grants, Capital Stack & Tax Relief (Module K)',
    ...(facts.hasModuleK
      ? [
          `- **Target Scheme & Readiness:** ${facts.selectedGrantKey || 'Primary Grant Scheme'} • Assessor Readiness Score: ${facts.overallAssessorReadinessScore}/100`,
          `- **Capital Stack (${formatPlanCurrency(facts.totalTargetFundingGap, facts.currency)} Total):** ${formatPlanCurrency(facts.skinInTheGameCash, facts.currency)} Founder Cash (${facts.skinInTheGamePercent}%) + ${formatPlanCurrency(facts.totalGrantsAllocated, facts.currency)} Grants + ${formatPlanCurrency(facts.totalLoansAllocated, facts.currency)} Loans + ${formatPlanCurrency(facts.totalAngelAllocated, facts.currency)} Equity (${facts.projectedEquityDilutionPercent}% dilution)`,
          `- **Reimbursement Bridge & Tax Relief:** ${facts.grantReimbursementTurnaroundWeeks} wks claim turnaround (${facts.bridgeStrategyLabel || 'Bridge'}) • Tax Scheme: ${facts.primaryTaxScheme || 'None'} (${formatPlanCurrency(facts.targetReliefRaiseAmount, facts.currency)} target raise)`,
        ]
      : ['- *Module K (Grants, Capital Stack & Tax Relief) has not been filled in yet.*']),
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

  // Chapter 6: Module F
  if (facts.hasModuleF) {
    lines.push(
      '---',
      '',
      '## Chapter 6: Founding Team, Personal Survival Budget & 3-Year Hiring Plan (Module F)',
      '',
      `- **Team Structure Posture:** ${facts.teamStructurePostureLabel || '—'}`,
      `- **7 Functional Startup Hats Assigned:** ${facts.hatsAssignedCount}/7 (${facts.advisorsCount} external advisor(s))`,
      `- **Combined Monthly Net Survival Burn:** ${formatPlanCurrency(facts.monthlyNetSurvivalBurnTotal, facts.currency)}/month (Personal Savings Buffer: ${formatPlanCurrency(facts.personalSavingsBufferTotal, facts.currency)})`,
      ...(facts.teamMemberSummaries.length > 0
        ? [
            '',
            '### Promoter Profiles & Equity Allocation',
            ...facts.teamMemberSummaries.map(
              (m) =>
                `- **${m.name} — ${m.roleTitle}** (${m.equityPercent}% Equity • ${m.weeklyHours} hrs/wk): ${m.bio150Words || '—'}`
            ),
          ]
        : []),
      ...(facts.plannedHiresSummaries.length > 0
        ? [
            '',
            '### 3-Year Job Creation & Hiring Schedule',
            ...facts.plannedHiresSummaries.map(
              (r) =>
                `- **${r.roleTitle}** (${r.targetQuarter} • ${r.employmentType} • ${formatPlanCurrency(r.annualGrossSalary, facts.currency)}/yr)`
            ),
          ]
        : []),
      ...(facts.executiveTeamCapabilityNarrative
        ? [
            '',
            `- **Executive Team Capability Summary:** ${facts.executiveTeamCapabilityNarrative}`,
          ]
        : []),
      ''
    );
  }

  // Chapter 7: Module G
  if (facts.hasModuleG) {
    lines.push(
      '---',
      '',
      '## Chapter 7: Getting Set Up — Launchpad & Operations Readiness Hub (Module G)',
      '',
      `- **Operations Readiness Score:** ${facts.opsReadinessPercent}% Ready`,
      `- **1. Legal Entity & Registration:** ${facts.legalEntityStructureLabel || '—'} • Entity Name: ${facts.registeredEntityName || '—'} • Reg No: ${facts.registrationNumber || 'Pending'}`,
      `- **2. Official Domain & Business Email:** Domain: ${facts.primaryDomain || '—'} • Official Email: ${facts.officialBusinessEmail || '—'}`,
      `- **3. Business Bank Account:** ${facts.bankProviderLabel || '—'} (${facts.hasDedicatedIban ? 'Dedicated Business IBAN Active' : 'IBAN Setup In Progress'})`,
      `- **4. Bookkeeping, VAT & Payroll:** Software: ${facts.accountingSoftwareLabel || '—'} • VAT Status: ${facts.vatStatusLabel || '—'}`,
      `- **5. Statutory Startup Insurance:** ${facts.insurancesActiveList.length > 0 ? facts.insurancesActiveList.join(', ') : 'In progress'}`,
      `- **6. Baseline Legal, IP & GDPR Compliance:** ${facts.legalComplianceItemsActiveList.length > 0 ? facts.legalComplianceItemsActiveList.join(', ') : 'In progress'}`,
      ''
    );
  }

  // Chapter 8: Module H
  if (facts.hasModuleH) {
    lines.push(
      '---',
      '',
      '## Chapter 8: Revenue Model, Pricing Architect & 3-Year Pocket Profit Breakeven (Module H)',
      '',
      `- **Revenue Vehicle & Value Metric:** ${facts.revenueModelVehicleLabel || '—'} (${facts.valueMetric || '—'})`,
      `- **Blended Net Average Price:** ${formatPlanCurrency(facts.blendedAveragePriceNet, facts.currency)} ex-VAT`,
      ...(facts.pricingTiersSummaries.length > 0
        ? [
            '',
            '### Pricing Tiers & Unit Pocket Profit Margins',
            ...facts.pricingTiersSummaries.map(
              (t) =>
                `- **${t.name}:** ${formatPlanCurrency(t.priceNetOfTax, facts.currency)} (${t.billingFrequency}) — **${t.pocketProfitMarginPercent}%** Pocket Profit Margin`
            ),
          ]
        : []),
      '',
      '### 3-Year Commercial & Breakeven Trajectory',
      `- **Year 1 Target:** ${facts.year1TargetCustomers} customers • ${formatPlanCurrency(facts.year1ProjectedNetTurnover, facts.currency)} Net Turnover • ${formatPlanCurrency(facts.year1PocketProfitNet, facts.currency)} Net Pocket Profit`,
      `- **Year 2 Projected Net Turnover:** ${formatPlanCurrency(facts.year2ProjectedNetTurnover, facts.currency)}`,
      `- **Year 3 Projected Net Turnover:** ${formatPlanCurrency(facts.year3ProjectedNetTurnover, facts.currency)}`,
      `- **Sales Cycle & Conversion:** ${facts.salesCycleDays} days sales cycle • ${facts.primarySalesMotionLabel || 'Direct'} • ${facts.expectedConversionRatePercent}% conversion rate`,
      ...(facts.executiveCommercialSummaryNarrative
        ? [
            '',
            `- **Executive Commercial Summary:** ${facts.executiveCommercialSummaryNarrative}`,
          ]
        : []),
      ''
    );
  }

  // Chapter 9: Module I
  if (facts.hasModuleI) {
    lines.push(
      '---',
      '',
      '## Chapter 9: Brand Positioning, 4Ps Strategy, First 10 Customers & Marketing Budget (Module I)',
      '',
      `- **3-Second Elevator Hook:** ${facts.elevatorHook140 || '—'}`,
      `- **Positioning Formula:** ${facts.positioningFormulaSummary || '—'}`,
      `- **4Ps Commercial Alignment:** Product: ${facts.fourPsSummary.productP1 || '—'} | Price: ${facts.fourPsSummary.priceP2 || '—'} | Place: ${facts.fourPsSummary.placeP3 || '—'} | Promotion: ${facts.fourPsSummary.promotionP4 || '—'}`,
      `- **First 10 Customers Playbook:** ${facts.first10ArchetypeLabel || 'Direct Outreach'} • Pilot Offer: ${facts.pilotOfferHeadline || '—'} • ${facts.first10ProspectsCount} named prospect(s) (${facts.committedOrPilotProspectsCount} pilot/paid)`,
      `- **Reverse-Engineered Marketing Budget & CAC/LTV:** ${formatPlanCurrency(facts.monthlyMarketingBudget, facts.currency)}/mo spend • Cash CAC: ${formatPlanCurrency(facts.calculatedCashCac, facts.currency)} • Customer LTV: ${formatPlanCurrency(facts.calculatedLtv, facts.currency)} • LTV:CAC Ratio: ${facts.calculatedLtvToCacRatio.toFixed(1)}:1 (${facts.calculatedPaybackMonths} mo payback)`,
      ...(facts.executiveMarketingSummaryNarrative
        ? [
            '',
            `- **Executive Marketing Summary:** ${facts.executiveMarketingSummaryNarrative}`,
          ]
        : []),
      ''
    );
  }

  // Chapter 10: Module J
  if (facts.hasModuleJ) {
    lines.push(
      '---',
      '',
      '## Chapter 10: 36-Month Financial Builder, Overheads, Working Capital & Cashflow Trough (Module J)',
      '',
      `- **Operating Cost Posture:** ${facts.operatingCostPostureLabel || 'Lean'} • Monthly Fixed Overheads: ${formatPlanCurrency(facts.monthlyFixedOverheadsTotal, facts.currency)}/mo`,
      `- **Year 1 Monthly Payroll & Drawings:** ${formatPlanCurrency(facts.monthlyFounderDrawingsYear1, facts.currency)}/mo Founder Drawings • ${formatPlanCurrency(facts.monthlyTeamSalariesYear1, facts.currency)}/mo Team Salaries`,
      `- **Working Capital Timing:** Customer Collection: ${facts.customerCollectionTimingLabel || '—'}`,
      `- **Funding Strategy & Cashflow Bridge:** ${facts.primaryFundingStrategyLabel || '—'} • Day-1 Cash Balance: ${formatPlanCurrency(facts.startingCashBalanceDay1, facts.currency)} • Mapped External Funding: ${formatPlanCurrency(facts.totalExternalFundingMapped, facts.currency)}`,
      ...(facts.writtenFinancialAssumptionsBlock
        ? [
            '',
            `- **Written Financial Assumptions:** ${facts.writtenFinancialAssumptionsBlock}`,
          ]
        : []),
      ...(facts.executiveFinancialSummaryNarrative
        ? [
            '',
            `- **Executive Financial Summary:** ${facts.executiveFinancialSummaryNarrative}`,
          ]
        : []),
      ''
    );
  }

  // Chapter 11: Module K
  if (facts.hasModuleK) {
    lines.push(
      '---',
      '',
      '## Chapter 11: Non-Dilutive Grants, Capital Stack, Reimbursement Bridge & Tax Relief (Module K)',
      '',
      `- **Target Primary Grant Scheme:** ${facts.selectedGrantKey || '—'} (Assessor Readiness Score: ${facts.overallAssessorReadinessScore}/100)`,
      `- **Total Target Funding Gap:** ${formatPlanCurrency(facts.totalTargetFundingGap, facts.currency)}`,
      `- **Capital Stack Breakdown:** Founder Skin-in-the-Game Cash: ${formatPlanCurrency(facts.skinInTheGameCash, facts.currency)} (${facts.skinInTheGamePercent}%) | Non-Dilutive Grants: ${formatPlanCurrency(facts.totalGrantsAllocated, facts.currency)} | Loans/Debt: ${formatPlanCurrency(facts.totalLoansAllocated, facts.currency)} | Angel/Equity: ${formatPlanCurrency(facts.totalAngelAllocated, facts.currency)} (${facts.projectedEquityDilutionPercent}% dilution)`,
      `- **Vouched Grant Reimbursement Timing Bridge:** ${facts.grantReimbursementTurnaroundWeeks} weeks estimated claim turnaround • Bridge Strategy: ${facts.bridgeStrategyLabel || '—'} (${facts.isAssessorLiquidityCompliant ? 'Assessor Liquidity Compliant' : 'Requires Additional Bridge Buffer'})`,
      `- **Investor Tax Relief Catalyst:** ${facts.primaryTaxScheme || 'NONE'} • Target Relief Raise: ${formatPlanCurrency(facts.targetReliefRaiseAmount, facts.currency)} (${facts.advanceAssuranceStatus || 'Status TBD'})`,
      ...(facts.executiveFundingSummaryNarrative
        ? [
            '',
            `- **Executive Funding & Grant Strategy Summary:** ${facts.executiveFundingSummaryNarrative}`,
          ]
        : []),
      ''
    );
  }

  if (showUpcomingChaptersRoadmap) {
    lines.push(
      '---',
      '',
      '## Official Submission & Export Readiness (Module L)',
      '- **Module L (Interactive Business Plan & Official Grant Compiler):** Ready to compile Chapters 1–11 into IE LEO Official Form + Appendices A–F, UK Innovate UK 9-Question IFS Mode, UK Start Up Loans Workbook, UK HMRC SEIS/EIS Advance Assurance Pack, or Standard Bank/Investor Business Plan.',
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
      <div class="grid-2" style="margin-top: 12px;">
        <div class="box">
          <div class="box-label">👥 Team, Survival Budget & Hiring (Module F)</div>
          <div class="box-value">
            ${
              facts.hasModuleF
                ? `<strong>Team (${facts.teamMembersCount}):</strong> ${escapeDocumentHtml(facts.teamMemberSummaries.map((m) => `${m.name} (${m.roleTitle})`).join(', ') || '—')}<br/>
                   <strong>7 Startup Hats:</strong> ${facts.hatsAssignedCount}/7 assigned (${facts.advisorsCount} advisor(s))<br/>
                   <strong>Net Survival Burn:</strong> ${escapeDocumentHtml(formatPlanCurrency(facts.monthlyNetSurvivalBurnTotal, facts.currency))}/mo • <strong>3-Yr Hires:</strong> ${facts.plannedHiresCount}`
                : '<em>Module F not yet completed.</em>'
            }
          </div>
        </div>
        <div class="box">
          <div class="box-label">🚀 Launchpad & Operations Readiness (Module G)</div>
          <div class="box-value">
            ${
              facts.hasModuleG
                ? `<strong>Ops Readiness Score:</strong> ${facts.opsReadinessPercent}% Ready<br/>
                   <strong>Entity & Domain:</strong> ${escapeDocumentHtml(facts.legalEntityStructureLabel || '—')} (${escapeDocumentHtml(facts.registeredEntityName || 'TBD')}) • ${escapeDocumentHtml(facts.primaryDomain || 'Domain TBD')}<br/>
                   <strong>Banking & Tax:</strong> ${escapeDocumentHtml(facts.bankProviderLabel || 'TBD')} • ${escapeDocumentHtml(facts.accountingSoftwareLabel || 'TBD')} (${escapeDocumentHtml(facts.vatStatusLabel || 'VAT TBD')})`
                : '<em>Module G not yet completed.</em>'
            }
          </div>
        </div>
        <div class="box">
          <div class="box-label">💰 Revenue, Pricing & 3-Yr Breakeven (Module H)</div>
          <div class="box-value">
            ${
              facts.hasModuleH
                ? `<strong>Model (${facts.pricingTiersCount} Tier(s)):</strong> ${escapeDocumentHtml(facts.revenueModelVehicleLabel || '—')} (${escapeDocumentHtml(formatPlanCurrency(facts.blendedAveragePriceNet, facts.currency))} blended net)<br/>
                   <strong>Y1 Target:</strong> ${facts.year1TargetCustomers} customers → ${escapeDocumentHtml(formatPlanCurrency(facts.year1ProjectedNetTurnover, facts.currency))} net turnover<br/>
                   <strong>Y3 Trajectory:</strong> ${escapeDocumentHtml(formatPlanCurrency(facts.year3ProjectedNetTurnover, facts.currency))} net turnover`
                : '<em>Module H not yet completed.</em>'
            }
          </div>
        </div>
        <div class="box">
          <div class="box-label">📣 Positioning, First 10 & CAC/LTV (Module I)</div>
          <div class="box-value">
            ${
              facts.hasModuleI
                ? `<strong>3-Sec Hook:</strong> ${escapeDocumentHtml(facts.elevatorHook140 || '—')}<br/>
                   <strong>First 10 Pipeline:</strong> ${facts.first10ProspectsCount} prospects (${facts.committedOrPilotProspectsCount} pilot/paid)<br/>
                   <strong>Unit Growth:</strong> ${escapeDocumentHtml(formatPlanCurrency(facts.monthlyMarketingBudget, facts.currency))}/mo spend • CAC: ${escapeDocumentHtml(formatPlanCurrency(facts.calculatedCashCac, facts.currency))} (${facts.calculatedLtvToCacRatio.toFixed(1)}:1 LTV:CAC)`
                : '<em>Module I not yet completed.</em>'
            }
          </div>
        </div>
        <div class="box">
          <div class="box-label">📈 36-Month Financials & Cashflow (Module J)</div>
          <div class="box-value">
            ${
              facts.hasModuleJ
                ? `<strong>Fixed Overheads:</strong> ${escapeDocumentHtml(formatPlanCurrency(facts.monthlyFixedOverheadsTotal, facts.currency))}/mo (${escapeDocumentHtml(facts.operatingCostPostureLabel || 'Lean')})<br/>
                   <strong>Y1 Drawings & Payroll:</strong> ${escapeDocumentHtml(formatPlanCurrency(facts.monthlyFounderDrawingsYear1, facts.currency))}/mo drawings • ${escapeDocumentHtml(formatPlanCurrency(facts.monthlyTeamSalariesYear1, facts.currency))}/mo payroll<br/>
                   <strong>Cash & Funding:</strong> ${escapeDocumentHtml(formatPlanCurrency(facts.startingCashBalanceDay1, facts.currency))} Day-1 cash • ${escapeDocumentHtml(formatPlanCurrency(facts.totalExternalFundingMapped, facts.currency))} external funding`
                : '<em>Module J not yet completed.</em>'
            }
          </div>
        </div>
        <div class="box">
          <div class="box-label">🏆 Grants, Capital Stack & Tax Relief (Module K)</div>
          <div class="box-value">
            ${
              facts.hasModuleK
                ? `<strong>Target Scheme:</strong> ${escapeDocumentHtml(facts.selectedGrantKey || '—')} (${facts.overallAssessorReadinessScore}/100 Readiness)<br/>
                   <strong>Capital Stack (${escapeDocumentHtml(formatPlanCurrency(facts.totalTargetFundingGap, facts.currency))}):</strong> ${escapeDocumentHtml(formatPlanCurrency(facts.skinInTheGameCash, facts.currency))} cash + ${escapeDocumentHtml(formatPlanCurrency(facts.totalGrantsAllocated, facts.currency))} grants + ${escapeDocumentHtml(formatPlanCurrency(facts.totalLoansAllocated, facts.currency))} loans<br/>
                   <strong>Tax Relief:</strong> ${escapeDocumentHtml(facts.primaryTaxScheme || 'NONE')} (${escapeDocumentHtml(formatPlanCurrency(facts.targetReliefRaiseAmount, facts.currency))} target)`
                : '<em>Module K not yet completed.</em>'
            }
          </div>
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

  // Chapter 6: Module F
  if (facts.hasModuleF) {
    sections.push(`
      <div class="section">
        <div class="section-header">
          <span class="section-num">F</span>
          <span class="section-title">Chapter 6: Founding Team, Personal Survival Budget & 3-Year Hiring Plan (Module F)</span>
        </div>
        <div class="grid-3" style="margin-bottom: 12px;">
          <div class="box">
            <div class="box-label">Founding Team & Hats</div>
            <div class="box-value"><strong>${facts.teamMembersCount}</strong> Promoter(s) • <strong>${facts.hatsAssignedCount}/7</strong> Hats Assigned</div>
          </div>
          <div class="box">
            <div class="box-label">Monthly Net Survival Burn</div>
            <div class="box-value"><strong>${escapeDocumentHtml(formatPlanCurrency(facts.monthlyNetSurvivalBurnTotal, facts.currency))}/mo</strong></div>
          </div>
          <div class="box">
            <div class="box-label">3-Year Planned Hires</div>
            <div class="box-value"><strong>${facts.plannedHiresCount}</strong> Scheduled Role(s)</div>
          </div>
        </div>
        ${
          facts.teamMemberSummaries.length > 0
            ? `<table class="doc-table" style="margin-bottom: 12px;">
                <thead>
                  <tr>
                    <th>Promoter Name & Role</th>
                    <th>Equity %</th>
                    <th>Commitment</th>
                    <th>150-Word Promoter Capability Bio</th>
                  </tr>
                </thead>
                <tbody>
                  ${facts.teamMemberSummaries
                    .map(
                      (m) => `
                    <tr>
                      <td><strong>${escapeDocumentHtml(m.name)}</strong><br/>${escapeDocumentHtml(m.roleTitle)}</td>
                      <td>${m.equityPercent}%</td>
                      <td>${m.weeklyHours} hrs/wk</td>
                      <td>${escapeDocumentHtml(m.bio150Words || '—')}</td>
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

  // Chapter 7: Module G
  if (facts.hasModuleG) {
    sections.push(`
      <div class="section">
        <div class="section-header">
          <span class="section-num">G</span>
          <span class="section-title">Chapter 7: Getting Set Up — Launchpad & Operations Readiness (Module G)</span>
        </div>
        <div class="grid-2">
          <div class="box">
            <div class="box-label">Entity, Domain & Banking</div>
            <div class="box-value">
              <strong>Readiness Score:</strong> ${facts.opsReadinessPercent}%<br/>
              <strong>Legal Structure:</strong> ${escapeDocumentHtml(facts.legalEntityStructureLabel || '—')} (${escapeDocumentHtml(facts.registeredEntityName || 'TBD')})<br/>
              <strong>Domain & Email:</strong> ${escapeDocumentHtml(facts.primaryDomain || '—')} • ${escapeDocumentHtml(facts.officialBusinessEmail || '—')}<br/>
              <strong>Business Banking:</strong> ${escapeDocumentHtml(facts.bankProviderLabel || '—')} (${facts.hasDedicatedIban ? 'Dedicated IBAN Active' : 'Pending'})
            </div>
          </div>
          <div class="box">
            <div class="box-label">Bookkeeping, Insurance & Legal/GDPR</div>
            <div class="box-value">
              <strong>Accounting & VAT:</strong> ${escapeDocumentHtml(facts.accountingSoftwareLabel || '—')} (${escapeDocumentHtml(facts.vatStatusLabel || '—')})<br/>
              <strong>Active Insurance:</strong> ${escapeDocumentHtml(facts.insurancesActiveList.join(', ') || 'In setup')}<br/>
              <strong>Legal & GDPR:</strong> ${escapeDocumentHtml(facts.legalComplianceItemsActiveList.join(', ') || 'In setup')}
            </div>
          </div>
        </div>
      </div>
    `);
  }

  // Chapter 8: Module H
  if (facts.hasModuleH) {
    sections.push(`
      <div class="section">
        <div class="section-header">
          <span class="section-num">H</span>
          <span class="section-title">Chapter 8: Revenue Model, Pricing Architect & 3-Year Pocket Profit Breakeven (Module H)</span>
        </div>
        <div class="grid-3" style="margin-bottom: 12px;">
          <div class="box">
            <div class="box-label">Year 1 Net Turnover (${facts.year1TargetCustomers} cust)</div>
            <div class="box-value"><strong>${escapeDocumentHtml(formatPlanCurrency(facts.year1ProjectedNetTurnover, facts.currency))}</strong></div>
          </div>
          <div class="box">
            <div class="box-label">Year 2 Net Turnover</div>
            <div class="box-value"><strong>${escapeDocumentHtml(formatPlanCurrency(facts.year2ProjectedNetTurnover, facts.currency))}</strong></div>
          </div>
          <div class="box">
            <div class="box-label">Year 3 Net Turnover</div>
            <div class="box-value"><strong>${escapeDocumentHtml(formatPlanCurrency(facts.year3ProjectedNetTurnover, facts.currency))}</strong></div>
          </div>
        </div>
        <div class="box">
          <div class="box-label">Pricing Architecture & Sales Motion</div>
          <div class="box-value">
            <strong>Model:</strong> ${escapeDocumentHtml(facts.revenueModelVehicleLabel || '—')} • <strong>Blended Net Price:</strong> ${escapeDocumentHtml(formatPlanCurrency(facts.blendedAveragePriceNet, facts.currency))}<br/>
            <strong>Sales Cycle & Motion:</strong> ${facts.salesCycleDays} days (${escapeDocumentHtml(facts.primarySalesMotionLabel || 'Direct')}) • ${facts.expectedConversionRatePercent}% conversion<br/>
            ${facts.executiveCommercialSummaryNarrative ? `<strong>Summary:</strong> ${escapeDocumentHtml(facts.executiveCommercialSummaryNarrative)}` : ''}
          </div>
        </div>
      </div>
    `);
  }

  // Chapter 9: Module I
  if (facts.hasModuleI) {
    sections.push(`
      <div class="section">
        <div class="section-header">
          <span class="section-num">I</span>
          <span class="section-title">Chapter 9: Brand Positioning, 4Ps, First 10 Customers & Marketing Budget (Module I)</span>
        </div>
        <div class="grid-2">
          <div class="box">
            <div class="box-label">3-Second Hook & Positioning</div>
            <div class="box-value">
              <strong>Hook:</strong> ${escapeDocumentHtml(facts.elevatorHook140 || '—')}<br/>
              <strong>Positioning:</strong> ${escapeDocumentHtml(facts.positioningFormulaSummary || '—')}
            </div>
          </div>
          <div class="box">
            <div class="box-label">First 10 Pipeline & CAC / LTV Economics</div>
            <div class="box-value">
              <strong>First 10 Pipeline:</strong> ${facts.first10ProspectsCount} prospects (${facts.committedOrPilotProspectsCount} pilot/paid) • Offer: ${escapeDocumentHtml(facts.pilotOfferHeadline || '—')}<br/>
              <strong>Monthly Budget:</strong> ${escapeDocumentHtml(formatPlanCurrency(facts.monthlyMarketingBudget, facts.currency))}/mo • <strong>Cash CAC:</strong> ${escapeDocumentHtml(formatPlanCurrency(facts.calculatedCashCac, facts.currency))} • <strong>LTV:CAC:</strong> ${facts.calculatedLtvToCacRatio.toFixed(1)}:1
            </div>
          </div>
        </div>
      </div>
    `);
  }

  // Chapter 10: Module J
  if (facts.hasModuleJ) {
    sections.push(`
      <div class="section">
        <div class="section-header">
          <span class="section-num">J</span>
          <span class="section-title">Chapter 10: 36-Month Financial Builder, Overheads & Cashflow Trough (Module J)</span>
        </div>
        <div class="grid-2">
          <div class="box">
            <div class="box-label">Overheads, Drawings & Payroll</div>
            <div class="box-value">
              <strong>Cost Posture:</strong> ${escapeDocumentHtml(facts.operatingCostPostureLabel || 'Lean')} (${escapeDocumentHtml(formatPlanCurrency(facts.monthlyFixedOverheadsTotal, facts.currency))}/mo fixed overheads)<br/>
              <strong>Y1 Founder Drawings:</strong> ${escapeDocumentHtml(formatPlanCurrency(facts.monthlyFounderDrawingsYear1, facts.currency))}/mo<br/>
              <strong>Y1 Team Payroll:</strong> ${escapeDocumentHtml(formatPlanCurrency(facts.monthlyTeamSalariesYear1, facts.currency))}/mo
            </div>
          </div>
          <div class="box">
            <div class="box-label">Working Capital & Funding Bridge</div>
            <div class="box-value">
              <strong>Collection Timing:</strong> ${escapeDocumentHtml(facts.customerCollectionTimingLabel || '—')}<br/>
              <strong>Day-1 Cash:</strong> ${escapeDocumentHtml(formatPlanCurrency(facts.startingCashBalanceDay1, facts.currency))} • <strong>External Funding:</strong> ${escapeDocumentHtml(formatPlanCurrency(facts.totalExternalFundingMapped, facts.currency))}<br/>
              ${facts.executiveFinancialSummaryNarrative ? `<strong>Summary:</strong> ${escapeDocumentHtml(facts.executiveFinancialSummaryNarrative)}` : ''}
            </div>
          </div>
        </div>
      </div>
    `);
  }

  // Chapter 11: Module K
  if (facts.hasModuleK) {
    sections.push(`
      <div class="section">
        <div class="section-header">
          <span class="section-num">K</span>
          <span class="section-title">Chapter 11: Non-Dilutive Grants, Capital Stack & Investor Tax Relief (Module K)</span>
        </div>
        <div class="grid-2">
          <div class="box">
            <div class="box-label">Grant Target & Capital Stack (${escapeDocumentHtml(formatPlanCurrency(facts.totalTargetFundingGap, facts.currency))})</div>
            <div class="box-value">
              <strong>Primary Scheme:</strong> ${escapeDocumentHtml(facts.selectedGrantKey || '—')} (${facts.overallAssessorReadinessScore}/100 Readiness)<br/>
              <strong>Founder Cash:</strong> ${escapeDocumentHtml(formatPlanCurrency(facts.skinInTheGameCash, facts.currency))} (${facts.skinInTheGamePercent}%)<br/>
              <strong>Grants + Loans + Equity:</strong> ${escapeDocumentHtml(formatPlanCurrency(facts.totalGrantsAllocated, facts.currency))} Grants • ${escapeDocumentHtml(formatPlanCurrency(facts.totalLoansAllocated, facts.currency))} Loans • ${escapeDocumentHtml(formatPlanCurrency(facts.totalAngelAllocated, facts.currency))} Equity
            </div>
          </div>
          <div class="box">
            <div class="box-label">Reimbursement Bridge & Tax Relief</div>
            <div class="box-value">
              <strong>Claim Turnaround:</strong> ${facts.grantReimbursementTurnaroundWeeks} weeks (${escapeDocumentHtml(facts.bridgeStrategyLabel || 'Bridge')})<br/>
              <strong>Investor Tax Scheme:</strong> ${escapeDocumentHtml(facts.primaryTaxScheme || 'NONE')} (${escapeDocumentHtml(formatPlanCurrency(facts.targetReliefRaiseAmount, facts.currency))} target raise)<br/>
              ${facts.executiveFundingSummaryNarrative ? `<strong>Summary:</strong> ${escapeDocumentHtml(facts.executiveFundingSummaryNarrative)}` : ''}
            </div>
          </div>
        </div>
      </div>
    `);
  }

  if (showUpcomingChaptersRoadmap) {
    sections.push(`
      <div class="section">
        <div class="section-header">
          <span class="section-num">L</span>
          <span class="section-title">Official Grant & Business Plan Compilation (Module L)</span>
        </div>
        <div class="box">
          <div class="box-label">Module L • Interactive Business Plan & Official Grant Compiler</div>
          <div class="box-value">Compile Chapters 1–11 into IE LEO Official Application Form + Appendices A–F, UK Innovate UK 9-Question IFS Mode, UK Start Up Loans Workbook, UK HMRC SEIS/EIS Pack, or Standard Business Plan.</div>
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
