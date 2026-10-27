export type SupportedCountryCode =
  | 'IE'
  | 'GB'
  | 'US'
  | 'AU'
  | 'CA'
  | 'EU'
  | 'ROW';

export type SupportedCurrencyCode = 'EUR' | 'GBP' | 'USD' | 'AUD' | 'CAD';

export interface CountryRuleSeed {
  countryCode: SupportedCountryCode;
  countryName: string;
  defaultCurrency: SupportedCurrencyCode;
  taxName: string;
  standardTaxRatePercent: string;
  employerPayrollTaxName: string;
  employerPayrollTaxPercent: string;
  commonEntityTypesJson: string[];
}

export interface GrantDirectorySeed {
  slug: string;
  countryCode: SupportedCountryCode;
  grantName: string;
  providerAgency: string;
  fundingType:
    | 'GRANT'
    | 'TAX_RELIEF'
    | 'R_AND_D_CREDIT'
    | 'EQUITY_MATCH'
    | 'STARTUP_LOAN';
  maxAmountFormatted: string;
  reimbursementWarning: string;
  eligibilityRulesJsonb: Record<string, unknown>;
  officialUrl: string;
  isActive: boolean;
}

export const DEFAULT_COUNTRY_RULES: CountryRuleSeed[] = [
  {
    countryCode: 'IE',
    countryName: 'Ireland',
    defaultCurrency: 'EUR',
    taxName: 'VAT',
    standardTaxRatePercent: '23.00',
    employerPayrollTaxName: 'Employer PRSI',
    employerPayrollTaxPercent: '11.15',
    commonEntityTypesJson: [
      'Private Company Limited by Shares (LTD)',
      'Designated Activity Company (DAC)',
      'Sole Trader',
    ],
  },
  {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    defaultCurrency: 'GBP',
    taxName: 'VAT',
    standardTaxRatePercent: '20.00',
    employerPayrollTaxName: 'Employer NIC',
    employerPayrollTaxPercent: '13.80',
    commonEntityTypesJson: [
      'Private Limited Company (Ltd)',
      'Limited Liability Partnership (LLP)',
      'Sole Trader',
    ],
  },
  {
    countryCode: 'US',
    countryName: 'United States',
    defaultCurrency: 'USD',
    taxName: 'Sales Tax',
    standardTaxRatePercent: '7.25',
    employerPayrollTaxName: 'Employer FICA & FUTA',
    employerPayrollTaxPercent: '7.65',
    commonEntityTypesJson: [
      'Delaware C-Corporation (C-Corp)',
      'Limited Liability Company (LLC)',
      'Public Benefit Corporation (PBC)',
    ],
  },
  {
    countryCode: 'AU',
    countryName: 'Australia',
    defaultCurrency: 'AUD',
    taxName: 'GST',
    standardTaxRatePercent: '10.00',
    employerPayrollTaxName: 'Superannuation Guarantee',
    employerPayrollTaxPercent: '11.50',
    commonEntityTypesJson: [
      'Proprietary Limited Company (Pty Ltd)',
      'Sole Trader',
      'Partnership',
    ],
  },
  {
    countryCode: 'CA',
    countryName: 'Canada',
    defaultCurrency: 'CAD',
    taxName: 'GST / HST',
    standardTaxRatePercent: '13.00',
    employerPayrollTaxName: 'Employer CPP & EI',
    employerPayrollTaxPercent: '8.30',
    commonEntityTypesJson: [
      'Federal / Provincial Corporation (Inc.)',
      'Sole Proprietorship',
      'Limited Partnership',
    ],
  },
  {
    countryCode: 'EU',
    countryName: 'European Union (General)',
    defaultCurrency: 'EUR',
    taxName: 'VAT',
    standardTaxRatePercent: '21.00',
    employerPayrollTaxName: 'Employer Social Security',
    employerPayrollTaxPercent: '18.00',
    commonEntityTypesJson: [
      'GmbH / SARL / B.V. / S.L. (Private Limited)',
      'Societas Europaea (SE)',
      'Sole Proprietorship',
    ],
  },
  {
    countryCode: 'ROW',
    countryName: 'Rest of World',
    defaultCurrency: 'USD',
    taxName: 'VAT / Sales Tax',
    standardTaxRatePercent: '15.00',
    employerPayrollTaxName: 'Employer Payroll Contributions',
    employerPayrollTaxPercent: '10.00',
    commonEntityTypesJson: [
      'Private Limited Company',
      'Limited Liability Company (LLC)',
      'Sole Proprietorship',
    ],
  },
];

export const DEFAULT_GRANTS_DIRECTORY: GrantDirectorySeed[] = [
  {
    slug: 'ie-leo-feasibility-study-grant',
    countryCode: 'IE',
    grantName: 'LEO Feasibility Study Grant',
    providerAgency: 'Local Enterprise Office (Ireland)',
    fundingType: 'GRANT',
    maxAmountFormatted: '€15,000 (50% Match / 60% in BMW Region)',
    reimbursementWarning:
      'Paid strictly on reimbursement of vouched receipts after formal approval. Do not spend money before receiving your Letter of Offer.',
    eligibilityRulesJsonb: {
      maxEmployees: 10,
      requiresExportOrManufacturingPotential: true,
      preIncorporationAllowed: true,
    },
    officialUrl: 'https://www.localenterprise.ie',
    isActive: true,
  },
  {
    slug: 'ie-leo-priming-grant',
    countryCode: 'IE',
    grantName: 'LEO Priming Grant',
    providerAgency: 'Local Enterprise Office (Ireland)',
    fundingType: 'GRANT',
    maxAmountFormatted: '€150,000 (Up to 50%–60% of Eligible Costs)',
    reimbursementWarning:
      'Salary support and capital outlays are reimbursed in tranches upon proof of expenditure and tax clearance. Laptops, phones, and vehicles are excluded.',
    eligibilityRulesJsonb: {
      monthsSinceIncorporationMax: 18,
      maxEmployees: 10,
      requiresIncorporatedLtd: true,
    },
    officialUrl: 'https://www.localenterprise.ie',
    isActive: true,
  },
  {
    slug: 'ie-enterprise-ireland-pssf-new-frontiers',
    countryCode: 'IE',
    grantName: 'Enterprise Ireland New Frontiers & Pre-Seed Start Fund (PSSF)',
    providerAgency: 'Enterprise Ireland',
    fundingType: 'EQUITY_MATCH',
    maxAmountFormatted:
      '€15,000 Stipend (New Frontiers) / €50k–€100k CLN (PSSF)',
    reimbursementWarning:
      'PSSF requires an incorporated Irish Limited company and private co-funding match of at least 10% (€5k or €10k).',
    eligibilityRulesJsonb: {
      requiresHpsuPotential: true,
      requiresIncorporatedLtd: true,
    },
    officialUrl: 'https://www.enterprise-ireland.com',
    isActive: true,
  },
  {
    slug: 'ie-sure-eii-rd-tax-relief',
    countryCode: 'IE',
    grantName: 'SURE, EII & 30% R&D Tax Credit Schemes',
    providerAgency: 'Revenue Commissioners (Ireland)',
    fundingType: 'TAX_RELIEF',
    maxAmountFormatted: 'Up to 41% Income Tax Refund (SURE) / 40% Relief (EII)',
    reimbursementWarning:
      'SURE allows founders leaving PAYE employment to reclaim up to 6 years of prior income tax to invest into their new LTD.',
    eligibilityRulesJsonb: {
      requiresTradingCompany: true,
      requiresIncorporatedLtd: true,
    },
    officialUrl: 'https://www.revenue.ie',
    isActive: true,
  },
  {
    slug: 'uk-british-business-bank-start-up-loans',
    countryCode: 'GB',
    grantName: 'British Business Bank Start Up Loans',
    providerAgency: 'British Business Bank (UK)',
    fundingType: 'STARTUP_LOAN',
    maxAmountFormatted: 'Up to £25,000 per Co-Founder (£100k max per team) @ 6%',
    reimbursementWarning:
      'Personal government-backed loan requiring a Personal Survival Budget, Written Sales Assumptions, and 12–36 Month Cashflow Forecast.',
    eligibilityRulesJsonb: {
      monthsTradingMax: 36,
      requiresPersonalSurvivalBudget: true,
    },
    officialUrl: 'https://www.startuploans.co.uk/',
    isActive: true,
  },
  {
    slug: 'uk-hmrc-seis-eis-advance-assurance',
    countryCode: 'GB',
    grantName: 'HMRC SEIS & EIS Seed Enterprise Investment Scheme',
    providerAgency: 'HM Revenue & Customs (UK)',
    fundingType: 'TAX_RELIEF',
    maxAmountFormatted:
      '£250,000 SEIS (50% Angel Tax Relief) / £5M EIS (30% Relief)',
    reimbursementWarning:
      'Not a cash grant—unlocks massive tax relief for UK angel investors backing your startup. Requires a named prospective investor and Risk-to-Capital statement.',
    eligibilityRulesJsonb: {
      ukPermanentEstablishment: true,
      requiresIncorporatedLtd: true,
    },
    officialUrl:
      'https://www.gov.uk/guidance/venture-capital-schemes-apply-to-use-the-seed-enterprise-investment-scheme',
    isActive: true,
  },
  {
    slug: 'uk-innovate-uk-smart-grants',
    countryCode: 'GB',
    grantName: 'Innovate UK Smart Grants & Sector Competitions',
    providerAgency: 'Innovate UK (UKRI)',
    fundingType: 'GRANT',
    maxAmountFormatted: '£100,000 – £500,000 (Up to 70% of Eligible R&D Costs)',
    reimbursementWarning:
      'Paid quarterly in arrears after Independent Accountant Review (IAR). You must have working capital to bridge the 30% match + quarterly lag.',
    eligibilityRulesJsonb: {
      requiresDisruptiveRAndD: true,
      requiresIncorporatedLtd: true,
    },
    officialUrl: 'https://www.ukri.org/councils/innovate-uk/',
    isActive: true,
  },
  {
    slug: 'us-sbir-sttr-seed-fund',
    countryCode: 'US',
    grantName: 'America’s Seed Fund (NSF / NIH SBIR & STTR Phase I)',
    providerAgency: 'U.S. Small Business Administration / NSF',
    fundingType: 'GRANT',
    maxAmountFormatted: '$275,000 – $305,000 Non-Dilutive R&D Grant',
    reimbursementWarning:
      'Requires >50% US citizen/permanent resident ownership and all R&D work performed inside the United States.',
    eligibilityRulesJsonb: {
      usOwnedAndOperated: true,
      requiresTechnicalRAndD: true,
    },
    officialUrl: 'https://seedfund.nsf.gov/',
    isActive: true,
  },
  {
    slug: 'au-rd-tax-incentive-emdg',
    countryCode: 'AU',
    grantName: 'R&D Tax Incentive & EMDG Export Market Development Grant',
    providerAgency: 'AusIndustry & Austrade',
    fundingType: 'R_AND_D_CREDIT',
    maxAmountFormatted: '43.5% Refundable R&D Tax Offset + Up to $150k/yr EMDG',
    reimbursementWarning:
      'R&D Tax Offset is claimed after EOFY via an incorporated Australian Pty Ltd; EMDG reimburses 50% of eligible export marketing.',
    eligibilityRulesJsonb: {
      requiresAustralianPtyLtd: true,
    },
    officialUrl: 'https://business.gov.au',
    isActive: true,
  },
  {
    slug: 'ca-sred-nrc-irap',
    countryCode: 'CA',
    grantName: 'SR&ED Tax Credits & NRC IRAP Funding',
    providerAgency: 'CRA & National Research Council Canada',
    fundingType: 'R_AND_D_CREDIT',
    maxAmountFormatted:
      '35% Federal SR&ED Refundable Credit + Up to 80% Salary Coverage (IRAP)',
    reimbursementWarning:
      'IRAP requires pre-approval by an Industrial Technology Advisor (ITA) before incurring R&D payroll expenses.',
    eligibilityRulesJsonb: {
      requiresCanadianCCPC: true,
    },
    officialUrl: 'https://nrc.canada.ca/en/support-technology-innovation',
    isActive: true,
  },
];

export interface CountryRulePack {
  countryCode: SupportedCountryCode;
  countryName: string;
  defaultCurrency: SupportedCurrencyCode;
  taxName: string;
  standardTaxRatePercent: number;
  employerPayrollTaxName: string;
  employerPayrollTaxPercent: number;
  commonEntityTypes: string[];
}

export function getCountryRulePack(countryCode: string): CountryRulePack {
  const normalized = (countryCode?.toUpperCase() ||
    'IE') as SupportedCountryCode;
  const match =
    DEFAULT_COUNTRY_RULES.find((r) => r.countryCode === normalized) ??
    DEFAULT_COUNTRY_RULES[0];

  return {
    countryCode: match.countryCode,
    countryName: match.countryName,
    defaultCurrency: match.defaultCurrency,
    taxName: match.taxName,
    standardTaxRatePercent: parseFloat(match.standardTaxRatePercent),
    employerPayrollTaxName: match.employerPayrollTaxName,
    employerPayrollTaxPercent: parseFloat(match.employerPayrollTaxPercent),
    commonEntityTypes: match.commonEntityTypesJson,
  };
}

export function getGrantsForCountry(countryCode: string) {
  const normalized = countryCode?.toUpperCase() || 'IE';
  return DEFAULT_GRANTS_DIRECTORY.filter(
    (g) => g.countryCode === normalized && g.isActive
  );
}

export function formatPlanCurrency(
  amount: number,
  currencyCode: string = 'EUR',
  countryCode: string = 'IE'
): string {
  const localeMap: Record<string, string> = {
    IE: 'en-IE',
    GB: 'en-GB',
    US: 'en-US',
    AU: 'en-AU',
    CA: 'en-CA',
    EU: 'en-IE',
    ROW: 'en-US',
  };
  const locale = localeMap[countryCode] || 'en-IE';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode || 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}
