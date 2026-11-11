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
      },
      {
        '@type': 'Offer',
        name: 'Solo Founder 6-Month Pass (Modules A–L)',
        price: soloPrice,
        priceCurrency: currency,
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
