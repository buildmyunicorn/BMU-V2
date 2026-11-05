import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'Startup Preflight — Supportive Co-Founder & Blind-Spot Engine',
  description:
    'Turn messy startup ideas into validated, bank-ready, and grant-ready business plans with localized tax, grant, and unit economics intelligence.',
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
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
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
