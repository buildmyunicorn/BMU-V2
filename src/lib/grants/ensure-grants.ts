import { db, grantsDirectory, ensureDatabaseSchemaSynced } from '@/db';
import { eq } from 'drizzle-orm';
import type { GrantDirectoryRecord } from '@/app/actions/admin-grants';

export const FULL_DEFAULT_GRANTS_CATALOG: Omit<GrantDirectoryRecord, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    slug: 'ie-leo-feasibility-study-grant',
    countryCode: 'IE',
    grantName: 'LEO Feasibility Study Grant',
    providerAgency: 'Local Enterprise Office (Ireland)',
    fundingType: 'GRANT',
    currency: 'EUR',
    maxAmountFormatted: '€15,000 (50% Match / 60% in BMW Region)',
    maxFundingAmount: 15000,
    matchRatePercentage: 50,
    isRepayable: false,
    minEmployees: 0,
    maxEmployees: 10,
    maxTradingMonths: 12,
    stageFit: 'Idea / Prototype & Market Validation Stage',
    turnaroundLabel: '4–6 Weeks Evaluation Turnaround',
    turnaroundSpeed: 'FAST_4_TO_6_WEEKS',
    leoThreeQuoteEnforced: true,
    compilerTemplateId: 'IE_LEO_OFFICIAL',
    summary:
      'Up to €15,000 non-dilutive 50% matched grant funding to assess the commercial and technical viability of an innovative product or service with export potential.',
    descriptionMarkdown:
      'The Local Enterprise Office (LEO) Feasibility Study Grant provides up to €15,000 (covering 50% of eligible costs, or 60% in the Border, Midland and Western region) to help early-stage Irish founders research market demand, build technical prototypes, and validate intellectual property before commercial launch.',
    eligibleCosts: [
      'Founder market research & salary stipend up to €400/week (max €4,000 total)',
      'Third-party prototype engineering & MVP build consultancy',
      'Formal patent and IP freedom-to-operate searches',
      'Specialist market surveys, focus groups & feasibility studies',
      'Travel expenses related to international trade visits',
    ],
    ineligibleCosts: [
      'General operating overheads or day-to-day utilities',
      'Laptops, smartphones, office monitors, and general office furniture',
      'Motor vehicles, vans, or standard personal transport',
      'Costs incurred before formal Letter of Offer approval',
      'Value Added Tax (VAT) if registered for VAT',
    ],
    applicationRequirements: [
      'Completed official LEO Application Form & Appendices',
      'Minimum of 3 competitive independent written quotes for any third-party supplier expense exceeding €5,000',
      'Clear explanation of export potential or manufacturing displacement outside Ireland',
      'Founder CV and relevant industry background documentation',
      'Tax Clearance Access Number (TCAN) from Irish Revenue',
    ],
    disqualificationRedFlags: [
      'Retail, local personal services, or hospitality with local displacement only',
      'Spending money or signing vendor contracts before formal LEO Letter of Offer approval',
      'Submitting quotes from connected persons or non-arm’s length entities without disclosure',
      'Existing companies with greater than 10 full-time equivalent employees',
    ],
    reimbursementWarning:
      'Paid strictly on reimbursement of vouched receipts after formal approval. Do not spend money before receiving your official Letter of Offer.',
    eligibilityRulesJsonb: {
      maxEmployees: 10,
      requiresExportOrManufacturingPotential: true,
      preIncorporationAllowed: true,
      leoThreeQuoteEnforced: true,
    },
    officialUrl: 'https://www.localenterprise.ie/Discover-Business-Supports/Financial-Supports/Feasibility-Grant/',
    deadlineDate: null,
    status: 'ACTIVE',
    isActive: true,
    confidenceScore: 98,
    sourceSnippets: ['LEO Official Guidelines 2026', 'Department of Enterprise, Trade and Employment'],
    discoveredVia: 'SYSTEM_SEED',
    lastVerifiedAt: new Date('2026-01-01'),
  },
  {
    slug: 'ie-leo-priming-grant',
    countryCode: 'IE',
    grantName: 'LEO Priming Grant',
    providerAgency: 'Local Enterprise Office (Ireland)',
    fundingType: 'GRANT',
    currency: 'EUR',
    maxAmountFormatted: '€150,000 (Up to 50%–60% of Eligible Costs)',
    maxFundingAmount: 150000,
    matchRatePercentage: 50,
    isRepayable: false,
    minEmployees: 1,
    maxEmployees: 10,
    maxTradingMonths: 18,
    stageFit: 'First 18 Months of Trading / Early Hiring',
    turnaroundLabel: '6–8 Weeks Turnaround',
    turnaroundSpeed: 'STANDARD_6_TO_8_WEEKS',
    leoThreeQuoteEnforced: true,
    compilerTemplateId: 'IE_LEO_OFFICIAL',
    summary:
      'Flagship Irish startup funding for newly trading businesses within their first 18 months, covering salary grants, specialized equipment, and marketing to stimulate sustainable employment.',
    descriptionMarkdown:
      'The LEO Priming Grant is designed for micro-enterprises in their initial 18 months of trading that have demonstrated growth potential and export capability. It provides direct co-funding for new job creation, specialized machinery, and commercial marketing strategies.',
    eligibleCosts: [
      'Direct salary support for new full-time positions created (up to €15,000 per job)',
      'Specialized capital equipment and machinery directly required for production/delivery',
      'Marketing campaigns, professional branding, and customer acquisition campaigns',
      'Specialist consultancy and technical implementation services',
      'General business overheads tied directly to business establishment',
    ],
    ineligibleCosts: [
      'Standard consumer laptops, desktop computers, smartphones, and vehicles',
      'Refinancing existing bank loans, credit lines, or debt settlements',
      'Costs incurred before formal written approval of the Letter of Offer',
      'Local service businesses that merely displace existing local competitors',
      'VAT where the applicant is VAT registered',
    ],
    applicationRequirements: [
      'Full 3-Year Business Plan and Cashflow Forecast',
      'Must be an incorporated entity (Private Limited Company / DAC) or registered sole trader trading < 18 months',
      '3 independent written quotes for every single capital purchase over €5,000',
      'Latest audited accounts or management accounts to date',
      'Valid Tax Clearance Certificate (TCAN)',
    ],
    disqualificationRedFlags: [
      'Trading for more than 18 months (must apply for Business Expansion Grant instead)',
      'Lack of export capability or international market potential',
      'Hiring family members without verified open competition or arm’s length compensation',
      'Failing to maintain tax clearance throughout the drawdown phases',
    ],
    reimbursementWarning:
      'Salary support and capital outlays are reimbursed in tranches upon proof of expenditure and tax clearance. Laptops, phones, and vehicles are strictly excluded.',
    eligibilityRulesJsonb: {
      monthsSinceIncorporationMax: 18,
      maxEmployees: 10,
      requiresIncorporatedLtd: true,
      leoThreeQuoteEnforced: true,
    },
    officialUrl: 'https://www.localenterprise.ie/Discover-Business-Supports/Financial-Supports/Priming-Grant/',
    deadlineDate: null,
    status: 'ACTIVE',
    isActive: true,
    confidenceScore: 98,
    sourceSnippets: ['LEO Priming Grant Guidelines', 'Enterprise Ireland Micro-Enterprise Support Framework'],
    discoveredVia: 'SYSTEM_SEED',
    lastVerifiedAt: new Date('2026-01-01'),
  },
  {
    slug: 'ie-enterprise-ireland-pssf-new-frontiers',
    countryCode: 'IE',
    grantName: 'Enterprise Ireland New Frontiers & Pre-Seed Start Fund (PSSF)',
    providerAgency: 'Enterprise Ireland',
    fundingType: 'EQUITY_MATCH',
    currency: 'EUR',
    maxAmountFormatted: '€15,000 Stipend (New Frontiers) / €50k–€100k CLN (PSSF)',
    maxFundingAmount: 100000,
    matchRatePercentage: 90,
    isRepayable: false,
    minEmployees: 1,
    maxEmployees: 15,
    maxTradingMonths: 36,
    stageFit: 'High Potential Start-Up (HPSU) / Pre-Seed Stage',
    turnaroundLabel: 'Quarterly Competitive Calls (6–8 Weeks)',
    turnaroundSpeed: 'STANDARD_6_TO_8_WEEKS',
    leoThreeQuoteEnforced: false,
    compilerTemplateId: 'STANDARD_BUSINESS_PLAN',
    summary:
      'Accelerate high-potential early-stage innovation through €15k tax-free founder stipends (New Frontiers Phase 2) or €50k–€100k Convertible Loan Notes via Enterprise Ireland PSSF.',
    descriptionMarkdown:
      'The Pre-Seed Start Fund (PSSF) from Enterprise Ireland provides convertible loan note (CLN) funding of €50,000 or €100,000 for early-stage companies with High Potential Start-Up (HPSU) characteristics. Designed to bridge the gap between initial concept and angel/VC seed rounds.',
    eligibleCosts: [
      'Founder salaries and full-time technical development talent',
      'Core software architecture, infrastructure and prototype scale-up',
      'International customer discovery and pilot client onboarding',
      'Intellectual property protection and patent registration',
      'Market validation travel and customer interviews in target export markets',
    ],
    ineligibleCosts: [
      'Debt servicing, loan repayments, or director loan paybacks',
      'Routine operating costs of non-innovative businesses',
      'Projects lacking global scalability (e.g. domestic retail, consulting)',
      'Retrospective expenditures prior to application evaluation',
    ],
    applicationRequirements: [
      'Incorporated Irish Private Limited Company (LTD)',
      'Clear HPSU profile: €1M+ sales & 10+ jobs within 3–4 years',
      'Minimum 10% cash co-funding match (€5k for €50k, €10k for €100k)',
      'Video pitch and comprehensive pitch deck',
      'Clean corporate shareholding structure with founder equity vesting',
    ],
    disqualificationRedFlags: [
      'Lacking export ambition or purely focused on domestic Irish consumer market',
      'Failure to secure the required 10% co-funding match prior to disbursement',
      'Excessive founder dilution or unresolved co-founder cap table disputes',
      'Unresolved intellectual property ownership (IP must reside in the Irish company)',
    ],
    reimbursementWarning:
      'PSSF requires an incorporated Irish Limited company and private co-funding match of at least 10% (€5k or €10k) paid in tranches against agreed milestones.',
    eligibilityRulesJsonb: {
      requiresHpsuPotential: true,
      requiresIncorporatedLtd: true,
      minMatchRatePercent: 10,
    },
    officialUrl: 'https://www.enterprise-ireland.com/en/funding/pre-seed-start-fund',
    deadlineDate: null,
    status: 'ACTIVE',
    isActive: true,
    confidenceScore: 97,
    sourceSnippets: ['Enterprise Ireland PSSF Reference Doc 2026'],
    discoveredVia: 'SYSTEM_SEED',
    lastVerifiedAt: new Date('2026-01-01'),
  },
  {
    slug: 'ie-sure-eii-rd-tax-relief',
    countryCode: 'IE',
    grantName: 'Revenue SURE, EII & 30% R&D Tax Credit Schemes',
    providerAgency: 'Revenue Commissioners (Ireland)',
    fundingType: 'TAX_RELIEF',
    currency: 'EUR',
    maxAmountFormatted: 'Up to 41% Income Tax Refund (SURE) / 40% Relief (EII)',
    maxFundingAmount: 100000,
    matchRatePercentage: 40,
    isRepayable: false,
    minEmployees: 0,
    maxEmployees: 50,
    maxTradingMonths: 84,
    stageFit: 'Incorporation, Seed Equity & Scientific R&D',
    turnaroundLabel: 'Self-Assessment / Annual Tax Filing',
    turnaroundSpeed: 'FAST_2_TO_4_WEEKS',
    leoThreeQuoteEnforced: false,
    compilerTemplateId: 'STANDARD_BUSINESS_PLAN',
    summary:
      'Reclaim up to 41% of prior PAYE income tax paid over the past 6 years (SURE) or offer external investors up to 40% income tax relief (EII) when subscribing for qualifying shares.',
    descriptionMarkdown:
      'Ireland offers exceptional tax-incentivized founder funding. SURE (Startup Refunds for Entrepreneurs) enables individuals who left employment to start a qualifying trading company to reclaim income tax paid over the preceding six tax years. EII offers external angels up to 40% relief.',
    eligibleCosts: [
      'Direct equity investment into new ordinary shares of an Irish qualifying company',
      'Founder personal capital re-investment derived from historic PAYE taxes',
      'Angel investor equity rounds into qualifying innovative micro-enterprises',
      'Qualified scientific research & experimental development expenditures (R&D credit)',
    ],
    ineligibleCosts: [
      'Preference shares or debt instruments (must be risk-bearing ordinary shares)',
      'Companies engaged in land dealing, financial services, or extraction',
      'Pre-existing companies with no new share issue or economic activity',
      'Non-arms-length share transactions designed purely for tax avoidance',
    ],
    applicationRequirements: [
      'Incorporated Irish Limited company carrying on a qualifying trade',
      'Form SURE 01 application submitted via Revenue myAccount or ROS',
      'Evidence of founder holding minimum 15% equity and working full-time in the company',
      'P60s/Employment Detail Summaries for the previous 6 tax years',
      'Business plan detailing qualifying commercial trade',
    ],
    disqualificationRedFlags: [
      'Failure to hold the shares for the mandatory 3-to-4 year holding period',
      'Operating an excluded trade (e.g. passive holding company, property development)',
      'Founder not working full-time in the qualifying startup company',
      'Failing to file annual CT1 or payroll returns in good standing',
    ],
    reimbursementWarning:
      'SURE allows founders leaving PAYE employment to reclaim up to 6 years of prior income tax to invest directly into their new Irish Limited company.',
    eligibilityRulesJsonb: {
      requiresTradingCompany: true,
      requiresIncorporatedLtd: true,
      founderFullTimeCommitment: true,
    },
    officialUrl: 'https://www.revenue.ie/en/starting-a-business/relief-for-investment-in-corporate-trades/startup-refunds-for-entrepreneurs/index.aspx',
    deadlineDate: null,
    status: 'ACTIVE',
    isActive: true,
    confidenceScore: 96,
    sourceSnippets: ['Revenue Tax and Duty Manual Part 16-00-02'],
    discoveredVia: 'SYSTEM_SEED',
    lastVerifiedAt: new Date('2026-01-01'),
  },
  {
    slug: 'ie-revenue-rd-tax-credit',
    countryCode: 'IE',
    grantName: 'Revenue 30% R&D Tax Credit (Refundable Cash Credit)',
    providerAgency: 'Revenue Commissioners (Ireland)',
    fundingType: 'R_AND_D_CREDIT',
    currency: 'EUR',
    maxAmountFormatted: '30% Tax Credit on Qualifying R&D Spend (Payable in Cash)',
    maxFundingAmount: 75000,
    matchRatePercentage: 30,
    isRepayable: false,
    minEmployees: 1,
    maxEmployees: 50,
    maxTradingMonths: 120,
    stageFit: 'Pre-Revenue & Trading Technical R&D',
    turnaroundLabel: 'Annual CT1 Corporate Tax Return',
    turnaroundSpeed: 'STANDARD_6_TO_8_WEEKS',
    leoThreeQuoteEnforced: false,
    compilerTemplateId: 'STANDARD_BUSINESS_PLAN',
    summary:
      '30% corporation tax credit for companies carrying on qualifying research and experimental development in Ireland. Payable as a direct cash refund for pre-profit startups.',
    descriptionMarkdown:
      'Ireland’s 30% R&D Tax Credit provides early-stage and deeptech startups with a substantial cash rebate against qualifying technological innovation expenditures. Even with zero corporation tax liability, the credit is paid out in three annual cash instalments.',
    eligibleCosts: [
      'Direct payroll expenses of software engineers, data scientists, and technicians',
      'Subcontracted R&D consultancy (up to €20,000 or 15% of internal spend)',
      'Consumables, cloud compute server costs directly incurred in R&D experiments',
      'Specialized laboratory equipment and technical software prototyping licenses',
    ],
    ineligibleCosts: [
      'Routine bug fixes, minor UI tweaks, or cosmetic website themes',
      'Standard sales and administrative salaries',
      'Advertising, general business development, and market surveys',
      'Capital expenditure already grant-funded by other state agencies without netting',
    ],
    applicationRequirements: [
      'Filed within 12 months from the end of the accounting period in which R&D occurred',
      'Detailed contemporaneous scientific/technological project records and time logs',
      'Demonstration of resolving systematic technological or scientific uncertainty',
      'Incorporated company within the charge to Irish corporation tax',
    ],
    disqualificationRedFlags: [
      'Lacking contemporaneous documentation (notes created after the fact during an audit)',
      'Claiming commercial or aesthetic software features rather than technical uncertainty',
      'Double-dipping on expenses already 100% funded by other government grants',
      'Subcontractor costs that were not carried out under direct company supervision',
    ],
    reimbursementWarning:
      'Must maintain contemporaneous documentation proving resolution of scientific or technological uncertainty. Retrospective documentation created during an audit is rejected.',
    eligibilityRulesJsonb: {
      requiresIncorporatedLtd: true,
      requiresScientificUncertainty: true,
    },
    officialUrl: 'https://www.revenue.ie/en/companies-and-organisations/research-and-development-tax-credit/index.aspx',
    deadlineDate: null,
    status: 'ACTIVE',
    isActive: true,
    confidenceScore: 97,
    sourceSnippets: ['Revenue Guidelines on R&D Tax Credit Section 766 TCA 1997'],
    discoveredVia: 'SYSTEM_SEED',
    lastVerifiedAt: new Date('2026-01-01'),
  },
  {
    slug: 'ie-leo-digital-for-business',
    countryCode: 'IE',
    grantName: 'LEO Digital for Business & AI Voucher (€5k at 50%)',
    providerAgency: 'Local Enterprise Office (Ireland)',
    fundingType: 'VOUCHER',
    currency: 'EUR',
    maxAmountFormatted: '€2,700 – €5,000 Voucher (50%–80% Grant Funding)',
    maxFundingAmount: 5000,
    matchRatePercentage: 50,
    isRepayable: false,
    minEmployees: 1,
    maxEmployees: 10,
    maxTradingMonths: 60,
    stageFit: 'Digital Transformation, E-Commerce & AI Integration',
    turnaroundLabel: '2–3 Weeks Fast-Track Approval',
    turnaroundSpeed: 'FAST_2_TO_4_WEEKS',
    leoThreeQuoteEnforced: true,
    compilerTemplateId: 'IE_LEO_OFFICIAL',
    summary:
      'Co-fund digital transformation, e-commerce adoption, process automation, and generative AI integration to boost operational productivity.',
    descriptionMarkdown:
      'LEO Digital for Business (along with Grow Digital and the AI Voucher) provides micro-enterprises with non-dilutive co-funding to introduce digital systems, AI workflow automation, customer self-service portals, and cloud integrations.',
    eligibleCosts: [
      'Implementation of bespoke software, cloud ERP, CRM, and inventory integrations',
      'AI workflow automation and customer service AI agent deployment',
      'Custom e-commerce web platform enhancements and payment gateway integrations',
      'Digital marketing system automation and customer analytics infrastructure',
      'Staff training directly linked to operating newly implemented digital tools',
    ],
    ineligibleCosts: [
      'Standard annual software subscriptions (e.g. recurring Google Workspace, Slack fees)',
      'Off-the-shelf consumer hardware without dedicated industrial integration',
      'Costs incurred prior to written voucher approval from the Local Enterprise Office',
      'Routine website maintenance or generic blog content creation',
    ],
    applicationRequirements: [
      'Trading micro-enterprise with 1 to 10 full-time equivalent employees',
      '3 competitive independent written quotes from qualified digital/software agencies',
      'Completed Digital Health Check / Needs Assessment with LEO consultant',
      'Tax Clearance Access Number (TCAN)',
    ],
    disqualificationRedFlags: [
      'Using connected vendors or agencies owned by directors or relatives',
      'Commencing agency development before receiving official voucher approval',
      'Trading as a non-commercial entity or non-profit',
    ],
    reimbursementWarning:
      'Reimbursed upon completion of the implementation and submission of supplier paid invoice and proof of bank payment.',
    eligibilityRulesJsonb: {
      maxEmployees: 10,
      leoThreeQuoteEnforced: true,
    },
    officialUrl: 'https://www.localenterprise.ie/Discover-Business-Supports/Digital-Supports/',
    deadlineDate: null,
    status: 'ACTIVE',
    isActive: true,
    confidenceScore: 95,
    sourceSnippets: ['LEO Digital Supports Catalog 2026'],
    discoveredVia: 'SYSTEM_SEED',
    lastVerifiedAt: new Date('2026-01-01'),
  },
  {
    slug: 'uk-british-business-bank-start-up-loans',
    countryCode: 'GB',
    grantName: 'British Business Bank Start Up Loans',
    providerAgency: 'British Business Bank (UK)',
    fundingType: 'STARTUP_LOAN',
    currency: 'GBP',
    maxAmountFormatted: 'Up to £25,000 per Co-Founder (£100k max per team) @ 6% Fixed',
    maxFundingAmount: 25000,
    matchRatePercentage: 100,
    isRepayable: true,
    minEmployees: 0,
    maxEmployees: 25,
    maxTradingMonths: 36,
    stageFit: 'Pre-Launch to First 3 Years of Trading',
    turnaroundLabel: '2–4 Weeks Application to Disbursement',
    turnaroundSpeed: 'FAST_2_TO_4_WEEKS',
    leoThreeQuoteEnforced: false,
    compilerTemplateId: 'UK_START_UP_LOANS_WORKBOOK',
    summary:
      'Government-backed unsecured personal startup loan of up to £25,000 per founder at a fixed 6% interest rate with 1–5 year terms and 12 months of free business mentoring.',
    descriptionMarkdown:
      'The UK British Business Bank Start Up Loans program delivers accessible, low-interest capital to aspiring entrepreneurs across England, Scotland, Wales, and Northern Ireland. Each founder can borrow up to £25,000 (up to £100,000 for a team of 4 co-founders) with no early repayment penalties.',
    eligibleCosts: [
      'Initial working capital and inventory purchases',
      'Equipment, tooling, and commercial machinery',
      'Website build, branding, design, and software prototyping',
      'Initial marketing, advertising campaigns, and PR outreach',
      'Premises fit-out, lease deposits, and legal incorporation expenses',
    ],
    ineligibleCosts: [
      'Debt consolidation or paying off personal credit card debts',
      'Gambling, property speculation, or currency day trading',
      'Investments into other companies or speculative crypto assets',
      'Training or academic qualifications not directly required for the business',
    ],
    applicationRequirements: [
      'Personal Survival Budget proving personal affordability and creditworthiness',
      '12–36 Month Cashflow Forecast with explicit sales assumptions',
      'Comprehensive Business Plan workbook',
      'UK resident aged 18+ with legal right to work in the UK',
      'Trading for fewer than 36 months',
    ],
    disqualificationRedFlags: [
      'Severe adverse credit history (unresolved CCJs, current bankruptcy or IVAs)',
      'Negative personal survival budget (income insufficient to cover living expenses)',
      'Trading for longer than 36 months at time of loan application',
      'Failure to provide realistic, bottom-up evidence for sales projections',
    ],
    reimbursementWarning:
      'This is an unsecured personal loan for business purposes. You are personally liable for repayment even if the startup fails.',
    eligibilityRulesJsonb: {
      monthsTradingMax: 36,
      requiresPersonalSurvivalBudget: true,
      fixedInterestRate: 6,
    },
    officialUrl: 'https://www.startuploans.co.uk/',
    deadlineDate: null,
    status: 'ACTIVE',
    isActive: true,
    confidenceScore: 98,
    sourceSnippets: ['British Business Bank SUL Applicant Guidance 2026'],
    discoveredVia: 'SYSTEM_SEED',
    lastVerifiedAt: new Date('2026-01-01'),
  },
  {
    slug: 'uk-hmrc-seis-eis-advance-assurance',
    countryCode: 'GB',
    grantName: 'HMRC SEIS & EIS Advance Assurance',
    providerAgency: 'HM Revenue & Customs (UK)',
    fundingType: 'TAX_RELIEF',
    currency: 'GBP',
    maxAmountFormatted: '£250,000 SEIS (50% Angel Relief) / £5M EIS (30% Relief)',
    maxFundingAmount: 250000,
    matchRatePercentage: 50,
    isRepayable: false,
    minEmployees: 0,
    maxEmployees: 25,
    maxTradingMonths: 36,
    stageFit: 'Angel & Pre-Seed Equity Fundraising',
    turnaroundLabel: '3–6 Weeks HMRC Review',
    turnaroundSpeed: 'FAST_4_TO_6_WEEKS',
    leoThreeQuoteEnforced: false,
    compilerTemplateId: 'UK_HMRC_SEIS_EIS_PACK',
    summary:
      'Secure advance confirmation from HMRC that private investors can claim 50% income tax relief (SEIS) and 0% capital gains tax on investments up to £250,000.',
    descriptionMarkdown:
      'The Seed Enterprise Investment Scheme (SEIS) is the UK’s most powerful angel fundraising catalyst. It allows qualifying early-stage companies to raise up to £250,000 by giving individual investors up to 50% of their investment back in income tax relief, plus full capital gains tax exemption.',
    eligibleCosts: [
      'Research, experimental development, and software platform build',
      'Key personnel hiring, engineering payroll, and talent acquisition',
      'Commercial marketing, customer validation, and sales expansion',
      'Essential equipment and intellectual property registration',
    ],
    ineligibleCosts: [
      'Acquiring shares in other companies or buying an existing business',
      'Land dealing, property development, or financial services activities',
      'Returning capital to existing shareholders or paying off non-commercial loans',
      'Subcontracting all economic activity without retaining internal UK IP',
    ],
    applicationRequirements: [
      'UK permanent establishment (UK registered LTD or UK branch)',
      'Trading for less than 3 years for SEIS (less than 7 years for EIS)',
      'Gross assets under £350,000 before investment and fewer than 25 employees',
      'Must provide details of at least one named prospective angel investor',
      'Risk-to-Capital condition: clear commercial growth plan with genuine capital risk',
    ],
    disqualificationRedFlags: [
      'Pre-arranged investor exit deals or guaranteed return mechanisms',
      'Operating an excluded trade (banking, leasing, property development, hotels)',
      'Investor owning > 30% of share capital or voting rights (substantial interest test)',
      'Failing to deploy funds within 3 years on qualifying business activities',
    ],
    reimbursementWarning:
      'Not a cash grant—unlocks up to 50% tax relief for UK angel investors. Requires a named prospective investor and a Risk-to-Capital statement.',
    eligibilityRulesJsonb: {
      ukPermanentEstablishment: true,
      requiresIncorporatedLtd: true,
      grossAssetsMax: 350000,
    },
    officialUrl: 'https://www.gov.uk/guidance/venture-capital-schemes-apply-to-use-the-seed-enterprise-investment-scheme',
    deadlineDate: null,
    status: 'ACTIVE',
    isActive: true,
    confidenceScore: 98,
    sourceSnippets: ['HMRC Venture Capital Schemes Manual VCM10000'],
    discoveredVia: 'SYSTEM_SEED',
    lastVerifiedAt: new Date('2026-01-01'),
  },
  {
    slug: 'uk-innovate-uk-smart-grants',
    countryCode: 'GB',
    grantName: 'Innovate UK Smart Grants & Sector Competitions',
    providerAgency: 'Innovate UK (UKRI)',
    fundingType: 'GRANT',
    currency: 'GBP',
    maxAmountFormatted: '£100,000 – £500,000 (Up to 70% of Eligible R&D Costs)',
    maxFundingAmount: 500000,
    matchRatePercentage: 70,
    isRepayable: false,
    minEmployees: 1,
    maxEmployees: 50,
    maxTradingMonths: 120,
    stageFit: 'Game-Changing R&D, Feasibility & Prototype Testing',
    turnaroundLabel: 'Quarterly Assessment Rounds (10–12 Weeks)',
    turnaroundSpeed: 'COMPLEX_10_TO_12_WEEKS',
    leoThreeQuoteEnforced: false,
    compilerTemplateId: 'UK_INNOVATE_UK_9Q',
    summary:
      'Competitive non-dilutive grant funding for game-changing, commercially viable R&D innovations with the potential to significantly impact the UK economy.',
    descriptionMarkdown:
      'Innovate UK Smart Grants support disruptive, breakthrough innovations from UK businesses. Grants cover up to 70% of total eligible project costs for micro and small enterprises, funding 6 to 36 month scientific or technical development projects that address major commercial market needs.',
    eligibleCosts: [
      'Direct technical labor and research payroll for the project team',
      'Subcontractor fees for specialized scientific or engineering expertise',
      'Project-specific materials, laboratory consumables, and prototype tooling',
      'Capital equipment depreciation during the active project months',
      'Travel and subsistence directly tied to collaborative technical trials',
    ],
    ineligibleCosts: [
      'Commercial sales, marketing, advertising, and branding',
      'Full capital cost of assets that have a useful life beyond the project',
      'Contingency funds or non-specific cost reserves',
      'Costs incurred before the formal project start date confirmed in the grant offer',
    ],
    applicationRequirements: [
      'Rigorous 9-Question Innovation Funding Service (IFS) application',
      'Detailed Work Package breakdown (WP1..n) with milestones and deliverables',
      'Formal 4-Category Project Risk Register (Technical, Commercial, Regulatory, Managerial)',
      'Must demonstrate disruptive innovation that leapfrogs the global state-of-the-art',
      'Must have match funding in place for the un-grant-funded 30% balance',
    ],
    disqualificationRedFlags: [
      'Incremental innovation (standard app development or off-the-shelf software assembly)',
      'Inability to bridge quarterly arrears payments (cashflow bridge failure)',
      'Poorly justified subcontractor costs exceeding normal commercial rates',
      'Failing to satisfy the IFS assessor peer review scoring threshold (typically 80%+)',
    ],
    reimbursementWarning:
      'Paid quarterly in arrears after Independent Accountant Review (IAR). You must have working capital to bridge the 30% match + quarterly lag.',
    eligibilityRulesJsonb: {
      requiresDisruptiveRAndD: true,
      requiresIncorporatedLtd: true,
      matchRatePercentage: 70,
    },
    officialUrl: 'https://www.ukri.org/councils/innovate-uk/',
    deadlineDate: null,
    status: 'ACTIVE',
    isActive: true,
    confidenceScore: 96,
    sourceSnippets: ['Innovate UK General Guidance for Applicants 2026'],
    discoveredVia: 'SYSTEM_SEED',
    lastVerifiedAt: new Date('2026-01-01'),
  },
  {
    slug: 'uk-hmrc-rd-tax-relief-eris',
    countryCode: 'GB',
    grantName: 'HMRC R&D Tax Relief (ERIS 27% Intensive / RDEC 20%)',
    providerAgency: 'HM Revenue & Customs (UK)',
    fundingType: 'R_AND_D_CREDIT',
    currency: 'GBP',
    maxAmountFormatted: 'Up to 27% Payable Tax Credit for R&D Intensive Startups',
    maxFundingAmount: 150000,
    matchRatePercentage: 27,
    isRepayable: false,
    minEmployees: 1,
    maxEmployees: 50,
    maxTradingMonths: 120,
    stageFit: 'Loss-Making Tech Startups & Heavy R&D Innovators',
    turnaroundLabel: '30–40 Days Post-CT600 Submission',
    turnaroundSpeed: 'FAST_4_TO_6_WEEKS',
    leoThreeQuoteEnforced: false,
    compilerTemplateId: 'STANDARD_BUSINESS_PLAN',
    summary:
      'Reclaim up to 27p in cash per £1 of qualifying R&D spend for loss-making R&D intensive SMEs under the Enhanced R&D Intensive Support (ERIS) scheme.',
    descriptionMarkdown:
      'Under the UK’s merged R&D tax framework and the ERIS (Enhanced R&D Intensive Support) scheme, loss-making startups whose qualifying R&D spend represents at least 30% of total expenditure can claim a payable tax credit of up to 26.97% directly into their bank account.',
    eligibleCosts: [
      'Direct engineering, software development, and technical staff gross payroll & pensions',
      'Subcontracted R&D activities and externally provided workers (EPWs)',
      'Cloud computing services, hosting infrastructure, and specialized dataset licenses',
      'Software prototyping licenses and laboratory consumables consumed in R&D',
    ],
    ineligibleCosts: [
      'Production and distribution of goods or commercial maintenance',
      'General administrative salaries, HR, and marketing outlays',
      'Rent, commercial rates, and general office heating/electricity',
      'Capital investments (must claim Research and Development Allowances instead)',
    ],
    applicationRequirements: [
      'Mandatory HMRC Additional Information Form (AIF) submitted before CT600',
      'Clear explanation of the technological uncertainty and scientific advance',
      'Name of the competent internal technical professional leading the project',
      'Detailed breakdown of qualifying expenditure by project',
    ],
    disqualificationRedFlags: [
      'Failure to submit the digital AIF form prior to filing company tax return CT600',
      'Claiming standard web or software design work without technological uncertainty',
      'Submitting non-arm’s length overseas subcontractor costs without meeting exceptions',
      'Failing HMRC compliance check audit on time logs and technical credentials',
    ],
    reimbursementWarning:
      'Mandatory Additional Information Form (AIF) must be digitally submitted to HMRC before filing your CT600 tax return or the claim will be automatically rejected.',
    eligibilityRulesJsonb: {
      ukPermanentEstablishment: true,
      requiresIncorporatedLtd: true,
      rAndDIntensityThresholdPercent: 30,
    },
    officialUrl: 'https://www.gov.uk/guidance/claiming-research-and-development-tax-reliefs',
    deadlineDate: null,
    status: 'ACTIVE',
    isActive: true,
    confidenceScore: 97,
    sourceSnippets: ['HMRC Guidelines for Research and Development Tax Relief (ERIS)'],
    discoveredVia: 'SYSTEM_SEED',
    lastVerifiedAt: new Date('2026-01-01'),
  },
  {
    slug: 'us-sbir-sttr-seed-fund',
    countryCode: 'US',
    grantName: 'America’s Seed Fund (NSF / NIH SBIR & STTR Phase I)',
    providerAgency: 'U.S. Small Business Administration / NSF',
    fundingType: 'GRANT',
    currency: 'USD',
    maxAmountFormatted: '$275,000 – $305,000 Non-Dilutive R&D Grant',
    maxFundingAmount: 300000,
    matchRatePercentage: 100,
    isRepayable: false,
    minEmployees: 1,
    maxEmployees: 500,
    maxTradingMonths: 120,
    stageFit: 'Feasibility Proof-of-Concept & Scientific Discovery',
    turnaroundLabel: '4–6 Months Evaluation',
    turnaroundSpeed: 'COMPLEX_10_TO_12_WEEKS',
    leoThreeQuoteEnforced: false,
    compilerTemplateId: 'STANDARD_BUSINESS_PLAN',
    summary:
      'Non-dilutive federal grants from NSF, NIH, DoD and DoE to transform scientific discoveries into commercially viable products.',
    descriptionMarkdown:
      'America’s Seed Fund awards more than $4 billion annually in non-dilutive capital through Small Business Innovation Research (SBIR) and Small Business Technology Transfer (STTR) programs to US-based deeptech startups.',
    eligibleCosts: [
      'Principal investigator and research staff salaries',
      'Laboratory supplies, reagents, and test materials',
      'Specialized scientific instrumentation and computational access',
      'Subcontracting research institutions (up to 33% in Phase I)',
    ],
    ineligibleCosts: [
      'Sales, marketing, and business development expenditures',
      'Work performed outside of the 50 United States or territories',
      'Standard operational overhead unrelated to research deliverables',
    ],
    applicationRequirements: [
      'Must be >50% owned by US citizens or lawful permanent residents',
      'Active registrations on SAM.gov, Grants.gov, and SBA.gov',
      'Submission of Project Pitch and formal Phase I technical proposal',
    ],
    disqualificationRedFlags: [
      'Conducting scientific work outside the United States without prior waiver',
      'Failing to maintain active SAM.gov Entity Unique Identifier (UEI) registration',
      'Submitting commercial software with no fundamental scientific research',
    ],
    reimbursementWarning:
      'Requires >50% US citizen/permanent resident ownership and all R&D work performed inside the United States.',
    eligibilityRulesJsonb: {
      usOwnedAndOperated: true,
      requiresTechnicalRAndD: true,
    },
    officialUrl: 'https://seedfund.nsf.gov/',
    deadlineDate: null,
    status: 'ACTIVE',
    isActive: true,
    confidenceScore: 95,
    sourceSnippets: ['SBA SBIR/STTR Policy Directive'],
    discoveredVia: 'SYSTEM_SEED',
    lastVerifiedAt: new Date('2026-01-01'),
  },
  {
    slug: 'au-rd-tax-incentive-emdg',
    countryCode: 'AU',
    grantName: 'R&D Tax Incentive & EMDG Export Market Development Grant',
    providerAgency: 'AusIndustry & Austrade',
    fundingType: 'R_AND_D_CREDIT',
    currency: 'AUD',
    maxAmountFormatted: '43.5% Refundable R&D Tax Offset + Up to $150k/yr EMDG',
    maxFundingAmount: 150000,
    matchRatePercentage: 43,
    isRepayable: false,
    minEmployees: 1,
    maxEmployees: 50,
    maxTradingMonths: 120,
    stageFit: 'Technical Innovation & Global Export Marketing',
    turnaroundLabel: 'Annual AusIndustry Registration',
    turnaroundSpeed: 'FAST_4_TO_6_WEEKS',
    leoThreeQuoteEnforced: false,
    compilerTemplateId: 'STANDARD_BUSINESS_PLAN',
    summary:
      '43.5% refundable tax offset for eligible Australian startups investing in novel core R&D, plus matched grants for export market development.',
    descriptionMarkdown:
      'The Australian R&D Tax Incentive encourages companies to conduct systematic experimentation whose outcome cannot be known in advance. Startups with turnover under $20M receive a refundable cash tax offset of 43.5% of eligible R&D expenditure.',
    eligibleCosts: [
      'Salaries and on-costs of engineers and scientists conducting experiments',
      'Contractor costs directly incurred on core R&D activities',
      'Consumables, cloud compute, and feedstocks consumed during testing',
      'Depreciation of specialized laboratory and technical equipment',
    ],
    ineligibleCosts: [
      'Routine software maintenance, bug fixing, and cosmetic UX updates',
      'Market research, sales promotions, and general advertising',
      'Patent defense litigation and legal entity formation costs',
      'Interest, financing charges, and debt servicing',
    ],
    applicationRequirements: [
      'Incorporated Australian Pty Ltd company',
      'Annual registration with AusIndustry within 10 months of financial year end',
      'Evidence of generating new knowledge via scientific experimentation',
      'Minimum $20,000 eligible R&D expenditure in the claim year',
    ],
    disqualificationRedFlags: [
      'Lacking contemporaneous hypothesis-experiment-conclusion documentation',
      'Claiming standard business analysis or conventional programming methods',
      'Failing to lodge with AusIndustry within the strict 10-month post-EOFY cutoff',
    ],
    reimbursementWarning:
      'R&D Tax Offset is claimed after EOFY via an incorporated Australian Pty Ltd; EMDG reimburses 50% of eligible export marketing.',
    eligibilityRulesJsonb: {
      requiresAustralianPtyLtd: true,
      minSpendThreshold: 20000,
    },
    officialUrl: 'https://business.gov.au/grants-and-programs/research-and-development-tax-incentive',
    deadlineDate: null,
    status: 'ACTIVE',
    isActive: true,
    confidenceScore: 94,
    sourceSnippets: ['Australian Taxation Office R&D Tax Incentive Guide'],
    discoveredVia: 'SYSTEM_SEED',
    lastVerifiedAt: new Date('2026-01-01'),
  },
  {
    slug: 'ca-sred-nrc-irap',
    countryCode: 'CA',
    grantName: 'SR&ED Tax Credits & NRC IRAP Funding',
    providerAgency: 'CRA & National Research Council Canada',
    fundingType: 'R_AND_D_CREDIT',
    currency: 'CAD',
    maxAmountFormatted: '35% Federal SR&ED Refundable Credit + Up to 80% Salary Coverage (IRAP)',
    maxFundingAmount: 200000,
    matchRatePercentage: 35,
    isRepayable: false,
    minEmployees: 1,
    maxEmployees: 500,
    maxTradingMonths: 120,
    stageFit: 'Scientific Research, Experimental Development & Scale',
    turnaroundLabel: 'Annual Corporate T2 Filing / Ongoing IRAP Advisor',
    turnaroundSpeed: 'STANDARD_6_TO_8_WEEKS',
    leoThreeQuoteEnforced: false,
    compilerTemplateId: 'STANDARD_BUSINESS_PLAN',
    summary:
      'Canada’s flagship federal R&D tax credit delivering up to 35% cash refunds on qualifying innovation, paired with NRC IRAP wage co-funding.',
    descriptionMarkdown:
      'The Scientific Research and Experimental Development (SR&ED) program allows Canadian-Controlled Private Corporations (CCPCs) to earn an investment tax credit of 35% up to $3M of qualified expenditures, 100% refundable as cash for pre-profit innovators.',
    eligibleCosts: [
      'Salaries and wages of employees directly engaged in SR&ED projects',
      'Direct Canadian subcontractor expenditures for scientific research',
      'Materials consumed or transformed in the course of experiments',
      'Overhead proxy calculations associated with R&D operations',
    ],
    ineligibleCosts: [
      'Commercial production and distribution activities',
      'Quality control and standard product testing',
      'Market research, sales promotion, and customer acquisition campaigns',
      'Routine software maintenance and cosmetic front-end redesigns',
    ],
    applicationRequirements: [
      'Canadian-Controlled Private Corporation (CCPC) status',
      'Form T661 submitted with the corporate T2 tax return within 18 months of FY end',
      'Detailed project documentation demonstrating scientific/technological advancement',
    ],
    disqualificationRedFlags: [
      'Failing the 5-question test for technological advancement or uncertainty',
      'Missing the strict 18-month statutory filing deadline (no extensions)',
      'Foreign ownership exceeding 50% stripping CCPC refundable status',
    ],
    reimbursementWarning:
      'IRAP requires pre-approval by an Industrial Technology Advisor (ITA) before incurring R&D payroll expenses.',
    eligibilityRulesJsonb: {
      requiresCanadianCCPC: true,
      statutoryDeadlineMonths: 18,
    },
    officialUrl: 'https://nrc.canada.ca/en/support-technology-innovation',
    deadlineDate: null,
    status: 'ACTIVE',
    isActive: true,
    confidenceScore: 94,
    sourceSnippets: ['CRA SR&ED General Guidelines'],
    discoveredVia: 'SYSTEM_SEED',
    lastVerifiedAt: new Date('2026-01-01'),
  },
];

/**
 * Returns deterministic in-memory GrantDirectoryRecord objects.
 * Used for zero-latency instant rendering and reliable offline/unseeded fallback.
 */
export function getFallbackGrantRecords(): GrantDirectoryRecord[] {
  const fallbackDate = new Date('2026-01-01T00:00:00.000Z');
  return FULL_DEFAULT_GRANTS_CATALOG.map((g, idx) => ({
    ...g,
    id: `seed-grant-${idx + 1}-${g.slug}`,
    createdAt: fallbackDate,
    updatedAt: fallbackDate,
  })) as GrantDirectoryRecord[];
}

let seedPromise: Promise<void> | null = null;

/**
 * Idempotently checks if the grants_directory table has records in PostgreSQL.
 * If empty or missing core schemes, automatically seeds all default grants.
 */
export async function ensureDefaultGrantsSeededInDb(): Promise<void> {
  if (seedPromise) {
    return seedPromise;
  }

  seedPromise = (async () => {
    try {
      await ensureDatabaseSchemaSynced();

      // Fetch existing slugs to insert any missing seeds idempotently
      const existing = await db
        .select({ slug: grantsDirectory.slug })
        .from(grantsDirectory);

      const existingSlugs = new Set(existing.map((e) => e.slug));

      for (const grant of FULL_DEFAULT_GRANTS_CATALOG) {
        if (!existingSlugs.has(grant.slug)) {
          try {
            await db
              .insert(grantsDirectory)
              .values(grant)
              .onConflictDoNothing({ target: grantsDirectory.slug });
          } catch (insertErr) {
            console.warn(`[GrantsSeed] Failed to insert seed grant ${grant.slug}:`, insertErr);
          }
        }
      }
    } catch (err) {
      // Non-fatal warning so client fallbacks can kick in cleanly
      console.warn('[GrantsSeed] Non-fatal ensureDefaultGrantsSeededInDb error:', err);
    } finally {
      // Clear promise so it can be retried on next request if it encountered transient network issue
      seedPromise = null;
    }
  })();

  return seedPromise;
}
