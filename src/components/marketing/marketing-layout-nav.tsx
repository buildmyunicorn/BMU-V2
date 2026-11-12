'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Globe2, ArrowRight, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/ui/brand-logo';
import { GlobalFeedbackButton } from '@/components/feedback/global-feedback-dialog';
import { logoutFounderAction } from '@/app/actions/auth';
import { clearActiveBmuSession } from '@/lib/auth/session-store';

export type RegionalEdition = 'GLOBAL' | 'IE' | 'UK';

export interface MarketingHeaderProps {
  active?: 'product' | 'grants-covered' | 'tools' | 'modules' | 'pricing' | 'grants' | 'founder' | 'cohorts' | string;
  edition?: RegionalEdition;
  onSwitchEdition?: (edition: RegionalEdition) => void;
}

export function MarketingHeader({
  active: activeProp,
  edition: editionProp,
  onSwitchEdition,
}: MarketingHeaderProps = {}) {
  const pathname = usePathname() || '/';
  const [activeItem, setActiveItem] = useState<string>(activeProp || '');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Regional edition state
  const [currentEdition, setCurrentEdition] = useState<RegionalEdition>(() => {
    if (editionProp) return editionProp;
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path === '/ie' || path.startsWith('/ie/')) return 'IE';
      if (path === '/uk' || path.startsWith('/uk/')) return 'UK';
      const match = document.cookie.match(/(?:^|; )spf_region=([^;]*)/);
      const val = match ? decodeURIComponent(match[1]) : window.localStorage.getItem('spf_region');
      if (val === 'IE') return 'IE';
      if (val === 'GB' || val === 'UK') return 'UK';
    }
    return 'GLOBAL';
  });

  useEffect(() => {
    if (editionProp) {
      setCurrentEdition(editionProp);
    }
  }, [editionProp]);

  // Synchronize active navigation item
  useEffect(() => {
    if (activeProp) {
      setActiveItem(activeProp);
      return;
    }

    if (pathname.startsWith('/grants')) {
      setActiveItem('grants');
      return;
    }
    if (pathname === '/about-founder') {
      setActiveItem('founder');
      return;
    }
    if (pathname === '/cohorts') {
      setActiveItem('cohorts');
      return;
    }

    const isLanding = pathname === '/' || pathname === '/ie' || pathname === '/uk';
    if (!isLanding) {
      setActiveItem('');
      return;
    }

    const sectionIds = [
      { id: 'pricing', key: 'pricing' },
      { id: 'how-it-works', key: 'modules' },
      { id: 'flagship-tools', key: 'tools' },
      { id: 'why-preflight', key: 'grants-covered' },
      { id: 'platform-preview', key: 'product' },
    ];

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
      let matched = '';

      for (const section of sectionIds) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            matched = section.key;
            break;
          }
        }
      }

      setActiveItem(matched);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname, activeProp]);

  const handleEditionClick = (target: RegionalEdition) => {
    setCurrentEdition(target);
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('spf_edition_manual', target);
      const regionCode = target === 'IE' ? 'IE' : target === 'UK' ? 'GB' : 'US';
      document.cookie = `spf_region=${regionCode}; path=/; max-age=7776000; SameSite=Lax`;
      document.cookie = `bmu_region=${regionCode}; path=/; max-age=7776000; SameSite=Lax`;
      window.localStorage.setItem('spf_region', regionCode);
    }
    if (onSwitchEdition) {
      onSwitchEdition(target);
    }
  };

  const isLandingPage = pathname === '/' || pathname === '/ie' || pathname === '/uk';
  const homePrefix = currentEdition === 'IE' ? '/ie' : currentEdition === 'UK' ? '/uk' : '/';

  const getSectionHref = (sectionId: string) => {
    if (isLandingPage) {
      return `#${sectionId}`;
    }
    return `${homePrefix === '/' ? '' : homePrefix}/#${sectionId}`;
  };

  const grantsCoveredLabel =
    currentEdition === 'IE'
      ? 'Irish Grants'
      : currentEdition === 'UK'
        ? 'UK Grants & Loans'
        : 'Why Preflight';

  const navItems = [
    { key: 'product', label: 'Product', href: getSectionHref('platform-preview'), isAnchor: isLandingPage },
    { key: 'grants-covered', label: grantsCoveredLabel, href: getSectionHref('why-preflight'), isAnchor: isLandingPage },
    { key: 'tools', label: 'Tools', href: getSectionHref('flagship-tools'), isAnchor: isLandingPage },
    { key: 'modules', label: '12 Modules', href: getSectionHref('how-it-works'), isAnchor: isLandingPage },
    { key: 'pricing', label: 'Pricing', href: getSectionHref('pricing'), isAnchor: isLandingPage },
    { key: 'grants', label: 'Grants Directory', href: '/grants', isAnchor: false },
    { key: 'founder', label: 'Founder', href: '/about-founder', isAnchor: false },
    { key: 'cohorts', label: 'Cohorts', href: '/cohorts', isAnchor: false },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/70 bg-white/85 backdrop-blur-md">
      <div className="flex h-16 w-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Left: Clean Brand Wordmark */}
        <Link href={homePrefix} className="flex shrink-0 items-center gap-2.5">
          <BrandLogo variant="full" size="sm" theme="light" />
        </Link>

        {/* Center: Modern Floating Pill Nav (Desktop) */}
        <nav className="hidden items-center gap-1 rounded-full border border-slate-200/80 bg-slate-100/70 p-1 text-xs font-medium text-slate-600 lg:flex">
          {navItems.map((item) => {
            const isActive = activeItem === item.key;
            const className = `rounded-full px-2.5 py-1.5 xl:px-3.5 transition text-xs ${
              isActive
                ? 'bg-white font-semibold text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-2xs'
            }`;

            if (item.isAnchor) {
              return (
                <a key={item.key} href={item.href} className={className}>
                  {item.label}
                </a>
              );
            }

            return (
              <Link key={item.key} href={item.href} className={className}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Edition Switcher + Feedback + Auth Actions */}
        <div className="flex items-center gap-2">
          {/* Compact Regional Edition Switcher */}
          <div
            className="hidden items-center rounded-full border border-slate-200 bg-slate-100/80 p-0.5 text-[11px] font-semibold sm:flex"
            aria-label="Select regional edition"
          >
            <Link
              href="/"
              onClick={() => handleEditionClick('GLOBAL')}
              className={`rounded-full px-2.5 py-1 transition ${
                currentEdition === 'GLOBAL'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Global Edition (Business Plan Builder)"
            >
              🌍 Global
            </Link>
            <Link
              href="/ie"
              onClick={() => handleEditionClick('IE')}
              className={`rounded-full px-2.5 py-1 transition ${
                currentEdition === 'IE'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Ireland Edition (LEO & Enterprise Ireland Grants)"
            >
              🇮🇪 IE
            </Link>
            <Link
              href="/uk"
              onClick={() => handleEditionClick('UK')}
              className={`rounded-full px-2.5 py-1 transition ${
                currentEdition === 'UK'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="UK Edition (Start Up Loans, Innovate UK & SEIS)"
            >
              🇬🇧 UK
            </Link>
          </div>

          <GlobalFeedbackButton variant="nav-link" />

          <Link
            href="/login"
            onClick={() => {
              clearActiveBmuSession();
              logoutFounderAction().catch(() => {});
            }}
            className="hidden px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:text-slate-900 sm:inline-block"
          >
            Sign In
          </Link>

          <Link href="/register">
            <Button
              size="sm"
              className="h-9 rounded-full bg-slate-900 px-4 text-xs font-semibold text-white shadow-2xs transition hover:bg-emerald-700"
            >
              Get Started Free
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </Link>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 lg:hidden"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Clean Mobile / Tablet Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 shadow-lg lg:hidden">
          <div className="flex flex-col space-y-1 text-sm font-medium text-slate-700">
            {navItems.map((item) => {
              const isActive = activeItem === item.key;
              const className = `rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? 'bg-emerald-50 font-semibold text-emerald-800'
                  : 'text-slate-700 hover:bg-slate-100'
              }`;

              if (item.isAnchor) {
                return (
                  <a
                    key={item.key}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={className}
                  >
                    {item.label}
                  </a>
                );
              }

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={className}
                >
                  {item.label}
                </Link>
              );
            })}

            <div className="px-3 py-2">
              <GlobalFeedbackButton variant="nav-link" />
            </div>

            <Link
              href="/login"
              onClick={() => {
                setMobileMenuOpen(false);
                clearActiveBmuSession();
                logoutFounderAction().catch(() => {});
              }}
              className="rounded-lg px-3 py-2 font-semibold text-emerald-800 hover:bg-emerald-50"
            >
              Sign In →
            </Link>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3">
            <div className="mb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Regional Edition
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-center text-xs font-semibold">
              <Link
                href="/"
                onClick={() => {
                  handleEditionClick('GLOBAL');
                  setMobileMenuOpen(false);
                }}
                className={`rounded-lg py-2 transition ${
                  currentEdition === 'GLOBAL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                🌍 Global
              </Link>
              <Link
                href="/ie"
                onClick={() => {
                  handleEditionClick('IE');
                  setMobileMenuOpen(false);
                }}
                className={`rounded-lg py-2 transition ${
                  currentEdition === 'IE'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                🇮🇪 IE
              </Link>
              <Link
                href="/uk"
                onClick={() => {
                  handleEditionClick('UK');
                  setMobileMenuOpen(false);
                }}
                className={`rounded-lg py-2 transition ${
                  currentEdition === 'UK'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                🇬🇧 UK
              </Link>
            </div>
          </div>
        </div>
      )}
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
              <Globe2 className="h-3.5 w-3.5 text-emerald-400" />
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
                <Link href="/grants" className="hover:text-white font-semibold text-emerald-400">
                  Startup Grants Directory
                </Link>
              </li>
              <li>
                <Link href="/cohorts" className="hover:text-white font-semibold text-emerald-300">
                  Preflight for Accelerators &amp; Cohorts
                </Link>
              </li>
              <li>
                <Link href="/about-founder" className="hover:text-white">
                  Meet the Founder
                </Link>
              </li>
              <li>
                <Link href="/media-kit" className="hover:text-white">
                  Media Kit &amp; Press Assets
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
