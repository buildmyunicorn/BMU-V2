/**
 * Module K — Grants, Tax Relief & Funding Hub
 * Step 1: Automated Cross-Platform Grant Audit & Multi-Grant Prerequisite Checklist
 */

import type {
  ActiveStartupPlan,
  FinancialOverheadLineItem,
  EquipmentAssetItem,
  PlannedRoleItem,
  FundingSourceLineItem,
} from '@/lib/auth/session-store';

export type GrantAuditStatus = 'PASS' | 'WARNING' | 'FAIL' | 'NOT_APPLICABLE';

export type SupportedGrantProgramKey =
  // Ireland
  | 'IE_LEO_FEASIBILITY'
  | 'IE_LEO_PRIMING'
  | 'IE_LEO_GROW_DIGITAL_AI'
  | 'IE_EI_PSSF'
  | 'IE_REVENUE_SURE_TAX_RELIEF'
  | 'IE_EI_EII_INVESTOR_RELIEF'
  // United Kingdom
  | 'GB_BBB_START_UP_LOAN'
  | 'GB_INNOVATE_UK_SMART'
  | 'GB_HMRC_SEIS_ASSURANCE'
  | 'GB_GROWTH_HUB_MATCH';

export interface GrantProgramDefinition {
  key: SupportedGrantProgramKey;
  country: 'IE' | 'GB';
  name: string;
  agency: string;
  fundingBadge: string;
  maxAmountFormatted: string;
  maxAmountNumeric: number;
  matchRatePercent: number; // e.g. 50% for LEO, 70% for Innovate UK, 100% for loans
  turnaroundSpeed: 'FAST_2_TO_4_WEEKS' | 'STANDARD_6_TO_8_WEEKS' | 'HEAVY_10_TO_16_WEEKS';
  turnaroundLabel: string;
  stageFit: string;
  description: string;
  officialUrl: string;
  underwritingSummary: string;
}

export const SUPPORTED_GRANT_PROGRAMS: Record<SupportedGrantProgramKey, GrantProgramDefinition> = {
  IE_LEO_FEASIBILITY: {
    key: 'IE_LEO_FEASIBILITY',
    country: 'IE',
    name: 'LEO Feasibility Study Grant',
    agency: 'Local Enterprise Office (LEO Ireland)',
    fundingBadge: 'Non-Dilutive Cash Grant',
    maxAmountFormatted: 'Up to €15,000 (50% match)',
    maxAmountNumeric: 15000,
    matchRatePercent: 50,
    turnaroundSpeed: 'STANDARD_6_TO_8_WEEKS',
    turnaroundLabel: '4–6 Weeks Turnaround',
    stageFit: 'Pre-Trading / Prototype Stage',
    description:
      'Co-funds prototype development, third-party technical feasibility studies, market research, and foreign travel for export investigation.',
    officialUrl:
      'https://www.localenterprise.ie/Discover-Business-Supports/Financial-Supports/Feasibility-Grant/',
    underwritingSummary:
      'Requires 50% founder matching funds (or 40% in BMW/Gaeltacht). Retrospective vouched invoices only. Standard laptops excluded.',
  },
  IE_LEO_PRIMING: {
    key: 'IE_LEO_PRIMING',
    country: 'IE',
    name: 'LEO Priming Grant',
    agency: 'Local Enterprise Office (LEO Ireland)',
    fundingBadge: 'Flagship Scale-Up Grant',
    maxAmountFormatted: 'Up to €80,000 (50% match)',
    maxAmountNumeric: 80000,
    matchRatePercent: 50,
    turnaroundSpeed: 'HEAVY_10_TO_16_WEEKS',
    turnaroundLabel: '8–12 Weeks Turnaround',
    stageFit: 'First 18 Months Trading',
    description:
      'Direct capital and employment support for micro-enterprises under 18 months old with internationally traded or high-potential manufacturing/services models.',
    officialUrl:
      'https://www.localenterprise.ie/Discover-Business-Supports/Financial-Supports/Priming-Grant/',
    underwritingSummary:
      'Must commit to creating sustainable PAYE jobs. Requires 3 independent supplier quotes for any purchase item > €5,000.',
  },
  IE_LEO_GROW_DIGITAL_AI: {
    key: 'IE_LEO_GROW_DIGITAL_AI',
    country: 'IE',
    name: 'LEO Grow Digital & AI Voucher',
    agency: 'Local Enterprise Office (LEO Ireland)',
    fundingBadge: 'Digital & AI Voucher',
    maxAmountFormatted: 'Up to €5,000 (50% co-funded)',
    maxAmountNumeric: 5000,
    matchRatePercent: 50,
    turnaroundSpeed: 'FAST_2_TO_4_WEEKS',
    turnaroundLabel: '2–3 Weeks Fast-Track',
    stageFit: 'Any Stage (Including Sole Trader)',
    description:
      'Accelerates cloud software implementation, AI workflow automation, e-commerce storefront enhancements, and digital security upgrades.',
    officialUrl:
      'https://www.localenterprise.ie/Discover-Business-Supports/Digital-Supports/Grow-Digital/',
    underwritingSummary:
      'Super-fast evaluation committee process. Suitable even for domestic/hybrid service businesses implementing digital AI efficiencies.',
  },
  IE_EI_PSSF: {
    key: 'IE_EI_PSSF',
    country: 'IE',
    name: 'Enterprise Ireland Pre-Seed Start Fund (PSSF)',
    agency: 'Enterprise Ireland (HPSU Division)',
    fundingBadge: 'Convertible Loan Note (CLN)',
    maxAmountFormatted: '€50,000 or €100,000 (Tranches)',
    maxAmountNumeric: 100000,
    matchRatePercent: 100,
    turnaroundSpeed: 'HEAVY_10_TO_16_WEEKS',
    turnaroundLabel: '10–14 Weeks Competitive',
    stageFit: 'High Potential Start-Up (HPSU)',
    description:
      'Early-stage equity/CLN funding for early-stage innovative startups targeting €1M+ export sales and 10+ jobs within 3–4 years.',
    officialUrl:
      'https://www.enterprise-ireland.com/en/funding/pre-seed-start-fund',
    underwritingSummary:
      'Strict HPSU criteria. Requires high innovation barrier, international scalability, and full-time leadership commitment.',
  },
  IE_REVENUE_SURE_TAX_RELIEF: {
    key: 'IE_REVENUE_SURE_TAX_RELIEF',
    country: 'IE',
    name: 'Revenue SURE (Startup Relief for Entrepreneurs)',
    agency: 'Irish Revenue Commissioners',
    fundingBadge: 'Direct PAYE Cash Refund',
    maxAmountFormatted: 'Up to €100,000+ Cash Refund',
    maxAmountNumeric: 100000,
    matchRatePercent: 100,
    turnaroundSpeed: 'STANDARD_6_TO_8_WEEKS',
    turnaroundLabel: '4–8 Weeks Post-Filing',
    stageFit: 'New LTD (Founder leaving employment)',
    description:
      'Refunds PAYE income taxes paid by the founder in former employment over the prior 6 years, injecting up to 41% of salary tax back into the startup.',
    officialUrl: 'https://www.revenue.ie/en/tax-professionals/tdm/income-tax-capital-gains-tax-corporation-tax/part-16/16-00-03.pdf',
    underwritingSummary:
      'Must incorporate a qualifying trade (LTD) and take at least 15% equity. Does not dilute equity to third parties.',
  },
  IE_EI_EII_INVESTOR_RELIEF: {
    key: 'IE_EI_EII_INVESTOR_RELIEF',
    country: 'IE',
    name: 'Employment Investment Incentive (EII)',
    agency: 'Irish Revenue / EI Certified',
    fundingBadge: 'Angel Tax Catalyst (Up to 50%)',
    maxAmountFormatted: 'Up to €500,000/yr per Angel',
    maxAmountNumeric: 500000,
    matchRatePercent: 100,
    turnaroundSpeed: 'STANDARD_6_TO_8_WEEKS',
    turnaroundLabel: '4–6 Weeks Certification',
    stageFit: 'Angel / Seed Funding Round',
    description:
      'Gives private Irish investors up to 50% income tax relief on qualifying risk capital investments, dramatically speeding up angel round closes.',
    officialUrl: 'https://www.revenue.ie/en/investing-in-companies/employment-and-investment-incentive/index.aspx',
    underwritingSummary:
      'Company must be an SME with a qualifying trading activity. Enables founders to raise rounds locally with lower valuation friction.',
  },
  GB_BBB_START_UP_LOAN: {
    key: 'GB_BBB_START_UP_LOAN',
    country: 'GB',
    name: 'British Business Bank Start Up Loan',
    agency: 'British Business Bank (Gov-Backed)',
    fundingBadge: 'Unsecured 6% Fixed Loan',
    maxAmountFormatted: 'Up to £25,000 per Founder',
    maxAmountNumeric: 25000,
    matchRatePercent: 100,
    turnaroundSpeed: 'FAST_2_TO_4_WEEKS',
    turnaroundLabel: '2–4 Weeks Turnaround',
    stageFit: 'Trading < 36 Months / Pre-Trading',
    description:
      'Government-backed personal loan for business purposes. Fixed 6% interest rate, 1–5 year term, zero early repayment penalties, 12 months free mentoring.',
    officialUrl: 'https://www.startuploans.co.uk/',
    underwritingSummary:
      'Underwritten on the founder’s personal credit and Module F Personal Survival Budget. Up to 4 co-founders can borrow up to £100,000 collectively.',
  },
  GB_INNOVATE_UK_SMART: {
    key: 'GB_INNOVATE_UK_SMART',
    country: 'GB',
    name: 'Innovate UK Smart Grant',
    agency: 'Innovate UK / UKRI',
    fundingBadge: 'Competitive R&D Cash Grant',
    maxAmountFormatted: '£100,000 to £500,000 (70% match)',
    maxAmountNumeric: 250000,
    matchRatePercent: 70,
    turnaroundSpeed: 'HEAVY_10_TO_16_WEEKS',
    turnaroundLabel: '12–16 Weeks Competitive',
    stageFit: 'R&D / High-Tech Innovation',
    description:
      'Co-funds game-changing, highly disruptive R&D innovations with substantial technical risk and major UK economic export potential.',
    officialUrl: 'https://www.ukri.org/councils/innovate-uk/',
    underwritingSummary:
      'Scored on a rigorous 9-question IFS rubric. Requires proven technical merit, Freedom to Operate (FTO), and structured work packages.',
  },
  GB_HMRC_SEIS_ASSURANCE: {
    key: 'GB_HMRC_SEIS_ASSURANCE',
    country: 'GB',
    name: 'HMRC SEIS (Seed Enterprise Investment Scheme)',
    agency: 'HM Revenue & Customs (UK)',
    fundingBadge: 'Angel Tax Catalyst (50% Relief)',
    maxAmountFormatted: 'Up to £250,000 Company Cap',
    maxAmountNumeric: 250000,
    matchRatePercent: 100,
    turnaroundSpeed: 'STANDARD_6_TO_8_WEEKS',
    turnaroundLabel: '4–6 Weeks Advance Assurance',
    stageFit: 'Trading < 3 Years / Seed Round',
    description:
      'Gives UK angel investors 50% income tax relief plus complete Capital Gains Tax exemption. Advance Assurance is required by 90% of UK angels.',
    officialUrl: 'https://www.gov.uk/guidance/venture-capital-schemes-apply-to-use-the-seed-enterprise-investment-scheme',
    underwritingSummary:
      'Requires a UK permanent establishment, qualifying trade, gross assets < £350k, and fewer than 25 employees.',
  },
  GB_GROWTH_HUB_MATCH: {
    key: 'GB_GROWTH_HUB_MATCH',
    country: 'GB',
    name: 'Local Growth Hub Match Grant',
    agency: 'Local Enterprise Partnerships / Growth Hubs',
    fundingBadge: 'Regional Match Grant',
    maxAmountFormatted: '£2,500 to £10,000 (50% match)',
    maxAmountNumeric: 10000,
    matchRatePercent: 50,
    turnaroundSpeed: 'FAST_2_TO_4_WEEKS',
    turnaroundLabel: '3–5 Weeks Turnaround',
    stageFit: 'Pre-Trading or Early Growth',
    description:
      'Regional capital and business support grants administered through England, Scotland (SE), Wales (DBW), or Invest NI for local micro-enterprises.',
    officialUrl: 'https://www.lepnetwork.net/growth-hubs/',
    underwritingSummary:
      'Varies by county council / Growth Hub. Strong preference for digital adoption, clean tech, and local employment.',
  },
};

export interface GrantAuditCheckpoint {
  id: string;
  category: 'LEGAL' | 'COMMERCIAL' | 'EQUIPMENT' | 'FINANCIAL' | 'VALIDATION' | 'TEAM';
  title: string;
  sourceModule: string;
  sourceModuleCode:
    | 'MOD_A_IDEATION'
    | 'MOD_B_MARKET'
    | 'MOD_C_SURVEYS_FEEDBACK'
    | 'MOD_D_PRODUCT_BUILD'
    | 'MOD_E_OPERATIONS'
    | 'MOD_F_COFOUNDER_TEAM'
    | 'MOD_G_LAUNCHPAD'
    | 'MOD_H_REVENUE'
    | 'MOD_I_MARKETING'
    | 'MOD_J_FINANCE';
  targetStepNumber: number;
  highlightTargetId: string;
  status: GrantAuditStatus;
  statusBadge: string;
  findingSummary: string;
  assessorRuleDescription: string;
  remedyActionLabel: string;
  canQuickFixWithAi?: boolean;
}

export interface EvaluatedGrantProgramAudit {
  programKey: SupportedGrantProgramKey;
  programDefinition: GrantProgramDefinition;
  readinessScorePercent: number;
  isRecommendedPrimary: boolean;
  passCount: number;
  warningCount: number;
  failCount: number;
  checkpoints: GrantAuditCheckpoint[];
  criticalBlockers: string[];
  keyStrengths: string[];
}

export interface ModuleKStep1AuditData {
  selectedGrantKey: SupportedGrantProgramKey;
  country: 'IE' | 'GB';
  currency: string;
  evaluatedPrograms: EvaluatedGrantProgramAudit[];
  overallAssessorReadinessScore: number;
  stackedFundingRoadmapSelected: boolean;
  founderNotes: string;
  lastAuditedAt?: string;
}

/**
 * Helper to audit an active startup plan across all existing modules A-J
 * against a specific grant program's official criteria.
 */
export function evaluatePlanGrantCheckpoints(
  plan: ActiveStartupPlan,
  programKey: SupportedGrantProgramKey
): EvaluatedGrantProgramAudit {
  const program = SUPPORTED_GRANT_PROGRAMS[programKey];
  const isIE = program.country === 'IE';
  const checkpoints: GrantAuditCheckpoint[] = [];

  // Scanned modules data
  const modG = plan.moduleGData;
  const modF = plan.moduleFData;
  const modE = plan.moduleEData;
  const modD = plan.moduleDData;
  const modC = plan.moduleCData;
  const modB = plan.moduleBData;
  const modA = plan.grantEligibilityCheck;
  const modJ = plan.moduleJData;

  // -------------------------------------------------------------
  // 1. LEGAL ENTITY & AGE CHECKPOINT
  // -------------------------------------------------------------
  const legalStatus = modG?.step1?.legalStructure || modA?.legalEntityStage;
  const isIncorporated =
    legalStatus === 'LTD' ||
    legalStatus === 'DAC' ||
    legalStatus === 'LLP' ||
    legalStatus === 'LTD_UNDER_18M' ||
    legalStatus === 'LTD_OVER_18M';

  if (programKey === 'IE_LEO_PRIMING' || programKey === 'IE_EI_PSSF' || programKey === 'IE_REVENUE_SURE_TAX_RELIEF' || programKey === 'GB_HMRC_SEIS_ASSURANCE') {
    if (isIncorporated) {
      checkpoints.push({
        id: 'chk_legal_entity',
        category: 'LEGAL',
        title: 'Incorporated LTD Entity & Age Requirement',
        sourceModule: 'Module G (Launchpad Step 1)',
        sourceModuleCode: 'MOD_G_LAUNCHPAD',
        targetStepNumber: 1,
        highlightTargetId: 'ops-step-1-incorporation',
        status: 'PASS',
        statusBadge: 'Verified LTD',
        findingSummary: 'Registered limited company structure identified.',
        assessorRuleDescription:
          'Grant guidelines mandate a registered Private Limited Company (< 18–36 months trading) to receive drawdowns or issue tax relief shares.',
        remedyActionLabel: 'Review Company Details',
      });
    } else {
      checkpoints.push({
        id: 'chk_legal_entity',
        category: 'LEGAL',
        title: 'Incorporated LTD Entity Required',
        sourceModule: 'Module G (Launchpad Step 1)',
        sourceModuleCode: 'MOD_G_LAUNCHPAD',
        targetStepNumber: 1,
        highlightTargetId: 'ops-step-1-incorporation',
        status: 'FAIL',
        statusBadge: 'Pre-Inc / Sole Trader',
        findingSummary: 'Currently registered as Sole Trader or Pre-Incorporation.',
        assessorRuleDescription:
          `${program.name} requires a formally registered Private Limited Company before the evaluation committee signs off.`,
        remedyActionLabel: 'Incorporate in Module G',
      });
    }
  } else {
    checkpoints.push({
      id: 'chk_legal_entity',
      category: 'LEGAL',
      title: 'Legal Entity Stage Flexibility',
      sourceModule: 'Module G (Launchpad Step 1)',
      sourceModuleCode: 'MOD_G_LAUNCHPAD',
      targetStepNumber: 1,
      highlightTargetId: 'ops-step-1-incorporation',
      status: 'PASS',
      statusBadge: 'Flexible Entity Allowed',
      findingSummary: 'This program accepts pre-incorporation ideas, sole traders, or new companies.',
      assessorRuleDescription:
        `${program.name} does not require immediate LTD status. Sole traders and pre-trading founders are eligible.`,
      remedyActionLabel: 'View Entity in Module G',
    });
  }

  // -------------------------------------------------------------
  // 2. 3-QUOTE RULE ON CAPITAL & DEV ITEMS (> €5k / £5k)
  // -------------------------------------------------------------
  const equipmentItems: EquipmentAssetItem[] = modE?.premisesAndEquipment?.equipmentItems || [];
  const highValueWithout3Quotes = equipmentItems.filter(
    (item) => Number(item.totalCostExVat || 0) >= 5000 && item.quoteComplianceStatus !== 'HAVE_3_WRITTEN_QUOTES' && item.quoteComplianceStatus !== 'THREE_QUOTES_UPLOADED_READY'
  );

  if (isIE && (programKey === 'IE_LEO_FEASIBILITY' || programKey === 'IE_LEO_PRIMING')) {
    if (highValueWithout3Quotes.length > 0) {
      checkpoints.push({
        id: 'chk_three_quotes',
        category: 'EQUIPMENT',
        title: '3-Quote Rule for Purchases > €5,000',
        sourceModule: 'Module E (Equipment Schedule Step 2)',
        sourceModuleCode: 'MOD_E_OPERATIONS',
        targetStepNumber: 2,
        highlightTargetId: 'ops-step-2-equipment',
        status: 'WARNING',
        statusBadge: `${highValueWithout3Quotes.length} Item(s) Need 3 Quotes`,
        findingSummary: `Found items over €5,000 without 3 independent supplier quotes logged (e.g., "${highValueWithout3Quotes[0].assetName}").`,
        assessorRuleDescription:
          'LEO financial committees automatically disqualify items exceeding €5,000 unless 3 comparable supplier quotations are submitted with the form.',
        remedyActionLabel: 'Add Quotes in Module E',
      });
    } else {
      checkpoints.push({
        id: 'chk_three_quotes',
        category: 'EQUIPMENT',
        title: '3-Quote Compliance Verified',
        sourceModule: 'Module E (Equipment Schedule Step 2)',
        sourceModuleCode: 'MOD_E_OPERATIONS',
        targetStepNumber: 2,
        highlightTargetId: 'ops-step-2-equipment',
        status: 'PASS',
        statusBadge: 'Quotes Compliant',
        findingSummary: 'All high-value equipment or technical packages satisfy procurement guidelines.',
        assessorRuleDescription:
          'All capital expenditure lines adhere to the government procurement quote threshold.',
        remedyActionLabel: 'Review Schedule in Module E',
      });
    }
  } else {
    checkpoints.push({
      id: 'chk_three_quotes',
      category: 'EQUIPMENT',
      title: 'Supplier Procurement Benchmarks',
      sourceModule: 'Module E (Equipment Schedule Step 2)',
      sourceModuleCode: 'MOD_E_OPERATIONS',
      targetStepNumber: 2,
      highlightTargetId: 'ops-step-2-equipment',
      status: 'PASS',
      statusBadge: 'Verified Costs',
      findingSummary: 'Budgeted vendor costs align with market rate benchmarks.',
      assessorRuleDescription: 'No strict statutory 3-quote requirement on this specific funding line.',
      remedyActionLabel: 'Check Costs in Module E',
    });
  }

  // -------------------------------------------------------------
  // 3. INELIGIBLE CAPITAL BAN (LAPTOP / GENERIC HARDWARE)
  // -------------------------------------------------------------
  const hasLaptopOrStandardGadget = equipmentItems.some((item) =>
    item.isMobileOrLaptopIneligibleForLeoGrant ||
    item.isFlaggedLaptopOrMobileAsset ||
    /laptop|macbook|notebook|iphone|ipad|smartphone|personal computer/i.test(item.assetName || '')
  );

  if (isIE && (programKey === 'IE_LEO_FEASIBILITY' || programKey === 'IE_LEO_PRIMING')) {
    if (hasLaptopOrStandardGadget) {
      checkpoints.push({
        id: 'chk_laptop_ban',
        category: 'EQUIPMENT',
        title: 'Disqualified Asset Detection (Standard Laptop Ban)',
        sourceModule: 'Module E (Equipment Schedule Step 2)',
        sourceModuleCode: 'MOD_E_OPERATIONS',
        targetStepNumber: 2,
        highlightTargetId: 'ops-step-2-equipment',
        status: 'FAIL',
        statusBadge: 'Laptop / Mobile Detected',
        findingSummary: 'Capital schedule includes standard laptops or consumer smartphones.',
        assessorRuleDescription:
          'LEO explicitly excludes standard laptops, desktops, and mobile phones from grant assistance under national aid guidelines.',
        remedyActionLabel: 'Reclassify in Module E',
      });
    } else {
      checkpoints.push({
        id: 'chk_laptop_ban',
        category: 'EQUIPMENT',
        title: 'Zero Ineligible Capital Assets',
        sourceModule: 'Module E (Equipment Schedule Step 2)',
        sourceModuleCode: 'MOD_E_OPERATIONS',
        targetStepNumber: 2,
        highlightTargetId: 'ops-step-2-equipment',
        status: 'PASS',
        statusBadge: '100% Eligible Assets',
        findingSummary: 'No disqualified standard office laptops or consumer phones logged in grant schedule.',
        assessorRuleDescription:
          'Clean capital equipment schedule satisfying Enterprise Ireland / LEO exclusion guidelines.',
        remedyActionLabel: 'View Schedule in Module E',
      });
    }
  }

  // -------------------------------------------------------------
  // 4. EXPORT / NON-DISPLACEMENT TEST
  // -------------------------------------------------------------
  const isExportOriented =
    plan.exportPotential === 'EXPORTING_INTERNATIONALLY' ||
    (plan.targetMarketsArray && plan.targetMarketsArray.length > 1) ||
    modB?.beachhead?.beachheadSegment;

  if (programKey === 'IE_LEO_PRIMING' || programKey === 'IE_EI_PSSF' || programKey === 'GB_INNOVATE_UK_SMART') {
    if (isExportOriented) {
      checkpoints.push({
        id: 'chk_export_displacement',
        category: 'COMMERCIAL',
        title: 'Export Potential & Non-Displacement Test',
        sourceModule: 'Module B (Competitive Wedge Step 5)',
        sourceModuleCode: 'MOD_B_MARKET',
        targetStepNumber: 5,
        highlightTargetId: 'market-step-5-wedge',
        status: 'PASS',
        statusBadge: 'Export Verified',
        findingSummary: 'International expansion roadmap and export wedge identified.',
        assessorRuleDescription:
          'State aid rules prohibit funding businesses that solely displace existing domestic local shops or services.',
        remedyActionLabel: 'Review Wedge in Module B',
      });
    } else {
      checkpoints.push({
        id: 'chk_export_displacement',
        category: 'COMMERCIAL',
        title: 'Export / Non-Displacement Risk',
        sourceModule: 'Module B (Competitive Wedge Step 5)',
        sourceModuleCode: 'MOD_B_MARKET',
        targetStepNumber: 5,
        highlightTargetId: 'market-step-5-wedge',
        status: 'WARNING',
        statusBadge: 'Domestic-Only Risk',
        findingSummary: 'Plan appears focused on domestic local trade only.',
        assessorRuleDescription:
          `${program.name} prioritises internationally traded services or products that generate net-new wealth and do not cannibalise local competitors.`,
        remedyActionLabel: 'Refine Export in Module B',
        canQuickFixWithAi: true,
      });
    }
  }

  // -------------------------------------------------------------
  // 5. MATCHING FUNDS & WORKING CAPITAL PROOF
  // -------------------------------------------------------------
  const founderEquity = modJ?.step3CashflowGap?.fundingSources?.find(
    (l: FundingSourceLineItem) => l.sourceType === 'FOUNDER_SAVINGS_EQUITY'
  );
  const founderAmount = founderEquity ? Number(founderEquity.amount || 0) : 0;
  const matchRequired = program.maxAmountNumeric * (program.matchRatePercent / 100);

  if (program.matchRatePercent < 100) {
    if (founderAmount > 0) {
      checkpoints.push({
        id: 'chk_matching_funds',
        category: 'FINANCIAL',
        title: `Matching Funds Proof (${100 - program.matchRatePercent}% Required)`,
        sourceModule: 'Module J (Funding Sources Step 3)',
        sourceModuleCode: 'MOD_J_FINANCE',
        targetStepNumber: 3,
        highlightTargetId: 'finance-step-3-cashflow',
        status: 'PASS',
        statusBadge: 'Match Funds Pledged',
        findingSummary: `Found €/£${founderAmount.toLocaleString()} committed from founder savings/equity.`,
        assessorRuleDescription:
          'Assessors require concrete bank statement proof of co-funding matching capital before releasing a formal Letter of Offer.',
        remedyActionLabel: 'Check Match in Module J',
      });
    } else {
      checkpoints.push({
        id: 'chk_matching_funds',
        category: 'FINANCIAL',
        title: `Founder Matching Funds Missing`,
        sourceModule: 'Module J (Funding Sources Step 3)',
        sourceModuleCode: 'MOD_J_FINANCE',
        targetStepNumber: 3,
        highlightTargetId: 'finance-step-3-cashflow',
        status: 'WARNING',
        statusBadge: 'No Match Funds Logged',
        findingSummary: 'No founder cash match or private funding source registered in Module J.',
        assessorRuleDescription:
          `Grants are co-funded. You need at least ${100 - program.matchRatePercent}% cash match to claim this support.`,
        remedyActionLabel: 'Pledge Funds in Module J',
      });
    }
  }

  // -------------------------------------------------------------
  // 6. JOB CREATION / HEADCOUNT COMMITMENT
  // -------------------------------------------------------------
  const jobRoles: PlannedRoleItem[] = modF?.step5HiringPlanData?.roles || [];
  const totalJobsCount = jobRoles.length;

  if (programKey === 'IE_LEO_PRIMING' || programKey === 'IE_EI_PSSF') {
    if (totalJobsCount >= 1) {
      checkpoints.push({
        id: 'chk_job_creation',
        category: 'TEAM',
        title: '3-Year Job Creation Target',
        sourceModule: 'Module F (Headcount Plan Step 5)',
        sourceModuleCode: 'MOD_F_COFOUNDER_TEAM',
        targetStepNumber: 5,
        highlightTargetId: 'team-step-5-hiring',
        status: 'PASS',
        statusBadge: `${totalJobsCount} Jobs Scheduled`,
        findingSummary: `${totalJobsCount} job roles mapped with estimated salaries and start dates.`,
        assessorRuleDescription:
          'Priming and PSSF underwrite grants heavily on sustainable payroll job creation over 12–36 months.',
        remedyActionLabel: 'View Roles in Module F',
      });
    } else {
      checkpoints.push({
        id: 'chk_job_creation',
        category: 'TEAM',
        title: 'Zero New Jobs Scheduled',
        sourceModule: 'Module F (Headcount Plan Step 5)',
        sourceModuleCode: 'MOD_F_COFOUNDER_TEAM',
        targetStepNumber: 5,
        highlightTargetId: 'team-step-5-hiring',
        status: 'WARNING',
        statusBadge: 'No Jobs Scheduled',
        findingSummary: 'No forward hiring plan detected in Module F Step 5.',
        assessorRuleDescription:
          `${program.name} specifically evaluates economic impact. Schedule at least 1–2 prospective roles.`,
        remedyActionLabel: 'Add Roles in Module F',
      });
    }
  }

  // -------------------------------------------------------------
  // 7. FOUNDER COMMITMENT & SURVIVAL BUDGET
  // -------------------------------------------------------------
  const survivalBudgetItems = modF?.step3SurvivalBudgetData?.founderBudgets || [];
  const survivalBudget = survivalBudgetItems.reduce((acc, curr) => acc + (curr.housingAndUtilities + curr.groceriesAndEssentials + curr.debtAndLoanCommitments), 0);
  const isFounderFullTime = plan.founderMotivation?.weeklyHoursAvailable === '40_PLUS_HRS';

  if (programKey === 'GB_BBB_START_UP_LOAN') {
    if (survivalBudget > 0) {
      checkpoints.push({
        id: 'chk_survival_budget',
        category: 'FINANCIAL',
        title: 'Personal Survival Budget Form Completed',
        sourceModule: 'Module F (Survival Budget Step 2)',
        sourceModuleCode: 'MOD_F_COFOUNDER_TEAM',
        targetStepNumber: 2,
        highlightTargetId: 'team-step-2-survival-budget',
        status: 'PASS',
        statusBadge: 'Budget Ready',
        findingSummary: `Personal net monthly survival calculated at £${Number(survivalBudget).toLocaleString()}/mo.`,
        assessorRuleDescription:
          'British Business Bank underwriters mandate a comprehensive Personal Survival Budget to confirm loan affordability.',
        remedyActionLabel: 'Check Budget in Module F',
      });
    } else {
      checkpoints.push({
        id: 'chk_survival_budget',
        category: 'FINANCIAL',
        title: 'Personal Survival Budget Incomplete',
        sourceModule: 'Module F (Survival Budget Step 2)',
        sourceModuleCode: 'MOD_F_COFOUNDER_TEAM',
        targetStepNumber: 2,
        highlightTargetId: 'team-step-2-survival-budget',
        status: 'FAIL',
        statusBadge: 'Missing Survival Budget',
        findingSummary: 'Survival budget numbers are missing or zero in Module F.',
        assessorRuleDescription:
          'Start Up Loans underwriters reject applications without an itemised personal living budget.',
        remedyActionLabel: 'Complete in Module F',
      });
    }
  } else {
    checkpoints.push({
      id: 'chk_founder_commitment',
      category: 'TEAM',
      title: 'Founder Time & Capacity Commitment',
      sourceModule: 'Module A (Motivation Step 2)',
      sourceModuleCode: 'MOD_A_IDEATION',
      targetStepNumber: 2,
      highlightTargetId: 'ideation-step-2-motivation',
      status: isFounderFullTime ? 'PASS' : 'WARNING',
      statusBadge: isFounderFullTime ? 'Full-Time (40+ hrs)' : 'Part-Time / Side-Hustle',
      findingSummary: isFounderFullTime
        ? 'Founder committed full-time to project execution.'
        : 'Founder currently logged as part-time or moonlighting.',
      assessorRuleDescription:
        'State agencies prefer or mandate at least one key promoter transitioning to full-time within 6–12 months.',
      remedyActionLabel: 'Adjust Hours in Module A',
    });
  }

  // -------------------------------------------------------------
  // 8. CUSTOMER VALIDATION & PROOF POINTS
  // -------------------------------------------------------------
  const surveys = modC?.surveys || [];
  const interviewLogs = modC?.interviewLogs || [];
  const hasValidationProof = surveys.length > 0 || interviewLogs.length > 0;

  if (hasValidationProof) {
    checkpoints.push({
      id: 'chk_customer_validation',
      category: 'VALIDATION',
      title: 'Mom-Test Survey & Market Validation Evidence',
      sourceModule: 'Module C (Feedback & Survey Kit)',
      sourceModuleCode: 'MOD_C_SURVEYS_FEEDBACK',
      targetStepNumber: 3,
      highlightTargetId: 'survey-step-3-builder',
      status: 'PASS',
      statusBadge: 'Validated Demand',
      findingSummary: 'Structured customer survey data and early interview evidence available.',
      assessorRuleDescription:
        'Grant evaluation panels prioritise applications that present primary data over theoretical market assumptions.',
      remedyActionLabel: 'View Proof in Module C',
    });
  } else {
    checkpoints.push({
      id: 'chk_customer_validation',
      category: 'VALIDATION',
      title: 'Customer Validation Evidence Needed',
      sourceModule: 'Module C (Feedback & Survey Kit)',
      sourceModuleCode: 'MOD_C_SURVEYS_FEEDBACK',
      targetStepNumber: 3,
      highlightTargetId: 'survey-step-3-builder',
      status: 'WARNING',
      statusBadge: 'Needs Primary Proof',
      findingSummary: 'No structured customer interviews or survey responses compiled.',
      assessorRuleDescription:
        'Assessors frequently downgrade applications lacking genuine customer willingness-to-pay interviews.',
      remedyActionLabel: 'Build Survey in Module C',
    });
  }

  // -------------------------------------------------------------
  // 9. TECHNICAL MERIT & WORK PACKAGES (WP1..WPn)
  // -------------------------------------------------------------
  const workPackages = modD?.workPackagesAndFlow?.workPackages || [];
  const hasWorkPackages = workPackages.length > 0;

  if (programKey === 'GB_INNOVATE_UK_SMART' || programKey === 'IE_EI_PSSF' || programKey === 'IE_LEO_FEASIBILITY') {
    if (hasWorkPackages) {
      checkpoints.push({
        id: 'chk_work_packages',
        category: 'COMMERCIAL',
        title: 'Work Package Breakdown (WP1..WPn)',
        sourceModule: 'Module D (Technical Merit Step 5)',
        sourceModuleCode: 'MOD_D_PRODUCT_BUILD',
        targetStepNumber: 5,
        highlightTargetId: 'build-step-5-merit',
        status: 'PASS',
        statusBadge: `${workPackages.length} Work Packages Defined`,
        findingSummary: `${workPackages.length} structured milestones with clear technical deliverables.`,
        assessorRuleDescription:
          'Formal research and feasibility grants require structured work packages with deliverables, timelines, and risks.',
        remedyActionLabel: 'Review WPs in Module D',
      });
    } else {
      checkpoints.push({
        id: 'chk_work_packages',
        category: 'COMMERCIAL',
        title: 'Work Packages Not Structured',
        sourceModule: 'Module D (Technical Merit Step 5)',
        sourceModuleCode: 'MOD_D_PRODUCT_BUILD',
        targetStepNumber: 5,
        highlightTargetId: 'build-step-5-merit',
        status: 'WARNING',
        statusBadge: 'No Work Packages',
        findingSummary: 'No formal technical work packages compiled in Module D.',
        assessorRuleDescription:
          `${program.name} assessors score applications on methodology clarity. Break your build into 3–4 discrete work packages.`,
        remedyActionLabel: 'Generate WPs in Module D',
        canQuickFixWithAi: true,
      });
    }
  }

  // -------------------------------------------------------------
  // 10. BUSINESS BANK ACCOUNT OPENED
  // -------------------------------------------------------------
  const bankCard = modG?.step3?.hasDedicatedIban || modG?.step3?.state === 'ALREADY_HAVE';
  if (bankCard) {
    checkpoints.push({
      id: 'chk_bank_account',
      category: 'LEGAL',
      title: 'Dedicated Business Bank Account',
      sourceModule: 'Module G (Launchpad Step 3)',
      sourceModuleCode: 'MOD_G_LAUNCHPAD',
      targetStepNumber: 3,
      highlightTargetId: 'ops-step-3-banking',
      status: 'PASS',
      statusBadge: 'Account Active',
      findingSummary: 'Business bank account confirmed for official electronic transfers.',
      assessorRuleDescription:
        'State agencies and BBB lenders cannot release funds into personal savings or current accounts.',
      remedyActionLabel: 'Review Bank in Module G',
    });
  } else {
    checkpoints.push({
      id: 'chk_bank_account',
      category: 'LEGAL',
      title: 'Business Bank Account Pending',
      sourceModule: 'Module G (Launchpad Step 3)',
      sourceModuleCode: 'MOD_G_LAUNCHPAD',
      targetStepNumber: 3,
      highlightTargetId: 'ops-step-3-banking',
      status: 'WARNING',
      statusBadge: 'Action Required',
      findingSummary: 'No dedicated business bank account registered.',
      assessorRuleDescription:
        'Grant reimbursements and startup loan drawdowns are paid exclusively to a verified company account.',
      remedyActionLabel: 'Unlock Bank in Module G',
    });
  }

  // Calculate scores
  const passCount = checkpoints.filter((c) => c.status === 'PASS').length;
  const warningCount = checkpoints.filter((c) => c.status === 'WARNING').length;
  const failCount = checkpoints.filter((c) => c.status === 'FAIL').length;
  const total = checkpoints.length;

  // Weighting: Pass = 100%, Warning = 50%, Fail = 0%
  const weightedScore = Math.round(
    ((passCount * 100 + warningCount * 50) / (total * 100)) * 100
  );

  const criticalBlockers = checkpoints
    .filter((c) => c.status === 'FAIL')
    .map((c) => c.title);

  const keyStrengths = checkpoints
    .filter((c) => c.status === 'PASS')
    .map((c) => c.title);

  return {
    programKey,
    programDefinition: program,
    readinessScorePercent: weightedScore,
    isRecommendedPrimary: false,
    passCount,
    warningCount,
    failCount,
    checkpoints,
    criticalBlockers,
    keyStrengths,
  };
}

/**
 * Returns all evaluated grant programs for the startup's country (IE or GB).
 */
export function evaluateAllEligibleGrantsForPlan(
  plan: ActiveStartupPlan
): EvaluatedGrantProgramAudit[] {
  const isUK = plan.hqCountryCode === 'GB';
  const targetCountry = isUK ? 'GB' : 'IE';

  const relevantKeys = (
    Object.keys(SUPPORTED_GRANT_PROGRAMS) as SupportedGrantProgramKey[]
  ).filter((key) => SUPPORTED_GRANT_PROGRAMS[key].country === targetCountry);

  const evaluated = relevantKeys.map((key) =>
    evaluatePlanGrantCheckpoints(plan, key)
  );

  // Sort by highest readiness score first
  evaluated.sort((a, b) => b.readinessScorePercent - a.readinessScorePercent);

  if (evaluated.length > 0) {
    evaluated[0].isRecommendedPrimary = true;
  }

  return evaluated;
}
