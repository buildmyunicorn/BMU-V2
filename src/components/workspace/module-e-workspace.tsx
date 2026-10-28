'use client';

import React, { useState } from 'react';
import {
  Workflow,
  Sparkles,
  HelpCircle,
  Lightbulb,
  Wand2,
  BookmarkPlus,
  Check,
  Save,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Clock,
  CheckCircle2,
  Info,
  ShieldCheck,
  Plus,
  Trash2,
  AlertTriangle,
  Wrench,
  Package,
  Laptop,
  Hammer,
  Truck,
  Building2,
  FileCheck2,
  Scale,
  Gauge,
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
  getCountryRulePack,
  formatPlanCurrency,
  type SupportedCountryCode,
} from '@/lib/localization';
import { detectRecommendedProductTrack } from '@/components/workspace/module-d-workspace';
import type {
  ActiveStartupPlan,
  ProductTrackType,
  SalesChannelOptionType,
  DeliveryFulfillmentModelType,
  OperationsFulfillmentModeType,
  OrderTurnaroundSlaType,
  OperationalCapacityConstraintType,
  OrderStageOwnerType,
  OrderLifecycleStageItem,
  OperationsBlueprintStep1Data,
  PremisesSetupModeType,
  PremisesComplianceStatusType,
  EquipmentAssetCategoryType,
  EquipmentAcquisitionModeType,
  EquipmentFundingSourceType,
  EquipmentQuoteComplianceStatusType,
  EquipmentAssetItem,
  PremisesAndEquipmentStep2Data,
} from '@/lib/auth/session-store';

export interface ModuleEWorkspaceProps {
  plan: ActiveStartupPlan;
  selectedCountry: SupportedCountryCode;
  isVaultReadonly: boolean;
  onSaveStep1OperationsBlueprint: (
    data: OperationsBlueprintStep1Data,
    progress: number
  ) => Promise<void>;
  onGenerateAiOperationsBlueprint: (params: {
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
  }) => Promise<{
    allowed: boolean;
    reason?: string;
    fulfillmentMode: OperationsFulfillmentModeType;
    turnaroundSla: OrderTurnaroundSlaType;
    capacityConstraint: OperationalCapacityConstraintType;
    orderLifecycleStages: OrderLifecycleStageItem[];
    endToEndFulfillmentNarrative: string;
    scalingAndBottleneckDeRiskingNarrative: string;
    engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
  }>;
  onSaveStep2PremisesEquipment: (
    data: PremisesAndEquipmentStep2Data,
    progress: number
  ) => Promise<void>;
  onGenerateAiPremisesEquipment: (params: {
    selectedTrack: ProductTrackType;
    otherProductTrackText?: string;
    currentPremisesSetupMode?: PremisesSetupModeType | '';
    currentPremisesLocationSummary?: string;
    currentMonthlyPremisesCost?: number;
    currentPremisesComplianceStatus?: PremisesComplianceStatusType | '';
    currentEquipmentItems?: EquipmentAssetItem[];
    mode?: 'POPULATE_ASSETS_AND_NARRATIVES' | 'NARRATIVES_ONLY';
  }) => Promise<{
    allowed: boolean;
    reason?: string;
    premisesSetupMode: PremisesSetupModeType;
    premisesLocationSummary: string;
    monthlyPremisesAndUtilitiesCost: number;
    premisesComplianceStatus: PremisesComplianceStatusType;
    equipmentItems: EquipmentAssetItem[];
    premisesAndLocationJustificationNarrative: string;
    equipmentRoiAndGrantComplianceNarrative: string;
    engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
  }>;
  onParkOpenQuestion: (questionText: string) => Promise<void>;
  onBackToModuleD: () => void;
  whiteLabelEnabled?: boolean;
}

const FULFILLMENT_MODE_OPTIONS: Array<{
  value: OperationsFulfillmentModeType;
  label: string;
  subtitle: string;
  badge: string;
}> = [
  {
    value: 'AUTOMATED_CLOUD_SELF_SERVE',
    label: '100% Automated Cloud / Self-Serve Provisioning',
    subtitle:
      'Instant digital account unlock, webhook provisioning, and automated onboarding with near-zero manual minutes per order.',
    badge: 'SaaS & Digital',
  },
  {
    value: 'IN_HOUSE_WORKSHOP_BATCH',
    label: 'In-House Workshop / Craft / Small-Batch Production',
    subtitle:
      'You make, finish, inspect, and pack units in your own workshop, studio, or commercial kitchen (e.g., woodworking, artisan food, craft).',
    badge: 'Maker & Workshop',
  },
  {
    value: 'CONTRACT_MANUFACTURED_3PL',
    label: 'Contract Manufactured / 3PL / FBA Fulfilled',
    subtitle:
      'External factory produces units to your spec and a 3PL warehouse or Amazon FBA picks, packs, and ships orders.',
    badge: 'Scaled Physical',
  },
  {
    value: 'FOUNDER_LED_CONCIERGE_COHORT',
    label: 'Founder-Led Concierge / Live Cohort / High-Touch',
    subtitle:
      'Hands-on specialist delivery, live cohort sessions, or bespoke B2B project sprints led directly by the founding team.',
    badge: 'High-Touch / Service',
  },
  {
    value: 'HYBRID_AUTOMATED_PLUS_HUMAN',
    label: 'Hybrid: Automated Core + Human / Partner Concierge Step',
    subtitle:
      'Core product is automated (e.g., BMU SaaS or digital portal), paired with a human/partner step like 3-Quote Concierge or group Q&A.',
    badge: 'Hybrid Leverage',
  },
  {
    value: 'OTHER',
    label: 'Other (Custom Operating & Fulfillment Mode)',
    subtitle:
      'A specialized or hybrid operational workflow—describe how you fulfill orders in your own words.',
    badge: 'Custom Mode',
  },
];

const TURNAROUND_SLA_OPTIONS: Array<{
  value: OrderTurnaroundSlaType;
  label: string;
  subtitle: string;
}> = [
  {
    value: 'INSTANT_UNDER_5_MINS',
    label: '⚡ Instant (< 5 Minutes — Automated Digital Unlock)',
    subtitle:
      'Customer pays or redeems a code and accesses the workspace/product immediately.',
  },
  {
    value: 'SAME_OR_NEXT_DAY_24_48H',
    label: '🚀 Same or Next Business Day (24–48 Hours)',
    subtitle:
      'Pre-made stock or fast-turnaround digital/partner requests fulfilled within 1–2 business days.',
  },
  {
    value: 'STANDARD_CRAFT_CYCLE_3_7_DAYS',
    label: '🛠️ Standard Craft / Production Cycle (3–7 Business Days)',
    subtitle:
      'Ideal for personalized/engraved goods (e.g., custom chopping boards), fresh batch production, or tailored setups.',
  },
  {
    value: 'BESPOKE_OR_SPRINT_2_4_WEEKS',
    label: '📐 Bespoke Batch / Custom Client Sprint (2–4 Weeks)',
    subtitle:
      'Custom corporate gifting batches, made-to-order commissions, or fixed-scope B2B engagements.',
  },
  {
    value: 'COHORT_OR_SCHEDULED_WINDOW',
    label: '📅 Scheduled Cohort / Monthly Intake Window',
    subtitle:
      'Customers enrol into a structured start date, seasonal drop, or scheduled onboarding batch.',
  },
  {
    value: 'OTHER',
    label: '✨ Other (Custom Order-to-Delivery Turnaround SLA)',
    subtitle: 'Define your exact customer delivery promise in your own words.',
  },
];

const CAPACITY_CONSTRAINT_OPTIONS: Array<{
  value: OperationalCapacityConstraintType;
  label: string;
  subtitle: string;
}> = [
  {
    value: 'FOUNDER_MANUAL_HOURS',
    label: '⏱️ Founder Hands-On Hours (Maker / Delivery Time per Order)',
    subtitle:
      'Your personal weekly workshop, sanding, packing, or client delivery hours cap how many orders can ship.',
  },
  {
    value: 'EQUIPMENT_OR_CURE_BATCH_LIMIT',
    label: '🪚 Workshop Machinery / Glue-Up / Batch Curing Ceiling',
    subtitle:
      'Physical clamp racks, 24h glue/oil curing times, kiln space, or single-machine throughput limits daily output.',
  },
  {
    value: 'SUPPLIER_OR_PARTNER_TURNAROUND',
    label: '🤝 External Supplier / 3-Quote Partner Turnaround SLA',
    subtitle:
      'Lead times on raw materials (e.g., kiln-dried hardwood) or partner agency quote turnaround (48h SLA).',
  },
  {
    value: 'CLOUD_API_RATE_OR_INFRA_GUARDRAIL',
    label: '🛡️ Cloud / AI API Rate Ceiling & Support Ticket Triage',
    subtitle:
      'Daily AI token/call guardrails (e.g., 500 calls/day cap) or Tier-2 human escalation ticket volume.',
  },
  {
    value: 'PROVIDER_SUPPLY_LIQUIDITY',
    label: '🌐 Vetted Marketplace Provider / Specialist Supply Liquidity',
    subtitle:
      'Having enough vetted local providers, tutors, or sellers in each region to fulfill buyer bookings.',
  },
  {
    value: 'OTHER',
    label: '✨ Other (Custom Operational Bottleneck)',
    subtitle:
      'Describe what breaks first if 100 orders arrive tomorrow morning.',
  },
];

const STAGE_OWNER_OPTIONS: Array<{
  value: OrderStageOwnerType;
  label: string;
}> = [
  { value: 'AUTOMATED_SYSTEM', label: '🤖 Automated System / Cloud' },
  { value: 'FOUNDER_MAKER', label: '🛠️ Founder / Lead Maker' },
  { value: 'COFOUNDER_TEAM', label: '👥 Co-Founder / In-House Team' },
  { value: 'EXTERNAL_SUPPLIER_3PL', label: '🚚 Courier / 3PL / Supplier' },
  { value: 'PARTNER_CONCIERGE', label: '🤝 Partner Network / Concierge' },
  { value: 'OTHER', label: '✨ Other (Custom Owner)' },
];

function buildDefaultStep1DataForPlan(
  plan: ActiveStartupPlan,
  selectedCountry: SupportedCountryCode
): OperationsBlueprintStep1Data {
  const saved = plan.moduleEData?.operationsBlueprint;
  if (saved && saved.orderLifecycleStages && saved.orderLifecycleStages.length > 0) {
    return {
      fulfillmentMode: saved.fulfillmentMode || 'HYBRID_AUTOMATED_PLUS_HUMAN',
      otherFulfillmentModeText: saved.otherFulfillmentModeText || '',
      turnaroundSla: saved.turnaroundSla || 'INSTANT_UNDER_5_MINS',
      otherTurnaroundSlaText: saved.otherTurnaroundSlaText || '',
      capacityConstraint:
        saved.capacityConstraint || 'FOUNDER_MANUAL_HOURS',
      otherCapacityConstraintText: saved.otherCapacityConstraintText || '',
      weeklyOpsHoursAllocated: saved.weeklyOpsHoursAllocated || 25,
      orderLifecycleStages: saved.orderLifecycleStages,
      endToEndFulfillmentNarrative: saved.endToEndFulfillmentNarrative || '',
      scalingAndBottleneckDeRiskingNarrative:
        saved.scalingAndBottleneckDeRiskingNarrative || '',
      lastSavedAt: saved.lastSavedAt,
      aiEngineUsed: saved.aiEngineUsed,
    };
  }

  const track =
    plan.moduleDData?.productVehicle?.productTrack ||
    detectRecommendedProductTrack(plan);

  const combined = [
    plan.title,
    plan.oneLinerSummary,
    plan.brainDumpText,
    plan.conceptCanvas?.proposedSolution,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const isWoodworker =
    /wood|chopping board|cutting board|timber|joinery|carpenter|furniture|craft|artisan/.test(
      combined
    );
  const isIE = selectedCountry === 'IE';
  const courierLabel = isIE
    ? 'An Post Advantage / DPD Ireland Tracked'
    : 'Royal Mail Tracked 48 / DPD UK';

  if (isWoodworker || track === 'PHYSICAL_PRODUCT_ECOM') {
    return {
      fulfillmentMode: 'IN_HOUSE_WORKSHOP_BATCH',
      otherFulfillmentModeText: '',
      turnaroundSla: 'STANDARD_CRAFT_CYCLE_3_7_DAYS',
      otherTurnaroundSlaText: '',
      capacityConstraint: 'EQUIPMENT_OR_CURE_BATCH_LIMIT',
      otherCapacityConstraintText: '',
      weeklyOpsHoursAllocated: 35,
      orderLifecycleStages: [
        {
          id: 'stage-1',
          stageNumber: 1,
          stageTitle: '1. Order Trigger & Kiln-Dried Timber Selection',
          ownerType: 'FOUNDER_MAKER',
          whatHappensStepByStep:
            'Shopify D2C or Craft Market order arrives; select kiln-dried hardwood (Walnut, Ash, Beech at 8%–10% moisture content) and rip-saw strips.',
          toolsEquipmentOrSupplier:
            'Shopify Webhook + Table Saw + Planer-Thicknesser (Kiln-Dried Timber Supplier)',
          activeMinutesPerOrder: 15,
          directVariableCostPerOrder: 18.5,
        },
        {
          id: 'stage-2',
          stageNumber: 2,
          stageTitle: '2. Food-Safe Glue-Up & Parallel Clamp Curing',
          ownerType: 'FOUNDER_MAKER',
          whatHappensStepByStep:
            'Assemble edge/end-grain board pattern with FDA food-safe waterproof glue (Titebond III) in parallel clamp rack (24hr passive cure).',
          toolsEquipmentOrSupplier:
            'Parallel Clamp Rack + Titebond III Food-Safe Waterproof Glue',
          activeMinutesPerOrder: 15,
          directVariableCostPerOrder: 1.8,
        },
        {
          id: 'stage-3',
          stageNumber: 3,
          stageTitle: '3. Drum Sanding, CNC Juice Groove & Laser Engraving',
          ownerType: 'FOUNDER_MAKER',
          whatHappensStepByStep:
            'Flatten board through dual-drum sander, CNC rout juice groove & handles, laser-engrave custom name/logo, and sand to 240-grit.',
          toolsEquipmentOrSupplier:
            'Dual-Drum Sander + CNC Router + Diode Laser + ATEX Dust Extractor',
          activeMinutesPerOrder: 25,
          directVariableCostPerOrder: 2.2,
        },
        {
          id: 'stage-4',
          stageNumber: 4,
          stageTitle: '4. Food-Grade Mineral Oil Bath & Beeswax Buffing',
          ownerType: 'FOUNDER_MAKER',
          whatHappensStepByStep:
            'Soak in USP food-grade mineral oil tank, drain, and hand-buff with local beeswax & carnauba board butter.',
          toolsEquipmentOrSupplier:
            'Stainless Dipping Tank + USP Mineral Oil + Beeswax Board Butter',
          activeMinutesPerOrder: 10,
          directVariableCostPerOrder: 2.5,
        },
        {
          id: 'stage-5',
          stageNumber: 5,
          stageTitle: '5. 5-Point QC Check, Eco-Packaging & Tracked Courier',
          ownerType: 'FOUNDER_MAKER',
          whatHappensStepByStep:
            'Verify flatness & engraving spelling, wrap in honeycomb kraft paper with care card & wax tin, and dispatch via tracked courier.',
          toolsEquipmentOrSupplier: `Branded Kraft Box + ${courierLabel}`,
          activeMinutesPerOrder: 8,
          directVariableCostPerOrder: 9.5,
        },
      ],
      endToEndFulfillmentNarrative: '',
      scalingAndBottleneckDeRiskingNarrative: '',
    };
  }

  // Default SaaS / Digital / Hybrid (Build My Unicorn style)
  return {
    fulfillmentMode: 'HYBRID_AUTOMATED_PLUS_HUMAN',
    otherFulfillmentModeText: '',
    turnaroundSla: 'INSTANT_UNDER_5_MINS',
    otherTurnaroundSlaText: '',
    capacityConstraint: 'CLOUD_API_RATE_OR_INFRA_GUARDRAIL',
    otherCapacityConstraintText: '',
    weeklyOpsHoursAllocated: 25,
    orderLifecycleStages: [
      {
        id: 'stage-1',
        stageNumber: 1,
        stageTitle: '1. Checkout / Voucher Redemption & Account Provisioning',
        ownerType: 'AUTOMATED_SYSTEM',
        whatHappensStepByStep:
          'Founder completes Stripe checkout or redeems pass/cohort code; webhook updates user_entitlements and unlocks Modules A–K in <5 seconds.',
        toolsEquipmentOrSupplier:
          'Stripe Checkout + Better-Auth + PostgreSQL (Drizzle ORM)',
        activeMinutesPerOrder: 0,
        directVariableCostPerOrder: 2.05,
      },
      {
        id: 'stage-2',
        stageNumber: 2,
        stageTitle: '2. Edge Geo-IP Localization & Guided Onboarding',
        ownerType: 'AUTOMATED_SYSTEM',
        whatHappensStepByStep:
          'Next.js Edge Middleware pre-selects IE/GB country rules and currency; founder completes Module A Brain Dump & Concept Canvas.',
        toolsEquipmentOrSupplier:
          'Next.js Edge Middleware + Google Cloud Run + Cloud SQL',
        activeMinutesPerOrder: 0,
        directVariableCostPerOrder: 0.05,
      },
      {
        id: 'stage-3',
        stageNumber: 3,
        stageTitle: '3. AI Co-Founder Synthesis & Hosted Validation Survey',
        ownerType: 'AUTOMATED_SYSTEM',
        whatHappensStepByStep:
          'Founder builds Modules B–K with rate-limited Gemini 2.5 Flash/Pro synthesis and publishes live Mom-Test survey (/v/[slug]).',
        toolsEquipmentOrSupplier:
          'Google GenAI SDK (router.ts 500/day guardrail) + Public Survey Engine',
        activeMinutesPerOrder: 0,
        directVariableCostPerOrder: 0.85,
      },
      {
        id: 'stage-4',
        stageNumber: 4,
        stageTitle: '4. 3-Quote Concierge & Partner Marketplace Routing',
        ownerType: 'PARTNER_CONCIERGE',
        whatHappensStepByStep:
          'When founder clicks "Request 3 LEO-Compliant Quotes", standardized RFP routes to vetted IE/UK partner agencies/suppliers within 48h SLA.',
        toolsEquipmentOrSupplier:
          'BMU 3-Quote Concierge Engine + Vetted IE/UK Partner Network',
        activeMinutesPerOrder: 5,
        directVariableCostPerOrder: 0.0,
      },
      {
        id: 'stage-5',
        stageNumber: 5,
        stageTitle: '5. Grant Pre-Flight Audit, Export & Living Vault Renewal',
        ownerType: 'AUTOMATED_SYSTEM',
        whatHappensStepByStep:
          'Founder exports LEO / Innovate UK / Start Up Loans pack in Module K; Month-6 lifecycle check prompts €9/mo Grant Radar & Living Vault renewal.',
        toolsEquipmentOrSupplier:
          'Module K Grant Compiler + Resend Lifecycle Emails',
        activeMinutesPerOrder: 2,
        directVariableCostPerOrder: 0.05,
      },
    ],
    endToEndFulfillmentNarrative: '',
    scalingAndBottleneckDeRiskingNarrative: '',
  };
}

const PREMISES_SETUP_MODE_OPTIONS: Array<{
  value: PremisesSetupModeType;
  label: string;
  subtitle: string;
  badge: string;
}> = [
  {
    value: 'REMOTE_CLOUD_HOME_OFFICE',
    label: '100% Cloud / Remote Home Office',
    subtitle:
      'Zero commercial rent—team works from home offices with cloud infrastructure (Google Cloud / AWS) in EU-West / UK.',
    badge: 'SaaS & Digital',
  },
  {
    value: 'HOME_GARAGE_GARDEN_WORKSHOP',
    label: 'Insulated Home Garage / Shed / Garden Workshop',
    subtitle:
      'Dedicated domestic garage or garden workshop (e.g., 25m²–40m² timber studio) with low monthly power/heating overhead.',
    badge: 'Artisan & Maker',
  },
  {
    value: 'SHARED_COWORKING_INCUBATOR_HUB',
    label: 'Enterprise Centre / Incubator / Makerspace / Shared Kitchen',
    subtitle:
      'Flexible desk, bench, or commercial kitchen rental inside a local enterprise hub, university incubator, or food hub.',
    badge: 'Low-Commitment Hub',
  },
  {
    value: 'COMMERCIAL_WORKSHOP_INDUSTRIAL_UNIT',
    label: 'Dedicated Light-Industrial Unit / Commercial Workshop',
    subtitle:
      'Leased commercial workshop, food production unit, or light-industrial bay with 3-phase power and courier loading.',
    badge: 'Scaled Production',
  },
  {
    value: 'RETAIL_HIGH_STREET_PREMISES',
    label: 'Customer-Facing Studio / High-Street Premises',
    subtitle:
      'Physical storefront, clinic, or showroom with walk-in customer footfall and commercial rates.',
    badge: 'Retail / Walk-In',
  },
  {
    value: 'OTHER',
    label: 'Other (Custom Premises & Location Setup)',
    subtitle:
      'A hybrid, mobile, or specialized operating footprint—describe your setup in your own words.',
    badge: 'Custom Footprint',
  },
];

const PREMISES_COMPLIANCE_STATUS_OPTIONS: Array<{
  value: PremisesComplianceStatusType;
  label: string;
  subtitle: string;
}> = [
  {
    value: 'NO_PERMIT_REQUIRED_REMOTE',
    label: '✅ Remote / Cloud-Native (No Commercial Planning Required)',
    subtitle:
      'Digital/remote operations with zero physical manufacturing, signage, or customer footfall at home address.',
  },
  {
    value: 'EXEMPT_DOMESTIC_GARAGE_SHED',
    label: '🏡 Domestic Workshop / Garage (No Walk-In Retail, Low Noise/Dust)',
    subtitle:
      'Small-batch home workshop with acoustic insulation, HEPA dust extraction, and courier-only collection (planning check logged).',
  },
  {
    value: 'COMMERCIAL_ZONING_APPROVED',
    label: '🏢 Commercial / Light-Industrial Zoning & Fire Cert Approved',
    subtitle:
      'Operating from an enterprise hub, commercial kitchen, or industrial unit already zoned for production/business use.',
  },
  {
    value: 'PLANNING_OR_HSE_PENDING',
    label: '⏳ Planning Retention / Change-of-Use / HSE Registration Pending',
    subtitle:
      'Application or pre-planning consultation underway with local council, Environmental Health Officer (EHO), or landlord.',
  },
  {
    value: 'OTHER',
    label: '✨ Other (Custom Premises Zoning / Lease Status)',
    subtitle:
      'Describe your specific lease, landlord consent, or local council planning status.',
  },
];

function getEquipmentAssetCategoryOptions(
  selectedCountry: SupportedCountryCode
): Array<{
  value: EquipmentAssetCategoryType;
  label: string;
}> {
  const isIE = selectedCountry === 'IE';
  const isUK = selectedCountry === 'GB';
  return [
    {
      value: 'PRODUCTION_MACHINERY_TOOLS',
      label: '🪚 Production Machinery & CNC / Workshop Tools (Grant-Eligible)',
    },
    {
      value: 'SAFETY_EXTRACTION_FOOD_HYGIENE',
      label: '🛡️ Dust Extraction, Food-Grade Hygiene & Safety Fit-Out',
    },
    {
      value: 'PACKAGING_BENCH_FIXTURES',
      label: '📦 Workbenches, Clamp Racks, Packaging & Fulfilment Fixtures',
    },
    {
      value: 'SPECIALIST_RND_TEST_RIG',
      label: '🔬 Specialist R&D / Prototyping / QA Test Rig',
    },
    {
      value: 'IT_LAPTOP_MOBILE_DEVICE',
      label: isIE
        ? '💻 Laptop / MacBook / Mobile Device (⚠️ IE LEO Grant Ineligible)'
        : isUK
          ? '💻 Laptop / MacBook / Mobile Device (Standard Office IT — Own Funds / Loan)'
          : '💻 Laptop / MacBook / Mobile Device (Standard Office IT)',
    },
    {
      value: 'OTHER',
      label: '✨ Other (Custom Equipment / Asset Category)',
    },
  ];
}

function getEquipmentAcquisitionModeOptions(
  baseCurrency: string
): Array<{
  value: EquipmentAcquisitionModeType;
  label: string;
}> {
  const zeroLabel = formatPlanCurrency(0, baseCurrency);
  return [
    { value: 'BUY_NEW_OUTRIGHT', label: '🆕 Buy New Outright (Grant-Eligible)' },
    {
      value: 'SECOND_HAND_REFURBISHED',
      label: '♻️ Refurbished / Used (Serial # & Independent Valuation Needed)',
    },
    { value: 'LEASE_HIRE_PURCHASE', label: '📅 Lease / Hire Purchase (Monthly)' },
    {
      value: 'ALREADY_OWNED_BYOD',
      label: `✔️ Already Owned by Founder (BYOD / ${zeroLabel} New Cash Outlay)`,
    },
    { value: 'OTHER', label: '✨ Other (Custom Acquisition Method)' },
  ];
}

function getEquipmentFundingSourceOptions(
  selectedCountry: SupportedCountryCode
): Array<{
  value: EquipmentFundingSourceType;
  label: string;
}> {
  const isIE = selectedCountry === 'IE';
  const isUK = selectedCountry === 'GB';
  return [
    {
      value: 'GRANT_50_MATCH',
      label: isIE
        ? '🏛️ 50% IE LEO Capital Grant Co-Funded (Priming / Feasibility)'
        : isUK
          ? '🏛️ UK Innovate UK Capital Usage Depreciation Claim'
          : '🏛️ 50% Capital Grant / Innovation Co-Funded',
    },
    {
      value: 'OWN_FUNDS_100',
      label: isIE
        ? '💶 100% Own Funds / Ring-Fenced (Required for Laptops/Phones under IE LEO)'
        : isUK
          ? '💷 100% Own Funds / Ring-Fenced Equity'
          : '💵 100% Own Funds / Ring-Fenced Equity',
    },
    {
      value: 'STARTUP_LOAN_FINANCE',
      label: isIE
        ? '🏦 Microfinance Ireland / Credit Union / Equipment Lease'
        : isUK
          ? '🏦 British Business Bank Start Up Loan (6% Fixed) / Asset Finance'
          : '🏦 Startup Loan / Equipment Lease Finance',
    },
    {
      value: 'OTHER',
      label: '✨ Other (Custom Funding Split)',
    },
  ];
}

function getEquipmentQuoteComplianceOptions(
  selectedCountry: SupportedCountryCode,
  baseCurrency: string
): Array<{
  value: EquipmentQuoteComplianceStatusType;
  label: string;
}> {
  const isIE = selectedCountry === 'IE';
  const isUK = selectedCountry === 'GB';
  const thresholdLabel = formatPlanCurrency(1000, baseCurrency);
  return [
    {
      value: 'NEEDS_3_QUOTES_CONCIERGE',
      label: isIE
        ? '📨 Requesting 3 Vetted Irish Supplier Quotes (BMU Concierge)'
        : isUK
          ? '📨 Requesting 3 Vetted UK Supplier Quotes (BMU Concierge)'
          : '📨 Requesting 3 Vetted Supplier Quotes (BMU Concierge)',
    },
    {
      value: 'HAVE_3_WRITTEN_QUOTES',
      label: '✅ 3 Independent Written Quotes Attached (Appendix C Ready)',
    },
    {
      value: 'UNDER_1K_SINGLE_QUOTE_OK',
      label: `📄 Item < ${thresholdLabel} (Single Written Quote Sufficient)`,
    },
    {
      value: 'ALREADY_OWNED_EXEMPT',
      label: '✔️ Already Owned by Founder (No New Purchase Quote Needed)',
    },
    {
      value: 'OTHER',
      label: '✨ Other (Custom Procurement / Quote Status)',
    },
  ];
}

function checkIsMobileOrLaptopAsset(
  assetName: string,
  category?: EquipmentAssetCategoryType
): boolean {
  if (category === 'IT_LAPTOP_MOBILE_DEVICE') return true;
  const lower = (assetName || '').toLowerCase();
  return /laptop|macbook|ipad|iphone|smartphone|mobile phone|tablet|thinkpad|surface pro|vehicle|van|car/.test(
    lower
  );
}

function buildDefaultStep2DataForPlan(
  plan: ActiveStartupPlan,
  selectedCountry: SupportedCountryCode
): PremisesAndEquipmentStep2Data {
  const saved = plan.moduleEData?.premisesAndEquipment;
  if (saved && saved.equipmentItems && saved.equipmentItems.length > 0) {
    return {
      premisesSetupMode:
        saved.premisesSetupMode || 'REMOTE_CLOUD_HOME_OFFICE',
      otherPremisesSetupModeText: saved.otherPremisesSetupModeText || '',
      premisesLocationSummary: saved.premisesLocationSummary || '',
      monthlyPremisesAndUtilitiesCost:
        saved.monthlyPremisesAndUtilitiesCost ?? 95,
      premisesComplianceStatus:
        saved.premisesComplianceStatus || 'NO_PERMIT_REQUIRED_REMOTE',
      otherPremisesComplianceStatusText:
        saved.otherPremisesComplianceStatusText || '',
      equipmentItems: saved.equipmentItems,
      premisesAndLocationJustificationNarrative:
        saved.premisesAndLocationJustificationNarrative || '',
      equipmentRoiAndGrantComplianceNarrative:
        saved.equipmentRoiAndGrantComplianceNarrative || '',
      lastSavedAt: saved.lastSavedAt,
      aiEngineUsed: saved.aiEngineUsed,
    };
  }

  const track =
    plan.moduleDData?.productVehicle?.productTrack ||
    detectRecommendedProductTrack(plan);

  const combined = [
    plan.title,
    plan.oneLinerSummary,
    plan.brainDumpText,
    plan.conceptCanvas?.proposedSolution,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const isWoodworker =
    /wood|chopping board|cutting board|timber|joinery|carpenter|furniture|craft|artisan/.test(
      combined
    );
  const isIE = selectedCountry === 'IE';
  const isUK = selectedCountry === 'GB';

  if (isWoodworker || track === 'PHYSICAL_PRODUCT_ECOM') {
    return {
      premisesSetupMode: 'HOME_GARAGE_GARDEN_WORKSHOP',
      otherPremisesSetupModeText: '',
      premisesLocationSummary:
        '32m² Insulated Timber Workshop (Domestic Garage Conversion with 32A 230V Dedicated Breaker, Acoustic Insulation & ATEX Fine-Dust Extraction)',
      monthlyPremisesAndUtilitiesCost: 185,
      premisesComplianceStatus: 'EXEMPT_DOMESTIC_GARAGE_SHED',
      otherPremisesComplianceStatusText: '',
      equipmentItems: [
        {
          id: 'eq-wood-1',
          assetName:
            'Dual-Drum Thickness Sander (Jet JWDS-2244 / Laguna SuperMax)',
          assetCategory: 'PRODUCTION_MACHINERY_TOOLS',
          acquisitionMode: 'BUY_NEW_OUTRIGHT',
          preferredSuppliersOrSpecs: isIE
            ? '3 Quotes: McQuillan Tools (IE), Caulfield Industrial (IE), WH Raitt & Son (IE)'
            : isUK
              ? '3 Quotes: Axminster Tools (UK), Scott+Sargeant (UK), Charnwood Machinery (UK)'
              : '3 Independent Written Machinery Supplier Quotes',
          quantity: 1,
          unitCostExVat: 2400,
          totalCostExVat: 2400,
          fundingSource: 'GRANT_50_MATCH',
          quoteComplianceStatus: 'NEEDS_3_QUOTES_CONCIERGE',
          conciergeQuotesRequested: false,
          usefulLifeMonths: 60,
          projectUsagePercent: 100,
          isMobileOrLaptopIneligibleForLeoGrant: false,
        },
        {
          id: 'eq-wood-2',
          assetName:
            'Desktop CNC Router + 20W Optical Diode Laser Engraver Module',
          assetCategory: 'PRODUCTION_MACHINERY_TOOLS',
          acquisitionMode: 'BUY_NEW_OUTRIGHT',
          preferredSuppliersOrSpecs:
            'Shapeoko 5 Pro / Onefinity Woodworker 4x2ft + JTech 20W Laser Module (3 Written Quotes >= 1,000)',
          quantity: 1,
          unitCostExVat: 3200,
          totalCostExVat: 3200,
          fundingSource: 'GRANT_50_MATCH',
          quoteComplianceStatus: 'NEEDS_3_QUOTES_CONCIERGE',
          conciergeQuotesRequested: false,
          usefulLifeMonths: 48,
          projectUsagePercent: 100,
          isMobileOrLaptopIneligibleForLeoGrant: false,
        },
        {
          id: 'eq-wood-3',
          assetName:
            'HEPA Cyclone Fine-Dust Extractor & Stainless Oil Dipping Tank',
          assetCategory: 'SAFETY_EXTRACTION_FOOD_HYGIENE',
          acquisitionMode: 'BUY_NEW_OUTRIGHT',
          preferredSuppliersOrSpecs:
            'CamVac / Record Power HPLV Sub-0.5 Micron HEPA Extractor + 304 Food-Grade Dipping Tank (< 1k Single Quote)',
          quantity: 1,
          unitCostExVat: 850,
          totalCostExVat: 850,
          fundingSource: 'GRANT_50_MATCH',
          quoteComplianceStatus: 'UNDER_1K_SINGLE_QUOTE_OK',
          conciergeQuotesRequested: false,
          usefulLifeMonths: 60,
          projectUsagePercent: 100,
          isMobileOrLaptopIneligibleForLeoGrant: false,
        },
        {
          id: 'eq-wood-4',
          assetName:
            'Heavy-Duty Parallel Clamp Rack (16 × Bessey K-Body Revo + Wall Rack)',
          assetCategory: 'PACKAGING_BENCH_FIXTURES',
          acquisitionMode: 'BUY_NEW_OUTRIGHT',
          preferredSuppliersOrSpecs:
            '16 × 1000mm Parallel Clamps enabling 12-board simultaneous 24h glue-ups (< 1k Single Quote)',
          quantity: 1,
          unitCostExVat: 640,
          totalCostExVat: 640,
          fundingSource: 'OWN_FUNDS_100',
          quoteComplianceStatus: 'UNDER_1K_SINGLE_QUOTE_OK',
          conciergeQuotesRequested: false,
          usefulLifeMonths: 60,
          projectUsagePercent: 100,
          isMobileOrLaptopIneligibleForLeoGrant: false,
        },
        {
          id: 'eq-wood-5',
          assetName:
            'Founder Laptop (MacBook Air — CAD Design & Shopify Admin)',
          assetCategory: 'IT_LAPTOP_MOBILE_DEVICE',
          acquisitionMode: 'ALREADY_OWNED_BYOD',
          preferredSuppliersOrSpecs: isIE
            ? 'Ring-fenced under 100% Own Funds / BYOD (excluded from IE LEO capital grant claim per Mobile Asset Ban)'
            : 'Ring-fenced under 100% Own Funds / BYOD (0 new cash outlay)',
          quantity: 1,
          unitCostExVat: 1100,
          totalCostExVat: 1100,
          fundingSource: 'OWN_FUNDS_100',
          quoteComplianceStatus: 'ALREADY_OWNED_EXEMPT',
          conciergeQuotesRequested: false,
          usefulLifeMonths: 36,
          projectUsagePercent: 100,
          isMobileOrLaptopIneligibleForLeoGrant: true,
        },
      ],
      premisesAndLocationJustificationNarrative: '',
      equipmentRoiAndGrantComplianceNarrative: '',
    };
  }

  return {
    premisesSetupMode: 'REMOTE_CLOUD_HOME_OFFICE',
    otherPremisesSetupModeText: '',
    premisesLocationSummary: isIE
      ? '100% Cloud-Native & Remote Home Office (Dublin, Ireland) — Hosted on Google Cloud Run & Cloud SQL (EU-West)'
      : isUK
        ? '100% Cloud-Native & Remote Home Office (London, UK) — Hosted on Google Cloud Run & Cloud SQL (UK/Europe)'
        : '100% Cloud-Native & Remote Home Office — Hosted on Managed Cloud Run & Cloud SQL',
    monthlyPremisesAndUtilitiesCost: 95,
    premisesComplianceStatus: 'NO_PERMIT_REQUIRED_REMOTE',
    otherPremisesComplianceStatusText: '',
    equipmentItems: [
      {
        id: 'eq-bmu-1',
        assetName:
          'Founder Development Workstations (2 × MacBook Pro M3 — BYOD / Ring-Fenced)',
        assetCategory: 'IT_LAPTOP_MOBILE_DEVICE',
        acquisitionMode: 'ALREADY_OWNED_BYOD',
        preferredSuppliersOrSpecs: isIE
          ? 'Founder-owned laptops ring-fenced at 100% Own Funds (excluded from IE LEO capital grant claim per Mobile Asset Ban)'
          : 'Founder-owned laptops ring-fenced at 100% Own Funds / BYOD (zero grant CapEx claimed)',
        quantity: 2,
        unitCostExVat: 1800,
        totalCostExVat: 3600,
        fundingSource: 'OWN_FUNDS_100',
        quoteComplianceStatus: 'ALREADY_OWNED_EXEMPT',
        conciergeQuotesRequested: false,
        usefulLifeMonths: 36,
        projectUsagePercent: 100,
        isMobileOrLaptopIneligibleForLeoGrant: true,
      },
      {
        id: 'eq-bmu-2',
        assetName:
          'Cross-Device Mobile QA & iOS Safari Viewport Test Rig (iPhone SE / iPad / Android)',
        assetCategory: 'SPECIALIST_RND_TEST_RIG',
        acquisitionMode: 'BUY_NEW_OUTRIGHT',
        preferredSuppliersOrSpecs:
          'Dedicated physical test bench for verifying 375px mobile survey (/v/[slug]) & zero-zoom input compliance (< 1k Single Quote)',
        quantity: 1,
        unitCostExVat: 920,
        totalCostExVat: 920,
        fundingSource: 'OWN_FUNDS_100',
        quoteComplianceStatus: 'UNDER_1K_SINGLE_QUOTE_OK',
        conciergeQuotesRequested: false,
        usefulLifeMonths: 36,
        projectUsagePercent: 100,
        isMobileOrLaptopIneligibleForLeoGrant: false,
      },
      {
        id: 'eq-bmu-3',
        assetName:
          'Hardware Security Keys (YubiKey 5C NFC Pair) & Acoustic Demo Setup',
        assetCategory: 'PACKAGING_BENCH_FIXTURES',
        acquisitionMode: 'BUY_NEW_OUTRIGHT',
        preferredSuppliersOrSpecs:
          'FIDO2 Hardware MFA for Super-Admin / Cloud SQL production keys + Shure MV7 partner onboarding mic (< 1k Single Quote)',
        quantity: 1,
        unitCostExVat: 340,
        totalCostExVat: 340,
        fundingSource: 'OWN_FUNDS_100',
        quoteComplianceStatus: 'UNDER_1K_SINGLE_QUOTE_OK',
        conciergeQuotesRequested: false,
        usefulLifeMonths: 36,
        projectUsagePercent: 100,
        isMobileOrLaptopIneligibleForLeoGrant: false,
      },
    ],
    premisesAndLocationJustificationNarrative: '',
    equipmentRoiAndGrantComplianceNarrative: '',
  };
}

export function ModuleEWorkspace({
  plan,
  selectedCountry,
  isVaultReadonly,
  onSaveStep1OperationsBlueprint,
  onGenerateAiOperationsBlueprint,
  onSaveStep2PremisesEquipment,
  onGenerateAiPremisesEquipment,
  onParkOpenQuestion,
  onBackToModuleD,
}: ModuleEWorkspaceProps) {
  const countryPack = getCountryRulePack(selectedCountry);
  const inheritedTrack: ProductTrackType =
    plan.moduleDData?.productVehicle?.productTrack ||
    detectRecommendedProductTrack(plan);
  const inheritedOtherTrackText =
    plan.moduleDData?.productVehicle?.otherProductTrackText || '';
  const inheritedPrimaryChannel =
    plan.moduleDData?.channelMatrix?.primaryChannel;
  const inheritedDeliveryModel =
    plan.moduleDData?.channelMatrix?.deliveryFulfillmentModel;

  const [activeTab, setActiveTab] = useState<
    'STEP_1' | 'STEP_2' | 'STEP_3' | 'STEP_4' | 'STEP_5' | 'STEP_6'
  >('STEP_1');

  const [step1Data, setStep1Data] = useState<OperationsBlueprintStep1Data>(() =>
    buildDefaultStep1DataForPlan(plan, selectedCountry)
  );

  const [step2Data, setStep2Data] = useState<PremisesAndEquipmentStep2Data>(() =>
    buildDefaultStep2DataForPlan(plan, selectedCountry)
  );

  const [showWhyAsking, setShowWhyAsking] = useState(false);
  const [showExampleDrawer, setShowExampleDrawer] = useState(false);
  const [examplePersonaTab, setExamplePersonaTab] = useState<
    'BMU_SAAS' | 'WOODWORKER_BOARDS'
  >('WOODWORKER_BOARDS');
  const [showParkInput, setShowParkInput] = useState(false);
  const [parkQuestionInput, setParkQuestionInput] = useState('');
  const [isSavingStep1, setIsSavingStep1] = useState(false);
  const [isGeneratingAiStep1, setIsGeneratingAiStep1] = useState(false);

  const [showWhyAskingStep2, setShowWhyAskingStep2] = useState(false);
  const [showExampleDrawerStep2, setShowExampleDrawerStep2] = useState(false);
  const [showParkInputStep2, setShowParkInputStep2] = useState(false);
  const [parkQuestionInputStep2, setParkQuestionInputStep2] = useState('');
  const [isSavingStep2, setIsSavingStep2] = useState(false);
  const [isGeneratingAiStep2, setIsGeneratingAiStep2] = useState(false);

  const [saveBanner, setSaveBanner] = useState<string | null>(null);

  // Live computed Unit Operations & Weekly Capacity Metrics (Step 1)
  const totalActiveMinutesPerOrder = step1Data.orderLifecycleStages.reduce(
    (sum, st) => sum + (Number(st.activeMinutesPerOrder) || 0),
    0
  );
  const totalDirectVariableCostPerOrder =
    Math.round(
      step1Data.orderLifecycleStages.reduce(
        (sum, st) => sum + (Number(st.directVariableCostPerOrder) || 0),
        0
      ) * 100
    ) / 100;

  const weeklyOpsHours = Math.max(1, step1Data.weeklyOpsHoursAllocated || 25);
  const maxOrdersPerWeekByManualTime =
    totalActiveMinutesPerOrder > 0
      ? Math.floor((weeklyOpsHours * 60) / totalActiveMinutesPerOrder)
      : 1000;
  const maxOrdersPerMonthByManualTime = maxOrdersPerWeekByManualTime * 4;

  // Live computed Premises & Equipment Grant / Capex Metrics (Step 2)
  const totalCapexExVat = step2Data.equipmentItems.reduce(
    (sum, item) => sum + (Number(item.totalCostExVat) || 0),
    0
  );

  const newOutlayCapexExVat = step2Data.equipmentItems
    .filter((item) => item.acquisitionMode !== 'ALREADY_OWNED_BYOD')
    .reduce((sum, item) => sum + (Number(item.totalCostExVat) || 0), 0);

  const grantEligibleCapexTotal = step2Data.equipmentItems
    .filter(
      (item) =>
        item.fundingSource === 'GRANT_50_MATCH' &&
        !checkIsMobileOrLaptopAsset(item.assetName, item.assetCategory) &&
        item.acquisitionMode !== 'ALREADY_OWNED_BYOD'
    )
    .reduce((sum, item) => sum + (Number(item.totalCostExVat) || 0), 0);

  const estimatedLeo50GrantRebate = Math.round(grantEligibleCapexTotal * 0.5);
  const netFounderCashOutlayAfterLeoGrant = Math.max(
    0,
    newOutlayCapexExVat - estimatedLeo50GrantRebate
  );

  const ukInnovateAnnualEligibleDepreciation = step2Data.equipmentItems
    .filter((item) => item.acquisitionMode !== 'ALREADY_OWNED_BYOD')
    .reduce((sum, item) => {
      const life = Math.max(12, Number(item.usefulLifeMonths) || 36);
      const usage = Math.min(100, Math.max(0, Number(item.projectUsagePercent) || 100));
      return (
        sum +
        Math.round(
          (Number(item.totalCostExVat) || 0) * (12 / life) * (usage / 100)
        )
      );
    }, 0);

  const itemsViolatingLeoLaptopBan = step2Data.equipmentItems.filter(
    (item) =>
      checkIsMobileOrLaptopAsset(item.assetName, item.assetCategory) &&
      item.fundingSource === 'GRANT_50_MATCH'
  );

  const itemsOver1kNeeding3Quotes = step2Data.equipmentItems.filter(
    (item) =>
      (Number(item.totalCostExVat) || 0) >= 1000 &&
      item.acquisitionMode !== 'ALREADY_OWNED_BYOD'
  );

  const itemsWithConciergeRequested = step2Data.equipmentItems.filter(
    (item) => item.conciergeQuotesRequested
  );

  function handleLoadPresetPersona(persona: 'BMU_SAAS' | 'WOODWORKER_BOARDS') {
    if (isVaultReadonly) return;
    const isIE = selectedCountry === 'IE';
    const courierLabel = isIE
      ? 'An Post Advantage / DPD Ireland Tracked'
      : 'Royal Mail Tracked 48 / DPD UK';

    if (persona === 'WOODWORKER_BOARDS') {
      const currencySymbol = plan.baseCurrency === 'GBP' ? '£' : '€';
      setStep1Data({
        fulfillmentMode: 'IN_HOUSE_WORKSHOP_BATCH',
        otherFulfillmentModeText: '',
        turnaroundSla: 'STANDARD_CRAFT_CYCLE_3_7_DAYS',
        otherTurnaroundSlaText: '',
        capacityConstraint: 'EQUIPMENT_OR_CURE_BATCH_LIMIT',
        otherCapacityConstraintText: '',
        weeklyOpsHoursAllocated: 35,
        orderLifecycleStages: [
          {
            id: `wood-1-${Date.now()}`,
            stageNumber: 1,
            stageTitle: '1. Order Trigger & Kiln-Dried Timber Selection',
            ownerType: 'FOUNDER_MAKER',
            whatHappensStepByStep:
              'Shopify D2C / Craft Market order arrives; select kiln-dried Irish/FSC hardwoods (Walnut, Ash, Beech at 8%–10% moisture content) and rip-saw into strips.',
            toolsEquipmentOrSupplier:
              'Shopify Order Webhook + Table Saw + Planer-Thicknesser (Strahan Timber / Abbey Woods)',
            activeMinutesPerOrder: 15,
            directVariableCostPerOrder: 18.5,
          },
          {
            id: `wood-2-${Date.now()}`,
            stageNumber: 2,
            stageTitle: '2. Food-Safe Glue-Up & Parallel Clamp Curing',
            ownerType: 'FOUNDER_MAKER',
            whatHappensStepByStep:
              'Edge/End-grain glue-up using Titebond III (FDA food-contact waterproof PVA glue) locked in parallel clamp rack (24hr passive cure window).',
            toolsEquipmentOrSupplier:
              'Parallel Rack Clamps (max 12 boards/24h) + Titebond III Waterproof Glue',
            activeMinutesPerOrder: 15,
            directVariableCostPerOrder: 1.8,
          },
          {
            id: `wood-3-${Date.now()}`,
            stageNumber: 3,
            stageTitle: '3. Drum Sanding, CNC Juice Groove & Laser Engraving',
            ownerType: 'FOUNDER_MAKER',
            whatHappensStepByStep:
              'Flatten board through dual-drum sander, CNC rout juice groove & chamfered handles, laser-engrave customer name/corporate logo, and sand to 240-grit.',
            toolsEquipmentOrSupplier:
              'Dual-Drum Sander + CNC Router + Diode Laser + ATEX Dust Extractor',
            activeMinutesPerOrder: 25,
            directVariableCostPerOrder: 2.2,
          },
          {
            id: `wood-4-${Date.now()}`,
            stageNumber: 4,
            stageTitle: '4. Food-Grade Mineral Oil Bath & Beeswax Buffing',
            ownerType: 'FOUNDER_MAKER',
            whatHappensStepByStep:
              'Soak in USP food-grade mineral oil bath to seal end-grain pores, drain, and buff with Irish beeswax & carnauba board butter.',
            toolsEquipmentOrSupplier:
              'Stainless Dipping Tank + USP Mineral Oil + Irish Beeswax Board Butter',
            activeMinutesPerOrder: 10,
            directVariableCostPerOrder: 2.5,
          },
          {
            id: `wood-5-${Date.now()}`,
            stageNumber: 5,
            stageTitle: '5. 5-Point QC Gate, Eco-Packaging & Tracked Courier',
            ownerType: 'FOUNDER_MAKER',
            whatHappensStepByStep:
              'Check moisture (8%–10%), granite flatness, and engraving spelling; wrap in honeycomb kraft paper with care card & 50ml wax tin; ship tracked.',
            toolsEquipmentOrSupplier: `Branded Kraft Box + ${courierLabel}`,
            activeMinutesPerOrder: 8,
            directVariableCostPerOrder: 9.5,
          },
        ],
        endToEndFulfillmentNarrative: `Each bespoke chopping board follows a standardized 5-stage workshop fulfillment blueprint requiring 73 active maker minutes (1.22 hrs) and ${currencySymbol}34.50 in direct materials, food-safe consumables, and tracked shipping (COGS). Every board is milled from kiln-dried hardwood (8%–10% moisture content), bonded with FDA food-contact waterproof glue, precision-flattened and laser-personalized via CNC, conditioned in a USP mineral oil & beeswax bath, and verified against a 5-point flatness and spelling QC gate before tracked dispatch within 3–5 business days.`,
        scalingAndBottleneckDeRiskingNarrative: `At 73 active minutes per board across 35 workshop hours/week, one-by-one production caps weekly output at 28 boards/week (~112 boards/month). To handle Q4 Christmas gifting peaks (65% of annual volume) and B2B corporate batches without missed courier cutoffs, we pre-mill and batch-cure 250 un-engraved blank boards in Sept/Oct so peak-season orders only require 10 minutes of laser engraving and final oiling, while Step 2 grant-funded CNC and Dual-Drum Sander machinery cuts unit sanding/routing labour by 45%.`,
        aiEngineUsed: 'smart-synthesizer',
      });
      setSaveBanner(
        '🪵 Loaded Artisan Woodworker (Chopping Boards) 5-stage operations blueprint! Click Save Step 1 below to persist.'
      );
      return;
    }

    const currencySymbol = plan.baseCurrency === 'GBP' ? '£' : '€';
    setStep1Data({
      fulfillmentMode: 'HYBRID_AUTOMATED_PLUS_HUMAN',
      otherFulfillmentModeText: '',
      turnaroundSla: 'INSTANT_UNDER_5_MINS',
      otherTurnaroundSlaText: '',
      capacityConstraint: 'CLOUD_API_RATE_OR_INFRA_GUARDRAIL',
      otherCapacityConstraintText: '',
      weeklyOpsHoursAllocated: 25,
      orderLifecycleStages: [
        {
          id: `bmu-1-${Date.now()}`,
          stageNumber: 1,
          stageTitle: '1. Checkout / Voucher Redemption & Account Provisioning',
          ownerType: 'AUTOMATED_SYSTEM',
          whatHappensStepByStep:
            'Founder purchases 6-Month Pass or redeems AppSumo/Cohort code; Stripe webhook updates user_entitlements and unlocks Modules A–K in <5 seconds.',
          toolsEquipmentOrSupplier:
            'Stripe Checkout + Better-Auth + PostgreSQL (Drizzle ORM)',
          activeMinutesPerOrder: 0,
          directVariableCostPerOrder: 2.05,
        },
        {
          id: `bmu-2-${Date.now()}`,
          stageNumber: 2,
          stageTitle: '2. Edge Geo-IP Localization & Guided Onboarding',
          ownerType: 'AUTOMATED_SYSTEM',
          whatHappensStepByStep:
            'Next.js Edge Middleware detects IE/GB region and pre-selects grant rules & currency; founder captures Module A Brain Dump & Concept Canvas.',
          toolsEquipmentOrSupplier:
            'Next.js Edge Middleware + Google Cloud Run + Cloud SQL',
          activeMinutesPerOrder: 0,
          directVariableCostPerOrder: 0.05,
        },
        {
          id: `bmu-3-${Date.now()}`,
          stageNumber: 3,
          stageTitle: '3. AI Co-Founder Synthesis & Hosted Validation Survey',
          ownerType: 'AUTOMATED_SYSTEM',
          whatHappensStepByStep:
            'Founder progresses through Modules B–K using rate-limited Gemini 2.5 Flash/Pro synthesis and hosts live Mom-Test validation surveys (/v/[slug]).',
          toolsEquipmentOrSupplier:
            'Google GenAI SDK (router.ts 500/day ceiling) + Public Survey Engine',
          activeMinutesPerOrder: 0,
          directVariableCostPerOrder: 0.85,
        },
        {
          id: `bmu-4-${Date.now()}`,
          stageNumber: 4,
          stageTitle: '4. 3-Quote Concierge & Partner Marketplace Hand-Off',
          ownerType: 'PARTNER_CONCIERGE',
          whatHappensStepByStep:
            'Founder clicks "Request 3 LEO-Compliant Quotes"; standardized RFP specs route to vetted IE/UK partner agencies & equipment suppliers within 48h.',
          toolsEquipmentOrSupplier:
            'BMU 3-Quote Concierge Engine + Vetted IE/UK Partner Network',
          activeMinutesPerOrder: 5,
          directVariableCostPerOrder: 0.0,
        },
        {
          id: `bmu-5-${Date.now()}`,
          stageNumber: 5,
          stageTitle: '5. Grant Pre-Flight Audit, Export & Living Vault Renewal',
          ownerType: 'AUTOMATED_SYSTEM',
          whatHappensStepByStep:
            'Founder compiles LEO / Innovate UK / Start Up Loans pack in Module K; Month-6 check prompts €9/mo Grant Radar & Living Vault subscription.',
          toolsEquipmentOrSupplier:
            'Module K Grant Compiler + Resend Lifecycle Emails',
          activeMinutesPerOrder: 2,
          directVariableCostPerOrder: 0.05,
        },
      ],
      endToEndFulfillmentNarrative: `Build My Unicorn operates an instant (<60 second) cloud fulfillment pipeline requiring only ${currencySymbol}3.00 in direct variable payment processing and AI token costs (COGS) per pass sold (~97.7% gross margin). Core onboarding, geo-localized grant matching, and 11-module synthesis are 100% automated on Google Cloud Run and PostgreSQL, reserving human operations strictly for 3-Quote Concierge RFP partner matching (7 mins average ops time per founder).`,
      scalingAndBottleneckDeRiskingNarrative: `We scale from 100 to 5,000+ active founders without operational bottlenecks via three mechanisms: (1) a hard 500-call/day platform AI circuit breaker and deterministic smart-synthesizer fallback in router.ts, (2) 4-layer built-in self-serve coaching ('Why Are We Asking This?', industry examples, and 'Ask Unicorn') keeping human support tickets below 5%, and (3) pre-contracted 48-hour quote turnaround SLAs across our vetted IE/UK supplier marketplace.`,
      aiEngineUsed: 'smart-synthesizer',
    });
    setSaveBanner(
      '🦄 Loaded Build My Unicorn (Cloud AI SaaS) 5-stage operations blueprint! Click Save Step 1 below to persist.'
    );
  }

  function handleUpdateStage(
    stageId: string,
    patch: Partial<OrderLifecycleStageItem>
  ) {
    if (isVaultReadonly) return;
    setStep1Data((prev) => ({
      ...prev,
      orderLifecycleStages: prev.orderLifecycleStages.map((st) =>
        st.id === stageId ? { ...st, ...patch } : st
      ),
    }));
  }

  function handleAddStage() {
    if (isVaultReadonly) return;
    setStep1Data((prev) => {
      const nextNum = prev.orderLifecycleStages.length + 1;
      const newStage: OrderLifecycleStageItem = {
        id: `custom-ops-stage-${Date.now()}`,
        stageNumber: nextNum,
        stageTitle: `${nextNum}. Post-Delivery Follow-Up / Reorder Check`,
        ownerType: 'FOUNDER_MAKER',
        whatHappensStepByStep:
          'Check in with customer to confirm satisfaction, capture testimonial/photo proof, and invite repeat order or referral.',
        toolsEquipmentOrSupplier: 'Email / WhatsApp / CRM Check-In',
        activeMinutesPerOrder: 5,
        directVariableCostPerOrder: 0,
        isCustom: true,
      };
      return {
        ...prev,
        orderLifecycleStages: [...prev.orderLifecycleStages, newStage],
      };
    });
  }

  function handleRemoveStage(stageId: string) {
    if (isVaultReadonly) return;
    setStep1Data((prev) => {
      if (prev.orderLifecycleStages.length <= 2) return prev;
      const filtered = prev.orderLifecycleStages
        .filter((s) => s.id !== stageId)
        .map((s, idx) => ({
          ...s,
          stageNumber: idx + 1,
        }));
      return {
        ...prev,
        orderLifecycleStages: filtered,
      };
    });
  }

  async function handleRunAiStep1(
    mode: 'POPULATE_STAGES_AND_NARRATIVES' | 'NARRATIVES_ONLY'
  ) {
    if (isVaultReadonly) return;
    setIsGeneratingAiStep1(true);
    setSaveBanner(null);
    try {
      const res = await onGenerateAiOperationsBlueprint({
        selectedTrack: inheritedTrack,
        otherProductTrackText: inheritedOtherTrackText,
        primaryChannel: inheritedPrimaryChannel,
        deliveryFulfillmentModel: inheritedDeliveryModel,
        weeklyOpsHoursAllocated: step1Data.weeklyOpsHoursAllocated,
        currentFulfillmentMode: step1Data.fulfillmentMode,
        currentTurnaroundSla: step1Data.turnaroundSla,
        currentCapacityConstraint: step1Data.capacityConstraint,
        currentStages: step1Data.orderLifecycleStages,
        mode,
      });

      if (!res.allowed) return;

      const nextData: OperationsBlueprintStep1Data = {
        ...step1Data,
        fulfillmentMode: step1Data.fulfillmentMode || res.fulfillmentMode,
        turnaroundSla: step1Data.turnaroundSla || res.turnaroundSla,
        capacityConstraint:
          step1Data.capacityConstraint || res.capacityConstraint,
        orderLifecycleStages:
          mode === 'NARRATIVES_ONLY' && step1Data.orderLifecycleStages.length > 0
            ? step1Data.orderLifecycleStages
            : res.orderLifecycleStages,
        endToEndFulfillmentNarrative: res.endToEndFulfillmentNarrative,
        scalingAndBottleneckDeRiskingNarrative:
          res.scalingAndBottleneckDeRiskingNarrative,
        aiEngineUsed: res.engineMode,
        lastSavedAt: new Date().toISOString(),
      };

      setStep1Data(nextData);
      await onSaveStep1OperationsBlueprint(nextData, 20);
      setSaveBanner(
        mode === 'NARRATIVES_ONLY'
          ? '✨ Synthesized your End-to-End Fulfillment & Scaling Narratives from your stages and saved Step 1!'
          : '✨ Generated your 5-stage Order Lifecycle Blueprint & Fulfillment Narratives and saved Step 1!'
      );
    } finally {
      setIsGeneratingAiStep1(false);
    }
  }

  async function handleSaveStep1() {
    if (isVaultReadonly) return;
    setIsSavingStep1(true);
    setSaveBanner(null);
    try {
      const nowIso = new Date().toISOString();
      const nextData: OperationsBlueprintStep1Data = {
        ...step1Data,
        lastSavedAt: nowIso,
      };
      setStep1Data(nextData);
      const isComplete =
        Boolean(nextData.fulfillmentMode) &&
        Boolean(nextData.turnaroundSla) &&
        Boolean(nextData.capacityConstraint) &&
        nextData.orderLifecycleStages.length >= 3 &&
        nextData.endToEndFulfillmentNarrative.trim().length > 10;
      await onSaveStep1OperationsBlueprint(nextData, isComplete ? 20 : 12);
      setSaveBanner(
        '✅ Saved Module E Step 1 ("A Day in the Life of an Order" & Unit Operations Blueprint)!'
      );
    } finally {
      setIsSavingStep1(false);
    }
  }

  function handleLoadStep2PresetPersona(
    persona: 'BMU_SAAS' | 'WOODWORKER_BOARDS'
  ) {
    if (isVaultReadonly) return;
    const isIE = selectedCountry === 'IE';
    const isUK = selectedCountry === 'GB';
    const currencySymbol = plan.baseCurrency === 'GBP' ? '£' : '€';

    if (persona === 'WOODWORKER_BOARDS') {
      setStep2Data({
        premisesSetupMode: 'HOME_GARAGE_GARDEN_WORKSHOP',
        otherPremisesSetupModeText: '',
        premisesLocationSummary:
          '32m² Insulated Timber Workshop (Domestic Garage Conversion with 32A 230V Dedicated Breaker, Acoustic Insulation & ATEX Fine-Dust Extraction)',
        monthlyPremisesAndUtilitiesCost: 185,
        premisesComplianceStatus: 'EXEMPT_DOMESTIC_GARAGE_SHED',
        otherPremisesComplianceStatusText: '',
        equipmentItems: [
          {
            id: `eq-wood-1-${Date.now()}`,
            assetName:
              'Dual-Drum Thickness Sander (Jet JWDS-2244 / Laguna SuperMax)',
            assetCategory: 'PRODUCTION_MACHINERY_TOOLS',
            acquisitionMode: 'BUY_NEW_OUTRIGHT',
            preferredSuppliersOrSpecs: isIE
              ? '3 Quotes: McQuillan Tools (IE), Caulfield Industrial (IE), WH Raitt & Son (IE)'
              : isUK
                ? '3 Quotes: Axminster Tools (UK), Scott+Sargeant (UK), Charnwood Machinery (UK)'
                : '3 Independent Written Machinery Supplier Quotes',
            quantity: 1,
            unitCostExVat: 2400,
            totalCostExVat: 2400,
            fundingSource: 'GRANT_50_MATCH',
            quoteComplianceStatus: 'NEEDS_3_QUOTES_CONCIERGE',
            conciergeQuotesRequested: true,
            usefulLifeMonths: 60,
            projectUsagePercent: 100,
            isMobileOrLaptopIneligibleForLeoGrant: false,
          },
          {
            id: `eq-wood-2-${Date.now()}`,
            assetName:
              'Desktop CNC Router + 20W Optical Diode Laser Engraver Module',
            assetCategory: 'PRODUCTION_MACHINERY_TOOLS',
            acquisitionMode: 'BUY_NEW_OUTRIGHT',
            preferredSuppliersOrSpecs:
              'Shapeoko 5 Pro / Onefinity Woodworker 4x2ft + JTech 20W Laser Module (3 Written Quotes >= 1,000)',
            quantity: 1,
            unitCostExVat: 3200,
            totalCostExVat: 3200,
            fundingSource: 'GRANT_50_MATCH',
            quoteComplianceStatus: 'NEEDS_3_QUOTES_CONCIERGE',
            conciergeQuotesRequested: true,
            usefulLifeMonths: 48,
            projectUsagePercent: 100,
            isMobileOrLaptopIneligibleForLeoGrant: false,
          },
          {
            id: `eq-wood-3-${Date.now()}`,
            assetName:
              'HEPA Cyclone Fine-Dust Extractor & Stainless Oil Dipping Tank',
            assetCategory: 'SAFETY_EXTRACTION_FOOD_HYGIENE',
            acquisitionMode: 'BUY_NEW_OUTRIGHT',
            preferredSuppliersOrSpecs:
              'CamVac / Record Power HPLV Sub-0.5 Micron HEPA Extractor + 304 Food-Grade Dipping Tank (< 1k Single Quote)',
            quantity: 1,
            unitCostExVat: 850,
            totalCostExVat: 850,
            fundingSource: 'GRANT_50_MATCH',
            quoteComplianceStatus: 'UNDER_1K_SINGLE_QUOTE_OK',
            conciergeQuotesRequested: false,
            usefulLifeMonths: 60,
            projectUsagePercent: 100,
            isMobileOrLaptopIneligibleForLeoGrant: false,
          },
          {
            id: `eq-wood-4-${Date.now()}`,
            assetName:
              'Heavy-Duty Parallel Clamp Rack (16 × Bessey K-Body Revo + Wall Rack)',
            assetCategory: 'PACKAGING_BENCH_FIXTURES',
            acquisitionMode: 'BUY_NEW_OUTRIGHT',
            preferredSuppliersOrSpecs:
              '16 × 1000mm Parallel Clamps enabling 12-board simultaneous 24h glue-ups (< 1k Single Quote)',
            quantity: 1,
            unitCostExVat: 640,
            totalCostExVat: 640,
            fundingSource: 'OWN_FUNDS_100',
            quoteComplianceStatus: 'UNDER_1K_SINGLE_QUOTE_OK',
            conciergeQuotesRequested: false,
            usefulLifeMonths: 60,
            projectUsagePercent: 100,
            isMobileOrLaptopIneligibleForLeoGrant: false,
          },
          {
            id: `eq-wood-5-${Date.now()}`,
            assetName:
              'Founder Laptop (MacBook Air — CAD Design & Shopify Admin)',
            assetCategory: 'IT_LAPTOP_MOBILE_DEVICE',
            acquisitionMode: 'ALREADY_OWNED_BYOD',
            preferredSuppliersOrSpecs: isIE
              ? 'Ring-fenced under 100% Own Funds / BYOD (excluded from IE LEO capital grant claim per Mobile Asset Ban)'
              : 'Ring-fenced under 100% Own Funds / BYOD (0 new cash outlay)',
            quantity: 1,
            unitCostExVat: 1100,
            totalCostExVat: 1100,
            fundingSource: 'OWN_FUNDS_100',
            quoteComplianceStatus: 'ALREADY_OWNED_EXEMPT',
            conciergeQuotesRequested: false,
            usefulLifeMonths: 36,
            projectUsagePercent: 100,
            isMobileOrLaptopIneligibleForLeoGrant: true,
          },
        ],
        premisesAndLocationJustificationNarrative: `We operate from a dedicated 32m² insulated domestic garage workshop fitted with a 32A 230V industrial circuit, acoustic wall insulation, and sub-0.5 micron HEPA fine-dust extraction at ${currencySymbol}185/month in utilities. Operating from our converted workshop eliminates ${currencySymbol}1,200+/month in commercial industrial unit lease commitments during Year 1 while maintaining zero retail walk-in traffic and full compliance with domestic workshop planning exemptions.`,
        equipmentRoiAndGrantComplianceNarrative: isIE
          ? `Our ${currencySymbol}7,090 new workshop capital schedule (${currencySymbol}8,190 including the founder's BYOD laptop) targets our #1 production bottleneck: manual board flattening and juice-groove routing. Commissioning the Dual-Drum Sander (${currencySymbol}2,400) and Desktop CNC + Laser Engraver (${currencySymbol}3,200) reduces active maker labour per board by 45% (from 73 mins to 40 mins) and expands weekly capacity from 28 to 52 boards/week. Both items >= ${currencySymbol}1,000 are backed by 3 independent written Irish supplier quotes for Appendix C (${currencySymbol}6,450 grant-eligible machinery = ${currencySymbol}3,225 IE LEO 50% grant match), while the ${currencySymbol}1,100 Founder Laptop is strictly ring-fenced under 100% Own Funds in compliance with the IE LEO Mobile Asset Ban.`
          : isUK
            ? `Our ${currencySymbol}7,090 new workshop capital schedule (${currencySymbol}8,190 including the founder's BYOD laptop) targets our #1 production bottleneck: manual board flattening and juice-groove routing. Commissioning the Dual-Drum Sander (${currencySymbol}2,400) and Desktop CNC + Laser Engraver (${currencySymbol}3,200) reduces active maker labour per board by 45% (from 73 mins to 40 mins) and expands weekly capacity from 28 to 52 boards/week. Both items >= ${currencySymbol}1,000 are backed by 3 independent written UK supplier quotes for Appendix C (${currencySymbol}1,442/yr eligible UK Innovate UK 12-month capital usage depreciation & British Business Bank Start Up Loan ready), while the ${currencySymbol}1,100 Founder Laptop is ring-fenced under 100% Own Funds / BYOD.`
            : `Our ${currencySymbol}7,090 new workshop capital schedule (${currencySymbol}8,190 including the founder's BYOD laptop) targets our #1 production bottleneck: manual board flattening and juice-groove routing. Commissioning the Dual-Drum Sander (${currencySymbol}2,400) and Desktop CNC + Laser Engraver (${currencySymbol}3,200) reduces active maker labour per board by 45% (from 73 mins to 40 mins) and expands weekly capacity from 28 to 52 boards/week. Both items >= ${currencySymbol}1,000 are backed by 3 independent written supplier quotes for Appendix C, while the ${currencySymbol}1,100 Founder Laptop is ring-fenced under 100% Own Funds / BYOD.`,
        aiEngineUsed: 'smart-synthesizer',
      });
      setSaveBanner(
        '🪵 Loaded Artisan Woodworker (Chopping Boards) Premises & Grant-Ready Equipment Schedule! Click Save Step 2 below to persist.'
      );
      return;
    }

    setStep2Data({
      premisesSetupMode: 'REMOTE_CLOUD_HOME_OFFICE',
      otherPremisesSetupModeText: '',
      premisesLocationSummary: isIE
        ? '100% Cloud-Native & Remote Home Office (Dublin, Ireland) — Hosted on Google Cloud Run & Cloud SQL (EU-West)'
        : isUK
          ? '100% Cloud-Native & Remote Home Office (London, UK) — Hosted on Google Cloud Run & Cloud SQL (UK/Europe)'
          : '100% Cloud-Native & Remote Home Office — Hosted on Managed Cloud Run & Cloud SQL',
      monthlyPremisesAndUtilitiesCost: 95,
      premisesComplianceStatus: 'NO_PERMIT_REQUIRED_REMOTE',
      otherPremisesComplianceStatusText: '',
      equipmentItems: [
        {
          id: `eq-bmu-1-${Date.now()}`,
          assetName:
            'Founder Development Workstations (2 × MacBook Pro M3 — BYOD / Ring-Fenced)',
          assetCategory: 'IT_LAPTOP_MOBILE_DEVICE',
          acquisitionMode: 'ALREADY_OWNED_BYOD',
          preferredSuppliersOrSpecs: isIE
            ? 'Founder-owned laptops ring-fenced at 100% Own Funds (excluded from IE LEO capital grant claim per Mobile Asset Ban)'
            : 'Founder-owned laptops ring-fenced at 100% Own Funds / BYOD (zero grant CapEx claimed)',
          quantity: 2,
          unitCostExVat: 1800,
          totalCostExVat: 3600,
          fundingSource: 'OWN_FUNDS_100',
          quoteComplianceStatus: 'ALREADY_OWNED_EXEMPT',
          conciergeQuotesRequested: false,
          usefulLifeMonths: 36,
          projectUsagePercent: 100,
          isMobileOrLaptopIneligibleForLeoGrant: true,
        },
        {
          id: `eq-bmu-2-${Date.now()}`,
          assetName:
            'Cross-Device Mobile QA & iOS Safari Viewport Test Rig (iPhone SE / iPad / Android)',
          assetCategory: 'SPECIALIST_RND_TEST_RIG',
          acquisitionMode: 'BUY_NEW_OUTRIGHT',
          preferredSuppliersOrSpecs:
            'Dedicated physical test bench for verifying 375px mobile survey (/v/[slug]) & zero-zoom input compliance (< 1k Single Quote)',
          quantity: 1,
          unitCostExVat: 920,
          totalCostExVat: 920,
          fundingSource: 'OWN_FUNDS_100',
          quoteComplianceStatus: 'UNDER_1K_SINGLE_QUOTE_OK',
          conciergeQuotesRequested: false,
          usefulLifeMonths: 36,
          projectUsagePercent: 100,
          isMobileOrLaptopIneligibleForLeoGrant: false,
        },
        {
          id: `eq-bmu-3-${Date.now()}`,
          assetName:
            'Hardware Security Keys (YubiKey 5C NFC Pair) & Acoustic Demo Setup',
          assetCategory: 'PACKAGING_BENCH_FIXTURES',
          acquisitionMode: 'BUY_NEW_OUTRIGHT',
          preferredSuppliersOrSpecs:
            'FIDO2 Hardware MFA for Super-Admin / Cloud SQL production keys + Shure MV7 partner onboarding mic (< 1k Single Quote)',
          quantity: 1,
          unitCostExVat: 340,
          totalCostExVat: 340,
          fundingSource: 'OWN_FUNDS_100',
          quoteComplianceStatus: 'UNDER_1K_SINGLE_QUOTE_OK',
          conciergeQuotesRequested: false,
          usefulLifeMonths: 36,
          projectUsagePercent: 100,
          isMobileOrLaptopIneligibleForLeoGrant: false,
        },
      ],
      premisesAndLocationJustificationNarrative: isIE
        ? `Build My Unicorn operates a 100% cloud-native, remote-first architecture from Dublin with ${currencySymbol}95/month in utility and cloud-staging overhead. By avoiding fixed commercial office leases during Year 1, 100% of working capital is directed into product engineering, vetted Irish partner onboarding, and founder customer acquisition.`
        : isUK
          ? `Build My Unicorn operates a 100% cloud-native, remote-first architecture from London with ${currencySymbol}95/month in utility and cloud-staging overhead. By avoiding fixed commercial office leases during Year 1, 100% of working capital is directed into product engineering, vetted UK partner onboarding, and founder customer acquisition.`
          : `Build My Unicorn operates a 100% cloud-native, remote-first architecture with ${currencySymbol}95/month in utility and cloud-staging overhead, avoiding fixed commercial office lease liabilities during Year 1.`,
      equipmentRoiAndGrantComplianceNarrative: isIE
        ? `Our ${currencySymbol}4,860 equipment schedule (${currencySymbol}1,260 in new cash outlay) is 100% self-funded and compliant with IE LEO capital rules. Both founder MacBook Pro development workstations (${currencySymbol}3,600 BYOD) are explicitly ring-fenced under 100% Own Funds so zero general-purpose laptops are claimed against IE LEO capital grants, while our ${currencySymbol}920 cross-device mobile QA rig and ${currencySymbol}340 FIDO2 hardware security keys fall below the ${currencySymbol}1,000 3-quote threshold.`
        : isUK
          ? `Our ${currencySymbol}4,860 equipment schedule (${currencySymbol}1,260 in new cash outlay) is 100% self-funded and compliant with UK Innovate UK and British Business Bank Start Up Loan capital rules. Both founder MacBook Pro development workstations (${currencySymbol}3,600 BYOD) are ring-fenced under 100% Own Funds with zero grant claim, while our ${currencySymbol}920 cross-device mobile QA rig and ${currencySymbol}340 FIDO2 hardware security keys fall below the ${currencySymbol}1,000 3-quote threshold.`
          : `Our ${currencySymbol}4,860 equipment schedule (${currencySymbol}1,260 in new cash outlay) is 100% self-funded under 100% Own Funds, with both founder development workstations contributed as BYOD equity assets.`,
      aiEngineUsed: 'smart-synthesizer',
    });
    setSaveBanner(
      '🦄 Loaded Build My Unicorn (Cloud AI SaaS) Premises & Ring-Fenced Equipment Schedule! Click Save Step 2 below to persist.'
    );
  }

  function handleUpdateEquipmentItem(
    itemId: string,
    patch: Partial<EquipmentAssetItem>
  ) {
    if (isVaultReadonly) return;
    setStep2Data((prev) => ({
      ...prev,
      equipmentItems: prev.equipmentItems.map((item) => {
        if (item.id !== itemId) return item;
        const merged = { ...item, ...patch };
        const qty = Math.max(1, Number(merged.quantity) || 1);
        const unit = Math.max(0, Number(merged.unitCostExVat) || 0);
        const totalCostExVat =
          patch.totalCostExVat !== undefined
            ? Math.max(0, Number(patch.totalCostExVat) || 0)
            : Math.round(qty * unit * 100) / 100;
        const isMobileFlag = checkIsMobileOrLaptopAsset(
          merged.assetName,
          merged.assetCategory
        );
        return {
          ...merged,
          quantity: qty,
          unitCostExVat: unit,
          totalCostExVat,
          isMobileOrLaptopIneligibleForLeoGrant: isMobileFlag,
        };
      }),
    }));
  }

  function handleAddEquipmentItem() {
    if (isVaultReadonly) return;
    setStep2Data((prev) => {
      const newItem: EquipmentAssetItem = {
        id: `eq-custom-${Date.now()}`,
        assetName: 'New Production Tool / Workshop Equipment Item',
        assetCategory: 'PRODUCTION_MACHINERY_TOOLS',
        acquisitionMode: 'BUY_NEW_OUTRIGHT',
        preferredSuppliersOrSpecs:
          selectedCountry === 'IE'
            ? 'Specify model & 3 independent Irish suppliers if >= €1,000'
            : selectedCountry === 'GB'
              ? 'Specify model & 3 independent UK suppliers if >= £1,000'
              : 'Specify model & 3 independent suppliers if >= 1,000',
        quantity: 1,
        unitCostExVat: 1200,
        totalCostExVat: 1200,
        fundingSource: 'GRANT_50_MATCH',
        quoteComplianceStatus: 'NEEDS_3_QUOTES_CONCIERGE',
        conciergeQuotesRequested: false,
        usefulLifeMonths: 48,
        projectUsagePercent: 100,
        isMobileOrLaptopIneligibleForLeoGrant: false,
        isCustom: true,
      };
      return {
        ...prev,
        equipmentItems: [...prev.equipmentItems, newItem],
      };
    });
  }

  function handleRemoveEquipmentItem(itemId: string) {
    if (isVaultReadonly) return;
    setStep2Data((prev) => {
      if (prev.equipmentItems.length <= 1) return prev;
      return {
        ...prev,
        equipmentItems: prev.equipmentItems.filter((i) => i.id !== itemId),
      };
    });
  }

  function handleRingFenceMobileAssetsForLeo() {
    if (isVaultReadonly) return;
    setStep2Data((prev) => ({
      ...prev,
      equipmentItems: prev.equipmentItems.map((item) => {
        if (checkIsMobileOrLaptopAsset(item.assetName, item.assetCategory)) {
          return {
            ...item,
            fundingSource: 'OWN_FUNDS_100',
            isMobileOrLaptopIneligibleForLeoGrant: true,
          };
        }
        return item;
      }),
    }));
    setSaveBanner(
      selectedCountry === 'IE'
        ? '🛡️ Ring-fenced all Laptop / Mobile / Vehicle assets under 100% Own Funds so your IE LEO grant claim is 100% compliant!'
        : '🛡️ Ring-fenced all Laptop / Mobile / Vehicle assets under 100% Own Funds!'
    );
  }

  function handleRequest3QuotesConciergeForItem(itemId: string) {
    if (isVaultReadonly) return;
    setStep2Data((prev) => ({
      ...prev,
      equipmentItems: prev.equipmentItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              conciergeQuotesRequested: true,
              quoteComplianceStatus: 'NEEDS_3_QUOTES_CONCIERGE',
            }
          : item
      ),
    }));
    const supplierRegion =
      selectedCountry === 'IE'
        ? 'Irish'
        : selectedCountry === 'GB'
          ? 'UK'
          : 'partner';
    setSaveBanner(
      `📨 Queued 3-Quote Concierge RFP (?subid=${plan.id}_founder) for vetted ${supplierRegion} equipment suppliers! Quotes auto-attach to Module K Appendix C.`
    );
  }

  async function handleRunAiStep2(
    mode: 'POPULATE_ASSETS_AND_NARRATIVES' | 'NARRATIVES_ONLY'
  ) {
    if (isVaultReadonly) return;
    setIsGeneratingAiStep2(true);
    setSaveBanner(null);
    try {
      const res = await onGenerateAiPremisesEquipment({
        selectedTrack: inheritedTrack,
        otherProductTrackText: inheritedOtherTrackText,
        currentPremisesSetupMode: step2Data.premisesSetupMode,
        currentPremisesLocationSummary: step2Data.premisesLocationSummary,
        currentMonthlyPremisesCost: step2Data.monthlyPremisesAndUtilitiesCost,
        currentPremisesComplianceStatus: step2Data.premisesComplianceStatus,
        currentEquipmentItems: step2Data.equipmentItems,
        mode,
      });

      if (!res.allowed) return;

      const nextData: PremisesAndEquipmentStep2Data = {
        ...step2Data,
        premisesSetupMode:
          step2Data.premisesSetupMode || res.premisesSetupMode,
        premisesLocationSummary:
          step2Data.premisesLocationSummary.trim() ||
          res.premisesLocationSummary,
        monthlyPremisesAndUtilitiesCost:
          step2Data.monthlyPremisesAndUtilitiesCost ??
          res.monthlyPremisesAndUtilitiesCost,
        premisesComplianceStatus:
          step2Data.premisesComplianceStatus || res.premisesComplianceStatus,
        equipmentItems:
          mode === 'NARRATIVES_ONLY' && step2Data.equipmentItems.length > 0
            ? step2Data.equipmentItems
            : res.equipmentItems,
        premisesAndLocationJustificationNarrative:
          res.premisesAndLocationJustificationNarrative,
        equipmentRoiAndGrantComplianceNarrative:
          res.equipmentRoiAndGrantComplianceNarrative,
        aiEngineUsed: res.engineMode,
        lastSavedAt: new Date().toISOString(),
      };

      setStep2Data(nextData);
      await onSaveStep2PremisesEquipment(nextData, 45);
      setSaveBanner(
        mode === 'NARRATIVES_ONLY'
          ? '✨ Synthesized your Premises Justification & Grant-Compliant Equipment ROI Narratives and saved Step 2!'
          : '✨ Generated your Grant-Ready Premises & Equipment Schedule + Narratives and saved Step 2!'
      );
    } finally {
      setIsGeneratingAiStep2(false);
    }
  }

  async function handleSaveStep2() {
    if (isVaultReadonly) return;
    setIsSavingStep2(true);
    setSaveBanner(null);
    try {
      const nowIso = new Date().toISOString();
      const nextData: PremisesAndEquipmentStep2Data = {
        ...step2Data,
        lastSavedAt: nowIso,
      };
      setStep2Data(nextData);
      const isComplete =
        Boolean(nextData.premisesSetupMode) &&
        Boolean(nextData.premisesComplianceStatus) &&
        nextData.equipmentItems.length >= 1 &&
        nextData.equipmentRoiAndGrantComplianceNarrative.trim().length > 10;
      await onSaveStep2PremisesEquipment(nextData, isComplete ? 45 : 32);
      setSaveBanner(
        '✅ Saved Module E Step 2 (Premises, Workshop & Grant-Ready Equipment Schedule)!'
      );
    } finally {
      setIsSavingStep2(false);
    }
  }

  const STEP_TABS: Array<{
    id: 'STEP_1' | 'STEP_2' | 'STEP_3' | 'STEP_4' | 'STEP_5' | 'STEP_6';
    short: string;
    title: string;
    isComplete: boolean;
  }> = [
    {
      id: 'STEP_1',
      short: 'Step 1',
      title: 'Day in the Life of an Order',
      isComplete:
        Boolean(step1Data.fulfillmentMode) &&
        Boolean(step1Data.turnaroundSla) &&
        step1Data.orderLifecycleStages.length >= 3 &&
        step1Data.endToEndFulfillmentNarrative.trim().length > 10,
    },
    {
      id: 'STEP_2',
      short: 'Step 2',
      title: 'Premises, Equipment & 3 Quotes',
      isComplete:
        Boolean(step2Data.premisesSetupMode) &&
        Boolean(step2Data.premisesComplianceStatus) &&
        step2Data.equipmentItems.length >= 1 &&
        step2Data.equipmentRoiAndGrantComplianceNarrative.trim().length > 10,
    },
    {
      id: 'STEP_3',
      short: 'Step 3',
      title: '4-Category Risk Register',
      isComplete: false,
    },
    {
      id: 'STEP_4',
      short: 'Step 4',
      title: 'Support, Returns & QC',
      isComplete: false,
    },
    {
      id: 'STEP_5',
      short: 'Step 5',
      title: 'Permits & Insurance Matcher',
      isComplete: false,
    },
    {
      id: 'STEP_6',
      short: 'Step 6',
      title: 'Ops Things to Consider',
      isComplete: false,
    },
  ];

  return (
    <div className="space-y-5">
      {/* ===================================================================== */}
      {/* MODULE E HEADER & STEP NAVIGATION BAR                                 */}
      {/* ===================================================================== */}
      <Card className="border-indigo-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-indigo-500/30 text-indigo-100 ring-1 ring-indigo-400/40">
                  Module E • Operations, Equipment &amp; Risk Register
                </Badge>
                <Badge
                  variant="outline"
                  className="border-emerald-400/40 bg-emerald-500/10 text-[11px] text-emerald-200"
                >
                  {selectedCountry === 'IE'
                    ? '🇮🇪'
                    : selectedCountry === 'GB'
                      ? '🇬🇧'
                      : '🌍'}{' '}
                  {countryPack.countryName} Grant &amp; Ops Rules Active
                </Badge>
              </div>
              <h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">
                How Your Business Actually Runs Day-to-Day
              </h1>
              <p className="max-w-3xl text-xs leading-relaxed text-slate-300 sm:text-sm">
                Map a single customer order from checkout to delivery, calculate
                hands-on maker/founder minutes and unit delivery COGS, schedule
                grant-eligible equipment (
                {selectedCountry === 'IE'
                  ? 'enforcing IE LEO 3-quote & mobile asset / laptop ban rules'
                  : selectedCountry === 'GB'
                    ? 'enforcing UK Innovate UK 12-month capital usage depreciation & Start Up Loan procurement rules'
                    : 'enforcing 3-quote procurement & capital grant eligibility rules'}
                ), and lock in your formal 4-category Risk Register.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onBackToModuleD}
                className="border-slate-700 bg-slate-800/80 text-xs text-slate-100 hover:bg-slate-700"
              >
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                Back to Module D
              </Button>
            </div>
          </div>

          {/* 6-Step Sub-Navigation Pills */}
          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {STEP_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left transition-all ${
                    isActive
                      ? 'border-indigo-400 bg-indigo-500/30 text-white shadow-xs ring-1 ring-indigo-300/50'
                      : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:bg-slate-800/70'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                      {tab.short}
                    </div>
                    <div className="truncate text-xs font-semibold">
                      {tab.title}
                    </div>
                  </div>
                  {tab.isComplete ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  ) : (
                    <div className="h-2 w-2 shrink-0 rounded-full bg-slate-600" />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {saveBanner && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-950 shadow-2xs">
          <span>{saveBanner}</span>
          <button
            type="button"
            onClick={() => setSaveBanner(null)}
            className="ml-3 rounded-md px-2 py-0.5 text-[11px] font-bold text-emerald-900 underline hover:bg-emerald-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* STEP 1: "A DAY IN THE LIFE OF AN ORDER" (FULFILLMENT BLUEPRINT)       */}
      {/* ===================================================================== */}
      {activeTab === 'STEP_1' && (
        <div className="space-y-5">
          {/* Top Context & 4-Layer Support Toolbar */}
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader className="border-b border-slate-100 pb-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-indigo-100 text-indigo-800">
                      Step 1 of 6
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-slate-300 bg-slate-50 text-[11px] text-slate-700"
                    >
                      Synced from Module D:{' '}
                      {inheritedTrack === 'OTHER' && inheritedOtherTrackText
                        ? inheritedOtherTrackText
                        : inheritedTrack.replace(/_/g, ' ')}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-emerald-300 bg-emerald-50 text-[11px] text-emerald-800"
                    >
                      Auto-Feeds Module G Unit Economics (COGS &amp; Mins/Order)
                    </Badge>
                  </div>
                  <CardTitle className="mt-1.5 text-base font-bold text-slate-900 sm:text-lg">
                    1. &ldquo;A Day in the Life of an Order&rdquo; — End-to-End
                    Fulfillment Blueprint
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-600">
                    Walk through what happens the moment a customer clicks
                    &ldquo;Buy&rdquo;—who does what, which tools or machines are
                    used, how many hands-on minutes it takes, and what each
                    order costs to deliver.
                  </CardDescription>
                </div>

                {/* 4-Layer Support Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowWhyAsking(!showWhyAsking)}
                    className="border-indigo-200 bg-indigo-50/70 text-xs text-indigo-900 hover:bg-indigo-100"
                  >
                    <HelpCircle className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
                    Why Are We Asking This?
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowExampleDrawer(!showExampleDrawer)}
                    className="border-amber-200 bg-amber-50/70 text-xs text-amber-900 hover:bg-amber-100"
                  >
                    <Lightbulb className="mr-1.5 h-3.5 w-3.5 text-amber-600" />
                    Show Me an Example
                  </Button>
                </div>
              </div>

              {/* Quick Interactive Persona Switcher Bar (BMU vs. Woodworker Chopping Boards) */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs">
                <span className="font-semibold text-slate-700">
                  🎯 Want to test or start from a proven operational template?
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={isVaultReadonly}
                    onClick={() =>
                      handleLoadPresetPersona('WOODWORKER_BOARDS')
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 font-semibold text-amber-950 transition hover:bg-amber-100"
                  >
                    <Hammer className="h-3.5 w-3.5 text-amber-700" />
                    Load Woodworker (Chopping Boards) Blueprint
                  </button>
                  <button
                    type="button"
                    disabled={isVaultReadonly}
                    onClick={() => handleLoadPresetPersona('BMU_SAAS')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 font-semibold text-indigo-900 transition hover:bg-indigo-100"
                  >
                    <Laptop className="h-3.5 w-3.5 text-indigo-600" />
                    Load Build My Unicorn (Cloud AI SaaS) Blueprint
                  </button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-4">
              {/* Layer 1: "Why Are We Asking This?" Micro-Coaching Card */}
              {showWhyAsking && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 text-xs text-indigo-950">
                  <div className="flex items-center gap-2 font-bold text-indigo-900">
                    <HelpCircle className="h-4 w-4 text-indigo-600" />
                    Why Grant Assessors &amp; Investors Scrutinize Your Single
                    Order Blueprint
                  </div>
                  <p className="mt-1.5 leading-relaxed text-indigo-900/90">
                    Both{' '}
                    <strong>
                      {selectedCountry === 'IE'
                        ? 'Local Enterprise Office (LEO) / Enterprise Ireland'
                        : selectedCountry === 'GB'
                          ? 'Innovate UK & British Business Bank Start Up Loans'
                          : `${countryPack.countryName} Grant & Bank Assessors`}
                    </strong>{' '}
                    and commercial lenders look for two fatal operational traps:
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-indigo-900/90">
                    <li>
                      <strong>The &ldquo;Hidden Maker Hours&rdquo; Trap:</strong>{' '}
                      A craft founder (like a woodworker making chopping boards)
                      might forecast 400 sales/month in their spreadsheet,
                      forgetting each board takes 73 active minutes to plane,
                      glue, sand, oil, and pack—which would require 486 hours a
                      month! Mapping minutes per stage proves your capacity is
                      physically possible (or justifies the CNC/Sander grant in
                      Step 2).
                    </li>
                    <li>
                      <strong>The &ldquo;Forgotten Unit COGS&rdquo; Trap:</strong>{' '}
                      Founders often remember raw timber or Stripe fees, but
                      forget consumables (glue, abrasive belts, mineral oil,
                      protective kraft packaging, tracked courier labels, or AI
                      tokens). Every cost you enter here flows automatically
                      into <strong>Module G (Pocket Profit Calculator)</strong>.
                    </li>
                  </ul>
                </div>
              )}

              {/* Layer 1: "Show Me an Example" Side-by-Side Comparison Drawer */}
              {showExampleDrawer && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-950">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-bold text-amber-900">
                      💡 Side-by-Side Industry Examples (Step 1 Blueprint)
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setExamplePersonaTab('WOODWORKER_BOARDS')
                        }
                        className={`rounded-lg px-2.5 py-1 font-semibold ${
                          examplePersonaTab === 'WOODWORKER_BOARDS'
                            ? 'bg-amber-800 text-white'
                            : 'bg-white text-amber-900 border border-amber-300'
                        }`}
                      >
                        🪵 Woodworker (Chopping Boards)
                      </button>
                      <button
                        type="button"
                        onClick={() => setExamplePersonaTab('BMU_SAAS')}
                        className={`rounded-lg px-2.5 py-1 font-semibold ${
                          examplePersonaTab === 'BMU_SAAS'
                            ? 'bg-indigo-800 text-white'
                            : 'bg-white text-indigo-900 border border-indigo-300'
                        }`}
                      >
                        🦄 Build My Unicorn (Cloud AI SaaS)
                      </button>
                    </div>
                  </div>

                  {examplePersonaTab === 'WOODWORKER_BOARDS' ? (
                    <div className="mt-3 space-y-2 rounded-lg border border-amber-200 bg-white p-3 text-slate-700">
                      <div className="font-bold text-slate-900">
                        Artisan Woodworker — End-Grain &amp; Laser-Engraved
                        Chopping Boards
                      </div>
                      <p>
                        <strong>Operating Mode:</strong> In-House Batch
                        Production + Laser Personalization •{' '}
                        <strong>Turnaround SLA:</strong> 3–5 Business Days •{' '}
                        <strong>Bottleneck:</strong> 12-Board Parallel Clamp
                        Rack &amp; Drum Sanding Hours
                      </p>
                      <p>
                        <strong>5 Stages:</strong> (1) Rip kiln-dried Walnut/Ash
                        (`15m`, `€18.50`) &rarr; (2) Titebond III waterproof
                        glue-up (`15m`, `€1.80`) &rarr; (3) Drum sand, CNC juice
                        groove &amp; laser engrave (`25m`, `€2.20`) &rarr; (4)
                        Food-grade mineral oil bath &amp; beeswax buff (`10m`,
                        `€2.50`) &rarr; (5) 5-point QC, honeycomb kraft box &amp;
                        An Post/DPD courier (`8m`, `€9.50`).{' '}
                        <strong>Total: 73 mins/board &amp; €34.50 COGS.</strong>
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 space-y-2 rounded-lg border border-indigo-200 bg-white p-3 text-slate-700">
                      <div className="font-bold text-slate-900">
                        Build My Unicorn (BMU 2.0) — Cloud AI Co-Founder &amp;
                        Grant Platform
                      </div>
                      <p>
                        <strong>Operating Mode:</strong> Hybrid Automated Cloud +
                        3-Quote Partner Concierge •{' '}
                        <strong>Turnaround SLA:</strong> Instant (&lt; 60s
                        Workspace Unlock; &lt; 48h Partner Quotes) •{' '}
                        <strong>Bottleneck:</strong> 500 Calls/Day Gemini Ceiling
                        &amp; Partner Quote SLA
                      </p>
                      <p>
                        <strong>5 Stages:</strong> (1) Stripe / Voucher checkout
                        unlocks `user_entitlements` (`0m`, `€2.05`) &rarr; (2)
                        Edge Geo-IP localization &amp; Module A (`0m`, `€0.05`)
                        &rarr; (3) AI-guided Modules B–K + `/v/[slug]` survey
                        hosting (`0m`, `€0.85`) &rarr; (4) 3-Quote Concierge RFP
                        routing to IE/UK partners (`5m`, `€0.00`) &rarr; (5)
                        Module K Grant Audit &amp; Month-6 Vault renewal (`2m`,
                        `€0.05`).{' '}
                        <strong>Total: 7 mins/customer &amp; €3.00 COGS.</strong>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================= */}
              {/* 1. PRIMARY OPERATING & FULFILLMENT MODE SELECTOR (+ OTHER)    */}
              {/* ============================================================= */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                  1A. Primary Operating &amp; Fulfillment Mode
                </label>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {FULFILLMENT_MODE_OPTIONS.map((opt) => {
                    const isSelected = step1Data.fulfillmentMode === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={isVaultReadonly}
                        onClick={() =>
                          setStep1Data((prev) => ({
                            ...prev,
                            fulfillmentMode: opt.value,
                          }))
                        }
                        className={`flex flex-col justify-between rounded-xl border p-3 text-left transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                              {opt.badge}
                            </span>
                            {isSelected && (
                              <Check className="h-4 w-4 text-indigo-600" />
                            )}
                          </div>
                          <div className="mt-1.5 text-xs font-bold text-slate-900">
                            {opt.label}
                          </div>
                          <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                            {opt.subtitle}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {step1Data.fulfillmentMode === 'OTHER' && (
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-3">
                    <label className="block text-[11px] font-bold text-indigo-950">
                      Describe Your Custom Operating &amp; Fulfillment Mode:
                    </label>
                    <input
                      type="text"
                      disabled={isVaultReadonly}
                      value={step1Data.otherFulfillmentModeText || ''}
                      onChange={(e) =>
                        setStep1Data((prev) => ({
                          ...prev,
                          otherFulfillmentModeText: e.target.value,
                        }))
                      }
                      placeholder="e.g., Mobile pop-up workshop + regional micro-fulfillment lockers..."
                      className="mt-1.5 w-full rounded-lg border border-indigo-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-indigo-600 focus:outline-hidden sm:text-xs"
                    />
                  </div>
                )}
              </div>

              {/* ============================================================= */}
              {/* 1B. ORDER-TO-DELIVERY SLA TARGET (+ OTHER)                    */}
              {/* ============================================================= */}
              <div className="space-y-2.5 border-t border-slate-100 pt-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                  1B. Customer Order-to-Delivery Turnaround Target (SLA)
                </label>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {TURNAROUND_SLA_OPTIONS.map((opt) => {
                    const isSelected = step1Data.turnaroundSla === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={isVaultReadonly}
                        onClick={() =>
                          setStep1Data((prev) => ({
                            ...prev,
                            turnaroundSla: opt.value,
                          }))
                        }
                        className={`rounded-xl border p-3 text-left transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {opt.label}
                          </span>
                          {isSelected && (
                            <Check className="h-4 w-4 shrink-0 text-indigo-600" />
                          )}
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                          {opt.subtitle}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {step1Data.turnaroundSla === 'OTHER' && (
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-3">
                    <label className="block text-[11px] font-bold text-indigo-950">
                      Describe Your Custom Order-to-Delivery SLA Target:
                    </label>
                    <input
                      type="text"
                      disabled={isVaultReadonly}
                      value={step1Data.otherTurnaroundSlaText || ''}
                      onChange={(e) =>
                        setStep1Data((prev) => ({
                          ...prev,
                          otherTurnaroundSlaText: e.target.value,
                        }))
                      }
                      placeholder="e.g., Instant digital preview within 1 hour, physical handmade piece delivered in 10 days..."
                      className="mt-1.5 w-full rounded-lg border border-indigo-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-indigo-600 focus:outline-hidden sm:text-xs"
                    />
                  </div>
                )}
              </div>

              {/* ============================================================= */}
              {/* 1C. PRIMARY BOTTLENECK / CAPACITY CONSTRAINT (+ OTHER)        */}
              {/* ============================================================= */}
              <div className="space-y-2.5 border-t border-slate-100 pt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                    1C. Primary Operational Bottleneck (What Breaks First at
                    100 Orders?)
                  </label>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-slate-600">
                      Weekly Workshop / Ops Hours Available:
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={160}
                      disabled={isVaultReadonly}
                      value={step1Data.weeklyOpsHoursAllocated}
                      onChange={(e) =>
                        setStep1Data((prev) => ({
                          ...prev,
                          weeklyOpsHoursAllocated: Math.max(
                            1,
                            Math.min(160, Number(e.target.value) || 25)
                          ),
                        }))
                      }
                      className="w-20 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-center text-base font-bold text-indigo-900 sm:text-xs"
                    />
                    <span className="text-[11px] text-slate-500">hrs/wk</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {CAPACITY_CONSTRAINT_OPTIONS.map((opt) => {
                    const isSelected =
                      step1Data.capacityConstraint === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={isVaultReadonly}
                        onClick={() =>
                          setStep1Data((prev) => ({
                            ...prev,
                            capacityConstraint: opt.value,
                          }))
                        }
                        className={`rounded-xl border p-3 text-left transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {opt.label}
                          </span>
                          {isSelected && (
                            <Check className="h-4 w-4 shrink-0 text-indigo-600" />
                          )}
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                          {opt.subtitle}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {step1Data.capacityConstraint === 'OTHER' && (
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-3">
                    <label className="block text-[11px] font-bold text-indigo-950">
                      Describe Your Custom Operational Bottleneck:
                    </label>
                    <input
                      type="text"
                      disabled={isVaultReadonly}
                      value={step1Data.otherCapacityConstraintText || ''}
                      onChange={(e) =>
                        setStep1Data((prev) => ({
                          ...prev,
                          otherCapacityConstraintText: e.target.value,
                        }))
                      }
                      placeholder="e.g., Cold-chain refrigerated van slots on Fridays..."
                      className="mt-1.5 w-full rounded-lg border border-indigo-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-indigo-600 focus:outline-hidden sm:text-xs"
                    />
                  </div>
                )}
              </div>

              {/* ============================================================= */}
              {/* 2. INTERACTIVE 5-STAGE ORDER LIFECYCLE BUILDER                */}
              {/* ============================================================= */}
              <div className="space-y-3 border-t border-slate-200 pt-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 sm:text-sm">
                      2. Interactive 5-Stage &ldquo;Day in the Life of an
                      Order&rdquo; Lifecycle Table
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Edit each operational step below. Hands-on minutes and
                      direct variable costs (COGS) automatically total at the
                      bottom and feed into Module G.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isVaultReadonly || isGeneratingAiStep1}
                      onClick={() =>
                        handleRunAiStep1('POPULATE_STAGES_AND_NARRATIVES')
                      }
                      className="border-indigo-300 bg-indigo-50 text-xs font-semibold text-indigo-900 hover:bg-indigo-100"
                    >
                      {isGeneratingAiStep1 ? (
                        <>
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          Generating Blueprint...
                        </>
                      ) : (
                        <>
                          <Wand2 className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
                          AI Generate 5-Stage Blueprint
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isVaultReadonly}
                      onClick={handleAddStage}
                      className="text-xs"
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Add Stage
                    </Button>
                  </div>
                </div>

                {/* Stages List */}
                <div className="space-y-3">
                  {step1Data.orderLifecycleStages.map((stage, idx) => (
                    <div
                      key={stage.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 transition hover:border-indigo-200"
                    >
                      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
                        {/* Stage Title & Owner */}
                        <div className="space-y-2 lg:col-span-4">
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center rounded-md bg-indigo-900 px-2 py-0.5 text-[10px] font-bold text-white">
                              Stage {idx + 1}
                            </span>
                            {step1Data.orderLifecycleStages.length > 2 && (
                              <button
                                type="button"
                                disabled={isVaultReadonly}
                                onClick={() => handleRemoveStage(stage.id)}
                                className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                title="Remove stage"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold uppercase text-slate-500">
                              Stage Title
                            </label>
                            <input
                              type="text"
                              disabled={isVaultReadonly}
                              value={stage.stageTitle}
                              onChange={(e) =>
                                handleUpdateStage(stage.id, {
                                  stageTitle: e.target.value,
                                })
                              }
                              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-base font-semibold text-slate-900 sm:text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold uppercase text-slate-500">
                              Who Executes This Step?
                            </label>
                            <select
                              disabled={isVaultReadonly}
                              value={stage.ownerType}
                              onChange={(e) =>
                                handleUpdateStage(stage.id, {
                                  ownerType: e.target
                                    .value as OrderStageOwnerType,
                                })
                              }
                              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-base text-slate-900 sm:text-xs"
                            >
                              {STAGE_OWNER_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                            {stage.ownerType === 'OTHER' && (
                              <input
                                type="text"
                                disabled={isVaultReadonly}
                                value={stage.otherOwnerTypeText || ''}
                                onChange={(e) =>
                                  handleUpdateStage(stage.id, {
                                    otherOwnerTypeText: e.target.value,
                                  })
                                }
                                placeholder="Specify custom owner role..."
                                className="mt-1.5 w-full rounded-lg border border-indigo-300 bg-white px-2.5 py-1.5 text-base text-slate-900 sm:text-xs"
                              />
                            )}
                          </div>
                        </div>

                        {/* What Happens + Tools/Equipment/Supplier */}
                        <div className="space-y-2 lg:col-span-5">
                          <div>
                            <label className="block text-[10px] font-semibold uppercase text-slate-500">
                              What Happens Step-by-Step?
                            </label>
                            <textarea
                              rows={2}
                              disabled={isVaultReadonly}
                              value={stage.whatHappensStepByStep}
                              onChange={(e) =>
                                handleUpdateStage(stage.id, {
                                  whatHappensStepByStep: e.target.value,
                                })
                              }
                              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-base text-slate-800 sm:text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold uppercase text-slate-500">
                              Tools, Machinery, Software or Supplier Used
                            </label>
                            <input
                              type="text"
                              disabled={isVaultReadonly}
                              value={stage.toolsEquipmentOrSupplier}
                              onChange={(e) =>
                                handleUpdateStage(stage.id, {
                                  toolsEquipmentOrSupplier: e.target.value,
                                })
                              }
                              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-base text-slate-800 sm:text-xs"
                            />
                          </div>
                        </div>

                        {/* Active Minutes & Direct Cost (COGS) */}
                        <div className="grid grid-cols-2 gap-2.5 lg:col-span-3 lg:grid-cols-1">
                          <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                            <label className="block text-[10px] font-bold uppercase text-slate-600">
                              ⏱️ Active Hands-On Mins / Order
                            </label>
                            <div className="mt-1 flex items-center gap-1.5">
                              <input
                                type="number"
                                min={0}
                                max={2400}
                                step={1}
                                disabled={isVaultReadonly}
                                value={stage.activeMinutesPerOrder}
                                onChange={(e) =>
                                  handleUpdateStage(stage.id, {
                                    activeMinutesPerOrder: Math.max(
                                      0,
                                      Number(e.target.value) || 0
                                    ),
                                  })
                                }
                                className="w-full rounded-md border border-slate-300 px-2 py-1 text-base font-bold text-slate-900 sm:text-xs"
                              />
                              <span className="text-[11px] font-medium text-slate-500">
                                mins
                              </span>
                            </div>
                          </div>

                          <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                            <label className="block text-[10px] font-bold uppercase text-slate-600">
                              💶 Direct Variable Cost ({plan.baseCurrency})
                            </label>
                            <div className="mt-1 flex items-center gap-1.5">
                              <input
                                type="number"
                                min={0}
                                step={0.1}
                                disabled={isVaultReadonly}
                                value={stage.directVariableCostPerOrder}
                                onChange={(e) =>
                                  handleUpdateStage(stage.id, {
                                    directVariableCostPerOrder: Math.max(
                                      0,
                                      Number(e.target.value) || 0
                                    ),
                                  })
                                }
                                className="w-full rounded-md border border-slate-300 px-2 py-1 text-base font-bold text-emerald-900 sm:text-xs"
                              />
                              <span className="text-[11px] font-medium text-slate-500">
                                {plan.baseCurrency}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Live Auto-Calculated Unit Ops & Weekly Capacity Meter */}
                <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50/90 via-white to-emerald-50/80 p-4 shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-indigo-700" />
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-950">
                        Live Unit Operations &amp; Weekly Capacity Meter
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-emerald-300 bg-emerald-50 text-[10px] text-emerald-900"
                    >
                      Synced to Module G Unit Economics &amp; Module I Cashflow
                    </Badge>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="text-[10px] font-bold uppercase text-slate-500">
                        Hands-On Time / Order
                      </div>
                      <div className="mt-1 text-base font-extrabold text-slate-900 sm:text-lg">
                        {totalActiveMinutesPerOrder} mins{' '}
                        <span className="text-xs font-normal text-slate-500">
                          ({(totalActiveMinutesPerOrder / 60).toFixed(2)} hrs)
                        </span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="text-[10px] font-bold uppercase text-slate-500">
                        Direct Delivery Cost (COGS) / Order
                      </div>
                      <div className="mt-1 text-base font-extrabold text-emerald-700 sm:text-lg">
                        {formatPlanCurrency(
                          totalDirectVariableCostPerOrder,
                          plan.baseCurrency
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="text-[10px] font-bold uppercase text-slate-500">
                        Max Weekly Capacity ({weeklyOpsHours}h/wk)
                      </div>
                      <div className="mt-1 text-base font-extrabold text-indigo-700 sm:text-lg">
                        {totalActiveMinutesPerOrder === 0
                          ? 'Unlimited (Cloud)'
                          : `${maxOrdersPerWeekByManualTime} orders / wk`}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="text-[10px] font-bold uppercase text-slate-500">
                        Max Monthly Output Ceiling
                      </div>
                      <div className="mt-1 text-base font-extrabold text-slate-900 sm:text-lg">
                        {totalActiveMinutesPerOrder === 0
                          ? 'Automated Scale'
                          : `~${maxOrdersPerMonthByManualTime} orders / mo`}
                      </div>
                    </div>
                  </div>

                  {totalActiveMinutesPerOrder >= 45 && (
                    <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50/90 p-3 text-xs text-amber-950">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                      <div>
                        <strong>
                          Maker Capacity Alert ({totalActiveMinutesPerOrder}{' '}
                          mins/order):
                        </strong>{' '}
                        At {totalActiveMinutesPerOrder} hands-on minutes per
                        unit across {weeklyOpsHours} hrs/week, solo manual
                        production caps out at{' '}
                        <strong>
                          {maxOrdersPerWeekByManualTime} units/week (~
                          {maxOrdersPerMonthByManualTime} units/month)
                        </strong>
                        . Make sure your narrative below explains how batching
                        or Step 2 grant-funded equipment (e.g., CNC router,
                        drum sander, or 3PL) lifts this ceiling!
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ============================================================= */}
              {/* 3. GRANT & BUSINESS PLAN OPERATIONAL NARRATIVES               */}
              {/* ============================================================= */}
              <div className="space-y-4 border-t border-slate-200 pt-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 sm:text-sm">
                      3. End-to-End Fulfillment &amp; Bottleneck Scaling
                      Narratives
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Populates Section 6 (Operations &amp; Production) of your
                      IE LEO Business Plan and UK Start Up Loans / Innovate UK
                      delivery plan.
                    </p>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isVaultReadonly || isGeneratingAiStep1}
                    onClick={() => handleRunAiStep1('NARRATIVES_ONLY')}
                    className="border-indigo-300 bg-indigo-50 text-xs font-semibold text-indigo-900 hover:bg-indigo-100"
                  >
                    <Sparkles className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
                    Synthesize Narratives from My Stages
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      3A. End-to-End Order Fulfillment &amp; Quality Handover
                      Narrative
                    </label>
                    <textarea
                      rows={4}
                      disabled={isVaultReadonly}
                      value={step1Data.endToEndFulfillmentNarrative}
                      onChange={(e) =>
                        setStep1Data((prev) => ({
                          ...prev,
                          endToEndFulfillmentNarrative: e.target.value,
                        }))
                      }
                      placeholder="Summarize how an order moves from checkout to customer delivery, your SLA target, and your direct unit delivery cost..."
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 text-base leading-relaxed text-slate-900 focus:border-indigo-600 focus:outline-hidden sm:text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      3B. How We Scale Order Volume 5x Without Breaking
                      Fulfillment
                    </label>
                    <textarea
                      rows={4}
                      disabled={isVaultReadonly}
                      value={step1Data.scalingAndBottleneckDeRiskingNarrative}
                      onChange={(e) =>
                        setStep1Data((prev) => ({
                          ...prev,
                          scalingAndBottleneckDeRiskingNarrative:
                            e.target.value,
                        }))
                      }
                      placeholder="Explain how you overcome your #1 bottleneck during peak season (e.g., pre-milling blank boards in Sept/Oct, CNC automation, or 500/day AI guardrails)..."
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 text-base leading-relaxed text-slate-900 focus:border-indigo-600 focus:outline-hidden sm:text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* ============================================================= */}
              {/* BOTTOM ACTION BAR: PARK QUESTION + SAVE STEP 1                */}
              {/* ============================================================= */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowParkInput(!showParkInput)}
                    className="border-amber-300 bg-amber-50/70 text-xs text-amber-900 hover:bg-amber-100"
                  >
                    <BookmarkPlus className="mr-1.5 h-3.5 w-3.5 text-amber-700" />
                    Park Operations Question
                  </Button>
                  {step1Data.lastSavedAt && (
                    <span className="text-[11px] font-medium text-emerald-700">
                      ✓ Saved{' '}
                      {new Date(step1Data.lastSavedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={isVaultReadonly || isSavingStep1}
                    onClick={handleSaveStep1}
                    className="bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-700"
                  >
                    {isSavingStep1 ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Saving Step 1...
                      </>
                    ) : (
                      <>
                        <Save className="mr-1.5 h-3.5 w-3.5" />
                        Save Step 1 Blueprint
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={isSavingStep1}
                    onClick={async () => {
                      if (!isVaultReadonly) {
                        await handleSaveStep1();
                      }
                      setActiveTab('STEP_2');
                    }}
                    className="bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    Save &amp; Continue to Step 2
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {showParkInput && (
                <div className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    value={parkQuestionInput}
                    onChange={(e) => setParkQuestionInput(e.target.value)}
                    placeholder="e.g., Confirm DPD vs. An Post Advantage parcel rates for 3kg packaged chopping boards..."
                    className="flex-1 rounded-lg border border-amber-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-amber-500 focus:outline-hidden sm:text-xs"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={async () => {
                      const clean = parkQuestionInput.trim();
                      if (!clean) return;
                      await onParkOpenQuestion(clean);
                      setParkQuestionInput('');
                      setShowParkInput(false);
                      setSaveBanner(
                        '📌 Parked question in your Open Questions Parking Lot!'
                      );
                    }}
                    className="bg-amber-600 text-xs text-white hover:bg-amber-700"
                  >
                    Save to Parking Lot
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ================================================================= */}
          {/* LIVE STEP 1 OUTPUT PREVIEW CARD                                   */}
          {/* ================================================================= */}
          <Card className="border-indigo-200 bg-gradient-to-br from-white to-indigo-50/40 shadow-xs">
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-sm font-bold text-slate-900">
                  📋 Live Step 1 Output Preview (&ldquo;Day in the Life of an
                  Order&rdquo; &amp; Unit COGS Summary)
                </CardTitle>
                <Badge
                  variant="outline"
                  className="border-emerald-300 bg-emerald-50 text-[10px] text-emerald-800"
                >
                  Feeds Module G Unit Economics &amp; Module K Business Plan
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-700">
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full min-w-[640px] text-left text-[11px]">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase text-slate-600">
                    <tr>
                      <th className="px-3 py-2">Stage</th>
                      <th className="px-3 py-2">Owner</th>
                      <th className="px-3 py-2">Operational Step &amp; Tools</th>
                      <th className="px-3 py-2 text-right">Active Time</th>
                      <th className="px-3 py-2 text-right">Direct Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {step1Data.orderLifecycleStages.map((st) => (
                      <tr key={st.id}>
                        <td className="px-3 py-2 font-bold text-slate-900">
                          {st.stageTitle}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {st.ownerType === 'OTHER' && st.otherOwnerTypeText
                            ? st.otherOwnerTypeText
                            : st.ownerType.replace(/_/g, ' ')}
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-slate-800">
                            {st.whatHappensStepByStep}
                          </div>
                          <div className="text-[10px] text-indigo-700">
                            Tool/Supplier: {st.toolsEquipmentOrSupplier}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-slate-900">
                          {st.activeMinutesPerOrder}m
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-emerald-700">
                          {formatPlanCurrency(
                            st.directVariableCostPerOrder,
                            plan.baseCurrency
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-900">
                    <tr>
                      <td colSpan={3} className="px-3 py-2 text-right">
                        Total Per Single Order (Synced to Module G):
                      </td>
                      <td className="px-3 py-2 text-right text-indigo-700">
                        {totalActiveMinutesPerOrder} mins
                      </td>
                      <td className="px-3 py-2 text-right text-emerald-700">
                        {formatPlanCurrency(
                          totalDirectVariableCostPerOrder,
                          plan.baseCurrency
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===================================================================== */}
      {/* STEP 2: PREMISES, WORKSHOP & GRANT-READY EQUIPMENT SCHEDULE           */}
      {/* ===================================================================== */}
      {activeTab === 'STEP_2' && (
        <div className="space-y-5">
          {/* Top Context & 4-Layer Built-In Support Card */}
          <Card className="border-indigo-200 bg-white shadow-xs">
            <CardHeader className="border-b border-slate-100 bg-slate-50/70 pb-4">
              <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-indigo-600 text-white">
                      Step 2 of 6 • Premises, Equipment &amp; 3-Quote Schedule
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-emerald-300 bg-emerald-50 text-[11px] text-emerald-900"
                    >
                      {selectedCountry === 'IE'
                        ? '🇮🇪 IE LEO 3-Quote (>= €1,000) & Mobile Asset / Laptop Ban Guardrails Active'
                        : selectedCountry === 'GB'
                          ? '🇬🇧 UK Innovate UK Capital Usage Depreciation & Start Up Loan Rules Active'
                          : '🌍 Capex, 3-Quote Procurement & Grant Eligibility Guardrails Active'}
                    </Badge>
                  </div>
                  <CardTitle className="text-base font-bold text-slate-900 sm:text-lg">
                    Where Do You Work &amp; What Machinery / Equipment Powers Your
                    Output?
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-600">
                    {selectedCountry === 'IE' ? (
                      <>
                        Define your operating footprint (remote cloud, home
                        garage workshop, enterprise centre, or industrial unit),
                        build your itemized capital equipment schedule, and
                        enforce{' '}
                        <strong>
                          🇮🇪 IE LEO 3-Quote Rules (&ge;{' '}
                          {formatPlanCurrency(1000, plan.baseCurrency)})
                        </strong>{' '}
                        and{' '}
                        <strong>
                          IE LEO Mobile Asset / Laptop Ban ring-fencing
                        </strong>{' '}
                        for Module K Appendix C.
                      </>
                    ) : selectedCountry === 'GB' ? (
                      <>
                        Define your operating footprint (remote cloud, home
                        workshop, maker space, or industrial unit), build your
                        itemized capital equipment schedule, calculate{' '}
                        <strong>
                          🇬🇧 UK Innovate UK 12-Month Capital Usage Depreciation
                        </strong>
                        , and structure{' '}
                        <strong>
                          British Business Bank Start Up Loan &amp; 3-Quote (&ge;{' '}
                          {formatPlanCurrency(1000, plan.baseCurrency)})
                        </strong>{' '}
                        evidence.
                      </>
                    ) : (
                      <>
                        Define your operating footprint (remote cloud, home
                        workshop, incubator, or industrial unit), build your
                        itemized capital equipment schedule, and enforce{' '}
                        <strong>
                          3-Quote Procurement Rules (&ge;{' '}
                          {formatPlanCurrency(1000, plan.baseCurrency)})
                        </strong>{' '}
                        and <strong>Mobile IT ring-fencing</strong>.
                      </>
                    )}
                  </CardDescription>
                </div>

                {/* 4-Layer Built-In Support Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowWhyAskingStep2(!showWhyAskingStep2)}
                    className="border-indigo-200 bg-indigo-50/60 text-xs text-indigo-900 hover:bg-indigo-100"
                  >
                    <HelpCircle className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
                    Why Are We Asking This?
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setShowExampleDrawerStep2(!showExampleDrawerStep2)
                    }
                    className="border-emerald-200 bg-emerald-50/70 text-xs text-emerald-900 hover:bg-emerald-100"
                  >
                    <Lightbulb className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                    Show Me an Example
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isVaultReadonly}
                    onClick={() =>
                      handleLoadStep2PresetPersona(
                        inheritedTrack === 'PHYSICAL_PRODUCT_ECOM'
                          ? 'WOODWORKER_BOARDS'
                          : 'BMU_SAAS'
                      )
                    }
                    className="border-amber-200 bg-amber-50/70 text-xs text-amber-900 hover:bg-amber-100"
                  >
                    <Gauge className="mr-1.5 h-3.5 w-3.5 text-amber-600" />
                    Use Industry Benchmark
                  </Button>
                </div>
              </div>

              {/* Quick 1-Click Persona Switcher Bar */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 py-2">
                <div className="flex items-center gap-2 text-xs font-medium text-indigo-950">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                  <span>
                    Compare or load a complete Grant-Ready Equipment &amp;
                    Premises Schedule:
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isVaultReadonly}
                    onClick={() =>
                      handleLoadStep2PresetPersona('WOODWORKER_BOARDS')
                    }
                    className="h-7 border-amber-300 bg-white px-2.5 text-[11px] font-semibold text-amber-950 hover:bg-amber-50"
                  >
                    🪵 Load Woodworker (Chopping Boards) Capex &amp; 3-Quote
                    Schedule
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isVaultReadonly}
                    onClick={() => handleLoadStep2PresetPersona('BMU_SAAS')}
                    className="h-7 border-indigo-300 bg-white px-2.5 text-[11px] font-semibold text-indigo-950 hover:bg-indigo-50"
                  >
                    🦄 Load Build My Unicorn (Cloud AI SaaS) Ring-Fenced Schedule
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-5">
              {/* MICRO-COACHING DRAWER: WHY ARE WE ASKING THIS? */}
              {showWhyAskingStep2 && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 text-xs text-indigo-950">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-indigo-900">
                      <ShieldCheck className="h-4 w-4 text-indigo-700" />
                      Why Grant Evaluators &amp; Underwriters Audit Your
                      Equipment Schedule Line-by-Line
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowWhyAskingStep2(false)}
                      className="text-[11px] font-semibold text-indigo-700 underline"
                    >
                      Close
                    </button>
                  </div>
                  {selectedCountry === 'IE' ? (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div className="rounded-lg border border-indigo-200/80 bg-white p-3">
                        <div className="font-bold text-slate-900">
                          1. 🇮🇪 IE LEO 3-Quote Rule (&ge;{' '}
                          {formatPlanCurrency(1000, plan.baseCurrency)})
                        </div>
                        <p className="mt-1 leading-relaxed text-slate-600">
                          Any machinery or fit-out item costing{' '}
                          <strong>
                            &ge; {formatPlanCurrency(1000, plan.baseCurrency)}{' '}
                            ex-VAT
                          </strong>{' '}
                          requires{' '}
                          <strong>3 independent written supplier quotes</strong>{' '}
                          attached to Module K Appendix C before your Local
                          Enterprise Office releases a 50% capital grant
                          drawdown.
                        </p>
                      </div>
                      <div className="rounded-lg border border-indigo-200/80 bg-white p-3">
                        <div className="font-bold text-slate-900">
                          2. 🚫 IE LEO Mobile Asset &amp; Laptop Ban
                        </div>
                        <p className="mt-1 leading-relaxed text-slate-600">
                          Standard general-purpose laptops, MacBooks,
                          smartphones, tablets, and motor vehicles are{' '}
                          <strong>ineligible for IE LEO capital grants</strong>.
                          Ring-fencing them under <strong>100% Own Funds</strong>{' '}
                          prevents your grant claim from being rejected.
                        </p>
                      </div>
                      <div className="rounded-lg border border-indigo-200/80 bg-white p-3">
                        <div className="font-bold text-slate-900">
                          3. 💶 50% LEO Capital Rebate &amp; Cash Timing
                        </div>
                        <p className="mt-1 leading-relaxed text-slate-600">
                          IE LEO Priming &amp; Feasibility grants reimburse up
                          to <strong>50% of eligible capital expenditure</strong>{' '}
                          on a vouched-expenditure basis (you pay the supplier
                          first and claim the 50% grant rebate with paid
                          invoices + Appendix C quotes).
                        </p>
                      </div>
                    </div>
                  ) : selectedCountry === 'GB' ? (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div className="rounded-lg border border-indigo-200/80 bg-white p-3">
                        <div className="font-bold text-slate-900">
                          1. 🇬🇧 UK Innovate UK Depreciation Rule
                        </div>
                        <p className="mt-1 leading-relaxed text-slate-600">
                          Innovate UK Smart Grants do not reimburse 100% of raw
                          asset purchase price upfront—they reimburse{' '}
                          <strong>12-Month Capital Usage Depreciation</strong>{' '}
                          during the project:{' '}
                          <code>Cost &times; (12 / Useful Life) &times; Usage %</code>.
                        </p>
                      </div>
                      <div className="rounded-lg border border-indigo-200/80 bg-white p-3">
                        <div className="font-bold text-slate-900">
                          2. 🏦 UK Start Up Loans (£500–£25k at 6%)
                        </div>
                        <p className="mt-1 leading-relaxed text-slate-600">
                          British Business Bank Start Up Loans underwriters
                          audit your itemized CapEx schedule to verify that
                          every tool, machine, or workshop asset directly
                          unlocks monthly order capacity and margin.
                        </p>
                      </div>
                      <div className="rounded-lg border border-indigo-200/80 bg-white p-3">
                        <div className="font-bold text-slate-900">
                          3. 📋 3-Quote Value-for-Money (&ge;{' '}
                          {formatPlanCurrency(1000, plan.baseCurrency)})
                        </div>
                        <p className="mt-1 leading-relaxed text-slate-600">
                          Any specialist hardware or machinery item costing{' '}
                          <strong>
                            &ge; {formatPlanCurrency(1000, plan.baseCurrency)}{' '}
                            ex-VAT
                          </strong>{' '}
                          should be backed by{' '}
                          <strong>3 comparable supplier quotes</strong>, while
                          general founder laptops are ring-fenced under{' '}
                          <strong>100% Own Funds / BYOD</strong>.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div className="rounded-lg border border-indigo-200/80 bg-white p-3">
                        <div className="font-bold text-slate-900">
                          1. 📋 3-Quote Rule (&ge;{' '}
                          {formatPlanCurrency(1000, plan.baseCurrency)})
                        </div>
                        <p className="mt-1 leading-relaxed text-slate-600">
                          Any machinery or fit-out item costing{' '}
                          <strong>
                            &ge; {formatPlanCurrency(1000, plan.baseCurrency)}{' '}
                            ex-VAT
                          </strong>{' '}
                          requires{' '}
                          <strong>3 independent written supplier quotes</strong>{' '}
                          attached to Module K Appendix C.
                        </p>
                      </div>
                      <div className="rounded-lg border border-indigo-200/80 bg-white p-3">
                        <div className="font-bold text-slate-900">
                          2. 💻 Mobile IT &amp; Laptop Ring-Fencing
                        </div>
                        <p className="mt-1 leading-relaxed text-slate-600">
                          Standard general-purpose laptops and smartphones are
                          typically excluded from capital grants—ring-fencing
                          them under <strong>100% Own Funds</strong> keeps your
                          schedule audit-ready.
                        </p>
                      </div>
                      <div className="rounded-lg border border-indigo-200/80 bg-white p-3">
                        <div className="font-bold text-slate-900">
                          3. 📈 Production ROI &amp; Unit Capacity Link
                        </div>
                        <p className="mt-1 leading-relaxed text-slate-600">
                          Every capital item is linked directly to minutes saved
                          per order in Step 1 and synced automatically to your
                          Module I cashflow forecast.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SHOW ME AN EXAMPLE DRAWER */}
              {showExampleDrawerStep2 && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs text-slate-800">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold text-emerald-950">
                      <Lightbulb className="h-4 w-4 text-emerald-700" />
                      Side-by-Side Example: Artisan Woodworker Workshop vs.
                      Build My Unicorn Cloud SaaS
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setExamplePersonaTab('WOODWORKER_BOARDS')}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                          examplePersonaTab === 'WOODWORKER_BOARDS'
                            ? 'bg-amber-600 text-white'
                            : 'bg-white text-slate-700 ring-1 ring-slate-200'
                        }`}
                      >
                        🪵 Woodworker (Chopping Boards)
                      </button>
                      <button
                        type="button"
                        onClick={() => setExamplePersonaTab('BMU_SAAS')}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                          examplePersonaTab === 'BMU_SAAS'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-slate-700 ring-1 ring-slate-200'
                        }`}
                      >
                        🦄 Build My Unicorn (SaaS)
                      </button>
                    </div>
                  </div>

                  {examplePersonaTab === 'WOODWORKER_BOARDS' ? (
                    <div className="space-y-2 rounded-lg border border-amber-200 bg-white p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-amber-950">
                          🪵 Artisan Woodworker — 32m² Insulated Garage Workshop
                          + {formatPlanCurrency(8190, plan.baseCurrency)} Capex
                          Schedule
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          disabled={isVaultReadonly}
                          onClick={() =>
                            handleLoadStep2PresetPersona('WOODWORKER_BOARDS')
                          }
                          className="h-7 bg-amber-600 px-2.5 text-[11px] text-white hover:bg-amber-700"
                        >
                          Load This Woodworker Schedule into Step 2
                        </Button>
                      </div>
                      <ul className="list-disc space-y-1 pl-4 text-[11px] text-slate-700">
                        <li>
                          <strong>
                            Dual-Drum Sander (
                            {formatPlanCurrency(2400, plan.baseCurrency)}) &amp;
                            CNC + 20W Laser (
                            {formatPlanCurrency(3200, plan.baseCurrency)}):
                          </strong>{' '}
                          Both &ge;{' '}
                          {formatPlanCurrency(1000, plan.baseCurrency)}, flagged
                          for 3 Written Quotes (Appendix C) and{' '}
                          {selectedCountry === 'IE'
                            ? `50% IE LEO Grant Match (${formatPlanCurrency(2800, plan.baseCurrency)} rebate)`
                            : selectedCountry === 'GB'
                              ? `UK Innovate UK 12-Mo Capital Usage Depreciation (${formatPlanCurrency(1867, plan.baseCurrency)}/yr eligible claim)`
                              : `50% Capital Grant Match (${formatPlanCurrency(2800, plan.baseCurrency)} est. rebate)`}
                          , cutting sanding/routing time per board by 45%.
                        </li>
                        <li>
                          <strong>
                            HEPA Fine-Dust Extractor &amp; Dipping Tank (
                            {formatPlanCurrency(850, plan.baseCurrency)}):
                          </strong>{' '}
                          &lt; {formatPlanCurrency(1000, plan.baseCurrency)}{' '}
                          (Single Written Quote sufficient),{' '}
                          {selectedCountry === 'IE'
                            ? `50% IE LEO Grant Match (${formatPlanCurrency(425, plan.baseCurrency)} rebate).`
                            : selectedCountry === 'GB'
                              ? `eligible for UK Start Up Loan / Innovate UK usage claim (${formatPlanCurrency(283, plan.baseCurrency)}/yr depreciation).`
                              : `eligible for 50% grant co-funding.`}
                        </li>
                        <li>
                          <strong>
                            Founder Laptop (
                            {formatPlanCurrency(1100, plan.baseCurrency)}{' '}
                            MacBook Air):
                          </strong>{' '}
                          Explicitly ring-fenced under{' '}
                          <strong>100% Own Funds / BYOD</strong> so it never
                          violates{' '}
                          {selectedCountry === 'IE'
                            ? 'the IE LEO Mobile Asset Ban.'
                            : selectedCountry === 'GB'
                              ? 'UK grant mobile IT eligibility rules.'
                              : 'capital grant mobile asset exclusion rules.'}
                        </li>
                      </ul>
                    </div>
                  ) : (
                    <div className="space-y-2 rounded-lg border border-indigo-200 bg-white p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-indigo-950">
                          🦄 Build My Unicorn — 100% Cloud-Native Remote Setup +
                          Ring-Fenced QA Hardware
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          disabled={isVaultReadonly}
                          onClick={() => handleLoadStep2PresetPersona('BMU_SAAS')}
                          className="h-7 bg-indigo-600 px-2.5 text-[11px] text-white hover:bg-indigo-700"
                        >
                          Load This BMU SaaS Schedule into Step 2
                        </Button>
                      </div>
                      <ul className="list-disc space-y-1 pl-4 text-[11px] text-slate-700">
                        <li>
                          <strong>
                            Premises ({formatPlanCurrency(95, plan.baseCurrency)}
                            /mo):
                          </strong>{' '}
                          100% Cloud-Native remote setup (
                          {selectedCountry === 'IE'
                            ? 'Ireland'
                            : selectedCountry === 'GB'
                              ? 'UK'
                              : countryPack.countryName}
                          ) with zero commercial office lease overhead in Year 1.
                        </li>
                        <li>
                          <strong>
                            2 &times; Founder MacBook Pros (
                            {formatPlanCurrency(3600, plan.baseCurrency)} BYOD):
                          </strong>{' '}
                          Ring-fenced under 100% Own Funds (
                          {selectedCountry === 'IE'
                            ? 'IE LEO Laptop Ban compliant'
                            : 'Mobile IT ring-fence compliant'}
                          , {formatPlanCurrency(0, plan.baseCurrency)} new cash
                          outlay).
                        </li>
                        <li>
                          <strong>
                            Mobile Safari QA Test Rig (
                            {formatPlanCurrency(920, plan.baseCurrency)}) &amp;
                            YubiKey Security Keys (
                            {formatPlanCurrency(340, plan.baseCurrency)}):
                          </strong>{' '}
                          Both &lt;{' '}
                          {formatPlanCurrency(1000, plan.baseCurrency)} (single
                          quote sufficient), funded via 100% Own Funds.
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* LIVE 4-CARD CAPITAL, GRANT REBATE & COMPLIANCE METRICS STRIP */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5">
                  <div className="text-[11px] font-semibold text-slate-500">
                    Total Capex Schedule (New Cash Outlay)
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-lg font-extrabold text-slate-900">
                      {formatPlanCurrency(
                        newOutlayCapexExVat,
                        plan.baseCurrency
                      )}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      ({formatPlanCurrency(totalCapexExVat, plan.baseCurrency)}{' '}
                      incl. BYOD)
                    </span>
                  </div>
                  <div className="mt-1 text-[10px] text-slate-600">
                    Monthly Premises/Utilities:{' '}
                    <strong>
                      {formatPlanCurrency(
                        step2Data.monthlyPremisesAndUtilitiesCost || 0,
                        plan.baseCurrency
                      )}
                      /mo
                    </strong>{' '}
                    (Synced to Module I)
                  </div>
                </div>

                {selectedCountry === 'IE' ? (
                  <>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5">
                      <div className="text-[11px] font-semibold text-emerald-800">
                        🇮🇪 IE LEO 50% Capital Grant Rebate
                      </div>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-lg font-extrabold text-emerald-700">
                          {formatPlanCurrency(
                            estimatedLeo50GrantRebate,
                            plan.baseCurrency
                          )}
                        </span>
                        <span className="text-[11px] text-emerald-800">
                          on{' '}
                          {formatPlanCurrency(
                            grantEligibleCapexTotal,
                            plan.baseCurrency
                          )}{' '}
                          eligible
                        </span>
                      </div>
                      <div className="mt-1 text-[10px] text-emerald-900">
                        50% LEO Priming / Feasibility Capital Match
                      </div>
                    </div>

                    <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3.5">
                      <div className="text-[11px] font-semibold text-indigo-800">
                        💶 Net Founder Cash Needed (After LEO Grant)
                      </div>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-lg font-extrabold text-indigo-700">
                          {formatPlanCurrency(
                            netFounderCashOutlayAfterLeoGrant,
                            plan.baseCurrency
                          )}
                        </span>
                      </div>
                      <div className="mt-1 text-[10px] text-indigo-900">
                        After {formatPlanCurrency(estimatedLeo50GrantRebate, plan.baseCurrency)}{' '}
                        vouched IE LEO rebate drawdown
                      </div>
                    </div>
                  </>
                ) : selectedCountry === 'GB' ? (
                  <>
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3.5">
                      <div className="text-[11px] font-semibold text-indigo-800">
                        🇬🇧 UK Innovate UK 12-Mo Depreciation
                      </div>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-lg font-extrabold text-indigo-700">
                          {formatPlanCurrency(
                            ukInnovateAnnualEligibleDepreciation,
                            plan.baseCurrency
                          )}
                          /yr
                        </span>
                      </div>
                      <div className="mt-1 text-[10px] text-indigo-900">
                        Eligible Capital Usage Claim (Cost &times; 12/Life &times;
                        Usage %)
                      </div>
                    </div>

                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5">
                      <div className="text-[11px] font-semibold text-emerald-800">
                        🏦 UK Start Up Loan / Eligible Capex
                      </div>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-lg font-extrabold text-emerald-700">
                          {formatPlanCurrency(
                            grantEligibleCapexTotal,
                            plan.baseCurrency
                          )}
                        </span>
                        <span className="text-[11px] text-emerald-800">
                          specialist assets
                        </span>
                      </div>
                      <div className="mt-1 text-[10px] text-emerald-900">
                        Net Founder / Start Up Loan Outlay:{' '}
                        <strong>
                          {formatPlanCurrency(
                            newOutlayCapexExVat,
                            plan.baseCurrency
                          )}
                        </strong>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5">
                      <div className="text-[11px] font-semibold text-emerald-800">
                        🎯 50% Capital Grant Match (Est.)
                      </div>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-lg font-extrabold text-emerald-700">
                          {formatPlanCurrency(
                            estimatedLeo50GrantRebate,
                            plan.baseCurrency
                          )}
                        </span>
                        <span className="text-[11px] text-emerald-800">
                          on{' '}
                          {formatPlanCurrency(
                            grantEligibleCapexTotal,
                            plan.baseCurrency
                          )}{' '}
                          eligible
                        </span>
                      </div>
                      <div className="mt-1 text-[10px] text-emerald-900">
                        Net Founder Cash Needed:{' '}
                        <strong>
                          {formatPlanCurrency(
                            netFounderCashOutlayAfterLeoGrant,
                            plan.baseCurrency
                          )}
                        </strong>
                      </div>
                    </div>

                    <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3.5">
                      <div className="text-[11px] font-semibold text-indigo-800">
                        📉 Annualized 12-Mo Capital Depreciation
                      </div>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-lg font-extrabold text-indigo-700">
                          {formatPlanCurrency(
                            ukInnovateAnnualEligibleDepreciation,
                            plan.baseCurrency
                          )}
                          /yr
                        </span>
                      </div>
                      <div className="mt-1 text-[10px] text-indigo-900">
                        Annualized Asset Usage (Cost &times; 12/Life &times;
                        Usage %)
                      </div>
                    </div>
                  </>
                )}

                <div
                  className={`rounded-xl border p-3.5 ${
                    itemsViolatingLeoLaptopBan.length > 0
                      ? 'border-red-300 bg-red-50/80'
                      : 'border-amber-200 bg-amber-50/60'
                  }`}
                >
                  <div className="text-[11px] font-semibold text-slate-800">
                    {selectedCountry === 'IE'
                      ? '3-Quote & IE LEO Laptop Ban Audit'
                      : '3-Quote & Mobile IT Ring-Fence Audit'}
                  </div>
                  <div className="mt-1 text-xs font-bold text-slate-900">
                    {itemsOver1kNeeding3Quotes.length} item(s) &ge;{' '}
                    {formatPlanCurrency(1000, plan.baseCurrency)} need 3 quotes
                  </div>
                  <div className="mt-1 text-[10px] text-slate-700">
                    {itemsViolatingLeoLaptopBan.length > 0 ? (
                      <span className="font-bold text-red-700">
                        ⚠️ {itemsViolatingLeoLaptopBan.length} Laptop/Mobile
                        item(s) marked Grant! Ring-fence below.
                      </span>
                    ) : (
                      <span className="font-semibold text-emerald-800">
                        {selectedCountry === 'IE'
                          ? '✓ All Laptops/Mobile assets ring-fenced (IE LEO Compliant)'
                          : '✓ All Laptops/Mobile assets ring-fenced (100% Own Funds)'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* LIVE MOBILE ASSET / LAPTOP BAN GUARDRAIL ALERT */}
              {itemsViolatingLeoLaptopBan.length > 0 && (
                <div className="flex flex-col justify-between gap-3 rounded-xl border-2 border-red-300 bg-red-50 p-4 sm:flex-row sm:items-center">
                  <div className="space-y-1 text-xs text-red-950">
                    <div className="flex items-center gap-2 font-bold text-red-800">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                      {selectedCountry === 'IE'
                        ? '🇮🇪 IE LEO Mobile Asset & Laptop Ban Warning'
                        : selectedCountry === 'GB'
                          ? '🇬🇧 UK Grant Mobile IT & Laptop Ring-Fence Warning'
                          : 'Mobile Asset & Laptop Grant Warning'}{' '}
                      ({itemsViolatingLeoLaptopBan.length} Item
                      {itemsViolatingLeoLaptopBan.length > 1 ? 's' : ''}{' '}
                      Flagged)
                    </div>
                    <p className="leading-relaxed text-red-900">
                      {selectedCountry === 'IE'
                        ? 'Local Enterprise Office (LEO) Priming & Feasibility grants strictly exclude general-purpose laptops, MacBooks, smartphones, tablets, and road vehicles from capital grant reimbursement. Click the button on the right to automatically ring-fence these items under 100% Own Funds so your IE LEO grant application passes pre-flight audit.'
                        : 'General-purpose laptops, MacBooks, smartphones, and tablets are routinely rejected from capital grant claims unless ring-fenced under 100% Own Funds. Click the button on the right to automatically ring-fence these items under 100% Own Funds.'}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    disabled={isVaultReadonly}
                    onClick={handleRingFenceMobileAssetsForLeo}
                    className="shrink-0 bg-red-600 text-xs font-bold text-white hover:bg-red-700"
                  >
                    <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                    Ring-Fence as 100% Own Funds
                  </Button>
                </div>
              )}

              {/* ============================================================= */}
              {/* SECTION 1: PREMISES, WORKSHOP & LOCATION FOOTPRINT            */}
              {/* ============================================================= */}
              <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    1. Premises, Workshop &amp; Operating Footprint
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {PREMISES_SETUP_MODE_OPTIONS.map((opt) => {
                    const isSelected =
                      step2Data.premisesSetupMode === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={isVaultReadonly}
                        onClick={() =>
                          setStep2Data((prev) => ({
                            ...prev,
                            premisesSetupMode: opt.value,
                          }))
                        }
                        className={`flex flex-col justify-between rounded-xl border p-3 text-left transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/20'
                            : 'border-slate-200 bg-white hover:border-indigo-300'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                              {opt.badge}
                            </span>
                            {isSelected && (
                              <Check className="h-4 w-4 text-indigo-600" />
                            )}
                          </div>
                          <div className="pt-1 text-xs font-bold text-slate-900">
                            {opt.label}
                          </div>
                          <p className="text-[11px] leading-relaxed text-slate-600">
                            {opt.subtitle}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {step2Data.premisesSetupMode === 'OTHER' && (
                  <div className="rounded-xl border border-indigo-200 bg-white p-3">
                    <label className="mb-1 block text-xs font-bold text-slate-800">
                      Describe Your Custom Premises / Operating Footprint:
                    </label>
                    <input
                      type="text"
                      disabled={isVaultReadonly}
                      value={step2Data.otherPremisesSetupModeText || ''}
                      onChange={(e) =>
                        setStep2Data((prev) => ({
                          ...prev,
                          otherPremisesSetupModeText: e.target.value,
                        }))
                      }
                      placeholder="e.g., Mobile acoustic testing van + shared university cleanroom bench..."
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-indigo-600 focus:outline-hidden sm:text-xs"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-xs font-bold text-slate-800">
                      Premises Specification, Floor Area &amp; Power / Utility
                      Setup
                    </label>
                    <input
                      type="text"
                      disabled={isVaultReadonly}
                      value={step2Data.premisesLocationSummary}
                      onChange={(e) =>
                        setStep2Data((prev) => ({
                          ...prev,
                          premisesLocationSummary: e.target.value,
                        }))
                      }
                      placeholder="e.g., 32m² Insulated Timber Workshop (Domestic Garage Conversion with 32A 230V Dedicated Breaker & ATEX Extraction)"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-indigo-600 focus:outline-hidden sm:text-xs"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-800">
                      Monthly Premises / Rent / Utilities ({plan.baseCurrency}/mo)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={5}
                      disabled={isVaultReadonly}
                      value={step2Data.monthlyPremisesAndUtilitiesCost}
                      onChange={(e) =>
                        setStep2Data((prev) => ({
                          ...prev,
                          monthlyPremisesAndUtilitiesCost: Math.max(
                            0,
                            Number(e.target.value) || 0
                          ),
                        }))
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base font-bold text-slate-900 focus:border-indigo-600 focus:outline-hidden sm:text-xs"
                    />
                  </div>
                </div>

                {/* Premises Zoning & Compliance Status Selector */}
                <div className="space-y-2 pt-1">
                  <label className="block text-xs font-bold text-slate-800">
                    Premises Planning, Zoning, Lease &amp; Safety Status
                  </label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {PREMISES_COMPLIANCE_STATUS_OPTIONS.map((opt) => {
                      const isSelected =
                        step2Data.premisesComplianceStatus === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          disabled={isVaultReadonly}
                          onClick={() =>
                            setStep2Data((prev) => ({
                              ...prev,
                              premisesComplianceStatus: opt.value,
                            }))
                          }
                          className={`rounded-xl border p-3 text-left transition-all ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/20'
                              : 'border-slate-200 bg-white hover:border-indigo-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              {opt.label}
                            </span>
                            {isSelected && (
                              <Check className="h-4 w-4 shrink-0 text-indigo-600" />
                            )}
                          </div>
                          <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                            {opt.subtitle}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  {step2Data.premisesComplianceStatus === 'OTHER' && (
                    <div className="rounded-xl border border-indigo-200 bg-white p-3">
                      <label className="mb-1 block text-xs font-bold text-slate-800">
                        Describe Your Custom Zoning / Lease / EHO Status:
                      </label>
                      <input
                        type="text"
                        disabled={isVaultReadonly}
                        value={step2Data.otherPremisesComplianceStatusText || ''}
                        onChange={(e) =>
                          setStep2Data((prev) => ({
                            ...prev,
                            otherPremisesComplianceStatusText: e.target.value,
                          }))
                        }
                        placeholder="e.g., Written landlord licence to manufacture in rear annex; council pre-planning confirmed exempt..."
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-indigo-600 focus:outline-hidden sm:text-xs"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* ============================================================= */}
              {/* SECTION 2: GRANT-READY EQUIPMENT & CAPEX SCHEDULE             */}
              {/* ============================================================= */}
              <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <Hammer className="h-4 w-4 text-indigo-600" />
                      <h3 className="text-sm font-bold text-slate-900">
                        2. Capital Equipment, Machinery &amp; 3-Quote Schedule
                      </h3>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-600">
                      List each piece of machinery, fit-out, or hardware. Items{' '}
                      <strong>
                        &ge; {formatPlanCurrency(1000, plan.baseCurrency)}
                      </strong>{' '}
                      automatically flag the 3-Quote requirement for Module K
                      Appendix C.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isVaultReadonly}
                      onClick={handleAddEquipmentItem}
                      className="border-indigo-300 bg-indigo-50/70 text-xs font-semibold text-indigo-900 hover:bg-indigo-100"
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Add Equipment / Asset Row
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {step2Data.equipmentItems.map((item, idx) => {
                    const isLaptopMobile = checkIsMobileOrLaptopAsset(
                      item.assetName,
                      item.assetCategory
                    );
                    const isOver1k =
                      (Number(item.totalCostExVat) || 0) >= 1000 &&
                      item.acquisitionMode !== 'ALREADY_OWNED_BYOD';
                    const itemUkAnnualDeprec =
                      item.acquisitionMode === 'ALREADY_OWNED_BYOD'
                        ? 0
                        : Math.round(
                            (Number(item.totalCostExVat) || 0) *
                              (12 /
                                Math.max(12, Number(item.usefulLifeMonths) || 36)) *
                              (Math.min(
                                100,
                                Math.max(0, Number(item.projectUsagePercent) || 100)
                              ) /
                                100)
                          );

                    return (
                      <div
                        key={item.id}
                        className={`space-y-3 rounded-xl border p-3.5 transition-all ${
                          isLaptopMobile &&
                          item.fundingSource === 'GRANT_50_MATCH'
                            ? 'border-red-300 bg-red-50/40'
                            : 'border-slate-200 bg-slate-50/60'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-900">
                              {item.assetName || `Asset #${idx + 1}`}
                            </span>
                            {isOver1k && (
                              <Badge className="bg-amber-100 text-[10px] font-bold text-amber-900 ring-1 ring-amber-300">
                                &ge; {formatPlanCurrency(1000, plan.baseCurrency)}{' '}
                                • 3 Written Quotes Needed (Appendix C)
                              </Badge>
                            )}
                            {isLaptopMobile && (
                              <Badge
                                className={`text-[10px] font-bold ${
                                  item.fundingSource === 'GRANT_50_MATCH'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-slate-200 text-slate-800'
                                }`}
                              >
                                {selectedCountry === 'IE'
                                  ? '💻 Mobile / Laptop Asset (Ring-Fence as 100% Own Funds for IE LEO)'
                                  : '💻 Mobile / Laptop Asset (Ring-Fence as 100% Own Funds)'}
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {isOver1k && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={isVaultReadonly}
                                onClick={() =>
                                  handleRequest3QuotesConciergeForItem(item.id)
                                }
                                className={`h-7 px-2.5 text-[11px] font-semibold ${
                                  item.conciergeQuotesRequested
                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                                    : 'border-indigo-300 bg-white text-indigo-900 hover:bg-indigo-50'
                                }`}
                              >
                                <FileCheck2 className="mr-1.5 h-3.5 w-3.5" />
                                {item.conciergeQuotesRequested
                                  ? '✓ 3 Quotes Requested (BMU Concierge)'
                                  : selectedCountry === 'IE'
                                    ? 'Request 3 Vetted IE Quotes'
                                    : selectedCountry === 'GB'
                                      ? 'Request 3 Vetted UK Quotes'
                                      : 'Request 3 Vetted Quotes'}
                              </Button>
                            )}
                            {step2Data.equipmentItems.length > 1 && (
                              <button
                                type="button"
                                disabled={isVaultReadonly}
                                onClick={() =>
                                  handleRemoveEquipmentItem(item.id)
                                }
                                className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                title="Remove equipment item"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                          <div className="md:col-span-5">
                            <label className="mb-1 block text-[11px] font-bold text-slate-700">
                              Equipment / Machinery Name &amp; Model
                            </label>
                            <input
                              type="text"
                              disabled={isVaultReadonly}
                              value={item.assetName}
                              onChange={(e) =>
                                handleUpdateEquipmentItem(item.id, {
                                  assetName: e.target.value,
                                })
                              }
                              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-base font-medium text-slate-900 focus:border-indigo-600 focus:outline-hidden sm:text-xs"
                            />
                          </div>

                          <div className="md:col-span-4">
                            <label className="mb-1 block text-[11px] font-bold text-slate-700">
                              Asset Category
                            </label>
                            <select
                              disabled={isVaultReadonly}
                              value={item.assetCategory}
                              onChange={(e) =>
                                handleUpdateEquipmentItem(item.id, {
                                  assetCategory: e.target
                                    .value as EquipmentAssetCategoryType,
                                })
                              }
                              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-base text-slate-900 focus:border-indigo-600 focus:outline-hidden sm:text-xs"
                            >
                              {getEquipmentAssetCategoryOptions(
                                selectedCountry
                              ).map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="md:col-span-3">
                            <label className="mb-1 block text-[11px] font-bold text-slate-700">
                              Acquisition Mode
                            </label>
                            <select
                              disabled={isVaultReadonly}
                              value={item.acquisitionMode}
                              onChange={(e) =>
                                handleUpdateEquipmentItem(item.id, {
                                  acquisitionMode: e.target
                                    .value as EquipmentAcquisitionModeType,
                                })
                              }
                              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-base text-slate-900 focus:border-indigo-600 focus:outline-hidden sm:text-xs"
                            >
                              {getEquipmentAcquisitionModeOptions(
                                plan.baseCurrency
                              ).map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Inline "OTHER" inputs for Asset Category or Acquisition Mode */}
                        {(item.assetCategory === 'OTHER' ||
                          item.acquisitionMode === 'OTHER') && (
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {item.assetCategory === 'OTHER' && (
                              <div>
                                <label className="mb-1 block text-[11px] font-bold text-slate-700">
                                  Custom Asset Category:
                                </label>
                                <input
                                  type="text"
                                  disabled={isVaultReadonly}
                                  value={item.otherAssetCategoryText || ''}
                                  onChange={(e) =>
                                    handleUpdateEquipmentItem(item.id, {
                                      otherAssetCategoryText: e.target.value,
                                    })
                                  }
                                  placeholder="Describe custom asset category..."
                                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-base text-slate-900 sm:text-xs"
                                />
                              </div>
                            )}
                            {item.acquisitionMode === 'OTHER' && (
                              <div>
                                <label className="mb-1 block text-[11px] font-bold text-slate-700">
                                  Custom Acquisition Method:
                                </label>
                                <input
                                  type="text"
                                  disabled={isVaultReadonly}
                                  value={item.otherAcquisitionModeText || ''}
                                  onChange={(e) =>
                                    handleUpdateEquipmentItem(item.id, {
                                      otherAcquisitionModeText: e.target.value,
                                    })
                                  }
                                  placeholder="Describe custom acquisition terms..."
                                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-base text-slate-900 sm:text-xs"
                                />
                              </div>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                          <div className="md:col-span-5">
                            <label className="mb-1 block text-[11px] font-bold text-slate-700">
                              Preferred Suppliers / 3-Quote Sources / Specs
                            </label>
                            <input
                              type="text"
                              disabled={isVaultReadonly}
                              value={item.preferredSuppliersOrSpecs}
                              onChange={(e) =>
                                handleUpdateEquipmentItem(item.id, {
                                  preferredSuppliersOrSpecs: e.target.value,
                                })
                              }
                              placeholder={
                                selectedCountry === 'IE'
                                  ? 'e.g., McQuillan Tools (IE), Caulfield Industrial (IE), The Carpentry Store (Naas)'
                                  : selectedCountry === 'GB'
                                    ? 'e.g., Axminster Tools (UK), Machine Mart (UK), RS Components (UK)'
                                    : 'e.g., 3 independent written supplier quotes & technical specifications'
                              }
                              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-base text-slate-900 focus:border-indigo-600 focus:outline-hidden sm:text-xs"
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-2 md:col-span-4">
                            <div>
                              <label className="mb-1 block text-[11px] font-bold text-slate-700">
                                Qty
                              </label>
                              <input
                                type="number"
                                min={1}
                                disabled={isVaultReadonly}
                                value={item.quantity}
                                onChange={(e) =>
                                  handleUpdateEquipmentItem(item.id, {
                                    quantity: Math.max(
                                      1,
                                      Number(e.target.value) || 1
                                    ),
                                  })
                                }
                                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-base font-semibold text-slate-900 sm:text-xs"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-[11px] font-bold text-slate-700">
                                Unit ({plan.baseCurrency})
                              </label>
                              <input
                                type="number"
                                min={0}
                                step={10}
                                disabled={isVaultReadonly}
                                value={item.unitCostExVat}
                                onChange={(e) =>
                                  handleUpdateEquipmentItem(item.id, {
                                    unitCostExVat: Math.max(
                                      0,
                                      Number(e.target.value) || 0
                                    ),
                                  })
                                }
                                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-base font-semibold text-slate-900 sm:text-xs"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-[11px] font-bold text-slate-700">
                                Total Ex-VAT
                              </label>
                              <div className="flex h-[34px] items-center rounded-lg border border-slate-200 bg-slate-100 px-2 text-xs font-extrabold text-slate-900">
                                {formatPlanCurrency(
                                  item.totalCostExVat,
                                  plan.baseCurrency
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 md:col-span-3">
                            <div>
                              <label className="mb-1 block text-[11px] font-bold text-slate-700">
                                Useful Life (Mo)
                              </label>
                              <input
                                type="number"
                                min={12}
                                max={120}
                                step={12}
                                disabled={isVaultReadonly}
                                value={item.usefulLifeMonths}
                                onChange={(e) =>
                                  handleUpdateEquipmentItem(item.id, {
                                    usefulLifeMonths: Math.max(
                                      12,
                                      Number(e.target.value) || 36
                                    ),
                                  })
                                }
                                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-base text-slate-900 sm:text-xs"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-[11px] font-bold text-slate-700">
                                Project Use %
                              </label>
                              <input
                                type="number"
                                min={10}
                                max={100}
                                step={5}
                                disabled={isVaultReadonly}
                                value={item.projectUsagePercent}
                                onChange={(e) =>
                                  handleUpdateEquipmentItem(item.id, {
                                    projectUsagePercent: Math.min(
                                      100,
                                      Math.max(10, Number(e.target.value) || 100)
                                    ),
                                  })
                                }
                                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-base text-slate-900 sm:text-xs"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                          <div className="md:col-span-5">
                            <label className="mb-1 block text-[11px] font-bold text-slate-700">
                              Funding Source &amp; Grant Ring-Fencing
                            </label>
                            <select
                              disabled={isVaultReadonly}
                              value={item.fundingSource}
                              onChange={(e) =>
                                handleUpdateEquipmentItem(item.id, {
                                  fundingSource: e.target
                                    .value as EquipmentFundingSourceType,
                                })
                              }
                              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-base text-slate-900 focus:border-indigo-600 focus:outline-hidden sm:text-xs"
                            >
                              {getEquipmentFundingSourceOptions(
                                selectedCountry
                              ).map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="md:col-span-5">
                            <label className="mb-1 block text-[11px] font-bold text-slate-700">
                              3-Quote &amp; Appendix C Procurement Status
                            </label>
                            <select
                              disabled={isVaultReadonly}
                              value={item.quoteComplianceStatus}
                              onChange={(e) =>
                                handleUpdateEquipmentItem(item.id, {
                                  quoteComplianceStatus: e.target
                                    .value as EquipmentQuoteComplianceStatusType,
                                })
                              }
                              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-base text-slate-900 focus:border-indigo-600 focus:outline-hidden sm:text-xs"
                            >
                              {getEquipmentQuoteComplianceOptions(
                                selectedCountry,
                                plan.baseCurrency
                              ).map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex flex-col justify-end md:col-span-2">
                            {selectedCountry === 'IE' ? (
                              <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 px-2.5 py-1.5 text-[10px] text-emerald-950">
                                <div className="font-semibold">
                                  🇮🇪 IE LEO 50% Rebate:
                                </div>
                                <div className="font-extrabold text-emerald-700">
                                  {formatPlanCurrency(
                                    item.fundingSource === 'GRANT_50_MATCH' &&
                                      !isLaptopMobile &&
                                      item.acquisitionMode !==
                                        'ALREADY_OWNED_BYOD'
                                      ? Math.round(
                                          (Number(item.totalCostExVat) || 0) *
                                            0.5
                                        )
                                      : 0,
                                    plan.baseCurrency
                                  )}
                                </div>
                              </div>
                            ) : selectedCountry === 'GB' ? (
                              <div className="rounded-lg border border-indigo-200 bg-indigo-50/70 px-2.5 py-1.5 text-[10px] text-indigo-950">
                                <div className="font-semibold">
                                  🇬🇧 UK Innovate Deprec:
                                </div>
                                <div className="font-extrabold text-indigo-700">
                                  {formatPlanCurrency(
                                    itemUkAnnualDeprec,
                                    plan.baseCurrency
                                  )}
                                  /yr
                                </div>
                              </div>
                            ) : (
                              <div className="rounded-lg border border-indigo-200 bg-indigo-50/70 px-2.5 py-1.5 text-[10px] text-indigo-950">
                                <div className="font-semibold">
                                  12-Mo Deprec:
                                </div>
                                <div className="font-extrabold text-indigo-700">
                                  {formatPlanCurrency(
                                    itemUkAnnualDeprec,
                                    plan.baseCurrency
                                  )}
                                  /yr
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {(item.fundingSource === 'OTHER' ||
                          item.quoteComplianceStatus === 'OTHER') && (
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {item.fundingSource === 'OTHER' && (
                              <div>
                                <label className="mb-1 block text-[11px] font-bold text-slate-700">
                                  Custom Funding Split:
                                </label>
                                <input
                                  type="text"
                                  disabled={isVaultReadonly}
                                  value={item.otherFundingSourceText || ''}
                                  onChange={(e) =>
                                    handleUpdateEquipmentItem(item.id, {
                                      otherFundingSourceText: e.target.value,
                                    })
                                  }
                                  placeholder="e.g., 80% LEADER Rural Grant + 20% Credit Union Loan..."
                                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-base text-slate-900 sm:text-xs"
                                />
                              </div>
                            )}
                            {item.quoteComplianceStatus === 'OTHER' && (
                              <div>
                                <label className="mb-1 block text-[11px] font-bold text-slate-700">
                                  Custom Quote / Procurement Note:
                                </label>
                                <input
                                  type="text"
                                  disabled={isVaultReadonly}
                                  value={
                                    item.otherQuoteComplianceStatusText || ''
                                  }
                                  onChange={(e) =>
                                    handleUpdateEquipmentItem(item.id, {
                                      otherQuoteComplianceStatusText:
                                        e.target.value,
                                    })
                                  }
                                  placeholder="e.g., Sole European OEM distributor letter on file..."
                                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-base text-slate-900 sm:text-xs"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ============================================================= */}
              {/* SECTION 3: AI PREMISES & EQUIPMENT ROI NARRATIVE SYNTHESIZER  */}
              {/* ============================================================= */}
              <div className="space-y-4 rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <Wand2 className="h-4 w-4 text-indigo-600" />
                      <h3 className="text-sm font-bold text-slate-900">
                        3. Grant-Ready Premises &amp; Capital Equipment ROI
                        Narratives
                      </h3>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-600">
                      Synthesize your formal Premises Justification and Capital
                      Equipment ROI &amp; 3-Quote Compliance narratives for
                      Module K.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isVaultReadonly || isGeneratingAiStep2}
                      onClick={() => handleRunAiStep2('NARRATIVES_ONLY')}
                      className="border-indigo-300 bg-white text-xs font-semibold text-indigo-900 hover:bg-indigo-50"
                    >
                      {isGeneratingAiStep2 ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
                      )}
                      Synthesize Narratives from My Schedule
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={isVaultReadonly || isGeneratingAiStep2}
                      onClick={() =>
                        handleRunAiStep2('POPULATE_ASSETS_AND_NARRATIVES')
                      }
                      className="bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-700"
                    >
                      {isGeneratingAiStep2 ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Wand2 className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      Auto-Draft Full Schedule &amp; Narratives
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      3A. Premises, Workshop &amp; Location Justification
                    </label>
                    <textarea
                      rows={4}
                      disabled={isVaultReadonly}
                      value={
                        step2Data.premisesAndLocationJustificationNarrative
                      }
                      onChange={(e) =>
                        setStep2Data((prev) => ({
                          ...prev,
                          premisesAndLocationJustificationNarrative:
                            e.target.value,
                        }))
                      }
                      placeholder="Explain why your current operating footprint (e.g., insulated 32m² garage workshop or 100% cloud-native setup) is capital-efficient for Year 1 and compliant with zoning/safety rules..."
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 text-base leading-relaxed text-slate-900 focus:border-indigo-600 focus:outline-hidden sm:text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      3B. Equipment ROI, 3-Quote Compliance &amp; Laptop
                      Ring-Fencing Narrative
                    </label>
                    <textarea
                      rows={4}
                      disabled={isVaultReadonly}
                      value={step2Data.equipmentRoiAndGrantComplianceNarrative}
                      onChange={(e) =>
                        setStep2Data((prev) => ({
                          ...prev,
                          equipmentRoiAndGrantComplianceNarrative:
                            e.target.value,
                        }))
                      }
                      placeholder="Explain how your machinery investments increase throughput/reduce unit labour, confirm 3 written quotes for items >= €1,000, and confirm laptops/mobile devices are ring-fenced under 100% Own Funds..."
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 text-base leading-relaxed text-slate-900 focus:border-indigo-600 focus:outline-hidden sm:text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* ============================================================= */}
              {/* BOTTOM ACTION BAR: PARK QUESTION + SAVE STEP 2                */}
              {/* ============================================================= */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('STEP_1')}
                    className="text-xs"
                  >
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                    Back to Step 1
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowParkInputStep2(!showParkInputStep2)}
                    className="border-amber-300 bg-amber-50/70 text-xs text-amber-900 hover:bg-amber-100"
                  >
                    <BookmarkPlus className="mr-1.5 h-3.5 w-3.5 text-amber-700" />
                    Park Equipment / Quote Question
                  </Button>
                  {step2Data.lastSavedAt && (
                    <span className="text-[11px] font-medium text-emerald-700">
                      ✓ Saved{' '}
                      {new Date(step2Data.lastSavedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={isVaultReadonly || isSavingStep2}
                    onClick={handleSaveStep2}
                    className="bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-700"
                  >
                    {isSavingStep2 ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Saving Step 2...
                      </>
                    ) : (
                      <>
                        <Save className="mr-1.5 h-3.5 w-3.5" />
                        Save Step 2 Equipment Schedule
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {showParkInputStep2 && (
                <div className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    value={parkQuestionInputStep2}
                    onChange={(e) => setParkQuestionInputStep2(e.target.value)}
                    placeholder="e.g., Request written quote #3 from Caulfield Industrial for Jet Dual-Drum Sander..."
                    className="flex-1 rounded-lg border border-amber-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-amber-500 focus:outline-hidden sm:text-xs"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={async () => {
                      const clean = parkQuestionInputStep2.trim();
                      if (!clean) return;
                      await onParkOpenQuestion(clean);
                      setParkQuestionInputStep2('');
                      setShowParkInputStep2(false);
                      setSaveBanner(
                        '📌 Parked equipment/quote question in your Open Questions Parking Lot!'
                      );
                    }}
                    className="bg-amber-600 text-xs text-white hover:bg-amber-700"
                  >
                    Save to Parking Lot
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ================================================================= */}
          {/* LIVE STEP 2 APPENDIX C & INNOVATE UK OUTPUT PREVIEW TABLE         */}
          {/* ================================================================= */}
          <Card className="border-indigo-200 bg-gradient-to-br from-white to-indigo-50/40 shadow-xs">
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-sm font-bold text-slate-900">
                  📋 Live Step 2 Output Preview (Module K Appendix C Capital
                  Schedule &amp; 3-Quote Tracker)
                </CardTitle>
                <div className="flex flex-wrap items-center gap-1.5">
                  {itemsWithConciergeRequested.length > 0 && (
                    <Badge className="bg-indigo-600 text-[10px] text-white">
                      {itemsWithConciergeRequested.length} Concierge RFP(s)
                      Active
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className="border-emerald-300 bg-emerald-50 text-[10px] text-emerald-800"
                  >
                    Synced to Module I Capex &amp; Module K Appendix C
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-700">
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full min-w-[680px] text-left text-[11px]">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase text-slate-600">
                    <tr>
                      <th className="px-3 py-2">Asset &amp; Suppliers</th>
                      <th className="px-3 py-2">Funding Source</th>
                      <th className="px-3 py-2">3-Quote Status</th>
                      <th className="px-3 py-2 text-right">Total Ex-VAT</th>
                      <th className="px-3 py-2 text-right">
                        {selectedCountry === 'IE'
                          ? '🇮🇪 IE LEO 50% Grant Rebate'
                          : selectedCountry === 'GB'
                            ? '🇬🇧 UK Innovate 12-Mo Deprec.'
                            : 'Grant Rebate / 12-Mo Deprec.'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {step2Data.equipmentItems.map((it) => {
                      const isMobile = checkIsMobileOrLaptopAsset(
                        it.assetName,
                        it.assetCategory
                      );
                      const leoRebate =
                        it.fundingSource === 'GRANT_50_MATCH' &&
                        !isMobile &&
                        it.acquisitionMode !== 'ALREADY_OWNED_BYOD'
                          ? Math.round((Number(it.totalCostExVat) || 0) * 0.5)
                          : 0;
                      const ukDeprec =
                        it.acquisitionMode === 'ALREADY_OWNED_BYOD'
                          ? 0
                          : Math.round(
                              (Number(it.totalCostExVat) || 0) *
                                (12 /
                                  Math.max(
                                    12,
                                    Number(it.usefulLifeMonths) || 36
                                  )) *
                                (Math.min(
                                  100,
                                  Math.max(
                                    0,
                                    Number(it.projectUsagePercent) || 100
                                  )
                                ) /
                                  100)
                            );
                      return (
                        <tr key={it.id}>
                          <td className="px-3 py-2">
                            <div className="font-bold text-slate-900">
                              {it.assetName}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {it.preferredSuppliersOrSpecs}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <span className="font-medium text-slate-800">
                              {it.fundingSource === 'OTHER' &&
                              it.otherFundingSourceText
                                ? it.otherFundingSourceText
                                : it.fundingSource.replace(/_/g, ' ')}
                            </span>
                            {isMobile && (
                              <div className="text-[10px] font-semibold text-amber-800">
                                {selectedCountry === 'IE'
                                  ? 'Ring-fenced (IE LEO Laptop Rule)'
                                  : 'Ring-fenced (100% Own Funds)'}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2 text-slate-700">
                            {it.quoteComplianceStatus === 'OTHER' &&
                            it.otherQuoteComplianceStatusText
                              ? it.otherQuoteComplianceStatusText
                              : it.quoteComplianceStatus.replace(/_/g, ' ')}
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-slate-900">
                            {formatPlanCurrency(
                              it.totalCostExVat,
                              plan.baseCurrency
                            )}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {selectedCountry === 'IE' ? (
                              <div className="font-bold text-emerald-700">
                                {formatPlanCurrency(
                                  leoRebate,
                                  plan.baseCurrency
                                )}
                              </div>
                            ) : selectedCountry === 'GB' ? (
                              <div className="font-bold text-indigo-700">
                                {formatPlanCurrency(
                                  ukDeprec,
                                  plan.baseCurrency
                                )}
                                /yr
                              </div>
                            ) : (
                              <>
                                <div className="font-bold text-emerald-700">
                                  Rebate:{' '}
                                  {formatPlanCurrency(
                                    leoRebate,
                                    plan.baseCurrency
                                  )}
                                </div>
                                <div className="text-[10px] text-indigo-700">
                                  Deprec:{' '}
                                  {formatPlanCurrency(
                                    ukDeprec,
                                    plan.baseCurrency
                                  )}
                                  /yr
                                </div>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-900">
                    <tr>
                      <td colSpan={3} className="px-3 py-2 text-right">
                        Schedule Totals (Synced to Module I &amp; Module K
                        Appendix C):
                      </td>
                      <td className="px-3 py-2 text-right text-slate-900">
                        {formatPlanCurrency(totalCapexExVat, plan.baseCurrency)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {selectedCountry === 'IE' ? (
                          <div className="text-emerald-700">
                            LEO 50% Rebate:{' '}
                            {formatPlanCurrency(
                              estimatedLeo50GrantRebate,
                              plan.baseCurrency
                            )}
                          </div>
                        ) : selectedCountry === 'GB' ? (
                          <div className="text-indigo-700">
                            UK 12-Mo Deprec:{' '}
                            {formatPlanCurrency(
                              ukInnovateAnnualEligibleDepreciation,
                              plan.baseCurrency
                            )}
                            /yr
                          </div>
                        ) : (
                          <>
                            <div className="text-emerald-700">
                              Rebate:{' '}
                              {formatPlanCurrency(
                                estimatedLeo50GrantRebate,
                                plan.baseCurrency
                              )}
                            </div>
                            <div className="text-[10px] text-indigo-700">
                              Deprec:{' '}
                              {formatPlanCurrency(
                                ukInnovateAnnualEligibleDepreciation,
                                plan.baseCurrency
                              )}
                              /yr
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===================================================================== */}
      {/* UPCOMING STEPS 3–6 PREVIEW CARDS (READY FOR NEXT ITERATIONS)          */}
      {/* ===================================================================== */}
      {activeTab !== 'STEP_1' && activeTab !== 'STEP_2' && (
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900">
              {STEP_TABS.find((t) => t.id === activeTab)?.short}:{' '}
              {STEP_TABS.find((t) => t.id === activeTab)?.title}
            </CardTitle>
            <CardDescription className="text-xs text-slate-600">
              Complete Steps 1 and 2 first—we are building Steps 3–6
              sequentially next!
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setActiveTab('STEP_1')}
              className="text-xs"
            >
              &larr; Return to Step 1 (Day in the Life of an Order)
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setActiveTab('STEP_2')}
              className="text-xs"
            >
              &larr; Return to Step 2 (Premises, Equipment &amp; 3 Quotes)
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
