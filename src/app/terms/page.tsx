import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Sparkles,
  ArrowLeft,
  FileText,
  Scale,
  ShieldCheck,
  Mail,
  LogIn,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Terms of Service | Startup Preflight',
  description:
    'Terms of Service and Platform Usage Agreement for Startup Preflight — Supportive AI Co-Founder & Grant Readiness Builder.',
};

export default function TermsOfServicePage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-slate-900">
                  Startup Preflight
                </span>
                <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-indigo-700 uppercase ring-1 ring-indigo-200">
                  Early Access
                </span>
              </div>
              <p className="hidden text-xs text-slate-500 sm:block">
                Supportive AI Co-Founder &amp; Grant Readiness Builder
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="sm" className="h-8 text-xs">
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

      {/* Main Content */}
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-10">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                <Scale className="h-3.5 w-3.5" />
                Platform Terms &amp; User Agreement
              </div>
              <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Terms of Service
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                Effective Date: January 2026 • Last Updated: October 2026
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/60 px-3.5 py-2 text-xs text-indigo-900">
              <FileText className="h-4 w-4 shrink-0 text-indigo-600" />
              <span>
                <strong>100% Founder Ownership:</strong> You own all plans,
                models, and exports you create.
              </span>
            </div>
          </div>

          <div className="mt-8 space-y-7 text-sm leading-relaxed text-slate-700">
            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">
                1. Agreement to Terms
              </h2>
              <p>
                By accessing or using Startup Preflight (&ldquo;the
                Platform&rdquo;), founded in 2026 and operated from Dublin,
                Ireland, you agree to be bound by these Terms of Service and our{' '}
                <Link
                  href="/privacy"
                  className="font-semibold text-indigo-600 underline hover:text-indigo-800"
                >
                  Privacy Policy
                </Link>
                . If you are using the Platform on behalf of a company,
                university incubator, or startup team, you represent that you
                have authority to bind that entity to these Terms.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">
                2. Description of Service &amp; Non-Advisory Disclaimer
              </h2>
              <p>
                Startup Preflight is an AI-assisted software-as-a-service (SaaS)
                platform that helps founders structure startup ideas, validate
                customer demand via hosted surveys, model 36-month financial
                projections, align co-founders, and compile draft business plans
                and grant readiness packs across Ireland, the United Kingdom,
                and international jurisdictions.
              </p>
              <p>
                <strong>Important Disclaimer:</strong> Startup Preflight is an
                educational and productivity software tool—not a law firm,
                certified accounting practice, or regulated financial advisor.
                AI-generated blind-spot reviews, financial templates, and grant
                eligibility scores are provided for informational and
                preparation purposes only. Final grant, loan, or tax relief
                approvals remain at the sole discretion of the respective
                funding bodies (such as Local Enterprise Offices, Enterprise
                Ireland, Innovate UK, British Business Bank, or HMRC).
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">
                3. Intellectual Property &amp; Founder Content Ownership
              </h2>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  <strong>Your Content:</strong> You retain 100% ownership and
                  intellectual property rights in all startup concepts, survey
                  data, financial assumptions, team profiles, and compiled
                  documents you create or upload in your Startup Preflight
                  workspace.
                </li>
                <li>
                  <strong>Platform IP:</strong> Startup Preflight retains all
                  rights, title, and interest in the underlying software
                  architecture, 12-module methodology, prompts, user interface,
                  and branding.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">
                4. Accounts, Passes &amp; AI Usage Guardrails
              </h2>
              <p>
                You are responsible for maintaining the confidentiality of your
                account credentials. Access to Modules B through L, multi-plan
                workspaces, co-founder alignment seats, and document exports is
                governed by your active account entitlement (Free Hook, 6-Month
                Launch Pass, Institutional Cohort Pass, or Lifetime License).
                To ensure platform stability and fair usage, AI calls are
                subject to automated rate limits and monthly token allocations.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">
                5. Acceptable Use Policy
              </h2>
              <p>You agree not to:</p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  Use public validation survey pages for phishing, unlawful data
                  harvesting, deceptive marketing, or spam.
                </li>
                <li>
                  Attempt to bypass authentication, rate limits, tenant
                  isolation, or AI billing circuit breakers via automated
                  scripts or prompt injection.
                </li>
                <li>
                  Upload unlawful, defamatory, or infringing material into any
                  workspace or public survey.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">
                6. Third-Party Partner Links &amp; Marketplace Referrals
              </h2>
              <p>
                The Platform may display contextual links or referrals to
                third-party service providers (such as domain registrars, cloud
                accounting tools, business banking providers, or quote
                suppliers). Startup Preflight does not control or endorse
                third-party terms, and your engagement with any external partner
                is governed solely by that provider&apos;s agreement.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">
                7. Limitation of Liability
              </h2>
              <p>
                To the maximum extent permitted by applicable law, Startup
                Preflight is provided &ldquo;as is&rdquo; without warranties of
                any kind, and Startup Preflight shall not be liable for any
                indirect, incidental, consequential, or special damages,
                including rejected grant applications, lost funding, or business
                interruption arising out of your use of the Platform.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">
                8. Governing Law
              </h2>
              <p>
                These Terms are governed by and construed in accordance with the
                laws of Ireland, without regard to conflict of law principles.
              </p>
            </section>

            <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Mail className="h-4 w-4 text-indigo-600" />
                9. Contact Information
              </h2>
              <p className="mt-1 text-xs text-slate-600">
                Questions regarding these Terms of Service can be directed to{' '}
                <a
                  href="mailto:hello@startuppreflight.com"
                  className="font-semibold text-indigo-600 underline"
                >
                  hello@startuppreflight.com
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-900 py-8 text-xs text-slate-400">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-white">Startup Preflight</span>
            <span>•</span>
            <span>Founding Date: 2026</span>
            <span>•</span>
            <span>© {new Date().getFullYear()} Startup Preflight</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <Link href="/about-founder" className="hover:text-white">
              Meet the Founder
            </Link>
            <Link href="/privacy" className="inline-flex items-center gap-1 hover:text-white">
              <ShieldCheck className="h-3.5 w-3.5" />
              Privacy Policy
            </Link>
            <a href="mailto:hello@startuppreflight.com" className="hover:text-white">
              hello@startuppreflight.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
