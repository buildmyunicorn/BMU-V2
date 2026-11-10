'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Scale,
  Check,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Lightbulb,
  Wand2,
  RefreshCw,
  ExternalLink,
  DollarSign,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Trash2,
  Download,
  FileSpreadsheet,
  Building2,
  Users,
  Globe,
  TrendingUp,
  Clock,
  Landmark,
  Calculator,
  Layers,
  Info,
  Eye,
  FileText,
  Copy,
  Printer,
  ShieldAlert,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PartnerSlot } from '@/components/workspace/partner-slot';
import type {
  ActiveStartupPlan,
  FinanceViewLanguageMode,
  OperatingCostPostureType,
  OverheadBucketCategory,
  VatRegistrationStrategyType,
  OverheadGrantEligibilityTag,
  FinancialOverheadLineItem,
  FinancialOverheadsTaxStep1Data,
  CustomerCollectionTimingType,
  InventoryStockTimingType,
  SeasonalityRampCurveType,
  WorkingCapitalTimingStep2Data,
  PrimaryFundingStrategyType,
  FundingSourceCategoryType,
  FundingSourceLineItem,
  CashflowFundingGapStep3Data,
  FinancialStressScenarioType,
  CorporateIpReadinessStatusType,
  StatementsStressTestStep4Data,
  FinanceReadinessConfidence,
  FinanceExecutiveBriefStep5Data,
  FinanceBlindSpotItem,
} from '@/lib/auth/session-store';
import {
  saveModuleJStep1OverheadsTaxAction,
  generateModuleJOverheadsTaxAction,
  saveModuleJStep2WorkingCapitalAction,
  generateModuleJWorkingCapitalAction,
  saveModuleJStep3CashflowGapAction,
  generateModuleJCashflowFundingGapAction,
  saveModuleJStep4StatementsAction,
  generateModuleJStatementsStressTestAction,
  saveModuleJStep5BriefAction,
  generateModuleJExecutiveBriefAction,
  parkModuleJOpenQuestionAction,
} from '@/app/actions/module-j';

export interface ModuleJWorkspaceProps {
  plan: ActiveStartupPlan;
  selectedCountry?: string;
  isVaultReadonly?: boolean;
  onSaveStep1OverheadsTax?: (
    step1Data: FinancialOverheadsTaxStep1Data,
    progress?: number
  ) => Promise<void> | void;
  onSaveStep2WorkingCapital?: (
    step2Data: WorkingCapitalTimingStep2Data,
    progress?: number
  ) => Promise<void> | void;
  onSaveStep3CashflowGap?: (
    step3Data: CashflowFundingGapStep3Data,
    progress?: number
  ) => Promise<void> | void;
  onSaveStep4Statements?: (
    step4Data: StatementsStressTestStep4Data,
    progress?: number
  ) => Promise<void> | void;
  onSaveStep5Brief?: (
    step5Data: FinanceExecutiveBriefStep5Data,
    progress?: number
  ) => Promise<void> | void;
  onBackToModuleI?: () => void;
  onContinueToModuleK?: () => void;
  onNavigateToModule?: (
    moduleCode:
      | 'MOD_A_IDEATION'
      | 'MOD_B_MARKET'
      | 'MOD_C_SURVEYS_FEEDBACK'
      | 'MOD_D_PRODUCT_BUILD'
      | 'MOD_E_OPERATIONS'
      | 'MOD_F_COFOUNDER_TEAM'
      | 'MOD_G_LAUNCHPAD'
      | 'MOD_H_REVENUE'
      | 'MOD_I_MARKETING'
      | 'MOD_J_FINANCE'
      | 'MOD_K_GRANTS_FUNDING'
      | 'MOD_L_BUSINESS_PLAN',
    targetStep?: number,
    highlightId?: string
  ) => void;
  initialStep?: number;
  highlightTarget?: string;
}

const OPERATING_POSTURE_OPTIONS: Array<{
  id: OperatingCostPostureType;
  plainTitle: string;
  accountantTitle: string;
  badge: string;
  description: string;
  grantNote: string;
  benchmarkMultiplier: number;
}> = [
  {
    id: 'BOOTSTRAPPED_HOME_LEAN',
    plainTitle: 'Ultra-Lean / Home-Based',
    accountantTitle: 'Remote Zero-Lease Lean OpEx',
    badge: 'Lowest Burn',
    description:
      'Work from home, use free/starter cloud tools, and keep fixed monthly bills under €400/£350 until revenue scales.',
    grantNote: 'Maximizes personal runway; very popular for UK Start Up Loans & LEO Feasibility.',
    benchmarkMultiplier: 0.65,
  },
  {
    id: 'HYBRID_COWORKING_GROWTH',
    plainTitle: 'Co-Working & Modern Cloud Stack',
    accountantTitle: 'Flexible Hub & SaaS Growth OpEx',
    badge: 'Recommended Default',
    description:
      'Hot-desk or enterprise hub membership, core SaaS automation stack, professional bookkeeping, and cyber/PI insurance.',
    grantNote: 'Ideal balance for LEO Priming, Enterprise Ireland New Frontiers & SEIS.',
    benchmarkMultiplier: 1.0,
  },
  {
    id: 'COMMERCIAL_PREMISES_TEAM',
    plainTitle: 'Dedicated Premises, Lab or Unit',
    accountantTitle: 'Commercial Lease & Physical Operations',
    badge: 'Physical / Workshop',
    description:
      'Dedicated commercial unit, kitchen, workshop, or R&D lab with fixed monthly rent, commercial rates, utilities, and stock cover.',
    grantNote: 'Requires commercial lease heads-of-terms and Public/Product Liability insurance.',
    benchmarkMultiplier: 1.85,
  },
  {
    id: 'HIGH_VELOCITY_VENTURE',
    plainTitle: 'Venture-Backed Fast Scaleup',
    accountantTitle: 'High-Growth Institutional OpEx',
    badge: 'HPSU / Venture',
    description:
      'Accelerated multi-seat hiring, dedicated office, enterprise compliance/audit retainer, and aggressive international expansion.',
    grantNote: 'Matches Enterprise Ireland HPSU / PSSF and Innovate UK Smart Grant expectations.',
    benchmarkMultiplier: 2.4,
  },
  {
    id: 'OTHER',
    plainTitle: 'Other / Custom Setup',
    accountantTitle: 'Custom Operating Cost Structure',
    badge: 'Custom',
    description:
      'Define a hybrid or sector-specific operating model (e.g., university spinout lab access, seasonal pop-up, or franchise).',
    grantNote: 'Provide clear notes for the grant assessor explaining your custom cost base.',
    benchmarkMultiplier: 1.0,
  },
];

const VAT_STRATEGY_OPTIONS: Array<{
  id: VatRegistrationStrategyType;
  plainTitle: string;
  accountantTitle: string;
  badge: string;
  description: string;
}> = [
  {
    id: 'REGISTERED_FROM_DAY_1',
    plainTitle: 'VAT Registered from Day 1 (Reclaim VAT on Startup Costs)',
    accountantTitle: 'Voluntary Day-1 VAT Registration (Input VAT Recovery)',
    badge: 'Best for B2B / CapEx',
    description:
      'Register immediately so you can claim back 23% (IE) or 20% (UK) VAT on equipment, agency builds, and software bills.',
  },
  {
    id: 'REGISTER_AT_THRESHOLD',
    plainTitle: 'Wait Until Sales Cross the Legal VAT Threshold',
    accountantTitle: 'Statutory Threshold Registration (€42.5k/€85k IE • £90k UK)',
    badge: 'Best for B2C / Services',
    description:
      'Keep consumer prices simpler at launch and automatically register once rolling 12-month sales approach the statutory threshold.',
  },
  {
    id: 'VAT_EXEMPT_OR_BELOW',
    plainTitle: 'VAT Exempt Sector or Staying Below Threshold',
    accountantTitle: 'Exempt Supply / Micro-Enterprise Non-VAT',
    badge: 'Financial / Medical / Micro',
    description:
      'Your sector is VAT-exempt (e.g., certain medical, education, or financial services) or turnover remains below threshold.',
  },
  {
    id: 'OTHER',
    plainTitle: 'Other / Custom Tax Arrangement',
    accountantTitle: 'Bespoke / Cross-Border OSS VAT Regime',
    badge: 'Custom',
    description:
      'Specify a custom VAT arrangement such as EU One-Stop-Shop (OSS), reverse-charge B2B export only, or flat-rate scheme.',
  },
];

const OVERHEAD_CATEGORY_LABELS: Record<
  OverheadBucketCategory,
  { plain: string; accountant: string }
> = {
  PREMISES_RENT_UTILITIES: {
    plain: 'Rent, Co-Working & Utilities',
    accountant: 'Premises Lease, Rates & Light/Heat',
  },
  SOFTWARE_CLOUD_AI: {
    plain: 'Software, Website & AI Tools',
    accountant: 'IT Infrastructure, SaaS & Cloud Hosting',
  },
  MARKETING_GROWTH_EVENTS: {
    plain: 'Marketing, Ads & Events',
    accountant: 'Customer Acquisition, PR & Trade Shows',
  },
  ACCOUNTING_LEGAL_COMPLIANCE: {
    plain: 'Bookkeeping, Accountant & Legal',
    accountant: 'Professional, Audit & Legal Retainers',
  },
  INSURANCE_STATUTORY: {
    plain: 'Business & Liability Insurance',
    accountant: 'Commercial PL / EL / PI / Cyber Insurance',
  },
  TRAVEL_ADMIN_SUNDRIES: {
    plain: 'Travel, Phone & Office Supplies',
    accountant: 'Travel, Subsistence & General Admin',
  },
  OTHER: {
    plain: 'Other Custom Monthly Bill',
    accountant: 'Other Operating Expenditure (OpEx)',
  },
};

const COLLECTION_TIMING_OPTIONS: Array<{
  id: CustomerCollectionTimingType;
  plainTitle: string;
  accountantTitle: string;
  badge: string;
  debtorDays: number;
  description: string;
  grantNote: string;
}> = [
  {
    id: 'INSTANT_CARD_STRIPE_0',
    plainTitle: 'Paid Immediately at Checkout (0 Days)',
    accountantTitle: '0 Debtor Days (Cash / Card / Stripe Settlement)',
    badge: 'Best Cashflow',
    debtorDays: 0,
    description:
      'Customers pay upfront by card, Stripe, Apple Pay, or direct debit before or upon delivery.',
    grantNote: 'Ideal for SaaS, apps, D2C e-commerce & consumer bookings; zero unpaid invoice lag.',
  },
  {
    id: 'NET_15_INVOICE',
    plainTitle: 'Short Invoice Terms (14–15 Days)',
    accountantTitle: '15 Debtor Days (Net-14 / Milestone Billing)',
    badge: 'SME / Agency',
    debtorDays: 15,
    description:
      'You send an invoice and small-business clients pay within 2 weeks (or 50% upfront, 50% on delivery).',
    grantNote: 'Half a month of sales stays in unpaid invoices at any given time.',
  },
  {
    id: 'NET_30_STANDARD_B2B',
    plainTitle: 'Standard Business Invoice (30 Days)',
    accountantTitle: '30 Debtor Days (Standard Net-30 Trade Debtors)',
    badge: 'Standard B2B',
    debtorDays: 30,
    description:
      'A sale made in Month 1 lands in your bank account in Month 2. Standard for B2B software and services.',
    grantNote: 'Grant assessors expect B2B startups to model at least 30 debtor days.',
  },
  {
    id: 'NET_60_ENTERPRISE_RETAIL',
    plainTitle: 'Slow Corporate, Retail or Public Sector (60 Days)',
    accountantTitle: '60 Debtor Days (Extended Enterprise / Retail Credit)',
    badge: 'High Cash Lockup',
    debtorDays: 60,
    description:
      'Supermarkets, wholesalers, large enterprises, and hospitals/HSE/NHS often take 60+ days to pay invoices.',
    grantNote: 'Creates a 2-month cash gap that must be bridged in Step 3.',
  },
  {
    id: 'OTHER',
    plainTitle: 'Other / Custom Payment Terms',
    accountantTitle: 'Custom Debtor Days / Stage-Gate Billing',
    badge: 'Custom',
    debtorDays: 45,
    description:
      'Specify custom payment terms (e.g., 45-day terms, annual upfront contracts, or construction retentions).',
    grantNote: 'Set your exact custom debtor days below so the 36-month cashflow shifts accurately.',
  },
];

const INVENTORY_TIMING_OPTIONS: Array<{
  id: InventoryStockTimingType;
  plainTitle: string;
  accountantTitle: string;
  badge: string;
  defaultBufferMonths: number;
  description: string;
}> = [
  {
    id: 'NO_PHYSICAL_STOCK_DIGITAL',
    plainTitle: 'No Physical Stock (Software, AI, Digital or Services)',
    accountantTitle: 'Zero Inventory Holding (Digital / Service Delivery)',
    badge: 'Zero Stock Tie-Up',
    defaultBufferMonths: 0,
    description:
      'You don’t buy physical goods in advance—your costs are servers, software, or service delivery.',
  },
  {
    id: 'PAY_ON_DELIVERY_30_DAYS',
    plainTitle: 'Local Stock or Pay Suppliers Monthly (30 Days)',
    accountantTitle: 'Just-in-Time Stock / 30-Day Trade Creditors (AP)',
    badge: 'Low Stock Buffer',
    defaultBufferMonths: 1,
    description:
      'You order small local batches or your suppliers give you 30 days credit to pay after delivery.',
  },
  {
    id: 'IMPORT_MANUFACTURING_60_90_DAYS',
    plainTitle: 'Upfront Manufacturing or Overseas Import (60–90 Days)',
    accountantTitle: 'Prepaid Contract Manufacturing & 60–90 Day Lead Time',
    badge: 'Upfront Cash Needed',
    defaultBufferMonths: 3,
    description:
      'You must pay factories upfront to manufacture and ship physical stock 2–3 months before you can sell it.',
  },
  {
    id: 'OTHER',
    plainTitle: 'Other / Custom Stock or Supplier Arrangement',
    accountantTitle: 'Bespoke Consignment / Dropship / Custom Supply Chain',
    badge: 'Custom',
    defaultBufferMonths: 1,
    description:
      'Describe a hybrid supply chain such as consignment stock, made-to-order deposits, or dropshipping.',
  },
];

const SEASONALITY_RAMP_OPTIONS: Array<{
  id: SeasonalityRampCurveType;
  plainTitle: string;
  accountantTitle: string;
  badge: string;
  monthlyWeights: number[]; // 12 weights summing to 12.0 (1.0 = average month)
  description: string;
}> = [
  {
    id: 'STEADY_LINEAR_RAMP',
    plainTitle: 'Steady Month-by-Month Climb',
    accountantTitle: 'Linear Monthly Customer & ARR Ramp',
    badge: 'SaaS / B2B / Services',
    monthlyWeights: [0.35, 0.45, 0.6, 0.75, 0.85, 0.95, 1.05, 1.15, 1.25, 1.4, 1.55, 1.65],
    description:
      'Starts modestly in Month 1 and grows steadily each month as word-of-mouth and marketing compound.',
  },
  {
    id: 'SLOW_B2B_H2_WEIGHTED',
    plainTitle: 'Slow First 6 Months, Strong Second Half',
    accountantTitle: 'H2-Weighted Enterprise Onboarding Curve',
    badge: 'Enterprise / MedTech',
    monthlyWeights: [0.15, 0.2, 0.3, 0.4, 0.55, 0.7, 1.0, 1.25, 1.5, 1.75, 2.0, 2.2],
    description:
      'Reflects longer B2B sales cycles or pilots in Months 1–6 followed by larger contract conversions in Months 7–12.',
  },
  {
    id: 'Q4_RETAIL_GIFTING_PEAK',
    plainTitle: 'Autumn & Christmas / Q4 Peak (Oct–Dec Surge)',
    accountantTitle: 'Q4 Retail, E-Commerce & Gifting Concentration',
    badge: 'Retail / Consumer / Food',
    monthlyWeights: [0.5, 0.55, 0.65, 0.7, 0.75, 0.8, 0.8, 0.85, 1.1, 1.45, 1.85, 2.0],
    description:
      'Steady baseline through Spring/Summer with a major surge across Black Friday, November, and December.',
  },
  {
    id: 'SUMMER_HOSPITALITY_PEAK',
    plainTitle: 'Spring & Summer Peak (May–Sept Surge)',
    accountantTitle: 'Q2–Q3 Tourism, Events & Outdoor Seasonal Curve',
    badge: 'Hospitality / Events / Agri',
    monthlyWeights: [0.45, 0.5, 0.75, 1.0, 1.35, 1.65, 1.8, 1.75, 1.2, 0.65, 0.45, 0.45],
    description:
      'High activity from May through September with quieter winter shoulder months.',
  },
  {
    id: 'OTHER',
    plainTitle: 'Other / Custom Seasonal Pattern',
    accountantTitle: 'Custom Sector-Specific Demand Curve',
    badge: 'Custom',
    monthlyWeights: [0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.05, 1.15, 1.2, 1.3, 1.35, 1.45],
    description:
      'Define your own custom seasonal timing (e.g., academic school year Sept/Jan peaks or tax-year deadlines).',
  },
];

// ---------------------------------------------------------------------------
// STEP 3 OPTIONS: PRIMARY FUNDING POSTURE & CAPITAL STACK SOURCES
// ---------------------------------------------------------------------------
const PRIMARY_FUNDING_STRATEGY_OPTIONS: Array<{
  id: PrimaryFundingStrategyType;
  plainTitle: string;
  accountantTitle: string;
  badge: string;
  description: string;
  grantNote: string;
}> = [
  {
    id: 'BOOTSTRAPPED_FOUNDER_SAVINGS',
    plainTitle: 'Self-Funded Savings & Customer Cashflow',
    accountantTitle: 'Bootstrapped Promoter Equity & Organic Working Capital',
    badge: 'Zero Dilution',
    description:
      'Bridge the early cash dip using personal savings / director loan and early customer sales without external debt or equity.',
    grantNote: 'Ideal for ultra-lean digital or service businesses with fast customer payback.',
  },
  {
    id: 'GRANT_PLUS_MATCH_FUNDING',
    plainTitle: 'State Grant + 50% Match Funding Bridge',
    accountantTitle: 'Non-Dilutive State Grant + Co-Investment Match Stack',
    badge: 'IE LEO / EI / Innovate UK',
    description:
      'Combine a 50%–70% state grant (paid in arrears after spend) with founder savings or a startup loan to cover upfront receipts.',
    grantNote:
      'Mandatory for LEO Priming/Feasibility & Innovate UK: you must prove you have the cash to spend first before claiming the grant back.',
  },
  {
    id: 'STARTUP_LOAN_DEBT_BRIDGE',
    plainTitle: 'Startup Loan / Microfinance Working Capital Bridge',
    accountantTitle: 'Amortizing Senior Working Capital Facility (MFI / BBB)',
    badge: 'UK Start Up Loan / IE MFI',
    description:
      'Use a government-backed startup loan (€2k–€25k Microfinance Ireland or £500–£25k British Business Bank Start Up Loan at 6% fixed) to fund launch.',
    grantNote:
      'Requires showing that monthly loan repayments are comfortably covered by Month 6–12 operating cashflow.',
  },
  {
    id: 'ANGEL_SEIS_EIS_ROUND',
    plainTitle: 'Angel / Pre-Seed Round (EII / SEIS / EIS)',
    accountantTitle: 'Tax-Advantaged Seed Equity & Grant Co-Funding Stack',
    badge: 'High-Growth / HPSU',
    description:
      'Raise external angel or pre-seed equity (using UK SEIS/EIS or Irish EII tax relief) alongside Enterprise Ireland PSSF/HPSU or Innovate UK.',
    grantNote:
      'Standard for high-R&D or longer B2B runway ventures needing 12–18 months of cash buffer.',
  },
  {
    id: 'OTHER',
    plainTitle: 'Other / Custom Hybrid Funding Mix',
    accountantTitle: 'Custom Blended Capital & Revenue-Based Financing Stack',
    badge: 'Custom',
    description:
      'Specify a custom funding mix such as strategic customer pre-payments, accelerator stipends (New Frontiers), or R&D tax credit monetization.',
    grantNote: 'Clearly document timing and conditions for each source in your written narrative.',
  },
];

const FUNDING_SOURCE_CATEGORY_OPTIONS: Array<{
  id: FundingSourceCategoryType;
  plainLabel: string;
  accountantLabel: string;
  defaultArrears: boolean;
  defaultLagMonths: number;
}> = [
  {
    id: 'FOUNDER_SAVINGS_EQUITY',
    plainLabel: 'Founder Savings / Director Loan (Cash Ready Day 1)',
    accountantLabel: 'Promoter Equity / Subordinated Director Loan',
    defaultArrears: false,
    defaultLagMonths: 0,
  },
  {
    id: 'LEO_EI_INNOVATE_GRANT',
    plainLabel: 'Government Grant (Paid in Arrears After You Spend)',
    accountantLabel: 'Non-Dilutive State Grant (Reimbursed on Paid Receipts)',
    defaultArrears: true,
    defaultLagMonths: 3,
  },
  {
    id: 'STARTUP_LOAN_MICROFINANCE',
    plainLabel: 'Startup / Microfinance Loan (Repaid Monthly)',
    accountantLabel: 'Term Debt Facility (UK Start Up Loan / Microfinance IE)',
    defaultArrears: false,
    defaultLagMonths: 0,
  },
  {
    id: 'ANGEL_SEIS_EIS_EQUITY',
    plainLabel: 'Friends, Family or Angel Investors (SEIS / EIS / EII)',
    accountantLabel: 'External Ordinary Share Capital (SEIS/EIS/EII)',
    defaultArrears: false,
    defaultLagMonths: 0,
  },
  {
    id: 'OTHER',
    plainLabel: 'Other Custom Funding Source (Pre-Orders, Stipend, etc.)',
    accountantLabel: 'Other Capital Inflow / Accelerator Stipend',
    defaultArrears: false,
    defaultLagMonths: 0,
  },
];

export function buildDefaultFundingSourcesForCountry(
  isUK: boolean,
  targetRaiseAmount: number
): FundingSourceLineItem[] {
  const cleanTarget = Math.max(10000, Math.ceil(targetRaiseAmount / 1000) * 1000);
  const founderPortion = Math.round(cleanTarget * 0.35);
  const grantPortion = Math.round(cleanTarget * 0.4);
  const loanPortion = Math.max(0, cleanTarget - founderPortion - grantPortion);

  return [
    {
      id: 'fs-founder-1',
      sourceType: 'FOUNDER_SAVINGS_EQUITY',
      label: 'Founder Personal Savings / Director Loan',
      amount: founderPortion,
      isReimbursementArrears: false,
      reimbursementLagMonths: 0,
    },
    {
      id: 'fs-grant-2',
      sourceType: 'LEO_EI_INNOVATE_GRANT',
      label: isUK
        ? 'Innovate UK / Regional Growth Grant (Paid in Arrears)'
        : 'LEO Priming / Feasibility Grant (50% Reimbursed in Arrears)',
      amount: grantPortion,
      isReimbursementArrears: true,
      reimbursementLagMonths: 3,
    },
    {
      id: 'fs-loan-3',
      sourceType: 'STARTUP_LOAN_MICROFINANCE',
      label: isUK
        ? 'British Business Bank Start Up Loan (6% Fixed)'
        : 'Microfinance Ireland Startup Loan (Bridge Facility)',
      amount: loanPortion,
      isReimbursementArrears: false,
      reimbursementLagMonths: 0,
    },
  ];
}

// ---------------------------------------------------------------------------
// STEP 4 OPTIONS: SENSITIVITY STRESS-TEST SCENARIOS & CORPORATE/IP PLACEHOLDER
// ---------------------------------------------------------------------------
const STRESS_SCENARIO_OPTIONS: Array<{
  id: FinancialStressScenarioType;
  plainTitle: string;
  accountantTitle: string;
  badge: string;
  revenueHaircutPercent: number;
  costInflationPercent: number;
  delayMonths: number;
  description: string;
  grantNote: string;
}> = [
  {
    id: 'BASE_CASE_OFFICIAL',
    plainTitle: 'Official Base-Case Plan (0% Haircut)',
    accountantTitle: 'Official Underwriting Base Case (100% Forecast)',
    badge: 'Official Plan',
    revenueHaircutPercent: 0,
    costInflationPercent: 0,
    delayMonths: 0,
    description:
      'Your baseline 3-Year Profit & Loss and 36-Month Cashflow exactly as configured in Steps 1–3.',
    grantNote: 'Primary financial schedule attached to LEO, Enterprise Ireland & UK Start Up Loans forms.',
  },
  {
    id: 'DELAYED_LAUNCH_3_MO',
    plainTitle: '3-Month Delayed Launch (+3m to Sales)',
    accountantTitle: 'Commercial Launch Slippage Stress Test (+3 Months)',
    badge: 'Launch Delay Test',
    revenueHaircutPercent: 0,
    costInflationPercent: 0,
    delayMonths: 3,
    description:
      'Simulates what happens to your bank balance if product build or first customer contracts take 3 months longer than planned.',
    grantNote: 'Assesses whether your Step 3 capital stack and safety buffer survive a 1-quarter launch delay.',
  },
  {
    id: 'UNDERWRITER_STRESS_TEST',
    plainTitle: 'Grant Underwriter Stress Test (-20% Sales, +15% Costs)',
    accountantTitle: 'Standard Bank & Grant Sensitivity Test (-20% Revenue, +15% OpEx)',
    badge: 'Underwriter Standard',
    revenueHaircutPercent: 20,
    costInflationPercent: 15,
    delayMonths: 0,
    description:
      'Applies the exact downside test bank & grant assessors run behind the scenes: 20% lower sales and 15% higher running bills.',
    grantNote: 'Passing this test with a positive bank balance is a major green flag for loan & grant committees.',
  },
  {
    id: 'OTHER',
    plainTitle: 'Other / Custom Sensitivity Stress Test',
    accountantTitle: 'Custom Multi-Variable Sensitivity Stress Scenario',
    badge: 'Custom Sliders',
    revenueHaircutPercent: 15,
    costInflationPercent: 10,
    delayMonths: 1,
    description:
      'Dial in your own custom revenue haircut %, cost inflation %, launch delay, and scenario description.',
    grantNote: 'Use for bespoke sector risks (e.g., supply-chain tariff spike or regulatory approval lag).',
  },
];

const CORPORATE_IP_READINESS_OPTIONS: Array<{
  id: CorporateIpReadinessStatusType;
  plainTitle: string;
  accountantTitle: string;
  badge: string;
  description: string;
}> = [
  {
    id: 'LTD_INCORPORATED_IP_ASSIGNED',
    plainTitle: 'Limited Company Registered & IP Owned by the Company',
    accountantTitle: 'Incorporated LTD Entity & Executed IP Assignment Deed',
    badge: 'Grant-Ready',
    description:
      'Company is incorporated (CRO / Companies House) and all code, brand, and IP is formally assigned to the LTD.',
  },
  {
    id: 'INCORPORATION_IN_PROGRESS',
    plainTitle: 'Incorporating Limited Company Before Grant Drawdown',
    accountantTitle: 'Pre-Drawdown CRO / Companies House Incorporation Pending',
    badge: 'In Progress',
    description:
      'Applying now and completing LTD registration, business bank account, and IP assignment prior to first grant drawdown.',
  },
  {
    id: 'SOLE_TRADER_PRE_INCORPORATION',
    plainTitle: 'Starting as Sole Trader / Feasibility Stage First',
    accountantTitle: 'Unincorporated Sole Trader / Feasibility Applicant',
    badge: 'Feasibility / Loan',
    description:
      'Suitable for UK Start Up Loans or initial LEO Feasibility testing before converting to a Limited Company for Priming/SEIS.',
  },
  {
    id: 'OTHER',
    plainTitle: 'Other / Custom Corporate or IP Arrangement',
    accountantTitle: 'Custom Corporate / University Spinout / Licensing Structure',
    badge: 'Custom',
    description:
      'Specify a custom structure such as a university TTO licence, holding company, CLG social enterprise, or partnership.',
  },
];

const FINANCE_READINESS_CONFIDENCE_OPTIONS: Array<{
  id: Exclude<FinanceReadinessConfidence, ''>;
  plainTitle: string;
  accountantTitle: string;
  badge: string;
  description: string;
}> = [
  {
    id: 'BANK_AND_GRANT_UNDERWRITING_READY',
    plainTitle: 'Ready for Grant & Loan Applications (Fully Bridged)',
    accountantTitle: 'Bank, Grant & Investor Underwriting Ready',
    badge: 'Grant Ready',
    description:
      '3-Year P&L, 36-Month Cashflow, and Capital Stack bridge the lowest cash trough and remain solvent under stress testing.',
  },
  {
    id: 'BOOTSTRAP_CASHFLOW_SELF_FUNDED',
    plainTitle: 'Self-Funded from Customer Revenue & Savings',
    accountantTitle: 'Organic Customer Cashflow & Founder Equity Funded',
    badge: 'Bootstrapped',
    description:
      'Low monthly burn and fast customer payment collection allow the business to scale without external debt or equity.',
  },
  {
    id: 'REQUIRES_BRIDGE_OR_LOAN_FACILITY',
    plainTitle: 'Needs a Startup Loan or Working Capital Bridge First',
    accountantTitle: 'Requires Working Capital / Grant Arrears Bridge Facility',
    badge: 'Bridge Needed',
    description:
      'Profitable on paper, but needs a Start Up Loan, Microfinance Ireland loan, or founder bridge to cover upfront spend and grant arrears.',
  },
  {
    id: 'NEEDS_UNIT_ECONOMICS_RECALIBRATION',
    plainTitle: 'Needs Pricing or Monthly Cost Tweaks Before Applying',
    accountantTitle: 'Requires Unit Margin or Fixed OpEx Recalibration',
    badge: 'Recalibrate',
    description:
      'Fixed monthly burn or customer payment lag creates a cash deficit under stress testing that should be tightened first.',
  },
  {
    id: 'OTHER',
    plainTitle: 'Other / Custom Financial Readiness Status',
    accountantTitle: 'Custom Financial Underwriting Posture',
    badge: 'Custom',
    description:
      'Specify a custom financial readiness status (e.g., phased R&D spinout, milestone-based angel tranche, or seasonal facility).',
  },
];

export interface UpstreamFinancialBaseline {
  monthlyTechStackCost: number;
  oneOffBuildCost: number;
  monthlyPremisesCost: number;
  monthlyInsuranceCost: number;
  totalCapExEquipment: number;
  monthlyFounderDrawings: number;
  monthlyTeamSalariesY1: number;
  monthlyTeamSalariesY2: number;
  monthlyTeamSalariesY3: number;
  monthlyMarketingSpend: number;
  isPaidAdsOptedOutInModI: boolean;
  exportSharePercentFromModH: number;
  headlinePriceNet: number;
  unitDirectCogs: number;
  targetCustomersY1: number;
}

export function resolveUpstreamFinancialBaseline(
  plan: Partial<ActiveStartupPlan>,
  selectedCountry?: string
): UpstreamFinancialBaseline {
  const isUK = (selectedCountry || plan.hqCountryCode) === 'GB';

  // 1. Module D: Tech Stack & Build Costs
  const modDBuild = plan.moduleDData?.buildVsBuy;
  const monthlyTechStackCost =
    Number((modDBuild as any)?.estimatedMonthlyRunCost) ||
    Number((modDBuild as any)?.monthlySaaSBudget) ||
    120;
  const oneOffBuildCost =
    Number((modDBuild as any)?.estimatedUpfrontBuildCost) ||
    Number((modDBuild as any)?.v1BuildBudget) ||
    0;

  // 2. Module E: Premises, Insurance & CapEx Equipment
  const modEPremises = plan.moduleEData?.premisesAndEquipment;
  const monthlyPremisesCost =
    Number(modEPremises?.monthlyPremisesAndUtilitiesCost) ||
    Number((modEPremises as any)?.monthlyRentOrFee) ||
    0;

  const equipmentItems = Array.isArray(modEPremises?.equipmentItems)
    ? modEPremises.equipmentItems
    : [];
  const totalCapExEquipment = equipmentItems.reduce(
    (sum, item) => sum + (Number(item.totalCostExVat) || 0),
    0
  );

  const modEInsurance = plan.moduleEData?.permitsAndInsurance;
  const annualInsurance =
    Number(modEInsurance?.estimatedAnnualInsurancePremium) || 720;
  const monthlyInsuranceCost = Math.round(annualInsurance / 12);

  // 3. Module F: Founder Survival Budget & 3-Year Hiring Plan
  const modFStep3 = plan.moduleFData?.step3SurvivalBudgetData;
  const monthlyFounderDrawings = (() => {
    if (modFStep3?.founderBudgets?.length) {
      const sum = modFStep3.founderBudgets.reduce((acc, b) => {
        const core =
          (Number(b.housingAndUtilities) || 0) +
          (Number(b.groceriesAndEssentials) || 0) +
          (Number(b.transportAndCommute) || 0) +
          (Number(b.debtAndLoanCommitments) || 0) +
          (Number(b.dependentsAndFamily) || 0);
        return acc + Math.max(0, core - (Number(b.incomeOffsetCushion) || 0));
      }, 0);
      if (sum > 0) return Math.round(sum);
    }
    return isUK ? 2200 : 2500;
  })();

  const modFStep5 = plan.moduleFData?.step5HiringPlanData;
  const { y1Salaries, y2Salaries, y3Salaries } = (() => {
    let y1Ann = 0;
    let y2Ann = 0;
    let y3Ann = 0;
    if (modFStep5?.roles?.length) {
      for (const role of modFStep5.roles) {
        if (
          role.compensationModel === 'PURE_SWEAT_EQUITY' ||
          role.compensationModel === 'ADVISORY_EQUITY'
        ) {
          continue;
        }
        const gross = Number(role.grossAnnualSalary) || 0;
        if (role.yearScheduled <= 1) y1Ann += gross;
        if (role.yearScheduled <= 2) y2Ann += gross;
        if (role.yearScheduled <= 3) y3Ann += gross;
      }
    }
    const c1 = Number(modFStep5?.contractorBudgetYear1) || 0;
    const c2 = Number(modFStep5?.contractorBudgetYear2) || 0;
    const c3 = Number(modFStep5?.contractorBudgetYear3) || 0;

    return {
      y1Salaries: Math.round((y1Ann + c1) / 12),
      y2Salaries: Math.round((y2Ann + c2) / 12) || 3500,
      y3Salaries: Math.round((y3Ann + c3) / 12) || 7500,
    };
  })();

  // 4. Module H: Revenue, COGS & Export Share
  const modHStep2 = plan.moduleHData?.step2PricingTiers;
  const modHStep3 = plan.moduleHData?.step3BreakevenCalculator;
  const headlinePriceNet =
    Number(modHStep3?.activePriceSlider) ||
    Number(modHStep2?.blendedAveragePriceNet) ||
    49;
  const unitDirectCogs =
    Number(modHStep3?.frictionCosts?.directVariableCogsPerUnit) ||
    Math.max(2, Math.round(headlinePriceNet * 0.12));
  const targetCustomersY1 = Number(modHStep3?.activeCustomerSlider) || 120;
  const exportSharePercentFromModH =
    modHStep3?.exportSalesPercent !== undefined
      ? Number(modHStep3.exportSalesPercent)
      : plan.exportPotential === 'EXPORTING_INTERNATIONALLY'
      ? 40
      : 15;

  // 5. Module I: Marketing Budget (respecting Paid Ads Opt-Out)
  const modIBudget = plan.moduleIData?.step4Budget;
  const isPaidAdsOptedOutInModI = Boolean(
    modIBudget?.paidAdsViabilityDecision === 'OPTED_OUT_UNPROFITABLE' ||
      modIBudget?.excludePaidAdsFromModuleJ
  );

  const monthlyMarketingSpend = (() => {
    if (!modIBudget) return 250;
    if (Array.isArray(modIBudget.budgetLineItems) && modIBudget.budgetLineItems.length > 0) {
      return modIBudget.budgetLineItems.reduce((sum, item) => {
        if (isPaidAdsOptedOutInModI && item.bucket === 'PAID_MEDIA_ADS') {
          return sum;
        }
        return sum + (Number(item.monthlySpend) || 0);
      }, 0);
    }
    return isPaidAdsOptedOutInModI
      ? 100
      : Number(modIBudget.totalPlannedMonthlyMarketingSpend) || 250;
  })();

  return {
    monthlyTechStackCost,
    oneOffBuildCost,
    monthlyPremisesCost,
    monthlyInsuranceCost,
    totalCapExEquipment,
    monthlyFounderDrawings,
    monthlyTeamSalariesY1: y1Salaries,
    monthlyTeamSalariesY2: y2Salaries,
    monthlyTeamSalariesY3: y3Salaries,
    monthlyMarketingSpend,
    isPaidAdsOptedOutInModI,
    exportSharePercentFromModH,
    headlinePriceNet,
    unitDirectCogs,
    targetCustomersY1,
  };
}

export function buildDefaultOverheadItemsFromBaseline(
  baseline: UpstreamFinancialBaseline
): FinancialOverheadLineItem[] {
  return [
    {
      id: 'oh-premises-1',
      category: 'PREMISES_RENT_UTILITIES',
      plainEnglishLabel: 'Workspace, Co-Working or Rent & Utilities',
      accountantLabel: 'Premises Rent, Rates & Light/Heat',
      sourceModuleLabel:
        baseline.monthlyPremisesCost > 0
          ? 'Synced from Module E (Premises)'
          : 'Home-Office / Co-Working Baseline',
      monthlyCostYear1: baseline.monthlyPremisesCost,
      annualStepUpPercentYear2: 20,
      annualStepUpPercentYear3: 25,
      grantEligibilityTag: 'WORKING_CAPITAL_LOAN_ELIGIBLE',
      notes:
        baseline.monthlyPremisesCost > 0
          ? 'Commercial unit / hub cost imported from Module E.'
          : 'Home-based in Year 1; scales into co-working desks in Year 2.',
    },
    {
      id: 'oh-software-2',
      category: 'SOFTWARE_CLOUD_AI',
      plainEnglishLabel: 'Software, Website Hosting, Domain & AI Tools',
      accountantLabel: 'IT Infrastructure, SaaS Subscriptions & Cloud Hosting',
      sourceModuleLabel: 'Synced from Module D (Tech Stack)',
      monthlyCostYear1: baseline.monthlyTechStackCost,
      annualStepUpPercentYear2: 25,
      annualStepUpPercentYear3: 30,
      grantEligibilityTag: 'ELIGIBLE_INNOVATION_OR_EXPORT',
      notes: 'Core hosting, domain email, CRM, and software licences.',
    },
    {
      id: 'oh-marketing-3',
      category: 'MARKETING_GROWTH_EVENTS',
      plainEnglishLabel: baseline.isPaidAdsOptedOutInModI
        ? 'Organic Growth Tools & Trade Events (Paid Ads Opted Out)'
        : 'Monthly Marketing, Customer Acquisition & Events',
      accountantLabel: 'Marketing, Promotional & Customer Acquisition OpEx',
      sourceModuleLabel: 'Synced from Module I (Marketing Budget)',
      monthlyCostYear1: baseline.monthlyMarketingSpend,
      annualStepUpPercentYear2: 35,
      annualStepUpPercentYear3: 40,
      grantEligibilityTag: 'WORKING_CAPITAL_LOAN_ELIGIBLE',
      notes: baseline.isPaidAdsOptedOutInModI
        ? 'Paid ads formally excluded per Module I unit-economics guardrail; reflects organic outreach tools only.'
        : 'Imported from Module I Step 4 Marketing Budget.',
    },
    {
      id: 'oh-accounting-4',
      category: 'ACCOUNTING_LEGAL_COMPLIANCE',
      plainEnglishLabel: 'Bookkeeping Software, Accountant & Annual Filings',
      accountantLabel: 'Audit, Accounting, CRO/Companies House & Legal Fees',
      sourceModuleLabel: 'Synced from Module G (Launchpad)',
      monthlyCostYear1: 140,
      annualStepUpPercentYear2: 15,
      annualStepUpPercentYear3: 20,
      grantEligibilityTag: 'INELIGIBLE_ROUTINE_OPEX',
      notes: 'Cloud bookkeeping (Xero/QuickBooks) + annual statutory tax return provision.',
    },
    {
      id: 'oh-insurance-5',
      category: 'INSURANCE_STATUTORY',
      plainEnglishLabel: 'Startup Business & Liability Insurance',
      accountantLabel: 'Commercial Public, Employers, PI & Cyber Insurance',
      sourceModuleLabel: 'Synced from Module E (Compliance)',
      monthlyCostYear1: baseline.monthlyInsuranceCost,
      annualStepUpPercentYear2: 15,
      annualStepUpPercentYear3: 15,
      grantEligibilityTag: 'INELIGIBLE_ROUTINE_OPEX',
      notes: 'Monthly equivalent of annual Public/Product/Professional Indemnity policy.',
    },
    {
      id: 'oh-travel-6',
      category: 'TRAVEL_ADMIN_SUNDRIES',
      plainEnglishLabel: 'Customer Visits, Phone & General Admin',
      accountantLabel: 'Travel, Subsistence, Telecoms & Sundry Admin',
      sourceModuleLabel: 'Industry Standard Benchmark',
      monthlyCostYear1: 90,
      annualStepUpPercentYear2: 20,
      annualStepUpPercentYear3: 20,
      grantEligibilityTag: 'WORKING_CAPITAL_LOAN_ELIGIBLE',
      notes: 'Client discovery meetings, mobile data, and minor office sundries.',
    },
  ];
}

export function ModuleJWorkspace({
  plan,
  selectedCountry,
  isVaultReadonly = false,
  onSaveStep1OverheadsTax,
  onSaveStep2WorkingCapital,
  onSaveStep3CashflowGap,
  onSaveStep4Statements,
  onSaveStep5Brief,
  onBackToModuleI,
  onContinueToModuleK,
  onNavigateToModule,
  initialStep,
  highlightTarget,
}: ModuleJWorkspaceProps) {
  const effectiveCountry = (selectedCountry || plan.hqCountryCode || 'IE').toUpperCase();
  const isUK = effectiveCountry === 'GB' || effectiveCountry === 'UK';
  const currencyCode = plan.baseCurrency || (isUK ? 'GBP' : 'EUR');
  const currencySymbol =
    currencyCode === 'GBP' ? '£' : currencyCode === 'USD' ? '$' : '€';

  const upstreamBaseline = useMemo(
    () => resolveUpstreamFinancialBaseline(plan, effectiveCountry),
    [plan, effectiveCountry]
  );

  // Step open/collapse state (Strict GEMINI.md Rule 6)
  const [openStep, setOpenStep] = useState<number | 'ALL'>(initialStep || 1);
  const [activeWhyCard, setActiveWhyCard] = useState<number | null>(null);
  const [activeExampleCard, setActiveExampleCard] = useState<number | null>(null);
  const [showAccountingPartnerDrawer, setShowAccountingPartnerDrawer] = useState(false);

  // Autosave and dirty state tracking refs
  const isFirstRenderStep1Ref = useRef(true);
  const isDirtyStep1Ref = useRef(false);
  const isFirstRenderStep2Ref = useRef(true);
  const isDirtyStep2Ref = useRef(false);
  const isFirstRenderStep3Ref = useRef(true);
  const isDirtyStep3Ref = useRef(false);
  const isFirstRenderStep4Ref = useRef(true);
  const isDirtyStep4Ref = useRef(false);
  const isFirstRenderStep5Ref = useRef(true);
  const isDirtyStep5Ref = useRef(false);

  // Step 1 State
  const [step1Data, setStep1Data] = useState<FinancialOverheadsTaxStep1Data>(() => {
    const existing = plan.moduleJData?.step1OverheadsTax;
    if (existing && Array.isArray(existing.overheadLineItems) && existing.overheadLineItems.length > 0) {
      return existing;
    }

    return {
      viewLanguageMode: 'PLAIN_ENGLISH_FOUNDER',
      operatingCostPosture:
        upstreamBaseline.monthlyPremisesCost > 400
          ? 'COMMERCIAL_PREMISES_TEAM'
          : upstreamBaseline.monthlyPremisesCost > 0
          ? 'HYBRID_COWORKING_GROWTH'
          : 'BOOTSTRAPPED_HOME_LEAN',
      otherOperatingCostPostureText: '',
      overheadLineItems: buildDefaultOverheadItemsFromBaseline(upstreamBaseline),
      monthlyFounderDrawingsYear1: upstreamBaseline.monthlyFounderDrawings,
      monthlyTeamSalariesYear1: upstreamBaseline.monthlyTeamSalariesY1,
      monthlyTeamSalariesYear2: upstreamBaseline.monthlyTeamSalariesY2,
      monthlyTeamSalariesYear3: upstreamBaseline.monthlyTeamSalariesY3,
      autoApplyEmployerPayrollTax: true,
      employerPayrollTaxRatePercent: isUK ? 16.8 : 11.15, // UK 13.8% NIC + 3% Pension vs IE 11.15% PRSI
      corporationTaxRatePercent: isUK ? 19.0 : 12.5,
      vatRegistrationStrategy:
        upstreamBaseline.totalCapExEquipment > 2000
          ? 'REGISTERED_FROM_DAY_1'
          : 'REGISTER_AT_THRESHOLD',
      otherVatRegistrationStrategyText: '',
      standardVatRatePercent: isUK ? 20.0 : 23.0,
      exportRevenueSharePercent: upstreamBaseline.exportSharePercentFromModH,
      exportTargetMarketsSummary: isUK
        ? 'Ireland, EU Single Market & North America'
        : 'United Kingdom, Eurozone & US',
      totalCapExEquipmentValue: upstreamBaseline.totalCapExEquipment,
      capExDepreciationYears: 3,
      overheadsAndTaxNarrative: '',
      grantAssessorTip: '',
      lastSyncedFromUpstreamAt: new Date().toISOString(),
    };
  });

  useEffect(() => {
    if (initialStep) {
      setOpenStep(initialStep);
    }
    if (highlightTarget && typeof document !== 'undefined') {
      setTimeout(() => {
        const el = document.getElementById(highlightTarget);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 220);
    }
  }, [initialStep, highlightTarget]);

  const isPlainMode = step1Data.viewLanguageMode === 'PLAIN_ENGLISH_FOUNDER';

  // Live Step 1 Derived Financial Calculations
  const step1Metrics = useMemo(() => {
    const monthlyFixedOpExY1 = step1Data.overheadLineItems.reduce(
      (sum, item) => sum + (Number(item.monthlyCostYear1) || 0),
      0
    );
    const monthlyFixedOpExY2 = step1Data.overheadLineItems.reduce((sum, item) => {
      const base = Number(item.monthlyCostYear1) || 0;
      const stepUp = Number(item.annualStepUpPercentYear2) || 0;
      return sum + Math.round(base * (1 + stepUp / 100));
    }, 0);
    const monthlyFixedOpExY3 = step1Data.overheadLineItems.reduce((sum, item) => {
      const base = Number(item.monthlyCostYear1) || 0;
      const stepUp2 = Number(item.annualStepUpPercentYear2) || 0;
      const stepUp3 = Number(item.annualStepUpPercentYear3) || 0;
      const y2 = base * (1 + stepUp2 / 100);
      return sum + Math.round(y2 * (1 + stepUp3 / 100));
    }, 0);

    const taxRate = step1Data.autoApplyEmployerPayrollTax
      ? Number(step1Data.employerPayrollTaxRatePercent) || 0
      : 0;

    const monthlyEmployerTaxY1 = Math.round(
      ((Number(step1Data.monthlyTeamSalariesYear1) || 0) * taxRate) / 100
    );
    const monthlyEmployerTaxY2 = Math.round(
      ((Number(step1Data.monthlyTeamSalariesYear2) || 0) * taxRate) / 100
    );
    const monthlyEmployerTaxY3 = Math.round(
      ((Number(step1Data.monthlyTeamSalariesYear3) || 0) * taxRate) / 100
    );

    const totalMonthlyPayrollAndDrawingsY1 =
      (Number(step1Data.monthlyFounderDrawingsYear1) || 0) +
      (Number(step1Data.monthlyTeamSalariesYear1) || 0) +
      monthlyEmployerTaxY1;

    const totalMonthlyBurnY1 = monthlyFixedOpExY1 + totalMonthlyPayrollAndDrawingsY1;
    const annualCapExDepreciation =
      step1Data.totalCapExEquipmentValue > 0 && step1Data.capExDepreciationYears > 0
        ? Math.round(step1Data.totalCapExEquipmentValue / step1Data.capExDepreciationYears)
        : 0;

    const estimatedAnnualRevenueY1 =
      upstreamBaseline.headlinePriceNet * upstreamBaseline.targetCustomersY1 * 12;
    const vatThresholdAmount = isUK ? 90000 : 42500;
    const crossesVatThresholdY1 = estimatedAnnualRevenueY1 >= vatThresholdAmount;

    return {
      monthlyFixedOpExY1,
      monthlyFixedOpExY2,
      monthlyFixedOpExY3,
      monthlyEmployerTaxY1,
      monthlyEmployerTaxY2,
      monthlyEmployerTaxY3,
      totalMonthlyPayrollAndDrawingsY1,
      totalMonthlyBurnY1,
      annualCapExDepreciation,
      estimatedAnnualRevenueY1,
      vatThresholdAmount,
      crossesVatThresholdY1,
    };
  }, [step1Data, upstreamBaseline, isUK]);

  const isStep1Complete = Boolean(
    step1Data.overheadLineItems.length > 0 &&
      step1Data.overheadsAndTaxNarrative.trim().length >= 25
  );

  // ---------------------------------------------------------------------------
  // STEP 2 STATE: PAYMENT TIMING, WORKING CAPITAL & SEASONALITY
  // ---------------------------------------------------------------------------
  const [step2Data, setStep2Data] = useState<WorkingCapitalTimingStep2Data>(() => {
    const existing = plan.moduleJData?.step2WorkingCapital;
    if (existing && existing.customerCollectionTiming) {
      return existing;
    }

    const isPhysical =
      (plan.industryCategory || '').toLowerCase().includes('food') ||
      (plan.industryCategory || '').toLowerCase().includes('retail') ||
      (plan.industryCategory || '').toLowerCase().includes('hardware') ||
      upstreamBaseline.totalCapExEquipment > 3000;

    const isB2B =
      (plan.industryCategory || '').toLowerCase().includes('b2b') ||
      (plan.industryCategory || '').toLowerCase().includes('saas') ||
      (plan.industryCategory || '').toLowerCase().includes('enterprise');

    return {
      customerCollectionTiming: isB2B ? 'NET_30_STANDARD_B2B' : 'INSTANT_CARD_STRIPE_0',
      otherCustomerCollectionTimingText: '',
      customDebtorDays: 45,
      inventoryStockTiming: isPhysical
        ? 'PAY_ON_DELIVERY_30_DAYS'
        : 'NO_PHYSICAL_STOCK_DIGITAL',
      otherInventoryStockTimingText: '',
      upfrontStockMonthsBuffer: isPhysical ? 2 : 0,
      seasonalityRampCurve: isPhysical ? 'Q4_RETAIL_GIFTING_PEAK' : 'STEADY_LINEAR_RAMP',
      otherSeasonalityRampCurveText: '',
      monthToStartRevenue: upstreamBaseline.oneOffBuildCost > 5000 ? 2 : 1,
      workingCapitalNarrative: '',
      grantAssessorTip: '',
    };
  });

  const [saveStatusStep2, setSaveStatusStep2] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isGeneratingAiStep2, setIsGeneratingAiStep2] = useState(false);
  const [aiMessageStep2, setAiMessageStep2] = useState<string | null>(null);
  const [parkingQuestionStep2, setParkingQuestionStep2] = useState('');
  const [isParkingStep2, setIsParkingStep2] = useState(false);
  const [parkedSuccessStep2, setParkedSuccessStep2] = useState(false);

  // Live Step 2 Derived Working Capital & 12-Month Invoiced vs. Bank Cash Schedule
  const step2Metrics = useMemo(() => {
    const collectionOpt =
      COLLECTION_TIMING_OPTIONS.find((c) => c.id === step2Data.customerCollectionTiming) ||
      COLLECTION_TIMING_OPTIONS[0];
    const effectiveDebtorDays =
      step2Data.customerCollectionTiming === 'OTHER'
        ? Math.max(0, Math.min(120, Number(step2Data.customDebtorDays) || 45))
        : collectionOpt.debtorDays;

    const rampOpt =
      SEASONALITY_RAMP_OPTIONS.find((r) => r.id === step2Data.seasonalityRampCurve) ||
      SEASONALITY_RAMP_OPTIONS[0];

    const avgMonthlyTargetCustomers = Math.max(1, upstreamBaseline.targetCustomersY1);
    const netPrice = Math.max(1, upstreamBaseline.headlinePriceNet);
    const unitCogs = Math.max(0, upstreamBaseline.unitDirectCogs);
    const startMonth = Math.max(1, Math.min(12, Number(step2Data.monthToStartRevenue) || 1));

    // Build Month 1..12 Invoiced Revenue vs. Actual Cash Collected in Bank
    const monthlySchedule: Array<{
      month: number;
      customers: number;
      invoicedRevenue: number;
      cashCollected: number;
      directCogsOutflow: number;
    }> = [];

    for (let m = 1; m <= 12; m++) {
      if (m < startMonth) {
        monthlySchedule.push({
          month: m,
          customers: 0,
          invoicedRevenue: 0,
          cashCollected: 0,
          directCogsOutflow: 0,
        });
        continue;
      }
      const weight = rampOpt.monthlyWeights[m - 1] ?? 1.0;
      const customers = Math.max(1, Math.round(avgMonthlyTargetCustomers * weight));
      const invoicedRevenue = Math.round(customers * netPrice);
      const directCogsOutflow = Math.round(customers * unitCogs);
      monthlySchedule.push({
        month: m,
        customers,
        invoicedRevenue,
        cashCollected: 0, // populated next based on debtor lag
        directCogsOutflow,
      });
    }

    // Apply debtor lag (0, 15, 30, 60, or custom days) across Month 1..12
    const monthShiftFloat = effectiveDebtorDays / 30;
    const wholeMonthsDelay = Math.floor(monthShiftFloat);
    const fractionalRemainder = monthShiftFloat - wholeMonthsDelay;

    for (let i = 0; i < 12; i++) {
      const sameShiftIdx = i - wholeMonthsDelay;
      const prevShiftIdx = i - wholeMonthsDelay - 1;
      const fromSameShift =
        sameShiftIdx >= 0 ? monthlySchedule[sameShiftIdx].invoicedRevenue * (1 - fractionalRemainder) : 0;
      const fromPrevShift =
        prevShiftIdx >= 0 ? monthlySchedule[prevShiftIdx].invoicedRevenue * fractionalRemainder : 0;
      monthlySchedule[i].cashCollected = Math.round(fromSameShift + fromPrevShift);
    }

    const totalInvoicedY1 = monthlySchedule.reduce((s, r) => s + r.invoicedRevenue, 0);
    const totalCashCollectedY1 = monthlySchedule.reduce((s, r) => s + r.cashCollected, 0);
    const yearEndUnpaidInvoicesAR = Math.max(0, totalInvoicedY1 - totalCashCollectedY1);
    const year1CashCollectionEfficiencyPercent =
      totalInvoicedY1 > 0 ? Math.round((totalCashCollectedY1 / totalInvoicedY1) * 100) : 100;

    // Upfront inventory cash lockup + pre-revenue burn lockup
    const avgMonthlyCogsY1 = Math.round(
      monthlySchedule.reduce((s, r) => s + r.directCogsOutflow, 0) / 12
    );
    const upfrontStockCashLockup =
      step2Data.inventoryStockTiming === 'NO_PHYSICAL_STOCK_DIGITAL'
        ? 0
        : Math.round(avgMonthlyCogsY1 * Math.max(0, Number(step2Data.upfrontStockMonthsBuffer) || 0));

    const preRevenueMonthsCount = Math.max(0, startMonth - 1);
    const preRevenueBurnLockup = preRevenueMonthsCount * step1Metrics.totalMonthlyBurnY1;

    // Peak debtor lockup at peak month
    const avgMonthlyInvoiced = Math.round(totalInvoicedY1 / 12);
    const debtorCashLockup = Math.round(avgMonthlyInvoiced * (effectiveDebtorDays / 30));

    const peakWorkingCapitalLockup =
      debtorCashLockup + upfrontStockCashLockup + preRevenueBurnLockup;

    return {
      effectiveDebtorDays,
      monthlySchedule,
      totalInvoicedY1,
      totalCashCollectedY1,
      yearEndUnpaidInvoicesAR,
      year1CashCollectionEfficiencyPercent,
      upfrontStockCashLockup,
      preRevenueMonthsCount,
      preRevenueBurnLockup,
      debtorCashLockup,
      peakWorkingCapitalLockup,
    };
  }, [step2Data, upstreamBaseline, step1Metrics]);

  const isStep2Complete = Boolean(
    step2Data.customerCollectionTiming &&
      step2Data.workingCapitalNarrative.trim().length >= 25
  );

  // ---------------------------------------------------------------------------
  // STEP 3 STATE: 36-MONTH CASHFLOW CURVE, CASH TROUGH & GRANT BRIDGE
  // ---------------------------------------------------------------------------
  const [step3Data, setStep3Data] = useState<CashflowFundingGapStep3Data>(() => {
    const existing = plan.moduleJData?.step3CashflowGap;
    if (existing && Array.isArray(existing.fundingSources) && existing.fundingSources.length > 0) {
      return {
        primaryFundingStrategy: existing.primaryFundingStrategy || 'GRANT_PLUS_MATCH_FUNDING',
        otherPrimaryFundingStrategyText: existing.otherPrimaryFundingStrategyText || '',
        ...existing,
      };
    }

    const defaultTarget = Math.max(
      15000,
      step2Metrics.peakWorkingCapitalLockup + step1Metrics.totalMonthlyBurnY1 * 3 + step1Data.totalCapExEquipmentValue
    );

    return {
      primaryFundingStrategy: 'GRANT_PLUS_MATCH_FUNDING',
      otherPrimaryFundingStrategyText: '',
      startingCashBalanceDay1: isUK ? 3500 : 4000,
      safetyBufferPercent: 20,
      fundingSources: buildDefaultFundingSourcesForCountry(isUK, defaultTarget),
      loanInterestRatePercent: isUK ? 6.0 : 6.8, // UK Start Up Loan 6% vs IE Microfinance Ireland ~6.8%
      loanTermMonths: 36,
      fundingGapNarrative: '',
      grantAssessorTip: '',
    };
  });

  const [saveStatusStep3, setSaveStatusStep3] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isGeneratingAiStep3, setIsGeneratingAiStep3] = useState(false);
  const [aiMessageStep3, setAiMessageStep3] = useState<string | null>(null);
  const [parkingQuestionStep3, setParkingQuestionStep3] = useState('');
  const [isParkingStep3, setIsParkingStep3] = useState(false);
  const [parkedSuccessStep3, setParkedSuccessStep3] = useState(false);
  const [showQuarterlyTableStep3, setShowQuarterlyTableStep3] = useState(false);
  const [showBankingPartnerDrawerStep3, setShowBankingPartnerDrawerStep3] = useState(false);

  // Live Step 3 Derived 36-Month Cashflow Curve, Cash Trough & Grant Reimbursement Bridge
  const step3Metrics = useMemo(() => {
    const rampOpt =
      SEASONALITY_RAMP_OPTIONS.find((r) => r.id === step2Data.seasonalityRampCurve) ||
      SEASONALITY_RAMP_OPTIONS[0];

    const avgY1Customers = Math.max(1, upstreamBaseline.targetCustomersY1);
    const avgY2Customers = Math.max(avgY1Customers + 5, Math.round(avgY1Customers * 1.65));
    const avgY3Customers = Math.max(avgY2Customers + 10, Math.round(avgY1Customers * 2.45));
    const netPrice = Math.max(1, upstreamBaseline.headlinePriceNet);
    const unitCogs = Math.max(0, upstreamBaseline.unitDirectCogs);
    const startMonth = Math.max(1, Math.min(12, Number(step2Data.monthToStartRevenue) || 1));

    // 1. Build 36 months of invoiced revenue and direct COGS
    const rawMonths: Array<{
      month: number;
      year: 1 | 2 | 3;
      quarter: number;
      invoicedRevenue: number;
      cashCollected: number;
      directCogsOutflow: number;
      fixedOpExAndPayrollOutflow: number;
      oneOffCapExAndStockOutflow: number;
      loanRepaymentOutflow: number;
      upfrontFundingInflow: number;
      grantReimbursementInflow: number;
      netOperatingCashflow: number;
      operatingCashBalance: number;
      fundedBankBalance: number;
    }> = [];

    for (let m = 1; m <= 36; m++) {
      const year: 1 | 2 | 3 = m <= 12 ? 1 : m <= 24 ? 2 : 3;
      const quarter = Math.ceil(m / 3);
      const monthIdxInYear = (m - 1) % 12;
      const weight = rampOpt.monthlyWeights[monthIdxInYear] ?? 1.0;

      const baseCustomers =
        year === 1 ? avgY1Customers : year === 2 ? avgY2Customers : avgY3Customers;
      const customers = m < startMonth ? 0 : Math.max(1, Math.round(baseCustomers * weight));
      const invoicedRevenue = Math.round(customers * netPrice);
      const directCogsOutflow = Math.round(customers * unitCogs);

      const fixedOpExAndPayrollOutflow =
        year === 1
          ? step1Metrics.totalMonthlyBurnY1
          : year === 2
          ? step1Metrics.monthlyFixedOpExY2 +
            (Number(step1Data.monthlyFounderDrawingsYear1) || 0) +
            (Number(step1Data.monthlyTeamSalariesYear2) || 0) +
            step1Metrics.monthlyEmployerTaxY2
          : step1Metrics.monthlyFixedOpExY3 +
            (Number(step1Data.monthlyFounderDrawingsYear1) || 0) +
            (Number(step1Data.monthlyTeamSalariesYear3) || 0) +
            step1Metrics.monthlyEmployerTaxY3;

      const oneOffCapExAndStockOutflow =
        m === 1
          ? (Number(step1Data.totalCapExEquipmentValue) || 0) +
            step2Metrics.upfrontStockCashLockup
          : 0;

      rawMonths.push({
        month: m,
        year,
        quarter,
        invoicedRevenue,
        cashCollected: 0,
        directCogsOutflow,
        fixedOpExAndPayrollOutflow,
        oneOffCapExAndStockOutflow,
        loanRepaymentOutflow: 0,
        upfrontFundingInflow: 0,
        grantReimbursementInflow: 0,
        netOperatingCashflow: 0,
        operatingCashBalance: 0,
        fundedBankBalance: 0,
      });
    }

    // 2. Apply Debtor Days Lag across all 36 months
    const monthShiftFloat = step2Metrics.effectiveDebtorDays / 30;
    const wholeMonthsDelay = Math.floor(monthShiftFloat);
    const fractionalRemainder = monthShiftFloat - wholeMonthsDelay;

    for (let i = 0; i < 36; i++) {
      const sameIdx = i - wholeMonthsDelay;
      const prevIdx = i - wholeMonthsDelay - 1;
      const fromSame =
        sameIdx >= 0 ? rawMonths[sameIdx].invoicedRevenue * (1 - fractionalRemainder) : 0;
      const fromPrev =
        prevIdx >= 0 ? rawMonths[prevIdx].invoicedRevenue * fractionalRemainder : 0;
      rawMonths[i].cashCollected = Math.round(fromSame + fromPrev);
    }

    // 3. Calculate Capital Stack totals & Monthly Loan Repayment
    const totalLoanPrincipal = step3Data.fundingSources
      .filter((s) => s.sourceType === 'STARTUP_LOAN_MICROFINANCE')
      .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

    const monthlyRate = (Number(step3Data.loanInterestRatePercent) || 6) / 100 / 12;
    const termMonths = Math.max(12, Number(step3Data.loanTermMonths) || 36);
    const monthlyLoanRepayment =
      totalLoanPrincipal > 0
        ? monthlyRate > 0
          ? Math.round(
              (totalLoanPrincipal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termMonths))
            )
          : Math.round(totalLoanPrincipal / termMonths)
        : 0;

    const upfrontNonArrearsFunding = step3Data.fundingSources
      .filter((s) => !s.isReimbursementArrears)
      .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

    const reimbursedGrantSources = step3Data.fundingSources.filter(
      (s) => s.isReimbursementArrears && (Number(s.amount) || 0) > 0
    );
    const reimbursedGrantTotal = reimbursedGrantSources.reduce(
      (sum, s) => sum + (Number(s.amount) || 0),
      0
    );
    const maxGrantLagMonths = reimbursedGrantSources.reduce(
      (maxLag, s) => Math.max(maxLag, Number(s.reimbursementLagMonths) || 3),
      reimbursedGrantSources.length > 0 ? 3 : 0
    );

    // Schedule Grant Reimbursements across claim tranches (50% at 1 + lag, 50% at 4 + lag)
    for (const gSource of reimbursedGrantSources) {
      const amt = Number(gSource.amount) || 0;
      const lag = Math.max(1, Math.min(12, Number(gSource.reimbursementLagMonths) || 3));
      const tranche1MonthIdx = Math.min(35, lag); // e.g. lag=3 -> index 3 (Month 4)
      const tranche2MonthIdx = Math.min(35, lag + 3); // e.g. lag=3 -> index 6 (Month 7)
      const t1 = Math.round(amt * 0.5);
      const t2 = amt - t1;
      rawMonths[tranche1MonthIdx].grantReimbursementInflow += t1;
      rawMonths[tranche2MonthIdx].grantReimbursementInflow += t2;
    }

    // 4. Compute Cumulative Operating Cash Balance vs. Funded Bank Balance
    let runningOperatingCash = 0;
    let runningFundedBank = Number(step3Data.startingCashBalanceDay1) || 0;

    let operatingCashTroughAmount = 0;
    let operatingCashTroughMonth = 1;
    let lowestFundedBankBalance = runningFundedBank;
    let lowestFundedMonth = 1;
    let cashflowPositiveMonth: number | null = null;

    for (let i = 0; i < 36; i++) {
      const row = rawMonths[i];
      if (i === 0) {
        row.upfrontFundingInflow = upfrontNonArrearsFunding;
      }
      row.loanRepaymentOutflow = i < termMonths ? monthlyLoanRepayment : 0;

      const totalOutflowBeforeDebt =
        row.directCogsOutflow +
        row.fixedOpExAndPayrollOutflow +
        row.oneOffCapExAndStockOutflow;

      row.netOperatingCashflow = row.cashCollected - totalOutflowBeforeDebt;
      runningOperatingCash += row.netOperatingCashflow;
      row.operatingCashBalance = runningOperatingCash;

      if (runningOperatingCash < operatingCashTroughAmount) {
        operatingCashTroughAmount = runningOperatingCash;
        operatingCashTroughMonth = row.month;
      }

      if (
        cashflowPositiveMonth === null &&
        row.month >= startMonth &&
        row.netOperatingCashflow > 0
      ) {
        cashflowPositiveMonth = row.month;
      }

      const netFundedDelta =
        row.netOperatingCashflow -
        row.loanRepaymentOutflow +
        row.upfrontFundingInflow +
        row.grantReimbursementInflow;

      runningFundedBank += netFundedDelta;
      row.fundedBankBalance = runningFundedBank;

      if (runningFundedBank < lowestFundedBankBalance || i === 0) {
        lowestFundedBankBalance = runningFundedBank;
        lowestFundedMonth = row.month;
      }
    }

    const safetyMult = 1 + Math.max(0, Number(step3Data.safetyBufferPercent) || 20) / 100;
    const rawTroughDepth = Math.abs(Math.min(0, operatingCashTroughAmount));
    const recommendedCapitalRaise =
      rawTroughDepth > 0
        ? Math.ceil((rawTroughDepth * safetyMult) / 500) * 500
        : Math.max(5000, step1Metrics.totalMonthlyBurnY1 * 3);

    const totalStackedFunding =
      (Number(step3Data.startingCashBalanceDay1) || 0) +
      upfrontNonArrearsFunding +
      reimbursedGrantTotal;

    const fundingSurplusOrDeficit = totalStackedFunding - recommendedCapitalRaise;

    // Aggregate into 12 Quarters (Q1..Q12) for visual chart and table
    const quarterlySchedule: Array<{
      quarterIndex: number;
      label: string;
      yearLabel: string;
      cashInflow: number;
      operatingOutflow: number;
      grantAndFundingInflow: number;
      endingOperatingCash: number;
      endingFundedBankBalance: number;
    }> = [];

    for (let q = 1; q <= 12; q++) {
      const qMonths = rawMonths.slice((q - 1) * 3, q * 3);
      const lastM = qMonths[qMonths.length - 1];
      quarterlySchedule.push({
        quarterIndex: q,
        label: `Q${q}`,
        yearLabel: `Y${Math.ceil(q / 4)} Q${((q - 1) % 4) + 1}`,
        cashInflow: qMonths.reduce((s, r) => s + r.cashCollected, 0),
        operatingOutflow: qMonths.reduce(
          (s, r) =>
            s +
            r.directCogsOutflow +
            r.fixedOpExAndPayrollOutflow +
            r.oneOffCapExAndStockOutflow +
            r.loanRepaymentOutflow,
          0
        ),
        grantAndFundingInflow: qMonths.reduce(
          (s, r) => s + r.upfrontFundingInflow + r.grantReimbursementInflow,
          0
        ),
        endingOperatingCash: lastM.operatingCashBalance,
        endingFundedBankBalance: lastM.fundedBankBalance,
      });
    }

    return {
      months36: rawMonths,
      quarterlySchedule,
      operatingCashTroughAmount,
      operatingCashTroughMonth,
      recommendedCapitalRaise,
      totalStackedFunding,
      upfrontNonArrearsFunding,
      reimbursedGrantTotal,
      maxGrantLagMonths,
      monthlyLoanRepayment,
      lowestFundedBankBalance,
      lowestFundedMonth,
      endingBankBalanceM36: rawMonths[35]?.fundedBankBalance || 0,
      cashflowPositiveMonth,
      fundingSurplusOrDeficit,
    };
  }, [step3Data, step2Data, step2Metrics, step1Data, step1Metrics, upstreamBaseline]);

  const isStep3Complete = Boolean(
    step3Data.fundingSources.length > 0 &&
      step3Data.fundingGapNarrative.trim().length >= 25
  );

  // ---------------------------------------------------------------------------
  // STEP 4 STATE: OFFICIAL 3-YEAR P&L, 36-MONTH CASHFLOW, STRESS-TEST & IP SHIELD
  // ---------------------------------------------------------------------------
  const [step4Data, setStep4Data] = useState<StatementsStressTestStep4Data>(() => {
    const existing = plan.moduleJData?.step4Statements;
    if (existing && existing.activeStressScenario) {
      return {
        corporateIpReadinessStatus:
          existing.corporateIpReadinessStatus || 'INCORPORATION_IN_PROGRESS',
        otherCorporateIpReadinessStatusText:
          existing.otherCorporateIpReadinessStatusText || '',
        customRevenueHaircutPercent: existing.customRevenueHaircutPercent ?? 15,
        customCostInflationPercent: existing.customCostInflationPercent ?? 10,
        customDelayMonths: existing.customDelayMonths ?? 1,
        ...existing,
      };
    }

    const modGStep1 = plan.moduleGData?.step1;
    const modGStep6 = plan.moduleGData?.step6;
    const defaultIpStatus: CorporateIpReadinessStatusType =
      modGStep1?.state === 'ALREADY_HAVE' && modGStep6?.hasIpAssignmentSigned
        ? 'LTD_INCORPORATED_IP_ASSIGNED'
        : modGStep1?.legalStructure === 'SOLE_TRADER'
        ? 'SOLE_TRADER_PRE_INCORPORATION'
        : 'INCORPORATION_IN_PROGRESS';

    return {
      activeStressScenario: 'BASE_CASE_OFFICIAL',
      otherStressScenarioText: '',
      customRevenueHaircutPercent: 15,
      customCostInflationPercent: 10,
      customDelayMonths: 1,
      corporateIpReadinessStatus: defaultIpStatus,
      otherCorporateIpReadinessStatusText: '',
      writtenFinancialAssumptionsBlock: '',
      corporateIpPlaceholderNotes:
        'All software, brand assets, and background IP created by the promoters will be formally assigned to the company prior to grant drawdown.',
      grantAssessorTip: '',
    };
  });

  const [saveStatusStep4, setSaveStatusStep4] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle');
  const [isGeneratingAiStep4, setIsGeneratingAiStep4] = useState(false);
  const [aiMessageStep4, setAiMessageStep4] = useState<string | null>(null);
  const [parkingQuestionStep4, setParkingQuestionStep4] = useState('');
  const [isParkingStep4, setIsParkingStep4] = useState(false);
  const [parkedSuccessStep4, setParkedSuccessStep4] = useState(false);
  const [cashflowGranularityStep4, setCashflowGranularityStep4] = useState<
    'ANNUAL_3YR' | 'QUARTERLY_12Q' | 'MONTHLY_36M'
  >('QUARTERLY_12Q');
  const [showCorporateIpPartnerDrawerStep4, setShowCorporateIpPartnerDrawerStep4] =
    useState(false);

  // Live Step 4 Derived 3-Year P&L Statement & Stress-Tested 36-Month Cashflow
  const step4Metrics = useMemo(() => {
    const scenarioPreset =
      STRESS_SCENARIO_OPTIONS.find((s) => s.id === step4Data.activeStressScenario) ||
      STRESS_SCENARIO_OPTIONS[0];

    const effectiveRevHaircutPct =
      step4Data.activeStressScenario === 'OTHER'
        ? Math.max(0, Math.min(80, Number(step4Data.customRevenueHaircutPercent) || 0))
        : scenarioPreset.revenueHaircutPercent;

    const effectiveCostInflationPct =
      step4Data.activeStressScenario === 'OTHER'
        ? Math.max(0, Math.min(100, Number(step4Data.customCostInflationPercent) || 0))
        : scenarioPreset.costInflationPercent;

    const effectiveDelayMonths =
      step4Data.activeStressScenario === 'OTHER'
        ? Math.max(0, Math.min(12, Number(step4Data.customDelayMonths) || 0))
        : scenarioPreset.delayMonths;

    const revMultiplier = Math.max(0.1, 1 - effectiveRevHaircutPct / 100);
    const costMultiplier = 1 + effectiveCostInflationPct / 100;

    const rampOpt =
      SEASONALITY_RAMP_OPTIONS.find((r) => r.id === step2Data.seasonalityRampCurve) ||
      SEASONALITY_RAMP_OPTIONS[0];

    const avgY1Customers = Math.max(1, upstreamBaseline.targetCustomersY1);
    const avgY2Customers = Math.max(avgY1Customers + 5, Math.round(avgY1Customers * 1.65));
    const avgY3Customers = Math.max(avgY2Customers + 10, Math.round(avgY1Customers * 2.45));
    const netPrice = Math.max(1, upstreamBaseline.headlinePriceNet);
    const unitCogs = Math.max(0, upstreamBaseline.unitDirectCogs);
    const baseStartMonth = Math.max(
      1,
      Math.min(12, Number(step2Data.monthToStartRevenue) || 1)
    );
    const stressedStartMonth = Math.min(24, baseStartMonth + effectiveDelayMonths);

    const stressedMonths: Array<{
      month: number;
      year: 1 | 2 | 3;
      quarter: number;
      invoicedRevenue: number;
      cashCollected: number;
      directCogsOutflow: number;
      fixedOpExOutflow: number;
      payrollAndTaxOutflow: number;
      oneOffCapExAndStockOutflow: number;
      loanRepaymentOutflow: number;
      upfrontFundingInflow: number;
      grantReimbursementInflow: number;
      netOperatingCashflow: number;
      fundedBankBalance: number;
    }> = [];

    for (let m = 1; m <= 36; m++) {
      const year: 1 | 2 | 3 = m <= 12 ? 1 : m <= 24 ? 2 : 3;
      const quarter = Math.ceil(m / 3);
      const monthIdxInYear = (m - 1) % 12;
      const weight = rampOpt.monthlyWeights[monthIdxInYear] ?? 1.0;

      const baseCustomers =
        year === 1 ? avgY1Customers : year === 2 ? avgY2Customers : avgY3Customers;
      const rawCustomers =
        m < stressedStartMonth
          ? 0
          : Math.max(1, Math.round(baseCustomers * weight * revMultiplier));

      const invoicedRevenue = Math.round(rawCustomers * netPrice);
      const directCogsOutflow = Math.round(rawCustomers * unitCogs * costMultiplier);

      const baseFixedOpEx =
        year === 1
          ? step1Metrics.monthlyFixedOpExY1
          : year === 2
          ? step1Metrics.monthlyFixedOpExY2
          : step1Metrics.monthlyFixedOpExY3;
      const fixedOpExOutflow = Math.round(baseFixedOpEx * costMultiplier);

      const payrollAndTaxOutflow =
        year === 1
          ? step1Metrics.totalMonthlyPayrollAndDrawingsY1
          : year === 2
          ? (Number(step1Data.monthlyFounderDrawingsYear1) || 0) +
            (Number(step1Data.monthlyTeamSalariesYear2) || 0) +
            step1Metrics.monthlyEmployerTaxY2
          : (Number(step1Data.monthlyFounderDrawingsYear1) || 0) +
            (Number(step1Data.monthlyTeamSalariesYear3) || 0) +
            step1Metrics.monthlyEmployerTaxY3;

      const oneOffCapExAndStockOutflow =
        m === 1
          ? (Number(step1Data.totalCapExEquipmentValue) || 0) +
            step2Metrics.upfrontStockCashLockup
          : 0;

      stressedMonths.push({
        month: m,
        year,
        quarter,
        invoicedRevenue,
        cashCollected: 0,
        directCogsOutflow,
        fixedOpExOutflow,
        payrollAndTaxOutflow,
        oneOffCapExAndStockOutflow,
        loanRepaymentOutflow: 0,
        upfrontFundingInflow: 0,
        grantReimbursementInflow: 0,
        netOperatingCashflow: 0,
        fundedBankBalance: 0,
      });
    }

    // Apply Debtor Days Lag across all 36 stressed months
    const monthShiftFloat = step2Metrics.effectiveDebtorDays / 30;
    const wholeMonthsDelay = Math.floor(monthShiftFloat);
    const fractionalRemainder = monthShiftFloat - wholeMonthsDelay;

    for (let i = 0; i < 36; i++) {
      const sameIdx = i - wholeMonthsDelay;
      const prevIdx = i - wholeMonthsDelay - 1;
      const fromSame =
        sameIdx >= 0
          ? stressedMonths[sameIdx].invoicedRevenue * (1 - fractionalRemainder)
          : 0;
      const fromPrev =
        prevIdx >= 0 ? stressedMonths[prevIdx].invoicedRevenue * fractionalRemainder : 0;
      stressedMonths[i].cashCollected = Math.round(fromSame + fromPrev);
    }

    // Apply Funding & Grant Reimbursements from Step 3
    const reimbursedGrantSources = step3Data.fundingSources.filter(
      (s) => s.isReimbursementArrears && (Number(s.amount) || 0) > 0
    );
    for (const gSource of reimbursedGrantSources) {
      const amt = Number(gSource.amount) || 0;
      const lag = Math.max(1, Math.min(12, Number(gSource.reimbursementLagMonths) || 3));
      const t1Idx = Math.min(35, lag);
      const t2Idx = Math.min(35, lag + 3);
      const t1 = Math.round(amt * 0.5);
      const t2 = amt - t1;
      stressedMonths[t1Idx].grantReimbursementInflow += t1;
      stressedMonths[t2Idx].grantReimbursementInflow += t2;
    }

    const termMonths = Math.max(12, Number(step3Data.loanTermMonths) || 36);
    let runningBank = Number(step3Data.startingCashBalanceDay1) || 0;
    let lowestStressedBankBalance = runningBank;
    let lowestStressedMonth = 1;

    for (let i = 0; i < 36; i++) {
      const row = stressedMonths[i];
      if (i === 0) {
        row.upfrontFundingInflow = step3Metrics.upfrontNonArrearsFunding;
      }
      row.loanRepaymentOutflow =
        i < termMonths ? step3Metrics.monthlyLoanRepayment : 0;

      const totalOpOutflow =
        row.directCogsOutflow +
        row.fixedOpExOutflow +
        row.payrollAndTaxOutflow +
        row.oneOffCapExAndStockOutflow;

      row.netOperatingCashflow = row.cashCollected - totalOpOutflow;
      runningBank +=
        row.netOperatingCashflow -
        row.loanRepaymentOutflow +
        row.upfrontFundingInflow +
        row.grantReimbursementInflow;
      row.fundedBankBalance = runningBank;

      if (runningBank < lowestStressedBankBalance || i === 0) {
        lowestStressedBankBalance = runningBank;
        lowestStressedMonth = row.month;
      }
    }

    // Annual Loan Interest Estimate for P&L
    const totalLoanPrincipal = step3Data.fundingSources
      .filter((s) => s.sourceType === 'STARTUP_LOAN_MICROFINANCE')
      .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
    const annualInterestRate = (Number(step3Data.loanInterestRatePercent) || 6) / 100;

    // Build Official 3-Year P&L (Income Statement) Rows for Y1, Y2, Y3
    const corpTaxRate = (Number(step1Data.corporationTaxRatePercent) || 12.5) / 100;
    const exportShare = (Number(step1Data.exportRevenueSharePercent) || 0) / 100;

    const pnlYears = ([1, 2, 3] as const).map((yr) => {
      const yrMonths = stressedMonths.filter((m) => m.year === yr);
      const grossTurnoverExVat = yrMonths.reduce((s, r) => s + r.invoicedRevenue, 0);
      const exportTurnoverExVat = Math.round(grossTurnoverExVat * exportShare);
      const directCogsAndFees = yrMonths.reduce((s, r) => s + r.directCogsOutflow, 0);
      const grossProfit = grossTurnoverExVat - directCogsAndFees;
      const grossMarginPercent =
        grossTurnoverExVat > 0 ? Math.round((grossProfit / grossTurnoverExVat) * 100) : 0;

      const payrollAndDrawingsTotal = yrMonths.reduce(
        (s, r) => s + r.payrollAndTaxOutflow,
        0
      );
      const fixedOverheadsOpEx = yrMonths.reduce((s, r) => s + r.fixedOpExOutflow, 0);
      const ebitda = grossProfit - payrollAndDrawingsTotal - fixedOverheadsOpEx;
      const ebitdaMarginPercent =
        grossTurnoverExVat > 0 ? Math.round((ebitda / grossTurnoverExVat) * 100) : 0;

      const capExDepreciation =
        yr <= Math.max(1, Number(step1Data.capExDepreciationYears) || 3)
          ? step1Metrics.annualCapExDepreciation
          : 0;
      const remainingPrincipalFactor = yr === 1 ? 0.9 : yr === 2 ? 0.6 : 0.3;
      const loanInterestExpense = Math.round(
        totalLoanPrincipal * remainingPrincipalFactor * annualInterestRate
      );

      const profitBeforeTax = ebitda - capExDepreciation - loanInterestExpense;
      const corporationTax =
        profitBeforeTax > 0 ? Math.round(profitBeforeTax * corpTaxRate) : 0;
      const netProfitAfterTax = profitBeforeTax - corporationTax;
      const netMarginPercent =
        grossTurnoverExVat > 0
          ? Math.round((netProfitAfterTax / grossTurnoverExVat) * 100)
          : 0;

      const cashInflowsTotal = yrMonths.reduce((s, r) => s + r.cashCollected, 0);
      const cashOutflowsOperating = yrMonths.reduce(
        (s, r) =>
          s +
          r.directCogsOutflow +
          r.fixedOpExOutflow +
          r.payrollAndTaxOutflow +
          r.oneOffCapExAndStockOutflow +
          r.loanRepaymentOutflow,
        0
      );
      const fundingAndGrantsInflow = yrMonths.reduce(
        (s, r) => s + r.upfrontFundingInflow + r.grantReimbursementInflow,
        0
      );
      const endingBankBalance = yrMonths[yrMonths.length - 1]?.fundedBankBalance || 0;

      return {
        year: yr,
        grossTurnoverExVat,
        exportTurnoverExVat,
        directCogsAndFees,
        grossProfit,
        grossMarginPercent,
        payrollAndDrawingsTotal,
        fixedOverheadsOpEx,
        ebitda,
        ebitdaMarginPercent,
        capExDepreciation,
        loanInterestExpense,
        profitBeforeTax,
        corporationTax,
        netProfitAfterTax,
        netMarginPercent,
        cashInflowsTotal,
        cashOutflowsOperating,
        fundingAndGrantsInflow,
        endingBankBalance,
      };
    });

    const totGrossTurnover = pnlYears.reduce((s, y) => s + y.grossTurnoverExVat, 0);
    const totGrossProfit = pnlYears.reduce((s, y) => s + y.grossProfit, 0);
    const totEbitda = pnlYears.reduce((s, y) => s + y.ebitda, 0);
    const totNetProfit = pnlYears.reduce((s, y) => s + y.netProfitAfterTax, 0);

    const totals3Year = {
      grossTurnoverExVat: totGrossTurnover,
      exportTurnoverExVat: pnlYears.reduce((s, y) => s + y.exportTurnoverExVat, 0),
      directCogsAndFees: pnlYears.reduce((s, y) => s + y.directCogsAndFees, 0),
      grossProfit: totGrossProfit,
      grossMarginPercent:
        totGrossTurnover > 0
          ? Math.round((totGrossProfit / totGrossTurnover) * 100)
          : 0,
      payrollAndDrawingsTotal: pnlYears.reduce(
        (s, y) => s + y.payrollAndDrawingsTotal,
        0
      ),
      fixedOverheadsOpEx: pnlYears.reduce((s, y) => s + y.fixedOverheadsOpEx, 0),
      ebitda: totEbitda,
      ebitdaMarginPercent:
        totGrossTurnover > 0
          ? Math.round((totEbitda / totGrossTurnover) * 100)
          : 0,
      capExDepreciation: pnlYears.reduce((s, y) => s + y.capExDepreciation, 0),
      loanInterestExpense: pnlYears.reduce((s, y) => s + y.loanInterestExpense, 0),
      profitBeforeTax: pnlYears.reduce((s, y) => s + y.profitBeforeTax, 0),
      corporationTax: pnlYears.reduce((s, y) => s + y.corporationTax, 0),
      netProfitAfterTax: totNetProfit,
      netMarginPercent:
        totGrossTurnover > 0
          ? Math.round((totNetProfit / totGrossTurnover) * 100)
          : 0,
    };

    const quarterlyStressedSchedule = Array.from({ length: 12 }, (_, idx) => {
      const q = idx + 1;
      const qMonths = stressedMonths.slice((q - 1) * 3, q * 3);
      const lastM = qMonths[qMonths.length - 1];
      return {
        quarterIndex: q,
        label: `Q${q}`,
        yearLabel: `Y${Math.ceil(q / 4)} Q${((q - 1) % 4) + 1}`,
        invoicedRevenue: qMonths.reduce((s, r) => s + r.invoicedRevenue, 0),
        cashCollected: qMonths.reduce((s, r) => s + r.cashCollected, 0),
        operatingOutflow: qMonths.reduce(
          (s, r) =>
            s +
            r.directCogsOutflow +
            r.fixedOpExOutflow +
            r.payrollAndTaxOutflow +
            r.oneOffCapExAndStockOutflow +
            r.loanRepaymentOutflow,
          0
        ),
        fundingAndGrantInflow: qMonths.reduce(
          (s, r) => s + r.upfrontFundingInflow + r.grantReimbursementInflow,
          0
        ),
        endingBankBalance: lastM?.fundedBankBalance || 0,
      };
    });

    return {
      scenarioPreset,
      effectiveRevHaircutPct,
      effectiveCostInflationPct,
      effectiveDelayMonths,
      stressedMonths,
      quarterlyStressedSchedule,
      pnlYears,
      totals3Year,
      lowestStressedBankBalance,
      lowestStressedMonth,
      endingStressedBankBalanceM36: stressedMonths[35]?.fundedBankBalance || 0,
      isSolventUnderStress: lowestStressedBankBalance >= 0,
    };
  }, [step4Data, step3Data, step3Metrics, step2Data, step2Metrics, step1Data, step1Metrics, upstreamBaseline]);

  const isStep4Complete = Boolean(
    step4Data.activeStressScenario &&
      step4Data.writtenFinancialAssumptionsBlock.trim().length >= 25
  );

  // ---------------------------------------------------------------------------
  // STEP 5 STATE: MODULE J FINAL OVERVIEW BRIEF & AI UNDERWRITER AUDIT
  // ---------------------------------------------------------------------------
  const [step5Data, setStep5Data] = useState<FinanceExecutiveBriefStep5Data>(() => {
    const existing = plan.moduleJData?.step5FinanceBrief;
    if (existing && Array.isArray(existing.blindSpots) && existing.blindSpots.length > 0) {
      return existing;
    }

    const defaultBlindSpots: FinanceBlindSpotItem[] = [
      {
        id: 'mod-j-bs-1',
        title:
          step2Metrics.effectiveDebtorDays >= 30
            ? `B2B Debtor Lag (${step2Metrics.effectiveDebtorDays} Days) vs. Early Monthly Burn`
            : 'Grant Reimbursement Arrears Timing vs. Upfront Working Capital',
        severity: step4Metrics.lowestStressedBankBalance < 0 ? 'CRITICAL' : 'WARNING',
        description: isUK
          ? `Innovate UK and Start Up Loans disburse funds in arrears or scheduled tranches. With ${currencySymbol}${step1Metrics.totalMonthlyBurnY1.toLocaleString()}/mo in Year 1 burn and ${step2Metrics.effectiveDebtorDays}-day customer payment terms, your pre-funding cash trough reaches -${currencySymbol}${step3Metrics.operatingCashTroughAmount.toLocaleString()} in Month ${step3Metrics.operatingCashTroughMonth}.`
          : `Irish LEO Priming/Feasibility grants reimburse vouched receipts in arrears ONLY after you spend the cash first. With ${currencySymbol}${step1Metrics.totalMonthlyBurnY1.toLocaleString()}/mo in Year 1 burn and ${step2Metrics.effectiveDebtorDays}-day debtor terms, your pre-funding cash trough reaches -${currencySymbol}${step3Metrics.operatingCashTroughAmount.toLocaleString()} in Month ${step3Metrics.operatingCashTroughMonth}.`,
        actionableFix: step4Metrics.isSolventUnderStress
          ? `Maintain your ${currencySymbol}${step3Metrics.totalStackedFunding.toLocaleString()} capital stack in Step 3 so your lowest stressed bank balance stays positive (+${currencySymbol}${step4Metrics.lowestStressedBankBalance.toLocaleString()} in Month ${step4Metrics.lowestStressedMonth}).`
          : `Increase upfront non-arrears bridge funding (founder equity or ${isUK ? 'Start Up Loan' : 'Microfinance Ireland loan'}) by at least ${currencySymbol}${Math.abs(step4Metrics.lowestStressedBankBalance).toLocaleString()} in Step 3.`,
      },
      {
        id: 'mod-j-bs-2',
        title: `Statutory Payroll On-Costs (${step1Data.employerPayrollTaxRatePercent}%) & Tax Clearance Readiness`,
        severity: 'INFO',
        description: isUK
          ? 'UK lenders and HMRC SEIS auditors verify that Employer Class 1 NIC (13.8%) + Workplace Pension (3%) are budgeted on top of gross salaries and that Companies House / UTR filings are active.'
          : 'LEO and Enterprise Ireland evaluators verify that 11.15% Employer PRSI is budgeted on all PAYE hires and that an active Revenue eTax Clearance (eTC) certificate is in place.',
        actionableFix:
          'Keep your Step 1 Statutory Tax Auto-Pilot enabled and attach the exported Excel (.xls) schedule directly to your Module K/L grant pack.',
      },
      {
        id: 'mod-j-bs-3',
        title: `3-Year Export Turnover (${step1Data.exportRevenueSharePercent}%) & Gross Margin Scaling (${step4Metrics.pnlYears[2].grossMarginPercent}%)`,
        severity: step1Data.exportRevenueSharePercent < 15 && !isUK ? 'WARNING' : 'INFO',
        description: isUK
          ? `Your 3-Year P&L scales from ${currencySymbol}${step4Metrics.pnlYears[0].grossTurnoverExVat.toLocaleString()} (Y1) to ${currencySymbol}${step4Metrics.pnlYears[2].grossTurnoverExVat.toLocaleString()} (Y3) with ${currencySymbol}${step4Metrics.pnlYears[2].ebitda.toLocaleString()} Year 3 EBITDA.`
          : `Irish LEO Priming and Enterprise Ireland PSSF/HPSU grants heavily weight international export share (currently ${step1Data.exportRevenueSharePercent}%) and non-displacement of local competitors.`,
        actionableFix:
          'Highlight your Year 1–3 export turnover row in Step 4 when submitting to Module K (Grants & Funding) and Module L (Business Plan Compiler).',
      },
    ];

    return {
      blindSpots: defaultBlindSpots,
      financeReadinessConfidence: step4Metrics.isSolventUnderStress
        ? 'BANK_AND_GRANT_UNDERWRITING_READY'
        : 'REQUIRES_BRIDGE_OR_LOAN_FACILITY',
      otherReadinessConfidenceText: '',
      executiveFinancialSummaryNarrative: `${
        plan.title || 'Our venture'
      } presents an underwriter-ready 3-Year Profit & Loss and 36-Month Cashflow model tailored for ${
        isUK
          ? 'British Business Bank Start Up Loans, Innovate UK, and HMRC SEIS/EIS'
          : 'Local Enterprise Office (LEO), Microfinance Ireland, and Enterprise Ireland'
      }. Across Years 1 to 3, net turnover scales from ${currencySymbol}${step4Metrics.pnlYears[0].grossTurnoverExVat.toLocaleString()} to ${currencySymbol}${step4Metrics.pnlYears[1].grossTurnoverExVat.toLocaleString()} and ${currencySymbol}${step4Metrics.pnlYears[2].grossTurnoverExVat.toLocaleString()} (${
        step1Data.exportRevenueSharePercent
      }% international export share), generating a ${
        step4Metrics.pnlYears[2].grossMarginPercent
      }% Year 3 gross margin, ${currencySymbol}${step4Metrics.pnlYears[2].ebitda.toLocaleString()} EBITDA, and ${currencySymbol}${step4Metrics.pnlYears[2].netProfitAfterTax.toLocaleString()} retained Net Profit After Tax.\n\nOn a month-by-month liquidity basis, the model accounts for ${currencySymbol}${step1Metrics.totalMonthlyBurnY1.toLocaleString()}/mo in Year 1 operating burn, ${
        step2Metrics.effectiveDebtorDays
      }-day customer payment collection lags (${currencySymbol}${step2Metrics.peakWorkingCapitalLockup.toLocaleString()} peak working capital lockup), and grant reimbursement arrears. The resulting Month ${
        step3Metrics.operatingCashTroughMonth
      } pre-funding cash trough of -${currencySymbol}${step3Metrics.operatingCashTroughAmount.toLocaleString()} is bridged by ${currencySymbol}${step3Metrics.totalStackedFunding.toLocaleString()} in stacked funding, maintaining a lowest stressed bank balance of ${currencySymbol}${step4Metrics.lowestStressedBankBalance.toLocaleString()} in Month ${
        step4Metrics.lowestStressedMonth
      }.`,
      aiAssessorTip: isUK
        ? 'Attach the exported Module J Excel (.xls) schedule alongside this Executive Brief when applying for British Business Bank Start Up Loans, Innovate UK, or HMRC SEIS Advance Assurance in Module K.'
        : 'Attach the exported Module J Excel (.xls) schedule alongside this Executive Brief for your Local Enterprise Office (LEO), Microfinance Ireland, or Enterprise Ireland submission in Module K.',
    };
  });

  const [saveStatusStep5, setSaveStatusStep5] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle');
  const [isGeneratingAiStep5, setIsGeneratingAiStep5] = useState(false);
  const [aiMessageStep5, setAiMessageStep5] = useState<string | null>(null);
  const [copiedBriefSuccessStep5, setCopiedBriefSuccessStep5] = useState(false);

  const isStep5Complete = Boolean(
    step5Data.financeReadinessConfidence &&
      step5Data.executiveFinancialSummaryNarrative.trim().length >= 30
  );

  // Save & AI states for Step 1
  const [saveStatusStep1, setSaveStatusStep1] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isGeneratingAiStep1, setIsGeneratingAiStep1] = useState(false);
  const [aiMessageStep1, setAiMessageStep1] = useState<string | null>(null);
  const [syncBannerMessage, setSyncBannerMessage] = useState<string | null>(null);

  // Open Question Parking Lot State for Step 1
  const [parkingQuestionStep1, setParkingQuestionStep1] = useState('');
  const [isParkingStep1, setIsParkingStep1] = useState(false);
  const [parkedSuccessStep1, setParkedSuccessStep1] = useState(false);

  // Re-sync handler from upstream Modules D-I
  const handleSyncFromUpstreamModules = () => {
    if (isVaultReadonly) return;
    const freshItems = buildDefaultOverheadItemsFromBaseline(upstreamBaseline);
    setStep1Data((prev) => ({
      ...prev,
      overheadLineItems: freshItems,
      monthlyFounderDrawingsYear1: upstreamBaseline.monthlyFounderDrawings,
      monthlyTeamSalariesYear1: upstreamBaseline.monthlyTeamSalariesY1,
      monthlyTeamSalariesYear2: upstreamBaseline.monthlyTeamSalariesY2,
      monthlyTeamSalariesYear3: upstreamBaseline.monthlyTeamSalariesY3,
      exportRevenueSharePercent: upstreamBaseline.exportSharePercentFromModH,
      totalCapExEquipmentValue: upstreamBaseline.totalCapExEquipment,
      lastSyncedFromUpstreamAt: new Date().toISOString(),
    }));
    setSyncBannerMessage(
      `Synced latest costs from Modules D (Tech: ${currencySymbol}${upstreamBaseline.monthlyTechStackCost}/mo), E (Premises & CapEx: ${currencySymbol}${upstreamBaseline.totalCapExEquipment.toLocaleString()}), F (Payroll & Survival), H (Export: ${upstreamBaseline.exportSharePercentFromModH}%), and I (Marketing: ${currencySymbol}${upstreamBaseline.monthlyMarketingSpend}/mo).`
    );
    setTimeout(() => setSyncBannerMessage(null), 5000);
  };

  // Apply 1-click industry benchmark overheads
  const handleApplyIndustryBenchmarkStep1 = () => {
    if (isVaultReadonly) return;
    const postureObj =
      OPERATING_POSTURE_OPTIONS.find((p) => p.id === step1Data.operatingCostPosture) ||
      OPERATING_POSTURE_OPTIONS[1];
    const mult = postureObj.benchmarkMultiplier;

    setStep1Data((prev) => ({
      ...prev,
      overheadLineItems: prev.overheadLineItems.map((item) => {
        if (item.category === 'PREMISES_RENT_UTILITIES') {
          return {
            ...item,
            monthlyCostYear1:
              prev.operatingCostPosture === 'BOOTSTRAPPED_HOME_LEAN'
                ? 0
                : Math.round(350 * mult),
          };
        }
        if (item.category === 'SOFTWARE_CLOUD_AI') {
          return { ...item, monthlyCostYear1: Math.round(140 * mult) };
        }
        if (item.category === 'ACCOUNTING_LEGAL_COMPLIANCE') {
          return { ...item, monthlyCostYear1: Math.round(150 * mult) };
        }
        if (item.category === 'INSURANCE_STATUTORY') {
          return { ...item, monthlyCostYear1: Math.round(65 * mult) };
        }
        if (item.category === 'TRAVEL_ADMIN_SUNDRIES') {
          return { ...item, monthlyCostYear1: Math.round(100 * mult) };
        }
        return item;
      }),
      overheadsAndTaxNarrative:
        prev.overheadsAndTaxNarrative.trim().length > 25
          ? prev.overheadsAndTaxNarrative
          : `${plan.title || 'Our startup'} operates a disciplined ${postureObj.plainTitle} cost base in Year 1. Fixed monthly running bills are kept tightly aligned to industry benchmarks while statutory ${isUK ? 'UK Employer NIC (13.8%) & Workplace Pension (3%)' : 'Irish Employer PRSI (11.15%)'} and ${step1Data.standardVatRatePercent}% VAT provisions are ring-fenced automatically.`,
    }));
    setAiMessageStep1(
      `Applied ${plan.industryCategory || 'Sector'} benchmark overheads calibrated for "${postureObj.plainTitle}".`
    );
    setTimeout(() => setAiMessageStep1(null), 4000);
  };

  // Add custom overhead line item
  const handleAddOverheadItem = () => {
    if (isVaultReadonly) return;
    const newItem: FinancialOverheadLineItem = {
      id: `oh-custom-${Date.now()}`,
      category: 'OTHER',
      otherCategoryText: 'Specialist Sector Licence / Subscription',
      plainEnglishLabel: 'Custom Monthly Operating Bill',
      accountantLabel: 'Specialist Operating Expense (OpEx)',
      sourceModuleLabel: 'Manual Founder Entry',
      monthlyCostYear1: 100,
      annualStepUpPercentYear2: 15,
      annualStepUpPercentYear3: 15,
      grantEligibilityTag: 'WORKING_CAPITAL_LOAN_ELIGIBLE',
      notes: '',
    };
    setStep1Data((prev) => ({
      ...prev,
      overheadLineItems: [...prev.overheadLineItems, newItem],
    }));
  };

  const handleUpdateOverheadItem = (
    id: string,
    patch: Partial<FinancialOverheadLineItem>
  ) => {
    if (isVaultReadonly) return;
    setStep1Data((prev) => ({
      ...prev,
      overheadLineItems: prev.overheadLineItems.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    }));
  };

  const handleDeleteOverheadItem = (id: string) => {
    if (isVaultReadonly) return;
    setStep1Data((prev) => ({
      ...prev,
      overheadLineItems: prev.overheadLineItems.filter((item) => item.id !== id),
    }));
  };

  // AI Calibrate Step 1 Narrative & Tax Guardrails
  const handleGenerateAiStep1 = async () => {
    if (isVaultReadonly) return;
    setIsGeneratingAiStep1(true);
    setAiMessageStep1(null);
    try {
      const res = await generateModuleJOverheadsTaxAction({
        planId: plan.id,
        planTitle: plan.title || 'Startup Venture',
        industryCategory: plan.industryCategory || 'B2B SaaS / AI App',
        hqCountryCode: (effectiveCountry as any) || 'IE',
        currencySymbol,
        operatingCostPosture: step1Data.operatingCostPosture,
        monthlyFixedOverheadsYear1: step1Metrics.monthlyFixedOpExY1,
        monthlyFounderDrawingsYear1: step1Data.monthlyFounderDrawingsYear1,
        monthlyTeamSalariesYear1: step1Data.monthlyTeamSalariesYear1,
        employerPayrollTaxRatePercent: step1Data.employerPayrollTaxRatePercent,
        vatRegistrationStrategy: step1Data.vatRegistrationStrategy,
        exportRevenueSharePercent: step1Data.exportRevenueSharePercent,
        totalCapExEquipmentValue: step1Data.totalCapExEquipmentValue,
      });

      setStep1Data((prev) => ({
        ...prev,
        overheadsAndTaxNarrative: res.overheadsAndTaxNarrative,
        grantAssessorTip: res.grantAssessorTip,
        aiEngineUsed: res.engineMode,
      }));
      setAiMessageStep1(
        `AI Underwriter synthesized your Operating Cost & Tax Justification (${res.engineMode === 'gemini-2.5-flash' ? 'Gemini 2.5 Flash' : 'Smart Financial Synthesizer'}).`
      );
    } catch (err) {
      console.error('Module J Step 1 AI error:', err);
    } finally {
      setIsGeneratingAiStep1(false);
    }
  };

  // Save Step 1
  const handleSaveStep1 = async (advanceToStep2 = false, options?: { silent?: boolean }) => {
    setSaveStatusStep1('saving');
    try {
      const updatedStep1: FinancialOverheadsTaxStep1Data = {
        ...step1Data,
        lastSavedAt: new Date().toISOString(),
      };
      setStep1Data(updatedStep1);
      await saveModuleJStep1OverheadsTaxAction({
        planId: plan.id,
        step1OverheadsTax: updatedStep1,
        completionPercentage: 25,
      });
      await onSaveStep1OverheadsTax?.(updatedStep1, 25);
      isDirtyStep1Ref.current = false;
      setSaveStatusStep1('saved');
      setTimeout(() => setSaveStatusStep1('idle'), 2500);

      if (advanceToStep2) {
        setOpenStep(2);
        if (typeof document !== 'undefined') {
          setTimeout(() => {
            document
              .getElementById('module-j-step-2')
              ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 120);
        }
      }
    } catch (err) {
      console.error('Failed saving Module J Step 1:', err);
      setSaveStatusStep1('error');
    }
  };

  // Park Open Question in Step 1
  const handleParkStep1Question = async () => {
    const clean = parkingQuestionStep1.trim();
    if (!clean) return;
    setIsParkingStep1(true);
    try {
      await parkModuleJOpenQuestionAction({
        planId: plan.id,
        questionText: clean,
        stepLabel: 'Module J Step 1 (Overheads & Taxes)',
      });
      setParkingQuestionStep1('');
      setParkedSuccessStep1(true);
      setTimeout(() => setParkedSuccessStep1(false), 3000);
    } finally {
      setIsParkingStep1(false);
    }
  };

  // ---------------------------------------------------------------------------
  // STEP 2 HANDLERS: WORKING CAPITAL, PAYMENT TIMING & SEASONALITY
  // ---------------------------------------------------------------------------
  const handleApplyIndustryBenchmarkStep2 = () => {
    if (isVaultReadonly) return;
    const isB2B =
      (plan.industryCategory || '').toLowerCase().includes('b2b') ||
      (plan.industryCategory || '').toLowerCase().includes('saas') ||
      (plan.industryCategory || '').toLowerCase().includes('enterprise');

    const isRetailFood =
      (plan.industryCategory || '').toLowerCase().includes('retail') ||
      (plan.industryCategory || '').toLowerCase().includes('food') ||
      (plan.industryCategory || '').toLowerCase().includes('consumer');

    const nextCollection: CustomerCollectionTimingType = isB2B
      ? 'NET_30_STANDARD_B2B'
      : 'INSTANT_CARD_STRIPE_0';
    const nextStock: InventoryStockTimingType = isRetailFood
      ? 'PAY_ON_DELIVERY_30_DAYS'
      : 'NO_PHYSICAL_STOCK_DIGITAL';
    const nextRamp: SeasonalityRampCurveType = isRetailFood
      ? 'Q4_RETAIL_GIFTING_PEAK'
      : isB2B
      ? 'SLOW_B2B_H2_WEIGHTED'
      : 'STEADY_LINEAR_RAMP';

    setStep2Data((prev) => ({
      ...prev,
      customerCollectionTiming: nextCollection,
      inventoryStockTiming: nextStock,
      upfrontStockMonthsBuffer: isRetailFood ? 2 : 0,
      seasonalityRampCurve: nextRamp,
      monthToStartRevenue: isB2B ? 2 : 1,
      workingCapitalNarrative:
        prev.workingCapitalNarrative.trim().length > 25
          ? prev.workingCapitalNarrative
          : `${plan.title || 'Our startup'} applies sector-standard working capital assumptions for ${plan.industryCategory || 'early-stage growth'}: customer invoices are collected on ${isB2B ? '30-day Net-30 B2B terms' : 'immediate 0-day checkout settlement'}, commercial billing begins in Month ${isB2B ? 2 : 1}, and seasonal volume follows a realistic ${nextRamp.replace(/_/g, ' ').toLowerCase()} curve.`,
    }));
    setAiMessageStep2(
      `Applied ${plan.industryCategory || 'Industry'} benchmark payment timing & seasonality assumptions.`
    );
    setTimeout(() => setAiMessageStep2(null), 4000);
  };

  const handleGenerateAiStep2 = async () => {
    if (isVaultReadonly) return;
    setIsGeneratingAiStep2(true);
    setAiMessageStep2(null);
    try {
      const res = await generateModuleJWorkingCapitalAction({
        planId: plan.id,
        planTitle: plan.title || 'Startup Venture',
        industryCategory: plan.industryCategory || 'B2B SaaS / AI App',
        hqCountryCode: (effectiveCountry as any) || 'IE',
        currencySymbol,
        customerCollectionTiming: step2Data.customerCollectionTiming,
        effectiveDebtorDays: step2Metrics.effectiveDebtorDays,
        inventoryStockTiming: step2Data.inventoryStockTiming,
        upfrontStockMonthsBuffer: step2Data.upfrontStockMonthsBuffer,
        seasonalityRampCurve: step2Data.seasonalityRampCurve,
        monthToStartRevenue: step2Data.monthToStartRevenue,
        peakWorkingCapitalLockup: step2Metrics.peakWorkingCapitalLockup,
        year1CashCollectionEfficiencyPercent:
          step2Metrics.year1CashCollectionEfficiencyPercent,
      });

      setStep2Data((prev) => ({
        ...prev,
        workingCapitalNarrative: res.workingCapitalNarrative,
        grantAssessorTip: res.grantAssessorTip,
        aiEngineUsed: res.engineMode,
      }));
      setAiMessageStep2(
        `AI Underwriter synthesized your Working Capital & Payment Timing Justification (${res.engineMode === 'gemini-2.5-flash' ? 'Gemini 2.5 Flash' : 'Smart Financial Synthesizer'}).`
      );
    } catch (err) {
      console.error('Module J Step 2 AI error:', err);
    } finally {
      setIsGeneratingAiStep2(false);
    }
  };

  const handleSaveStep2 = async (advanceToStep3 = false, options?: { silent?: boolean }) => {
    setSaveStatusStep2('saving');
    try {
      const updatedStep2: WorkingCapitalTimingStep2Data = {
        ...step2Data,
        lastSavedAt: new Date().toISOString(),
      };
      setStep2Data(updatedStep2);
      await saveModuleJStep2WorkingCapitalAction({
        planId: plan.id,
        step2WorkingCapital: updatedStep2,
        completionPercentage: 50,
      });
      await onSaveStep2WorkingCapital?.(updatedStep2, 50);
      isDirtyStep2Ref.current = false;
      setSaveStatusStep2('saved');
      setTimeout(() => setSaveStatusStep2('idle'), 2500);

      if (advanceToStep3) {
        setOpenStep(3);
        if (typeof document !== 'undefined') {
          setTimeout(() => {
            document
              .getElementById('module-j-step-3')
              ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 120);
        }
      }
    } catch (err) {
      console.error('Failed saving Module J Step 2:', err);
      setSaveStatusStep2('error');
    }
  };

  const handleParkStep2Question = async () => {
    const clean = parkingQuestionStep2.trim();
    if (!clean) return;
    setIsParkingStep2(true);
    try {
      await parkModuleJOpenQuestionAction({
        planId: plan.id,
        questionText: clean,
        stepLabel: 'Module J Step 2 (Payment Timing & Working Capital)',
      });
      setParkingQuestionStep2('');
      setParkedSuccessStep2(true);
      setTimeout(() => setParkedSuccessStep2(false), 3000);
    } finally {
      setIsParkingStep2(false);
    }
  };

  // ---------------------------------------------------------------------------
  // STEP 3 HANDLERS: 36-MONTH CASHFLOW TROUGH & CAPITAL STACK BRIDGE
  // ---------------------------------------------------------------------------
  const handleAddFundingSource = () => {
    if (isVaultReadonly) return;
    const newSource: FundingSourceLineItem = {
      id: `fs-custom-${Date.now()}`,
      sourceType: 'FOUNDER_SAVINGS_EQUITY',
      otherSourceTypeText: '',
      label: 'Additional Capital / Working Capital Bridge',
      amount: 5000,
      isReimbursementArrears: false,
      reimbursementLagMonths: 0,
    };
    setStep3Data((prev) => ({
      ...prev,
      fundingSources: [...prev.fundingSources, newSource],
    }));
  };

  const handleUpdateFundingSource = (
    id: string,
    patch: Partial<FundingSourceLineItem>
  ) => {
    if (isVaultReadonly) return;
    setStep3Data((prev) => ({
      ...prev,
      fundingSources: prev.fundingSources.map((src) =>
        src.id === id ? { ...src, ...patch } : src
      ),
    }));
  };

  const handleDeleteFundingSource = (id: string) => {
    if (isVaultReadonly) return;
    setStep3Data((prev) => ({
      ...prev,
      fundingSources: prev.fundingSources.filter((src) => src.id !== id),
    }));
  };

  const handleMatchRecommendedRaiseStep3 = () => {
    if (isVaultReadonly) return;
    const targetRaise = step3Metrics.recommendedCapitalRaise;
    const freshSources = buildDefaultFundingSourcesForCountry(
      isUK,
      Math.max(5000, targetRaise - (Number(step3Data.startingCashBalanceDay1) || 0))
    );
    setStep3Data((prev) => ({
      ...prev,
      fundingSources: freshSources,
      fundingGapNarrative:
        prev.fundingGapNarrative.trim().length > 25
          ? prev.fundingGapNarrative
          : `${plan.title || 'Our startup'} has sized its capital stack to ${currencySymbol}${targetRaise.toLocaleString()} (including a ${prev.safetyBufferPercent}% working-capital safety buffer above the Month ${step3Metrics.operatingCashTroughMonth} cash trough of -${currencySymbol}${Math.abs(Math.min(0, step3Metrics.operatingCashTroughAmount)).toLocaleString()}). Upfront founder equity and working-capital loan funds bridge the ${step3Metrics.maxGrantLagMonths}-month grant reimbursement arrears lag cleanly.`,
    }));
    setAiMessageStep3(
      `Auto-sized your Capital Stack to ${currencySymbol}${targetRaise.toLocaleString()} to cover the Month ${step3Metrics.operatingCashTroughMonth} Cash Trough + ${step3Data.safetyBufferPercent}% Safety Buffer.`
    );
    setTimeout(() => setAiMessageStep3(null), 4000);
  };

  const handleGenerateAiStep3 = async () => {
    if (isVaultReadonly) return;
    setIsGeneratingAiStep3(true);
    setAiMessageStep3(null);
    try {
      const fundingSummary = step3Data.fundingSources
        .map(
          (s) =>
            `${s.label}: ${currencySymbol}${(Number(s.amount) || 0).toLocaleString()}${
              s.isReimbursementArrears ? ` (${s.reimbursementLagMonths}mo arrears)` : ' (Day 1)'
            }`
        )
        .join('; ');

      const res = await generateModuleJCashflowFundingGapAction({
        planId: plan.id,
        planTitle: plan.title || 'Startup Venture',
        industryCategory: plan.industryCategory || 'B2B SaaS / AI App',
        hqCountryCode: (effectiveCountry as any) || 'IE',
        currencySymbol,
        primaryFundingStrategy:
          step3Data.primaryFundingStrategy === 'OTHER'
            ? step3Data.otherPrimaryFundingStrategyText || 'Custom Hybrid Stack'
            : step3Data.primaryFundingStrategy || 'GRANT_PLUS_MATCH_FUNDING',
        startingCashBalanceDay1: step3Data.startingCashBalanceDay1,
        safetyBufferPercent: step3Data.safetyBufferPercent,
        operatingCashTroughAmount: step3Metrics.operatingCashTroughAmount,
        operatingCashTroughMonth: step3Metrics.operatingCashTroughMonth,
        recommendedCapitalRaise: step3Metrics.recommendedCapitalRaise,
        totalStackedFunding: step3Metrics.totalStackedFunding,
        reimbursedGrantTotal: step3Metrics.reimbursedGrantTotal,
        maxGrantLagMonths: step3Metrics.maxGrantLagMonths,
        cashflowPositiveMonth: step3Metrics.cashflowPositiveMonth,
        fundingSourcesSummary: fundingSummary,
      });

      setStep3Data((prev) => ({
        ...prev,
        fundingGapNarrative: res.fundingGapNarrative,
        grantAssessorTip: res.grantAssessorTip,
        aiEngineUsed: res.engineMode,
      }));
      setAiMessageStep3(
        `AI Underwriter synthesized your 36-Month Cash Trough & Grant Reimbursement Bridge Justification (${res.engineMode === 'gemini-2.5-flash' ? 'Gemini 2.5 Flash' : 'Smart Financial Synthesizer'}).`
      );
    } catch (err) {
      console.error('Module J Step 3 AI error:', err);
    } finally {
      setIsGeneratingAiStep3(false);
    }
  };

  const handleSaveStep3 = async (advanceToStep4 = false, options?: { silent?: boolean }) => {
    setSaveStatusStep3('saving');
    try {
      const updatedStep3: CashflowFundingGapStep3Data = {
        ...step3Data,
        lastSavedAt: new Date().toISOString(),
      };
      setStep3Data(updatedStep3);
      await saveModuleJStep3CashflowGapAction({
        planId: plan.id,
        step3CashflowGap: updatedStep3,
        completionPercentage: 75,
      });
      await onSaveStep3CashflowGap?.(updatedStep3, 75);
      isDirtyStep3Ref.current = false;
      setSaveStatusStep3('saved');
      setTimeout(() => setSaveStatusStep3('idle'), 2500);

      if (advanceToStep4) {
        setOpenStep(4);
        if (typeof document !== 'undefined') {
          setTimeout(() => {
            document
              .getElementById('module-j-step-4')
              ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 120);
        }
      }
    } catch (err) {
      console.error('Failed saving Module J Step 3:', err);
      setSaveStatusStep3('error');
    }
  };

  const handleParkStep3Question = async () => {
    const clean = parkingQuestionStep3.trim();
    if (!clean) return;
    setIsParkingStep3(true);
    try {
      await parkModuleJOpenQuestionAction({
        planId: plan.id,
        questionText: clean,
        stepLabel: 'Module J Step 3 (36-Month Cash Trough & Grant Bridge)',
      });
      setParkingQuestionStep3('');
      setParkedSuccessStep3(true);
      setTimeout(() => setParkedSuccessStep3(false), 3000);
    } finally {
      setIsParkingStep3(false);
    }
  };

  // ---------------------------------------------------------------------------
  // STEP 4 HANDLERS: 3-YEAR P&L, 36-MONTH CASHFLOW, STRESS-TEST & IP SHIELD
  // ---------------------------------------------------------------------------
  const handleApplyBenchmarkStressStep4 = () => {
    if (isVaultReadonly) return;
    const y1Pnl = step4Metrics.pnlYears[0];
    const y3Pnl = step4Metrics.pnlYears[2];
    setStep4Data((prev) => ({
      ...prev,
      activeStressScenario: 'UNDERWRITER_STRESS_TEST',
      writtenFinancialAssumptionsBlock:
        prev.writtenFinancialAssumptionsBlock.trim().length > 25
          ? prev.writtenFinancialAssumptionsBlock
          : `${plan.title || 'Our startup'} projects net turnover scaling from ${currencySymbol}${y1Pnl.grossTurnoverExVat.toLocaleString()} in Year 1 to ${currencySymbol}${y3Pnl.grossTurnoverExVat.toLocaleString()} in Year 3 (${step1Data.exportRevenueSharePercent}% export revenue share), delivering a ${y3Pnl.grossMarginPercent}% gross margin and ${currencySymbol}${y3Pnl.netProfitAfterTax.toLocaleString()} Year 3 retained net profit after ${step1Data.corporationTaxRatePercent}% Corporation Tax.\n\nEven when subjected to the standard Grant Underwriter Stress Test (-20% sales haircut and +15% cost inflation), the capital stack maintains a lowest bank balance of ${currencySymbol}${step4Metrics.lowestStressedBankBalance.toLocaleString()} in Month ${step4Metrics.lowestStressedMonth}, while all intellectual property is ring-fenced inside the company.`,
    }));
    setAiMessageStep4(
      'Applied the Standard Bank & Grant Underwriter Stress Test (-20% Revenue, +15% OpEx) and populated baseline P&L assumptions.'
    );
    setTimeout(() => setAiMessageStep4(null), 4000);
  };

  const handleGenerateAiStep4 = async () => {
    if (isVaultReadonly) return;
    setIsGeneratingAiStep4(true);
    setAiMessageStep4(null);
    try {
      const y1 = step4Metrics.pnlYears[0];
      const y2 = step4Metrics.pnlYears[1];
      const y3 = step4Metrics.pnlYears[2];

      const res = await generateModuleJStatementsStressTestAction({
        planId: plan.id,
        planTitle: plan.title || 'Startup Venture',
        industryCategory: plan.industryCategory || 'B2B SaaS / AI App',
        hqCountryCode: (effectiveCountry as any) || 'IE',
        currencySymbol,
        activeStressScenario:
          step4Data.activeStressScenario === 'OTHER'
            ? step4Data.otherStressScenarioText || 'Custom Sensitivity Stress Test'
            : step4Metrics.scenarioPreset.accountantTitle,
        revenueY1: y1.grossTurnoverExVat,
        revenueY2: y2.grossTurnoverExVat,
        revenueY3: y3.grossTurnoverExVat,
        grossMarginY3Percent: y3.grossMarginPercent,
        ebitdaY1: y1.ebitda,
        ebitdaY2: y2.ebitda,
        ebitdaY3: y3.ebitda,
        netProfitAfterTaxY3: y3.netProfitAfterTax,
        exportRevenueSharePercent: step1Data.exportRevenueSharePercent,
        lowestStressedBankBalance: step4Metrics.lowestStressedBankBalance,
        lowestStressedMonth: step4Metrics.lowestStressedMonth,
        corporationTaxRatePercent: step1Data.corporationTaxRatePercent,
      });

      setStep4Data((prev) => ({
        ...prev,
        writtenFinancialAssumptionsBlock: res.writtenFinancialAssumptionsBlock,
        grantAssessorTip: res.grantAssessorTip,
        aiEngineUsed: res.engineMode,
      }));
      setAiMessageStep4(
        `AI Underwriter synthesized your Official 3-Year P&L & Stress-Test Assumptions (${res.engineMode === 'gemini-2.5-flash' ? 'Gemini 2.5 Flash' : 'Smart Financial Synthesizer'}).`
      );
    } catch (err) {
      console.error('Module J Step 4 AI error:', err);
    } finally {
      setIsGeneratingAiStep4(false);
    }
  };

  const handleSaveStep4 = async (advanceToStep5 = false, options?: { silent?: boolean }) => {
    setSaveStatusStep4('saving');
    try {
      const updatedStep4: StatementsStressTestStep4Data = {
        ...step4Data,
        lastSavedAt: new Date().toISOString(),
      };
      setStep4Data(updatedStep4);
      await saveModuleJStep4StatementsAction({
        planId: plan.id,
        step4Statements: updatedStep4,
        completionPercentage: 85,
      });
      await onSaveStep4Statements?.(updatedStep4, 85);
      isDirtyStep4Ref.current = false;
      setSaveStatusStep4('saved');
      setTimeout(() => setSaveStatusStep4('idle'), 2500);

      if (advanceToStep5) {
        setOpenStep(5);
        if (typeof document !== 'undefined') {
          setTimeout(() => {
            document
              .getElementById('module-j-step-5')
              ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 120);
        }
      }
    } catch (err) {
      console.error('Failed saving Module J Step 4:', err);
      setSaveStatusStep4('error');
    }
  };

  const handleParkStep4Question = async () => {
    const clean = parkingQuestionStep4.trim();
    if (!clean) return;
    setIsParkingStep4(true);
    try {
      await parkModuleJOpenQuestionAction({
        planId: plan.id,
        questionText: clean,
        stepLabel: 'Module J Step 4 (3-Year P&L, Stress Test & IP Shield)',
      });
      setParkingQuestionStep4('');
      setParkedSuccessStep4(true);
      setTimeout(() => setParkedSuccessStep4(false), 3000);
    } finally {
      setIsParkingStep4(false);
    }
  };

  // ---------------------------------------------------------------------------
  // STEP 5 HANDLERS: FINAL OVERVIEW BRIEF & AI UNDERWRITER AUDIT
  // ---------------------------------------------------------------------------
  const handleGenerateAiStep5 = async () => {
    if (isVaultReadonly) return;
    setIsGeneratingAiStep5(true);
    setAiMessageStep5(null);
    try {
      const res = await generateModuleJExecutiveBriefAction({
        planId: plan.id,
        planTitle: plan.title || 'Startup Venture',
        industryCategory: plan.industryCategory || 'B2B SaaS / AI App',
        hqCountryCode: (effectiveCountry as any) || 'IE',
        currencySymbol,
        totalMonthlyBurnY1: step1Metrics.totalMonthlyBurnY1,
        effectiveDebtorDays: step2Metrics.effectiveDebtorDays,
        peakWorkingCapitalLockup: step2Metrics.peakWorkingCapitalLockup,
        operatingCashTroughAmount: step3Metrics.operatingCashTroughAmount,
        operatingCashTroughMonth: step3Metrics.operatingCashTroughMonth,
        totalStackedFunding: step3Metrics.totalStackedFunding,
        revenueY1: step4Metrics.pnlYears[0].grossTurnoverExVat,
        revenueY2: step4Metrics.pnlYears[1].grossTurnoverExVat,
        revenueY3: step4Metrics.pnlYears[2].grossTurnoverExVat,
        exportRevenueSharePercent: step1Data.exportRevenueSharePercent,
        grossMarginY3Percent: step4Metrics.pnlYears[2].grossMarginPercent,
        ebitdaY3: step4Metrics.pnlYears[2].ebitda,
        netProfitAfterTaxY3: step4Metrics.pnlYears[2].netProfitAfterTax,
        lowestStressedBankBalance: step4Metrics.lowestStressedBankBalance,
        lowestStressedMonth: step4Metrics.lowestStressedMonth,
      });

      setStep5Data((prev) => ({
        ...prev,
        blindSpots: res.blindSpots,
        financeReadinessConfidence:
          prev.financeReadinessConfidence === 'OTHER'
            ? 'OTHER'
            : res.financeReadinessConfidence,
        executiveFinancialSummaryNarrative: res.executiveFinancialSummaryNarrative,
        aiAssessorTip: res.aiAssessorTip,
        aiEngineUsed: res.engineMode,
      }));
      setAiMessageStep5(
        `AI Underwriter completed your Module J Blind-Spot Audit & Executive Brief (${
          res.engineMode === 'gemini-2.5-flash'
            ? 'Gemini 2.5 Flash'
            : 'Smart Financial Synthesizer'
        }).`
      );
    } catch (err) {
      console.error('Module J Step 5 AI error:', err);
    } finally {
      setIsGeneratingAiStep5(false);
    }
  };

  const handleSaveStep5 = async (advanceToModK = false, options?: { silent?: boolean }) => {
    setSaveStatusStep5('saving');
    try {
      const updatedStep5: FinanceExecutiveBriefStep5Data = {
        ...step5Data,
        lastSavedAt: new Date().toISOString(),
      };
      setStep5Data(updatedStep5);
      await saveModuleJStep5BriefAction({
        planId: plan.id,
        step5FinanceBrief: updatedStep5,
        completionPercentage: 100,
      });
      await onSaveStep5Brief?.(updatedStep5, 100);
      isDirtyStep5Ref.current = false;
      setSaveStatusStep5('saved');
      setTimeout(() => setSaveStatusStep5('idle'), 2500);

      if (advanceToModK) {
        onContinueToModuleK?.();
      }
    } catch (err) {
      console.error('Failed saving Module J Step 5:', err);
      setSaveStatusStep5('error');
    }
  };

  // Step 1 Debounced Autosave (1200ms)
  useEffect(() => {
    if (isFirstRenderStep1Ref.current) {
      isFirstRenderStep1Ref.current = false;
      return;
    }
    if (isVaultReadonly) return;
    isDirtyStep1Ref.current = true;
    const timer = setTimeout(() => {
      if (isDirtyStep1Ref.current) {
        void handleSaveStep1(false, { silent: true });
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [step1Data]);

  // Step 2 Debounced Autosave (1200ms)
  useEffect(() => {
    if (isFirstRenderStep2Ref.current) {
      isFirstRenderStep2Ref.current = false;
      return;
    }
    if (isVaultReadonly) return;
    isDirtyStep2Ref.current = true;
    const timer = setTimeout(() => {
      if (isDirtyStep2Ref.current) {
        void handleSaveStep2(false, { silent: true });
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [step2Data]);

  // Step 3 Debounced Autosave (1200ms)
  useEffect(() => {
    if (isFirstRenderStep3Ref.current) {
      isFirstRenderStep3Ref.current = false;
      return;
    }
    if (isVaultReadonly) return;
    isDirtyStep3Ref.current = true;
    const timer = setTimeout(() => {
      if (isDirtyStep3Ref.current) {
        void handleSaveStep3(false, { silent: true });
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [step3Data]);

  // Step 4 Debounced Autosave (1200ms)
  useEffect(() => {
    if (isFirstRenderStep4Ref.current) {
      isFirstRenderStep4Ref.current = false;
      return;
    }
    if (isVaultReadonly) return;
    isDirtyStep4Ref.current = true;
    const timer = setTimeout(() => {
      if (isDirtyStep4Ref.current) {
        void handleSaveStep4(false, { silent: true });
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [step4Data]);

  // Step 5 Debounced Autosave (1200ms)
  useEffect(() => {
    if (isFirstRenderStep5Ref.current) {
      isFirstRenderStep5Ref.current = false;
      return;
    }
    if (isVaultReadonly) return;
    isDirtyStep5Ref.current = true;
    const timer = setTimeout(() => {
      if (isDirtyStep5Ref.current) {
        void handleSaveStep5(false, { silent: true });
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [step5Data]);

  // Flush on unmount so switching modules never loses changes
  useEffect(() => {
    return () => {
      if (isDirtyStep1Ref.current) void handleSaveStep1(false, { silent: true });
      if (isDirtyStep2Ref.current) void handleSaveStep2(false, { silent: true });
      if (isDirtyStep3Ref.current) void handleSaveStep3(false, { silent: true });
      if (isDirtyStep4Ref.current) void handleSaveStep4(false, { silent: true });
      if (isDirtyStep5Ref.current) void handleSaveStep5(false, { silent: true });
    };
  }, []);

  const buildModuleJExecutiveMarkdown = () => {
    const [y1, y2, y3] = step4Metrics.pnlYears;
    const tot = step4Metrics.totals3Year;
    const confOpt = FINANCE_READINESS_CONFIDENCE_OPTIONS.find(
      (c) => c.id === step5Data.financeReadinessConfidence
    );
    const confLabel =
      step5Data.financeReadinessConfidence === 'OTHER'
        ? step5Data.otherReadinessConfidenceText || 'Custom Financial Readiness'
        : confOpt?.accountantTitle || 'Bank & Grant Underwriting Ready';
    const corpIpOpt = CORPORATE_IP_READINESS_OPTIONS.find(
      (c) => c.id === step4Data.corporateIpReadinessStatus
    );
    const corpIpLabel =
      step4Data.corporateIpReadinessStatus === 'OTHER'
        ? step4Data.otherCorporateIpReadinessStatusText || 'Custom Corporate / IP Structure'
        : corpIpOpt?.accountantTitle || 'Incorporation & IP Assignment In Progress';

    return [
      `# ${plan.title || 'Startup Venture'} — Module J: 3-Year Financials & 36-Month Cashflow Executive Brief`,
      `**Jurisdiction:** ${effectiveCountry} | **Currency:** ${currencyCode} (${currencySymbol}) | **Readiness Posture:** ${confLabel} | **Stress Scenario:** ${step4Metrics.scenarioPreset.accountantTitle}`,
      '',
      '## 1. Executive Financial Summary',
      step5Data.executiveFinancialSummaryNarrative,
      '',
      step5Data.aiAssessorTip ? `> **Underwriter & Grant Assessor Tip:** ${step5Data.aiAssessorTip}` : '',
      '',
      '## 2. Official 3-Year Profit & Loss (Income Statement) Summary (Excl. VAT)',
      `| Line Item | Year 1 | Year 2 | Year 3 | 3-Year Total |`,
      `| :--- | :---: | :---: | :---: | :---: |`,
      `| **Gross Turnover (Excl. VAT)** | ${currencySymbol}${y1.grossTurnoverExVat.toLocaleString()} | ${currencySymbol}${y2.grossTurnoverExVat.toLocaleString()} | ${currencySymbol}${y3.grossTurnoverExVat.toLocaleString()} | **${currencySymbol}${tot.grossTurnoverExVat.toLocaleString()}** |`,
      `| ↳ International Export Turnover (${step1Data.exportRevenueSharePercent}%) | ${currencySymbol}${y1.exportTurnoverExVat.toLocaleString()} | ${currencySymbol}${y2.exportTurnoverExVat.toLocaleString()} | ${currencySymbol}${y3.exportTurnoverExVat.toLocaleString()} | ${currencySymbol}${tot.exportTurnoverExVat.toLocaleString()} |`,
      `| Direct COGS & Merchant Fees | -${currencySymbol}${y1.directCogsAndFees.toLocaleString()} | -${currencySymbol}${y2.directCogsAndFees.toLocaleString()} | -${currencySymbol}${y3.directCogsAndFees.toLocaleString()} | -${currencySymbol}${tot.directCogsAndFees.toLocaleString()} |`,
      `| **Gross Profit (${tot.grossMarginPercent}% Margin)** | **${currencySymbol}${y1.grossProfit.toLocaleString()}** (${y1.grossMarginPercent}%) | **${currencySymbol}${y2.grossProfit.toLocaleString()}** (${y2.grossMarginPercent}%) | **${currencySymbol}${y3.grossProfit.toLocaleString()}** (${y3.grossMarginPercent}%) | **${currencySymbol}${tot.grossProfit.toLocaleString()}** |`,
      `| Payroll, Drawings & Employer ${isUK ? 'NIC/Pension' : 'PRSI'} (${step1Data.employerPayrollTaxRatePercent}%) | -${currencySymbol}${y1.payrollAndDrawingsTotal.toLocaleString()} | -${currencySymbol}${y2.payrollAndDrawingsTotal.toLocaleString()} | -${currencySymbol}${y3.payrollAndDrawingsTotal.toLocaleString()} | -${currencySymbol}${tot.payrollAndDrawingsTotal.toLocaleString()} |`,
      `| Fixed Administrative Overheads (OpEx) | -${currencySymbol}${y1.fixedOverheadsOpEx.toLocaleString()} | -${currencySymbol}${y2.fixedOverheadsOpEx.toLocaleString()} | -${currencySymbol}${y3.fixedOverheadsOpEx.toLocaleString()} | -${currencySymbol}${tot.fixedOverheadsOpEx.toLocaleString()} |`,
      `| **EBITDA (Operating Profit)** | **${currencySymbol}${y1.ebitda.toLocaleString()}** | **${currencySymbol}${y2.ebitda.toLocaleString()}** | **${currencySymbol}${y3.ebitda.toLocaleString()}** | **${currencySymbol}${tot.ebitda.toLocaleString()}** |`,
      `| CapEx Depreciation (3-Yr) & Loan Interest | -${currencySymbol}${(y1.capExDepreciation + y1.loanInterestExpense).toLocaleString()} | -${currencySymbol}${(y2.capExDepreciation + y2.loanInterestExpense).toLocaleString()} | -${currencySymbol}${(y3.capExDepreciation + y3.loanInterestExpense).toLocaleString()} | -${currencySymbol}${(tot.capExDepreciation + tot.loanInterestExpense).toLocaleString()} |`,
      `| Corporation Tax (${step1Data.corporationTaxRatePercent}%) | -${currencySymbol}${y1.corporationTax.toLocaleString()} | -${currencySymbol}${y2.corporationTax.toLocaleString()} | -${currencySymbol}${y3.corporationTax.toLocaleString()} | -${currencySymbol}${tot.corporationTax.toLocaleString()} |`,
      `| **Retained Net Profit After Tax (PAT)** | **${currencySymbol}${y1.netProfitAfterTax.toLocaleString()}** | **${currencySymbol}${y2.netProfitAfterTax.toLocaleString()}** | **${currencySymbol}${y3.netProfitAfterTax.toLocaleString()}** | **${currencySymbol}${tot.netProfitAfterTax.toLocaleString()}** |`,
      '',
      '## 3. 36-Month Cashflow Trough, Working Capital & Capital Stack',
      `- **Year 1 Monthly Operating Burn:** ${currencySymbol}${step1Metrics.totalMonthlyBurnY1.toLocaleString()}/month (Fixed OpEx: ${currencySymbol}${step1Metrics.monthlyFixedOpExY1.toLocaleString()}/mo | Payroll & Drawings: ${currencySymbol}${(step1Data.monthlyFounderDrawingsYear1 + step1Data.monthlyTeamSalariesYear1 + step1Metrics.monthlyEmployerTaxY1).toLocaleString()}/mo)`,
      `- **Customer Payment Lag (Debtor Days):** ${step2Metrics.effectiveDebtorDays} days (${step2Metrics.year1CashCollectionEfficiencyPercent}% Year 1 cash collection efficiency | Peak Working Capital Lockup: ${currencySymbol}${step2Metrics.peakWorkingCapitalLockup.toLocaleString()})`,
      `- **Pre-Funding 36-Month Operating Cash Trough:** -${currencySymbol}${step3Metrics.operatingCashTroughAmount.toLocaleString()} in Month ${step3Metrics.operatingCashTroughMonth} (Recommended Raise +${step3Data.safetyBufferPercent}% Buffer: ${currencySymbol}${step3Metrics.recommendedCapitalRaise.toLocaleString()})`,
      `- **Total Stacked Funding & Bridge Capital:** ${currencySymbol}${step3Metrics.totalStackedFunding.toLocaleString()} (Upfront Day-1 Cash: ${currencySymbol}${(step3Metrics.totalStackedFunding - step3Metrics.reimbursedGrantTotal).toLocaleString()} | Grant Arrears: ${currencySymbol}${step3Metrics.reimbursedGrantTotal.toLocaleString()})`,
      `- **Stressed Bank Balance Floor (${step4Metrics.scenarioPreset.accountantTitle}):** ${currencySymbol}${step4Metrics.lowestStressedBankBalance.toLocaleString()} in Month ${step4Metrics.lowestStressedMonth} | Month 36 Closing Cash: ${currencySymbol}${step4Metrics.endingStressedBankBalanceM36.toLocaleString()}`,
      '',
      '### Capital Stack & Grant Reimbursement Breakdown',
      `| Funding Source | Disbursement Timing | Amount (${currencySymbol}) |`,
      `| :--- | :---: | :---: |`,
      `| Starting Cash on Hand (Day 1) | Immediate (Month 1) | ${currencySymbol}${(Number(step3Data.startingCashBalanceDay1) || 0).toLocaleString()} |`,
      ...step3Data.fundingSources.map(
        (s) =>
          `| ${s.label} | ${s.isReimbursementArrears ? `Paid in Arrears (${s.reimbursementLagMonths}mo Lag)` : 'Upfront / Month 1 Drawdown'} | ${currencySymbol}${(Number(s.amount) || 0).toLocaleString()} |`
      ),
      '',
      '### 12-Quarter (Q1–Q12) Cashflow & Bank Balance Schedule',
      `| Quarter | Customer Cash Collected | Funding & Grant Inflow | Operating & Debt Outflow | Ending Bank Balance |`,
      `| :--- | :---: | :---: | :---: | :---: |`,
      ...step4Metrics.quarterlyStressedSchedule.map(
        (q) =>
          `| **${q.yearLabel} (${q.label})** | +${currencySymbol}${q.cashCollected.toLocaleString()} | +${currencySymbol}${q.fundingAndGrantInflow.toLocaleString()} | -${currencySymbol}${q.operatingOutflow.toLocaleString()} | **${q.endingBankBalance < 0 ? '-' : ''}${currencySymbol}${Math.abs(q.endingBankBalance).toLocaleString()}** |`
      ),
      '',
      '## 4. Written Financial, Tax & Working Capital Assumptions',
      `- **Tax & VAT Posture:** Employer ${isUK ? 'NIC & Pension' : 'PRSI'} ${step1Data.employerPayrollTaxRatePercent}% | Corporation Tax ${step1Data.corporationTaxRatePercent}% | VAT ${step1Data.standardVatRatePercent}% (${step1Data.vatRegistrationStrategy})`,
      `- **Overheads & Tax Narrative:** ${step1Data.overheadsAndTaxNarrative}`,
      `- **Working Capital Narrative:** ${step2Data.workingCapitalNarrative}`,
      `- **Funding Bridge Narrative:** ${step3Data.fundingGapNarrative}`,
      `- **P&L & Sensitivity Assumptions:** ${step4Data.writtenFinancialAssumptionsBlock}`,
      `- **Corporate, Banking & IP Status:** ${corpIpLabel}${step4Data.corporateIpPlaceholderNotes ? ` — ${step4Data.corporateIpPlaceholderNotes}` : ''}`,
      '',
      '## 5. Things to Consider — Financial Underwriting Blind-Spot Audit',
      ...step5Data.blindSpots.map(
        (b, i) =>
          `${i + 1}. **[${b.severity}] ${b.title}:** ${b.description} *(Fix: ${b.actionableFix})*`
      ),
    ]
      .filter(Boolean)
      .join('\n');
  };

  const handleCopyBriefMarkdown = async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    await navigator.clipboard.writeText(buildModuleJExecutiveMarkdown());
    setCopiedBriefSuccessStep5(true);
    setTimeout(() => setCopiedBriefSuccessStep5(false), 2500);
  };

  const handleDownloadHtmlBrief = () => {
    if (typeof window === 'undefined') return;
    const safeTitle = (plan.title || 'Startup_Plan').replace(/[^a-zA-Z0-9_-]/g, '_');
    const [y1, y2, y3] = step4Metrics.pnlYears;
    const tot = step4Metrics.totals3Year;
    const confOpt = FINANCE_READINESS_CONFIDENCE_OPTIONS.find(
      (c) => c.id === step5Data.financeReadinessConfidence
    );
    const confLabel =
      step5Data.financeReadinessConfidence === 'OTHER'
        ? step5Data.otherReadinessConfidenceText || 'Custom Financial Readiness'
        : confOpt?.accountantTitle || 'Bank & Grant Underwriting Ready';
    const corpIpOpt = CORPORATE_IP_READINESS_OPTIONS.find(
      (c) => c.id === step4Data.corporateIpReadinessStatus
    );
    const corpIpLabel =
      step4Data.corporateIpReadinessStatus === 'OTHER'
        ? step4Data.otherCorporateIpReadinessStatusText || 'Custom Corporate / IP Structure'
        : corpIpOpt?.accountantTitle || 'Incorporation & IP Assignment In Progress';

    const escapeHtml = (str: string) =>
      String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(plan.title || 'Startup')} — Module J Executive Financial Brief & Grant Pack</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; background: #f8fafc; margin: 0; padding: 28px 16px; line-height: 1.5; }
  .sheet { max-width: 980px; margin: 0 auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 16px; padding: 28px 32px; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.05); }
  .top-banner { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%); color: #ffffff; border-radius: 12px; padding: 22px 24px; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 16px; }
  .top-banner h1 { font-size: 21px; margin: 4px 0 6px; color: #ffffff; letter-spacing: -0.01em; }
  .top-banner p { margin: 0; font-size: 12px; color: #c7d2fe; }
  .badge-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
  .pill { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; background: rgba(255,255,255,0.12); color: #e0e7ff; border: 1px solid rgba(255,255,255,0.2); }
  .pill-emerald { background: rgba(16, 185, 129, 0.2); color: #a7f3d0; border-color: rgba(16, 185, 129, 0.4); }
  .print-btn { background: #ffffff; color: #1e1b4b; border: none; border-radius: 8px; padding: 8px 14px; font-size: 12px; font-weight: 700; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
  .print-btn:hover { background: #eef2ff; }
  h2 { font-size: 14px; margin: 26px 0 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; color: #1e1b4b; text-transform: uppercase; letter-spacing: 0.05em; }
  h3 { font-size: 12px; margin: 16px 0 6px; color: #334155; text-transform: uppercase; letter-spacing: 0.04em; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 14px; }
  @media (max-width: 760px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
  .kpi-card { border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px 14px; background: #f8fafc; }
  .kpi-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
  .kpi-val { font-size: 19px; font-weight: 800; color: #0f172a; margin: 4px 0 2px; }
  .kpi-sub { font-size: 11px; color: #475569; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
  th, td { border: 1px solid #cbd5e1; padding: 7px 9px; text-align: right; }
  th:first-child, td:first-child { text-align: left; }
  th { background: #1e1b4b; color: #ffffff; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.03em; }
  .sub-th th { background: #334155; }
  .bold-row { font-weight: 700; background: #f1f5f9; }
  .emerald-row { font-weight: 700; background: #ecfdf5; color: #065f46; }
  .indigo-row { font-weight: 700; background: #eef2ff; color: #1e1b4b; }
  .neg { color: #be123c; }
  .pos { color: #047857; }
  .card { border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px 15px; margin-top: 10px; background: #f8fafc; font-size: 12.5px; }
  .tip-box { border: 1px solid #c7d2fe; background: #eef2ff; color: #1e1b4b; border-radius: 10px; padding: 11px 14px; margin-top: 10px; font-size: 12px; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 10px; }
  @media (max-width: 760px) { .two-col { grid-template-columns: 1fr; } }
  .bs-crit { border-left: 4px solid #e11d48; background: #fff1f2; }
  .bs-warn { border-left: 4px solid #f59e0b; background: #fffbeb; }
  .bs-info { border-left: 4px solid #4f46e5; background: #eef2ff; }
  .footer { margin-top: 26px; padding-top: 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; }
  @media print {
    body { background: #ffffff; padding: 0; }
    .sheet { border: none; box-shadow: none; padding: 10px; max-width: 100%; }
    .print-btn { display: none; }
  }
</style>
</head>
<body>
  <div class="sheet">
    <div class="top-banner">
      <div>
        <p>STARTUP PREFLIGHT 2.0 • MODULE J OFFICIAL FINANCIAL &amp; CASHFLOW PACK</p>
        <h1>${escapeHtml(plan.title || 'Startup Venture')} — 3-Year Financials &amp; 36-Month Cashflow Brief</h1>
        <div class="badge-row">
          <span class="pill">Jurisdiction: ${escapeHtml(effectiveCountry)} (${escapeHtml(currencyCode)} ${escapeHtml(currencySymbol)})</span>
          <span class="pill pill-emerald">Posture: ${escapeHtml(confLabel)}</span>
          <span class="pill">Stress Scenario: ${escapeHtml(step4Metrics.scenarioPreset.accountantTitle)}</span>
          <span class="pill">Export Target: ${step1Data.exportRevenueSharePercent}%</span>
        </div>
      </div>
      <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
    </div>

    <!-- 4-STEP FINANCIAL READINESS KPI STRIP -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">1. Y1 Monthly Burn &amp; Tax</div>
        <div class="kpi-val">${currencySymbol}${step1Metrics.totalMonthlyBurnY1.toLocaleString()}/mo</div>
        <div class="kpi-sub">OpEx: ${currencySymbol}${step1Metrics.monthlyFixedOpExY1.toLocaleString()} | Payroll &amp; ${isUK ? 'NIC' : 'PRSI'}: ${currencySymbol}${(step1Data.monthlyFounderDrawingsYear1 + step1Data.monthlyTeamSalariesYear1 + step1Metrics.monthlyEmployerTaxY1).toLocaleString()}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">2. Working Capital &amp; Lag</div>
        <div class="kpi-val">${step2Metrics.effectiveDebtorDays} Days Lag</div>
        <div class="kpi-sub">${step2Metrics.year1CashCollectionEfficiencyPercent}% Y1 Cash Efficiency | Lockup: ${currencySymbol}${step2Metrics.peakWorkingCapitalLockup.toLocaleString()}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">3. Pre-Funding Cash Trough</div>
        <div class="kpi-val neg">-${currencySymbol}${step3Metrics.operatingCashTroughAmount.toLocaleString()}</div>
        <div class="kpi-sub">Hits in Month ${step3Metrics.operatingCashTroughMonth} | Target Raise (+${step3Data.safetyBufferPercent}%): ${currencySymbol}${step3Metrics.recommendedCapitalRaise.toLocaleString()}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">4. Stacked Capital &amp; Floor</div>
        <div class="kpi-val ${step4Metrics.lowestStressedBankBalance >= 0 ? 'pos' : 'neg'}">${currencySymbol}${step3Metrics.totalStackedFunding.toLocaleString()}</div>
        <div class="kpi-sub">Stressed Floor (M${step4Metrics.lowestStressedMonth}): ${step4Metrics.lowestStressedBankBalance < 0 ? '-' : '+'}${currencySymbol}${Math.abs(step4Metrics.lowestStressedBankBalance).toLocaleString()}</div>
      </div>
    </div>

    <h2>1. Executive Financial Narrative &amp; Underwriter Summary</h2>
    <div class="card">${escapeHtml(step5Data.executiveFinancialSummaryNarrative).replace(/\n/g, '<br/>')}</div>
    ${
      step5Data.aiAssessorTip
        ? `<div class="tip-box"><strong>Underwriter &amp; Grant Assessor Guidance:</strong> ${escapeHtml(step5Data.aiAssessorTip)}</div>`
        : ''
    }

    <h2>2. Official 3-Year Profit &amp; Loss Statement (Excl. VAT — ${escapeHtml(step4Metrics.scenarioPreset.accountantTitle)})</h2>
    <table>
      <thead>
        <tr>
          <th>P&amp;L Line Item (Plain-English &amp; Official Heading)</th>
          <th>Year 1 (${currencySymbol})</th>
          <th>Year 2 (${currencySymbol})</th>
          <th>Year 3 (${currencySymbol})</th>
          <th>3-Year Total (${currencySymbol})</th>
        </tr>
      </thead>
      <tbody>
        <tr class="bold-row">
          <td>Gross Turnover / Revenue (Excl. VAT)</td>
          <td>${currencySymbol}${y1.grossTurnoverExVat.toLocaleString()}</td>
          <td>${currencySymbol}${y2.grossTurnoverExVat.toLocaleString()}</td>
          <td>${currencySymbol}${y3.grossTurnoverExVat.toLocaleString()}</td>
          <td>${currencySymbol}${tot.grossTurnoverExVat.toLocaleString()}</td>
        </tr>
        <tr>
          <td>↳ Of Which: International Export Turnover (${step1Data.exportRevenueSharePercent}% Share)</td>
          <td>${currencySymbol}${y1.exportTurnoverExVat.toLocaleString()}</td>
          <td>${currencySymbol}${y2.exportTurnoverExVat.toLocaleString()}</td>
          <td>${currencySymbol}${y3.exportTurnoverExVat.toLocaleString()}</td>
          <td>${currencySymbol}${tot.exportTurnoverExVat.toLocaleString()}</td>
        </tr>
        <tr>
          <td>Less: Direct COGS, Fulfilment &amp; Merchant Card Fees</td>
          <td class="neg">-${currencySymbol}${y1.directCogsAndFees.toLocaleString()}</td>
          <td class="neg">-${currencySymbol}${y2.directCogsAndFees.toLocaleString()}</td>
          <td class="neg">-${currencySymbol}${y3.directCogsAndFees.toLocaleString()}</td>
          <td class="neg">-${currencySymbol}${tot.directCogsAndFees.toLocaleString()}</td>
        </tr>
        <tr class="emerald-row">
          <td>Gross Profit (${y1.grossMarginPercent}% Y1 / ${y2.grossMarginPercent}% Y2 / ${y3.grossMarginPercent}% Y3 Margin)</td>
          <td>${currencySymbol}${y1.grossProfit.toLocaleString()}</td>
          <td>${currencySymbol}${y2.grossProfit.toLocaleString()}</td>
          <td>${currencySymbol}${y3.grossProfit.toLocaleString()}</td>
          <td>${currencySymbol}${tot.grossProfit.toLocaleString()} (${tot.grossMarginPercent}%)</td>
        </tr>
        <tr>
          <td>Less: Team Wages, Founder Drawings &amp; Employer ${isUK ? 'NIC/Pension' : 'PRSI'} (${step1Data.employerPayrollTaxRatePercent}%)</td>
          <td class="neg">-${currencySymbol}${y1.payrollAndDrawingsTotal.toLocaleString()}</td>
          <td class="neg">-${currencySymbol}${y2.payrollAndDrawingsTotal.toLocaleString()}</td>
          <td class="neg">-${currencySymbol}${y3.payrollAndDrawingsTotal.toLocaleString()}</td>
          <td class="neg">-${currencySymbol}${tot.payrollAndDrawingsTotal.toLocaleString()}</td>
        </tr>
        <tr>
          <td>Less: Fixed Administrative &amp; Operating Overheads (OpEx)</td>
          <td class="neg">-${currencySymbol}${y1.fixedOverheadsOpEx.toLocaleString()}</td>
          <td class="neg">-${currencySymbol}${y2.fixedOverheadsOpEx.toLocaleString()}</td>
          <td class="neg">-${currencySymbol}${y3.fixedOverheadsOpEx.toLocaleString()}</td>
          <td class="neg">-${currencySymbol}${tot.fixedOverheadsOpEx.toLocaleString()}</td>
        </tr>
        <tr class="indigo-row">
          <td>EBITDA (Operating Profit / Loss Before Write-Offs &amp; Tax)</td>
          <td>${currencySymbol}${y1.ebitda.toLocaleString()}</td>
          <td>${currencySymbol}${y2.ebitda.toLocaleString()}</td>
          <td>${currencySymbol}${y3.ebitda.toLocaleString()}</td>
          <td>${currencySymbol}${tot.ebitda.toLocaleString()}</td>
        </tr>
        <tr>
          <td>Less: CapEx Equipment Depreciation (3-Yr Straight-Line) &amp; Loan Interest</td>
          <td class="neg">-${currencySymbol}${(y1.capExDepreciation + y1.loanInterestExpense).toLocaleString()}</td>
          <td class="neg">-${currencySymbol}${(y2.capExDepreciation + y2.loanInterestExpense).toLocaleString()}</td>
          <td class="neg">-${currencySymbol}${(y3.capExDepreciation + y3.loanInterestExpense).toLocaleString()}</td>
          <td class="neg">-${currencySymbol}${(tot.capExDepreciation + tot.loanInterestExpense).toLocaleString()}</td>
        </tr>
        <tr>
          <td>Less: Corporation Tax Provision (${step1Data.corporationTaxRatePercent}%)</td>
          <td class="neg">-${currencySymbol}${y1.corporationTax.toLocaleString()}</td>
          <td class="neg">-${currencySymbol}${y2.corporationTax.toLocaleString()}</td>
          <td class="neg">-${currencySymbol}${y3.corporationTax.toLocaleString()}</td>
          <td class="neg">-${currencySymbol}${tot.corporationTax.toLocaleString()}</td>
        </tr>
        <tr class="emerald-row">
          <td>Retained Net Profit / (Loss) After Tax (Bottom-Line PAT)</td>
          <td>${currencySymbol}${y1.netProfitAfterTax.toLocaleString()}</td>
          <td>${currencySymbol}${y2.netProfitAfterTax.toLocaleString()}</td>
          <td>${currencySymbol}${y3.netProfitAfterTax.toLocaleString()}</td>
          <td>${currencySymbol}${tot.netProfitAfterTax.toLocaleString()}</td>
        </tr>
      </tbody>
    </table>

    <h2>3. Capital Stack, Grant Arrears Bridge &amp; 12-Quarter (Q1–Q12) Cashflow Schedule</h2>
    <div class="two-col">
      <div>
        <h3>3A. Capital Stack &amp; Grant Reimbursement Bridge</h3>
        <table>
          <thead class="sub-th">
            <tr>
              <th>Funding Source</th>
              <th>Disbursement Timing</th>
              <th>Amount (${currencySymbol})</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Starting Cash on Hand (Day 1)</td>
              <td style="text-align:left;">Immediate (Month 1)</td>
              <td>${currencySymbol}${(Number(step3Data.startingCashBalanceDay1) || 0).toLocaleString()}</td>
            </tr>
            ${step3Data.fundingSources
              .map(
                (s) => `<tr>
              <td>${escapeHtml(s.label)}</td>
              <td style="text-align:left;">${
                s.isReimbursementArrears
                  ? `Arrears (${s.reimbursementLagMonths}mo Lag)`
                  : 'Upfront (Month 1)'
              }</td>
              <td>${currencySymbol}${(Number(s.amount) || 0).toLocaleString()}</td>
            </tr>`
              )
              .join('')}
            <tr class="bold-row">
              <td>Total Stacked Funding &amp; Cash</td>
              <td style="text-align:left;">Grant Arrears: ${currencySymbol}${step3Metrics.reimbursedGrantTotal.toLocaleString()}</td>
              <td>${currencySymbol}${step3Metrics.totalStackedFunding.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div>
        <h3>3B. 3-Year Closing Cash &amp; Working Capital Summary</h3>
        <table>
          <thead class="sub-th">
            <tr>
              <th>Liquidity Metric</th>
              <th>Year 1</th>
              <th>Year 2</th>
              <th>Year 3</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Customer Cash Collected</td>
              <td class="pos">+${currencySymbol}${y1.cashInflowsTotal.toLocaleString()}</td>
              <td class="pos">+${currencySymbol}${y2.cashInflowsTotal.toLocaleString()}</td>
              <td class="pos">+${currencySymbol}${y3.cashInflowsTotal.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Capital &amp; Grant Drawdown</td>
              <td class="pos">+${currencySymbol}${y1.fundingAndGrantsInflow.toLocaleString()}</td>
              <td class="pos">+${currencySymbol}${y2.fundingAndGrantsInflow.toLocaleString()}</td>
              <td class="pos">+${currencySymbol}${y3.fundingAndGrantsInflow.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Operating, Tax &amp; Debt Outflow</td>
              <td class="neg">-${currencySymbol}${y1.cashOutflowsOperating.toLocaleString()}</td>
              <td class="neg">-${currencySymbol}${y2.cashOutflowsOperating.toLocaleString()}</td>
              <td class="neg">-${currencySymbol}${y3.cashOutflowsOperating.toLocaleString()}</td>
            </tr>
            <tr class="indigo-row">
              <td>Closing Bank Balance (End of Year)</td>
              <td>${y1.endingBankBalance < 0 ? '-' : ''}${currencySymbol}${Math.abs(y1.endingBankBalance).toLocaleString()}</td>
              <td>${y2.endingBankBalance < 0 ? '-' : ''}${currencySymbol}${Math.abs(y2.endingBankBalance).toLocaleString()}</td>
              <td>${y3.endingBankBalance < 0 ? '-' : ''}${currencySymbol}${Math.abs(y3.endingBankBalance).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <h3>3C. 12-Quarter (Y1 Q1 – Y3 Q4) Cashflow &amp; Ending Bank Balance Schedule</h3>
    <table>
      <thead>
        <tr>
          <th>Quarter</th>
          <th>Invoiced Sales (${currencySymbol})</th>
          <th>Customer Cash Collected (${currencySymbol})</th>
          <th>Funding &amp; Grant Inflow (${currencySymbol})</th>
          <th>Operating, Tax &amp; Loan Outflow (${currencySymbol})</th>
          <th>Ending Bank Balance (${currencySymbol})</th>
        </tr>
      </thead>
      <tbody>
        ${step4Metrics.quarterlyStressedSchedule
          .map(
            (q) => `<tr>
          <td><strong>${escapeHtml(q.yearLabel)} (${escapeHtml(q.label)})</strong></td>
          <td>${currencySymbol}${q.invoicedRevenue.toLocaleString()}</td>
          <td class="pos">+${currencySymbol}${q.cashCollected.toLocaleString()}</td>
          <td class="pos">+${currencySymbol}${q.fundingAndGrantInflow.toLocaleString()}</td>
          <td class="neg">-${currencySymbol}${q.operatingOutflow.toLocaleString()}</td>
          <td class="${q.endingBankBalance >= 0 ? 'bold-row' : 'neg bold-row'}">${q.endingBankBalance < 0 ? '-' : ''}${currencySymbol}${Math.abs(q.endingBankBalance).toLocaleString()}</td>
        </tr>`
          )
          .join('')}
      </tbody>
    </table>

    <h2>4. Itemized Operating Overheads, Payroll &amp; Statutory Tax Auto-Pilot (Step 1)</h2>
    <table>
      <thead>
        <tr>
          <th>Plain-English Category</th>
          <th>Official Grant / Accountant Heading</th>
          <th>Monthly Y1 (${currencySymbol})</th>
          <th>Annual Y1 (${currencySymbol})</th>
          <th>Annual Y2 (${currencySymbol})</th>
          <th>Annual Y3 (${currencySymbol})</th>
          <th>Grant Tag</th>
        </tr>
      </thead>
      <tbody>
        ${step1Data.overheadLineItems
          .map((item) => {
            const y1Mo = Number(item.monthlyCostYear1) || 0;
            const y2Mo = Math.round(
              y1Mo * (1 + (Number(item.annualStepUpPercentYear2) || 0) / 100)
            );
            const y3Mo = Math.round(
              y2Mo * (1 + (Number(item.annualStepUpPercentYear3) || 0) / 100)
            );
            return `<tr>
          <td>${escapeHtml(item.plainEnglishLabel)}</td>
          <td style="text-align:left;">${escapeHtml(item.accountantLabel)}</td>
          <td>${currencySymbol}${y1Mo.toLocaleString()}</td>
          <td>${currencySymbol}${(y1Mo * 12).toLocaleString()}</td>
          <td>${currencySymbol}${(y2Mo * 12).toLocaleString()}</td>
          <td>${currencySymbol}${(y3Mo * 12).toLocaleString()}</td>
          <td style="text-align:left;font-size:10px;">${escapeHtml(item.grantEligibilityTag)}</td>
        </tr>`;
          })
          .join('')}
        <tr class="bold-row">
          <td>Founder Survival / Living Drawings</td>
          <td style="text-align:left;">Directors Remuneration / Drawings (Module F)</td>
          <td>${currencySymbol}${step1Data.monthlyFounderDrawingsYear1.toLocaleString()}</td>
          <td>${currencySymbol}${(step1Data.monthlyFounderDrawingsYear1 * 12).toLocaleString()}</td>
          <td>${currencySymbol}${(step1Data.monthlyFounderDrawingsYear1 * 12).toLocaleString()}</td>
          <td>${currencySymbol}${(step1Data.monthlyFounderDrawingsYear1 * 12).toLocaleString()}</td>
          <td style="text-align:left;font-size:10px;">WORKING_CAPITAL</td>
        </tr>
        <tr class="bold-row">
          <td>Team Gross Wages &amp; Salaries</td>
          <td style="text-align:left;">Gross PAYE Wages &amp; Contractors (Module F)</td>
          <td>${currencySymbol}${step1Data.monthlyTeamSalariesYear1.toLocaleString()}</td>
          <td>${currencySymbol}${(step1Data.monthlyTeamSalariesYear1 * 12).toLocaleString()}</td>
          <td>${currencySymbol}${(step1Data.monthlyTeamSalariesYear2 * 12).toLocaleString()}</td>
          <td>${currencySymbol}${(step1Data.monthlyTeamSalariesYear3 * 12).toLocaleString()}</td>
          <td style="text-align:left;font-size:10px;">EMPLOYMENT_GRANT</td>
        </tr>
        <tr class="indigo-row">
          <td>Employer Payroll Tax Auto-Pilot (${step1Data.employerPayrollTaxRatePercent}%)</td>
          <td style="text-align:left;">${isUK ? 'Employer Class 1 NIC (13.8%) + Pension (3%)' : 'Irish Employer PRSI (11.15%)'}</td>
          <td>${currencySymbol}${step1Metrics.monthlyEmployerTaxY1.toLocaleString()}</td>
          <td>${currencySymbol}${(step1Metrics.monthlyEmployerTaxY1 * 12).toLocaleString()}</td>
          <td>${currencySymbol}${(step1Metrics.monthlyEmployerTaxY2 * 12).toLocaleString()}</td>
          <td>${currencySymbol}${(step1Metrics.monthlyEmployerTaxY3 * 12).toLocaleString()}</td>
          <td style="text-align:left;font-size:10px;">STATUTORY_TAX</td>
        </tr>
      </tbody>
    </table>

    <h2>5. Written Financial Assumptions &amp; Corporate / IP Readiness</h2>
    <div class="two-col">
      <div class="card">
        <strong>Overheads &amp; Tax Posture (${escapeHtml(step1Data.vatRegistrationStrategy)}):</strong><br/>
        ${escapeHtml(step1Data.overheadsAndTaxNarrative)}
        <br/><br/>
        <strong>Working Capital &amp; Payment Timing (${step2Metrics.effectiveDebtorDays} Debtor Days, Month ${step2Data.monthToStartRevenue} Revenue Start):</strong><br/>
        ${escapeHtml(step2Data.workingCapitalNarrative)}
      </div>
      <div class="card">
        <strong>Capital Stack &amp; Grant Arrears Bridge:</strong><br/>
        ${escapeHtml(step3Data.fundingGapNarrative)}
        <br/><br/>
        <strong>3-Year P&amp;L &amp; Stress-Test Assumptions:</strong><br/>
        ${escapeHtml(step4Data.writtenFinancialAssumptionsBlock)}
        <br/><br/>
        <strong>Corporate, Banking &amp; IP Assignment Status:</strong> ${escapeHtml(corpIpLabel)}${
      step4Data.corporateIpPlaceholderNotes
        ? ` — ${escapeHtml(step4Data.corporateIpPlaceholderNotes)}`
        : ''
    }
      </div>
    </div>

    <h2>6. Things to Consider — Financial Underwriting Blind-Spot Audit</h2>
    ${step5Data.blindSpots
      .map((b) => {
        const cls =
          b.severity === 'CRITICAL'
            ? 'bs-crit'
            : b.severity === 'WARNING'
            ? 'bs-warn'
            : 'bs-info';
        return `<div class="card ${cls}"><strong>[${escapeHtml(b.severity)}] ${escapeHtml(b.title)}</strong><br/>${escapeHtml(b.description)}<br/><em>Recommended Action: ${escapeHtml(b.actionableFix)}</em></div>`;
      })
      .join('')}

    <div class="footer">
      <span>Generated by Startup Preflight 2.0 • Module J (3-Year Financials, 36-Month Cashflow &amp; Tax Auto-Pilot)</span>
      <span>Tip: Pair this brief with your exported .xls workbook for LEO, Enterprise Ireland, Innovate UK, or Start Up Loans</span>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeTitle}_Module_J_Executive_Brief.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export Step 1 + 3-Year Baseline as Excel (.xls SpreadsheetML) or Google Sheets (.csv)
  const handleExportSpreadsheet = (format: 'XLS' | 'CSV') => {
    if (typeof window === 'undefined') return;
    const safeTitle = (plan.title || 'Startup_Plan').replace(/[^a-zA-Z0-9_-]/g, '_');

    if (format === 'CSV') {
      const rows: string[][] = [
        ['Startup Preflight 2.0 - Module J Grant Financial Schedule', plan.title || ''],
        ['Country / Tax Jurisdiction', effectiveCountry, 'Currency', currencyCode],
        ['View Mode', isPlainMode ? 'Plain-English Founder View' : 'Official Grant & Accountant View'],
        [],
        ['CATEGORY (PLAIN ENGLISH)', 'OFFICIAL GRANT / ACCOUNTANT HEADING', 'SOURCE MODULE', 'MONTHLY Y1', 'ANNUAL Y1', 'ANNUAL Y2', 'ANNUAL Y3', 'GRANT TAG'],
      ];

      for (const item of step1Data.overheadLineItems) {
        const y1Mo = Number(item.monthlyCostYear1) || 0;
        const y2Mo = Math.round(y1Mo * (1 + (Number(item.annualStepUpPercentYear2) || 0) / 100));
        const y3Mo = Math.round(y2Mo * (1 + (Number(item.annualStepUpPercentYear3) || 0) / 100));
        rows.push([
          item.plainEnglishLabel,
          item.accountantLabel,
          item.sourceModuleLabel,
          String(y1Mo),
          String(y1Mo * 12),
          String(y2Mo * 12),
          String(y3Mo * 12),
          item.grantEligibilityTag,
        ]);
      }

      rows.push([]);
      rows.push([
        'Founder Living / Survival Drawings',
        'Directors Drawings / Remuneration',
        'Module F',
        String(step1Data.monthlyFounderDrawingsYear1),
        String(step1Data.monthlyFounderDrawingsYear1 * 12),
        String(step1Data.monthlyFounderDrawingsYear1 * 12),
        String(step1Data.monthlyFounderDrawingsYear1 * 12),
        'WORKING_CAPITAL',
      ]);
      rows.push([
        'Team Gross Wages & Salaries',
        'Gross PAYE Wages & Contractor Fees',
        'Module F',
        String(step1Data.monthlyTeamSalariesYear1),
        String(step1Data.monthlyTeamSalariesYear1 * 12),
        String(step1Data.monthlyTeamSalariesYear2 * 12),
        String(step1Data.monthlyTeamSalariesYear3 * 12),
        'ELIGIBLE_EMPLOYMENT_GRANT',
      ]);
      rows.push([
        `Employer Payroll Taxes (${step1Data.employerPayrollTaxRatePercent}%)`,
        isUK ? 'Employer Class 1 NIC & Pension' : 'Employer PRSI Contribution (11.15%)',
        'Module J Tax Auto-Pilot',
        String(step1Metrics.monthlyEmployerTaxY1),
        String(step1Metrics.monthlyEmployerTaxY1 * 12),
        String(step1Metrics.monthlyEmployerTaxY2 * 12),
        String(step1Metrics.monthlyEmployerTaxY3 * 12),
        'STATUTORY_TAX',
      ]);
      rows.push([
        'Total Monthly Burn (Keep the Lights On)',
        'Total Fixed OpEx + Payroll Outflow',
        'Calculated',
        String(step1Metrics.totalMonthlyBurnY1),
        String(step1Metrics.totalMonthlyBurnY1 * 12),
        String(
          (step1Metrics.monthlyFixedOpExY2 +
            step1Data.monthlyFounderDrawingsYear1 +
            step1Data.monthlyTeamSalariesYear2 +
            step1Metrics.monthlyEmployerTaxY2) *
            12
        ),
        String(
          (step1Metrics.monthlyFixedOpExY3 +
            step1Data.monthlyFounderDrawingsYear1 +
            step1Data.monthlyTeamSalariesYear3 +
            step1Metrics.monthlyEmployerTaxY3) *
            12
        ),
        'TOTAL_OUTFLOW',
      ]);

      rows.push([]);
      rows.push(['STEP 2: WORKING CAPITAL, PAYMENT TIMING & 12-MONTH CASH COLLECTION SCHEDULE']);
      rows.push([
        'Customer Collection Terms',
        step2Data.customerCollectionTiming,
        'Debtor Days',
        String(step2Metrics.effectiveDebtorDays),
        'Peak Working Capital Lockup',
        String(step2Metrics.peakWorkingCapitalLockup),
        'Y1 Cash Collection Efficiency',
        `${step2Metrics.year1CashCollectionEfficiencyPercent}%`,
      ]);
      rows.push(['MONTH', 'CUSTOMERS', 'PAPER SALES INVOICED', 'ACTUAL CASH COLLECTED IN BANK', 'DIRECT COGS OUTFLOW']);
      for (const mRow of step2Metrics.monthlySchedule) {
        rows.push([
          `Month ${mRow.month}`,
          String(mRow.customers),
          String(mRow.invoicedRevenue),
          String(mRow.cashCollected),
          String(mRow.directCogsOutflow),
        ]);
      }

      rows.push([]);
      rows.push(['STEP 3: 36-MONTH CASHFLOW TROUGH, CAPITAL STACK & 12-QUARTER BANK SCHEDULE']);
      rows.push([
        'Pre-Funding Operating Cash Trough',
        String(step3Metrics.operatingCashTroughAmount),
        'Trough Month',
        `Month ${step3Metrics.operatingCashTroughMonth}`,
        'Recommended Capital Raise (+Buffer)',
        String(step3Metrics.recommendedCapitalRaise),
        'Total Stacked Funding',
        String(step3Metrics.totalStackedFunding),
      ]);
      rows.push(['QUARTER', 'CUSTOMER CASH INFLOW', 'OPERATING & DEBT OUTFLOW', 'FUNDING & GRANT INFLOW', 'PRE-FUNDING OPERATING CASH', 'ENDING BANK BALANCE']);
      for (const qRow of step3Metrics.quarterlySchedule) {
        rows.push([
          qRow.yearLabel,
          String(qRow.cashInflow),
          String(qRow.operatingOutflow),
          String(qRow.grantAndFundingInflow),
          String(qRow.endingOperatingCash),
          String(qRow.endingFundedBankBalance),
        ]);
      }

      rows.push([]);
      rows.push(['STEP 4: OFFICIAL 3-YEAR PROFIT & LOSS (INCOME STATEMENT) SCHEDULE']);
      rows.push([
        'Active Sensitivity Scenario',
        step4Metrics.scenarioPreset.accountantTitle,
        'Export Share %',
        `${step1Data.exportRevenueSharePercent}%`,
        'Lowest Stressed Bank Balance',
        String(step4Metrics.lowestStressedBankBalance),
      ]);
      rows.push(['P&L LINE ITEM (PLAIN ENGLISH)', 'OFFICIAL ACCOUNTANT / GRANT HEADING', 'YEAR 1', 'YEAR 2', 'YEAR 3', '3-YEAR TOTAL']);
      const [y1, y2, y3] = step4Metrics.pnlYears;
      const tot = step4Metrics.totals3Year;
      rows.push(['Total Sales Invoiced (Excl. VAT)', 'Gross Turnover / Revenue (Net of VAT)', String(y1.grossTurnoverExVat), String(y2.grossTurnoverExVat), String(y3.grossTurnoverExVat), String(tot.grossTurnoverExVat)]);
      rows.push(['Of Which: International / Export Sales', `Export Turnover (${step1Data.exportRevenueSharePercent}%)`, String(y1.exportTurnoverExVat), String(y2.exportTurnoverExVat), String(y3.exportTurnoverExVat), String(tot.exportTurnoverExVat)]);
      rows.push(['Less: Product Delivery & Card Fees', 'Cost of Goods Sold (COGS) & Merchant Fees', String(y1.directCogsAndFees), String(y2.directCogsAndFees), String(y3.directCogsAndFees), String(tot.directCogsAndFees)]);
      rows.push(['Gross Profit (Money Left After Delivery)', 'Gross Profit', String(y1.grossProfit), String(y2.grossProfit), String(y3.grossProfit), String(tot.grossProfit)]);
      rows.push(['Less: Team Wages, Founder Pay & Payroll Tax', 'Directors Remuneration, PAYE Wages & Employer PRSI/NIC', String(y1.payrollAndDrawingsTotal), String(y2.payrollAndDrawingsTotal), String(y3.payrollAndDrawingsTotal), String(tot.payrollAndDrawingsTotal)]);
      rows.push(['Less: Fixed Running Bills (Rent, Software, Ads)', 'Administrative & Operating Overheads (OpEx)', String(y1.fixedOverheadsOpEx), String(y2.fixedOverheadsOpEx), String(y3.fixedOverheadsOpEx), String(tot.fixedOverheadsOpEx)]);
      rows.push(['Operating Profit Before Write-Offs & Tax', 'EBITDA (Operating Profit / Loss)', String(y1.ebitda), String(y2.ebitda), String(y3.ebitda), String(tot.ebitda)]);
      rows.push(['Less: Equipment Write-Off & Loan Interest', 'CapEx Depreciation (3-Yr) & Debt Interest', String(y1.capExDepreciation + y1.loanInterestExpense), String(y2.capExDepreciation + y2.loanInterestExpense), String(y3.capExDepreciation + y3.loanInterestExpense), String(tot.capExDepreciation + tot.loanInterestExpense)]);
      rows.push(['Profit Before Company Tax', 'Net Profit / (Loss) Before Tax (PBT)', String(y1.profitBeforeTax), String(y2.profitBeforeTax), String(y3.profitBeforeTax), String(tot.profitBeforeTax)]);
      rows.push([`Less: Company Profit Tax (${step1Data.corporationTaxRatePercent}%)`, `Corporation Tax Provision (${step1Data.corporationTaxRatePercent}%)`, String(y1.corporationTax), String(y2.corporationTax), String(y3.corporationTax), String(tot.corporationTax)]);
      rows.push(['Bottom-Line Profit Kept in Business', 'Retained Net Profit / (Loss) After Tax (PAT)', String(y1.netProfitAfterTax), String(y2.netProfitAfterTax), String(y3.netProfitAfterTax), String(tot.netProfitAfterTax)]);

      rows.push([]);
      rows.push(['STEP 4B: FULL 36-MONTH (M1-M36) CASHFLOW STATEMENT SCHEDULE']);
      rows.push(['MONTH', 'YEAR', 'INVOICED SALES', 'CASH COLLECTED', 'DIRECT COGS', 'FIXED OPEX', 'PAYROLL & TAX', 'CAPEX & STOCK', 'LOAN REPAYMENT', 'FUNDING & GRANTS', 'ENDING BANK BALANCE']);
      for (const mRow of step4Metrics.stressedMonths) {
        rows.push([
          `Month ${mRow.month}`,
          `Year ${mRow.year}`,
          String(mRow.invoicedRevenue),
          String(mRow.cashCollected),
          String(mRow.directCogsOutflow),
          String(mRow.fixedOpExOutflow),
          String(mRow.payrollAndTaxOutflow),
          String(mRow.oneOffCapExAndStockOutflow),
          String(mRow.loanRepaymentOutflow),
          String(mRow.upfrontFundingInflow + mRow.grantReimbursementInflow),
          String(mRow.fundedBankBalance),
        ]);
      }

      rows.push([]);
      rows.push(['STEP 5: EXECUTIVE FINANCIAL SUMMARY & UNDERWRITER BLIND-SPOT AUDIT']);
      rows.push(['Readiness Posture', step5Data.financeReadinessConfidence, step5Data.otherReadinessConfidenceText || '']);
      rows.push(['Executive Financial Summary', step5Data.executiveFinancialSummaryNarrative]);
      rows.push(['SEVERITY', 'BLIND-SPOT TITLE', 'DESCRIPTION', 'RECOMMENDED ACTION']);
      for (const spot of step5Data.blindSpots) {
        rows.push([spot.severity, spot.title, spot.description, spot.actionableFix]);
      }

      const csvContent = rows
        .map((r) => r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeTitle}_Module_J_Financials_Google_Sheets.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }

    // Multi-compatible Excel HTML/XML workbook (.xls) that opens directly in Excel, Numbers & Google Drive
    const htmlWorkbook = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8" /><title>${plan.title || 'Financial Model'}</title></head>
<body>
  <h2>${plan.title || 'Startup Plan'} — Module J Grant-Ready Financial Schedule (${effectiveCountry} • ${currencyCode})</h2>
  <p><strong>Tax &amp; VAT Posture:</strong> Employer Tax ${step1Data.employerPayrollTaxRatePercent}% | Corp Tax ${step1Data.corporationTaxRatePercent}% | VAT ${step1Data.standardVatRatePercent}% (${step1Data.vatRegistrationStrategy}) | Export Target: ${step1Data.exportRevenueSharePercent}%</p>
  <table border="1" cellpadding="6" cellspacing="0">
    <thead>
      <tr style="background:#1e1b4b;color:#ffffff;font-weight:bold;">
        <th>Plain-English Description</th>
        <th>Official Grant / Accountant Heading</th>
        <th>Upstream Source</th>
        <th>Monthly Year 1 (${currencySymbol})</th>
        <th>Annual Year 1 (${currencySymbol})</th>
        <th>Annual Year 2 (${currencySymbol})</th>
        <th>Annual Year 3 (${currencySymbol})</th>
        <th>Grant Eligibility</th>
      </tr>
    </thead>
    <tbody>
      ${step1Data.overheadLineItems
        .map((item) => {
          const y1Mo = Number(item.monthlyCostYear1) || 0;
          const y2Mo = Math.round(
            y1Mo * (1 + (Number(item.annualStepUpPercentYear2) || 0) / 100)
          );
          const y3Mo = Math.round(
            y2Mo * (1 + (Number(item.annualStepUpPercentYear3) || 0) / 100)
          );
          return `<tr>
            <td>${item.plainEnglishLabel}</td>
            <td>${item.accountantLabel}</td>
            <td>${item.sourceModuleLabel}</td>
            <td>${y1Mo}</td>
            <td>${y1Mo * 12}</td>
            <td>${y2Mo * 12}</td>
            <td>${y3Mo * 12}</td>
            <td>${item.grantEligibilityTag}</td>
          </tr>`;
        })
        .join('')}
      <tr style="background:#f1f5f9;font-weight:bold;">
        <td>Founder Living / Survival Drawings</td>
        <td>Directors Remuneration / Drawings</td>
        <td>Module F (Survival Budget)</td>
        <td>${step1Data.monthlyFounderDrawingsYear1}</td>
        <td>${step1Data.monthlyFounderDrawingsYear1 * 12}</td>
        <td>${step1Data.monthlyFounderDrawingsYear1 * 12}</td>
        <td>${step1Data.monthlyFounderDrawingsYear1 * 12}</td>
        <td>WORKING_CAPITAL</td>
      </tr>
      <tr style="background:#f1f5f9;font-weight:bold;">
        <td>Team Gross Wages &amp; Salaries</td>
        <td>Gross PAYE Salaries &amp; Contractors</td>
        <td>Module F (3-Year Hiring Plan)</td>
        <td>${step1Data.monthlyTeamSalariesYear1}</td>
        <td>${step1Data.monthlyTeamSalariesYear1 * 12}</td>
        <td>${step1Data.monthlyTeamSalariesYear2 * 12}</td>
        <td>${step1Data.monthlyTeamSalariesYear3 * 12}</td>
        <td>ELIGIBLE_EMPLOYMENT_GRANT</td>
      </tr>
      <tr style="background:#eef2ff;font-weight:bold;">
        <td>Employer Payroll Taxes (${step1Data.employerPayrollTaxRatePercent}%)</td>
        <td>${isUK ? 'Employer Class 1 NIC (13.8%) + Pension (3%)' : 'Employer PRSI (11.15%)'}</td>
        <td>Module J Tax Auto-Pilot</td>
        <td>${step1Metrics.monthlyEmployerTaxY1}</td>
        <td>${step1Metrics.monthlyEmployerTaxY1 * 12}</td>
        <td>${step1Metrics.monthlyEmployerTaxY2 * 12}</td>
        <td>${step1Metrics.monthlyEmployerTaxY3 * 12}</td>
        <td>STATUTORY_TAX</td>
      </tr>
    </tbody>
  </table>
  <h3>Written Financial &amp; Tax Assumptions</h3>
  <p>${step1Data.overheadsAndTaxNarrative || 'Auto-calibrated from Modules D–I.'}</p>
  <h3>Step 2: Working Capital, Debtor Days &amp; 12-Month Cash Collection Schedule</h3>
  <p><strong>Debtor Days:</strong> ${step2Metrics.effectiveDebtorDays} days (${step2Data.customerCollectionTiming}) | <strong>Inventory Buffer:</strong> ${step2Data.upfrontStockMonthsBuffer} months | <strong>First Revenue Month:</strong> Month ${step2Data.monthToStartRevenue} | <strong>Peak Working Capital Lockup:</strong> ${currencySymbol}${step2Metrics.peakWorkingCapitalLockup.toLocaleString()}</p>
  <table border="1" cellpadding="6" cellspacing="0">
    <thead>
      <tr style="background:#0f172a;color:#ffffff;font-weight:bold;">
        <th>Month (Year 1)</th>
        <th>Active / Billed Customers</th>
        <th>Paper Sales Invoiced (${currencySymbol})</th>
        <th>Actual Cash Collected in Bank (${currencySymbol})</th>
        <th>Direct Variable COGS (${currencySymbol})</th>
      </tr>
    </thead>
    <tbody>
      ${step2Metrics.monthlySchedule
        .map(
          (mRow) => `<tr>
            <td>Month ${mRow.month}</td>
            <td>${mRow.customers}</td>
            <td>${mRow.invoicedRevenue}</td>
            <td>${mRow.cashCollected}</td>
            <td>${mRow.directCogsOutflow}</td>
          </tr>`
        )
        .join('')}
      <tr style="background:#eef2ff;font-weight:bold;">
        <td>Total Year 1</td>
        <td>-</td>
        <td>${step2Metrics.totalInvoicedY1}</td>
        <td>${step2Metrics.totalCashCollectedY1}</td>
        <td>${step2Metrics.monthlySchedule.reduce((s, r) => s + r.directCogsOutflow, 0)}</td>
      </tr>
    </tbody>
  </table>
  <p>${step2Data.workingCapitalNarrative || ''}</p>
  <h3>Step 3: 36-Month Cashflow Trough, Capital Stack &amp; 12-Quarter Bank Schedule</h3>
  <p><strong>Pre-Funding Cash Trough:</strong> ${currencySymbol}${step3Metrics.operatingCashTroughAmount.toLocaleString()} (Month ${step3Metrics.operatingCashTroughMonth}) | <strong>Recommended Capital Raise (+${step3Data.safetyBufferPercent}% Buffer):</strong> ${currencySymbol}${step3Metrics.recommendedCapitalRaise.toLocaleString()} | <strong>Total Stacked Funding:</strong> ${currencySymbol}${step3Metrics.totalStackedFunding.toLocaleString()}</p>
  <table border="1" cellpadding="6" cellspacing="0">
    <thead>
      <tr style="background:#1e1b4b;color:#ffffff;font-weight:bold;">
        <th>Quarter (Years 1–3)</th>
        <th>Customer Cash Inflow (${currencySymbol})</th>
        <th>Total Operating &amp; Loan Outflow (${currencySymbol})</th>
        <th>Capital &amp; Grant Drawdown (${currencySymbol})</th>
        <th>Pre-Funding Operating Cash (${currencySymbol})</th>
        <th>Ending Bank Balance (${currencySymbol})</th>
      </tr>
    </thead>
    <tbody>
      ${step3Metrics.quarterlySchedule
        .map(
          (qRow) => `<tr>
            <td>${qRow.yearLabel} (${qRow.label})</td>
            <td>${qRow.cashInflow}</td>
            <td>${qRow.operatingOutflow}</td>
            <td>${qRow.grantAndFundingInflow}</td>
            <td>${qRow.endingOperatingCash}</td>
            <td><strong>${qRow.endingFundedBankBalance}</strong></td>
          </tr>`
        )
        .join('')}
    </tbody>
  </table>
  <p>${step3Data.fundingGapNarrative || ''}</p>
  <h3>Step 4: Official 3-Year Profit &amp; Loss (Income Statement) Schedule (${step4Metrics.scenarioPreset.accountantTitle})</h3>
  <table border="1" cellpadding="6" cellspacing="0">
    <thead>
      <tr style="background:#0f172a;color:#ffffff;font-weight:bold;">
        <th>Plain-English Description</th>
        <th>Official Grant / Accountant Heading</th>
        <th>Year 1 (${currencySymbol})</th>
        <th>Year 2 (${currencySymbol})</th>
        <th>Year 3 (${currencySymbol})</th>
        <th>3-Year Total (${currencySymbol})</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Total Sales Invoiced (Excl. VAT)</td>
        <td>Gross Turnover / Revenue (Net of VAT)</td>
        <td><strong>${step4Metrics.pnlYears[0].grossTurnoverExVat}</strong></td>
        <td><strong>${step4Metrics.pnlYears[1].grossTurnoverExVat}</strong></td>
        <td><strong>${step4Metrics.pnlYears[2].grossTurnoverExVat}</strong></td>
        <td><strong>${step4Metrics.totals3Year.grossTurnoverExVat}</strong></td>
      </tr>
      <tr style="background:#f8fafc;">
        <td>Of Which: International / Export Sales (${step1Data.exportRevenueSharePercent}%)</td>
        <td>Export Turnover (${step1Data.exportRevenueSharePercent}% Share)</td>
        <td>${step4Metrics.pnlYears[0].exportTurnoverExVat}</td>
        <td>${step4Metrics.pnlYears[1].exportTurnoverExVat}</td>
        <td>${step4Metrics.pnlYears[2].exportTurnoverExVat}</td>
        <td>${step4Metrics.totals3Year.exportTurnoverExVat}</td>
      </tr>
      <tr>
        <td>Less: Product Delivery &amp; Card Fees</td>
        <td>Cost of Goods Sold (COGS) &amp; Merchant Fees</td>
        <td>-${step4Metrics.pnlYears[0].directCogsAndFees}</td>
        <td>-${step4Metrics.pnlYears[1].directCogsAndFees}</td>
        <td>-${step4Metrics.pnlYears[2].directCogsAndFees}</td>
        <td>-${step4Metrics.totals3Year.directCogsAndFees}</td>
      </tr>
      <tr style="background:#ecfdf5;font-weight:bold;">
        <td>Gross Profit (Money Left After Delivery)</td>
        <td>Gross Profit (${step4Metrics.pnlYears[2].grossMarginPercent}% Y3 Margin)</td>
        <td>${step4Metrics.pnlYears[0].grossProfit}</td>
        <td>${step4Metrics.pnlYears[1].grossProfit}</td>
        <td>${step4Metrics.pnlYears[2].grossProfit}</td>
        <td>${step4Metrics.totals3Year.grossProfit}</td>
      </tr>
      <tr>
        <td>Less: Team Wages, Founder Pay &amp; Payroll Tax</td>
        <td>Directors Remuneration, PAYE Wages &amp; Employer PRSI/NIC</td>
        <td>-${step4Metrics.pnlYears[0].payrollAndDrawingsTotal}</td>
        <td>-${step4Metrics.pnlYears[1].payrollAndDrawingsTotal}</td>
        <td>-${step4Metrics.pnlYears[2].payrollAndDrawingsTotal}</td>
        <td>-${step4Metrics.totals3Year.payrollAndDrawingsTotal}</td>
      </tr>
      <tr>
        <td>Less: Fixed Running Bills (Rent, Software, Marketing, Admin)</td>
        <td>Administrative &amp; Operating Overheads (OpEx)</td>
        <td>-${step4Metrics.pnlYears[0].fixedOverheadsOpEx}</td>
        <td>-${step4Metrics.pnlYears[1].fixedOverheadsOpEx}</td>
        <td>-${step4Metrics.pnlYears[2].fixedOverheadsOpEx}</td>
        <td>-${step4Metrics.totals3Year.fixedOverheadsOpEx}</td>
      </tr>
      <tr style="background:#eef2ff;font-weight:bold;">
        <td>Operating Profit Before Write-Offs &amp; Tax</td>
        <td>EBITDA (Operating Profit / Loss)</td>
        <td>${step4Metrics.pnlYears[0].ebitda}</td>
        <td>${step4Metrics.pnlYears[1].ebitda}</td>
        <td>${step4Metrics.pnlYears[2].ebitda}</td>
        <td>${step4Metrics.totals3Year.ebitda}</td>
      </tr>
      <tr>
        <td>Less: Equipment Write-Off &amp; Loan Interest</td>
        <td>CapEx Depreciation (3-Yr) &amp; Debt Interest</td>
        <td>-${step4Metrics.pnlYears[0].capExDepreciation + step4Metrics.pnlYears[0].loanInterestExpense}</td>
        <td>-${step4Metrics.pnlYears[1].capExDepreciation + step4Metrics.pnlYears[1].loanInterestExpense}</td>
        <td>-${step4Metrics.pnlYears[2].capExDepreciation + step4Metrics.pnlYears[2].loanInterestExpense}</td>
        <td>-${step4Metrics.totals3Year.capExDepreciation + step4Metrics.totals3Year.loanInterestExpense}</td>
      </tr>
      <tr>
        <td>Less: Company Profit Tax (${step1Data.corporationTaxRatePercent}%)</td>
        <td>Corporation Tax Provision (${step1Data.corporationTaxRatePercent}%)</td>
        <td>-${step4Metrics.pnlYears[0].corporationTax}</td>
        <td>-${step4Metrics.pnlYears[1].corporationTax}</td>
        <td>-${step4Metrics.pnlYears[2].corporationTax}</td>
        <td>-${step4Metrics.totals3Year.corporationTax}</td>
      </tr>
      <tr style="background:#d1fae5;font-weight:bold;">
        <td>Bottom-Line Profit Kept in the Business</td>
        <td>Retained Net Profit / (Loss) After Tax (PAT)</td>
        <td>${step4Metrics.pnlYears[0].netProfitAfterTax}</td>
        <td>${step4Metrics.pnlYears[1].netProfitAfterTax}</td>
        <td>${step4Metrics.pnlYears[2].netProfitAfterTax}</td>
        <td>${step4Metrics.totals3Year.netProfitAfterTax}</td>
      </tr>
    </tbody>
  </table>
  <p>${step4Data.writtenFinancialAssumptionsBlock || ''}</p>
  <h3>Step 5: 1-Page Executive Financial Summary &amp; Underwriter Blind-Spot Audit</h3>
  <p><strong>Financial Readiness Posture:</strong> ${step5Data.financeReadinessConfidence}${step5Data.otherReadinessConfidenceText ? ` (${step5Data.otherReadinessConfidenceText})` : ''}</p>
  <p>${step5Data.executiveFinancialSummaryNarrative || ''}</p>
  <table border="1" cellpadding="6" cellspacing="0">
    <thead>
      <tr style="background:#312e81;color:#ffffff;font-weight:bold;">
        <th>Severity</th>
        <th>Underwriter Check</th>
        <th>Diagnostic Finding</th>
        <th>Recommended Action</th>
      </tr>
    </thead>
    <tbody>
      ${step5Data.blindSpots
        .map(
          (spot) => `<tr>
            <td><strong>${spot.severity}</strong></td>
            <td>${spot.title}</td>
            <td>${spot.description}</td>
            <td>${spot.actionableFix}</td>
          </tr>`
        )
        .join('')}
    </tbody>
  </table>
</body>
</html>`;

    const blob = new Blob([htmlWorkbook], {
      type: 'application/vnd.ms-excel;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeTitle}_Module_J_Grant_Financials.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const completedCoreStepsCount =
    (isStep1Complete ? 1 : 0) +
    (isStep2Complete ? 1 : 0) +
    (isStep3Complete ? 1 : 0) +
    (isStep4Complete ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* MODULE J TOP HEADER BANNER (Strict GEMINI.md Rule 6.1 Standard) */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-950 via-indigo-900 to-violet-900 p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-indigo-400/40 bg-indigo-500/30 text-indigo-100 text-[10px] shrink-0">
                Module J • 3-Year Financials, 36-Month Cashflow &amp; Tax Auto-Pilot
              </Badge>
              <Badge className="border-emerald-400/30 bg-emerald-500/20 text-emerald-200 text-[10px] shrink-0">
                <Sparkles className="mr-1 h-3 w-3" />
                {completedCoreStepsCount} of 4 Core Steps Ready
              </Badge>
              <Badge className="border-amber-400/30 bg-amber-500/20 text-amber-200 text-[10px] shrink-0">
                {isUK ? '🇬🇧 UK HMRC / Start Up Loans / Innovate UK Rules' : '🇮🇪 IE Revenue / LEO / Enterprise Ireland Rules'}
              </Badge>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Module J: No-Spreadsheet Financials &amp; 36-Month Cashflow
            </h1>
            <p className="max-w-2xl text-xs text-indigo-100/90 sm:text-sm">
              Turn the numbers you already built in Modules D–I into a grant-compliant 3-Year Profit &amp; Loss and 36-Month Cashflow—with plain-English translations and 1-click Excel / Google Drive export.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              {onBackToModuleI && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onBackToModuleI}
                  className="border-indigo-400/40 bg-white/10 text-xs text-white hover:bg-white/20"
                >
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                  Back to Module I
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleExportSpreadsheet('XLS')}
                className="border-emerald-400/40 bg-emerald-500/20 text-xs text-emerald-100 hover:bg-emerald-500/30"
              >
                <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
                Export Excel (.xls)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleExportSpreadsheet('CSV')}
                className="border-indigo-400/40 bg-white/10 text-xs text-white hover:bg-white/20"
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Google Sheets / Drive (.csv)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpenStep((prev) => (prev === 'ALL' ? 0 : 'ALL'))}
                className="border-indigo-400/40 bg-white/10 text-xs text-white hover:bg-white/20"
              >
                {openStep === 'ALL' ? 'Focus Step-by-Step' : 'Expand All Steps'}
              </Button>
            </div>
            <div className="text-right text-[11px] text-indigo-200">
              Module J Progress:{' '}
              <strong className="text-white">
                {Math.round((completedCoreStepsCount / 4) * 100)}%
              </strong>{' '}
              ({completedCoreStepsCount} of 4 Core Steps Ready)
            </div>
          </div>
        </div>

        {/* Global Founder vs. Grant/Accountant View Toggle Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-400/30 bg-indigo-950/60 px-3.5 py-2.5">
          <div className="flex items-center gap-2 text-xs text-indigo-100">
            <Eye className="h-4 w-4 text-amber-300 shrink-0" />
            <span>
              <strong>Terminology Mode:</strong> Switch between everyday plain-English explanations and formal grant/accountant labels at any time.
            </span>
          </div>
          <div className="inline-flex rounded-lg border border-indigo-400/30 bg-indigo-900/70 p-0.5">
            <button
              type="button"
              onClick={() =>
                setStep1Data((prev) => ({
                  ...prev,
                  viewLanguageMode: 'PLAIN_ENGLISH_FOUNDER',
                }))
              }
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                isPlainMode
                  ? 'bg-white text-indigo-950 shadow-xs'
                  : 'text-indigo-200 hover:text-white'
              }`}
            >
              Plain-English Founder View
            </button>
            <button
              type="button"
              onClick={() =>
                setStep1Data((prev) => ({
                  ...prev,
                  viewLanguageMode: 'OFFICIAL_GRANT_ACCOUNTANT',
                }))
              }
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                !isPlainMode
                  ? 'bg-emerald-400 text-slate-950 shadow-xs'
                  : 'text-indigo-200 hover:text-white'
              }`}
            >
              Official Grant &amp; Accountant View
            </button>
          </div>
        </div>

        {/* Step Navigation Strip (Tile Grid Standard) */}
        <div className="mt-5 grid grid-cols-2 gap-2 border-t border-indigo-800/70 pt-4 sm:grid-cols-3 lg:grid-cols-5">
          {[
            {
              step: 'Step 1',
              title: '1. Bills & Tax Auto-Pilot',
              done: isStep1Complete,
              targetId: 'module-j-step-1',
              stepNum: 1,
            },
            {
              step: 'Step 2',
              title: '2. Payment Timing & Cash',
              done: isStep2Complete,
              targetId: 'module-j-step-2',
              stepNum: 2,
            },
            {
              step: 'Step 3',
              title: '3. 36-Mo Cash Trough',
              done: isStep3Complete,
              targetId: 'module-j-step-3',
              stepNum: 3,
            },
            {
              step: 'Step 4',
              title: '4. 3-Yr P&L & Stress Test',
              done: isStep4Complete,
              targetId: 'module-j-step-4',
              stepNum: 4,
            },
            {
              step: 'Overview',
              title: '5. Overview Brief',
              done: isStep5Complete,
              targetId: 'module-j-step-5',
              stepNum: 5,
            },
          ].map((item, idx, arr) => {
            const firstIncompleteIdx = arr.findIndex((s) => !s.done);
            const isStepOpen =
              openStep === 'ALL'
                ? (firstIncompleteIdx === -1 ? idx === arr.length - 1 : idx === firstIncompleteIdx)
                : openStep === item.stepNum;
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => {
                  setOpenStep(item.stepNum);
                  setTimeout(() => {
                    const el = document.getElementById(item.targetId);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 40);
                }}
                className={`rounded-xl border px-3 py-2 text-left text-xs transition-all hover:border-white/50 hover:bg-white/15 ${
                  isStepOpen
                    ? 'border-amber-300/80 bg-white/20 text-white shadow-xs ring-1 ring-amber-300/50'
                    : item.done
                      ? 'border-emerald-400/40 bg-emerald-950/30 text-emerald-100'
                      : 'border-indigo-800/60 bg-indigo-950/40 text-indigo-300/70'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span>{item.step}</span>
                  {item.done ? (
                    <Check className="h-3.5 w-3.5 text-emerald-300" />
                  ) : isStepOpen ? (
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                  ) : null}
                </div>
                <div className="mt-0.5 truncate text-[11px]">{item.title}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================= */}
      {/* STEP 1: MONTHLY RUNNING COSTS & LOCALIZED TAX AUTO-PILOT      */}
      {/* ============================================================= */}
      {openStep !== 'ALL' && openStep !== 1 ? (
        // COLLAPSED STEP 1 (Strict GEMINI.md Rule 6.1 Standard)
        <div
          id="module-j-step-1"
          onClick={() => setOpenStep(1)}
          className="group scroll-mt-24 cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  isStep1Complete ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
                }`}
              >
                {isStep1Complete ? <Check className="h-4 w-4" /> : '1'}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                  Step 1: {isPlainMode ? 'Monthly Bills, Payroll & Tax Auto-Pilot' : 'Fixed Overheads (OpEx), Payroll & Statutory Tax Provision'}
                </h2>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  Fixed Bills: {currencySymbol}
                  {step1Metrics.monthlyFixedOpExY1.toLocaleString()}/mo • Payroll + Tax:{' '}
                  {currencySymbol}
                  {step1Metrics.totalMonthlyPayrollAndDrawingsY1.toLocaleString()}/mo • Total Burn:{' '}
                  {currencySymbol}
                  {step1Metrics.totalMonthlyBurnY1.toLocaleString()}/mo • Export:{' '}
                  {step1Data.exportRevenueSharePercent}%
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Badge
                variant={isStep1Complete ? 'default' : 'outline'}
                className={`shrink-0 text-[10px] font-medium ${
                  isStep1Complete
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'border-slate-300 text-slate-600'
                }`}
              >
                {isStep1Complete ? 'Completed' : 'In Progress'}
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 shrink-0 px-2.5 text-xs font-medium text-indigo-600 group-hover:bg-indigo-50"
              >
                {isStep1Complete ? 'Edit Step' : 'Open Step'}
                <ChevronDown className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // EXPANDED STEP 1 (Strict GEMINI.md Rule 6.1 Standard)
        <Card
          id="module-j-step-1"
          className="scroll-mt-24 rounded-xl border border-slate-200 bg-white shadow-xs"
        >
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    isStep1Complete ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
                  }`}
                >
                  {isStep1Complete ? <Check className="h-4 w-4" /> : '1'}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base font-bold text-slate-900">
                      Step 1:{' '}
                      {isPlainMode
                        ? 'Monthly Bills, Payroll & Localized Tax Auto-Pilot'
                        : 'Fixed Operating Overheads (OpEx), Payroll & Statutory Tax Provision'}
                    </CardTitle>
                    <Badge
                      variant={isStep1Complete ? 'default' : 'outline'}
                      className={`shrink-0 text-[10px] font-medium ${
                        isStep1Complete
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'border-slate-300 text-slate-600'
                      }`}
                    >
                      {isStep1Complete ? 'Completed' : 'In Progress'}
                    </Badge>
                  </div>
                  <CardDescription className="mt-1 text-xs text-slate-600">
                    {isPlainMode
                      ? 'Review the recurring monthly bills already pulled from your earlier modules, set your Year 1–3 team costs, and let our Tax Auto-Pilot handle Employer PRSI/NIC and VAT rules automatically.'
                      : 'Consolidate Year 1–3 operating expenditure (OpEx), directors remuneration, PAYE payroll, statutory employer social insurance (IE PRSI / UK NIC), CapEx depreciation, and VAT registration thresholds.'}
                  </CardDescription>
                </div>
              </div>

              {/* Top-Right Header Actions (Strict Clean Rule: ONLY Collapse Step button) */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setOpenStep(0)}
                  className="text-xs text-slate-500 hover:bg-slate-100"
                >
                  Collapse Step
                  <ChevronUp className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Dedicated 4-Layer Support Strip (Directly Below Title & Description) */}
            <div className="mt-3 flex flex-wrap items-center gap-2 pt-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setActiveWhyCard((prev) => (prev === 1 ? null : 1))}
                className="h-7 border-indigo-200 text-[11px] font-medium text-indigo-700 hover:bg-indigo-50"
              >
                <HelpCircle className="mr-1 h-3.5 w-3.5" />
                Why Are We Asking This?
              </Button>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setActiveExampleCard((prev) => (prev === 1 ? null : 1))}
                className="h-7 border-emerald-200 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50"
              >
                <Lightbulb className="mr-1 h-3.5 w-3.5" />
                Show Me an Example
              </Button>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleGenerateAiStep1}
                disabled={isGeneratingAiStep1 || isVaultReadonly}
                className="h-7 border-violet-200 bg-violet-50/60 text-[11px] font-medium text-violet-700 hover:bg-violet-100"
              >
                {isGeneratingAiStep1 ? (
                  <>
                    <RefreshCw className="mr-1 h-3.5 w-3.5 animate-spin" />
                    Calibrating with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-1 h-3.5 w-3.5 text-violet-600" />
                    Auto-Generate / Calibrate with AI
                  </>
                )}
              </Button>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleApplyIndustryBenchmarkStep1}
                disabled={isVaultReadonly}
                className="h-7 border-amber-200 bg-amber-50/60 text-[11px] font-medium text-amber-800 hover:bg-amber-100"
              >
                <Calculator className="mr-1 h-3.5 w-3.5 text-amber-700" />
                Use Industry Benchmark
              </Button>
            </div>

            {/* Collapsible Micro-Coaching Drawer: Why Are We Asking This? */}
            {activeWhyCard === 1 && (
              <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50/70 p-3.5 text-xs text-indigo-900">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                    <div className="space-y-1.5">
                      <p className="font-semibold text-indigo-950">
                        Why Grant Assessors &amp; Banks Check Your Monthly Bills &amp; Taxes First
                      </p>
                      <p className="text-indigo-800">
                        The #1 reason first-time financial projections get rejected by{' '}
                        <strong>{isUK ? 'British Business Bank Start Up Loans and Innovate UK' : 'Irish Local Enterprise Offices (LEO) and Enterprise Ireland'}</strong>{' '}
                        is <em>&quot;hidden statutory costs&quot;</em>: founders list a €40,000 employee salary but forget the mandatory{' '}
                        <strong>{isUK ? '13.8% Employer National Insurance + 3% Workplace Pension' : '11.15% Employer PRSI'}</strong>, or they treat collected VAT as their own profit.
                      </p>
                      <p className="text-indigo-800">
                        By auto-importing your costs from Modules D–I and turning on the Tax Auto-Pilot here, your 3-Year P&amp;L and 36-Month Cashflow become instant underwriter-grade without you writing a single spreadsheet formula.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveWhyCard(null)}
                    className="text-indigo-500 hover:text-indigo-800 text-xs px-1"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Collapsible Micro-Coaching Drawer: Show Me an Example */}
            {activeExampleCard === 1 && (
              <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/70 p-3.5 text-xs text-emerald-950">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <div className="space-y-1.5">
                      <p className="font-semibold text-emerald-900">
                        Example: How a 2-Person Startup Structures Year 1 Monthly Running Costs
                      </p>
                      <p className="text-emerald-800">
                        <strong>Posture:</strong> Co-Working &amp; Modern Cloud Stack ({currencySymbol}640/mo non-payroll bills: {currencySymbol}150 hot-desk hub, {currencySymbol}120 cloud/AI tools, {currencySymbol}170 organic growth tools, {currencySymbol}140 Xero + accountant, {currencySymbol}60 cyber/PI insurance).
                      </p>
                      <p className="text-emerald-800">
                        <strong>Taxes &amp; VAT:</strong> Registered for VAT from Day 1 so they reclaimed {currencySymbol}1,150 in VAT on their V1 prototype build and laptops, and set export sales to 35% (UK &amp; EU) to qualify for a LEO Priming Grant.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveExampleCard(null)}
                    className="text-emerald-500 hover:text-emerald-800 text-xs px-1"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {aiMessageStep1 && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs font-medium text-emerald-800">
                <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{aiMessageStep1}</span>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-8 pt-6">
            {/* --------------------------------------------------------- */}
            {/* 1.0: LIVE UPSTREAM AUTO-IMPORT BANNER (MODULES D–I)       */}
            {/* --------------------------------------------------------- */}
            <div className="rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/60 via-white to-violet-50/60 p-4 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-600 shrink-0" />
                    <h3 className="text-sm font-bold text-slate-900">
                      You Already Did 85% of the Maths! (Live Upstream Auto-Import)
                    </h3>
                    <Badge
                      variant="outline"
                      className="border-indigo-200 bg-indigo-50 text-[10px] text-indigo-700"
                    >
                      Connected to Modules D, E, F, G, H &amp; I
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600">
                    We automatically pulled your software stack, premises/equipment, survival budget, hiring plan, pricing, and marketing budget so you don&apos;t have to re-type a thing.
                  </p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleSyncFromUpstreamModules}
                  disabled={isVaultReadonly}
                  className="h-8 border-indigo-200 bg-white text-xs font-semibold text-indigo-700 hover:bg-indigo-50 shrink-0"
                >
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  Re-Sync Latest from Modules D–I
                </Button>
              </div>

              {/* 5 Upstream Snapshot Pills */}
              <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 border-t border-indigo-100/70 pt-3 text-xs">
                <button
                  type="button"
                  onClick={() => onNavigateToModule?.('MOD_D_PRODUCT_BUILD')}
                  className="rounded-lg border border-indigo-100/80 bg-white/90 p-2.5 text-left transition-all hover:border-indigo-300"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
                    Mod D • Tech Stack
                  </span>
                  <div className="mt-0.5 text-sm font-bold text-slate-900">
                    {currencySymbol}
                    {upstreamBaseline.monthlyTechStackCost}/mo
                  </div>
                  <span className="text-[10px] text-indigo-600">Edit in Mod D →</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateToModule?.('MOD_E_OPERATIONS')}
                  className="rounded-lg border border-indigo-100/80 bg-white/90 p-2.5 text-left transition-all hover:border-indigo-300"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
                    Mod E • Premises &amp; CapEx
                  </span>
                  <div className="mt-0.5 text-sm font-bold text-slate-900">
                    {currencySymbol}
                    {upstreamBaseline.monthlyPremisesCost}/mo
                  </div>
                  <span className="text-[10px] text-slate-500">
                    CapEx: {currencySymbol}
                    {upstreamBaseline.totalCapExEquipment.toLocaleString()}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateToModule?.('MOD_F_COFOUNDER_TEAM')}
                  className="rounded-lg border border-indigo-100/80 bg-white/90 p-2.5 text-left transition-all hover:border-indigo-300"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
                    Mod F • Survival &amp; Team
                  </span>
                  <div className="mt-0.5 text-sm font-bold text-slate-900">
                    {currencySymbol}
                    {(
                      upstreamBaseline.monthlyFounderDrawings +
                      upstreamBaseline.monthlyTeamSalariesY1
                    ).toLocaleString()}
                    /mo
                  </div>
                  <span className="text-[10px] text-indigo-600">Edit in Mod F →</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateToModule?.('MOD_H_REVENUE')}
                  className="rounded-lg border border-indigo-100/80 bg-white/90 p-2.5 text-left transition-all hover:border-indigo-300"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
                    Mod H • Price &amp; Export
                  </span>
                  <div className="mt-0.5 text-sm font-bold text-slate-900">
                    {currencySymbol}
                    {upstreamBaseline.headlinePriceNet} • {upstreamBaseline.exportSharePercentFromModH}% Export
                  </div>
                  <span className="text-[10px] text-indigo-600">Edit in Mod H →</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateToModule?.('MOD_I_MARKETING')}
                  className="rounded-lg border border-indigo-100/80 bg-white/90 p-2.5 text-left transition-all hover:border-indigo-300"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
                    Mod I • Marketing Spend
                  </span>
                  <div className="mt-0.5 text-sm font-bold text-slate-900">
                    {currencySymbol}
                    {upstreamBaseline.monthlyMarketingSpend}/mo
                  </div>
                  <span className="text-[10px] text-emerald-700">
                    {upstreamBaseline.isPaidAdsOptedOutInModI
                      ? 'Paid Ads Opted Out'
                      : 'Synced from Mod I'}
                  </span>
                </button>
              </div>

              {syncBannerMessage && (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{syncBannerMessage}</span>
                </div>
              )}
            </div>

            {/* --------------------------------------------------------- */}
            {/* 1.1: OPERATING COST POSTURE SELECTOR (With Mandatory OTHER) */}
            {/* --------------------------------------------------------- */}
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    1.1{' '}
                    {isPlainMode
                      ? 'How Lean Is Your Day-to-Day Setup?'
                      : 'Select Operating Expenditure (OpEx) Cost Posture'}
                  </h3>
                </div>
                <p className="text-xs text-slate-600">
                  {isPlainMode
                    ? 'Pick the style that best matches how you will run the business in Year 1. You can tweak every individual bill right below.'
                    : 'Establish the baseline operating overhead structure for grant underwriting and benchmark calibration.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {OPERATING_POSTURE_OPTIONS.map((opt) => {
                  const isSelected = step1Data.operatingCostPosture === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => {
                        if (!isVaultReadonly) {
                          setStep1Data((prev) => ({
                            ...prev,
                            operatingCostPosture: opt.id,
                          }));
                        }
                      }}
                      className={`cursor-pointer rounded-xl border p-4 transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-500'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {isPlainMode ? opt.plainTitle : opt.accountantTitle}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isSelected && (
                            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-white">
                              <Check className="h-2.5 w-2.5" />
                            </div>
                          )}
                          <Badge
                            variant="secondary"
                            className={`text-[9px] px-1.5 py-0.5 shrink-0 ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {opt.badge}
                          </Badge>
                        </div>
                      </div>
                      <p className="mt-1.5 text-[11px] text-slate-600 leading-snug">
                        {opt.description}
                      </p>
                      <div className="mt-2.5 border-t border-slate-100 pt-2 text-[10px] text-indigo-700">
                        <span className="font-semibold">Assessor Lens: </span>
                        {opt.grantNote}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Mandatory "OTHER" Custom Input (Strict GEMINI.md Rule 1.5) */}
              {step1Data.operatingCostPosture === 'OTHER' && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-2">
                  <Label className="text-xs font-bold text-slate-900">
                    Describe Your Custom Operating Cost Setup
                  </Label>
                  <Input
                    type="text"
                    value={step1Data.otherOperatingCostPostureText || ''}
                    onChange={(e) =>
                      setStep1Data((prev) => ({
                        ...prev,
                        otherOperatingCostPostureText: e.target.value,
                      }))
                    }
                    placeholder="e.g. University incubator wet-lab access at €200/mo + seasonal event pop-ups..."
                    disabled={isVaultReadonly}
                    className="h-9 bg-white text-base sm:text-xs"
                  />
                </div>
              )}
            </div>

            {/* --------------------------------------------------------- */}
            {/* 1.2: DRIVER-BASED MONTHLY RUNNING BILLS (NO-SPREADSHEET)  */}
            {/* --------------------------------------------------------- */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      1.2{' '}
                      {isPlainMode
                        ? 'Your Monthly Bills to Keep the Lights On (Fixed Overheads)'
                        : 'Itemized Operating Expenditure (OpEx) Schedule (Years 1–3)'}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600">
                    {isPlainMode
                      ? 'Enter what each bill costs per month in Year 1, and how much it grows in Year 2 and Year 3. We multiply out all 36 months for you.'
                      : 'Driver-based monthly OpEx schedule with automated annual step-up compounding across Months 1–36.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setShowAccountingPartnerDrawer((prev) => !prev)
                    }
                    className="h-8 border-emerald-200 bg-emerald-50/60 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
                  >
                    <Sparkles className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                    {showAccountingPartnerDrawer
                      ? 'Hide Cloud Bookkeeping Perks'
                      : 'Need Cloud Bookkeeping / Xero?'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddOverheadItem}
                    disabled={isVaultReadonly}
                    className="h-8 border-indigo-200 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Add Monthly Bill
                  </Button>
                </div>
              </div>

              {/* Optional Contextual PartnerSlot for Accounting / Bookkeeping Software */}
              {showAccountingPartnerDrawer && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-950">
                      Recommended Cloud Accounting &amp; Bookkeeping Partners ({effectiveCountry})
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAccountingPartnerDrawer(false)}
                      className="text-xs text-slate-500 hover:text-slate-800"
                    >
                      ✕
                    </button>
                  </div>
                  <PartnerSlot
                    slot="OPS_STEP_4_ACCOUNTING"
                    projectId={plan.id}
                    countryCode={effectiveCountry}
                  />
                </div>
              )}

              {/* Responsive Table Wrapper (Strict GEMINI.md Rule 5.5) */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
                <table className="w-full min-w-[720px] text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    <tr>
                      <th className="py-3 pl-4 pr-3">
                        {isPlainMode
                          ? 'Monthly Bill ( & Accountant Label )'
                          : 'Official OpEx Account Heading'}
                      </th>
                      <th className="px-3 py-3 w-36">
                        {isPlainMode ? 'Year 1 / Month' : 'Y1 Monthly OpEx'}
                      </th>
                      <th className="px-3 py-3 w-28">
                        {isPlainMode ? 'Y2 Growth %' : 'Y2 Step-Up %'}
                      </th>
                      <th className="px-3 py-3 w-28">
                        {isPlainMode ? 'Y3 Growth %' : 'Y3 Step-Up %'}
                      </th>
                      <th className="px-3 py-3 w-44">3-Year Annual Totals</th>
                      <th className="py-3 pl-2 pr-4 text-right w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {step1Data.overheadLineItems.map((item) => {
                      const y1Mo = Number(item.monthlyCostYear1) || 0;
                      const y2Mo = Math.round(
                        y1Mo * (1 + (Number(item.annualStepUpPercentYear2) || 0) / 100)
                      );
                      const y3Mo = Math.round(
                        y2Mo * (1 + (Number(item.annualStepUpPercentYear3) || 0) / 100)
                      );

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/70">
                          <td className="py-3 pl-4 pr-3 align-top">
                            <Input
                              type="text"
                              value={
                                isPlainMode ? item.plainEnglishLabel : item.accountantLabel
                              }
                              onChange={(e) =>
                                handleUpdateOverheadItem(
                                  item.id,
                                  isPlainMode
                                    ? { plainEnglishLabel: e.target.value }
                                    : { accountantLabel: e.target.value }
                                )
                              }
                              disabled={isVaultReadonly}
                              className="h-8 font-semibold text-slate-900 text-base sm:text-xs"
                            />
                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                              <span>
                                {isPlainMode
                                  ? `Grant Heading: ${item.accountantLabel}`
                                  : `Plain English: ${item.plainEnglishLabel}`}
                              </span>
                              <span>•</span>
                              <Badge
                                variant="outline"
                                className="border-indigo-200 bg-indigo-50/60 text-[10px] text-indigo-700"
                              >
                                {item.sourceModuleLabel}
                              </Badge>
                            </div>
                            {item.category === 'OTHER' && (
                              <Input
                                type="text"
                                value={item.otherCategoryText || ''}
                                onChange={(e) =>
                                  handleUpdateOverheadItem(item.id, {
                                    otherCategoryText: e.target.value,
                                  })
                                }
                                placeholder="Specify custom overhead category..."
                                disabled={isVaultReadonly}
                                className="mt-1.5 h-7 bg-indigo-50/30 text-base sm:text-[11px]"
                              />
                            )}
                          </td>

                          <td className="px-3 py-3 align-top">
                            <div className="relative">
                              <span className="pointer-events-none absolute left-2.5 top-2 text-xs font-semibold text-slate-500">
                                {currencySymbol}
                              </span>
                              <Input
                                type="number"
                                min={0}
                                value={item.monthlyCostYear1}
                                onChange={(e) =>
                                  handleUpdateOverheadItem(item.id, {
                                    monthlyCostYear1: Math.max(0, Number(e.target.value) || 0),
                                  })
                                }
                                disabled={isVaultReadonly}
                                className="h-8 pl-6 font-bold text-slate-900 text-base sm:text-xs"
                              />
                            </div>
                            <span className="mt-1 block text-[10px] text-slate-500">
                              per month in Y1
                            </span>
                          </td>

                          <td className="px-3 py-3 align-top">
                            <div className="relative">
                              <Input
                                type="number"
                                min={0}
                                max={500}
                                value={item.annualStepUpPercentYear2}
                                onChange={(e) =>
                                  handleUpdateOverheadItem(item.id, {
                                    annualStepUpPercentYear2: Math.max(
                                      0,
                                      Number(e.target.value) || 0
                                    ),
                                  })
                                }
                                disabled={isVaultReadonly}
                                className="h-8 pr-6 text-base sm:text-xs"
                              />
                              <span className="pointer-events-none absolute right-2.5 top-2 text-xs text-slate-400">
                                %
                              </span>
                            </div>
                            <span className="mt-1 block text-[10px] text-slate-500">
                              {currencySymbol}
                              {y2Mo}/mo in Y2
                            </span>
                          </td>

                          <td className="px-3 py-3 align-top">
                            <div className="relative">
                              <Input
                                type="number"
                                min={0}
                                max={500}
                                value={item.annualStepUpPercentYear3}
                                onChange={(e) =>
                                  handleUpdateOverheadItem(item.id, {
                                    annualStepUpPercentYear3: Math.max(
                                      0,
                                      Number(e.target.value) || 0
                                    ),
                                  })
                                }
                                disabled={isVaultReadonly}
                                className="h-8 pr-6 text-base sm:text-xs"
                              />
                              <span className="pointer-events-none absolute right-2.5 top-2 text-xs text-slate-400">
                                %
                              </span>
                            </div>
                            <span className="mt-1 block text-[10px] text-slate-500">
                              {currencySymbol}
                              {y3Mo}/mo in Y3
                            </span>
                          </td>

                          <td className="px-3 py-3 align-top">
                            <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1.5 text-[11px] space-y-0.5">
                              <div className="flex justify-between">
                                <span className="text-slate-500">Y1 Annual:</span>
                                <span className="font-bold text-slate-900">
                                  {currencySymbol}
                                  {(y1Mo * 12).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Y2 Annual:</span>
                                <span className="font-semibold text-slate-700">
                                  {currencySymbol}
                                  {(y2Mo * 12).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Y3 Annual:</span>
                                <span className="font-semibold text-slate-700">
                                  {currencySymbol}
                                  {(y3Mo * 12).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 pl-2 pr-4 text-right align-top">
                            <button
                              type="button"
                              onClick={() => handleDeleteOverheadItem(item.id)}
                              disabled={isVaultReadonly || step1Data.overheadLineItems.length <= 1}
                              className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
                              title="Remove overhead line item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-200 bg-slate-50/90 font-bold text-slate-900">
                    <tr>
                      <td className="py-3 pl-4 pr-3 text-xs">
                        {isPlainMode
                          ? 'Total Monthly Fixed Bills (Ex-Payroll)'
                          : 'Total Fixed Operating Overheads (Ex-Payroll)'}
                      </td>
                      <td className="px-3 py-3 text-sm text-indigo-700">
                        {currencySymbol}
                        {step1Metrics.monthlyFixedOpExY1.toLocaleString()}/mo
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-600">
                        {currencySymbol}
                        {step1Metrics.monthlyFixedOpExY2.toLocaleString()}/mo
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-600">
                        {currencySymbol}
                        {step1Metrics.monthlyFixedOpExY3.toLocaleString()}/mo
                      </td>
                      <td className="px-3 py-3 text-xs">
                        Y1: {currencySymbol}
                        {(step1Metrics.monthlyFixedOpExY1 * 12).toLocaleString()}/yr
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* --------------------------------------------------------- */}
            {/* 1.3: PAYROLL, LOCALIZED EMPLOYER TAXES & VAT AUTO-PILOT   */}
            {/* --------------------------------------------------------- */}
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Landmark className="h-4 w-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    1.3{' '}
                    {isPlainMode
                      ? 'Team Pay, Automatic Payroll Taxes & The "VAT Isn\'t Your Money" Guardrail'
                      : `Statutory Payroll Taxes (${isUK ? 'UK NIC & Pension' : 'IE Employer PRSI'}), VAT Regime & Export Split`}
                  </h3>
                </div>
                <p className="text-xs text-slate-600">
                  {isPlainMode
                    ? 'We pulled your survival budget and hiring plan from Module F. Keep the Tax Auto-Pilot switched ON so we automatically add mandatory employer taxes and separate VAT from your revenue.'
                    : 'Calibrate directors drawings, Y1–Y3 gross payroll, statutory employer social insurance, VAT registration timing, and international export share.'}
                </p>
              </div>

              {/* Payroll + Employer Tax Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-900">
                    {isPlainMode
                      ? 'Founder Monthly Living Drawings'
                      : 'Directors Remuneration / Drawings (Mo)'}
                  </Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-2.5 top-2 text-xs font-semibold text-slate-500">
                      {currencySymbol}
                    </span>
                    <Input
                      type="number"
                      min={0}
                      value={step1Data.monthlyFounderDrawingsYear1}
                      onChange={(e) =>
                        setStep1Data((prev) => ({
                          ...prev,
                          monthlyFounderDrawingsYear1: Math.max(
                            0,
                            Number(e.target.value) || 0
                          ),
                        }))
                      }
                      disabled={isVaultReadonly}
                      className="h-9 bg-white pl-6 text-base sm:text-xs font-semibold"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Synced from Module F Survival Budget.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-900">
                    {isPlainMode
                      ? 'Year 1 Team Salaries (/mo)'
                      : 'Year 1 Gross PAYE Payroll (/mo)'}
                  </Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-2.5 top-2 text-xs font-semibold text-slate-500">
                      {currencySymbol}
                    </span>
                    <Input
                      type="number"
                      min={0}
                      value={step1Data.monthlyTeamSalariesYear1}
                      onChange={(e) =>
                        setStep1Data((prev) => ({
                          ...prev,
                          monthlyTeamSalariesYear1: Math.max(
                            0,
                            Number(e.target.value) || 0
                          ),
                        }))
                      }
                      disabled={isVaultReadonly}
                      className="h-9 bg-white pl-6 text-base sm:text-xs font-semibold"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Plus {currencySymbol}
                    {step1Metrics.monthlyEmployerTaxY1.toLocaleString()}/mo Employer Tax.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-900">
                    {isPlainMode
                      ? 'Year 2 & Year 3 Team Salaries (/mo)'
                      : 'Y2 & Y3 Gross Monthly Payroll'}
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <span className="pointer-events-none absolute left-2 top-2 text-[11px] text-slate-500">
                        Y2:
                      </span>
                      <Input
                        type="number"
                        min={0}
                        value={step1Data.monthlyTeamSalariesYear2}
                        onChange={(e) =>
                          setStep1Data((prev) => ({
                            ...prev,
                            monthlyTeamSalariesYear2: Math.max(
                              0,
                              Number(e.target.value) || 0
                            ),
                          }))
                        }
                        disabled={isVaultReadonly}
                        className="h-9 bg-white pl-7 text-base sm:text-xs"
                      />
                    </div>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-2 top-2 text-[11px] text-slate-500">
                        Y3:
                      </span>
                      <Input
                        type="number"
                        min={0}
                        value={step1Data.monthlyTeamSalariesYear3}
                        onChange={(e) =>
                          setStep1Data((prev) => ({
                            ...prev,
                            monthlyTeamSalariesYear3: Math.max(
                              0,
                              Number(e.target.value) || 0
                            ),
                          }))
                        }
                        disabled={isVaultReadonly}
                        className="h-9 bg-white pl-7 text-base sm:text-xs"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Synced from Module F 3-Year Hiring Plan.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-900">
                      {isUK
                        ? 'UK Employer NIC + Pension %'
                        : 'IE Employer PRSI Tax %'}
                    </Label>
                    <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-[10px]">
                      Auto-Pilot ON
                    </Badge>
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.05"
                      min={0}
                      max={40}
                      value={step1Data.employerPayrollTaxRatePercent}
                      onChange={(e) =>
                        setStep1Data((prev) => ({
                          ...prev,
                          employerPayrollTaxRatePercent: Math.max(
                            0,
                            Number(e.target.value) || 0
                          ),
                        }))
                      }
                      disabled={isVaultReadonly}
                      className="h-9 bg-white pr-7 text-base sm:text-xs font-semibold"
                    />
                    <span className="pointer-events-none absolute right-2.5 top-2 text-xs text-slate-500">
                      %
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {isUK
                      ? 'Standard UK: 13.8% NIC + 3% Workplace Pension.'
                      : 'Standard Ireland: 11.15% Class A Employer PRSI.'}
                  </p>
                </div>
              </div>

              {/* VAT Strategy Selector (with Mandatory OTHER) */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label className="text-xs font-bold text-slate-900">
                    {isPlainMode
                      ? 'How Will You Handle VAT? ("VAT Isn\'t Your Money" Guardrail)'
                      : `VAT Registration & Remittance Strategy (${step1Data.standardVatRatePercent}% Standard Rate)`}
                  </Label>
                  <Badge
                    variant="outline"
                    className="border-amber-300 bg-amber-50 text-[10px] text-amber-900"
                  >
                    {isUK
                      ? 'UK VAT Threshold: £90,000 / yr'
                      : 'IE VAT Threshold: €42,500 (Services) / €85,000 (Goods)'}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {VAT_STRATEGY_OPTIONS.map((vOpt) => {
                    const isSelected = step1Data.vatRegistrationStrategy === vOpt.id;
                    return (
                      <div
                        key={vOpt.id}
                        onClick={() => {
                          if (!isVaultReadonly) {
                            setStep1Data((prev) => ({
                              ...prev,
                              vatRegistrationStrategy: vOpt.id,
                            }));
                          }
                        }}
                        className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-500'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {isPlainMode ? vOpt.plainTitle : vOpt.accountantTitle}
                          </span>
                          {isSelected && (
                            <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white">
                              <Check className="h-2.5 w-2.5" />
                            </div>
                          )}
                        </div>
                        <Badge
                          variant="secondary"
                          className="mt-1.5 text-[9px] bg-slate-100 text-slate-700"
                        >
                          {vOpt.badge}
                        </Badge>
                        <p className="mt-1.5 text-[11px] text-slate-600 leading-snug">
                          {vOpt.description}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Mandatory OTHER Input for VAT Strategy (Strict GEMINI.md Rule 1.5) */}
                {step1Data.vatRegistrationStrategy === 'OTHER' && (
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-2">
                    <Label className="text-xs font-bold text-slate-900">
                      Describe Your Custom VAT / Indirect Tax Arrangement
                    </Label>
                    <Input
                      type="text"
                      value={step1Data.otherVatRegistrationStrategyText || ''}
                      onChange={(e) =>
                        setStep1Data((prev) => ({
                          ...prev,
                          otherVatRegistrationStrategyText: e.target.value,
                        }))
                      }
                      placeholder="e.g. EU One-Stop-Shop (OSS) digital supply or reverse-charge B2B export only..."
                      disabled={isVaultReadonly}
                      className="h-9 bg-white text-base sm:text-xs"
                    />
                  </div>
                )}

                {/* Export Revenue Share Slider (Mandatory for IE LEO & Enterprise Ireland) */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        {isPlainMode
                          ? 'What % of Your Sales Will Come From Customers Outside Your Home Country? (Export %)'
                          : 'International Export Turnover Split (% of Total Revenue)'}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {isUK
                          ? 'Innovate UK & British Business Bank value international export scalability.'
                          : 'Mandatory for Irish LEO Priming/Feasibility & Enterprise Ireland to prove non-displacement of local competitors.'}
                      </p>
                    </div>
                    <Badge className="bg-indigo-600 text-white text-xs px-2.5 py-0.5">
                      {step1Data.exportRevenueSharePercent}% Export /{' '}
                      {100 - step1Data.exportRevenueSharePercent}% Domestic
                    </Badge>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={step1Data.exportRevenueSharePercent}
                    onChange={(e) =>
                      setStep1Data((prev) => ({
                        ...prev,
                        exportRevenueSharePercent: Number(e.target.value) || 0,
                      }))
                    }
                    disabled={isVaultReadonly}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-slate-700">
                        Primary Export Target Markets
                      </Label>
                      <Input
                        type="text"
                        value={step1Data.exportTargetMarketsSummary}
                        onChange={(e) =>
                          setStep1Data((prev) => ({
                            ...prev,
                            exportTargetMarketsSummary: e.target.value,
                          }))
                        }
                        placeholder="e.g. UK, Eurozone, US"
                        disabled={isVaultReadonly}
                        className="h-8 text-base sm:text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-slate-700">
                        CapEx Equipment Value (Synced from Module E for 3-Yr Depreciation)
                      </Label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-2.5 top-1.5 text-xs font-semibold text-slate-500">
                          {currencySymbol}
                        </span>
                        <Input
                          type="number"
                          min={0}
                          value={step1Data.totalCapExEquipmentValue}
                          onChange={(e) =>
                            setStep1Data((prev) => ({
                              ...prev,
                              totalCapExEquipmentValue: Math.max(
                                0,
                                Number(e.target.value) || 0
                              ),
                            }))
                          }
                          disabled={isVaultReadonly}
                          className="h-8 pl-6 text-base sm:text-xs font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------- */}
            {/* 1.4: MULTI-COLUMN UNDERWRITING DIAGNOSTIC GRID (Rule 6.2) */}
            {/* --------------------------------------------------------- */}
            <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/70 via-white to-slate-50/40 p-5 sm:p-6 shadow-xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-200/60 text-indigo-700">
                    <Scale className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {isPlainMode
                        ? 'Your Monthly "Keep the Lights On" Scorecard'
                        : 'Step 1 OpEx, Payroll & Tax Underwriting Diagnostic'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Live calculation of your monthly fixed cost base before Step 2 payment timing and Step 3 cashflow curves.
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="border-indigo-200 bg-indigo-50 text-[10px] font-semibold text-indigo-700"
                >
                  {isPlainMode ? 'Plain-English Mode Active' : 'Official Grant Underwriter Mode'}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {/* Card 1: Fixed Monthly Bills */}
                <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-xs flex flex-col justify-between transition-all">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        {isPlainMode ? 'Monthly Bills (Ex-Team)' : 'Fixed Monthly OpEx'}
                      </span>
                      <Badge className="bg-slate-100 text-slate-700 text-[10px]">
                        {step1Data.overheadLineItems.length} Items
                      </Badge>
                    </div>
                    <div className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                      {currencySymbol}
                      {step1Metrics.monthlyFixedOpExY1.toLocaleString()}
                      <span className="text-xs font-normal text-slate-500"> /mo</span>
                    </div>
                    <div className="mt-3 rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1.5 text-xs text-slate-600">
                      Year 1 Annual:{' '}
                      <strong className="text-slate-900">
                        {currencySymbol}
                        {(step1Metrics.monthlyFixedOpExY1 * 12).toLocaleString()}
                      </strong>
                    </div>
                  </div>
                  <div className="mt-4 border-t border-slate-100 pt-2.5 text-[11px] leading-normal text-slate-500">
                    <strong>Assessor Lens:</strong> Kept lean in Y1; steps up to{' '}
                    {currencySymbol}
                    {step1Metrics.monthlyFixedOpExY2.toLocaleString()}/mo in Y2 as revenue scales.
                  </div>
                </div>

                {/* Card 2: Payroll + Employer Tax Load */}
                <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-xs flex flex-col justify-between transition-all">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        {isPlainMode ? 'Team + Employer Taxes' : 'Loaded Payroll & PRSI/NIC'}
                      </span>
                      <Badge className="bg-indigo-100 text-indigo-800 text-[10px]">
                        +{step1Data.employerPayrollTaxRatePercent}% Tax
                      </Badge>
                    </div>
                    <div className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                      {currencySymbol}
                      {step1Metrics.totalMonthlyPayrollAndDrawingsY1.toLocaleString()}
                      <span className="text-xs font-normal text-slate-500"> /mo</span>
                    </div>
                    <div className="mt-3 rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1.5 text-xs text-slate-600">
                      Includes{' '}
                      <strong className="text-indigo-700">
                        {currencySymbol}
                        {step1Metrics.monthlyEmployerTaxY1.toLocaleString()}/mo
                      </strong>{' '}
                      {isUK ? 'NIC/Pension' : 'Employer PRSI'}
                    </div>
                  </div>
                  <div className="mt-4 border-t border-slate-100 pt-2.5 text-[11px] leading-normal text-slate-500">
                    <strong>Assessor Lens:</strong> Proves you haven&apos;t forgotten statutory employer payroll taxes on Y1–Y3 hires.
                  </div>
                </div>

                {/* Card 3: Total Monthly Burn */}
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/30 p-4.5 shadow-xs flex flex-col justify-between transition-all">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                        {isPlainMode ? 'Total Monthly Burn' : 'Total Monthly Cash Outflow'}
                      </span>
                      <Badge className="bg-indigo-600 text-white text-[10px]">
                        Y1 Baseline
                      </Badge>
                    </div>
                    <div className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                      {currencySymbol}
                      {step1Metrics.totalMonthlyBurnY1.toLocaleString()}
                      <span className="text-xs font-normal text-slate-500"> /mo</span>
                    </div>
                    <div className="mt-3 rounded-lg bg-white border border-indigo-100 px-2.5 py-1.5 text-xs text-slate-700">
                      CapEx Depreciation:{' '}
                      <strong>
                        {currencySymbol}
                        {step1Metrics.annualCapExDepreciation.toLocaleString()}/yr
                      </strong>
                    </div>
                  </div>
                  <div className="mt-4 border-t border-indigo-100 pt-2.5 text-[11px] leading-normal text-indigo-900">
                    <strong>Assessor Lens:</strong> Feeds directly into your Step 3 36-Month Cash Trough &amp; Runway curve.
                  </div>
                </div>

                {/* Card 4: VAT & Export Compliance */}
                <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-xs flex flex-col justify-between transition-all">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        {isPlainMode ? 'VAT & Export Readiness' : 'VAT & Export Compliance'}
                      </span>
                      <Badge
                        className={`text-[10px] ${
                          step1Data.exportRevenueSharePercent >= 25
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {step1Data.exportRevenueSharePercent}% Export
                      </Badge>
                    </div>
                    <div className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                      {step1Data.standardVatRatePercent}%
                      <span className="text-xs font-normal text-slate-500">
                        {' '}
                        {isUK ? 'UK VAT' : 'IE VAT'}
                      </span>
                    </div>
                    <div className="mt-3 rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1.5 text-xs text-slate-600">
                      {step1Metrics.crossesVatThresholdY1
                        ? `Crosses ${currencySymbol}${step1Metrics.vatThresholdAmount.toLocaleString()} threshold in Y1`
                        : `Below ${currencySymbol}${step1Metrics.vatThresholdAmount.toLocaleString()} threshold in Y1`}
                    </div>
                  </div>
                  <div className="mt-4 border-t border-slate-100 pt-2.5 text-[11px] leading-normal text-slate-500">
                    <strong>Assessor Lens:</strong>{' '}
                    {isUK
                      ? 'VAT is ring-fenced from P&L revenue per HMRC rules.'
                      : 'Export % supports LEO Priming & Enterprise Ireland eligibility.'}
                  </div>
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------- */}
            {/* 1.5: WRITTEN COST & TAX JUSTIFICATION + OPEN QUESTIONS    */}
            {/* --------------------------------------------------------- */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Label className="text-xs font-bold text-slate-900">
                    1.5{' '}
                    {isPlainMode
                      ? 'Written Summary of Your Monthly Costs & Taxes (For Your Business Plan)'
                      : 'Written Operating Cost & Statutory Tax Justification (Grant Narrative)'}
                  </Label>
                  <p className="text-[11px] text-slate-500">
                    Click <strong>&quot;Auto-Generate / Calibrate with AI&quot;</strong> above or edit below to explain why your Year 1–3 bills are realistic.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleGenerateAiStep1}
                  disabled={isGeneratingAiStep1 || isVaultReadonly}
                  className="h-7 border-violet-200 bg-violet-50/60 text-[11px] font-medium text-violet-700 hover:bg-violet-100"
                >
                  <Wand2 className="mr-1 h-3.5 w-3.5 text-violet-600" />
                  {isGeneratingAiStep1 ? 'Synthesizing...' : 'Write Summary with AI'}
                </Button>
              </div>

              <textarea
                rows={4}
                value={step1Data.overheadsAndTaxNarrative}
                onChange={(e) =>
                  setStep1Data((prev) => ({
                    ...prev,
                    overheadsAndTaxNarrative: e.target.value,
                  }))
                }
                disabled={isVaultReadonly}
                placeholder="Explain your Year 1–3 monthly bills, how you keep costs lean before revenue scales, and how employer payroll taxes and VAT are handled..."
                className="w-full rounded-xl border border-slate-300 p-3 text-base sm:text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden"
              />

              {step1Data.grantAssessorTip && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900 flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-amber-700 shrink-0" />
                  <div>
                    <span className="font-semibold text-amber-950">
                      Grant Underwriter Tip:{' '}
                    </span>
                    <span>{step1Data.grantAssessorTip}</span>
                  </div>
                </div>
              )}

              {/* Momentum Protection: Park It in Open Questions (Strict GEMINI.md Rule 1.3) */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <HelpCircle className="h-4 w-4 text-indigo-600" />
                    <span>
                      Not 100% sure on an insurance quote, accountant fee, or VAT rule yet? Park it in Open Questions so you don&apos;t lose momentum:
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex flex-col sm:flex-row gap-2">
                  <Input
                    type="text"
                    value={parkingQuestionStep1}
                    onChange={(e) => setParkingQuestionStep1(e.target.value)}
                    placeholder="e.g. Confirm with accountant whether we should register for VAT in Month 1 or Month 6..."
                    disabled={isVaultReadonly}
                    className="h-8 bg-white text-base sm:text-xs flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleParkStep1Question}
                    disabled={isParkingStep1 || !parkingQuestionStep1.trim() || isVaultReadonly}
                    className="h-8 border-indigo-200 text-xs font-medium text-indigo-700 hover:bg-indigo-50 shrink-0"
                  >
                    Park It in Open Questions
                  </Button>
                </div>
                {parkedSuccessStep1 && (
                  <p className="mt-1.5 text-[11px] font-medium text-emerald-700">
                    ✓ Parked in your Open Questions list for mentor/accountant review!
                  </p>
                )}
              </div>
            </div>

            {/* Bottom Step 1 Toolbar (Strict GEMINI.md Rule 6.1 Standard) */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2">
                {onBackToModuleI && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={onBackToModuleI}
                    className="text-xs text-slate-600 hover:bg-slate-100"
                  >
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                    Back to Module I
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleGenerateAiStep1}
                  disabled={isGeneratingAiStep1 || isVaultReadonly}
                  className="text-xs border-violet-200 text-violet-700 hover:bg-violet-50"
                >
                  <Wand2 className="mr-1.5 h-3.5 w-3.5" />
                  AI Calibrate Step 1
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleSaveStep1(false)}
                  disabled={saveStatusStep1 === 'saving' || isVaultReadonly}
                  className="text-xs"
                >
                  {saveStatusStep1 === 'saving'
                    ? 'Saving...'
                    : saveStatusStep1 === 'saved'
                    ? '✓ Saved'
                    : 'Save Step 1'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleSaveStep1(true)}
                  disabled={saveStatusStep1 === 'saving'}
                  className="bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  Save &amp; Next: Payment Timing
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============================================================= */}
      {/* STEP 2: PAYMENT TIMING, WORKING CAPITAL & SEASONALITY         */}
      {/* ============================================================= */}
      {openStep !== 'ALL' && openStep !== 2 ? (
        // COLLAPSED STEP 2 (Strict GEMINI.md Rule 6.1 Standard)
        <div
          id="module-j-step-2"
          onClick={() => setOpenStep(2)}
          className="group scroll-mt-24 cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  isStep2Complete ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
                }`}
              >
                {isStep2Complete ? <Check className="h-4 w-4" /> : '2'}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                  Step 2:{' '}
                  {isPlainMode
                    ? 'Payment Timing, Stock Delays & Seasonality ("Paper Profit vs. Bank Cash")'
                    : 'Working Capital Cycle, Debtor Days (AR) & Seasonal Revenue Phasing'}
                </h2>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  Payment Delay: {step2Metrics.effectiveDebtorDays} Days • First Revenue: Month{' '}
                  {step2Data.monthToStartRevenue} • Peak Cash Lockup: {currencySymbol}
                  {step2Metrics.peakWorkingCapitalLockup.toLocaleString()} • Y1 Cash Collected:{' '}
                  {step2Metrics.year1CashCollectionEfficiencyPercent}%
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Badge
                variant={isStep2Complete ? 'default' : 'outline'}
                className={`shrink-0 text-[10px] font-medium ${
                  isStep2Complete
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'border-slate-300 text-slate-600'
                }`}
              >
                {isStep2Complete ? 'Completed' : 'In Progress'}
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 shrink-0 px-2.5 text-xs font-medium text-indigo-600 group-hover:bg-indigo-50"
              >
                {isStep2Complete ? 'Edit Step' : 'Open Step'}
                <ChevronDown className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // EXPANDED STEP 2 (Strict GEMINI.md Rule 6.1 Standard)
        <Card
          id="module-j-step-2"
          className="scroll-mt-24 rounded-xl border border-slate-200 bg-white shadow-xs"
        >
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    isStep2Complete ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
                  }`}
                >
                  {isStep2Complete ? <Check className="h-4 w-4" /> : '2'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base font-bold text-slate-900">
                      Step 2:{' '}
                      {isPlainMode
                        ? 'Payment Timing, Working Capital & Seasonality ("Paper Profit vs. Bank Cash")'
                        : 'Working Capital Cycle, Debtor Days (AR), Stock Buffer & Monthly Seasonality'}
                    </CardTitle>
                    <Badge
                      variant={isStep2Complete ? 'default' : 'outline'}
                      className={`shrink-0 text-[10px] font-medium ${
                        isStep2Complete
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'border-slate-300 text-slate-600'
                      }`}
                    >
                      {isStep2Complete ? 'Completed' : 'In Progress'}
                    </Badge>
                  </div>
                  <CardDescription className="mt-1 text-xs text-slate-600">
                    {isPlainMode
                      ? 'The #1 reason profitable startups run out of cash is timing: paying bills today while waiting 30–60 days for customers to pay invoices. Tell us when cash actually moves.'
                      : 'Configure Trade Debtor Days (AR), Inventory Prepayment Lead Times, Revenue Commencement Month, and Monthly Seasonality Weights.'}
                  </CardDescription>
                </div>
              </div>

              {/* Top-Right Header Actions (Strict GEMINI.md Rule 6.1: ONLY Collapse Step button here) */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setOpenStep(0)}
                  className="text-xs text-slate-500 hover:bg-slate-100"
                >
                  Collapse Step
                  <ChevronUp className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Dedicated 4-Layer Support Strip (Directly Below Title & Description per Rule 6.1) */}
            <div className="mt-3 flex flex-wrap items-center gap-2 pt-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setActiveWhyCard((prev) => (prev === 2 ? null : 2))}
                className="h-7 border-indigo-200 text-[11px] font-medium text-indigo-700 hover:bg-indigo-50"
              >
                <HelpCircle className="mr-1 h-3.5 w-3.5" />
                Why Are We Asking This?
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setActiveExampleCard((prev) => (prev === 2 ? null : 2))}
                className="h-7 border-emerald-200 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50"
              >
                <Lightbulb className="mr-1 h-3.5 w-3.5" />
                Show Me an Example
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleGenerateAiStep2}
                disabled={isGeneratingAiStep2 || isVaultReadonly}
                className="h-7 border-violet-200 bg-violet-50/60 text-[11px] font-medium text-violet-700 hover:bg-violet-100"
              >
                <Sparkles className="mr-1 h-3.5 w-3.5 text-violet-600" />
                {isGeneratingAiStep2
                  ? 'Calibrating Working Capital...'
                  : 'Auto-Generate / Calibrate with AI'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleApplyIndustryBenchmarkStep2}
                disabled={isVaultReadonly}
                className="h-7 border-slate-200 bg-slate-50 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
              >
                <Calculator className="mr-1 h-3.5 w-3.5 text-slate-600" />
                Use Industry Benchmark
              </Button>
            </div>

            {/* Collapsible Micro-Coaching Drawer: WHY (Rule 6.1) */}
            {activeWhyCard === 2 && (
              <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50/70 p-3.5 text-xs text-indigo-900">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1.5">
                    <div className="font-bold text-indigo-950">
                      Why Grant Assessors &amp; Banks Obsess Over &quot;Working Capital Timing&quot;
                    </div>
                    <p>
                      A Profit &amp; Loss statement records a sale the day you send an invoice. But your bank account only cares when the money actually clears. If you sell to businesses on 30- or 60-day invoice terms—or if you have to buy stock 2 months before selling it—you can be &quot;profitable on paper&quot; while running out of cash to pay rent or wages.
                    </p>
                    <p>
                      <strong>How this helps you:</strong> By clicking 3 simple options below, we automatically shift your 36-month bank cashflow so grant assessors see you understand real-world payment delays.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveWhyCard(null)}
                    className="text-indigo-500 hover:text-indigo-800 font-bold px-1"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Collapsible Micro-Coaching Drawer: EXAMPLE (Rule 6.1) */}
            {activeExampleCard === 2 && (
              <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/70 p-3.5 text-xs text-emerald-950">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1.5">
                    <div className="font-bold text-emerald-950">
                      Industry Examples ({plan.industryCategory || 'B2B vs. Consumer Startups'})
                    </div>
                    <p>
                      • <strong>B2B SaaS / Consulting Startup:</strong> Selects <em>&quot;Standard Business Invoice (30 Days)&quot;</em> + <em>&quot;No Physical Stock&quot;</em> + <em>&quot;Month 2 Revenue Start&quot;</em>. Month 2 invoices land in the bank in Month 3, locking up ~1 month of revenue in unpaid invoices.
                    </p>
                    <p>
                      • <strong>Food / Retail Product Brand:</strong> Selects <em>&quot;Slow Corporate / Retail (60 Days)&quot;</em> + <em>&quot;Local Stock (2-Month Buffer)&quot;</em> + <em>&quot;Autumn &amp; Q4 Christmas Peak&quot;</em>. Highlights the exact working capital loan needed to buy autumn stock before supermarkets pay in January.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveExampleCard(null)}
                    className="text-emerald-600 hover:text-emerald-900 font-bold px-1"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {aiMessageStep2 && (
              <div className="rounded-lg border border-violet-200 bg-violet-50/80 px-3.5 py-2.5 text-xs font-medium text-violet-900 flex items-center justify-between gap-2">
                <span>✨ {aiMessageStep2}</span>
                <button
                  type="button"
                  onClick={() => setAiMessageStep2(null)}
                  className="text-violet-600 hover:text-violet-900 font-bold"
                >
                  ✕
                </button>
              </div>
            )}

            {/* --------------------------------------------------------- */}
            {/* 2.1: CUSTOMER PAYMENT TIMING (DEBTOR DAYS) (+ OTHER)      */}
            {/* --------------------------------------------------------- */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Label className="text-xs font-bold text-slate-900">
                    2.1{' '}
                    {isPlainMode
                      ? 'When Do Customers Actually Pay You After Buying?'
                      : 'Customer Collection Terms & Trade Debtor Days (Accounts Receivable)'}
                  </Label>
                  <p className="text-[11px] text-slate-500">
                    Choose how long it takes for a sale to turn into cleared cash in your business bank account.
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] border-indigo-200 text-indigo-700">
                  Effective Lag: {step2Metrics.effectiveDebtorDays} Days
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                {COLLECTION_TIMING_OPTIONS.map((opt) => {
                  const isSelected = step2Data.customerCollectionTiming === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isVaultReadonly}
                      onClick={() =>
                        setStep2Data((prev) => ({
                          ...prev,
                          customerCollectionTiming: opt.id,
                        }))
                      }
                      className={`flex flex-col justify-between rounded-xl border p-3 text-left transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-600 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50/60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="inline-block rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                            {opt.badge}
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />
                          )}
                        </div>
                        <div className="mt-2 text-xs font-bold text-slate-900">
                          {isPlainMode ? opt.plainTitle : opt.accountantTitle}
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                          {opt.description}
                        </p>
                      </div>
                      <div className="mt-2.5 border-t border-slate-100 pt-1.5 text-[10px] font-medium text-indigo-700">
                        {opt.grantNote}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Mandatory "OTHER" Custom Input + Custom Debtor Days (Strict GEMINI.md Rule 1.5) */}
              {step2Data.customerCollectionTiming === 'OTHER' && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-xs font-semibold text-indigo-950">
                      Describe Your Custom Customer Payment Terms:
                    </Label>
                    <Input
                      type="text"
                      value={step2Data.otherCustomerCollectionTimingText || ''}
                      onChange={(e) =>
                        setStep2Data((prev) => ({
                          ...prev,
                          otherCustomerCollectionTimingText: e.target.value,
                        }))
                      }
                      placeholder="e.g., 50% deposit on order, 50% 45 days after installation..."
                      disabled={isVaultReadonly}
                      className="bg-white text-base sm:text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-indigo-950">
                      Custom Average Debtor Days (0–120):
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      max={120}
                      value={step2Data.customDebtorDays ?? 45}
                      onChange={(e) =>
                        setStep2Data((prev) => ({
                          ...prev,
                          customDebtorDays: Math.max(
                            0,
                            Math.min(120, Number(e.target.value) || 0)
                          ),
                        }))
                      }
                      disabled={isVaultReadonly}
                      className="bg-white text-base sm:text-xs font-semibold"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* --------------------------------------------------------- */}
            {/* 2.2: STOCK / SUPPLIER LEAD TIME & FIRST REVENUE MONTH     */}
            {/* --------------------------------------------------------- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5">
              {/* Left 7 Cols: Inventory / Supplier Prepayment Timing (+ OTHER) */}
              <div className="lg:col-span-7 space-y-3">
                <div>
                  <Label className="text-xs font-bold text-slate-900">
                    2.2{' '}
                    {isPlainMode
                      ? 'Do You Have to Buy Stock or Pay Suppliers Before You Sell?'
                      : 'Inventory Holding Lead Time & Supplier Credit (Accounts Payable)'}
                  </Label>
                  <p className="text-[11px] text-slate-500">
                    Physical product businesses often have to pay for stock weeks or months before customers buy.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {INVENTORY_TIMING_OPTIONS.map((opt) => {
                    const isSelected = step2Data.inventoryStockTiming === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={isVaultReadonly}
                        onClick={() =>
                          setStep2Data((prev) => ({
                            ...prev,
                            inventoryStockTiming: opt.id,
                            upfrontStockMonthsBuffer: opt.defaultBufferMonths,
                          }))
                        }
                        className={`rounded-xl border p-3 text-left transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-white ring-1 ring-indigo-600 shadow-2xs'
                            : 'border-slate-200 bg-white/80 hover:border-indigo-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                            {opt.badge}
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />
                          )}
                        </div>
                        <div className="mt-1.5 text-xs font-bold text-slate-900">
                          {isPlainMode ? opt.plainTitle : opt.accountantTitle}
                        </div>
                        <p className="mt-1 text-[11px] text-slate-600">{opt.description}</p>
                      </button>
                    );
                  })}
                </div>

                {step2Data.inventoryStockTiming === 'OTHER' && (
                  <div className="rounded-xl border border-indigo-200 bg-white p-3 space-y-1.5">
                    <Label className="text-xs font-semibold text-indigo-950">
                      Describe Your Custom Stock or Supplier Payment Terms:
                    </Label>
                    <Input
                      type="text"
                      value={step2Data.otherInventoryStockTimingText || ''}
                      onChange={(e) =>
                        setStep2Data((prev) => ({
                          ...prev,
                          otherInventoryStockTimingText: e.target.value,
                        }))
                      }
                      placeholder="e.g., Consignment stock paid only after retail sell-through..."
                      disabled={isVaultReadonly}
                      className="text-base sm:text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Right 5 Cols: Pre-Revenue Build Months & Stock Buffer Sliders */}
              <div className="lg:col-span-5 space-y-4 rounded-xl border border-slate-200 bg-white p-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-900">
                      {isPlainMode
                        ? 'Which Month Do Paying Sales Start?'
                        : 'Commercial Revenue Commencement Month (M1–M12)'}
                    </Label>
                    <Badge className="bg-indigo-100 text-indigo-800 text-[10px]">
                      Month {step2Data.monthToStartRevenue}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    If you need 1–3 months to finish building V1 or fitting out premises before charging customers, slide this right.
                  </p>
                  <input
                    type="range"
                    min={1}
                    max={9}
                    step={1}
                    value={step2Data.monthToStartRevenue}
                    onChange={(e) =>
                      setStep2Data((prev) => ({
                        ...prev,
                        monthToStartRevenue: Number(e.target.value) || 1,
                      }))
                    }
                    disabled={isVaultReadonly}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Month 1 (Immediate Sales)</span>
                    <span>Month 3 (2-Mo Build)</span>
                    <span>Month 6+ (R&amp;D Phase)</span>
                  </div>
                </div>

                {step2Data.inventoryStockTiming !== 'NO_PHYSICAL_STOCK_DIGITAL' && (
                  <div className="space-y-1.5 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-slate-900">
                        {isPlainMode
                          ? 'Months of Stock Held in Advance'
                          : 'Upfront Inventory Buffer (Months of COGS)'}
                      </Label>
                      <Badge className="bg-amber-100 text-amber-800 text-[10px]">
                        {step2Data.upfrontStockMonthsBuffer} Months Buffer ({currencySymbol}
                        {step2Metrics.upfrontStockCashLockup.toLocaleString()})
                      </Badge>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={6}
                      step={0.5}
                      value={step2Data.upfrontStockMonthsBuffer}
                      onChange={(e) =>
                        setStep2Data((prev) => ({
                          ...prev,
                          upfrontStockMonthsBuffer: Number(e.target.value) || 0,
                        }))
                      }
                      disabled={isVaultReadonly}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                )}

                <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-2.5 text-[11px] text-slate-700 space-y-1">
                  <div className="flex justify-between">
                    <span>Pre-Revenue Build Months ({step2Metrics.preRevenueMonthsCount} mo):</span>
                    <strong className="text-slate-900">
                      {currencySymbol}
                      {step2Metrics.preRevenueBurnLockup.toLocaleString()}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Unpaid Customer Invoices Lockup:</span>
                    <strong className="text-slate-900">
                      {currencySymbol}
                      {step2Metrics.debtorCashLockup.toLocaleString()}
                    </strong>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1 font-semibold text-indigo-950">
                    <span>Total Working Capital Cash Tie-Up:</span>
                    <span>
                      {currencySymbol}
                      {step2Metrics.peakWorkingCapitalLockup.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------- */}
            {/* 2.3: SEASONALITY RAMP CURVE (+ OTHER) & 12-MO VISUAL CHART */}
            {/* --------------------------------------------------------- */}
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-bold text-slate-900">
                  2.3{' '}
                  {isPlainMode
                    ? 'How Do Your Sales Ramp Up Across the 12 Months of the Year?'
                    : 'Monthly Revenue Phasing & Seasonality Weighting Curve (M1–M12)'}
                </Label>
                <p className="text-[11px] text-slate-500">
                  Nobody sells the exact same amount in Month 1 as Month 12. Pick the curve that best matches your industry.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                {SEASONALITY_RAMP_OPTIONS.map((opt) => {
                  const isSelected = step2Data.seasonalityRampCurve === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isVaultReadonly}
                      onClick={() =>
                        setStep2Data((prev) => ({
                          ...prev,
                          seasonalityRampCurve: opt.id,
                        }))
                      }
                      className={`flex flex-col justify-between rounded-xl border p-3 text-left transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-600 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50/60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="inline-block rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                            {opt.badge}
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />
                          )}
                        </div>
                        <div className="mt-2 text-xs font-bold text-slate-900">
                          {isPlainMode ? opt.plainTitle : opt.accountantTitle}
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                          {opt.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {step2Data.seasonalityRampCurve === 'OTHER' && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-3.5 space-y-1.5">
                  <Label className="text-xs font-semibold text-indigo-950">
                    Describe Your Custom Seasonal Sales Pattern:
                  </Label>
                  <Input
                    type="text"
                    value={step2Data.otherSeasonalityRampCurveText || ''}
                    onChange={(e) =>
                      setStep2Data((prev) => ({
                        ...prev,
                        otherSeasonalityRampCurveText: e.target.value,
                      }))
                    }
                    placeholder="e.g., Back-to-school September surge and January renewal peak..."
                    disabled={isVaultReadonly}
                    className="bg-white text-base sm:text-xs"
                  />
                </div>
              )}

              {/* Interactive 12-Month Visual Comparison: Paper Sales vs. Actual Cash in Bank */}
              <div className="rounded-xl border border-slate-200 bg-slate-950 p-4 sm:p-5 text-white space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-400" />
                      {isPlainMode
                        ? 'Live 12-Month Preview: "Paper Sales" vs. "Cash Landing in Your Bank"'
                        : 'Year 1 Monthly Accrual Turnover (P&L) vs. Cleared Cash Receipts Schedule'}
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      See how a <strong>{step2Metrics.effectiveDebtorDays}-day payment delay</strong> and{' '}
                      <strong>Month {step2Data.monthToStartRevenue} launch</strong> affect when money actually hits your bank account.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="flex items-center gap-1.5 text-indigo-300">
                      <span className="h-2.5 w-2.5 rounded-xs bg-indigo-400 inline-block" />
                      Paper Sales ({currencySymbol}
                      {step2Metrics.totalInvoicedY1.toLocaleString()})
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-300">
                      <span className="h-2.5 w-2.5 rounded-xs bg-emerald-400 inline-block" />
                      Bank Cash Collected ({currencySymbol}
                      {step2Metrics.totalCashCollectedY1.toLocaleString()})
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto pb-1">
                  <div className="grid grid-cols-12 gap-2 min-w-[600px] pt-2">
                    {(() => {
                      const maxVal = Math.max(
                        1,
                        ...step2Metrics.monthlySchedule.map((m) =>
                          Math.max(m.invoicedRevenue, m.cashCollected)
                        )
                      );
                      return step2Metrics.monthlySchedule.map((mRow) => {
                        const invHeight = Math.max(
                          4,
                          Math.round((mRow.invoicedRevenue / maxVal) * 88)
                        );
                        const cashHeight = Math.max(
                          4,
                          Math.round((mRow.cashCollected / maxVal) * 88)
                        );
                        return (
                          <div
                            key={mRow.month}
                            className="flex flex-col items-center rounded-lg bg-slate-900/90 p-2 border border-slate-800"
                          >
                            <div className="flex h-24 w-full items-end justify-center gap-1.5 border-b border-slate-800 pb-1">
                              <div
                                title={`Month ${mRow.month} Invoiced: ${currencySymbol}${mRow.invoicedRevenue.toLocaleString()}`}
                                style={{ height: `${invHeight}px` }}
                                className="w-3 rounded-t-xs bg-indigo-400/90 transition-all"
                              />
                              <div
                                title={`Month ${mRow.month} Bank Cash: ${currencySymbol}${mRow.cashCollected.toLocaleString()}`}
                                style={{ height: `${cashHeight}px` }}
                                className="w-3 rounded-t-xs bg-emerald-400 transition-all"
                              />
                            </div>
                            <span className="mt-1.5 text-[10px] font-bold text-slate-300">
                              M{mRow.month}
                            </span>
                            <span className="text-[10px] text-emerald-300 font-medium">
                              {currencySymbol}
                              {mRow.cashCollected >= 1000
                                ? `${(mRow.cashCollected / 1000).toFixed(1)}k`
                                : mRow.cashCollected}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------- */}
            {/* 2.4: MULTI-COLUMN UNDERWRITING DIAGNOSTIC GRID (Rule 6.2) */}
            {/* --------------------------------------------------------- */}
            <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/70 via-white to-slate-50/40 p-5 sm:p-6 shadow-xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-200/60 text-indigo-700">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {isPlainMode
                        ? 'Your Payment Timing & Working Capital Scorecard'
                        : 'Step 2 Working Capital & Cash Conversion Underwriting Diagnostic'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Quantifies the cash gap between making a sale on paper and having cash in the bank.
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="border-indigo-200 bg-indigo-50 text-[10px] font-semibold text-indigo-700"
                >
                  Feeds Step 3 Cash Trough
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {/* Card 1: Debtor Days */}
                <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-xs flex flex-col justify-between transition-all">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        {isPlainMode ? 'Customer Payment Delay' : 'Trade Debtor Days (AR)'}
                      </span>
                      <Badge className="bg-slate-100 text-slate-700 text-[10px]">
                        {step2Metrics.effectiveDebtorDays === 0 ? 'Instant' : 'Invoice Lag'}
                      </Badge>
                    </div>
                    <div className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                      {step2Metrics.effectiveDebtorDays}
                      <span className="text-xs font-normal text-slate-500"> Days</span>
                    </div>
                    <div className="mt-3 rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1.5 text-xs text-slate-600">
                      Avg Unpaid Invoices:{' '}
                      <strong className="text-slate-900">
                        {currencySymbol}
                        {step2Metrics.debtorCashLockup.toLocaleString()}
                      </strong>
                    </div>
                  </div>
                  <div className="mt-4 border-t border-slate-100 pt-2.5 text-[11px] leading-normal text-slate-500">
                    <strong>Assessor Lens:</strong> Shows grant underwriters you haven&apos;t confused invoice date with bank clearing date.
                  </div>
                </div>

                {/* Card 2: Year 1 Cash Collection Efficiency */}
                <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-xs flex flex-col justify-between transition-all">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        {isPlainMode ? 'Y1 Sales Collected in Cash' : 'Y1 Cash Conversion Ratio'}
                      </span>
                      <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">
                        Year 1 Bank Inflow
                      </Badge>
                    </div>
                    <div className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                      {step2Metrics.year1CashCollectionEfficiencyPercent}%
                      <span className="text-xs font-normal text-slate-500"> in Y1</span>
                    </div>
                    <div className="mt-3 rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1.5 text-xs text-slate-600">
                      Rolls into Y2 M13:{' '}
                      <strong className="text-indigo-700">
                        {currencySymbol}
                        {step2Metrics.yearEndUnpaidInvoicesAR.toLocaleString()}
                      </strong>
                    </div>
                  </div>
                  <div className="mt-4 border-t border-slate-100 pt-2.5 text-[11px] leading-normal text-slate-500">
                    <strong>Assessor Lens:</strong> Year-end unpaid invoices sit on the Balance Sheet as Trade Debtors (`AR`).
                  </div>
                </div>

                {/* Card 3: Stock & Pre-Launch Buffer */}
                <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-xs flex flex-col justify-between transition-all">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        {isPlainMode ? 'Stock & Build Lead Buffer' : 'Inventory & Pre-Revenue Lockup'}
                      </span>
                      <Badge className="bg-amber-100 text-amber-800 text-[10px]">
                        M{step2Data.monthToStartRevenue} Launch
                      </Badge>
                    </div>
                    <div className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                      {currencySymbol}
                      {(
                        step2Metrics.upfrontStockCashLockup + step2Metrics.preRevenueBurnLockup
                      ).toLocaleString()}
                    </div>
                    <div className="mt-3 rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1.5 text-xs text-slate-600">
                      Stock: {currencySymbol}
                      {step2Metrics.upfrontStockCashLockup.toLocaleString()} • Pre-Sales:{' '}
                      {currencySymbol}
                      {step2Metrics.preRevenueBurnLockup.toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-4 border-t border-slate-100 pt-2.5 text-[11px] leading-normal text-slate-500">
                    <strong>Assessor Lens:</strong> Covers operating burn during Months 1–{Math.max(1, step2Data.monthToStartRevenue - 1)} before sales start.
                  </div>
                </div>

                {/* Card 4: Peak Working Capital Requirement */}
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/30 p-4.5 shadow-xs flex flex-col justify-between transition-all">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                        {isPlainMode ? 'Total Working Capital Tie-Up' : 'Peak Working Capital Lockup'}
                      </span>
                      <Badge className="bg-indigo-600 text-white text-[10px]">
                        Cash Buffer Target
                      </Badge>
                    </div>
                    <div className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                      {currencySymbol}
                      {step2Metrics.peakWorkingCapitalLockup.toLocaleString()}
                    </div>
                    <div className="mt-3 rounded-lg bg-white border border-indigo-100 px-2.5 py-1.5 text-xs text-slate-700">
                      Auto-added to Step 3 Funding Gap
                    </div>
                  </div>
                  <div className="mt-4 border-t border-indigo-100 pt-2.5 text-[11px] leading-normal text-indigo-900">
                    <strong>Assessor Lens:</strong> Justification for UK Start Up Loans, Microfinance Ireland, or LEO working capital support.
                  </div>
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------- */}
            {/* 2.5: WRITTEN WORKING CAPITAL JUSTIFICATION + PARKING LOT  */}
            {/* --------------------------------------------------------- */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Label className="text-xs font-bold text-slate-900">
                    2.5{' '}
                    {isPlainMode
                      ? 'Written Summary of Your Payment Timing & Seasonality (For Your Business Plan)'
                      : 'Written Working Capital, Debtor Cycle & Seasonality Justification'}
                  </Label>
                  <p className="text-[11px] text-slate-500">
                    Explain when customers pay you, how you manage stock/build lead times, and why your monthly sales ramp is realistic.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleGenerateAiStep2}
                  disabled={isGeneratingAiStep2 || isVaultReadonly}
                  className="h-7 border-violet-200 bg-violet-50/60 text-[11px] font-medium text-violet-700 hover:bg-violet-100"
                >
                  <Wand2 className="mr-1 h-3.5 w-3.5 text-violet-600" />
                  {isGeneratingAiStep2 ? 'Synthesizing...' : 'Write Summary with AI'}
                </Button>
              </div>

              <textarea
                rows={4}
                value={step2Data.workingCapitalNarrative}
                onChange={(e) =>
                  setStep2Data((prev) => ({
                    ...prev,
                    workingCapitalNarrative: e.target.value,
                  }))
                }
                disabled={isVaultReadonly}
                placeholder="Explain your customer payment terms (e.g. instant card vs 30-day B2B invoice), any upfront stock or pre-launch build months, and how seasonal peaks affect your cashflow..."
                className="w-full rounded-xl border border-slate-300 p-3 text-base sm:text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden"
              />

              {step2Data.grantAssessorTip && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900 flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-amber-700 shrink-0" />
                  <div>
                    <span className="font-semibold text-amber-950">
                      Grant Underwriter Tip:{' '}
                    </span>
                    <span>{step2Data.grantAssessorTip}</span>
                  </div>
                </div>
              )}

              {/* Momentum Protection: Park It in Open Questions (Rule 1.3) */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <HelpCircle className="h-4 w-4 text-indigo-600" />
                  <span>
                    Unsure what payment terms enterprise buyers or wholesalers in your sector demand? Park it in Open Questions:
                  </span>
                </div>
                <div className="mt-2 flex flex-col sm:flex-row gap-2">
                  <Input
                    type="text"
                    value={parkingQuestionStep2}
                    onChange={(e) => setParkingQuestionStep2(e.target.value)}
                    placeholder="e.g. Check whether retail stockists pay on 30-day or 60-day invoice terms..."
                    disabled={isVaultReadonly}
                    className="h-8 bg-white text-base sm:text-xs flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleParkStep2Question}
                    disabled={isParkingStep2 || !parkingQuestionStep2.trim() || isVaultReadonly}
                    className="h-8 border-indigo-200 text-xs font-medium text-indigo-700 hover:bg-indigo-50 shrink-0"
                  >
                    Park It in Open Questions
                  </Button>
                </div>
                {parkedSuccessStep2 && (
                  <p className="mt-1.5 text-[11px] font-medium text-emerald-700">
                    ✓ Parked in your Open Questions list!
                  </p>
                )}
              </div>
            </div>

            {/* Bottom Step 2 Toolbar (Strict GEMINI.md Rule 6.1 Standard) */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setOpenStep(1)}
                  className="text-xs text-slate-600 hover:bg-slate-100"
                >
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                  Back to Step 1: Monthly Bills
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleGenerateAiStep2}
                  disabled={isGeneratingAiStep2 || isVaultReadonly}
                  className="text-xs border-violet-200 text-violet-700 hover:bg-violet-50"
                >
                  <Wand2 className="mr-1.5 h-3.5 w-3.5" />
                  AI Calibrate Step 2
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleSaveStep2(false)}
                  disabled={saveStatusStep2 === 'saving' || isVaultReadonly}
                  className="text-xs"
                >
                  {saveStatusStep2 === 'saving'
                    ? 'Saving...'
                    : saveStatusStep2 === 'saved'
                    ? '✓ Saved'
                    : 'Save Step 2'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleSaveStep2(true)}
                  disabled={saveStatusStep2 === 'saving'}
                  className="bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  Save &amp; Next: 36-Month Cash Trough
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============================================================= */}
      {/* STEP 3: 36-MONTH CASHFLOW CURVE, CASH TROUGH & GRANT BRIDGE   */}
      {/* ============================================================= */}
      {openStep !== 'ALL' && openStep !== 3 ? (
        <div
          id="module-j-step-3"
          onClick={() => setOpenStep(3)}
          className="group scroll-mt-24 cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  isStep3Complete
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 text-white'
                }`}
              >
                {isStep3Complete ? <Check className="h-4 w-4" /> : '3'}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                  Step 3: 36-Month Cashflow Curve, &ldquo;Cash Trough&rdquo; &amp; Grant Reimbursement Bridge
                </h2>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  Lowest Cash Point: {currencySymbol}
                  {step3Metrics.operatingCashTroughAmount.toLocaleString()} (Month{' '}
                  {step3Metrics.operatingCashTroughMonth}) • Target Raise:{' '}
                  {currencySymbol}
                  {step3Metrics.recommendedCapitalRaise.toLocaleString()} • Stacked:{' '}
                  {currencySymbol}
                  {step3Metrics.totalStackedFunding.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge
                variant={isStep3Complete ? 'default' : 'outline'}
                className={`shrink-0 text-[10px] font-medium ${
                  isStep3Complete
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'border-slate-300 text-slate-600'
                }`}
              >
                {isStep3Complete ? 'Complete' : 'In Progress'}
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 shrink-0 px-2.5 text-xs font-medium text-indigo-600 group-hover:bg-indigo-50"
              >
                {isStep3Complete ? 'Edit Step' : 'Open Step'}
                <ChevronDown className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Card
          id="module-j-step-3"
          className="scroll-mt-24 rounded-xl border border-slate-200 bg-white shadow-xs"
        >
          {/* Strict GEMINI.md Rule 6.1 Expanded Step Header */}
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    isStep3Complete
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  {isStep3Complete ? <Check className="h-4 w-4" /> : '3'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base font-bold text-slate-900">
                      Step 3:{' '}
                      {isPlainMode
                        ? 'Your 36-Month Bank Balance, "Cash Trough" Finder & Grant Delay Bridge'
                        : '36-Month Cashflow Curve, Peak Deficit Trough & Capital Stack Bridge'}
                    </CardTitle>
                    <Badge
                      variant={isStep3Complete ? 'default' : 'outline'}
                      className={`shrink-0 text-[10px] font-medium ${
                        isStep3Complete
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'border-slate-300 text-slate-600'
                      }`}
                    >
                      {isStep3Complete ? 'Complete' : 'In Progress'}
                    </Badge>
                    <Badge className="shrink-0 bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-medium">
                      36-Month Runway &amp; Grant Arrears Engine
                    </Badge>
                  </div>
                  <CardDescription className="mt-1 text-xs text-slate-600">
                    {isPlainMode
                      ? 'Instead of guessing how much money you need to start, we plot your bank balance across all 36 months, pinpoint the exact month it hits its lowest point ("The Cash Trough"), and make sure you don’t run out of money waiting 3 months for grant reimbursements.'
                      : 'Calculates cumulative 36-month operating cashflow, identifies the exact month and depth of peak cash deficit, and structures upfront vs. arrears-reimbursed funding sources.'}
                  </CardDescription>
                </div>
              </div>

              {/* Clean Rule: Top-right header action contains ONLY Collapse Step */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setOpenStep(0)}
                  className="text-xs text-slate-500 hover:bg-slate-100"
                >
                  Collapse Step
                  <ChevronUp className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Dedicated 4-Layer Support Strip (Directly Below Title & Description) */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setActiveWhyCard((prev) => (prev === 3 ? null : 3))
                  }
                  className="h-7 border-indigo-200 text-[11px] font-medium text-indigo-700 hover:bg-indigo-50"
                >
                  <HelpCircle className="mr-1 h-3.5 w-3.5" />
                  Why Are We Asking This?
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setActiveExampleCard((prev) => (prev === 3 ? null : 3))
                  }
                  className="h-7 border-emerald-200 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50"
                >
                  <Lightbulb className="mr-1 h-3.5 w-3.5" />
                  Show Me an Example
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleGenerateAiStep3}
                  disabled={isGeneratingAiStep3 || isVaultReadonly}
                  className="h-7 border-violet-200 bg-violet-50/60 text-[11px] font-medium text-violet-700 hover:bg-violet-100"
                >
                  <Sparkles className="mr-1 h-3.5 w-3.5 text-violet-600" />
                  {isGeneratingAiStep3
                    ? 'Calibrating Cash Trough...'
                    : 'Calibrate Cashflow & Funding Stack with AI'}
                </Button>
              </div>

              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
                <button
                  type="button"
                  onClick={() =>
                    setStep1Data((prev) => ({
                      ...prev,
                      viewLanguageMode: 'PLAIN_ENGLISH_FOUNDER',
                    }))
                  }
                  className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${
                    isPlainMode
                      ? 'bg-white text-indigo-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Plain-English View
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setStep1Data((prev) => ({
                      ...prev,
                      viewLanguageMode: 'OFFICIAL_GRANT_ACCOUNTANT',
                    }))
                  }
                  className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${
                    !isPlainMode
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Grant &amp; Accountant View
                </button>
              </div>
            </div>

            {/* Collapsible Why Card */}
            {activeWhyCard === 3 && (
              <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50/70 p-3.5 text-xs text-indigo-900">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1.5">
                    <p className="font-bold text-indigo-950">
                      Why &ldquo;The Cash Trough&rdquo; &amp; Grant Reimbursement Timing Matter
                    </p>
                    <p>
                      <strong>1. Never Guess Your Funding Ask:</strong> If you walk into a Local Enterprise Office (LEO), Enterprise Ireland, or UK Start Up Loans interview and ask for {currencySymbol}25,000 &ldquo;because it sounds like a round number,&rdquo; underwriters push back. Showing that your cumulative cashflow hits a maximum dip of {currencySymbol}
                      {Math.abs(Math.min(0, step3Metrics.operatingCashTroughAmount)).toLocaleString()} in Month {step3Metrics.operatingCashTroughMonth} (+ {step3Data.safetyBufferPercent}% buffer = {currencySymbol}
                      {step3Metrics.recommendedCapitalRaise.toLocaleString()}) proves your ask is mathematically grounded.
                    </p>
                    <p>
                      <strong>2. The #1 Grant Trap (Paid in Arrears):</strong> Most government grants in Ireland and the UK do <em>not</em> wire you money upfront on Day 1. You must spend 100% of the invoice first, show paid bank receipts + tax clearance, and wait 2–3 months for reimbursement. Step 3 makes sure you have enough Day-1 bridge cash so you never bounce a payment waiting for a grant refund.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveWhyCard(null)}
                    className="text-indigo-500 hover:text-indigo-800 font-bold px-1"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Collapsible Example Card */}
            {activeExampleCard === 3 && (
              <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/70 p-3.5 text-xs text-emerald-950">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1.5">
                    <p className="font-bold text-emerald-900">
                      Industry Example ({plan.industryCategory || 'Startup Venture'} — {isUK ? 'UK' : 'Ireland'})
                    </p>
                    <p>
                      <strong>Pre-Funding Cash Trough:</strong> Between buying equipment in Month 1, waiting {step2Metrics.effectiveDebtorDays} days for B2B invoices to clear, and paying monthly bills, cumulative operating cash hits its lowest point of <strong>-{currencySymbol}18,500 in Month 5</strong> before turning cashflow-positive in Month 8.
                    </p>
                    <p>
                      <strong>Smart Capital Stack (+20% Buffer = {currencySymbol}22,500):</strong> The founder puts in <strong>{currencySymbol}7,500 personal savings on Day 1</strong>, pairs it with a <strong>{currencySymbol}7,500 {isUK ? 'British Business Bank Start Up Loan' : 'Microfinance Ireland Loan'} on Day 1</strong> (giving {currencySymbol}15,000 upfront cash to pay suppliers), and claims back <strong>{currencySymbol}7,500 in {isUK ? 'Innovate UK / Regional' : 'LEO Priming'} grant reimbursements</strong> in Month 4 and Month 7.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveExampleCard(null)}
                    className="text-emerald-600 hover:text-emerald-900 font-bold px-1"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {aiMessageStep3 && (
              <div className="flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 p-3 text-xs text-violet-900">
                <Sparkles className="h-4 w-4 text-violet-600 shrink-0" />
                <span>{aiMessageStep3}</span>
              </div>
            )}

            {/* --------------------------------------------------------- */}
            {/* 3.1: PRIMARY FUNDING & RUNWAY STRATEGY (With Mandatory OTHER) */}
            {/* --------------------------------------------------------- */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-indigo-600" />
                    3.1{' '}
                    {isPlainMode
                      ? 'How Do You Plan to Fund Your Early Cash Dip?'
                      : 'Primary Capital Stack & Working Capital Financing Posture'}
                  </h3>
                  <p className="text-xs text-slate-600">
                    {isPlainMode
                      ? 'Choose the main approach you will use to cover your startup costs until customer cashflow takes over.'
                      : 'Select the primary financing structure for bridging the pre-breakeven operating cash trough.'}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleMatchRecommendedRaiseStep3}
                  disabled={isVaultReadonly}
                  className="h-7 border-indigo-200 text-[11px] font-medium text-indigo-700 hover:bg-indigo-50"
                >
                  <Calculator className="mr-1 h-3.5 w-3.5" />
                  Auto-Size Stack to Cover My Cash Trough ({currencySymbol}
                  {step3Metrics.recommendedCapitalRaise.toLocaleString()})
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {PRIMARY_FUNDING_STRATEGY_OPTIONS.map((opt) => {
                  const isSelected =
                    (step3Data.primaryFundingStrategy || 'GRANT_PLUS_MATCH_FUNDING') ===
                    opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => {
                        if (!isVaultReadonly) {
                          setStep3Data((prev) => ({
                            ...prev,
                            primaryFundingStrategy: opt.id,
                          }));
                        }
                      }}
                      className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-500'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {isPlainMode ? opt.plainTitle : opt.accountantTitle}
                        </span>
                        <Badge
                          variant="secondary"
                          className={`text-[9px] px-1.5 py-0.5 shrink-0 ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {opt.badge}
                        </Badge>
                      </div>
                      <p className="mt-1.5 text-[11px] text-slate-600 leading-snug">
                        {opt.description}
                      </p>
                      <div className="mt-2 border-t border-slate-100 pt-1.5 text-[10px] text-indigo-700">
                        <span className="font-semibold">Assessor Lens: </span>
                        {opt.grantNote}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Mandatory "OTHER" Custom Input (Strict GEMINI.md Rule 1.5) */}
              {step3Data.primaryFundingStrategy === 'OTHER' && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-2">
                  <Label className="text-xs font-bold text-slate-900">
                    Describe Your Custom Funding &amp; Runway Strategy
                  </Label>
                  <Input
                    type="text"
                    value={step3Data.otherPrimaryFundingStrategyText || ''}
                    onChange={(e) =>
                      setStep3Data((prev) => ({
                        ...prev,
                        otherPrimaryFundingStrategyText: e.target.value,
                      }))
                    }
                    placeholder="e.g. Enterprise Ireland New Frontiers €15,000 stipend + pilot customer upfront annual licence..."
                    disabled={isVaultReadonly}
                    className="h-9 bg-white text-base sm:text-xs"
                  />
                </div>
              )}
            </div>

            {/* --------------------------------------------------------- */}
            {/* 3.2: STARTING CASH, SAFETY BUFFER & LOAN REPAYMENT TERMS  */}
            {/* --------------------------------------------------------- */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    3.2{' '}
                    {isPlainMode
                      ? 'Day-1 Cash in Bank, Safety Cushion & Loan Repayment Settings'
                      : 'Opening Cash Balance, Contingency Reserve & Debt Amortization Parameters'}
                  </h3>
                  <p className="text-xs text-slate-600">
                    {isPlainMode
                      ? 'We add a safety cushion on top of your lowest cash point so one late invoice never puts you out of business.'
                      : 'Sets opening liquidity, contingency buffer above peak deficit, and loan repayment terms.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs font-bold text-slate-900">
                    {isPlainMode
                      ? `Day-1 Starting Cash Already in Bank (${currencySymbol})`
                      : `Opening Cash Balance Day 1 (${currencySymbol})`}
                  </Label>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Input
                      type="number"
                      min={0}
                      value={step3Data.startingCashBalanceDay1}
                      onChange={(e) =>
                        setStep3Data((prev) => ({
                          ...prev,
                          startingCashBalanceDay1: Math.max(0, Number(e.target.value) || 0),
                        }))
                      }
                      disabled={isVaultReadonly}
                      className="h-9 bg-white text-base sm:text-xs font-bold"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setStep3Data((prev) => ({
                          ...prev,
                          startingCashBalanceDay1: isUK ? 3500 : 4000,
                        }))
                      }
                      disabled={isVaultReadonly}
                      className="h-9 px-2 text-[10px] shrink-0"
                    >
                      Benchmark
                    </Button>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500">
                    Existing cash in the business bank account on Day 1.
                  </p>
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-900">
                    {isPlainMode
                      ? 'Extra Safety Cushion Above Lowest Point (%)'
                      : 'Working Capital Contingency Buffer (%)'}
                  </Label>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={step3Data.safetyBufferPercent}
                      onChange={(e) =>
                        setStep3Data((prev) => ({
                          ...prev,
                          safetyBufferPercent: Math.max(
                            0,
                            Math.min(100, Number(e.target.value) || 0)
                          ),
                        }))
                      }
                      disabled={isVaultReadonly}
                      className="h-9 bg-white text-base sm:text-xs font-bold"
                    />
                    {[15, 20, 30].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() =>
                          !isVaultReadonly &&
                          setStep3Data((prev) => ({ ...prev, safetyBufferPercent: pct }))
                        }
                        className={`h-9 rounded-md border px-2 text-[10px] font-semibold ${
                          step3Data.safetyBufferPercent === pct
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500">
                    20% is the standard grant underwriter safety rule.
                  </p>
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-900">
                    {isPlainMode
                      ? 'Startup Loan Interest Rate (% p.a.)'
                      : 'Debt Facility Annual Interest Rate (%)'}
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    min={0}
                    max={25}
                    value={step3Data.loanInterestRatePercent}
                    onChange={(e) =>
                      setStep3Data((prev) => ({
                        ...prev,
                        loanInterestRatePercent: Math.max(0, Number(e.target.value) || 0),
                      }))
                    }
                    disabled={isVaultReadonly}
                    className="mt-1 h-9 bg-white text-base sm:text-xs font-semibold"
                  />
                  <p className="mt-1 text-[10px] text-slate-500">
                    {isUK
                      ? 'UK Start Up Loans are fixed at 6.0% p.a.'
                      : 'Microfinance Ireland loans average 6.8%–7.8% APR.'}
                  </p>
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-900">
                    {isPlainMode
                      ? 'Loan Repayment Term (Months)'
                      : 'Loan Amortization Period (Months)'}
                  </Label>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Input
                      type="number"
                      min={12}
                      max={60}
                      value={step3Data.loanTermMonths}
                      onChange={(e) =>
                        setStep3Data((prev) => ({
                          ...prev,
                          loanTermMonths: Math.max(
                            12,
                            Math.min(60, Number(e.target.value) || 36)
                          ),
                        }))
                      }
                      disabled={isVaultReadonly}
                      className="h-9 bg-white text-base sm:text-xs font-semibold"
                    />
                    <Badge className="bg-slate-200 text-slate-800 text-[10px] shrink-0">
                      {currencySymbol}
                      {step3Metrics.monthlyLoanRepayment.toLocaleString()}/mo
                    </Badge>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500">
                    Auto-calculates monthly loan repayment in your cashflow.
                  </p>
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------- */}
            {/* 3.3: CAPITAL STACK BUILDER & GRANT REIMBURSEMENT BRIDGE   */}
            {/* --------------------------------------------------------- */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-indigo-600" />
                    3.3{' '}
                    {isPlainMode
                      ? 'Your Funding Stack & "Grant Reimbursement Delay" Bridge'
                      : 'Capital Stack Schedule & Arrears Grant Drawdown Timing'}
                  </h3>
                  <p className="text-xs text-slate-600">
                    {isPlainMode
                      ? 'Add each source of money below. Mark grants as "Paid in Arrears" so we model the 2–3 month wait before the grant agency refunds your bank account.'
                      : 'Specify each capital source and whether funds arrive on Day 1 or in arrears following paid receipt verification.'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setShowBankingPartnerDrawerStep3((prev) => !prev)
                    }
                    className="h-8 border-emerald-200 bg-emerald-50/70 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
                  >
                    <Building2 className="mr-1.5 h-3.5 w-3.5 text-emerald-700" />
                    {showBankingPartnerDrawerStep3
                      ? 'Hide Business Banking Perks'
                      : 'Need a Business Bank Account for Grants?'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddFundingSource}
                    disabled={isVaultReadonly}
                    className="h-8 border-indigo-200 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Add Funding Source
                  </Button>
                </div>
              </div>

              {showBankingPartnerDrawerStep3 && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-950">
                      Recommended Business Bank Accounts for Grant Drawdown &amp; Working Capital ({effectiveCountry})
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowBankingPartnerDrawerStep3(false)}
                      className="text-xs text-slate-500 hover:text-slate-800"
                    >
                      Close ✕
                    </button>
                  </div>
                  <PartnerSlot
                    slot="OPS_STEP_3_BANKING"
                    projectId={plan.id}
                    countryCode={effectiveCountry}
                  />
                </div>
              )}

              <div className="space-y-3">
                {step3Data.fundingSources.map((src) => {
                  const catMeta =
                    FUNDING_SOURCE_CATEGORY_OPTIONS.find((c) => c.id === src.sourceType) ||
                    FUNDING_SOURCE_CATEGORY_OPTIONS[0];
                  return (
                    <div
                      key={src.id}
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                        <div className="md:col-span-4">
                          <Label className="text-[11px] font-bold text-slate-700">
                            {isPlainMode ? 'Funding Type' : 'Capital Classification'}
                          </Label>
                          <select
                            value={src.sourceType}
                            onChange={(e) => {
                              const nextType = e.target.value as FundingSourceCategoryType;
                              const meta =
                                FUNDING_SOURCE_CATEGORY_OPTIONS.find(
                                  (c) => c.id === nextType
                                ) || FUNDING_SOURCE_CATEGORY_OPTIONS[0];
                              handleUpdateFundingSource(src.id, {
                                sourceType: nextType,
                                isReimbursementArrears: meta.defaultArrears,
                                reimbursementLagMonths: meta.defaultLagMonths,
                              });
                            }}
                            disabled={isVaultReadonly}
                            className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-base sm:text-xs font-medium text-slate-900"
                          >
                            {FUNDING_SOURCE_CATEGORY_OPTIONS.map((c) => (
                              <option key={c.id} value={c.id}>
                                {isPlainMode ? c.plainLabel : c.accountantLabel}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="md:col-span-4">
                          <Label className="text-[11px] font-bold text-slate-700">
                            {isPlainMode
                              ? 'Name / Description of Source'
                              : 'Facility / Instrument Name'}
                          </Label>
                          <Input
                            type="text"
                            value={src.label}
                            onChange={(e) =>
                              handleUpdateFundingSource(src.id, {
                                label: e.target.value,
                              })
                            }
                            disabled={isVaultReadonly}
                            className="mt-1 h-9 bg-white text-base sm:text-xs"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <Label className="text-[11px] font-bold text-slate-700">
                            Amount ({currencySymbol})
                          </Label>
                          <Input
                            type="number"
                            min={0}
                            value={src.amount}
                            onChange={(e) =>
                              handleUpdateFundingSource(src.id, {
                                amount: Math.max(0, Number(e.target.value) || 0),
                              })
                            }
                            disabled={isVaultReadonly}
                            className="mt-1 h-9 bg-white text-base sm:text-xs font-bold"
                          />
                        </div>

                        <div className="md:col-span-2 flex items-end justify-between md:justify-end gap-2 pt-5">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              src.isReimbursementArrears
                                ? 'border-amber-300 bg-amber-50 text-amber-800'
                                : 'border-emerald-300 bg-emerald-50 text-emerald-800'
                            }`}
                          >
                            {src.isReimbursementArrears
                              ? `${src.reimbursementLagMonths}mo Arrears`
                              : 'Day-1 Cash'}
                          </Badge>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteFundingSource(src.id)}
                            disabled={
                              isVaultReadonly || step3Data.fundingSources.length <= 1
                            }
                            className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Mandatory "OTHER" Custom Input on Funding Source Row */}
                      {src.sourceType === 'OTHER' && (
                        <div className="rounded-lg border border-indigo-200 bg-indigo-50/40 p-2.5">
                          <Label className="text-[11px] font-bold text-slate-900">
                            Specify Custom Funding Source Type
                          </Label>
                          <Input
                            type="text"
                            value={src.otherSourceTypeText || ''}
                            onChange={(e) =>
                              handleUpdateFundingSource(src.id, {
                                otherSourceTypeText: e.target.value,
                              })
                            }
                            placeholder="e.g. Accelerator Stipend, Customer Pre-Orders, R&D Tax Credit Refund..."
                            disabled={isVaultReadonly}
                            className="mt-1 h-8 bg-white text-base sm:text-xs"
                          />
                        </div>
                      )}

                      {/* Grant Reimbursement Timing Toggle Row */}
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 border border-slate-100 text-xs">
                        <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                          <input
                            type="checkbox"
                            checked={src.isReimbursementArrears}
                            onChange={(e) =>
                              handleUpdateFundingSource(src.id, {
                                isReimbursementArrears: e.target.checked,
                                reimbursementLagMonths: e.target.checked
                                  ? Math.max(1, src.reimbursementLagMonths || 3)
                                  : 0,
                              })
                            }
                            disabled={isVaultReadonly}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                          />
                          <span>
                            {isPlainMode
                              ? 'Paid in Arrears (Grant rules: you must spend the money first & wait for refund)'
                              : 'Reimbursed in Arrears Upon Vouched Expenditure Receipts'}
                          </span>
                        </label>

                        {src.isReimbursementArrears && (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-amber-800">
                              Reimbursement Delay (Months):
                            </span>
                            <Input
                              type="number"
                              min={1}
                              max={12}
                              value={src.reimbursementLagMonths}
                              onChange={(e) =>
                                handleUpdateFundingSource(src.id, {
                                  reimbursementLagMonths: Math.max(
                                    1,
                                    Math.min(12, Number(e.target.value) || 3)
                                  ),
                                })
                              }
                              disabled={isVaultReadonly}
                              className="h-7 w-16 bg-white text-base sm:text-xs font-bold text-amber-900"
                            />
                            <span className="text-[10px] text-slate-500">
                              (Claims land in M{1 + (src.reimbursementLagMonths || 3)} &amp; M
                              {4 + (src.reimbursementLagMonths || 3)})
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* --------------------------------------------------------- */}
            {/* 3.4: INTERACTIVE 12-QUARTER (36-MONTH) CASH TROUGH CHART  */}
            {/* --------------------------------------------------------- */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-white shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-indigo-500/20 text-indigo-200 border-indigo-400/30 text-[10px]">
                      36-Month / 12-Quarter Cashflow Simulator
                    </Badge>
                    <Badge className="bg-amber-500/20 text-amber-200 border-amber-400/30 text-[10px]">
                      Cash Trough: Month {step3Metrics.operatingCashTroughMonth} (
                      {currencySymbol}
                      {step3Metrics.operatingCashTroughAmount.toLocaleString()})
                    </Badge>
                  </div>
                  <h3 className="mt-1.5 text-sm font-bold text-white">
                    {isPlainMode
                      ? 'Your 36-Month Bank Balance: Before Funding vs. With Your Funding Stack'
                      : '36-Month Cumulative Operating Cash Deficit vs. Funded Bank Liquidity (Q1–Q12)'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isPlainMode
                      ? 'Rose bars show where your cash would dip without funding ("The Cash Trough"). Emerald bars show your actual bank balance with your funding stack and grant timing.'
                      : 'Contrasts unlevered cumulative operating cashflow against funded bank balance incorporating arrears grant lags and debt service.'}
                  </p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setShowQuarterlyTableStep3((prev) => !prev)
                  }
                  className="h-8 border-slate-700 bg-slate-900 text-xs text-slate-200 hover:bg-slate-800"
                >
                  {showQuarterlyTableStep3
                    ? 'Hide 12-Quarter Numeric Table'
                    : 'View 12-Quarter Numeric Table'}
                </Button>
              </div>

              {/* 12-Quarter Dual-Bar Visual Chart */}
              <div className="overflow-x-auto pb-2">
                <div className="min-w-[680px] grid grid-cols-12 gap-2 pt-2">
                  {(() => {
                    const maxAbs = Math.max(
                      1000,
                      ...step3Metrics.quarterlySchedule.map((q) =>
                        Math.max(
                          Math.abs(q.endingOperatingCash),
                          Math.abs(q.endingFundedBankBalance)
                        )
                      )
                    );
                    return step3Metrics.quarterlySchedule.map((qRow) => {
                      const opVal = qRow.endingOperatingCash;
                      const bankVal = qRow.endingFundedBankBalance;
                      const opHeight = Math.max(
                        6,
                        Math.round((Math.abs(opVal) / maxAbs) * 76)
                      );
                      const bankHeight = Math.max(
                        6,
                        Math.round((Math.abs(bankVal) / maxAbs) * 76)
                      );
                      return (
                        <div
                          key={qRow.quarterIndex}
                          className="flex flex-col items-center rounded-lg bg-slate-900/90 p-2 border border-slate-800"
                        >
                          <div className="flex h-24 w-full items-end justify-center gap-1.5 border-b border-slate-800 pb-1">
                            <div
                              title={`${qRow.yearLabel} Pre-Funding Operating Cash: ${currencySymbol}${opVal.toLocaleString()}`}
                              style={{ height: `${opHeight}px` }}
                              className={`w-3 rounded-t-xs transition-all ${
                                opVal < 0 ? 'bg-rose-400/90' : 'bg-indigo-400/90'
                              }`}
                            />
                            <div
                              title={`${qRow.yearLabel} Funded Bank Balance: ${currencySymbol}${bankVal.toLocaleString()}`}
                              style={{ height: `${bankHeight}px` }}
                              className={`w-3 rounded-t-xs transition-all ${
                                bankVal < 0 ? 'bg-amber-400' : 'bg-emerald-400'
                              }`}
                            />
                          </div>
                          <span className="mt-1.5 text-[10px] font-bold text-slate-300">
                            {qRow.label}
                          </span>
                          <span
                            className={`text-[10px] font-semibold ${
                              bankVal < 0 ? 'text-rose-300' : 'text-emerald-300'
                            }`}
                          >
                            {bankVal < 0 ? '-' : ''}
                            {currencySymbol}
                            {Math.abs(bankVal) >= 1000
                              ? `${(Math.abs(bankVal) / 1000).toFixed(1)}k`
                              : Math.abs(bankVal)}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-3 text-[11px] text-slate-300">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-xs bg-rose-400 inline-block" />
                    Pre-Funding Operating Cash Dip (Trough)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-xs bg-emerald-400 inline-block" />
                    Actual Bank Balance (With Funding Stack)
                  </span>
                </div>
                <div>
                  Month 36 Ending Bank Balance:{' '}
                  <strong className="text-emerald-300">
                    {currencySymbol}
                    {step3Metrics.endingBankBalanceM36.toLocaleString()}
                  </strong>
                </div>
              </div>

              {showQuarterlyTableStep3 && (
                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/90">
                  <table className="w-full min-w-[680px] text-left text-xs text-slate-200">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/70 text-[10px] uppercase tracking-wider text-slate-400">
                        <th className="px-3 py-2">Quarter</th>
                        <th className="px-3 py-2">Customer Cash In</th>
                        <th className="px-3 py-2">Operating &amp; Debt Out</th>
                        <th className="px-3 py-2">Funding / Grant In</th>
                        <th className="px-3 py-2">Pre-Funding Cash</th>
                        <th className="px-3 py-2">Ending Bank Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {step3Metrics.quarterlySchedule.map((qRow) => (
                        <tr
                          key={qRow.quarterIndex}
                          className="border-b border-slate-800/70"
                        >
                          <td className="px-3 py-2 font-bold text-white">
                            {qRow.yearLabel} ({qRow.label})
                          </td>
                          <td className="px-3 py-2 text-slate-300">
                            {currencySymbol}
                            {qRow.cashInflow.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-slate-300">
                            {currencySymbol}
                            {qRow.operatingOutflow.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-indigo-300 font-medium">
                            {currencySymbol}
                            {qRow.grantAndFundingInflow.toLocaleString()}
                          </td>
                          <td
                            className={`px-3 py-2 font-medium ${
                              qRow.endingOperatingCash < 0
                                ? 'text-rose-300'
                                : 'text-slate-300'
                            }`}
                          >
                            {currencySymbol}
                            {qRow.endingOperatingCash.toLocaleString()}
                          </td>
                          <td
                            className={`px-3 py-2 font-bold ${
                              qRow.endingFundedBankBalance < 0
                                ? 'text-rose-400'
                                : 'text-emerald-300'
                            }`}
                          >
                            {currencySymbol}
                            {qRow.endingFundedBankBalance.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* --------------------------------------------------------- */}
            {/* 3.5: MULTI-COLUMN UNDERWRITING DIAGNOSTIC GRID (Rule 6.2) */}
            {/* --------------------------------------------------------- */}
            <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/70 via-white to-slate-50/40 p-5 sm:p-6 shadow-xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-200/60 text-indigo-700">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {isPlainMode
                        ? 'Your 36-Month Cash Trough & Funding Gap Scorecard'
                        : 'Step 3 Cashflow Trough, Grant Bridge & Solvency Diagnostic'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Proves to grant assessors and lenders that your capital stack covers both your deepest cash dip and grant reimbursement delays.
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="border-indigo-200 bg-indigo-50 text-[10px] font-semibold text-indigo-700"
                >
                  Feeds Step 4 3-Year Statements
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {/* Card 1: Pre-Funding Cash Trough */}
                <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-xs flex flex-col justify-between transition-all">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        {isPlainMode ? 'Lowest Cash Point (Trough)' : 'Peak Operating Cash Deficit'}
                      </span>
                      <Badge className="bg-rose-100 text-rose-800 text-[10px]">
                        Month {step3Metrics.operatingCashTroughMonth}
                      </Badge>
                    </div>
                    <div className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                      {currencySymbol}
                      {step3Metrics.operatingCashTroughAmount.toLocaleString()}
                    </div>
                    <div className="mt-3 rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1.5 text-xs text-slate-600">
                      Monthly Cash-Positive:{' '}
                      <strong className="text-slate-900">
                        {step3Metrics.cashflowPositiveMonth
                          ? `Month ${step3Metrics.cashflowPositiveMonth}`
                          : 'Post-Y3'}
                      </strong>
                    </div>
                  </div>
                  <div className="mt-4 border-t border-slate-100 pt-2.5 text-[11px] leading-normal text-slate-500">
                    <strong>Assessor Lens:</strong> Pinpoints the exact month and depth of your maximum cumulative cash burn before funding.
                  </div>
                </div>

                {/* Card 2: Recommended Capital Raise (+Buffer) */}
                <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-xs flex flex-col justify-between transition-all">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        {isPlainMode ? 'Recommended Total Raise' : 'Target Capital Requirement'}
                      </span>
                      <Badge className="bg-indigo-100 text-indigo-800 text-[10px]">
                        +{step3Data.safetyBufferPercent}% Buffer
                      </Badge>
                    </div>
                    <div className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                      {currencySymbol}
                      {step3Metrics.recommendedCapitalRaise.toLocaleString()}
                    </div>
                    <div className="mt-3 rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1.5 text-xs text-slate-600">
                      Stacked So Far:{' '}
                      <strong className="text-indigo-700">
                        {currencySymbol}
                        {step3Metrics.totalStackedFunding.toLocaleString()}
                      </strong>
                    </div>
                  </div>
                  <div className="mt-4 border-t border-slate-100 pt-2.5 text-[11px] leading-normal text-slate-500">
                    <strong>Assessor Lens:</strong> Combines your Cash Trough depth with a {step3Data.safetyBufferPercent}% working-capital contingency reserve.
                  </div>
                </div>

                {/* Card 3: Grant Reimbursement Bridge */}
                <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-xs flex flex-col justify-between transition-all">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        {isPlainMode ? 'Grant Paid in Arrears' : 'Arrears Grant Reimbursement'}
                      </span>
                      <Badge className="bg-amber-100 text-amber-800 text-[10px]">
                        {step3Metrics.maxGrantLagMonths}mo Lag
                      </Badge>
                    </div>
                    <div className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                      {currencySymbol}
                      {step3Metrics.reimbursedGrantTotal.toLocaleString()}
                    </div>
                    <div className="mt-3 rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1.5 text-xs text-slate-600">
                      Day-1 Non-Grant Cash:{' '}
                      <strong className="text-slate-900">
                        {currencySymbol}
                        {(
                          (Number(step3Data.startingCashBalanceDay1) || 0) +
                          step3Metrics.upfrontNonArrearsFunding
                        ).toLocaleString()}
                      </strong>
                    </div>
                  </div>
                  <div className="mt-4 border-t border-slate-100 pt-2.5 text-[11px] leading-normal text-slate-500">
                    <strong>Assessor Lens:</strong> Proves you have Day-1 bridge cash to pay suppliers first before claiming back {isUK ? 'Innovate UK' : 'LEO / EI'} grants.
                  </div>
                </div>

                {/* Card 4: Lowest Funded Bank Balance & Solvency */}
                <div
                  className={`rounded-xl border p-4.5 shadow-xs flex flex-col justify-between transition-all ${
                    step3Metrics.lowestFundedBankBalance >= 0
                      ? 'border-emerald-200 bg-emerald-50/30'
                      : 'border-rose-200 bg-rose-50/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                        {isPlainMode ? 'Lowest Funded Bank Balance' : 'Minimum Funded Liquidity'}
                      </span>
                      <Badge
                        className={`text-[10px] ${
                          step3Metrics.lowestFundedBankBalance >= 0
                            ? 'bg-emerald-600 text-white'
                            : 'bg-rose-600 text-white'
                        }`}
                      >
                        {step3Metrics.lowestFundedBankBalance >= 0
                          ? 'Solvent 36 Mo'
                          : 'Bridge Needed'}
                      </Badge>
                    </div>
                    <div className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                      {currencySymbol}
                      {step3Metrics.lowestFundedBankBalance.toLocaleString()}
                    </div>
                    <div className="mt-3 rounded-lg bg-white border border-slate-200/80 px-2.5 py-1.5 text-xs text-slate-700">
                      Lowest in Month {step3Metrics.lowestFundedMonth} • M36:{' '}
                      <strong>
                        {currencySymbol}
                        {step3Metrics.endingBankBalanceM36.toLocaleString()}
                      </strong>
                    </div>
                  </div>
                  <div className="mt-4 border-t border-slate-200/60 pt-2.5 text-[11px] leading-normal text-slate-600">
                    <strong>Assessor Lens:</strong> Grant &amp; loan underwriters require your funded bank balance to stay above {currencySymbol}0 in all 36 months.
                  </div>
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------- */}
            {/* 3.6: WRITTEN FUNDING GAP JUSTIFICATION + PARKING LOT      */}
            {/* --------------------------------------------------------- */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Label className="text-xs font-bold text-slate-900">
                    3.6{' '}
                    {isPlainMode
                      ? 'Written Summary of Your Funding Need & Grant Bridge (For Your Business Plan)'
                      : 'Written 36-Month Cash Trough, Capital Stack & Grant Reimbursement Bridge Narrative'}
                  </Label>
                  <p className="text-[11px] text-slate-500">
                    Explain how much funding you are raising, why your cash trough occurs in Month {step3Metrics.operatingCashTroughMonth}, and how you bridge grant reimbursement delays.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleGenerateAiStep3}
                  disabled={isGeneratingAiStep3 || isVaultReadonly}
                  className="h-7 border-violet-200 bg-violet-50/60 text-[11px] font-medium text-violet-700 hover:bg-violet-100"
                >
                  <Wand2 className="mr-1 h-3.5 w-3.5 text-violet-600" />
                  {isGeneratingAiStep3 ? 'Synthesizing...' : 'Write Summary with AI'}
                </Button>
              </div>

              <textarea
                rows={4}
                value={step3Data.fundingGapNarrative}
                onChange={(e) =>
                  setStep3Data((prev) => ({
                    ...prev,
                    fundingGapNarrative: e.target.value,
                  }))
                }
                disabled={isVaultReadonly}
                placeholder="Explain your lowest cash point (Cash Trough), why you included a 20% safety buffer, and how your Day-1 savings/loan cover upfront spend while waiting for grant reimbursement..."
                className="w-full rounded-xl border border-slate-300 p-3 text-base sm:text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden"
              />

              {step3Data.grantAssessorTip && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900 flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-amber-700 shrink-0" />
                  <div>
                    <span className="font-semibold text-amber-950">
                      Grant Underwriter Tip:{' '}
                    </span>
                    <span>{step3Data.grantAssessorTip}</span>
                  </div>
                </div>
              )}

              {/* Momentum Protection: Park It in Open Questions (Rule 1.3) */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <HelpCircle className="h-4 w-4 text-indigo-600" />
                  <span>
                    Unsure how long your local LEO or Innovate UK grant claim takes to reimburse, or whether you qualify for a startup loan? Park it in Open Questions:
                  </span>
                </div>
                <div className="mt-2 flex flex-col sm:flex-row gap-2">
                  <Input
                    type="text"
                    value={parkingQuestionStep3}
                    onChange={(e) => setParkingQuestionStep3(e.target.value)}
                    placeholder="e.g. Confirm whether Microfinance Ireland can approve a €15k bridge loan alongside LEO Priming..."
                    disabled={isVaultReadonly}
                    className="h-8 bg-white text-base sm:text-xs flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleParkStep3Question}
                    disabled={
                      isParkingStep3 || !parkingQuestionStep3.trim() || isVaultReadonly
                    }
                    className="h-8 border-indigo-200 text-xs font-medium text-indigo-700 hover:bg-indigo-50 shrink-0"
                  >
                    Park It in Open Questions
                  </Button>
                </div>
                {parkedSuccessStep3 && (
                  <p className="mt-1.5 text-[11px] font-medium text-emerald-700">
                    ✓ Parked in your Open Questions list!
                  </p>
                )}
              </div>
            </div>

            {/* Bottom Step 3 Toolbar (Strict GEMINI.md Rule 6.1 Standard) */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setOpenStep(2)}
                  className="text-xs text-slate-600 hover:bg-slate-100"
                >
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                  Back to Step 2: Payment Timing
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleGenerateAiStep3}
                  disabled={isGeneratingAiStep3 || isVaultReadonly}
                  className="text-xs border-violet-200 text-violet-700 hover:bg-violet-50"
                >
                  <Wand2 className="mr-1.5 h-3.5 w-3.5" />
                  AI Calibrate Step 3
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleSaveStep3(false)}
                  disabled={saveStatusStep3 === 'saving' || isVaultReadonly}
                  className="text-xs"
                >
                  {saveStatusStep3 === 'saving'
                    ? 'Saving...'
                    : saveStatusStep3 === 'saved'
                    ? '✓ Saved'
                    : 'Save Step 3'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleSaveStep3(true)}
                  disabled={saveStatusStep3 === 'saving'}
                  className="bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  Save &amp; Next: 3-Year P&amp;L &amp; Stress-Test
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============================================================= */}
      {/* STEP 4: OFFICIAL 3-YEAR P&L, 36-MO CASHFLOW & STRESS-TESTER   */}
      {/* ============================================================= */}
      {openStep !== 'ALL' && openStep !== 4 ? (
        <div
          id="module-j-step-4"
          onClick={() => setOpenStep(4)}
          className="group scroll-mt-24 cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  isStep4Complete
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 text-white'
                }`}
              >
                {isStep4Complete ? <Check className="h-4 w-4" /> : '4'}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                  {isPlainMode
                    ? 'Step 4: 3-Year Profit & Loss, 36-Month Cashflow Table, Stress-Tester & IP Placeholder'
                    : 'Step 4: Official 3-Year P&L Statement, 36-Month Cashflow Schedule, Sensitivity Stress-Test & IP Shield'}
                </h2>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  3-Yr Sales: {currencySymbol}
                  {step4Metrics.totals3Year.grossTurnoverExVat.toLocaleString()} • Y3 Net Profit:{' '}
                  {currencySymbol}
                  {step4Metrics.pnlYears[2].netProfitAfterTax.toLocaleString()} • Scenario:{' '}
                  {isPlainMode
                    ? step4Metrics.scenarioPreset.plainTitle
                    : step4Metrics.scenarioPreset.accountantTitle}{' '}
                  • Stressed Bank Floor: {currencySymbol}
                  {step4Metrics.lowestStressedBankBalance.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge
                variant={isStep4Complete ? 'default' : 'outline'}
                className={`shrink-0 text-[10px] font-medium ${
                  isStep4Complete
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'border-slate-300 text-slate-600'
                }`}
              >
                {isStep4Complete ? 'Completed' : 'In Progress'}
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 shrink-0 px-2.5 text-xs font-medium text-indigo-600 group-hover:bg-indigo-50"
              >
                {isStep4Complete ? 'Edit Step' : 'Open Step'}
                <ChevronDown className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Card
          id="module-j-step-4"
          className="scroll-mt-24 rounded-xl border border-slate-200 bg-white shadow-xs"
        >
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    isStep4Complete
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  {isStep4Complete ? <Check className="h-4 w-4" /> : '4'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base font-bold text-slate-900">
                      {isPlainMode
                        ? 'Step 4: 3-Year Profit & Loss, 36-Month Cashflow Table, Stress-Tester & IP Placeholder'
                        : 'Step 4: Official 3-Year P&L Statement, 36-Month Cashflow Schedule, Sensitivity Stress-Test & IP Shield'}
                    </CardTitle>
                    <Badge
                      variant={isStep4Complete ? 'default' : 'outline'}
                      className={`shrink-0 text-[10px] font-medium ${
                        isStep4Complete
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'border-slate-300 text-slate-600'
                      }`}
                    >
                      {isStep4Complete ? 'Step 4 Complete' : 'In Progress'}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="shrink-0 border-indigo-200 bg-indigo-50 text-[10px] font-medium text-indigo-700"
                    >
                      {isPlainMode
                        ? 'Plain-English Founder View'
                        : 'Official Grant & Accountant View'}
                    </Badge>
                  </div>
                  <CardDescription className="mt-1 text-xs text-slate-600">
                    {isPlainMode
                      ? 'Your upstream numbers from Steps 1–3 automatically compile into an official 3-Year Profit & Loss and 36-Month Cashflow Table. Test how your bank account handles a 3-month launch delay or 20% lower sales, and record your Corporate & IP placeholder notes.'
                      : `Auto-compiles your ${
                          isUK
                            ? 'UK Start Up Loans / Innovate UK / HMRC SEIS'
                            : 'Irish LEO / Enterprise Ireland / Microfinance Ireland'
                        } 3-Year Profit & Loss Statement (Turnover, Export Share, COGS, Gross Margin, OpEx, EBITDA, 3-Year CapEx Depreciation & Corporation Tax) and 36-Month Cashflow Statement with non-destructive sensitivity testing.`}
                  </CardDescription>
                </div>
              </div>

              {/* Top-Right Header Action: ONLY Collapse Step per GEMINI.md Section 6.1 */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setOpenStep(0)}
                  className="text-xs text-slate-500 hover:bg-slate-100"
                >
                  Collapse Step
                  <ChevronUp className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Dedicated 4-Layer Support Strip (Directly Below Title & Description) */}
            <div className="mt-3 flex flex-wrap items-center gap-2 pt-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setActiveWhyCard((prev) => (prev === 4 ? null : 4))
                }
                className="h-7 border-indigo-200 text-[11px] font-medium text-indigo-700 hover:bg-indigo-50"
              >
                <HelpCircle className="mr-1 h-3.5 w-3.5" />
                Why Are We Asking This?
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setActiveExampleCard((prev) => (prev === 4 ? null : 4))
                }
                className="h-7 border-emerald-200 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50"
              >
                <Lightbulb className="mr-1 h-3.5 w-3.5" />
                Show Me an Example
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleApplyBenchmarkStressStep4}
                disabled={isVaultReadonly}
                className="h-7 border-amber-200 bg-amber-50/60 text-[11px] font-medium text-amber-800 hover:bg-amber-100"
              >
                <Calculator className="mr-1 h-3.5 w-3.5 text-amber-700" />
                Run Underwriter Stress Test (-20% Sales / +15% Costs)
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleGenerateAiStep4}
                disabled={isGeneratingAiStep4 || isVaultReadonly}
                className="h-7 border-violet-200 bg-violet-50/60 text-[11px] font-medium text-violet-700 hover:bg-violet-100"
              >
                <Sparkles className="mr-1 h-3.5 w-3.5 text-violet-600" />
                {isGeneratingAiStep4
                  ? 'Drafting Assumptions...'
                  : 'Auto-Generate / Calibrate with AI'}
              </Button>
            </div>

            {/* Collapsible Micro-Coaching Drawer: Why Are We Asking This? */}
            {activeWhyCard === 4 && (
              <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50/70 p-3.5 text-xs text-indigo-900">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1.5">
                    <p className="font-bold text-indigo-950">
                      Why Grant Committees &amp; Banks Require Both a 3-Year P&amp;L and a 36-Month Cashflow Table
                    </p>
                    <p className="leading-relaxed">
                      • <strong>Profit &amp; Loss (P&amp;L) vs. Cashflow:</strong> Your P&amp;L shows whether your business model makes a profit on paper over Years 1, 2, and 3 (spread evenly via 3-year equipment depreciation and excluding VAT). Your 36-Month Cashflow table shows the exact month-by-month money in your bank account after customer payment delays, upfront equipment purchases, loan repayments, and grant reimbursement lags.
                    </p>
                    <p className="leading-relaxed">
                      • <strong>Why Stress-Testing Matters:</strong>{' '}
                      {isUK
                        ? 'British Business Bank Start Up Loans and Innovate UK assessors routinely test whether your business stays solvent if launch slips by 2–3 months or sales come in 20% below plan.'
                        : 'Irish LEO Evaluation Committees, Microfinance Ireland, and Enterprise Ireland PSSF/HPSU assessors test whether your cash reserve survives a 20% revenue haircut without running out of cash before grant drawdown.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveWhyCard(null)}
                    className="shrink-0 rounded-md px-1.5 py-0.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Collapsible Micro-Coaching Drawer: Show Me an Example */}
            {activeExampleCard === 4 && (
              <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/70 p-3.5 text-xs text-emerald-950">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1.5">
                    <p className="font-bold text-emerald-950">
                      Example: Grant-Ready 3-Year P&amp;L &amp; Sensitivity Narrative ({plan.industryCategory || 'B2B SaaS / Product'})
                    </p>
                    <p className="leading-relaxed">
                      • <strong>3-Year P&amp;L Trajectory:</strong> Year 1 Turnover of {currencySymbol}84,000 (78% Gross Margin, {currencySymbol}14,200 EBITDA) scaling to {currencySymbol}215,000 in Year 2 and {currencySymbol}410,000 in Year 3 ({step1Data.exportRevenueSharePercent}% international export sales).
                    </p>
                    <p className="leading-relaxed">
                      • <strong>Underwriter Stress-Test Proof:</strong> Under a -20% revenue haircut and +15% cost inflation sensitivity test, our lowest bank balance in Month 5 remains positive at +{currencySymbol}11,400 thanks to our Step 3 capital stack and 3-month working capital buffer.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveExampleCard(null)}
                    className="shrink-0 rounded-md px-1.5 py-0.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {aiMessageStep4 && (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-violet-200 bg-violet-50/80 px-3.5 py-2.5 text-xs text-violet-900">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 shrink-0 text-violet-600" />
                  <span>{aiMessageStep4}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAiMessageStep4(null)}
                  className="text-xs font-bold text-violet-700 hover:text-violet-950"
                >
                  ✕
                </button>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* SECTION 4.1: 1-CLICK SENSITIVITY & STRESS-TESTER              */}
            {/* ------------------------------------------------------------- */}
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/40 p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    {isPlainMode
                      ? '1. 1-Click "What If Things Go Wrong?" Stress-Tester (Non-Destructive)'
                      : '1. Sensitivity & Downside Stress-Test Selector (Underwriter Audit Mode)'}
                  </Label>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {isPlainMode
                      ? 'Click any scenario below to see how your 3-Year Profit & Loss and 36-Month Bank Balance react. Switching back to "Official Base Case" restores your baseline numbers immediately.'
                      : 'Test your 3-Year P&L and 36-Month Cashflow against standard grant and lender downside scenarios without overwriting your Steps 1–3 inputs.'}
                  </p>
                </div>

                {step4Data.activeStressScenario !== 'BASE_CASE_OFFICIAL' && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setStep4Data((prev) => ({
                        ...prev,
                        activeStressScenario: 'BASE_CASE_OFFICIAL',
                      }))
                    }
                    disabled={isVaultReadonly}
                    className="h-7 border-indigo-200 bg-white text-[11px] font-semibold text-indigo-700 hover:bg-indigo-50"
                  >
                    <RefreshCw className="mr-1 h-3 w-3" />
                    Reset to Official Base Case
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {STRESS_SCENARIO_OPTIONS.map((opt) => {
                  const isSelected = step4Data.activeStressScenario === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isVaultReadonly}
                      onClick={() =>
                        setStep4Data((prev) => ({
                          ...prev,
                          activeStressScenario: opt.id,
                        }))
                      }
                      className={`flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {isPlainMode ? opt.plainTitle : opt.accountantTitle}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-semibold ${
                              isSelected
                                ? 'border-indigo-300 bg-indigo-100 text-indigo-800'
                                : 'border-slate-200 bg-slate-50 text-slate-600'
                            }`}
                          >
                            {opt.badge}
                          </Badge>
                        </div>
                        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
                          {opt.description}
                        </p>
                      </div>
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-2 text-[10px] font-semibold text-slate-500">
                        <span>Sales: -{opt.revenueHaircutPercent}%</span>
                        <span>•</span>
                        <span>Costs: +{opt.costInflationPercent}%</span>
                        <span>•</span>
                        <span>Delay: +{opt.delayMonths}m</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Mandatory "OTHER" Custom Stress-Test Controls per GEMINI.md Rule 5 */}
              {step4Data.activeStressScenario === 'OTHER' && (
                <div className="mt-3 rounded-xl border border-indigo-200 bg-white p-4 space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                    <div className="sm:col-span-1">
                      <Label className="text-xs font-semibold text-slate-800">
                        Custom Scenario Name
                      </Label>
                      <Input
                        type="text"
                        value={step4Data.otherStressScenarioText || ''}
                        disabled={isVaultReadonly}
                        onChange={(e) =>
                          setStep4Data((prev) => ({
                            ...prev,
                            otherStressScenarioText: e.target.value,
                          }))
                        }
                        placeholder="e.g., Enterprise Regulatory Delay"
                        className="mt-1 text-base sm:text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-slate-800">
                        Sales Haircut (%)
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        max={80}
                        value={step4Data.customRevenueHaircutPercent ?? 15}
                        disabled={isVaultReadonly}
                        onChange={(e) =>
                          setStep4Data((prev) => ({
                            ...prev,
                            customRevenueHaircutPercent: Math.max(
                              0,
                              Math.min(80, Number(e.target.value) || 0)
                            ),
                          }))
                        }
                        className="mt-1 text-base sm:text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-slate-800">
                        Cost Inflation (%)
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={step4Data.customCostInflationPercent ?? 10}
                        disabled={isVaultReadonly}
                        onChange={(e) =>
                          setStep4Data((prev) => ({
                            ...prev,
                            customCostInflationPercent: Math.max(
                              0,
                              Math.min(100, Number(e.target.value) || 0)
                            ),
                          }))
                        }
                        className="mt-1 text-base sm:text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-slate-800">
                        Launch Delay (Months)
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        max={12}
                        value={step4Data.customDelayMonths ?? 1}
                        disabled={isVaultReadonly}
                        onChange={(e) =>
                          setStep4Data((prev) => ({
                            ...prev,
                            customDelayMonths: Math.max(
                              0,
                              Math.min(12, Number(e.target.value) || 0)
                            ),
                          }))
                        }
                        className="mt-1 text-base sm:text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Live Stress-Test Solvency Banner */}
              <div
                className={`mt-2 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-xs ${
                  step4Metrics.isSolventUnderStress
                    ? 'border-emerald-200 bg-emerald-50/70 text-emerald-950'
                    : 'border-amber-300 bg-amber-50/80 text-amber-950'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {step4Metrics.isSolventUnderStress ? (
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  )}
                  <div>
                    <p className="font-bold">
                      {step4Metrics.isSolventUnderStress
                        ? `Solvent Under "${
                            isPlainMode
                              ? step4Metrics.scenarioPreset.plainTitle
                              : step4Metrics.scenarioPreset.accountantTitle
                          }" — Lowest Bank Balance: +${currencySymbol}${step4Metrics.lowestStressedBankBalance.toLocaleString()} (Month ${step4Metrics.lowestStressedMonth})`
                        : `Cash Deficit Alert Under "${
                            isPlainMode
                              ? step4Metrics.scenarioPreset.plainTitle
                              : step4Metrics.scenarioPreset.accountantTitle
                          }" — Bank Drops to ${currencySymbol}${step4Metrics.lowestStressedBankBalance.toLocaleString()} in Month ${step4Metrics.lowestStressedMonth}`}
                    </p>
                    <p className="mt-0.5 text-[11px] opacity-90">
                      {step4Metrics.isSolventUnderStress
                        ? `Your Step 3 Capital Stack (${currencySymbol}${step3Metrics.totalStackedFunding.toLocaleString()}) keeps the bank account positive across all 36 months, ending Month 36 at ${currencySymbol}${step4Metrics.endingStressedBankBalanceM36.toLocaleString()}.`
                        : `Under a -${step4Metrics.effectiveRevHaircutPct}% sales haircut, +${step4Metrics.effectiveCostInflationPct}% cost inflation, and +${step4Metrics.effectiveDelayMonths}m launch delay, you would need an extra ${currencySymbol}${Math.abs(step4Metrics.lowestStressedBankBalance).toLocaleString()} in Step 3 funding or lower Step 1 fixed costs.`}
                    </p>
                  </div>
                </div>
                {!step4Metrics.isSolventUnderStress && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setOpenStep(3)}
                    className="h-7 shrink-0 border-amber-300 bg-white text-[11px] font-semibold text-amber-900 hover:bg-amber-100"
                  >
                    Adjust Capital Stack in Step 3
                  </Button>
                )}
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* SECTION 4.2: OFFICIAL 3-YEAR PROFIT & LOSS (INCOME STATEMENT) */}
            {/* ------------------------------------------------------------- */}
            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      {isPlainMode
                        ? '2. Your 3-Year Profit & Loss Table (Money Made vs. Costs)'
                        : '2. Official 3-Year Profit & Loss (Income Statement) Schedule (Excl. VAT)'}
                    </Label>
                    <Badge
                      variant="outline"
                      className="border-indigo-200 bg-indigo-50 text-[10px] font-semibold text-indigo-700"
                    >
                      {isPlainMode
                        ? step4Metrics.scenarioPreset.plainTitle
                        : step4Metrics.scenarioPreset.accountantTitle}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {isPlainMode
                      ? 'Automatically calculated from your pricing (Module H), payment ramp (Step 2), and monthly bills & taxes (Step 1). All figures exclude VAT.'
                      : `Formatted for ${
                          isUK
                            ? 'UK Start Up Loans, Innovate UK & HMRC SEIS'
                            : 'Irish LEO, Microfinance Ireland & Enterprise Ireland'
                        } assessment — includes international export turnover split, 3-year straight-line CapEx depreciation, loan interest, and ${step1Data.corporationTaxRatePercent}% Corporation Tax.`}
                  </p>
                </div>

                {/* Grant-Compliant Export Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleExportSpreadsheet('XLS')}
                    className="h-7 border-emerald-200 bg-emerald-50/70 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100"
                  >
                    <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5 text-emerald-700" />
                    Export Excel (.xls)
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleExportSpreadsheet('CSV')}
                    className="h-7 border-indigo-200 bg-indigo-50/70 text-[11px] font-semibold text-indigo-800 hover:bg-indigo-100"
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5 text-indigo-700" />
                    Google Sheets / Drive (.csv)
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[680px] border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-900 text-white">
                      <th className="py-2.5 pl-4 pr-3 font-bold">
                        {isPlainMode
                          ? 'Profit & Loss Line Item (Plain English + Accountant Subtitle)'
                          : 'Official Profit & Loss (Income Statement) Line Item'}
                      </th>
                      <th className="px-3 py-2.5 text-right font-bold">
                        Year 1 (M1–M12)
                      </th>
                      <th className="px-3 py-2.5 text-right font-bold">
                        Year 2 (M13–M24)
                      </th>
                      <th className="px-3 py-2.5 text-right font-bold">
                        Year 3 (M25–M36)
                      </th>
                      <th className="py-2.5 pl-3 pr-4 text-right font-bold text-indigo-200">
                        3-Year Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* 1. Gross Turnover Excl VAT */}
                    <tr className="bg-slate-50/70 font-semibold text-slate-900">
                      <td className="py-2.5 pl-4 pr-3">
                        <div>
                          {isPlainMode
                            ? 'Total Customer Sales Invoiced (Excl. VAT)'
                            : 'Gross Turnover / Revenue (Net of VAT)'}
                        </div>
                        <div className="text-[10px] font-normal text-slate-500">
                          {isPlainMode
                            ? 'Accountant Heading: Gross Turnover (Excl. VAT)'
                            : 'Synced from Module H Pricing × Step 2 Customer Ramp'}
                        </div>
                      </td>
                      {step4Metrics.pnlYears.map((y) => (
                        <td key={y.year} className="px-3 py-2.5 text-right font-bold">
                          {currencySymbol}
                          {y.grossTurnoverExVat.toLocaleString()}
                        </td>
                      ))}
                      <td className="py-2.5 pl-3 pr-4 text-right font-extrabold text-indigo-900 bg-indigo-50/40">
                        {currencySymbol}
                        {step4Metrics.totals3Year.grossTurnoverExVat.toLocaleString()}
                      </td>
                    </tr>

                    {/* 2. Export Turnover Breakdown (Grant Mandatory) */}
                    <tr className="text-slate-600">
                      <td className="py-2 pl-6 pr-3">
                        <div className="flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5 text-indigo-500" />
                          <span>
                            {isPlainMode
                              ? `↳ Of Which: International / Export Sales (${step1Data.exportRevenueSharePercent}%)`
                              : `↳ International Export Turnover (${step1Data.exportRevenueSharePercent}% Share)`}
                          </span>
                        </div>
                      </td>
                      {step4Metrics.pnlYears.map((y) => (
                        <td key={y.year} className="px-3 py-2 text-right text-indigo-700 font-medium">
                          {currencySymbol}
                          {y.exportTurnoverExVat.toLocaleString()}
                        </td>
                      ))}
                      <td className="py-2 pl-3 pr-4 text-right font-semibold text-indigo-800 bg-indigo-50/20">
                        {currencySymbol}
                        {step4Metrics.totals3Year.exportTurnoverExVat.toLocaleString()}
                      </td>
                    </tr>

                    {/* 3. Direct COGS & Merchant Fees */}
                    <tr className="text-slate-700">
                      <td className="py-2.5 pl-4 pr-3">
                        <div>
                          {isPlainMode
                            ? 'Less: Direct Product Delivery, Materials & Card Fees'
                            : 'Less: Cost of Goods Sold (COGS) & Payment Processing'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {isPlainMode
                            ? 'Accountant Heading: Cost of Sales / Direct COGS'
                            : 'Direct variable unit costs & platform commission from Module D & H'}
                        </div>
                      </td>
                      {step4Metrics.pnlYears.map((y) => (
                        <td key={y.year} className="px-3 py-2.5 text-right text-rose-700">
                          -{currencySymbol}
                          {y.directCogsAndFees.toLocaleString()}
                        </td>
                      ))}
                      <td className="py-2.5 pl-3 pr-4 text-right font-semibold text-rose-800 bg-indigo-50/20">
                        -{currencySymbol}
                        {step4Metrics.totals3Year.directCogsAndFees.toLocaleString()}
                      </td>
                    </tr>

                    {/* 4. Gross Profit & Gross Margin % */}
                    <tr className="border-t border-slate-200 bg-emerald-50/40 font-bold text-slate-900">
                      <td className="py-2.5 pl-4 pr-3">
                        <div>
                          {isPlainMode
                            ? 'Gross Profit (Money Left After Delivering the Product)'
                            : 'Gross Profit & Gross Margin (%)'}
                        </div>
                      </td>
                      {step4Metrics.pnlYears.map((y) => (
                        <td key={y.year} className="px-3 py-2.5 text-right">
                          <div>
                            {currencySymbol}
                            {y.grossProfit.toLocaleString()}
                          </div>
                          <div className="text-[10px] font-semibold text-emerald-700">
                            {y.grossMarginPercent}% Margin
                          </div>
                        </td>
                      ))}
                      <td className="py-2.5 pl-3 pr-4 text-right bg-emerald-100/50">
                        <div>
                          {currencySymbol}
                          {step4Metrics.totals3Year.grossProfit.toLocaleString()}
                        </div>
                        <div className="text-[10px] font-semibold text-emerald-800">
                          {step4Metrics.totals3Year.grossMarginPercent}% Margin
                        </div>
                      </td>
                    </tr>

                    {/* 5. Payroll, Founder Drawings & Employer PRSI/NIC */}
                    <tr className="text-slate-700">
                      <td className="py-2.5 pl-4 pr-3">
                        <div>
                          {isPlainMode
                            ? `Less: Founder Pay, Team Wages & Employer Tax (${step1Data.employerPayrollTaxRatePercent}%)`
                            : `Less: Directors Remuneration, Gross PAYE Wages & Employer ${
                                isUK ? 'NIC/Pension' : 'PRSI'
                              } (${step1Data.employerPayrollTaxRatePercent}%)`}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Synced from Module F Hiring Plan + Step 1 Statutory Payroll Auto-Pilot
                        </div>
                      </td>
                      {step4Metrics.pnlYears.map((y) => (
                        <td key={y.year} className="px-3 py-2.5 text-right text-slate-800">
                          -{currencySymbol}
                          {y.payrollAndDrawingsTotal.toLocaleString()}
                        </td>
                      ))}
                      <td className="py-2.5 pl-3 pr-4 text-right font-semibold text-slate-900 bg-indigo-50/20">
                        -{currencySymbol}
                        {step4Metrics.totals3Year.payrollAndDrawingsTotal.toLocaleString()}
                      </td>
                    </tr>

                    {/* 6. Fixed Administrative Overheads (OpEx) */}
                    <tr className="text-slate-700">
                      <td className="py-2.5 pl-4 pr-3">
                        <div>
                          {isPlainMode
                            ? 'Less: Monthly Running Bills (Workspace, Software, Insurance, Marketing)'
                            : 'Less: Administrative & Operating Overheads (Fixed OpEx)'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Synced from Step 1 Fixed Overheads Schedule (Modules D, E &amp; I)
                        </div>
                      </td>
                      {step4Metrics.pnlYears.map((y) => (
                        <td key={y.year} className="px-3 py-2.5 text-right text-slate-800">
                          -{currencySymbol}
                          {y.fixedOverheadsOpEx.toLocaleString()}
                        </td>
                      ))}
                      <td className="py-2.5 pl-3 pr-4 text-right font-semibold text-slate-900 bg-indigo-50/20">
                        -{currencySymbol}
                        {step4Metrics.totals3Year.fixedOverheadsOpEx.toLocaleString()}
                      </td>
                    </tr>

                    {/* 7. EBITDA (Operating Profit) */}
                    <tr className="border-t border-slate-200 bg-slate-50/90 font-bold text-slate-900">
                      <td className="py-2.5 pl-4 pr-3">
                        <div>
                          {isPlainMode
                            ? 'Operating Profit (EBITDA — Before Equipment Write-Off & Tax)'
                            : 'Operating Profit / (Loss) — EBITDA'}
                        </div>
                      </td>
                      {step4Metrics.pnlYears.map((y) => (
                        <td
                          key={y.year}
                          className={`px-3 py-2.5 text-right ${
                            y.ebitda >= 0 ? 'text-slate-900' : 'text-rose-700'
                          }`}
                        >
                          <div>
                            {y.ebitda < 0 ? '-' : ''}
                            {currencySymbol}
                            {Math.abs(y.ebitda).toLocaleString()}
                          </div>
                          <div className="text-[10px] font-medium text-slate-500">
                            {y.ebitdaMarginPercent}% EBITDA
                          </div>
                        </td>
                      ))}
                      <td className="py-2.5 pl-3 pr-4 text-right bg-indigo-50/40">
                        <div>
                          {step4Metrics.totals3Year.ebitda < 0 ? '-' : ''}
                          {currencySymbol}
                          {Math.abs(step4Metrics.totals3Year.ebitda).toLocaleString()}
                        </div>
                        <div className="text-[10px] font-medium text-indigo-700">
                          {step4Metrics.totals3Year.ebitdaMarginPercent}% EBITDA
                        </div>
                      </td>
                    </tr>

                    {/* 8. CapEx Depreciation & Loan Interest */}
                    <tr className="text-slate-600">
                      <td className="py-2 pl-4 pr-3">
                        <div>
                          {isPlainMode
                            ? 'Less: 3-Year Equipment Write-Off (Depreciation) & Loan Interest'
                            : 'Less: CapEx Straight-Line Depreciation (33.3%/yr) & Debt Interest'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Equipment Depreciation: {currencySymbol}
                          {step4Metrics.pnlYears[0].capExDepreciation.toLocaleString()}/yr • Loan Interest:{' '}
                          {currencySymbol}
                          {step4Metrics.pnlYears[0].loanInterestExpense.toLocaleString()}/yr
                        </div>
                      </td>
                      {step4Metrics.pnlYears.map((y) => (
                        <td key={y.year} className="px-3 py-2 text-right">
                          -{currencySymbol}
                          {(y.capExDepreciation + y.loanInterestExpense).toLocaleString()}
                        </td>
                      ))}
                      <td className="py-2 pl-3 pr-4 text-right font-medium bg-indigo-50/20">
                        -{currencySymbol}
                        {(
                          step4Metrics.totals3Year.capExDepreciation +
                          step4Metrics.totals3Year.loanInterestExpense
                        ).toLocaleString()}
                      </td>
                    </tr>

                    {/* 9. Profit Before Tax (PBT) & Corporation Tax */}
                    <tr className="text-slate-700">
                      <td className="py-2 pl-4 pr-3">
                        <div>
                          {isPlainMode
                            ? `Less: Company Profit Tax (${step1Data.corporationTaxRatePercent}% only when profitable)`
                            : `Less: Corporation Tax Provision (${step1Data.corporationTaxRatePercent}% on Positive PBT)`}
                        </div>
                      </td>
                      {step4Metrics.pnlYears.map((y) => (
                        <td key={y.year} className="px-3 py-2 text-right">
                          -{currencySymbol}
                          {y.corporationTax.toLocaleString()}
                        </td>
                      ))}
                      <td className="py-2 pl-3 pr-4 text-right font-medium bg-indigo-50/20">
                        -{currencySymbol}
                        {step4Metrics.totals3Year.corporationTax.toLocaleString()}
                      </td>
                    </tr>

                    {/* 10. Net Profit After Tax (PAT) */}
                    <tr className="border-t-2 border-slate-300 bg-indigo-50/70 font-extrabold text-slate-900">
                      <td className="py-3 pl-4 pr-3">
                        <div>
                          {isPlainMode
                            ? 'Bottom-Line Net Profit Kept in the Business (After Tax)'
                            : 'Retained Net Profit / (Loss) After Tax (PAT)'}
                        </div>
                      </td>
                      {step4Metrics.pnlYears.map((y) => (
                        <td
                          key={y.year}
                          className={`px-3 py-3 text-right ${
                            y.netProfitAfterTax >= 0 ? 'text-emerald-800' : 'text-rose-700'
                          }`}
                        >
                          <div>
                            {y.netProfitAfterTax < 0 ? '-' : ''}
                            {currencySymbol}
                            {Math.abs(y.netProfitAfterTax).toLocaleString()}
                          </div>
                          <div className="text-[10px] font-semibold opacity-80">
                            {y.netMarginPercent}% Net
                          </div>
                        </td>
                      ))}
                      <td
                        className={`py-3 pl-3 pr-4 text-right bg-indigo-100/80 ${
                          step4Metrics.totals3Year.netProfitAfterTax >= 0
                            ? 'text-indigo-950'
                            : 'text-rose-800'
                        }`}
                      >
                        <div>
                          {step4Metrics.totals3Year.netProfitAfterTax < 0 ? '-' : ''}
                          {currencySymbol}
                          {Math.abs(
                            step4Metrics.totals3Year.netProfitAfterTax
                          ).toLocaleString()}
                        </div>
                        <div className="text-[10px] font-bold text-indigo-800">
                          {step4Metrics.totals3Year.netMarginPercent}% 3-Yr Net
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* SECTION 4.3: 36-MONTH / 12-QUARTER / 3-YEAR CASHFLOW TABLE    */}
            {/* ------------------------------------------------------------- */}
            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    {isPlainMode
                      ? '3. 36-Month Bank Account Cashflow Table (Money In vs. Money Out)'
                      : '3. Official 36-Month Cashflow Statement (Debtor Lag, CapEx, Loans & Grant Arrears)'}
                  </Label>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {isPlainMode
                      ? 'Switch between the 3-Year Summary, 12-Quarter View, or all 36 Individual Months (M1–M36). Exporting to Excel/CSV above includes every single month.'
                      : 'Reflects Step 2 debtor collection lag, Month 1 CapEx & inventory outflow, Step 3 capital stack drawdown, grant reimbursement timing, and loan repayments.'}
                  </p>
                </div>

                {/* Granularity Switcher */}
                <div className="grid grid-cols-1 gap-1.5 rounded-lg border border-slate-200 bg-slate-100 p-1 sm:flex">
                  {[
                    { id: 'ANNUAL_3YR' as const, label: 'Annual (Y1–Y3)' },
                    { id: 'QUARTERLY_12Q' as const, label: '12 Quarters (Q1–Q12)' },
                    { id: 'MONTHLY_36M' as const, label: 'All 36 Months (M1–M36)' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setCashflowGranularityStep4(tab.id)}
                      className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${
                        cashflowGranularityStep4 === tab.id
                          ? 'bg-white text-indigo-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-[420px]">
                <table className="w-full min-w-[680px] border-collapse text-left text-xs">
                  <thead className="sticky top-0 z-10 bg-slate-100 text-slate-700 shadow-2xs">
                    <tr className="border-b border-slate-200">
                      <th className="py-2.5 pl-4 pr-3 font-bold">Period</th>
                      <th className="px-3 py-2.5 text-right font-bold">
                        {isPlainMode ? 'Customer Cash Collected' : 'Customer Cash Inflows'}
                      </th>
                      <th className="px-3 py-2.5 text-right font-bold">
                        {isPlainMode ? 'Funding & Grants Received' : 'Capital & Grant Drawdowns'}
                      </th>
                      <th className="px-3 py-2.5 text-right font-bold">
                        {isPlainMode
                          ? 'Total Cash Outflows (Bills, Wages, Stock, Loans)'
                          : 'Operating, CapEx & Debt Outflows'}
                      </th>
                      <th className="py-2.5 pl-3 pr-4 text-right font-bold">
                        {isPlainMode ? 'Ending Bank Balance' : 'Closing Bank Balance'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cashflowGranularityStep4 === 'ANNUAL_3YR' &&
                      step4Metrics.pnlYears.map((yr) => (
                        <tr key={yr.year} className="hover:bg-slate-50/80">
                          <td className="py-2.5 pl-4 pr-3 font-bold text-slate-900">
                            Year {yr.year} (Months {(yr.year - 1) * 12 + 1}–{yr.year * 12})
                          </td>
                          <td className="px-3 py-2.5 text-right font-medium text-emerald-700">
                            +{currencySymbol}
                            {yr.cashInflowsTotal.toLocaleString()}
                          </td>
                          <td className="px-3 py-2.5 text-right font-medium text-indigo-700">
                            +{currencySymbol}
                            {yr.fundingAndGrantsInflow.toLocaleString()}
                          </td>
                          <td className="px-3 py-2.5 text-right font-medium text-rose-700">
                            -{currencySymbol}
                            {yr.cashOutflowsOperating.toLocaleString()}
                          </td>
                          <td
                            className={`py-2.5 pl-3 pr-4 text-right font-bold ${
                              yr.endingBankBalance >= 0
                                ? 'text-slate-900'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {yr.endingBankBalance < 0 ? '-' : ''}
                            {currencySymbol}
                            {Math.abs(yr.endingBankBalance).toLocaleString()}
                          </td>
                        </tr>
                      ))}

                    {cashflowGranularityStep4 === 'QUARTERLY_12Q' &&
                      step4Metrics.quarterlyStressedSchedule.map((q) => (
                        <tr key={q.quarterIndex} className="hover:bg-slate-50/80">
                          <td className="py-2 pl-4 pr-3 font-semibold text-slate-900">
                            {q.yearLabel} ({q.label})
                          </td>
                          <td className="px-3 py-2 text-right text-emerald-700">
                            +{currencySymbol}
                            {q.cashCollected.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-right text-indigo-700">
                            +{currencySymbol}
                            {q.fundingAndGrantInflow.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-right text-rose-700">
                            -{currencySymbol}
                            {q.operatingOutflow.toLocaleString()}
                          </td>
                          <td
                            className={`py-2 pl-3 pr-4 text-right font-bold ${
                              q.endingBankBalance >= 0
                                ? 'text-slate-900'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {q.endingBankBalance < 0 ? '-' : ''}
                            {currencySymbol}
                            {Math.abs(q.endingBankBalance).toLocaleString()}
                          </td>
                        </tr>
                      ))}

                    {cashflowGranularityStep4 === 'MONTHLY_36M' &&
                      step4Metrics.stressedMonths.map((m) => {
                        const totOut =
                          m.directCogsOutflow +
                          m.fixedOpExOutflow +
                          m.payrollAndTaxOutflow +
                          m.oneOffCapExAndStockOutflow +
                          m.loanRepaymentOutflow;
                        const totFund =
                          m.upfrontFundingInflow + m.grantReimbursementInflow;
                        return (
                          <tr key={m.month} className="hover:bg-slate-50/80">
                            <td className="py-2 pl-4 pr-3 font-medium text-slate-900">
                              Month {m.month}{' '}
                              <span className="text-[10px] text-slate-400">
                                (Y{m.year} Q{m.quarter})
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right text-emerald-700">
                              +{currencySymbol}
                              {m.cashCollected.toLocaleString()}
                            </td>
                            <td className="px-3 py-2 text-right text-indigo-700">
                              +{currencySymbol}
                              {totFund.toLocaleString()}
                            </td>
                            <td className="px-3 py-2 text-right text-rose-700">
                              -{currencySymbol}
                              {totOut.toLocaleString()}
                            </td>
                            <td
                              className={`py-2 pl-3 pr-4 text-right font-bold ${
                                m.fundedBankBalance >= 0
                                  ? 'text-slate-900'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {m.fundedBankBalance < 0 ? '-' : ''}
                              {currencySymbol}
                              {Math.abs(m.fundedBankBalance).toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* SECTION 4.4: CORPORATE / IP CHECKLIST & PERKS PLACEHOLDER     */}
            {/* ------------------------------------------------------------- */}
            <div className="space-y-3 rounded-xl border border-indigo-200/80 bg-indigo-50/30 p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-indigo-600" />
                    <Label className="text-xs font-bold uppercase tracking-wider text-indigo-950">
                      4. Corporate Structure, IP Assignment &amp; Banking Perks (Placeholder)
                    </Label>
                    <Badge
                      variant="outline"
                      className="border-indigo-300 bg-white text-[10px] font-semibold text-indigo-700"
                    >
                      Synced with Module G Launchpad
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    {isUK
                      ? 'Innovate UK, SEIS/EIS, and Start Up Loans require clarity on whether you are incorporated at Companies House and whether founder IP is assigned to the company. Select your current status below (full legal & banking workflow can be expanded anytime).'
                      : 'Irish LEO Priming/Feasibility Grants and Enterprise Ireland require clarity on CRO LTD registration, Tax Clearance (eTC), and IP assignment to the company. Select your current status below (full legal & banking workflow can be expanded anytime).'}
                  </p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setShowCorporateIpPartnerDrawerStep4((prev) => !prev)
                  }
                  className="h-7 border-indigo-200 bg-white text-[11px] font-semibold text-indigo-700 hover:bg-indigo-50"
                >
                  {showCorporateIpPartnerDrawerStep4
                    ? 'Hide Incorporation & IP Partners'
                    : 'View Incorporation & IP Perks'}
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                {CORPORATE_IP_READINESS_OPTIONS.map((opt) => {
                  const isSelected =
                    (step4Data.corporateIpReadinessStatus ||
                      'INCORPORATION_IN_PROGRESS') === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isVaultReadonly}
                      onClick={() =>
                        setStep4Data((prev) => ({
                          ...prev,
                          corporateIpReadinessStatus: opt.id,
                        }))
                      }
                      className={`flex flex-col justify-between rounded-xl border p-3 text-left transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-white ring-2 ring-indigo-500/20'
                          : 'border-slate-200 bg-white/80 hover:border-indigo-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {isPlainMode ? opt.plainTitle : opt.accountantTitle}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[10px] font-medium border-slate-200 text-slate-600"
                          >
                            {opt.badge}
                          </Badge>
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                          {opt.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Mandatory "OTHER" Custom Input for Corporate/IP Status */}
              {step4Data.corporateIpReadinessStatus === 'OTHER' && (
                <div className="rounded-lg border border-indigo-200 bg-white p-3">
                  <Label className="text-xs font-semibold text-slate-800">
                    Specify Custom Corporate / IP Structure
                  </Label>
                  <Input
                    type="text"
                    value={step4Data.otherCorporateIpReadinessStatusText || ''}
                    disabled={isVaultReadonly}
                    onChange={(e) =>
                      setStep4Data((prev) => ({
                        ...prev,
                        otherCorporateIpReadinessStatusText: e.target.value,
                      }))
                    }
                    placeholder="e.g., University Spin-Out Licensing Agreement / Dual IE-UK Holding Structure"
                    className="mt-1 text-base sm:text-xs"
                  />
                </div>
              )}

              <div>
                <Label className="text-xs font-semibold text-slate-800">
                  Corporate / IP &amp; Banking Placeholder Notes (Included in Grant Appendix)
                </Label>
                <Input
                  type="text"
                  value={step4Data.corporateIpPlaceholderNotes}
                  disabled={isVaultReadonly}
                  onChange={(e) =>
                    setStep4Data((prev) => ({
                      ...prev,
                      corporateIpPlaceholderNotes: e.target.value,
                    }))
                  }
                  placeholder="e.g., All code, brand assets, and domain names will be formally assigned to the LTD company prior to grant drawdown."
                  className="mt-1 bg-white text-base sm:text-xs"
                />
              </div>

              {showCorporateIpPartnerDrawerStep4 && (
                <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
                  <PartnerSlot
                    slot="OPS_STEP_1_INCORPORATION"
                    projectId={plan.id}
                    countryCode={effectiveCountry}
                  />
                  <PartnerSlot
                    slot="OPS_STEP_6_LEGAL_IP"
                    projectId={plan.id}
                    countryCode={effectiveCountry}
                  />
                </div>
              )}
            </div>

            {/* ------------------------------------------------------------- */}
            {/* SECTION 4.5: 4-CARD UNDERWRITING DIAGNOSTIC GRID (SEC 6.2)    */}
            {/* ------------------------------------------------------------- */}
            <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/70 via-white to-slate-50/40 p-5 sm:p-6 shadow-xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-indigo-200/60 bg-indigo-50 text-indigo-700">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {isPlainMode
                        ? '3-Year Profit & Stress-Test Scorecard'
                        : 'Step 4 Underwriting & Commercial Viability Diagnostic Grid'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Live 3-year benchmarks evaluated by{' '}
                      {isUK
                        ? 'British Business Bank, Innovate UK, and SEIS investors'
                        : 'Local Enterprise Offices (LEO), Microfinance Ireland, and Enterprise Ireland'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {/* Card 1: 3-Year Cumulative Turnover & Export Share */}
                <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-xs flex flex-col justify-between transition-all">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        {isPlainMode ? '3-Year Total Sales' : '3-Year Cumulative Turnover'}
                      </span>
                      <Badge
                        variant="outline"
                        className="border-indigo-200 bg-indigo-50 text-[10px] font-semibold text-indigo-700"
                      >
                        {step1Data.exportRevenueSharePercent}% Export
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                        {currencySymbol}
                        {step4Metrics.totals3Year.grossTurnoverExVat.toLocaleString()}
                      </span>
                      <span className="text-xs font-medium text-slate-500">Excl. VAT</span>
                    </div>
                    <div className="mt-2.5 rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1.5 text-xs text-slate-600">
                      Y1: {currencySymbol}
                      {step4Metrics.pnlYears[0].grossTurnoverExVat.toLocaleString()} → Y3:{' '}
                      {currencySymbol}
                      {step4Metrics.pnlYears[2].grossTurnoverExVat.toLocaleString()}
                    </div>
                  </div>
                  <p className="mt-4 border-t border-slate-100 pt-2.5 text-[11px] leading-normal text-slate-500">
                    {isUK
                      ? 'Innovate UK and SEIS underwriters verify that Year 1–3 revenue scales credibly alongside headcount.'
                      : 'LEO Priming and Enterprise Ireland prioritize ventures demonstrating scalable export turnover outside the local market.'}
                  </p>
                </div>

                {/* Card 2: Year 3 Gross Margin & Operating EBITDA */}
                <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-xs flex flex-col justify-between transition-all">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        {isPlainMode ? 'Year 3 Operating Profit' : 'Year 3 EBITDA & Margin'}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold ${
                          step4Metrics.pnlYears[2].ebitda >= 0
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-amber-200 bg-amber-50 text-amber-800'
                        }`}
                      >
                        {step4Metrics.pnlYears[2].grossMarginPercent}% Gross Margin
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                        {step4Metrics.pnlYears[2].ebitda < 0 ? '-' : ''}
                        {currencySymbol}
                        {Math.abs(step4Metrics.pnlYears[2].ebitda).toLocaleString()}
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        ({step4Metrics.pnlYears[2].ebitdaMarginPercent}%)
                      </span>
                    </div>
                    <div className="mt-2.5 rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1.5 text-xs text-slate-600">
                      Y1 EBITDA: {step4Metrics.pnlYears[0].ebitda < 0 ? '-' : ''}
                      {currencySymbol}
                      {Math.abs(step4Metrics.pnlYears[0].ebitda).toLocaleString()}
                    </div>
                  </div>
                  <p className="mt-4 border-t border-slate-100 pt-2.5 text-[11px] leading-normal text-slate-500">
                    {isPlainMode
                      ? 'Shows your annual profit after paying product delivery, team wages, and monthly running bills.'
                      : 'Demonstrates operating leverage as fixed overheads grow slower than Year 2–3 commercial revenue.'}
                  </p>
                </div>

                {/* Card 3: Stress-Tested Bank Floor */}
                <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-xs flex flex-col justify-between transition-all">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        {isPlainMode ? 'Lowest Bank Balance' : 'Stressed Liquidity Floor'}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold ${
                          step4Metrics.isSolventUnderStress
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-rose-200 bg-rose-50 text-rose-700'
                        }`}
                      >
                        {step4Metrics.isSolventUnderStress ? 'Solvent' : 'Deficit Alert'}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span
                        className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                          step4Metrics.isSolventUnderStress
                            ? 'text-slate-900'
                            : 'text-rose-700'
                        }`}
                      >
                        {step4Metrics.lowestStressedBankBalance < 0 ? '-' : '+'}
                        {currencySymbol}
                        {Math.abs(
                          step4Metrics.lowestStressedBankBalance
                        ).toLocaleString()}
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        in Month {step4Metrics.lowestStressedMonth}
                      </span>
                    </div>
                    <div className="mt-2.5 rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1.5 text-xs text-slate-600">
                      Month 36 Cash: {currencySymbol}
                      {step4Metrics.endingStressedBankBalanceM36.toLocaleString()}
                    </div>
                  </div>
                  <p className="mt-4 border-t border-slate-100 pt-2.5 text-[11px] leading-normal text-slate-500">
                    Proves to grant and loan committees that your business never bounces a payroll or supplier payment across all 36 months.
                  </p>
                </div>

                {/* Card 4: 3-Year Retained Net Profit After Tax */}
                <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-xs flex flex-col justify-between transition-all">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        {isPlainMode
                          ? '3-Year Profit Kept After Tax'
                          : '3-Year Retained Net Profit (PAT)'}
                      </span>
                      <Badge
                        variant="outline"
                        className="border-slate-200 bg-slate-50 text-[10px] font-semibold text-slate-700"
                      >
                        {step1Data.corporationTaxRatePercent}% Corp Tax
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                        {step4Metrics.totals3Year.netProfitAfterTax < 0 ? '-' : ''}
                        {currencySymbol}
                        {Math.abs(
                          step4Metrics.totals3Year.netProfitAfterTax
                        ).toLocaleString()}
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        ({step4Metrics.totals3Year.netMarginPercent}% Net)
                      </span>
                    </div>
                    <div className="mt-2.5 rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1.5 text-xs text-slate-600">
                      3-Yr Corp Tax Paid: {currencySymbol}
                      {step4Metrics.totals3Year.corporationTax.toLocaleString()}
                    </div>
                  </div>
                  <p className="mt-4 border-t border-slate-100 pt-2.5 text-[11px] leading-normal text-slate-500">
                    Includes 3-year straight-line equipment depreciation ({currencySymbol}
                    {step4Metrics.totals3Year.capExDepreciation.toLocaleString()}) and loan interest ({currencySymbol}
                    {step4Metrics.totals3Year.loanInterestExpense.toLocaleString()}).
                  </p>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* SECTION 4.6: WRITTEN FINANCIAL ASSUMPTIONS & PARKING LOT      */}
            {/* ------------------------------------------------------------- */}
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    {isPlainMode
                      ? '5. Written Note Explaining Your 3-Year Financial Numbers (Required by Grants)'
                      : '5. Formal Notes to the 3-Year Financial Statements & Sensitivity Analysis'}
                  </Label>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {isPlainMode
                      ? 'Every grant and loan form asks for a short paragraph explaining how your 3-year sales, margins, and stress-test work. Click "Auto-Generate with AI" to write this from your live numbers.'
                      : 'Summarizes your 3-Year revenue trajectory, gross margin, EBITDA scaling, statutory tax assumptions, and downside stress-test solvency for Module L.'}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleGenerateAiStep4}
                  disabled={isGeneratingAiStep4 || isVaultReadonly}
                  className="h-7 border-violet-200 bg-white text-[11px] font-semibold text-violet-700 hover:bg-violet-50"
                >
                  <Wand2 className="mr-1.5 h-3.5 w-3.5 text-violet-600" />
                  {isGeneratingAiStep4
                    ? 'Synthesizing...'
                    : 'Auto-Generate Assumptions Note with AI'}
                </Button>
              </div>

              <textarea
                rows={4}
                value={step4Data.writtenFinancialAssumptionsBlock}
                disabled={isVaultReadonly}
                onChange={(e) =>
                  setStep4Data((prev) => ({
                    ...prev,
                    writtenFinancialAssumptionsBlock: e.target.value,
                  }))
                }
                placeholder="Click 'Auto-Generate Assumptions Note with AI' above or write a brief note explaining your 3-Year revenue growth, gross margin, and how your cash buffer handles a downside stress test..."
                className="w-full rounded-lg border border-slate-200 bg-white p-3 text-base sm:text-xs text-slate-800 shadow-2xs focus:border-indigo-500 focus:outline-hidden"
              />

              {step4Data.grantAssessorTip && (
                <div className="rounded-lg border border-indigo-200/80 bg-indigo-50/60 p-3 text-xs text-indigo-950">
                  <span className="font-bold">Underwriter Tip: </span>
                  {step4Data.grantAssessorTip}
                </div>
              )}

              {/* Momentum Protection: Open Questions Parking Lot */}
              <div className="flex flex-col gap-2 border-t border-slate-200/80 pt-3 sm:flex-row sm:items-center">
                <Input
                  type="text"
                  value={parkingQuestionStep4}
                  disabled={isVaultReadonly}
                  onChange={(e) => setParkingQuestionStep4(e.target.value)}
                  placeholder="Unsure about R&D tax credits, VAT registration timing, or IP assignment? Park it for your accountant..."
                  className="flex-1 bg-white text-base sm:text-xs"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleParkStep4Question}
                  disabled={
                    isParkingStep4 || !parkingQuestionStep4.trim() || isVaultReadonly
                  }
                  className="h-8 shrink-0 text-xs font-medium"
                >
                  {parkedSuccessStep4
                    ? '✓ Parked in Open Questions'
                    : 'Park It in Open Questions'}
                </Button>
              </div>
            </div>

            {/* Bottom Step 4 Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setOpenStep(3)}
                  className="text-xs text-slate-600"
                >
                  <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                  Back to Step 3
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleGenerateAiStep4}
                  disabled={isGeneratingAiStep4 || isVaultReadonly}
                  className="text-xs border-violet-200 text-violet-700 hover:bg-violet-50"
                >
                  <Sparkles className="mr-1.5 h-3.5 w-3.5 text-violet-600" />
                  AI Calibrate Step 4
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleSaveStep4(false)}
                  disabled={saveStatusStep4 === 'saving' || isVaultReadonly}
                  className="text-xs"
                >
                  {saveStatusStep4 === 'saving'
                    ? 'Saving...'
                    : saveStatusStep4 === 'saved'
                    ? '✓ Saved'
                    : 'Save Step 4'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleSaveStep4(true)}
                  disabled={saveStatusStep4 === 'saving'}
                  className="bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  Save &amp; Next: Module J Overview Brief
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============================================================= */}
      {/* STEP 5: MODULE J FINAL OVERVIEW BRIEF & AI UNDERWRITER AUDIT  */}
      {/* ============================================================= */}
      {openStep !== 'ALL' && openStep !== 5 ? (
        <div
          id="module-j-step-5"
          onClick={() => setOpenStep(5)}
          className="group scroll-mt-24 cursor-pointer rounded-xl border border-indigo-200 bg-gradient-to-r from-white via-indigo-50/40 to-violet-50/40 p-4 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  isStep5Complete
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 text-white'
                }`}
              >
                {isStep5Complete ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                  Step 5: Module J Final Overview Brief &amp; AI Underwriter Audit
                </h2>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {completedCoreStepsCount}/4 sections calibrated •{' '}
                  {step5Data.blindSpots.length} underwriter checks • 1-click Excel, CSV &amp; HTML export
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge
                variant={isStep5Complete ? 'default' : 'outline'}
                className={
                  isStep5Complete
                    ? 'shrink-0 text-[10px] font-medium bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'shrink-0 text-[10px] font-medium border-indigo-300 bg-indigo-50 text-indigo-700'
                }
              >
                {completedCoreStepsCount}/4 Sections Ready
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 shrink-0 px-2.5 text-xs font-medium text-indigo-600 group-hover:bg-indigo-50"
              >
                {isStep5Complete ? 'Open Overview' : 'Review Overview'}
                <ChevronDown className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Card
          id="module-j-step-5"
          className="scroll-mt-24 rounded-xl border border-indigo-200 bg-gradient-to-br from-white via-indigo-50/30 to-violet-50/40 shadow-sm"
        >
          <CardHeader className="border-b border-indigo-100 pb-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    isStep5Complete
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  {isStep5Complete ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base font-bold text-slate-900">
                      Step 5: Module J Final Overview Brief &amp; AI Underwriter Audit
                    </CardTitle>
                    <Badge
                      variant={isStep5Complete ? 'default' : 'outline'}
                      className={
                        isStep5Complete
                          ? 'shrink-0 text-[10px] font-medium bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'shrink-0 text-[10px] font-medium border-indigo-300 bg-indigo-50 text-indigo-700'
                      }
                    >
                      {completedCoreStepsCount}/4 Sections Ready
                    </Badge>
                    <Badge
                      variant="outline"
                      className="shrink-0 text-[10px] font-medium border-violet-200 bg-violet-50 text-violet-700"
                    >
                      {isUK
                        ? 'UK Start Up Loans / Innovate UK Ready'
                        : 'IE LEO / Enterprise Ireland Ready'}
                    </Badge>
                  </div>
                  <CardDescription className="mt-1 text-xs text-slate-600">
                    {isPlainMode
                      ? 'Your complete 1-page financial health check, constructive "Things to Consider" blind-spot review, and 1-click export to Excel, Google Drive, or PDF.'
                      : 'Consolidated 3-Year P&L, 36-Month Cashflow & Balance Sheet readiness scorecard, cross-module contradiction audit, and downloadable workbook pack.'}
                  </CardDescription>
                </div>
              </div>

              {/* Clean Rule: Top-right header action contains ONLY Collapse Step */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setOpenStep(0)}
                  className="text-xs text-slate-500 hover:bg-slate-100"
                >
                  Collapse Step
                  <ChevronUp className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Dedicated 4-Layer Support Strip (Directly Below Title & Description) */}
            <div className="mt-3 flex flex-wrap items-center gap-2 pt-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setActiveWhyCard((prev) => (prev === 5 ? null : 5))
                }
                className="h-7 border-indigo-200 bg-white text-[11px] font-medium text-indigo-700 hover:bg-indigo-50"
              >
                <HelpCircle className="mr-1 h-3.5 w-3.5" />
                Why Are We Asking This?
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setActiveExampleCard((prev) => (prev === 5 ? null : 5))
                }
                className="h-7 border-emerald-200 bg-white text-[11px] font-medium text-emerald-700 hover:bg-emerald-50"
              >
                <Lightbulb className="mr-1 h-3.5 w-3.5" />
                Show Me an Example
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleExportSpreadsheet('XLS')}
                className="h-7 border-emerald-200 bg-emerald-50/70 text-[11px] font-medium text-emerald-800 hover:bg-emerald-100"
              >
                <FileSpreadsheet className="mr-1 h-3.5 w-3.5 text-emerald-600" />
                Export Excel (.xls)
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleGenerateAiStep5}
                disabled={isGeneratingAiStep5 || isVaultReadonly}
                className="h-7 border-violet-200 bg-violet-50/60 text-[11px] font-medium text-violet-700 hover:bg-violet-100"
              >
                <Sparkles className="mr-1 h-3.5 w-3.5 text-violet-600" />
                {isGeneratingAiStep5
                  ? 'Auditing 3-Year Financials...'
                  : 'Re-Run AI Underwriter Audit & Brief'}
              </Button>
            </div>

            {/* Collapsible Micro-Coaching Drawer: Why */}
            {activeWhyCard === 5 && (
              <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50/70 p-3.5 text-xs text-indigo-900">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold">
                    Why a 1-Page Executive Financial Brief &amp; Blind-Spot Audit Matters
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveWhyCard(null)}
                    className="text-indigo-500 hover:text-indigo-800"
                  >
                    ✕
                  </button>
                </div>
                <p className="mt-1.5 leading-relaxed">
                  Grant evaluation committees and bank underwriters rarely read a 36-column spreadsheet line by line first—they scan your <strong>1-Page Executive Financial Summary</strong> to verify three things: (1) Does your Year 1–3 revenue match your headcount and marketing budget? (2) Does your capital plan cover your deepest cashflow dip (Month {step3Metrics.operatingCashTroughMonth}) plus any grant reimbursement lag? (3) Does your model survive a realistic downside stress test?
                </p>
              </div>
            )}

            {/* Collapsible Micro-Coaching Drawer: Example */}
            {activeExampleCard === 5 && (
              <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/70 p-3.5 text-xs text-emerald-950">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold">
                    Example: Committee-Ready Financial Executive Brief
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveExampleCard(null)}
                    className="text-emerald-600 hover:text-emerald-900"
                  >
                    ✕
                  </button>
                </div>
                <p className="mt-1.5 leading-relaxed">
                  <strong>Example Summary:</strong> &ldquo;Across Years 1–3, turnover scales from {currencySymbol}145,000 to {currencySymbol}780,000 at a 72% gross margin. Accounting for a 30-day B2B debtor collection lag and Employer {isUK ? 'NIC & Workplace Pension' : 'Class A PRSI'} ({step1Data.employerPayrollTaxRatePercent}%), the 36-month cash trough reaches -{currencySymbol}28,400 in Month 8. Our {currencySymbol}45,000 capital stack (founder equity + {isUK ? 'Start Up Loan' : 'LEO Priming Grant'}) leaves a +{currencySymbol}16,600 safety buffer even under the 20% downside stress test.&rdquo;
                </p>
              </div>
            )}

            {aiMessageStep5 && (
              <div className="mt-3 flex items-center justify-between rounded-lg border border-violet-200 bg-violet-50/80 px-3 py-2 text-xs text-violet-900">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-violet-600 shrink-0" />
                  {aiMessageStep5}
                </span>
                <button
                  type="button"
                  onClick={() => setAiMessageStep5(null)}
                  className="text-violet-500 hover:text-violet-800"
                >
                  ✕
                </button>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {/* ========================================================= */}
            {/* 5.1 MODULE J 4-STEP READINESS CHECKLIST GRID               */}
            {/* ========================================================= */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-indigo-200/60 bg-indigo-50 text-indigo-700">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      1. Module J Financial Readiness Checklist (Steps 1–4)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Click any card to jump back and fine-tune that section before locking your financial pack.
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="border-indigo-200 bg-indigo-50 text-[10px] font-semibold text-indigo-700"
                >
                  {completedCoreStepsCount} of 4 Core Financial Steps Calibrated
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
                {[
                  {
                    step: 1,
                    title: isPlainMode
                      ? 'Step 1: Monthly Bills & Tax Auto-Pilot'
                      : 'Step 1: Overheads & Statutory Payroll Tax',
                    done: isStep1Complete,
                    metric: `${currencySymbol}${step1Metrics.totalMonthlyBurnY1.toLocaleString()}/mo Y1 Burn`,
                    detail: `${step1Data.overheadLineItems.length} overhead lines • ${step1Data.employerPayrollTaxRatePercent}% Employer ${isUK ? 'NIC/Pension' : 'PRSI'}`,
                  },
                  {
                    step: 2,
                    title: isPlainMode
                      ? 'Step 2: When Customers Pay vs. Bills Due'
                      : 'Step 2: Working Capital & Debtor/Creditor Lag',
                    done: isStep2Complete,
                    metric: `${step2Metrics.effectiveDebtorDays}d Customer Lag`,
                    detail: `${step2Metrics.year1CashCollectionEfficiencyPercent}% Y1 cash collected • ${currencySymbol}${step2Metrics.peakWorkingCapitalLockup.toLocaleString()} lockup`,
                  },
                  {
                    step: 3,
                    title: isPlainMode
                      ? 'Step 3: 36-Month Cash Trough & Funding Bridge'
                      : 'Step 3: 36-Month Cashflow Trough & Capital Stack',
                    done: isStep3Complete,
                    metric: `M${step3Metrics.operatingCashTroughMonth} Trough (${
                      step3Metrics.operatingCashTroughAmount < 0 ? '-' : '+'
                    }${currencySymbol}${Math.abs(step3Metrics.operatingCashTroughAmount).toLocaleString()})`,
                    detail: `${currencySymbol}${step3Metrics.totalStackedFunding.toLocaleString()} funding • ${
                      step3Metrics.lowestFundedBankBalance >= 0
                        ? `+${currencySymbol}${step3Metrics.lowestFundedBankBalance.toLocaleString()} min bank`
                        : `-${currencySymbol}${Math.abs(step3Metrics.lowestFundedBankBalance).toLocaleString()} gap`
                    }`,
                  },
                  {
                    step: 4,
                    title: isPlainMode
                      ? 'Step 4: 3-Year P&L, Balance Sheet & Stress Test'
                      : 'Step 4: 3-Year Financial Statements & Sensitivity',
                    done: isStep4Complete,
                    metric: `Y3 ${currencySymbol}${step4Metrics.pnlYears[2].grossTurnoverExVat.toLocaleString()} Sales`,
                    detail: `${step4Metrics.pnlYears[2].grossMarginPercent}% Gross Margin • Scenario: ${step4Data.activeStressScenario}`,
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className={`flex flex-col justify-between rounded-xl border p-4 transition-all ${
                      item.done
                        ? 'border-emerald-200 bg-emerald-50/25'
                        : 'border-amber-200 bg-amber-50/25'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Section {item.step}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            item.done
                              ? 'border-emerald-300 bg-emerald-100 text-[10px] text-emerald-800'
                              : 'border-amber-300 bg-amber-100 text-[10px] text-amber-800'
                          }
                        >
                          {item.done ? 'Calibrated' : 'Needs Review'}
                        </Badge>
                      </div>
                      <div className="mt-1.5 text-xs font-bold text-slate-900">
                        {item.title}
                      </div>
                      <div className="mt-2 text-base font-extrabold text-indigo-950">
                        {item.metric}
                      </div>
                      <p className="mt-1 text-[11px] text-slate-600">
                        {item.detail}
                      </p>
                    </div>
                    <div className="mt-3 border-t border-slate-200/60 pt-2.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setOpenStep(item.step)}
                        className="h-7 w-full justify-between px-2 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-50"
                      >
                        <span>Edit Step {item.step}</span>
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ========================================================= */}
            {/* 5.2 CONSTRUCTIVE "THINGS TO CONSIDER" BLIND-SPOT REVIEW    */}
            {/* ========================================================= */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-700">
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      2. Constructive &ldquo;Things to Consider&rdquo; Blind-Spot Audit
                    </h3>
                    <p className="text-xs text-slate-500">
                      Supportive co-founder &amp; grant underwriter cross-checks across your 3-Year P&amp;L, 36-Month Cashflow, and capital bridge.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleGenerateAiStep5}
                  disabled={isGeneratingAiStep5 || isVaultReadonly}
                  className="h-7 border-violet-200 bg-violet-50/70 text-[11px] font-medium text-violet-700 hover:bg-violet-100"
                >
                  <Sparkles className="mr-1 h-3.5 w-3.5 text-violet-600" />
                  {isGeneratingAiStep5 ? 'Refreshing...' : 'Refresh Blind-Spot Audit'}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {step5Data.blindSpots.map((spot) => {
                  const isCrit = spot.severity === 'CRITICAL';
                  const isWarn = spot.severity === 'WARNING';
                  return (
                    <div
                      key={spot.id}
                      className={`flex flex-col justify-between rounded-xl border p-4 ${
                        isCrit
                          ? 'border-rose-200 bg-rose-50/40'
                          : isWarn
                          ? 'border-amber-200 bg-amber-50/40'
                          : 'border-indigo-200 bg-indigo-50/30'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <Badge
                            variant="outline"
                            className={
                              isCrit
                                ? 'border-rose-300 bg-rose-100 text-[10px] font-bold text-rose-800'
                                : isWarn
                                ? 'border-amber-300 bg-amber-100 text-[10px] font-bold text-amber-900'
                                : 'border-indigo-300 bg-indigo-100 text-[10px] font-bold text-indigo-800'
                            }
                          >
                            {spot.severity}
                          </Badge>
                          <span className="text-[10px] font-medium text-slate-400">
                            Underwriter Check
                          </span>
                        </div>
                        <h4 className="mt-2 text-xs font-bold text-slate-900">
                          {spot.title}
                        </h4>
                        <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                          {spot.description}
                        </p>
                      </div>
                      <div className="mt-3 rounded-lg border border-white/80 bg-white/90 p-2.5 text-[11px] text-slate-700">
                        <span className="font-bold text-indigo-700">
                          Recommended Action:{' '}
                        </span>
                        {spot.actionableFix}
                      </div>
                    </div>
                  );
                })}
              </div>

              {step5Data.aiAssessorTip && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3.5 text-xs text-indigo-950">
                  <span className="font-bold text-indigo-800">
                    Underwriter Tip ({isUK ? 'UK Start Up Loans / Innovate UK' : 'IE LEO / Enterprise Ireland'}):{' '}
                  </span>
                  {step5Data.aiAssessorTip}
                </div>
              )}
            </div>

            {/* ========================================================= */}
            {/* 5.3 FINANCIAL READINESS POSTURE SELECTOR (WITH "OTHER")    */}
            {/* ========================================================= */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  3. Select Your Financial Underwriting Posture
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  How should Module K (Grants &amp; Funding) and Module L (Business Plan Compiler) frame your financial position? (Includes mandatory &ldquo;Other&rdquo; custom option per Rule 1.5).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {FINANCE_READINESS_CONFIDENCE_OPTIONS.map((opt) => {
                  const isSelected =
                    step5Data.financeReadinessConfidence === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isVaultReadonly}
                      onClick={() =>
                        setStep5Data((prev) => ({
                          ...prev,
                          financeReadinessConfidence: opt.id,
                        }))
                      }
                      className={`flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {isPlainMode ? opt.plainTitle : opt.accountantTitle}
                          </span>
                          <Badge
                            variant="outline"
                            className={
                              isSelected
                                ? 'border-indigo-300 bg-indigo-100 text-[10px] text-indigo-800'
                                : 'border-slate-200 text-[10px] text-slate-500'
                            }
                          >
                            {opt.badge}
                          </Badge>
                        </div>
                        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
                          {opt.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {step5Data.financeReadinessConfidence === 'OTHER' && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-3.5 space-y-1.5">
                  <Label className="text-xs font-semibold text-indigo-950">
                    Describe Your Custom Financial / Funding Posture
                  </Label>
                  <Input
                    value={step5Data.otherReadinessConfidenceText}
                    disabled={isVaultReadonly}
                    onChange={(e) =>
                      setStep5Data((prev) => ({
                        ...prev,
                        otherReadinessConfidenceText: e.target.value,
                      }))
                    }
                    placeholder="e.g., Hybrid parent-company intercompany loan + R&D tax credit monetization..."
                    className="bg-white text-base sm:text-xs"
                  />
                </div>
              )}
            </div>

            {/* ========================================================= */}
            {/* 5.4 1-PAGE EXECUTIVE FINANCIAL BRIEF & EXPORT HUB          */}
            {/* ========================================================= */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    4. 1-Page Executive Financial Narrative &amp; Grant Export Hub
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    This narrative feeds directly into your Module L Business Plan &amp; Grant Application Appendices. Download your full workbook as Excel (.xls) or Google Sheets (.csv) anytime.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleExportSpreadsheet('XLS')}
                    className="h-8 border-emerald-300 bg-emerald-50 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                  >
                    <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5 text-emerald-700" />
                    Export Excel (.xls)
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleExportSpreadsheet('CSV')}
                    className="h-8 border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
                    Google Sheets / Drive (.csv)
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleCopyBriefMarkdown}
                    className="h-8 border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Copy className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
                    {copiedBriefSuccessStep5
                      ? '✓ Copied Markdown'
                      : 'Copy Brief (.md)'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleDownloadHtmlBrief}
                    className="h-8 border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Printer className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
                    Download 1-Page HTML Brief
                  </Button>
                </div>
              </div>

              <textarea
                rows={4}
                value={step5Data.executiveFinancialSummaryNarrative}
                disabled={isVaultReadonly}
                onChange={(e) =>
                  setStep5Data((prev) => ({
                    ...prev,
                    executiveFinancialSummaryNarrative: e.target.value,
                  }))
                }
                placeholder="Summarize your 3-Year revenue trajectory, gross margin, 36-month cash trough, and funding bridge..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-base sm:text-xs leading-relaxed text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none"
              />
            </div>

            {/* ========================================================= */}
            {/* 5.5 DARK FOOTER CONVERSION / HANDOFF CTA BAR (MODULE K)    */}
            {/* ========================================================= */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-900 px-4 py-3.5 text-white">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 text-[10px]">
                    Module J Complete
                  </Badge>
                  <span className="text-xs font-bold text-white">
                    Next Up: Module K — Non-Dilutive Grants, Loans &amp; Tax Relief Hub
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-300">
                  Your 3-Year P&amp;L, 36-month cash trough ({currencySymbol}
                  {Math.abs(step3Metrics.operatingCashTroughAmount).toLocaleString()} in Month{' '}
                  {step3Metrics.operatingCashTroughMonth}), and headcount plan will automatically power the Module K Grant &amp; Loan Readiness Matcher.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleSaveStep5(false)}
                  disabled={saveStatusStep5 === 'saving' || isVaultReadonly}
                  className="border-slate-700 bg-slate-800 text-xs text-slate-100 hover:bg-slate-700"
                >
                  {saveStatusStep5 === 'saving'
                    ? 'Saving...'
                    : saveStatusStep5 === 'saved'
                    ? '✓ Overview Saved'
                    : 'Save Overview'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleSaveStep5(true)}
                  disabled={saveStatusStep5 === 'saving'}
                  className="bg-emerald-500 text-xs font-bold text-slate-950 hover:bg-emerald-400"
                >
                  Save &amp; Continue to Module K (Grants &amp; Funding)
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
