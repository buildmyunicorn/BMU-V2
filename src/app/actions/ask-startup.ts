'use server';

import { GoogleGenAI } from '@google/genai';
import { db, startupPlans, planModulesData, validationSurveys, surveyResponses } from '@/db';
import { eq } from 'drizzle-orm';
import type {
  ActiveStartupPlan,
  SavedModuleBData,
  SavedModuleCData,
  SavedModuleDData,
  SavedModuleEData,
  SavedModuleFData,
  SavedModuleGData,
  SavedModuleHData,
  SavedModuleIData,
  SavedModuleJData,
  SavedModuleKData,
  SavedModuleLData,
  IndustryCategory,
} from '@/lib/auth/session-store';
import type { SupportedCountryCode } from '@/lib/localization';
import { verifyActiveSessionAndPlanOwnership } from '@/lib/auth/server-auth';
import { authorizeAndPrepareGeminiCall, getGenAiClient } from '@/lib/ai/router';

export type AskStartupPersona =
  | 'ELEVATOR_PITCH'
  | 'INVESTOR_DUE_DILIGENCE'
  | 'GRANT_ASSESSOR'
  | 'BANK_LENDER'
  | 'EXECUTIVE_COFOUNDER';

export interface AskStartupCitation {
  moduleCode: string;
  moduleName: string;
  stepName?: string;
  relevance: string;
}

export interface AskStartupAnswer {
  id: string;
  question: string;
  persona: AskStartupPersona;
  answerMarkdown: string;
  wordCount: number;
  citations: AskStartupCitation[];
  detectedGaps: string[];
  suggestedFollowUps: string[];
  isOffTopic: boolean;
  aiEngineUsed: 'gemini-2.5-flash' | 'smart-synthesizer' | 'guardrail-block';
  createdAt: string;
}

export interface AskStartupPlanParams {
  planId: string;
  question: string;
  persona?: AskStartupPersona;
  planSnapshot?: ActiveStartupPlan;
}

export interface AskStartupPlanResult {
  success: boolean;
  answer?: AskStartupAnswer;
  error?: string;
}

/**
 * Fast regex heuristic to reject obvious off-topic prompts before invoking AI tokens.
 */
function isBlatantlyOffTopic(question: string): boolean {
  const normalized = question.trim().toLowerCase();
  if (normalized.length < 3) return true;

  const offTopicPatterns = [
    /\b(how far is the moon|distance to the moon|moon distance|speed of light)\b/i,
    /\b(weather in|forecast for|what is the weather)\b/i,
    /\b(who won the \d{4} world cup|super bowl|champions league|premier league)\b/i,
    /\b(recipe for|how to bake|how to cook|bake a cake)\b/i,
    /\b(write a poem about (?!my startup|our startup|my business|the business|our product))\b/i,
    /\b(tell me a joke|knock knock joke)\b/i,
    /\b(translate this to (french|spanish|german|chinese|japanese))\b/i,
    /\b(capital of (france|germany|spain|italy|australia|canada|japan|china))\b/i,
    /\b(who is the president of|who is the prime minister of)\b/i,
    /\b(solve this math problem|integrate x|what is the derivative)\b/i,
  ];

  return offTopicPatterns.some((pattern) => pattern.test(normalized));
}

/**
 * Clean user text inputs, removing raw markdown asterisks and excess whitespace.
 */
function cleanInputText(val?: string): string {
  if (!val) return '';
  return val
    .replace(/\*+/g, '')
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Remove duplicate punctuation (e.g. "..", ".,", "?.") and clean spacing.
 */
function cleanPunctuation(val: string): string {
  return val
    .replace(/\s*\.\s*\./g, '.')
    .replace(/\s*,\s*\./g, '.')
    .replace(/\s*;\s*\./g, ';')
    .replace(/\s*\?\s*\./g, '?')
    .replace(/\s*!\s*\./g, '!')
    .replace(/\.\./g, '.')
    .replace(/\s+,/g, ',')
    .replace(/\s+\./g, '.')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Friendly country names for natural reading.
 */
function formatCountryName(code?: string): string {
  if (code === 'IE') return 'Ireland';
  if (code === 'GB') return 'the United Kingdom';
  if (code === 'US') return 'the United States';
  if (code === 'CA') return 'Canada';
  if (code === 'AU') return 'Australia';
  return code || 'Ireland';
}

/**
 * Smooth stuttering or awkward repetitive phrases common in raw founder brain dumps.
 */
function smoothRepetitivePhrases(text: string): string {
  return text
    .replace(/\bstartups?\s+start\s+their\s+startups?\s+from\s+idea\s+to\s+startup\s+creation\b/gi, 'take their venture from initial idea to commercial launch')
    .replace(/\bstartups?\s+start\s+their\s+startups?\b/gi, 'launch and grow their venture')
    .replace(/\bstartups?\s+start\s+a\s+startup\b/gi, 'launch a venture')
    .replace(/\bvery\s+early\s+stage\s+founders\s+startups\s+start\b/gi, 'early-stage founders launch')
    .replace(/\bfounders\s+startups\s+start\b/gi, 'founders launch')
    .replace(/\bidea\s+(the\s+)?but\b/gi, 'idea,')
    .replace(/\bthe\s+but\b/gi, ', but')
    .replace(/\bthis\s+is\s+the\s+core\s+of\s+the\s+platform\s+we\s+are\s+going\s+to\s+build\.?\b/gi, '')
    .replace(/\bthis\s+is\s+what\s+we\s+(are\s+going\s+to|will)\s+build\.?\b/gi, '')
    .trim();
}

/**
 * Extract the genuine pain/friction point from the founder's raw problem notes.
 */
function extractCoreProblemNarrative(problemRaw?: string, customerRaw?: string): string {
  const customer = cleanInputText(customerRaw || 'early-stage founders').replace(/\.+$/, '');
  let cleaned = smoothRepetitivePhrases(cleanInputText(problemRaw));
  const sentences = cleaned
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const painSentences = sentences.filter((s) =>
    /\b(while|struggle|problem|difficult|lack|challenge|barrier|obstacle|friction|cannot|hard|fail|confus|inefficien|know everything)\b/i.test(s)
  );

  if (painSentences.length > 0) {
    let pain = painSentences.join(' ');
    pain = pain.replace(/\bidea\s+(the\s+)?but\b/i, 'idea,');
    pain = pain.replace(/\bthe\s+but\b/i, ', but');
    pain = pain.replace(/\bWhile\s+([^,]+),\s*but\b/i, 'While $1,');
    if (/^while\s+/i.test(pain)) {
      pain = 'W' + pain.slice(1);
    }
    return pain.endsWith('.') ? pain : `${pain}.`;
  }

  const filtered = sentences.filter((s) =>
    !/^(help|to\s+help|we\s+build|this\s+is\s+the\s+core)\b/i.test(s)
  );

  if (filtered.length > 0) {
    let res = filtered.join(' ');
    return res.endsWith('.') ? res : `${res}.`;
  }

  return `While many ${customer.toLowerCase()} have strong conceptual ideas, they frequently struggle with the commercial, operational, and regulatory steps required to build a sustainable business.`;
}

/**
 * Strip accidental mid-sentence bold markers (e.g. "**Word** is") and fix punctuation glitches.
 */
function sanitizeHumanAnswer(text: string): string {
  if (!text) return '';
  let cleaned = text;

  // 1. Remove mid-sentence bolding: e.g. "facing **Entrepreneurs.**" -> "facing Entrepreneurs."
  cleaned = cleaned.replace(/(?<=[^\n])\s*\*\*([^*]+)\*\*/g, ' $1');
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*\s*(?=[a-zA-Z0-9,;.])/g, '$1 ');

  // If any remaining ** wrap full sentences or long clauses, strip them
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, (match, inner) => {
    if (inner.length > 35 || inner.includes('.')) {
      return inner.trim();
    }
    return match;
  });

  // 2. Fix double punctuation glitches
  cleaned = cleaned
    .replace(/\s*\.\s*\./g, '.')
    .replace(/\s*,\s*\./g, '.')
    .replace(/\s*;\s*\./g, ';')
    .replace(/\s*\?\s*\./g, '?')
    .replace(/\s*!\s*\./g, '!')
    .replace(/\.\./g, '.')
    .replace(/\s+,/g, ',')
    .replace(/\s+\./g, '.');

  // 3. Clean spacing
  cleaned = cleaned.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

  return cleaned;
}

/**
 * Build rich plain-text summary of the founder's entire startup across Modules A–L
 */
function compilePlanContextSummary(plan: ActiveStartupPlan): {
  summary: string;
  availableModules: string[];
  emptyModules: string[];
} {
  const availableModules: string[] = [];
  const emptyModules: string[] = [];

  const title = plan.title || 'Untitled Venture';
  const oneLiner = plan.oneLinerSummary || 'Early-stage venture';
  const hq = `${plan.hqCountryCode || 'IE'} (${plan.baseCurrency || 'EUR'})`;
  const exportPotential = plan.exportPotential || 'EXPORTING_INTERNATIONALLY';

  // Module A
  const canvas = plan.conceptCanvas;
  let modAText = 'No canvas data yet.';
  if (canvas && (canvas.coreProblem || canvas.targetCustomer || canvas.proposedSolution)) {
    availableModules.push('MOD_A_IDEATION');
    modAText = `
- Target Customer: ${canvas.targetCustomer || 'Not defined'}
- Core Problem: ${canvas.coreProblem || 'Not defined'}
- Proposed Solution: ${canvas.proposedSolution || 'Not defined'}
- Unfair Advantage: ${canvas.unfairAdvantage || 'Not defined'}
- Revenue / Grant Model Fit: ${canvas.revenueAndGrantFit || 'Not defined'}
- Founder Motivation: ${plan.founderMotivation?.primaryMotivation || 'Not defined'} (${plan.founderMotivation?.twelveMonthSuccessVision || ''})`;
  } else {
    emptyModules.push('MOD_A_IDEATION');
  }

  // Module B
  const modB = plan.moduleBData;
  let modBText = 'No market/competitor research yet.';
  if (modB?.beachhead?.beachheadSegment || modB?.competitiveWedge?.competitiveEdgeSummary) {
    availableModules.push('MOD_B_MARKET');
    modBText = `
- Beachhead Segment: ${modB.beachhead?.beachheadSegment || 'Not defined'}
- Decision Maker Role: ${modB.beachhead?.decisionMakerRole || 'Not defined'}
- Competitive Edge: ${modB.competitiveWedge?.competitiveEdgeSummary || 'Not defined'}
- Competitor Alternatives: ${(modB.competitorsAndStatusQuo?.competitors || []).map((c) => c.name).filter(Boolean).join(', ') || 'None listed'}
- Market Sizing Segments: ${(modB.marketSizing?.segments || []).map((s) => `${s.segmentName}: ${s.pricePerCustomerInput}`).join(', ') || 'N/A'}`;
  } else {
    emptyModules.push('MOD_B_MARKET');
  }

  // Module C
  const modC = plan.moduleCData;
  let modCText = 'No validation survey responses yet.';
  const surveyList = modC?.surveys || [];
  const totalResponses = surveyList.reduce((acc, s) => acc + (s.responses?.length || 0), 0);
  const interviewCount = modC?.interviewLogs?.length || 0;
  if (totalResponses > 0 || interviewCount > 0) {
    availableModules.push('MOD_C_SURVEYS_FEEDBACK');
    modCText = `
- Public Survey Responses: ${totalResponses} captured across ${surveyList.length} surveys
- 1-on-1 Customer Interviews: ${interviewCount} logged
- Key Feedback Summary: ${surveyList[0]?.aiInsightsSummary?.headlineTakeaway || 'Customer interest validated'}`;
  } else {
    emptyModules.push('MOD_C_SURVEYS_FEEDBACK');
  }

  // Module D
  const modD = plan.moduleDData;
  let modDText = 'No product build details yet.';
  if (modD?.productVehicle?.formFactor || (modD?.workPackagesAndFlow?.workPackages && modD.workPackagesAndFlow.workPackages.length > 0)) {
    availableModules.push('MOD_D_PRODUCT_BUILD');
    modDText = `
- Product Vehicle / Form Factor: ${modD.productVehicle?.formFactor || 'Software / Digital'}
- Primary Channel: ${modD.channelMatrix?.primaryChannel || 'Direct Proprietary'}
- Build vs Buy Approach: ${modD.buildVsBuy?.secretSauceInHouseNarrative || 'In-House + Managed Stack'}
- Core Work Packages: ${(modD.workPackagesAndFlow?.workPackages || []).map((w) => `${w.title} (${w.timelineWindow})`).join('; ') || 'MVP Development'}`;
  } else {
    emptyModules.push('MOD_D_PRODUCT_BUILD');
  }

  // Module E
  const modE = plan.moduleEData;
  let modEText = 'No operational schedule or risk register yet.';
  if (modE?.premisesAndEquipment?.equipmentItems?.length || modE?.riskRegister?.riskItems?.length) {
    availableModules.push('MOD_E_OPERATIONS');
    modEText = `
- Equipment & Capital Purchases: ${(modE.premisesAndEquipment?.equipmentItems || []).map((e) => `${e.assetName}: ${e.totalCostExVat}`).join(', ') || 'None scheduled'}
- Top Risks & Mitigations: ${(modE.riskRegister?.riskItems || []).slice(0, 3).map((r) => `${r.riskTitle} [${r.riskCategory}]: ${r.mitigationAndContingencyPlan}`).join('; ') || 'Standard operational risk profile'}`;
  } else {
    emptyModules.push('MOD_E_OPERATIONS');
  }

  // Module F
  const modF = plan.moduleFData;
  let modFText = 'No co-founder or hiring plan yet.';
  if (modF?.promoterProfiles?.teamMembers?.length || modF?.step5HiringPlanData?.roles?.length) {
    availableModules.push('MOD_F_COFOUNDER_TEAM');
    modFText = `
- Promoter Team: ${(modF.promoterProfiles?.teamMembers || []).map((m) => `${m.fullName} - ${m.jobTitle} (${m.weeklyCommitment})`).join(', ') || 'Sole Founder'}
- Planned Hires: ${(modF.step5HiringPlanData?.roles || []).map((r) => `${r.title} (Y${r.yearScheduled})`).join(', ') || 'No immediate headcount hires'}
- Founder Personal Survival Budget: ${modF.step3SurvivalBudgetData?.founderBudgets?.length ? `${plan.baseCurrency || 'EUR'} calculated in personal survival budget` : 'Not specified'}`;
  } else {
    emptyModules.push('MOD_F_COFOUNDER_TEAM');
  }

  // Module G
  const modG = plan.moduleGData;
  let modGText = 'Launchpad setup not configured yet.';
  if (modG) {
    availableModules.push('MOD_G_LAUNCHPAD');
    modGText = `
- Entity Status: ${modG.step1?.state === 'ALREADY_HAVE' ? `Incorporated (${modG.step1.registeredEntityName || 'LTD'})` : 'Needs Registration'}
- Domain / Email: ${modG.step2?.state === 'ALREADY_HAVE' ? `Configured (${modG.step2.primaryDomain || 'Active'})` : 'Pending'}
- Bank Account: ${modG.step3?.state === 'ALREADY_HAVE' ? `Active (${modG.step3.bankProvider || 'Active'})` : 'Pending'}
- Bookkeeping / Tax: ${modG.step4?.state === 'ALREADY_HAVE' ? 'Setup' : 'Pending'}
- Insurance: ${modG.step5?.state === 'ALREADY_HAVE' ? 'Active' : 'Pending'}`;
  } else {
    emptyModules.push('MOD_G_LAUNCHPAD');
  }

  // Module H
  const modH = plan.moduleHData;
  let modHText = 'No revenue model or unit economics configured yet.';
  if (modH?.step1RevenueModel?.revenueModelVehicle || modH?.step3BreakevenCalculator) {
    availableModules.push('MOD_H_REVENUE');
    const b = modH.step3BreakevenCalculator;
    modHText = `
- Revenue Model: ${modH.step1RevenueModel?.revenueModelVehicle || 'Subscription / Direct Sale'}
- Target Pricing: ${plan.baseCurrency || 'EUR'} ${b?.activePriceSlider || 'N/A'} per customer/unit
- Variable COGS: ${plan.baseCurrency || 'EUR'} ${b?.frictionCosts?.directVariableCogsPerUnit || 0}
- Platform / Processing Fees: ${b?.frictionCosts?.paymentGatewayPercent || 0}%
- Breakeven Customer Units (Year 1): ${b?.activeCustomerSlider || 'N/A'} customers
- Debtor Terms: ${b?.paymentTerms || 'INSTANT_PAYMENT'}`;
  } else {
    emptyModules.push('MOD_H_REVENUE');
  }

  // Module I
  const modI = plan.moduleIData;
  let modIText = 'No marketing or acquisition plan yet.';
  if (modI?.step1Positioning?.elevatorHook140 || modI?.step3First10?.targetPipeline?.length) {
    availableModules.push('MOD_I_MARKETING');
    modIText = `
- Positioning Statement: ${modI.step1Positioning?.elevatorHook140 || 'Not defined'}
- First 10 Customers Acquisition Playbook: ${(modI.step3First10?.targetPipeline || []).slice(0, 3).map((p) => `${p.companyOrPersona} (${p.decisionMakerTitle})`).join(', ') || 'Direct Outreach / Network'}
- Marketing Budget Allocation: Total Planned Monthly Spend ${plan.baseCurrency || 'EUR'} ${modI.step4Budget?.totalPlannedMonthlyMarketingSpend || 0}`;
  } else {
    emptyModules.push('MOD_I_MARKETING');
  }

  // Module J
  const modJ = plan.moduleJData;
  let modJText = 'No financial runway or funding gap model yet.';
  if (modJ?.step3CashflowGap?.fundingGapNarrative || modJ?.step1OverheadsTax) {
    availableModules.push('MOD_J_FINANCE');
    modJText = `
- Funding Strategy: ${modJ.step3CashflowGap?.primaryFundingStrategy || 'BOOTSTRAPPED_LEAN'}
- Starting Cash Balance: ${plan.baseCurrency || 'EUR'} ${modJ.step3CashflowGap?.startingCashBalanceDay1 || 0}
- Safety Buffer: ${modJ.step3CashflowGap?.safetyBufferPercent || 20}%`;
  } else {
    emptyModules.push('MOD_J_FINANCE');
  }

  // Module K
  const modK = plan.moduleKData;
  let modKText = 'No grant matches or tax relief radar saved.';
  if (modK?.step1Audit || modK?.step2CapitalStack) {
    availableModules.push('MOD_K_GRANTS_FUNDING');
    modKText = `
- Capital Stack & Non-Dilutive Strategy: Target non-dilutive grant funding combined with founder equity and tax relief.
- Grant Fit & Readiness: Aligned for ${plan.hqCountryCode === 'GB' ? 'Innovate UK / Start Up Loans' : 'LEO / Enterprise Ireland'} programs.`;
  } else {
    emptyModules.push('MOD_K_GRANTS_FUNDING');
  }

  // Module L
  const modL = plan.moduleLData;
  let modLText = 'No business plan compiled yet.';
  if (modL?.step3Compiler?.executiveHookStatement) {
    availableModules.push('MOD_L_BUSINESS_PLAN');
    modLText = `
- Compiled Plan Executive Hook: ${modL.step3Compiler.executiveHookStatement.slice(0, 350)}...`;
  } else {
    emptyModules.push('MOD_L_BUSINESS_PLAN');
  }

  const summary = `
=== STARTUP PROFILE ===
Name: ${title}
One-Liner Summary: ${oneLiner}
HQ Country & Currency: ${hq}
Export / Growth Classification: ${exportPotential}

=== MODULE A: CONCEPT CANVAS & MOTIVATION ===
${modAText}

=== MODULE B: MARKET, COMPETITORS & TAM/SAM/SOM ===
${modBText}

=== MODULE C: CUSTOMER VALIDATION, SURVEYS & WAITLIST ===
${modCText}

=== MODULE D: PRODUCT BUILD, ARCHITECTURE & WORK PACKAGES ===
${modDText}

=== MODULE E: OPERATIONS, CAPITAL EXPENDITURE & RISK REGISTER ===
${modEText}

=== MODULE F: FOUNDER CV, TEAM, SURVIVAL BUDGET & ROLES ===
${modFText}

=== MODULE G: LAUNCHPAD & OPERATIONAL READINESS ===
${modGText}

=== MODULE H: REVENUE MODEL, PRICING & POCKET PROFIT BREAKEVEN ===
${modHText}

=== MODULE I: MARKETING STRATEGY & FIRST 10 CUSTOMERS ===
${modIText}

=== MODULE J: FINANCIAL MODEL, CASHFLOW TROUGH & FUNDING GAP ===
${modJText}

=== MODULE K: GRANTS & TAX RELIEF RADAR ===
${modKText}

=== MODULE L: OFFICIAL BUSINESS PLAN ===
${modLText}
`.trim();

  return { summary, availableModules, emptyModules };
}

/**
 * Build a fluent, human-written Elevator Pitch / 150-word description.
 */
function buildHumanElevatorPitch(plan: ActiveStartupPlan): {
  text: string;
  citations: AskStartupCitation[];
  followUps: string[];
} {
  const title = cleanInputText(plan.title) || 'Our Venture';
  const customer = cleanInputText(plan.conceptCanvas?.targetCustomer || plan.moduleBData?.beachhead?.beachheadSegment || 'early-stage founders').replace(/\.+$/, '');
  const problemSentence = extractCoreProblemNarrative(plan.conceptCanvas?.coreProblem, customer);
  const rawAdvantage = cleanInputText(plan.conceptCanvas?.unfairAdvantage || plan.moduleBData?.competitiveWedge?.competitiveEdgeSummary || 'proprietary execution workflows');
  const price = plan.moduleHData?.step3BreakevenCalculator?.activePriceSlider
    ? `${plan.baseCurrency || 'EUR'} ${plan.moduleHData.step3BreakevenCalculator.activePriceSlider} per unit/month`
    : 'a defined subscription tier';
  const breakeven = plan.moduleHData?.step3BreakevenCalculator?.activeCustomerSlider
    ? `${plan.moduleHData.step3BreakevenCalculator.activeCustomerSlider} active customers`
    : '50–100 active customers';
  const country = formatCountryName(plan.hqCountryCode);

  let rawOneLiner = smoothRepetitivePhrases(cleanInputText(plan.oneLinerSummary || plan.conceptCanvas?.proposedSolution)).replace(/\.+$/, '');
  let opening = '';

  if (/^(to\s+)?help(s|ing)?\s+/i.test(rawOneLiner)) {
    const action = rawOneLiner.replace(/^(to\s+)?help(s|ing)?\s+/i, '');
    opening = `${title} helps ${customer.toLowerCase()} ${action}.`;
  } else if (/^(an?|the)\s+/i.test(rawOneLiner)) {
    opening = `${title} is ${rawOneLiner.charAt(0).toLowerCase() + rawOneLiner.slice(1)} designed for ${customer.toLowerCase()}.`;
  } else if (rawOneLiner) {
    opening = `${title} provides an integrated platform for ${customer.toLowerCase()} to ${rawOneLiner.charAt(0).toLowerCase() + rawOneLiner.slice(1)}.`;
  } else {
    opening = `${title} provides a purpose-built venture platform designed specifically for ${customer.toLowerCase()}.`;
  }

  let advantageClean = cleanPunctuation(rawAdvantage.replace(/\.+$/, ''));
  let solutionPart = `${title} bridges this barrier with a purpose-built platform featuring ${advantageClean.charAt(0).toLowerCase() + advantageClean.slice(1)}.`;

  let commercialPart = `Commercialized through a clear model (${price}), the business targets operational cashflow breakeven at approximately ${breakeven}. Headquartered in ${country}, the venture is structured for robust domestic execution alongside international export scalability.`;

  const text = sanitizeHumanAnswer(`${opening}\n\n${problemSentence} ${solutionPart}\n\n${commercialPart}`);

  const citations: AskStartupCitation[] = [
    { moduleCode: 'MOD_A_IDEATION', moduleName: 'Module A: Concept Canvas', relevance: 'Core mission, problem statement, and unfair advantage' },
    { moduleCode: 'MOD_H_REVENUE', moduleName: 'Module H: Pricing & Pocket Profit', relevance: 'Pricing model and breakeven customer volume' },
  ];

  const followUps = [
    'What is our unfair advantage and defensibility against competitors?',
    'What are our Year 1 to Year 3 financial projections and unit economics?',
    'Who is our primary beachhead customer persona?',
  ];

  return { text, citations, followUps };
}

/**
 * Build a human-written competitive advantage and defensibility summary.
 */
function buildHumanCompetitiveAnswer(plan: ActiveStartupPlan): {
  text: string;
  citations: AskStartupCitation[];
  followUps: string[];
} {
  const title = cleanInputText(plan.title) || 'Our Venture';
  const customer = cleanInputText(plan.conceptCanvas?.targetCustomer || plan.moduleBData?.beachhead?.beachheadSegment || 'our target market').replace(/\.+$/, '');
  const advantage = cleanInputText(plan.conceptCanvas?.unfairAdvantage || plan.moduleBData?.competitiveWedge?.competitiveEdgeSummary || 'proprietary operational execution workflows');
  const competitorsList = (plan.moduleBData?.competitorsAndStatusQuo?.competitors || []).map((c) => c.name).filter(Boolean);
  const compStr = competitorsList.length > 0 ? competitorsList.join(', ') : 'legacy providers and manual status-quo workarounds';

  const text = sanitizeHumanAnswer(
    `Unlike conventional market alternatives (${compStr}) that rely on fragmented, generic tools, ${title} is specifically architected around ${advantage.toLowerCase()}.\n\n` +
    `Our competitive defensibility is anchored in three key pillars:\n` +
    `1. Focused Beachhead Execution: Tailored specifically to the distinct operating constraints of ${customer.toLowerCase()}.\n` +
    `2. Proprietary Workflow Advantage: ${advantage}.\n` +
    `3. Integrated Structural Efficiency: Delivering quantifiable time and cost savings compared to incumbent solutions.`
  );

  const citations: AskStartupCitation[] = [
    { moduleCode: 'MOD_A_IDEATION', moduleName: 'Module A: Concept Canvas', relevance: 'Unfair advantage definition' },
    { moduleCode: 'MOD_B_MARKET', moduleName: 'Module B: Competitive Wedge', relevance: 'Competitor matrix and beachhead segment' },
  ];

  const followUps = [
    'Describe our startup in 150 words',
    'What is our pricing structure and breakeven volume?',
    'What customer validation or waitlist traction do we have?',
  ];

  return { text, citations, followUps };
}

/**
 * Build a human-written financial and unit economics answer.
 */
function buildHumanFinancialAnswer(plan: ActiveStartupPlan): {
  text: string;
  citations: AskStartupCitation[];
  followUps: string[];
} {
  const title = cleanInputText(plan.title) || 'Our Venture';
  const price = plan.moduleHData?.step3BreakevenCalculator?.activePriceSlider
    ? `${plan.baseCurrency || 'EUR'} ${plan.moduleHData.step3BreakevenCalculator.activePriceSlider}`
    : 'defined per unit / subscription tier';
  const breakevenUnits = plan.moduleHData?.step3BreakevenCalculator?.activeCustomerSlider
    ? `${plan.moduleHData.step3BreakevenCalculator.activeCustomerSlider} active customers`
    : '50–100 active customers';
  const gatewayTake = plan.moduleHData?.step3BreakevenCalculator?.frictionCosts?.paymentGatewayPercent || 2.5;
  const currency = plan.baseCurrency || 'EUR';
  const country = formatCountryName(plan.hqCountryCode);

  const text = sanitizeHumanAnswer(
    `${title} operates on a disciplined commercial model structured for rapid cashflow breakeven and high operational gross margins.\n\n` +
    `Key financial highlights include:\n` +
    `- Commercial Pricing: ${price} per unit / customer\n` +
    `- Breakeven Threshold: Approximately ${breakevenUnits} required to cover scheduled fixed overheads\n` +
    `- Payment Processing & Direct Friction: Modeled at ~${gatewayTake}% per transaction\n` +
    `- Operating Jurisdiction: Based in ${country} with primary accounts maintained in ${currency}\n\n` +
    `This structure ensures the venture maintains capital efficiency during early customer acquisition while scaling smoothly into export markets.`
  );

  const citations: AskStartupCitation[] = [
    { moduleCode: 'MOD_H_REVENUE', moduleName: 'Module H: Pricing & Pocket Profit', relevance: 'Pricing model and breakeven units' },
    { moduleCode: 'MOD_J_FINANCE', moduleName: 'Module J: Financial Model', relevance: 'Overheads and funding gap' },
  ];

  const followUps = [
    'What is our funding requirement and cashflow runway?',
    'What are our Year 1 to Year 3 revenue targets?',
    'What is our defensible unfair advantage?',
  ];

  return { text, citations, followUps };
}

/**
 * Build a human-written grant assessor / government funding evaluation.
 */
function buildHumanGrantAssessorAnswer(plan: ActiveStartupPlan): {
  text: string;
  citations: AskStartupCitation[];
  followUps: string[];
} {
  const title = cleanInputText(plan.title) || 'Our Venture';
  const country = plan.hqCountryCode || 'IE';
  const agencyName = country === 'GB' ? 'Innovate UK & British Business Bank' : 'Local Enterprise Office (LEO) & Enterprise Ireland';
  const programExamples = country === 'GB'
    ? 'Innovate UK Smart Grants, R&D tax relief, and Start Up Loans'
    : 'LEO Feasibility, Priming Grants, and Enterprise Ireland PSSF';

  const text = sanitizeHumanAnswer(
    `From a public grant funding and additionality perspective, ${title} is positioned to qualify for non-dilutive support across ${agencyName}.\n\n` +
    `Assessor readiness highlights:\n` +
    `- Program Alignment: Target eligibility includes ${programExamples}.\n` +
    `- Commercial Additionality: Public funding directly de-risks initial technical build packages and accelerates path to revenue.\n` +
    `- Economic Multiplier: The venture is structured to generate regional knowledge-economy employment and scale international export revenue.`
  );

  const citations: AskStartupCitation[] = [
    { moduleCode: 'MOD_K_GRANTS_FUNDING', moduleName: 'Module K: Grants & Tax Relief', relevance: 'Agency matching and eligibility scorecard' },
    { moduleCode: 'MOD_L_BUSINESS_PLAN', moduleName: 'Module L: Official Grant Compiler', relevance: 'Form compliance and project milestones' },
  ];

  const followUps = [
    'What is our project risk register and mitigation plan?',
    'Describe our startup in 150 words',
    'What are our scheduled capital equipment purchases?',
  ];

  return { text, citations, followUps };
}

/**
 * Build a human-written operational, risk, and team response.
 */
function buildHumanOperationalAnswer(plan: ActiveStartupPlan): {
  text: string;
  citations: AskStartupCitation[];
  followUps: string[];
} {
  const title = cleanInputText(plan.title) || 'Our Venture';
  const teamMembers = (plan.moduleFData?.promoterProfiles?.teamMembers || []).map((m) => `${m.fullName} (${m.jobTitle})`);
  const teamStr = teamMembers.length > 0 ? teamMembers.join(', ') : 'the founding promoter team';
  const risks = (plan.moduleEData?.riskRegister?.riskItems || []).slice(0, 2);

  let riskStr = 'operational risks are managed through clear sprint deliverables and supplier redundancies.';
  if (risks.length > 0) {
    riskStr = risks.map((r) => `${r.riskTitle} (mitigated via ${r.mitigationAndContingencyPlan})`).join('; ');
  }

  const text = sanitizeHumanAnswer(
    `${title}'s operational framework is built for lean, accountable execution managed by ${teamStr}.\n\n` +
    `Operational & Risk Governance:\n` +
    `- Team Allocation: Direct founder oversight across product delivery, customer acquisition, and commercial compliance.\n` +
    `- Key Mitigations: Identified operational risks include ${riskStr}.\n` +
    `- Capital Stewardship: Strict quote validation and phased capital expenditure schedules ensure capital preservation.`
  );

  const citations: AskStartupCitation[] = [
    { moduleCode: 'MOD_E_OPERATIONS', moduleName: 'Module E: Operations & Risk Register', relevance: 'Premises, capex, and risk register' },
    { moduleCode: 'MOD_F_COFOUNDER_TEAM', moduleName: 'Module F: Team & Promoter CVs', relevance: 'Promoter profiles and hiring plan' },
  ];

  const followUps = [
    'What is our breakeven customer threshold?',
    'What are our primary work packages for MVP launch?',
    'Describe our startup in 150 words',
  ];

  return { text, citations, followUps };
}

/**
 * General human-written executive overview fallback.
 */
function buildHumanGeneralOverview(
  question: string,
  plan: ActiveStartupPlan
): {
  text: string;
  citations: AskStartupCitation[];
  followUps: string[];
} {
  const title = cleanInputText(plan.title) || 'Our Venture';
  const customer = cleanInputText(plan.conceptCanvas?.targetCustomer || 'our target market').replace(/\.+$/, '');
  const problemSentence = extractCoreProblemNarrative(plan.conceptCanvas?.coreProblem, customer);
  const advantage = cleanInputText(plan.conceptCanvas?.unfairAdvantage || 'domain-specific workflows');
  const country = formatCountryName(plan.hqCountryCode);

  const text = sanitizeHumanAnswer(
    `${title} is an early-stage venture based in ${country}, dedicated to solving critical challenges for ${customer.toLowerCase()}.\n\n` +
    `${problemSentence} ${title} addresses this with a structured, proprietary approach leveraging ${advantage.toLowerCase()}.\n\n` +
    `The business maintains clear unit economics and is actively executing across its validation, commercialization, and operational roadmap.`
  );

  const citations: AskStartupCitation[] = [
    { moduleCode: 'MOD_A_IDEATION', moduleName: 'Module A: Concept Canvas', relevance: 'Core venture foundation' },
  ];

  const followUps = [
    'Describe our startup in 150 words',
    'What is our beachhead customer and unfair advantage?',
    'What are our Year 1 to Year 3 breakeven economics?',
  ];

  return { text, citations, followUps };
}

/**
 * Fallback deterministic synthesizer when offline, unauthenticated, or API daily quota exceeded.
 * Delivers articulate, human-written copy without raw asterisk spam or robotic templates.
 */
function buildDeterministicAnswer(
  question: string,
  persona: AskStartupPersona,
  plan: ActiveStartupPlan,
  contextMeta: { availableModules: string[]; emptyModules: string[] }
): AskStartupAnswer {
  const lowerQ = question.toLowerCase();
  let synthesisResult: {
    text: string;
    citations: AskStartupCitation[];
    followUps: string[];
  };

  if (
    lowerQ.includes('150 word') ||
    lowerQ.includes('describe') ||
    lowerQ.includes('summary') ||
    lowerQ.includes('pitch') ||
    persona === 'ELEVATOR_PITCH'
  ) {
    synthesisResult = buildHumanElevatorPitch(plan);
  } else if (
    lowerQ.includes('competitor') ||
    lowerQ.includes('moat') ||
    lowerQ.includes('wedge') ||
    lowerQ.includes('advantage') ||
    lowerQ.includes('defensib') ||
    persona === 'INVESTOR_DUE_DILIGENCE'
  ) {
    synthesisResult = buildHumanCompetitiveAnswer(plan);
  } else if (
    lowerQ.includes('revenue') ||
    lowerQ.includes('pricing') ||
    lowerQ.includes('breakeven') ||
    lowerQ.includes('profit') ||
    lowerQ.includes('economics') ||
    persona === 'BANK_LENDER'
  ) {
    synthesisResult = buildHumanFinancialAnswer(plan);
  } else if (
    lowerQ.includes('grant') ||
    lowerQ.includes('leo') ||
    lowerQ.includes('innovate') ||
    lowerQ.includes('enterprise ireland') ||
    lowerQ.includes('funding') ||
    persona === 'GRANT_ASSESSOR'
  ) {
    synthesisResult = buildHumanGrantAssessorAnswer(plan);
  } else if (
    lowerQ.includes('risk') ||
    lowerQ.includes('operation') ||
    lowerQ.includes('team') ||
    lowerQ.includes('hiring') ||
    persona === 'EXECUTIVE_COFOUNDER'
  ) {
    synthesisResult = buildHumanOperationalAnswer(plan);
  } else {
    synthesisResult = buildHumanGeneralOverview(question, plan);
  }

  const detectedGaps: string[] = [];
  if (contextMeta.emptyModules.includes('MOD_C_SURVEYS_FEEDBACK')) {
    detectedGaps.push('Customer validation survey data is not yet captured in Module C.');
  }
  if (contextMeta.emptyModules.includes('MOD_H_REVENUE')) {
    detectedGaps.push('Detailed unit economics and pricing sliders have not been saved in Module H.');
  }

  const cleanText = sanitizeHumanAnswer(synthesisResult.text);
  const wordCount = cleanText.trim().split(/\s+/).filter(Boolean).length;

  return {
    id: `answer-${Date.now()}`,
    question,
    persona,
    answerMarkdown: cleanText,
    wordCount,
    citations: synthesisResult.citations,
    detectedGaps,
    suggestedFollowUps: synthesisResult.followUps,
    isOffTopic: false,
    aiEngineUsed: 'smart-synthesizer',
    createdAt: new Date().toISOString(),
  };
}

/**
 * Main Server Action: Ask My Startup Plan
 */
export async function askStartupPlanAction(
  params: AskStartupPlanParams
): Promise<AskStartupPlanResult> {
  const { planId, question, persona = 'INVESTOR_DUE_DILIGENCE', planSnapshot: clientPlan } = params;

  if (!question || question.trim().length === 0) {
    return { success: false, error: 'Question cannot be empty.' };
  }

  const trimmedQ = question.trim();

  // 1. Check blatant off-topic questions immediately (Zero AI tokens wasted)
  if (isBlatantlyOffTopic(trimmedQ)) {
    return {
      success: true,
      answer: {
        id: `off-topic-${Date.now()}`,
        question: trimmedQ,
        persona,
        answerMarkdown:
          `I am your dedicated **Startup Preflight Co-Pilot** and can only answer questions directly concerning your startup, business plan, commercial strategy, unit economics, market validation, or grant eligibility.\n\n` +
          `Please ask a question related to **${clientPlan?.title || 'your startup plan'}** (e.g. *"Describe my startup in 150 words"*, *"What is our beachhead customer persona?"*, or *"What is our funding requirement?"*).`,
        wordCount: 46,
        citations: [],
        detectedGaps: [],
        suggestedFollowUps: [
          'Describe my startup in 150 words',
          'What is our primary customer problem and solution?',
          'What is our breakeven customer volume and pricing?',
        ],
        isOffTopic: true,
        aiEngineUsed: 'guardrail-block',
        createdAt: new Date().toISOString(),
      },
    };
  }

  // 2. Plan Authentication & Verification
  const authCheck = await verifyActiveSessionAndPlanOwnership(planId);
  if (!authCheck.authorized && !authCheck.isLocalPreview) {
    return { success: false, error: 'Unauthorized access to this startup plan.' };
  }

  // 3. Load or Merge Full Plan Data
  let plan: ActiveStartupPlan = clientPlan || {
    id: planId,
    title: 'My Startup',
    oneLinerSummary: '',
    industryCategory: 'B2B SaaS / AI App',
    hqCountryCode: 'IE',
    baseCurrency: 'EUR',
    targetMarketsArray: ['IE'],
    exportPotential: 'EXPORTING_INTERNATIONALLY',
    currentModuleStep: 'MOD_A_IDEATION',
    openQuestions: [],
  };

  try {
    const isDbPlan = planId && !planId.startsWith('demo-') && !planId.startsWith('local-');
    if (isDbPlan) {
      const planRows = await db.select().from(startupPlans).where(eq(startupPlans.id, planId));
      if (planRows.length > 0) {
        const row = planRows[0];
        const modRows = await db.select().from(planModulesData).where(eq(planModulesData.planId, planId));

        const modA = modRows.find((m) => m.moduleCode === 'MOD_A_IDEATION');
        const modB = modRows.find((m) => m.moduleCode === 'MOD_B_MARKET');
        const modC = modRows.find((m) => m.moduleCode === 'MOD_C_SURVEYS_FEEDBACK');
        const modD = modRows.find((m) => m.moduleCode === 'MOD_D_PRODUCT_BUILD');
        const modE = modRows.find((m) => m.moduleCode === 'MOD_E_OPERATIONS');
        const modF = modRows.find((m) => m.moduleCode === 'MOD_F_COFOUNDER_TEAM');
        const modG = modRows.find((m) => m.moduleCode === 'MOD_G_LAUNCHPAD');
        const modH = modRows.find((m) => m.moduleCode === 'MOD_H_REVENUE');
        const modI = modRows.find((m) => m.moduleCode === 'MOD_I_MARKETING');
        const modJ = modRows.find((m) => m.moduleCode === 'MOD_J_FINANCE');
        const modK = modRows.find((m) => m.moduleCode === 'MOD_K_GRANTS_FUNDING');
        const modL = modRows.find((m) => m.moduleCode === 'MOD_L_BUSINESS_PLAN');

        const modAInputs = (modA?.structuredInputsJsonb || {}) as {
          conceptCanvas?: ActiveStartupPlan['conceptCanvas'];
          founderMotivation?: ActiveStartupPlan['founderMotivation'];
        };

        // Also fetch relational survey counts if available
        let totalSurveyCount = 0;
        try {
          const surveys = await db.select().from(validationSurveys).where(eq(validationSurveys.planId, planId));
          for (const s of surveys) {
            const resps = await db.select().from(surveyResponses).where(eq(surveyResponses.surveyId, s.id));
            totalSurveyCount += resps.length;
          }
        } catch {
          // Relational surveys optional
        }

        plan = {
          ...plan,
          title: row.title || plan.title,
          oneLinerSummary: row.oneLinerSummary || plan.oneLinerSummary,
          industryCategory: (row.industryCategory as IndustryCategory) || plan.industryCategory,
          hqCountryCode: (row.hqCountryCode as SupportedCountryCode) || plan.hqCountryCode,
          baseCurrency: row.baseCurrency || plan.baseCurrency,
          conceptCanvas: modAInputs.conceptCanvas || plan.conceptCanvas,
          founderMotivation: modAInputs.founderMotivation || plan.founderMotivation,
          moduleBData: (modB?.structuredInputsJsonb as SavedModuleBData) || plan.moduleBData,
          moduleCData: (modC?.structuredInputsJsonb as SavedModuleCData) || plan.moduleCData,
          moduleDData: (modD?.structuredInputsJsonb as SavedModuleDData) || plan.moduleDData,
          moduleEData: (modE?.structuredInputsJsonb as SavedModuleEData) || plan.moduleEData,
          moduleFData: (modF?.structuredInputsJsonb as SavedModuleFData) || plan.moduleFData,
          moduleGData: (modG?.structuredInputsJsonb as SavedModuleGData) || plan.moduleGData,
          moduleHData: (modH?.structuredInputsJsonb as SavedModuleHData) || plan.moduleHData,
          moduleIData: (modI?.structuredInputsJsonb as SavedModuleIData) || plan.moduleIData,
          moduleJData: (modJ?.structuredInputsJsonb as SavedModuleJData) || plan.moduleJData,
          moduleKData: (modK?.structuredInputsJsonb as SavedModuleKData) || plan.moduleKData,
          moduleLData: (modL?.structuredInputsJsonb as SavedModuleLData) || plan.moduleLData,
        };
      }
    }
  } catch (err) {
    console.warn('[AskMyStartup] DB plan fetch error, continuing with snapshot:', err);
  }

  // 4. Compile Plan Context Summary
  const { summary: planContextSummary, availableModules, emptyModules } = compilePlanContextSummary(plan);

  // 5. Authorize Live Gemini Call
  const geminiAuth = await authorizeAndPrepareGeminiCall(
    planId,
    `AskMyStartup: ${trimmedQ.slice(0, 100)}`
  );

  if (!geminiAuth.canCallLiveGemini || !geminiAuth.activeApiKey) {
    const fallbackAnswer = buildDeterministicAnswer(trimmedQ, persona, plan, {
      availableModules,
      emptyModules,
    });
    return {
      success: true,
      answer: fallbackAnswer,
    };
  }

  // 6. Execute Live Gemini Call with Strict Grounding & Boundary Guardrails
  try {
    const ai = getGenAiClient(geminiAuth.activeApiKey);

    const systemPrompt = `You are "Ask My Startup", an executive AI Co-Founder and business plan assistant embedded inside the Startup Preflight platform.

CRITICAL INVARIANTS:
1. STRICT BOUNDARY & TOPIC GUARD:
   - You MUST ONLY answer questions that pertain to the founder's startup, business plan, commercial strategy, unit economics, market opportunity, team, validation, risks, operations, or grant/funding eligibility.
   - If the user asks general world trivia, general science (e.g. "how far is the moon", "what is the capital of France"), jokes, unrelated creative writing, recipes, or anything unrelated to this specific startup venture, you MUST set "isOffTopic": true and politely inform them that you can only answer questions directly concerning their startup.

2. GROUNDING & ZERO-HALLUCINATION:
   - Base your answers STRICTLY on the provided STARTUP PROFILE and MODULES A–L data.
   - Never invent arbitrary financial numbers, team members, or market metrics not supported by the plan context.
   - If the user asks for specific data that has NOT been completed yet (e.g. asking for Year 2 gross profit or CAC when Module H or Module I is empty), explicitly state that this data has not been modeled yet and point them to the exact Module to fill it out.

3. HUMAN-WRITTEN COHERENCE & ZERO AI TEMPLATE CLICHÉS (STRICT):
   - You MUST write in natural, fluent, professional, human English as if drafted by an articulate founder, venture partner, or experienced grant consultant.
   - NEVER use robotic mad-libs phrasing such as "We solve a primary commercial problem: [X] facing [Y]", "Our proprietary solution delivers immediate quantifiable efficiency with an unfair wedge: [Z]", or formulaic fill-in-the-blanks.
   - Founder notes in the plan may be informal, ungrammatical, repetitive, or fragmented (e.g., "Help startups start their startup..."). You MUST rewrite, polish, synthesize, and elevate these raw notes into articulate, cohesive sentences. Never mechanically copy-paste awkward user fragments verbatim.

4. NO RAW ASTERISK SPAM (STRICT):
   - NEVER wrap mid-sentence words, clauses, or entire sentences in bold asterisks (**).
   - Never write sentences like "**Company** is Help startups" or "facing **Entrepreneurs and early stage founders.**".
   - The founder will copy and paste this text directly into real grant applications (e.g. LEO, Enterprise Ireland, Innovate UK), bank loan forms, and investor emails. It must read as clean, unadorned, professional prose.
   - Use bolding ONLY for clean section labels or list prefixes on their own lines (e.g. "### Summary" or "- **Pricing Model:** ..."), NEVER inside running narrative sentences.

5. WORD COUNT INTEGRITY:
   - When the user asks for a specific word count (e.g. "in 150 words" or "in 100 words"), strictly adhere to that constraint (e.g. 120–150 words for 150 words) with complete, polished sentences.

6. PERSONA & TONE:
   - Active Persona: ${persona}
   - ELEVATOR_PITCH: Crisp, compelling, plain English, accessible to anyone, exactly within the requested word count (e.g. 150 words).
   - INVESTOR_DUE_DILIGENCE: Sharp, concise, metrics-driven, defensibility and TAM/SAM/SOM focused.
   - GRANT_ASSESSOR: Aligned with Irish (LEO / Enterprise Ireland) and UK (Innovate UK / Start Up Loans) additionality, export potential, de-risking, and employment.
   - BANK_LENDER: Conservative cashflow, working capital, debt serviceability, and asset backing focus.
   - EXECUTIVE_COFOUNDER: Candid, constructive, highlighting operational bottlenecks and priorities.

7. OUTPUT JSON FORMAT:
You MUST respond with valid JSON matching this exact schema:
{
  "isOffTopic": boolean,
  "answerMarkdown": "Clean, human-written response with zero mid-sentence bolding",
  "citations": [
    {
      "moduleCode": "MOD_A_IDEATION | MOD_B_MARKET | MOD_C_SURVEYS_FEEDBACK | MOD_D_PRODUCT_BUILD | MOD_E_OPERATIONS | MOD_F_COFOUNDER_TEAM | MOD_G_LAUNCHPAD | MOD_H_REVENUE | MOD_I_MARKETING | MOD_J_FINANCE | MOD_K_GRANTS_FUNDING | MOD_L_BUSINESS_PLAN",
      "moduleName": "e.g. Module H: Pricing & Pocket Profit",
      "stepName": "e.g. Step 3 Breakeven Sandbox",
      "relevance": "Why this module was cited"
    }
  ],
  "detectedGaps": [
    "String descriptions of any missing data points in the plan needed to give a more complete answer"
  ],
  "suggestedFollowUps": [
    "2-3 smart follow-up questions the founder or investor should ask next"
  ]
}`;

    const userPrompt = `
=== FOUNDER'S QUESTION ===
"${trimmedQ}"

=== ACTIVE STARTUP PLAN CONTEXT ===
${planContextSummary}

Respond strictly in the requested JSON format. Ensure word count constraints (like "in 150 words") requested by the user are strictly respected.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] },
      ],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
        maxOutputTokens: 2048,
      },
    });

    const text = response.text || '';
    if (!text) {
      throw new Error('Empty response received from Gemini.');
    }

    const parsed = JSON.parse(text) as {
      isOffTopic?: boolean;
      answerMarkdown: string;
      citations?: AskStartupCitation[];
      detectedGaps?: string[];
      suggestedFollowUps?: string[];
    };

    const cleanMarkdown = sanitizeHumanAnswer(parsed.answerMarkdown || '');
    const wordCount = cleanMarkdown.trim().split(/\s+/).filter(Boolean).length;

    const finalAnswer: AskStartupAnswer = {
      id: `ans-${Date.now()}`,
      question: trimmedQ,
      persona,
      answerMarkdown: cleanMarkdown,
      wordCount,
      citations: parsed.citations || [],
      detectedGaps: parsed.detectedGaps || [],
      suggestedFollowUps: parsed.suggestedFollowUps || [],
      isOffTopic: Boolean(parsed.isOffTopic),
      aiEngineUsed: 'gemini-2.5-flash',
      createdAt: new Date().toISOString(),
    };

    return {
      success: true,
      answer: finalAnswer,
    };
  } catch (err) {
    console.error('[AskMyStartup] Live Gemini call error, falling back:', err);
    const fallbackAnswer = buildDeterministicAnswer(trimmedQ, persona, plan, {
      availableModules,
      emptyModules,
    });
    return {
      success: true,
      answer: fallbackAnswer,
    };
  }
}
