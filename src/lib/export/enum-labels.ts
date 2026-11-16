/**
 * Human-readable display formatters for institutional, grant, tax, and module enum keys.
 * Prevents raw SCREAMING_SNAKE_CASE database keys from leaking into founder UIs,
 * AI prompts, PDF printouts, or exported HTML/Markdown dossiers.
 */

const ACRONYMS = new Set([
  'IE',
  'UK',
  'GB',
  'US',
  'EU',
  'LEO',
  'EI',
  'PSSF',
  'SURE',
  'EII',
  'SCIS',
  'BBB',
  'HMRC',
  'SEIS',
  'EIS',
  'VAT',
  'PRSI',
  'NIC',
  'PAYE',
  'B2B',
  'B2C',
  'D2C',
  'AI',
  'IP',
  'GDPR',
  'LTD',
  'CRO',
  'IFS',
  'QA',
  'QC',
  'SLA',
  'CAC',
  'LTV',
  'COGS',
  'DSCR',
  'FTE',
]);

export function humanizeEnumFallback(raw?: string | null): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (!trimmed.includes('_') && trimmed !== trimmed.toUpperCase()) {
    return trimmed;
  }
  return trimmed
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word) => {
      const upper = word.toUpperCase();
      if (ACRONYMS.has(upper)) return upper === 'GB' ? 'UK' : upper;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

export const MODULE_CODE_FULL_LABELS: Record<string, string> = {
  MOD_A_IDEATION: 'Module A: Ideation & Concept',
  MOD_B_MARKET: 'Module B: Market & Competitors',
  MOD_C_SURVEYS_FEEDBACK: 'Module C: Customer Validation',
  MOD_D_PRODUCT_BUILD: 'Module D: Product & V1 Scope',
  MOD_E_OPERATIONS: 'Module E: Operations & Equipment',
  MOD_F_COFOUNDER_TEAM: 'Module F: Team & Hiring',
  MOD_G_LAUNCHPAD: 'Module G: Launchpad Setup',
  MOD_H_REVENUE: 'Module H: Revenue & Pricing',
  MOD_I_MARKETING: 'Module I: Marketing & First 10',
  MOD_J_FINANCE: 'Module J: 36-Month Financials',
  MOD_K_GRANTS_FUNDING: 'Module K: Grants & Capital Stack',
  MOD_L_BUSINESS_PLAN: 'Module L: Business Plan Compiler',
};

export const MODULE_CODE_SHORT_LABELS: Record<string, string> = {
  MOD_A_IDEATION: 'Module A',
  MOD_B_MARKET: 'Module B',
  MOD_C_SURVEYS_FEEDBACK: 'Module C',
  MOD_D_PRODUCT_BUILD: 'Module D',
  MOD_E_OPERATIONS: 'Module E',
  MOD_F_COFOUNDER_TEAM: 'Module F',
  MOD_G_LAUNCHPAD: 'Module G',
  MOD_H_REVENUE: 'Module H',
  MOD_I_MARKETING: 'Module I',
  MOD_J_FINANCE: 'Module J',
  MOD_K_GRANTS_FUNDING: 'Module K',
  MOD_L_BUSINESS_PLAN: 'Module L',
};

export function formatModuleCodeLabel(code?: string | null): string {
  if (!code) return 'Workspace';
  return MODULE_CODE_FULL_LABELS[code] || humanizeEnumFallback(code);
}

export function formatModuleCodeShortLabel(code?: string | null): string {
  if (!code) return 'Module';
  return MODULE_CODE_SHORT_LABELS[code] || humanizeEnumFallback(code);
}

export const COMPILER_MODE_LABELS: Record<string, string> = {
  IE_LEO_OFFICIAL_FORM: 'Irish LEO Official Application Form',
  UK_INNOVATE_UK_9Q: 'UK Innovate UK 9-Question IFS Mode',
  UK_START_UP_LOANS_WORKBOOK: 'UK Start Up Loans 4-Part Workbook',
  INVESTOR_SEIS_EIS_EII_PACK: 'Investor SEIS / EIS / EII Advance Assurance Pack',
  STANDARD_COMMERCIAL_PLAN: 'Standard Commercial Business Plan',
  STANDARD_BUSINESS_PLAN: 'Standard Commercial Business Plan',
};

export function formatCompilerModeLabel(
  mode?: string | null,
  otherText?: string | null
): string {
  if (!mode) return 'Standard Commercial Business Plan';
  if (mode === 'OTHER' && otherText?.trim()) return otherText.trim();
  return COMPILER_MODE_LABELS[mode] || humanizeEnumFallback(mode);
}

export const SUBMISSION_OBJECTIVE_LABELS: Record<string, string> = {
  NON_DILUTIVE_CAPITAL_GRANT: 'Non-Dilutive Public Capital Grant',
  GOVERNMENT_LOAN_APPROVAL: 'Government-Backed Start Up / Microfinance Loan',
  TAX_RELIEF_CLEARANCE_AND_SEED: 'Investor Tax Relief Clearance & Seed Round',
  BANK_OR_COMMERCIAL_PARTNERSHIP: 'Commercial Bank Facility or Strategic Partnership',
  INVESTOR_AND_COMMERCIAL_FINANCING: 'Investor & Commercial Financing',
};

export function formatSubmissionObjectiveLabel(
  objective?: string | null,
  otherText?: string | null
): string {
  if (!objective) return 'Commercial & Funding Readiness';
  if (objective === 'OTHER' && otherText?.trim()) return otherText.trim();
  return SUBMISSION_OBJECTIVE_LABELS[objective] || humanizeEnumFallback(objective);
}

export const GRANT_SCHEME_LABELS: Record<string, string> = {
  IE_LEO_FEASIBILITY: 'Irish LEO Feasibility Study Grant',
  IE_LEO_PRIMING: 'Irish LEO Priming Grant',
  IE_LEO_GROW_DIGITAL_AI: 'Irish LEO Grow Digital & AI Voucher',
  IE_EI_PSSF: 'Enterprise Ireland Pre-Seed Start Fund (PSSF)',
  IE_REVENUE_SURE_TAX_RELIEF: 'Irish Revenue SURE Founder Tax Refund',
  IE_EI_EII_INVESTOR_RELIEF: 'Irish Revenue EII Investor Tax Relief',
  GB_BBB_START_UP_LOAN: 'British Business Bank Start Up Loan',
  GB_INNOVATE_UK_SMART: 'Innovate UK Smart Grant',
  GB_HMRC_SEIS_ASSURANCE: 'UK HMRC SEIS / EIS Advance Assurance',
  GB_GROWTH_HUB_MATCH: 'UK Regional Growth Hub Match Grant',
};

export function formatGrantSchemeLabel(grantKey?: string | null): string {
  if (!grantKey) return '';
  return GRANT_SCHEME_LABELS[grantKey] || humanizeEnumFallback(grantKey);
}

export const TAX_RELIEF_SCHEME_LABELS: Record<string, string> = {
  NONE_BOOTSTRAPPED: '100% Bootstrapped & Non-Dilutive Grants (No External Equity)',
  GB_SEIS_SEED_ENTERPRISE: 'UK HMRC SEIS (50% Seed Investor Tax Relief)',
  GB_EIS_ENTERPRISE_INVESTMENT: 'UK HMRC EIS (30% Investor Tax Relief)',
  IE_SURE_FOUNDER_PAYE_REFUND: 'Irish Revenue SURE (Founder PAYE Tax Refund)',
  IE_EII_EMPLOYMENT_INVESTMENT_INCENTIVE: 'Irish Revenue EII (40% Investor Tax Relief)',
  IE_SCIS_SMALL_COMPANY_INVESTMENT: 'Irish SCIS Startup Capital Incentive',
  NONE: 'None Selected',
};

export function formatTaxReliefSchemeLabel(
  scheme?: string | null,
  otherText?: string | null
): string {
  if (!scheme) return '';
  if (scheme === 'OTHER') {
    return otherText?.trim() || 'Custom Tax Relief Scheme';
  }
  return TAX_RELIEF_SCHEME_LABELS[scheme] || humanizeEnumFallback(scheme);
}

export const BRIDGE_STRATEGY_LABELS: Record<string, string> = {
  FOUNDER_DIRECTOR_LOAN_BUFFER: "Founder / Director's Working Capital Loan Buffer",
  MICROFINANCE_OR_STARTUP_LOAN_BRIDGE: 'Microfinance Ireland / Start Up Loan Working Capital Bridge',
  SUPPLIER_60_DAY_STAGGERED_TERMS: 'Staggered 60-Day Supplier Invoice Terms',
  REVOLVING_CREDIT_LINE: 'Business Overdraft / Revolving Credit Facility',
};

export function formatBridgeStrategyLabel(
  strategy?: string | null,
  otherText?: string | null
): string {
  if (!strategy) return '';
  if (strategy === 'OTHER') {
    return otherText?.trim() || 'Custom Reimbursement Bridge';
  }
  return BRIDGE_STRATEGY_LABELS[strategy] || humanizeEnumFallback(strategy);
}

export const ADVANCE_ASSURANCE_STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: 'Not Started Yet',
  PREPARING_PACK: 'Preparing Advance Assurance Pack',
  SUBMITTED: 'Submitted to Revenue / HMRC',
  APPROVED: 'Advance Assurance Approved',
};

export function formatAdvanceAssuranceStatusLabel(
  status?: string | null
): string {
  if (!status) return '';
  return ADVANCE_ASSURANCE_STATUS_LABELS[status] || humanizeEnumFallback(status);
}

export const STUDIO_TARGET_AUDIENCE_LABELS: Record<string, string> = {
  GRANT_COMMITTEE: 'Public Grant Evaluation Committee',
  COMMERCIAL_BANK: 'Commercial Bank Credit Underwriter',
  ANGEL_INVESTOR: 'Angel Syndicate & Seed Investors',
  ADVISOR_BOARD: 'Advisory Board & Mentors',
  INTERNAL_TEAM: 'Founding & Operational Team',
};

export function formatStudioTargetAudienceLabel(
  audience?: string | null
): string {
  if (!audience) return 'Stakeholder';
  return STUDIO_TARGET_AUDIENCE_LABELS[audience] || humanizeEnumFallback(audience);
}
