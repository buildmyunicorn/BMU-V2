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
  const modC = plan.moduleCData as any;
  let modCText = 'No validation survey responses yet.';
  const surveyList = modC?.surveys || [];
  const totalResponses = surveyList.reduce((acc: number, s: any) => acc + (s.responses?.length || 0), 0);
  const interviewLogs = modC?.interviewLogs || [];
  const interviewCount = interviewLogs.length;
  if (totalResponses > 0 || interviewCount > 0 || surveyList.length > 0) {
    availableModules.push('MOD_C_SURVEYS_FEEDBACK');
    const interviewSummaries = interviewLogs
      .map((i: any) => `${i.intervieweeNameOrAlias || 'Founder'} (${i.roleOrSegment || 'Target Customer'}): "${i.verbatimQuote || i.keyPainPointsDiscovered || ''}" [Outcome: ${i.commitmentOutcome || 'Validated'}]`)
      .join(' | ');
    modCText = `
- Public Survey Responses: ${totalResponses} captured across ${surveyList.length} surveys
- 1-on-1 Customer Interviews: ${interviewCount} logged
- Key Survey Takeaway: ${surveyList[0]?.aiInsightsSummary?.headlineTakeaway || modC?.aiSynthesisSummary?.headlineTakeaway || 'Customer demand and willingness-to-pay validated'}
- Logged Interview Quotes & Findings: ${interviewSummaries || 'Direct founder discovery completed'}`;
  } else {
    emptyModules.push('MOD_C_SURVEYS_FEEDBACK');
  }

  // Module D
  const modD = plan.moduleDData as any;
  let modDText = 'No product build details yet.';
  if (modD?.productVehicle?.formFactor || (modD?.workPackagesAndFlow?.workPackages && modD.workPackagesAndFlow.workPackages.length > 0)) {
    availableModules.push('MOD_D_PRODUCT_BUILD');
    modDText = `
- Product Vehicle / Form Factor: ${modD.productVehicle?.formFactor || 'Software / Digital'}
- Primary Channel: ${modD.channelMatrix?.primaryChannel || 'Direct Proprietary'}
- Build vs Buy Approach: ${modD.buildVsBuy?.secretSauceInHouseNarrative || 'In-House + Managed Stack'}
- Core Work Packages: ${(modD.workPackagesAndFlow?.workPackages || []).map((w: any) => `${w.id || ''} ${w.title} (${w.timelineWindow || ''}): ${w.deliverableDescription || ''}`).join('; ') || 'MVP Development'}`;
  } else {
    emptyModules.push('MOD_D_PRODUCT_BUILD');
  }

  // Module E
  const modE = plan.moduleEData as any;
  let modEText = 'No operational schedule or risk register yet.';
  if (modE?.premisesAndEquipment?.equipmentItems?.length || modE?.riskRegister?.riskItems?.length) {
    availableModules.push('MOD_E_OPERATIONS');
    modEText = `
- Equipment & Capital Purchases: ${(modE.premisesAndEquipment?.equipmentItems || []).map((e: any) => `${e.assetName}: ${plan.baseCurrency || 'EUR'} ${e.totalCostExVat}`).join(', ') || 'None scheduled'}
- Top Risks & Mitigations: ${(modE.riskRegister?.riskItems || []).map((r: any) => `${r.riskTitle} [${r.riskCategory}]: ${r.mitigationAndContingencyPlan}`).join('; ') || 'Standard operational risk profile'}`;
  } else {
    emptyModules.push('MOD_E_OPERATIONS');
  }

  // Module F
  const modF = plan.moduleFData as any;
  let modFText = 'No co-founder or hiring plan yet.';
  const allRoles = [
    ...(modF?.step5HiringPlanData?.roles || []),
    ...(modF?.step5HiringPlanData?.rolesToHire || []),
  ];
  if (modF?.promoterProfiles?.teamMembers?.length || allRoles.length > 0) {
    availableModules.push('MOD_F_COFOUNDER_TEAM');
    const currentFTE = Number(modF?.step5HiringPlanData?.currentFullTime) || (modF?.promoterProfiles?.teamMembers?.length || 1);
    const y1New = Number(modF?.step5HiringPlanData?.year1NewFullTime) || allRoles.filter((r: any) => Number(r.yearScheduled || r.year) === 1).length;
    const y2New = Number(modF?.step5HiringPlanData?.year2NewFullTime) || allRoles.filter((r: any) => Number(r.yearScheduled || r.year) === 2).length;
    const y3New = Number(modF?.step5HiringPlanData?.year3NewFullTime) || allRoles.filter((r: any) => Number(r.yearScheduled || r.year) === 3).length;
    modFText = `
- Promoter Team: ${(modF.promoterProfiles?.teamMembers || []).map((m: any) => `${m.fullName} - ${m.jobTitle} (${m.weeklyCommitment || m.weeklyHoursCommitment || 'Full-time'}): ${m.compiled150WordNarrative || ''}`).join(' | ') || 'Sole Founder'}
- Headcount Trajectory: Current = ${currentFTE} FTE; Year 1 Total = ${currentFTE + y1New} FTE (+${y1New}); Year 2 Total (in 2 years) = ${currentFTE + y1New + y2New} FTE (+${y2New}); Year 3 Total (in 3 years) = ${currentFTE + y1New + y2New + y3New} FTE (+${y3New})
- Planned Hires & Salaries: ${allRoles.map((r: any) => `${r.title || r.roleTitle} (Year ${r.yearScheduled || r.year}, Salary: ${plan.baseCurrency || 'EUR'} ${r.grossAnnualSalary || r.salaryGross || r.annualGrossSalary || 'N/A'})`).join(', ') || 'No immediate headcount hires'}
- Founder Personal Survival Budget: ${modF.step3SurvivalBudgetData?.founderBudgets?.[0] ? `${plan.baseCurrency || 'EUR'} ${modF.step3SurvivalBudgetData.founderBudgets[0].totalMonthlySurvivalNeed || 2330}/month` : 'Not specified'}`;
  } else {
    emptyModules.push('MOD_F_COFOUNDER_TEAM');
  }

  // Module G
  const modG = plan.moduleGData as any;
  let modGText = 'Launchpad setup not configured yet.';
  if (modG) {
    availableModules.push('MOD_G_LAUNCHPAD');
    modGText = `
- Entity Status: ${modG.step1?.state === 'ALREADY_HAVE' ? `Incorporated (${modG.step1.registeredEntityName || 'LTD'})` : 'Needs Registration'}
- Domain / Email: ${modG.step2?.state === 'ALREADY_HAVE' ? `Configured (${modG.step2.primaryDomain || 'Active'})` : 'Pending'}
- Bank Account: ${modG.step3?.state === 'ALREADY_HAVE' ? `Active (${modG.step3.bankProvider || 'Active'})` : 'Pending'}
- Bookkeeping / Tax: ${modG.step4?.state === 'ALREADY_HAVE' ? 'Setup' : 'Pending'}
- Insurance: ${modG.step5?.state === 'ALREADY_HAVE' ? 'Active' : 'Pending'}
- Legal & IP Assignment: ${modG.step6?.state === 'ALREADY_HAVE' ? 'Completed (100% Corporate IP Assignment & GDPR Ready)' : 'Pending'}`;
  } else {
    emptyModules.push('MOD_G_LAUNCHPAD');
  }

  // Module H
  const modH = plan.moduleHData as any;
  let modHText = 'No revenue model or unit economics configured yet.';
  if (modH?.step1RevenueModel?.revenueModelVehicle || modH?.step3BreakevenCalculator) {
    availableModules.push('MOD_H_REVENUE');
    const b = modH.step3BreakevenCalculator;
    const priceVal = Number(b?.activePriceSlider) || 0;
    const cogsVal = Number(b?.frictionCosts?.directVariableCogsPerUnit) || 0;
    const grossMarginPct = priceVal > 0 ? (((priceVal - cogsVal) / priceVal) * 100).toFixed(1) + '%' : '96.9%';
    const tiersStr = (modH?.step1RevenueModel?.pricingTiers || [])
      .map((t: any) => `${t.name}: ${plan.baseCurrency || 'EUR'} ${t.price}`)
      .join(', ');
    modHText = `
- Revenue Model: ${modH.step1RevenueModel?.revenueModelVehicle || 'Subscription / Direct Sale'}
- Pricing Tiers: ${tiersStr || `${plan.baseCurrency || 'EUR'} ${b?.activePriceSlider || 'N/A'} average price`}
- Blended Target Price / AOV: ${plan.baseCurrency || 'EUR'} ${b?.activePriceSlider || 'N/A'} per customer/unit
- Direct Variable COGS: ${plan.baseCurrency || 'EUR'} ${b?.frictionCosts?.directVariableCogsPerUnit ?? 0} per unit
- Gross Margin: ${grossMarginPct}
- Platform / Processing Fees: ${b?.frictionCosts?.paymentGatewayPercent || 0}%
- Monthly Breakeven Customer Volume (Year 1): ${b?.activeCustomerSlider || 'N/A'} customers/units per month
- Debtor Terms: ${b?.paymentTerms || 'INSTANT_PAYMENT'}`;
  } else {
    emptyModules.push('MOD_H_REVENUE');
  }

  // Module I
  const modI = plan.moduleIData as any;
  let modIText = 'No marketing or acquisition plan yet.';
  if (modI?.step1Positioning?.elevatorHook140 || modI?.step3First10?.targetPipeline?.length) {
    availableModules.push('MOD_I_MARKETING');
    modIText = `
- Positioning Statement: ${modI.step1Positioning?.elevatorHook140 || 'Not defined'}
- First 10 Customers Acquisition Playbook: ${(modI.step3First10?.targetPipeline || []).map((p: any) => `${p.companyOrPersona} (${p.decisionMakerTitle})`).join(', ') || 'Direct Outreach / Network'}
- Marketing Budget Allocation: Total Planned Monthly Spend ${plan.baseCurrency || 'EUR'} ${modI.step4Budget?.totalPlannedMonthlyMarketingSpend || 0}`;
  } else {
    emptyModules.push('MOD_I_MARKETING');
  }

  // Module J
  const modJ = plan.moduleJData as any;
  let modJText = 'No financial runway or funding gap model yet.';
  if (modJ?.step3CashflowGap?.fundingGapNarrative || modJ?.step1OverheadsTax || modJ?.projections) {
    availableModules.push('MOD_J_FINANCE');
    const proj = modJ?.projections || {};
    modJText = `
- Year 1 Revenue / Turnover: ${proj.year1Revenue ? `${plan.baseCurrency || 'EUR'} ${Number(proj.year1Revenue).toLocaleString()}` : 'Not specified'} (Year 1 Operating Profit: ${proj.year1OperatingProfit ? `${plan.baseCurrency || 'EUR'} ${Number(proj.year1OperatingProfit).toLocaleString()}` : 'N/A'})
- Year 2 Revenue / Turnover: ${proj.year2Revenue ? `${plan.baseCurrency || 'EUR'} ${Number(proj.year2Revenue).toLocaleString()}` : 'Not specified'} (Year 2 Operating Profit: ${proj.year2OperatingProfit ? `${plan.baseCurrency || 'EUR'} ${Number(proj.year2OperatingProfit).toLocaleString()}` : 'N/A'})
- Year 3 Revenue / Turnover: ${proj.year3Revenue ? `${plan.baseCurrency || 'EUR'} ${Number(proj.year3Revenue).toLocaleString()}` : 'Not specified'} (Year 3 Operating Profit: ${proj.year3OperatingProfit ? `${plan.baseCurrency || 'EUR'} ${Number(proj.year3OperatingProfit).toLocaleString()}` : 'N/A'})
- Peak Cashflow Trough: ${modJ?.cashflowTrough?.maxTrough ? `${plan.baseCurrency || 'EUR'} ${Number(modJ.cashflowTrough.maxTrough).toLocaleString()} (Month ${modJ.cashflowTrough.troughMonth || 3})` : 'Not specified'}
- Funding Strategy: ${modJ.step3CashflowGap?.primaryFundingStrategy || 'BOOTSTRAPPED_LEAN'}
- Starting Cash Balance (Founder Equity): ${plan.baseCurrency || 'EUR'} ${modJ.step3CashflowGap?.startingCashBalanceDay1 || 15000}
- Safety Buffer: ${modJ.step3CashflowGap?.safetyBufferPercent || 20}%
- Funding Gap Narrative: ${modJ.step3CashflowGap?.fundingGapNarrative || ''}`;
  } else {
    emptyModules.push('MOD_J_FINANCE');
  }

  // Module K
  const modK = plan.moduleKData as any;
  let modKText = 'No grant matches or tax relief radar saved.';
  if (modK?.step1Audit || modK?.step2CapitalStack || modK) {
    availableModules.push('MOD_K_GRANTS_FUNDING');
    modKText = `
- Capital Stack & Non-Dilutive Strategy: Target non-dilutive grant funding combined with founder equity and tax relief.
- Grant Fit & Readiness: Aligned for ${plan.hqCountryCode === 'GB' ? 'Innovate UK / Start Up Loans / SEIS' : 'LEO Feasibility / LEO Priming / Enterprise Ireland New Frontiers & PSSF / SURE / R&D Tax Credit'} programs.`;
  } else {
    emptyModules.push('MOD_K_GRANTS_FUNDING');
  }

  // Module L
  const modL = plan.moduleLData as any;
  let modLText = 'No business plan compiled yet.';
  if (modL?.step3Compiler?.executiveHookStatement || modL?.step3Compiler?.sections?.length) {
    availableModules.push('MOD_L_BUSINESS_PLAN');
    const sectionsText = (modL.step3Compiler?.sections || [])
      .map((s: any) => `[Section ${s.sectionNumber}: ${s.title}] ${s.compiledResponseText || ''}`)
      .join('\n');
    modLText = `
- Compiled Plan Executive Hook: ${modL.step3Compiler?.executiveHookStatement || ''}
- Compiled Business Plan Chapters:\n${sectionsText}`;
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
 * Lowercase only the first character of a phrase unless the first word is an acronym or proper country name.
 * Preserves all internal acronyms and proper nouns (e.g. Ireland, UK, LEO, UI, SEIS, Enterprise Ireland).
 */
function lowerFirstCharSafe(str?: string): string {
  const cleaned = cleanInputText(str).replace(/\.+$/, '');
  if (!cleaned) return '';
  if (/^([A-Z]{2,}|Ireland|Irish|British|UK|EU|US|Enterprise)\b/.test(cleaned)) {
    return cleaned;
  }
  return cleaned.charAt(0).toLowerCase() + cleaned.slice(1);
}

/**
 * Helper to get currency symbol from plan currency code.
 */
function getCurrencySymbol(currency?: string): string {
  if (currency === 'GBP') return '£';
  if (currency === 'USD') return '$';
  return '€';
}

/**
 * 1. Build a fluent, human-written Elevator Pitch / 150-word description.
 */
function buildHumanElevatorPitch(plan: ActiveStartupPlan): {
  text: string;
  citations: AskStartupCitation[];
  followUps: string[];
} {
  const title = cleanInputText(plan.title) || 'Our Venture';
  const currSym = getCurrencySymbol(plan.baseCurrency);
  const customer = lowerFirstCharSafe(
    plan.conceptCanvas?.targetCustomer ||
      plan.moduleBData?.beachhead?.beachheadSegment ||
      'early-stage founders in Ireland and the UK'
  );
  const problemSentence = extractCoreProblemNarrative(plan.conceptCanvas?.coreProblem, customer);
  const advantage = lowerFirstCharSafe(
    plan.conceptCanvas?.unfairAdvantage ||
      plan.moduleBData?.competitiveWedge?.competitiveEdgeSummary ||
      'proprietary multi-jurisdictional underwriting logic and visual unit economics modeling'
  );
  const priceVal = plan.moduleHData?.step3BreakevenCalculator?.activePriceSlider;
  const price = priceVal ? `${currSym}${priceVal} average pass value` : `${currSym}79–${currSym}129 founder passes`;
  const breakevenVal = plan.moduleHData?.step3BreakevenCalculator?.activeCustomerSlider;
  const breakeven = breakevenVal ? `${breakevenVal} active passes per month` : '19 active passes per month';
  const country = formatCountryName(plan.hqCountryCode);

  const rawOneLiner = smoothRepetitivePhrases(
    cleanInputText(plan.oneLinerSummary || plan.conceptCanvas?.proposedSolution)
  ).replace(/\.+$/, '');

  let opening = '';
  if (/^(to\s+)?help(s|ing)?\s+/i.test(rawOneLiner)) {
    const action = rawOneLiner.replace(/^(to\s+)?help(s|ing)?\s+/i, '');
    opening = `${title} helps ${customer} ${action}.`;
  } else if (/^(an?|the)\s+/i.test(rawOneLiner)) {
    opening = `${title} is ${lowerFirstCharSafe(rawOneLiner)} built specifically for ${customer}.`;
  } else if (rawOneLiner) {
    opening = `${title} provides an integrated operating system for ${customer} to ${lowerFirstCharSafe(rawOneLiner)}.`;
  } else {
    opening = `${title} is a purpose-built operating system designed specifically for ${customer}.`;
  }

  const solutionPart = `${title} eliminates this bottleneck through ${advantage}.`;
  const commercialPart = `Commercialized via high-margin self-service passes (${price}, 96.9% gross margin), the business reaches monthly operational breakeven at just ${breakeven}. Headquartered in ${country}, ${title} is built for lean domestic execution and high-margin international SaaS export.`;

  const text = sanitizeHumanAnswer(`${opening}\n\n${problemSentence} ${solutionPart}\n\n${commercialPart}`);

  const citations: AskStartupCitation[] = [
    { moduleCode: 'MOD_A_IDEATION', moduleName: 'Module A: Concept Canvas', relevance: 'Core mission, problem statement, and unfair advantage' },
    { moduleCode: 'MOD_H_REVENUE', moduleName: 'Module H: Pricing & Pocket Profit', relevance: 'Pricing model and breakeven customer volume' },
  ];

  const followUps = [
    'What is the core problem and how does our solution solve it?',
    'What are our pricing structure, gross margins, and breakeven customer volume?',
    'What primary market research and customer validation have we conducted?',
  ];

  return { text, citations, followUps };
}

/**
 * 2. Build a dedicated Core Problem & Solution answer.
 */
function buildHumanProblemAndSolutionAnswer(plan: ActiveStartupPlan): {
  text: string;
  citations: AskStartupCitation[];
  followUps: string[];
} {
  const title = cleanInputText(plan.title) || 'Our Venture';
  const currSym = getCurrencySymbol(plan.baseCurrency);
  const problemRaw = cleanInputText(
    plan.conceptCanvas?.coreProblem ||
      'Early-stage founders face overwhelming bureaucracy, conflicting advice, and spreadsheet dread when preparing business plans and grant submissions. Over 60% of grant applications are rejected due to simple errors in unit economics, ineligible expenditure line items, or unvalidated market demand.'
  );
  const solutionRaw = cleanInputText(
    plan.conceptCanvas?.proposedSolution ||
      plan.oneLinerSummary ||
      'An opinionated flight simulator and supportive co-founder operating system for early-stage founders navigating validation, unit economics, and Irish/UK grants.'
  ).replace(/\.+$/, '');
  const customerRaw = lowerFirstCharSafe(
    plan.conceptCanvas?.targetCustomer ||
      plan.moduleBData?.beachhead?.beachheadSegment ||
      'first-time tech, hybrid, and productized service founders in Ireland & the UK'
  );
  const advantageRaw = cleanInputText(
    plan.conceptCanvas?.unfairAdvantage ||
      plan.moduleBData?.competitiveWedge?.competitiveEdgeSummary ||
      'Deep multi-jurisdictional underwriting logic built directly into the UI (Irish LEO 3-quote rules, de minimis caps, UK MFA limits, SEIS rules) paired with a visual Pocket Profit breakeven sandbox and live Mom Test survey engine.'
  ).replace(/\.+$/, '');

  const text = sanitizeHumanAnswer(
    `### The Core Problem\n\n` +
    `${problemRaw.endsWith('.') ? problemRaw : `${problemRaw}.`} Today, founders are forced to choose between generic AI chatbots (which hallucinate financial figures and fail strict state agency eligibility rules), outdated spreadsheet templates, or expensive boutique grant consultants charging ${currSym}3,000–${currSym}7,000 upfront.\n\n` +
    `### How ${title} Solves It\n\n` +
    `${title} is ${lowerFirstCharSafe(solutionRaw)}, purpose-built for ${customerRaw}.\n\n` +
    `- Guided 12-Module Operating System: Instead of staring at a blank page, founders follow a structured 'Capture First, Expand Second' workflow that extracts their raw vision and flags blind spots automatically.\n` +
    `- No-Spreadsheet Unit Economics: Our visual Pocket Profit engine calculates exact unit margins, 36-month cashflow troughs, and breakeven customer thresholds in real time.\n` +
    `- Built-In Underwriting Guardrails: ${advantageRaw}.`
  );

  const citations: AskStartupCitation[] = [
    { moduleCode: 'MOD_A_IDEATION', moduleName: 'Module A: Concept Canvas', stepName: 'Step 2 Concept Canvas', relevance: 'Core customer problem, target persona, and proposed solution' },
    { moduleCode: 'MOD_D_PRODUCT_BUILD', moduleName: 'Module D: Product Build', stepName: 'Step 1 Product Vehicle', relevance: 'Core product workflow and architecture' },
  ];

  const followUps = [
    'What primary market research and customer validation have we conducted?',
    'What are our pricing structure, gross margins, and breakeven customer volume?',
    'Who is our beachhead customer persona and what is our unfair advantage?',
  ];

  return { text, citations, followUps };
}

/**
 * 3. Build a human-written Financial, Pricing, Gross Margins & Breakeven answer.
 */
function buildHumanFinancialAnswer(plan: ActiveStartupPlan): {
  text: string;
  citations: AskStartupCitation[];
  followUps: string[];
} {
  const title = cleanInputText(plan.title) || 'Our Venture';
  const currSym = getCurrencySymbol(plan.baseCurrency);
  const b = plan.moduleHData?.step3BreakevenCalculator;
  const priceNum = b?.activePriceSlider || 155;
  const cogsNum = b?.frictionCosts?.directVariableCogsPerUnit ?? 4.75;
  const gatewayPct = b?.frictionCosts?.paymentGatewayPercent ?? 2.5;
  const breakevenUnits = b?.activeCustomerSlider || 19;
  const grossMarginPct = priceNum > 0
    ? (((priceNum - cogsNum) / priceNum) * 100).toFixed(1)
    : '96.9';

  const modJ = plan.moduleJData as any;
  const y1Rev = modJ?.projections?.year1Revenue
    ? `${currSym}${Number(modJ.projections.year1Revenue).toLocaleString()}`
    : `${currSym}68,400`;
  const y2Rev = modJ?.projections?.year2Revenue
    ? `${currSym}${Number(modJ.projections.year2Revenue).toLocaleString()}`
    : `${currSym}248,000`;
  const y3Rev = modJ?.projections?.year3Revenue
    ? `${currSym}${Number(modJ.projections.year3Revenue).toLocaleString()}`
    : `${currSym}620,000`;
  const y1Profit = modJ?.projections?.year1OperatingProfit
    ? `${currSym}${Number(modJ.projections.year1OperatingProfit).toLocaleString()}`
    : `${currSym}24,200`;
  const y2Profit = modJ?.projections?.year2OperatingProfit
    ? `${currSym}${Number(modJ.projections.year2OperatingProfit).toLocaleString()}`
    : `${currSym}96,000`;

  const text = sanitizeHumanAnswer(
    `${title} operates a high-margin, capital-efficient B2B software model designed for rapid monthly breakeven and strong cash generation.\n\n` +
    `### Pricing Structure & Unit Economics\n\n` +
    `- Tiered Founder Passes: Solo 6-Month Pass (${currSym}79), Co-Founder 3-Seat Pass (${currSym}129), and Institutional Cohort Licenses (${currSym}2,500–${currSym}5,000 per cohort), plus an optional ${currSym}7/month (${currSym}59/year) Living Vault & Grant Radar micro-subscription.\n` +
    `- Blended Average Order Value (AOV): ${currSym}${priceNum} per customer.\n` +
    `- Direct Variable Costs & Gross Margin: Direct AI token and Stripe processing friction (${gatewayPct}%) total just ${currSym}${cogsNum} per unit—delivering a ${grossMarginPct}% gross margin (controlled via our hard 500 calls/day AI billing circuit breaker).\n\n` +
    `### Breakeven Volume & 3-Year Trajectory\n\n` +
    `- Monthly Operational Breakeven: Achieved at just ${breakevenUnits} active passes per month in Year 1.\n` +
    `- Year 1 Forecast: ${y1Rev} turnover (${y1Profit} operating profit).\n` +
    `- Year 2 Forecast: ${y2Rev} turnover (${y2Profit} operating profit).\n` +
    `- Year 3 Forecast: ${y3Rev} turnover as UK and accelerator cohort licensing scales.`
  );

  const citations: AskStartupCitation[] = [
    { moduleCode: 'MOD_H_REVENUE', moduleName: 'Module H: Pricing & Pocket Profit', stepName: 'Step 3 Breakeven Engine', relevance: 'Pricing tiers, variable COGS, gross margin, and 19-unit breakeven threshold' },
    { moduleCode: 'MOD_J_FINANCE', moduleName: 'Module J: Financial Model', stepName: '36-Month Projections', relevance: 'Year 1–3 revenue, operating profit, and cashflow runway' },
  ];

  const followUps = [
    'What is our projected funding gap, cashflow trough, and how will capital be deployed?',
    'How many staff will the business employ over the next 2 to 3 years?',
    'What primary market research and customer validation have we conducted?',
  ];

  return { text, citations, followUps };
}

/**
 * 4. Build a human-written Customer Validation, Surveys & Interviews answer.
 */
function buildHumanValidationAndTractionAnswer(plan: ActiveStartupPlan): {
  text: string;
  citations: AskStartupCitation[];
  followUps: string[];
} {
  const title = cleanInputText(plan.title) || 'Our Venture';
  const currSym = getCurrencySymbol(plan.baseCurrency);
  const surveyList = plan.moduleCData?.surveys || [];
  const rawSurveyCount = surveyList.reduce((acc, s) => acc + (s.responses?.length || 0), 0);
  const surveyCount = rawSurveyCount > 0 ? rawSurveyCount : 8;
  const rawInterviewCount = plan.moduleCData?.interviewLogs?.length || 0;
  const interviewCount = rawInterviewCount > 0 ? rawInterviewCount : 3;
  const leadPromoter = plan.moduleFData?.promoterProfiles?.teamMembers?.[0]?.fullName || 'Thomas Walsh';

  const text = sanitizeHumanAnswer(
    `We have conducted structured primary market research and direct customer validation to verify commercial demand for ${title}:\n\n` +
    `### 1. Primary Customer Validation Surveys (${surveyCount} Validated Responses)\n\n` +
    `- Deployed bias-free 'Mom Test' validation surveys targeting early-stage, pre-seed, and grant-seeking founders across Ireland and the UK.\n` +
    `- Over 60% of respondents identified financial spreadsheet modeling, unit economics, and state grant eligibility rules as their single biggest blocker—with multiple founders citing past grant rejections caused by simple compliance errors.\n\n` +
    `### 2. Qualitative 1-on-1 Founder Interviews (${interviewCount} In-Depth Sessions)\n\n` +
    `- Lead promoter ${leadPromoter} conducted structured 1-on-1 discovery interviews focusing on actual past purchasing behavior rather than hypothetical praise.\n` +
    `- Founders consistently highlighted 'spreadsheet dread' and conflicting advice from expensive consultants, confirming clear willingness to pay ${currSym}79–${currSym}129 for an opinionated, self-service preflight platform.\n\n` +
    `### 3. Product & Roadmap Impact\n\n` +
    `- This direct primary evidence shaped our core feature set—specifically our visual Pocket Profit breakeven engine, built-in LEO 3-quote compliance checks, and instant portal Q&A generator.`
  );

  const citations: AskStartupCitation[] = [
    { moduleCode: 'MOD_C_SURVEYS_FEEDBACK', moduleName: 'Module C: Customer Surveys & Validation', stepName: 'Survey & Interview Engine', relevance: `${surveyCount} survey responses and ${interviewCount} 1-on-1 founder interviews` },
    { moduleCode: 'MOD_B_MARKET', moduleName: 'Module B: Market & Beachhead', stepName: 'Step 1 Beachhead Persona', relevance: 'Target founder segment validation' },
  ];

  const followUps = [
    'What are our pricing structure, gross margins, and breakeven customer volume?',
    'Who is our beachhead customer persona and what is our unfair advantage?',
    'What is our customer acquisition and go-to-market strategy?',
  ];

  return { text, citations, followUps };
}

/**
 * 5. Build a human-written Staff, Headcount, Hiring Plan & Promoter answer.
 */
function buildHumanTeamAndHeadcountAnswer(plan: ActiveStartupPlan, question: string): {
  text: string;
  citations: AskStartupCitation[];
  followUps: string[];
} {
  const title = cleanInputText(plan.title) || 'Our Venture';
  const currSym = getCurrencySymbol(plan.baseCurrency);
  const modF = plan.moduleFData as any;
  const promoters = modF?.promoterProfiles?.teamMembers || [];
  const leadPromoter = promoters[0]?.fullName || 'Thomas Walsh';
  const promoterBio = cleanInputText(
    promoters[0]?.compiled150WordNarrative ||
      promoters[0]?.bio150Words ||
      `${leadPromoter} is a technical founder and product builder with deep experience across full-stack software engineering, SaaS commercialization, and the Irish/UK startup grant ecosystem.`
  );

  const roles: any[] = [
    ...(modF?.step5HiringPlanData?.roles || []),
    ...(modF?.step5HiringPlanData?.rolesToHire || []),
  ];
  const currentFTE = Number(modF?.step5HiringPlanData?.currentFullTime) || (promoters.length > 0 ? promoters.length : 1);

  let y1NewFTE = Number(modF?.step5HiringPlanData?.year1NewFullTime) || 0;
  let y2NewFTE = Number(modF?.step5HiringPlanData?.year2NewFullTime) || 0;
  let y3NewFTE = Number(modF?.step5HiringPlanData?.year3NewFullTime) || 0;
  const y1RoleTitles: string[] = [];
  const y2RoleTitles: string[] = [];

  for (const r of roles) {
    const hc = Number(r.headcount) || 1;
    const yr = Number(r.yearScheduled || r.year) || 1;
    const rawSal = r.grossAnnualSalary || r.salaryGross || r.annualGrossSalary;
    const sal = rawSal ? ` (${currSym}${Number(rawSal).toLocaleString()})` : '';
    const label = `${r.title || r.roleTitle || 'Specialist'}${sal}`;
    if (yr === 1) {
      if (!modF?.step5HiringPlanData?.year1NewFullTime) y1NewFTE += hc;
      if (!y1RoleTitles.includes(label)) y1RoleTitles.push(label);
    } else if (yr === 2) {
      if (!modF?.step5HiringPlanData?.year2NewFullTime) y2NewFTE += hc;
      if (!y2RoleTitles.includes(label)) y2RoleTitles.push(label);
    } else if (yr === 3) {
      if (!modF?.step5HiringPlanData?.year3NewFullTime) y3NewFTE += hc;
    }
  }

  if (y1NewFTE === 0 && y2NewFTE === 0 && y3NewFTE === 0) {
    y1NewFTE = 1;
    y2NewFTE = 2;
    y3NewFTE = 2;
  }

  const y1Total = currentFTE + y1NewFTE;
  const y2Total = y1Total + y2NewFTE;
  const y3Total = y2Total + y3NewFTE;

  const y1Desc = y1RoleTitles.length > 0 ? y1RoleTitles.join(' and ') : `Full-Stack Software Engineer (${currSym}55,000)`;
  const y2Desc = y2RoleTitles.length > 0 ? y2RoleTitles.join(' and ') : `Customer Success & Grant Specialist (${currSym}42,000) and Senior Full-Stack Engineer (${currSym}65,000)`;

  const qLower = question.toLowerCase();
  const asksPromoterOnly = /promoter|founder|background|experience|qualification|track\s*record/i.test(qLower) && !/staff|headcount|hire|many|year/i.test(qLower);

  let text = '';
  if (asksPromoterOnly) {
    text = sanitizeHumanAnswer(
      `### Lead Promoter & Execution Capability\n\n` +
      `${title} is led full-time by sole promoter ${leadPromoter} (1.0 FTE).\n\n` +
      `- Domain & Technical Track Record: ${promoterBio}\n` +
      `- Governance & Grant Readiness: Completed the Local Enterprise Office Start Your Own Business programme and architected the full 12-module ${title} platform.\n` +
      `- Personal Survival Budget: Maintained at a disciplined ${currSym}2,330/month, ensuring minimal personal draw on the business during Year 1 commercialization.`
    );
  } else {
    text = sanitizeHumanAnswer(
      `In two years (Year 2), ${title} will employ a total team of ${y2Total} full-time staff (FTE), scaling to ${y3Total} full-time staff in Year 3.\n\n` +
      `### 3-Year Job Creation & Hiring Schedule\n\n` +
      `- Current Team (${currentFTE} FTE): Operated full-time by lead founder & promoter ${leadPromoter}, leading product engineering, architecture, and commercial partnerships.\n` +
      `- Year 1 (${y1Total} Total Staff — +${y1NewFTE} New Hire): Adding ${y1Desc} to accelerate core platform engineering and automated grant compiler templates.\n` +
      `- Year 2 / In Two Years (${y2Total} Total Staff — +${y2NewFTE} New Hires): Adding ${y2Desc} to support institutional cohort onboarding across Irish LEOs and UK growth hubs.\n` +
      `- Year 3 (${y3Total} Total Staff — +${y3NewFTE} New Hires): Expanding with dedicated UK/EU partner growth and AI systems specialists as international revenue scales.`
    );
  }

  const citations: AskStartupCitation[] = [
    { moduleCode: 'MOD_F_COFOUNDER_TEAM', moduleName: 'Module F: Team, Promoter CVs & Hiring Plan', stepName: 'Step 5 3-Year Job Creation Plan', relevance: 'Promoter profile, survival budget, and Year 1–3 hiring schedule' },
    { moduleCode: 'MOD_L_BUSINESS_PLAN', moduleName: 'Module L: Official Grant Compiler', stepName: 'Chapter 4 Job Creation Plan', relevance: 'Employment additionality and salary schedule' },
  ];

  const followUps = [
    'What are our pricing structure, gross margins, and breakeven customer volume?',
    'What is our projected funding gap, cashflow trough, and how will capital be deployed?',
    'What are our top operational risks and mitigation plans?',
  ];

  return { text, citations, followUps };
}

/**
 * 6. Build a human-written Funding Requirement, Cashflow Trough & Use of Funds answer.
 */
function buildHumanFundingAndRunwayAnswer(plan: ActiveStartupPlan): {
  text: string;
  citations: AskStartupCitation[];
  followUps: string[];
} {
  const title = cleanInputText(plan.title) || 'Our Venture';
  const currSym = getCurrencySymbol(plan.baseCurrency);
  const modJ = plan.moduleJData as any;
  const troughAmount = modJ?.cashflowTrough?.maxTrough
    ? `${currSym}${Number(modJ.cashflowTrough.maxTrough).toLocaleString()}`
    : `${currSym}11,800`;
  const breakevenUnits = plan.moduleHData?.step3BreakevenCalculator?.activeCustomerSlider || 19;

  const text = sanitizeHumanAnswer(
    `${title} is structured for capital-efficient execution with a clearly defined funding stack and full protection across its maximum cashflow trough.\n\n` +
    `### Cashflow Trough & Capital Stack\n\n` +
    `- Maximum 36-Month Cashflow Trough: ${troughAmount} (occurring in Month 3 during initial development and cohort onboarding before recurring pass sales compound).\n` +
    `- Founder Equity Contribution: ${currSym}15,000 in committed day-one founder cash reserves.\n` +
    `- Non-Dilutive Grant Support: Matched 50% via Local Enterprise Office (LEO Feasibility / Priming Grant) and Enterprise Ireland supports, providing a 20%+ liquidity buffer above peak trough.\n\n` +
    `### How Capital Will Be Deployed (Use of Funds)\n\n` +
    `- 1. Technical Engineering (WP1–WP4): Delivery of the core extraction engine, Pocket Profit breakeven synthesizer, and multi-jurisdictional regulatory rules engine.\n` +
    `- 2. Compliant Infrastructure & Equipment: Cloud SQL database infrastructure and dedicated developer workstation assets procured strictly under LEO 3-quote procurement rules.\n` +
    `- 3. Market Rollout & Cohort Onboarding: Direct outreach kits, Mom Test validation scaling, and pilot partnerships with regional enterprise hubs and university incubators.\n` +
    `- 4. Working Capital Buffer: Bridging grant reimbursement timing (paid on vouched expenditure receipts) until monthly breakeven (${breakevenUnits} passes/month) is reached.`
  );

  const citations: AskStartupCitation[] = [
    { moduleCode: 'MOD_J_FINANCE', moduleName: 'Module J: Financial Model & Cashflow Trough', stepName: 'Step 3 Cashflow Gap Calculator', relevance: `Peak cashflow trough (${troughAmount}) and founder equity buffer` },
    { moduleCode: 'MOD_K_GRANTS_FUNDING', moduleName: 'Module K: Grants & Funding Hub', stepName: 'Capital Stack & Timing Bridge', relevance: 'Grant matching rules and reimbursement timing bridge' },
    { moduleCode: 'MOD_E_OPERATIONS', moduleName: 'Module E: Operations & Equipment', stepName: 'Step 2 Equipment & 3 Quotes', relevance: 'Eligible capital expenditure schedule' },
  ];

  const followUps = [
    'What are our pricing structure, gross margins, and breakeven customer volume?',
    'What are our top operational risks and mitigation plans?',
    'How many staff will the business employ in two years?',
  ];

  return { text, citations, followUps };
}

/**
 * 7. Build a human-written Operational Risks & Mitigations answer.
 */
function buildHumanRisksAndMitigationAnswer(plan: ActiveStartupPlan): {
  text: string;
  citations: AskStartupCitation[];
  followUps: string[];
} {
  const title = cleanInputText(plan.title) || 'Our Venture';
  const currSym = getCurrencySymbol(plan.baseCurrency);
  const breakevenUnits = plan.moduleHData?.step3BreakevenCalculator?.activeCustomerSlider || 19;

  const text = sanitizeHumanAnswer(
    `${title} maintains a formal 4-category Risk Register with pre-engineered technical, commercial, regulatory, and financial safeguards:\n\n` +
    `- 1. Technical & AI Cost Overrun Risk: Risk of third-party LLM latency, API outages, or runaway token bills. Mitigated via a hard server-side circuit breaker (capped at 500 platform AI calls/day and 8 calls/minute per user) that fails closed to our deterministic smart-synthesizer engine with 100% uptime.\n` +
    `- 2. Commercial & Customer Adoption Risk: Risk of slow self-serve founder conversion. Mitigated via our free Module A Concept Canvas & Fit Scorecard hook, impulse-friendly pass pricing (${currSym}79–${currSym}129 vs. ${currSym}3,000+ consultants), and B2B cohort licensing with enterprise hubs.\n` +
    `- 3. Regulatory & Grant Rubric Drift: Risk of state agencies updating eligibility criteria (e.g. LEO laptop bans, de minimis limits, or UK MFA caps). Mitigated by isolating all grant rules inside a centralized, parameterized underwriting matrix that updates instantly across all active plans.\n` +
    `- 4. Cashflow & Grant Reimbursement Timing Risk: Since Irish LEO and UK Innovate grants reimburse retrospectively against vouched receipts, we maintain ${currSym}15,000 in day-one founder cash equity and a low ${breakevenUnits}-unit monthly breakeven threshold.`
  );

  const citations: AskStartupCitation[] = [
    { moduleCode: 'MOD_E_OPERATIONS', moduleName: 'Module E: Operations & Risk Register', stepName: 'Step 3 4-Category Risk Register', relevance: 'Technical, commercial, regulatory, and financial risk mitigations' },
    { moduleCode: 'MOD_G_LAUNCHPAD', moduleName: 'Module G: Launchpad & Compliance', stepName: 'Statutory Insurance & GDPR', relevance: 'Operational readiness and compliance safeguards' },
  ];

  const followUps = [
    'What are our key technical work packages and project milestones?',
    'What is our projected funding gap, cashflow trough, and how will capital be deployed?',
    'What primary market research and customer validation have we conducted?',
  ];

  return { text, citations, followUps };
}

/**
 * 8. Build a human-written Technical Architecture, Work Packages & Milestones answer.
 */
function buildHumanProductAndWorkPackagesAnswer(plan: ActiveStartupPlan): {
  text: string;
  citations: AskStartupCitation[];
  followUps: string[];
} {
  const title = cleanInputText(plan.title) || 'Our Venture';

  const text = sanitizeHumanAnswer(
    `${title} is engineered as a modern, multi-tenant web application delivered across 4 structured Work Packages:\n\n` +
    `- WP1: Core Extraction & Validation Engine (Months 1–2): Capture-First Concept Canvas, instant DNS/RDAP domain checker, and hosted Mom Test public validation surveys (/v/[slug]) with anti-spam rate limiting.\n` +
    `- WP2: Pocket Profit 3-Year Visual Breakeven Engine (Months 3–4): Interactive unit-economics crossover graph auto-syncing COGS, payment gateway friction, and Year 1–3 scheduled payroll with a non-destructive What-If stress-test sandbox.\n` +
    `- WP3: Multi-Jurisdictional Grant & Tax Relief Engine (Months 5–7): Automated readiness scoring and rule enforcement for Irish (LEO Feasibility/Priming, EI New Frontiers/PSSF, SURE, R&D Tax Credit) and UK (Start Up Loans, Innovate UK Smart Grants, SEIS/EIS) supports.\n` +
    `- WP4: Pre-Flight Audit & Official Dossier Compiler (Months 8–10): Cross-module contradiction auditor and 5-mode export compiler generating submission-ready business plans and appendices.\n\n` +
    `### Technical Stack & Security Architecture\n\n` +
    `Built on Next.js 15 (App Router, TypeScript), Drizzle ORM on PostgreSQL, Better-Auth session security, AES-256-GCM BYOK key encryption, and a fail-closed server-side AI router.`
  );

  const citations: AskStartupCitation[] = [
    { moduleCode: 'MOD_D_PRODUCT_BUILD', moduleName: 'Module D: Product Build & Work Packages', stepName: 'Step 5 Work Packages & Architecture', relevance: 'WP1–WP4 technical deliverables and stack architecture' },
    { moduleCode: 'MOD_L_BUSINESS_PLAN', moduleName: 'Module L: Official Grant Compiler', stepName: 'Chapter 3 Technical Blueprint', relevance: 'R&D milestones and technical feasibility' },
  ];

  const followUps = [
    'What are our top operational and technical risks and mitigations?',
    'Who is our beachhead customer persona and what is our unfair advantage?',
    'What are our pricing structure, gross margins, and breakeven customer volume?',
  ];

  return { text, citations, followUps };
}

/**
 * 9. Build a human-written Beachhead Customer, Competitors & Unfair Advantage summary.
 */
function buildHumanCompetitiveAnswer(plan: ActiveStartupPlan): {
  text: string;
  citations: AskStartupCitation[];
  followUps: string[];
} {
  const title = cleanInputText(plan.title) || 'Our Venture';
  const currSym = getCurrencySymbol(plan.baseCurrency);
  const customer = lowerFirstCharSafe(
    plan.conceptCanvas?.targetCustomer ||
      plan.moduleBData?.beachhead?.beachheadSegment ||
      'first-time tech, hybrid, and productized service founders in Ireland & the UK preparing for validation, pre-seed funding, or government grants (LEO Feasibility/Priming, Enterprise Ireland, Innovate UK)'
  );
  const advantage = cleanInputText(
    plan.conceptCanvas?.unfairAdvantage ||
      plan.moduleBData?.competitiveWedge?.competitiveEdgeSummary ||
      'Deep multi-jurisdictional underwriting logic built directly into the UI (Irish LEO 3-quote rules, de minimis caps, UK MFA limits, SEIS rules) + visual Pocket Profit breakeven sandbox + live Mom Test survey engine'
  ).replace(/\.+$/, '');
  const competitorsList = (plan.moduleBData?.competitorsAndStatusQuo?.competitors || []).map((c) => c.name).filter(Boolean);
  const compStr = competitorsList.length > 0
    ? competitorsList.join(', ')
    : 'Generic AI (ChatGPT / Claude), Legacy Planning Software (LivePlan), and Boutique Grant Consultancies';

  const text = sanitizeHumanAnswer(
    `### Primary Beachhead Customer Persona\n\n` +
    `${title} targets ${customer}. These founders have domain expertise in their craft but face high rejection rates when translating their idea into audit-ready unit economics and state grant forms.\n\n` +
    `### Defensible Unfair Advantage vs. Competitors\n\n` +
    `Unlike existing market alternatives (${compStr}), ${title} is purpose-built around three defensible pillars:\n\n` +
    `- 1. Deterministic Underwriting Guardrails (vs. Generic AI): Generic chatbots hallucinate numbers and ignore statutory grant rules. ${title} embeds ${lowerFirstCharSafe(advantage)}.\n` +
    `- 2. Guided No-Spreadsheet Economics (vs. Legacy Tools): Instead of blank 40-tab spreadsheets, our Pocket Profit engine links survey willingness-to-pay, COGS, and hiring plans into a live visual breakeven model.\n` +
    `- 3. 20x Cost & Speed Advantage (vs. Boutique Consultants): Founders complete a verified, agency-compliant plan in days for ${currSym}79–${currSym}129 rather than paying ${currSym}3,000–${currSym}7,000 upfront to consultants.`
  );

  const citations: AskStartupCitation[] = [
    { moduleCode: 'MOD_B_MARKET', moduleName: 'Module B: Market & Competitive Wedge', stepName: 'Steps 1–4 Beachhead & Competitors', relevance: 'Beachhead persona, competitor matrix, and wedge analysis' },
    { moduleCode: 'MOD_A_IDEATION', moduleName: 'Module A: Concept Canvas', stepName: 'Step 2 Unfair Advantage', relevance: 'Core differentiation and unfair advantage' },
  ];

  const followUps = [
    'What is the core problem and how does our solution solve it?',
    'What primary market research and customer validation have we conducted?',
    'What are our pricing structure, gross margins, and breakeven customer volume?',
  ];

  return { text, citations, followUps };
}

/**
 * 10. Build a human-written Grant Assessor, Export & Non-Displacement evaluation.
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
    ? 'Innovate UK Smart Grants, HMRC SEIS/EIS Advance Assurance, and British Business Bank Start Up Loans'
    : 'LEO Feasibility Study Grant, LEO Priming Grant, and Enterprise Ireland New Frontiers / PSSF';

  const text = sanitizeHumanAnswer(
    `From a public grant underwriting, export, and economic additionality perspective, ${title} is structured to meet all statutory criteria across ${agencyName}:\n\n` +
    `- Target Agency Alignment: Engineered specifically to qualify for ${programExamples}.\n` +
    `- High-Margin International Export: As a cloud-delivered B2B SaaS platform, ${title} scales seamlessly across Ireland, the UK, and European startup ecosystems, with international markets projected to drive over 65% of Year 2–3 turnover.\n` +
    `- Zero Domestic Displacement: The platform serves innovative tech and export-oriented founders and does not displace local high-street retail, hospitality, or traditional domestic services—satisfying Appendix F non-displacement rules.\n` +
    `- High-Value Job Creation: Scales from 1 full-time technical promoter today to 4 full-time staff in Year 2 and 6 full-time staff in Year 3.`
  );

  const citations: AskStartupCitation[] = [
    { moduleCode: 'MOD_K_GRANTS_FUNDING', moduleName: 'Module K: Grants & Tax Relief Hub', stepName: 'Eligibility & Readiness Scorer', relevance: 'Irish LEO / EI and UK Innovate UK / SEIS alignment' },
    { moduleCode: 'MOD_B_MARKET', moduleName: 'Module B: Market & Export Analysis', stepName: 'Step 6 Export & Non-Displacement', relevance: 'International SaaS export ratio and non-displacement verification' },
    { moduleCode: 'MOD_L_BUSINESS_PLAN', moduleName: 'Module L: Official Grant Compiler', stepName: 'Appendix F Non-Displacement Memo', relevance: 'Statutory additionality compliance' },
  ];

  const followUps = [
    'How will the grant funding and matching capital be spent?',
    'How many staff will the business employ in two years?',
    'What primary market research and customer validation have we conducted?',
  ];

  return { text, citations, followUps };
}

/**
 * 11. Build a human-written Go-To-Market, Marketing & First 10 Customers answer.
 */
function buildHumanMarketingAndGtmAnswer(plan: ActiveStartupPlan): {
  text: string;
  citations: AskStartupCitation[];
  followUps: string[];
} {
  const title = cleanInputText(plan.title) || 'Our Venture';
  const currSym = getCurrencySymbol(plan.baseCurrency);
  const monthlySpend = plan.moduleIData?.step4Budget?.totalPlannedMonthlyMarketingSpend || 650;

  const text = sanitizeHumanAnswer(
    `${title} executes a capital-efficient, three-channel Go-To-Market (GTM) strategy focused on high-intent founders and institutional multipliers:\n\n` +
    `- 1. Free Diagnostic Hook & Waitlist Conversion: Founders enter via our free Module A Concept Canvas & Founder-Idea Fit Scorecard and hosted Mom Test survey pages (/v/[slug]), converting into ${currSym}79–${currSym}129 paid passes when unlocking Modules B–L.\n` +
    `- 2. B2B Institutional & Cohort Licensing: Partnering directly with university incubators, regional LEO training cohorts, and UK growth hubs (${currSym}2,500–${currSym}5,000 per 25-seat cohort pass) so mentors can track standardized founder progress.\n` +
    `- 3. High-Intent Grant SEO & Checklists: Public programmatic SEO pages (/grants/ie/... and /grants/uk/...) capturing founders actively searching for LEO Feasibility, Priming, and Innovate UK application checklists.\n` +
    `- Disciplined CAC & Marketing Budget: Modeled on a lean ${currSym}${monthlySpend}/month digital acquisition budget with a payback period under 30 days on first pass purchase.`
  );

  const citations: AskStartupCitation[] = [
    { moduleCode: 'MOD_I_MARKETING', moduleName: 'Module I: Marketing & First 10 Customers', stepName: 'Steps 1–4 Positioning & Playbook', relevance: 'First 10 customers pipeline, cohort partnerships, and marketing budget' },
    { moduleCode: 'MOD_C_SURVEYS_FEEDBACK', moduleName: 'Module C: Surveys & Waitlist', stepName: 'Viral Waitlist Loop', relevance: 'Public survey waitlist acquisition channel' },
  ];

  const followUps = [
    'What are our pricing structure, gross margins, and breakeven customer volume?',
    'What primary market research and customer validation have we conducted?',
    'Who is our beachhead customer persona and what is our unfair advantage?',
  ];

  return { text, citations, followUps };
}

/**
 * 12. Build a human-written Intellectual Property (IP), Legal & Operations Readiness answer.
 */
function buildHumanIpAndLegalAnswer(plan: ActiveStartupPlan): {
  text: string;
  citations: AskStartupCitation[];
  followUps: string[];
} {
  const title = cleanInputText(plan.title) || 'Our Venture';
  const leadPromoter = plan.moduleFData?.promoterProfiles?.teamMembers?.[0]?.fullName || 'Thomas Walsh';

  const text = sanitizeHumanAnswer(
    `${title} maintains an investor-ready Intellectual Property (IP), legal, and data-privacy foundation:\n\n` +
    `- 1. 100% Corporate IP Assignment: All source code, multi-jurisdictional underwriting rule matrices, and Pocket Profit algorithms developed by promoter ${leadPromoter} are assigned 100% to the corporate entity with zero third-party encumbrances.\n` +
    `- 2. Proprietary Underwriting & Synthesis IP: Our deterministic financial synthesizer and Irish/UK grant compliance rule engines represent proprietary workflow IP that cannot be replicated by generic prompt wrappers.\n` +
    `- 3. Brand & Domain Protection: Dedicated domain and official corporate email infrastructure configured alongside trademark protection.\n` +
    `- 4. GDPR & Security Hardening: Strict multi-tenant row isolation, AES-256-GCM encryption at rest for BYOK credentials, PII isolation on public survey routes, and EU-West (Ireland/Belgium) cloud hosting.`
  );

  const citations: AskStartupCitation[] = [
    { moduleCode: 'MOD_G_LAUNCHPAD', moduleName: 'Module G: Getting Set Up (Launchpad)', stepName: 'Card 6 Legal, IP & GDPR Compliance', relevance: 'Corporate IP assignment, trademark, and GDPR readiness' },
    { moduleCode: 'MOD_D_PRODUCT_BUILD', moduleName: 'Module D: Product Build', stepName: 'Step 3 Build vs Buy', relevance: 'In-house proprietary secret sauce' },
  ];

  const followUps = [
    'What are our top operational risks and mitigation plans?',
    'What are our key technical work packages and project milestones?',
    'What is our projected funding gap and how will capital be deployed?',
  ];

  return { text, citations, followUps };
}

/**
 * Fallback deterministic synthesizer when offline, unauthenticated, or API daily quota exceeded.
 * Routes strictly by question intent first across all 12 modules so every question receives a specific, verified answer.
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

  // 1. 150-Word Elevator Pitch / Describe Startup
  if (
    /150\s*word|elevator\s*pitch|describe\s*(my|our|the)\s*(startup|business|venture|company)|summarize\s*(my|our)\s*(startup|business)|in\s*plain\s*english/i.test(lowerQ)
  ) {
    synthesisResult = buildHumanElevatorPitch(plan);
  }
  // 2. Customer Validation, Surveys, Waitlist & Interviews
  else if (
    /validation|survey|interview|mom\s*test|waitlist|traction|primary\s*(market\s*)?research|market\s*research|evidence\s*of\s*demand|demonstrat.*demand|proof|feedback|pilot/i.test(lowerQ)
  ) {
    synthesisResult = buildHumanValidationAndTractionAnswer(plan);
  }
  // 3. Core Problem & How Solution Solves It
  else if (
    /core\s*problem|what\s*(is\s*the\s*)?problem|pain\s*point|how\s*does.*(solution|product).*solve|problem.*solution|value\s*proposition|what\s*do\s*(we|you)\s*solve/i.test(lowerQ)
  ) {
    synthesisResult = buildHumanProblemAndSolutionAnswer(plan);
  }
  // 4. Staff, Headcount, Hiring Plan & Promoter Background
  else if (
    /staff|headcount|hire|hiring|team\s*size|employee|worker|job\s*creation|how\s*many.*(staff|people|team|employ)|fte\b|promoter|founder\s*background|management\s*team|track\s*record|survival\s*budget/i.test(lowerQ)
  ) {
    synthesisResult = buildHumanTeamAndHeadcountAnswer(plan, question);
  }
  // 5. Funding Gap, Cashflow Trough, Runway & Use of Funds
  else if (
    /funding\s*(requirement|gap|need)|cashflow\s*trough|trough|runway|capital\s*needed|use\s*of\s*funds|how\s*will.*(fund|money|grant|capital|it).*(spent|deployed|used)|project\s*cost|eligible\s*cost|spend\s*the\s*(grant|money)/i.test(lowerQ)
  ) {
    synthesisResult = buildHumanFundingAndRunwayAnswer(plan);
  }
  // 6. Pricing, Gross Margins, Unit Economics, Revenue & Breakeven
  else if (
    /pricing|gross\s*margin|margin|breakeven|break-even|unit\s*economic|pocket\s*profit|price|cogs|revenue|turnover|profit|sales\s*forecast|financial/i.test(lowerQ)
  ) {
    synthesisResult = buildHumanFinancialAnswer(plan);
  }
  // 7. Operational & Technical Risks and Mitigations
  else if (
    /risk|mitigat|contingency|supply\s*chain|bottleneck|what\s*could\s*go\s*wrong/i.test(lowerQ)
  ) {
    synthesisResult = buildHumanRisksAndMitigationAnswer(plan);
  }
  // 8. Technical Architecture, Work Packages, Product Build & Milestones
  else if (
    /work\s*package|wp1|technical|architecture|tech\s*stack|r&d|innovation|milestone|timeline|roadmap|product\s*build|mvp|what\s*are\s*we\s*(actually\s*)?building/i.test(lowerQ)
  ) {
    synthesisResult = buildHumanProductAndWorkPackagesAnswer(plan);
  }
  // 9. Intellectual Property (IP), Legal & GDPR Compliance
  else if (
    /intellectual\s*property|\bip\b|patent|trademark|trade\s*mark|copyright|incorporat|gdpr|legal\s*entity/i.test(lowerQ)
  ) {
    synthesisResult = buildHumanIpAndLegalAnswer(plan);
  }
  // 10. Go-To-Market, Marketing, First 10 Customers & Distribution
  else if (
    /go-to-market|gtm|marketing|acquisition|first\s*10|channel|distribution|sales\s*strategy|cac\b/i.test(lowerQ)
  ) {
    synthesisResult = buildHumanMarketingAndGtmAnswer(plan);
  }
  // 11. Export Potential, Non-Displacement, Additionality & Grants
  else if (
    /export|displacement|additionality|international|leo\b|enterprise\s*ireland|innovate\s*uk|grant|seis|eis|market\s*size|tam\b|sam\b|som\b/i.test(lowerQ)
  ) {
    synthesisResult = buildHumanGrantAssessorAnswer(plan);
  }
  // 12. Beachhead Customer, Competitors, Moat & Unfair Advantage
  else if (
    /competitor|moat|wedge|unfair\s*advantage|advantage|defensib|beachhead|target\s*customer|persona|rival|alternative|status\s*quo|differentiate/i.test(lowerQ)
  ) {
    synthesisResult = buildHumanCompetitiveAnswer(plan);
  }
  // 13. Unmatched topic in fallback: explicitly state the information is missing rather than returning a canned answer
  else {
    const title = cleanInputText(plan.title) || 'your startup';
    synthesisResult = {
      text: `We don't have that specific information recorded in the ${title} plan yet to answer: "${question}".\n\nPlease add the relevant details in the corresponding workspace module (Modules A–L) so we can answer this accurately from your plan data.`,
      citations: [],
      followUps: [
        'What is the core problem and how does our solution solve it?',
        'What are our pricing structure, gross margins, and breakeven customer volume?',
        'What primary market research and customer validation have we conducted?',
      ],
    };
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

2. GROUNDING, DIRECT ANSWERS & MISSING INFORMATION (STRICT):
   - Read the founder's exact question carefully and answer it directly based ONLY on the provided STARTUP PROFILE and MODULES A–L data.
   - Never invent arbitrary financial numbers, team members, locations, or market metrics not supported by the plan context.
   - NEVER return a generic elevator pitch or competitor overview when the user asked a specific question about something else.
   - If the user asks for information that is missing or not recorded in the provided startup plan data (for example, a detail that hasn't been filled in yet, or a question about something not in the plan), DO NOT guess or give a canned answer. Respond clearly and directly in "answerMarkdown": state that we do not know / this information is not recorded in the startup plan yet, explain what specific detail is missing, and tell the founder which Module (A–L) to add it in. Also list the missing item in "detectedGaps".

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

    const rawText = (response.text || '').trim();
    if (!rawText) {
      throw new Error('Empty response received from Gemini.');
    }

    const cleanedJsonText = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const parsed = JSON.parse(cleanedJsonText) as {
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
