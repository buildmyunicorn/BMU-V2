import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  Sparkles,
  Award,
  Terminal,
  Linkedin,
  MapPin,
  CheckCircle2,
  ArrowUpRight,
  ShieldCheck,
  Code2,
  Briefcase,
  ArrowLeft,
  Construction,
  LogIn,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Meet the Founder • Thomas Walsh | Startup Preflight',
  description:
    'Why Thomas Walsh built Startup Preflight: 400+ startups scaled across Google and Oracle, 20+ years in technical infrastructure & full-stack AI development.',
};

export default function AboutFounderPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      {/* Top Banner */}
      <div className="border-b border-indigo-500/20 bg-indigo-500/10 px-4 py-2 text-center text-xs text-indigo-200">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-2.5 py-0.5 font-bold text-indigo-300 ring-1 ring-indigo-500/30">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            EARLY ACCESS • PUBLIC BETA
          </span>
          <span className="text-indigo-200/90">
            The supportive AI co-founder &amp; grant readiness builder for Ireland &amp; UK founders.
          </span>
        </div>
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-white">
                  Startup Preflight
                </span>
                <span className="rounded-md bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-indigo-300 uppercase ring-1 ring-indigo-500/30">
                  Early Access
                </span>
              </div>
              <p className="hidden text-xs text-slate-400 sm:block">
                Supportive AI Co-Founder &amp; Blind-Spot Engine
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Home
              </Button>
            </Link>

            <Link href="/login">
              <Button
                size="sm"
                className="h-8 bg-indigo-600 px-3 text-xs text-white hover:bg-indigo-700"
              >
                <LogIn className="h-3.5 w-3.5" />
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Founder Story Section */}
      <main className="relative flex-1 overflow-hidden py-14 sm:py-20">
        {/* Ambient Glows */}
        <div className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-0 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          {/* Breadcrumb / Top Tag */}
          <div className="mb-8 flex items-center gap-2 text-xs text-slate-400">
            <Link href="/" className="hover:text-indigo-400">
              Home
            </Link>
            <span>/</span>
            <span className="text-slate-200">Meet the Founder</span>
          </div>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-start">
            {/* Left Column: 5 Cols - Profile Card */}
            <div className="lg:col-span-5 lg:sticky lg:top-24">
              <div className="relative rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-900/60 p-6 shadow-2xl backdrop-blur-sm sm:p-7">
                {/* Profile Image */}
                <div className="relative mx-auto mb-6 h-72 w-full overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-800/80 shadow-inner">
                  <Image
                    src="/images/founder-thomas-walsh.jpg"
                    alt="Thomas Walsh - Founder & Builder of Startup PreFlight"
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 40vw, 420px"
                    priority
                  />
                  <div className="absolute top-3 right-3 rounded-full bg-slate-950/80 px-2.5 py-1 text-[11px] font-medium text-emerald-400 backdrop-blur-md ring-1 ring-emerald-500/30">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                    Active Builder
                  </div>
                </div>

                {/* Founder Details */}
                <div className="space-y-1 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <h1 className="text-2xl font-bold tracking-tight text-white">
                      Thomas Walsh
                    </h1>
                    <div className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-medium text-slate-300">
                      <MapPin className="h-3 w-3 text-indigo-400" />
                      Dublin, Ireland 🇮🇪
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-indigo-400">
                    Founder &amp; Builder, Startup PreFlight
                  </p>
                </div>

                {/* 3 Proof Metric Pills */}
                <div className="mt-6 space-y-2.5">
                  <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-left">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400 ring-1 ring-indigo-500/30">
                      <Briefcase className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">
                        400+ Startups Scaled
                      </div>
                      <div className="text-[11px] text-slate-400 leading-tight">
                        Across Google, Oracle &amp; Independent Advisory
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-left">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-600/20 text-violet-400 ring-1 ring-violet-500/30">
                      <Code2 className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">
                        20+ Years in Tech &amp; Cloud
                      </div>
                      <div className="text-[11px] text-slate-400 leading-tight">
                        From Enterprise Infrastructure to Full-Stack AI
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-left">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600/20 text-emerald-400 ring-1 ring-emerald-500/30">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">
                        Built from the Trenches
                      </div>
                      <div className="text-[11px] text-slate-400 leading-tight">
                        3x Builder: The Startup Sidekick, TeamTrackAI &amp; Startup PreFlight
                      </div>
                    </div>
                  </div>
                </div>

                {/* Direct LinkedIn Button */}
                <div className="mt-6">
                  <a
                    href="https://www.linkedin.com/in/twalsh-start-ups/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-slate-700 bg-slate-800 text-xs font-semibold text-white hover:bg-slate-700 hover:text-white"
                    >
                      <Linkedin className="h-3.5 w-3.5 text-[#0A66C2]" />
                      Connect on LinkedIn
                      <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
                    </Button>
                  </a>
                </div>
              </div>
            </div>

            {/* Right Column: 7 Cols - Story & Dual-Brain Grid */}
            <div className="space-y-6 text-left lg:col-span-7">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-[11px] font-bold tracking-wide text-indigo-400 ring-1 ring-indigo-500/25 uppercase">
                  <Sparkles className="h-3 w-3" />
                  BUILT BY AN INSIDER WHO ACTUALLY WRITES THE CODE
                </span>
                <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl lg:leading-tight">
                  &ldquo;I’ve sat on both sides of the startup table—and watched
                  too many great ideas die from avoidable blind spots.&rdquo;
                </h2>
              </div>

              {/* 3 Punchy Paragraphs */}
              <div className="space-y-4 text-sm leading-relaxed text-slate-300 sm:text-base">
                <p>
                  <strong className="font-semibold text-white">
                    The Startup Insider View:
                  </strong>{' '}
                  Over the last decade, I’ve had a front-row seat to what makes
                  early-stage companies succeed or fail. As Global Head of Startup
                  Success (SMB) and EMEA Lead at Google, and previously running
                  the High Potential Start-Up (HPSU) program at Oracle across
                  EMEA, I’ve worked directly with over 400 founders. Before that,
                  I founded The Startup Sidekick, helping 100+ early-stage
                  founders navigate their first business plans, financial models,
                  and grant applications.
                </p>

                <p>
                  <strong className="font-semibold text-white">
                    The Technical Builder View:
                  </strong>{' '}
                  But I didn&apos;t start out in boardrooms—I started in the
                  server room. My career began over 20 years ago as a network and
                  systems administrator, evolving into a Business Intelligence
                  consultant, Cloud Solutions Engineer, and full-stack AI
                  developer (building platforms like TeamTrackAI from the ground
                  up). I know firsthand how easy it is for technical builders to
                  get lost in financial cashflows, and for commercial founders to
                  get burned by €25,000 agency quotes and technical architecture
                  traps.
                </p>

                <p>
                  <strong className="font-semibold text-white">
                    Why Startup PreFlight Exists:
                  </strong>{' '}
                  I built Startup PreFlight because generic AI chatbots will
                  happily hallucinate a business plan that gets laughed out of a
                  Local Enterprise Office (LEO), Innovate UK assessment, or VC
                  pitch. Startup PreFlight combines the exact institutional
                  checklists I used to evaluate hundreds of startups with
                  hard-coded Irish &amp; UK tax, grant, and cashflow
                  engines—giving you a technical and commercial co-pilot before you
                  quit your job or spend a cent.
                </p>
              </div>

              {/* Two Halves of Your Co-Pilot Sub-Grid */}
              <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2">
                {/* Card 1: Commercial Brain */}
                <div className="rounded-2xl border border-indigo-900/60 bg-gradient-to-b from-indigo-950/40 to-slate-900/60 p-5 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600/30 text-indigo-400 ring-1 ring-indigo-500/40">
                      <Award className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white">
                        The Commercial &amp; Grant Brain
                      </h3>
                      <p className="text-[11px] font-medium text-indigo-300">
                        400+ Startups Mentored
                      </p>
                    </div>
                  </div>
                  <ul className="mt-3.5 space-y-2 text-xs text-slate-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-400" />
                      <span>Global Head of Startup Success (SMB) at Google</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-400" />
                      <span>
                        Former EMEA High Potential Start-Up (HPSU) Lead at Oracle (300+ startups)
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-400" />
                      <span>
                        100+ early-stage founders guided through grant &amp; investor readiness
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Card 2: Technical Brain */}
                <div className="rounded-2xl border border-violet-900/60 bg-gradient-to-b from-violet-950/40 to-slate-900/60 p-5 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600/30 text-violet-400 ring-1 ring-violet-500/40">
                      <Terminal className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white">
                        The Technical &amp; Architecture Brain
                      </h3>
                      <p className="text-[11px] font-medium text-violet-300">
                        20+ Years Hands-On Engineering
                      </p>
                    </div>
                  </div>
                  <ul className="mt-3.5 space-y-2 text-xs text-slate-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-400" />
                      <span>
                        Deep roots in Systems Architecture, BI &amp; Cloud (Version 1, Oracle)
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-400" />
                      <span>
                        Full-Stack AI SaaS Builder (Creator of TeamTrackAI, used by 80+ clubs)
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-400" />
                      <span>
                        Built to protect non-technical founders from agency overcharging &amp; bad MVP specs
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Bottom Trust & Accelerator Direct Contact Bar */}
              <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 text-center">
                <p className="text-xs leading-relaxed text-slate-300 sm:text-sm">
                  Have a question about your startup&apos;s PreFlight readiness or
                  cohort licensing for your accelerator/LEO? Connect with me directly
                  on{' '}
                  <a
                    href="https://www.linkedin.com/in/twalsh-start-ups/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-indigo-400 hover:text-indigo-300 underline"
                  >
                    LinkedIn
                  </a>{' '}
                  or email{' '}
                  <a
                    href="mailto:tom@startuppreflight.com"
                    className="font-semibold text-indigo-400 hover:text-indigo-300 underline"
                  >
                    tom@startuppreflight.com
                  </a>
                  .
                </p>
              </div>

              {/* Action Link back to Preflight */}
              <div className="pt-4 text-center sm:text-left">
                <Link href="/#early-access">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 text-white shadow-md hover:from-indigo-700 hover:to-violet-700"
                  >
                    Join the Early-Access Founder List
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-xs text-slate-500">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6">
          <p>© {new Date().getFullYear()} Startup Preflight • Founding Date: 2026 • Dublin, Ireland • Built by Thomas Walsh</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/" className="hover:text-slate-300">
              Home
            </Link>
            <Link href="/privacy" className="hover:text-slate-300">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-slate-300">
              Terms of Service
            </Link>
            <a
              href="https://www.linkedin.com/in/twalsh-start-ups/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-300"
            >
              LinkedIn
            </a>
            <a
              href="mailto:hello@startuppreflight.com"
              className="hover:text-slate-300"
            >
              hello@startuppreflight.com
            </a>
            <Link href="/login" className="hover:text-slate-300">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
