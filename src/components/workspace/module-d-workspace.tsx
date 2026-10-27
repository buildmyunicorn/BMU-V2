'use client';

import React, { useState, useEffect } from 'react';
import {
  Wrench,
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
  Laptop,
  Package,
  Network,
  GraduationCap,
  Briefcase,
  Cpu,
  Compass,
  Clock,
  CheckCircle2,
  Info,
  Layers,
  ShieldCheck,
  SlidersHorizontal,
  Workflow,
  FileText,
  Smartphone,
  Globe2,
  ShoppingBag,
  Hammer,
  HeartHandshake,
  Zap,
  Plus,
  Trash2,
  AlertTriangle,
  Ban,
  Rocket,
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
} from '@/lib/auth/session-store';

export interface ModuleDWorkspaceProps {
  plan: ActiveStartupPlan;
  selectedCountry: SupportedCountryCode;
  isVaultReadonly: boolean;
  onSaveStep1ProductVehicle: (
    data: ProductVehicleStep1Data,
    progress: number
  ) => Promise<void>;
  onSaveStep2ChannelMatrix: (
    data: ChannelMatrixStep2Data,
    progress: number
  ) => Promise<void>;
  onSaveStep3ScopeFilter: (
    data: ScopeFilterStep3Data,
    progress: number
  ) => Promise<void>;
  onParkOpenQuestion: (questionText: string) => Promise<void>;
  onGenerateAiProductVehicle: (params: {
    selectedTrack: ProductTrackType;
    otherProductTrackText?: string;
    validatedPainSummary?: string;
  }) => Promise<{
    allowed: boolean;
    reason?: string;
    ahaMomentNarrative: string;
    whyThisVehicleFitsCustomer: string;
    engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
  }>;
  onGenerateAiChannelMatrix: (params: {
    selectedTrack: ProductTrackType;
    otherProductTrackText?: string;
    formFactor?: ProductFormFactorType;
  }) => Promise<{
    allowed: boolean;
    reason?: string;
    primaryChannel: SalesChannelOptionType;
    secondaryChannels: SalesChannelOptionType[];
    primaryChannelSharePercent: number;
    estimatedBlendedFeePercent: number;
    deliveryFulfillmentModel: DeliveryFulfillmentModelType;
    rentToOwnBridgeStrategy: string;
    channelWhyItFitsNotes: string;
    engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
  }>;
  onGenerateAiScopeFilter: (params: {
    selectedTrack: ProductTrackType;
    otherProductTrackText?: string;
    formFactor?: ProductFormFactorType;
    primaryChannel?: SalesChannelOptionType;
    validatedPainSummary?: string;
    currentScopeItems?: ScopeFilterItem[];
  }) => Promise<{
    allowed: boolean;
    reason?: string;
    items: ScopeFilterItem[];
    scopeDisciplineRule: V1ScopeDisciplineRuleType | '';
    whatWeRefuseToBuildInV1Narrative: string;
    whyThisLeanV1WinsFasterNarrative: string;
    engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
  }>;
  onBackToModuleC: () => void;
}

export function detectRecommendedProductTrack(
  plan: ActiveStartupPlan
): ProductTrackType {
  const combined = [
    plan.title,
    plan.oneLinerSummary,
    plan.brainDumpText,
    plan.conceptCanvas?.proposedSolution,
    plan.conceptCanvas?.coreProblem,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (
    /autis|sleep|parent|course|curriculum|cohort|education|school|tutor|learning|training|workshop/.test(
      combined
    )
  ) {
    return 'EDUCATION_PROGRAM_COHORT';
  }

  if (
    /wood|chopping board|timber|etsy|amazon fba|craft|candle|food|drink|clothing|apparel|packaging|skincare|physical|box|manufactured/.test(
      combined
    ) ||
    plan.industryCategory === 'E-Commerce / Physical Product / Food & Drink'
  ) {
    return 'PHYSICAL_PRODUCT_ECOM';
  }

  if (
    plan.moduleBData?.beachhead?.buyerType === 'TWO_SIDED_MARKETPLACE' ||
    /marketplace|two-sided|connects buyers|directory|booking platform/.test(
      combined
    )
  ) {
    return 'MARKETPLACE_PLATFORM';
  }

  if (
    plan.industryCategory === 'Service / Agency / Consulting' ||
    /agency|consulting|done-for-you|advisory|fractional|service/.test(combined)
  ) {
    return 'PRODUCTIZED_SERVICE_AGENCY';
  }

  if (
    plan.industryCategory === 'Hardware / MedTech / DeepTech' ||
    /iot|sensor|wearable|hardware|device|medtech/.test(combined)
  ) {
    return 'HYBRID_HARDWARE_SOFTWARE';
  }

  return 'SAAS_SOFTWARE_AI';
}

export const PRODUCT_TRACK_OPTIONS: Array<{
  value: ProductTrackType;
  label: string;
  subtitle: string;
  badgeText: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    value: 'SAAS_SOFTWARE_AI',
    label: 'Software / SaaS / AI Platform',
    subtitle:
      'Web platforms, mobile apps, AI workflows, B2B software, or digital subscriptions.',
    badgeText: 'Tech & SaaS Track',
    icon: Laptop,
  },
  {
    value: 'PHYSICAL_PRODUCT_ECOM',
    label: 'Physical Product / Craft / E-Com',
    subtitle:
      'Artisan goods (e.g. woodworking), Amazon/Etsy/Shopify brands, food & drink, or CPG.',
    badgeText: 'Maker & E-Com Track',
    icon: Package,
  },
  {
    value: 'EDUCATION_PROGRAM_COHORT',
    label: 'Education / Guided Support Platform',
    subtitle:
      'Parent/patient support portals, digital curriculums, cohorts, audio/video guides & trackers.',
    badgeText: 'Education & Impact Track',
    icon: GraduationCap,
  },
  {
    value: 'MARKETPLACE_PLATFORM',
    label: 'Two-Sided Marketplace / Booking',
    subtitle:
      'Platforms connecting buyers & sellers, clients & vetted providers, or niche directories.',
    badgeText: 'Marketplace Track',
    icon: Network,
  },
  {
    value: 'PRODUCTIZED_SERVICE_AGENCY',
    label: 'Productized Service / Agency',
    subtitle:
      'Fixed-scope deliverables, B2B retainers, or tech-enabled done-for-you services.',
    badgeText: 'Service Track',
    icon: Briefcase,
  },
  {
    value: 'HYBRID_HARDWARE_SOFTWARE',
    label: 'Hybrid (Hardware + App / Physical + Digital)',
    subtitle:
      'Connected devices, smart hardware + companion app, or physical kits + digital club.',
    badgeText: 'Hybrid Track',
    icon: Cpu,
  },
  {
    value: 'OTHER',
    label: 'Other (Custom Product Track)',
    subtitle:
      'A specialized or non-standard business vehicle—describe it in your own words.',
    badgeText: 'Custom Track',
    icon: Compass,
  },
];

interface AdaptiveStep1Config {
  trackHeadline: string;
  trackCoachingTip: string;
  formFactorQuestion: string;
  formFactorSubtitle: string;
  defaultFormFactor: ProductFormFactorType;
  formFactorOptions: Array<{
    value: ProductFormFactorType;
    label: string;
    subtitle: string;
    tag: string;
  }>;
  v1ApproachQuestion: string;
  v1ApproachSubtitle: string;
  defaultV1Approach: V1PrototypeApproachType;
  v1ApproachOptions: Array<{
    value: V1PrototypeApproachType;
    label: string;
    subtitle: string;
    tag: string;
  }>;
  ahaPromptLabel: string;
  ahaPromptPlaceholder: string;
  whyFitsLabel: string;
  whyFitsPlaceholder: string;
}

export const ADAPTIVE_STEP1_CONFIG_BY_TRACK: Record<
  ProductTrackType,
  AdaptiveStep1Config
> = {
  SAAS_SOFTWARE_AI: {
    trackHeadline: 'Software / SaaS / AI Product Mode Active',
    trackCoachingTip:
      'All questions in Module D are now tailored to Software & AI startups (Web vs. Mobile App, Cloud/API unit costs, and R&D Work Packages). No physical warehouse or SKU questions will be asked.',
    formFactorQuestion:
      '2. Is your V1 product a Web Platform, a Mobile App, or Both?',
    formFactorSubtitle:
      'Pick the primary screen/interface your first paying users will open. Tip: Starting with a responsive Web Platform avoids Apple/Google 15–30% app store commissions and lets you ship updates in minutes.',
    defaultFormFactor: 'WEB_PLATFORM',
    formFactorOptions: [
      {
        value: 'WEB_PLATFORM',
        label: 'Responsive Web Platform (Desktop & Mobile Browser)',
        subtitle:
          'Users log in via any browser on laptop or phone. Fastest to build, 0% App Store tax, instant updates.',
        tag: 'Recommended for 85% of SaaS V1s',
      },
      {
        value: 'MOBILE_APP_IOS_ANDROID',
        label: 'Dedicated Mobile App (iOS / Android)',
        subtitle:
          'Downloaded from Apple App Store / Google Play. Choose only if you need native camera, sensors, or push habits.',
        tag: 'Higher Build & Review Time',
      },
      {
        value: 'WEB_AND_MOBILE_BOTH',
        label: 'Both Web Platform + Companion Mobile App',
        subtitle:
          'Full desktop dashboard plus mobile app. Powerful, but doubles your V1 testing and maintenance surface.',
        tag: 'Higher V1 Scope Risk',
      },
      {
        value: 'EXTENSION_PLUGIN_API',
        label: 'Browser Extension / Slack / Shopify Plugin or API',
        subtitle:
          'Lives directly inside a workflow tool your customers already keep open all day.',
        tag: 'Low-Friction Distribution',
      },
      {
        value: 'OTHER',
        label: 'Other Software Format',
        subtitle: 'Specify your custom software interface or delivery vehicle.',
        tag: 'Custom',
      },
    ],
    v1ApproachQuestion:
      '3. How will you build and ship Version 1 to your first 10–20 users?',
    v1ApproachSubtitle:
      'Grant boards and investors love founders who prove customer retention with the leanest possible V1 build.',
    defaultV1Approach: 'FOCUSED_FULL_CODE_V1',
    v1ApproachOptions: [
      {
        value: 'FOCUSED_FULL_CODE_V1',
        label: 'Focused Full-Code V1 + AI Co-Pilot (Next.js / Modern Stack)',
        subtitle:
          'Build the core workflow cleanly in code while skipping non-essential admin/enterprise bloat.',
        tag: 'Scalable & Investor-Ready',
      },
      {
        value: 'NO_CODE_LOW_CODE_MVP',
        label: 'No-Code / Low-Code MVP (Bubble, Webflow, Supabase, Make)',
        subtitle:
          'Launch a working product in 2–4 weeks without hiring an expensive software agency.',
        tag: 'Fastest Speed to Market',
      },
      {
        value: 'CONCIERGE_AI_ASSISTED_MVP',
        label: 'Concierge / "Wizard-of-Oz" AI-Assisted Service',
        subtitle:
          'Customer sees a simple intake form/dashboard while you + AI run the heavy lifting behind the scenes.',
        tag: 'Zero-Risk Validation',
      },
      {
        value: 'CLICKABLE_PROTOTYPE_PREORDER',
        label: 'Interactive Clickable Prototype (Figma) + Paid Pilot',
        subtitle:
          'Sign your first 5 B2B pilot letters of intent or pre-orders using an interactive demo before coding.',
        tag: 'Pre-Sell Before Build',
      },
      {
        value: 'OTHER',
        label: 'Other V1 Build Approach',
        subtitle: 'Describe your custom software prototyping approach.',
        tag: 'Custom',
      },
    ],
    ahaPromptLabel:
      '5. The 60-Second Software "Aha! Moment" (First User Experience)',
    ahaPromptPlaceholder:
      'e.g., Within 60 seconds of signing up in their browser, a founder dumps their raw startup idea and immediately sees a structured 1-Page Concept Canvas, Blind-Spot Audit, and IE/UK Grant Readiness score...',
    whyFitsLabel:
      '6. Why this Software Form Factor fits your customer & protects your budget',
    whyFitsPlaceholder:
      'e.g., Launching as a Desktop-First, Mobile-Ready Web App avoids the 30% Apple App Store fee, lets founders work comfortably on big screens when writing grant applications, and works on mobile for public /v/[slug] customer surveys.',
  },

  PHYSICAL_PRODUCT_ECOM: {
    trackHeadline: 'Physical Product / Craft / Amazon & Etsy Mode Active',
    trackCoachingTip:
      'All software/app questions are hidden. Module D is now tailored to SKUs, batch production, packaging, materials (BOM), and Etsy / Amazon / Shopify seller economics.',
    formFactorQuestion:
      '2. What does your Day-1 Physical Product Range (SKU Setup) look like?',
    formFactorSubtitle:
      'The #1 trap for physical makers and Amazon/Etsy sellers is launching with 25 custom variations that destroy workshop speed and tie up cash in slow-moving stock.',
    defaultFormFactor: 'CURATED_2_3_SKUS',
    formFactorOptions: [
      {
        value: 'SINGLE_HERO_SKU',
        label: 'Single Flagship "Hero" Product (1 Perfect SKU)',
        subtitle:
          'Put 100% of your materials, jigs, photography, and reviews behind 1 signature bestseller.',
        tag: 'Highest Workshop Efficiency',
      },
      {
        value: 'CURATED_2_3_SKUS',
        label: 'Small Curated Range (2–3 Hero SKUs or Gift Bundles)',
        subtitle:
          'e.g., Flagship Chopping Board + Board & Beeswax Gift Bundle + Offcut Cheese Board.',
        tag: 'Ideal for Etsy & Amazon Gifting',
      },
      {
        value: 'MADE_TO_ORDER_BESPOKE',
        label: 'Made-to-Order / Personalised Craft Item',
        subtitle:
          'Standard base product made in batches, finished to order (e.g., custom laser-engraved wedding name).',
        tag: 'High Margin on Etsy',
      },
      {
        value: 'CONSUMABLE_REFILL_SUB',
        label: 'Consumable / Repeat-Refill / Subscription Product',
        subtitle:
          'Food, drink, skincare, or conditioning wax refills that customers re-order every 30–90 days.',
        tag: 'High Repeat LTV',
      },
      {
        value: 'OTHER',
        label: 'Other Physical Product Format',
        subtitle: 'Specify your custom SKU or physical product structure.',
        tag: 'Custom',
      },
    ],
    v1ApproachQuestion:
      '3. How will you make or source your first batch of 20–100 units?',
    v1ApproachSubtitle:
      'Prove repeat orders and 5-star unboxing reviews before signing up for massive factory minimum order quantities (MOQs).',
    defaultV1Approach: 'IN_HOUSE_SMALL_BATCH_WORKSHOP',
    v1ApproachOptions: [
      {
        value: 'IN_HOUSE_SMALL_BATCH_WORKSHOP',
        label: 'In-House Small-Batch Workshop / Kitchen Run (10–50 Units)',
        subtitle:
          'Make repeatable batches yourself using jigs/templates so you control quality and spend zero on factory minimums.',
        tag: 'Best for Makers & Artisans',
      },
      {
        value: 'LOCAL_CO_PACKER_MAKER_RUN',
        label: 'Local Contract Maker / CNC / Co-Packer Pilot Batch',
        subtitle:
          'Partner with a local workshop, commercial kitchen, or small-batch manufacturer for your first 50–250 units.',
        tag: 'Low MOQ & Fast Turnaround',
      },
      {
        value: 'WHITE_LABEL_CUSTOMISED_PILOT',
        label: 'Proven Base Product + Custom Finishing / Branding / Packaging',
        subtitle:
          'Source a high-grade base item and add your custom finish, engraving, bundle, and heirloom packaging.',
        tag: 'Fastest Amazon/Etsy Test',
      },
      {
        value: 'PREORDER_BEFORE_TOOLING',
        label: 'Paid Pre-Order / Kickstarter Drop Before Buying Stock',
        subtitle:
          'Collect customer cash from your Module C waitlist first, then fund timber/materials from real orders.',
        tag: 'Cashflow Positive',
      },
      {
        value: 'OTHER',
        label: 'Other Production / Sourcing Approach',
        subtitle: 'Describe how you will produce or source your first units.',
        tag: 'Custom',
      },
    ],
    ahaPromptLabel:
      '5. The 60-Second Unboxing "Aha! Moment" (When the Parcel Arrives)',
    ahaPromptPlaceholder:
      'e.g., When the buyer opens their parcel from Amazon or Etsy, they lift out a heavy, satin-finished hardwood chopping board with a deep juice groove, custom laser-engraved wedding gift message, a tin of beeswax butter, and a care card...',
    whyFitsLabel:
      '6. Why this SKU Range & Batch Approach protects your time and margins',
    whyFitsPlaceholder:
      'e.g., Limiting Day 1 to 2 standard board sizes produced in batches of 20 using router jigs cuts workshop labour from 3 hours to 40 mins per board and keeps boxed parcel weight under the 2kg courier threshold.',
  },

  EDUCATION_PROGRAM_COHORT: {
    trackHeadline: 'Educational / Guided Support Platform Mode Active',
    trackCoachingTip:
      'Tailored for Digital Curriculums, Parent/Patient Support Platforms, and Cohorts. Focuses on bite-sized learning formats, outcome trackers, and avoiding expensive custom app traps on Day 1.',
    formFactorQuestion:
      '2. How will learners, parents, or participants experience your platform on Day 1?',
    formFactorSubtitle:
      'Design around your user’s real energy levels (e.g., exhausted parents at 2am need 5-minute mobile audio & visual checklists—not 60-minute desktop lectures).',
    defaultFormFactor: 'MOBILE_WEB_PORTAL_AUDIO_VIDEO',
    formFactorOptions: [
      {
        value: 'MOBILE_WEB_PORTAL_AUDIO_VIDEO',
        label: 'Mobile-Ready Web Portal + Bite-Sized Audio/Video + Trackers',
        subtitle:
          'Works instantly on any phone browser (can be saved to home screen) with 5-min audio guides, visual cards & daily progress log.',
        tag: 'Recommended (0% App Store Fee)',
      },
      {
        value: 'COHORT_LIVE_PLUS_CURRICULUM',
        label: 'Guided 4–8 Week Program + Weekly Live Q&A / Coaching',
        subtitle:
          'Structured step-by-step core curriculum paired with weekly drop-in office hours and safe peer support.',
        tag: 'Highest Completion & Trust',
      },
      {
        value: 'MEMBERSHIP_COMMUNITY_LIBRARY',
        label: 'Ongoing Membership Community + On-Demand Resource Vault',
        subtitle:
          'Monthly subscription giving families/learners continuous access to templates, troubleshooting guides, and community.',
        tag: 'Recurring Subscription Revenue',
      },
      {
        value: 'B2B_SCHOOL_CLINIC_LICENCE',
        label: 'Institutional / School / Clinic / Charity Bulk Licence Pack',
        subtitle:
          'Packaged so occupational therapists, schools, charities, or employers can sponsor seats for families/staff.',
        tag: 'B2B2C / Grant & Public Sector Fit',
      },
      {
        value: 'OTHER',
        label: 'Other Educational / Support Format',
        subtitle: 'Specify your custom learning or support platform format.',
        tag: 'Custom',
      },
    ],
    v1ApproachQuestion:
      '3. How will you launch Version 1 without spending €25k+ on custom software first?',
    v1ApproachSubtitle:
      'Prove measurable outcomes (like extra hours of child sleep gained) with your first 20–50 families before building a custom native iOS/Android app.',
    defaultV1Approach: 'HOSTED_PORTAL_PLUS_LIVE_QA',
    v1ApproachOptions: [
      {
        value: 'HOSTED_PORTAL_PLUS_LIVE_QA',
        label: 'Hosted Mobile Web Portal + Interactive Tracker + Weekly Q&A',
        subtitle:
          'Combine a clean mobile learning portal with a 3-minute intake quiz, printable visual schedules, and a 14-night outcome tracker.',
        tag: 'Launch in Under 4 Weeks',
      },
      {
        value: 'MOBILE_PWA_BITE_SIZED_AUDIO',
        label: 'Progressive Web App (PWA) with "Listen-in-the-Dark" Audio & Logs',
        subtitle:
          'Feels like a native phone app with audio playlists, sensory routine builders, and daily check-ins—without Apple/Google gatekeepers.',
        tag: 'Parent-Friendly UX',
      },
      {
        value: 'FOUNDING_BETA_COHORT_LIVE',
        label: 'Founding 20-Family Beta Cohort (High-Touch Pilot)',
        subtitle:
          'Guide your first 20 families personally to refine every sensory checklist and collect strong before/after case studies.',
        tag: 'Best for Clinical/Outcome Proof',
      },
      {
        value: 'CUSTOM_EDUCATION_APP_BUILD',
        label: 'Custom Coded Native iOS / Android Educational App',
        subtitle:
          'Full custom mobile app build. Note: Usually best deferred to Version 1.5/V2 after proving curriculum retention.',
        tag: 'Higher Cost & Longer Timeline',
      },
      {
        value: 'OTHER',
        label: 'Other V1 Launch Approach',
        subtitle: 'Describe how you will deliver V1 to your first cohort/users.',
        tag: 'Custom',
      },
    ],
    ahaPromptLabel:
      '5. The 60-Second Parent / Learner "Aha! Moment" (Night 1 Experience)',
    ahaPromptPlaceholder:
      'e.g., Within 3 minutes of joining on their phone, an exhausted parent completes the Sensory Bedtime Quiz, listens to a 5-minute audio guide for their child’s sensory profile, and downloads tonight’s visual bedtime schedule...',
    whyFitsLabel:
      '6. Why this Format fits your learners/parents & avoids unnecessary tech delay',
    whyFitsPlaceholder:
      'e.g., Exhausted parents of autistic children need calm, 5-minute audio & visual routines on their phone tonight—not a 60-minute desktop course. Launching as a Mobile Web Portal saves €25k in custom iOS dev and keeps 97% margin.',
  },

  MARKETPLACE_PLATFORM: {
    trackHeadline: 'Two-Sided Marketplace / Booking Platform Mode Active',
    trackCoachingTip:
      'Tailored for Two-Sided Marketplaces. Focuses on solving the "chicken-and-egg" supply/demand problem and facilitating your first 20 matched transactions cleanly.',
    formFactorQuestion:
      '2. What type of Marketplace experience are you launching on Day 1?',
    formFactorSubtitle:
      'The most successful marketplaces start narrow and curated rather than launching an empty open directory.',
    defaultFormFactor: 'MANAGED_CURATED_MARKETPLACE',
    formFactorOptions: [
      {
        value: 'MANAGED_CURATED_MARKETPLACE',
        label: 'Managed / Curated Matching Platform ("We Vet & Match")',
        subtitle:
          'Buyers submit what they need and get matched with 2–3 pre-vetted, high-trust providers.',
        tag: 'Best for Day-1 Trust & Liquidity',
      },
      {
        value: 'SELF_SERVE_BOOKING_DIRECTORY',
        label: 'Self-Serve Search, Booking & Checkout Marketplace',
        subtitle:
          'Customers browse provider profiles, check live availability/pricing, and pay online.',
        tag: 'Classic Booking Flow',
      },
      {
        value: 'B2B_PROCUREMENT_EXCHANGE',
        label: 'B2B Supplier / Trade Exchange',
        subtitle:
          'Connects commercial buyers with verified trade suppliers, quotes, and repeat ordering.',
        tag: 'High Average Order Value',
      },
      {
        value: 'COMMUNITY_PEER_MARKETPLACE',
        label: 'Peer-to-Peer Community Marketplace',
        subtitle:
          'Members within a niche community buy, sell, or rent directly with each other.',
        tag: 'Network-Driven',
      },
      {
        value: 'OTHER',
        label: 'Other Marketplace Format',
        subtitle: 'Specify your custom marketplace model.',
        tag: 'Custom',
      },
    ],
    v1ApproachQuestion:
      '3. How will you facilitate your first 20 marketplace transactions?',
    v1ApproachSubtitle:
      'Prove that buyers and sellers happily complete transactions (and come back) before coding complex two-sided escrow engines.',
    defaultV1Approach: 'CONCIERGE_MANUAL_MATCHING',
    v1ApproachOptions: [
      {
        value: 'CONCIERGE_MANUAL_MATCHING',
        label: 'Concierge Matching (Web Intake Form + Curated Match + Stripe Link)',
        subtitle:
          'Capture real buyer requests via a clean web form and match them semi-manually behind the scenes.',
        tag: 'Solves Chicken-and-Egg Fastest',
      },
      {
        value: 'NO_CODE_MARKETPLACE_PORTAL',
        label: 'Configured Marketplace Stack (Sharetribe / Webflow + Stripe Connect)',
        subtitle:
          'Launch a branded two-sided portal in weeks using proven marketplace payments plumbing.',
        tag: 'Fast & Low Cost',
      },
      {
        value: 'SINGLE_SIDE_DIRECTORY_BOOKING',
        label: 'Curated Supply Directory + Instant Booking Request',
        subtitle:
          'Onboard 20 great supply-side providers first so buyers see a full shelf on Day 1.',
        tag: 'Supply-First Launch',
      },
      {
        value: 'CUSTOM_TWO_SIDED_BUILD',
        label: 'Custom Two-Sided Web Platform Build',
        subtitle:
          'Full custom buyer and seller dashboards with automated payouts.',
        tag: 'Higher V1 Build Scope',
      },
      {
        value: 'OTHER',
        label: 'Other Marketplace V1 Approach',
        subtitle: 'Describe how you will run your first marketplace transactions.',
        tag: 'Custom',
      },
    ],
    ahaPromptLabel:
      '5. The 60-Second Marketplace "Aha! Moment" (For Buyer & Provider)',
    ahaPromptPlaceholder:
      'e.g., Within 24 hours of submitting a request, a buyer receives 3 vetted, availability-confirmed matches with transparent pricing—saving 2 weeks of cold calls...',
    whyFitsLabel:
      '6. Why this Curated V1 Approach solves your "Chicken-and-Egg" problem',
    whyFitsPlaceholder:
      'e.g., Onboarding 15 vetted providers in one city first and running concierge matching guarantees 100% match fulfillment for early buyers before we automate self-serve search.',
  },

  PRODUCTIZED_SERVICE_AGENCY: {
    trackHeadline: 'Productized Service / Tech-Enabled Agency Mode Active',
    trackCoachingTip:
      'Tailored for Productized Services, B2B Sprints, and Tech-Enabled Agencies. Focuses on fixed-scope packaging, standardized SOPs, and internal automation to keep gross margins high.',
    formFactorQuestion:
      '2. How is your service packaged so clients can buy it like a product?',
    formFactorSubtitle:
      'Turn open-ended "hourly consulting" into a clear, fixed-price package with a defined outcome.',
    defaultFormFactor: 'FIXED_SCOPE_SPRINT',
    formFactorOptions: [
      {
        value: 'FIXED_SCOPE_SPRINT',
        label: 'Fixed-Scope Deliverable Package / Sprint (e.g., "14-Day Setup")',
        subtitle:
          'One clear price, one clear timeline, and a repeatable checklist of deliverables.',
        tag: 'Easiest for Clients to Say Yes',
      },
      {
        value: 'MONTHLY_RETAINER_SUBSCRIPTION',
        label: 'Productized Monthly Subscription ("Service-as-a-Subscription")',
        subtitle:
          'Flat monthly fee with defined scope and turnaround (pause or cancel anytime).',
        tag: 'Predictable Monthly Revenue',
      },
      {
        value: 'TECH_ENABLED_DONE_FOR_YOU',
        label: 'Tech-Enabled Done-For-You Service (Powered by Internal AI/Tools)',
        subtitle:
          'Clients buy the finished result while your internal software/AI does 70% of the heavy lifting.',
        tag: 'Software-Like Margins',
      },
      {
        value: 'DIAGNOSTIC_PAID_PILOT',
        label: 'Paid Diagnostic Audit / Feasibility Workshop (Foot-in-the-Door)',
        subtitle:
          'Low-friction paid audit that naturally converts into your larger implementation package.',
        tag: 'Great for B2B Sales',
      },
      {
        value: 'OTHER',
        label: 'Other Productized Service Format',
        subtitle: 'Describe your custom service packaging.',
        tag: 'Custom',
      },
    ],
    v1ApproachQuestion:
      '3. How will you deliver Version 1 to your first 5–10 paying clients?',
    v1ApproachSubtitle:
      'Sell the outcome first, standardize your internal delivery checklist, and automate the repetitive steps.',
    defaultV1Approach: 'REPEATABLE_SOP_PLUS_STRIPE',
    v1ApproachOptions: [
      {
        value: 'REPEATABLE_SOP_PLUS_STRIPE',
        label: 'Sales Page + Stripe Checkout + Standardized Delivery Playbook',
        subtitle:
          'Zero custom software needed on Day 1—focus 100% on client acquisition and a 5-star delivery SOP.',
        tag: 'Revenue in Week 1',
      },
      {
        value: 'CLIENT_PORTAL_PLUS_AUTOMATION',
        label: 'Branded Client Portal + Internal AI / Zapier Automation',
        subtitle:
          'Give clients a sleek dashboard to submit requests and view deliverables while automating backend prep.',
        tag: 'Scalable Delivery',
      },
      {
        value: 'PAID_PILOT_SPRINT_FIRST_5',
        label: 'Founding 5-Client Pilot Sprint at Early-Bird Rate',
        subtitle:
          'Co-develop your repeatable process with 5 paying pilot clients in exchange for case studies.',
        tag: 'Fastest Social Proof',
      },
      {
        value: 'OTHER',
        label: 'Other Service V1 Approach',
        subtitle: 'Specify how you will onboard and deliver to your first clients.',
        tag: 'Custom',
      },
    ],
    ahaPromptLabel:
      '5. The 60-Second Client Onboarding "Aha! Moment"',
    ahaPromptPlaceholder:
      'e.g., Within 5 minutes of paying via Stripe, the client completes a 6-question intake form and sees their dedicated project board with guaranteed delivery dates...',
    whyFitsLabel:
      '6. Why this Productized Format beats traditional hourly consulting',
    whyFitsPlaceholder:
      'e.g., Eliminates weeks of custom proposal writing for the client, and lets us use internal AI templates to deliver in 3 hours what used to take 15 hours.',
  },

  HYBRID_HARDWARE_SOFTWARE: {
    trackHeadline: 'Hybrid (Hardware + Software / Physical + Digital) Mode Active',
    trackCoachingTip:
      'Tailored for Connected Devices, MedTech/IoT, and Physical + Digital Subscriptions. Helps you validate both the physical unit and the digital companion experience without running out of runway.',
    formFactorQuestion:
      '2. How do the physical and digital halves of your product work together?',
    formFactorSubtitle:
      'Define what the customer touches physically and what they control or view digitally.',
    defaultFormFactor: 'DEVICE_PLUS_COMPANION_APP',
    formFactorOptions: [
      {
        value: 'DEVICE_PLUS_COMPANION_APP',
        label: 'Connected Hardware / Sensor + Companion Web/Mobile Dashboard',
        subtitle:
          'Physical device captures data or performs an action; software dashboard delivers insights & recurring value.',
        tag: 'Hardware + SaaS Margin',
      },
      {
        value: 'PHYSICAL_PRODUCT_PLUS_DIGITAL_CLUB',
        label: 'Physical Product / Kit + Guided Digital Platform',
        subtitle:
          'e.g., Physical sensory/wellness kit paired with a digital audio/video coaching portal.',
        tag: 'High Differentiation',
      },
      {
        value: 'IN_PERSON_PLUS_DIGITAL_PORTAL',
        label: 'In-Person Clinic / Hub + Digital Companion Portal',
        subtitle:
          'Combines local physical delivery or testing with an online tracking and support platform.',
        tag: 'Omni-Channel',
      },
      {
        value: 'CUSTOM_HYBRID_FORMAT',
        label: 'Custom Hardware + Software Architecture',
        subtitle: 'Tailored multi-part physical and digital system.',
        tag: 'DeepTech / Custom',
      },
      {
        value: 'OTHER',
        label: 'Other Hybrid Format',
        subtitle: 'Specify your custom hybrid product setup.',
        tag: 'Custom',
      },
    ],
    v1ApproachQuestion:
      '3. How will you build your first 10–25 pilot units without €100k injection-molding costs?',
    v1ApproachSubtitle:
      'Grant assessors (Innovate UK / Enterprise Ireland) love seeing smart risk reduction on V1 hardware.',
    defaultV1Approach: 'OFF_THE_SHELF_HARDWARE_PLUS_WEB',
    v1ApproachOptions: [
      {
        value: 'OFF_THE_SHELF_HARDWARE_PLUS_WEB',
        label: 'Off-the-Shelf / 3D-Printed Enclosure + Custom Web Dashboard',
        subtitle:
          'Use proven commercial sensors/components inside a small-batch enclosure while putting your IP in the software/data layer.',
        tag: 'Smartest Capital Efficiency',
      },
      {
        value: 'SMALL_BATCH_PHYSICAL_PLUS_CONCIERGE',
        label: 'Small-Batch Physical Kit + Hosted Digital Companion Portal',
        subtitle:
          'Assemble 25 pilot kits and pair them with a mobile-ready web portal for your first pilot cohort.',
        tag: 'Fast Pilot Validation',
      },
      {
        value: 'CUSTOM_HARDWARE_AND_APP',
        label: 'Custom PCB / Prototype Engineering + Dedicated App',
        subtitle:
          'Full engineering prototype required for regulatory, clinical, or industrial trials.',
        tag: 'R&D Grant Track (EI / Innovate UK)',
      },
      {
        value: 'OTHER',
        label: 'Other Hybrid V1 Approach',
        subtitle: 'Describe your V1 hardware + software prototyping strategy.',
        tag: 'Custom',
      },
    ],
    ahaPromptLabel:
      '5. The 60-Second Hybrid "Aha! Moment" (Unboxing + Digital Activation)',
    ahaPromptPlaceholder:
      'e.g., When the customer opens their kit and scans the QR code on their phone, the device pairs in 30 seconds and displays their first live baseline reading and action plan...',
    whyFitsLabel:
      '6. Why this Hybrid V1 Approach de-risks your capital & timeline',
    whyFitsPlaceholder:
      'e.g., Using off-the-shelf certified hardware modules with our proprietary web analytics dashboard lets us run a 20-customer paid pilot in 8 weeks before spending capital on custom tooling.',
  },

  OTHER: {
    trackHeadline: 'Custom Product Track Active',
    trackCoachingTip:
      'Define your custom product vehicle, how customers experience it on Day 1, and how you will launch your leanest Version 1.',
    formFactorQuestion:
      '2. What is the primary format of what your customer buys or uses?',
    formFactorSubtitle:
      'Pick the closest format below or describe your exact custom format.',
    defaultFormFactor: 'OTHER',
    formFactorOptions: [
      {
        value: 'WEB_PLATFORM',
        label: 'Digital / Online Platform or Tool',
        subtitle: 'Delivered online via browser or mobile.',
        tag: 'Digital',
      },
      {
        value: 'CURATED_2_3_SKUS',
        label: 'Physical Product or Tangible Goods',
        subtitle: 'Shipped or handed directly to the customer.',
        tag: 'Physical',
      },
      {
        value: 'FIXED_SCOPE_SPRINT',
        label: 'Service, Program, or In-Person Experience',
        subtitle: 'Delivered as a structured service, cohort, or venue experience.',
        tag: 'Service / Experience',
      },
      {
        value: 'OTHER',
        label: 'Custom Format (Specify Below)',
        subtitle: 'Describe your exact product or delivery format in your own words.',
        tag: 'Custom',
      },
    ],
    v1ApproachQuestion:
      '3. How will you launch Version 1 to your first 10–20 customers?',
    v1ApproachSubtitle:
      'Choose the fastest, lowest-cost way to deliver real value and collect your first revenue.',
    defaultV1Approach: 'OTHER',
    v1ApproachOptions: [
      {
        value: 'CONCIERGE_AI_ASSISTED_MVP',
        label: 'Lean Concierge / Pilot Run with First 10–20 Customers',
        subtitle: 'Deliver high-touch value first before heavy capital spend.',
        tag: 'Lean Pilot',
      },
      {
        value: 'IN_HOUSE_SMALL_BATCH_WORKSHOP',
        label: 'Small-Batch In-House Production / Build',
        subtitle: 'Built or produced directly by the founder(s) for V1.',
        tag: 'In-House V1',
      },
      {
        value: 'OTHER',
        label: 'Custom V1 Launch Approach (Specify Below)',
        subtitle: 'Describe your exact V1 launch method.',
        tag: 'Custom',
      },
    ],
    ahaPromptLabel: '5. The 60-Second Customer "Aha! Moment"',
    ahaPromptPlaceholder:
      'Describe what happens in the first 60 seconds when a customer receives or uses your V1 product...',
    whyFitsLabel: '6. Why this V1 Vehicle is the smartest way to launch',
    whyFitsPlaceholder:
      'Explain why this format lets you launch quickly, delight early customers, and protect your budget...',
  },
};

const LAUNCH_TIMELINE_OPTIONS: Array<{
  value: V1LaunchTimelineType;
  label: string;
  subtitle: string;
}> = [
  {
    value: 'UNDER_4_WEEKS',
    label: 'Under 4 Weeks (Ultra-Lean Pilot / First Batch)',
    subtitle:
      'Fastest path to real customer feedback and early revenue.',
  },
  {
    value: '1_TO_3_MONTHS',
    label: '1–3 Months (Focused V1 Build / Production Run)',
    subtitle:
      'Sweet spot for most focused SaaS MVPs, artisan batches, and digital programs.',
  },
  {
    value: '3_TO_6_MONTHS',
    label: '3–6 Months (Full V1 Platform / Custom Tooling)',
    subtitle:
      'Appropriate when building deeper technical IP or certified physical runs.',
  },
  {
    value: 'OVER_6_MONTHS',
    label: '6+ Months (DeepTech / Regulated / Hardware R&D)',
    subtitle:
      'Usually requires Feasibility or R&D Grant support (Module J) to bridge runway.',
  },
  {
    value: 'OTHER',
    label: 'Other Timeline',
    subtitle: 'Specify a custom launch milestone or seasonal target (e.g., Q4 Gifting).',
  },
];

// ============================================================================
// STEP 2 ADAPTIVE CHANNEL & FULFILLMENT DICTIONARY BY PRODUCT TRACK
// ============================================================================
export interface AdaptiveChannelOption {
  value: SalesChannelOptionType;
  label: string;
  ownershipBadge:
    | '100% Owned Audience'
    | 'Rented Marketplace Traffic'
    | 'Partner / B2B Channel'
    | 'Custom Channel';
  typicalFeePercent: number;
  feeBreakdownText: string;
  payoutSpeed: string;
  subtitle: string;
}

export interface AdaptiveDeliveryOption {
  value: DeliveryFulfillmentModelType;
  label: string;
  tag: string;
  subtitle: string;
}

export interface AdaptiveTrackStep2Config {
  channelQuestionTitle: string;
  channelQuestionSubtitle: string;
  defaultPrimaryChannel: SalesChannelOptionType;
  defaultSecondaryChannels: SalesChannelOptionType[];
  defaultPrimarySharePercent: number;
  benchmarkBlendedFeePercent: number;
  channelOptions: AdaptiveChannelOption[];
  deliveryQuestionTitle: string;
  deliveryQuestionSubtitle: string;
  defaultDeliveryModel: DeliveryFulfillmentModelType;
  deliveryOptions: AdaptiveDeliveryOption[];
  bridgePromptLabel: string;
  bridgePromptPlaceholder: string;
  whyChannelFitsLabel: string;
  whyChannelFitsPlaceholder: string;
}

export const ADAPTIVE_STEP2_CONFIG_BY_TRACK: Record<
  ProductTrackType,
  AdaptiveTrackStep2Config
> = {
  SAAS_SOFTWARE_AI: {
    channelQuestionTitle:
      '1. Where do customers buy & pay for your SaaS / Software (Primary Checkout Channel)?',
    channelQuestionSubtitle:
      'Compare direct web checkout (you own 100% of customer emails at ~2.9% fee) against rented launch marketplaces or app stores.',
    defaultPrimaryChannel: 'DIRECT_WEB_STRIPE',
    defaultSecondaryChannels: [
      'LTD_LAUNCH_MARKETPLACE',
      'B2B_INSTITUTIONAL_INVOICE',
    ],
    defaultPrimarySharePercent: 75,
    benchmarkBlendedFeePercent: 5.5,
    channelOptions: [
      {
        value: 'DIRECT_WEB_STRIPE',
        label: 'Direct Web Checkout (Stripe / Paddle / LemonSqueezy)',
        ownershipBadge: '100% Owned Audience',
        typicalFeePercent: 2.9,
        feeBreakdownText: '~2.9% + €0.30 card fee (0% platform commission)',
        payoutSpeed: '2–3 Days (Stripe)',
        subtitle:
          'Recommended for 90% of SaaS V1s: keep 97% gross margin, own 100% of user emails, and avoid the 15%–30% mobile App Store tax.',
      },
      {
        value: 'LTD_LAUNCH_MARKETPLACE',
        label: 'Launch / Lifetime Deal Marketplace (AppSumo / ProductHunt)',
        ownershipBadge: 'Rented Marketplace Traffic',
        typicalFeePercent: 65.0,
        feeBreakdownText: '~60%–70% marketplace commission on launch deal revenue',
        payoutSpeed: 'Net 30–60 Days',
        subtitle:
          'Great for getting your first 200–500 loud software testers and verified reviews quickly without spending cash on paid ads.',
      },
      {
        value: 'B2B_INSTITUTIONAL_INVOICE',
        label: 'Direct B2B / University / Enterprise Annual Invoice',
        ownershipBadge: 'Partner / B2B Channel',
        typicalFeePercent: 0.5,
        feeBreakdownText: '~0%–1% SEPA / ACH bank transfer fee',
        payoutSpeed: 'Net 14–30 Invoice',
        subtitle:
          'Sell multi-seat cohort codes or team licences directly to universities, accelerators, or corporate teams.',
      },
      {
        value: 'APP_STORE_PLUGIN_MARKETPLACE',
        label: 'Apple / Google App Store or Ecosystem Marketplace (Shopify/Slack)',
        ownershipBadge: 'Rented Marketplace Traffic',
        typicalFeePercent: 15.0,
        feeBreakdownText: '15% (Small Business Program) to 30% platform cut',
        payoutSpeed: 'Net 30–45 Days',
        subtitle:
          'Built-in ecosystem search traffic, but platform controls billing and takes 15%–30% of every subscription.',
      },
      {
        value: 'OTHER',
        label: 'Other SaaS Sales / Licensing Channel',
        ownershipBadge: 'Custom Channel',
        typicalFeePercent: 5.0,
        feeBreakdownText: 'Custom commission or reseller fee',
        payoutSpeed: 'Custom Terms',
        subtitle:
          'Select if you sell through value-added resellers, cloud marketplaces (AWS/Azure), or custom licensing.',
      },
    ],
    deliveryQuestionTitle:
      '3. How are new SaaS users onboarded & provisioned after checkout?',
    deliveryQuestionSubtitle:
      'Choose how customers activate their workspace in Version 1.',
    defaultDeliveryModel: 'HYBRID_SELF_SERVE_PLUS_COHORT_CODE',
    deliveryOptions: [
      {
        value: 'INSTANT_SELF_SERVE_ONBOARDING',
        label: 'Instant Self-Serve Account + Guided Onboarding Flow',
        tag: 'Zero Manual Bottleneck',
        subtitle:
          'Users sign up, pay via Stripe, and immediately enter a guided workspace with pre-loaded examples.',
      },
      {
        value: 'HYBRID_SELF_SERVE_PLUS_COHORT_CODE',
        label: 'Self-Serve Web Checkout + Voucher / Cohort Code Redemption',
        tag: 'Recommended for SaaS + B2B',
        subtitle:
          'Supports instant self-serve Stripe upgrades plus 1-click redemption for AppSumo LTD or University Cohort codes.',
      },
      {
        value: 'FOUNDER_CONCIERGE_SETUP_CALL',
        label: 'White-Glove 15-Minute Founder Onboarding Call',
        tag: 'High Retention for First 20 Users',
        subtitle:
          'Every new customer gets a personal 15-minute setup call so you can watch them use V1 and catch UX friction live.',
      },
      {
        value: 'OTHER',
        label: 'Other SaaS Provisioning Model',
        tag: 'Custom Setup',
        subtitle: 'Specify a custom deployment or single-tenant setup workflow.',
      },
    ],
    bridgePromptLabel:
      '4. Your "Rent-to-Own" Audience Bridge (How You Own 100% of Customer Emails & Upgrade Paths):',
    bridgePromptPlaceholder:
      'e.g., Founders enter via our free Module A hook or redeem an AppSumo/University code directly on our web domain—so we own 100% of verified user emails and workspace data.',
    whyChannelFitsLabel:
      '5. Why This Channel Mix Protects Your Early Traction & Module G Margins:',
    whyChannelFitsPlaceholder:
      'e.g., Direct Web Stripe checkout (~2.9% fee) preserves 97% gross margin on core passes, while AppSumo LTD and university cohort licences give us immediate distribution without burning cash on cold Meta/Google ads.',
  },

  PHYSICAL_PRODUCT_ECOM: {
    channelQuestionTitle:
      '1. Where do customers buy your Physical Product (Own vs. Rent Marketplace Matrix)?',
    channelQuestionSubtitle:
      'Marketplaces like Etsy and Amazon bring ready-to-buy shoppers, while your own website and craft markets let you keep 97% of the margin.',
    defaultPrimaryChannel: 'ETSY_MARKETPLACE',
    defaultSecondaryChannels: ['AMAZON_FBA', 'DIRECT_WEB_CRAFT_MARKETS'],
    defaultPrimarySharePercent: 55,
    benchmarkBlendedFeePercent: 16.5,
    channelOptions: [
      {
        value: 'ETSY_MARKETPLACE',
        label: 'Etsy Marketplace (Handmade, Personalized & Gift Buyers)',
        ownershipBadge: 'Rented Marketplace Traffic',
        typicalFeePercent: 10.5,
        feeBreakdownText:
          '~6.5% transaction + ~4% payment processing + €0.20 listing (Watch out: Offsite Ads add 12–15%)',
        payoutSpeed: 'Next-Day / Weekly',
        subtitle:
          'Best Day-1 channel for artisan/woodworking/craft makers: millions of buyers actively searching for personalized gifts.',
      },
      {
        value: 'AMAZON_FBA',
        label: 'Amazon FBA (Prime Badge — Amazon Stores, Packs & Ships)',
        ownershipBadge: 'Rented Marketplace Traffic',
        typicalFeePercent: 31.0,
        feeBreakdownText:
          '~15% Amazon Referral Fee + ~15%–17% FBA Pick, Pack & Storage Fee',
        payoutSpeed: 'Net 14 Days',
        subtitle:
          'Massive Prime buyer trust and hands-off shipping for standard non-personalized SKUs, but takes ~30%–35% total cut.',
      },
      {
        value: 'AMAZON_FBM',
        label: 'Amazon FBM / Custom (List on Amazon, Ship From Your Workshop)',
        ownershipBadge: 'Rented Marketplace Traffic',
        typicalFeePercent: 15.0,
        feeBreakdownText: '~15% Amazon Referral Fee + you pay courier postage',
        payoutSpeed: 'Net 14 Days',
        subtitle:
          'Ideal for custom laser-engraved or made-to-order items on Amazon that cannot sit pre-packed in an FBA warehouse.',
      },
      {
        value: 'DIRECT_WEB_CRAFT_MARKETS',
        label: 'Own Brand Website (Shopify/Woo) + Local Craft Markets',
        ownershipBadge: '100% Owned Audience',
        typicalFeePercent: 2.9,
        feeBreakdownText: '~2.9% + €0.30 Stripe/Shopify card fee (0% marketplace cut)',
        payoutSpeed: '2–3 Days',
        subtitle:
          'You keep ~97% of the sale price and own 100% of customer emails for repeat consumables, gift refills, and corporate orders.',
      },
      {
        value: 'WHOLESALE_RETAIL_STOCKISTS',
        label: 'Boutique & Independent Retail Stockists (Wholesale B2B)',
        ownershipBadge: 'Partner / B2B Channel',
        typicalFeePercent: 45.0,
        feeBreakdownText: 'Typical 40%–50% wholesale discount off RRP (bulk POs)',
        payoutSpeed: 'Pro-Forma / Net 30',
        subtitle:
          'Sell cartons of 10–25 units to independent kitchenware, deli, or gift shops for predictable batch production.',
      },
      {
        value: 'OTHER',
        label: 'Other Physical Retail / Pop-Up / Distributor Channel',
        ownershipBadge: 'Custom Channel',
        typicalFeePercent: 12.0,
        feeBreakdownText: 'Custom consignment or distributor fee',
        payoutSpeed: 'Custom Terms',
        subtitle:
          'Select if you sell via Instagram Shop, TikTok Shop, farm shops, or corporate gifting brokers.',
      },
    ],
    deliveryQuestionTitle:
      '3. How will you pack & fulfill customer orders in Version 1?',
    deliveryQuestionSubtitle:
      'Match your shipping setup to whether orders are custom-engraved in your workshop or standard Prime stock.',
    defaultDeliveryModel: 'HYBRID_FBA_STANDARD_WORKSHOP_CUSTOM',
    deliveryOptions: [
      {
        value: 'WORKSHOP_PACK_AND_COURIER',
        label: 'Packed In-House (Workshop / Studio) + Tracked Courier Drop',
        tag: 'Full Quality Control',
        subtitle:
          'You inspect, gift-wrap, and ship every order from your workshop via An Post / Royal Mail / DPD.',
      },
      {
        value: 'HYBRID_FBA_STANDARD_WORKSHOP_CUSTOM',
        label:
          'Hybrid: Amazon FBA for Standard SKUs + Workshop Ship for Custom/Etsy',
        tag: 'Recommended for Amazon + Etsy Makers',
        subtitle:
          'Send cartons of standard SKUs to Amazon FBA for Prime speed, while shipping higher-margin engraved/custom orders from your workshop.',
      },
      {
        value: 'THIRD_PARTY_3PL_WAREHOUSE',
        label: 'Outsourced 3PL Fulfillment Warehouse',
        tag: 'Hands-Off Scale',
        subtitle:
          'A third-party logistics warehouse stores pallets and picks/packs direct orders on your behalf.',
      },
      {
        value: 'LOCAL_PICKUP_AND_MARKETS',
        label: 'Local Craft Markets, Click & Collect + Regional Delivery',
        tag: 'Zero Courier Breakage',
        subtitle:
          'Sell face-to-face at weekend markets and offer local collection/delivery alongside online orders.',
      },
      {
        value: 'OTHER',
        label: 'Other Fulfillment / Dropship / Co-Packer Model',
        tag: 'Custom Fulfillment',
        subtitle: 'Specify your custom packing and shipping arrangement.',
      },
    ],
    bridgePromptLabel:
      '4. Your "Rent-to-Own" Box Insert Strategy (Turning Amazon & Etsy Buyers into Owned Direct Customers):',
    bridgePromptPlaceholder:
      'e.g., Every chopping board shipped on Etsy or Amazon includes a kraft care card with a QR code for a free "Heirloom Timber Care Guide + 15% off Beeswax Board Butter Refills" on our own website—capturing their email for repeat direct orders.',
    whyChannelFitsLabel:
      '5. Why This Marketplace + Direct Channel Mix Protects Your Maker Margins:',
    whyChannelFitsPlaceholder:
      'e.g., Etsy (~10.5% fee) gives us immediate gift traffic for high-margin personalized boards, Amazon FBA (~31% fee) moves standard boards on Prime autopilot, and our QR care card drives repeat zero-commission direct sales (~2.9% fee).',
  },

  EDUCATION_PROGRAM_COHORT: {
    channelQuestionTitle:
      '1. Where do parents, learners, or schools enrol & pay for your Program?',
    channelQuestionSubtitle:
      'Selling through a Direct Web Portal keeps 97% of revenue and avoids Apple/Google’s 30% digital content commission.',
    defaultPrimaryChannel: 'DIRECT_WEB_PORTAL_STRIPE',
    defaultSecondaryChannels: [
      'CHARITY_CLINIC_PARTNERSHIPS',
      'HOSTED_COURSE_COMMUNITY',
    ],
    defaultPrimarySharePercent: 75,
    benchmarkBlendedFeePercent: 4.5,
    channelOptions: [
      {
        value: 'DIRECT_WEB_PORTAL_STRIPE',
        label: 'Direct Web Portal + Stripe Checkout (Mobile & Desktop Browser)',
        ownershipBadge: '100% Owned Audience',
        typicalFeePercent: 2.9,
        feeBreakdownText: '~2.9% + €0.30 Stripe card fee (0% App Store cut)',
        payoutSpeed: '2–3 Days (Stripe)',
        subtitle:
          'Recommended for Education & Parent Support Platforms: keep 97% margin, own 100% of parent emails, and give instant phone browser access.',
      },
      {
        value: 'CHARITY_CLINIC_PARTNERSHIPS',
        label:
          'Charities, OT/Sleep Clinics, Support Groups & School Referrals',
        ownershipBadge: 'Partner / B2B Channel',
        typicalFeePercent: 10.0,
        feeBreakdownText:
          '0%–15% partner referral share or bulk family voucher sponsorship',
        payoutSpeed: 'Direct / Net 14',
        subtitle:
          'Partner with trusted autism charities, occupational therapists, and parent networks who already have the trust of families.',
      },
      {
        value: 'HOSTED_COURSE_COMMUNITY',
        label: 'All-in-One Course & Community Platform (Kajabi / Skool / Circle)',
        ownershipBadge: '100% Owned Audience',
        typicalFeePercent: 4.9,
        feeBreakdownText: '~2.9% Stripe fee + platform transaction/hosting tier',
        payoutSpeed: '2–3 Days',
        subtitle:
          'Fastest no-code checkout + video/audio library + parent community forum in one place.',
      },
      {
        value: 'MOBILE_IN_APP_PURCHASE',
        label: 'Apple App Store / Google Play In-App Subscription',
        ownershipBadge: 'Rented Marketplace Traffic',
        typicalFeePercent: 30.0,
        feeBreakdownText: '15%–30% Apple/Google digital content commission',
        payoutSpeed: 'Net 30–45 Days',
        subtitle:
          'High commission alert: Apple/Google take 15%–30% of digital course/subscription sales bought inside a native mobile app.',
      },
      {
        value: 'OTHER',
        label: 'Other Enrolment / Institutional Funding Channel',
        ownershipBadge: 'Custom Channel',
        typicalFeePercent: 5.0,
        feeBreakdownText: 'Custom grant or employer/HSE/NHS sponsorship',
        payoutSpeed: 'Custom Terms',
        subtitle:
          'Select if funded via HSE/NHS family vouchers, employer wellness benefits, or custom partnerships.',
      },
    ],
    deliveryQuestionTitle:
      '3. How do parents or learners consume the support & curriculum after joining?',
    deliveryQuestionSubtitle:
      'Design delivery around how much time and energy your learner actually has (e.g., exhausted parents at 9pm).',
    defaultDeliveryModel: 'HYBRID_ON_DEMAND_PLUS_LIVE_QA',
    deliveryOptions: [
      {
        value: 'INSTANT_24_7_PORTAL_PLUS_PRINTABLES',
        label:
          'Instant 24/7 Mobile Audio/Video Portal + Printable Visual Toolkits',
        tag: '100% Self-Paced',
        subtitle:
          'Families get immediate access to bite-sized 5-minute audio/video guides and printable bedtime visual schedules at any hour.',
      },
      {
        value: 'HYBRID_ON_DEMAND_PLUS_LIVE_QA',
        label:
          'Hybrid: On-Demand Core Toolkit + Weekly Live Drop-In Q&A / Community',
        tag: 'Recommended for High Outcomes',
        subtitle:
          'Combines instant self-paced 5-minute audio guides + 14-night sleep tracker with a supportive weekly live Q&A call so parents never feel alone.',
      },
      {
        value: 'SCHEDULED_COHORT_START_DATES',
        label: 'Scheduled 4–6 Week Guided Cohort Sprints',
        tag: 'High Accountability',
        subtitle:
          'Families start together on a set Monday and progress through weekly milestones as a peer group.',
      },
      {
        value: 'OTHER',
        label: 'Other Learning & Support Delivery Format',
        tag: 'Custom Delivery',
        subtitle: 'Specify your custom coaching, 1-on-1, or hybrid delivery model.',
      },
    ],
    bridgePromptLabel:
      '4. Your "Trust & Lead Magnet" Bridge (How Families Join Your Owned List Before Buying):',
    bridgePromptPlaceholder:
      'e.g., Parents discover us via autism charities and OT clinics using our free "5-Minute Sensory Bedtime Checklist & Printable Visual Routine Card"—joining our owned email list before enrolling on our direct web portal.',
    whyChannelFitsLabel:
      '5. Why This Direct Web + Partner Referral Mix Maximizes Family Impact & Margin:',
    whyChannelFitsPlaceholder:
      'e.g., Enrolling families on our direct web portal via Stripe (~2.9% fee) instead of the Apple App Store (30% fee) preserves ~95.5% margin, while charity and OT clinic referrals give us instant credibility with zero sleazy ad spend.',
  },

  MARKETPLACE_PLATFORM: {
    channelQuestionTitle:
      '1. How do transactions & payments flow through your Marketplace?',
    channelQuestionSubtitle:
      'Choose how buyers and suppliers transact in Version 1 and what payment processing fees apply.',
    defaultPrimaryChannel: 'DIRECT_WEB_MANAGED_ESCROW',
    defaultSecondaryChannels: ['SOCIAL_COMMUNITY_REFERRAL_LOOP'],
    defaultPrimarySharePercent: 80,
    benchmarkBlendedFeePercent: 3.2,
    channelOptions: [
      {
        value: 'DIRECT_WEB_MANAGED_ESCROW',
        label: 'Direct Web Booking & Managed Escrow (Stripe Connect)',
        ownershipBadge: '100% Owned Audience',
        typicalFeePercent: 3.2,
        feeBreakdownText: '~2.9% + €0.30 Stripe card processing + Connect payout fee',
        payoutSpeed: 'Escrow / 2–7 Days',
        subtitle:
          'Buyers pay on your web portal; you deduct your marketplace commission (e.g., 10%–15%) and pay the supplier automatically.',
      },
      {
        value: 'B2B_ANNUAL_SUBSCRIPTION_PLUS_TAKE',
        label: 'Verified Supplier Subscription + Lead/Booking Fee',
        ownershipBadge: 'Partner / B2B Channel',
        typicalFeePercent: 2.5,
        feeBreakdownText: '~2.5% blended Stripe/SEPA payment processing cost',
        payoutSpeed: '2–3 Days',
        subtitle:
          'Suppliers pay a monthly/annual listing fee plus a commission on confirmed bookings—preventing off-platform leakage.',
      },
      {
        value: 'SOCIAL_COMMUNITY_REFERRAL_LOOP',
        label: 'Community / WhatsApp / Local Network Referral Loop',
        ownershipBadge: '100% Owned Audience',
        typicalFeePercent: 2.9,
        feeBreakdownText: '~2.9% Stripe payment link fee',
        payoutSpeed: '2–3 Days',
        subtitle:
          'Acquire early supply and demand through niche community groups and fulfill via direct Stripe payment links.',
      },
      {
        value: 'OTHER',
        label: 'Other Marketplace Transaction Model',
        ownershipBadge: 'Custom Channel',
        typicalFeePercent: 4.0,
        feeBreakdownText: 'Custom payment or escrow fee',
        payoutSpeed: 'Custom Terms',
        subtitle: 'Specify your custom marketplace billing or invoicing flow.',
      },
    ],
    deliveryQuestionTitle:
      '3. How are buyers and suppliers matched & fulfilled in Version 1?',
    deliveryQuestionSubtitle:
      'Avoid building complex automated algorithms before proving your first 50 matches.',
    defaultDeliveryModel: 'MANUAL_CONCIERGE_FULFILLMENT',
    deliveryOptions: [
      {
        value: 'MANUAL_CONCIERGE_FULFILLMENT',
        label: 'Founder-Reviewed Concierge Matching (First 50 Bookings)',
        tag: 'Solves Chicken & Egg',
        subtitle:
          'You personally vet every request and guarantee 2–3 top-quality matches within 24 hours so early buyers are 100% delighted.',
      },
      {
        value: 'INSTANT_SELF_SERVE_ONBOARDING',
        label: 'Self-Serve Directory Search & Instant Request-to-Book',
        tag: 'Scalable Web Flow',
        subtitle:
          'Buyers filter vetted provider profiles and submit booking requests directly through the platform.',
      },
      {
        value: 'OTHER',
        label: 'Other Marketplace Matching Model',
        tag: 'Custom Flow',
        subtitle: 'Specify how buyers and sellers complete a transaction.',
      },
    ],
    bridgePromptLabel:
      '4. Your Anti-Leakage & Retention Bridge (Why Buyers & Suppliers Stay On-Platform):',
    bridgePromptPlaceholder:
      'e.g., We provide automated invoicing, verified reviews, and payment protection on repeat bookings so buyers and suppliers stay on our web portal.',
    whyChannelFitsLabel:
      '5. Why This Transaction & Concierge Flow Wins Liquidity in V1:',
    whyChannelFitsPlaceholder:
      'e.g., Direct web checkout via Stripe Connect (~3.2% fee) keeps payment friction low while founder-led concierge matching guarantees a 5-star experience on our first 50 transactions.',
  },

  PRODUCTIZED_SERVICE_AGENCY: {
    channelQuestionTitle:
      '1. How do clients buy & pay for your Productized Service?',
    channelQuestionSubtitle:
      'Compare direct Stripe checkout links and B2B invoices (~0.5%–2.9% fee) against freelance marketplaces (10%–20% cut).',
    defaultPrimaryChannel: 'DIRECT_STRIPE_SUBSCRIPTION_LINK',
    defaultSecondaryChannels: ['B2B_INVOICE_BANK_TRANSFER'],
    defaultPrimarySharePercent: 70,
    benchmarkBlendedFeePercent: 2.2,
    channelOptions: [
      {
        value: 'DIRECT_STRIPE_SUBSCRIPTION_LINK',
        label: 'Direct Website Checkout / Stripe Subscription Link',
        ownershipBadge: '100% Owned Audience',
        typicalFeePercent: 2.9,
        feeBreakdownText: '~2.9% + €0.30 Stripe fee (0% agency marketplace cut)',
        payoutSpeed: '2–3 Days',
        subtitle:
          'Clients purchase a fixed-scope sprint or monthly retainer directly on your site—no 30-page PDF proposals required.',
      },
      {
        value: 'B2B_INVOICE_BANK_TRANSFER',
        label: 'Direct B2B Invoice (SEPA / Faster Payments / ACH)',
        ownershipBadge: '100% Owned Audience',
        typicalFeePercent: 0.5,
        feeBreakdownText: '~0%–1% bank transfer fee',
        payoutSpeed: 'Upfront / Net 14',
        subtitle:
          'Ideal for €1,500+ B2B sprints or retainers where corporate finance teams prefer direct bank transfer.',
      },
      {
        value: 'FREELANCE_EXPERT_MARKETPLACE',
        label: 'Expert Marketplace / Partner Referral Network (Upwork/Clutch)',
        ownershipBadge: 'Rented Marketplace Traffic',
        typicalFeePercent: 12.0,
        feeBreakdownText: '10%–20% platform commission or referral partner fee',
        payoutSpeed: 'Net 14–30 Days',
        subtitle:
          'Useful for landing your first 3–5 case-study clients before transitioning to 100% direct inbound.',
      },
      {
        value: 'OTHER',
        label: 'Other Client Acquisition & Billing Channel',
        ownershipBadge: 'Custom Channel',
        typicalFeePercent: 3.0,
        feeBreakdownText: 'Custom billing fee',
        payoutSpeed: 'Custom Terms',
        subtitle: 'Specify your custom client billing or white-label partner setup.',
      },
    ],
    deliveryQuestionTitle:
      '3. How do you onboard clients & deliver the work in Version 1?',
    deliveryQuestionSubtitle:
      'Standardize your delivery so every client gets a fast, repeatable result without endless meetings.',
    defaultDeliveryModel: 'CLIENT_PORTAL_ASYNC_DELIVERY',
    deliveryOptions: [
      {
        value: 'CLIENT_PORTAL_ASYNC_DELIVERY',
        label: '5-Minute Intake Form + Shared Client Portal (Async Delivery)',
        tag: 'Highest Founder Margin',
        subtitle:
          'Clients complete a structured intake form and receive deliverables in a dedicated portal without calendar bloat.',
      },
      {
        value: 'FOUNDER_CONCIERGE_SETUP_CALL',
        label: 'Kickoff Strategy Call + Standardized SOP Turnaround',
        tag: 'High-Touch B2B',
        subtitle:
          'Combines a 30-minute kickoff call with a strict internal checklist and AI-assisted production.',
      },
      {
        value: 'OTHER',
        label: 'Other Service Delivery Model',
        tag: 'Custom SOP',
        subtitle: 'Specify how clients submit requests and receive deliverables.',
      },
    ],
    bridgePromptLabel:
      '4. Your Direct Client Ownership & Repeat Retainer Bridge:',
    bridgePromptPlaceholder:
      'e.g., Every client starts with a fixed-price Diagnostic Audit on our website and receives a dedicated workspace that naturally upgrades into our monthly retainer.',
    whyChannelFitsLabel:
      '5. Why This Direct Checkout + Async Delivery Protects Your Margins:',
    whyChannelFitsPlaceholder:
      'e.g., Direct Stripe links and SEPA transfers keep payment fees around ~2.2% and eliminate 15% marketplace commissions.',
  },

  HYBRID_HARDWARE_SOFTWARE: {
    channelQuestionTitle:
      '1. Where do customers buy your Hardware + Software / Physical + Digital Bundle?',
    channelQuestionSubtitle:
      'Combine hardware discovery with 100% owned recurring software/consumable billing.',
    defaultPrimaryChannel: 'DIRECT_HARDWARE_BUNDLE_WEB',
    defaultSecondaryChannels: [
      'AMAZON_PLUS_COMPANION_PORTAL',
      'B2B_CHANNEL_RESELLER',
    ],
    defaultPrimarySharePercent: 65,
    benchmarkBlendedFeePercent: 9.5,
    channelOptions: [
      {
        value: 'DIRECT_HARDWARE_BUNDLE_WEB',
        label: 'Direct Website Bundle (Hardware + Companion Subscription)',
        ownershipBadge: '100% Owned Audience',
        typicalFeePercent: 2.9,
        feeBreakdownText: '~2.9% Stripe/Shopify payment fee on hardware & recurring sub',
        payoutSpeed: '2–3 Days',
        subtitle:
          'Highest margin: sell the starter kit + recurring software/refill subscription directly on your own web store.',
      },
      {
        value: 'AMAZON_PLUS_COMPANION_PORTAL',
        label: 'Amazon/Retail for Device + Direct Web QR Activation for Software',
        ownershipBadge: 'Rented Marketplace Traffic',
        typicalFeePercent: 18.0,
        feeBreakdownText:
          '~15%–30% Amazon cut on hardware box, but ~2.9% Stripe fee on web subscription',
        payoutSpeed: 'Net 14 Days / 2 Days',
        subtitle:
          'Use Amazon to sell the physical starter kit, then require a QR code scan inside the box to activate the subscription on your own web portal.',
      },
      {
        value: 'B2B_CHANNEL_RESELLER',
        label: 'B2B Installers, Clinics, or Commercial Reseller Partners',
        ownershipBadge: 'Partner / B2B Channel',
        typicalFeePercent: 20.0,
        feeBreakdownText: '~15%–25% trade/installer partner discount on hardware',
        payoutSpeed: 'Net 14–30 Days',
        subtitle:
          'Sell multi-unit kits through trusted industry installers or clinics while billing the recurring cloud portal directly.',
      },
      {
        value: 'OTHER',
        label: 'Other Hybrid Distribution Channel',
        ownershipBadge: 'Custom Channel',
        typicalFeePercent: 10.0,
        feeBreakdownText: 'Custom channel fee',
        payoutSpeed: 'Custom Terms',
        subtitle: 'Specify your custom hardware + digital distribution model.',
      },
    ],
    deliveryQuestionTitle:
      '3. How do customers receive the physical kit & activate the digital experience?',
    deliveryQuestionSubtitle:
      'Make the bridge from physical unboxing to digital activation effortless.',
    defaultDeliveryModel: 'HARDWARE_SHIP_PLUS_QR_ACTIVATION',
    deliveryOptions: [
      {
        value: 'HARDWARE_SHIP_PLUS_QR_ACTIVATION',
        label: 'Tracked Courier Kit + In-Box QR Code Web Activation',
        tag: 'Recommended Hybrid Bridge',
        subtitle:
          'Customer unboxes the physical device/kit and scans a QR code on the lid to pair their account on your web portal in 60 seconds.',
      },
      {
        value: 'FOUNDER_CONCIERGE_SETUP_CALL',
        label: 'Pilot Kit Delivery + Guided Onboarding Call',
        tag: 'Best for First 25 Units',
        subtitle:
          'Ship the first batch of kits and walk early customers through setup live to validate hardware + software UX.',
      },
      {
        value: 'OTHER',
        label: 'Other Hybrid Fulfillment & Onboarding Model',
        tag: 'Custom Setup',
        subtitle: 'Specify your custom installation or activation workflow.',
      },
    ],
    bridgePromptLabel:
      '4. Your Physical-to-Digital Ownership Bridge (Capturing 100% of Recurring Subscribers):',
    bridgePromptPlaceholder:
      'e.g., Every physical box includes a mandatory QR onboarding code that activates the companion dashboard on our direct web portal—so even Amazon buyers become owned direct subscribers.',
    whyChannelFitsLabel:
      '5. Why This Hybrid Channel Mix Protects Hardware & Recurring Margins:',
    whyChannelFitsPlaceholder:
      'e.g., Direct web bundles keep blended fees under 10%, and activating the digital subscription on our web portal avoids Apple’s 30% in-app tax.',
  },

  OTHER: {
    channelQuestionTitle:
      '1. Where do customers buy & pay for your product or service (Primary Channel)?',
    channelQuestionSubtitle:
      'Select your primary sales channel and compare direct audience ownership vs. third-party platform fees.',
    defaultPrimaryChannel: 'DIRECT_WEB_STRIPE',
    defaultSecondaryChannels: ['B2B_INSTITUTIONAL_INVOICE'],
    defaultPrimarySharePercent: 80,
    benchmarkBlendedFeePercent: 3.5,
    channelOptions: [
      {
        value: 'DIRECT_WEB_STRIPE',
        label: 'Direct Website / Online Checkout (Stripe / Card)',
        ownershipBadge: '100% Owned Audience',
        typicalFeePercent: 2.9,
        feeBreakdownText: '~2.9% + €0.30 payment processing fee',
        payoutSpeed: '2–3 Days',
        subtitle: 'Keep 97% gross margin and own 100% of your customer list.',
      },
      {
        value: 'B2B_INSTITUTIONAL_INVOICE',
        label: 'Direct B2B Invoice / Bank Transfer',
        ownershipBadge: 'Partner / B2B Channel',
        typicalFeePercent: 0.5,
        feeBreakdownText: '~0%–1% bank transfer fee',
        payoutSpeed: 'Net 14–30 Days',
        subtitle: 'Direct invoicing for commercial, trade, or institutional buyers.',
      },
      {
        value: 'ETSY_MARKETPLACE',
        label: 'Third-Party Online Marketplace (Amazon / Etsy / Platform)',
        ownershipBadge: 'Rented Marketplace Traffic',
        typicalFeePercent: 15.0,
        feeBreakdownText: '~10%–30% marketplace referral/transaction cut',
        payoutSpeed: 'Net 14 Days',
        subtitle: 'Rented search discovery in exchange for a platform commission.',
      },
      {
        value: 'OTHER',
        label: 'Other Custom Sales Channel',
        ownershipBadge: 'Custom Channel',
        typicalFeePercent: 5.0,
        feeBreakdownText: 'Specify your custom channel fee below',
        payoutSpeed: 'Custom Terms',
        subtitle: 'Describe your exact sales channel in your own words.',
      },
    ],
    deliveryQuestionTitle:
      '3. How is your product or service delivered to the customer?',
    deliveryQuestionSubtitle: 'Select your primary V1 fulfillment or onboarding method.',
    defaultDeliveryModel: 'INSTANT_SELF_SERVE_ONBOARDING',
    deliveryOptions: [
      {
        value: 'INSTANT_SELF_SERVE_ONBOARDING',
        label: 'Direct Digital / Online Delivery',
        tag: 'Instant Access',
        subtitle: 'Customers get immediate online access after purchase.',
      },
      {
        value: 'WORKSHOP_PACK_AND_COURIER',
        label: 'Physical Packing & Tracked Courier Delivery',
        tag: 'Physical Fulfillment',
        subtitle: 'Orders are packed and shipped directly to the buyer.',
      },
      {
        value: 'OTHER',
        label: 'Other Custom Delivery Model',
        tag: 'Custom Delivery',
        subtitle: 'Describe your custom delivery or fulfillment model.',
      },
    ],
    bridgePromptLabel:
      '4. How You Own the Customer Relationship & Drive Repeat Sales:',
    bridgePromptPlaceholder:
      'Describe how you capture customer contact details and turn first-time buyers into repeat direct customers...',
    whyChannelFitsLabel:
      '5. Why This Sales & Delivery Channel Mix Fits Version 1:',
    whyChannelFitsPlaceholder:
      'Explain why this channel mix gives you the fastest path to early customers while protecting your margins...',
  },
};

export interface ChannelFeeBreakdownResult {
  primaryLabel: string;
  primaryFeePercent: number;
  effectivePrimaryShare: number;
  effectiveSecondaryShare: number;
  secondaryChannelItems: {
    value: SalesChannelOptionType;
    label: string;
    feePercent: number;
  }[];
  avgSecondaryFeePercent: number;
  primaryWeightedFeePercent: number;
  secondaryWeightedFeePercent: number;
  autoBlendedFeePercent: number;
}

export function computeChannelFeeBreakdown(
  track: ProductTrackType,
  primaryChannel: SalesChannelOptionType,
  secondaryChannels: SalesChannelOptionType[],
  primarySharePercent: number
): ChannelFeeBreakdownResult {
  const cfg =
    ADAPTIVE_STEP2_CONFIG_BY_TRACK[track] ||
    ADAPTIVE_STEP2_CONFIG_BY_TRACK.SAAS_SOFTWARE_AI;
  const primaryOpt = cfg.channelOptions.find((o) => o.value === primaryChannel);
  const primaryFeePercent = primaryOpt ? primaryOpt.typicalFeePercent : 2.9;
  const primaryLabel = primaryOpt ? primaryOpt.label : primaryChannel;

  const validSecondary = (secondaryChannels || []).filter(
    (sc) => sc !== primaryChannel
  );

  if (validSecondary.length === 0 || primarySharePercent >= 100) {
    const rounded = Number(primaryFeePercent.toFixed(1));
    return {
      primaryLabel,
      primaryFeePercent,
      effectivePrimaryShare: 100,
      effectiveSecondaryShare: 0,
      secondaryChannelItems: [],
      avgSecondaryFeePercent: 0,
      primaryWeightedFeePercent: rounded,
      secondaryWeightedFeePercent: 0,
      autoBlendedFeePercent: rounded,
    };
  }

  const secondaryChannelItems = validSecondary.map((sc) => {
    const opt = cfg.channelOptions.find((o) => o.value === sc);
    return {
      value: sc,
      label: opt ? opt.label : sc,
      feePercent: opt ? opt.typicalFeePercent : 10.0,
    };
  });

  const avgSecondaryFeePercent = Number(
    (
      secondaryChannelItems.reduce((acc, item) => acc + item.feePercent, 0) /
      Math.max(secondaryChannelItems.length, 1)
    ).toFixed(1)
  );

  const effectivePrimaryShare = Math.min(Math.max(primarySharePercent, 10), 95);
  const effectiveSecondaryShare = 100 - effectivePrimaryShare;

  const primaryWeightedFeePercent = Number(
    ((primaryFeePercent * effectivePrimaryShare) / 100).toFixed(2)
  );
  const secondaryWeightedFeePercent = Number(
    ((avgSecondaryFeePercent * effectiveSecondaryShare) / 100).toFixed(2)
  );
  const autoBlendedFeePercent = Number(
    (primaryWeightedFeePercent + secondaryWeightedFeePercent).toFixed(1)
  );

  return {
    primaryLabel,
    primaryFeePercent,
    effectivePrimaryShare,
    effectiveSecondaryShare,
    secondaryChannelItems,
    avgSecondaryFeePercent,
    primaryWeightedFeePercent,
    secondaryWeightedFeePercent,
    autoBlendedFeePercent,
  };
}

export function computeAutoBlendedFeePercent(
  track: ProductTrackType,
  primaryChannel: SalesChannelOptionType,
  secondaryChannels: SalesChannelOptionType[],
  primarySharePercent: number
): number {
  return computeChannelFeeBreakdown(
    track,
    primaryChannel,
    secondaryChannels,
    primarySharePercent
  ).autoBlendedFeePercent;
}

function formatCurrencyExactCents(
  amount: number,
  currencyCode: string = 'EUR'
): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: currencyCode || 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

interface AdaptiveStep3TrackConfig {
  boardTitle: string;
  boardSubtitle: string;
  itemNounSingular: string;
  itemNounPlural: string;
  v1BucketLabel: string;
  v1BucketSubtitle: string;
  v15BucketLabel: string;
  v15BucketSubtitle: string;
  v2BucketLabel: string;
  v2BucketSubtitle: string;
  maxRecommendedV1Items: number;
  categoryTagOptions: string[];
  defaultDisciplineRule: V1ScopeDisciplineRuleType;
  disciplineRuleOptions: {
    value: V1ScopeDisciplineRuleType;
    label: string;
    tag: string;
    subtitle: string;
  }[];
  defaultItems: ScopeFilterItem[];
  quickAddChips: {
    title: string;
    bucket: ScopeBucketType;
    categoryTag: string;
    effortImpact: ScopeItemEffortType;
    rationaleOrNote: string;
  }[];
  refusePromptLabel: string;
  refusePromptPlaceholder: string;
  whyLeanWinsLabel: string;
  whyLeanWinsPlaceholder: string;
}

const ADAPTIVE_STEP3_CONFIG_BY_TRACK: Record<
  ProductTrackType,
  AdaptiveStep3TrackConfig
> = {
  SAAS_SOFTWARE_AI: {
    boardTitle:
      '1. Ruthless V1 Feature Scope Board (Day-1 Core vs. V1.5 Fast-Follow vs. V2 Icebox)',
    boardSubtitle:
      '80% of software startups run out of runway because they try to build their Year-2 product on Day 1. Lock your V1 to 3–5 core web workflows that deliver the 60-second Aha! Moment.',
    itemNounSingular: 'Software Feature / Workflow',
    itemNounPlural: 'Software Features',
    v1BucketLabel: 'MUST-HAVE FOR V1 (Day-1 Launch Core)',
    v1BucketSubtitle:
      'Only what is strictly required for the 60-second Aha! Moment & Stripe billing (Target: 3–4 items).',
    v15BucketLabel: 'FAST-FOLLOW V1.5 (Months 3–6 Expansion)',
    v15BucketSubtitle:
      'Valuable retention, collaboration, or B2B features unlocked AFTER your first 25 paying users.',
    v2BucketLabel: 'V2 ICEBOX / REFUSED IN V1 (Year 2+)',
    v2BucketSubtitle:
      'High-effort scope creep traps (native iOS/Android apps, custom ERP syncs, enterprise SSO).',
    maxRecommendedV1Items: 5,
    categoryTagOptions: [
      'Core Aha! Workflow',
      'Viral & Proof Engine',
      'Billing & Security Core',
      'Commercial Output',
      'Expansion & B2B Upsell',
      'Workflow Integration',
      'Scope Creep Trap',
      'OTHER',
    ],
    defaultDisciplineRule: 'CORE_AHA_FLOW_ONLY_NO_NATIVE_APP',
    disciplineRuleOptions: [
      {
        value: 'CORE_AHA_FLOW_ONLY_NO_NATIVE_APP',
        label:
          '60-Second Web Aha! Flow Only — Zero Native iOS/Android Apps in V1',
        tag: 'Recommended for SaaS V1',
        subtitle:
          'Every V1 engineering hour goes into the core browser workflow and Stripe checkout; native mobile apps are banned until Year 2.',
      },
      {
        value: 'SINGLE_TENANT_CONCIERGE_FIRST_10',
        label:
          'Concierge / Wizard-of-Oz Back-Office for First 10 Paying Customers',
        tag: 'Fastest Validation',
        subtitle:
          'Build the customer-facing input & output cleanly, and handle complex edge-cases manually behind the scenes for the first 10 customers.',
      },
      {
        value: 'NO_CUSTOM_INTEGRATIONS_CSV_EXPORT_FIRST',
        label: 'Zero Custom Third-Party API Syncs in V1 (Clean CSV/PDF Export First)',
        tag: 'Kills API Delays',
        subtitle:
          'Skip months of third-party OAuth/ERP API maintenance in V1 by giving users 1-click PDF/CSV exports and webhooks.',
      },
      {
        value: 'OTHER',
        label: 'Other Custom V1 Software Scope Rule',
        tag: 'Custom Rule',
        subtitle: 'Define your own non-negotiable engineering scope guardrail.',
      },
    ],
    defaultItems: [
      {
        id: 'saas-v1-1',
        title:
          'Guided Core Workspace + 60-Second AI Synthesis ("Capture First, Expand Second")',
        bucket: 'MUST_HAVE_V1',
        categoryTag: 'Core Aha! Workflow',
        effortImpact: 'MEDIUM',
        rationaleOrNote:
          'Delivers the #1 founder outcome in under 60 seconds so new users immediately experience structured value.',
      },
      {
        id: 'saas-v1-2',
        title:
          'Hosted Public Validation Survey & Waitlist Engine (/v/[slug] + QR Code Kit)',
        bucket: 'MUST_HAVE_V1',
        categoryTag: 'Viral & Proof Engine',
        effortImpact: 'MEDIUM',
        rationaleOrNote:
          'Lets founders collect real external customer proof and waitlist leads on mobile & desktop from Day 1.',
      },
      {
        id: 'saas-v1-3',
        title:
          'Multi-Tenant Auth, Stripe Pass Checkout & Hard AI Cost Guardrails (500/day Cap)',
        bucket: 'MUST_HAVE_V1',
        categoryTag: 'Billing & Security Core',
        effortImpact: 'LOW',
        rationaleOrNote:
          'Enables Day-1 revenue collection (6-Month Pass, AppSumo LTD & Cohort Codes) while protecting cloud margins.',
      },
      {
        id: 'saas-v1-4',
        title:
          'Localized IE / UK Grant Readiness Matcher & Interactive Business Plan Export',
        bucket: 'MUST_HAVE_V1',
        categoryTag: 'Commercial Output',
        effortImpact: 'MEDIUM',
        rationaleOrNote:
          'Produces the official LEO, Innovate UK, Start Up Loans, and investor deliverables customers pay to unlock.',
      },
      {
        id: 'saas-v15-1',
        title:
          'Multi-Seat Co-Founder Blind-Reveal Alignment & University Cohort Portal',
        bucket: 'FAST_FOLLOW_V1_5',
        categoryTag: 'Expansion & B2B Upsell',
        effortImpact: 'MEDIUM',
        rationaleOrNote:
          'Unlocks higher-tier Co-Founder Passes and institutional accelerator cohort contracts in Months 3–6.',
      },
      {
        id: 'saas-v15-2',
        title:
          'Live Accounting & Bank Feed Sync (Xero / QuickBooks / Open Banking)',
        bucket: 'FAST_FOLLOW_V1_5',
        categoryTag: 'Workflow Integration',
        effortImpact: 'MEDIUM',
        rationaleOrNote:
          'Helpful post-launch automation once founders have completed their initial financial model.',
      },
      {
        id: 'saas-v2-1',
        title:
          'Native iOS & Android Mobile Apps + Offline Local Sync Engine',
        bucket: 'PARKING_LOT_V2',
        categoryTag: 'Scope Creep Trap',
        effortImpact: 'HIGH',
        rationaleOrNote:
          'Refused in V1: doubles engineering maintenance and triggers a 15%–30% App Store tax when a responsive web app works on every device.',
      },
      {
        id: 'saas-v2-2',
        title:
          'Custom Enterprise SSO (SAML/SCIM) & Open Developer Plugin Marketplace',
        bucket: 'PARKING_LOT_V2',
        categoryTag: 'Scope Creep Trap',
        effortImpact: 'HIGH',
        rationaleOrNote:
          'Parked for Year 2—early-stage customers buy speed and outcomes, not enterprise IT compliance checkboxes.',
      },
    ],
    quickAddChips: [
      {
        title: '1-Click PDF / HTML Deliverable Export',
        bucket: 'MUST_HAVE_V1',
        categoryTag: 'Commercial Output',
        effortImpact: 'LOW',
        rationaleOrNote: 'Tangible artifact users can share with stakeholders on Day 1.',
      },
      {
        title: 'Team Role Permissions & Multi-User Comments',
        bucket: 'FAST_FOLLOW_V1_5',
        categoryTag: 'Expansion & B2B Upsell',
        effortImpact: 'MEDIUM',
        rationaleOrNote: 'Drives multi-seat expansion once solo workflow is proven.',
      },
      {
        title: 'White-Label Custom Domain & Agency Sub-Accounts',
        bucket: 'PARKING_LOT_V2',
        categoryTag: 'Scope Creep Trap',
        effortImpact: 'HIGH',
        rationaleOrNote: 'Defer custom DNS and white-label portals until Year 2.',
      },
    ],
    refusePromptLabel:
      '3. What We Explicitly Refuse to Build in Version 1 (Anti-Scope-Creep Charter):',
    refusePromptPlaceholder:
      'e.g., In Version 1, we strictly refuse to build native iOS/Android mobile apps, complex third-party accounting API syncs, or enterprise SAML SSO. Every engineering hour is dedicated to the core web workflow.',
    whyLeanWinsLabel:
      '4. Why This Lean V1 Scope Gets Us to Paying Customers & Grant Proof Faster:',
    whyLeanWinsPlaceholder:
      'e.g., Keeping V1 focused on 4 core web capabilities lets us ship in weeks, validate willingness-to-pay via Stripe and cohort vouchers, and iterate from real founder usage.',
  },

  PHYSICAL_PRODUCT_ECOM: {
    boardTitle:
      '1. Ruthless V1 SKU, Packaging & Batch Jigs Filter (Hero SKUs vs. V1.5 Add-Ons vs. Refused Custom Work)',
    boardSubtitle:
      'Makers and physical brands lose money when they launch with 15 variations, custom dimensions, and slow one-off builds. Lock V1 to 2–3 Hero SKUs that share the same workshop jig and shipping box.',
    itemNounSingular: 'Physical SKU / Packaging Item',
    itemNounPlural: 'Physical SKUs & Specs',
    v1BucketLabel: 'MUST-HAVE FOR V1 (Day-1 Hero SKUs & Box)',
    v1BucketSubtitle:
      'Only your 2–3 Hero SKUs, repeatable workshop jig, and <2kg courier packaging.',
    v15BucketLabel: 'FAST-FOLLOW V1.5 (After First 50 Orders)',
    v15BucketSubtitle:
      'Offcut bundles, seasonal gift sets, and B2B corporate bulk packs unlocked in Months 3–6.',
    v2BucketLabel: 'V2 ICEBOX / REFUSED IN V1 (Margin Killers)',
    v2BucketSubtitle:
      'Custom one-off dimensions, slow resin pours, or 10+ wood/colour variants that break batch production.',
    maxRecommendedV1Items: 4,
    categoryTagOptions: [
      'Hero Physical SKU',
      'High-Margin Personalization',
      'Packaging & Repeat Bridge',
      'Zero-Waste Bundle SKU',
      'B2B Gift Bundle',
      'Batch-Killer Custom Work',
      'Future Category Expansion',
      'OTHER',
    ],
    defaultDisciplineRule: 'MAX_2_3_HERO_SKUS_STANDARD_JIG',
    disciplineRuleOptions: [
      {
        value: 'MAX_2_3_HERO_SKUS_STANDARD_JIG',
        label:
          'Max 2–3 Hero SKUs Cut on the Same Workshop Jig & Standard <2kg Box',
        tag: 'Recommended for Makers & Amazon/Etsy',
        subtitle:
          'Every V1 order uses standardized timber thickness, repeatable router/CNC jigs, and a single double-walled box under the 2kg courier threshold.',
      },
      {
        value: 'SINGLE_FLAGSHIP_SKU_ZERO_VARIATIONS',
        label: 'Single Flagship Hero SKU — Zero Size or Colour Variations in Batch 1',
        tag: 'Lowest Inventory Cash Tie-Up',
        subtitle:
          'Perfect one flagship product and validate 5-star reviews before adding any second size or variant.',
      },
      {
        value: 'PRE_ORDER_BATCH_DROP_ONLY',
        label: 'Numbered Small-Batch Drops (20–50 Units Made After Order)',
        tag: 'Zero Unsold Stock Risk',
        subtitle:
          'Sell in numbered workshop batches with a 5–7 day dispatch window so customers fund your raw materials upfront.',
      },
      {
        value: 'OTHER',
        label: 'Other Physical SKU & Workshop Scope Rule',
        tag: 'Custom Rule',
        subtitle: 'Specify your own SKU, MOQ, or packaging discipline rule.',
      },
    ],
    defaultItems: [
      {
        id: 'sku-v1-1',
        title:
          'Hero SKU #1: Flagship Medium Hardwood Chopping Board (40×30×4cm, <2kg Courier Tier)',
        bucket: 'MUST_HAVE_V1',
        categoryTag: 'Hero Physical SKU',
        effortImpact: 'MEDIUM',
        rationaleOrNote:
          'Sized specifically to fit a single repeatable router jig and stay under the 2kg Amazon FBA & courier shipping threshold.',
      },
      {
        id: 'sku-v1-2',
        title:
          'Hero SKU #2: Personalized Laser-Engraved Wedding / Housewarming Gift Option (+€15 Upsell)',
        bucket: 'MUST_HAVE_V1',
        categoryTag: 'High-Margin Personalization',
        effortImpact: 'LOW',
        rationaleOrNote:
          'Takes 4 minutes on a desktop laser engraver, commands a €15–€20 gift price premium on Etsy, and makes the product non-commodity.',
      },
      {
        id: 'sku-v1-3',
        title:
          '50ml Beeswax & Mineral Oil Board Butter Tin + Branded QR Care Card Insert',
        bucket: 'MUST_HAVE_V1',
        categoryTag: 'Packaging & Repeat Bridge',
        effortImpact: 'LOW',
        rationaleOrNote:
          'Elevates the unboxing experience to 5 stars and drives Amazon/Etsy gift buyers back to our direct website for repeat wax refills.',
      },
      {
        id: 'sku-v15-1',
        title:
          'Matching Hardwood Coaster / Charcuterie Paddle Add-On (Cut from Workshop Offcuts)',
        bucket: 'FAST_FOLLOW_V1_5',
        categoryTag: 'Zero-Waste Bundle SKU',
        effortImpact: 'LOW',
        rationaleOrNote:
          'Turns timber offcuts into a €25 checkout upsell once the flagship board jig is running smoothly after the first 50 orders.',
      },
      {
        id: 'sku-v15-2',
        title:
          'Corporate & Real-Estate Closing Gift Box (Bulk Orders of 10–25 Engraved Boards)',
        bucket: 'FAST_FOLLOW_V1_5',
        categoryTag: 'B2B Gift Bundle',
        effortImpact: 'MEDIUM',
        rationaleOrNote:
          'Unlocks high-margin B2B batch orders for estate agents and corporate Christmas gifting in Q3/Q4.',
      },
      {
        id: 'sku-v2-1',
        title:
          '15+ Custom Timber Species, Custom Dimensions & Bespoke Resin River Tables',
        bucket: 'PARKING_LOT_V2',
        categoryTag: 'Batch-Killer Custom Work',
        effortImpact: 'HIGH',
        rationaleOrNote:
          'Refused in V1: one-off dimensions break batch clamping jigs, triple workshop labour hours per unit, and cause courier damage.',
      },
      {
        id: 'sku-v2-2',
        title:
          'Magnetic Knife Blocks & Multi-Piece Kitchen Countertop Organizers',
        bucket: 'PARKING_LOT_V2',
        categoryTag: 'Future Category Expansion',
        effortImpact: 'HIGH',
        rationaleOrNote:
          'Parked for Year 2 until flagship chopping board reviews pass 100+ verified 5-star ratings on Etsy and Amazon.',
      },
    ],
    quickAddChips: [
      {
        title: 'Standardized Double-Walled Kraft Gift Box + Corner Protectors',
        bucket: 'MUST_HAVE_V1',
        categoryTag: 'Packaging & Repeat Bridge',
        effortImpact: 'LOW',
        rationaleOrNote: 'Eliminates courier transit dents and speeds up packing to 90 seconds per order.',
      },
      {
        title: 'Seasonal Christmas Gift Bundle (Board + Wax + Linen Towel)',
        bucket: 'FAST_FOLLOW_V1_5',
        categoryTag: 'B2B Gift Bundle',
        effortImpact: 'LOW',
        rationaleOrNote: 'High-AOV Q4 gift bundle using existing V1 box dimensions.',
      },
      {
        title: 'Bespoke Customer-Measured Countertop Cutouts',
        bucket: 'PARKING_LOT_V2',
        categoryTag: 'Batch-Killer Custom Work',
        effortImpact: 'HIGH',
        rationaleOrNote: 'Refuse custom measurements in V1—high return risk and impossible to batch.',
      },
    ],
    refusePromptLabel:
      '3. What We Explicitly Refuse to Make or Stock in Version 1 (Workshop Margin Protection):',
    refusePromptPlaceholder:
      'e.g., In Version 1, we strictly refuse custom one-off board dimensions, exotic slow-curing resin pours, and stocking 10+ timber species. Every V1 board is cut on the same two workshop jigs and fits into a single standardized gift box under 2kg.',
    whyLeanWinsLabel:
      '4. Why This Curated 2–3 Hero SKU Scope Protects Maker Labour & Courier Margins:',
    whyLeanWinsPlaceholder:
      'e.g., Restricting V1 to 2–3 Hero SKUs lets us batch-glue and finish 20 boards at a time, cutting workshop labour from 3 hours to 40 minutes per board and protecting a 60%+ gross margin across Etsy and Amazon FBA.',
  },

  EDUCATION_PROGRAM_COHORT: {
    boardTitle:
      '1. Ruthless V1 Curriculum & Parent Support Scope Filter (Day-1 Toolkit vs. V1.5 vs. V2 Icebox)',
    boardSubtitle:
      'Exhausted parents and busy learners do not want a 40-hour university textbook or a €25,000 custom mobile app delay. Lock V1 to bite-sized 5-minute action guides, printable visual tools, and weekly live Q&A.',
    itemNounSingular: 'Curriculum / Support Module',
    itemNounPlural: 'Curriculum & Support Items',
    v1BucketLabel: 'MUST-HAVE FOR V1 (Day-1 Core Parent Toolkit)',
    v1BucketSubtitle:
      'Immediate tonight-ready relief: diagnostic quiz, 5-min audio guides, printable routines & live Q&A.',
    v15BucketLabel: 'FAST-FOLLOW V1.5 (Months 3–6 Expansion)',
    v15BucketSubtitle:
      'Co-parent/school sharing links, specialist guest workshops, and alumni community tiers.',
    v2BucketLabel: 'V2 ICEBOX / REFUSED IN V1 (Over-Engineered Traps)',
    v2BucketSubtitle:
      '€25k custom native iOS/Android app builds, wearable hardware, or 40-hour academic video libraries.',
    maxRecommendedV1Items: 5,
    categoryTagOptions: [
      'Onboarding Diagnostic',
      'Core Curriculum',
      'Printable Parent Toolkit',
      'Habit Tracker & Coaching',
      'Family & School Alignment',
      'Over-Engineered App Trap',
      'Year 2+ R&D Icebox',
      'OTHER',
    ],
    defaultDisciplineRule: 'BITE_SIZED_5MIN_AUDIO_NO_CUSTOM_APP',
    disciplineRuleOptions: [
      {
        value: 'BITE_SIZED_5MIN_AUDIO_NO_CUSTOM_APP',
        label:
          '5-Minute "Listen-in-the-Dark" Audio/Video + Printables — Zero Custom Mobile App in V1',
        tag: 'Recommended for Parent & Learning Platforms',
        subtitle:
          'Deliver instant tonight-ready relief via a mobile web portal and printable PDFs in under 4 weeks—saving €25,000+ in native app costs and 30% App Store fees.',
      },
      {
        value: 'PILOT_COHORT_LIVE_BEFORE_RECORDING',
        label:
          'Run Cohort #1 Live on Zoom Before Recording Polished Studio Modules',
        tag: 'Fastest Cashflow & Proof',
        subtitle:
          'Sell the first 15–25 seats upfront and co-create the curriculum live with real families before filming final on-demand lessons.',
      },
      {
        value: 'OTHER',
        label: 'Other Curriculum & Support Scope Rule',
        tag: 'Custom Rule',
        subtitle: 'Define your own curriculum length and delivery guardrail.',
      },
    ],
    defaultItems: [
      {
        id: 'edu-v1-1',
        title:
          '3-Minute Sensory Bedtime Profile Quiz (Sensory Seeker vs. Sensory Avoider)',
        bucket: 'MUST_HAVE_V1',
        categoryTag: 'Onboarding Diagnostic',
        effortImpact: 'LOW',
        rationaleOrNote:
          'Gives exhausted parents an immediate tailored starting point on Night 1 instead of overwhelming them with generic advice.',
      },
      {
        id: 'edu-v1-2',
        title:
          'Core 6-Module "Listen-in-the-Dark" 5-Minute Audio & Video Action Guides',
        bucket: 'MUST_HAVE_V1',
        categoryTag: 'Core Curriculum',
        effortImpact: 'MEDIUM',
        rationaleOrNote:
          'Designed for sleep-deprived parents to listen on their phone in a dark bedroom in under 5 minutes.',
      },
      {
        id: 'edu-v1-3',
        title:
          'Printable Visual Bedtime Routine Cards & Sensory Wind-Down Checklists (PDF)',
        bucket: 'MUST_HAVE_V1',
        categoryTag: 'Printable Parent Toolkit',
        effortImpact: 'LOW',
        rationaleOrNote:
          'Tangible visual supports parents can print or view on a tablet with their child tonight.',
      },
      {
        id: 'edu-v1-4',
        title:
          '14-Night Mobile Bedtime & Wake-Up Progress Log + Weekly Live Group Q&A',
        bucket: 'MUST_HAVE_V1',
        categoryTag: 'Habit Tracker & Coaching',
        effortImpact: 'LOW',
        rationaleOrNote:
          'Tracks settle-time improvements over 14 nights and provides weekly live reassurance without 1-on-1 clinic waitlists.',
      },
      {
        id: 'edu-v15-1',
        title:
          'Co-Parent / Grandparent / Babysitter Shared Routine Link & School SENCO Handout',
        bucket: 'FAST_FOLLOW_V1_5',
        categoryTag: 'Family & School Alignment',
        effortImpact: 'LOW',
        rationaleOrNote:
          'Helps both parents and school support staff follow the exact same sensory calming cues in Month 3+.',
      },
      {
        id: 'edu-v15-2',
        title:
          'Charity / OT Clinic Bulk Family Voucher Portal (10–50 Sponsored Seats)',
        bucket: 'FAST_FOLLOW_V1_5',
        categoryTag: 'Family & School Alignment',
        effortImpact: 'MEDIUM',
        rationaleOrNote:
          'Lets autism charities and clinics sponsor blocks of families once our first 50 parent outcomes are documented.',
      },
      {
        id: 'edu-v2-1',
        title:
          '€25,000 Custom Native iOS / Android Mobile App Build + Apple App Store Approval',
        bucket: 'PARKING_LOT_V2',
        categoryTag: 'Over-Engineered App Trap',
        effortImpact: 'HIGH',
        rationaleOrNote:
          'Refused in V1: a mobile-friendly web portal works on every phone on Day 1 and avoids losing 30% of revenue to Apple/Google.',
      },
      {
        id: 'edu-v2-2',
        title:
          'Hardware Wearable Sleep Sensor Integration & 40-Hour Clinical Theory Library',
        bucket: 'PARKING_LOT_V2',
        categoryTag: 'Year 2+ R&D Icebox',
        effortImpact: 'HIGH',
        rationaleOrNote:
          'Exhausted parents want a calm bedtime tonight, not a 40-hour university textbook or hardware setup.',
      },
    ],
    quickAddChips: [
      {
        title: 'SOS "2AM Meltdown / Night-Waking" 3-Minute Calming Audio Script',
        bucket: 'MUST_HAVE_V1',
        categoryTag: 'Core Curriculum',
        effortImpact: 'LOW',
        rationaleOrNote: 'High-empathy immediate support when parents need reassurance at 2am.',
      },
      {
        title: 'Occupational Therapist (OT) Guest Workshop Replay Library',
        bucket: 'FAST_FOLLOW_V1_5',
        categoryTag: 'Habit Tracker & Coaching',
        effortImpact: 'LOW',
        rationaleOrNote: 'Adds clinical depth in Months 3–6 without slowing V1 launch.',
      },
      {
        title: 'Multi-Language Dubbing Across 10 Languages Before Launch',
        bucket: 'PARKING_LOT_V2',
        categoryTag: 'Year 2+ R&D Icebox',
        effortImpact: 'HIGH',
        rationaleOrNote: 'Prove 5-star outcomes in English first before localizing audio.',
      },
    ],
    refusePromptLabel:
      '3. What We Explicitly Refuse to Build or Film in Version 1 (Protecting Speed to Family Impact):',
    refusePromptPlaceholder:
      'e.g., In Version 1, we refuse to spend €25,000 and 6 months building a custom native iOS/Android app or recording 40 hours of academic lectures. Everything is delivered as 5-minute audio/video guides and printable visual schedules inside a mobile-ready web portal.',
    whyLeanWinsLabel:
      '4. Why This Bite-Sized V1 Toolkit Wins Faster for Families & Preserves 95%+ Margin:',
    whyLeanWinsPlaceholder:
      'e.g., Launching our core 6-module sensory sleep toolkit and weekly live Q&A in under 4 weeks lets us help our first 50 families immediately, gather real 14-night sleep improvement data, and keep 97% gross margin via Stripe.',
  },

  MARKETPLACE_PLATFORM: {
    boardTitle:
      '1. Ruthless V1 Marketplace Liquidity Scope Filter (Day-1 Booking Flow vs. V1.5 vs. V2 Icebox)',
    boardSubtitle:
      'Marketplaces never fail from lack of AI matching algorithms—they fail from lack of early trust and liquidity. Lock V1 to curated supplier profiles, request-to-book checkout, and concierge matching.',
    itemNounSingular: 'Marketplace Capability',
    itemNounPlural: 'Marketplace Capabilities',
    v1BucketLabel: 'MUST-HAVE FOR V1 (Day-1 Liquidity & Checkout)',
    v1BucketSubtitle:
      'Vetted supply profiles, buyer request form, Stripe Connect checkout & founder concierge matching.',
    v15BucketLabel: 'FAST-FOLLOW V1.5 (Months 3–6 Repeat Bookings)',
    v15BucketSubtitle:
      'Automated repeat-booking calendar, verified review badges, and supplier payout analytics.',
    v2BucketLabel: 'V2 ICEBOX / REFUSED IN V1 (Premature Automation)',
    v2BucketSubtitle:
      'Dynamic AI bidding engines, custom in-app video chat, or dual native iOS/Android apps.',
    maxRecommendedV1Items: 5,
    categoryTagOptions: [
      'Supply Onboarding',
      'Core Transaction Flow',
      'Liquidity Engine',
      'Retention & Trust',
      'Premature Automation',
      'OTHER',
    ],
    defaultDisciplineRule: 'CONCIERGE_MATCHING_BEFORE_ALGORITHMS',
    disciplineRuleOptions: [
      {
        value: 'CONCIERGE_MATCHING_BEFORE_ALGORITHMS',
        label:
          'Founder-Assisted Concierge Matching for First 50 Bookings Before Automated Algorithms',
        tag: 'Recommended for Marketplaces',
        subtitle:
          'Personally curate the first 25 suppliers and review early booking requests to guarantee 100% match quality on Day 1.',
      },
      {
        value: 'CORE_AHA_FLOW_ONLY_NO_NATIVE_APP',
        label: 'Single Responsive Web Portal — Zero Native Buyer/Seller Mobile Apps in V1',
        tag: 'Saves 6 Months',
        subtitle:
          'Avoid building two separate iOS/Android apps for buyers and sellers before proving repeat transactions on the web.',
      },
      {
        value: 'OTHER',
        label: 'Other Marketplace V1 Scope Rule',
        tag: 'Custom Rule',
        subtitle: 'Specify your custom liquidity and scope guardrail.',
      },
    ],
    defaultItems: [
      {
        id: 'mkt-v1-1',
        title:
          'Vetted Supplier / Provider Profile Directory + Clear Fixed Pricing Packages',
        bucket: 'MUST_HAVE_V1',
        categoryTag: 'Supply Onboarding',
        effortImpact: 'LOW',
        rationaleOrNote:
          'Curates the first 25 verified providers so buyers see immediate high-trust options on Day 1.',
      },
      {
        id: 'mkt-v1-2',
        title:
          'Structured Buyer Request Form + Stripe Connect Checkout / Deposit Hold',
        bucket: 'MUST_HAVE_V1',
        categoryTag: 'Core Transaction Flow',
        effortImpact: 'MEDIUM',
        rationaleOrNote:
          'Captures buyer requirements and secures payment on-platform with transparent commission split.',
      },
      {
        id: 'mkt-v1-3',
        title:
          'Founder-Assisted Concierge Matching & WhatsApp/Email Booking Confirmation',
        bucket: 'MUST_HAVE_V1',
        categoryTag: 'Liquidity Engine',
        effortImpact: 'LOW',
        rationaleOrNote:
          'Guarantees a fast, high-quality match on the first 50 bookings before building complex automated matching.',
      },
      {
        id: 'mkt-v15-1',
        title:
          'Automated Repeat-Booking Calendar & Verified Buyer Review Badges',
        bucket: 'FAST_FOLLOW_V1_5',
        categoryTag: 'Retention & Trust',
        effortImpact: 'MEDIUM',
        rationaleOrNote:
          'Keeps buyers and providers transacting on-platform for repeat bookings in Months 3–6.',
      },
      {
        id: 'mkt-v2-1',
        title:
          'Real-Time AI Dynamic Bidding Engine & Native Dual iOS/Android Apps',
        bucket: 'PARKING_LOT_V2',
        categoryTag: 'Premature Automation',
        effortImpact: 'HIGH',
        rationaleOrNote:
          'Refused in V1: marketplaces fail from lack of liquidity, not lack of bidding algorithms.',
      },
    ],
    quickAddChips: [
      {
        title: 'Escrow Milestone Release & Refund Protection Policy Badge',
        bucket: 'MUST_HAVE_V1',
        categoryTag: 'Retention & Trust',
        effortImpact: 'LOW',
        rationaleOrNote: 'Gives buyers confidence to pay through the platform instead of cash.',
      },
      {
        title: 'Automated Supplier Invoice & Tax Summary Generator',
        bucket: 'FAST_FOLLOW_V1_5',
        categoryTag: 'Retention & Trust',
        effortImpact: 'MEDIUM',
        rationaleOrNote: 'Prevents off-platform disintermediation by handling supplier admin.',
      },
    ],
    refusePromptLabel:
      '3. What We Explicitly Refuse to Build in Version 1 (Anti-Over-Engineering Charter):',
    refusePromptPlaceholder:
      'e.g., In Version 1, we refuse to build automated bidding algorithms, custom in-app video chat, or dual native mobile apps before proving repeat booking liquidity on our first 50 transactions.',
    whyLeanWinsLabel:
      '4. Why Concierge Matching + Web Escrow Proves Liquidity Faster:',
    whyLeanWinsPlaceholder:
      'e.g., Combining a clean web booking checkout with founder-curated matching for our first 25 suppliers guarantees a 5-star match on Day 1 and proves our take-rate in weeks.',
  },

  PRODUCTIZED_SERVICE_AGENCY: {
    boardTitle:
      '1. Ruthless V1 Productized Service Scope Filter (Fixed-Scope Sprint vs. V1.5 Retainer vs. V2 Icebox)',
    boardSubtitle:
      'Service businesses drown when every client buys a custom scope. Lock V1 to a standardized fixed-price deliverable, a 10-minute client intake form, and an internal AI-assisted SOP.',
    itemNounSingular: 'Service Deliverable / SOP',
    itemNounPlural: 'Service Deliverables & SOPs',
    v1BucketLabel: 'MUST-HAVE FOR V1 (Standardized Sprint Core)',
    v1BucketSubtitle:
      'Fixed-scope offer page, Stripe checkout link, 10-min client intake form & repeatable delivery SOP.',
    v15BucketLabel: 'FAST-FOLLOW V1.5 (Months 3–6 Recurring Upsell)',
    v15BucketSubtitle:
      'Monthly recurring optimization retainer, client benchmark library, and referral partner kit.',
    v2BucketLabel: 'V2 ICEBOX / REFUSED IN V1 (Scope Creep Traps)',
    v2BucketSubtitle:
      'Open-ended hourly consulting, bespoke out-of-scope requests, or premature self-serve SaaS builds.',
    maxRecommendedV1Items: 4,
    categoryTagOptions: [
      'Productized Offer',
      'Onboarding SOP',
      'Fulfillment Engine',
      'Recurring Revenue Upsell',
      'Year 2 Software Spin-Out',
      'OTHER',
    ],
    defaultDisciplineRule: 'FIXED_SPRINT_SCOPE_NO_CUSTOM_RETROFITS',
    disciplineRuleOptions: [
      {
        value: 'FIXED_SPRINT_SCOPE_NO_CUSTOM_RETROFITS',
        label:
          '100% Fixed-Scope Deliverables Menu — Zero Custom Hourly Scope Creep in V1',
        tag: 'Recommended for Productized Services',
        subtitle:
          'Every client buys the exact same clearly defined sprint package and turnaround window—protecting 70%+ gross margins.',
      },
      {
        value: 'OTHER',
        label: 'Other Productized Service Scope Rule',
        tag: 'Custom Rule',
        subtitle: 'Define your own service SLA and boundary rule.',
      },
    ],
    defaultItems: [
      {
        id: 'srv-v1-1',
        title:
          'Fixed-Scope Deliverables Menu + Direct Stripe Checkout / Deposit Link',
        bucket: 'MUST_HAVE_V1',
        categoryTag: 'Productized Offer',
        effortImpact: 'LOW',
        rationaleOrNote:
          'Replaces slow bespoke PDF proposals with a clear, fixed-price package clients can buy in 2 minutes.',
      },
      {
        id: 'srv-v1-2',
        title:
          '10-Minute Standardized Client Intake Form & Asset Upload Checklist',
        bucket: 'MUST_HAVE_V1',
        categoryTag: 'Onboarding SOP',
        effortImpact: 'LOW',
        rationaleOrNote:
          'Collects everything needed to execute the sprint upfront without 3 kickoff calls.',
      },
      {
        id: 'srv-v1-3',
        title:
          'Internal AI-Assisted Delivery Playbook + Shared Client Delivery Portal (Notion/Web)',
        bucket: 'MUST_HAVE_V1',
        categoryTag: 'Fulfillment Engine',
        effortImpact: 'MEDIUM',
        rationaleOrNote:
          'Cuts internal delivery hours by 50% while giving the client a polished, trackable delivery experience.',
      },
      {
        id: 'srv-v15-1',
        title:
          'Monthly Recurring Optimization Retainer Upsell (Auto-Billed via Stripe)',
        bucket: 'FAST_FOLLOW_V1_5',
        categoryTag: 'Recurring Revenue Upsell',
        effortImpact: 'LOW',
        rationaleOrNote:
          'Converts satisfied V1 sprint clients into predictable monthly recurring revenue.',
      },
      {
        id: 'srv-v2-1',
        title:
          'Self-Serve White-Label SaaS Dashboard for Clients to Run Everything Themselves',
        bucket: 'PARKING_LOT_V2',
        categoryTag: 'Year 2 Software Spin-Out',
        effortImpact: 'HIGH',
        rationaleOrNote:
          'Refused in V1: get paid high-margin service revenue first to fund and validate the exact workflows worth automating later.',
      },
    ],
    quickAddChips: [
      {
        title: '5-Day Turnaround SLA & 1-Round Revision Boundary',
        bucket: 'MUST_HAVE_V1',
        categoryTag: 'Productized Offer',
        effortImpact: 'LOW',
        rationaleOrNote: 'Prevents endless client revision loops.',
      },
    ],
    refusePromptLabel:
      '3. What We Explicitly Refuse to Do in Version 1 (Protecting Delivery Margin):',
    refusePromptPlaceholder:
      'e.g., In Version 1, we refuse open-ended hourly consulting, bespoke out-of-scope client requests, and building a custom self-serve software portal before delivering 20 profitable client sprints.',
    whyLeanWinsLabel:
      '4. Why This Fixed-Scope Sprint Generates Profitable Cashflow in Days:',
    whyLeanWinsPlaceholder:
      'e.g., A standardized fixed-scope sprint with a 10-minute intake checklist and internal AI SOPs lets us generate profitable cashflow in under 14 days with 70%+ gross margins.',
  },

  HYBRID_HARDWARE_SOFTWARE: {
    boardTitle:
      '1. Ruthless V1 Hardware + Digital Companion Scope Filter (Pilot Kit vs. V1.5 vs. V2 Tooling)',
    boardSubtitle:
      'Hardware + software startups burn €100k+ when they pay for injection moulding and native apps before testing 50 pilot units in the field. Lock V1 to pre-certified hardware + QR web dashboard.',
    itemNounSingular: 'Hardware / Companion Item',
    itemNounPlural: 'Hardware & Digital Scope Items',
    v1BucketLabel: 'MUST-HAVE FOR V1 (First 25–50 Pilot Kits)',
    v1BucketSubtitle:
      'Pre-certified / 3D-printed hardware enclosure + QR onboarding + cloud web companion dashboard.',
    v15BucketLabel: 'FAST-FOLLOW V1.5 (Months 3–6 Fleet Features)',
    v15BucketSubtitle:
      'Automated SMS/email threshold alerts, multi-unit team views, and consumable auto-refills.',
    v2BucketLabel: 'V2 ICEBOX / REFUSED IN V1 (Mass Tooling Traps)',
    v2BucketSubtitle:
      '€50k injection-moulded tooling, 1,000-unit factory MOQs, and native iOS/Android Bluetooth apps.',
    maxRecommendedV1Items: 4,
    categoryTagOptions: [
      'V1 Hardware Kit',
      'Digital Companion Core',
      'Recurring Retention',
      'Mass Manufacturing V2',
      'OTHER',
    ],
    defaultDisciplineRule: 'OFF_THE_SHELF_HARDWARE_FOR_FIRST_50',
    disciplineRuleOptions: [
      {
        value: 'OFF_THE_SHELF_HARDWARE_FOR_FIRST_50',
        label:
          'Pre-Certified Off-the-Shelf Boards + Small-Batch Enclosures for First 50 Pilot Units',
        tag: 'Recommended for Hybrid V1',
        subtitle:
          'Avoid €50k+ custom tooling and CE/FCC delays in V1 by assembling pre-certified modules inside a clean small-batch enclosure paired with a web dashboard.',
      },
      {
        value: 'OTHER',
        label: 'Other Hybrid Hardware + Software Scope Rule',
        tag: 'Custom Rule',
        subtitle: 'Specify your custom pilot batch and firmware/software boundary.',
      },
    ],
    defaultItems: [
      {
        id: 'hyb-v1-1',
        title:
          'Pre-Certified Off-the-Shelf / Small-Batch Hardware Kit + Custom Branded Enclosure',
        bucket: 'MUST_HAVE_V1',
        categoryTag: 'V1 Hardware Kit',
        effortImpact: 'MEDIUM',
        rationaleOrNote:
          'Avoids €50k+ injection-moulding and CE/FCC certification delays for the first 50 pilot units.',
      },
      {
        id: 'hyb-v1-2',
        title:
          'In-Box QR Code 60-Second Device Activation + Cloud Web Dashboard',
        bucket: 'MUST_HAVE_V1',
        categoryTag: 'Digital Companion Core',
        effortImpact: 'MEDIUM',
        rationaleOrNote:
          'Connects the physical unit to the customer’s browser dashboard and activates recurring subscription billing.',
      },
      {
        id: 'hyb-v15-1',
        title:
          'Automated SMS / Email Threshold Alerts & Multi-Unit Team View',
        bucket: 'FAST_FOLLOW_V1_5',
        categoryTag: 'Recurring Retention',
        effortImpact: 'LOW',
        rationaleOrNote:
          'Drives daily stickiness and multi-unit expansion across pilot customer sites.',
      },
      {
        id: 'hyb-v2-1',
        title:
          'Custom Injection-Moulded Tooling (1,000+ MOQ) & Bespoke PCB Spin',
        bucket: 'PARKING_LOT_V2',
        categoryTag: 'Mass Manufacturing V2',
        effortImpact: 'HIGH',
        rationaleOrNote:
          'Parked until 50+ paid pilot units validate exact sensor placement and recurring retention.',
      },
    ],
    quickAddChips: [
      {
        title: 'Plug-and-Play Pre-Configured Wi-Fi / Cellular SIM Setup',
        bucket: 'MUST_HAVE_V1',
        categoryTag: 'V1 Hardware Kit',
        effortImpact: 'LOW',
        rationaleOrNote: 'Ensures pilot customers get live data within 2 minutes of unboxing.',
      },
    ],
    refusePromptLabel:
      '3. What We Explicitly Refuse to Tool or Build in Version 1:',
    refusePromptPlaceholder:
      'e.g., In Version 1, we refuse expensive injection-moulded tooling, custom factory MOQs, and native mobile app store builds before our first 50 pilot kits are operating in real customer hands.',
    whyLeanWinsLabel:
      '4. Why Pre-Certified Pilot Kits + Web Dashboard Wins Faster:',
    whyLeanWinsPlaceholder:
      'e.g., Pairing pre-certified small-batch hardware with a QR-activated web dashboard lets us ship pilot kits in weeks, prove recurring subscription retention, and unlock R&D grant funding.',
  },

  OTHER: {
    boardTitle:
      '1. Ruthless V1 Scope Filter (Day-1 Launch Core vs. V1.5 Fast-Follow vs. V2 Icebox)',
    boardSubtitle:
      'Separate the 3–5 essential Day-1 deliverables from nice-to-have expansions so you launch on time and on budget.',
    itemNounSingular: 'Scope Item',
    itemNounPlural: 'Scope Items',
    v1BucketLabel: 'MUST-HAVE FOR V1 (Day-1 Core)',
    v1BucketSubtitle: 'Strictly required to deliver your core customer outcome on Day 1.',
    v15BucketLabel: 'FAST-FOLLOW V1.5 (Months 3–6)',
    v15BucketSubtitle: 'High-value add-ons unlocked after your first 25–50 customers.',
    v2BucketLabel: 'V2 ICEBOX / REFUSED IN V1 (Year 2+)',
    v2BucketSubtitle: 'Complex or capital-heavy ideas parked until V1 is profitable.',
    maxRecommendedV1Items: 5,
    categoryTagOptions: [
      'Core Deliverable',
      'Checkout & Onboarding',
      'Month 3–6 Upsell',
      'Year 2 Icebox',
      'OTHER',
    ],
    defaultDisciplineRule: 'CORE_AHA_FLOW_ONLY_NO_NATIVE_APP',
    disciplineRuleOptions: [
      {
        value: 'CORE_AHA_FLOW_ONLY_NO_NATIVE_APP',
        label: 'Focus 100% on Core Customer Outcome — Zero Non-Essential Variants in V1',
        tag: 'Recommended V1 Rule',
        subtitle: 'Ship the simplest high-trust version that solves the customer’s #1 problem.',
      },
      {
        value: 'OTHER',
        label: 'Other Custom V1 Scope Rule',
        tag: 'Custom Rule',
        subtitle: 'Describe your custom Version 1 scope boundary.',
      },
    ],
    defaultItems: [
      {
        id: 'oth-v1-1',
        title: 'Core Flagship Customer Deliverable & Onboarding Flow',
        bucket: 'MUST_HAVE_V1',
        categoryTag: 'Core Deliverable',
        effortImpact: 'MEDIUM',
        rationaleOrNote: 'Delivers the primary promised result to Day-1 customers.',
      },
      {
        id: 'oth-v15-1',
        title: 'Premium Tier / Repeat Bundle Add-On',
        bucket: 'FAST_FOLLOW_V1_5',
        categoryTag: 'Month 3–6 Upsell',
        effortImpact: 'LOW',
        rationaleOrNote: 'Increases customer lifetime value once V1 is running smoothly.',
      },
      {
        id: 'oth-v2-1',
        title: 'Complex Custom Automation & Multi-Market Expansion',
        bucket: 'PARKING_LOT_V2',
        categoryTag: 'Year 2 Icebox',
        effortImpact: 'HIGH',
        rationaleOrNote: 'Deferred to Year 2 after proving unit economics in our beachhead market.',
      },
    ],
    quickAddChips: [],
    refusePromptLabel: '3. What We Explicitly Refuse to Build or Stock in Version 1:',
    refusePromptPlaceholder:
      'Describe what you are deliberately leaving out of Version 1 to protect launch speed and budget...',
    whyLeanWinsLabel: '4. Why This Lean Version 1 Wins Faster:',
    whyLeanWinsPlaceholder:
      'Explain why launching with this focused V1 scope reduces risk and gets you to paying customers faster...',
  },
};



export function ModuleDWorkspace({
  plan,
  selectedCountry,
  isVaultReadonly,
  onSaveStep1ProductVehicle,
  onSaveStep2ChannelMatrix,
  onSaveStep3ScopeFilter,
  onParkOpenQuestion,
  onGenerateAiProductVehicle,
  onGenerateAiChannelMatrix,
  onGenerateAiScopeFilter,
  onBackToModuleC,
}: ModuleDWorkspaceProps) {
  const countryPack = getCountryRulePack(selectedCountry);

  const [activeTab, setActiveTab] = useState<
    'STEP_1' | 'STEP_2' | 'STEP_3' | 'STEP_4' | 'STEP_5' | 'STEP_6'
  >(() => {
    if (plan.currentModuleStep === 'MOD_D_STEP_3') return 'STEP_3';
    if (plan.currentModuleStep === 'MOD_D_STEP_2') return 'STEP_2';
    return 'STEP_1';
  });

  const [showWhyCard, setShowWhyCard] = useState(true);
  const [showExamples, setShowExamples] = useState(false);
  const [isSavingStep1, setIsSavingStep1] = useState(false);
  const [isSavingStep2, setIsSavingStep2] = useState(false);
  const [isSavingStep3, setIsSavingStep3] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isGeneratingStep2Ai, setIsGeneratingStep2Ai] = useState(false);
  const [isGeneratingStep3Ai, setIsGeneratingStep3Ai] = useState(false);
  const [saveBanner, setSaveBanner] = useState<string | null>(null);
  const [parkQuestionInput, setParkQuestionInput] = useState('');
  const [showParkInput, setShowParkInput] = useState(false);

  // Custom item form state for Step 3 Ruthless Scope Filter
  const [newScopeItemTitle, setNewScopeItemTitle] = useState('');
  const [newScopeItemBucket, setNewScopeItemBucket] =
    useState<ScopeBucketType>('MUST_HAVE_V1');
  const [newScopeItemCategory, setNewScopeItemCategory] = useState('');
  const [newScopeItemOtherCategory, setNewScopeItemOtherCategory] =
    useState('');
  const [newScopeItemEffort, setNewScopeItemEffort] =
    useState<ScopeItemEffortType>('MEDIUM');
  const [newScopeItemNote, setNewScopeItemNote] = useState('');
  const [showClearScopeBoardConfirm, setShowClearScopeBoardConfirm] =
    useState(false);

  // Initialize Step 1 state from saved plan.moduleDData or smart auto-detection from Modules A/B
  const [step1Data, setStep1Data] = useState<ProductVehicleStep1Data>(() => {
    if (plan.moduleDData?.productVehicle) {
      return plan.moduleDData.productVehicle;
    }
    const autoTrack = detectRecommendedProductTrack(plan);
    const cfg = ADAPTIVE_STEP1_CONFIG_BY_TRACK[autoTrack];
    return {
      productTrack: autoTrack,
      otherProductTrackText: '',
      isTrackAutoDetected: true,
      formFactor: cfg.defaultFormFactor,
      otherFormFactorText: '',
      v1PrototypeApproach: cfg.defaultV1Approach,
      otherV1PrototypeApproachText: '',
      launchTimeline:
        autoTrack === 'PHYSICAL_PRODUCT_ECOM' ||
        autoTrack === 'EDUCATION_PROGRAM_COHORT'
          ? 'UNDER_4_WEEKS'
          : '1_TO_3_MONTHS',
      otherLaunchTimelineText: '',
      ahaMomentNarrative: '',
      whyThisVehicleFitsCustomer: '',
    };
  });

  // Initialize Step 2 state from saved plan.moduleDData.channelMatrix or adaptive track defaults
  const [step2Data, setStep2Data] = useState<ChannelMatrixStep2Data>(() => {
    if (plan.moduleDData?.channelMatrix) {
      return plan.moduleDData.channelMatrix;
    }
    const initialTrack =
      plan.moduleDData?.productVehicle?.productTrack ||
      detectRecommendedProductTrack(plan);
    const cfg2 =
      ADAPTIVE_STEP2_CONFIG_BY_TRACK[initialTrack] ||
      ADAPTIVE_STEP2_CONFIG_BY_TRACK.SAAS_SOFTWARE_AI;
    return {
      primaryChannel: cfg2.defaultPrimaryChannel,
      otherPrimaryChannelText: '',
      secondaryChannels: cfg2.defaultSecondaryChannels,
      otherSecondaryChannelText: '',
      primaryChannelSharePercent: cfg2.defaultPrimarySharePercent,
      estimatedBlendedFeePercent: computeAutoBlendedFeePercent(
        initialTrack,
        cfg2.defaultPrimaryChannel,
        cfg2.defaultSecondaryChannels,
        cfg2.defaultPrimarySharePercent
      ),
      deliveryFulfillmentModel: cfg2.defaultDeliveryModel,
      otherDeliveryFulfillmentText: '',
      rentToOwnBridgeStrategy: '',
      channelWhyItFitsNotes: '',
    };
  });

  // Initialize Step 3 state from saved plan.moduleDData.scopeFilter or clean empty board (no pre-populated defaults)
  const [step3Data, setStep3Data] = useState<ScopeFilterStep3Data>(() => {
    if (plan.moduleDData?.scopeFilter) {
      return plan.moduleDData.scopeFilter;
    }
    return {
      items: [],
      scopeDisciplineRule: '',
      otherScopeDisciplineRuleText: '',
      whatWeRefuseToBuildInV1Narrative: '',
      whyThisLeanV1WinsFasterNarrative: '',
    };
  });

  // Sync if active plan switches or when saved moduleDData hydrates from localStorage / Cloud SQL
  useEffect(() => {
    if (plan.currentModuleStep === 'MOD_D_STEP_3') {
      setActiveTab('STEP_3');
    } else if (plan.currentModuleStep === 'MOD_D_STEP_2') {
      setActiveTab('STEP_2');
    }

    const autoTrack = detectRecommendedProductTrack(plan);
    if (plan.moduleDData?.productVehicle) {
      setStep1Data(plan.moduleDData.productVehicle);
    } else {
      const cfg = ADAPTIVE_STEP1_CONFIG_BY_TRACK[autoTrack];
      setStep1Data({
        productTrack: autoTrack,
        otherProductTrackText: '',
        isTrackAutoDetected: true,
        formFactor: cfg.defaultFormFactor,
        otherFormFactorText: '',
        v1PrototypeApproach: cfg.defaultV1Approach,
        otherV1PrototypeApproachText: '',
        launchTimeline:
          autoTrack === 'PHYSICAL_PRODUCT_ECOM' ||
          autoTrack === 'EDUCATION_PROGRAM_COHORT'
            ? 'UNDER_4_WEEKS'
            : '1_TO_3_MONTHS',
        otherLaunchTimelineText: '',
        ahaMomentNarrative: '',
        whyThisVehicleFitsCustomer: '',
      });
    }

    if (plan.moduleDData?.channelMatrix) {
      setStep2Data(plan.moduleDData.channelMatrix);
    } else {
      const activeTrackForStep2 =
        plan.moduleDData?.productVehicle?.productTrack || autoTrack;
      const cfg2 =
        ADAPTIVE_STEP2_CONFIG_BY_TRACK[activeTrackForStep2] ||
        ADAPTIVE_STEP2_CONFIG_BY_TRACK.SAAS_SOFTWARE_AI;
      setStep2Data({
        primaryChannel: cfg2.defaultPrimaryChannel,
        otherPrimaryChannelText: '',
        secondaryChannels: cfg2.defaultSecondaryChannels,
        otherSecondaryChannelText: '',
        primaryChannelSharePercent: cfg2.defaultPrimarySharePercent,
        estimatedBlendedFeePercent: computeAutoBlendedFeePercent(
          activeTrackForStep2,
          cfg2.defaultPrimaryChannel,
          cfg2.defaultSecondaryChannels,
          cfg2.defaultPrimarySharePercent
        ),
        deliveryFulfillmentModel: cfg2.defaultDeliveryModel,
        otherDeliveryFulfillmentText: '',
        rentToOwnBridgeStrategy: '',
        channelWhyItFitsNotes: '',
      });
    }

    if (plan.moduleDData?.scopeFilter) {
      setStep3Data(plan.moduleDData.scopeFilter);
    } else {
      setStep3Data({
        items: [],
        scopeDisciplineRule: '',
        otherScopeDisciplineRuleText: '',
        whatWeRefuseToBuildInV1Narrative: '',
        whyThisLeanV1WinsFasterNarrative: '',
      });
    }
  }, [
    plan.id,
    plan.moduleDData?.productVehicle?.lastSavedAt,
    plan.moduleDData?.channelMatrix?.lastSavedAt,
    plan.moduleDData?.scopeFilter?.lastSavedAt,
  ]);

  const activeTrackConfig =
    ADAPTIVE_STEP1_CONFIG_BY_TRACK[step1Data.productTrack] ||
    ADAPTIVE_STEP1_CONFIG_BY_TRACK.SAAS_SOFTWARE_AI;

  const activeStep2TrackConfig =
    ADAPTIVE_STEP2_CONFIG_BY_TRACK[step1Data.productTrack] ||
    ADAPTIVE_STEP2_CONFIG_BY_TRACK.SAAS_SOFTWARE_AI;

  const activeStep3TrackConfig =
    ADAPTIVE_STEP3_CONFIG_BY_TRACK[step1Data.productTrack] ||
    ADAPTIVE_STEP3_CONFIG_BY_TRACK.SAAS_SOFTWARE_AI;

  // Extract Upstream Proof from Modules A, B, and C
  const activeSurvey =
    plan.moduleCData?.surveys?.find(
      (s) => s.id === plan.moduleCData?.activeSurveyId
    ) || plan.moduleCData?.surveys?.[0];
  const surveyResponseCount = activeSurvey?.responses?.length || 0;
  const waitlistCount =
    activeSurvey?.responses?.filter((r) => r.joinedWaitlist).length || 0;
  const interviewCount =
    plan.moduleCData?.interviewLogs?.length ||
    activeSurvey?.interviewLogs?.length ||
    0;
  const validatedPainPoint =
    activeSurvey?.aiInsightsSummary?.validatedPainPoints?.[0] ||
    activeSurvey?.aiInsightsSummary?.headlineTakeaway ||
    plan.conceptCanvas?.coreProblem ||
    plan.oneLinerSummary ||
    '';

  const handleSelectTrack = (newTrack: ProductTrackType) => {
    if (isVaultReadonly) return;
    const nextCfg = ADAPTIVE_STEP1_CONFIG_BY_TRACK[newTrack];
    const formFactorStillValid = nextCfg.formFactorOptions.some(
      (opt) => opt.value === step1Data.formFactor
    );
    const v1ApproachStillValid = nextCfg.v1ApproachOptions.some(
      (opt) => opt.value === step1Data.v1PrototypeApproach
    );

    setStep1Data((prev) => ({
      ...prev,
      productTrack: newTrack,
      isTrackAutoDetected: false,
      formFactor: formFactorStillValid
        ? prev.formFactor
        : nextCfg.defaultFormFactor,
      v1PrototypeApproach: v1ApproachStillValid
        ? prev.v1PrototypeApproach
        : nextCfg.defaultV1Approach,
    }));

    // Also adapt Step 2 channels & delivery model if previous options do not belong to newTrack
    const nextCfg2 = ADAPTIVE_STEP2_CONFIG_BY_TRACK[newTrack];
    const primaryStillValid = nextCfg2.channelOptions.some(
      (opt) => opt.value === step2Data.primaryChannel
    );
    const deliveryStillValid = nextCfg2.deliveryOptions.some(
      (opt) => opt.value === step2Data.deliveryFulfillmentModel
    );
    const nextPrimary = primaryStillValid
      ? step2Data.primaryChannel
      : nextCfg2.defaultPrimaryChannel;
    const nextSecondary = primaryStillValid
      ? step2Data.secondaryChannels.filter((sc) =>
          nextCfg2.channelOptions.some((o) => o.value === sc)
        )
      : nextCfg2.defaultSecondaryChannels;
    const nextShare = nextCfg2.defaultPrimarySharePercent;

    setStep2Data((prev) => ({
      ...prev,
      primaryChannel: nextPrimary,
      secondaryChannels: nextSecondary,
      primaryChannelSharePercent: nextShare,
      estimatedBlendedFeePercent: computeAutoBlendedFeePercent(
        newTrack,
        nextPrimary,
        nextSecondary,
        nextShare
      ),
      deliveryFulfillmentModel: deliveryStillValid
        ? prev.deliveryFulfillmentModel
        : nextCfg2.defaultDeliveryModel,
    }));

    // Preserve user's Step 3 scope items when switching tracks (never overwrite with track defaults)
    const nextCfg3 = ADAPTIVE_STEP3_CONFIG_BY_TRACK[newTrack];
    const disciplineRuleStillValid =
      step3Data.scopeDisciplineRule === 'OTHER' ||
      nextCfg3.disciplineRuleOptions.some(
        (opt) => opt.value === step3Data.scopeDisciplineRule
      );
    const nextStep3: ScopeFilterStep3Data = {
      ...step3Data,
      scopeDisciplineRule: disciplineRuleStillValid
        ? step3Data.scopeDisciplineRule
        : '',
      lastSavedAt: new Date().toISOString(),
    };
    setStep3Data(nextStep3);
    void onSaveStep1ProductVehicle(
      {
        ...step1Data,
        productTrack: newTrack,
        isTrackAutoDetected: false,
        formFactor: formFactorStillValid
          ? step1Data.formFactor
          : nextCfg.defaultFormFactor,
        v1PrototypeApproach: v1ApproachStillValid
          ? step1Data.v1PrototypeApproach
          : nextCfg.defaultV1Approach,
        lastSavedAt: new Date().toISOString(),
      },
      20
    );
    void onSaveStep2ChannelMatrix(
      {
        ...step2Data,
        primaryChannel: nextPrimary,
        secondaryChannels: nextSecondary,
        primaryChannelSharePercent: nextShare,
        estimatedBlendedFeePercent: computeAutoBlendedFeePercent(
          newTrack,
          nextPrimary,
          nextSecondary,
          nextShare
        ),
        deliveryFulfillmentModel: deliveryStillValid
          ? step2Data.deliveryFulfillmentModel
          : nextCfg2.defaultDeliveryModel,
        lastSavedAt: new Date().toISOString(),
      },
      40
    );
    persistStep3ScopeFilter(nextStep3);
  };

  const handleLoadScenarioPreset = (
    preset: 'BMU_SAAS' | 'WOODWORKER_AMAZON_ETSY' | 'AUTISM_SLEEP_EDUCATION'
  ) => {
    if (isVaultReadonly) return;
    const nowIso = new Date().toISOString();
    if (preset === 'BMU_SAAS') {
      const nextS1: ProductVehicleStep1Data = {
        productTrack: 'SAAS_SOFTWARE_AI',
        otherProductTrackText: '',
        isTrackAutoDetected: false,
        formFactor: 'WEB_PLATFORM',
        otherFormFactorText: '',
        v1PrototypeApproach: 'FOCUSED_FULL_CODE_V1',
        otherV1PrototypeApproachText: '',
        launchTimeline: '1_TO_3_MONTHS',
        otherLaunchTimelineText: '',
        ahaMomentNarrative:
          'Within 60 seconds of signing up in their browser, an early-stage founder enters their raw startup idea and immediately receives a structured 1-Page Concept Canvas, Mom-Test public survey (/v/[slug]), and localized IE/UK Grant Readiness score—without touching a blank 40-page template.',
        whyThisVehicleFitsCustomer:
          'A desktop-first, mobile-ready Web Platform avoids Apple/Google App Store 15–30% commissions, gives founders a full-screen workspace for financial & grant compilation, and provides mobile-optimized public survey links (/v/[slug]) for respondents.',
        lastSavedAt: nowIso,
      };
      const nextS2: ChannelMatrixStep2Data = {
        primaryChannel: 'DIRECT_WEB_STRIPE',
        otherPrimaryChannelText: '',
        secondaryChannels: [
          'LTD_LAUNCH_MARKETPLACE',
          'B2B_INSTITUTIONAL_INVOICE',
        ],
        otherSecondaryChannelText: '',
        primaryChannelSharePercent: 75,
        estimatedBlendedFeePercent: computeAutoBlendedFeePercent(
          'SAAS_SOFTWARE_AI',
          'DIRECT_WEB_STRIPE',
          ['LTD_LAUNCH_MARKETPLACE', 'B2B_INSTITUTIONAL_INVOICE'],
          75
        ),
        deliveryFulfillmentModel: 'HYBRID_SELF_SERVE_PLUS_COHORT_CODE',
        otherDeliveryFulfillmentText: '',
        rentToOwnBridgeStrategy:
          'Founders enter via our free Module A hook or redeem an AppSumo LTD / University Cohort voucher code directly on buildmyunicorn.com—so we own 100% of user emails, workspace data, and upgrade paths with zero mobile app store tax.',
        channelWhyItFitsNotes:
          'Direct Web Checkout via Stripe (~2.9% fee) preserves 97% gross margin on 6-Month Passes, while AppSumo LTD and Irish LEO / UK University cohort licences give us rapid initial user volume and reviews without burning cash on cold ads.',
        lastSavedAt: nowIso,
      };
      const nextS3: ScopeFilterStep3Data = {
        items: ADAPTIVE_STEP3_CONFIG_BY_TRACK.SAAS_SOFTWARE_AI.defaultItems,
        scopeDisciplineRule: 'CORE_AHA_FLOW_ONLY_NO_NATIVE_APP',
        otherScopeDisciplineRuleText: '',
        whatWeRefuseToBuildInV1Narrative:
          'In Version 1, we strictly refuse to build native iOS/Android mobile apps, live Xero/QuickBooks accounting syncs, or custom enterprise SAML SSO. Every engineering hour is focused on the core browser workspace, /v/[slug] validation surveys, and official IE/UK grant exports.',
        whyThisLeanV1WinsFasterNarrative:
          'Keeping Version 1 locked to 4 core web capabilities lets us ship in weeks, convert 6-Month Pass and AppSumo/Cohort customers immediately, and protect cloud AI margins with our 500 calls/day circuit breaker.',
        lastSavedAt: nowIso,
      };
      setStep1Data(nextS1);
      setStep2Data(nextS2);
      setStep3Data(nextS3);
      void onSaveStep1ProductVehicle(nextS1, 25);
      void onSaveStep2ChannelMatrix(nextS2, 50);
      persistStep3ScopeFilter(nextS3);
      setSaveBanner(
        'Loaded & saved Example #1: SaaS Platform (Build My Unicorn) across Steps 1, 2 & 3 — Check Step 3 to see the Ruthless V1 SaaS Feature Scope Board!'
      );
    } else if (preset === 'WOODWORKER_AMAZON_ETSY') {
      const nextS1: ProductVehicleStep1Data = {
        productTrack: 'PHYSICAL_PRODUCT_ECOM',
        otherProductTrackText: '',
        isTrackAutoDetected: false,
        formFactor: 'CURATED_2_3_SKUS',
        otherFormFactorText: '',
        v1PrototypeApproach: 'IN_HOUSE_SMALL_BATCH_WORKSHOP',
        otherV1PrototypeApproachText: '',
        launchTimeline: 'UNDER_4_WEEKS',
        otherLaunchTimelineText: '',
        ahaMomentNarrative:
          'When a gift buyer unboxes their parcel from Etsy or Amazon, they lift out a heavy, satin-finished hardwood chopping board with a deep juice groove, custom laser-engraved wedding/housewarming name, a 50ml tin of beeswax board butter, and a care card with a QR code.',
        whyThisVehicleFitsCustomer:
          'Focusing Day 1 on a 2–3 SKU hero range produced in repeatable workshop batches of 20 boards (using router jigs and batch clamping) cuts labour per board from 3 hours down to 40 minutes, keeps parcel weight under 2kg for Amazon FBA/courier tiers, and requires zero factory MOQs.',
        lastSavedAt: nowIso,
      };
      const nextS2: ChannelMatrixStep2Data = {
        primaryChannel: 'ETSY_MARKETPLACE',
        otherPrimaryChannelText: '',
        secondaryChannels: ['AMAZON_FBA', 'DIRECT_WEB_CRAFT_MARKETS'],
        otherSecondaryChannelText: '',
        primaryChannelSharePercent: 55,
        estimatedBlendedFeePercent: computeAutoBlendedFeePercent(
          'PHYSICAL_PRODUCT_ECOM',
          'ETSY_MARKETPLACE',
          ['AMAZON_FBA', 'DIRECT_WEB_CRAFT_MARKETS'],
          55
        ),
        deliveryFulfillmentModel: 'HYBRID_FBA_STANDARD_WORKSHOP_CUSTOM',
        otherDeliveryFulfillmentText: '',
        rentToOwnBridgeStrategy:
          'Every chopping board shipped via Etsy or Amazon includes a branded kraft care card with a QR code offering a free "Heirloom Timber Care Guide + 15% off Beeswax Board Butter Refills" on our direct website—turning rented marketplace gift buyers into owned direct repeat customers.',
        channelWhyItFitsNotes:
          'Etsy (~10.5% fee) gives us immediate high-intent handmade gift buyers for custom engraved boards shipped from our workshop, while Amazon FBA (~31% total fee) moves standard non-engraved boards on Prime autopilot. Our direct website & craft markets (~2.9% fee) capture 97% margin on repeat refills and corporate orders.',
        lastSavedAt: nowIso,
      };
      const nextS3: ScopeFilterStep3Data = {
        items: ADAPTIVE_STEP3_CONFIG_BY_TRACK.PHYSICAL_PRODUCT_ECOM.defaultItems,
        scopeDisciplineRule: 'MAX_2_3_HERO_SKUS_STANDARD_JIG',
        otherScopeDisciplineRuleText: '',
        whatWeRefuseToBuildInV1Narrative:
          'In Version 1, we strictly refuse custom one-off board dimensions, exotic slow-curing resin river pours, and stocking 10+ timber species. Every V1 board is cut on the same two workshop jigs and fits into a single standardized double-walled kraft gift box under 2kg.',
        whyThisLeanV1WinsFasterNarrative:
          'Restricting V1 to 2–3 Hero SKUs lets us batch-glue and CNC/router-finish 20 boards at a time, cutting workshop labour from 3 hours to 40 minutes per board and protecting a 60%+ gross margin across Etsy and Amazon FBA.',
        lastSavedAt: nowIso,
      };
      setStep1Data(nextS1);
      setStep2Data(nextS2);
      setStep3Data(nextS3);
      void onSaveStep1ProductVehicle(nextS1, 25);
      void onSaveStep2ChannelMatrix(nextS2, 50);
      persistStep3ScopeFilter(nextS3);
      setSaveBanner(
        'Loaded & saved Example #2: Woodworker Chopping Boards (Amazon & Etsy) across Steps 1, 2 & 3 — Check Step 3 to see Hero SKUs vs. Offcut Coasters vs. Refused Custom Resin Tables!'
      );
    } else if (preset === 'AUTISM_SLEEP_EDUCATION') {
      const nextS1: ProductVehicleStep1Data = {
        productTrack: 'EDUCATION_PROGRAM_COHORT',
        otherProductTrackText: '',
        isTrackAutoDetected: false,
        formFactor: 'MOBILE_WEB_PORTAL_AUDIO_VIDEO',
        otherFormFactorText: '',
        v1PrototypeApproach: 'HOSTED_PORTAL_PLUS_LIVE_QA',
        otherV1PrototypeApproachText: '',
        launchTimeline: 'UNDER_4_WEEKS',
        otherLaunchTimelineText: '',
        ahaMomentNarrative:
          'Within 3 minutes of joining on their phone at bedtime, an exhausted parent of an autistic child completes the Sensory Bedtime Profile Quiz, listens to a 5-minute "listen-in-the-dark" audio guide matched to their child’s sensory needs, and opens tonight’s printable visual bedtime routine.',
        whyThisVehicleFitsCustomer:
          'Sleep-deprived parents cannot watch 60-minute desktop lectures, and spending €25,000+ building a custom iOS app delays helping families by 6 months. A Mobile-Ready Web Portal with 5-minute audio lessons, a 14-night sleep tracker, and weekly live Q&A launches in under 4 weeks and keeps 97% margin.',
        lastSavedAt: nowIso,
      };
      const nextS2: ChannelMatrixStep2Data = {
        primaryChannel: 'DIRECT_WEB_PORTAL_STRIPE',
        otherPrimaryChannelText: '',
        secondaryChannels: [
          'CHARITY_CLINIC_PARTNERSHIPS',
          'HOSTED_COURSE_COMMUNITY',
        ],
        otherSecondaryChannelText: '',
        primaryChannelSharePercent: 75,
        estimatedBlendedFeePercent: computeAutoBlendedFeePercent(
          'EDUCATION_PROGRAM_COHORT',
          'DIRECT_WEB_PORTAL_STRIPE',
          ['CHARITY_CLINIC_PARTNERSHIPS', 'HOSTED_COURSE_COMMUNITY'],
          75
        ),
        deliveryFulfillmentModel: 'HYBRID_ON_DEMAND_PLUS_LIVE_QA',
        otherDeliveryFulfillmentText: '',
        rentToOwnBridgeStrategy:
          'Exhausted parents discover us via autism charities, OT clinics, and SEN parent groups using a free "5-Minute Sensory Bedtime Checklist & Printable Visual Routine Card"—capturing 100% owned parent emails before they enrol on our direct web portal (avoiding Apple’s 30% app store tax).',
        channelWhyItFitsNotes:
          'Selling directly via our mobile-friendly web portal with Stripe (~2.9% fee) plus charity/OT clinic referral partners keeps blended fees at ~4.5% instead of losing 30% to the Apple App Store, while instant 24/7 audio access + weekly live Q&A supports parents when bedtime struggles happen.',
        lastSavedAt: nowIso,
      };
      const nextS3: ScopeFilterStep3Data = {
        items:
          ADAPTIVE_STEP3_CONFIG_BY_TRACK.EDUCATION_PROGRAM_COHORT.defaultItems,
        scopeDisciplineRule: 'BITE_SIZED_5MIN_AUDIO_NO_CUSTOM_APP',
        otherScopeDisciplineRuleText: '',
        whatWeRefuseToBuildInV1Narrative:
          'In Version 1, we refuse to spend €25,000 and 6 months building a custom native iOS/Android app or recording 40 hours of academic lectures. Everything is delivered as 5-minute audio/video guides and printable visual schedules inside a mobile-ready web portal.',
        whyThisLeanV1WinsFasterNarrative:
          'Launching our core 6-module sensory sleep toolkit and weekly live Q&A in under 4 weeks lets us help our first 50 families immediately, gather real 14-night sleep improvement data, and keep 97% gross margin via Stripe.',
        lastSavedAt: nowIso,
      };
      setStep1Data(nextS1);
      setStep2Data(nextS2);
      setStep3Data(nextS3);
      void onSaveStep1ProductVehicle(nextS1, 25);
      void onSaveStep2ChannelMatrix(nextS2, 50);
      persistStep3ScopeFilter(nextS3);
      setSaveBanner(
        'Loaded & saved Example #3: Autism Parent Sleep Educational Platform across Steps 1, 2 & 3 — Check Step 3 to see 5-Min Audio & Printables vs. Refused €25k Custom App!'
      );
    }
  };

  const handleAiGenerateStep1 = async () => {
    if (isVaultReadonly || isGeneratingAi) return;
    setIsGeneratingAi(true);
    setSaveBanner(null);
    try {
      const res = await onGenerateAiProductVehicle({
        selectedTrack: step1Data.productTrack,
        otherProductTrackText: step1Data.otherProductTrackText,
        validatedPainSummary: validatedPainPoint,
      });
      setStep1Data((prev) => ({
        ...prev,
        ahaMomentNarrative: res.ahaMomentNarrative || prev.ahaMomentNarrative,
        whyThisVehicleFitsCustomer:
          res.whyThisVehicleFitsCustomer || prev.whyThisVehicleFitsCustomer,
        aiEngineUsed: res.engineMode,
      }));
      setSaveBanner(
        `Drafted track-tailored V1 Product Vehicle & Aha! Moment (${
          res.engineMode === 'gemini-2.5-flash'
            ? 'Gemini 2.5 Flash'
            : 'Smart Synthesizer'
        }). Feel free to tweak any wording!`
      );
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSaveStep1 = async (goToStep2After = false) => {
    if (isVaultReadonly || isSavingStep1) return;
    setIsSavingStep1(true);
    setSaveBanner(null);
    try {
      const hasNarratives =
        step1Data.ahaMomentNarrative.trim().length > 10 &&
        step1Data.whyThisVehicleFitsCustomer.trim().length > 10;
      const progress = hasNarratives ? 25 : 15;
      await onSaveStep1ProductVehicle(
        {
          ...step1Data,
          lastSavedAt: new Date().toISOString(),
        },
        progress
      );
      if (goToStep2After) {
        setActiveTab('STEP_2');
        setSaveBanner(
          'Step 1 saved! Now configure Step 2: Own vs. Rent Sales & Delivery Channels tailored to your track.'
        );
      } else {
        setSaveBanner(
          'Step 1 (Product Track, Form Factor & V1 Launch Vehicle) saved to your Startup Plan!'
        );
      }
    } finally {
      setIsSavingStep1(false);
    }
  };

  const handleAiGenerateStep2 = async () => {
    if (isVaultReadonly || isGeneratingStep2Ai) return;
    setIsGeneratingStep2Ai(true);
    setSaveBanner(null);
    try {
      const res = await onGenerateAiChannelMatrix({
        selectedTrack: step1Data.productTrack,
        otherProductTrackText: step1Data.otherProductTrackText,
        formFactor: step1Data.formFactor,
      });
      setStep2Data((prev) => ({
        ...prev,
        rentToOwnBridgeStrategy:
          res.rentToOwnBridgeStrategy || prev.rentToOwnBridgeStrategy,
        channelWhyItFitsNotes:
          res.channelWhyItFitsNotes || prev.channelWhyItFitsNotes,
        aiEngineUsed: res.engineMode,
      }));
      setSaveBanner(
        `Drafted Own vs. Rent Channel & Bridge Strategy (${
          res.engineMode === 'gemini-2.5-flash'
            ? 'Gemini 2.5 Flash'
            : 'Smart Synthesizer'
        }) for ${selectedTrackMeta.badgeText}!`
      );
    } finally {
      setIsGeneratingStep2Ai(false);
    }
  };

  const handleSaveStep2 = async (goToStep3After = false) => {
    if (isVaultReadonly || isSavingStep2) return;
    setIsSavingStep2(true);
    setSaveBanner(null);
    try {
      const hasNotes =
        step2Data.rentToOwnBridgeStrategy.trim().length > 10 &&
        step2Data.channelWhyItFitsNotes.trim().length > 10;
      const progress = hasNotes ? 45 : 35;
      await onSaveStep2ChannelMatrix(
        {
          ...step2Data,
          lastSavedAt: new Date().toISOString(),
        },
        progress
      );
      if (goToStep3After) {
        setActiveTab('STEP_3');
        setSaveBanner(
          `Step 2 (${step2Data.estimatedBlendedFeePercent}% Blended Fee) saved! Now configure Step 3: Ruthless V1 Scope Filter.`
        );
      } else {
        setSaveBanner(
          `Step 2 (Own vs. Rent Channels & ${step2Data.estimatedBlendedFeePercent}% Blended Fee) saved! Module G Pricing will automatically pull this fee.`
        );
      }
    } finally {
      setIsSavingStep2(false);
    }
  };

  const persistStep3ScopeFilter = (nextStep3: ScopeFilterStep3Data) => {
    const hasNarratives =
      nextStep3.whatWeRefuseToBuildInV1Narrative.trim().length > 10 &&
      nextStep3.whyThisLeanV1WinsFasterNarrative.trim().length > 10;
    const progress = hasNarratives ? 65 : 55;
    void onSaveStep3ScopeFilter(
      {
        ...nextStep3,
        lastSavedAt: new Date().toISOString(),
      },
      progress
    );
  };

  const syncStep3NarrativesAndRuleFromItems = (
    nextItems: ScopeFilterItem[],
    prev: ScopeFilterStep3Data
  ): ScopeFilterStep3Data => {
    const v1List = nextItems.filter((i) => i.bucket === 'MUST_HAVE_V1');
    const v15List = nextItems.filter((i) => i.bucket === 'FAST_FOLLOW_V1_5');
    const v2List = nextItems.filter((i) => i.bucket === 'PARKING_LOT_V2');

    if (nextItems.length === 0) {
      return {
        ...prev,
        items: [],
        scopeDisciplineRule: '',
        otherScopeDisciplineRuleText: '',
        whatWeRefuseToBuildInV1Narrative: '',
        whyThisLeanV1WinsFasterNarrative: '',
      };
    }

    const v1Titles = v1List.map((i) => i.title);
    const v15Titles = v15List.map((i) => i.title);
    const v2Titles = v2List.map((i) => i.title);

    const liveMustHaveSummary =
      v1Titles.length > 0
        ? `Non-Negotiable V1 Launch Gate (${v1Titles.length} Must-Have ${
            v1Titles.length === 1 ? 'Deliverable' : 'Deliverables'
          } Required Before Launch): ${v1Titles.join('; ')}.`
        : 'No Must-Have V1 items locked yet — add or move your non-negotiable launch deliverables into Column 1 above.';

    const nextWhyLeanNarrative =
      v1Titles.length > 0
        ? `${liveMustHaveSummary} By dedicating 100% of our Day-1 build capacity strictly to ${
            v1Titles.length === 1
              ? `"${v1Titles[0]}"`
              : `these ${v1Titles.length} core deliverables`
          }, we validate real customer demand and generate revenue faster without over-engineering.`
        : '';

    const refuseParts: string[] = [];
    if (v2Titles.length > 0) {
      refuseParts.push(
        `Explicitly refused in Version 1 (parked in V2 Icebox): ${v2Titles.join(
          '; '
        )}.`
      );
    }
    if (v15Titles.length > 0) {
      refuseParts.push(
        `Deferred to V1.5 Fast-Follow (Months 3–6 post-launch): ${v15Titles.join(
          '; '
        )}.`
      );
    }
    if (refuseParts.length === 0 && v1Titles.length > 0) {
      refuseParts.push(
        `Anything outside our ${v1Titles.length} Must-Have V1 requirement(s) (${v1Titles.join(
          ', '
        )}) is strictly refused for Day-1 launch to prevent scope creep.`
      );
    }

    const nextRule: V1ScopeDisciplineRuleType | '' =
      prev.scopeDisciplineRule || activeStep3TrackConfig.defaultDisciplineRule;

    const nextOtherRuleText =
      v1Titles.length > 0
        ? `Before V1 launch, we must deliver: ${v1Titles.join(
            ' + '
          )}. Everything else waits for V1.5/V2.`
        : prev.otherScopeDisciplineRuleText || '';

    return {
      ...prev,
      items: nextItems,
      scopeDisciplineRule: nextRule,
      otherScopeDisciplineRuleText: nextOtherRuleText,
      whatWeRefuseToBuildInV1Narrative: refuseParts.join(' '),
      whyThisLeanV1WinsFasterNarrative: nextWhyLeanNarrative,
    };
  };

  const handleMoveScopeItemBucket = (
    itemId: string,
    targetBucket: ScopeBucketType
  ) => {
    if (isVaultReadonly) return;
    const nextItems = step3Data.items.map((it) =>
      it.id === itemId ? { ...it, bucket: targetBucket } : it
    );
    const nextStep3 = syncStep3NarrativesAndRuleFromItems(nextItems, step3Data);
    setStep3Data(nextStep3);
    persistStep3ScopeFilter(nextStep3);
  };

  const handleRemoveScopeItem = (itemId: string) => {
    if (isVaultReadonly) return;
    const nextItems = step3Data.items.filter((it) => it.id !== itemId);
    const nextStep3 = syncStep3NarrativesAndRuleFromItems(nextItems, step3Data);
    setStep3Data(nextStep3);
    persistStep3ScopeFilter(nextStep3);
  };

  const handleConfirmClearAllScopeItems = () => {
    if (isVaultReadonly) return;
    const clearedStep3: ScopeFilterStep3Data = {
      ...step3Data,
      items: [],
      scopeDisciplineRule: '',
      otherScopeDisciplineRuleText: '',
      whatWeRefuseToBuildInV1Narrative: '',
      whyThisLeanV1WinsFasterNarrative: '',
      lastSavedAt: new Date().toISOString(),
    };
    setStep3Data(clearedStep3);
    persistStep3ScopeFilter(clearedStep3);
    setShowClearScopeBoardConfirm(false);
    setSaveBanner(
      'Cleared & saved! The Ruthless V1 Feature Scope Board and Version 1 Scope Discipline Rule are now empty so you can build from scratch.'
    );
  };

  const handleAddCustomScopeItem = () => {
    if (isVaultReadonly) return;
    const cleanTitle = newScopeItemTitle.trim();
    if (!cleanTitle) return;

    const defaultTag =
      activeStep3TrackConfig.categoryTagOptions[0] || 'Core Scope';
    const selectedCategory = newScopeItemCategory || defaultTag;
    const finalCategoryTag =
      selectedCategory === 'OTHER' && newScopeItemOtherCategory.trim()
        ? newScopeItemOtherCategory.trim()
        : selectedCategory;

    const newItem: ScopeFilterItem = {
      id: `custom-scope-${Date.now()}`,
      title: cleanTitle,
      bucket: newScopeItemBucket,
      categoryTag: finalCategoryTag,
      otherCategoryTagText:
        selectedCategory === 'OTHER'
          ? newScopeItemOtherCategory.trim()
          : undefined,
      effortImpact: newScopeItemEffort,
      rationaleOrNote:
        newScopeItemNote.trim() ||
        (newScopeItemBucket === 'MUST_HAVE_V1'
          ? 'Added to Day-1 Version 1 launch scope.'
          : newScopeItemBucket === 'FAST_FOLLOW_V1_5'
            ? 'Scheduled for V1.5 Fast-Follow after initial launch.'
            : 'Parked in V2 Icebox to prevent Day-1 scope creep.'),
    };

    const nextItems = [...step3Data.items, newItem];
    const nextStep3 = syncStep3NarrativesAndRuleFromItems(nextItems, step3Data);
    setStep3Data(nextStep3);
    persistStep3ScopeFilter(nextStep3);
    setNewScopeItemTitle('');
    setNewScopeItemNote('');
    setNewScopeItemOtherCategory('');
  };

  const handleQuickAddChip = (chip: {
    title: string;
    bucket: ScopeBucketType;
    categoryTag: string;
    effortImpact: ScopeItemEffortType;
    rationaleOrNote: string;
  }) => {
    if (isVaultReadonly) return;
    const alreadyExists = step3Data.items.some(
      (it) => it.title.toLowerCase() === chip.title.toLowerCase()
    );
    if (alreadyExists) return;
    const nextItems = [
      ...step3Data.items,
      {
        id: `chip-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        ...chip,
      },
    ];
    const nextStep3 = syncStep3NarrativesAndRuleFromItems(nextItems, step3Data);
    setStep3Data(nextStep3);
    persistStep3ScopeFilter(nextStep3);
  };

  const handleAiGenerateStep3 = async () => {
    if (isVaultReadonly || isGeneratingStep3Ai) return;
    setIsGeneratingStep3Ai(true);
    setSaveBanner(null);
    try {
      const res = await onGenerateAiScopeFilter({
        selectedTrack: step1Data.productTrack,
        otherProductTrackText: step1Data.otherProductTrackText,
        formFactor: step1Data.formFactor,
        primaryChannel: step2Data.primaryChannel,
        validatedPainSummary: validatedPainPoint,
        currentScopeItems: step3Data.items,
      });
      // Never populate or overwrite step3Data.items with AI defaults — only draft the Anti-Scope-Creep Charter narratives
      const nextStep3: ScopeFilterStep3Data = {
        ...step3Data,
        items: step3Data.items,
        whatWeRefuseToBuildInV1Narrative:
          res.whatWeRefuseToBuildInV1Narrative ||
          step3Data.whatWeRefuseToBuildInV1Narrative,
        whyThisLeanV1WinsFasterNarrative:
          res.whyThisLeanV1WinsFasterNarrative ||
          step3Data.whyThisLeanV1WinsFasterNarrative,
        aiEngineUsed: res.engineMode,
        lastSavedAt: new Date().toISOString(),
      };
      setStep3Data(nextStep3);
      persistStep3ScopeFilter(nextStep3);
      setSaveBanner(
        `Drafted & saved Anti-Scope-Creep Charter & Grant Justification (${
          res.engineMode === 'gemini-2.5-flash'
            ? 'Gemini 2.5 Flash'
            : 'Smart Synthesizer'
        }) based on your saved scope!`
      );
    } finally {
      setIsGeneratingStep3Ai(false);
    }
  };

  const handleSaveStep3 = async () => {
    if (isVaultReadonly || isSavingStep3) return;
    setIsSavingStep3(true);
    setSaveBanner(null);
    try {
      const hasNarratives =
        step3Data.whatWeRefuseToBuildInV1Narrative.trim().length > 10 &&
        step3Data.whyThisLeanV1WinsFasterNarrative.trim().length > 10;
      const progress = hasNarratives ? 65 : 55;
      await onSaveStep3ScopeFilter(
        {
          ...step3Data,
          lastSavedAt: new Date().toISOString(),
        },
        progress
      );
      setSaveBanner(
        `Step 3 (Ruthless V1 Scope Filter: ${
          step3Data.items.filter((i) => i.bucket === 'MUST_HAVE_V1').length
        } Day-1 Core items vs. ${
          step3Data.items.filter((i) => i.bucket !== 'MUST_HAVE_V1').length
        } Deferred/Refused items) saved!`
      );
    } finally {
      setIsSavingStep3(false);
    }
  };

  const selectedTrackMeta =
    PRODUCT_TRACK_OPTIONS.find((t) => t.value === step1Data.productTrack) ||
    PRODUCT_TRACK_OPTIONS[0];
  const SelectedTrackIcon = selectedTrackMeta.icon;

  return (
    <div className="space-y-6">
      {/* ================================================================= */}
      {/* MODULE D HEADER CARD & 6-STEP NAVIGATION                          */}
      {/* ================================================================= */}
      <Card className="border-indigo-200 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white shadow-md">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-indigo-500/30 text-indigo-200 hover:bg-indigo-500/40">
                  Module D • Product &amp; Delivery Blueprint
                </Badge>
                <Badge
                  variant="outline"
                  className="border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                >
                  <SelectedTrackIcon className="mr-1 h-3 w-3" />
                  {selectedTrackMeta.badgeText}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-slate-700 bg-slate-800/70 text-slate-300"
                >
                  {countryPack.countryName} ({plan.baseCurrency})
                </Badge>
              </div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                What Are We Actually Building? (Product &amp; V1 Blueprint)
              </h1>
              <p className="max-w-3xl text-xs text-slate-300 sm:text-sm">
                Turn your validated customer insights from Modules A–C into a
                right-sized Version 1 product—automatically tailored to whether
                you are building{' '}
                <strong className="text-white">SaaS/Software</strong>, selling a{' '}
                <strong className="text-white">
                  Physical Product on Amazon/Etsy
                </strong>
                , or launching an{' '}
                <strong className="text-white">
                  Educational / Support Platform
                </strong>
                .
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onBackToModuleC}
                className="border-slate-700 bg-slate-800/80 text-xs text-slate-200 hover:bg-slate-700 hover:text-white"
              >
                <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                Module C (Surveys)
              </Button>
            </div>
          </div>

          {/* 6-Step Sub-Navigation Bar */}
          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {[
              {
                id: 'STEP_1' as const,
                stepNum: 'Step 1',
                title: 'Product Track & V1 Format',
                subtitle: 'Adaptive Vehicle & Aha! Moment',
                icon: Layers,
                ready: true,
              },
              {
                id: 'STEP_2' as const,
                stepNum: 'Step 2',
                title: 'Own vs. Rent Channels',
                subtitle: 'Fees, Fulfillment & Bridge',
                icon: ShoppingBag,
                ready: true,
              },
              {
                id: 'STEP_3' as const,
                stepNum: 'Step 3',
                title: 'Ruthless V1 Scope Filter',
                subtitle: 'Day-1 Core vs. V1.5 & V2',
                icon: SlidersHorizontal,
                ready: true,
              },
              {
                id: 'STEP_4' as const,
                stepNum: 'Step 4',
                title: 'Make/Build vs. Buy',
                subtitle: '3-Tier Stack & Secret Sauce',
                icon: Wrench,
                ready: false,
              },
              {
                id: 'STEP_5' as const,
                stepNum: 'Step 5',
                title: 'Work Packages (WP1–4)',
                subtitle: 'Milestones & System Flow',
                icon: Workflow,
                ready: false,
              },
              {
                id: 'STEP_6' as const,
                stepNum: 'Step 6',
                title: 'Blind-Spot Audit & Brief',
                subtitle: 'Review & PDF/HTML Export',
                icon: FileText,
                ready: false,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-start gap-2.5 rounded-xl border p-2.5 text-left transition ${
                    isActive
                      ? 'border-indigo-400 bg-indigo-500/25 text-white shadow-xs'
                      : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:bg-slate-800/70'
                  }`}
                >
                  <div
                    className={`mt-0.5 rounded-lg p-1.5 ${
                      isActive
                        ? 'bg-indigo-500 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                        {tab.stepNum}
                      </span>
                      {tab.id === 'STEP_1' &&
                        step1Data.ahaMomentNarrative.trim().length > 10 && (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        )}
                      {tab.id === 'STEP_2' &&
                        step2Data.rentToOwnBridgeStrategy.trim().length > 10 && (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        )}
                    </div>
                    <div className="truncate text-xs font-semibold">
                      {tab.title}
                    </div>
                    <div className="truncate text-[10px] text-slate-400">
                      {tab.subtitle}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ================================================================= */}
      {/* UPSTREAM PROOF ANCHOR BAR (PULLS FROM MODULES A, B & C)           */}
      {/* ================================================================= */}
      <div className="rounded-xl border border-indigo-200/80 bg-indigo-50/60 p-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-indigo-600 p-2 text-white">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-900">
                  Upstream Customer Anchor (Modules A–C)
                </span>
                {surveyResponseCount > 0 || interviewCount > 0 ? (
                  <Badge className="bg-emerald-600 text-[10px] text-white">
                    Validated: {surveyResponseCount} Survey Responses •{' '}
                    {waitlistCount} Waitlist Leads • {interviewCount} 1-on-1
                    Interviews
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-amber-300 bg-amber-50 text-[10px] text-amber-800"
                  >
                    Concept Stage — Designing V1 around Module A/B Persona
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-700">
                <strong>Target Customer:</strong>{' '}
                {plan.moduleBData?.beachhead?.beachheadSegment ||
                  plan.conceptCanvas?.targetCustomer ||
                  'Early adopters in your beachhead market'}{' '}
                • <strong>#1 Problem to Solve in V1:</strong>{' '}
                <span className="italic text-slate-800">
                  &ldquo;
                  {validatedPainPoint
                    ? validatedPainPoint.slice(0, 180)
                    : 'Deliver a fast, reliable solution to their core bottleneck without over-complicating Day 1.'}
                  &rdquo;
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowExamples((prev) => !prev)}
              className="border-indigo-300 bg-white text-xs text-indigo-700 hover:bg-indigo-50"
            >
              <Lightbulb className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
              {showExamples
                ? 'Hide 3 Real Examples'
                : 'Test 3 Examples (SaaS, Woodworker, Autism Sleep)'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowWhyCard((prev) => !prev)}
              className="border-slate-300 bg-white text-xs text-slate-700"
            >
              <HelpCircle className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
              {showWhyCard ? 'Hide Coaching' : 'Why Ask This?'}
            </Button>
          </div>
        </div>

        {/* 1-CLICK INTERACTIVE SCENARIO TESTER DRAWER */}
        {showExamples && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-white p-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="text-xs font-bold text-slate-900">
                  ✨ Interactive Track Examples — Click Any Example to See Step 1
                  Transform Live
                </div>
                <p className="text-[11px] text-slate-600">
                  See how Module D automatically adapts its questions for a SaaS
                  platform, an Amazon/Etsy Woodworker, or an Autism Parent Sleep
                  Education platform:
                </p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
              {/* Example 1: BMU SaaS */}
              <div className="flex flex-col justify-between rounded-xl border border-indigo-200 bg-indigo-50/40 p-3.5">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <Badge className="bg-indigo-600 text-[10px] text-white">
                      <Laptop className="mr-1 h-3 w-3" />
                      Track 1: SaaS / AI
                    </Badge>
                    <span className="text-[10px] font-semibold text-indigo-700">
                      Build My Unicorn
                    </span>
                  </div>
                  <div className="mt-2 text-xs font-bold text-slate-900">
                    B2B / Prosumer Startup Builder SaaS
                  </div>
                  <p className="mt-1 text-[11px] text-slate-600">
                    <strong>Vehicle:</strong> Responsive Web Platform (0% App
                    Store tax) + Focused Full-Code V1 with Gemini 2.5 AI
                    Co-Pilot.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleLoadScenarioPreset('BMU_SAAS')}
                  className="mt-3 w-full border-indigo-300 bg-white text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                >
                  Load SaaS Example Into Step 1
                </Button>
              </div>

              {/* Example 2: Woodworker Chopping Boards */}
              <div className="flex flex-col justify-between rounded-xl border border-amber-200 bg-amber-50/40 p-3.5">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <Badge className="bg-amber-600 text-[10px] text-white">
                      <Hammer className="mr-1 h-3 w-3" />
                      Track 2: Physical / Craft
                    </Badge>
                    <span className="text-[10px] font-semibold text-amber-800">
                      Amazon &amp; Etsy Maker
                    </span>
                  </div>
                  <div className="mt-2 text-xs font-bold text-slate-900">
                    Artisan Hardwood Chopping Boards
                  </div>
                  <p className="mt-1 text-[11px] text-slate-600">
                    <strong>Vehicle:</strong> Curated 2–3 Hero SKUs (Flagship
                    Board + Beeswax Gift Bundle) produced in 20-unit workshop
                    batches. Zero app questions!
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    handleLoadScenarioPreset('WOODWORKER_AMAZON_ETSY')
                  }
                  className="mt-3 w-full border-amber-300 bg-white text-xs font-semibold text-amber-800 hover:bg-amber-100"
                >
                  Load Woodworker Example Into Step 1
                </Button>
              </div>

              {/* Example 3: Autism Parent Sleep Platform */}
              <div className="flex flex-col justify-between rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <Badge className="bg-emerald-600 text-[10px] text-white">
                      <HeartHandshake className="mr-1 h-3 w-3" />
                      Track 3: Education / Support
                    </Badge>
                    <span className="text-[10px] font-semibold text-emerald-800">
                      Parent Sleep Platform
                    </span>
                  </div>
                  <div className="mt-2 text-xs font-bold text-slate-900">
                    Autism Family Sensory Sleep Platform
                  </div>
                  <p className="mt-1 text-[11px] text-slate-600">
                    <strong>Vehicle:</strong> Mobile-Ready Web Portal with 5-min
                    &ldquo;listen-in-the-dark&rdquo; audio guides, printable
                    visual schedules &amp; 14-night sleep log.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    handleLoadScenarioPreset('AUTISM_SLEEP_EDUCATION')
                  }
                  className="mt-3 w-full border-emerald-300 bg-white text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                >
                  Load Autism Sleep Example Into Step 1
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* STEP 1 CONTENT: PRODUCT TRACK, FORM FACTOR & V1 PROTOTYPE         */}
      {/* ================================================================= */}
      {activeTab === 'STEP_1' ? (
        <div className="space-y-6">
          {/* LAYER 1: WHY ARE WE ASKING THIS? */}
          {showWhyCard && (
            <div className="rounded-xl border border-indigo-100 bg-white p-4 shadow-2xs">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-indigo-100 p-2 text-indigo-700">
                  <Info className="h-4 w-4" />
                </div>
                <div className="space-y-1 text-xs text-slate-600">
                  <div className="font-bold text-slate-900">
                    Why Step 1 Matters: Right-Sizing Your Product Vehicle Before
                    You Spend Money
                  </div>
                  <p>
                    Whether you are applying for an{' '}
                    <strong>Irish LEO / Enterprise Ireland</strong> grant, a{' '}
                    <strong>UK Start Up Loan / Innovate UK</strong> award, or
                    bootstrapping your first 20 sales, assessors and customers
                    want to know <em>specifically</em> what they are getting on
                    Day 1. Selecting your <strong>Product Track</strong> below
                    automatically tailors every question in Module D so you only
                    answer questions relevant to your exact business model.
                  </p>
                </div>
              </div>
            </div>
          )}

          {saveBanner && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-900 shadow-2xs">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{saveBanner}</span>
            </div>
          )}

          {/* QUESTION 1: ADAPTIVE PRODUCT TRACK SELECTOR */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    1. What kind of product or business vehicle are you
                    building?
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-600">
                    Your choice here dynamically switches all questions in
                    Module D (e.g., SaaS founders get Web vs. App questions;
                    Physical sellers get SKU &amp; Workshop Batch questions).
                  </CardDescription>
                </div>
                {step1Data.isTrackAutoDetected && (
                  <Badge
                    variant="outline"
                    className="border-indigo-200 bg-indigo-50 text-[10px] text-indigo-700"
                  >
                    <Sparkles className="mr-1 h-3 w-3" />
                    Auto-Matched from Modules A &amp; B
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {PRODUCT_TRACK_OPTIONS.map((track) => {
                  const Icon = track.icon;
                  const isSelected = step1Data.productTrack === track.value;
                  return (
                    <button
                      key={track.value}
                      type="button"
                      disabled={isVaultReadonly}
                      onClick={() => handleSelectTrack(track.value)}
                      className={`flex flex-col justify-between rounded-xl border p-3.5 text-left transition ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/70'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <div
                            className={`rounded-lg p-2 ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              isSelected
                                ? 'border-indigo-300 bg-indigo-100 text-indigo-800'
                                : 'border-slate-200 text-slate-500'
                            }`}
                          >
                            {track.badgeText}
                          </Badge>
                        </div>
                        <div className="mt-2.5 text-xs font-bold text-slate-900">
                          {track.label}
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                          {track.subtitle}
                        </p>
                      </div>
                      <div className="mt-3 flex items-center justify-end">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                            isSelected ? 'text-indigo-700' : 'text-slate-400'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" />
                              Active Track
                            </>
                          ) : (
                            'Select Track'
                          )}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Mandatory OTHER Inline Input (Rule 1.5) */}
              {step1Data.productTrack === 'OTHER' && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-3.5">
                  <label className="block text-xs font-semibold text-slate-800">
                    Describe your custom Product Track in your own words:
                  </label>
                  <input
                    type="text"
                    disabled={isVaultReadonly}
                    value={step1Data.otherProductTrackText || ''}
                    onChange={(e) =>
                      setStep1Data((prev) => ({
                        ...prev,
                        otherProductTrackText: e.target.value,
                      }))
                    }
                    placeholder="e.g., Licensing IP to manufacturers, Franchise model, or Community Co-Op..."
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-hidden sm:text-xs"
                  />
                </div>
              )}

              {/* Active Track Confirmation Callout */}
              <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 px-3.5 py-2.5 text-xs text-emerald-950">
                <Zap className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <div>
                  <span className="font-bold">
                    {activeTrackConfig.trackHeadline}:
                  </span>{' '}
                  {activeTrackConfig.trackCoachingTip}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QUESTION 2: ADAPTIVE FORM FACTOR / PRODUCT FORMAT */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900">
                {activeTrackConfig.formFactorQuestion}
              </CardTitle>
              <CardDescription className="text-xs text-slate-600">
                {activeTrackConfig.formFactorSubtitle}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {activeTrackConfig.formFactorOptions.map((opt) => {
                  const isSelected = step1Data.formFactor === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={isVaultReadonly}
                      onClick={() =>
                        setStep1Data((prev) => ({
                          ...prev,
                          formFactor: opt.value,
                        }))
                      }
                      className={`flex flex-col justify-between rounded-xl border p-3.5 text-left transition ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {opt.label}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              isSelected
                                ? 'border-indigo-300 bg-indigo-100 text-indigo-800'
                                : 'border-slate-200 text-slate-500'
                            }`}
                          >
                            {opt.tag}
                          </Badge>
                        </div>
                        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
                          {opt.subtitle}
                        </p>
                      </div>
                      <div className="mt-2.5 flex items-center justify-end">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                            isSelected ? 'text-indigo-700' : 'text-slate-400'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-indigo-600" />
                              Selected Format
                            </>
                          ) : (
                            'Select'
                          )}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {step1Data.formFactor === 'OTHER' && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-3.5">
                  <label className="block text-xs font-semibold text-slate-800">
                    Specify your custom Product Format / Form Factor:
                  </label>
                  <input
                    type="text"
                    disabled={isVaultReadonly}
                    value={step1Data.otherFormFactorText || ''}
                    onChange={(e) =>
                      setStep1Data((prev) => ({
                        ...prev,
                        otherFormFactorText: e.target.value,
                      }))
                    }
                    placeholder="Describe how customers access, receive, or use your V1 product..."
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-hidden sm:text-xs"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* QUESTION 3: ADAPTIVE V1 LAUNCH / PROTOTYPE APPROACH */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900">
                {activeTrackConfig.v1ApproachQuestion}
              </CardTitle>
              <CardDescription className="text-xs text-slate-600">
                {activeTrackConfig.v1ApproachSubtitle}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {activeTrackConfig.v1ApproachOptions.map((opt) => {
                  const isSelected =
                    step1Data.v1PrototypeApproach === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={isVaultReadonly}
                      onClick={() =>
                        setStep1Data((prev) => ({
                          ...prev,
                          v1PrototypeApproach: opt.value,
                        }))
                      }
                      className={`flex flex-col justify-between rounded-xl border p-3.5 text-left transition ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {opt.label}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              isSelected
                                ? 'border-indigo-300 bg-indigo-100 text-indigo-800'
                                : 'border-slate-200 text-slate-500'
                            }`}
                          >
                            {opt.tag}
                          </Badge>
                        </div>
                        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
                          {opt.subtitle}
                        </p>
                      </div>
                      <div className="mt-2.5 flex items-center justify-end">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                            isSelected ? 'text-indigo-700' : 'text-slate-400'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-indigo-600" />
                              Selected V1 Approach
                            </>
                          ) : (
                            'Select'
                          )}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {step1Data.v1PrototypeApproach === 'OTHER' && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-3.5">
                  <label className="block text-xs font-semibold text-slate-800">
                    Describe your custom V1 Launch / Prototype Approach:
                  </label>
                  <input
                    type="text"
                    disabled={isVaultReadonly}
                    value={step1Data.otherV1PrototypeApproachText || ''}
                    onChange={(e) =>
                      setStep1Data((prev) => ({
                        ...prev,
                        otherV1PrototypeApproachText: e.target.value,
                      }))
                    }
                    placeholder="Explain how you will produce or deliver your first 10–20 units/accounts..."
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-hidden sm:text-xs"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* QUESTION 4, 5 & 6: TARGET TIMELINE + 60-SECOND AHA MOMENT + WHY IT FITS */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    4. Target V1 Launch Timeline &amp; The 60-Second Customer
                    &ldquo;Aha! Moment&rdquo;
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-600">
                    How quickly can you put V1 into a paying customer&apos;s
                    hands, and what makes them delighted in the first 60
                    seconds?
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={isVaultReadonly || isGeneratingAi}
                  onClick={handleAiGenerateStep1}
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 text-xs text-white hover:from-indigo-700 hover:to-violet-700"
                >
                  {isGeneratingAi ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Drafting for {selectedTrackMeta.badgeText}...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-1.5 h-3.5 w-3.5" />
                      Draft Aha! Moment &amp; Rationale with AI
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Timeline Selector */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Clock className="h-3.5 w-3.5 text-indigo-600" />
                  Target Time to Put Version 1 into Paying Customers&apos; Hands:
                </label>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
                  {LAUNCH_TIMELINE_OPTIONS.map((tl) => {
                    const isSelected = step1Data.launchTimeline === tl.value;
                    return (
                      <button
                        key={tl.value}
                        type="button"
                        disabled={isVaultReadonly}
                        onClick={() =>
                          setStep1Data((prev) => ({
                            ...prev,
                            launchTimeline: tl.value,
                          }))
                        }
                        className={`rounded-xl border p-3 text-left transition ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/20'
                            : 'border-slate-200 bg-white hover:border-indigo-300'
                        }`}
                      >
                        <div className="text-xs font-bold text-slate-900">
                          {tl.label}
                        </div>
                        <p className="mt-1 text-[10px] leading-snug text-slate-600">
                          {tl.subtitle}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {step1Data.launchTimeline === 'OTHER' && (
                  <div className="mt-2 rounded-xl border border-indigo-200 bg-indigo-50/40 p-3">
                    <label className="block text-xs font-semibold text-slate-800">
                      Specify your custom V1 launch timeline or seasonal window:
                    </label>
                    <input
                      type="text"
                      disabled={isVaultReadonly}
                      value={step1Data.otherLaunchTimelineText || ''}
                      onChange={(e) =>
                        setStep1Data((prev) => ({
                          ...prev,
                          otherLaunchTimelineText: e.target.value,
                        }))
                      }
                      placeholder="e.g., Launching October 15th ahead of Q4 Christmas gifting season..."
                      className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-hidden sm:text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Aha! Moment Narrative */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  {activeTrackConfig.ahaPromptLabel}
                </label>
                <p className="text-[11px] text-slate-500">
                  Describe what the customer physically unboxes, clicks, or
                  hears in their very first session—and the immediate win they
                  feel.
                </p>
                <textarea
                  rows={3}
                  disabled={isVaultReadonly}
                  value={step1Data.ahaMomentNarrative}
                  onChange={(e) =>
                    setStep1Data((prev) => ({
                      ...prev,
                      ahaMomentNarrative: e.target.value,
                    }))
                  }
                  placeholder={activeTrackConfig.ahaPromptPlaceholder}
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-base text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-hidden sm:text-xs"
                />
              </div>

              {/* Why This Vehicle Fits */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  {activeTrackConfig.whyFitsLabel}
                </label>
                <p className="text-[11px] text-slate-500">
                  Grant assessors and investors look for pragmatic founders who
                  choose the simplest vehicle that solves the customer&apos;s
                  problem and protects gross margins.
                </p>
                <textarea
                  rows={3}
                  disabled={isVaultReadonly}
                  value={step1Data.whyThisVehicleFitsCustomer}
                  onChange={(e) =>
                    setStep1Data((prev) => ({
                      ...prev,
                      whyThisVehicleFitsCustomer: e.target.value,
                    }))
                  }
                  placeholder={activeTrackConfig.whyFitsPlaceholder}
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-base text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-hidden sm:text-xs"
                />
              </div>

              {/* STEP 1 ACTION FOOTER */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowParkInput((prev) => !prev)}
                    className="border-amber-300 bg-amber-50/70 text-xs text-amber-900 hover:bg-amber-100"
                  >
                    <BookmarkPlus className="mr-1.5 h-3.5 w-3.5 text-amber-700" />
                    Park a Product Question for Later
                  </Button>
                  {step1Data.lastSavedAt && (
                    <span className="text-[11px] text-slate-500">
                      Last saved:{' '}
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
                    variant="outline"
                    size="sm"
                    disabled={isVaultReadonly || isSavingStep1}
                    onClick={() => handleSaveStep1(false)}
                    className="border-indigo-300 bg-white text-xs text-indigo-700 hover:bg-indigo-50"
                  >
                    {isSavingStep1 ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Saving Step 1...
                      </>
                    ) : (
                      <>
                        <Save className="mr-1.5 h-3.5 w-3.5" />
                        Save Step 1
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={isVaultReadonly || isSavingStep1}
                    onClick={() => handleSaveStep1(true)}
                    className="bg-indigo-600 text-xs text-white hover:bg-indigo-700"
                  >
                    Save Step 1 &amp; Go to Step 2 (Channels)
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
                    placeholder="e.g., Should we offer custom board dimensions or stick strictly to 2 standard sizes for V1?"
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
                        'Parked question in your Open Questions Parking Lot!'
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

          {/* LIVE STEP 1 BLUEPRINT PREVIEW CARD */}
          <Card className="border-indigo-200 bg-gradient-to-br from-white to-indigo-50/40 shadow-xs">
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-sm font-bold text-slate-900">
                  📋 Live Step 1 Output Preview (How This Appears in Your Module
                  D Blueprint)
                </CardTitle>
                <Badge
                  variant="outline"
                  className="border-indigo-200 bg-white text-[10px] text-indigo-700"
                >
                  Feeds Modules E, G &amp; K
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-700">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[10px] font-bold uppercase text-slate-400">
                    Selected Product Track
                  </div>
                  <div className="mt-1 font-bold text-slate-900">
                    {step1Data.productTrack === 'OTHER' &&
                    step1Data.otherProductTrackText
                      ? step1Data.otherProductTrackText
                      : selectedTrackMeta.label}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[10px] font-bold uppercase text-slate-400">
                    Day-1 Form Factor / Format
                  </div>
                  <div className="mt-1 font-bold text-slate-900">
                    {step1Data.formFactor === 'OTHER' &&
                    step1Data.otherFormFactorText
                      ? step1Data.otherFormFactorText
                      : activeTrackConfig.formFactorOptions.find(
                          (o) => o.value === step1Data.formFactor
                        )?.label || step1Data.formFactor}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[10px] font-bold uppercase text-slate-400">
                    V1 Prototype &amp; Launch Target
                  </div>
                  <div className="mt-1 font-bold text-slate-900">
                    {step1Data.v1PrototypeApproach === 'OTHER' &&
                    step1Data.otherV1PrototypeApproachText
                      ? step1Data.otherV1PrototypeApproachText
                      : activeTrackConfig.v1ApproachOptions.find(
                          (o) => o.value === step1Data.v1PrototypeApproach
                        )?.label || step1Data.v1PrototypeApproach}{' '}
                    •{' '}
                    <span className="text-indigo-700">
                      {
                        LAUNCH_TIMELINE_OPTIONS.find(
                          (t) => t.value === step1Data.launchTimeline
                        )?.label
                      }
                    </span>
                  </div>
                </div>
              </div>

              {(step1Data.ahaMomentNarrative ||
                step1Data.whyThisVehicleFitsCustomer) && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="text-[10px] font-bold uppercase text-indigo-600">
                      60-Second Customer &ldquo;Aha! Moment&rdquo;
                    </div>
                    <p className="mt-1 leading-relaxed text-slate-700">
                      {step1Data.ahaMomentNarrative ||
                        'Not drafted yet — click "Draft Aha! Moment & Rationale with AI" above or type your own.'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="text-[10px] font-bold uppercase text-emerald-700">
                      Strategic &amp; Margin Fit
                    </div>
                    <p className="mt-1 leading-relaxed text-slate-700">
                      {step1Data.whyThisVehicleFitsCustomer ||
                        'Not drafted yet — explain why this V1 format protects your speed and margins.'}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : activeTab === 'STEP_2' ? (
        <div className="space-y-6">
          {/* LAYER 1: WHY ARE WE ASKING THIS? (STEP 2) */}
          {showWhyCard && (
            <div className="rounded-xl border border-indigo-100 bg-white p-4 shadow-2xs">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-indigo-100 p-2 text-indigo-700">
                  <Info className="h-4 w-4" />
                </div>
                <div className="space-y-1 text-xs text-slate-600">
                  <div className="font-bold text-slate-900">
                    Why Step 2 Matters: &ldquo;Own vs. Rent&rdquo; Channels &amp;
                    Your Real Pocket Margin
                  </div>
                  <p>
                    Third-party marketplaces (like{' '}
                    <strong>Amazon FBA, Etsy, Apple App Store, or AppSumo</strong>)
                    are fantastic for <em>renting</em> ready-to-buy discovery,
                    but they charge <strong>10.5% to 65%</strong> in commissions
                    and often hide customer emails. Direct channels (like your own{' '}
                    <strong>Web Portal / Stripe / Shopify store</strong>) cost
                    only <strong>~2.9%</strong> and give you{' '}
                    <strong>100% customer ownership</strong>. Your blended fee %
                    here automatically flows into{' '}
                    <strong>Module G (Pricing &amp; Unit Economics)</strong> so
                    you never underprice your product.
                  </p>
                </div>
              </div>
            </div>
          )}

          {saveBanner && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-900 shadow-2xs">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{saveBanner}</span>
            </div>
          )}

          {/* ACTIVE TRACK REMINDER BANNER */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-indigo-200 bg-indigo-50/50 px-4 py-2.5 text-xs">
            <div className="flex items-center gap-2 text-slate-800">
              <SelectedTrackIcon className="h-4 w-4 text-indigo-600" />
              <span>
                Showing sales channels &amp; fulfillment options tailored for:{' '}
                <strong className="text-indigo-900">
                  {selectedTrackMeta.label}
                </strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('STEP_1')}
              className="text-[11px] font-semibold text-indigo-700 underline hover:text-indigo-900"
            >
              Change Track in Step 1
            </button>
          </div>

          {/* QUESTION 1: PRIMARY SALES & CHECKOUT CHANNEL */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900">
                {activeStep2TrackConfig.channelQuestionTitle}
              </CardTitle>
              <CardDescription className="text-xs text-slate-600">
                {activeStep2TrackConfig.channelQuestionSubtitle}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {activeStep2TrackConfig.channelOptions.map((opt) => {
                  const isSelected = step2Data.primaryChannel === opt.value;
                  const isOwned = opt.ownershipBadge === '100% Owned Audience';
                  const isRented =
                    opt.ownershipBadge === 'Rented Marketplace Traffic';
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={isVaultReadonly}
                      onClick={() => {
                        const nextPrimary = opt.value;
                        const nextSecondary =
                          step2Data.secondaryChannels.filter(
                            (sc) => sc !== nextPrimary
                          );
                        const nextFee = computeAutoBlendedFeePercent(
                          step1Data.productTrack,
                          nextPrimary,
                          nextSecondary,
                          step2Data.primaryChannelSharePercent
                        );
                        setStep2Data((prev) => ({
                          ...prev,
                          primaryChannel: nextPrimary,
                          secondaryChannels: nextSecondary,
                          estimatedBlendedFeePercent: nextFee,
                        }));
                      }}
                      className={`flex flex-col justify-between rounded-xl border p-3.5 text-left transition ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              isOwned
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                : isRented
                                  ? 'border-amber-300 bg-amber-50 text-amber-900'
                                  : 'border-indigo-200 bg-indigo-50 text-indigo-800'
                            }`}
                          >
                            {opt.ownershipBadge}
                          </Badge>
                          <span className="rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white">
                            ~{opt.typicalFeePercent}% Fee • {opt.payoutSpeed}
                          </span>
                        </div>
                        <div className="mt-2 text-xs font-bold text-slate-900">
                          {opt.label}
                        </div>
                        <div className="mt-1 text-[10px] font-medium text-indigo-700">
                          {opt.feeBreakdownText}
                        </div>
                        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
                          {opt.subtitle}
                        </p>
                      </div>
                      <div className="mt-2.5 flex items-center justify-end">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                            isSelected ? 'text-indigo-700' : 'text-slate-400'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" />
                              Primary Channel
                            </>
                          ) : (
                            'Set as Primary'
                          )}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {step2Data.primaryChannel === 'OTHER' && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-3.5">
                  <label className="block text-xs font-semibold text-slate-800">
                    Specify your custom Primary Sales Channel &amp; typical commission:
                  </label>
                  <input
                    type="text"
                    disabled={isVaultReadonly}
                    value={step2Data.otherPrimaryChannelText || ''}
                    onChange={(e) =>
                      setStep2Data((prev) => ({
                        ...prev,
                        otherPrimaryChannelText: e.target.value,
                      }))
                    }
                    placeholder="e.g., TikTok Shop Live, Regional Trade Distributors, or Corporate Licensing..."
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-hidden sm:text-xs"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* QUESTION 2: SECONDARY / COMPLEMENTARY CHANNELS (MULTI-SELECT) */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    2. Secondary / Complementary Sales Channels (Multi-Select)
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-600">
                    Most smart founders combine a discovery channel with a
                    direct high-margin channel. Select any additional channels
                    you will use in Year 1 (their fees automatically feed into
                    Tile 3 below):
                  </CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className="border-indigo-200 bg-indigo-50 text-[11px] font-semibold text-indigo-800"
                >
                  {step2Data.secondaryChannels.length === 0
                    ? '0 Secondary Channels Selected (100% Primary)'
                    : `${step2Data.secondaryChannels.length} Secondary Channel${
                        step2Data.secondaryChannels.length > 1 ? 's' : ''
                      } Selected`}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Multi-select secondary channels */}
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {activeStep2TrackConfig.channelOptions
                  .filter((opt) => opt.value !== step2Data.primaryChannel)
                  .map((opt) => {
                    const isChecked = step2Data.secondaryChannels.includes(
                      opt.value
                    );
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={isVaultReadonly}
                        onClick={() => {
                          const exists = step2Data.secondaryChannels.includes(
                            opt.value
                          );
                          const nextSec = exists
                            ? step2Data.secondaryChannels.filter(
                                (c) => c !== opt.value
                              )
                            : [...step2Data.secondaryChannels, opt.value];

                          // If user just selected a secondary channel while split was 100% Primary,
                          // automatically switch split to the track default (e.g. 75% / 25%) so secondary fees calculate immediately!
                          // Conversely, if user unchecked all secondary channels, set split to 100% Primary.
                          const nextShare =
                            nextSec.length === 0
                              ? 100
                              : step2Data.primaryChannelSharePercent >= 100
                                ? activeStep2TrackConfig.defaultPrimarySharePercent
                                : step2Data.primaryChannelSharePercent;

                          const nextFee = computeAutoBlendedFeePercent(
                            step1Data.productTrack,
                            step2Data.primaryChannel,
                            nextSec,
                            nextShare
                          );
                          setStep2Data((prev) => ({
                            ...prev,
                            secondaryChannels: nextSec,
                            primaryChannelSharePercent: nextShare,
                            estimatedBlendedFeePercent: nextFee,
                          }));
                        }}
                        className={`flex items-start justify-between gap-2 rounded-xl border p-3 text-left transition ${
                          isChecked
                            ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-500/20'
                            : 'border-slate-200 bg-white hover:border-indigo-200'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900">
                              {opt.label}
                            </span>
                          </div>
                          <div className="mt-1 text-[10px] font-semibold text-indigo-700">
                            ~{opt.typicalFeePercent}% Fee • {opt.ownershipBadge}
                          </div>
                        </div>
                        <div
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                            isChecked
                              ? 'border-indigo-600 bg-indigo-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="h-3 w-3" />}
                        </div>
                      </button>
                    );
                  })}
              </div>

              {step2Data.secondaryChannels.includes('OTHER') && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-3.5">
                  <label className="block text-xs font-semibold text-slate-800">
                    Specify your custom Secondary Sales Channel:
                  </label>
                  <input
                    type="text"
                    disabled={isVaultReadonly}
                    value={step2Data.otherSecondaryChannelText || ''}
                    onChange={(e) =>
                      setStep2Data((prev) => ({
                        ...prev,
                        otherSecondaryChannelText: e.target.value,
                      }))
                    }
                    placeholder="e.g., Corporate Christmas gifting orders, Pop-up retail events, or Affiliate partners..."
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-hidden sm:text-xs"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* QUESTION 3 (DEDICATED TILE): ESTIMATED REVENUE SPLIT & LIVE POCKET REVENUE PREVIEW */}
          {(() => {
            const feeBreakdown = computeChannelFeeBreakdown(
              step1Data.productTrack,
              step2Data.primaryChannel,
              step2Data.secondaryChannels,
              step2Data.primaryChannelSharePercent
            );
            const activeBlendedFee = step2Data.estimatedBlendedFeePercent;
            const netKeptPer100 = Number((100 - activeBlendedFee).toFixed(2));

            return (
              <Card className="border-indigo-200 bg-gradient-to-br from-white via-white to-indigo-50/30 shadow-xs">
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900">
                        3. Estimated Revenue Split (Primary vs. Secondary
                        Channels) &amp; Live Pocket Revenue Preview
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-600">
                        Adjust your expected sales split between your Primary
                        Channel (Tile 1) and Secondary Channels (Tile 2) to
                        calculate your blended platform fee and exact pocket
                        revenue per{' '}
                        {formatCurrencyExactCents(100, plan.baseCurrency)} in
                        sales:
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isVaultReadonly}
                        onClick={() => {
                          const recalc = computeAutoBlendedFeePercent(
                            step1Data.productTrack,
                            step2Data.primaryChannel,
                            step2Data.secondaryChannels,
                            step2Data.primaryChannelSharePercent
                          );
                          setStep2Data((prev) => ({
                            ...prev,
                            estimatedBlendedFeePercent: recalc,
                          }));
                          setSaveBanner(
                            `Recalculated blended fee (${recalc}%) from your active Primary & Secondary channels!`
                          );
                        }}
                        className="border-slate-300 bg-white text-xs text-slate-700 hover:bg-slate-50"
                      >
                        Auto-Calculate from Channels (
                        {feeBreakdown.autoBlendedFeePercent}%)
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isVaultReadonly}
                        onClick={() => {
                          setStep2Data((prev) => ({
                            ...prev,
                            primaryChannelSharePercent:
                              activeStep2TrackConfig.defaultPrimarySharePercent,
                            estimatedBlendedFeePercent:
                              activeStep2TrackConfig.benchmarkBlendedFeePercent,
                          }));
                          setSaveBanner(
                            `Applied ${selectedTrackMeta.badgeText} benchmark fee (${activeStep2TrackConfig.benchmarkBlendedFeePercent}%)!`
                          );
                        }}
                        className="border-indigo-200 bg-indigo-50/60 text-xs text-indigo-800 hover:bg-indigo-100"
                      >
                        Use Track Benchmark (
                        {activeStep2TrackConfig.benchmarkBlendedFeePercent}%)
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                    {/* Left Column: Revenue Split Selector + Channel Math Breakdown */}
                    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs lg:col-span-7">
                      <div>
                        <label className="block text-xs font-bold text-slate-900">
                          Select Your Revenue Split (Primary vs. Secondary
                          Channels):
                        </label>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {step2Data.secondaryChannels.length === 0
                            ? 'No secondary channels selected in Tile 2 — currently calculating 100% Primary Channel. Select a secondary channel above or click a split below to include secondary channels.'
                            : `Splitting sales between ${feeBreakdown.primaryLabel} and ${step2Data.secondaryChannels.length} secondary channel(s).`}
                        </p>
                        <div className="mt-2.5 flex flex-wrap gap-2">
                          {[100, 85, 75, 65, 55, 50].map((share) => {
                            const isSelected =
                              feeBreakdown.effectivePrimaryShare === share;
                            return (
                              <button
                                key={share}
                                type="button"
                                disabled={isVaultReadonly}
                                onClick={() => {
                                  // If user clicks a split < 100 but had 0 secondary channels selected,
                                  // auto-enable the track's default secondary channel so the split works immediately!
                                  const nextSec =
                                    share < 100 &&
                                    step2Data.secondaryChannels.length === 0
                                      ? activeStep2TrackConfig.defaultSecondaryChannels.filter(
                                          (c) => c !== step2Data.primaryChannel
                                        )
                                      : step2Data.secondaryChannels;

                                  const nextFee = computeAutoBlendedFeePercent(
                                    step1Data.productTrack,
                                    step2Data.primaryChannel,
                                    nextSec,
                                    share
                                  );
                                  setStep2Data((prev) => ({
                                    ...prev,
                                    secondaryChannels: nextSec,
                                    primaryChannelSharePercent: share,
                                    estimatedBlendedFeePercent: nextFee,
                                  }));
                                }}
                                className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                                  isSelected
                                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-2xs'
                                    : 'border-slate-300 bg-slate-50 text-slate-700 hover:border-indigo-300 hover:bg-white'
                                }`}
                              >
                                {share === 100
                                  ? '100% Primary Only'
                                  : `${share}% Primary / ${100 - share}% Secondary`}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Transparent Weighted Fee Breakdown Table */}
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            How Your Blended Channel Fee Is Calculated
                          </span>
                          <span className="text-[11px] font-bold text-indigo-700">
                            Auto-Calculated:{' '}
                            {feeBreakdown.autoBlendedFeePercent}%
                          </span>
                        </div>

                        <div className="space-y-2">
                          {/* Primary Row */}
                          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <Badge className="bg-indigo-600 px-1.5 py-0 text-[9px] text-white">
                                  Primary ({feeBreakdown.effectivePrimaryShare}%
                                  Share)
                                </Badge>
                                <span className="truncate font-semibold text-slate-900">
                                  {feeBreakdown.primaryLabel}
                                </span>
                              </div>
                              <div className="mt-0.5 text-[10px] text-slate-500">
                                Channel Fee: ~{feeBreakdown.primaryFeePercent}% ×{' '}
                                {feeBreakdown.effectivePrimaryShare}% of revenue
                              </div>
                            </div>
                            <div className="text-right font-bold text-slate-900">
                              +{feeBreakdown.primaryWeightedFeePercent}%
                            </div>
                          </div>

                          {/* Secondary Row */}
                          {feeBreakdown.secondaryChannelItems.length > 0 &&
                          feeBreakdown.effectiveSecondaryShare > 0 ? (
                            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-indigo-200 bg-indigo-50/50 px-3 py-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <Badge
                                    variant="outline"
                                    className="border-indigo-300 bg-white px-1.5 py-0 text-[9px] font-bold text-indigo-800"
                                  >
                                    Secondary (
                                    {feeBreakdown.effectiveSecondaryShare}%
                                    Share)
                                  </Badge>
                                  <span className="truncate font-semibold text-slate-900">
                                    {feeBreakdown.secondaryChannelItems
                                      .map(
                                        (s) =>
                                          `${s.label.split(' (')[0]} (~${s.feePercent}%)`
                                      )
                                      .join(' + ')}
                                  </span>
                                </div>
                                <div className="mt-0.5 text-[10px] text-slate-600">
                                  Avg Secondary Fee: ~
                                  {feeBreakdown.avgSecondaryFeePercent}% ×{' '}
                                  {feeBreakdown.effectiveSecondaryShare}% of
                                  revenue
                                </div>
                              </div>
                              <div className="text-right font-bold text-indigo-900">
                                +{feeBreakdown.secondaryWeightedFeePercent}%
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-lg border border-dashed border-slate-200 bg-white/70 px-3 py-2 text-[11px] text-slate-500">
                              Secondary Channels (0% Share): Select secondary
                              channels in Tile 2 and choose a split (e.g. 75% /
                              25%) to include secondary marketplace fees.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Manual Override / Synced Input */}
                      <div className="pt-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          Blended Platform &amp; Payment Processing Fee %
                          (Synced to Module G Pricing):
                        </label>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <input
                            type="number"
                            step="0.1"
                            min={0}
                            max={75}
                            disabled={isVaultReadonly}
                            value={step2Data.estimatedBlendedFeePercent}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setStep2Data((prev) => ({
                                ...prev,
                                estimatedBlendedFeePercent: Number.isNaN(val)
                                  ? 0
                                  : Math.min(Math.max(val, 0), 75),
                              }));
                            }}
                            className="w-28 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-base font-bold text-slate-900 focus:border-indigo-500 focus:outline-hidden sm:text-xs"
                          />
                          <span className="text-xs font-semibold text-slate-600">
                            % of gross sales goes to combined platform &amp;
                            card fees
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Live Pocket Revenue Preview Card */}
                    <div className="flex flex-col justify-between rounded-xl border border-emerald-200 bg-white p-4 shadow-2xs lg:col-span-5">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                            Live Pocket Revenue Preview
                          </span>
                          <Badge className="bg-emerald-600 text-[10px] text-white">
                            Auto-Synced to Module G
                          </Badge>
                        </div>
                        <p className="mt-1.5 text-xs text-slate-600">
                          On every{' '}
                          <strong className="text-slate-900">
                            {formatCurrencyExactCents(100, plan.baseCurrency)}
                          </strong>{' '}
                          customer order across your{' '}
                          <strong>
                            {feeBreakdown.effectivePrimaryShare}% Primary /{' '}
                            {feeBreakdown.effectiveSecondaryShare}% Secondary
                          </strong>{' '}
                          channel mix:
                        </p>

                        <div className="mt-3 grid grid-cols-2 gap-2.5">
                          <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-center">
                            <div className="text-[10px] font-bold uppercase text-rose-700">
                              Blended Platform &amp; Card Fees
                            </div>
                            <div className="mt-1 text-lg font-extrabold text-rose-900">
                              -
                              {formatCurrencyExactCents(
                                activeBlendedFee,
                                plan.baseCurrency
                              )}
                            </div>
                            <div className="mt-0.5 text-[10px] font-medium text-rose-700">
                              ({activeBlendedFee}% blended cut)
                            </div>
                          </div>
                          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-center">
                            <div className="text-[10px] font-bold uppercase text-emerald-700">
                              Net Revenue You Keep
                            </div>
                            <div className="mt-1 text-lg font-extrabold text-emerald-900">
                              {formatCurrencyExactCents(
                                netKeptPer100,
                                plan.baseCurrency
                              )}
                            </div>
                            <div className="mt-0.5 text-[10px] font-medium text-emerald-700">
                              ({netKeptPer100}% before COGS)
                            </div>
                          </div>
                        </div>

                        {/* Breakdown of Primary vs Secondary Fee Impact per 100 */}
                        <div className="mt-3 space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-[11px]">
                          <div className="flex items-center justify-between text-slate-700">
                            <span>
                              • Primary Channel Fee (
                              {feeBreakdown.effectivePrimaryShare}% share):
                            </span>
                            <span className="font-semibold text-rose-800">
                              -
                              {formatCurrencyExactCents(
                                feeBreakdown.primaryWeightedFeePercent,
                                plan.baseCurrency
                              )}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-slate-700">
                            <span>
                              • Secondary Channel Fee (
                              {feeBreakdown.effectiveSecondaryShare}% share):
                            </span>
                            <span className="font-semibold text-rose-800">
                              -
                              {formatCurrencyExactCents(
                                feeBreakdown.secondaryWeightedFeePercent,
                                plan.baseCurrency
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="mt-3 text-[10px] leading-relaxed text-slate-500">
                        *Net revenue before direct product, timber/materials, or
                        cloud hosting costs (which are deducted in Module G:
                        Pocket Profit Unit Economics).
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* QUESTION 4: ADAPTIVE DELIVERY, ONBOARDING & FULFILLMENT MODEL */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900">
                {activeStep2TrackConfig.deliveryQuestionTitle.replace(
                  /^3\./,
                  '4.'
                )}
              </CardTitle>
              <CardDescription className="text-xs text-slate-600">
                {activeStep2TrackConfig.deliveryQuestionSubtitle}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {activeStep2TrackConfig.deliveryOptions.map((opt) => {
                  const isSelected =
                    step2Data.deliveryFulfillmentModel === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={isVaultReadonly}
                      onClick={() =>
                        setStep2Data((prev) => ({
                          ...prev,
                          deliveryFulfillmentModel: opt.value,
                        }))
                      }
                      className={`flex flex-col justify-between rounded-xl border p-3.5 text-left transition ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {opt.label}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              isSelected
                                ? 'border-indigo-300 bg-indigo-100 text-indigo-800'
                                : 'border-slate-200 text-slate-500'
                            }`}
                          >
                            {opt.tag}
                          </Badge>
                        </div>
                        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
                          {opt.subtitle}
                        </p>
                      </div>
                      <div className="mt-2.5 flex items-center justify-end">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                            isSelected ? 'text-indigo-700' : 'text-slate-400'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-indigo-600" />
                              Selected Delivery Model
                            </>
                          ) : (
                            'Select'
                          )}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {step2Data.deliveryFulfillmentModel === 'OTHER' && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-3.5">
                  <label className="block text-xs font-semibold text-slate-800">
                    Specify your custom Delivery / Fulfillment Model:
                  </label>
                  <input
                    type="text"
                    disabled={isVaultReadonly}
                    value={step2Data.otherDeliveryFulfillmentText || ''}
                    onChange={(e) =>
                      setStep2Data((prev) => ({
                        ...prev,
                        otherDeliveryFulfillmentText: e.target.value,
                      }))
                    }
                    placeholder="Describe how orders or accounts are fulfilled and delivered..."
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-hidden sm:text-xs"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* QUESTION 5: RENT-TO-OWN BRIDGE STRATEGY + WHY CHANNEL MIX FITS */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    5. Your &ldquo;Rent-to-Own&rdquo; Customer Bridge &amp;
                    Channel Strategy
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-600">
                    How do you ensure you own the long-term customer
                    relationship (even when using Amazon, Etsy, AppSumo, or
                    partners)?
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={isVaultReadonly || isGeneratingStep2Ai}
                  onClick={handleAiGenerateStep2}
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 text-xs text-white hover:from-indigo-700 hover:to-violet-700"
                >
                  {isGeneratingStep2Ai ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Drafting Channel Strategy...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-1.5 h-3.5 w-3.5" />
                      Draft Channel &amp; Bridge Strategy with AI
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  {activeStep2TrackConfig.bridgePromptLabel}
                </label>
                <p className="text-[11px] text-slate-500">
                  Never let a third-party marketplace keep 100% of your customer
                  relationship. Explain the exact mechanism (QR box insert, free
                  diagnostic tool, warranty registration, or direct web portal)
                  that captures your buyer&apos;s email.
                </p>
                <textarea
                  rows={3}
                  disabled={isVaultReadonly}
                  value={step2Data.rentToOwnBridgeStrategy}
                  onChange={(e) =>
                    setStep2Data((prev) => ({
                      ...prev,
                      rentToOwnBridgeStrategy: e.target.value,
                    }))
                  }
                  placeholder={activeStep2TrackConfig.bridgePromptPlaceholder}
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-base text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-hidden sm:text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  {activeStep2TrackConfig.whyChannelFitsLabel}
                </label>
                <p className="text-[11px] text-slate-500">
                  Summarize why this channel and fulfillment mix is the smartest
                  way to get your first 50–100 paying customers while protecting
                  gross margins.
                </p>
                <textarea
                  rows={3}
                  disabled={isVaultReadonly}
                  value={step2Data.channelWhyItFitsNotes}
                  onChange={(e) =>
                    setStep2Data((prev) => ({
                      ...prev,
                      channelWhyItFitsNotes: e.target.value,
                    }))
                  }
                  placeholder={activeStep2TrackConfig.whyChannelFitsPlaceholder}
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-base text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-hidden sm:text-xs"
                />
              </div>

              {/* STEP 2 ACTION FOOTER */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('STEP_1')}
                    className="border-slate-300 bg-white text-xs text-slate-700"
                  >
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                    Back to Step 1
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowParkInput((prev) => !prev)}
                    className="border-amber-300 bg-amber-50/70 text-xs text-amber-900 hover:bg-amber-100"
                  >
                    <BookmarkPlus className="mr-1.5 h-3.5 w-3.5 text-amber-700" />
                    Park a Channel / Fee Question
                  </Button>
                  {step2Data.lastSavedAt && (
                    <span className="text-[11px] text-slate-500">
                      Last saved:{' '}
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
                    variant="outline"
                    size="sm"
                    disabled={isVaultReadonly || isSavingStep2}
                    onClick={() => handleSaveStep2(false)}
                    className="border-indigo-300 bg-white text-xs text-indigo-700 hover:bg-indigo-50"
                  >
                    {isSavingStep2 ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Saving Step 2...
                      </>
                    ) : (
                      <>
                        <Save className="mr-1.5 h-3.5 w-3.5" />
                        Save Step 2 ({step2Data.estimatedBlendedFeePercent}% Fee)
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={isVaultReadonly || isSavingStep2}
                    onClick={() => handleSaveStep2(true)}
                    className="bg-indigo-600 text-xs text-white hover:bg-indigo-700"
                  >
                    Save Step 2 &amp; Continue to Step 3
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
                    placeholder="e.g., Check exact Amazon FBA size/weight tier for our boxed chopping board before locking RRP..."
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
                        'Parked channel question in your Open Questions Parking Lot!'
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

          {/* LIVE STEP 2 OUTPUT PREVIEW CARD */}
          <Card className="border-indigo-200 bg-gradient-to-br from-white to-indigo-50/40 shadow-xs">
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-sm font-bold text-slate-900">
                  📋 Live Step 2 Output Preview (Own vs. Rent Channel &amp;
                  Fulfillment Matrix)
                </CardTitle>
                <Badge
                  variant="outline"
                  className="border-emerald-300 bg-emerald-50 text-[10px] text-emerald-800"
                >
                  Auto-Feeds {step2Data.estimatedBlendedFeePercent}% Fee to
                  Module G
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-700">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[10px] font-bold uppercase text-slate-400">
                    Primary Channel ({step2Data.primaryChannelSharePercent}%)
                  </div>
                  <div className="mt-1 font-bold text-slate-900">
                    {step2Data.primaryChannel === 'OTHER' &&
                    step2Data.otherPrimaryChannelText
                      ? step2Data.otherPrimaryChannelText
                      : activeStep2TrackConfig.channelOptions.find(
                          (o) => o.value === step2Data.primaryChannel
                        )?.label || step2Data.primaryChannel}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[10px] font-bold uppercase text-slate-400">
                    Blended Platform &amp; Card Fee
                  </div>
                  <div className="mt-1 font-bold text-indigo-700">
                    {step2Data.estimatedBlendedFeePercent}% Average Fee (You
                    keep{' '}
                    {Number(
                      (100 - step2Data.estimatedBlendedFeePercent).toFixed(1)
                    )}
                    % Net Revenue)
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[10px] font-bold uppercase text-slate-400">
                    V1 Fulfillment &amp; Onboarding
                  </div>
                  <div className="mt-1 font-bold text-slate-900">
                    {step2Data.deliveryFulfillmentModel === 'OTHER' &&
                    step2Data.otherDeliveryFulfillmentText
                      ? step2Data.otherDeliveryFulfillmentText
                      : activeStep2TrackConfig.deliveryOptions.find(
                          (o) => o.value === step2Data.deliveryFulfillmentModel
                        )?.label || step2Data.deliveryFulfillmentModel}
                  </div>
                </div>
              </div>

              {(step2Data.rentToOwnBridgeStrategy ||
                step2Data.channelWhyItFitsNotes) && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="text-[10px] font-bold uppercase text-indigo-600">
                      &ldquo;Rent-to-Own&rdquo; Customer Bridge
                    </div>
                    <p className="mt-1 leading-relaxed text-slate-700">
                      {step2Data.rentToOwnBridgeStrategy ||
                        'Not drafted yet — click "Draft Channel & Bridge Strategy with AI" above.'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="text-[10px] font-bold uppercase text-emerald-700">
                      Why This Channel Mix Wins
                    </div>
                    <p className="mt-1 leading-relaxed text-slate-700">
                      {step2Data.channelWhyItFitsNotes ||
                        'Not drafted yet — explain how this mix balances early buyer discovery with healthy margins.'}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : activeTab === 'STEP_3' ? (
        <div className="space-y-6">
          {/* =============================================================== */}
          {/* STEP 3 WHY ARE WE ASKING THIS? + 3-SCENARIO PRESET SWITCHER     */}
          {/* =============================================================== */}
          <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50/90 via-white to-emerald-50/60 shadow-xs">
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-indigo-600 text-white">
                    Step 3 • Adaptive Track: {selectedTrackMeta.badgeText}
                  </Badge>
                  <span className="text-xs font-semibold text-slate-800">
                    Ruthless V1 Scope Filter (Day-1 Core vs. V1.5 Fast-Follow vs.
                    V2 Icebox)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowWhyCard((prev) => !prev)}
                    className="h-7 border-indigo-200 bg-white px-2.5 text-[11px] text-indigo-700"
                  >
                    <HelpCircle className="mr-1 h-3.5 w-3.5" />
                    {showWhyCard ? 'Hide Coaching' : 'Why Are We Asking This?'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowExamples((prev) => !prev)}
                    className="h-7 border-emerald-300 bg-emerald-50/80 px-2.5 text-[11px] text-emerald-800"
                  >
                    <Lightbulb className="mr-1 h-3.5 w-3.5" />
                    {showExamples ? 'Hide 3 Examples' : 'Test All 3 Scenarios'}
                  </Button>
                </div>
              </div>

              {showWhyCard && (
                <div className="mt-3 grid grid-cols-1 gap-3 rounded-xl border border-indigo-100 bg-white/95 p-3.5 text-xs text-slate-700 sm:grid-cols-3">
                  <div>
                    <div className="font-bold text-indigo-950">
                      🎯 Why Ruthless V1 Scope Matters
                    </div>
                    <p className="mt-1 leading-relaxed text-slate-600">
                      Founders rarely fail because their Version 1 was too small;
                      they fail because they tried to build or stock{' '}
                      <strong>Year 2 features on Day 1</strong> and ran out of
                      time and cash before speaking to paying customers.
                    </p>
                  </div>
                  <div>
                    <div className="font-bold text-indigo-950">
                      🧭 Adaptive to Your Track ({selectedTrackMeta.badgeText})
                    </div>
                    <p className="mt-1 leading-relaxed text-slate-600">
                      {step1Data.productTrack === 'PHYSICAL_PRODUCT_ECOM'
                        ? 'Because you selected Physical Product / Maker, Step 3 filters Hero SKUs, repeatable workshop jigs, and <2kg courier boxes—and blocks custom one-off dimensions that destroy batch margins.'
                        : step1Data.productTrack === 'EDUCATION_PROGRAM_COHORT'
                          ? 'Because you selected Education / Parent Support, Step 3 locks V1 to bite-sized 5-minute audio/video guides and printable routines—and parks €25,000 custom mobile apps in the V2 Icebox.'
                          : 'Because you selected Software / SaaS, Step 3 locks V1 to your 60-second browser Aha! workflow and Stripe checkout—and parks native mobile apps and enterprise SSO in the V2 Icebox.'}
                    </p>
                  </div>
                  <div>
                    <div className="font-bold text-indigo-950">
                      🔗 Feeds Work Packages (Step 5) &amp; Grants (Mod K)
                    </div>
                    <p className="mt-1 leading-relaxed text-slate-600">
                      Only items in your{' '}
                      <strong className="text-emerald-700">
                        MUST-HAVE FOR V1
                      </strong>{' '}
                      bucket become your Day-1 Work Packages in Step 5, while
                      V1.5 and V2 items demonstrate a credible 24-month roadmap
                      to Irish LEO, Enterprise Ireland, and Innovate UK
                      assessors.
                    </p>
                  </div>
                </div>
              )}

              {showExamples && (
                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-emerald-950">
                      🧪 1-Click Interactive Tester: Load Any of Our 3 Scenarios
                      Into Step 3
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleLoadScenarioPreset('BMU_SAAS')}
                        className="h-7 border-indigo-300 bg-white text-[11px] font-semibold text-indigo-800 hover:bg-indigo-50"
                      >
                        1. Load SaaS (Build My Unicorn)
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleLoadScenarioPreset('WOODWORKER_AMAZON_ETSY')
                        }
                        className="h-7 border-amber-300 bg-white text-[11px] font-semibold text-amber-900 hover:bg-amber-50"
                      >
                        2. Load Woodworker (Amazon &amp; Etsy)
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleLoadScenarioPreset('AUTISM_SLEEP_EDUCATION')
                        }
                        className="h-7 border-emerald-400 bg-white text-[11px] font-semibold text-emerald-900 hover:bg-emerald-50"
                      >
                        3. Load Autism Sleep Platform
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* =============================================================== */}
          {/* TILE 1: LIVE V1 SCOPE CREEP METER & 3-BUCKET SCOPE BOARD        */}
          {/* =============================================================== */}
          {(() => {
            const v1Items = step3Data.items.filter(
              (i) => i.bucket === 'MUST_HAVE_V1'
            );
            const v15Items = step3Data.items.filter(
              (i) => i.bucket === 'FAST_FOLLOW_V1_5'
            );
            const v2Items = step3Data.items.filter(
              (i) => i.bucket === 'PARKING_LOT_V2'
            );
            const highEffortV1Count = v1Items.filter(
              (i) => i.effortImpact === 'HIGH'
            ).length;
            const maxRec = activeStep3TrackConfig.maxRecommendedV1Items;
            const isScopeCreepWarning =
              v1Items.length > maxRec || highEffortV1Count >= 2;

            return (
              <Card className="border-slate-200 shadow-xs">
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900">
                        {activeStep3TrackConfig.boardTitle}
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-600">
                        {activeStep3TrackConfig.boardSubtitle}
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          isScopeCreepWarning
                            ? 'border-amber-300 bg-amber-50 text-xs font-bold text-amber-900'
                            : 'border-emerald-300 bg-emerald-50 text-xs font-bold text-emerald-800'
                        }
                      >
                        {isScopeCreepWarning ? (
                          <>
                            <AlertTriangle className="mr-1 h-3.5 w-3.5 text-amber-600" />
                            Scope Creep Alert: {v1Items.length} in V1 (Target ≤
                            {maxRec})
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-emerald-600" />
                            Lean V1 Scope Healthy ({v1Items.length}/{maxRec} Day-1
                            Core Items)
                          </>
                        )}
                      </Badge>

                      {(step3Data.items.length > 0 ||
                        Boolean(step3Data.scopeDisciplineRule) ||
                        Boolean(
                          step3Data.whatWeRefuseToBuildInV1Narrative.trim()
                        ) ||
                        Boolean(
                          step3Data.whyThisLeanV1WinsFasterNarrative.trim()
                        )) && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isVaultReadonly}
                          onClick={() =>
                            setShowClearScopeBoardConfirm((prev) => !prev)
                          }
                          className="h-7 border-rose-200 bg-rose-50/70 px-2.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 hover:text-rose-800"
                        >
                          <Trash2 className="mr-1 h-3.5 w-3.5" />
                          Clear Board &amp; Rule ({step3Data.items.length})
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Confirmation Dialog Banner before clearing all items & discipline rule */}
                  {showClearScopeBoardConfirm &&
                    (step3Data.items.length > 0 ||
                      Boolean(step3Data.scopeDisciplineRule) ||
                      Boolean(
                        step3Data.whatWeRefuseToBuildInV1Narrative.trim()
                      ) ||
                      Boolean(
                        step3Data.whyThisLeanV1WinsFasterNarrative.trim()
                      )) && (
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-300 bg-rose-50/95 p-3.5 text-xs text-rose-950 shadow-2xs">
                        <div className="flex items-start gap-2.5">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                          <div>
                            <div className="font-bold text-rose-950">
                              Confirm Clear Step 3: Remove all{' '}
                              {step3Data.items.length} scope items &amp; clear
                              your V1 Scope Discipline Rule?
                            </div>
                            <p className="mt-0.5 text-[11px] text-rose-800">
                              This will empty all 3 columns (Day-1 Core, V1.5
                              Fast-Follow, and V2 Icebox) and reset Section 2
                              (Your Non-Negotiable Version 1 Scope Discipline
                              Rule &amp; narratives) so you can start fresh.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowClearScopeBoardConfirm(false)}
                            className="h-7 border-slate-300 bg-white px-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Cancel — Keep Everything
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            disabled={isVaultReadonly}
                            onClick={handleConfirmClearAllScopeItems}
                            className="h-7 bg-rose-600 px-3 text-[11px] font-bold text-white hover:bg-rose-700"
                          >
                            <Trash2 className="mr-1 h-3 w-3" />
                            Yes, Remove Everything
                          </Button>
                        </div>
                      </div>
                    )}
                </CardHeader>

                <CardContent className="space-y-5">
                  {/* Live Scope Creep Guardrail Banner */}
                  <div
                    className={`rounded-xl border p-3.5 ${
                      isScopeCreepWarning
                        ? 'border-amber-300 bg-amber-50/80 text-amber-950'
                        : 'border-emerald-200 bg-emerald-50/60 text-emerald-950'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold">
                        {isScopeCreepWarning ? (
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                        ) : (
                          <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        )}
                        <span>
                          {isScopeCreepWarning
                            ? `Heads-Up Co-Founder Check: You currently have ${v1Items.length} items (${highEffortV1Count} High-Effort) in Day-1 V1 Core.`
                            : `Ruthless V1 Balance: ${v1Items.length} Day-1 Core • ${v15Items.length} V1.5 Fast-Follow • ${v2Items.length} V2 Icebox (Refused in V1)`}
                        </span>
                      </div>
                      <span className="text-[11px] font-medium">
                        {isScopeCreepWarning
                          ? 'Consider clicking "Defer → V1.5" or "Icebox → V2" on 1–2 items below so you launch on time.'
                          : 'Your Day-1 scope is tightly focused on your core customer Aha! Moment.'}
                      </span>
                    </div>
                  </div>

                  {/* 3-Column Interactive Scope Board */}
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {/* COLUMN 1: MUST_HAVE_V1 */}
                    <div className="flex flex-col rounded-xl border-2 border-emerald-200 bg-emerald-50/30 p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <Rocket className="h-4 w-4 text-emerald-700" />
                          <span className="text-xs font-bold text-emerald-950">
                            {activeStep3TrackConfig.v1BucketLabel}
                          </span>
                        </div>
                        <Badge className="bg-emerald-600 text-[10px] text-white">
                          {v1Items.length} Items
                        </Badge>
                      </div>
                      <p className="mt-1 text-[11px] text-emerald-900/80">
                        {activeStep3TrackConfig.v1BucketSubtitle}
                      </p>

                      <div className="mt-3 flex-1 space-y-2.5">
                        {v1Items.length === 0 ? (
                          <div className="rounded-lg border border-dashed border-emerald-300 bg-white/80 p-4 text-center text-xs text-slate-500">
                            No Day-1 V1 items yet. Move an item here or add one
                            below.
                          </div>
                        ) : (
                          v1Items.map((item) => (
                            <div
                              key={item.id}
                              className="rounded-lg border border-emerald-200 bg-white p-3 shadow-2xs"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-xs font-bold text-slate-900">
                                  {item.title}
                                </span>
                                <button
                                  type="button"
                                  disabled={isVaultReadonly}
                                  onClick={() => handleRemoveScopeItem(item.id)}
                                  title="Remove item"
                                  className="text-slate-400 hover:text-rose-600"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                <Badge
                                  variant="outline"
                                  className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-800"
                                >
                                  {item.categoryTag}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={
                                    item.effortImpact === 'HIGH'
                                      ? 'border-rose-200 bg-rose-50 text-[10px] text-rose-700'
                                      : item.effortImpact === 'MEDIUM'
                                        ? 'border-amber-200 bg-amber-50 text-[10px] text-amber-800'
                                        : 'border-slate-200 bg-slate-50 text-[10px] text-slate-600'
                                  }
                                >
                                  Effort: {item.effortImpact}
                                </Badge>
                              </div>
                              {item.rationaleOrNote && (
                                <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
                                  {item.rationaleOrNote}
                                </p>
                              )}
                              <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-slate-100 pt-2">
                                <button
                                  type="button"
                                  disabled={isVaultReadonly}
                                  onClick={() =>
                                    handleMoveScopeItemBucket(
                                      item.id,
                                      'FAST_FOLLOW_V1_5'
                                    )
                                  }
                                  className="rounded-md border border-indigo-200 bg-indigo-50/70 px-2 py-1 text-[10px] font-semibold text-indigo-700 hover:bg-indigo-100"
                                >
                                  Defer → V1.5 Fast-Follow
                                </button>
                                <button
                                  type="button"
                                  disabled={isVaultReadonly}
                                  onClick={() =>
                                    handleMoveScopeItemBucket(
                                      item.id,
                                      'PARKING_LOT_V2'
                                    )
                                  }
                                  className="rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-200"
                                >
                                  Icebox → V2
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* COLUMN 2: FAST_FOLLOW_V1_5 */}
                    <div className="flex flex-col rounded-xl border-2 border-indigo-200 bg-indigo-50/30 p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-indigo-700" />
                          <span className="text-xs font-bold text-indigo-950">
                            {activeStep3TrackConfig.v15BucketLabel}
                          </span>
                        </div>
                        <Badge className="bg-indigo-600 text-[10px] text-white">
                          {v15Items.length} Items
                        </Badge>
                      </div>
                      <p className="mt-1 text-[11px] text-indigo-900/80">
                        {activeStep3TrackConfig.v15BucketSubtitle}
                      </p>

                      <div className="mt-3 flex-1 space-y-2.5">
                        {v15Items.length === 0 ? (
                          <div className="rounded-lg border border-dashed border-indigo-300 bg-white/80 p-4 text-center text-xs text-slate-500">
                            No V1.5 Fast-Follow items yet. Defer nice-to-have V1
                            items here!
                          </div>
                        ) : (
                          v15Items.map((item) => (
                            <div
                              key={item.id}
                              className="rounded-lg border border-indigo-200 bg-white p-3 shadow-2xs"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-xs font-bold text-slate-900">
                                  {item.title}
                                </span>
                                <button
                                  type="button"
                                  disabled={isVaultReadonly}
                                  onClick={() => handleRemoveScopeItem(item.id)}
                                  title="Remove item"
                                  className="text-slate-400 hover:text-rose-600"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                <Badge
                                  variant="outline"
                                  className="border-indigo-200 bg-indigo-50 text-[10px] text-indigo-800"
                                >
                                  {item.categoryTag}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="border-slate-200 bg-slate-50 text-[10px] text-slate-600"
                                >
                                  Effort: {item.effortImpact}
                                </Badge>
                              </div>
                              {item.rationaleOrNote && (
                                <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
                                  {item.rationaleOrNote}
                                </p>
                              )}
                              <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-slate-100 pt-2">
                                <button
                                  type="button"
                                  disabled={isVaultReadonly}
                                  onClick={() =>
                                    handleMoveScopeItemBucket(
                                      item.id,
                                      'MUST_HAVE_V1'
                                    )
                                  }
                                  className="rounded-md border border-emerald-200 bg-emerald-50/80 px-2 py-1 text-[10px] font-semibold text-emerald-800 hover:bg-emerald-100"
                                >
                                  ← Promote to V1 Core
                                </button>
                                <button
                                  type="button"
                                  disabled={isVaultReadonly}
                                  onClick={() =>
                                    handleMoveScopeItemBucket(
                                      item.id,
                                      'PARKING_LOT_V2'
                                    )
                                  }
                                  className="rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-200"
                                >
                                  Icebox → V2
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* COLUMN 3: PARKING_LOT_V2 (REFUSED IN V1) */}
                    <div className="flex flex-col rounded-xl border-2 border-rose-200 bg-rose-50/25 p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <Ban className="h-4 w-4 text-rose-600" />
                          <span className="text-xs font-bold text-rose-950">
                            {activeStep3TrackConfig.v2BucketLabel}
                          </span>
                        </div>
                        <Badge className="bg-rose-600 text-[10px] text-white">
                          {v2Items.length} Refused
                        </Badge>
                      </div>
                      <p className="mt-1 text-[11px] text-rose-900/80">
                        {activeStep3TrackConfig.v2BucketSubtitle}
                      </p>

                      <div className="mt-3 flex-1 space-y-2.5">
                        {v2Items.length === 0 ? (
                          <div className="rounded-lg border border-dashed border-rose-300 bg-white/80 p-4 text-center text-xs text-slate-500">
                            List at least 1–2 temptations you explicitly refuse
                            to build/stock in V1.
                          </div>
                        ) : (
                          v2Items.map((item) => (
                            <div
                              key={item.id}
                              className="rounded-lg border border-rose-200 bg-white p-3 shadow-2xs"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-xs font-bold text-slate-900 line-through decoration-rose-400">
                                  {item.title}
                                </span>
                                <button
                                  type="button"
                                  disabled={isVaultReadonly}
                                  onClick={() => handleRemoveScopeItem(item.id)}
                                  title="Remove item"
                                  className="text-slate-400 hover:text-rose-600"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                <Badge
                                  variant="outline"
                                  className="border-rose-200 bg-rose-50 text-[10px] text-rose-800"
                                >
                                  {item.categoryTag}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="border-slate-200 bg-slate-50 text-[10px] text-slate-600"
                                >
                                  Effort: {item.effortImpact}
                                </Badge>
                              </div>
                              {item.rationaleOrNote && (
                                <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
                                  {item.rationaleOrNote}
                                </p>
                              )}
                              <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-slate-100 pt-2">
                                <button
                                  type="button"
                                  disabled={isVaultReadonly}
                                  onClick={() =>
                                    handleMoveScopeItemBucket(
                                      item.id,
                                      'FAST_FOLLOW_V1_5'
                                    )
                                  }
                                  className="rounded-md border border-indigo-200 bg-indigo-50/70 px-2 py-1 text-[10px] font-semibold text-indigo-700 hover:bg-indigo-100"
                                >
                                  ← Move to V1.5
                                </button>
                                <button
                                  type="button"
                                  disabled={isVaultReadonly}
                                  onClick={() =>
                                    handleMoveScopeItemBucket(
                                      item.id,
                                      'MUST_HAVE_V1'
                                    )
                                  }
                                  className="rounded-md border border-emerald-200 bg-emerald-50/80 px-2 py-1 text-[10px] font-semibold text-emerald-800 hover:bg-emerald-100"
                                >
                                  ← Move to V1 Core
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick-Add Suggestions + Custom Scope Item Creator */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs font-bold text-slate-900">
                        ➕ Add a Custom {activeStep3TrackConfig.itemNounSingular}{' '}
                        or Click a Track Suggestion
                      </div>
                      {activeStep3TrackConfig.quickAddChips.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {activeStep3TrackConfig.quickAddChips.map((chip) => (
                            <button
                              key={chip.title}
                              type="button"
                              disabled={isVaultReadonly}
                              onClick={() => handleQuickAddChip(chip)}
                              className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-white px-2.5 py-1 text-[11px] font-medium text-indigo-700 hover:bg-indigo-50"
                            >
                              <Plus className="h-3 w-3" />
                              {chip.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-12">
                      <div className="sm:col-span-4">
                        <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
                          {activeStep3TrackConfig.itemNounSingular} Name
                        </label>
                        <input
                          type="text"
                          disabled={isVaultReadonly}
                          value={newScopeItemTitle}
                          onChange={(e) => setNewScopeItemTitle(e.target.value)}
                          placeholder={`e.g., Add ${activeStep3TrackConfig.itemNounSingular.toLowerCase()}...`}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-indigo-500 focus:outline-hidden sm:text-xs"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
                          Target Scope Bucket
                        </label>
                        <select
                          disabled={isVaultReadonly}
                          value={newScopeItemBucket}
                          onChange={(e) =>
                            setNewScopeItemBucket(
                              e.target.value as ScopeBucketType
                            )
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-base text-slate-900 focus:border-indigo-500 focus:outline-hidden sm:text-xs"
                        >
                          <option value="MUST_HAVE_V1">
                            MUST-HAVE FOR V1 (Day-1 Core)
                          </option>
                          <option value="FAST_FOLLOW_V1_5">
                            FAST-FOLLOW V1.5 (Months 3–6)
                          </option>
                          <option value="PARKING_LOT_V2">
                            V2 ICEBOX (Refused in V1)
                          </option>
                        </select>
                      </div>

                      <div className="sm:col-span-3">
                        <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
                          Category Tag
                        </label>
                        <select
                          disabled={isVaultReadonly}
                          value={
                            newScopeItemCategory ||
                            activeStep3TrackConfig.categoryTagOptions[0]
                          }
                          onChange={(e) =>
                            setNewScopeItemCategory(e.target.value)
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-base text-slate-900 focus:border-indigo-500 focus:outline-hidden sm:text-xs"
                        >
                          {activeStep3TrackConfig.categoryTagOptions.map(
                            (tag) => (
                              <option key={tag} value={tag}>
                                {tag === 'OTHER'
                                  ? 'Other Custom Category...'
                                  : tag}
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
                          Effort / Complexity
                        </label>
                        <select
                          disabled={isVaultReadonly}
                          value={newScopeItemEffort}
                          onChange={(e) =>
                            setNewScopeItemEffort(
                              e.target.value as ScopeItemEffortType
                            )
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-base text-slate-900 focus:border-indigo-500 focus:outline-hidden sm:text-xs"
                        >
                          <option value="LOW">LOW Effort</option>
                          <option value="MEDIUM">MEDIUM Effort</option>
                          <option value="HIGH">HIGH Effort</option>
                        </select>
                      </div>
                    </div>

                    {newScopeItemCategory === 'OTHER' && (
                      <div className="mt-2.5">
                        <label className="mb-1 block text-[10px] font-bold uppercase text-indigo-700">
                          Custom Category Tag Label (Required when &ldquo;Other&rdquo; is selected):
                        </label>
                        <input
                          type="text"
                          disabled={isVaultReadonly}
                          value={newScopeItemOtherCategory}
                          onChange={(e) =>
                            setNewScopeItemOtherCategory(e.target.value)
                          }
                          placeholder="e.g., Custom Hardware Jig / Regulatory Packaging / Clinical SOP..."
                          className="w-full rounded-lg border border-indigo-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-indigo-500 focus:outline-hidden sm:text-xs"
                        />
                      </div>
                    )}

                    <div className="mt-2.5 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <input
                        type="text"
                        disabled={isVaultReadonly}
                        value={newScopeItemNote}
                        onChange={(e) => setNewScopeItemNote(e.target.value)}
                        placeholder="Optional 1-line rationale (why this belongs in V1, V1.5, or V2 Icebox)..."
                        className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-indigo-500 focus:outline-hidden sm:text-xs"
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={
                          isVaultReadonly || !newScopeItemTitle.trim()
                        }
                        onClick={handleAddCustomScopeItem}
                        className="w-full bg-indigo-600 text-xs text-white hover:bg-indigo-700 sm:w-auto"
                      >
                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                        Add to Scope Board
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* =============================================================== */}
          {/* TILE 2: NON-NEGOTIABLE V1 SCOPE DISCIPLINE RULE (+ OTHER)       */}
          {/* =============================================================== */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    2. Your Non-Negotiable Version 1 Scope Discipline Rule
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-600">
                    Automatically updates from what you place in{' '}
                    <strong className="text-emerald-700">
                      MUST-HAVE FOR V1
                    </strong>{' '}
                    above, plus your chosen V1 guardrail rule.
                  </CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className="border-emerald-300 bg-emerald-50 text-[10px] font-bold text-emerald-800"
                >
                  Live-Synced with MUST-HAVE FOR V1 (
                  {
                    step3Data.items.filter((i) => i.bucket === 'MUST_HAVE_V1')
                      .length
                  }{' '}
                  Items)
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Live Auto-Synced Non-Negotiable V1 Requirements Box */}
              {(() => {
                const liveV1MustHaves = step3Data.items.filter(
                  (i) => i.bucket === 'MUST_HAVE_V1'
                );
                const liveDeferredCount = step3Data.items.filter(
                  (i) => i.bucket !== 'MUST_HAVE_V1'
                ).length;

                return (
                  <div className="rounded-xl border-2 border-emerald-200 bg-gradient-to-r from-emerald-50/80 via-white to-indigo-50/50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Rocket className="h-4 w-4 text-emerald-700" />
                        <span className="text-xs font-bold text-emerald-950">
                          Your Non-Negotiable V1 Launch Gate (Auto-Populated
                          from MUST-HAVE FOR V1)
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-800">
                        {liveV1MustHaves.length} Must-Have V1 •{' '}
                        {liveDeferredCount} Deferred/Refused
                      </span>
                    </div>

                    {liveV1MustHaves.length === 0 ? (
                      <p className="mt-2 rounded-lg border border-dashed border-emerald-300 bg-white/80 p-3 text-xs text-slate-500">
                        No non-negotiable V1 items added yet. As soon as you add
                        an item to <strong>MUST-HAVE FOR V1</strong> in the
                        Scope Board above (for example,{' '}
                        <em>
                          &ldquo;All modules up and running before launch&rdquo;
                        </em>
                        ), it will automatically populate here as your
                        non-negotiable launch requirement.
                      </p>
                    ) : (
                      <div className="mt-2.5 space-y-2.5">
                        <p className="text-xs leading-relaxed text-slate-800">
                          <strong>Non-Negotiable Rule Before Launch:</strong> We
                          will not launch Version 1 until the following{' '}
                          <strong>
                            {liveV1MustHaves.length}{' '}
                            {liveV1MustHaves.length === 1
                              ? 'deliverable is'
                              : 'deliverables are'}
                          </strong>{' '}
                          live and ready for customers:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {liveV1MustHaves.map((item, idx) => (
                            <div
                              key={item.id}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-emerald-950 shadow-2xs"
                            >
                              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                                {idx + 1}
                              </span>
                              <span>{item.title}</span>
                              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800">
                                {item.categoryTag}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="text-xs font-bold text-slate-800">
                Select Your Supporting Version 1 Scope Guardrail Principle:
              </div>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {activeStep3TrackConfig.disciplineRuleOptions.map((opt) => {
                  const isSelected =
                    step3Data.scopeDisciplineRule === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={isVaultReadonly}
                      onClick={() => {
                        const nextStep3: ScopeFilterStep3Data = {
                          ...step3Data,
                          scopeDisciplineRule: opt.value,
                        };
                        setStep3Data(nextStep3);
                        persistStep3ScopeFilter(nextStep3);
                      }}
                      className={`flex flex-col items-start rounded-xl border p-3.5 text-left transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-600/20'
                          : 'border-slate-200 bg-white hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex w-full items-center justify-between gap-2">
                        <Badge
                          variant="outline"
                          className={
                            isSelected
                              ? 'border-indigo-300 bg-indigo-100 text-[10px] font-bold text-indigo-900'
                              : 'border-slate-200 bg-slate-50 text-[10px] text-slate-600'
                          }
                        >
                          {opt.tag}
                        </Badge>
                        {isSelected && (
                          <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                        )}
                      </div>
                      <div className="mt-2 text-xs font-bold text-slate-900">
                        {opt.label}
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                        {opt.subtitle}
                      </p>
                    </button>
                  );
                })}
              </div>

              {step3Data.scopeDisciplineRule === 'OTHER' && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3.5">
                  <label className="mb-1.5 block text-xs font-bold text-indigo-950">
                    Describe Your Custom Version 1 Scope Discipline Rule:
                  </label>
                  <input
                    type="text"
                    disabled={isVaultReadonly}
                    value={step3Data.otherScopeDisciplineRuleText || ''}
                    onChange={(e) =>
                      setStep3Data((prev) => ({
                        ...prev,
                        otherScopeDisciplineRuleText: e.target.value,
                      }))
                    }
                    onBlur={() => persistStep3ScopeFilter(step3Data)}
                    placeholder="e.g., Maximum 3 SKUs in Year 1; all custom requests must exceed €1,000 minimum order value..."
                    className="w-full rounded-lg border border-indigo-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-indigo-500 focus:outline-hidden sm:text-xs"
                  />
                </div>
              )}

              {/* Narratives: What We Refuse in V1 + Why Lean V1 Wins Faster */}
              <div className="border-t border-slate-200 pt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Anti-Scope-Creep Charter &amp; Grant Justification
                    </h4>
                    <p className="text-[11px] text-slate-600">
                      Grant assessors and investors love founders who can clearly
                      state what they <strong>refuse</strong> to waste money on
                      in Version 1.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isVaultReadonly || isGeneratingStep3Ai}
                    onClick={handleAiGenerateStep3}
                    className="border-indigo-300 bg-indigo-50/80 text-xs font-semibold text-indigo-800 hover:bg-indigo-100"
                  >
                    {isGeneratingStep3Ai ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Drafting Charter &amp; Justification...
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
                        Draft Charter &amp; Grant Justification with AI
                      </>
                    )}
                  </Button>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-800">
                      {activeStep3TrackConfig.refusePromptLabel}
                    </label>
                    <textarea
                      rows={3}
                      disabled={isVaultReadonly}
                      value={step3Data.whatWeRefuseToBuildInV1Narrative}
                      onChange={(e) =>
                        setStep3Data((prev) => ({
                          ...prev,
                          whatWeRefuseToBuildInV1Narrative: e.target.value,
                        }))
                      }
                      onBlur={() => persistStep3ScopeFilter(step3Data)}
                      placeholder={
                        activeStep3TrackConfig.refusePromptPlaceholder
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 text-base text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-hidden sm:text-xs"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-800">
                      {activeStep3TrackConfig.whyLeanWinsLabel}
                    </label>
                    <textarea
                      rows={3}
                      disabled={isVaultReadonly}
                      value={step3Data.whyThisLeanV1WinsFasterNarrative}
                      onChange={(e) =>
                        setStep3Data((prev) => ({
                          ...prev,
                          whyThisLeanV1WinsFasterNarrative: e.target.value,
                        }))
                      }
                      onBlur={() => persistStep3ScopeFilter(step3Data)}
                      placeholder={
                        activeStep3TrackConfig.whyLeanWinsPlaceholder
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 text-base text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-hidden sm:text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* STEP 3 ACTION FOOTER */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('STEP_2')}
                    className="border-slate-300 bg-white text-xs text-slate-700"
                  >
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                    Back to Step 2
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowParkInput((prev) => !prev)}
                    className="border-amber-300 bg-amber-50/70 text-xs text-amber-900 hover:bg-amber-100"
                  >
                    <BookmarkPlus className="mr-1.5 h-3.5 w-3.5 text-amber-700" />
                    Park a V1 Scope Question
                  </Button>
                  {step3Data.lastSavedAt && (
                    <span className="text-[11px] text-slate-500">
                      Last saved:{' '}
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
                    className="bg-indigo-600 text-xs text-white hover:bg-indigo-700"
                  >
                    {isSavingStep3 ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Saving Step 3...
                      </>
                    ) : (
                      <>
                        <Save className="mr-1.5 h-3.5 w-3.5" />
                        Save Step 3 (Ruthless V1 Scope Filter)
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {showParkInput && (
                <div className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    value={parkQuestionInput}
                    onChange={(e) => setParkQuestionInput(e.target.value)}
                    placeholder="e.g., Confirm whether gift-box laser engraving adds more than 4 minutes per unit before Batch 1..."
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
                        'Parked scope question in your Open Questions Parking Lot!'
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

          {/* LIVE STEP 3 OUTPUT PREVIEW CARD */}
          <Card className="border-indigo-200 bg-gradient-to-br from-white to-indigo-50/40 shadow-xs">
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-sm font-bold text-slate-900">
                  📋 Live Step 3 Output Preview (Ruthless V1 Scope Filter &amp;
                  Roadmap)
                </CardTitle>
                <Badge
                  variant="outline"
                  className="border-emerald-300 bg-emerald-50 text-[10px] text-emerald-800"
                >
                  Feeds Step 5 Work Packages &amp; Module K Grant Roadmap
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-700">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-emerald-200 bg-white p-3">
                  <div className="text-[10px] font-bold uppercase text-emerald-700">
                    Day-1 V1 Core (
                    {
                      step3Data.items.filter((i) => i.bucket === 'MUST_HAVE_V1')
                        .length
                    }{' '}
                    Items)
                  </div>
                  <ul className="mt-1.5 space-y-1 text-[11px] font-medium text-slate-800">
                    {step3Data.items
                      .filter((i) => i.bucket === 'MUST_HAVE_V1')
                      .map((i) => (
                        <li key={i.id}>• {i.title}</li>
                      ))}
                  </ul>
                </div>

                <div className="rounded-lg border border-indigo-200 bg-white p-3">
                  <div className="text-[10px] font-bold uppercase text-indigo-700">
                    V1.5 Fast-Follow (
                    {
                      step3Data.items.filter(
                        (i) => i.bucket === 'FAST_FOLLOW_V1_5'
                      ).length
                    }{' '}
                    Items)
                  </div>
                  <ul className="mt-1.5 space-y-1 text-[11px] text-slate-700">
                    {step3Data.items
                      .filter((i) => i.bucket === 'FAST_FOLLOW_V1_5')
                      .map((i) => (
                        <li key={i.id}>• {i.title}</li>
                      ))}
                  </ul>
                </div>

                <div className="rounded-lg border border-rose-200 bg-white p-3">
                  <div className="text-[10px] font-bold uppercase text-rose-700">
                    Refused in V1 / V2 Icebox (
                    {
                      step3Data.items.filter(
                        (i) => i.bucket === 'PARKING_LOT_V2'
                      ).length
                    }{' '}
                    Items)
                  </div>
                  <ul className="mt-1.5 space-y-1 text-[11px] text-slate-500">
                    {step3Data.items
                      .filter((i) => i.bucket === 'PARKING_LOT_V2')
                      .map((i) => (
                        <li key={i.id} className="line-through">
                          • {i.title}
                        </li>
                      ))}
                  </ul>
                </div>
              </div>

              {(step3Data.whatWeRefuseToBuildInV1Narrative ||
                step3Data.whyThisLeanV1WinsFasterNarrative) && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="text-[10px] font-bold uppercase text-rose-700">
                      What We Explicitly Refuse in Version 1
                    </div>
                    <p className="mt-1 leading-relaxed text-slate-700">
                      {step3Data.whatWeRefuseToBuildInV1Narrative ||
                        'Not drafted yet.'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="text-[10px] font-bold uppercase text-emerald-700">
                      Why This Lean Version 1 Wins Faster
                    </div>
                    <p className="mt-1 leading-relaxed text-slate-700">
                      {step3Data.whyThisLeanV1WinsFasterNarrative ||
                        'Not drafted yet.'}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-6 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
              <Wrench className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-slate-900">
              Step-by-Step Build Mode: {activeTab.replace('_', ' ')} Ready Next
            </h3>
            <p className="mx-auto mt-1 max-w-lg text-xs text-slate-600">
              <strong>Steps 1, 2 &amp; 3</strong> are live! Next up is{' '}
              <strong>
                Step 4 (3-Tier Make/Build vs. Buy &amp; Secret Sauce Matrix)
              </strong>{' '}
              tailored to your active{' '}
              <span className="font-semibold text-indigo-700">
                {selectedTrackMeta.label}
              </span>{' '}
              track.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('STEP_1')}
                className="text-xs"
              >
                Go to Step 1
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('STEP_2')}
                className="text-xs"
              >
                Go to Step 2
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setActiveTab('STEP_3')}
                className="bg-indigo-600 text-xs text-white hover:bg-indigo-700"
              >
                Go to Step 3 (V1 Scope Filter)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
