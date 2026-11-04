'use client';

import React, { useState, useMemo } from 'react';
import {
  Handshake,
  PlusCircle,
  ExternalLink,
  Mail,
  CheckCircle2,
  Sparkles,
  Copy,
  Check,
  Search,
  Edit3,
  Trash2,
  RotateCcw,
  Eye,
  Send,
  Download,
  ShieldCheck,
  Globe,
  Building2,
  Landmark,
  Calculator,
  FileCheck2,
  Layers,
  DollarSign,
  ArrowUpRight,
  X,
  Plus,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { WarmIntroQuestionField, PartnerCheckoutAddonField } from '@/db/schema';
import {
  PARTNER_SLOT_DEFINITIONS,
  getSlotDefinition,
  saveLocalPartnerOffers,
  saveLocalReferralEvents,
  type PartnerOfferRecord,
  type PartnerReferralEventRecord,
  type PartnerSlotKey,
  type PartnerCountryScope,
  type PartnerActionType,
  type ReferralLeadStatus,
} from '@/lib/partners/partner-catalog-store';
import {
  upsertAdminPartnerOfferAction,
  toggleAdminPartnerActiveAction,
  deleteAdminPartnerOfferAction,
  restoreDefaultPartnerOffersAction,
  submitPartnerWarmIntroLeadAction,
  submitPaidPartnerConciergeOrderAction,
  updatePartnerReferralLeadStatusAction,
} from '@/app/actions/admin-partners';

interface PartnersReferralsStudioTabProps {
  offers: PartnerOfferRecord[];
  events: PartnerReferralEventRecord[];
  onUpdateOffers: (next: PartnerOfferRecord[]) => void;
  onUpdateEvents: (next: PartnerReferralEventRecord[]) => void;
  onRefresh: () => Promise<void>;
  onNotify: (type: 'success' | 'warning', text: string) => void;
}

const LEAD_STATUS_LABELS: Record<
  ReferralLeadStatus,
  { label: string; badgeClass: string }
> = {
  CLICKED: {
    label: 'Link Clicked',
    badgeClass: 'border-slate-300 bg-slate-100 text-slate-700',
  },
  INTRO_SENT: {
    label: 'Warm Intro Sent',
    badgeClass: 'border-indigo-300 bg-indigo-50 text-indigo-800',
  },
  PARTNER_CONTACTED: {
    label: 'Partner Contacted Founder',
    badgeClass: 'border-amber-300 bg-amber-50 text-amber-800',
  },
  CONVERTED_BOUNTY_DUE: {
    label: 'Converted • Bounty Due',
    badgeClass: 'border-violet-300 bg-violet-100 text-violet-900 font-bold',
  },
  BOUNTY_PAID: {
    label: 'Bounty Paid ✅',
    badgeClass: 'border-emerald-300 bg-emerald-100 text-emerald-900 font-bold',
  },
  ARCHIVED: {
    label: 'Archived',
    badgeClass: 'border-slate-200 bg-slate-50 text-slate-400',
  },
};

export function PartnersReferralsStudioTab({
  offers,
  events,
  onUpdateOffers,
  onUpdateEvents,
  onRefresh,
  onNotify,
}: PartnersReferralsStudioTabProps) {
  const [subTab, setSubTab] = useState<
    'DIRECTORY_BY_STEP' | 'WARM_INTRO_SIMULATOR' | 'LEADS_AND_CLICKS_LEDGER'
  >('DIRECTORY_BY_STEP');

  // Directory filters
  const [searchQuery, setSearchQuery] = useState('');
  const [slotFilter, setSlotFilter] = useState<'ALL' | PartnerSlotKey>('ALL');
  const [countryFilter, setCountryFilter] = useState<
    'ALL_COUNTRIES' | PartnerCountryScope
  >('ALL_COUNTRIES');
  const [actionFilter, setActionFilter] = useState<'ALL' | PartnerActionType>(
    'ALL'
  );
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Create / Edit Modal State
  const [editingOffer, setEditingOffer] = useState<PartnerOfferRecord | null>(
    null
  );
  const [isSavingOffer, setIsSavingOffer] = useState(false);

  // Warm Intro Simulator State
  const [selectedSimPartnerId, setSelectedSimPartnerId] = useState<string>(
    () =>
      offers.find((o) => o.actionType === 'WARM_INTRO_MODAL')?.id ||
      offers[0]?.id ||
      ''
  );
  const [simFounderName, setSimFounderName] = useState('Ciarán O’Connor');
  const [simFounderEmail, setSimFounderEmail] = useState(
    'ciaran@pulseguard-medtech.ie'
  );
  const [simPlanTitle, setSimPlanTitle] = useState(
    'PulseGuard AI — Remote Cardiac Monitoring'
  );
  const [simCountry, setSimCountry] = useState<'IE' | 'GB'>('IE');
  const [simAnswers, setSimAnswers] = useState<Record<string, string>>({});
  const [isSendingSimIntro, setIsSendingSimIntro] = useState(false);

  // Ledger filter state
  const [ledgerFilter, setLedgerFilter] = useState<
    'ALL' | 'PAID_CONCIERGE_ORDER' | 'WARM_INTRO_LEAD' | 'AFFILIATE_CLICK'
  >('ALL');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // Computed KPI stats
  const stats = useMemo(() => {
    const activeOffers = offers.filter((o) => o.isActive);
    const coveredSlots = new Set(activeOffers.map((o) => o.slotKey));
    const warmIntroPartners = offers.filter(
      (o) =>
        o.actionType === 'WARM_INTRO_MODAL' ||
        o.actionType === 'PAID_STRIPE_CONCIERGE'
    );
    const paidStripePartners = offers.filter(
      (o) => o.actionType === 'PAID_STRIPE_CONCIERGE'
    );
    const clicks = events.filter((e) => e.eventType === 'AFFILIATE_CLICK');
    const warmLeads = events.filter((e) => e.eventType === 'WARM_INTRO_LEAD');
    const paidOrders = events.filter(
      (e) => e.eventType === 'PAID_CONCIERGE_ORDER'
    );
    const bountiesDueOrPaid = events.filter(
      (e) =>
        e.leadStatus === 'CONVERTED_BOUNTY_DUE' ||
        e.leadStatus === 'BOUNTY_PAID'
    );

    return {
      totalOffers: offers.length,
      activeOffers: activeOffers.length,
      warmIntroPartnersCount: warmIntroPartners.length,
      paidStripePartnersCount: paidStripePartners.length,
      slotsCovered: coveredSlots.size,
      totalSlots: PARTNER_SLOT_DEFINITIONS.length,
      totalClicks: clicks.length,
      totalWarmLeads: warmLeads.length,
      totalPaidOrders: paidOrders.length,
      bountiesDueOrPaid: bountiesDueOrPaid.length,
    };
  }, [offers, events]);

  // Filtered offers
  const filteredOffers = useMemo(() => {
    return offers.filter((offer) => {
      if (slotFilter !== 'ALL' && offer.slotKey !== slotFilter) return false;
      if (
        countryFilter !== 'ALL_COUNTRIES' &&
        offer.countryScope !== countryFilter
      )
        return false;
      if (actionFilter !== 'ALL' && offer.actionType !== actionFilter)
        return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          offer.name.toLowerCase().includes(q) ||
          offer.slug.toLowerCase().includes(q) ||
          offer.category.toLowerCase().includes(q) ||
          offer.headline.toLowerCase().includes(q) ||
          offer.slotKey.toLowerCase().includes(q) ||
          (offer.commissionBountySummary || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [offers, slotFilter, countryFilter, actionFilter, searchQuery]);

  // Open Modal to Add a Partner (optionally pre-selecting a specific Step Slot)
  function handleOpenNewPartnerModal(defaultSlotKey?: PartnerSlotKey) {
    const slotKey = defaultSlotKey || 'OPS_STEP_1_INCORPORATION';
    const slotDef = getSlotDefinition(slotKey);
    const nowIso = new Date().toISOString();
    setEditingOffer({
      id: '',
      slug: '',
      slotKey,
      name: '',
      logoEmoji: '⚡',
      category: slotDef.title,
      headline: '',
      perkDescription: '',
      badgeText: 'Preflight Partner Perk',
      promoCode: '',
      countryScope: 'ALL',
      actionType:
        slotDef.defaultWarmIntroQuestions.length > 0
          ? 'WARM_INTRO_MODAL'
          : 'AFFILIATE_LINK',
      actionLabel:
        slotDef.defaultWarmIntroQuestions.length > 0
          ? 'Request Fast-Track Warm Intro'
          : 'Claim Partner Perk',
      referralUrl: 'https://',
      trustFactor: 'Preflight Verified Startup Partner',
      warmIntroRecipientEmail: 'partners@startuppreflight.com',
      warmIntroQuestionsJson: [...slotDef.defaultWarmIntroQuestions],
      checkoutPriceAmount: slotKey === 'OPS_STEP_1_INCORPORATION' ? 150 : null,
      checkoutCurrency: 'EUR',
      checkoutAddonsJson: [],
      commissionBountySummary: '',
      partnerContactNotes: '',
      sortOrder: 10,
      isActive: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    });
  }

  // Save Partner Offer (DB + LocalStorage sync)
  async function handleSavePartnerOffer(e: React.FormEvent) {
    e.preventDefault();
    if (!editingOffer) return;
    if (!editingOffer.name.trim() || !editingOffer.headline.trim()) {
      onNotify('warning', 'Please enter a Partner Name and Headline.');
      return;
    }

    const generatedSlug =
      editingOffer.slug.trim() ||
      editingOffer.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    setIsSavingOffer(true);
    try {
      const res = await upsertAdminPartnerOfferAction({
        id: editingOffer.id || undefined,
        slug: generatedSlug,
        slotKey: editingOffer.slotKey,
        name: editingOffer.name,
        logoEmoji: editingOffer.logoEmoji,
        category: editingOffer.category,
        headline: editingOffer.headline,
        perkDescription: editingOffer.perkDescription,
        badgeText: editingOffer.badgeText,
        promoCode: editingOffer.promoCode,
        countryScope: editingOffer.countryScope,
        actionType: editingOffer.actionType,
        actionLabel: editingOffer.actionLabel,
        referralUrl: editingOffer.referralUrl,
        trustFactor: editingOffer.trustFactor,
        warmIntroRecipientEmail: editingOffer.warmIntroRecipientEmail,
        warmIntroQuestionsJson: editingOffer.warmIntroQuestionsJson,
        checkoutPriceAmount: editingOffer.checkoutPriceAmount ?? null,
        checkoutCurrency: editingOffer.checkoutCurrency || 'EUR',
        checkoutAddonsJson: editingOffer.checkoutAddonsJson || [],
        commissionBountySummary: editingOffer.commissionBountySummary,
        partnerContactNotes: editingOffer.partnerContactNotes,
        sortOrder: editingOffer.sortOrder,
        isActive: editingOffer.isActive,
      });

      if (res.ok && res.offer) {
        const existsIdx = offers.findIndex(
          (o) => o.id === editingOffer.id || o.slug === res.offer!.slug
        );
        const nextOffers = [...offers];
        if (existsIdx >= 0) {
          nextOffers[existsIdx] = res.offer;
        } else {
          nextOffers.push(res.offer);
        }
        onUpdateOffers(nextOffers);
        saveLocalPartnerOffers(nextOffers);
        setEditingOffer(null);
        onNotify(
          'success',
          `Saved "${res.offer.name}" into ${getSlotDefinition(res.offer.slotKey).stepNumberLabel}.`
        );
      } else {
        onNotify('warning', res.error || 'Could not save partner offer.');
      }
    } finally {
      setIsSavingOffer(false);
    }
  }

  async function handleToggleActive(offer: PartnerOfferRecord) {
    const nextState = !offer.isActive;
    const nextOffers = offers.map((o) =>
      o.id === offer.id ? { ...o, isActive: nextState } : o
    );
    onUpdateOffers(nextOffers);
    saveLocalPartnerOffers(nextOffers);

    await toggleAdminPartnerActiveAction({
      id: offer.id,
      slug: offer.slug,
      isActive: nextState,
    });
    onNotify(
      'success',
      `${offer.name} is now ${nextState ? 'Active (Live in Workspace)' : 'Paused'}.`
    );
  }

  async function handleDeleteOffer(offer: PartnerOfferRecord) {
    const nextOffers = offers.filter((o) => o.id !== offer.id);
    onUpdateOffers(nextOffers);
    saveLocalPartnerOffers(nextOffers);
    await deleteAdminPartnerOfferAction({ id: offer.id, slug: offer.slug });
    onNotify('success', `Removed partner "${offer.name}".`);
  }

  async function handleRestoreDefaults() {
    await restoreDefaultPartnerOffersAction();
    await onRefresh();
    onNotify('success', 'Restored all default IE & UK Partner Offers.');
  }

  // Selected partner for Warm Intro Simulator
  const simPartner = useMemo(() => {
    return (
      offers.find((o) => o.id === selectedSimPartnerId) ||
      offers.find((o) => o.actionType === 'WARM_INTRO_MODAL') ||
      offers[0]
    );
  }, [offers, selectedSimPartnerId]);

  const simQuestions: WarmIntroQuestionField[] = useMemo(() => {
    if (!simPartner) return [];
    if (
      Array.isArray(simPartner.warmIntroQuestionsJson) &&
      simPartner.warmIntroQuestionsJson.length > 0
    ) {
      return simPartner.warmIntroQuestionsJson;
    }
    return getSlotDefinition(simPartner.slotKey).defaultWarmIntroQuestions;
  }, [simPartner]);

  async function handleSendSimulatedWarmIntro(e: React.FormEvent) {
    e.preventDefault();
    if (!simPartner) return;

    setIsSendingSimIntro(true);
    try {
      const preparedAnswers: Record<string, string> = {};
      for (const q of simQuestions) {
        preparedAnswers[q.id] =
          simAnswers[q.id] ||
          (q.options && q.options[0]) ||
          q.placeholder ||
          'Confirmed by founder';
      }

      const res = await submitPartnerWarmIntroLeadAction({
        partnerId: simPartner.id,
        partnerName: simPartner.name,
        partnerSlug: simPartner.slug,
        slotKey: simPartner.slotKey,
        warmIntroRecipientEmail: simPartner.warmIntroRecipientEmail,
        planId: 'admin-sim-plan',
        planTitle: simPlanTitle,
        founderName: simFounderName,
        founderEmail: simFounderEmail,
        countryCode: simCountry,
        oneLinerSummary:
          'AI-assisted remote cardiac telemetry for post-operative hospital discharge.',
        intakeAnswers: preparedAnswers,
        estimatedBountyAmount: simPartner.commissionBountySummary,
      });

      if (res.ok && res.event) {
        const nextEvents = [res.event, ...events];
        onUpdateEvents(nextEvents);
        saveLocalReferralEvents(nextEvents);
        onNotify(
          'success',
          `Warm Intro Dossier dispatched to ${
            simPartner.warmIntroRecipientEmail || 'partner desk'
          } and logged in the Referral Ledger!`
        );
        setSubTab('LEADS_AND_CLICKS_LEDGER');
      }
    } finally {
      setIsSendingSimIntro(false);
    }
  }

  async function handleUpdateLeadStatus(
    eventItem: PartnerReferralEventRecord,
    nextStatus: ReferralLeadStatus,
    nextBounty?: string,
    nextNotes?: string
  ) {
    const updatedEvents = events.map((ev) =>
      ev.id === eventItem.id
        ? {
            ...ev,
            leadStatus: nextStatus,
            estimatedBountyAmount:
              nextBounty !== undefined
                ? nextBounty
                : ev.estimatedBountyAmount,
            adminNotes: nextNotes !== undefined ? nextNotes : ev.adminNotes,
          }
        : ev
    );
    onUpdateEvents(updatedEvents);
    saveLocalReferralEvents(updatedEvents);

    await updatePartnerReferralLeadStatusAction({
      eventId: eventItem.id,
      leadStatus: nextStatus,
      estimatedBountyAmount:
        nextBounty !== undefined ? nextBounty : eventItem.estimatedBountyAmount,
      adminNotes: nextNotes !== undefined ? nextNotes : eventItem.adminNotes,
    });

    onNotify(
      'success',
      `Updated referral status to "${LEAD_STATUS_LABELS[nextStatus].label}".`
    );
  }

  function handleExportLedgerCsv() {
    const headers = [
      'Date',
      'Event Type',
      'Lead Status',
      'Partner Name',
      'Step Slot',
      'Founder Name',
      'Founder Email',
      'Startup Plan',
      'Country',
      'Claimed Domain',
      'Bounty / CPA Terms',
      'Intake Answers JSON',
    ];
    const rows = events.map((ev) => [
      ev.createdAt,
      ev.eventType,
      ev.leadStatus,
      `"${(ev.partnerName || '').replace(/"/g, '""')}"`,
      ev.slotKey,
      `"${(ev.founderName || '').replace(/"/g, '""')}"`,
      ev.founderEmail || '',
      `"${(ev.planTitle || '').replace(/"/g, '""')}"`,
      ev.countryCode,
      ev.selectedDomain || '',
      `"${(ev.estimatedBountyAmount || '').replace(/"/g, '""')}"`,
      `"${JSON.stringify(ev.intakeAnswersJson || {}).replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spf-partner-referrals-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* ===================================================================== */}
      {/* TOP KPI BAR */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-800 bg-slate-900/90 text-slate-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Active Partner Offers
              </span>
              <Handshake className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-white">
                {stats.activeOffers}
              </span>
              <span className="text-xs text-slate-400">
                of {stats.totalOffers} configured
              </span>
            </div>
            <p className="mt-1 text-[11px] text-indigo-300">
              {stats.warmIntroPartnersCount} Warm Intro Concierges •{' '}
              {stats.totalOffers - stats.warmIntroPartnersCount} Affiliate Links
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/90 text-slate-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Step Slots Assigned
              </span>
              <Layers className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-emerald-400">
                {stats.slotsCovered} / {stats.totalSlots}
              </span>
              <span className="text-xs text-slate-400">Module steps live</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Covers Module G Steps 1–6 + Modules A, C, D, E, J, K
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/90 text-slate-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Outbound Link Clicks
              </span>
              <ArrowUpRight className="h-4 w-4 text-sky-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-sky-400">
                {stats.totalClicks}
              </span>
              <span className="text-xs text-slate-400">via /api/go/[slug]</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Tracks plan ID, country &amp; claimed domain names
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/90 text-slate-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Warm Intro Leads Sent
              </span>
              <DollarSign className="h-4 w-4 text-amber-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-amber-300">
                {stats.totalWarmLeads}
              </span>
              <span className="text-xs text-emerald-400">
                ({stats.bountiesDueOrPaid} converted)
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Structured intake dossiers emailed to partners
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ===================================================================== */}
      {/* SUB-NAVIGATION BAR */}
      {/* ===================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/90 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => setSubTab('DIRECTORY_BY_STEP')}
            className={
              subTab === 'DIRECTORY_BY_STEP'
                ? 'bg-indigo-600 text-white hover:bg-indigo-500 text-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs'
            }
          >
            <Layers className="mr-1.5 h-3.5 w-3.5" />
            1. Partner Directory &amp; Step Slot Mapper ({offers.length})
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => setSubTab('WARM_INTRO_SIMULATOR')}
            className={
              subTab === 'WARM_INTRO_SIMULATOR'
                ? 'bg-indigo-600 text-white hover:bg-indigo-500 text-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs'
            }
          >
            <Mail className="mr-1.5 h-3.5 w-3.5" />
            2. Warm Intro Question &amp; Email Simulator
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => setSubTab('LEADS_AND_CLICKS_LEDGER')}
            className={
              subTab === 'LEADS_AND_CLICKS_LEDGER'
                ? 'bg-indigo-600 text-white hover:bg-indigo-500 text-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs'
            }
          >
            <DollarSign className="mr-1.5 h-3.5 w-3.5" />
            3. Clicks, Warm Intro Leads &amp; Bounty Ledger ({events.length})
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleRestoreDefaults}
            className="border-slate-700 bg-slate-800/80 text-xs text-slate-300 hover:bg-slate-700"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Restore Default Partners
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => handleOpenNewPartnerModal()}
            className="bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-500"
          >
            <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
            + Add New Referral Partner
          </Button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SUB-TAB 1: PARTNER DIRECTORY & STEP SLOT MAPPER */}
      {/* ===================================================================== */}
      {subTab === 'DIRECTORY_BY_STEP' && (
        <div className="space-y-5">
          {/* Filter Bar */}
          <Card className="border-slate-800 bg-slate-900/80 text-slate-100">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <Label className="text-[11px] text-slate-400">
                    Search Partner, Slug or Bounty Note
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="e.g. Blacknight, Revolut, Company Bureau..."
                      className="border-slate-700 bg-slate-950 pl-8 text-xs text-slate-100"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-slate-400">
                    Filter by Module &amp; Step Slot
                  </Label>
                  <select
                    value={slotFilter}
                    onChange={(e) => setSlotFilter(e.target.value as any)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100"
                  >
                    <option value="ALL">All 15 Module &amp; Launchpad Slots</option>
                    {PARTNER_SLOT_DEFINITIONS.map((slot) => (
                      <option key={slot.slotKey} value={slot.slotKey}>
                        {slot.moduleBadge} — {slot.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-slate-400">
                    Filter by Country Scope
                  </Label>
                  <select
                    value={countryFilter}
                    onChange={(e) => setCountryFilter(e.target.value as any)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100"
                  >
                    <option value="ALL_COUNTRIES">All Countries (IE, UK &amp; Global)</option>
                    <option value="ALL">🌍 ALL (Shown in Both IE &amp; UK)</option>
                    <option value="IE">🇮🇪 Ireland Only (IE)</option>
                    <option value="GB">🇬🇧 United Kingdom Only (GB)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-slate-400">
                    Filter by Referral Action Mode
                  </Label>
                  <select
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value as any)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100"
                  >
                    <option value="ALL">All Referral Modes</option>
                    <option value="PAID_STRIPE_CONCIERGE">
                      💳 Paid Stripe Concierge Checkout (Answer Qs + Pay + Auto-Email)
                    </option>
                    <option value="WARM_INTRO_MODAL">
                      🤝 Warm Intro Intake Modal (Email Dossier)
                    </option>
                    <option value="AFFILIATE_LINK">
                      🔗 Outbound Affiliate Link (/api/go/[slug])
                    </option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step-by-Step Slot Sections */}
          {PARTNER_SLOT_DEFINITIONS.filter((slotDef) =>
            slotFilter === 'ALL' ? true : slotDef.slotKey === slotFilter
          ).map((slotDef) => {
            const slotOffers = filteredOffers.filter(
              (o) => o.slotKey === slotDef.slotKey
            );

            // If user is searching text and this slot has 0 matches, hide empty slot to keep view clean
            if (
              (searchQuery.trim() ||
                countryFilter !== 'ALL_COUNTRIES' ||
                actionFilter !== 'ALL') &&
              slotOffers.length === 0
            ) {
              return null;
            }

            return (
              <Card
                key={slotDef.slotKey}
                className="border-slate-800 bg-slate-900/90 text-slate-100 overflow-hidden"
              >
                <CardHeader className="border-b border-slate-800 bg-slate-950/60 py-3.5 px-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="border-indigo-500/40 bg-indigo-500/20 text-[10px] font-bold text-indigo-300">
                          {slotDef.moduleBadge}
                        </Badge>
                        <span className="font-mono text-[11px] text-slate-400">
                          {slotDef.slotKey}
                        </span>
                        <Badge
                          variant="outline"
                          className="border-slate-700 text-[10px] text-slate-300"
                        >
                          {slotOffers.length} Partner
                          {slotOffers.length === 1 ? '' : 's'} Assigned
                        </Badge>
                      </div>
                      <CardTitle className="text-sm font-bold text-white">
                        {slotDef.stepNumberLabel} — {slotDef.title}
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-400">
                        {slotDef.whereItAppears}{' '}
                        <span className="text-emerald-400/90">
                          • 💡 {slotDef.monetizationTip}
                        </span>
                      </CardDescription>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleOpenNewPartnerModal(slotDef.slotKey)}
                      className="bg-indigo-600/90 text-xs text-white hover:bg-indigo-500 shrink-0"
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Add Partner to This Step
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-4">
                  {slotOffers.length === 0 ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-slate-800 bg-slate-950/40 p-4 text-xs text-slate-400">
                      <span>
                        No referral partners currently assigned to{' '}
                        <strong className="text-slate-200">
                          {slotDef.stepNumberLabel}
                        </strong>
                        .
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleOpenNewPartnerModal(slotDef.slotKey)
                        }
                        className="border-slate-700 bg-slate-900 text-xs text-indigo-300 hover:bg-slate-800"
                      >
                        + Assign First Partner to {slotDef.moduleBadge}
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                      {slotOffers.map((offer) => {
                        const goShortlink = `/api/go/${offer.slug}`;
                        const questionCount =
                          offer.warmIntroQuestionsJson?.length ||
                          slotDef.defaultWarmIntroQuestions.length;

                        return (
                          <div
                            key={offer.id}
                            className={`flex flex-col justify-between rounded-xl border p-4 transition-all ${
                              offer.isActive
                                ? 'border-slate-700/90 bg-slate-950/80'
                                : 'border-slate-800/60 bg-slate-950/30 opacity-60'
                            }`}
                          >
                            <div className="space-y-2.5">
                              {/* Top row: Icon, Name, Badges */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-lg">
                                    {offer.logoEmoji}
                                  </span>
                                  <div>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <h4 className="text-xs font-bold text-white">
                                        {offer.name}
                                      </h4>
                                      <Badge
                                        variant="outline"
                                        className="border-slate-700 text-[10px] text-slate-300"
                                      >
                                        {offer.countryScope === 'IE'
                                          ? '🇮🇪 IE Only'
                                          : offer.countryScope === 'GB'
                                            ? '🇬🇧 UK Only'
                                            : '🌍 IE + UK'}
                                      </Badge>
                                    </div>
                                    <div className="text-[11px] text-slate-400">
                                      {offer.category}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-col items-end gap-1">
                                  <Badge
                                    className={
                                      offer.actionType === 'PAID_STRIPE_CONCIERGE'
                                        ? 'border-emerald-500/40 bg-emerald-500/20 text-[10px] font-bold text-emerald-200'
                                        : offer.actionType === 'WARM_INTRO_MODAL'
                                          ? 'border-amber-500/40 bg-amber-500/20 text-[10px] text-amber-200'
                                          : 'border-sky-500/40 bg-sky-500/20 text-[10px] text-sky-200'
                                    }
                                  >
                                    {offer.actionType === 'PAID_STRIPE_CONCIERGE'
                                      ? `💳 Stripe Checkout (${offer.checkoutCurrency === 'GBP' ? '£' : '€'}${offer.checkoutPriceAmount || 150} + ${offer.checkoutAddonsJson?.length || 0} Add-Ons)`
                                      : offer.actionType === 'WARM_INTRO_MODAL'
                                        ? `🤝 Warm Intro (${questionCount} Qs)`
                                        : '🔗 Affiliate Link'}
                                  </Badge>
                                  <Badge className="border-emerald-500/30 bg-emerald-500/15 text-[10px] text-emerald-300">
                                    {offer.badgeText}
                                  </Badge>
                                </div>
                              </div>

                              {/* Headline & Description */}
                              <div className="rounded-lg border border-slate-800/90 bg-slate-900/70 p-2.5 space-y-1">
                                <div className="text-xs font-semibold text-slate-100">
                                  {offer.headline}
                                </div>
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                  {offer.perkDescription}
                                </p>
                              </div>

                              {/* Referral Tracking / Warm Intro Routing Details */}
                              <div className="space-y-1.5 text-[11px]">
                                {offer.actionType === 'AFFILIATE_LINK' ? (
                                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-800 bg-slate-900/50 px-2.5 py-1.5">
                                    <div className="truncate text-slate-300">
                                      <span className="text-slate-500">
                                        Tracking Route:{' '}
                                      </span>
                                      <code className="text-indigo-300">
                                        {goShortlink}
                                      </code>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          navigator.clipboard.writeText(
                                            `${window.location.origin}${goShortlink}`
                                          );
                                          setCopiedSlug(offer.slug);
                                          setTimeout(
                                            () => setCopiedSlug(null),
                                            1800
                                          );
                                        }}
                                        className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-200 hover:bg-slate-700"
                                      >
                                        {copiedSlug === offer.slug ? (
                                          <>
                                            <Check className="h-3 w-3 text-emerald-400" />
                                            Copied
                                          </>
                                        ) : (
                                          <>
                                            <Copy className="h-3 w-3" />
                                            Copy Link
                                          </>
                                        )}
                                      </button>
                                      <a
                                        href={`${goShortlink}?planId=admin-test&domain=example.ie`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 rounded bg-indigo-950/80 border border-indigo-700/50 px-2 py-0.5 text-[10px] text-indigo-200 hover:bg-indigo-900"
                                      >
                                        Test Redirect
                                        <ExternalLink className="h-2.5 w-2.5" />
                                      </a>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-500/20 bg-amber-950/20 px-2.5 py-1.5">
                                    <div className="truncate text-amber-200/90">
                                      <span className="text-amber-400/80">
                                        Warm Intro Email:{' '}
                                      </span>
                                      <code>
                                        {offer.warmIntroRecipientEmail ||
                                          'partners@startuppreflight.com'}
                                      </code>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedSimPartnerId(offer.id);
                                        setSubTab('WARM_INTRO_SIMULATOR');
                                      }}
                                      className="inline-flex items-center gap-1 rounded bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] text-amber-200 hover:bg-amber-500/30"
                                    >
                                      <Eye className="h-3 w-3" />
                                      Test Intake Questions ({questionCount})
                                    </button>
                                  </div>
                                )}

                                {/* Admin Private Deal / Commission Note */}
                                {offer.commissionBountySummary && (
                                  <div className="flex items-center justify-between rounded-md bg-emerald-950/30 border border-emerald-800/40 px-2.5 py-1 text-[11px] text-emerald-300">
                                    <span>
                                      💰 <strong>Admin Bounty / Terms:</strong>{' '}
                                      {offer.commissionBountySummary}
                                    </span>
                                    {offer.promoCode && (
                                      <Badge className="bg-slate-900 text-[10px] font-mono text-amber-300 border-slate-700">
                                        Code: {offer.promoCode}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Bottom Actions Row */}
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-2.5">
                              <button
                                type="button"
                                onClick={() => handleToggleActive(offer)}
                                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                                  offer.isActive
                                    ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                }`}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                {offer.isActive ? 'Active in Step' : 'Paused'}
                              </button>

                              <div className="flex items-center gap-1.5">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setEditingOffer({
                                      ...offer,
                                      warmIntroQuestionsJson:
                                        offer.warmIntroQuestionsJson?.length > 0
                                          ? [...offer.warmIntroQuestionsJson]
                                          : [
                                              ...slotDef.defaultWarmIntroQuestions,
                                            ],
                                    })
                                  }
                                  className="h-7 border-slate-700 bg-slate-900 px-2.5 text-[11px] text-slate-200 hover:bg-slate-800"
                                >
                                  <Edit3 className="mr-1 h-3 w-3" />
                                  Edit Partner &amp; Questions
                                </Button>

                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteOffer(offer)}
                                  className="h-7 px-2 text-[11px] text-rose-400 hover:bg-rose-950/50 hover:text-rose-300"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-TAB 2: WARM INTRO QUESTION & EMAIL SIMULATOR */}
      {/* ===================================================================== */}
      {subTab === 'WARM_INTRO_SIMULATOR' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Intake Form Simulator */}
          <Card className="border-slate-800 bg-slate-900/90 text-slate-100 lg:col-span-6">
            <CardHeader className="border-b border-slate-800 pb-4">
              <Badge className="w-fit border-amber-500/40 bg-amber-500/20 text-[10px] text-amber-200">
                Interactive Intake Modal Preview
              </Badge>
              <CardTitle className="text-base font-bold text-white mt-1">
                Test What Founders See When Requesting a Warm Intro
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Select any partner below to inspect or test the step-specific
                questions asked before our system emails the partner.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-300">
                  Select Partner to Preview / Simulate
                </Label>
                <select
                  value={simPartner?.id || ''}
                  onChange={(e) => {
                    setSelectedSimPartnerId(e.target.value);
                    setSimAnswers({});
                  }}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                >
                  {offers.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.logoEmoji} {o.name} ({getSlotDefinition(o.slotKey).moduleBadge}) —{' '}
                      {o.actionType === 'WARM_INTRO_MODAL'
                        ? 'Warm Intro Modal'
                        : 'Affiliate Link'}
                    </option>
                  ))}
                </select>
              </div>

              {simPartner && (
                <form
                  onSubmit={handleSendSimulatedWarmIntro}
                  className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/90 p-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <div className="text-xs font-bold text-white">
                        {simPartner.logoEmoji} {simPartner.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {getSlotDefinition(simPartner.slotKey).stepNumberLabel} •
                        Routes to:{' '}
                        <span className="text-amber-300 font-mono">
                          {simPartner.warmIntroRecipientEmail ||
                            'partners@startuppreflight.com'}
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setEditingOffer({
                          ...simPartner,
                          warmIntroQuestionsJson: [...simQuestions],
                        })
                      }
                      className="h-7 border-slate-700 bg-slate-900 text-[11px] text-indigo-300"
                    >
                      <Edit3 className="mr-1 h-3 w-3" />
                      Customize Questions
                    </Button>
                  </div>

                  {/* Auto-Pulled Founder Context */}
                  <div className="rounded-lg border border-indigo-500/20 bg-indigo-950/20 p-3 space-y-2.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                      Auto-Pulled from Founder’s Plan (Zero Typing Required)
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <div>
                        <Label className="text-[10px] text-slate-400">
                          Founder Name
                        </Label>
                        <Input
                          value={simFounderName}
                          onChange={(e) => setSimFounderName(e.target.value)}
                          className="h-8 border-slate-700 bg-slate-900 text-xs text-white mt-0.5"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-slate-400">
                          Founder Email (CC’d)
                        </Label>
                        <Input
                          value={simFounderEmail}
                          onChange={(e) => setSimFounderEmail(e.target.value)}
                          className="h-8 border-slate-700 bg-slate-900 text-xs text-white mt-0.5"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-slate-400">
                          HQ Jurisdiction
                        </Label>
                        <select
                          value={simCountry}
                          onChange={(e) =>
                            setSimCountry(e.target.value as 'IE' | 'GB')
                          }
                          className="mt-0.5 h-8 w-full rounded-md border border-slate-700 bg-slate-900 px-2 text-xs text-white"
                        >
                          <option value="IE">🇮🇪 Ireland (CRO)</option>
                          <option value="GB">🇬🇧 UK (Companies House)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Step-Specific Intake Questions */}
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-slate-200">
                      Step-Specific Intake Questions ({simQuestions.length})
                    </div>
                    {simQuestions.length === 0 ? (
                      <div className="rounded-lg border border-slate-800 p-3 text-xs text-slate-400">
                        This partner currently uses direct link mode. Click{' '}
                        <strong>Customize Questions</strong> above to add intake
                        questions if switching to Warm Intro mode.
                      </div>
                    ) : (
                      simQuestions.map((q, idx) => (
                        <div key={q.id} className="space-y-1">
                          <Label className="text-xs text-slate-300">
                            {idx + 1}. {q.label}
                            {q.required && (
                              <span className="ml-1 text-amber-400">*</span>
                            )}
                          </Label>
                          {q.type === 'SELECT' && Array.isArray(q.options) ? (
                            <select
                              value={simAnswers[q.id] || q.options[0] || ''}
                              onChange={(e) =>
                                setSimAnswers({
                                  ...simAnswers,
                                  [q.id]: e.target.value,
                                })
                              }
                              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                            >
                              {q.options.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <Input
                              value={simAnswers[q.id] || ''}
                              onChange={(e) =>
                                setSimAnswers({
                                  ...simAnswers,
                                  [q.id]: e.target.value,
                                })
                              }
                              placeholder={
                                q.placeholder || 'Enter founder response...'
                              }
                              className="border-slate-700 bg-slate-900 text-xs text-white"
                            />
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isSendingSimIntro}
                    className="w-full bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-500"
                  >
                    <Send className="mr-1.5 h-3.5 w-3.5" />
                    {isSendingSimIntro
                      ? 'Dispatching Warm Intro Email...'
                      : 'Send Test Warm Intro & Log in Ledger'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Right Column: Live Outbound Partner Email Dossier Preview */}
          <Card className="border-slate-800 bg-slate-900/90 text-slate-100 lg:col-span-6">
            <CardHeader className="border-b border-slate-800 pb-4">
              <Badge className="w-fit border-emerald-500/40 bg-emerald-500/20 text-[10px] text-emerald-300">
                Live Outbound Email Preview
              </Badge>
              <CardTitle className="text-base font-bold text-white mt-1">
                What the Partner &amp; Founder Receive via Email
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Sent via Resend from{' '}
                <code>Startup Preflight &lt;noreply@startuppreflight.com&gt;</code>{' '}
                with Reply-To &amp; CC set to the founder.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {simPartner && (
                <div className="rounded-xl border border-slate-300 bg-white p-5 text-slate-900 shadow-sm space-y-4">
                  <div className="border-b border-slate-200 pb-3 text-xs space-y-1">
                    <div>
                      <span className="font-semibold text-slate-500">To:</span>{' '}
                      <span className="font-mono text-slate-900">
                        {simPartner.warmIntroRecipientEmail ||
                          'partners@startuppreflight.com'}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">
                        CC / Reply-To:
                      </span>{' '}
                      <span className="font-mono text-indigo-700">
                        {simFounderName} &lt;{simFounderEmail}&gt;
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">
                        Subject:
                      </span>{' '}
                      <strong>
                        [Startup Preflight Warm Intro] {simFounderName} (
                        {simPlanTitle}) × {simPartner.name}
                      </strong>
                    </div>
                  </div>

                  <div className="rounded-lg bg-indigo-950 p-4 text-white">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                      Startup Preflight • Verified Partner Warm Intro
                    </div>
                    <div className="mt-1 text-sm font-bold">
                      Founder Setup Request: {simPartner.name}
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    Hi <strong>{simPartner.name}</strong> team,
                    <br />
                    <br />
                    Please meet <strong>{simFounderName}</strong> (
                    <span className="text-indigo-600 underline">
                      {simFounderEmail}
                    </span>
                    ), who is configuring their operational foundations in{' '}
                    <strong>
                      {getSlotDefinition(simPartner.slotKey).stepNumberLabel}
                    </strong>{' '}
                    and requested a fast-track warm introduction.
                  </p>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs space-y-1">
                    <div className="text-[10px] font-bold uppercase text-slate-500">
                      Submitted Setup Intake Dossier
                    </div>
                    {simQuestions.map((q) => (
                      <div
                        key={q.id}
                        className="flex justify-between gap-3 border-b border-slate-200/70 py-1.5 last:border-0"
                      >
                        <span className="font-medium text-slate-600">
                          {q.label}:
                        </span>
                        <span className="font-bold text-slate-900 text-right">
                          {simAnswers[q.id] ||
                            (q.options && q.options[0]) ||
                            q.placeholder ||
                            '—'}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-100 pt-2 text-[11px] text-slate-500">
                    Reply-All to this email to connect directly with{' '}
                    {simFounderName}.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-TAB 3: CLICKS, WARM INTRO LEADS & BOUNTY LEDGER */}
      {/* ===================================================================== */}
      {subTab === 'LEADS_AND_CLICKS_LEDGER' && (
        <Card className="border-slate-800 bg-slate-900/90 text-slate-100">
          <CardHeader className="border-b border-slate-800 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold text-white">
                  Partner Referral Clicks, Warm Intro Leads &amp; CPA Bounty
                  Ledger
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Track every founder warm intro and outbound `/api/go/[slug]`
                  click, inspect submitted company formation details, and mark
                  bounties paid.
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex rounded-lg border border-slate-700 bg-slate-950 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setLedgerFilter('ALL')}
                    className={`rounded-md px-2.5 py-1 text-xs ${
                      ledgerFilter === 'ALL'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All ({events.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLedgerFilter('PAID_CONCIERGE_ORDER')}
                    className={`rounded-md px-2.5 py-1 text-xs ${
                      ledgerFilter === 'PAID_CONCIERGE_ORDER'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    💳 Paid Orders ({stats.totalPaidOrders})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLedgerFilter('WARM_INTRO_LEAD')}
                    className={`rounded-md px-2.5 py-1 text-xs ${
                      ledgerFilter === 'WARM_INTRO_LEAD'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🤝 Warm Intros ({stats.totalWarmLeads})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLedgerFilter('AFFILIATE_CLICK')}
                    className={`rounded-md px-2.5 py-1 text-xs ${
                      ledgerFilter === 'AFFILIATE_CLICK'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🔗 Link Clicks ({stats.totalClicks})
                  </button>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleExportLedgerCsv}
                  className="border-slate-700 bg-slate-800 text-xs text-slate-200 hover:bg-slate-700"
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4">
            {events.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center space-y-2">
                <p className="text-xs text-slate-400">
                  No referral clicks or warm intro leads recorded yet.
                </p>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setSubTab('WARM_INTRO_SIMULATOR')}
                  className="bg-indigo-600 text-xs text-white hover:bg-indigo-500"
                >
                  Send a Test Warm Intro in the Simulator
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {events
                  .filter((ev) =>
                    ledgerFilter === 'ALL' ? true : ev.eventType === ledgerFilter
                  )
                  .map((ev) => {
                    const isExpanded = expandedEventId === ev.id;
                    const answerEntries = Object.entries(
                      ev.intakeAnswersJson || {}
                    );
                    const statusMeta =
                      LEAD_STATUS_LABELS[ev.leadStatus] ||
                      LEAD_STATUS_LABELS.CLICKED;

                    return (
                      <div
                        key={ev.id}
                        className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                className={
                                  ev.eventType === 'PAID_CONCIERGE_ORDER'
                                    ? 'border-emerald-500/40 bg-emerald-500/20 text-[10px] font-bold text-emerald-200'
                                    : ev.eventType === 'WARM_INTRO_LEAD'
                                      ? 'border-amber-500/40 bg-amber-500/20 text-[10px] text-amber-200'
                                      : 'border-sky-500/40 bg-sky-500/20 text-[10px] text-sky-200'
                                }
                              >
                                {ev.eventType === 'PAID_CONCIERGE_ORDER'
                                  ? '💳 Paid Stripe Concierge Order'
                                  : ev.eventType === 'WARM_INTRO_LEAD'
                                    ? '🤝 Warm Intro Dossier'
                                    : '🔗 Outbound Affiliate Click'}
                              </Badge>
                              <span className="text-xs font-bold text-white">
                                {ev.partnerName}
                              </span>
                              <Badge
                                variant="outline"
                                className="border-slate-700 text-[10px] text-slate-300"
                              >
                                {getSlotDefinition(ev.slotKey).moduleBadge}
                              </Badge>
                              {ev.selectedDomain && (
                                <Badge className="border-emerald-500/40 bg-emerald-500/20 text-[10px] font-mono text-emerald-300">
                                  Domain: {ev.selectedDomain}
                                </Badge>
                              )}
                            </div>

                            <div className="text-xs text-slate-300">
                              <strong>
                                {ev.founderName || 'Anonymous Founder'}
                              </strong>{' '}
                              {ev.founderEmail ? `(${ev.founderEmail})` : ''} •{' '}
                              <span className="text-slate-400">
                                Plan: {ev.planTitle || ev.planId || 'Direct'}
                              </span>{' '}
                              •{' '}
                              <span className="text-slate-500">
                                {new Date(ev.createdAt).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <select
                              value={ev.leadStatus}
                              onChange={(e) =>
                                handleUpdateLeadStatus(
                                  ev,
                                  e.target.value as ReferralLeadStatus
                                )
                              }
                              className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white"
                            >
                              <option value="CLICKED">Link Clicked</option>
                              <option value="INTRO_SENT">
                                Warm Intro Sent
                              </option>
                              <option value="PARTNER_CONTACTED">
                                Partner Contacted Founder
                              </option>
                              <option value="CONVERTED_BOUNTY_DUE">
                                Converted • Bounty Due 💰
                              </option>
                              <option value="BOUNTY_PAID">
                                Bounty Paid ✅
                              </option>
                              <option value="ARCHIVED">Archived</option>
                            </select>

                            {answerEntries.length > 0 && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setExpandedEventId(isExpanded ? null : ev.id)
                                }
                                className="h-8 border-slate-700 bg-slate-900 text-xs text-indigo-300"
                              >
                                {isExpanded
                                  ? 'Hide Intake Answers'
                                  : `View Intake Answers (${answerEntries.length})`}
                              </Button>
                            )}
                          </div>
                        </div>

                        {ev.estimatedBountyAmount && (
                          <div className="text-[11px] text-emerald-400">
                            💰 Expected Bounty / Commission:{' '}
                            <strong>{ev.estimatedBountyAmount}</strong>
                          </div>
                        )}

                        {isExpanded && answerEntries.length > 0 && (
                          <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 space-y-1.5">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                              Submitted Founder Intake Answers
                            </div>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              {answerEntries.map(([k, v]) => (
                                <div
                                  key={k}
                                  className="rounded border border-slate-800 bg-slate-950 p-2 text-xs"
                                >
                                  <div className="text-[10px] text-slate-400 uppercase">
                                    {k.replace(/_/g, ' ')}
                                  </div>
                                  <div className="font-semibold text-white mt-0.5">
                                    {v}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ===================================================================== */}
      {/* CREATE / EDIT PARTNER OFFER MODAL (WITH WARM INTRO QUESTION BUILDER) */}
      {/* ===================================================================== */}
      {editingOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto">
          <div className="my-8 w-full max-w-4xl rounded-2xl border border-slate-700 bg-slate-900 p-6 text-slate-100 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <Badge className="border-indigo-500/40 bg-indigo-500/20 text-[10px] text-indigo-300">
                  Partner Referral &amp; Slot Configurator
                </Badge>
                <h3 className="mt-1 text-lg font-bold text-white">
                  {editingOffer.id
                    ? `Edit Partner: ${editingOffer.name}`
                    : 'Add New Partner Offer to Module Step'}
                </h3>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setEditingOffer(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSavePartnerOffer} className="space-y-6">
              {/* SECTION 1: WHERE DOES THIS PARTNER GO? */}
              <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4 space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  1. Step Placement &amp; Country Targeting
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-xs text-slate-200">
                      Which Module &amp; Step Should This Partner Appear In?
                    </Label>
                    <select
                      value={editingOffer.slotKey}
                      onChange={(e) => {
                        const nextSlot = e.target.value as PartnerSlotKey;
                        const slotDef = getSlotDefinition(nextSlot);
                        setEditingOffer({
                          ...editingOffer,
                          slotKey: nextSlot,
                          warmIntroQuestionsJson:
                            editingOffer.warmIntroQuestionsJson.length > 0
                              ? editingOffer.warmIntroQuestionsJson
                              : [...slotDef.defaultWarmIntroQuestions],
                        });
                      }}
                      className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                    >
                      {PARTNER_SLOT_DEFINITIONS.map((slot) => (
                        <option key={slot.slotKey} value={slot.slotKey}>
                          {slot.moduleBadge} — {slot.stepNumberLabel} (
                          {slot.title})
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-indigo-300/90">
                      📍{' '}
                      {getSlotDefinition(editingOffer.slotKey).whereItAppears}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-200">
                      Country Visibility Scope
                    </Label>
                    <select
                      value={editingOffer.countryScope}
                      onChange={(e) =>
                        setEditingOffer({
                          ...editingOffer,
                          countryScope: e.target.value as PartnerCountryScope,
                        })
                      }
                      className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                    >
                      <option value="ALL">🌍 ALL (Ireland, UK &amp; Global)</option>
                      <option value="IE">🇮🇪 Ireland Founders Only (IE)</option>
                      <option value="GB">🇬🇧 UK Founders Only (GB)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: PARTNER CARD DISPLAY DETAILS */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  2. Partner Card Copy &amp; Founder Perk Info
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">Logo Emoji</Label>
                    <Input
                      value={editingOffer.logoEmoji}
                      onChange={(e) =>
                        setEditingOffer({
                          ...editingOffer,
                          logoEmoji: e.target.value,
                        })
                      }
                      placeholder="⚡"
                      className="border-slate-700 bg-slate-900 text-xs text-white"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-xs text-slate-300">
                      Partner Name *
                    </Label>
                    <Input
                      value={editingOffer.name}
                      onChange={(e) =>
                        setEditingOffer({
                          ...editingOffer,
                          name: e.target.value,
                        })
                      }
                      placeholder="e.g. Company Bureau Formations / Blacknight"
                      className="border-slate-700 bg-slate-900 text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">
                      Tracking Slug (/api/go/[slug])
                    </Label>
                    <Input
                      value={editingOffer.slug}
                      onChange={(e) =>
                        setEditingOffer({
                          ...editingOffer,
                          slug: e.target.value,
                        })
                      }
                      placeholder="auto-generated-from-name"
                      className="border-slate-700 bg-slate-900 text-xs font-mono text-indigo-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">
                      Category Label
                    </Label>
                    <Input
                      value={editingOffer.category}
                      onChange={(e) =>
                        setEditingOffer({
                          ...editingOffer,
                          category: e.target.value,
                        })
                      }
                      placeholder="e.g. Accredited Domain Registrar"
                      className="border-slate-700 bg-slate-900 text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">
                      Green Perk Badge Text
                    </Label>
                    <Input
                      value={editingOffer.badgeText}
                      onChange={(e) =>
                        setEditingOffer({
                          ...editingOffer,
                          badgeText: e.target.value,
                        })
                      }
                      placeholder="e.g. 90% Off for 6 Months"
                      className="border-slate-700 bg-slate-900 text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">
                      Optional Promo Code to Copy
                    </Label>
                    <Input
                      value={editingOffer.promoCode || ''}
                      onChange={(e) =>
                        setEditingOffer({
                          ...editingOffer,
                          promoCode: e.target.value,
                        })
                      }
                      placeholder="e.g. PREFLIGHT2026"
                      className="border-slate-700 bg-slate-900 text-xs font-mono text-amber-300"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300">
                    Headline Hook *
                  </Label>
                  <Input
                    value={editingOffer.headline}
                    onChange={(e) =>
                      setEditingOffer({
                        ...editingOffer,
                        headline: e.target.value,
                      })
                    }
                    placeholder="e.g. Fast-Track LTD Incorporation + Revenue Tax Registration"
                    className="border-slate-700 bg-slate-900 text-xs text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300">
                    Perk &amp; Benefit Description
                  </Label>
                  <textarea
                    rows={2}
                    value={editingOffer.perkDescription}
                    onChange={(e) =>
                      setEditingOffer({
                        ...editingOffer,
                        perkDescription: e.target.value,
                      })
                    }
                    placeholder="Explain why founders should use this partner and what perk they unlock..."
                    className="w-full rounded-md border border-slate-700 bg-slate-900 p-2.5 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">
                      Trust Factor Footnote
                    </Label>
                    <Input
                      value={editingOffer.trustFactor}
                      onChange={(e) =>
                        setEditingOffer({
                          ...editingOffer,
                          trustFactor: e.target.value,
                        })
                      }
                      placeholder="e.g. Central Bank of Ireland & FCA Regulated"
                      className="border-slate-700 bg-slate-900 text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">
                      CTA Button Label
                    </Label>
                    <Input
                      value={editingOffer.actionLabel}
                      onChange={(e) =>
                        setEditingOffer({
                          ...editingOffer,
                          actionLabel: e.target.value,
                        })
                      }
                      placeholder="e.g. Claim Domain on Blacknight"
                      className="border-slate-700 bg-slate-900 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: REFERRAL MODE (AFFILIATE LINK vs WARM INTRO MODAL vs PAID STRIPE CONCIERGE) */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-950/15 p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-300">
                    3. Referral Action Mode, Stripe Checkout Pricing &amp; Intake Questions
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setEditingOffer({
                          ...editingOffer,
                          actionType: 'AFFILIATE_LINK',
                        })
                      }
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                        editingOffer.actionType === 'AFFILIATE_LINK'
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      🔗 External Affiliate Link (/api/go/[slug])
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const defaultQs = getSlotDefinition(
                          editingOffer.slotKey
                        ).defaultWarmIntroQuestions;
                        setEditingOffer({
                          ...editingOffer,
                          actionType: 'WARM_INTRO_MODAL',
                          warmIntroQuestionsJson:
                            editingOffer.warmIntroQuestionsJson.length > 0
                              ? editingOffer.warmIntroQuestionsJson
                              : [...defaultQs],
                        });
                      }}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                        editingOffer.actionType === 'WARM_INTRO_MODAL'
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      🤝 Free Warm Intro Modal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const defaultQs = getSlotDefinition(
                          editingOffer.slotKey
                        ).defaultWarmIntroQuestions;
                        setEditingOffer({
                          ...editingOffer,
                          actionType: 'PAID_STRIPE_CONCIERGE',
                          checkoutPriceAmount:
                            editingOffer.checkoutPriceAmount || 150,
                          checkoutCurrency:
                            editingOffer.checkoutCurrency || 'EUR',
                          checkoutAddonsJson:
                            editingOffer.checkoutAddonsJson || [],
                          warmIntroQuestionsJson:
                            editingOffer.warmIntroQuestionsJson.length > 0
                              ? editingOffer.warmIntroQuestionsJson
                              : [...defaultQs],
                        });
                      }}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                        editingOffer.actionType === 'PAID_STRIPE_CONCIERGE'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      💳 Paid Stripe Concierge (Flow B: Questions → Stripe → Auto-Email)
                    </button>
                  </div>
                </div>

                {editingOffer.actionType === 'PAID_STRIPE_CONCIERGE' && (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-4">
                    <div className="text-xs font-bold text-emerald-300">
                      💳 Stripe Checkout Package Pricing &amp; Optional Add-Ons (Flow B)
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-200">
                          Base Checkout Price (Whole Units, e.g. 150) *
                        </Label>
                        <Input
                          type="number"
                          min={1}
                          value={editingOffer.checkoutPriceAmount ?? 150}
                          onChange={(e) =>
                            setEditingOffer({
                              ...editingOffer,
                              checkoutPriceAmount: Number(e.target.value) || 0,
                            })
                          }
                          className="border-slate-700 bg-slate-900 text-xs font-bold text-emerald-300"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-200">
                          Checkout Currency
                        </Label>
                        <select
                          value={editingOffer.checkoutCurrency || 'EUR'}
                          onChange={(e) =>
                            setEditingOffer({
                              ...editingOffer,
                              checkoutCurrency: e.target.value,
                            })
                          }
                          className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                        >
                          <option value="EUR">EUR (€ Euro)</option>
                          <option value="GBP">GBP (£ British Pound)</option>
                          <option value="USD">USD ($ US Dollar)</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-200">
                          Primary Checkout Button Label
                        </Label>
                        <Input
                          value={editingOffer.actionLabel}
                          onChange={(e) =>
                            setEditingOffer({
                              ...editingOffer,
                              actionLabel: e.target.value,
                            })
                          }
                          placeholder="Incorporate My Company — €150"
                          className="border-slate-700 bg-slate-900 text-xs text-white"
                        />
                      </div>
                    </div>

                    {/* Optional Add-Ons Builder */}
                    <div className="space-y-2 border-t border-emerald-500/20 pt-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Label className="text-xs font-semibold text-emerald-200">
                          Optional Checkout Add-Ons ({(editingOffer.checkoutAddonsJson || []).length})
                        </Label>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() =>
                            setEditingOffer({
                              ...editingOffer,
                              checkoutAddonsJson: [
                                ...(editingOffer.checkoutAddonsJson || []),
                                {
                                  id: `addon_${Date.now()}`,
                                  label: 'Virtual Registered Office Address (12 Months)',
                                  description: 'Official Dublin / London registered office address & statutory mail forwarding.',
                                  priceAmount: 150,
                                },
                              ],
                            })
                          }
                          className="h-7 bg-emerald-600 text-[11px] text-white hover:bg-emerald-500"
                        >
                          + Add Optional Upsell Add-On
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {(editingOffer.checkoutAddonsJson || []).map(
                          (addon, aIdx) => (
                            <div
                              key={addon.id}
                              className="grid grid-cols-1 gap-2 rounded-lg border border-slate-800 bg-slate-950 p-3 sm:grid-cols-12 items-center"
                            >
                              <div className="sm:col-span-4">
                                <Label className="text-[10px] text-slate-400">
                                  Add-On Title
                                </Label>
                                <Input
                                  value={addon.label}
                                  onChange={(e) => {
                                    const nextAddons = [
                                      ...(editingOffer.checkoutAddonsJson || []),
                                    ];
                                    nextAddons[aIdx] = {
                                      ...addon,
                                      label: e.target.value,
                                    };
                                    setEditingOffer({
                                      ...editingOffer,
                                      checkoutAddonsJson: nextAddons,
                                    });
                                  }}
                                  className="h-8 border-slate-700 bg-slate-900 text-xs text-white mt-0.5"
                                />
                              </div>
                              <div className="sm:col-span-5">
                                <Label className="text-[10px] text-slate-400">
                                  Description
                                </Label>
                                <Input
                                  value={addon.description}
                                  onChange={(e) => {
                                    const nextAddons = [
                                      ...(editingOffer.checkoutAddonsJson || []),
                                    ];
                                    nextAddons[aIdx] = {
                                      ...addon,
                                      description: e.target.value,
                                    };
                                    setEditingOffer({
                                      ...editingOffer,
                                      checkoutAddonsJson: nextAddons,
                                    });
                                  }}
                                  className="h-8 border-slate-700 bg-slate-900 text-xs text-white mt-0.5"
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <Label className="text-[10px] text-slate-400">
                                  + Price ({editingOffer.checkoutCurrency || 'EUR'})
                                </Label>
                                <Input
                                  type="number"
                                  min={0}
                                  value={addon.priceAmount}
                                  onChange={(e) => {
                                    const nextAddons = [
                                      ...(editingOffer.checkoutAddonsJson || []),
                                    ];
                                    nextAddons[aIdx] = {
                                      ...addon,
                                      priceAmount: Number(e.target.value) || 0,
                                    };
                                    setEditingOffer({
                                      ...editingOffer,
                                      checkoutAddonsJson: nextAddons,
                                    });
                                  }}
                                  className="h-8 border-slate-700 bg-slate-900 text-xs font-bold text-emerald-300 mt-0.5"
                                />
                              </div>
                              <div className="sm:col-span-1 flex justify-end pt-4">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    const nextAddons = (
                                      editingOffer.checkoutAddonsJson || []
                                    ).filter((_, idx) => idx !== aIdx);
                                    setEditingOffer({
                                      ...editingOffer,
                                      checkoutAddonsJson: nextAddons,
                                    });
                                  }}
                                  className="h-8 px-2 text-rose-400 hover:bg-rose-950/50"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-200">
                    Destination Referral URL (Supports{' '}
                    <code className="text-emerald-300">{'{domain}'}</code>,{' '}
                    <code className="text-emerald-300">{'{planId}'}</code>,{' '}
                    <code className="text-emerald-300">{'{country}'}</code>{' '}
                    macros)
                  </Label>
                  <Input
                    value={editingOffer.referralUrl}
                    onChange={(e) =>
                      setEditingOffer({
                        ...editingOffer,
                        referralUrl: e.target.value,
                      })
                    }
                    placeholder="https://www.blacknight.com/domain-registration/?domain={domain}&subid={planId}"
                    className="border-slate-700 bg-slate-900 text-xs font-mono text-white"
                  />
                </div>

                {(editingOffer.actionType === 'WARM_INTRO_MODAL' ||
                  editingOffer.actionType === 'PAID_STRIPE_CONCIERGE') && (
                  <div className="space-y-4 border-t border-amber-500/20 pt-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-amber-200">
                        Partner Recipient Email (Where the Warm Intro Dossier is
                        Sent)
                      </Label>
                      <Input
                        value={editingOffer.warmIntroRecipientEmail || ''}
                        onChange={(e) =>
                          setEditingOffer({
                            ...editingOffer,
                            warmIntroRecipientEmail: e.target.value,
                          })
                        }
                        placeholder="e.g. newbusiness@companyformations.ie"
                        className="border-slate-700 bg-slate-900 text-xs font-mono text-amber-200"
                      />
                    </div>

                    {/* Question Builder */}
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Label className="text-xs font-bold text-white">
                          Questions Asked to Founder Before Sending Warm Intro (
                          {editingOffer.warmIntroQuestionsJson.length})
                        </Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setEditingOffer({
                                ...editingOffer,
                                warmIntroQuestionsJson: [
                                  ...getSlotDefinition(editingOffer.slotKey)
                                    .defaultWarmIntroQuestions,
                                ],
                              })
                            }
                            className="h-7 border-slate-700 bg-slate-800 text-[11px] text-slate-200"
                          >
                            Load Step Defaults
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() =>
                              setEditingOffer({
                                ...editingOffer,
                                warmIntroQuestionsJson: [
                                  ...editingOffer.warmIntroQuestionsJson,
                                  {
                                    id: `custom_q_${Date.now()}`,
                                    label: 'New Custom Intake Question',
                                    placeholder: 'Enter details...',
                                    type: 'TEXT',
                                    required: true,
                                  },
                                ],
                              })
                            }
                            className="h-7 bg-amber-600 text-[11px] text-white hover:bg-amber-500"
                          >
                            + Add Question
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {editingOffer.warmIntroQuestionsJson.map((q, qIdx) => (
                          <div
                            key={q.id}
                            className="grid grid-cols-1 gap-2 rounded-lg border border-slate-800 bg-slate-950 p-3 sm:grid-cols-12 items-center"
                          >
                            <div className="sm:col-span-6">
                              <Label className="text-[10px] text-slate-400">
                                Question Label
                              </Label>
                              <Input
                                value={q.label}
                                onChange={(e) => {
                                  const nextQs = [
                                    ...editingOffer.warmIntroQuestionsJson,
                                  ];
                                  nextQs[qIdx] = {
                                    ...q,
                                    label: e.target.value,
                                  };
                                  setEditingOffer({
                                    ...editingOffer,
                                    warmIntroQuestionsJson: nextQs,
                                  });
                                }}
                                className="h-8 border-slate-700 bg-slate-900 text-xs text-white mt-0.5"
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <Label className="text-[10px] text-slate-400">
                                Input Type
                              </Label>
                              <select
                                value={q.type}
                                onChange={(e) => {
                                  const nextQs = [
                                    ...editingOffer.warmIntroQuestionsJson,
                                  ];
                                  nextQs[qIdx] = {
                                    ...q,
                                    type: e.target.value as 'TEXT' | 'SELECT',
                                    options:
                                      e.target.value === 'SELECT' && !q.options
                                        ? ['Option 1', 'Option 2']
                                        : q.options,
                                  };
                                  setEditingOffer({
                                    ...editingOffer,
                                    warmIntroQuestionsJson: nextQs,
                                  });
                                }}
                                className="mt-0.5 h-8 w-full rounded-md border border-slate-700 bg-slate-900 px-2 text-xs text-white"
                              >
                                <option value="TEXT">Text Input</option>
                                <option value="SELECT">Dropdown</option>
                              </select>
                            </div>

                            <div className="sm:col-span-3">
                              <Label className="text-[10px] text-slate-400">
                                {q.type === 'SELECT'
                                  ? 'Options (comma-separated)'
                                  : 'Placeholder'}
                              </Label>
                              <Input
                                value={
                                  q.type === 'SELECT'
                                    ? (q.options || []).join(', ')
                                    : q.placeholder || ''
                                }
                                onChange={(e) => {
                                  const nextQs = [
                                    ...editingOffer.warmIntroQuestionsJson,
                                  ];
                                  if (q.type === 'SELECT') {
                                    nextQs[qIdx] = {
                                      ...q,
                                      options: e.target.value
                                        .split(',')
                                        .map((s) => s.trim())
                                        .filter(Boolean),
                                    };
                                  } else {
                                    nextQs[qIdx] = {
                                      ...q,
                                      placeholder: e.target.value,
                                    };
                                  }
                                  setEditingOffer({
                                    ...editingOffer,
                                    warmIntroQuestionsJson: nextQs,
                                  });
                                }}
                                className="h-8 border-slate-700 bg-slate-900 text-xs text-white mt-0.5"
                              />
                            </div>

                            <div className="sm:col-span-1 flex justify-end pt-4">
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  const nextQs =
                                    editingOffer.warmIntroQuestionsJson.filter(
                                      (_, idx) => idx !== qIdx
                                    );
                                  setEditingOffer({
                                    ...editingOffer,
                                    warmIntroQuestionsJson: nextQs,
                                  });
                                }}
                                className="h-8 px-2 text-rose-400 hover:bg-rose-950/50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 4: PRIVATE ADMIN COMMISSION / BOUNTY NOTES */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/15 p-4 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  4. Private Admin Deal Terms &amp; Commission Notes (Hidden
                  from Users)
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">
                      Commission / Bounty Structure
                    </Label>
                    <Input
                      value={editingOffer.commissionBountySummary || ''}
                      onChange={(e) =>
                        setEditingOffer({
                          ...editingOffer,
                          commissionBountySummary: e.target.value,
                        })
                      }
                      placeholder="e.g. €85 CPA per completed LTD incorporation"
                      className="border-slate-700 bg-slate-900 text-xs text-emerald-300"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">
                      Partner Account Manager / Internal Notes
                    </Label>
                    <Input
                      value={editingOffer.partnerContactNotes || ''}
                      onChange={(e) =>
                        setEditingOffer({
                          ...editingOffer,
                          partnerContactNotes: e.target.value,
                        })
                      }
                      placeholder="e.g. Contact Sarah at sarah@partner.ie — Net 30 payout"
                      className="border-slate-700 bg-slate-900 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* MODAL FOOTER */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingOffer(null)}
                  className="border-slate-700 bg-slate-800 text-xs text-slate-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingOffer}
                  className="bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-500"
                >
                  {isSavingOffer
                    ? 'Saving Partner...'
                    : 'Save Partner & Assign to Step'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
