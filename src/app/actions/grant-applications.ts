'use server';

import { and, eq, sql } from 'drizzle-orm';
import { db, planModulesData } from '@/db';
import type {
  ActiveStartupPlan,
  SavedCustomPortalQuestion,
  SavedGrantApplicationTracker,
  SavedGrantCenterData,
  SavedModuleBData,
  SavedModuleCData,
  SavedModuleDData,
  SavedModuleEData,
  SavedModuleFData,
  SavedModuleHData,
  SavedModuleJData,
  SavedModuleLData,
} from '@/lib/auth/session-store';
import { verifyActiveSessionAndPlanOwnership } from '@/lib/auth/server-auth';
import {
  authorizeAndPrepareGeminiCall,
  getGenAiClient,
  recordGeminiUsageAndIncrementCredits,
  refundSettledGeminiCredit,
} from '@/lib/ai/router';
import {
  computeDeterministicPlanFinancialSummary,
  computeModuleFCompensationSchedule,
  computeModuleHBlendedPricing,
  matchRoleToExistingFounder,
} from '@/lib/finance/cross-module-normalizer';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface AnswerQuestionFromPlanParams {
  planId: string;
  questionText: string;
  grantSlug?: string;
  targetLength: 'SHORT' | 'STANDARD' | 'DETAILED';
  assessorLens:
    | 'ECONOMIC_EXPORT'
    | 'R_AND_D_INNOVATION'
    | 'UNDERWRITING_REPAYMENT'
    | 'COMMERCIAL_INVESTOR';
  planSnapshot: ActiveStartupPlan;
}

export interface AnswerQuestionFromPlanResult {
  success: boolean;
  question: SavedCustomPortalQuestion;
  aiEngineUsed: 'gemini-2.5-flash' | 'smart-synthesizer';
  error?: string;
}

interface ExtractedPlanMetrics {
  title: string;
  oneLiner: string;
  targetCustomer: string;
  problem: string;
  hasConceptCanvas: boolean;
  currentFTE: number;
  y1NewFTE: number;
  y2NewFTE: number;
  y3NewFTE: number;
  y1TotalStaff: number;
  y2TotalStaff: number;
  y3TotalStaff: number;
  hasPromoterBio: boolean;
  promoterName: string;
  promoterBio: string;
  monthlySurvivalFormatted: string;
  hasHiringRoles: boolean;
  y1RoleTitles: string[];
  y2RoleTitles: string[];
  y3RoleTitles: string[];
  hasFinancialInputs: boolean;
  y1Turnover: string;
  y2Turnover: string;
  y3Turnover: string;
  y1Profit: string;
  y2Profit: string;
  troughAmount: string;
  breakevenUnits: string;
  grossMarginPercent: number;
  pricingSummary: string;
  hasPricingData: boolean;
  currency: string;
  currSym: string;
  hasMarketData: boolean;
  beachhead: string;
  competitors: string;
  wedge: string;
  exportPosture: string;
  surveyCount: number;
  interviewCount: number;
  hasValidationData: boolean;
  hasWorkPackages: boolean;
  formFactor: string;
  workPackagesSummary: string;
  riskSummary: string;
  equipmentSummary: string;
}

function extractKeyMetrics(
  planInput?: Partial<ActiveStartupPlan> | null,
  modFOverride?: SavedModuleFData | null,
  modJOverride?: SavedModuleJData | null,
  modHOverride?: SavedModuleHData | null,
  _modLOverride?: SavedModuleLData | null,
  modBOverride?: SavedModuleBData | null,
  modCOverride?: SavedModuleCData | null,
  modDOverride?: SavedModuleDData | null,
  modEOverride?: SavedModuleEData | null
): ExtractedPlanMetrics {
  const plan = planInput || {};
  const title = plan.title?.trim() || 'Our Venture';
  const oneLiner =
    plan.oneLinerSummary?.trim() ||
    plan.conceptCanvas?.proposedSolution?.trim() ||
    '';
  const targetCustomer = plan.conceptCanvas?.targetCustomer?.trim() || '';
  const problem = plan.conceptCanvas?.coreProblem?.trim() || '';
  const hasConceptCanvas = Boolean(oneLiner || targetCustomer || problem);

  const currency = plan.baseCurrency || 'EUR';
  const currSym =
    currency === 'GBP'
      ? '£'
      : currency === 'USD'
        ? '$'
        : currency === 'AUD'
          ? 'A$'
          : currency === 'CAD'
            ? 'C$'
            : '€';
  const country = (plan.hqCountryCode || 'IE').toUpperCase();

  // Module F data (real schema fields)
  const modF = modFOverride || plan.moduleFData;
  const promoters = modF?.promoterProfiles?.teamMembers || [];
  const leadPromoter = promoters[0]?.fullName?.trim() || 'Lead Founder';
  const rawBio = promoters[0]?.compiled150WordNarrative?.trim() || '';
  const hasPromoterBio = rawBio.length > 0;
  const promoterBio =
    rawBio || 'Promoter 150-word biography not yet recorded in Module F Step 1.';

  const compSchedule = computeModuleFCompensationSchedule(modF, country);
  const monthlySurvivalFormatted = compSchedule.hasExplicitSurvivalBudgets
    ? `${currSym}${compSchedule.canonicalMonthlySurvivalTotal.toLocaleString()}/month`
    : 'Not yet recorded in Module F Step 3';

  const founderCountFte =
    promoters.length > 0
      ? promoters.reduce((sum, m) => {
          if (
            m.roleClassification === 'ADVISOR_BOARD' ||
            m.roleClassification === 'FRACTIONAL_EXECUTIVE'
          ) {
            return sum;
          }
          if (
            m.weeklyCommitment === 'PART_TIME_20_TO_30H' ||
            m.weeklyCommitment === 'EVENING_WEEKEND_10_TO_15H'
          ) {
            return sum + 0.5;
          }
          return sum + 1;
        }, 0)
      : 1;

  const allRoles = modF?.step5HiringPlanData?.roles || [];
  const founderBudgets = modF?.step3SurvivalBudgetData?.founderBudgets || [];

  let y1NewFTE = 0;
  let y2NewFTE = 0;
  let y3NewFTE = 0;
  const y1RoleTitles: string[] = [];
  const y2RoleTitles: string[] = [];
  const y3RoleTitles: string[] = [];

  for (const r of allRoles) {
    const match = matchRoleToExistingFounder(r, promoters, founderBudgets);
    if (match.isExistingFounder) {
      continue;
    }
    const yr = Number(r.yearScheduled);
    const fteVal =
      r.employmentMode === 'FULL_TIME'
        ? 1
        : r.employmentMode === 'PART_TIME'
          ? 0.5
          : 0;
    if (yr === 1) y1NewFTE += fteVal;
    if (yr === 2) y2NewFTE += fteVal;
    if (yr === 3) y3NewFTE += fteVal;

    const titleStr = r.title?.trim();
    if (!titleStr) continue;
    const salaryStr =
      (Number(r.grossAnnualSalary) || 0) > 0
        ? ` (${currSym}${Number(r.grossAnnualSalary).toLocaleString()})`
        : '';
    const formatted = `${titleStr}${salaryStr}`;
    if (yr === 1 && !y1RoleTitles.includes(formatted)) y1RoleTitles.push(formatted);
    if (yr === 2 && !y2RoleTitles.includes(formatted)) y2RoleTitles.push(formatted);
    if (yr === 3 && !y3RoleTitles.includes(formatted)) y3RoleTitles.push(formatted);
  }

  const currentFTE = Math.max(0.5, founderCountFte);
  const y1TotalStaff = currentFTE + y1NewFTE;
  const y2TotalStaff = currentFTE + y1NewFTE + y2NewFTE;
  const y3TotalStaff = currentFTE + y1NewFTE + y2NewFTE + y3NewFTE;

  // Module H & J real financials
  const modJ = modJOverride || plan.moduleJData;
  const modH = modHOverride || plan.moduleHData;
  const modD = modDOverride || plan.moduleDData;
  const modE = modEOverride || plan.moduleEData;

  const finSummary = computeDeterministicPlanFinancialSummary(plan, {
    modD,
    modE,
    modF,
    modH,
    modJ,
  });

  const defaultVat = country === 'GB' ? 20 : 23;
  const blendedPricing = computeModuleHBlendedPricing(modH, defaultVat);
  const tiers = modH?.step2PricingTiers?.tiers || [];
  const hasPricingData = Boolean(
    tiers.length > 0 || modH?.step3BreakevenCalculator?.activePriceSlider
  );

  const pricingSummary =
    tiers.length > 0
      ? tiers
          .map((t) => {
            const cadenceSuffix =
              t.billingFrequency === 'ANNUAL'
                ? '/yr'
                : t.billingFrequency === 'ONE_OFF'
                  ? ' one-off'
                  : '/mo';
            return `${t.name}: ${currSym}${t.priceNetOfTax}${cadenceSuffix}`;
          })
          .join(', ')
      : hasPricingData
        ? `${currSym}${blendedPricing.effectiveMonthlyAccrualNetPrice}/mo`
        : 'Pricing tiers not yet recorded in Module H';

  const y1Turnover = finSummary.hasFinancialInputs
    ? `${currSym}${finSummary.year1Revenue.toLocaleString()}`
    : 'Not yet modeled in Module J';
  const y2Turnover = finSummary.hasFinancialInputs
    ? `${currSym}${finSummary.year2Revenue.toLocaleString()}`
    : 'Not yet modeled in Module J';
  const y3Turnover = finSummary.hasFinancialInputs
    ? `${currSym}${finSummary.year3Revenue.toLocaleString()}`
    : 'Not yet modeled in Module J';
  const y1Profit = finSummary.hasFinancialInputs
    ? `${currSym}${finSummary.year1OperatingProfit.toLocaleString()}`
    : 'Not yet modeled in Module J';
  const y2Profit = finSummary.hasFinancialInputs
    ? `${currSym}${finSummary.year2OperatingProfit.toLocaleString()}`
    : 'Not yet modeled in Module J';
  const troughAmount = finSummary.hasFinancialInputs
    ? `${currSym}${finSummary.peakCashflowTrough.toLocaleString()}`
    : 'Not yet modeled in Module J';
  const breakevenUnits =
    finSummary.hasFinancialInputs && finSummary.breakevenMonthlyCustomers > 0
      ? `${finSummary.breakevenMonthlyCustomers} customers/month`
      : 'Not yet modeled in Module H';

  // Module B data
  const modB = modBOverride || plan.moduleBData;
  const beachhead =
    modB?.beachhead?.beachheadSegment?.trim() ||
    targetCustomer ||
    'Not yet recorded in Module B';
  const competitorsList = (modB?.competitorsAndStatusQuo?.competitors || [])
    .map((c) => c.name?.trim())
    .filter(Boolean);
  const competitors =
    competitorsList.length > 0
      ? competitorsList.join(', ')
      : 'Not yet recorded in Module B';
  const wedge =
    (modB?.competitiveWedge as unknown as Record<string, string> | undefined)
      ?.competitiveEdgeSummary?.trim() ||
    plan.conceptCanvas?.unfairAdvantage?.trim() ||
    'Not yet recorded in Module B';
  const hasMarketData = Boolean(
    modB?.beachhead?.beachheadSegment?.trim() || competitorsList.length > 0
  );
  const exportPosture =
    plan.exportPotential === 'EXPORTING_INTERNATIONALLY'
      ? `International export focus across ${(plan.targetMarketsArray || [country]).join(', ')}`
      : `Domestic market focus (${country})`;

  // Module C data — never fabricate survey/interview counts when 0
  const modC = modCOverride || plan.moduleCData;
  const surveyCount = (modC?.surveys || []).reduce(
    (acc, s) =>
      acc +
      (s.responses || []).filter((r) => !r.isSimulated).length,
    0
  );
  const interviewCount = (modC?.interviewLogs || []).length;
  const hasValidationData = surveyCount > 0 || interviewCount > 0;

  // Module D & E data
  const wpList = modD?.workPackagesAndFlow?.workPackages || [];
  const hasWorkPackages = wpList.length > 0;
  const formFactor =
    (modD?.productVehicle as unknown as Record<string, string> | undefined)
      ?.formFactor || 'Not yet recorded in Module D';
  const workPackagesSummary = hasWorkPackages
    ? wpList
        .map((w) => `${w.wpCode || w.id || 'WP'}: ${w.title}`)
        .join('; ')
    : 'Not yet recorded in Module D Step 5';

  const riskItems = modE?.riskRegister?.riskItems || [];
  const riskSummary =
    riskItems.length > 0
      ? riskItems
          .slice(0, 4)
          .map((r) => `${r.riskTitle} (Mitigation: ${r.mitigationAndContingencyPlan})`)
          .join('; ')
      : 'Not yet recorded in Module E Step 3';

  const equipItems = modE?.premisesAndEquipment?.equipmentItems || [];
  const equipmentSummary =
    equipItems.length > 0
      ? equipItems
          .map((e) => `${e.assetName} (${currSym}${Number(e.totalCostExVat || 0).toLocaleString()})`)
          .join(', ')
      : 'No capital equipment items scheduled in Module E Step 2';

  return {
    title,
    oneLiner: oneLiner || 'Not yet recorded in Module A',
    targetCustomer: targetCustomer || 'Not yet recorded in Module A',
    problem: problem || 'Not yet recorded in Module A',
    hasConceptCanvas,
    currentFTE,
    y1NewFTE,
    y2NewFTE,
    y3NewFTE,
    y1TotalStaff,
    y2TotalStaff,
    y3TotalStaff,
    hasPromoterBio,
    promoterName: leadPromoter,
    promoterBio,
    monthlySurvivalFormatted,
    hasHiringRoles: y1RoleTitles.length + y2RoleTitles.length + y3RoleTitles.length > 0,
    y1RoleTitles,
    y2RoleTitles,
    y3RoleTitles,
    hasFinancialInputs: finSummary.hasFinancialInputs,
    y1Turnover,
    y2Turnover,
    y3Turnover,
    y1Profit,
    y2Profit,
    troughAmount,
    breakevenUnits,
    grossMarginPercent: finSummary.grossMarginPercent,
    pricingSummary,
    hasPricingData,
    currency,
    currSym,
    hasMarketData,
    beachhead,
    competitors,
    wedge,
    exportPosture,
    surveyCount,
    interviewCount,
    hasValidationData,
    hasWorkPackages,
    formFactor,
    workPackagesSummary,
    riskSummary,
    equipmentSummary,
  };
}

function buildDeterministicFallbackAnswer(
  params: AnswerQuestionFromPlanParams,
  dbOverrides?: {
    modF?: SavedModuleFData | null;
    modJ?: SavedModuleJData | null;
    modH?: SavedModuleHData | null;
    modL?: SavedModuleLData | null;
    modB?: SavedModuleBData | null;
    modC?: SavedModuleCData | null;
    modD?: SavedModuleDData | null;
    modE?: SavedModuleEData | null;
  }
): SavedCustomPortalQuestion {
  const { questionText, targetLength, assessorLens, planSnapshot } = params;
  const metrics = extractKeyMetrics(
    planSnapshot,
    dbOverrides?.modF,
    dbOverrides?.modJ,
    dbOverrides?.modH,
    dbOverrides?.modL,
    dbOverrides?.modB,
    dbOverrides?.modC,
    dbOverrides?.modD,
    dbOverrides?.modE
  );
  const qLower = questionText.toLowerCase();

  let answer = '';
  const citations: string[] = [];
  const missingWarnings: string[] = [];

  if (
    /market\s*research|customer\s*validation|primary\s*research|survey|interview|evidence\s*of\s*demand|demonstrat.*demand|traction|proof|feedback|pilot|mom\s*test|validat/i.test(
      qLower
    )
  ) {
    citations.push('Module C (Customer Surveys & Validation Engine)');
    citations.push('Module B (Market Research & Beachhead)');

    if (!metrics.hasValidationData) {
      missingWarnings.push(
        'No primary survey responses or 1-on-1 customer interviews are recorded in Module C yet.'
      );
      answer = `Primary customer validation metrics are not yet recorded in ${metrics.title}'s plan for: "${questionText}".\n\nPlease log your customer discovery survey responses or 1-on-1 Mom Test interviews in Module C (Customer Surveys & Validation Engine) so we can cite verified respondent counts and willingness-to-pay evidence without guessing.`;
    } else {
      answer =
        targetLength === 'SHORT'
          ? `${metrics.title} has validated customer demand among ${metrics.beachhead} through ${metrics.surveyCount} non-simulated survey responses and ${metrics.interviewCount} structured 1-on-1 customer discovery interviews recorded in Module C, directly informing our V1 scope and pricing (${metrics.pricingSummary}).`
          : `${metrics.title} has conducted direct primary market validation with our beachhead customer segment (${metrics.beachhead}):\n\n1. Customer Discovery Surveys: ${metrics.surveyCount} verified customer responses collected in Module C.\n2. Qualitative 1-on-1 Interviews: ${metrics.interviewCount} structured customer interviews logged in Module C.\n3. Commercial Alignment: Findings directly shaped our core problem focus (${metrics.problem}) and pricing model (${metrics.pricingSummary}).`;
    }
  } else if (/risk|mitigat|challenge|barrier|contingency/i.test(qLower)) {
    citations.push('Module E (Operations & Risk Register)');
    if (metrics.riskSummary.startsWith('Not yet recorded')) {
      missingWarnings.push('Project Risk Register items have not been added in Module E Step 3.');
      answer = `Formal risk register items have not yet been recorded in ${metrics.title}'s workspace. Please complete Module E Step 3 (Project Risk Register) across technical, commercial, financial, and regulatory categories to generate a portal-ready mitigation summary.`;
    } else {
      answer = `${metrics.title} maintains a structured risk register in Module E covering key operational, commercial, and financial exposures:\n\n${metrics.riskSummary}\n\nFinancial liquidity is further monitored against our modeled breakeven volume (${metrics.breakevenUnits}) and cashflow trough (${metrics.troughAmount}).`;
    }
  } else if (
    /staff|headcount|hire|team\s*size|employee|worker|people|job|fte/i.test(qLower)
  ) {
    citations.push('Module F (Team, Roles & Headcount)');
    if (!metrics.hasHiringRoles) {
      missingWarnings.push(
        'No net-new Year 1–3 hires are scheduled in Module F Step 5 yet; showing current founder FTE only.'
      );
    }
    const y1Desc =
      metrics.y1RoleTitles.length > 0
        ? metrics.y1RoleTitles.join(', ')
        : 'no external hires scheduled in Year 1';
    const y2Desc =
      metrics.y2RoleTitles.length > 0
        ? metrics.y2RoleTitles.join(', ')
        : 'no additional hires scheduled in Year 2';
    answer = `Under ${metrics.title}'s 3-year job creation plan (Module F), headcount scales from ${metrics.currentFTE} FTE today (${metrics.promoterName}) to ${metrics.y1TotalStaff} FTE in Year 1 (+${metrics.y1NewFTE}: ${y1Desc}), ${metrics.y2TotalStaff} FTE in Year 2 (+${metrics.y2NewFTE}: ${y2Desc}), and ${metrics.y3TotalStaff} FTE in Year 3 (+${metrics.y3NewFTE}).`;
  } else if (
    /revenue|turnover|profit|financial|projection|cashflow|margin|breakeven|pricing|unit\s*economic|sales\s*forecast/i.test(
      qLower
    )
  ) {
    citations.push('Module H (Revenue & Pricing)');
    citations.push('Module J (Financial Forecasts)');
    if (!metrics.hasFinancialInputs) {
      missingWarnings.push(
        'Pricing tiers (Module H) and 36-month financial assumptions (Module J) have not been saved yet.'
      );
      answer = `Financial projections and pricing tiers are not yet recorded for ${metrics.title}. Please complete Module H (Pricing & Pocket Profit Breakeven) and Module J (36-Month Financial Builder) so exact Year 1–3 turnover, operating profit, and cashflow trough figures can be cited.`;
    } else {
      answer = `${metrics.title} models commercial pricing at ${metrics.pricingSummary} (${metrics.grossMarginPercent}% contribution margin), reaching monthly operational breakeven at ${metrics.breakevenUnits}.\n\n• Year 1 Projected Turnover: ${metrics.y1Turnover} (Operating Profit: ${metrics.y1Profit})\n• Year 2 Projected Turnover: ${metrics.y2Turnover} (Operating Profit: ${metrics.y2Profit})\n• Year 3 Projected Turnover: ${metrics.y3Turnover}\n• Peak Working Capital Trough: ${metrics.troughAmount}`;
    }
  } else if (
    /technical|innovation|r&d|work\s*package|architecture|tech\s*stack|wp1|feasibility|deliver|approach|milestone|timeline|roadmap|schedule/i.test(
      qLower
    )
  ) {
    citations.push('Module D (Product Build & Work Packages)');
    if (!metrics.hasWorkPackages) {
      missingWarnings.push('Work Packages (WP1..n) have not been defined in Module D Step 5.');
      answer = `Structured Work Packages and technical milestones are not yet recorded for ${metrics.title}. Please complete Module D Step 5 (Work Packages & Delivery Roadmap) to generate a milestone-by-milestone technical execution answer.`;
    } else {
      answer = `${metrics.title} (${metrics.formFactor}) executes delivery across structured Work Packages recorded in Module D:\n\n${metrics.workPackagesSummary}`;
    }
  } else if (
    /competitor|moat|advantage|differentiat|wedge|rival|alternative|status\s*quo/i.test(
      qLower
    )
  ) {
    citations.push('Module B (Market & Competitors)');
    if (!metrics.hasMarketData) {
      missingWarnings.push('Competitors and Competitive Wedge have not been completed in Module B.');
    }
    answer = `${metrics.title} targets ${metrics.beachhead}.\n\n• Existing Alternatives / Competitors: ${metrics.competitors}\n• Competitive Wedge & Differentiation: ${metrics.wedge}`;
  } else if (
    /export|displacement|additionality|international|market\s*size|tam|sam|economic\s*impact/i.test(
      qLower
    )
  ) {
    citations.push('Module B (Market & Export Analysis)');
    answer = `${metrics.title} operates with the following market & export posture: ${metrics.exportPosture}, serving ${metrics.beachhead} with differentiation rooted in: ${metrics.wedge}.`;
  } else if (
    /promoter|founder|management\s*team|experience|background|qualification|lead|capability/i.test(
      qLower
    )
  ) {
    citations.push('Module F (Promoter Profiles & Team)');
    if (!metrics.hasPromoterBio) {
      missingWarnings.push(
        'Promoter 150-word biography is not yet recorded in Module F Step 1.'
      );
    }
    answer = `${metrics.title} is led by ${metrics.promoterName} (${metrics.currentFTE} FTE).\n\n• Promoter Capability Summary: ${metrics.promoterBio}\n• Personal Survival Budget (Module F Step 3): ${metrics.monthlySurvivalFormatted}`;
  } else if (
    /problem|solution|business\s*idea|describe\s*(your|the|my|our)\s*(business|startup|product|venture|company)|executive\s*summary|overview|what\s*do\s*(you|we)\s*do|value\s*proposition|150\s*word|pitch/i.test(
      qLower
    )
  ) {
    citations.push('Module A (Concept Canvas)');
    if (!metrics.hasConceptCanvas) {
      missingWarnings.push('Module A Concept Canvas fields are not yet completed.');
      answer = `Core problem, target customer, and proposed solution are not yet recorded in Module A for ${metrics.title}. Please complete your 1-Page Concept Canvas in Module A Step 3 first.`;
    } else {
      answer = `1. Core Problem (${metrics.targetCustomer}):\n${metrics.problem}\n\n2. Proposed Solution (${metrics.title}):\n${metrics.oneLiner}\n\n3. Commercial & Underwriting Fit (${assessorLens}):\nPricing: ${metrics.pricingSummary} | Breakeven: ${metrics.breakevenUnits} | Export Posture: ${metrics.exportPosture}.`;
    }
  } else {
    missingWarnings.push(
      'Specific details for this portal question were not found in deterministic fallback mode.'
    );
    answer = `We don't have that specific information recorded in the ${metrics.title} startup plan yet to answer: "${questionText}".\n\nPlease add the relevant details in the corresponding workspace module (Modules A–L) so we can generate a verified answer directly from your plan data.`;
  }

  return {
    id: `cq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    grantSlug: params.grantSlug,
    questionText,
    targetLength,
    assessorLens,
    answerText: answer,
    sourceModuleCitations: citations,
    missingDataWarnings: missingWarnings.length > 0 ? missingWarnings : undefined,
    askedAt: new Date().toISOString(),
  };
}

export async function answerQuestionFromStartupPlanAction(
  params: AnswerQuestionFromPlanParams
): Promise<AnswerQuestionFromPlanResult> {
  const { planId, questionText, targetLength, assessorLens, planSnapshot } =
    params;

  if (!planId || !UUID_REGEX.test(planId) || !questionText?.trim()) {
    return {
      success: false,
      question: buildDeterministicFallbackAnswer({
        ...params,
        planSnapshot: {} as ActiveStartupPlan,
      }),
      aiEngineUsed: 'smart-synthesizer',
      error: 'Missing required question text or valid plan ID.',
    };
  }

  const planAuth = await verifyActiveSessionAndPlanOwnership(planId, {
    requiredModule: 'MOD_K_GRANTS_FUNDING',
  });
  if (!planAuth.authorized || !planAuth.userId) {
    return {
      success: false,
      question: buildDeterministicFallbackAnswer({
        ...params,
        planSnapshot: {} as ActiveStartupPlan,
      }),
      aiEngineUsed: 'smart-synthesizer',
      error: planAuth.reason || 'Unauthorized access to startup plan.',
    };
  }

  let dbModF: SavedModuleFData | null = null;
  let dbModJ: SavedModuleJData | null = null;
  let dbModH: SavedModuleHData | null = null;
  let dbModL: SavedModuleLData | null = null;
  let dbModB: SavedModuleBData | null = null;
  let dbModC: SavedModuleCData | null = null;
  let dbModD: SavedModuleDData | null = null;
  let dbModE: SavedModuleEData | null = null;

  try {
    const dbModules = await db
      .select({
        moduleCode: planModulesData.moduleCode,
        inputs: planModulesData.structuredInputsJsonb,
      })
      .from(planModulesData)
      .where(eq(planModulesData.planId, planId));

    for (const row of dbModules) {
      if (row.moduleCode === 'MOD_F_COFOUNDER_TEAM')
        dbModF = row.inputs as SavedModuleFData;
      if (row.moduleCode === 'MOD_J_FINANCE')
        dbModJ = row.inputs as SavedModuleJData;
      if (row.moduleCode === 'MOD_H_REVENUE')
        dbModH = row.inputs as SavedModuleHData;
      if (row.moduleCode === 'MOD_L_BUSINESS_PLAN')
        dbModL = row.inputs as SavedModuleLData;
      if (row.moduleCode === 'MOD_B_MARKET')
        dbModB = row.inputs as SavedModuleBData;
      if (row.moduleCode === 'MOD_C_SURVEYS_FEEDBACK')
        dbModC = row.inputs as SavedModuleCData;
      if (row.moduleCode === 'MOD_D_PRODUCT_BUILD')
        dbModD = row.inputs as SavedModuleDData;
      if (row.moduleCode === 'MOD_E_OPERATIONS')
        dbModE = row.inputs as SavedModuleEData;
    }
  } catch (err: unknown) {
    console.warn(
      '[GrantAction] DB fetch warning:',
      err instanceof Error ? err.message : String(err)
    );
  }

  const dbOverrides = {
    modF: dbModF,
    modJ: dbModJ,
    modH: dbModH,
    modL: dbModL,
    modB: dbModB,
    modC: dbModC,
    modD: dbModD,
    modE: dbModE,
  };
  const metrics = extractKeyMetrics(
    planSnapshot,
    dbModF,
    dbModJ,
    dbModH,
    dbModL,
    dbModB,
    dbModC,
    dbModD,
    dbModE
  );

  let geminiAuth;
  try {
    geminiAuth = await authorizeAndPrepareGeminiCall(
      'MOD_K_GRANT_QA_COPILOT',
      'You are an expert Grant Assessor and Startup Preflight Evaluation Specialist.'
    );
  } catch (err: unknown) {
    console.warn(
      '[GrantAction] AI auth check fallback:',
      err instanceof Error ? err.message : String(err)
    );
    const fallbackQ = buildDeterministicFallbackAnswer(params, dbOverrides);
    return {
      success: true,
      question: fallbackQ,
      aiEngineUsed: 'smart-synthesizer',
    };
  }

  if (!geminiAuth.canCallLiveGemini || !geminiAuth.activeApiKey) {
    const fallbackQ = buildDeterministicFallbackAnswer(params, dbOverrides);
    return {
      success: true,
      question: fallbackQ,
      aiEngineUsed: 'smart-synthesizer',
    };
  }

  const modL = dbModL || planSnapshot.moduleLData;
  const compiledSections = modL?.step3Compiler?.sections || [];
  const compiledNarratives = compiledSections
    .map(
      (s) =>
        `SECTION ${s.sectionNumber} (${s.title}):\n${s.compiledResponseText || ''}`
    )
    .join('\n\n');

  const planDataSummary = `
PROJECT NAME: ${metrics.title}
ONE-LINER: ${metrics.oneLiner}
INDUSTRY: ${planSnapshot.industryCategory || 'Not specified'}
HQ COUNTRY: ${planSnapshot.hqCountryCode || 'IE'} (${metrics.currency})
EXPORT POTENTIAL: ${metrics.exportPosture}

MODULE A (CONCEPT CANVAS):
- Target Customer: ${metrics.targetCustomer}
- Core Problem: ${metrics.problem}
- Proposed Solution: ${metrics.oneLiner}
- Unfair Advantage: ${planSnapshot.conceptCanvas?.unfairAdvantage || 'Not yet recorded in Module A'}
- Revenue / Grant Fit: ${planSnapshot.conceptCanvas?.revenueAndGrantFit || 'Not yet recorded in Module A'}

MODULE B (MARKET & COMPETITORS):
- Beachhead Segment: ${metrics.beachhead}
- Direct & Indirect Competitors: ${metrics.competitors}
- Competitive Wedge / Moat: ${metrics.wedge}

MODULE C (VALIDATION & SURVEYS):
- Non-Simulated Survey Responses Count: ${metrics.surveyCount}
- Customer Interviews Logged: ${metrics.interviewCount}

MODULE D (PRODUCT & ROADMAP):
- Form Factor: ${metrics.formFactor}
- Work Packages: ${metrics.workPackagesSummary}

MODULE E (OPERATIONS, RISKS & EQUIPMENT):
- Equipment Schedule: ${metrics.equipmentSummary}
- Risk Register Summary: ${metrics.riskSummary}

MODULE F (TEAM, GOVERNANCE & 3-YEAR HEADCOUNT):
- Current Founder / Team FTE: ${metrics.currentFTE} FTE (${metrics.promoterName})
- Founder Personal Survival Budget: ${metrics.monthlySurvivalFormatted}
- Year 1 Headcount: ${metrics.y1TotalStaff} FTE (+${metrics.y1NewFTE} net new FTE: ${metrics.y1RoleTitles.join(', ') || 'None scheduled'})
- Year 2 Headcount (IN TWO YEARS): ${metrics.y2TotalStaff} FTE (+${metrics.y2NewFTE} net new FTE: ${metrics.y2RoleTitles.join(', ') || 'None scheduled'})
- Year 3 Headcount (IN THREE YEARS): ${metrics.y3TotalStaff} FTE (+${metrics.y3NewFTE} net new FTE: ${metrics.y3RoleTitles.join(', ') || 'None scheduled'})
- Founder Bio: ${metrics.promoterBio}

MODULE H (PRICING & REVENUE MODEL):
- Pricing Model: ${metrics.pricingSummary}
- Operational Breakeven Volume: ${metrics.breakevenUnits}
- Contribution Margin: ${metrics.hasFinancialInputs ? `${metrics.grossMarginPercent}%` : 'Not yet modeled in Module H'}

MODULE J (36-MONTH FINANCIAL FORECASTS):
- Year 1 Turnover: ${metrics.y1Turnover} (Operating Profit: ${metrics.y1Profit})
- Year 2 Turnover: ${metrics.y2Turnover} (Operating Profit: ${metrics.y2Profit})
- Year 3 Turnover: ${metrics.y3Turnover}
- Peak Cashflow Trough: ${metrics.troughAmount}

MODULE L (OFFICIAL COMPILED GRANT DOSSIER CHAPTERS):
${compiledNarratives || 'No compiled Module L chapters saved yet.'}
`;

  const targetWordCount =
    targetLength === 'SHORT'
      ? '75–120 words'
      : targetLength === 'STANDARD'
        ? '200–260 words'
        : '350–420 words';

  const prompt = `
You are an expert Grant Assessor and Startup Preflight Evaluation Specialist assisting the founder of "${metrics.title}".
A founder is submitting an official grant application or investor form and pasted a question from the portal:

OFFICIAL PORTAL QUESTION:
"${questionText}"

ASSESSOR LENS REQUIRED:
${assessorLens}

DESIRED TARGET LENGTH:
Strictly ${targetWordCount}.

STARTUP PLAN STRUCTURED FACTS:
${planDataSummary}

CRITICAL RULES FOR ACCURACY AND TONE:
1. DIRECT ANSWER MANDATE:
   - Directly and explicitly answer the official portal question in the very first sentence.
   - Cite ONLY numbers, roles, competitors, and milestones present in STARTUP PLAN STRUCTURED FACTS above.
2. NATURAL HUMAN FOUNDER VOICE:
   - Write in confident, articulate, professional English in first-person plural ("We", "${metrics.title}").
3. STRICT ZERO-HALLUCINATION & MISSING DATA MANDATE:
   - NEVER invent numbers, tech stacks, survey counts, founder names, or revenue figures when a field says "Not yet recorded" or "Not yet modeled".
   - If critical facts required to answer the question are missing from STARTUP PLAN STRUCTURED FACTS, state clearly which Module (A–L) needs to be completed and list the gap in "missingDataWarnings".
4. Output valid JSON matching this schema:
{
  "answerText": "string containing the complete copy-ready answer",
  "sourceModuleCitations": ["Array of module names where facts were drawn"],
  "missingDataWarnings": ["Optional array of warnings if facts were missing from the plan"]
}
`;

  let generateSucceededOnWire = false;
  try {
    const aiClient = getGenAiClient(geminiAuth.activeApiKey);
    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        maxOutputTokens: 2048,
        temperature: 0.2,
      },
    });
    generateSucceededOnWire = true;

    const rawResponseText = (response.text?.trim() || '')
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    if (!rawResponseText) {
      throw new Error('Empty JSON response from Gemini');
    }

    const parsed = JSON.parse(rawResponseText) as {
      answerText?: string;
      sourceModuleCitations?: string[];
      missingDataWarnings?: string[];
    };

    if (!parsed.answerText || !parsed.answerText.trim()) {
      throw new Error('Parsed response missing answerText');
    }

    await recordGeminiUsageAndIncrementCredits({
      verifiedUserId: geminiAuth.verifiedUserId,
      planId,
      promptKey: 'MOD_K_GRANT_QA_COPILOT',
      modelUsed: 'gemini-2.5-flash',
      inputTokens: response.usageMetadata?.promptTokenCount || 900,
      outputTokens: response.usageMetadata?.candidatesTokenCount || 350,
      usedByokKey: geminiAuth.usedByokKey,
      fallbackCreditsUsed: geminiAuth.currentCreditsUsed,
    });

    const savedQ: SavedCustomPortalQuestion = {
      id: `cq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      grantSlug: params.grantSlug,
      questionText,
      targetLength,
      assessorLens,
      answerText: parsed.answerText.trim(),
      sourceModuleCitations:
        Array.isArray(parsed.sourceModuleCitations) &&
        parsed.sourceModuleCitations.length > 0
          ? parsed.sourceModuleCitations
          : ['Module K (Grants & Funding Hub)'],
      missingDataWarnings: Array.isArray(parsed.missingDataWarnings)
        ? parsed.missingDataWarnings
        : undefined,
      askedAt: new Date().toISOString(),
    };

    return {
      success: true,
      question: savedQ,
      aiEngineUsed: 'gemini-2.5-flash',
    };
  } catch (err: unknown) {
    if (generateSucceededOnWire && geminiAuth.verifiedUserId) {
      await refundSettledGeminiCredit(
        geminiAuth.verifiedUserId,
        geminiAuth.usedByokKey
      );
    }
    console.error('[GrantAction] AI generation error:', err);
    const fallbackQ = buildDeterministicFallbackAnswer(params, dbOverrides);
    return {
      success: true,
      question: fallbackQ,
      aiEngineUsed: 'smart-synthesizer',
    };
  }
}

async function ensureModKEnumExists(): Promise<void> {
  try {
    await db.execute(
      sql`ALTER TYPE "public"."module_code" ADD VALUE IF NOT EXISTS 'MOD_K_GRANTS_FUNDING'`
    );
  } catch {
    // Ignore if already present
  }
}

export async function saveGrantCenterDataAction(params: {
  planId: string;
  grantCenterData: SavedGrantCenterData;
}): Promise<{ success: boolean; error?: string }> {
  const { planId, grantCenterData } = params;
  if (!planId || !UUID_REGEX.test(planId)) {
    return { success: false, error: 'Missing valid planId' };
  }

  const verified = await verifyActiveSessionAndPlanOwnership(planId, {
    requiredModule: 'MOD_K_GRANTS_FUNDING',
    requireWrite: true,
  });
  if (!verified.authorized || !verified.userId) {
    return {
      success: false,
      error: verified.reason || 'Unauthorized or plan not found',
    };
  }

  try {
    await ensureModKEnumExists();
    const nowIso = new Date().toISOString();

    await db.transaction(async (tx) => {
      const existingRows = await tx
        .select()
        .from(planModulesData)
        .where(
          and(
            eq(planModulesData.planId, planId),
            eq(planModulesData.moduleCode, 'MOD_K_GRANTS_FUNDING')
          )
        )
        .for('update');

      const currentJson: Record<string, unknown> =
        existingRows.length > 0 &&
        typeof existingRows[0].structuredInputsJsonb === 'object' &&
        existingRows[0].structuredInputsJsonb !== null
          ? (existingRows[0].structuredInputsJsonb as Record<string, unknown>)
          : {};

      const updatedJson: Record<string, unknown> = {
        ...currentJson,
        grantCenterData: {
          ...grantCenterData,
          lastVisitedAt: grantCenterData.lastVisitedAt || nowIso,
        },
        lastSavedAt: nowIso,
      };

      if (existingRows.length > 0) {
        await tx
          .update(planModulesData)
          .set({
            structuredInputsJsonb: updatedJson,
            updatedAt: new Date(),
          })
          .where(eq(planModulesData.id, existingRows[0].id));
      } else {
        await tx.insert(planModulesData).values({
          planId,
          moduleCode: 'MOD_K_GRANTS_FUNDING',
          structuredInputsJsonb: updatedJson,
        });
      }
    });

    return { success: true };
  } catch (err: unknown) {
    console.error('[GrantAction] Failed to persist grantCenterData:', err);
    return {
      success: false,
      error: 'Failed to save Grant Center progress to database',
    };
  }
}

export async function saveGrantTrackerStatusAction(params: {
  planId: string;
  grantSlug: string;
  tracker: Partial<SavedGrantApplicationTracker>;
}): Promise<{ success: boolean; error?: string }> {
  const { planId, grantSlug, tracker } = params;
  if (!planId || !UUID_REGEX.test(planId) || !grantSlug) {
    return { success: false, error: 'Missing valid planId or grantSlug' };
  }

  const verified = await verifyActiveSessionAndPlanOwnership(planId, {
    requiredModule: 'MOD_K_GRANTS_FUNDING',
    requireWrite: true,
  });
  if (!verified.authorized || !verified.userId) {
    return {
      success: false,
      error: verified.reason || 'Unauthorized or plan not found',
    };
  }

  try {
    await ensureModKEnumExists();
    const nowIso = new Date().toISOString();

    await db.transaction(async (tx) => {
      const existingRows = await tx
        .select()
        .from(planModulesData)
        .where(
          and(
            eq(planModulesData.planId, planId),
            eq(planModulesData.moduleCode, 'MOD_K_GRANTS_FUNDING')
          )
        )
        .for('update');

      const currentJson: Record<string, unknown> =
        existingRows.length > 0 &&
        typeof existingRows[0].structuredInputsJsonb === 'object' &&
        existingRows[0].structuredInputsJsonb !== null
          ? (existingRows[0].structuredInputsJsonb as Record<string, unknown>)
          : {};

      const existingCenter =
        (currentJson.grantCenterData as SavedGrantCenterData | undefined) || {};
      const existingApps = existingCenter.applications || {};
      const prevTracker = existingApps[grantSlug] || {
        grantSlug,
        status: 'NOT_STARTED' as const,
      };

      const mergedCenter: SavedGrantCenterData = {
        ...existingCenter,
        applications: {
          ...existingApps,
          [grantSlug]: {
            ...prevTracker,
            ...tracker,
            grantSlug,
            lastUpdatedAt: nowIso,
          },
        },
        lastVisitedAt: nowIso,
      };

      const updatedJson: Record<string, unknown> = {
        ...currentJson,
        grantCenterData: mergedCenter,
        lastSavedAt: nowIso,
      };

      if (existingRows.length > 0) {
        await tx
          .update(planModulesData)
          .set({
            structuredInputsJsonb: updatedJson,
            updatedAt: new Date(),
          })
          .where(eq(planModulesData.id, existingRows[0].id));
      } else {
        await tx.insert(planModulesData).values({
          planId,
          moduleCode: 'MOD_K_GRANTS_FUNDING',
          structuredInputsJsonb: updatedJson,
        });
      }
    });

    return { success: true };
  } catch (err: unknown) {
    console.error('[GrantAction] Failed to save grant tracker status:', err);
    return {
      success: false,
      error: 'Failed to persist grant tracker status',
    };
  }
}
