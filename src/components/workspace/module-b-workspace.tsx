'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Globe2,
  HelpCircle,
  Lightbulb,
  Wand2,
  BookmarkPlus,
  Check,
  Save,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Users,
  Target,
  Sparkles,
  ShieldCheck,
  Info,
  Building2,
  ShoppingBag,
  Network,
  Landmark,
  Compass,
  Plus,
  Trash2,
  Search,
  Calculator,
  Copy,
  Download,
  Printer,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Eye,
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
import type { BlindSpotItem } from '@/db/schema';
import {
  getCountryRulePack,
  getGrantsForCountry,
  formatPlanCurrency,
  type SupportedCountryCode,
} from '@/lib/localization';
import { buildDynamicModuleBBlindSpots } from '@/lib/ai/module-b-blindspots';
import {
  buildModuleBMarkdownBrief,
  buildModuleBStandaloneHtmlDocument,
  BUYER_MODEL_LABELS,
  type ModuleBBriefData,
} from '@/lib/export/module-b-brief';
import type {
  ActiveStartupPlan,
  BeachheadMarketData,
  BuyerModelType,
  EndUserVsDecisionMakerType,
  BuyingTriggerPreset,
  IndustryCategory,
  CustomerWorkaroundType,
  CompetitorCategoryType,
  CompetitorEntry,
  WhySwitchEdgeType,
  CompetitorsAndStatusQuoData,
  CustomerBillingCadence,
  MarketSizingSegmentEntry,
  WiderMarketScalePreset,
  MarketSizingData,
  ComparisonScoreLevel,
  CompetitiveComparisonRow,
  SwitchingFrictionReducerType,
  UnfairAdvantageMoatType,
  CompetitiveWedgeData,
} from '@/lib/auth/session-store';

const BUYER_MODEL_OPTIONS: Array<{
  value: BuyerModelType;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    value: 'B2B_BUSINESSES',
    label: 'B2B (Businesses & Accelerators)',
    subtitle:
      'Companies, SMEs, private accelerators, retail stores, or enterprise teams.',
    icon: Building2,
  },
  {
    value: 'B2C_CONSUMERS',
    label: 'B2C / Prosumer (Individuals)',
    subtitle:
      'Individual users, solo founders, or households paying out of their own pocket.',
    icon: ShoppingBag,
  },
  {
    value: 'TWO_SIDED_MARKETPLACE',
    label: 'Two-Sided Marketplace',
    subtitle:
      'You connect two sides (e.g. buyers & providers, founders & mentors) and charge a fee.',
    icon: Network,
  },
  {
    value: 'B2G_PUBLIC_SECTOR',
    label: 'Universities / Public Sector / Healthcare',
    subtitle:
      'Universities, state enterprise agencies (LEOs), schools, hospitals, or councils.',
    icon: Landmark,
  },
  {
    value: 'OTHER',
    label: 'Other (Custom Buyer Model)',
    subtitle:
      'Channel partners, franchises, associations, charities, or another buyer model.',
    icon: Sparkles,
  },
];

const BUYING_TRIGGER_OPTIONS: Array<{
  value: BuyingTriggerPreset;
  label: string;
  description: string;
}> = [
  {
    value: 'LOSING_MONEY_WASTE',
    label: '💸 Losing Money / Margin Leak',
    description:
      'They just saw a painful bill, stock write-off, or lost revenue they cannot ignore.',
  },
  {
    value: 'MANUAL_TIME_BOTTLENECK',
    label: '⏳ Drowning in Manual Admin',
    description:
      'Staff or the customer are wasting hours every week on spreadsheets, WhatsApp, or paper.',
  },
  {
    value: 'COMPLIANCE_OR_PENALTY',
    label: '⚖️ Compliance, Audit or Safety Risk',
    description:
      'A new regulation, audit deadline, or penalty forces them to act before a set date.',
  },
  {
    value: 'LOST_CUSTOMERS_CHURN',
    label: '📉 Losing Customers to Rivals',
    description:
      'Their own customers are complaining or leaving because their current setup feels outdated.',
  },
  {
    value: 'LIFE_OR_BUSINESS_MILESTONE',
    label: '🚀 New Launch, Hire or Life Event',
    description:
      'Opening a new location, hiring a team, moving house, or starting a new chapter.',
  },
  {
    value: 'OTHER',
    label: '✨ Other (Custom Trigger Moment)',
    description:
      'Another specific event or pain point makes them look for a solution — describe it below.',
  },
];

const TARGET_MARKET_GEOGRAPHIES: Array<{
  code: SupportedCountryCode;
  name: string;
  flag: string;
  regionHint: string;
}> = [
  {
    code: 'IE',
    name: 'Ireland',
    flag: '🇮🇪',
    regionHint: 'EUR (€) • EU Single Market',
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    regionHint: 'GBP (£) • England, Scotland, Wales & NI',
  },
  {
    code: 'EU',
    name: 'European Union (27)',
    flag: '🇪🇺',
    regionHint: 'EUR (€) • Cross-border EEA',
  },
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    regionHint: 'USD ($) • State-by-state Sales Tax',
  },
  {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    regionHint: 'CAD ($) • GST/HST Provinces',
  },
  {
    code: 'AU',
    name: 'Australia & NZ',
    flag: '🇦🇺',
    regionHint: 'AUD ($) • ANZ Region',
  },
  {
    code: 'ROW',
    name: 'Other / Global Markets',
    flag: '🌍',
    regionHint: 'Specify any other countries or regions',
  },
];

function getIndustryBeachheadExamples(industry: IndustryCategory): {
  weakExample: string;
  strongBeachhead: string;
  decisionMakerExample: string;
  triggerExample: string;
} {
  switch (industry) {
    case 'B2B SaaS / AI App':
      return {
        weakExample: 'All supermarkets and retail shops globally.',
        strongBeachhead:
          'Independent 1-to-5 store grocery retailers in Ireland & the UK that sell fresh produce and already use a digital POS system.',
        decisionMakerExample:
          'Store Owner / Managing Director signs off on the €299/mo subscription; Fresh Food Manager uses the alerts daily.',
        triggerExample:
          'Monthly stocktake reveals over €4,000 in fresh food dumped in the bin last month.',
      };
    case 'Consumer App / Marketplace':
      return {
        weakExample: 'Anyone who owns a dog or pet.',
        strongBeachhead:
          'First-time dog owners in Dublin & Cork commuter towns who work hybrid (3 days in the office) and need vetted last-minute daytime dog walkers.',
        decisionMakerExample:
          'Working pet owner (User and Buyer are the same person paying via Apple Pay/Stripe).',
        triggerExample:
          'Employer announces mandatory return-to-office days starting next Monday.',
      };
    case 'E-Commerce / Physical Product / Food & Drink':
      return {
        weakExample: 'Everyone who drinks coffee or energy drinks.',
        strongBeachhead:
          'Shift-working nurses and junior doctors in UK & Irish hospitals looking for a low-sugar, gut-friendly night-shift energy drink.',
        decisionMakerExample:
          'Individual shift worker buying a 12-pack subscription online (or Hospital Canteen Buyer for wholesale).',
        triggerExample:
          'Starting a block of four 12-hour night shifts and wanting to avoid 3am caffeine crashes.',
      };
    case 'Service / Agency / Consulting':
      return {
        weakExample: 'Small businesses that need marketing help.',
        strongBeachhead:
          'B2B engineering & manufacturing firms (15–50 staff) in the Midlands that rely on word-of-mouth and have zero inbound LinkedIn pipeline.',
        decisionMakerExample:
          'Commercial Director or Founder/Owner with authority over a €2,500/month retainer.',
        triggerExample:
          'Losing a major tender to a younger competitor with a much stronger digital presence.',
      };
    case 'Hardware / MedTech / DeepTech':
      return {
        weakExample: 'All physiotherapy clinics and hospitals.',
        strongBeachhead:
          'Private sports-injury physiotherapy clinics (3+ practitioners) treating post-ACL surgery athletes who pay out-of-pocket.',
        decisionMakerExample:
          'Clinic Principal / Owner approves the hardware lease; Senior Physiotherapists use it with patients.',
        triggerExample:
          'Patients dropping out of rehab after week 4 because they cannot track recovery progress at home.',
      };
    default:
      return {
        weakExample: 'Everyone living in the local area.',
        strongBeachhead:
          'Busy dual-income parents within a 15-minute drive who want healthy, ready-to-heat family dinners on Tue–Thu evenings.',
        decisionMakerExample:
          'Household meal planner ordering via phone/web at 4pm on their commute home.',
        triggerExample:
          'Getting home at 6:30pm after kids’ sports practice with an empty fridge and avoiding expensive takeaway.',
      };
  }
}

const CUSTOMER_WORKAROUND_OPTIONS: Array<{
  value: CustomerWorkaroundType;
  label: string;
  description: string;
}> = [
  {
    value: 'SPREADSHEETS_PAPER',
    label: '📊 Spreadsheets, Paper & Sticky Notes',
    description:
      'Tracking things manually in Excel, Google Sheets, Word docs, or notebooks.',
  },
  {
    value: 'WHATSAPP_EMAIL_PHONE',
    label: '💬 WhatsApp, Email & Phone Calls',
    description:
      'Chasing people back and forth via messages, phone calls, or group chats.',
  },
  {
    value: 'FREE_GENERIC_TOOLS',
    label: '🛠️ Free or Generic Everyday Tools',
    description:
      'Cobbling together free templates, Canva, Notion, or generic AI chat.',
  },
  {
    value: 'EXPENSIVE_CONSULTANTS_AGENCIES',
    label: '🤝 Expensive Consultants, Agencies or Extra Staff',
    description:
      'Paying an external freelancer, consultant, or staff member to do it manually.',
  },
  {
    value: 'DOING_NOTHING_LIVING_WITH_PAIN',
    label: '🙈 Doing Nothing (Living With the Cost or Delay)',
    description:
      'Putting up with the wasted hours, lost revenue, or missed opportunities.',
  },
  {
    value: 'OTHER',
    label: '✨ Other (Custom Current Habit)',
    description:
      'They handle it in another way today — describe their current habit below.',
  },
];

const COMPETITOR_CATEGORY_OPTIONS: Array<{
  value: CompetitorCategoryType;
  label: string;
}> = [
  { value: 'DIRECT_COMPETITOR', label: 'Direct Competitor' },
  { value: 'INDIRECT_ALTERNATIVE', label: 'Indirect / Everyday Tool' },
  { value: 'MANUAL_SERVICE_AGENCY', label: 'Consultant / Agency / Service' },
  { value: 'OTHER', label: 'Other (Custom Alternative)' },
];

const WHY_SWITCH_EDGE_OPTIONS: Array<{
  value: WhySwitchEdgeType;
  label: string;
}> = [
  {
    value: 'SAVES_TIME_AUTOMATIC',
    label: '⚡ Saves Hours of Manual Admin',
  },
  {
    value: 'MORE_AFFORDABLE',
    label: '💷 More Affordable / Clear ROI',
  },
  {
    value: 'BUILT_FOR_LOCAL_MARKET',
    label: '🌍 Tailored to Local Rules & Grants',
  },
  {
    value: 'EASIER_NO_TRAINING',
    label: '🎯 Simpler — No Training Needed',
  },
  {
    value: 'ALL_IN_ONE_WORKFLOW',
    label: '🔗 Everything in One Place',
  },
  {
    value: 'PROVEN_RESULTS_OR_COMPLIANCE',
    label: '🛡️ Higher Trust, Vetting or Compliance',
  },
  {
    value: 'OTHER',
    label: '✨ Other (Custom Reason They Switch)',
  },
];

function getIndustryCompetitorExamples(industry: IndustryCategory): {
  weakExample: string;
  strongExample: string;
} {
  switch (industry) {
    case 'B2B SaaS / AI App':
      return {
        weakExample:
          'We have no competitors because no one else has built our exact feature list.',
        strongExample:
          'Today, our customers either use Excel spreadsheets (free, but wastes 4 hours every Friday) or legacy software that costs €600/month and takes 6 weeks to set up. Customers switch to us because they get automated results in 15 minutes for €99/month.',
      };
    case 'Consumer App / Marketplace':
      return {
        weakExample: 'Nobody else has an app like ours in this town.',
        strongExample:
          'Today, customers ask in local Facebook groups or message 5 different providers on WhatsApp waiting hours for a reply. Customers switch to us because every provider is vetted and bookable in 60 seconds.',
      };
    default:
      return {
        weakExample: 'Our product is completely unique so we have zero competition.',
        strongExample:
          'Today, customers either pay €2,000+ to a traditional consultant or try to piece it together themselves using free templates. Customers switch to us because we guide them step-by-step at 1/10th of the cost.',
      };
  }
}

const WIDER_MARKET_SCALE_OPTIONS: Array<{
  value: WiderMarketScalePreset;
  multiplier: number;
  label: string;
  description: string;
}> = [
  {
    value: '3X',
    multiplier: 3,
    label: '3x Bigger (Adjacent Regions / Sectors)',
    description:
      'Expanding into neighbouring regions or one adjacent customer group.',
  },
  {
    value: '5X',
    multiplier: 5,
    label: '5x Bigger (Multi-Country Expansion)',
    description:
      'Expanding across 3–5 international markets with similar buyers.',
  },
  {
    value: '10X',
    multiplier: 10,
    label: '10x Bigger (International Category Scale)',
    description:
      'Scaling across Europe, UK, North America, and institutional segments.',
  },
  {
    value: '20X',
    multiplier: 20,
    label: '20x Bigger (Global Category Opportunity)',
    description:
      'Long-term global opportunity across all English-speaking & EU markets.',
  },
  {
    value: 'OTHER',
    multiplier: 5,
    label: '✨ Other (Custom Expansion Scale)',
    description:
      'Custom long-term expansion scope — describe your wider market scale below.',
  },
];

function getIndustryMarketSizingExamples(industry: IndustryCategory): {
  weakExample: string;
  strongExample: string;
} {
  switch (industry) {
    case 'B2B SaaS / AI App':
      return {
        weakExample:
          'The global software market is worth €500 Billion, and if we get just 1% of it we will make €5 Billion.',
        strongExample:
          'Group 1 (Individual Users): 25,000 potential founders in Ireland & the UK at €29/year (€725k). Group 2 (Universities & Accelerators): 180 programmes at €2,500/year (€450k). In Year 1–2 we aim to win 350 individual users and 8 university programmes (€30,150/year).',
      };
    case 'Consumer App / Marketplace':
      return {
        weakExample:
          'There are 10 million pet owners in the UK & Ireland so our market is huge.',
        strongExample:
          'There are 35,000 hybrid-working dog owners in our target commuter towns spending €120/year on platform fees (€4.2M reachable market). Our realistic Year 1–2 goal is 400 active households (€48,000/year).',
      };
    default:
      return {
        weakExample: 'Everyone needs this product so the market is billions.',
        strongExample:
          'We multiplied the realistic number of target buyers in our selected countries by what a typical customer pays per year, and set a practical Year 1–2 customer goal we can reach with our current team.',
      };
  }
}

const SWITCHING_FRICTION_REDUCER_OPTIONS: Array<{
  value: SwitchingFrictionReducerType;
  label: string;
  description: string;
}> = [
  {
    value: 'FREE_TRIAL_OR_FIRST_STEP',
    label: '🎁 Free First Step or Low-Risk Trial',
    description:
      'Customers can try the first module, sample, or audit for free before paying.',
  },
  {
    value: 'FAST_SETUP_UNDER_15_MINS',
    label: '⚡ Setup in Under 15 Minutes',
    description:
      'No weeks of training or IT setup — they get their first win on Day 1.',
  },
  {
    value: 'WORKS_WITH_EXISTING_TOOLS',
    label: '🔌 Works Alongside What They Already Use',
    description:
      'No painful migration needed; complements their existing workflow or exports cleanly.',
  },
  {
    value: 'DONE_FOR_YOU_MIGRATION',
    label: '🤝 Done-For-You Setup / White-Glove Onboarding',
    description:
      'You personally help early customers get set up so they do zero heavy lifting.',
  },
  {
    value: 'IMMEDIATE_COST_SAVING',
    label: '💷 Saves Money From Month 1',
    description:
      'Costs a fraction of the consultant, agency, or bloated software they pay today.',
  },
  {
    value: 'NO_LONG_CONTRACT',
    label: '🔓 No Long Lock-In Contract',
    description:
      'Simple transparent pricing without trapping buyers in a scary 12-month deal.',
  },
  {
    value: 'OTHER',
    label: '✨ Other (Custom Easy First Step)',
    description:
      'Another way you make it effortless and low-risk for customers to switch to you.',
  },
];

const UNFAIR_ADVANTAGE_MOAT_OPTIONS: Array<{
  value: UnfairAdvantageMoatType;
  label: string;
  description: string;
}> = [
  {
    value: 'FOUNDER_INSIDER_EXPERIENCE',
    label: '🧠 Founder Insider Experience & Network',
    description:
      'You have lived this problem firsthand and know the industry buyers personally.',
  },
  {
    value: 'PROPRIETARY_DATA_OR_TEMPLATES',
    label: '🔐 Purpose-Built Playbooks, Data, Recipes or IP',
    description:
      'Specialist workflows, templates, or formulations that generic tools cannot easily copy.',
  },
  {
    value: 'LOCAL_COMPLIANCE_OR_GRANTS',
    label: '🌍 Deep Local Rules, Grants & Regional Fit',
    description:
      'Built natively around local tax, grant agencies, and rules in your target markets.',
  },
  {
    value: 'WORKFLOW_HABIT_LOCK_IN',
    label: '🔄 Living Workspace & System of Record',
    description:
      'Once a customer builds their live plan, data, or routine with you, they stay.',
  },
  {
    value: 'COMMUNITY_OR_NETWORK_EFFECTS',
    label: '🕸️ Community, Cohorts or Network Effects',
    description:
      'Every new user, mentor, or partner makes the platform more valuable for everyone.',
  },
  {
    value: 'EXCLUSIVE_PARTNERSHIPS_OR_ACCREDITATION',
    label: '🏅 Institutional Partnerships or Vetted Supply',
    description:
      'Relationships with universities, accelerators, or suppliers that take years to replicate.',
  },
  {
    value: 'OTHER',
    label: '✨ Other (Custom Unfair Advantage)',
    description:
      'Another defensible advantage or moat that stops competitors from easily copying you.',
  },
];

function getIndustryCompetitiveEdgeExamples(industry: IndustryCategory): {
  weakExample: string;
  strongExample: string;
} {
  switch (industry) {
    case 'B2B SaaS / AI App':
      return {
        weakExample:
          'We will beat competitors because our AI is smarter and our UI looks nicer.',
        strongExample:
          'Customers switch to us because our free first module gives them an instant 1-page plan in 10 minutes without hiring a €2,500 consultant. Competitors cannot easily copy us because our platform combines localized grant rules (LEO, Enterprise Ireland, Innovate UK) with an interactive 9-module workspace that universities and accelerators run their cohorts on.',
      };
    case 'Consumer App / Marketplace':
      return {
        weakExample:
          'We will win because our app has more features and lower fees.',
        strongExample:
          'Customers switch from chaotic Facebook groups to us because every provider is pre-vetted and bookable in 60 seconds. Copycats struggle to catch up because we lock in the highest-rated local providers first.',
      };
    default:
      return {
        weakExample:
          'We offer higher quality and better customer service than everyone else.',
        strongExample:
          'Customers switch to us because we remove the risk with a fast, low-cost first step, and we protect our lead through deep local market fit and specialist domain expertise.',
      };
  }
}

export interface ModuleBWorkspaceProps {
  plan: ActiveStartupPlan;
  selectedCountry: SupportedCountryCode;
  isVaultReadonly: boolean;
  onSaveStep1Beachhead: (
    beachhead: BeachheadMarketData,
    progressPercent: number
  ) => Promise<void>;
  onSaveStep2Competitors: (
    competitorsAndStatusQuo: CompetitorsAndStatusQuoData,
    progressPercent: number
  ) => Promise<void>;
  onScoutCompetitorsWithAi: (params: {
    targetCustomerDescription: string;
    targetMarketsArray: string[];
    buyerTypes: BuyerModelType[];
  }) => Promise<{
    competitors: CompetitorEntry[];
    suggestedWhySwitchSentence?: string;
    engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
  } | null>;
  onSaveStep3MarketSizing: (
    marketSizing: MarketSizingData,
    progressPercent: number
  ) => Promise<void>;
  onEstimateMarketSizingWithAi: (params: {
    targetCustomerDescription: string;
    targetMarketsArray: string[];
    buyerTypes: BuyerModelType[];
  }) => Promise<{
    segments: MarketSizingSegmentEntry[];
    widerMarketMultiplier: WiderMarketScalePreset;
    sourceAndAssumptionNotes: string;
    engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
  } | null>;
  onSaveStep4CompetitiveWedge: (
    competitiveWedge: CompetitiveWedgeData,
    progressPercent: number
  ) => Promise<void>;
  onGenerateCompetitiveEdgeWithAi: (params: {
    targetCustomerDescription: string;
    targetMarketsArray: string[];
    competitorNames: string[];
  }) => Promise<{
    comparisonRows: CompetitiveComparisonRow[];
    switchingFrictionReducers: SwitchingFrictionReducerType[];
    switchingFrictionPlanNotes: string;
    unfairAdvantages: UnfairAdvantageMoatType[];
    competitiveEdgeSummary: string;
    engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
  } | null>;
  onSaveStep5Complete: (thingsToConsider: BlindSpotItem[]) => Promise<void>;
  onContinueToModuleC: () => void;
  founderName?: string;
  whiteLabelEnabled?: boolean;
  onParkQuestion: (questionText: string) => void;
  onBackToModuleA: () => void;
}

export function ModuleBWorkspace({
  plan,
  selectedCountry,
  isVaultReadonly,
  onSaveStep1Beachhead,
  onSaveStep2Competitors,
  onScoutCompetitorsWithAi,
  onSaveStep3MarketSizing,
  onEstimateMarketSizingWithAi,
  onSaveStep4CompetitiveWedge,
  onGenerateCompetitiveEdgeWithAi,
  onSaveStep5Complete,
  onContinueToModuleC,
  founderName = 'Founder',
  whiteLabelEnabled = false,
  onParkQuestion,
  onBackToModuleA,
}: ModuleBWorkspaceProps) {
  const countryPack = getCountryRulePack(selectedCountry);
  const localGrants = getGrantsForCountry(selectedCountry);
  const industryExamples = getIndustryBeachheadExamples(plan.industryCategory);
  const competitorExamples = getIndustryCompetitorExamples(
    plan.industryCategory
  );
  const marketSizingExamples = getIndustryMarketSizingExamples(
    plan.industryCategory
  );
  const competitiveEdgeExamples = getIndustryCompetitiveEdgeExamples(
    plan.industryCategory
  );

  const defaultBuyerType: BuyerModelType =
    plan.industryCategory === 'Consumer App / Marketplace'
      ? 'TWO_SIDED_MARKETPLACE'
      : plan.industryCategory ===
            'E-Commerce / Physical Product / Food & Drink' ||
          plan.industryCategory ===
            'Brick & Mortar / Hospitality / Local Business'
        ? 'B2C_CONSUMERS'
        : 'B2B_BUSINESSES';

  const savedBeachhead = plan.moduleBData?.beachhead;

  const initialBuyerTypes: BuyerModelType[] =
    savedBeachhead?.buyerTypes?.length
      ? savedBeachhead.buyerTypes
      : savedBeachhead?.buyerType
        ? [savedBeachhead.buyerType]
        : [defaultBuyerType];

  const [buyerTypes, setBuyerTypes] =
    useState<BuyerModelType[]>(initialBuyerTypes);
  const buyerType: BuyerModelType = buyerTypes[0] ?? defaultBuyerType;
  const [beachheadSegment, setBeachheadSegment] = useState<string>(
    savedBeachhead?.beachheadSegment ??
      plan.conceptCanvas?.targetCustomer ??
      ''
  );
  const [endUserVsDecisionMaker, setEndUserVsDecisionMaker] =
    useState<EndUserVsDecisionMakerType>(
      savedBeachhead?.endUserVsDecisionMaker ??
        (initialBuyerTypes.length === 1 &&
        initialBuyerTypes[0] === 'B2C_CONSUMERS'
          ? 'SAME_PERSON'
          : 'DIFFERENT_DECISION_MAKER')
    );
  const [decisionMakerRole, setDecisionMakerRole] = useState<string>(
    savedBeachhead?.decisionMakerRole ?? ''
  );
  const [buyingTriggerPreset, setBuyingTriggerPreset] =
    useState<BuyingTriggerPreset>(
      savedBeachhead?.buyingTriggerPreset ?? 'LOSING_MONEY_WASTE'
    );
  const [buyingTriggerNotes, setBuyingTriggerNotes] = useState<string>(
    savedBeachhead?.buyingTriggerNotes ?? ''
  );
  const [targetMarkets, setTargetMarkets] = useState<string[]>(
    savedBeachhead?.targetMarketsArray?.length
      ? savedBeachhead.targetMarketsArray
      : plan.targetMarketsArray?.length
        ? plan.targetMarketsArray
        : [selectedCountry]
  );
  const [otherBuyerModelText, setOtherBuyerModelText] = useState<string>(
    savedBeachhead?.otherBuyerModelText ?? ''
  );
  const [otherDecisionMakerSetupText, setOtherDecisionMakerSetupText] =
    useState<string>(savedBeachhead?.otherDecisionMakerSetupText ?? '');
  const [otherGeographyText, setOtherGeographyText] = useState<string>(
    savedBeachhead?.otherGeographyText ?? ''
  );

  // Sync state when plan changes or Cloud SQL hydrates savedBeachhead
  useEffect(() => {
    const nextBuyerTypes: BuyerModelType[] =
      savedBeachhead?.buyerTypes?.length
        ? savedBeachhead.buyerTypes
        : savedBeachhead?.buyerType
          ? [savedBeachhead.buyerType]
          : [defaultBuyerType];
    setBuyerTypes(nextBuyerTypes);
    setBeachheadSegment(
      savedBeachhead?.beachheadSegment ??
        plan.conceptCanvas?.targetCustomer ??
        ''
    );
    setEndUserVsDecisionMaker(
      savedBeachhead?.endUserVsDecisionMaker ??
        (nextBuyerTypes.length === 1 && nextBuyerTypes[0] === 'B2C_CONSUMERS'
          ? 'SAME_PERSON'
          : 'DIFFERENT_DECISION_MAKER')
    );
    setDecisionMakerRole(savedBeachhead?.decisionMakerRole ?? '');
    setBuyingTriggerPreset(
      savedBeachhead?.buyingTriggerPreset ?? 'LOSING_MONEY_WASTE'
    );
    setBuyingTriggerNotes(savedBeachhead?.buyingTriggerNotes ?? '');
    setTargetMarkets(
      savedBeachhead?.targetMarketsArray?.length
        ? savedBeachhead.targetMarketsArray
        : plan.targetMarketsArray?.length
          ? plan.targetMarketsArray
          : [selectedCountry]
    );
    setOtherBuyerModelText(savedBeachhead?.otherBuyerModelText ?? '');
    setOtherDecisionMakerSetupText(
      savedBeachhead?.otherDecisionMakerSetupText ?? ''
    );
    setOtherGeographyText(savedBeachhead?.otherGeographyText ?? '');
  }, [
    plan.id,
    savedBeachhead?.lastSavedAt,
    plan.conceptCanvas?.targetCustomer,
    defaultBuyerType,
    selectedCountry,
  ]);

  function toggleBuyerType(model: BuyerModelType) {
    if (isVaultReadonly) return;
    setBuyerTypes((prev) => {
      let next: BuyerModelType[];
      if (prev.includes(model)) {
        if (prev.length === 1) return prev; // Keep at least 1 customer model selected
        next = prev.filter((item) => item !== model);
      } else {
        next = [...prev, model];
      }
      if (next.length === 1 && next[0] === 'B2C_CONSUMERS') {
        setEndUserVsDecisionMaker('SAME_PERSON');
      } else if (
        next.some(
          (m) =>
            m === 'B2B_BUSINESSES' ||
            m === 'B2G_PUBLIC_SECTOR' ||
            m === 'TWO_SIDED_MARKETPLACE'
        )
      ) {
        setEndUserVsDecisionMaker('DIFFERENT_DECISION_MAKER');
      }
      return next;
    });
  }

  // Layer 1-3 Coaching States
  const [showWhyCard, setShowWhyCard] = useState(true);
  const [showExamples, setShowExamples] = useState(false);
  const [showImStuck, setShowImStuck] = useState(false);
  const [showJargonTooltip, setShowJargonTooltip] = useState(false);

  // "I'm Stuck" 3-mini-question builder states
  const [stuckWho, setStuckWho] = useState('');
  const [stuckSizeOrTrait, setStuckSizeOrTrait] = useState('');
  const [stuckWhereFind10, setStuckWhereFind10] = useState('');

  // Saving state
  const [isSaving, setIsSaving] = useState(false);
  const [saveBanner, setSaveBanner] = useState<string | null>(null);

  // =========================================================================
  // STEP 2 STATE: COMPETITORS & HOW CUSTOMERS DEAL WITH THIS TODAY
  // =========================================================================
  const savedStep2 = plan.moduleBData?.competitorsAndStatusQuo;

  const [currentWorkarounds, setCurrentWorkarounds] = useState<
    CustomerWorkaroundType[]
  >(savedStep2?.currentWorkarounds ?? []);
  const [workaroundFrustrationNotes, setWorkaroundFrustrationNotes] =
    useState<string>(savedStep2?.workaroundFrustrationNotes ?? '');
  const [competitors, setCompetitors] = useState<CompetitorEntry[]>(
    savedStep2?.competitors ?? []
  );
  const [whySwitchEdges, setWhySwitchEdges] = useState<WhySwitchEdgeType[]>(
    savedStep2?.whySwitchEdges ?? []
  );
  const [whySwitchOneSentence, setWhySwitchOneSentence] = useState<string>(
    savedStep2?.whySwitchOneSentence ?? ''
  );
  const [otherWorkaroundText, setOtherWorkaroundText] = useState<string>(
    savedStep2?.otherWorkaroundText ?? ''
  );
  const [otherWhySwitchEdgeText, setOtherWhySwitchEdgeText] = useState<string>(
    savedStep2?.otherWhySwitchEdgeText ?? ''
  );

  // Step 2 Layer 1–2 Coaching States
  const [showStep2WhyCard, setShowStep2WhyCard] = useState(true);
  const [showStep2Examples, setShowStep2Examples] = useState(false);
  const [showStep2ImStuck, setShowStep2ImStuck] = useState(false);
  const [stuckStep2MainComplaint, setStuckStep2MainComplaint] = useState('');
  const [stuckStep2OurFix, setStuckStep2OurFix] = useState('');

  // Step 2 AI Scout & Save States
  const [isScoutingAi, setIsScoutingAi] = useState(false);
  const [isSavingStep2, setIsSavingStep2] = useState(false);

  // =========================================================================
  // STEP 3 STATE: MARKET SIZING WITHOUT THE MATHS HEADACHE (MULTI-GROUP)
  // =========================================================================
  const savedStep3 = plan.moduleBData?.marketSizing;

  function createDefaultBlankSegments(
    count: number
  ): MarketSizingSegmentEntry[] {
    return Array.from({ length: count }, (_, idx) => ({
      id: `seg-init-${idx + 1}`,
      segmentName: '',
      billingCadence: 'YEARLY_OR_ONE_OFF' as CustomerBillingCadence,
      pricePerCustomerInput: '',
      year1To2CustomerGoalInput: '',
      reachableCustomersInTargetMarketsInput: '',
    }));
  }

  const [marketSegments, setMarketSegments] = useState<
    MarketSizingSegmentEntry[]
  >(
    savedStep3?.segments?.length
      ? savedStep3.segments
      : createDefaultBlankSegments(initialBuyerTypes.length > 1 ? 2 : 1)
  );
  const [widerMarketMultiplier, setWiderMarketMultiplier] =
    useState<WiderMarketScalePreset>(
      savedStep3?.widerMarketMultiplier ?? '5X'
    );
  const [otherWiderMarketScaleText, setOtherWiderMarketScaleText] =
    useState<string>(savedStep3?.otherWiderMarketScaleText ?? '');
  const [sourceAndAssumptionNotes, setSourceAndAssumptionNotes] =
    useState<string>(savedStep3?.sourceAndAssumptionNotes ?? '');

  // Step 3 Layer 1–2 Coaching & Action States
  const [showStep3WhyCard, setShowStep3WhyCard] = useState(true);
  const [showStep3Examples, setShowStep3Examples] = useState(false);
  const [showStep3ImStuck, setShowStep3ImStuck] = useState(false);
  const [isEstimatingStep3Ai, setIsEstimatingStep3Ai] = useState(false);
  const [isSavingStep3, setIsSavingStep3] = useState(false);
  const [copiedGrantSummary, setCopiedGrantSummary] = useState(false);

  // Sync Step 3 state when plan changes or Cloud SQL hydrates
  useEffect(() => {
    setMarketSegments(
      savedStep3?.segments?.length
        ? savedStep3.segments
        : createDefaultBlankSegments(
            (savedBeachhead?.buyerTypes?.length || 1) > 1 ? 2 : 1
          )
    );
    setWiderMarketMultiplier(savedStep3?.widerMarketMultiplier ?? '5X');
    setOtherWiderMarketScaleText(savedStep3?.otherWiderMarketScaleText ?? '');
    setSourceAndAssumptionNotes(savedStep3?.sourceAndAssumptionNotes ?? '');
  }, [plan.id, savedStep3?.lastSavedAt, savedBeachhead?.buyerTypes?.length]);

  // =========================================================================
  // STEP 4 STATE (COMPETITIVE EDGE & DEFENSIBILITY MATRIX)
  // =========================================================================
  const savedStep4 = plan.moduleBData?.competitiveWedge;

  const createDefaultComparisonRows = (): CompetitiveComparisonRow[] => {
    const base: CompetitiveComparisonRow[] = [
      {
        rowId: 'row-your-startup',
        label: `${plan.title || 'Your Startup'} (You)`,
        isYourStartup: true,
        priceValueScore: 'HIGH',
        speedTimeSavedScore: 'HIGH',
        easeOfUseScore: 'HIGH',
        specialistQualityScore: 'HIGH',
      },
      {
        rowId: 'row-current-habit',
        label: 'Current Habit (Doing It Manually / Spreadsheets)',
        priceValueScore: 'HIGH',
        speedTimeSavedScore: 'LOW',
        easeOfUseScore: 'LOW',
        specialistQualityScore: 'LOW',
      },
    ];
    const step2Comps = (savedStep2?.competitors ?? []).filter(
      (c) => c.name.trim().length > 0
    );
    step2Comps.forEach((c, idx) => {
      base.push({
        rowId: `row-step2-${idx + 1}`,
        label: c.name.trim(),
        priceValueScore: 'MEDIUM',
        speedTimeSavedScore: 'MEDIUM',
        easeOfUseScore: 'LOW',
        specialistQualityScore: 'MEDIUM',
      });
    });
    return base;
  };

  const [comparisonRows, setComparisonRows] = useState<
    CompetitiveComparisonRow[]
  >(() =>
    savedStep4?.comparisonRows?.length
      ? savedStep4.comparisonRows
      : createDefaultComparisonRows()
  );
  const [switchingFrictionReducers, setSwitchingFrictionReducers] = useState<
    SwitchingFrictionReducerType[]
  >(savedStep4?.switchingFrictionReducers ?? []);
  const [switchingFrictionPlanNotes, setSwitchingFrictionPlanNotes] =
    useState<string>(savedStep4?.switchingFrictionPlanNotes ?? '');
  const [otherSwitchingFrictionText, setOtherSwitchingFrictionText] =
    useState<string>(savedStep4?.otherSwitchingFrictionText ?? '');
  const [unfairAdvantages, setUnfairAdvantages] = useState<
    UnfairAdvantageMoatType[]
  >(savedStep4?.unfairAdvantages ?? []);
  const [otherUnfairAdvantageText, setOtherUnfairAdvantageText] =
    useState<string>(savedStep4?.otherUnfairAdvantageText ?? '');
  const [competitiveEdgeSummary, setCompetitiveEdgeSummary] = useState<string>(
    savedStep4?.competitiveEdgeSummary ?? ''
  );

  // Step 4 Layer 1–2 Coaching & Action States
  const [showStep4WhyCard, setShowStep4WhyCard] = useState(true);
  const [showStep4Examples, setShowStep4Examples] = useState(false);
  const [showStep4ImStuck, setShowStep4ImStuck] = useState(false);
  const [stuckStep4EasyFirstStep, setStuckStep4EasyFirstStep] = useState('');
  const [stuckStep4WhyHardToCopy, setStuckStep4WhyHardToCopy] = useState('');
  const [isGeneratingStep4Ai, setIsGeneratingStep4Ai] = useState(false);
  const [isSavingStep4, setIsSavingStep4] = useState(false);
  const [copiedEdgeSummary, setCopiedEdgeSummary] = useState(false);

  useEffect(() => {
    setComparisonRows(
      savedStep4?.comparisonRows?.length
        ? savedStep4.comparisonRows
        : createDefaultComparisonRows()
    );
    setSwitchingFrictionReducers(savedStep4?.switchingFrictionReducers ?? []);
    setSwitchingFrictionPlanNotes(savedStep4?.switchingFrictionPlanNotes ?? '');
    setOtherSwitchingFrictionText(savedStep4?.otherSwitchingFrictionText ?? '');
    setUnfairAdvantages(savedStep4?.unfairAdvantages ?? []);
    setOtherUnfairAdvantageText(savedStep4?.otherUnfairAdvantageText ?? '');
    setCompetitiveEdgeSummary(savedStep4?.competitiveEdgeSummary ?? '');
  }, [plan.id, savedStep4?.lastSavedAt]);

  function handleUpdateComparisonScore(
    rowId: string,
    field:
      | 'priceValueScore'
      | 'speedTimeSavedScore'
      | 'easeOfUseScore'
      | 'specialistQualityScore',
    score: ComparisonScoreLevel
  ) {
    if (isVaultReadonly) return;
    setComparisonRows((prev) =>
      prev.map((r) => (r.rowId === rowId ? { ...r, [field]: score } : r))
    );
  }

  function handleUpdateComparisonLabel(rowId: string, label: string) {
    if (isVaultReadonly) return;
    setComparisonRows((prev) =>
      prev.map((r) => (r.rowId === rowId ? { ...r, label } : r))
    );
  }

  function handleAddComparisonRow() {
    if (isVaultReadonly) return;
    setComparisonRows((prev) => [
      ...prev,
      {
        rowId: `row-custom-${Date.now()}`,
        label: '',
        priceValueScore: 'MEDIUM',
        speedTimeSavedScore: 'MEDIUM',
        easeOfUseScore: 'LOW',
        specialistQualityScore: 'MEDIUM',
      },
    ]);
  }

  function handleRemoveComparisonRow(rowId: string) {
    if (isVaultReadonly) return;
    setComparisonRows((prev) =>
      prev.filter((r) => r.isYourStartup || r.rowId !== rowId)
    );
  }

  function handleSyncCompetitorsFromStep2() {
    if (isVaultReadonly) return;
    const namedCompetitors = competitors.filter(
      (c) => c.name.trim().length > 0
    );
    if (namedCompetitors.length === 0) {
      setSaveBanner(
        'ℹ️ Add or scout competitors in Step 2 first so we can pull their names into your comparison table.'
      );
      return;
    }
    setComparisonRows((prev) => {
      const existingLabels = new Set(
        prev.map((r) => r.label.trim().toLowerCase())
      );
      const added: CompetitiveComparisonRow[] = [];
      namedCompetitors.forEach((c, idx) => {
        if (!existingLabels.has(c.name.trim().toLowerCase())) {
          added.push({
            rowId: `row-sync-${Date.now()}-${idx}`,
            label: c.name.trim(),
            priceValueScore: 'MEDIUM',
            speedTimeSavedScore: 'MEDIUM',
            easeOfUseScore: 'LOW',
            specialistQualityScore: 'MEDIUM',
          });
        }
      });
      return [...prev, ...added];
    });
    setSaveBanner(
      '✨ Synced your competitors from Step 2 into the comparison table!'
    );
  }

  function toggleSwitchingFrictionReducer(item: SwitchingFrictionReducerType) {
    if (isVaultReadonly) return;
    setSwitchingFrictionReducers((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  }

  function toggleUnfairAdvantage(item: UnfairAdvantageMoatType) {
    if (isVaultReadonly) return;
    setUnfairAdvantages((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  }

  function handleDraftSummaryFromSelections() {
    if (isVaultReadonly) return;
    const switchLabels = SWITCHING_FRICTION_REDUCER_OPTIONS.filter((o) =>
      switchingFrictionReducers.includes(o.value)
    ).map((o) => o.label.replace(/^[^\w]+/, '').toLowerCase());
    const moatLabels = UNFAIR_ADVANTAGE_MOAT_OPTIONS.filter((o) =>
      unfairAdvantages.includes(o.value)
    ).map((o) => o.label.replace(/^[^\w]+/, '').toLowerCase());

    const switchPart =
      switchLabels.length > 0
        ? switchLabels.join(' and ')
        : 'a fast, low-risk onboarding experience';
    const moatPart =
      moatLabels.length > 0
        ? moatLabels.join(', ')
        : `deep focus on ${targetMarkets.join(' & ')} customers`;

    const summary = `Customers switch from manual workarounds and legacy alternatives to ${plan.title} because we offer ${switchPart} with higher speed and ease of use. Over time, our position in ${targetMarkets.join(' & ')} is protected against copycats through ${moatPart}.`;
    setCompetitiveEdgeSummary(summary);
    setSaveBanner(
      '✨ Drafted your 2-sentence Competitive Edge Summary from your selected cards!'
    );
  }

  function handleDraftStep4FromStuckHelper() {
    const firstStepPart =
      stuckStep4EasyFirstStep.trim() ||
      'try a free first step in under 15 minutes with zero risk';
    const hardToCopyPart =
      stuckStep4WhyHardToCopy.trim() ||
      `our deep local market fit and insider focus in ${targetMarkets.join(' & ')}`;

    setSwitchingFrictionPlanNotes(
      `We make switching effortless by letting customers ${firstStepPart}.`
    );
    setCompetitiveEdgeSummary(
      `Customers switch to ${plan.title} because they can ${firstStepPart} instead of wrestling with manual spreadsheets or expensive consultants. Bigger competitors cannot easily copy us because of ${hardToCopyPart}.`
    );
    setShowStep4ImStuck(false);
    setSaveBanner(
      '✨ Drafted your Switching Plan and Competitive Edge Summary from your 2 quick answers!'
    );
  }

  async function handleRunAiCompetitiveEdge() {
    if (isVaultReadonly) return;
    setIsGeneratingStep4Ai(true);
    setSaveBanner(null);
    try {
      const compNames = competitors
        .map((c) => c.name.trim())
        .filter((n) => n.length > 0);
      const result = await onGenerateCompetitiveEdgeWithAi({
        targetCustomerDescription: beachheadSegment,
        targetMarketsArray: targetMarkets,
        competitorNames: compNames,
      });
      if (result) {
        if (result.comparisonRows.length > 0) {
          setComparisonRows(result.comparisonRows);
        }
        if (result.switchingFrictionReducers.length > 0) {
          setSwitchingFrictionReducers(result.switchingFrictionReducers);
        }
        if (result.switchingFrictionPlanNotes) {
          setSwitchingFrictionPlanNotes(result.switchingFrictionPlanNotes);
        }
        if (result.unfairAdvantages.length > 0) {
          setUnfairAdvantages(result.unfairAdvantages);
        }
        if (result.competitiveEdgeSummary) {
          setCompetitiveEdgeSummary(result.competitiveEdgeSummary);
        }
        setSaveBanner(
          `✨ Generated your Competitive Comparison Matrix and 2-Sentence Edge Summary! Feel free to tweak any score or card below.`
        );
      }
    } finally {
      setIsGeneratingStep4Ai(false);
    }
  }

  function handleAddMarketSegment() {
    if (isVaultReadonly) return;
    setMarketSegments((prev) => [
      ...prev,
      {
        id: `seg-${Date.now()}-${prev.length + 1}`,
        segmentName: '',
        billingCadence: 'YEARLY_OR_ONE_OFF',
        pricePerCustomerInput: '',
        year1To2CustomerGoalInput: '',
        reachableCustomersInTargetMarketsInput: '',
      },
    ]);
  }

  function handleUpdateMarketSegment(
    id: string,
    field: keyof MarketSizingSegmentEntry,
    value: string
  ) {
    if (isVaultReadonly) return;
    setMarketSegments((prev) =>
      prev.map((seg) => (seg.id === id ? { ...seg, [field]: value } : seg))
    );
  }

  function handleRemoveMarketSegment(id: string) {
    if (isVaultReadonly) return;
    setMarketSegments((prev) => {
      if (prev.length <= 1) return prev; // Keep at least 1 customer group
      return prev.filter((seg) => seg.id !== id);
    });
  }

  function handleUseIndustryBenchmark() {
    if (isVaultReadonly) return;
    const hasTwoGroups = buyerTypes.length > 1 || marketSegments.length > 1;
    if (hasTwoGroups) {
      setMarketSegments([
        {
          id: `seg-bench-${Date.now()}-1`,
          segmentName: 'Individual Users / Self-Serve Customers',
          billingCadence: 'YEARLY_OR_ONE_OFF',
          pricePerCustomerInput: '29',
          year1To2CustomerGoalInput: '350',
          reachableCustomersInTargetMarketsInput: '25000',
        },
        {
          id: `seg-bench-${Date.now()}-2`,
          segmentName: 'Universities, Accelerators & Business Accounts',
          billingCadence: 'YEARLY_OR_ONE_OFF',
          pricePerCustomerInput: '2500',
          year1To2CustomerGoalInput: '8',
          reachableCustomersInTargetMarketsInput: '180',
        },
      ]);
      setWiderMarketMultiplier('10X');
      setSourceAndAssumptionNotes(
        `Industry benchmark for ${targetMarkets.join(', ')}: combines individual user passes with annual institutional/business cohort licences.`
      );
    } else if (plan.industryCategory === 'Consumer App / Marketplace') {
      setMarketSegments([
        {
          id: `seg-bench-${Date.now()}-1`,
          segmentName: 'Active Individual Users / Households',
          billingCadence: 'YEARLY_OR_ONE_OFF',
          pricePerCustomerInput: '120',
          year1To2CustomerGoalInput: '400',
          reachableCustomersInTargetMarketsInput: '35000',
        },
      ]);
      setWiderMarketMultiplier('5X');
      setSourceAndAssumptionNotes(
        `Industry benchmark for ${targetMarkets.join(', ')}: based on active households spending ${countryPack.defaultCurrency} 120/year.`
      );
    } else {
      setMarketSegments([
        {
          id: `seg-bench-${Date.now()}-1`,
          segmentName: 'Target Business Customers (SMEs)',
          billingCadence: 'MONTHLY_SUBSCRIPTION',
          pricePerCustomerInput: '99',
          year1To2CustomerGoalInput: '45',
          reachableCustomersInTargetMarketsInput: '3500',
        },
      ]);
      setWiderMarketMultiplier('5X');
      setSourceAndAssumptionNotes(
        `Industry benchmark for ${targetMarkets.join(', ')}: bottom-up count of target SMEs on a monthly subscription.`
      );
    }
    setSaveBanner(
      '📊 Loaded typical industry benchmark numbers! Feel free to adjust any number to match your plan.'
    );
  }

  async function handleRunAiMarketSizing() {
    if (isVaultReadonly) return;
    setIsEstimatingStep3Ai(true);
    setSaveBanner(null);
    try {
      const result = await onEstimateMarketSizingWithAi({
        targetCustomerDescription: beachheadSegment,
        targetMarketsArray: targetMarkets,
        buyerTypes,
      });
      if (result && result.segments.length > 0) {
        setMarketSegments(result.segments);
        setWiderMarketMultiplier(result.widerMarketMultiplier);
        if (result.sourceAndAssumptionNotes) {
          setSourceAndAssumptionNotes(result.sourceAndAssumptionNotes);
        }
        setSaveBanner(
          `✨ Estimated realistic customer counts and pricing in ${countryPack.defaultCurrency} for ${targetMarkets.join(', ')}! You can tweak any box below.`
        );
      }
    } finally {
      setIsEstimatingStep3Ai(false);
    }
  }

  // Sync Step 2 state when plan changes or Cloud SQL hydrates
  useEffect(() => {
    setCurrentWorkarounds(savedStep2?.currentWorkarounds ?? []);
    setWorkaroundFrustrationNotes(
      savedStep2?.workaroundFrustrationNotes ?? ''
    );
    setCompetitors(savedStep2?.competitors ?? []);
    setWhySwitchEdges(savedStep2?.whySwitchEdges ?? []);
    setWhySwitchOneSentence(savedStep2?.whySwitchOneSentence ?? '');
    setOtherWorkaroundText(savedStep2?.otherWorkaroundText ?? '');
    setOtherWhySwitchEdgeText(savedStep2?.otherWhySwitchEdgeText ?? '');
  }, [plan.id, savedStep2?.lastSavedAt]);

  function toggleWorkaround(item: CustomerWorkaroundType) {
    if (isVaultReadonly) return;
    setCurrentWorkarounds((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  }

  function toggleWhySwitchEdge(edge: WhySwitchEdgeType) {
    if (isVaultReadonly) return;
    setWhySwitchEdges((prev) =>
      prev.includes(edge) ? prev.filter((x) => x !== edge) : [...prev, edge]
    );
  }

  function handleAddBlankCompetitor() {
    if (isVaultReadonly) return;
    const newEntry: CompetitorEntry = {
      id: `comp-manual-${Date.now()}`,
      name: '',
      category: 'DIRECT_COMPETITOR',
      typicalPriceText: '',
      whatTheyDoWell: '',
      whereTheyFallShort: '',
    };
    setCompetitors((prev) => [...prev, newEntry]);
  }

  function handleUpdateCompetitor(
    id: string,
    field: keyof CompetitorEntry,
    value: string
  ) {
    if (isVaultReadonly) return;
    setCompetitors((prev) =>
      prev.map((comp) => (comp.id === id ? { ...comp, [field]: value } : comp))
    );
  }

  function handleRemoveCompetitor(id: string) {
    if (isVaultReadonly) return;
    setCompetitors((prev) => prev.filter((comp) => comp.id !== id));
  }

  function handleDraftStep2FromStuckHelper() {
    const complaintPart =
      stuckStep2MainComplaint.trim() ||
      'slow, manual workarounds or overpriced alternatives';
    const fixPart =
      stuckStep2OurFix.trim() ||
      `gives them a simpler, purpose-built workflow in ${targetMarkets.join(' & ')}`;
    setWhySwitchOneSentence(
      `Customers switch from ${complaintPart} to ${plan.title} because it ${fixPart}.`
    );
    setShowStep2ImStuck(false);
    setSaveBanner(
      '✨ Drafted your "Why Customers Switch to Us" sentence from your 2 answers!'
    );
  }

  async function handleRunAiMarketScout() {
    if (isVaultReadonly) return;
    setIsScoutingAi(true);
    setSaveBanner(null);
    try {
      const result = await onScoutCompetitorsWithAi({
        targetCustomerDescription: beachheadSegment,
        targetMarketsArray: targetMarkets,
        buyerTypes,
      });
      if (result && result.competitors.length > 0) {
        setCompetitors((prev) => {
          const existingNames = new Set(
            prev.map((c) => c.name.trim().toLowerCase()).filter(Boolean)
          );
          const fresh = result.competitors.filter(
            (c) => !existingNames.has(c.name.trim().toLowerCase())
          );
          return [...prev, ...fresh];
        });
        if (
          !whySwitchOneSentence.trim() &&
          result.suggestedWhySwitchSentence
        ) {
          setWhySwitchOneSentence(result.suggestedWhySwitchSentence);
        }
        setSaveBanner(
          `✨ Found ${result.competitors.length} realistic alternatives in ${targetMarkets.join(', ')}! Feel free to edit or remove any card below.`
        );
      }
    } finally {
      setIsScoutingAi(false);
    }
  }

  function toggleTargetMarket(code: string) {
    if (isVaultReadonly) return;
    setTargetMarkets((prev) => {
      if (prev.includes(code)) {
        if (prev.length === 1) return prev; // Keep at least 1 market selected
        return prev.filter((c) => c !== code);
      }
      return [...prev, code];
    });
  }

  function handleDraftFromStuckHelper() {
    const whoPart =
      stuckWho.trim() ||
      `urgent buyers in ${plan.industryCategory.toLowerCase()}`;
    const traitPart =
      stuckSizeOrTrait.trim() ||
      `who are actively struggling with ${plan.title}'s core problem`;
    const wherePart = stuckWhereFind10.trim()
      ? ` (reachable first via ${stuckWhereFind10.trim()})`
      : '';

    const drafted = `${whoPart} in ${targetMarkets.join(' & ')} — specifically ${traitPart}${wherePart}.`;
    setBeachheadSegment(drafted);
    setShowImStuck(false);
    setSaveBanner(
      '✨ Drafted your Target Customer description from your 3 quick answers!'
    );
  }

  const isExporting =
    targetMarkets.some((m) => m !== selectedCountry) ||
    targetMarkets.includes('EU') ||
    targetMarkets.includes('ROW');

  // =========================================================================
  // LIVE BOTTOM-UP MARKET SIZING CALCULATIONS (ACROSS ALL CUSTOMER GROUPS)
  // =========================================================================
  const computedSegments = marketSegments.map((seg, idx) => {
    const rawPrice =
      parseFloat(seg.pricePerCustomerInput.replace(/[^0-9.]/g, '')) || 0;
    const annualRevenuePerCustomer =
      seg.billingCadence === 'MONTHLY_SUBSCRIPTION' ? rawPrice * 12 : rawPrice;
    const year1To2GoalCustomers =
      parseInt(seg.year1To2CustomerGoalInput.replace(/[^0-9]/g, ''), 10) || 0;
    const reachableCustomersInMarkets =
      parseInt(
        seg.reachableCustomersInTargetMarketsInput.replace(/[^0-9]/g, ''),
        10
      ) || 0;

    const year1To2AnnualRevenue =
      annualRevenuePerCustomer * year1To2GoalCustomers;
    const reachableMarketAnnualValue =
      annualRevenuePerCustomer * reachableCustomersInMarkets;

    return {
      ...seg,
      displayLabel: seg.segmentName.trim() || `Customer Group #${idx + 1}`,
      rawPrice,
      annualRevenuePerCustomer,
      year1To2GoalCustomers,
      reachableCustomersInMarkets,
      year1To2AnnualRevenue,
      reachableMarketAnnualValue,
    };
  });

  const totalYear1To2Customers = computedSegments.reduce(
    (sum, s) => sum + s.year1To2GoalCustomers,
    0
  );
  const totalReachableCustomers = computedSegments.reduce(
    (sum, s) => sum + s.reachableCustomersInMarkets,
    0
  );
  const totalYear1To2RevenueSom = computedSegments.reduce(
    (sum, s) => sum + s.year1To2AnnualRevenue,
    0
  );
  const totalReachableMarketSam = computedSegments.reduce(
    (sum, s) => sum + s.reachableMarketAnnualValue,
    0
  );

  const selectedScaleMultiplierObj =
    WIDER_MARKET_SCALE_OPTIONS.find(
      (opt) => opt.value === widerMarketMultiplier
    ) || WIDER_MARKET_SCALE_OPTIONS[1];
  const totalWiderMarketTam =
    totalReachableMarketSam * selectedScaleMultiplierObj.multiplier;

  const hasEnteredMarketSizingNumbers =
    totalYear1To2RevenueSom > 0 && totalReachableMarketSam > 0;

  const grantReadySummaryParagraph = hasEnteredMarketSizingNumbers
    ? computedSegments.length > 1
      ? `Across ${targetMarkets.join(' & ')}, our reachable market combines ${computedSegments
          .filter((s) => s.reachableMarketAnnualValue > 0)
          .map(
            (s) =>
              `${s.reachableCustomersInMarkets.toLocaleString()} ${s.displayLabel} (${formatPlanCurrency(s.annualRevenuePerCustomer, countryPack.defaultCurrency)}/yr = ${formatPlanCurrency(s.reachableMarketAnnualValue, countryPack.defaultCurrency)})`
          )
          .join(
            ' and '
          )}, totaling a ${formatPlanCurrency(totalReachableMarketSam, countryPack.defaultCurrency)}/yr reachable market (SAM) and a ${formatPlanCurrency(totalWiderMarketTam, countryPack.defaultCurrency)}/yr wider expansion opportunity (TAM). In Year 1–2, our realistic target (SOM) is ${computedSegments
          .filter((s) => s.year1To2GoalCustomers > 0)
          .map(
            (s) => `${s.year1To2GoalCustomers.toLocaleString()} ${s.displayLabel}`
          )
          .join(' + ')}, generating ${formatPlanCurrency(totalYear1To2RevenueSom, countryPack.defaultCurrency)}/yr.`
      : `In ${targetMarkets.join(' & ')}, there are approximately ${totalReachableCustomers.toLocaleString()} target customers (${computedSegments[0]?.displayLabel || 'primary buyers'}) worth ${formatPlanCurrency(computedSegments[0]?.annualRevenuePerCustomer || 0, countryPack.defaultCurrency)}/year each, representing a ${formatPlanCurrency(totalReachableMarketSam, countryPack.defaultCurrency)}/yr reachable market (SAM) and a ${formatPlanCurrency(totalWiderMarketTam, countryPack.defaultCurrency)}/yr wider long-term market (TAM). Our realistic Year 1–2 goal (SOM) is to win ${totalYear1To2Customers.toLocaleString()} paying customers, generating ${formatPlanCurrency(totalYear1To2RevenueSom, countryPack.defaultCurrency)}/year.`
    : '';

  const step1Checkpoints = [
    buyerTypes.length > 0,
    beachheadSegment.trim().length > 12,
    decisionMakerRole.trim().length > 5,
    Boolean(buyingTriggerPreset),
    buyingTriggerNotes.trim().length > 5,
    targetMarkets.length > 0,
  ];
  const step1Completion = Math.round(
    (step1Checkpoints.filter(Boolean).length / step1Checkpoints.length) * 20
  );

  const step2Checkpoints = [
    currentWorkarounds.length > 0,
    workaroundFrustrationNotes.trim().length > 5,
    competitors.some((c) => c.name.trim().length > 1),
    whySwitchEdges.length > 0,
    whySwitchOneSentence.trim().length > 10,
  ];
  const step2Completion = Math.round(
    (step2Checkpoints.filter(Boolean).length / step2Checkpoints.length) * 20
  );

  const step3Checkpoints = [
    computedSegments.some((s) => s.segmentName.trim().length > 1),
    computedSegments.some((s) => s.annualRevenuePerCustomer > 0),
    totalYear1To2Customers > 0,
    totalReachableCustomers > 0,
    sourceAndAssumptionNotes.trim().length > 5,
  ];
  const step3Completion = Math.round(
    (step3Checkpoints.filter(Boolean).length / step3Checkpoints.length) * 20
  );

  const step4Checkpoints = [
    comparisonRows.length >= 2,
    switchingFrictionReducers.length > 0,
    switchingFrictionPlanNotes.trim().length > 5,
    unfairAdvantages.length > 0,
    competitiveEdgeSummary.trim().length > 12,
  ];
  const step4Completion = Math.round(
    (step4Checkpoints.filter(Boolean).length / step4Checkpoints.length) * 20
  );

  // Live 6-Card Blind-Spot Review for Module B Step 5
  const liveModuleBThingsToConsider: BlindSpotItem[] =
    buildDynamicModuleBBlindSpots({
      planTitle: plan.title,
      industryCategory: plan.industryCategory,
      hqCountryCode: selectedCountry,
      targetMarketsArray: targetMarkets,
      beachhead: {
        buyerType,
        buyerTypes,
        beachheadSegment,
        endUserVsDecisionMaker,
        decisionMakerRole,
        buyingTriggerPreset,
        buyingTriggerNotes,
        targetMarketsArray: targetMarkets,
        otherBuyerModelText: otherBuyerModelText.trim() || undefined,
        otherDecisionMakerSetupText:
          otherDecisionMakerSetupText.trim() || undefined,
        otherGeographyText: otherGeographyText.trim() || undefined,
      },
      competitorsAndStatusQuo: {
        currentWorkarounds,
        workaroundFrustrationNotes,
        competitors,
        whySwitchEdges,
        whySwitchOneSentence,
        otherWorkaroundText: otherWorkaroundText.trim() || undefined,
        otherWhySwitchEdgeText: otherWhySwitchEdgeText.trim() || undefined,
      },
      marketSizing: {
        segments: marketSegments,
        widerMarketMultiplier,
        otherWiderMarketScaleText:
          otherWiderMarketScaleText.trim() || undefined,
        sourceAndAssumptionNotes,
      },
      competitiveWedge: {
        comparisonRows,
        switchingFrictionReducers,
        switchingFrictionPlanNotes,
        otherSwitchingFrictionText:
          otherSwitchingFrictionText.trim() || undefined,
        unfairAdvantages,
        otherUnfairAdvantageText: otherUnfairAdvantageText.trim() || undefined,
        competitiveEdgeSummary,
      },
    });

  const [isSavingStep5, setIsSavingStep5] = useState(false);
  const [copiedModuleBBrief, setCopiedModuleBBrief] = useState(false);
  const [showModuleBBriefPreview, setShowModuleBBriefPreview] = useState(true);
  const [step5MarkedComplete, setStep5MarkedComplete] = useState<boolean>(
    Boolean(plan.moduleBData?.thingsToConsider?.length)
  );

  const briefGeneratedDate = new Date().toLocaleDateString('en-IE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const moduleBReadinessSteps = [
    {
      stepNumber: 1,
      label: 'Target Customers & Markets',
      isComplete: beachheadSegment.trim().length > 10,
      summary:
        beachheadSegment.trim() ||
        'Define your first priority customer group in Step 1',
    },
    {
      stepNumber: 2,
      label: 'Competitors & Current Habits',
      isComplete:
        competitors.length > 0 || whySwitchOneSentence.trim().length > 8,
      summary:
        competitors.length > 0
          ? `${competitors.length} competitor/alternative(s) mapped`
          : whySwitchOneSentence.trim() ||
            'Map current customer habits & competitors in Step 2',
    },
    {
      stepNumber: 3,
      label: `Market Sizing (${countryPack.defaultCurrency})`,
      isComplete: totalYear1To2RevenueSom > 0,
      summary:
        totalYear1To2RevenueSom > 0
          ? `Year 1–2 Goal: ${formatPlanCurrency(totalYear1To2RevenueSom, countryPack.defaultCurrency)}/yr`
          : 'Enter price & customer counts in Step 3',
    },
    {
      stepNumber: 4,
      label: 'Competitive Edge & Stand Out',
      isComplete:
        competitiveEdgeSummary.trim().length > 10 ||
        unfairAdvantages.length > 0,
      summary:
        competitiveEdgeSummary.trim() ||
        'Define how you stand out & lower switching friction in Step 4',
    },
    {
      stepNumber: 5,
      label: 'Blind-Spot Review',
      isComplete: liveModuleBThingsToConsider.length >= 6,
      summary: `${liveModuleBThingsToConsider.length} market & customer blind spots reviewed`,
    },
  ];

  const completedModuleBReadinessCount = moduleBReadinessSteps.filter(
    (s) => s.isComplete
  ).length;

  const step5Completion =
    step5MarkedComplete ||
    step1Completion + step2Completion + step3Completion + step4Completion >= 60
      ? 20
      : 10;

  const totalModuleBProgress = Math.min(
    100,
    step1Completion +
      step2Completion +
      step3Completion +
      step4Completion +
      step5Completion
  );

  const moduleBBriefData: ModuleBBriefData = {
    planTitle: plan.title,
    founderName,
    industryCategory: plan.industryCategory,
    hqCountryCode: selectedCountry,
    targetMarketsArray: targetMarkets,
    beachhead: {
      buyerType,
      buyerTypes,
      beachheadSegment,
      endUserVsDecisionMaker,
      decisionMakerRole,
      buyingTriggerPreset,
      buyingTriggerNotes,
      targetMarketsArray: targetMarkets,
      otherBuyerModelText: otherBuyerModelText.trim() || undefined,
      otherDecisionMakerSetupText:
        otherDecisionMakerSetupText.trim() || undefined,
      otherGeographyText: otherGeographyText.trim() || undefined,
    },
    competitorsAndStatusQuo: {
      currentWorkarounds,
      workaroundFrustrationNotes,
      competitors,
      whySwitchEdges,
      whySwitchOneSentence,
      otherWorkaroundText: otherWorkaroundText.trim() || undefined,
      otherWhySwitchEdgeText: otherWhySwitchEdgeText.trim() || undefined,
    },
    marketSizing: {
      segments: marketSegments,
      widerMarketMultiplier,
      otherWiderMarketScaleText: otherWiderMarketScaleText.trim() || undefined,
      sourceAndAssumptionNotes,
    },
    competitiveWedge: {
      comparisonRows,
      switchingFrictionReducers,
      switchingFrictionPlanNotes,
      otherSwitchingFrictionText:
        otherSwitchingFrictionText.trim() || undefined,
      unfairAdvantages,
      otherUnfairAdvantageText: otherUnfairAdvantageText.trim() || undefined,
      competitiveEdgeSummary,
    },
    thingsToConsider: liveModuleBThingsToConsider,
    grantReadySummaryParagraph,
    totalYear1To2RevenueSom,
    totalReachableMarketSam,
    totalWiderMarketTam,
    whiteLabelEnabled,
  };

  function handleDownloadModuleBBriefHtml() {
    const htmlContent = buildModuleBStandaloneHtmlDocument(moduleBBriefData);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeSlug =
      plan.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'startup';
    link.href = url;
    link.download = `${safeSlug}-market-research-brief.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setSaveBanner(
      '📄 Downloaded your standalone Market Research & Competitive Intelligence Brief (.html)!'
    );
  }

  function handlePrintModuleBBriefPdf() {
    const htmlContent = buildModuleBStandaloneHtmlDocument(moduleBBriefData);
    const printWindow = window.open('', '_blank', 'width=960,height=800');
    if (!printWindow) {
      handleDownloadModuleBBriefHtml();
      return;
    }
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }

  async function handleCopyModuleBBriefMarkdown() {
    const md = buildModuleBMarkdownBrief(moduleBBriefData);
    try {
      await navigator.clipboard.writeText(md);
      setCopiedModuleBBrief(true);
      setSaveBanner(
        '📋 Copied your complete Module B Market Research & Competitive Brief to clipboard!'
      );
      setTimeout(() => setCopiedModuleBBrief(false), 2500);
    } catch {
      // Ignore clipboard restriction
    }
  }

  async function handleSaveStep5AndComplete() {
    if (isVaultReadonly) return;
    setIsSavingStep5(true);
    setSaveBanner(null);
    await onSaveStep5Complete(liveModuleBThingsToConsider);
    setStep5MarkedComplete(true);
    setIsSavingStep5(false);
    setSaveBanner(
      '🎉 Module B (Market Research & Competitive Intelligence) is 100% saved!'
    );
  }

  async function handleSaveStep1() {
    if (isVaultReadonly) return;
    setIsSaving(true);
    setSaveBanner(null);
    const payload: BeachheadMarketData = {
      buyerType: buyerTypes[0] ?? defaultBuyerType,
      buyerTypes,
      beachheadSegment: beachheadSegment.trim(),
      endUserVsDecisionMaker,
      decisionMakerRole: decisionMakerRole.trim(),
      buyingTriggerPreset,
      buyingTriggerNotes: buyingTriggerNotes.trim(),
      targetMarketsArray: targetMarkets,
      otherBuyerModelText: otherBuyerModelText.trim() || undefined,
      otherDecisionMakerSetupText:
        otherDecisionMakerSetupText.trim() || undefined,
      otherGeographyText: otherGeographyText.trim() || undefined,
      lastSavedAt: new Date().toISOString(),
    };
    await onSaveStep1Beachhead(
      payload,
      Math.max(20, totalModuleBProgress)
    );
    setIsSaving(false);
    setSaveBanner(
      `✅ Saved Step 1 (Target Customers & Selling Markets: ${targetMarkets.join(', ')})!`
    );
  }

  async function handleSaveStep2() {
    if (isVaultReadonly) return;
    setIsSavingStep2(true);
    setSaveBanner(null);
    const payload: CompetitorsAndStatusQuoData = {
      currentWorkarounds,
      workaroundFrustrationNotes: workaroundFrustrationNotes.trim(),
      competitors: competitors.filter(
        (c) =>
          c.name.trim() ||
          c.whatTheyDoWell.trim() ||
          c.whereTheyFallShort.trim()
      ),
      whySwitchEdges,
      whySwitchOneSentence: whySwitchOneSentence.trim(),
      otherWorkaroundText: otherWorkaroundText.trim() || undefined,
      otherWhySwitchEdgeText: otherWhySwitchEdgeText.trim() || undefined,
      lastSavedAt: new Date().toISOString(),
    };
    await onSaveStep2Competitors(
      payload,
      Math.max(40, totalModuleBProgress)
    );
    setIsSavingStep2(false);
    setSaveBanner(
      '✅ Saved Step 2 (Competitors & How Customers Deal With This Today)!'
    );
  }

  async function handleSaveStep3() {
    if (isVaultReadonly) return;
    setIsSavingStep3(true);
    setSaveBanner(null);
    const payload: MarketSizingData = {
      segments: marketSegments,
      widerMarketMultiplier,
      otherWiderMarketScaleText:
        otherWiderMarketScaleText.trim() || undefined,
      sourceAndAssumptionNotes: sourceAndAssumptionNotes.trim(),
      lastSavedAt: new Date().toISOString(),
    };
    await onSaveStep3MarketSizing(
      payload,
      Math.max(60, totalModuleBProgress)
    );
    setIsSavingStep3(false);
    setSaveBanner(
      `✅ Saved Step 3 (Market Sizing in ${countryPack.defaultCurrency})!`
    );
  }

  async function handleSaveStep4() {
    if (isVaultReadonly) return;
    setIsSavingStep4(true);
    setSaveBanner(null);
    const payload: CompetitiveWedgeData = {
      comparisonRows,
      switchingFrictionReducers,
      switchingFrictionPlanNotes: switchingFrictionPlanNotes.trim(),
      otherSwitchingFrictionText:
        otherSwitchingFrictionText.trim() || undefined,
      unfairAdvantages,
      otherUnfairAdvantageText: otherUnfairAdvantageText.trim() || undefined,
      competitiveEdgeSummary: competitiveEdgeSummary.trim(),
      lastSavedAt: new Date().toISOString(),
    };
    await onSaveStep4CompetitiveWedge(
      payload,
      Math.max(80, totalModuleBProgress)
    );
    setIsSavingStep4(false);
    setSaveBanner(
      '✅ Saved Step 4 (Competitive Edge & How You Stand Out)!'
    );
  }

  return (
    <div className="space-y-6">
      {/* Module B Top Header Banner */}
      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-950 via-indigo-900 to-violet-900 p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-indigo-500/30 text-indigo-100 border-indigo-400/40">
                Module B • Market Research &amp; Validation
              </Badge>
              <Badge className="bg-emerald-500/20 text-emerald-200 border-emerald-400/30">
                <ShieldCheck className="mr-1 h-3 w-3" />
                Proving People Will Actually Pay
              </Badge>
            </div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              Module B: Market Research &amp; Competitive Intelligence
            </h1>
            <p className="max-w-2xl text-xs text-indigo-100/90 sm:text-sm">
              Move from <em>&ldquo;I think everyone needs this&rdquo;</em> to a
              clear first customer group, real competitor research,
              plain-English market sizing, and your unfair competitive edge.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onBackToModuleA}
              className="border-indigo-400/40 bg-white/10 text-xs text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Module A Canvas
            </Button>
            <div className="text-right text-[11px] text-indigo-200">
              Module B Progress: <strong>{totalModuleBProgress}%</strong> (All 5
              Steps Active)
            </div>
          </div>
        </div>

        {/* 5-Step Progress Strip inside Module B */}
        <div className="mt-5 grid grid-cols-2 gap-2 pt-4 border-t border-indigo-800/70 sm:grid-cols-5">
          {[
            {
              step: 'Step 1',
              title: 'Customers & Target Markets',
              targetId: 'module-b-step-1',
              active: true,
              done: step1Completion >= 20,
            },
            {
              step: 'Step 2',
              title: 'Competitors & Current Habits',
              targetId: 'module-b-step-2',
              active: true,
              done: step2Completion >= 20,
            },
            {
              step: 'Step 3',
              title: 'Plain-English Market Sizing',
              targetId: 'module-b-step-3',
              active: true,
              done: step3Completion >= 20,
            },
            {
              step: 'Step 4',
              title: 'Competitive Edge & Stand Out',
              targetId: 'module-b-step-4',
              active: true,
              done: step4Completion >= 20,
            },
            {
              step: 'Step 5',
              title: 'Market Things to Consider',
              targetId: 'module-b-step-5',
              active: true,
              done: step5Completion >= 20,
            },
          ].map((item) => (
            <button
              key={item.step}
              type="button"
              onClick={() => {
                if (item.targetId) {
                  document
                    .getElementById(item.targetId)
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className={`rounded-xl border px-3 py-2 text-left text-xs transition-all ${
                item.active
                  ? 'border-amber-300/80 bg-white/15 text-white shadow-xs hover:bg-white/20'
                  : 'border-indigo-800/60 bg-indigo-950/40 text-indigo-300/70'
              }`}
            >
              <div className="flex items-center justify-between font-bold">
                <span>{item.step}</span>
                {item.done ? (
                  <Check className="h-3.5 w-3.5 text-emerald-300" />
                ) : item.active ? (
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                ) : null}
              </div>
              <div className="mt-0.5 truncate text-[11px]">{item.title}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Feedback Banner */}
      {saveBanner && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-950">
          <span>{saveBanner}</span>
          <button
            type="button"
            onClick={() => setSaveBanner(null)}
            className="text-emerald-700 underline hover:text-emerald-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* =================================================================== */}
      {/* STEP 1: DEFINING WHO YOU SELL TO & TARGET COUNTRIES                 */}
      {/* =================================================================== */}
      <Card id="module-b-step-1" className="border-indigo-100 shadow-xs">
        <CardHeader className="border-b border-slate-100 bg-slate-50/60">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Badge>Module B • Step 1 of 5</Badge>
                <button
                  type="button"
                  onClick={() => setShowJargonTooltip(!showJargonTooltip)}
                  className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[11px] font-medium text-indigo-700 hover:bg-indigo-100"
                >
                  <Info className="h-3 w-3" />
                  Why start with a specific customer group?
                </button>
              </div>
              <CardTitle className="mt-2 text-lg">
                Step 1: Who Are Your Customers &amp; Where Are You Selling?
              </CardTitle>
              <CardDescription className="mt-1">
                Define <strong>who will buy from you</strong> (especially the
                first group you want to win) and which countries you plan to
                sell in. This powers your competitor research, market sizing,
                and export grant matching.
              </CardDescription>
            </div>

            {/* Layer 1 Micro-Coaching Toggles */}
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowWhyCard(!showWhyCard)}
              >
                <HelpCircle className="h-3.5 w-3.5 text-indigo-600" />
                Why Ask This?
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowExamples(!showExamples)}
              >
                <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                Show Example
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowImStuck(!showImStuck)}
              >
                <Wand2 className="h-3.5 w-3.5 text-violet-600" />
                I&apos;m Stuck
              </Button>
            </div>
          </div>

          {/* Inline Helpful Tip */}
          {showJargonTooltip && (
            <div className="mt-3 rounded-xl border border-indigo-200 bg-white p-3.5 text-xs text-slate-700 shadow-xs">
              <div className="font-bold text-indigo-950">
                📖 Quick Tip: Why Focus on Your First Customers?
              </div>
              <p className="mt-1 leading-relaxed">
                With limited time and budget, you cannot market to the whole
                world on Day 1. Starting with the{' '}
                <strong>specific group of customers who feel the problem most urgently</strong>{' '}
                makes it much easier to get your first 10 paying users, gather
                feedback, and then expand into bigger markets.
              </p>
            </div>
          )}

          {/* Layer 1: "Why Are We Asking This?" Card */}
          {showWhyCard && (
            <div className="mt-3 rounded-xl border border-indigo-200/80 bg-indigo-50/70 p-3.5 text-xs text-indigo-950">
              <div className="mb-1 flex items-center gap-1.5 font-semibold text-indigo-900">
                <HelpCircle className="h-4 w-4 text-indigo-600" />
                Why Grant Panels &amp; Investors Ask Who You Are Selling To First
              </div>
              <p className="leading-relaxed text-indigo-900/90">
                The #1 mistake on grant applications and pitch decks is writing{' '}
                <em>
                  &ldquo;Our target market is all businesses or anyone with a
                  smartphone.&rdquo;
                </em>{' '}
                When you clearly name who your first customers are (plus the
                countries you will sell into), you immediately know who to send
                your Step 4 Validation Survey to, and you unlock export grant
                points if you plan to sell outside {countryPack.countryName}.
              </p>
            </div>
          )}

          {/* Layer 1: Industry-Tailored Examples */}
          {showExamples && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-950">
              <div className="mb-2 flex items-center gap-1.5 font-semibold text-amber-900">
                <Lightbulb className="h-4 w-4 text-amber-600" />
                Vague vs. Clear Target Customer Examples for{' '}
                <span className="underline">{plan.industryCategory}</span>
              </div>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div className="rounded-lg border border-rose-200 bg-white p-2.5">
                  <span className="font-bold text-rose-700">
                    ❌ Too Broad (Hard to Reach):
                  </span>
                  <p className="mt-1 text-slate-600">
                    &ldquo;{industryExamples.weakExample}&rdquo;
                  </p>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-white p-2.5">
                  <span className="font-bold text-emerald-800">
                    ✅ Clear First Target Customers:
                  </span>
                  <p className="mt-1 text-slate-700">
                    &ldquo;{industryExamples.strongBeachhead}&rdquo;
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Layer 2: "I'm Stuck" Guided Breakdown */}
          {showImStuck && (
            <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50/70 p-4 text-xs text-violet-950">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-bold text-violet-900">
                  <Wand2 className="h-4 w-4 text-violet-600" />
                  Unicorn Co-Pilot: Let&apos;s Describe Your First Customers in
                  3 Easy Steps
                </span>
                <button
                  type="button"
                  onClick={() => setShowImStuck(false)}
                  className="text-violet-700 hover:underline"
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block font-semibold text-violet-900">
                    1. Who loses the most money or time over this?
                  </label>
                  <input
                    type="text"
                    value={stuckWho}
                    onChange={(e) => setStuckWho(e.target.value)}
                    placeholder="e.g., Independent grocery store owners"
                    className="w-full rounded-lg border border-violet-200 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-violet-900">
                    2. What size or trait makes them ideal for V1?
                  </label>
                  <input
                    type="text"
                    value={stuckSizeOrTrait}
                    onChange={(e) => setStuckSizeOrTrait(e.target.value)}
                    placeholder="e.g., 1–5 stores with fresh food aisles"
                    className="w-full rounded-lg border border-violet-200 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-violet-900">
                    3. Where could you reach 10 of them this week?
                  </label>
                  <input
                    type="text"
                    value={stuckWhereFind10}
                    onChange={(e) => setStuckWhereFind10(e.target.value)}
                    placeholder="e.g., Retail trade association or LinkedIn"
                    className="w-full rounded-lg border border-violet-200 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleDraftFromStuckHelper}
                  className="bg-violet-600 text-white hover:bg-violet-700"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Draft My Customer Description
                </Button>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* 1. Buyer Model Selector (Multi-Select Supported) */}
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                1. Who Are Your Customer Models? (Select All That Apply)
              </label>
              <span className="text-[11px] font-medium text-indigo-600">
                {buyerTypes.length > 1
                  ? `${buyerTypes.length} customer models selected (Hybrid / Multi-Segment)`
                  : 'Click multiple cards if you sell to both individuals & institutions/businesses'}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
              {BUYER_MODEL_OPTIONS.map((opt) => {
                const IconComp = opt.icon;
                const selectedIndex = buyerTypes.indexOf(opt.value);
                const selected = selectedIndex !== -1;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={isVaultReadonly}
                    onClick={() => toggleBuyerType(opt.value)}
                    className={`flex flex-col items-start rounded-xl border p-3.5 text-left transition-all ${
                      selected
                        ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-600/15'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                          selected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <IconComp className="h-4 w-4" />
                      </div>
                      {selected && (
                        <Badge className="bg-indigo-600 text-[10px] text-white">
                          {buyerTypes.length > 1 && selectedIndex === 0
                            ? 'Selected (Primary)'
                            : 'Selected'}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-2.5 text-xs font-bold text-slate-900">
                      {opt.label}
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                      {opt.subtitle}
                    </p>
                  </button>
                );
              })}
            </div>

            {buyerTypes.includes('OTHER') && (
              <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50/40 p-3">
                <label className="mb-1 block text-xs font-semibold text-indigo-950">
                  Describe your custom or hybrid customer model:
                </label>
                <input
                  type="text"
                  disabled={isVaultReadonly}
                  value={otherBuyerModelText}
                  onChange={(e) => setOtherBuyerModelText(e.target.value)}
                  placeholder="e.g., B2B2C via Channel Partners, Non-Profits, Licensing, Franchisees, or Public Sector..."
                  className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:outline-hidden"
                />
              </div>
            )}

            {buyerTypes.length > 1 && (
              <div className="mt-2.5 rounded-xl border border-indigo-200 bg-indigo-50/60 px-3.5 py-2.5 text-xs text-indigo-950">
                💡 <strong>Multiple Customer Models Selected:</strong> Many
                great startups sell to more than one group (for example,
                individual users <em>and</em> universities, accelerators, or
                businesses). In Question 2 below, describe your customer groups
                and mention which one you plan to approach first.
              </div>
            )}
          </div>

          {/* 2. Target Customer Description */}
          <div>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="beachhead-segment-input"
                className="text-xs font-bold uppercase tracking-wider text-slate-600"
              >
                2. Describe Your Target Customers (And Who You Will Sell To First)
              </label>
              {plan.conceptCanvas?.targetCustomer && (
                <button
                  type="button"
                  disabled={isVaultReadonly}
                  onClick={() =>
                    setBeachheadSegment(
                      plan.conceptCanvas?.targetCustomer || ''
                    )
                  }
                  className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"
                >
                  <Compass className="h-3.5 w-3.5" />
                  Reset to Module A Target Customer Note
                </button>
              )}
            </div>
            <textarea
              id="beachhead-segment-input"
              rows={3}
              disabled={isVaultReadonly}
              value={beachheadSegment}
              onChange={(e) => setBeachheadSegment(e.target.value)}
              placeholder="Describe who your customers are and which group you will reach out to first..."
              className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-sm leading-relaxed text-slate-900 shadow-2xs focus:border-indigo-600 focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 disabled:bg-slate-100"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Tip: Be specific enough that if you searched LinkedIn or walked
              down a high street today, you would know straight away who is a
              fit for your product.
            </p>
          </div>

          {/* 3. End User vs Economic Buyer / Decision Maker */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  3. User vs. Paying Buyer (Who Actually Approves the Spend?)
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  In many businesses, the person who uses the product daily is
                  different from the person who signs the cheque.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isVaultReadonly}
                  onClick={() => setEndUserVsDecisionMaker('SAME_PERSON')}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                    endUserVsDecisionMaker === 'SAME_PERSON'
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  User = Paying Buyer
                </button>
                <button
                  type="button"
                  disabled={isVaultReadonly}
                  onClick={() =>
                    setEndUserVsDecisionMaker('DIFFERENT_DECISION_MAKER')
                  }
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                    endUserVsDecisionMaker === 'DIFFERENT_DECISION_MAKER'
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Separate Budget Holder / Boss
                </button>
                <button
                  type="button"
                  disabled={isVaultReadonly}
                  onClick={() => setEndUserVsDecisionMaker('OTHER')}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                    endUserVsDecisionMaker === 'OTHER'
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Other / Shared Setup
                </button>
              </div>
            </div>

            {endUserVsDecisionMaker === 'OTHER' && (
              <div className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50/40 p-2.5">
                <label className="mb-1 block text-xs font-semibold text-indigo-950">
                  Describe your custom user vs. buyer setup:
                </label>
                <input
                  type="text"
                  disabled={isVaultReadonly}
                  value={otherDecisionMakerSetupText}
                  onChange={(e) =>
                    setOtherDecisionMakerSetupText(e.target.value)
                  }
                  placeholder="e.g., Reimbursed via employer stipend, insurance-funded, or split between parent & school..."
                  className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-600 focus:outline-hidden"
                />
              </div>
            )}

            <div className="mt-3">
              <label
                htmlFor="decision-maker-input"
                className="mb-1 block text-xs font-medium text-slate-700"
              >
                {endUserVsDecisionMaker === 'SAME_PERSON'
                  ? 'Describe who swipes the card and how they pay:'
                  : 'Who is the Economic Buyer (approves budget) vs. the Champion/User?'}
              </label>
              <input
                id="decision-maker-input"
                type="text"
                disabled={isVaultReadonly}
                value={decisionMakerRole}
                onChange={(e) => setDecisionMakerRole(e.target.value)}
                placeholder="Who approves the budget or pays for the product?"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* 4. The "Hair-on-Fire" Buying Trigger ("Why Now?") */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">
              4. The &ldquo;Why Now?&rdquo; Trigger Moment (What Makes Them Look
              for a Solution Today?)
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {BUYING_TRIGGER_OPTIONS.map((trig) => {
                const selected = buyingTriggerPreset === trig.value;
                return (
                  <button
                    key={trig.value}
                    type="button"
                    disabled={isVaultReadonly}
                    onClick={() => setBuyingTriggerPreset(trig.value)}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      selected
                        ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-600/15'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                      <span>{trig.label}</span>
                      {selected && (
                        <Check className="h-3.5 w-3.5 text-indigo-600" />
                      )}
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                      {trig.description}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-3">
              <label
                htmlFor="trigger-notes-input"
                className="mb-1 block text-xs font-medium text-slate-700"
              >
                Describe the exact moment right before a customer searches for{' '}
                <strong>{plan.title}</strong>:
              </label>
              <input
                id="trigger-notes-input"
                type="text"
                disabled={isVaultReadonly}
                value={buyingTriggerNotes}
                onChange={(e) => setBuyingTriggerNotes(e.target.value)}
                placeholder="What happens right before they start searching for your solution?"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* 5. Target Selling Geographies (Where Your Customers Live) */}
          <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/30 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-950">
                  <Globe2 className="h-4 w-4 text-indigo-600" />
                  5. Target Selling Geographies (Where Your Customers Live)
                </div>
                <p className="mt-0.5 text-xs text-slate-600">
                  Your HQ is incorporated in{' '}
                  <strong>
                    {countryPack.countryName} ({countryPack.defaultCurrency})
                  </strong>
                  . Select every market where you plan to sell in Year 1–2:
                </p>
              </div>
              <Badge
                variant={isExporting ? 'default' : 'secondary'}
                className={
                  isExporting
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-800'
                }
              >
                {isExporting
                  ? '🌍 International Exporter Profile'
                  : `🏠 Domestic (${countryPack.countryName}) Focus`}
              </Badge>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {TARGET_MARKET_GEOGRAPHIES.map((geo) => {
                const isSelected = targetMarkets.includes(geo.code);
                const isHome = geo.code === selectedCountry;
                return (
                  <button
                    key={geo.code}
                    type="button"
                    disabled={isVaultReadonly}
                    onClick={() => toggleTargetMarket(geo.code)}
                    className={`flex items-start justify-between rounded-xl border p-3 text-left transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-white shadow-xs ring-2 ring-indigo-600/15'
                        : 'border-slate-200 bg-white/60 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        <span>{geo.flag}</span>
                        <span>{geo.name}</span>
                        {isHome && (
                          <span className="rounded-sm bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                            HQ
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500">
                        {geo.regionHint}
                      </div>
                    </div>
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {targetMarkets.includes('ROW') && (
              <div className="mt-3 rounded-xl border border-indigo-200 bg-white p-3">
                <label className="mb-1 block text-xs font-semibold text-indigo-950">
                  Specify your other target countries or regions:
                </label>
                <input
                  type="text"
                  disabled={isVaultReadonly}
                  value={otherGeographyText}
                  onChange={(e) => setOtherGeographyText(e.target.value)}
                  placeholder="e.g., UAE, Singapore, Japan, Latin America, Nordics, or Worldwide Digital..."
                  className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:outline-hidden"
                />
              </div>
            )}

            {/* Dynamic Export Grant & Cross-Border Tax Insight Box */}
            <div className="mt-3.5 rounded-xl border border-indigo-200 bg-white p-3.5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 font-semibold text-indigo-950">
                <span>
                  🎯 How Your Selected Markets ({targetMarkets.join(', ')})
                  Impact Module F Grants &amp; Tax:
                </span>
                <span className="text-[11px] text-indigo-700">
                  Base Currency: {countryPack.defaultCurrency} •{' '}
                  {countryPack.taxName} ({countryPack.standardTaxRatePercent}%)
                </span>
              </div>
              <p className="mt-1 leading-relaxed text-slate-600">
                {isExporting ? (
                  <>
                    Because you are selling beyond{' '}
                    <strong>{countryPack.countryName}</strong> into{' '}
                    <strong>
                      {targetMarkets
                        .filter((m) => m !== selectedCountry)
                        .join(', ')}
                    </strong>
                    , your plan qualifies for{' '}
                    <strong>Export &amp; Internationalisation Grants</strong>{' '}
                    (such as{' '}
                    <em>
                      {localGrants[0]?.grantName ||
                        'National Export Innovation Grants'}
                    </em>
                    ). In Module F, we will also automatically flag cross-border{' '}
                    {countryPack.taxName} / Sales Tax rules and currency
                    exposure for these corridors.
                  </>
                ) : (
                  <>
                    You are currently focused 100% on the domestic{' '}
                    <strong>{countryPack.countryName}</strong> market. This
                    keeps Day-1 compliance and {countryPack.taxName} (
                    {countryPack.standardTaxRatePercent}%) simple, though note
                    that certain state innovation grants require showing future
                    international export potential.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Step 1 Action Bar: Park Question + Save Step 1 */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isVaultReadonly}
              onClick={() => {
                onParkQuestion(
                  `Module B Step 1: Interview 5 buyers in [${targetMarkets.join(', ')}] to confirm whether "${decisionMakerRole.slice(0, 50)}..." has budget authority.`
                );
                setSaveBanner(
                  '📌 Added buyer validation question to your Open Questions Parking Lot!'
                );
              }}
            >
              <BookmarkPlus className="h-3.5 w-3.5 text-amber-600" />
              Not 100% sure who approves budget? Park in Open Questions
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={isVaultReadonly || isSaving}
              onClick={handleSaveStep1}
              className="bg-indigo-600 text-white hover:bg-indigo-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Step 1...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Step 1 (Customers &amp; Markets)
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* =================================================================== */}
      {/* STEP 2: COMPETITORS & HOW CUSTOMERS DEAL WITH THIS TODAY            */}
      {/* =================================================================== */}
      <Card id="module-b-step-2" className="border-indigo-100 shadow-xs">
        <CardHeader className="border-b border-slate-100 bg-slate-50/60">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Badge>Module B • Step 2 of 5</Badge>
                <Badge
                  variant="secondary"
                  className="bg-indigo-50 text-indigo-700"
                >
                  AI Market Scout Enabled
                </Badge>
              </div>
              <CardTitle className="mt-2 text-lg">
                Step 2: Competitors &amp; How Customers Deal With This Today
              </CardTitle>
              <CardDescription className="mt-1">
                Show how your target customers currently handle this problem
                (even if it&apos;s spreadsheets or WhatsApp), map out direct
                competitors in <strong>{targetMarkets.join(', ')}</strong>, and
                define why customers will switch to{' '}
                <strong>{plan.title}</strong>.
              </CardDescription>
            </div>

            {/* Step 2 Layer 1 Micro-Coaching Toggles */}
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowStep2WhyCard(!showStep2WhyCard)}
              >
                <HelpCircle className="h-3.5 w-3.5 text-indigo-600" />
                Why Ask This?
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowStep2Examples(!showStep2Examples)}
              >
                <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                Show Example
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowStep2ImStuck(!showStep2ImStuck)}
              >
                <Wand2 className="h-3.5 w-3.5 text-violet-600" />
                I&apos;m Stuck
              </Button>
            </div>
          </div>

          {/* Step 2 Layer 1: "Why Are We Asking This?" Card */}
          {showStep2WhyCard && (
            <div className="mt-3 rounded-xl border border-indigo-200/80 bg-indigo-50/70 p-3.5 text-xs text-indigo-950">
              <div className="mb-1 flex items-center gap-1.5 font-semibold text-indigo-900">
                <HelpCircle className="h-4 w-4 text-indigo-600" />
                Why Saying &ldquo;We Have No Competitors&rdquo; Is a Red Flag
              </div>
              <p className="leading-relaxed text-indigo-900/90">
                Grant assessors and investors hear{' '}
                <em>&ldquo;Nobody else does what we do&rdquo;</em> every day.
                Even if your product is brand new, your customers are already
                doing <strong>something</strong> today — whether that&apos;s
                using Excel spreadsheets, messaging on WhatsApp, hiring a
                consultant, or just living with the problem. Showing both their
                current habits and known competitors proves you truly understand
                your market.
              </p>
            </div>
          )}

          {/* Step 2 Layer 1: Industry-Tailored Examples */}
          {showStep2Examples && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-950">
              <div className="mb-2 flex items-center gap-1.5 font-semibold text-amber-900">
                <Lightbulb className="h-4 w-4 text-amber-600" />
                Weak vs. Strong Competitor &amp; Workaround Breakdown for{' '}
                <span className="underline">{plan.industryCategory}</span>
              </div>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div className="rounded-lg border border-rose-200 bg-white p-2.5">
                  <span className="font-bold text-rose-700">
                    ❌ Unconvincing Answer:
                  </span>
                  <p className="mt-1 text-slate-600">
                    &ldquo;{competitorExamples.weakExample}&rdquo;
                  </p>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-white p-2.5">
                  <span className="font-bold text-emerald-800">
                    ✅ Realistic, Trust-Building Answer:
                  </span>
                  <p className="mt-1 text-slate-700">
                    &ldquo;{competitorExamples.strongExample}&rdquo;
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2 Layer 2: "I'm Stuck" Guided Breakdown */}
          {showStep2ImStuck && (
            <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50/70 p-4 text-xs text-violet-950">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-bold text-violet-900">
                  <Wand2 className="h-4 w-4 text-violet-600" />
                  Unicorn Co-Pilot: Let&apos;s Draft Why Customers Will Switch
                  to You
                </span>
                <button
                  type="button"
                  onClick={() => setShowStep2ImStuck(false)}
                  className="text-violet-700 hover:underline"
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-semibold text-violet-900">
                    1. What do customers hate most about their current setup?
                  </label>
                  <input
                    type="text"
                    value={stuckStep2MainComplaint}
                    onChange={(e) => setStuckStep2MainComplaint(e.target.value)}
                    placeholder="e.g., messy spreadsheets or €2,000 consultant fees"
                    className="w-full rounded-lg border border-violet-200 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-violet-900">
                    2. What is the main practical win of using {plan.title}?
                  </label>
                  <input
                    type="text"
                    value={stuckStep2OurFix}
                    onChange={(e) => setStuckStep2OurFix(e.target.value)}
                    placeholder="e.g., guides them step-by-step in 20 minutes for €29"
                    className="w-full rounded-lg border border-violet-200 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleDraftStep2FromStuckHelper}
                  className="bg-violet-600 text-white hover:bg-violet-700"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Draft My &ldquo;Why Switch&rdquo; Sentence
                </Button>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* PART 1: HOW CUSTOMERS DEAL WITH THIS TODAY (WORKAROUNDS) */}
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                1. What Do Your Customers Do Today Instead? (Select All That
                Apply)
              </label>
              <span className="text-[11px] font-medium text-indigo-600">
                {currentWorkarounds.length > 0
                  ? `${currentWorkarounds.length} everyday habit(s) selected`
                  : 'Select how customers cope right now before your product exists'}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {CUSTOMER_WORKAROUND_OPTIONS.map((opt) => {
                const selected = currentWorkarounds.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={isVaultReadonly}
                    onClick={() => toggleWorkaround(opt.value)}
                    className={`rounded-xl border p-3.5 text-left transition-all ${
                      selected
                        ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-600/15'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs font-bold text-slate-900">
                      <span>{opt.label}</span>
                      {selected && (
                        <Check className="h-3.5 w-3.5 shrink-0 text-indigo-600" />
                      )}
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                      {opt.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {currentWorkarounds.includes('OTHER') && (
              <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50/40 p-3">
                <label className="mb-1 block text-xs font-semibold text-indigo-950">
                  Describe the other habit or workaround your customers use today:
                </label>
                <input
                  type="text"
                  disabled={isVaultReadonly}
                  value={otherWorkaroundText}
                  onChange={(e) => setOtherWorkaroundText(e.target.value)}
                  placeholder="e.g., Using physical paper logbooks, borrowing equipment, or relying on word-of-mouth..."
                  className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:outline-hidden"
                />
              </div>
            )}

            <div className="mt-3">
              <label
                htmlFor="workaround-frustration-input"
                className="mb-1 block text-xs font-medium text-slate-700"
              >
                What is the most frustrating or costly part about how they do it
                today?
              </label>
              <input
                id="workaround-frustration-input"
                type="text"
                disabled={isVaultReadonly}
                value={workaroundFrustrationNotes}
                onChange={(e) => setWorkaroundFrustrationNotes(e.target.value)}
                placeholder="Describe what breaks, takes too long, or costs too much with their current habit..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* PART 2: DIRECT COMPETITORS & ALTERNATIVES (MANUAL + AI SCOUT) */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-800">
                  <Search className="h-4 w-4 text-indigo-600" />
                  2. Direct Competitors &amp; Alternative Tools in{' '}
                  {targetMarkets.join(', ')}
                </div>
                <p className="mt-0.5 text-xs text-slate-600">
                  Add competitors you already know, or click{' '}
                  <strong>Find Competitors for Me with AI</strong> to discover
                  realistic alternatives priced in {countryPack.defaultCurrency}
                  .
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isVaultReadonly}
                  onClick={handleAddBlankCompetitor}
                  className="bg-white"
                >
                  <Plus className="h-3.5 w-3.5 text-slate-700" />
                  Add a Competitor I Know
                </Button>

                <Button
                  type="button"
                  size="sm"
                  disabled={isVaultReadonly || isScoutingAi}
                  onClick={handleRunAiMarketScout}
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700"
                >
                  {isScoutingAi ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Scouting {targetMarkets.join(', ')}...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      Find Competitors for Me with AI
                    </>
                  )}
                </Button>
              </div>
            </div>

            {competitors.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center">
                <p className="text-xs font-semibold text-slate-700">
                  No competitors or alternatives added yet.
                </p>
                <p className="mx-auto mt-1 max-w-lg text-xs text-slate-500">
                  Click <strong>+ Add a Competitor I Know</strong> to type in a
                  company yourself, or click{' '}
                  <strong>Find Competitors for Me with AI</strong> to generate 3
                  editable competitor cards based on your plan.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {competitors.map((comp, index) => (
                  <div
                    key={comp.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <span className="text-xs font-bold text-indigo-950">
                        Competitor / Alternative #{index + 1}
                      </span>
                      <button
                        type="button"
                        disabled={isVaultReadonly}
                        onClick={() => handleRemoveCompetitor(comp.id)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                          Competitor or Alternative Name
                        </label>
                        <input
                          type="text"
                          disabled={isVaultReadonly}
                          value={comp.name}
                          onChange={(e) =>
                            handleUpdateCompetitor(
                              comp.id,
                              'name',
                              e.target.value
                            )
                          }
                          placeholder="e.g., Competitor name or alternative"
                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-600 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                          Type of Alternative
                        </label>
                        <select
                          disabled={isVaultReadonly}
                          value={comp.category}
                          onChange={(e) =>
                            handleUpdateCompetitor(
                              comp.id,
                              'category',
                              e.target.value as CompetitorCategoryType
                            )
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-600 focus:outline-hidden"
                        >
                          {COMPETITOR_CATEGORY_OPTIONS.map((cat) => (
                            <option key={cat.value} value={cat.value}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                          Typical Price ({countryPack.defaultCurrency})
                        </label>
                        <input
                          type="text"
                          disabled={isVaultReadonly}
                          value={comp.typicalPriceText}
                          onChange={(e) =>
                            handleUpdateCompetitor(
                              comp.id,
                              'typicalPriceText',
                              e.target.value
                            )
                          }
                          placeholder={`e.g., Free, ${countryPack.defaultCurrency}49/mo, or ${countryPack.defaultCurrency}1,500`}
                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-600 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-emerald-800">
                          ✅ What They Do Well (Why People Use Them Today)
                        </label>
                        <input
                          type="text"
                          disabled={isVaultReadonly}
                          value={comp.whatTheyDoWell}
                          onChange={(e) =>
                            handleUpdateCompetitor(
                              comp.id,
                              'whatTheyDoWell',
                              e.target.value
                            )
                          }
                          placeholder="What is their main strength or appeal?"
                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-600 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-amber-800">
                          ⚠️ Where They Fall Short for Your Target Customers
                        </label>
                        <input
                          type="text"
                          disabled={isVaultReadonly}
                          value={comp.whereTheyFallShort}
                          onChange={(e) =>
                            handleUpdateCompetitor(
                              comp.id,
                              'whereTheyFallShort',
                              e.target.value
                            )
                          }
                          placeholder="Why do your target customers get frustrated with them?"
                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-600 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PART 3: YOUR "WHY SWITCH TO US?" EDGE */}
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                3. Why Will Customers Switch to {plan.title}? (Select Your Key
                Advantages)
              </label>
              <span className="text-[11px] font-medium text-indigo-600">
                {whySwitchEdges.length > 0
                  ? `${whySwitchEdges.length} advantage(s) selected`
                  : 'Pick the main reasons a customer will switch from their current setup'}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {WHY_SWITCH_EDGE_OPTIONS.map((edge) => {
                const selected = whySwitchEdges.includes(edge.value);
                return (
                  <button
                    key={edge.value}
                    type="button"
                    disabled={isVaultReadonly}
                    onClick={() => toggleWhySwitchEdge(edge.value)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                      selected
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>{edge.label}</span>
                    {selected && <Check className="h-3.5 w-3.5" />}
                  </button>
                );
              })}
            </div>

            {whySwitchEdges.includes('OTHER') && (
              <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50/40 p-3">
                <label className="mb-1 block text-xs font-semibold text-indigo-950">
                  Describe your other key switching advantage:
                </label>
                <input
                  type="text"
                  disabled={isVaultReadonly}
                  value={otherWhySwitchEdgeText}
                  onChange={(e) => setOtherWhySwitchEdgeText(e.target.value)}
                  placeholder="e.g., Certified sustainability, offline-first reliability, or exclusive community access..."
                  className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:outline-hidden"
                />
              </div>
            )}

            <div className="mt-3">
              <label
                htmlFor="why-switch-sentence-input"
                className="mb-1 block text-xs font-medium text-slate-700"
              >
                In one plain-English sentence, why would a customer switch from
                their current setup to <strong>{plan.title}</strong>?
              </label>
              <textarea
                id="why-switch-sentence-input"
                rows={2}
                disabled={isVaultReadonly}
                value={whySwitchOneSentence}
                onChange={(e) => setWhySwitchOneSentence(e.target.value)}
                placeholder="Write a clear, 1-sentence reason why customers will switch to you..."
                className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm leading-relaxed text-slate-900 shadow-2xs focus:border-indigo-600 focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 disabled:bg-slate-100"
              />
            </div>
          </div>

          {/* Step 2 Action Bar: Park Question + Save Step 2 */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isVaultReadonly}
              onClick={() => {
                onParkQuestion(
                  `Module B Step 2: Check exact pricing (${countryPack.defaultCurrency}) and biggest customer complaints for top 3 competitors in [${targetMarkets.join(', ')}].`
                );
                setSaveBanner(
                  '📌 Added competitor pricing check to your Open Questions Parking Lot!'
                );
              }}
            >
              <BookmarkPlus className="h-3.5 w-3.5 text-amber-600" />
              Unsure on competitor pricing? Park in Open Questions
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={isVaultReadonly || isSavingStep2}
              onClick={handleSaveStep2}
              className="bg-indigo-600 text-white hover:bg-indigo-700"
            >
              {isSavingStep2 ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Step 2...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Step 2 (Competitors &amp; Current Habits)
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* =================================================================== */}
      {/* STEP 3: MARKET SIZING WITHOUT THE MATHS HEADACHE                    */}
      {/* =================================================================== */}
      <Card
        id="module-b-step-3"
        className="border-indigo-200 bg-white shadow-xs"
      >
        <CardHeader className="border-b border-slate-100 bg-slate-50/60">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-indigo-600 text-white">
                  Step 3 of 5 • Active Step
                </Badge>
                <Badge variant="outline">
                  Bottom-Up Calculator ({countryPack.defaultCurrency})
                </Badge>
                {marketSegments.length > 1 && (
                  <Badge variant="secondary">
                    {marketSegments.length} Customer Groups Combined
                  </Badge>
                )}
              </div>
              <CardTitle className="text-lg">
                Step 3: Market Sizing Without the Maths Headache
              </CardTitle>
              <CardDescription>
                Skip the fake &ldquo;1% of a $50 Billion global industry&rdquo;
                guessing game. Answer 3 simple questions per customer group and
                we&apos;ll calculate your{' '}
                <strong>Year 1–2 Revenue Goal</strong>,{' '}
                <strong>Reachable Market</strong>, and{' '}
                <strong>Wider Long-Term Market</strong> automatically in{' '}
                <strong>{countryPack.defaultCurrency}</strong>.
              </CardDescription>
            </div>

            {/* Layer 1 + Layer 2 + Layer 3 Support Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowStep3WhyCard((v) => !v)}
              >
                <HelpCircle className="h-3.5 w-3.5 text-indigo-600" />
                {showStep3WhyCard ? 'Hide Why' : 'Why Ask This?'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowStep3Examples((v) => !v)}
              >
                <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                {showStep3Examples ? 'Hide Examples' : 'Show Example'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowStep3ImStuck((v) => !v)}
                className="border-amber-200 bg-amber-50/80 text-amber-900 hover:bg-amber-100"
              >
                <Compass className="h-3.5 w-3.5 text-amber-600" />
                I&apos;m Stuck
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isVaultReadonly}
                onClick={handleUseIndustryBenchmark}
                className="border-emerald-200 bg-emerald-50/80 text-emerald-900 hover:bg-emerald-100"
              >
                <BarChart3 className="h-3.5 w-3.5 text-emerald-600" />
                Use Industry Benchmark
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isVaultReadonly || isEstimatingStep3Ai}
                onClick={handleRunAiMarketSizing}
                className="bg-indigo-600 text-white hover:bg-indigo-700"
              >
                {isEstimatingStep3Ai ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Estimating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Estimate Customer Counts with AI
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-5">
          {/* Layer 1: "Why Are We Asking This?" Micro-Coaching Card */}
          {showStep3WhyCard && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 text-xs text-indigo-950">
              <div className="flex items-start gap-2.5">
                <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                <div className="space-y-1.5">
                  <div className="font-bold">
                    Why do grant panels and investors prefer &ldquo;Bottom-Up
                    Maths&rdquo; over big industry reports?
                  </div>
                  <p className="leading-relaxed text-indigo-900/90">
                    When a founder says{' '}
                    <em>
                      &ldquo;The global software market is €100 Billion and we
                      only need 1%&rdquo;
                    </em>
                    , reviewers immediately push back because it doesn&apos;t
                    show how many real customers you need to win. Instead,
                    counting <strong>Number of Customers × Price Paid</strong>{' '}
                    proves your Year 1–2 revenue goal is grounded in reality —
                    especially if you sell to{' '}
                    <strong>more than one customer group</strong> (for example,
                    individual users <em>plus</em> universities or business
                    teams).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Layer 1: Industry-Tailored Example Drawer */}
          {showStep3Examples && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-950">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-bold">
                  💡 How a Multi-Group Startup Sizes Their Market (Example in{' '}
                  {countryPack.defaultCurrency})
                </span>
                <Badge variant="warning">Real-World Example</Badge>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-amber-200/80 bg-white p-3">
                  <div className="font-bold text-slate-900">
                    Group 1: Individual Founders (Self-Serve)
                  </div>
                  <ul className="mt-1.5 space-y-1 text-slate-700">
                    <li>
                      • <strong>Price:</strong> {countryPack.defaultCurrency} 29
                      per year/pass
                    </li>
                    <li>
                      • <strong>Year 1–2 Customer Goal:</strong> 400 founders ={' '}
                      <strong>
                        {formatPlanCurrency(11600, countryPack.defaultCurrency)}
                        /yr
                      </strong>
                    </li>
                    <li>
                      • <strong>Reachable Customers in Markets:</strong> 25,000
                      founders ={' '}
                      <strong>
                        {formatPlanCurrency(
                          725000,
                          countryPack.defaultCurrency
                        )}
                        /yr
                      </strong>
                    </li>
                  </ul>
                </div>
                <div className="rounded-lg border border-amber-200/80 bg-white p-3">
                  <div className="font-bold text-slate-900">
                    Group 2: Universities &amp; Accelerators (B2B / Cohort)
                  </div>
                  <ul className="mt-1.5 space-y-1 text-slate-700">
                    <li>
                      • <strong>Price:</strong> {countryPack.defaultCurrency}{' '}
                      2,500 per annual cohort licence
                    </li>
                    <li>
                      • <strong>Year 1–2 Customer Goal:</strong> 10 programmes ={' '}
                      <strong>
                        {formatPlanCurrency(25000, countryPack.defaultCurrency)}
                        /yr
                      </strong>
                    </li>
                    <li>
                      • <strong>Reachable Customers in Markets:</strong> 200
                      programmes ={' '}
                      <strong>
                        {formatPlanCurrency(
                          500000,
                          countryPack.defaultCurrency
                        )}
                        /yr
                      </strong>
                    </li>
                  </ul>
                </div>
              </div>
              <p className="mt-2.5 text-[11px] text-amber-900">
                Combined Year 1–2 Revenue Goal:{' '}
                <strong>
                  {formatPlanCurrency(36600, countryPack.defaultCurrency)}/yr
                </strong>{' '}
                • Combined Reachable Market:{' '}
                <strong>
                  {formatPlanCurrency(1225000, countryPack.defaultCurrency)}/yr
                </strong>
                . Click{' '}
                <button
                  type="button"
                  onClick={handleUseIndustryBenchmark}
                  className="font-bold underline hover:text-amber-950"
                >
                  Use Industry Benchmark
                </button>{' '}
                or{' '}
                <button
                  type="button"
                  onClick={handleRunAiMarketSizing}
                  className="font-bold underline hover:text-amber-950"
                >
                  Estimate Customer Counts with AI
                </button>{' '}
                if you want a starting point!
              </p>
            </div>
          )}

          {/* Layer 2: "I'm Stuck" Breakdown Helper */}
          {showStep3ImStuck && (
            <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-4 text-xs text-slate-900">
              <div className="mb-2 flex items-center justify-between">
                <div className="font-bold text-amber-950">
                  🧭 Not sure how many customers exist in{' '}
                  {targetMarkets.join(', ')}? No problem!
                </div>
                <button
                  type="button"
                  onClick={() => setShowStep3ImStuck(false)}
                  className="text-amber-900 underline"
                >
                  Close
                </button>
              </div>
              <p className="mb-3 text-slate-700">
                You don&apos;t need an expensive research report. Pick either
                option below so you never lose momentum:
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={isVaultReadonly || isEstimatingStep3Ai}
                  onClick={handleRunAiMarketSizing}
                  className="bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Let AI Estimate Customer Counts for {plan.title}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isVaultReadonly}
                  onClick={handleUseIndustryBenchmark}
                  className="border-emerald-300 bg-white text-emerald-900 hover:bg-emerald-50"
                >
                  <BarChart3 className="h-3.5 w-3.5 text-emerald-600" />
                  Load Typical Industry Benchmark
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isVaultReadonly}
                  onClick={() => {
                    onParkQuestion(
                      `Module B Step 3: Check official customer counts in [${targetMarkets.join(', ')}] to verify our ${countryPack.defaultCurrency} reachable market.`
                    );
                    setShowStep3ImStuck(false);
                    setSaveBanner(
                      '📌 Parked market count verification in your Open Questions Parking Lot!'
                    );
                  }}
                >
                  <BookmarkPlus className="h-3.5 w-3.5 text-amber-600" />
                  Park in Open Questions
                </Button>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* 1. CUSTOMER GROUP BOTTOM-UP CALCULATOR CARDS (1 OR MORE GROUPS) */}
          {/* =============================================================== */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  1. Your Customer Groups &amp; Bottom-Up Calculator (
                  {countryPack.defaultCurrency})
                </h3>
                <p className="text-xs text-slate-600">
                  Enter your realistic price and customer numbers below. Selling
                  to both individuals and organisations (like universities or
                  accelerators)? Add a second customer group and we&apos;ll add
                  them together automatically.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isVaultReadonly || marketSegments.length >= 4}
                onClick={handleAddMarketSegment}
                className="border-indigo-200 bg-indigo-50/70 text-indigo-900 hover:bg-indigo-100"
              >
                <Plus className="h-3.5 w-3.5 text-indigo-600" />
                Add Customer Group (e.g., Universities / B2B)
              </Button>
            </div>

            <div className="space-y-4">
              {computedSegments.map((seg, index) => (
                <div
                  key={seg.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 shadow-2xs"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-indigo-950 text-white">
                        Customer Group #{index + 1}
                      </Badge>
                      <span className="text-xs font-semibold text-slate-700">
                        {index === 0
                          ? 'Primary Customer Group'
                          : 'Additional Customer Group (e.g., Institutional / B2B / Partner)'}
                      </span>
                    </div>
                    {marketSegments.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isVaultReadonly}
                        onClick={() => handleRemoveMarketSegment(seg.id)}
                        className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove Group
                      </Button>
                    )}
                  </div>

                  {/* Group Name + Billing Cadence Row */}
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                    <div className="md:col-span-7">
                      <label className="mb-1 block text-xs font-semibold text-slate-800">
                        Who is in Customer Group #{index + 1}?
                      </label>
                      <input
                        type="text"
                        disabled={isVaultReadonly}
                        value={seg.segmentName}
                        onChange={(e) =>
                          handleUpdateMarketSegment(
                            seg.id,
                            'segmentName',
                            e.target.value
                          )
                        }
                        placeholder={
                          index === 0
                            ? 'e.g., Individual Founders & Early-Stage Creators'
                            : 'e.g., Universities, Accelerators & Local Enterprise Programmes'
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:outline-hidden"
                      />
                    </div>

                    <div className="md:col-span-5">
                      <label className="mb-1 block text-xs font-semibold text-slate-800">
                        How does this group pay you?
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          disabled={isVaultReadonly}
                          onClick={() =>
                            handleUpdateMarketSegment(
                              seg.id,
                              'billingCadence',
                              'MONTHLY_SUBSCRIPTION'
                            )
                          }
                          className={`rounded-lg border px-2 py-2 text-[11px] font-semibold transition-all ${
                            seg.billingCadence === 'MONTHLY_SUBSCRIPTION'
                              ? 'border-indigo-600 bg-indigo-600 text-white'
                              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          Monthly (×12)
                        </button>
                        <button
                          type="button"
                          disabled={isVaultReadonly}
                          onClick={() =>
                            handleUpdateMarketSegment(
                              seg.id,
                              'billingCadence',
                              'YEARLY_OR_ONE_OFF'
                            )
                          }
                          className={`rounded-lg border px-2 py-2 text-[11px] font-semibold transition-all ${
                            seg.billingCadence === 'YEARLY_OR_ONE_OFF'
                              ? 'border-indigo-600 bg-indigo-600 text-white'
                              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          Annual / One-Off
                        </button>
                        <button
                          type="button"
                          disabled={isVaultReadonly}
                          onClick={() =>
                            handleUpdateMarketSegment(
                              seg.id,
                              'billingCadence',
                              'OTHER'
                            )
                          }
                          className={`rounded-lg border px-2 py-2 text-[11px] font-semibold transition-all ${
                            seg.billingCadence === 'OTHER'
                              ? 'border-indigo-600 bg-indigo-600 text-white'
                              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          Other / Custom
                        </button>
                      </div>
                      {seg.billingCadence === 'OTHER' && (
                        <input
                          type="text"
                          disabled={isVaultReadonly}
                          value={seg.otherBillingCadenceText ?? ''}
                          onChange={(e) =>
                            handleUpdateMarketSegment(
                              seg.id,
                              'otherBillingCadenceText',
                              e.target.value
                            )
                          }
                          placeholder="Describe pricing model (e.g., per-transaction, commission, usage-based)..."
                          className="mt-1.5 w-full rounded-lg border border-indigo-200 bg-indigo-50/40 px-2.5 py-1.5 text-[11px] text-slate-900 focus:border-indigo-600 focus:outline-hidden"
                        />
                      )}
                    </div>
                  </div>

                  {/* 3 Plain-English Number Inputs */}
                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                    {/* Box A: Price */}
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <label className="block text-xs font-semibold text-slate-900">
                        A. Typical Price ({countryPack.defaultCurrency}){' '}
                        {seg.billingCadence === 'MONTHLY_SUBSCRIPTION'
                          ? 'per Month'
                          : 'per Year'}
                      </label>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        What does 1 customer in this group typically pay?
                      </p>
                      <div className="relative mt-2">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-bold text-slate-500">
                          {countryPack.defaultCurrency}
                        </span>
                        <input
                          type="text"
                          inputMode="decimal"
                          disabled={isVaultReadonly}
                          value={seg.pricePerCustomerInput}
                          onChange={(e) =>
                            handleUpdateMarketSegment(
                              seg.id,
                              'pricePerCustomerInput',
                              e.target.value
                            )
                          }
                          placeholder={index === 0 ? 'e.g., 29' : 'e.g., 2500'}
                          className="w-full rounded-lg border border-slate-300 bg-white py-2 pr-3 pl-12 text-sm font-semibold text-slate-900 focus:border-indigo-600 focus:outline-hidden"
                        />
                      </div>
                      {seg.annualRevenuePerCustomer > 0 && (
                        <div className="mt-1.5 text-[11px] font-medium text-indigo-700">
                          ={' '}
                          <strong>
                            {formatPlanCurrency(
                              seg.annualRevenuePerCustomer,
                              countryPack.defaultCurrency
                            )}
                          </strong>{' '}
                          per customer / year
                        </div>
                      )}
                    </div>

                    {/* Box B: Year 1–2 Realistic Customer Goal */}
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <label className="block text-xs font-semibold text-slate-900">
                        B. Your Year 1–2 Customer Goal
                      </label>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        How many paying customers in this group can you
                        realistically win in Year 1–2?
                      </p>
                      <input
                        type="text"
                        inputMode="numeric"
                        disabled={isVaultReadonly}
                        value={seg.year1To2CustomerGoalInput}
                        onChange={(e) =>
                          handleUpdateMarketSegment(
                            seg.id,
                            'year1To2CustomerGoalInput',
                            e.target.value
                          )
                        }
                        placeholder={index === 0 ? 'e.g., 300' : 'e.g., 10'}
                        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-indigo-600 focus:outline-hidden"
                      />
                      {seg.year1To2AnnualRevenue > 0 && (
                        <div className="mt-1.5 text-[11px] font-medium text-emerald-700">
                          Year 1–2 Revenue:{' '}
                          <strong>
                            {formatPlanCurrency(
                              seg.year1To2AnnualRevenue,
                              countryPack.defaultCurrency
                            )}
                            /yr
                          </strong>
                        </div>
                      )}
                    </div>

                    {/* Box C: Total Reachable Customers in Selected Countries */}
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <label className="block text-xs font-semibold text-slate-900">
                        C. Total Reachable Customers in{' '}
                        {targetMarkets.join(', ')}
                      </label>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        Roughly how many potential customers like this exist in{' '}
                        {targetMarkets.join(', ')}?
                      </p>
                      <input
                        type="text"
                        inputMode="numeric"
                        disabled={isVaultReadonly}
                        value={seg.reachableCustomersInTargetMarketsInput}
                        onChange={(e) =>
                          handleUpdateMarketSegment(
                            seg.id,
                            'reachableCustomersInTargetMarketsInput',
                            e.target.value
                          )
                        }
                        placeholder={index === 0 ? 'e.g., 25000' : 'e.g., 200'}
                        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-indigo-600 focus:outline-hidden"
                      />
                      {seg.reachableMarketAnnualValue > 0 && (
                        <div className="mt-1.5 text-[11px] font-medium text-indigo-700">
                          Reachable Group Market:{' '}
                          <strong>
                            {formatPlanCurrency(
                              seg.reachableMarketAnnualValue,
                              countryPack.defaultCurrency
                            )}
                            /yr
                          </strong>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* =============================================================== */}
          {/* 2. WIDER LONG-TERM MARKET SCALE & ASSUMPTION NOTES              */}
          {/* =============================================================== */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <h3 className="text-sm font-bold text-slate-900">
              2. Wider Long-Term Expansion Scale &amp; Where Your Numbers Come
              From
            </h3>
            <p className="mt-0.5 text-xs text-slate-600">
              If you later expand into new regions or adjacent customer types
              over the next 3–5 years, how much larger is the wider long-term
              market compared to your current reachable markets (
              {targetMarkets.join(', ')})?
            </p>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {WIDER_MARKET_SCALE_OPTIONS.map((opt) => {
                const selected = widerMarketMultiplier === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={isVaultReadonly}
                    onClick={() => setWiderMarketMultiplier(opt.value)}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      selected
                        ? 'border-indigo-600 bg-indigo-50/90 ring-2 ring-indigo-600/15'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        {opt.label}
                      </span>
                      {selected && (
                        <Check className="h-3.5 w-3.5 text-indigo-600" />
                      )}
                    </div>
                    <p className="mt-1 text-[11px] leading-snug text-slate-600">
                      {opt.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {widerMarketMultiplier === 'OTHER' && (
              <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50/40 p-3">
                <label className="mb-1 block text-xs font-semibold text-indigo-950">
                  Describe your custom long-term expansion scale or horizon:
                </label>
                <input
                  type="text"
                  disabled={isVaultReadonly}
                  value={otherWiderMarketScaleText}
                  onChange={(e) => setOtherWiderMarketScaleText(e.target.value)}
                  placeholder="e.g., Staying hyper-focused on our domestic niche for 3 years, or expanding 15× via licensing..."
                  className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:outline-hidden"
                />
              </div>
            )}

            <div className="mt-4">
              <label
                htmlFor="market-sizing-assumptions-input"
                className="mb-1 block text-xs font-semibold text-slate-800"
              >
                Quick note on how you estimated these customer numbers (great
                for grant &amp; investor questions)
              </label>
              <textarea
                id="market-sizing-assumptions-input"
                rows={2}
                disabled={isVaultReadonly}
                value={sourceAndAssumptionNotes}
                onChange={(e) => setSourceAndAssumptionNotes(e.target.value)}
                placeholder="Write a quick note on where your customer counts come from (or click 'Estimate Customer Counts with AI' above to draft this)..."
                className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs leading-relaxed text-slate-900 shadow-2xs focus:border-indigo-600 focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 disabled:bg-slate-100"
              />
            </div>
          </div>

          {/* =============================================================== */}
          {/* 3. LIVE 3-BOX VISUAL SUMMARY (PLAIN ENGLISH + GRANT LABELS)     */}
          {/* =============================================================== */}
          <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 p-5 text-white shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                  Live Bottom-Up Market Summary ({countryPack.defaultCurrency})
                </div>
                <h4 className="mt-0.5 text-base font-bold">
                  Your 3 Market Sizing Numbers — Ready for Grant &amp; Investor
                  Applications
                </h4>
              </div>
              {computedSegments.length > 1 && (
                <Badge className="bg-emerald-500/20 text-emerald-200 border-emerald-400/30">
                  Combined Across {computedSegments.length} Customer Groups
                </Badge>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              {/* Box 1: Year 1-2 Goal (SOM) */}
              <div className="rounded-xl border border-emerald-400/40 bg-emerald-950/40 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-300">
                    1. Your Year 1–2 Revenue Goal
                  </span>
                  <span
                    className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-200"
                    title="Serviceable Obtainable Market: the realistic slice of customers you plan to win in Year 1–2."
                  >
                    Often called SOM
                  </span>
                </div>
                <div className="mt-2 text-2xl font-extrabold tracking-tight text-white">
                  {totalYear1To2RevenueSom > 0
                    ? `${formatPlanCurrency(totalYear1To2RevenueSom, countryPack.defaultCurrency)}/yr`
                    : 'Enter numbers above'}
                </div>
                <p className="mt-1 text-[11px] text-emerald-100/80">
                  {totalYear1To2Customers > 0
                    ? `Based on winning ${totalYear1To2Customers.toLocaleString()} paying customers across ${computedSegments.length === 1 ? 'your primary customer group' : `${computedSegments.length} customer groups`}.`
                    : 'Your realistic Year 1–2 customer target × annual price.'}
                </p>
              </div>

              {/* Box 2: Reachable Market in Selected Countries (SAM) */}
              <div className="rounded-xl border border-indigo-400/40 bg-indigo-900/40 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-200">
                    2. Reachable Market ({targetMarkets.join(', ')})
                  </span>
                  <span
                    className="rounded-md bg-indigo-500/30 px-2 py-0.5 text-[10px] font-semibold text-indigo-100"
                    title="Serviceable Available Market: the total annual value of all reachable target customers in your selected selling countries."
                  >
                    Often called SAM
                  </span>
                </div>
                <div className="mt-2 text-2xl font-extrabold tracking-tight text-white">
                  {totalReachableMarketSam > 0
                    ? `${formatPlanCurrency(totalReachableMarketSam, countryPack.defaultCurrency)}/yr`
                    : 'Enter numbers above'}
                </div>
                <p className="mt-1 text-[11px] text-indigo-100/80">
                  {totalReachableCustomers > 0
                    ? `${totalReachableCustomers.toLocaleString()} reachable customers in ${targetMarkets.join(', ')}.`
                    : `Total annual value if every target customer in ${targetMarkets.join(', ')} bought from you.`}
                </p>
              </div>

              {/* Box 3: Wider Long-Term Market (TAM) */}
              <div className="rounded-xl border border-violet-400/40 bg-violet-950/40 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-violet-200">
                    3. Wider Long-Term Market
                  </span>
                  <span
                    className="rounded-md bg-violet-500/30 px-2 py-0.5 text-[10px] font-semibold text-violet-100"
                    title="Total Addressable Market: the wider 3–5 year opportunity as you expand into new regions and adjacent customer segments."
                  >
                    Often called TAM
                  </span>
                </div>
                <div className="mt-2 text-2xl font-extrabold tracking-tight text-white">
                  {totalWiderMarketTam > 0
                    ? `${formatPlanCurrency(totalWiderMarketTam, countryPack.defaultCurrency)}/yr`
                    : 'Enter numbers above'}
                </div>
                <p className="mt-1 text-[11px] text-violet-100/80">
                  {selectedScaleMultiplierObj.label} of your reachable market as
                  you expand into new regions &amp; segments.
                </p>
              </div>
            </div>

            {/* Grant & Investor Ready Paragraph */}
            {grantReadySummaryParagraph && (
              <div className="mt-4 rounded-xl border border-indigo-400/30 bg-white/10 p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-indigo-200">
                    📋 Ready-to-Use Paragraph for Grant Forms &amp; Pitch Decks:
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(grantReadySummaryParagraph);
                      setCopiedGrantSummary(true);
                      setTimeout(() => setCopiedGrantSummary(false), 2500);
                    }}
                    className="border-indigo-300/40 bg-white/10 text-white hover:bg-white/20"
                  >
                    {copiedGrantSummary ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-300" />
                        Copied!
                      </>
                    ) : (
                      'Copy Paragraph'
                    )}
                  </Button>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-indigo-50">
                  &ldquo;{grantReadySummaryParagraph}&rdquo;
                </p>
              </div>
            )}
          </div>

          {/* Step 3 Action Bar: Park Question + Save Step 3 */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isVaultReadonly}
              onClick={() => {
                onParkQuestion(
                  `Module B Step 3: Double-check official customer counts in [${targetMarkets.join(', ')}] (e.g., CSO / ONS / university & business directories) to verify our ${countryPack.defaultCurrency} reachable market numbers.`
                );
                setSaveBanner(
                  '📌 Added market sizing source check to your Open Questions Parking Lot!'
                );
              }}
            >
              <BookmarkPlus className="h-3.5 w-3.5 text-amber-600" />
              Unsure on exact customer counts? Park in Open Questions
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={isVaultReadonly || isSavingStep3}
              onClick={handleSaveStep3}
              className="bg-indigo-600 text-white hover:bg-indigo-700"
            >
              {isSavingStep3 ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Step 3...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Step 3 (Market Sizing in {countryPack.defaultCurrency})
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* =================================================================== */}
      {/* STEP 4 OF 5: COMPETITIVE EDGE & HOW YOU STAND OUT                   */}
      {/* =================================================================== */}
      <Card
        id="module-b-step-4"
        className="scroll-mt-6 border-indigo-200 shadow-sm"
      >
        <CardHeader className="border-b border-slate-100 bg-slate-50/70 pb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="default">Step 4 of 5</Badge>
                <span className="text-xs font-semibold text-indigo-700">
                  Why Customers Switch &amp; What Stops Copycats
                </span>
              </div>
              <CardTitle className="mt-1.5 text-lg">
                Step 4: Competitive Edge &amp; How You Stand Out
              </CardTitle>
              <CardDescription className="mt-0.5 text-xs">
                Show side-by-side how you win against current customer habits
                and competitors, how you make switching effortless, and what
                protects your business as you grow.
              </CardDescription>
            </div>

            {/* Layer 1 & 2 Support Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowStep4WhyCard((v) => !v)}
              >
                <HelpCircle className="h-3.5 w-3.5 text-indigo-600" />
                {showStep4WhyCard
                  ? 'Hide Coaching'
                  : 'Why Are We Asking This?'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowStep4Examples((v) => !v)}
              >
                <Lightbulb className="h-3.5 w-3.5 text-amber-600" />
                {showStep4Examples
                  ? 'Hide Examples'
                  : `Show ${plan.industryCategory} Example`}
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isVaultReadonly || isGeneratingStep4Ai}
                onClick={handleRunAiCompetitiveEdge}
                className="bg-indigo-600 text-white hover:bg-indigo-700"
              >
                {isGeneratingStep4Ai ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Drafting Edge...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-3.5 w-3.5" />
                    Auto-Draft Competitive Edge with AI
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Layer 1: "Why Are We Asking This?" Micro-Coaching Card */}
          {showStep4WhyCard && (
            <div className="mt-3 rounded-xl border border-indigo-200/80 bg-indigo-50/70 p-3.5 text-xs text-indigo-950">
              <div className="font-bold text-indigo-900">
                💡 Why Are We Asking This? (Co-Founder Coaching)
              </div>
              <p className="mt-1 leading-relaxed text-indigo-900/90">
                Being <em>&ldquo;slightly better&rdquo;</em> isn&apos;t enough to
                get busy customers to abandon a habit they already know. First,
                you need a <strong>low-risk way for them to switch</strong>.
                Second, investors and grant boards always ask:{' '}
                <em>
                  &ldquo;What stops an existing software company or competitor
                  from copying this next month?&rdquo;
                </em>{' '}
                This step gives you a clear, visual answer to both questions.
              </p>
            </div>
          )}

          {/* Layer 1: Industry-Tailored Weak vs Strong Example */}
          {showStep4Examples && (
            <div className="mt-3 grid grid-cols-1 gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs md:grid-cols-2">
              <div className="rounded-lg border border-rose-200 bg-white p-3">
                <div className="font-bold text-rose-700">
                  ❌ Vague Claim (What Grant Boards &amp; Buyers Doubt)
                </div>
                <p className="mt-1 text-slate-600">
                  &ldquo;{competitiveEdgeExamples.weakExample}&rdquo;
                </p>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-white p-3">
                <div className="font-bold text-emerald-800">
                  ✅ Clear Competitive Edge ({plan.industryCategory})
                </div>
                <p className="mt-1 text-slate-700">
                  &ldquo;{competitiveEdgeExamples.strongExample}&rdquo;
                </p>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* =============================================================== */}
          {/* 4.1 SIDE-BY-SIDE COMPARISON SCORER                              */}
          {/* =============================================================== */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  1. Side-by-Side Comparison: How Do You Stack Up?
                </h3>
                <p className="text-xs text-slate-500">
                  Click <strong>Low</strong>, <strong>Medium</strong>, or{' '}
                  <strong>High</strong> on each column to compare your startup
                  against current customer habits and competitors.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {competitors.some((c) => c.name.trim().length > 0) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isVaultReadonly}
                    onClick={handleSyncCompetitorsFromStep2}
                  >
                    <Copy className="h-3.5 w-3.5 text-indigo-600" />
                    Sync Competitors from Step 2
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isVaultReadonly}
                  onClick={handleAddComparisonRow}
                >
                  <Plus className="h-3.5 w-3.5 text-indigo-600" />
                  Add Competitor Row
                </Button>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-2.5 pr-3">Option / Competitor</th>
                    <th className="px-2 py-2.5 text-center">
                      💷 Value for Money
                    </th>
                    <th className="px-2 py-2.5 text-center">
                      ⚡ Speed / Time Saved
                    </th>
                    <th className="px-2 py-2.5 text-center">
                      🎯 Ease of Use
                    </th>
                    <th className="px-2 py-2.5 text-center">
                      🛡️ Specialist Quality &amp; Trust
                    </th>
                    <th className="w-10 py-2.5 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {comparisonRows.map((row) => {
                    const scoreFields: Array<{
                      key:
                        | 'priceValueScore'
                        | 'speedTimeSavedScore'
                        | 'easeOfUseScore'
                        | 'specialistQualityScore';
                      val: ComparisonScoreLevel;
                    }> = [
                      { key: 'priceValueScore', val: row.priceValueScore },
                      {
                        key: 'speedTimeSavedScore',
                        val: row.speedTimeSavedScore,
                      },
                      { key: 'easeOfUseScore', val: row.easeOfUseScore },
                      {
                        key: 'specialistQualityScore',
                        val: row.specialistQualityScore,
                      },
                    ];

                    return (
                      <tr
                        key={row.rowId}
                        className={
                          row.isYourStartup
                            ? 'bg-indigo-50/70 font-semibold'
                            : 'bg-white'
                        }
                      >
                        <td className="py-3 pr-3 pl-2">
                          {row.isYourStartup ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="default">You</Badge>
                              <span className="font-bold text-indigo-950">
                                {plan.title || 'Your Startup'}
                              </span>
                            </div>
                          ) : (
                            <input
                              type="text"
                              disabled={isVaultReadonly}
                              value={row.label}
                              onChange={(e) =>
                                handleUpdateComparisonLabel(
                                  row.rowId,
                                  e.target.value
                                )
                              }
                              placeholder="e.g., Competitor name or manual habit..."
                              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-600 focus:outline-hidden"
                            />
                          )}
                        </td>

                        {scoreFields.map((f) => (
                          <td key={f.key} className="px-2 py-3 text-center">
                            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
                              {(['LOW', 'MEDIUM', 'HIGH'] as const).map(
                                (lvl) => {
                                  const active = f.val === lvl;
                                  const activeStyle =
                                    lvl === 'HIGH'
                                      ? 'bg-emerald-600 text-white shadow-2xs'
                                      : lvl === 'MEDIUM'
                                        ? 'bg-amber-500 text-white shadow-2xs'
                                        : 'bg-slate-600 text-white shadow-2xs';
                                  return (
                                    <button
                                      key={lvl}
                                      type="button"
                                      disabled={isVaultReadonly}
                                      onClick={() =>
                                        handleUpdateComparisonScore(
                                          row.rowId,
                                          f.key,
                                          lvl
                                        )
                                      }
                                      className={`rounded-md px-2 py-1 text-[10px] font-bold transition-all ${
                                        active
                                          ? activeStyle
                                          : 'text-slate-600 hover:text-slate-900'
                                      }`}
                                    >
                                      {lvl === 'LOW'
                                        ? 'Low'
                                        : lvl === 'MEDIUM'
                                          ? 'Med'
                                          : 'High'}
                                    </button>
                                  );
                                }
                              )}
                            </div>
                          </td>
                        ))}

                        <td className="py-3 pr-2 text-right">
                          {!row.isYourStartup && (
                            <button
                              type="button"
                              disabled={isVaultReadonly}
                              onClick={() =>
                                handleRemoveComparisonRow(row.rowId)
                              }
                              title="Remove row"
                              className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* =============================================================== */}
          {/* 4.2 MAKING IT EFFORTLESS TO SWITCH (SWITCHING FRICTION)         */}
          {/* =============================================================== */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-900">
              2. How Do You Make It Effortless &amp; Low-Risk for Customers to
              Switch to You?
              <span className="ml-1.5 text-xs font-normal text-slate-500">
                (Select all that apply)
              </span>
            </label>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {SWITCHING_FRICTION_REDUCER_OPTIONS.map((opt) => {
                const isSelected = switchingFrictionReducers.includes(
                  opt.value
                );
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={isVaultReadonly}
                    onClick={() => toggleSwitchingFrictionReducer(opt.value)}
                    className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-600/15'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        {opt.label}
                      </span>
                      {isSelected && (
                        <Check className="h-3.5 w-3.5 text-indigo-600" />
                      )}
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                      {opt.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {switchingFrictionReducers.includes('OTHER') && (
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-3">
                <label className="mb-1 block text-xs font-semibold text-indigo-950">
                  Describe your other way of lowering switching friction:
                </label>
                <input
                  type="text"
                  disabled={isVaultReadonly}
                  value={otherSwitchingFrictionText}
                  onChange={(e) =>
                    setOtherSwitchingFrictionText(e.target.value)
                  }
                  placeholder="e.g., Free hardware loaner kit, buyout of existing competitor contract, or co-funded pilot..."
                  className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:outline-hidden"
                />
              </div>
            )}

            <div className="pt-1">
              <label
                htmlFor="switching-friction-notes-input"
                className="mb-1 block text-xs font-semibold text-slate-800"
              >
                What is the easy &ldquo;First Step&rdquo; a customer takes when
                trying you?
              </label>
              <input
                id="switching-friction-notes-input"
                type="text"
                disabled={isVaultReadonly}
                value={switchingFrictionPlanNotes}
                onChange={(e) => setSwitchingFrictionPlanNotes(e.target.value)}
                placeholder="e.g., Customers can complete Module A for free in 10 minutes with zero credit card required..."
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 shadow-2xs focus:border-indigo-600 focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 disabled:bg-slate-100"
              />
            </div>
          </div>

          {/* =============================================================== */}
          {/* 4.3 YOUR UNFAIR ADVANTAGE / WHAT STOPS COPYCATS                 */}
          {/* =============================================================== */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-900">
              3. Your Unfair Advantage: What Stops Competitors From Easily
              Copying You?
              <span className="ml-1.5 text-xs font-normal text-slate-500">
                (Select all that apply)
              </span>
            </label>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {UNFAIR_ADVANTAGE_MOAT_OPTIONS.map((opt) => {
                const isSelected = unfairAdvantages.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={isVaultReadonly}
                    onClick={() => toggleUnfairAdvantage(opt.value)}
                    className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-600/15'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        {opt.label}
                      </span>
                      {isSelected && (
                        <Check className="h-3.5 w-3.5 text-emerald-700" />
                      )}
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                      {opt.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {unfairAdvantages.includes('OTHER') && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3">
                <label className="mb-1 block text-xs font-semibold text-emerald-950">
                  Describe your other unfair advantage or defensive moat:
                </label>
                <input
                  type="text"
                  disabled={isVaultReadonly}
                  value={otherUnfairAdvantageText}
                  onChange={(e) => setOtherUnfairAdvantageText(e.target.value)}
                  placeholder="e.g., Exclusive supply agreement, proprietary dataset, or regulatory certification..."
                  className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-hidden"
                />
              </div>
            )}
          </div>

          {/* =============================================================== */}
          {/* 4.4 TWO-SENTENCE COMPETITIVE EDGE SUMMARY (FOR BUSINESS PLAN)   */}
          {/* =============================================================== */}
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <label
                  htmlFor="competitive-edge-summary-input"
                  className="block text-sm font-bold text-slate-900"
                >
                  4. Your 2-Sentence Competitive Edge Summary (For Grant &amp;
                  Investor Applications)
                </label>
                <p className="text-xs text-slate-600">
                  Combine why customers switch to you + why competitors struggle
                  to copy you.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isVaultReadonly}
                  onClick={() => setShowStep4ImStuck((v) => !v)}
                >
                  <Wand2 className="h-3.5 w-3.5 text-indigo-600" />
                  {showStep4ImStuck ? 'Close Helper' : "I'm Stuck — Help Me"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isVaultReadonly}
                  onClick={handleDraftSummaryFromSelections}
                >
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                  Draft from Selected Cards
                </Button>
                {competitiveEdgeSummary.trim() && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(competitiveEdgeSummary);
                      setCopiedEdgeSummary(true);
                      setTimeout(() => setCopiedEdgeSummary(false), 2500);
                    }}
                  >
                    {copiedEdgeSummary ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy Summary
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {showStep4ImStuck && (
              <div className="mt-3 rounded-xl border border-indigo-200 bg-white p-4 space-y-3">
                <div className="text-xs font-bold text-indigo-950">
                  ✨ Quick 2-Question Edge Builder
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                      1. What is the easiest first step a customer can try with
                      you?
                    </label>
                    <input
                      type="text"
                      value={stuckStep4EasyFirstStep}
                      onChange={(e) =>
                        setStuckStep4EasyFirstStep(e.target.value)
                      }
                      placeholder="e.g., use our free Module A canvas in 10 minutes"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                      2. What do you have (experience, local rules, partners)
                      that a generic competitor lacks?
                    </label>
                    <input
                      type="text"
                      value={stuckStep4WhyHardToCopy}
                      onChange={(e) =>
                        setStuckStep4WhyHardToCopy(e.target.value)
                      }
                      placeholder="e.g., built-in Irish/UK grant rules and university cohort partnerships"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleDraftStep4FromStuckHelper}
                  >
                    <Check className="h-3.5 w-3.5" />
                    Build My 2-Sentence Summary
                  </Button>
                </div>
              </div>
            )}

            <textarea
              id="competitive-edge-summary-input"
              rows={3}
              disabled={isVaultReadonly}
              value={competitiveEdgeSummary}
              onChange={(e) => setCompetitiveEdgeSummary(e.target.value)}
              placeholder="Write 2 clear sentences summarizing your competitive edge (or click 'Draft from Selected Cards' or 'Auto-Draft Competitive Edge with AI' above)..."
              className="mt-3 w-full rounded-xl border border-slate-300 bg-white p-3 text-xs leading-relaxed text-slate-900 shadow-2xs focus:border-indigo-600 focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 disabled:bg-slate-100"
            />
          </div>

          {/* Step 4 Action Bar: Park Question + Save Step 4 */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isVaultReadonly}
              onClick={() => {
                onParkQuestion(
                  `Module B Step 4: Test our "First Step" switching offer with 5 target customers in [${targetMarkets.join(', ')}] to confirm they find it effortless to switch from their current habit.`
                );
                setSaveBanner(
                  '📌 Added switching-friction test to your Open Questions Parking Lot!'
                );
              }}
            >
              <BookmarkPlus className="h-3.5 w-3.5 text-amber-600" />
              Unsure what stops copycats? Park in Open Questions
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={isVaultReadonly || isSavingStep4}
              onClick={handleSaveStep4}
              className="bg-indigo-600 text-white hover:bg-indigo-700"
            >
              {isSavingStep4 ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Step 4...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Step 4 (Competitive Edge &amp; Stand Out)
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* =================================================================== */}
      {/* STEP 5 OF 5: CONSTRUCTIVE "THINGS TO CONSIDER" BLIND-SPOT CARD      */}
      {/* (Matches Module A Step 6 Design 100%)                               */}
      {/* =================================================================== */}
      <div
        id="module-b-step-5"
        className="scroll-mt-6 rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/90 via-white to-violet-50/80 p-5 shadow-xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Step 5: Constructive &ldquo;Things to Consider&rdquo;
                (Blind-Spot Engine)
              </h3>
              <p className="text-xs text-slate-500">
                Updates live as you fill in Steps 1–4 — combining your target
                customer, competitors, {countryPack.defaultCurrency} market
                sizing, and competitive edge.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-900">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              Live-Synced with Steps 1–4
            </span>
            <Badge variant="default">Co-Founder Perspective</Badge>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
          {liveModuleBThingsToConsider.map((item, idx) => (
            <div
              key={item.id || idx}
              className={`flex flex-col justify-between rounded-xl border p-4 shadow-2xs transition-all ${
                item.severity === 'WARNING'
                  ? 'border-amber-300 bg-amber-50/40'
                  : 'border-slate-200/90 bg-white'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      item.severity === 'WARNING'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-indigo-50 text-indigo-800'
                    }`}
                  >
                    {item.severity === 'WARNING'
                      ? '⚠️ Priority Blind Spot'
                      : '💡 Co-Founder Check'}
                  </span>
                </div>
                <div className="mt-2 text-xs font-bold text-slate-900">
                  {item.title}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                  {item.explanation}
                </p>
                {item.suggestedAction && (
                  <div className="mt-2.5 rounded-lg bg-slate-50 p-2 text-[11px] text-indigo-900 ring-1 ring-slate-200/70">
                    <strong>Action Step:</strong> {item.suggestedAction}
                  </div>
                )}
              </div>

              <div className="mt-3 flex justify-end border-t border-slate-100 pt-2">
                <button
                  type="button"
                  disabled={isVaultReadonly}
                  onClick={() => {
                    onParkQuestion(
                      `Module B Blind-Spot Action: ${item.suggestedAction}`
                    );
                    setSaveBanner(
                      `📌 Parked "${item.title}" in your Open Questions Parking Lot!`
                    );
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                >
                  <BookmarkPlus className="h-3 w-3" />
                  Park in Open Questions
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Step 5 Bottom Save Bar */}
        {!isVaultReadonly && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-white/90 px-4 py-3">
            <div className="text-xs text-slate-600">
              ✨ Change any option or add notes in Steps 1–4 above and watch
              these 6 cards adapt immediately.
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                disabled={isSavingStep5}
                onClick={handleSaveStep5AndComplete}
                className="bg-indigo-600 text-white hover:bg-indigo-700"
              >
                {isSavingStep5 ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving Module B...
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    Save All Module B Progress
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* MODULE B SUMMARY DOCUMENT: MARKET & CUSTOMER VALIDATION BRIEF       */}
      {/* (Matches Module A Step 7 Document Preview & Download Card 100%)     */}
      {/* =================================================================== */}
      <Card className="border-indigo-200 bg-gradient-to-br from-white via-indigo-50/30 to-violet-50/40 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default">
                  Module B Summary Document
                </Badge>
                <Badge
                  variant={
                    completedModuleBReadinessCount === 5
                      ? 'success'
                      : 'secondary'
                  }
                  className="text-[10px]"
                >
                  {completedModuleBReadinessCount}/5 Sections Ready
                </Badge>
              </div>
              <CardTitle className="mt-2 flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-indigo-600" />
                Your Market &amp; Customer Validation Brief
              </CardTitle>
              <CardDescription className="mt-1">
                Everything you captured across Steps 1–5 is compiled below into
                a clean executive summary document you can download, print to
                PDF, or share with a co-founder, mentor, or grant advisor before
                moving into Module C.
              </CardDescription>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setShowModuleBBriefPreview(!showModuleBBriefPreview)
              }
              className="text-xs"
            >
              <Eye className="h-3.5 w-3.5 text-indigo-600" />
              {showModuleBBriefPreview
                ? 'Hide Live Document Preview'
                : 'Show Live Document Preview'}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* 5-STEP MODULE B READINESS CHECKLIST */}
          <div className="rounded-xl border border-indigo-100 bg-white p-4 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Module B Readiness Checklist (Steps 1–5 Included in Your Brief)
              </div>
              <span className="text-xs font-semibold text-indigo-700">
                Live-Synced with Your Answers Above
              </span>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {moduleBReadinessSteps.map((step) => (
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

          {/* LIVE EXECUTIVE BRIEF DOCUMENT PREVIEW (Matches Module A 100%) */}
          {showModuleBBriefPreview && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {/* Document Header Banner */}
              <div className="border-b border-slate-200 bg-slate-900 px-6 py-5 text-white">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-300">
                    {whiteLabelEnabled
                      ? 'Market & Customer Validation Brief'
                      : 'Build My Unicorn 2.0 • Market & Customer Validation Brief'}
                  </span>
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-slate-200">
                    {countryPack.countryName} ({countryPack.defaultCurrency}) •{' '}
                    {plan.industryCategory}
                  </span>
                </div>
                <h2 className="mt-1.5 text-lg font-bold text-white">
                  {plan.title}
                </h2>
                <p className="mt-0.5 text-xs text-slate-300">
                  Prepared by {founderName} • Target Markets:{' '}
                  {targetMarkets.join(', ')} • {briefGeneratedDate}
                </p>
              </div>

              {/* Document Body Sections */}
              <div className="divide-y divide-slate-100 p-6 text-xs">
                {/* Section 1: Target Customers & Buying Triggers */}
                <div className="pb-5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                    1. Target Customers &amp; Buying Triggers (Step 1)
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 p-3">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        First Priority Customer Group
                      </div>
                      <p className="mt-1 leading-relaxed text-slate-800">
                        {beachheadSegment.trim() || 'Not yet specified.'}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Customer Model &amp; Selling Geographies
                      </div>
                      <p className="mt-1 font-semibold text-slate-800">
                        {buyerTypes.length > 0
                          ? buyerTypes
                              .map((t) => BUYER_MODEL_LABELS[t] || t)
                              .join(' + ')
                          : BUYER_MODEL_LABELS[buyerType]}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-600">
                        Selling in: {targetMarkets.join(', ')}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Decision-Maker / Budget Sign-Off
                      </div>
                      <p className="mt-1 leading-relaxed text-slate-800">
                        {decisionMakerRole.trim() || 'Not yet specified.'}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Urgent Buying Trigger
                      </div>
                      <p className="mt-1 leading-relaxed text-slate-800">
                        {buyingTriggerNotes.trim() || 'Not yet specified.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 2: Competitors & Current Customer Habits */}
                <div className="py-5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                    2. Competitors &amp; How Customers Deal With This Today
                    (Step 2)
                  </div>
                  <div className="mt-2.5 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200/70">
                      <div className="text-[10px] font-bold uppercase text-slate-400">
                        Frustration With Current Habits
                      </div>
                      <p className="mt-1 leading-relaxed text-slate-800">
                        {workaroundFrustrationNotes.trim() ||
                          'Not yet specified.'}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200/70">
                      <div className="text-[10px] font-bold uppercase text-slate-400">
                        Why Customers Switch to Us
                      </div>
                      <p className="mt-1 leading-relaxed text-slate-800">
                        {whySwitchOneSentence.trim() || 'Not yet specified.'}
                      </p>
                    </div>
                  </div>
                  {competitors.length > 0 && (
                    <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                      {competitors.map((comp) => (
                        <div
                          key={comp.id}
                          className="rounded-xl border border-slate-200 p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-slate-900">
                              {comp.name || 'Alternative'}
                            </span>
                            {comp.typicalPriceText && (
                              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                                {comp.typicalPriceText}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-[11px] text-slate-600">
                            <strong>Strength:</strong>{' '}
                            {comp.whatTheyDoWell || '—'}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-600">
                            <strong>Weakness:</strong>{' '}
                            {comp.whereTheyFallShort || '—'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section 3: Bottom-Up Market Sizing */}
                <div className="py-5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                    3. Bottom-Up Market Sizing ({countryPack.defaultCurrency} —
                    Step 3)
                  </div>
                  <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3">
                      <div className="text-[10px] font-bold uppercase text-indigo-700">
                        1. Year 1–2 Revenue Goal (SOM)
                      </div>
                      <div className="mt-1 text-base font-extrabold text-slate-900">
                        {formatPlanCurrency(
                          totalYear1To2RevenueSom,
                          countryPack.defaultCurrency
                        )}
                        /yr
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="text-[10px] font-bold uppercase text-slate-500">
                        2. Reachable Market (SAM)
                      </div>
                      <div className="mt-1 text-base font-extrabold text-slate-900">
                        {formatPlanCurrency(
                          totalReachableMarketSam,
                          countryPack.defaultCurrency
                        )}
                        /yr
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="text-[10px] font-bold uppercase text-slate-500">
                        3. Wider Long-Term Market (TAM)
                      </div>
                      <div className="mt-1 text-base font-extrabold text-slate-900">
                        {formatPlanCurrency(
                          totalWiderMarketTam,
                          countryPack.defaultCurrency
                        )}
                        /yr
                      </div>
                    </div>
                  </div>
                  {grantReadySummaryParagraph && (
                    <div className="mt-3 rounded-xl bg-slate-50 p-3.5 text-slate-700 ring-1 ring-slate-200/70">
                      <span className="font-semibold text-slate-900">
                        Grant &amp; Investor Summary:{' '}
                      </span>
                      &ldquo;{grantReadySummaryParagraph}&rdquo;
                    </div>
                  )}
                </div>

                {/* Section 4: Competitive Edge & Defensibility */}
                <div className="py-5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                    4. Competitive Edge &amp; How You Stand Out (Step 4)
                  </div>
                  <div className="mt-2.5 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 p-3">
                      <div className="text-[10px] font-bold uppercase text-slate-400">
                        Easy First Step (Lowering Switching Friction)
                      </div>
                      <p className="mt-1 leading-relaxed text-slate-800">
                        {switchingFrictionPlanNotes.trim() ||
                          'Not yet specified.'}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3">
                      <div className="text-[10px] font-bold uppercase text-slate-400">
                        2-Sentence Competitive Edge &amp; Defensibility
                      </div>
                      <p className="mt-1 leading-relaxed text-slate-800">
                        {competitiveEdgeSummary.trim() || 'Not yet specified.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 5: Co-Founder Blind-Spot Takeaways */}
                <div className="pt-5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                    5. Co-Founder Blind-Spot Review &amp; Next Validation Steps
                    (Step 5)
                  </div>
                  <div className="mt-2.5 grid grid-cols-1 gap-2.5 md:grid-cols-2">
                    {liveModuleBThingsToConsider.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="rounded-xl border border-slate-200 bg-slate-50/60 p-3"
                      >
                        <div className="font-bold text-slate-900">
                          {item.title}
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                          {item.suggestedAction || item.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BOTTOM ACTION BAR: DOWNLOAD, PRINT TO PDF, OR COPY BRIEF (Matches Module A 100%) */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-200 bg-white px-4 py-3.5 shadow-2xs">
            <div className="text-xs text-slate-600">
              📥{' '}
              <strong>
                Take your Market &amp; Customer Validation Brief with you:
              </strong>{' '}
              Download a standalone file, print/save as PDF, or copy for your
              notes.
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyModuleBBriefMarkdown}
              >
                {copiedModuleBBrief ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    Copied to Clipboard!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-slate-600" />
                    Copy Summary
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadModuleBBriefHtml}
              >
                <Download className="h-3.5 w-3.5 text-indigo-600" />
                Download Brief (.html)
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handlePrintModuleBBriefPdf}
                className="bg-indigo-600 text-white hover:bg-indigo-700"
              >
                <Printer className="h-3.5 w-3.5" />
                Print / Save as PDF
              </Button>
            </div>
          </div>

          {/* Conversion / Handoff CTA Bar into Module C (Matches Module A Dark Footer Bar 100%) */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-900 px-4 py-3.5 text-white">
            <div className="text-xs">
              <span className="font-semibold text-indigo-300">
                Ready to test {plan.title} with real customers?
              </span>{' '}
              Continue to Module C to generate your unbiased Customer Validation
              Survey link (<code>/v/my-startup</code>), collect real buyer
              feedback, and build your early waitlist.
            </div>
            <Button
              type="button"
              size="sm"
              onClick={async () => {
                if (!isVaultReadonly) {
                  await handleSaveStep5AndComplete();
                }
                onContinueToModuleC();
              }}
              className="bg-indigo-600 text-white hover:bg-indigo-500"
            >
              Continue to Module C: Customer Surveys &amp; Waitlist
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
