import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Build My Unicorn (BMU) 2.0 — Supportive Co-Founder & Blind-Spot Engine',
  description:
    'Turn messy startup ideas into validated, bank-ready, and grant-ready business plans with localized tax, grant, and unit economics intelligence.',
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
    </html>
  );
}
