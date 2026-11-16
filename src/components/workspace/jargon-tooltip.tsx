'use client';

import React, { useEffect, useRef, useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

export type JargonStageGroup =
  | 'STAGE_1_VALIDATION'
  | 'STAGE_2_BUILD_TEAM_SETUP'
  | 'STAGE_3_PRICING_FINANCE'
  | 'STAGE_4_GRANTS_LEGAL';

export interface JargonGlossaryItem {
  key: string;
  term: string;
  shortLabel: string;
  stageGroup: JargonStageGroup;
  moduleBadge: string;
  plainEnglish: string;
  example?: string;
}

export const JARGON_STAGE_LABELS: Record<JargonStageGroup, string> = {
  STAGE_1_VALIDATION: 'Stage 1: Idea & Customer Validation (Modules A–C)',
  STAGE_2_BUILD_TEAM_SETUP: 'Stage 2: Product, Operations, Team & Setup (Modules D–G)',
  STAGE_3_PRICING_FINANCE: 'Stage 3: Pricing, Marketing & Cashflow (Modules H–J)',
  STAGE_4_GRANTS_LEGAL: 'Stage 4: Grants, Loans, Tax & Legal (Modules K–L)',
};

export const STARTUP_JARGON_GLOSSARY: JargonGlossaryItem[] = [
  // Stage 1: Modules A–C
  {
    key: 'BEACHHEAD',
    term: 'Beachhead Customer',
    shortLabel: 'Beachhead',
    stageGroup: 'STAGE_1_VALIDATION',
    moduleBadge: 'Module B',
    plainEnglish:
      'The single, ultra-specific first group of buyers who feel the problem most acutely and are quickest to pay you first.',
    example:
      'Instead of "all cafés in Ireland", a beachhead is "independent Dublin cafés baking on-site with 3+ staff".',
  },
  {
    key: 'CHAMPION',
    term: 'Internal Champion (Buyer vs. User)',
    shortLabel: 'Champion',
    stageGroup: 'STAGE_1_VALIDATION',
    moduleBadge: 'Module B',
    plainEnglish:
      'The person inside a business (or household) who feels the daily headache and pushes the budget-holder to buy your solution.',
  },
  {
    key: 'COMPETITIVE_WEDGE',
    term: 'Competitive Wedge & Unfair Advantage',
    shortLabel: 'Wedge',
    stageGroup: 'STAGE_1_VALIDATION',
    moduleBadge: 'Module B & D',
    plainEnglish:
      'The clear, specific reason a customer switches away from their current habit to choose you—and what makes you hard to copy.',
  },
  {
    key: 'TAM_SAM_SOM',
    term: 'TAM / SAM / SOM (Market Sizing)',
    shortLabel: 'TAM / SAM / SOM',
    stageGroup: 'STAGE_1_VALIDATION',
    moduleBadge: 'Module B & L',
    plainEnglish:
      'TAM = Everyone who could ever buy. SAM = Buyers in your target country and category. SOM = The realistic slice you can win in Years 1–3.',
  },
  {
    key: 'MOM_TEST',
    term: 'The "Mom Test" (Bias-Free Questions)',
    shortLabel: 'Mom Test',
    stageGroup: 'STAGE_1_VALIDATION',
    moduleBadge: 'Module C',
    plainEnglish:
      'Asking people about their real past habits and money already spent—never "Would you buy my idea?" (where polite friends say yes so they don\'t hurt your feelings).',
  },

  // Stage 2: Modules D–G
  {
    key: 'PRODUCT_VEHICLE',
    term: 'Product Vehicle (V1)',
    shortLabel: 'Product Vehicle',
    stageGroup: 'STAGE_2_BUILD_TEAM_SETUP',
    moduleBadge: 'Module D',
    plainEnglish:
      'The concrete format customers actually buy and receive in Version 1—whether a packaged food item, local booked service, or web tool.',
  },
  {
    key: 'OWN_VS_RENT',
    term: 'Owned vs. Rented Sales Channels',
    shortLabel: 'Own vs. Rent',
    stageGroup: 'STAGE_2_BUILD_TEAM_SETUP',
    moduleBadge: 'Module D & H',
    plainEnglish:
      'Owned channels (your website, walk-ins, direct B2B) keep ~98% of the sale and customer relationship. Rented marketplaces (Amazon, Deliveroo, App Store) bring traffic but charge 15%–30% commissions.',
  },
  {
    key: 'SKU',
    term: 'SKU (Individual Product Item / Option)',
    shortLabel: 'SKU',
    stageGroup: 'STAGE_2_BUILD_TEAM_SETUP',
    moduleBadge: 'Module D & E',
    plainEnglish:
      'Stock Keeping Unit—simply each distinct item, size, flavour, or service package you sell and track separately.',
  },
  {
    key: 'BOM',
    term: 'BOM (Bill of Materials / Recipe Cost)',
    shortLabel: 'BOM',
    stageGroup: 'STAGE_2_BUILD_TEAM_SETUP',
    moduleBadge: 'Module D & E',
    plainEnglish:
      'The itemised list of raw ingredients, parts, and packaging needed to make one finished unit of your physical product.',
  },
  {
    key: 'FNSKU',
    term: 'Barcode / FNSKU',
    shortLabel: 'Barcode / FNSKU',
    stageGroup: 'STAGE_2_BUILD_TEAM_SETUP',
    moduleBadge: 'Module D',
    plainEnglish:
      'The unique product barcode label required by retail stores (EAN/GS1) or Amazon warehouses (FNSKU) to scan and track your stock.',
  },
  {
    key: 'TRL',
    term: 'TRL (Technology Readiness Level 1–9)',
    shortLabel: 'TRL 1–9',
    stageGroup: 'STAGE_2_BUILD_TEAM_SETUP',
    moduleBadge: 'Module D & K',
    plainEnglish:
      'A 1-to-9 scale used by R&D grants (like Innovate UK) showing how mature a technology is: TRL 3 = lab proof-of-concept, TRL 6 = working pilot prototype, TRL 9 = commercially live.',
  },
  {
    key: 'SOP',
    term: 'SOP (Step-by-Step Checklist)',
    shortLabel: 'SOP',
    stageGroup: 'STAGE_2_BUILD_TEAM_SETUP',
    moduleBadge: 'Module E & F',
    plainEnglish:
      'Standard Operating Procedure—a simple 1-page written checklist showing how to fulfil an order or open up shop so someone else can cover for you.',
  },
  {
    key: 'SLA',
    term: 'SLA (Promised Delivery & Reply Speed)',
    shortLabel: 'SLA',
    stageGroup: 'STAGE_2_BUILD_TEAM_SETUP',
    moduleBadge: 'Module D & E',
    plainEnglish:
      'Service Level Agreement—how quickly you promise to dispatch an order, complete a job, or reply when a customer needs help.',
  },
  {
    key: 'ROPA',
    term: 'ROPA (GDPR Customer Data List)',
    shortLabel: 'ROPA',
    stageGroup: 'STAGE_2_BUILD_TEAM_SETUP',
    moduleBadge: 'Module E & G',
    plainEnglish:
      'Record of Processing Activities—a simple 1-page note listing what customer data you collect (e.g. name, email, address), where it is stored, and when you delete it.',
  },
  {
    key: 'VESTING_CLIFF',
    term: '4-Year Vesting & 1-Year Cliff',
    shortLabel: 'Vesting & Cliff',
    stageGroup: 'STAGE_2_BUILD_TEAM_SETUP',
    moduleBadge: 'Module F',
    plainEnglish:
      'Co-founders earn their company shares gradually over 4 years instead of all on Day 1. If someone walks away before 12 months ("the 1-year cliff"), they leave with 0% so the company isn\'t stuck with dead shares.',
  },
  {
    key: 'IP_ASSIGNMENT',
    term: 'IP Assignment Deed',
    shortLabel: 'IP Assignment',
    stageGroup: 'STAGE_2_BUILD_TEAM_SETUP',
    moduleBadge: 'Module F & G',
    plainEnglish:
      'A short signed legal document confirming that your Limited Company—not an individual founder or outside freelancer—officially owns your brand, recipes, designs, and code.',
  },
  {
    key: 'EULA',
    term: 'Customer Terms of Service / EULA',
    shortLabel: 'Terms / EULA',
    stageGroup: 'STAGE_2_BUILD_TEAM_SETUP',
    moduleBadge: 'Module G',
    plainEnglish:
      'The plain-English ground rules customers agree to before buying or using your product—covering payments, cancellations/refunds, acceptable use, and capping your legal liability.',
  },
  {
    key: 'FTO',
    term: 'Freedom to Operate (FTO)',
    shortLabel: 'Freedom to Operate',
    stageGroup: 'STAGE_2_BUILD_TEAM_SETUP',
    moduleBadge: 'Module F & K',
    plainEnglish:
      'Checking that making and selling your product does not accidentally infringe someone else\'s active patent, trademark, or former employer contract.',
  },

  // Stage 3: Modules H–J
  {
    key: 'POCKET_PROFIT',
    term: 'Pocket Profit & Real Breakeven',
    shortLabel: 'Pocket Profit',
    stageGroup: 'STAGE_3_PRICING_FINANCE',
    moduleBadge: 'Module H',
    plainEnglish:
      'The cash actually left over after unit delivery costs, card/platform fees, monthly business bills, AND your own personal survival pay are covered.',
  },
  {
    key: 'COGS',
    term: 'Direct Cost per Sale (COGS)',
    shortLabel: 'Direct Cost (COGS)',
    stageGroup: 'STAGE_3_PRICING_FINANCE',
    moduleBadge: 'Module D & H',
    plainEnglish:
      'Cost of Goods Sold—only the variable cost triggered each time you make 1 sale (e.g. ingredients, packaging, postage, or payment card fees), excluding fixed monthly rent.',
  },
  {
    key: 'GROSS_MARGIN',
    term: 'Gross Margin (%)',
    shortLabel: 'Gross Margin',
    stageGroup: 'STAGE_3_PRICING_FINANCE',
    moduleBadge: 'Module H & J',
    plainEnglish:
      'The percentage of each sale left after Direct Costs (COGS) to pay rent, marketing, and wages. If you sell for €100 ex-VAT and direct costs are €30, your Gross Margin is 70%.',
  },
  {
    key: 'CAC_LTV',
    term: 'CAC & LTV (Customer Acquisition Cost vs. Lifetime Value)',
    shortLabel: 'CAC & LTV',
    stageGroup: 'STAGE_3_PRICING_FINANCE',
    moduleBadge: 'Module I',
    plainEnglish:
      'CAC = What you spend on marketing/ads to win 1 new paying customer. LTV = Total gross profit that customer generates over all their repeat orders.',
  },
  {
    key: 'CASH_TROUGH',
    term: 'Cashflow Trough (Lowest Bank Point)',
    shortLabel: 'Cash Trough',
    stageGroup: 'STAGE_3_PRICING_FINANCE',
    moduleBadge: 'Module J & K',
    plainEnglish:
      'The deepest dip your bank balance hits during early setup before customer payments catch up with bills—telling you the minimum funding + buffer you need on Day 1.',
  },
  {
    key: 'PRSI_EMPLOYER_NIC',
    term: 'Employer PRSI (IE) / Employer NIC (UK)',
    shortLabel: 'Employer Tax',
    stageGroup: 'STAGE_3_PRICING_FINANCE',
    moduleBadge: 'Module J',
    plainEnglish:
      'The extra ~11.15% (Ireland PRSI) or ~13.8% + 3% pension (UK NIC) payroll tax a company pays on top of an employee\'s gross salary.',
  },

  // Stage 4: Modules K–L
  {
    key: 'NON_DISPLACEMENT',
    term: 'Non-Displacement (Grant Rule)',
    shortLabel: 'Non-Displacement',
    stageGroup: 'STAGE_4_GRANTS_LEGAL',
    moduleBadge: 'Module A, B & K',
    plainEnglish:
      'Taxpayer grants cannot fund a business that merely takes sales away from existing local competitors down the street; they fund businesses winning export sales or replacing imports.',
  },
  {
    key: 'DEADWEIGHT',
    term: 'Deadweight (Grant Rule)',
    shortLabel: 'Deadweight',
    stageGroup: 'STAGE_4_GRANTS_LEGAL',
    moduleBadge: 'Module K & L',
    plainEnglish:
      'Spending that would have happened anyway at the exact same speed without a government grant (or invoices paid before formal grant approval—which are disqualified).',
  },
  {
    key: 'VOUCHED_EXPENDITURE',
    term: 'Paid in Arrears / Vouched Expenditure',
    shortLabel: 'Paid in Arrears',
    stageGroup: 'STAGE_4_GRANTS_LEGAL',
    moduleBadge: 'Module K',
    plainEnglish:
      'Government grants work like work-expense receipts: they never wire money upfront. You pay the supplier first, submit the receipt + bank statement, and get ~50% refunded 4–8 weeks later.',
  },
  {
    key: 'UNENCUMBERED_WORKING_CAPITAL',
    term: 'Unencumbered Working Capital',
    shortLabel: 'Free Cash Buffer',
    stageGroup: 'STAGE_4_GRANTS_LEGAL',
    moduleBadge: 'Module J & K',
    plainEnglish:
      'Free, available cash sitting in your business bank account that is not already promised to another lender, grant, or overdue tax bill.',
  },
  {
    key: 'DSCR',
    term: 'DSCR (Debt Service Coverage Ratio)',
    shortLabel: 'Loan Cushion (DSCR)',
    stageGroup: 'STAGE_4_GRANTS_LEGAL',
    moduleBadge: 'Module K & L',
    plainEnglish:
      'Loan Safety Cushion: How many times over your yearly cash profit covers your yearly loan repayments. Banks typically look for 1.25× or higher.',
  },
  {
    key: 'DEBENTURE',
    term: 'Debenture / Security Charge',
    shortLabel: 'Debenture',
    stageGroup: 'STAGE_4_GRANTS_LEGAL',
    moduleBadge: 'Module K & L',
    plainEnglish:
      'A legal claim a traditional bank registers over company equipment or assets as collateral for a commercial loan (unsecured micro-loans like Start Up Loans or MFI usually do not take asset debentures).',
  },
  {
    key: 'SURE_PAYE',
    term: 'SURE (Startup Refunds for Entrepreneurs — Ireland)',
    shortLabel: 'Irish SURE Refund',
    stageGroup: 'STAGE_4_GRANTS_LEGAL',
    moduleBadge: 'Module K',
    plainEnglish:
      'An Irish Revenue scheme that refunds up to 41% of the PAYE income tax you personally paid over the last 6 years when you invest savings into your own new Limited Company.',
  },
  {
    key: 'SEIS_EIS_ADVANCE_ASSURANCE',
    term: 'SEIS / EIS Advance Assurance & EII',
    shortLabel: 'SEIS / EIS / EII',
    stageGroup: 'STAGE_4_GRANTS_LEGAL',
    moduleBadge: 'Module K & L',
    plainEnglish:
      'Government tax relief giving angel investors up to 50% (UK SEIS) or up to 50% (Irish EII) off their personal income tax bill when they buy shares in your startup.',
  },
  {
    key: 'RISK_TO_CAPITAL',
    term: 'Risk-to-Capital Condition',
    shortLabel: 'Risk-to-Capital',
    stageGroup: 'STAGE_4_GRANTS_LEGAL',
    moduleBadge: 'Module K & L',
    plainEnglish:
      'HMRC\'s rule for SEIS/EIS confirming that investor money is genuinely at risk to grow a long-term trading company (hiring, building, marketing)—not parked safely in property or low-risk cash.',
  },
  {
    key: 'SECTION_431',
    term: 'Section 431 Election (UK Employee Shares)',
    shortLabel: 'Section 431',
    stageGroup: 'STAGE_4_GRANTS_LEGAL',
    moduleBadge: 'Module F & K',
    plainEnglish:
      'A simple 2-page HMRC form signed within 14 days of receiving UK founder/employee shares so future growth is taxed at lower Capital Gains rates instead of Payroll Income Tax.',
  },
  {
    key: 'TC2_TAX_CLEARANCE',
    term: 'Tax Clearance Certificate (eTC / TC2)',
    shortLabel: 'Tax Clearance',
    stageGroup: 'STAGE_4_GRANTS_LEGAL',
    moduleBadge: 'Module E, G & K',
    plainEnglish:
      'A free instant confirmation from Irish Revenue (via ROS) proving your tax filings are up to date—required before any Irish LEO or Enterprise Ireland grant can pay out.',
  },
];

export interface JargonTooltipProps {
  term: string;
  label?: string;
  customTitle?: string;
  customDefinition?: string;
  align?: 'start' | 'end';
  className?: string;
}

export function JargonTooltip({
  term,
  label,
  customTitle,
  customDefinition,
  align = 'start',
  className = '',
}: JargonTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  const lookupKey = term.trim().toUpperCase().replace(/[\s/-]+/g, '_');
  const entry =
    STARTUP_JARGON_GLOSSARY.find(
      (item) =>
        item.key === lookupKey ||
        item.shortLabel.toUpperCase() === term.trim().toUpperCase() ||
        item.term.toUpperCase().includes(term.trim().toUpperCase())
    ) || null;

  const resolvedTitle = customTitle || entry?.term || term;
  const resolvedBody =
    customDefinition ||
    entry?.plainEnglish ||
    'Plain-English startup & grant definition available in the Founder Quick Guide.';

  useEffect(() => {
    if (!isOpen) return;
    function handleOutside(e: MouseEvent | TouchEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  return (
    <span ref={containerRef} className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        aria-expanded={isOpen}
        aria-label={`Plain-English explanation for ${resolvedTitle}`}
        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-900"
      >
        <HelpCircle className="h-3 w-3 shrink-0 text-emerald-700" />
        <span>{label || entry?.shortLabel || term}</span>
      </button>

      {isOpen && (
        <span
          role="dialog"
          onClick={(e) => e.stopPropagation()}
          className={`absolute top-full z-40 mt-1.5 w-72 sm:w-80 rounded-xl border border-slate-200 bg-white p-3 text-left font-normal normal-case tracking-normal shadow-lg ${
            align === 'end' ? 'right-0' : 'left-0'
          }`}
        >
          <span className="flex items-start justify-between gap-2">
            <span className="text-xs font-bold text-slate-900">
              {resolvedTitle}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close definition"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
          <span className="mt-1 block text-[11px] leading-relaxed text-slate-600">
            {resolvedBody}
          </span>
          {entry?.example && !customDefinition && (
            <span className="mt-1.5 block rounded-md bg-emerald-50/70 px-2 py-1 text-[10px] leading-relaxed text-emerald-900">
              <strong>Example:</strong> {entry.example}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
