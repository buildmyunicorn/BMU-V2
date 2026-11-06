import type { Metadata } from 'next';
import React from 'react';
import { getPublicSurveyBySlugAction } from '@/app/actions/module-c';

interface SurveyLayoutProps {
  params: Promise<{
    slug: string;
  }>;
  children: React.ReactNode;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cleanSlug = decodeURIComponent(slug).trim().slice(0, 140);

  try {
    const res = await getPublicSurveyBySlugAction(cleanSlug);
    if (res.found && res.survey) {
      const survey = res.survey;
      const startupName = survey.planTitle || 'Startup Concept';
      const surveyTitle = survey.title || `${startupName} Customer Survey`;
      const description =
        survey.introDescription ||
        `Help shape ${startupName} by taking a 60-second bias-free customer feedback survey.`;

      const pageUrl = `https://startuppreflight.com/v/${cleanSlug}`;

      return {
        title: `${surveyTitle} — Customer Survey`,
        description,
        alternates: {
          canonical: pageUrl,
        },
        openGraph: {
          type: 'website',
          locale: 'en_US',
          url: pageUrl,
          siteName: 'Startup Preflight',
          title: `${surveyTitle} | Quick Feedback Survey`,
          description,
          images: [
            {
              url: '/images/og-image.png',
              width: 1200,
              height: 630,
              alt: `${surveyTitle} on Startup Preflight`,
              type: 'image/png',
            },
          ],
        },
        twitter: {
          card: 'summary_large_image',
          title: `${surveyTitle} | Quick Feedback Survey`,
          description,
          images: ['/images/og-image.png'],
        },
      };
    }
  } catch (err) {
    console.error('[generateMetadata:v/[slug]] Error fetching survey metadata:', err);
  }

  return {
    title: 'Customer Feedback Survey | Startup Preflight',
    description:
      'Help shape a new startup idea by taking a fast 60-second customer feedback survey.',
    openGraph: {
      type: 'website',
      siteName: 'Startup Preflight',
      title: 'Customer Feedback Survey | Startup Preflight',
      description:
        'Help shape a new startup idea by taking a fast 60-second customer feedback survey.',
      images: [
        {
          url: '/images/og-image.png',
          width: 1200,
          height: 630,
          alt: 'Startup Preflight Customer Survey',
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Customer Feedback Survey | Startup Preflight',
      description:
        'Help shape a new startup idea by taking a fast 60-second customer feedback survey.',
      images: ['/images/og-image.png'],
    },
  };
}

export default function SurveyLayout({ children }: SurveyLayoutProps) {
  return <>{children}</>;
}
