import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  Mail,
  FileText,
  LogIn,
  CheckCircle2,
  Server,
  Cpu,
  Cookie,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/ui/brand-logo';
import { MarketingHeader, MarketingFooter } from '@/components/marketing/marketing-layout-nav';

export const metadata: Metadata = {
  title: 'Privacy Policy | Startup Preflight',
  description:
    'Comprehensive GDPR & UK Data Protection Notice for Startup Preflight — AI Co-Founder & Grant Readiness Platform.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      {/* Header */}
      <MarketingHeader />

      {/* Main Content */}
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-10">
          {/* Top Banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                <ShieldCheck className="h-3.5 w-3.5" />
                EU &amp; UK GDPR Statutory Data Protection Notice
              </div>
              <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Privacy Policy
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                Effective Date: 1 January 2026 • Last Reviewed &amp; Updated: November 2026
              </p>
            </div>

            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-2.5 text-xs text-emerald-900">
              <Lock className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>
                <strong>Zero AI Training:</strong> Your business plans, financials, and IP are strictly private and never used to train public foundation models.
              </span>
            </div>
          </div>

          <div className="mt-8 space-y-8 text-sm leading-relaxed text-slate-700">
            {/* 1. Introduction & Controller */}
            <section className="space-y-2.5">
              <h2 className="text-base font-bold text-slate-900">
                1. Data Controller &amp; Scope
              </h2>
              <p>
                Startup Preflight (&ldquo;Startup Preflight&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;), founded in 2026 and headquartered in Dublin, Ireland, operates the Startup Preflight SaaS web application, workspace platform, and hosted validation survey engine.
              </p>
              <p>
                This Privacy Policy outlines how we collect, process, store, and protect personal data in strict compliance with the <strong>EU General Data Protection Regulation (Regulation (EU) 2016/679 - GDPR)</strong>, the <strong>Irish Data Protection Act 2018</strong>, and the <strong>UK GDPR / Data Protection Act 2018</strong>.
              </p>
              <p>
                Depending on your relationship with us, Startup Preflight acts as either a <strong>Data Controller</strong> or a <strong>Data Processor</strong>:
              </p>
              <ul className="list-disc space-y-1 pl-5 text-xs sm:text-sm">
                <li>
                  <strong>Data Controller:</strong> For registered founders, co-founders, and workspace collaborators regarding account credentials, billing details, platform telemetry, and direct support interactions.
                </li>
                <li>
                  <strong>Data Processor:</strong> When you publish a customer discovery survey or waitlist page (<code className="rounded bg-slate-100 px-1 py-0.5 text-xs">startuppreflight.com/v/[slug]</code>) in Module C. In this scenario, you are the Data Controller for your respondents&apos; survey answers and contact emails, and we process that data solely on your instruction.
                </li>
              </ul>
            </section>

            {/* 2. Information We Collect */}
            <section className="space-y-2.5">
              <h2 className="text-base font-bold text-slate-900">
                2. Information We Collect &amp; How It Is Collected
              </h2>
              <div className="space-y-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
                  <h3 className="font-semibold text-slate-900">A. Founder Account &amp; Profile Data</h3>
                  <p className="mt-1 text-xs text-slate-600">
                    Full name, email address, password hashes (managed securely via Better-Auth with cryptographic salting), country of residence, preferred currency (EUR, GBP, USD), and organization/cohort affiliation.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
                  <h3 className="font-semibold text-slate-900">B. Business Workspace, Plan &amp; Grant Data</h3>
                  <p className="mt-1 text-xs text-slate-600">
                    Information you enter across the 12 Founder Modules (A–L): concept canvases, market research, competitor matrices, product work packages, premises/equipment schedules, team resumes and personal survival budgets, unit economics, 36-month financial cash flows, and generated business plan documents.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
                  <h3 className="font-semibold text-slate-900">C. Customer Discovery Surveys &amp; Waitlist Submissions</h3>
                  <p className="mt-1 text-xs text-slate-600">
                    When public surveys are distributed, we collect respondent ratings, multiple-choice selections, qualitative interview notes, and optional email addresses for early-bird waitlists. All survey submission routes isolate respondent personal data from public endpoints.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
                  <h3 className="font-semibold text-slate-900">D. Billing &amp; Payment Data</h3>
                  <p className="mt-1 text-xs text-slate-600">
                    Payment card transactions are processed directly by our PCI-DSS Level 1 compliant payment processor, <strong>Stripe Payments Europe, Ltd.</strong> Startup Preflight never stores, views, or transmits raw credit card numbers or security CVV codes.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
                  <h3 className="font-semibold text-slate-900">E. Security &amp; Technical Telemetry</h3>
                  <p className="mt-1 text-xs text-slate-600">
                    IP address (used strictly for Cloud Armor DDoS defense, rate-limiting, and geo-IP regional grant pre-selection), browser type, operating system, and AI token consumption logs.
                  </p>
                </div>
              </div>
            </section>

            {/* 3. AI Confidentiality & Enterprise Data Protection */}
            <section className="space-y-2.5 rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 via-white to-slate-50 via-white to-slate-50/20 p-5">
              <div className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-emerald-700" />
                <h2 className="text-base font-bold text-slate-900">
                  3. AI Confidentiality &amp; Zero Public Model Training Guarantee
                </h2>
              </div>
              <p>
                Startup Preflight integrates Google Cloud GenAI (Vertex AI / Gemini API) to provide automated synthesis, blind-spot analysis, and grant compliance checks. We enforce strict contractual and technical protections:
              </p>
              <ul className="list-disc space-y-1.5 pl-5 text-xs sm:text-sm">
                <li>
                  <strong>No Model Training:</strong> Under our enterprise API terms with Google Cloud, your business plans, trade secrets, financial models, and inputs are <strong>never</strong> used to train, retrain, or improve foundational AI models.
                </li>
                <li>
                  <strong>Server-Side Isolation:</strong> All AI interactions pass through our secure backend router (<code className="rounded bg-emerald-100/70 px-1 py-0.5 text-xs text-emerald-900">src/lib/ai/router.ts</code>). API keys are never exposed to client browsers, and all prompts are sanitized to remove unnecessary identifiers.
                </li>
                <li>
                  <strong>BYOK Encryption:</strong> If your tier supports Bring-Your-Own-Key (BYOK), your custom API keys are encrypted at rest using <strong>AES-256-GCM</strong> and decrypted exclusively in memory at the moment of authorized execution.
                </li>
              </ul>
            </section>

            {/* 4. Legal Basis for Processing */}
            <section className="space-y-2.5">
              <h2 className="text-base font-bold text-slate-900">
                4. Legal Bases for Processing (GDPR Article 6)
              </h2>
              <p>We process your personal data under the following lawful grounds:</p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  <strong>Performance of a Contract (Art. 6(1)(b)):</strong> To authenticate you, host your multi-plan workspaces, run customer surveys, process payments, and compile grant-ready business plans.
                </li>
                <li>
                  <strong>Legitimate Interests (Art. 6(1)(f)):</strong> To safeguard platform security, prevent unauthorized access or automated scraping, enforce fair-use rate limits, and provide technical troubleshooting.
                </li>
                <li>
                  <strong>Consent (Art. 6(1)(a)):</strong> When you opt in to product update newsletters, grant deadline radars, or when survey respondents explicitly consent to joining your waitlist.
                </li>
                <li>
                  <strong>Legal Obligation (Art. 6(1)(c)):</strong> To maintain statutory accounting and tax records for VAT, PRSI/NIC, and corporate revenue authorities in Ireland and the UK.
                </li>
              </ul>
            </section>

            {/* 5. Sub-Processors & Data Hosting */}
            <section className="space-y-2.5">
              <h2 className="text-base font-bold text-slate-900">
                5. Third-Party Sub-Processors &amp; Data Residency
              </h2>
              <p>
                Your primary database and application services are hosted within the European Union on <strong>Google Cloud Platform (Dublin, Ireland / europe-west1)</strong>. We engage only trusted sub-processors bound by standard GDPR Data Processing Agreements (DPAs):
              </p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px] border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100 text-slate-700">
                      <th className="p-2.5 font-bold">Sub-Processor</th>
                      <th className="p-2.5 font-bold">Function</th>
                      <th className="p-2.5 font-bold">Location</th>
                      <th className="p-2.5 font-bold">Safeguards</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-2.5 font-semibold text-slate-900">Google Cloud Platform</td>
                      <td className="p-2.5 text-slate-600">Cloud SQL (PostgreSQL), Cloud Run, Gemini Enterprise AI</td>
                      <td className="p-2.5 text-slate-600">Ireland (EU)</td>
                      <td className="p-2.5 text-slate-600">EU Data Residency &amp; ISO 27001</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold text-slate-900">Stripe Payments Europe, Ltd.</td>
                      <td className="p-2.5 text-slate-600">Payment processing, recurring subscriptions, tax compliance</td>
                      <td className="p-2.5 text-slate-600">Ireland / Global</td>
                      <td className="p-2.5 text-slate-600">PCI-DSS Level 1 &amp; EU-US DPF / SCCs</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold text-slate-900">Prolific Science Ltd</td>
                      <td className="p-2.5 text-slate-600">Guaranteed survey participant panel fulfillment (Module C)</td>
                      <td className="p-2.5 text-slate-600">United Kingdom</td>
                      <td className="p-2.5 text-slate-600">UK GDPR / EU Adequacy Decision</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 6. Cookies & Tracking Policy */}
            <section className="space-y-2.5">
              <div className="flex items-center gap-2">
                <Cookie className="h-5 w-5 text-emerald-700" />
                <h2 className="text-base font-bold text-slate-900">
                  6. Cookie Policy &amp; Storage Technologies
                </h2>
              </div>
              <p>
                We do not sell your personal data or use invasive third-party ad retargeting trackers. We use strictly necessary and functional cookies:
              </p>
              <ul className="list-disc space-y-1.5 pl-5 text-xs sm:text-sm">
                <li>
                  <strong>Authentication Cookie (<code className="rounded bg-slate-100 px-1 py-0.5 text-xs">spf_session</code>):</strong> Secure, <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">HttpOnly</code>, <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">SameSite=Lax</code> token used to maintain your logged-in session.
                </li>
                <li>
                  <strong>Regional Localization Cookie (<code className="rounded bg-slate-100 px-1 py-0.5 text-xs">spf_region</code>):</strong> Remembers whether you are building plans tailored to Ireland (LEO/EI), the UK (Innovate UK/Start Up Loans), or International grants.
                </li>
              </ul>
            </section>

            {/* 7. Data Retention & Erasure */}
            <section className="space-y-2.5">
              <h2 className="text-base font-bold text-slate-900">
                7. Data Retention &amp; Account Deletion
              </h2>
              <p>
                We retain your workspace plans and account data for as long as your account remains active or as needed to provide our services. You maintain 100% control: you can permanently delete any startup plan or request full account erasure at any time. When an account is deleted, all associated plans, canvases, financial tables, and survey responses are purged from our live database within 30 days.
              </p>
            </section>

            {/* 8. Your GDPR Rights */}
            <section className="space-y-2.5">
              <h2 className="text-base font-bold text-slate-900">
                8. Your Data Protection Rights
              </h2>
              <p>Under European and UK data protection laws, you possess the right to:</p>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <div>
                    <strong className="text-xs font-bold text-slate-900">Right of Access (Art. 15)</strong>
                    <p className="text-[11px] text-slate-600">Request a copy of all personal data held about you.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <div>
                    <strong className="text-xs font-bold text-slate-900">Right to Erasure / &ldquo;Be Forgotten&rdquo; (Art. 17)</strong>
                    <p className="text-[11px] text-slate-600">Request complete deletion of your account and startup plans.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <div>
                    <strong className="text-xs font-bold text-slate-900">Right to Data Portability (Art. 20)</strong>
                    <p className="text-[11px] text-slate-600">Export your plans and financials in PDF, Markdown, or JSON.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <div>
                    <strong className="text-xs font-bold text-slate-900">Right to Rectification (Art. 16)</strong>
                    <p className="text-[11px] text-slate-600">Correct any inaccurate or outdated personal profile information.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 9. Contact & Supervisory Authority */}
            <section className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Mail className="h-5 w-5 text-emerald-700" />
                9. Contact Us &amp; Regulatory Supervision
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-slate-700 sm:text-sm">
                To exercise any of your data protection rights, or if you have questions regarding this Privacy Policy, please reach our Data Protection Officer at:
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <a
                  href="mailto:hello@startuppreflight.com"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-800"
                >
                  <Mail className="h-3.5 w-3.5" />
                  hello@startuppreflight.com
                </a>
                <span className="text-xs text-slate-500">Dublin, Ireland</span>
              </div>
              <p className="mt-4 border-t border-slate-200/60 pt-3 text-xs text-slate-600">
                If you believe your personal data has been handled inconsistently with GDPR, you have the right to lodge a complaint with your local supervisory authority:
                <br />
                <strong>Ireland:</strong> Data Protection Commission (DPC), 21 Fitzwilliam Square South, Dublin 2 (<a href="https://www.dataprotection.ie" target="_blank" rel="noreferrer" className="underline hover:text-emerald-900">dataprotection.ie</a>)
                <br />
                <strong>United Kingdom:</strong> Information Commissioner&apos;s Office (ICO), Wycliffe House, Water Lane, Wilmslow (<a href="https://ico.org.uk" target="_blank" rel="noreferrer" className="underline hover:text-emerald-900">ico.org.uk</a>)
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <MarketingFooter />
    </div>
  );
}
