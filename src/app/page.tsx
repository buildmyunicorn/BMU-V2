import type { Metadata } from 'next';
import React from 'react';
import { LandingPageExperience } from '@/components/marketing/landing-page-experience';
import { LandingSeoJsonLd } from '@/components/marketing/seo-json-ld';

export const metadata: Metadata = {
  title:
    'Startup Preflight — Turn Your Startup Idea Into a Structured Business Plan',
  description:
    'Turn your raw startup idea into a stress-tested Business Plan, live customer validation survey, co-founder alignment heatmap, and 3-year financial model without spreadsheets.',
  keywords: [
    'AI business plan builder',
    'startup business plan generator',
    'validate startup idea',
    'no spreadsheet startup financial model',
    'co-founder alignment questions',
    'customer validation survey builder',
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
      'Startup Preflight — Your Supportive AI Co-Founder & Business Plan Engine',
    description:
      'Get your startup idea out of your head and into a structured, stress-tested Business Plan & 3-Year Financial Model without touching a blank spreadsheet.',
    url: 'https://startuppreflight.com',
    siteName: 'Startup Preflight',
    locale: 'en_US',
    type: 'website',
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
