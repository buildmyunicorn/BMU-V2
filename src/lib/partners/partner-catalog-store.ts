import type {
  WarmIntroQuestionField,
  PartnerCheckoutAddonField,
} from '@/db/schema';

export type { PartnerCheckoutAddonField };

export type PartnerSlotKey =
  | 'OPS_STEP_1_INCORPORATION'
  | 'OPS_STEP_2_DOMAIN'
  | 'OPS_STEP_2_EMAIL'
  | 'OPS_STEP_3_BANKING'
  | 'OPS_STEP_4_ACCOUNTING'
  | 'OPS_STEP_4_PAYROLL'
  | 'OPS_STEP_5_INSURANCE'
  | 'OPS_STEP_6_LEGAL_IP'
  | 'MOD_A_STEP_3_DOMAIN_CHECK'
  | 'MOD_C_STEP_4_SURVEY_BOOST'
  | 'MOD_D_STEP_2_ECOMMERCE_NO_CODE'
  | 'MOD_D_STEP_3_TECH_AGENCY_QUOTES'
  | 'MOD_E_STEP_2_BRANDING_DOMAINS'
  | 'MOD_J_ACCOUNTING_BANKING'
  | 'MOD_K_GRANT_WRITERS_RND';

export type PartnerCountryScope = 'ALL' | 'IE' | 'GB';
export type PartnerActionType =
  | 'AFFILIATE_LINK'
  | 'WARM_INTRO_MODAL'
  | 'PAID_STRIPE_CONCIERGE';
export type ReferralLeadStatus =
  | 'CLICKED'
  | 'INTRO_SENT'
  | 'PARTNER_CONTACTED'
  | 'CONVERTED_BOUNTY_DUE'
  | 'BOUNTY_PAID'
  | 'ARCHIVED';

export type QuoteSupplierCategory =
  | 'DEV_AGENCY'
  | 'NO_CODE_STUDIO'
  | 'EQUIPMENT_SUPPLIER'
  | 'BRANDING_DESIGN'
  | 'OTHER';

export interface PartnerOfferRecord {
  id: string;
  slug: string;
  slotKey: PartnerSlotKey;
  name: string;
  logoEmoji: string;
  category: string;
  headline: string;
  perkDescription: string;
  badgeText: string;
  promoCode?: string | null;
  countryScope: PartnerCountryScope;
  actionType: PartnerActionType;
  actionLabel: string;
  referralUrl: string;
  trustFactor: string;
  warmIntroRecipientEmail?: string | null;
  warmIntroQuestionsJson: WarmIntroQuestionField[];
  checkoutPriceAmount?: number | null;
  checkoutCurrency?: string | null;
  checkoutAddonsJson?: PartnerCheckoutAddonField[];
  commissionBountySummary?: string | null;
  partnerContactNotes?: string | null;
  // 3-Quote Concierge fields:
  isSupplierPartner?: boolean;
  supplierCategory?: QuoteSupplierCategory | null;
  dispatchEmail?: string | null;
  monthlyRfpCap?: number;
  rfpsDispatchedThisMonth?: number;
  lastRfpDispatchedAt?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerReferralEventRecord {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerSlug: string;
  slotKey: PartnerSlotKey;
  eventType: 'AFFILIATE_CLICK' | 'WARM_INTRO_LEAD' | 'PAID_CONCIERGE_ORDER';
  planId?: string | null;
  planTitle?: string | null;
  founderName?: string | null;
  founderEmail?: string | null;
  countryCode: string;
  selectedDomain?: string | null;
  destinationUrl?: string | null;
  intakeAnswersJson: Record<string, string>;
  leadStatus: ReferralLeadStatus;
  estimatedBountyAmount?: string | null;
  adminNotes?: string | null;
  createdAt: string;
}

export interface PartnerSlotDefinition {
  slotKey: PartnerSlotKey;
  moduleGroup: 'MODULE_G_LAUNCHPAD' | 'CONTEXTUAL_MODULES';
  moduleBadge: string;
  stepNumberLabel: string;
  title: string;
  whereItAppears: string;
  monetizationTip: string;
  defaultWarmIntroQuestions: WarmIntroQuestionField[];
}

export const PARTNER_SLOT_DEFINITIONS: PartnerSlotDefinition[] = [
  {
    slotKey: 'OPS_STEP_1_INCORPORATION',
    moduleGroup: 'MODULE_G_LAUNCHPAD',
    moduleBadge: 'Module G • Step 1',
    stepNumberLabel: 'Step 1: Legal Entity & Incorporation',
    title: 'Company Registration & Secretarial Partners',
    whereItAppears:
      'Shown in Module G Step 1 when a founder selects "Help Me Set This Up" for forming their LTD / DAC / UK Company.',
    monetizationTip:
      'Best for Formation Concierges (€50–€150 CPA per formed LTD) alongside official CRO / Companies House links.',
    defaultWarmIntroQuestions: [
      {
        id: 'proposed_company_name_1',
        label: '1st Choice Proposed Company Name',
        placeholder: 'e.g. Acme Innovations Technologies Limited',
        type: 'TEXT',
        required: true,
      },
      {
        id: 'proposed_company_name_2',
        label: '2nd Choice Backup Name (In case registry flags name similarity)',
        placeholder: 'e.g. Acme Labs Ireland Limited',
        type: 'TEXT',
        required: false,
      },
      {
        id: 'director_shareholder_structure',
        label: 'Proposed Director & Shareholder Setup',
        type: 'SELECT',
        options: [
          'Solo Founder (1 Director / 100% Shareholder)',
          '2 Co-Founders (Equal or Custom Equity Split)',
          '3+ Co-Founders / Early Angel Shareholders',
          'Holding Company + Trading Subsidiary Structure',
          'Not sure yet — need formation advice',
        ],
        required: true,
      },
      {
        id: 'eea_uk_resident_director',
        label:
          'Do you have at least one EEA/UK resident director? (Required in Ireland or needs a Sec. 137 Bond)',
        type: 'SELECT',
        options: [
          'Yes — At least one director resides in the EEA / UK',
          'No — We need a Non-Resident Director Section 137 Bond (IE)',
          'Not sure — please advise on residency rules',
        ],
        required: true,
      },
      {
        id: 'formation_package_scope',
        label: 'What services do you want included in the setup quote?',
        type: 'SELECT',
        options: [
          'Full Fast-Track Formation + Tax / Revenue / Corporation Tax Registration',
          'Formation + Virtual Registered Office Address Facility',
          'Basic Digital Incorporation Only',
          'Formation + Co-Founder Shareholders Agreement & IP Assignment',
        ],
        required: true,
      },
    ],
  },
  {
    slotKey: 'OPS_STEP_2_DOMAIN',
    moduleGroup: 'MODULE_G_LAUNCHPAD',
    moduleBadge: 'Module G • Step 2A',
    stepNumberLabel: 'Step 2A: Domain Name Registrars',
    title: 'Domain Registrars (.ie / .co.uk / .com)',
    whereItAppears:
      'Shown in Module G Step 2 directly inside the Live Domain Availability Checker when a founder checks and claims their domain.',
    monetizationTip:
      'Supports dynamic {domain} macro in referralUrl so clicking "Claim Domain" passes their exact searched domain to the registrar.',
    defaultWarmIntroQuestions: [
      {
        id: 'desired_domain_name',
        label: 'Target Domain Name(s) to Register',
        placeholder: 'e.g. startuppreflight.ie / startuppreflight.com',
        type: 'TEXT',
        required: true,
      },
      {
        id: 'ie_domain_proof_status',
        label: 'For .ie Domains: Do you have a CRO Number or RBN yet?',
        type: 'SELECT',
        options: [
          'Yes — Have CRO / RBN number ready',
          'Not yet — Registering as a discretionary Irish applicant',
          'Registering .com / .co.uk / .io only',
        ],
        required: true,
      },
    ],
  },
  {
    slotKey: 'OPS_STEP_2_EMAIL',
    moduleGroup: 'MODULE_G_LAUNCHPAD',
    moduleBadge: 'Module G • Step 2B',
    stepNumberLabel: 'Step 2B: Official Business Email',
    title: 'Official @company Email & Cloud Workspace',
    whereItAppears:
      'Shown in Module G Step 2 (especially highlighted when our detector catches a founder using @gmail.com or @hotmail.com).',
    monetizationTip:
      'High-converting self-serve affiliate slot (Google Workspace / Microsoft 365 affiliate program pays ~$15–$30 per seat).',
    defaultWarmIntroQuestions: [
      {
        id: 'email_domain',
        label: 'Domain for Your Official Email',
        placeholder: 'e.g. @yourcompany.ie',
        type: 'TEXT',
        required: true,
      },
      {
        id: 'seat_count',
        label: 'How many team email inboxes do you need initially?',
        type: 'SELECT',
        options: ['1 Inbox (Solo Founder)', '2–3 Inboxes (Co-Founders)', '4–10 Inboxes (Early Team)'],
        required: true,
      },
    ],
  },
  {
    slotKey: 'OPS_STEP_3_BANKING',
    moduleGroup: 'MODULE_G_LAUNCHPAD',
    moduleBadge: 'Module G • Step 3',
    stepNumberLabel: 'Step 3: Dedicated Business Banking',
    title: 'Digital Neobanks & Pillar Commercial Banks',
    whereItAppears:
      'Shown in Module G Step 3 when a founder needs to open their dedicated corporate IBAN/Account for trading and grant drawdowns.',
    monetizationTip:
      'Top bounty earner: Digital business banks (Revolut Business, Tide, Monzo, Wise) typically pay €50–€150 CPA per funded business account.',
    defaultWarmIntroQuestions: [
      {
        id: 'entity_incorporated_yet',
        label: 'Is your company already incorporated with a CRO / Companies House number?',
        type: 'SELECT',
        options: [
          'Yes — Incorporated and ready to open account immediately',
          'In progress — Incorporating within the next 14–30 days',
          'Operating as a Sole Trader',
        ],
        required: true,
      },
      {
        id: 'banking_priority',
        label: 'Primary Banking Requirement',
        type: 'SELECT',
        options: [
          'Fast Digital IBAN for Grant Drawdowns & Stripe Payouts',
          'Multi-Currency (EUR + GBP + USD) International Trading',
          'Traditional Commercial Relationship Manager & Credit/Loan Facility',
        ],
        required: true,
      },
    ],
  },
  {
    slotKey: 'OPS_STEP_4_ACCOUNTING',
    moduleGroup: 'MODULE_G_LAUNCHPAD',
    moduleBadge: 'Module G • Step 4A',
    stepNumberLabel: 'Step 4A: Bookkeeping & Chartered Accountants',
    title: 'Cloud Accounting Software & Startup Accountants',
    whereItAppears:
      'Shown in Module G Step 4 alongside the VAT Registration & Bookkeeping configuration.',
    monetizationTip:
      'Pair a self-serve software perk (Xero/QuickBooks/Surf) with a Warm Intro to a Startup Accountancy Firm (€100–€250 lead bounty).',
    defaultWarmIntroQuestions: [
      {
        id: 'accounting_entity_status',
        label: 'Current Entity & Trading Status',
        type: 'SELECT',
        options: [
          'Newly Incorporated LTD (Pre-Revenue)',
          'Trading LTD (Active Revenue)',
          'Pre-Incorporation / Sole Trader transitioning to LTD',
        ],
        required: true,
      },
      {
        id: 'accountant_help_needed',
        label: 'What do you need an accountant to handle?',
        type: 'SELECT',
        options: [
          'Full Startup Package (Formation, VAT, Annual CRO/CH & Corp Tax Returns)',
          'Grant Financial Sign-Off (LEO / Enterprise Ireland / Innovate UK / SEIS)',
          'R&D Tax Credit Claim & Technical Accounting',
          'Monthly Bookkeeping & Cloud Ledger Setup (Xero / QuickBooks)',
        ],
        required: true,
      },
      {
        id: 'estimated_year1_turnover',
        label: 'Projected Year 1 Turnover Bracket',
        type: 'SELECT',
        options: ['Pre-Revenue / Under €50k', '€50k – €250k', '€250k – €1M+'],
        required: true,
      },
    ],
  },
  {
    slotKey: 'OPS_STEP_4_PAYROLL',
    moduleGroup: 'MODULE_G_LAUNCHPAD',
    moduleBadge: 'Module G • Step 4B',
    stepNumberLabel: 'Step 4B: Payroll & PRSI/NIC Compliance',
    title: 'Payroll Software & PAYE/RTI Bureaus',
    whereItAppears:
      'Shown in Module G Step 4 for founders setting up director salary or hiring Year 1 staff.',
    monetizationTip:
      'Ideal for BrightPay, Sage, CollSoft, or outsourced payroll bureaus.',
    defaultWarmIntroQuestions: [
      {
        id: 'employee_headcount_y1',
        label: 'Planned Year 1 Payroll Headcount (Including Paid Directors)',
        type: 'SELECT',
        options: ['1–2 Paid Directors Only', '3–5 Employees', '6+ Employees'],
        required: true,
      },
    ],
  },
  {
    slotKey: 'OPS_STEP_5_INSURANCE',
    moduleGroup: 'MODULE_G_LAUNCHPAD',
    moduleBadge: 'Module G • Step 5',
    stepNumberLabel: 'Step 5: Statutory Startup Insurance',
    title: 'Commercial Insurance Brokers (PL / EL / PI / Cyber)',
    whereItAppears:
      'Shown in Module G Step 5 alongside the Public Liability, Employer Liability & Professional Indemnity checklist.',
    monetizationTip:
      'Commercial insurance brokers pay strong recurring or upfront intro fees for tech/SaaSPI and product liability policies.',
    defaultWarmIntroQuestions: [
      {
        id: 'insurance_lines_needed',
        label: 'Which insurance covers do you need quoted?',
        type: 'SELECT',
        options: [
          'Professional Indemnity + Cyber (SaaS / Tech / B2B Service)',
          'Public Liability + Employers Liability (Premises / Events / Staff)',
          'Product Liability + Public Liability (Physical Goods / Food / Hardware)',
          'Full Grant-Compliant Startup Package (All Core Covers)',
        ],
        required: true,
      },
      {
        id: 'policy_start_timeline',
        label: 'When do you need the policy active?',
        type: 'SELECT',
        options: [
          'Immediately (Required for Grant Drawdown or Client Contract)',
          'Within 30 Days (Before First Sale / Launch)',
          'Just gathering quotes for Business Plan financial model',
        ],
        required: true,
      },
    ],
  },
  {
    slotKey: 'OPS_STEP_6_LEGAL_IP',
    moduleGroup: 'MODULE_G_LAUNCHPAD',
    moduleBadge: 'Module G • Step 6',
    stepNumberLabel: 'Step 6: Baseline Legal, IP & GDPR',
    title: 'Startup Legal Platforms, Solicitors & IP Attorneys',
    whereItAppears:
      'Shown in Module G Step 6 alongside Founder IP Assignment, Co-Founder Vesting, and GDPR Privacy compliance.',
    monetizationTip:
      'Combine self-serve platforms (SeedLegals / Termly) with Warm Intros to Startup Law Firms & Patent/Trademark Attorneys.',
    defaultWarmIntroQuestions: [
      {
        id: 'legal_matter_type',
        label: 'Primary Legal or IP Requirement',
        type: 'SELECT',
        options: [
          'Founder IP Assignment & Co-Founder Shareholders Agreement',
          'Commercial SaaS Terms of Service, SLA & GDPR Privacy Pack',
          'Patent / Trademark Registration & IP Protection',
          'Angel / SEIS / Enterprise Ireland Investment Term Sheet Review',
        ],
        required: true,
      },
      {
        id: 'legal_budget_stage',
        label: 'Current Funding Stage',
        type: 'SELECT',
        options: [
          'Bootstrapped / Self-Funded (Looking for fixed-fee startup package)',
          'Grant-Backed (LEO / Enterprise Ireland / Innovate UK)',
          'Raising Pre-Seed / Seed Round',
        ],
        required: true,
      },
    ],
  },
  // Contextual Slots Across Other Modules
  {
    slotKey: 'MOD_A_STEP_3_DOMAIN_CHECK',
    moduleGroup: 'CONTEXTUAL_MODULES',
    moduleBadge: 'Module A • Step 3',
    stepNumberLabel: 'Module A: Concept Canvas Domain Hook',
    title: 'Early Ideation Domain Availability Hook',
    whereItAppears: 'Shown in Module A when a founder names their concept.',
    monetizationTip: 'Captures impulse domain purchases even on Free Hook plans.',
    defaultWarmIntroQuestions: [],
  },
  {
    slotKey: 'MOD_C_STEP_4_SURVEY_BOOST',
    moduleGroup: 'CONTEXTUAL_MODULES',
    moduleBadge: 'Module C • Step 4',
    stepNumberLabel: 'Module C: Survey & Waitlist Distribution',
    title: 'Survey Panel & Waitlist Tools',
    whereItAppears: 'Shown in Module C Outreach & Distribution step.',
    monetizationTip: 'B2B Respondent recruitment tools & landing page perks.',
    defaultWarmIntroQuestions: [],
  },
  {
    slotKey: 'MOD_D_STEP_2_ECOMMERCE_NO_CODE',
    moduleGroup: 'CONTEXTUAL_MODULES',
    moduleBadge: 'Module D • Step 2',
    stepNumberLabel: 'Module D: Build vs Buy & E-Commerce Stack',
    title: 'Shopify, Stripe & No-Code Tech Perks',
    whereItAppears: 'Shown in Module D Channel & Build Tier selection.',
    monetizationTip: 'Shopify affiliate bounty ($150/merchant) + cloud hosting credits.',
    defaultWarmIntroQuestions: [],
  },
  {
    slotKey: 'MOD_D_STEP_3_TECH_AGENCY_QUOTES',
    moduleGroup: 'CONTEXTUAL_MODULES',
    moduleBadge: 'Module D • Step 3',
    stepNumberLabel: 'Module D: 3-Quote Dev Agency Concierge',
    title: 'Vetted MVP Dev Agencies (IE LEO 3-Quote Rule)',
    whereItAppears:
      'Shown in Module D when founders need 3 written development quotes for LEO Priming / Grow Digital / Feasibility grants.',
    monetizationTip: 'High-ticket RFP lead fees (€100/lead or 5%–10% project finder fee).',
    defaultWarmIntroQuestions: [
      {
        id: 'mvp_build_scope',
        label: 'Summary of MVP / Software Build Scope',
        placeholder: 'e.g. Web SaaS portal + Stripe billing + AI workflow...',
        type: 'TEXT',
        required: true,
      },
      {
        id: 'grant_3_quote_needed',
        label: 'Do you need formal LEO / Enterprise Ireland 3-Quote documentation?',
        type: 'SELECT',
        options: [
          'Yes — Need formal written quote for State Grant Appendix C',
          'No — Private commercial build quote only',
        ],
        required: true,
      },
    ],
  },
  {
    slotKey: 'MOD_E_STEP_2_BRANDING_DOMAINS',
    moduleGroup: 'CONTEXTUAL_MODULES',
    moduleBadge: 'Module E • Step 2',
    stepNumberLabel: 'Module E: Equipment & Supplier 3-Quote Concierge',
    title: 'Commercial Equipment, Fit-Out & Packaging Suppliers',
    whereItAppears: 'Shown in Module E Premises & Equipment Schedule.',
    monetizationTip: 'Connects founders with 3-quote compliant equipment vendors.',
    defaultWarmIntroQuestions: [],
  },
  {
    slotKey: 'MOD_J_ACCOUNTING_BANKING',
    moduleGroup: 'CONTEXTUAL_MODULES',
    moduleBadge: 'Module J • Step 3',
    stepNumberLabel: 'Module J: Financial Model & Tax Compliance',
    title: 'CFO Advisory & Cloud Accounting Sync',
    whereItAppears: 'Shown in Module J Financial Builder.',
    monetizationTip: 'Fractional CFO & audit sign-off referrals.',
    defaultWarmIntroQuestions: [],
  },
  {
    slotKey: 'MOD_K_GRANT_WRITERS_RND',
    moduleGroup: 'CONTEXTUAL_MODULES',
    moduleBadge: 'Module K • Step 4',
    stepNumberLabel: 'Module K: R&D Tax Credits & Grant Consultants',
    title: 'R&D Tax Credit Specialists & SEIS/EIS Advisors',
    whereItAppears: 'Shown in Module K Grants & Investor Tax Relief Hub.',
    monetizationTip: 'R&D tax credit specialists pay 10%–20% referral share on successful claims.',
    defaultWarmIntroQuestions: [
      {
        id: 'target_grant_or_relief',
        label: 'Which Grant or Tax Relief are you applying for?',
        placeholder: 'e.g. Revenue R&D Tax Credit / Enterprise Ireland PSSF / Innovate UK / HMRC SEIS',
        type: 'TEXT',
        required: true,
      },
    ],
  },
];

export function getSlotDefinition(slotKey: PartnerSlotKey): PartnerSlotDefinition {
  return (
    PARTNER_SLOT_DEFINITIONS.find((s) => s.slotKey === slotKey) ||
    PARTNER_SLOT_DEFINITIONS[0]
  );
}

export function getWarmIntroQuestionsForPartner(
  partner: PartnerOfferRecord
): WarmIntroQuestionField[] {
  if (
    Array.isArray(partner.warmIntroQuestionsJson) &&
    partner.warmIntroQuestionsJson.length > 0
  ) {
    return partner.warmIntroQuestionsJson;
  }
  return getSlotDefinition(partner.slotKey).defaultWarmIntroQuestions;
}

const NOW_ISO = '2026-11-01T10:00:00.000Z';

export const DEFAULT_PARTNER_OFFERS: PartnerOfferRecord[] = [
  // =========================================================================
  // STEP 1: INCORPORATION & COMPANY SECRETARIAL (PAID STRIPE CONCIERGE)
  // =========================================================================
  {
    id: 'partner-company-bureau-ie',
    slug: 'company-bureau-formations',
    slotKey: 'OPS_STEP_1_INCORPORATION',
    name: 'Company Bureau Formations (Concierge)',
    logoEmoji: '⚡',
    category: 'Paid Stripe Incorporation Concierge',
    headline: 'Done-For-You LTD Incorporation + Revenue Tax Registration & Company Seal',
    perkDescription:
      'Complete your company setup questionnaire here, pay the €150 flat formation fee via Stripe, and our partner formation specialists will file your CRO A1 / Companies House incorporation, constitution, and share certificates within 3–5 business days.',
    badgeText: '€150 Flat Fee • Stripe Checkout',
    promoCode: 'PREFLIGHT-LTD',
    countryScope: 'ALL',
    actionType: 'PAID_STRIPE_CONCIERGE',
    actionLabel: 'Incorporate My Company — €150',
    referralUrl: 'https://www.companyformations.ie/?utm_source=startuppreflight',
    trustFactor: 'Over 30,000 entities incorporated across Ireland & the UK • Includes €50 CRO statutory filing fee',
    warmIntroRecipientEmail: 'formations@companyformations.ie',
    warmIntroQuestionsJson: getSlotDefinition('OPS_STEP_1_INCORPORATION')
      .defaultWarmIntroQuestions,
    checkoutPriceAmount: 150,
    checkoutCurrency: 'EUR',
    checkoutAddonsJson: [
      {
        id: 'addon-virtual-registered-office',
        label: 'Virtual Registered Office Address (12 Months)',
        description:
          'Official commercial Dublin / London Registered Office address + statutory mail scanning so your personal home address stays off the public register.',
        priceAmount: 150,
      },
      {
        id: 'addon-company-secretary-service',
        label: 'Named Corporate Company Secretary & Annual Compliance',
        description:
          'Acts as your statutory named Company Secretary, maintains your Register of Members/Directors, and prepares your first Annual Return (B1).',
        priceAmount: 95,
      },
      {
        id: 'addon-rbo-beneficial-ownership',
        label: 'Done-For-You RBO (Register of Beneficial Ownership) Filing',
        description:
          'Mandatory statutory beneficial ownership declaration filed on your behalf after CRO incorporation to avoid late filing penalties.',
        priceAmount: 75,
      },
    ],
    commissionBountySummary: '€150 collected upfront via Stripe (€60 platform margin / €90 partner fulfillment)',
    partnerContactNotes: 'Paid incorporation orders & answers auto-dispatched to New Business Formation Desk.',
    sortOrder: 1,
    isActive: true,
    createdAt: NOW_ISO,
    updatedAt: NOW_ISO,
  },
  {
    id: 'partner-cro-direct',
    slug: 'cro-core-ireland',
    slotKey: 'OPS_STEP_1_INCORPORATION',
    name: 'CRO Core Portal (Ireland Official)',
    logoEmoji: '🇮🇪',
    category: 'Official State Registry (Self-File)',
    headline: 'Self-File Directly with the Irish Companies Registration Office',
    perkDescription:
      'Standard €50 statutory filing fee via the A1 Online system on CORE. Requires you to draft your own constitution, arrange a separate company secretary, and sign via MyGovID / ROS.',
    badgeText: 'DIY State Portal (€50)',
    promoCode: null,
    countryScope: 'IE',
    actionType: 'AFFILIATE_LINK',
    actionLabel: 'Open Official CRO CORE Portal',
    referralUrl: 'https://core.cro.ie',
    trustFactor: 'Statutory Registry for Irish LTD & DAC Entities',
    warmIntroRecipientEmail: null,
    warmIntroQuestionsJson: [],
    checkoutPriceAmount: null,
    checkoutCurrency: 'EUR',
    checkoutAddonsJson: [],
    commissionBountySummary: 'Official statutory resource (Non-monetized trust builder)',
    partnerContactNotes: 'Government portal link.',
    sortOrder: 2,
    isActive: true,
    createdAt: NOW_ISO,
    updatedAt: NOW_ISO,
  },
  {
    id: 'partner-ch-direct',
    slug: 'companies-house-uk',
    slotKey: 'OPS_STEP_1_INCORPORATION',
    name: 'Companies House (UK Official)',
    logoEmoji: '🇬🇧',
    category: 'Official State Registry (Self-File)',
    headline: 'Incorporate Directly Online with UK Companies House',
    perkDescription:
      'Direct digital incorporation for £50. Standard UK Private Limited by Shares (LTD) incorporation completes in 24–48 hours with model Articles of Association.',
    badgeText: 'DIY GOV.UK Portal (£50)',
    promoCode: null,
    countryScope: 'GB',
    actionType: 'AFFILIATE_LINK',
    actionLabel: 'Open GOV.UK Incorporation',
    referralUrl: 'https://www.gov.uk/limited-company-formation/register-your-company',
    trustFactor: 'Statutory Registry for UK LTD Entities',
    warmIntroRecipientEmail: null,
    warmIntroQuestionsJson: [],
    checkoutPriceAmount: null,
    checkoutCurrency: 'GBP',
    checkoutAddonsJson: [],
    commissionBountySummary: 'Official statutory resource (Non-monetized trust builder)',
    partnerContactNotes: 'UK Government portal link.',
    sortOrder: 3,
    isActive: true,
    createdAt: NOW_ISO,
    updatedAt: NOW_ISO,
  },

  // =========================================================================
  // STEP 2A: DOMAIN REGISTRARS
  // =========================================================================
  {
    id: 'partner-blacknight-domains',
    slug: 'blacknight-domains',
    slotKey: 'OPS_STEP_2_DOMAIN',
    name: 'Blacknight Solutions (.ie / .com / .co.uk)',
    logoEmoji: '🌐',
    category: 'Accredited Domain Registrar',
    headline: 'Claim Your .ie, .co.uk or .com Domain with Instant DNS Setup',
    perkDescription:
      'Ireland’s #1 accredited .ie registrar. Fast-tracks .ie domain verification using your CRO number, RBN, or Startup Preflight business plan summary.',
    badgeText: 'Founder Domain Perk',
    promoCode: 'PREFLIGHTDNS',
    countryScope: 'ALL',
    actionType: 'AFFILIATE_LINK',
    actionLabel: 'Claim Domain on Blacknight',
    referralUrl: 'https://www.blacknight.com/domain-registration/?domain={domain}&utm_source=startuppreflight&subid={planId}',
    trustFactor: 'ICANN & .IE Domain Registry Accredited Registrar',
    warmIntroRecipientEmail: null,
    warmIntroQuestionsJson: [],
    commissionBountySummary: '25% affiliate commission on domain + hosting bundles',
    partnerContactNotes: 'Passes {domain} and {planId} dynamically.',
    sortOrder: 1,
    isActive: true,
    createdAt: NOW_ISO,
    updatedAt: NOW_ISO,
  },
  {
    id: 'partner-namecheap-domains',
    slug: 'namecheap-domains',
    slotKey: 'OPS_STEP_2_DOMAIN',
    name: 'Namecheap (.com / .co.uk / .io)',
    logoEmoji: '🚀',
    category: 'Global Domain Registrar',
    headline: 'Instant .com, .co.uk & .io Registration + Free Lifetime WhoisGuard',
    perkDescription:
      'Zero-markup domain registration with free domain privacy protection, DNSSEC, and 1-click Google Workspace MX record auto-configuration.',
    badgeText: 'Free Privacy Protection',
    promoCode: 'NEWCOM598',
    countryScope: 'ALL',
    actionType: 'AFFILIATE_LINK',
    actionLabel: 'Claim Domain on Namecheap',
    referralUrl: 'https://www.namecheap.com/domains/registration/results/?domain={domain}&utm_source=startuppreflight&subid={planId}',
    trustFactor: 'Over 17 million domains under management',
    warmIntroRecipientEmail: null,
    warmIntroQuestionsJson: [],
    commissionBountySummary: '20%–35% CPA via Impact Radius',
    partnerContactNotes: 'Supports direct ?domain={domain} query param.',
    sortOrder: 2,
    isActive: true,
    createdAt: NOW_ISO,
    updatedAt: NOW_ISO,
  },

  // =========================================================================
  // STEP 2B: OFFICIAL BUSINESS EMAIL
  // =========================================================================
  {
    id: 'partner-google-workspace',
    slug: 'google-workspace-startups',
    slotKey: 'OPS_STEP_2_EMAIL',
    name: 'Google Workspace for Startups',
    logoEmoji: '📧',
    category: 'Official Business Email & Cloud Drive',
    headline: 'Set Up Official founder@yourcompany.com Gmail, Calendar & Drive',
    perkDescription:
      'Replace consumer @gmail.com addresses before applying for LEO, Enterprise Ireland, or UK Start Up Loans. Includes 14-day free trial + 15% off Business Starter/Standard.',
    badgeText: 'Recommended by Grant Assessors',
    promoCode: 'WORKSPACE15',
    countryScope: 'ALL',
    actionType: 'AFFILIATE_LINK',
    actionLabel: 'Activate Google Workspace Perk',
    referralUrl: 'https://workspace.google.com/?utm_source=startuppreflight&subid={planId}',
    trustFactor: '99.9% SLA • Instant MX verification with Blacknight & Namecheap',
    warmIntroRecipientEmail: null,
    warmIntroQuestionsJson: [],
    commissionBountySummary: '€23 CPA per paid Google Workspace seat',
    partnerContactNotes: 'Google Workspace Referral Program.',
    sortOrder: 1,
    isActive: true,
    createdAt: NOW_ISO,
    updatedAt: NOW_ISO,
  },
  {
    id: 'partner-microsoft-365',
    slug: 'microsoft-365-business',
    slotKey: 'OPS_STEP_2_EMAIL',
    name: 'Microsoft 365 Business Basic / Standard',
    logoEmoji: '💼',
    category: 'Enterprise Email, Teams & Office Suite',
    headline: 'Custom @yourcompany.com Outlook Email + Microsoft Teams & Excel',
    perkDescription:
      'Ideal for B2B and enterprise-facing startups. Includes custom domain Exchange email, 1TB OneDrive storage, and full Excel/Word compatibility.',
    badgeText: '1 Month Free Trial',
    promoCode: null,
    countryScope: 'ALL',
    actionType: 'AFFILIATE_LINK',
    actionLabel: 'Explore Microsoft 365 Business',
    referralUrl: 'https://www.microsoft.com/en-ie/microsoft-365/business?utm_source=startuppreflight',
    trustFactor: 'Enterprise security & GDPR EU data residency',
    warmIntroRecipientEmail: null,
    warmIntroQuestionsJson: [],
    commissionBountySummary: '€15–€30 CPA per business tenant',
    partnerContactNotes: 'Microsoft Business Affiliate.',
    sortOrder: 2,
    isActive: true,
    createdAt: NOW_ISO,
    updatedAt: NOW_ISO,
  },

  // =========================================================================
  // STEP 3: BUSINESS BANKING
  // =========================================================================
  {
    id: 'partner-revolut-business',
    slug: 'revolut-business-account',
    slotKey: 'OPS_STEP_3_BANKING',
    name: 'Revolut Business (IE / UK / EU)',
    logoEmoji: '💳',
    category: 'Fast-Track Digital Business Banking',
    headline: 'Open a Dedicated Corporate IBAN in 24 Hours with Multi-Currency Accounts',
    perkDescription:
      'Hold, receive, and exchange EUR, GBP, and USD at interbank rates. Issued with a dedicated Irish (IE) or UK sort-code/IBAN accepted for grant drawdowns and Stripe payouts.',
    badgeText: 'Fast 24–48hr Digital Approval',
    promoCode: 'PREFLIGHT-REV',
    countryScope: 'ALL',
    actionType: 'AFFILIATE_LINK',
    actionLabel: 'Open Revolut Business Account',
    referralUrl: 'https://www.revolut.com/business/?utm_source=startuppreflight&subid={planId}',
    trustFactor: 'Licensed European Bank (Central Bank of Ireland / FCA Regulated)',
    warmIntroRecipientEmail: null,
    warmIntroQuestionsJson: [],
    commissionBountySummary: '€100 CPA per onboarded KYB-verified LTD account',
    partnerContactNotes: 'Partner network link.',
    sortOrder: 1,
    isActive: true,
    createdAt: NOW_ISO,
    updatedAt: NOW_ISO,
  },
  {
    id: 'partner-tide-uk-banking',
    slug: 'tide-business-uk',
    slotKey: 'OPS_STEP_3_BANKING',
    name: 'Tide Business Banking (UK)',
    logoEmoji: '🌊',
    category: 'UK Startup Business Account',
    headline: 'Free UK Business Bank Account + £75 Cashback for New UK Startups',
    perkDescription:
      'No monthly fees, FSCS-protected UK account provided by ClearBank, instant UK Sort Code & Account Number, and built-in Xero/QuickBooks auto-sync.',
    badgeText: '£75 Founder Cashback Perk',
    promoCode: 'PREFLIGHT75',
    countryScope: 'GB',
    actionType: 'AFFILIATE_LINK',
    actionLabel: 'Claim £75 Tide Startup Offer',
    referralUrl: 'https://www.tide.co/?utm_source=startuppreflight&subid={planId}',
    trustFactor: 'FSCS Protected up to £85,000 via ClearBank',
    warmIntroRecipientEmail: null,
    warmIntroQuestionsJson: [],
    commissionBountySummary: '£90 CPA per approved UK LTD account',
    partnerContactNotes: 'UK-specific neobank partner.',
    sortOrder: 2,
    isActive: true,
    createdAt: NOW_ISO,
    updatedAt: NOW_ISO,
  },
  {
    id: 'partner-aib-boi-startup-desk',
    slug: 'pillar-bank-startup-desk',
    slotKey: 'OPS_STEP_3_BANKING',
    name: 'Pillar Bank Startup Desk (AIB / BOI / Barclays)',
    logoEmoji: '🏛️',
    category: 'Traditional Commercial Banking',
    headline: '2 Years Fee-Free Startup Banking & Dedicated Commercial Relationship Manager',
    perkDescription:
      'Best if you require cash lodgements, SBCI low-cost state loans, or commercial overdraft facilities alongside your LEO / Enterprise Ireland funding.',
    badgeText: '24 Months Fee-Free Startup Tier',
    promoCode: null,
    countryScope: 'ALL',
    actionType: 'AFFILIATE_LINK',
    actionLabel: 'View Startup Pillar Bank Options',
    referralUrl: 'https://aib.ie/business/accounts/start-up-package',
    trustFactor: 'Full-service commercial branch & lending network',
    warmIntroRecipientEmail: null,
    warmIntroQuestionsJson: [],
    commissionBountySummary: 'Standard banking directory link',
    partnerContactNotes: 'Direct startup package page.',
    sortOrder: 3,
    isActive: true,
    createdAt: NOW_ISO,
    updatedAt: NOW_ISO,
  },

  // =========================================================================
  // STEP 4: BOOKKEEPING, VAT & PAYROLL
  // =========================================================================
  {
    id: 'partner-xero-accounting',
    slug: 'xero-cloud-accounting',
    slotKey: 'OPS_STEP_4_ACCOUNTING',
    name: 'Xero Cloud Accounting for Startups',
    logoEmoji: '📊',
    category: 'Cloud Bookkeeping & VAT Ledger',
    headline: '90% Off Xero for 6 Months — Automated Bank Feeds, Invoicing & VAT Returns',
    perkDescription:
      'Connects directly to Revolut, AIB, BOI, Tide, and Stripe. Keeps every grant-eligible receipt tagged separately so LEO and Innovate UK claim audits take minutes.',
    badgeText: '90% Off for 6 Months',
    promoCode: 'XERO90SPF',
    countryScope: 'ALL',
    actionType: 'AFFILIATE_LINK',
    actionLabel: 'Claim 90% Off Xero Perk',
    referralUrl: 'https://www.xero.com/ie/signup/?utm_source=startuppreflight&subid={planId}',
    trustFactor: 'Revenue ROS & HMRC Making Tax Digital (MTD) Compliant',
    warmIntroRecipientEmail: null,
    warmIntroQuestionsJson: [],
    commissionBountySummary: '€80 CPA per subscribed organization',
    partnerContactNotes: 'Xero Ecosystem Partner.',
    sortOrder: 1,
    isActive: true,
    createdAt: NOW_ISO,
    updatedAt: NOW_ISO,
  },
  {
    id: 'partner-chartered-startup-accountant-intro',
    slug: 'startup-accountant-warm-intro',
    slotKey: 'OPS_STEP_4_ACCOUNTING',
    name: 'Preflight Vetted Startup Accountant Panel (IE & UK)',
    logoEmoji: '🤝',
    category: 'Chartered Accountants & Tax Advisors',
    headline: 'Free 20-Min Startup Tax, VAT & Grant Audit Consultation',
    perkDescription:
      'Get matched with a startup-specialist Chartered Accountant in Ireland or the UK for fixed-fee annual returns, voluntary VAT reclaim advice, R&D tax credits, and LEO/EI audit sign-off.',
    badgeText: 'Warm Intro • Free Initial Consult',
    promoCode: null,
    countryScope: 'ALL',
    actionType: 'WARM_INTRO_MODAL',
    actionLabel: 'Request Warm Intro to Accountant',
    referralUrl: 'https://startuppreflight.com/partners/accountants',
    trustFactor: 'ACCA / Chartered Accountants Ireland / ICAEW Registered Firms',
    warmIntroRecipientEmail: 'accounting-intros@startuppreflight.com',
    warmIntroQuestionsJson: getSlotDefinition('OPS_STEP_4_ACCOUNTING')
      .defaultWarmIntroQuestions,
    commissionBountySummary: '€150 referral fee per retained annual accounting client',
    partnerContactNotes: 'Routes to our IE/UK partner accounting firm desk.',
    sortOrder: 2,
    isActive: true,
    createdAt: NOW_ISO,
    updatedAt: NOW_ISO,
  },
  {
    id: 'partner-brightpay-payroll',
    slug: 'brightpay-payroll-cloud',
    slotKey: 'OPS_STEP_4_PAYROLL',
    name: 'BrightPay / Sage Payroll',
    logoEmoji: '💼',
    category: 'Automated Payroll & PAYE/NIC Gateway',
    headline: '1-Click Revenue PAYE Modernisation (IE) & HMRC RTI (UK) Submissions',
    perkDescription:
      'Automates director salary slips, Employer PRSI / NIC calculations, and direct Revenue ROS / HMRC filings without needing an expensive payroll bureau.',
    badgeText: '60-Day Free Startup Trial',
    promoCode: null,
    countryScope: 'ALL',
    actionType: 'AFFILIATE_LINK',
    actionLabel: 'Explore BrightPay Payroll',
    referralUrl: 'https://www.brightpay.ie/?utm_source=startuppreflight',
    trustFactor: 'Used by 350,000+ businesses across Ireland & the UK',
    warmIntroRecipientEmail: null,
    warmIntroQuestionsJson: [],
    commissionBountySummary: '20% first-year license commission',
    partnerContactNotes: 'BrightSG Partner.',
    sortOrder: 1,
    isActive: true,
    createdAt: NOW_ISO,
    updatedAt: NOW_ISO,
  },

  // =========================================================================
  // STEP 5: STATUTORY STARTUP INSURANCE
  // =========================================================================
  {
    id: 'partner-startup-insurance-concierge',
    slug: 'startup-insurance-broker-intro',
    slotKey: 'OPS_STEP_5_INSURANCE',
    name: 'Hiscox / Arachas Startup Insurance Desk',
    logoEmoji: '🛡️',
    category: 'Commercial Startup Insurance Broker',
    headline: 'Fast-Track Quote for Public Liability, Employers Liability & Tech PI',
    perkDescription:
      'Get a grant-compliant commercial policy binder tailored to your exact product vehicle (SaaS Professional Indemnity, Physical Product Liability, or Office/Premises Cover).',
    badgeText: 'Warm Intro • Grant-Compliant Cover',
    promoCode: null,
    countryScope: 'ALL',
    actionType: 'WARM_INTRO_MODAL',
    actionLabel: 'Request Tailored Insurance Quote',
    referralUrl: 'https://www.hiscox.co.uk/business-insurance',
    trustFactor: 'A-Rated Underwriters • Central Bank of Ireland & FCA Regulated',
    warmIntroRecipientEmail: 'insurance-quotes@startuppreflight.com',
    warmIntroQuestionsJson: getSlotDefinition('OPS_STEP_5_INSURANCE')
      .defaultWarmIntroQuestions,
    commissionBountySummary: '€60–€120 intro commission per bound commercial policy',
    partnerContactNotes: 'Routes structured cover checklist to commercial broker desk.',
    sortOrder: 1,
    isActive: true,
    createdAt: NOW_ISO,
    updatedAt: NOW_ISO,
  },

  // =========================================================================
  // STEP 6: BASELINE LEGAL, IP & GDPR
  // =========================================================================
  {
    id: 'partner-seedlegals-clara',
    slug: 'seedlegals-startup-legal',
    slotKey: 'OPS_STEP_6_LEGAL_IP',
    name: 'SeedLegals (IE & UK Startup Legal Platform)',
    logoEmoji: '⚖️',
    category: 'Automated Legal Agreements & SEIS/EIS',
    headline: 'Generate Founder IP Assignment, Co-Founder Vesting & NDAs in Minutes',
    perkDescription:
      'Avoid £3,000+ law firm bills for standard startup documents. Create investor-grade Founder Service Agreements, IP Assignments, Cap Tables, and UK SEIS Advance Assurance packs.',
    badgeText: 'Startup Preflight Partner Perk',
    promoCode: 'PREFLIGHTLEGAL',
    countryScope: 'ALL',
    actionType: 'AFFILIATE_LINK',
    actionLabel: 'Access SeedLegals Templates',
    referralUrl: 'https://seedlegals.com/?utm_source=startuppreflight&subid={planId}',
    trustFactor: 'Used by 1 in 6 UK & Irish early-stage funded startups',
    warmIntroRecipientEmail: null,
    warmIntroQuestionsJson: [],
    commissionBountySummary: '£100 / €115 CPA per subscribed startup',
    partnerContactNotes: 'SeedLegals Partner Program.',
    sortOrder: 1,
    isActive: true,
    createdAt: NOW_ISO,
    updatedAt: NOW_ISO,
  },
  {
    id: 'partner-startup-solicitor-intro',
    slug: 'startup-ip-solicitor-intro',
    slotKey: 'OPS_STEP_6_LEGAL_IP',
    name: 'Bespoke Startup Solicitor & IP Attorney Intro',
    logoEmoji: '🏛️',
    category: 'Commercial Law & Patent/Trademark Filings',
    headline: 'Request a Fixed-Fee Quote for Custom Shareholders Agreements or Patents',
    perkDescription:
      'Need custom co-founder shareholders agreements, software licensing SLAs, or EU/UK trademark and patent filings? Request a warm intro to our vetted commercial legal panel.',
    badgeText: 'Warm Intro • Fixed-Fee Scope',
    promoCode: null,
    countryScope: 'ALL',
    actionType: 'WARM_INTRO_MODAL',
    actionLabel: 'Request Legal / IP Warm Intro',
    referralUrl: 'https://startuppreflight.com/partners/legal',
    trustFactor: 'Law Society of Ireland & SRA Regulated Commercial Practices',
    warmIntroRecipientEmail: 'legal-intros@startuppreflight.com',
    warmIntroQuestionsJson: getSlotDefinition('OPS_STEP_6_LEGAL_IP')
      .defaultWarmIntroQuestions,
    commissionBountySummary: 'Partner panel reciprocity / fixed intro fee',
    partnerContactNotes: 'Routes to commercial/IP legal panel.',
    sortOrder: 2,
    isActive: true,
    createdAt: NOW_ISO,
    updatedAt: NOW_ISO,
  },

  // =========================================================================
  // CONTEXTUAL SLOTS (Modules A, D, K)
  // =========================================================================
  {
    id: 'partner-mod-d-shopify',
    slug: 'shopify-startup-perk',
    slotKey: 'MOD_D_STEP_2_ECOMMERCE_NO_CODE',
    name: 'Shopify (€1 / £1 per Month for First 3 Months)',
    logoEmoji: '🛍️',
    category: 'D2C E-Commerce & Storefront',
    headline: 'Launch Your Own D2C Brand Storefront with €1/mo Startup Trial',
    perkDescription:
      'Own your customer email list and avoid 15%–30% marketplace commissions. Includes integrated Stripe payments, inventory tracking, and EU/UK VAT calculation.',
    badgeText: '€1/mo for 3 Months',
    promoCode: null,
    countryScope: 'ALL',
    actionType: 'AFFILIATE_LINK',
    actionLabel: 'Claim €1/mo Shopify Trial',
    referralUrl: 'https://www.shopify.com/free-trial?utm_source=startuppreflight&subid={planId}',
    trustFactor: 'Powers millions of D2C brands globally',
    warmIntroRecipientEmail: null,
    warmIntroQuestionsJson: [],
    commissionBountySummary: '$150 CPA per paid merchant upgrade',
    partnerContactNotes: 'Shopify Affiliate Program.',
    sortOrder: 1,
    isActive: true,
    createdAt: NOW_ISO,
    updatedAt: NOW_ISO,
  },
  {
    id: 'partner-mod-d-3quote-dev',
    slug: 'leo-3-quote-dev-concierge',
    slotKey: 'MOD_D_STEP_3_TECH_AGENCY_QUOTES',
    name: '3-Quote Dev & MVP Agency Concierge (IE & UK)',
    logoEmoji: '🛠️',
    category: 'Grant-Compliant Software Build Quotes',
    headline: 'Get 3 Written Development Quotes for LEO Priming, Feasibility & Grow Digital',
    perkDescription:
      'Irish LEO and Enterprise Ireland require 3 independent written supplier quotes for consultancy or development items over €5,000. We match your scope with 3 vetted agencies.',
    badgeText: 'Warm Intro • 3-Quote Grant Ready',
    promoCode: null,
    countryScope: 'ALL',
    actionType: 'WARM_INTRO_MODAL',
    actionLabel: 'Request 3 Grant-Compliant Dev Quotes',
    referralUrl: 'https://startuppreflight.com/partners/dev-quotes',
    trustFactor: 'Pre-vetted Irish & UK software studios familiar with LEO Appendix C',
    warmIntroRecipientEmail: 'rfp-concierge@startuppreflight.com',
    warmIntroQuestionsJson: getSlotDefinition('MOD_D_STEP_3_TECH_AGENCY_QUOTES')
      .defaultWarmIntroQuestions,
    commissionBountySummary: '€75 RFP lead fee or 7.5% agency finder fee',
    partnerContactNotes: 'Dispatches scope to 3 vetted partner dev agencies.',
    sortOrder: 1,
    isActive: true,
    createdAt: NOW_ISO,
    updatedAt: NOW_ISO,
  },
];

// =========================================================================
// BROWSER LOCALSTORAGE CACHE & OFFLINE FALLBACK HELPERS
// =========================================================================
const LOCAL_PARTNER_OFFERS_KEY = 'spf_admin_partner_offers_v2';
const LOCAL_REFERRAL_EVENTS_KEY = 'spf_admin_partner_referral_events_v2';

export function loadLocalPartnerOffers(): PartnerOfferRecord[] {
  if (typeof window === 'undefined') return DEFAULT_PARTNER_OFFERS;
  try {
    const raw = window.localStorage.getItem(LOCAL_PARTNER_OFFERS_KEY);
    if (!raw) return DEFAULT_PARTNER_OFFERS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : DEFAULT_PARTNER_OFFERS;
  } catch {
    return DEFAULT_PARTNER_OFFERS;
  }
}

export function saveLocalPartnerOffers(offers: PartnerOfferRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOCAL_PARTNER_OFFERS_KEY, JSON.stringify(offers));
  } catch {
    // ignore storage quota errors
  }
}

export function loadLocalReferralEvents(): PartnerReferralEventRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_REFERRAL_EVENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalReferralEvents(events: PartnerReferralEventRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOCAL_REFERRAL_EVENTS_KEY, JSON.stringify(events));
  } catch {
    // ignore storage quota errors
  }
}

/**
 * Resolves dynamic macros ({domain}, {planId}, {country}) in a partner's referralUrl.
 */
export function resolvePartnerReferralUrl(
  rawUrl: string,
  context?: {
    planId?: string;
    domain?: string;
    countryCode?: string;
  }
): string {
  let url = (rawUrl || '').trim();
  if (!url) return 'https://startuppreflight.com';

  const cleanDomain = (context?.domain || '').trim().toLowerCase();
  const cleanPlanId = (context?.planId || 'direct').trim();
  const cleanCountry = (context?.countryCode || 'IE').trim().toUpperCase();

  url = url
    .replace(/\{domain\}/gi, encodeURIComponent(cleanDomain))
    .replace(/\{planId\}/gi, encodeURIComponent(cleanPlanId))
    .replace(/\{projectId\}/gi, encodeURIComponent(cleanPlanId))
    .replace(/\{country\}/gi, encodeURIComponent(cleanCountry));

  return url;
}
