import 'dotenv/config';
import { Client } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../src/db/schema';
import { grantsDirectory } from '../src/db/schema';
import { eq } from 'drizzle-orm';

interface SeedGrant {
  slug: string;
  countryCode: string;
  grantName: string;
  providerAgency: string;
  fundingType: string;
  currency: string;
  maxAmountFormatted: string;
  maxFundingAmount: number;
  matchRatePercentage: number;
  isRepayable: boolean;
  minEmployees: number;
  maxEmployees: number;
  maxTradingMonths?: number;
  stageFit: string;
  turnaroundLabel: string;
  turnaroundSpeed: string;
  leoThreeQuoteEnforced: boolean;
  compilerTemplateId?: string;
  summary: string;
  descriptionMarkdown: string;
  eligibleCosts: string[];
  ineligibleCosts: string[];
  applicationRequirements: string[];
  disqualificationRedFlags: string[];
  reimbursementWarning: string;
  officialUrl: string;
  status: 'ACTIVE';
  isActive: boolean;
  discoveredVia: string;
}

export const SEED_GRANTS: SeedGrant[] = [
  // -------------------------------------------------------------
  // IRELAND (IE)
  // -------------------------------------------------------------
  {
    slug: 'ie-leo-feasibility-study-grant',
    countryCode: 'IE',
    grantName: 'LEO Feasibility Study Grant',
    providerAgency: 'Local Enterprise Office (LEO Ireland)',
    fundingType: 'GRANT',
    currency: 'EUR',
    maxAmountFormatted: 'Up to €15,000 (50% match)',
    maxFundingAmount: 15000,
    matchRatePercentage: 50,
    isRepayable: false,
    minEmployees: 0,
    maxEmployees: 10,
    maxTradingMonths: 0,
    stageFit: 'Pre-Trading / Prototype Stage',
    turnaroundLabel: '4–6 Weeks Turnaround',
    turnaroundSpeed: 'STANDARD_6_TO_8_WEEKS',
    leoThreeQuoteEnforced: true,
    compilerTemplateId: 'IE_LEO_OFFICIAL',
    summary:
      'Co-funds prototype development, third-party technical feasibility studies, market research, and foreign travel for export investigation.',
    descriptionMarkdown: `The Local Enterprise Office (LEO) Feasibility Study Grant is designed to assist individuals or micro-enterprises with researching the market demand, technical viability, and financial sustainability of a new product or service.

It covers up to 50% of qualifying expenditures (or up to 60% in BMW / Gaeltacht regions), up to a maximum grant contribution of €15,000. It is aimed at businesses that demonstrate genuine international export potential or non-displacement manufacturing/services.`,
    eligibleCosts: [
      'Market research and customer discovery consultancy',
      'Technical prototype build & third-party software engineering',
      'Patent / design rights searches and IP feasibility',
      'Foreign travel for prospective customer validation or trade fairs',
      'Specialist technical consultancy fees (up to €900/day assessor cap)',
    ],
    ineligibleCosts: [
      'Standard business laptops, desktop computers, and smartphones',
      'Day-to-day general trading overheads and rent',
      'Costs incurred prior to formal grant approval and Letter of Offer',
      'Vehicles or general transport',
    ],
    applicationRequirements: [
      'Completed official LEO application form',
      'Detailed project brief and technical work packages',
      '3 competitive supplier quotes for any single contract/item > €5,000',
      'Founder CVs and relevant domain experience profiles',
      'Tax Clearance Access Number (TCAN)',
    ],
    disqualificationRedFlags: [
      'Purely local retail or domestic walk-in services with local displacement',
      'Purchasing equipment or paying suppliers before receiving the formal Letter of Offer',
      'Lack of 50% matching founder funds in a bank statement',
    ],
    reimbursementWarning:
      'Paid strictly on reimbursement of vouched receipts after formal approval. Do not spend money before receiving your Letter of Offer.',
    officialUrl:
      'https://www.localenterprise.ie/Discover-Business-Supports/Financial-Supports/Feasibility-Grant/',
    status: 'ACTIVE',
    isActive: true,
    discoveredVia: 'SYSTEM_SEED',
  },
  {
    slug: 'ie-leo-priming-grant',
    countryCode: 'IE',
    grantName: 'LEO Priming Grant',
    providerAgency: 'Local Enterprise Office (LEO Ireland)',
    fundingType: 'GRANT',
    currency: 'EUR',
    maxAmountFormatted: 'Up to €80,000–€150,000 (50% match)',
    maxFundingAmount: 80000,
    matchRatePercentage: 50,
    isRepayable: false,
    minEmployees: 1,
    maxEmployees: 10,
    maxTradingMonths: 18,
    stageFit: 'First 18 Months Trading',
    turnaroundLabel: '8–12 Weeks Turnaround',
    turnaroundSpeed: 'HEAVY_10_TO_16_WEEKS',
    leoThreeQuoteEnforced: true,
    compilerTemplateId: 'IE_LEO_OFFICIAL',
    summary:
      'Direct capital and employment support for micro-enterprises under 18 months old with internationally traded or high-potential manufacturing/services models.',
    descriptionMarkdown: `The LEO Priming Grant is the flagship grant for newly incorporated businesses (trading for 18 months or less). It co-funds salary costs for newly created jobs, capital machinery, commercial premises fit-out, and marketing expenditure up to €80,000 (or up to €150,000 in exceptional high-growth manufacturing cases approved by Enterprise Ireland).

Assessed under a strict job-creation metric, allowing up to €10,000 per full-time sustainable job created.`,
    eligibleCosts: [
      'Direct employee salary grants for newly created PAYE full-time jobs',
      'Capital machinery, specialized hardware, and lab equipment',
      'Website development and international marketing campaigns',
      'Business consultancy, mentoring, and trade exhibition costs',
    ],
    ineligibleCosts: [
      'Standard office laptops, desktop workstations, and mobile phones',
      'Motor vehicles or commercial delivery vans',
      'Loan repayments, interest charges, or statutory tax settlements',
      'Recurring overhead expenses (rent, electricity, heating)',
    ],
    applicationRequirements: [
      '3-Year Comprehensive Business Plan (Startup Preflight format)',
      '3-Year Monthly Cashflow Forecast and Profit & Loss projections',
      'Audited accounts or certified management accounts to date',
      '3 independent competitive quotes for equipment or consultancy items > €5,000',
      'Evidence of matching equity or bank finance',
    ],
    disqualificationRedFlags: [
      'More than 18 months of registered active trading',
      'Failing the displacement test against local Irish competitors',
      'Sole trader without plans to create genuine PAYE employment',
    ],
    reimbursementWarning:
      'Salary support and capital outlays are reimbursed in tranches upon proof of expenditure and tax clearance. Laptops, phones, and vehicles are excluded.',
    officialUrl:
      'https://www.localenterprise.ie/Discover-Business-Supports/Financial-Supports/Priming-Grant/',
    status: 'ACTIVE',
    isActive: true,
    discoveredVia: 'SYSTEM_SEED',
  },
  {
    slug: 'ie-leo-digital-and-grow-digital-voucher',
    countryCode: 'IE',
    grantName: 'LEO Grow Digital & AI Voucher',
    providerAgency: 'Local Enterprise Office (LEO Ireland)',
    fundingType: 'VOUCHER',
    currency: 'EUR',
    maxAmountFormatted: 'Up to €5,000 (50% co-funded)',
    maxFundingAmount: 5000,
    matchRatePercentage: 50,
    isRepayable: false,
    minEmployees: 0,
    maxEmployees: 10,
    stageFit: 'Any Stage (Including Sole Trader)',
    turnaroundLabel: '2–3 Weeks Fast-Track',
    turnaroundSpeed: 'FAST_2_TO_4_WEEKS',
    leoThreeQuoteEnforced: false,
    compilerTemplateId: 'IE_LEO_OFFICIAL',
    summary:
      'Accelerates cloud software implementation, AI workflow automation, e-commerce storefront enhancements, and digital security upgrades.',
    descriptionMarkdown: `The Grow Digital voucher from the Local Enterprise Office provides up to €5,000 at a 50% co-funding intervention rate to help small businesses adopt digital tools, implement AI automation, build modern e-commerce channels, and streamline back-office cloud systems.

Fast-track committee approval with minimal administrative friction.`,
    eligibleCosts: [
      'AI tools integration, workflow automation, and custom chatbot implementations',
      'E-commerce shop development (Shopify, WooCommerce, Stripe setup)',
      'Enterprise cloud ERP, CRM, and inventory management software licenses & onboarding',
      'Cybersecurity audits and digital compliance toolkits',
    ],
    ineligibleCosts: [
      'Standard generic hardware (laptops, PCs, tablets)',
      'Ongoing recurring marketing ad spend (Google Ads, Meta Ads)',
      'Projects already completed prior to voucher application',
    ],
    applicationRequirements: [
      'Brief Digital Adoption Plan outlining expected productivity boost',
      '1 to 2 third-party implementation quotes from vetted digital providers',
      'Valid Tax Clearance Reference',
    ],
    disqualificationRedFlags: [
      'Claiming voucher for existing ongoing software subscriptions without transformation',
      'More than 10 full-time employees',
    ],
    reimbursementWarning:
      '50% co-funded voucher redeemed after project delivery and submission of paid invoice with bank statement proof.',
    officialUrl:
      'https://www.localenterprise.ie/Discover-Business-Supports/Digital-Supports/Grow-Digital/',
    status: 'ACTIVE',
    isActive: true,
    discoveredVia: 'SYSTEM_SEED',
  },
  {
    slug: 'ie-enterprise-ireland-new-frontiers',
    countryCode: 'IE',
    grantName: 'Enterprise Ireland New Frontiers Programme',
    providerAgency: 'Enterprise Ireland / National Incubation Network',
    fundingType: 'GRANT',
    currency: 'EUR',
    maxAmountFormatted: '€15,000 Tax-Free Stipend + Hot-Desk & Mentoring',
    maxFundingAmount: 15000,
    matchRatePercentage: 100,
    isRepayable: false,
    minEmployees: 1,
    maxEmployees: 5,
    stageFit: 'Early Stage / Full-Time Founder Transition',
    turnaroundLabel: 'Cohort-Based Deadlines (3x/year)',
    turnaroundSpeed: 'STANDARD_6_TO_8_WEEKS',
    leoThreeQuoteEnforced: false,
    summary:
      'Ireland’s national entrepreneur development programme providing a €15,000 tax-free stipend, incubation space, and 1-on-1 Enterprise Ireland mentoring.',
    descriptionMarkdown: `New Frontiers is delivered in three progressive phases via Technical Universities across Ireland. Phase 2 provides full-time founders with €15,000 in non-dilutive, tax-free financial support over 6 months to focus 100% on accelerating prototype build, customer discovery, and investor pitch preparation.`,
    eligibleCosts: [
      'Founder living stipend (€2,500/month tax-free over 6 months)',
      'Complimentary dedicated incubator desk space & high-speed labs',
      'Enterprise Ireland advisor & investor matchmaking',
    ],
    ineligibleCosts: [
      'Not applicable — funding is delivered directly to the founder as a development stipend',
    ],
    applicationRequirements: [
      'Executive Summary pitch deck & customer problem canvas',
      'Commitment to work full-time on the business venture',
      'Panel interview with Enterprise Ireland and University incubator directors',
    ],
    disqualificationRedFlags: [
      'Remaining in other full-time employment during Phase 2',
      'Lack of clear international market export vision',
    ],
    reimbursementWarning:
      'Paid monthly in arrears directly to the founder, conditional on active cohort participation and milestone achievement.',
    officialUrl: 'https://www.newfrontiers.ie/',
    status: 'ACTIVE',
    isActive: true,
    discoveredVia: 'SYSTEM_SEED',
  },
  {
    slug: 'ie-enterprise-ireland-pssf',
    countryCode: 'IE',
    grantName: 'Enterprise Ireland Pre-Seed Start Fund (PSSF)',
    providerAgency: 'Enterprise Ireland (HPSU Division)',
    fundingType: 'EQUITY_MATCH',
    currency: 'EUR',
    maxAmountFormatted: '€50,000 or €100,000 (Tranches via CLN)',
    maxFundingAmount: 100000,
    matchRatePercentage: 100,
    isRepayable: false,
    minEmployees: 1,
    maxEmployees: 10,
    maxTradingMonths: 48,
    stageFit: 'High Potential Start-Up (HPSU)',
    turnaroundLabel: '10–14 Weeks Competitive Call',
    turnaroundSpeed: 'HEAVY_10_TO_16_WEEKS',
    leoThreeQuoteEnforced: false,
    summary:
      'Early-stage convertible loan note (CLN) funding for innovative startups targeting €1M+ export sales and 10+ jobs within 3–4 years.',
    descriptionMarkdown: `The Pre-Seed Start Fund (PSSF) is designed to accelerate early-stage High Potential Start-Up (HPSU) companies in Ireland. Funding is delivered as a Convertible Loan Note (CLN) of €50,000 (single tranche) or €100,000 (two tranches of €50k). Requires private co-funding match of at least 10% (€5k or €10k).`,
    eligibleCosts: [
      'Software engineering, product development, and technical team hires',
      'Market research and international customer validation',
      'Intellectual property protection and patent filings',
      'Operational working capital to reach seed milestone',
    ],
    ineligibleCosts: [
      'Debt refinancing or statutory tax arrears',
      'Domestic-only businesses without global export potential',
    ],
    applicationRequirements: [
      'Comprehensive HPSU Business Plan and Financial Model',
      'Live Video Pitch Submission',
      'Proof of incorporated Irish Limited Company and 10% co-funding',
      'Clear technological defensibility and export strategy',
    ],
    disqualificationRedFlags: [
      'Low innovation barrier or standard franchise model',
      'Failure to project €1M export turnover within 3–4 years',
    ],
    reimbursementWarning:
      'Disbursed via Convertible Loan Note against agreed commercial and technical milestones.',
    officialUrl: 'https://www.enterprise-ireland.com/en/funding/pre-seed-start-fund',
    status: 'ACTIVE',
    isActive: true,
    discoveredVia: 'SYSTEM_SEED',
  },
  {
    slug: 'ie-revenue-sure-tax-refund',
    countryCode: 'IE',
    grantName: 'Revenue SURE (Startup Relief for Entrepreneurs)',
    providerAgency: 'Irish Revenue Commissioners',
    fundingType: 'TAX_RELIEF',
    currency: 'EUR',
    maxAmountFormatted: 'Up to €100,000+ Direct PAYE Cash Refund',
    maxFundingAmount: 100000,
    matchRatePercentage: 100,
    isRepayable: false,
    minEmployees: 1,
    maxEmployees: 50,
    stageFit: 'New LTD (Founder leaving employment)',
    turnaroundLabel: '4–8 Weeks Post-Filing',
    turnaroundSpeed: 'STANDARD_6_TO_8_WEEKS',
    leoThreeQuoteEnforced: false,
    summary:
      'Refunds PAYE income taxes paid by the founder in former employment over the prior 6 years, injecting up to 41% of salary tax back into the startup as cash.',
    descriptionMarkdown: `SURE is one of the most generous yet underutilized tax incentives for Irish founders. If you leave employment to launch a qualifying startup LTD, you can claim a cash refund of the PAYE income tax you paid in Ireland over the preceding 6 tax years, up to a maximum investment of €100,000 per year (capped at €700,000 total investment across 7 years).`,
    eligibleCosts: [
      'Direct cash injection into the new company bank account via new ordinary share subscription',
      'Can be spent on any legitimate company trading expenses, hires, or equipment',
    ],
    ineligibleCosts: [
      'Excluded trades (land dealing, professional services like law/accountancy, financial services)',
    ],
    applicationRequirements: [
      'Incorporated Irish LTD with minimum 15% voting shares held by the founder',
      'Form SURE application submitted through Revenue Online Service (ROS)',
      'P60 / Employment Detail Summaries for the prior 6 tax years',
      'Company Tax Clearance Certificate',
    ],
    disqualificationRedFlags: [
      'Founder holding less than 15% equity',
      'Failure to devote substantial time to the business (minimum 75% working hours)',
      'Withdrawing share capital within 4 years',
    ],
    reimbursementWarning:
      'Paid as a direct cash refund from Irish Revenue to the company or founder following formal verification.',
    officialUrl:
      'https://www.revenue.ie/en/tax-professionals/tdm/income-tax-capital-gains-tax-corporation-tax/part-16/16-00-03.pdf',
    status: 'ACTIVE',
    isActive: true,
    discoveredVia: 'SYSTEM_SEED',
  },
  {
    slug: 'ie-microfinance-ireland-leo-loan',
    countryCode: 'IE',
    grantName: 'Microfinance Ireland (MFI) Small Business Loan',
    providerAgency: 'Microfinance Ireland in partnership with LEO',
    fundingType: 'STARTUP_LOAN',
    currency: 'EUR',
    maxAmountFormatted: '€2,000 to €25,000 Unsecured Loan',
    maxFundingAmount: 25000,
    matchRatePercentage: 100,
    isRepayable: true,
    minEmployees: 1,
    maxEmployees: 10,
    stageFit: 'Pre-Trading or Trading < 3 Years',
    turnaroundLabel: '2–4 Weeks Turnaround',
    turnaroundSpeed: 'FAST_2_TO_4_WEEKS',
    leoThreeQuoteEnforced: false,
    summary:
      'Unsecured government-backed lending up to €25,000 with a 0.5% discount when submitted through your Local Enterprise Office.',
    descriptionMarkdown: `Microfinance Ireland provides small business loans from €2,000 up to €25,000 for commercially viable business ideas that may struggle to secure immediate high-street bank overdrafts or loans. Applying through your Local Enterprise Office unlocks an automatic 0.5% interest rate discount.`,
    eligibleCosts: [
      'Initial working capital, stock acquisition, and raw materials',
      'Equipment purchases, tooling, and commercial vehicle setup',
      'Hiring initial staff and launching marketing campaigns',
    ],
    ineligibleCosts: [
      'Refinancing existing toxic debt or creditor settlements',
    ],
    applicationRequirements: [
      'Completed MFI Loan Application Form',
      'Startup Preflight 3-Year Cashflow Forecast & Business Plan',
      '3 to 6 months of personal bank statements',
      'Credit report verification',
    ],
    disqualificationRedFlags: [
      'Unresolved severe adverse credit judgements',
      'Inability to demonstrate debt service coverage in cashflow projections',
    ],
    reimbursementWarning:
      'Unsecured commercial loan with 1 to 5 year repayment terms. Capital moratoriums (interest-only) available up to 3–6 months.',
    officialUrl: 'https://www.microfinanceireland.ie/',
    status: 'ACTIVE',
    isActive: true,
    discoveredVia: 'SYSTEM_SEED',
  },
  {
    slug: 'ie-ei-eii-investor-relief',
    countryCode: 'IE',
    grantName: 'Employment Investment Incentive (EII) & 30% R&D Tax Credit',
    providerAgency: 'Enterprise Ireland / Irish Revenue Commissioners',
    fundingType: 'TAX_RELIEF',
    currency: 'EUR',
    maxAmountFormatted: 'Up to 50% Angel Tax Relief / 30% R&D Credit',
    maxFundingAmount: 500000,
    matchRatePercentage: 100,
    isRepayable: false,
    minEmployees: 1,
    maxEmployees: 250,
    stageFit: 'Angel / Seed Funding Round & R&D Phase',
    turnaroundLabel: '4–6 Weeks Certification',
    turnaroundSpeed: 'STANDARD_6_TO_8_WEEKS',
    leoThreeQuoteEnforced: false,
    summary:
      'Gives private Irish investors up to 50% income tax relief on qualifying risk capital investments, plus a 30% cash tax credit on internal R&D expenditures.',
    descriptionMarkdown: `The EII scheme allows individual private investors to claim income tax relief of up to 50% on qualifying investments in Irish SMEs, significantly de-risking angel rounds. Concurrently, the Irish 30% R&D Tax Credit provides a 30% refundable corporation tax credit on scientific and technological innovation outlays.`,
    eligibleCosts: [
      'Angel equity investment in ordinary risk shares',
      'Internal engineering wages and subcontractor R&D expenditures',
      'Software architecture and scientific experimentation',
    ],
    ineligibleCosts: [
      'Routine software maintenance without systematic technological uncertainty',
      'Investments in non-qualifying property or retail sectors',
    ],
    applicationRequirements: [
      'EII Advance Certification through Enterprise Ireland or Revenue',
      'R&D technical documentation demonstrating resolution of scientific/technological uncertainty',
      'Timesheet logs tracking eligible engineering and scientific headcount',
    ],
    disqualificationRedFlags: [
      'Failure to maintain technical logs contemporaneous to R&D activities',
      'Investor connected with the company prior to investment (for EII)',
    ],
    reimbursementWarning:
      'EII provides tax deduction certificates to angel investors; R&D credit is paid as a cash offset or refund in 3 instalments from Revenue.',
    officialUrl: 'https://www.revenue.ie/en/investing-in-companies/employment-and-investment-incentive/index.aspx',
    status: 'ACTIVE',
    isActive: true,
    discoveredVia: 'SYSTEM_SEED',
  },

  // -------------------------------------------------------------
  // UNITED KINGDOM (GB)
  // -------------------------------------------------------------
  {
    slug: 'uk-british-business-bank-start-up-loans',
    countryCode: 'GB',
    grantName: 'British Business Bank Start Up Loan',
    providerAgency: 'British Business Bank (Gov-Backed)',
    fundingType: 'STARTUP_LOAN',
    currency: 'GBP',
    maxAmountFormatted: 'Up to £25,000 per Founder (£100k per Team)',
    maxFundingAmount: 25000,
    matchRatePercentage: 100,
    isRepayable: true,
    minEmployees: 1,
    maxEmployees: 10,
    maxTradingMonths: 36,
    stageFit: 'Trading < 36 Months / Pre-Trading',
    turnaroundLabel: '2–4 Weeks Turnaround',
    turnaroundSpeed: 'FAST_2_TO_4_WEEKS',
    leoThreeQuoteEnforced: false,
    compilerTemplateId: 'UK_STARTUP_LOANS_WORKBOOK',
    summary:
      'Government-backed personal loan for business purposes. Fixed 6% interest rate, 1–5 year term, zero early repayment penalties, 12 months free mentoring.',
    descriptionMarkdown: `The UK Start Up Loan programme offers unsecured personal loans from £500 to £25,000 per individual co-founder (up to a maximum of £100,000 for a team of 4 founders) at a fixed 6% p.a. interest rate. Each loan comes with 12 months of free professional mentoring and business support.`,
    eligibleCosts: [
      'Initial working capital, stock procurement, and premises deposits',
      'Product design, engineering, and digital marketing campaigns',
      'Capital equipment, IT infrastructure, and tools',
    ],
    ineligibleCosts: [
      'Debt consolidation or repayment of existing loans',
      'Speculative financial investments or property gambling',
    ],
    applicationRequirements: [
      'Module F Personal Survival Budget (demonstrating personal affordability)',
      'Written Sales Assumptions and 12–36 Month Cashflow Forecast',
      'Detailed Startup Preflight Business Plan',
      'UK credit score check and residency verification',
    ],
    disqualificationRedFlags: [
      'Unmanageable personal debt without surplus in Personal Survival Budget',
      'More than 36 months of active registered trading',
    ],
    reimbursementWarning:
      'Government-backed unsecured personal loan for business use. Personal liability applies.',
    officialUrl: 'https://www.startuploans.co.uk/',
    status: 'ACTIVE',
    isActive: true,
    discoveredVia: 'SYSTEM_SEED',
  },
  {
    slug: 'uk-innovate-uk-smart-grants',
    countryCode: 'GB',
    grantName: 'Innovate UK Smart Grant',
    providerAgency: 'Innovate UK / UKRI',
    fundingType: 'GRANT',
    currency: 'GBP',
    maxAmountFormatted: '£100,000 to £500,000 (Up to 70% match)',
    maxFundingAmount: 500000,
    matchRatePercentage: 70,
    isRepayable: false,
    minEmployees: 1,
    maxEmployees: 50,
    stageFit: 'R&D / High-Tech Innovation',
    turnaroundLabel: '12–16 Weeks Competitive Call',
    turnaroundSpeed: 'HEAVY_10_TO_16_WEEKS',
    leoThreeQuoteEnforced: false,
    compilerTemplateId: 'UK_INNOVATE_UK_9Q',
    summary:
      'Co-funds game-changing, highly disruptive R&D innovations with substantial technical risk and major UK economic export potential.',
    descriptionMarkdown: `Innovate UK Smart Grants are the premier competitive non-dilutive R&D grants in the United Kingdom. Open to game-changing, commercially viable R&D innovations across any tech sector. Applications are assessed against a rigorous 9-question Innovation Funding Service (IFS) rubric scoring project scope, market opportunity, technical approach, and economic additionality.`,
    eligibleCosts: [
      'Direct research and software engineering labour costs',
      'Subcontractor specialist fees and academic research partners',
      'Materials and prototyping lab consumables directly used for the project',
      'Capital equipment depreciation over the project timeline',
    ],
    ineligibleCosts: [
      'Commercial production or ongoing business sales activities',
      'Standard business overheads not directly traceable to the R&D project',
      'Costs incurred prior to project start date',
    ],
    applicationRequirements: [
      'Formal 9-Question IFS Written Submission',
      '2-Page Work Package & Project Plan Appendix',
      '2-Page Technical Merit / Architecture Appendix',
      '2-Page Risk Register Appendix',
      'Audited accounts or cashflow showing matching funding capability (30% co-fund)',
    ],
    disqualificationRedFlags: [
      'Incremental improvements without genuine technological risk or novelty',
      'Failure to demonstrate Freedom to Operate (FTO) or IP ownership',
      'IFS score below official quality threshold (typically 75–80%)',
    ],
    reimbursementWarning:
      'Reimbursed quarterly in arrears upon submission of vouched project claims and Independent Accountant Reports (IAR).',
    officialUrl: 'https://www.ukri.org/councils/innovate-uk/',
    status: 'ACTIVE',
    isActive: true,
    discoveredVia: 'SYSTEM_SEED',
  },
  {
    slug: 'uk-hmrc-seis-advance-assurance',
    countryCode: 'GB',
    grantName: 'HMRC SEIS (Seed Enterprise Investment Scheme)',
    providerAgency: 'HM Revenue & Customs (UK)',
    fundingType: 'TAX_RELIEF',
    currency: 'GBP',
    maxAmountFormatted: 'Up to £250,000 Company Cap (50% Angel Relief)',
    maxFundingAmount: 250000,
    matchRatePercentage: 100,
    isRepayable: false,
    minEmployees: 1,
    maxEmployees: 25,
    maxTradingMonths: 36,
    stageFit: 'Trading < 3 Years / Seed Round',
    turnaroundLabel: '4–6 Weeks Advance Assurance',
    turnaroundSpeed: 'STANDARD_6_TO_8_WEEKS',
    leoThreeQuoteEnforced: false,
    compilerTemplateId: 'UK_HMRC_SEIS_PACK',
    summary:
      'Gives UK angel investors 50% income tax relief plus complete Capital Gains Tax exemption. Advance Assurance is required by 90% of UK angel syndicates.',
    descriptionMarkdown: `SEIS is the UK's powerhouse startup tax incentive. It allows early-stage companies to raise up to £250,000 in equity funding by granting private investors 50% income tax relief on their investment, plus 100% exemption from Capital Gains Tax (CGT) on profits if shares are held for 3 years. Securing HMRC Advance Assurance before pitching is standard practice across the UK angel ecosystem.`,
    eligibleCosts: [
      'Cash investment in new ordinary unquoted shares',
      'Must be employed for a qualifying trade within 3 years of share issue',
    ],
    ineligibleCosts: [
      'Excluded trades (property development, financial services, leasing, legal/accountancy)',
    ],
    applicationRequirements: [
      'HMRC SEIS Advance Assurance application bundle',
      'Comprehensive Business Plan and 3-Year Financial Forecasts',
      'Risk-to-Capital Condition statement explaining the genuine commercial risk',
      'Details of at least one named prospective angel investor',
      'Copy of Articles of Association and Shareholder Agreement drafts',
    ],
    disqualificationRedFlags: [
      'Gross assets exceeding £350,000 prior to share issue',
      'Trading for more than 3 years from date of first commercial sale',
      'Pre-arranged exit arrangements or guaranteed returns for investors',
    ],
    reimbursementWarning:
      'Unlocks 50% tax relief for private investors; not a direct government cash grant to the company.',
    officialUrl:
      'https://www.gov.uk/guidance/venture-capital-schemes-apply-to-use-the-seed-enterprise-investment-scheme',
    status: 'ACTIVE',
    isActive: true,
    discoveredVia: 'SYSTEM_SEED',
  },
  {
    slug: 'uk-regional-growth-hub-grant',
    countryCode: 'GB',
    grantName: 'UK Regional Growth Hub Match Grant',
    providerAgency: 'Local Enterprise Partnerships / Growth Hubs (UK)',
    fundingType: 'GRANT',
    currency: 'GBP',
    maxAmountFormatted: '£2,500 to £10,000 (50% match)',
    maxFundingAmount: 10000,
    matchRatePercentage: 50,
    isRepayable: false,
    minEmployees: 1,
    maxEmployees: 10,
    stageFit: 'Pre-Trading or Early Growth',
    turnaroundLabel: '3–5 Weeks Turnaround',
    turnaroundSpeed: 'FAST_2_TO_4_WEEKS',
    leoThreeQuoteEnforced: false,
    summary:
      'Regional capital and business support grants administered through England, Scotland (SE), Wales (DBW), or Invest NI for local micro-enterprises.',
    descriptionMarkdown: `Growth Hubs across England, Scottish Enterprise, Business Wales, and Invest NI offer regional matching grants (often funded via the UK Shared Prosperity Fund) to help micro-enterprises invest in new machinery, commercial software, consultancy, and green tech transitions.`,
    eligibleCosts: [
      'IT infrastructure and specialized software tooling',
      'Specialist commercial consultancy and business mentoring',
      'Energy efficiency and carbon reduction equipment',
    ],
    ineligibleCosts: [
      'Routine operational overheads, debt repayment, and statutory tax charges',
    ],
    applicationRequirements: [
      'Growth Hub application questionnaire and brief business summary',
      '2 to 3 competitive supplier quotes',
      'Proof of 50% matching private finance',
    ],
    disqualificationRedFlags: [
      'Failing regional geographic residency criteria',
    ],
    reimbursementWarning:
      'Paid on reimbursement of vouched supplier invoices.',
    officialUrl: 'https://www.lepnetwork.net/growth-hubs/',
    status: 'ACTIVE',
    isActive: true,
    discoveredVia: 'SYSTEM_SEED',
  },
  {
    slug: 'uk-hmrc-rd-tax-relief-eris',
    countryCode: 'GB',
    grantName: 'HMRC Enhanced R&D Intensive Support (ERIS / RDEC)',
    providerAgency: 'HM Revenue & Customs (UK)',
    fundingType: 'R_AND_D_CREDIT',
    currency: 'GBP',
    maxAmountFormatted: 'Up to 27% payable cash credit on R&D spend',
    maxFundingAmount: 250000,
    matchRatePercentage: 100,
    isRepayable: false,
    minEmployees: 1,
    maxEmployees: 250,
    stageFit: 'Loss-Making High-Tech Startups',
    turnaroundLabel: '6–8 Weeks Post-CT600 Filing',
    turnaroundSpeed: 'STANDARD_6_TO_8_WEEKS',
    leoThreeQuoteEnforced: false,
    summary:
      'Provides loss-making UK tech startups with up to a 27% payable tax credit on qualified research, software development, and scientific engineering costs.',
    descriptionMarkdown: `Enhanced R&D Intensive Support (ERIS) is designed for loss-making UK SMEs where qualifying R&D expenditure constitutes at least 30% of total commercial expenditure. Delivers a payable cash credit from HMRC of up to £27 for every £100 of qualifying R&D spend, providing non-dilutive liquidity.`,
    eligibleCosts: [
      'Internal engineering, developer, and data science wages',
      'UK subcontractor development fees (subject to new 2024 rules)',
      'Cloud computing and software data costs directly utilized in R&D',
    ],
    ineligibleCosts: [
      'Routine bug fixing and cosmetic UI changes without technical uncertainty',
      'Overseas third-party contractors unless exceptional exemptions apply',
    ],
    applicationRequirements: [
      'HMRC Additional Information Form (AIF) submitted before Corporation Tax return (CT600)',
      'Detailed technical narrative of scientific/technological challenges overcome',
      'Detailed breakdown of qualifying staff hours and cloud server spend',
    ],
    disqualificationRedFlags: [
      'Failing to submit mandatory AIF prior to CT600 return',
      'R&D spend falling below 30% intensity threshold (for ERIS rate)',
    ],
    reimbursementWarning:
      'Paid as a cash refund directly into company bank account from HMRC following tax year end filing.',
    officialUrl: 'https://www.gov.uk/guidance/corporation-tax-research-and-development-rd-relief',
    status: 'ACTIVE',
    isActive: true,
    discoveredVia: 'SYSTEM_SEED',
  },
];

export async function seedGrantsCatalog() {
  console.log('🌱 Starting Grants Catalog Database Seed...');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 20000,
  });
  await client.connect();
  const db = drizzle(client, { schema });

  for (const grant of SEED_GRANTS) {
    const existing = await db
      .select()
      .from(grantsDirectory)
      .where(eq(grantsDirectory.slug, grant.slug));

    if (existing.length > 0) {
      console.log(`  ⚡ Updating existing grant: ${grant.slug}`);
      await db
        .update(grantsDirectory)
        .set({
          ...grant,
          updatedAt: new Date(),
        })
        .where(eq(grantsDirectory.slug, grant.slug));
    } else {
      console.log(`  ➕ Inserting new grant: ${grant.slug}`);
      await db.insert(grantsDirectory).values(grant);
    }
  }

  const allGrants = await db.select().from(grantsDirectory);
  console.log(`✅ Grants catalog populated successfully! Total grants in DB: ${allGrants.length}`);
  await client.end();
}

if (require.main === module) {
  seedGrantsCatalog()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Error seeding grants catalog:', err);
      process.exit(1);
    });
}
