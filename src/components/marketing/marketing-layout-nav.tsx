import React from 'react';
import Link from 'next/link';
import { Globe2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/ui/brand-logo';
import { GlobalFeedbackButton } from '@/components/feedback/global-feedback-dialog';

export function MarketingHeader({ active = 'grants' }: { active?: string }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/70 bg-white/85 backdrop-blur-md">
      <div className="flex h-16 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Left: Clean Brand Wordmark */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <BrandLogo variant="full" size="sm" theme="light" />
        </Link>

        {/* Center: Modern Floating Pill Nav (Desktop) */}
        <nav className="hidden items-center gap-1 rounded-full border border-slate-200/80 bg-slate-100/70 p-1 text-xs font-medium text-slate-600 md:flex">
          <Link
            href="/#platform-preview"
            className="rounded-full px-3.5 py-1.5 transition hover:bg-white hover:text-slate-900 hover:shadow-2xs"
          >
            Product
          </Link>
          <Link
            href="/#why-preflight"
            className="rounded-full px-3.5 py-1.5 transition hover:bg-white hover:text-slate-900 hover:shadow-2xs"
          >
            Grants Covered
          </Link>
          <Link
            href="/#flagship-tools"
            className="rounded-full px-3.5 py-1.5 transition hover:bg-white hover:text-slate-900 hover:shadow-2xs"
          >
            Tools
          </Link>
          <Link
            href="/#how-it-works"
            className="rounded-full px-3.5 py-1.5 transition hover:bg-white hover:text-slate-900 hover:shadow-2xs"
          >
            12 Modules
          </Link>
          <Link
            href="/#pricing"
            className="rounded-full px-3.5 py-1.5 transition hover:bg-white hover:text-slate-900 hover:shadow-2xs"
          >
            Pricing
          </Link>
          <Link
            href="/grants"
            className={`rounded-full px-3.5 py-1.5 transition hover:shadow-2xs ${
              active === 'grants'
                ? 'bg-white font-semibold text-slate-900 shadow-2xs'
                : 'hover:bg-white hover:text-slate-900'
            }`}
          >
            Grants Directory
          </Link>
          <Link
            href="/about-founder"
            className="rounded-full px-3.5 py-1.5 transition hover:bg-white hover:text-slate-900 hover:shadow-2xs"
          >
            Founder
          </Link>
        </nav>

        {/* Right: Auth Actions */}
        <div className="flex items-center gap-2">
          <GlobalFeedbackButton variant="nav-link" />
          <Link
            href="/login"
            className="hidden px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:text-slate-900 sm:inline-block"
          >
            Sign In
          </Link>
          <Link href="/register">
            <Button
              size="sm"
              className="h-9 rounded-full bg-slate-900 px-4 text-xs font-semibold text-white shadow-2xs transition hover:bg-indigo-600"
            >
              Get Started Free
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-slate-900 bg-slate-950 text-slate-400">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          {/* Brand Column */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-2">
              <BrandLogo variant="full" size="sm" theme="dark" />
            </div>
            <p className="mt-3 max-w-sm text-xs leading-relaxed text-slate-400">
              The supportive co-founder &amp; blind-spot engine. Helping early-stage founders transform raw concepts into investor-ready plans, grant applications, and validated startups.
            </p>
            <div className="mt-4 text-xs text-slate-500">
              Direct founder line:{' '}
              <a href="mailto:hello@startuppreflight.com" className="hover:text-slate-300">
                hello@startuppreflight.com
              </a>
            </div>
          </div>

          {/* Regional Editions Column */}
          <div className="md:col-span-4">
            <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-white uppercase">
              <Globe2 className="h-3.5 w-3.5 text-indigo-400" />
              Regional Editions
            </div>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link href="/" className="transition hover:text-white">
                  🌍 Global — Startup Business Plan &amp; Financial Builder
                </Link>
              </li>
              <li>
                <Link href="/ie" className="transition hover:text-white">
                  🇮🇪 Ireland — LEO Grants, Enterprise Ireland &amp; SURE Builder
                </Link>
              </li>
              <li>
                <Link href="/uk" className="transition hover:text-white">
                  🇬🇧 United Kingdom — Start Up Loans, Innovate UK &amp; SEIS Builder
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links Column */}
          <div className="md:col-span-3">
            <div className="text-xs font-bold tracking-wider text-white uppercase">
              Platform &amp; Legal
            </div>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link href="/register" className="hover:text-white">
                  Start Module A Free
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white">
                  Founder Sign In
                </Link>
              </li>
              <li>
                <Link href="/grants" className="hover:text-white font-semibold text-indigo-400">
                  Startup Grants Directory
                </Link>
              </li>
              <li>
                <Link href="/about-founder" className="hover:text-white">
                  Meet the Founder
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-800/80 pt-6 text-center text-[11px] text-slate-500">
          © {new Date().getFullYear()} Startup Preflight. All rights reserved. Educational directory only. All grant trademarks belong to their respective agencies.
        </div>
      </div>
    </footer>
  );
}
