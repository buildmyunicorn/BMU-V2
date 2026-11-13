import type { Metadata } from 'next';
import React from 'react';
import { LandingPageExperience } from '@/components/marketing/landing-page-experience';
import { LandingSeoJsonLd } from '@/components/marketing/seo-json-ld';

export const metadata: Metadata = {
  title:
    'Startup Preflight Ireland 🇮🇪 — 6-Month Program for LEO & Enterprise Ireland Grants',
  description:
    'Join the 6-month program to unlock €2,500 to €80,000+ in Irish startup grants. Build your LEO Feasibility, LEO Priming, Digital Voucher, New Frontiers & SURE-ready application and 36-month cashflow without spreadsheets.',
  keywords: [
    'LEO Feasibility Grant program',
    'Irish startup grant program',
    'LEO Priming Grant application Ireland',
    'Local Enterprise Office grant template',
    'Enterprise Ireland New Frontiers application',
    'SURE tax refund startup Ireland',
    'LEO Digital for Business voucher',
    'Irish startup business plan builder',
    'LEO 3 quote rule',
  ],
  alternates: {
    canonical: 'https://startuppreflight.com/ie',
    languages: {
      'x-default': 'https://startuppreflight.com',
      en: 'https://startuppreflight.com',
      'en-IE': 'https://startuppreflight.com/ie',
      'en-GB': 'https://startuppreflight.com/uk',
    },
  },
  openGraph: {
    title:
      'Startup Preflight Ireland 🇮🇪 — 6-Month Program for Irish Startup Grants',
    description:
      'Join the 6-month program to get your startup LEO and Enterprise Ireland grant-ready with verified customer survey proof and 36-month cashflow forecast in plain English.',
    url: 'https://startuppreflight.com/ie',
    siteName: 'Startup Preflight Ireland',
    locale: 'en_IE',
    type: 'website',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Startup Preflight Ireland — 6-Month Grant Readiness Program',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title:
      'Startup Preflight Ireland 🇮🇪 — 6-Month Program for Irish Startup Grants',
    description:
      'Join the 6-month program to get your startup LEO and Enterprise Ireland grant-ready with verified customer survey proof and 36-month cashflow forecast in plain English.',
    images: ['/images/og-image.png'],
  },
};

export default function IrelandLandingPage() {
  return (
    <>
      <LandingSeoJsonLd edition="IE" />
      <LandingPageExperience edition="IE" />
    </>
  );
}
