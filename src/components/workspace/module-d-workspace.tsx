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
  type SupportedCountryCode,
} from '@/lib/localization';
import type {
  ActiveStartupPlan,
  ProductTrackType,
  ProductFormFactorType,
  V1PrototypeApproachType,
  V1LaunchTimelineType,
  ProductVehicleStep1Data,
} from '@/lib/auth/session-store';

export interface ModuleDWorkspaceProps {
  plan: ActiveStartupPlan;
  selectedCountry: SupportedCountryCode;
  isVaultReadonly: boolean;
  onSaveStep1ProductVehicle: (
    data: ProductVehicleStep1Data,
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

export function ModuleDWorkspace({
  plan,
  selectedCountry,
  isVaultReadonly,
  onSaveStep1ProductVehicle,
  onParkOpenQuestion,
  onGenerateAiProductVehicle,
  onBackToModuleC,
}: ModuleDWorkspaceProps) {
  const countryPack = getCountryRulePack(selectedCountry);

  const [activeTab, setActiveTab] = useState<
    'STEP_1' | 'STEP_2' | 'STEP_3' | 'STEP_4' | 'STEP_5' | 'STEP_6'
  >('STEP_1');

  const [showWhyCard, setShowWhyCard] = useState(true);
  const [showExamples, setShowExamples] = useState(false);
  const [isSavingStep1, setIsSavingStep1] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [saveBanner, setSaveBanner] = useState<string | null>(null);
  const [parkQuestionInput, setParkQuestionInput] = useState('');
  const [showParkInput, setShowParkInput] = useState(false);

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

  // Sync if active plan switches
  useEffect(() => {
    if (plan.moduleDData?.productVehicle) {
      setStep1Data(plan.moduleDData.productVehicle);
    } else {
      const autoTrack = detectRecommendedProductTrack(plan);
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
  }, [plan.id]);

  const activeTrackConfig =
    ADAPTIVE_STEP1_CONFIG_BY_TRACK[step1Data.productTrack] ||
    ADAPTIVE_STEP1_CONFIG_BY_TRACK.SAAS_SOFTWARE_AI;

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
  };

  const handleLoadScenarioPreset = (
    preset: 'BMU_SAAS' | 'WOODWORKER_AMAZON_ETSY' | 'AUTISM_SLEEP_EDUCATION'
  ) => {
    if (isVaultReadonly) return;
    if (preset === 'BMU_SAAS') {
      setStep1Data({
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
      });
      setSaveBanner(
        'Loaded Example #1: SaaS Platform (Build My Unicorn) — Notice how all questions below are tailored for Software & AI!'
      );
    } else if (preset === 'WOODWORKER_AMAZON_ETSY') {
      setStep1Data({
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
      });
      setSaveBanner(
        'Loaded Example #2: Woodworker Chopping Boards (Amazon & Etsy) — Notice how all app/coding questions disappeared and switched to SKUs & Workshop Batches!'
      );
    } else if (preset === 'AUTISM_SLEEP_EDUCATION') {
      setStep1Data({
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
      });
      setSaveBanner(
        'Loaded Example #3: Autism Parent Sleep Educational Platform — Notice how all questions adapted to Bite-Sized Audio/Video, Trackers & Cohort Support!'
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

  const handleSaveStep1 = async () => {
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
      setSaveBanner(
        'Step 1 (Product Track, Form Factor & V1 Launch Vehicle) saved to your Startup Plan!'
      );
    } finally {
      setIsSavingStep1(false);
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
                subtitle: 'Fees, Margins & Direct Unit Cost',
                icon: ShoppingBag,
                ready: false,
              },
              {
                id: 'STEP_3' as const,
                stepNum: 'Step 3',
                title: 'Ruthless V1 Scope Filter',
                subtitle: 'Day-1 Core vs. V1.5 & V2',
                icon: SlidersHorizontal,
                ready: false,
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
                    size="sm"
                    disabled={isVaultReadonly || isSavingStep1}
                    onClick={handleSaveStep1}
                    className="bg-indigo-600 text-xs text-white hover:bg-indigo-700"
                  >
                    {isSavingStep1 ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Saving Step 1...
                      </>
                    ) : (
                      <>
                        <Save className="mr-1.5 h-3.5 w-3.5" />
                        Save Step 1 (Product Vehicle)
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
              We are currently testing <strong>Step 1 (Product Track &amp; V1 Format)</strong>. Once you are happy with Step 1, we will unlock{' '}
              <strong>Step 2 (Own vs. Rent Channel Matrix, Fees &amp; Unit COGS)</strong> tailored to your active{' '}
              <span className="font-semibold text-indigo-700">
                {selectedTrackMeta.label}
              </span>{' '}
              track!
            </p>
            <Button
              type="button"
              size="sm"
              onClick={() => setActiveTab('STEP_1')}
              className="mt-4 bg-indigo-600 text-xs text-white hover:bg-indigo-700"
            >
              Return to Step 1 (Product Track &amp; Format)
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
