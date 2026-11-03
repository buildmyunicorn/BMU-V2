import type { BlindSpotItem } from '@/db/schema';
import {
  getCountryRulePack,
  formatPlanCurrency,
  type SupportedCountryCode,
} from '@/lib/localization';
import {
  escapeDocumentHtml as escapeHtml,
  renderBmuStandaloneHtmlDocument,
} from '@/lib/export/document-shell';
import type {
  ActiveStartupPlan,
  ProductTrackType,
  ProductFormFactorType,
  V1PrototypeApproachType,
  V1LaunchTimelineType,
  ProductVehicleStep1Data,
  SalesChannelOptionType,
  DeliveryFulfillmentModelType,
  ChannelMatrixStep2Data,
  ScopeBucketType,
  ScopeItemEffortType,
  V1ScopeDisciplineRuleType,
  ScopeFilterItem,
  ScopeFilterStep3Data,
  BuildVsBuyTierType,
  BuildVsBuyCostModelType,
  CoreIpOwnershipRuleType,
  BuildVsBuyItem,
  BuildVsBuyStep4Data,
  WorkPackageExecutionModeType,
  WorkPackageTimelineWindowType,
  WorkPackageCadenceRuleType,
  ProductWorkPackageItem,
  ProductFlowStageItem,
  WorkPackagesStep5Data,
  ProductBlindSpotCategoryType,
  ProductBlindSpotSeverityType,
  ProductReadinessConfidenceType,
  ProductBlindSpotItem,
  BlindSpotAuditStep6Data,
  SavedModuleDData,
} from '@/lib/auth/session-store';

export interface ModuleDBriefData {
  planTitle: string;
  founderName: string;
  industryCategory: string;
  hqCountryCode: SupportedCountryCode;
  baseCurrency?: string;
  targetMarkets?: string[];
  step1Data: ProductVehicleStep1Data;
  step2Data: ChannelMatrixStep2Data;
  step3Data: ScopeFilterStep3Data;
  step4Data: BuildVsBuyStep4Data;
  step5Data: WorkPackagesStep5Data;
  step6Data: BlindSpotAuditStep6Data;
  // Upstream context
  beachheadSegment?: string;
  validatedPainPoint?: string;
  surveyResponseCount?: number;
  waitlistCount?: number;
  interviewCount?: number;
  thingsToConsider?: BlindSpotItem[];
  whiteLabelEnabled?: boolean;
}

export const PRODUCT_TRACK_LABELS: Record<ProductTrackType, string> = {
  SAAS_SOFTWARE_AI: 'Software / SaaS / AI Platform',
  PHYSICAL_PRODUCT_ECOM: 'Physical Product / Craft / E-Commerce',
  EDUCATION_PROGRAM_COHORT: 'Education / Guided Support Platform',
  MARKETPLACE_PLATFORM: 'Two-Sided Marketplace / Booking Platform',
  PRODUCTIZED_SERVICE_AGENCY: 'Productized Service / Agency',
  HYBRID_HARDWARE_SOFTWARE: 'Hybrid Hardware + Companion Software',
  OTHER: 'Custom Product Track',
};

export const FORM_FACTOR_LABELS: Record<ProductFormFactorType, string> = {
  WEB_PLATFORM: 'Responsive Web Platform (Desktop & Mobile Browser)',
  MOBILE_APP_IOS_ANDROID: 'Dedicated Mobile App (iOS / Android)',
  WEB_AND_MOBILE_BOTH: 'Both Web Platform + Companion Mobile App',
  EXTENSION_PLUGIN_API: 'Browser Extension / Plugin / API',
  SINGLE_HERO_SKU: 'Single Hero Physical Product (1 Flagship SKU)',
  CURATED_2_3_SKUS: 'Curated Starter Range (2–3 SKUs)',
  CONSUMABLE_REFILL_SUB: 'Consumable / Refill Subscription Box',
  MADE_TO_ORDER_BESPOKE: 'Made-to-Order / Bespoke Craft Item',
  MANAGED_CURATED_MARKETPLACE: 'Managed / Vetted Curated Marketplace',
  SELF_SERVE_BOOKING_DIRECTORY: 'Self-Serve Booking & Discovery Directory',
  B2B_PROCUREMENT_EXCHANGE: 'B2B Supply & Procurement Exchange',
  COMMUNITY_PEER_MARKETPLACE: 'Peer-to-Peer Community Marketplace',
  MOBILE_WEB_PORTAL_AUDIO_VIDEO: 'Mobile-Ready Web Portal (Audio & Video)',
  COHORT_LIVE_PLUS_CURRICULUM: 'Live Cohort Program + Structured Curriculum',
  MEMBERSHIP_COMMUNITY_LIBRARY: 'Recurring Membership Library & Community',
  B2B_SCHOOL_CLINIC_LICENCE: 'Institutional / School / Clinic Licensed Portal',
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

export const PROTOTYPE_APPROACH_LABELS: Record<V1PrototypeApproachType, string> = {
  FOCUSED_FULL_CODE_V1: 'Focused Full-Code V1 + AI Co-Pilot (Next.js / Modern Stack)',
  NO_CODE_LOW_CODE_MVP: 'No-Code / Low-Code Rapid MVP (Webflow, Bubble, FlutterFlow)',
  CONCIERGE_AI_ASSISTED_MVP: 'Wizard-of-Oz / Concierge + AI-Assisted MVP',
  CLICKABLE_PROTOTYPE_PREORDER: 'Clickable Figma Prototype + Stripe Pre-Orders',
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

export const LAUNCH_TIMELINE_LABELS: Record<V1LaunchTimelineType, string> = {
  UNDER_4_WEEKS: 'Under 4 Weeks (Fast Pilot)',
  '1_TO_3_MONTHS': '1 to 3 Months (Lean V1 Launch)',
  '3_TO_6_MONTHS': '3 to 6 Months (Structured Build)',
  OVER_6_MONTHS: '6+ Months (Deep R&D / Regulated)',
  OTHER: 'Custom Launch Timeline',
};

export const SALES_CHANNEL_LABELS: Record<SalesChannelOptionType, string> = {
  DIRECT_WEB_STRIPE: 'Direct Web Checkout (Stripe / Paddle / LemonSqueezy)',
  LTD_LAUNCH_MARKETPLACE: 'Software Launch Directories & Partner Bundles (ProductHunt / G2)',
  B2B_INSTITUTIONAL_INVOICE: 'Direct B2B / University / Enterprise Annual Invoice',
  APP_STORE_PLUGIN_MARKETPLACE: 'Apple / Google App Store or Ecosystem Marketplace',
  ETSY_MARKETPLACE: 'Etsy Marketplace (Handmade & Gift Buyers)',
  AMAZON_FBA: 'Amazon FBA (Prime Fulfillment)',
  AMAZON_FBM: 'Amazon FBM / Custom Workshop Dispatch',
  DIRECT_WEB_CRAFT_MARKETS: 'Own Brand Website (Shopify/Woo) + Local Markets',
  WHOLESALE_RETAIL_STOCKISTS: 'Boutique & Retail Stockists (Wholesale B2B)',
  DIRECT_WEB_PORTAL_STRIPE: 'Direct Web Portal + Stripe Checkout',
  HOSTED_COURSE_COMMUNITY: 'All-in-One Course Platform (Kajabi / Skool / Circle)',
  CHARITY_CLINIC_PARTNERSHIPS: 'Charities, Clinics & Institutional Referrals',
  MOBILE_IN_APP_PURCHASE: 'Apple App Store / Google Play In-App Subscription',
  DIRECT_WEB_MANAGED_ESCROW: 'Direct Web Platform + Managed Stripe Connect Escrow',
  B2B_ANNUAL_SUBSCRIPTION_PLUS_TAKE: 'Annual Subscription + Transaction Take-Rate',
  SOCIAL_COMMUNITY_REFERRAL_LOOP: 'Private Community & Direct Referral Loop',
  DIRECT_STRIPE_SUBSCRIPTION_LINK: 'Direct Stripe Subscription Link / Productized Checkout',
  B2B_INVOICE_BANK_TRANSFER: 'Direct B2B Invoice (SEPA / Faster Payments / ACH)',
  FREELANCE_EXPERT_MARKETPLACE: 'Expert Marketplace / Partner Referral Network',
  DIRECT_HARDWARE_BUNDLE_WEB: 'Direct Website Bundle (Hardware + Companion Subscription)',
  AMAZON_PLUS_COMPANION_PORTAL: 'Amazon/Retail for Device + Direct Web Activation',
  B2B_CHANNEL_RESELLER: 'B2B Installers, Clinics, or Reseller Partners',
  OTHER: 'Custom Sales Channel',
};

export const DELIVERY_MODEL_LABELS: Record<DeliveryFulfillmentModelType, string> = {
  INSTANT_SELF_SERVE_ONBOARDING: 'Instant Self-Serve Account + Guided Onboarding Flow',
  HYBRID_SELF_SERVE_PLUS_COHORT_CODE: 'Self-Serve Checkout + Voucher / Cohort Code Redemption',
  FOUNDER_CONCIERGE_SETUP_CALL: 'White-Glove 15-Minute Founder Onboarding Call',
  WORKSHOP_PACK_AND_COURIER: 'Packed In-House (Workshop / Studio) + Tracked Courier Drop',
  HYBRID_FBA_STANDARD_WORKSHOP_CUSTOM: 'Hybrid: Amazon FBA for Standard SKUs + Workshop Ship for Custom',
  THIRD_PARTY_3PL_WAREHOUSE: 'Outsourced 3PL Fulfillment Warehouse',
  LOCAL_PICKUP_AND_MARKETS: 'Local Craft Markets, Click & Collect + Regional Delivery',
  INSTANT_24_7_PORTAL_PLUS_PRINTABLES: 'Instant 24/7 Portal Access + Downloadable Printables',
  HYBRID_ON_DEMAND_PLUS_LIVE_QA: 'On-Demand Lessons + Weekly Group Live Q&A Office Hours',
  SCHEDULED_COHORT_START_DATES: 'Fixed-Date Cohort Enrolments (e.g. 4 Intakes per Year)',
  MANUAL_CONCIERGE_FULFILLMENT: 'Manual Concierge Matching & Booking Coordination',
  CLIENT_PORTAL_ASYNC_DELIVERY: '5-Minute Intake Form + Shared Client Portal (Async Delivery)',
  HARDWARE_SHIP_PLUS_QR_ACTIVATION: 'Tracked Courier Kit + In-Box QR Code Web Activation',
  OTHER: 'Custom Delivery Model',
};

export const SCOPE_BUCKET_LABELS: Record<ScopeBucketType, string> = {
  MUST_HAVE_V1: '🟢 Day-1 V1 Core (Launch Blocker)',
  FAST_FOLLOW_V1_5: '🟡 Version 1.5 (Fast-Follow, Weeks 2–8)',
  PARKING_LOT_V2: '🔴 Phase 2 / V2 Backlog (Do Not Build Yet)',
};

export const BUILD_VS_BUY_TIER_LABELS: Record<BuildVsBuyTierType, string> = {
  BUILD_IN_HOUSE: 'Tier 1 • Custom Build / Core IP ("Secret Sauce")',
  BUY_RENT_OFF_SHELF: 'Tier 2 • Buy / Rent Off-the-Shelf (Commodity Stack)',
  OUTSOURCE_PARTNER: 'Tier 3 • Configure / Specialist Partner',
};

export const COST_MODEL_LABELS: Record<BuildVsBuyCostModelType, string> = {
  MONTHLY_SUBSCRIPTION: 'Monthly Recurring (SaaS / Rent)',
  ONE_OFF_PURCHASE: 'Once-Off (CapEx / Dev / Tooling)',
  PER_UNIT_COGS: 'Per-Unit Direct Variable COGS',
  SWEAT_EQUITY_ZERO: 'Sweat Equity (Zero Direct Cash)',
  OTHER: 'Custom Cost Model',
};

export const READINESS_CONFIDENCE_LABELS: Record<ProductReadinessConfidenceType, string> = {
  READY_TO_BUILD_V1: 'Ready for Pilot Build / Production',
  NEEDS_MINOR_DE_RISKING: 'Needs Minor De-Risking (1–2 Gaps to Close)',
  NEEDS_PROTOTYPE_SPIKE_FIRST: 'Needs Technical Spike / Prototype Test First',
  OTHER: 'Custom Readiness Status',
};

export function formatTrackLabel(track: ProductTrackType, otherText?: string): string {
  if (track === 'OTHER' && otherText?.trim()) return `Other: ${otherText.trim()}`;
  return PRODUCT_TRACK_LABELS[track] || track;
}

export function formatFormFactorLabel(ff: ProductFormFactorType, otherText?: string): string {
  if (ff === 'OTHER' && otherText?.trim()) return `Other: ${otherText.trim()}`;
  return FORM_FACTOR_LABELS[ff] || ff;
}

export function formatV1ApproachLabel(app: V1PrototypeApproachType, otherText?: string): string {
  if (app === 'OTHER' && otherText?.trim()) return `Other: ${otherText.trim()}`;
  return PROTOTYPE_APPROACH_LABELS[app] || app;
}

export function formatTimelineLabel(tl: V1LaunchTimelineType, otherText?: string): string {
  if (tl === 'OTHER' && otherText?.trim()) return `Other: ${otherText.trim()}`;
  return LAUNCH_TIMELINE_LABELS[tl] || tl.replace(/_/g, ' ');
}

export function formatChannelLabel(ch: SalesChannelOptionType, otherText?: string): string {
  if (ch === 'OTHER' && otherText?.trim()) return `Other: ${otherText.trim()}`;
  return SALES_CHANNEL_LABELS[ch] || ch.replace(/_/g, ' ');
}

export function formatDeliveryLabel(del: DeliveryFulfillmentModelType, otherText?: string): string {
  if (del === 'OTHER' && otherText?.trim()) return `Other: ${otherText.trim()}`;
  return DELIVERY_MODEL_LABELS[del] || del.replace(/_/g, ' ');
}

export function formatReadinessLabel(rc: ProductReadinessConfidenceType | '', otherText?: string): string {
  if (!rc) return 'Ready for Pilot Build';
  if (rc === 'OTHER' && otherText?.trim()) return `Other: ${otherText.trim()}`;
  return READINESS_CONFIDENCE_LABELS[rc] || rc;
}

/**
 * Builds a structured Markdown brief of Module D.
 */
export function buildModuleDMarkdownBrief(data: ModuleDBriefData): string {
  const {
    planTitle,
    hqCountryCode,
    step1Data,
    step2Data,
    step3Data,
    step4Data,
    step5Data,
    step6Data,
    baseCurrency,
    beachheadSegment,
    validatedPainPoint,
    surveyResponseCount = 0,
    waitlistCount = 0,
    interviewCount = 0,
    whiteLabelEnabled = false,
  } = data;

  const countryPack = getCountryRulePack(hqCountryCode);
  const currency = baseCurrency || countryPack.defaultCurrency;

  const day1Items = step3Data.items.filter((i) => i.bucket === 'MUST_HAVE_V1');
  const v15Items = step3Data.items.filter((i) => i.bucket === 'FAST_FOLLOW_V1_5');
  const v2Items = step3Data.items.filter((i) => i.bucket === 'PARKING_LOT_V2');

  const inHouseStack = step4Data.items.filter((i) => i.tier === 'BUILD_IN_HOUSE');
  const buyRentStack = step4Data.items.filter((i) => i.tier === 'BUY_RENT_OFF_SHELF');
  const partnerStack = step4Data.items.filter((i) => i.tier === 'OUTSOURCE_PARTNER');

  const step4Monthly = step4Data.items
    .filter((i) => i.costModel === 'MONTHLY_SUBSCRIPTION')
    .reduce((sum, i) => sum + (Number(i.estimatedCostAmount) || 0), 0);
  const step4OneOff = step4Data.items
    .filter((i) => i.costModel === 'ONE_OFF_PURCHASE')
    .reduce((sum, i) => sum + (Number(i.estimatedCostAmount) || 0), 0);
  const step4PerUnit = step4Data.items
    .filter((i) => i.costModel === 'PER_UNIT_COGS')
    .reduce((sum, i) => sum + (Number(i.estimatedCostAmount) || 0), 0);

  const step5Monthly = step5Data.workPackages
    .filter((wp) => wp.costModel === 'MONTHLY_SUBSCRIPTION')
    .reduce((sum, wp) => sum + (Number(wp.estimatedCostAmount) || 0), 0);
  const step5OneOff = step5Data.workPackages
    .filter((wp) => wp.costModel === 'ONE_OFF_PURCHASE')
    .reduce((sum, wp) => sum + (Number(wp.estimatedCostAmount) || 0), 0);
  const step5PerUnit = step5Data.workPackages
    .filter((wp) => wp.costModel === 'PER_UNIT_COGS')
    .reduce((sum, wp) => sum + (Number(wp.estimatedCostAmount) || 0), 0);

  const combinedMonthly = step4Monthly + step5Monthly;
  const combinedOneOff = step4OneOff + step5OneOff;
  const combinedUnitCogs = step4PerUnit + step5PerUnit;
  const netRevenueKeptPercent = Number((100 - step2Data.estimatedBlendedFeePercent).toFixed(1));

  const trackLabel = formatTrackLabel(step1Data.productTrack, step1Data.otherProductTrackText);
  const formFactorLabel = formatFormFactorLabel(step1Data.formFactor, step1Data.otherFormFactorText);
  const v1ApproachLabel = formatV1ApproachLabel(step1Data.v1PrototypeApproach, step1Data.otherV1PrototypeApproachText);
  const timelineLabel = formatTimelineLabel(step1Data.launchTimeline, step1Data.otherLaunchTimelineText);
  const primaryChannelLabel = formatChannelLabel(step2Data.primaryChannel, step2Data.otherPrimaryChannelText);
  const secondaryChannelLabels = step2Data.secondaryChannels.map((sc) =>
    formatChannelLabel(sc, sc === 'OTHER' ? step2Data.otherSecondaryChannelText : undefined)
  );
  const deliveryModelLabel = formatDeliveryLabel(step2Data.deliveryFulfillmentModel, step2Data.otherDeliveryFulfillmentText);
  const readinessLabel = formatReadinessLabel(step6Data.readinessConfidence, step6Data.otherReadinessConfidenceText);

  const lines: string[] = [
    `# ${planTitle} — 1-Page Product, Scope & Work Package Brief (Module D)`,
    `**Country / Currency:** ${countryPack.countryName} (${currency}) | **Product Track:** ${trackLabel}`,
    `**Platform / Form Factor:** ${formFactorLabel} | **V1 Build Approach:** ${v1ApproachLabel} | **Target Launch Window:** ${timelineLabel}`,
    `**Readiness Status:** ${readinessLabel}`,
    `**Upstream Customer Proof (Modules A–C):** Target Customer: ${beachheadSegment || 'Early adopters'} | Survey Responses: ${surveyResponseCount} | Waitlist Leads: ${waitlistCount} | 1-on-1 Interviews: ${interviewCount}`,
    `**#1 Validated Pain Point:** "${validatedPainPoint || 'Deliver a fast, reliable V1 solution.'}"`,
    '',
    `## 1. Executive Product Summary & De-Risking Charter`,
    step6Data.executiveProductBriefSummary || step1Data.ahaMomentNarrative || '_No executive summary recorded yet._',
    '',
    `**De-Risking & Grant Sign-Off:** ${step6Data.keyDeRiskingSignOffNarrative || step5Data.bottleneckAndDeRiskingNarrative || '_Not recorded yet._'}`,
    '',
    `## 2. Product Vehicle, Channel Strategy & Unit Cost Roll-Up (Steps 1–2 & 4–5)`,
    `- **Product Track & Format:** ${trackLabel} — ${formFactorLabel}`,
    `- **V1 Build / Prototype Approach:** ${v1ApproachLabel}`,
    `- **60-Second Customer "Aha! Moment":** ${step1Data.ahaMomentNarrative || '—'}`,
    `- **Why This Vehicle Fits Customer:** ${step1Data.whyThisVehicleFitsCustomer || '—'}`,
    `- **Primary Distribution Channel (${step2Data.primaryChannelSharePercent}% share):** ${primaryChannelLabel}`,
    `- **Secondary Distribution Channels (${Math.max(0, 100 - step2Data.primaryChannelSharePercent)}% share):** ${secondaryChannelLabels.join(', ') || 'None (100% Primary)'}`,
    `- **Blended Platform/Payment Fee:** ${step2Data.estimatedBlendedFeePercent}% (You keep ${netRevenueKeptPercent}% Net Revenue before COGS)`,
    `- **V1 Delivery & Fulfillment Model:** ${deliveryModelLabel}`,
    `- **Rent-to-Own Customer Bridge Strategy:** ${step2Data.rentToOwnBridgeStrategy || '—'}`,
    `- **Why Channel Mix Fits Margins:** ${step2Data.channelWhyItFitsNotes || '—'}`,
    `- **Estimated Cost Structure (Synced to Module H):** ${formatPlanCurrency(combinedOneOff, currency)} once-off | ${formatPlanCurrency(combinedMonthly, currency)}/mo recurring | ${formatPlanCurrency(combinedUnitCogs, currency)}/unit direct variable COGS`,
    '',
    `## 3. Ruthless V1 Scope Filter (Step 3)`,
    step3Data.scopeDisciplineRule ? `- **Scope Discipline Rule:** ${step3Data.scopeDisciplineRule.replace(/_/g, ' ')}${step3Data.otherScopeDisciplineRuleText ? ` (${step3Data.otherScopeDisciplineRuleText})` : ''}` : '',
    `- **🟢 Day-1 V1 Core — Launch Now (${day1Items.length}):** ${day1Items.map((i) => `${i.title}${i.categoryTag ? ` [${i.categoryTag}]` : ''} (${i.effortImpact} effort)${i.rationaleOrNote ? `: ${i.rationaleOrNote}` : ''}`).join('; ') || 'None added'}`,
    `- **🟡 Version 1.5 — Fast-Follow (${v15Items.length}):** ${v15Items.map((i) => `${i.title}${i.categoryTag ? ` [${i.categoryTag}]` : ''} (${i.effortImpact} effort)`).join('; ') || 'None'}`,
    `- **🔴 Phase 2 / V2 Backlog — Do Not Build Yet (${v2Items.length}):** ${v2Items.map((i) => `${i.title}${i.categoryTag ? ` [${i.categoryTag}]` : ''}`).join('; ') || 'None'}`,
    `- **What We Explicitly Refuse to Build in V1:** ${step3Data.whatWeRefuseToBuildInV1Narrative || '—'}`,
    `- **Why Lean V1 Wins Faster:** ${step3Data.whyThisLeanV1WinsFasterNarrative || '—'}`,
    '',
    `## 4. 3-Tier "Build vs. Buy" & Core IP ("Secret Sauce") Matrix (Step 4)`,
    step4Data.coreIpOwnershipRule ? `- **Core IP Ownership Rule:** ${step4Data.coreIpOwnershipRule.replace(/_/g, ' ')}${step4Data.otherCoreIpOwnershipRuleText ? ` (${step4Data.otherCoreIpOwnershipRuleText})` : ''}` : '',
    `- **Tier 1 — Custom Build / Core IP ("Your Secret Sauce": ${inHouseStack.length}):** ${inHouseStack.map((i) => `${i.title} (${i.vendorOrToolName || 'In-house'}) — ${formatPlanCurrency(i.estimatedCostAmount, currency)} ${i.costModel.replace(/_/g, ' ')}`).join('; ') || 'None'}`,
    `- **Tier 2 — Buy / Rent Off-the-Shelf (Commodity: ${buyRentStack.length}):** ${buyRentStack.map((i) => `${i.title} (${i.vendorOrToolName || 'SaaS/Tool'}) — ${formatPlanCurrency(i.estimatedCostAmount, currency)} ${i.costModel.replace(/_/g, ' ')}`).join('; ') || 'None'}`,
    `- **Tier 3 — Configure / Specialist Partner (${partnerStack.length}):** ${partnerStack.map((i) => `${i.title} (${i.vendorOrToolName || 'Partner'}) — ${formatPlanCurrency(i.estimatedCostAmount, currency)} ${i.costModel.replace(/_/g, ' ')}`).join('; ') || 'None'}`,
    `- **Core IP & Secret Sauce Narrative:** ${step4Data.secretSauceInHouseNarrative || '—'}`,
    `- **Why Buy & Partner Saves Time:** ${step4Data.whyBuyAndPartnerSavesTimeNarrative || '—'}`,
    '',
    `## 5. System Architecture Flow & Work Packages WP1–WPn (Step 5)`,
    step5Data.executionCadenceRule ? `- **Execution Cadence Rule:** ${step5Data.executionCadenceRule.replace(/_/g, ' ')}${step5Data.otherExecutionCadenceRuleText ? ` (${step5Data.otherExecutionCadenceRuleText})` : ''}` : '',
    ...(step5Data.flowStages.length > 0
      ? [
          `**System Architecture / Delivery Flow (${step5Data.flowStages.length} Stages):**`,
          ...step5Data.flowStages.map(
            (st, idx) =>
              `- **Stage ${st.stageNumber || idx + 1} (${st.stageTitle}):** ${st.stageSubtitle ? `${st.stageSubtitle} | ` : ''}Tools/Stack: ${st.keyToolsOrMaterials || st.whatHappensHere || '—'} -> Output/Gate: ${st.outputOrHandoff || st.outputOrHandOff || '—'}`
          ),
          '',
        ]
      : []),
    `**Work Package Milestone Schedule (WP1–WP${step5Data.workPackages.length}):**`,
    ...step5Data.workPackages.map(
      (wp) =>
        `- **${wp.wpCode}: ${wp.title}** (${wp.timelineWindow.replace(/_/g, ' ')}) — Mode: ${wp.executionMode.replace(/_/g, ' ')} | Cost: ${wp.costModel === 'SWEAT_EQUITY_ZERO' ? 'Sweat Equity' : `${formatPlanCurrency(wp.estimatedCostAmount, currency)} (${wp.costModel.replace(/_/g, ' ')})`} | Deliverable: ${wp.deliverableMilestone || wp.deliverableMilestoneProof || '—'} | Proof Gate: ${wp.verificationGateOrDeRisking || wp.linkedTaskSummary || '—'}${wp.isGrantEligibleRAndDOrPrototype ? ' [★ Grant Eligible R&D/Prototype]' : ''}`
    ),
    `- **Technical Merit & State-of-the-Art Innovation:** ${step5Data.technicalMeritAndInnovationNarrative || '—'}`,
    `- **Bottleneck & Critical Path De-Risking:** ${step5Data.bottleneckAndDeRiskingNarrative || '—'}`,
    '',
    `## 6. Constructive "Things to Consider" & Mitigations (Step 6)`,
    ...step6Data.blindSpots.map(
      (bs) =>
        `- **[${bs.isResolved ? 'RESOLVED' : bs.severity}] ${bs.title} (${bs.category.replace(/_/g, ' ')}):** ${bs.whyItMatters} -> *Action:* ${bs.recommendedActionOrFix}${bs.founderMitigationNote ? ` | *Founder Mitigation:* ${bs.founderMitigationNote}` : ''}`
    ),
    '',
    whiteLabelEnabled
      ? `_Generated for ${planTitle}_`
      : `_Generated with Startup Preflight — Module D Product & Technical Blueprint_`,
  ].filter(Boolean);

  return lines.join('\n');
}

/**
 * Generates the magazine-quality standalone HTML document for Module D,
 * rendering 100% of gathered product, vehicle, scope, build-vs-buy, work packages,
 * flow stages, and blind spots into the unified BMU document shell.
 */
export function buildModuleDStandaloneHtmlBrief(data: ModuleDBriefData): string {
  const {
    planTitle,
    founderName,
    industryCategory,
    hqCountryCode,
    baseCurrency,
    targetMarkets = [],
    step1Data,
    step2Data,
    step3Data,
    step4Data,
    step5Data,
    step6Data,
    beachheadSegment,
    validatedPainPoint,
    surveyResponseCount = 0,
    waitlistCount = 0,
    interviewCount = 0,
    thingsToConsider = [],
    whiteLabelEnabled = false,
  } = data;

  const countryPack = getCountryRulePack(hqCountryCode);
  const currency = baseCurrency || countryPack.defaultCurrency;
  const dateStr = new Date().toLocaleDateString('en-IE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const day1Items = step3Data.items.filter((i) => i.bucket === 'MUST_HAVE_V1');
  const v15Items = step3Data.items.filter((i) => i.bucket === 'FAST_FOLLOW_V1_5');
  const v2Items = step3Data.items.filter((i) => i.bucket === 'PARKING_LOT_V2');

  const inHouseStack = step4Data.items.filter((i) => i.tier === 'BUILD_IN_HOUSE');
  const buyRentStack = step4Data.items.filter((i) => i.tier === 'BUY_RENT_OFF_SHELF');
  const partnerStack = step4Data.items.filter((i) => i.tier === 'OUTSOURCE_PARTNER');

  const step4Monthly = step4Data.items
    .filter((i) => i.costModel === 'MONTHLY_SUBSCRIPTION')
    .reduce((sum, i) => sum + (Number(i.estimatedCostAmount) || 0), 0);
  const step4OneOff = step4Data.items
    .filter((i) => i.costModel === 'ONE_OFF_PURCHASE')
    .reduce((sum, i) => sum + (Number(i.estimatedCostAmount) || 0), 0);
  const step4PerUnit = step4Data.items
    .filter((i) => i.costModel === 'PER_UNIT_COGS')
    .reduce((sum, i) => sum + (Number(i.estimatedCostAmount) || 0), 0);

  const step5Monthly = step5Data.workPackages
    .filter((wp) => wp.costModel === 'MONTHLY_SUBSCRIPTION')
    .reduce((sum, wp) => sum + (Number(wp.estimatedCostAmount) || 0), 0);
  const step5OneOff = step5Data.workPackages
    .filter((wp) => wp.costModel === 'ONE_OFF_PURCHASE')
    .reduce((sum, wp) => sum + (Number(wp.estimatedCostAmount) || 0), 0);
  const step5PerUnit = step5Data.workPackages
    .filter((wp) => wp.costModel === 'PER_UNIT_COGS')
    .reduce((sum, wp) => sum + (Number(wp.estimatedCostAmount) || 0), 0);

  const combinedMonthly = step4Monthly + step5Monthly;
  const combinedOneOff = step4OneOff + step5OneOff;
  const combinedUnitCogs = step4PerUnit + step5PerUnit;
  const netRevenueKeptPercent = Number((100 - step2Data.estimatedBlendedFeePercent).toFixed(1));

  const trackLabel = formatTrackLabel(step1Data.productTrack, step1Data.otherProductTrackText);
  const formFactorLabel = formatFormFactorLabel(step1Data.formFactor, step1Data.otherFormFactorText);
  const v1ApproachLabel = formatV1ApproachLabel(step1Data.v1PrototypeApproach, step1Data.otherV1PrototypeApproachText);
  const timelineLabel = formatTimelineLabel(step1Data.launchTimeline, step1Data.otherLaunchTimelineText);
  const primaryChannelLabel = formatChannelLabel(step2Data.primaryChannel, step2Data.otherPrimaryChannelText);
  const secondaryChannelLabels = step2Data.secondaryChannels.map((sc) =>
    formatChannelLabel(sc, sc === 'OTHER' ? step2Data.otherSecondaryChannelText : undefined)
  );
  const deliveryModelLabel = formatDeliveryLabel(step2Data.deliveryFulfillmentModel, step2Data.otherDeliveryFulfillmentText);
  const readinessLabel = formatReadinessLabel(step6Data.readinessConfidence, step6Data.otherReadinessConfidenceText);

  const marketsDisplay =
    targetMarkets.length > 0
      ? targetMarkets
          .map((m) => (m === 'IE' ? 'Ireland' : m === 'GB' ? 'UK' : m === 'US' ? 'US' : m))
          .join(', ')
      : countryPack.countryName;

  // Build Sections HTML
  const sectionsHtml = `
    <!-- UPSTREAM PROOF ANCHOR & EXECUTIVE CHARTER -->
    <div class="section">
      <div class="section-title">Executive Product Charter &amp; Upstream Validation Proof</div>
      <div class="grid-2" style="margin-bottom: 12px;">
        <div class="card card-highlight">
          <div class="card-label">Validated Problem &amp; Beachhead Anchor (Modules A–C)</div>
          <div class="card-value" style="font-size: 13px; line-height: 1.5;">
            <strong>Beachhead Customer:</strong> ${escapeHtml(beachheadSegment || 'Early target adopters')}<br/>
            <strong>Validation Proof:</strong> ${surveyResponseCount} Survey Responses &bull; ${waitlistCount} Waitlist Leads &bull; ${interviewCount} 1-on-1 Interviews<br/>
            <strong>#1 Pain Point Solved:</strong> &ldquo;${escapeHtml(validatedPainPoint || 'Deliver a fast, reliable V1 solution.')}&rdquo;
          </div>
        </div>
        <div class="card">
          <div class="card-label">Readiness Confidence &amp; Target Launch Window</div>
          <div class="card-stat" style="font-size: 16px; color: #4338ca;">${escapeHtml(readinessLabel)}</div>
          <div class="card-value" style="margin-top: 4px; font-size: 12px; color: #64748b;">
            <strong>Target Launch Window:</strong> ${escapeHtml(timelineLabel)}<br/>
            <strong>Product Track:</strong> ${escapeHtml(trackLabel)}
          </div>
        </div>
      </div>

      <div class="quote-box" style="margin-bottom: 12px;">
        <strong style="color: #312e81; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px;">Executive Product Summary &amp; Value Delivery</strong>
        <p style="font-size: 13px; color: #1e293b; line-height: 1.55;">
          ${escapeHtml(step6Data.executiveProductBriefSummary || step1Data.ahaMomentNarrative || 'Focused Version 1 product blueprint designed around proven customer demand.')}
        </p>
        ${
          step1Data.ahaMomentNarrative
            ? `<div style="margin-top: 8px; font-size: 12px; color: #3730a3; border-top: 1px dashed #cbd5e1; padding-top: 6px;">
                <strong>60-Second Customer "Aha! Moment":</strong> ${escapeHtml(step1Data.ahaMomentNarrative)}
              </div>`
            : ''
        }
      </div>

      ${
        step6Data.keyDeRiskingSignOffNarrative || step5Data.bottleneckAndDeRiskingNarrative
          ? `<div class="card" style="border-left: 4px solid #10b981; background: #f0fdf4;">
              <div class="card-label" style="color: #047857;">De-Risking, Critical Bottleneck &amp; Grant Sign-Off</div>
              <div class="card-value" style="font-size: 12px; color: #14532d; line-height: 1.5;">
                ${escapeHtml(step6Data.keyDeRiskingSignOffNarrative || step5Data.bottleneckAndDeRiskingNarrative)}
              </div>
            </div>`
          : ''
      }
    </div>

    <!-- STEP 1 & 2: PRODUCT VEHICLE, CHANNELS & UNIT ECONOMICS ROLL-UP -->
    <div class="section">
      <div class="section-title">1. Product Vehicle, Own vs. Rent Distribution &amp; Cost Roll-Up</div>
      <div class="grid-3" style="margin-bottom: 12px;">
        <div class="card">
          <div class="card-label">Step 1 • Vehicle &amp; V1 Approach</div>
          <div class="card-val" style="font-size: 13px; font-weight: 700; color: #0f172a;">${escapeHtml(formFactorLabel)}</div>
          <div class="card-value" style="font-size: 11px; color: #64748b; margin-top: 4px;">Approach: ${escapeHtml(v1ApproachLabel)}</div>
        </div>
        <div class="card">
          <div class="card-label">Step 2 • Primary Channel (${step2Data.primaryChannelSharePercent}%)</div>
          <div class="card-val" style="font-size: 13px; font-weight: 700; color: #0f172a;">${escapeHtml(primaryChannelLabel)}</div>
          <div class="card-value" style="font-size: 11px; color: #64748b; margin-top: 4px;">
            Secondary: ${escapeHtml(secondaryChannelLabels.join(', ') || 'None (100% Primary)')}<br/>
            <strong>${step2Data.estimatedBlendedFeePercent}% Blended Fee</strong> (Keep ${netRevenueKeptPercent}% Net)
          </div>
        </div>
        <div class="card">
          <div class="card-label">Steps 4–5 • Cost Roll-Up (Module H Synced)</div>
          <div class="card-val" style="font-size: 13px; font-weight: 700; color: #0f172a;">
            ${escapeHtml(formatPlanCurrency(combinedOneOff, currency))} once-off
          </div>
          <div class="card-value" style="font-size: 11px; color: #64748b; margin-top: 4px;">
            ${escapeHtml(formatPlanCurrency(combinedMonthly, currency))}/mo recurring &bull;
            <strong>${escapeHtml(formatPlanCurrency(combinedUnitCogs, currency))}/unit direct COGS</strong>
          </div>
        </div>
      </div>

      <div class="grid-2" style="margin-bottom: 12px;">
        <div class="card">
          <div class="card-label">V1 Delivery &amp; Customer Onboarding Model</div>
          <div class="card-value" style="font-size: 12px; font-weight: 600; color: #1e293b;">${escapeHtml(deliveryModelLabel)}</div>
          ${
            step1Data.whyThisVehicleFitsCustomer
              ? `<div style="margin-top: 6px; font-size: 11px; color: #475569;"><strong>Why Vehicle Fits Customer:</strong> ${escapeHtml(step1Data.whyThisVehicleFitsCustomer)}</div>`
              : ''
          }
        </div>
        <div class="card">
          <div class="card-label">Channel Margin Strategy</div>
          <div class="card-value" style="font-size: 12px; color: #334155;">
            ${escapeHtml(step2Data.channelWhyItFitsNotes || 'Direct audience ownership protects gross margins before expansion.')}
          </div>
        </div>
      </div>

      ${
        step2Data.rentToOwnBridgeStrategy
          ? `<div class="card card-highlight">
              <div class="card-label">Rent-to-Own Audience Bridge Strategy (Email &amp; Data Ownership)</div>
              <div class="card-value" style="font-size: 12px; color: #1e1b4b; line-height: 1.5;">
                ${escapeHtml(step2Data.rentToOwnBridgeStrategy)}
              </div>
            </div>`
          : ''
      }
    </div>

    <!-- STEP 3: RUTHLESS 3-BUCKET V1 SCOPE FILTER -->
    <div class="section">
      <div class="section-title">2. Ruthless 3-Bucket V1 Scope Filter (Anti-Scope-Creep Engine)</div>
      ${
        step3Data.scopeDisciplineRule
          ? `<div style="font-size: 11px; color: #4338ca; background: #eef2ff; border: 1px solid #c7d2fe; padding: 6px 12px; border-radius: 6px; margin-bottom: 10px;">
              <strong>Active Discipline Rule:</strong> ${escapeHtml(step3Data.scopeDisciplineRule.replace(/_/g, ' '))}${step3Data.otherScopeDisciplineRuleText ? ` (${escapeHtml(step3Data.otherScopeDisciplineRuleText)})` : ''}
            </div>`
          : ''
      }
      <div class="grid-3" style="margin-bottom: 12px;">
        <div class="card" style="border-color: #a7f3d0; background: #f0fdf4;">
          <div class="card-label" style="color: #047857;">🟢 Day-1 V1 Core — Launch Blocker (${day1Items.length})</div>
          <ul style="margin: 6px 0 0 16px; padding: 0; font-size: 12px; color: #14532d;">
            ${
              day1Items.length > 0
                ? day1Items
                    .map(
                      (it) =>
                        `<li style="margin-bottom: 4px;"><strong>${escapeHtml(it.title)}</strong>${it.categoryTag ? ` <span style="font-size: 10px; opacity: 0.8;">[${escapeHtml(it.categoryTag)}]</span>` : ''} <span style="font-size: 10px; color: #059669;">(${escapeHtml(it.effortImpact)} effort)</span>${it.rationaleOrNote ? `<br/><span style="font-size: 11px; color: #334155;">${escapeHtml(it.rationaleOrNote)}</span>` : ''}</li>`
                    )
                    .join('')
                : '<li>No Day-1 core items recorded yet.</li>'
            }
          </ul>
        </div>
        <div class="card" style="border-color: #c7d2fe; background: #eef2ff;">
          <div class="card-label" style="color: #3730a3;">🟡 Version 1.5 — Fast-Follow (${v15Items.length})</div>
          <ul style="margin: 6px 0 0 16px; padding: 0; font-size: 12px; color: #1e1b4b;">
            ${
              v15Items.length > 0
                ? v15Items
                    .map(
                      (it) =>
                        `<li style="margin-bottom: 4px;"><strong>${escapeHtml(it.title)}</strong>${it.categoryTag ? ` <span style="font-size: 10px; opacity: 0.8;">[${escapeHtml(it.categoryTag)}]</span>` : ''} <span style="font-size: 10px; color: #4f46e5;">(${escapeHtml(it.effortImpact)} effort)</span>${it.rationaleOrNote ? `<br/><span style="font-size: 11px; color: #475569;">${escapeHtml(it.rationaleOrNote)}</span>` : ''}</li>`
                    )
                    .join('')
                : '<li>None deferred to V1.5 yet.</li>'
            }
          </ul>
        </div>
        <div class="card" style="border-color: #fecdd3; background: #fff1f2;">
          <div class="card-label" style="color: #be123c;">🔴 Phase 2 / V2 Backlog (${v2Items.length})</div>
          <ul style="margin: 6px 0 0 16px; padding: 0; font-size: 12px; color: #881337;">
            ${
              v2Items.length > 0
                ? v2Items
                    .map(
                      (it) =>
                        `<li style="margin-bottom: 4px;"><del>${escapeHtml(it.title)}</del>${it.categoryTag ? ` <span style="font-size: 10px; opacity: 0.8;">[${escapeHtml(it.categoryTag)}]</span>` : ''}${it.rationaleOrNote ? `<br/><span style="font-size: 11px; color: #9f1239;">${escapeHtml(it.rationaleOrNote)}</span>` : ''}</li>`
                    )
                    .join('')
                : '<li>None placed in V2 backlog yet.</li>'
            }
          </ul>
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-label">What We Explicitly Refuse to Build in V1</div>
          <div class="card-value" style="font-size: 12px; color: #be123c; line-height: 1.5;">
            ${escapeHtml(step3Data.whatWeRefuseToBuildInV1Narrative || 'Guards against scope creep by deferring non-essential features until customer demand is validated.')}
          </div>
        </div>
        <div class="card">
          <div class="card-label">Why This Lean V1 Wins Faster</div>
          <div class="card-value" style="font-size: 12px; color: #047857; line-height: 1.5;">
            ${escapeHtml(step3Data.whyThisLeanV1WinsFasterNarrative || 'Reduces time-to-market, conserves founder capital, and gets real customer feedback in days rather than months.')}
          </div>
        </div>
      </div>
    </div>

    <!-- STEP 4: 3-TIER BUILD-VS-BUY & SECRET SAUCE MATRIX -->
    <div class="section">
      <div class="section-title">3. 3-Tier &ldquo;Build vs. Buy&rdquo; &amp; Core IP (&ldquo;Secret Sauce&rdquo;) Matrix</div>
      ${
        step4Data.coreIpOwnershipRule
          ? `<div style="font-size: 11px; color: #047857; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 6px 12px; border-radius: 6px; margin-bottom: 10px;">
              <strong>Core IP Ownership Rule:</strong> ${escapeHtml(step4Data.coreIpOwnershipRule.replace(/_/g, ' '))}${step4Data.otherCoreIpOwnershipRuleText ? ` (${escapeHtml(step4Data.otherCoreIpOwnershipRuleText)})` : ''}
            </div>`
          : ''
      }
      <div class="grid-3" style="margin-bottom: 12px;">
        <div class="card" style="border-color: #a7f3d0; background: #f0fdf4;">
          <div class="card-label" style="color: #047857;">Tier 1 • Custom Build / Core IP (${inHouseStack.length})</div>
          <div style="font-size: 11px; color: #047857; margin-bottom: 6px;">Your Proprietary Secret Sauce</div>
          <ul style="margin: 0 0 0 16px; padding: 0; font-size: 12px; color: #14532d;">
            ${
              inHouseStack.length > 0
                ? inHouseStack
                    .map(
                      (it) =>
                        `<li style="margin-bottom: 4px;"><strong>${escapeHtml(it.title)}</strong> (${escapeHtml(it.vendorOrToolName || 'In-House')}) &bull; <span style="font-size: 11px;">${escapeHtml(formatPlanCurrency(it.estimatedCostAmount, currency))} ${escapeHtml(it.costModel.replace(/_/g, ' '))}</span>${it.rationaleOrNote ? `<br/><span style="font-size: 11px; color: #334155;">${escapeHtml(it.rationaleOrNote)}</span>` : ''}</li>`
                    )
                    .join('')
                : '<li>No Tier 1 items listed yet.</li>'
            }
          </ul>
        </div>
        <div class="card">
          <div class="card-label">Tier 2 • Buy / Rent Off-the-Shelf (${buyRentStack.length})</div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">Commodity SaaS &amp; APIs</div>
          <ul style="margin: 0 0 0 16px; padding: 0; font-size: 12px; color: #1e293b;">
            ${
              buyRentStack.length > 0
                ? buyRentStack
                    .map(
                      (it) =>
                        `<li style="margin-bottom: 4px;"><strong>${escapeHtml(it.title)}</strong> (${escapeHtml(it.vendorOrToolName || 'Off-the-Shelf')}) &bull; <span style="font-size: 11px;">${escapeHtml(formatPlanCurrency(it.estimatedCostAmount, currency))} ${escapeHtml(it.costModel.replace(/_/g, ' '))}</span>${it.rationaleOrNote ? `<br/><span style="font-size: 11px; color: #475569;">${escapeHtml(it.rationaleOrNote)}</span>` : ''}</li>`
                    )
                    .join('')
                : '<li>No Tier 2 items listed yet.</li>'
            }
          </ul>
        </div>
        <div class="card">
          <div class="card-label">Tier 3 • Configure / Partner (${partnerStack.length})</div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">Specialist Dev / Outsource</div>
          <ul style="margin: 0 0 0 16px; padding: 0; font-size: 12px; color: #1e293b;">
            ${
              partnerStack.length > 0
                ? partnerStack
                    .map(
                      (it) =>
                        `<li style="margin-bottom: 4px;"><strong>${escapeHtml(it.title)}</strong> (${escapeHtml(it.vendorOrToolName || 'Partner')}) &bull; <span style="font-size: 11px;">${escapeHtml(formatPlanCurrency(it.estimatedCostAmount, currency))} ${escapeHtml(it.costModel.replace(/_/g, ' '))}</span>${it.rationaleOrNote ? `<br/><span style="font-size: 11px; color: #475569;">${escapeHtml(it.rationaleOrNote)}</span>` : ''}</li>`
                    )
                    .join('')
                : '<li>No Tier 3 items listed yet.</li>'
            }
          </ul>
        </div>
      </div>

      <div class="grid-2">
        <div class="card card-highlight">
          <div class="card-label">Core IP &amp; Proprietary Moat Narrative</div>
          <div class="card-value" style="font-size: 12px; color: #1e1b4b; line-height: 1.5;">
            ${escapeHtml(step4Data.secretSauceInHouseNarrative || 'Core proprietary algorithms, domain datasets, or custom workflows retained strictly in-house.')}
          </div>
        </div>
        <div class="card">
          <div class="card-label">Why Buy &amp; Partner Accelerates Time-to-Market</div>
          <div class="card-value" style="font-size: 12px; color: #334155; line-height: 1.5;">
            ${escapeHtml(step4Data.whyBuyAndPartnerSavesTimeNarrative || 'Leverages proven APIs and off-the-shelf tools for commodity plumbing to focus 100% of dev resources on core IP.')}
          </div>
        </div>
      </div>
    </div>

    <!-- STEP 5: FLOW STAGES & WORK PACKAGES WP1-WPn -->
    <div class="section">
      <div class="section-title">4. System Flow &amp; Work Package Roadmap (WP1–WP${step5Data.workPackages.length || 4})</div>
      ${
        step5Data.executionCadenceRule
          ? `<div style="font-size: 11px; color: #4338ca; background: #eef2ff; border: 1px solid #c7d2fe; padding: 6px 12px; border-radius: 6px; margin-bottom: 10px;">
              <strong>Cadence Rule:</strong> ${escapeHtml(step5Data.executionCadenceRule.replace(/_/g, ' '))}${step5Data.otherExecutionCadenceRuleText ? ` (${escapeHtml(step5Data.otherExecutionCadenceRuleText)})` : ''}
            </div>`
          : ''
      }

      ${
        step5Data.flowStages.length > 0
          ? `<div style="margin-bottom: 14px;">
              <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569; margin-bottom: 6px;">4-Stage System Flow &amp; Production Architecture</div>
              <div class="grid-2" style="gap: 8px;">
                ${step5Data.flowStages
                  .map(
                    (st, idx) => `
                    <div class="card" style="background: #f8fafc; border-color: #cbd5e1; padding: 10px 12px;">
                      <div style="font-weight: 700; font-size: 12px; color: #312e81;">Stage ${st.stageNumber || idx + 1}: ${escapeHtml(st.stageTitle)}</div>
                      ${st.stageSubtitle ? `<div style="font-size: 11px; color: #64748b;">${escapeHtml(st.stageSubtitle)}</div>` : ''}
                      <div style="margin-top: 4px; font-size: 11px; color: #1e293b;"><strong>Stack/Tools:</strong> ${escapeHtml(st.keyToolsOrMaterials || st.whatHappensHere || '—')}</div>
                      <div style="margin-top: 2px; font-size: 11px; color: #047857;">&rarr; <strong>Output:</strong> ${escapeHtml(st.outputOrHandoff || st.outputOrHandOff || '—')}</div>
                    </div>`
                  )
                  .join('')}
              </div>
            </div>`
          : ''
      }

      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569; margin-bottom: 6px;">Work Package Milestone Schedule (LEO / Innovate UK Aligned)</div>
      <div style="overflow-x: auto; margin-bottom: 12px;">
        <table class="doc-table" style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background: #f1f5f9; text-align: left;">
              <th style="padding: 8px 10px; border: 1px solid #e2e8f0; font-size: 11px; text-transform: uppercase;">WP</th>
              <th style="padding: 8px 10px; border: 1px solid #e2e8f0; font-size: 11px; text-transform: uppercase;">Title &amp; Execution Mode</th>
              <th style="padding: 8px 10px; border: 1px solid #e2e8f0; font-size: 11px; text-transform: uppercase;">Timeline</th>
              <th style="padding: 8px 10px; border: 1px solid #e2e8f0; font-size: 11px; text-transform: uppercase;">Deliverable &amp; Proof Gate</th>
              <th style="padding: 8px 10px; border: 1px solid #e2e8f0; font-size: 11px; text-transform: uppercase;">Budget &amp; Grant Status</th>
            </tr>
          </thead>
          <tbody>
            ${
              step5Data.workPackages.length > 0
                ? step5Data.workPackages
                    .map(
                      (wp) => `
                    <tr>
                      <td style="padding: 8px 10px; border: 1px solid #e2e8f0;"><strong>${escapeHtml(wp.wpCode)}</strong></td>
                      <td style="padding: 8px 10px; border: 1px solid #e2e8f0;">
                        <strong>${escapeHtml(wp.title)}</strong><br/>
                        <span style="font-size: 10px; color: #64748b;">${escapeHtml(wp.executionMode.replace(/_/g, ' '))}</span>
                      </td>
                      <td style="padding: 8px 10px; border: 1px solid #e2e8f0; white-space: nowrap;">${escapeHtml(wp.timelineWindow.replace(/_/g, ' '))}</td>
                      <td style="padding: 8px 10px; border: 1px solid #e2e8f0;">
                        ${escapeHtml(wp.deliverableMilestone || wp.deliverableMilestoneProof || '—')}<br/>
                        <span style="font-size: 11px; color: #047857;"><strong>Proof Gate:</strong> ${escapeHtml(wp.verificationGateOrDeRisking || wp.linkedTaskSummary || '—')}</span>
                      </td>
                      <td style="padding: 8px 10px; border: 1px solid #e2e8f0; white-space: nowrap;">
                        <strong>${wp.costModel === 'SWEAT_EQUITY_ZERO' ? 'Sweat Equity' : escapeHtml(formatPlanCurrency(wp.estimatedCostAmount, currency))}</strong><br/>
                        <span style="font-size: 10px; color: #64748b;">${escapeHtml(wp.costModel.replace(/_/g, ' '))}</span>
                        ${wp.isGrantEligibleRAndDOrPrototype ? `<br/><span style="display:inline-block; margin-top:2px; font-size: 9px; font-weight:700; background:#dcfce7; color:#15803d; border:1px solid #bbf7d0; border-radius:4px; padding:1px 4px;">★ Grant Eligible R&amp;D</span>` : ''}
                      </td>
                    </tr>`
                    )
                    .join('')
                : `<tr><td colspan="5" style="padding: 8px 10px; border: 1px solid #e2e8f0; color: #64748b;">No Work Packages added in Step 5 yet.</td></tr>`
            }
          </tbody>
        </table>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-label">Technical Merit &amp; Innovation Narrative</div>
          <div class="card-value" style="font-size: 12px; color: #334155; line-height: 1.5;">
            ${escapeHtml(step5Data.technicalMeritAndInnovationNarrative || 'Outlines novel technical approaches, software architecture advancements, or proprietary craft processes.')}
          </div>
        </div>
        <div class="card">
          <div class="card-label">Bottleneck &amp; De-Risking Strategy</div>
          <div class="card-value" style="font-size: 12px; color: #334155; line-height: 1.5;">
            ${escapeHtml(step5Data.bottleneckAndDeRiskingNarrative || 'Identifies single points of failure and establishes concrete verification gates before unlocking subsequent capital spend.')}
          </div>
        </div>
      </div>
    </div>

    <!-- STEP 6: BLIND-SPOT AUDIT & FOUNDER MITIGATIONS -->
    <div class="section">
      <div class="section-title">5. Constructive &ldquo;Things to Consider&rdquo; &amp; Founder Mitigations (${step6Data.blindSpots.length})</div>
      <div class="card" style="border-color: #cbd5e1; background: #ffffff;">
        <ul style="margin: 4px 0 0 16px; padding: 0; font-size: 12px; color: #1e293b;">
          ${
            step6Data.blindSpots.length > 0
              ? step6Data.blindSpots
                  .map(
                    (bs) => `
                    <li style="margin-bottom: 8px;">
                      <strong>${escapeHtml(bs.title)}</strong>
                      <span style="display: inline-block; font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 4px; margin-left: 4px; ${
                        bs.isResolved
                          ? 'background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0;'
                          : bs.severity === 'CRITICAL'
                          ? 'background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca;'
                          : 'background: #fef3c7; color: #b45309; border: 1px solid #fde68a;'
                      }">
                        ${bs.isResolved ? '✓ ADDRESSED' : escapeHtml(bs.severity)}
                      </span>
                      <span style="font-size: 11px; color: #64748b; margin-left: 4px;">[${escapeHtml(bs.category.replace(/_/g, ' '))}]</span>
                      <div style="font-size: 11px; color: #475569; margin-top: 2px;">${escapeHtml(bs.whyItMatters)}</div>
                      <div style="font-size: 11px; color: #4338ca; margin-top: 2px;">&bull; <strong>Recommended Action:</strong> ${escapeHtml(bs.recommendedActionOrFix)}</div>
                      ${
                        bs.founderMitigationNote
                          ? `<div style="font-size: 11px; color: #047857; margin-top: 2px; background: #f0fdf4; padding: 4px 6px; border-radius: 4px; border: 1px solid #bbf7d0;">
                              <strong>Founder Plan:</strong> ${escapeHtml(bs.founderMitigationNote)}
                            </div>`
                          : ''
                      }
                    </li>`
                  )
                  .join('')
              : '<li>No blind spots identified yet. Complete Step 6 audit to generate constructive reviews.</li>'
          }
        </ul>
      </div>
    </div>
  `;

  const footerCtaHtml = `<strong>Ready for Module E (Operations, Equipment &amp; Risk Register)?</strong>
    Your Module D Product &amp; Technical Brief is complete. Continue to Module E inside Startup Preflight to map your Day-in-the-Life order flow, schedule LEO/Innovate UK compliant equipment quotes, and construct your 4-category Project Risk Register.`;

  return renderBmuStandaloneHtmlDocument({
    documentTitle: `${planTitle} — Product, Scope & Work Package Brief`,
    eyebrow: whiteLabelEnabled
      ? `${planTitle.toUpperCase()} • PRODUCT &amp; TECHNICAL BLUEPRINT`
      : 'STARTUP PREFLIGHT • MODULE D PRODUCT &amp; TECHNICAL BLUEPRINT',
    planTitle,
    founderName,
    countryName: countryPack.countryName,
    currency,
    industryCategory,
    dateStr,
    scopeLabel: 'Launch Window',
    scopeValue: timelineLabel,
    sectionsHtml,
    footerCtaHtml,
  });
}
