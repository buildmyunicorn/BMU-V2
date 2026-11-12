'use client';

import React, { useState, useEffect, useId } from 'react';
import {
  ShieldCheck,
  Building2,
  Globe,
  Mail,
  Landmark,
  Calculator,
  Shield,
  FileCheck2,
  Check,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  FileText,
  HelpCircle,
  Lightbulb,
  Sparkles,
  ExternalLink,
  Copy,
  Download,
  AlertCircle,
  Clock,
  Briefcase,
  CheckCheck,
  Search,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PartnerSlot, type PaidConciergeOrderSummary } from '@/components/workspace/partner-slot';
import type { SavedConceptCanvas } from '@/lib/auth/session-store';

export interface ModuleGData {
  step1: {
    state: 'ALREADY_HAVE' | 'HELP_SETUP';
    legalStructure: 'LTD' | 'SOLE_TRADER' | 'DAC' | 'LLP' | 'OTHER';
    customLegalStructure?: string;
    registeredEntityName: string;
    registrationNumber: string; // CRO / Companies House CRN
    registrationDate: string;
    targetFormationTimeline: string;
    incorporationNotes: string;
    incorporationOrder?: PaidConciergeOrderSummary | null;
  };
  step2: {
    state: 'ALREADY_HAVE' | 'HELP_SETUP';
    primaryDomain: string;
    isDomainLive: boolean;
    officialBusinessEmail: string;
    emailProvider: 'GOOGLE_WORKSPACE' | 'MICROSOFT_365' | 'HOSTING_MAIL' | 'OTHER';
    customEmailProvider?: string;
    notes: string;
  };
  step3: {
    state: 'ALREADY_HAVE' | 'HELP_SETUP';
    bankProvider: 'REVOLUT_BUSINESS' | 'AIB' | 'BANK_OF_IRELAND' | 'BARCLAYS' | 'TIDE' | 'MONZO' | 'OTHER';
    customBankProvider?: string;
    hasDedicatedIban: boolean;
    ibanLast4: string;
    targetOpeningTimeline: string;
    notes: string;
  };
  step4: {
    state: 'ALREADY_HAVE' | 'HELP_SETUP';
    softwareChoice: 'XERO' | 'QUICKBOOKS' | 'SURF_ACCOUNTS' | 'EXCEL' | 'OTHER';
    customSoftwareChoice?: string;
    hasAccountant: boolean;
    accountantFirmName: string;
    vatStatus: 'NOT_REGISTERED' | 'REGISTERED' | 'PLANNING_TO_REGISTER';
    payrollSetup: 'NONE' | 'DIRECTOR_ONLY' | 'EXTERNAL_BUREAU' | 'IN_HOUSE';
    notes: string;
  };
  step5: {
    state: 'ALREADY_HAVE' | 'HELP_SETUP';
    hasPublicLiability: boolean;
    hasEmployersLiability: boolean;
    hasProfessionalIndemnity: boolean;
    hasProductLiability: boolean;
    currentInsurerName: string;
    policyRenewalDate: string;
    targetCoverageTimeline: string;
    notes: string;
  };
  step6: {
    state: 'ALREADY_HAVE' | 'HELP_SETUP';
    hasIpAssignmentSigned: boolean;
    hasPrivacyPolicy: boolean;
    hasTermsOfService: boolean;
    hasStandardNda: boolean;
    gdprOfficerDesignated: boolean;
    legalAdvisorOrPlatform: string;
    notes: string;
  };
}

export function getDefaultModuleGData(): ModuleGData {
  return {
    step1: {
      state: 'HELP_SETUP',
      legalStructure: 'LTD',
      customLegalStructure: '',
      registeredEntityName: '',
      registrationNumber: '',
      registrationDate: '',
      targetFormationTimeline: 'WITHIN_30_DAYS',
      incorporationNotes: '',
      incorporationOrder: null,
    },
    step2: {
      state: 'HELP_SETUP',
      primaryDomain: '',
      isDomainLive: false,
      officialBusinessEmail: '',
      emailProvider: 'GOOGLE_WORKSPACE',
      customEmailProvider: '',
      notes: '',
    },
    step3: {
      state: 'HELP_SETUP',
      bankProvider: 'REVOLUT_BUSINESS',
      customBankProvider: '',
      hasDedicatedIban: false,
      ibanLast4: '',
      targetOpeningTimeline: 'WITHIN_30_DAYS',
      notes: '',
    },
    step4: {
      state: 'HELP_SETUP',
      softwareChoice: 'XERO',
      customSoftwareChoice: '',
      hasAccountant: false,
      accountantFirmName: '',
      vatStatus: 'NOT_REGISTERED',
      payrollSetup: 'DIRECTOR_ONLY',
      notes: '',
    },
    step5: {
      state: 'HELP_SETUP',
      hasPublicLiability: false,
      hasEmployersLiability: false,
      hasProfessionalIndemnity: false,
      hasProductLiability: false,
      currentInsurerName: '',
      policyRenewalDate: '',
      targetCoverageTimeline: 'BEFORE_FIRST_SALE',
      notes: '',
    },
    step6: {
      state: 'HELP_SETUP',
      hasIpAssignmentSigned: false,
      hasPrivacyPolicy: false,
      hasTermsOfService: false,
      hasStandardNda: false,
      gdprOfficerDesignated: false,
      legalAdvisorOrPlatform: '',
      notes: '',
    },
  };
}

export interface ModuleGWorkspaceProps {
  plan: {
    id: string;
    title?: string;
    name?: string;
    oneLinerSummary?: string;
    elevatorPitch?: string;
    conceptCanvas?: SavedConceptCanvas;
  };
  selectedCountry?: string; // 'IE' | 'GB' | 'OTHER'
  isVaultReadonly?: boolean;
  initialData?: ModuleGData;
  onSave?: (data: ModuleGData) => Promise<void>;
  onBackToModuleF?: () => void;
  onContinueToModuleH?: () => void;
  initialStep?: number;
  highlightTarget?: string;
}

export function ModuleGWorkspace({
  plan,
  selectedCountry = 'IE',
  isVaultReadonly = false,
  initialData,
  onSave,
  onBackToModuleF,
  onContinueToModuleH,
  initialStep,
  highlightTarget,
}: ModuleGWorkspaceProps) {
  const [data, setData] = useState<ModuleGData>(() => {
    const defaults = getDefaultModuleGData();
    if (!initialData) return defaults;
    return {
      ...defaults,
      ...initialData,
      step1: { ...defaults.step1, ...(initialData.step1 || {}) },
      step2: { ...defaults.step2, ...(initialData.step2 || {}) },
      step3: { ...defaults.step3, ...(initialData.step3 || {}) },
      step4: { ...defaults.step4, ...(initialData.step4 || {}) },
      step5: { ...defaults.step5, ...(initialData.step5 || {}) },
      step6: { ...defaults.step6, ...(initialData.step6 || {}) },
    };
  });
  const isFirstRenderRef = React.useRef(true);
  const dataRef = React.useRef(data);
  dataRef.current = data;
  const onSaveRef = React.useRef(onSave);
  onSaveRef.current = onSave;
  const isDirtyRef = React.useRef(false);
  // Step Accordion View State: 0 = all collapsed by default, 1..7, or 'ALL'
  const [openStep, setOpenStep] = useState<number | 'ALL'>(() => {
    if (initialStep && initialStep >= 1 && initialStep <= 7) {
      return initialStep;
    }
    return 0;
  });

  // Handle deep-link scrolling and highlight
  useEffect(() => {
    if (initialStep && initialStep >= 1 && initialStep <= 7) {
      setOpenStep(initialStep);
      setTimeout(() => {
        const targetId = highlightTarget || `mod-g-step-${initialStep}`;
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.remove('attention-highlight');
          void el.offsetWidth;
          el.classList.add('attention-highlight');
          setTimeout(() => el.classList.remove('attention-highlight'), 3000);
        }
      }, 250);
    }
  }, [initialStep, highlightTarget]);
  const [isCopiedBrief, setIsCopiedBrief] = useState(false);
  const [activeWhyCard, setActiveWhyCard] = useState<number | null>(null);
  const [activeExampleCard, setActiveExampleCard] = useState<number | null>(null);

  // Step 2: Live Domain Availability Checker -> Referral Claim -> Save Back State
  const [domainSearchInput, setDomainSearchInput] = useState<string>(() => {
    const raw =
      initialData?.step2?.primaryDomain ||
      plan.title ||
      plan.name ||
      '';
    return raw
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('.')[0]
      .replace(/[^a-z0-9-]/g, '');
  });
  const [isCheckingDomains, setIsCheckingDomains] = useState(false);
  const [domainCheckResults, setDomainCheckResults] = useState<
    Array<{
      domain: string;
      tld: string;
      status?: 'AVAILABLE' | 'TAKEN';
      available?: boolean;
      statusLabel?: string;
      reason?: string;
      notes?: string;
    }>
  >([]);
  const [selectedDomainForClaim, setSelectedDomainForClaim] = useState<string>(
    () => initialData?.step2?.primaryDomain || ''
  );
  const [domainSavedConfirmation, setDomainSavedConfirmation] = useState<string | null>(
    null
  );

  const handleCheckDomainAvailability = async (customQuery?: string) => {
    const queryToUse = (customQuery ?? domainSearchInput).trim();
    if (!queryToUse || queryToUse.length < 2) return;
    setIsCheckingDomains(true);
    setDomainSavedConfirmation(null);
    try {
      const res = await fetch(
        `/api/domains/check?q=${encodeURIComponent(queryToUse)}`
      );
      const json = await res.json();
      if (Array.isArray(json.results)) {
        setDomainCheckResults(json.results);
        const preferredTld = normalizedCountry === 'GB' ? '.co.uk' : '.ie';
        const isItemAvail = (r: { status?: string; available?: boolean }) =>
          r.status === 'AVAILABLE' || r.available === true;
        const availablePreferred = json.results.find(
          (r: { status?: string; available?: boolean; tld: string; domain: string }) =>
            isItemAvail(r) && r.tld === preferredTld
        );
        const firstAvailable =
          availablePreferred ||
          json.results.find(
            (r: { status?: string; available?: boolean; domain: string }) =>
              isItemAvail(r)
          );
        if (firstAvailable && !selectedDomainForClaim) {
          setSelectedDomainForClaim(firstAvailable.domain);
        }
      }
    } catch {
      // Fallback deterministic local preview if offline
      const base = queryToUse
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .slice(0, 32);
      const fallback = ['.ie', '.co.uk', '.com', '.io'].map((tld) => ({
        domain: `${base}${tld}`,
        tld,
        status: 'AVAILABLE' as const,
        reason: 'No active DNS SOA/A records found (Likely Available)',
      }));
      setDomainCheckResults(fallback);
      if (!selectedDomainForClaim && fallback[0]) {
        setSelectedDomainForClaim(fallback[0].domain);
      }
    } finally {
      setIsCheckingDomains(false);
    }
  };

  const handleConfirmAndSaveClaimedDomain = (domainToSave?: string) => {
    const cleanDomain = (domainToSave || selectedDomainForClaim || '')
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '');
    if (!cleanDomain) return;

    const currentEmail = data.step2.officialBusinessEmail.trim();
    const shouldSuggestOfficialEmail =
      !currentEmail ||
      currentEmail.includes('@gmail.com') ||
      currentEmail.includes('@hotmail.com') ||
      currentEmail.includes('@yahoo.com');

    setData((prev) => ({
      ...prev,
      step2: {
        ...prev.step2,
        state: 'ALREADY_HAVE',
        primaryDomain: cleanDomain,
        isDomainLive: true,
        officialBusinessEmail: shouldSuggestOfficialEmail
          ? `founder@${cleanDomain}`
          : prev.step2.officialBusinessEmail,
      },
    }));
    setSelectedDomainForClaim(cleanDomain);
    setDomainSavedConfirmation(cleanDomain);
    setTimeout(() => setDomainSavedConfirmation(null), 4500);
  };

  // Auto-detect country code normalize
  const normalizedCountry = selectedCountry === 'GB' || selectedCountry === 'UK' ? 'GB' : selectedCountry === 'IE' ? 'IE' : 'ALL';

  // Active Formation In-Progress Flag (User placed concierge order, awaiting CRO/CRN issue)
  const hasActiveIncorporationOrder =
    Boolean(data.step1.incorporationOrder) && data.step1.state !== 'ALREADY_HAVE';

  // Step 1: Legal Readiness Check
  const isStep1Done =
    data.step1.state === 'ALREADY_HAVE'
      ? !!data.step1.registeredEntityName.trim() && !!data.step1.registrationNumber.trim()
      : !!data.step1.incorporationOrder || !!data.step1.targetFormationTimeline;

  // Step 2: Domain & Email Readiness Check
  const isGmailDetected =
    data.step2.officialBusinessEmail.toLowerCase().includes('@gmail.com') ||
    data.step2.officialBusinessEmail.toLowerCase().includes('@hotmail.com') ||
    data.step2.officialBusinessEmail.toLowerCase().includes('@yahoo.com');

  const isStep2Done =
    data.step2.state === 'ALREADY_HAVE'
      ? !!data.step2.primaryDomain.trim() && !!data.step2.officialBusinessEmail.trim()
      : !!data.step2.primaryDomain.trim() || !!data.step2.emailProvider;

  // Step 3: Bank Readiness Check
  const isStep3Done =
    data.step3.state === 'ALREADY_HAVE'
      ? !!data.step3.bankProvider && (data.step3.hasDedicatedIban || !!data.step3.ibanLast4.trim())
      : !!data.step3.targetOpeningTimeline;

  // Step 4: Accounting & VAT Readiness Check
  const isStep4Done =
    data.step4.state === 'ALREADY_HAVE'
      ? !!data.step4.softwareChoice || data.step4.hasAccountant
      : !!data.step4.vatStatus;

  // Step 5: Insurance Readiness Check
  const isStep5Done =
    data.step5.state === 'ALREADY_HAVE'
      ? data.step5.hasPublicLiability || data.step5.hasProfessionalIndemnity || !!data.step5.currentInsurerName.trim()
      : !!data.step5.targetCoverageTimeline;

  // Step 6: Legal & IP Readiness Check
  const isStep6Done =
    data.step6.state === 'ALREADY_HAVE'
      ? data.step6.hasIpAssignmentSigned || data.step6.hasPrivacyPolicy
      : !!data.step6.legalAdvisorOrPlatform || data.step6.hasIpAssignmentSigned;

  const readinessChecks = [
    { num: 1, title: 'Legal Entity & Registration', done: isStep1Done, state: data.step1.state, inProgress: hasActiveIncorporationOrder },
    { num: 2, title: 'Domain & Official Email', done: isStep2Done, state: data.step2.state, inProgress: false },
    { num: 3, title: 'Dedicated Business Banking', done: isStep3Done, state: data.step3.state, inProgress: false },
    { num: 4, title: 'Bookkeeping, VAT & Payroll', done: isStep4Done, state: data.step4.state, inProgress: false },
    { num: 5, title: 'Statutory Startup Insurance', done: isStep5Done, state: data.step5.state, inProgress: false },
    { num: 6, title: 'Baseline IP & GDPR Compliance', done: isStep6Done, state: data.step6.state, inProgress: false },
  ];

  const completedCoreStepsCount = readinessChecks.filter((s) => s.done).length;
  // Calculate an Operations Readiness percentage (0 - 100%)
  const opsReadinessScore = Math.round((completedCoreStepsCount / 6) * 100);

  // Auto-persist Module G Launchpad edits to session & Cloud SQL via parent onSave
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    if (isVaultReadonly || !onSaveRef.current) return;
    isDirtyRef.current = true;
    const timer = setTimeout(() => {
      if (isDirtyRef.current && onSaveRef.current) {
        isDirtyRef.current = false;
        void onSaveRef.current(dataRef.current);
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [data, isVaultReadonly]);

  // Flush dirty state on unmount
  useEffect(() => {
    return () => {
      if (isDirtyRef.current && onSaveRef.current && !isVaultReadonly) {
        isDirtyRef.current = false;
        void onSaveRef.current(dataRef.current);
      }
    };
  }, []);

  const handleCopyOperationsBrief = () => {
    const brief = `### STARTUP PREFLIGHT — MODULE G: LAUNCHPAD & OPERATIONS BRIEF
**Company Name:** ${data.step1.registeredEntityName || plan.name || 'Startup'}
**HQ Jurisdiction:** ${normalizedCountry === 'IE' ? 'Ireland (CRO)' : normalizedCountry === 'GB' ? 'United Kingdom (Companies House)' : 'International'}
**Operations Readiness Score:** ${opsReadinessScore}% (${completedCoreStepsCount}/6 Setup Pillars Ready)

1. LEGAL ENTITY & REGISTRATION:
- Status: ${data.step1.state === 'ALREADY_HAVE' ? 'Already Registered' : 'Formation In Progress'}
- Entity Structure: ${data.step1.legalStructure === 'OTHER' ? data.step1.customLegalStructure : data.step1.legalStructure}
- Registration Number: ${data.step1.registrationNumber || 'Pending'}
- Timeline: ${data.step1.targetFormationTimeline}

2. DOMAIN & OFFICIAL EMAIL:
- Web Domain: ${data.step2.primaryDomain || 'Pending purchase'}
- Official Email: ${data.step2.officialBusinessEmail || 'Pending setup'}
- Mail Provider: ${data.step2.emailProvider}

3. DEDICATED BUSINESS BANKING:
- Provider: ${data.step3.bankProvider === 'OTHER' ? data.step3.customBankProvider : data.step3.bankProvider}
- Dedicated Account/IBAN: ${data.step3.hasDedicatedIban ? 'Yes' : 'In Setup'}

4. BOOKKEEPING, VAT & PAYROLL:
- Software: ${data.step4.softwareChoice}
- Dedicated Accountant: ${data.step4.hasAccountant ? data.step4.accountantFirmName || 'Yes' : 'DIY Software'}
- VAT Registration Status: ${data.step4.vatStatus}

5. STATUTORY INSURANCE:
- Public Liability: ${data.step5.hasPublicLiability ? 'Active' : 'Pending'}
- Professional Indemnity: ${data.step5.hasProfessionalIndemnity ? 'Active' : 'Pending'}
- Target Coverage: ${data.step5.targetCoverageTimeline}

6. IP & GDPR COMPLIANCE:
- Founder IP Assignment: ${data.step6.hasIpAssignmentSigned ? 'Signed & Assigned' : 'Action Required'}
- Website Privacy & Terms: ${data.step6.hasPrivacyPolicy ? 'Active' : 'Pending'}
`;
    navigator.clipboard.writeText(brief);
    setIsCopiedBrief(true);
    setTimeout(() => setIsCopiedBrief(false), 2000);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header Module Card */}
      <div className="rounded-2xl border border-slate-200 border border-slate-800 bg-slate-950 text-white shadow-xs p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-emerald-400/40 bg-emerald-500/30 text-slate-200">
                Module G • Getting Set Up (Launchpad &amp; Operations Hub)
              </Badge>
              <Badge className="border-emerald-400/30 bg-emerald-500/20 text-emerald-200">
                <Sparkles className="mr-1 h-3 w-3" />
                From Concept to Legally Operational Firm
              </Badge>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Getting Set Up: Launchpad &amp; Operations Hub
            </h1>
            <p className="max-w-2xl text-xs text-slate-200/90 sm:text-sm">
              Establish the 6 statutory operational foundations required by state grant bodies, investors, and banking institutions before taking paying customer revenue.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpenStep((prev) => (prev === 'ALL' ? 0 : 'ALL'))}
                className="border-emerald-400/40 bg-white/10 text-xs text-white hover:bg-white/20"
              >
                {openStep === 'ALL' ? 'Collapse All Steps' : 'Expand All Steps'}
              </Button>
              {onBackToModuleF && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onBackToModuleF}
                  className="border-emerald-400/40 bg-white/10 text-xs text-white hover:bg-white/20"
                >
                  <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                  Back to Module F
                </Button>
              )}
            </div>
            <div className="text-right text-[11px] text-slate-300">
              Operations Readiness: <strong className="text-emerald-300">{opsReadinessScore}%</strong> ({completedCoreStepsCount} of 6 Setup Pillars Ready)
            </div>
          </div>
        </div>

        {/* 7-Step Navigation Strip */}
        <div className="mt-5 grid grid-cols-2 gap-2 border-t border-slate-850 pt-4 sm:grid-cols-4 lg:grid-cols-7">
          {[
            { step: 'Step 1', title: 'Legal Entity', targetId: 'mod-g-step-1', stepNum: 1, done: isStep1Done },
            { step: 'Step 2', title: 'Domain & Email', targetId: 'mod-g-step-2', stepNum: 2, done: isStep2Done },
            { step: 'Step 3', title: 'Business Banking', targetId: 'mod-g-step-3', stepNum: 3, done: isStep3Done },
            { step: 'Step 4', title: 'VAT & Accounts', targetId: 'mod-g-step-4', stepNum: 4, done: isStep4Done },
            { step: 'Step 5', title: 'Insurance', targetId: 'mod-g-step-5', stepNum: 5, done: isStep5Done },
            { step: 'Step 6', title: 'Legal & IP', targetId: 'mod-g-step-6', stepNum: 6, done: isStep6Done },
            { step: 'Overview', title: 'Operations Brief', targetId: 'mod-g-step-7', stepNum: 7, done: opsReadinessScore >= 80 },
          ].map((item) => {
            const isStepOpen = openStep === 'ALL' || openStep === item.stepNum;
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => {
                  setOpenStep(item.stepNum);
                  setTimeout(() => {
                    const el = document.getElementById(item.targetId);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 40);
                }}
                className={`rounded-xl border px-3 py-2 text-left text-xs transition-all hover:border-white/50 hover:bg-white/15 ${
                  isStepOpen
                    ? 'border-amber-300/80 bg-white/20 text-white shadow-xs ring-1 ring-amber-300/50'
                    : item.stepNum === 1 && hasActiveIncorporationOrder
                      ? 'border-amber-400/50 bg-amber-950/40 text-amber-200'
                      : item.done
                        ? 'border-emerald-400/40 bg-emerald-950/30 text-emerald-100'
                        : 'border-slate-800 bg-slate-900 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white/90 text-xs">{item.step}</span>
                  {item.stepNum === 1 && hasActiveIncorporationOrder ? (
                    <span className="rounded-full bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                      In Progress
                    </span>
                  ) : item.done ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <span className="text-[10px] text-slate-300/60">Pending</span>
                  )}
                </div>
                <div className="mt-0.5 truncate text-[11px] text-slate-200/80">{item.title}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: LEGAL ENTITY & REGISTRATION */}
      {/* ========================================================================= */}
      <section id="mod-g-step-1" className="scroll-mt-24">
        {openStep !== 'ALL' && openStep !== 1 ? (
          <div
            onClick={() => setOpenStep(1)}
            className="group scroll-mt-24 cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-emerald-300 hover:shadow-sm"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    data.step1.state === 'ALREADY_HAVE'
                      ? 'bg-emerald-600 text-white'
                      : hasActiveIncorporationOrder
                        ? 'bg-amber-500 text-white shadow-2xs'
                        : isStep1Done
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-900 text-white'
                  }`}
                >
                  {data.step1.state === 'ALREADY_HAVE' ? (
                    <Check className="h-4 w-4" />
                  ) : hasActiveIncorporationOrder ? (
                    <Clock className="h-4 w-4" />
                  ) : isStep1Done ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    '1'
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-sm font-bold text-slate-900 group-hover:text-emerald-800">
                    Step 1: Legal Entity &amp; Company Registration
                  </h2>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {data.step1.state === 'ALREADY_HAVE'
                      ? `Registered ${data.step1.legalStructure} • ${data.step1.registeredEntityName || 'Entity on file'} (${data.step1.registrationNumber || 'CRN recorded'})`
                      : hasActiveIncorporationOrder
                        ? `Setup In Progress • Formation Order with ${data.step1.incorporationOrder?.partnerName || 'Partner'} • Awaiting CRO/CRN Number`
                        : `Setting Up • Target: ${data.step1.targetFormationTimeline.replace(/_/g, ' ')}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant="outline"
                  className={
                    data.step1.state === 'ALREADY_HAVE'
                      ? 'border-emerald-300 bg-emerald-50 text-[10px] text-emerald-800'
                      : hasActiveIncorporationOrder
                        ? 'border-amber-300 bg-amber-50 text-[10px] font-bold text-amber-900 flex items-center gap-1.5'
                        : isStep1Done
                          ? 'border-emerald-300 bg-emerald-50 text-[10px] text-emerald-800'
                          : 'border-slate-300 text-[10px] text-slate-600'
                  }
                >
                  {hasActiveIncorporationOrder && (
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  )}
                  {data.step1.state === 'ALREADY_HAVE'
                    ? 'Registered'
                    : hasActiveIncorporationOrder
                      ? 'Setup In Progress'
                      : isStep1Done
                        ? 'Configured'
                        : 'Needs Setup'}
                </Badge>
                <Button size="sm" variant="ghost" className="h-8 shrink-0 px-2.5 text-xs font-medium text-emerald-700 group-hover:bg-emerald-50">
                  <span>{hasActiveIncorporationOrder ? 'Track Status & Add CRN' : isStep1Done ? 'Edit Step' : 'Open Step'}</span>
                  <ChevronDown className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Card className="rounded-xl border border-slate-200 bg-white shadow-xs">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                      isStep1Done ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'
                    }`}
                  >
                    {isStep1Done ? <Check className="h-4 w-4" /> : '1'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-bold text-slate-900">
                        Step 1: Legal Entity &amp; Company Registration
                      </CardTitle>
                      <Badge className="shrink-0 text-[10px] font-medium border-slate-200 bg-emerald-50 text-emerald-800">
                        {normalizedCountry === 'IE' ? 'CRO (Ireland)' : normalizedCountry === 'GB' ? 'Companies House (UK)' : 'Corporate Registry'}
                      </Badge>
                    </div>
                    <CardDescription className="mt-1 text-xs text-slate-600">
                      Determine whether you are operating as an incorporated entity (LTD/DAC) or sole trader. Mandatory for Irish LEO/EI grants and UK tax relief (SEIS).
                    </CardDescription>
                  </div>
                </div>
                {openStep !== 'ALL' && (
                  <Button size="sm" variant="ghost" onClick={() => setOpenStep(0)} className="text-xs text-slate-500 hover:bg-slate-100">
                    <span>Collapse Step</span>
                    <ChevronUp className="ml-1 h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-5">
              {/* Two-State Pill Selector */}
              <div>
                <Label className="text-xs font-semibold text-slate-700">Current Status of this Entity</Label>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setData({ ...data, step1: { ...data.step1, state: 'ALREADY_HAVE' } })}
                    className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
                      data.step1.state === 'ALREADY_HAVE'
                        ? 'border-emerald-700 bg-slate-50 ring-1 ring-emerald-700'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="mt-0.5 rounded-full p-1 bg-emerald-100 text-emerald-700">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">I Already Have This Registered</div>
                      <div className="text-[11px] text-slate-500">I have a registered company number (CRO / Companies House CRN)</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setData({ ...data, step1: { ...data.step1, state: 'HELP_SETUP' } })}
                    className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
                      data.step1.state === 'HELP_SETUP'
                        ? 'border-emerald-700 bg-slate-50 ring-1 ring-emerald-700'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className={`mt-0.5 rounded-full p-1 ${hasActiveIncorporationOrder ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-emerald-800'}`}>
                      {hasActiveIncorporationOrder ? <Clock className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {hasActiveIncorporationOrder ? 'Setup In Progress (Paid Order)' : 'Help Me Set This Up'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {hasActiveIncorporationOrder
                          ? `Order dispatched to ${data.step1.incorporationOrder?.partnerName || 'Partner'} • Awaiting CRO/CRN`
                          : 'Guide me through incorporation options, timelines and official registrars'}
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* State A: Already Have This */}
              {data.step1.state === 'ALREADY_HAVE' ? (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/20 p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">Legal Entity Type</Label>
                      <select
                        value={data.step1.legalStructure}
                        onChange={(e) => setData({ ...data, step1: { ...data.step1, legalStructure: e.target.value as any } })}
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 shadow-2xs focus:border-emerald-600 focus:outline-hidden"
                      >
                        <option value="LTD">Private Limited Company (LTD)</option>
                        <option value="DAC">Designated Activity Company (DAC - IE)</option>
                        <option value="SOLE_TRADER">Sole Trader / Partnership</option>
                        <option value="LLP">Limited Liability Partnership (LLP - UK)</option>
                        <option value="OTHER">Other / Hybrid Structure</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs font-semibold text-slate-700">Official Registered Name</Label>
                      <Input
                        value={data.step1.registeredEntityName}
                        onChange={(e) => setData({ ...data, step1: { ...data.step1, registeredEntityName: e.target.value } })}
                        placeholder="e.g. Acme Innovations Technologies Limited"
                        className="text-xs"
                      />
                    </div>
                  </div>

                  {data.step1.legalStructure === 'OTHER' && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">Specify Custom Structure</Label>
                      <Input
                        value={data.step1.customLegalStructure || ''}
                        onChange={(e) => setData({ ...data, step1: { ...data.step1, customLegalStructure: e.target.value } })}
                        placeholder="e.g. Community Interest Company (CIC) or CLG"
                        className="text-xs"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">
                        {normalizedCountry === 'IE' ? 'CRO Registration Number' : 'Companies House Number (CRN)'}
                      </Label>
                      <Input
                        value={data.step1.registrationNumber}
                        onChange={(e) => setData({ ...data, step1: { ...data.step1, registrationNumber: e.target.value } })}
                        placeholder={normalizedCountry === 'IE' ? 'e.g. 712345' : 'e.g. 14598210'}
                        className="text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">Date of Incorporation</Label>
                      <Input
                        type="date"
                        value={data.step1.registrationDate}
                        onChange={(e) => setData({ ...data, step1: { ...data.step1, registrationDate: e.target.value } })}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  {data.step1.incorporationOrder && (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200/70 bg-emerald-50/60 px-3.5 py-2.5 text-xs text-emerald-900">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>
                          Incorporation fulfilled via <strong>{data.step1.incorporationOrder.partnerName}</strong> • Stripe Ref: <span className="font-mono text-[11px] font-semibold">{data.step1.incorporationOrder.stripePaymentRef}</span>
                        </span>
                      </div>
                      <span className="font-semibold text-emerald-700">
                        {data.step1.incorporationOrder.currency === 'GBP' ? '£' : '€'}
                        {data.step1.incorporationOrder.totalPaidAmount} Paid
                      </span>
                    </div>
                  )}
                </div>
              ) : hasActiveIncorporationOrder && data.step1.incorporationOrder ? (
                /* State B1: Formation Order In Progress (Clutter Removed) */
                <div className="space-y-4">
                  <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50/80 via-white to-orange-50/30 p-5 shadow-xs space-y-4">
                    {/* Header Banner */}
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-amber-200/70 pb-3.5">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="bg-amber-600 hover:bg-amber-600 text-[10px] font-bold text-white flex items-center gap-1.5 shadow-2xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                            Setup In Progress
                          </Badge>
                          <Badge
                            variant="outline"
                            className="border-amber-300 bg-white font-mono text-[10px] text-amber-900"
                          >
                            Stripe Ref: {data.step1.incorporationOrder.stripePaymentRef}
                          </Badge>
                        </div>
                        <h3 className="text-base font-bold text-slate-900">
                          Company Formation Dispatched to {data.step1.incorporationOrder.partnerName}
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Your filing dossier has been emailed to the formation desk. Once your Certificate of Incorporation is issued by the registrar, enter your official number below to complete this setup pillar.
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-extrabold text-slate-900">
                          {data.step1.incorporationOrder.currency === 'GBP' ? '£' : '€'}
                          {data.step1.incorporationOrder.totalPaidAmount} Paid
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {new Date(data.step1.incorporationOrder.paidAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Order Snapshot Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="rounded-xl border border-slate-200/90 bg-white/90 p-3 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">1st Choice Company Name</span>
                        <div className="mt-0.5 truncate text-xs font-bold text-slate-900">
                          {data.step1.incorporationOrder.companyChoice1}
                        </div>
                        {data.step1.incorporationOrder.companyChoice2 && (
                          <div className="mt-0.5 truncate text-[11px] text-slate-500">
                            Backup: {data.step1.incorporationOrder.companyChoice2}
                          </div>
                        )}
                      </div>

                      <div className="rounded-xl border border-slate-200/90 bg-white/90 p-3 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Formation Desk</span>
                        <div className="mt-0.5 truncate text-xs font-bold text-slate-900">
                          {data.step1.incorporationOrder.partnerName}
                        </div>
                        <div className="mt-0.5 truncate font-mono text-[11px] text-emerald-800">
                          {data.step1.incorporationOrder.recipientEmail}
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200/90 bg-white/90 p-3 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Applicant Contact</span>
                        <div className="mt-0.5 truncate text-xs font-bold text-slate-900">
                          {data.step1.incorporationOrder.founderName}
                        </div>
                        <div className="mt-0.5 truncate font-mono text-[11px] text-slate-500">
                          {data.step1.incorporationOrder.founderEmail}
                        </div>
                      </div>
                    </div>

                    {/* 3-Stage Visual Progress Tracker */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                      {/* Stage 1: Payment */}
                      <div className="rounded-xl border border-emerald-200 bg-white p-3.5 space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                            Stage 1 • Payment
                          </span>
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        </div>
                        <div className="text-xs font-bold text-slate-900">
                          Stripe Payment Confirmed
                        </div>
                        <p className="text-[11px] text-slate-600 leading-snug">
                          {data.step1.incorporationOrder.currency === 'GBP' ? '£' : '€'}
                          {data.step1.incorporationOrder.totalPaidAmount} paid in full. Confirmation email sent to your inbox.
                        </p>
                      </div>

                      {/* Stage 2: Partner Filing */}
                      <div className="rounded-xl border border-emerald-200 bg-white p-3.5 space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                            Stage 2 • Filing Desk
                          </span>
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        </div>
                        <div className="text-xs font-bold text-slate-900">
                          Dossier Dispatched
                        </div>
                        <p className="text-[11px] text-slate-600 leading-snug">
                          Emailed to {data.step1.incorporationOrder.partnerName} desk (CC: {data.step1.incorporationOrder.founderEmail}).
                        </p>
                      </div>

                      {/* Stage 3: Registry Number */}
                      <div className="rounded-xl border-2 border-emerald-400 bg-emerald-50/70 p-3.5 space-y-2 shadow-2xs ring-1 ring-emerald-200">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                            Stage 3 • Official CRN
                          </span>
                          <Clock className="h-4 w-4 text-emerald-700 shrink-0" />
                        </div>
                        <div className="text-xs font-bold text-slate-900">
                          Awaiting Registry CRN
                        </div>
                        <p className="text-[11px] text-slate-600 leading-snug">
                          {normalizedCountry === 'IE'
                            ? 'CRO turnaround is typically 3–5 working days.'
                            : 'Companies House turnaround is typically 24–48 hours.'}
                        </p>
                      </div>
                    </div>

                    {/* Stage 3 Action Form: Record Official CRN */}
                    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3.5">
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 rounded-lg bg-slate-100 p-1.5 text-emerald-800 shrink-0">
                          <FileCheck2 className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">
                            Received your Certificate of Incorporation? Record your CRN to finalize
                          </h4>
                          <p className="text-[11px] text-slate-600">
                            Once {data.step1.incorporationOrder.partnerName} emails your certificate, enter your official registered name and company number below:
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[11px] font-semibold text-slate-700">Registered Company Name</Label>
                          <Input
                            value={data.step1.registeredEntityName || data.step1.incorporationOrder.companyChoice1}
                            onChange={(e) =>
                              setData({
                                ...data,
                                step1: { ...data.step1, registeredEntityName: e.target.value },
                              })
                            }
                            placeholder="e.g. Build My Unicorn Limited"
                            className="h-8 bg-white text-base sm:text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px] font-semibold text-slate-700">
                            {normalizedCountry === 'IE' ? 'CRO Number' : 'Companies House CRN'}
                          </Label>
                          <Input
                            value={data.step1.registrationNumber}
                            onChange={(e) =>
                              setData({
                                ...data,
                                step1: { ...data.step1, registrationNumber: e.target.value },
                              })
                            }
                            placeholder={normalizedCountry === 'IE' ? 'e.g. 748291' : 'e.g. 15293841'}
                            className="h-8 bg-white font-mono text-base sm:text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px] font-semibold text-slate-700">Incorporation Date</Label>
                          <Input
                            type="date"
                            value={data.step1.registrationDate || new Date().toISOString().slice(0, 10)}
                            onChange={(e) =>
                              setData({
                                ...data,
                                step1: { ...data.step1, registrationDate: e.target.value },
                              })
                            }
                            className="h-8 bg-white text-base sm:text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                        <span className="text-[11px] text-slate-500">
                          Entering your registration number marks Pillar 1 complete and updates your Operations Readiness score.
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          disabled={!data.step1.registrationNumber.trim()}
                          onClick={() => {
                            const entityName =
                              data.step1.registeredEntityName.trim() ||
                              data.step1.incorporationOrder?.companyChoice1 ||
                              plan.title ||
                              'Registered LTD';
                            const regDate =
                              data.step1.registrationDate ||
                              new Date().toISOString().slice(0, 10);
                            setData({
                              ...data,
                              step1: {
                                ...data.step1,
                                state: 'ALREADY_HAVE',
                                legalStructure: 'LTD',
                                registeredEntityName: entityName,
                                registrationDate: regDate,
                              },
                            });
                          }}
                          className="h-8 bg-emerald-600 hover:bg-emerald-700 text-[11px] font-bold text-white shadow-xs"
                        >
                          <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
                          Complete Incorporation &amp; Mark Pillar Done
                        </Button>
                      </div>
                    </div>

                    {/* Manual Switch Option */}
                    <div className="flex items-center justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            typeof window !== 'undefined' &&
                            window.confirm(
                              'Switch to manual entity registration details? Your paid order history will remain preserved on file.'
                            )
                          ) {
                            setData({
                              ...data,
                              step1: {
                                ...data.step1,
                                state: 'ALREADY_HAVE',
                              },
                            });
                          }
                        }}
                        className="text-[11px] text-slate-400 hover:text-slate-600 underline decoration-dotted"
                      >
                        Switch to manual details entry
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* State B2: Standard Help Me Set This Up (Before Placing Order) */
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-amber-600" />
                      <h4 className="text-xs font-bold text-slate-900">Should You Form a Limited Company Now?</h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      For software, tech and high-potential startups in Ireland and the UK, a <strong>Private Limited Company (LTD)</strong> is virtually required before signing commercial contracts, granting employee equity, or applying for State Grants (LEO Priming / Enterprise Ireland PSSF / Innovate UK).
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                      <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                        <div className="text-[11px] font-bold text-slate-800">Direct Cost</div>
                        <div className="text-xs text-slate-600">€50 (CRO Core, IE) / £50 (Companies House, UK)</div>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                        <div className="text-[11px] font-bold text-slate-800">Turnaround</div>
                        <div className="text-xs text-slate-600">24–48 hours in the UK; 3–5 working days in Ireland</div>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                        <div className="text-[11px] font-bold text-slate-800">Grant Prerequisite</div>
                        <div className="text-xs text-emerald-700 font-medium">Unlocks SEIS/EIS, LEO Priming &amp; EI Funds</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Planned Formation Timeline</Label>
                    <select
                      value={data.step1.targetFormationTimeline}
                      onChange={(e) => setData({ ...data, step1: { ...data.step1, targetFormationTimeline: e.target.value } })}
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 shadow-2xs focus:border-emerald-600 focus:outline-hidden"
                    >
                      <option value="IMMEDIATELY">Immediately (Next 7 days)</option>
                      <option value="WITHIN_30_DAYS">Within the next 30 days</option>
                      <option value="AFTER_VALIDATION">Only after completing customer waitlist validation (Module C)</option>
                      <option value="UPON_GRANT_AWARD">Upon receiving formal grant or investor term sheet</option>
                    </select>
                  </div>

                  {/* Partner Slot Hook */}
                  <PartnerSlot
                    slot="OPS_STEP_1_INCORPORATION"
                    countryCode={normalizedCountry}
                    projectId={plan.id}
                    planTitle={data.step1.registeredEntityName || plan.title || plan.name}
                    oneLinerSummary={plan.oneLinerSummary || plan.elevatorPitch}
                    founderEmail={data.step2.officialBusinessEmail}
                    title="Recommended Incorporation Registrars & Formation Concierges"
                    description="Pay a fixed package price via Stripe, complete our 60-second formation questionnaire, and we automatically dispatch your paid incorporation order to our vetted partner desk."
                    onPaidConciergeOrderSubmitted={(orderSummary) => {
                      setData((prev) => ({
                        ...prev,
                        step1: {
                          ...prev.step1,
                          registeredEntityName:
                            prev.step1.registeredEntityName.trim() ||
                            orderSummary.companyChoice1,
                          incorporationOrder: orderSummary,
                        },
                      }));
                    }}
                  />
                </div>
              )}

              {/* Bottom Step Bar */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-[11px] text-slate-500">
                  {isStep1Done ? '✅ Legal registration status recorded' : '⚠️ Action needed to complete legal setup'}
                </span>
                <Button
                  size="sm"
                  onClick={() => {
                    setOpenStep(2);
                    const el = document.getElementById('mod-g-step-2');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-emerald-700 hover:bg-emerald-800 text-xs"
                >
                  <span>Next: Domain &amp; Official Email</span>
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* ========================================================================= */}
      {/* STEP 2: DOMAIN, OFFICIAL EMAIL & DIGITAL BRAND */}
      {/* ========================================================================= */}
      <section id="mod-g-step-2" className="scroll-mt-24">
        {openStep !== 'ALL' && openStep !== 2 ? (
          <div
            onClick={() => setOpenStep(2)}
            className="group scroll-mt-24 cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-emerald-300 hover:shadow-sm"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    isStep2Done ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'
                  }`}
                >
                  {isStep2Done ? <Check className="h-4 w-4" /> : '2'}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-sm font-bold text-slate-900 group-hover:text-emerald-800">
                    Step 2: Domain, Official Email &amp; Digital Brand
                  </h2>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {data.step2.primaryDomain ? `${data.step2.primaryDomain} • ${data.step2.officialBusinessEmail || 'Email pending'}` : 'Check domain availability & configure official email'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant="outline"
                  className={
                    isStep2Done
                      ? 'border-emerald-300 bg-emerald-50 text-[10px] text-emerald-800'
                      : 'border-slate-300 text-[10px] text-slate-600'
                  }
                >
                  {isStep2Done ? 'Configured' : 'Needs Setup'}
                </Badge>
                <Button size="sm" variant="ghost" className="h-8 shrink-0 px-2.5 text-xs font-medium text-emerald-700 group-hover:bg-emerald-50">
                  <span>{isStep2Done ? 'Edit Step' : 'Open Step'}</span>
                  <ChevronDown className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Card className="rounded-xl border border-slate-200 bg-white shadow-xs">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                      isStep2Done ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'
                    }`}
                  >
                    {isStep2Done ? <Check className="h-4 w-4" /> : '2'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base font-bold text-slate-900">
                      Step 2: Domain, Official Email &amp; Digital Brand
                    </CardTitle>
                    <CardDescription className="mt-1 text-xs text-slate-600">
                      Check live domain availability inside Startup Preflight, claim your `.ie`, `.co.uk`, or `.com` via an accredited registrar partner, and save your chosen domain back into your plan.
                    </CardDescription>
                  </div>
                </div>
                {openStep !== 'ALL' && (
                  <Button size="sm" variant="ghost" onClick={() => setOpenStep(0)} className="text-xs text-slate-500 hover:bg-slate-100">
                    <span>Collapse Step</span>
                    <ChevronUp className="ml-1 h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              {/* 4-Layer Support Strip */}
              <div className="mt-3 flex flex-wrap items-center gap-2 pt-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveWhyCard((prev) => (prev === 2 ? null : 2))}
                  className="h-7 border-slate-200 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                >
                  <HelpCircle className="mr-1 h-3.5 w-3.5" />
                  Why Are We Asking This?
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveExampleCard((prev) => (prev === 2 ? null : 2))}
                  className="h-7 border-emerald-200 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50"
                >
                  <Lightbulb className="mr-1 h-3.5 w-3.5" />
                  Show Me an Example
                </Button>
              </div>

              {activeWhyCard === 2 && (
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-900">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="font-bold">Why Grant Assessors Check Your Domain &amp; Email First</div>
                      <p className="text-emerald-900 leading-relaxed">
                        Irish LEO Evaluation Committees, Enterprise Ireland, and UK Start Up Loans underwriters verify that your domain is registered and your application email is on a custom corporate domain (`founder@company.ie` or `.co.uk`) rather than a generic `@gmail.com` inbox.
                      </p>
                    </div>
                    <button type="button" onClick={() => setActiveWhyCard(null)} className="text-emerald-700 hover:text-emerald-900">
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {activeExampleCard === 2 && (
                <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/70 p-3.5 text-xs text-emerald-950">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="font-bold">Example Best-Practice Setup</div>
                      <p className="text-emerald-900 leading-relaxed">
                        <strong>Primary Domain:</strong> `kildarerobotics.ie` (or `.co.uk` + `.com` defensive redirect) • <strong>Official Email:</strong> `sarah@kildarerobotics.ie` hosted on Google Workspace Business Starter (€6/mo) with SPF/DKIM enabled.
                      </p>
                    </div>
                    <button type="button" onClick={() => setActiveExampleCard(null)} className="text-emerald-600 hover:text-emerald-900">
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6 pt-5">
              {/* Two-State Pill Selector */}
              <div>
                <Label className="text-xs font-semibold text-slate-700">Domain &amp; Business Email Status</Label>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setData({ ...data, step2: { ...data.step2, state: 'ALREADY_HAVE' } })}
                    className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
                      data.step2.state === 'ALREADY_HAVE'
                        ? 'border-emerald-700 bg-slate-50 ring-1 ring-emerald-700'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="mt-0.5 rounded-full p-1 bg-emerald-100 text-emerald-700">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">I Already Own My Domain</div>
                      <div className="text-[11px] text-slate-500">Record my registered domain &amp; official `@company` email</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setData({ ...data, step2: { ...data.step2, state: 'HELP_SETUP' } })}
                    className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
                      data.step2.state === 'HELP_SETUP'
                        ? 'border-emerald-700 bg-slate-50 ring-1 ring-emerald-700'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="mt-0.5 rounded-full p-1 bg-slate-100 text-emerald-800">
                      <Globe className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Check Domain Availability &amp; Claim</div>
                      <div className="text-[11px] text-slate-500">Test `.ie`, `.co.uk`, `.com` &amp; `.io` availability, claim via partner &amp; save back</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Consumer Gmail Warning Alert */}
              {isGmailDetected && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <div className="font-bold">Consumer Email Detected (@gmail.com / @hotmail.com)</div>
                    <p className="text-amber-800">
                      State grant bodies (such as Irish LEO &amp; Enterprise Ireland) and institutional investors heavily penalize founders who apply with free webmail. Setting up a dedicated `@yourcompany.com` inbox on Google Workspace or Microsoft 365 signals instant professionalism.
                    </p>
                  </div>
                </div>
              )}

              {/* =============================================================== */}
              {/* 3-STAGE LIVE DOMAIN CHECKER -> CLAIM VIA PARTNER -> SAVE BACK */}
              {/* =============================================================== */}
              <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-slate-50 via-white to-slate-50/30 p-4 sm:p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-emerald-800">
                      <Globe className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Stage 1: Live Domain Availability Checker (.ie / .co.uk / .com / .io)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Search your startup name below, select an available extension, claim it with a registrar partner, and save it to your plan.
                      </p>
                    </div>
                  </div>
                  <Badge className="border-slate-200 bg-emerald-50 text-[10px] text-emerald-800">
                    Live DNS Lookup
                  </Badge>
                </div>

                {/* Search Bar */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Input
                      value={domainSearchInput}
                      onChange={(e) => setDomainSearchInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCheckDomainAvailability();
                        }
                      }}
                      placeholder="Enter desired brand or company name (e.g. startuppreflight)"
                      className="bg-white text-base sm:text-xs pr-24"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400">
                      .ie / .co.uk / .com
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    disabled={isCheckingDomains || domainSearchInput.trim().length < 2}
                    onClick={() => handleCheckDomainAvailability()}
                    className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-xs font-semibold text-white shrink-0"
                  >
                    {isCheckingDomains ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        <span>Checking DNS...</span>
                      </>
                    ) : (
                      <>
                        <Search className="mr-1.5 h-3.5 w-3.5" />
                        <span>Check Availability</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* Live Results Grid */}
                {domainCheckResults.length > 0 && (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      {domainCheckResults.map((item) => {
                        const isAvailable =
                          item.status === 'AVAILABLE' || item.available === true;
                        const isSelected = selectedDomainForClaim === item.domain;
                        const reasonText =
                          item.reason ||
                          item.notes ||
                          (isAvailable
                            ? 'Available to claim'
                            : 'Active DNS records detected (Already registered)');
                        return (
                          <div
                            key={item.domain}
                            onClick={() => {
                              setSelectedDomainForClaim(item.domain);
                            }}
                            className={`cursor-pointer rounded-xl border p-3 transition-all flex flex-col justify-between gap-2 ${
                              isSelected
                                ? 'border-emerald-700 bg-emerald-50/70 ring-1 ring-emerald-700 shadow-xs'
                                : isAvailable
                                  ? 'border-emerald-200 bg-white hover:border-emerald-300'
                                  : 'border-slate-200 bg-slate-50/70 opacity-80'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-mono text-xs font-bold text-slate-900 truncate">
                                  {item.domain}
                                </span>
                                <Badge
                                  className={`shrink-0 text-[10px] ${
                                    isAvailable
                                      ? 'border-emerald-300 bg-emerald-100 text-emerald-800'
                                      : 'border-slate-300 bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  {isAvailable ? 'Available' : 'Registered'}
                                </Badge>
                              </div>
                              <p className="mt-1 text-[10px] text-slate-500 leading-snug">
                                {reasonText}
                              </p>
                            </div>

                            <div className="pt-1">
                              {isAvailable ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={isSelected ? 'default' : 'outline'}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDomainForClaim(item.domain);
                                  }}
                                  className={`w-full h-7 text-[11px] font-semibold ${
                                    isSelected
                                      ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                                      : 'border-slate-200 text-emerald-800 hover:bg-emerald-50'
                                  }`}
                                >
                                  {isSelected ? (
                                    <>
                                      <Check className="mr-1 h-3 w-3" />
                                      <span>Selected to Claim</span>
                                    </>
                                  ) : (
                                    <span>Select Domain</span>
                                  )}
                                </Button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleConfirmAndSaveClaimedDomain(item.domain);
                                  }}
                                  className="w-full text-left text-[10px] font-medium text-emerald-700 hover:underline"
                                >
                                  Already yours? Save to plan →
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Stage 2 & Stage 3: Claim on Registrar & Save Back to Plan */}
                    {selectedDomainForClaim && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-600 text-white text-[10px]">
                              Stage 2 &amp; 3
                            </Badge>
                            <span className="text-xs font-bold text-slate-900">
                              Target Domain:{' '}
                              <span className="font-mono text-emerald-800">
                                {selectedDomainForClaim}
                              </span>
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600">
                            1) Click a partner registrar below to claim <strong className="font-mono">{selectedDomainForClaim}</strong>, then 2) click <strong>Confirm &amp; Save Domain to Plan</strong> to lock it into your business plan.
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() =>
                            handleConfirmAndSaveClaimedDomain(selectedDomainForClaim)
                          }
                          className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white shrink-0"
                        >
                          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                          <span>Confirm &amp; Save {selectedDomainForClaim} to Plan</span>
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {domainSavedConfirmation && (
                  <div className="rounded-xl border border-emerald-300 bg-emerald-100/80 px-3.5 py-2.5 text-xs font-medium text-emerald-950 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
                    <span>
                      Saved <strong>{domainSavedConfirmation}</strong> as your official Primary Domain and updated your plan!
                    </span>
                  </div>
                )}
              </div>

              {/* Form Inputs (Saved Back Into Plan) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Confirmed Primary Domain Name (Saved in Plan)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={data.step2.primaryDomain}
                      onChange={(e) => {
                        const val = e.target.value;
                        setData({
                          ...data,
                          step2: { ...data.step2, primaryDomain: val },
                        });
                        setSelectedDomainForClaim(val);
                      }}
                      placeholder={
                        normalizedCountry === 'IE' ? 'mycompany.ie' : 'mycompany.co.uk'
                      }
                      className="text-base sm:text-xs font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Recommended TLDs:{' '}
                    {normalizedCountry === 'IE'
                      ? '.ie (requires CRO or proof of Irish connection)'
                      : '.co.uk'}{' '}
                    or .com
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Official Founder / Contact Email
                  </Label>
                  <Input
                    value={data.step2.officialBusinessEmail}
                    onChange={(e) =>
                      setData({
                        ...data,
                        step2: { ...data.step2, officialBusinessEmail: e.target.value },
                      })
                    }
                    placeholder={
                      data.step2.primaryDomain
                        ? `founder@${data.step2.primaryDomain}`
                        : 'founder@yourcompany.com'
                    }
                    className="text-base sm:text-xs"
                  />
                  <p className="text-[11px] text-slate-500">
                    Must be on your company domain for institutional &amp; grant credibility
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Business Email &amp; Workspace Platform
                  </Label>
                  <select
                    value={data.step2.emailProvider}
                    onChange={(e) =>
                      setData({
                        ...data,
                        step2: { ...data.step2, emailProvider: e.target.value as any },
                      })
                    }
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-base sm:text-xs text-slate-900 shadow-2xs focus:border-emerald-600 focus:outline-hidden"
                  >
                    <option value="GOOGLE_WORKSPACE">
                      Google Workspace (Gmail, Drive, Meet)
                    </option>
                    <option value="MICROSOFT_365">
                      Microsoft 365 (Outlook, Teams, OneDrive)
                    </option>
                    <option value="HOSTING_MAIL">cPanel / Custom Host Webmail</option>
                    <option value="OTHER">Other Custom Email Solution</option>
                  </select>
                </div>

                <div className="space-y-1.5 flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 pb-2">
                    <input
                      type="checkbox"
                      checked={data.step2.isDomainLive}
                      onChange={(e) =>
                        setData({
                          ...data,
                          step2: { ...data.step2, isDomainLive: e.target.checked },
                        })
                      }
                      className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-700"
                    />
                    <span>Domain is already purchased &amp; live online</span>
                  </label>
                </div>
              </div>

              {data.step2.emailProvider === 'OTHER' && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Specify Custom Email Provider
                  </Label>
                  <Input
                    value={data.step2.customEmailProvider || ''}
                    onChange={(e) =>
                      setData({
                        ...data,
                        step2: { ...data.step2, customEmailProvider: e.target.value },
                      })
                    }
                    placeholder="e.g. ProtonMail Business, Fastmail, Zoho Mail"
                    className="text-base sm:text-xs"
                  />
                </div>
              )}

              {/* Partner Slots (Pass selectedDomain so {domain} macro resolves dynamically) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PartnerSlot
                  slot="OPS_STEP_2_DOMAIN"
                  countryCode={normalizedCountry}
                  projectId={plan.id}
                  planTitle={data.step1.registeredEntityName || plan.title || plan.name}
                  oneLinerSummary={plan.oneLinerSummary || plan.elevatorPitch}
                  founderEmail={data.step2.officialBusinessEmail}
                  selectedDomain={selectedDomainForClaim || data.step2.primaryDomain}
                  title={
                    selectedDomainForClaim
                      ? `Claim "${selectedDomainForClaim}" with a Registrar Partner`
                      : 'Domain Registrars (.ie / .co.uk / .com)'
                  }
                  compact
                />
                <PartnerSlot
                  slot="OPS_STEP_2_EMAIL"
                  countryCode={normalizedCountry}
                  projectId={plan.id}
                  planTitle={data.step1.registeredEntityName || plan.title || plan.name}
                  oneLinerSummary={plan.oneLinerSummary || plan.elevatorPitch}
                  founderEmail={data.step2.officialBusinessEmail}
                  selectedDomain={selectedDomainForClaim || data.step2.primaryDomain}
                  title="Official @company Business Email"
                  compact
                />
              </div>

              {/* Bottom Step Bar */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setOpenStep(1)}
                  className="text-xs text-slate-600"
                >
                  <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                  <span>Previous: Legal Entity</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setOpenStep(3);
                    const el = document.getElementById('mod-g-step-3');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-emerald-700 hover:bg-emerald-800 text-xs"
                >
                  <span>Next: Business Banking</span>
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* ========================================================================= */}
      {/* STEP 3: DEDICATED BUSINESS BANK ACCOUNT */}
      {/* ========================================================================= */}
      <section id="mod-g-step-3" className="scroll-mt-24">
        {openStep !== 'ALL' && openStep !== 3 ? (
          <div
            onClick={() => setOpenStep(3)}
            className="group scroll-mt-24 cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-emerald-300 hover:shadow-sm"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    isStep3Done ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'
                  }`}
                >
                  {isStep3Done ? <Check className="h-4 w-4" /> : '3'}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-sm font-bold text-slate-900 group-hover:text-emerald-800">
                    Step 3: Dedicated Business Bank Account
                  </h2>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {data.step3.state === 'ALREADY_HAVE'
                      ? `${data.step3.bankProvider.replace(/_/g, ' ')} • Dedicated Account Active`
                      : `Setting Up • Timeline: ${data.step3.targetOpeningTimeline.replace(/_/g, ' ')}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant="outline"
                  className={
                    isStep3Done
                      ? 'border-emerald-300 bg-emerald-50 text-[10px] text-emerald-800'
                      : 'border-slate-300 text-[10px] text-slate-600'
                  }
                >
                  {isStep3Done ? 'Configured' : 'Needs Setup'}
                </Badge>
                <Button size="sm" variant="ghost" className="h-8 shrink-0 px-2.5 text-xs font-medium text-emerald-700 group-hover:bg-emerald-50">
                  <span>Edit Step</span>
                  <ChevronDown className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Card className="rounded-xl border border-slate-200 bg-white shadow-xs">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                      isStep3Done ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'
                    }`}
                  >
                    {isStep3Done ? <Check className="h-4 w-4" /> : '3'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base font-bold text-slate-900">
                      Step 3: Dedicated Business Bank Account
                    </CardTitle>
                    <CardDescription className="mt-1 text-xs text-slate-600">
                      Separate your personal finances from the corporate entity. Required for receiving grant vouchers, VAT refunds, and equity investment.
                    </CardDescription>
                  </div>
                </div>
                {openStep !== 'ALL' && (
                  <Button size="sm" variant="ghost" onClick={() => setOpenStep(0)} className="text-xs text-slate-500 hover:bg-slate-100">
                    <span>Collapse Step</span>
                    <ChevronUp className="ml-1 h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-5">
              {/* Two-State Pill Selector */}
              <div>
                <Label className="text-xs font-semibold text-slate-700">Bank Account Setup Status</Label>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setData({ ...data, step3: { ...data.step3, state: 'ALREADY_HAVE' } })}
                    className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
                      data.step3.state === 'ALREADY_HAVE'
                        ? 'border-emerald-700 bg-slate-50 ring-1 ring-emerald-700'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="mt-0.5 rounded-full p-1 bg-emerald-100 text-emerald-700">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">I Have an Active Business Account</div>
                      <div className="text-[11px] text-slate-500">Dedicated IBAN / Account in the registered business name</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setData({ ...data, step3: { ...data.step3, state: 'HELP_SETUP' } })}
                    className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
                      data.step3.state === 'HELP_SETUP'
                        ? 'border-emerald-700 bg-slate-50 ring-1 ring-emerald-700'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="mt-0.5 rounded-full p-1 bg-slate-100 text-emerald-800">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Help Me Choose &amp; Open One</div>
                      <div className="text-[11px] text-slate-500">Compare digital neobanks (fast setup) vs. traditional high-street lenders</div>
                    </div>
                  </button>
                </div>
              </div>

              {data.step3.state === 'ALREADY_HAVE' ? (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/20 p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs font-semibold text-slate-700">Banking Provider</Label>
                      <select
                        value={data.step3.bankProvider}
                        onChange={(e) => setData({ ...data, step3: { ...data.step3, bankProvider: e.target.value as any } })}
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 shadow-2xs focus:border-emerald-600 focus:outline-hidden"
                      >
                        <option value="REVOLUT_BUSINESS">Revolut Business</option>
                        <option value="AIB">AIB (Allied Irish Banks)</option>
                        <option value="BANK_OF_IRELAND">Bank of Ireland</option>
                        <option value="BARCLAYS">Barclays UK</option>
                        <option value="TIDE">Tide Business</option>
                        <option value="MONZO">Monzo Business</option>
                        <option value="OTHER">Other Institution</option>
                      </select>
                      {data.step3.bankProvider === 'OTHER' && (
                        <Input
                          value={data.step3.customBankProvider || ''}
                          onChange={(e) => setData({ ...data, step3: { ...data.step3, customBankProvider: e.target.value } })}
                          placeholder="Specify bank or financial institution name..."
                          className="mt-2 text-base sm:text-xs"
                        />
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">IBAN / Account (Last 4 Digits)</Label>
                      <Input
                        value={data.step3.ibanLast4}
                        onChange={(e) => setData({ ...data, step3: { ...data.step3, ibanLast4: e.target.value } })}
                        placeholder="e.g. 4812"
                        maxLength={4}
                        className="text-base sm:text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="hasDedicatedIbanCheck"
                      checked={data.step3.hasDedicatedIban}
                      onChange={(e) => setData({ ...data, step3: { ...data.step3, hasDedicatedIban: e.target.checked } })}
                      className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-700"
                    />
                    <label htmlFor="hasDedicatedIbanCheck" className="text-xs font-medium text-slate-700 cursor-pointer">
                      Confirm this account is exclusively held in the business name (not personal)
                    </label>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>⚡</span> Option A: Fast-Track Digital Neobanks
                      </h4>
                      <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">
                        Revolut Business &amp; Tide can be approved within 24–48 hours entirely on mobile/web. Ideal for immediate trading, software subscriptions, and international transfers with minimal paperwork.
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>🏛️</span> Option B: Traditional Commercial Pillar Banks
                      </h4>
                      <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">
                        AIB, Bank of Ireland, and Barclays take 2–4 weeks to open, but provide dedicated commercial branch managers and direct integration with certain government loan schemes.
                      </p>
                    </div>
                  </div>

                  <PartnerSlot
                    slot="OPS_STEP_3_BANKING"
                    projectId={plan.id}
                    countryCode={normalizedCountry}
                    planTitle={data.step1.registeredEntityName || plan.title || plan.name}
                    oneLinerSummary={plan.oneLinerSummary || plan.elevatorPitch}
                    founderEmail={data.step2.officialBusinessEmail}
                    title="Vetted Business Banking Partners"
                    description="Open a business account with instant digital verification or fast-track startup fee waivers."
                  />
                </div>
              )}

              {/* Bottom Step Bar */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setOpenStep(2)}
                  className="text-xs text-slate-600"
                >
                  <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                  <span>Previous: Domain &amp; Email</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setOpenStep(4);
                    const el = document.getElementById('mod-g-step-4');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-emerald-700 hover:bg-emerald-800 text-xs"
                >
                  <span>Next: VAT &amp; Accounts</span>
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* ========================================================================= */}
      {/* STEP 4: BOOKKEEPING, VAT & PAYROLL INFRASTRUCTURE */}
      {/* ========================================================================= */}
      <section id="mod-g-step-4" className="scroll-mt-24">
        {openStep !== 'ALL' && openStep !== 4 ? (
          <div
            onClick={() => setOpenStep(4)}
            className="group scroll-mt-24 cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-emerald-300 hover:shadow-sm"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    isStep4Done ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'
                  }`}
                >
                  {isStep4Done ? <Check className="h-4 w-4" /> : '4'}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-sm font-bold text-slate-900 group-hover:text-emerald-800">
                    Step 4: Bookkeeping, VAT &amp; Payroll Infrastructure
                  </h2>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    Software: {data.step4.softwareChoice === 'OTHER' ? data.step4.customSoftwareChoice || 'Other' : data.step4.softwareChoice} • VAT: {data.step4.vatStatus.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant="outline"
                  className={
                    isStep4Done
                      ? 'border-emerald-300 bg-emerald-50 text-[10px] text-emerald-800'
                      : 'border-slate-300 text-[10px] text-slate-600'
                  }
                >
                  {isStep4Done ? 'Configured' : 'Needs Setup'}
                </Badge>
                <Button size="sm" variant="ghost" className="h-8 shrink-0 px-2.5 text-xs font-medium text-emerald-700 group-hover:bg-emerald-50">
                  <span>{isStep4Done ? 'Edit Step' : 'Open Step'}</span>
                  <ChevronDown className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Card className="rounded-xl border border-slate-200 bg-white shadow-xs">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                      isStep4Done ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'
                    }`}
                  >
                    {isStep4Done ? <Check className="h-4 w-4" /> : '4'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base font-bold text-slate-900">
                      Step 4: Bookkeeping, VAT &amp; Payroll Infrastructure
                    </CardTitle>
                    <CardDescription className="mt-1 text-xs text-slate-600">
                      Configure your cloud ledger and tax registration status early to avoid year-end compliance scrambles and ensure clean grant drawdown reporting.
                    </CardDescription>
                  </div>
                </div>
                {openStep !== 'ALL' && (
                  <Button size="sm" variant="ghost" onClick={() => setOpenStep(0)} className="text-xs text-slate-500 hover:bg-slate-100">
                    <span>Collapse Step</span>
                    <ChevronUp className="ml-1 h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Accounting / Bookkeeping Software</Label>
                  <select
                    value={data.step4.softwareChoice}
                    onChange={(e) => setData({ ...data, step4: { ...data.step4, softwareChoice: e.target.value as any } })}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-base sm:text-xs text-slate-900 shadow-2xs focus:border-emerald-600 focus:outline-hidden"
                  >
                    <option value="XERO">Xero (Recommended for sync &amp; multi-currency)</option>
                    <option value="QUICKBOOKS">QuickBooks Online</option>
                    <option value="SURF_ACCOUNTS">Surf Accounts (Popular in Ireland)</option>
                    <option value="EXCEL">Spreadsheet / Manual Ledger (Early Stage)</option>
                    <option value="OTHER">Other Accounting System</option>
                  </select>
                  {data.step4.softwareChoice === 'OTHER' && (
                    <Input
                      value={data.step4.customSoftwareChoice || ''}
                      onChange={(e) => setData({ ...data, step4: { ...data.step4, customSoftwareChoice: e.target.value } })}
                      placeholder="Specify accounting / bookkeeping software..."
                      className="mt-2 text-base sm:text-xs"
                    />
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">VAT Registration Status</Label>
                  <select
                    value={data.step4.vatStatus}
                    onChange={(e) => setData({ ...data, step4: { ...data.step4, vatStatus: e.target.value as any } })}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-base sm:text-xs text-slate-900 shadow-2xs focus:border-emerald-600 focus:outline-hidden"
                  >
                    <option value="NOT_REGISTERED">Not Registered (Under statutory turnover threshold)</option>
                    <option value="PLANNING_TO_REGISTER">Planning Voluntary Registration (To reclaim input VAT)</option>
                    <option value="REGISTERED">Active VAT Registration</option>
                  </select>
                  <p className="text-[11px] text-slate-500">
                    {normalizedCountry === 'IE'
                      ? 'Ireland: €40k services / €80k goods threshold'
                      : 'UK: £90,000 rolling 12-month taxable turnover threshold'}
                  </p>
                </div>
              </div>

              {/* External Accountant Checkbox */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Appointed Certified Accountant</h4>
                    <p className="text-[11px] text-slate-500">Do you have an external chartered accountant or tax advisor?</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={data.step4.hasAccountant}
                    onChange={(e) => setData({ ...data, step4: { ...data.step4, hasAccountant: e.target.checked } })}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-700"
                  />
                </div>

                {data.step4.hasAccountant && (
                  <div className="pt-2">
                    <Label className="text-xs font-semibold text-slate-700">Accountant / Firm Name</Label>
                    <Input
                      value={data.step4.accountantFirmName}
                      onChange={(e) => setData({ ...data, step4: { ...data.step4, accountantFirmName: e.target.value } })}
                      placeholder="e.g. Walsh &amp; Associates Chartered Accountants"
                      className="text-base sm:text-xs mt-1"
                    />
                  </div>
                )}
              </div>

              {/* Partner Slots */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PartnerSlot
                  slot="OPS_STEP_4_ACCOUNTING"
                  projectId={plan.id}
                  countryCode={normalizedCountry}
                  planTitle={data.step1.registeredEntityName || plan.title || plan.name}
                  oneLinerSummary={plan.oneLinerSummary || plan.elevatorPitch}
                  founderEmail={data.step2.officialBusinessEmail}
                  title="Accounting Software &amp; Perks"
                  compact
                />
                <PartnerSlot
                  slot="OPS_STEP_4_PAYROLL"
                  projectId={plan.id}
                  countryCode={normalizedCountry}
                  planTitle={data.step1.registeredEntityName || plan.title || plan.name}
                  oneLinerSummary={plan.oneLinerSummary || plan.elevatorPitch}
                  founderEmail={data.step2.officialBusinessEmail}
                  title="Payroll &amp; Tax Gateway"
                  compact
                />
              </div>

              {/* Bottom Step Bar */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setOpenStep(3)}
                  className="text-xs text-slate-600"
                >
                  <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                  <span>Previous: Banking</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setOpenStep(5);
                    const el = document.getElementById('mod-g-step-5');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-emerald-700 hover:bg-emerald-800 text-xs"
                >
                  <span>Next: Insurance</span>
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* ========================================================================= */}
      {/* STEP 5: STATUTORY STARTUP INSURANCE & RISK PROTECTION */}
      {/* ========================================================================= */}
      <section id="mod-g-step-5" className="scroll-mt-24">
        {openStep !== 'ALL' && openStep !== 5 ? (
          <div
            onClick={() => setOpenStep(5)}
            className="group scroll-mt-24 cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-emerald-300 hover:shadow-sm"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    isStep5Done ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'
                  }`}
                >
                  {isStep5Done ? <Check className="h-4 w-4" /> : '5'}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-sm font-bold text-slate-900 group-hover:text-emerald-800">
                    Step 5: Statutory Startup Insurance &amp; Risk Protection
                  </h2>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {data.step5.hasPublicLiability || data.step5.hasProfessionalIndemnity
                      ? 'Cover active (Public / PI Liability)'
                      : `Target: ${data.step5.targetCoverageTimeline.replace(/_/g, ' ')}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant="outline"
                  className={
                    isStep5Done
                      ? 'border-emerald-300 bg-emerald-50 text-[10px] text-emerald-800'
                      : 'border-slate-300 text-[10px] text-slate-600'
                  }
                >
                  {isStep5Done ? 'Configured' : 'Needs Setup'}
                </Badge>
                <Button size="sm" variant="ghost" className="h-8 shrink-0 px-2.5 text-xs font-medium text-emerald-700 group-hover:bg-emerald-50">
                  <span>{isStep5Done ? 'Edit Step' : 'Open Step'}</span>
                  <ChevronDown className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Card className="rounded-xl border border-slate-200 bg-white shadow-xs">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                      isStep5Done ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'
                    }`}
                  >
                    {isStep5Done ? <Check className="h-4 w-4" /> : '5'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base font-bold text-slate-900">
                      Step 5: Statutory Startup Insurance &amp; Risk Protection
                    </CardTitle>
                    <CardDescription className="mt-1 text-xs text-slate-600">
                      Protect against founder liability, client disputes, and statutory requirements before entering commercial contracts or office leases.
                    </CardDescription>
                  </div>
                </div>
                {openStep !== 'ALL' && (
                  <Button size="sm" variant="ghost" onClick={() => setOpenStep(0)} className="text-xs text-slate-500 hover:bg-slate-100">
                    <span>Collapse Step</span>
                    <ChevronUp className="ml-1 h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900">Essential Policy Types Checklist</h4>
                  <div className="space-y-2.5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={data.step5.hasPublicLiability}
                        onChange={(e) => setData({ ...data, step5: { ...data.step5, hasPublicLiability: e.target.checked } })}
                        className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-700"
                      />
                      <span><strong>Public Liability</strong> (Mandatory for physical premises / visitors)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={data.step5.hasEmployersLiability}
                        onChange={(e) => setData({ ...data, step5: { ...data.step5, hasEmployersLiability: e.target.checked } })}
                        className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-700"
                      />
                      <span><strong>Employer's Liability</strong> (Statutory when hiring staff)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={data.step5.hasProfessionalIndemnity}
                        onChange={(e) => setData({ ...data, step5: { ...data.step5, hasProfessionalIndemnity: e.target.checked } })}
                        className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-700"
                      />
                      <span><strong>Professional Indemnity</strong> (Crucial for SaaS, advice &amp; consulting)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={data.step5.hasProductLiability}
                        onChange={(e) => setData({ ...data, step5: { ...data.step5, hasProductLiability: e.target.checked } })}
                        className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-700"
                      />
                      <span><strong>Product Liability</strong> (For hardware, physical goods, or food)</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Target Coverage Timeline</Label>
                    <select
                      value={data.step5.targetCoverageTimeline}
                      onChange={(e) => setData({ ...data, step5: { ...data.step5, targetCoverageTimeline: e.target.value } })}
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-base sm:text-xs text-slate-900 shadow-2xs focus:border-emerald-600 focus:outline-hidden"
                    >
                      <option value="BEFORE_FIRST_SALE">Before launching first paid customer pilot</option>
                      <option value="BEFORE_FIRST_HIRE">Before hiring first employee</option>
                      <option value="COMMERCIAL_LEASE">When signing commercial lease</option>
                      <option value="ALREADY_ACTIVE">Policies currently active</option>
                    </select>
                  </div>

                  <PartnerSlot
                    slot="OPS_STEP_5_INSURANCE"
                    projectId={plan.id}
                    countryCode={normalizedCountry}
                    planTitle={data.step1.registeredEntityName || plan.title || plan.name}
                    oneLinerSummary={plan.oneLinerSummary || plan.elevatorPitch}
                    founderEmail={data.step2.officialBusinessEmail}
                    title="Startup Insurance Partners"
                    description="Get an instant digital policy binder tailored for high-growth tech and early-stage companies."
                    compact
                  />
                </div>
              </div>

              {/* Bottom Step Bar */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setOpenStep(4)}
                  className="text-xs text-slate-600"
                >
                  <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                  <span>Previous: VAT &amp; Accounts</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setOpenStep(6);
                    const el = document.getElementById('mod-g-step-6');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-emerald-700 hover:bg-emerald-800 text-xs"
                >
                  <span>Next: Legal &amp; IP</span>
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* ========================================================================= */}
      {/* STEP 6: BASELINE LEGAL, IP & GDPR ESSENTIALS */}
      {/* ========================================================================= */}
      <section id="mod-g-step-6" className="scroll-mt-24">
        {openStep !== 'ALL' && openStep !== 6 ? (
          <div
            onClick={() => setOpenStep(6)}
            className="group scroll-mt-24 cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-emerald-300 hover:shadow-sm"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    isStep6Done ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'
                  }`}
                >
                  {isStep6Done ? <Check className="h-4 w-4" /> : '6'}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-sm font-bold text-slate-900 group-hover:text-emerald-800">
                    Step 6: Baseline Legal, IP &amp; GDPR Essentials
                  </h2>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {data.step6.hasIpAssignmentSigned ? 'Founder IP Assignment Signed' : 'IP Assignment pending'} • GDPR: {data.step6.hasPrivacyPolicy ? 'Privacy policy live' : 'In setup'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant="outline"
                  className={
                    isStep6Done
                      ? 'border-emerald-300 bg-emerald-50 text-[10px] text-emerald-800'
                      : 'border-slate-300 text-[10px] text-slate-600'
                  }
                >
                  {isStep6Done ? 'Configured' : 'Needs Setup'}
                </Badge>
                <Button size="sm" variant="ghost" className="h-8 shrink-0 px-2.5 text-xs font-medium text-emerald-700 group-hover:bg-emerald-50">
                  <span>{isStep6Done ? 'Edit Step' : 'Open Step'}</span>
                  <ChevronDown className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Card className="rounded-xl border border-slate-200 bg-white shadow-xs">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                      isStep6Done ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'
                    }`}
                  >
                    {isStep6Done ? <Check className="h-4 w-4" /> : '6'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base font-bold text-slate-900">
                      Step 6: Baseline Legal, IP &amp; GDPR Essentials
                    </CardTitle>
                    <CardDescription className="mt-1 text-xs text-slate-600">
                      Secure intellectual property ownership, customer privacy policies, and non-disclosure standards to make the company diligence-ready.
                    </CardDescription>
                  </div>
                </div>
                {openStep !== 'ALL' && (
                  <Button size="sm" variant="ghost" onClick={() => setOpenStep(0)} className="text-xs text-slate-500 hover:bg-slate-100">
                    <span>Collapse Step</span>
                    <ChevronUp className="ml-1 h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-5">
              {/* Founder IP Assignment Callout */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-800" />
                  <h4 className="text-xs font-bold text-slate-950">
                    The #1 Diligence Showstopper: Founder IP Assignment
                  </h4>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Even if you are the sole creator, code, branding, and designs created before incorporation remain your <em>personal</em> property unless assigned in writing to the company. Enterprise Ireland, Innovate UK, and angels will halt term sheets if IP isn't formally assigned.
                </p>
                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-900">
                    <input
                      type="checkbox"
                      checked={data.step6.hasIpAssignmentSigned}
                      onChange={(e) => setData({ ...data, step6: { ...data.step6, hasIpAssignmentSigned: e.target.checked } })}
                      className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-700 h-4 w-4"
                    />
                    <span>Founder IP Assignment Agreement has been executed / is confirmed</span>
                  </label>
                </div>
              </div>

              {/* Legal Documentation Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900">Statutory Digital Documents</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={data.step6.hasPrivacyPolicy}
                        onChange={(e) => setData({ ...data, step6: { ...data.step6, hasPrivacyPolicy: e.target.checked } })}
                        className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-700"
                      />
                      <span>GDPR-Compliant Website Privacy Policy</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={data.step6.hasTermsOfService}
                        onChange={(e) => setData({ ...data, step6: { ...data.step6, hasTermsOfService: e.target.checked } })}
                        className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-700"
                      />
                      <span>Terms of Service / End-User License Agreement</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={data.step6.hasStandardNda}
                        onChange={(e) => setData({ ...data, step6: { ...data.step6, hasStandardNda: e.target.checked } })}
                        className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-700"
                      />
                      <span>Standard Mutual Non-Disclosure Agreement (NDA)</span>
                    </label>
                  </div>

                  {/* Micro-Coaching: Customer Service & Promised Reply Speed (SLA) */}
                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-[11px] text-slate-600">
                    <span className="font-semibold text-slate-800">
                      Promised Delivery &amp; Reply Speed (SLA):
                    </span>{' '}
                    SLA (Service Level Agreement) means how quickly you promise to deliver an order or reply when a customer has a problem. You can outline your support speed policy in your customer terms.
                  </div>
                </div>

                <div className="space-y-4">
                  <PartnerSlot
                    slot="OPS_STEP_6_LEGAL_IP"
                    projectId={plan.id}
                    countryCode={normalizedCountry}
                    planTitle={data.step1.registeredEntityName || plan.title || plan.name}
                    oneLinerSummary={plan.oneLinerSummary || plan.elevatorPitch}
                    founderEmail={data.step2.officialBusinessEmail}
                    title="Legal Suite &amp; IP Agreement Templates"
                    description="Access venture-standard contracts, IP assignment deed templates, and digital company secretarial tools."
                    compact
                  />
                </div>
              </div>

              {/* Bottom Step Bar */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setOpenStep(5)}
                  className="text-xs text-slate-600"
                >
                  <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                  <span>Previous: Insurance</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setOpenStep(7);
                    const el = document.getElementById('mod-g-step-7');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-emerald-700 hover:bg-emerald-800 text-xs"
                >
                  <span>Open Operations Readiness Brief</span>
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* ========================================================================= */}
      {/* STEP 7: FINAL OVERVIEW & OPERATIONS READINESS BRIEF */}
      {/* ========================================================================= */}
      <section id="mod-g-step-7" className="scroll-mt-24">
        {openStep !== 'ALL' && openStep !== 7 ? (
          <div
            onClick={() => setOpenStep(7)}
            className="group scroll-mt-24 cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-emerald-300 hover:shadow-sm"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    completedCoreStepsCount === 6 ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-sm font-bold text-slate-900 group-hover:text-emerald-800">
                    Module G Brief: Operations Readiness &amp; Launchpad Schedule
                  </h2>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    Readiness Score: {opsReadinessScore}% • {completedCoreStepsCount} of 6 Operational Pillars Resolved
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge className="shrink-0 text-[10px] font-medium border-emerald-300 bg-emerald-50 text-emerald-800">
                  {completedCoreStepsCount}/6 Pillars Ready
                </Badge>
                <Button size="sm" variant="ghost" className="h-8 shrink-0 px-2.5 text-xs font-medium text-emerald-700 group-hover:bg-emerald-50">
                  <span>Open Overview</span>
                  <ChevronDown className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-700" />
                  <h3 className="text-base font-bold text-slate-900">
                    Operations Readiness &amp; Launchpad Schedule
                  </h3>
                  <Badge className="text-[10px] font-medium border-emerald-300 bg-emerald-50 text-emerald-800">
                    Score: {opsReadinessScore}%
                  </Badge>
                </div>
                <p className="text-xs text-slate-600">
                  Executive overview of legal, banking, accounting, insurance and compliance pillars ready for export or grant appendix compilation.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyOperationsBrief}
                  className="text-xs bg-white text-slate-700"
                >
                  {isCopiedBrief ? (
                    <>
                      <CheckCheck className="mr-1 h-3.5 w-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1 h-3.5 w-3.5" />
                      <span>Copy Brief</span>
                    </>
                  )}
                </Button>
                {openStep !== 'ALL' && (
                  <Button size="sm" variant="ghost" onClick={() => setOpenStep(0)} className="text-xs text-slate-500 hover:bg-slate-100">
                    <span>Collapse Brief</span>
                    <ChevronUp className="ml-1 h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>

            {/* 6-Card Readiness Matrix Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {readinessChecks.map((check) => (
                <div
                  key={check.num}
                  className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500">Pillar {check.num}</span>
                    {check.done ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Ready
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
                        <Clock className="h-3 w-3 text-amber-500" /> Action Required
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-1">{check.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 truncate">
                    {check.state === 'ALREADY_HAVE' ? 'Registered & active' : 'Guided setup in progress'}
                  </p>
                </div>
              ))}
            </div>

            {/* Supportive "Things to Consider" Blind-Spot Review */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-700" />
                <h4 className="text-xs font-bold text-amber-950">
                  Constructive Blind-Spot Review ("Things to Consider")
                </h4>
              </div>
              <ul className="text-xs text-amber-900 space-y-1.5 list-disc pl-4">
                <li>
                  <strong>Grant Banking Invariant:</strong> Irish LEO and Enterprise Ireland grants are paid by electronic fund transfer directly into the applicant company's registered IBAN. Personal accounts are strictly non-compliant.
                </li>
                <li>
                  <strong>Director Residency:</strong> If incorporating in Ireland, at least one director must be an EEA resident (or you must hold an Irish Section 137 Non-Resident Director Bond).
                </li>
                <li>
                  <strong>Founder IP Assignment Date:</strong> Ensure your IP Assignment Agreement is dated immediately upon incorporation so any prior source code or trade secrets belong to the corporate entity.
                </li>
              </ul>
            </div>

            {/* Dark Footer Handoff Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-900 px-5 py-4 text-white shadow-md">
              <div>
                <h4 className="text-xs font-bold text-white">
                  Operational Foundations Configured
                </h4>
                <p className="text-[11px] text-slate-400">
                  Ready to move on to <strong>Module H: Selling, Sales Assumptions &amp; Pocket Profit</strong>?
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  if (!isVaultReadonly && onSave) {
                    onSave(data);
                  }
                  onContinueToModuleH?.();
                }}
                className="bg-emerald-700 hover:bg-emerald-800 text-xs font-semibold text-white shrink-0"
              >
                <span>Continue to Module H</span>
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
