import type { Metadata } from 'next';
import React from 'react';
import { LandingPageExperience } from '@/components/marketing/landing-page-experience';
import { LandingSeoJsonLd } from '@/components/marketing/seo-json-ld';

export const metadata: Metadata = {
  title:
    'Startup Preflight — 6-Month Program to Get Your Startup Funded & Grant-Ready',
  description:
    'Join the self-guided 6-month program to turn your raw startup idea into a stress-tested venture dossier, live customer validation, co-founder alignment heatmap, and 3-year financial model.',
  keywords: [
    'startup readiness program',
    'grant readiness program',
    'validate startup idea',
    'no spreadsheet startup financial model',
    'co-founder alignment questions',
    'customer validation survey builder',
    'AI business plan builder',
    'startup preflight',
  ],
  alternates: {
    canonical: 'https://startuppreflight.com',
    languages: {
      'x-default': 'https://startuppreflight.com',
      en: 'https://startuppreflight.com',
      'en-IE': 'https://startuppreflight.com/ie',
      'en-GB': 'https://startuppreflight.com/uk',
    },
  },
  openGraph: {
    title:
      'Startup Preflight — 6-Month Program to Get You Funded & Grant-Ready',
    description:
      'Join the structured 6-month program. Validate real demand, model 3-year cashflow, and build an investor-grade venture without spreadsheets.',
    url: 'https://startuppreflight.com',
    siteName: 'Startup Preflight',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Startup Preflight — 6-Month Program to Get Funded & Grant-Ready',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title:
      'Startup Preflight — 6-Month Program to Get You Funded & Grant-Ready',
    description:
      'Join the structured 6-month program. Validate real demand, model 3-year cashflow, and build an investor-grade venture without spreadsheets.',
    images: ['/images/og-image.png'],
  },
};

export default function GlobalLandingPage() {
  return (
    <>
      <LandingSeoJsonLd edition="GLOBAL" />
      <LandingPageExperience edition="GLOBAL" />
    </>
  );
}
