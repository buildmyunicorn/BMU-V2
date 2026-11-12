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
  CreditCard,
  Lock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PartnerCheckoutAddonField } from '@/db/schema';
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
  createPartnerConciergeStripeCheckoutAction,
  submitPaidPartnerConciergeOrderAction,
} from '@/app/actions/admin-partners';

export type { PartnerSlotKey };
export type PartnerOffer = PartnerOfferRecord;

export interface PaidConciergeOrderSummary {
  orderId: string;
  partnerId: string;
  partnerName: string;
  partnerSlug: string;
  recipientEmail: string;
  founderName: string;
  founderEmail: string;
  companyChoice1: string;
  companyChoice2: string;
  basePriceAmount: number;
  currency: string;
  selectedAddons: PartnerCheckoutAddonField[];
  totalPaidAmount: number;
  stripePaymentRef: string;
  intakeAnswers: Record<string, string>;
  paidAt: string;
}

const PENDING_CONCIERGE_ORDER_STORAGE_KEY = 'spf_pending_concierge_order_v1';

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
  onPartnerActionTriggered?: (
    partner: PartnerOfferRecord,
    actionType: 'AFFILIATE_LINK' | 'WARM_INTRO_MODAL' | 'PAID_STRIPE_CONCIERGE'
  ) => void;
  onPaidConciergeOrderSubmitted?: (order: PaidConciergeOrderSummary) => void;
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
  onPaidConciergeOrderSubmitted,
}: PartnerSlotProps) {
  const [offers, setOffers] = useState<PartnerOfferRecord[]>(() =>
    DEFAULT_PARTNER_OFFERS.filter((o) => o.isActive && o.slotKey === slot)
  );
  const [copiedPromoId, setCopiedPromoId] = useState<string | null>(null);

  // Warm Intro & Paid Concierge Modal State
  const [activeIntroPartner, setActiveIntroPartner] = useState<PartnerOfferRecord | null>(null);
  const [founderName, setFounderName] = useState(initialFounderName);
  const [founderEmail, setFounderEmail] = useState(initialFounderEmail);
  const [companyOrPlanName, setCompanyOrPlanName] = useState(planTitle || '');
  const [intakeAnswers, setIntakeAnswers] = useState<Record<string, string>>({});
  const [customOtherAnswers, setCustomOtherAnswers] = useState<Record<string, string>>({});
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isSubmittingIntro, setIsSubmittingIntro] = useState(false);
  const [introSentSuccess, setIntroSentSuccess] = useState<{
    partnerName: string;
    recipientEmail: string;
    founderEmail: string;
    isPaidOrder?: boolean;
    totalPaidAmount?: number;
    currencySymbol?: string;
    paymentRef?: string;
    companyChoice1?: string;
  } | null>(null);

  // Check if returning from live Stripe Checkout (`?concierge_paid=true`)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('concierge_paid') !== 'true') return;

    const rawPending = window.localStorage.getItem(PENDING_CONCIERGE_ORDER_STORAGE_KEY);
    if (!rawPending) return;

    try {
      const pending = JSON.parse(rawPending);
      if (pending && pending.slotKey === slot) {
        window.localStorage.removeItem(PENDING_CONCIERGE_ORDER_STORAGE_KEY);
        const sessionId = params.get('session_id') || `cs_live_${Date.now()}`;

        submitPaidPartnerConciergeOrderAction({
          ...pending,
          stripePaymentRef: sessionId,
        }).then((res) => {
          if (res.event) {
            const existing = loadLocalReferralEvents();
            saveLocalReferralEvents([res.event, ...existing].slice(0, 250));
          }
          onPaidConciergeOrderSubmitted?.({
            orderId: res.event?.id || `order-${Date.now()}`,
            partnerId: pending.partnerId,
            partnerName: pending.partnerName,
            partnerSlug: pending.partnerSlug,
            recipientEmail:
              pending.warmIntroRecipientEmail || 'formations@companyformations.ie',
            founderName: pending.founderName,
            founderEmail: pending.founderEmail,
            companyChoice1: pending.companyChoice1 || pending.planTitle || 'New Company LTD',
            companyChoice2: pending.companyChoice2 || '',
            basePriceAmount: pending.basePriceAmount,
            currency: pending.currency,
            selectedAddons: pending.selectedAddons || [],
            totalPaidAmount: pending.totalPaidAmount,
            stripePaymentRef: res.paymentRef || sessionId,
            intakeAnswers: pending.intakeAnswers || {},
            paidAt: new Date().toISOString(),
          });
        });
      }
    } catch {
      // ignore malformed storage
    }
  }, [slot, onPaidConciergeOrderSubmitted]);
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
    setSelectedAddonIds([]);
    setAdditionalNotes('');
    setIntroSentSuccess(null);
    setActiveIntroPartner(partner);
  };

  const getFormattedIntakeAnswers = (partner: PartnerOfferRecord) => {
    const questions = getWarmIntroQuestionsForPartner(partner);
    const formattedAnswers: Record<string, string> = {};

    for (const q of questions) {
      const rawVal = intakeAnswers[q.id] || '';
      const finalVal =
        rawVal === 'OTHER'
          ? customOtherAnswers[q.id]?.trim() || 'Other (Custom)'
          : rawVal;
      formattedAnswers[q.id] = finalVal || 'Not specified';
    }

    if (additionalNotes.trim()) {
      formattedAnswers['additional_founder_notes'] = additionalNotes.trim();
    }

    return formattedAnswers;
  };

  const handleCompletePaidConciergeOrder = async (
    partner: PartnerOfferRecord,
    forceSandbox: boolean
  ) => {
    if (!founderName.trim() || !founderEmail.trim()) return;

    const basePrice = Number(partner.checkoutPriceAmount || 150);
    const currency = partner.checkoutCurrency || 'EUR';
    const currencySymbol =
      currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€';
    const addonsList = Array.isArray(partner.checkoutAddonsJson)
      ? partner.checkoutAddonsJson
      : [];
    const chosenAddons = addonsList.filter((a) =>
      selectedAddonIds.includes(a.id)
    );
    const addonsTotal = chosenAddons.reduce(
      (sum, a) => sum + Number(a.priceAmount || 0),
      0
    );
    const totalPaidAmount = basePrice + addonsTotal;
    const formattedAnswers = getFormattedIntakeAnswers(partner);
    const companyChoice1 =
      formattedAnswers['proposed_company_name_1'] ||
      companyOrPlanName.trim() ||
      planTitle ||
      'New Company LTD';
    const companyChoice2 = formattedAnswers['proposed_company_name_2'] || '';

    setIsSubmittingIntro(true);
    try {
      if (!forceSandbox) {
        const stripeRes = await createPartnerConciergeStripeCheckoutAction({
          partnerId: partner.id,
          partnerName: partner.name,
          partnerSlug: partner.slug,
          slotKey: partner.slotKey,
          basePriceAmount: basePrice,
          currency,
          selectedAddons: chosenAddons,
          founderName: founderName.trim(),
          founderEmail: founderEmail.trim(),
          planId: projectId || 'direct',
          planTitle: companyChoice1,
          countryCode: normalizedCountry,
        });

        if (stripeRes.ok && stripeRes.checkoutUrl && !stripeRes.sandboxFallback) {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(
              PENDING_CONCIERGE_ORDER_STORAGE_KEY,
              JSON.stringify({
                partnerId: partner.id,
                partnerName: partner.name,
                partnerSlug: partner.slug,
                slotKey: partner.slotKey,
                warmIntroRecipientEmail: partner.warmIntroRecipientEmail,
                planId: projectId || 'direct',
                planTitle: companyChoice1,
                companyChoice1,
                companyChoice2,
                founderName: founderName.trim(),
                founderEmail: founderEmail.trim(),
                countryCode: normalizedCountry,
                oneLinerSummary,
                basePriceAmount: basePrice,
                currency,
                selectedAddons: chosenAddons,
                totalPaidAmount,
                intakeAnswers: formattedAnswers,
              })
            );
            window.location.href = stripeRes.checkoutUrl;
            return;
          }
        }
      }

      // Sandbox / Direct Completion Flow: Immediately dispatch paid order email & update tracker
      const orderRes = await submitPaidPartnerConciergeOrderAction({
        partnerId: partner.id,
        partnerName: partner.name,
        partnerSlug: partner.slug,
        slotKey: partner.slotKey,
        warmIntroRecipientEmail: partner.warmIntroRecipientEmail,
        planId: projectId || 'direct',
        planTitle: companyChoice1,
        founderName: founderName.trim(),
        founderEmail: founderEmail.trim(),
        countryCode: normalizedCountry,
        oneLinerSummary,
        basePriceAmount: basePrice,
        currency,
        selectedAddons: chosenAddons,
        totalPaidAmount,
        intakeAnswers: formattedAnswers,
      });

      if (orderRes.event) {
        const existing = loadLocalReferralEvents();
        saveLocalReferralEvents([orderRes.event, ...existing].slice(0, 250));
      }

      onPartnerActionTriggered?.(partner, 'PAID_STRIPE_CONCIERGE');

      const summary: PaidConciergeOrderSummary = {
        orderId: orderRes.event?.id || `order-${Date.now()}`,
        partnerId: partner.id,
        partnerName: partner.name,
        partnerSlug: partner.slug,
        recipientEmail:
          partner.warmIntroRecipientEmail || 'formations@companyformations.ie',
        founderName: founderName.trim(),
        founderEmail: founderEmail.trim(),
        companyChoice1,
        companyChoice2,
        basePriceAmount: basePrice,
        currency,
        selectedAddons: chosenAddons,
        totalPaidAmount,
        stripePaymentRef: orderRes.paymentRef,
        intakeAnswers: formattedAnswers,
        paidAt: new Date().toISOString(),
      };

      onPaidConciergeOrderSubmitted?.(summary);

      setIntroSentSuccess({
        partnerName: partner.name,
        recipientEmail:
          partner.warmIntroRecipientEmail || 'formations@companyformations.ie',
        founderEmail: founderEmail.trim(),
        isPaidOrder: true,
        totalPaidAmount,
        currencySymbol,
        paymentRef: orderRes.paymentRef,
        companyChoice1,
      });
    } finally {
      setIsSubmittingIntro(false);
    }
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
        className={`rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 via-white to-slate-50 via-white to-slate-50/30 p-4 transition-all ${className}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100/60 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[11px]">
              ⚡
            </span>
            <span className="text-xs font-semibold text-slate-800">
              {title || 'Vetted Launchpad Partner & Founder Perks'}
            </span>
            <Badge
              variant="outline"
              className="border-slate-200 bg-emerald-50/80 text-[10px] text-emerald-800"
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
            const isPaidConcierge = partner.actionType === 'PAID_STRIPE_CONCIERGE';
            const currencySymbol =
              partner.checkoutCurrency === 'GBP'
                ? '£'
                : partner.checkoutCurrency === 'USD'
                  ? '$'
                  : '€';
            return (
              <div
                key={partner.id}
                className={`flex flex-col justify-between rounded-lg border bg-white p-3.5 shadow-2xs transition-all hover:shadow-xs ${
                  isPaidConcierge
                    ? 'border-emerald-300 ring-1 ring-emerald-500/15 hover:border-emerald-400'
                    : 'border-slate-200 hover:border-emerald-300'
                }`}
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
                        isPaidConcierge
                          ? 'border-emerald-300 bg-emerald-100 text-emerald-900 font-bold'
                          : isWarmIntro
                            ? 'border-slate-200 bg-slate-50 text-emerald-900'
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

                  {isPaidConcierge && (
                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-md border border-emerald-200 bg-emerald-50/70 px-2.5 py-1.5 text-[11px] text-emerald-900">
                      <span>
                        💳 <strong>Done-For-You Package:</strong>{' '}
                        {currencySymbol}
                        {partner.checkoutPriceAmount || 150} (Stripe Checkout)
                      </span>
                      {partner.checkoutAddonsJson &&
                        partner.checkoutAddonsJson.length > 0 && (
                          <span className="text-[10px] font-medium text-emerald-700">
                            +{partner.checkoutAddonsJson.length} optional add-ons
                          </span>
                        )}
                    </div>
                  )}

                  {/* Optional Promo Code Pill */}
                  {partner.promoCode && (
                    <div className="mt-2.5 flex items-center justify-between rounded-md border border-dashed border-slate-200 bg-slate-50 px-2.5 py-1.5">
                      <div className="text-[11px] text-slate-900">
                        Founder Code:{' '}
                        <strong className="font-mono font-bold text-emerald-800">
                          {partner.promoCode}
                        </strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyPromoCode(partner.id, partner.promoCode!)}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 hover:text-emerald-900"
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

                  {isPaidConcierge ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleOpenWarmIntroModal(partner)}
                      className="h-7 bg-emerald-600 hover:bg-emerald-700 px-3 text-[11px] font-bold text-white shadow-2xs"
                    >
                      <CreditCard className="mr-1.5 h-3 w-3" />
                      <span>{partner.actionLabel}</span>
                    </Button>
                  ) : isWarmIntro ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleOpenWarmIntroModal(partner)}
                      className="h-7 bg-emerald-700 hover:bg-emerald-800 px-2.5 text-[11px] font-semibold text-white shadow-2xs"
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
                      className="inline-flex items-center gap-1 rounded-md bg-emerald-700 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-2xs transition-colors hover:bg-emerald-800"
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
      {/* SMART WARM INTRO & FLOW B PAID STRIPE CONCIERGE MODAL */}
      {/* ========================================================================= */}
      {activeIntroPartner && (() => {
        const isPaidModal =
          activeIntroPartner.actionType === 'PAID_STRIPE_CONCIERGE';
        const basePrice = Number(activeIntroPartner.checkoutPriceAmount || 150);
        const currency = activeIntroPartner.checkoutCurrency || 'EUR';
        const currencySymbol =
          currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€';
        const availableAddons = Array.isArray(
          activeIntroPartner.checkoutAddonsJson
        )
          ? activeIntroPartner.checkoutAddonsJson
          : [];
        const selectedAddonsTotal = availableAddons
          .filter((a) => selectedAddonIds.includes(a.id))
          .reduce((sum, a) => sum + Number(a.priceAmount || 0), 0);
        const totalCheckoutAmount = basePrice + selectedAddonsTotal;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-4 backdrop-blur-xs">
            <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
              {/* Modal Header */}
              <div
                className={`sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 text-white ${
                  isPaidModal
                    ? 'bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-900'
                    : 'border border-slate-800 bg-slate-950 text-white shadow-xs'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        isPaidModal
                          ? 'border-emerald-400/40 bg-emerald-500/30 text-[10px] text-emerald-100'
                          : 'border-emerald-600/40 bg-slate-500/30 text-[10px] text-slate-200'
                      }
                    >
                      <Sparkles className="mr-1 h-3 w-3" />
                      {isPaidModal
                        ? `Done-For-You Formation Checkout • ${currencySymbol}${basePrice} Base Package`
                        : 'Startup Preflight Warm Intro Concierge'}
                    </Badge>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <span>{activeIntroPartner.logoEmoji}</span>
                    <span>
                      {isPaidModal
                        ? `Incorporate Your Company with ${activeIntroPartner.name}`
                        : `Connect with ${activeIntroPartner.name}`}
                    </span>
                  </h3>
                  <p className="text-[11px] text-emerald-100/90">
                    {isPaidModal
                      ? 'Step 1: Complete your formation intake questions below → Step 2: Pay securely via Stripe → Step 3: Your paid order & dossier are automatically emailed to our formation partner.'
                      : 'We’ll email a structured Startup Dossier directly to their onboarding desk and CC you on the thread.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveIntroPartner(null)}
                  className="rounded-lg p-1 text-white/80 hover:bg-white/10 hover:text-white"
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
                      {introSentSuccess.isPaidOrder
                        ? `Payment Confirmed (${introSentSuccess.currencySymbol}${introSentSuccess.totalPaidAmount}) & Formation Order Dispatched!`
                        : 'Warm Introduction Dispatched!'}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      We have automatically emailed your{' '}
                      {introSentSuccess.isPaidOrder
                        ? 'Paid Incorporation Order & Statutory Intake Questionnaire'
                        : 'structured setup dossier'}{' '}
                      to{' '}
                      <strong className="text-slate-900">
                        {introSentSuccess.partnerName}
                      </strong>{' '}
                      (
                      <span className="font-mono text-[11px] text-emerald-800">
                        {introSentSuccess.recipientEmail}
                      </span>
                      ) with a copy CC’d to{' '}
                      <strong className="text-slate-900">
                        {introSentSuccess.founderEmail}
                      </strong>
                      .
                    </p>
                    {introSentSuccess.paymentRef && (
                      <div className="pt-1">
                        <Badge className="border-emerald-300 bg-emerald-50 font-mono text-[10px] text-emerald-800">
                          Stripe Receipt Ref: {introSentSuccess.paymentRef}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 text-left text-xs text-emerald-950 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-700" />
                      What happens next?
                    </div>
                    <p className="text-[11px] text-emerald-900 leading-relaxed">
                      {introSentSuccess.isPaidOrder
                        ? 'Your Live Incorporation Status Tracker is now active in Step 1. Once the partner emails back your official CRO / Companies House Certificate of Incorporation, simply paste your Registration Number into the tracker card to mark Step 1 100% complete!'
                        : 'Their startup specialist will reply directly to your email thread (typically within 1 business day) with your fast-track setup link or quote.'}
                    </p>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setActiveIntroPartner(null)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white"
                    >
                      View Live Incorporation Tracker in Step 1
                    </Button>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    if (isPaidModal) {
                      e.preventDefault();
                      handleCompletePaidConciergeOrder(activeIntroPartner, false);
                    } else {
                      handleSubmitWarmIntro(e);
                    }
                  }}
                  className="p-5 space-y-4"
                >
                  {/* Founder Contact Details */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      1. Your Founder Contact Details (CC’d on Order Confirmation)
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
                        2.{' '}
                        {isPaidModal
                          ? 'Statutory Company Formation Questionnaire'
                          : `Quick Setup Requirements for ${activeIntroPartner.name}`}
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
                                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-base sm:text-xs text-slate-900 shadow-2xs focus:border-emerald-600 focus:outline-hidden"
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

                  {/* STEP 3 FOR PAID STRIPE CONCIERGE: OPTIONAL ADD-ONS & LIVE PRICE BREAKDOWN */}
                  {isPaidModal && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">
                          3. Package Breakdown &amp; Optional Statutory Add-Ons
                        </div>
                        <Badge className="border-emerald-300 bg-white text-[10px] font-bold text-emerald-800">
                          Base Package: {currencySymbol}
                          {basePrice}
                        </Badge>
                      </div>

                      {availableAddons.length > 0 && (
                        <div className="space-y-2">
                          {availableAddons.map((addon) => {
                            const isChecked = selectedAddonIds.includes(addon.id);
                            return (
                              <label
                                key={addon.id}
                                className={`flex cursor-pointer items-start justify-between gap-3 rounded-lg border p-3 transition-all ${
                                  isChecked
                                    ? 'border-emerald-500 bg-white shadow-2xs ring-1 ring-emerald-500/20'
                                    : 'border-slate-200 bg-white/80 hover:border-emerald-300'
                                }`}
                              >
                                <div className="flex items-start gap-2.5">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() =>
                                      setSelectedAddonIds((prev) =>
                                        prev.includes(addon.id)
                                          ? prev.filter((id) => id !== addon.id)
                                          : [...prev, addon.id]
                                      )
                                    }
                                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                  />
                                  <div>
                                    <div className="text-xs font-bold text-slate-900">
                                      {addon.label}
                                    </div>
                                    <p className="text-[11px] text-slate-600 leading-snug mt-0.5">
                                      {addon.description}
                                    </p>
                                  </div>
                                </div>
                                <span className="shrink-0 rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-extrabold text-emerald-900">
                                  +{currencySymbol}
                                  {addon.priceAmount}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      <div className="flex items-center justify-between border-t border-emerald-200/80 pt-3">
                        <div className="text-xs text-emerald-950">
                          <span className="font-semibold">Total Checkout Amount:</span>
                          <span className="ml-1.5 text-[11px] text-emerald-700">
                            (Includes CRO/CH filing &amp; partner dispatch)
                          </span>
                        </div>
                        <div className="text-lg font-extrabold text-emerald-900">
                          {currencySymbol}
                          {totalCheckoutAmount}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Additional Context */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">
                      Anything else the formation team should know? (Optional)
                    </Label>
                    <Input
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      placeholder="e.g. Applying for LEO Priming Grant next month, need RBO & Tax number quickly..."
                      className="text-base sm:text-xs"
                    />
                  </div>

                  {/* Footer Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      {isPaidModal ? (
                        <>
                          <Lock className="h-3.5 w-3.5 text-emerald-600" />
                          <span>
                            256-bit Stripe Checkout • Auto-emails dossier to{' '}
                            {activeIntroPartner.name}
                          </span>
                        </>
                      ) : (
                        <>
                          <Mail className="h-3.5 w-3.5 text-emerald-700" />
                          <span>Free concierge intro • Zero obligation</span>
                        </>
                      )}
                    </span>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveIntroPartner(null)}
                        className="text-xs"
                      >
                        Cancel
                      </Button>

                      {isPaidModal ? (
                        <>
                          {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test_') && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={
                                isSubmittingIntro ||
                                !founderName.trim() ||
                                !founderEmail.trim()
                              }
                              onClick={() =>
                                handleCompletePaidConciergeOrder(
                                  activeIntroPartner,
                                  true
                                )
                              }
                              className="border-amber-300 bg-amber-50 text-xs font-semibold text-amber-900 hover:bg-amber-100"
                            >
                              Instant Test Checkout (Sandbox)
                            </Button>
                          )}
                          <Button
                            type="submit"
                            size="sm"
                            disabled={
                              isSubmittingIntro ||
                              !founderName.trim() ||
                              !founderEmail.trim()
                            }
                            className="bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-xs"
                          >
                            {isSubmittingIntro ? (
                              <>
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                <span>Processing Order...</span>
                              </>
                            ) : (
                              <>
                                <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                                <span>
                                  Pay {currencySymbol}
                                  {totalCheckoutAmount} &amp; Submit Order
                                </span>
                              </>
                            )}
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="submit"
                          size="sm"
                          disabled={
                            isSubmittingIntro ||
                            !founderName.trim() ||
                            !founderEmail.trim()
                          }
                          className="bg-emerald-700 hover:bg-emerald-800 text-xs font-semibold text-white"
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
                      )}
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        );
      })()}
    </>
  );
}
