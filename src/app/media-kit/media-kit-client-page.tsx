'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Download,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Layers,
  Users,
  Compass,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  FileText,
  Mail,
  Linkedin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MarketingHeader, MarketingFooter } from '@/components/marketing/marketing-layout-nav';

export default function MediaKitClientPage() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const brandColors = [
    { name: 'Indigo 600 (Primary)', hex: '#4F46E5', class: 'bg-[#4F46E5] text-white' },
    { name: 'Violet 600 (Accent)', hex: '#7C3AED', class: 'bg-[#7C3AED] text-white' },
    { name: 'Emerald 600 (Success)', hex: '#059669', class: 'bg-[#059669] text-white' },
    { name: 'Slate 900 (Dark)', hex: '#0F172A', class: 'bg-[#0F172A] text-white' },
    { name: 'Slate 50 (Background)', hex: '#F8FAFC', class: 'bg-[#F8FAFC] text-slate-900 border border-slate-200' },
  ];

  const brandAssets = [
    {
      title: 'Horizontal Logo (Dark on Transparent)',
      description: 'Primary full horizontal logo with brandmark and wordmark. Best for light backgrounds.',
      fileUrl: '/appsumo-assets/startup-preflight-logo-horizontal.png',
      format: 'PNG (900x208)',
      size: '~23 KB',
    },
    {
      title: 'Horizontal Logo (White on Transparent)',
      description: 'Alternative white wordmark logo for dark or colored backgrounds.',
      fileUrl: '/appsumo-assets/startup-preflight-logo-horizontal-white.png',
      format: 'PNG (900x208)',
      size: '~23 KB',
    },
    {
      title: 'Brand Icon / Avatar (Square)',
      description: 'Aerodynamic kite brandmark icon. Ideal for profile avatars and app icons.',
      fileUrl: '/appsumo-assets/startup-preflight-icon-512x512.png',
      format: 'PNG (512x512)',
      size: '~36 KB',
    },
    {
      title: 'Vector Brandmark (SVG)',
      description: 'Infinite-resolution scalable vector graphic of the official logo mark.',
      fileUrl: '/appsumo-assets/startup-preflight-icon.svg',
      format: 'SVG Vector',
      size: '~2.2 KB',
    },
  ];

  const screenshots = [
    {
      title: '01. Platform Overview & 3-Year Pocket Profit',
      description: 'Dashboard showing the dual-axis breakeven graph, customer crossover numbers, and AI blind-spot engine.',
      fileUrl: '/appsumo-assets/01-hero-headline-1920x1080.png',
      dimensions: '1920x1080 (16:9)',
    },
    {
      title: '02. Customer Surveys & Early Waitlist (Mod C)',
      description: 'Mom-Test bias-free survey builder, public link generation (/v/[slug]), and AI sentiment synthesizer.',
      fileUrl: '/appsumo-assets/02-customer-survey-waitlist-1920x1080.png',
      dimensions: '1920x1080 (16:9)',
    },
    {
      title: '03. Co-Founder Alignment & Equity Split (Mod F)',
      description: 'Blind-reveal 12 awkward questions survey, side-by-side alignment heatmap, and 4-year vesting calculator.',
      fileUrl: '/appsumo-assets/03-cofounder-alignment-1920x1080.png',
      dimensions: '1920x1080 (16:9)',
    },
    {
      title: '04. Living Business Plan & Pre-Flight AI Audit (Mod L)',
      description: '94/100 Investor & Lender Readiness Score, automated narrative-to-financial cross-check, and PDF compiler.',
      fileUrl: '/appsumo-assets/04-business-plan-compiler-1920x1080.png',
      dimensions: '1920x1080 (16:9)',
    },
    {
      title: '05. The 12-Module Operating System (Overview)',
      description: 'Full suite grid covering Ideation, Market Sizing, Build Scope, Operations, Unit Economics, and Funding.',
      fileUrl: '/appsumo-assets/05-all-12-modules-suite-1920x1080.png',
      dimensions: '1920x1080 (16:9)',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-600 selection:text-white">
      <MarketingHeader active="founder" />

      {/* Hero Header */}
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-white via-indigo-50/30 to-slate-50 pt-14 pb-16 sm:pt-20 sm:pb-20">
        <div className="pointer-events-none absolute top-0 left-1/2 -z-10 h-[420px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-200/40 via-violet-100/30 to-emerald-100/25 blur-3xl" />

        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
          <Badge className="mb-4 bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 font-semibold text-xs px-3 py-1">
            <Sparkles className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
            Official Press &amp; Partner Kit
          </Badge>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
            Startup Preflight <span className="text-indigo-600">Media Kit</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Everything journalists, podcast hosts, reviewers, and ecosystem partners need to cover Startup Preflight — including official brandmarks, high-res UI screenshots, founder bios, and boilerplate copy.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href="/appsumo-assets/startup-preflight-logo-horizontal.png" download>
              <Button size="sm" className="bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-700">
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Download Primary Logo
              </Button>
            </a>
            <a href="mailto:tom@startuppreflight.com?subject=Press%20or%20Partner%20Inquiry">
              <Button size="sm" variant="outline" className="border-slate-300 text-xs font-semibold text-slate-700 hover:bg-white">
                <Mail className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
                Contact Press Team
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Main Content Body */}
      <main className="mx-auto max-w-5xl space-y-16 px-4 py-12 sm:px-6 sm:py-16">
        {/* Section 1: Boilerplate & Quick Facts */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Company Boilerplate &amp; Fast Facts
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Standard approved descriptions for articles, directory listings, and affiliate partner hubs.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* 50-Word Blurb */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Short Description (50 Words)
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-slate-500 hover:text-slate-900"
                  onClick={() =>
                    copyToClipboard(
                      'Startup Preflight is an all-in-one founder operating system that helps early-stage entrepreneurs validate real customer demand, stress-test 3-year breakeven economics, and resolve co-founder alignment before risking capital. It replaces fragile spreadsheets with a structured 12-module co-pilot built by startup ecosystem practitioners.',
                      'short-bio'
                    )
                  }
                >
                  {copiedKey === 'short-bio' ? (
                    <>
                      <Check className="mr-1 h-3.5 w-3.5 text-emerald-600" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1 h-3.5 w-3.5" /> Copy
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs leading-relaxed text-slate-700">
                Startup Preflight is an all-in-one founder operating system that helps early-stage entrepreneurs validate real customer demand, stress-test 3-year breakeven economics, and resolve co-founder alignment before risking capital. It replaces fragile spreadsheets with a structured 12-module co-pilot built by startup ecosystem practitioners.
              </p>
            </div>

            {/* 100-Word Blurb */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Full Boilerplate (100 Words)
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-slate-500 hover:text-slate-900"
                  onClick={() =>
                    copyToClipboard(
                      'Startup Preflight is the supportive co-founder and blind-spot engine designed to turn raw startup ideas into profitable, bankable businesses. Built on a strict "Capture First, Expand Second" philosophy, the platform guides entrepreneurs through 12 structured modules spanning customer validation surveys, unit economics, 3-year "Pocket Profit" breakeven modeling, blind-reveal co-founder alignment, and automated business plans with pre-flight contradiction audits. Headquartered in Dublin, Ireland, Startup Preflight helps founders de-risk their ventures before burning personal savings.',
                      'full-bio'
                    )
                  }
                >
                  {copiedKey === 'full-bio' ? (
                    <>
                      <Check className="mr-1 h-3.5 w-3.5 text-emerald-600" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1 h-3.5 w-3.5" /> Copy
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs leading-relaxed text-slate-700">
                Startup Preflight is the supportive co-founder and blind-spot engine designed to turn raw startup ideas into profitable, bankable businesses. Built on a strict &quot;Capture First, Expand Second&quot; philosophy, the platform guides entrepreneurs through 12 structured modules spanning customer validation surveys, unit economics, 3-year &quot;Pocket Profit&quot; breakeven modeling, blind-reveal co-founder alignment, and automated business plans with pre-flight contradiction audits.
              </p>
            </div>
          </div>

          {/* Quick Metrics / Details Bar */}
          <div className="grid grid-cols-2 gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs sm:grid-cols-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Founded</p>
              <p className="mt-1 text-sm font-bold text-slate-900">Dublin, Ireland 🇮🇪</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Founder</p>
              <p className="mt-1 text-sm font-bold text-slate-900">Thomas Walsh</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Target Audience</p>
              <p className="mt-1 text-sm font-bold text-slate-900">Early-Stage Founders &amp; Teams</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Platform Model</p>
              <p className="mt-1 text-sm font-bold text-slate-900">12-Module Founder OS</p>
            </div>
          </div>
        </section>

        {/* Section 2: Official Logos & Assets */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Official Logos &amp; Brandmarks
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Approved transparent PNGs and vector SVGs for print, web, and newsletter inclusion.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {brandAssets.map((asset, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs transition-all hover:border-indigo-200"
              >
                <div>
                  <div className="mb-4 flex h-28 items-center justify-center rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                    <img
                      src={asset.fileUrl}
                      alt={asset.title}
                      className="max-h-16 max-w-full object-contain"
                    />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{asset.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">{asset.description}</p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-[11px] font-semibold text-slate-400">
                    {asset.format} • {asset.size}
                  </span>
                  <a href={asset.fileUrl} download className="inline-flex">
                    <Button size="sm" variant="outline" className="h-7 text-xs font-semibold">
                      <Download className="mr-1 h-3 w-3" />
                      Download
                    </Button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Brand Color Palette */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Brand Color Palette
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Primary digital brand accents and surface values. Click any hex code to copy.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {brandColors.map((c, idx) => (
              <div
                key={idx}
                onClick={() => copyToClipboard(c.hex, `color-${idx}`)}
                className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-3 shadow-2xs transition-all hover:border-indigo-300"
              >
                <div className={`h-14 w-full rounded-lg ${c.class}`} />
                <div className="mt-2.5">
                  <p className="truncate text-xs font-bold text-slate-900">{c.name}</p>
                  <p className="text-[11px] font-mono text-slate-500 group-hover:text-indigo-600">
                    {copiedKey === `color-${idx}` ? 'Copied!' : c.hex}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: High-Resolution Product Screenshots */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              High-Resolution Product Screenshots (1080p)
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Clean 1920x1080 product renders ready for media articles, video overlays, and partner listings.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {screenshots.map((shot, idx) => (
              <div
                key={idx}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs transition-all hover:border-indigo-300"
              >
                <div className="relative aspect-video w-full overflow-hidden border-b border-slate-100 bg-slate-900">
                  <img
                    src={shot.fileUrl}
                    alt={shot.title}
                    className="h-full w-full object-cover transition-transform hover:scale-105"
                  />
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="text-xs font-bold text-slate-900">{shot.title}</h3>
                  <p className="text-[11px] leading-relaxed text-slate-500">{shot.description}</p>
                  <div className="pt-2">
                    <a href={shot.fileUrl} download className="inline-flex w-full">
                      <Button size="sm" variant="outline" className="w-full h-7 text-xs font-medium">
                        <Download className="mr-1.5 h-3 w-3" />
                        Download 1080p PNG
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 5: Founder Background & Headshot */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Founder Profile &amp; Approved Bio
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Thomas Walsh — Global Head of Startup Success, 3x Founder &amp; Advisory Veteran.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-2xl border border-slate-200 shadow-sm sm:h-40 sm:w-40">
                <img
                  src="/images/founder-thomas-walsh.jpg"
                  alt="Thomas Walsh"
                  className="h-full w-full object-cover object-top"
                />
              </div>

              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Thomas Walsh</h3>
                    <p className="text-xs font-semibold text-indigo-600">
                      Founder, Startup Preflight • Global Head of Startup Success
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href="https://www.linkedin.com/in/twalsh-start-ups/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-slate-300">
                        <Linkedin className="h-3.5 w-3.5 text-indigo-600" />
                        LinkedIn
                      </Button>
                    </a>
                    <Link href="/about-founder">
                      <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-slate-600">
                        Full Founder Page <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-slate-600">
                  Thomas Walsh is an entrepreneur, technologist, and startup advisor with over 20 years of experience across software engineering, cloud systems, and commercial startup scaling. In his current role as Global Head of Startup Success at Google, and having previously scaled Oracle&apos;s High-Potential Startup Program to over 300 companies, Thomas has directly advised and evaluated hundreds of early-stage ventures. He founded Startup Preflight to put his 20-year playbook into an accessible, 12-module co-founder system that helps founders stress-test their ideas, validate customer willingness-to-pay, and build sustainable, profitable businesses.
                </p>

                <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-slate-500 font-medium">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5">Google Global Vendor Leadership</span>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5">Former Oracle Startup Lead</span>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5">400+ Startups Advised</span>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5">3x Company Builder</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: Press Contact & Interview Booking */}
        <section className="rounded-3xl border border-indigo-200/80 bg-gradient-to-br from-indigo-900 to-slate-900 p-8 text-white shadow-xl sm:p-10">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="space-y-2">
              <Badge className="bg-indigo-500/20 text-indigo-200 border-indigo-400/30 text-xs font-semibold">
                Media &amp; Podcast Inquiries
              </Badge>
              <h3 className="text-xl font-bold tracking-tight sm:text-2xl">
                Looking to interview Thomas or feature Startup Preflight?
              </h3>
              <p className="max-w-xl text-xs leading-relaxed text-slate-300 sm:text-sm">
                Thomas frequently speaks on podcast episodes, webinars, and panels regarding early-stage founder mistakes, bias-free customer discovery, unit economics, and navigating angel/grant ecosystems.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row">
              <a href="mailto:tom@startuppreflight.com?subject=Media%20/%20Podcast%20Interview%20Request">
                <Button className="w-full bg-indigo-500 font-semibold text-white hover:bg-indigo-400 sm:w-auto text-xs">
                  <Mail className="mr-1.5 h-3.5 w-3.5" />
                  Email Press Team
                </Button>
              </a>
              <a
                href="https://www.linkedin.com/in/twalsh-start-ups/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="w-full border-slate-700 bg-slate-800 text-xs font-semibold text-white hover:bg-slate-700 sm:w-auto">
                  <Linkedin className="mr-1.5 h-3.5 w-3.5" />
                  Connect on LinkedIn
                </Button>
              </a>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
