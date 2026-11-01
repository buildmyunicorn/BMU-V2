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
} from '@/lib/auth/session-store';
import {
  saveModuleHStep1RevenueModelAction,
  saveModuleHStep2PricingTiersAction,
  generatePricingStrategyJustificationAction,
} from '@/app/actions/module-h';

interface ModuleHWorkspaceProps {
  plan: ActiveStartupPlan;
  selectedCountry?: string;
  isVaultReadonly?: boolean;
  onSaveStep1RevenueModel?: (step1Data: RevenueModelStep1Data, progress?: number) => Promise<void> | void;
  onSaveStep2PricingTiers?: (step2Data: PricingTiersStep2Data, progress?: number) => Promise<void> | void;
  onBackToModuleG?: () => void;
  onContinueToModuleI?: () => void;
}

export function ModuleHWorkspace({
  plan,
  selectedCountry = 'IE',
  isVaultReadonly = false,
  onSaveStep1RevenueModel,
  onSaveStep2PricingTiers,
  onBackToModuleG,
  onContinueToModuleI,
}: ModuleHWorkspaceProps) {
  // Step expansion state: default to step 1 (or 2 if 1 is already saved)
  const [openStep, setOpenStep] = useState<number | 'ALL'>(() => {
    if (plan.moduleHData?.step1RevenueModel?.revenueModelVehicle) {
      return plan.moduleHData?.step2PricingTiers?.tiers?.length ? 2 : 2;
    }
    return 1;
  });

  const [activeWhyCard, setActiveWhyCard] = useState<number | null>(null);
  const [activeExampleCard, setActiveExampleCard] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isGeneratingAiJustification, setIsGeneratingAiJustification] = useState(false);
  const [aiJustificationSuccess, setAiJustificationSuccess] = useState(false);
  const [aiAssessorTip, setAiAssessorTip] = useState<string | null>(null);

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
              openStep === 3
                ? 'bg-indigo-500/30 text-white font-semibold'
                : 'text-indigo-200 hover:bg-indigo-900/40 opacity-70'
            }`}
          >
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[10px] text-slate-400">
              3
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
            <div className="space-y-4">
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
      {/* PLACEHOLDERS FOR STEPS 3, 4, 5 (Upcoming)                      */}
      {/* ------------------------------------------------------------- */}
      {openStep !== 'ALL' && openStep === 3 && (
        <Card className="rounded-xl border border-indigo-200 bg-indigo-50/20 p-6 text-center space-y-3">
          <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300 text-xs">
            Step 3: Up Next
          </Badge>
          <h3 className="text-base font-bold text-slate-900">
            Step 3: Pocket Profit &amp; 3-Year Breakeven Simulator
          </h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            Next, we will connect your average price of {currencySymbol}
            {blendedAveragePrice} to your Year 1, 2, and 3 payroll schedules, factoring in Stripe
            processing fees and direct costs.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setOpenStep(2)}
            className="text-xs text-indigo-700"
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Back to Step 2
          </Button>
        </Card>
      )}
    </div>
  );
}
