import React from 'react';
import type { Metadata } from 'next';
import { db } from '@/db';
import { grantsDirectory } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { GrantsDirectoryClient } from '@/components/marketing/grants-directory-client';
import { MarketingHeader, MarketingFooter } from '@/components/marketing/marketing-layout-nav';
import type { GrantDirectoryRecord } from '@/app/actions/admin-grants';
import {
  ensureDefaultGrantsSeededInDb,
  getFallbackGrantRecords,
} from '@/lib/grants/ensure-grants';

export const revalidate = 3600; // Revalidate every hour (ISR)

export const metadata: Metadata = {
  title: 'Startup Grants & Funding Directory (Ireland & UK) | Startup Preflight',
  description:
    'Explore 20+ non-dilutive government grants, feasibility vouchers, R&D tax credits, and soft loans across Ireland and the UK. With real underwriting caps, eligible expense breakdowns, and 3-quote rules.',
  keywords: [
    'startup grants',
    'Irish startup grants',
    'LEO feasibility grant',
    'Enterprise Ireland PSSF',
    'UK startup loans',
    'Innovate UK Smart Grant',
    'SEIS tax relief',
    'government grant funding',
    'founder grants directory',
  ],
  alternates: {
    canonical: 'https://startuppreflight.com/grants',
  },
  openGraph: {
    title: 'Startup Grants & Funding Directory (Ireland & UK)',
    description:
      'Curated directory of Irish and UK government grants, vouchers, and startup funding programs with real eligibility criteria and underwriting guidance.',
    url: 'https://startuppreflight.com/grants',
    siteName: 'Startup Preflight',
    type: 'website',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Startup Grants & Funding Directory (Ireland & UK)',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Startup Grants & Funding Directory (Ireland & UK)',
    description:
      'Curated directory of Irish and UK government grants, vouchers, and startup funding programs with real eligibility criteria and underwriting guidance.',
    images: ['/images/og-image.png'],
  },
};

export default async function GrantsDirectoryPage() {
  let grants: GrantDirectoryRecord[] = [];

  try {
    await ensureDefaultGrantsSeededInDb();

    grants = await db
      .select()
      .from(grantsDirectory)
      .where(eq(grantsDirectory.status, 'ACTIVE'))
      .orderBy(desc(grantsDirectory.updatedAt));
  } catch (error) {
    console.error('[GrantsDirectoryPage] Database read error:', error);
  }

  // Resilient fallback: ensure the grants catalog is NEVER empty on live production
  if (!grants || grants.length === 0) {
    grants = getFallbackGrantRecords();
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      {/* Platform Header matching landing page */}
      <MarketingHeader active="grants" />

      <main className="flex-1">
        {/* HERO SECTION MATCHING LANDING PAGE VISUAL SYSTEM */}
        <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-white via-indigo-50/35 to-slate-50 px-4 pt-12 pb-14 sm:px-6 lg:pt-16 lg:pb-18">
          <div className="mx-auto max-w-4xl text-center">
            {/* Pill Badge */}
            <div className="inline-flex items-center justify-center gap-2 rounded-full border border-indigo-200 bg-white px-3.5 py-1 text-xs font-semibold text-indigo-950 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600" />
              </span>
              <span>🇪🇺 🇮🇪 🇬🇧 Live Startup Grants &amp; Tax Relief Catalog</span>
            </div>

            {/* Headline */}
            <h1 className="mx-auto mt-5 max-w-3xl text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:leading-[1.12]">
              Non-dilutive funding, grants &amp; vouchers{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                demystified for founders.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
              Explore government feasibility grants, prototype vouchers, R&amp;D tax credits, and soft loans across Ireland and the UK with plain-English eligibility caps and assessor checklists.
            </p>
          </div>
        </section>

        {/* DIRECTORY BROWSER AREA */}
        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
          <GrantsDirectoryClient initialGrants={grants} />
        </section>
      </main>

      {/* Platform Footer matching landing page */}
      <MarketingFooter />
    </div>
  );
}
