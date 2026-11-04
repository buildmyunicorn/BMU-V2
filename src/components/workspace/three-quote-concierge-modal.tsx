'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Zap,
  CheckCircle2,
  Clock,
  Building2,
  FileText,
  ExternalLink,
  Loader2,
  AlertCircle,
  X,
  Mail,
  User,
  ShieldCheck,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  submitThreeQuoteRfpAction,
  getPlanQuotesAction,
} from '@/app/actions/quote-concierge';
import type { QuoteSupplierCategory } from '@/lib/partners/partner-catalog-store';
import type { QuoteRfpWorkPackageItem } from '@/db/schema';
import { formatPlanCurrency } from '@/lib/localization';

interface ThreeQuoteConciergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  planTitle: string;
  hqCountryCode?: string;
  baseCurrency?: string;
  sourceModule: 'MOD_D_PRODUCT_BUILD' | 'MOD_E_OPERATIONS';
  defaultCategory?: QuoteSupplierCategory;
  initialEquipmentName?: string;
  initialWorkPackages?: Array<{
    id?: string;
    name?: string;
    title?: string;
    scope?: string;
    description?: string;
    targetDays?: number;
  }>;
  initialBudgetEstimate?: number;
  initialFounderContact?: {
    name?: string;
    email?: string;
    phone?: string;
    companyName?: string;
  };
  onSuccess?: () => void;
}

export function ThreeQuoteConciergeModal({
  isOpen,
  onClose,
  planId,
  planTitle,
  hqCountryCode = 'IE',
  baseCurrency = 'EUR',
  sourceModule,
  defaultCategory = 'DEV_AGENCY',
  initialEquipmentName,
  initialWorkPackages,
  initialBudgetEstimate,
  initialFounderContact,
  onSuccess,
}: ThreeQuoteConciergeModalProps) {
  const isUK = hqCountryCode === 'GB';
  const currencySymbol = isUK ? '£' : '€';

  const [rfpCategory, setRfpCategory] = useState<QuoteSupplierCategory>(
    sourceModule === 'MOD_E_OPERATIONS' ? 'EQUIPMENT_SUPPLIER' : defaultCategory
  );
  const [projectTitle, setProjectTitle] = useState(
    initialEquipmentName
      ? `3 Quotes for ${initialEquipmentName}`
      : `${planTitle} - V1 Build & Delivery RFP`
  );
  const [budgetRange, setBudgetRange] = useState(
    initialBudgetEstimate
      ? `${currencySymbol}${Math.round(initialBudgetEstimate * 0.8).toLocaleString()} – ${currencySymbol}${Math.round(initialBudgetEstimate * 1.2).toLocaleString()} ex-VAT`
      : isUK
        ? '£5,000 – £15,000 ex-VAT'
        : '€5,000 – €15,000 ex-VAT'
  );
  const [targetDeliveryTimeline, setTargetDeliveryTimeline] = useState('6–8 weeks');
  const [scopeSummary, setScopeSummary] = useState(
    sourceModule === 'MOD_E_OPERATIONS'
      ? `Formal equipment quotation needed for grant compliance (${isUK ? 'Innovate UK & BBB' : 'LEO & Enterprise Ireland Appendix C'}). Specification must include make, model, delivery terms, warranty, and net ex-VAT breakdown.`
      : `Complete V1 technical build scope broken down into distinct deliverable work packages. Requires formal itemized quotation for grant compliance (${isUK ? 'Innovate UK / SEIS' : 'LEO Priming / Feasibility Appendix C'}).`
  );

  const [workPackages, setWorkPackages] = useState<QuoteRfpWorkPackageItem[]>(() => {
    if (initialWorkPackages && initialWorkPackages.length > 0) {
      return initialWorkPackages.map((wp, idx) => ({
        id: wp.id || `wp_${idx + 1}`,
        name: wp.name || wp.title || `Work Package ${idx + 1}`,
        description: wp.description || wp.scope || '',
        targetDays: wp.targetDays || 14,
      }));
    }
    if (sourceModule === 'MOD_E_OPERATIONS' && initialEquipmentName) {
      return [
        {
          id: 'item_1',
          name: initialEquipmentName,
          description: 'Supplier itemized formal quote on company letterhead showing registration/VAT number, warranty, and lead time.',
          targetDays: 7,
        },
      ];
    }
    return [
      {
        id: 'wp_1',
        name: 'WP1: Core Architecture & Database Setup',
        description: 'Database schema, auth, hosting, and API scaffolding.',
        targetDays: 14,
      },
      {
        id: 'wp_2',
        name: 'WP2: Frontend UI & User Workflows',
        description: 'Interactive customer portal, responsive screens, and onboarding.',
        targetDays: 21,
      },
      {
        id: 'wp_3',
        name: 'WP3: Integration & End-to-End Testing',
        description: 'Payment gateways, third-party APIs, and security QA.',
        targetDays: 14,
      },
    ];
  });

  const [founderName, setFounderName] = useState(initialFounderContact?.name || '');
  const [founderEmail, setFounderEmail] = useState(initialFounderContact?.email || '');
  const [founderPhone, setFounderPhone] = useState(initialFounderContact?.phone || '');
  const [founderCompany, setFounderCompany] = useState(
    initialFounderContact?.companyName || planTitle
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<{
    ok: boolean;
    partnerNames?: string[];
    error?: string;
  } | null>(null);

  // Reset category if default changes
  useEffect(() => {
    if (sourceModule === 'MOD_E_OPERATIONS') {
      setRfpCategory('EQUIPMENT_SUPPLIER');
      if (initialEquipmentName) {
        setProjectTitle(`3 Quotes for ${initialEquipmentName}`);
      }
    } else {
      setRfpCategory(defaultCategory);
    }
  }, [sourceModule, defaultCategory, initialEquipmentName]);

  const handleAddWorkPackage = () => {
    const nextIdx = workPackages.length + 1;
    setWorkPackages([
      ...workPackages,
      {
        id: `wp_${nextIdx}`,
        name: `WP${nextIdx}: Work Package ${nextIdx}`,
        description: '',
        targetDays: 14,
      },
    ]);
  };

  const handleRemoveWorkPackage = (idx: number) => {
    setWorkPackages(workPackages.filter((_, i) => i !== idx));
  };

  const handleUpdateWp = (idx: number, field: keyof QuoteRfpWorkPackageItem, val: unknown) => {
    setWorkPackages((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: val } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!founderName.trim() || !founderEmail.trim()) {
      alert('Please provide your name and email address for supplier quote delivery.');
      return;
    }

    setIsSubmitting(true);
    setDispatchResult(null);

    const res = await submitThreeQuoteRfpAction({
      planId,
      sourceModule,
      rfpCategory,
      projectTitle,
      budgetRange,
      targetDeliveryTimeline,
      scopeSummary,
      workPackages,
      founderContact: {
        name: founderName.trim(),
        email: founderEmail.trim(),
        phone: founderPhone.trim() || undefined,
        companyName: founderCompany.trim() || planTitle,
      },
      equipmentItemName: initialEquipmentName,
    });

    setIsSubmitting(false);

    if (res.ok) {
      setDispatchResult({
        ok: true,
        partnerNames: res.partnerNames,
      });
      if (onSuccess) {
        onSuccess();
      }
    } else {
      setDispatchResult({
        ok: false,
        error: res.error || 'Failed to dispatch quotation requests.',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-3 sm:p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-indigo-950 via-indigo-900 to-violet-900 px-6 py-4 text-white">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/30 text-white font-bold text-xs border border-indigo-400/40">
                ⚡
              </span>
              <Badge className="border-indigo-400/40 bg-indigo-500/30 text-[10px] text-indigo-100">
                {isUK ? '🇬🇧 UK Innovate & BBB Ready' : '🇮🇪 IE LEO Appendix C Ready'}
              </Badge>
              <Badge className="border-emerald-400/40 bg-emerald-500/30 text-[10px] text-emerald-100">
                Grant Compliant
              </Badge>
            </div>
            <h3 className="text-base font-bold text-white">
              3-Quote Concierge Marketplace
            </h3>
            <p className="text-xs text-indigo-200/90 max-w-lg">
              {sourceModule === 'MOD_E_OPERATIONS'
                ? `State grant assessors (LEO / Enterprise Ireland / Innovate UK) mandate 3 written independent quotes. Our automated engine dispatches this brief to vetted suppliers.`
                : `Dispatches your Work Packages and technical requirements to vetted software studios. You will receive 3 standardized net ex-VAT quotes on company letterhead.`}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-indigo-300 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {dispatchResult?.ok ? (
          <div className="p-6 space-y-5 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">
                3-Quote Request Dispatched!
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                We have notified our vetted partner network with secure Magic Links. A confirmation receipt has been sent to <strong>{founderEmail}</strong>.
              </p>
            </div>

            {dispatchResult.partnerNames && dispatchResult.partnerNames.length > 0 && (
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 max-w-md mx-auto text-left">
                <div className="text-[11px] font-bold text-indigo-900 mb-2 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-indigo-700" />
                  Invited Supplier Partners:
                </div>
                <ul className="space-y-1.5">
                  {dispatchResult.partnerNames.map((name, i) => (
                    <li key={i} className="text-xs font-semibold text-slate-800 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 max-w-md mx-auto text-left text-xs text-slate-600 space-y-2">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                What happens next?
              </div>
              <p>
                1. Suppliers review your scope and upload official PDF quotes with net ex-VAT pricing.
              </p>
              <p>
                2. You receive an email alert the instant each quote lands.
              </p>
              <p>
                3. Received quotes automatically populate <strong>Module L Appendix C</strong> ready for your grant assessor.
              </p>
            </div>

            <Button
              type="button"
              onClick={() => {
                setDispatchResult(null);
                onClose();
              }}
              className="bg-indigo-600 text-white hover:bg-indigo-700 text-xs px-6"
            >
              Done & Return to Workspace
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {dispatchResult?.error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Error dispatching quotes: </span>
                  {dispatchResult.error}
                </div>
              </div>
            )}

            {/* Category Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">
                Supplier / Provider Category:
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { id: 'DEV_AGENCY', label: 'Dev / Software Agency', icon: '💻' },
                  { id: 'ECOMMERCE_STUDIO', label: 'E-Commerce / Shopify', icon: '🛍️' },
                  { id: 'EQUIPMENT_SUPPLIER', label: 'Equipment & Machinery', icon: '⚙️' },
                  { id: 'PACKAGING_PRINTING', label: 'Packaging & Print', icon: '📦' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setRfpCategory(cat.id as QuoteSupplierCategory)}
                    className={`rounded-lg border p-2 text-left text-xs transition ${
                      rfpCategory === cat.id
                        ? 'border-indigo-600 bg-indigo-50 font-bold text-indigo-900 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300'
                    }`}
                  >
                    <div className="text-base">{cat.icon}</div>
                    <div className="mt-1 truncate font-semibold">{cat.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Project Title & Target Budget */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Project / Equipment Title:
                </label>
                <input
                  type="text"
                  required
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="e.g. V1 Mobile App MVP or 1325 CNC Router"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-indigo-600 focus:outline-hidden sm:text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Target Budget Range (Ex-VAT):
                </label>
                <input
                  type="text"
                  required
                  value={budgetRange}
                  onChange={(e) => setBudgetRange(e.target.value)}
                  placeholder="e.g. €7,000 - €12,000 ex-VAT"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-indigo-600 focus:outline-hidden sm:text-xs"
                />
              </div>
            </div>

            {/* Target Delivery Timeline */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                Target Timeline / Lead Time:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['2–4 weeks', '6–8 weeks', '3–4 months'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTargetDeliveryTimeline(t)}
                    className={`rounded-lg border px-2.5 py-1.5 text-xs text-center transition ${
                      targetDeliveryTimeline === t
                        ? 'border-indigo-600 bg-indigo-50 font-bold text-indigo-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Scope Summary */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                Scope Summary & Technical Requirements:
              </label>
              <textarea
                rows={3}
                required
                value={scopeSummary}
                onChange={(e) => setScopeSummary(e.target.value)}
                placeholder="Describe key features, technical requirements, materials, or required standards..."
                className="w-full rounded-lg border border-slate-300 bg-white p-3 text-base text-slate-900 focus:border-indigo-600 focus:outline-hidden sm:text-xs"
              />
            </div>

            {/* Work Packages / Line Items */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-900">
                  Itemized Work Packages / Procurement Schedule:
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddWorkPackage}
                  className="h-6 border-indigo-200 text-[11px] text-indigo-700 hover:bg-indigo-50"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add Package / Item
                </Button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {workPackages.map((wp, idx) => (
                  <div
                    key={wp.id || idx}
                    className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50/70 p-2.5"
                  >
                    <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-800 shrink-0 mt-1">
                      {wp.name.split(':')[0] || `WP${idx + 1}`}
                    </span>
                    <div className="flex-1 space-y-1.5">
                      <input
                        type="text"
                        value={wp.name}
                        onChange={(e) => handleUpdateWp(idx, 'name', e.target.value)}
                        placeholder="Package title or item name"
                        className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-base font-semibold text-slate-900 sm:text-xs"
                      />
                      <input
                        type="text"
                        value={wp.description}
                        onChange={(e) => handleUpdateWp(idx, 'description', e.target.value)}
                        placeholder="Deliverables or technical notes"
                        className="w-full rounded border border-slate-200 bg-white px-2 py-0.5 text-base text-slate-600 sm:text-[11px]"
                      />
                    </div>
                    {workPackages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveWorkPackage(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Founder Contact Information */}
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 space-y-3">
              <div className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-indigo-700" />
                Where should official quotes be delivered?
              </div>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Founder Full Name:
                  </label>
                  <input
                    type="text"
                    required
                    value={founderName}
                    onChange={(e) => setFounderName(e.target.value)}
                    placeholder="e.g. Sarah Conroy"
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-base text-slate-900 sm:text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Work / Official Email:
                  </label>
                  <input
                    type="email"
                    required
                    value={founderEmail}
                    onChange={(e) => setFounderEmail(e.target.value)}
                    placeholder="sarah@preflight.com"
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-base text-slate-900 sm:text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Company / Trading Name:
                  </label>
                  <input
                    type="text"
                    required
                    value={founderCompany}
                    onChange={(e) => setFounderCompany(e.target.value)}
                    placeholder={planTitle}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-base text-slate-900 sm:text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Phone (Optional):
                  </label>
                  <input
                    type="tel"
                    value={founderPhone}
                    onChange={(e) => setFounderPhone(e.target.value)}
                    placeholder="+353 87 123 4567"
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-base text-slate-900 sm:text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-xs text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="bg-indigo-600 text-white hover:bg-indigo-700 text-xs px-5 shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Dispatching 3-Quote Request...
                  </>
                ) : (
                  <>
                    <Zap className="mr-1.5 h-3.5 w-3.5" />
                    Dispatch 3-Quote Request
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/**
 * Embedded Tracker Card for Module D and Module E.
 * Fetches and displays quotes received from suppliers with PDF links and grant compliance status.
 */
export function PlanQuotesTrackerCard({
  planId,
  baseCurrency = 'EUR',
  categoryFilter,
  onRequestNewQuotes,
}: {
  planId: string;
  baseCurrency?: string;
  categoryFilter?: QuoteSupplierCategory;
  onRequestNewQuotes?: () => void;
}) {
  const [rfps, setRfps] = useState<
    Array<{
      id: string;
      projectTitle: string;
      rfpCategory: string;
      budgetRange: string;
      targetTimeline: string;
      status: string;
      sourceModule: string;
      quotesReceivedCount: number;
      createdAt: string;
      responses: Array<{
        id: string;
        partnerId: string;
        partnerName: string;
        partnerLogo: string;
        status: string;
        quoteAmountNet?: string | null;
        quoteCurrency: string;
        estimatedWeeks?: number | null;
        quoteFileUrl?: string | null;
        quoteFileName?: string | null;
        quoteNotes?: string | null;
        submittedAt?: string | null;
      }>;
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  const loadQuotes = async () => {
    setLoading(true);
    const res = await getPlanQuotesAction(planId);
    if (res.ok && res.rfps) {
      if (categoryFilter) {
        setRfps(res.rfps.filter((r) => r.rfpCategory === categoryFilter));
      } else {
        setRfps(res.rfps);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadQuotes();
  }, [planId, categoryFilter]);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex items-center justify-center gap-2 text-xs text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
        Checking active supplier quotes...
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-indigo-200 bg-white shadow-xs overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-white to-indigo-50/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600 text-white font-bold text-xs">
            ⚡
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-slate-900">
                Active 3-Quote Concierge RFPs ({rfps.length})
              </h4>
              <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-[10px] text-indigo-700">
                Grant Compliance Bench
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500">
              Quotes automatically attach to Module L Appendix C
            </p>
          </div>
        </div>

        {onRequestNewQuotes && (
          <Button
            type="button"
            size="sm"
            onClick={onRequestNewQuotes}
            className="h-7 border border-indigo-300 bg-white text-xs font-semibold text-indigo-700 hover:bg-indigo-50 shadow-xs"
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Request 3 Quotes
          </Button>
        )}
      </div>

      <div className="p-4">
        {rfps.length === 0 ? (
          <div className="text-center py-5 space-y-2">
            <Building2 className="mx-auto h-8 w-8 text-slate-300" />
            <p className="text-xs text-slate-600">
              No active 3-Quote requests dispatched yet for this plan.
            </p>
            {onRequestNewQuotes && (
              <Button
                type="button"
                size="sm"
                onClick={onRequestNewQuotes}
                className="bg-indigo-600 text-white text-xs hover:bg-indigo-700"
              >
                <Zap className="mr-1.5 h-3.5 w-3.5" />
                Request 3 Quotes Now
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {rfps.map((rfp) => {
              const submittedResponses = rfp.responses.filter(
                (r) => r.status === 'QUOTE_SUBMITTED'
              );
              const isComplete = submittedResponses.length >= 3;

              return (
                <div
                  key={rfp.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-200/80 pb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">
                          {rfp.projectTitle}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            isComplete
                              ? 'border-emerald-300 bg-emerald-50 text-[10px] text-emerald-800'
                              : 'border-amber-300 bg-amber-50 text-[10px] text-amber-800'
                          }
                        >
                          {isComplete
                            ? '✅ 3/3 Quotes Received (Appendix C Ready)'
                            : `⏳ ${submittedResponses.length}/3 Quotes Received`}
                        </Badge>
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-500">
                        Budget: {rfp.budgetRange} • Target: {rfp.targetTimeline} • Dispatched{' '}
                        {new Date(rfp.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="text-[11px] font-semibold text-indigo-700">
                      RFP ID: {rfp.id.slice(0, 8)}
                    </div>
                  </div>

                  {/* Supplier Response Grid */}
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                    {rfp.responses.map((resp) => {
                      const hasQuote = resp.status === 'QUOTE_SUBMITTED';

                      return (
                        <div
                          key={resp.id}
                          className={`rounded-lg border p-3 flex flex-col justify-between transition ${
                            hasQuote
                              ? 'border-emerald-200 bg-white shadow-xs'
                              : 'border-slate-200 bg-white/70'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="text-xs font-bold text-slate-800 truncate">
                                {resp.partnerLogo} {resp.partnerName}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-[9px] ${
                                  hasQuote
                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                    : 'border-slate-300 bg-slate-50 text-slate-600'
                                }`}
                              >
                                {hasQuote ? 'Quote In' : 'Pending'}
                              </Badge>
                            </div>

                            {hasQuote ? (
                              <div className="mt-2 space-y-1">
                                <div className="text-base font-extrabold text-emerald-700">
                                  {formatPlanCurrency(
                                    Number(resp.quoteAmountNet) || 0,
                                    resp.quoteCurrency || baseCurrency
                                  )}{' '}
                                  <span className="text-[10px] font-medium text-slate-500">
                                    ex-VAT
                                  </span>
                                </div>
                                {resp.estimatedWeeks && (
                                  <div className="text-[11px] text-slate-600 flex items-center gap-1">
                                    <Clock className="h-3 w-3 text-slate-400" />
                                    Est. {resp.estimatedWeeks} weeks
                                  </div>
                                )}
                                {resp.quoteNotes && (
                                  <p className="text-[11px] text-slate-500 italic line-clamp-2 mt-1">
                                    &ldquo;{resp.quoteNotes}&rdquo;
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="mt-2 text-[11px] text-slate-400 italic flex items-center gap-1.5">
                                <Clock className="h-3 w-3 text-slate-300" />
                                Supplier reviewing brief...
                              </div>
                            )}
                          </div>

                          {hasQuote && resp.quoteFileUrl && (
                            <div className="mt-3 border-t border-slate-100 pt-2">
                              <a
                                href={resp.quoteFileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                              >
                                <FileText className="h-3 w-3" />
                                View Quote PDF
                                <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
