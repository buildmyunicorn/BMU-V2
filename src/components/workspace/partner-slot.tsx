'use client';

import React from 'react';
import { ExternalLink, CheckCircle2, Shield, Sparkles, Building2, Globe, Mail, Landmark, Calculator, FileCheck2, ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export type PartnerSlotKey =
  | 'OPS_STEP_1_INCORPORATION'
  | 'OPS_STEP_2_DOMAIN'
  | 'OPS_STEP_2_EMAIL'
  | 'OPS_STEP_3_BANKING'
  | 'OPS_STEP_4_ACCOUNTING'
  | 'OPS_STEP_4_PAYROLL'
  | 'OPS_STEP_5_INSURANCE'
  | 'OPS_STEP_6_LEGAL_IP'
  | 'MOD_C_STEP_4_SURVEY_BOOST'
  | 'MOD_D_STEP_2_ECOMMERCE_NO_CODE'
  | 'MOD_D_STEP_3_TECH_AGENCY_QUOTES'
  | 'MOD_E_STEP_2_BRANDING_DOMAINS';

export interface PartnerOffer {
  id: string;
  name: string;
  logoEmoji: string;
  category: string;
  headline: string;
  perkDescription: string;
  badgeText: string;
  countryScope: 'ALL' | 'IE' | 'GB';
  actionLabel: string;
  referralUrl: string;
  trustFactor: string;
}

export const DEFAULT_PARTNERS: Record<PartnerSlotKey, PartnerOffer[]> = {
  OPS_STEP_1_INCORPORATION: [
    {
      id: 'partner-cro-direct',
      name: 'CRO Core (Ireland)',
      logoEmoji: '🏢',
      category: 'Official Registry',
      headline: 'Register directly with Ireland Companies Registration Office',
      perkDescription: 'Standard €50 incorporation fee via digital CRO Core submission. Digital Certificate of Incorporation issued within 3–5 working days.',
      badgeText: 'Official State Registry',
      countryScope: 'IE',
      actionLabel: 'Visit CRO Core Portal',
      referralUrl: 'https://core.cro.ie',
      trustFactor: 'Statutory Requirement for Irish LTD/DAC entities',
    },
    {
      id: 'partner-ch-direct',
      name: 'Companies House (UK)',
      logoEmoji: '🇬🇧',
      category: 'Official Registry',
      headline: 'Register directly with UK Companies House',
      perkDescription: 'Direct digital incorporation for £50. Standard digital incorporation completed in under 24 hours with Articles of Association included.',
      badgeText: 'Official State Registry',
      countryScope: 'GB',
      actionLabel: 'Visit Companies House',
      referralUrl: 'https://www.gov.uk/set-up-limited-company',
      trustFactor: 'Statutory Requirement for UK LTD entities',
    },
    {
      id: 'partner-company-bureau',
      name: 'Company Bureau Formations',
      logoEmoji: '⚡',
      category: 'Formation Concierge',
      headline: 'Fast-Track Assisted Company Secretarial Incorporation',
      perkDescription: 'Full formation package including company seal, registered office facility, Revenue register & tax registrations.',
      badgeText: 'Startup Preflight Concierge',
      countryScope: 'ALL',
      actionLabel: 'View Formation Options',
      referralUrl: 'https://companyformations.ie',
      trustFactor: 'Over 30,000 entities incorporated across IE & UK',
    },
  ],
  OPS_STEP_2_DOMAIN: [
    {
      id: 'partner-blacknight-iedomains',
      name: 'Blacknight Solutions / Namecheap',
      logoEmoji: '🌐',
      category: 'Domain Registrar',
      headline: 'Secure .ie, .co.uk & .com with Free DNSSEC & Privacy Protection',
      perkDescription: 'Fast verification for Irish .ie domains (requires CRO number or Proof of Trade) and instant DNS propagation.',
      badgeText: 'Accredited Registrar',
      countryScope: 'ALL',
      actionLabel: 'Check Domain Availability',
      referralUrl: 'https://www.blacknight.com',
      trustFactor: 'Accredited .ie Domain Registry Registrar',
    },
  ],
  OPS_STEP_2_EMAIL: [
    {
      id: 'partner-google-workspace',
      name: 'Google Workspace for Startups',
      logoEmoji: '📧',
      category: 'Official Mail & Cloud',
      headline: 'Official @yourcompany.com Business Email & Drive',
      perkDescription: 'Crucial for passing grant audits. LEO, EI and UK SUL reject generic @gmail.com applications.',
      badgeText: 'Recommended by Grant Evaluators',
      countryScope: 'ALL',
      actionLabel: 'Get Google Workspace',
      referralUrl: 'https://workspace.google.com',
      trustFactor: '99.9% uptime SLA with custom domain verification',
    },
  ],
  OPS_STEP_3_BANKING: [
    {
      id: 'partner-revolut-business',
      name: 'Revolut Business / Tide',
      logoEmoji: '💳',
      category: 'Digital Business Banking',
      headline: 'Instant Multi-Currency IBAN & Free Digital Banking for 1 Year',
      perkDescription: 'Open a dedicated business account in 24 hours with zero monthly subscription fees on basic startup tiers. Supports direct SEPA / Faster Payments.',
      badgeText: 'Instant Account Setup',
      countryScope: 'ALL',
      actionLabel: 'Explore Business Account',
      referralUrl: 'https://www.revolut.com/business',
      trustFactor: 'Licensed European Credit Institution / FCA Regulated',
    },
    {
      id: 'partner-aib-boi-pillar',
      name: 'Pillar Bank Business Accounts (AIB / Bank of Ireland / Barclays)',
      logoEmoji: '🏛️',
      category: 'Traditional Commercial Banking',
      headline: 'Required for Certain State Grant Drawdowns & Direct Overdrafts',
      perkDescription: 'Traditional dedicated business relationship managers. Mandatory if applying for certain large regional enterprise term loans.',
      badgeText: 'LEO / EI Preferred Partner',
      countryScope: 'ALL',
      actionLabel: 'Schedule Branch Onboarding',
      referralUrl: 'https://business.aib.ie',
      trustFactor: 'Direct local commercial banking coverage',
    },
  ],
  OPS_STEP_4_ACCOUNTING: [
    {
      id: 'partner-xero-quickbooks',
      name: 'Xero Cloud Accounting',
      logoEmoji: '📊',
      category: 'Cloud Bookkeeping',
      headline: 'Automate Bank Feeds, VAT Returns & Real-Time Cashflow',
      perkDescription: '90% discount for first 6 months. Auto-categorize revenue and expenses; syncs seamlessly with Module J financial projections.',
      badgeText: 'Startup Cloud Perk',
      countryScope: 'ALL',
      actionLabel: 'Claim Startup Discount',
      referralUrl: 'https://www.xero.com',
      trustFactor: 'Standard format accepted by Revenue (ROS) and HMRC',
    },
  ],
  OPS_STEP_4_PAYROLL: [
    {
      id: 'partner-brightpay-payroll',
      name: 'BrightPay / Sage Payroll',
      logoEmoji: '💼',
      category: 'Payroll & PRSI/NIC Compliance',
      headline: 'Real-Time Revenue PAYE Modernisation & HMRC RTI Submissions',
      perkDescription: 'Ensures founder salaries and future hires comply with statutory PRSI/USC (Ireland) or NIC/PAYE (UK).',
      badgeText: 'Fully Revenue & HMRC Compliant',
      countryScope: 'ALL',
      actionLabel: 'Explore Payroll Tooling',
      referralUrl: 'https://www.brightpay.ie',
      trustFactor: 'Automated ROS & HMRC submission gateway',
    },
  ],
  OPS_STEP_5_INSURANCE: [
    {
      id: 'partner-hiscox-startup',
      name: 'Hiscox / Arachas Startup Insurance',
      logoEmoji: '🛡️',
      category: 'Commercial Insurance',
      headline: 'Tailored Public & Employers Liability + Professional Indemnity',
      perkDescription: 'Instant quote and digital policy binder. Required by landlords, commercial pilot clients, and state grant agreements.',
      badgeText: 'Instant Digital Cover',
      countryScope: 'ALL',
      actionLabel: 'Get Instant Startup Quote',
      referralUrl: 'https://www.hiscox.co.uk',
      trustFactor: 'A-rated global specialist commercial insurer',
    },
  ],
  OPS_STEP_6_LEGAL_IP: [
    {
      id: 'partner-seedlegals-templates',
      name: 'SeedLegals / Clara Legal Suite',
      logoEmoji: '⚖️',
      category: 'Startup Legal Agreements',
      headline: 'Founder IP Assignment, NDAs & GDPR Website Privacy Pack',
      perkDescription: 'Protect company IP before taking grant funding or co-founder equity. Avoid investor red-flags with standard founder vesting documents.',
      badgeText: 'Investor Standard Legal Docs',
      countryScope: 'ALL',
      actionLabel: 'Access Legal Templates',
      referralUrl: 'https://seedlegals.com',
      trustFactor: 'Standardized venture capital & grant compliant contracts',
    },
  ],
  MOD_C_STEP_4_SURVEY_BOOST: [],
  MOD_D_STEP_2_ECOMMERCE_NO_CODE: [],
  MOD_D_STEP_3_TECH_AGENCY_QUOTES: [],
  MOD_E_STEP_2_BRANDING_DOMAINS: [],
};

interface PartnerSlotProps {
  slot: PartnerSlotKey;
  countryCode?: string;
  projectId?: string;
  title?: string;
  description?: string;
  className?: string;
  compact?: boolean;
}

export function PartnerSlot({
  slot,
  countryCode = 'IE',
  projectId,
  title,
  description,
  className = '',
  compact = false,
}: PartnerSlotProps) {
  const allForSlot = DEFAULT_PARTNERS[slot] || [];
  
  // Filter by country scope: 'ALL' matches everything, otherwise exact match
  const filtered = allForSlot.filter(
    (p) => p.countryScope === 'ALL' || (p.countryScope as string) === countryCode
  );

  const partnersToRender = filtered.length > 0 ? filtered : allForSlot;

  if (partnersToRender.length === 0) {
    return null;
  }

  return (
    <div
      className={`rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/30 p-4 transition-all ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100/60 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[11px]">
            ⚡
          </span>
          <span className="text-xs font-semibold text-slate-800">
            {title || 'Vetted Launchpad Partner & Founder Perks'}
          </span>
          <Badge variant="outline" className="border-indigo-200 bg-indigo-50/80 text-[10px] text-indigo-700">
            Preflight Verified
          </Badge>
        </div>
        <span className="text-[11px] text-slate-500">
          Tailored for {countryCode === 'GB' ? 'United Kingdom (UK)' : countryCode === 'IE' ? 'Ireland (IE)' : 'Global Founders'}
        </span>
      </div>

      {description && (
        <p className="mt-2 text-xs text-slate-600 leading-relaxed">
          {description}
        </p>
      )}

      <div className={`mt-3 grid gap-3 ${compact || partnersToRender.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
        {partnersToRender.map((partner) => (
          <div
            key={partner.id}
            className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs transition-all hover:border-indigo-300 hover:shadow-xs"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl" role="img" aria-label={partner.name}>
                    {partner.logoEmoji}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">
                      {partner.name}
                    </h4>
                    <span className="text-[10px] font-medium text-slate-500">
                      {partner.category}
                    </span>
                  </div>
                </div>
                <Badge className="shrink-0 border-emerald-200 bg-emerald-50 text-[10px] font-medium text-emerald-800">
                  {partner.badgeText}
                </Badge>
              </div>

              <p className="mt-2 text-xs font-medium text-slate-800">
                {partner.headline}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                {partner.perkDescription}
              </p>
            </div>

            <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-2.5">
              <span className="text-[10px] text-slate-600">
                🛡️ {partner.trustFactor}
              </span>
              <a
                href={partner.referralUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-indigo-700"
              >
                <span>{partner.actionLabel}</span>
                <ArrowUpRight className="h-3 w-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
