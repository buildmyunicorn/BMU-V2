import React from 'react';
import {
  getFaqsForEdition,
  type FaqItem,
} from '@/components/marketing/landing-faqs';
import type { LandingEdition } from '@/components/marketing/platform-ui-previews';

export function LandingSeoJsonLd({ edition }: { edition: LandingEdition }) {
  const faqs: FaqItem[] = getFaqsForEdition(edition);

  const currency =
    edition === 'IE' ? 'EUR' : edition === 'UK' ? 'GBP' : 'USD';
  const soloPrice =
    edition === 'IE' ? '79.00' : edition === 'UK' ? '69.00' : '89.00';
  const cofounderPrice =
    edition === 'IE' ? '129.00' : edition === 'UK' ? '109.00' : '139.00';
  const cohortPrice =
    edition === 'IE' ? '1475.00' : edition === 'UK' ? '1275.00' : '1595.00';
  const pageUrl =
    edition === 'IE'
      ? 'https://startuppreflight.com/ie'
      : edition === 'UK'
        ? 'https://startuppreflight.com/uk'
        : 'https://startuppreflight.com/';

  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name:
      edition === 'IE'
        ? 'Startup Preflight Ireland — LEO & Enterprise Ireland Business Plan Builder'
        : edition === 'UK'
          ? 'Startup Preflight UK — Start Up Loans, Innovate UK & SEIS Plan Builder'
          : 'Startup Preflight — AI Co-Founder & No-Spreadsheet Business Plan Builder',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: pageUrl,
    description:
      edition === 'IE'
        ? 'Turn your raw startup idea into a verified Ireland LEO Feasibility, LEO Priming, Enterprise Ireland New Frontiers, or SURE-ready business plan and 36-month cashflow.'
        : edition === 'UK'
          ? 'Turn your raw startup idea into a British Business Bank Start Up Loans 4-Part Workbook, Personal Survival Budget, Innovate UK 9-Question application, or HMRC SEIS Advance Assurance pack.'
          : 'Turn your raw startup idea into a stress-tested, structured Business Plan, hosted customer validation survey, co-founder alignment heatmap, and 36-month financial model without spreadsheets.',
    offers: [
      {
        '@type': 'Offer',
        name: 'Starter Tier (Module A — Free Forever)',
        price: '0.00',
        priceCurrency: currency,
        description: 'Free ideation canvas, customer storyboard, domain availability check and Things to Consider AI review.',
      },
      {
        '@type': 'Offer',
        name: 'Solo Founder 6-Month Program (Modules A–L)',
        price: soloPrice,
        priceCurrency: currency,
        description: 'Structured 6-month grant-readiness program for 1 founder: live surveys, 3-year cashflow, breakeven engine, and official grant exports.',
      },
      {
        '@type': 'Offer',
        name: 'Co-Founder & Team Program (3 Venture Tracks • 3 Seats)',
        price: cofounderPrice,
        priceCurrency: currency,
        description: 'Multi-seat 6-month program for co-founder teams: 12 awkward questions blind alignment survey, clone/pivot engine, and shared workspace.',
      },
      {
        '@type': 'Offer',
        name: 'Accelerator & Cohort Batch Program (25 Founder Seats)',
        price: cohortPrice,
        priceCurrency: currency,
        description: 'Institutional batch program for accelerators and incubators: 25 all-access founder seats, real-time Director Command Center, and batch grant audit.',
      },
    ],
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Startup Preflight',
    url: 'https://startuppreflight.com',
    foundingDate: '2026',
    email: 'hello@startuppreflight.com',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Dublin',
      addressCountry: 'IE',
    },
    sameAs: ['https://www.linkedin.com/in/twalsh-start-ups/'],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
    </>
  );
}
