import React from 'react';
import type { Metadata } from 'next';
import { CohortsPageClient } from '@/components/marketing/cohorts-page-client';

export const metadata: Metadata = {
  title: 'Preflight for Accelerators, Incubators & Cohorts | Startup Preflight',
  description:
    'The structured operating system for startup cohorts, university incubators, and enterprise agencies. Standardize business plans, run live customer validation, and pre-screen Ireland & UK grant applications for your entire batch.',
  keywords: [
    'accelerator software',
    'incubator platform',
    'cohort licensing',
    'university venture lab software',
    'startup batch operating system',
    'accelerator curriculum platform',
    'LEO feasibility cohort platform',
    'Enterprise Ireland New Frontiers tool',
    'Innovate UK smart grant accelerator',
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
    title: 'Preflight for Accelerators & Cohorts — Startup Preflight',
    description:
      'Turn raw founder ideas into investment and grant-ready businesses. Standardize business plans, run live customer validation, and track batch progress in real-time.',
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
    title: 'Preflight for Accelerators & Cohorts — Startup Preflight',
    description:
      'The structured operating system for accelerator cohorts, university incubators, and enterprise agencies. Track batch progress, validation proof, and grant readiness.',
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
    'A standardized cohort operating system and business planning platform for startup accelerators, university incubators, and enterprise development agencies across Ireland and the UK.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
    description: 'Custom institutional cohort and batch licensing based on intake size and program requirements',
    availability: 'https://schema.org/InStock',
  },
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
