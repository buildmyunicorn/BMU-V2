'use client';

import React, { useState, useEffect } from 'react';
import {
  ExternalLink,
  CheckCircle2,
  Sparkles,
  Copy,
  Check,
  Send,
  X,
  Mail,
  ShieldCheck,
  Loader2,
  Handshake,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DEFAULT_PARTNER_OFFERS,
  getWarmIntroQuestionsForPartner,
  loadLocalPartnerOffers,
  loadLocalReferralEvents,
  saveLocalReferralEvents,
  type PartnerOfferRecord,
  type PartnerSlotKey,
} from '@/lib/partners/partner-catalog-store';
import {
  listPublicActivePartnerOffersAction,
  logPartnerAffiliateClickAction,
  submitPartnerWarmIntroLeadAction,
} from '@/app/actions/admin-partners';

export type { PartnerSlotKey };
export type PartnerOffer = PartnerOfferRecord;

interface PartnerSlotProps {
  slot: PartnerSlotKey;
  countryCode?: string;
  projectId?: string;
  planTitle?: string;
  oneLinerSummary?: string;
  founderName?: string;
  founderEmail?: string;
  selectedDomain?: string;
  title?: string;
  description?: string;
  className?: string;
  compact?: boolean;
  onPartnerActionTriggered?: (partner: PartnerOfferRecord, actionType: 'AFFILIATE_LINK' | 'WARM_INTRO_MODAL') => void;
}

export function PartnerSlot({
  slot,
  countryCode = 'IE',
  projectId,
  planTitle,
  oneLinerSummary,
  founderName: initialFounderName = '',
  founderEmail: initialFounderEmail = '',
  selectedDomain,
  title,
  description,
  className = '',
  compact = false,
  onPartnerActionTriggered,
}: PartnerSlotProps) {
  const [offers, setOffers] = useState<PartnerOfferRecord[]>(() =>
    DEFAULT_PARTNER_OFFERS.filter((o) => o.isActive && o.slotKey === slot)
  );
  const [copiedPromoId, setCopiedPromoId] = useState<string | null>(null);

  // Warm Intro Modal State
  const [activeIntroPartner, setActiveIntroPartner] = useState<PartnerOfferRecord | null>(null);
  const [founderName, setFounderName] = useState(initialFounderName);
  const [founderEmail, setFounderEmail] = useState(initialFounderEmail);
  const [companyOrPlanName, setCompanyOrPlanName] = useState(planTitle || '');
  const [intakeAnswers, setIntakeAnswers] = useState<Record<string, string>>({});
  const [customOtherAnswers, setCustomOtherAnswers] = useState<Record<string, string>>({});
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isSubmittingIntro, setIsSubmittingIntro] = useState(false);
  const [introSentSuccess, setIntroSentSuccess] = useState<{
    partnerName: string;
    recipientEmail: string;
    founderEmail: string;
  } | null>(null);

  // Sync props when parent updates
  useEffect(() => {
    if (initialFounderName && !founderName) setFounderName(initialFounderName);
  }, [initialFounderName, founderName]);

  useEffect(() => {
    if (initialFounderEmail && !founderEmail) setFounderEmail(initialFounderEmail);
  }, [initialFounderEmail, founderEmail]);

  useEffect(() => {
    if (planTitle && !companyOrPlanName) setCompanyOrPlanName(planTitle);
  }, [planTitle, companyOrPlanName]);

  // Load live partner catalog from DB + localStorage fallback
  useEffect(() => {
    let mounted = true;

    // 1. Immediate local cache check (so Admin edits in another tab reflect right away)
    const localCatalog = loadLocalPartnerOffers().filter(
      (o) => o.isActive && o.slotKey === slot
    );
    if (localCatalog.length > 0) {
      setOffers(localCatalog.sort((a, b) => a.sortOrder - b.sortOrder));
    }

    // 2. Server DB sync
    listPublicActivePartnerOffersAction()
      .then((res) => {
        if (!mounted || !res.ok) return;
        if (res.dbConnected) {
          const slotOffers = res.offers
            .filter((o) => o.isActive && o.slotKey === slot)
            .sort((a, b) => a.sortOrder - b.sortOrder);
          if (slotOffers.length > 0) {
            setOffers(slotOffers);
          }
        }
      })
      .catch(() => {
        // Fallback already loaded
      });

    return () => {
      mounted = false;
    };
  }, [slot]);

  const normalizedCountry =
    countryCode === 'GB' || countryCode === 'UK'
      ? 'GB'
      : countryCode === 'IE'
        ? 'IE'
        : 'ALL';

  const filtered = offers.filter(
    (p) => p.countryScope === 'ALL' || p.countryScope === normalizedCountry
  );
  const partnersToRender = filtered.length > 0 ? filtered : offers;

  if (partnersToRender.length === 0) {
    return null;
  }

  const handleCopyPromoCode = (partnerId: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedPromoId(partnerId);
    setTimeout(() => setCopiedPromoId(null), 2000);
  };

  const handleOpenWarmIntroModal = (partner: PartnerOfferRecord) => {
    const questions = getWarmIntroQuestionsForPartner(partner);
    const initialMap: Record<string, string> = {};
    for (const q of questions) {
      if (q.id === 'desired_domain_name' && selectedDomain) {
        initialMap[q.id] = selectedDomain;
      } else if (q.id === 'proposed_company_name_1' && (planTitle || companyOrPlanName)) {
        initialMap[q.id] = planTitle || companyOrPlanName;
      } else if (q.type === 'SELECT' && q.options && q.options.length > 0) {
        initialMap[q.id] = q.options[0];
      } else {
        initialMap[q.id] = '';
      }
    }
    setIntakeAnswers(initialMap);
    setCustomOtherAnswers({});
    setAdditionalNotes('');
    setIntroSentSuccess(null);
    setActiveIntroPartner(partner);
  };

  const handleAffiliateClick = (partner: PartnerOfferRecord) => {
    onPartnerActionTriggered?.(partner, 'AFFILIATE_LINK');
    // Also record in local fallback ledger and server action
    logPartnerAffiliateClickAction({
      partnerId: partner.id,
      partnerName: partner.name,
      partnerSlug: partner.slug,
      slotKey: partner.slotKey,
      planId: projectId || 'direct',
      planTitle: planTitle || undefined,
      founderName: founderName || undefined,
      founderEmail: founderEmail || undefined,
      countryCode: normalizedCountry,
      selectedDomain: selectedDomain || undefined,
      destinationUrl: partner.referralUrl,
      estimatedBountyAmount: partner.commissionBountySummary || null,
    })
      .then((res) => {
        if (res.ok && res.event) {
          const existing = loadLocalReferralEvents();
          saveLocalReferralEvents([res.event, ...existing].slice(0, 250));
        }
      })
      .catch(() => {
        // non-blocking
      });
  };

  const handleSubmitWarmIntro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeIntroPartner) return;
    if (!founderName.trim() || !founderEmail.trim()) return;

    setIsSubmittingIntro(true);
    try {
      const questions = getWarmIntroQuestionsForPartner(activeIntroPartner);
      const formattedAnswers: Record<string, string> = {};

      for (const q of questions) {
        const rawVal = intakeAnswers[q.id] || '';
        const finalVal =
          rawVal === 'OTHER'
            ? customOtherAnswers[q.id]?.trim() || 'Other (Custom)'
            : rawVal;
        formattedAnswers[q.label] = finalVal || 'Not specified';
      }

      if (additionalNotes.trim()) {
        formattedAnswers['Additional Founder Context / Notes'] = additionalNotes.trim();
      }

      const res = await submitPartnerWarmIntroLeadAction({
        partnerId: activeIntroPartner.id,
        partnerName: activeIntroPartner.name,
        partnerSlug: activeIntroPartner.slug,
        slotKey: activeIntroPartner.slotKey,
        warmIntroRecipientEmail: activeIntroPartner.warmIntroRecipientEmail,
        planId: projectId || 'direct',
        planTitle: companyOrPlanName.trim() || planTitle || 'Startup Venture',
        founderName: founderName.trim(),
        founderEmail: founderEmail.trim(),
        countryCode: normalizedCountry,
        oneLinerSummary,
        intakeAnswers: formattedAnswers,
        estimatedBountyAmount: activeIntroPartner.commissionBountySummary || null,
      });

      if (res.event) {
        const existing = loadLocalReferralEvents();
        saveLocalReferralEvents([res.event, ...existing].slice(0, 250));
      }

      onPartnerActionTriggered?.(activeIntroPartner, 'WARM_INTRO_MODAL');

      setIntroSentSuccess({
        partnerName: activeIntroPartner.name,
        recipientEmail:
          activeIntroPartner.warmIntroRecipientEmail || 'partners@startuppreflight.com',
        founderEmail: founderEmail.trim(),
      });
    } finally {
      setIsSubmittingIntro(false);
    }
  };

  const buildTrackedRedirectHref = (partner: PartnerOfferRecord) => {
    const params = new URLSearchParams();
    if (projectId) params.set('planId', projectId);
    if (normalizedCountry) params.set('country', normalizedCountry);
    if (selectedDomain) params.set('domain', selectedDomain);
    return `/api/go/${encodeURIComponent(partner.slug)}?${params.toString()}`;
  };

  return (
    <>
      <div
        className={`rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/30 p-4 transition-all ${className}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100/60 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[11px]">
              ⚡
            </span>
            <span className="text-xs font-semibold text-slate-800">
              {title || 'Vetted Launchpad Partner & Founder Perks'}
            </span>
            <Badge
              variant="outline"
              className="border-indigo-200 bg-indigo-50/80 text-[10px] text-indigo-700"
            >
              Preflight Verified
            </Badge>
          </div>
          <span className="text-[11px] text-slate-500">
            Tailored for{' '}
            {normalizedCountry === 'GB'
              ? 'United Kingdom (UK)'
              : normalizedCountry === 'IE'
                ? 'Ireland (IE)'
                : 'Global Founders'}
          </span>
        </div>

        {description && (
          <p className="mt-2 text-xs text-slate-600 leading-relaxed">{description}</p>
        )}

        <div
          className={`mt-3 grid gap-3 ${
            compact || partnersToRender.length === 1
              ? 'grid-cols-1'
              : 'grid-cols-1 md:grid-cols-2'
          }`}
        >
          {partnersToRender.map((partner) => {
            const isWarmIntro = partner.actionType === 'WARM_INTRO_MODAL';
            return (
              <div
                key={partner.id}
                className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs transition-all hover:border-indigo-300 hover:shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xl shrink-0"
                        role="img"
                        aria-label={partner.name}
                      >
                        {partner.logoEmoji}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 leading-tight">
                          {partner.name}
                        </h4>
                        <span className="text-[10px] font-medium text-slate-500">
                          {partner.category}
                        </span>
                      </div>
                    </div>
                    <Badge
                      className={`shrink-0 text-[10px] font-medium ${
                        isWarmIntro
                          ? 'border-violet-200 bg-violet-50 text-violet-800'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      }`}
                    >
                      {partner.badgeText}
                    </Badge>
                  </div>

                  <p className="mt-2 text-xs font-semibold text-slate-800">
                    {partner.headline}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                    {partner.perkDescription}
                  </p>

                  {/* Optional Promo Code Pill */}
                  {partner.promoCode && (
                    <div className="mt-2.5 flex items-center justify-between rounded-md border border-dashed border-indigo-200 bg-indigo-50/50 px-2.5 py-1.5">
                      <div className="text-[11px] text-indigo-900">
                        Founder Code:{' '}
                        <strong className="font-mono font-bold text-indigo-700">
                          {partner.promoCode}
                        </strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyPromoCode(partner.id, partner.promoCode!)}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        {copiedPromoId === partner.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-700">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy Code</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
                  <span className="text-[10px] text-slate-600">
                    🛡️ {partner.trustFactor}
                  </span>

                  {isWarmIntro ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleOpenWarmIntroModal(partner)}
                      className="h-7 bg-violet-600 hover:bg-violet-700 px-2.5 text-[11px] font-semibold text-white shadow-2xs"
                    >
                      <Handshake className="mr-1 h-3 w-3" />
                      <span>{partner.actionLabel}</span>
                    </Button>
                  ) : (
                    <a
                      href={buildTrackedRedirectHref(partner)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleAffiliateClick(partner)}
                      className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-2xs transition-colors hover:bg-indigo-700"
                    >
                      <span>{partner.actionLabel}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SMART WARM INTRO CONCIERGE MODAL */}
      {/* ========================================================================= */}
      {activeIntroPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-indigo-950 via-indigo-900 to-violet-900 px-5 py-4 text-white">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="border-violet-400/40 bg-violet-500/30 text-[10px] text-violet-100">
                    <Sparkles className="mr-1 h-3 w-3" />
                    Startup Preflight Warm Intro Concierge
                  </Badge>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <span>{activeIntroPartner.logoEmoji}</span>
                  <span>Connect with {activeIntroPartner.name}</span>
                </h3>
                <p className="text-[11px] text-indigo-200">
                  We’ll email a structured Startup Dossier directly to their onboarding desk and CC you on the thread.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveIntroPartner(null)}
                className="rounded-lg p-1 text-indigo-200 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {introSentSuccess ? (
              <div className="p-6 space-y-4 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-900">
                    Warm Introduction Dispatched!
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    We have sent your structured setup dossier to{' '}
                    <strong className="text-slate-900">{introSentSuccess.partnerName}</strong> (
                    <span className="font-mono text-[11px] text-indigo-700">
                      {introSentSuccess.recipientEmail}
                    </span>
                    ) with a copy CC’d to{' '}
                    <strong className="text-slate-900">{introSentSuccess.founderEmail}</strong>.
                  </p>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 text-left text-xs text-emerald-950 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-700" />
                    What happens next?
                  </div>
                  <p className="text-[11px] text-emerald-900 leading-relaxed">
                    Their startup specialist will reply directly to your email thread (typically within 1 business day) with your fast-track setup link or quote.
                  </p>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  {activeIntroPartner.referralUrl && (
                    <a
                      href={buildTrackedRedirectHref(activeIntroPartner)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <span>Visit Partner Website</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setActiveIntroPartner(null)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-xs text-white"
                  >
                    Done &amp; Return to Plan
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitWarmIntro} className="p-5 space-y-4">
                {/* Founder Contact Details */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    1. Your Founder Contact Details (CC’d on Intro Email)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">
                        Your Full Name *
                      </Label>
                      <Input
                        required
                        value={founderName}
                        onChange={(e) => setFounderName(e.target.value)}
                        placeholder="e.g. Sarah O'Connor"
                        className="bg-white text-base sm:text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">
                        Reply-To Email Address *
                      </Label>
                      <Input
                        required
                        type="email"
                        value={founderEmail}
                        onChange={(e) => setFounderEmail(e.target.value)}
                        placeholder="sarah@yourcompany.com"
                        className="bg-white text-base sm:text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">
                      Startup / Proposed Company Name
                    </Label>
                    <Input
                      value={companyOrPlanName}
                      onChange={(e) => setCompanyOrPlanName(e.target.value)}
                      placeholder="e.g. Acme Innovations Limited"
                      className="bg-white text-base sm:text-xs"
                    />
                  </div>
                </div>

                {/* Step-Specific Intake Questions */}
                {getWarmIntroQuestionsForPartner(activeIntroPartner).length > 0 && (
                  <div className="space-y-3">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      2. Quick Setup Requirements for {activeIntroPartner.name}
                    </div>
                    {getWarmIntroQuestionsForPartner(activeIntroPartner).map((q) => (
                      <div key={q.id} className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-800">
                          {q.label} {q.required ? '*' : ''}
                        </Label>
                        {q.type === 'SELECT' && q.options && q.options.length > 0 ? (
                          <div className="space-y-2">
                            <select
                              value={intakeAnswers[q.id] || ''}
                              onChange={(e) =>
                                setIntakeAnswers((prev) => ({
                                  ...prev,
                                  [q.id]: e.target.value,
                                }))
                              }
                              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-base sm:text-xs text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-hidden"
                            >
                              {q.options.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                              <option value="OTHER">Other (Specify below)</option>
                            </select>
                            {intakeAnswers[q.id] === 'OTHER' && (
                              <Input
                                value={customOtherAnswers[q.id] || ''}
                                onChange={(e) =>
                                  setCustomOtherAnswers((prev) => ({
                                    ...prev,
                                    [q.id]: e.target.value,
                                  }))
                                }
                                placeholder="Please specify your custom requirement..."
                                className="text-base sm:text-xs"
                              />
                            )}
                          </div>
                        ) : (
                          <Input
                            required={q.required}
                            value={intakeAnswers[q.id] || ''}
                            onChange={(e) =>
                              setIntakeAnswers((prev) => ({
                                ...prev,
                                [q.id]: e.target.value,
                              }))
                            }
                            placeholder={q.placeholder || 'Enter details...'}
                            className="text-base sm:text-xs"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Additional Context */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Anything else they should know before replying? (Optional)
                  </Label>
                  <Input
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="e.g. Applying for LEO Priming Grant next month, need quote this week..."
                    className="text-base sm:text-xs"
                  />
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-indigo-600" />
                    Free concierge intro • Zero obligation
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveIntroPartner(null)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isSubmittingIntro || !founderName.trim() || !founderEmail.trim()}
                      className="bg-violet-600 hover:bg-violet-700 text-xs font-semibold text-white"
                    >
                      {isSubmittingIntro ? (
                        <>
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          <span>Sending Intro...</span>
                        </>
                      ) : (
                        <>
                          <Send className="mr-1.5 h-3.5 w-3.5" />
                          <span>Send Warm Intro Email</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
