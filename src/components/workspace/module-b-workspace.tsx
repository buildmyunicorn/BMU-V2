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
  getGrantsForCountry,
  type SupportedCountryCode,
} from '@/lib/localization';
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
    name: 'Global / Rest of World',
    flag: '🌍',
    regionHint: 'International exporting corridors',
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
];

const COMPETITOR_CATEGORY_OPTIONS: Array<{
  value: CompetitorCategoryType;
  label: string;
}> = [
  { value: 'DIRECT_COMPETITOR', label: 'Direct Competitor' },
  { value: 'INDIRECT_ALTERNATIVE', label: 'Indirect / Everyday Tool' },
  { value: 'MANUAL_SERVICE_AGENCY', label: 'Consultant / Agency / Service' },
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
  onParkQuestion,
  onBackToModuleA,
}: ModuleBWorkspaceProps) {
  const countryPack = getCountryRulePack(selectedCountry);
  const localGrants = getGrantsForCountry(selectedCountry);
  const industryExamples = getIndustryBeachheadExamples(plan.industryCategory);
  const competitorExamples = getIndustryCompetitorExamples(
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

  // Step 2 Layer 1–2 Coaching States
  const [showStep2WhyCard, setShowStep2WhyCard] = useState(true);
  const [showStep2Examples, setShowStep2Examples] = useState(false);
  const [showStep2ImStuck, setShowStep2ImStuck] = useState(false);
  const [stuckStep2MainComplaint, setStuckStep2MainComplaint] = useState('');
  const [stuckStep2OurFix, setStuckStep2OurFix] = useState('');

  // Step 2 AI Scout & Save States
  const [isScoutingAi, setIsScoutingAi] = useState(false);
  const [isSavingStep2, setIsSavingStep2] = useState(false);

  // Sync Step 2 state when plan changes or Cloud SQL hydrates
  useEffect(() => {
    setCurrentWorkarounds(savedStep2?.currentWorkarounds ?? []);
    setWorkaroundFrustrationNotes(
      savedStep2?.workaroundFrustrationNotes ?? ''
    );
    setCompetitors(savedStep2?.competitors ?? []);
    setWhySwitchEdges(savedStep2?.whySwitchEdges ?? []);
    setWhySwitchOneSentence(savedStep2?.whySwitchOneSentence ?? '');
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

  const step1Checkpoints = [
    buyerTypes.length > 0,
    beachheadSegment.trim().length > 12,
    decisionMakerRole.trim().length > 5,
    Boolean(buyingTriggerPreset),
    buyingTriggerNotes.trim().length > 5,
    targetMarkets.length > 0,
  ];
  const step1Completion = Math.round(
    (step1Checkpoints.filter(Boolean).length / step1Checkpoints.length) * 25
  );

  const step2Checkpoints = [
    currentWorkarounds.length > 0,
    workaroundFrustrationNotes.trim().length > 5,
    competitors.some((c) => c.name.trim().length > 1),
    whySwitchEdges.length > 0,
    whySwitchOneSentence.trim().length > 10,
  ];
  const step2Completion = Math.round(
    (step2Checkpoints.filter(Boolean).length / step2Checkpoints.length) * 25
  );

  const totalModuleBProgress = step1Completion + step2Completion;

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
      lastSavedAt: new Date().toISOString(),
    };
    await onSaveStep2Competitors(
      payload,
      Math.max(35, totalModuleBProgress)
    );
    setIsSavingStep2(false);
    setSaveBanner(
      '✅ Saved Step 2 (Competitors & How Customers Deal With This Today)!'
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
              Module B: Market Research &amp; Validation
            </h1>
            <p className="max-w-2xl text-xs text-indigo-100/90 sm:text-sm">
              Move from <em>&ldquo;I think everyone needs this&rdquo;</em> to a
              clear first customer group, real competitor research,
              plain-English market sizing, and a shareable Customer Validation
              Survey.
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
              Module B Progress: <strong>{totalModuleBProgress}%</strong> (Steps
              1–2 of 5 Active)
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
              done: step1Completion >= 25,
            },
            {
              step: 'Step 2',
              title: 'Competitors & Current Habits',
              targetId: 'module-b-step-2',
              active: true,
              done: step2Completion >= 25,
            },
            {
              step: 'Step 3',
              title: 'Plain-English Market Sizing',
              targetId: '',
              active: false,
              done: false,
            },
            {
              step: 'Step 4',
              title: 'Hosted Validation Survey',
              targetId: '',
              active: false,
              done: false,
            },
            {
              step: 'Step 5',
              title: 'Market Things to Consider',
              targetId: '',
              active: false,
              done: false,
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
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
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
              <div className="flex items-center gap-2">
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
              </div>
            </div>

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
      {/* UPCOMING MODULE B STEPS PREVIEW (STEPS 3–5)                         */}
      {/* =================================================================== */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-slate-200/90 bg-white/80">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Badge variant="secondary">Step 3 of 5 • Next Piece</Badge>
              <BarChart3 className="h-4 w-4 text-indigo-600" />
            </div>
            <CardTitle className="mt-1 text-base">
              Step 3: Market Sizing Without the Maths Headache
            </CardTitle>
            <CardDescription className="text-xs">
              Plain-English Bottom-Up Calculator in{' '}
              {countryPack.defaultCurrency} paired with industry benchmarks for
              grant &amp; investor decks.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-slate-200/90 bg-white/80">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Badge variant="secondary">Step 4 of 5 • Upcoming</Badge>
              <Users className="h-4 w-4 text-indigo-600" />
            </div>
            <CardTitle className="mt-1 text-base">
              Step 4: Native Hosted Validation Survey &amp; &ldquo;Mom
              Test&rdquo; Checker
            </CardTitle>
            <CardDescription className="text-xs">
              Auto-generate your unbiased customer survey, share your public{' '}
              <code>/v/[slug]</code> link, and log 1-on-1 coffee chat notes.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-slate-200/90 bg-white/80">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Badge variant="secondary">Step 5 of 5 • Upcoming</Badge>
              <Sparkles className="h-4 w-4 text-indigo-600" />
            </div>
            <CardTitle className="mt-1 text-base">
              Step 5: Market &ldquo;Things to Consider&rdquo; &amp; Validation
              Brief
            </CardTitle>
            <CardDescription className="text-xs">
              Switching-friction audit, Vitamin vs. Painkiller reality check,
              and printable Market Validation Brief.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
