import type { Metadata } from 'next';
import { AppSumoClientPage } from './appsumo-client-page';

export const metadata: Metadata = {
  title: 'Startup Preflight × AppSumo Lifetime Deal | Turn Ideas Into Validated Business Plans',
  description:
    'Exclusive AppSumo Lifetime Deal: Get lifetime access to Startup Preflight — the 12-module AI Business Plan, Customer Survey, Co-Founder Alignment & 3-Year Pocket Profit Engine. Stack up to 2 codes.',
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: 'Startup Preflight — AppSumo Lifetime Deal ($59 Once)',
    description:
      'Replace 4 startup subscriptions with one lifetime deal: Idea Stress-Tester, Mom-Test Survey & Waitlist Engine, Co-Founder Alignment, and 3-Year Pocket Profit & Business Plan Compiler.',
    type: 'website',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Startup Preflight AppSumo Deal',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Startup Preflight — AppSumo Lifetime Deal ($59 Once)',
    description:
      'Replace 4 startup subscriptions with one lifetime deal: Idea Stress-Tester, Mom-Test Survey & Waitlist Engine, Co-Founder Alignment, and 3-Year Pocket Profit & Business Plan Compiler.',
    images: ['/images/og-image.png'],
  },
};

export default function AppSumoPage() {
  return <AppSumoClientPage />;
}
