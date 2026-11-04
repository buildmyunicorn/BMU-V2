import type { Metadata } from 'next';
import React from 'react';
import { LandingPageExperience } from '@/components/marketing/landing-page-experience';
import { LandingSeoJsonLd } from '@/components/marketing/seo-json-ld';

export const metadata: Metadata = {
  title:
    'Startup Preflight Ireland 🇮🇪 — LEO Grants, Enterprise Ireland & Business Plan Builder',
  description:
    'Shape your startup idea and unlock €2,500 to €80,000+ in Irish startup grants. Build your LEO Feasibility, LEO Priming, Digital Voucher, New Frontiers & SURE-ready Business Plan and 36-month cashflow without spreadsheets.',
  keywords: [
    'LEO Feasibility Grant business plan',
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
      'Startup Preflight Ireland 🇮🇪 — Unlock LEO, Enterprise Ireland & SURE Startup Grants',
    description:
      'Turn your raw idea into an official Ireland LEO Application, verified customer survey proof, and 36-month cashflow forecast in plain English.',
    url: 'https://startuppreflight.com/ie',
    siteName: 'Startup Preflight Ireland',
    locale: 'en_IE',
    type: 'website',
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
