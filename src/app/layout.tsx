import type { Metadata } from 'next';
import Script from 'next/script';
import { StripeSandboxBadge } from '@/components/ui/stripe-sandbox-badge';
import './globals.css';

const defaultSiteUrl =
  process.env.NEXT_PUBLIC_APP_URL || 'https://startuppreflight.com';

export const metadata: Metadata = {
  metadataBase: new URL(defaultSiteUrl),
  title: {
    default: 'Startup Preflight — Supportive Co-Founder & Blind-Spot Engine',
    template: '%s | Startup Preflight',
  },
  description:
    'Turn messy startup ideas into validated, bank-ready, and grant-ready business plans with localized tax, grant, and unit economics intelligence.',
  applicationName: 'Startup Preflight',
  keywords: [
    'startup business plan builder',
    'AI co-founder',
    'LEO grants Ireland',
    'Innovate UK smart grants',
    'customer validation survey builder',
    'startup preflight',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: defaultSiteUrl,
    siteName: 'Startup Preflight',
    title: 'Startup Preflight — Supportive Co-Founder & Blind-Spot Engine',
    description:
      'Turn messy startup ideas into validated, bank-ready, and grant-ready business plans with localized tax, grant, and unit economics intelligence.',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Startup Preflight — Supportive Co-Founder & Blind-Spot Engine',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Startup Preflight — Supportive Co-Founder & Blind-Spot Engine',
    description:
      'Turn messy startup ideas into validated, bank-ready, and grant-ready business plans with localized tax, grant, and unit economics intelligence.',
    images: ['/images/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/logo-mark.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/apple-icon.svg' }],
    shortcut: ['/favicon.svg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased print:bg-white">
        <StripeSandboxBadge />
        {children}
      </body>
      <Script
        strategy="afterInteractive"
        src="https://www.googletagmanager.com/gtag/js?id=G-VR82Q212X8"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', 'G-VR82Q212X8');
        `}
      </Script>
    </html>
  );
}
