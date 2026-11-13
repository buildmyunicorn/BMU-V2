import type { Metadata } from 'next';
import React from 'react';
import { LandingPageExperience } from '@/components/marketing/landing-page-experience';
import { LandingSeoJsonLd } from '@/components/marketing/seo-json-ld';

export const metadata: Metadata = {
  title:
    'Startup Preflight UK 🇬🇧 — 6-Month Program for Start Up Loans & Innovate UK Grants',
  description:
    'Join the 6-month program to unlock British Business Bank Start Up Loans (up to £25,000), Innovate UK Smart Grants (9-Question format), and HMRC SEIS/EIS Advance Assurance with a guided 36-month cashflow and Personal Survival Budget.',
  keywords: [
    'UK startup grant program',
    'British Business Bank Start Up Loans program',
    'Personal Survival Budget template UK',
    'Innovate UK Smart Grant 9 questions',
    'HMRC SEIS Advance Assurance business plan',
    'EIS business plan template UK',
    'UK startup grant matcher',
    'UK startup business plan builder',
  ],
  alternates: {
    canonical: 'https://startuppreflight.com/uk',
    languages: {
      'x-default': 'https://startuppreflight.com',
      en: 'https://startuppreflight.com',
      'en-IE': 'https://startuppreflight.com/ie',
      'en-GB': 'https://startuppreflight.com/uk',
    },
  },
  openGraph: {
    title:
      'Startup Preflight UK 🇬🇧 — 6-Month Program for UK Loans, Innovate UK & SEIS',
    description:
      'Join the 6-month program to get your startup loan- and grant-ready: UK Start Up Loans 4-Part Workbook, Personal Survival Budget, Innovate UK 9-Question pack, and HMRC SEIS Advance Assurance.',
    url: 'https://startuppreflight.com/uk',
    siteName: 'Startup Preflight UK',
    locale: 'en_GB',
    type: 'website',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Startup Preflight UK — 6-Month Startup Funding & Grant Program',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title:
      'Startup Preflight UK 🇬🇧 — 6-Month Program for UK Loans, Innovate UK & SEIS',
    description:
      'Join the 6-month program to get your startup loan- and grant-ready: UK Start Up Loans 4-Part Workbook, Personal Survival Budget, Innovate UK 9-Question pack, and HMRC SEIS Advance Assurance.',
    images: ['/images/og-image.png'],
  },
};

export default function UkLandingPage() {
  return (
    <>
      <LandingSeoJsonLd edition="UK" />
      <LandingPageExperience edition="UK" />
    </>
  );
}
