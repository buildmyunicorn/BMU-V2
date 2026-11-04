import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { grantsDirectory } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Building2,
  FileCheck2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MarketingHeader, MarketingFooter } from '@/components/marketing/marketing-layout-nav';
import {
  GrantChecklistClient,
  type ChecklistItem,
} from '@/components/marketing/grant-checklist-client';

export const revalidate = 3600; // ISR 1 hour

interface GrantChecklistPageProps {
  params: Promise<{
    country: string;
    slug: string;
  }>;
}

// Generate static params for active grants to pre-render for top-tier SEO
export async function generateStaticParams() {
  try {
    const grants = await db
      .select({
        countryCode: grantsDirectory.countryCode,
        slug: grantsDirectory.slug,
      })
      .from(grantsDirectory)
      .where(eq(grantsDirectory.status, 'ACTIVE'));

    return grants.map((g) => ({
      country: g.countryCode.toLowerCase(),
      slug: g.slug,
    }));
  } catch (err) {
    console.error('[generateStaticParams Checklist] Failed to prefetch routes:', err);
    return [];
  }
}

// Generate Rich SEO Metadata for Google Search
export async function generateMetadata({
  params,
}: GrantChecklistPageProps): Promise<Metadata> {
  const { country, slug } = await params;
  const countryCodeUpper = country.toUpperCase();

  try {
    const grant = await db.query.grantsDirectory.findFirst({
      where: and(
        eq(grantsDirectory.slug, slug),
        eq(grantsDirectory.countryCode, countryCodeUpper),
        eq(grantsDirectory.status, 'ACTIVE')
      ),
    });

    if (!grant) {
      return {
        title: 'Grant Checklist Not Found | Startup Preflight',
        robots: { index: false },
      };
    }

    const title = `${grant.grantName} (${grant.countryCode}) Application Checklist & Required Documents`;
    const description = `Interactive readiness checklist and required documents schedule for ${grant.grantName} offered by ${grant.providerAgency}. Verify eligibility, 3 quotes, and assessor submission items.`;

    return {
      title: `${title} | Startup Preflight`,
      description,
      alternates: {
        canonical: `https://startuppreflight.com/grants/${country.toLowerCase()}/${slug}/checklist`,
      },
      openGraph: {
        title,
        description,
        url: `https://startuppreflight.com/grants/${country.toLowerCase()}/${slug}/checklist`,
        siteName: 'Startup Preflight',
        type: 'article',
      },
    };
  } catch {
    return {
      title: 'Grant Application Checklist | Startup Preflight',
    };
  }
}

export default async function GrantChecklistPage({ params }: GrantChecklistPageProps) {
  const { country, slug } = await params;
  const countryCodeUpper = country.toUpperCase();

  let grant: typeof grantsDirectory.$inferSelect | undefined;

  try {
    grant = await db.query.grantsDirectory.findFirst({
      where: and(
        eq(grantsDirectory.slug, slug),
        eq(grantsDirectory.countryCode, countryCodeUpper),
        eq(grantsDirectory.status, 'ACTIVE')
      ),
    });
  } catch (error) {
    console.error('[GrantChecklistPage] DB Query Error:', error);
  }

  if (!grant) {
    notFound();
  }

  // Synthesize structured checklist items across 4 practical categories
  const checklistItems: ChecklistItem[] = [];

  // 1. Stage & Legal Eligibility
  checklistItems.push({
    id: 'stage-location',
    category: '1. Entity & Geographic Eligibility',
    title: `Registered business base in ${grant.countryCode === 'IE' ? 'Ireland' : grant.countryCode === 'GB' ? 'the United Kingdom' : grant.countryCode}`,
    description: `Must operate with commercial premises or trading address registered within the jurisdiction of ${grant.providerAgency}.`,
    isCrucial: true,
  });

  if (grant.maxEmployees) {
    checklistItems.push({
      id: 'headcount-cap',
      category: '1. Entity & Geographic Eligibility',
      title: `Headcount under ${grant.maxEmployees} full-time staff`,
      description: `Official enterprise limit of fewer than ${grant.maxEmployees} employees (including active founder-directors).`,
      isCrucial: true,
    });
  }

  if (grant.maxTradingMonths) {
    checklistItems.push({
      id: 'trading-age-cap',
      category: '1. Entity & Geographic Eligibility',
      title: `Trading history under ${grant.maxTradingMonths} months`,
      description: `Must be within early-stage establishment window (less than ${grant.maxTradingMonths} months since commencement of commercial sales or incorporation).`,
      isCrucial: true,
    });
  }

  // 2. Assessor Document Pack
  if (grant.applicationRequirements && grant.applicationRequirements.length > 0) {
    grant.applicationRequirements.forEach((req, idx) => {
      checklistItems.push({
        id: `doc-req-${idx}`,
        category: '2. Required Assessor Document Pack',
        title: req,
        description: `Ensure this item is fully drafted, proofread, and signed off prior to submitting the formal application.`,
        isCrucial: idx === 0 || req.toLowerCase().includes('form') || req.toLowerCase().includes('tax'),
      });
    });
  } else {
    checklistItems.push(
      {
        id: 'doc-application-form',
        category: '2. Required Assessor Document Pack',
        title: 'Completed official application form',
        description: `Formal online application completed via ${grant.providerAgency} portal.`,
        isCrucial: true,
      },
      {
        id: 'doc-business-plan',
        category: '2. Required Assessor Document Pack',
        title: 'Structured Business Plan / Project Proposal',
        description: 'Comprehensive overview of problem, solution, commercial model, market opportunity, and execution plan.',
        isCrucial: true,
      },
      {
        id: 'doc-financial-projections',
        category: '2. Required Assessor Document Pack',
        title: '3-Year Financial Forecast & Cashflow Projection',
        description: 'Monthly cashflow and annual P&L demonstrating realistic commercial traction and funding requirements.',
        isCrucial: true,
      }
    );
  }

  // 3. Procurement & 3-Quote Rules
  if (grant.leoThreeQuoteEnforced) {
    checklistItems.push(
      {
        id: 'quotes-three-vetted',
        category: '3. Procurement & 3-Quote Rules',
        title: '3 independent, written supplier quotes for each external work package',
        description: 'Assessor rule requires 3 genuine, independent commercial quotations from registered businesses for software build, consultancy, or equipment.',
        isCrucial: true,
      },
      {
        id: 'quotes-arms-length',
        category: '3. Procurement & 3-Quote Rules',
        title: "Arms-length supplier independence confirmation",
        description: 'Suppliers must have zero financial, familial, or shareholding affiliation with any startup director or founder.',
        isCrucial: true,
      }
    );
  } else {
    checklistItems.push({
      id: 'quotes-standard-spec',
      category: '3. Procurement & 3-Quote Rules',
      title: 'Itemised supplier cost breakdown & scope specifications',
      description: 'Clear written supplier proposals detailing scope of work, deliverables, timeline, and professional fees.',
    });
  }

  // 4. Budget & Funding Match Verification
  if (grant.matchRatePercentage && grant.matchRatePercentage < 100) {
    const founderMatch = 100 - grant.matchRatePercentage;
    checklistItems.push({
      id: 'funding-match-proof',
      category: '4. Budget & Matching Funds Verification',
      title: `Proof of ${founderMatch}% matching founder funds in bank account`,
      description: `Because ${grant.grantName} provides a ${grant.matchRatePercentage}% grant rate, you must verify access to the remaining ${founderMatch}% co-funding in your bank statement.`,
      isCrucial: true,
    });
  }

  checklistItems.push({
    id: 'funding-no-prior-spend',
    category: '4. Budget & Matching Funds Verification',
    title: 'Zero retrospective expenditure prior to formal approval',
    description: 'Ensure no deposits, invoices, or purchase orders have been signed or paid before receiving the formal Letter of Offer.',
    isCrucial: true,
  });

  // Schema.org HowTo structured data for Google Search Snippets
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `How to Apply for ${grant.grantName} — Checklist & Requirements`,
    description: `Complete application readiness checklist and required documents schedule for ${grant.grantName} offered by ${grant.providerAgency}.`,
    step: checklistItems.map((item, idx) => ({
      '@type': 'HowToStep',
      position: idx + 1,
      name: item.title,
      text: item.description,
    })),
  };

  const flagEmoji = grant.countryCode === 'IE' ? '🇮🇪' : grant.countryCode === 'GB' ? '🇬🇧' : '🌍';
  const countrySegment = grant.countryCode.toLowerCase();
  const grantDetailHref = `/grants/${countrySegment}/${grant.slug}`;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased selection:bg-indigo-100 selection:text-indigo-900">
      {/* Inject Schema.org HowTo JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <MarketingHeader active="grants" />

      {/* Breadcrumb Strip */}
      <div className="border-b border-slate-200/80 bg-white/70 py-2.5 px-4 sm:px-6 print:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between text-xs text-slate-500">
          <Link
            href={grantDetailHref}
            className="inline-flex items-center gap-1.5 font-medium text-slate-600 hover:text-indigo-600 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to {grant.grantName} Scheme Overview
          </Link>
          <div className="flex items-center gap-2 text-[11px]">
            <Link href="/grants" className="text-slate-400 hover:text-slate-600">
              Grants
            </Link>
            <span className="text-slate-300">/</span>
            <Link href={grantDetailHref} className="text-slate-400 hover:text-slate-600 truncate max-w-[140px]">
              {grant.grantName}
            </Link>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-slate-700">Application Checklist</span>
          </div>
        </div>
      </div>

      <main className="flex-1">
        {/* HERO SECTION MATCHING LANDING PAGE VISUAL THEME */}
        <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-white via-indigo-50/25 to-slate-50 px-4 pt-10 pb-12 sm:px-6 lg:pt-14 lg:pb-16 print:hidden">
          <div className="mx-auto max-w-4xl text-center">
            {/* Pill Badge */}
            <div className="inline-flex items-center justify-center gap-2 rounded-full border border-indigo-200 bg-white px-3.5 py-1 text-xs font-semibold text-indigo-950 shadow-2xs">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
              <span>Official Assessor Preparation Checklist</span>
            </div>

            {/* Headline */}
            <h1 className="mx-auto mt-4 max-w-3xl text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl lg:leading-[1.15]">
              {grant.grantName}{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Application Checklist
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
              Step-by-step document schedule, eligibility rules, and assessor compliance items needed before submitting your application to <strong>{grant.providerAgency}</strong>.
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <Badge
                variant="outline"
                className={`text-xs px-2.5 py-0.5 font-semibold ${
                  grant.countryCode === 'IE'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : grant.countryCode === 'GB'
                    ? 'border-blue-200 bg-blue-50 text-blue-800'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
              >
                {flagEmoji} {grant.countryCode === 'IE' ? 'Ireland' : grant.countryCode === 'GB' ? 'United Kingdom' : grant.countryCode}
              </Badge>
              <Badge
                variant="outline"
                className="border-slate-200 bg-white text-slate-700 text-xs px-2.5 py-0.5 font-medium shadow-2xs"
              >
                <Building2 className="mr-1 h-3 w-3 text-slate-400" />
                {grant.providerAgency}
              </Badge>
              <Badge
                variant="outline"
                className="border-indigo-200 bg-indigo-50 text-indigo-800 text-xs px-2.5 py-0.5 font-medium"
              >
                Funding: {grant.maxAmountFormatted}
              </Badge>
            </div>
          </div>
        </section>

        {/* INTERACTIVE CHECKLIST CLIENT COMPONENT */}
        <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-12">
          <GrantChecklistClient
            grant={{
              slug: grant.slug,
              countryCode: grant.countryCode,
              grantName: grant.grantName,
              providerAgency: grant.providerAgency,
              fundingType: grant.fundingType,
              maxAmountFormatted: grant.maxAmountFormatted,
              leoThreeQuoteEnforced: grant.leoThreeQuoteEnforced,
              reimbursementWarning: grant.reimbursementWarning,
            }}
            checklistItems={checklistItems}
          />
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
