'use client';

import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Eye,
  FileText,
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
  Headphones,
  RotateCcw,
  ClipboardCheck,
  Layers,
  MessageSquareWarning,
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
  SupplierRedundancyPostureType,
  ProjectRiskCategoryType,
  ResidualRiskRatingType,
  ProjectRiskRegisterItem,
  RiskRegisterStep3Data,
  SupportOperatingModelType,
  SupportResponseSlaType,
  ReturnsAndWarrantyPolicyType,
  QcGateTimingType,
  QcCheckpointItem,
  SupportReturnsAndQcStep4Data,
  RegulatorySectorPostureType,
  DataPrivacyPostureType,
  InsuranceCoverageBundleType,
  ComplianceItemCategoryType,
  ComplianceItemStatusType,
  ComplianceChecklistItem,
  PermitsComplianceAndInsuranceStep5Data,
  OperationsBlindSpotCategoryType,
  OperationsBlindSpotSeverityType,
  OperationsReadinessConfidenceType,
  OperationsBlindSpotItem,
  OperationsBlindSpotAuditStep6Data,
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
  onSaveStep3RiskRegister: (
    data: RiskRegisterStep3Data,
    progress: number
  ) => Promise<void>;
  onGenerateAiRiskRegister: (params: {
    selectedTrack: ProductTrackType;
    otherProductTrackText?: string;
    currentSupplierRedundancyPosture?: SupplierRedundancyPostureType | '';
    currentLeadTimeBufferDays?: number;
    currentPrimarySuppliersSummary?: string;
    currentBackupSuppliersSummary?: string;
    currentRiskItems?: ProjectRiskRegisterItem[];
    mode?: 'POPULATE_RISKS_AND_NARRATIVES' | 'NARRATIVES_ONLY';
  }) => Promise<{
    allowed: boolean;
    reason?: string;
    supplierRedundancyPosture: SupplierRedundancyPostureType;
    leadTimeBufferDays: number;
    primarySuppliersSummary: string;
    backupSuppliersSummary: string;
    riskItems: ProjectRiskRegisterItem[];
    supplyChainResilienceNarrative: string;
    riskManagementGovernanceNarrative: string;
    engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
  }>;
  onSaveStep4SupportReturnsAndQc: (
    data: SupportReturnsAndQcStep4Data,
    progress: number
  ) => Promise<void>;
  onGenerateAiSupportReturnsAndQc: (params: {
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
  }) => Promise<{
    allowed: boolean;
    reason?: string;
    supportOperatingModel: SupportOperatingModelType;
    supportResponseSla: SupportResponseSlaType;
    returnsAndWarrantyPolicy: ReturnsAndWarrantyPolicyType;
    estimatedReturnOrRefundRatePercent: number;
    costPerReturnOrRemakeIncident: number;
    warrantyDurationMonths: number;
    qcCheckpoints: QcCheckpointItem[];
    qualityControlAndStandardsNarrative: string;
    customerSupportAndReturnsNarrative: string;
    engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
  }>;
  onSaveStep5PermitsAndInsurance: (
    data: PermitsComplianceAndInsuranceStep5Data,
    progress: number
  ) => Promise<void>;
  onGenerateAiPermitsAndInsurance: (params: {
    selectedTrack: ProductTrackType;
    otherProductTrackText?: string;
    currentRegulatorySectorPosture?: RegulatorySectorPostureType | '';
    currentDataPrivacyPosture?: DataPrivacyPostureType | '';
    currentInsuranceCoverageBundle?: InsuranceCoverageBundleType | '';
    currentEstimatedAnnualInsurancePremium?: number;
    currentSelectedInsuranceProviderName?: string;
    currentComplianceItems?: ComplianceChecklistItem[];
    mode?: 'POPULATE_COMPLIANCE_AND_NARRATIVES' | 'NARRATIVES_ONLY';
  }) => Promise<{
    allowed: boolean;
    reason?: string;
    regulatorySectorPosture: RegulatorySectorPostureType;
    otherRegulatorySectorPostureText: string;
    dataPrivacyPosture: DataPrivacyPostureType;
    otherDataPrivacyPostureText: string;
    insuranceCoverageBundle: InsuranceCoverageBundleType;
    otherInsuranceCoverageBundleText: string;
    estimatedAnnualInsurancePremium: number;
    selectedInsuranceProviderName: string;
    complianceItems: ComplianceChecklistItem[];
    regulatoryAndComplianceNarrative: string;
    insuranceAndLiabilityGovernanceNarrative: string;
    engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
  }>;
  onSaveStep6BlindSpotAudit: (
    data: OperationsBlindSpotAuditStep6Data,
    progress: number
  ) => Promise<void>;
  onGenerateAiBlindSpotAudit: (params: {
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
  }) => Promise<{
    allowed: boolean;
    reason?: string;
    readinessConfidence: OperationsReadinessConfidenceType;
    otherReadinessConfidenceText?: string;
    blindSpots: OperationsBlindSpotItem[];
    executiveOperationsSummaryNarrative: string;
    operationsToFinanceAndTeamHandshakeNarrative: string;
    aiCoachTip?: string;
    engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
  }>;
  userId?: string;
  onParkOpenQuestion: (questionText: string) => Promise<void>;
  onBackToModuleD: () => void;
  onContinueToModuleF?: () => void;
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
      'Core product is automated (e.g., Startup Preflight SaaS or digital portal), paired with a human/partner step like 3-Quote Concierge or group Q&A.',
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

  // Default SaaS / Digital / Hybrid (Startup Preflight style)
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
          'Founder builds Modules B–K with rate-limited Gemini 2.5 Flash/Pro synthesis and publishes live Mom-Test customer surveys.',
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
          'Startup Preflight 3-Quote Concierge Engine + Vetted IE/UK Partner Network',
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
        ? '📨 Requesting 3 Vetted Irish Supplier Quotes (3-Quote Concierge)'
        : isUK
          ? '📨 Requesting 3 Vetted UK Supplier Quotes (3-Quote Concierge)'
          : '📨 Requesting 3 Vetted Supplier Quotes (3-Quote Concierge)',
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
          'Dedicated physical test bench for verifying 375px mobile survey & zero-zoom input compliance (< 1k Single Quote)',
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

const SUPPLIER_REDUNDANCY_POSTURE_OPTIONS: Array<{
  value: SupplierRedundancyPostureType;
  label: string;
  subtitle: string;
  badge: string;
}> = [
  {
    value: 'DUAL_SOURCED_VERIFIED',
    label: 'Dual-Sourced Verified Suppliers (Primary + Pre-Vetted Backup)',
    subtitle:
      'Every critical raw material, component, or courier route has a primary supplier plus at least one tested secondary supplier.',
    badge: 'Recommended',
  },
  {
    value: 'BUFFER_STOCK_HELD',
    label: 'Safety Buffer Inventory Held On-Site (14–30 Days Stock)',
    subtitle:
      'You hold physical buffer stock of raw materials, packaging, or finished blanks to absorb supplier lead-time spikes.',
    badge: 'Maker & Physical',
  },
  {
    value: 'CLOUD_MULTI_REGION_FAILOVER',
    label: 'Cloud Multi-Provider / Deterministic API Failover',
    subtitle:
      'Managed cloud infrastructure with automated rate-limit circuit breakers, daily database backups, and deterministic fallback.',
    badge: 'SaaS & Digital',
  },
  {
    value: 'SINGLE_SOURCE_CONTRACTED',
    label: 'Contracted Primary Partner with SLA Notice Period',
    subtitle:
      'Single specialist manufacturer, lab, or platform provider under written SLA with contractual notice and escrow/tooling protection.',
    badge: 'Contract SLA',
  },
  {
    value: 'OTHER',
    label: 'Other (Custom Supply-Chain & Redundancy Posture)',
    subtitle:
      'Describe your custom sourcing, vertical integration, or hybrid redundancy strategy in your own words.',
    badge: 'Custom Posture',
  },
];

const PROJECT_RISK_CATEGORY_OPTIONS: Array<{
  value: ProjectRiskCategoryType;
  label: string;
  shortLabel: string;
}> = [
  {
    value: 'TECHNICAL_PRODUCTION',
    label: '⚙️ Technical, Production & Quality Risk',
    shortLabel: 'Technical / Production',
  },
  {
    value: 'COMMERCIAL_MARKET',
    label: '📈 Commercial, Customer Adoption & Channel Risk',
    shortLabel: 'Commercial / Market',
  },
  {
    value: 'FINANCIAL_SUPPLY_CHAIN',
    label: '💶 Financial, Cashflow & Supply-Chain Risk',
    shortLabel: 'Financial / Supply-Chain',
  },
  {
    value: 'MANAGERIAL_REGULATORY',
    label: '🛡️ Managerial, Key-Person & Regulatory Compliance Risk',
    shortLabel: 'Managerial / Regulatory',
  },
  {
    value: 'OTHER',
    label: '✨ Other (Custom Project Risk Category)',
    shortLabel: 'Other / Custom',
  },
];

const RESIDUAL_RISK_RATING_OPTIONS: Array<{
  value: ResidualRiskRatingType;
  label: string;
}> = [
  {
    value: 'LOW',
    label: '🟢 Low Residual Risk (Controlled & Monitored)',
  },
  {
    value: 'MEDIUM',
    label: '🟡 Medium Residual Risk (Active Contingency Ready)',
  },
  {
    value: 'HIGH',
    label: '🔴 High Residual Risk (⚠️ Needs Stronger Mitigation for Grants)',
  },
  {
    value: 'OTHER',
    label: '✨ Other (Custom Residual Risk Rating)',
  },
];

function buildDefaultStep3DataForPlan(
  plan: ActiveStartupPlan,
  selectedCountry: SupportedCountryCode
): RiskRegisterStep3Data {
  const saved = plan.moduleEData?.riskRegister;
  if (saved && saved.riskItems && saved.riskItems.length > 0) {
    return {
      supplierRedundancyPosture:
        saved.supplierRedundancyPosture || 'DUAL_SOURCED_VERIFIED',
      otherSupplierRedundancyPostureText:
        saved.otherSupplierRedundancyPostureText || '',
      leadTimeBufferDays: saved.leadTimeBufferDays ?? 14,
      primarySuppliersSummary: saved.primarySuppliersSummary || '',
      backupSuppliersSummary: saved.backupSuppliersSummary || '',
      riskItems: saved.riskItems,
      supplyChainResilienceNarrative:
        saved.supplyChainResilienceNarrative || '',
      riskManagementGovernanceNarrative:
        saved.riskManagementGovernanceNarrative || '',
      lastSavedAt: saved.lastSavedAt,
      aiEngineUsed: saved.aiEngineUsed,
    };
  }

  const track =
    plan.moduleDData?.productVehicle?.productTrack ||
    detectRecommendedProductTrack(plan);
  const isPhysical = track === 'PHYSICAL_PRODUCT_ECOM';
  const isService = track === 'PRODUCTIZED_SERVICE_AGENCY';
  const isIE = selectedCountry === 'IE';
  const isUK = selectedCountry === 'GB';
  const currencySymbol = plan.baseCurrency === 'GBP' ? '£' : '€';
  const cleanTitle = (plan.title || 'Our Venture').trim();

  return {
    supplierRedundancyPosture: isPhysical
      ? 'DUAL_SOURCED_VERIFIED'
      : isService
        ? 'DUAL_SOURCED_VERIFIED'
        : 'CLOUD_MULTI_REGION_FAILOVER',
    otherSupplierRedundancyPostureText: '',
    leadTimeBufferDays: isPhysical ? 21 : isService ? 7 : 3,
    primarySuppliersSummary: isPhysical
      ? isIE
        ? 'Primary raw material, packaging, and tracked parcel courier partners in Ireland with agreed trade account terms and quality specifications.'
        : isUK
          ? 'Primary raw material, packaging, and tracked parcel courier partners in the UK with agreed trade account terms and quality specifications.'
          : 'Primary raw material, packaging, and tracked courier suppliers with agreed lead-time SLAs and quality specifications.'
      : isService
        ? 'Core delivery workflow stack, client onboarding tools, and primary specialist delivery resources.'
        : 'Managed cloud application hosting, PostgreSQL database cluster, Stripe checkout webhooks, and primary AI/API gateway.',
    backupSuppliersSummary: isPhysical
      ? isIE
        ? 'Pre-vetted secondary Irish/EU material & packaging suppliers (aligned with Appendix C 3-quote bench) plus secondary tracked courier account.'
        : isUK
          ? 'Pre-vetted secondary UK material & packaging suppliers (aligned with 3-quote procurement bench) plus secondary tracked courier account.'
          : 'Pre-vetted secondary material & packaging suppliers plus backup tracked courier account.'
      : isService
        ? 'Vetted bench of associate specialists under NDA and standardized SOP playbooks for seamless handover.'
        : 'Automated daily off-site database snapshots, hard API rate-limit circuit breakers, and secondary transactional email/API failover.',
    riskItems: [
      {
        id: 'risk-1',
        riskCategory: 'TECHNICAL_PRODUCTION',
        riskTitle: isPhysical
          ? `Production Bottleneck, Equipment Downtime or Batch Quality Variance for ${cleanTitle}`
          : isService
            ? `Service Delivery Capacity Bottleneck or Scope Creep on Client Sprints`
            : `Core Platform Reliability, API Latency or V1 Feature Scope Overrun`,
        likelihoodScore: 3,
        impactScore: 4,
        grossRiskScore: 12,
        mitigationAndContingencyPlan: isPhysical
          ? 'Enforce a standardized 5-stage incoming material & pre-dispatch QC checklist, maintain critical machine wear-spares on-site, and batch-prepare core sub-assemblies ahead of peak demand.'
          : isService
            ? 'Standardize client deliverables into fixed-scope sprint templates with explicit change-order gates and automated intake checklists.'
            : 'Enforce a ruthless V1 scope filter (Module D), automated CI/CD regression testing, and deterministic fallback guardrails so core workflows remain 99.9% available.',
        ownerAndWorkPackage: 'Founder / Technical & Production Lead (WP1 / WP2)',
        residualRiskRating: 'LOW',
      },
      {
        id: 'risk-2',
        riskCategory: 'COMMERCIAL_MARKET',
        riskTitle:
          'Slower Initial Customer Conversion or Seasonal Demand Concentration',
        likelihoodScore: 3,
        impactScore: 4,
        grossRiskScore: 12,
        mitigationAndContingencyPlan:
          'Convert pre-qualified Module C survey & waitlist leads first, pair direct D2C/self-serve acquisition with recurring B2B/partner accounts, and validate willingness-to-pay before scaling ad spend.',
        ownerAndWorkPackage: 'Founder / Commercial Lead (WP3 — Go-to-Market)',
        residualRiskRating: 'LOW',
      },
      {
        id: 'risk-3',
        riskCategory: 'FINANCIAL_SUPPLY_CHAIN',
        riskTitle: isPhysical
          ? isIE
            ? `Raw Material Price Inflation, Supplier Lead-Time Delays or IE LEO Grant Reimbursement Timing Gap`
            : isUK
              ? `Raw Material Price Inflation, Supplier Lead-Time Delays or UK Quarterly Grant Claim Timing Gap`
              : `Raw Material Price Inflation, Supplier Lead-Time Delays or Working Capital Timing Gap`
          : isIE
            ? `Third-Party API / Cloud Cost Spikes or IE LEO Grant Reimbursement Cashflow Timing Gap`
            : isUK
              ? `Third-Party API / Cloud Cost Spikes or UK Innovate UK / Start Up Loan Working Capital Timing Gap`
              : `Third-Party API / Cloud Cost Spikes or Working Capital Timing Gap`,
        likelihoodScore: 3,
        impactScore: 4,
        grossRiskScore: 12,
        mitigationAndContingencyPlan: isPhysical
          ? isIE
            ? `Maintain dual-sourced Irish/EU suppliers (backed by 3 written quotes >= ${currencySymbol}1,000 in Appendix C), hold 21 days of buffer stock, and ring-fence working capital to bridge retrospective IE LEO grant claims.`
            : isUK
              ? `Maintain dual-sourced UK suppliers (backed by 3 written quotes >= ${currencySymbol}1,000), hold 21 days of buffer stock, and ring-fence working capital for British Business Bank Start Up Loan / Innovate UK quarterly milestones.`
              : `Maintain dual-sourced suppliers (backed by 3 written quotes >= ${currencySymbol}1,000), hold 21 days of buffer stock, and protect unit gross margins in Module G.`
          : `Enforce hard daily API/cloud cost circuit breakers, maintain 3-quote vendor comparisons for contracts >= ${currencySymbol}1,000, and stage discretionary spend against verified revenue milestones.`,
        ownerAndWorkPackage: 'Founder / Finance & Ops Lead (WP2 / Module I)',
        residualRiskRating: 'LOW',
      },
      {
        id: 'risk-4',
        riskCategory: 'MANAGERIAL_REGULATORY',
        riskTitle: isPhysical
          ? 'Single-Founder Bandwidth Constraint & Product Safety / Workshop Health & Safety Compliance'
          : 'Founder Bandwidth Constraint & GDPR / Data Privacy / IP Protection Compliance',
        likelihoodScore: 2,
        impactScore: 4,
        grossRiskScore: 8,
        mitigationAndContingencyPlan: isPhysical
          ? 'Document all 5 production stages in a repeatable SOP manual so part-time workshop assistance can be onboarded smoothly; maintain product liability insurance, safety extraction, and batch traceability.'
          : 'Document all core operational SOPs, enforce least-privilege access & encrypted data storage (GDPR compliant), and automate routine customer onboarding.',
        ownerAndWorkPackage: 'Founding Team / Operations Lead (WP1 / WP4)',
        residualRiskRating: 'LOW',
      },
    ],
    supplyChainResilienceNarrative: '',
    riskManagementGovernanceNarrative: '',
  };
}

const SUPPORT_OPERATING_MODEL_OPTIONS: Array<{
  value: SupportOperatingModelType;
  label: string;
  subtitle: string;
  badge: string;
}> = [
  {
    value: 'SELF_SERVE_DOCS_PLUS_FOUNDER_TIER2',
    label: 'Self-Serve Help Center / FAQ + Founder Escalation',
    subtitle:
      '80% of common questions resolved via self-serve guides/status tracking; complex edge cases escalate to the founder.',
    badge: 'Lean & Scalable',
  },
  {
    value: 'DIRECT_FOUNDER_CONCIERGE_EMAIL_WHATSAPP',
    label: 'Direct Founder Concierge (Email / WhatsApp / Phone)',
    subtitle:
      'High-touch personal communication for bespoke orders, high-ticket B2B accounts, or early-adopter cohorts.',
    badge: 'High-Touch Trust',
  },
  {
    value: 'AI_TRIAGE_CHATBOT_PLUS_HUMAN_FALLBACK',
    label: 'Automated Order / Ticket Triage + Human Escalation',
    subtitle:
      'Instant automated order-tracking, refund/return intake, or AI answers 24/7 with seamless human fallback.',
    badge: '24/7 Automated Triage',
  },
  {
    value: 'DEDICATED_PART_TIME_SUPPORT_AGENT',
    label: 'Part-Time Customer Success / Admin Assistant',
    subtitle:
      'Dedicated part-time customer service or operations assistant handling daily inbox, returns, and scheduling.',
    badge: 'Delegated Ops',
  },
  {
    value: 'OTHER',
    label: 'Other (Custom Customer Support Model)',
    subtitle:
      'Channel partner support, distributor-managed support, or another custom model—describe below.',
    badge: 'Custom Support Model',
  },
];

const SUPPORT_RESPONSE_SLA_OPTIONS: Array<{
  value: SupportResponseSlaType;
  label: string;
  subtitle: string;
}> = [
  {
    value: 'INSTANT_AUTOMATED_24_7',
    label: 'Instant Automated Triage (< 5 Mins) + Same-Day Follow-Up',
    subtitle:
      'Immediate automated acknowledgment and tracking status, with human follow-up the same business day.',
  },
  {
    value: 'SAME_BUSINESS_DAY_UNDER_4H',
    label: 'Same Business Day (< 4 Business Hours)',
    subtitle:
      'Fast B2B or premium D2C response window during core working hours (Mon–Fri).',
  },
  {
    value: 'NEXT_BUSINESS_DAY_24H',
    label: 'Within 1 Business Day (24 Hours)',
    subtitle:
      'Balanced SLA for solo makers and lean teams batching production and customer inbox once per day.',
  },
  {
    value: 'FORTY_EIGHT_HOUR_STANDARD',
    label: 'Standard 48-Hour Resolution Window',
    subtitle:
      'Low-pressure 2-business-day response commitment for non-urgent inquiries.',
  },
  {
    value: 'OTHER',
    label: 'Other (Custom Support Response SLA)',
    subtitle:
      'Specify your custom tiered SLA or enterprise contract response window.',
  },
];

const RETURNS_AND_WARRANTY_POLICY_OPTIONS: Array<{
  value: ReturnsAndWarrantyPolicyType;
  label: string;
  subtitle: string;
  badge: string;
}> = [
  {
    value: 'STATUTORY_14_DAY_COOLING_OFF',
    label: '14-Day Statutory Distance-Selling Cooling-Off Window',
    subtitle:
      'Standard 14-day return window for unused stock items (customer covers return postage unless faulty) + statutory fault cover.',
    badge: 'Standard D2C / E-Com',
  },
  {
    value: 'BESPOKE_PERSONALIZED_EXEMPT_TRANSIT_REPLACE',
    label: 'Bespoke / Made-to-Order Exemption + Free Transit Damage Replacement',
    subtitle:
      'Custom-engraved or made-to-spec items are exempt from change-of-mind returns, backed by a 100% photo-verified transit damage replacement guarantee.',
    badge: 'Artisan / Custom Spec',
  },
  {
    value: 'THIRTY_DAY_MONEY_BACK_OR_TRIAL',
    label: '30-Day Satisfaction Guarantee / Self-Serve Cancellation',
    subtitle:
      'Frictionless 30-day money-back guarantee or 1-click subscription cancellation to maximize buyer confidence.',
    badge: 'SaaS & Digital',
  },
  {
    value: 'MILESTONE_ACCEPTANCE_SIGN_OFF',
    label: 'B2B Milestone Acceptance Sign-Off & Scope Remedy Guarantee',
    subtitle:
      'Deliverables signed off at structured project gates with a defined 14-day bug/remedy window included.',
    badge: 'B2B / Service Sprints',
  },
  {
    value: 'OTHER',
    label: 'Other (Custom Returns, Refund & Warranty Policy)',
    subtitle:
      'Specify your custom industry warranty, exchange-only, or commercial SLA terms.',
    badge: 'Custom Policy',
  },
];

const QC_GATE_TIMING_OPTIONS: Array<{
  value: QcGateTimingType;
  label: string;
  shortLabel: string;
}> = [
  {
    value: 'INCOMING_MATERIAL_OR_DATA_CHECK',
    label: 'Gate 1: Incoming Material / Component / Data Verification',
    shortLabel: 'Incoming Check',
  },
  {
    value: 'IN_PROCESS_BUILD_OR_CODE_REVIEW',
    label: 'Gate 2: In-Process Build / Tolerance / Code & Staging QA',
    shortLabel: 'In-Process QA',
  },
  {
    value: 'PRE_DISPATCH_FINAL_INSPECTION',
    label: 'Gate 3: Pre-Dispatch Final Inspection / Release Smoke Test',
    shortLabel: 'Pre-Dispatch Gate',
  },
  {
    value: 'POST_DELIVERY_CUSTOMER_CHECKIN',
    label: 'Gate 4: Post-Delivery Unboxing / Day-7 Onboarding Check-In',
    shortLabel: 'Post-Delivery Check',
  },
  {
    value: 'OTHER',
    label: 'Other (Custom Quality Control Gate)',
    shortLabel: 'Custom QC Gate',
  },
];

function buildDefaultStep4DataForPlan(
  plan: ActiveStartupPlan,
  selectedCountry: SupportedCountryCode
): SupportReturnsAndQcStep4Data {
  const saved = plan.moduleEData?.supportReturnsAndQc;
  if (saved && saved.qcCheckpoints && saved.qcCheckpoints.length > 0) {
    return {
      supportOperatingModel:
        saved.supportOperatingModel || 'SELF_SERVE_DOCS_PLUS_FOUNDER_TIER2',
      otherSupportOperatingModelText:
        saved.otherSupportOperatingModelText || '',
      supportResponseSla:
        saved.supportResponseSla || 'NEXT_BUSINESS_DAY_24H',
      otherSupportResponseSlaText: saved.otherSupportResponseSlaText || '',
      returnsAndWarrantyPolicy:
        saved.returnsAndWarrantyPolicy || 'STATUTORY_14_DAY_COOLING_OFF',
      otherReturnsAndWarrantyPolicyText:
        saved.otherReturnsAndWarrantyPolicyText || '',
      estimatedReturnOrRefundRatePercent:
        saved.estimatedReturnOrRefundRatePercent ?? 2.0,
      costPerReturnOrRemakeIncident:
        saved.costPerReturnOrRemakeIncident ?? 20,
      warrantyDurationMonths: saved.warrantyDurationMonths ?? 12,
      qcCheckpoints: saved.qcCheckpoints,
      qualityControlAndStandardsNarrative:
        saved.qualityControlAndStandardsNarrative || '',
      customerSupportAndReturnsNarrative:
        saved.customerSupportAndReturnsNarrative || '',
      lastSavedAt: saved.lastSavedAt,
      aiEngineUsed: saved.aiEngineUsed,
    };
  }

  const track =
    plan.moduleDData?.productVehicle?.productTrack ||
    detectRecommendedProductTrack(plan);
  const isPhysical =
    track === 'PHYSICAL_PRODUCT_ECOM' ||
    track === 'HYBRID_HARDWARE_SOFTWARE';
  const isService = track === 'PRODUCTIZED_SERVICE_AGENCY';
  const isIE = selectedCountry === 'IE';
  const isUK = selectedCountry === 'GB';

  return {
    supportOperatingModel: isPhysical || isService
      ? 'DIRECT_FOUNDER_CONCIERGE_EMAIL_WHATSAPP'
      : 'SELF_SERVE_DOCS_PLUS_FOUNDER_TIER2',
    otherSupportOperatingModelText: '',
    supportResponseSla: isPhysical || isService
      ? 'NEXT_BUSINESS_DAY_24H'
      : 'SAME_BUSINESS_DAY_UNDER_4H',
    otherSupportResponseSlaText: '',
    returnsAndWarrantyPolicy: isPhysical
      ? 'STATUTORY_14_DAY_COOLING_OFF'
      : isService
        ? 'MILESTONE_ACCEPTANCE_SIGN_OFF'
        : 'THIRTY_DAY_MONEY_BACK_OR_TRIAL',
    otherReturnsAndWarrantyPolicyText: '',
    estimatedReturnOrRefundRatePercent: isPhysical ? 2.5 : isService ? 1.5 : 2.0,
    costPerReturnOrRemakeIncident: isPhysical ? 24 : isService ? 85 : 12,
    warrantyDurationMonths: isPhysical ? 12 : 0,
    qcCheckpoints: isPhysical
      ? [
          {
            id: 'qc-1',
            gateTiming: 'INCOMING_MATERIAL_OR_DATA_CHECK',
            checkpointName:
              'Incoming Raw Material, Component & Packaging Inspection',
            passFailStandard:
              '100% visual check of incoming stock against specification sheet, zero structural defects, and supplier batch number logged on arrival.',
            defectFallbackAction:
              'Quarantine non-conforming batch immediately, photograph defects for supplier credit note, and draw from safety buffer stock.',
            ownerRole: 'Founder / Production Lead',
          },
          {
            id: 'qc-2',
            gateTiming: 'IN_PROCESS_BUILD_OR_CODE_REVIEW',
            checkpointName:
              'In-Process Dimensional Tolerance & Surface Finish Check',
            passFailStandard:
              'Verify assembly tolerances, structural integrity, and finish cure quality before final branding or custom detailing is applied.',
            defectFallbackAction:
              'Re-machine or re-finish unit at the bench before packaging so zero sub-standard units enter finished goods inventory.',
            ownerRole: 'Founder / Workshop Lead',
          },
          {
            id: 'qc-3',
            gateTiming: 'PRE_DISPATCH_FINAL_INSPECTION',
            checkpointName:
              'Pre-Dispatch Final Inspection, Care Guide & Protective Packaging Gate',
            passFailStandard: isIE
              ? 'Final visual inspection under bench lighting, care/safety insert (IE Consumer Rights Act 2022 compliant) included, corner protection fitted, and tracked courier label verified.'
              : isUK
                ? 'Final visual inspection under bench lighting, care/safety insert (UK Consumer Rights Act 2015 compliant) included, corner protection fitted, and tracked courier label verified.'
                : 'Final visual inspection under bench lighting, care/safety insert included, corner protection fitted, and tracked courier label verified.',
            defectFallbackAction:
              'Hold shipment, replace unit or packaging immediately, and log root cause in weekly QC ledger.',
            ownerRole: 'Founder / Dispatch Lead',
          },
        ]
      : isService
        ? [
            {
              id: 'qc-1',
              gateTiming: 'INCOMING_MATERIAL_OR_DATA_CHECK',
              checkpointName:
                'Client Intake Brief, Scope Boundary & Asset Readiness Gate',
              passFailStandard:
                'Signed statement of work, complete client intake questionnaire, and verified access credentials prior to sprint kickoff.',
              defectFallbackAction:
                'Pause kickoff timer and send automated missing-asset checklist before allocating delivery hours.',
              ownerRole: 'Founder / Account Lead',
            },
            {
              id: 'qc-2',
              gateTiming: 'IN_PROCESS_BUILD_OR_CODE_REVIEW',
              checkpointName:
                'Mid-Sprint Internal QA & Deliverable Peer Review',
              passFailStandard:
                '100% of deliverables checked against standard SOP rubric and client brief before client preview.',
              defectFallbackAction:
                'Resolve gaps internally prior to client review meeting to prevent revision loops.',
              ownerRole: 'Delivery Lead',
            },
            {
              id: 'qc-3',
              gateTiming: 'PRE_DISPATCH_FINAL_INSPECTION',
              checkpointName:
                'Final Handover Sign-Off & Post-Delivery Satisfaction Check',
              passFailStandard:
                'Client milestone sign-off recorded, handover documentation delivered, and 7-day post-delivery check-in scheduled.',
              defectFallbackAction:
                'Execute 1-round scope remedy within 48 business hours under service guarantee.',
              ownerRole: 'Founder / Client Success Lead',
            },
          ]
        : [
            {
              id: 'qc-1',
              gateTiming: 'INCOMING_MATERIAL_OR_DATA_CHECK',
              checkpointName:
                'Input Validation, Schema Integrity & Upstream API Guardrails',
              passFailStandard:
                'Strict server-side input validation, tenant/plan ownership verification, and rate-limit checks on 100% of incoming requests.',
              defectFallbackAction:
                'Fail closed to deterministic fallback response and log structured warning without exposing sensitive state.',
              ownerRole: 'Technical Lead',
            },
            {
              id: 'qc-2',
              gateTiming: 'IN_PROCESS_BUILD_OR_CODE_REVIEW',
              checkpointName:
                'Automated TypeScript, Lint & Staging Regression Gate',
              passFailStandard:
                'Zero TypeScript compilation errors, verified database migration parity, and passing core user-journey smoke tests in staging.',
              defectFallbackAction:
                'Block production deployment automatically until build and regression checks pass 100%.',
              ownerRole: 'Founder / Engineering Lead',
            },
            {
              id: 'qc-3',
              gateTiming: 'POST_DELIVERY_CUSTOMER_CHECKIN',
              checkpointName:
                'Post-Onboarding Activation Check & Support Telemetry Review',
              passFailStandard:
                'User completes core activation workflow within first session with zero unhandled client/server exceptions.',
              defectFallbackAction:
                'Trigger proactive founder check-in email and patch UX friction point in next weekly release.',
              ownerRole: 'Founder / Product Lead',
            },
          ],
    qualityControlAndStandardsNarrative: '',
    customerSupportAndReturnsNarrative: '',
  };
}

const REGULATORY_SECTOR_POSTURE_OPTIONS: Array<{
  value: RegulatorySectorPostureType;
  label: string;
  subtitle: string;
  badge: string;
}> = [
  {
    value: 'STANDARD_COMMERCIAL_UNREGULATED',
    label: 'Standard Commercial / Digital / B2B Operations',
    subtitle:
      'Standard corporate, tax clearance, workplace health & safety, and GDPR compliance with no specialist sector license required.',
    badge: 'Standard Commercial',
  },
  {
    value: 'PHYSICAL_PRODUCT_SAFETY_CE_UKCA',
    label: 'Physical Product Safety, Labelling & Traceability',
    subtitle:
      'Consumer or commercial physical products requiring general product safety files, batch traceability, and CE / UKCA / food-contact declarations.',
    badge: 'Physical & Craft',
  },
  {
    value: 'FOOD_BEV_HYGIENE_HACCP',
    label: 'Food, Beverage, Hospitality or Cosmetic Hygiene (HACCP)',
    subtitle:
      'Food business registration, Environmental Health inspection, HACCP food safety management, and allergen traceability.',
    badge: 'Food & Hygiene',
  },
  {
    value: 'FINTECH_HEALTH_REGULATED',
    label: 'Regulated Sector (Fintech, MedTech, Childcare, Trade License)',
    subtitle:
      'Requires statutory professional authorization, financial/clinical regulatory sandbox, or statutory vetting before commercial launch.',
    badge: 'Regulated Sector',
  },
  {
    value: 'OTHER',
    label: 'Other (Custom Regulatory or Licensing Posture)',
    subtitle:
      'Describe your custom industry licensing, environmental permit, or hybrid regulatory posture below.',
    badge: 'Custom Posture',
  },
];

const DATA_PRIVACY_POSTURE_OPTIONS: Array<{
  value: DataPrivacyPostureType;
  label: string;
  subtitle: string;
  badge: string;
}> = [
  {
    value: 'MINIMAL_B2B_CONTACT_DATA',
    label: 'Minimal B2B Contact & Invoicing Records Only',
    subtitle:
      'Standard business contact names, emails, and billing records stored in encrypted cloud accounting/CRM tools.',
    badge: 'Low PII Footprint',
  },
  {
    value: 'STANDARD_CUSTOMER_CRM_COOKIES',
    label: 'D2C / E-Commerce Customer Orders, Waitlist & Cookie Consent',
    subtitle:
      'Processes consumer shipping addresses, marketing opt-ins, and analytics cookies under a published GDPR Privacy Notice.',
    badge: 'Standard D2C / Web',
  },
  {
    value: 'B2B_DATA_PROCESSOR_DPA_SCC',
    label: 'Cloud SaaS / B2B Data Processor (Article 28 DPAs & Sub-Processors)',
    subtitle:
      'Processes client workspace or customer data under formal Data Processing Agreements (DPAs), encryption at rest, and RBAC.',
    badge: 'SaaS & AI Platform',
  },
  {
    value: 'HIGH_RISK_SPECIAL_CATEGORY_DPIA',
    label: 'Special Category / Health / Biometric / Minor Data (Formal DPIA)',
    subtitle:
      'Processes sensitive personal data requiring a formal Data Protection Impact Assessment (DPIA) and strict access logging.',
    badge: 'High-Sensitivity DPIA',
  },
  {
    value: 'OTHER',
    label: 'Other (Custom Data Privacy & Security Posture)',
    subtitle:
      'Specify your custom data residency, on-premise, or sector-specific privacy governance model.',
    badge: 'Custom Privacy',
  },
];

const INSURANCE_COVERAGE_BUNDLE_OPTIONS: Array<{
  value: InsuranceCoverageBundleType;
  label: string;
  subtitle: string;
  badge: string;
}> = [
  {
    value: 'PUBLIC_EMPLOYERS_CORE',
    label: 'Core Public Liability + Employers’ Liability Pack',
    subtitle:
      'Protects against third-party injury/property damage and statutory employee/contractor liability.',
    badge: 'Core Commercial',
  },
  {
    value: 'TECH_SAAS_PI_CYBER',
    label: 'Tech / SaaS Professional Indemnity (PI) + Cyber & Data Liability',
    subtitle:
      'Covers software errors/omissions, B2B contract indemnity, cyber incident response, and data breach liability.',
    badge: 'SaaS, AI & Service',
  },
  {
    value: 'PRODUCT_PUBLIC_LIABILITY_STOCK',
    label: 'Product Liability + Public Liability + Workshop Tools & Stock',
    subtitle:
      'Covers physical products sold to customers, craft markets/trade shows, and workshop machinery/stock against fire or theft.',
    badge: 'Physical & Makers',
  },
  {
    value: 'COMPREHENSIVE_COMMERCIAL_ALL_RISK',
    label: 'Comprehensive Commercial Combined + Directors & Officers (D&O)',
    subtitle:
      'Full commercial package combining Public/Product/PI/Employers’ Liability, Cyber, plus D&O protection for funded boards.',
    badge: 'Investor & Enterprise Ready',
  },
  {
    value: 'OTHER',
    label: 'Other (Custom Insurance Coverage Bundle)',
    subtitle:
      'Specify your custom marine transit, clinical trial, trade credit, or bespoke commercial policy bundle.',
    badge: 'Custom Bundle',
  },
];

const COMPLIANCE_ITEM_CATEGORY_OPTIONS: Array<{
  value: ComplianceItemCategoryType;
  label: string;
}> = [
  {
    value: 'CORPORATE_TAX_GRANT_CLEARANCE',
    label: '🏛️ Corporate Registration & Tax Clearance (Grant Prerequisite)',
  },
  {
    value: 'DATA_PRIVACY_GDPR_SECURITY',
    label: '🔒 Data Privacy, GDPR & Cyber Security Governance',
  },
  {
    value: 'HEALTH_SAFETY_PREMISES',
    label: '🦺 Workplace Health & Safety Statement / Risk Assessment',
  },
  {
    value: 'SECTOR_PRODUCT_LICENSE',
    label: '📦 Product Safety, Labelling, Hygiene or Sector License',
  },
  {
    value: 'COMMERCIAL_INSURANCE_POLICY',
    label: '🛡️ Commercial Insurance Policy & Indemnity Cover',
  },
  {
    value: 'OTHER',
    label: '✨ Other (Custom Compliance / Regulatory Requirement)',
  },
];

const COMPLIANCE_ITEM_STATUS_OPTIONS: Array<{
  value: ComplianceItemStatusType;
  label: string;
}> = [
  {
    value: 'VERIFIED_COMPLETE',
    label: '✅ Verified Complete / Active',
  },
  {
    value: 'IN_PROGRESS',
    label: '⏳ In Progress (Being Finalized)',
  },
  {
    value: 'PLANNED_BEFORE_LAUNCH',
    label: '🗓️ Planned Prior to Commercial Launch / Grant Drawdown',
  },
  {
    value: 'NOT_APPLICABLE',
    label: '⚪ Not Applicable (Exempt)',
  },
  {
    value: 'OTHER',
    label: '✨ Other (Custom Compliance Status)',
  },
];

function buildDefaultStep5DataForPlan(
  plan: ActiveStartupPlan,
  selectedCountry: SupportedCountryCode
): PermitsComplianceAndInsuranceStep5Data {
  const saved = plan.moduleEData?.permitsAndInsurance;
  if (saved && saved.complianceItems && saved.complianceItems.length > 0) {
    return {
      regulatorySectorPosture:
        saved.regulatorySectorPosture || 'STANDARD_COMMERCIAL_UNREGULATED',
      otherRegulatorySectorPostureText:
        saved.otherRegulatorySectorPostureText || '',
      dataPrivacyPosture:
        saved.dataPrivacyPosture || 'B2B_DATA_PROCESSOR_DPA_SCC',
      otherDataPrivacyPostureText: saved.otherDataPrivacyPostureText || '',
      insuranceCoverageBundle:
        saved.insuranceCoverageBundle || 'TECH_SAAS_PI_CYBER',
      otherInsuranceCoverageBundleText:
        saved.otherInsuranceCoverageBundleText || '',
      estimatedAnnualInsurancePremium:
        saved.estimatedAnnualInsurancePremium ?? 850,
      selectedInsuranceProviderName: saved.selectedInsuranceProviderName || '',
      complianceItems: saved.complianceItems,
      regulatoryAndComplianceNarrative:
        saved.regulatoryAndComplianceNarrative || '',
      insuranceAndLiabilityGovernanceNarrative:
        saved.insuranceAndLiabilityGovernanceNarrative || '',
      lastSavedAt: saved.lastSavedAt,
      aiEngineUsed: saved.aiEngineUsed,
    };
  }

  const track =
    plan.moduleDData?.productVehicle?.productTrack ||
    detectRecommendedProductTrack(plan);
  const isPhysical =
    track === 'PHYSICAL_PRODUCT_ECOM' ||
    track === 'HYBRID_HARDWARE_SOFTWARE';
  const isFoodHosp = /food|bev|hospitality|cafe|bakery|cosmetic/i.test(
    `${plan.industryCategory || ''} ${plan.moduleDData?.productVehicle?.otherProductTrackText || ''}`
  );
  const isSoftware =
    track === 'SAAS_SOFTWARE_AI' ||
    track === 'HYBRID_HARDWARE_SOFTWARE' ||
    track === 'MARKETPLACE_PLATFORM';

  const isIE = selectedCountry === 'IE';
  const isGB = selectedCountry === 'GB';
  const defaultPremium = isSoftware
    ? isGB
      ? 850
      : 950
    : isPhysical || isFoodHosp
      ? isGB
        ? 1100
        : 1250
      : isGB
        ? 550
        : 650;

  return {
    regulatorySectorPosture: isFoodHosp
      ? 'FOOD_BEV_HYGIENE_HACCP'
      : isPhysical
        ? 'PHYSICAL_PRODUCT_SAFETY_CE_UKCA'
        : 'STANDARD_COMMERCIAL_UNREGULATED',
    otherRegulatorySectorPostureText: '',
    dataPrivacyPosture: isSoftware
      ? 'B2B_DATA_PROCESSOR_DPA_SCC'
      : 'STANDARD_CUSTOMER_CRM_COOKIES',
    otherDataPrivacyPostureText: '',
    insuranceCoverageBundle: isSoftware
      ? 'TECH_SAAS_PI_CYBER'
      : isPhysical || isFoodHosp
        ? 'PRODUCT_PUBLIC_LIABILITY_STOCK'
        : 'PUBLIC_EMPLOYERS_CORE',
    otherInsuranceCoverageBundleText: '',
    estimatedAnnualInsurancePremium: defaultPremium,
    selectedInsuranceProviderName: isIE
      ? isSoftware
        ? 'Hiscox Ireland / Arachas Cyber & Tech PI'
        : 'Allianz Ireland / Arachas Commercial Combined'
      : isGB
        ? isSoftware
          ? 'Superscript / Hiscox UK Tech & Cyber PI'
          : 'Simply Business / Aviva UK Commercial Combined'
        : 'Commercial Startup Insurance Broker',
    complianceItems: [
      {
        id: 'comp-1',
        category: 'CORPORATE_TAX_GRANT_CLEARANCE',
        requirementTitle: isIE
          ? 'CRO Incorporation & Revenue eTax Clearance Certificate (TC2 via ROS)'
          : isGB
            ? 'Companies House Incorporation & HMRC Corporation Tax UTR Registration'
            : 'Corporate Registration & Tax Clearance Certificate',
        regulatoryBody: isIE
          ? 'Companies Registration Office (CRO) & Revenue Commissioners (ROS.ie)'
          : isGB
            ? 'Companies House & HM Revenue & Customs (HMRC)'
            : 'National Corporate & Tax Registry',
        status: 'IN_PROGRESS',
        evidenceOrReferenceNote: isIE
          ? 'Mandatory prerequisite before any Local Enterprise Office (LEO) or Enterprise Ireland grant drawdown can be paid out.'
          : isGB
            ? 'Active Companies House registration number and UK business bank account required for Innovate UK & Start Up Loans.'
            : 'Required for corporate banking and grant eligibility.',
        estimatedAnnualCost: 0,
      },
      {
        id: 'comp-2',
        category: 'DATA_PRIVACY_GDPR_SECURITY',
        requirementTitle: isIE
          ? 'EU GDPR Privacy Notice, ROPA & Data Processing Agreements (Irish Data Protection Act 2018)'
          : isGB
            ? 'UK GDPR Compliance, Privacy Notice & Annual ICO Data Protection Fee Registration'
            : 'GDPR / Data Privacy Policy, Cookie Consent & Data Processing Agreements',
        regulatoryBody: isIE
          ? 'Data Protection Commission (DPC Ireland — dataprotection.ie)'
          : isGB
            ? "Information Commissioner's Office (ICO UK — ico.org.uk)"
            : 'National Data Protection Authority',
        status: 'IN_PROGRESS',
        evidenceOrReferenceNote: isIE
          ? 'EU/EEA cloud hosting residency verified; Article 28 Data Processing Agreements (DPAs) in place with sub-processors.'
          : isGB
            ? 'ICO Tier 1 Data Protection Fee (£40/yr via Direct Debit) and UK GDPR Privacy & Cookie Policies published.'
            : 'Customer PII encrypted at rest and in transit with clear opt-in consent.',
        estimatedAnnualCost: isGB ? 40 : 0,
      },
      {
        id: 'comp-3',
        category: 'HEALTH_SAFETY_PREMISES',
        requirementTitle: isIE
          ? 'Written Safety Statement & Risk Assessment (Section 20 SHWW Act 2005 via HSA BeSMART.ie)'
          : isGB
            ? 'HSE Health & Safety Policy & Workplace Risk Assessment (HSWA 1974)'
            : 'Workplace Health & Safety Policy & Risk Assessment',
        regulatoryBody: isIE
          ? 'Health and Safety Authority (HSA Ireland — hsa.ie / BeSMART.ie)'
          : isGB
            ? 'Health and Safety Executive (HSE UK — hse.gov.uk)'
            : 'Occupational Health & Safety Authority',
        status: 'PLANNED_BEFORE_LAUNCH',
        evidenceOrReferenceNote: isIE
          ? 'Generated free via HSA BeSMART.ie portal covering workspace ergonomics, electrical safety, and operational hazards.'
          : isGB
            ? 'Documented HSE hazard assessment covering operations, display screen equipment (DSE), and visitor/contractor safety.'
            : 'Covers operational workspace safety and contractor protocols.',
        estimatedAnnualCost: 0,
      },
      {
        id: 'comp-4',
        category:
          isPhysical || isFoodHosp
            ? 'SECTOR_PRODUCT_LICENSE'
            : 'COMMERCIAL_INSURANCE_POLICY',
        requirementTitle: isFoodHosp
          ? isIE
            ? 'HSE Environmental Health Food Business Registration & FSAI HACCP Food Safety Plan'
            : 'Local Council Food Business Registration (28 Days Prior) & FSA SFBB HACCP Pack'
          : isPhysical
            ? isIE
              ? 'EU General Product Safety Regulation (GPSR 2023/988) Technical File, CE Marking & CCPC Labelling'
              : 'UK Product Safety (UKCA / CE Marking), Technical File & OPSS / Trading Standards Traceability'
            : isIE
              ? 'Commercial Professional Indemnity (PI), Cyber Liability & Public/Employers Liability Policy'
              : 'Commercial PI, Cyber & Statutory UK Employers Liability (£5m Min) Insurance Policy',
        regulatoryBody: isFoodHosp
          ? isIE
            ? 'Food Safety Authority of Ireland (FSAI) & HSE Environmental Health Officer (EHO)'
            : 'Food Standards Agency (FSA) & Local Authority Environmental Health'
          : isPhysical
            ? isIE
              ? 'Competition and Consumer Protection Commission (CCPC) & National Standards Authority of Ireland (NSAI)'
              : 'Office for Product Safety and Standards (OPSS) & Local Trading Standards'
            : isIE
              ? 'Central Bank of Ireland Regulated Commercial Insurer / Broker'
              : 'FCA Regulated Commercial Insurer / Broker',
        status: 'PLANNED_BEFORE_LAUNCH',
        evidenceOrReferenceNote:
          isPhysical || isFoodHosp
            ? 'Batch/lot numbering, supplier certificates of conformity, and safety labelling verified before first commercial dispatch.'
            : 'Indicative annual policy estimate synced to Module I Overheads; actual coverage and premium subject to insurer underwriting.',
        estimatedAnnualCost:
          isPhysical || isFoodHosp ? 150 : defaultPremium,
      },
    ],
    regulatoryAndComplianceNarrative: '',
    insuranceAndLiabilityGovernanceNarrative: '',
  };
}

const OPERATIONS_READINESS_CONFIDENCE_OPTIONS: Array<{
  value: OperationsReadinessConfidenceType;
  label: string;
  subtitle: string;
  badge: string;
}> = [
  {
    value: 'READY_FOR_V1_FULFILLMENT',
    label: 'Ready for V1 Commercial Fulfillment & Official Grant Audit',
    subtitle:
      'End-to-end fulfillment SOP, supplier redundancy, 3-gate QC, statutory compliance, and insurance governance are verified.',
    badge: 'Assessor-Ready',
  },
  {
    value: 'NEEDS_PILOT_BATCH_OR_SLA_STRESS_TEST',
    label: 'Ready for V1 Pilot Batch (With SOP Capacity Guardrails)',
    subtitle:
      'Core delivery pipeline and compliance are ready for initial pilot orders while capacity/SLA stress-testing completes.',
    badge: 'Recommended V1',
  },
  {
    value: 'NEEDS_SUPPLIER_OR_3_QUOTE_VERIFICATION',
    label: 'Pending Final Supplier Backup or 3-Quote Equipment Pack',
    subtitle:
      'Operations blueprint is mapped, awaiting final written supplier quotes or secondary backup vendor confirmation.',
    badge: 'Procurement Gate',
  },
  {
    value: 'NEEDS_REGULATORY_OR_INSURANCE_SIGN_OFF',
    label: 'Pending Final Statutory Registration or Insurance Policy Bind',
    subtitle:
      'Awaiting final tax clearance, safety statement sign-off, or formal insurer underwriting quote prior to launch.',
    badge: 'Compliance Gate',
  },
  {
    value: 'OTHER',
    label: '✨ Other (Custom Operational Readiness Posture)',
    subtitle:
      'Specify a phased, seasonal, B2B pilot, or hybrid operational readiness milestone.',
    badge: 'Custom',
  },
];

const OPERATIONS_BLIND_SPOT_CATEGORY_OPTIONS: Array<{
  value: OperationsBlindSpotCategoryType;
  label: string;
}> = [
  {
    value: 'CAPACITY_AND_FULFILLMENT_BOTTLENECK',
    label: '⏱️ Capacity Ceiling & Fulfillment Bottleneck',
  },
  {
    value: 'GRANT_PROCUREMENT_AND_CAPEX_ELIGIBILITY',
    label: '🧾 Equipment CapEx & Grant Procurement Rules',
  },
  {
    value: 'SINGLE_SUPPLIER_AND_CONTINUITY_EXPOSURE',
    label: '🔗 Supplier Redundancy & Single-Point Dependency',
  },
  {
    value: 'UNIT_COGS_AND_RETURN_MARGIN_LEAKAGE',
    label: '🛡️ Returns, QC Gate & Unit Margin Protection',
  },
  {
    value: 'REGULATORY_TAX_AND_INSURANCE_GAP',
    label: '⚖️ Regulatory, Insurance Estimate & Cashflow Bridge',
  },
  {
    value: 'OTHER',
    label: '✨ Other (Custom Operational Consideration)',
  },
];

function buildDefaultStep6DataForPlan(
  plan: ActiveStartupPlan,
  selectedCountry: SupportedCountryCode
): OperationsBlindSpotAuditStep6Data {
  const saved = plan.moduleEData?.blindSpotAudit;
  if (saved && saved.blindSpots && saved.blindSpots.length > 0) {
    return {
      readinessConfidence:
        saved.readinessConfidence || 'READY_FOR_V1_FULFILLMENT',
      otherReadinessConfidenceText: saved.otherReadinessConfidenceText || '',
      blindSpots: saved.blindSpots,
      executiveOperationsSummaryNarrative:
        saved.executiveOperationsSummaryNarrative || '',
      operationsToFinanceAndTeamHandshakeNarrative:
        saved.operationsToFinanceAndTeamHandshakeNarrative || '',
      aiCoachTip: saved.aiCoachTip,
      lastSavedAt: saved.lastSavedAt,
      aiEngineUsed: saved.aiEngineUsed,
    };
  }

  const track =
    plan.moduleDData?.productVehicle?.productTrack ||
    detectRecommendedProductTrack(plan);
  const isPhysical =
    track === 'PHYSICAL_PRODUCT_ECOM' || track === 'HYBRID_HARDWARE_SOFTWARE';
  const isSoftware =
    track === 'SAAS_SOFTWARE_AI' ||
    track === 'HYBRID_HARDWARE_SOFTWARE' ||
    track === 'MARKETPLACE_PLATFORM';

  const isIE = selectedCountry === 'IE';
  const isGB = selectedCountry === 'GB';
  const currencySym = plan.baseCurrency === 'GBP' || isGB ? '£' : '€';

  const step1 = plan.moduleEData?.operationsBlueprint;
  const step2 = plan.moduleEData?.premisesAndEquipment;
  const step4 = plan.moduleEData?.supportReturnsAndQc;
  const step5 = plan.moduleEData?.permitsAndInsurance;

  const activeMins =
    step1?.orderLifecycleStages?.reduce(
      (s, st) => s + (Number(st.activeMinutesPerOrder) || 0),
      0
    ) ?? (isPhysical ? 50 : 12);
  const directCogs =
    step1?.orderLifecycleStages?.reduce(
      (s, st) => s + (Number(st.directVariableCostPerOrder) || 0),
      0
    ) ?? (isPhysical ? 22 : 2.5);
  const weeklyHrs = Math.max(1, step1?.weeklyOpsHoursAllocated || 25);
  const weeklyCap =
    activeMins > 0 ? Math.floor((weeklyHrs * 60) / activeMins) : 1000;

  const annualInsEst =
    step5?.estimatedAnnualInsurancePremium ??
    (isSoftware ? (isGB ? 850 : 950) : isPhysical ? (isGB ? 1100 : 1250) : 650);
  const monthlyInsEst = Math.round(annualInsEst / 12);
  const returnRate = step4?.estimatedReturnOrRefundRatePercent ?? 2.0;
  const returnCost = step4?.costPerReturnOrRemakeIncident ?? 20;
  const returnBuffer =
    Math.round(((returnRate / 100) * returnCost + Number.EPSILON) * 100) / 100;

  return {
    readinessConfidence: 'READY_FOR_V1_FULFILLMENT',
    otherReadinessConfidenceText: '',
    blindSpots: [
      {
        id: 'ops-bs-1',
        category: 'CAPACITY_AND_FULFILLMENT_BOTTLENECK',
        severity: activeMins >= 30 ? 'CRITICAL' : 'IMPORTANT',
        title:
          activeMins > 0
            ? `Weekly Capacity Ceiling (${weeklyCap} orders/wk at ${activeMins} mins/order) vs. Peak Demand`
            : 'Automated Cloud Provisioning & Support Escalation Guardrails',
        whyItMatters:
          activeMins > 0
            ? `At ${activeMins} hands-on minutes per order across ${weeklyHrs} hrs/week, manual fulfillment caps out at ~${weeklyCap} orders/week. A sudden B2B batch order or seasonal surge can breach customer turnaround SLAs if not batched.`
            : 'Even with automated cloud onboarding, high-touch onboarding requests or API spikes can create unexpected support backlogs if not rate-limited.',
        recommendedActionOrFix:
          activeMins > 0
            ? 'Standardize batch pre-prep for Stages 1–2 and define the exact weekly order volume trigger in Module F where part-time fulfillment assistance or 3PL support is unlocked.'
            : 'Enforce hard daily API circuit breakers and self-serve onboarding tooltips so 95%+ of orders provision without manual intervention.',
        isResolved: false,
      },
      {
        id: 'ops-bs-2',
        category: 'GRANT_PROCUREMENT_AND_CAPEX_ELIGIBILITY',
        severity: 'CRITICAL',
        title: isIE
          ? 'Local Enterprise Office (LEO) Retrospective Spend Ban, 3-Quote Rule (≥€1,000) & Laptop Exclusion'
          : isGB
            ? 'Innovate UK Eligible Capital Usage Depreciation vs. British Business Bank Start Up Loan CapEx'
            : 'Formal 3-Quote Capital Equipment Procurement & Cashflow Timing',
        whyItMatters: isIE
          ? 'Under Irish LEO Priming and Feasibility rules, any equipment ordered or paid for prior to formal Letter of Offer acceptance is 100% ineligible, items ≥€1,000 ex-VAT require 3 written supplier quotes, and standard laptops/phones are excluded from 50% capital grants.'
          : isGB
            ? 'Innovate UK Smart grants only reimburse proportional capital depreciation over the R&D project duration rather than 100% upfront asset purchase price, while Start Up Loans require itemised supplier quotes and working capital buffers.'
            : 'Ordering capital equipment without formal written quotes or clear working-capital timing creates cashflow strain and grant audit rejections.',
        recommendedActionOrFix: isIE
          ? 'Keep 3 dated written quotes on file for every Step 2 asset ≥€1,000 ex-VAT, ring-fence laptops/phones as 100% Founder/BYOD funded, and model the ~60-day LEO reimbursement bridge in Module I.'
          : isGB
            ? 'Separate R&D project depreciation (for Innovate UK) from upfront working capital asset finance (British Business Bank Start Up Loans) in Module I & Module J.'
            : 'Maintain dated supplier quotes and align asset purchase timing with Module I cashflow.',
        isResolved: false,
      },
      {
        id: 'ops-bs-3',
        category: 'UNIT_COGS_AND_RETURN_MARGIN_LEAKAGE',
        severity: 'IMPORTANT',
        title: `Unit Margin Protection: ${currencySym}${directCogs.toFixed(2)} Direct COGS + ${currencySym}${returnBuffer.toFixed(2)} Return/Remake Buffer (${returnRate}%)`,
        whyItMatters: isIE
          ? `Under the Ireland Consumer Rights Act 2022 (CRAA), unbuffered returns, remakes, or courier damage silently erode gross margin if not built directly into Module G pricing.`
          : isGB
            ? `Under the UK Consumer Rights Act 2015, unbuffered refunds, faulty-item replacements, or courier damage silently erode gross margin if not built directly into Module G pricing.`
            : 'Unbuffered returns, remakes, or SLA credits silently erode unit gross margin if omitted from unit economics.',
        recommendedActionOrFix: `Lock the combined ${currencySym}${(directCogs + returnBuffer).toFixed(2)}/order effective operational COGS into Module G (Pricing & Pocket Profit) and enforce the Step 4 3-gate QC checklist prior to dispatch.`,
        isResolved: false,
      },
      {
        id: 'ops-bs-4',
        category: 'REGULATORY_TAX_AND_INSURANCE_GAP',
        severity: 'WATCH',
        title: isIE
          ? `Indicative Insurance Estimate (~${currencySym}${annualInsEst.toLocaleString()}/yr — Estimate Only, Actual Coverage May Vary) & Revenue TC2 Clearance`
          : isGB
            ? `Indicative Insurance Estimate (~${currencySym}${annualInsEst.toLocaleString()}/yr — Estimate Only, Actual Coverage May Vary), UK Employers' Liability & ICO Fee`
            : `Indicative Insurance Estimate (~${currencySym}${annualInsEst.toLocaleString()}/yr — Estimate Only, Actual Coverage May Vary) & Statutory Filings`,
        whyItMatters: isIE
          ? `While ~${currencySym}${annualInsEst.toLocaleString()}/yr (~${currencySym}${monthlyInsEst.toLocaleString()}/mo) is synced to Module I Overheads as an indicative planning estimate, actual insurance coverage, policy exclusions, and premiums may vary upon insurer underwriting. Additionally, active Revenue eTax Clearance (TC2 via ROS) and a Section 20 HSA Written Safety Statement (BeSMART.ie) are mandatory before grant drawdown.`
          : isGB
            ? `While ~${currencySym}${annualInsEst.toLocaleString()}/yr (~${currencySym}${monthlyInsEst.toLocaleString()}/mo) is synced to Module I Overheads as an indicative planning estimate, actual insurance coverage, policy exclusions, and premiums may vary upon insurer underwriting. UK law also mandates ≥£5m Employers' Liability insurance as soon as staff are hired plus annual ICO registration.`
            : 'Indicative insurance figures are planning estimates only and actual coverage/premiums may vary upon formal broker underwriting.',
        recommendedActionOrFix: isIE
          ? 'Obtain a formal written insurance quotation from an Irish broker/insurer prior to launch, verify Revenue TC2 eTax Clearance on ROS.ie, and export your HSA BeSMART.ie Safety Statement.'
          : isGB
            ? 'Obtain a formal written insurance quotation from an FCA-regulated UK broker/insurer prior to launch, complete ICO registration (ico.org.uk), and document your UK HSE risk assessment.'
            : 'Obtain a formal written insurance quote prior to commercial launch to confirm final underwriting terms and premium.',
        isResolved: false,
      },
    ],
    executiveOperationsSummaryNarrative: '',
    operationsToFinanceAndTeamHandshakeNarrative: '',
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
  onSaveStep3RiskRegister,
  onGenerateAiRiskRegister,
  onSaveStep4SupportReturnsAndQc,
  onGenerateAiSupportReturnsAndQc,
  onSaveStep5PermitsAndInsurance,
  onGenerateAiPermitsAndInsurance,
  onSaveStep6BlindSpotAudit,
  onGenerateAiBlindSpotAudit,
  userId,
  onParkOpenQuestion,
  onBackToModuleD,
  onContinueToModuleF,
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
  >(() => {
    if (plan.currentModuleStep === 'MOD_E_STEP_6') return 'STEP_6';
    if (plan.currentModuleStep === 'MOD_E_STEP_5') return 'STEP_5';
    if (plan.currentModuleStep === 'MOD_E_STEP_4') return 'STEP_4';
    if (plan.currentModuleStep === 'MOD_E_STEP_3') return 'STEP_3';
    if (plan.currentModuleStep === 'MOD_E_STEP_2') return 'STEP_2';
    return 'STEP_1';
  });

  const [openStep, setOpenStep] = useState<number | 'ALL'>(() => {
    if (plan.currentModuleStep === 'MOD_E_STEP_6') return 6;
    if (plan.currentModuleStep === 'MOD_E_STEP_5') return 5;
    if (plan.currentModuleStep === 'MOD_E_STEP_4') return 4;
    if (plan.currentModuleStep === 'MOD_E_STEP_3') return 3;
    if (plan.currentModuleStep === 'MOD_E_STEP_2') return 2;
    return 1;
  });

  useEffect(() => {
    if (plan.currentModuleStep === 'MOD_E_STEP_6') {
      setActiveTab('STEP_6');
      setOpenStep(6);
    } else if (plan.currentModuleStep === 'MOD_E_STEP_5') {
      setActiveTab('STEP_5');
      setOpenStep(5);
    } else if (plan.currentModuleStep === 'MOD_E_STEP_4') {
      setActiveTab('STEP_4');
      setOpenStep(4);
    } else if (plan.currentModuleStep === 'MOD_E_STEP_3') {
      setActiveTab('STEP_3');
      setOpenStep(3);
    } else if (plan.currentModuleStep === 'MOD_E_STEP_2') {
      setActiveTab('STEP_2');
      setOpenStep(2);
    }
  }, [plan.currentModuleStep]);

  const [step1Data, setStep1Data] = useState<OperationsBlueprintStep1Data>(() =>
    buildDefaultStep1DataForPlan(plan, selectedCountry)
  );

  const [step2Data, setStep2Data] = useState<PremisesAndEquipmentStep2Data>(() =>
    buildDefaultStep2DataForPlan(plan, selectedCountry)
  );

  const [step3Data, setStep3Data] = useState<RiskRegisterStep3Data>(() =>
    buildDefaultStep3DataForPlan(plan, selectedCountry)
  );

  const [step4Data, setStep4Data] = useState<SupportReturnsAndQcStep4Data>(() =>
    buildDefaultStep4DataForPlan(plan, selectedCountry)
  );

  const [step5Data, setStep5Data] =
    useState<PermitsComplianceAndInsuranceStep5Data>(() =>
      buildDefaultStep5DataForPlan(plan, selectedCountry)
    );

  const [step6Data, setStep6Data] =
    useState<OperationsBlindSpotAuditStep6Data>(() =>
      buildDefaultStep6DataForPlan(plan, selectedCountry)
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

  const [showWhyAskingStep3, setShowWhyAskingStep3] = useState(false);
  const [showExampleDrawerStep3, setShowExampleDrawerStep3] = useState(false);
  const [showParkInputStep3, setShowParkInputStep3] = useState(false);
  const [parkQuestionInputStep3, setParkQuestionInputStep3] = useState('');
  const [isSavingStep3, setIsSavingStep3] = useState(false);
  const [isGeneratingAiStep3, setIsGeneratingAiStep3] = useState(false);

  const [showWhyAskingStep4, setShowWhyAskingStep4] = useState(false);
  const [showExampleDrawerStep4, setShowExampleDrawerStep4] = useState(false);
  const [showParkInputStep4, setShowParkInputStep4] = useState(false);
  const [parkQuestionInputStep4, setParkQuestionInputStep4] = useState('');
  const [isSavingStep4, setIsSavingStep4] = useState(false);
  const [isGeneratingAiStep4, setIsGeneratingAiStep4] = useState(false);

  const [showWhyAskingStep5, setShowWhyAskingStep5] = useState(false);
  const [showExampleDrawerStep5, setShowExampleDrawerStep5] = useState(false);
  const [showParkInputStep5, setShowParkInputStep5] = useState(false);
  const [parkQuestionInputStep5, setParkQuestionInputStep5] = useState('');
  const [isSavingStep5, setIsSavingStep5] = useState(false);
  const [isGeneratingAiStep5, setIsGeneratingAiStep5] = useState(false);

  const [showWhyAskingStep6, setShowWhyAskingStep6] = useState(false);
  const [showExampleDrawerStep6, setShowExampleDrawerStep6] = useState(false);
  const [showParkInputStep6, setShowParkInputStep6] = useState(false);
  const [parkQuestionInputStep6, setParkQuestionInputStep6] = useState('');
  const [isSavingStep6, setIsSavingStep6] = useState(false);
  const [isGeneratingAiStep6, setIsGeneratingAiStep6] = useState(false);

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
            'Founder progresses through Modules B–K using rate-limited Gemini 2.5 Flash/Pro synthesis and hosts live Mom-Test validation surveys.',
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
            'Startup Preflight 3-Quote Concierge Engine + Vetted IE/UK Partner Network',
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
      endToEndFulfillmentNarrative: `Startup Preflight operates an instant (<60 second) cloud fulfillment pipeline requiring only ${currencySymbol}3.00 in direct variable payment processing and AI token costs (COGS) per pass sold (~97.7% gross margin). Core onboarding, geo-localized grant matching, and 11-module synthesis are 100% automated on Google Cloud Run and PostgreSQL, reserving human operations strictly for 3-Quote Concierge RFP partner matching (7 mins average ops time per founder).`,
      scalingAndBottleneckDeRiskingNarrative: `We scale from 100 to 5,000+ active founders without operational bottlenecks via three mechanisms: (1) a hard 500-call/day platform AI circuit breaker and deterministic smart-synthesizer fallback in router.ts, (2) 4-layer built-in self-serve coaching ('Why Are We Asking This?', industry examples, and 'Ask Preflight AI') keeping human support tickets below 5%, and (3) pre-contracted 48-hour quote turnaround SLAs across our vetted IE/UK supplier marketplace.`,
      aiEngineUsed: 'smart-synthesizer',
    });
    setSaveBanner(
      '🚀 Loaded Startup Preflight (Cloud AI SaaS) 5-stage operations blueprint! Click Save Step 1 below to persist.'
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
        ? `Startup Preflight operates a 100% cloud-native, remote-first architecture from Dublin with ${currencySymbol}95/month in utility and cloud-staging overhead. By avoiding fixed commercial office leases during Year 1, 100% of working capital is directed into product engineering, vetted Irish partner onboarding, and founder customer acquisition.`
        : isUK
          ? `Startup Preflight operates a 100% cloud-native, remote-first architecture from London with ${currencySymbol}95/month in utility and cloud-staging overhead. By avoiding fixed commercial office leases during Year 1, 100% of working capital is directed into product engineering, vetted UK partner onboarding, and founder customer acquisition.`
          : `Startup Preflight operates a 100% cloud-native, remote-first architecture with ${currencySymbol}95/month in utility and cloud-staging overhead, avoiding fixed commercial office lease liabilities during Year 1.`,
      equipmentRoiAndGrantComplianceNarrative: isIE
        ? `Our ${currencySymbol}4,860 equipment schedule (${currencySymbol}1,260 in new cash outlay) is 100% self-funded and compliant with IE LEO capital rules. Both founder MacBook Pro development workstations (${currencySymbol}3,600 BYOD) are explicitly ring-fenced under 100% Own Funds so zero general-purpose laptops are claimed against IE LEO capital grants, while our ${currencySymbol}920 cross-device mobile QA rig and ${currencySymbol}340 FIDO2 hardware security keys fall below the ${currencySymbol}1,000 3-quote threshold.`
        : isUK
          ? `Our ${currencySymbol}4,860 equipment schedule (${currencySymbol}1,260 in new cash outlay) is 100% self-funded and compliant with UK Innovate UK and British Business Bank Start Up Loan capital rules. Both founder MacBook Pro development workstations (${currencySymbol}3,600 BYOD) are ring-fenced under 100% Own Funds with zero grant claim, while our ${currencySymbol}920 cross-device mobile QA rig and ${currencySymbol}340 FIDO2 hardware security keys fall below the ${currencySymbol}1,000 3-quote threshold.`
          : `Our ${currencySymbol}4,860 equipment schedule (${currencySymbol}1,260 in new cash outlay) is 100% self-funded under 100% Own Funds, with both founder development workstations contributed as BYOD equity assets.`,
      aiEngineUsed: 'smart-synthesizer',
    });
    setSaveBanner(
      '🚀 Loaded Startup Preflight (Cloud AI SaaS) Premises & Ring-Fenced Equipment Schedule! Click Save Step 2 below to persist.'
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

  // Live computed Step 3 Risk Register & Supply-Chain Resilience Metrics
  const mandatoryRiskCategories: Array<{
    code: ProjectRiskCategoryType;
    label: string;
  }> = [
    { code: 'TECHNICAL_PRODUCTION', label: 'Technical / Production' },
    { code: 'COMMERCIAL_MARKET', label: 'Commercial / Market' },
    { code: 'FINANCIAL_SUPPLY_CHAIN', label: 'Financial / Supply-Chain' },
    { code: 'MANAGERIAL_REGULATORY', label: 'Managerial / Regulatory' },
  ];

  const coveredMandatoryCategories = mandatoryRiskCategories.filter((cat) =>
    step3Data.riskItems.some((r) => r.riskCategory === cat.code)
  );
  const missingMandatoryCategories = mandatoryRiskCategories.filter(
    (cat) => !step3Data.riskItems.some((r) => r.riskCategory === cat.code)
  );

  const totalGrossRiskScore = step3Data.riskItems.reduce(
    (sum, r) =>
      sum +
      Math.max(1, Math.min(5, Number(r.likelihoodScore) || 3)) *
        Math.max(1, Math.min(5, Number(r.impactScore) || 3)),
    0
  );
  const averageGrossRiskScore =
    step3Data.riskItems.length > 0
      ? Math.round((totalGrossRiskScore / step3Data.riskItems.length) * 10) / 10
      : 0;

  const highGrossRiskItemsCount = step3Data.riskItems.filter(
    (r) =>
      Math.max(1, Math.min(5, Number(r.likelihoodScore) || 3)) *
        Math.max(1, Math.min(5, Number(r.impactScore) || 3)) >=
      12
  ).length;

  const highResidualRisksCount = step3Data.riskItems.filter(
    (r) => r.residualRiskRating === 'HIGH'
  ).length;
  const lowOrMediumResidualRisksCount = step3Data.riskItems.filter(
    (r) =>
      r.residualRiskRating === 'LOW' || r.residualRiskRating === 'MEDIUM'
  ).length;

  function handleUpdateRiskItem(
    riskId: string,
    patch: Partial<ProjectRiskRegisterItem>
  ) {
    if (isVaultReadonly) return;
    setStep3Data((prev) => ({
      ...prev,
      riskItems: prev.riskItems.map((item) => {
        if (item.id !== riskId) return item;
        const merged = { ...item, ...patch };
        const likelihoodScore = Math.max(
          1,
          Math.min(5, Number(merged.likelihoodScore) || 3)
        );
        const impactScore = Math.max(
          1,
          Math.min(5, Number(merged.impactScore) || 3)
        );
        return {
          ...merged,
          likelihoodScore,
          impactScore,
          grossRiskScore: likelihoodScore * impactScore,
        };
      }),
    }));
  }

  function handleAddRiskItem() {
    if (isVaultReadonly) return;
    setStep3Data((prev) => {
      const nextMissingCat =
        missingMandatoryCategories[0]?.code || 'TECHNICAL_PRODUCTION';
      const newRisk: ProjectRiskRegisterItem = {
        id: `risk-custom-${Date.now()}`,
        riskCategory: nextMissingCat,
        riskTitle: 'New Project Operational or Supply-Chain Risk',
        likelihoodScore: 3,
        impactScore: 4,
        grossRiskScore: 12,
        mitigationAndContingencyPlan:
          'Define concrete preventative controls and a clear contingency trigger if this risk materializes.',
        ownerAndWorkPackage: 'Founder / Operations Lead (WP1 / WP2)',
        residualRiskRating: 'LOW',
        isCustom: true,
      };
      return {
        ...prev,
        riskItems: [...prev.riskItems, newRisk],
      };
    });
  }

  function handleRemoveRiskItem(riskId: string) {
    if (isVaultReadonly) return;
    setStep3Data((prev) => {
      if (prev.riskItems.length <= 1) return prev;
      return {
        ...prev,
        riskItems: prev.riskItems.filter((r) => r.id !== riskId),
      };
    });
  }

  function handleApplyStep3IndustryBenchmark() {
    if (isVaultReadonly) return;
    const benchmarkDefaults = buildDefaultStep3DataForPlan(
      {
        ...plan,
        moduleEData: {
          ...(plan.moduleEData || {}),
          riskRegister: undefined,
        },
      },
      selectedCountry
    );
    setStep3Data((prev) => ({
      ...benchmarkDefaults,
      supplyChainResilienceNarrative:
        prev.supplyChainResilienceNarrative ||
        benchmarkDefaults.supplyChainResilienceNarrative,
      riskManagementGovernanceNarrative:
        prev.riskManagementGovernanceNarrative ||
        benchmarkDefaults.riskManagementGovernanceNarrative,
    }));
    setSaveBanner(
      '📊 Applied industry benchmark supply-chain buffer & 4-category risk structure for your product track! Click Save Step 3 below to persist.'
    );
  }

  async function handleRunAiStep3(
    mode: 'POPULATE_RISKS_AND_NARRATIVES' | 'NARRATIVES_ONLY'
  ) {
    if (isVaultReadonly) return;
    setIsGeneratingAiStep3(true);
    setSaveBanner(null);
    try {
      const res = await onGenerateAiRiskRegister({
        selectedTrack: inheritedTrack,
        otherProductTrackText: inheritedOtherTrackText,
        currentSupplierRedundancyPosture: step3Data.supplierRedundancyPosture,
        currentLeadTimeBufferDays: step3Data.leadTimeBufferDays,
        currentPrimarySuppliersSummary: step3Data.primarySuppliersSummary,
        currentBackupSuppliersSummary: step3Data.backupSuppliersSummary,
        currentRiskItems: step3Data.riskItems,
        mode,
      });

      if (!res.allowed) return;

      const nextData: RiskRegisterStep3Data = {
        ...step3Data,
        supplierRedundancyPosture:
          step3Data.supplierRedundancyPosture || res.supplierRedundancyPosture,
        leadTimeBufferDays:
          step3Data.leadTimeBufferDays ?? res.leadTimeBufferDays,
        primarySuppliersSummary:
          step3Data.primarySuppliersSummary.trim() ||
          res.primarySuppliersSummary,
        backupSuppliersSummary:
          step3Data.backupSuppliersSummary.trim() || res.backupSuppliersSummary,
        riskItems:
          mode === 'NARRATIVES_ONLY' && step3Data.riskItems.length > 0
            ? step3Data.riskItems
            : res.riskItems,
        supplyChainResilienceNarrative: res.supplyChainResilienceNarrative,
        riskManagementGovernanceNarrative:
          res.riskManagementGovernanceNarrative,
        aiEngineUsed: res.engineMode,
        lastSavedAt: new Date().toISOString(),
      };

      setStep3Data(nextData);
      await onSaveStep3RiskRegister(nextData, 70);
      setSaveBanner(
        mode === 'NARRATIVES_ONLY'
          ? '✨ Synthesized your Supply-Chain Resilience & Risk Governance Narratives and saved Step 3!'
          : '✨ Generated your 4-Category Grant-Ready Risk Register + Narratives and saved Step 3!'
      );
    } finally {
      setIsGeneratingAiStep3(false);
    }
  }

  async function handleSaveStep3() {
    if (isVaultReadonly) return;
    setIsSavingStep3(true);
    setSaveBanner(null);
    try {
      const nowIso = new Date().toISOString();
      const nextData: RiskRegisterStep3Data = {
        ...step3Data,
        lastSavedAt: nowIso,
      };
      setStep3Data(nextData);
      const isComplete =
        Boolean(nextData.supplierRedundancyPosture) &&
        nextData.riskItems.length >= 4 &&
        nextData.riskManagementGovernanceNarrative.trim().length > 10;
      await onSaveStep3RiskRegister(nextData, isComplete ? 70 : 58);
      setSaveBanner(
        '✅ Saved Module E Step 3 (Supply-Chain Resilience & 4-Category Project Risk Register)!'
      );
    } finally {
      setIsSavingStep3(false);
    }
  }

  // =========================================================================
  // STEP 4 COMPUTED METRICS & HANDLERS (SUPPORT, RETURNS, WARRANTY & QC SOP)
  // =========================================================================

  const expectedReturnAllowancePerOrder =
    Math.round(
      ((Number(step4Data.estimatedReturnOrRefundRatePercent) || 0) / 100) *
        (Number(step4Data.costPerReturnOrRemakeIncident) || 0) *
        100
    ) / 100;

  const expectedMonthlyReturnCostAtMaxCapacity = Math.round(
    expectedReturnAllowancePerOrder * maxOrdersPerMonthByManualTime
  );

  const distinctQcGatesCovered = Array.from(
    new Set(step4Data.qcCheckpoints.map((cp) => cp.gateTiming))
  );

  function handleUpdateQcCheckpoint(
    checkpointId: string,
    updates: Partial<QcCheckpointItem>
  ) {
    if (isVaultReadonly) return;
    setStep4Data((prev) => ({
      ...prev,
      qcCheckpoints: prev.qcCheckpoints.map((cp) =>
        cp.id === checkpointId ? { ...cp, ...updates } : cp
      ),
    }));
  }

  function handleAddQcCheckpoint() {
    if (isVaultReadonly) return;
    const newGate: QcCheckpointItem = {
      id: `qc-custom-${Date.now()}`,
      gateTiming: 'PRE_DISPATCH_FINAL_INSPECTION',
      checkpointName: 'Additional Quality Control & Release Verification Gate',
      passFailStandard:
        '100% pass against documented specification checklist prior to customer release.',
      defectFallbackAction:
        'Hold release immediately, remediate defect, and log root cause.',
      ownerRole: 'Founder / Quality Lead',
      isCustom: true,
    };
    setStep4Data((prev) => ({
      ...prev,
      qcCheckpoints: [...prev.qcCheckpoints, newGate],
    }));
  }

  function handleRemoveQcCheckpoint(checkpointId: string) {
    if (isVaultReadonly) return;
    setStep4Data((prev) => ({
      ...prev,
      qcCheckpoints:
        prev.qcCheckpoints.length > 1
          ? prev.qcCheckpoints.filter((cp) => cp.id !== checkpointId)
          : prev.qcCheckpoints,
    }));
  }

  function handleApplyStep4IndustryBenchmark() {
    if (isVaultReadonly) return;
    const benchmarkDefaults = buildDefaultStep4DataForPlan(
      {
        ...plan,
        moduleEData: {
          ...(plan.moduleEData || {}),
          supportReturnsAndQc: undefined,
        },
      },
      selectedCountry
    );
    const isIE = selectedCountry === 'IE';
    const isUK = selectedCountry === 'GB';
    const statutoryLabel = isIE
      ? 'Ireland Consumer Rights Act 2022 (CRAA) and CCPC distance-selling rules'
      : isUK
        ? 'UK Consumer Rights Act 2015 and Consumer Contracts Regulations 2013'
        : `${countryPack.countryName} statutory consumer protection rules`;

    setStep4Data((prev) => ({
      ...prev,
      supportOperatingModel:
        prev.supportOperatingModel || benchmarkDefaults.supportOperatingModel,
      supportResponseSla:
        prev.supportResponseSla || benchmarkDefaults.supportResponseSla,
      returnsAndWarrantyPolicy:
        prev.returnsAndWarrantyPolicy ||
        benchmarkDefaults.returnsAndWarrantyPolicy,
      estimatedReturnOrRefundRatePercent:
        benchmarkDefaults.estimatedReturnOrRefundRatePercent,
      costPerReturnOrRemakeIncident:
        benchmarkDefaults.costPerReturnOrRemakeIncident,
      warrantyDurationMonths: benchmarkDefaults.warrantyDurationMonths,
      qcCheckpoints: benchmarkDefaults.qcCheckpoints,
      qualityControlAndStandardsNarrative:
        prev.qualityControlAndStandardsNarrative.trim() ||
        `${plan.title || 'Our business'} enforces a 3-gate Quality Control (QC) SOP covering incoming verification, in-process build standards, and pre-release inspection. Catching defects internally keeps our projected return/remake rate at ${benchmarkDefaults.estimatedReturnOrRefundRatePercent}% and protects unit gross margins in Module G.`,
      customerSupportAndReturnsNarrative:
        prev.customerSupportAndReturnsNarrative.trim() ||
        `We operate a responsive customer support SLA paired with a transparent returns, remake, and warranty policy aligned with ${statutoryLabel}, ensuring customer trust without overwhelming founder bandwidth.`,
    }));
    setSaveBanner(
      `📐 Applied ${countryPack.countryName} Industry Benchmark QC Gates, Return Buffer & Statutory Consumer Policy for your ${inheritedTrack.replace(/_/g, ' ')} track.`
    );
  }

  async function handleRunAiStep4(
    mode: 'POPULATE_QC_AND_NARRATIVES' | 'NARRATIVES_ONLY' = 'POPULATE_QC_AND_NARRATIVES'
  ) {
    if (isVaultReadonly) return;
    setIsGeneratingAiStep4(true);
    setSaveBanner(null);
    try {
      const res = await onGenerateAiSupportReturnsAndQc({
        selectedTrack: inheritedTrack,
        otherProductTrackText: inheritedOtherTrackText,
        currentSupportOperatingModel: step4Data.supportOperatingModel,
        currentSupportResponseSla: step4Data.supportResponseSla,
        currentReturnsAndWarrantyPolicy: step4Data.returnsAndWarrantyPolicy,
        currentEstimatedReturnRatePercent:
          step4Data.estimatedReturnOrRefundRatePercent,
        currentCostPerReturnIncident: step4Data.costPerReturnOrRemakeIncident,
        currentWarrantyDurationMonths: step4Data.warrantyDurationMonths,
        currentQcCheckpoints: step4Data.qcCheckpoints,
        mode,
      });

      if (!res.allowed) return;

      const nextData: SupportReturnsAndQcStep4Data = {
        ...step4Data,
        supportOperatingModel:
          step4Data.supportOperatingModel || res.supportOperatingModel,
        supportResponseSla:
          step4Data.supportResponseSla || res.supportResponseSla,
        returnsAndWarrantyPolicy:
          step4Data.returnsAndWarrantyPolicy || res.returnsAndWarrantyPolicy,
        estimatedReturnOrRefundRatePercent:
          res.estimatedReturnOrRefundRatePercent,
        costPerReturnOrRemakeIncident: res.costPerReturnOrRemakeIncident,
        warrantyDurationMonths: res.warrantyDurationMonths,
        qcCheckpoints:
          mode === 'NARRATIVES_ONLY' && step4Data.qcCheckpoints.length > 0
            ? step4Data.qcCheckpoints
            : res.qcCheckpoints,
        qualityControlAndStandardsNarrative:
          res.qualityControlAndStandardsNarrative,
        customerSupportAndReturnsNarrative:
          res.customerSupportAndReturnsNarrative,
        aiEngineUsed: res.engineMode,
        lastSavedAt: new Date().toISOString(),
      };

      setStep4Data(nextData);
      await onSaveStep4SupportReturnsAndQc(nextData, 82);
      setSaveBanner(
        mode === 'NARRATIVES_ONLY'
          ? '✨ Synthesized your Quality Control & Customer Support Narratives and saved Step 4!'
          : '✨ Generated your 3-Gate Quality Control SOP, Returns Policy & Narratives and saved Step 4!'
      );
    } finally {
      setIsGeneratingAiStep4(false);
    }
  }

  async function handleSaveStep4() {
    if (isVaultReadonly) return;
    setIsSavingStep4(true);
    setSaveBanner(null);
    try {
      const nowIso = new Date().toISOString();
      const nextData: SupportReturnsAndQcStep4Data = {
        ...step4Data,
        lastSavedAt: nowIso,
      };
      setStep4Data(nextData);
      const isComplete =
        Boolean(nextData.supportOperatingModel) &&
        Boolean(nextData.supportResponseSla) &&
        Boolean(nextData.returnsAndWarrantyPolicy) &&
        nextData.qcCheckpoints.length >= 2 &&
        nextData.qualityControlAndStandardsNarrative.trim().length > 10;
      await onSaveStep4SupportReturnsAndQc(nextData, isComplete ? 82 : 74);
      setSaveBanner(
        '✅ Saved Module E Step 4 (Customer Support, Returns, Warranty & Quality Control SOP)!'
      );
    } finally {
      setIsSavingStep4(false);
    }
  }

  // =========================================================================
  // STEP 5 COMPUTED METRICS & HANDLERS (PERMITS, COMPLIANCE & INSURANCE)
  // =========================================================================

  const estimatedMonthlyInsuranceOverhead = Math.round(
    (Number(step5Data.estimatedAnnualInsurancePremium) || 0) / 12
  );

  const totalAnnualComplianceItemsCost = step5Data.complianceItems.reduce(
    (sum, item) => sum + (Number(item.estimatedAnnualCost) || 0),
    0
  );

  const verifiedOrInProgressComplianceCount = step5Data.complianceItems.filter(
    (item) =>
      item.status === 'VERIFIED_COMPLETE' || item.status === 'IN_PROGRESS'
  ).length;

  const hasCorporateTaxClearanceItem = step5Data.complianceItems.some(
    (item) => item.category === 'CORPORATE_TAX_GRANT_CLEARANCE'
  );
  const hasGdprPrivacyItem = step5Data.complianceItems.some(
    (item) => item.category === 'DATA_PRIVACY_GDPR_SECURITY'
  );
  const hasHealthSafetyItem = step5Data.complianceItems.some(
    (item) => item.category === 'HEALTH_SAFETY_PREMISES'
  );

  function handleUpdateComplianceItem(
    itemId: string,
    updates: Partial<ComplianceChecklistItem>
  ) {
    if (isVaultReadonly) return;
    setStep5Data((prev) => ({
      ...prev,
      complianceItems: prev.complianceItems.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item
      ),
    }));
  }

  function handleAddComplianceItem() {
    if (isVaultReadonly) return;
    const isIE = selectedCountry === 'IE';
    const isGB = selectedCountry === 'GB';
    const newItem: ComplianceChecklistItem = {
      id: `comp-custom-${Date.now()}`,
      category: 'SECTOR_PRODUCT_LICENSE',
      requirementTitle:
        'Additional Regulatory Permit, Certification or Sector Compliance Item',
      regulatoryBody: isIE
        ? 'Relevant Irish Regulatory Authority / NSAI / CCPC'
        : isGB
          ? 'Relevant UK Regulatory Authority / OPSS / Local Council'
          : 'Relevant Regulatory Authority',
      status: 'PLANNED_BEFORE_LAUNCH',
      evidenceOrReferenceNote:
        'Document reference number, registration certificate, or pre-launch verification milestone.',
      estimatedAnnualCost: 0,
      isCustom: true,
    };
    setStep5Data((prev) => ({
      ...prev,
      complianceItems: [...prev.complianceItems, newItem],
    }));
  }

  function handleRemoveComplianceItem(itemId: string) {
    if (isVaultReadonly) return;
    setStep5Data((prev) => ({
      ...prev,
      complianceItems:
        prev.complianceItems.length > 1
          ? prev.complianceItems.filter((item) => item.id !== itemId)
          : prev.complianceItems,
    }));
  }

  function handleApplyStep5IndustryBenchmark() {
    if (isVaultReadonly) return;
    const benchmarkDefaults = buildDefaultStep5DataForPlan(
      {
        ...plan,
        moduleEData: {
          ...(plan.moduleEData || {}),
          permitsAndInsurance: undefined,
        },
      },
      selectedCountry
    );
    const isIE = selectedCountry === 'IE';
    const isGB = selectedCountry === 'GB';
    const currencySym = plan.baseCurrency === 'GBP' || isGB ? '£' : '€';
    const monthlyEst = Math.round(
      benchmarkDefaults.estimatedAnnualInsurancePremium / 12
    );

    setStep5Data((prev) => ({
      ...prev,
      regulatorySectorPosture:
        prev.regulatorySectorPosture ||
        benchmarkDefaults.regulatorySectorPosture,
      dataPrivacyPosture:
        prev.dataPrivacyPosture || benchmarkDefaults.dataPrivacyPosture,
      insuranceCoverageBundle:
        prev.insuranceCoverageBundle ||
        benchmarkDefaults.insuranceCoverageBundle,
      estimatedAnnualInsurancePremium:
        benchmarkDefaults.estimatedAnnualInsurancePremium,
      selectedInsuranceProviderName:
        prev.selectedInsuranceProviderName.trim() ||
        benchmarkDefaults.selectedInsuranceProviderName,
      complianceItems: benchmarkDefaults.complianceItems,
      regulatoryAndComplianceNarrative:
        prev.regulatoryAndComplianceNarrative.trim() ||
        (isIE
          ? `${plan.title || 'Our business'} maintains full regulatory compliance across Ireland, including CRO good standing, Revenue eTax Clearance (TC2 via ROS) for Local Enterprise Office (LEO) / Enterprise Ireland grant drawdowns, a Written Safety Statement under Section 20 of the Safety, Health and Welfare at Work Act 2005 (via HSA BeSMART.ie), and EU GDPR / Data Protection Commission (DPC) data governance.`
          : isGB
            ? `${plan.title || 'Our business'} maintains full regulatory compliance across the UK, including Companies House and HMRC UTR good standing, a documented UK HSE workplace risk assessment under the Health and Safety at Work etc. Act 1974, and annual Information Commissioner's Office (ICO) Data Protection Fee registration under UK GDPR.`
            : `${plan.title || 'Our business'} maintains full corporate, tax, workplace health & safety, and GDPR data privacy compliance ahead of commercial launch.`),
      insuranceAndLiabilityGovernanceNarrative:
        prev.insuranceAndLiabilityGovernanceNarrative.trim() ||
        `We have scoped a ${benchmarkDefaults.insuranceCoverageBundle.replace(/_/g, ' ').toLowerCase()} commercial insurance package (${benchmarkDefaults.selectedInsuranceProviderName}) with an indicative estimated annual premium of ${currencySym}${benchmarkDefaults.estimatedAnnualInsurancePremium.toLocaleString()}/year (approx. ${currencySym}${monthlyEst.toLocaleString()}/month synced to Module I Overheads; actual coverage, policy limits, and premiums may vary subject to formal insurer underwriting).`,
    }));

    setSaveBanner(
      `🛡️ Applied ${countryPack.countryName} statutory compliance checklist & indicative startup insurance benchmark for your ${inheritedTrack.replace(/_/g, ' ')} track!`
    );
  }

  function handleSelectPartnerInsuranceBroker(broker: {
    providerName: string;
    bundle: InsuranceCoverageBundleType;
    indicativeAnnualEstimate: number;
  }) {
    if (isVaultReadonly) return;
    const subIdTag = `${plan.id}_${userId || 'founder'}`;
    setStep5Data((prev) => ({
      ...prev,
      insuranceCoverageBundle: broker.bundle,
      estimatedAnnualInsurancePremium: broker.indicativeAnnualEstimate,
      selectedInsuranceProviderName: broker.providerName,
    }));
    setSaveBanner(
      `🛡️ Matched "${broker.providerName}" (Indicative Estimate: ${formatPlanCurrency(broker.indicativeAnnualEstimate, plan.baseCurrency)}/yr — actual coverage & premium may vary; Attribution: ?subid=${subIdTag}). Click Save Step 5 below to persist.`
    );
  }

  async function handleRunAiStep5(
    mode:
      | 'POPULATE_COMPLIANCE_AND_NARRATIVES'
      | 'NARRATIVES_ONLY' = 'POPULATE_COMPLIANCE_AND_NARRATIVES'
  ) {
    if (isVaultReadonly) return;
    setIsGeneratingAiStep5(true);
    setSaveBanner(null);
    try {
      const res = await onGenerateAiPermitsAndInsurance({
        selectedTrack: inheritedTrack,
        otherProductTrackText: inheritedOtherTrackText,
        currentRegulatorySectorPosture: step5Data.regulatorySectorPosture,
        currentDataPrivacyPosture: step5Data.dataPrivacyPosture,
        currentInsuranceCoverageBundle: step5Data.insuranceCoverageBundle,
        currentEstimatedAnnualInsurancePremium:
          step5Data.estimatedAnnualInsurancePremium,
        currentSelectedInsuranceProviderName:
          step5Data.selectedInsuranceProviderName,
        currentComplianceItems: step5Data.complianceItems,
        mode,
      });

      if (!res.allowed) return;

      const nextData: PermitsComplianceAndInsuranceStep5Data = {
        ...step5Data,
        regulatorySectorPosture:
          step5Data.regulatorySectorPosture || res.regulatorySectorPosture,
        dataPrivacyPosture:
          step5Data.dataPrivacyPosture || res.dataPrivacyPosture,
        insuranceCoverageBundle:
          step5Data.insuranceCoverageBundle || res.insuranceCoverageBundle,
        estimatedAnnualInsurancePremium: res.estimatedAnnualInsurancePremium,
        selectedInsuranceProviderName:
          step5Data.selectedInsuranceProviderName.trim() ||
          res.selectedInsuranceProviderName,
        complianceItems:
          mode === 'NARRATIVES_ONLY' && step5Data.complianceItems.length > 0
            ? step5Data.complianceItems
            : res.complianceItems,
        regulatoryAndComplianceNarrative: res.regulatoryAndComplianceNarrative,
        insuranceAndLiabilityGovernanceNarrative:
          res.insuranceAndLiabilityGovernanceNarrative,
        aiEngineUsed: res.engineMode,
        lastSavedAt: new Date().toISOString(),
      };

      setStep5Data(nextData);
      await onSaveStep5PermitsAndInsurance(nextData, 92);
      setSaveBanner(
        mode === 'NARRATIVES_ONLY'
          ? '✨ Synthesized your Regulatory Compliance & Insurance Governance Narratives and saved Step 5!'
          : '✨ Generated your Statutory Compliance Checklist, Indicative Insurance Estimate & Narratives and saved Step 5!'
      );
    } finally {
      setIsGeneratingAiStep5(false);
    }
  }

  async function handleSaveStep5() {
    if (isVaultReadonly) return;
    setIsSavingStep5(true);
    setSaveBanner(null);
    try {
      const nowIso = new Date().toISOString();
      const nextData: PermitsComplianceAndInsuranceStep5Data = {
        ...step5Data,
        lastSavedAt: nowIso,
      };
      setStep5Data(nextData);
      const isComplete =
        Boolean(nextData.regulatorySectorPosture) &&
        Boolean(nextData.dataPrivacyPosture) &&
        Boolean(nextData.insuranceCoverageBundle) &&
        nextData.complianceItems.length >= 3 &&
        nextData.regulatoryAndComplianceNarrative.trim().length > 10;
      await onSaveStep5PermitsAndInsurance(nextData, isComplete ? 92 : 85);
      setSaveBanner(
        '✅ Saved Module E Step 5 (Regulatory, Licensing, Health & Safety, GDPR & Instant Startup Insurance Matcher)!'
      );
    } finally {
      setIsSavingStep5(false);
    }
  }

  // =========================================================================
  // STEP 6 COMPUTED METRICS & HANDLERS (BLIND-SPOT ENGINE & EXECUTIVE BRIEF)
  // =========================================================================

  const expectedReturnBufferPerOrder =
    Math.round(
      (((Number(step4Data.estimatedReturnOrRefundRatePercent) || 0) / 100) *
        (Number(step4Data.costPerReturnOrRemakeIncident) || 0) +
        Number.EPSILON) *
        100
    ) / 100;

  const totalEffectiveUnitDeliveryCogs =
    Math.round(
      (totalDirectVariableCostPerOrder +
        expectedReturnBufferPerOrder +
        Number.EPSILON) *
        100
    ) / 100;

  const monthlyStatutoryComplianceOverhead = Math.round(
    totalAnnualComplianceItemsCost / 12
  );

  const totalMonthlyFixedOpsOverhead =
    (Number(step2Data.monthlyPremisesAndUtilitiesCost) || 0) +
    estimatedMonthlyInsuranceOverhead +
    monthlyStatutoryComplianceOverhead;

  const resolvedBlindSpotsCount = step6Data.blindSpots.filter(
    (b) => b.isResolved
  ).length;

  function handleUpdateBlindSpotItem(
    itemId: string,
    updates: Partial<OperationsBlindSpotItem>
  ) {
    if (isVaultReadonly) return;
    setStep6Data((prev) => ({
      ...prev,
      blindSpots: prev.blindSpots.map((b) =>
        b.id === itemId ? { ...b, ...updates } : b
      ),
    }));
  }

  function handleToggleBlindSpotResolved(itemId: string) {
    if (isVaultReadonly) return;
    setStep6Data((prev) => ({
      ...prev,
      blindSpots: prev.blindSpots.map((b) =>
        b.id === itemId ? { ...b, isResolved: !b.isResolved } : b
      ),
    }));
  }

  function handleAddBlindSpotItem() {
    if (isVaultReadonly) return;
    const newItem: OperationsBlindSpotItem = {
      id: `ops-bs-custom-${Date.now()}`,
      category: 'CAPACITY_AND_FULFILLMENT_BOTTLENECK',
      severity: 'IMPORTANT',
      title: 'Custom Operational Consideration / Fulfillment Guardrail',
      whyItMatters:
        'Explain why this operational bottleneck, supplier dependency, or compliance item matters before scaling order volume.',
      recommendedActionOrFix:
        'Define the concrete SOP action, buffer, or milestone that resolves this operational risk.',
      isResolved: false,
      isCustom: true,
    };
    setStep6Data((prev) => ({
      ...prev,
      blindSpots: [...prev.blindSpots, newItem],
    }));
  }

  function handleRemoveBlindSpotItem(itemId: string) {
    if (isVaultReadonly) return;
    setStep6Data((prev) => ({
      ...prev,
      blindSpots:
        prev.blindSpots.length > 1
          ? prev.blindSpots.filter((b) => b.id !== itemId)
          : prev.blindSpots,
    }));
  }

  function handleApplyStep6IndustryBenchmark() {
    if (isVaultReadonly) return;
    const benchmarkDefaults = buildDefaultStep6DataForPlan(
      {
        ...plan,
        moduleEData: {
          ...(plan.moduleEData || {}),
          operationsBlueprint: step1Data,
          premisesAndEquipment: step2Data,
          riskRegister: step3Data,
          supportReturnsAndQc: step4Data,
          permitsAndInsurance: step5Data,
          blindSpotAudit: undefined,
        },
      },
      selectedCountry
    );
    const isIE = selectedCountry === 'IE';
    const isGB = selectedCountry === 'GB';
    const currencySym = plan.baseCurrency === 'GBP' || isGB ? '£' : '€';
    const annualIns = Number(step5Data.estimatedAnnualInsurancePremium) || 850;
    const monthlyPremises =
      Number(step2Data.monthlyPremisesAndUtilitiesCost) || 95;

    setStep6Data((prev) => ({
      ...prev,
      readinessConfidence:
        prev.readinessConfidence || benchmarkDefaults.readinessConfidence,
      blindSpots: benchmarkDefaults.blindSpots,
      executiveOperationsSummaryNarrative:
        prev.executiveOperationsSummaryNarrative.trim() ||
        (isIE
          ? `${plan.title || 'Our business'} operates a standardized 5-stage fulfillment pipeline requiring ${totalActiveMinutesPerOrder} active minutes and ${currencySym}${totalDirectVariableCostPerOrder.toFixed(2)} in direct COGS per order (plus a ${currencySym}${expectedReturnBufferPerOrder.toFixed(2)} returns/remake reserve at ${step4Data.estimatedReturnOrRefundRatePercent}% under the Ireland Consumer Rights Act 2022). Production and delivery are supported by a ${currencySym}${newOutlayCapexExVat.toLocaleString()} ex-VAT equipment schedule structured for Local Enterprise Office (LEO) 3-quote procurement compliance (≥€1,000 ex-VAT) and laptop/phone ring-fencing, a 4-category risk register, and full Irish regulatory readiness (CRO, Revenue eTax Clearance TC2 via ROS, HSA Section 20 Written Safety Statement via BeSMART.ie, and EU GDPR/DPC governance).`
          : isGB
            ? `${plan.title || 'Our business'} operates a standardized 5-stage fulfillment pipeline requiring ${totalActiveMinutesPerOrder} active minutes and ${currencySym}${totalDirectVariableCostPerOrder.toFixed(2)} in direct COGS per order (plus a ${currencySym}${expectedReturnBufferPerOrder.toFixed(2)} returns/remake reserve at ${step4Data.estimatedReturnOrRefundRatePercent}% under the UK Consumer Rights Act 2015). Operations are backed by a ${currencySym}${newOutlayCapexExVat.toLocaleString()} ex-VAT capital equipment schedule (with ${currencySym}${ukInnovateAnnualEligibleDepreciation.toLocaleString()}/yr eligible Innovate UK project usage depreciation), a 4-category risk register, and full UK statutory readiness (Companies House, HMRC UTR, UK HSE risk assessment under HSWA 1974, and ICO Data Protection Fee registration).`
            : `${plan.title || 'Our business'} operates a standardized 5-stage fulfillment pipeline requiring ${totalActiveMinutesPerOrder} active minutes and ${currencySym}${totalDirectVariableCostPerOrder.toFixed(2)} in direct COGS per order, backed by a formal 4-category risk register, 3-gate quality control SOP, and pre-launch regulatory compliance.`),
      operationsToFinanceAndTeamHandshakeNarrative:
        prev.operationsToFinanceAndTeamHandshakeNarrative.trim() ||
        `Module E hands off four verified operational metrics to the rest of the business plan: (1) ${currencySym}${totalEffectiveUnitDeliveryCogs.toFixed(2)}/order effective operational COGS (${currencySym}${totalDirectVariableCostPerOrder.toFixed(2)} direct delivery cost + ${currencySym}${expectedReturnBufferPerOrder.toFixed(2)} returns/QC reserve) feeds directly into Module G (Pricing & Pocket Profit Unit Economics); (2) ${currencySym}${monthlyPremises.toLocaleString()}/month premises & utilities plus an indicative estimated insurance overhead of ~${currencySym}${estimatedMonthlyInsuranceOverhead.toLocaleString()}/month (derived from the indicative ~${currencySym}${annualIns.toLocaleString()}/year insurance estimate — planning estimate only, actual coverage, policy terms, and premiums may vary upon insurer underwriting) sync into Module I Fixed Overheads; (3) ${currencySym}${newOutlayCapexExVat.toLocaleString()} ex-VAT new capital equipment outlay feeds into Module I Cashflow & Module J Grant Matching; and (4) the ${maxOrdersPerWeekByManualTime} orders/week manual capacity ceiling triggers our first operations/fulfillment hire in Module F.`,
    }));

    setSaveBanner(
      `📐 Applied ${countryPack.countryName} Operations "Things to Consider" Blind-Spot Checklist & Executive Operations Brief benchmark!`
    );
  }

  async function handleRunAiStep6(
    mode:
      | 'POPULATE_BLIND_SPOTS_AND_NARRATIVES'
      | 'NARRATIVES_ONLY' = 'POPULATE_BLIND_SPOTS_AND_NARRATIVES'
  ) {
    if (isVaultReadonly) return;
    setIsGeneratingAiStep6(true);
    setSaveBanner(null);
    try {
      const res = await onGenerateAiBlindSpotAudit({
        selectedTrack: inheritedTrack,
        otherProductTrackText: inheritedOtherTrackText,
        fulfillmentMode: step1Data.fulfillmentMode,
        activeMinutesPerOrder: totalActiveMinutesPerOrder,
        directVariableCostPerOrder: totalDirectVariableCostPerOrder,
        maxOrdersPerWeekCeiling: maxOrdersPerWeekByManualTime,
        premisesSetupMode: step2Data.premisesSetupMode,
        monthlyPremisesOverheadCost: step2Data.monthlyPremisesAndUtilitiesCost,
        totalEquipmentCapexExVat: newOutlayCapexExVat,
        supplierRedundancyPosture: step3Data.supplierRedundancyPosture,
        estimatedReturnRatePercent:
          step4Data.estimatedReturnOrRefundRatePercent,
        expectedReturnBufferPerOrder,
        estimatedAnnualInsurancePremium:
          step5Data.estimatedAnnualInsurancePremium,
        selectedInsuranceProviderName: step5Data.selectedInsuranceProviderName,
        currentReadinessConfidence: step6Data.readinessConfidence,
        currentBlindSpots: step6Data.blindSpots,
        mode,
      });

      if (!res.allowed) return;

      const nextData: OperationsBlindSpotAuditStep6Data = {
        ...step6Data,
        readinessConfidence:
          step6Data.readinessConfidence || res.readinessConfidence,
        otherReadinessConfidenceText:
          step6Data.otherReadinessConfidenceText ||
          res.otherReadinessConfidenceText ||
          '',
        blindSpots:
          mode === 'NARRATIVES_ONLY' && step6Data.blindSpots.length > 0
            ? step6Data.blindSpots
            : res.blindSpots,
        executiveOperationsSummaryNarrative:
          res.executiveOperationsSummaryNarrative,
        operationsToFinanceAndTeamHandshakeNarrative:
          res.operationsToFinanceAndTeamHandshakeNarrative,
        aiCoachTip: res.aiCoachTip,
        aiEngineUsed: res.engineMode,
        lastSavedAt: new Date().toISOString(),
      };

      setStep6Data(nextData);
      await onSaveStep6BlindSpotAudit(nextData, 100);
      setSaveBanner(
        mode === 'NARRATIVES_ONLY'
          ? '✨ Synthesized your Executive Operations Brief & Finance/Team Handshake Narratives and saved Step 6 (100% Module E Complete)!'
          : '✨ Generated your Operations "Things to Consider" Blind-Spot Audit & Executive Brief and saved Step 6 (100% Module E Complete)!'
      );
    } finally {
      setIsGeneratingAiStep6(false);
    }
  }

  async function handleSaveStep6() {
    if (isVaultReadonly) return;
    setIsSavingStep6(true);
    setSaveBanner(null);
    try {
      const nowIso = new Date().toISOString();
      const nextData: OperationsBlindSpotAuditStep6Data = {
        ...step6Data,
        lastSavedAt: nowIso,
      };
      setStep6Data(nextData);
      const isComplete =
        Boolean(nextData.readinessConfidence) &&
        nextData.blindSpots.length >= 2 &&
        nextData.executiveOperationsSummaryNarrative.trim().length > 10;
      await onSaveStep6BlindSpotAudit(nextData, isComplete ? 100 : 95);
      setSaveBanner(
        '✅ Saved Module E Step 6 (Operations "Things to Consider" Blind-Spot Engine & Executive Brief — Module E 100% Complete)!'
      );
    } finally {
      setIsSavingStep6(false);
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
      isComplete:
        Boolean(step3Data.supplierRedundancyPosture) &&
        step3Data.riskItems.length >= 4 &&
        step3Data.riskManagementGovernanceNarrative.trim().length > 10,
    },
    {
      id: 'STEP_4',
      short: 'Step 4',
      title: 'Support, Returns & QC',
      isComplete:
        Boolean(step4Data.supportOperatingModel) &&
        Boolean(step4Data.supportResponseSla) &&
        Boolean(step4Data.returnsAndWarrantyPolicy) &&
        step4Data.qcCheckpoints.length >= 2 &&
        step4Data.qualityControlAndStandardsNarrative.trim().length > 10,
    },
    {
      id: 'STEP_5',
      short: 'Step 5',
      title: 'Permits & Insurance Matcher',
      isComplete:
        Boolean(step5Data.regulatorySectorPosture) &&
        Boolean(step5Data.dataPrivacyPosture) &&
        Boolean(step5Data.insuranceCoverageBundle) &&
        step5Data.complianceItems.length >= 3 &&
        step5Data.regulatoryAndComplianceNarrative.trim().length > 10,
    },
    {
      id: 'STEP_6',
      short: 'Step 6',
      title: 'Ops Things to Consider',
      isComplete:
        Boolean(step6Data.readinessConfidence) &&
        step6Data.blindSpots.length >= 2 &&
        step6Data.executiveOperationsSummaryNarrative.trim().length > 10,
    },
  ];

  const moduleEReadinessSteps: Array<{
    stepNumber: number;
    label: string;
    isComplete: boolean;
    summary: string;
  }> = [
    {
      stepNumber: 1,
      label: 'Day in the Life of an Order',
      isComplete: STEP_TABS[0].isComplete,
      summary:
        step1Data.orderLifecycleStages.length >= 3
          ? `${step1Data.orderLifecycleStages.length} stages mapped • ${totalActiveMinutesPerOrder}m/order • ${formatPlanCurrency(totalDirectVariableCostPerOrder, plan.baseCurrency)} COGS`
          : 'Map fulfillment flow & single-order costs in Step 1',
    },
    {
      stepNumber: 2,
      label: 'Premises, Equipment & 3 Quotes',
      isComplete: STEP_TABS[1].isComplete,
      summary:
        step2Data.equipmentItems.length > 0
          ? `${step2Data.equipmentItems.length} equipment items • ${formatPlanCurrency(totalCapexExVat, plan.baseCurrency)} total • ${step2Data.equipmentItems.filter((i) => i.quoteComplianceStatus === 'THREE_QUOTES_UPLOADED_READY' || i.quoteComplianceStatus === 'HAVE_3_WRITTEN_QUOTES').length}/${step2Data.equipmentItems.length} 3-quote compliant`
          : 'Define workspace and equipment schedule in Step 2',
    },
    {
      stepNumber: 3,
      label: '4-Category Risk Register',
      isComplete: STEP_TABS[2].isComplete,
      summary:
        step3Data.riskItems.length > 0
          ? `${step3Data.riskItems.length} risks mapped across Operational, Supply, Financial & Legal`
          : 'Map operational and supply-chain risks in Step 3',
    },
    {
      stepNumber: 4,
      label: 'Support, Returns & QC',
      isComplete: STEP_TABS[3].isComplete,
      summary:
        step4Data.qcCheckpoints.length > 0
          ? `${step4Data.supportOperatingModel || 'Support'} • ${step4Data.supportResponseSla || 'SLA'} • ${step4Data.qcCheckpoints.length} QC checkpoints`
          : 'Set customer support SLAs and QC gates in Step 4',
    },
    {
      stepNumber: 5,
      label: 'Permits & Insurance Matcher',
      isComplete: STEP_TABS[4].isComplete,
      summary:
        step5Data.complianceItems.length > 0
          ? `${step5Data.complianceItems.length} statutory checklist items • Insurance bundle matched`
          : 'Confirm regulatory requirements and insurance in Step 5',
    },
    {
      stepNumber: 6,
      label: 'Ops Things to Consider',
      isComplete: STEP_TABS[5].isComplete,
      summary:
        step6Data.blindSpots.length > 0
          ? `${step6Data.blindSpots.length} considerations reviewed • Operations brief ready`
          : 'Review blind spots and finalize operations brief in Step 6',
    },
  ];

  const completedModuleECoreStepsCount = moduleEReadinessSteps
    .slice(0, 5)
    .filter((s) => s.isComplete).length;

  const completedModuleEReadinessCount = moduleEReadinessSteps.filter(
    (s) => s.isComplete
  ).length;

  const totalModuleEProgress = Math.round(
    (completedModuleEReadinessCount / moduleEReadinessSteps.length) * 100
  );

  return (
    <div className="space-y-5">
      {/* ===================================================================== */}
      {/* MODULE E HEADER CARD & 6-STEP ACCORDION NAVIGATION                    */}
      {/* ===================================================================== */}
      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-950 via-indigo-900 to-violet-900 p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-indigo-400/40 bg-indigo-500/30 text-indigo-100">
                Module E • Operations, Equipment &amp; Risk Register
              </Badge>
              <Badge className="border-emerald-400/30 bg-emerald-500/20 text-emerald-200">
                {selectedCountry === 'IE'
                  ? '🇮🇪'
                  : selectedCountry === 'GB'
                    ? '🇬🇧'
                    : '🌍'}{' '}
                {countryPack.countryName} Grant &amp; Ops Rules Active
              </Badge>
              <Badge className="border-indigo-400/30 bg-white/10 text-indigo-100">
                {countryPack.countryName} ({plan.baseCurrency})
              </Badge>
            </div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              Module E: How Your Business Actually Runs Day-to-Day
            </h1>
            <p className="max-w-3xl text-xs text-indigo-100/90 sm:text-sm">
              Map a single customer order from checkout to delivery, calculate hands-on maker/founder minutes and unit delivery COGS, schedule grant-eligible equipment (
              {selectedCountry === 'IE'
                ? 'enforcing IE LEO 3-quote & mobile asset / laptop ban rules'
                : selectedCountry === 'GB'
                  ? 'enforcing UK Innovate UK 12-month capital usage depreciation & Start Up Loan procurement rules'
                  : 'enforcing 3-quote procurement & capital grant eligibility rules'}
              ), and lock in your formal 4-category Risk Register.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setOpenStep((prev) => (prev === 'ALL' ? 1 : 'ALL'))
                }
                className="border-indigo-400/40 bg-white/10 text-xs text-white hover:bg-white/20"
              >
                {openStep === 'ALL' ? 'Focus Step-by-Step' : 'Expand All Steps'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onBackToModuleD}
                className="border-indigo-400/40 bg-white/10 text-xs text-white hover:bg-white/20"
              >
                <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                Back to Module D
              </Button>
            </div>
            <div className="text-right text-[11px] text-indigo-200">
              Module E Progress: <strong>{totalModuleEProgress}%</strong> ({completedModuleECoreStepsCount} of 5 Core Steps Ready)
            </div>
          </div>
        </div>

        {/* 6-Step Accordion Navigation Strip */}
        <div className="mt-5 grid grid-cols-2 gap-2 border-t border-indigo-800/70 pt-4 sm:grid-cols-3 lg:grid-cols-6">
          {[
            {
              step: 'Step 1',
              title: 'Order Blueprint',
              targetId: 'module-e-step-1',
              stepNum: 1,
              done: moduleEReadinessSteps[0]?.isComplete ?? false,
            },
            {
              step: 'Step 2',
              title: 'Premises & Equipment',
              targetId: 'module-e-step-2',
              stepNum: 2,
              done: moduleEReadinessSteps[1]?.isComplete ?? false,
            },
            {
              step: 'Step 3',
              title: 'Risk Register',
              targetId: 'module-e-step-3',
              stepNum: 3,
              done: moduleEReadinessSteps[2]?.isComplete ?? false,
            },
            {
              step: 'Step 4',
              title: 'Support, Returns & QC',
              targetId: 'module-e-step-4',
              stepNum: 4,
              done: moduleEReadinessSteps[3]?.isComplete ?? false,
            },
            {
              step: 'Step 5',
              title: 'Permits & Insurance',
              targetId: 'module-e-step-5',
              stepNum: 5,
              done: moduleEReadinessSteps[4]?.isComplete ?? false,
            },
            {
              step: 'Overview',
              title: 'Operations & Risk Brief',
              targetId: 'module-e-step-6',
              stepNum: 6,
              done:
                completedModuleECoreStepsCount === 5 ||
                (moduleEReadinessSteps[5]?.isComplete ?? false),
            },
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
                  setActiveTab(`STEP_${item.stepNum}` as any);
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
                <div className="mt-0.5 truncate text-[11px]">{item.title}</div>
              </button>
            );
          })}
        </div>
      </div>

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
            {/* =================================================================== */}
      {/* STEP 1: STEP 1: DAY IN THE LIFE OF AN ORDER */}
      {/* =================================================================== */}
      {openStep !== 'ALL' && openStep !== 1 ? (
        <div
          id="module-e-step-1"
          onClick={() => {
            setOpenStep(1);
            setActiveTab('STEP_1');
          }}
          className="group scroll-mt-24 cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  moduleEReadinessSteps[0]?.isComplete
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 text-white'
                }`}
              >
                {moduleEReadinessSteps[0]?.isComplete ? (
                  <Check className="h-4 w-4 stroke-[3]" />
                ) : (
                  '1'
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-sm font-bold text-slate-900">
                    Step 1: Day in the Life of an Order
                  </h2>
                  {moduleEReadinessSteps[0]?.isComplete ? (
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
                  {moduleEReadinessSteps[0]?.summary}
                </p>
              </div>
            </div>
            <div className="ml-3 flex shrink-0 items-center gap-2">
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
        <div id="module-e-step-1" className="scroll-mt-24 space-y-4">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white p-4 rounded-xl border shadow-xs">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    moduleEReadinessSteps[0]?.isComplete
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  {moduleEReadinessSteps[0]?.isComplete ? (
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  ) : (
                    '1'
                  )}
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  Step 1: Day in the Life of an Order
                </h2>
                <Badge variant="outline" className="shrink-0 text-[10px] text-indigo-700 border-indigo-200 bg-indigo-50">
                  Step 1 of 6
                </Badge>
                {moduleEReadinessSteps[0]?.isComplete ? (
                  <Badge variant="success" className="shrink-0 text-[10px]">
                    Completed
                  </Badge>
                ) : (
                  <Badge variant="outline" className="shrink-0 text-[10px] text-slate-600">
                    In Progress
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Walk through what happens the moment a customer clicks "Buy"—who does what, which tools/machines are used, hands-on maker minutes, and unit delivery COGS.
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
                        🚀 Startup Preflight (Cloud AI SaaS)
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
                        Startup Preflight — Cloud AI Co-Founder &amp;
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
                        &rarr; (3) AI-guided Modules B–K + public survey
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
                      setOpenStep(2);
                      setTimeout(() => {
                        const el = document.getElementById('module-e-step-2');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 50);
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
        </div>
      )}

      {/* =================================================================== */}
      {/* STEP 2: STEP 2: PREMISES, EQUIPMENT & 3 QUOTES */}
      {/* =================================================================== */}
      {openStep !== 'ALL' && openStep !== 2 ? (
        <div
          id="module-e-step-2"
          onClick={() => {
            setOpenStep(2);
            setActiveTab('STEP_2');
          }}
          className="group scroll-mt-24 cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  moduleEReadinessSteps[1]?.isComplete
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 text-white'
                }`}
              >
                {moduleEReadinessSteps[1]?.isComplete ? (
                  <Check className="h-4 w-4 stroke-[3]" />
                ) : (
                  '2'
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-sm font-bold text-slate-900">
                    Step 2: Premises, Equipment & 3 Quotes
                  </h2>
                  {moduleEReadinessSteps[1]?.isComplete ? (
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
                  {moduleEReadinessSteps[1]?.summary}
                </p>
              </div>
            </div>
            <div className="ml-3 flex shrink-0 items-center gap-2">
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
        <div id="module-e-step-2" className="scroll-mt-24 space-y-4">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white p-4 rounded-xl border shadow-xs">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    moduleEReadinessSteps[1]?.isComplete
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  {moduleEReadinessSteps[1]?.isComplete ? (
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  ) : (
                    '2'
                  )}
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  Step 2: Premises, Equipment & 3 Quotes
                </h2>
                <Badge variant="outline" className="shrink-0 text-[10px] text-indigo-700 border-indigo-200 bg-indigo-50">
                  Step 2 of 6
                </Badge>
                {moduleEReadinessSteps[1]?.isComplete ? (
                  <Badge variant="success" className="shrink-0 text-[10px]">
                    Completed
                  </Badge>
                ) : (
                  <Badge variant="outline" className="shrink-0 text-[10px] text-slate-600">
                    In Progress
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Define your operating premises, schedule capital equipment items, and enforce IE LEO 3-quote rules and mobile asset/laptop ban guardrails.
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
                      Startup Preflight Cloud SaaS
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
                        🚀 Startup Preflight (SaaS)
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
                          🚀 Startup Preflight — 100% Cloud-Native Remote Setup +
                          Ring-Fenced QA Hardware
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          disabled={isVaultReadonly}
                          onClick={() => handleLoadStep2PresetPersona('BMU_SAAS')}
                          className="h-7 bg-indigo-600 px-2.5 text-[11px] text-white hover:bg-indigo-700"
                        >
                          Load This SaaS Schedule into Step 2
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
                                  ? '✓ 3 Quotes Requested (3-Quote Concierge)'
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
                  <Button
                    type="button"
                    size="sm"
                    disabled={isSavingStep2}
                    onClick={async () => {
                      if (!isVaultReadonly) {
                        await handleSaveStep2();
                      }
                      setActiveTab('STEP_3');
                      setOpenStep(3);
                      setTimeout(() => {
                        const el = document.getElementById('module-e-step-3');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 50);
                    }}
                    className="bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    Save &amp; Continue to Step 3
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
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
        </div>
      )}

      {/* =================================================================== */}
      {/* STEP 3: STEP 3: 4-CATEGORY RISK REGISTER */}
      {/* =================================================================== */}
      {openStep !== 'ALL' && openStep !== 3 ? (
        <div
          id="module-e-step-3"
          onClick={() => {
            setOpenStep(3);
            setActiveTab('STEP_3');
          }}
          className="group scroll-mt-24 cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  moduleEReadinessSteps[2]?.isComplete
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 text-white'
                }`}
              >
                {moduleEReadinessSteps[2]?.isComplete ? (
                  <Check className="h-4 w-4 stroke-[3]" />
                ) : (
                  '3'
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-sm font-bold text-slate-900">
                    Step 3: 4-Category Risk Register
                  </h2>
                  {moduleEReadinessSteps[2]?.isComplete ? (
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
                  {moduleEReadinessSteps[2]?.summary}
                </p>
              </div>
            </div>
            <div className="ml-3 flex shrink-0 items-center gap-2">
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
        <div id="module-e-step-3" className="scroll-mt-24 space-y-4">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white p-4 rounded-xl border shadow-xs">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    moduleEReadinessSteps[2]?.isComplete
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  {moduleEReadinessSteps[2]?.isComplete ? (
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  ) : (
                    '3'
                  )}
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  Step 3: 4-Category Risk Register
                </h2>
                <Badge variant="outline" className="shrink-0 text-[10px] text-indigo-700 border-indigo-200 bg-indigo-50">
                  Step 3 of 6
                </Badge>
                {moduleEReadinessSteps[2]?.isComplete ? (
                  <Badge variant="success" className="shrink-0 text-[10px]">
                    Completed
                  </Badge>
                ) : (
                  <Badge variant="outline" className="shrink-0 text-[10px] text-slate-600">
                    In Progress
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Map critical project risks across Operational, Supply Chain, Financial, and Regulatory/Legal with mitigation actions.
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

          <div className="space-y-5">
          <Card className="border-indigo-200 bg-white shadow-xs">
            <CardHeader className="border-b border-slate-100 bg-slate-50/70 pb-4">
              <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-indigo-600 text-white">
                      Step 3 of 6 • Supply-Chain Resilience &amp; 4-Category
                      Risk Register
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-emerald-300 bg-emerald-50 text-[11px] text-emerald-900"
                    >
                      {selectedCountry === 'IE'
                        ? '🇮🇪 IE LEO Project Risk Table & Enterprise Ireland Supply-Chain Audit Ready'
                        : selectedCountry === 'GB'
                          ? '🇬🇧 UK Innovate UK Q9 Risk Register Appendix & Start Up Loan Ready'
                          : '🌍 4-Category Project Risk Register & Supply-Chain Audit Ready'}
                    </Badge>
                  </div>
                  <CardTitle className="text-base font-bold text-slate-900 sm:text-lg">
                    How Do You Prevent Single Points of Failure &amp; De-Risk
                    Execution?
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-600">
                    {selectedCountry === 'IE' ? (
                      <>
                        Define your backup supplier strategy and build a formal{' '}
                        <strong>
                          4-Category Project Risk Register (Likelihood 1–5
                          &times; Impact 1–5)
                        </strong>{' '}
                        covering Technical/Production, Commercial/Market,
                        Financial/Supply-Chain, and Managerial/Regulatory risks
                        for your{' '}
                        <strong>
                          🇮🇪 IE Local Enterprise Office (LEO) / Enterprise
                          Ireland
                        </strong>{' '}
                        business plan.
                      </>
                    ) : selectedCountry === 'GB' ? (
                      <>
                        Define your backup supplier strategy and build a formal{' '}
                        <strong>
                          4-Category Project Risk Register (Likelihood 1–5
                          &times; Impact 1–5)
                        </strong>{' '}
                        covering Technical/Production, Commercial/Market,
                        Financial/Supply-Chain, and Managerial/Regulatory risks
                        for{' '}
                        <strong>
                          🇬🇧 UK Innovate UK Question 9 (Risk Register Appendix)
                        </strong>{' '}
                        and{' '}
                        <strong>British Business Bank Start Up Loans</strong>.
                      </>
                    ) : (
                      <>
                        Define your backup supplier strategy and build a formal{' '}
                        <strong>
                          4-Category Project Risk Register (Likelihood 1–5
                          &times; Impact 1–5)
                        </strong>{' '}
                        covering Technical/Production, Commercial/Market,
                        Financial/Supply-Chain, and Managerial/Regulatory risks
                        for Module K.
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
                    onClick={() => setShowWhyAskingStep3(!showWhyAskingStep3)}
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
                      setShowExampleDrawerStep3(!showExampleDrawerStep3)
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
                    onClick={handleApplyStep3IndustryBenchmark}
                    className="border-amber-200 bg-amber-50/70 text-xs text-amber-900 hover:bg-amber-100"
                  >
                    <Gauge className="mr-1.5 h-3.5 w-3.5 text-amber-600" />
                    Use Industry Benchmark
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-5">
              {/* MICRO-COACHING DRAWER: WHY ARE WE ASKING THIS? */}
              {showWhyAskingStep3 && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 text-xs text-indigo-950">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-indigo-900">
                      <ShieldCheck className="h-4 w-4 text-indigo-700" />
                      Why Grant Evaluators &amp; Underwriters Require a Scored
                      4-Category Risk Register
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowWhyAskingStep3(false)}
                      className="text-[11px] font-semibold text-indigo-700 underline"
                    >
                      Close
                    </button>
                  </div>
                  {selectedCountry === 'IE' ? (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div className="rounded-lg border border-indigo-200/80 bg-white p-3">
                        <div className="font-bold text-slate-900">
                          1. 🇮🇪 IE LEO / Enterprise Ireland 4-Category Rule
                        </div>
                        <p className="mt-1 leading-relaxed text-slate-600">
                          Irish grant evaluators reject generic statements like
                          &ldquo;we have no major risks.&rdquo; They look for a
                          structured table covering{' '}
                          <strong>
                            Technical/Production, Commercial/Market,
                            Financial/Supply-Chain, and Managerial/Regulatory
                          </strong>{' '}
                          risks with concrete mitigations that reduce residual
                          risk to Low or Medium.
                        </p>
                      </div>
                      <div className="rounded-lg border border-indigo-200/80 bg-white p-3">
                        <div className="font-bold text-slate-900">
                          2. Dual-Sourced Supply-Chain Resilience
                        </div>
                        <p className="mt-1 leading-relaxed text-slate-600">
                          Because IE LEO requires 3 written quotes for items
                          &ge; {formatPlanCurrency(1000, plan.baseCurrency)} in
                          Appendix C, evaluators check that your runner-up
                          quoted suppliers also act as pre-vetted backup
                          suppliers if your primary vendor faces stockouts or
                          price spikes.
                        </p>
                      </div>
                      <div className="rounded-lg border border-indigo-200/80 bg-white p-3">
                        <div className="font-bold text-slate-900">
                          3. Retrospective Grant Cashflow Timing Risk
                        </div>
                        <p className="mt-1 leading-relaxed text-slate-600">
                          IE LEO capital grants are paid retrospectively after
                          you pay the supplier and submit receipts. Including a
                          Financial/Supply-Chain mitigation for working-capital
                          timing proves commercial maturity to the Evaluation
                          Committee.
                        </p>
                      </div>
                    </div>
                  ) : selectedCountry === 'GB' ? (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div className="rounded-lg border border-indigo-200/80 bg-white p-3">
                        <div className="font-bold text-slate-900">
                          1. 🇬🇧 UK Innovate UK Question 9 (Risk Register)
                        </div>
                        <p className="mt-1 leading-relaxed text-slate-600">
                          Innovate UK assessors score Question 9 specifically on
                          whether you identify{' '}
                          <strong>
                            Technical, Commercial, Financial, and
                            Managerial/Environmental
                          </strong>{' '}
                          risks, score Likelihood (1–5) &times; Impact (1–5),
                          assign a Work Package owner, and demonstrate how
                          mitigations reduce residual risk.
                        </p>
                      </div>
                      <div className="rounded-lg border border-indigo-200/80 bg-white p-3">
                        <div className="font-bold text-slate-900">
                          2. British Business Bank Start Up Loan Underwriting
                        </div>
                        <p className="mt-1 leading-relaxed text-slate-600">
                          Start Up Loan underwriters test what happens if a key
                          supplier delays delivery, customer conversion takes 60
                          days longer than planned, or a solo founder is
                          temporarily unavailable.
                        </p>
                      </div>
                      <div className="rounded-lg border border-indigo-200/80 bg-white p-3">
                        <div className="font-bold text-slate-900">
                          3. Linked to Module D Work Packages (WP1..n)
                        </div>
                        <p className="mt-1 leading-relaxed text-slate-600">
                          Linking each risk to a named owner and Work Package
                          (e.g., WP1 Engineering / Production, WP3 Go-to-Market)
                          compiles directly into your 2-page Risk Register
                          Appendix in Module K.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div className="rounded-lg border border-indigo-200/80 bg-white p-3">
                        <div className="font-bold text-slate-900">
                          1. Complete 4-Category Coverage
                        </div>
                        <p className="mt-1 leading-relaxed text-slate-600">
                          Assessors and lenders expect a balanced Risk Register
                          covering Technical/Production, Commercial/Market,
                          Financial/Supply-Chain, and Managerial/Regulatory
                          risks.
                        </p>
                      </div>
                      <div className="rounded-lg border border-indigo-200/80 bg-white p-3">
                        <div className="font-bold text-slate-900">
                          2. Quantified Gross vs. Residual Risk
                        </div>
                        <p className="mt-1 leading-relaxed text-slate-600">
                          Scoring Likelihood (1–5) &times; Impact (1–5) = Gross
                          Score (/25) and showing how your mitigation drops
                          Residual Risk to Low/Medium proves operational
                          readiness.
                        </p>
                      </div>
                      <div className="rounded-lg border border-indigo-200/80 bg-white p-3">
                        <div className="font-bold text-slate-900">
                          3. No Single Point of Failure
                        </div>
                        <p className="mt-1 leading-relaxed text-slate-600">
                          Documenting primary and backup suppliers plus a lead
                          time buffer protects your unit economics in Module G
                          and cashflow in Module I.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SHOW ME AN EXAMPLE DRAWER */}
              {showExampleDrawerStep3 && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs text-emerald-950">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-emerald-900">
                      <Lightbulb className="h-4 w-4 text-emerald-700" />
                      Industry Example: How a Scored Risk Row Reads in Module K
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowExampleDrawerStep3(false)}
                      className="text-[11px] font-semibold text-emerald-800 underline"
                    >
                      Close
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-emerald-200 bg-white p-3">
                      <div className="font-bold text-slate-900">
                        Physical / Maker Supply-Chain Risk Example
                      </div>
                      <p className="mt-1 leading-relaxed text-slate-600">
                        <strong>Risk:</strong> Primary raw material supplier
                        stockout or courier damage during Q4 peak (Likelihood 3
                        &times; Impact 4 = <strong>12/25 Gross</strong>).{' '}
                        <br />
                        <strong>Mitigation:</strong> Dual-source across 2
                        pre-vetted suppliers from our Step 2 3-quote bench, hold
                        21 days of buffer inventory on-site, and maintain a
                        backup tracked courier account &rarr;{' '}
                        <strong className="text-emerald-700">
                          LOW Residual Risk
                        </strong>
                        .
                      </p>
                    </div>
                    <div className="rounded-lg border border-emerald-200 bg-white p-3">
                      <div className="font-bold text-slate-900">
                        Digital / SaaS Infrastructure Risk Example
                      </div>
                      <p className="mt-1 leading-relaxed text-slate-600">
                        <strong>Risk:</strong> Third-party AI API rate spike or
                        upstream cloud outage (Likelihood 3 &times; Impact 5 ={' '}
                        <strong>15/25 Gross</strong>). <br />
                        <strong>Mitigation:</strong> Enforce hard daily API call
                        circuit breakers, automatic deterministic fallback, and
                        daily encrypted off-site PostgreSQL snapshots &rarr;{' '}
                        <strong className="text-emerald-700">
                          LOW Residual Risk
                        </strong>
                        .
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================= */}
              {/* LIVE 4-CARD RISK & RESILIENCE METRICS STRIP                   */}
              {/* ============================================================= */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    4-Category Coverage
                  </div>
                  <div className="mt-1 text-lg font-extrabold text-slate-900">
                    {coveredMandatoryCategories.length} / 4 Categories
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-600">
                    {missingMandatoryCategories.length === 0 ? (
                      <span className="font-semibold text-emerald-700">
                        ✓ Tech, Commercial, Financial &amp; Managerial covered
                      </span>
                    ) : (
                      <span className="font-semibold text-amber-800">
                        Missing:{' '}
                        {missingMandatoryCategories
                          .map((c) => c.label)
                          .join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3.5">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-800">
                    Average Gross Risk Score
                  </div>
                  <div className="mt-1 text-lg font-extrabold text-indigo-950">
                    {averageGrossRiskScore} / 25
                  </div>
                  <div className="mt-0.5 text-[11px] text-indigo-900/80">
                    {highGrossRiskItemsCount} high-severity gross risk(s) (&ge;
                    12/25) identified
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
                    Post-Mitigation Residual Risk
                  </div>
                  <div className="mt-1 text-lg font-extrabold text-emerald-950">
                    {lowOrMediumResidualRisksCount} /{' '}
                    {step3Data.riskItems.length} Controlled
                  </div>
                  <div className="mt-0.5 text-[11px] text-emerald-900/80">
                    {highResidualRisksCount === 0
                      ? '✓ Zero unmitigated High residual risks'
                      : `⚠️ ${highResidualRisksCount} risk(s) still rated HIGH residual`}
                  </div>
                </div>

                {selectedCountry === 'IE' ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-900">
                      🇮🇪 IE LEO / EI Risk Audit Status
                    </div>
                    <div className="mt-1 text-lg font-extrabold text-amber-950">
                      {coveredMandatoryCategories.length === 4 &&
                      highResidualRisksCount === 0
                        ? '100% Grant-Ready'
                        : 'Action Recommended'}
                    </div>
                    <div className="mt-0.5 text-[11px] text-amber-900/80">
                      {step3Data.leadTimeBufferDays}d supply buffer • Dual-source
                      &amp; 4-category table active
                    </div>
                  </div>
                ) : selectedCountry === 'GB' ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-900">
                      🇬🇧 UK Innovate UK Q9 Status
                    </div>
                    <div className="mt-1 text-lg font-extrabold text-amber-950">
                      {coveredMandatoryCategories.length === 4 &&
                      highResidualRisksCount === 0
                        ? 'Q9 Appendix Ready'
                        : 'Action Recommended'}
                    </div>
                    <div className="mt-0.5 text-[11px] text-amber-900/80">
                      {step3Data.leadTimeBufferDays}d supply buffer • Scored L
                      &times; I matrix &amp; WP owners active
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-900">
                      Supply-Chain Buffer &amp; Audit
                    </div>
                    <div className="mt-1 text-lg font-extrabold text-amber-950">
                      {step3Data.leadTimeBufferDays} Days Buffer
                    </div>
                    <div className="mt-0.5 text-[11px] text-amber-900/80">
                      {coveredMandatoryCategories.length === 4 &&
                      highResidualRisksCount === 0
                        ? '✓ All 4 risk categories mitigated'
                        : 'Complete all 4 categories for Module K'}
                    </div>
                  </div>
                )}
              </div>

              {/* ============================================================= */}
              {/* SECTION 1: SUPPLY-CHAIN RESILIENCE & BACKUP SOURCING          */}
              {/* ============================================================= */}
              <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      1. Supply-Chain Resilience &amp; Backup Supplier Posture
                    </h3>
                    <p className="text-xs text-slate-600">
                      How do you prevent a single supplier delay, raw material
                      shortage, or cloud API outage from halting customer
                      orders?
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <label className="font-bold text-slate-700">
                      Safety Stock / Lead-Time Buffer (Days):
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={180}
                      step={1}
                      disabled={isVaultReadonly}
                      value={step3Data.leadTimeBufferDays}
                      onChange={(e) =>
                        setStep3Data((prev) => ({
                          ...prev,
                          leadTimeBufferDays: Math.max(
                            0,
                            Math.min(180, Number(e.target.value) || 0)
                          ),
                        }))
                      }
                      className="w-20 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-center text-base font-bold text-indigo-900 sm:text-xs"
                    />
                    <span className="text-[11px] text-slate-500">days</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {SUPPLIER_REDUNDANCY_POSTURE_OPTIONS.map((opt) => {
                    const isSelected =
                      step3Data.supplierRedundancyPosture === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={isVaultReadonly}
                        onClick={() =>
                          setStep3Data((prev) => ({
                            ...prev,
                            supplierRedundancyPosture: opt.value,
                          }))
                        }
                        className={`flex flex-col justify-between rounded-xl border p-3 text-left transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-600/20'
                            : 'border-slate-200 bg-white hover:border-indigo-300'
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

                {step3Data.supplierRedundancyPosture === 'OTHER' && (
                  <div className="rounded-xl border border-indigo-200 bg-white p-3">
                    <label className="mb-1 block text-xs font-bold text-slate-800">
                      Describe Your Custom Supply-Chain Redundancy Strategy:
                    </label>
                    <input
                      type="text"
                      disabled={isVaultReadonly}
                      value={step3Data.otherSupplierRedundancyPostureText || ''}
                      onChange={(e) =>
                        setStep3Data((prev) => ({
                          ...prev,
                          otherSupplierRedundancyPostureText: e.target.value,
                        }))
                      }
                      placeholder="e.g., Co-operative local farm sourcing + seasonal cold-storage buffer..."
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-indigo-600 focus:outline-hidden sm:text-xs"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-800">
                      1B. Primary Suppliers, Couriers or Critical Cloud Stack
                    </label>
                    <textarea
                      rows={2}
                      disabled={isVaultReadonly}
                      value={step3Data.primarySuppliersSummary}
                      onChange={(e) =>
                        setStep3Data((prev) => ({
                          ...prev,
                          primarySuppliersSummary: e.target.value,
                        }))
                      }
                      placeholder="List your primary raw material suppliers, contract manufacturers, couriers, or primary cloud/API infrastructure..."
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-indigo-600 focus:outline-hidden sm:text-xs"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-800">
                      1C. Verified Backup Suppliers &amp; Failover Protocol
                    </label>
                    <textarea
                      rows={2}
                      disabled={isVaultReadonly}
                      value={step3Data.backupSuppliersSummary}
                      onChange={(e) =>
                        setStep3Data((prev) => ({
                          ...prev,
                          backupSuppliersSummary: e.target.value,
                        }))
                      }
                      placeholder="List your secondary backup suppliers, alternate courier account, or automated cloud failover / circuit-breaker setup..."
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-indigo-600 focus:outline-hidden sm:text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* ============================================================= */}
              {/* SECTION 2: INTERACTIVE 4-CATEGORY PROJECT RISK REGISTER       */}
              {/* ============================================================= */}
              <div className="space-y-4">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      2. Interactive 4-Category Project Risk Register (Likelihood
                      1–5 &times; Impact 1–5 = Gross Score /25)
                    </h3>
                    <p className="text-xs text-slate-600">
                      {selectedCountry === 'IE'
                        ? 'Score each operational risk and document concrete preventative actions & contingency triggers for your IE LEO / Enterprise Ireland evaluation.'
                        : selectedCountry === 'GB'
                          ? 'Score each operational risk, assign a Work Package owner, and document concrete mitigations for UK Innovate UK Question 9 & Start Up Loans.'
                          : 'Score each operational risk, assign an owner, and document concrete preventative actions & contingency triggers.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isVaultReadonly || isGeneratingAiStep3}
                      onClick={() =>
                        handleRunAiStep3('POPULATE_RISKS_AND_NARRATIVES')
                      }
                      className="border-indigo-300 bg-indigo-50 text-xs font-semibold text-indigo-900 hover:bg-indigo-100"
                    >
                      {isGeneratingAiStep3 ? (
                        <>
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          Drafting Risk Register...
                        </>
                      ) : (
                        <>
                          <Wand2 className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
                          AI Draft 4-Category Risk Register
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isVaultReadonly}
                      onClick={handleAddRiskItem}
                      className="border-indigo-300 bg-white text-xs font-semibold text-indigo-900 hover:bg-indigo-50"
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Add Risk Row
                    </Button>
                  </div>
                </div>

                {missingMandatoryCategories.length > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-950">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700" />
                      <span>
                        <strong>Missing Core Grant Risk Category:</strong> Add
                        at least one risk row for{' '}
                        <strong>
                          {missingMandatoryCategories
                            .map((c) => c.label)
                            .join(', ')}
                        </strong>{' '}
                        so all 4 mandatory grant categories are covered.
                      </span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddRiskItem}
                      disabled={isVaultReadonly}
                      className="h-7 bg-amber-700 px-2.5 text-[11px] font-semibold text-white hover:bg-amber-800"
                    >
                      + Add Missing Category Row
                    </Button>
                  </div>
                )}

                <div className="space-y-3">
                  {step3Data.riskItems.map((risk, idx) => {
                    const grossScore =
                      Math.max(1, Math.min(5, Number(risk.likelihoodScore) || 3)) *
                      Math.max(1, Math.min(5, Number(risk.impactScore) || 3));
                    const grossBadgeColor =
                      grossScore >= 15
                        ? 'border-rose-300 bg-rose-100 text-rose-900'
                        : grossScore >= 8
                          ? 'border-amber-300 bg-amber-100 text-amber-950'
                          : 'border-emerald-300 bg-emerald-100 text-emerald-900';

                    const residualBadgeColor =
                      risk.residualRiskRating === 'HIGH'
                        ? 'border-rose-300 bg-rose-100 text-rose-900'
                        : risk.residualRiskRating === 'MEDIUM'
                          ? 'border-amber-300 bg-amber-100 text-amber-950'
                          : 'border-emerald-300 bg-emerald-100 text-emerald-900';

                    return (
                      <div
                        key={risk.id}
                        className="space-y-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="bg-slate-900 text-[10px] text-white">
                              Risk #{idx + 1}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-bold ${grossBadgeColor}`}
                            >
                              Gross Score: {risk.likelihoodScore} &times;{' '}
                              {risk.impactScore} = {grossScore}/25
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-bold ${residualBadgeColor}`}
                            >
                              Residual:{' '}
                              {risk.residualRiskRating === 'OTHER' &&
                              risk.otherResidualRiskRatingText
                                ? risk.otherResidualRiskRatingText
                                : risk.residualRiskRating}
                            </Badge>
                          </div>

                          {step3Data.riskItems.length > 1 && (
                            <button
                              type="button"
                              disabled={isVaultReadonly}
                              onClick={() => handleRemoveRiskItem(risk.id)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-800"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                          <div className="md:col-span-4">
                            <label className="mb-1 block text-[11px] font-bold text-slate-700">
                              Risk Category (4 Grant Pillars)
                            </label>
                            <select
                              disabled={isVaultReadonly}
                              value={risk.riskCategory}
                              onChange={(e) =>
                                handleUpdateRiskItem(risk.id, {
                                  riskCategory: e.target
                                    .value as ProjectRiskCategoryType,
                                })
                              }
                              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-base text-slate-900 focus:border-indigo-600 focus:outline-hidden sm:text-xs"
                            >
                              {PROJECT_RISK_CATEGORY_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                            {risk.riskCategory === 'OTHER' && (
                              <input
                                type="text"
                                disabled={isVaultReadonly}
                                value={risk.otherRiskCategoryText || ''}
                                onChange={(e) =>
                                  handleUpdateRiskItem(risk.id, {
                                    otherRiskCategoryText: e.target.value,
                                  })
                                }
                                placeholder="Specify custom risk category..."
                                className="mt-1.5 w-full rounded-lg border border-indigo-300 bg-white px-2.5 py-1.5 text-base text-slate-900 sm:text-xs"
                              />
                            )}
                          </div>

                          <div className="md:col-span-8">
                            <label className="mb-1 block text-[11px] font-bold text-slate-700">
                              Specific Risk Title / Failure Mode
                            </label>
                            <input
                              type="text"
                              disabled={isVaultReadonly}
                              value={risk.riskTitle}
                              onChange={(e) =>
                                handleUpdateRiskItem(risk.id, {
                                  riskTitle: e.target.value,
                                })
                              }
                              placeholder="e.g., Primary supplier lead-time spike or CNC / production bottleneck during Q4 peak..."
                              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-base font-semibold text-slate-900 focus:border-indigo-600 focus:outline-hidden sm:text-xs"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                          <div className="grid grid-cols-2 gap-2 md:col-span-4">
                            <div>
                              <label className="mb-1 block text-[11px] font-bold text-slate-700">
                                Likelihood (1–5)
                              </label>
                              <select
                                disabled={isVaultReadonly}
                                value={risk.likelihoodScore}
                                onChange={(e) =>
                                  handleUpdateRiskItem(risk.id, {
                                    likelihoodScore: Number(e.target.value),
                                  })
                                }
                                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-base font-bold text-slate-900 sm:text-xs"
                              >
                                <option value={1}>1 — Rare</option>
                                <option value={2}>2 — Unlikely</option>
                                <option value={3}>3 — Possible</option>
                                <option value={4}>4 — Likely</option>
                                <option value={5}>5 — Almost Certain</option>
                              </select>
                            </div>

                            <div>
                              <label className="mb-1 block text-[11px] font-bold text-slate-700">
                                Impact (1–5)
                              </label>
                              <select
                                disabled={isVaultReadonly}
                                value={risk.impactScore}
                                onChange={(e) =>
                                  handleUpdateRiskItem(risk.id, {
                                    impactScore: Number(e.target.value),
                                  })
                                }
                                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-base font-bold text-slate-900 sm:text-xs"
                              >
                                <option value={1}>1 — Negligible</option>
                                <option value={2}>2 — Minor</option>
                                <option value={3}>3 — Moderate</option>
                                <option value={4}>4 — Major</option>
                                <option value={5}>5 — Critical</option>
                              </select>
                            </div>
                          </div>

                          <div className="md:col-span-4">
                            <label className="mb-1 block text-[11px] font-bold text-slate-700">
                              Owner &amp; Work Package (WP1..n)
                            </label>
                            <input
                              type="text"
                              disabled={isVaultReadonly}
                              value={risk.ownerAndWorkPackage}
                              onChange={(e) =>
                                handleUpdateRiskItem(risk.id, {
                                  ownerAndWorkPackage: e.target.value,
                                })
                              }
                              placeholder="e.g., Founder / Ops Lead (WP2)"
                              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-base text-slate-900 focus:border-indigo-600 focus:outline-hidden sm:text-xs"
                            />
                          </div>

                          <div className="md:col-span-4">
                            <label className="mb-1 block text-[11px] font-bold text-slate-700">
                              Residual Risk (After Mitigation)
                            </label>
                            <select
                              disabled={isVaultReadonly}
                              value={risk.residualRiskRating}
                              onChange={(e) =>
                                handleUpdateRiskItem(risk.id, {
                                  residualRiskRating: e.target
                                    .value as ResidualRiskRatingType,
                                })
                              }
                              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-base text-slate-900 focus:border-indigo-600 focus:outline-hidden sm:text-xs"
                            >
                              {RESIDUAL_RISK_RATING_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                            {risk.residualRiskRating === 'OTHER' && (
                              <input
                                type="text"
                                disabled={isVaultReadonly}
                                value={risk.otherResidualRiskRatingText || ''}
                                onChange={(e) =>
                                  handleUpdateRiskItem(risk.id, {
                                    otherResidualRiskRatingText: e.target.value,
                                  })
                                }
                                placeholder="Specify custom residual rating..."
                                className="mt-1.5 w-full rounded-lg border border-indigo-300 bg-white px-2.5 py-1.5 text-base text-slate-900 sm:text-xs"
                              />
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="mb-1 block text-[11px] font-bold text-slate-700">
                            Concrete Preventative Mitigation &amp; Contingency
                            Trigger
                          </label>
                          <textarea
                            rows={2}
                            disabled={isVaultReadonly}
                            value={risk.mitigationAndContingencyPlan}
                            onChange={(e) =>
                              handleUpdateRiskItem(risk.id, {
                                mitigationAndContingencyPlan: e.target.value,
                              })
                            }
                            placeholder="Explain your preventative controls today AND what automatic contingency triggers if this risk occurs..."
                            className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-base text-slate-800 focus:border-indigo-600 focus:outline-hidden sm:text-xs"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ============================================================= */}
              {/* SECTION 3: AI SUPPLY-CHAIN & RISK GOVERNANCE NARRATIVES       */}
              {/* ============================================================= */}
              <div className="space-y-4 rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <Wand2 className="h-4 w-4 text-indigo-600" />
                      <h3 className="text-sm font-bold text-slate-900">
                        3. Supply-Chain Resilience &amp; Risk Management
                        Governance Narratives
                      </h3>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-600">
                      {selectedCountry === 'IE'
                        ? 'Synthesize your formal Supply-Chain Resilience and 4-Category Risk Management narratives for your IE LEO / Enterprise Ireland Business Plan in Module K.'
                        : selectedCountry === 'GB'
                          ? 'Synthesize your formal Supply-Chain Resilience and UK Innovate UK Question 9 / Start Up Loan Risk Management narratives for Module K.'
                          : 'Synthesize your formal Supply-Chain Resilience and 4-Category Risk Management narratives for Module K.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isVaultReadonly || isGeneratingAiStep3}
                      onClick={() => handleRunAiStep3('NARRATIVES_ONLY')}
                      className="border-indigo-300 bg-white text-xs font-semibold text-indigo-900 hover:bg-indigo-50"
                    >
                      {isGeneratingAiStep3 ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
                      )}
                      Synthesize Narratives from My Register
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={isVaultReadonly || isGeneratingAiStep3}
                      onClick={() =>
                        handleRunAiStep3('POPULATE_RISKS_AND_NARRATIVES')
                      }
                      className="bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-700"
                    >
                      {isGeneratingAiStep3 ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Wand2 className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      Auto-Draft Full Register &amp; Narratives
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      3A. Supply-Chain Resilience &amp; Backup Sourcing
                      Narrative
                    </label>
                    <textarea
                      rows={4}
                      disabled={isVaultReadonly}
                      value={step3Data.supplyChainResilienceNarrative}
                      onChange={(e) =>
                        setStep3Data((prev) => ({
                          ...prev,
                          supplyChainResilienceNarrative: e.target.value,
                        }))
                      }
                      placeholder="Explain how your dual-sourcing, safety buffer stock, or multi-region cloud failover eliminates single points of failure..."
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 text-base leading-relaxed text-slate-900 focus:border-indigo-600 focus:outline-hidden sm:text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      3B. Project Risk Management &amp; Mitigation Governance
                      Narrative
                    </label>
                    <textarea
                      rows={4}
                      disabled={isVaultReadonly}
                      value={step3Data.riskManagementGovernanceNarrative}
                      onChange={(e) =>
                        setStep3Data((prev) => ({
                          ...prev,
                          riskManagementGovernanceNarrative: e.target.value,
                        }))
                      }
                      placeholder="Summarize how your 4-category Risk Register is reviewed across Work Packages so residual operational, commercial, and financial risk remains Low..."
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 text-base leading-relaxed text-slate-900 focus:border-indigo-600 focus:outline-hidden sm:text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* ============================================================= */}
              {/* BOTTOM ACTION BAR: PARK QUESTION + SAVE STEP 3                */}
              {/* ============================================================= */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('STEP_2')}
                    className="text-xs"
                  >
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                    Back to Step 2
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowParkInputStep3(!showParkInputStep3)}
                    className="border-amber-300 bg-amber-50/70 text-xs text-amber-900 hover:bg-amber-100"
                  >
                    <BookmarkPlus className="mr-1.5 h-3.5 w-3.5 text-amber-700" />
                    Park Supply-Chain / Risk Question
                  </Button>
                  {step3Data.lastSavedAt && (
                    <span className="text-[11px] font-medium text-emerald-700">
                      ✓ Saved{' '}
                      {new Date(step3Data.lastSavedAt).toLocaleTimeString([], {
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
                    disabled={isVaultReadonly || isSavingStep3}
                    onClick={handleSaveStep3}
                    className="bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-700"
                  >
                    {isSavingStep3 ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Saving Step 3...
                      </>
                    ) : (
                      <>
                        <Save className="mr-1.5 h-3.5 w-3.5" />
                        Save Step 3 Risk Register
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={isSavingStep3}
                    onClick={async () => {
                      if (!isVaultReadonly) {
                        await handleSaveStep3();
                      }
                      setActiveTab('STEP_4');
                      setOpenStep(4);
                      setTimeout(() => {
                        const el = document.getElementById('module-e-step-4');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 50);
                    }}
                    className="bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    Save &amp; Continue to Step 4
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {showParkInputStep3 && (
                <div className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    value={parkQuestionInputStep3}
                    onChange={(e) => setParkQuestionInputStep3(e.target.value)}
                    placeholder="e.g., Confirm secondary packaging supplier lead time and minimum order quantity..."
                    className="flex-1 rounded-lg border border-amber-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-amber-500 focus:outline-hidden sm:text-xs"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={async () => {
                      const clean = parkQuestionInputStep3.trim();
                      if (!clean) return;
                      await onParkOpenQuestion(clean);
                      setParkQuestionInputStep3('');
                      setShowParkInputStep3(false);
                      setSaveBanner(
                        '📌 Parked supply-chain/risk question in your Open Questions Parking Lot!'
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
          {/* LIVE STEP 3 OUTPUT PREVIEW TABLE (MODULE K RISK COMPILER)         */}
          {/* ================================================================= */}
          <Card className="border-indigo-200 bg-gradient-to-br from-white to-indigo-50/40 shadow-xs">
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-sm font-bold text-slate-900">
                  📋 Live Step 3 Output Preview (
                  {selectedCountry === 'IE'
                    ? '🇮🇪 Module K — IE LEO / Enterprise Ireland 4-Category Project Risk Table'
                    : selectedCountry === 'GB'
                      ? '🇬🇧 Module K — UK Innovate UK Question 9 Risk Register Appendix'
                      : 'Module K — 4-Category Project Risk Register'}
                  )
                </CardTitle>
                <Badge
                  variant="outline"
                  className="border-emerald-300 bg-emerald-50 text-[10px] text-emerald-800"
                >
                  Synced to Module K Grant &amp; Business Plan Compiler
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-700">
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full min-w-[680px] text-left text-[11px]">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase text-slate-600">
                    <tr>
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2">Risk &amp; Mitigation Plan</th>
                      <th className="px-3 py-2">Owner / WP</th>
                      <th className="px-3 py-2 text-center">
                        Gross (L&times;I)
                      </th>
                      <th className="px-3 py-2 text-right">Residual</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {step3Data.riskItems.map((risk) => {
                      const gross =
                        Math.max(
                          1,
                          Math.min(5, Number(risk.likelihoodScore) || 3)
                        ) *
                        Math.max(1, Math.min(5, Number(risk.impactScore) || 3));
                      const catObj = PROJECT_RISK_CATEGORY_OPTIONS.find(
                        (c) => c.value === risk.riskCategory
                      );
                      return (
                        <tr key={risk.id}>
                          <td className="px-3 py-2 font-semibold text-slate-800">
                            {risk.riskCategory === 'OTHER' &&
                            risk.otherRiskCategoryText
                              ? risk.otherRiskCategoryText
                              : catObj?.shortLabel || risk.riskCategory}
                          </td>
                          <td className="px-3 py-2">
                            <div className="font-bold text-slate-900">
                              {risk.riskTitle}
                            </div>
                            <div className="mt-0.5 text-[10px] text-slate-600">
                              <span className="font-semibold text-indigo-800">
                                Mitigation:
                              </span>{' '}
                              {risk.mitigationAndContingencyPlan}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-slate-700">
                            {risk.ownerAndWorkPackage}
                          </td>
                          <td className="px-3 py-2 text-center font-bold text-slate-900">
                            {risk.likelihoodScore}&times;{risk.impactScore} ={' '}
                            {gross}/25
                          </td>
                          <td className="px-3 py-2 text-right font-bold">
                            <span
                              className={
                                risk.residualRiskRating === 'HIGH'
                                  ? 'text-rose-700'
                                  : risk.residualRiskRating === 'MEDIUM'
                                    ? 'text-amber-700'
                                    : 'text-emerald-700'
                              }
                            >
                              {risk.residualRiskRating === 'OTHER' &&
                              risk.otherResidualRiskRatingText
                                ? risk.otherResidualRiskRatingText
                                : risk.residualRiskRating}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* STEP 4: STEP 4: SUPPORT, RETURNS, WARRANTY & QC SOP */}
      {/* =================================================================== */}
      {openStep !== 'ALL' && openStep !== 4 ? (
        <div
          id="module-e-step-4"
          onClick={() => {
            setOpenStep(4);
            setActiveTab('STEP_4');
          }}
          className="group scroll-mt-24 cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  moduleEReadinessSteps[3]?.isComplete
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 text-white'
                }`}
              >
                {moduleEReadinessSteps[3]?.isComplete ? (
                  <Check className="h-4 w-4 stroke-[3]" />
                ) : (
                  '4'
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-sm font-bold text-slate-900">
                    Step 4: Support, Returns, Warranty & QC SOP
                  </h2>
                  {moduleEReadinessSteps[3]?.isComplete ? (
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
                  {moduleEReadinessSteps[3]?.summary}
                </p>
              </div>
            </div>
            <div className="ml-3 flex shrink-0 items-center gap-2">
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
        <div id="module-e-step-4" className="scroll-mt-24 space-y-4">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white p-4 rounded-xl border shadow-xs">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    moduleEReadinessSteps[3]?.isComplete
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  {moduleEReadinessSteps[3]?.isComplete ? (
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  ) : (
                    '4'
                  )}
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  Step 4: Support, Returns, Warranty & QC SOP
                </h2>
                <Badge variant="outline" className="shrink-0 text-[10px] text-indigo-700 border-indigo-200 bg-indigo-50">
                  Step 4 of 6
                </Badge>
                {moduleEReadinessSteps[3]?.isComplete ? (
                  <Badge variant="success" className="shrink-0 text-[10px]">
                    Completed
                  </Badge>
                ) : (
                  <Badge variant="outline" className="shrink-0 text-[10px] text-slate-600">
                    In Progress
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Define customer support response SLAs, return/warranty policies, and quality control inspection checkpoints.
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

          <div className="space-y-6">
          {/* 4-Layer Support & Action Bar (No Presets — Pure Plan-Driven) */}
          <Card className="border-indigo-200/80 bg-gradient-to-r from-indigo-50/70 via-white to-emerald-50/50 shadow-xs">
            <CardContent className="p-4">
              <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-indigo-600 text-white">
                      Step 4 of 6 • Support, Returns, Warranty &amp; QC SOP
                    </Badge>
                    {selectedCountry === 'IE' ? (
                      <Badge
                        variant="outline"
                        className="border-emerald-300 bg-emerald-50 text-emerald-900"
                      >
                        🇮🇪 Ireland Consumer Rights Act 2022 (CRAA) &amp; CCPC
                        Mode
                      </Badge>
                    ) : selectedCountry === 'GB' ? (
                      <Badge
                        variant="outline"
                        className="border-indigo-300 bg-indigo-50 text-indigo-900"
                      >
                        🇬🇧 UK Consumer Rights Act 2015 &amp; Consumer Contracts
                        Mode
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-slate-300 bg-white text-slate-700"
                      >
                        🌍 {countryPack.countryName} Consumer Protection &amp;
                        QC Mode
                      </Badge>
                    )}
                    {step4Data.aiEngineUsed && (
                      <Badge
                        variant="outline"
                        className="border-violet-200 bg-violet-50 text-[11px] text-violet-800"
                      >
                        Engine: {step4Data.aiEngineUsed}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-600">
                    Define how your business handles customer support SLAs,
                    returns/remakes, statutory warranties, and 3-gate Quality
                    Control (QC) checkpoints so defect/refund friction never
                    quietly erodes your Module G unit economics.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowWhyAskingStep4((v) => !v)}
                    className="h-8 border-indigo-200 bg-white text-xs text-indigo-700 hover:bg-indigo-50"
                  >
                    <HelpCircle className="mr-1.5 h-3.5 w-3.5" />
                    Why Are We Asking?
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowExampleDrawerStep4((v) => !v)}
                    className="h-8 border-emerald-200 bg-white text-xs text-emerald-700 hover:bg-emerald-50"
                  >
                    <Lightbulb className="mr-1.5 h-3.5 w-3.5" />
                    Show Me an Example
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isVaultReadonly}
                    onClick={handleApplyStep4IndustryBenchmark}
                    className="h-8 border-amber-200 bg-amber-50/70 text-xs font-semibold text-amber-900 hover:bg-amber-100"
                  >
                    <Layers className="mr-1.5 h-3.5 w-3.5 text-amber-600" />
                    Use Industry Benchmark
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowParkInputStep4((v) => !v)}
                    className="h-8 border-slate-200 bg-white text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <BookmarkPlus className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
                    Park Open Question
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isVaultReadonly || isGeneratingAiStep4}
                    onClick={() =>
                      handleRunAiStep4('POPULATE_QC_AND_NARRATIVES')
                    }
                    className="h-8 border-violet-200 bg-violet-50/70 text-xs font-semibold text-violet-800 hover:bg-violet-100"
                  >
                    <MessageSquareWarning className="mr-1.5 h-3.5 w-3.5 text-violet-600" />
                    I&apos;m Stuck (AI Auto-Draft)
                  </Button>
                </div>
              </div>

              {/* Layer 1A: Why Are We Asking This? */}
              {showWhyAskingStep4 && (
                <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50/70 p-3.5 text-xs text-indigo-950">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-indigo-900">
                      🎯 Why Evaluators &amp; Investors Audit Your QC &amp;
                      Returns SOP:
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowWhyAskingStep4(false)}
                      className="text-[11px] font-semibold text-indigo-700 underline"
                    >
                      Close
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                    <div className="rounded-lg border border-indigo-200/80 bg-white p-2.5">
                      <p className="font-semibold text-slate-900">
                        1. Protecting Unit Pocket Profit (Module G)
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                        A single damaged shipment, remake, or refund can wipe
                        out the profit of 3–5 good orders. Explicitly budgeting
                        an Expected Return/Remake Allowance per order prevents
                        &ldquo;phantom margin&rdquo; in your financial model.
                      </p>
                    </div>
                    <div className="rounded-lg border border-indigo-200/80 bg-white p-2.5">
                      <p className="font-semibold text-slate-900">
                        {selectedCountry === 'IE'
                          ? '2. 🇮🇪 Ireland Consumer Rights Act 2022 & LEO Quality Proof'
                          : selectedCountry === 'GB'
                            ? '2. 🇬🇧 UK Consumer Rights Act 2015 & Start Up Loan Viability'
                            : `2. 🌍 ${countryPack.countryName} Statutory Consumer Law & Quality Proof`}
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                        {selectedCountry === 'IE'
                          ? 'Under Ireland’s Consumer Rights Act 2022 (CRAA) and CCPC rules, standard online orders carry a 14-day cooling-off right, while bespoke/custom-made goods are exempt under Part 5 Section 111(d) (except for manufacturing defects). IE LEO evaluators also check how you maintain repeatable export-grade quality.'
                          : selectedCountry === 'GB'
                            ? 'Under the UK Consumer Rights Act 2015 (30-day short-term right to reject faulty goods) and Consumer Contracts Regulations 2013 (14-day distance cooling-off, with Regulation 28(1)(b) exemption for bespoke goods), British Business Bank & Innovate UK assessors expect clear QC and warranty standards.'
                            : 'Consumer protection laws distinguish between standard distance sales (cooling-off returns) and custom/B2B contracts. Clear QC gates prevent defects before dispatch.'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-indigo-200/80 bg-white p-2.5">
                      <p className="font-semibold text-slate-900">
                        3. Protecting Founder Focus
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                        Without a realistic Support SLA (e.g., 24-hour weekday
                        async email vs. unstaffed 24/7 live chat), customer
                        support interruptions fragment your deep production or
                        engineering blocks from Step 1.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Layer 1B: Tailored Example Drawer */}
              {showExampleDrawerStep4 && (
                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-950">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-emerald-900">
                      💡 What Good Looks Like for Your Plan (
                      {plan.title || 'Your Startup'}):
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowExampleDrawerStep4(false)}
                      className="text-[11px] font-semibold text-emerald-800 underline"
                    >
                      Close
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <div className="rounded-lg border border-emerald-200 bg-white p-2.5">
                      <p className="font-semibold text-slate-900">
                        Physical / Craft / Hardware Example
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                        • <strong>Support Model:</strong> Founder Async Email +
                        QR Care Card inside every box (Next Business Day SLA).
                        <br />• <strong>Returns &amp; Warranty:</strong>{' '}
                        {selectedCountry === 'IE'
                          ? '14-Day CCPC Cooling-Off on stock items; Bespoke engraved items exempt under CRAA 2022 Sec 111(d) with 12-Month Structural Remake Guarantee.'
                          : selectedCountry === 'GB'
                            ? '14-Day Consumer Contracts Cooling-Off on stock items; Bespoke items exempt under Reg 28(1)(b) with 12-Month Structural Remake Guarantee.'
                            : '14-Day standard return on stock items; custom orders covered by 12-Month Structural Remake Guarantee.'}
                        <br />• <strong>3 QC Gates:</strong> (1) Incoming
                        moisture/material check &rarr; (2) Mid-build dimensional
                        tolerance check &rarr; (3) Final finish &amp; drop-proof
                        packaging sign-off.
                      </p>
                    </div>
                    <div className="rounded-lg border border-emerald-200 bg-white p-2.5">
                      <p className="font-semibold text-slate-900">
                        Digital / SaaS / Service Example
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                        • <strong>Support Model:</strong> Self-Serve Help Center
                        + In-App Contextual Guidance + Async Support Inbox
                        (&lt; 24h Weekday SLA).
                        <br />• <strong>Returns &amp; SLA Policy:</strong>{' '}
                        {selectedCountry === 'IE'
                          ? '14-Day Money-Back Guarantee / Pro-Rata Credit aligned with Ireland Consumer Rights Act 2022 Part 3 (Digital Content & Services).'
                          : selectedCountry === 'GB'
                            ? '14-Day Money-Back Guarantee / Pro-Rata Credit aligned with UK Consumer Rights Act 2015 Chapter 3 (Digital Content).'
                            : '14-Day Money-Back Guarantee / Self-Serve Cancellation with zero lock-in.'}
                        <br />• <strong>3 QC Gates:</strong> (1) Automated
                        TypeScript &amp; Schema Gate &rarr; (2) Staging &amp;
                        Security Validation &rarr; (3) Post-Release Telemetry
                        &amp; Billing Receipt Check.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Layer 3: Park It in Open Questions */}
              {showParkInputStep4 && (
                <div className="mt-3 flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    value={parkQuestionInputStep4}
                    onChange={(e) => setParkQuestionInputStep4(e.target.value)}
                    placeholder="e.g., Confirm whether our custom gift bundles qualify for the bespoke cooling-off exemption or require a 3% return buffer..."
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-base text-slate-900 focus:border-indigo-500 focus:outline-none sm:text-xs"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={async () => {
                      if (!parkQuestionInputStep4.trim()) return;
                      await onParkOpenQuestion(
                        `[Module E Step 4 — Support, Returns & QC] ${parkQuestionInputStep4.trim()}`
                      );
                      setParkQuestionInputStep4('');
                      setShowParkInputStep4(false);
                      setSaveBanner(
                        '📌 Parked question in your Open Questions Parking Lot!'
                      );
                    }}
                    className="bg-indigo-600 text-xs text-white hover:bg-indigo-700"
                  >
                    Save to Parking Lot
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Live Step 4 KPI Dashboard Strip */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                  Support SLA &amp; Channel
                </span>
                <Headphones className="h-4 w-4 text-indigo-600" />
              </div>
              <p className="mt-1.5 text-sm font-bold text-slate-900">
                {step4Data.supportResponseSla === 'OTHER' &&
                step4Data.otherSupportResponseSlaText
                  ? step4Data.otherSupportResponseSlaText
                  : SUPPORT_RESPONSE_SLA_OPTIONS.find(
                      (o) => o.value === step4Data.supportResponseSla
                    )?.label || 'Next Business Day (< 24h)'}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-slate-500">
                {step4Data.supportOperatingModel === 'OTHER' &&
                step4Data.otherSupportOperatingModelText
                  ? step4Data.otherSupportOperatingModelText
                  : SUPPORT_OPERATING_MODEL_OPTIONS.find(
                      (o) => o.value === step4Data.supportOperatingModel
                    )?.label}
              </p>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-wider text-amber-900 uppercase">
                  Return / Remake Buffer per Order
                </span>
                <RotateCcw className="h-4 w-4 text-amber-600" />
              </div>
              <p className="mt-1.5 text-lg font-extrabold text-amber-950">
                {plan.baseCurrency === 'GBP' ? '£' : '€'}
                {expectedReturnAllowancePerOrder.toFixed(2)}{' '}
                <span className="text-xs font-normal text-amber-800">
                  / order
                </span>
              </p>
              <p className="mt-0.5 text-[11px] text-amber-800">
                {step4Data.estimatedReturnOrRefundRatePercent}% rate ×{' '}
                {plan.baseCurrency === 'GBP' ? '£' : '€'}
                {step4Data.costPerReturnOrRemakeIncident} per incident (feeds
                Module G)
              </p>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-wider text-emerald-900 uppercase">
                  Active QC Gates Enforced
                </span>
                <ClipboardCheck className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="mt-1.5 text-lg font-extrabold text-emerald-950">
                {step4Data.qcCheckpoints.length} Checkpoints{' '}
                <span className="text-xs font-normal text-emerald-800">
                  ({distinctQcGatesCovered.length} stage gates)
                </span>
              </p>
              <p className="mt-0.5 text-[11px] text-emerald-800">
                {step4Data.warrantyDurationMonths > 0
                  ? `${step4Data.warrantyDurationMonths}-Month Warranty / Guarantee`
                  : 'Service-Level Guarantee Active'}
              </p>
            </div>

            <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-wider text-indigo-900 uppercase">
                  Monthly Return Reserve @ Max Cap
                </span>
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
              </div>
              <p className="mt-1.5 text-lg font-extrabold text-indigo-950">
                {plan.baseCurrency === 'GBP' ? '£' : '€'}
                {expectedMonthlyReturnCostAtMaxCapacity.toLocaleString()}{' '}
                <span className="text-xs font-normal text-indigo-800">/ mo</span>
              </p>
              <p className="mt-0.5 text-[11px] text-indigo-800">
                At {maxOrdersPerMonthByManualTime} orders/mo capacity from Step
                1
              </p>
            </div>
          </div>

          {/* Strict Country-Isolated Statutory Consumer Rights & Grant Quality Banner */}
          {selectedCountry === 'IE' ? (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50/80 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                <div className="space-y-1 text-xs text-emerald-950">
                  <p className="font-bold text-emerald-900">
                    🇮🇪 Ireland Consumer Rights Act 2022 (CRAA), CCPC &amp; LEO
                    Quality Standards Guardrail
                  </p>
                  <p className="leading-relaxed text-emerald-900">
                    Under Ireland&apos;s{' '}
                    <strong>Consumer Rights Act 2022 (CRAA)</strong> and{' '}
                    <strong>CCPC</strong> distance-selling rules: (1) Standard
                    consumer online orders carry a mandatory{' '}
                    <strong>14-day cooling-off cancellation period</strong> from
                    delivery; (2) Goods made to the consumer&apos;s
                    specifications or clearly personalized (e.g., custom sizes,
                    monograms, or bespoke builds) are{' '}
                    <strong>
                      exempt from change-of-mind cooling-off under Part 5
                      Section 111(d)
                    </strong>
                    , provided this is stated clearly before checkout; (3)
                    Faulty or damaged goods remain entitled to repair,
                    replacement, or refund; and (4) Digital content/SaaS is
                    governed by <strong>CRAA Part 3</strong> conformity rules.
                    Documenting your 3-gate QC SOP below also provides direct
                    operational proof for <strong>IE LEO Priming / Feasibility</strong>{' '}
                    and <strong>Enterprise Ireland</strong> technical
                    assessments.
                  </p>
                </div>
              </div>
            </div>
          ) : selectedCountry === 'GB' ? (
            <div className="rounded-xl border border-indigo-300 bg-indigo-50/80 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-indigo-700" />
                <div className="space-y-1 text-xs text-indigo-950">
                  <p className="font-bold text-indigo-900">
                    🇬🇧 UK Consumer Rights Act 2015, Consumer Contracts Regs 2013
                    &amp; Start Up Loan / Innovate UK Quality Guardrail
                  </p>
                  <p className="leading-relaxed text-indigo-900">
                    Under the{' '}
                    <strong>UK Consumer Rights Act 2015 (CRA 2015)</strong> and{' '}
                    <strong>
                      Consumer Contracts (Information, Cancellation and
                      Additional Charges) Regulations 2013
                    </strong>
                    : (1) Standard UK online consumer orders have a{' '}
                    <strong>14-day cooling-off period</strong> from receipt to
                    request a return and a further 14 days to send goods back;
                    (2) Bespoke or personalized goods made to the customer&apos;s
                    specifications are{' '}
                    <strong>
                      exempt from change-of-mind cancellation under Regulation
                      28(1)(b)
                    </strong>
                    ; (3) Consumers hold a statutory{' '}
                    <strong>30-day short-term right to reject</strong> faulty
                    goods for a full refund (or repair/replacement within 6
                    months); and (4) Digital content is governed by{' '}
                    <strong>CRA 2015 Chapter 3</strong>. Your 3-gate QC SOP
                    directly feeds your{' '}
                    <strong>British Business Bank Start Up Loan</strong>{' '}
                    operations section and{' '}
                    <strong>Innovate UK Work Package quality assurance</strong>.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-slate-700" />
                <div className="space-y-1 text-xs text-slate-700">
                  <p className="font-bold text-slate-900">
                    🌍 {countryPack.countryName} Consumer Protection &amp;
                    Quality Assurance Guardrail
                  </p>
                  <p className="leading-relaxed">
                    Ensure your checkout terms clearly distinguish between
                    standard stock items (subject to statutory distance-selling
                    return windows) and custom/bespoke or B2B orders, while
                    budgeting a realistic return/remake allowance per order to
                    protect your unit margins.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* PART A: Customer Support Operating Model & Response SLA */}
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Headphones className="h-4 w-4 text-indigo-600" />
                Part A: Customer Support Operating Model &amp; Response SLA
              </CardTitle>
              <CardDescription className="text-xs text-slate-600">
                How will customers get help when an order is delayed, a question
                arises, or onboarding needs assistance—without derailing your
                production or engineering schedule?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Support Operating Model Tiles */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  1. Primary Customer Support Operating Model
                </label>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {SUPPORT_OPERATING_MODEL_OPTIONS.map((opt) => {
                    const isSelected =
                      step4Data.supportOperatingModel === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={isVaultReadonly}
                        onClick={() =>
                          setStep4Data((prev) => ({
                            ...prev,
                            supportOperatingModel: opt.value,
                          }))
                        }
                        className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="flex w-full items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {opt.label}
                          </span>
                          <Badge
                            variant="outline"
                            className="border-slate-200 bg-white text-[10px] text-slate-600"
                          >
                            {opt.badge}
                          </Badge>
                        </div>
                        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
                          {opt.subtitle}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {step4Data.supportOperatingModel === 'OTHER' && (
                  <div className="mt-2 rounded-xl border border-indigo-200 bg-indigo-50/40 p-3">
                    <label className="block text-xs font-semibold text-indigo-950">
                      Describe your custom Customer Support Operating Model:
                    </label>
                    <input
                      type="text"
                      disabled={isVaultReadonly}
                      value={step4Data.otherSupportOperatingModelText || ''}
                      onChange={(e) =>
                        setStep4Data((prev) => ({
                          ...prev,
                          otherSupportOperatingModelText: e.target.value,
                        }))
                      }
                      placeholder="e.g., Dedicated WhatsApp VIP concierge for trade buyers + weekly office hours..."
                      className="mt-1.5 w-full rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-base text-slate-900 focus:border-indigo-500 focus:outline-none sm:text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Support Response SLA Tiles */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  2. Committed Customer Support Response SLA
                </label>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {SUPPORT_RESPONSE_SLA_OPTIONS.map((opt) => {
                    const isSelected =
                      step4Data.supportResponseSla === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={isVaultReadonly}
                        onClick={() =>
                          setStep4Data((prev) => ({
                            ...prev,
                            supportResponseSla: opt.value,
                          }))
                        }
                        className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                        }`}
                      >
                        <span className="text-xs font-bold text-slate-900">
                          {opt.label}
                        </span>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                          {opt.subtitle}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {step4Data.supportResponseSla === 'OTHER' && (
                  <div className="mt-2 rounded-xl border border-indigo-200 bg-indigo-50/40 p-3">
                    <label className="block text-xs font-semibold text-indigo-950">
                      Specify your custom Support Response SLA:
                    </label>
                    <input
                      type="text"
                      disabled={isVaultReadonly}
                      value={step4Data.otherSupportResponseSlaText || ''}
                      onChange={(e) =>
                        setStep4Data((prev) => ({
                          ...prev,
                          otherSupportResponseSlaText: e.target.value,
                        }))
                      }
                      placeholder="e.g., 2-hour response for enterprise severity-1 issues; 24h for standard tickets..."
                      className="mt-1.5 w-full rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-base text-slate-900 focus:border-indigo-500 focus:outline-none sm:text-xs"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* PART B: Returns, Refunds, Warranty & Unit Margin Buffer Calculator */}
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                <RotateCcw className="h-4 w-4 text-amber-600" />
                Part B: Returns, Refunds, Warranty &amp; Unit Margin Buffer
                Calculator
              </CardTitle>
              <CardDescription className="text-xs text-slate-600">
                Select your statutory returns/warranty posture and quantify the
                expected cost per return or remake incident so Module G
                automatically protects your unit gross margin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Returns & Warranty Policy Tiles */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  1. Returns, Remake &amp; Statutory Warranty Posture (
                  {selectedCountry === 'IE'
                    ? '🇮🇪 Ireland Consumer Rights Act 2022 / CCPC'
                    : selectedCountry === 'GB'
                      ? '🇬🇧 UK Consumer Rights Act 2015 / Consumer Contracts Regs 2013'
                      : `🌍 ${countryPack.countryName}`}
                  )
                </label>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {RETURNS_AND_WARRANTY_POLICY_OPTIONS.map((opt) => {
                    const isSelected =
                      step4Data.returnsAndWarrantyPolicy === opt.value;
                    const localizedTitle =
                      opt.value === 'STATUTORY_14_DAY_COOLING_OFF'
                        ? selectedCountry === 'IE'
                          ? '14-Day Cooling-Off Returns (Ireland CRAA 2022 / CCPC)'
                          : selectedCountry === 'GB'
                            ? '14-Day Cooling-Off + 30-Day Faulty Reject (UK CRA 2015)'
                            : opt.label
                        : opt.value ===
                            'BESPOKE_PERSONALIZED_EXEMPT_TRANSIT_REPLACE'
                          ? selectedCountry === 'IE'
                            ? 'Bespoke / Custom Exempt (IE CRAA Sec 111(d) — Defect Remake Only)'
                            : selectedCountry === 'GB'
                              ? 'Bespoke / Custom Exempt (UK Reg 28(1)(b) — Defect Remake Only)'
                              : opt.label
                          : opt.label;

                    return (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={isVaultReadonly}
                        onClick={() =>
                          setStep4Data((prev) => ({
                            ...prev,
                            returnsAndWarrantyPolicy: opt.value,
                          }))
                        }
                        className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                          isSelected
                            ? 'border-amber-600 bg-amber-50/70 ring-2 ring-amber-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                        }`}
                      >
                        <span className="text-xs font-bold text-slate-900">
                          {localizedTitle}
                        </span>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                          {opt.subtitle}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {step4Data.returnsAndWarrantyPolicy === 'OTHER' && (
                  <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50/40 p-3">
                    <label className="block text-xs font-semibold text-amber-950">
                      Describe your custom Returns, Refund &amp; Warranty
                      Policy:
                    </label>
                    <input
                      type="text"
                      disabled={isVaultReadonly}
                      value={step4Data.otherReturnsAndWarrantyPolicyText || ''}
                      onChange={(e) =>
                        setStep4Data((prev) => ({
                          ...prev,
                          otherReturnsAndWarrantyPolicyText: e.target.value,
                        }))
                      }
                      placeholder="e.g., 30-day trial period with free return courier collection + 2-year structural warranty..."
                      className="mt-1.5 w-full rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-base text-slate-900 focus:border-amber-500 focus:outline-none sm:text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Quantitative Return / Remake & Warranty Inputs */}
              <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800">
                    Estimated Return / Refund / Remake Rate (%)
                  </label>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Typical range: 1.5%–3% (Bespoke/SaaS) or 5%–12% (Apparel /
                    Consumer eCommerce)
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={50}
                      step={0.5}
                      disabled={isVaultReadonly}
                      value={step4Data.estimatedReturnOrRefundRatePercent}
                      onChange={(e) =>
                        setStep4Data((prev) => ({
                          ...prev,
                          estimatedReturnOrRefundRatePercent: Math.max(
                            0,
                            Math.min(50, Number(e.target.value) || 0)
                          ),
                        }))
                      }
                      className="w-28 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-base font-bold text-slate-900 focus:border-indigo-500 focus:outline-none sm:text-xs"
                    />
                    <span className="text-xs font-semibold text-slate-600">
                      % of orders
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800">
                    Avg Cost per Return, Replacement or Refund (
                    {plan.baseCurrency === 'GBP' ? '£' : '€'})
                  </label>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Replacement COGS + reverse shipping + payment gateway fees
                    or credit
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">
                      {plan.baseCurrency === 'GBP' ? '£' : '€'}
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={50000}
                      step={1}
                      disabled={isVaultReadonly}
                      value={step4Data.costPerReturnOrRemakeIncident}
                      onChange={(e) =>
                        setStep4Data((prev) => ({
                          ...prev,
                          costPerReturnOrRemakeIncident: Math.max(
                            0,
                            Number(e.target.value) || 0
                          ),
                        }))
                      }
                      className="w-32 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-base font-bold text-slate-900 focus:border-indigo-500 focus:outline-none sm:text-xs"
                    />
                    <span className="text-xs text-slate-600">/ incident</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800">
                    Warranty / Service Guarantee Duration (Months)
                  </label>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    e.g., 12 months structural warranty, 1 month money-back, or
                    0 for per-job
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={120}
                      step={1}
                      disabled={isVaultReadonly}
                      value={step4Data.warrantyDurationMonths}
                      onChange={(e) =>
                        setStep4Data((prev) => ({
                          ...prev,
                          warrantyDurationMonths: Math.max(
                            0,
                            Math.min(120, Math.round(Number(e.target.value) || 0))
                          ),
                        }))
                      }
                      className="w-28 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-base font-bold text-slate-900 focus:border-indigo-500 focus:outline-none sm:text-xs"
                    />
                    <span className="text-xs font-semibold text-slate-600">
                      months
                    </span>
                  </div>
                </div>
              </div>

              {/* Live Unit Economics Impact Callout */}
              <div className="flex flex-col justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-950 sm:flex-row sm:items-center">
                <div>
                  <span className="font-bold">
                    📐 Live Module G &ldquo;Pocket Profit&rdquo; Bridge:
                  </span>{' '}
                  At a{' '}
                  <strong>
                    {step4Data.estimatedReturnOrRefundRatePercent}%
                  </strong>{' '}
                  return/remake rate and{' '}
                  <strong>
                    {plan.baseCurrency === 'GBP' ? '£' : '€'}
                    {step4Data.costPerReturnOrRemakeIncident}
                  </strong>{' '}
                  cost per incident, you should reserve{' '}
                  <strong className="underline">
                    {plan.baseCurrency === 'GBP' ? '£' : '€'}
                    {expectedReturnAllowancePerOrder.toFixed(2)} per order
                  </strong>{' '}
                  in your unit economics calculator so returns never surprise
                  your cashflow.
                </div>
                <Badge className="w-fit shrink-0 bg-amber-700 text-white">
                  {plan.baseCurrency === 'GBP' ? '£' : '€'}
                  {expectedReturnAllowancePerOrder.toFixed(2)} / order buffer
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* PART C: 3-Gate Quality Control (QC) & Inspection SOP Builder */}
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                    <ClipboardCheck className="h-4 w-4 text-emerald-600" />
                    Part C: 3-Gate Quality Control (QC) &amp; Release
                    Verification SOP
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-600">
                    Define the concrete pass/fail checkpoints across Incoming
                    Materials/Dependencies, In-Process Build, and Pre-Dispatch /
                    Release Sign-Off so defects are caught before the customer
                    sees them.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isVaultReadonly}
                  onClick={handleAddQcCheckpoint}
                  className="h-8 shrink-0 border-emerald-300 bg-emerald-50 text-xs font-semibold text-emerald-900 hover:bg-emerald-100"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add QC Checkpoint Gate
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {step4Data.qcCheckpoints.map((cp, idx) => (
                <div
                  key={cp.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-slate-300"
                >
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-emerald-700 text-white">
                        QC Gate #{idx + 1}
                      </Badge>
                      <select
                        disabled={isVaultReadonly}
                        value={cp.gateTiming}
                        onChange={(e) =>
                          handleUpdateQcCheckpoint(cp.id, {
                            gateTiming: e.target.value as QcGateTimingType,
                          })
                        }
                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-base font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none sm:text-xs"
                      >
                        {QC_GATE_TIMING_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {step4Data.qcCheckpoints.length > 1 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={isVaultReadonly}
                        onClick={() => handleRemoveQcCheckpoint(cp.id)}
                        className="h-7 w-fit text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        Remove Gate
                      </Button>
                    )}
                  </div>

                  {cp.gateTiming === 'OTHER' && (
                    <div className="mt-2.5">
                      <label className="block text-[11px] font-semibold text-slate-700">
                        Custom QC Gate Timing Label:
                      </label>
                      <input
                        type="text"
                        disabled={isVaultReadonly}
                        value={cp.otherGateTimingText || ''}
                        onChange={(e) =>
                          handleUpdateQcCheckpoint(cp.id, {
                            otherGateTimingText: e.target.value,
                          })
                        }
                        placeholder="e.g., Gate 4 — 30-Day Post-Installation Customer Check-In..."
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-base text-slate-900 focus:border-indigo-500 focus:outline-none sm:text-xs"
                      />
                    </div>
                  )}

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-12">
                    <div className="sm:col-span-8">
                      <label className="block text-[11px] font-semibold text-slate-700">
                        Checkpoint Name &amp; What Is Inspected
                      </label>
                      <input
                        type="text"
                        disabled={isVaultReadonly}
                        value={cp.checkpointName}
                        onChange={(e) =>
                          handleUpdateQcCheckpoint(cp.id, {
                            checkpointName: e.target.value,
                          })
                        }
                        placeholder="e.g., Pre-Dispatch Finish, Hydration & Drop-Proof Packaging Sign-Off"
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-base font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none sm:text-xs"
                      />
                    </div>

                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-semibold text-slate-700">
                        Owner Role / Sign-Off Authority
                      </label>
                      <input
                        type="text"
                        disabled={isVaultReadonly}
                        value={cp.ownerRole}
                        onChange={(e) =>
                          handleUpdateQcCheckpoint(cp.id, {
                            ownerRole: e.target.value,
                          })
                        }
                        placeholder="e.g., Founder / Lead Maker / CI Pipeline"
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-base text-slate-900 focus:border-indigo-500 focus:outline-none sm:text-xs"
                      />
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-emerald-800">
                        ✅ Measurable Pass / Fail Standard
                      </label>
                      <textarea
                        rows={2}
                        disabled={isVaultReadonly}
                        value={cp.passFailStandard}
                        onChange={(e) =>
                          handleUpdateQcCheckpoint(cp.id, {
                            passFailStandard: e.target.value,
                          })
                        }
                        placeholder="What objective measurement or test must pass before this order/release moves forward?"
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-base text-slate-900 focus:border-indigo-500 focus:outline-none sm:text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-amber-900">
                        🛑 Defect Fallback / Quarantine Action if Failed
                      </label>
                      <textarea
                        rows={2}
                        disabled={isVaultReadonly}
                        value={cp.defectFallbackAction}
                        onChange={(e) =>
                          handleUpdateQcCheckpoint(cp.id, {
                            defectFallbackAction: e.target.value,
                          })
                        }
                        placeholder="What happens immediately if an item or build fails this gate?"
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-base text-slate-900 focus:border-indigo-500 focus:outline-none sm:text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* PART D: AI / Founder Grant-Ready Narratives & Summary Table */}
          <Card className="border-indigo-200 bg-white shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                    <Sparkles className="h-4 w-4 text-indigo-600" />
                    Part D: Quality Assurance &amp; Customer Support Narratives
                    (Module K Compiler Feed)
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-600">
                    {selectedCountry === 'IE'
                      ? 'Synthesize your 3-gate QC SOP and Ireland Consumer Rights Act 2022 (CRAA) / CCPC compliance into formal narrative blocks for your IE LEO / Enterprise Ireland business plan.'
                      : selectedCountry === 'GB'
                        ? 'Synthesize your 3-gate QC SOP and UK Consumer Rights Act 2015 / Consumer Contracts Regulations 2013 compliance into formal narrative blocks for your British Business Bank Start Up Loan & Innovate UK plan.'
                        : 'Synthesize your 3-gate QC SOP, support SLA, and returns/warranty policy into formal narrative blocks for Module K.'}
                  </CardDescription>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isVaultReadonly || isGeneratingAiStep4}
                    onClick={() => handleRunAiStep4('NARRATIVES_ONLY')}
                    className="h-8 border-indigo-200 bg-indigo-50/70 text-xs font-semibold text-indigo-800 hover:bg-indigo-100"
                  >
                    <Sparkles className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
                    {isGeneratingAiStep4
                      ? 'Synthesizing...'
                      : 'Synthesize Narratives Only'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={isVaultReadonly || isGeneratingAiStep4}
                    onClick={() =>
                      handleRunAiStep4('POPULATE_QC_AND_NARRATIVES')
                    }
                    className="h-8 bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-700"
                  >
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    {isGeneratingAiStep4
                      ? 'Generating QC & Narratives...'
                      : 'AI Generate Full QC SOP & Narratives'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-800">
                    1. Quality Control (QC) &amp; Operational Standards
                    Narrative
                  </label>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Explains how your 3-gate inspection SOP prevents defects,
                    protects brand reputation, and keeps return rates at{' '}
                    {step4Data.estimatedReturnOrRefundRatePercent}%.
                  </p>
                  <textarea
                    rows={5}
                    disabled={isVaultReadonly}
                    value={step4Data.qualityControlAndStandardsNarrative}
                    onChange={(e) =>
                      setStep4Data((prev) => ({
                        ...prev,
                        qualityControlAndStandardsNarrative: e.target.value,
                      }))
                    }
                    placeholder="Click 'AI Generate Full QC SOP & Narratives' or write how your incoming, in-process, and pre-release QC checkpoints guarantee consistent quality..."
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-base leading-relaxed text-slate-900 focus:border-indigo-500 focus:outline-none sm:text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800">
                    2. Customer Support SLA, Returns &amp; Statutory Warranty
                    Narrative
                  </label>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {selectedCountry === 'IE'
                      ? 'Explains your support SLA, Ireland Consumer Rights Act 2022 (CRAA) / CCPC compliance, and unit return allowance.'
                      : selectedCountry === 'GB'
                        ? 'Explains your support SLA, UK Consumer Rights Act 2015 / Consumer Contracts Regs 2013 compliance, and unit return allowance.'
                        : 'Explains your customer support SLA, returns/remake policy, and unit return allowance.'}
                  </p>
                  <textarea
                    rows={5}
                    disabled={isVaultReadonly}
                    value={step4Data.customerSupportAndReturnsNarrative}
                    onChange={(e) =>
                      setStep4Data((prev) => ({
                        ...prev,
                        customerSupportAndReturnsNarrative: e.target.value,
                      }))
                    }
                    placeholder="Explain how your support channel, response SLA, and statutory return/warranty policy build customer trust while protecting founder production blocks..."
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-base leading-relaxed text-slate-900 focus:border-indigo-500 focus:outline-none sm:text-xs"
                  />
                </div>
              </div>

              {/* Clean Export-Ready QC & Returns Summary Table */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
                <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    📋 Module K Preview — 3-Gate Quality Control (QC) SOP Table
                  </span>
                  <span className="text-[11px] text-slate-600">
                    Return Buffer:{' '}
                    <strong>
                      {plan.baseCurrency === 'GBP' ? '£' : '€'}
                      {expectedReturnAllowancePerOrder.toFixed(2)}/order
                    </strong>{' '}
                    ({step4Data.estimatedReturnOrRefundRatePercent}% ×{' '}
                    {plan.baseCurrency === 'GBP' ? '£' : '€'}
                    {step4Data.costPerReturnOrRemakeIncident})
                  </span>
                </div>
                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                  <table className="w-full min-w-[640px] text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-700 uppercase">
                      <tr>
                        <th className="px-3 py-2">Stage Gate</th>
                        <th className="px-3 py-2">Checkpoint</th>
                        <th className="px-3 py-2">Pass / Fail Standard</th>
                        <th className="px-3 py-2">Defect Fallback Action</th>
                        <th className="px-3 py-2">Owner</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {step4Data.qcCheckpoints.map((cp) => (
                        <tr key={cp.id} className="hover:bg-slate-50/80">
                          <td className="px-3 py-2 font-semibold text-indigo-900">
                            {cp.gateTiming === 'OTHER' && cp.otherGateTimingText
                              ? cp.otherGateTimingText
                              : QC_GATE_TIMING_OPTIONS.find(
                                  (o) => o.value === cp.gateTiming
                                )?.label || cp.gateTiming}
                          </td>
                          <td className="px-3 py-2 font-semibold text-slate-900">
                            {cp.checkpointName}
                          </td>
                          <td className="px-3 py-2 text-slate-600">
                            {cp.passFailStandard}
                          </td>
                          <td className="px-3 py-2 text-slate-600">
                            {cp.defectFallbackAction}
                          </td>
                          <td className="px-3 py-2 font-medium text-slate-800">
                            {cp.ownerRole}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Save & Continue Footer */}
              <div className="flex flex-col justify-between gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab('STEP_3')}
                    className="text-xs"
                  >
                    &larr; Back to Step 3 (4-Category Risk Register)
                  </Button>
                  {step4Data.lastSavedAt && (
                    <span className="text-[11px] text-slate-500">
                      Last saved:{' '}
                      {new Date(step4Data.lastSavedAt).toLocaleTimeString([], {
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
                    disabled={isVaultReadonly || isSavingStep4}
                    onClick={handleSaveStep4}
                    className="w-full bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700 sm:w-auto"
                  >
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                    {isSavingStep4
                      ? 'Saving Step 4...'
                      : 'Save Step 4 (Support, Returns & QC SOP)'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isVaultReadonly || isSavingStep4}
                    onClick={async () => {
                      await handleSaveStep4();
                      setActiveTab('STEP_5');
                      setOpenStep(5);
                      setTimeout(() => {
                        const el = document.getElementById('module-e-step-5');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 50);
                    }}
                    className="w-full border-indigo-300 bg-indigo-50 text-xs font-semibold text-indigo-900 hover:bg-indigo-100 sm:w-auto"
                  >
                    Save &amp; Continue to Step 5 &rarr;
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* STEP 5: STEP 5: PERMITS, COMPLIANCE & INSURANCE MATCHER */}
      {/* =================================================================== */}
      {openStep !== 'ALL' && openStep !== 5 ? (
        <div
          id="module-e-step-5"
          onClick={() => {
            setOpenStep(5);
            setActiveTab('STEP_5');
          }}
          className="group scroll-mt-24 cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  moduleEReadinessSteps[4]?.isComplete
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 text-white'
                }`}
              >
                {moduleEReadinessSteps[4]?.isComplete ? (
                  <Check className="h-4 w-4 stroke-[3]" />
                ) : (
                  '5'
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-sm font-bold text-slate-900">
                    Step 5: Permits, Compliance & Insurance Matcher
                  </h2>
                  {moduleEReadinessSteps[4]?.isComplete ? (
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
                  {moduleEReadinessSteps[4]?.summary}
                </p>
              </div>
            </div>
            <div className="ml-3 flex shrink-0 items-center gap-2">
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
        <div id="module-e-step-5" className="scroll-mt-24 space-y-4">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white p-4 rounded-xl border shadow-xs">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    moduleEReadinessSteps[4]?.isComplete
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  {moduleEReadinessSteps[4]?.isComplete ? (
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  ) : (
                    '5'
                  )}
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  Step 5: Permits, Compliance & Insurance Matcher
                </h2>
                <Badge variant="outline" className="shrink-0 text-[10px] text-indigo-700 border-indigo-200 bg-indigo-50">
                  Step 5 of 6
                </Badge>
                {moduleEReadinessSteps[4]?.isComplete ? (
                  <Badge variant="success" className="shrink-0 text-[10px]">
                    Completed
                  </Badge>
                ) : (
                  <Badge variant="outline" className="shrink-0 text-[10px] text-slate-600">
                    In Progress
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Verify regulatory requirements, health and safety obligations, GDPR data privacy posture, and commercial startup insurance bundle.
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

          <div className="space-y-5">
          {/* 1. Top Header & 4-Layer Built-In Support Bar (Zero Presets) */}
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-indigo-950 text-white hover:bg-indigo-900">
                      Step 5 of 6
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-emerald-300 bg-emerald-50 text-emerald-900"
                    >
                      {selectedCountry === 'IE'
                        ? '🇮🇪'
                        : selectedCountry === 'GB'
                          ? '🇬🇧'
                          : '🌍'}{' '}
                      {countryPack.countryName} Statutory Compliance &amp;
                      Insurance Engine
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-indigo-200 bg-indigo-50 text-indigo-900"
                    >
                      Synced to Module I Overheads &amp; Module K Legal
                      Governance
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-bold text-slate-900 sm:text-xl">
                    Permits, Health &amp; Safety, GDPR &amp; Instant Startup
                    Insurance Matcher
                  </CardTitle>
                  <CardDescription className="text-xs leading-relaxed text-slate-600 sm:text-sm">
                    Verify your{' '}
                    <span className="font-semibold text-slate-800">
                      {countryPack.countryName}
                    </span>{' '}
                    regulatory and tax clearance requirements, workplace Health
                    &amp; Safety statement, GDPR data privacy posture, and match
                    an{' '}
                    <span className="font-semibold text-slate-800">
                      indicative estimated commercial insurance bundle
                    </span>{' '}
                    (actual coverage &amp; premiums may vary).
                  </CardDescription>
                </div>

                {/* 4-Layer Support Action Buttons */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowWhyAskingStep5((prev) => !prev)}
                    className="h-8 border-indigo-200 bg-indigo-50/70 text-xs font-semibold text-indigo-900 hover:bg-indigo-100"
                  >
                    <HelpCircle className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
                    Why Are We Asking This?
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowExampleDrawerStep5((prev) => !prev)}
                    className="h-8 border-amber-200 bg-amber-50/70 text-xs font-semibold text-amber-900 hover:bg-amber-100"
                  >
                    <Lightbulb className="mr-1.5 h-3.5 w-3.5 text-amber-600" />
                    Show Me an Example
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isVaultReadonly}
                    onClick={handleApplyStep5IndustryBenchmark}
                    className="h-8 border-emerald-300 bg-emerald-50 text-xs font-semibold text-emerald-900 hover:bg-emerald-100"
                  >
                    <Sparkles className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                    Use Industry Benchmark
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowParkInputStep5((prev) => !prev)}
                    className="h-8 border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    <BookmarkPlus className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
                    Park It
                  </Button>
                </div>
              </div>

              {/* Layer 1A: Why Are We Asking This? Drawer */}
              {showWhyAskingStep5 && (
                <div className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50/70 p-3.5 text-xs text-indigo-950">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-indigo-900">
                      Why Grant Assessors, Loan Officers &amp; B2B Buyers Audit
                      Your Compliance &amp; Insurance Posture:
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowWhyAskingStep5(false)}
                      className="text-indigo-700 hover:text-indigo-950"
                    >
                      ✕
                    </button>
                  </div>
                  {selectedCountry === 'IE' ? (
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-indigo-900/90">
                      <li>
                        <strong>
                          🇮🇪 LEO &amp; Enterprise Ireland Mandatory Gatekeeper:
                        </strong>{' '}
                        No Local Enterprise Office (LEO) Priming/Feasibility
                        grant or Enterprise Ireland PSSF funding can be drawn
                        down without an active{' '}
                        <strong>
                          Revenue eTax Clearance Certificate (TC2 via ROS)
                        </strong>{' '}
                        and up-to-date CRO registration.
                      </li>
                      <li>
                        <strong>
                          🇮🇪 HSA Written Safety Statement &amp; DPC GDPR:
                        </strong>{' '}
                        Under{' '}
                        <em>
                          Section 20 of the Safety, Health and Welfare at Work
                          Act 2005
                        </em>
                        , every Irish employer/workshop must prepare a Written
                        Safety Statement (easily generated for free via{' '}
                        <strong>HSA BeSMART.ie</strong>), alongside EU GDPR &amp;
                        Data Protection Commission (DPC) compliance.
                      </li>
                      <li>
                        <strong>
                          💰 Indicative Insurance Overhead Sync to Module I:
                        </strong>{' '}
                        Founders frequently forget commercial insurance in their
                        financial forecasts. Your indicative estimated annual
                        premium here automatically divides by 12 into Module I
                        monthly overheads so your cashflow is realistic (actual
                        coverage &amp; premiums may vary upon insurer
                        underwriting).
                      </li>
                    </ul>
                  ) : selectedCountry === 'GB' ? (
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-indigo-900/90">
                      <li>
                        <strong>
                          🇬🇧 Innovate UK, Start Up Loans &amp; SEIS/EIS
                          Gatekeeper:
                        </strong>{' '}
                        Innovate UK Project Monitoring Officers and British
                        Business Bank Start Up Loans assessors verify active{' '}
                        <strong>Companies House</strong> status,{' '}
                        <strong>HMRC UTR</strong> registration, and UK statutory
                        compliance before releasing funds.
                      </li>
                      <li>
                        <strong>
                          🇬🇧 ICO Data Protection Fee, UK HSE &amp; £5m
                          Employers&apos; Liability Law:
                        </strong>{' '}
                        UK companies processing personal data must pay the
                        statutory{' '}
                        <strong>ICO Data Protection Fee (£40–£60/yr)</strong>,
                        maintain a UK HSE workplace risk assessment under the{' '}
                        <em>Health and Safety at Work etc. Act 1974</em>, and
                        carry at least{' '}
                        <strong>£5 million Employers&apos; Liability</strong>{' '}
                        insurance once hiring staff.
                      </li>
                      <li>
                        <strong>
                          💰 Indicative Insurance Overhead Sync to Module I:
                        </strong>{' '}
                        Your indicative estimated annual insurance premium here
                        automatically divides by 12 into Module I monthly
                        overheads so your cashflow is realistic (actual coverage
                        &amp; premiums may vary upon insurer underwriting).
                      </li>
                    </ul>
                  ) : (
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-indigo-900/90">
                      <li>
                        <strong>Corporate &amp; Tax Good Standing:</strong>{' '}
                        Grant bodies, lenders, and enterprise customers require
                        verified corporate incorporation and active tax
                        clearance before releasing funds or signing contracts.
                      </li>
                      <li>
                        <strong>
                          Indicative Insurance Overhead Sync to Module I:
                        </strong>{' '}
                        Your indicative estimated annual insurance premium
                        divides by 12 into Module I monthly overheads so your
                        36-month cashflow never misses commercial insurance
                        costs (actual coverage &amp; premiums may vary).
                      </li>
                    </ul>
                  )}
                </div>
              )}

              {/* Layer 1B: Show Me an Example Drawer */}
              {showExampleDrawerStep5 && (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-950">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold text-amber-900">
                      Industry-Tailored Compliance &amp; Insurance Examples (
                      {selectedCountry === 'IE'
                        ? '🇮🇪'
                        : selectedCountry === 'GB'
                          ? '🇬🇧'
                          : '🌍'}{' '}
                      {countryPack.countryName}):
                    </p>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setExamplePersonaTab('WOODWORKER_BOARDS')
                        }
                        className={`rounded px-2.5 py-1 text-[11px] font-semibold transition ${
                          examplePersonaTab === 'WOODWORKER_BOARDS'
                            ? 'bg-amber-800 text-white'
                            : 'bg-white text-amber-900 hover:bg-amber-100'
                        }`}
                      >
                        🪵 Physical Product / Workshop Example
                      </button>
                      <button
                        type="button"
                        onClick={() => setExamplePersonaTab('BMU_SAAS')}
                        className={`rounded px-2.5 py-1 text-[11px] font-semibold transition ${
                          examplePersonaTab === 'BMU_SAAS'
                            ? 'bg-amber-800 text-white'
                            : 'bg-white text-amber-900 hover:bg-amber-100'
                        }`}
                      >
                        💻 Digital SaaS / AI Platform Example
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowExampleDrawerStep5(false)}
                        className="ml-1 text-amber-800 hover:text-amber-950"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {examplePersonaTab === 'WOODWORKER_BOARDS' ? (
                    <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <div className="rounded border border-amber-200 bg-white p-2.5">
                        <p className="font-bold text-slate-900">
                          Regulatory &amp; Safety Posture (Craft / Physical
                          Goods):
                        </p>
                        <p className="mt-1 text-slate-700">
                          {selectedCountry === 'IE'
                            ? '• Posture: Physical Goods & Consumer Product Safety (EU GPSR 2023/988 & EC 1935/2004 Food-Contact mineral oil/beeswax compliance).\n• Safety: HSA BeSMART.ie Written Safety Statement (Section 20 SHWWA 2005) covering workshop saw dust extraction, PPE & timber storage.\n• Grant Gatekeeper: CRO RBN/LTD + Revenue eTax Clearance (TC2 via ROS).'
                            : '• Posture: Physical Goods & Consumer Product Safety (UK General Product Safety Regulations & FSA food-contact materials compliance).\n• Safety: UK HSE Workshop Risk Assessment (HSWA 1974) covering woodworking machinery guards, dust extraction & PPE.\n• Grant Gatekeeper: Companies House LTD + HMRC UTR & ICO Fee registration.'}
                        </p>
                      </div>
                      <div className="rounded border border-amber-200 bg-white p-2.5">
                        <p className="font-bold text-slate-900">
                          Indicative Insurance Bundle (Estimate Only):
                        </p>
                        <p className="mt-1 text-slate-700">
                          {selectedCountry === 'IE'
                            ? '• Bundle: Product & Public Liability (€2.6m–€6.5m) + Workshop Equipment All-Risks.\n• Indicative Annual Premium Estimate: ~€850/yr (~€71/mo in Module I Overheads) via Arachas / Allianz Ireland / FBD. Actual coverage & premium may vary.'
                            : '• Bundle: Product & Public Liability (£2m–£5m) + Workshop Equipment All-Risks.\n• Indicative Annual Premium Estimate: ~£720/yr (~£60/mo in Module I Overheads) via Simply Business / Hiscox UK / Aviva. Actual coverage & premium may vary.'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <div className="rounded border border-amber-200 bg-white p-2.5">
                        <p className="font-bold text-slate-900">
                          Regulatory &amp; Data Privacy Posture (B2B/B2C SaaS):
                        </p>
                        <p className="mt-1 text-slate-700">
                          {selectedCountry === 'IE'
                            ? '• Posture: Standard Commercial + Active Data Controller / Processor (DPA & Sub-Processors).\n• Privacy: EU GDPR & Irish Data Protection Act 2018 (DPC alignment), Article 30 ROPA, EU/EEA PostgreSQL encryption at rest, and signed Sub-Processor DPAs.\n• Grant Gatekeeper: CRO LTD + Revenue eTax Clearance (TC2 via ROS).'
                            : '• Posture: Standard Commercial + Active Data Controller / Processor (DPA & Sub-Processors).\n• Privacy: UK GDPR & Data Protection Act 2018, statutory ICO Data Protection Fee (£40/yr), UK/EEA cloud encryption, and signed Sub-Processor DPAs.\n• Grant Gatekeeper: Companies House LTD + HMRC Corporation Tax UTR.'}
                        </p>
                      </div>
                      <div className="rounded border border-amber-200 bg-white p-2.5">
                        <p className="font-bold text-slate-900">
                          Indicative Insurance Bundle (Estimate Only):
                        </p>
                        <p className="mt-1 text-slate-700">
                          {selectedCountry === 'IE'
                            ? '• Bundle: Cyber & Data Breach + Professional Indemnity (Tech E&O) + Public Liability.\n• Indicative Annual Premium Estimate: ~€780/yr (~€65/mo in Module I Overheads) via Hiscox Ireland / Arachas. Actual coverage & premium may vary.'
                            : '• Bundle: Cyber & Data Breach + Professional Indemnity (Tech E&O) + Public Liability.\n• Indicative Annual Premium Estimate: ~£660/yr (~£55/mo in Module I Overheads) via Superscript / Hiscox UK. Actual coverage & premium may vary.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Layer 3: Park Open Question Input */}
              {showParkInputStep5 && (
                <div className="mt-3 flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center">
                  <input
                    value={parkQuestionInputStep5}
                    onChange={(e) => setParkQuestionInputStep5(e.target.value)}
                    placeholder={
                      selectedCountry === 'IE'
                        ? 'e.g., Confirm with Arachas/Hiscox Ireland whether US/UK export sales require an extended Product Liability endorsement...'
                        : 'e.g., Confirm with Hiscox UK/Superscript whether our AI feature requires a specialist Tech E&O endorsement...'
                    }
                    className="h-9 flex-1 rounded-md border border-slate-300 bg-white px-2.5 text-base sm:text-xs"
                  />
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      onClick={async () => {
                        if (!parkQuestionInputStep5.trim()) return;
                        await onParkOpenQuestion(
                          parkQuestionInputStep5.trim()
                        );
                        setParkQuestionInputStep5('');
                        setShowParkInputStep5(false);
                        setSaveBanner(
                          '📌 Parked compliance/insurance question in your Open Questions Parking Lot!'
                        );
                      }}
                      className="h-9 bg-slate-900 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      Save to Parking Lot
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowParkInputStep5(false)}
                      className="h-9 text-xs text-slate-600"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardHeader>
          </Card>

          {/* 2. Live 4-Card Compliance & Indicative Insurance Metrics Strip */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-slate-200 bg-white shadow-xs">
              <CardContent className="p-3.5">
                <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                  1. Regulatory &amp; Privacy Posture
                </p>
                <p className="mt-1 truncate text-sm font-bold text-slate-900">
                  {REGULATORY_SECTOR_POSTURE_OPTIONS.find(
                    (o) => o.value === step5Data.regulatorySectorPosture
                  )?.label || 'Not Selected'}
                </p>
                <p className="mt-1 truncate text-[11px] text-slate-600">
                  Privacy:{' '}
                  <span className="font-medium text-slate-800">
                    {DATA_PRIVACY_POSTURE_OPTIONS.find(
                      (o) => o.value === step5Data.dataPrivacyPosture
                    )?.label || 'Not Selected'}
                  </span>
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white shadow-xs">
              <CardContent className="p-3.5">
                <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                  2. Statutory Grant &amp; Legal Readiness
                </p>
                <p className="mt-1 text-sm font-bold text-slate-900">
                  {step5Data.complianceItems.length} Compliance Items (
                  {verifiedOrInProgressComplianceCount} Active/Verified)
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      hasCorporateTaxClearanceItem
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                        : 'border-amber-300 bg-amber-50 text-amber-800'
                    }`}
                  >
                    {selectedCountry === 'IE'
                      ? 'CRO / Revenue TC2'
                      : selectedCountry === 'GB'
                        ? 'Co. House / UTR'
                        : 'Tax Clearance'}{' '}
                    {hasCorporateTaxClearanceItem ? '✓' : '!'}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      hasHealthSafetyItem
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                        : 'border-amber-300 bg-amber-50 text-amber-800'
                    }`}
                  >
                    {selectedCountry === 'IE'
                      ? 'HSA Sec 20'
                      : selectedCountry === 'GB'
                        ? 'UK HSE'
                        : 'H&S'}{' '}
                    {hasHealthSafetyItem ? '✓' : '!'}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      hasGdprPrivacyItem
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                        : 'border-amber-300 bg-amber-50 text-amber-800'
                    }`}
                  >
                    {selectedCountry === 'IE'
                      ? 'DPC GDPR'
                      : selectedCountry === 'GB'
                        ? 'ICO GDPR'
                        : 'GDPR'}{' '}
                    {hasGdprPrivacyItem ? '✓' : '!'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-indigo-200 bg-indigo-50/40 shadow-xs">
              <CardContent className="p-3.5">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-[11px] font-semibold tracking-wide text-indigo-900 uppercase">
                    3. Est. Annual Insurance Premium
                  </p>
                  <Badge
                    variant="outline"
                    className="border-amber-300 bg-amber-50 text-[10px] font-semibold text-amber-900"
                  >
                    Estimate Only
                  </Badge>
                </div>
                <p className="mt-1 text-base font-extrabold text-indigo-950">
                  ~
                  {formatPlanCurrency(
                    step5Data.estimatedAnnualInsurancePremium,
                    plan.baseCurrency
                  )}
                  <span className="text-xs font-medium text-indigo-800">
                    /yr (est.)
                  </span>
                </p>
                <p className="mt-0.5 text-[11px] font-medium text-indigo-900">
                  ≈{' '}
                  {formatPlanCurrency(
                    estimatedMonthlyInsuranceOverhead,
                    plan.baseCurrency
                  )}
                  /mo synced to Module I Overheads
                </p>
                <p className="mt-1 text-[10px] leading-snug text-amber-900">
                  *Indicative estimate only — actual coverage, policy limits
                  &amp; premiums may vary upon underwriting.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white shadow-xs">
              <CardContent className="p-3.5">
                <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                  4. Matched Insurance Bundle &amp; Broker
                </p>
                <p className="mt-1 truncate text-sm font-bold text-slate-900">
                  {INSURANCE_COVERAGE_BUNDLE_OPTIONS.find(
                    (b) => b.value === step5Data.insuranceCoverageBundle
                  )?.label || 'Not Selected'}
                </p>
                <p className="mt-1 truncate text-[11px] text-slate-600">
                  Provider:{' '}
                  <span className="font-semibold text-slate-800">
                    {step5Data.selectedInsuranceProviderName || 'Not specified'}
                  </span>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 3. Part A: Regulatory Sector Posture & Data Privacy / GDPR Posture Selectors */}
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900">
                Part A: Regulatory Sector Posture &amp; GDPR Data Privacy
                Classification
              </CardTitle>
              <CardDescription className="text-xs text-slate-600">
                Select the regulatory framework and data protection tier that
                govern how your business operates in{' '}
                <span className="font-semibold text-slate-800">
                  {countryPack.countryName}
                </span>
                . Every selector includes an{' '}
                <span className="font-semibold text-slate-800">Other</span>{' '}
                option for hybrid or specialist models.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* A1. Regulatory Sector Posture Selector */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-slate-800">
                  1. Primary Regulatory &amp; Sector Licensing Posture
                </label>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {REGULATORY_SECTOR_POSTURE_OPTIONS.map((option) => {
                    const isSelected =
                      step5Data.regulatorySectorPosture === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        disabled={isVaultReadonly}
                        onClick={() =>
                          setStep5Data((prev) => ({
                            ...prev,
                            regulatorySectorPosture: option.value,
                          }))
                        }
                        className={`flex flex-col items-start rounded-lg border p-3 text-left transition ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-600'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex w-full items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {option.label}
                          </span>
                          <Badge
                            variant="outline"
                            className="shrink-0 text-[10px]"
                          >
                            {option.badge}
                          </Badge>
                        </div>
                        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
                          {option.subtitle}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Edge-Case Protection: OTHER Regulatory Sector Posture Inline Input */}
                {step5Data.regulatorySectorPosture === 'OTHER' && (
                  <div className="mt-2 rounded-lg border border-indigo-200 bg-indigo-50/40 p-3">
                    <label className="text-xs font-semibold text-indigo-950">
                      Describe Your Custom / Hybrid Regulatory Sector Posture:
                    </label>
                    <input
                      disabled={isVaultReadonly}
                      value={step5Data.otherRegulatorySectorPostureText || ''}
                      onChange={(e) =>
                        setStep5Data((prev) => ({
                          ...prev,
                          otherRegulatorySectorPostureText: e.target.value,
                        }))
                      }
                      placeholder={
                        selectedCountry === 'IE'
                          ? 'e.g., Dual Agri-Tech hardware + cloud telemetry regulated under DAFM & EU Machinery Directive...'
                          : 'e.g., Dual EdTech DBS-checked tutoring marketplace + UKCA hardware kit...'
                      }
                      className="mt-1.5 h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-base sm:text-xs"
                    />
                  </div>
                )}
              </div>

              {/* A2. Data Privacy & GDPR Posture Selector */}
              <div className="space-y-2.5 border-t border-slate-100 pt-4">
                <label className="text-xs font-bold text-slate-800">
                  2.{' '}
                  {selectedCountry === 'IE'
                    ? 'EU GDPR & Irish Data Protection Commission (DPC) Posture'
                    : selectedCountry === 'GB'
                      ? 'UK GDPR & Information Commissioner’s Office (ICO) Posture'
                      : 'GDPR, Data Privacy & Cybersecurity Posture'}
                </label>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {DATA_PRIVACY_POSTURE_OPTIONS.map((option) => {
                    const isSelected =
                      step5Data.dataPrivacyPosture === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        disabled={isVaultReadonly}
                        onClick={() =>
                          setStep5Data((prev) => ({
                            ...prev,
                            dataPrivacyPosture: option.value,
                          }))
                        }
                        className={`flex flex-col items-start rounded-lg border p-3 text-left transition ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-600'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex w-full items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {option.label}
                          </span>
                          <Badge
                            variant="outline"
                            className="shrink-0 text-[10px]"
                          >
                            {option.badge}
                          </Badge>
                        </div>
                        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
                          {option.subtitle}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Edge-Case Protection: OTHER Data Privacy Posture Inline Input */}
                {step5Data.dataPrivacyPosture === 'OTHER' && (
                  <div className="mt-2 rounded-lg border border-indigo-200 bg-indigo-50/40 p-3">
                    <label className="text-xs font-semibold text-indigo-950">
                      Describe Your Custom Data Privacy / Security Governance
                      Model:
                    </label>
                    <input
                      disabled={isVaultReadonly}
                      value={step5Data.otherDataPrivacyPostureText || ''}
                      onChange={(e) =>
                        setStep5Data((prev) => ({
                          ...prev,
                          otherDataPrivacyPostureText: e.target.value,
                        }))
                      }
                      placeholder="e.g., On-premise enterprise deployment with zero customer PII stored on our cloud servers..."
                      className="mt-1.5 h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-base sm:text-xs"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 4. Part B: Instant Startup Insurance Matcher & Indicative Premium Estimator */}
          <Card className="border-indigo-200 bg-white shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base font-bold text-slate-900">
                      Part B: Instant Startup Insurance Matcher &amp; Indicative
                      Premium Estimator
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className="border-amber-300 bg-amber-50 text-[10px] font-semibold text-amber-900"
                    >
                      Indicative Estimate — Actual Coverage &amp; Premium May
                      Vary
                    </Badge>
                  </div>
                  <CardDescription className="mt-1 text-xs text-slate-600">
                    Match the right commercial insurance bundle for your startup
                    and set an{' '}
                    <span className="font-semibold text-slate-800">
                      indicative estimated annual premium
                    </span>{' '}
                    for your Module I financial model.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Prominent Estimate & Coverage Disclaimer Banner */}
              <div className="rounded-lg border border-amber-300 bg-amber-50/80 p-3 text-xs text-amber-950">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                  <div>
                    <p className="font-bold text-amber-950">
                      Important Note on Estimated Annual Insurance Premiums
                      &amp; Coverage:
                    </p>
                    <p className="mt-0.5 leading-relaxed text-amber-900">
                      The <strong>Estimated Annual Insurance Premium</strong>{' '}
                      shown below (and the derived{' '}
                      <strong>
                        ~
                        {formatPlanCurrency(
                          estimatedMonthlyInsuranceOverhead,
                          plan.baseCurrency
                        )}
                        /month
                      </strong>{' '}
                      figure synced to Module I Overheads) is an{' '}
                      <strong>
                        indicative planning estimate only — not a binding
                        insurance quote or financial advice
                      </strong>
                      . Actual coverage, policy terms, indemnity limits,
                      exclusions, and final premiums may vary depending on
                      formal insurer/broker underwriting, projected turnover,
                      claims history, export territories, and specific
                      operational risk profile.
                    </p>
                  </div>
                </div>
              </div>

              {/* B1. Insurance Coverage Bundle Selector */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-slate-800">
                  1. Select Your Target Startup Insurance Coverage Bundle
                </label>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {INSURANCE_COVERAGE_BUNDLE_OPTIONS.map((bundle) => {
                    const isSelected =
                      step5Data.insuranceCoverageBundle === bundle.value;
                    return (
                      <button
                        key={bundle.value}
                        type="button"
                        disabled={isVaultReadonly}
                        onClick={() =>
                          setStep5Data((prev) => ({
                            ...prev,
                            insuranceCoverageBundle: bundle.value,
                          }))
                        }
                        className={`flex flex-col items-start rounded-lg border p-3 text-left transition ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-600'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex w-full items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {bundle.label}
                          </span>
                          <Badge
                            variant="outline"
                            className="shrink-0 text-[10px]"
                          >
                            {bundle.badge}
                          </Badge>
                        </div>
                        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
                          {bundle.subtitle}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Edge-Case Protection: OTHER Insurance Bundle Inline Input */}
                {step5Data.insuranceCoverageBundle === 'OTHER' && (
                  <div className="mt-2 rounded-lg border border-indigo-200 bg-indigo-50/40 p-3">
                    <label className="text-xs font-semibold text-indigo-950">
                      Describe Your Custom / Specialist Insurance Coverage
                      Bundle:
                    </label>
                    <input
                      disabled={isVaultReadonly}
                      value={step5Data.otherInsuranceCoverageBundleText || ''}
                      onChange={(e) =>
                        setStep5Data((prev) => ({
                          ...prev,
                          otherInsuranceCoverageBundleText: e.target.value,
                        }))
                      }
                      placeholder="e.g., Specialist Clinical Trials Liability + Marine Cargo Transit + Directors & Officers (D&O)..."
                      className="mt-1.5 h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-base sm:text-xs"
                    />
                  </div>
                )}
              </div>

              {/* B2. Estimated Annual Premium Input & Selected Provider */}
              <div className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-bold text-slate-800">
                      Estimated Annual Insurance Premium ({plan.baseCurrency}) —{' '}
                      <span className="text-amber-800 underline decoration-dotted">
                        Estimate Only
                      </span>
                    </label>
                    <span className="text-[11px] font-semibold text-indigo-700">
                      ≈{' '}
                      {formatPlanCurrency(
                        estimatedMonthlyInsuranceOverhead,
                        plan.baseCurrency
                      )}
                      /mo (Est.)
                    </span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    step={50}
                    disabled={isVaultReadonly}
                    value={step5Data.estimatedAnnualInsurancePremium}
                    onChange={(e) =>
                      setStep5Data((prev) => ({
                        ...prev,
                        estimatedAnnualInsurancePremium: Math.max(
                          0,
                          Number(e.target.value) || 0
                        ),
                      }))
                    }
                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-base font-semibold sm:text-xs"
                  />
                  <p className="text-[11px] leading-snug text-slate-600">
                    <strong>Planning Estimate:</strong> Feeds ~
                    {formatPlanCurrency(
                      estimatedMonthlyInsuranceOverhead,
                      plan.baseCurrency
                    )}
                    /month into Module I Overheads. Actual coverage, policy
                    limits &amp; premiums may vary subject to insurer
                    underwriting.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    Preferred / Matched Insurance Broker or Underwriter
                  </label>
                  <input
                    disabled={isVaultReadonly}
                    value={step5Data.selectedInsuranceProviderName}
                    onChange={(e) =>
                      setStep5Data((prev) => ({
                        ...prev,
                        selectedInsuranceProviderName: e.target.value,
                      }))
                    }
                    placeholder={
                      selectedCountry === 'IE'
                        ? 'e.g., Hiscox Ireland / Arachas / Allianz Ireland / FBD'
                        : selectedCountry === 'GB'
                          ? 'e.g., Superscript / Hiscox UK / Simply Business / Aviva UK'
                          : 'e.g., Commercial Startup Insurance Broker'
                    }
                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-base sm:text-xs"
                  />
                  <p className="text-[11px] leading-snug text-slate-600">
                    Click a vetted {countryPack.countryName} startup broker card
                    below to auto-fill or enter your own broker.
                  </p>
                </div>
              </div>

              {/* B3. Country-Isolated Instant Startup Insurance Matcher Cards (?subid=[planId]_[userId]) */}
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-800">
                    2. Instant{' '}
                    {selectedCountry === 'IE'
                      ? '🇮🇪'
                      : selectedCountry === 'GB'
                        ? '🇬🇧'
                        : '🌍'}{' '}
                    {countryPack.countryName} Startup Insurance Matcher (Click
                    to Apply Indicative Estimate or Compare Quotes)
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Attribution ID:{' '}
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-700">
                      ?subid={plan.id}_{userId || 'founder'}
                    </code>
                  </span>
                </div>

                {selectedCountry === 'IE' ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {[
                      {
                        providerName:
                          'Hiscox Ireland (Tech, SaaS & Professional Indemnity)',
                        focus:
                          'Ideal for Irish SaaS, AI, B2B Consultancies & Digital Agencies requiring Cyber + Tech E&O + Public Liability.',
                        bundle:
                          'TECH_SAAS_PI_CYBER' as InsuranceCoverageBundleType,
                        indicativeAnnualEstimate: 780,
                        rangeLabel: '€550–€1,200/yr (Indicative Estimate)',
                        url: `https://www.hiscox.ie/business-insurance?subid=${encodeURIComponent(`${plan.id}_${userId || 'founder'}`)}`,
                      },
                      {
                        providerName:
                          'Arachas / Allianz Ireland (Product, Workshop & Commercial Combined)',
                        focus:
                          'Ideal for Irish Physical Product Makers, Food/Craft Producers, E-Commerce & Workshops requiring Product & Public Liability (€2.6m–€6.5m).',
                        bundle:
                          'PRODUCT_PUBLIC_LIABILITY_STOCK' as InsuranceCoverageBundleType,
                        indicativeAnnualEstimate: 850,
                        rangeLabel: '€650–€1,450/yr (Indicative Estimate)',
                        url: `https://www.arachas.ie/business-insurance?subid=${encodeURIComponent(`${plan.id}_${userId || 'founder'}`)}`,
                      },
                      {
                        providerName:
                          'FBD / Irish Broker Concierge (Employers, Premises & Trade Package)',
                        focus:
                          'Ideal for Irish startups hiring employees, leasing local premises/studios, or bidding on LEO / state tenders.',
                        bundle:
                          'COMPREHENSIVE_COMMERCIAL_ALL_RISK' as InsuranceCoverageBundleType,
                        indicativeAnnualEstimate: 1350,
                        rangeLabel: '€950–€2,200/yr (Indicative Estimate)',
                        url: `https://www.fbd.ie/business-insurance?subid=${encodeURIComponent(`${plan.id}_${userId || 'founder'}`)}`,
                      },
                    ].map((broker) => (
                      <div
                        key={broker.providerName}
                        className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-2xs"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-bold text-slate-900">
                              🇮🇪 {broker.providerName}
                            </p>
                          </div>
                          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
                            {broker.focus}
                          </p>
                          <div className="mt-2 rounded bg-amber-50/80 px-2 py-1 text-[10px] font-medium text-amber-950">
                            Est. Benchmark: <strong>{broker.rangeLabel}</strong>{' '}
                            — actual coverage &amp; premium may vary.
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isVaultReadonly}
                            onClick={() =>
                              handleSelectPartnerInsuranceBroker(broker)
                            }
                            className="h-7 flex-1 border-indigo-300 bg-indigo-50 text-[11px] font-semibold text-indigo-900 hover:bg-indigo-100"
                          >
                            Use ~€{broker.indicativeAnnualEstimate}/yr Estimate
                          </Button>
                          <a
                            href={broker.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-7 items-center rounded-md border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Quote &nearr;
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : selectedCountry === 'GB' ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {[
                      {
                        providerName:
                          'Superscript / Hiscox UK (Flexible Monthly Tech, Cyber & PI)',
                        focus:
                          'Ideal for UK SaaS, AI, B2B Services & Innovate UK startups requiring Cyber + Tech E&O + Public Liability.',
                        bundle:
                          'TECH_SAAS_PI_CYBER' as InsuranceCoverageBundleType,
                        indicativeAnnualEstimate: 660,
                        rangeLabel: '£480–£1,050/yr (Indicative Estimate)',
                        url: `https://gosuperscript.com/?subid=${encodeURIComponent(`${plan.id}_${userId || 'founder'}`)}`,
                      },
                      {
                        providerName:
                          'Simply Business / Aviva UK (Product, Workshop & E-Commerce)',
                        focus:
                          'Ideal for UK Physical Product Makers, Craft/Workshop Founders & E-Commerce Sellers requiring Product & Public Liability (£2m–£5m).',
                        bundle:
                          'PRODUCT_PUBLIC_LIABILITY_STOCK' as InsuranceCoverageBundleType,
                        indicativeAnnualEstimate: 720,
                        rangeLabel: '£520–£1,250/yr (Indicative Estimate)',
                        url: `https://www.simplybusiness.co.uk/?subid=${encodeURIComponent(`${plan.id}_${userId || 'founder'}`)}`,
                      },
                      {
                        providerName:
                          'Hiscox UK Commercial Combined (+ Statutory £5m Employers’ Liability)',
                        focus:
                          'Ideal for UK startups hiring staff (statutory £5m Employers’ Liability legal minimum), leasing premises, or raising SEIS/EIS.',
                        bundle:
                          'COMPREHENSIVE_COMMERCIAL_ALL_RISK' as InsuranceCoverageBundleType,
                        indicativeAnnualEstimate: 1150,
                        rangeLabel: '£850–£1,900/yr (Indicative Estimate)',
                        url: `https://www.hiscox.co.uk/business-insurance?subid=${encodeURIComponent(`${plan.id}_${userId || 'founder'}`)}`,
                      },
                    ].map((broker) => (
                      <div
                        key={broker.providerName}
                        className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-2xs"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            🇬🇧 {broker.providerName}
                          </p>
                          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
                            {broker.focus}
                          </p>
                          <div className="mt-2 rounded bg-amber-50/80 px-2 py-1 text-[10px] font-medium text-amber-950">
                            Est. Benchmark: <strong>{broker.rangeLabel}</strong>{' '}
                            — actual coverage &amp; premium may vary.
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isVaultReadonly}
                            onClick={() =>
                              handleSelectPartnerInsuranceBroker(broker)
                            }
                            className="h-7 flex-1 border-indigo-300 bg-indigo-50 text-[11px] font-semibold text-indigo-900 hover:bg-indigo-100"
                          >
                            Use ~£{broker.indicativeAnnualEstimate}/yr Estimate
                          </Button>
                          <a
                            href={broker.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-7 items-center rounded-md border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Quote &nearr;
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {[
                      {
                        providerName:
                          'Commercial Tech E&O, Cyber & Professional Indemnity Broker',
                        focus:
                          'Recommended for Digital SaaS, AI, Marketplace & B2B Service startups.',
                        bundle:
                          'TECH_SAAS_PI_CYBER' as InsuranceCoverageBundleType,
                        indicativeAnnualEstimate: 780,
                        rangeLabel: 'Indicative Estimate (~780/yr)',
                      },
                      {
                        providerName:
                          'Commercial Product & Public Liability + Equipment All-Risks Broker',
                        focus:
                          'Recommended for Physical Goods, Workshop, Food/Craft & Hardware startups.',
                        bundle:
                          'PRODUCT_PUBLIC_LIABILITY_STOCK' as InsuranceCoverageBundleType,
                        indicativeAnnualEstimate: 850,
                        rangeLabel: 'Indicative Estimate (~850/yr)',
                      },
                    ].map((broker) => (
                      <div
                        key={broker.providerName}
                        className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-2xs"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            {broker.providerName}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-600">
                            {broker.focus}
                          </p>
                          <p className="mt-1.5 text-[10px] text-amber-900">
                            {broker.rangeLabel} — actual coverage &amp; premium
                            may vary.
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isVaultReadonly}
                          onClick={() =>
                            handleSelectPartnerInsuranceBroker(broker)
                          }
                          className="mt-3 h-7 border-indigo-300 bg-indigo-50 text-[11px] font-semibold text-indigo-900 hover:bg-indigo-100"
                        >
                          Apply Indicative Estimate
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 5. Part C: Dynamic Statutory Compliance, Tax Clearance, H&S & GDPR Checklist */}
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    Part C:{' '}
                    {selectedCountry === 'IE'
                      ? '🇮🇪'
                      : selectedCountry === 'GB'
                        ? '🇬🇧'
                        : '🌍'}{' '}
                    {countryPack.countryName} Statutory Compliance, Tax
                    Clearance, H&amp;S &amp; GDPR Checklist
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-600">
                    Track every mandatory registration, tax clearance, safety
                    statement, and sector license required for launch and grant
                    drawdown.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isVaultReadonly || isGeneratingAiStep5}
                    onClick={() =>
                      handleRunAiStep5('POPULATE_COMPLIANCE_AND_NARRATIVES')
                    }
                    className="h-8 border-indigo-300 bg-indigo-50 text-xs font-semibold text-indigo-900 hover:bg-indigo-100"
                  >
                    <Sparkles className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
                    {isGeneratingAiStep5
                      ? 'Drafting with AI...'
                      : 'AI Tailor Checklist & Narratives'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isVaultReadonly}
                    onClick={handleAddComplianceItem}
                    className="h-8 border-slate-300 text-xs font-semibold text-slate-800 hover:bg-slate-100"
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Add Compliance Item
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {step5Data.complianceItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-slate-200 bg-slate-50/60 p-3.5"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-slate-800 text-[10px] text-white">
                        #{idx + 1}
                      </Badge>
                      <span className="text-xs font-bold text-slate-900">
                        {item.requirementTitle || 'Compliance Requirement'}
                      </span>
                    </div>
                    {step5Data.complianceItems.length > 1 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={isVaultReadonly}
                        onClick={() => handleRemoveComplianceItem(item.id)}
                        className="h-7 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-12">
                    {/* Category */}
                    <div className="space-y-1 sm:col-span-4">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Compliance Category
                      </label>
                      <select
                        disabled={isVaultReadonly}
                        value={item.category}
                        onChange={(e) =>
                          handleUpdateComplianceItem(item.id, {
                            category: e.target
                              .value as ComplianceItemCategoryType,
                          })
                        }
                        className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-base text-slate-900 sm:text-xs"
                      >
                        {COMPLIANCE_ITEM_CATEGORY_OPTIONS.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                      {item.category === 'OTHER' && (
                        <input
                          disabled={isVaultReadonly}
                          value={item.otherCategoryText || ''}
                          onChange={(e) =>
                            handleUpdateComplianceItem(item.id, {
                              otherCategoryText: e.target.value,
                            })
                          }
                          placeholder="Specify custom compliance category..."
                          className="mt-1.5 h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-base sm:text-xs"
                        />
                      )}
                    </div>

                    {/* Requirement Title */}
                    <div className="space-y-1 sm:col-span-5">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Requirement / Statutory Obligation Title
                      </label>
                      <input
                        disabled={isVaultReadonly}
                        value={item.requirementTitle}
                        onChange={(e) =>
                          handleUpdateComplianceItem(item.id, {
                            requirementTitle: e.target.value,
                          })
                        }
                        className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-base sm:text-xs"
                      />
                    </div>

                    {/* Status */}
                    <div className="space-y-1 sm:col-span-3">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Verification Status
                      </label>
                      <select
                        disabled={isVaultReadonly}
                        value={item.status}
                        onChange={(e) =>
                          handleUpdateComplianceItem(item.id, {
                            status: e.target.value as ComplianceItemStatusType,
                          })
                        }
                        className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-base text-slate-900 sm:text-xs"
                      >
                        {COMPLIANCE_ITEM_STATUS_OPTIONS.map((st) => (
                          <option key={st.value} value={st.value}>
                            {st.label}
                          </option>
                        ))}
                      </select>
                      {item.status === 'OTHER' && (
                        <input
                          disabled={isVaultReadonly}
                          value={item.otherStatusText || ''}
                          onChange={(e) =>
                            handleUpdateComplianceItem(item.id, {
                              otherStatusText: e.target.value,
                            })
                          }
                          placeholder="Specify custom status..."
                          className="mt-1.5 h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-base sm:text-xs"
                        />
                      )}
                    </div>

                    {/* Regulatory Body */}
                    <div className="space-y-1 sm:col-span-4">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Regulator / Issuing Authority
                      </label>
                      <input
                        disabled={isVaultReadonly}
                        value={item.regulatoryBody}
                        onChange={(e) =>
                          handleUpdateComplianceItem(item.id, {
                            regulatoryBody: e.target.value,
                          })
                        }
                        className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-base sm:text-xs"
                      />
                    </div>

                    {/* Evidence / Reference Note */}
                    <div className="space-y-1 sm:col-span-6">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Verification Evidence, Action Plan or Reference Note
                      </label>
                      <input
                        disabled={isVaultReadonly}
                        value={item.evidenceOrReferenceNote}
                        onChange={(e) =>
                          handleUpdateComplianceItem(item.id, {
                            evidenceOrReferenceNote: e.target.value,
                          })
                        }
                        className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-base sm:text-xs"
                      />
                    </div>

                    {/* Est. Annual License / Fee Cost */}
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Est. Annual Fee ({plan.baseCurrency})
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={10}
                        disabled={isVaultReadonly}
                        value={item.estimatedAnnualCost}
                        onChange={(e) =>
                          handleUpdateComplianceItem(item.id, {
                            estimatedAnnualCost: Math.max(
                              0,
                              Number(e.target.value) || 0
                            ),
                          })
                        }
                        className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-base sm:text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 6. Part D: Grant-Ready Regulatory & Insurance Governance Narratives + Module K Preview */}
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    Part D: Grant-Ready Regulatory &amp; Insurance Governance
                    Narratives (Module K Export)
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-600">
                    These structured paragraphs compile directly into your{' '}
                    {selectedCountry === 'IE'
                      ? 'LEO / Enterprise Ireland Business Plan & Governance Appendix'
                      : selectedCountry === 'GB'
                        ? 'Innovate UK / Start Up Loans / SEIS-EIS Business Plan'
                        : 'Business Plan Legal & Regulatory Governance Section'}
                    .
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isVaultReadonly || isGeneratingAiStep5}
                  onClick={() => handleRunAiStep5('NARRATIVES_ONLY')}
                  className="h-8 border-indigo-300 bg-indigo-50 text-xs font-semibold text-indigo-900 hover:bg-indigo-100"
                >
                  <Sparkles className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
                  {isGeneratingAiStep5
                    ? 'Synthesizing...'
                    : 'AI Polish Both Narratives'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    1. Regulatory, Tax Clearance, Health &amp; Safety &amp; GDPR
                    Compliance Narrative
                  </label>
                  <textarea
                    rows={5}
                    disabled={isVaultReadonly}
                    value={step5Data.regulatoryAndComplianceNarrative}
                    onChange={(e) =>
                      setStep5Data((prev) => ({
                        ...prev,
                        regulatoryAndComplianceNarrative: e.target.value,
                      }))
                    }
                    placeholder={
                      selectedCountry === 'IE'
                        ? 'Summarize your CRO status, Revenue eTax Clearance (TC2 via ROS), HSA Section 20 Written Safety Statement (BeSMART.ie), DPC GDPR governance, and EU GPSR / sector compliance...'
                        : 'Summarize your Companies House & HMRC UTR status, UK HSE Health & Safety Risk Assessment (HSWA 1974), ICO Data Protection Fee registration, and UKCA / sector compliance...'
                    }
                    className="w-full rounded-md border border-slate-300 bg-white p-2.5 text-base leading-relaxed sm:text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    2. Commercial Insurance &amp; Liability Governance Narrative
                    (Includes Estimate Disclaimer)
                  </label>
                  <textarea
                    rows={5}
                    disabled={isVaultReadonly}
                    value={step5Data.insuranceAndLiabilityGovernanceNarrative}
                    onChange={(e) =>
                      setStep5Data((prev) => ({
                        ...prev,
                        insuranceAndLiabilityGovernanceNarrative:
                          e.target.value,
                      }))
                    }
                    placeholder="Summarize your matched commercial insurance bundle, preferred broker, and indicative estimated annual/monthly premium synced to Module I Overheads (noting that actual coverage and premiums may vary subject to underwriting)..."
                    className="w-full rounded-md border border-slate-300 bg-white p-2.5 text-base leading-relaxed sm:text-xs"
                  />
                </div>
              </div>

              {/* AI Coach Tip if present */}
              {step5Data.aiCoachTip && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-950">
                  <p className="font-bold text-emerald-900">
                    🚀 Preflight Compliance &amp; Grant Assessor Tip:
                  </p>
                  <p className="mt-1 leading-relaxed text-emerald-900">
                    {step5Data.aiCoachTip}
                  </p>
                </div>
              )}

              {/* Live Module K Compliance & Insurance Summary Table (overflow-x-auto) */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-800">
                    Live Module K Preview — Regulatory &amp; Insurance
                    Governance Schedule
                  </p>
                  <span className="text-[11px] text-slate-500">
                    Est. Annual Statutory Fees:{' '}
                    {formatPlanCurrency(
                      totalAnnualComplianceItemsCost,
                      plan.baseCurrency
                    )}
                    /yr + Est. Insurance: ~
                    {formatPlanCurrency(
                      step5Data.estimatedAnnualInsurancePremium,
                      plan.baseCurrency
                    )}
                    /yr (Estimate — Actual May Vary)
                  </span>
                </div>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="min-w-[640px] w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-700">
                        <th className="px-3 py-2">Category</th>
                        <th className="px-3 py-2">Requirement</th>
                        <th className="px-3 py-2">Regulator / Authority</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2 text-right">Est. Fee/Yr</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {step5Data.complianceItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-3 py-2 font-medium text-slate-800">
                            {item.category === 'OTHER' && item.otherCategoryText
                              ? item.otherCategoryText
                              : COMPLIANCE_ITEM_CATEGORY_OPTIONS.find(
                                  (c) => c.value === item.category
                                )?.label || item.category}
                          </td>
                          <td className="px-3 py-2 text-slate-900">
                            <p className="font-semibold">
                              {item.requirementTitle}
                            </p>
                            {item.evidenceOrReferenceNote && (
                              <p className="mt-0.5 text-[11px] text-slate-500">
                                {item.evidenceOrReferenceNote}
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-2 text-slate-700">
                            {item.regulatoryBody}
                          </td>
                          <td className="px-3 py-2">
                            <Badge variant="outline" className="text-[10px]">
                              {item.status === 'OTHER' && item.otherStatusText
                                ? item.otherStatusText
                                : COMPLIANCE_ITEM_STATUS_OPTIONS.find(
                                    (s) => s.value === item.status
                                  )?.label || item.status}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-slate-800">
                            {formatPlanCurrency(
                              item.estimatedAnnualCost,
                              plan.baseCurrency
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Save & Continue Footer */}
              <div className="flex flex-col gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveTab('STEP_4')}
                  className="w-full text-xs sm:w-auto"
                >
                  &larr; Back to Step 4 (Support, Returns &amp; QC SOP)
                </Button>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Button
                    type="button"
                    size="sm"
                    disabled={isVaultReadonly || isSavingStep5}
                    onClick={handleSaveStep5}
                    className="w-full bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700 sm:w-auto"
                  >
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                    {isSavingStep5
                      ? 'Saving Step 5...'
                      : 'Save Step 5 (Permits, Compliance & Insurance)'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isVaultReadonly || isSavingStep5}
                    onClick={async () => {
                      await handleSaveStep5();
                      setActiveTab('STEP_6');
                      setOpenStep(6);
                      setTimeout(() => {
                        const el = document.getElementById('module-e-step-6');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 50);
                    }}
                    className="w-full border-indigo-300 bg-indigo-50 text-xs font-semibold text-indigo-900 hover:bg-indigo-100 sm:w-auto"
                  >
                    Next: Operations Brief &amp; Overview &rarr;
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODULE E SUMMARY DOCUMENT: OPERATIONS, EQUIPMENT & RISK BRIEF       */}
      {/* (Matches Module A, Module B & Module D Overview Step Standard 100%) */}
      {/* =================================================================== */}
      {openStep !== 'ALL' && openStep !== 6 ? (
        <div
          id="module-e-step-6"
          onClick={() => {
            setOpenStep(6);
            setActiveTab('STEP_6');
          }}
          className="group scroll-mt-24 cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  completedModuleECoreStepsCount === 5
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 text-white'
                }`}
              >
                <FileText className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-sm font-bold text-slate-900">
                    Operations, Equipment &amp; Risk Brief (Executive Summary)
                  </h2>
                  <Badge
                    variant={
                      completedModuleECoreStepsCount === 5
                        ? 'success'
                        : 'secondary'
                    }
                    className="shrink-0 text-[10px]"
                  >
                    {completedModuleECoreStepsCount}/5 Sections Ready
                  </Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  Your complete Module E order fulfillment flow, 3-quote equipment schedule, 4-category risk register &amp; compliance brief — ready to view, audit, or export.
                </p>
              </div>
            </div>
            <div className="ml-3 flex shrink-0 items-center gap-2">
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
        <Card
          id="module-e-step-6"
          className="scroll-mt-24 rounded-xl border border-indigo-200 bg-gradient-to-br from-white via-indigo-50/30 to-violet-50/40 p-6 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    completedModuleECoreStepsCount === 5
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  Operations, Equipment &amp; Risk Brief
                </h2>
                <Badge
                  variant={
                    completedModuleECoreStepsCount === 5
                      ? 'success'
                      : 'secondary'
                  }
                  className="shrink-0 text-[10px]"
                >
                  {completedModuleECoreStepsCount}/5 Sections Ready
                </Badge>
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Everything you captured across Steps 1–5 is compiled below into a clean executive operations summary and constructive blind-spot audit before moving into Module F.
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

          <CardContent className="space-y-5 px-0 pb-0 pt-4">
            {/* 5-STEP MODULE E READINESS CHECKLIST */}
            <div className="rounded-xl border border-indigo-100 bg-white p-4 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Module E Readiness Checklist (Steps 1–5 Included in Your Brief)
                </div>
                <span className="text-xs font-semibold text-indigo-700">
                  Live-Synced with Your Answers Above
                </span>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {moduleEReadinessSteps.slice(0, 5).map((step) => (
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
                        step.isComplete ? 'text-emerald-600' : 'text-amber-500'
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
          <Card className="border-indigo-200 bg-white shadow-xs">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-indigo-600 text-[10px] font-bold text-white">
                      Step 6 of 6 • Final Module E Sign-Off
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-emerald-300 bg-emerald-50 text-[10px] font-semibold text-emerald-800"
                    >
                      {selectedCountry === 'IE'
                        ? '🇮🇪 IE LEO Section 6 & Appendix C Ready'
                        : selectedCountry === 'GB'
                          ? '🇬🇧 UK Innovate UK Q6–Q8 & Start Up Loans Ready'
                          : `🌍 ${countryPack.countryName} Operations Brief`}
                    </Badge>
                  </div>
                  <CardTitle className="text-base font-bold text-slate-900 sm:text-lg">
                    Step 6: Operations &ldquo;Things to Consider&rdquo;
                    Blind-Spot Engine &amp; Executive Operations Brief
                  </CardTitle>
                  <CardDescription className="text-xs leading-relaxed text-slate-600">
                    Review your constructive operational blind spots across
                    Steps 1–5, verify the unit-economics and monthly overhead
                    numbers syncing into Module G &amp; Module I, and sign off
                    on your Executive Operations Brief for Module K.
                  </CardDescription>
                </div>

                {/* Built-in Support Toolbar */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowWhyAskingStep6((v) => !v)}
                    className="h-8 border-indigo-200 bg-indigo-50/70 px-2.5 text-[11px] font-semibold text-indigo-900 hover:bg-indigo-100"
                  >
                    <HelpCircle className="mr-1 h-3.5 w-3.5 text-indigo-600" />
                    Why Are We Asking?
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowExampleDrawerStep6((v) => !v)}
                    className="h-8 border-amber-200 bg-amber-50/70 px-2.5 text-[11px] font-semibold text-amber-900 hover:bg-amber-100"
                  >
                    <Lightbulb className="mr-1 h-3.5 w-3.5 text-amber-600" />
                    Show Example
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isVaultReadonly}
                    onClick={handleApplyStep6IndustryBenchmark}
                    className="h-8 border-emerald-200 bg-emerald-50/70 px-2.5 text-[11px] font-semibold text-emerald-900 hover:bg-emerald-100"
                  >
                    <Wand2 className="mr-1 h-3.5 w-3.5 text-emerald-600" />
                    Use Industry Benchmark
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowParkInputStep6((v) => !v)}
                    className="h-8 border-slate-200 bg-slate-50 px-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <BookmarkPlus className="mr-1 h-3.5 w-3.5 text-slate-600" />
                    Park Question
                  </Button>
                </div>
              </div>

              {/* Why Are We Asking Drawer */}
              {showWhyAskingStep6 && (
                <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50/70 p-3.5 text-xs text-indigo-950">
                  <p className="font-bold">
                    🎯 Why Grant Assessors &amp; Lenders Audit Your Operations
                    Cohesion:
                  </p>
                  <ul className="mt-1.5 list-disc space-y-1 pl-4 text-indigo-900">
                    <li>
                      <strong>No Contradictions Between Ops &amp; Finance:</strong>{' '}
                      Assessors cross-check your Section 6 Operations narrative
                      against your financial cashflow. Step 6 automatically
                      rolls up your Step 1 Direct COGS (
                      {formatPlanCurrency(
                        totalDirectVariableCostPerOrder,
                        plan.baseCurrency
                      )}
                      /order), Step 4 Returns Buffer (
                      {formatPlanCurrency(
                        expectedReturnBufferPerOrder,
                        plan.baseCurrency
                      )}
                      /order), Step 2 Premises &amp; CapEx, and Step 5
                      Indicative Insurance Estimate (~
                      {formatPlanCurrency(
                        step5Data.estimatedAnnualInsurancePremium,
                        plan.baseCurrency
                      )}
                      /yr — planning estimate only, actual coverage may vary) so
                      Modules G and I never contradict Module E.
                    </li>
                    <li>
                      <strong>
                        {selectedCountry === 'IE'
                          ? '🇮🇪 Local Enterprise Office (LEO) & Enterprise Ireland Pre-Flight:'
                          : selectedCountry === 'GB'
                            ? '🇬🇧 Innovate UK & British Business Bank Start Up Loans Pre-Flight:'
                            : '🌍 Official Grant & Loan Pre-Flight:'}
                      </strong>{' '}
                      {selectedCountry === 'IE'
                        ? 'Flags LEO retrospective spend rules, 3-quote compliance for assets ≥€1,000 ex-VAT, laptop/phone capital exclusions, and Revenue eTax Clearance (TC2 via ROS) before you submit.'
                        : selectedCountry === 'GB'
                          ? 'Flags Innovate UK eligible capital usage depreciation vs. upfront Start Up Loan CapEx, statutory £5m UK Employers Liability rules, and ICO Data Protection Fee compliance before you submit.'
                          : 'Flags capacity ceilings, single-source supplier risks, and statutory compliance items before you export your business plan.'}
                    </li>
                  </ul>
                </div>
              )}

              {/* Industry Example Drawer */}
              {showExampleDrawerStep6 && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 text-xs text-amber-950">
                  <p className="font-bold">
                    💡 Tailored Example for {plan.title || 'Your Plan'} (
                    {inheritedTrack.replace(/_/g, ' ')} •{' '}
                    {selectedCountry === 'IE'
                      ? '🇮🇪 Ireland'
                      : selectedCountry === 'GB'
                        ? '🇬🇧 United Kingdom'
                        : countryPack.countryName}
                    ):
                  </p>
                  <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <div className="rounded-lg border border-amber-200/80 bg-white p-2.5">
                      <p className="font-bold text-slate-900">
                        Constructive Blind Spot Resolved:
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                        {selectedCountry === 'IE'
                          ? '“All Step 2 capital items ≥€1,000 ex-VAT have 3 dated supplier quotes attached for LEO Appendix C, laptops are ring-fenced as 100% Founder/BYOD funded, and our ~60-day LEO grant reimbursement bridge is modeled in Module I.”'
                          : '“R&D machinery depreciation is separated for Innovate UK while working-capital asset finance is structured for British Business Bank Start Up Loans, with backup UK suppliers verified in Step 3.”'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-amber-200/80 bg-white p-2.5">
                      <p className="font-bold text-slate-900">
                        Operations-to-Finance Handshake:
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                        “Combined unit delivery COGS (
                        {formatPlanCurrency(
                          totalEffectiveUnitDeliveryCogs,
                          plan.baseCurrency
                        )}
                        /order including {step4Data.estimatedReturnOrRefundRatePercent}
                        % return reserve) feeds Module G pricing, while premises
                        and our indicative insurance estimate (~
                        {formatPlanCurrency(
                          estimatedMonthlyInsuranceOverhead,
                          plan.baseCurrency
                        )}
                        /mo; estimate only — actual coverage may vary) sync to
                        Module I Overheads.”
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Park Open Question Drawer */}
              {showParkInputStep6 && (
                <div className="mt-3 flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    value={parkQuestionInputStep6}
                    onChange={(e) => setParkQuestionInputStep6(e.target.value)}
                    placeholder="e.g., Confirm working capital bridge for 60-day grant reimbursement lag..."
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-base text-slate-900 sm:text-xs"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={async () => {
                      if (!parkQuestionInputStep6.trim()) return;
                      await onParkOpenQuestion(
                        `[Step 6 - Ops Blind-Spot Audit] ${parkQuestionInputStep6.trim()}`
                      );
                      setParkQuestionInputStep6('');
                      setShowParkInputStep6(false);
                      setSaveBanner(
                        '📌 Parked question in your Open Questions Parking Lot!'
                      );
                    }}
                    className="bg-slate-900 text-xs text-white hover:bg-slate-800"
                  >
                    Save to Parking Lot
                  </Button>
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-6 pt-5">
              {/* ============================================================= */}
              {/* 1. LIVE 4-CARD OPERATIONS-TO-FINANCE HANDSHAKE ROLLUP STRIP   */}
              {/* ============================================================= */}
              <div className="rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50/80 via-slate-50 to-emerald-50/70 p-4">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-indigo-950">
                      🔗 Live Operations-to-Finance &amp; Team Handshake Rollup
                      (Steps 1–5)
                    </p>
                    <p className="text-[11px] text-slate-600">
                      These four live operational metrics feed directly into
                      Module F (Hiring Triggers), Module G (Unit Economics),
                      Module I (36-Month Cashflow), and Module K (Grant Plan).
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="w-fit border-indigo-300 bg-white text-[10px] font-bold text-indigo-900"
                  >
                    Resolved Considerations: {resolvedBlindSpotsCount} /{' '}
                    {step6Data.blindSpots.length}
                  </Badge>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Card 1: Unit Delivery Cost + Return Buffer -> Module G */}
                  <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-slate-500">
                        1. Unit Ops COGS &rarr; Mod G
                      </span>
                      <Badge
                        variant="outline"
                        className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-800"
                      >
                        Unit Economics
                      </Badge>
                    </div>
                    <p className="mt-1 text-base font-extrabold text-slate-900 sm:text-lg">
                      {formatPlanCurrency(
                        totalEffectiveUnitDeliveryCogs,
                        plan.baseCurrency
                      )}{' '}
                      <span className="text-xs font-normal text-slate-500">
                        / order
                      </span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-600">
                      {formatPlanCurrency(
                        totalDirectVariableCostPerOrder,
                        plan.baseCurrency
                      )}{' '}
                      Step 1 Direct COGS +{' '}
                      {formatPlanCurrency(
                        expectedReturnBufferPerOrder,
                        plan.baseCurrency
                      )}{' '}
                      Step 4 Return Reserve (
                      {step4Data.estimatedReturnOrRefundRatePercent}%)
                    </p>
                  </div>

                  {/* Card 2: Weekly Capacity Ceiling -> Module F */}
                  <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-slate-500">
                        2. Weekly Ceiling &rarr; Mod F
                      </span>
                      <Badge
                        variant="outline"
                        className="border-indigo-200 bg-indigo-50 text-[10px] text-indigo-800"
                      >
                        Hiring Trigger
                      </Badge>
                    </div>
                    <p className="mt-1 text-base font-extrabold text-indigo-900 sm:text-lg">
                      {totalActiveMinutesPerOrder === 0
                        ? 'Automated Cloud'
                        : `${maxOrdersPerWeekByManualTime} orders / wk`}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-600">
                      {totalActiveMinutesPerOrder} active mins/order across{' '}
                      {weeklyOpsHours} hrs/wk (~
                      {maxOrdersPerMonthByManualTime} orders/mo ceiling)
                    </p>
                  </div>

                  {/* Card 3: Monthly Fixed Ops Overheads (with explicit Insurance Estimate Disclaimer) -> Module I */}
                  <div className="rounded-xl border border-amber-200 bg-white p-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-slate-500">
                        3. Monthly Ops Overhead &rarr; Mod I
                      </span>
                      <Badge
                        variant="outline"
                        className="border-amber-300 bg-amber-50 text-[10px] text-amber-900"
                      >
                        Est. Overheads
                      </Badge>
                    </div>
                    <p className="mt-1 text-base font-extrabold text-slate-900 sm:text-lg">
                      ~
                      {formatPlanCurrency(
                        totalMonthlyFixedOpsOverhead,
                        plan.baseCurrency
                      )}{' '}
                      <span className="text-xs font-normal text-slate-500">
                        / mo (Est.)
                      </span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-600">
                      Premises:{' '}
                      {formatPlanCurrency(
                        step2Data.monthlyPremisesAndUtilitiesCost,
                        plan.baseCurrency
                      )}
                      /mo +{' '}
                      <strong>
                        Est. Insurance: ~
                        {formatPlanCurrency(
                          estimatedMonthlyInsuranceOverhead,
                          plan.baseCurrency
                        )}
                        /mo (~
                        {formatPlanCurrency(
                          step5Data.estimatedAnnualInsurancePremium,
                          plan.baseCurrency
                        )}
                        /yr indicative estimate — actual coverage &amp; premium
                        may vary)
                      </strong>
                    </p>
                  </div>

                  {/* Card 4: Net CapEx & Grant Compliance -> Module I & J */}
                  <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-slate-500">
                        4. Equipment CapEx &rarr; Mod I &amp; J
                      </span>
                      <Badge
                        variant="outline"
                        className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-800"
                      >
                        {selectedCountry === 'IE'
                          ? 'IE LEO CapEx'
                          : selectedCountry === 'GB'
                            ? 'UK CapEx / Depr.'
                            : 'CapEx Schedule'}
                      </Badge>
                    </div>
                    <p className="mt-1 text-base font-extrabold text-emerald-900 sm:text-lg">
                      {formatPlanCurrency(
                        newOutlayCapexExVat,
                        plan.baseCurrency
                      )}{' '}
                      <span className="text-xs font-normal text-slate-500">
                        ex-VAT
                      </span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-600">
                      {selectedCountry === 'IE'
                        ? `Est. 50% LEO Grant: ${formatPlanCurrency(estimatedLeo50GrantRebate, plan.baseCurrency)} • Net Founder Outlay: ${formatPlanCurrency(netFounderCashOutlayAfterLeoGrant, plan.baseCurrency)}`
                        : selectedCountry === 'GB'
                          ? `Innovate UK Eligible Annual Depr.: ${formatPlanCurrency(ukInnovateAnnualEligibleDepreciation, plan.baseCurrency)}/yr`
                          : `${step2Data.equipmentItems.length} equipment items scheduled`}
                    </p>
                  </div>
                </div>

                {/* Explicit Insurance Estimate Callout Banner */}
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2 text-[11px] text-amber-950">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" />
                  <p>
                    <strong>
                      Indicative Insurance Premium Disclaimer (~
                      {formatPlanCurrency(
                        step5Data.estimatedAnnualInsurancePremium,
                        plan.baseCurrency
                      )}
                      /yr • ~
                      {formatPlanCurrency(
                        estimatedMonthlyInsuranceOverhead,
                        plan.baseCurrency
                      )}
                      /mo):
                    </strong>{' '}
                    The Estimated Annual Insurance Premium synced from Step 5 to
                    Module I Overheads is an{' '}
                    <strong>indicative planning estimate only</strong>. Actual
                    coverage, policy limits, exclusions, and final premiums may
                    vary based on formal insurer underwriting, claims history,
                    turnover, and contractual requirements.
                  </p>
                </div>
              </div>

              {/* ============================================================= */}
              {/* PART A: OPERATIONAL LAUNCH READINESS POSTURE (+ OTHER)        */}
              {/* ============================================================= */}
              <div className="space-y-3">
                <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Part A: Operational Launch &amp; Grant Audit Readiness
                    Posture
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Includes &ldquo;Other&rdquo; custom readiness posture option
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {OPERATIONS_READINESS_CONFIDENCE_OPTIONS.map((opt) => {
                    const isSelected =
                      step6Data.readinessConfidence === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={isVaultReadonly}
                        onClick={() =>
                          setStep6Data((prev) => ({
                            ...prev,
                            readinessConfidence: opt.value,
                          }))
                        }
                        className={`flex flex-col justify-between rounded-xl border p-3 text-left transition ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-600/20'
                            : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              {opt.label}
                            </span>
                            <Badge
                              variant="outline"
                              className={
                                isSelected
                                  ? 'border-indigo-300 bg-indigo-100 text-[10px] text-indigo-900'
                                  : 'border-slate-200 bg-slate-50 text-[10px] text-slate-600'
                              }
                            >
                              {opt.badge}
                            </Badge>
                          </div>
                          <p className="text-[11px] leading-relaxed text-slate-600">
                            {opt.subtitle}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {step6Data.readinessConfidence === 'OTHER' && (
                  <div className="rounded-lg border border-indigo-200 bg-indigo-50/40 p-3">
                    <label className="block text-xs font-semibold text-indigo-950">
                      Describe Your Custom Operational Readiness Posture:
                    </label>
                    <input
                      type="text"
                      disabled={isVaultReadonly}
                      value={step6Data.otherReadinessConfidenceText || ''}
                      onChange={(e) =>
                        setStep6Data((prev) => ({
                          ...prev,
                          otherReadinessConfidenceText: e.target.value,
                        }))
                      }
                      placeholder="e.g., Seasonal pop-up workshop ready for Q4 batch run while commercial lease completes..."
                      className="mt-1.5 w-full rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-base text-slate-900 sm:text-xs"
                    />
                  </div>
                )}
              </div>

              {/* ============================================================= */}
              {/* PART B: CONSTRUCTIVE "THINGS TO CONSIDER" BLIND-SPOT ENGINE   */}
              {/* ============================================================= */}
              <div className="space-y-3 border-t border-slate-200 pt-5">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 sm:text-sm">
                      Part B: Constructive Operations &ldquo;Things to
                      Consider&rdquo; Blind-Spot Review
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Review each operational blind spot below, edit the action
                      plan, mark items resolved as you address them, or park
                      open items for later.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isVaultReadonly || isGeneratingAiStep6}
                      onClick={() =>
                        handleRunAiStep6('POPULATE_BLIND_SPOTS_AND_NARRATIVES')
                      }
                      className="border-indigo-300 bg-indigo-50 text-xs font-semibold text-indigo-900 hover:bg-indigo-100"
                    >
                      {isGeneratingAiStep6 ? (
                        <>
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          Auditing Operations...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
                          AI Run Blind-Spot Audit &amp; Brief
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isVaultReadonly}
                      onClick={handleAddBlindSpotItem}
                      className="text-xs"
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Add Consideration
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {step6Data.blindSpots.map((item, idx) => {
                    const isCritical = item.severity === 'CRITICAL';
                    const isWatch = item.severity === 'WATCH';
                    return (
                      <div
                        key={item.id}
                        className={`rounded-xl border p-3.5 transition ${
                          item.isResolved
                            ? 'border-emerald-300 bg-emerald-50/40'
                            : isCritical
                              ? 'border-rose-200 bg-rose-50/30'
                              : isWatch
                                ? 'border-indigo-200 bg-indigo-50/30'
                                : 'border-amber-200 bg-amber-50/30'
                        }`}
                      >
                        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white">
                              Consideration #{idx + 1}
                            </span>

                            <select
                              disabled={isVaultReadonly}
                              value={item.category}
                              onChange={(e) =>
                                handleUpdateBlindSpotItem(item.id, {
                                  category: e.target
                                    .value as OperationsBlindSpotCategoryType,
                                })
                              }
                              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-base font-semibold text-slate-800 sm:text-xs"
                            >
                              {OPERATIONS_BLIND_SPOT_CATEGORY_OPTIONS.map(
                                (cat) => (
                                  <option key={cat.value} value={cat.value}>
                                    {cat.label}
                                  </option>
                                )
                              )}
                            </select>

                            <select
                              disabled={isVaultReadonly}
                              value={item.severity}
                              onChange={(e) =>
                                handleUpdateBlindSpotItem(item.id, {
                                  severity: e.target
                                    .value as OperationsBlindSpotSeverityType,
                                })
                              }
                              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-base font-bold text-slate-800 sm:text-xs"
                            >
                              <option value="CRITICAL">
                                🚨 Critical Pre-Launch Action
                              </option>
                              <option value="IMPORTANT">
                                ⚠️ Operational Watch-Out
                              </option>
                              <option value="WATCH">
                                ✨ Strategic &amp; Grant Advisory
                              </option>
                            </select>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            <Button
                              type="button"
                              size="sm"
                              variant={item.isResolved ? 'default' : 'outline'}
                              disabled={isVaultReadonly}
                              onClick={() =>
                                handleToggleBlindSpotResolved(item.id)
                              }
                              className={
                                item.isResolved
                                  ? 'h-7 bg-emerald-600 px-2.5 text-[11px] text-white hover:bg-emerald-700'
                                  : 'h-7 border-emerald-300 bg-white px-2.5 text-[11px] text-emerald-800 hover:bg-emerald-50'
                              }
                            >
                              <Check className="mr-1 h-3 w-3" />
                              {item.isResolved
                                ? 'Resolved / Addressed'
                                : 'Mark Addressed'}
                            </Button>

                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                await onParkOpenQuestion(
                                  `[Ops Blind Spot] ${item.title}: ${item.recommendedActionOrFix}`
                                );
                                setSaveBanner(
                                  `📌 Parked "${item.title}" in Open Questions!`
                                );
                              }}
                              className="h-7 border-slate-300 bg-white px-2 text-[11px] text-slate-700 hover:bg-slate-100"
                            >
                              <BookmarkPlus className="mr-1 h-3 w-3" />
                              Park
                            </Button>

                            {step6Data.blindSpots.length > 1 && (
                              <button
                                type="button"
                                disabled={isVaultReadonly}
                                onClick={() =>
                                  handleRemoveBlindSpotItem(item.id)
                                }
                                className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                title="Remove consideration"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {item.category === 'OTHER' && (
                          <div className="mt-2">
                            <input
                              type="text"
                              disabled={isVaultReadonly}
                              value={item.otherCategoryText || ''}
                              onChange={(e) =>
                                handleUpdateBlindSpotItem(item.id, {
                                  otherCategoryText: e.target.value,
                                })
                              }
                              placeholder="Specify custom operational blind-spot category..."
                              className="w-full rounded-lg border border-indigo-300 bg-white px-2.5 py-1.5 text-base text-slate-900 sm:text-xs"
                            />
                          </div>
                        )}

                        <div className="mt-2.5 grid grid-cols-1 gap-2.5 lg:grid-cols-12">
                          <div className="lg:col-span-4">
                            <label className="block text-[10px] font-bold uppercase text-slate-500">
                              Consideration Headline
                            </label>
                            <input
                              type="text"
                              disabled={isVaultReadonly}
                              value={item.title}
                              onChange={(e) =>
                                handleUpdateBlindSpotItem(item.id, {
                                  title: e.target.value,
                                })
                              }
                              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-base font-semibold text-slate-900 sm:text-xs"
                            />
                          </div>

                          <div className="lg:col-span-4">
                            <label className="block text-[10px] font-bold uppercase text-slate-500">
                              Why It Matters (Grant &amp; Margin Impact)
                            </label>
                            <textarea
                              rows={2}
                              disabled={isVaultReadonly}
                              value={item.whyItMatters}
                              onChange={(e) =>
                                handleUpdateBlindSpotItem(item.id, {
                                  whyItMatters: e.target.value,
                                })
                              }
                              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-base text-slate-800 sm:text-xs"
                            />
                          </div>

                          <div className="lg:col-span-4">
                            <label className="block text-[10px] font-bold uppercase text-emerald-800">
                              Constructive De-Risking Action
                            </label>
                            <textarea
                              rows={2}
                              disabled={isVaultReadonly}
                              value={item.recommendedActionOrFix}
                              onChange={(e) =>
                                handleUpdateBlindSpotItem(item.id, {
                                  recommendedActionOrFix: e.target.value,
                                })
                              }
                              className="mt-1 w-full rounded-lg border border-emerald-300 bg-white px-2.5 py-1.5 text-base text-slate-800 sm:text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ============================================================= */}
              {/* PART C: EXECUTIVE OPERATIONS BRIEF & HANDSHAKE NARRATIVES     */}
              {/* ============================================================= */}
              <div className="space-y-4 border-t border-slate-200 pt-5">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 sm:text-sm">
                      Part C: Executive Operations Brief &amp; Finance/Team
                      Handshake Narratives
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Compiles directly into Module K (Business Plan Section 6
                      &amp; Official{' '}
                      {selectedCountry === 'IE'
                        ? 'IE LEO / Enterprise Ireland'
                        : selectedCountry === 'GB'
                          ? 'UK Innovate UK / Start Up Loans'
                          : countryPack.countryName}{' '}
                      Grant Pack).
                    </p>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isVaultReadonly || isGeneratingAiStep6}
                    onClick={() => handleRunAiStep6('NARRATIVES_ONLY')}
                    className="border-indigo-300 bg-indigo-50 text-xs font-semibold text-indigo-900 hover:bg-indigo-100"
                  >
                    {isGeneratingAiStep6 ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Synthesizing Brief...
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
                        AI Draft Executive Narratives Only
                      </>
                    )}
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      1. Executive Operations &amp; Fulfillment Summary (Module
                      K Section 6)
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Synthesizes your 5-stage fulfillment workflow, premises &amp;
                      equipment schedule, 4-category risk register, 3-gate QC
                      SOP, and statutory compliance.
                    </p>
                    <textarea
                      rows={5}
                      disabled={isVaultReadonly}
                      value={step6Data.executiveOperationsSummaryNarrative}
                      onChange={(e) =>
                        setStep6Data((prev) => ({
                          ...prev,
                          executiveOperationsSummaryNarrative: e.target.value,
                        }))
                      }
                      placeholder="Click 'AI Run Blind-Spot Audit & Brief' or 'Use Industry Benchmark' above to synthesize your Executive Operations Brief..."
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 text-base leading-relaxed text-slate-900 sm:text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      2. Operations-to-Finance &amp; Team Handshake Narrative
                      (Modules F, G &amp; I)
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Documents how unit COGS, return buffers, premises costs,
                      and your indicative insurance estimate (actual coverage
                      may vary) flow into your financial model.
                    </p>
                    <textarea
                      rows={5}
                      disabled={isVaultReadonly}
                      value={
                        step6Data.operationsToFinanceAndTeamHandshakeNarrative
                      }
                      onChange={(e) =>
                        setStep6Data((prev) => ({
                          ...prev,
                          operationsToFinanceAndTeamHandshakeNarrative:
                            e.target.value,
                        }))
                      }
                      placeholder="Click 'AI Run Blind-Spot Audit & Brief' or 'Use Industry Benchmark' above to generate your Operations-to-Finance Handshake Narrative..."
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 text-base leading-relaxed text-slate-900 sm:text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* ============================================================= */}
              {/* LIVE MODULE E MASTER SUMMARY TABLE (STEPS 1-6 ROLLUP)         */}
              {/* ============================================================= */}
              <div className="space-y-2 border-t border-slate-200 pt-5">
                <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                  <p className="text-xs font-bold text-slate-800">
                    📋 Live Module K Preview — Master Operations &amp;
                    Financial Handshake Schedule (Steps 1–6)
                  </p>
                  <span className="text-[11px] text-slate-500">
                    Est. Annual Insurance (~
                    {formatPlanCurrency(
                      step5Data.estimatedAnnualInsurancePremium,
                      plan.baseCurrency
                    )}
                    /yr) is an indicative estimate — actual coverage &amp;
                    premium may vary
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="min-w-[660px] w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-700">
                        <th className="px-3 py-2">Module E Pillar</th>
                        <th className="px-3 py-2">Operational Posture</th>
                        <th className="px-3 py-2">Key Quantified Metric</th>
                        <th className="px-3 py-2">Downstream Module Sync</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      <tr>
                        <td className="px-3 py-2 font-semibold text-slate-900">
                          Step 1 • Day in the Life of an Order
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {step1Data.fulfillmentMode === 'OTHER' &&
                          step1Data.otherFulfillmentModeText
                            ? step1Data.otherFulfillmentModeText
                            : step1Data.fulfillmentMode.replace(/_/g, ' ')}
                        </td>
                        <td className="px-3 py-2 font-semibold text-slate-900">
                          {totalActiveMinutesPerOrder} mins/order •{' '}
                          {formatPlanCurrency(
                            totalDirectVariableCostPerOrder,
                            plan.baseCurrency
                          )}{' '}
                          Direct COGS • Max {maxOrdersPerWeekByManualTime}{' '}
                          orders/wk
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          Module G (Unit COGS) &amp; Module F (Ops Hiring Trigger)
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-semibold text-slate-900">
                          Step 2 • Premises &amp; Equipment Schedule
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {step2Data.premisesSetupMode === 'OTHER' &&
                          step2Data.otherPremisesSetupModeText
                            ? step2Data.otherPremisesSetupModeText
                            : step2Data.premisesSetupMode.replace(/_/g, ' ')}
                        </td>
                        <td className="px-3 py-2 font-semibold text-slate-900">
                          Premises:{' '}
                          {formatPlanCurrency(
                            step2Data.monthlyPremisesAndUtilitiesCost,
                            plan.baseCurrency
                          )}
                          /mo • New CapEx:{' '}
                          {formatPlanCurrency(
                            newOutlayCapexExVat,
                            plan.baseCurrency
                          )}{' '}
                          ex-VAT
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          Module I (Overheads &amp; CapEx) &amp; Module J (Grants)
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-semibold text-slate-900">
                          Step 3 • 4-Category Risk Register
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {step3Data.supplierRedundancyPosture === 'OTHER' &&
                          step3Data.otherSupplierRedundancyPostureText
                            ? step3Data.otherSupplierRedundancyPostureText
                            : step3Data.supplierRedundancyPosture.replace(
                                /_/g,
                                ' '
                              )}
                        </td>
                        <td className="px-3 py-2 font-semibold text-slate-900">
                          {step3Data.riskItems.length} Formal Risks •{' '}
                          {step3Data.leadTimeBufferDays}d Lead-Time Buffer
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          Module K (Risk Register Appendix)
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-semibold text-slate-900">
                          Step 4 • Support, Returns &amp; 3-Gate QC
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {step4Data.returnsAndWarrantyPolicy === 'OTHER' &&
                          step4Data.otherReturnsAndWarrantyPolicyText
                            ? step4Data.otherReturnsAndWarrantyPolicyText
                            : step4Data.returnsAndWarrantyPolicy.replace(
                                /_/g,
                                ' '
                              )}
                        </td>
                        <td className="px-3 py-2 font-semibold text-slate-900">
                          {step4Data.estimatedReturnOrRefundRatePercent}% Return
                          Rate •{' '}
                          {formatPlanCurrency(
                            expectedReturnBufferPerOrder,
                            plan.baseCurrency
                          )}
                          /order Return Buffer
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          Module G (Pocket Profit Margin Protection)
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-semibold text-slate-900">
                          Step 5 • Permits, GDPR &amp; Startup Insurance
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {step5Data.selectedInsuranceProviderName ||
                            step5Data.insuranceCoverageBundle.replace(
                              /_/g,
                              ' '
                            )}
                        </td>
                        <td className="px-3 py-2 font-semibold text-amber-900">
                          Est. ~
                          {formatPlanCurrency(
                            step5Data.estimatedAnnualInsurancePremium,
                            plan.baseCurrency
                          )}
                          /yr (~
                          {formatPlanCurrency(
                            estimatedMonthlyInsuranceOverhead,
                            plan.baseCurrency
                          )}
                          /mo){' '}
                          <span className="font-normal text-slate-600">
                            (Indicative Estimate — Actual Coverage May Vary)
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          Module I (Monthly Overheads) &amp; Module K (Compliance)
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ============================================================= */}
              {/* SAVE & CONTINUE TO MODULE F FOOTER                            */}
              {/* ============================================================= */}
              <div className="flex flex-col gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveTab('STEP_5')}
                  className="w-full text-xs sm:w-auto"
                >
                  &larr; Back to Step 5 (Permits, Compliance &amp; Insurance)
                </Button>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Button
                    type="button"
                    size="sm"
                    disabled={isVaultReadonly || isSavingStep6}
                    onClick={handleSaveStep6}
                    className="w-full bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700 sm:w-auto"
                  >
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                    {isSavingStep6
                      ? 'Saving Step 6...'
                      : 'Save Step 6 (Complete Module E)'}
                  </Button>

                  {onContinueToModuleF && (
                    <Button
                      type="button"
                      size="sm"
                      disabled={isVaultReadonly || isSavingStep6}
                      onClick={async () => {
                        await handleSaveStep6();
                        onContinueToModuleF();
                      }}
                      className="w-full bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-700 sm:w-auto"
                    >
                      Save &amp; Continue to Module F (Co-Founder &amp; Team)
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conversion / Handoff CTA Bar into Module F (Matches Module A & B Dark Footer Bar 100%) */}
          {onContinueToModuleF && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-900 px-4 py-3.5 text-white">
              <div className="text-xs">
                <span className="font-semibold text-indigo-300">
                  Ready to align your founding team, roles &amp; hiring roadmap for {plan.title}?
                </span>{' '}
                Continue to Module F to map your 150-word promoter profiles, 7 Startup Hats role matrix, co-founder alignment survey, and 3-year job creation plan.
              </div>
              <Button
                type="button"
                size="sm"
                disabled={isVaultReadonly || isSavingStep6}
                onClick={async () => {
                  await handleSaveStep6();
                  onContinueToModuleF();
                }}
                className="shrink-0 bg-indigo-600 text-white hover:bg-indigo-500"
              >
                Continue to Module F: Co-Founder &amp; Team
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
