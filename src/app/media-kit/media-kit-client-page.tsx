'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Download,
  Copy,
  Check,
  ExternalLink,
  Layers,
  Users,
  Compass,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  FileText,
  Mail,
  Linkedin,
  Palette,
  FileCheck2,
  CheckCircle2,
  SlidersHorizontal,
  Ban,
  Scale,
  Building2,
  GraduationCap,
  Landmark,
  BarChart3,
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
    {
      name: 'Forest Emerald 700',
      role: 'Primary Accent & Actions',
      hex: '#047857',
      rgb: '4, 120, 87',
      class: 'bg-[#047857] text-white',
    },
    {
      name: 'Deep Slate 950',
      role: 'Primary Surface & Dark Cards',
      hex: '#020617',
      rgb: '2, 6, 23',
      class: 'bg-[#020617] text-white',
    },
    {
      name: 'Charcoal Slate 900',
      role: 'Secondary Surface & Headers',
      hex: '#0F172A',
      rgb: '15, 23, 42',
      class: 'bg-[#0F172A] text-white',
    },
    {
      name: 'Emerald 600',
      role: 'Verification & Success Badges',
      hex: '#059669',
      rgb: '5, 150, 105',
      class: 'bg-[#059669] text-white',
    },
    {
      name: 'Crisp Slate 200',
      role: 'Structural Borders & Dividers',
      hex: '#E2E8F0',
      rgb: '226, 232, 240',
      class: 'bg-[#E2E8F0] text-slate-900 border border-slate-300',
    },
    {
      name: 'Slate 50',
      role: 'Neutral Canvas Backdrop',
      hex: '#F8FAFC',
      rgb: '248, 250, 252',
      class: 'bg-[#F8FAFC] text-slate-900 border border-slate-200',
    },
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
      description: 'Workspace showing Startup Sidekick’s dual-axis breakeven crossover (Month 4 @ 34 subs), fixed survival floor (€4,200), and AI blind-spot engine.',
      fileUrl: '/appsumo-assets/01-hero-headline-1920x1080.png',
      dimensions: '1920x1080 (16:9)',
    },
    {
      title: '02. Customer Surveys & Early Waitlist (Mod C)',
      description: 'Mom-Test bias-free survey builder, public validation link (/v/startup-sidekick), 142 founder responses, and automated sentiment pattern extraction.',
      fileUrl: '/appsumo-assets/02-customer-survey-waitlist-1920x1080.png',
      dimensions: '1920x1080 (16:9)',
    },
    {
      title: '03. Co-Founder Alignment & Equity Split (Mod F)',
      description: 'Blind-reveal 12 awkward questions survey (Thomas Walsh vs. Lead Architect), side-by-side alignment heatmap, and objective 60/40 vesting split.',
      fileUrl: '/appsumo-assets/03-cofounder-alignment-1920x1080.png',
      dimensions: '1920x1080 (16:9)',
    },
    {
      title: '04. Living Business Plan & Pre-Flight AI Audit (Mod L)',
      description: 'Startup Sidekick 94/100 Readiness Score, LEO Feasibility dossier compiler, math reconciliation, and non-displacement certification.',
      fileUrl: '/appsumo-assets/04-business-plan-compiler-1920x1080.png',
      dimensions: '1920x1080 (16:9)',
    },
    {
      title: '05. The 12-Module Operating System (Overview)',
      description: 'Complete 12-module institutional grid in Sovereign Emerald & Deep Slate spanning Ideation, Market Sizing, Build Scope, Pocket Profit, and Funding.',
      fileUrl: '/appsumo-assets/05-all-12-modules-suite-1920x1080.png',
      dimensions: '1920x1080 (16:9)',
    },
    {
      title: '06. Cohort Director Command Center & Batch Heatmap',
      description: 'Real-time cohort command center as seen on the Cohorts portal, tracking 24 active startups, 78% batch progress, and 18/24 grant-ready pre-flights.',
      fileUrl: '/appsumo-assets/06-cohort-director-command-center-1920x1080.png',
      dimensions: '1920x1080 (16:9)',
    },
  ];

  const designStandards = [
    {
      title: 'Sovereign Emerald & Deep Slate',
      description: 'Built on Deep Slate 950 (#020617) with Forest Emerald 700 (#047857). Delivers an institutional, bank-grade underwriting atmosphere rather than a generic consumer toy.',
    },
    {
      title: 'Zero "AI Slop" Visual Tropes',
      description: 'No purple/violet gradient text, no floating blurred spheres, and no cartoon sparkles. Every AI component is positioned as a rigorous Auditor or Synthesizer.',
    },
    {
      title: 'Data Density & Tabular Precision',
      description: 'Financial models, CAC payback curves, breakeven crossovers, and grant matching scores are presented with monospaced tabular precision (tabular-nums).',
    },
    {
      title: '"Capture First, Expand Second"',
      description: 'A strict UX philosophy: first cleanly capture the founder’s raw vision with zero upfront criticism, then provide constructive blind-spot reviews at each module milestone.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-700 selection:text-white">
      <MarketingHeader active="founder" />

      {/* Hero Header */}
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-white via-slate-50/40 to-slate-50 pt-14 pb-16 sm:pt-20 sm:pb-20">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
          <Badge className="mb-4 bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 font-semibold text-xs px-3 py-1">
            <FileCheck2 className="mr-1.5 h-3.5 w-3.5 text-emerald-700" />
            Official Press &amp; Partner Kit
          </Badge>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Startup Preflight <span className="text-emerald-700">Media Kit</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Everything journalists, podcast hosts, reviewers, and ecosystem partners need to cover Startup Preflight — including official brandmarks, the Sovereign Emerald &amp; Deep Slate palette, high-res UI screenshots, founder bios, and boilerplate copy.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href="/appsumo-assets/startup-preflight-logo-horizontal.png" download>
              <Button size="sm" className="bg-emerald-700 text-xs font-semibold text-white hover:bg-emerald-800">
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
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
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
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
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
          <div className="grid grid-cols-2 gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:grid-cols-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">HQ Location</p>
              <p className="mt-1 text-sm font-bold text-slate-900">Dublin, Ireland 🇮🇪</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Founder &amp; CEO</p>
              <p className="mt-1 text-sm font-bold text-slate-900">Thomas Walsh</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Design Language</p>
              <p className="mt-1 text-sm font-bold text-emerald-800">Sovereign Emerald / Slate</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Platform Scope</p>
              <p className="mt-1 text-sm font-bold text-slate-900">12-Module Founder OS</p>
            </div>
          </div>
        </section>

        {/* Section 1B: Institutional & B2B Product Overview */}
        <section className="space-y-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-700" />
                <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  B2B &amp; Ecosystem Product Overview
                </h2>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Official descriptions and institutional value propositions for Accelerators, Incubators, Universities, Venture Studios &amp; Regional Economic Agencies.
              </p>
            </div>
            <Badge variant="outline" className="self-start sm:self-auto border-emerald-300 bg-emerald-50 text-[11px] font-semibold text-emerald-800">
              Institutional Cohort Infrastructure
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* B2B 50-Word Blurb */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  B2B Short Description (50 Words)
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-slate-500 hover:text-slate-900"
                  onClick={() =>
                    copyToClipboard(
                      'Startup Preflight is the standardized founder underwriting operating system for accelerators, universities, and enterprise programs. It transitions cohort startups from unstructured ideas to audit-ready ventures with verified customer demand, stress-tested 3-year unit economics, and automated grant packaging for LEO, Enterprise Ireland, and Innovate UK.',
                      'b2b-short-bio'
                    )
                  }
                >
                  {copiedKey === 'b2b-short-bio' ? (
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
                Startup Preflight is the standardized founder underwriting operating system for accelerators, universities, and enterprise programs. It transitions cohort startups from unstructured ideas to audit-ready ventures with verified customer demand, stress-tested 3-year unit economics, and automated grant packaging for LEO, Enterprise Ireland, and Innovate UK.
              </p>
            </div>

            {/* B2B Executive Summary (125 Words) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  B2B Executive Description (125 Words)
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-slate-500 hover:text-slate-900"
                  onClick={() =>
                    copyToClipboard(
                      'Startup Preflight equips startup accelerators, universities, venture studios, and regional enterprise bodies (including LEOs and UK Growth Hubs) with an institutional venture readiness infrastructure. Rather than relying on static pitch decks and fragmented spreadsheets, program managers deploy Startup Preflight to standardize cohort milestones across 12 structured modules. The platform enforces Mom-Test customer discovery, audited 3-year breakeven modeling, blind-reveal co-founder alignment, and pre-flight contradiction audits for public grants and early-stage capital. The result is higher cohort graduation rates, audit-compliant grant applications, and dramatically reduced early-stage venture failure.',
                      'b2b-full-bio'
                    )
                  }
                >
                  {copiedKey === 'b2b-full-bio' ? (
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
                Startup Preflight equips startup accelerators, universities, venture studios, and regional enterprise bodies (including LEOs and UK Growth Hubs) with an institutional venture readiness infrastructure. Rather than relying on static pitch decks and fragmented spreadsheets, program managers deploy Startup Preflight to standardize cohort milestones across 12 structured modules. The platform enforces Mom-Test customer discovery, audited 3-year breakeven modeling, blind-reveal co-founder alignment, and pre-flight contradiction audits for public grants and early-stage capital.
              </p>
            </div>
          </div>

          {/* B2B Institutional Value Pillars */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-700" />
                <h4 className="text-xs font-bold text-slate-900">Cohort Standardization</h4>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600">
                Replaces subjective advisor gut-checks with uniform 12-module validation milestones, giving program directors real-time visibility into venture readiness.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-2">
              <div className="flex items-center gap-2">
                <Landmark className="h-4 w-4 text-emerald-700" />
                <h4 className="text-xs font-bold text-slate-900">Audit-Ready Grants</h4>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600">
                Automated narrative-to-financial compilers for IE LEO Feasibility/Priming, Enterprise Ireland PSSF, UK Innovate UK Smart Grants, and Start Up Loans.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-700" />
                <h4 className="text-xs font-bold text-slate-900">Team &amp; Equity De-Risking</h4>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600">
                The 12-Awkward-Questions blind alignment survey surfaces equity, commitment, and role misalignments before founders incorporate or accept public funding.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-2">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-emerald-700" />
                <h4 className="text-xs font-bold text-slate-900">Enterprise Cohort Passes</h4>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600">
                Batch cohort licensing (`COHORT_PASS`), branded cohort invite codes, and white-label export capabilities for universities and corporate accelerators.
              </p>
            </div>
          </div>

          {/* B2B Partner Audience Tags */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Institutional Programs Supported
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-slate-700 font-medium">
              <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1">University Incubators &amp; Spin-Out Hubs</span>
              <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1">Seed Accelerators &amp; Venture Studios</span>
              <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1">Local Enterprise Offices (LEO) &amp; Enterprise Ireland</span>
              <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1">Innovate UK &amp; British Business Bank Networks</span>
              <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1">Corporate Innovation &amp; Intrapreneurship Programs</span>
              <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1">Angel Investor Networks &amp; Pre-Seed Syndicates</span>
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
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-emerald-300"
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

        {/* Section 3: Brand Color Palette (Sovereign Emerald & Deep Slate) */}
        <section className="space-y-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-emerald-700" />
                <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  Updated Color Architecture
                </h2>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                The official Sovereign Emerald &amp; Deep Slate palette. Click any card to copy its hexadecimal code.
              </p>
            </div>
            <Badge variant="outline" className="self-start sm:self-auto border-emerald-300 bg-emerald-50 text-[11px] font-semibold text-emerald-800">
              Institutional Underwriting Standard
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {brandColors.map((c, idx) => (
              <div
                key={idx}
                onClick={() => copyToClipboard(c.hex, `color-${idx}`)}
                className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-3 shadow-xs transition-all hover:border-emerald-400 hover:shadow-sm"
              >
                <div className={`h-14 w-full rounded-lg ${c.class}`} />
                <div className="mt-2.5">
                  <p className="truncate text-xs font-bold text-slate-900">{c.name}</p>
                  <p className="truncate text-[10px] text-slate-500">{c.role}</p>
                  <p className="mt-1 font-mono text-[11px] font-semibold text-slate-700 group-hover:text-emerald-700">
                    {copiedKey === `color-${idx}` ? 'Copied!' : c.hex}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Brand Personality & Anti-AI-Slop Standards */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Brand Identity &amp; Editorial Standards
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Core design philosophy and naming guidelines for press features, reviews, and co-branded materials.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {designStandards.map((std, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-700" />
                  <h3 className="text-sm font-bold text-slate-900">{std.title}</h3>
                </div>
                <p className="text-xs leading-relaxed text-slate-600">
                  {std.description}
                </p>
              </div>
            ))}
          </div>

          {/* Do's and Don'ts Box */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
              Visual &amp; Editorial Guidelines
            </h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Approved Naming &amp; References</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  <li>• Refer to the company as <strong className="text-slate-900">Startup Preflight</strong> (two words, Title Case).</li>
                  <li>• Highlight the platform as <strong className="text-slate-900">The Supportive Co-Founder &amp; Blind-Spot Engine</strong>.</li>
                  <li>• Emphasize the 12 structured modules and real evidence validation (Mom Test, 3-Year Pocket Profit).</li>
                  <li>• Note the localized compliance for Ireland (LEO/EI) and UK (Innovate UK &amp; Start Up Loans).</li>
                </ul>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <Ban className="h-4 w-4 text-rose-600" />
                  <span>What to Avoid</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  <li>• Do not spell as &quot;StartupPreflight&quot; (one word) or &quot;PreFlight&quot;.</li>
                  <li>• Avoid depicting the platform using purple/violet gradient backgrounds or cartoon sparkles.</li>
                  <li>• Do not describe Startup Preflight as a generic prompt-wrapper or pitch deck generator.</li>
                  <li>• Do not alter, stretch, or apply drop shadows to the official logo mark.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: High-Resolution Product Screenshots */}
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
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition-all hover:border-emerald-300"
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

        {/* Section 6: Founder Background & Headshot */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Founder Profile &amp; Approved Bio
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Thomas Walsh — Global Head of Startup Success, 3x Founder &amp; Advisory Veteran.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-2xl border border-slate-200 shadow-xs sm:h-40 sm:w-40">
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
                    <p className="text-xs font-semibold text-emerald-800">
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
                        <Linkedin className="h-3.5 w-3.5 text-emerald-700" />
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

        {/* Section 7: Press Contact & Interview Booking */}
        <section className="rounded-3xl border border-slate-800 bg-slate-950 p-8 text-white shadow-xl sm:p-10">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="space-y-2">
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 text-xs font-semibold">
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
                <Button className="w-full bg-emerald-600 font-semibold text-white hover:bg-emerald-700 sm:w-auto text-xs">
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
