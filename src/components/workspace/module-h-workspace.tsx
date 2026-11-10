'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Clock,
  Gauge,
  Users,
  Copy,
  Printer,
  ChevronRight,
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
  SalesAssumptionsStep4Data,
  RevenueBlindSpotAuditStep5Data,
} from '@/lib/auth/session-store';
import type { BlindSpotItem } from '@/db/schema';
import {
  saveModuleHStep1RevenueModelAction,
  saveModuleHStep2PricingTiersAction,
  saveModuleHStep3BreakevenCalculatorAction,
  saveModuleHStep4SalesAssumptionsAction,
  saveModuleHStep5RevenueBriefAction,
  generatePricingStrategyJustificationAction,
  generateBreakevenAssessorNarrativeAction,
  generateSalesAssumptionsNarrativeAction,
  generateModuleHRevenueBriefAction,
} from '@/app/actions/module-h';

interface ModuleHWorkspaceProps {
  plan: ActiveStartupPlan;
  selectedCountry?: string;
  isVaultReadonly?: boolean;
  onSaveStep1RevenueModel?: (step1Data: RevenueModelStep1Data, progress?: number) => Promise<void> | void;
  onSaveStep2PricingTiers?: (step2Data: PricingTiersStep2Data, progress?: number) => Promise<void> | void;
  onSaveStep3BreakevenCalculator?: (step3Data: BreakevenCalculatorStep3Data, progress?: number) => Promise<void> | void;
  onSaveStep4SalesAssumptions?: (step4Data: SalesAssumptionsStep4Data, progress?: number) => Promise<void> | void;
  onSaveStep5RevenueBrief?: (step5Data: RevenueBlindSpotAuditStep5Data, thingsToConsider?: BlindSpotItem[], progress?: number) => Promise<void> | void;
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
  initialStep?: number;
  highlightTarget?: string;
}

export function ModuleHWorkspace({
  plan,
  selectedCountry = 'IE',
  isVaultReadonly = false,
  onSaveStep1RevenueModel,
  onSaveStep2PricingTiers,
  onSaveStep3BreakevenCalculator,
  onSaveStep4SalesAssumptions,
  onSaveStep5RevenueBrief,
  onBackToModuleG,
  onContinueToModuleI,
  onNavigateToModule,
  initialStep,
  highlightTarget,
}: ModuleHWorkspaceProps) {
  // Step expansion state: 0 = all collapsed by default, 1..5, or 'ALL'
  const [openStep, setOpenStep] = useState<number | 'ALL'>(() => {
    if (initialStep && initialStep >= 1 && initialStep <= 5) {
      return initialStep;
    }
    return 0;
  });

  // Handle deep-link scrolling and highlight
  useEffect(() => {
    if (initialStep && initialStep >= 1 && initialStep <= 5) {
      setOpenStep(initialStep);
      setTimeout(() => {
        const targetId = highlightTarget || `module-h-step-${initialStep}`;
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.remove('attention-highlight');
          void el.offsetWidth;
          el.classList.add('attention-highlight');
          setTimeout(() => el.classList.remove('attention-highlight'), 3000);
        }
      }, 250);
    }
  }, [initialStep, highlightTarget]);

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
            deliverablesSummary: 'Full custom capabilities, dedicated account manager, and Promised Delivery & Reply Speed (SLA).',
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

  // -------------------------------------------------------------
  // STEP 4 STATE & CAPACITY SYNC (MODULE E & MODULE H STEP 3)
  // -------------------------------------------------------------
  const [isGeneratingAiSalesNarrative, setIsGeneratingAiSalesNarrative] = useState(false);
  const [aiSalesNarrativeSuccess, setAiSalesNarrativeSuccess] = useState(false);
  const [aiSalesAssessorTip, setAiSalesAssessorTip] = useState<string | null>(null);

  // Cross-module capacity derivation from Module E
  const savedModEOps = plan.moduleEData?.operationsBlueprint;
  const weeklyOpsHours = Number(savedModEOps?.weeklyOpsHoursAllocated) || 25;
  const orderStages = savedModEOps?.orderLifecycleStages || [];
  const totalMinutesPerOrder = orderStages.reduce(
    (acc, s) => acc + (Number(s.activeMinutesPerOrder) || 0),
    0
  );
  const derivedMonthlyCapacity =
    totalMinutesPerOrder > 0
      ? Math.max(5, Math.round(((weeklyOpsHours * 60) / totalMinutesPerOrder) * 4.33))
      : step1Data.revenueModelVehicle === 'SUBSCRIPTION_RECURRING'
      ? 200
      : step1Data.revenueModelVehicle === 'SERVICE_PROJECT_HOURLY'
      ? 15
      : 60;

  const yr1BreakevenUnits = Math.max(1, computedThreeYearTargets[0]?.customersNeededToBreakeven || 35);

  const [step4Data, setStep4Data] = useState<SalesAssumptionsStep4Data>(() => {
    const existing = plan.moduleHData?.step4SalesAssumptions;
    if (existing) {
      return {
        ...existing,
        writtenAssumptionsNarrative: existing.writtenAssumptionsNarrative || '',
        otherSalesMotionText: existing.otherSalesMotionText || '',
        assessorTip: existing.assessorTip || '',
      };
    }

    const initialMotion =
      step1Data.revenueModelVehicle === 'SUBSCRIPTION_RECURRING' ||
      step1Data.revenueModelVehicle === 'USAGE_BASED_METERED'
        ? 'SELF_SERVE_WEB'
        : step1Data.revenueModelVehicle === 'SERVICE_PROJECT_HOURLY'
        ? 'INSIDE_SALES_DEMO'
        : step1Data.revenueModelVehicle === 'ONE_OFF_TRANSACTION'
        ? 'SELF_SERVE_WEB'
        : 'SELF_SERVE_WEB';

    const defaultConv =
      initialMotion === 'SELF_SERVE_WEB'
        ? 2.5
        : initialMotion === 'INSIDE_SALES_DEMO'
        ? 12.0
        : initialMotion === 'ENTERPRISE_RFP'
        ? 25.0
        : 2.0;

    const defaultCycle =
      initialMotion === 'SELF_SERVE_WEB'
        ? 3
        : initialMotion === 'INSIDE_SALES_DEMO'
        ? 21
        : initialMotion === 'ENTERPRISE_RFP'
        ? 60
        : 5;

    const defaultRetention =
      step1Data.revenueModelVehicle === 'SUBSCRIPTION_RECURRING' ? 5 : 25;

    return {
      salesCycleDays: defaultCycle,
      primarySalesMotion: initialMotion,
      otherSalesMotionText: '',
      expectedConversionRatePercent: defaultConv,
      expectedMonthlyChurnOrRepeatPercent: defaultRetention,
      teamMonthlyCapacityCap: derivedMonthlyCapacity,
      capacityFeasibilityStatus:
        derivedMonthlyCapacity >= yr1BreakevenUnits ? 'CAPACITY_SURPLUS' : 'CAPACITY_DEFICIT',
      requiredMonthlyLeads: Math.ceil(yr1BreakevenUnits / (defaultConv / 100)),
      writtenAssumptionsNarrative: '',
      assessorTip: '',
    };
  });

  const conversionRate = Math.max(0.1, step4Data.expectedConversionRatePercent || 2.5);
  const calculatedRequiredMonthlyLeads = Math.ceil(yr1BreakevenUnits / (conversionRate / 100));
  const calculatedDailyLeads = Math.max(1, Math.ceil(calculatedRequiredMonthlyLeads / 30));

  const currentCapacity = step4Data.teamMonthlyCapacityCap || derivedMonthlyCapacity;
  const capacitySurplusOrDeficit = currentCapacity - yr1BreakevenUnits;
  const isCapacitySurplus = capacitySurplusOrDeficit >= 0;

  const isStep4Complete =
    Boolean(step4Data.primarySalesMotion) &&
    (step4Data.primarySalesMotion !== 'OTHER' || Boolean(step4Data.otherSalesMotionText?.trim())) &&
    step4Data.expectedConversionRatePercent > 0 &&
    step4Data.salesCycleDays > 0 &&
    step4Data.teamMonthlyCapacityCap > 0 &&
    Boolean(step4Data.writtenAssumptionsNarrative && step4Data.writtenAssumptionsNarrative.trim().length > 30);

  const SALES_MOTION_OPTIONS = [
    {
      id: 'SELF_SERVE_WEB' as const,
      title: 'Digital Self-Serve',
      subtitle: 'Instant e-commerce or SaaS checkout without manual sales touchpoints.',
      benchmarkConv: '1.5% - 3.5%',
      benchmarkCycle: '1 - 3 days',
      icon: Zap,
    },
    {
      id: 'INSIDE_SALES_DEMO' as const,
      title: 'Consultative Demo',
      subtitle: 'Discovery calls, guided product demos, and consultative onboarding.',
      benchmarkConv: '8% - 18%',
      benchmarkCycle: '14 - 30 days',
      icon: Users,
    },
    {
      id: 'ENTERPRISE_RFP' as const,
      title: 'Enterprise RFP & Tender',
      subtitle: 'Formal proposals, multi-stakeholder procurement, and custom pilot terms.',
      benchmarkConv: '20% - 35%',
      benchmarkCycle: '60 - 120 days',
      icon: Building,
    },
    {
      id: 'RETAIL_MARKETPLACE' as const,
      title: 'Retail & Marketplace',
      subtitle: 'Amazon, Etsy, or retail distributor listings and wholesale orders.',
      benchmarkConv: '1.0% - 3.0%',
      benchmarkCycle: '1 - 7 days',
      icon: ShoppingBag,
    },
    {
      id: 'OTHER' as const,
      title: 'Other Sales Motion',
      subtitle: 'Hybrid sales channel or specialized partnership arrangement.',
      benchmarkConv: 'Custom',
      benchmarkCycle: 'Custom',
      icon: Sliders,
    },
  ];

  // Autosave and dirty state tracking refs
  const isFirstRenderStep1Ref = useRef(true);
  const isDirtyStep1Ref = useRef(false);
  const isFirstRenderStep2Ref = useRef(true);
  const isDirtyStep2Ref = useRef(false);
  const isFirstRenderStep3Ref = useRef(true);
  const isDirtyStep3Ref = useRef(false);
  const isFirstRenderStep4Ref = useRef(true);
  const isDirtyStep4Ref = useRef(false);
  const isFirstRenderStep5Ref = useRef(true);
  const isDirtyStep5Ref = useRef(false);

  // Save Step 1 handler
  const handleSaveStep1 = async (options?: { silent?: boolean } | unknown) => {
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
        isDirtyStep1Ref.current = false;
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
      } else {
        setSaveStatus(onSaveStep1RevenueModel ? 'saved' : 'error');
        if (onSaveStep1RevenueModel) {
          isDirtyStep1Ref.current = false;
          setTimeout(() => setSaveStatus('idle'), 2500);
        }
      }
    } catch (err) {
      console.error('Error during handleSaveStep1:', err);
      setSaveStatus(onSaveStep1RevenueModel ? 'saved' : 'error');
      if (onSaveStep1RevenueModel) {
        isDirtyStep1Ref.current = false;
        setTimeout(() => setSaveStatus('idle'), 2500);
      }
    }
  };

  // Save Step 2 handler
  const handleSaveStep2 = async (options?: { silent?: boolean } | unknown) => {
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
        isDirtyStep2Ref.current = false;
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
      } else {
        setSaveStatus(onSaveStep2PricingTiers ? 'saved' : 'error');
        if (onSaveStep2PricingTiers) {
          isDirtyStep2Ref.current = false;
          setTimeout(() => setSaveStatus('idle'), 2500);
        }
      }
    } catch (err) {
      console.error('Error during handleSaveStep2:', err);
      setSaveStatus(onSaveStep2PricingTiers ? 'saved' : 'error');
      if (onSaveStep2PricingTiers) {
        isDirtyStep2Ref.current = false;
        setTimeout(() => setSaveStatus('idle'), 2500);
      }
    }
  };

  // Save Step 3 handler
  const handleSaveStep3 = async (options?: { silent?: boolean } | unknown) => {
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
        isDirtyStep3Ref.current = false;
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
      } else {
        setSaveStatus(onSaveStep3BreakevenCalculator ? 'saved' : 'error');
        if (onSaveStep3BreakevenCalculator) {
          isDirtyStep3Ref.current = false;
          setTimeout(() => setSaveStatus('idle'), 2500);
        }
      }
    } catch (err) {
      console.error('Error during handleSaveStep3:', err);
      setSaveStatus(onSaveStep3BreakevenCalculator ? 'saved' : 'error');
      if (onSaveStep3BreakevenCalculator) {
        isDirtyStep3Ref.current = false;
        setTimeout(() => setSaveStatus('idle'), 2500);
      }
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

  // Save Step 4 handler
  const handleSaveStep4 = async (options?: { silent?: boolean } | unknown) => {
    if (isVaultReadonly) return;
    setSaveStatus('saving');
    try {
      const updatedStep4: SalesAssumptionsStep4Data = {
        ...step4Data,
        capacityFeasibilityStatus: isCapacitySurplus ? 'CAPACITY_SURPLUS' : 'CAPACITY_DEFICIT',
        requiredMonthlyLeads: calculatedRequiredMonthlyLeads,
      };
      if (onSaveStep4SalesAssumptions) {
        await onSaveStep4SalesAssumptions(updatedStep4, isStep4Complete ? 80 : 65);
      }
      const res = await saveModuleHStep4SalesAssumptionsAction({
        planId: plan.id,
        salesAssumptions: updatedStep4,
        completionPercentage: isStep4Complete ? 80 : 65,
      });
      if (res.ok) {
        isDirtyStep4Ref.current = false;
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
      } else {
        setSaveStatus(onSaveStep4SalesAssumptions ? 'saved' : 'error');
        if (onSaveStep4SalesAssumptions) {
          isDirtyStep4Ref.current = false;
          setTimeout(() => setSaveStatus('idle'), 2500);
        }
      }
    } catch (err) {
      console.error('Error during handleSaveStep4:', err);
      setSaveStatus(onSaveStep4SalesAssumptions ? 'saved' : 'error');
      if (onSaveStep4SalesAssumptions) {
        isDirtyStep4Ref.current = false;
        setTimeout(() => setSaveStatus('idle'), 2500);
      }
    }
  };

  const buildClientSalesAssumptionsFallback = () => {
    const isIE = (plan.hqCountryCode || selectedCountry || 'IE') === 'IE';
    const agencyName = isIE ? 'LEO / Enterprise Ireland' : 'Innovate UK / Start Up Loans';
    const motionLabel =
      step4Data.primarySalesMotion === 'SELF_SERVE_WEB'
        ? 'frictionless digital self-serve checkout'
        : step4Data.primarySalesMotion === 'INSIDE_SALES_DEMO'
        ? 'guided product demo and consultative discovery calls'
        : step4Data.primarySalesMotion === 'ENTERPRISE_RFP'
        ? 'formal commercial proposals and RFP tendering'
        : step4Data.primarySalesMotion === 'RETAIL_MARKETPLACE'
        ? 'e-commerce marketplace storefront listings and fulfillment'
        : 'direct founder sales outreach';

    const p1 = `Commercial Acquisition & Conversion Mechanics: Customer conversion is driven via ${motionLabel} anchored on ${
      moduleDChannelMatrix?.primaryChannel || 'direct digital channels'
    }. To hit the Year 1 breakeven target of ${yr1BreakevenUnits.toLocaleString()} paying customers per month, our financial plan assumes a conservative blended conversion rate of ${
      step4Data.expectedConversionRatePercent
    }%. This necessitates generating approximately ${calculatedRequiredMonthlyLeads.toLocaleString()} qualified pipeline prospects/visitors per month (~${calculatedDailyLeads.toLocaleString()} daily). Given the defined target buyer profile, this acquisition velocity represents an attainable top-of-funnel operational target.`;

    const p2 = `Pipeline Velocity & Revenue Realization Lag: The average sales cycle from first engagement to payment settlement is calibrated at ${
      step4Data.salesCycleDays
    } days. This accounts for realistic customer review cycles, invoice payment terms, and gateway clearance. Working capital buffers and non-dilutive grant support bridge this conversion cycle so operations remain stable through customer onboarding.`;

    const p3 = `Operational Delivery Capacity & Scalability: Team operational delivery capacity is currently capped at ${currentCapacity.toLocaleString()} orders/clients per month under existing allocations. Comparing this ceiling against the required breakeven volume of ${yr1BreakevenUnits.toLocaleString()} units demonstrates that the venture can achieve cashflow profitability ${
      isCapacitySurplus
        ? `comfortably within current operational capacity, leaving a protective surplus buffer of ${capacitySurplusOrDeficit.toLocaleString()} units/month before requiring new operational hires`
        : `with planned capacity expansion and key team hires scheduled in early Year 1`
    }, safeguarding product delivery quality and meeting ${agencyName} commercial viability requirements.`;

    return {
      narrative: `${p1}\n\n${p2}\n\n${p3}`,
      tip: isIE
        ? 'LEO assessors will evaluate whether your conversion rate assumptions are grounded in real-world benchmark data rather than optimistic speculation.'
        : 'Innovate UK evaluators verify that your required daily lead volume aligns with your marketing budget and team operational bandwidth.',
    };
  };

  const handleGenerateAiSalesNarrative = async () => {
    if (isGeneratingAiSalesNarrative || isVaultReadonly) return;
    setIsGeneratingAiSalesNarrative(true);
    setAiSalesNarrativeSuccess(false);

    const isRecurring =
      step1Data.revenueModelVehicle === 'SUBSCRIPTION_RECURRING' ||
      step1Data.revenueModelVehicle === 'USAGE_BASED_METERED';

    try {
      const res = await generateSalesAssumptionsNarrativeAction({
        planId: plan.id,
        salesMotion: step4Data.primarySalesMotion,
        salesCycleDays: step4Data.salesCycleDays,
        conversionRatePercent: step4Data.expectedConversionRatePercent,
        breakevenMonthlyUnits: yr1BreakevenUnits,
        requiredMonthlyLeads: calculatedRequiredMonthlyLeads,
        monthlyCapacityCap: currentCapacity,
        capacityFeasibilityStatus: isCapacitySurplus ? 'CAPACITY_SURPLUS' : 'CAPACITY_DEFICIT',
        retentionMetricLabel: isRecurring ? 'monthly churn rate' : '30-day repeat re-order rate',
        retentionPercent: step4Data.expectedMonthlyChurnOrRepeatPercent,
        planTitle: plan.title,
        industryCategory: plan.industryCategory,
        hqCountryCode: (plan.hqCountryCode as any) || (selectedCountry as any) || 'IE',
        primaryChannel: moduleDChannelMatrix?.primaryChannel || 'Direct Web',
        beachheadCustomer:
          plan.moduleBData?.beachhead?.beachheadSegment ||
          plan.moduleBData?.beachhead?.decisionMakerRole ||
          '',
      });

      if (res && res.narrative && res.narrative.trim().length > 0) {
        setStep4Data((prev) => ({
          ...prev,
          writtenAssumptionsNarrative: res.narrative.trim(),
          assessorTip: res.assessorTip || prev.assessorTip,
        }));
        setAiSalesAssessorTip(res.assessorTip || null);
        setAiSalesNarrativeSuccess(true);
        setTimeout(() => setAiSalesNarrativeSuccess(false), 5000);
      } else {
        const clientFallback = buildClientSalesAssumptionsFallback();
        setStep4Data((prev) => ({
          ...prev,
          writtenAssumptionsNarrative: clientFallback.narrative,
          assessorTip: clientFallback.tip,
        }));
        setAiSalesAssessorTip(clientFallback.tip);
        setAiSalesNarrativeSuccess(true);
        setTimeout(() => setAiSalesNarrativeSuccess(false), 5000);
      }
    } catch (e) {
      console.warn('AI sales narrative generation failed, falling back to client synthesizer:', e);
      const clientFallback = buildClientSalesAssumptionsFallback();
      setStep4Data((prev) => ({
        ...prev,
        writtenAssumptionsNarrative: clientFallback.narrative,
        assessorTip: clientFallback.tip,
      }));
      setAiSalesAssessorTip(clientFallback.tip);
      setAiSalesNarrativeSuccess(true);
      setTimeout(() => setAiSalesNarrativeSuccess(false), 5000);
    } finally {
      setIsGeneratingAiSalesNarrative(false);
    }
  };

  // -------------------------------------------------------------
  // STEP 5 STATE: REVENUE STRATEGY & POCKET PROFIT BRIEF
  // -------------------------------------------------------------
  const [isGeneratingAiBrief, setIsGeneratingAiBrief] = useState(false);
  const [aiBriefSuccess, setAiBriefSuccess] = useState(false);
  const [aiBriefAssessorTip, setAiBriefAssessorTip] = useState<string | null>(null);
  const [copiedBrief, setCopiedBrief] = useState(false);

  const buildClientRevenueBriefFallback = () => {
    const isIE = (plan.hqCountryCode || selectedCountry || 'IE') === 'IE';
    const sym = currencySymbol;
    const price = blendedAveragePrice || 49;
    const profit = pocketProfitPerSale || 38;
    const margin = contributionMarginPercent || 78;
    const nut = totalMonthlyFixedNut || 3200;
    const breakeven = yr1BreakevenUnits || 85;
    const cap = currentCapacity || 120;
    const hasSurplus = cap >= breakeven;

    const blindSpots: BlindSpotItem[] = [
      {
        id: 'bs-rev-margin',
        title: margin < 65 ? 'Tight Contribution Margin Buffer' : 'Margin Resiliency & Price Elasticity',
        category: 'COMMERCIAL_PRICING',
        severity: margin < 65 ? 'CRITICAL' : 'WARNING',
        explanation: `With a ${margin}% contribution margin (${sym}${profit} net pocket profit per sale), unexpected increases in platform gateway charges, merchant processing fees, or direct COGS could compress your operational cushion.`,
        suggestedAction: `Stress-test a 10-15% increase in variable fulfillment fees. Ensure your premium tier or volume add-ons provide an accretive gross margin above 80% to protect net cash flow.`,
      },
      {
        id: 'bs-rev-cashflow-gap',
        title: 'Debtor Settlement Lag vs. Monthly Payroll Nut',
        category: 'WORKING_CAPITAL',
        severity: 'WARNING',
        explanation: `Your monthly fixed baseline commitments total ${sym}${nut.toLocaleString()}. Payment gateway settlement delays (3-7 days for online, or 30-60 days for invoicing) create a working capital timing trough before incoming debtor cash clears.`,
        suggestedAction: `Maintain a minimum 2-3 month cash buffer or secure non-dilutive grant reimbursement timing (such as LEO Feasibility/Priming or Innovate UK Smart Grant advances) to prevent cash-starvation during peak customer delivery.`,
      },
      {
        id: 'bs-rev-capacity-ceiling',
        title: hasSurplus ? 'Delivery Capacity Buffer Confirmed' : 'Capacity Bottleneck Under Breakeven Target',
        category: 'OPERATIONAL_CAPACITY',
        severity: hasSurplus ? 'INFO' : 'CRITICAL',
        explanation: hasSurplus
          ? `Your current operational delivery capacity (${cap.toLocaleString()} units/mo) safely accommodates the Year 1 breakeven requirement (${breakeven.toLocaleString()} units/mo), leaving a healthy operational surplus buffer.`
          : `Your monthly delivery capacity of ${cap.toLocaleString()} units is currently below the ${breakeven.toLocaleString()} units required to hit operational breakeven, indicating a founder burnout or under-resourcing risk.`,
        suggestedAction: hasSurplus
          ? `Preserve product quality by monitoring turnaround times as sales volume scales past 75% of your current delivery ceiling.`
          : `Schedule additional operational headcount or automate fulfillment workflows (Module E) before initiating aggressive acquisition marketing in Module I.`,
      },
      {
        id: 'bs-rev-vat-threshold',
        title: isIE ? 'Irish Revenue VAT Threshold Proximity (€42.5k / €85k)' : 'HMRC UK VAT Registration Threshold (£90,000)',
        category: 'STATUTORY_COMPLIANCE',
        severity: 'WARNING',
        explanation: isIE
          ? `Reaching Year 1 commercial targets will quickly approach Irish VAT registration thresholds (€42,500 for services, €85,000 for physical goods). Pricing must anticipate 23% or 13.5% VAT liabilities.`
          : `Annualizing your breakeven revenue puts you within range of the UK £90,000 rolling 12-month VAT threshold, which immediately introduces a 20% standard VAT deduction on gross customer receipts.`,
        suggestedAction: `Verify whether your headline prices to consumers are gross (VAT-inclusive) or net of tax to prevent an unexpected 20-23% reduction in pocket contribution upon statutory registration.`,
      },
    ];

    const p1 = `Commercial Revenue Architecture: The commercial model is structured around a verified ${
      step1Data.revenueModelVehicle ? REVENUE_VEHICLE_OPTIONS.find((v) => v.id === step1Data.revenueModelVehicle)?.title || 'recurring subscription' : 'recurring subscription'
    } monetization strategy delivering an average blended net realization of ${sym}${price.toLocaleString()}. Deducting platform processing fees, gateway deductions, and direct delivery COGS leaves a net pocket contribution of ${sym}${profit.toLocaleString()} per transaction (${margin}% contribution margin).`;

    const p2 = `Breakeven Math & Financial Viability: Total baseline fixed overheads and scheduled founder survival commitments require ${sym}${nut.toLocaleString()} per month in Year 1. To cover this nut and reach cashflow breakeven, the business must transact ${breakeven.toLocaleString()} customer units monthly, generating ${sym}${(
      breakeven * price
    ).toLocaleString()} in gross monthly commercial revenue.`;

    const p3 = `Operational Delivery & Conversion Feasibility: Current operational bandwidth supports up to ${cap.toLocaleString()} deliveries per month. Comparing this ceiling against the ${breakeven.toLocaleString()} breakeven requirement demonstrates ${
      hasSurplus
        ? `a comfortable operational surplus buffer, confirming that the business can scale into commercial profitability without immediate operational breakdown`
        : `that early operational capacity expansion will be essential as acquisition ramps up`
    }. Combined with realistic pipeline conversion assumptions, this structure satisfies the strict commercial viability criteria required by ${
      isIE ? 'LEO and Enterprise Ireland' : 'Innovate UK and British Business Bank'
    } evaluators.`;

    const defaultConfidence: RevenueBlindSpotAuditStep5Data['revenueReadinessConfidence'] =
      hasSurplus && margin >= 65 ? 'READY_FOR_COMMERCIAL_LAUNCH' : 'PRICING_TESTING_RECOMMENDED';

    return {
      blindSpots,
      revenueReadinessConfidence: defaultConfidence,
      executiveCommercialSummaryNarrative: `${p1}\n\n${p2}\n\n${p3}`,
      assessorTip: isIE
        ? 'LEO evaluation committees prioritize ventures demonstrating a clear contribution margin buffer (>65%) that can absorb early marketing inefficiencies and debtor collection lags.'
        : 'Innovate UK and Start Up Loans assessors look for proof that your breakeven unit count does not exceed the realistic operational delivery bandwidth of your current team.',
    };
  };

  const [step5Data, setStep5Data] = useState<RevenueBlindSpotAuditStep5Data>(() => {
    const existing = plan.moduleHData?.step5RevenueBrief;
    if (existing && existing.blindSpots?.length > 0) return existing;
    const fallback = buildClientRevenueBriefFallback();
    return {
      blindSpots: fallback.blindSpots,
      revenueReadinessConfidence: fallback.revenueReadinessConfidence,
      otherReadinessConfidenceText: '',
      executiveCommercialSummaryNarrative: fallback.executiveCommercialSummaryNarrative,
      aiAssessorTip: fallback.assessorTip,
      aiEngineUsed: 'smart-synthesizer',
    };
  });

  const isStep5Complete =
    Boolean(step5Data.executiveCommercialSummaryNarrative?.trim().length > 40) &&
    Boolean(step5Data.revenueReadinessConfidence);

  const completedCoreStepsCount =
    (isStep1Complete ? 1 : 0) +
    (isStep2Complete ? 1 : 0) +
    (isStep3Complete ? 1 : 0) +
    (isStep4Complete ? 1 : 0);

  const handleSaveStep5 = async (options?: { silent?: boolean } | unknown) => {
    if (isVaultReadonly) return;
    setSaveStatus('saving');
    try {
      const updatedStep5: RevenueBlindSpotAuditStep5Data = {
        ...step5Data,
        lastSavedAt: new Date().toISOString(),
      };
      if (onSaveStep5RevenueBrief) {
        await onSaveStep5RevenueBrief(updatedStep5, updatedStep5.blindSpots, 100);
      }
      const res = await saveModuleHStep5RevenueBriefAction({
        planId: plan.id,
        revenueBrief: updatedStep5,
        thingsToConsider: updatedStep5.blindSpots,
        completionPercentage: 100,
      });
      if (res.ok) {
        isDirtyStep5Ref.current = false;
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
      } else {
        setSaveStatus(onSaveStep5RevenueBrief ? 'saved' : 'error');
        if (onSaveStep5RevenueBrief) {
          isDirtyStep5Ref.current = false;
          setTimeout(() => setSaveStatus('idle'), 2500);
        }
      }
    } catch (err) {
      console.error('Error during handleSaveStep5:', err);
      setSaveStatus(onSaveStep5RevenueBrief ? 'saved' : 'error');
      if (onSaveStep5RevenueBrief) {
        isDirtyStep5Ref.current = false;
        setTimeout(() => setSaveStatus('idle'), 2500);
      }
    }
  };

  // Step 1 Debounced Autosave (1200ms)
  useEffect(() => {
    if (isFirstRenderStep1Ref.current) {
      isFirstRenderStep1Ref.current = false;
      return;
    }
    if (isVaultReadonly) return;
    isDirtyStep1Ref.current = true;
    const timer = setTimeout(() => {
      if (isDirtyStep1Ref.current) {
        void handleSaveStep1({ silent: true });
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [step1Data]);

  // Step 2 Debounced Autosave (1200ms)
  useEffect(() => {
    if (isFirstRenderStep2Ref.current) {
      isFirstRenderStep2Ref.current = false;
      return;
    }
    if (isVaultReadonly) return;
    isDirtyStep2Ref.current = true;
    const timer = setTimeout(() => {
      if (isDirtyStep2Ref.current) {
        void handleSaveStep2({ silent: true });
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [step2Data]);

  // Step 3 Debounced Autosave (1200ms)
  useEffect(() => {
    if (isFirstRenderStep3Ref.current) {
      isFirstRenderStep3Ref.current = false;
      return;
    }
    if (isVaultReadonly) return;
    isDirtyStep3Ref.current = true;
    const timer = setTimeout(() => {
      if (isDirtyStep3Ref.current) {
        void handleSaveStep3({ silent: true });
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [step3Data]);

  // Step 4 Debounced Autosave (1200ms)
  useEffect(() => {
    if (isFirstRenderStep4Ref.current) {
      isFirstRenderStep4Ref.current = false;
      return;
    }
    if (isVaultReadonly) return;
    isDirtyStep4Ref.current = true;
    const timer = setTimeout(() => {
      if (isDirtyStep4Ref.current) {
        void handleSaveStep4({ silent: true });
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [step4Data]);

  // Step 5 Debounced Autosave (1200ms)
  useEffect(() => {
    if (isFirstRenderStep5Ref.current) {
      isFirstRenderStep5Ref.current = false;
      return;
    }
    if (isVaultReadonly) return;
    isDirtyStep5Ref.current = true;
    const timer = setTimeout(() => {
      if (isDirtyStep5Ref.current) {
        void handleSaveStep5({ silent: true });
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [step5Data]);

  // Flush on unmount so switching modules never loses changes
  useEffect(() => {
    return () => {
      if (isDirtyStep1Ref.current) void handleSaveStep1({ silent: true });
      if (isDirtyStep2Ref.current) void handleSaveStep2({ silent: true });
      if (isDirtyStep3Ref.current) void handleSaveStep3({ silent: true });
      if (isDirtyStep4Ref.current) void handleSaveStep4({ silent: true });
      if (isDirtyStep5Ref.current) void handleSaveStep5({ silent: true });
    };
  }, []);

  const handleGenerateAiRevenueBrief = async () => {
    if (isGeneratingAiBrief || isVaultReadonly) return;
    setIsGeneratingAiBrief(true);
    setAiBriefSuccess(false);

    try {
      const res = await generateModuleHRevenueBriefAction({
        planId: plan.id,
        currencySymbol,
        revenueModelVehicle: step1Data.revenueModelVehicle || 'SUBSCRIPTION_RECURRING',
        blendedAveragePrice: simulatedNetPrice || blendedAveragePrice,
        pocketProfitPerSale,
        contributionMarginPercent,
        yr1BreakevenUnits,
        monthlyFixedNut: totalMonthlyFixedNut,
        salesMotion: step4Data.primarySalesMotion || 'SELF_SERVE_WEB',
        monthlyCapacity: currentCapacity,
        planTitle: plan.title,
        industryCategory: plan.industryCategory,
        hqCountryCode: (plan.hqCountryCode as any) || (selectedCountry as any) || 'IE',
      });

      if (res && res.executiveCommercialSummaryNarrative) {
        setStep5Data((prev) => ({
          ...prev,
          executiveCommercialSummaryNarrative: res.executiveCommercialSummaryNarrative.trim(),
          blindSpots: res.blindSpots?.length ? res.blindSpots : prev.blindSpots,
          revenueReadinessConfidence: res.revenueReadinessConfidence || prev.revenueReadinessConfidence,
          aiAssessorTip: res.assessorTip || prev.aiAssessorTip,
          aiEngineUsed: res.engineMode || 'gemini-2.5-flash',
        }));
        setAiBriefAssessorTip(res.assessorTip || null);
        setAiBriefSuccess(true);
        setTimeout(() => setAiBriefSuccess(false), 5000);
      } else {
        const clientFallback = buildClientRevenueBriefFallback();
        setStep5Data((prev) => ({
          ...prev,
          executiveCommercialSummaryNarrative: clientFallback.executiveCommercialSummaryNarrative,
          blindSpots: clientFallback.blindSpots,
          revenueReadinessConfidence: clientFallback.revenueReadinessConfidence,
          aiAssessorTip: clientFallback.assessorTip,
          aiEngineUsed: 'smart-synthesizer',
        }));
        setAiBriefAssessorTip(clientFallback.assessorTip);
        setAiBriefSuccess(true);
        setTimeout(() => setAiBriefSuccess(false), 5000);
      }
    } catch (e) {
      console.warn('AI revenue brief generation error, using fallback:', e);
      const clientFallback = buildClientRevenueBriefFallback();
      setStep5Data((prev) => ({
        ...prev,
        executiveCommercialSummaryNarrative: clientFallback.executiveCommercialSummaryNarrative,
        blindSpots: clientFallback.blindSpots,
        revenueReadinessConfidence: clientFallback.revenueReadinessConfidence,
        aiAssessorTip: clientFallback.assessorTip,
        aiEngineUsed: 'smart-synthesizer',
      }));
      setAiBriefAssessorTip(clientFallback.assessorTip);
      setAiBriefSuccess(true);
      setTimeout(() => setAiBriefSuccess(false), 5000);
    } finally {
      setIsGeneratingAiBrief(false);
    }
  };

  const handleCopyMarkdownBrief = () => {
    const md = `# Commercial Revenue Strategy & Pocket Profit Dossier: ${plan.title || 'Startup Venture'}
*Module H: Revenue, Pricing, Breakeven & Sales Velocity Brief*

## 1. Commercial Snapshot & Unit Economics
- **Revenue Model**: ${step1Data.revenueModelVehicle ? REVENUE_VEHICLE_OPTIONS.find((v) => v.id === step1Data.revenueModelVehicle)?.title : 'Not specified'}
- **Blended Net Unit Price**: ${currencySymbol}${blendedAveragePrice.toLocaleString()}
- **Direct Variable Deductions**: -${currencySymbol}${totalFrictionPerSale.toLocaleString()} (Gateway: ${currencySymbol}${gatewayFeeAmount.toFixed(2)}, COGS: ${currencySymbol}${directCogsAmount.toFixed(2)}, Buffer: ${currencySymbol}${refundAndAffiliateFeeAmount.toFixed(2)})
- **Net Pocket Contribution**: ${currencySymbol}${pocketProfitPerSale.toLocaleString()} (${contributionMarginPercent}% contribution margin)
- **Monthly Fixed Baseline Commitment (Nut)**: ${currencySymbol}${totalMonthlyFixedNut.toLocaleString()}/mo (Payroll: ${currencySymbol}${activeMonthlyPayroll.toLocaleString()}, Overheads: ${currencySymbol}${activeMonthlyOverheads.toLocaleString()})

## 2. 3-Year Breakeven & Revenue Horizon
- **Year 1 Target**: ${computedThreeYearTargets[0]?.customersNeededToBreakeven || 0} paying sales/month to break even (${currencySymbol}${(computedThreeYearTargets[0]?.monthlyRevenueAtBreakeven || 0).toLocaleString()}/mo)
- **Year 2 Target**: ${computedThreeYearTargets[1]?.customersNeededToBreakeven || 0} paying sales/month to break even (${currencySymbol}${(computedThreeYearTargets[1]?.monthlyRevenueAtBreakeven || 0).toLocaleString()}/mo)
- **Year 3 Target**: ${computedThreeYearTargets[2]?.customersNeededToBreakeven || 0} paying sales/month to break even (${currencySymbol}${(computedThreeYearTargets[2]?.monthlyRevenueAtBreakeven || 0).toLocaleString()}/mo)

## 3. Sales Motion, Conversion Velocity & Capacity
- **Primary Sales Motion**: ${step4Data.primarySalesMotion ? SALES_MOTION_OPTIONS.find((m) => m.id === step4Data.primarySalesMotion)?.title : 'Digital Self-Serve'}
- **Expected Conversion Rate**: ${step4Data.expectedConversionRatePercent}%
- **Sales Cycle Timing**: ${step4Data.salesCycleDays} days
- **Required Monthly Pipeline**: ${calculatedRequiredMonthlyLeads} qualified leads/mo (~${calculatedDailyLeads}/day)
- **Monthly Operational Delivery Ceiling**: ${currentCapacity} units/mo (${isCapacitySurplus ? `Surplus buffer of +${capacitySurplusOrDeficit} units/mo` : `Deficit warning of ${capacitySurplusOrDeficit} units/mo`})

## 4. Executive Commercial Assessment Narrative
${step5Data.executiveCommercialSummaryNarrative}

## 5. Commercial Diligence & Things to Consider
${step5Data.blindSpots.map((b, i) => `${i + 1}. [${b.severity}] ${b.title}: ${b.explanation}\n   *Mitigation / Action*: ${b.suggestedAction}`).join('\n')}
`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(md);
      setCopiedBrief(true);
      setTimeout(() => setCopiedBrief(false), 3000);
    }
  };

  const handleUpdateBlindSpot = (id: string, updates: Partial<BlindSpotItem>) => {
    setStep5Data((prev) => ({
      ...prev,
      blindSpots: prev.blindSpots.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    }));
  };

  const handleAddCustomBlindSpot = () => {
    const newItem: BlindSpotItem = {
      id: `bs-custom-${Date.now()}`,
      title: 'Custom Commercial Consideration',
      category: 'COMMERCIAL_PRICING',
      severity: 'WARNING',
      explanation: 'Document an additional pricing, debtor, or supplier factor for your plan.',
      suggestedAction: 'Define the mitigating operational action or timeline.',
    };
    setStep5Data((prev) => ({
      ...prev,
      blindSpots: [...prev.blindSpots, newItem],
    }));
  };

  const handleParkBlindSpotInOpenQuestions = (b: BlindSpotItem) => {
    if (plan.openQuestions) {
      const questionText = `[Revenue & Pricing]: ${b.title} — ${b.explanation} (Action: ${b.suggestedAction})`;
      if (!plan.openQuestions.includes(questionText)) {
        plan.openQuestions.push(questionText);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* TOP HEADER MODULE CARD                                        */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-950 via-indigo-900 to-violet-900 p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-indigo-400/40 bg-indigo-500/30 text-indigo-100 text-[10px] shrink-0">
                Module H • Pricing &amp; Breakeven Engine
              </Badge>
              <Badge className="border-emerald-400/30 bg-emerald-500/20 text-emerald-200 text-[10px] shrink-0">
                <Sparkles className="mr-1 h-3 w-3" />
                {completedCoreStepsCount} of 4 Core Steps Ready
              </Badge>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Module H: Pricing Architect &amp; Pocket Profit Engine
            </h1>
            <p className="max-w-2xl text-xs text-indigo-100/90 sm:text-sm">
              How you get paid, what your profit looks like after Stripe fees and product costs,
              and exactly how many sales you need to pay yourself and your team each year.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setOpenStep(openStep === 'ALL' ? 1 : 'ALL')}
                className="border-indigo-400/40 bg-white/10 text-xs text-white hover:bg-white/20"
              >
                <Sliders className="mr-1.5 h-3.5 w-3.5" />
                {openStep === 'ALL' ? 'Focus Step-by-Step' : 'Expand All Steps'}
              </Button>
              {onBackToModuleG && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onBackToModuleG}
                  className="border-indigo-400/40 bg-white/10 text-xs text-white hover:bg-white/20"
                >
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                  Back to Module G
                </Button>
              )}
            </div>
            <div className="text-right text-[11px] text-indigo-200">
              Module H Progress: <strong>{Math.round((completedCoreStepsCount / 4) * 100)}%</strong> ({completedCoreStepsCount} of 4 Core Steps Ready)
            </div>
          </div>
        </div>

        {/* Step Navigation Strip (Tile Grid matching Modules A, B, C, D, E, F, G) */}
        <div className="mt-5 grid grid-cols-2 gap-2 border-t border-indigo-800/70 pt-4 sm:grid-cols-3 lg:grid-cols-5">
          {[
            {
              step: 'Step 1',
              title: 'Revenue Model',
              targetId: 'module-h-step-1',
              stepNum: 1,
              done: isStep1Complete,
            },
            {
              step: 'Step 2',
              title: 'Pricing Tiers',
              targetId: 'module-h-step-2',
              stepNum: 2,
              done: isStep2Complete,
            },
            {
              step: 'Step 3',
              title: 'Breakeven Engine',
              targetId: 'module-h-step-3',
              stepNum: 3,
              done: isStep3Complete,
            },
            {
              step: 'Step 4',
              title: 'Sales Velocity',
              targetId: 'module-h-step-4',
              stepNum: 4,
              done: isStep4Complete,
            },
            {
              step: 'Overview',
              title: 'Revenue Brief',
              targetId: 'module-h-step-5',
              stepNum: 5,
              done: isStep5Complete,
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

      {/* ------------------------------------------------------------- */}
      {/* STEP 1: REVENUE MODEL & WHAT YOU CHARGE FOR                   */}
      {/* ------------------------------------------------------------- */}
      {openStep !== 'ALL' && openStep !== 1 ? (
        // COLLAPSED STEP 1
        <div
          id="module-h-step-1"
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
                className={`text-[10px] shrink-0 font-medium ${
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
                {isStep1Complete ? 'Edit Step' : 'Open Step'}
                <ChevronDown className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // EXPANDED STEP 1
        <Card id="module-h-step-1" className="scroll-mt-24 rounded-xl border border-slate-200 bg-white shadow-xs">
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
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base font-bold text-slate-900">
                      Step 1: How You Make Money (Revenue Model)
                    </CardTitle>
                    <Badge
                      variant={isStep1Complete ? 'default' : 'outline'}
                      className={`text-[10px] shrink-0 font-medium ${
                        isStep1Complete
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'border-slate-300 text-slate-600'
                      }`}
                    >
                      {isStep1Complete ? 'Completed' : 'In Progress'}
                    </Badge>
                  </div>
                  <CardDescription className="mt-1 text-xs text-slate-600">
                    How cash flows into your bank account. Choose the main way you charge customers.
                  </CardDescription>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
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
            </div>

            {/* 4-Layer Support Strip: Micro-Coaching & Examples */}
            <div className="mt-3 flex flex-wrap items-center gap-2 pt-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setActiveWhyCard((prev) => (prev === 1 ? null : 1))}
                className="h-7 border-indigo-200 text-[11px] font-medium text-indigo-700 hover:bg-indigo-50"
              >
                <HelpCircle className="mr-1 h-3.5 w-3.5" />
                Why Are We Asking This?
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setActiveExampleCard((prev) => (prev === 1 ? null : 1))}
                className="h-7 border-emerald-200 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50"
              >
                <Lightbulb className="mr-1 h-3.5 w-3.5" />
                Show Me an Example
              </Button>
            </div>

            {activeWhyCard === 1 && (
              <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50/70 p-3.5 text-xs text-indigo-900">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                    <div className="space-y-1">
                      <p className="font-semibold text-indigo-950">
                        Why Grant Officers &amp; Banks Need This First:
                      </p>
                      <p className="text-indigo-900/90 leading-relaxed">
                        Every financial forecast depends on how you charge. A subscription business has
                        predictable monthly recurring cashflow, while an ecommerce or agency business
                        relies on repeat orders or continuous client acquisition. Setting this right ensures
                        the Breakeven Engine in Step 3 applies the exact right fee and salary formulas.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveWhyCard(null)}
                    className="text-indigo-500 hover:text-indigo-800 text-xs px-1"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {activeExampleCard === 1 && (
              <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/70 p-3.5 text-xs text-emerald-950">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <div className="space-y-1">
                      <p className="font-semibold text-emerald-900">
                        Real-World Revenue Model Examples:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2 text-[11px]">
                        <div className="rounded-lg bg-white p-2.5 border border-emerald-200">
                          <strong className="text-slate-900">SaaS / App</strong>
                          <p className="mt-1 text-slate-600">
                            €39/month per organization, billed annually with a 2-month free discount.
                          </p>
                        </div>
                        <div className="rounded-lg bg-white p-2.5 border border-emerald-200">
                          <strong className="text-slate-900">Physical Craft / Food</strong>
                          <p className="mt-1 text-slate-600">
                            €24 per unit wholesale or €48 DTC online, with 3-pack bundle incentives.
                          </p>
                        </div>
                        <div className="rounded-lg bg-white p-2.5 border border-emerald-200">
                          <strong className="text-slate-900">Service / Agency</strong>
                          <p className="mt-1 text-slate-600">
                            €1,500 setup fee + €750/month ongoing maintenance &amp; priority SLA.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveExampleCard(null)}
                    className="text-emerald-500 hover:text-emerald-800 text-xs px-1"
                  >
                    ✕
                  </button>
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
                    3. What Unit You Charge For (e.g., per bottle, per user, per month) — Value Metric
                  </Label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Your &ldquo;Value Metric&rdquo; is simply the unit on your price tag—like charging per box shipped, per active team member, or per completed project.
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
          id="module-h-step-2"
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
                className={`text-[10px] shrink-0 font-medium ${
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
                {isStep2Complete ? 'Edit Step' : 'Open Step'}
                <ChevronDown className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // EXPANDED STEP 2
        <Card id="module-h-step-2" className="scroll-mt-24 rounded-xl border border-slate-200 bg-white shadow-xs">
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
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base font-bold text-slate-900">
                      Step 2: Pricing Architecture &amp; Tier Designer
                    </CardTitle>
                    <Badge
                      variant={isStep2Complete ? 'default' : 'outline'}
                      className={`text-[10px] shrink-0 font-medium ${
                        isStep2Complete
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'border-slate-300 text-slate-600'
                      }`}
                    >
                      {isStep2Complete ? 'Completed' : 'In Progress'}
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

              <div className="flex items-center gap-2 shrink-0">
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
            </div>

            {/* 4-Layer Support Strip: Micro-Coaching & Examples */}
            <div className="mt-3 flex flex-wrap items-center gap-2 pt-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setActiveWhyCard((prev) => (prev === 2 ? null : 2))}
                className="h-7 border-indigo-200 text-[11px] font-medium text-indigo-700 hover:bg-indigo-50"
              >
                <HelpCircle className="mr-1 h-3.5 w-3.5" />
                Why Are We Asking This?
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setActiveExampleCard((prev) => (prev === 2 ? null : 2))}
                className="h-7 border-emerald-200 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50"
              >
                <Lightbulb className="mr-1 h-3.5 w-3.5" />
                Show Me an Example
              </Button>
            </div>

            {activeWhyCard === 2 && (
              <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50/70 p-3.5 text-xs text-indigo-900">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                    <div className="space-y-1">
                      <p className="font-semibold text-indigo-950">
                        How VAT Works &amp; Why We Split Sticker Price vs Net Bank Revenue:
                      </p>
                      <p className="text-indigo-900/90 leading-relaxed">
                        Enter the total price your customer pays at checkout (e.g. €50 or £50 inc. VAT). 
                        Because VAT / Sales Tax ({defaultVatRate}% in {selectedCountry === 'GB' ? 'the UK' : 'Ireland'}) 
                        does not belong to your company—you collect it and pass it to {selectedCountry === 'GB' ? 'HMRC' : 'Revenue'}—we 
                        automatically calculate the actual net turnover (~{currencySymbol}{(50 / (1 + defaultVatRate/100)).toFixed(2)}) 
                        that lands in your business bank account. Grant agencies and bank lenders review your plan based on this net amount.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveWhyCard(null)}
                    className="text-indigo-500 hover:text-indigo-800 text-xs px-1"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {activeExampleCard === 2 && (
              <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/70 p-3.5 text-xs text-emerald-950">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <div className="space-y-1">
                      <p className="font-semibold text-emerald-900">
                        The Classic 10x / 3-Tier Distribution:
                      </p>
                      <p className="text-emerald-950/90 leading-relaxed">
                        Most successful SaaS and product startups follow the <strong>20 / 60 / 20 rule</strong>:
                        20% buy Entry (€29), 60% buy Core Flagship (€59), and 20% buy Enterprise (€149).
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveExampleCard(null)}
                    className="text-emerald-500 hover:text-emerald-800 text-xs px-1"
                  >
                    ✕
                  </button>
                </div>
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
                    Your First Core Customer Group (Who buys first?) — Pricing Strategy Justification
                  </Label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Written explanation of why your first core customer group will pay this price and how it protects gross margins. (A &ldquo;Beachhead&rdquo; simply means the very first specific group of customers you focus on winning before expanding to everyone else.)
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
          id="module-h-step-3"
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
                {isStep3Complete ? 'Edit Step' : 'Open Step'}
                <ChevronDown className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // EXPANDED STEP 3
        <Card id="module-h-step-3" className="scroll-mt-24 rounded-xl border border-slate-200 bg-white shadow-xs">
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

              <div className="flex items-center gap-2 shrink-0">
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
            </div>

            {/* 4-Layer Support Strip: Micro-Coaching & Examples */}
            <div className="mt-3 flex flex-wrap items-center gap-2 pt-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setActiveWhyCard((prev) => (prev === 3 ? null : 3))}
                className="h-7 border-indigo-200 text-[11px] font-medium text-indigo-700 hover:bg-indigo-50"
              >
                <HelpCircle className="mr-1 h-3.5 w-3.5" />
                Why Are We Asking This?
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setActiveExampleCard((prev) => (prev === 3 ? null : 3))}
                className="h-7 border-emerald-200 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50"
              >
                <Lightbulb className="mr-1 h-3.5 w-3.5" />
                Show Me an Example
              </Button>
            </div>

            {activeWhyCard === 3 && (
              <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50/70 p-3.5 text-xs text-indigo-900">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                    <div className="space-y-1">
                      <p className="font-semibold text-indigo-950">
                        Why We Calculate &ldquo;Pocket Profit&rdquo; Before Fixed Bills:
                      </p>
                      <p className="text-indigo-900/90 leading-relaxed">
                        Every time you make a sale, card processors (like Stripe) or marketplaces (like Amazon or
                        Apple) take a cut, and it costs you something to deliver that order (packaging, materials,
                        or cloud servers). What is left over is your <strong>Pocket Profit</strong> (also called
                        <em> Contribution Margin</em>). This is the actual cash available to pay your wages and
                        fixed monthly bills.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveWhyCard(null)}
                    className="text-indigo-500 hover:text-indigo-800 text-xs px-1"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {activeExampleCard === 3 && (
              <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/70 p-3.5 text-xs text-emerald-950">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <div className="space-y-1">
                      <p className="font-semibold text-emerald-900">
                        Plain-English Breakeven Example:
                      </p>
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
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveExampleCard(null)}
                    className="text-emerald-500 hover:text-emerald-800 text-xs px-1"
                  >
                    ✕
                  </button>
                </div>
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
                        Direct Cost to Make &amp; Deliver 1 Sale (COGS)
                      </Label>
                      <span className="text-xs font-bold text-rose-600 shrink-0">
                        -{currencySymbol}
                        {(directCogsAmount + refundAndAffiliateFeeAmount).toFixed(2)} / sale
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      COGS (Cost of Goods Sold) is what it directly costs you in raw materials, packaging, postage, or server usage every single time you sell one unit.
                    </p>
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
                        How Fast Customers Actually Pay You (Instant vs 30–60 Day Invoices) — Debtor Payment Terms
                      </Label>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        How quickly does customer money hit your bank account after a sale? (If you sell to businesses or supermarkets on &ldquo;Net 30&rdquo; or &ldquo;Net 60&rdquo; invoice terms, you deliver the product today but wait 30 to 60 days for the cash to hit your bank account.)
                      </p>
                    </div>
                  </div>

                  {/* Payment Terms Selector Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-1.5">
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
                          Why Grant Money Won&rsquo;t Just Take Sales From Another Local Shop — Non-Displacement / Deadweight
                        </Label>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {selectedCountry === 'GB'
                            ? 'UK Innovate UK & DBT prioritizes businesses with international trade traction.'
                            : 'LEO & Enterprise Ireland specifically mandate export potential (non-displacement). Grant agencies must check "Non-Displacement": proving your business brings new value or exports rather than just taking local customers away from an existing cafe or agency down the road.'}
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
      {/* STEP 4: SALES VELOCITY, CAPACITY & WRITTEN ASSUMPTIONS         */}
      {/* ------------------------------------------------------------- */}
      {openStep !== 'ALL' && openStep !== 4 ? (
        // COLLAPSED STEP 4
        <div
          id="module-h-step-4"
          onClick={() => setOpenStep(4)}
          className="group scroll-mt-24 cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  isStep4Complete ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
                }`}
              >
                {isStep4Complete ? <Check className="h-4 w-4" /> : '4'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                    Step 4: Sales Velocity, Capacity &amp; Written Assumptions
                  </h2>
                  <Badge
                    variant={isStep4Complete ? 'default' : 'outline'}
                    className={`shrink-0 text-[10px] font-medium ${
                      isStep4Complete
                        ? 'border-emerald-300 bg-emerald-100 text-emerald-800'
                        : 'border-slate-300 text-slate-600'
                    }`}
                  >
                    {isStep4Complete ? 'Completed' : 'In Progress'}
                  </Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {step4Data.primarySalesMotion
                    ? `${
                        SALES_MOTION_OPTIONS.find((m) => m.id === step4Data.primarySalesMotion)?.title ||
                        step4Data.otherSalesMotionText ||
                        'Sales Motion'
                      } • ${step4Data.expectedConversionRatePercent}% Conv • ~${calculatedDailyLeads}/day leads • Capacity: ${
                        isCapacitySurplus ? '🟢 Feasible' : '🔴 Bottleneck'
                      }`
                    : 'Map conversion rate, sales velocity lag, and delivery capacity limits'}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 shrink-0 px-2.5 text-xs font-medium text-indigo-600 group-hover:bg-indigo-50"
            >
              {isStep4Complete ? 'Edit Step' : 'Open Step'}
              <ChevronDown className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        // EXPANDED STEP 4
        <Card id="module-h-step-4" className="scroll-mt-24 rounded-xl border border-slate-200 bg-white shadow-xs">
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    isStep4Complete ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
                  }`}
                >
                  {isStep4Complete ? <Check className="h-4 w-4" /> : '4'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-bold text-slate-900">
                      Step 4: Sales Velocity, Capacity &amp; Written Assumptions
                    </CardTitle>
                    <Badge
                      variant={isStep4Complete ? 'default' : 'outline'}
                      className={`shrink-0 text-[10px] font-medium ${
                        isStep4Complete
                          ? 'border-emerald-300 bg-emerald-100 text-emerald-800'
                          : 'border-slate-300 text-slate-600'
                      }`}
                    >
                      {isStep4Complete ? 'Ready' : 'In Progress'}
                    </Badge>
                  </div>
                  <CardDescription className="mt-1 text-xs text-slate-600">
                    Translate your Year 1 breakeven volume ({yr1BreakevenUnits} sales/month) into daily pipeline requirements, stress-test your operational delivery capacity, and defend your sales velocity to grant and bank loan assessors.
                  </CardDescription>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setOpenStep(0)}
                  className="text-xs text-slate-500 hover:bg-slate-100"
                >
                  Collapse Step
                  <ChevronUp className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Dedicated 4-Layer Support Strip */}
            <div className="mt-3 flex flex-wrap items-center gap-2 pt-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setActiveWhyCard((prev) => (prev === 4 ? null : 4))}
                className="h-7 border-indigo-200 text-[11px] font-medium text-indigo-700 hover:bg-indigo-50"
              >
                <HelpCircle className="mr-1 h-3.5 w-3.5" />
                Why Are We Asking This?
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setActiveExampleCard((prev) => (prev === 4 ? null : 4))}
                className="h-7 border-emerald-200 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50"
              >
                <Lightbulb className="mr-1 h-3.5 w-3.5" />
                Show Me an Example
              </Button>
            </div>

            {/* Why Card Drawer */}
            {activeWhyCard === 4 && (
              <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50/70 p-3.5 text-xs text-indigo-900">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                    <div className="space-y-1">
                      <p className="font-semibold text-indigo-950">
                        Grant &amp; Bank Credit Underwriting Standard
                      </p>
                      <p className="text-indigo-900/90 leading-relaxed">
                        Government grant committees (LEO, Enterprise Ireland, Innovate UK) reject business plans that assume sales arrive instantly by magic. Evaluators check two specific failure modes:
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-slate-700">
                        <li>
                          <strong>The Velocity Trap:</strong> If your sales cycle takes 30 days to close and clients take 30 days to pay, you will experience a 60-day cash gap before receiving your first euro or pound.
                        </li>
                        <li>
                          <strong>The Capacity Ceiling:</strong> If you need 40 sales/month to break even, but your operations schedule in Module E only has bandwidth to fulfill 25 orders/month, the plan has a built-in delivery bottleneck that causes customer churn or founder burnout.
                        </li>
                      </ul>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setActiveWhyCard(null)}
                    className="h-6 w-6 p-0 text-indigo-400 hover:text-indigo-700 hover:bg-indigo-100/50"
                  >
                    ✕
                  </Button>
                </div>
              </div>
            )}

            {/* Example Card Drawer */}
            {activeExampleCard === 4 && (
              <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/70 p-3.5 text-xs text-emerald-950">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <div className="space-y-2">
                      <p className="font-semibold text-emerald-950">
                        Realistic Conversion Benchmark Examples
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                        <div className="rounded-lg bg-white p-2.5 border border-emerald-200/60 shadow-2xs">
                          <div className="font-semibold text-slate-900">B2B SaaS / AI App</div>
                          <div className="text-slate-600 text-[11px] mt-0.5">
                            10% discovery demo conversion, 21-day sales cycle, 3% monthly churn.
                          </div>
                        </div>
                        <div className="rounded-lg bg-white p-2.5 border border-emerald-200/60 shadow-2xs">
                          <div className="font-semibold text-slate-900">DTC / E-Commerce</div>
                          <div className="text-slate-600 text-[11px] mt-0.5">
                            2.2% web checkout conversion, 2-day impulse cycle, 25% 30-day repeat re-order.
                          </div>
                        </div>
                        <div className="rounded-lg bg-white p-2.5 border border-emerald-200/60 shadow-2xs">
                          <div className="font-semibold text-slate-900">High-Ticket / Agency</div>
                          <div className="text-slate-600 text-[11px] mt-0.5">
                            25% proposal close rate, 60-day RFP cycle, 80% annual retainer retention.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setActiveExampleCard(null)}
                    className="h-6 w-6 p-0 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100/50"
                  >
                    ✕
                  </Button>
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {/* ------------------------------------------------------------- */}
            {/* PART A: CROSS-MODULE OPERATIONS & CAPACITY SANITY CHECK        */}
            {/* ------------------------------------------------------------- */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-indigo-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Part A: Operational Delivery Capacity vs. Breakeven Volume
                  </h3>
                </div>
                <Badge variant="outline" className="text-[10px] bg-white border-slate-200 text-slate-600">
                  Auto-Synced with Module E &amp; Step 3
                </Badge>
              </div>

              <p className="text-xs text-slate-600">
                A viable financial model proves you can deliver the required sales volume without collapsing under workload. Here is how your Year 1 breakeven compares against your operational ceiling:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                {/* Breakeven Target */}
                <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Yr 1 Breakeven Target
                  </div>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-xl font-extrabold text-slate-900">
                      {yr1BreakevenUnits.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-500">sales/month</span>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    Required to pay monthly fixed nut of {currencySymbol}
                    {totalMonthlyFixedNut.toLocaleString()}
                  </div>
                </div>

                {/* Delivery Capacity Ceiling */}
                <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Monthly Delivery Ceiling
                    </span>
                    <span className="text-[10px] text-indigo-600 font-medium">Editable</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      max="100000"
                      value={step4Data.teamMonthlyCapacityCap || derivedMonthlyCapacity}
                      onChange={(e) => {
                        const val = Math.max(1, parseInt(e.target.value) || 1);
                        setStep4Data((prev) => ({
                          ...prev,
                          teamMonthlyCapacityCap: val,
                        }));
                      }}
                      className="h-8 w-24 text-sm font-bold text-slate-900 bg-slate-50"
                    />
                    <span className="text-xs text-slate-500">orders/month</span>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500 truncate">
                    {totalMinutesPerOrder > 0
                      ? `Based on ${weeklyOpsHours} hrs/wk & ${totalMinutesPerOrder} min/order in Mod E`
                      : `Standard early-stage capacity benchmark`}
                  </div>
                </div>

                {/* Solvency Status */}
                <div
                  className={`rounded-lg border p-3.5 shadow-2xs ${
                    isCapacitySurplus
                      ? 'border-emerald-200 bg-emerald-50/40 text-emerald-950'
                      : 'border-amber-200 bg-amber-50/40 text-amber-950'
                  }`}
                >
                  <div className="text-[11px] font-semibold uppercase tracking-wider">
                    Solvency &amp; Bandwidth
                  </div>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span
                      className={`text-xl font-extrabold ${
                        isCapacitySurplus ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {isCapacitySurplus ? `+${capacitySurplusOrDeficit}` : `${capacitySurplusOrDeficit}`}
                    </span>
                    <span className="text-xs font-semibold">
                      {isCapacitySurplus ? 'units/mo surplus' : 'units/mo deficit'}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px]">
                    {isCapacitySurplus ? (
                      <span className="text-emerald-800">
                        🟢 Feasible within current founder &amp; team hours.
                      </span>
                    ) : (
                      <span className="text-amber-800">
                        🔴 Delivery ceiling below breakeven. Needs higher price or hire.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Module E Jump Link */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px] text-slate-500">
                <span>
                  Capacity is dynamically derived from your weekly operational hours and order fulfillment stages.
                </span>
                {onNavigateToModule && (
                  <button
                    type="button"
                    onClick={() => onNavigateToModule('MOD_E_OPERATIONS')}
                    className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-semibold ml-2 hover:underline shrink-0"
                  >
                    Adjust Operations in Module E
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* PART B: PRIMARY SALES MOTION & REVERSE FUNNEL CALCULATOR       */}
            {/* ------------------------------------------------------------- */}
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Part B: Primary Sales Motion &amp; Conversion Velocity
                </Label>
                <p className="mt-0.5 text-xs text-slate-500">
                  Select the primary commercial motion you will use to convert prospects into paying customers.
                </p>
              </div>

              {/* Sales Motion Tiles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {SALES_MOTION_OPTIONS.map((motion) => {
                  const isSelected = step4Data.primarySalesMotion === motion.id;
                  const Icon = motion.icon;
                  return (
                    <div
                      key={motion.id}
                      onClick={() => {
                        let newConv = step4Data.expectedConversionRatePercent;
                        let newCycle = step4Data.salesCycleDays;
                        if (motion.id === 'SELF_SERVE_WEB') {
                          newConv = 2.5;
                          newCycle = 3;
                        } else if (motion.id === 'INSIDE_SALES_DEMO') {
                          newConv = 12.0;
                          newCycle = 21;
                        } else if (motion.id === 'ENTERPRISE_RFP') {
                          newConv = 25.0;
                          newCycle = 60;
                        } else if (motion.id === 'RETAIL_MARKETPLACE') {
                          newConv = 2.0;
                          newCycle = 5;
                        }
                        setStep4Data((prev) => ({
                          ...prev,
                          primarySalesMotion: motion.id,
                          expectedConversionRatePercent: newConv,
                          salesCycleDays: newCycle,
                        }));
                      }}
                      className={`cursor-pointer rounded-xl border p-3 transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-500'
                          : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                            isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="font-bold text-xs text-slate-900 truncate flex-1">
                          {motion.title}
                        </div>
                        {isSelected && <Check className="h-3.5 w-3.5 text-indigo-600 shrink-0" />}
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">
                        {motion.subtitle}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-100 pt-1.5">
                        <span>Bench Conv: <strong>{motion.benchmarkConv}</strong></span>
                        <span>Cycle: <strong>{motion.benchmarkCycle}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Revealed input for OTHER motion (Rule 1.5) */}
              {step4Data.primarySalesMotion === 'OTHER' && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/30 p-3 space-y-1.5 animate-in fade-in-50">
                  <Label className="text-xs font-semibold text-slate-800">
                    Specify Your Custom Sales Motion
                  </Label>
                  <Input
                    type="text"
                    value={step4Data.otherSalesMotionText || ''}
                    onChange={(e) =>
                      setStep4Data((prev) => ({ ...prev, otherSalesMotionText: e.target.value }))
                    }
                    placeholder="e.g. Account-Based Marketing + Distributor agreements..."
                    className="h-8 text-xs bg-white"
                  />
                </div>
              )}

              {/* Conversion Rate & Velocity Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Conversion Rate % */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-900">
                      Expected Conversion Rate (%)
                    </Label>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min="0.1"
                        max="100"
                        step="0.5"
                        value={step4Data.expectedConversionRatePercent}
                        onChange={(e) =>
                          setStep4Data((prev) => ({
                            ...prev,
                            expectedConversionRatePercent: parseFloat(e.target.value) || 0.1,
                          }))
                        }
                        className="h-7 w-16 text-right text-xs font-bold bg-slate-50"
                      />
                      <span className="text-xs font-semibold text-slate-700">%</span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="0.5"
                    max="40"
                    step="0.5"
                    value={step4Data.expectedConversionRatePercent}
                    onChange={(e) =>
                      setStep4Data((prev) => ({
                        ...prev,
                        expectedConversionRatePercent: parseFloat(e.target.value) || 1,
                      }))
                    }
                    className="w-full accent-indigo-600"
                  />

                  {/* Preset chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-400">Presets:</span>
                    {[
                      { label: 'E-com Web (2%)', val: 2.0 },
                      { label: 'SaaS Free-to-Paid (3%)', val: 3.0 },
                      { label: 'B2B Demo (12%)', val: 12.0 },
                      { label: 'RFP / Tender (25%)', val: 25.0 },
                    ].map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() =>
                          setStep4Data((prev) => ({
                            ...prev,
                            expectedConversionRatePercent: p.val,
                          }))
                        }
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                          step4Data.expectedConversionRatePercent === p.val
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sales Cycle Days */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-900">
                      Sales Cycle Velocity (Lead to Cash)
                    </Label>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min="1"
                        max="365"
                        value={step4Data.salesCycleDays}
                        onChange={(e) =>
                          setStep4Data((prev) => ({
                            ...prev,
                            salesCycleDays: parseInt(e.target.value) || 1,
                          }))
                        }
                        className="h-7 w-16 text-right text-xs font-bold bg-slate-50"
                      />
                      <span className="text-xs font-semibold text-slate-700">days</span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="1"
                    max="90"
                    step="1"
                    value={step4Data.salesCycleDays}
                    onChange={(e) =>
                      setStep4Data((prev) => ({
                        ...prev,
                        salesCycleDays: parseInt(e.target.value) || 1,
                      }))
                    }
                    className="w-full accent-indigo-600"
                  />

                  {/* Preset chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-400">Presets:</span>
                    {[
                      { label: 'Instant (2 days)', val: 2 },
                      { label: 'Fast B2B (14 days)', val: 14 },
                      { label: 'Mid-Market (30 days)', val: 30 },
                      { label: 'Enterprise (60 days)', val: 60 },
                    ].map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() =>
                          setStep4Data((prev) => ({
                            ...prev,
                            salesCycleDays: p.val,
                          }))
                        }
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                          step4Data.salesCycleDays === p.val
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Interactive Reverse Funnel Calculator Card */}
              <div className="rounded-xl border border-indigo-700/30 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 sm:p-5 text-white shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                    Reverse-Engineered Pipeline Requirements
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-lg bg-white/5 border border-white/10 p-3.5 space-y-1">
                    <div className="text-[11px] text-indigo-200/80 font-medium">
                      Required Monthly Qualified Leads / Visitors
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-extrabold text-emerald-400">
                        {calculatedRequiredMonthlyLeads.toLocaleString()}
                      </span>
                      <span className="text-xs text-white/70">prospects/month</span>
                    </div>
                    <div className="text-[11px] text-white/60">
                      Calculated as: {yr1BreakevenUnits} breakeven units ÷ {step4Data.expectedConversionRatePercent}% conversion
                    </div>
                  </div>

                  <div className="rounded-lg bg-white/5 border border-white/10 p-3.5 space-y-1">
                    <div className="text-[11px] text-indigo-200/80 font-medium">
                      Daily Acquisition Run-Rate
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-extrabold text-white">
                        ~{calculatedDailyLeads.toLocaleString()}
                      </span>
                      <span className="text-xs text-white/70">qualified leads/day</span>
                    </div>
                    <div className="text-[11px] text-white/60">
                      Top-of-funnel velocity needed across web, ads, waitlist &amp; outreach
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-indigo-100/80 pt-1">
                  💡 This establishes the exact pipeline volume that <strong>Module I (Marketing)</strong> and <strong>Module C (Customer Waitlists)</strong> will be engineered to generate.
                </p>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* PART C: RETENTION & CHURN REALITY                              */}
            {/* ------------------------------------------------------------- */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Part C: Retention &amp; Customer Churn Assumptions
                  </Label>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {step1Data.revenueModelVehicle === 'SUBSCRIPTION_RECURRING' ||
                    step1Data.revenueModelVehicle === 'USAGE_BASED_METERED'
                      ? 'What percentage of subscribers cancel each month?'
                      : 'What percentage of buyers make a repeat purchase within 30–60 days?'}
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] bg-slate-50">
                  {step1Data.revenueModelVehicle === 'SUBSCRIPTION_RECURRING'
                    ? 'Recurring Churn'
                    : 'Repeat Purchase'}
                </Badge>
              </div>

              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={step4Data.expectedMonthlyChurnOrRepeatPercent}
                  onChange={(e) =>
                    setStep4Data((prev) => ({
                      ...prev,
                      expectedMonthlyChurnOrRepeatPercent: parseInt(e.target.value) || 5,
                    }))
                  }
                  className="w-full accent-indigo-600"
                />
                <div className="flex items-center gap-1 shrink-0">
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={step4Data.expectedMonthlyChurnOrRepeatPercent}
                    onChange={(e) =>
                      setStep4Data((prev) => ({
                        ...prev,
                        expectedMonthlyChurnOrRepeatPercent: parseInt(e.target.value) || 5,
                      }))
                    }
                    className="h-8 w-16 text-right text-xs font-bold bg-slate-50"
                  />
                  <span className="text-xs font-semibold text-slate-700">%</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
                {step1Data.revenueModelVehicle === 'SUBSCRIPTION_RECURRING' ||
                step1Data.revenueModelVehicle === 'USAGE_BASED_METERED' ? (
                  <span>
                    Benchmark: <strong>&lt; 2%</strong> (Enterprise SaaS) • <strong>3%–5%</strong> (Healthy SMB SaaS) • <strong>&gt; 7%</strong> (High Churn Alert)
                  </span>
                ) : (
                  <span>
                    Benchmark: <strong>10%–20%</strong> (Typical E-com) • <strong>25%–40%</strong> (Strong Brand Loyalty) • <strong>&gt; 50%</strong> (High Retention Retainer)
                  </span>
                )}
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* PART D: WRITTEN SALES ASSUMPTIONS & ASSESSOR DEFENSE (AI)      */}
            {/* ------------------------------------------------------------- */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Part D: Written Sales Assumptions &amp; Assessor Defense
                  </Label>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Defend your conversion rates, sales cycle timing, and operational capacity for grant and loan assessors.
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={handleGenerateAiSalesNarrative}
                  disabled={isGeneratingAiSalesNarrative || isVaultReadonly}
                  className="h-8 border-indigo-300 bg-indigo-50/50 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 hover:text-indigo-900"
                >
                  {isGeneratingAiSalesNarrative ? (
                    <>
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin text-indigo-600" />
                      Synthesizing Pipeline Math...
                    </>
                  ) : aiSalesNarrativeSuccess ? (
                    <>
                      <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                      Assumptions Updated!
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
                      Auto-Draft with AI (Assessor Mode)
                    </>
                  )}
                </Button>
              </div>

              {/* Assessor Tip Callout */}
              {(aiSalesAssessorTip || step4Data.assessorTip) && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3.5 text-xs text-indigo-950 flex items-start gap-2.5 animate-in fade-in-50">
                  <Lightbulb className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-indigo-900">Assessor Defense Tip: </span>
                    <span className="text-slate-700">{aiSalesAssessorTip || step4Data.assessorTip}</span>
                  </div>
                </div>
              )}

              {/* Structured 3-Paragraph Textarea */}
              <div className="space-y-1.5">
                <textarea
                  rows={8}
                  value={step4Data.writtenAssumptionsNarrative || ''}
                  onChange={(e) =>
                    setStep4Data((prev) => ({
                      ...prev,
                      writtenAssumptionsNarrative: e.target.value,
                    }))
                  }
                  placeholder={`Click "Auto-Draft with AI (Assessor Mode)" above or enter your 3 structured paragraphs:\n\n1. Commercial Acquisition & Conversion Mechanics (Explaining the ${step4Data.expectedConversionRatePercent}% conversion rate and required ${calculatedRequiredMonthlyLeads} leads/month)...\n\n2. Pipeline Velocity & Revenue Realization Lag (Explaining the ${step4Data.salesCycleDays}-day sales cycle lag and cashflow timing)...\n\n3. Operational Delivery Capacity & Scalability (Comparing ${yr1BreakevenUnits} breakeven units against your ${currentCapacity} units/month operational ceiling)...`}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-base sm:text-xs text-slate-800 leading-relaxed shadow-2xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    Directly exports to Module L Official Business Plan &amp; Grant Appendices.
                  </span>
                  <span>{(step4Data.writtenAssumptionsNarrative || '').length} characters</span>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* STEP 4 FOOTER TOOLBAR                                         */}
            {/* ------------------------------------------------------------- */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() => {
                  setOpenStep(3);
                  window.scrollTo({ top: 400, behavior: 'smooth' });
                }}
                className="text-xs text-slate-600 hover:bg-slate-100"
              >
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                Back to Step 3: Pocket Profit
              </Button>

              <div className="flex items-center gap-2">
                {saveStatus === 'saved' && (
                  <span className="flex items-center text-xs font-medium text-emerald-600">
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                    Saved
                  </span>
                )}
                {saveStatus === 'error' && (
                  <span className="flex items-center text-xs font-medium text-rose-600">
                    <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                    Save Failed
                  </span>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={handleSaveStep4}
                  disabled={saveStatus === 'saving' || isVaultReadonly}
                  className="border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {saveStatus === 'saving' ? (
                    <>
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="mr-1.5 h-3.5 w-3.5" />
                      Save Step 4
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  type="button"
                  onClick={async () => {
                    await handleSaveStep4();
                    setOpenStep(5);
                    window.scrollTo({ top: 450, behavior: 'smooth' });
                  }}
                  disabled={!isStep4Complete || isVaultReadonly}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                >
                  Next: Revenue Brief &amp; Audit (Step 5)
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STEP 5: REVENUE STRATEGY & POCKET PROFIT BRIEF (EXECUTIVE OVERVIEW) */}
      {/* ------------------------------------------------------------- */}
      {openStep !== 'ALL' && openStep !== 5 ? (
        // COLLAPSED STEP 5 OVERVIEW CARD
        <div
          id="module-h-step-5"
          onClick={() => setOpenStep(5)}
          className="group scroll-mt-24 cursor-pointer rounded-xl border border-indigo-200 bg-gradient-to-r from-white via-indigo-50/40 to-violet-50/40 p-4 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  completedCoreStepsCount === 4 && isStep5Complete
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 text-white'
                }`}
              >
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                    Revenue Strategy &amp; Pocket Profit Brief
                  </h2>
                  <Badge
                    variant="outline"
                    className={`shrink-0 text-[10px] ${
                      completedCoreStepsCount === 4
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                        : 'border-slate-300 text-slate-600'
                    }`}
                  >
                    {completedCoreStepsCount}/4 Sections Ready
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-indigo-200 bg-indigo-50 text-[10px] text-indigo-700 shrink-0 hidden sm:inline-flex"
                  >
                    LEO &amp; Innovate UK Ready
                  </Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  1-page commercial dossier, unit economics waterfall, 3-year breakeven horizon, and constructive blind-spot audit.
                </p>
              </div>
            </div>

            <div className="ml-3 flex shrink-0 items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 shrink-0 px-2.5 text-xs font-medium text-indigo-600 group-hover:bg-indigo-50"
              >
                {completedCoreStepsCount === 4 ? 'Open Overview' : 'Review Overview'}
                <ChevronDown className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // EXPANDED STEP 5 OVERVIEW CARD
        <Card id="module-h-step-5" className="scroll-mt-24 rounded-xl border border-indigo-200 bg-gradient-to-br from-white via-indigo-50/30 to-violet-50/40 shadow-sm">
          <CardHeader className="border-b border-indigo-100/80 pb-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    completedCoreStepsCount === 4 && isStep5Complete
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base font-bold text-slate-900">
                      Revenue Strategy &amp; Pocket Profit Brief (Executive Overview)
                    </CardTitle>
                    <Badge className="bg-indigo-100 text-indigo-800 text-[10px] shrink-0">
                      Module H Overview
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-[10px] shrink-0 ${
                        completedCoreStepsCount === 4
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                          : 'border-slate-300 text-slate-600'
                      }`}
                    >
                      {completedCoreStepsCount}/4 Core Sections Ready
                    </Badge>
                  </div>
                  <CardDescription className="mt-1 text-xs text-slate-600">
                    Review your complete commercial summary, verify your readiness checklist across Steps 1–4, and audit potential margin, debtor, and capacity blind spots for grant and loan defense.
                  </CardDescription>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleCopyMarkdownBrief}
                  className="h-8 text-xs border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50 font-semibold"
                >
                  {copiedBrief ? (
                    <>
                      <Check className="mr-1 h-3.5 w-3.5 text-emerald-600" />
                      Copied Dossier!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1 h-3.5 w-3.5" />
                      Copy Markdown Dossier
                    </>
                  )}
                </Button>
                {openStep !== 'ALL' && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setOpenStep(0)}
                    className="h-8 text-xs text-slate-500 hover:text-slate-900"
                  >
                    <span>Collapse Step</span>
                    <ChevronUp className="ml-1 h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-5">
            {/* ============================================================= */}
            {/* SECTION 1: 4-PILLAR COMMERCIAL READINESS CHECKLIST GRID       */}
            {/* ============================================================= */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  1. Commercial Architecture Readiness Checklist
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">
                  {completedCoreStepsCount} of 4 Core Steps Complete
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {/* Pillar 1: Revenue Model */}
                <div
                  onClick={() => setOpenStep(1)}
                  className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs transition hover:border-indigo-300 hover:shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      1. Revenue Model
                    </span>
                    {isStep1Complete ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-600 line-clamp-2">
                    {step1Data.revenueModelVehicle
                      ? REVENUE_VEHICLE_OPTIONS.find((v) => v.id === step1Data.revenueModelVehicle)?.title
                      : 'Not selected yet'}
                  </p>
                  <span className="mt-2 inline-block text-[10px] font-bold text-indigo-600">
                    Edit Model →
                  </span>
                </div>

                {/* Pillar 2: Pricing Tiers */}
                <div
                  onClick={() => setOpenStep(2)}
                  className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs transition hover:border-indigo-300 hover:shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      2. Pricing Tiers
                    </span>
                    {isStep2Complete ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-600">
                    {currencySymbol}{blendedAveragePrice.toLocaleString()} blended net • {step2Data.tiers.length} tier(s) configured.
                  </p>
                  <span className="mt-2 inline-block text-[10px] font-bold text-indigo-600">
                    Edit Tiers →
                  </span>
                </div>

                {/* Pillar 3: Breakeven Engine */}
                <div
                  onClick={() => setOpenStep(3)}
                  className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs transition hover:border-indigo-300 hover:shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      3. Pocket Profit &amp; Breakeven
                    </span>
                    {isStep3Complete ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-600">
                    {currencySymbol}{pocketProfitPerSale.toLocaleString()} pocket profit ({contributionMarginPercent}%) • {yr1BreakevenUnits} sales/mo nut.
                  </p>
                  <span className="mt-2 inline-block text-[10px] font-bold text-indigo-600">
                    Edit Pocket Profit →
                  </span>
                </div>

                {/* Pillar 4: Sales Velocity & Capacity */}
                <div
                  onClick={() => setOpenStep(4)}
                  className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs transition hover:border-indigo-300 hover:shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      4. Sales Velocity &amp; Capacity
                    </span>
                    {isStep4Complete ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-600">
                    {step4Data.expectedConversionRatePercent}% conv • {step4Data.salesCycleDays}d cycle • {currentCapacity} cap/mo ({isCapacitySurplus ? `+${capacitySurplusOrDeficit}` : `${capacitySurplusOrDeficit}`}).
                  </p>
                  <span className="mt-2 inline-block text-[10px] font-bold text-indigo-600">
                    Edit Velocity →
                  </span>
                </div>
              </div>
            </div>

            {/* ============================================================= */}
            {/* SECTION 2: 1-PAGE EXECUTIVE COMMERCIAL DOSSIER                */}
            {/* ============================================================= */}
            <div className="space-y-3 border-t border-indigo-100/80 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  2. Executive Commercial Snapshot &amp; Unit Economics Waterfall
                </h3>
                <span className="text-[11px] text-slate-500">
                  Synced directly from Steps 1–4
                </span>
              </div>

              {/* Snapshot Metric Cards */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                  <div className="text-[11px] font-medium text-slate-500">Blended Net Price</div>
                  <div className="mt-1 text-lg font-bold text-slate-900">
                    {currencySymbol}{blendedAveragePrice.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400">Net of VAT / Sales Tax</div>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 shadow-2xs">
                  <div className="text-[11px] font-medium text-emerald-800">Net Pocket Profit</div>
                  <div className="mt-1 text-lg font-bold text-emerald-700">
                    {currencySymbol}{pocketProfitPerSale.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-semibold">{contributionMarginPercent}% contribution margin</div>
                </div>

                <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-3 shadow-2xs">
                  <div className="text-[11px] font-medium text-indigo-800">Y1 Breakeven Target</div>
                  <div className="mt-1 text-lg font-bold text-indigo-900">
                    {yr1BreakevenUnits.toLocaleString()} <span className="text-xs font-normal">sales/mo</span>
                  </div>
                  <div className="text-[10px] text-indigo-600">Covers {currencySymbol}{totalMonthlyFixedNut.toLocaleString()}/mo nut</div>
                </div>

                <div className={`rounded-xl border p-3 shadow-2xs ${
                  isCapacitySurplus ? 'border-emerald-200 bg-emerald-50/40' : 'border-rose-200 bg-rose-50/40'
                }`}>
                  <div className={`text-[11px] font-medium ${isCapacitySurplus ? 'text-emerald-800' : 'text-rose-800'}`}>
                    Delivery Bandwidth
                  </div>
                  <div className={`mt-1 text-lg font-bold ${isCapacitySurplus ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {currentCapacity.toLocaleString()} <span className="text-xs font-normal">units/mo</span>
                  </div>
                  <div className={`text-[10px] font-semibold ${isCapacitySurplus ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isCapacitySurplus ? `Surplus: +${capacitySurplusOrDeficit} units` : `Deficit: ${capacitySurplusOrDeficit} units`}
                  </div>
                </div>
              </div>

              {/* Unit Economics Waterfall Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50/80 font-bold text-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Revenue / Cost Component</th>
                      <th className="py-2.5 px-3 text-right">Per Sale ({currencySymbol})</th>
                      <th className="py-2.5 px-3 text-right">% of Net Price</th>
                      <th className="py-2.5 px-3 hidden sm:table-cell">Operational Context / Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr>
                      <td className="py-2 px-3 font-semibold text-slate-900">Customer Sticker Price (Gross)</td>
                      <td className="py-2 px-3 text-right font-semibold text-slate-900">{currencySymbol}{simulatedGrossStickerPrice.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right">--</td>
                      <td className="py-2 px-3 text-slate-500 text-[11px] hidden sm:table-cell">Customer invoice / checkout total including VAT</td>
                    </tr>
                    <tr className="bg-slate-50/30">
                      <td className="py-2 px-3 text-slate-600 pl-6">Less: VAT / Statutory Sales Tax ({defaultVatRate}%)</td>
                      <td className="py-2 px-3 text-right text-rose-600">-{currencySymbol}{simulatedVatAmount.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right text-slate-500">--</td>
                      <td className="py-2 px-3 text-slate-500 text-[11px] hidden sm:table-cell">Remitted to Revenue / HMRC upon registration</td>
                    </tr>
                    <tr className="font-semibold text-slate-900 bg-indigo-50/20">
                      <td className="py-2 px-3">Blended Realized Net Price</td>
                      <td className="py-2 px-3 text-right font-bold text-indigo-950">{currencySymbol}{simulatedNetPrice.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-bold text-indigo-950">100.0%</td>
                      <td className="py-2 px-3 text-slate-600 text-[11px] hidden sm:table-cell">Commercial top-line realized by the business</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-600 pl-6">Less: Payment Gateway Fees ({step3Data.frictionCosts.paymentGatewayPercent || 0}% + {step3Data.frictionCosts.paymentGatewayFixedCents || 0}¢)</td>
                      <td className="py-2 px-3 text-right text-rose-600">-{currencySymbol}{gatewayFeeAmount.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right text-slate-500">
                        {simulatedNetPrice > 0 ? ((gatewayFeeAmount / simulatedNetPrice) * 100).toFixed(1) : 0}%
                      </td>
                      <td className="py-2 px-3 text-slate-500 text-[11px] hidden sm:table-cell">Stripe / card interchange processing deduction</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-600 pl-6">Less: Direct Variable COGS / Fulfillment</td>
                      <td className="py-2 px-3 text-right text-rose-600">-{currencySymbol}{directCogsAmount.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right text-slate-500">
                        {simulatedNetPrice > 0 ? ((directCogsAmount / simulatedNetPrice) * 100).toFixed(1) : 0}%
                      </td>
                      <td className="py-2 px-3 text-slate-500 text-[11px] hidden sm:table-cell">Materials, unit delivery, server API calls (Module D/E)</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-600 pl-6">Less: Refunds &amp; Dispute Reserve ({step3Data.frictionCosts.disputeRefundBufferPercent || 0}%)</td>
                      <td className="py-2 px-3 text-right text-rose-600">-{currencySymbol}{refundAndAffiliateFeeAmount.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right text-slate-500">{(step3Data.frictionCosts.disputeRefundBufferPercent || 0).toFixed(1)}%</td>
                      <td className="py-2 px-3 text-slate-500 text-[11px] hidden sm:table-cell">Prudent buffer against customer chargebacks / returns</td>
                    </tr>
                    <tr className="border-t-2 border-emerald-300 bg-emerald-50/50 font-bold text-emerald-950">
                      <td className="py-2.5 px-3">Net Pocket Profit per Sale (Contribution)</td>
                      <td className="py-2.5 px-3 text-right text-emerald-700 text-sm">{currencySymbol}{pocketProfitPerSale.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right text-emerald-700 text-sm">{contributionMarginPercent}%</td>
                      <td className="py-2.5 px-3 text-emerald-800 text-[11px] hidden sm:table-cell">Cash contribution available to service fixed nut &amp; payroll</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 3-Year Breakeven Horizon Summary */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {computedThreeYearTargets.map((yt) => (
                  <div key={yt.yearNumber} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Year {yt.yearNumber} Horizon</span>
                      <Badge variant="outline" className="text-[10px] text-slate-600 border-slate-300">
                        Fixed: {currencySymbol}{(yt.monthlyPayrollBaseline + yt.otherFixedMonthlyOverheads).toLocaleString()}/mo
                      </Badge>
                    </div>
                    <div className="text-base font-bold text-indigo-900">
                      {yt.customersNeededToBreakeven.toLocaleString()} <span className="text-xs font-normal text-slate-600">sales/mo to break even</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Generates {currencySymbol}{yt.monthlyRevenueAtBreakeven.toLocaleString()}/mo revenue to pay {currencySymbol}{yt.monthlyPayrollBaseline.toLocaleString()} scheduled payroll and {currencySymbol}{yt.otherFixedMonthlyOverheads.toLocaleString()} operational overheads.
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* ============================================================= */}
            {/* SECTION 3: AUDIT READINESS POSTURE SELECTOR                   */}
            {/* ============================================================= */}
            <div className="space-y-3 border-t border-indigo-100/80 pt-4">
              <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  3. Commercial Readiness Posture (Grant &amp; Investor Diligence)
                </label>
                <span className="text-[11px] text-slate-500">
                  Includes &ldquo;Other&rdquo; custom posture option
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {[
                  {
                    value: 'READY_FOR_COMMERCIAL_LAUNCH' as const,
                    label: 'Ready for Commercial Launch',
                    badge: 'Validated & Viable',
                    subtitle: 'Contribution margin >65%, clear breakeven volume, and operational capacity safely accommodates Year 1 targets.',
                  },
                  {
                    value: 'PRICING_TESTING_RECOMMENDED' as const,
                    label: 'Pricing & Elasticity Testing Advised',
                    badge: 'Margin Sensitive',
                    subtitle: 'Unit economics are feasible but tight (<65% margin). Running willingness-to-pay tests on premium tiers recommended.',
                  },
                  {
                    value: 'WORKING_CAPITAL_GAP_WARNING' as const,
                    label: 'Working Capital Buffer Required',
                    badge: 'Cashflow Timing Lag',
                    subtitle: 'Debtor settlement or onboarding lag requires a dedicated 2–3 month cash buffer before cash clears to cover payroll.',
                  },
                  {
                    value: 'NEEDS_CAPACITY_EXPANSION' as const,
                    label: 'Operational Capacity Bottleneck',
                    badge: 'Capacity Warning',
                    subtitle: 'Current delivery ceiling is below Year 1 breakeven volume. Fulfillment automation or early hiring is required.',
                  },
                  {
                    value: 'OTHER' as const,
                    label: 'Other Commercial Posture',
                    badge: 'Custom Context',
                    subtitle: 'Hybrid commercial agreement, partner rev-share, or non-standard procurement contract.',
                  },
                ].map((opt) => {
                  const isSelected = step5Data.revenueReadinessConfidence === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={isVaultReadonly}
                      onClick={() =>
                        setStep5Data((prev) => ({
                          ...prev,
                          revenueReadinessConfidence: opt.value,
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
                                ? 'border-indigo-300 bg-indigo-100 text-[10px] text-indigo-900 font-bold'
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

              {step5Data.revenueReadinessConfidence === 'OTHER' && (
                <div className="rounded-lg border border-indigo-200 bg-indigo-50/40 p-3 space-y-1.5">
                  <label className="block text-xs font-semibold text-indigo-950">
                    Describe Your Custom Commercial Posture:
                  </label>
                  <input
                    type="text"
                    disabled={isVaultReadonly}
                    value={step5Data.otherReadinessConfidenceText || ''}
                    onChange={(e) =>
                      setStep5Data((prev) => ({
                        ...prev,
                        otherReadinessConfidenceText: e.target.value,
                      }))
                    }
                    placeholder="e.g. Enterprise pilot contract with 50% upfront deposit offsetting debtor risk..."
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 sm:text-xs"
                  />
                </div>
              )}
            </div>

            {/* ============================================================= */}
            {/* SECTION 4: CONSTRUCTIVE "THINGS TO CONSIDER" BLIND-SPOT AUDIT */}
            {/* ============================================================= */}
            <div className="space-y-3 border-t border-indigo-100/80 pt-4">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    4. Constructive &ldquo;Things to Consider&rdquo; Commercial Blind-Spot Review
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Specific vulnerabilities grant committees and loan assessors look for in financial submissions.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isGeneratingAiBrief || isVaultReadonly}
                    onClick={handleGenerateAiRevenueBrief}
                    className="h-8 text-xs font-semibold border-indigo-200 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100/80"
                  >
                    {isGeneratingAiBrief ? (
                      <>
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin text-indigo-600" />
                        Auditing Commercial Blind Spots...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
                        Audit Commercial Blind Spots with AI
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isVaultReadonly}
                    onClick={handleAddCustomBlindSpot}
                    className="h-8 text-xs border-slate-300 text-slate-700"
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Add Consideration
                  </Button>
                </div>
              </div>

              {/* Blind Spot Cards List */}
              <div className="space-y-3">
                {step5Data.blindSpots.map((item, idx) => {
                  const isCritical = item.severity === 'CRITICAL';
                  const isWarning = item.severity === 'WARNING';

                  return (
                    <div
                      key={item.id}
                      className={`rounded-xl border p-3.5 transition ${
                        isCritical
                          ? 'border-rose-200 bg-rose-50/30'
                          : isWarning
                          ? 'border-amber-200 bg-amber-50/30'
                          : 'border-indigo-200 bg-indigo-50/30'
                      }`}
                    >
                      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white">
                            Consideration #{idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{item.title}</span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold ${
                              isCritical
                                ? 'border-rose-300 bg-rose-100 text-rose-800'
                                : isWarning
                                ? 'border-amber-300 bg-amber-100 text-amber-800'
                                : 'border-indigo-300 bg-indigo-100 text-indigo-800'
                            }`}
                          >
                            {item.severity}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleParkBlindSpotInOpenQuestions(item)}
                            className="h-7 text-[11px] text-slate-600 hover:text-indigo-600 hover:bg-slate-100"
                          >
                            Park in Open Questions
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setStep5Data((prev) => ({
                                ...prev,
                                blindSpots: prev.blindSpots.filter((b) => b.id !== item.id),
                              }))
                            }
                            className="h-7 text-[11px] text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      <p className="mt-2 text-xs text-slate-700 leading-relaxed">
                        {item.explanation}
                      </p>

                      <div className="mt-2.5 rounded-lg border border-slate-200/80 bg-white/80 p-2.5 text-xs">
                        <span className="font-semibold text-indigo-950">Recommended Action: </span>
                        <span className="text-slate-700">{item.suggestedAction}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ============================================================= */}
            {/* SECTION 5: EXECUTIVE COMMERCIAL SUMMARY NARRATIVE (3 PARAS)  */}
            {/* ============================================================= */}
            <div className="space-y-3 border-t border-indigo-100/80 pt-4">
              <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    5. Executive Commercial Defense Narrative (3 Structured Paragraphs)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Formal narrative addressing unit economics, breakeven viability, and delivery feasibility for Module L grant appendices.
                  </p>
                </div>
              </div>

              {/* Assessor Tip Callout */}
              {(aiBriefAssessorTip || step5Data.aiAssessorTip) && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3.5 text-xs text-indigo-950 flex items-start gap-2.5">
                  <Lightbulb className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-indigo-900">Commercial Assessor Tip: </span>
                    <span className="text-slate-700">{aiBriefAssessorTip || step5Data.aiAssessorTip}</span>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <textarea
                  rows={9}
                  disabled={isVaultReadonly}
                  value={step5Data.executiveCommercialSummaryNarrative}
                  onChange={(e) =>
                    setStep5Data((prev) => ({
                      ...prev,
                      executiveCommercialSummaryNarrative: e.target.value,
                    }))
                  }
                  placeholder="Click 'Audit Commercial Blind Spots with AI' above or enter your 3 structured paragraphs..."
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-base sm:text-xs text-slate-800 leading-relaxed shadow-2xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    Directly populates Module L Commercial Viability &amp; LEO / Innovate UK Appendices.
                  </span>
                  <span>{step5Data.executiveCommercialSummaryNarrative.length} characters</span>
                </div>
              </div>
            </div>

            {/* Save Overview Action */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-indigo-100/80 pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpenStep(4)}
                className="text-xs text-slate-600"
              >
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                Back to Step 4 (Sales Velocity)
              </Button>

              <div className="flex items-center gap-2">
                {saveStatus === 'saved' && (
                  <span className="flex items-center text-xs font-medium text-emerald-600">
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                    Saved
                  </span>
                )}
                {saveStatus === 'error' && (
                  <span className="flex items-center text-xs font-medium text-rose-600">
                    <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                    Save Failed
                  </span>
                )}

                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveStep5}
                  disabled={saveStatus === 'saving' || isVaultReadonly}
                  className="bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold"
                >
                  {saveStatus === 'saving' ? (
                    <>
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Saving Brief...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                      Save Revenue Brief (Complete Module H)
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Conversion / Handoff CTA Bar into Module I */}
            {onContinueToModuleI && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-900 px-4 py-3.5 text-white">
                <div className="text-xs min-w-0 flex-1">
                  <span className="font-semibold text-indigo-300">
                    Module H Complete! Commercial model &amp; pocket profit verified for {plan.title}.
                  </span>{' '}
                  <span className="text-slate-300">
                    Ready to build your customer acquisition engine? Advance to Module I: Marketing &amp; First 10 Customers.
                  </span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={isVaultReadonly || saveStatus === 'saving'}
                  onClick={async () => {
                    await handleSaveStep5();
                    onContinueToModuleI();
                  }}
                  className="shrink-0 bg-indigo-600 text-white hover:bg-indigo-500 text-xs font-semibold"
                >
                  Advance to Module I: Marketing
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
