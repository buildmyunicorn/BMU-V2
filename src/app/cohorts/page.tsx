import React from 'react';
import type { Metadata } from 'next';
import { CohortsPageClient } from '@/components/marketing/cohorts-page-client';

export const metadata: Metadata = {
  title: 'Preflight for Accelerators & Cohorts | Batch Management & Business Plan OS',
  description:
    'The institutional operating system for startup accelerators, university incubators, and enterprise agencies. Standardize 20+ startups on a 12-module blueprint, monitor cohort health in real-time, and pre-screen Ireland & UK grant applications. Starting at €1,475 for 25 seats.',
  keywords: [
    'accelerator software',
    'incubator portfolio management',
    'cohort licensing',
    'startup batch operating system',
    'accelerator curriculum platform',
    'university venture lab software',
    'LEO feasibility cohort platform',
    'Enterprise Ireland New Frontiers tool',
    'Innovate UK smart grant accelerator',
    'batch progress tracker',
    'founder business plan reviewer',
    'co-founder alignment survey',
    'startup readiness scorecard',
    'pre-accelerator tools',
    'venture studio software',
    'early-stage startup validation platform',
  ],
  alternates: {
    canonical: 'https://startuppreflight.com/cohorts',
  },
  openGraph: {
    title: 'Preflight for Accelerators & Cohorts — Batch Management & Underwriting OS',
    description:
      'The operating system for startup accelerators, incubators, and enterprise agencies. Standardize business plans across your batch, catch team disputes before Demo Day, and pre-screen grant compliance. Starting at €1,475 for 25 seats.',
    url: 'https://startuppreflight.com/cohorts',
    siteName: 'Startup Preflight',
    locale: 'en_IE',
    type: 'website',
    images: [
      {
        url: 'https://startuppreflight.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Startup Preflight for Accelerators, Incubators & Cohorts',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Preflight for Accelerators & Cohorts — Batch Management & Underwriting OS',
    description:
      'The structured operating system for accelerator cohorts, university incubators, and enterprise agencies. Track batch progress, validation proof, and grant readiness. Starting at €1,475 for 25 seats.',
    images: ['https://startuppreflight.com/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'business',
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://startuppreflight.com',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Preflight for Accelerators & Cohorts',
      item: 'https://startuppreflight.com/cohorts',
    },
  ],
};

const softwareApplicationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Startup Preflight for Accelerators & Cohorts',
  operatingSystem: 'Cloud / Web Browser',
  applicationCategory: 'BusinessApplication',
  url: 'https://startuppreflight.com/cohorts',
  description:
    'A standardized cohort operating system and portfolio management platform for startup accelerators, university incubators, and enterprise development agencies across Ireland and the UK.',
  offers: [
    {
      '@type': 'Offer',
      name: 'Standard Cohort Batch (25 Founder Seats)',
      price: '1475.00',
      priceCurrency: 'EUR',
      description: 'Complete 25-founder accelerator batch license: all 12 modules for each startup, real-time Director Command Center, and batch grant audit.',
      availability: 'https://schema.org/InStock',
    },
    {
      '@type': 'Offer',
      name: 'Scale Cohort Batch (50 Founder Seats)',
      price: '2650.00',
      priceCurrency: 'EUR',
      description: '50-founder dual-track batch license with live mentor calibration workshop and consolidated funder reporting.',
      availability: 'https://schema.org/InStock',
    },
    {
      '@type': 'Offer',
      name: 'Annual Multi-Batch Portfolio License',
      price: '4500.00',
      priceCurrency: 'EUR',
      description: 'Unlimited rolling cohorts across the academic/program year with customized grant rubrics and dedicated partner support.',
      availability: 'https://schema.org/InStock',
    },
  ],
  provider: {
    '@type': 'Organization',
    name: 'Startup Preflight',
    url: 'https://startuppreflight.com',
    logo: 'https://startuppreflight.com/logo.png',
    sameAs: [
      'https://www.linkedin.com/in/twalsh-start-ups/',
    ],
  },
};

const faqPageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How much does cohort licensing cost and how does procurement work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Cohort licensing starts at €1,475 (£1,275 / $1,595) for a full 25-founder batch, which includes all 12 modules for every startup, the real-time Director Command Center, and batch grant audits. Because the investment is under €2,000, it readily qualifies for fast-track departmental credit card or single-signoff purchase order approval without lengthy public tender delays.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do our founders access Startup Preflight?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We issue a single, branded institutional voucher code (e.g. UCD-SUMMER27 or LEO-DUBLIN-BATCH). Founders simply visit startuppreflight.com/redeem, enter the code, and immediately unlock all 12 modules without needing to enter credit card details.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does this replace our program mentors?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Not at all — it multiplies their impact. Instead of mentors spending their limited sessions deciphering messy 40-page Word documents or debugging broken Excel spreadsheets, founders arrive with structured concept canvases, verified competitor wedges, customer survey evidence, and formatted 3-year cashflows.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can our cohort startups export official government grant applications?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Startup Preflight compiles data directly into the official Ireland Local Enterprise Office (LEO) Feasibility & Priming Forms (and Appendices A–F), the UK Innovate UK 9-question IFS format, and the British Business Bank Start Up Loans 4-part workbook.',
      },
    },
    {
      '@type': 'Question',
      name: 'What happens to the founders after the cohort ends?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Founders retain permanent free read-only access to their validated business plan vault, survey responses, and financial models. They can reference or share their plan anytime as they scale, or choose to keep it live with our micro-subscription.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can we test the platform before committing our cohort?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. When you submit an inquiry, we will provision a full-access demo sandbox for your program directors and lead mentors to review all 12 modules, survey tools, and grant export features firsthand.',
      },
    },
  ],
};

export default function CohortsPage() {
  return (
    <>
      {/* Search Engine Structured Data Schemas (JSON-LD) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageJsonLd) }}
      />

      <CohortsPageClient />
    </>
  );
}
