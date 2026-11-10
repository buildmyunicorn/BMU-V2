'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Mail,
  ShieldCheck,
  Loader2,
  X,
  Building2,
  FileText,
  Send,
  ExternalLink,
  Search,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PartnerSlot } from '@/components/workspace/partner-slot';
import {
  claimCohortMilestoneRewardAction,
  type CohortMilestoneClaimDossier,
  type CohortMilestoneExecutiveSummary,
  type CohortMilestonePlanState,
} from '@/app/actions/cohort-milestone-claim';

const CONSUMER_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.uk',
  'yahoo.ie',
  'hotmail.com',
  'hotmail.co.uk',
  'outlook.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'protonmail.com',
  'proton.me',
]);

interface DomainAvailabilityItem {
  domain: string;
  tld: string;
  available: boolean;
  statusLabel: string;
}

interface CohortMilestoneClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  hqCountryCode: string;
  founderName: string;
  founderEmail: string;
  cohortCode?: string;
  cohort: NonNullable<CohortMilestonePlanState['cohort']>;
  existingClaimDossier?: CohortMilestoneClaimDossier | null;
  initialDomain?: string;
  initialWorkEmail?: string;
  overallProgressPercent: number;
  moduleProgressMap: Record<string, number>;
  executiveSummary: CohortMilestoneExecutiveSummary;
  onClaimSuccess: (dossier: CohortMilestoneClaimDossier) => void;
}

const MODULE_LABELS: Record<string, string> = {
  MOD_A_IDEATION: 'Module A: Ideation & Concept',
  MOD_B_MARKET: 'Module B: Market & Competitors',
  MOD_C_SURVEYS_FEEDBACK: 'Module C: Customer Surveys',
  MOD_D_PRODUCT_BUILD: 'Module D: Product & MVP Spec',
  MOD_E_OPERATIONS: 'Module E: Operations & Risk',
  MOD_F_COFOUNDER_TEAM: 'Module F: Team & Alignment',
  MOD_G_LAUNCHPAD: 'Module G: Launchpad Setup',
  MOD_H_REVENUE: 'Module H: Pricing & Breakeven',
  MOD_I_MARKETING: 'Module I: Go-To-Market',
  MOD_J_FINANCE: 'Module J: 3-Year Finance',
  MOD_K_GRANTS_FUNDING: 'Module K: Grants & Funding',
  MOD_L_BUSINESS_PLAN: 'Module L: Business Plan Studio',
};

export function CohortMilestoneClaimModal({
  isOpen,
  onClose,
  planId,
  hqCountryCode,
  founderName,
  founderEmail,
  cohortCode,
  cohort,
  existingClaimDossier,
  initialDomain = '',
  initialWorkEmail = '',
  overallProgressPercent,
  moduleProgressMap,
  executiveSummary,
  onClaimSuccess,
}: CohortMilestoneClaimModalProps) {
  const [domainInput, setDomainInput] = useState(
    existingClaimDossier?.verifiedDomain || initialDomain
  );
  const [workEmailInput, setWorkEmailInput] = useState(
    existingClaimDossier?.verifiedWorkEmail || initialWorkEmail || founderEmail
  );
  const [founderNotes, setFounderNotes] = useState(
    existingClaimDossier?.founderNotes || ''
  );

  const [isCheckingDomain, setIsCheckingDomain] = useState(false);
  const [domainResults, setDomainResults] = useState<DomainAvailabilityItem[]>(
    []
  );
  const [showDomainPartnerHelp, setShowDomainPartnerHelp] = useState(false);
  const [showEmailPartnerHelp, setShowEmailPartnerHelp] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedDossier, setSubmittedDossier] =
    useState<CohortMilestoneClaimDossier | null>(existingClaimDossier || null);

  if (!isOpen) return null;

  const { milestoneConfig } = cohort;

  const cleanEmailLower = (workEmailInput || '').trim().toLowerCase();
  const emailDomainPart = cleanEmailLower.split('@')[1] || '';
  const isConsumerEmailWarning =
    milestoneConfig.requireWorkEmail &&
    Boolean(emailDomainPart) &&
    CONSUMER_DOMAINS.has(emailDomainPart);

  async function handleCheckDomainAvailability() {
    const query = domainInput.trim() || executiveSummary.startupTitle.trim();
    if (!query) return;

    setIsCheckingDomain(true);
    setDomainResults([]);
    try {
      const res = await fetch(
        `/api/domains/check?name=${encodeURIComponent(query)}&country=${encodeURIComponent(hqCountryCode)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.results)) {
          setDomainResults(data.results);
        }
      }
    } catch {
      // Non-fatal
    } finally {
      setIsCheckingDomain(false);
    }
  }

  async function handleSubmitClaim(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (milestoneConfig.requireOfficialDomain && !domainInput.trim()) {
      setErrorMsg(
        'Please enter your official company domain (e.g. yourstartup.com or yourstartup.ie).'
      );
      return;
    }

    if (isConsumerEmailWarning) {
      setErrorMsg(
        `${cohort.organizationName} requires an official @company domain work email rather than @${emailDomainPart} to activate ${milestoneConfig.rewardLabel}.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await claimCohortMilestoneRewardAction({
        planId,
        verifiedDomain: domainInput,
        verifiedWorkEmail: workEmailInput,
        founderNotes,
        clientFallback: {
          cohortCode: cohortCode || cohort.inviteCode,
          userEmail: founderEmail,
          founderName,
        },
        clientProgressSnapshot: {
          overallProgressPercent,
          moduleProgressMap,
          executiveSummary,
        },
      });

      if (!res.ok || !res.dossier) {
        setErrorMsg(
          res.error ||
            'Could not submit your milestone claim. Please check your details and try again.'
        );
        setIsSubmitting(false);
        return;
      }

      setSubmittedDossier(res.dossier);
      onClaimSuccess(res.dossier);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while submitting your claim.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-xs sm:p-6">
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Top Gradient Header */}
        <div className="flex items-start justify-between gap-4 bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 px-5 py-4 text-white sm:px-6 sm:py-5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-emerald-400/40 bg-emerald-500/20 text-[10px] font-bold text-emerald-200">
                {submittedDossier
                  ? '✓ Partner Verification Dispatched'
                  : '✓ Milestone Gate Unlocked'}
              </Badge>
              <span className="text-[11px] font-medium text-indigo-200">
                {cohort.organizationName} • {cohort.name}
              </span>
            </div>
            <h2 className="mt-1.5 text-lg font-bold tracking-tight text-white sm:text-xl">
              {milestoneConfig.rewardLabel}
            </h2>
            <p className="mt-0.5 text-xs text-indigo-100/90">
              {submittedDossier
                ? `Your verified venture dossier has been sent to the ${cohort.organizationName} partner team.`
                : `Verify your official company domain & work email to dispatch your readiness dossier to ${cohort.organizationName}.`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-indigo-200 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {submittedDossier ? (
            <div className="space-y-5">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-emerald-950">
                      Claim Submitted &amp; Partner Team Notified!
                    </h3>
                    <p className="text-xs leading-relaxed text-emerald-900">
                      We have dispatched your verified startup dossier for{' '}
                      <strong>
                        {submittedDossier.executiveSummary.startupTitle}
                      </strong>{' '}
                      to <strong>{cohort.organizationName}</strong> and sent a
                      copy to{' '}
                      <strong>{submittedDossier.verifiedWorkEmail}</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {milestoneConfig.instructionNotes && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-800">
                    Next Steps from {cohort.organizationName}
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-indigo-950">
                    {milestoneConfig.instructionNotes}
                  </p>
                </div>
              )}

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2.5 text-xs">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Submitted Verification Summary
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <span className="text-slate-500">Startup Venture:</span>{' '}
                    <span className="font-bold text-slate-900">
                      {submittedDossier.executiveSummary.startupTitle}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Readiness Score:</span>{' '}
                    <span className="font-bold text-emerald-700">
                      {submittedDossier.overallProgressPercent}% Verified
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Official Domain:</span>{' '}
                    <span className="font-mono font-semibold text-indigo-700">
                      https://{submittedDossier.verifiedDomain}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Verified Work Email:</span>{' '}
                    <span className="font-mono font-semibold text-slate-900">
                      {submittedDossier.verifiedWorkEmail}
                    </span>
                  </div>
                </div>
                <div className="border-t border-slate-200/80 pt-2 text-[11px] text-slate-500">
                  Submitted on{' '}
                  {new Intl.DateTimeFormat('en-IE', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }).format(new Date(submittedDossier.claimedAtIso))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  onClick={onClose}
                  className="w-full bg-slate-900 text-xs font-bold text-white hover:bg-slate-800 sm:w-auto"
                >
                  Return to Founder Workspace
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitClaim} className="space-y-5">
              {/* Section 1: Corporate Domain & Work Email Verification */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
                <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-indigo-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Step 1: Corporate Domain &amp; Work Email Verification
                    </h3>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-indigo-200 bg-white text-[10px] font-semibold text-indigo-700"
                  >
                    Mandatory Partner Check
                  </Badge>
                </div>

                {/* Official Company Website Domain */}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <Label
                      htmlFor="claim-company-domain"
                      className="text-xs font-semibold text-slate-800"
                    >
                      Official Company Domain{' '}
                      {milestoneConfig.requireOfficialDomain && (
                        <span className="text-red-600">*</span>
                      )}
                    </Label>
                    <button
                      type="button"
                      onClick={() =>
                        setShowDomainPartnerHelp(!showDomainPartnerHelp)
                      }
                      className="text-[11px] font-semibold text-indigo-600 hover:underline"
                    >
                      {showDomainPartnerHelp
                        ? 'Hide Domain Setup Perks'
                        : "Don't have a domain yet? Check availability →"}
                    </button>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative flex-1">
                      <Globe className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        id="claim-company-domain"
                        placeholder="e.g. yourstartup.com or yourstartup.ie"
                        value={domainInput}
                        onChange={(e) => setDomainInput(e.target.value)}
                        className="bg-white pl-9 text-base sm:text-xs"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCheckDomainAvailability}
                      disabled={isCheckingDomain}
                      className="h-9 shrink-0 border-slate-300 bg-white text-xs font-semibold text-slate-700"
                    >
                      {isCheckingDomain ? (
                        <>
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          Checking DNS...
                        </>
                      ) : (
                        <>
                          <Search className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
                          Verify / Check DNS
                        </>
                      )}
                    </Button>
                  </div>

                  {domainResults.length > 0 && (
                    <div className="mt-2 rounded-lg border border-slate-200 bg-white p-2.5">
                      <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Live Domain DNS Check — Click to Select
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {domainResults.map((item) => (
                          <button
                            key={item.domain}
                            type="button"
                            onClick={() => setDomainInput(item.domain)}
                            className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ${
                              domainInput === item.domain
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-950'
                                : item.available
                                  ? 'border-emerald-200 bg-emerald-50/60 text-emerald-900 hover:bg-emerald-100/70'
                                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <span className="font-mono font-bold">
                              {item.domain}
                            </span>
                            <span
                              className={`text-[10px] ${
                                item.available
                                  ? 'text-emerald-700'
                                  : 'text-indigo-700'
                              }`}
                            >
                              {item.available
                                ? '• Available to Register'
                                : '• Registered (Active DNS)'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {showDomainPartnerHelp && (
                    <div className="mt-2 rounded-xl border border-indigo-200/80 bg-white p-3">
                      <PartnerSlot
                        slot="OPS_STEP_2_DOMAIN"
                        countryCode={hqCountryCode}
                        projectId={planId}
                        planTitle={executiveSummary.startupTitle}
                        founderName={founderName}
                        founderEmail={founderEmail}
                        selectedDomain={domainInput}
                        compact
                      />
                    </div>
                  )}
                </div>

                {/* Official @company Work Email */}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <Label
                      htmlFor="claim-work-email"
                      className="text-xs font-semibold text-slate-800"
                    >
                      Official @company Work Email{' '}
                      {milestoneConfig.requireWorkEmail && (
                        <span className="text-red-600">*</span>
                      )}
                    </Label>
                    <button
                      type="button"
                      onClick={() =>
                        setShowEmailPartnerHelp(!showEmailPartnerHelp)
                      }
                      className="text-[11px] font-semibold text-indigo-600 hover:underline"
                    >
                      {showEmailPartnerHelp
                        ? 'Hide Work Email Perks'
                        : 'Need a Google Workspace @company email? →'}
                    </button>
                  </div>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="claim-work-email"
                      type="email"
                      placeholder="founder@yourstartup.com"
                      value={workEmailInput}
                      onChange={(e) => setWorkEmailInput(e.target.value)}
                      className={`bg-white pl-9 text-base sm:text-xs ${
                        isConsumerEmailWarning
                          ? 'border-amber-400 ring-1 ring-amber-200'
                          : ''
                      }`}
                    />
                  </div>

                  {isConsumerEmailWarning && (
                    <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-950">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                      <div className="space-y-1">
                        <div className="font-bold">
                          Personal @{emailDomainPart} Address Detected
                        </div>
                        <p className="text-[11px] leading-relaxed text-amber-900">
                          {cohort.organizationName} underwriting requires an
                          official <strong>@company</strong> domain email (e.g.{' '}
                          <code className="font-mono">
                            founder@{domainInput || 'yourstartup.com'}
                          </code>
                          ) to activate startup credits.
                        </p>
                      </div>
                    </div>
                  )}

                  {showEmailPartnerHelp && (
                    <div className="mt-2 rounded-xl border border-indigo-200/80 bg-white p-3">
                      <PartnerSlot
                        slot="OPS_STEP_2_EMAIL"
                        countryCode={hqCountryCode}
                        projectId={planId}
                        planTitle={executiveSummary.startupTitle}
                        founderName={founderName}
                        founderEmail={founderEmail}
                        selectedDomain={domainInput}
                        compact
                      />
                    </div>
                  )}
                </div>

                {/* Optional Cloud Account ID / Partner Note */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="claim-founder-notes"
                    className="text-xs font-semibold text-slate-800"
                  >
                    Cloud Billing Account ID or Note for{' '}
                    {cohort.organizationName} (Optional)
                  </Label>
                  <Input
                    id="claim-founder-notes"
                    placeholder="e.g. Google Cloud Billing ID: 01XXXX-XXXXXX-XXXXXX or cohort advisor name"
                    value={founderNotes}
                    onChange={(e) => setFounderNotes(e.target.value)}
                    className="bg-white text-base sm:text-xs"
                  />
                </div>
              </div>

              {/* Section 2: Executive Venture Dossier Preview */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-emerald-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Step 2: Verified Venture Dossier Preview
                    </h3>
                  </div>
                  <Badge className="bg-emerald-100 text-[10px] font-bold text-emerald-800">
                    {overallProgressPercent}% Readiness Verified
                  </Badge>
                </div>

                <p className="text-[11px] text-slate-500">
                  This executive snapshot is automatically compiled from your
                  completed modules and attached to your partner verification
                  email:
                </p>

                <div className="grid grid-cols-1 gap-2.5 rounded-lg border border-slate-100 bg-slate-50/80 p-3 text-xs sm:grid-cols-2">
                  <div>
                    <span className="text-[11px] text-slate-500">Venture:</span>{' '}
                    <span className="font-bold text-slate-900">
                      {executiveSummary.startupTitle}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500">
                      HQ &amp; Sector:
                    </span>{' '}
                    <span className="font-medium text-slate-800">
                      {executiveSummary.hqCountryCode} •{' '}
                      {executiveSummary.industryCategory}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[11px] text-slate-500">
                      One-Liner:
                    </span>{' '}
                    <span className="text-slate-800">
                      {executiveSummary.oneLiner || '—'}
                    </span>
                  </div>
                  {executiveSummary.beachheadPersona && (
                    <div className="sm:col-span-2">
                      <span className="text-[11px] text-slate-500">
                        Beachhead Customer:
                      </span>{' '}
                      <span className="text-slate-800">
                        {executiveSummary.beachheadPersona}
                      </span>
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <span className="text-[11px] text-slate-500">
                      Validation Traction (Module C):
                    </span>{' '}
                    <span className="font-semibold text-indigo-700">
                      {executiveSummary.surveyRespondentsCount ?? 0} Survey
                      Responses • {executiveSummary.waitlistLeadsCount ?? 0}{' '}
                      Waitlist Leads
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {milestoneConfig.requiredModules.map((modCode) => {
                    const pct = moduleProgressMap[modCode] ?? 0;
                    return (
                      <span
                        key={modCode}
                        className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800"
                      >
                        <Check className="h-3 w-3 text-emerald-600" />
                        {MODULE_LABELS[modCode] || modCode} ({pct}%)
                      </span>
                    );
                  })}
                </div>
              </div>

              {errorMsg && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-800">
                  {errorMsg}
                </div>
              )}

              {/* Bottom Action Bar */}
              <div className="flex flex-col-reverse items-center justify-between gap-3 border-t border-slate-200 pt-4 sm:flex-row">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="w-full text-xs text-slate-600 sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-emerald-600 px-5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 sm:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      Verifying &amp; Dispatching Dossier...
                    </>
                  ) : (
                    <>
                      <Send className="mr-1.5 h-3.5 w-3.5" />
                      Verify &amp; Claim: {milestoneConfig.rewardLabel}
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
