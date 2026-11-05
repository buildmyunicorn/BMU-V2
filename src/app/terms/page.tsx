import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Scale,
  ShieldCheck,
  Mail,
  LogIn,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Flame,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/ui/brand-logo';

export const metadata: Metadata = {
  title: 'Terms of Service | Startup Preflight',
  description:
    'Terms of Service and Platform Usage Agreement for Startup Preflight — AI Co-Founder & Grant Readiness Builder.',
};

export default function TermsOfServicePage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <Link href="/" className="flex items-center">
            <BrandLogo variant="full" size="sm" badge="Early Access" theme="light" />
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
          {/* Top Banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                <Scale className="h-3.5 w-3.5" />
                Platform Terms of Service &amp; Master Agreement
              </div>
              <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Terms of Service
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                Effective Date: 1 January 2026 • Last Reviewed &amp; Updated: November 2026
              </p>
            </div>

            <div className="flex items-center gap-2.5 rounded-xl border border-indigo-200 bg-indigo-50/70 px-4 py-2.5 text-xs text-indigo-900">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-indigo-600" />
              <span>
                <strong>100% Founder Ownership:</strong> You retain complete ownership of your business ideas, IP, and compiled business plans.
              </span>
            </div>
          </div>

          <div className="mt-8 space-y-8 text-sm leading-relaxed text-slate-700">
            {/* 1. Agreement to Terms */}
            <section className="space-y-2.5">
              <h2 className="text-base font-bold text-slate-900">
                1. Agreement to Terms &amp; Parties
              </h2>
              <p>
                By accessing, browsing, registering for, or using Startup Preflight (the &ldquo;Platform&rdquo;), operated from Dublin, Ireland, you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;) and our{' '}
                <Link
                  href="/privacy"
                  className="font-semibold text-indigo-600 underline hover:text-indigo-800"
                >
                  Privacy Policy
                </Link>
                . If you are entering into this agreement on behalf of a company, startup partnership, or university incubator, you confirm that you have the legal authority to bind that entity.
              </p>
            </section>

            {/* 2. Non-Advisory Statutory Disclaimer */}
            <section className="space-y-2.5 rounded-2xl border border-amber-200 bg-amber-50/60 p-5 text-amber-950">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <h2 className="text-base text-amber-950">
                  2. Non-Advisory Disclaimer &amp; Grant Approval Autonomy
                </h2>
              </div>
              <p className="text-xs leading-relaxed sm:text-sm">
                <strong>Educational &amp; Preparation Software Only:</strong> Startup Preflight is an AI-assisted software tool designed to help founders structure business ideas, test assumptions, and format funding applications. <strong>Startup Preflight is not a law firm, certified public accounting (CPA) firm, or regulated financial advisor.</strong>
              </p>
              <p className="text-xs leading-relaxed sm:text-sm">
                <strong>No Guarantee of Funding:</strong> While our compiler formats business plans to official funding standards (e.g., Ireland Local Enterprise Office Feasibility/Priming grants, Enterprise Ireland PSSF, UK Innovate UK Smart Grants, British Business Bank Start Up Loans, and HMRC SEIS/EIS Advance Assurance), <strong>final grant awards, loans, or equity investments remain at the sole, independent discretion of each respective funding agency</strong>. Startup Preflight makes no representations, warranties, or guarantees that any submitted application will be funded.
              </p>
            </section>

            {/* 3. Intellectual Property Ownership */}
            <section className="space-y-2.5">
              <h2 className="text-base font-bold text-slate-900">
                3. Intellectual Property Rights &amp; Founder Confidentiality
              </h2>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong>Your Content &amp; Inventions:</strong> You retain 100% full legal ownership, copyright, patent rights, and intellectual property rights in and to all startup concepts, financial models, team resumes, customer survey results, and compiled PDF/DOCX business plan documents generated through your workspace. Startup Preflight takes zero equity and makes no claim over your venture.
                </li>
                <li>
                  <strong>Platform IP:</strong> Startup Preflight and its licensors retain all rights, title, and interest in the proprietary 12-module preflight methodology, user interfaces, algorithmic scoring heuristics, blind-spot analysis engines, and brand assets.
                </li>
                <li>
                  <strong>AI Privacy Safeguards:</strong> Under our enterprise API architecture, your business data is never sold to third parties or used to train public machine learning foundation models.
                </li>
              </ul>
            </section>

            {/* 4. Passes, Billing & Subscriptions */}
            <section className="space-y-2.5">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">
                  4. Access Passes, Pricing &amp; Living Vault Subscriptions
                </h2>
              </div>
              <p>Platform access is structured across transparent entitlements:</p>
              <div className="space-y-2.5 text-xs sm:text-sm">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <strong>Module A Free Hook:</strong> Unrestricted free access to ideation, concept canvas, domain checking, and founder-idea fit scoring.
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <strong>6-Month Launch Passes:</strong> Paid access (Solo or Co-Founder tier) providing full unlock of Modules B through L, document compiler exports, and grant readouts for 6 months.
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <strong>Living Vault Micro-Subscription:</strong> At Month 6, workspaces transition to read-only vault mode. Founders may optionally subscribe to the Living Vault micro-subscription (€9/month or €79/year) to keep all 12 modules editable and receive automated 24/7 Grant Radar alerts. You may cancel anytime via your workspace billing settings or the Stripe Customer Portal.
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <strong>Refund Policy:</strong> We offer a 14-day refund window on software passes provided no deep AI Pre-Flight Audits (Module L) or document compiler exports have been executed.
                </div>
              </div>
            </section>

            {/* 5. Guaranteed Survey Responses & Panel Terms */}
            <section className="space-y-2.5 rounded-2xl border border-orange-200 bg-gradient-to-br from-amber-50/40 via-orange-50/20 to-white p-5">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-amber-600" />
                <h2 className="text-base font-bold text-slate-900">
                  5. Guaranteed Survey Responses (Survey Boost Packs)
                </h2>
              </div>
              <p className="text-xs sm:text-sm">
                Founders may purchase Guaranteed Human Response Packs (50, 100, or 250 responses) in Module C powered by verified participant panels (including Prolific Science Ltd):
              </p>
              <ul className="list-disc space-y-1.5 pl-5 text-xs sm:text-sm">
                <li>
                  <strong>Verified Human Participants:</strong> We guarantee the delivery of real, anti-bot verified human responses meeting your selected geographic (Ireland, UK, US) and demographic criteria within a 24–72 hour target delivery window.
                </li>
                <li>
                  <strong>Unbiased Discovery (Mom-Test Policy):</strong> We guarantee the <em>delivery of responses</em>, <strong>not</strong> that respondents will agree with your concept or express willingness to buy. Responses reflect authentic, unvarnished consumer or business sentiment essential for valid proof of market demand.
                </li>
                <li>
                  <strong>Quality Guard &amp; Replacement:</strong> Any response identified as a speeder (completed in unrealistically fast duration) or exhibiting nonsensical text will be automatically scrubbed and replaced at zero extra charge.
                </li>
                <li>
                  <strong>Niche Pool Availability:</strong> Founders can check active participant pool sizes before purchasing. In the event an ultra-niche demographic cannot achieve minimum response fulfillment within 5 business days, founders are entitled to a pro-rata refund or credit.
                </li>
              </ul>
            </section>

            {/* 6. Co-Founder Alignment & Awkward Questions Survey */}
            <section className="space-y-2.5">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">
                  6. Co-Founder Alignment Engine (Module F)
                </h2>
              </div>
              <p>
                Module F features a multi-seat Blind-Reveal Alignment Survey. Each co-founder agrees to submit honest assessments regarding equity splits, time commitments, and risk thresholds. Responses remain encrypted and hidden from other team members until all invited co-founders complete the interview, whereupon the side-by-side alignment heatmap is revealed.
              </p>
            </section>

            {/* 7. Partner Slot & Affiliate Transparency */}
            <section className="space-y-2.5">
              <h2 className="text-base font-bold text-slate-900">
                7. Partner Recommendations &amp; Affiliate Disclosure
              </h2>
              <p>
                Across Modules D, E, G, and J, Startup Preflight presents contextual links and introductory forms to vetted startup partners (e.g., CRO/Companies House incorporation concierges, business banks, accounting software, and LEO-compliant 3-quote supplier agencies).
              </p>
              <p>
                <strong>Affiliate Transparency:</strong> Startup Preflight may receive referral fees, bank bounties, or introduction commissions from these partners. These partnerships do not increase the price you pay; in many instances, they provide exclusive startup discounts. Your engagement with any partner is subject solely to that third party&apos;s legal terms.
              </p>
            </section>

            {/* 8. Acceptable Use Policy */}
            <section className="space-y-2.5">
              <h2 className="text-base font-bold text-slate-900">
                8. Acceptable Use Policy
              </h2>
              <p>When using the Platform or public survey routes, you agree not to:</p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  Use hosted validation surveys (<code className="rounded bg-slate-100 px-1 py-0.5 text-xs">/v/[slug]</code>) for deceptive phishing, unlawful data harvesting, or unsolicited bulk email spam.
                </li>
                <li>
                  Attempt to reverse-engineer, decompile, or tamper with the AI router, bypass entitlement limits, or exceed the daily platform AI safety ceiling.
                </li>
                <li>
                  Submit fraudulent or deliberately falsified financial statements intended to deceive government grant assessment panels.
                </li>
              </ul>
            </section>

            {/* 9. Limitation of Liability */}
            <section className="space-y-2.5">
              <h2 className="text-base font-bold text-slate-900">
                9. Limitation of Liability
              </h2>
              <p>
                To the maximum extent permitted by applicable Irish and European law, Startup Preflight and its officers, directors, and employees shall not be liable for any indirect, incidental, punitive, special, or consequential damages, including lost profits, loss of business opportunity, rejected grant applications, loss of investor funding, or data loss arising from your use of the Platform. Our total aggregate liability under these Terms shall not exceed the amount actually paid by you to Startup Preflight in the 12 months preceding the claim.
              </p>
            </section>

            {/* 10. Governing Law & Dispute Resolution */}
            <section className="space-y-2.5">
              <h2 className="text-base font-bold text-slate-900">
                10. Governing Law &amp; Jurisdiction
              </h2>
              <p>
                These Terms and any dispute or claim arising out of or in connection with them shall be governed by and construed in accordance with the laws of Ireland. The courts of Dublin, Ireland shall have exclusive jurisdiction to settle any dispute or claim arising from this agreement.
              </p>
            </section>

            {/* 11. Contact Us */}
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Mail className="h-5 w-5 text-indigo-600" />
                11. Questions &amp; Support
              </h2>
              <p className="mt-1 text-xs text-slate-600 sm:text-sm">
                If you have questions regarding these Terms of Service or need enterprise/university cohort terms, please contact us at:
              </p>
              <div className="mt-3 flex items-center gap-3">
                <a
                  href="mailto:hello@startuppreflight.com"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
                >
                  <Mail className="h-3.5 w-3.5" />
                  hello@startuppreflight.com
                </a>
                <span className="text-xs text-slate-500">Dublin, Ireland</span>
              </div>
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
            <span>© {new Date().getFullYear()} Startup Preflight. All rights reserved.</span>
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
