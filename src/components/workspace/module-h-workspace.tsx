'use client';

import React, { useState } from 'react';
import {
  Coins,
  TrendingUp,
  CreditCard,
  Building,
  Check,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  FileText,
  HelpCircle,
  Lightbulb,
  Sparkles,
  Layers,
  Repeat,
  ShoppingBag,
  Briefcase,
  Zap,
  Percent,
  Cpu,
  PenTool,
  Sliders,
  DollarSign,
  Info,
  Plus,
  Trash2,
  Target,
  Wand2,
  RefreshCw,
  ExternalLink,
  Edit3,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type {
  ActiveStartupPlan,
  RevenueModelStep1Data,
  RevenueModelVehicle,
  ProductOfferingStructure,
  PricingTierItem,
  PricingTiersStep2Data,
  BreakevenCalculatorStep3Data,
  BreakevenYearTarget,
  FrictionCostsStep3Data,
} from '@/lib/auth/session-store';
import {
  saveModuleHStep1RevenueModelAction,
  saveModuleHStep2PricingTiersAction,
  saveModuleHStep3BreakevenCalculatorAction,
  generatePricingStrategyJustificationAction,
  generateBreakevenAssessorNarrativeAction,
} from '@/app/actions/module-h';

interface ModuleHWorkspaceProps {
  plan: ActiveStartupPlan;
  selectedCountry?: string;
  isVaultReadonly?: boolean;
  onSaveStep1RevenueModel?: (step1Data: RevenueModelStep1Data, progress?: number) => Promise<void> | void;
  onSaveStep2PricingTiers?: (step2Data: PricingTiersStep2Data, progress?: number) => Promise<void> | void;
  onSaveStep3BreakevenCalculator?: (step3Data: BreakevenCalculatorStep3Data, progress?: number) => Promise<void> | void;
  onBackToModuleG?: () => void;
  onContinueToModuleI?: () => void;
  onNavigateToModule?: (
    moduleCode:
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
      | 'MOD_K_GRANTS_FUNDING'
      | 'MOD_L_BUSINESS_PLAN',
    targetStep?: number,
    highlightId?: string
  ) => void;
}

export function ModuleHWorkspace({
  plan,
  selectedCountry = 'IE',
  isVaultReadonly = false,
  onSaveStep1RevenueModel,
  onSaveStep2PricingTiers,
  onSaveStep3BreakevenCalculator,
  onBackToModuleG,
  onContinueToModuleI,
  onNavigateToModule,
}: ModuleHWorkspaceProps) {
  // Step expansion state: default to first incomplete step
  const [openStep, setOpenStep] = useState<number | 'ALL'>(() => {
    if (plan.moduleHData?.step3BreakevenCalculator?.yearTargets?.length) {
      return 3;
    }
    if (plan.moduleHData?.step2PricingTiers?.tiers?.length) {
      return 3;
    }
    if (plan.moduleHData?.step1RevenueModel?.revenueModelVehicle) {
      return 2;
    }
    return 1;
  });

  const [activeWhyCard, setActiveWhyCard] = useState<number | null>(null);
  const [activeExampleCard, setActiveExampleCard] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isGeneratingAiJustification, setIsGeneratingAiJustification] = useState(false);
  const [aiJustificationSuccess, setAiJustificationSuccess] = useState(false);
  const [aiAssessorTip, setAiAssessorTip] = useState<string | null>(null);
  const [isGeneratingAiBreakevenNarrative, setIsGeneratingAiBreakevenNarrative] = useState(false);
  const [aiBreakevenNarrativeSuccess, setAiBreakevenNarrativeSuccess] = useState(false);
  const [aiBreakevenAssessorTip, setAiBreakevenAssessorTip] = useState<string | null>(null);

  // Derive initial currency and vehicle from plan context
  const defaultCurrency =
    plan.baseCurrency || (selectedCountry === 'GB' ? 'GBP' : 'EUR');

  // Intelligent vehicle suggestion based on Module D track if available
  const moduleDTrack =
    plan.moduleDData?.productVehicle?.productTrack ||
    (plan.moduleDData as any)?.step1ProductVehicle?.productTrack;
  const suggestedVehicle: RevenueModelVehicle =
    moduleDTrack === 'PHYSICAL_PRODUCT_ECOM'
      ? 'ONE_OFF_TRANSACTION'
      : moduleDTrack === 'CONSULTING_AGENCY_SERVICE'
      ? 'SERVICE_PROJECT_HOURLY'
      : moduleDTrack === 'MARKETPLACE_PLATFORM'
      ? 'MARKETPLACE_COMMISSION'
      : moduleDTrack === 'HARDWARE_IOT'
      ? 'HARDWARE_PLUS_PLAN'
      : moduleDTrack === 'DEVELOPER_API_INFRA'
      ? 'USAGE_BASED_METERED'
      : 'SUBSCRIPTION_RECURRING';

  // Auto-pull channel and revenue split info from Module D Step 2
  const moduleDChannelMatrix = plan.moduleDData?.channelMatrix;
  const hasModuleDChannelData = Boolean(
    moduleDChannelMatrix?.primaryChannelSharePercent !== undefined ||
      moduleDChannelMatrix?.primaryChannel
  );

  // -------------------------------------------------------------
  // STEP 1 STATE
  // -------------------------------------------------------------
  const [step1Data, setStep1Data] = useState<RevenueModelStep1Data>(() => {
    const existing = plan.moduleHData?.step1RevenueModel;
    if (existing) return existing;

    return {
      revenueModelVehicle: suggestedVehicle,
      otherRevenueModelText: '',
      offeringStructure: 'SINGLE_OFFERING',
      valueMetric: 'per customer / subscription',
      billingCadenceDefault: 'MONTHLY',
      offeringRangeSummary: '',
      selectedCurrency: defaultCurrency,
    };
  });

  const currencySymbol =
    step1Data.selectedCurrency === 'GBP'
      ? '£'
      : step1Data.selectedCurrency === 'USD'
      ? '$'
      : '€';

  // -------------------------------------------------------------
  // STEP 2 STATE: PRICING ARCHITECTURE & TIERS
  // -------------------------------------------------------------
  const defaultVatRate = selectedCountry === 'GB' ? 20 : 23;

  const [step2Data, setStep2Data] = useState<PricingTiersStep2Data>(() => {
    const existing = plan.moduleHData?.step2PricingTiers;
    if (existing && existing.tiers?.length > 0) return existing;

    // Build intelligent starter tiers based on Step 1 offering structure
    if (step1Data.offeringStructure === 'MULTI_OFFERING_TIERS') {
      return {
        tiers: [
          {
            id: 'tier-1',
            name: 'Starter / Entry',
            targetPersona: 'Early adopter / casual user',
            priceGross: Math.round(29 * (1 + defaultVatRate / 100)),
            priceNetOfTax: 29,
            taxRatePercent: defaultVatRate,
            billingFrequency: 'MONTHLY',
            annualDiscountPercent: 20,
            salesMixPercent: 25,
            deliverablesSummary: 'Core essential features for individuals and small teams.',
            isRecommendedDefault: false,
          },
          {
            id: 'tier-2',
            name: 'Core / Flagship',
            targetPersona: 'Primary target customer',
            priceGross: Math.round(59 * (1 + defaultVatRate / 100)),
            priceNetOfTax: 59,
            taxRatePercent: defaultVatRate,
            billingFrequency: 'MONTHLY',
            annualDiscountPercent: 20,
            salesMixPercent: 60,
            deliverablesSummary: 'Complete flagship solution with prioritized support and full automation.',
            isRecommendedDefault: true,
          },
          {
            id: 'tier-3',
            name: 'Premium / Growth',
            targetPersona: 'High-volume or enterprise client',
            priceGross: Math.round(129 * (1 + defaultVatRate / 100)),
            priceNetOfTax: 129,
            taxRatePercent: defaultVatRate,
            billingFrequency: 'MONTHLY',
            annualDiscountPercent: 20,
            salesMixPercent: 15,
            deliverablesSummary: 'Full custom capabilities, dedicated account manager, and SLA.',
            isRecommendedDefault: false,
          },
        ],
        blendedAveragePriceNet: 62,
        pricingStrategyNotes: '',
      };
    }

    // Default Single Hero Product
    return {
      tiers: [
        {
          id: 'tier-hero',
          name: 'Flagship Core Product',
          targetPersona: 'Ideal beachhead customer',
          priceGross: Math.round(49 * (1 + defaultVatRate / 100)),
          priceNetOfTax: 49,
          taxRatePercent: defaultVatRate,
          billingFrequency: 'MONTHLY',
          annualDiscountPercent: 20,
          salesMixPercent: 100,
          deliverablesSummary: 'The signature core solution that solves the customer pain point completely.',
          isRecommendedDefault: true,
        },
      ],
      blendedAveragePriceNet: 49,
      pricingStrategyNotes: '',
    };
  });

  // Calculate blended average order value net of tax
  const calculateBlendedAverage = (tiers: PricingTierItem[]): number => {
    if (tiers.length === 0) return 0;
    const totalMix = tiers.reduce((sum, t) => sum + (Number(t.salesMixPercent) || 0), 0);
    if (totalMix === 0) return tiers[0].priceNetOfTax || 0;

    const weightedSum = tiers.reduce(
      (sum, t) => sum + (Number(t.priceNetOfTax) || 0) * (Number(t.salesMixPercent) || 0),
      0
    );
    return Math.round((weightedSum / totalMix) * 100) / 100;
  };

  const blendedAveragePrice = calculateBlendedAverage(step2Data.tiers);
  const totalSalesMixSum = step2Data.tiers.reduce(
    (sum, t) => sum + (Number(t.salesMixPercent) || 0),
    0
  );

  // Blended average gross sticker price (including VAT/tax) across tiers
  const calculateBlendedGrossAverage = (tiers: PricingTierItem[]): number => {
    if (tiers.length === 0) return 0;
    const totalMix = tiers.reduce((sum, t) => sum + (Number(t.salesMixPercent) || 0), 0);
    const getGrossForTier = (t: PricingTierItem) => {
      const taxRate = t.taxRatePercent ?? defaultVatRate;
      if (t.priceGross !== undefined && t.priceGross > 0) return t.priceGross;
      if (t.priceNetOfTax > 0) {
        return Math.round(t.priceNetOfTax * (1 + taxRate / 100) * 100) / 100;
      }
      return 0;
    };
    if (totalMix === 0) return getGrossForTier(tiers[0]);
    const weightedSum = tiers.reduce(
      (sum, t) => sum + getGrossForTier(t) * (Number(t.salesMixPercent) || 0),
      0
    );
    return Math.round((weightedSum / totalMix) * 100) / 100;
  };

  const blendedAverageGrossPrice = calculateBlendedGrossAverage(step2Data.tiers);
  const blendedEffectiveTaxRate =
    blendedAveragePrice > 0
      ? Math.round(((blendedAverageGrossPrice - blendedAveragePrice) / blendedAveragePrice) * 1000) / 10
      : defaultVatRate;

  // -------------------------------------------------------------
  // STEP 3 STATE: POCKET PROFIT & 3-YEAR BREAKEVEN ENGINE
  // -------------------------------------------------------------
  // 1. Auto-pull canonical payroll & survival budgets from Module F
  const modFData = plan.moduleFData;
  const modFStep3 = modFData?.step3SurvivalBudgetData;
  const modFStep5 = modFData?.step5HiringPlanData;

  const canonicalSurvivalMonthly = (() => {
    if (modFStep3?.founderBudgets?.length) {
      const total = modFStep3.founderBudgets.reduce((sum, b) => {
        const core =
          (Number(b.housingAndUtilities) || 0) +
          (Number(b.groceriesAndEssentials) || 0) +
          (Number(b.transportAndCommute) || 0) +
          (Number(b.debtAndLoanCommitments) || 0) +
          (Number(b.dependentsAndFamily) || 0);
        return sum + Math.max(0, core - (Number(b.incomeOffsetCushion) || 0));
      }, 0);
      if (total > 0) return Math.round(total);
    }
    return 2500;
  })();

  const canonicalHiringPayroll = (() => {
    let y1Annual = 0;
    let y2Annual = 0;
    let y3Annual = 0;
    if (modFStep5?.roles?.length) {
      for (const role of modFStep5.roles) {
        if (role.compensationModel === 'PURE_SWEAT_EQUITY' || role.compensationModel === 'ADVISORY_EQUITY') {
          continue;
        }
        const gross = Number(role.grossAnnualSalary) || 0;
        const employerTaxRate = selectedCountry === 'GB' ? 0.138 : 0.1105; // UK NIC vs IE PRSI
        const loaded = gross * (1 + employerTaxRate);
        if (role.yearScheduled <= 1) y1Annual += loaded;
        if (role.yearScheduled <= 2) y2Annual += loaded;
        if (role.yearScheduled <= 3) y3Annual += loaded;
      }
    }
    const c1 = Number(modFStep5?.contractorBudgetYear1) || 0;
    const c2 = Number(modFStep5?.contractorBudgetYear2) || 0;
    const c3 = Number(modFStep5?.contractorBudgetYear3) || 0;

    const y1Mo = Math.round((y1Annual + c1) / 12) || canonicalSurvivalMonthly;
    const y2Mo = Math.round((y2Annual + c2) / 12) || Math.round(y1Mo * 2.2);
    const y3Mo = Math.round((y3Annual + c3) / 12) || Math.round(y1Mo * 3.8);

    return { y1Mo, y2Mo, y3Mo, hasModFRoles: Boolean(modFStep5?.roles?.length) };
  })();

  // 2. Auto-pull channel fee % from Module D Step 2
  const defaultGatewayPercent =
    moduleDChannelMatrix?.estimatedBlendedFeePercent !== undefined
      ? Number(moduleDChannelMatrix.estimatedBlendedFeePercent)
      : 2.0;

  // 3. Auto-pull baseline monthly overheads from Module E (premises/equipment)
  const defaultFixedOverheads = (() => {
    const modEPremises = plan.moduleEData?.premisesAndEquipment;
    const rent = Number((modEPremises as any)?.monthlyRentOrFee) || 0;
    return rent > 0 ? rent + 250 : 350; // e.g., software stack, accounting, insurance baseline
  })();

  // Default direct variable cost per sale benchmark (10% of net price or €4 minimum)
  const defaultVariableCogs = Math.max(2, Math.round(blendedAveragePrice * 0.12 * 100) / 100);

  const [step3Data, setStep3Data] = useState<BreakevenCalculatorStep3Data>(() => {
    const existing = plan.moduleHData?.step3BreakevenCalculator;
    if (existing && existing.yearTargets?.length === 3) {
      return {
        paymentTerms: 'INSTANT_PAYMENT',
        exportSalesPercent: 30,
        exportFocusRegions: selectedCountry === 'IE' ? 'UK, EU, US' : 'EU, US, IE',
        ...existing,
        activePriceSlider: existing.activePriceSlider || blendedAveragePrice || 49,
      };
    }

    const initialPrice = blendedAveragePrice || 49;
    return {
      selectedSimulationYear: 1,
      activePriceSlider: initialPrice,
      activeCustomerSlider: 150,
      paymentTerms: 'INSTANT_PAYMENT',
      otherPaymentTermsText: '',
      exportSalesPercent: 30,
      exportFocusRegions: selectedCountry === 'IE' ? 'UK, EU, US' : 'EU, US, IE',
      frictionCosts: {
        paymentGatewayPercent: defaultGatewayPercent,
        paymentGatewayFixedCents: 25,
        directVariableCogsPerUnit: defaultVariableCogs,
        disputeRefundBufferPercent: 1,
        affiliateCommissionPercent: 0,
      },
      isSandboxActive: false,
      sandboxMonthlyPayrollOverride: undefined,
      sandboxNotes: '',
      yearTargets: [
        {
          yearNumber: 1,
          monthlyPayrollBaseline: canonicalHiringPayroll.y1Mo,
          otherFixedMonthlyOverheads: defaultFixedOverheads,
          customersNeededToBreakeven: 0,
          monthlyRevenueAtBreakeven: 0,
          monthlyPocketProfitAtTarget: 0,
        },
        {
          yearNumber: 2,
          monthlyPayrollBaseline: canonicalHiringPayroll.y2Mo,
          otherFixedMonthlyOverheads: Math.round(defaultFixedOverheads * 1.5),
          customersNeededToBreakeven: 0,
          monthlyRevenueAtBreakeven: 0,
          monthlyPocketProfitAtTarget: 0,
        },
        {
          yearNumber: 3,
          monthlyPayrollBaseline: canonicalHiringPayroll.y3Mo,
          otherFixedMonthlyOverheads: Math.round(defaultFixedOverheads * 2.2),
          customersNeededToBreakeven: 0,
          monthlyRevenueAtBreakeven: 0,
          monthlyPocketProfitAtTarget: 0,
        },
      ],
    };
  });

  // Live Breakeven & Pocket Profit Math
  const activeSimYear = step3Data.selectedSimulationYear || 1;
  const activeYearTargetObj =
    step3Data.yearTargets.find((y) => y.yearNumber === activeSimYear) ||
    step3Data.yearTargets[0];

  // Effective price being simulated (either slider override in sandbox or blendedAveragePrice)
  const simulatedNetPrice =
    step3Data.isSandboxActive && step3Data.activePriceSlider > 0
      ? step3Data.activePriceSlider
      : blendedAveragePrice || 49;

  // Effective VAT / Sales Tax per sale based on simulatedNetPrice
  const simulatedVatAmount =
    Math.round(simulatedNetPrice * (blendedEffectiveTaxRate / 100) * 100) / 100;
  const simulatedGrossStickerPrice =
    Math.round((simulatedNetPrice + simulatedVatAmount) * 100) / 100;

  // Per-sale friction deductions
  const gatewayFeeAmount =
    Math.round(
      (simulatedNetPrice * ((step3Data.frictionCosts.paymentGatewayPercent || 0) / 100) +
        (step3Data.frictionCosts.paymentGatewayFixedCents || 0) / 100) *
        100
    ) / 100;

  const refundAndAffiliateFeeAmount =
    Math.round(
      simulatedNetPrice *
        (((step3Data.frictionCosts.disputeRefundBufferPercent || 0) +
          (step3Data.frictionCosts.affiliateCommissionPercent || 0)) /
          100) *
        100
    ) / 100;

  const directCogsAmount = Number(step3Data.frictionCosts.directVariableCogsPerUnit) || 0;
  const totalFrictionPerSale =
    Math.round((gatewayFeeAmount + refundAndAffiliateFeeAmount + directCogsAmount) * 100) / 100;

  // Pocket profit (Contribution Margin) per sale
  const pocketProfitPerSale = Math.max(
    0,
    Math.round((simulatedNetPrice - totalFrictionPerSale) * 100) / 100
  );
  const contributionMarginPercent =
    simulatedNetPrice > 0 ? Math.round((pocketProfitPerSale / simulatedNetPrice) * 100) : 0;

  // Monthly Fixed Costs for selected year
  const activeMonthlyPayroll =
    step3Data.isSandboxActive && step3Data.sandboxMonthlyPayrollOverride !== undefined
      ? step3Data.sandboxMonthlyPayrollOverride
      : activeYearTargetObj.monthlyPayrollBaseline;
  const activeMonthlyOverheads = activeYearTargetObj.otherFixedMonthlyOverheads || 0;
  const totalMonthlyFixedNut = activeMonthlyPayroll + activeMonthlyOverheads;

  // Breakeven Customer / Sale Count for selected year
  const customersNeededToBreakeven =
    pocketProfitPerSale > 0 ? Math.ceil(totalMonthlyFixedNut / pocketProfitPerSale) : 9999;
  const dailySalesNeededToBreakeven = Math.max(
    0.1,
    Math.round((customersNeededToBreakeven / 30) * 10) / 10
  );
  const monthlyRevenueAtBreakeven = Math.round(customersNeededToBreakeven * simulatedNetPrice);

  // Simulated Monthly Outcome at `activeCustomerSlider`
  const simulatedMonthlyCustomers = step3Data.activeCustomerSlider || customersNeededToBreakeven;
  const simulatedMonthlyNetRevenue = Math.round(simulatedMonthlyCustomers * simulatedNetPrice);
  const simulatedTotalPocketContribution = Math.round(
    simulatedMonthlyCustomers * pocketProfitPerSale
  );
  const simulatedMonthlyNetSurplusOrLoss =
    simulatedTotalPocketContribution - totalMonthlyFixedNut;

  // Compute all 3 years summary dynamically so yearTargets is always accurate when saved
  const computedThreeYearTargets: BreakevenYearTarget[] = ([1, 2, 3] as const).map((yr) => {
    const existingYr = step3Data.yearTargets.find((y) => y.yearNumber === yr);
    const payroll =
      yr === activeSimYear &&
      step3Data.isSandboxActive &&
      step3Data.sandboxMonthlyPayrollOverride !== undefined
        ? step3Data.sandboxMonthlyPayrollOverride
        : existingYr?.monthlyPayrollBaseline ??
          (yr === 1
            ? canonicalHiringPayroll.y1Mo
            : yr === 2
            ? canonicalHiringPayroll.y2Mo
            : canonicalHiringPayroll.y3Mo);
    const overheads = existingYr?.otherFixedMonthlyOverheads ?? defaultFixedOverheads * yr;
    const totalFixed = payroll + overheads;
    const custBreakeven =
      pocketProfitPerSale > 0 ? Math.ceil(totalFixed / pocketProfitPerSale) : 0;
    const revBreakeven = Math.round(custBreakeven * simulatedNetPrice);
    const targetCust = Math.max(custBreakeven, Math.round(custBreakeven * 1.25));
    const pocketProfitAtTarget = Math.round(
      targetCust * pocketProfitPerSale - totalFixed
    );

    return {
      yearNumber: yr,
      monthlyPayrollBaseline: payroll,
      otherFixedMonthlyOverheads: overheads,
      customersNeededToBreakeven: custBreakeven,
      monthlyRevenueAtBreakeven: revBreakeven,
      monthlyPocketProfitAtTarget: pocketProfitAtTarget,
    };
  });

  // Revenue vehicle options formatted with plain-English clarity
  const REVENUE_VEHICLE_OPTIONS: Array<{
    id: RevenueModelVehicle;
    title: string;
    description: string;
    example: string;
    icon: React.ElementType;
    isSuggested?: boolean;
  }> = [
    {
      id: 'SUBSCRIPTION_RECURRING',
      title: 'Monthly or Annual Subscription',
      description: 'Customers pay a recurring regular fee to keep access or service.',
      example: 'e.g. Netflix, Spotify, software apps, gym memberships, club fees',
      icon: Repeat,
      isSuggested: suggestedVehicle === 'SUBSCRIPTION_RECURRING',
    },
    {
      id: 'ONE_OFF_TRANSACTION',
      title: 'One-Off Order or Purchase',
      description: 'Customer pays once for a physical product, digital item, or order.',
      example: 'e.g. Online store checkout, crafted goods, food/drink, books, hardware',
      icon: ShoppingBag,
      isSuggested: suggestedVehicle === 'ONE_OFF_TRANSACTION',
    },
    {
      id: 'SERVICE_PROJECT_HOURLY',
      title: 'Service, Project or Retainer',
      description: 'Clients pay for your time, deliverables, fixed scope, or monthly retainer.',
      example: 'e.g. Design agency, software consultancy, coaching, legal, trades',
      icon: Briefcase,
      isSuggested: suggestedVehicle === 'SERVICE_PROJECT_HOURLY',
    },
    {
      id: 'USAGE_BASED_METERED',
      title: 'Pay As You Go / Usage Metered',
      description: 'Customers pay based on how much they actually consume or use.',
      example: 'e.g. Cloud API credits, electricity, storage gigabytes, delivery miles',
      icon: Zap,
      isSuggested: suggestedVehicle === 'USAGE_BASED_METERED',
    },
    {
      id: 'MARKETPLACE_COMMISSION',
      title: 'Marketplace or Booking Commission',
      description: 'You take a percentage cut (or flat fee) on transactions between buyers & sellers.',
      example: 'e.g. Airbnb (3-15%), Uber, Etsy fees, ticket booking portals',
      icon: Percent,
      isSuggested: suggestedVehicle === 'MARKETPLACE_COMMISSION',
    },
    {
      id: 'HARDWARE_PLUS_PLAN',
      title: 'Hardware Device + Ongoing Service',
      description: 'Upfront device fee combined with an ongoing monthly membership.',
      example: 'e.g. Peloton bike + subscription, IoT sensors + dashboard',
      icon: Cpu,
      isSuggested: suggestedVehicle === 'HARDWARE_PLUS_PLAN',
    },
    {
      id: 'OTHER',
      title: 'Other Custom Model',
      description: 'A hybrid model or specific custom arrangement that does not fit neatly above.',
      example: 'e.g. Licensing IP, affiliate revenue, sponsorship, revenue-share',
      icon: PenTool,
    },
  ];

  const VALUE_METRIC_SUGGESTIONS: Record<RevenueModelVehicle, string[]> = {
    SUBSCRIPTION_RECURRING: [
      'per active user / seat / month',
      'per flat organization / month',
      'per household / month',
    ],
    ONE_OFF_TRANSACTION: [
      'per physical box / product shipped',
      'per digital download order',
      'per curated gift bundle',
    ],
    SERVICE_PROJECT_HOURLY: [
      'per client project delivery',
      'per monthly advisory retainer',
      'per day rate / hourly block',
    ],
    USAGE_BASED_METERED: [
      'per 1,000 API requests / tokens',
      'per gigabyte / hour processed',
      'per delivery completed',
    ],
    MARKETPLACE_COMMISSION: [
      '10% take-rate per completed booking',
      '5% platform fee on seller payout',
      '€1.50 flat fee per ticket sold',
    ],
    HARDWARE_PLUS_PLAN: [
      '€199 device upfront + €29/mo app fee',
      'per installed unit + telemetry support',
    ],
    OTHER: ['per custom agreement'],
  };

  // Completion states
  const isStep1Complete =
    Boolean(step1Data.revenueModelVehicle) &&
    (step1Data.revenueModelVehicle !== 'OTHER' ||
      Boolean(step1Data.otherRevenueModelText?.trim())) &&
    Boolean(step1Data.valueMetric.trim());

  const isStep2Complete =
    step2Data.tiers.length > 0 &&
    step2Data.tiers.every((t) => t.name.trim().length > 0 && t.priceNetOfTax > 0) &&
    (step1Data.offeringStructure === 'SINGLE_OFFERING' || Math.abs(totalSalesMixSum - 100) <= 2);

  const isStep3Complete =
    pocketProfitPerSale > 0 &&
    totalMonthlyFixedNut > 0 &&
    customersNeededToBreakeven > 0 &&
    customersNeededToBreakeven < 9999;

  // Save Step 1 handler
  const handleSaveStep1 = async () => {
    if (isVaultReadonly) return;
    setSaveStatus('saving');
    try {
      if (onSaveStep1RevenueModel) {
        await onSaveStep1RevenueModel(step1Data, isStep1Complete ? 20 : 10);
      }
      const res = await saveModuleHStep1RevenueModelAction({
        planId: plan.id,
        revenueModel: step1Data,
        completionPercentage: isStep1Complete ? 20 : 10,
      });
      if (res.ok) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
      } else {
        setSaveStatus('error');
      }
    } catch {
      setSaveStatus('error');
    }
  };

  // Save Step 2 handler
  const handleSaveStep2 = async () => {
    if (isVaultReadonly) return;
    setSaveStatus('saving');
    try {
      const updatedStep2: PricingTiersStep2Data = {
        ...step2Data,
        blendedAveragePriceNet: blendedAveragePrice,
      };
      if (onSaveStep2PricingTiers) {
        await onSaveStep2PricingTiers(updatedStep2, isStep2Complete ? 40 : 25);
      }
      const res = await saveModuleHStep2PricingTiersAction({
        planId: plan.id,
        pricingTiers: updatedStep2,
        completionPercentage: isStep2Complete ? 40 : 25,
      });
      if (res.ok) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
      } else {
        setSaveStatus('error');
      }
    } catch {
      setSaveStatus('error');
    }
  };

  // Save Step 3 handler
  const handleSaveStep3 = async () => {
    if (isVaultReadonly) return;
    setSaveStatus('saving');
    try {
      const updatedStep3: BreakevenCalculatorStep3Data = {
        ...step3Data,
        yearTargets: computedThreeYearTargets,
      };
      if (onSaveStep3BreakevenCalculator) {
        await onSaveStep3BreakevenCalculator(updatedStep3, isStep3Complete ? 65 : 50);
      }
      const res = await saveModuleHStep3BreakevenCalculatorAction({
        planId: plan.id,
        breakevenCalculator: updatedStep3,
        completionPercentage: isStep3Complete ? 65 : 50,
      });
      if (res.ok) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
      } else {
        setSaveStatus('error');
      }
    } catch {
      setSaveStatus('error');
    }
  };

  // Reset Step 3 to default numbers pulled from across modules (Step 2, Mod D, Mod E, Mod F)
  const handleResetStep3ToModuleDefaults = () => {
    const baseNetPrice = blendedAveragePrice || 49;
    const benchCogs = Math.max(2, Math.round(baseNetPrice * 0.12 * 100) / 100);
    const estGatewayFee =
      Math.round(
        (baseNetPrice * (defaultGatewayPercent / 100) + 0.25) * 100
      ) / 100;
    const estRefund = Math.round(baseNetPrice * 0.01 * 100) / 100;
    const estPocket = Math.max(
      1,
      Math.round((baseNetPrice - estGatewayFee - benchCogs - estRefund) * 100) / 100
    );
    const y1TotalNut = canonicalHiringPayroll.y1Mo + defaultFixedOverheads;
    const y1BreakevenCust = Math.ceil(y1TotalNut / estPocket);

    setStep3Data((prev) => ({
      ...prev,
      isSandboxActive: false,
      activePriceSlider: baseNetPrice,
      activeCustomerSlider: Math.max(y1BreakevenCust, Math.round(y1BreakevenCust * 1.2)),
      sandboxMonthlyPayrollOverride: undefined,
      sandboxNotes: '',
      frictionCosts: {
        paymentGatewayPercent: defaultGatewayPercent,
        paymentGatewayFixedCents: 25,
        directVariableCogsPerUnit: benchCogs,
        disputeRefundBufferPercent: 1,
        affiliateCommissionPercent: 0,
      },
      yearTargets: [
        {
          yearNumber: 1,
          monthlyPayrollBaseline: canonicalHiringPayroll.y1Mo,
          otherFixedMonthlyOverheads: defaultFixedOverheads,
          customersNeededToBreakeven: 0,
          monthlyRevenueAtBreakeven: 0,
          monthlyPocketProfitAtTarget: 0,
        },
        {
          yearNumber: 2,
          monthlyPayrollBaseline: canonicalHiringPayroll.y2Mo,
          otherFixedMonthlyOverheads: Math.round(defaultFixedOverheads * 1.5),
          customersNeededToBreakeven: 0,
          monthlyRevenueAtBreakeven: 0,
          monthlyPocketProfitAtTarget: 0,
        },
        {
          yearNumber: 3,
          monthlyPayrollBaseline: canonicalHiringPayroll.y3Mo,
          otherFixedMonthlyOverheads: Math.round(defaultFixedOverheads * 2.2),
          customersNeededToBreakeven: 0,
          monthlyRevenueAtBreakeven: 0,
          monthlyPocketProfitAtTarget: 0,
        },
      ],
    }));
  };

  // Tier management helpers
  const handleAddTier = () => {
    if (step2Data.tiers.length >= 4) return;
    const defaultNet = 79;
    const newTier: PricingTierItem = {
      id: `tier-${Date.now()}`,
      name: `Option ${step2Data.tiers.length + 1}`,
      targetPersona: 'Target segment',
      priceGross: Math.round(defaultNet * (1 + defaultVatRate / 100)),
      priceNetOfTax: defaultNet,
      taxRatePercent: defaultVatRate,
      billingFrequency: 'MONTHLY',
      annualDiscountPercent: 20,
      salesMixPercent: 10,
      deliverablesSummary: 'Included deliverables and benefits.',
      isRecommendedDefault: false,
    };
    setStep2Data((prev) => ({
      ...prev,
      tiers: [...prev.tiers, newTier],
    }));
  };

  const handleRemoveTier = (id: string) => {
    if (step2Data.tiers.length <= 1) return;
    setStep2Data((prev) => ({
      ...prev,
      tiers: prev.tiers.filter((t) => t.id !== id),
    }));
  };

  const handleUpdateTier = (id: string, updates: Partial<PricingTierItem>) => {
    setStep2Data((prev) => ({
      ...prev,
      tiers: prev.tiers.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  };

  const handleGenerateAiPricingJustification = async () => {
    if (isGeneratingAiJustification || isVaultReadonly) return;
    setIsGeneratingAiJustification(true);
    setAiJustificationSuccess(false);

    try {
      const tiersSummary = step2Data.tiers
        .map(
          (t) =>
            `${t.name} (${currencySymbol}${t.priceNetOfTax} net, ${t.salesMixPercent}% mix: ${t.deliverablesSummary || 'Core features'})`
        )
        .join('; ');

      const res = await generatePricingStrategyJustificationAction({
        planId: plan.id,
        blendedAveragePrice,
        currencySymbol,
        revenueModelVehicle: step1Data.revenueModelVehicle,
        tiersSummary,
        planTitle: plan.title,
        industryCategory: plan.industryCategory,
        hqCountryCode: (plan.hqCountryCode as any) || (selectedCountry as any) || 'IE',
        beachheadCustomer:
          plan.moduleBData?.beachhead?.beachheadSegment ||
          plan.moduleBData?.beachhead?.decisionMakerRole ||
          '',
        unfairAdvantage:
          plan.conceptCanvas?.unfairAdvantage ||
          plan.brainDumpText ||
          '',
      });

      if (res && res.pricingStrategyNotes) {
        setStep2Data((prev) => ({
          ...prev,
          pricingStrategyNotes: res.pricingStrategyNotes,
        }));
        if (res.assessorTip) {
          setAiAssessorTip(res.assessorTip);
        }
        setAiJustificationSuccess(true);
        setTimeout(() => setAiJustificationSuccess(false), 5000);
      }
    } catch (e) {
      console.error('Error generating AI pricing justification:', e);
    } finally {
      setIsGeneratingAiJustification(false);
    }
  };

  const buildClientBreakevenFallback = () => {
    const isIE = selectedCountry !== 'GB';
    const sym = currencySymbol;
    const price = simulatedNetPrice || 49;
    const profit = pocketProfitPerSale || 42;
    const margin = contributionMarginPercent || 85;
    const fixed = activeMonthlyOverheads || 1500;
    const survival = activeMonthlyPayroll || 2500;
    const totalBurn = fixed + survival;
    const breakeven = customersNeededToBreakeven || 100;
    const terms = step3Data.paymentTerms || 'INSTANT_PAYMENT';
    const buffer =
      terms === 'NET_60_DAYS'
        ? Math.round(totalBurn * 2.5)
        : terms === 'NET_30_DAYS'
        ? Math.round(totalBurn * 1.5)
        : 0;
    const exportPct = step3Data.exportSalesPercent ?? 30;
    const exportDest =
      step3Data.exportFocusRegions ||
      (isIE ? 'UK, EU & North America' : 'EU, US & International');

    const termsLabel =
      terms === 'NET_60_DAYS'
        ? 'Net 60 Days invoicing'
        : terms === 'NET_30_DAYS'
        ? 'Net 30 Days invoicing'
        : terms === 'NET_14_DAYS'
        ? 'Net 14 Days terms'
        : terms === 'OTHER'
        ? 'custom commercial settlement terms'
        : 'instant digital checkout / card payment (zero debtor delay)';

    const agencyName = isIE ? 'LEO / Enterprise Ireland' : 'Innovate UK / British Business Bank';

    const p1 = `Operating Viability & Breakeven Threshold: ${plan.title || 'The venture'} maintains a baseline monthly fixed operational commitment of ${sym}${fixed.toLocaleString()}/month and a founder living survival allocation of ${sym}${survival.toLocaleString()}/month, representing a total fixed break-even threshold of ${sym}${totalBurn.toLocaleString()}/month. At a blended net unit price of ${sym}${price.toLocaleString()} delivering ${sym}${profit.toLocaleString()} in net pocket contribution (${margin}% pocket margin after direct cost of goods, transaction fees, and fulfilment overheads), full commercial cash-flow breakeven is attained at exactly ${breakeven.toLocaleString()} active sales/subscribers per month.`;

    const p2 = `Working Capital & Receivables Management: Revenue collection is structured under ${termsLabel}.${
      buffer > 0
        ? ` To protect ongoing solvency against debtor collection lags, the venture incorporates an explicit working capital buffer of ${sym}${buffer.toLocaleString()} (${terms === 'NET_60_DAYS' ? '2.5×' : '1.5×'} monthly fixed expenditure) funded prior to invoice settlement.`
        : ' Immediate funds capture minimizes cash conversion latency and eliminates debtor realization risk during early operations.'
    }`;

    const p3 = `Export Orientation & Economic Additionality: The commercial model projects ${exportPct}% of revenue derived from international markets (${exportDest}), satisfying ${agencyName} eligibility criteria for tradeable services/products with minimal domestic market displacement and substantial regional economic value-add.`;

    return `${p1}\n\n${p2}\n\n${p3}`;
  };

  const handleGenerateAiBreakevenNarrative = async () => {
    if (isGeneratingAiBreakevenNarrative || isVaultReadonly) return;
    setIsGeneratingAiBreakevenNarrative(true);
    setAiBreakevenNarrativeSuccess(false);

    try {
      const workingCapitalBuffer =
        step3Data.paymentTerms === 'NET_60_DAYS'
          ? Math.round(totalMonthlyFixedNut * 2.5)
          : step3Data.paymentTerms === 'NET_30_DAYS'
          ? Math.round(totalMonthlyFixedNut * 1.5)
          : 0;

      const res = await generateBreakevenAssessorNarrativeAction({
        planId: plan.id,
        currencySymbol,
        blendedAveragePrice: simulatedNetPrice,
        pocketProfit: pocketProfitPerSale,
        pocketProfitMarginPercent: contributionMarginPercent,
        monthlyFixedOverhead: activeMonthlyOverheads,
        survivalMonthlyBudget: activeMonthlyPayroll,
        targetMonthlyBreakevenCustomers: customersNeededToBreakeven,
        paymentTerms: step3Data.paymentTerms || 'INSTANT_PAYMENT',
        workingCapitalBuffer,
        exportSalesPercent: step3Data.exportSalesPercent ?? 30,
        exportFocusRegions: step3Data.exportFocusRegions || '',
        planTitle: plan.title,
        industryCategory: plan.industryCategory,
        hqCountryCode: (plan.hqCountryCode as any) || (selectedCountry as any) || 'IE',
        beachheadCustomer:
          plan.moduleBData?.beachhead?.beachheadSegment ||
          plan.moduleBData?.beachhead?.decisionMakerRole ||
          '',
        unfairAdvantage:
          plan.conceptCanvas?.unfairAdvantage ||
          plan.brainDumpText ||
          '',
      });

      if (res && res.narrative && res.narrative.trim()) {
        setStep3Data((prev) => ({
          ...prev,
          breakevenNarrative: res.narrative,
        }));
        if (res.assessorTip) {
          setAiBreakevenAssessorTip(res.assessorTip);
        }
        setAiBreakevenNarrativeSuccess(true);
        setTimeout(() => setAiBreakevenNarrativeSuccess(false), 5000);
      } else {
        const fallbackText = buildClientBreakevenFallback();
        setStep3Data((prev) => ({
          ...prev,
          breakevenNarrative: fallbackText,
        }));
        setAiBreakevenAssessorTip(
          selectedCountry === 'GB'
            ? 'Innovate UK and Start Up Loans assessors look closely for evidence that your breakeven unit volumes are realistic given your sales cycle and working capital runway.'
            : 'LEO evaluation committees prioritize your ability to explain how you survive month-to-month until the debtor cash actually clears your Irish bank account.'
        );
        setAiBreakevenNarrativeSuccess(true);
        setTimeout(() => setAiBreakevenNarrativeSuccess(false), 5000);
      }
    } catch (e) {
      console.error('Error generating AI breakeven narrative:', e);
      const fallbackText = buildClientBreakevenFallback();
      setStep3Data((prev) => ({
        ...prev,
        breakevenNarrative: fallbackText,
      }));
      setAiBreakevenAssessorTip(
        selectedCountry === 'GB'
          ? 'Innovate UK and Start Up Loans assessors look closely for evidence that your breakeven unit volumes are realistic given your sales cycle and working capital runway.'
          : 'LEO evaluation committees prioritize your ability to explain how you survive month-to-month until the debtor cash actually clears your Irish bank account.'
      );
      setAiBreakevenNarrativeSuccess(true);
      setTimeout(() => setAiBreakevenNarrativeSuccess(false), 5000);
    } finally {
      setIsGeneratingAiBreakevenNarrative(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* TOP HEADER MODULE CARD                                        */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-2xl border border-indigo-700/20 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-md">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-indigo-500/20 text-indigo-200 border-indigo-400/30 text-xs font-semibold">
                Module H: Revenue &amp; Pricing
              </Badge>
              <Badge className="bg-emerald-500/20 text-emerald-200 border-emerald-400/30 text-[10px]">
                3-Year Breakeven &amp; Pocket Profit
              </Badge>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Pricing Architect &amp; Pocket Profit Engine
            </h1>
            <p className="max-w-2xl text-xs text-indigo-100/90 sm:text-sm">
              How you get paid, what your profit looks like after Stripe fees and product costs,
              and exactly how many sales you need to pay yourself and your team each year.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setOpenStep(openStep === 'ALL' ? 1 : 'ALL')}
              className="border-indigo-400/30 bg-indigo-900/40 text-xs text-indigo-100 hover:bg-indigo-800/60"
            >
              <Sliders className="mr-1.5 h-3.5 w-3.5" />
              {openStep === 'ALL' ? 'Focus Step-by-Step' : 'Expand All Steps'}
            </Button>
          </div>
        </div>

        {/* Step Navigation Strip */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-5 gap-2 border-t border-indigo-800/40 pt-4 text-xs">
          <button
            type="button"
            onClick={() => setOpenStep(1)}
            className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors ${
              openStep === 1 || openStep === 'ALL'
                ? 'bg-indigo-500/30 text-white font-semibold'
                : 'text-indigo-200 hover:bg-indigo-900/40'
            }`}
          >
            <div
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                isStep1Complete ? 'bg-emerald-500 text-white' : 'bg-indigo-400 text-slate-900'
              }`}
            >
              {isStep1Complete ? <Check className="h-3 w-3" /> : '1'}
            </div>
            <span className="truncate">1. Revenue Model</span>
          </button>

          <button
            type="button"
            onClick={() => setOpenStep(2)}
            className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors ${
              openStep === 2 || openStep === 'ALL'
                ? 'bg-indigo-500/30 text-white font-semibold'
                : 'text-indigo-200 hover:bg-indigo-900/40'
            }`}
          >
            <div
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                isStep2Complete
                  ? 'bg-emerald-500 text-white'
                  : isStep1Complete
                  ? 'bg-indigo-400 text-slate-900'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {isStep2Complete ? <Check className="h-3 w-3" /> : '2'}
            </div>
            <span className="truncate">2. Pricing Tiers</span>
          </button>

          <button
            type="button"
            onClick={() => setOpenStep(3)}
            className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors ${
              openStep === 3 || openStep === 'ALL'
                ? 'bg-indigo-500/30 text-white font-semibold'
                : 'text-indigo-200 hover:bg-indigo-900/40'
            }`}
          >
            <div
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                isStep3Complete
                  ? 'bg-emerald-500 text-white'
                  : isStep2Complete
                  ? 'bg-indigo-400 text-slate-900'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {isStep3Complete ? <Check className="h-3 w-3" /> : '3'}
            </div>
            <span className="truncate">3. Breakeven Engine</span>
          </button>

          <button
            type="button"
            onClick={() => setOpenStep(4)}
            className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors ${
              openStep === 4
                ? 'bg-indigo-500/30 text-white font-semibold'
                : 'text-indigo-200 hover:bg-indigo-900/40 opacity-70'
            }`}
          >
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[10px] text-slate-400">
              4
            </div>
            <span className="truncate">4. Sales Velocity</span>
          </button>

          <button
            type="button"
            onClick={() => setOpenStep(5)}
            className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors ${
              openStep === 5
                ? 'bg-indigo-500/30 text-white font-semibold'
                : 'text-indigo-200 hover:bg-indigo-900/40 opacity-70'
            }`}
          >
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[10px] text-slate-400">
              5
            </div>
            <span className="truncate">5. Revenue Brief</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* STEP 1: REVENUE MODEL & WHAT YOU CHARGE FOR                   */}
      {/* ------------------------------------------------------------- */}
      {openStep !== 'ALL' && openStep !== 1 ? (
        // COLLAPSED STEP 1
        <div
          onClick={() => setOpenStep(1)}
          className="group scroll-mt-24 cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  isStep1Complete ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
                }`}
              >
                {isStep1Complete ? <Check className="h-4 w-4" /> : '1'}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                  Step 1: Revenue Model &amp; What You Charge For
                </h2>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {step1Data.revenueModelVehicle === 'OTHER'
                    ? step1Data.otherRevenueModelText || 'Custom Model'
                    : REVENUE_VEHICLE_OPTIONS.find((o) => o.id === step1Data.revenueModelVehicle)
                        ?.title || 'Choose your revenue model'}{' '}
                  • Charged {step1Data.valueMetric || 'per customer'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Badge
                variant={isStep1Complete ? 'default' : 'outline'}
                className={`text-[10px] shrink-0 ${
                  isStep1Complete
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'border-slate-300 text-slate-600'
                }`}
              >
                {isStep1Complete ? 'Completed' : 'In Progress'}
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 shrink-0 px-2.5 text-xs font-medium text-indigo-600 group-hover:bg-indigo-50"
              >
                Edit Step
                <ChevronDown className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // EXPANDED STEP 1
        <Card className="rounded-xl border border-slate-200 bg-white shadow-xs">
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    isStep1Complete ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
                  }`}
                >
                  {isStep1Complete ? <Check className="h-4 w-4" /> : '1'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-bold text-slate-900">
                      Step 1: How You Make Money (Revenue Model)
                    </CardTitle>
                    <Badge
                      variant={isStep1Complete ? 'default' : 'outline'}
                      className={`text-[10px] shrink-0 ${
                        isStep1Complete
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'border-slate-300 text-slate-600'
                      }`}
                    >
                      {isStep1Complete ? 'Ready' : 'In Progress'}
                    </Badge>
                  </div>
                  <CardDescription className="mt-1 text-xs text-slate-600">
                    How cash flows into your bank account. Choose the main way you charge customers.
                  </CardDescription>
                </div>
              </div>

              {openStep !== 'ALL' && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setOpenStep(0)}
                  className="text-xs text-slate-500 hover:bg-slate-100"
                >
                  Collapse Step
                  <ChevronUp className="ml-1 h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {/* Micro-Coaching Strip */}
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setActiveWhyCard(activeWhyCard === 1 ? null : 1)}
                className="flex items-center gap-1 text-[11px] font-semibold text-indigo-700 hover:text-indigo-900"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                <span>Why Are We Asking This?</span>
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={() => setActiveExampleCard(activeExampleCard === 1 ? null : 1)}
                className="flex items-center gap-1 text-[11px] font-semibold text-indigo-700 hover:text-indigo-900"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Show Me an Example</span>
              </button>
            </div>

            {activeWhyCard === 1 && (
              <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 text-xs text-indigo-950 space-y-1.5">
                <div className="font-bold text-indigo-900">
                  Why Grant Officers &amp; Banks Need This First:
                </div>
                <p className="text-indigo-900/90 leading-relaxed">
                  Every financial forecast depends on how you charge. A subscription business has
                  predictable monthly recurring cashflow, while an ecommerce or agency business
                  relies on repeat orders or continuous client acquisition. Setting this right ensures
                  the Breakeven Engine in Step 3 applies the exact right fee and salary formulas.
                </p>
              </div>
            )}

            {activeExampleCard === 1 && (
              <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-950 space-y-1.5">
                <div className="font-bold text-emerald-900">
                  Real-World Revenue Model Examples:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 text-[11px]">
                  <div className="rounded-lg bg-white p-2.5 border border-emerald-200">
                    <strong className="text-slate-900">SaaS / App</strong>
                    <p className="mt-1 text-slate-600">
                      €39/month per organization, billed annually with a 2-month free discount.
                    </p>
                  </div>
                  <div className="rounded-lg bg-white p-2.5 border border-emerald-200">
                    <strong className="text-slate-900">Physical Craft / Food</strong>
                    <p className="mt-1 text-slate-600">
                      €45 per flagship product box + optional €15 seasonal refill refills.
                    </p>
                  </div>
                  <div className="rounded-lg bg-white p-2.5 border border-emerald-200">
                    <strong className="text-slate-900">Service / Agency</strong>
                    <p className="mt-1 text-slate-600">
                      €1,500/month ongoing retainer for 15 hours of design and marketing execution.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* 1. SELECT REVENUE VEHICLE TILES */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  1. How do customers pay you?
                </Label>
                <span className="text-[11px] text-slate-400">Select one primary model</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {REVENUE_VEHICLE_OPTIONS.map((opt) => {
                  const isSelected = step1Data.revenueModelVehicle === opt.id;
                  const Icon = opt.icon;

                  return (
                    <div
                      key={opt.id}
                      onClick={() =>
                        setStep1Data((prev) => ({
                          ...prev,
                          revenueModelVehicle: opt.id,
                        }))
                      }
                      className={`relative cursor-pointer rounded-xl border p-3.5 transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-xs font-bold text-slate-900">{opt.title}</h3>
                            {opt.isSuggested && (
                              <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[9px] px-1 py-0">
                                Suggested
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">
                            {opt.description}
                          </p>
                          <p className="mt-1 text-[10px] text-slate-400 italic">{opt.example}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {step1Data.revenueModelVehicle === 'OTHER' && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3.5 space-y-2 mt-2">
                  <Label className="text-xs font-semibold text-indigo-900">
                    Describe your custom revenue model:
                  </Label>
                  <Input
                    value={step1Data.otherRevenueModelText || ''}
                    onChange={(e) =>
                      setStep1Data((prev) => ({
                        ...prev,
                        otherRevenueModelText: e.target.value,
                      }))
                    }
                    placeholder="e.g. Free hardware with a 15% transaction fee on client processing"
                    className="text-base sm:text-xs bg-white"
                  />
                </div>
              )}
            </div>

            {/* 2. OFFERING STRUCTURE: SINGLE VS MULTI-OFFERING */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    2. Single Hero Product vs. Multiple Offerings / Tiers
                  </Label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Are you starting with one signature product, or offering 2–3 tiers or SKUs?
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() =>
                    setStep1Data((prev) => ({
                      ...prev,
                      offeringStructure: 'SINGLE_OFFERING',
                    }))
                  }
                  className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                    step1Data.offeringStructure === 'SINGLE_OFFERING'
                      ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                        step1Data.offeringStructure === 'SINGLE_OFFERING'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Coins className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Single Hero Product or Service
                      </h4>
                      <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">
                        One simple, flagship offer. Easiest to market, explain, and fulfill when
                        launching.
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() =>
                    setStep1Data((prev) => ({
                      ...prev,
                      offeringStructure: 'MULTI_OFFERING_TIERS',
                    }))
                  }
                  className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                    step1Data.offeringStructure === 'MULTI_OFFERING_TIERS'
                      ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                        step1Data.offeringStructure === 'MULTI_OFFERING_TIERS'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Layers className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        2 to 3 Offerings, Tiers or Bundles
                      </h4>
                      <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">
                        e.g. Starter vs. Pro vs. Enterprise, or Flagship Item + Gift Bundle.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. WHAT EXACTLY ARE YOU CHARGING FOR (VALUE METRIC) */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    3. What unit or action does the customer pay for?
                  </Label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    The core unit of sale that drives your pricing (e.g. per user, per box, per hour).
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Input
                  value={step1Data.valueMetric}
                  onChange={(e) =>
                    setStep1Data((prev) => ({
                      ...prev,
                      valueMetric: e.target.value,
                    }))
                  }
                  placeholder="e.g. per active user per month, per physical box shipped"
                  className="text-base sm:text-xs"
                />

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 font-medium">Quick suggestions:</span>
                  {(
                    VALUE_METRIC_SUGGESTIONS[step1Data.revenueModelVehicle] ||
                    VALUE_METRIC_SUGGESTIONS.SUBSCRIPTION_RECURRING
                  ).map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() =>
                        setStep1Data((prev) => ({
                          ...prev,
                          valueMetric: sug,
                        }))
                      }
                      className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. BASE CURRENCY CONFIRMATION */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white border border-slate-200 font-bold text-xs text-slate-700">
                    {currencySymbol}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">
                      Pricing Currency: {step1Data.selectedCurrency}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      All calculations, breakeven targets, and grant tables will use this currency.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {(['EUR', 'GBP', 'USD'] as const).map((cur) => (
                    <button
                      key={cur}
                      type="button"
                      onClick={() =>
                        setStep1Data((prev) => ({
                          ...prev,
                          selectedCurrency: cur,
                        }))
                      }
                      className={`rounded-md px-2.5 py-1 text-xs font-bold transition-colors ${
                        step1Data.selectedCurrency === cur
                          ? 'bg-slate-900 text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {cur}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* BOTTOM STEP 1 ACTION TOOLBAR */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                {onBackToModuleG && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onBackToModuleG}
                    className="text-xs text-slate-600"
                  >
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                    Back to Module G (Launchpad)
                  </Button>
                )}
                {saveStatus === 'saved' && (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Step 1 Saved!
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSaveStep1}
                  disabled={saveStatus === 'saving' || isVaultReadonly}
                  className="text-xs text-slate-700"
                >
                  {saveStatus === 'saving' ? 'Saving...' : 'Save Step 1'}
                </Button>

                <Button
                  size="sm"
                  onClick={async () => {
                    await handleSaveStep1();
                    setOpenStep(2);
                    window.scrollTo({ top: 400, behavior: 'smooth' });
                  }}
                  disabled={!isStep1Complete || isVaultReadonly}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                >
                  Next: Pricing Tiers (Step 2)
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STEP 2: PRICING ARCHITECTURE & TIER DESIGNER                  */}
      {/* ------------------------------------------------------------- */}
      {openStep !== 'ALL' && openStep !== 2 ? (
        // COLLAPSED STEP 2
        <div
          onClick={() => setOpenStep(2)}
          className="group scroll-mt-24 cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  isStep2Complete ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
                }`}
              >
                {isStep2Complete ? <Check className="h-4 w-4" /> : '2'}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                  Step 2: Pricing Architecture &amp; Tier Designer
                </h2>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {step2Data.tiers.length} {step2Data.tiers.length === 1 ? 'Offering' : 'Tiers'} •{' '}
                  Average Price: {currencySymbol}
                  {blendedAveragePrice} (net of tax)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Badge
                variant={isStep2Complete ? 'default' : 'outline'}
                className={`text-[10px] shrink-0 ${
                  isStep2Complete
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'border-slate-300 text-slate-600'
                }`}
              >
                {isStep2Complete ? 'Completed' : 'In Progress'}
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 shrink-0 px-2.5 text-xs font-medium text-indigo-600 group-hover:bg-indigo-50"
              >
                Edit Step
                <ChevronDown className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // EXPANDED STEP 2
        <Card className="rounded-xl border border-slate-200 bg-white shadow-xs">
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    isStep2Complete ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
                  }`}
                >
                  {isStep2Complete ? <Check className="h-4 w-4" /> : '2'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-bold text-slate-900">
                      Step 2: Pricing Architecture &amp; Tier Designer
                    </CardTitle>
                    <Badge
                      variant={isStep2Complete ? 'default' : 'outline'}
                      className={`text-[10px] shrink-0 ${
                        isStep2Complete
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'border-slate-300 text-slate-600'
                      }`}
                    >
                      {isStep2Complete ? 'Ready' : 'In Progress'}
                    </Badge>
                  </div>
                  <CardDescription className="mt-1 text-xs text-slate-600">
                    Set your net prices for your{' '}
                    {step1Data.offeringStructure === 'MULTI_OFFERING_TIERS'
                      ? 'tiers and expected sales mix.'
                      : 'flagship hero product.'}
                  </CardDescription>
                </div>
              </div>

              {openStep !== 'ALL' && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setOpenStep(0)}
                  className="text-xs text-slate-500 hover:bg-slate-100"
                >
                  Collapse Step
                  <ChevronUp className="ml-1 h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {/* Micro-Coaching Strip */}
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setActiveWhyCard(activeWhyCard === 2 ? null : 2)}
                className="flex items-center gap-1 text-[11px] font-semibold text-indigo-700 hover:text-indigo-900"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                <span>How We Calculate Net Revenue from Sticker Price</span>
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={() => setActiveExampleCard(activeExampleCard === 2 ? null : 2)}
                className="flex items-center gap-1 text-[11px] font-semibold text-indigo-700 hover:text-indigo-900"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Show Me a 3-Tier Rule of Thumb</span>
              </button>
            </div>

            {activeWhyCard === 2 && (
              <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 text-xs text-indigo-950 space-y-1.5">
                <div className="font-bold text-indigo-900">
                  How VAT Works &amp; Why We Split Sticker Price vs Net Bank Revenue:
                </div>
                <p className="text-indigo-900/90 leading-relaxed">
                  Enter the total price your customer pays at checkout (e.g. €50 or £50 inc. VAT). 
                  Because VAT / Sales Tax ({defaultVatRate}% in {selectedCountry === 'GB' ? 'the UK' : 'Ireland'}) 
                  does not belong to your company—you collect it and pass it to {selectedCountry === 'GB' ? 'HMRC' : 'Revenue'}—we 
                  automatically calculate the actual net turnover (~{currencySymbol}{(50 / (1 + defaultVatRate/100)).toFixed(2)}) 
                  that lands in your business bank account. Grant agencies and bank lenders review your plan based on this net amount.
                </p>
              </div>
            )}

            {activeExampleCard === 2 && (
              <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-950 space-y-1.5">
                <div className="font-bold text-emerald-900">
                  The Classic 10x / 3-Tier Distribution:
                </div>
                <p className="text-emerald-950/90 leading-relaxed">
                  Most successful SaaS and product startups follow the <strong>20 / 60 / 20 rule</strong>:
                  20% buy Entry (€29), 60% buy Core Flagship (€59), and 20% buy Enterprise (€149).
                  Having a higher-priced anchor makes the middle option feel like incredible value.
                </p>
              </div>
            )}

            {/* SYNCED FROM MODULE D STEP 2 CALLOUT BANNER */}
            {hasModuleDChannelData && (
              <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50/70 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-indigo-950">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-indigo-950">
                        Synced from Module D (Product &amp; Channel Matrix)
                      </span>
                      <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300 text-[9px] px-1.5 py-0">
                        Single Source of Truth
                      </Badge>
                    </div>
                    <p className="text-[11px] text-indigo-900/80 mt-0.5">
                      Estimated Sales Split:{' '}
                      <strong>
                        {moduleDChannelMatrix?.primaryChannelSharePercent || 100}% Primary (
                        {moduleDChannelMatrix?.primaryChannel?.replace(/_/g, ' ') || 'Direct'}
                        )
                      </strong>
                      {moduleDChannelMatrix?.secondaryChannels?.length ? (
                        <span>
                          {' '}
                          • {100 - (moduleDChannelMatrix?.primaryChannelSharePercent || 100)}% Secondary Channels
                        </span>
                      ) : null}{' '}
                      • Blended Platform Fee:{' '}
                      <strong className="text-indigo-950">
                        {moduleDChannelMatrix?.estimatedBlendedFeePercent || 2.9}%
                      </strong>
                    </p>
                  </div>
                </div>

                {step1Data.offeringStructure === 'MULTI_OFFERING_TIERS' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const primaryShare = moduleDChannelMatrix?.primaryChannelSharePercent ?? 75;
                      const secondaryShare = 100 - primaryShare;
                      if (step2Data.tiers.length >= 2) {
                        setStep2Data((prev) => ({
                          ...prev,
                          tiers: prev.tiers.map((t, idx) => {
                            if (idx === 0) return { ...t, salesMixPercent: primaryShare };
                            if (idx === 1 && prev.tiers.length === 2)
                              return { ...t, salesMixPercent: secondaryShare };
                            if (idx === 1 && prev.tiers.length > 2)
                              return { ...t, salesMixPercent: Math.round(secondaryShare * 0.7) };
                            if (idx === 2)
                              return {
                                ...t,
                                salesMixPercent:
                                  secondaryShare - Math.round(secondaryShare * 0.7),
                              };
                            return t;
                          }),
                        }));
                      }
                    }}
                    className="border-indigo-300 bg-white text-xs text-indigo-700 hover:bg-indigo-100/60 shrink-0 h-7"
                  >
                    Sync Sales Mix to Channel Split ({moduleDChannelMatrix?.primaryChannelSharePercent || 100}%)
                  </Button>
                )}
              </div>
            )}
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* TIER CARDS GRID */}
            <div id="target-mod-h-pricing-tiers" className="space-y-4 rounded-xl p-2 transition-all scroll-mt-28">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    {step1Data.offeringStructure === 'MULTI_OFFERING_TIERS'
                      ? 'Your Pricing Tiers & Deliverables'
                      : 'Your Flagship Offering'}
                  </Label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {step1Data.offeringStructure === 'MULTI_OFFERING_TIERS'
                      ? 'Define up to 3 tiers or packages. Enter customer price (including VAT) and expected sales share.'
                      : 'Enter what customers pay (including VAT) and what is included in your main offering.'}
                  </p>
                </div>

                {step1Data.offeringStructure === 'MULTI_OFFERING_TIERS' &&
                  step2Data.tiers.length < 3 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleAddTier}
                      className="text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Add Another Tier
                    </Button>
                  )}
              </div>

              <div
                className={`grid gap-4 ${
                  step2Data.tiers.length === 1
                    ? 'grid-cols-1 max-w-xl'
                    : step2Data.tiers.length === 2
                    ? 'grid-cols-1 md:grid-cols-2'
                    : 'grid-cols-1 md:grid-cols-3'
                }`}
              >
                {step2Data.tiers.map((tier, index) => {
                  return (
                    <div
                      key={tier.id}
                      className={`relative rounded-xl border p-4.5 space-y-3.5 transition-all ${
                        tier.isRecommendedDefault
                          ? 'border-indigo-400 bg-indigo-50/20 ring-2 ring-indigo-500/20 shadow-xs'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      {/* Tier Header Strip */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-700">
                            {index + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            Tier {index + 1}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {tier.isRecommendedDefault ? (
                            <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300 text-[9px]">
                              Flagship Core
                            </Badge>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setStep2Data((prev) => ({
                                  ...prev,
                                  tiers: prev.tiers.map((t) => ({
                                    ...t,
                                    isRecommendedDefault: t.id === tier.id,
                                  })),
                                }));
                              }}
                              className="text-[10px] text-slate-400 hover:text-indigo-600 underline"
                            >
                              Set as Core
                            </button>
                          )}

                          {step2Data.tiers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveTier(tier.id)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                              title="Delete this tier"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Tier Name & Target Persona */}
                      <div className="space-y-2">
                        <div>
                          <Label className="text-[11px] font-semibold text-slate-700">
                            Tier / SKU Name:
                          </Label>
                          <Input
                            value={tier.name}
                            onChange={(e) =>
                              handleUpdateTier(tier.id, { name: e.target.value })
                            }
                            placeholder="e.g. Starter, Core, Pro"
                            className="text-base sm:text-xs mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-[11px] font-semibold text-slate-700">
                            Who is this for?
                          </Label>
                          <Input
                            value={tier.targetPersona}
                            onChange={(e) =>
                              handleUpdateTier(tier.id, { targetPersona: e.target.value })
                            }
                            placeholder="e.g. Freelancers, Small agencies"
                            className="text-base sm:text-xs mt-1"
                          />
                        </div>
                      </div>

                      {/* Price & Tax Breakdown Card */}
                      {(() => {
                        const taxRate = tier.taxRatePercent ?? defaultVatRate;
                        // Display gross if saved, or compute from net
                        const displayGross =
                          tier.priceGross !== undefined && tier.priceGross > 0
                            ? tier.priceGross
                            : tier.priceNetOfTax > 0
                            ? Math.round(tier.priceNetOfTax * (1 + taxRate / 100) * 100) / 100
                            : 0;
                        const netAmount = tier.priceNetOfTax > 0 ? tier.priceNetOfTax : 0;
                        const taxAmount =
                          displayGross > 0
                            ? Math.max(0, Math.round((displayGross - netAmount) * 100) / 100)
                            : 0;

                        return (
                          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 space-y-3">
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-1.5">
                                <Label className="text-xs font-bold text-slate-800">
                                  Customer Sticker Price (Inc. Tax / VAT):
                                </Label>
                                <span className="text-[10px] text-slate-500 font-medium">
                                  {taxRate}% VAT
                                </span>
                              </div>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-bold text-base">
                                  {currencySymbol}
                                </div>
                                <Input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={displayGross || ''}
                                  onChange={(e) => {
                                    const gross = Math.max(0, parseFloat(e.target.value) || 0);
                                    // Net is gross divided by (1 + taxRate/100)
                                    const net =
                                      gross > 0
                                        ? Math.round((gross / (1 + taxRate / 100)) * 100) / 100
                                        : 0;
                                    handleUpdateTier(tier.id, {
                                      priceGross: gross,
                                      priceNetOfTax: net,
                                    });
                                  }}
                                  className="pl-8 text-base font-bold bg-white text-slate-900 shadow-xs border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                  placeholder="50"
                                />
                              </div>
                              <p className="mt-1 text-[10px] text-slate-500">
                                Total amount customer pays at checkout / invoice.
                              </p>
                            </div>

                            {/* Side-by-Side After-Tax Pocket Preview */}
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/70">
                              <div className="rounded-lg bg-emerald-50/80 border border-emerald-200/60 p-2 text-left">
                                <div className="text-[10px] font-semibold text-emerald-800">
                                  You Keep (Net of Tax):
                                </div>
                                <div className="text-sm font-bold text-emerald-950 mt-0.5">
                                  {currencySymbol}
                                  {netAmount.toFixed(2)}
                                </div>
                                <div className="text-[9px] text-emerald-700/80 mt-0.5">
                                  Official revenue in bank
                                </div>
                              </div>

                              <div className="rounded-lg bg-slate-100 border border-slate-200/80 p-2 text-left">
                                <div className="text-[10px] font-medium text-slate-600">
                                  Tax Handed Over:
                                </div>
                                <div className="text-sm font-bold text-slate-700 mt-0.5">
                                  {currencySymbol}
                                  {taxAmount.toFixed(2)}
                                </div>
                                <div className="text-[9px] text-slate-500 mt-0.5">
                                  To {selectedCountry === 'GB' ? 'HMRC' : 'Revenue'} ({taxRate}%)
                                </div>
                              </div>
                            </div>

                            {/* Sales Mix Percent (If multi-tier) */}
                            {step1Data.offeringStructure === 'MULTI_OFFERING_TIERS' && (
                              <div className="pt-2 border-t border-slate-200/70">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="font-semibold text-slate-700">
                                    Expected Sales Share:
                                  </span>
                                  <span className="font-bold text-indigo-700">
                                    {tier.salesMixPercent}% of sales
                                  </span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  step="5"
                                  value={tier.salesMixPercent}
                                  onChange={(e) =>
                                    handleUpdateTier(tier.id, {
                                      salesMixPercent: parseInt(e.target.value) || 0,
                                    })
                                  }
                                  className="w-full mt-1.5 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* What's Included */}
                      <div>
                        <Label className="text-[11px] font-semibold text-slate-700">
                          What is included?
                        </Label>
                        <textarea
                          rows={2}
                          value={tier.deliverablesSummary}
                          onChange={(e) =>
                            handleUpdateTier(tier.id, { deliverablesSummary: e.target.value })
                          }
                          placeholder="e.g. Core dashboard access, 1,000 credits, email support"
                          className="w-full mt-1 rounded-md border border-slate-200 p-2 text-base sm:text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* SALES MIX WARNING (IF SUM != 100%) */}
              {step1Data.offeringStructure === 'MULTI_OFFERING_TIERS' &&
                Math.abs(totalSalesMixSum - 100) > 2 && (
                  <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-3.5 flex items-center gap-3 text-xs text-amber-900">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                    <p>
                      <strong>Your sales mix currently equals {totalSalesMixSum}%.</strong> Please
                      adjust the sliders across your tiers so the total equals <strong>100%</strong>.
                    </p>
                  </div>
                )}
            </div>

            {/* LIVE BLENDED AVERAGE ORDER VALUE BANNER */}
            <div className="rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50/80 via-white to-indigo-50/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold">
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                        Blended Average Sale (Net of Tax)
                      </span>
                      <Badge className="bg-indigo-100 text-indigo-800 text-[10px]">
                        Auto-Calculated
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      On average, every active customer or sale brings in{' '}
                      <strong className="text-slate-900">
                        {currencySymbol}
                        {blendedAveragePrice}
                      </strong>{' '}
                      into your business bank account.
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black text-indigo-900 tracking-tight">
                    {currencySymbol}
                    {blendedAveragePrice}
                  </div>
                  <span className="text-[11px] text-slate-500">per sale / customer</span>
                </div>
              </div>
            </div>

            {/* STRATEGY NOTES & AI CALIBRATOR HINT */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Pricing Strategy Justification (For Grant Assessors &amp; Bank Managers)
                  </Label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Written explanation of why beachhead customers will pay this price and how it protects gross margins.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateAiPricingJustification}
                  disabled={isGeneratingAiJustification || isVaultReadonly}
                  className="border-indigo-300 bg-indigo-50/70 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 h-8 gap-1.5 shadow-2xs"
                >
                  {isGeneratingAiJustification ? (
                    <>
                      <Wand2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                      <span>Synthesizing Strategy from Mod A-D...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Auto-Generate with AI (Grant/Bank Mode)</span>
                    </>
                  )}
                </Button>
              </div>

              {aiJustificationSuccess && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-2.5 flex items-center gap-2 text-xs text-emerald-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>
                    Successfully synthesized pricing justification using your target persona (Mod B), interview signals (Mod C), and channel fees (Mod D)!
                  </span>
                </div>
              )}

              {aiAssessorTip && (
                <div className="rounded-lg border border-indigo-200 bg-indigo-50/60 p-2.5 flex items-start gap-2 text-xs text-indigo-950">
                  <Lightbulb className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    <strong>Grant Assessor Coaching Tip:</strong> {aiAssessorTip}
                  </p>
                </div>
              )}

              <textarea
                rows={3}
                value={step2Data.pricingStrategyNotes}
                onChange={(e) =>
                  setStep2Data((prev) => ({
                    ...prev,
                    pricingStrategyNotes: e.target.value,
                  }))
                }
                placeholder="Explain why your beachhead customers will pay this price (or click 'Auto-Generate with AI' to compose an assessor-grade defense based on Modules A, B, C & D)..."
                className="w-full rounded-md border border-slate-200 p-2.5 text-base sm:text-xs text-slate-900 focus:border-indigo-500 focus:outline-none leading-relaxed"
              />
            </div>

            {/* BOTTOM STEP 2 ACTION TOOLBAR */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setOpenStep(1);
                    window.scrollTo({ top: 150, behavior: 'smooth' });
                  }}
                  className="text-xs text-slate-600"
                >
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                  Back to Step 1
                </Button>
                {saveStatus === 'saved' && (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Step 2 Saved!
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSaveStep2}
                  disabled={saveStatus === 'saving' || isVaultReadonly}
                  className="text-xs text-slate-700"
                >
                  {saveStatus === 'saving' ? 'Saving...' : 'Save Step 2'}
                </Button>

                <Button
                  size="sm"
                  onClick={async () => {
                    await handleSaveStep2();
                    setOpenStep(3);
                    window.scrollTo({ top: 400, behavior: 'smooth' });
                  }}
                  disabled={!isStep2Complete || isVaultReadonly}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                >
                  Next: Breakeven Engine (Step 3)
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STEP 3: POCKET PROFIT & 3-YEAR BREAKEVEN ENGINE               */}
      {/* ------------------------------------------------------------- */}
      {openStep !== 'ALL' && openStep !== 3 ? (
        // COLLAPSED STEP 3
        <div
          onClick={() => setOpenStep(3)}
          className="group scroll-mt-24 cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  isStep3Complete ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
                }`}
              >
                {isStep3Complete ? <Check className="h-4 w-4" /> : '3'}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                  Step 3: &ldquo;Pocket Profit&rdquo; &amp; 3-Year Breakeven Engine
                </h2>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {currencySymbol}
                  {pocketProfitPerSale.toFixed(2)} Pocket Profit per sale ({contributionMarginPercent}%
                  margin) • Need <strong>{customersNeededToBreakeven}</strong> sales/mo in Year{' '}
                  {activeSimYear} to cover {currencySymbol}
                  {totalMonthlyFixedNut.toLocaleString()}/mo bills
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Badge
                variant={isStep3Complete ? 'default' : 'outline'}
                className={`shrink-0 text-[10px] font-medium ${
                  isStep3Complete
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'border-slate-300 text-slate-600'
                }`}
              >
                {isStep3Complete ? 'Completed' : 'In Progress'}
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 shrink-0 px-2.5 text-xs font-medium text-indigo-600 group-hover:bg-indigo-50"
              >
                Edit Step
                <ChevronDown className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // EXPANDED STEP 3
        <Card className="rounded-xl border border-slate-200 bg-white shadow-xs">
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    isStep3Complete ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
                  }`}
                >
                  {isStep3Complete ? <Check className="h-4 w-4" /> : '3'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base font-bold text-slate-900">
                      Step 3: &ldquo;Pocket Profit&rdquo; &amp; 3-Year Breakeven Engine
                    </CardTitle>
                    <Badge
                      variant={isStep3Complete ? 'default' : 'outline'}
                      className={`shrink-0 text-[10px] font-medium ${
                        isStep3Complete
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'border-slate-300 text-slate-600'
                      }`}
                    >
                      {isStep3Complete ? 'Completed' : 'In Progress'}
                    </Badge>
                  </div>
                  <CardDescription className="mt-1 text-xs text-slate-600">
                    See what you actually keep from each sale after fees and delivery costs, and find out
                    exactly how many sales you need each month to cover your wages and bills across Years
                    1, 2, and 3.
                  </CardDescription>
                </div>
              </div>

              {openStep !== 'ALL' && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setOpenStep(0)}
                  className="shrink-0 text-xs text-slate-500 hover:bg-slate-100"
                >
                  Collapse Step
                  <ChevronUp className="ml-1 h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {/* Micro-Coaching Strip */}
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setActiveWhyCard(activeWhyCard === 3 ? null : 3)}
                className="flex items-center gap-1 text-[11px] font-semibold text-indigo-700 hover:text-indigo-900"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                <span>Why &ldquo;Pocket Profit&rdquo; Matters More Than Sticker Price</span>
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={() => setActiveExampleCard(activeExampleCard === 3 ? null : 3)}
                className="flex items-center gap-1 text-[11px] font-semibold text-indigo-700 hover:text-indigo-900"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Show Me a Real Breakeven Example</span>
              </button>
            </div>

            {activeWhyCard === 3 && (
              <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 text-xs text-indigo-950 space-y-1.5">
                <div className="font-bold text-indigo-900">
                  Why We Calculate &ldquo;Pocket Profit&rdquo; Before Fixed Bills:
                </div>
                <p className="text-indigo-900/90 leading-relaxed">
                  Every time you make a sale, card processors (like Stripe) or marketplaces (like Amazon or
                  Apple) take a cut, and it costs you something to deliver that order (packaging, materials,
                  or cloud servers). What is left over is your <strong>Pocket Profit</strong> (also called
                  <em> Contribution Margin</em>). This is the actual cash available to pay your wages and
                  fixed monthly bills.
                </p>
              </div>
            )}

            {activeExampleCard === 3 && (
              <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-950 space-y-1.5">
                <div className="font-bold text-emerald-900">
                  Plain-English Breakeven Example:
                </div>
                <p className="text-emerald-950/90 leading-relaxed">
                  Imagine you sell a subscription for <strong>{currencySymbol}50 net</strong>. Stripe takes{' '}
                  <strong>{currencySymbol}1.25</strong> and cloud hosting/support costs{' '}
                  <strong>{currencySymbol}3.75</strong> per user. That leaves{' '}
                  <strong>{currencySymbol}45.00 Pocket Profit</strong> per customer. If your monthly founder
                  wages and software bills total <strong>{currencySymbol}4,500/month</strong>, you need
                  exactly <strong>100 paying customers</strong> ({currencySymbol}4,500 ÷ {currencySymbol}45)
                  to break even. Customer #101 is pure profit!
                </p>
              </div>
            )}

            {/* CROSS-MODULE SYNC & SOURCE FIGURES TILE */}
            <div className="mt-4 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50/90 via-slate-50 to-indigo-50/60 p-4 text-xs text-indigo-950 space-y-3 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600 text-white">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">
                      Where Did These Figures Come From? (Live Platform Data)
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Your breakeven targets are calculated from your real inputs across earlier modules. Click any source below to inspect or edit.
                    </p>
                  </div>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] shrink-0">
                  Live Synced
                </Badge>
              </div>

              {/* 4 Connected Source Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {/* 1. Net Price */}
                <div className="rounded-lg border border-indigo-100 bg-white p-3 space-y-1.5 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1 text-[10px] font-semibold uppercase text-slate-500">
                      <span>1. Net Customer Price</span>
                      <span className="text-indigo-600 font-bold">Step 2</span>
                    </div>
                    <div className="text-base font-bold text-slate-900 mt-1">
                      {currencySymbol}{blendedAveragePrice.toFixed(2)}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Blended net price (after VAT/tax) across your pricing tiers.
                    </p>
                  </div>
                  <div className="pt-1.5 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setOpenStep(2);
                        setTimeout(() => {
                          const el = document.getElementById('target-mod-h-pricing-tiers');
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            el.classList.remove('attention-highlight');
                            void el.offsetWidth;
                            el.classList.add('attention-highlight');
                            setTimeout(() => el.classList.remove('attention-highlight'), 3000);
                          }
                        }, 200);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>Edit in Step 2</span>
                    </button>
                  </div>
                </div>

                {/* 2. Platform & Channel Fees */}
                <div className="rounded-lg border border-indigo-100 bg-white p-3 space-y-1.5 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1 text-[10px] font-semibold uppercase text-slate-500">
                      <span>2. Platform Fee %</span>
                      <span className="text-indigo-600 font-bold">Mod D Step 2</span>
                    </div>
                    <div className="text-base font-bold text-slate-900 mt-1">
                      {step3Data.frictionCosts.paymentGatewayPercent}%
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      {hasModuleDChannelData
                        ? `Pulled from your ${moduleDChannelMatrix?.primaryChannel || 'primary'} channel split.`
                        : 'Default blended card payment processing rate (Stripe/Bank).'}
                    </p>
                  </div>
                  <div className="pt-1.5 border-t border-slate-100">
                    {onNavigateToModule ? (
                      <button
                        type="button"
                        onClick={() =>
                          onNavigateToModule(
                            'MOD_D_PRODUCT_BUILD',
                            2,
                            'target-mod-d-blended-fee'
                          )
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>Edit in Module D</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400">Configured in Module D</span>
                    )}
                  </div>
                </div>

                {/* 3. Premises & Overheads */}
                <div className="rounded-lg border border-indigo-100 bg-white p-3 space-y-1.5 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1 text-[10px] font-semibold uppercase text-slate-500">
                      <span>3. Fixed Overheads</span>
                      <span className="text-indigo-600 font-bold">Module E</span>
                    </div>
                    <div className="text-base font-bold text-slate-900 mt-1">
                      {currencySymbol}{defaultFixedOverheads.toLocaleString()}
                      <span className="text-xs font-normal text-slate-500">/mo</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Monthly rent, software stack, bookkeeping, and statutory startup insurance.
                    </p>
                  </div>
                  <div className="pt-1.5 border-t border-slate-100">
                    {onNavigateToModule ? (
                      <button
                        type="button"
                        onClick={() =>
                          onNavigateToModule(
                            'MOD_E_OPERATIONS',
                            2,
                            'target-mod-e-premises-cost'
                          )
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>Edit in Module E</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400">Configured in Module E</span>
                    )}
                  </div>
                </div>

                {/* 4. Founder Wages & Team Payroll */}
                <div className="rounded-lg border border-indigo-100 bg-white p-3 space-y-1.5 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1 text-[10px] font-semibold uppercase text-slate-500">
                      <span>4. Founder &amp; Team Wages</span>
                      <span className="text-indigo-600 font-bold">Module F</span>
                    </div>
                    <div className="text-base font-bold text-slate-900 mt-1">
                      {currencySymbol}{canonicalHiringPayroll.y1Mo.toLocaleString()}
                      <span className="text-xs font-normal text-slate-500">/mo (Y1)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      {canonicalHiringPayroll.hasModFRoles
                        ? 'From your Module F hiring plan + taxes + founder survival draw.'
                        : 'From your personal survival budget in Module F Step 3.'}
                    </p>
                  </div>
                  <div className="pt-1.5 border-t border-slate-100">
                    {onNavigateToModule ? (
                      <button
                        type="button"
                        onClick={() =>
                          onNavigateToModule(
                            'MOD_F_COFOUNDER_TEAM',
                            3,
                            'target-mod-f-survival-budget'
                          )
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>Edit in Module F</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400">Configured in Module F</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* ========================================================= */}
            {/* PART A: WHAT COMES OUT OF EACH SALE? (PER-SALE FRICTION)  */}
            {/* ========================================================= */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    1. What Comes Out of Each Sale? (Per-Sale Pocket Profit)
                  </Label>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Before you can pay monthly rent or wages, these variable costs come out of every
                    single order.
                  </p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const benchCogs = Math.max(
                      1,
                      Math.round(simulatedNetPrice * 0.12 * 100) / 100
                    );
                    setStep3Data((prev) => ({
                      ...prev,
                      frictionCosts: {
                        ...prev.frictionCosts,
                        paymentGatewayPercent: defaultGatewayPercent,
                        paymentGatewayFixedCents: 25,
                        directVariableCogsPerUnit: benchCogs,
                        disputeRefundBufferPercent: 1,
                      },
                    }));
                  }}
                  disabled={isVaultReadonly}
                  className="h-8 shrink-0 text-xs border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50"
                >
                  <Wand2 className="mr-1.5 h-3.5 w-3.5" />
                  Use Industry Benchmark
                </Button>
              </div>

              {/* 2-Card Clean Side-by-Side Receipt Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Card 1: Editable Variable Deductions */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <span className="text-xs font-bold text-slate-800">
                      Adjust Variable Costs Per Sale
                    </span>
                    <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-600">
                      Editable
                    </Badge>
                  </div>

                  {/* Input 1: Card / Channel Fee (%) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-xs font-semibold text-slate-700">
                        Card / Marketplace Fee (%)
                      </Label>
                      <span className="text-xs font-bold text-rose-600 shrink-0">
                        -{currencySymbol}
                        {gatewayFeeAmount.toFixed(2)} / sale
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Input
                          type="number"
                          min="0"
                          max="60"
                          step="0.1"
                          value={step3Data.frictionCosts.paymentGatewayPercent}
                          onChange={(e) => {
                            const val = Math.max(0, Math.min(60, parseFloat(e.target.value) || 0));
                            setStep3Data((prev) => ({
                              ...prev,
                              frictionCosts: {
                                ...prev.frictionCosts,
                                paymentGatewayPercent: val,
                              },
                            }));
                          }}
                          disabled={isVaultReadonly}
                          className="h-9 pr-7 text-base sm:text-sm font-bold bg-slate-50"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                          %
                        </div>
                      </div>
                      <span className="text-xs font-medium text-slate-500 shrink-0">
                        + 25c fixed
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Auto-pulled from Module D (e.g. Stripe ~2%, Shopify/Amazon 5–15%).
                    </p>
                  </div>

                  {/* Input 2: Direct Delivery Cost Per Unit */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-xs font-semibold text-slate-700">
                        Direct Cost to Deliver 1 Unit / Order
                      </Label>
                      <span className="text-xs font-bold text-rose-600 shrink-0">
                        -{currencySymbol}
                        {(directCogsAmount + refundAndAffiliateFeeAmount).toFixed(2)} / sale
                      </span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-bold text-xs">
                        {currencySymbol}
                      </div>
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        value={step3Data.frictionCosts.directVariableCogsPerUnit}
                        onChange={(e) => {
                          const val = Math.max(0, parseFloat(e.target.value) || 0);
                          setStep3Data((prev) => ({
                            ...prev,
                            frictionCosts: {
                              ...prev.frictionCosts,
                              directVariableCogsPerUnit: val,
                            },
                          }));
                        }}
                        disabled={isVaultReadonly}
                        className="h-9 pl-7 text-base sm:text-sm font-bold bg-slate-50"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Materials, packaging, postage, or cloud/AI server cost per customer.
                    </p>
                  </div>
                </div>

                {/* Card 2: Live Single-Sale Receipt Breakdown */}
                <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-white via-emerald-50/40 to-teal-50/50 p-4 shadow-xs flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2.5">
                      <span className="text-xs font-bold text-slate-900">
                        Live Single-Sale Receipt Breakdown
                      </span>
                      <Badge className="bg-emerald-600 text-white text-[10px]">
                        {contributionMarginPercent}% Pocket Margin
                      </Badge>
                    </div>

                    {/* Line 0: Gross Sticker Price (What customer pays) */}
                    <div className="flex items-center justify-between text-xs py-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-800">
                          Customer Sticker Price (Inc. Tax)
                        </span>
                        <Badge variant="outline" className="text-[9px] px-1 py-0 border-slate-300 text-slate-600">
                          Checkout
                        </Badge>
                      </div>
                      <span className="font-bold text-slate-900">
                        {currencySymbol}
                        {simulatedGrossStickerPrice.toFixed(2)}
                      </span>
                    </div>

                    {/* Line 0.5: VAT / Sales Tax Handed Over */}
                    <div className="flex items-center justify-between text-xs py-1 border-t border-slate-200/50">
                      <span className="text-slate-600">
                        Minus {blendedEffectiveTaxRate}% VAT / Sales Tax (to {selectedCountry === 'GB' ? 'HMRC' : 'Revenue'})
                      </span>
                      <span className="font-semibold text-amber-700">
                        -{currencySymbol}
                        {simulatedVatAmount.toFixed(2)}
                      </span>
                    </div>

                    {/* Line 1: Net Price */}
                    <div className="flex items-center justify-between text-xs py-1 border-t border-slate-200/50">
                      <span className="font-medium text-slate-700">
                        Net Price Landing in Bank (Ex-VAT)
                      </span>
                      <span className="font-bold text-slate-900">
                        {currencySymbol}
                        {simulatedNetPrice.toFixed(2)}
                      </span>
                    </div>

                    {/* Line 2: Card / Channel Fee */}
                    <div className="flex items-center justify-between text-xs py-1 border-t border-slate-200/50">
                      <span className="text-slate-600">
                        Minus Card / Platform Fee ({step3Data.frictionCosts.paymentGatewayPercent}% + 25c)
                      </span>
                      <span className="font-semibold text-rose-600">
                        -{currencySymbol}
                        {gatewayFeeAmount.toFixed(2)}
                      </span>
                    </div>

                    {/* Line 3: Direct Delivery Cost */}
                    <div className="flex items-center justify-between text-xs py-1 border-t border-slate-200/50">
                      <span className="text-slate-600">
                        Minus Direct Cost to Deliver (+1% refund buffer)
                      </span>
                      <span className="font-semibold text-rose-600">
                        -{currencySymbol}
                        {(directCogsAmount + refundAndAffiliateFeeAmount).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Highlight: Resulting Pocket Profit */}
                  <div className="rounded-xl bg-emerald-600 p-3.5 text-white shadow-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-100">
                          True Pocket Profit Per Sale
                        </div>
                        <p className="text-[11px] text-emerald-50 mt-0.5">
                          Cash left over from 1 sale to pay your monthly bills
                        </p>
                      </div>
                      <div className="text-2xl font-black tracking-tight text-white shrink-0">
                        {currencySymbol}
                        {pocketProfitPerSale.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* PART B: 3-YEAR TIME HORIZON SWITCHER & MONTHLY BILLS      */}
            {/* ========================================================= */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    2. Choose Year &amp; Check Monthly Bills to Cover
                  </Label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Switch between Year 1, Year 2, and Year 3 to see how your breakeven target grows as
                    you hire staff from Module F.
                  </p>
                </div>

                {/* 3-Year Pill Switcher */}
                <div className="grid grid-cols-3 sm:flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                  {([1, 2, 3] as const).map((yr) => {
                    const isSelected = activeSimYear === yr;
                    const yrTarget = computedThreeYearTargets.find((y) => y.yearNumber === yr);
                    return (
                      <button
                        key={yr}
                        type="button"
                        onClick={() =>
                          setStep3Data((prev) => ({
                            ...prev,
                            selectedSimulationYear: yr,
                            activeCustomerSlider: Math.max(
                              yrTarget?.customersNeededToBreakeven || 50,
                              Math.round((yrTarget?.customersNeededToBreakeven || 50) * 1.2)
                            ),
                          }))
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                        }`}
                      >
                        Year {yr}
                        <span
                          className={`ml-1.5 text-[10px] font-normal ${
                            isSelected ? 'text-indigo-100' : 'text-slate-400'
                          }`}
                        >
                          ({yrTarget?.customersNeededToBreakeven || 0} sales/mo)
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Monthly Fixed Bills Breakdown for Selected Year */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                {/* Col 1: Monthly Team & Founder Wages (Two-Way Quick Adjuster) */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <Label className="text-xs font-bold text-slate-800 leading-snug">
                        Year {activeSimYear} Monthly Wages &amp; Founder Draw
                      </Label>
                      <Badge
                        variant="outline"
                        className="shrink-0 text-[9px] border-indigo-200 bg-indigo-50/50 text-indigo-700"
                      >
                        {canonicalHiringPayroll.hasModFRoles ? 'Synced Mod F' : 'Survival Baseline'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-500 font-bold text-xs">
                          {currencySymbol}
                        </div>
                        <Input
                          type="number"
                          min="0"
                          step="100"
                          value={activeMonthlyPayroll}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            setStep3Data((prev) => ({
                              ...prev,
                              sandboxMonthlyPayrollOverride: prev.isSandboxActive ? val : undefined,
                              yearTargets: prev.yearTargets.map((y) =>
                                y.yearNumber === activeSimYear
                                  ? { ...y, monthlyPayrollBaseline: val }
                                  : y
                              ),
                            }));
                          }}
                          disabled={isVaultReadonly}
                          className="h-9 pl-7 text-base sm:text-sm font-bold bg-white"
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-500 shrink-0">/ month</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={activeSimYear === 1 ? 25000 : activeSimYear === 2 ? 50000 : 100000}
                      step="250"
                      value={activeMonthlyPayroll}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setStep3Data((prev) => ({
                          ...prev,
                          sandboxMonthlyPayrollOverride: prev.isSandboxActive ? val : undefined,
                          yearTargets: prev.yearTargets.map((y) =>
                            y.yearNumber === activeSimYear
                              ? { ...y, monthlyPayrollBaseline: val }
                              : y
                          ),
                        }));
                      }}
                      disabled={isVaultReadonly}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Includes founder living draw + Year {activeSimYear} staff salaries &amp; PRSI/NIC.
                  </p>
                </div>

                {/* Col 2: Other Monthly Fixed Overheads */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <Label className="text-xs font-bold text-slate-800 leading-snug">
                        Other Monthly Fixed Bills (Rent, Software, Ins.)
                      </Label>
                      <Badge
                        variant="outline"
                        className="shrink-0 text-[9px] border-slate-200 bg-white text-slate-600"
                      >
                        Mod E + G
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-500 font-bold text-xs">
                          {currencySymbol}
                        </div>
                        <Input
                          type="number"
                          min="0"
                          step="50"
                          value={activeMonthlyOverheads}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            setStep3Data((prev) => ({
                              ...prev,
                              yearTargets: prev.yearTargets.map((y) =>
                                y.yearNumber === activeSimYear
                                  ? { ...y, otherFixedMonthlyOverheads: val }
                                  : y
                              ),
                            }));
                          }}
                          disabled={isVaultReadonly}
                          className="h-9 pl-7 text-base sm:text-sm font-bold bg-white"
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-500 shrink-0">/ month</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Fixed bills you must pay every month even if you make 0 sales (insurance, accounting,
                    domains, rent).
                  </p>
                </div>

                {/* Col 3: Total Monthly Fixed Nut */}
                <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/80 via-white to-indigo-50/60 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-indigo-950">
                        Total Year {activeSimYear} Monthly Bills
                      </span>
                      <Badge className="bg-indigo-100 text-indigo-800 text-[10px] shrink-0">
                        Monthly Nut
                      </Badge>
                    </div>
                    <div className="mt-2 text-2xl font-black text-indigo-950">
                      {currencySymbol}
                      {totalMonthlyFixedNut.toLocaleString()}
                      <span className="text-xs font-semibold text-indigo-700"> / month</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-2.5 border-t border-indigo-200/60 flex items-center justify-between text-xs text-indigo-900">
                    <span>Annualized Fixed Burn:</span>
                    <strong>
                      {currencySymbol}
                      {(totalMonthlyFixedNut * 12).toLocaleString()} / yr
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* PART C: VISUAL BREAKEVEN CROSSOVER & INTERACTIVE SLIDERS   */}
            {/* ========================================================= */}
            <div className="rounded-2xl border-2 border-indigo-600/20 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-5 text-white shadow-md space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-indigo-800/50 pb-4">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 text-[10px] shrink-0">
                      Year {activeSimYear} Breakeven Target
                    </Badge>
                    {step3Data.isSandboxActive && (
                      <Badge className="bg-amber-500/20 text-amber-200 border-amber-400/40 text-[10px] shrink-0">
                        Custom Slider Adjustment Active
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-lg sm:text-xl font-black tracking-tight text-white">
                    You need{' '}
                    <span className="text-emerald-400 underline decoration-emerald-400/40 underline-offset-4">
                      {customersNeededToBreakeven.toLocaleString()} sales / active customers
                    </span>{' '}
                    per month in Year {activeSimYear} to break even.
                  </h3>
                  <p className="text-xs text-indigo-200">
                    That is roughly <strong>{dailySalesNeededToBreakeven} sales per day</strong> (generating{' '}
                    <strong>
                      {currencySymbol}
                      {monthlyRevenueAtBreakeven.toLocaleString()}/month
                    </strong>{' '}
                    in net turnover) to pay all {currencySymbol}
                    {totalMonthlyFixedNut.toLocaleString()} of your monthly bills.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleResetStep3ToModuleDefaults}
                    className="h-9 border-indigo-400/40 bg-indigo-900/60 px-3 text-xs font-semibold text-indigo-100 hover:bg-indigo-800 hover:text-white shrink-0"
                    title="Reset price, channel fees, overheads, and wages back to the default numbers pulled from Step 2 & Modules D, E, and F"
                  >
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5 text-emerald-300" />
                    Reset to Module Defaults
                  </Button>

                  <div className="rounded-xl bg-white/10 border border-white/15 px-4 py-2 text-right shrink-0">
                    <div className="text-[10px] uppercase tracking-wider text-indigo-200 font-semibold">
                      Breakeven Turnover (Net)
                    </div>
                    <div className="text-xl font-black text-white">
                      {currencySymbol}
                      {monthlyRevenueAtBreakeven.toLocaleString()}
                      <span className="text-xs font-normal text-indigo-200">/mo</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Sliders: Volume & Price */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Slider 1: Monthly Customer / Sales Volume Simulator */}
                <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-100">
                      Test Monthly Sales / Active Customers:
                    </span>
                    <span className="text-sm font-black text-emerald-300">
                      {simulatedMonthlyCustomers.toLocaleString()} sales/mo
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max={Math.max(300, customersNeededToBreakeven * 3)}
                    step="1"
                    value={simulatedMonthlyCustomers}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setStep3Data((prev) => ({
                        ...prev,
                        activeCustomerSlider: val,
                      }));
                    }}
                    className="w-full h-2 bg-indigo-950 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                  <div className="flex justify-between text-[10px] text-indigo-300">
                    <span>1 sale/mo</span>
                    <span className="text-amber-300 font-semibold">
                      Breakeven: {customersNeededToBreakeven}
                    </span>
                    <span>{Math.max(300, customersNeededToBreakeven * 3)} sales/mo</span>
                  </div>
                </div>

                {/* Slider 2: What-If Net Price Simulator */}
                <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-100">
                      Test a Different Net Price:
                    </span>
                    <span className="text-sm font-black text-indigo-200">
                      {currencySymbol}
                      {simulatedNetPrice.toFixed(2)}{' '}
                      <span className="text-[10px] font-normal text-indigo-300">
                        (Official: {currencySymbol}
                        {blendedAveragePrice})
                      </span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max={Math.max(250, Math.round(blendedAveragePrice * 3))}
                    step="1"
                    value={simulatedNetPrice}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || blendedAveragePrice;
                      setStep3Data((prev) => ({
                        ...prev,
                        isSandboxActive: true,
                        activePriceSlider: val,
                      }));
                    }}
                    className="w-full h-2 bg-indigo-950 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                  />
                  <div className="flex justify-between text-[10px] text-indigo-300">
                    <span>{currencySymbol}5</span>
                    <span>Official: {currencySymbol}{blendedAveragePrice}</span>
                    <span>
                      {currencySymbol}
                      {Math.max(250, Math.round(blendedAveragePrice * 3))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Visual Crossover Bar & Live Monthly Profit/Loss Result */}
              <div className="rounded-xl bg-slate-950/70 border border-white/10 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs">
                    <span className="text-indigo-200">
                      At <strong>{simulatedMonthlyCustomers} sales/month</strong>, your Pocket Profit is{' '}
                      <strong>
                        {currencySymbol}
                        {simulatedTotalPocketContribution.toLocaleString()}/mo
                      </strong>{' '}
                      vs.{' '}
                      <strong>
                        {currencySymbol}
                        {totalMonthlyFixedNut.toLocaleString()}/mo
                      </strong>{' '}
                      in fixed bills:
                    </span>
                  </div>

                  <div
                    className={`px-3 py-1 rounded-lg text-xs font-black ${
                      simulatedMonthlyNetSurplusOrLoss >= 0
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                    }`}
                  >
                    {simulatedMonthlyNetSurplusOrLoss >= 0 ? (
                      <span>
                        +{currencySymbol}
                        {simulatedMonthlyNetSurplusOrLoss.toLocaleString()}/mo Pure Surplus Profit
                      </span>
                    ) : (
                      <span>
                        {currencySymbol}
                        {simulatedMonthlyNetSurplusOrLoss.toLocaleString()}/mo Monthly Shortfall (Burn)
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar Comparing Current Sales Volume to Breakeven */}
                <div className="space-y-1.5">
                  <div className="relative h-4 w-full rounded-full bg-slate-800 overflow-hidden">
                    {/* Breakeven marker at 50% of bar */}
                    <div
                      className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-amber-400 z-10"
                      title={`Breakeven: ${customersNeededToBreakeven} sales`}
                    />
                    <div
                      className={`h-full transition-all duration-300 ${
                        simulatedMonthlyCustomers >= customersNeededToBreakeven
                          ? 'bg-gradient-to-r from-indigo-500 via-emerald-500 to-emerald-400'
                          : 'bg-gradient-to-r from-rose-600 to-amber-500'
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            (simulatedMonthlyCustomers /
                              Math.max(1, customersNeededToBreakeven * 2)) *
                              100
                          )
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-indigo-300">
                    <span className="text-rose-300">Red Zone (Paying bills from savings/grants)</span>
                    <span className="text-amber-300 font-bold">
                      ▲ Breakeven ({customersNeededToBreakeven} sales)
                    </span>
                    <span className="text-emerald-300">
                      Green Zone (Self-sustaining profit in bank)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* PART D: 3-YEAR BREAKEVEN SUMMARY TABLE                     */}
            {/* ========================================================= */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    3. 3-Year Breakeven Comparison Table (Years 1–3)
                  </Label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Click any year row below to switch the graph above and inspect how new hires in Module F change your breakeven target.
                  </p>
                </div>
              </div>

              {/* 3-Year Breakeven Comparison Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full min-w-[700px] text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-600">
                    <tr>
                      <th className="py-2.5 px-3.5">Horizon</th>
                      <th className="py-2.5 px-3.5">Monthly Wages (Mod F)</th>
                      <th className="py-2.5 px-3.5">Other Fixed Bills</th>
                      <th className="py-2.5 px-3.5">Total Monthly Nut</th>
                      <th className="py-2.5 px-3.5 text-indigo-700">Breakeven Sales / Mo</th>
                      <th className="py-2.5 px-3.5 text-emerald-700">Net Turnover / Mo</th>
                      <th className="py-2.5 px-3.5 text-slate-800">Gross Sales (Inc. VAT)</th>
                      <th className="py-2.5 px-3.5 text-amber-700">VAT Paid ({blendedEffectiveTaxRate}%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {computedThreeYearTargets.map((yr) => {
                      const isCurr = yr.yearNumber === activeSimYear;
                      const netMonthlyTurnover = yr.monthlyRevenueAtBreakeven;
                      const vatMonthlyCollected =
                        Math.round(netMonthlyTurnover * (blendedEffectiveTaxRate / 100));
                      const grossMonthlySales = netMonthlyTurnover + vatMonthlyCollected;

                      return (
                        <tr
                          key={yr.yearNumber}
                          onClick={() =>
                            setStep3Data((prev) => ({
                              ...prev,
                              selectedSimulationYear: yr.yearNumber,
                            }))
                          }
                          className={`cursor-pointer transition-colors ${
                            isCurr ? 'bg-indigo-50/50 font-semibold' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="py-2.5 px-3.5 font-bold text-slate-900">
                            Year {yr.yearNumber}{' '}
                            {isCurr && (
                              <Badge className="ml-1 bg-indigo-100 text-indigo-800 text-[9px]">
                                Viewing
                              </Badge>
                            )}
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-700">
                            {currencySymbol}
                            {yr.monthlyPayrollBaseline.toLocaleString()}/mo
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-700">
                            {currencySymbol}
                            {yr.otherFixedMonthlyOverheads.toLocaleString()}/mo
                          </td>
                          <td className="py-2.5 px-3.5 font-bold text-slate-900">
                            {currencySymbol}
                            {(
                              yr.monthlyPayrollBaseline + yr.otherFixedMonthlyOverheads
                            ).toLocaleString()}
                            /mo
                          </td>
                          <td className="py-2.5 px-3.5 font-bold text-indigo-700">
                            {yr.customersNeededToBreakeven.toLocaleString()} sales/mo
                          </td>
                          <td className="py-2.5 px-3.5 font-bold text-emerald-700">
                            {currencySymbol}
                            {netMonthlyTurnover.toLocaleString()}/mo
                          </td>
                          <td className="py-2.5 px-3.5 font-bold text-slate-900">
                            {currencySymbol}
                            {grossMonthlySales.toLocaleString()}/mo
                          </td>
                          <td className="py-2.5 px-3.5 font-semibold text-amber-700">
                            {currencySymbol}
                            {vatMonthlyCollected.toLocaleString()}/mo
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ========================================================= */}
            {/* PART E: GRANT ASSESSOR CALIBRATION (PAYMENT TERMS & EXPORT) */}
            {/* ========================================================= */}
            <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 p-4.5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        4. Grant Assessor &amp; Working Capital Calibration ({selectedCountry === 'GB' ? 'UK Innovate UK / Start Up Loans' : 'Ireland LEO / Enterprise Ireland'})
                      </Label>
                      <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-[9px] px-1.5 py-0 font-semibold">
                        Grant Audit Proof
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Grant evaluation committees scrutinize two critical assumptions: debtor cash-inflow timing and export potential.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Section 1: Debtor Days / Cash Timing Lag */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-bold text-slate-900">
                        Payment Terms &amp; Cash Inflow Timing (Debtor Lag)
                      </Label>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        How quickly does customer money hit your bank account after a sale?
                      </p>
                    </div>
                  </div>

                  {/* Payment Terms Selector Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {[
                      {
                        id: 'INSTANT_PAYMENT' as const,
                        label: 'Instant / Card',
                        desc: 'Stripe, checkout, 2-day payout',
                        badge: 'Zero Lag',
                      },
                      {
                        id: 'NET_14_DAYS' as const,
                        label: 'Net 14 Days',
                        desc: 'B2B small business invoice',
                        badge: '2 Wk Lag',
                      },
                      {
                        id: 'NET_30_DAYS' as const,
                        label: 'Net 30 Days',
                        desc: 'Standard commercial invoice',
                        badge: '1 Mo Lag',
                      },
                      {
                        id: 'NET_60_DAYS' as const,
                        label: 'Net 60 Days',
                        desc: 'Enterprise & retail chains',
                        badge: '2 Mo Lag',
                      },
                    ].map((term) => {
                      const isSelected = (step3Data.paymentTerms || 'INSTANT_PAYMENT') === term.id;
                      return (
                        <button
                          key={term.id}
                          type="button"
                          onClick={() =>
                            setStep3Data((prev) => ({
                              ...prev,
                              paymentTerms: term.id,
                            }))
                          }
                          disabled={isVaultReadonly}
                          className={`rounded-lg p-2.5 text-left border transition-all ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/20'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className={`text-xs font-bold ${
                                isSelected ? 'text-indigo-950' : 'text-slate-800'
                              }`}
                            >
                              {term.label}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1 leading-snug line-clamp-2">
                            {term.desc}
                          </p>
                          <span
                            className={`inline-block mt-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {term.badge}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* "Other" Option (Edge-Case Protection Rule) */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        setStep3Data((prev) => ({
                          ...prev,
                          paymentTerms: 'OTHER',
                        }))
                      }
                      className={`text-xs font-medium px-2.5 py-1 rounded-md border transition-all ${
                        step3Data.paymentTerms === 'OTHER'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      + Other Custom Payment Terms
                    </button>
                    {step3Data.paymentTerms === 'OTHER' && (
                      <div className="mt-2">
                        <Input
                          value={step3Data.otherPaymentTermsText || ''}
                          onChange={(e) =>
                            setStep3Data((prev) => ({
                              ...prev,
                              otherPaymentTermsText: e.target.value,
                            }))
                          }
                          placeholder="e.g. 50% upfront deposit on contract signing, 50% on client milestone delivery"
                          className="text-base sm:text-xs"
                        />
                      </div>
                    )}
                  </div>

                  {/* Working Capital Assessor Alert */}
                  {(step3Data.paymentTerms === 'NET_30_DAYS' ||
                    step3Data.paymentTerms === 'NET_60_DAYS') && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-2.5 flex items-start gap-2 text-xs text-amber-950">
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-[11px] leading-relaxed">
                        <strong>Grant Working Capital Notice:</strong> Because customers pay on{' '}
                        {step3Data.paymentTerms === 'NET_30_DAYS' ? '30-day' : '60-day'} credit, your
                        business requires at least{' '}
                        <strong>
                          {currencySymbol}
                          {(
                            totalMonthlyFixedNut *
                            (step3Data.paymentTerms === 'NET_30_DAYS' ? 1.5 : 2.5)
                          ).toLocaleString()}
                        </strong>{' '}
                        in working capital buffer or grant aid to cover monthly wages and rent while waiting for invoices to clear.
                      </div>
                    </div>
                  )}
                </div>

                {/* Section 2: Domestic vs Export Sales Split % */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-xs font-bold text-slate-900">
                          Export vs. Domestic Sales Split (% International)
                        </Label>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {selectedCountry === 'GB'
                            ? 'UK Innovate UK & DBT prioritizes businesses with international trade traction.'
                            : 'LEO & Enterprise Ireland specifically mandate export potential (non-displacement).'}
                        </p>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs font-bold shrink-0">
                        {step3Data.exportSalesPercent ?? 30}% Export
                      </Badge>
                    </div>

                    {/* Export Slider */}
                    <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                        <span>
                          Domestic ({selectedCountry === 'GB' ? 'UK' : 'Ireland'}):{' '}
                          <strong className="text-slate-900">
                            {100 - (step3Data.exportSalesPercent ?? 30)}%
                          </strong>
                        </span>
                        <span className="text-emerald-700 font-bold">
                          Export (International): {step3Data.exportSalesPercent ?? 30}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={step3Data.exportSalesPercent ?? 30}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                          setStep3Data((prev) => ({
                            ...prev,
                            exportSalesPercent: val,
                          }));
                        }}
                        disabled={isVaultReadonly}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>0% (100% Domestic)</span>
                        <span>50% Split</span>
                        <span>100% (Global Pure-Play)</span>
                      </div>
                    </div>

                    {/* Target Export Territories Input */}
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-slate-700">
                        Priority Export Markets / Jurisdictions:
                      </Label>
                      <Input
                        value={step3Data.exportFocusRegions || ''}
                        onChange={(e) =>
                          setStep3Data((prev) => ({
                            ...prev,
                            exportFocusRegions: e.target.value,
                          }))
                        }
                        placeholder={
                          selectedCountry === 'GB'
                            ? 'e.g. EU (Germany, France), United States, Ireland'
                            : 'e.g. United Kingdom, Northern Ireland, United States, EU'
                        }
                        className="text-base sm:text-xs"
                      />
                      <p className="text-[10px] text-slate-500">
                        Included in Module L Appendix grant exports for assessors.
                      </p>
                    </div>
                  </div>

                  {/* Assessor Rule Check Banner */}
                  {(step3Data.exportSalesPercent ?? 30) < 20 ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-2.5 flex items-start gap-2 text-xs text-amber-950">
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-[11px] leading-relaxed">
                        <strong>LEO &amp; EI Warning:</strong> Enterprise Ireland and LEO Priming grants generally require demonstrable export capability (typically 20%+ within 2–3 years) to avoid domestic market displacement.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-2.5 flex items-center gap-2 text-xs text-emerald-950">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span className="text-[11px]">
                        <strong>Grant Assessor Check Passed:</strong> High-potential export focus ({step3Data.exportSalesPercent}%) fulfills Enterprise Ireland HPSU &amp; Innovate UK international growth criteria.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------- */}
            {/* PART F: BREAKEVEN & WORKING CAPITAL ASSESSOR NARRATIVE     */}
            {/* --------------------------------------------------------- */}
            <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-white via-indigo-50/20 to-violet-50/20 p-4.5 space-y-3.5 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-indigo-600" />
                      Grant &amp; Bank Assessor Defense: Written Viability Narrative
                    </Label>
                    <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-[9px] px-1.5 py-0 font-semibold shrink-0">
                      LEO / Innovate UK Ready
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    A formal commercial narrative synthesizing your monthly burn, unit margin, debtor lag, and export additionality for Module L.
                  </p>
                </div>

                <Button
                  size="sm"
                  type="button"
                  variant="outline"
                  onClick={handleGenerateAiBreakevenNarrative}
                  disabled={isGeneratingAiBreakevenNarrative || isVaultReadonly}
                  className="h-8 text-xs font-semibold border-indigo-300 bg-white hover:bg-indigo-50 text-indigo-700 shadow-2xs gap-1.5 shrink-0"
                >
                  {isGeneratingAiBreakevenNarrative ? (
                    <>
                      <Wand2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                      <span>Synthesizing Assessor Defense...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Auto-Generate with AI (Grant Assessor Mode)</span>
                    </>
                  )}
                </Button>
              </div>

              {aiBreakevenNarrativeSuccess && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-2.5 flex items-center gap-2 text-xs text-emerald-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>
                    Successfully generated written assessor justification combining your pocket margin, monthly fixed burn, payment terms, and export strategy!
                  </span>
                </div>
              )}

              {aiBreakevenAssessorTip && (
                <div className="rounded-lg border border-indigo-200 bg-indigo-50/60 p-2.5 flex items-start gap-2 text-xs text-indigo-950">
                  <Lightbulb className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    <strong>Grant Assessor Coaching Tip:</strong> {aiBreakevenAssessorTip}
                  </p>
                </div>
              )}

              <textarea
                rows={4}
                value={step3Data.breakevenNarrative || ''}
                onChange={(e) =>
                  setStep3Data((prev) => ({
                    ...prev,
                    breakevenNarrative: e.target.value,
                  }))
                }
                placeholder="Explain how your venture survives operationally until customer cash clears, why your breakeven unit targets are conservative, and how your export split satisfies grant criteria (or click 'Auto-Generate with AI' above to compose automatically)..."
                className="w-full rounded-md border border-slate-200 p-2.5 text-base sm:text-xs text-slate-900 focus:border-indigo-500 focus:outline-none leading-relaxed bg-white"
              />
            </div>

            {/* Bottom Step 3 Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setOpenStep(2)}
                  className="text-xs text-slate-600"
                >
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                  Back to Step 2
                </Button>
                {saveStatus === 'saved' && (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Step 3 Saved!
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSaveStep3}
                  disabled={saveStatus === 'saving' || isVaultReadonly}
                  className="text-xs text-slate-700"
                >
                  {saveStatus === 'saving' ? 'Saving...' : 'Save Step 3'}
                </Button>

                <Button
                  size="sm"
                  onClick={async () => {
                    await handleSaveStep3();
                    setOpenStep(4);
                    window.scrollTo({ top: 450, behavior: 'smooth' });
                  }}
                  disabled={!isStep3Complete || isVaultReadonly}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                >
                  Next: Sales Velocity &amp; Assumptions (Step 4)
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ------------------------------------------------------------- */}
      {/* PLACEHOLDERS FOR STEPS 4, 5 (Upcoming)                         */}
      {/* ------------------------------------------------------------- */}
      {openStep !== 'ALL' && openStep === 4 && (
        <Card className="rounded-xl border border-indigo-200 bg-indigo-50/20 p-6 text-center space-y-3">
          <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300 text-xs">
            Step 4: Up Next
          </Badge>
          <h3 className="text-base font-bold text-slate-900">
            Step 4: Sales Velocity, Capacity &amp; Written Assumptions
          </h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            Next, we will translate your Year 1 breakeven target of{' '}
            <strong>{computedThreeYearTargets[0]?.customersNeededToBreakeven || 0} sales/month</strong>{' '}
            into realistic conversion rates, sales cycle days, and written assumptions for grant assessors.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setOpenStep(3)}
            className="text-xs text-indigo-700"
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Back to Step 3
          </Button>
        </Card>
      )}
    </div>
  );
}
