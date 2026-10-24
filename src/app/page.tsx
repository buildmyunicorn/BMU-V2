'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Compass,
  BarChart3,
  Briefcase,
  DollarSign,
  Megaphone,
  Scale,
  FileText,
  Globe2,
  Ticket,
  ShieldCheck,
  Bot,
  LogIn,
  UserPlus,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { loadBmuSession, type BmuLocalSession } from '@/lib/auth/session-store';

const MODULES_PREVIEW = [
  {
    short: 'Module A',
    title: 'Ideation & 1-Page Mirror Canvas',
    desc: 'Capture your raw idea in 60 seconds, generate an investor-clear 1-page Concept Canvas, and get constructive blind-spot feedback.',
    icon: Compass,
    badge: 'Free Forever',
  },
  {
    short: 'Module B',
    title: 'Market Scout & Public Validation Survey',
    desc: 'AI competitor mapping, bottom-up TAM/SAM/SOM calculator, and a shareable /v/[slug] customer survey that kills confirmation bias.',
    icon: BarChart3,
    badge: 'Full Pass',
  },
  {
    short: 'Module C',
    title: 'Operations, 7 Hats & Co-Founder Alignment',
    desc: 'Ruthless MVP scope filter, 7 Startup Hats delegation map, and our Blind-Reveal Co-Founder Alignment Interview.',
    icon: Briefcase,
    badge: 'Full Pass',
  },
  {
    short: 'Module D',
    title: 'Selling & Single-Sale Pocket Profit',
    desc: 'Map real B2B/B2C buying friction and calculate exact gross margin and pocket profit on 1 unit sold before building spreadsheets.',
    icon: DollarSign,
    badge: 'Full Pass',
  },
  {
    short: 'Module E',
    title: 'Marketing & First 100 Customers',
    desc: '3-Second Value Hook, zero-budget guerrilla hustle checklist, and a reverse-engineered monthly marketing funnel.',
    icon: Megaphone,
    badge: 'Full Pass',
  },
  {
    short: 'Module F',
    title: '36-Month Cashflow, Grants & Legal Shield',
    desc: 'Plain-English 3-year projections, localized Ireland/UK/US/AU/CA non-dilutive grant matcher, and IP/equity hygiene.',
    icon: Scale,
    badge: 'Full Pass',
  },
  {
    short: 'Module G',
    title: 'Living Business Plan & Contradiction Audit',
    desc: 'One-click Investor, Bank/LEO Grant, or Internal Roadmap compilation with Gemini 2.5 Pro cross-module contradiction checks.',
    icon: FileText,
    badge: 'Full Pass',
  },
];

export default function LandingPage() {
  const [session, setSession] = useState<BmuLocalSession | null>(null);

  useEffect(() => {
    setSession(loadBmuSession());
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      {/* Clean Production Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900">
                Build My Unicorn
              </span>
              <p className="text-xs text-slate-500">
                Supportive AI Co-Founder &amp; Blind-Spot Engine
              </p>
            </div>
          </Link>

          <nav className="flex flex-wrap items-center gap-2.5">
            <Link href="/redeem">
              <Button variant="ghost" size="sm" className="text-xs text-slate-600">
                <Ticket className="h-4 w-4 text-amber-600" />
                Redeem Code
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="sm">
                <LogIn className="h-4 w-4 text-slate-600" />
                Log In
              </Button>
            </Link>
            <Link href="/register">
              <Button
                size="sm"
                className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700"
              >
                <UserPlus className="h-4 w-4" />
                Start Free
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="mx-auto max-w-7xl px-6 py-16 text-center lg:py-24">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-4 py-1.5 text-xs font-semibold text-indigo-700 shadow-2xs">
            <Bot className="h-4 w-4 text-indigo-600" />
            No 20-Minute Videos • Capture First, Expand Second • Localized for
            IE, UK, US, AU, CA &amp; EU
          </div>

          <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Turn your raw startup idea into a{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              validated, investor-ready business plan
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Most first-time founders get stuck staring at blank financial
            templates or generic AI wrappers. Build My Unicorn acts like an
            experienced co-founder—helping you structure your vision, uncover
            blind spots, validate with real buyers, and match with local grants.
          </p>

          {/* Primary CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 text-white shadow-md hover:from-indigo-700 hover:to-violet-700"
              >
                Start Your Idea Canvas Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                Sign In to Existing Plan
              </Button>
            </Link>
          </div>

          {/* 3 Pillar Highlights */}
          <div className="mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-4 text-left sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Capture First, Expand Second
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Never criticized upfront. Dump your raw thoughts first, then let
                our Blind-Spot Engine surface constructive questions.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <Globe2 className="h-4 w-4 text-indigo-600" />
                Localized Grants &amp; Tax Rules
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Built-in VAT, Employer PRSI/NIC/Payroll tax, and non-dilutive
                grant matching for Ireland (LEO/EI), UK (SEIS/EIS), US, AU &amp;
                CA.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <ShieldCheck className="h-4 w-4 text-violet-600" />
                4-Layer Built-In Support
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Micro-coaching cards, industry examples, &ldquo;I&apos;m
                Stuck&rdquo; prompt breakdowns, and an Open Questions Parking
                Lot.
              </p>
            </div>
          </div>
        </section>

        {/* The 7-Module Journey Overview */}
        <section className="border-t border-slate-200 bg-white py-16">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center">
              <Badge variant="default">7-Module Guided Architecture</Badge>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                Everything from Day-1 Brain Dump to Grant-Ready Business Plan
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Module A is 100% free forever so every founder can experience
                the 1-Page Mirror Canvas before upgrading.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {MODULES_PREVIEW.map((m) => {
                const Icon = m.icon;
                return (
                  <Card key={m.short} className="border-slate-200">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                          <Icon className="h-5 w-5" />
                        </div>
                        <Badge
                          variant={
                            m.badge === 'Free Forever' ? 'success' : 'secondary'
                          }
                        >
                          {m.badge}
                        </Badge>
                      </div>
                      <CardTitle className="mt-3 text-sm font-bold">
                        {m.short}: {m.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-xs leading-relaxed text-slate-600">
                        {m.desc}
                      </CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* Clean Production Footer */}
      <footer className="border-t border-slate-200 bg-slate-900 text-slate-400">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold text-white">
                Build My Unicorn 2.0
              </span>
              <span className="text-xs text-slate-500">
                © {new Date().getFullYear()} All rights reserved.
              </span>
            </div>

            <div className="flex flex-wrap gap-4 text-xs">
              <Link href="/register" className="hover:text-white">
                Sign Up
              </Link>
              <Link href="/login" className="hover:text-white">
                Log In
              </Link>
              <Link href="/redeem" className="hover:text-white">
                Redeem Voucher
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
