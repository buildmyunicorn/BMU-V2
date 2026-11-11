'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Megaphone,
  Check,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Lightbulb,
  Wand2,
  Copy,
  Printer,
  FileText,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Target,
  Users,
  Compass,
  Bookmark,
  Send,
  Sliders,
  DollarSign,
  ShieldCheck,
  Zap,
  Package,
  Globe,
  Tag,
  Radio,
  Layers,
  Store,
  CheckSquare,
  Square,
  TrendingUp,
  Share2,
  PhoneCall,
  Mail,
  MessageSquare,
  Plus,
  Trash2,
  Download,
  Handshake,
  Clock,
  ShieldAlert,
  ArrowDown,
  UserCheck,
  CheckCircle,
  Loader2,
  ArrowLeft,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type {
  ActiveStartupPlan,
  BrandPositioningStep1Data,
  BrandToneOfVoice,
  PositioningStatementFormula,
  SavedModuleIData,
  Modern4PsStep2Data,
  ProductPackagingType,
  PricingStanceType,
  PrimaryDistributionChannel,
  PrimaryAcquisitionEngine,
  First10AcquisitionArchetype,
  PipelineProspectStatus,
  First10ProspectItem,
  First10PilotOffer,
  First10OutreachScripts,
  First10FollowUpCadence,
  First10ObjectionBusters,
  First10LetterOfIntent,
  First10PlaybookStep3Data,
  BudgetGoalPreset,
  MarketingBudgetBucketType,
  MarketingGrantEligibilityStatus,
  LtvPurchaseModelType,
  PaidAdsViabilityDecision,
  MarketingBudgetLineItem,
  MarketingBudgetStep4Data,
  MarketingReadinessConfidence,
  MarketingExecutiveBriefStep5Data,
} from '@/lib/auth/session-store';
import type { BlindSpotItem } from '@/db/schema';
import {
  saveModuleIStep1PositioningAction,
  generateModuleIPositioningAction,
  saveModuleIStep2FourPsAction,
  generateModuleIFourPsAction,
  saveModuleIStep3First10Action,
  generateModuleIFirst10Action,
  generateModuleIObjectionBustersAction,
  saveModuleIStep4BudgetAction,
  generateModuleIBudgetAction,
  saveModuleIStep5BriefAction,
  generateModuleIMarketingBriefAction,
  parkModuleIOpenQuestionAction,
} from '@/app/actions/module-i';
import {
  generateLetterOfIntentMarkdown,
  buildLetterOfIntentStandaloneHtmlDocument,
} from '@/lib/export/loi-document';
import {
  buildModuleIStandaloneHtmlDocument,
  buildModuleIMarkdownBrief,
  type ModuleIBriefData,
} from '@/lib/export/module-i-brief';
import type { SupportedCountryCode } from '@/lib/localization';

interface ModuleIWorkspaceProps {
  plan: ActiveStartupPlan;
  selectedCountry?: string;
  isVaultReadonly?: boolean;
  onSaveStep1Positioning?: (step1Data: BrandPositioningStep1Data, progress?: number) => Promise<void> | void;
  onSaveStep2FourPs?: (step2Data: Modern4PsStep2Data, progress?: number) => Promise<void> | void;
  onSaveStep3First10?: (step3Data: First10PlaybookStep3Data, progress?: number) => Promise<void> | void;
  onSaveStep4Budget?: (step4Data: MarketingBudgetStep4Data, progress?: number) => Promise<void> | void;
  onSaveStep5Brief?: (step5Data: MarketingExecutiveBriefStep5Data, progress?: number) => Promise<void> | void;
  onBackToModuleH?: () => void;
  onContinueToModuleJ?: () => void;
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

export interface UpstreamPriceResolution {
  priceHeadline: string;
  sourceLabel: string;
  isFromUpstream: boolean;
}

/**
 * Resolves the primary commercial headline price anchor from upstream modules:
 * 1. Module H (Tiers: Flagship recommended default, or first paid tier)
 * 2. Module H (Blended average net price)
 * 3. Module H (Breakeven calculator active price slider)
 * 4. Module B (Market sizing beachhead segment price & cadence)
 * 5. Module A (Concept canvas revenue & grant fit regex extraction)
 * 6. Fallback to standard suggested benchmark (€49 / £49 / $49 per month)
 */
export function resolveUpstreamHeadlinePrice(
  plan: Partial<ActiveStartupPlan>,
  currencySymbol: string = '€'
): UpstreamPriceResolution {
  // 1. Module H: Pricing Tiers
  const tiers = plan.moduleHData?.step2PricingTiers?.tiers;
  if (Array.isArray(tiers) && tiers.length > 0) {
    const defaultTier = tiers.find(
      (t) => t.isRecommendedDefault && ((t.priceGross ?? 0) > 0 || (t.priceNetOfTax ?? 0) > 0)
    );
    const firstPaidTier = tiers.find(
      (t) => (t.priceGross ?? 0) > 0 || (t.priceNetOfTax ?? 0) > 0
    );
    const chosenTier = defaultTier || firstPaidTier;

    if (chosenTier) {
      const amount = chosenTier.priceGross || chosenTier.priceNetOfTax;
      let cadence = ' / month';
      if (chosenTier.billingFrequency === 'ANNUAL') cadence = ' / year';
      else if (chosenTier.billingFrequency === 'ONE_OFF') cadence = ' one-off';

      const tierTag = chosenTier.isRecommendedDefault ? 'Flagship' : 'Tier';
      return {
        priceHeadline: `${currencySymbol}${amount}${cadence}`,
        sourceLabel: `Module H (${tierTag}: "${chosenTier.name}")`,
        isFromUpstream: true,
      };
    }
  }

  // 2. Module H: Blended Average Net Price
  const blendedNet = plan.moduleHData?.step2PricingTiers?.blendedAveragePriceNet;
  if (typeof blendedNet === 'number' && blendedNet > 0) {
    return {
      priceHeadline: `${currencySymbol}${blendedNet} / month`,
      sourceLabel: 'Module H (Blended Average)',
      isFromUpstream: true,
    };
  }

  // 3. Module H: Breakeven Calculator Price Slider
  const sliderPrice = plan.moduleHData?.step3BreakevenCalculator?.activePriceSlider;
  if (typeof sliderPrice === 'number' && sliderPrice > 0) {
    return {
      priceHeadline: `${currencySymbol}${sliderPrice} / month`,
      sourceLabel: 'Module H (Breakeven Price Slider)',
      isFromUpstream: true,
    };
  }

  // 4. Module B: Market Sizing Beachhead Segment
  const segments = plan.moduleBData?.marketSizing?.segments;
  if (Array.isArray(segments) && segments.length > 0) {
    const activeSegment = segments.find(
      (s) => s.pricePerCustomerInput && s.pricePerCustomerInput.trim().length > 0
    );
    if (activeSegment) {
      const rawPrice = activeSegment.pricePerCustomerInput.trim();
      let formatted = rawPrice;
      const numericVal = parseFloat(rawPrice.replace(/[^0-9.]/g, ''));
      if (!isNaN(numericVal) && !/[a-zA-Z]/.test(rawPrice)) {
        let suffix = ' / month';
        if (activeSegment.billingCadence === 'YEARLY_OR_ONE_OFF') {
          suffix = ' / year';
        } else if (
          activeSegment.billingCadence === 'OTHER' &&
          activeSegment.otherBillingCadenceText?.trim()
        ) {
          suffix = ` / ${activeSegment.otherBillingCadenceText.trim()}`;
        }
        formatted = `${currencySymbol}${numericVal}${suffix}`;
      } else if (!rawPrice.includes('€') && !rawPrice.includes('£') && !rawPrice.includes('$')) {
        formatted = `${currencySymbol}${rawPrice}`;
      }

      return {
        priceHeadline: formatted,
        sourceLabel: `Module B (${activeSegment.segmentName || 'Beachhead Segment'})`,
        isFromUpstream: true,
      };
    }
  }

  // 5. Module A: Concept Canvas Revenue & Grant Fit
  const revenueFitText = plan.conceptCanvas?.revenueAndGrantFit;
  if (revenueFitText && revenueFitText.trim().length > 0) {
    const priceRegex =
      /(?:€|£|\$|EUR|GBP|USD)\s*(\d+(?:[.,]\d+)?)\s*(?:\/|\s*(?:per|a)\s*)?\s*(month|mo|year|yr|user|seat|customer|order|audit|unit|project|one-off)?/i;
    const match = revenueFitText.match(priceRegex);
    if (match) {
      const matchedAmount = match[1];
      const matchedUnit = match[2]?.toLowerCase();
      let cadence = ' / month';
      if (matchedUnit === 'year' || matchedUnit === 'yr') cadence = ' / year';
      else if (matchedUnit === 'one-off' || matchedUnit === 'project') cadence = ' one-off';
      else if (matchedUnit) cadence = ` / ${matchedUnit}`;

      return {
        priceHeadline: `${currencySymbol}${matchedAmount}${cadence}`,
        sourceLabel: 'Module A (Concept Canvas Revenue Model)',
        isFromUpstream: true,
      };
    }
  }

  // 6. Default Fallback
  return {
    priceHeadline: `${currencySymbol}49 / month`,
    sourceLabel: 'Suggested Benchmark',
    isFromUpstream: false,
  };
}

export interface UpstreamUnitEconomicsResolution {
  y1BreakevenCustomers: number;
  y2BreakevenCustomers: number;
  y3BreakevenCustomers: number;
  netPricePerCustomer: number;
  pocketProfitPerCustomer: number;
  grossMarginPercent: number;
  monthlyFixedBurnY1: number;
  leadConversionPercentFromModH: number;
  retentionMonthsFromModH: number;
  defaultLtvPurchaseModel: LtvPurchaseModelType;
  isFromModuleH: boolean;
  sourceSummaryLabel: string;
}

export function resolveUpstreamUnitEconomics(
  plan: Partial<ActiveStartupPlan>,
  currencySymbol: string = '€'
): UpstreamUnitEconomicsResolution {
  const modH = plan.moduleHData;
  const revModel = modH?.step1RevenueModel;
  const calc = modH?.step3BreakevenCalculator;
  const tiers = modH?.step2PricingTiers;
  const salesAssumptions = modH?.step4SalesAssumptions;

  // 1. Net price per customer
  let netPrice = 79;
  if (typeof tiers?.blendedAveragePriceNet === 'number' && tiers.blendedAveragePriceNet > 0) {
    netPrice = tiers.blendedAveragePriceNet;
  } else if (typeof calc?.activePriceSlider === 'number' && calc.activePriceSlider > 0) {
    netPrice = calc.activePriceSlider;
  } else {
    const resolvedPrice = resolveUpstreamHeadlinePrice(plan, currencySymbol);
    const parsedNum = parseFloat(resolvedPrice.priceHeadline.replace(/[^0-9.]/g, ''));
    if (!isNaN(parsedNum) && parsedNum > 0) {
      netPrice = parsedNum;
    }
  }

  // 2. Friction costs & Pocket Profit (Contribution Margin) per customer
  const friction = calc?.frictionCosts;
  let pocketProfit = Math.round(netPrice * 0.78);
  if (friction) {
    const stripeFee =
      netPrice * ((friction.paymentGatewayPercent ?? 1.7) / 100) +
      (friction.paymentGatewayFixedCents ?? 25) / 100;
    const variableCogs = friction.directVariableCogsPerUnit ?? 0;
    const refundBuffer = netPrice * ((friction.disputeRefundBufferPercent ?? 2) / 100);
    const affiliateCut = netPrice * ((friction.affiliateCommissionPercent ?? 0) / 100);
    const totalFriction = stripeFee + variableCogs + refundBuffer + affiliateCut;
    pocketProfit = Math.max(5, Math.round((netPrice - totalFriction) * 100) / 100);
  }

  const grossMarginPercent =
    netPrice > 0 ? Math.min(99, Math.max(5, Math.round((pocketProfit / netPrice) * 100))) : 78;

  // 3. Breakeven customers across Y1, Y2, Y3
  const y1TargetObj = calc?.yearTargets?.find((y) => y.yearNumber === 1);
  const y2TargetObj = calc?.yearTargets?.find((y) => y.yearNumber === 2);
  const y3TargetObj = calc?.yearTargets?.find((y) => y.yearNumber === 3);

  const monthlyFixedBurnY1 = y1TargetObj
    ? (y1TargetObj.monthlyPayrollBaseline || 0) + (y1TargetObj.otherFixedMonthlyOverheads || 0)
    : 2200;

  const y1BreakevenCustomers =
    y1TargetObj && y1TargetObj.customersNeededToBreakeven > 0
      ? y1TargetObj.customersNeededToBreakeven
      : typeof calc?.activeCustomerSlider === 'number' && calc.activeCustomerSlider > 0
      ? calc.activeCustomerSlider
      : Math.max(5, Math.ceil(monthlyFixedBurnY1 / Math.max(10, pocketProfit)));

  const y2BreakevenCustomers =
    y2TargetObj && y2TargetObj.customersNeededToBreakeven > 0
      ? y2TargetObj.customersNeededToBreakeven
      : Math.round(y1BreakevenCustomers * 1.8);

  const y3BreakevenCustomers =
    y3TargetObj && y3TargetObj.customersNeededToBreakeven > 0
      ? y3TargetObj.customersNeededToBreakeven
      : Math.round(y1BreakevenCustomers * 2.8);

  // 4. Conversion rate & retention from Module H Step 4
  const leadConversionPercentFromModH =
    typeof salesAssumptions?.expectedConversionRatePercent === 'number' &&
    salesAssumptions.expectedConversionRatePercent > 0
      ? salesAssumptions.expectedConversionRatePercent
      : 5;

  const churnOrRepeat = salesAssumptions?.expectedMonthlyChurnOrRepeatPercent;
  const isOneOffModel =
    revModel?.revenueModelVehicle === 'ONE_OFF_TRANSACTION' ||
    revModel?.billingCadenceDefault === 'ONE_OFF' ||
    revModel?.billingCadenceDefault === 'PROJECT_MILESTONE';
  const catLower = (plan.industryCategory || '').toLowerCase();
  const isEcommerceOrRepeat =
    catLower.includes('e-commerce') ||
    catLower.includes('food') ||
    catLower.includes('brick');

  let defaultLtvPurchaseModel: LtvPurchaseModelType = 'RECURRING_SUBSCRIPTION';
  let retentionMonthsFromModH = 18;

  if (isOneOffModel) {
    if (isEcommerceOrRepeat || (typeof churnOrRepeat === 'number' && churnOrRepeat >= 15)) {
      defaultLtvPurchaseModel = 'REPEAT_PURCHASE_ORDERS';
      retentionMonthsFromModH = 2.5;
    } else {
      defaultLtvPurchaseModel = 'SINGLE_ONE_TIME_PURCHASE';
      retentionMonthsFromModH = 1;
    }
  } else if (typeof churnOrRepeat === 'number' && churnOrRepeat > 0 && churnOrRepeat <= 50) {
    retentionMonthsFromModH = Math.min(36, Math.max(6, Math.round(100 / churnOrRepeat)));
  }

  const isFromModuleH = Boolean(
    modH?.step3BreakevenCalculator || modH?.step2PricingTiers || modH?.step4SalesAssumptions
  );

  return {
    y1BreakevenCustomers,
    y2BreakevenCustomers,
    y3BreakevenCustomers,
    netPricePerCustomer: Math.round(netPrice * 100) / 100,
    pocketProfitPerCustomer: Math.round(pocketProfit),
    grossMarginPercent,
    monthlyFixedBurnY1,
    leadConversionPercentFromModH,
    retentionMonthsFromModH,
    defaultLtvPurchaseModel,
    isFromModuleH,
    sourceSummaryLabel: isFromModuleH
      ? `Synced from Module H (Y1 Breakeven: ${y1BreakevenCustomers} customers @ ${currencySymbol}${Math.round(pocketProfit)} pocket profit)`
      : `Estimated Baseline (${y1BreakevenCustomers} customers @ ${currencySymbol}${Math.round(pocketProfit)} pocket profit)`,
  };
}

export function ModuleIWorkspace({
  plan,
  selectedCountry = 'IE',
  isVaultReadonly = false,
  onSaveStep1Positioning,
  onSaveStep2FourPs,
  onSaveStep3First10,
  onSaveStep4Budget,
  onSaveStep5Brief,
  onBackToModuleH,
  onContinueToModuleJ,
  onNavigateToModule,
  initialStep,
  highlightTarget,
}: ModuleIWorkspaceProps) {
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
        const targetId = highlightTarget || `module-i-step-${initialStep}`;
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

  // Micro-coaching drawer states
  const [activeWhyCard, setActiveWhyCard] = useState<number | null>(null);
  const [activeExampleCard, setActiveExampleCard] = useState<number | null>(null);

  // Parking lot state
  const [parkingQuestionText, setParkingQuestionText] = useState('');
  const [isParkingQuestion, setIsParkingQuestion] = useState(false);
  const [parkingSuccess, setParkingSuccess] = useState(false);

  // Save state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

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

  // AI Generation State
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);
  const [aiAssessorTip, setAiAssessorTip] = useState<string | null>(null);

  // Context derived from earlier modules
  const planTitle = plan.title || 'Our Venture';
  const beachheadPersona =
    plan.moduleBData?.beachhead?.beachheadSegment ||
    plan.conceptCanvas?.targetCustomer ||
    'Early-stage founders and modern operators';
  const customerProblem =
    plan.conceptCanvas?.coreProblem ||
    plan.moduleBData?.beachhead?.buyingTriggerNotes ||
    'fragmented manual processes and expensive trial-and-error';
  const solutionConcept =
    plan.conceptCanvas?.proposedSolution ||
    plan.oneLinerSummary ||
    'an automated, intelligent operating workspace';
  const primaryUvp =
    plan.conceptCanvas?.unfairAdvantage ||
    plan.moduleBData?.competitiveWedge?.competitiveEdgeSummary ||
    'streamlined compliance and accelerated commercial execution';
  const competitiveWedge =
    plan.moduleBData?.competitiveWedge?.competitiveEdgeSummary ||
    plan.conceptCanvas?.unfairAdvantage ||
    'generic templates and disjointed spreadsheets';

  // -------------------------------------------------------------
  // STEP 1 STATE
  // -------------------------------------------------------------
  const [step1Data, setStep1Data] = useState<BrandPositioningStep1Data>(() => {
    const existing = plan.moduleIData?.step1Positioning;
    if (existing) return existing;

    return {
      elevatorHook140: `${planTitle} helps ${beachheadPersona.slice(0, 35)} eliminate ${customerProblem.slice(0, 30)} with ${solutionConcept.slice(0, 35)}.`.slice(0, 140),
      positioningFormula: {
        targetCustomer: beachheadPersona,
        customerProblem: customerProblem,
        solutionCategory: solutionConcept,
        primaryBenefit: primaryUvp,
        competitiveWedge: competitiveWedge,
      },
      toneOfVoice: 'AUTHORITATIVE_TRUSTED',
      otherToneOfVoiceText: '',
      toneOfVoiceBoundary: {
        weAre: 'Direct, evidence-backed, and practical',
        weAreNever: 'Bureaucratic, vague, or filled with marketing buzzwords',
      },
      corePillars: [
        'Speed & Radical Efficiency',
        'Defensible Grant & Investor Proof',
        'Zero-Friction Founder Experience',
      ],
    };
  });

  const isStep1Complete = Boolean(
    step1Data.elevatorHook140.trim().length > 10 &&
      step1Data.positioningFormula.targetCustomer.trim() &&
      step1Data.positioningFormula.customerProblem.trim() &&
      step1Data.positioningFormula.solutionCategory.trim() &&
      step1Data.positioningFormula.primaryBenefit.trim() &&
      step1Data.positioningFormula.competitiveWedge.trim() &&
      step1Data.corePillars[0].trim() &&
      step1Data.corePillars[1].trim() &&
      step1Data.corePillars[2].trim()
  );

  // -------------------------------------------------------------
  // STEP 2 STATE & PREFILLS
  // -------------------------------------------------------------
  const currencySymbol =
    plan.baseCurrency === 'GBP' ? '£' : plan.baseCurrency === 'USD' ? '$' : '€';

  // Comprehensive Multi-Module Upstream Price Resolution
  const resolvedUpstreamPrice = useMemo(() => {
    return resolveUpstreamHeadlinePrice(plan, currencySymbol);
  }, [plan, currencySymbol]);

  const defaultPriceHeadline = resolvedUpstreamPrice.priceHeadline;

  const defaultPackagingType: ProductPackagingType = (() => {
    const track = plan.moduleDData?.productVehicle?.productTrack;
    if (track === 'PHYSICAL_PRODUCT_ECOM') return 'PHYSICAL_D2C_PRODUCT';
    if (track === 'PRODUCTIZED_SERVICE_AGENCY' || track === 'EDUCATION_PROGRAM_COHORT') return 'HIGH_TOUCH_SERVICE';
    if (track === 'MARKETPLACE_PLATFORM') return 'MARKETPLACE_PLATFORM';
    if (track === 'HYBRID_HARDWARE_SOFTWARE') return 'HYBRID_HARDWARE_SOFTWARE';
    return 'DIGITAL_SAAS_CLOUD';
  })();

  const [step2Data, setStep2Data] = useState<Modern4PsStep2Data>(() => {
    const existing = plan.moduleIData?.step2FourPs;
    if (existing) {
      // Auto-adopt upstream price if existing headline is empty or an uncustomized default fallback
      const existingPrice = existing.priceP2?.headlinePricePoint?.trim() || '';
      const isGenericDefault =
        !existingPrice ||
        existingPrice === '€49 / month' ||
        existingPrice === '£49 / month' ||
        existingPrice === '$49 / month';

      if (isGenericDefault && resolvedUpstreamPrice.isFromUpstream) {
        return {
          ...existing,
          priceP2: {
            ...existing.priceP2,
            headlinePricePoint: resolvedUpstreamPrice.priceHeadline,
          },
        };
      }
      return existing;
    }

    return {
      productP1: {
        packagingType: defaultPackagingType,
        otherPackagingTypeText: '',
        coreDeliverableSummary:
          plan.conceptCanvas?.proposedSolution ||
          plan.oneLinerSummary ||
          `${planTitle} platform with guided onboarding and automated workflows.`,
        perceivedValueDriver:
          'Structured templates, automated intelligence, and dedicated onboarding support.',
      },
      priceP2: {
        pricingStance: 'VALUE_BASED_PREMIUM',
        otherPricingStanceText: '',
        headlinePricePoint: defaultPriceHeadline,
        priceJustification:
          'Saves at least 15+ hours of manual trial-and-error per month, paying for itself within the first week of use.',
        paymentTermsOrFrictionReducer:
          '14-day free trial with no credit card required, plus 30-day money-back guarantee.',
      },
      placeP3: {
        primaryChannel: 'DIRECT_WEB_SELF_SERVE',
        otherPrimaryChannelText: '',
        secondaryChannels: ['OUTBOUND_DIRECT_SALES', 'PARTNER_RESELLER_NETWORK'],
        customerJourneyFrictionPoint:
          'Hesitation around initial onboarding friction and the effort required to see first results.',
        frictionMitigationPlan:
          'Interactive 5-minute setup wizard, pre-filled industry presets, and immediate tangible outputs.',
      },
      promotionP4: {
        primaryAcquisitionEngine: 'FOUNDER_LED_ORGANIC',
        otherAcquisitionEngineText: '',
        beachheadChannelTactics:
          'Publish 3 in-depth teardowns weekly on LinkedIn highlighting common founder blind spots; direct-message every founder who engages with a free audit.',
        primarySocialHub: 'LinkedIn',
        contentOrCampaignHook: `${planTitle}: The Zero-Fluff Playbook for Modern Operators.`,
      },
      digitalPresenceChecklist: {
        hasLandingPage: false,
        hasDomainEmail: false,
        hasAnalyticsTracking: false,
        hasSocialProofOrWaitlist: false,
      },
      strategicRationale: '',
    };
  });

  const isStep2Complete = Boolean(
    step2Data.productP1.coreDeliverableSummary.trim().length > 5 &&
    (step2Data.productP1.packagingType !== 'OTHER' || (step2Data.productP1.otherPackagingTypeText?.trim() ?? '').length > 0) &&
    step2Data.priceP2.headlinePricePoint.trim().length > 0 &&
    step2Data.priceP2.priceJustification.trim().length > 5 &&
    (step2Data.priceP2.pricingStance !== 'OTHER' || (step2Data.priceP2.otherPricingStanceText?.trim() ?? '').length > 0) &&
    step2Data.placeP3.customerJourneyFrictionPoint.trim().length > 5 &&
    (step2Data.placeP3.primaryChannel !== 'OTHER' || (step2Data.placeP3.otherPrimaryChannelText?.trim() ?? '').length > 0) &&
    step2Data.promotionP4.beachheadChannelTactics.trim().length > 5 &&
    (step2Data.promotionP4.primaryAcquisitionEngine !== 'OTHER' || (step2Data.promotionP4.otherAcquisitionEngineText?.trim() ?? '').length > 0)
  );

  // Step 3 Data State
  const [step3Data, setStep3Data] = useState<First10PlaybookStep3Data>(() => {
    if (plan.moduleIData?.step3First10) {
      return plan.moduleIData.step3First10;
    }

    const defaultPrice =
      step2Data?.priceP2?.headlinePricePoint ||
      resolvedUpstreamPrice.priceHeadline ||
      `${currencySymbol}99 / month`;

    const targetCompany = 'Acme Enterprises Ltd';
    const contactName = 'John Doe (Managing Director)';
    const kpi = 'Achieve at least 30% time reduction and 95% user satisfaction within 8 weeks.';

    const initialLoi = generateLetterOfIntentMarkdown({
      startupName: planTitle,
      targetCompanyName: targetCompany,
      targetContactName: contactName,
      pilotDurationWeeks: 8,
      pilotPricePoint: defaultPrice,
      primarySuccessKpi: kpi,
      customTermsText: 'Non-binding intent to purchase upon successful pilot evaluation criteria.',
      hqCountryCode: (plan.hqCountryCode as any) || 'IE',
      baseCurrency: plan.baseCurrency || 'EUR',
    });

    return {
      acquisitionArchetype: 'ACCOUNT_BASED_SNIPER',
      otherAcquisitionArchetypeText: '',
      pilotOffer: {
        pilotStructure:
          '50% pilot discount for first 8 weeks in exchange for bi-weekly feedback and public case study rights.',
        quidProQuoFounderAsk:
          'Bi-weekly 30-minute product review call + named logo permission upon achieving mutually agreed KPI.',
        riskReversal:
          '100% money-back satisfaction guarantee: If the agreed KPI is not hit within 30 days, we issue a full refund with zero questions asked.',
      },
      targetPipeline: [
        {
          id: 'prospect_1',
          companyOrPersona: 'Pilot Candidate Alpha (Target Account 1)',
          decisionMakerTitle: 'Head of Operations / Founder',
          triggerEventOrAngle: `Solving immediate friction around ${customerProblem.slice(0, 50) || 'operational delays'}.`,
          status: 'TO_CONTACT',
          source: 'MODULE_C_WAITLIST',
          notes: 'High-intent candidate from early discovery/waitlist.',
        },
        {
          id: 'prospect_2',
          companyOrPersona: 'Pilot Candidate Beta (Target Account 2)',
          decisionMakerTitle: 'Managing Director',
          triggerEventOrAngle: `Frustrated with legacy tools and looking for ${primaryUvp.slice(0, 50) || 'a modern solution'}.`,
          status: 'TO_CONTACT',
          source: 'MANUAL',
          notes: 'Second-degree connection via industry network.',
        },
        {
          id: 'prospect_3',
          companyOrPersona: 'Pilot Candidate Gamma (Target Account 3)',
          decisionMakerTitle: 'Operations Lead',
          triggerEventOrAngle: 'Expressed interest during market research survey.',
          status: 'TO_CONTACT',
          source: 'MANUAL',
          notes: 'Referred by advisory contact.',
        },
      ],
      outreachScripts: {
        advisoryScript: `Hi {{FirstName}},\n\nI noticed your work leading {{Area}} at {{Company}} and wanted to reach out directly.\n\nWe are currently building a purpose-built solution to address ${customerProblem.slice(0, 60) || 'key industry bottlenecks'}, specifically tailored for ${beachheadPersona || 'operators'}.\n\nRather than pitching you, we are assembling a private 10-person advisory cohort of operators to pressure-test the prototype and ensure it solves the real day-to-day friction.\n\nWould you be open to a brief 15-minute feedback chat this Thursday or Friday? Zero sales pitch—just founder-to-operator insights.\n\nBest regards,\n[Your Name]\nFounder, ${planTitle}`,
        sniperScript: `Hi {{FirstName}},\n\nQuick observation: While reviewing how {{Company}} currently handles this workflow, I noticed a potential bottleneck around ${customerProblem.slice(0, 50) || 'operational delays'}.\n\nWe put together a quick 3-minute video teardown showing how we can streamline this by 50% without disrupting your existing stack: [Link to 3-Min Loom / PDF Teardown]\n\nIf this resonates, I’d love to grant you 60 days of free pilot access to our platform in exchange for your candid feedback.\n\nWorth a quick look?\n\nBest,\n[Your Name]`,
        foundingCohortScript: `Hi {{FirstName}},\n\nWe are officially opening 10 Founding Partner slots for ${planTitle} ahead of our public launch next month.\n\nAs a Founding Partner, you get:\n1. 50% lifetime discount on our commercial tier (${defaultPrice})\n2. Direct Slack channel access to our engineering team\n3. Bespoke white-glove onboarding and data migration\n\nWe are keeping this strictly capped at 10 companies to ensure white-glove attention.\n\nAre you open to reviewing the 1-page pilot spec this week?\n\nBest,\n[Your Name]`,
      },
      followUpCadence: {
        day1Icebreaker:
          'Initial personalized outreach sent via LinkedIn message or direct email with custom insight hook.',
        day4Bump:
          'Follow-up #1: Sharing a relevant 1-page industry benchmark, checklist, or quick tear-down with zero guilt trip.',
        day8MicroQuestion:
          'Follow-up #2: Asking a binary 1-sentence question (e.g., "Is solving this a Q1 priority, or should I circle back in summer?").',
        day14Breakup: `Hi {{FirstName}},\n\nI know you’re slammed, so I’ll assume addressing ${customerProblem.slice(0, 40) || 'this issue'} isn’t on the front burner right now.\n\nI’m going to close out your file so I don’t clutter your inbox further. If things change down the road or you ever want to compare notes on industry tooling, feel free to ping me anytime.\n\nWishing you and the team at {{Company}} continued success!\n\nBest,\n[Your Name]`,
      },
      objectionBusters: {
        objection1Title: '1. Vendor Longevity & Credibility Risk',
        objection1Quote:
          "You're an unproven early-stage startup. What happens if you go bust or stop maintaining this software next year?",
        vendorRisk:
          'We are fully funded for our milestone roadmap, and more importantly: We provide full data portability with 1-click automated exports. If we ever sunset, your data and workflows remain 100% yours. Furthermore, during the pilot, you have direct phone and Slack access to the founding technical team with guaranteed 2-hour response SLAs.',
        objection2Title: '2. Status Quo / Switching Inertia',
        objection2Quote:
          "Our existing spreadsheet / manual routine isn't perfect, but everyone knows it and we don't have time to retrain the team right now.",
        statusQuoInertia:
          'We do not ask you to switch your entire stack on Day 1. We handle 100% of the initial setup, onboarding, and data import for you in under 30 minutes. You can run us side-by-side on a single workflow for 30 days. If it doesn’t save your team at least 5 hours in the first month, you can pull the plug with zero disruption.',
        objection3Title: '3. Missing Feature Gap / Integrations',
        objection3Quote:
          "We really like the concept, but we cannot adopt unless you have custom integrations and automated export.",
        featureGap:
          'That exact capability is on our 60-day roadmap. As a Founding Pilot partner, you have direct input into our engineering sprints. If you join the pilot cohort, we can co-design that specific module with your team and ship an initial release directly to your workspace within 3 weeks.',
      },
      letterOfIntent: {
        targetCompanyName: targetCompany,
        targetContactName: contactName,
        pilotDurationWeeks: 8,
        pilotPricePoint: defaultPrice,
        primarySuccessKpi: kpi,
        customTermsText:
          'Non-binding intent to purchase upon successful pilot evaluation criteria.',
        generatedLoiMarkdown: initialLoi,
      },
    };
  });

  const isStep3Complete = Boolean(
    (step3Data.acquisitionArchetype !== 'OTHER' || (step3Data.otherAcquisitionArchetypeText?.trim() ?? '').length > 0) &&
    step3Data.pilotOffer.pilotStructure.trim().length > 5 &&
    step3Data.pilotOffer.quidProQuoFounderAsk.trim().length > 5 &&
    step3Data.targetPipeline.length >= 3 &&
    step3Data.outreachScripts.advisoryScript.trim().length > 20 &&
    step3Data.followUpCadence.day14Breakup.trim().length > 10 &&
    step3Data.objectionBusters.vendorRisk.trim().length > 10 &&
    step3Data.letterOfIntent.targetCompanyName.trim().length > 1 &&
    step3Data.letterOfIntent.primarySuccessKpi.trim().length > 5
  );

  // -------------------------------------------------------------
  // STEP 4 STATE: REVERSE-ENGINEERED MARKETING BUDGET & CAC
  // -------------------------------------------------------------
  const upstreamEconomics = useMemo(
    () => resolveUpstreamUnitEconomics(plan, currencySymbol),
    [plan, currencySymbol]
  );

  const [step4Data, setStep4Data] = useState<MarketingBudgetStep4Data>(() => {
    const existing = plan.moduleIData?.step4Budget;
    if (existing && typeof existing === 'object' && Array.isArray(existing.budgetLineItems)) {
      return existing;
    }

    const isIE = (plan.hqCountryCode || 'IE') !== 'GB';
    const cat = (plan.industryCategory || '').toLowerCase();
    const isDtc = cat.includes('e-commerce') || cat.includes('food') || cat.includes('brick');
    const isService = cat.includes('service') || cat.includes('agency');

    const defaultTargetCustomers = upstreamEconomics.y1BreakevenCustomers;
    const defaultLeadConv = upstreamEconomics.leadConversionPercentFromModH;
    const defaultVisitorConv = isService ? 6.0 : isDtc ? 3.0 : 4.0;
    const defaultPaidShare =
      step2Data.promotionP4.primaryAcquisitionEngine === 'PAID_PERFORMANCE_ADS'
        ? 65
        : step2Data.promotionP4.primaryAcquisitionEngine === 'FOUNDER_LED_ORGANIC' ||
          step2Data.promotionP4.primaryAcquisitionEngine === 'OUTBOUND_ACCOUNT_BASED'
        ? 25
        : 35;
    const defaultCpc = isDtc ? 1.1 : 2.1;
    const defaultRetention = upstreamEconomics.retentionMonthsFromModH;

    const reqLeads = Math.ceil(defaultTargetCustomers / (defaultLeadConv / 100));
    const reqTouches = Math.ceil(reqLeads / (defaultVisitorConv / 100));
    const paidTouches = Math.ceil(reqTouches * (defaultPaidShare / 100));
    const initialAdSpend = Math.max(150, Math.round((paidTouches * defaultCpc) / 10) * 10);

    const defaultItems: MarketingBudgetLineItem[] = [
      {
        id: 'mkt_item_1',
        bucket: 'PAID_MEDIA_ADS',
        channelOrToolName: isDtc
          ? 'High-Intent Search & Meta Retargeting Ads'
          : 'Targeted Search Intent & LinkedIn Sniper Campaigns',
        monthlySpend: initialAdSpend,
        grantEligibilityStatus: 'INELIGIBLE_ONGOING_AD_SPEND',
        notes: `Drives ~${paidTouches.toLocaleString()} paid monthly clicks at ${currencySymbol}${defaultCpc.toFixed(2)} CPC. Funded from trading cashflow (ongoing ad clicks are ineligible for IE LEO / EI grants).`,
      },
      {
        id: 'mkt_item_2',
        bucket: 'GROWTH_STACK_TOOLS',
        channelOrToolName: 'CRM, Lead Enrichment & Outbound Sequencing Stack',
        monthlySpend: 120,
        grantEligibilityStatus: 'ELIGIBLE_CAPABILITY_OR_EXPORT',
        notes: isIE
          ? 'Supports conversion tracking and automated follow-ups. Eligible under LEO Digital for Business / Grow Digital.'
          : 'Core sales enablement and conversion tracking stack.',
      },
      {
        id: 'mkt_item_3',
        bucket: 'CONTENT_EVENTS_PR',
        channelOrToolName: isDtc
          ? 'Product Sampling Kits, Creator Seeding & Launch PR'
          : 'Industry Trade Show Demo Presence & Case Study Collateral',
        monthlySpend: 230,
        grantEligibilityStatus: 'ELIGIBLE_CAPABILITY_OR_EXPORT',
        notes: isIE
          ? 'Trade show exhibition and export launch collateral qualify under LEO Priming / Enterprise Ireland Market Discovery.'
          : 'Eligible launch marketing working capital under British Business Bank Start Up Loans.',
      },
    ];

    const totalSpend = defaultItems.reduce((sum, i) => sum + i.monthlySpend, 0);
    const cashCac = Math.round(totalSpend / Math.max(1, defaultTargetCustomers));
    const ltv = Math.round(upstreamEconomics.pocketProfitPerCustomer * defaultRetention);
    const ltvCac = cashCac > 0 ? Number((ltv / cashCac).toFixed(1)) : 5.0;
    const payback =
      upstreamEconomics.pocketProfitPerCustomer > 0
        ? Number((cashCac / upstreamEconomics.pocketProfitPerCustomer).toFixed(1))
        : 1.5;

    return {
      goalPreset: 'MOD_H_Y1_BREAKEVEN',
      otherGoalPresetText: '',
      targetMonthlyNewCustomers: defaultTargetCustomers,
      deductWarmPipelineLeads: false,
      leadToCustomerConversionPercent: defaultLeadConv,
      visitorToLeadConversionPercent: defaultVisitorConv,
      paidTrafficSharePercent: defaultPaidShare,
      estimatedCostPerClickOrTouch: defaultCpc,
      founderHourlyShadowRate: 0,
      minutesPerOrganicOutreachOrPiece: 10,
      ltvPurchaseModel: upstreamEconomics.defaultLtvPurchaseModel,
      otherLtvPurchaseModelText: '',
      averageCustomerRetentionMonths: defaultRetention,
      budgetLineItems: defaultItems,
      totalPlannedMonthlyMarketingSpend: totalSpend,
      calculatedCashCac: cashCac,
      calculatedFullyLoadedCac: cashCac,
      calculatedLtv: ltv,
      calculatedLtvToCacRatio: ltvCac,
      calculatedPaybackMonths: payback,
      weeklyFounderMarketingHours: 8,
      paidAdsViabilityDecision: 'ACTIVE' as PaidAdsViabilityDecision,
      excludePaidAdsFromModuleJ: false,
      syncedToModuleJOverheads: false,
      cacAndBudgetNarrative: `To reach our Module H breakeven target of ${defaultTargetCustomers} paying customers per month, our reverse-engineered funnel requires ${reqLeads.toLocaleString()} qualified leads (${defaultLeadConv}% conversion) from ${reqTouches.toLocaleString()} top-of-funnel visitors/outreach touches (${defaultVisitorConv}% visitor-to-lead conversion). Blending ${100 - defaultPaidShare}% founder-led organic outreach with ${defaultPaidShare}% paid acquisition (${currencySymbol}${totalSpend.toLocaleString()}/mo budget) yields a Cash CAC of ${currencySymbol}${cashCac} against an LTV of ${currencySymbol}${ltv.toLocaleString()} (${ltvCac}x LTV:CAC), paying back acquisition cost in ${payback} months.`,
    };
  });

  const [lastActivePaidShare, setLastActivePaidShare] = useState<number>(() => {
    const existing = Number(plan.moduleIData?.step4Budget?.paidTrafficSharePercent);
    if (typeof existing === 'number' && existing > 0) return existing;
    return 35;
  });

  // Helper to keep the Paid Media Ads budget line item automatically synced when funnel sliders/inputs change
  const applySyncedPaidMediaSpend = (
    draft: MarketingBudgetStep4Data
  ): MarketingBudgetStep4Data => {
    const isIE = (plan.hqCountryCode || 'IE') !== 'GB';
    const cat = (plan.industryCategory || '').toLowerCase();
    const isDtc = cat.includes('e-commerce') || cat.includes('food') || cat.includes('brick');

    const warmCount = step3Data.targetPipeline.length;
    const targetCust = Math.max(1, Number(draft.targetMonthlyNewCustomers) || 1);
    const warmCredit =
      draft.deductWarmPipelineLeads && targetCust > 1
        ? Math.min(
            Math.max(1, targetCust - 1),
            Math.max(1, Math.round(warmCount * 0.3))
          )
        : 0;
    const netCold = Math.max(1, targetCust - warmCredit);
    const leadDec = Math.max(
      0.005,
      (Number(draft.leadToCustomerConversionPercent) || 10) / 100
    );
    const visDec = Math.max(
      0.005,
      (Number(draft.visitorToLeadConversionPercent) || 4) / 100
    );
    const reqLeads = Math.ceil(netCold / leadDec);
    const reqTouches = Math.ceil(reqLeads / visDec);
    const paidShare = Math.min(
      100,
      Math.max(0, Number(draft.paidTrafficSharePercent) ?? 35)
    );
    const paidTouches = Math.ceil(reqTouches * (paidShare / 100));
    const cpc = Math.max(0, Number(draft.estimatedCostPerClickOrTouch) || (isDtc ? 1.1 : 2.1));
    const impliedSpend = Math.round(paidTouches * cpc);

    const isExplicitlyOptedOut =
      draft.paidAdsViabilityDecision === 'OPTED_OUT_UNPROFITABLE' ||
      draft.excludePaidAdsFromModuleJ ||
      paidShare === 0;

    const hasPaidRow = draft.budgetLineItems.some(
      (i) => i.bucket === 'PAID_MEDIA_ADS'
    );

    // If opted out or 0% paid, filter out any active PAID_MEDIA_ADS row
    if (isExplicitlyOptedOut) {
      if (hasPaidRow) {
        const remainingItems = draft.budgetLineItems.filter(
          (i) => i.bucket !== 'PAID_MEDIA_ADS'
        );
        return {
          ...draft,
          budgetLineItems:
            remainingItems.length > 0
              ? remainingItems
              : [
                  {
                    id: `mkt_item_${Date.now()}`,
                    bucket: 'GROWTH_STACK_TOOLS' as MarketingBudgetBucketType,
                    channelOrToolName: 'Organic Growth Tools & Email CRM',
                    monthlySpend: 50,
                    grantEligibilityStatus: 'ELIGIBLE_CAPABILITY_OR_EXPORT' as MarketingGrantEligibilityStatus,
                    notes: 'Subscribers & customer email nurturing tools (grant-friendly).',
                  },
                ],
        };
      }
      return draft;
    }

    // Active paid ads mode: if row does not exist, recreate and prepend it
    if (!hasPaidRow) {
      const newPaidItem: MarketingBudgetLineItem = {
        id: `mkt_paid_${Date.now()}`,
        bucket: 'PAID_MEDIA_ADS',
        channelOrToolName: isDtc
          ? 'High-Intent Search & Meta Retargeting Ads'
          : 'Targeted Search Intent & Performance PPC Campaigns',
        monthlySpend: Math.max(100, impliedSpend),
        grantEligibilityStatus: 'INELIGIBLE_ONGOING_AD_SPEND',
        notes: `Drives ~${paidTouches.toLocaleString()} paid monthly clicks/touches at ${currencySymbol}${cpc.toFixed(2)} CPC. Funded from trading cashflow (ongoing ad clicks are ineligible for IE LEO / EI grants).`,
      };
      return {
        ...draft,
        budgetLineItems: [newPaidItem, ...draft.budgetLineItems],
      };
    }

    // Active paid ads mode: update existing row
    let updatedFirst = false;
    return {
      ...draft,
      budgetLineItems: draft.budgetLineItems.map((item) => {
        if (!updatedFirst && item.bucket === 'PAID_MEDIA_ADS') {
          updatedFirst = true;
          return {
            ...item,
            monthlySpend: Math.max(0, impliedSpend),
            notes: `Drives ~${paidTouches.toLocaleString()} paid monthly clicks/touches at ${currencySymbol}${cpc.toFixed(2)} CPC. Funded from trading cashflow (ongoing ad clicks are ineligible for IE LEO / EI grants).`,
          };
        }
        return item;
      }),
    };
  };

  // Live Memoized Funnel & Unit Economics Calculations for Step 4
  const step4LiveMetrics = useMemo(() => {
    const warmPipelineCount = step3Data.targetPipeline.length;
    const totalCustomers = Math.max(
      1,
      Number(step4Data.targetMonthlyNewCustomers) || 1
    );
    const warmCustomerCredit =
      step4Data.deductWarmPipelineLeads && totalCustomers > 1
        ? Math.min(
            Math.max(1, totalCustomers - 1),
            Math.max(1, Math.round(warmPipelineCount * 0.3))
          )
        : 0;

    const netColdCustomersNeeded = Math.max(
      1,
      totalCustomers - warmCustomerCredit
    );

    const leadConvDec = Math.max(
      0.005,
      (Number(step4Data.leadToCustomerConversionPercent) || 0.5) / 100
    );
    const visitorConvDec = Math.max(
      0.005,
      (Number(step4Data.visitorToLeadConversionPercent) || 0.5) / 100
    );

    const requiredQualifiedLeads = Math.ceil(netColdCustomersNeeded / leadConvDec);
    const requiredTopOfFunnelTouches = Math.ceil(
      requiredQualifiedLeads / visitorConvDec
    );

    const paidShare = Math.min(
      100,
      Math.max(0, Number(step4Data.paidTrafficSharePercent) ?? 0)
    );
    const paidTouches = Math.ceil(
      requiredTopOfFunnelTouches * (paidShare / 100)
    );
    const organicTouches = Math.max(0, requiredTopOfFunnelTouches - paidTouches);

    const paidLeads = Math.ceil(requiredQualifiedLeads * (paidShare / 100));
    const organicLeads = Math.max(0, requiredQualifiedLeads - paidLeads);

    const cpc = Math.max(0, Number(step4Data.estimatedCostPerClickOrTouch) || 0);
    const impliedPaidMediaSpend = Math.round(paidTouches * cpc);

    const lineItemsTotalSpend = step4Data.budgetLineItems.reduce(
      (sum, item) => sum + (Number(item.monthlySpend) || 0),
      0
    );

    const paidMediaBucketSpend = step4Data.budgetLineItems
      .filter((i) => i.bucket === 'PAID_MEDIA_ADS')
      .reduce((sum, i) => sum + (Number(i.monthlySpend) || 0), 0);

    const toolsBucketSpend = step4Data.budgetLineItems
      .filter((i) => i.bucket === 'GROWTH_STACK_TOOLS')
      .reduce((sum, i) => sum + (Number(i.monthlySpend) || 0), 0);

    const contentEventsBucketSpend = step4Data.budgetLineItems
      .filter((i) => i.bucket === 'CONTENT_EVENTS_PR' || i.bucket === 'OTHER')
      .reduce((sum, i) => sum + (Number(i.monthlySpend) || 0), 0);

    const ineligibleAdSpendTotal = step4Data.budgetLineItems
      .filter((i) => i.grantEligibilityStatus === 'INELIGIBLE_ONGOING_AD_SPEND')
      .reduce((sum, i) => sum + (Number(i.monthlySpend) || 0), 0);

    const grantEligibleSpendTotal = Math.max(
      0,
      lineItemsTotalSpend - ineligibleAdSpendTotal
    );

    const minsPerTouch = Math.max(
      0,
      Number(step4Data.minutesPerOrganicOutreachOrPiece) || 0
    );

    const monthlyFounderHours =
      Math.round(((organicTouches * minsPerTouch) / 60) * 10) / 10;
    const weeklyFounderHours =
      Math.round((monthlyFounderHours / 4.33) * 10) / 10;
    const monthlySweatEquityShadowCost = 0;

    const cashCostPerLead = Math.round(
      lineItemsTotalSpend / Math.max(1, requiredQualifiedLeads)
    );
    const fullyLoadedCostPerLead = cashCostPerLead;

    const cashCac = Math.round(lineItemsTotalSpend / totalCustomers);
    const fullyLoadedCac = cashCac;

    const activeLtvModel: LtvPurchaseModelType =
      step4Data.ltvPurchaseModel ||
      upstreamEconomics.defaultLtvPurchaseModel ||
      'RECURRING_SUBSCRIPTION';

    const effectiveLtvMultiplier =
      activeLtvModel === 'SINGLE_ONE_TIME_PURCHASE'
        ? 1
        : Math.max(1, Number(step4Data.averageCustomerRetentionMonths) || 1);

    const pocketProfit = Math.max(5, upstreamEconomics.pocketProfitPerCustomer);
    const ltv = Math.round(pocketProfit * effectiveLtvMultiplier);
    const firstOrderNetProfitAfterCac = Math.round(pocketProfit - cashCac);

    const monthlyCohortPocketProfit = Math.round(totalCustomers * pocketProfit);
    const monthlyCohortLtv = Math.round(totalCustomers * ltv);
    const firstMonthNetAfterMarketing = Math.round(
      monthlyCohortPocketProfit - lineItemsTotalSpend
    );

    const effectiveCacForRatio = Math.max(1, cashCac);
    const ltvToCacRatio = Number((ltv / effectiveCacForRatio).toFixed(1));
    const paybackMonths = Number((cashCac / pocketProfit).toFixed(1));

    const ltvMultiplierUnitLabel =
      activeLtvModel === 'SINGLE_ONE_TIME_PURCHASE'
        ? 'single purchase (1x)'
        : activeLtvModel === 'REPEAT_PURCHASE_ORDERS'
        ? 'lifetime orders'
        : activeLtvModel === 'OTHER'
        ? 'custom multiplier'
        : 'mo lifespan';

    // Leverage sensitivity insight: What if landing page visitor-to-lead conversion improved by +1.5%?
    const improvedVisitorConvDec =
      ((Number(step4Data.visitorToLeadConversionPercent) || 0.5) + 1.5) / 100;
    const touchesWithBetterConversion = Math.ceil(
      requiredQualifiedLeads / improvedVisitorConvDec
    );
    const paidTouchesSaved = Math.max(
      0,
      paidTouches -
        Math.ceil(touchesWithBetterConversion * (paidShare / 100))
    );
    const monthlyAdSavingsFromCro = Math.round(paidTouchesSaved * cpc);

    // Negative unit economics / underwater paid acquisition checks
    const hasPaidSpend = paidShare > 0 || lineItemsTotalSpend > 0;
    const isUnderwaterSinglePurchase =
      activeLtvModel === 'SINGLE_ONE_TIME_PURCHASE' &&
      firstOrderNetProfitAfterCac < 0 &&
      hasPaidSpend;
    const isUnderwaterRecurring =
      activeLtvModel !== 'SINGLE_ONE_TIME_PURCHASE' &&
      (ltvToCacRatio < 1.5 || firstMonthNetAfterMarketing < 0) &&
      hasPaidSpend;
    const isUnitEconomicsUnderwater =
      isUnderwaterSinglePurchase || isUnderwaterRecurring;

    // Grant-compliant spend eligible for Module J when excluding paid ads
    const nonPaidSpendTotal = Math.max(0, lineItemsTotalSpend - paidMediaBucketSpend);
    const effectiveModuleJMonthlySpend = step4Data.excludePaidAdsFromModuleJ
      ? nonPaidSpendTotal
      : lineItemsTotalSpend;

    return {
      warmPipelineCount,
      warmCustomerCredit,
      netColdCustomersNeeded,
      requiredQualifiedLeads,
      requiredTopOfFunnelTouches,
      paidTouches,
      organicTouches,
      paidLeads,
      organicLeads,
      impliedPaidMediaSpend,
      lineItemsTotalSpend,
      paidMediaBucketSpend,
      toolsBucketSpend,
      contentEventsBucketSpend,
      ineligibleAdSpendTotal,
      grantEligibleSpendTotal,
      nonPaidSpendTotal,
      effectiveModuleJMonthlySpend,
      isUnderwaterSinglePurchase,
      isUnderwaterRecurring,
      isUnitEconomicsUnderwater,
      monthlyFounderHours,
      weeklyFounderHours,
      monthlySweatEquityShadowCost,
      cashCostPerLead,
      fullyLoadedCostPerLead,
      cashCac,
      fullyLoadedCac,
      activeLtvModel,
      effectiveLtvMultiplier,
      ltvMultiplierUnitLabel,
      firstOrderNetProfitAfterCac,
      monthlyCohortPocketProfit,
      monthlyCohortLtv,
      firstMonthNetAfterMarketing,
      pocketProfit,
      ltv,
      ltvToCacRatio,
      paybackMonths,
      monthlyAdSavingsFromCro,
    };
  }, [
    step4Data,
    step3Data.targetPipeline.length,
    upstreamEconomics.pocketProfitPerCustomer,
    upstreamEconomics.defaultLtvPurchaseModel,
    currencySymbol,
  ]);

  const isStep4Complete = Boolean(
    step4Data.targetMonthlyNewCustomers >= 1 &&
      (step4Data.goalPreset !== 'OTHER' ||
        (step4Data.otherGoalPresetText?.trim() ?? '').length > 0) &&
      (step4Data.ltvPurchaseModel !== 'OTHER' ||
        (step4Data.otherLtvPurchaseModelText?.trim() ?? '').length > 0) &&
      step4Data.budgetLineItems.length >= 1 &&
      step4Data.cacAndBudgetNarrative.trim().length > 15
  );

  const completedCoreStepsCount =
    (isStep1Complete ? 1 : 0) +
    (isStep2Complete ? 1 : 0) +
    (isStep3Complete ? 1 : 0) +
    (isStep4Complete ? 1 : 0);

  // Step 4 Save & AI State
  const [saveStatusStep4, setSaveStatusStep4] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isGeneratingAiStep4, setIsGeneratingAiStep4] = useState(false);
  const [aiSuccessMessageStep4, setAiSuccessMessageStep4] = useState<string | null>(null);
  const [aiAssessorTipStep4, setAiAssessorTipStep4] = useState<string | null>(null);
  const [parkingQuestionTextStep4, setParkingQuestionTextStep4] = useState('');
  const [isParkingQuestionStep4, setIsParkingQuestionStep4] = useState(false);
  const [parkingSuccessStep4, setParkingSuccessStep4] = useState(false);

  // Step 3 Save & AI State
  const [saveStatusStep3, setSaveStatusStep3] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isGeneratingAiStep3, setIsGeneratingAiStep3] = useState(false);
  const [aiSuccessMessageStep3, setAiSuccessMessageStep3] = useState<string | null>(null);
  const [aiAssessorTipStep3, setAiAssessorTipStep3] = useState<string | null>(null);
  const [isGeneratingObjections, setIsGeneratingObjections] = useState(false);
  const [generatingSingleRebuttalIndex, setGeneratingSingleRebuttalIndex] = useState<number | null>(null);
  const [objectionSuccessMessage, setObjectionSuccessMessage] = useState<string | null>(null);

  // Step 3 Parking Lot
  const [parkingQuestionTextStep3, setParkingQuestionTextStep3] = useState('');
  const [isParkingQuestionStep3, setIsParkingQuestionStep3] = useState(false);
  const [parkingSuccessStep3, setParkingSuccessStep3] = useState(false);

  // Step 3 Interactive Tabs & Copy States
  const [activeOutreachTab, setActiveOutreachTab] = useState<'APPROACH_A' | 'APPROACH_B' | 'APPROACH_C'>('APPROACH_A');
  const [copiedScriptKey, setCopiedScriptKey] = useState<string | null>(null);
  const [copiedLoi, setCopiedLoi] = useState(false);
  const [isHarvestingLeads, setIsHarvestingLeads] = useState(false);
  const [harvestSuccessMessage, setHarvestSuccessMessage] = useState<string | null>(null);

  // Step 2 Save & AI State
  const [saveStatusStep2, setSaveStatusStep2] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isGeneratingAiStep2, setIsGeneratingAiStep2] = useState(false);
  const [aiSuccessMessageStep2, setAiSuccessMessageStep2] = useState<string | null>(null);
  const [aiAssessorTipStep2, setAiAssessorTipStep2] = useState<string | null>(null);

  // Step 2 Parking Lot
  const [parkingQuestionTextStep2, setParkingQuestionTextStep2] = useState('');
  const [isParkingQuestionStep2, setIsParkingQuestionStep2] = useState(false);
  const [parkingSuccessStep2, setParkingSuccessStep2] = useState(false);

  // Tone of Voice Options
  const TONE_OPTIONS: Array<{
    id: BrandToneOfVoice;
    title: string;
    description: string;
    bestFor: string;
    exampleQuote: string;
  }> = [
    {
      id: 'AUTHORITATIVE_TRUSTED',
      title: 'Authoritative & Trusted',
      description: 'Credible, data-backed, institutional, and reassuringly rigorous.',
      bestFor: 'FinTech, MedTech, RegTech, LegalTech, Enterprise B2B',
      exampleQuote: '"Engineered to institutional standards with verified regulatory compliance."',
    },
    {
      id: 'APPROACHABLE_FRIENDLY',
      title: 'Approachable & Human',
      description: 'Warm, encouraging, simple, empathetic, and jargon-free.',
      bestFor: 'Consumer Apps, EdTech, Mental Health, Creator Economy, Communities',
      exampleQuote: '"We’re in your corner every step of the way with clear, friendly guidance."',
    },
    {
      id: 'PLAYFUL_BOLD',
      title: 'Playful, Bold & Irreverent',
      description: 'Punchy, conversational, daring, witty, and unconventional.',
      bestFor: 'D2C Consumer Brands, Beverage/Food, Gen-Z Apps, Gaming',
      exampleQuote: '"Ditch the boring spreadsheets. Building a startup shouldn’t hurt this much."',
    },
    {
      id: 'TECHNICAL_TRANSPARENT',
      title: 'Technical & Transparent',
      description: 'Pragmatic, engineering-led, no fluff, transparent, and direct.',
      bestFor: 'DevTools, APIs, AI Infrastructure, CyberSecurity, Hardware',
      exampleQuote: '"Open architecture, sub-second latency, zero hidden lock-in."',
    },
    {
      id: 'PREMIUM_CURATED',
      title: 'Premium & Curated',
      description: 'Sophisticated, understated, bespoke, elegant, and exclusive.',
      bestFor: 'Luxury D2C, High-Ticket Services, Boutique Consulting, Artisanal',
      exampleQuote: '"Crafted with uncompromising precision for discerning leaders."',
    },
    {
      id: 'OTHER',
      title: 'Other / Custom Voice',
      description: 'Define your startup’s unique persona and tone of voice.',
      bestFor: 'Hybrid or non-standard brand identities',
      exampleQuote: '"Write your own tailored tone guideline below."',
    },
  ];

  // Save Step 1
  const handleSaveStep1 = async (options?: { silent?: boolean } | unknown) => {
    if (isVaultReadonly) return;
    setSaveStatus('saving');
    try {
      if (onSaveStep1Positioning) {
        await onSaveStep1Positioning(step1Data, isStep1Complete ? 25 : 15);
      }

      const res = await saveModuleIStep1PositioningAction({
        planId: plan.id,
        positioning: step1Data,
        completionPercentage: isStep1Complete ? 25 : 15,
      });

      if (res.ok || onSaveStep1Positioning) {
        isDirtyStep1Ref.current = false;
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      console.error('Error saving Module I Step 1:', err);
      if (onSaveStep1Positioning) {
        isDirtyStep1Ref.current = false;
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
      } else {
        setSaveStatus('error');
      }
    }
  };

  // AI Generator
  const handleGenerateAiPositioning = async () => {
    setIsGeneratingAi(true);
    setAiSuccessMessage(null);
    try {
      const result = await generateModuleIPositioningAction({
        planId: plan.id,
        planTitle: plan.title,
        industryCategory: plan.industryCategory,
        hqCountryCode: plan.hqCountryCode as any,
        oneLinerSummary: plan.oneLinerSummary,
        problemStatement: customerProblem,
        solutionStatement: solutionConcept,
        uvpStatement: primaryUvp,
        targetCustomer: beachheadPersona,
        beachheadPersona: beachheadPersona,
        competitiveWedge: competitiveWedge,
        preferredTone: step1Data.toneOfVoice,
      });

      if (result.allowed) {
        setStep1Data((prev) => ({
          ...prev,
          elevatorHook140: result.elevatorHook140,
          positioningFormula: {
            targetCustomer: result.positioningFormula.targetCustomer,
            customerProblem: result.positioningFormula.customerProblem,
            solutionCategory: result.positioningFormula.solutionCategory,
            primaryBenefit: result.positioningFormula.primaryBenefit,
            competitiveWedge: result.positioningFormula.competitiveWedge,
          },
          toneOfVoice: result.suggestedToneOfVoice,
          toneOfVoiceBoundary: {
            weAre: result.toneOfVoiceBoundary.weAre,
            weAreNever: result.toneOfVoiceBoundary.weAreNever,
          },
          corePillars: result.corePillars,
          aiEngineUsed: result.engineMode === 'gemini-2.5-flash' ? 'gemini-2.5-flash' : 'smart-synthesizer',
        }));

        if (result.assessorTip) {
          setAiAssessorTip(result.assessorTip);
        }

        setAiSuccessMessage(
          result.engineMode === 'gemini-2.5-flash'
            ? '✨ Refined via Gemini 2.5 Flash from your Module A & B context!'
            : '⚡ Smart Synthesizer applied tailored positioning guidelines.'
        );
        setTimeout(() => setAiSuccessMessage(null), 4000);
      }
    } catch (err) {
      console.error('Error generating positioning:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Park question
  const handleParkQuestion = async () => {
    if (!parkingQuestionText.trim()) return;
    setIsParkingQuestion(true);
    try {
      await parkModuleIOpenQuestionAction({
        planId: plan.id,
        questionText: parkingQuestionText.trim(),
      });
      setParkingSuccess(true);
      setParkingQuestionText('');
      setTimeout(() => setParkingSuccess(false), 3000);
    } catch (err) {
      console.error('Error parking open question:', err);
    } finally {
      setIsParkingQuestion(false);
    }
  };

  // Step 2 Options
  const PACKAGING_OPTIONS: Array<{
    id: ProductPackagingType;
    label: string;
    description: string;
    badge: string;
  }> = [
    {
      id: 'DIGITAL_SAAS_CLOUD',
      label: 'Digital SaaS & Cloud Platform',
      description: 'Web app, mobile app, API, or cloud software with self-serve signup.',
      badge: 'Zero Marginal Cost',
    },
    {
      id: 'PHYSICAL_D2C_PRODUCT',
      label: 'Physical D2C / Packaged Product',
      description: 'Manufactured physical goods, food/drink, hardware or boxed retail.',
      badge: 'Inventory & Shipping',
    },
    {
      id: 'HIGH_TOUCH_SERVICE',
      label: 'High-Touch Service & Consulting',
      description: 'Done-for-you advisory, agency deliverables, or bespoke sprints.',
      badge: 'High Ticket / Margins',
    },
    {
      id: 'MARKETPLACE_PLATFORM',
      label: 'Two-Sided Marketplace',
      description: 'Facilitating transactions between buyers and third-party vendors/suppliers.',
      badge: 'Network Effects',
    },
    {
      id: 'HYBRID_HARDWARE_SOFTWARE',
      label: 'Hybrid Hardware + Subscription',
      description: 'Physical equipment or IoT sensors bundled with recurring software.',
      badge: 'High Moat',
    },
    {
      id: 'OTHER',
      label: 'Other Packaging Format',
      description: 'Define your startup’s custom product structure or hybrid delivery vehicle.',
      badge: 'Custom',
    },
  ];

  const PRICING_STANCE_OPTIONS: Array<{
    id: PricingStanceType;
    label: string;
    description: string;
    grantProofInsight: string;
  }> = [
    {
      id: 'VALUE_BASED_PREMIUM',
      label: 'Value-Based Premium',
      description: 'Price anchored to the monetary ROI / value unlocked rather than cost-plus.',
      grantProofInsight: 'Demonstrates strong pricing power and gross margin defense.',
    },
    {
      id: 'TIERED_FLAT_SUBSCRIPTION',
      label: 'Tiered Flat Subscription',
      description: 'Predictable monthly or annual recurring tiers (e.g. Starter, Pro, Enterprise).',
      grantProofInsight: 'Provides predictable ARR and cash flow visibility for grant assessors.',
    },
    {
      id: 'USAGE_BASED_METERED',
      label: 'Usage-Based / Metered',
      description: 'Pay-as-you-go based on consumption (e.g. per API call, transaction, or seat).',
      grantProofInsight: 'Lowers day-1 barrier to entry while capturing enterprise upside.',
    },
    {
      id: 'FREEMIUM_EXPAND',
      label: 'Freemium (Land & Expand)',
      description: 'Free tier drives viral bottom-up adoption; premium features convert to paid.',
      grantProofInsight: 'Requires high volume to monetize; highlight conversion mechanics.',
    },
    {
      id: 'COMPETITIVE_PARITY',
      label: 'Competitive Parity',
      description: 'Priced closely to incumbent market norms to eliminate price as an objection.',
      grantProofInsight: 'Clear market benchmark; differentiation must come from superior product.',
    },
    {
      id: 'PENETRATION_LOSS_LEADER',
      label: 'Introductory Market Penetration',
      description: 'Discounted initial entry pricing to rapidly displace entrenched incumbents.',
      grantProofInsight: 'Ensure path to profitability is demonstrated in financial projections.',
    },
    {
      id: 'OTHER',
      label: 'Other Pricing Stance',
      description: 'Bespoke pricing strategy (e.g. revenue share, performance bonus, licensing).',
      grantProofInsight: 'Specify terms clearly for investors and assessors.',
    },
  ];

  const DISTRIBUTION_CHANNEL_OPTIONS: Array<{
    id: PrimaryDistributionChannel;
    label: string;
    description: string;
    salesCycle: string;
  }> = [
    {
      id: 'DIRECT_WEB_SELF_SERVE',
      label: 'Direct Web (Self-Serve)',
      description: 'Visitors convert directly on your website/app without speaking to sales.',
      salesCycle: '< 1 Day',
    },
    {
      id: 'OUTBOUND_DIRECT_SALES',
      label: 'Direct Outbound Sales (B2B)',
      description: 'Founder or sales rep conducts discovery calls, product demos, and sends proposals.',
      salesCycle: '2 to 8 Weeks',
    },
    {
      id: 'MARKETPLACE_APPSTORE',
      label: 'Curated Ecosystem / App Store',
      description: 'Listing inside Shopify App Store, Chrome Web Store, Salesforce AppExchange, etc.',
      salesCycle: 'Instant / In-App',
    },
    {
      id: 'PARTNER_RESELLER_NETWORK',
      label: 'Partner & Reseller Network',
      description: 'Accountants, consultants, or system integrators recommend or bundle your product.',
      salesCycle: 'Indirect / Co-sell',
    },
    {
      id: 'EVENTS_RETAIL_COMMUNITY',
      label: 'Events, Pop-Ups & Retail Shelves',
      description: 'Face-to-face interaction at trade expos, physical stockists, or community meetups.',
      salesCycle: 'Event-driven',
    },
    {
      id: 'OTHER',
      label: 'Other Distribution Channel',
      description: 'White-label licensing, government procurement, or specialized wholesale routes.',
      salesCycle: 'Custom',
    },
  ];

  const ACQUISITION_ENGINE_OPTIONS: Array<{
    id: PrimaryAcquisitionEngine;
    label: string;
    description: string;
    bestFit: string;
  }> = [
    {
      id: 'FOUNDER_LED_ORGANIC',
      label: 'Founder-Led Organic & Social Proof',
      description: 'Founders build in public on LinkedIn/X, sharing real customer stories, insights, and breakdowns.',
      bestFit: 'Zero-budget Day 1 launch, B2B SaaS, and early innovator communities.',
    },
    {
      id: 'OUTBOUND_ACCOUNT_BASED',
      label: 'Outbound Direct Outreach (ABM)',
      description: 'Hyper-personalized direct outreach (email, phone, LinkedIn) to a targeted list of 50-100 dream accounts.',
      bestFit: 'High ACV (>€1,000/yr), B2B mid-market, enterprise pilot projects.',
    },
    {
      id: 'SEARCH_INTENT_SEO',
      label: 'High-Intent Search & SEO',
      description: 'Capturing buyers already searching for solutions via problem keywords, alternatives, and tooling.',
      bestFit: 'High search volume categories, tool directories, comparison queries.',
    },
    {
      id: 'COMMUNITY_PARTNERSHIP',
      label: 'Community & Ecosystem Co-Marketing',
      description: 'Partnering with existing communities, guest newsletters, podcasts, and non-competing tools.',
      bestFit: 'Leveraging established trust without spending on ads.',
    },
    {
      id: 'PAID_PERFORMANCE_ADS',
      label: 'Paid Performance Acquisition',
      description: 'Meta Ads, Google Search Ads, LinkedIn Sponsored Content driving directly to conversion funnels.',
      bestFit: 'Validated unit economics, clear LTV:CAC > 3:1, consumer & transactional B2B.',
    },
    {
      id: 'OTHER',
      label: 'Other Acquisition Engine',
      description: 'Referral loops, guerrilla marketing, viral waitlists, or academic spinout channels.',
      bestFit: 'Unconventional or proprietary go-to-market motions.',
    },
  ];

  // Save Step 2
  const handleSaveStep2 = async (options?: { silent?: boolean } | unknown) => {
    if (isVaultReadonly) return;
    setSaveStatusStep2('saving');
    try {
      if (onSaveStep2FourPs) {
        await onSaveStep2FourPs(step2Data, isStep2Complete ? 45 : 30);
      }

      const res = await saveModuleIStep2FourPsAction({
        planId: plan.id,
        fourPs: step2Data,
        completionPercentage: isStep2Complete ? 45 : 30,
      });

      if (res.ok || onSaveStep2FourPs) {
        isDirtyStep2Ref.current = false;
        setSaveStatusStep2('saved');
        setTimeout(() => setSaveStatusStep2('idle'), 2500);
      } else {
        setSaveStatusStep2('error');
      }
    } catch (err) {
      console.error('Error saving Module I Step 2:', err);
      if (onSaveStep2FourPs) {
        isDirtyStep2Ref.current = false;
        setSaveStatusStep2('saved');
        setTimeout(() => setSaveStatusStep2('idle'), 2500);
      } else {
        setSaveStatusStep2('error');
      }
    }
  };

  // AI Generator for Step 2
  const handleGenerateAiFourPs = async () => {
    setIsGeneratingAiStep2(true);
    setAiSuccessMessageStep2(null);
    try {
      const result = await generateModuleIFourPsAction({
        planId: plan.id,
        planTitle: plan.title,
        industryCategory: plan.industryCategory,
        hqCountryCode: (plan.hqCountryCode as any) || 'IE',
        baseCurrency: plan.baseCurrency || 'EUR',
        elevatorHook140: step1Data.elevatorHook140,
        targetCustomer: beachheadPersona,
        customerProblem: customerProblem,
        solutionCategory: solutionConcept,
        primaryBenefit: primaryUvp,
        competitiveWedge: competitiveWedge,
        pricingVehicleFromModH: plan.moduleHData?.step2PricingTiers?.pricingStrategyNotes,
        blendedAveragePriceFromModH:
          plan.moduleHData?.step2PricingTiers?.blendedAveragePriceNet ||
          plan.moduleHData?.step2PricingTiers?.tiers?.[0]?.priceNetOfTax,
        productVehicleFromModD: plan.moduleDData?.productVehicle?.productTrack,
        headlinePricePointInput:
          step2Data.priceP2.headlinePricePoint || resolvedUpstreamPrice.priceHeadline,
      });

      if (result.allowed) {
        setStep2Data((prev) => ({
          ...prev,
          productP1: {
            ...result.productP1,
            otherPackagingTypeText: prev.productP1.otherPackagingTypeText,
          },
          priceP2: {
            ...result.priceP2,
            otherPricingStanceText: prev.priceP2.otherPricingStanceText,
          },
          placeP3: {
            ...result.placeP3,
            otherPrimaryChannelText: prev.placeP3.otherPrimaryChannelText,
          },
          promotionP4: {
            ...result.promotionP4,
            otherAcquisitionEngineText: prev.promotionP4.otherAcquisitionEngineText,
          },
          strategicRationale: result.strategicRationale,
          aiEngineUsed:
            result.engineMode === 'gemini-2.5-flash' ? 'gemini-2.5-flash' : 'smart-synthesizer',
        }));

        setAiSuccessMessageStep2(
          result.engineMode === 'gemini-2.5-flash'
            ? '✨ 4Ps strategy & acquisition tactics generated with Gemini 2.5 Flash!'
            : '⚡ Smart Synthesizer generated your 4Ps commercial architecture.'
        );
        setTimeout(() => setAiSuccessMessageStep2(null), 4000);
      }
    } catch (err) {
      console.error('Error generating 4Ps strategy:', err);
    } finally {
      setIsGeneratingAiStep2(false);
    }
  };

  // Park question for Step 2
  const handleParkStep2Question = async () => {
    if (!parkingQuestionTextStep2.trim() || isParkingQuestionStep2) return;
    setIsParkingQuestionStep2(true);
    try {
      await parkModuleIOpenQuestionAction({
        planId: plan.id,
        questionText: `[4Ps Strategy] ${parkingQuestionTextStep2.trim()}`,
      });
      setParkingSuccessStep2(true);
      setParkingQuestionTextStep2('');
      setTimeout(() => setParkingSuccessStep2(false), 3000);
    } catch (err) {
      console.error('Error parking Step 2 question:', err);
    } finally {
      setIsParkingQuestionStep2(false);
    }
  };

  // Step 3 Archetype Options
  const ARCHETYPE_OPTIONS: Array<{
    id: First10AcquisitionArchetype;
    label: string;
    description: string;
    badge: string;
    bestFit: string;
    grantAssessorProof: string;
  }> = [
    {
      id: 'WARM_NETWORK_ROLODEX',
      label: 'Warm Network & Former Colleagues',
      description: 'Leverage past colleagues, clients, vendors, and industry peers who already know and trust you.',
      badge: 'Lowest Resistance',
      bestFit: 'B2B software, agency-to-SaaS, and specialized professional services.',
      grantAssessorProof: 'Fastest proof of concept; demonstrates credibility and existing industry reputation.',
    },
    {
      id: 'ACCOUNT_BASED_SNIPER',
      label: 'Account-Based Sniper Outbound',
      description: 'Handpick 30-50 ideal accounts and reach out with tailored 1-to-1 teardowns, audits, or pre-built prototypes.',
      badge: 'High Precision',
      bestFit: 'Mid-market/Enterprise B2B, vertical solutions, high ACV (>€2,000/yr).',
      grantAssessorProof: 'Demonstrates active commercial outbound competence rather than passive waiting.',
    },
    {
      id: 'COMMUNITY_ADVISORY_COUNCIL',
      label: 'Niche Community & Advisory Co-Design',
      description: 'Engage niche Slack/Discord groups or industry bodies by recruiting a 10-person advisory council.',
      badge: 'High Retention',
      bestFit: 'Developer tools, creator economy, specialized niche professions, regulated industries.',
      grantAssessorProof: 'Validates strong founder-market alignment and community advocacy defensibility.',
    },
    {
      id: 'MANUAL_CONCIERGE_PILOT',
      label: 'Manual Concierge ("Do Things That Don\'t Scale")',
      description: 'Deliver the solution manually behind the scenes first before writing automated software code.',
      badge: 'Zero Code Risk',
      bestFit: 'Two-sided marketplaces, complex workflow automation, AI agents, service platforms.',
      grantAssessorProof: 'Proves willingness-to-pay and operational unit economics before major R&D spend.',
    },
    {
      id: 'EXCLUSIVE_FOUNDING_COHORT',
      label: 'Exclusive 10-Seat Founding Member Cohort',
      description: 'Package initial access as an exclusive, time-limited founding cohort with lifetime perks and founder access.',
      badge: 'High Urgency',
      bestFit: 'Prosumer software, executive masterminds, boutique SaaS, high-touch clubs.',
      grantAssessorProof: 'Creates scarcity and commercial urgency without aggressive or brand-diluting discounting.',
    },
    {
      id: 'OTHER',
      label: 'Other Customer Acquisition Archetype',
      description: 'Define your startup\'s unique early activation motion or proprietary distribution wedge.',
      badge: 'Custom',
      bestFit: 'Hybrid or non-standard distribution pathways.',
      grantAssessorProof: 'Custom strategy tailored to unique market dynamics.',
    },
  ];

  const PIPELINE_STATUS_CONFIG: Record<
    PipelineProspectStatus,
    { label: string; bg: string; text: string; border: string }
  > = {
    TO_CONTACT: {
      label: 'To Contact',
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-300',
    },
    CONTACTED: {
      label: 'Outreach Sent',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
    },
    MEETING_SET: {
      label: 'Meeting Set',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
    },
    PILOT_AGREED: {
      label: 'Pilot Agreed (LOI)',
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-200',
    },
    CONVERTED_PAID: {
      label: 'Converted Paid',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
    },
    DISQUALIFIED: {
      label: 'Disqualified / Unresponsive',
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
    },
  };

  // Module C Lead Harvesting Bridge Stats
  const moduleCStats = useMemo(() => {
    const surveys = plan.moduleCData?.surveys || [];
    const waitlistResponses = surveys
      .flatMap((s) => s.responses || [])
      .filter((r) => r.joinedWaitlist || (r.respondentEmail && r.respondentEmail.trim().length > 0));
    const interviews = [
      ...(plan.moduleCData?.interviewLogs || []),
      ...surveys.flatMap((s) => s.interviewLogs || []),
    ];
    const highIntentInterviews = interviews.filter(
      (i) =>
        i.commitmentOutcome === 'ASKED_TO_PILOT_OR_BUY' ||
        i.commitmentOutcome === 'INTRODUCED_PEERS' ||
        i.commitmentOutcome === 'SHARED_DEEP_WORKFLOW_PAIN' ||
        i.painScore1To5 >= 4
    );

    return {
      totalSurveys: surveys.length,
      totalWaitlistLeads: waitlistResponses.length,
      waitlistResponses,
      totalInterviews: interviews.length,
      highIntentInterviews,
      hasHarvestableLeads: waitlistResponses.length > 0 || interviews.length > 0,
    };
  }, [plan.moduleCData]);

  // Save Step 3
  const handleSaveStep3 = async (options?: { silent?: boolean } | unknown) => {
    if (isVaultReadonly) return;
    setSaveStatusStep3('saving');
    try {
      if (onSaveStep3First10) {
        await onSaveStep3First10(step3Data, isStep3Complete ? 65 : 50);
      }

      const res = await saveModuleIStep3First10Action({
        planId: plan.id,
        first10: step3Data,
        completionPercentage: isStep3Complete ? 65 : 50,
      });

      if (res.ok || onSaveStep3First10) {
        isDirtyStep3Ref.current = false;
        setSaveStatusStep3('saved');
        setTimeout(() => setSaveStatusStep3('idle'), 2500);
      } else {
        setSaveStatusStep3('error');
      }
    } catch (err) {
      console.error('Error saving Module I Step 3:', err);
      if (onSaveStep3First10) {
        isDirtyStep3Ref.current = false;
        setSaveStatusStep3('saved');
        setTimeout(() => setSaveStatusStep3('idle'), 2500);
      } else {
        setSaveStatusStep3('error');
      }
    }
  };

  // AI Generator for Step 3
  const handleGenerateAiFirst10 = async () => {
    setIsGeneratingAiStep3(true);
    setAiSuccessMessageStep3(null);
    setAiAssessorTipStep3(null);
    try {
      const result = await generateModuleIFirst10Action({
        planId: plan.id,
        planTitle: plan.title,
        industryCategory: plan.industryCategory,
        hqCountryCode: (plan.hqCountryCode as any) || 'IE',
        baseCurrency: plan.baseCurrency || 'EUR',
        targetCustomer: beachheadPersona,
        customerProblem: customerProblem,
        headlinePricePoint:
          step3Data.letterOfIntent.pilotPricePoint ||
          step2Data.priceP2.headlinePricePoint ||
          resolvedUpstreamPrice.priceHeadline,
        preferredArchetype: step3Data.acquisitionArchetype,
        packagingType: step2Data.productP1.packagingType,
        primaryBenefit: primaryUvp,
      });

      if (result.allowed) {
        setStep3Data((prev) => ({
          ...prev,
          acquisitionArchetype: result.acquisitionArchetype || prev.acquisitionArchetype,
          pilotOffer: result.pilotOffer || prev.pilotOffer,
          targetPipeline:
            result.targetPipeline && result.targetPipeline.length > 0
              ? result.targetPipeline
              : prev.targetPipeline,
          outreachScripts: result.outreachScripts || prev.outreachScripts,
          followUpCadence: result.followUpCadence || prev.followUpCadence,
          objectionBusters: result.objectionBusters || prev.objectionBusters,
          letterOfIntent: result.letterOfIntent || prev.letterOfIntent,
          aiEngineUsed: result.engineMode,
        }));

        setAiSuccessMessageStep3(
          result.engineMode === 'gemini-2.5-flash'
            ? '✨ First 10 Playbook, Outreach Scripts & LOI generated with Gemini 2.5 Flash!'
            : '⚡ Smart Synthesizer generated your First 10 Playbook & Outreach sequences.'
        );
        if (result.grantAssessorTip) {
          setAiAssessorTipStep3(result.grantAssessorTip);
        }
        setTimeout(() => setAiSuccessMessageStep3(null), 4000);
      }
    } catch (err) {
      console.error('Error generating First 10 Playbook:', err);
    } finally {
      setIsGeneratingAiStep3(false);
    }
  };

  // AI Generator for Section 3.6 Objection Busters
  const handleGenerateAllObjections = async () => {
    setIsGeneratingObjections(true);
    setObjectionSuccessMessage(null);
    try {
      const result = await generateModuleIObjectionBustersAction({
        planId: plan.id,
        planTitle: plan.title,
        industryCategory: plan.industryCategory,
        hqCountryCode: (plan.hqCountryCode as any) || 'IE',
        baseCurrency: plan.baseCurrency || 'EUR',
        elevatorHook140: step1Data.elevatorHook140 || '',
        targetCustomer: beachheadPersona,
        customerProblem: customerProblem,
        solutionCategory: plan.conceptCanvas?.proposedSolution || '',
        primaryBenefit: primaryUvp,
        competitiveWedge: (plan.moduleBData as any)?.competitiveWedge || '',
        mainCompetitors: ((plan.moduleBData as any)?.competitorList || []).map((c: any) => c.name || c).join(', '),
        productVehicle: step2Data.productP1.packagingType || (plan.moduleDData as any)?.productVehicle,
        headlinePricePoint:
          step3Data.letterOfIntent.pilotPricePoint ||
          step2Data.priceP2.headlinePricePoint ||
          resolvedUpstreamPrice.priceHeadline,
      });

      if (result.allowed && result.objectionBusters) {
        setStep3Data((prev) => ({
          ...prev,
          objectionBusters: {
            ...prev.objectionBusters,
            ...result.objectionBusters,
          },
        }));
        setObjectionSuccessMessage(
          result.engineMode === 'gemini-2.5-flash'
            ? '✨ Tailored objection busters and rebuttals generated with Gemini 2.5 Flash!'
            : '⚡ Smart Synthesizer generated tailored objections & rebuttals.'
        );
        setTimeout(() => setObjectionSuccessMessage(null), 4000);
      }
    } catch (err) {
      console.error('Error generating objection busters:', err);
    } finally {
      setIsGeneratingObjections(false);
    }
  };

  const handleGenerateSingleRebuttal = async (index: 1 | 2 | 3) => {
    setGeneratingSingleRebuttalIndex(index);
    try {
      const currentTitle =
        index === 1
          ? step3Data.objectionBusters.objection1Title || '1. Vendor Longevity & Credibility Risk'
          : index === 2
          ? step3Data.objectionBusters.objection2Title || '2. Status Quo / Switching Inertia'
          : step3Data.objectionBusters.objection3Title || '3. Missing Feature Gap / Integrations';

      const currentQuote =
        index === 1
          ? step3Data.objectionBusters.objection1Quote || "You're an unproven early-stage startup. What happens if you go bust or stop maintaining this software next year?"
          : index === 2
          ? step3Data.objectionBusters.objection2Quote || "Our existing spreadsheet / manual routine isn't perfect, but everyone knows it and we don't have time to retrain the team right now."
          : step3Data.objectionBusters.objection3Quote || "We really like the concept, but we cannot adopt unless you have custom integrations and automated export.";

      const result = await generateModuleIObjectionBustersAction({
        planId: plan.id,
        planTitle: plan.title,
        industryCategory: plan.industryCategory,
        hqCountryCode: (plan.hqCountryCode as any) || 'IE',
        baseCurrency: plan.baseCurrency || 'EUR',
        elevatorHook140: step1Data.elevatorHook140 || '',
        targetCustomer: beachheadPersona,
        customerProblem: customerProblem,
        solutionCategory: plan.conceptCanvas?.proposedSolution || '',
        primaryBenefit: primaryUvp,
        competitiveWedge: (plan.moduleBData as any)?.competitiveWedge || '',
        mainCompetitors: ((plan.moduleBData as any)?.competitorList || []).map((c: any) => c.name || c).join(', '),
        productVehicle: step2Data.productP1.packagingType || (plan.moduleDData as any)?.productVehicle,
        headlinePricePoint:
          step3Data.letterOfIntent.pilotPricePoint ||
          step2Data.priceP2.headlinePricePoint ||
          resolvedUpstreamPrice.priceHeadline,
        singleTarget: index,
        targetObjectionTitle: currentTitle,
        targetObjectionQuote: currentQuote,
      });

      if (result.allowed && result.objectionBusters) {
        setStep3Data((prev) => ({
          ...prev,
          objectionBusters: {
            ...prev.objectionBusters,
            vendorRisk: index === 1 ? result.objectionBusters.vendorRisk : prev.objectionBusters.vendorRisk,
            statusQuoInertia: index === 2 ? result.objectionBusters.statusQuoInertia : prev.objectionBusters.statusQuoInertia,
            featureGap: index === 3 ? result.objectionBusters.featureGap : prev.objectionBusters.featureGap,
          },
        }));
      }
    } catch (err) {
      console.error(`Error generating rebuttal for objection #${index}:`, err);
    } finally {
      setGeneratingSingleRebuttalIndex(null);
    }
  };

  // Harvest Module C Leads
  const handleHarvestModuleCLeads = () => {
    setIsHarvestingLeads(true);
    try {
      const newItems: First10ProspectItem[] = [];

      // 1. From high intent / pilot agreed interviews
      moduleCStats.highIntentInterviews.forEach((interview, idx) => {
        newItems.push({
          id: `modc_interview_${idx}_${Date.now()}`,
          companyOrPersona: interview.intervieweeNameOrRole || `Discovery Lead #${idx + 1}`,
          decisionMakerTitle: interview.channel ? `${interview.channel} contact` : 'Discovery Interviewee',
          triggerEventOrAngle: interview.keyTakeaway || interview.verbatimQuote || 'Engaged in Module C discovery interview',
          status: interview.commitmentOutcome === 'ASKED_TO_PILOT_OR_BUY' ? 'PILOT_AGREED' : 'MEETING_SET',
          source: 'MODULE_C_INTERVIEW',
          notes: interview.rawNotes ? `Interview note: ${interview.rawNotes.slice(0, 100)}` : 'Sourced from Module C Customer Interview Log',
        });
      });

      // 2. From waitlist signups
      moduleCStats.waitlistResponses.slice(0, 8).forEach((resp, idx) => {
        const emailContact = resp.respondentEmail?.trim() || '';
        const namePart = resp.respondentNameOrRole?.trim() || (emailContact ? emailContact.split('@')[0] : `Waitlist Member #${idx + 1}`);
        newItems.push({
          id: `modc_waitlist_${idx}_${Date.now()}`,
          companyOrPersona: namePart,
          decisionMakerTitle: emailContact || 'Waitlist Subscriber',
          triggerEventOrAngle: 'Registered interest via Module C public waitlist / survey page',
          status: 'TO_CONTACT',
          source: 'MODULE_C_WAITLIST',
          notes: `Waitlist lead captured: ${emailContact || 'Public survey submission'}`,
        });
      });

      if (newItems.length > 0) {
        setStep3Data((prev) => {
          const existingNonPlaceholders = prev.targetPipeline.filter(
            (p) => !p.id.startsWith('modc_') && !p.id.startsWith('prospect_')
          );
          return {
            ...prev,
            targetPipeline: [...newItems, ...existingNonPlaceholders],
          };
        });
        setHarvestSuccessMessage(`Successfully imported ${newItems.length} contacts from Module C into your Dream 10 pipeline!`);
        setTimeout(() => setHarvestSuccessMessage(null), 4000);
      } else {
        setHarvestSuccessMessage('No new leads found to import. You can add prospects manually below.');
        setTimeout(() => setHarvestSuccessMessage(null), 3000);
      }
    } finally {
      setIsHarvestingLeads(false);
    }
  };

  // Pipeline helper functions
  const handleAddProspect = () => {
    const newId = `prospect_${Date.now()}`;
    const newProspect: First10ProspectItem = {
      id: newId,
      companyOrPersona: '',
      decisionMakerTitle: '',
      triggerEventOrAngle: '',
      status: 'TO_CONTACT',
      source: 'MANUAL',
      notes: '',
    };
    setStep3Data((prev) => ({
      ...prev,
      targetPipeline: [newProspect, ...prev.targetPipeline],
    }));
  };

  const handleUpdateProspect = (id: string, updates: Partial<First10ProspectItem>) => {
    setStep3Data((prev) => ({
      ...prev,
      targetPipeline: prev.targetPipeline.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
  };

  const handleDeleteProspect = (id: string) => {
    setStep3Data((prev) => ({
      ...prev,
      targetPipeline: prev.targetPipeline.filter((p) => p.id !== id),
    }));
  };

  // Park question for Step 3
  const handleParkStep3Question = async () => {
    if (!parkingQuestionTextStep3.trim() || isParkingQuestionStep3) return;
    setIsParkingQuestionStep3(true);
    try {
      await parkModuleIOpenQuestionAction({
        planId: plan.id,
        questionText: `[First 10 Customers] ${parkingQuestionTextStep3.trim()}`,
      });
      setParkingSuccessStep3(true);
      setParkingQuestionTextStep3('');
      setTimeout(() => setParkingSuccessStep3(false), 3000);
    } catch (err) {
      console.error('Error parking Step 3 question:', err);
    } finally {
      setIsParkingQuestionStep3(false);
    }
  };

  // -------------------------------------------------------------
  // STEP 4 HANDLERS: REVERSE-ENGINEERED MARKETING BUDGET & CAC
  // -------------------------------------------------------------
  const handleSelectGoalPreset = (preset: BudgetGoalPreset) => {
    setStep4Data((prev) => {
      let nextCustomers = prev.targetMonthlyNewCustomers;
      if (preset === 'FIRST_10_PILOT') {
        nextCustomers = 10;
      } else if (preset === 'MOD_H_Y1_BREAKEVEN') {
        nextCustomers = upstreamEconomics.y1BreakevenCustomers;
      } else if (preset === 'MOD_H_Y2_SCALE') {
        nextCustomers = upstreamEconomics.y2BreakevenCustomers;
      } else if (preset === 'MOD_H_Y3_SCALE') {
        nextCustomers = upstreamEconomics.y3BreakevenCustomers;
      }
      return applySyncedPaidMediaSpend({
        ...prev,
        goalPreset: preset,
        targetMonthlyNewCustomers: nextCustomers,
      });
    });
  };

  const handleSyncPaidAdLineItemToSlider = () => {
    const impliedSpend = Math.max(0, step4LiveMetrics.impliedPaidMediaSpend);
    setStep4Data((prev) => {
      const hasPaidItem = prev.budgetLineItems.some((item) => item.bucket === 'PAID_MEDIA_ADS');
      if (hasPaidItem) {
        let updatedFirst = false;
        return {
          ...prev,
          budgetLineItems: prev.budgetLineItems.map((item) => {
            if (!updatedFirst && item.bucket === 'PAID_MEDIA_ADS') {
              updatedFirst = true;
              return {
                ...item,
                monthlySpend: impliedSpend,
                notes: `Synced to slider math: ${step4LiveMetrics.paidTouches.toLocaleString()} paid clicks/touches @ ${currencySymbol}${prev.estimatedCostPerClickOrTouch.toFixed(2)} CPC.`,
              };
            }
            return item;
          }),
        };
      }
      const newPaidItem: MarketingBudgetLineItem = {
        id: `mkt_paid_${Date.now()}`,
        bucket: 'PAID_MEDIA_ADS',
        channelOrToolName: 'High-Intent Paid Search & Social Campaigns',
        monthlySpend: impliedSpend,
        grantEligibilityStatus: 'INELIGIBLE_ONGOING_AD_SPEND',
        notes: `Synced to slider math: ${step4LiveMetrics.paidTouches.toLocaleString()} paid clicks/touches @ ${currencySymbol}${prev.estimatedCostPerClickOrTouch.toFixed(2)} CPC.`,
      };
      return {
        ...prev,
        budgetLineItems: [newPaidItem, ...prev.budgetLineItems],
      };
    });
  };

  const handleAddBudgetLineItem = () => {
    const newItem: MarketingBudgetLineItem = {
      id: `mkt_item_${Date.now()}`,
      bucket: 'GROWTH_STACK_TOOLS',
      channelOrToolName: '',
      monthlySpend: 100,
      grantEligibilityStatus: 'ELIGIBLE_CAPABILITY_OR_EXPORT',
      notes: '',
    };
    setStep4Data((prev) => ({
      ...prev,
      budgetLineItems: [...prev.budgetLineItems, newItem],
    }));
  };

  const handleUpdateBudgetLineItem = (
    id: string,
    updates: Partial<MarketingBudgetLineItem>
  ) => {
    setStep4Data((prev) => ({
      ...prev,
      budgetLineItems: prev.budgetLineItems.map((item) => {
        if (item.id !== id) return item;
        const merged = { ...item, ...updates };
        if (updates.bucket === 'PAID_MEDIA_ADS' && !updates.grantEligibilityStatus) {
          merged.grantEligibilityStatus = 'INELIGIBLE_ONGOING_AD_SPEND';
        } else if (
          (updates.bucket === 'GROWTH_STACK_TOOLS' || updates.bucket === 'CONTENT_EVENTS_PR') &&
          !updates.grantEligibilityStatus
        ) {
          merged.grantEligibilityStatus = 'ELIGIBLE_CAPABILITY_OR_EXPORT';
        }
        return merged;
      }),
    }));
  };

  const handleRemoveBudgetLineItem = (id: string) => {
    setStep4Data((prev) => ({
      ...prev,
      budgetLineItems: prev.budgetLineItems.filter((item) => item.id !== id),
    }));
  };

  const handleOptOutOfPaidAds = () => {
    // Preserve current paidTrafficSharePercent so reactivating restores the exact prior slider setting
    if (step4Data.paidTrafficSharePercent > 0) {
      setLastActivePaidShare(step4Data.paidTrafficSharePercent);
    }

    setStep4Data((prev) => {
      // Filter out PAID_MEDIA_ADS from budget items, or reset its spend to 0 if kept
      const remainingItems = prev.budgetLineItems.filter(
        (item) => item.bucket !== 'PAID_MEDIA_ADS'
      );
      // If all items were paid media, retain a clean tools row so budget items aren't completely empty
      const safeItems =
        remainingItems.length > 0
          ? remainingItems
          : [
              {
                id: `mkt_item_${Date.now()}`,
                bucket: 'GROWTH_STACK_TOOLS' as MarketingBudgetBucketType,
                channelOrToolName: 'Organic Growth Tools & Email CRM',
                monthlySpend: 50,
                grantEligibilityStatus: 'ELIGIBLE_CAPABILITY_OR_EXPORT' as MarketingGrantEligibilityStatus,
                notes: 'Subscribers & customer email nurturing tools (grant-friendly).',
              },
            ];

      return {
        ...prev,
        paidTrafficSharePercent: 0,
        paidAdsViabilityDecision: 'OPTED_OUT_UNPROFITABLE',
        excludePaidAdsFromModuleJ: true,
        budgetLineItems: safeItems,
      };
    });

    // Also update Step 5 readiness posture to BOOTSTRAPPED_ZERO_AD_SPEND and sync paragraph 3
    setStep5Data((prev) => {
      const isIE = (plan.hqCountryCode || 'IE') !== 'GB';
      const optOutParagraph = `Commercial Viability & Paid Ads Opt-Out Defense: After evaluating direct customer acquisition unit economics, the venture has formally opted out of paid advertising for Year 1. Paid performance clicks at current price points risk negative contribution margins and are strictly ineligible under grant co-funding guidelines (${isIE ? 'LEO Feasibility/Priming' : 'Innovate UK / Start Up Loans'}). Consequently, ongoing ad spend is 100% excluded from Module J financial overheads, preserving runway and protecting trading cashflow. Customer acquisition is driven entirely by founder-led organic outreach, high-intent pilot conversion, strategic partner integrations, and compounding customer referrals. This reverse-engineered funnel comfortably supports our monthly target of ${step4Data.targetMonthlyNewCustomers} new paying customers while keeping weekly founder marketing commitment manageable at ~${step4LiveMetrics.weeklyFounderHours} hours/week alongside product development.`;

      let updatedNarrative = prev.executiveMarketingSummaryNarrative;
      if (updatedNarrative.trim().length > 40) {
        const paras = updatedNarrative.split(/\n\n+/);
        if (paras.length >= 3) {
          paras[2] = optOutParagraph;
          updatedNarrative = paras.join('\n\n');
        } else if (paras.length === 2) {
          updatedNarrative = `${paras[0]}\n\n${paras[1]}\n\n${optOutParagraph}`;
        } else {
          updatedNarrative = `${updatedNarrative.trim()}\n\n${optOutParagraph}`;
        }
      }

      const updatedBlindSpots = prev.blindSpots.map((b) => {
        if (b.id === 'bs-cac-payback') {
          return {
            ...b,
            title: 'Paid Ads Opt-Out & Low-Cost Engine Focus',
            severity: 'INFO' as const,
            explanation: `Unit economics indicate paid advertising is unprofitable at the current headline price (${currencySymbol}${step4LiveMetrics.cashCac} CAC vs ${currencySymbol}${step4LiveMetrics.pocketProfit} pocket profit). Paid ads are formally excluded, conserving cash and focusing 100% on organic/direct distribution.`,
            suggestedAction: 'Channel all focus into founder-led organic outreach, high-conviction partnerships, and product-led word of mouth before revisiting paid channels.',
          };
        }
        return b;
      });

      return {
        ...prev,
        blindSpots: updatedBlindSpots,
        marketingReadinessConfidence: 'BOOTSTRAPPED_ZERO_AD_SPEND',
        executiveMarketingSummaryNarrative: updatedNarrative,
      };
    });
  };

  const handleReactivatePaidAds = () => {
    const isDtc = (plan.industryCategory || '').toLowerCase().includes('e-commerce') || (plan.industryCategory || '').toLowerCase().includes('food') || (plan.industryCategory || '').toLowerCase().includes('brick');
    const restoredShare = lastActivePaidShare > 0 ? lastActivePaidShare : 35;

    setStep4Data((prev) => {
      const restoredCpc =
        Number(prev.estimatedCostPerClickOrTouch) > 0
          ? Number(prev.estimatedCostPerClickOrTouch)
          : isDtc ? 1.1 : 2.1;

      const draft: MarketingBudgetStep4Data = {
        ...prev,
        paidTrafficSharePercent: restoredShare,
        estimatedCostPerClickOrTouch: restoredCpc,
        paidAdsViabilityDecision: 'ACTIVE' as PaidAdsViabilityDecision,
        excludePaidAdsFromModuleJ: false,
      };
      return applySyncedPaidMediaSpend(draft);
    });

    // Also update Step 5 readiness posture and sync narrative back to active paid blended acquisition
    setStep5Data((prev) => {
      const activePaidParagraph = `Commercial Viability & Acquisition Strategy: Customer acquisition operates on a disciplined blended engine, pairing ${100 - restoredShare}% founder-led organic outreach, customer referral loops, and strategic content with a controlled ${restoredShare}% paid acquisition allocation. Paid ad spend is strictly monitored against our Pocket-Profit contribution margin, ensuring every marketing dollar invested generates a sustainable return and stays within healthy underwriting thresholds.`;

      let updatedNarrative = prev.executiveMarketingSummaryNarrative;
      if (updatedNarrative.trim().length > 40) {
        const paras = updatedNarrative.split(/\n\n+/);
        if (paras.length >= 3) {
          paras[2] = activePaidParagraph;
          updatedNarrative = paras.join('\n\n');
        } else if (paras.length === 2) {
          updatedNarrative = `${paras[0]}\n\n${paras[1]}\n\n${activePaidParagraph}`;
        } else {
          updatedNarrative = `${updatedNarrative.trim()}\n\n${activePaidParagraph}`;
        }
      }

      const updatedBlindSpots = prev.blindSpots.map((b) => {
        if (b.id === 'bs-cac-payback') {
          return {
            ...b,
            title: 'Payback Velocity & CAC Margin Protection',
            severity: 'WARNING' as const,
            explanation: `Current customer acquisition CAC must be recovered within healthy margins. Underwriters and grant committees scrutinize payback timelines exceeding 6 months.`,
            suggestedAction: 'Introduce annual upfront billing incentives or onboarding deposits to accelerate cash payback to under 3 months.',
          };
        }
        return b;
      });

      return {
        ...prev,
        blindSpots: updatedBlindSpots,
        marketingReadinessConfidence:
          prev.marketingReadinessConfidence === 'BOOTSTRAPPED_ZERO_AD_SPEND'
            ? 'SCALABLE_HYBRID_FUNNEL'
            : prev.marketingReadinessConfidence,
        executiveMarketingSummaryNarrative: updatedNarrative,
      };
    });
  };

  const handleTogglePaidAdsStrategy = (enablePaid: boolean) => {
    if (enablePaid) {
      handleReactivatePaidAds();
    } else {
      handleOptOutOfPaidAds();
    }
  };

  const handleGenerateRefreshStep4Narrative = () => {
    const c = step4Data.targetMonthlyNewCustomers;
    const leads = step4LiveMetrics.requiredQualifiedLeads;
    const touches = step4LiveMetrics.requiredTopOfFunnelTouches;
    const spend = step4LiveMetrics.lineItemsTotalSpend;
    const cashCac = step4LiveMetrics.cashCac;
    const ltv = step4LiveMetrics.ltv;
    const ratio = step4LiveMetrics.ltvToCacRatio;
    const payback = step4LiveMetrics.paybackMonths;
    const isOptedOut =
      step4Data.paidAdsViabilityDecision === 'OPTED_OUT_UNPROFITABLE' ||
      Number(step4Data.paidTrafficSharePercent) === 0 ||
      step4Data.excludePaidAdsFromModuleJ === true ||
      step4LiveMetrics.paidMediaBucketSpend === 0 ||
      step4LiveMetrics.isUnitEconomicsUnderwater;

    const paybackClause =
      step4LiveMetrics.activeLtvModel === 'SINGLE_ONE_TIME_PURCHASE'
        ? step4LiveMetrics.firstOrderNetProfitAfterCac >= 0
          ? `achieving immediate Day-1 first-order profitability of +${currencySymbol}${step4LiveMetrics.firstOrderNetProfitAfterCac.toLocaleString()} net profit per customer after CAC.`
          : `yielding a single-order LTV of ${currencySymbol}${ltv.toLocaleString()} (requiring higher AOV bundling or repeat-purchase expansion to cover the ${currencySymbol}${cashCac.toLocaleString()} Cash CAC on Order #1).`
        : step4LiveMetrics.activeLtvModel === 'REPEAT_PURCHASE_ORDERS'
        ? `across an average of ${step4LiveMetrics.effectiveLtvMultiplier} lifetime orders (${ratio}x LTV:CAC), recovering acquisition spend within ${payback} orders.`
        : `across a ${step4LiveMetrics.effectiveLtvMultiplier}-month retention lifespan (${ratio}x LTV:CAC), recovering acquisition spend in ${payback} months.`;

    const optOutJustification = isOptedOut
      ? `\n\nGrant & Commercial Viability Defense: We formally evaluated paid performance advertising (at estimated CPCs of ${currencySymbol}${step4Data.estimatedCostPerClickOrTouch.toFixed(2)}) and concluded that direct paid ad customer acquisition is commercially unviable at this stage, eroding unit-level margins. We have deliberately opted against a paid advertising strategy in favor of 100% organic founder-led outreach, referral partnerships, and high-converting content. Ongoing paid ad spend is strictly excluded from our Module J financial overheads, preserving cash runway and focusing commercial funding on grant-eligible capability tools and customer onboarding.`
      : '';

    const narrative = isOptedOut
      ? `To acquire ${c.toLocaleString()} new paying customers per month (aligned with our Module H Pocket Profit breakeven model), our reverse-engineered funnel requires ${leads.toLocaleString()} qualified leads (${step4Data.leadToCustomerConversionPercent}% lead-to-sale conversion) generated from ${touches.toLocaleString()} monthly top-of-funnel visitors and direct outreach touches (${step4Data.visitorToLeadConversionPercent}% visitor-to-lead conversion). By executing a 100% founder-led organic outreach and partnership strategy (${step4LiveMetrics.weeklyFounderHours} hrs/week) with paid advertising excluded to protect cashflow, we operate on a streamlined ${currencySymbol}${spend.toLocaleString()}/month software and capability budget. This yields a Cash CAC of ${currencySymbol}${cashCac.toLocaleString()} against a Customer Pocket-Profit LTV of ${currencySymbol}${ltv.toLocaleString()}, ${paybackClause}${optOutJustification}`
      : `To acquire ${c.toLocaleString()} new paying customers per month (aligned with our Module H Pocket Profit breakeven model), our reverse-engineered funnel requires ${leads.toLocaleString()} qualified leads (${step4Data.leadToCustomerConversionPercent}% lead-to-sale conversion) generated from ${touches.toLocaleString()} monthly top-of-funnel visitors and direct outreach touches (${step4Data.visitorToLeadConversionPercent}% visitor-to-lead conversion). By pairing ${100 - step4Data.paidTrafficSharePercent}% founder-led organic execution (${step4LiveMetrics.weeklyFounderHours} hrs/week) with ${step4Data.paidTrafficSharePercent}% paid acquisition across a ${currencySymbol}${spend.toLocaleString()}/month marketing budget, we achieve a Cash CAC of ${currencySymbol}${cashCac.toLocaleString()} against a Customer Pocket-Profit LTV of ${currencySymbol}${ltv.toLocaleString()}, ${paybackClause}${optOutJustification}`;

    setStep4Data((prev) => ({
      ...prev,
      cacAndBudgetNarrative: narrative,
    }));
  };

  const handleSaveStep4 = async (options?: { silent?: boolean } | unknown) => {
    if (isVaultReadonly) return;
    setSaveStatusStep4('saving');
    const updatedStep4: MarketingBudgetStep4Data = {
      ...step4Data,
      totalPlannedMonthlyMarketingSpend: step4LiveMetrics.lineItemsTotalSpend,
      calculatedCashCac: step4LiveMetrics.cashCac,
      calculatedFullyLoadedCac: step4LiveMetrics.fullyLoadedCac,
      calculatedLtv: step4LiveMetrics.ltv,
      calculatedLtvToCacRatio: step4LiveMetrics.ltvToCacRatio,
      calculatedPaybackMonths: step4LiveMetrics.paybackMonths,
      weeklyFounderMarketingHours: step4LiveMetrics.weeklyFounderHours,
    };
    setStep4Data(updatedStep4);

    try {
      if (onSaveStep4Budget) {
        onSaveStep4Budget(updatedStep4, 90);
      }
      const res = await saveModuleIStep4BudgetAction({
        planId: plan.id,
        budget: updatedStep4,
        completionPercentage: 90,
      });
      if (res.ok || onSaveStep4Budget) {
        isDirtyStep4Ref.current = false;
        setSaveStatusStep4('saved');
        setTimeout(() => setSaveStatusStep4('idle'), 2500);
      } else {
        setSaveStatusStep4('error');
      }
    } catch (err) {
      console.error('Error saving Module I Step 4:', err);
      if (onSaveStep4Budget) {
        isDirtyStep4Ref.current = false;
        setSaveStatusStep4('saved');
        setTimeout(() => setSaveStatusStep4('idle'), 2500);
      } else {
        setSaveStatusStep4('error');
      }
    }
  };

  const handleGenerateAiStep4 = async () => {
    setIsGeneratingAiStep4(true);
    setAiSuccessMessageStep4(null);
    setAiAssessorTipStep4(null);
    try {
      const result = await generateModuleIBudgetAction({
        planId: plan.id,
        planTitle: plan.title,
        industryCategory: plan.industryCategory,
        hqCountryCode: (plan.hqCountryCode as any) || 'IE',
        baseCurrency: plan.baseCurrency || 'EUR',
        targetCustomer: beachheadPersona,
        customerProblem: customerProblem,
        primaryAcquisitionEngine: step2Data.promotionP4.primaryAcquisitionEngine,
        primaryChannel: step2Data.placeP3.primaryChannel,
        targetMonthlyNewCustomers: step4Data.targetMonthlyNewCustomers,
        netPricePerCustomer: upstreamEconomics.netPricePerCustomer,
        pocketProfitPerCustomer: upstreamEconomics.pocketProfitPerCustomer,
      });

      if (result.allowed) {
        setStep4Data((prev) => ({
          ...prev,
          leadToCustomerConversionPercent:
            result.leadToCustomerConversionPercent || prev.leadToCustomerConversionPercent,
          visitorToLeadConversionPercent:
            result.visitorToLeadConversionPercent || prev.visitorToLeadConversionPercent,
          paidTrafficSharePercent:
            typeof result.paidTrafficSharePercent === 'number'
              ? result.paidTrafficSharePercent
              : prev.paidTrafficSharePercent,
          estimatedCostPerClickOrTouch:
            result.estimatedCostPerClickOrTouch || prev.estimatedCostPerClickOrTouch,
          averageCustomerRetentionMonths:
            result.averageCustomerRetentionMonths || prev.averageCustomerRetentionMonths,
          budgetLineItems:
            result.budgetLineItems && result.budgetLineItems.length > 0
              ? result.budgetLineItems
              : prev.budgetLineItems,
          cacAndBudgetNarrative:
            result.cacAndBudgetNarrative || prev.cacAndBudgetNarrative,
          aiEngineUsed: result.engineMode,
        }));

        setAiSuccessMessageStep4(
          result.engineMode === 'gemini-2.5-flash'
            ? '✨ Reverse-engineered funnel, CAC benchmarks & grant-ready budget generated with Gemini 2.5 Flash!'
            : '⚡ Smart Synthesizer calibrated your CAC funnel & 3-bucket marketing budget.'
        );
        if (result.grantAssessorTip) {
          setAiAssessorTipStep4(result.grantAssessorTip);
        }
        setTimeout(() => setAiSuccessMessageStep4(null), 4500);
      }
    } catch (err) {
      console.error('Error generating AI Step 4 budget:', err);
    } finally {
      setIsGeneratingAiStep4(false);
    }
  };

  const handleParkStep4Question = async () => {
    if (!parkingQuestionTextStep4.trim() || isParkingQuestionStep4) return;
    setIsParkingQuestionStep4(true);
    try {
      await parkModuleIOpenQuestionAction({
        planId: plan.id,
        questionText: `[Marketing Budget & CAC] ${parkingQuestionTextStep4.trim()}`,
      });
      setParkingSuccessStep4(true);
      setParkingQuestionTextStep4('');
      setTimeout(() => setParkingSuccessStep4(false), 3000);
    } catch (err) {
      console.error('Error parking Step 4 question:', err);
    } finally {
      setIsParkingQuestionStep4(false);
    }
  };

  // Live LOI Markdown Preview
  const loiMarkdownPreview = useMemo(() => {
    return generateLetterOfIntentMarkdown({
      startupName: planTitle,
      targetCompanyName: step3Data.letterOfIntent.targetCompanyName || 'Acme Enterprises Ltd',
      targetContactName: step3Data.letterOfIntent.targetContactName || 'Managing Director',
      pilotDurationWeeks: step3Data.letterOfIntent.pilotDurationWeeks || 8,
      pilotPricePoint:
        step3Data.letterOfIntent.pilotPricePoint ||
        step2Data.priceP2.headlinePricePoint ||
        resolvedUpstreamPrice.priceHeadline ||
        '€99 / month',
      primarySuccessKpi:
        step3Data.letterOfIntent.primarySuccessKpi ||
        'Demonstrate 30% time reduction and 95% user satisfaction',
      customTermsText: step3Data.letterOfIntent.customTermsText,
      hqCountryCode: (plan.hqCountryCode as any) || 'IE',
      baseCurrency: plan.baseCurrency || 'EUR',
    });
  }, [
    plan,
    planTitle,
    step3Data.letterOfIntent,
    step2Data?.priceP2?.headlinePricePoint,
    resolvedUpstreamPrice.priceHeadline,
  ]);

  // Download / Print LOI as PDF
  const handlePrintLoiPdf = () => {
    try {
      const htmlContent = buildLetterOfIntentStandaloneHtmlDocument({
        startupName: planTitle,
        targetCompanyName: step3Data.letterOfIntent.targetCompanyName || 'Acme Enterprises Ltd',
        targetContactName: step3Data.letterOfIntent.targetContactName || 'Managing Director',
        pilotDurationWeeks: step3Data.letterOfIntent.pilotDurationWeeks || 8,
        pilotPricePoint:
          step3Data.letterOfIntent.pilotPricePoint ||
          step2Data?.priceP2?.headlinePricePoint ||
          resolvedUpstreamPrice.priceHeadline ||
          '€99 / month',
        primarySuccessKpi:
          step3Data.letterOfIntent.primarySuccessKpi ||
          'Demonstrate 30% time reduction and 95% user satisfaction',
        customTermsText: step3Data.letterOfIntent.customTermsText,
        hqCountryCode: (plan.hqCountryCode as any) || 'IE',
        baseCurrency: plan.baseCurrency || 'EUR',
      });

      const printWindow = window.open('', '_blank', 'width=920,height=850');
      if (!printWindow) {
        // Fallback if popup blocked: download standalone printable HTML file
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `LOI-Pilot-Agreement-${(
          step3Data.letterOfIntent.targetCompanyName || 'Partner'
        ).replace(/[^a-zA-Z0-9_-]/g, '_')}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return;
      }

      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
    } catch (e) {
      console.error('LOI PDF export error:', e);
    }
  };

  // Copy text helper
  const handleCopyText = async (text: string, key: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopiedScriptKey(key);
        setTimeout(() => setCopiedScriptKey(null), 2500);
      }
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  // Assembled live positioning sentence for review
  const livePositioningSentence = `For ${step1Data.positioningFormula.targetCustomer || '[Target Customer]'} who struggle with ${step1Data.positioningFormula.customerProblem || '[Problem]'}, ${planTitle} is a ${step1Data.positioningFormula.solutionCategory || '[Category]'} that provides ${step1Data.positioningFormula.primaryBenefit || '[Primary Benefit]'}. Unlike ${step1Data.positioningFormula.competitiveWedge || '[Alternatives]'}, our product delivers defensible advantage.`;

  // -------------------------------------------------------------
  // STEP 5 / OVERVIEW STATE: EXECUTIVE MARKETING BRIEF
  // -------------------------------------------------------------
  const [step5Data, setStep5Data] = useState<MarketingExecutiveBriefStep5Data>(() => {
    const existing = plan.moduleIData?.step5MarketingBrief;
    if (existing && typeof existing === 'object' && Array.isArray(existing.blindSpots)) {
      return existing;
    }

    const defaultThings = plan.moduleIData?.thingsToConsider;
    const initialBlindSpots: BlindSpotItem[] =
      Array.isArray(defaultThings) && defaultThings.length > 0
        ? defaultThings
        : [
            {
              id: 'bs-cac-payback',
              category: 'Marketing & Customer Acquisition',
              title:
                step4Data.paidAdsViabilityDecision === 'OPTED_OUT_UNPROFITABLE'
                  ? 'Paid Ads Opt-Out & Low-Cost Engine Focus'
                  : 'Payback Velocity & CAC Margin Protection',
              severity:
                step4Data.paidAdsViabilityDecision === 'OPTED_OUT_UNPROFITABLE'
                  ? 'INFO'
                  : step4LiveMetrics.paybackMonths > 6
                  ? 'WARNING'
                  : 'INFO',
              explanation:
                step4Data.paidAdsViabilityDecision === 'OPTED_OUT_UNPROFITABLE'
                  ? `Unit economics indicate paid advertising is unprofitable at the current headline price (${currencySymbol}${step4LiveMetrics.cashCac} CAC vs ${currencySymbol}${step4LiveMetrics.pocketProfit} pocket profit). Paid ads are formally excluded, conserving cash and focusing 100% on organic/direct distribution.`
                  : `Current estimated payback velocity is ${step4LiveMetrics.paybackMonths} months. Underwriters and grant committees scrutinize payback timelines exceeding 6 months.`,
              suggestedAction:
                step4Data.paidAdsViabilityDecision === 'OPTED_OUT_UNPROFITABLE'
                  ? 'Channel all focus into founder-led organic outreach, high-conviction partnerships, and product-led word of mouth before revisiting paid channels.'
                  : 'Introduce annual upfront billing incentives or onboarding deposits to accelerate cash payback to under 3 months.',
            },
            {
              id: 'bs-warm-pipeline-exhaustion',
              category: 'Marketing & Customer Acquisition',
              title: 'Warm Pipeline Cliff After First 10 Customers',
              severity: 'WARNING',
              explanation: `Step 3 targets ${step3Data.targetPipeline.length} high-probability warm accounts. Once these initial pilot partners convert, customer acquisition must successfully transition into cold outreach and systematic inbound channels.`,
              suggestedAction:
                'Integrate referral triggers and case study permissions directly into pilot Letter of Intent milestones so initial users feed your subsequent pipeline.',
            },
            {
              id: 'bs-grant-compliance-ad-exclusion',
              category: 'Marketing & Customer Acquisition',
              title: 'Grant Compliance: Software vs Ad Media Separation',
              severity: 'INFO',
              explanation: `LEO and Innovate UK grants co-fund software tools (${currencySymbol}${step4LiveMetrics.toolsBucketSpend.toLocaleString()}/mo), digital consultancy, and creative assets, but strictly prohibit ongoing paid advertising media spend.`,
              suggestedAction:
                'Keep marketing tools and web infrastructure isolated from recurring ad budgets in your Module J grant schedule.',
            },
          ];

    return {
      blindSpots: initialBlindSpots,
      marketingReadinessConfidence:
        step4Data.paidAdsViabilityDecision === 'OPTED_OUT_UNPROFITABLE'
          ? 'BOOTSTRAPPED_ZERO_AD_SPEND'
          : step3Data.targetPipeline.length >= 5
          ? 'ORGANIC_FIRST_10_READY'
          : 'NEEDS_CONVERSION_TESTING',
      otherReadinessConfidenceText: '',
      executiveMarketingSummaryNarrative: '',
    };
  });

  const isStep5Complete = Boolean(
    step5Data.executiveMarketingSummaryNarrative.trim().length > 40 &&
      step5Data.blindSpots.length >= 1
  );

  const isOptedOutOfPaid = Boolean(
    step4Data.paidAdsViabilityDecision === 'OPTED_OUT_UNPROFITABLE' ||
    Number(step4Data.paidTrafficSharePercent) === 0 ||
    step4Data.excludePaidAdsFromModuleJ
  );

  const [saveStatusStep5, setSaveStatusStep5] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isGeneratingAiBrief, setIsGeneratingAiBrief] = useState(false);
  const [copiedBrief, setCopiedBrief] = useState(false);
  const [aiBriefAssessorTip, setAiBriefAssessorTip] = useState<string | null>(null);
  const [briefAiSuccessMessage, setBriefAiSuccessMessage] = useState<string | null>(null);

  const handleGenerateAiMarketingBrief = async () => {
    setIsGeneratingAiBrief(true);
    setBriefAiSuccessMessage(null);
    setAiBriefAssessorTip(null);
    try {
      const isEffectivelyOptedOut = isOptedOutOfPaid;

      const result = await generateModuleIMarketingBriefAction({
        planId: plan.id,
        planTitle: planTitle,
        industryCategory: plan.industryCategory,
        hqCountryCode: (plan.hqCountryCode as any) || 'IE',
        currencySymbol: currencySymbol,
        positioningHeadline: step1Data.elevatorHook140,
        toneOfVoice: step1Data.toneOfVoice,
        targetCustomer: beachheadPersona,
        primaryChannel: step2Data.placeP3.primaryChannel,
        primaryAcquisitionEngine: step2Data.promotionP4.primaryAcquisitionEngine,
        pipelineProspectsCount: step3Data.targetPipeline.length,
        targetMonthlyNewCustomers: step4Data.targetMonthlyNewCustomers,
        cashCac: isEffectivelyOptedOut ? 0 : step4LiveMetrics.cashCac,
        ltv: step4LiveMetrics.ltv,
        ltvToCacRatio: step4LiveMetrics.ltvToCacRatio,
        paidTrafficSharePercent: isEffectivelyOptedOut ? 0 : (Number(step4Data.paidTrafficSharePercent) || 0),
        paidAdsViabilityDecision: isEffectivelyOptedOut ? 'OPTED_OUT_UNPROFITABLE' : (step4Data.paidAdsViabilityDecision || 'NOT_EVALUATED_YET'),
        isOptedOut: isEffectivelyOptedOut,
        excludePaidAdsFromModuleJ: isEffectivelyOptedOut || Boolean(step4Data.excludePaidAdsFromModuleJ),
        totalMonthlyMarketingSpend: isEffectivelyOptedOut
          ? (step4LiveMetrics.toolsBucketSpend + step4LiveMetrics.contentEventsBucketSpend)
          : step4LiveMetrics.lineItemsTotalSpend,
        weeklyFounderHours: step4LiveMetrics.weeklyFounderHours,
        activeLtvModel: step4LiveMetrics.activeLtvModel,
        firstOrderNetProfitAfterCac: step4LiveMetrics.firstOrderNetProfitAfterCac,
        paidMediaSpend: isEffectivelyOptedOut ? 0 : step4LiveMetrics.paidMediaBucketSpend,
      });

      if (result.allowed) {
        setStep5Data((prev) => ({
          ...prev,
          executiveMarketingSummaryNarrative:
            result.executiveMarketingSummaryNarrative || prev.executiveMarketingSummaryNarrative,
          blindSpots:
            Array.isArray(result.blindSpots) && result.blindSpots.length > 0
              ? result.blindSpots
              : prev.blindSpots,
          marketingReadinessConfidence: isEffectivelyOptedOut
            ? 'BOOTSTRAPPED_ZERO_AD_SPEND'
            : (result.marketingReadinessConfidence || prev.marketingReadinessConfidence),
          aiAssessorTip: result.aiAssessorTip || prev.aiAssessorTip,
        }));
        if (isEffectivelyOptedOut && step4Data.paidAdsViabilityDecision !== 'OPTED_OUT_UNPROFITABLE') {
          setStep4Data((prev) => ({
            ...prev,
            paidAdsViabilityDecision: 'OPTED_OUT_UNPROFITABLE',
            paidTrafficSharePercent: 0,
            excludePaidAdsFromModuleJ: true,
          }));
        }
        if (result.aiAssessorTip) {
          setAiBriefAssessorTip(result.aiAssessorTip);
        }
        setBriefAiSuccessMessage(
          `Generated 3-paragraph commercial defense & audited ${result.blindSpots.length} GTM blind spots using ${result.engineMode}.`
        );
        setTimeout(() => setBriefAiSuccessMessage(null), 5000);
      }
    } catch (err) {
      console.error('Error generating Module I marketing brief:', err);
    } finally {
      setIsGeneratingAiBrief(false);
    }
  };

  const handleSaveStep5 = async (options?: { silent?: boolean } | unknown) => {
    if (isVaultReadonly) return;
    setSaveStatusStep5('saving');
    const updatedStep5: MarketingExecutiveBriefStep5Data = {
      ...step5Data,
      lastSavedAt: new Date().toISOString(),
    };
    setStep5Data(updatedStep5);

    try {
      if (onSaveStep5Brief) {
        onSaveStep5Brief(updatedStep5, 100);
      }
      const res = await saveModuleIStep5BriefAction({
        planId: plan.id,
        brief: updatedStep5,
        completionPercentage: 100,
      });
      if (res.ok || onSaveStep5Brief) {
        isDirtyStep5Ref.current = false;
        setSaveStatusStep5('saved');
        setTimeout(() => setSaveStatusStep5('idle'), 2500);
      } else {
        setSaveStatusStep5('error');
      }
    } catch (err) {
      console.error('Error saving Module I Step 5:', err);
      if (onSaveStep5Brief) {
        isDirtyStep5Ref.current = false;
        setSaveStatusStep5('saved');
        setTimeout(() => setSaveStatusStep5('idle'), 2500);
      } else {
        setSaveStatusStep5('error');
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

  const handleAddCustomBlindSpot = () => {
    const newId = `bs-custom-${Date.now()}`;
    const newBlindSpot: BlindSpotItem = {
      id: newId,
      category: 'Marketing & Customer Acquisition',
      title: 'Custom Marketing / Channel Consideration',
      severity: 'WARNING',
      explanation: 'Describe an additional commercial channel, conversion, or competitor blind spot relevant to your market.',
      suggestedAction: 'Specify an action plan or operational mitigation to address this factor.',
    };
    setStep5Data((prev) => ({
      ...prev,
      blindSpots: [newBlindSpot, ...prev.blindSpots],
    }));
  };

  const handleParkBlindSpotInOpenQuestions = async (item: BlindSpotItem) => {
    try {
      await parkModuleIOpenQuestionAction({
        planId: plan.id,
        questionText: `[Marketing Blind Spot: ${item.title}] ${item.explanation} -> Proposed Action: ${item.suggestedAction}`,
      });
      alert(`Parked "${item.title}" into your Open Questions Parking Lot.`);
    } catch (err) {
      console.error('Error parking blind spot:', err);
    }
  };

  const handleCopyMarkdownBrief = async () => {
    const briefData: ModuleIBriefData = {
      planTitle,
      founderName: 'Founding Team',
      industryCategory: plan.industryCategory || 'Venture',
      hqCountryCode: ((plan.hqCountryCode as SupportedCountryCode) || 'IE'),
      currencySymbol,
      baseCurrency: plan.baseCurrency || 'EUR',
      dateStr: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      step1Data,
      step2Data,
      step3Data,
      step4Data,
      metrics: step4LiveMetrics,
      step5Data,
    };

    const dossierMarkdown = buildModuleIMarkdownBrief(briefData);

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(dossierMarkdown);
        setCopiedBrief(true);
        setTimeout(() => setCopiedBrief(false), 2500);
      }
    } catch (e) {
      console.error('Failed to copy dossier:', e);
    }
  };

  const handleDownloadModuleIBriefHtml = () => {
    try {
      const briefData: ModuleIBriefData = {
        planTitle,
        founderName: 'Founding Team',
        industryCategory: plan.industryCategory || 'Venture',
        hqCountryCode: ((plan.hqCountryCode as SupportedCountryCode) || 'IE'),
        currencySymbol,
        baseCurrency: plan.baseCurrency || 'EUR',
        dateStr: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        step1Data,
        step2Data,
        step3Data,
        step4Data,
        metrics: step4LiveMetrics,
        step5Data,
      };

      const htmlContent = buildModuleIStandaloneHtmlDocument(briefData);
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${planTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_Module_I_Marketing_Brief.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to download Module I HTML brief:', e);
    }
  };

  const handlePrintModuleIBriefPdf = () => {
    try {
      const briefData: ModuleIBriefData = {
        planTitle,
        founderName: 'Founding Team',
        industryCategory: plan.industryCategory || 'Venture',
        hqCountryCode: ((plan.hqCountryCode as SupportedCountryCode) || 'IE'),
        currencySymbol,
        baseCurrency: plan.baseCurrency || 'EUR',
        dateStr: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        step1Data,
        step2Data,
        step3Data,
        step4Data,
        metrics: step4LiveMetrics,
        step5Data,
      };

      const htmlContent = buildModuleIStandaloneHtmlDocument(briefData);
      const printWindow = window.open('', '_blank', 'width=1000,height=850');
      if (!printWindow) {
        // Fallback to HTML file download if popup blocked
        handleDownloadModuleIBriefHtml();
        return;
      }

      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
    } catch (e) {
      console.error('Failed to print Module I PDF brief:', e);
    }
  };

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* MODULE I TOP HEADER BANNER (Strict GEMINI.md Rule 6 Standard) */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-950 via-indigo-900 to-violet-900 p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-indigo-400/40 bg-indigo-500/30 text-indigo-100 text-[10px] shrink-0">
                Module I • Go-To-Market &amp; Customer Acquisition
              </Badge>
              <Badge className="border-emerald-400/30 bg-emerald-500/20 text-emerald-200 text-[10px] shrink-0">
                <Sparkles className="mr-1 h-3 w-3" />
                {completedCoreStepsCount} of 4 Core Steps Ready
              </Badge>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Module I: Marketing, 4Ps &amp; First 10 Customers
            </h1>
            <p className="max-w-2xl text-xs text-indigo-100/90 sm:text-sm">
              Craft an unforgettable 3-second hook, lock your 4Ps strategy, execute your day-1 hustle to win your first 10 customers, and reverse-engineer your marketing budget to prove CAC payback.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="flex items-center gap-2">
              {onBackToModuleH && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onBackToModuleH}
                  className="border-indigo-400/40 bg-white/10 text-xs text-white hover:bg-white/20"
                >
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                  Back to Module H
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpenStep((prev) => (prev === 'ALL' ? 0 : 'ALL'))}
                className="border-indigo-400/40 bg-white/10 text-xs text-white hover:bg-white/20"
              >
                {openStep === 'ALL' ? 'Focus Step-by-Step' : 'Expand All Steps'}
              </Button>
            </div>
            <div className="text-right text-[11px] text-indigo-200">
              Module I Progress:{' '}
              <strong className="text-white">
                {Math.round((completedCoreStepsCount / 4) * 100)}%
              </strong>{' '}
              ({completedCoreStepsCount} of 4 Core Steps Ready)
            </div>
          </div>
        </div>

        {/* Step Navigation Strip (Tile Grid Standard) */}
        <div className="mt-5 grid grid-cols-2 gap-2 border-t border-indigo-800/70 pt-4 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { step: 'Step 1', title: '1. Brand Hook', done: isStep1Complete, targetId: 'module-i-step-1', stepNum: 1 },
            { step: 'Step 2', title: '2. 4Ps & Channels', done: isStep2Complete, targetId: 'module-i-step-2', stepNum: 2 },
            { step: 'Step 3', title: '3. First 10 Playbook', done: isStep3Complete, targetId: 'module-i-step-3', stepNum: 3 },
            { step: 'Step 4', title: '4. Budget & CAC', done: isStep4Complete, targetId: 'module-i-step-4', stepNum: 4 },
            { step: 'Overview', title: '5. Overview Brief', done: isStep5Complete, targetId: 'module-i-step-5', stepNum: 5 },
          ].map((item, idx, arr) => {
            const firstIncompleteIdx = arr.findIndex((s) => !s.done);
            const isStepOpen =
              openStep === 'ALL'
                ? (firstIncompleteIdx === -1 ? idx === arr.length - 1 : idx === firstIncompleteIdx)
                : openStep === item.stepNum;
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => {
                  setOpenStep(item.stepNum);
                  setTimeout(() => {
                    const el = document.getElementById(item.targetId);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      {/* STEP 1: BRAND POSITIONING, VALUE PROP & 3-SECOND HOOK          */}
      {/* ------------------------------------------------------------- */}
      {openStep !== 'ALL' && openStep !== 1 ? (
        // COLLAPSED STEP 1
        <div
          id="module-i-step-1"
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
                  Step 1: Brand Positioning, Value Proposition &amp; 3-Second Hook
                </h2>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {step1Data.elevatorHook140 || 'Define your 3-second hook & brand voice'} • Voice:{' '}
                  {step1Data.toneOfVoice === 'OTHER'
                    ? step1Data.otherToneOfVoiceText || 'Custom Voice'
                    : TONE_OPTIONS.find((t) => t.id === step1Data.toneOfVoice)?.title}
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
                {isStep1Complete ? 'Edit Step' : 'Open Step'}
                <ChevronDown className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // EXPANDED STEP 1
        <Card id="module-i-step-1" className="scroll-mt-24 rounded-xl border border-slate-200 bg-white shadow-xs">
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
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base font-bold text-slate-900">
                      Step 1: Brand Positioning, Value Proposition &amp; 3-Second Hook
                    </CardTitle>
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
                  </div>
                  <CardDescription className="mt-1 text-xs text-slate-600">
                    Articulate why your startup matters in under 3 seconds. Establish an unforgettable elevator hook, classic positioning formula, and disciplined brand voice guardrails.
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

            {/* 4-Layer Support Strip: Micro-Coaching, Examples, Open Questions */}
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

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleGenerateAiPositioning}
                disabled={isGeneratingAi}
                className="h-7 border-violet-200 bg-violet-50/60 text-[11px] font-medium text-violet-700 hover:bg-violet-100"
              >
                {isGeneratingAi ? (
                  <>
                    <RefreshCw className="mr-1 h-3.5 w-3.5 animate-spin" />
                    Synthesizing Positioning...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-1 h-3.5 w-3.5 text-violet-600" />
                    Auto-Generate Hook &amp; Pillars with AI
                  </>
                )}
              </Button>
            </div>

            {/* Micro-Coaching Card (Collapsible) */}
            {activeWhyCard === 1 && (
              <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50/70 p-3.5 text-xs text-indigo-900">
                <div className="flex items-start gap-2">
                  <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                  <div className="space-y-1">
                    <p className="font-semibold text-indigo-950">
                      Why does positioning come before spending marketing money?
                    </p>
                    <p className="text-indigo-800">
                      Most early-stage founders waste money on Facebook or Google ads before they can clearly explain their product in one sentence. If a customer or grant assessor doesn’t understand what you do in 3 seconds, they bounce. A rigorous positioning formula forces clarity, aligns all landing pages, and prevents you from competing on price alone.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Example Card (Collapsible) */}
            {activeExampleCard === 1 && (
              <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/70 p-3.5 text-xs text-emerald-950">
                <div className="flex items-start gap-2">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <div className="space-y-1">
                    <p className="font-semibold text-emerald-900">
                      Real-World Example (B2B SaaS / Preflight):
                    </p>
                    <p className="text-emerald-800">
                      <strong className="text-emerald-950">140-Char Hook:</strong> &quot;Startup Preflight is the flight simulator for founders—stress-testing your unit economics and compiling grant applications in minutes.&quot;
                    </p>
                    <p className="text-emerald-800">
                      <strong className="text-emerald-950">Formula:</strong> For early-stage European founders who waste months drafting business plans, Startup Preflight is a structured operating system that stress-tests financials and auto-compiles grant applications. Unlike generic templates and expensive consultants, we deliver automated blind-spot audits.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Success / Assessor Notification */}
            {aiSuccessMessage && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs font-medium text-emerald-800">
                <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{aiSuccessMessage}</span>
              </div>
            )}

            {aiAssessorTip && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900">
                <div className="flex items-start gap-2">
                  <Target className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <div>
                    <span className="font-semibold text-amber-950">Commercial Assessor Tip: </span>
                    <span>{aiAssessorTip}</span>
                  </div>
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-6 pt-5">
            {/* ----------------------------------------------------------- */}
            {/* 1.1 THE 3-SECOND ELEVATOR HOOK (140 CHARS)                  */}
            {/* ----------------------------------------------------------- */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-800">
                  1. The 3-Second Elevator Hook (Max 140 Characters)
                </Label>
                <span
                  className={`text-[11px] font-mono font-medium ${
                    step1Data.elevatorHook140.length > 140
                      ? 'text-rose-600 font-bold'
                      : step1Data.elevatorHook140.length > 120
                      ? 'text-amber-600'
                      : 'text-slate-500'
                  }`}
                >
                  {step1Data.elevatorHook140.length} / 140 chars
                </span>
              </div>
              <p className="text-xs text-slate-500">
                The single sentence you say when someone asks &quot;So what do you do?&quot; Ideal for your website hero header, Twitter/X bio, and pitch deck opening slide.
              </p>
              <Input
                type="text"
                maxLength={160}
                value={step1Data.elevatorHook140}
                onChange={(e) =>
                  setStep1Data((prev) => ({
                    ...prev,
                    elevatorHook140: e.target.value,
                  }))
                }
                placeholder="e.g. Acme helps busy restaurants cut food waste by 35% with smart automated inventory tracking."
                className="text-base sm:text-xs font-medium text-slate-900"
              />
              {step1Data.elevatorHook140.length > 140 && (
                <p className="text-[11px] text-rose-600">
                  ⚠️ Your hook is currently {step1Data.elevatorHook140.length - 140} characters over the 140-char limit. Tighten it so it fits into social bios and hero headers.
                </p>
              )}
            </div>

            {/* ----------------------------------------------------------- */}
            {/* 1.2 CLASSIC POSITIONING STATEMENT FORMULA                   */}
            {/* ----------------------------------------------------------- */}
            <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    2. Classic Positioning Formula (Geoffrey Moore Framework)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Auto-synthesizes your competitive wedge into a bulletproof commercial statement for investors and grant evaluators.
                  </p>
                </div>
                <Badge variant="outline" className="border-indigo-200 text-indigo-700 text-[10px]">
                  Investor Standard
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-slate-700">
                    For (Target Customer / Persona)
                  </Label>
                  <Input
                    type="text"
                    value={step1Data.positioningFormula.targetCustomer}
                    onChange={(e) =>
                      setStep1Data((prev) => ({
                        ...prev,
                        positioningFormula: {
                          ...prev.positioningFormula,
                          targetCustomer: e.target.value,
                        },
                      }))
                    }
                    placeholder="e.g. European early-stage founders & startup studios"
                    className="text-base sm:text-xs bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-slate-700">
                    Who struggle with (Core Urgent Problem)
                  </Label>
                  <Input
                    type="text"
                    value={step1Data.positioningFormula.customerProblem}
                    onChange={(e) =>
                      setStep1Data((prev) => ({
                        ...prev,
                        positioningFormula: {
                          ...prev.positioningFormula,
                          customerProblem: e.target.value,
                        },
                      }))
                    }
                    placeholder="e.g. spending months drafting business plans and guessing grant rules"
                    className="text-base sm:text-xs bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-slate-700">
                    {planTitle} is a (Product Category / Vehicle)
                  </Label>
                  <Input
                    type="text"
                    value={step1Data.positioningFormula.solutionCategory}
                    onChange={(e) =>
                      setStep1Data((prev) => ({
                        ...prev,
                        positioningFormula: {
                          ...prev.positioningFormula,
                          solutionCategory: e.target.value,
                        },
                      }))
                    }
                    placeholder="e.g. structured founder preflight & grant-compilation operating system"
                    className="text-base sm:text-xs bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-slate-700">
                    That provides (Primary Transformation / Benefit)
                  </Label>
                  <Input
                    type="text"
                    value={step1Data.positioningFormula.primaryBenefit}
                    onChange={(e) =>
                      setStep1Data((prev) => ({
                        ...prev,
                        positioningFormula: {
                          ...prev.positioningFormula,
                          primaryBenefit: e.target.value,
                        },
                      }))
                    }
                    placeholder="e.g. verified unit economics and ready-to-submit grant applications in minutes"
                    className="text-base sm:text-xs bg-white"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-[11px] font-semibold text-slate-700">
                    Unlike (Competitors / Status Quo Alternatives), our product...
                  </Label>
                  <Input
                    type="text"
                    value={step1Data.positioningFormula.competitiveWedge}
                    onChange={(e) =>
                      setStep1Data((prev) => ({
                        ...prev,
                        positioningFormula: {
                          ...prev.positioningFormula,
                          competitiveWedge: e.target.value,
                        },
                      }))
                    }
                    placeholder="e.g. generic business plan templates and expensive consultants, we provide automated blind-spot audits and regional grant matching."
                    className="text-base sm:text-xs bg-white"
                  />
                </div>
              </div>

              {/* Live Rendered Synthesis Box */}
              <div className="rounded-lg border border-indigo-200/80 bg-indigo-50/50 p-3 text-xs text-indigo-950">
                <span className="font-semibold text-indigo-900 block mb-1">
                  🔍 Live Rendered Positioning Statement:
                </span>
                <p className="italic leading-relaxed text-indigo-900">
                  &ldquo;{livePositioningSentence}&rdquo;
                </p>
              </div>
            </div>

            {/* ----------------------------------------------------------- */}
            {/* 1.3 BRAND PERSONALITY & TONE OF VOICE                       */}
            {/* ----------------------------------------------------------- */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-bold text-slate-800">
                  3. Brand Personality &amp; Tone of Voice
                </Label>
                <p className="text-xs text-slate-500">
                  How does your brand speak across social media, email newsletters, and customer support?
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {TONE_OPTIONS.map((tone) => {
                  const isSelected = step1Data.toneOfVoice === tone.id;
                  return (
                    <div
                      key={tone.id}
                      onClick={() =>
                        setStep1Data((prev) => ({
                          ...prev,
                          toneOfVoice: tone.id,
                        }))
                      }
                      className={`cursor-pointer rounded-xl border p-3 text-left transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/40 shadow-xs ring-1 ring-indigo-500'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">
                          {tone.title}
                        </span>
                        {isSelected && (
                          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-white">
                            <Check className="h-2.5 w-2.5" />
                          </div>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] text-slate-600 leading-snug">
                        {tone.description}
                      </p>
                      <div className="mt-2 text-[10px] text-slate-400">
                        <span className="font-medium text-slate-500">Best for: </span>
                        {tone.bestFor}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Edge Case: Mandatory "OTHER" text input */}
              {step1Data.toneOfVoice === 'OTHER' && (
                <div className="rounded-lg border border-indigo-200 bg-indigo-50/40 p-3 space-y-1.5">
                  <Label className="text-xs font-semibold text-indigo-950">
                    Describe your custom tone of voice:
                  </Label>
                  <Input
                    type="text"
                    value={step1Data.otherToneOfVoiceText || ''}
                    onChange={(e) =>
                      setStep1Data((prev) => ({
                        ...prev,
                        otherToneOfVoiceText: e.target.value,
                      }))
                    }
                    placeholder="e.g. Witty yet deeply technical, like a friendly senior software engineer over coffee."
                    className="text-base sm:text-xs bg-white"
                  />
                </div>
              )}
            </div>

            {/* ----------------------------------------------------------- */}
            {/* 1.4 BRAND VOICE BOUNDARIES: "WE ARE [X] BUT NEVER [Y]"       */}
            {/* ----------------------------------------------------------- */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
              <div>
                <Label className="text-xs font-bold text-slate-800">
                  4. Tone Guardrails: &quot;We Are [X] but Never [Y]&quot;
                </Label>
                <p className="text-xs text-slate-500">
                  Setting clear negative constraints prevents marketing writers or team members from sounding inconsistent or off-brand.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <Label className="text-[11px] font-semibold text-emerald-900">
                      We are always...
                    </Label>
                  </div>
                  <Input
                    type="text"
                    value={step1Data.toneOfVoiceBoundary.weAre}
                    onChange={(e) =>
                      setStep1Data((prev) => ({
                        ...prev,
                        toneOfVoiceBoundary: {
                          ...prev.toneOfVoiceBoundary,
                          weAre: e.target.value,
                        },
                      }))
                    }
                    placeholder="e.g. Direct, empowering, rigorous, and evidence-backed"
                    className="text-base sm:text-xs bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-rose-500" />
                    <Label className="text-[11px] font-semibold text-rose-900">
                      We are never...
                    </Label>
                  </div>
                  <Input
                    type="text"
                    value={step1Data.toneOfVoiceBoundary.weAreNever}
                    onChange={(e) =>
                      setStep1Data((prev) => ({
                        ...prev,
                        toneOfVoiceBoundary: {
                          ...prev.toneOfVoiceBoundary,
                          weAreNever: e.target.value,
                        },
                      }))
                    }
                    placeholder="e.g. Condescending, full of corporate jargon, or cynical"
                    className="text-base sm:text-xs bg-white"
                  />
                </div>
              </div>
            </div>

            {/* ----------------------------------------------------------- */}
            {/* 1.5 THREE CORE BRAND PILLARS                                */}
            {/* ----------------------------------------------------------- */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-bold text-slate-800">
                  5. Three Core Brand Value Pillars
                </Label>
                <p className="text-xs text-slate-500">
                  The 3 fundamental reasons why customers choose you. These become the 3 main feature bullets on your landing page and sales collateral.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((idx) => (
                  <div key={idx} className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-slate-700">
                      Pillar #{idx + 1}
                    </Label>
                    <Input
                      type="text"
                      value={step1Data.corePillars[idx] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStep1Data((prev) => {
                          const updated = [...prev.corePillars] as [string, string, string];
                          updated[idx] = val;
                          return { ...prev, corePillars: updated };
                        });
                      }}
                      placeholder={
                        idx === 0
                          ? 'e.g. Radical Speed'
                          : idx === 1
                          ? 'e.g. Bank & Grant Compliance'
                          : 'e.g. Unforgiving Blind-Spot Detection'
                      }
                      className="text-base sm:text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* ----------------------------------------------------------- */}
            {/* MOMENTUM PROTECTION: PARK UNRESOLVED QUESTION IN LOT        */}
            {/* ----------------------------------------------------------- */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bookmark className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-bold text-amber-950">
                    Momentum Protection: Park an Unresolved Brand Question
                  </span>
                </div>
                {parkingSuccess && (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">
                    <Check className="mr-1 h-3 w-3" /> Question Parked
                  </Badge>
                )}
              </div>
              <p className="text-xs text-amber-800">
                Stuck between two different taglines or unsure about your tone? Don’t let it stop you. Park it here to discuss with mentors or customers later.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="text"
                  value={parkingQuestionText}
                  onChange={(e) => setParkingQuestionText(e.target.value)}
                  placeholder="e.g. Should our tone be playful like Duolingo or serious like Bloomberg?"
                  className="text-base sm:text-xs bg-white flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleParkQuestion}
                  disabled={!parkingQuestionText.trim() || isParkingQuestion}
                  className="border-amber-300 bg-white text-xs font-medium text-amber-900 hover:bg-amber-100 shrink-0"
                >
                  {isParkingQuestion ? (
                    <RefreshCw className="mr-1 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Bookmark className="mr-1 h-3.5 w-3.5" />
                  )}
                  Park in Open Questions
                </Button>
              </div>
            </div>

            {/* Bottom Step Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveStep1}
                  disabled={saveStatus === 'saving' || isVaultReadonly}
                  className="bg-indigo-600 text-xs font-medium text-white hover:bg-indigo-700"
                >
                  {saveStatus === 'saving' ? (
                    <>
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Saving Step 1...
                    </>
                  ) : saveStatus === 'saved' ? (
                    <>
                      <Check className="mr-1.5 h-3.5 w-3.5" />
                      Saved!
                    </>
                  ) : (
                    'Save Step 1'
                  )}
                </Button>
                {saveStatus === 'error' && (
                  <span className="text-xs text-rose-600">Failed to save. Please try again.</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await handleSaveStep1();
                    setOpenStep(2);
                    window.scrollTo({ top: 400, behavior: 'smooth' });
                  }}
                  className="border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Next Step: 4Ps &amp; Channels
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STEP 2: THE MODERN 4PS & CHANNEL DISTRIBUTION MATRIX          */}
      {/* ------------------------------------------------------------- */}
      {openStep !== 'ALL' && openStep !== 2 ? (
        // COLLAPSED STEP 2
        <div
          id="module-i-step-2"
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
                  Step 2: The Modern 4Ps Strategy &amp; Channel Distribution Matrix
                </h2>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {step2Data.priceP2.headlinePricePoint ? `${step2Data.priceP2.headlinePricePoint} • ` : ''}
                  {step2Data.promotionP4.primarySocialHub ? `${step2Data.promotionP4.primarySocialHub} • ` : ''}
                  Channel: {DISTRIBUTION_CHANNEL_OPTIONS.find((c) => c.id === step2Data.placeP3.primaryChannel)?.label || 'Direct Web'}
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
                {isStep2Complete ? 'Edit Step' : 'Open Step'}
                <ChevronDown className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // EXPANDED STEP 2
        <Card id="module-i-step-2" className="scroll-mt-24 rounded-xl border border-slate-200 bg-white shadow-xs">
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
                      Step 2: The Modern 4Ps Strategy &amp; Channel Distribution Matrix
                    </CardTitle>
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
                  </div>
                  <CardDescription className="mt-1 text-xs text-slate-600">
                    Align your Product packaging, Pricing narrative, Place (distribution channels), and Promotion (acquisition engine) into an unshakeable commercial engine.
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

            {/* 4-Layer Support Strip: Micro-Coaching, Examples, Open Questions */}
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

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleGenerateAiFourPs}
                disabled={isGeneratingAiStep2}
                className="h-7 border-violet-200 bg-violet-50/60 text-[11px] font-medium text-violet-700 hover:bg-violet-100"
              >
                {isGeneratingAiStep2 ? (
                  <>
                    <RefreshCw className="mr-1 h-3.5 w-3.5 animate-spin" />
                    Synthesizing 4Ps Strategy...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-1 h-3.5 w-3.5 text-violet-600" />
                    Auto-Generate 4Ps with AI
                  </>
                )}
              </Button>
            </div>

            {/* Micro-Coaching Card (Collapsible) */}
            {activeWhyCard === 2 && (
              <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50/70 p-3.5 text-xs text-indigo-900">
                <div className="flex items-start gap-2">
                  <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                  <div className="space-y-1">
                    <p className="font-semibold text-indigo-950">
                      Why does the 4Ps model matter to grant bodies (LEO, Innovate UK) and early investors?
                    </p>
                    <p className="text-indigo-800">
                      Assessors want proof that you have a viable commercial route to market, not just a product idea. Most failed startups build something and then try 5 different channels with no focus or budget. The modern 4Ps strategy forces you to commit to ONE primary beachhead channel, identify your biggest checkout friction point, and articulate why your price is a total bargain compared to the cost of customer inaction.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Example Card (Collapsible) */}
            {activeExampleCard === 2 && (
              <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/70 p-3.5 text-xs text-emerald-950">
                <div className="flex items-start gap-2">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <div className="space-y-2">
                    <p className="font-semibold text-emerald-900">
                      Real-World 4Ps Examples:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                      <div className="rounded border border-emerald-200 bg-white/60 p-2.5">
                        <p className="font-bold text-emerald-900">Example A: B2B SaaS (Startup Preflight)</p>
                        <p className="text-emerald-800 mt-0.5"><strong>Product:</strong> Self-serve cloud workspace with automated compliance checks and exportable briefs.</p>
                        <p className="text-emerald-800"><strong>Price:</strong> €79 one-off pass. Bargain vs. €3,000+ consultant fees.</p>
                        <p className="text-emerald-800"><strong>Place:</strong> Direct Web self-serve. Mitigation: Pre-filled industry benchmarks.</p>
                        <p className="text-emerald-800"><strong>Promotion:</strong> Founder-Led Organic on LinkedIn with weekly teardown posts.</p>
                      </div>
                      <div className="rounded border border-emerald-200 bg-white/60 p-2.5">
                        <p className="font-bold text-emerald-900">Example B: Premium D2C Functional Drink</p>
                        <p className="text-emerald-800 mt-0.5"><strong>Product:</strong> 12-pack functional drink cans with recyclable matte packaging.</p>
                        <p className="text-emerald-800"><strong>Price:</strong> €36/pack (€3/can). Cheaper than daily specialty cafe coffee (€4.50).</p>
                        <p className="text-emerald-800"><strong>Place:</strong> Shopify D2C store + specialty cafes. Mitigation: Free shipping on 2+ packs.</p>
                        <p className="text-emerald-800"><strong>Promotion:</strong> Micro-influencer gifting to 50 CrossFit creators monthly.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Success / Assessor Notification */}
            {aiSuccessMessageStep2 && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs font-medium text-emerald-800">
                <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{aiSuccessMessageStep2}</span>
              </div>
            )}

            {aiAssessorTipStep2 && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-amber-700 shrink-0" />
                  <div>
                    <span className="font-semibold text-amber-950">Commercial Assessor Benchmark: </span>
                    <span className="text-amber-900">{aiAssessorTipStep2}</span>
                  </div>
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-8 pt-6">
            {/* --------------------------------------------------------- */}
            {/* 2.1 PRODUCT (P1)                                          */}
            {/* --------------------------------------------------------- */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Package className="h-4 w-4 text-indigo-600 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    2.1 Product (P1): Packaging Format &amp; Tangible Deliverable
                  </h3>
                  <p className="text-xs text-slate-500">
                    How is your offer packaged, and what concrete deliverable does the customer receive upon purchase?
                  </p>
                </div>
              </div>

              {/* Packaging Selector Tiles */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Select Product Packaging Vehicle
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {PACKAGING_OPTIONS.map((pkg) => {
                    const isSelected = step2Data.productP1.packagingType === pkg.id;
                    return (
                      <div
                        key={pkg.id}
                        onClick={() =>
                          setStep2Data((prev) => ({
                            ...prev,
                            productP1: {
                              ...prev.productP1,
                              packagingType: pkg.id,
                            },
                          }))
                        }
                        className={`cursor-pointer rounded-lg border p-3 text-left transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/40 shadow-xs ring-1 ring-indigo-600'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-semibold ${isSelected ? 'text-indigo-950' : 'text-slate-900'}`}>
                            {pkg.label}
                          </span>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-slate-200 text-slate-600 shrink-0">
                            {pkg.badge}
                          </Badge>
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                          {pkg.description}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Inline "OTHER" Custom Packaging Input */}
                {step2Data.productP1.packagingType === 'OTHER' && (
                  <div className="mt-2.5 rounded-lg border border-indigo-200 bg-indigo-50/40 p-3">
                    <Label className="text-xs font-semibold text-indigo-950">
                      Specify Custom Packaging Format
                    </Label>
                    <Input
                      value={step2Data.productP1.otherPackagingTypeText || ''}
                      onChange={(e) =>
                        setStep2Data((prev) => ({
                          ...prev,
                          productP1: {
                            ...prev.productP1,
                            otherPackagingTypeText: e.target.value,
                          },
                        }))
                      }
                      placeholder="e.g. Hybrid hardware sensor + subscription cloud analytics with SLA support"
                      className="mt-1 text-base sm:text-xs bg-white"
                    />
                    <p className="mt-1 text-[11px] text-slate-500">
                      <strong>Promised Delivery &amp; Reply Speed (SLA):</strong> An SLA (Service Level Agreement) simply means how quickly you promise to deliver an order or reply when a customer has a problem.
                    </p>
                  </div>
                )}
              </div>

              {/* Core Deliverable & Perceived Value Driver */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Core Deliverable Summary (What does the buyer receive Day 1?)
                  </Label>
                  <textarea
                    rows={3}
                    value={step2Data.productP1.coreDeliverableSummary}
                    onChange={(e) =>
                      setStep2Data((prev) => ({
                        ...prev,
                        productP1: {
                          ...prev.productP1,
                          coreDeliverableSummary: e.target.value,
                        },
                      }))
                    }
                    placeholder="e.g. Instant web app login with 3 workflow templates, auto-generated audit report, and founder onboarding checklist."
                    className="w-full rounded-md border border-slate-200 p-2.5 text-base sm:text-xs text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-hidden"
                  />
                  <p className="text-[11px] text-slate-400">
                    Be concrete. Avoid vague marketing buzzwords; tell the buyer exactly what they unlock or open.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Primary Perceived Value Driver (What makes it feel high-ticket?)
                  </Label>
                  <textarea
                    rows={3}
                    value={step2Data.productP1.perceivedValueDriver}
                    onChange={(e) =>
                      setStep2Data((prev) => ({
                        ...prev,
                        productP1: {
                          ...prev.productP1,
                          perceivedValueDriver: e.target.value,
                        },
                      }))
                    }
                    placeholder="e.g. 1-on-1 founder walkthrough call, proprietary benchmark database, and 30-day money-back guarantee."
                    className="w-full rounded-md border border-slate-200 p-2.5 text-base sm:text-xs text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-hidden"
                  />
                  <p className="text-[11px] text-slate-400">
                    The single feature, guarantee, or service touchpoint that creates disproportionate customer delight.
                  </p>
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------- */}
            {/* 2.2 PRICE (P2)                                            */}
            {/* --------------------------------------------------------- */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <DollarSign className="h-4 w-4 text-emerald-600 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    2.2 Price (P2): Strategic Stance &amp; Value Justification
                  </h3>
                  <p className="text-xs text-slate-500">
                    Frame your price against the customer’s cost of inaction, rather than what it costs you to deliver.
                  </p>
                </div>
              </div>

              {/* Pricing Stance Selector */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label className="text-xs font-semibold text-slate-700">
                    Select Pricing Strategy Stance
                  </Label>
                  {plan.moduleHData?.step2PricingTiers?.tiers?.[0] && (
                    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800 text-[10px]">
                      💡 Synced with Module H Revenue: {currencySymbol}
                      {plan.moduleHData.step2PricingTiers.tiers[0].priceGross || plan.moduleHData.step2PricingTiers.tiers[0].priceNetOfTax} / period
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {PRICING_STANCE_OPTIONS.map((stance) => {
                    const isSelected = step2Data.priceP2.pricingStance === stance.id;
                    return (
                      <div
                        key={stance.id}
                        onClick={() =>
                          setStep2Data((prev) => ({
                            ...prev,
                            priceP2: {
                              ...prev.priceP2,
                              pricingStance: stance.id,
                            },
                          }))
                        }
                        className={`cursor-pointer rounded-lg border p-3 text-left transition-all ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-600'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                        }`}
                      >
                        <span className={`text-xs font-semibold ${isSelected ? 'text-emerald-950' : 'text-slate-900'}`}>
                          {stance.label}
                        </span>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                          {stance.description}
                        </p>
                        <p className="mt-1.5 text-[10px] font-medium text-emerald-700">
                          {stance.grantProofInsight}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Inline "OTHER" Custom Pricing Stance */}
                {step2Data.priceP2.pricingStance === 'OTHER' && (
                  <div className="mt-2.5 rounded-lg border border-emerald-200 bg-emerald-50/40 p-3">
                    <Label className="text-xs font-semibold text-emerald-950">
                      Specify Custom Pricing Stance
                    </Label>
                    <Input
                      value={step2Data.priceP2.otherPricingStanceText || ''}
                      onChange={(e) =>
                        setStep2Data((prev) => ({
                          ...prev,
                          priceP2: {
                            ...prev.priceP2,
                            otherPricingStanceText: e.target.value,
                          },
                        }))
                      }
                      placeholder="e.g. 10% performance rev-share on recovered tax credits with zero upfront fee"
                      className="mt-1 text-base sm:text-xs bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Headline Price Point & Payment Terms */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <Label className="text-xs font-semibold text-slate-700">
                      Headline Price Point (Target Customer Price)
                    </Label>
                    {resolvedUpstreamPrice.isFromUpstream && (
                      step2Data.priceP2.headlinePricePoint?.trim() === resolvedUpstreamPrice.priceHeadline ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">
                          <Check className="h-3 w-3" />
                          Synced: {resolvedUpstreamPrice.sourceLabel}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setStep2Data((prev) => ({
                              ...prev,
                              priceP2: {
                                ...prev.priceP2,
                                headlinePricePoint: resolvedUpstreamPrice.priceHeadline,
                              },
                            }))
                          }
                          className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded px-1.5 py-0.5 transition-colors cursor-pointer"
                          title={`Click to sync from ${resolvedUpstreamPrice.sourceLabel}`}
                        >
                          <RefreshCw className="h-2.5 w-2.5" />
                          Sync from {resolvedUpstreamPrice.sourceLabel} ({resolvedUpstreamPrice.priceHeadline})
                        </button>
                      )
                    )}
                  </div>
                  <Input
                    value={step2Data.priceP2.headlinePricePoint}
                    onChange={(e) =>
                      setStep2Data((prev) => ({
                        ...prev,
                        priceP2: {
                          ...prev.priceP2,
                          headlinePricePoint: e.target.value,
                        },
                      }))
                    }
                    placeholder="e.g. €49 / month or £120 / audit"
                    className="text-base sm:text-xs bg-white"
                  />
                  <p className="text-[11px] text-slate-400">
                    The primary commercial price anchor seen on your pricing page or proposal.
                    {resolvedUpstreamPrice.isFromUpstream && (
                      <span className="ml-1 text-slate-500">
                        (Detected from {resolvedUpstreamPrice.sourceLabel})
                      </span>
                    )}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Payment Terms &amp; Friction Reducer
                  </Label>
                  <Input
                    value={step2Data.priceP2.paymentTermsOrFrictionReducer}
                    onChange={(e) =>
                      setStep2Data((prev) => ({
                        ...prev,
                        priceP2: {
                          ...prev.priceP2,
                          paymentTermsOrFrictionReducer: e.target.value,
                        },
                      }))
                    }
                    placeholder="e.g. 14-day free trial no CC, 30-day money-back guarantee, net-30 invoice"
                    className="text-base sm:text-xs bg-white"
                  />
                  <p className="text-[11px] text-slate-400">
                    How do you remove perceived risk from the first transaction?
                  </p>
                </div>
              </div>

              {/* Price Justification vs Cost of Inaction */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Price Justification vs. Cost of Inaction
                </Label>
                <textarea
                  rows={2}
                  value={step2Data.priceP2.priceJustification}
                  onChange={(e) =>
                    setStep2Data((prev) => ({
                      ...prev,
                      priceP2: {
                        ...prev.priceP2,
                        priceJustification: e.target.value,
                      },
                    }))
                  }
                  placeholder="e.g. Doing this manually takes 15 hours of senior executive time (€600+ cost). At €49/month, the customer recovers their investment on day two."
                  className="w-full rounded-md border border-slate-200 p-2.5 text-base sm:text-xs text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-hidden"
                />
                <p className="text-[11px] text-slate-400">
                  Explain why a rational buyer views this price as an absolute bargain compared to the cost of doing nothing.
                </p>
              </div>
            </div>

            {/* --------------------------------------------------------- */}
            {/* 2.3 PLACE (P3)                                            */}
            {/* --------------------------------------------------------- */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Compass className="h-4 w-4 text-blue-600 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    2.3 Place (P3): Primary Channel &amp; Purchase Journey
                  </h3>
                  <p className="text-xs text-slate-500">
                    Where does the transaction happen, and how do you eliminate drop-off friction?
                  </p>
                </div>
              </div>

              {/* Primary Channel Selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Primary Distribution Route
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {DISTRIBUTION_CHANNEL_OPTIONS.map((channel) => {
                    const isSelected = step2Data.placeP3.primaryChannel === channel.id;
                    return (
                      <div
                        key={channel.id}
                        onClick={() =>
                          setStep2Data((prev) => ({
                            ...prev,
                            placeP3: {
                              ...prev.placeP3,
                              primaryChannel: channel.id,
                            },
                          }))
                        }
                        className={`cursor-pointer rounded-lg border p-3 text-left transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/40 shadow-xs ring-1 ring-blue-600'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-semibold ${isSelected ? 'text-blue-950' : 'text-slate-900'}`}>
                            {channel.label}
                          </span>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-slate-200 text-slate-600 shrink-0">
                            {channel.salesCycle}
                          </Badge>
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                          {channel.description}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Inline "OTHER" Custom Channel */}
                {step2Data.placeP3.primaryChannel === 'OTHER' && (
                  <div className="mt-2.5 rounded-lg border border-blue-200 bg-blue-50/40 p-3">
                    <Label className="text-xs font-semibold text-blue-950">
                      Specify Custom Distribution Route
                    </Label>
                    <Input
                      value={step2Data.placeP3.otherPrimaryChannelText || ''}
                      onChange={(e) =>
                        setStep2Data((prev) => ({
                          ...prev,
                          placeP3: {
                            ...prev.placeP3,
                            otherPrimaryChannelText: e.target.value,
                          },
                        }))
                      }
                      placeholder="e.g. Government procurement framework tender or certified wholesale distributor"
                      className="mt-1 text-base sm:text-xs bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Secondary Supporting Channels (Multi-select pills) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Secondary Supporting Channels (Optional)
                </Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'OUTBOUND_DIRECT_SALES', label: 'Direct Outbound Sales' },
                    { id: 'PARTNER_RESELLER_NETWORK', label: 'Partner / Reseller Network' },
                    { id: 'DIRECT_WEB_SELF_SERVE', label: 'Self-Serve Landing Page' },
                    { id: 'MARKETPLACE_APPSTORE', label: 'App Store / Ecosystem' },
                    { id: 'EVENTS_RETAIL_COMMUNITY', label: 'Events & Trade Expos' },
                    { id: 'REFERRAL_NETWORK', label: 'Customer Referral Loops' },
                  ].map((pill) => {
                    const isSelected = step2Data.placeP3.secondaryChannels.includes(pill.id);
                    return (
                      <button
                        key={pill.id}
                        type="button"
                        onClick={() => {
                          const current = step2Data.placeP3.secondaryChannels;
                          const next = isSelected
                            ? current.filter((x) => x !== pill.id)
                            : [...current, pill.id];
                          setStep2Data((prev) => ({
                            ...prev,
                            placeP3: {
                              ...prev.placeP3,
                              secondaryChannels: next,
                            },
                          }));
                        }}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected && <Check className="inline-block mr-1 h-3 w-3" />}
                        {pill.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Friction & Mitigation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Biggest Customer Journey Friction Point (Drop-Off Risk)
                  </Label>
                  <textarea
                    rows={2}
                    value={step2Data.placeP3.customerJourneyFrictionPoint}
                    onChange={(e) =>
                      setStep2Data((prev) => ({
                        ...prev,
                        placeP3: {
                          ...prev.placeP3,
                          customerJourneyFrictionPoint: e.target.value,
                        },
                      }))
                    }
                    placeholder="e.g. Hesitation around connecting their real data, or fear of complex migration effort."
                    className="w-full rounded-md border border-slate-200 p-2.5 text-base sm:text-xs text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-hidden"
                  />
                  <p className="text-[11px] text-slate-400">
                    Where are potential customers most likely to abandon before paying?
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Tactical Friction Mitigation Plan
                  </Label>
                  <textarea
                    rows={2}
                    value={step2Data.placeP3.frictionMitigationPlan}
                    onChange={(e) =>
                      setStep2Data((prev) => ({
                        ...prev,
                        placeP3: {
                          ...prev.placeP3,
                          frictionMitigationPlan: e.target.value,
                        },
                      }))
                    }
                    placeholder="e.g. 1-click sample dataset demo mode, pre-built templates, and personal onboarding assistance."
                    className="w-full rounded-md border border-slate-200 p-2.5 text-base sm:text-xs text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-hidden"
                  />
                  <p className="text-[11px] text-slate-400">
                    The concrete workflow mechanism you implement to remove that friction completely.
                  </p>
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------- */}
            {/* 2.4 PROMOTION (P4)                                        */}
            {/* --------------------------------------------------------- */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Megaphone className="h-4 w-4 text-violet-600 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    2.4 Promotion (P4): The Beachhead Acquisition Engine — Your First Core Customer Group (Who buys first?)
                  </h3>
                  <p className="text-xs text-slate-500">
                    A &ldquo;Beachhead&rdquo; simply means the very first specific group of customers you focus on winning before expanding to everyone else. Commit to ONE primary acquisition engine first.
                  </p>
                </div>
              </div>

              {/* Acquisition Engine Selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Select Primary Beachhead Engine
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {ACQUISITION_ENGINE_OPTIONS.map((engine) => {
                    const isSelected = step2Data.promotionP4.primaryAcquisitionEngine === engine.id;
                    return (
                      <div
                        key={engine.id}
                        onClick={() =>
                          setStep2Data((prev) => ({
                            ...prev,
                            promotionP4: {
                              ...prev.promotionP4,
                              primaryAcquisitionEngine: engine.id,
                            },
                          }))
                        }
                        className={`cursor-pointer rounded-lg border p-3 text-left transition-all ${
                          isSelected
                            ? 'border-violet-600 bg-violet-50/40 shadow-xs ring-1 ring-violet-600'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                        }`}
                      >
                        <span className={`text-xs font-semibold ${isSelected ? 'text-violet-950' : 'text-slate-900'}`}>
                          {engine.label}
                        </span>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                          {engine.description}
                        </p>
                        <p className="mt-1.5 text-[10px] font-medium text-violet-700">
                          Best for: {engine.bestFit}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Inline "OTHER" Custom Acquisition Engine */}
                {step2Data.promotionP4.primaryAcquisitionEngine === 'OTHER' && (
                  <div className="mt-2.5 rounded-lg border border-violet-200 bg-violet-50/40 p-3">
                    <Label className="text-xs font-semibold text-violet-950">
                      Specify Custom Acquisition Engine
                    </Label>
                    <Input
                      value={step2Data.promotionP4.otherAcquisitionEngineText || ''}
                      onChange={(e) =>
                        setStep2Data((prev) => ({
                          ...prev,
                          promotionP4: {
                            ...prev.promotionP4,
                            otherAcquisitionEngineText: e.target.value,
                          },
                        }))
                      }
                      placeholder="e.g. University spinout incubator referrals, viral referral contest, or street canvassing"
                      className="mt-1 text-base sm:text-xs bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Social Hub & Content Hook */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Primary Social / Media Hub
                  </Label>
                  <Input
                    value={step2Data.promotionP4.primarySocialHub}
                    onChange={(e) =>
                      setStep2Data((prev) => ({
                        ...prev,
                        promotionP4: {
                          ...prev.promotionP4,
                          primarySocialHub: e.target.value,
                        },
                      }))
                    }
                    placeholder="e.g. LinkedIn (Founder Profile) or Substack / X or TikTok"
                    className="text-base sm:text-xs bg-white"
                  />
                  <p className="text-[11px] text-slate-400">
                    Where your target buyers actively hang out and consume business insights.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    First Campaign Asset or Content Hook
                  </Label>
                  <Input
                    value={step2Data.promotionP4.contentOrCampaignHook}
                    onChange={(e) =>
                      setStep2Data((prev) => ({
                        ...prev,
                        promotionP4: {
                          ...prev.promotionP4,
                          contentOrCampaignHook: e.target.value,
                        },
                      }))
                    }
                    placeholder="e.g. The 10-Point Startup Preflight Audit: Why 78% of Seed Decks Get Rejected"
                    className="text-base sm:text-xs bg-white"
                  />
                  <p className="text-[11px] text-slate-400">
                    The headline asset, diagnostic checklist, or lead magnet used to start conversations.
                  </p>
                </div>
              </div>

              {/* Beachhead Channel Tactics */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Beachhead Channel Execution Tactics (Weekly Playbook)
                </Label>
                <textarea
                  rows={3}
                  value={step2Data.promotionP4.beachheadChannelTactics}
                  onChange={(e) =>
                    setStep2Data((prev) => ({
                      ...prev,
                      promotionP4: {
                        ...prev.promotionP4,
                        beachheadChannelTactics: e.target.value,
                      },
                    }))
                  }
                  placeholder="e.g. Post 3 practical breakdowns per week on LinkedIn dissecting real founder mistakes; send a personalized message offering our free checklist to anyone who comments."
                  className="w-full rounded-md border border-slate-200 p-2.5 text-base sm:text-xs text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-hidden"
                />
                <p className="text-[11px] text-slate-400">
                  Detail your weekly execution cadence. Consistency on one channel beats sporadic attempts across ten.
                </p>
              </div>
            </div>

            {/* --------------------------------------------------------- */}
            {/* 2.5 DIGITAL PRESENCE READINESS CHECKLIST                  */}
            {/* --------------------------------------------------------- */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Globe className="h-4 w-4 text-teal-600 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    2.5 Day-1 Digital Presence Readiness Checklist
                  </h3>
                  <p className="text-xs text-slate-500">
                    Verify the four foundational digital trust signals before initiating outbound outreach or marketing spend.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    key: 'hasLandingPage' as const,
                    title: 'Live Landing Page / Website',
                    description: 'A focused landing page with clear 3-second hook, value proposition, and call to action.',
                    tip: 'Ensures prospects arriving from outreach find a credible, professional home.',
                  },
                  {
                    key: 'hasDomainEmail' as const,
                    title: 'Official Domain Email (@company.com)',
                    description: 'Official corporate email address configured on your custom domain.',
                    tip: 'Domain emails boost outbound response rates by 300% over generic @gmail addresses.',
                  },
                  {
                    key: 'hasAnalyticsTracking' as const,
                    title: 'Web Analytics & Conversion Tracking',
                    description: 'Privacy-friendly analytics installed (PostHog, Plausible, or GA4) to track signups.',
                    tip: 'Assessors love knowing you measure funnel conversion from day one.',
                  },
                  {
                    key: 'hasSocialProofOrWaitlist' as const,
                    title: 'Customer Waitlist or Social Proof',
                    description: 'Waitlist counter, survey quotes, or customer logo proof visible on your site.',
                    tip: 'De-risks customer hesitation by showing other early adopters are already onboard.',
                  },
                ].map((item) => {
                  const isChecked = step2Data.digitalPresenceChecklist[item.key];
                  return (
                    <div
                      key={item.key}
                      onClick={() =>
                        setStep2Data((prev) => ({
                          ...prev,
                          digitalPresenceChecklist: {
                            ...prev.digitalPresenceChecklist,
                            [item.key]: !isChecked,
                          },
                        }))
                      }
                      className={`cursor-pointer rounded-lg border p-3.5 transition-all ${
                        isChecked
                          ? 'border-teal-300 bg-teal-50/40 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5">
                          {isChecked ? (
                            <CheckSquare className="h-4 w-4 text-teal-600 shrink-0" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-400 shrink-0" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-bold ${isChecked ? 'text-teal-950' : 'text-slate-900'}`}>
                            {item.title}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            {item.description}
                          </p>
                          <p className="mt-1 text-[10px] text-teal-700 font-medium">
                            💡 {item.tip}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Strategic Rationale Review Callout */}
            {step2Data.strategicRationale && (
              <div className="rounded-lg border border-violet-200 bg-violet-50/50 p-3.5 text-xs text-violet-950">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-violet-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">AI Strategic Commercial Rationale: </span>
                    <span className="text-violet-900">{step2Data.strategicRationale}</span>
                  </div>
                </div>
              </div>
            )}

            {/* --------------------------------------------------------- */}
            {/* 2.6 MOMENTUM PROTECTION: PARK IN OPEN QUESTIONS           */}
            {/* --------------------------------------------------------- */}
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <Bookmark className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                  <div>
                    <p className="text-xs font-semibold text-amber-950">
                      Unsure about your pricing tier or distribution route? Don&apos;t get stuck.
                    </p>
                    <p className="mt-0.5 text-[11px] text-amber-800">
                      Park any unresolved questions (e.g. &quot;Should our enterprise tier be €99 or €149?&quot;) in your Open Questions Parking Lot so you can keep moving forward.
                    </p>
                  </div>
                </div>
                {parkingSuccessStep2 && (
                  <Badge className="bg-emerald-600 text-[10px] text-white shrink-0">
                    <Check className="mr-1 h-3 w-3" /> Question Parked!
                  </Badge>
                )}
              </div>

              <div className="mt-2.5 flex items-center gap-2">
                <Input
                  value={parkingQuestionTextStep2}
                  onChange={(e) => setParkingQuestionTextStep2(e.target.value)}
                  placeholder="e.g. Should we offer an annual prepayment discount of 20% or 30%?"
                  className="text-base sm:text-xs bg-white flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleParkStep2Question}
                  disabled={!parkingQuestionTextStep2.trim() || isParkingQuestionStep2}
                  className="border-amber-300 bg-white text-xs font-medium text-amber-900 hover:bg-amber-100 shrink-0"
                >
                  {isParkingQuestionStep2 ? (
                    <RefreshCw className="mr-1 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Bookmark className="mr-1 h-3.5 w-3.5" />
                  )}
                  Park in Open Questions
                </Button>
              </div>
            </div>

            {/* Bottom Step Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveStep2}
                  disabled={saveStatusStep2 === 'saving' || isVaultReadonly}
                  className="bg-indigo-600 text-xs font-medium text-white hover:bg-indigo-700"
                >
                  {saveStatusStep2 === 'saving' ? (
                    <>
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Saving Step 2...
                    </>
                  ) : saveStatusStep2 === 'saved' ? (
                    <>
                      <Check className="mr-1.5 h-3.5 w-3.5" />
                      Saved!
                    </>
                  ) : (
                    'Save Step 2'
                  )}
                </Button>
                {saveStatusStep2 === 'error' && (
                  <span className="text-xs text-rose-600">Failed to save. Please try again.</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await handleSaveStep2();
                    setOpenStep(3);
                    window.scrollTo({ top: 400, behavior: 'smooth' });
                  }}
                  className="border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Next Step: First 10 Playbook
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STEP 3: THE "FIRST 10 CUSTOMERS" PLAYBOOK                     */}
      {/* ------------------------------------------------------------- */}
      {openStep !== 'ALL' && openStep !== 3 ? (
        // COLLAPSED STEP 3
        <div
          id="module-i-step-3"
          onClick={() => setOpenStep(3)}
          className="group scroll-mt-24 cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  isStep3Complete ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
                }`}
              >
                {isStep3Complete ? <Check className="h-4 w-4" /> : '3'}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                  Step 3: The &quot;First 10 Customers&quot; Playbook &amp; Day-1 Hustle CRM
                </h2>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  Archetype: {ARCHETYPE_OPTIONS.find((a) => a.id === step3Data.acquisitionArchetype)?.label || 'Outbound'} • {step3Data.targetPipeline.length} Pipeline Prospects • LOI Generator Ready
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Badge
                variant={isStep3Complete ? 'default' : 'outline'}
                className={`text-[10px] shrink-0 ${
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
        <Card id="module-i-step-3" className="scroll-mt-24 rounded-xl border border-slate-200 bg-white shadow-xs">
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
                      Step 3: The &quot;First 10 Customers&quot; Playbook &amp; Day-1 Hustle CRM
                    </CardTitle>
                    <Badge
                      variant={isStep3Complete ? 'default' : 'outline'}
                      className={`text-[10px] shrink-0 ${
                        isStep3Complete
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'border-slate-300 text-slate-600'
                      }`}
                    >
                      {isStep3Complete ? 'Completed' : 'In Progress'}
                    </Badge>
                  </div>
                  <CardDescription className="mt-1 text-xs text-slate-600">
                    Secure your first 10 referenceable customers manually (&quot;doing things that don&#39;t scale&quot;), deploy warm outreach scripts, bust early objections, and generate non-binding Letters of Intent (LOIs) for Irish LEO and UK Innovate UK grant evaluators.
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

            {/* 4-Layer Support Strip: Micro-Coaching, Examples, Open Questions */}
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

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleGenerateAiFirst10}
                disabled={isGeneratingAiStep3 || isVaultReadonly}
                className="h-7 border-violet-200 bg-violet-50/60 text-[11px] font-medium text-violet-700 hover:bg-violet-100"
              >
                {isGeneratingAiStep3 ? (
                  <>
                    <RefreshCw className="mr-1 h-3.5 w-3.5 animate-spin" />
                    Synthesizing First 10 Playbook...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-1 h-3.5 w-3.5" />
                    Auto-Generate Playbook with AI
                  </>
                )}
              </Button>
            </div>

            {/* Micro-Coaching: Why Are We Asking This? */}
            {activeWhyCard === 3 && (
              <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50/70 p-3.5 text-xs text-indigo-900">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                    <div className="space-y-1">
                      <p className="font-semibold text-indigo-950">
                        Why the First 10 Customers Matter (More Than 10,000 Social Followers)
                      </p>
                      <p className="text-indigo-800">
                        Paul Graham famously noted that the best startups always <strong>&quot;do things that don&#39;t scale&quot;</strong> in the early days. You do not win your first 10 paying customers with generic Facebook ads or automated blasts; you win them through obsessive founder hustle, high-touch consultation, and customized problem-solving.
                      </p>
                      <p className="text-indigo-800">
                        <strong>Irish LEO &amp; UK Innovate UK assessors:</strong> Every experienced grant evaluator knows that early product ideas are easy to invent. What separates a funded venture from a rejected one is <em>commercial evidence</em>. Showing a structured list of 10 named targets, personalized outreach hooks, and a signed non-binding Letter of Intent (LOI) proves that real humans are waiting to buy your solution.
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

            {/* Micro-Coaching: Show Me an Example */}
            {activeExampleCard === 3 && (
              <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/70 p-3.5 text-xs text-emerald-950">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <div className="space-y-1">
                      <p className="font-semibold text-emerald-900">
                        Example: How a B2B SaaS Secured 10 Pilot Customers in 30 Days
                      </p>
                      <p className="text-emerald-800">
                        <strong>Archetype Used:</strong> Account-Based Sniper Outbound with a Free 3-Minute Teardown.
                      </p>
                      <p className="text-emerald-800">
                        <strong>The Outreach:</strong> The founder picked 30 target operations directors on LinkedIn. Instead of asking for a sales demo, they recorded a 2-minute Loom pointing out a workflow flaw on the prospect&#39;s publicly visible process and asked: <em>&quot;We built a script that automates this—would you be open to a 60-day pilot for 50% off in exchange for a case study if we save you 5 hours a week?&quot;</em>
                      </p>
                      <p className="text-emerald-800">
                        <strong>The Result:</strong> 11 replied, 7 agreed to a call, and 4 signed a 1-page non-binding Pilot LOI. The founder attached those 4 LOIs to their Enterprise Ireland / LEO application and secured the full €50,000 feasibility grant.
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

            {/* AI Success Notification */}
            {aiSuccessMessageStep3 && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs font-medium text-emerald-800">
                <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{aiSuccessMessageStep3}</span>
              </div>
            )}

            {/* AI Assessor Insight Tip */}
            {aiAssessorTipStep3 && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-amber-700 shrink-0" />
                  <div>
                    <span className="font-semibold text-amber-950">Grant Assessor Alignment: </span>
                    <span className="text-amber-900">{aiAssessorTipStep3}</span>
                  </div>
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-8 pt-6">
            {/* --------------------------------------------------------- */}
            {/* 3.0: MODULE C LEAD HARVESTING BRIDGE                      */}
            {/* --------------------------------------------------------- */}
            <div className="rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/50 via-white to-violet-50/50 p-4.5 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-indigo-600 shrink-0" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Module C Validation Bridge: Harvest Discovery Leads
                    </h3>
                    <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-[10px] text-indigo-700">
                      Connected to Module C
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600">
                    Pull warm waitlist signups and customer discovery interviewees directly into your Dream 10 execution pipeline.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {moduleCStats.hasHarvestableLeads ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleHarvestModuleCLeads}
                      disabled={isHarvestingLeads || isVaultReadonly}
                      className="bg-indigo-600 text-white hover:bg-indigo-700 text-xs h-8 px-3"
                    >
                      {isHarvestingLeads ? (
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Users className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      Import {moduleCStats.totalWaitlistLeads + moduleCStats.highIntentInterviews.length} Module C Contacts
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onNavigateToModule?.('MOD_C_SURVEYS_FEEDBACK')}
                      className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs h-8 px-3"
                    >
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                      Launch Module C Survey &amp; Waitlist
                    </Button>
                  )}
                </div>
              </div>

              {/* Status metrics bar */}
              <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-3 border-t border-indigo-100/60 text-xs">
                <div className="rounded-lg bg-white/80 p-2 border border-indigo-50">
                  <span className="text-[11px] text-slate-500">Live Surveys</span>
                  <div className="text-sm font-bold text-slate-900">{moduleCStats.totalSurveys}</div>
                </div>
                <div className="rounded-lg bg-white/80 p-2 border border-indigo-50">
                  <span className="text-[11px] text-slate-500">Waitlist Signups</span>
                  <div className="text-sm font-bold text-indigo-600">{moduleCStats.totalWaitlistLeads}</div>
                </div>
                <div className="rounded-lg bg-white/80 p-2 border border-indigo-50">
                  <span className="text-[11px] text-slate-500">Discovery Interviews</span>
                  <div className="text-sm font-bold text-slate-900">{moduleCStats.totalInterviews}</div>
                </div>
                <div className="rounded-lg bg-white/80 p-2 border border-indigo-50">
                  <span className="text-[11px] text-slate-500">High-Intent Leads</span>
                  <div className="text-sm font-bold text-emerald-600">{moduleCStats.highIntentInterviews.length}</div>
                </div>
              </div>

              {harvestSuccessMessage && (
                <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{harvestSuccessMessage}</span>
                </div>
              )}
            </div>

            {/* --------------------------------------------------------- */}
            {/* 3.1: FIRST 10 ACQUISITION ARCHETYPE                       */}
            {/* --------------------------------------------------------- */}
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    3.1 Choose Your First 10 Customer Acquisition Archetype
                  </h3>
                </div>
                <p className="text-xs text-slate-600">
                  Select the primary day-1 activation motion best suited to your founder background and customer buying habits.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {ARCHETYPE_OPTIONS.map((opt) => {
                  const isSelected = step3Data.acquisitionArchetype === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => {
                        if (!isVaultReadonly) {
                          setStep3Data((prev) => ({
                            ...prev,
                            acquisitionArchetype: opt.id,
                          }));
                        }
                      }}
                      className={`cursor-pointer rounded-xl border p-4 transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-500'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900">{opt.label}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isSelected && (
                            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-white">
                              <Check className="h-2.5 w-2.5" />
                            </div>
                          )}
                          <Badge
                            variant="secondary"
                            className={`text-[9px] px-1.5 py-0.5 shrink-0 ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {opt.badge}
                          </Badge>
                        </div>
                      </div>
                      <p className="mt-1.5 text-[11px] text-slate-600 leading-snug">
                        {opt.description}
                      </p>
                      <div className="mt-2.5 border-t border-slate-100 pt-2 space-y-1">
                        <div className="text-[10px] text-slate-500">
                          <span className="font-semibold text-slate-700">Best for: </span>
                          {opt.bestFit}
                        </div>
                        <div className="text-[10px] text-indigo-700">
                          <span className="font-semibold">Grant Proof: </span>
                          {opt.grantAssessorProof}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Edge-Case "OTHER" input (Strict GEMINI.md Rule 1.5) */}
              {step3Data.acquisitionArchetype === 'OTHER' && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-2">
                  <Label className="text-xs font-bold text-slate-900">
                    Describe Your Custom Customer Acquisition Archetype
                  </Label>
                  <Input
                    type="text"
                    value={step3Data.otherAcquisitionArchetypeText || ''}
                    onChange={(e) =>
                      setStep3Data((prev) => ({
                        ...prev,
                        otherAcquisitionArchetypeText: e.target.value,
                      }))
                    }
                    placeholder="e.g. University lab spinout research partners, exclusive medical clinic network..."
                    disabled={isVaultReadonly}
                    className="h-9 bg-white text-base sm:text-xs"
                  />
                </div>
              )}

              {/* Rationale */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-900">
                  Strategic Rationale for This Archetype
                </Label>
                <textarea
                  value={step3Data.strategicRationale || ''}
                  onChange={(e) =>
                    setStep3Data((prev) => ({
                      ...prev,
                      strategicRationale: e.target.value,
                    }))
                  }
                  rows={2}
                  disabled={isVaultReadonly}
                  placeholder="Explain why this approach is the fastest and least risky path to 10 customers..."
                  className="w-full rounded-md border border-slate-300 p-2.5 text-base sm:text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* --------------------------------------------------------- */}
            {/* 3.2: IRRESISTIBLE PILOT OFFER & RISK REVERSAL             */}
            {/* --------------------------------------------------------- */}
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Handshake className="h-4 w-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    3.2 Craft Your Irresistible Pilot Offer &amp; Risk Reversal
                  </h3>
                </div>
                <p className="text-xs text-slate-600">
                  Early customers are taking a chance on an unproven startup. Structure an irresistible quid-pro-quo pilot offer that makes saying &quot;no&quot; feel irrational.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-900">
                      Headline Commercial Price Point
                    </Label>
                    <span className="text-[10px] text-indigo-600 font-medium">
                      Synced from Step 2 / Upstream
                    </span>
                  </div>
                  <Input
                    type="text"
                    value={step3Data.letterOfIntent.pilotPricePoint}
                    onChange={(e) =>
                      setStep3Data((prev) => ({
                        ...prev,
                        letterOfIntent: {
                          ...prev.letterOfIntent,
                          pilotPricePoint: e.target.value,
                        },
                      }))
                    }
                    placeholder="e.g. €99 / month or €1,500 one-off"
                    disabled={isVaultReadonly}
                    className="h-9 text-base sm:text-xs"
                  />
                  <p className="text-[11px] text-slate-500">
                    Anchors the full commercial price before any founding pilot discount is applied.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-900">
                    Pilot Structure &amp; Founding Discount
                  </Label>
                  <Input
                    type="text"
                    value={step3Data.pilotOffer.pilotStructure}
                    onChange={(e) =>
                      setStep3Data((prev) => ({
                        ...prev,
                        pilotOffer: {
                          ...prev.pilotOffer,
                          pilotStructure: e.target.value,
                        },
                      }))
                    }
                    placeholder="e.g. 50% discount for first 90 days, or free 30-day proof-of-concept"
                    disabled={isVaultReadonly}
                    className="h-9 text-base sm:text-xs"
                  />
                  <p className="text-[11px] text-slate-500">
                    The financial concession offered in exchange for their early commitment.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-900">
                    The Quid-Pro-Quo Founder Ask
                  </Label>
                  <Input
                    type="text"
                    value={step3Data.pilotOffer.quidProQuoFounderAsk}
                    onChange={(e) =>
                      setStep3Data((prev) => ({
                        ...prev,
                        pilotOffer: {
                          ...prev.pilotOffer,
                          quidProQuoFounderAsk: e.target.value,
                        },
                      }))
                    }
                    placeholder="e.g. Bi-weekly 30-min feedback call + named logo permission upon hitting KPI"
                    disabled={isVaultReadonly}
                    className="h-9 text-base sm:text-xs"
                  />
                  <p className="text-[11px] text-slate-500">
                    What you demand in return: customer feedback, case studies, and reference calls.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-900">
                    Skin-in-the-Game Risk Reversal Guarantee
                  </Label>
                  <Input
                    type="text"
                    value={step3Data.pilotOffer.riskReversal}
                    onChange={(e) =>
                      setStep3Data((prev) => ({
                        ...prev,
                        pilotOffer: {
                          ...prev.pilotOffer,
                          riskReversal: e.target.value,
                        },
                      }))
                    }
                    placeholder="e.g. 100% money-back guarantee if KPI is not achieved within 30 days"
                    disabled={isVaultReadonly}
                    className="h-9 text-base sm:text-xs"
                  />
                  <p className="text-[11px] text-slate-500">
                    Completely eliminates perceived vendor adoption risk for early decision-makers.
                  </p>
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------- */}
            {/* 3.3: THE "DREAM 10" TARGET CUSTOMER PIPELINE TRACKER       */}
            {/* --------------------------------------------------------- */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      3.3 The &quot;Dream 10&quot; Target Customer Pipeline Tracker
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600">
                    Name 10 specific companies or individual early adopters you will personally contact. Track their journey from identified to signed pilot.
                  </p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddProspect}
                  disabled={isVaultReadonly}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 px-3 shrink-0"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add Target Prospect
                </Button>
              </div>

              {/* Pipeline summary counts */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                <div className="rounded-lg bg-slate-50 p-2 border border-slate-200">
                  <span className="text-[10px] text-slate-500">Total Pipeline</span>
                  <div className="text-sm font-bold text-slate-900">{step3Data.targetPipeline.length}</div>
                </div>
                <div className="rounded-lg bg-blue-50/70 p-2 border border-blue-200">
                  <span className="text-[10px] text-blue-700">Outreach Sent</span>
                  <div className="text-sm font-bold text-blue-900">
                    {step3Data.targetPipeline.filter((p) => p.status === 'CONTACTED').length}
                  </div>
                </div>
                <div className="rounded-lg bg-amber-50/70 p-2 border border-amber-200">
                  <span className="text-[10px] text-amber-700">Meeting Set</span>
                  <div className="text-sm font-bold text-amber-900">
                    {step3Data.targetPipeline.filter((p) => p.status === 'MEETING_SET').length}
                  </div>
                </div>
                <div className="rounded-lg bg-indigo-50/70 p-2 border border-indigo-200">
                  <span className="text-[10px] text-indigo-700">Pilot Agreed (LOI)</span>
                  <div className="text-sm font-bold text-indigo-900">
                    {step3Data.targetPipeline.filter((p) => p.status === 'PILOT_AGREED').length}
                  </div>
                </div>
                <div className="rounded-lg bg-emerald-50/70 p-2 border border-emerald-200">
                  <span className="text-[10px] text-emerald-700">Converted Paid</span>
                  <div className="text-sm font-bold text-emerald-900">
                    {step3Data.targetPipeline.filter((p) => p.status === 'CONVERTED_PAID').length}
                  </div>
                </div>
              </div>

              {/* Prospects list / cards */}
              <div className="space-y-3">
                {step3Data.targetPipeline.map((prospect, idx) => {
                  const statusConf = PIPELINE_STATUS_CONFIG[prospect.status] || PIPELINE_STATUS_CONFIG.TO_CONTACT;
                  return (
                    <div
                      key={prospect.id}
                      className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs hover:border-slate-300 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {prospect.companyOrPersona || `Target Prospect #${idx + 1}`}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Status selector */}
                          <select
                            value={prospect.status}
                            onChange={(e) =>
                              handleUpdateProspect(prospect.id, {
                                status: e.target.value as PipelineProspectStatus,
                              })
                            }
                            disabled={isVaultReadonly}
                            className={`rounded-md border px-2 py-1 text-[11px] font-semibold focus:outline-hidden ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}
                          >
                            <option value="TO_CONTACT">To Contact</option>
                            <option value="CONTACTED">Outreach Sent</option>
                            <option value="MEETING_SET">Meeting Set</option>
                            <option value="PILOT_AGREED">Pilot Agreed (LOI)</option>
                            <option value="CONVERTED_PAID">Converted Paid</option>
                            <option value="DISQUALIFIED">Disqualified / Lost</option>
                          </select>

                          {/* Source selector */}
                          <select
                            value={prospect.source}
                            onChange={(e) =>
                              handleUpdateProspect(prospect.id, {
                                source: e.target.value as any,
                              })
                            }
                            disabled={isVaultReadonly}
                            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-600 focus:outline-hidden"
                          >
                            <option value="MANUAL">Manual Addition</option>
                            <option value="MODULE_C_WAITLIST">Module C Waitlist</option>
                            <option value="MODULE_C_INTERVIEW">Module C Interview</option>
                            <option value="MODULE_C_SURVEY">Module C Survey</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => handleDeleteProspect(prospect.id)}
                            disabled={isVaultReadonly}
                            className="text-slate-400 hover:text-rose-600 p-1"
                            title="Remove prospect"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <Label className="text-[10px] font-medium text-slate-500">
                            Target Company / Customer Persona
                          </Label>
                          <Input
                            type="text"
                            value={prospect.companyOrPersona}
                            onChange={(e) =>
                              handleUpdateProspect(prospect.id, {
                                companyOrPersona: e.target.value,
                              })
                            }
                            placeholder="e.g. Acme Tech Ltd or Independent Boutique Gyms"
                            disabled={isVaultReadonly}
                            className="h-8 text-base sm:text-xs mt-0.5"
                          />
                        </div>

                        <div>
                          <Label className="text-[10px] font-medium text-slate-500">
                            Decision Maker Title / Contact
                          </Label>
                          <Input
                            type="text"
                            value={prospect.decisionMakerTitle || ''}
                            onChange={(e) =>
                              handleUpdateProspect(prospect.id, {
                                decisionMakerTitle: e.target.value,
                              })
                            }
                            placeholder="e.g. John Doe (Head of Operations / Founder)"
                            disabled={isVaultReadonly}
                            className="h-8 text-base sm:text-xs mt-0.5"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <Label className="text-[10px] font-medium text-slate-500">
                            Why Them? (Trigger Event / Wedge Angle)
                          </Label>
                          <Input
                            type="text"
                            value={prospect.triggerEventOrAngle}
                            onChange={(e) =>
                              handleUpdateProspect(prospect.id, {
                                triggerEventOrAngle: e.target.value,
                              })
                            }
                            placeholder="e.g. Hired 3 SDRs last month, expressed friction on LinkedIn..."
                            disabled={isVaultReadonly}
                            className="h-8 text-base sm:text-xs mt-0.5"
                          />
                        </div>

                        <div>
                          <Label className="text-[10px] font-medium text-slate-500">
                            Latest Conversation Notes / Next Step
                          </Label>
                          <Input
                            type="text"
                            value={prospect.notes || ''}
                            onChange={(e) =>
                              handleUpdateProspect(prospect.id, {
                                notes: e.target.value,
                              })
                            }
                            placeholder="e.g. Sent video teardown on Tuesday; follow-up scheduled for Friday"
                            disabled={isVaultReadonly}
                            className="h-8 text-base sm:text-xs mt-0.5"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* --------------------------------------------------------- */}
            {/* 3.4: COLD & WARM OUTREACH SCRIPT ENGINE                   */}
            {/* --------------------------------------------------------- */}
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    3.4 Cold &amp; Warm Outreach Script Engine (3 High-Converting Approaches)
                  </h3>
                </div>
                <p className="text-xs text-slate-600">
                  Switch between 3 battle-tested outreach frameworks. Personalize the tokens and copy directly into your email or LinkedIn messenger.
                </p>
              </div>

              {/* Approach Selector Tabs */}
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveOutreachTab('APPROACH_A')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    activeOutreachTab === 'APPROACH_A'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Approach A: Advisory &amp; Co-Design
                </button>
                <button
                  type="button"
                  onClick={() => setActiveOutreachTab('APPROACH_B')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    activeOutreachTab === 'APPROACH_B'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Approach B: Sniper Teardown / Free Audit
                </button>
                <button
                  type="button"
                  onClick={() => setActiveOutreachTab('APPROACH_C')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    activeOutreachTab === 'APPROACH_C'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Approach C: 10-Seat Founding Cohort
                </button>
              </div>

              {/* Tab Content */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-indigo-300 bg-indigo-50 text-[10px] text-indigo-700">
                      {activeOutreachTab === 'APPROACH_A' && 'Zero Sales Pitch • High Ego Appeal'}
                      {activeOutreachTab === 'APPROACH_B' && 'Upfront Value Proof • 3-Min Video/PDF'}
                      {activeOutreachTab === 'APPROACH_C' && 'Artificial Scarcity • Founder Access'}
                    </Badge>
                    <span className="text-[11px] text-slate-500">
                      Tokens available: <code className="bg-slate-200 px-1 py-0.5 rounded text-[10px]">&#123;&#123;FirstName&#125;&#125;</code>, <code className="bg-slate-200 px-1 py-0.5 rounded text-[10px]">&#123;&#123;Company&#125;&#125;</code>
                    </span>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const textToCopy =
                        activeOutreachTab === 'APPROACH_A'
                          ? step3Data.outreachScripts.advisoryScript
                          : activeOutreachTab === 'APPROACH_B'
                          ? step3Data.outreachScripts.sniperScript
                          : step3Data.outreachScripts.foundingCohortScript;
                      handleCopyText(textToCopy, activeOutreachTab);
                    }}
                    className="h-7 text-xs border-slate-300 hover:bg-white"
                  >
                    {copiedScriptKey === activeOutreachTab ? (
                      <>
                        <Check className="mr-1 h-3.5 w-3.5 text-emerald-600" />
                        Copied to Clipboard!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1 h-3.5 w-3.5 text-slate-600" />
                        Copy Script
                      </>
                    )}
                  </Button>
                </div>

                {activeOutreachTab === 'APPROACH_A' && (
                  <textarea
                    value={step3Data.outreachScripts.advisoryScript}
                    onChange={(e) =>
                      setStep3Data((prev) => ({
                        ...prev,
                        outreachScripts: {
                          ...prev.outreachScripts,
                          advisoryScript: e.target.value,
                        },
                      }))
                    }
                    rows={8}
                    disabled={isVaultReadonly}
                    className="w-full rounded-md border border-slate-300 bg-white p-3 font-mono text-base sm:text-xs text-slate-900 leading-relaxed focus:border-indigo-500 focus:outline-hidden"
                  />
                )}

                {activeOutreachTab === 'APPROACH_B' && (
                  <textarea
                    value={step3Data.outreachScripts.sniperScript}
                    onChange={(e) =>
                      setStep3Data((prev) => ({
                        ...prev,
                        outreachScripts: {
                          ...prev.outreachScripts,
                          sniperScript: e.target.value,
                        },
                      }))
                    }
                    rows={8}
                    disabled={isVaultReadonly}
                    className="w-full rounded-md border border-slate-300 bg-white p-3 font-mono text-base sm:text-xs text-slate-900 leading-relaxed focus:border-indigo-500 focus:outline-hidden"
                  />
                )}

                {activeOutreachTab === 'APPROACH_C' && (
                  <textarea
                    value={step3Data.outreachScripts.foundingCohortScript}
                    onChange={(e) =>
                      setStep3Data((prev) => ({
                        ...prev,
                        outreachScripts: {
                          ...prev.outreachScripts,
                          foundingCohortScript: e.target.value,
                        },
                      }))
                    }
                    rows={8}
                    disabled={isVaultReadonly}
                    className="w-full rounded-md border border-slate-300 bg-white p-3 font-mono text-base sm:text-xs text-slate-900 leading-relaxed focus:border-indigo-500 focus:outline-hidden"
                  />
                )}
              </div>
            </div>

            {/* --------------------------------------------------------- */}
            {/* 3.5: 4-TOUCH FOLLOW-UP CADENCE & POLITE BREAKUP EMAIL     */}
            {/* --------------------------------------------------------- */}
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    3.5 The 4-Touch Follow-Up Cadence &amp; Polite Breakup Email
                  </h3>
                </div>
                <p className="text-xs text-slate-600">
                  Over 70% of pilot deals close on the 3rd or 4th touch. Never badger—follow up with genuine value bumps, concluding with the famous &quot;polite breakup email&quot;.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-900">Touch 1: Day 1</span>
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0.5">Icebreaker</Badge>
                  </div>
                  <textarea
                    value={step3Data.followUpCadence.day1Icebreaker}
                    onChange={(e) =>
                      setStep3Data((prev) => ({
                        ...prev,
                        followUpCadence: {
                          ...prev.followUpCadence,
                          day1Icebreaker: e.target.value,
                        },
                      }))
                    }
                    rows={4}
                    disabled={isVaultReadonly}
                    placeholder="Short 2-sentence icebreaker mentioning specific trigger event..."
                    className="w-full rounded-md border border-slate-200 p-2 text-base sm:text-xs text-slate-800 leading-snug focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-900">Touch 2: Day 4</span>
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0.5">Value Bump</Badge>
                  </div>
                  <textarea
                    value={step3Data.followUpCadence.day4Bump}
                    onChange={(e) =>
                      setStep3Data((prev) => ({
                        ...prev,
                        followUpCadence: {
                          ...prev.followUpCadence,
                          day4Bump: e.target.value,
                        },
                      }))
                    }
                    rows={4}
                    disabled={isVaultReadonly}
                    placeholder="Sharing a 1-page benchmark or teardown insight with zero sales ask..."
                    className="w-full rounded-md border border-slate-200 p-2 text-base sm:text-xs text-slate-800 leading-snug focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-900">Touch 3: Day 8</span>
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0.5">Micro-Question</Badge>
                  </div>
                  <textarea
                    value={step3Data.followUpCadence.day8MicroQuestion}
                    onChange={(e) =>
                      setStep3Data((prev) => ({
                        ...prev,
                        followUpCadence: {
                          ...prev.followUpCadence,
                          day8MicroQuestion: e.target.value,
                        },
                      }))
                    }
                    rows={4}
                    disabled={isVaultReadonly}
                    placeholder="Low-friction single-line question (e.g. 'Is this even a priority for Q1?')..."
                    className="w-full rounded-md border border-slate-200 p-2 text-base sm:text-xs text-slate-800 leading-snug focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-900">Touch 4: Day 14</span>
                    <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-[9px] px-1.5 py-0.5">Breakup</Badge>
                  </div>
                  <textarea
                    value={step3Data.followUpCadence.day14Breakup}
                    onChange={(e) =>
                      setStep3Data((prev) => ({
                        ...prev,
                        followUpCadence: {
                          ...prev.followUpCadence,
                          day14Breakup: e.target.value,
                        },
                      }))
                    }
                    rows={4}
                    disabled={isVaultReadonly}
                    placeholder="Permission to close their file..."
                    className="w-full rounded-md border border-slate-200 p-2 text-base sm:text-xs text-slate-800 leading-snug focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Polite Breakup Highlight Card */}
              <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50/60 via-white to-amber-50/40 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-amber-600" />
                    <span className="text-xs font-bold text-slate-900">
                      The Polite Breakup Email Template (Generates 30%+ Response Rates)
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      handleCopyText(step3Data.followUpCadence.day14Breakup, 'BREAKUP');
                    }}
                    className="h-7 text-xs border-amber-300 hover:bg-amber-100/50"
                  >
                    {copiedScriptKey === 'BREAKUP' ? (
                      <>
                        <Check className="mr-1 h-3.5 w-3.5 text-emerald-600" />
                        Copied Breakup Email!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1 h-3.5 w-3.5 text-amber-700" />
                        Copy Breakup Email
                      </>
                    )}
                  </Button>
                </div>

                <div>
                  <Label className="text-[10px] font-medium text-slate-500">
                    Full Breakup Script (Ready to Copy &amp; Send)
                  </Label>
                  <textarea
                    value={step3Data.followUpCadence.day14Breakup}
                    onChange={(e) =>
                      setStep3Data((prev) => ({
                        ...prev,
                        followUpCadence: {
                          ...prev.followUpCadence,
                          day14Breakup: e.target.value,
                        },
                      }))
                    }
                    rows={4}
                    disabled={isVaultReadonly}
                    className="w-full mt-1 rounded-md border border-slate-300 bg-white p-2.5 font-mono text-base sm:text-xs text-slate-900 leading-relaxed focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------- */}
            {/* 3.6: TOP 3 EARLY-STAGE OBJECTION BUSTERS                  */}
            {/* --------------------------------------------------------- */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      3.6 Top 3 Early-Stage Objection Busters &amp; Rebuttals
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600">
                    Pre-scripted, highly persuasive rebuttals to the 3 most common early-stage friction points tailored to your venture.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateAllObjections}
                  disabled={isGeneratingObjections || isVaultReadonly}
                  className="h-8 gap-1.5 border-indigo-200 bg-indigo-50/60 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 shrink-0"
                >
                  {isGeneratingObjections ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                      <span>Generating Objections...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                      <span>✨ AI Suggest Objections &amp; Rebuttals</span>
                    </>
                  )}
                </Button>
              </div>

              {objectionSuccessMessage && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                  {objectionSuccessMessage}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
                {/* Objection 1: Vendor Longevity */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs hover:border-rose-200 transition-colors">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600" />
                      <Badge variant="outline" className="border-rose-200 bg-rose-50 text-[10px] font-semibold text-rose-700">
                        Friction #1: Trust &amp; Risk
                      </Badge>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleGenerateSingleRebuttal(1)}
                      disabled={generatingSingleRebuttalIndex === 1 || isVaultReadonly}
                      className="h-6 px-2 text-[10px] font-medium text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 shrink-0 gap-1"
                    >
                      {generatingSingleRebuttalIndex === 1 ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin text-indigo-600" />
                          <span>Suggesting...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3 text-indigo-600" />
                          <span>Suggest Rebuttal</span>
                        </>
                      )}
                    </Button>
                  </div>

                  <div>
                    <Label className="text-[10px] font-medium text-slate-500">
                      Objection Category / Theme
                    </Label>
                    <Input
                      value={step3Data.objectionBusters.objection1Title || '1. Vendor Longevity & Credibility Risk'}
                      onChange={(e) =>
                        setStep3Data((prev) => ({
                          ...prev,
                          objectionBusters: {
                            ...prev.objectionBusters,
                            objection1Title: e.target.value,
                          },
                        }))
                      }
                      disabled={isVaultReadonly}
                      placeholder="e.g. 1. Vendor Longevity & Credibility Risk"
                      className="h-8 text-base sm:text-xs font-semibold text-slate-900 mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-[10px] font-medium text-slate-500">
                      What The Prospect Actually Says (Quote)
                    </Label>
                    <textarea
                      value={
                        step3Data.objectionBusters.objection1Quote ||
                        "You're an unproven early-stage startup. What happens if you go bust or stop maintaining this software next year?"
                      }
                      onChange={(e) =>
                        setStep3Data((prev) => ({
                          ...prev,
                          objectionBusters: {
                            ...prev.objectionBusters,
                            objection1Quote: e.target.value,
                          },
                        }))
                      }
                      rows={2}
                      disabled={isVaultReadonly}
                      placeholder="e.g. You're an unproven early-stage startup..."
                      className="w-full mt-1 rounded-md border border-slate-200 bg-slate-50/70 p-2 text-base sm:text-xs italic text-slate-700 leading-relaxed focus:border-indigo-500 focus:bg-white focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <Label className="text-[10px] font-medium text-slate-500">
                      Your High-Converting Rebuttal
                    </Label>
                    <textarea
                      value={step3Data.objectionBusters.vendorRisk}
                      onChange={(e) =>
                        setStep3Data((prev) => ({
                          ...prev,
                          objectionBusters: {
                            ...prev.objectionBusters,
                            vendorRisk: e.target.value,
                          },
                        }))
                      }
                      rows={5}
                      disabled={isVaultReadonly}
                      placeholder="e.g. Data export guarantee, founder direct WhatsApp access, and month-to-month rolling commitment..."
                      className="w-full mt-1 rounded-md border border-slate-300 p-2 text-base sm:text-xs text-slate-900 leading-relaxed focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Objection 2: Status Quo Inertia */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs hover:border-amber-200 transition-colors">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Clock className="h-4 w-4 shrink-0 text-amber-600" />
                      <Badge variant="outline" className="border-amber-200 bg-amber-50 text-[10px] font-semibold text-amber-700">
                        Friction #2: Status Quo
                      </Badge>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleGenerateSingleRebuttal(2)}
                      disabled={generatingSingleRebuttalIndex === 2 || isVaultReadonly}
                      className="h-6 px-2 text-[10px] font-medium text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 shrink-0 gap-1"
                    >
                      {generatingSingleRebuttalIndex === 2 ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin text-indigo-600" />
                          <span>Suggesting...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3 text-indigo-600" />
                          <span>Suggest Rebuttal</span>
                        </>
                      )}
                    </Button>
                  </div>

                  <div>
                    <Label className="text-[10px] font-medium text-slate-500">
                      Objection Category / Theme
                    </Label>
                    <Input
                      value={step3Data.objectionBusters.objection2Title || '2. Status Quo / Switching Inertia'}
                      onChange={(e) =>
                        setStep3Data((prev) => ({
                          ...prev,
                          objectionBusters: {
                            ...prev.objectionBusters,
                            objection2Title: e.target.value,
                          },
                        }))
                      }
                      disabled={isVaultReadonly}
                      placeholder="e.g. 2. Status Quo / Switching Inertia"
                      className="h-8 text-base sm:text-xs font-semibold text-slate-900 mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-[10px] font-medium text-slate-500">
                      What The Prospect Actually Says (Quote)
                    </Label>
                    <textarea
                      value={
                        step3Data.objectionBusters.objection2Quote ||
                        "Our existing spreadsheet / manual routine isn't perfect, but everyone knows it and we don't have time to retrain the team right now."
                      }
                      onChange={(e) =>
                        setStep3Data((prev) => ({
                          ...prev,
                          objectionBusters: {
                            ...prev.objectionBusters,
                            objection2Quote: e.target.value,
                          },
                        }))
                      }
                      rows={2}
                      disabled={isVaultReadonly}
                      placeholder="e.g. Our existing spreadsheet / manual routine isn't perfect..."
                      className="w-full mt-1 rounded-md border border-slate-200 bg-slate-50/70 p-2 text-base sm:text-xs italic text-slate-700 leading-relaxed focus:border-indigo-500 focus:bg-white focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <Label className="text-[10px] font-medium text-slate-500">
                      Your High-Converting Rebuttal
                    </Label>
                    <textarea
                      value={step3Data.objectionBusters.statusQuoInertia}
                      onChange={(e) =>
                        setStep3Data((prev) => ({
                          ...prev,
                          objectionBusters: {
                            ...prev.objectionBusters,
                            statusQuoInertia: e.target.value,
                          },
                        }))
                      }
                      rows={5}
                      disabled={isVaultReadonly}
                      placeholder="e.g. Concierge white-glove migration where the founder does 100% of the manual onboarding setup..."
                      className="w-full mt-1 rounded-md border border-slate-300 p-2 text-base sm:text-xs text-slate-900 leading-relaxed focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Objection 3: Missing Feature Gap */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs hover:border-indigo-200 transition-colors">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Sparkles className="h-4 w-4 shrink-0 text-indigo-600" />
                      <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-[10px] font-semibold text-indigo-700">
                        Friction #3: Feature Gap
                      </Badge>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleGenerateSingleRebuttal(3)}
                      disabled={generatingSingleRebuttalIndex === 3 || isVaultReadonly}
                      className="h-6 px-2 text-[10px] font-medium text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 shrink-0 gap-1"
                    >
                      {generatingSingleRebuttalIndex === 3 ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin text-indigo-600" />
                          <span>Suggesting...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3 text-indigo-600" />
                          <span>Suggest Rebuttal</span>
                        </>
                      )}
                    </Button>
                  </div>

                  <div>
                    <Label className="text-[10px] font-medium text-slate-500">
                      Objection Category / Theme
                    </Label>
                    <Input
                      value={step3Data.objectionBusters.objection3Title || '3. Missing Feature Gap / Integrations'}
                      onChange={(e) =>
                        setStep3Data((prev) => ({
                          ...prev,
                          objectionBusters: {
                            ...prev.objectionBusters,
                            objection3Title: e.target.value,
                          },
                        }))
                      }
                      disabled={isVaultReadonly}
                      placeholder="e.g. 3. Missing Feature Gap / Integrations"
                      className="h-8 text-base sm:text-xs font-semibold text-slate-900 mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-[10px] font-medium text-slate-500">
                      What The Prospect Actually Says (Quote)
                    </Label>
                    <textarea
                      value={
                        step3Data.objectionBusters.objection3Quote ||
                        "We really like the concept, but we cannot adopt unless you have custom ERP integration and automated payroll export."
                      }
                      onChange={(e) =>
                        setStep3Data((prev) => ({
                          ...prev,
                          objectionBusters: {
                            ...prev.objectionBusters,
                            objection3Quote: e.target.value,
                          },
                        }))
                      }
                      rows={2}
                      disabled={isVaultReadonly}
                      placeholder="e.g. We really like the concept, but we cannot adopt unless..."
                      className="w-full mt-1 rounded-md border border-slate-200 bg-slate-50/70 p-2 text-base sm:text-xs italic text-slate-700 leading-relaxed focus:border-indigo-500 focus:bg-white focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <Label className="text-[10px] font-medium text-slate-500">
                      Your High-Converting Rebuttal
                    </Label>
                    <textarea
                      value={step3Data.objectionBusters.featureGap}
                      onChange={(e) =>
                        setStep3Data((prev) => ({
                          ...prev,
                          objectionBusters: {
                            ...prev.objectionBusters,
                            featureGap: e.target.value,
                          },
                        }))
                      }
                      rows={5}
                      disabled={isVaultReadonly}
                      placeholder="e.g. Founding advisory board influence over the Q2 product roadmap, plus a Zapier / webhook bridge..."
                      className="w-full mt-1 rounded-md border border-slate-300 p-2 text-base sm:text-xs text-slate-900 leading-relaxed focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------- */}
            {/* 3.7: 1-CLICK NON-BINDING LETTER OF INTENT (LOI) GENERATOR */}
            {/* --------------------------------------------------------- */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      3.7 1-Click Non-Binding Letter of Intent (LOI) / Pilot Agreement Generator
                    </h3>
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">
                      Grant Evaluator Gold Standard
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600">
                    Generate a formal, non-binding Letter of Intent to send to your pilot partner. Demonstrates verified commercial feasibility to Irish LEO &amp; UK Innovate UK grant evaluators.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      handleCopyText(loiMarkdownPreview, 'LOI');
                      setCopiedLoi(true);
                      setTimeout(() => setCopiedLoi(false), 2500);
                    }}
                    className="h-8 border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs px-3"
                  >
                    {copiedLoi ? (
                      <>
                        <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                        Copied LOI Text!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
                        Copy LOI Text
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="default"
                    onClick={handlePrintLoiPdf}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs px-3 shadow-xs font-semibold"
                  >
                    <Printer className="mr-1.5 h-3.5 w-3.5" />
                    Download / Save as PDF
                  </Button>
                </div>
              </div>

              {/* LOI Input Parameters */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[10px] font-medium text-slate-600">Target Partner Company</Label>
                    <Input
                      type="text"
                      value={step3Data.letterOfIntent.targetCompanyName}
                      onChange={(e) =>
                        setStep3Data((prev) => ({
                          ...prev,
                          letterOfIntent: {
                            ...prev.letterOfIntent,
                            targetCompanyName: e.target.value,
                          },
                        }))
                      }
                      placeholder="e.g. Acme Enterprises Ltd"
                      disabled={isVaultReadonly}
                      className="h-8 bg-white text-base sm:text-xs mt-0.5"
                    />
                  </div>

                  <div>
                    <Label className="text-[10px] font-medium text-slate-600">Contact Person &amp; Title</Label>
                    <Input
                      type="text"
                      value={step3Data.letterOfIntent.targetContactName}
                      onChange={(e) =>
                        setStep3Data((prev) => ({
                          ...prev,
                          letterOfIntent: {
                            ...prev.letterOfIntent,
                            targetContactName: e.target.value,
                          },
                        }))
                      }
                      placeholder="e.g. John Doe (Managing Director)"
                      disabled={isVaultReadonly}
                      className="h-8 bg-white text-base sm:text-xs mt-0.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[10px] font-medium text-slate-600">Pilot Duration (Weeks)</Label>
                    <Input
                      type="number"
                      value={step3Data.letterOfIntent.pilotDurationWeeks}
                      onChange={(e) =>
                        setStep3Data((prev) => ({
                          ...prev,
                          letterOfIntent: {
                            ...prev.letterOfIntent,
                            pilotDurationWeeks: parseInt(e.target.value, 10) || 8,
                          },
                        }))
                      }
                      placeholder="8"
                      disabled={isVaultReadonly}
                      className="h-8 bg-white text-base sm:text-xs mt-0.5"
                    />
                  </div>

                  <div>
                    <Label className="text-[10px] font-medium text-slate-600">Agreed Pilot Price Point</Label>
                    <Input
                      type="text"
                      value={step3Data.letterOfIntent.pilotPricePoint}
                      onChange={(e) =>
                        setStep3Data((prev) => ({
                          ...prev,
                          letterOfIntent: {
                            ...prev.letterOfIntent,
                            pilotPricePoint: e.target.value,
                          },
                        }))
                      }
                      placeholder="e.g. €99 / month or €500 one-off"
                      disabled={isVaultReadonly}
                      className="h-8 bg-white text-base sm:text-xs mt-0.5"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-[10px] font-medium text-slate-600">
                    Mutually Agreed Success KPI Metric (Trigger for Commercial Conversion)
                  </Label>
                  <Input
                    type="text"
                    value={step3Data.letterOfIntent.primarySuccessKpi}
                    onChange={(e) =>
                      setStep3Data((prev) => ({
                        ...prev,
                        letterOfIntent: {
                          ...prev.letterOfIntent,
                          primarySuccessKpi: e.target.value,
                        },
                      }))
                    }
                    placeholder="e.g. Achieve at least 30% reduction in processing time and 95% user satisfaction within 60 days."
                    disabled={isVaultReadonly}
                    className="h-8 bg-white text-base sm:text-xs mt-0.5"
                  />
                </div>

                <div>
                  <Label className="text-[10px] font-medium text-slate-600">
                    Custom Terms / Founder Perks (Optional)
                  </Label>
                  <Input
                    type="text"
                    value={step3Data.letterOfIntent.customTermsText || ''}
                    onChange={(e) =>
                      setStep3Data((prev) => ({
                        ...prev,
                        letterOfIntent: {
                          ...prev.letterOfIntent,
                          customTermsText: e.target.value,
                        },
                      }))
                    }
                    placeholder="e.g. 50% discount for first 12 months upon contract renewal; 1 dedicated onboarding session"
                    disabled={isVaultReadonly}
                    className="h-8 bg-white text-base sm:text-xs mt-0.5"
                  />
                </div>
              </div>

              {/* Live Rendered Agreement Document & Preview Block */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-900">
                      Live Agreement Document Preview
                    </span>
                    <Badge variant="outline" className="border-indigo-200 bg-indigo-50/70 text-[10px] text-indigo-700 font-mono">
                      Letter_of_Intent_Agreement.pdf
                    </Badge>
                  </div>
                </div>

                {/* Formal Executive Document Preview */}
                <div className="rounded-xl border border-slate-300 bg-white p-5 sm:p-7 text-slate-800 shadow-sm space-y-4">
                  <div className="border-b-2 border-indigo-600 pb-3.5 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
                        Startup Preflight • Commercial Validation Framework
                      </span>
                      <h4 className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5">
                        Non-Binding Early Adopter Letter of Intent (LOI)
                      </h4>
                    </div>
                    <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] shrink-0">
                      A4 PDF &amp; Print Ready
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Solution Provider</span>
                      <span className="font-semibold text-slate-900">{planTitle || 'Our Startup'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Prospective Customer</span>
                      <span className="font-semibold text-slate-900">{step3Data.letterOfIntent.targetCompanyName || 'Acme Enterprises Ltd'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Key Executive Contact</span>
                      <span className="font-semibold text-slate-900">{step3Data.letterOfIntent.targetContactName || 'John Doe (Managing Director)'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Evaluation Window</span>
                      <span className="font-semibold text-slate-900">{step3Data.letterOfIntent.pilotDurationWeeks || 8} Weeks Structured Pilot</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
                    <div className="font-bold text-slate-900 text-xs">1. Purpose &amp; Mutual Strategic Intent</div>
                    <p>
                      This non-binding Letter of Intent confirms that <strong>{step3Data.letterOfIntent.targetCompanyName || 'Prospective Customer Partner'}</strong> intends to participate as an early design and pilot partner in the structured evaluation program of <strong>{planTitle || 'Our Startup'}</strong> to test and validate the following operational outcome:
                    </p>
                    <div className="rounded-r-xl border-l-4 border-indigo-600 bg-indigo-50/70 p-3 text-xs font-medium text-indigo-950">
                      <span className="text-[10px] font-bold uppercase text-indigo-700 block mb-0.5">Agreed Milestone Success KPI</span>
                      &ldquo;{step3Data.letterOfIntent.primarySuccessKpi || 'Demonstrate 30% time reduction and 95% user satisfaction'}&rdquo;
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-700 leading-relaxed">
                    <div className="font-bold text-slate-900 text-xs">2. Pilot Scope &amp; Operating Governance</div>
                    <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                      <li><strong>Evaluation Duration:</strong> {step3Data.letterOfIntent.pilotDurationWeeks || 8} weeks commencing upon mutual access provisioning.</li>
                      <li><strong>Founder Concierge Guidance:</strong> Direct async and weekly review support provided to ensure rapid time-to-value and smooth workflow integration.</li>
                      <li><strong>Feedback &amp; KPI Verification:</strong> Regular operational check-ins and performance evaluation against the agreed KPI.</li>
                    </ul>
                  </div>

                  <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
                    <div className="font-bold text-slate-900 text-xs">3. Commercial Terms Upon Milestone Success</div>
                    <p>
                      Upon successfully satisfying the primary success criteria during the pilot window, both parties intend in good faith to transition into a standard commercial agreement at the preferential founding rate:
                    </p>
                    <div className="rounded-r-xl border-l-4 border-emerald-600 bg-emerald-50/80 p-3 text-xs font-medium text-emerald-950">
                      <span className="text-[10px] font-bold uppercase text-emerald-700 block mb-0.5">Preferential Founding Customer Rate</span>
                      {step3Data.letterOfIntent.pilotPricePoint || step2Data?.priceP2?.headlinePricePoint || resolvedUpstreamPrice.priceHeadline || '€99 / month'}
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-slate-700 leading-relaxed">
                    <div className="font-bold text-slate-900 text-xs">4. Non-Binding Nature &amp; Confidentiality</div>
                    <p className="text-slate-600">
                      This document constitutes an expression of serious commercial interest and mutual good faith ({plan.hqCountryCode === 'GB' ? 'aligned with UK Innovate UK / British Business Bank benchmarks' : 'aligned with Enterprise Ireland & LEO Feasibility/Priming benchmarks'}). It creates zero financial or legal liability prior to a definitive contract.
                    </p>
                  </div>

                  {step3Data.letterOfIntent.customTermsText?.trim() && (
                    <div className="space-y-1 text-xs text-slate-700 leading-relaxed">
                      <div className="font-bold text-slate-900 text-xs">5. Specific Pilot Governance &amp; Addenda</div>
                      <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        {step3Data.letterOfIntent.customTermsText.trim()}
                      </p>
                    </div>
                  )}

                  {/* Signatures block */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-3 border-t border-slate-200">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
                      <span className="text-[10px] font-bold uppercase text-slate-700 block">
                        For {step3Data.letterOfIntent.targetCompanyName || 'Prospective Customer Partner'}
                      </span>
                      <div className="text-[11px] text-slate-600">
                        Name / Title: <strong>{step3Data.letterOfIntent.targetContactName || 'Managing Director'}</strong>
                      </div>
                      <div className="pt-2 border-b border-slate-400 text-[10px] text-slate-400">Signature</div>
                      <div className="pt-2 border-b border-slate-400 text-[10px] text-slate-400">Date</div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
                      <span className="text-[10px] font-bold uppercase text-slate-700 block">
                        For {planTitle || 'Our Startup'}
                      </span>
                      <div className="text-[11px] text-slate-600">
                        Founder / Executive: ___________________________
                      </div>
                      <div className="pt-2 border-b border-slate-400 text-[10px] text-slate-400">Signature</div>
                      <div className="pt-2 border-b border-slate-400 text-[10px] text-slate-400">Date</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------- */}
            {/* STEP 3 PARKING LOT: OPEN QUESTIONS                        */}
            {/* --------------------------------------------------------- */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Bookmark className="h-4 w-4 text-indigo-600" />
                <span>Uncertain About Your First 10 Strategy? Park It in Open Questions</span>
              </div>
              <p className="text-xs text-slate-600">
                Don&#39;t let unanswered sales or pipeline questions stall your momentum. Park the question here to resolve during upcoming mentor reviews or pilot calls.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="text"
                  value={parkingQuestionTextStep3}
                  onChange={(e) => setParkingQuestionTextStep3(e.target.value)}
                  placeholder="e.g. Should we offer an annual prepayment incentive during the pilot?"
                  disabled={isVaultReadonly || isParkingQuestionStep3}
                  className="h-8 text-base sm:text-xs flex-1 min-w-[240px] bg-white"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleParkStep3Question}
                  disabled={!parkingQuestionTextStep3.trim() || isParkingQuestionStep3 || isVaultReadonly}
                  className="h-8 border-slate-300 text-xs shrink-0"
                >
                  {isParkingQuestionStep3 ? (
                    <RefreshCw className="mr-1 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Bookmark className="mr-1 h-3.5 w-3.5 text-indigo-600" />
                  )}
                  Park Question
                </Button>
              </div>
              {parkingSuccessStep3 && (
                <p className="text-xs text-emerald-600 font-medium">
                  ✓ Question successfully parked to your Open Questions parking lot!
                </p>
              )}
            </div>

            {/* --------------------------------------------------------- */}
            {/* STEP 3 BOTTOM ACTION TOOLBAR                              */}
            {/* --------------------------------------------------------- */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleGenerateAiFirst10}
                  disabled={isGeneratingAiStep3 || isVaultReadonly}
                  className="border-indigo-200 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
                >
                  {isGeneratingAiStep3 ? (
                    <>
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Synthesizing...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
                      Regenerate with AI
                    </>
                  )}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleSaveStep3}
                  disabled={saveStatusStep3 === 'saving' || isVaultReadonly}
                  className="bg-indigo-600 text-xs font-medium text-white hover:bg-indigo-700"
                >
                  {saveStatusStep3 === 'saving' ? (
                    <>
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : saveStatusStep3 === 'saved' ? (
                    <>
                      <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-300" />
                      Saved!
                    </>
                  ) : (
                    'Save First 10 Playbook'
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await handleSaveStep3();
                    setOpenStep(4);
                    window.scrollTo({ top: 400, behavior: 'smooth' });
                  }}
                  className="border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Next Step: Marketing Budget &amp; CAC
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STEP 4: REVERSE-ENGINEERED MARKETING BUDGET & CAC SIMULATOR    */}
      {/* ------------------------------------------------------------- */}
      {openStep !== 'ALL' && openStep !== 4 ? (
        <div
          id="module-i-step-4"
          onClick={() => setOpenStep(4)}
          className="group scroll-mt-24 cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  isStep4Complete ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
                }`}
              >
                {isStep4Complete ? <Check className="h-4 w-4" /> : '4'}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                  Step 4: Reverse-Engineered Marketing Budget, CAC &amp; Funnel Calculator
                </h2>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  Target: {step4Data.targetMonthlyNewCustomers} customers/mo • Budget: {currencySymbol}
                  {step4LiveMetrics.lineItemsTotalSpend.toLocaleString()}/mo • Cash CAC: {currencySymbol}
                  {step4LiveMetrics.cashCac} • LTV:CAC: {step4LiveMetrics.ltvToCacRatio}x ({step4LiveMetrics.paybackMonths} mo payback)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Badge
                variant={isStep4Complete ? 'default' : 'outline'}
                className={`text-[10px] shrink-0 font-medium ${
                  isStep4Complete
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'border-slate-300 text-slate-600'
                }`}
              >
                {isStep4Complete ? 'Completed' : 'In Progress'}
              </Badge>
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
        </div>
      ) : (
        <Card id="module-i-step-4" className="scroll-mt-24 rounded-xl border border-slate-200 bg-white shadow-xs">
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
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base font-bold text-slate-900">
                      Step 4: Reverse-Engineered Marketing Budget, CAC &amp; Funnel Calculator
                    </CardTitle>
                    <Badge
                      variant={isStep4Complete ? 'default' : 'outline'}
                      className={`text-[10px] shrink-0 font-medium ${
                        isStep4Complete
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'border-slate-300 text-slate-600'
                      }`}
                    >
                      {isStep4Complete ? 'Completed' : 'In Progress'}
                    </Badge>
                    {step4Data.aiEngineUsed && (
                      <Badge
                        variant="outline"
                        className="shrink-0 border-indigo-200 bg-indigo-50 text-indigo-700 text-[10px]"
                      >
                        <Sparkles className="mr-1 h-2.5 w-2.5" />
                        {step4Data.aiEngineUsed === 'gemini-2.5-flash'
                          ? 'Gemini 2.5 Flash'
                          : 'Smart Synthesizer'}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="mt-1 text-xs text-slate-600">
                    Start from your Module H Breakeven Customer count, use interactive sliders to reverse-engineer your required traffic and leads, and verify that your Customer Acquisition Cost (`CAC`) pays back fast enough out of Pocket Profit.
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

            {/* 4-Layer Support Strip: Micro-Coaching, Examples, AI Calibrator */}
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

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleGenerateAiStep4}
                disabled={isGeneratingAiStep4 || isVaultReadonly}
                className="h-7 border-violet-200 bg-violet-50/60 text-[11px] font-medium text-violet-700 hover:bg-violet-100"
              >
                {isGeneratingAiStep4 ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin text-violet-600" />
                    Calibrating Funnel &amp; CAC...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-1.5 h-3.5 w-3.5 text-violet-600" />
                    Auto-Calibrate with Preflight AI
                  </>
                )}
              </Button>
            </div>

            {/* Micro-Coaching: Why Are We Asking This? */}
            {activeWhyCard === 4 && (
              <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50/70 p-3.5 text-xs text-indigo-900">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                    <div className="space-y-1.5">
                      <p className="font-semibold text-indigo-950">
                        Why Reverse-Engineering Your Marketing Budget Prevents the #1 Startup Cash Trap
                      </p>
                      <p className="text-indigo-800">
                        Most early-stage business plans pick an arbitrary marketing number out of thin air (e.g., <em>&ldquo;We will spend {currencySymbol}500/month on ads and acquire 100 customers&rdquo;</em>). Grant assessors (IE Local Enterprise Office, Enterprise Ireland, UK Start Up Loans &amp; Innovate UK) and angel investors immediately test whether the funnel math holds up.
                      </p>
                      <ul className="list-disc pl-4 space-y-1 text-indigo-900/90">
                        <li>
                          <strong>Pocket-Profit LTV vs. Gross Revenue LTV:</strong> You cannot pay for customer acquisition using money that goes to Stripe fees or variable COGS. We anchor your `LTV : CAC` and `Payback Months` strictly on your <strong>Module H Pocket Profit per Customer ({currencySymbol}{upstreamEconomics.pocketProfitPerCustomer})</strong>.
                        </li>
                        <li>
                          <strong>Cash CAC vs. Sweat-Equity CAC:</strong> Even if you rely on &ldquo;free&rdquo; organic LinkedIn outreach or content, your time is finite. Our calculator tracks both your cash outlay and the weekly founder hours required so you don&apos;t accidentally commit to 60 hours/week of cold outreach while building the product.
                        </li>
                        <li>
                          <strong>Grant Eligibility Guardrail:</strong> Ongoing pay-per-click ad spend (Google/Meta/LinkedIn clicks) is <strong>ineligible</strong> for IE LEO Priming/Feasibility and UK Innovate UK grants. Separating capability/export marketing spend from ongoing ad spend keeps your grant application 100% compliant.
                        </li>
                      </ul>
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

            {/* Micro-Coaching: Show Me an Example */}
            {activeExampleCard === 4 && (
              <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/70 p-3.5 text-xs text-emerald-950">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <div className="space-y-1">
                      <p className="font-semibold text-emerald-900">
                        Industry Example: Reverse-Engineering 25 New Customers/Month ({plan.industryCategory || 'B2B / SaaS'})
                      </p>
                      <p className="text-emerald-800">
                        <strong>Target:</strong> 25 new customers/month (Module H Year 1 Breakeven) @ {currencySymbol}85/mo Pocket Profit per customer.
                      </p>
                      <p className="text-emerald-800">
                        <strong>Funnel Math:</strong> At a <strong>12%</strong> Lead-to-Sale close rate, you need <strong>209 qualified leads/month</strong>. At a <strong>4%</strong> landing page / outreach-to-lead conversion rate, you need <strong>5,225 monthly visitors or outreach touches</strong>.
                      </p>
                      <p className="text-emerald-800">
                        <strong>Channel Mix &amp; CAC:</strong> Splitting 35% Paid Ads (1,829 clicks @ {currencySymbol}1.80 CPC = {currencySymbol}3,292) + {currencySymbol}350 in CRM/Events = {currencySymbol}3,642/mo total budget. That yields a <strong>Cash CAC of {currencySymbol}146</strong>, paying back in <strong>1.7 months</strong> with an <strong>8.7x LTV:CAC ratio</strong> over a 15-month retention lifespan.
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

            {/* AI Success Notification */}
            {aiSuccessMessageStep4 && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs font-medium text-emerald-800">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{aiSuccessMessageStep4}</span>
              </div>
            )}

            {/* AI Assessor Insight Tip */}
            {aiAssessorTipStep4 && (
              <div className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50/80 p-3 text-xs text-indigo-950">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                  <div>
                    <span className="font-semibold text-indigo-950">Grant &amp; Investor Assessor Tip: </span>
                    <span className="text-indigo-900">{aiAssessorTipStep4}</span>
                  </div>
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-8 pt-6">
            {/* AI Auto-Synthesize Banner */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50/80 via-white to-violet-50/80 p-4">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
                  <Wand2 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-bold text-slate-900">
                    AI Funnel &amp; Grant-Compliant Budget Calibrator
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Auto-calibrate realistic conversion rates, CPC benchmarks, 3-bucket marketing line items, and a grant-ready CAC justification narrative tailored to your {plan.industryCategory || 'startup'} model.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={handleGenerateAiStep4}
                disabled={isGeneratingAiStep4 || isVaultReadonly}
                className="shrink-0 bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                {isGeneratingAiStep4 ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Calibrating Funnel &amp; CAC...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    Auto-Calibrate with Preflight AI
                  </>
                )}
              </Button>
            </div>

            {aiSuccessMessageStep4 && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{aiSuccessMessageStep4}</span>
              </div>
            )}

            {aiAssessorTipStep4 && (
              <div className="rounded-lg border border-indigo-200 bg-indigo-50/80 px-3.5 py-2.5 text-xs text-indigo-950 flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                <div>
                  <span className="font-bold">Grant &amp; Investor Assessor Tip: </span>
                  {aiAssessorTipStep4}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 4.1 UPSTREAM UNIT ECONOMICS CONTEXT BANNER (MOD H + MOD I)     */}
            {/* ------------------------------------------------------------- */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-indigo-600 text-white text-[10px]">
                    Upstream Intelligence Bridge
                  </Badge>
                  <span className="text-xs font-bold text-slate-900">
                    4.1 Live Unit Economics &amp; Breakeven Baseline (Pulled from Modules H &amp; I)
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${
                    upstreamEconomics.isFromModuleH
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      : 'border-amber-300 bg-amber-50 text-amber-800'
                  }`}
                >
                  {upstreamEconomics.sourceSummaryLabel}
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                    Mod H Y1 Breakeven
                  </div>
                  <div className="mt-1 text-base font-bold text-indigo-700">
                    {upstreamEconomics.y1BreakevenCustomers.toLocaleString()}{' '}
                    <span className="text-xs font-normal text-slate-500">cust/mo</span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500">
                    Y2: {upstreamEconomics.y2BreakevenCustomers} • Y3: {upstreamEconomics.y3BreakevenCustomers}
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                    Net Customer Price
                  </div>
                  <div className="mt-1 text-base font-bold text-slate-900">
                    {currencySymbol}
                    {upstreamEconomics.netPricePerCustomer.toLocaleString()}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500">
                    Ex-VAT average order/plan
                  </div>
                </div>

                <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800">
                    Pocket Profit / Cust
                  </div>
                  <div className="mt-1 text-base font-bold text-emerald-700">
                    {currencySymbol}
                    {upstreamEconomics.pocketProfitPerCustomer.toLocaleString()}
                  </div>
                  <div className="mt-0.5 text-[11px] text-emerald-700/80" title="Direct Cost to Make & Deliver 1 Sale — COGS (Cost of Goods Sold) in plain terms is what it directly costs you in raw materials, packaging, postage, or server usage every single time you sell one unit.">
                    Net margin after COGS (Direct Cost to Make &amp; Deliver 1 Sale) &amp; fees
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                    Primary Channel (Step 2)
                  </div>
                  <div className="mt-1 truncate text-xs font-bold text-slate-900">
                    {step2Data.promotionP4.primaryAcquisitionEngine.replace(/_/g, ' ')}
                  </div>
                  <div className="mt-0.5 truncate text-[11px] text-slate-500">
                    Place: {step2Data.placeP3.primaryChannel.replace(/_/g, ' ')}
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-3 col-span-2 sm:col-span-1">
                  <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                    Warm Pipeline (Step 3)
                  </div>
                  <div className="mt-1 text-base font-bold text-violet-700">
                    {step4LiveMetrics.warmPipelineCount}{' '}
                    <span className="text-xs font-normal text-slate-500">prospects</span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500">
                    {moduleCStats.totalWaitlistLeads} Mod C waitlist leads
                  </div>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* 4.2 TARGET CUSTOMER GOAL PRESET & INTERACTIVE SLIDER           */}
            {/* ------------------------------------------------------------- */}
            <div className="space-y-4 rounded-xl border border-indigo-200 bg-gradient-to-br from-white via-indigo-50/20 to-violet-50/20 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Target className="h-4 w-4 text-indigo-600" />
                    4.2 Step 1 of Funnel: How Many New Customers Do You Need Per Month?
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Start with your Module H Year 1 Breakeven target ({upstreamEconomics.y1BreakevenCustomers} customers/mo) or drag the slider to stress-test any monthly acquisition milestone.
                  </p>
                </div>
                <Badge className="bg-indigo-100 text-indigo-900 border-indigo-300 text-xs font-bold px-3 py-1">
                  {step4Data.targetMonthlyNewCustomers.toLocaleString()} New Customers / Month
                </Badge>
              </div>

              {/* Goal Preset Pills (including OTHER per GEMINI.md Rule 1.5) */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-700">
                  Quick Target Milestone Preset:
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  {(
                    [
                      {
                        id: 'FIRST_10_PILOT' as BudgetGoalPreset,
                        label: 'First 10 Pilot',
                        sub: '10 cust/mo',
                      },
                      {
                        id: 'MOD_H_Y1_BREAKEVEN' as BudgetGoalPreset,
                        label: 'Mod H Y1 Breakeven',
                        sub: `${upstreamEconomics.y1BreakevenCustomers} cust/mo`,
                      },
                      {
                        id: 'MOD_H_Y2_SCALE' as BudgetGoalPreset,
                        label: 'Mod H Y2 Scale',
                        sub: `${upstreamEconomics.y2BreakevenCustomers} cust/mo`,
                      },
                      {
                        id: 'MOD_H_Y3_SCALE' as BudgetGoalPreset,
                        label: 'Mod H Y3 Scale',
                        sub: `${upstreamEconomics.y3BreakevenCustomers} cust/mo`,
                      },
                      {
                        id: 'CUSTOM_TARGET' as BudgetGoalPreset,
                        label: 'Custom Slider',
                        sub: 'Freeform target',
                      },
                      {
                        id: 'OTHER' as BudgetGoalPreset,
                        label: 'Other Milestone',
                        sub: 'Custom milestone',
                      },
                    ]
                  ).map((preset) => {
                    const isSelected = step4Data.goalPreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        disabled={isVaultReadonly}
                        onClick={() => handleSelectGoalPreset(preset.id)}
                        className={`rounded-lg border p-2.5 text-left transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/90 ring-1 ring-indigo-600'
                            : 'border-slate-200 bg-white hover:border-indigo-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {preset.label}
                          </span>
                          {isSelected && (
                            <div className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white">
                              <Check className="h-2 w-2" />
                            </div>
                          )}
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-500 truncate">
                          {preset.sub}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {step4Data.goalPreset === 'OTHER' && (
                  <div className="mt-2 rounded-lg border border-indigo-200 bg-indigo-50/40 p-3">
                    <Label className="text-xs font-semibold text-slate-800">
                      Describe Your Custom Acquisition Milestone (Required for &ldquo;Other&rdquo;):
                    </Label>
                    <Input
                      value={step4Data.otherGoalPresetText || ''}
                      disabled={isVaultReadonly}
                      onChange={(e) =>
                        setStep4Data((prev) => ({
                          ...prev,
                          otherGoalPresetText: e.target.value,
                        }))
                      }
                      placeholder="e.g., Q3 Seed Round Tranche Milestone (40 enterprise seats across 4 hospitals)..."
                      className="mt-1.5 bg-white text-base sm:text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Interactive Customer Count Slider + Direct Number Input */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center pt-2">
                <div className="sm:col-span-9 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">
                      Drag Slider to Adjust Monthly New Paying Customers:
                    </span>
                    <span className="font-bold text-indigo-700">
                      Generates {currencySymbol}
                      {(
                        Math.max(1, step4Data.targetMonthlyNewCustomers || 1) *
                        upstreamEconomics.pocketProfitPerCustomer
                      ).toLocaleString()}
                      /mo in Pocket Profit
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={Math.max(250, upstreamEconomics.y3BreakevenCustomers * 2)}
                    step={1}
                    disabled={isVaultReadonly}
                    value={Math.max(1, step4Data.targetMonthlyNewCustomers || 1)}
                    onChange={(e) => {
                      const val = Math.max(1, Number(e.target.value) || 1);
                      setStep4Data((prev) =>
                        applySyncedPaidMediaSpend({
                          ...prev,
                          goalPreset:
                            prev.goalPreset === 'OTHER' ? 'OTHER' : 'CUSTOM_TARGET',
                          targetMonthlyNewCustomers: val,
                        })
                      );
                    }}
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-indigo-200 accent-indigo-600"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>1 customer/mo</span>
                    <span>
                      Mod H Y1 Breakeven ({upstreamEconomics.y1BreakevenCustomers}/mo)
                    </span>
                    <span>
                      {Math.max(250, upstreamEconomics.y3BreakevenCustomers * 2)} customers/mo
                    </span>
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <Label className="text-[11px] font-semibold text-slate-600">
                    Exact Monthly Target:
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={50000}
                    disabled={isVaultReadonly}
                    value={
                      step4Data.targetMonthlyNewCustomers === 0
                        ? ''
                        : step4Data.targetMonthlyNewCustomers
                    }
                    onChange={(e) => {
                      const raw = e.target.value;
                      const val = raw === '' ? 0 : Math.max(0, Number(raw));
                      setStep4Data((prev) =>
                        applySyncedPaidMediaSpend({
                          ...prev,
                          goalPreset:
                            prev.goalPreset === 'OTHER' ? 'OTHER' : 'CUSTOM_TARGET',
                          targetMonthlyNewCustomers: val,
                        })
                      );
                    }}
                    onBlur={() =>
                      setStep4Data((prev) =>
                        applySyncedPaidMediaSpend({
                          ...prev,
                          targetMonthlyNewCustomers: Math.max(
                            1,
                            Number(prev.targetMonthlyNewCustomers) || 1
                          ),
                        })
                      )
                    }
                    className="mt-1 bg-white font-bold text-base sm:text-xs"
                  />
                </div>
              </div>

              {/* Warm Pipeline Deduction Toggle Switch */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={step4Data.deductWarmPipelineLeads}
                    disabled={isVaultReadonly}
                    onClick={() =>
                      setStep4Data((prev) =>
                        applySyncedPaidMediaSpend({
                          ...prev,
                          deductWarmPipelineLeads: !prev.deductWarmPipelineLeads,
                        })
                      )
                    }
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden mt-0.5 ${
                      step4Data.deductWarmPipelineLeads ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        step4Data.deductWarmPipelineLeads ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900">
                      Credit Warm Pipeline Leads from Step 3 ({step4LiveMetrics.warmPipelineCount} prospects in Dream 10 Pipeline)
                    </div>
                    <p className="text-[11px] text-slate-500">
                      When enabled, deducts {step4LiveMetrics.warmCustomerCredit || Math.max(1, Math.round(step4LiveMetrics.warmPipelineCount * 0.3))} warm pilot conversions from your cold monthly acquisition requirement so you only pay cold CAC on the remaining {step4LiveMetrics.netColdCustomersNeeded} customers.
                    </p>
                  </div>
                </div>
                {step4Data.deductWarmPipelineLeads && (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] shrink-0">
                    -{step4LiveMetrics.warmCustomerCredit} Warm Customers Credited
                  </Badge>
                )}
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* 4.3 INTERACTIVE REVERSE-FUNNEL & CHANNEL MIX SLIDERS           */}
            {/* ------------------------------------------------------------- */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-indigo-600" />
                    4.3 Interactive Funnel Conversion &amp; Paid vs. Sweat-Equity Sliders
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Adjust your conversion rates and channel mix. Click <strong>Use Industry Benchmark</strong> on any slider if you aren&apos;t sure yet.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Slider Card A: Lead-to-Customer Conversion Rate */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        1. Lead / Trial-to-Paying Customer Close Rate (%)
                      </div>
                      <p className="text-[11px] text-slate-500">
                        % of qualified leads, demos, or cart checkouts that become paying customers.
                      </p>
                    </div>
                    <Badge className="bg-indigo-50 text-indigo-800 border-indigo-200 text-xs font-bold shrink-0">
                      {step4Data.leadToCustomerConversionPercent}%
                    </Badge>
                  </div>

                  <input
                    type="range"
                    min={0.5}
                    max={40}
                    step={0.5}
                    disabled={isVaultReadonly}
                    value={step4Data.leadToCustomerConversionPercent}
                    onChange={(e) =>
                      setStep4Data((prev) =>
                        applySyncedPaidMediaSpend({
                          ...prev,
                          leadToCustomerConversionPercent: Number(e.target.value),
                        })
                      )
                    }
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-indigo-600"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <span className="text-[11px] text-slate-500">
                      Requires{' '}
                      <strong className="text-slate-900">
                        {step4LiveMetrics.requiredQualifiedLeads.toLocaleString()} qualified leads/mo
                      </strong>
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isVaultReadonly}
                      onClick={() =>
                        setStep4Data((prev) =>
                          applySyncedPaidMediaSpend({
                            ...prev,
                            leadToCustomerConversionPercent:
                              upstreamEconomics.leadConversionPercentFromModH || 10,
                          })
                        )
                      }
                      className="h-7 px-2 text-[11px] border-slate-200 text-indigo-700 hover:bg-indigo-50"
                    >
                      Use Industry Benchmark ({upstreamEconomics.leadConversionPercentFromModH || 10}%)
                    </Button>
                  </div>
                </div>

                {/* Slider Card B: Visitor / Outreach-to-Lead Conversion Rate */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        2. Visitor / Outreach Touch-to-Lead Rate (%)
                      </div>
                      <p className="text-[11px] text-slate-500">
                        % of website visitors, ad clicks, or cold outreach messages that become a lead.
                      </p>
                    </div>
                    <Badge className="bg-indigo-50 text-indigo-800 border-indigo-200 text-xs font-bold shrink-0">
                      {step4Data.visitorToLeadConversionPercent}%
                    </Badge>
                  </div>

                  <input
                    type="range"
                    min={0.5}
                    max={25}
                    step={0.5}
                    disabled={isVaultReadonly}
                    value={step4Data.visitorToLeadConversionPercent}
                    onChange={(e) =>
                      setStep4Data((prev) =>
                        applySyncedPaidMediaSpend({
                          ...prev,
                          visitorToLeadConversionPercent: Number(e.target.value),
                        })
                      )
                    }
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-indigo-600"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <span className="text-[11px] text-slate-500">
                      Requires{' '}
                      <strong className="text-slate-900">
                        {step4LiveMetrics.requiredTopOfFunnelTouches.toLocaleString()} monthly touches/clicks
                      </strong>
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isVaultReadonly}
                      onClick={() =>
                        setStep4Data((prev) =>
                          applySyncedPaidMediaSpend({
                            ...prev,
                            visitorToLeadConversionPercent: 4.0,
                          })
                        )
                      }
                      className="h-7 px-2 text-[11px] border-slate-200 text-indigo-700 hover:bg-indigo-50"
                    >
                      Use Industry Benchmark (4.0%)
                    </Button>
                  </div>
                </div>

                {/* Slider Card C: Paid Traffic Share vs. Organic Sweat Equity with Reversible Toggle */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        3. Paid Ads vs. Sweat-Equity Organic Split (%)
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Balance between paid clicks ({isOptedOutOfPaid ? 0 : step4Data.paidTrafficSharePercent}%) and founder outreach/organic ({isOptedOutOfPaid ? 100 : 100 - step4Data.paidTrafficSharePercent}%).
                      </p>
                    </div>
                    <Badge
                      className={`text-xs font-bold shrink-0 ${
                        isOptedOutOfPaid
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-violet-50 text-violet-800 border-violet-200'
                      }`}
                    >
                      {isOptedOutOfPaid
                        ? '🛡️ 100% Organic (Paid Ads Opted Out)'
                        : `${step4Data.paidTrafficSharePercent}% Paid / ${100 - step4Data.paidTrafficSharePercent}% Organic`}
                    </Badge>
                  </div>

                  {/* Reversible Paid Acquisition Strategy Toggle */}
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/80 p-2.5">
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={!isOptedOutOfPaid}
                        disabled={isVaultReadonly}
                        onClick={() => handleTogglePaidAdsStrategy(isOptedOutOfPaid)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                          !isOptedOutOfPaid ? 'bg-indigo-600' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                            !isOptedOutOfPaid ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {!isOptedOutOfPaid ? 'Paid Advertising Active' : 'Paid Ads Opted Out'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {!isOptedOutOfPaid
                            ? 'Allocating cash budget to PPC / performance ads'
                            : '100% organic & outbound focus • Excluded from Module J'}
                        </div>
                      </div>
                    </div>

                    {/* Segmented Pill Selector (Toggle to reverse anytime) */}
                    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
                      <button
                        type="button"
                        disabled={isVaultReadonly}
                        onClick={() => handleTogglePaidAdsStrategy(true)}
                        className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${
                          !isOptedOutOfPaid
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Zap className="h-3 w-3" />
                        Paid Active
                      </button>
                      <button
                        type="button"
                        disabled={isVaultReadonly}
                        onClick={() => handleTogglePaidAdsStrategy(false)}
                        className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${
                          isOptedOutOfPaid
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <ShieldCheck className="h-3 w-3" />
                        Opt Out (Organic)
                      </button>
                    </div>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    disabled={isVaultReadonly || isOptedOutOfPaid}
                    value={isOptedOutOfPaid ? 0 : step4Data.paidTrafficSharePercent}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val === 0) {
                        handleOptOutOfPaidAds();
                      } else {
                        setLastActivePaidShare(val);
                        setStep4Data((prev) =>
                          applySyncedPaidMediaSpend({
                            ...prev,
                            paidTrafficSharePercent: val,
                            paidAdsViabilityDecision: 'ACTIVE',
                            excludePaidAdsFromModuleJ: false,
                          })
                        );
                      }
                    }}
                    className={`h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 ${
                      isOptedOutOfPaid ? 'opacity-40 cursor-not-allowed' : 'accent-violet-600'
                    }`}
                  />

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <Label className="text-[11px] font-medium text-slate-600">
                        Avg. Cost Per Click / Touch ({currencySymbol})
                      </Label>
                      <Input
                        type="number"
                        step="0.1"
                        min={0}
                        disabled={isVaultReadonly}
                        value={
                          step4Data.estimatedCostPerClickOrTouch === 0
                            ? ''
                            : step4Data.estimatedCostPerClickOrTouch
                        }
                        onChange={(e) => {
                          const raw = e.target.value;
                          const val = raw === '' ? 0 : Math.max(0, Number(raw));
                          setStep4Data((prev) =>
                            applySyncedPaidMediaSpend({
                              ...prev,
                              estimatedCostPerClickOrTouch: val,
                            })
                          );
                        }}
                        onBlur={() =>
                          setStep4Data((prev) =>
                            applySyncedPaidMediaSpend({
                              ...prev,
                              estimatedCostPerClickOrTouch: Math.max(
                                0.05,
                                Number(prev.estimatedCostPerClickOrTouch) || 0.5
                              ),
                            })
                          )
                        }
                        className="mt-1 h-8 bg-white text-base sm:text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] font-medium text-slate-600">
                        Implied Monthly Ad Spend
                      </Label>
                      <div className="mt-1 flex h-8 items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-2.5 text-xs font-bold text-slate-900">
                        <span>
                          {currencySymbol}
                          {step4LiveMetrics.impliedPaidMediaSpend.toLocaleString()}/mo
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-700">
                          Auto-Synced ✓
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Slider Card D: Retention / Purchase Frequency & Founder Time Assumptions */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        4. Customer Lifespan (LTV) &amp; Founder Time
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Choose whether customers subscribe monthly, buy once, or repeat-buy, plus founder time per organic touch.
                      </p>
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-bold shrink-0">
                      {step4LiveMetrics.activeLtvModel === 'SINGLE_ONE_TIME_PURCHASE'
                        ? '1x One-Time Order'
                        : step4LiveMetrics.activeLtvModel === 'REPEAT_PURCHASE_ORDERS'
                        ? `${step4LiveMetrics.effectiveLtvMultiplier}x Lifetime Orders`
                        : step4LiveMetrics.activeLtvModel === 'OTHER'
                        ? `${step4LiveMetrics.effectiveLtvMultiplier}x Custom LTV`
                        : `${step4LiveMetrics.effectiveLtvMultiplier} Mo Lifespan`}
                    </Badge>
                  </div>

                  {/* Purchase Frequency Mode Selector (including OTHER per GEMINI.md Rule 1.5) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {(
                      [
                        {
                          id: 'RECURRING_SUBSCRIPTION' as LtvPurchaseModelType,
                          label: 'Subscription',
                          sub: 'Months retained',
                        },
                        {
                          id: 'SINGLE_ONE_TIME_PURCHASE' as LtvPurchaseModelType,
                          label: 'One-Time Buy',
                          sub: '1x single order',
                        },
                        {
                          id: 'REPEAT_PURCHASE_ORDERS' as LtvPurchaseModelType,
                          label: 'Repeat Orders',
                          sub: 'Multi-order D2C',
                        },
                        {
                          id: 'OTHER' as LtvPurchaseModelType,
                          label: 'Other Model',
                          sub: 'Custom hybrid',
                        },
                      ]
                    ).map((mode) => {
                      const isSelected = step4LiveMetrics.activeLtvModel === mode.id;
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          disabled={isVaultReadonly}
                          onClick={() =>
                            setStep4Data((prev) => ({
                              ...prev,
                              ltvPurchaseModel: mode.id,
                              averageCustomerRetentionMonths:
                                mode.id === 'SINGLE_ONE_TIME_PURCHASE'
                                  ? 1
                                  : mode.id === 'REPEAT_PURCHASE_ORDERS' &&
                                    prev.averageCustomerRetentionMonths > 15
                                  ? 3
                                  : mode.id === 'RECURRING_SUBSCRIPTION' &&
                                    prev.averageCustomerRetentionMonths <= 1
                                  ? 12
                                  : prev.averageCustomerRetentionMonths,
                            }))
                          }
                          className={`rounded-lg border px-2 py-1.5 text-left transition-all ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-50/90 ring-1 ring-emerald-600'
                              : 'border-slate-200 bg-slate-50/60 hover:border-emerald-300'
                          }`}
                        >
                          <div className="text-[11px] font-bold text-slate-900 truncate">
                            {mode.label}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {mode.sub}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {step4LiveMetrics.activeLtvModel === 'OTHER' && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-2.5">
                      <Label className="text-[11px] font-semibold text-slate-800">
                        Describe Your Custom LTV / Purchase Model (Required for &ldquo;Other&rdquo;):
                      </Label>
                      <Input
                        value={step4Data.otherLtvPurchaseModelText || ''}
                        disabled={isVaultReadonly}
                        onChange={(e) =>
                          setStep4Data((prev) => ({
                            ...prev,
                            otherLtvPurchaseModelText: e.target.value,
                          }))
                        }
                        placeholder="e.g., Upfront hardware purchase + annual consumable refill pack..."
                        className="mt-1 h-8 bg-white text-base sm:text-xs"
                      />
                    </div>
                  )}

                  {/* Conditional Slider or Day-1 One-Time Purchase Callout */}
                  {step4LiveMetrics.activeLtvModel === 'SINGLE_ONE_TIME_PURCHASE' ? (
                    <div
                      className={`rounded-lg border p-2.5 text-xs ${
                        step4LiveMetrics.firstOrderNetProfitAfterCac >= 0
                          ? 'border-emerald-200 bg-emerald-50/60 text-emerald-950'
                          : 'border-rose-200 bg-rose-50/70 text-rose-950'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold">
                          {step4LiveMetrics.firstOrderNetProfitAfterCac >= 0
                            ? `✅ Day-1 Profitable: +${currencySymbol}${step4LiveMetrics.firstOrderNetProfitAfterCac.toLocaleString()} net profit after CAC on Sale #1`
                            : `⚠️ First-Order Deficit: Losing -${currencySymbol}${Math.abs(step4LiveMetrics.firstOrderNetProfitAfterCac).toLocaleString()} per sale after CAC`}
                        </span>
                        <button
                          type="button"
                          disabled={isVaultReadonly}
                          onClick={() =>
                            setStep4Data((prev) => ({
                              ...prev,
                              ltvPurchaseModel: 'REPEAT_PURCHASE_ORDERS',
                              averageCustomerRetentionMonths: 2.5,
                            }))
                          }
                          className="text-[11px] font-semibold text-indigo-700 hover:underline shrink-0"
                        >
                          Model Repeat / Upsell Orders →
                        </button>
                      </div>
                      <p className="mt-1 text-[11px] opacity-90">
                        In a pure 1-time purchase model (`LTV = 1 × {currencySymbol}{step4LiveMetrics.pocketProfit}`), there is no Month 2 subscription cushion—your Cash CAC (`{currencySymbol}{step4LiveMetrics.cashCac}`) must stay strictly below single-order Pocket Profit.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-600">
                        <span>
                          {step4LiveMetrics.activeLtvModel === 'REPEAT_PURCHASE_ORDERS'
                            ? 'Average Lifetime Orders per Customer:'
                            : 'Average Customer Retention / Lifespan:'}
                        </span>
                        <span className="font-bold text-emerald-700">
                          LTV = {currencySymbol}
                          {step4LiveMetrics.ltv.toLocaleString()} ({step4LiveMetrics.effectiveLtvMultiplier} × {currencySymbol}
                          {step4LiveMetrics.pocketProfit})
                        </span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={
                          step4LiveMetrics.activeLtvModel === 'REPEAT_PURCHASE_ORDERS'
                            ? 20
                            : 60
                        }
                        step={
                          step4LiveMetrics.activeLtvModel === 'REPEAT_PURCHASE_ORDERS'
                            ? 0.5
                            : 1
                        }
                        disabled={isVaultReadonly}
                        value={step4Data.averageCustomerRetentionMonths}
                        onChange={(e) =>
                          setStep4Data((prev) => ({
                            ...prev,
                            averageCustomerRetentionMonths: Number(e.target.value),
                          }))
                        }
                        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-emerald-600"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 items-end">
                    <div>
                      <Label className="text-[11px] font-medium text-slate-600">
                        Mins / Organic Touch or Post
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        max={120}
                        disabled={isVaultReadonly}
                        value={
                          step4Data.minutesPerOrganicOutreachOrPiece === 0
                            ? ''
                            : step4Data.minutesPerOrganicOutreachOrPiece
                        }
                        onChange={(e) => {
                          const raw = e.target.value;
                          const val = raw === '' ? 0 : Math.max(0, Number(raw));
                          setStep4Data((prev) => ({
                            ...prev,
                            minutesPerOrganicOutreachOrPiece: val,
                          }));
                        }}
                        onBlur={() =>
                          setStep4Data((prev) => ({
                            ...prev,
                            minutesPerOrganicOutreachOrPiece: Math.max(
                              1,
                              Number(prev.minutesPerOrganicOutreachOrPiece) || 5
                            ),
                          }))
                        }
                        className="mt-1 h-8 bg-white text-base sm:text-xs"
                      />
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-[11px] text-slate-600 flex items-center justify-between h-8">
                      <span>Implied Time:</span>
                      <strong className="text-slate-900 font-bold">
                        {step4LiveMetrics.weeklyFounderHours} hrs/wk ({step4LiveMetrics.monthlyFounderHours} hrs/mo)
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* 4.4 VISUAL REVERSE-ENGINEERED FUNNEL & CRO LEVERAGE INSIGHT    */}
            {/* ------------------------------------------------------------- */}
            <div className="rounded-xl border border-slate-200 bg-slate-900 p-5 text-white space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-indigo-400" />
                    4.4 Live Reverse-Engineered Monthly Acquisition Funnel
                  </h3>
                  <p className="text-xs text-slate-300">
                    Working backward from{' '}
                    <strong className="text-white">
                      {Math.max(1, step4Data.targetMonthlyNewCustomers || 1).toLocaleString()} new paying customers/month
                    </strong>
                    {step4Data.deductWarmPipelineLeads && step4LiveMetrics.warmCustomerCredit > 0
                      ? ` (${step4LiveMetrics.netColdCustomersNeeded} via cold funnel + ${step4LiveMetrics.warmCustomerCredit} warm pipeline credit)`
                      : ''}{' '}
                    to exact top-of-funnel volume, spend, and cohort value:
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge className="bg-indigo-500/30 border-indigo-400/40 text-indigo-200 text-[10px]">
                    1 Cold Sale per{' '}
                    {Math.max(
                      1,
                      Math.round(
                        step4LiveMetrics.requiredTopOfFunnelTouches /
                          Math.max(1, step4LiveMetrics.netColdCustomersNeeded)
                      )
                    )}{' '}
                    Touches
                  </Badge>
                  <Badge className="bg-emerald-500/25 border-emerald-400/40 text-emerald-200 text-[10px]">
                    Cash CAC: {currencySymbol}
                    {step4LiveMetrics.cashCac.toLocaleString()} • LTV:CAC:{' '}
                    {step4LiveMetrics.ltvToCacRatio}x
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Stage 1: Top of Funnel */}
                <div className="rounded-xl border border-slate-700 bg-slate-800/90 p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300">
                        Stage 1 • Top of Funnel
                      </span>
                      <Badge className="bg-slate-700 text-slate-200 text-[10px]">
                        {step4Data.paidTrafficSharePercent}% Paid /{' '}
                        {100 - step4Data.paidTrafficSharePercent}% Organic
                      </Badge>
                    </div>
                    <div className="mt-2 text-xl font-bold text-white">
                      {step4LiveMetrics.requiredTopOfFunnelTouches.toLocaleString()}{' '}
                      <span className="text-xs font-normal text-slate-300">touches / mo</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1 border-t border-slate-700/80 text-[11px]">
                    <div className="flex items-center justify-between rounded bg-indigo-500/20 px-2.5 py-1.5 text-indigo-100">
                      <span>
                        <strong>{step4LiveMetrics.paidTouches.toLocaleString()}</strong> Paid Clicks
                      </span>
                      <span className="font-semibold text-indigo-200">
                        {currencySymbol}
                        {step4LiveMetrics.impliedPaidMediaSpend.toLocaleString()}/mo (@{' '}
                        {currencySymbol}
                        {Number(step4Data.estimatedCostPerClickOrTouch || 0).toFixed(2)})
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded bg-emerald-500/20 px-2.5 py-1.5 text-emerald-100">
                      <span>
                        <strong>{step4LiveMetrics.organicTouches.toLocaleString()}</strong> Organic
                      </span>
                      <span className="font-semibold text-emerald-200">
                        {step4LiveMetrics.weeklyFounderHours} hrs/wk ({step4LiveMetrics.monthlyFounderHours} hrs/mo)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stage 2: Middle of Funnel (Qualified Leads) */}
                <div className="rounded-xl border border-indigo-500/40 bg-indigo-950/60 p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300">
                        Stage 2 • Qualified Leads
                      </span>
                      <Badge className="bg-indigo-500/30 text-indigo-100 text-[10px]">
                        {step4Data.visitorToLeadConversionPercent}% Touch-to-Lead
                      </Badge>
                    </div>
                    <div className="mt-2 text-xl font-bold text-white">
                      {step4LiveMetrics.requiredQualifiedLeads.toLocaleString()}{' '}
                      <span className="text-xs font-normal text-indigo-200">leads / mo</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1 border-t border-indigo-500/30 text-[11px]">
                    <div className="flex items-center justify-between rounded bg-indigo-900/60 px-2.5 py-1.5 text-indigo-100">
                      <span>Lead Source Mix:</span>
                      <span className="font-semibold">
                        {step4LiveMetrics.paidLeads.toLocaleString()} Paid •{' '}
                        {step4LiveMetrics.organicLeads.toLocaleString()} Organic
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded bg-indigo-900/60 px-2.5 py-1.5 text-indigo-100">
                      <span>Cost Per Lead (CPL):</span>
                      <span className="font-semibold text-indigo-200">
                        {currencySymbol}
                        {step4LiveMetrics.cashCostPerLead.toLocaleString()} Cash CPL
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stage 3: Bottom of Funnel (New Customers & Cohort Value) */}
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/50 p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                        Stage 3 • New Customers
                      </span>
                      <Badge className="bg-emerald-500/30 text-emerald-100 text-[10px]">
                        {step4Data.leadToCustomerConversionPercent}% Lead Close Rate
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between gap-2">
                      <div className="text-xl font-bold text-emerald-300">
                        {Math.max(1, step4Data.targetMonthlyNewCustomers || 1).toLocaleString()}{' '}
                        <span className="text-xs font-normal text-emerald-100">customers / mo</span>
                      </div>
                      {step4Data.deductWarmPipelineLeads &&
                        step4LiveMetrics.warmCustomerCredit > 0 && (
                          <span className="text-[10px] font-medium text-emerald-200">
                            ({step4LiveMetrics.netColdCustomersNeeded} Cold +{' '}
                            {step4LiveMetrics.warmCustomerCredit} Warm)
                          </span>
                        )}
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1 border-t border-emerald-500/30 text-[11px]">
                    <div className="flex items-center justify-between rounded bg-emerald-900/50 px-2.5 py-1.5 text-emerald-100">
                      <span>Month-1 Pocket Profit:</span>
                      <span className="font-bold text-white">
                        {currencySymbol}
                        {step4LiveMetrics.monthlyCohortPocketProfit.toLocaleString()}/mo
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded bg-emerald-900/50 px-2.5 py-1.5 text-emerald-100">
                      <span>
                        Cohort LTV ({step4LiveMetrics.effectiveLtvMultiplier}x{' '}
                        {step4LiveMetrics.activeLtvModel === 'SINGLE_ONE_TIME_PURCHASE'
                          ? 'Order'
                          : step4LiveMetrics.activeLtvModel === 'REPEAT_PURCHASE_ORDERS'
                          ? 'Orders'
                          : 'Mo'}
                        ):
                      </span>
                      <span className="font-bold text-emerald-300">
                        {currencySymbol}
                        {step4LiveMetrics.monthlyCohortLtv.toLocaleString()} ({currencySymbol}
                        {step4LiveMetrics.ltv.toLocaleString()}/cust)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conversion Leverage Insight Callout */}
              {step4LiveMetrics.monthlyAdSavingsFromCro > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-indigo-400/30 bg-indigo-950/80 px-3.5 py-2.5 text-xs text-indigo-100">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 shrink-0 text-amber-400" />
                    <span>
                      <strong> Positioning &amp; Conversion Leverage:</strong> Improving your visitor-to-lead conversion rate by just <strong>+1.5%</strong> (from {step4Data.visitorToLeadConversionPercent}% to {(step4Data.visitorToLeadConversionPercent + 1.5).toFixed(1)}% using your Step 1 3-Second Hook &amp; Step 3 Proof) saves <strong>{currencySymbol}{step4LiveMetrics.monthlyAdSavingsFromCro.toLocaleString()}/month</strong> ({currencySymbol}{(step4LiveMetrics.monthlyAdSavingsFromCro * 12).toLocaleString()}/year) in paid ad clicks!
                    </span>
                  </div>
                </div>
              )}

              {/* Paid Ads Strategy & Commercial Viability Mode (Reversible Toggle) */}
              <div
                className={`rounded-xl border p-4 text-xs shadow-xs space-y-3 transition-all ${
                  isOptedOutOfPaid
                    ? 'border-emerald-300 bg-emerald-50/90 text-emerald-950'
                    : step4LiveMetrics.isUnitEconomicsUnderwater
                    ? 'border-rose-300 bg-rose-50/90 text-rose-950'
                    : 'border-indigo-200 bg-indigo-50/70 text-indigo-950'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    {isOptedOutOfPaid ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    ) : step4LiveMetrics.isUnitEconomicsUnderwater ? (
                      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                    ) : (
                      <Zap className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">
                          {isOptedOutOfPaid
                            ? 'Paid Advertising Opted Out — 100% Organic & Outbound Model'
                            : step4LiveMetrics.isUnitEconomicsUnderwater
                            ? 'Negative Unit Economics Detected: Paid Ads Lose Money Per Sale'
                            : `Blended Customer Acquisition Model Active (${step4Data.paidTrafficSharePercent}% Paid)`}
                        </span>
                        <Badge
                          className={`text-[10px] font-semibold ${
                            isOptedOutOfPaid
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : step4LiveMetrics.isUnitEconomicsUnderwater
                              ? 'bg-rose-100 text-rose-900 border-rose-300'
                              : 'bg-indigo-100 text-indigo-900 border-indigo-300'
                          }`}
                        >
                          {isOptedOutOfPaid
                            ? 'Grant-Safe Mode'
                            : step4LiveMetrics.isUnitEconomicsUnderwater
                            ? 'Audit Red Flag'
                            : 'Active Blended'}
                        </Badge>
                      </div>

                      <p className="leading-relaxed text-xs opacity-90">
                        {isOptedOutOfPaid
                          ? 'Paid ad spend is zeroed and excluded from downstream Module J overheads. Your Grant Narrative (Step 4.7 & Step 5) formally documents this deliberate decision to protect trading margins and grant cash.'
                          : step4LiveMetrics.isUnitEconomicsUnderwater
                          ? step4LiveMetrics.activeLtvModel === 'SINGLE_ONE_TIME_PURCHASE'
                            ? `With a Cash CAC of ${currencySymbol}${step4LiveMetrics.cashCac.toLocaleString()} and single-order Pocket Profit of only ${currencySymbol}${step4LiveMetrics.pocketProfit.toLocaleString()}, you are losing -${currencySymbol}${Math.abs(step4LiveMetrics.firstOrderNetProfitAfterCac).toLocaleString()} in trading cash on every customer order. Underwriters penalize financial plans that allocate scarce startup cash to negative-return performance ads.`
                            : `With an LTV:CAC ratio of ${step4LiveMetrics.ltvToCacRatio}x (below the healthy 3.0x threshold), paid acquisition is consuming too much lifetime profit and takes ${step4LiveMetrics.paybackMonths} months to recover.`
                          : `Operating with an LTV:CAC ratio of ${step4LiveMetrics.ltvToCacRatio}x and ${currencySymbol}${step4LiveMetrics.cashCac.toLocaleString()} Cash CAC across a blended funnel.`}
                      </p>

                      {!isOptedOutOfPaid && step4LiveMetrics.isUnitEconomicsUnderwater && (
                        <p className="text-[11px] text-rose-800 font-medium">
                          💡 <strong>Assessor Recommendation:</strong> Toggle the switch below to <strong>Opt Out</strong> and reallocate founder effort to 100% organic, outbound, and partner distribution in Year 1.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Reversible Toggle Switch & 2-Segment Control */}
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={!isOptedOutOfPaid}
                      disabled={isVaultReadonly}
                      onClick={() => handleTogglePaidAdsStrategy(isOptedOutOfPaid)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        !isOptedOutOfPaid ? 'bg-indigo-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                          !isOptedOutOfPaid ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>

                    <div className="inline-flex rounded-lg border border-slate-300 bg-white p-1 shadow-xs">
                      <button
                        type="button"
                        disabled={isVaultReadonly}
                        onClick={() => handleTogglePaidAdsStrategy(true)}
                        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                          !isOptedOutOfPaid
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Zap className="h-3.5 w-3.5" />
                        Paid Active
                      </button>
                      <button
                        type="button"
                        disabled={isVaultReadonly}
                        onClick={() => handleTogglePaidAdsStrategy(false)}
                        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                          isOptedOutOfPaid
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Opt Out (Organic)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* 4.5 4 LIVE UNIT ECONOMICS & GRANT VIABILITY DIAGNOSTIC CARDS   */}
            {/* ------------------------------------------------------------- */}
            <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/70 via-white to-slate-50/40 p-5 sm:p-6 shadow-xs space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200/80 pb-3.5">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-200/60 text-indigo-700 shadow-2xs">
                      <DollarSign className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight sm:text-base">
                      4.5 Live Acquisition Unit Economics &amp; Grant Viability Diagnostics
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Automated sanity checks evaluated against official Irish LEO, Enterprise Ireland, and UK Start Up Loans / Innovate UK underwriting criteria.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant="outline"
                    className="border-slate-300 bg-white/90 text-[10px] font-semibold text-slate-700 shadow-2xs"
                  >
                    4 Underwriting Diagnostics
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {/* Card 1: Cash CAC & Cost Per Lead */}
                <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-xs flex flex-col justify-between transition-all hover:border-slate-300 hover:shadow-sm">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        1. Cash CAC
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] border-indigo-200 bg-indigo-50/80 text-indigo-700 font-semibold"
                      >
                        Real Cash Cost
                      </Badge>
                    </div>

                    <div className="mt-3.5 space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                          {currencySymbol}
                          {step4LiveMetrics.cashCac.toLocaleString()}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">per customer</span>
                      </div>

                      <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1.5 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Cost Per Lead (CPL):</span>
                        <strong className="text-slate-900 font-bold">
                          {currencySymbol}
                          {step4LiveMetrics.cashCostPerLead.toLocaleString()}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 border-t border-slate-100 pt-2.5 text-[11px] text-slate-500 leading-normal">
                    Based on <strong className="text-slate-700">{currencySymbol}{step4LiveMetrics.lineItemsTotalSpend.toLocaleString()}/mo</strong> cash marketing spend ÷ <strong className="text-slate-700">{Math.max(1, step4Data.targetMonthlyNewCustomers || 1).toLocaleString()}</strong> new customers.
                  </p>
                </div>

                {/* Card 2: Pocket-Profit LTV : CAC Ratio */}
                <div
                  className={`rounded-xl border p-4.5 shadow-xs flex flex-col justify-between transition-all ${
                    step4LiveMetrics.ltvToCacRatio < 1.5
                      ? 'border-rose-200 bg-gradient-to-b from-rose-50/60 to-white hover:border-rose-300'
                      : step4LiveMetrics.ltvToCacRatio < 3.0
                      ? 'border-amber-200 bg-gradient-to-b from-amber-50/60 to-white hover:border-amber-300'
                      : 'border-emerald-200 bg-gradient-to-b from-emerald-50/50 to-white hover:border-emerald-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                        2. LTV : CAC Ratio
                      </span>
                      {step4LiveMetrics.ltvToCacRatio < 1.5 ? (
                        <Badge className="bg-rose-100 text-rose-800 border-rose-300 text-[10px] font-semibold">
                          Cash Furnace (&lt;1.5x)
                        </Badge>
                      ) : step4LiveMetrics.ltvToCacRatio < 3.0 ? (
                        <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] font-semibold">
                          Tight Margin (1.5x–2.9x)
                        </Badge>
                      ) : step4LiveMetrics.ltvToCacRatio <= 10.0 ? (
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-semibold">
                          Grant Sweet Spot (3x+)
                        </Badge>
                      ) : (
                        <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300 text-[10px] font-semibold">
                          High Organic Leverage
                        </Badge>
                      )}
                    </div>

                    <div className="mt-3.5 space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                          {step4LiveMetrics.ltvToCacRatio}x
                        </span>
                        <span className="text-xs font-semibold text-slate-600">
                          LTV: {currencySymbol}{step4LiveMetrics.ltv.toLocaleString()}
                        </span>
                      </div>

                      <div className="rounded-lg bg-white/80 border border-slate-200/60 px-2.5 py-1.5 text-xs text-slate-600">
                        {currencySymbol}
                        {step4LiveMetrics.pocketProfit} Pocket Profit ×{' '}
                        {step4LiveMetrics.effectiveLtvMultiplier}{' '}
                        {step4LiveMetrics.ltvMultiplierUnitLabel}
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 border-t border-slate-200/60 pt-2.5 text-[11px] text-slate-600 leading-normal">
                    {step4LiveMetrics.ltvToCacRatio < 3.0
                      ? step4LiveMetrics.activeLtvModel === 'SINGLE_ONE_TIME_PURCHASE'
                        ? 'Tip: For 1-time purchases, bundle a higher-AOV tier in Mod H, lower paid CAC, or add a repeat consumable/upsell.'
                        : 'Tip: Increase retention/repeat orders, raise net price in Mod H, or shift toward higher-converting warm channels.'
                      : 'Strong unit economics: Each customer generates >3x their acquisition cost in net Pocket Profit.'}
                  </p>
                </div>

                {/* Card 3: CAC Payback Period (or Day-1 Profit After CAC for One-Time Purchases) */}
                <div
                  className={`rounded-xl border p-4.5 shadow-xs flex flex-col justify-between transition-all ${
                    step4LiveMetrics.activeLtvModel === 'SINGLE_ONE_TIME_PURCHASE'
                      ? step4LiveMetrics.firstOrderNetProfitAfterCac < 0
                        ? 'border-rose-200 bg-gradient-to-b from-rose-50/60 to-white hover:border-rose-300'
                        : 'border-emerald-200 bg-gradient-to-b from-emerald-50/50 to-white hover:border-emerald-300'
                      : step4LiveMetrics.paybackMonths > 12
                      ? 'border-rose-200 bg-gradient-to-b from-rose-50/60 to-white hover:border-rose-300'
                      : step4LiveMetrics.paybackMonths > 6
                      ? 'border-amber-200 bg-gradient-to-b from-amber-50/60 to-white hover:border-amber-300'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        {step4LiveMetrics.activeLtvModel === 'SINGLE_ONE_TIME_PURCHASE'
                          ? '3. Day-1 Order Profit'
                          : step4LiveMetrics.activeLtvModel === 'REPEAT_PURCHASE_ORDERS'
                          ? '3. Orders to Payback'
                          : '3. CAC Payback'}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold ${
                          step4LiveMetrics.activeLtvModel === 'SINGLE_ONE_TIME_PURCHASE'
                            ? step4LiveMetrics.firstOrderNetProfitAfterCac >= 0
                              ? 'border-emerald-300 bg-emerald-100 text-emerald-800'
                              : 'border-rose-300 bg-rose-100 text-rose-800'
                            : 'border-slate-300 text-slate-700'
                        }`}
                      >
                        {step4LiveMetrics.activeLtvModel === 'SINGLE_ONE_TIME_PURCHASE'
                          ? step4LiveMetrics.firstOrderNetProfitAfterCac >= 0
                            ? 'Day-1 Profitable'
                            : 'Loss on Sale #1'
                          : step4LiveMetrics.activeLtvModel === 'REPEAT_PURCHASE_ORDERS'
                          ? step4LiveMetrics.paybackMonths <= 1
                            ? 'Profitable on Order #1'
                            : `Order #${Math.ceil(step4LiveMetrics.paybackMonths)} Breakeven`
                          : step4LiveMetrics.paybackMonths <= 3
                          ? 'Fast Recovery'
                          : step4LiveMetrics.paybackMonths <= 9
                          ? 'Standard Runway'
                          : 'Heavy Cash Trough'}
                      </Badge>
                    </div>

                    <div className="mt-3.5 space-y-2">
                      {step4LiveMetrics.activeLtvModel === 'SINGLE_ONE_TIME_PURCHASE' ? (
                        <>
                          <div className="flex items-baseline gap-1.5">
                            <span
                              className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                                step4LiveMetrics.firstOrderNetProfitAfterCac >= 0
                                  ? 'text-emerald-700'
                                  : 'text-rose-700'
                              }`}
                            >
                              {step4LiveMetrics.firstOrderNetProfitAfterCac >= 0 ? '+' : '-'}
                              {currencySymbol}
                              {Math.abs(step4LiveMetrics.firstOrderNetProfitAfterCac).toLocaleString()}
                            </span>
                            <span className="text-xs font-semibold text-slate-600">
                              net profit / sale
                            </span>
                          </div>

                          <div className="rounded-lg bg-white/80 border border-slate-200/60 px-2.5 py-1.5 text-xs text-slate-600">
                            {currencySymbol}
                            {step4LiveMetrics.pocketProfit} Pocket Profit − {currencySymbol}
                            {step4LiveMetrics.cashCac} Cash CAC
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                              {step4LiveMetrics.paybackMonths}
                            </span>
                            <span className="text-xs font-semibold text-slate-600">
                              {step4LiveMetrics.activeLtvModel === 'REPEAT_PURCHASE_ORDERS'
                                ? 'orders to recover CAC'
                                : 'months to recover CAC'}
                            </span>
                          </div>

                          <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1.5 text-xs text-slate-600">
                            {currencySymbol}
                            {step4LiveMetrics.cashCac} Cash CAC ÷ {currencySymbol}
                            {step4LiveMetrics.pocketProfit}{' '}
                            {step4LiveMetrics.activeLtvModel === 'REPEAT_PURCHASE_ORDERS'
                              ? 'profit/order'
                              : 'profit/mo'}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <p className="mt-4 border-t border-slate-100 pt-2.5 text-[11px] text-slate-500 leading-normal">
                    {step4LiveMetrics.activeLtvModel === 'SINGLE_ONE_TIME_PURCHASE'
                      ? step4LiveMetrics.firstOrderNetProfitAfterCac >= 0
                        ? 'Every first-time purchase immediately recovers its Cash CAC and contributes positive cashflow on Day 1.'
                        : 'Warning: With no repeat orders, Cash CAC exceeds single-order Pocket Profit. Lower ad spend, raise AOV, or add an upsell.'
                      : 'Feeds your Module J 36-Month Cashflow Trough: how long cash is tied up before a customer turns cash-positive.'}
                  </p>
                </div>

                {/* Card 4: Founder Bandwidth Reality Check */}
                <div
                  className={`rounded-xl border p-4.5 shadow-xs flex flex-col justify-between transition-all ${
                    step4LiveMetrics.weeklyFounderHours > 25
                      ? 'border-amber-200 bg-gradient-to-b from-amber-50/60 to-white hover:border-amber-300'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        4. Founder Hustle
                      </span>
                      {step4LiveMetrics.weeklyFounderHours > 25 ? (
                        <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] font-semibold">
                          Bandwidth Overload!
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-semibold">
                          Feasible Cadence
                        </Badge>
                      )}
                    </div>

                    <div className="mt-3.5 space-y-2">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                          {step4LiveMetrics.weeklyFounderHours}
                        </span>
                        <span className="text-xs font-semibold text-slate-600">
                          hrs / week ({step4LiveMetrics.monthlyFounderHours} hrs/mo)
                        </span>
                      </div>

                      <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1.5 text-xs text-slate-600">
                        For {step4LiveMetrics.organicTouches.toLocaleString()} organic touches/mo
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 border-t border-slate-100 pt-2.5 text-[11px] text-slate-500 leading-normal">
                    {step4LiveMetrics.weeklyFounderHours > 25
                      ? 'Warning: >25 hrs/week of manual outreach risks starving product build (Mod D). Increase conversion or automate.'
                      : 'Realistic weekly founder marketing commitment alongside product and operations.'}
                  </p>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* 4.6 3-BUCKET MONTHLY MARKETING BUDGET & GRANT ELIGIBILITY      */}
            {/* ------------------------------------------------------------- */}
            <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-indigo-600" />
                    4.6 Monthly Marketing Budget Builder &amp; Grant Eligibility Guardrail
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Break down your monthly cash marketing spend across Paid Media, Growth Stack Tools, and Content/Events/PR.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {step4LiveMetrics.paidMediaBucketSpend !==
                    step4LiveMetrics.impliedPaidMediaSpend && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isVaultReadonly}
                      onClick={handleSyncPaidAdLineItemToSlider}
                      className="h-8 border-indigo-300 bg-indigo-50 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                    >
                      <RefreshCw className="mr-1.5 h-3 w-3" />
                      Sync Ad Row to Slider ({currencySymbol}
                      {step4LiveMetrics.impliedPaidMediaSpend.toLocaleString()}/mo)
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isVaultReadonly}
                    onClick={handleAddBudgetLineItem}
                    className="h-8 border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Add Budget Line Item
                  </Button>
                </div>
              </div>

              {/* Grant Assessor Guardrail Callout */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-950">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <div>
                      <span className="font-bold">
                        IE LEO / Enterprise Ireland &amp; UK Innovate UK Ad-Spend Rule:
                      </span>{' '}
                      Ongoing Pay-Per-Click ad spend ({currencySymbol}
                      {step4LiveMetrics.ineligibleAdSpendTotal.toLocaleString()}/mo) is{' '}
                      <strong>ineligible for grant reimbursement</strong> and must be funded from trading revenue or working-capital loans. Digital capability tools, CRM setup, and export trade show collateral ({currencySymbol}
                      {step4LiveMetrics.grantEligibleSpendTotal.toLocaleString()}/mo) can qualify for grant support.
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 text-[10px]">
                      Grant-Friendly: {currencySymbol}
                      {step4LiveMetrics.grantEligibleSpendTotal.toLocaleString()}/mo
                    </Badge>
                    <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[10px]">
                      Self-Funded Ads: {currencySymbol}
                      {step4LiveMetrics.ineligibleAdSpendTotal.toLocaleString()}/mo
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Line Items List */}
              <div className="space-y-3">
                {step4Data.budgetLineItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                      {/* Bucket Selector (includes OTHER per GEMINI.md Rule 1.5) */}
                      <div className="sm:col-span-3">
                        <Label className="text-[11px] font-semibold text-slate-600">
                          Budget Bucket
                        </Label>
                        <select
                          disabled={isVaultReadonly}
                          value={item.bucket}
                          onChange={(e) =>
                            handleUpdateBudgetLineItem(item.id, {
                              bucket: e.target.value as MarketingBudgetBucketType,
                            })
                          }
                          className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-base sm:text-xs font-medium text-slate-900"
                        >
                          <option value="PAID_MEDIA_ADS">1. Paid Media &amp; Performance Ads</option>
                          <option value="GROWTH_STACK_TOOLS">2. Growth Stack, CRM &amp; SEO Tools</option>
                          <option value="CONTENT_EVENTS_PR">3. Trade Shows, Content &amp; Samples</option>
                          <option value="OTHER">4. Other Marketing Activity</option>
                        </select>
                      </div>

                      {/* Channel / Tool Name */}
                      <div className="sm:col-span-4">
                        <Label className="text-[11px] font-semibold text-slate-600">
                          Specific Channel, Campaign, or Tool
                        </Label>
                        <Input
                          value={item.channelOrToolName}
                          disabled={isVaultReadonly}
                          onChange={(e) =>
                            handleUpdateBudgetLineItem(item.id, {
                              channelOrToolName: e.target.value,
                            })
                          }
                          placeholder="e.g., LinkedIn Sponsored InMail / HubSpot Starter..."
                          className="mt-1 h-9 bg-white text-base sm:text-xs"
                        />
                      </div>

                      {/* Monthly Spend */}
                      <div className="sm:col-span-2">
                        <Label className="text-[11px] font-semibold text-slate-600">
                          Monthly Spend ({currencySymbol})
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          step={10}
                          disabled={isVaultReadonly}
                          value={item.monthlySpend}
                          onChange={(e) =>
                            handleUpdateBudgetLineItem(item.id, {
                              monthlySpend: Math.max(0, Number(e.target.value) || 0),
                            })
                          }
                          className="mt-1 h-9 bg-white font-bold text-base sm:text-xs"
                        />
                      </div>

                      {/* Grant Eligibility Tag */}
                      <div className="sm:col-span-3 flex items-end gap-2">
                        <div className="flex-1">
                          <Label className="text-[11px] font-semibold text-slate-600">
                            Grant / Funding Tag
                          </Label>
                          <select
                            disabled={isVaultReadonly}
                            value={item.grantEligibilityStatus}
                            onChange={(e) =>
                              handleUpdateBudgetLineItem(item.id, {
                                grantEligibilityStatus:
                                  e.target.value as MarketingGrantEligibilityStatus,
                              })
                            }
                            className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-base sm:text-xs text-slate-800"
                          >
                            <option value="ELIGIBLE_CAPABILITY_OR_EXPORT">
                              ✅ Grant-Friendly (Digital / Export)
                            </option>
                            <option value="INELIGIBLE_ONGOING_AD_SPEND">
                              ⚠️ Self-Funded (Ongoing Ad Spend)
                            </option>
                            <option value="WORKING_CAPITAL_LOAN_ELIGIBLE">
                              🏦 Loan Eligible (Start Up Loan / Microfinance)
                            </option>
                          </select>
                        </div>

                        {step4Data.budgetLineItems.length > 1 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={isVaultReadonly}
                            onClick={() => handleRemoveBudgetLineItem(item.id)}
                            className="h-9 px-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {item.bucket === 'OTHER' && (
                      <div className="rounded-lg border border-indigo-200 bg-indigo-50/40 p-2.5">
                        <Label className="text-[11px] font-semibold text-slate-700">
                          Specify Custom Marketing Bucket Category:
                        </Label>
                        <Input
                          value={item.otherBucketText || ''}
                          disabled={isVaultReadonly}
                          onChange={(e) =>
                            handleUpdateBudgetLineItem(item.id, {
                              otherBucketText: e.target.value,
                            })
                          }
                          placeholder="e.g., Co-Marketing Partner Rebates / Pop-Up Retail Activation..."
                          className="mt-1 h-8 bg-white text-base sm:text-xs"
                        />
                      </div>
                    )}

                    <div>
                      <Input
                        value={item.notes}
                        disabled={isVaultReadonly}
                        onChange={(e) =>
                          handleUpdateBudgetLineItem(item.id, {
                            notes: e.target.value,
                          })
                        }
                        placeholder="Expected ROI / conversion note (e.g., Drives ~250 high-intent clicks/mo or supports trade show demo booth)..."
                        className="h-8 bg-slate-50/70 text-base sm:text-xs text-slate-600"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary Footer & Module J Sync Toggle */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-indigo-200 bg-white p-4">
                <div className="flex flex-wrap items-center gap-6">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Total Monthly Marketing Budget
                    </div>
                    <div className="text-lg font-extrabold text-slate-900">
                      {currencySymbol}
                      {step4LiveMetrics.lineItemsTotalSpend.toLocaleString()}
                      <span className="text-xs font-normal text-slate-500">/mo</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Annualized Year 1 Marketing Spend
                    </div>
                    <div className="text-lg font-bold text-indigo-700">
                      {currencySymbol}
                      {(step4LiveMetrics.lineItemsTotalSpend * 12).toLocaleString()}
                      <span className="text-xs font-normal text-slate-500">/yr</span>
                    </div>
                  </div>
                  {/* Reversible Module J Ad Spend Exclusion Toggle Switch */}
                  <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={step4Data.excludePaidAdsFromModuleJ}
                      disabled={isVaultReadonly}
                      onClick={() => {
                        const willExclude = !step4Data.excludePaidAdsFromModuleJ;
                        if (willExclude) {
                          handleOptOutOfPaidAds();
                        } else {
                          handleReactivatePaidAds();
                        }
                      }}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        step4Data.excludePaidAdsFromModuleJ ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                          step4Data.excludePaidAdsFromModuleJ ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <div>
                      <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                        <span>{step4Data.excludePaidAdsFromModuleJ ? 'Paid Ads Excluded from Module J' : 'Paid Ads Included in Module J'}</span>
                        {step4Data.excludePaidAdsFromModuleJ && (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[9px] px-1.5 py-0">
                            Grant-Safe
                          </Badge>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {step4Data.excludePaidAdsFromModuleJ
                          ? `Syncing only non-ad tools: ${currencySymbol}${step4LiveMetrics.effectiveModuleJMonthlySpend.toLocaleString()}/mo`
                          : `Syncing full marketing budget: ${currencySymbol}${step4LiveMetrics.effectiveModuleJMonthlySpend.toLocaleString()}/mo`}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isVaultReadonly}
                  onClick={() =>
                    setStep4Data((prev) => ({
                      ...prev,
                      syncedToModuleJOverheads: !prev.syncedToModuleJOverheads,
                    }))
                  }
                  className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-all ${
                    step4Data.syncedToModuleJOverheads
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                      : 'border-indigo-200 bg-indigo-50/70 text-indigo-900 hover:bg-indigo-100'
                  }`}
                >
                  {step4Data.syncedToModuleJOverheads ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <ArrowRight className="h-4 w-4 text-indigo-600" />
                  )}
                  <span>
                    {step4Data.syncedToModuleJOverheads
                      ? `Synced to Module J Overheads (${currencySymbol}${step4LiveMetrics.effectiveModuleJMonthlySpend.toLocaleString()}/mo${
                          step4Data.excludePaidAdsFromModuleJ ? ' • Ads Excluded' : ''
                        })`
                      : `Sync Monthly Budget to Module J Overheads (${currencySymbol}${step4LiveMetrics.effectiveModuleJMonthlySpend.toLocaleString()}/mo)`}
                  </span>
                </button>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* 4.7 GRANT-READY CAC & MARKETING BUDGET NARRATIVE               */}
            {/* ------------------------------------------------------------- */}
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Label className="text-xs font-bold text-slate-900">
                    4.7 Grant &amp; Investor CAC Justification Narrative (Auto-Compiled for Module L Business Plan)
                  </Label>
                  <p className="text-[11px] text-slate-500">
                    Explains how your marketing budget, conversion rates, and Pocket-Profit LTV prove commercial scalability.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isVaultReadonly}
                  onClick={handleGenerateRefreshStep4Narrative}
                  className="h-7 border-indigo-200 bg-indigo-50/60 px-2.5 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100"
                >
                  <RefreshCw className="mr-1 h-3 w-3" />
                  Sync Narrative with Current Sliders
                </Button>
              </div>

              <textarea
                rows={4}
                disabled={isVaultReadonly}
                value={step4Data.cacAndBudgetNarrative}
                onChange={(e) =>
                  setStep4Data((prev) => ({
                    ...prev,
                    cacAndBudgetNarrative: e.target.value,
                  }))
                }
                placeholder="Summarize your reverse-engineered funnel, Cash CAC, Pocket-Profit LTV, and payback period..."
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-base sm:text-xs text-slate-800 shadow-2xs focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Momentum Protection: Park It in Open Questions */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Bookmark className="h-4 w-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-900">
                    Unsure about your exact CPC or conversion rate? Park It in Open Questions
                  </span>
                </div>
                {parkingSuccessStep4 && (
                  <span className="text-xs font-medium text-emerald-700">
                    ✓ Parked in Open Questions!
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-col sm:flex-row gap-2">
                <Input
                  value={parkingQuestionTextStep4}
                  disabled={isVaultReadonly}
                  onChange={(e) => setParkingQuestionTextStep4(e.target.value)}
                  placeholder="e.g., Run a €150 LinkedIn/Google test campaign in Month 1 to validate whether CPC is closer to €1.50 or €3.00..."
                  className="flex-1 bg-white text-base sm:text-xs"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleParkStep4Question}
                  disabled={
                    !parkingQuestionTextStep4.trim() ||
                    isParkingQuestionStep4 ||
                    isVaultReadonly
                  }
                  className="shrink-0 border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  Park Question
                </Button>
              </div>
            </div>

            {/* Bottom Step 4 Save & Next Step Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <div className="text-xs text-slate-500">
                {isStep4Complete ? (
                  <span className="font-medium text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    Step 4 Reverse-Engineered Budget &amp; CAC Ready
                  </span>
                ) : (
                  <span>
                    Configure at least 1 budget line item and your CAC narrative to complete Step 4.
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveStep4}
                  disabled={saveStatusStep4 === 'saving' || isVaultReadonly}
                  className="bg-indigo-600 text-xs font-medium text-white hover:bg-indigo-700"
                >
                  {saveStatusStep4 === 'saving' ? (
                    <>
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : saveStatusStep4 === 'saved' ? (
                    <>
                      <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-300" />
                      Saved!
                    </>
                  ) : (
                    'Save Budget & CAC Model'
                  )}
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await handleSaveStep4();
                    setOpenStep(5);
                    window.scrollTo({ top: 450, behavior: 'smooth' });
                  }}
                  className="border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Next Step: Marketing Overview Brief
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STEP 5 / OVERVIEW: MODULE I EXECUTIVE BRIEF                   */}
      {/* ------------------------------------------------------------- */}
      {openStep !== 5 && openStep !== 'ALL' ? (
        <div
          id="module-i-step-5"
          onClick={() => setOpenStep(5)}
          className="group scroll-mt-24 cursor-pointer rounded-xl border border-indigo-200 bg-gradient-to-r from-white via-indigo-50/40 to-violet-50/40 p-4 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold bg-indigo-600 text-white">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                  Step 5: Marketing &amp; Customer Acquisition Executive Brief
                </h2>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  1-Page Go-To-Market summary, funnel unit economics waterfall, blind-spot reviews, and direct export to Module L &amp; J.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Badge
                variant="outline"
                className={`text-[10px] shrink-0 ${
                  completedCoreStepsCount === 4
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : 'border-indigo-200 text-indigo-700'
                }`}
              >
                {completedCoreStepsCount}/4 Sections Ready
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 shrink-0 px-2.5 text-xs font-medium text-indigo-600 group-hover:bg-indigo-50"
              >
                {completedCoreStepsCount === 4 ? 'Review Overview' : 'Open Overview'}
                <ChevronDown className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Card id="module-i-step-5" className="scroll-mt-24 rounded-xl border border-indigo-200 bg-white shadow-xs">
          <CardHeader className="border-b border-slate-100 pb-4">
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
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base font-bold text-slate-900">
                      Marketing &amp; Customer Acquisition Executive Brief (Overview)
                    </CardTitle>
                    <Badge className="bg-indigo-100 text-indigo-800 text-[10px] shrink-0">
                      Module I Overview
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
                    Review your complete Go-To-Market architecture, verify acquisition unit economics, and audit commercial channel vulnerabilities for grant committees, accelerators, and early investors.
                  </CardDescription>
                </div>
              </div>

              {openStep !== 'ALL' && (
                <div className="flex shrink-0 items-center">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setOpenStep(0)}
                    className="text-xs text-slate-500 hover:bg-slate-100"
                  >
                    Collapse Step
                    <ChevronUp className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>

            {/* Dedicated 4-Layer Support Strip */}
            <div className="mt-3 flex flex-wrap items-center gap-2 pt-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setActiveWhyCard((prev) => (prev === 5 ? null : 5))}
                className="h-7 border-indigo-200 text-[11px] font-medium text-indigo-700 hover:bg-indigo-50"
              >
                <HelpCircle className="mr-1 h-3.5 w-3.5" />
                Why Are We Asking This?
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setActiveExampleCard((prev) => (prev === 5 ? null : 5))}
                className="h-7 border-emerald-200 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50"
              >
                <Lightbulb className="mr-1 h-3.5 w-3.5" />
                Show Me an Example
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleGenerateAiMarketingBrief}
                disabled={isGeneratingAiBrief || isVaultReadonly}
                className="h-7 border-violet-200 bg-violet-50/60 text-[11px] font-medium text-violet-700 hover:bg-violet-100"
              >
                {isGeneratingAiBrief ? (
                  <>
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin text-violet-600" />
                    Auditing Marketing Blind Spots...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-1.5 h-3.5 w-3.5 text-violet-600" />
                    Auto-Generate / Audit Commercial Defense with AI
                  </>
                )}
              </Button>
            </div>

            {/* Micro-Coaching Drawers */}
            {activeWhyCard === 5 && (
              <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50/70 p-3.5 text-xs text-indigo-900">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <p className="font-semibold text-indigo-950">
                      Why Underwriters &amp; Grant Assessors Scrutinize Your Go-To-Market Brief:
                    </p>
                    <p className="leading-relaxed text-indigo-900/90">
                      Early-stage startup failure is rarely caused by failure to build product; it is caused by failure to acquire customers profitably. Grant committees (LEO Feasibility/Priming, Enterprise Ireland, UK Innovate UK) and seed investors review your marketing brief for four critical signals:
                    </p>
                    <ul className="mt-1 list-disc pl-4 space-y-0.5 text-indigo-900/90">
                      <li>
                        <strong>Realistic Customer Acquisition Engine:</strong> Over-reliance on paid Facebook/Google ads before achieving product-market fit is the #1 reason grant assessors mark marketing plans down as high-risk.
                      </li>
                      <li>
                        <strong>Unit Economics Viability (LTV:CAC):</strong> Demonstrating that each acquired customer contributes more gross profit than the cash and founder sweat equity spent acquiring them.
                      </li>
                      <li>
                        <strong>Concrete First 10 Conversion Plan:</strong> Showing tangible warm prospects and pilot terms rather than hypothetical broad market hopes.
                      </li>
                      <li>
                        <strong>Statutory Grant Compliance:</strong> Verifying that ongoing recurring ad spend is isolated from grant-eligible tools, consultancy, and digital creative packages.
                      </li>
                    </ul>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveWhyCard(null)}
                    className="text-indigo-400 hover:text-indigo-700"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {activeExampleCard === 5 && (
              <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/70 p-3.5 text-xs text-emerald-950">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <p className="font-semibold text-emerald-950">
                      Real-World Commercial Brief Examples:
                    </p>
                    <div className="grid grid-cols-1 gap-2 pt-1 md:grid-cols-2">
                      <div className="rounded-md border border-emerald-200 bg-white p-2.5">
                        <span className="font-bold text-emerald-900 text-[11px] uppercase tracking-wider">
                          B2B SaaS / Workflow Engine
                        </span>
                        <p className="mt-1 text-[11px] text-slate-700 leading-relaxed">
                          <strong>Strategy:</strong> 10-account pilot cohort targeted via warm network and LinkedIn sniper outreach. First 5 closed via custom LOI at €99/mo. Performance ads deliberately omitted until Year 2. Fully loaded CAC: €180. LTV: €1,188 (6.6x ratio). Overheads synced to Module J: €240/mo in software tools.
                        </p>
                      </div>
                      <div className="rounded-md border border-emerald-200 bg-white p-2.5">
                        <span className="font-bold text-emerald-900 text-[11px] uppercase tracking-wider">
                          D2C / Craft / High-Touch
                        </span>
                        <p className="mt-1 text-[11px] text-slate-700 leading-relaxed">
                          <strong>Strategy:</strong> Initial paid ad test revealed CAC of €65 vs net order profit of €38 (unprofitable). Founder formally opted out of paid advertising, pivoting to founder-led TikTok/Instagram organic demos and local pop-ups, reducing cash CAC to €0 and syncing €95/mo in Shopify/Klaviyo to Module J.
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveExampleCard(null)}
                    className="text-emerald-400 hover:text-emerald-700"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {briefAiSuccessMessage && (
              <div className="mt-3 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{briefAiSuccessMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setBriefAiSuccessMessage(null)}
                  className="text-emerald-500 hover:text-emerald-800"
                >
                  ✕
                </button>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-6 pt-5">
            {/* ============================================================= */}
            {/* SECTION 1: 4-PILLAR GTM READINESS CHECKLIST GRID              */}
            {/* ============================================================= */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  1. Go-To-Market Architecture Readiness Checklist
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">
                  {completedCoreStepsCount} of 4 Core Steps Complete
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {/* Pillar 1: Positioning */}
                <div
                  onClick={() => setOpenStep(1)}
                  className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs transition hover:border-indigo-300 hover:shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      1. Brand Positioning
                    </span>
                    {isStep1Complete ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-600 line-clamp-2">
                    {step1Data.elevatorHook140 || 'Elevator hook not defined yet'}
                  </p>
                  <span className="mt-2 inline-block text-[10px] font-bold text-indigo-600">
                    Edit Positioning →
                  </span>
                </div>

                {/* Pillar 2: Modern 4Ps */}
                <div
                  onClick={() => setOpenStep(2)}
                  className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs transition hover:border-indigo-300 hover:shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      2. Modern 4Ps Strategy
                    </span>
                    {isStep2Complete ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-600 line-clamp-2">
                    {step2Data.priceP2.headlinePricePoint || resolvedUpstreamPrice.priceHeadline} • {step2Data.placeP3.primaryChannel} • {step2Data.promotionP4.primaryAcquisitionEngine}
                  </p>
                  <span className="mt-2 inline-block text-[10px] font-bold text-indigo-600">
                    Edit 4Ps →
                  </span>
                </div>

                {/* Pillar 3: First 10 Customers */}
                <div
                  onClick={() => setOpenStep(3)}
                  className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs transition hover:border-indigo-300 hover:shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      3. First 10 Playbook
                    </span>
                    {isStep3Complete ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-600">
                    {step3Data.targetPipeline.length} warm accounts • LOI for {step3Data.letterOfIntent.targetCompanyName || 'Pilot Partner'}
                  </p>
                  <span className="mt-2 inline-block text-[10px] font-bold text-indigo-600">
                    Edit Playbook →
                  </span>
                </div>

                {/* Pillar 4: Budget & CAC */}
                <div
                  onClick={() => setOpenStep(4)}
                  className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs transition hover:border-indigo-300 hover:shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      4. Budget &amp; CAC Funnel
                    </span>
                    {isStep4Complete ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-600">
                    {step4Data.paidAdsViabilityDecision === 'OPTED_OUT_UNPROFITABLE'
                      ? `Paid Ads Excluded • ${currencySymbol}${step4LiveMetrics.cashCac} CAC • ${currencySymbol}${step4LiveMetrics.effectiveModuleJMonthlySpend.toLocaleString()}/mo sync`
                      : `${currencySymbol}${step4LiveMetrics.cashCac} CAC • ${step4LiveMetrics.ltvToCacRatio}:1 LTV:CAC • ${currencySymbol}${step4LiveMetrics.effectiveModuleJMonthlySpend.toLocaleString()}/mo`}
                  </p>
                  <span className="mt-2 inline-block text-[10px] font-bold text-indigo-600">
                    Edit Budget &amp; CAC →
                  </span>
                </div>
              </div>
            </div>

            {/* ============================================================= */}
            {/* SECTION 2: 1-PAGE EXECUTIVE GTM SNAPSHOT & FUNNEL WATERFALL   */}
            {/* ============================================================= */}
            <div className="space-y-3 border-t border-indigo-100/80 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  2. Executive GTM Snapshot &amp; Funnel Waterfall Table
                </h3>
                <span className="text-[11px] text-slate-500">
                  Synced directly from Steps 1–4
                </span>
              </div>

              {/* Snapshot Metric Cards */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                  <div className="text-[11px] font-medium text-slate-500">Cash CAC</div>
                  <div className="mt-1 text-lg font-bold text-slate-900">
                    {currencySymbol}{step4LiveMetrics.cashCac}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Founder time: {step4LiveMetrics.weeklyFounderHours} hrs/wk ({currencySymbol}{step4LiveMetrics.lineItemsTotalSpend.toLocaleString()}/mo budget)
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 shadow-2xs">
                  <div className="text-[11px] font-medium text-emerald-800">LTV : CAC Ratio</div>
                  <div className="mt-1 text-lg font-bold text-emerald-700">
                    {step4LiveMetrics.ltvToCacRatio}:1
                  </div>
                  <div className="text-[10px] text-emerald-600 font-semibold">
                    LTV: {currencySymbol}{step4LiveMetrics.ltv} ({step4LiveMetrics.effectiveLtvMultiplier}x {step4LiveMetrics.ltvMultiplierUnitLabel})
                  </div>
                </div>

                <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-3 shadow-2xs">
                  <div className="text-[11px] font-medium text-indigo-800">Payback Velocity</div>
                  <div className="mt-1 text-lg font-bold text-indigo-900">
                    {step4LiveMetrics.paybackMonths} <span className="text-xs font-normal">months</span>
                  </div>
                  <div className="text-[10px] text-indigo-600">
                    {step4LiveMetrics.paybackMonths <= 6 ? 'Within underwriter 6m target' : 'Payback buffer required'}
                  </div>
                </div>

                <div className={`rounded-xl border p-3 shadow-2xs ${
                  step4Data.paidAdsViabilityDecision === 'OPTED_OUT_UNPROFITABLE'
                    ? 'border-emerald-200 bg-emerald-50/40'
                    : 'border-slate-200 bg-white'
                }`}>
                  <div className="text-[11px] font-medium text-slate-700">
                    Module J Synced Overheads
                  </div>
                  <div className="mt-1 text-lg font-bold text-indigo-950">
                    {currencySymbol}{step4LiveMetrics.effectiveModuleJMonthlySpend.toLocaleString()}{' '}
                    <span className="text-xs font-normal text-slate-600">/ month</span>
                  </div>
                  <div className="text-[10px] font-semibold text-emerald-700">
                    {step4Data.paidAdsViabilityDecision === 'OPTED_OUT_UNPROFITABLE'
                      ? 'Paid ads excluded • Grant-eligible only'
                      : 'Full monthly marketing budget'}
                  </div>
                </div>
              </div>

              {/* Funnel Waterfall Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50/80 font-bold text-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Funnel Stage / Commercial Component</th>
                      <th className="py-2.5 px-3 text-right">Target Volume / Spend</th>
                      <th className="py-2.5 px-3 text-right">Channel Split / Status</th>
                      <th className="py-2.5 px-3 hidden sm:table-cell">Assessor Context / Rule</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr>
                      <td className="py-2 px-3 font-semibold text-slate-900">Target Monthly New Customers</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">{step4Data.targetMonthlyNewCustomers} customers/mo</td>
                      <td className="py-2 px-3 text-right text-slate-600">--</td>
                      <td className="py-2 px-3 text-slate-500 text-[11px] hidden sm:table-cell">
                        Calibrated from Module H ({step4Data.goalPreset})
                      </td>
                    </tr>
                    <tr className="bg-slate-50/30">
                      <td className="py-2 px-3 text-slate-600 pl-6">Less: Warm Pipeline Conversion Credit</td>
                      <td className="py-2 px-3 text-right text-emerald-600 font-medium">-{step4LiveMetrics.warmCustomerCredit} customers</td>
                      <td className="py-2 px-3 text-right text-emerald-700 text-[11px]">30% warm conv rate</td>
                      <td className="py-2 px-3 text-slate-500 text-[11px] hidden sm:table-cell">
                        {step3Data.targetPipeline.length} warm accounts identified in Step 3
                      </td>
                    </tr>
                    <tr className="font-semibold text-slate-900 bg-indigo-50/20">
                      <td className="py-2 px-3">Net Cold Customers Needed Monthly</td>
                      <td className="py-2 px-3 text-right font-bold text-indigo-950">{step4LiveMetrics.netColdCustomersNeeded} customers/mo</td>
                      <td className="py-2 px-3 text-right text-indigo-900 text-[11px]">Cold acquisition</td>
                      <td className="py-2 px-3 text-slate-600 text-[11px] hidden sm:table-cell">
                        Volume that must be produced through marketing outreach
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-600 pl-6">Required Qualified Leads (at {step4Data.leadToCustomerConversionPercent}% lead conv)</td>
                      <td className="py-2 px-3 text-right text-slate-800">{step4LiveMetrics.requiredQualifiedLeads} leads/mo</td>
                      <td className="py-2 px-3 text-right text-slate-500 text-[11px]">
                        {step4LiveMetrics.organicLeads} org / {step4LiveMetrics.paidLeads} paid
                      </td>
                      <td className="py-2 px-3 text-slate-500 text-[11px] hidden sm:table-cell">
                        Demo requests, trial signups, discovery calls
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-600 pl-6">Required Top-of-Funnel Touches / Visitors (at {step4Data.visitorToLeadConversionPercent}% visitor conv)</td>
                      <td className="py-2 px-3 text-right text-slate-800">{step4LiveMetrics.requiredTopOfFunnelTouches.toLocaleString()} touches/mo</td>
                      <td className="py-2 px-3 text-right text-slate-500 text-[11px]">
                        {step4LiveMetrics.organicTouches.toLocaleString()} org / {step4LiveMetrics.paidTouches.toLocaleString()} paid
                      </td>
                      <td className="py-2 px-3 text-slate-500 text-[11px] hidden sm:table-cell">
                        Unique site visitors, personalized emails, profile impressions
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-600 pl-6">Paid Media / Performance Ad Spend</td>
                      <td className="py-2 px-3 text-right text-slate-800">
                        {step4Data.paidAdsViabilityDecision === 'OPTED_OUT_UNPROFITABLE' ? (
                          <span className="font-semibold text-emerald-700">{currencySymbol}0 (Opted Out)</span>
                        ) : (
                          `${currencySymbol}${step4LiveMetrics.paidMediaBucketSpend.toLocaleString()}/mo`
                        )}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-500 text-[11px]">
                        {step4Data.paidAdsViabilityDecision === 'OPTED_OUT_UNPROFITABLE' ? (
                          <span className="text-emerald-700 font-semibold">Excluded</span>
                        ) : (
                          `${step4Data.paidTrafficSharePercent}% paid share`
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-500 text-[11px] hidden sm:table-cell">
                        {step4Data.paidAdsViabilityDecision === 'OPTED_OUT_UNPROFITABLE'
                          ? 'Formally excluded: paid CAC would produce negative unit economics'
                          : 'Ineligible for LEO / Innovate UK grant co-funding'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-600 pl-6">Software Tools &amp; Growth Infrastructure</td>
                      <td className="py-2 px-3 text-right text-slate-800">{currencySymbol}{step4LiveMetrics.toolsBucketSpend.toLocaleString()}/mo</td>
                      <td className="py-2 px-3 text-right text-emerald-700 text-[11px] font-semibold">Grant Eligible</td>
                      <td className="py-2 px-3 text-slate-500 text-[11px] hidden sm:table-cell">
                        CRM, email automation, analytics, tracking, domain setup
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-600 pl-6">Content Creation, Design &amp; Public Relations</td>
                      <td className="py-2 px-3 text-right text-slate-800">{currencySymbol}{step4LiveMetrics.contentEventsBucketSpend.toLocaleString()}/mo</td>
                      <td className="py-2 px-3 text-right text-emerald-700 text-[11px] font-semibold">Grant Eligible</td>
                      <td className="py-2 px-3 text-slate-500 text-[11px] hidden sm:table-cell">
                        Video assets, case studies, technical whitepapers, PR
                      </td>
                    </tr>
                    <tr className="border-t border-slate-200 font-semibold text-slate-900 bg-slate-50/50">
                      <td className="py-2 px-3">Total Planned Monthly Marketing Budget</td>
                      <td className="py-2 px-3 text-right">{currencySymbol}{step4LiveMetrics.lineItemsTotalSpend.toLocaleString()}/mo</td>
                      <td className="py-2 px-3 text-right text-slate-500">100.0%</td>
                      <td className="py-2 px-3 text-slate-500 text-[11px] hidden sm:table-cell">
                        All line items configured in Step 4
                      </td>
                    </tr>
                    <tr className="border-t-2 border-emerald-300 bg-emerald-50/50 font-bold text-emerald-950">
                      <td className="py-2.5 px-3">Effective Monthly Spend Synced to Module J</td>
                      <td className="py-2.5 px-3 text-right text-emerald-700 text-sm">
                        {currencySymbol}{step4LiveMetrics.effectiveModuleJMonthlySpend.toLocaleString()}/mo
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-700 text-sm">
                        {step4Data.paidAdsViabilityDecision === 'OPTED_OUT_UNPROFITABLE' ? 'Non-Ad Spend Only' : 'Full Spend'}
                      </td>
                      <td className="py-2.5 px-3 text-emerald-800 text-[11px] hidden sm:table-cell">
                        {step4Data.paidAdsViabilityDecision === 'OPTED_OUT_UNPROFITABLE'
                          ? 'Zero ad media burn; only grant-eligible software & content tools are exported to Module J financials.'
                          : 'Populates Module J operating expenses directly.'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ============================================================= */}
            {/* SECTION 3: AUDIT READINESS POSTURE SELECTOR                   */}
            {/* ============================================================= */}
            <div className="space-y-3 border-t border-indigo-100/80 pt-4">
              <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  3. Marketing &amp; GTM Readiness Posture (Grant &amp; Investor Diligence)
                </label>
                <span className="text-[11px] text-slate-500">
                  Includes &ldquo;Other&rdquo; custom posture option
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {[
                  {
                    value: 'ORGANIC_FIRST_10_READY' as const,
                    label: 'Organic & First 10 Pipeline Ready',
                    badge: 'High Conviction',
                    subtitle: 'Strong warm pipeline and clear advisory outreach scripts ready to close initial paying pilot cohort without upfront ad burn.',
                  },
                  {
                    value: 'SCALABLE_HYBRID_FUNNEL' as const,
                    label: 'Scalable Hybrid Acquisition Funnel',
                    badge: 'Unit Economics Positive',
                    subtitle: 'Balanced organic and performance channels with healthy LTV:CAC (>3.0x) and sub-6-month payback timeline.',
                  },
                  {
                    value: 'BOOTSTRAPPED_ZERO_AD_SPEND' as const,
                    label: 'Bootstrapped / Zero Paid Ad Spend',
                    badge: 'Paid Ads Formally Excluded',
                    subtitle: 'Performance ads deemed uneconomic at current price point. Strategy focuses strictly on direct outreach, partnerships, and SEO.',
                  },
                  {
                    value: 'NEEDS_CONVERSION_TESTING' as const,
                    label: 'Conversion Testing & Lead Qualification Required',
                    badge: 'Top-of-Funnel Testing',
                    subtitle: 'Funnel mechanics are modeled, but visitor and lead conversion rates require real-world validation through initial pilot batch.',
                  },
                  {
                    value: 'OTHER' as const,
                    label: 'Other Commercial Posture',
                    badge: 'Custom Context',
                    subtitle: 'Institutional procurement, enterprise tender, partner referral program, or bespoke distribution model.',
                  },
                ].map((opt) => {
                  const isSelected = step5Data.marketingReadinessConfidence === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={isVaultReadonly}
                      onClick={() =>
                        setStep5Data((prev) => ({
                          ...prev,
                          marketingReadinessConfidence: opt.value,
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

              {step5Data.marketingReadinessConfidence === 'OTHER' && (
                <div className="rounded-lg border border-indigo-200 bg-indigo-50/40 p-3 space-y-1.5">
                  <label className="block text-xs font-semibold text-indigo-950">
                    Describe Your Custom Marketing Posture:
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
                    placeholder="e.g. Exclusive university distribution partnership or government procurement pilot..."
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
                    4. Constructive &ldquo;Things to Consider&rdquo; Marketing Blind-Spot Review
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Channel vulnerabilities, payback risks, and assessor questions to address prior to grant and investor submission.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isGeneratingAiBrief || isVaultReadonly}
                    onClick={handleGenerateAiMarketingBrief}
                    className="h-8 text-xs font-semibold border-indigo-200 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100/80"
                  >
                    {isGeneratingAiBrief ? (
                      <>
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin text-indigo-600" />
                        Auditing Marketing Blind Spots...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
                        Audit Marketing Blind Spots with AI
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
            {/* SECTION 5: EXECUTIVE MARKETING DEFENSE NARRATIVE (3 PARAS)    */}
            {/* ============================================================= */}
            <div className="space-y-3 border-t border-indigo-100/80 pt-4">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    5. Executive Commercial Defense Narrative (3 Structured Paragraphs)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Formal narrative covering brand positioning, First 10 conversion, and CAC/LTV unit economics defense for Module L grant appendices.
                  </p>
                </div>

                {/* Section 5 Action Toolbar: Generate with AI + Document Exports */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleGenerateAiMarketingBrief}
                    disabled={isGeneratingAiBrief || isVaultReadonly}
                    className="h-7.5 border-violet-200 bg-violet-50/70 text-xs font-semibold text-violet-700 hover:bg-violet-100"
                  >
                    {isGeneratingAiBrief ? (
                      <>
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin text-violet-600" />
                        Generating Narrative...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-1.5 h-3.5 w-3.5 text-violet-600" />
                        Generate with AI
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handlePrintModuleIBriefPdf}
                    className="h-7.5 border-indigo-200 bg-white text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                    title="Print or save PDF of this complete brief"
                  >
                    <Printer className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
                    Print / Save PDF
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleDownloadModuleIBriefHtml}
                    className="h-7.5 border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    title="Download standalone executive HTML document"
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5 text-slate-600" />
                    Download HTML
                  </Button>
                </div>
              </div>

              {/* Assessor Tip Callout */}
              {(aiBriefAssessorTip || step5Data.aiAssessorTip) && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3.5 text-xs text-indigo-950 flex items-start gap-2.5">
                  <Lightbulb className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-indigo-900">Assessor Tip: </span>
                    <span className="text-slate-700">{aiBriefAssessorTip || step5Data.aiAssessorTip}</span>
                  </div>
                </div>
              )}

              {/* Acquisition Strategy & Reversible Paid Media Mode Toggle */}
              <div
                className={`rounded-xl border p-4 text-xs shadow-xs space-y-3 transition-all ${
                  isOptedOutOfPaid
                    ? 'border-emerald-300 bg-emerald-50/90 text-emerald-950'
                    : 'border-slate-200 bg-slate-50 text-slate-800'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    {isOptedOutOfPaid ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Zap className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">
                          {isOptedOutOfPaid
                            ? 'Paid Media Opt-Out Active — 100% Organic & Outbound Acquisition Model'
                            : `Paid Advertising Active — Blended Acquisition Model (${step4Data.paidTrafficSharePercent}% Paid)`}
                        </span>
                        <Badge
                          className={`text-[10px] font-semibold ${
                            isOptedOutOfPaid
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : 'bg-indigo-100 text-indigo-900 border-indigo-300'
                          }`}
                        >
                          {isOptedOutOfPaid ? '100% Organic Strategy' : 'Blended Paid & Organic'}
                        </Badge>
                      </div>
                      <p className="text-[11px] mt-1 leading-relaxed opacity-90">
                        {isOptedOutOfPaid
                          ? 'Performance ad spend is excluded from downstream financial overheads (Module J) to conserve cash and protect trading margins. Paragraph 3 below documents this capital-efficient defense for grant assessors and investors.'
                          : `Performance marketing clicks are active alongside founder-led outreach. You can toggle this off anytime to switch to a 100% organic, grant-safe model.`}
                      </p>
                    </div>
                  </div>

                  {/* Reversible Toggle Switch & 2-Segment Control */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="inline-flex rounded-lg border border-slate-300 bg-white p-1 shadow-xs">
                      <button
                        type="button"
                        disabled={isVaultReadonly}
                        onClick={() => handleTogglePaidAdsStrategy(true)}
                        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                          !isOptedOutOfPaid
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Zap className="h-3.5 w-3.5" />
                        Paid Active
                      </button>
                      <button
                        type="button"
                        disabled={isVaultReadonly}
                        onClick={() => handleTogglePaidAdsStrategy(false)}
                        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                          isOptedOutOfPaid
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Opt Out (Organic)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Status Bar with AI Regeneration CTA */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/60 pt-2.5 text-[11px]">
                  <span className="text-slate-600">
                    {isOptedOutOfPaid
                      ? 'Paragraph 3 reflects your formal Year 1 paid advertising opt-out justification.'
                      : 'Paragraph 3 reflects your balanced paid performance + organic acquisition funnel.'}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isGeneratingAiBrief || isVaultReadonly}
                    onClick={handleGenerateAiMarketingBrief}
                    className="h-7 text-xs border-indigo-200 bg-white font-medium text-indigo-700 hover:bg-indigo-50"
                  >
                    <Sparkles className="mr-1.5 h-3 w-3 text-indigo-600" />
                    {isOptedOutOfPaid ? 'Regenerate Brief (Opt-Out Mode)' : 'Regenerate Brief (Blended Mode)'}
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <textarea
                  rows={9}
                  disabled={isVaultReadonly}
                  value={step5Data.executiveMarketingSummaryNarrative}
                  onChange={(e) =>
                    setStep5Data((prev) => ({
                      ...prev,
                      executiveMarketingSummaryNarrative: e.target.value,
                    }))
                  }
                  placeholder="Click 'Generate with AI' above or compose your 3 structured defense paragraphs..."
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-base sm:text-xs text-slate-800 leading-relaxed shadow-2xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <span>
                      Directly populates Module L Go-To-Market section and LEO / Innovate UK Appendices.
                    </span>
                    {isOptedOutOfPaid ? (
                      <button
                        type="button"
                        onClick={() => {
                          const isIE = (plan.hqCountryCode || 'IE') !== 'GB';
                          const optOutParagraph = `Commercial Viability & Paid Ads Opt-Out Defense: After evaluating direct customer acquisition unit economics, the venture has formally opted out of paid advertising for Year 1. Paid performance clicks at current price points risk negative contribution margins and are strictly ineligible under grant co-funding guidelines (${isIE ? 'LEO Feasibility/Priming' : 'Innovate UK / Start Up Loans'}). Consequently, ongoing ad spend is 100% excluded from Module J financial overheads, preserving runway and protecting trading cashflow. Customer acquisition is driven entirely by founder-led organic outreach, high-intent pilot conversion, strategic partner integrations, and compounding customer referrals. This reverse-engineered funnel comfortably supports our monthly target of ${step4Data.targetMonthlyNewCustomers} new paying customers while keeping weekly founder marketing commitment manageable at ~${step4LiveMetrics.weeklyFounderHours} hours/week alongside product development.`;

                          setStep5Data((prev) => {
                            const cur = prev.executiveMarketingSummaryNarrative.trim();
                            if (!cur) {
                              return { ...prev, executiveMarketingSummaryNarrative: optOutParagraph };
                            }
                            const parts = cur.split(/\n\n+/);
                            if (parts.length >= 3) {
                              parts[2] = optOutParagraph;
                              return { ...prev, executiveMarketingSummaryNarrative: parts.join('\n\n') };
                            }
                            return { ...prev, executiveMarketingSummaryNarrative: `${cur}\n\n${optOutParagraph}` };
                          });
                        }}
                        className="text-emerald-700 hover:text-emerald-800 font-semibold underline decoration-emerald-300"
                      >
                        Sync Opt-Out Defense into Paragraph 3
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const activePaidParagraph = `Commercial Viability & Acquisition Strategy: Customer acquisition operates on a disciplined blended engine, pairing ${100 - step4Data.paidTrafficSharePercent}% founder-led organic outreach, customer referral loops, and strategic content with a controlled ${step4Data.paidTrafficSharePercent}% paid acquisition allocation. Paid ad spend is strictly monitored against our Pocket-Profit contribution margin, ensuring every marketing dollar invested generates a sustainable return and stays within healthy underwriting thresholds.`;

                          setStep5Data((prev) => {
                            const cur = prev.executiveMarketingSummaryNarrative.trim();
                            if (!cur) {
                              return { ...prev, executiveMarketingSummaryNarrative: activePaidParagraph };
                            }
                            const parts = cur.split(/\n\n+/);
                            if (parts.length >= 3) {
                              parts[2] = activePaidParagraph;
                              return { ...prev, executiveMarketingSummaryNarrative: parts.join('\n\n') };
                            }
                            return { ...prev, executiveMarketingSummaryNarrative: `${cur}\n\n${activePaidParagraph}` };
                          });
                        }}
                        className="text-indigo-700 hover:text-indigo-800 font-semibold underline decoration-indigo-300"
                      >
                        Sync Blended Paid Strategy into Paragraph 3
                      </button>
                    )}
                  </div>
                  <span>{step5Data.executiveMarketingSummaryNarrative.length} characters</span>
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
                Back to Step 4 (Budget &amp; CAC)
              </Button>

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

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleDownloadModuleIBriefHtml}
                  className="h-8 text-xs border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold"
                  title="Download standalone executive HTML document"
                >
                  <Download className="mr-1.5 h-3.5 w-3.5 text-slate-600" />
                  Download HTML
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={handlePrintModuleIBriefPdf}
                  className="h-8 text-xs bg-indigo-600 text-white hover:bg-indigo-700 font-semibold shadow-xs"
                  title="Open formatted printable Module I Executive Brief"
                >
                  <Printer className="mr-1.5 h-3.5 w-3.5" />
                  Print / Save as PDF
                </Button>

                {saveStatusStep5 === 'saved' && (
                  <span className="flex items-center text-xs font-medium text-emerald-600">
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                    Saved
                  </span>
                )}
                {saveStatusStep5 === 'error' && (
                  <span className="flex items-center text-xs font-medium text-rose-600">
                    <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                    Save Failed
                  </span>
                )}

                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveStep5}
                  disabled={saveStatusStep5 === 'saving' || isVaultReadonly}
                  className="bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold"
                >
                  {saveStatusStep5 === 'saving' ? (
                    <>
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Saving Brief...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                      Save Marketing Brief (Complete Module I)
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Conversion / Handoff CTA Bar into Module J */}
            {onContinueToModuleJ && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-900 px-4 py-3.5 text-white">
                <div className="text-xs min-w-0 flex-1">
                  <span className="font-semibold text-indigo-300">
                    Module I Complete! Go-To-Market strategy, First 10 Playbook, and acquisition unit economics verified for {planTitle}.
                  </span>{' '}
                  <span className="text-slate-300">
                    Ready to build your 3-year integrated financial model? Advance to Module J: Financial Projections &amp; Cashflow.
                  </span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={isVaultReadonly || saveStatusStep5 === 'saving'}
                  onClick={async () => {
                    await handleSaveStep5();
                    onContinueToModuleJ();
                  }}
                  className="shrink-0 bg-indigo-600 text-white hover:bg-indigo-500 text-xs font-semibold"
                >
                  Advance to Module J: Finance
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
