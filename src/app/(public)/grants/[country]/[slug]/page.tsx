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
  ExternalLink,
  ShieldCheck,
  Building2,
  CheckCircle2,
  XCircle,
  Sparkles,
  FileText,
  AlertTriangle,
  Clock,
  Briefcase,
  Layers,
  HelpCircle,
  CheckSquare,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MarketingHeader, MarketingFooter } from '@/components/marketing/marketing-layout-nav';
import { ShareGrantButton } from '@/components/marketing/share-grant-button';
import {
  ensureDefaultGrantsSeededInDb,
  getFallbackGrantRecords,
} from '@/lib/grants/ensure-grants';

export const revalidate = 3600; // Revalidate every hour (ISR)

interface GrantPageProps {
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

    if (grants.length > 0) {
      return grants.map((g) => ({
        country: g.countryCode.toLowerCase(),
        slug: g.slug,
      }));
    }
  } catch (err) {
    console.error('[generateStaticParams] Failed to prefetch grant routes:', err);
  }

  return getFallbackGrantRecords().map((g) => ({
    country: g.countryCode.toLowerCase(),
    slug: g.slug,
  }));
}

// Generate Rich SEO Metadata for Google
export async function generateMetadata({ params }: GrantPageProps): Promise<Metadata> {
  const { country, slug } = await params;
  const countryCodeUpper = country.toUpperCase();

  try {
    let grant = await db.query.grantsDirectory.findFirst({
      where: and(
        eq(grantsDirectory.slug, slug),
        eq(grantsDirectory.countryCode, countryCodeUpper),
        eq(grantsDirectory.status, 'ACTIVE')
      ),
    });

    if (!grant) {
      grant = getFallbackGrantRecords().find(
        (g) => g.slug === slug && g.countryCode === countryCodeUpper
      );
    }

    if (!grant) {
      return {
        title: 'Grant Not Found | Startup Preflight',
        robots: { index: false },
      };
    }

    const title = `${grant.grantName} (${grant.countryCode}) — Eligibility, Caps & Checklist`;
    const description =
      grant.summary ||
      `Complete guide, caps, and application requirements for ${grant.grantName} offered by ${grant.providerAgency}.`;

    return {
      title: `${title} | Startup Preflight`,
      description,
      alternates: {
        canonical: `https://startuppreflight.com/grants/${country.toLowerCase()}/${slug}`,
      },
      openGraph: {
        title,
        description,
        url: `https://startuppreflight.com/grants/${country.toLowerCase()}/${slug}`,
        siteName: 'Startup Preflight',
        type: 'article',
      },
    };
  } catch {
    const fallback = getFallbackGrantRecords().find(
      (g) => g.slug === slug && g.countryCode === countryCodeUpper
    );
    if (fallback) {
      return {
        title: `${fallback.grantName} (${fallback.countryCode}) — Eligibility, Caps & Checklist | Startup Preflight`,
        description: fallback.summary || '',
      };
    }
    return {
      title: 'Grant Breakdown | Startup Preflight',
    };
  }
}

export default async function GrantDetailPage({ params }: GrantPageProps) {
  const { country, slug } = await params;
  const countryCodeUpper = country.toUpperCase();

  let grant: typeof grantsDirectory.$inferSelect | undefined;

  try {
    await ensureDefaultGrantsSeededInDb();

    grant = await db.query.grantsDirectory.findFirst({
      where: and(
        eq(grantsDirectory.slug, slug),
        eq(grantsDirectory.countryCode, countryCodeUpper),
        eq(grantsDirectory.status, 'ACTIVE')
      ),
    });
  } catch (error) {
    console.error('[GrantDetailPage] DB Query Error:', error);
  }

  if (!grant) {
    grant = getFallbackGrantRecords().find(
      (g) => g.slug === slug && g.countryCode === countryCodeUpper
    );
  }

  if (!grant) {
    notFound();
  }

  const eligibleExpenses = grant.eligibleCosts || [];
  const ineligibleExpenses = grant.ineligibleCosts || [];
  const applicationRequirements = grant.applicationRequirements || [];
  const disqualificationRedFlags = grant.disqualificationRedFlags || [];

  const flagEmoji = grant.countryCode === 'IE' ? '🇮🇪' : grant.countryCode === 'GB' ? '🇬🇧' : '🌍';

  // Schema.org Structured Data for Google Rich Snippets
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'GovernmentService',
    name: grant.grantName,
    serviceType: 'Startup Grant & Business Funding Support',
    provider: {
      '@type': 'GovernmentOrganization',
      name: grant.providerAgency,
    },
    areaServed: {
      '@type': 'Country',
      name: grant.countryCode === 'IE' ? 'Ireland' : grant.countryCode === 'GB' ? 'United Kingdom' : 'Global',
    },
    description: grant.summary,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: grant.currency,
      description: `Funding up to ${grant.maxAmountFormatted} at ${grant.matchRatePercentage}% intervention rate.`,
    },
    url: `https://startuppreflight.com/grants/${country.toLowerCase()}/${slug}`,
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased selection:bg-indigo-100 selection:text-indigo-900">
      {/* Inject JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Modern SaaS Header */}
      <MarketingHeader active="grants" />

      {/* Sub-Header / Breadcrumb Strip */}
      <div className="border-b border-slate-200/80 bg-white/70 py-2.5 px-4 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between text-xs text-slate-500">
          <Link
            href="/grants"
            className="inline-flex items-center gap-1.5 font-medium text-slate-600 hover:text-indigo-600 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to All Grants
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-2 text-[11px]">
              <span className="text-slate-400">Directory</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-400 font-mono uppercase">{grant.countryCode}</span>
              <span className="text-slate-300">/</span>
              <span className="font-semibold text-slate-700 truncate max-w-[200px]">{grant.grantName}</span>
            </div>
            <ShareGrantButton
              title={`${grant.grantName} (${grant.countryCode})`}
              description={grant.summary || undefined}
              slug={grant.slug}
              countryCode={grant.countryCode}
              pathType="detail"
              size="sm"
              variant="outline"
              className="h-7 text-xs border-slate-200 bg-white hover:bg-slate-50"
              buttonText="Share"
            />
          </div>
        </div>
      </div>

      <main className="flex-1">
        {/* HERO SECTION MATCHING LANDING PAGE VISUAL THEME */}
        <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-white via-indigo-50/20 to-slate-50 px-4 py-10 sm:px-6 sm:py-14">
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-wrap items-center gap-2">
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
                className="border-indigo-200 bg-indigo-50 text-indigo-800 text-xs px-2.5 py-0.5 capitalize font-medium"
              >
                {grant.fundingType.replace(/_/g, ' ').toLowerCase()}
              </Badge>
              {grant.leoThreeQuoteEnforced && (
                <Badge
                  variant="outline"
                  className="border-amber-300 bg-amber-50 text-amber-800 text-xs px-2.5 py-0.5 font-medium"
                >
                  3-Quote Rule Enforced
                </Badge>
              )}
            </div>

            <h1 className="mt-4 text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              {grant.grantName}
            </h1>

            <p className="mt-3 text-base sm:text-lg text-slate-600 max-w-3xl leading-relaxed">
              {grant.summary}
            </p>

            {/* QUICK ACTIONS ROW: DIRECT ACCESS TO PRINTABLE CHECKLIST */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href={`/grants/${country.toLowerCase()}/${grant.slug}/checklist`}>
                <Button className="h-9 sm:h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs sm:text-sm font-semibold text-white shadow-xs transition">
                  <CheckSquare className="mr-2 h-4 w-4" />
                  View Interactive Checklist &amp; Required Documents
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" className="h-9 sm:h-10 rounded-xl border-slate-300 bg-white hover:bg-slate-50 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs transition">
                  <Sparkles className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
                  Test Grant Fit with AI
                </Button>
              </Link>
              <ShareGrantButton
                title={`${grant.grantName} (${grant.countryCode})`}
                description={grant.summary || undefined}
                slug={grant.slug}
                countryCode={grant.countryCode}
                pathType="detail"
                variant="outline"
                className="h-9 sm:h-10 rounded-xl border-slate-300 bg-white hover:bg-slate-50 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs"
                buttonText="Share Grant"
              />
            </div>

            {/* KEY METRICS 4-CARD BENTO GRID MATCHING LANDING PAGE */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Maximum Funding
                </div>
                <div className="mt-1 text-lg sm:text-xl font-extrabold text-slate-900">
                  {grant.maxAmountFormatted}
                </div>
                <div className="mt-0.5 text-xs text-indigo-600 font-semibold">
                  {grant.matchRatePercentage ? `${grant.matchRatePercentage}% Match Rate` : 'Non-dilutive'}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Assessor Audit Rule
                </div>
                <div className="mt-1 text-lg sm:text-xl font-extrabold text-slate-900">
                  {grant.leoThreeQuoteEnforced ? '3 Written Quotes' : 'Standard Invoicing'}
                </div>
                <div className="mt-0.5 text-xs text-slate-500">
                  {grant.leoThreeQuoteEnforced ? 'LEO tender audit compliance' : 'Direct proof of EFT payment'}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Eligibility Limits
                </div>
                <div className="mt-1 text-lg sm:text-xl font-extrabold text-slate-900">
                  {grant.maxEmployees ? `< ${grant.maxEmployees} Staff` : 'Early-Stage'}
                </div>
                <div className="mt-0.5 text-xs text-slate-500">
                  {grant.maxTradingMonths ? `< ${grant.maxTradingMonths} mo trading` : 'Pre-revenue accepted'}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Review &amp; Speed
                </div>
                <div className="mt-1 text-lg sm:text-xl font-extrabold text-slate-900">
                  {grant.turnaroundLabel || '4–6 Weeks'}
                </div>
                <div className="mt-0.5 text-xs text-emerald-600 font-semibold">
                  {grant.isRepayable ? 'Soft Low-Interest Loan' : 'Non-Repayable Grant'}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MAIN BODY CONTENT */}
        <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-12">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            {/* Left Column: Criteria & Details */}
            <div className="space-y-8 lg:col-span-8">
              {/* Detailed Markdown Content */}
              {grant.descriptionMarkdown && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <FileText className="h-5 w-5 text-indigo-600" />
                    Scheme Overview &amp; Underwriting Criteria
                  </h2>
                  <div className="mt-4 prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed text-slate-700">
                    {grant.descriptionMarkdown.split('\n\n').map((paragraph: string, idx: number) => {
                      if (paragraph.startsWith('### ')) {
                        return (
                          <h3 key={idx} className="text-sm font-bold text-slate-900 mt-5 mb-2">
                            {paragraph.replace('### ', '')}
                          </h3>
                        );
                      }
                      if (paragraph.startsWith('- ')) {
                        const items = paragraph.split('\n- ');
                        return (
                          <ul key={idx} className="list-disc pl-5 space-y-1.5 my-3 text-slate-700">
                            {items.map((it, itemIdx) => (
                              <li key={itemIdx}>{it.replace(/^- /, '')}</li>
                            ))}
                          </ul>
                        );
                      }
                      return (
                        <p key={idx} className="my-2.5 text-slate-700">
                          {paragraph}
                        </p>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Eligible vs Ineligible Expenses Side-by-Side Bento */}
              <div className="space-y-3">
                <h2 className="text-base font-bold text-slate-900">
                  Approved vs. Ineligible Expenditure Schedule
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Eligible Costs */}
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Approved Costs (Assessor Will Fund)
                    </div>
                    {eligibleExpenses.length > 0 ? (
                      <ul className="mt-3.5 space-y-2 text-xs text-slate-700">
                        {eligibleExpenses.map((expense, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-emerald-600 font-bold">•</span>
                            <span>{expense}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-xs text-slate-500">
                        Consult official guidelines for full schedule.
                      </p>
                    )}
                  </div>

                  {/* Ineligible Costs */}
                  <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-5 shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-800">
                      <XCircle className="h-4 w-4 text-rose-600" />
                      Strictly Ineligible (Instant Rejection)
                    </div>
                    {ineligibleExpenses.length > 0 ? (
                      <ul className="mt-3.5 space-y-2 text-xs text-slate-700">
                        {ineligibleExpenses.map((expense, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-rose-600 font-bold">•</span>
                            <span>{expense}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-xs text-slate-500">
                        Retail displacement and retrospective claims prior to grant approval.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Application Requirements Checklist */}
              {applicationRequirements.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    Required Documents &amp; Assessor Submission Pack
                  </h2>
                  <div className="mt-4 space-y-2">
                    {applicationRequirements.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs text-slate-700"
                      >
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Red Flags / Disqualification */}
              {disqualificationRedFlags.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/30 p-6 shadow-xs">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-amber-900 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    Common Disqualification Red Flags
                  </h2>
                  <div className="mt-3.5 space-y-2">
                    {disqualificationRedFlags.map((flag, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 text-xs text-amber-900"
                      >
                        <XCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                        <span>{flag}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Retrospective Reimbursement Warning Box */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex items-start gap-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Assessor Underwriting Warning &amp; Cashflow Timing
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    {grant.reimbursementWarning}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Sticky Action & Conversion Card */}
            <div className="space-y-6 lg:col-span-4">
              <div className="sticky top-24 space-y-5">
                {/* Startup Preflight Audit CTA Card */}
                <div className="rounded-2xl border border-indigo-200 bg-gradient-to-b from-indigo-50/70 via-white to-indigo-50/30 p-6 shadow-sm">
                  <div className="flex items-center gap-2 text-indigo-700">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">
                      Startup Preflight Evaluator
                    </span>
                  </div>

                  <h3 className="mt-2.5 text-base font-bold text-slate-900 leading-snug">
                    Test your venture against this grant in 60 seconds
                  </h3>

                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    Startup Preflight cross-references your concept canvas, headcount, location, and technical work packages against <strong>{grant.grantName}</strong> underwriting criteria before you apply.
                  </p>

                  <div className="mt-5 space-y-2.5">
                    <Link href={`/grants/${country.toLowerCase()}/${grant.slug}/checklist`} className="block w-full">
                      <Button variant="outline" className="w-full h-10 rounded-xl border-indigo-200 bg-white text-xs font-semibold text-indigo-700 shadow-2xs hover:bg-indigo-50/80 transition">
                        <CheckSquare className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
                        Printable Application Checklist
                      </Button>
                    </Link>
                    <Link href="/register" className="block w-full">
                      <Button className="w-full h-10 rounded-xl bg-slate-900 text-xs font-semibold text-white shadow-sm hover:bg-indigo-600 transition">
                        Pre-Check My Idea Free
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    <div className="pt-1">
                      <ShareGrantButton
                        title={`${grant.grantName} (${grant.countryCode})`}
                        description={grant.summary || undefined}
                        slug={grant.slug}
                        countryCode={grant.countryCode}
                        pathType="detail"
                        variant="ghost"
                        className="w-full h-9 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 justify-center"
                        buttonText="Share This Grant"
                      />
                    </div>
                    <div className="text-center text-[11px] text-slate-400">
                      100% Free • No credit card required
                    </div>
                  </div>

                  {grant.officialUrl && (
                    <div className="mt-5 border-t border-slate-200/80 pt-4">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Official Agency Resources
                      </div>
                      <a
                        href={grant.officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-700 hover:border-indigo-300 hover:text-indigo-600 shadow-2xs transition"
                      >
                        <span className="truncate">Official Program Portal</span>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Helpful Tip Box */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs text-xs text-slate-600">
                  <span className="font-bold text-slate-900">Need 3 quotes?</span> Module D &amp; E include the built-in 3-Quote Concierge to generate compliant RFPs and attach assessor-ready supplier quotes.
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Modern SaaS Footer */}
      <MarketingFooter />
    </div>
  );
}
