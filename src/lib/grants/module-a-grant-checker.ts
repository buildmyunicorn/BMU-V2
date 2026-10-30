import {
  formatPlanCurrency,
  type SupportedCountryCode,
  type SupportedCurrencyCode,
} from '@/lib/localization';
import type {
  IndustryCategory,
  SavedConceptCanvas,
  SavedFounderMotivation,
  SavedFounderRealityCheck,
  SavedTeamAndBudget,
} from '@/lib/auth/session-store';

export type GrantLegalEntityStage =
  | 'PRE_INCORPORATION'
  | 'SOLE_TRADER'
  | 'LTD_UNDER_18M'
  | 'LTD_OVER_18M'
  | 'OTHER';

export type GrantCommercialActivityType =
  | 'EXPORT_SOFTWARE_DIGITAL'
  | 'PHYSICAL_MANUFACTURING_FOOD'
  | 'DEEPTECH_AI_RD'
  | 'LOCAL_DOMESTIC_SERVICE_RETAIL'
  | 'OTHER';

export type GrantFounderPayeStatus =
  | 'PAYE_LAST_6_YRS_GOING_FULLTIME'
  | 'PAYE_LAST_6_YRS_PARTTIME'
  | 'SELF_EMPLOYED_OR_OUTSIDE_PAYE_FULLTIME'
  | 'SELF_EMPLOYED_OR_OUTSIDE_PAYE_PARTTIME'
  | 'OTHER';

export type GrantRegionalLocationTier =
  | 'IE_STANDARD_50_MATCH'
  | 'IE_BMW_REGIONAL_60_MATCH'
  | 'IE_GAELTACHT_UDARAS'
  | 'GB_ENGLAND_GROWTH_HUB'
  | 'GB_SCOTLAND_SE'
  | 'GB_WALES_DBW'
  | 'GB_NORTHERN_IRELAND_INVEST_NI'
  | 'OTHER';

export interface SavedGrantEligibilityCheck {
  legalEntityStage: GrantLegalEntityStage;
  otherLegalEntityText?: string;
  commercialActivityType: GrantCommercialActivityType;
  otherCommercialActivityText?: string;
  founderPayeStatus: GrantFounderPayeStatus;
  otherFounderPayeText?: string;
  regionalLocationTier: GrantRegionalLocationTier;
  otherRegionalLocationText?: string;
  customGrantNotes: string;
  aiGrantPositioningAdvice?: string[];
  aiEngineUsed?: 'gemini-2.5-flash' | 'smart-synthesizer';
  lastCheckedAt?: string;
}

/**
 * Only show Step 8 (Grant & Funding Eligibility Checker) for regions
 * currently supported with deep grant rule-packs (Ireland & UK).
 */
export function isGrantCheckerSupportedForCountry(
  countryCode?: string
): boolean {
  const normalized = (countryCode || '').trim().toUpperCase();
  return normalized === 'IE' || normalized === 'GB';
}

export const GRANT_LEGAL_ENTITY_LABELS: Record<GrantLegalEntityStage, string> =
  {
    PRE_INCORPORATION: '🌱 Pre-Incorporation (Idea / Validation Stage)',
    SOLE_TRADER: '🧾 Registered Sole Trader / Partnership',
    LTD_UNDER_18M: '🏢 Incorporated LTD (< 18 Months Trading)',
    LTD_OVER_18M: '🏛️ Established LTD (18+ Months Trading)',
    OTHER: '✨ Other (Custom Legal Setup)',
  };

export const GRANT_ACTIVITY_TYPE_LABELS: Record<
  GrantCommercialActivityType,
  string
> = {
  EXPORT_SOFTWARE_DIGITAL:
    '💻 Internationally Traded Software, SaaS or Digital Platform',
  PHYSICAL_MANUFACTURING_FOOD:
    '🏭 Physical Product, Manufacturing, Craft or Food & Drink',
  DEEPTECH_AI_RD: '🔬 Deep-Tech, Proprietary AI, MedTech or Engineering R&D',
  LOCAL_DOMESTIC_SERVICE_RETAIL:
    '🏪 Local Domestic Service, Retail, Hospitality or Agency',
  OTHER: '✨ Other (Custom Commercial Activity)',
};

export const GRANT_PAYE_STATUS_LABELS: Record<GrantFounderPayeStatus, string> =
  {
    PAYE_LAST_6_YRS_GOING_FULLTIME:
      '💼 Paid PAYE Tax in Last 6 Yrs & Going Full-Time Within 6–12m',
    PAYE_LAST_6_YRS_PARTTIME:
      '🌙 Paid PAYE Tax in Last 6 Yrs & Keeping Day Job for Now',
    SELF_EMPLOYED_OR_OUTSIDE_PAYE_FULLTIME:
      '🚀 Self-Employed / Student / Returning & Going Full-Time',
    SELF_EMPLOYED_OR_OUTSIDE_PAYE_PARTTIME:
      '⚡ Self-Employed / Outside PAYE & Building Part-Time',
    OTHER: '✨ Other (Custom Tax & Employment Setup)',
  };

export const GRANT_REGIONAL_TIER_LABELS: Record<
  GrantRegionalLocationTier,
  string
> = {
  IE_STANDARD_50_MATCH:
    '🇮🇪 Dublin, Mid-East or South-West (Standard 50% LEO Grant Match)',
  IE_BMW_REGIONAL_60_MATCH:
    '🌲 BMW / Regional Counties — West, North-West & Midlands (60% LEO Match!)',
  IE_GAELTACHT_UDARAS:
    '🌊 Gaeltacht Region (Údarás na Gaeltachta Enhanced Supports)',
  GB_ENGLAND_GROWTH_HUB:
    '🏴󠁧󠁢󠁥󠁮󠁧󠁿 England (Local Growth Hub, UKSPF & Innovate UK)',
  GB_SCOTLAND_SE:
    '🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scotland (Scottish Enterprise, SMART: SCOTLAND & Business Gateway)',
  GB_WALES_DBW:
    '🏴󠁧󠁢󠁷󠁬󠁳󠁿 Wales (Development Bank of Wales & Business Wales)',
  GB_NORTHERN_IRELAND_INVEST_NI:
    '🇬🇧 Northern Ireland (Invest NI & Go Succeed Grants)',
  OTHER: '✨ Other (Custom Region / Local Authority)',
};

export function getDefaultGrantEligibilityCheck(input: {
  hqCountryCode: SupportedCountryCode;
  industryCategory: IndustryCategory | string;
  exportPotential: 'DOMESTIC_ONLY' | 'EXPORTING_INTERNATIONALLY';
  founderMotivation?: SavedFounderMotivation;
}): SavedGrantEligibilityCheck {
  const isUk = input.hqCountryCode === 'GB';
  const isFullTime =
    input.founderMotivation?.weeklyHoursAvailable === '40_PLUS_HRS' ||
    input.founderMotivation?.primaryMotivation === 'LEAVE_JOB' ||
    input.founderMotivation?.primaryMotivation === 'SCALE_STARTUP';

  let commercialActivityType: GrantCommercialActivityType =
    'EXPORT_SOFTWARE_DIGITAL';
  if (input.industryCategory === 'Hardware / MedTech / DeepTech') {
    commercialActivityType = 'DEEPTECH_AI_RD';
  } else if (
    input.industryCategory === 'E-Commerce / Physical Product / Food & Drink'
  ) {
    commercialActivityType = 'PHYSICAL_MANUFACTURING_FOOD';
  } else if (
    input.industryCategory === 'Brick & Mortar / Hospitality / Local Business' ||
    (input.industryCategory === 'Service / Agency / Consulting' &&
      input.exportPotential === 'DOMESTIC_ONLY')
  ) {
    commercialActivityType = 'LOCAL_DOMESTIC_SERVICE_RETAIL';
  }

  return {
    legalEntityStage: 'PRE_INCORPORATION',
    commercialActivityType,
    founderPayeStatus: isFullTime
      ? 'PAYE_LAST_6_YRS_GOING_FULLTIME'
      : 'PAYE_LAST_6_YRS_PARTTIME',
    regionalLocationTier: isUk
      ? 'GB_ENGLAND_GROWTH_HUB'
      : 'IE_STANDARD_50_MATCH',
    customGrantNotes: '',
  };
}

export type GrantMatchTier =
  | 'QUALIFIES_NOW'
  | 'UNLOCKABLE_NEXT'
  | 'NOT_ELIGIBLE';

export interface EvaluatedGrantMatch {
  slug: string;
  countryCode: 'IE' | 'GB';
  grantName: string;
  providerAgency: string;
  fundingType:
    | 'CASH_GRANT'
    | 'VOUCHER_OR_CONSULTANCY'
    | 'STIPEND_PROGRAMME'
    | 'TAX_RELIEF_REFUND'
    | 'STARTUP_LOAN'
    | 'EQUITY_OR_CLN';
  fundingTypeBadge: string;
  matchTier: GrantMatchTier;
  matchScorePercent: number;
  potentialValueNumeric: number; // Max cash/grant value for pool calculation
  potentialValueFormatted: string;
  coFundingOrMatchRequirement: string;
  whyYouMatchOrMiss: string;
  unlockRequirement?: string;
  reimbursementAndTrapWarning: string;
  preflightModulesToWin: string[];
  officialUrl: string;
}

export interface GrantCheckerEvaluationSummary {
  countryCode: 'IE' | 'GB';
  currency: SupportedCurrencyCode;
  qualifiesNowGrants: EvaluatedGrantMatch[];
  unlockableNextGrants: EvaluatedGrantMatch[];
  notEligibleGrants: EvaluatedGrantMatch[];
  immediateQualifiedPoolValue: number;
  immediateQualifiedPoolFormatted: string;
  unlockableScalePoolValue: number;
  unlockableScalePoolFormatted: string;
  totalCombinedPotentialValue: number;
  totalCombinedPotentialFormatted: string;
  budgetCashflowRealityWarning: string;
  strategicPositioningTips: string[];
}

export function evaluateModuleAGrantEligibility(input: {
  hqCountryCode: SupportedCountryCode;
  exportPotential: 'DOMESTIC_ONLY' | 'EXPORTING_INTERNATIONALLY';
  industryCategory: string;
  brainDumpText: string;
  conceptCanvas?: SavedConceptCanvas;
  founderMotivation?: SavedFounderMotivation;
  teamAndBudget?: SavedTeamAndBudget;
  founderRealityCheck?: SavedFounderRealityCheck;
  grantCheck: SavedGrantEligibilityCheck;
}): GrantCheckerEvaluationSummary {
  const countryCode: 'IE' | 'GB' =
    input.hqCountryCode === 'GB' ? 'GB' : 'IE';
  const currency: SupportedCurrencyCode =
    countryCode === 'GB' ? 'GBP' : 'EUR';

  const { grantCheck } = input;
  const isExportOrTraded =
    input.exportPotential === 'EXPORTING_INTERNATIONALLY' ||
    grantCheck.commercialActivityType === 'EXPORT_SOFTWARE_DIGITAL' ||
    grantCheck.commercialActivityType === 'PHYSICAL_MANUFACTURING_FOOD' ||
    grantCheck.commercialActivityType === 'DEEPTECH_AI_RD';

  const isLocalDomesticOnly =
    grantCheck.commercialActivityType === 'LOCAL_DOMESTIC_SERVICE_RETAIL' &&
    input.exportPotential === 'DOMESTIC_ONLY';

  const isDeepTechOrRD =
    grantCheck.commercialActivityType === 'DEEPTECH_AI_RD' ||
    grantCheck.commercialActivityType === 'EXPORT_SOFTWARE_DIGITAL' ||
    input.industryCategory.toLowerCase().includes('tech') ||
    input.industryCategory.toLowerCase().includes('saas') ||
    /ai|algorithm|software|platform|patent|hardware|sensor|biotech|medtech/i.test(
      `${input.brainDumpText} ${input.conceptCanvas?.proposedSolution || ''}`
    );

  const isLtdNow =
    grantCheck.legalEntityStage === 'LTD_UNDER_18M' ||
    grantCheck.legalEntityStage === 'LTD_OVER_18M';
  const isLtdUnder18M = grantCheck.legalEntityStage === 'LTD_UNDER_18M';
  const isPreIncOrSole =
    grantCheck.legalEntityStage === 'PRE_INCORPORATION' ||
    grantCheck.legalEntityStage === 'SOLE_TRADER';

  const hasPayeHistory =
    grantCheck.founderPayeStatus === 'PAYE_LAST_6_YRS_GOING_FULLTIME' ||
    grantCheck.founderPayeStatus === 'PAYE_LAST_6_YRS_PARTTIME';
  const isGoingFullTime =
    grantCheck.founderPayeStatus === 'PAYE_LAST_6_YRS_GOING_FULLTIME' ||
    grantCheck.founderPayeStatus === 'SELF_EMPLOYED_OR_OUTSIDE_PAYE_FULLTIME' ||
    input.founderMotivation?.weeklyHoursAvailable === '40_PLUS_HRS';

  const refusesOutsideInvestors =
    input.founderRealityCheck?.dealbreakers?.includes('NO_OUTSIDE_INVESTORS') &&
    input.founderRealityCheck?.growthTradeoff === 'BOOTSTRAP_100_CONTROL';

  const hasCoFounders =
    input.teamAndBudget?.teamStructureType === 'COFOUNDER_TEAM';

  const isBmwRegion =
    grantCheck.regionalLocationTier === 'IE_BMW_REGIONAL_60_MATCH';
  const isGaeltacht =
    grantCheck.regionalLocationTier === 'IE_GAELTACHT_UDARAS';

  const matches: EvaluatedGrantMatch[] = [];

  if (countryCode === 'IE') {
    const leoMatchRate = isGaeltacht ? '60%' : isBmwRegion ? '60%' : '50%';
    const agencyLabel = isGaeltacht
      ? 'Údarás na Gaeltachta / Local Enterprise Office'
      : 'Local Enterprise Office (LEO Ireland)';

    // 1. LEO Feasibility Study Grant
    if (!isLocalDomesticOnly && grantCheck.legalEntityStage !== 'LTD_OVER_18M') {
      matches.push({
        slug: 'ie-leo-feasibility-study-grant',
        countryCode: 'IE',
        grantName: isGaeltacht
          ? 'Údarás / LEO Feasibility Study Grant'
          : 'LEO Feasibility Study Grant',
        providerAgency: agencyLabel,
        fundingType: 'CASH_GRANT',
        fundingTypeBadge: 'Non-Dilutive Cash Grant',
        matchTier: 'QUALIFIES_NOW',
        matchScorePercent: isExportOrTraded ? 95 : 82,
        potentialValueNumeric: 15000,
        potentialValueFormatted: `Up to €15,000 (${leoMatchRate} Reimbursement Match)`,
        coFundingOrMatchRequirement: `Requires ${isBmwRegion || isGaeltacht ? '40%' : '50%'} founder cash match. You must pay approved suppliers first and claim back vouched receipts.`,
        whyYouMatchOrMiss: `Your ${GRANT_ACTIVITY_TYPE_LABELS[grantCheck.commercialActivityType].replace(/^[^\w]+/, '')} profile meets LEO's internationally traded / manufacturing innovation criteria, and you can apply at the ${GRANT_LEGAL_ENTITY_LABELS[grantCheck.legalEntityStage].replace(/^[^\w]+/, '')} stage.`,
        reimbursementAndTrapWarning:
          'Never spend a cent before receiving your signed Letter of Offer—retrospective invoices are 100% disqualified. General laptops and iPhones are excluded.',
        preflightModulesToWin: [
          'Module B (Non-Displacement & Market Sizing)',
          'Module C (Customer Survey Validation Proof)',
          'Module D/E (3 Vetted Prototype/Consultancy Quotes)',
          'Module K (Official LEO Form & Appendices)',
        ],
        officialUrl: 'https://www.localenterprise.ie/Discover-Business-Supports/Financial-Supports/Feasibility-Grant/',
      });
    } else if (isLocalDomesticOnly) {
      matches.push({
        slug: 'ie-leo-feasibility-study-grant',
        countryCode: 'IE',
        grantName: 'LEO Feasibility Study Grant',
        providerAgency: agencyLabel,
        fundingType: 'CASH_GRANT',
        fundingTypeBadge: 'Non-Dilutive Cash Grant',
        matchTier: 'UNLOCKABLE_NEXT',
        matchScorePercent: 55,
        potentialValueNumeric: 15000,
        potentialValueFormatted: `Up to €15,000 (${leoMatchRate} Reimbursement Match)`,
        coFundingOrMatchRequirement: `${leoMatchRate} grant reimbursement on prototype, market research, and consultancy costs.`,
        whyYouMatchOrMiss:
          'LEO Feasibility Grants exclude purely local retail, hospitality, or domestic-only services that displace existing local businesses.',
        unlockRequirement:
          'Add an exportable SaaS/digital product layer or internationally traded angle in Module B to pass LEO’s "Non-Displacement & Export" test.',
        reimbursementAndTrapWarning:
          'Paid strictly in arrears on vouched receipts after formal LEO Evaluation Committee approval.',
        preflightModulesToWin: [
          'Module B (Export Wedge & Non-Displacement Matrix)',
          'Module K (LEO Official Application Compiler)',
        ],
        officialUrl: 'https://www.localenterprise.ie/Discover-Business-Supports/Financial-Supports/Feasibility-Grant/',
      });
    } else {
      matches.push({
        slug: 'ie-leo-feasibility-study-grant',
        countryCode: 'IE',
        grantName: 'LEO Feasibility Study Grant / Technical Assistance',
        providerAgency: agencyLabel,
        fundingType: 'CASH_GRANT',
        fundingTypeBadge: 'Non-Dilutive Cash Grant',
        matchTier: 'QUALIFIES_NOW',
        matchScorePercent: 84,
        potentialValueNumeric: 15000,
        potentialValueFormatted: `Up to €15,000 (${leoMatchRate} Reimbursement Match)`,
        coFundingOrMatchRequirement: `${leoMatchRate} reimbursement match on new product/prototype feasibility expenditure.`,
        whyYouMatchOrMiss:
          'Even as an established LTD (18+ months), you can apply for Feasibility funding when researching a genuinely new export product line or R&D pivot.',
        reimbursementAndTrapWarning:
          'Must be scoped as a new R&D/export product feasibility study rather than routine business-as-usual operations.',
        preflightModulesToWin: [
          'Module D (Work Packages WP1..n)',
          'Module K (LEO Appendix Pack)',
        ],
        officialUrl: 'https://www.localenterprise.ie/Discover-Business-Supports/Financial-Supports/Feasibility-Grant/',
      });
    }

    // 2. Enterprise Ireland New Frontiers (Phase 1 & Phase 2 €15,000 Stipend)
    if (!isLocalDomesticOnly) {
      const nfReadyNow =
        grantCheck.legalEntityStage === 'PRE_INCORPORATION' ||
        grantCheck.legalEntityStage === 'SOLE_TRADER' ||
        grantCheck.legalEntityStage === 'LTD_UNDER_18M';
      matches.push({
        slug: 'ie-enterprise-ireland-new-frontiers',
        countryCode: 'IE',
        grantName: 'Enterprise Ireland New Frontiers (Phase 1 & Phase 2)',
        providerAgency: 'Enterprise Ireland (via Technological Universities)',
        fundingType: 'STIPEND_PROGRAMME',
        fundingTypeBadge: '€15k Tax-Free Stipend (0% Equity)',
        matchTier: nfReadyNow && isGoingFullTime ? 'QUALIFIES_NOW' : 'UNLOCKABLE_NEXT',
        matchScorePercent: nfReadyNow && isGoingFullTime ? 92 : 76,
        potentialValueNumeric: 15000,
        potentialValueFormatted: '€15,000 Tax-Free Founder Stipend (0% Equity Taken)',
        coFundingOrMatchRequirement:
          'No cash match required! Phase 1 is part-time (evenings/weekends); Phase 2 pays €15,000 tax-free over 6 months full-time.',
        whyYouMatchOrMiss:
          nfReadyNow && isGoingFullTime
            ? 'You have an export-capable concept and full-time founder bandwidth—making you an ideal candidate for Phase 2 (€15k tax-free stipend).'
            : 'Phase 1 is open part-time right now while keeping your day job; unlocking the €15,000 Phase 2 stipend requires committing full-time for 6 months.',
        unlockRequirement:
          !isGoingFullTime
            ? 'Start with New Frontiers Phase 1 part-time (evenings/weekends), then transition to full-time for Phase 2 to claim the €15,000 tax-free stipend.'
            : undefined,
        reimbursementAndTrapWarning:
          'Highly competitive interview selection; evaluators look for primary customer discovery proof (surveys & 1-on-1 interviews) rather than just an idea.',
        preflightModulesToWin: [
          'Module B (TAM/SAM/SOM & Export Potential)',
          'Module C (Customer Survey & 1-on-1 Interview Log)',
          'Module F (Promoter Profile & 7 Startup Hats)',
        ],
        officialUrl: 'https://www.newfrontiers.ie/',
      });
    }

    // 3. Revenue SURE (Startup Refunds for Entrepreneurs - Income Tax Refund)
    if (hasPayeHistory && !isLocalDomesticOnly) {
      matches.push({
        slug: 'ie-revenue-sure-tax-refund',
        countryCode: 'IE',
        grantName: 'Revenue SURE (Startup Refunds for Entrepreneurs)',
        providerAgency: 'Revenue Commissioners (Ireland)',
        fundingType: 'TAX_RELIEF_REFUND',
        fundingTypeBadge: 'Up to 41% PAYE Tax Refund',
        matchTier: isLtdNow ? 'QUALIFIES_NOW' : 'UNLOCKABLE_NEXT',
        matchScorePercent: isLtdNow ? 94 : 88,
        potentialValueNumeric: 20500,
        potentialValueFormatted:
          'Up to 41% Refund of Prior PAYE Tax (e.g., €20,500 cash back on €50k invested)',
        coFundingOrMatchRequirement:
          'Triggered when you invest your own savings into new ordinary shares in your qualifying Irish LTD company.',
        whyYouMatchOrMiss:
          'Because you paid PAYE income tax in Ireland within the last 6 years and are building a qualifying trading business, you can reclaim up to 41% of the capital you put into your own startup.',
        unlockRequirement: !isLtdNow
          ? 'Incorporate a new Irish Private Limited Company (LTD) and subscribe for ordinary shares before claiming your Revenue SURE tax refund.'
          : undefined,
        reimbursementAndTrapWarning:
          'You must hold at least 15% of the new LTD shares and work full-time as a director/employee for at least 12 months.',
        preflightModulesToWin: [
          'Module I (36-Month Financial Forecast & LTD Setup)',
          'Module J (SURE Tax Refund Calculator & Unlocker)',
        ],
        officialUrl: 'https://www.revenue.ie/en/corporate/assist-us/reporting-shadow-economy-activity/startup-refunds-for-entrepreneurs.aspx',
      });
    } else if (!hasPayeHistory) {
      matches.push({
        slug: 'ie-revenue-sure-tax-refund',
        countryCode: 'IE',
        grantName: 'Revenue SURE (Startup Refunds for Entrepreneurs)',
        providerAgency: 'Revenue Commissioners (Ireland)',
        fundingType: 'TAX_RELIEF_REFUND',
        fundingTypeBadge: 'PAYE Income Tax Refund',
        matchTier: 'NOT_ELIGIBLE',
        matchScorePercent: 15,
        potentialValueNumeric: 0,
        potentialValueFormatted: 'Up to 41% Refund of Prior 6 Years PAYE Tax',
        coFundingOrMatchRequirement: 'Requires prior Irish PAYE income tax paid in the last 6 years.',
        whyYouMatchOrMiss:
          'SURE specifically refunds prior PAYE (Schedule E) income tax paid over the previous 6 tax years. Self-employed Schedule D tax alone does not qualify unless a co-founder has PAYE history.',
        reimbursementAndTrapWarning:
          'If you bring on a co-founder who is leaving a PAYE job, they can claim SURE on their investment into the LTD.',
        preflightModulesToWin: ['Module F (Co-Founder Team & Equity Split)'],
        officialUrl: 'https://www.revenue.ie/en/corporate/assist-us/reporting-shadow-economy-activity/startup-refunds-for-entrepreneurs.aspx',
      });
    }

    // 4. LEO Digital for Business & Grow Digital AI/Cloud Vouchers
    matches.push({
      slug: 'ie-leo-digital-and-grow-digital-voucher',
      countryCode: 'IE',
      grantName: 'LEO Digital for Business + Grow Digital & AI Voucher',
      providerAgency: 'Local Enterprise Office (Ireland)',
      fundingType: 'VOUCHER_OR_CONSULTANCY',
      fundingTypeBadge: 'Digital & AI Grant Pack',
      matchTier:
        grantCheck.legalEntityStage !== 'PRE_INCORPORATION'
          ? 'QUALIFIES_NOW'
          : 'UNLOCKABLE_NEXT',
      matchScorePercent:
        grantCheck.legalEntityStage !== 'PRE_INCORPORATION' ? 91 : 83,
      potentialValueNumeric: 7700,
      potentialValueFormatted:
        'Up to €7,700 Combined (~€2,700 Digital Advisory + €5,000 Grow Digital at 50%)',
      coFundingOrMatchRequirement:
        'Digital for Business advisory is up to 100% funded by LEO; Grow Digital reimburses 50% of approved cloud/CRM/AI/e-commerce subscriptions & setup.',
      whyYouMatchOrMiss:
        'Open to almost all sectors (including domestic services & retail) with 1–50 employees looking to automate workflows, adopt AI, or upgrade digital commerce.',
      unlockRequirement:
        grantCheck.legalEntityStage === 'PRE_INCORPORATION'
          ? 'Register your business (Sole Trader or LTD) and establish initial trading activity (6+ months for Grow Digital voucher).'
          : undefined,
      reimbursementAndTrapWarning:
        'You must complete the free LEO Digital for Business assessment first before unlocking the €5,000 Grow Digital implementation voucher.',
      preflightModulesToWin: [
        'Module D (3-Tier Tech Stack & Build-vs-Buy Matrix)',
        'Module E (Operations & Automation Blueprint)',
      ],
      officialUrl: 'https://www.localenterprise.ie/Discover-Business-Supports/Digital-for-Business/',
    });

    // 5. Microfinance Ireland Startup Loan (via LEO)
    matches.push({
      slug: 'ie-microfinance-ireland-leo-loan',
      countryCode: 'IE',
      grantName: 'Microfinance Ireland Startup Loan (via LEO 1% Discount)',
      providerAgency: 'Microfinance Ireland & Local Enterprise Office',
      fundingType: 'STARTUP_LOAN',
      fundingTypeBadge: 'State-Backed Working Capital',
      matchTier: 'QUALIFIES_NOW',
      matchScorePercent: isLocalDomesticOnly ? 96 : 86,
      potentialValueNumeric: 25000,
      potentialValueFormatted:
        '€2,000 – €25,000 Startup Loan (Up to €50k Expansion) @ discounted rate',
      coFundingOrMatchRequirement:
        'No personal property collateral required; 3–5 year term. Can also be used to bridge the 50% cashflow match on LEO grants!',
      whyYouMatchOrMiss: isLocalDomesticOnly
        ? 'Unlike LEO Priming Grants, Microfinance Ireland actively funds domestic retail, hospitality, local services, and sole traders across Ireland.'
        : 'Provides vital working capital to bridge the 50% reimbursement lag on LEO Feasibility and Priming grants.',
      reimbursementAndTrapWarning:
        'Apply through your Local Enterprise Office (accompanied by your Module K Business Plan & 36-Month Cashflow) to secure a 1% interest rate reduction.',
      preflightModulesToWin: [
        'Module G (Written Sales Assumptions & Unit Economics)',
        'Module I (36-Month Cashflow Forecast)',
        'Module K (Official Business Plan Pack)',
      ],
      officialUrl: 'https://microfinanceireland.ie/',
    });

    // 6. LEO Priming Grant (Up to €150,000)
    if (!isLocalDomesticOnly) {
      const primingNow = isLtdUnder18M;
      const primingTooOld = grantCheck.legalEntityStage === 'LTD_OVER_18M';
      matches.push({
        slug: 'ie-leo-priming-grant',
        countryCode: 'IE',
        grantName: primingTooOld
          ? 'LEO Business Expansion Grant (18+ Months)'
          : 'LEO Priming Grant (First 18 Months)',
        providerAgency: agencyLabel,
        fundingType: 'CASH_GRANT',
        fundingTypeBadge: 'Flagship Scale Grant',
        matchTier: primingNow || primingTooOld ? 'QUALIFIES_NOW' : 'UNLOCKABLE_NEXT',
        matchScorePercent: primingNow ? 93 : 85,
        potentialValueNumeric: 75000,
        potentialValueFormatted: `Up to €150,000 (Typical 1st Tranche €35k–€75k at ${leoMatchRate} Match)`,
        coFundingOrMatchRequirement: `Reimburses ${leoMatchRate} of eligible capital equipment, consultancy, marketing, and up to €15,000 per new full-time job created.`,
        whyYouMatchOrMiss:
          primingNow || primingTooOld
            ? 'Your incorporated LTD and export/manufacturing profile qualify directly for LEO’s flagship job-creation and capital grant.'
            : 'Once you validate demand and incorporate an Irish LTD (< 18 months trading), you unlock LEO Priming funding for salaries, equipment, and international marketing.',
        unlockRequirement: isPreIncOrSole
          ? 'Incorporate an Irish Limited Company (LTD), secure 3 independent quotes for any expenditure > €5,000, and complete your 3-Year Job Creation Plan.'
          : undefined,
        reimbursementAndTrapWarning:
          'Strict LEO procurement rule: 3 written quotes required for any item ≥ €5,000 (Modules D & E automate this), and standard laptops/phones/vehicles are excluded.',
        preflightModulesToWin: [
          'Module E (Premises & Equipment 3-Quote Schedule)',
          'Module F (3-Year Job Creation Plan)',
          'Module I (36-Month Cashflow & Funding Gap)',
          'Module K (Official LEO Form & Appendices A–F)',
        ],
        officialUrl: 'https://www.localenterprise.ie/Discover-Business-Supports/Financial-Supports/Priming-Grant/',
      });
    } else {
      matches.push({
        slug: 'ie-leo-priming-grant',
        countryCode: 'IE',
        grantName: 'LEO Priming Grant',
        providerAgency: agencyLabel,
        fundingType: 'CASH_GRANT',
        fundingTypeBadge: 'Flagship Scale Grant',
        matchTier: 'NOT_ELIGIBLE',
        matchScorePercent: 20,
        potentialValueNumeric: 0,
        potentialValueFormatted: 'Up to €150,000 (50%–60% Match)',
        coFundingOrMatchRequirement: 'Requires manufacturing or internationally traded services.',
        whyYouMatchOrMiss:
          'Under national enterprise policy, LEO Priming Grants cannot fund purely local retail, cafés, hair salons, or domestic-only services that displace existing local competitors.',
        reimbursementAndTrapWarning:
          'Focus instead on the LEO Digital for Business (€2.7k), Grow Digital Voucher (€5k), and Microfinance Ireland (€25k–€50k) which DO support domestic businesses.',
        preflightModulesToWin: ['Module B (Export & Non-Displacement Analysis)'],
        officialUrl: 'https://www.localenterprise.ie/Discover-Business-Supports/Financial-Supports/Priming-Grant/',
      });
    }

    // 7. Enterprise Ireland Pre-Seed Start Fund (PSSF - €50k to €100k)
    if (!isLocalDomesticOnly && !refusesOutsideInvestors) {
      matches.push({
        slug: 'ie-enterprise-ireland-pssf',
        countryCode: 'IE',
        grantName: 'Enterprise Ireland Pre-Seed Start Fund (PSSF)',
        providerAgency: 'Enterprise Ireland (High-Potential Start-Ups)',
        fundingType: 'EQUITY_OR_CLN',
        fundingTypeBadge: '€50k–€100k Convertible Loan Note',
        matchTier: isLtdNow ? 'QUALIFIES_NOW' : 'UNLOCKABLE_NEXT',
        matchScorePercent: isLtdNow ? 87 : 78,
        potentialValueNumeric: 100000,
        potentialValueFormatted: '€50,000 or €100,000 Convertible Loan Note (CLN)',
        coFundingOrMatchRequirement:
          'Requires a 10% private co-investment match (€5,000 for €50k PSSF, or €10,000 for €100k PSSF).',
        whyYouMatchOrMiss:
          'Designed for scalable Irish startups aiming to reach €1M+ in export sales and create 10+ jobs within 3–4 years.',
        unlockRequirement: !isLtdNow
          ? 'Incorporate an Irish LTD, prove initial customer problem/solution fit (Module C), and evidence at least €5,000–€10,000 in 10% co-funding.'
          : undefined,
        reimbursementAndTrapWarning:
          'Structured as a Convertible Loan Note (converts at a 20% discount on a future priced seed round of €250k+).',
        preflightModulesToWin: [
          'Module B (HPSU Market Sizing & Export Wedge)',
          'Module C (Customer Validation & Waitlist Traction)',
          'Module I (36-Month Cashflow & Runway Model)',
        ],
        officialUrl: 'https://www.enterprise-ireland.com/en/supports/pre-seed-start-fund',
      });
    }

    // 8. Revenue 30% R&D Tax Credit & EII (40% Investor Relief)
    if (isDeepTechOrRD) {
      matches.push({
        slug: 'ie-revenue-rd-tax-credit-30',
        countryCode: 'IE',
        grantName: 'Revenue 30% R&D Tax Credit (Refundable Cash Credit)',
        providerAgency: 'Revenue Commissioners (Ireland)',
        fundingType: 'TAX_RELIEF_REFUND',
        fundingTypeBadge: '30% Refundable R&D Cash',
        matchTier: isLtdNow ? 'QUALIFIES_NOW' : 'UNLOCKABLE_NEXT',
        matchScorePercent: isLtdNow ? 89 : 80,
        potentialValueNumeric: 15000,
        potentialValueFormatted:
          '30% Cash Refund on Qualifying R&D Spend (e.g., €15,000 back on €50k R&D)',
        coFundingOrMatchRequirement:
          'Claimed via Corporation Tax return (CT1); first €50,000 of R&D tax credit is now payable in full in Year 1 rather than 3 instalments.',
        whyYouMatchOrMiss:
          'Your software, AI, or engineering build involves resolving technical/scientific uncertainty—qualifying for Ireland’s 30% refundable R&D credit.',
        unlockRequirement: !isLtdNow
          ? 'Incorporate an Irish LTD and document your technical Work Packages & scientific uncertainties in Module D before incurring R&D payroll/contractor spend.'
          : undefined,
        reimbursementAndTrapWarning:
          'Revenue requires contemporaneous Work Package logs (Module D Step 5) proving a "scientific or technological advancement" and resolution of uncertainty.',
        preflightModulesToWin: [
          'Module B (State-of-the-Art Technical Baseline)',
          'Module D (Work Packages WP1..n & Technical Merit)',
        ],
        officialUrl: 'https://www.revenue.ie/en/companies-and-charities/reliefs-and-exemptions/research-and-development-rd-tax-credit/index.aspx',
      });
    }
  } else {
    // =========================================================================
    // UNITED KINGDOM (GB) GRANT, LOAN & TAX RELIEF EVALUATION ENGINE
    // =========================================================================
    const loanMaxPerTeam = hasCoFounders ? 50000 : 25000;

    // 1. British Business Bank Start Up Loans
    if (grantCheck.legalEntityStage !== 'LTD_OVER_18M') {
      matches.push({
        slug: 'uk-british-business-bank-start-up-loans',
        countryCode: 'GB',
        grantName: 'British Business Bank Start Up Loans',
        providerAgency: 'British Business Bank (UK Government-Backed)',
        fundingType: 'STARTUP_LOAN',
        fundingTypeBadge: '6% Fixed Rate + 12m Mentoring',
        matchTier: 'QUALIFIES_NOW',
        matchScorePercent: 96,
        potentialValueNumeric: loanMaxPerTeam,
        potentialValueFormatted: hasCoFounders
          ? 'Up to £50,000 (£25,000 per Co-Founder, £100k max) @ 6% Fixed'
          : 'Up to £25,000 per Founder (£100k max per team) @ 6% Fixed',
        coFundingOrMatchRequirement:
          '0% arrangement fee, no early repayment penalty, and includes 12 months of free mentoring. Open to Pre-Incorporation, Sole Traders, and LTDs.',
        whyYouMatchOrMiss:
          'Eligible across almost all UK domestic and international sectors (under 36 months trading), making it the fastest Day-1 working capital source in the UK.',
        reimbursementAndTrapWarning:
          'Evaluators require a strict 3-document pack: (1) Business Plan, (2) Personal Survival Budget (Module F), and (3) Written Sales Assumptions + 12m Cashflow (Modules G & I).',
        preflightModulesToWin: [
          'Module F (UK Personal Survival Budget)',
          'Module G (Written Sales Assumptions)',
          'Module I (12–36 Month Cashflow Forecast)',
          'Module K (Official UK Start Up Loans 4-Part Workbook)',
        ],
        officialUrl: 'https://www.startuploans.co.uk/',
      });
    }

    // 2. Regional UK Growth Hub / Devolved Agency Grant
    const regionalGrantMap: Record<
      string,
      {
        name: string;
        agency: string;
        val: number;
        formatted: string;
        desc: string;
        url: string;
      }
    > = {
      GB_SCOTLAND_SE: {
        name: 'Scottish Enterprise SMART: SCOTLAND & Business Gateway Grants',
        agency: 'Scottish Enterprise / Business Gateway',
        val: 35000,
        formatted: 'Up to £35,000 – £100,000 (Feasibility & Regional Digital Grants)',
        desc: 'Scotland offers dedicated Business Gateway startup vouchers plus SMART: SCOTLAND technical feasibility grants (up to 70% match for SMEs).',
        url: 'https://www.scottish-enterprise.com/',
      },
      GB_WALES_DBW: {
        name: 'Business Wales Startup Barriers Grant & Development Bank of Wales',
        agency: 'Welsh Government & Development Bank of Wales',
        val: 25000,
        formatted: '£2,500 – £25,000 Regional Grant & Micro-Funding Pack',
        desc: 'Wales provides local authority startup capital grants alongside Development Bank of Wales fast-track micro-funding.',
        url: 'https://businesswales.gov.wales/',
      },
      GB_NORTHERN_IRELAND_INVEST_NI: {
        name: 'Invest NI Technical Development & Go Succeed Grants',
        agency: 'Invest Northern Ireland & Local Councils',
        val: 25000,
        formatted: '£3,000 (Go Succeed Grant) – £35,000 (Invest NI Proof of Concept)',
        desc: 'Northern Ireland founders can access local council Go Succeed capital grants (up to 50%–70% match) and Invest NI export R&D support.',
        url: 'https://www.investni.com/',
      },
      GB_ENGLAND_GROWTH_HUB: {
        name: 'Local Growth Hub & UK Shared Prosperity Fund (UKSPF) Grants',
        agency: 'England Local Growth Hubs / Combined Authorities',
        val: 10000,
        formatted: '£2,500 – £15,000 (50% Match Digital, Net-Zero & Innovation Vouchers)',
        desc: 'Local Growth Hubs across England distribute UKSPF non-dilutive capital and digital adoption grants for early-stage SMEs.',
        url: 'https://www.lepnetwork.net/growth-hubs/',
      },
    };

    const regInfo =
      regionalGrantMap[grantCheck.regionalLocationTier] ||
      regionalGrantMap.GB_ENGLAND_GROWTH_HUB;

    matches.push({
      slug: 'uk-regional-growth-hub-grant',
      countryCode: 'GB',
      grantName: regInfo.name,
      providerAgency: regInfo.agency,
      fundingType: 'CASH_GRANT',
      fundingTypeBadge: 'Regional Non-Dilutive Grant',
      matchTier: 'QUALIFIES_NOW',
      matchScorePercent: 90,
      potentialValueNumeric: regInfo.val,
      potentialValueFormatted: regInfo.formatted,
      coFundingOrMatchRequirement:
        'Typically reimburses 50% of approved capital equipment, specialist software, or prototype consultancy costs.',
      whyYouMatchOrMiss: regInfo.desc,
      reimbursementAndTrapWarning:
        'Requires 2–3 written supplier quotes before purchase and reimbursement on paid invoices.',
      preflightModulesToWin: [
        'Module D/E (3-Quote Supplier & Equipment Schedule)',
        'Module K (Business Plan & Financial Pack)',
      ],
      officialUrl: regInfo.url,
    });

    // 3. HMRC SEIS (Seed Enterprise Investment Scheme) Advance Assurance
    if (!refusesOutsideInvestors && !isLocalDomesticOnly) {
      matches.push({
        slug: 'uk-hmrc-seis-advance-assurance',
        countryCode: 'GB',
        grantName: 'HMRC SEIS Advance Assurance (£250k Angel Tax Relief)',
        providerAgency: 'HM Revenue & Customs (UK)',
        fundingType: 'TAX_RELIEF_REFUND',
        fundingTypeBadge: '50% Angel Investor Tax Relief',
        matchTier: isLtdNow ? 'QUALIFIES_NOW' : 'UNLOCKABLE_NEXT',
        matchScorePercent: isLtdNow ? 93 : 84,
        potentialValueNumeric: 125000,
        potentialValueFormatted:
          'Unlocks £250,000 SEIS Round (Gives UK Angels £125,000 in 50% Tax Relief)',
        coFundingOrMatchRequirement:
          'Not a direct government grant—unlocks 50% income tax relief + 0% Capital Gains Tax for UK angels investing up to £250,000 in your startup.',
        whyYouMatchOrMiss:
          'Over 85% of UK angel investors require HMRC SEIS Advance Assurance before wiring funds to an early-stage UK startup.',
        unlockRequirement: !isLtdNow
          ? 'Incorporate a UK Private Limited Company (Ltd) at Companies House and identify at least 1 named prospective angel investor for your HMRC submission.'
          : undefined,
        reimbursementAndTrapWarning:
          'HMRC rejects generic applications—you must include a formal "Risk-to-Capital" justification, 3-Year Financial Forecast, and named prospective investor.',
        preflightModulesToWin: [
          'Module I (36-Month Financial Model)',
          'Module K (Official UK HMRC SEIS/EIS Advance Assurance Pack)',
        ],
        officialUrl:
          'https://www.gov.uk/guidance/venture-capital-schemes-apply-to-use-the-seed-enterprise-investment-scheme',
      });
    }

    // 4. Innovate UK Smart Grants & Sector Competitions
    if (isDeepTechOrRD && !isLocalDomesticOnly) {
      matches.push({
        slug: 'uk-innovate-uk-smart-grants',
        countryCode: 'GB',
        grantName: 'Innovate UK Smart Grants & Sector R&D Competitions',
        providerAgency: 'Innovate UK (UKRI)',
        fundingType: 'CASH_GRANT',
        fundingTypeBadge: 'Up to 70% R&D Grant',
        matchTier: isLtdNow ? 'QUALIFIES_NOW' : 'UNLOCKABLE_NEXT',
        matchScorePercent: isLtdNow ? 88 : 79,
        potentialValueNumeric: 100000,
        potentialValueFormatted:
          '£100,000 – £500,000 (Up to 70% of Eligible R&D Project Costs)',
        coFundingOrMatchRequirement:
          'Requires a UK Ltd company and 30% private match-funding; paid quarterly in arrears after Independent Accountant Report (IAR).',
        whyYouMatchOrMiss:
          'Your concept involves technical/digital innovation with international scalability—matching Innovate UK’s 9-Question Innovation Funding Service (IFS) criteria.',
        unlockRequirement: !isLtdNow
          ? 'Incorporate a UK Ltd at Companies House and structure your technical build into Work Packages (WP1..n) with a formal 4-category Risk Register.'
          : undefined,
        reimbursementAndTrapWarning:
          'Capital equipment purchases are NOT reimbursed upfront—Innovate UK only funds the depreciation used during the R&D project months (Module E calculates this automatically).',
        preflightModulesToWin: [
          'Module D (Work Packages WP1..n & Technical Architecture)',
          'Module E (Innovate UK Capital Usage Depreciation & Risk Register)',
          'Module K (UK Innovate UK 9-Question IFS Compiler)',
        ],
        officialUrl: 'https://www.ukri.org/councils/innovate-uk/',
      });
    } else {
      matches.push({
        slug: 'uk-innovate-uk-smart-grants',
        countryCode: 'GB',
        grantName: 'Innovate UK Smart Grants',
        providerAgency: 'Innovate UK (UKRI)',
        fundingType: 'CASH_GRANT',
        fundingTypeBadge: 'Disruptive R&D Grant',
        matchTier: 'NOT_ELIGIBLE',
        matchScorePercent: 25,
        potentialValueNumeric: 0,
        potentialValueFormatted: '£100,000 – £500,000 (Up to 70% Match)',
        coFundingOrMatchRequirement: 'Requires disruptive technical R&D and 30% match.',
        whyYouMatchOrMiss:
          'Innovate UK Smart Grants strictly fund high-risk, game-changing technological or scientific R&D rather than standard commercial or domestic service rollouts.',
        reimbursementAndTrapWarning:
          'Focus instead on British Business Bank Start Up Loans (£25k/founder) and your regional Growth Hub UKSPF grants.',
        preflightModulesToWin: ['Module D (Product Vehicle & Tech Stack)'],
        officialUrl: 'https://www.ukri.org/councils/innovate-uk/',
      });
    }

    // 5. UK R&D Tax Relief (ERIS 27% / Merged RDEC 20%)
    if (isDeepTechOrRD) {
      matches.push({
        slug: 'uk-hmrc-rd-tax-relief-eris',
        countryCode: 'GB',
        grantName: 'HMRC R&D Tax Relief (ERIS 27% Intensive / RDEC 20%)',
        providerAgency: 'HM Revenue & Customs (UK)',
        fundingType: 'TAX_RELIEF_REFUND',
        fundingTypeBadge: 'Up to 27% R&D Cash Credit',
        matchTier: isLtdNow ? 'QUALIFIES_NOW' : 'UNLOCKABLE_NEXT',
        matchScorePercent: isLtdNow ? 91 : 82,
        potentialValueNumeric: 27000,
        potentialValueFormatted:
          'Up to 27% Payable Credit (e.g., £27,000 back on £100k R&D spend via ERIS)',
        coFundingOrMatchRequirement:
          'Claimed via Corporation Tax after year-end; requires an HMRC Additional Information Form (AIF) detailing technical uncertainties overcome.',
        whyYouMatchOrMiss:
          'Loss-making UK SMEs spending ≥ 30% of total expenditure on qualifying software, AI, or engineering R&D qualify for the Enhanced R&D Intensive Support (ERIS) 27% rate.',
        unlockRequirement: !isLtdNow
          ? 'Incorporate a UK Ltd company and log your R&D Work Packages & baseline technical advances from Day 1.'
          : undefined,
        reimbursementAndTrapWarning:
          'Overseas contractor/freelancer R&D spend is generally restricted under updated HMRC rules—prioritize UK-based developers or in-house technical builds.',
        preflightModulesToWin: [
          'Module B (State-of-the-Art Baseline)',
          'Module D (Work Packages WP1..n)',
        ],
        officialUrl: 'https://www.gov.uk/guidance/corporation-tax-research-and-development-rd-relief',
      });
    }
  }

  const qualifiesNowGrants = matches.filter(
    (m) => m.matchTier === 'QUALIFIES_NOW'
  );
  const unlockableNextGrants = matches.filter(
    (m) => m.matchTier === 'UNLOCKABLE_NEXT'
  );
  const notEligibleGrants = matches.filter(
    (m) => m.matchTier === 'NOT_ELIGIBLE'
  );

  const immediateQualifiedPoolValue = qualifiesNowGrants.reduce(
    (sum, g) => sum + g.potentialValueNumeric,
    0
  );
  const unlockableScalePoolValue = unlockableNextGrants.reduce(
    (sum, g) => sum + g.potentialValueNumeric,
    0
  );
  const totalCombinedPotentialValue =
    immediateQualifiedPoolValue + unlockableScalePoolValue;

  // Budget & Cashflow Match Warning
  const budgetBracket =
    input.teamAndBudget?.startingBudgetBracket || '1K_TO_5K';
  let budgetCashflowRealityWarning = '';
  if (
    budgetBracket === 'ZERO_SWEAT_EQUITY' ||
    budgetBracket === 'UNDER_1K'
  ) {
    budgetCashflowRealityWarning =
      countryCode === 'IE'
        ? 'Cashflow Match Alert: Because your starting cash budget is under €1,000, remember that LEO grants (Feasibility & Priming) are paid strictly on reimbursement—you must pay suppliers 100% upfront first. Start with Enterprise Ireland New Frontiers (€15,000 stipend with €0 match required) or pair your LEO grant with a Microfinance Ireland loan.'
        : 'Cashflow Match Alert: Because your starting cash budget is under £1,000, prioritize British Business Bank Start Up Loans (up to £25,000 paid upfront into your account) before applying for reimbursement-based regional grants.';
  } else if (budgetBracket === '1K_TO_5K') {
    budgetCashflowRealityWarning =
      countryCode === 'IE'
        ? 'Smart Co-Funding Tip: With €1,000–€5,000 in starting cash, you can comfortably cashflow €2,000–€10,000 in staged LEO Feasibility or Grow Digital milestones (claiming back 50%–60% on each tranche) without running dry.'
        : 'Smart Co-Funding Tip: With £1,000–£5,000 in starting cash, you can match a £2,500–£5,000 regional Growth Hub voucher right away and layer a British Business Bank Start Up Loan for main working capital.';
  } else {
    budgetCashflowRealityWarning =
      countryCode === 'IE'
        ? 'Strong Co-Funding Position: Your starting budget of €5,000+ gives you the upfront working capital needed to unlock full LEO Feasibility (€15k), Enterprise Ireland PSSF (€50k–€100k with 10% match), and Revenue SURE tax refunds.'
        : 'Strong Co-Funding Position: Your starting budget of £5,000+ positions you well to cover legal incorporation, HMRC SEIS Advance Assurance, and the 30%–50% match on UK innovation grants.';
  }

  const strategicPositioningTips: string[] =
    input.grantCheck.aiGrantPositioningAdvice &&
    input.grantCheck.aiGrantPositioningAdvice.length > 0
      ? input.grantCheck.aiGrantPositioningAdvice
      : countryCode === 'IE'
        ? [
            isLocalDomesticOnly
              ? '1. Solve the "Displacement Test": To unlock LEO Feasibility (€15k) and Priming (€150k), frame how your business either exports outside your county/country or replaces imports rather than taking customers from local cafés/shops.'
              : '1. Lead with Export & Non-Displacement: In your LEO/EI application, emphasize how your solution serves B2B or international buyers and does not displace existing local main-street businesses.',
            hasPayeHistory
              ? '2. Stack Non-Dilutive Grants with Revenue SURE: Before investing your personal savings into startup costs, incorporate your Irish LTD properly so your investment triggers up to a 41% income tax refund via SURE.'
              : '2. Prove Primary Market Demand First: Grant committees reject pure "build it and they will come" ideas—use Module C to collect 15–25 real survey responses and 3 customer interviews before submitting.',
            '3. Follow the 3-Quote & Letter-of-Offer Rule: Never pay a developer or supplier before receiving your formal Letter of Offer, and gather 3 independent quotes for any item ≥ €5,000 in Modules D & E.',
          ]
        : [
            '1. Pair Start Up Loans with SEIS Advance Assurance: Use British Business Bank Start Up Loans (£25k/founder) for Day-1 non-dilutive working capital while securing HMRC SEIS Advance Assurance for angel readiness.',
            isDeepTechOrRD
              ? '2. Frame Technical Uncertainty for HMRC & Innovate UK: Document why your software/engineering architecture cannot be easily solved by a competent developer using off-the-shelf tools (Module D Work Packages).'
              : '2. Back Every Forecast with Written Sales Assumptions: UK Start Up Loans evaluators scrutinize *how* you calculated Month 1–12 unit sales—use Module C survey proof and Module G pricing tiers to prove demand.',
            '3. Check Your Local Growth Hub Early: Before buying software or equipment, check your regional Growth Hub / devolved agency voucher scheme since retrospective purchases cannot be reimbursed.',
          ];

  return {
    countryCode,
    currency,
    qualifiesNowGrants,
    unlockableNextGrants,
    notEligibleGrants,
    immediateQualifiedPoolValue,
    immediateQualifiedPoolFormatted: formatPlanCurrency(
      immediateQualifiedPoolValue,
      currency,
      countryCode
    ),
    unlockableScalePoolValue,
    unlockableScalePoolFormatted: formatPlanCurrency(
      unlockableScalePoolValue,
      currency,
      countryCode
    ),
    totalCombinedPotentialValue,
    totalCombinedPotentialFormatted: formatPlanCurrency(
      totalCombinedPotentialValue,
      currency,
      countryCode
    ),
    budgetCashflowRealityWarning,
    strategicPositioningTips,
  };
}
