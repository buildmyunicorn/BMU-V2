import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  Lock,
  Mail,
  FileText,
  LogIn,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Privacy Policy | Startup Preflight',
  description:
    'Privacy Policy and GDPR Data Protection Notice for Startup Preflight — Supportive AI Co-Founder & Grant Readiness Builder.',
};

export default function PrivacyPolicyPage() {
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
                <ShieldCheck className="h-3.5 w-3.5" />
                EU &amp; UK GDPR Data Protection Notice
              </div>
              <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Privacy Policy
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                Effective Date: January 2026 • Last Updated: October 2026
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-2 text-xs text-emerald-900">
              <Lock className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>
                <strong>Founder IP Protection:</strong> Your business plans are
                never used to train public AI models.
              </span>
            </div>
          </div>

          <div className="mt-8 space-y-7 text-sm leading-relaxed text-slate-700">
            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">
                1. Introduction &amp; Data Controller
              </h2>
              <p>
                Startup Preflight (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or
                &ldquo;us&rdquo;), founded in 2026 and headquartered in Dublin,
                Ireland, operates the Startup Preflight web application and AI
                Co-Founder &amp; Grant Readiness platform. We are committed to
                protecting the privacy, intellectual property, and personal data
                of our founders, co-founders, institutional cohort partners, and
                survey respondents in compliance with the EU General Data
                Protection Regulation (GDPR), the Irish Data Protection Act
                2018, and the UK GDPR / Data Protection Act 2018.
              </p>
              <p>
                For all data privacy inquiries, you can contact our Data
                Protection team at{' '}
                <a
                  href="mailto:hello@startuppreflight.com"
                  className="font-semibold text-indigo-600 underline hover:text-indigo-800"
                >
                  hello@startuppreflight.com
                </a>
                .
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">
                2. Information We Collect
              </h2>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  <strong>Account &amp; Profile Information:</strong> Name,
                  business email address, authentication credentials, role, and
                  jurisdiction preferences when you register for an account or
                  join our early-access waitlist.
                </li>
                <li>
                  <strong>Startup Plan &amp; Workspace Data:</strong> Concept
                  canvases, market sizing assumptions, product roadmaps, unit
                  economics, financial projections, co-founder alignment inputs,
                  and grant readiness materials entered across Modules A through
                  L.
                </li>
                <li>
                  <strong>Validation Survey &amp; Waitlist Data:</strong> When
                  you publish a customer discovery survey, we process the
                  responses and optional waitlist contact details submitted by
                  your prospective customers on your behalf as a Data Processor.
                </li>
                <li>
                  <strong>Technical &amp; Usage Telemetry:</strong> IP address
                  (used strictly for security rate-limiting and regional grant
                  localization), browser type, session cookies, and AI token
                  consumption logs.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">
                3. How We Use Your Data &amp; AI Confidentiality
              </h2>
              <p>We process your information strictly to:</p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  Provide, maintain, and secure your multi-plan startup
                  workspaces and generate structured business plans and grant
                  application drafts.
                </li>
                <li>
                  Deliver AI-assisted synthesis, blind-spot reviews, and grant
                  readiness audits via enterprise cloud infrastructure (Google
                  Cloud Platform and the Google Gemini API).
                </li>
                <li>
                  <strong>Zero Public AI Model Training:</strong> Your
                  proprietary startup ideas, financial projections, and business
                  plans are processed strictly via authenticated enterprise APIs
                  and are <strong>never</strong> sold to third parties or used
                  to train public foundation models.
                </li>
                <li>
                  Enforce platform security, rate limits, and entitlement quotas.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">
                4. Legal Basis for Processing (GDPR Article 6)
              </h2>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  <strong>Contractual Necessity (Art. 6(1)(b)):</strong> To
                  provide the Startup Preflight workspace, AI synthesis, and
                  document compilation services you request.
                </li>
                <li>
                  <strong>Legitimate Interests (Art. 6(1)(f)):</strong> To
                  maintain platform security, prevent abuse or automated spam,
                  and improve product reliability.
                </li>
                <li>
                  <strong>Consent (Art. 6(1)(a)):</strong> When you opt in to
                  our early-access waitlist, product updates, or grant radar
                  notifications (which you may withdraw at any time).
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">
                5. Data Security &amp; Encryption
              </h2>
              <p>
                We implement defense-in-depth technical and organizational
                safeguards, including TLS encryption in transit, encrypted cloud
                PostgreSQL storage at rest, `HttpOnly` signed session tokens,
                strict tenant/plan ownership verification (IDOR protection), and
                AES-256-GCM encryption for any user-supplied Bring-Your-Own-Key
                (BYOK) API credentials.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">
                6. Infrastructure &amp; Sub-Processors
              </h2>
              <p>
                To deliver a fast, reliable service, we rely on trusted cloud
                infrastructure providers bound by GDPR Data Processing
                Agreements (DPAs), including <strong>Google Cloud Platform</strong>{' '}
                (Cloud SQL, Cloud Run, and Google GenAI / Vertex AI services).
                Public validation survey routes isolate respondent personally
                identifiable information (PII) so it is accessible only to the
                authenticated plan owner.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">
                7. Data Retention &amp; Your GDPR Rights
              </h2>
              <p>
                You retain full ownership of your startup plans and may export
                or permanently delete your workspace data at any time. Under EU
                and UK GDPR, you have the right to access, rectify, erase,
                restrict, or export your personal data, and to lodge a complaint
                with the Irish Data Protection Commission (DPC) or the UK
                Information Commissioner&apos;s Office (ICO).
              </p>
            </section>

            <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Mail className="h-4 w-4 text-indigo-600" />
                8. Contact Us
              </h2>
              <p className="mt-1 text-xs text-slate-600">
                If you have questions about this Privacy Policy or wish to
                exercise your data rights, please email{' '}
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
            <Link href="/terms" className="inline-flex items-center gap-1 hover:text-white">
              <FileText className="h-3.5 w-3.5" />
              Terms of Service
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
