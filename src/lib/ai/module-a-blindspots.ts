import type { BlindSpotItem } from '@/db/schema';
import {
  getCountryRulePack,
  getGrantsForCountry,
  formatPlanCurrency,
  type SupportedCountryCode,
} from '@/lib/localization';
import type {
  SavedConceptCanvas,
  SavedFounderMotivation,
  SavedTeamAndBudget,
  SavedFounderRealityCheck,
  FounderDealbreakerType,
} from '@/lib/auth/session-store';

export interface DynamicBlindSpotsInput {
  planTitle: string;
  brainDumpText: string;
  industryCategory: string;
  hqCountryCode: SupportedCountryCode;
  exportPotential: 'DOMESTIC_ONLY' | 'EXPORTING_INTERNATIONALLY';
  conceptCanvas?: Partial<SavedConceptCanvas> | null;
  founderMotivation?: SavedFounderMotivation;
  teamAndBudget?: SavedTeamAndBudget;
  founderRealityCheck?: SavedFounderRealityCheck;
}

const DEALBREAKER_SHORT_LABELS: Record<FounderDealbreakerType, string> = {
  NO_BIG_TEAM: 'managing a large staff team',
  NO_PHYSICAL_PREMISES: 'taking on a physical shop/warehouse lease',
  NO_COLD_SALES: 'doing cold-calling or high-pressure enterprise sales',
  NO_OUTSIDE_INVESTORS: 'answering to outside VCs/investors',
  NO_WEEKEND_SUPPORT: 'handling 24/7 weekend customer emergencies',
};

/**
 * Generates 6 live, deeply personalized "Things to Consider" blind-spot cards
 * that react immediately as the founder adds or edits information across Steps 1–5.
 */
export function buildDynamicModuleABlindSpots(
  input: DynamicBlindSpotsInput
): BlindSpotItem[] {
  const countryPack = getCountryRulePack(input.hqCountryCode);
  const grants = getGrantsForCountry(input.hqCountryCode);
  const topGrant = grants[0]?.grantName || 'Local Enterprise Feasibility Support';
  const currency = countryPack.defaultCurrency;

  const benchmarkPrice =
    input.industryCategory.includes('SaaS') ||
    input.industryCategory.includes('Service')
      ? `${formatPlanCurrency(299, currency)}/month`
      : `${formatPlanCurrency(85, currency)} per order`;

  const canvas = input.conceptCanvas || {};
  const motivation = input.founderMotivation || {
    primaryMotivation: 'LEAVE_JOB',
    weeklyHoursAvailable: '15_TO_25_HRS',
    twelveMonthSuccessVision: '',
  };
  const team = input.teamAndBudget || {
    teamStructureType: 'SOLO_FOUNDER',
    skillCoverage: 'BUILD_IN_HOUSE',
    startingBudgetBracket: '1K_TO_5K',
    teamAndFundingNotes: '',
  };
  const reality = input.founderRealityCheck || {
    industryConnection: 'WARM_CONNECTIONS',
    personalIncomeUrgency: 'MEDIUM_6_TO_12M',
    dealbreakers: [],
    growthTradeoff: 'NON_DILUTIVE_GRANTS',
    biggestWorryPreset: 'FINDING_FIRST_10',
    biggestWorryNotes: '',
  };

  // ============================================================================
  // CARD 1: STEPS 1 & 2 — CONCEPT, CUSTOMER & VERSION 1 SCOPE
  // ============================================================================
  const customerSnippet = canvas.targetCustomer?.trim()
    ? canvas.targetCustomer.trim().replace(/\.$/, '')
    : `${input.industryCategory} buyers in ${countryPack.countryName}`;
  const solutionSnippet = canvas.proposedSolution?.trim()
    ? canvas.proposedSolution.trim().replace(/\.$/, '')
    : input.planTitle;
  const advantageSnippet = canvas.unfairAdvantage?.trim();

  const card1: BlindSpotItem = {
    id: 'live-bs-1-concept',
    category: 'OPERATIONAL_REALITY',
    severity: 'INFO',
    title: `🔌 1. Simplifying Version 1 for Your Target Buyers (Steps 1–2)`,
    explanation: `You are building "${solutionSnippet}" for "${customerSnippet}".${
      advantageSnippet
        ? ` To prove your unfair advantage ("${advantageSnippet.replace(/\.$/, '')}"),`
        : ' In this sector,'
    } busy customers rarely rip-and-replace their existing workflow on Day 1. Can a customer test your core value in under 15 minutes before you build complex integrations?`,
    suggestedAction:
      canvas.revenueAndGrantFit?.trim()
        ? `Test whether 5 buyers will commit to your pricing model ("${canvas.revenueAndGrantFit.trim().replace(/\.$/, '')}") using a simple pilot first.`
        : `Offer a zero-friction pilot at ${benchmarkPrice} before building advanced features.`,
  };

  // ============================================================================
  // CARD 2: STEP 3 — PERSONAL MOTIVATION, WEEKLY HOURS & 12-MONTH VISION
  // ============================================================================
  const hoursLabel =
    motivation.weeklyHoursAvailable === '5_TO_10_HRS'
      ? '5–10 hrs/week (evenings & weekends)'
      : motivation.weeklyHoursAvailable === '15_TO_25_HRS'
        ? '15–25 hrs/week (part-time focus)'
        : '40+ hrs/week (full-time all-in)';

  const visionNote = motivation.twelveMonthSuccessVision?.trim();
  const visionSentence = visionNote
    ? ` You defined 12-month success as: "${visionNote.replace(/\.$/, '')}".`
    : '';

  let card2Title = '💼 2. Your "Leave the 9-to-5" Freedom Number (Step 3)';
  let card2Explanation = `You are committing ${hoursLabel} to replace your job income.${visionSentence} To hand in your notice safely, recurring monthly revenue is your best friend — focus on how many customers at ${benchmarkPrice} cover your core living costs.`;
  let card2Action =
    motivation.weeklyHoursAvailable === '5_TO_10_HRS'
      ? 'With 5–10 hrs/week, spend 80% of your time talking to buyers and pre-selling rather than coding alone at night.'
      : 'Prioritize fast-paying customers with a short sales cycle in Module B.';

  if (motivation.primaryMotivation === 'SIDE_HUSTLE') {
    card2Title = `🌙 2. Protecting Your ${hoursLabel} Side-Hustle Schedule (Step 3)`;
    card2Explanation = `Because you are building this as a side hustle on ${hoursLabel}, you cannot afford high-maintenance clients or daytime emergencies.${visionSentence} Make sure customers can onboard and get results asynchronously.`;
    card2Action =
      'Automate onboarding or package your offer as a fixed-scope productized service.';
  } else if (motivation.primaryMotivation === 'SAVE_THE_WORLD') {
    card2Title = '🌍 2. Fueling Your Mission with Sustainable Margin (Step 3)';
    card2Explanation = `You are putting in ${hoursLabel} toward a mission you care deeply about.${visionSentence} Mission-led startups make the biggest impact when they generate self-sustaining profit rather than relying purely on grants or founder burnout.`;
    card2Action = `Identify which customer segment has the budget to pay ${benchmarkPrice} today to fund your impact.`;
  } else if (motivation.primaryMotivation === 'SCALE_STARTUP') {
    card2Title = `🚀 2. High-Growth Pace vs. Your ${hoursLabel} Bandwidth (Step 3)`;
    card2Explanation = `You want to scale a high-growth startup (${
      input.exportPotential === 'EXPORTING_INTERNATIONALLY'
        ? `exporting beyond ${countryPack.countryName}`
        : `in ${countryPack.countryName}`
    }) while working ${hoursLabel}.${visionSentence} State agencies (${topGrant}) and investors will look for repeatable acquisition and early traction.`;
    card2Action =
      'Line up 5–10 Letters of Intent or paid pilots in Module B to prove scalable demand.';
  } else if (motivation.primaryMotivation === 'BUILD_TO_SELL') {
    card2Title = '🏆 2. Designing a Sellable Business Asset from Day 1 (Step 3)';
    card2Explanation = `Your goal is to build a valuable asset you can eventually sell while committing ${hoursLabel}.${visionSentence} Acquirers pay a multiple for recurring contracts and documented systems that run without the founder doing every job personally.`;
    card2Action =
      'Avoid one-off custom projects; lock in repeatable monthly or annual customer agreements.';
  }

  const card2: BlindSpotItem = {
    id: 'live-bs-2-motivation',
    category: 'OPERATIONAL_REALITY',
    severity:
      motivation.primaryMotivation === 'SCALE_STARTUP' &&
      motivation.weeklyHoursAvailable === '5_TO_10_HRS'
        ? 'WARNING'
        : 'INFO',
    title: card2Title,
    explanation: card2Explanation,
    suggestedAction: card2Action,
  };

  // ============================================================================
  // CARD 3: STEP 4 — TEAM SETUP, SKILL COVERAGE & MISSING ROLES
  // ============================================================================
  const teamLabel =
    team.teamStructureType === 'SOLO_FOUNDER'
      ? 'a Solo Founder'
      : team.teamStructureType === 'SEEKING_COFOUNDER'
        ? 'Solo (Looking for a Co-Founder)'
        : team.teamStructureType === 'COFOUNDER_TEAM'
          ? 'a Co-Founder Team (2+ Founders)'
          : 'Solo + Freelancers/Contractors';

  const teamNotes = team.teamAndFundingNotes?.trim();
  const teamNotesSentence = teamNotes
    ? ` You noted: "${teamNotes.replace(/\.$/, '')}".`
    : '';

  let card3Title = `👤 3. Team & Build Execution (${teamLabel} • Step 4)`;
  let card3Explanation = '';
  let card3Action = '';
  let card3Severity: 'INFO' | 'WARNING' = 'INFO';

  if (team.skillCoverage === 'NEED_EXTERNAL_BUILDER') {
    card3Severity = 'WARNING';
    card3Title = `🛠️ 3. Bridging Your Build Gap as ${teamLabel} (Step 4)`;
    card3Explanation = `You indicated you are ${teamLabel} and will need an external builder or technical partner to build Version 1.${teamNotesSentence} The #1 trap here is paying an agency thousands upfront or giving away 50% equity before proving customers will pay.`;
    card3Action =
      'Validate demand using a clickable mockup or manual "Concierge MVP" in Module B first — 5 pre-orders will make recruiting a builder 10x easier.';
  } else if (team.skillCoverage === 'PARTIAL_SKILLS') {
    card3Title = `🧩 3. Covering Your Missing Skill Gaps (${teamLabel} • Step 4)`;
    card3Explanation = `You are operating as ${teamLabel} with strong domain/commercial skills, but need support on part of the build.${teamNotesSentence} Keep Version 1 lean using no-code/off-the-shelf tools for the parts outside your core skillset.`;
    card3Action =
      team.teamStructureType === 'SEEKING_COFOUNDER'
        ? 'Use Module C to define the exact Startup Hats your future co-founder must own.'
        : 'Only pay specialists for narrow, fixed-price milestones after customer validation.';
  } else {
    card3Title = `✅ 3. In-House Build Advantage (${teamLabel} • Step 4)`;
    card3Explanation = `Because you are ${teamLabel} and have the skills in-house to build Version 1 yourself, you save huge upfront cash.${teamNotesSentence} However, the biggest blind spot for self-sufficient builders is spending months perfecting the product in isolation before talking to buyers.`;
    card3Action =
      team.teamStructureType === 'COFOUNDER_TEAM'
        ? 'Split roles clearly: one co-founder builds Version 1 while the other runs customer interviews in Module B.'
        : 'Follow a strict 50/50 rule: spend half your weekly hours talking to customers before adding new features.';
  }

  const card3: BlindSpotItem = {
    id: 'live-bs-3-team',
    category: 'OPERATIONAL_REALITY',
    severity: card3Severity,
    title: card3Title,
    explanation: card3Explanation,
    suggestedAction: card3Action,
  };

  // ============================================================================
  // CARD 4: STEP 4 & STEP 5 — STARTING CAPITAL, GRANT MATCHING & EQUITY CONTROL
  // ============================================================================
  const budgetLabel =
    team.startingBudgetBracket === 'ZERO_SWEAT_EQUITY'
      ? `${formatPlanCurrency(0, currency)} (Sweat Equity only)`
      : team.startingBudgetBracket === 'UNDER_1K'
        ? `Under ${formatPlanCurrency(1000, currency)}`
        : team.startingBudgetBracket === '1K_TO_5K'
          ? `${formatPlanCurrency(1000, currency)}–${formatPlanCurrency(5000, currency)}`
          : team.startingBudgetBracket === '5K_TO_25K'
            ? `${formatPlanCurrency(5000, currency)}–${formatPlanCurrency(25000, currency)}`
            : `${formatPlanCurrency(25000, currency)}+`;

  const tradeoffLabel =
    reality.growthTradeoff === 'BOOTSTRAP_100_CONTROL'
      ? 'bootstrapping with 100% ownership'
      : reality.growthTradeoff === 'NON_DILUTIVE_GRANTS'
        ? `combining customer sales with non-dilutive ${countryPack.countryName} grants`
        : reality.growthTradeoff === 'SHARE_EQUITY_COFOUNDER'
          ? 'sharing equity with a co-founder'
          : 'raising Angel/VC investment';

  const isLeanBudget =
    team.startingBudgetBracket === 'ZERO_SWEAT_EQUITY' ||
    team.startingBudgetBracket === 'UNDER_1K';

  const card4: BlindSpotItem = {
    id: 'live-bs-4-budget',
    category: 'INDUSTRY_TRAP',
    severity:
      isLeanBudget && reality.growthTradeoff === 'NON_DILUTIVE_GRANTS'
        ? 'WARNING'
        : 'INFO',
    title: `💶 4. Your ${budgetLabel} Budget & Funding Strategy (Steps 4–5)`,
    explanation: isLeanBudget
      ? `You are starting with ${budgetLabel} and prefer ${tradeoffLabel}. Keep in mind that in ${countryPack.countryName}, state grants like ${topGrant} are usually paid on reimbursement — meaning you must pay supplier invoices upfront before claiming the grant back.`
      : `You have ${budgetLabel} available to invest and prefer ${tradeoffLabel}. Having savings ready gives you real runway (including upfront match-funding for ${topGrant}), but protect your capital fiercely before proving willingness-to-pay.`,
    suggestedAction: isLeanBudget
      ? `Use early customer pre-sales or paid deposits in ${currency} to generate your initial working capital.`
      : `Gate your ${budgetLabel} budget: spend no more than 15% until 5 target buyers confirm your pricing in Module B.`,
  };

  // ============================================================================
  // CARD 5: STEP 5 — INDUSTRY ACCESS, INCOME TIMELINE & YOUR DEALBREAKERS
  // ============================================================================
  const connectionText =
    reality.industryConnection === 'LIVED_IT_INSIDER'
      ? 'an Industry Insider with firsthand experience'
      : reality.industryConnection === 'WARM_CONNECTIONS'
        ? 'connected to 3–5 warm industry contacts'
        : 'starting cold as an industry outsider';

  const urgencyText =
    reality.personalIncomeUrgency === 'URGENT_1_TO_3M'
      ? 'need personal income within 1–3 months'
      : reality.personalIncomeUrgency === 'MEDIUM_6_TO_12M'
        ? 'aim to draw a personal wage within 6–12 months'
        : 'have 12+ months of personal runway with no immediate wage pressure';

  const dealbreakerList =
    reality.dealbreakers.length > 0
      ? reality.dealbreakers.map((d) => DEALBREAKER_SHORT_LABELS[d]).join(', ')
      : 'no strict lifestyle dealbreakers selected yet';

  const card5: BlindSpotItem = {
    id: 'live-bs-5-reality',
    category: 'OPERATIONAL_REALITY',
    severity:
      reality.personalIncomeUrgency === 'URGENT_1_TO_3M' ||
      reality.industryConnection === 'STARTING_COLD'
        ? 'WARNING'
        : 'INFO',
    title:
      reality.personalIncomeUrgency === 'URGENT_1_TO_3M'
        ? '⚡ 5. Urgent 1–3 Month Wage Timeline & Boundaries (Step 5)'
        : reality.industryConnection === 'STARTING_COLD'
          ? '🧭 5. Breaking In Cold & Respecting Your Boundaries (Step 5)'
          : '🛡️ 5. Aligning Industry Access, Wage Timeline & Dealbreakers (Step 5)',
    explanation: `You are ${connectionText}, ${urgencyText}, and want to avoid: ${dealbreakerList}. ${
      reality.personalIncomeUrgency === 'URGENT_1_TO_3M'
        ? 'Because you need cashflow in 1–3 months, skip slow builds and offer a paid pilot or service-first solution immediately.'
        : reality.industryConnection === 'STARTING_COLD'
          ? 'Because you are starting without warm contacts, do not build in secret — use your Module B Validation Survey as a research icebreaker to meet 10 insiders.'
          : 'Your industry access and timeline give you a strong foundation to validate pricing while designing the business around your lifestyle boundaries.'
    }`,
    suggestedAction: reality.dealbreakers.includes('NO_COLD_SALES')
      ? 'Since you ruled out cold sales, focus Module B & E on warm referrals, local partnerships, or self-serve signups.'
      : reality.dealbreakers.includes('NO_BIG_TEAM')
        ? 'Since you don’t want a large staff team, prioritize automation and repeatable digital delivery from Day 1.'
        : 'Message your first 5 target buyers this week to validate the problem before spending budget.',
  };

  // ============================================================================
  // CARD 6: STEP 5 — ACTION PLAN FOR YOUR #1 SECRET WORRY
  // ============================================================================
  const worryNotes = reality.biggestWorryNotes?.trim();
  const customWorrySuffix = worryNotes
    ? ` You also noted: "${worryNotes.replace(/\.$/, '')}".`
    : '';

  const worryPresets: Record<
    SavedFounderRealityCheck['biggestWorryPreset'],
    { title: string; explanation: string; action: string }
  > = {
    WILL_THEY_PAY: {
      title: '💳 6. Tackling Your #1 Worry: "Will Anyone Actually Pay?" (Step 5)',
      explanation: `It is completely normal to worry that buyers will say "nice idea" but stick with spreadsheets or doing nothing.${customWorrySuffix} The antidote is testing willingness-to-pay before you build.`,
      action: `In Module B, ask buyers what the problem currently costs them in ${currency} and test a concrete price point (${benchmarkPrice}).`,
    },
    FINDING_FIRST_10: {
      title:
        '📣 6. Tackling Your #1 Worry: "Finding My First 10 Customers" (Step 5)',
      explanation: `Most founders worry about how to get their first 10 customers without spending a fortune on ads.${customWorrySuffix} Your first 10 customers never come from scale marketing — they come from direct, helpful conversations.`,
      action: `Use the Module B shareable survey (/v/my-startup) to start 15 non-sales conversations in ${countryPack.countryName} this week.`,
    },
    HOW_TO_BUILD: {
      title:
        '🛠️ 6. Tackling Your #1 Worry: "How to Actually Build It" (Step 5)',
      explanation: `Feeling daunted by the technical or operational build is a healthy signal to simplify Version 1.${customWorrySuffix} Customers care about the outcome, not how complex the code is behind the scenes.`,
      action:
        'Strip Version 1 down to the single "Must-Have" workflow in Module C and deliver the first 3 pilots manually if needed.',
    },
    COMPETITION_OR_AI: {
      title:
        '🦈 6. Tackling Your #1 Worry: "Competitors or AI Copying Us" (Step 5)',
      explanation: `Worrying about larger competitors or generic AI tools is smart.${customWorrySuffix} Big incumbents move slowly and build bloated generic software — your edge is local trust, speed, and specialized workflow fit in ${countryPack.countryName}.`,
      action:
        'Lock in niche customer relationships and local compliance/workflow advantages that generic AI tools ignore.',
    },
    TIME_AND_ENERGY: {
      title:
        '🔋 6. Tackling Your #1 Worry: "Running Out of Time or Cash" (Step 5)',
      explanation: `Founder burnout happens when you try to do 20 things at once without clear validation milestones.${customWorrySuffix} With ${hoursLabel} and ${budgetLabel}, your superpower is ruthless focus.`,
      action:
        'Focus on one milestone at a time: validate 5 buyers in Module B before spending cash or late nights building.',
    },
  };

  const chosenWorry =
    worryPresets[reality.biggestWorryPreset] || worryPresets.FINDING_FIRST_10;

  const card6: BlindSpotItem = {
    id: 'live-bs-6-worry',
    category: 'OPEN_QUESTION',
    severity: 'INFO',
    title: chosenWorry.title,
    explanation: chosenWorry.explanation,
    suggestedAction: chosenWorry.action,
  };

  return [card1, card2, card3, card4, card5, card6];
}
