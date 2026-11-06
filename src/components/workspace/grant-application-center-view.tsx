'use client';

import React, { useState, useMemo } from 'react';
import {
  Landmark,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  HelpCircle,
  Clock,
  Building2,
  FileText,
  Mail,
  Phone,
  Layers,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Plus,
  Loader2,
  BookmarkCheck,
  Paperclip,
  CheckSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type {
  ActiveStartupPlan,
  SavedCustomPortalQuestion,
  SavedGrantApplicationTracker,
  SavedGrantCenterData,
  GrantApplicationStatusType,
} from '@/lib/auth/session-store';
import {
  DETAILED_GRANT_PORTALS,
  IRELAND_LEO_OFFICES,
  type GrantPortalDetail,
  type LeoOfficeDirectoryItem,
} from '@/lib/grants/grant-directory';
import {
  evaluatePlanGrantReadiness,
  type EvaluatedGrantReadiness,
  type GrantReadinessChecklistItem,
} from '@/lib/grants/grant-readiness-evaluator';
import { answerQuestionFromStartupPlanAction } from '@/app/actions/grant-applications';
import { isGrantCheckerSupportedForCountry } from '@/lib/grants/module-a-grant-checker';

export interface GrantApplicationCenterViewProps {
  plan: ActiveStartupPlan;
  founderName?: string;
  selectedCountry?: string;
  isVaultReadonly?: boolean;
  onNavigateToModule: (
    moduleCode:
      | 'MOD_A_IDEATION'
      | 'MOD_B_MARKET'
      | 'MOD_C_SURVEYS_FEEDBACK'
      | 'MOD_D_PRODUCT_BUILD'
      | 'MOD_E_OPERATIONS'
      | 'MOD_F_COFOUNDER_TEAM'
      | 'MOD_G_LAUNCHPAD'
      | 'MOD_H_REVENUE'
      | 'MOD_I_MARKETING'
      | 'MOD_J_FINANCE'
      | 'MOD_K_GRANTS_FUNDING'
      | 'MOD_L_BUSINESS_PLAN',
    targetStep?: number
  ) => void;
  onOpenBusinessPlanStudio?: () => void;
  onBackToDashboard?: () => void;
  onUpdatePlanGrantCenterData?: (updater: (prev: ActiveStartupPlan) => ActiveStartupPlan) => void;
  onUpdateGrantCenterData?: (updatedData: SavedGrantCenterData) => void;
}

const STATUS_CONFIG: Record<
  GrantApplicationStatusType,
  { label: string; badgeClass: string; desc: string }
> = {
  NOT_STARTED: {
    label: 'Not Started',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    desc: 'Reviewing requirements and eligibility.',
  },
  PREPARING_PLAN: {
    label: 'Preparing Plan',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    desc: 'Completing required modules in Startup Preflight.',
  },
  ADVISOR_CALL_BOOKED: {
    label: 'Advisor Call Booked',
    badgeClass: 'bg-violet-100 text-violet-800 border-violet-300',
    desc: 'Mandatory pre-application meeting scheduled with local enterprise advisor.',
  },
  PORTAL_SUBMITTED: {
    label: 'Portal Submitted',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    desc: 'Formal application submitted to official agency portal.',
  },
  APPROVED_WON: {
    label: 'Approved / Won 🎉',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    desc: 'Letter of Offer approved and voucher/grant secured!',
  },
  UNSUCCESSFUL: {
    label: 'Needs Rework',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
    desc: 'Review assessor feedback and re-apply next cycle.',
  },
};

export function GrantApplicationCenterView({
  plan,
  founderName = 'Founder',
  selectedCountry,
  isVaultReadonly = false,
  onNavigateToModule,
  onOpenBusinessPlanStudio,
  onBackToDashboard,
  onUpdatePlanGrantCenterData,
  onUpdateGrantCenterData,
}: GrantApplicationCenterViewProps) {
  const targetCountry = (selectedCountry || plan.hqCountryCode || 'IE').toUpperCase();
  const isSupported = isGrantCheckerSupportedForCountry(targetCountry);
  const isUK = targetCountry === 'GB';
  const availableGrants = useMemo(() => {
    return DETAILED_GRANT_PORTALS.filter(
      (g) => g.countryCode === (isUK ? 'GB' : 'IE')
    );
  }, [isUK]);

  // Selected grant
  const [selectedGrantSlug, setSelectedGrantSlug] = useState<string>(
    plan.grantCenterData?.activeGrantSlug ||
      availableGrants[0]?.slug ||
      'ie-leo-feasibility-study-grant'
  );

  const activeGrant = useMemo(() => {
    return (
      availableGrants.find((g) => g.slug === selectedGrantSlug) ||
      availableGrants[0] ||
      DETAILED_GRANT_PORTALS[0]
    );
  }, [availableGrants, selectedGrantSlug]);

  if (!isSupported) {
    return (
      <div className="mx-auto my-12 max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <Landmark className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-base font-bold text-slate-900">
          Grant Application Workflows Coming Soon
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-slate-600">
          Official grant application links, local agency contacts, and application checklists are currently tailored for founders in Ireland and the United Kingdom. As we expand, additional jurisdictions will be added here for {targetCountry}.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          {onBackToDashboard && (
            <Button
              onClick={onBackToDashboard}
              className="bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700"
            >
              Back to Dashboard
            </Button>
          )}
          {onOpenBusinessPlanStudio && (
            <Button
              variant="outline"
              onClick={onOpenBusinessPlanStudio}
              className="border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Open Business Plan Studio
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Evaluate readiness for the selected grant
  const readiness: EvaluatedGrantReadiness = useMemo(() => {
    return evaluatePlanGrantReadiness(plan, activeGrant.slug);
  }, [plan, activeGrant.slug]);

  // Current application tracker state
  const currentTracker: SavedGrantApplicationTracker = useMemo(() => {
    return (
      plan.grantCenterData?.applications?.[activeGrant.slug] || {
        grantSlug: activeGrant.slug,
        status: 'NOT_STARTED',
        selectedLeoOfficeId: 'leo-dublin-city',
      }
    );
  }, [plan.grantCenterData, activeGrant.slug]);

  // Selected LEO office (for IE grants)
  const [selectedLeoId, setSelectedLeoId] = useState<string>(
    currentTracker.selectedLeoOfficeId || 'leo-dublin-city'
  );

  const selectedLeoOffice: LeoOfficeDirectoryItem = useMemo(() => {
    return (
      IRELAND_LEO_OFFICES.find((o) => o.id === selectedLeoId) ||
      IRELAND_LEO_OFFICES[0]
    );
  }, [selectedLeoId]);

  // Custom question form states
  const [customQuestionInput, setCustomQuestionInput] = useState('');
  const [targetLength, setTargetLength] = useState<'SHORT' | 'STANDARD' | 'DETAILED'>('STANDARD');
  const [assessorLens, setAssessorLens] = useState<
    'ECONOMIC_EXPORT' | 'R_AND_D_INNOVATION' | 'UNDERWRITING_REPAYMENT' | 'COMMERCIAL_INVESTOR'
  >(isUK ? 'UNDERWRITING_REPAYMENT' : 'ECONOMIC_EXPORT');
  const [isGeneratingAnswer, setIsGeneratingAnswer] = useState(false);
  const [copiedQuestionId, setCopiedQuestionId] = useState<string | null>(null);
  const [copiedAdvisorEmail, setCopiedAdvisorEmail] = useState(false);

  // Saved questions for active grant
  const grantQuestions = useMemo(() => {
    return (plan.grantCenterData?.customQuestions || []).filter(
      (q) => !q.grantSlug || q.grantSlug === activeGrant.slug
    );
  }, [plan.grantCenterData?.customQuestions, activeGrant.slug]);

  // Pre-written email text to LEO / Advisor
  const advisorEmailBody = useMemo(() => {
    const founderName = 'Founder';
    const companyTitle = plan.title || 'Our Startup';
    const oneLiner = plan.oneLinerSummary || plan.conceptCanvas?.proposedSolution || 'innovative solution';
    const sector = plan.industryCategory || 'Startup';
    const isBmw = selectedLeoOffice.bmwRegion;

    return `Dear ${selectedLeoOffice.name} Advisor / Enterprise Team,

I am writing to schedule an initial advisory meeting to discuss our eligibility for the ${activeGrant.name} and related startup supports.

Project Summary:
• Company / Venture: ${companyTitle}
• Sector: ${sector}
• Core Concept: ${oneLiner}
• Location: ${selectedLeoOffice.countyOrCity}
• Target Grant Focus: ${activeGrant.name} (${activeGrant.headlineAmount})

We have completed our preliminary commercial plan, market sizing, 3-year cashflow projections, and supplier quotation schedule via Startup Preflight. We would welcome 20–30 minutes to review our project with a LEO Business Advisor and obtain guidance on your upcoming Evaluation Committee calendar.

Could you let us know your current availability for a clinic appointment or video call?

Kind regards,
${founderName}
${companyTitle}`;
  }, [plan, activeGrant, selectedLeoOffice]);

  function persistGrantCenterUpdate(updater: (prev: SavedGrantCenterData) => SavedGrantCenterData) {
    const currentData = plan.grantCenterData || {};
    const updatedData = updater(currentData);
    if (onUpdateGrantCenterData) {
      onUpdateGrantCenterData(updatedData);
    }
    if (onUpdatePlanGrantCenterData) {
      onUpdatePlanGrantCenterData((prev) => ({
        ...prev,
        grantCenterData: updatedData,
      }));
    }
  }

  // Handlers
  function handleSelectGrant(slug: string) {
    setSelectedGrantSlug(slug);
    persistGrantCenterUpdate((prev) => ({
      ...prev,
      activeGrantSlug: slug,
    }));
  }

  function handleUpdateTrackerStatus(status: GrantApplicationStatusType) {
    persistGrantCenterUpdate((prev) => {
      const existingApps = prev.applications || {};
      return {
        ...prev,
        applications: {
          ...existingApps,
          [activeGrant.slug]: {
            ...(existingApps[activeGrant.slug] || {
              grantSlug: activeGrant.slug,
            }),
            status,
            lastUpdatedAt: new Date().toISOString(),
          },
        },
      };
    });
  }

  async function handleGenerateCustomAnswer(e: React.FormEvent) {
    e.preventDefault();
    if (!customQuestionInput.trim() || isGeneratingAnswer || isVaultReadonly) return;

    setIsGeneratingAnswer(true);
    try {
      const result = await answerQuestionFromStartupPlanAction({
        planId: plan.id,
        questionText: customQuestionInput.trim(),
        grantSlug: activeGrant.slug,
        targetLength,
        assessorLens,
        planSnapshot: plan,
      });

      if (result.success && result.question) {
        const savedQ = result.question;
        persistGrantCenterUpdate((prev) => {
          const prevQuestions = prev.customQuestions || [];
          return {
            ...prev,
            customQuestions: [savedQ, ...prevQuestions],
          };
        });
        setCustomQuestionInput('');
      }
    } catch (err) {
      console.error('Failed to answer custom question:', err);
    } finally {
      setIsGeneratingAnswer(false);
    }
  }

  async function handleCopyText(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedQuestionId(id);
      setTimeout(() => setCopiedQuestionId(null), 2500);
    } catch {
      // Ignore clipboard error
    }
  }

  async function handleCopyEmail() {
    try {
      await navigator.clipboard.writeText(advisorEmailBody);
      setCopiedAdvisorEmail(true);
      setTimeout(() => setCopiedAdvisorEmail(false), 2500);
    } catch {
      // Ignore clipboard error
    }
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-900/60 bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 p-5 text-white shadow-md sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={onBackToDashboard}
                className="h-7 px-2 text-xs font-semibold text-indigo-200 hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                Back to Dashboard
              </Button>
              <Badge className="border-indigo-400/40 bg-indigo-500/25 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-100">
                Grant Application Center
              </Badge>
              <Badge className="border-white/20 bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-100">
                {isUK ? '🇬🇧 United Kingdom' : '🇮🇪 Ireland'} Directory
              </Badge>
            </div>

            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl lg:text-3xl">
              Apply for Startup Grants &amp; Non-Dilutive Funding
            </h1>
            <p className="max-w-3xl text-xs leading-relaxed text-indigo-100/90 sm:text-sm">
              Follow our step-by-step submission companion. We verify that your plan
              satisfies official agency rubrics, provide direct portal links, and generate
              assessor-ready answers directly from your saved plan data.
            </p>
          </div>

          {/* Quick Stats Box */}
          <div className="flex items-center gap-4 rounded-xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-xs sm:min-w-[240px]">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 ring-1 ring-emerald-400/40">
              <Landmark className="h-5 w-5 text-emerald-300" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">
                Current Grant Readiness
              </div>
              <div className="text-2xl font-extrabold text-white">
                {readiness.readinessPercentage}%
              </div>
              <div className="text-[11px] text-indigo-200">
                {readiness.completedCount} of {readiness.totalCount} Plan Items Ready
              </div>
            </div>
          </div>
        </div>

        {/* Grant Selector Strip */}
        <div className="mt-6 border-t border-white/15 pt-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">
            Select Grant Program to Apply For:
          </div>
          <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {availableGrants.map((grant) => {
              const isSelected = grant.slug === activeGrant.slug;
              const grantEval = evaluatePlanGrantReadiness(plan, grant.slug);
              const grantStatus =
                plan.grantCenterData?.applications?.[grant.slug]?.status || 'NOT_STARTED';

              return (
                <button
                  key={grant.slug}
                  type="button"
                  onClick={() => handleSelectGrant(grant.slug)}
                  className={`group flex flex-col justify-between rounded-xl border p-3 text-left transition-all ${
                    isSelected
                      ? 'border-emerald-400 bg-white/20 text-white shadow-md'
                      : 'border-white/15 bg-white/5 text-indigo-100 hover:border-white/30 hover:bg-white/10'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate text-xs font-bold text-white">
                        {grant.name}
                      </span>
                      {grantEval.isReadyToSubmit ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-300" />
                      ) : null}
                    </div>
                    <div className="mt-0.5 text-[11px] font-extrabold text-emerald-300">
                      {grant.headlineAmount}
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between border-t border-white/10 pt-2 text-[10px]">
                    <span className="text-indigo-200">
                      {grantEval.readinessPercentage}% Ready
                    </span>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 font-semibold text-white">
                      {STATUS_CONFIG[grantStatus].label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Grant Overview & Golden Rule Warning */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-indigo-200 bg-indigo-50 text-[10px] font-bold text-indigo-800">
                {activeGrant.agency}
              </Badge>
              <Badge variant="outline" className="border-slate-200 text-[10px] text-slate-600">
                {activeGrant.fundingType}
              </Badge>
              {activeGrant.submissionSoftwarePlatform && (
                <Badge variant="secondary" className="text-[10px] text-slate-500">
                  Platform: {activeGrant.submissionSoftwarePlatform}
                </Badge>
              )}
            </div>

            <h2 className="mt-2 text-lg font-bold text-slate-900 sm:text-xl">
              {activeGrant.name}
            </h2>
            <p className="mt-1 text-xs text-slate-600 sm:text-sm">
              {activeGrant.matchRateDescription} • {activeGrant.keyDeadlinesOrWindows}
            </p>
          </div>

          {/* Application Status Dropdown */}
          <div className="flex flex-col items-end gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Your Application Status:
            </span>
            <div className="flex items-center gap-2">
              <select
                value={currentTracker.status}
                onChange={(e) =>
                  handleUpdateTrackerStatus(e.target.value as GrantApplicationStatusType)
                }
                disabled={isVaultReadonly}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 shadow-2xs focus:border-indigo-500 focus:outline-hidden"
              >
                <option value="NOT_STARTED">⚪ Not Started</option>
                <option value="PREPARING_PLAN">🔵 Preparing Plan</option>
                <option value="ADVISOR_CALL_BOOKED">🟣 Advisor Call Booked</option>
                <option value="PORTAL_SUBMITTED">🟡 Portal Submitted</option>
                <option value="APPROVED_WON">🟢 Approved / Won 🎉</option>
                <option value="UNSUCCESSFUL">🔴 Needs Rework</option>
              </select>
            </div>
            <span className="text-[11px] text-slate-500">
              {STATUS_CONFIG[currentTracker.status].desc}
            </span>
          </div>
        </div>

        {/* Golden Rule Warning Banner */}
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-950">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold">Golden Rule for this Grant:</span>
            <p className="leading-relaxed text-amber-900">
              {activeGrant.goldenRuleWarning}
            </p>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* STAGE 1: PLAN COMPLETENESS CHECKLIST                                */}
      {/* =================================================================== */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                1
              </span>
              <h2 className="text-base font-bold text-slate-900">
                Plan Completeness &amp; Grant Underwriting Checklist
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 ml-8">
              Government assessors scrutinize every box. Make sure your Startup Preflight
              modules have the required evidence before submitting.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={
                readiness.isReadyToSubmit
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : 'border-amber-300 bg-amber-50 text-amber-900'
              }
            >
              {readiness.completedCount} / {readiness.totalCount} Complete (
              {readiness.readinessPercentage}%)
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {readiness.items.map((item) => {
            return (
              <div
                key={item.key}
                className={`flex flex-col justify-between rounded-xl border p-4 transition-all ${
                  item.isComplete
                    ? 'border-emerald-200 bg-emerald-50/30'
                    : 'border-amber-200 bg-white hover:border-amber-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {item.isComplete ? (
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                          <Check className="h-3 w-3" />
                        </div>
                      ) : (
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white font-bold text-[10px]">
                          !
                        </div>
                      )}
                      <span className="text-xs font-bold text-slate-900">
                        {item.title}
                      </span>
                    </div>

                    <Badge
                      variant="outline"
                      className={`text-[9px] font-bold ${
                        item.isComplete
                          ? 'border-emerald-300 bg-white text-emerald-800'
                          : 'border-amber-300 bg-amber-50 text-amber-900'
                      }`}
                    >
                      {item.isComplete ? 'READY' : 'ACTION NEEDED'}
                    </Badge>
                  </div>

                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    {item.summary}
                  </p>
                </div>

                {!item.isComplete && (
                  <div className="mt-3.5 border-t border-slate-100 pt-2.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onNavigateToModule(item.moduleCode, item.stepNumber)}
                      className="w-full border-amber-300 bg-amber-50/50 text-[11px] font-bold text-amber-950 hover:bg-amber-100"
                    >
                      {item.actionPrompt}
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* =================================================================== */}
      {/* STAGE 2: PORTAL LINKS & ADVISOR OUTREACH HELPER                     */}
      {/* =================================================================== */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
            2
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Official Portal Link &amp; Advisor Outreach Helper
            </h2>
            <p className="text-xs text-slate-500">
              For LEO &amp; Enterprise Ireland, booking a meeting with your local advisor is
              often mandatory before the online portal form is unlocked.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Left Column: Direct Links & County Selector */}
          <div className="space-y-4 lg:col-span-5">
            <Card className="rounded-xl border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-slate-900">
                  Direct Official Agency Portal
                </CardTitle>
                <CardDescription className="text-xs">
                  Official registration page for {activeGrant.name}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Specific Primary Portal CTA */}
                {(() => {
                  const isLeoGrant =
                    activeGrant.agency.includes('LEO') || activeGrant.slug.startsWith('ie-leo-');
                  const directPortalTargetUrl =
                    isLeoGrant &&
                    selectedLeoOffice?.portalUrl &&
                    activeGrant.slug !== 'ie-leo-grow-digital-voucher'
                      ? selectedLeoOffice.portalUrl
                      : activeGrant.directPortalUrl;
                  const directPortalTargetLabel =
                    isLeoGrant &&
                    selectedLeoOffice?.portalUrl &&
                    activeGrant.slug !== 'ie-leo-grow-digital-voucher'
                      ? `Launch ${selectedLeoOffice.name} Financial Supports Portal`
                      : activeGrant.directPortalLabel ||
                        `Launch Official ${activeGrant.agency} Portal`;

                  return (
                    <a
                      href={directPortalTargetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50/70 p-3.5 text-xs font-bold text-indigo-950 transition-all hover:bg-indigo-100 hover:border-indigo-300 shadow-2xs"
                    >
                      <span className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 shrink-0 text-indigo-700 group-hover:text-indigo-900" />
                        <span>{directPortalTargetLabel}</span>
                      </span>
                      <ExternalLink className="h-4 w-4 shrink-0 text-indigo-600 group-hover:text-indigo-800" />
                    </a>
                  );
                })()}

                {/* Official Scheme Guidance & Supporting Links */}
                <div className="space-y-1.5 pt-1">
                  {activeGrant.applicationGuideUrl && (
                    <a
                      href={activeGrant.applicationGuideUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 transition-colors hover:border-indigo-300 hover:text-indigo-900 hover:bg-slate-50"
                    >
                      <span className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-slate-500" />
                        <span>
                          {activeGrant.applicationGuideLabel ||
                            'Official Scheme Guidance & Documentation'}
                        </span>
                      </span>
                      <ExternalLink className="h-3 w-3 shrink-0 text-slate-400" />
                    </a>
                  )}

                  {/* Revenue ROS direct link if SURE */}
                  {activeGrant.slug === 'ie-sure-tax-relief' && (
                    <a
                      href="https://www.ros.ie/oidc/login?lang=en&client_id=rosint_rp"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 transition-colors hover:border-indigo-300 hover:text-indigo-900 hover:bg-slate-50"
                    >
                      <span className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-slate-500" />
                        <span>Sign In to ROS (Revenue Online Service - ros.ie)</span>
                      </span>
                      <ExternalLink className="h-3 w-3 shrink-0 text-slate-400" />
                    </a>
                  )}

                  {/* New Frontiers Campus Locations if New Frontiers */}
                  {activeGrant.slug === 'ie-enterprise-ireland-new-frontiers' && (
                    <a
                      href="https://www.newfrontiers.ie/locations"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 transition-colors hover:border-indigo-300 hover:text-indigo-900 hover:bg-slate-50"
                    >
                      <span className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-slate-500" />
                        <span>Browse 18 Participating Campus Hubs &amp; Incubation Centres</span>
                      </span>
                      <ExternalLink className="h-3 w-3 shrink-0 text-slate-400" />
                    </a>
                  )}
                </div>

                {/* Portal Workflow Instructions */}
                {activeGrant.portalInstructions && (
                  <div className="rounded-lg border border-slate-200/80 bg-slate-50/80 p-3 text-xs leading-relaxed text-slate-600">
                    <span className="font-bold text-slate-800">Application Route: </span>
                    {activeGrant.portalInstructions}
                  </div>
                )}

                {/* Ireland 31 LEO Selector if Ireland */}
                {!isUK && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Your Local Enterprise Office (31 Locations):
                    </label>
                    <select
                      value={selectedLeoId}
                      onChange={(e) => setSelectedLeoId(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs font-semibold text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-hidden"
                    >
                      {IRELAND_LEO_OFFICES.map((leo) => (
                        <option key={leo.id} value={leo.id}>
                          {leo.countyOrCity} ({leo.name})
                          {leo.bmwRegion ? ' — 60% BMW Region Match' : ' — 50% Match'}
                        </option>
                      ))}
                    </select>

                    <div className="rounded-lg border border-slate-200/80 bg-slate-50 p-3 text-xs space-y-2 text-slate-700">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">
                          {selectedLeoOffice.name}
                        </span>
                        {selectedLeoOffice.bmwRegion && (
                          <Badge className="bg-emerald-100 text-[9px] font-bold text-emerald-900">
                            BMW 60% Match
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600">
                        <a
                          href={`tel:${selectedLeoOffice.phone.replace(/[^0-9+]/g, '')}`}
                          className="flex items-center gap-1.5 font-medium hover:text-indigo-600"
                        >
                          <Phone className="h-3 w-3 text-slate-500" />
                          <span>{selectedLeoOffice.phone}</span>
                        </a>
                        <span>•</span>
                        <a
                          href={`mailto:${selectedLeoOffice.generalEmail}`}
                          className="flex items-center gap-1.5 font-medium hover:text-indigo-600"
                        >
                          <Mail className="h-3 w-3 text-slate-500" />
                          <span>{selectedLeoOffice.generalEmail}</span>
                        </a>
                      </div>
                      <div className="pt-1 border-t border-slate-200/60">
                        <a
                          href={selectedLeoOffice.portalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 hover:underline"
                        >
                          <span>Visit {selectedLeoOffice.name} Supports Page</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Pre-Written Advisor Email */}
          <div className="space-y-2 lg:col-span-7">
            <Card className="rounded-xl border-slate-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold text-slate-900">
                    Pre-Written Expression of Interest Email
                  </CardTitle>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleCopyEmail}
                    className="h-7 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  >
                    {copiedAdvisorEmail ? (
                      <>
                        <Check className="mr-1 h-3.5 w-3.5 text-emerald-600" />
                        Copied to Clipboard!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1 h-3.5 w-3.5" />
                        Copy Email
                      </>
                    )}
                  </Button>
                </div>
                <CardDescription className="text-xs">
                  Copy this email and send it to {selectedLeoOffice.generalEmail} to book your
                  pre-application advisor clinic.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 font-mono text-xs leading-relaxed text-slate-800 whitespace-pre-wrap max-h-[280px] overflow-y-auto">
                  {advisorEmailBody}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* STAGE 3: "PASTE ANY PORTAL QUESTION" AI ENGINE                      */}
      {/* =================================================================== */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
            3
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Paste Any Portal Question — Get a Verified Answer from Your Plan
            </h2>
            <p className="text-xs text-slate-500">
              Did the grant application portal change its wording or ask a custom question?
              Paste it below to generate a tailored, copy-ready answer strictly from your
              saved plan data.
            </p>
          </div>
        </div>

        {/* Question Generator Card */}
        <Card className="rounded-xl border-indigo-200 bg-gradient-to-b from-indigo-50/40 via-white to-white shadow-xs">
          <CardContent className="pt-5 space-y-4">
            <form onSubmit={handleGenerateCustomAnswer} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-900">
                  Paste the Exact Question from the Application Portal:
                </label>
                <textarea
                  value={customQuestionInput}
                  onChange={(e) => setCustomQuestionInput(e.target.value)}
                  placeholder='e.g., "Describe the technical innovation in your product and how it will be protected from competitors" or "Outline your export growth plans and job creation for the next 3 years"'
                  rows={3}
                  disabled={isGeneratingAnswer || isVaultReadonly}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-xs leading-relaxed text-slate-900 shadow-2xs placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  {/* Length limit selector */}
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-600">Length Cap:</span>
                    <select
                      value={targetLength}
                      onChange={(e) =>
                        setTargetLength(
                          e.target.value as 'SHORT' | 'STANDARD' | 'DETAILED'
                        )
                      }
                      className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800"
                    >
                      <option value="SHORT">Short (~100 words)</option>
                      <option value="STANDARD">Standard (~250 words)</option>
                      <option value="DETAILED">Detailed (~400 words)</option>
                    </select>
                  </div>

                  {/* Assessor lens selector */}
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-600">Assessor Lens:</span>
                    <select
                      value={assessorLens}
                      onChange={(e) =>
                        setAssessorLens(
                          e.target.value as
                            | 'ECONOMIC_EXPORT'
                            | 'R_AND_D_INNOVATION'
                            | 'UNDERWRITING_REPAYMENT'
                            | 'COMMERCIAL_INVESTOR'
                        )
                      }
                      className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800"
                    >
                      <option value="ECONOMIC_EXPORT">Economic &amp; Export Focus</option>
                      <option value="R_AND_D_INNOVATION">Technical R&amp;D &amp; Innovation</option>
                      <option value="UNDERWRITING_REPAYMENT">
                        Underwriting &amp; Cashflow Viability
                      </option>
                      <option value="COMMERCIAL_INVESTOR">Commercial &amp; Scalability</option>
                    </select>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={
                    !customQuestionInput.trim() || isGeneratingAnswer || isVaultReadonly
                  }
                  className="bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700"
                >
                  {isGeneratingAnswer ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Synthesizing Answer from Plan...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                      Generate Verified Answer
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Saved Q&A Answers Feed */}
        {grantQuestions.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Your Generated &amp; Saved Portal Answers ({grantQuestions.length}):
              </span>
            </div>

            <div className="space-y-3">
              {grantQuestions.map((q) => (
                <div
                  key={q.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-[10px] text-slate-600">
                          {q.targetLength}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="bg-indigo-50 text-[10px] font-semibold text-indigo-700"
                        >
                          {q.assessorLens.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <h3 className="mt-1.5 text-xs font-bold text-slate-900">
                        Q: &ldquo;{q.questionText}&rdquo;
                      </h3>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyText(q.answerText, q.id)}
                      className="h-7 text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                      {copiedQuestionId === q.id ? (
                        <>
                          <Check className="mr-1 h-3.5 w-3.5 text-emerald-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-1 h-3.5 w-3.5" />
                          Copy Answer
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3 text-xs leading-relaxed text-slate-800 whitespace-pre-wrap">
                    {q.answerText}
                  </div>

                  {/* Citations & Warnings Strip */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold text-emerald-700">✓ Verified from:</span>
                      {q.sourceModuleCitations.map((cit, idx) => (
                        <span
                          key={idx}
                          className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700"
                        >
                          {cit}
                        </span>
                      ))}
                    </div>

                    {q.missingDataWarnings && q.missingDataWarnings.length > 0 && (
                      <span className="text-amber-700 font-medium text-[10px]">
                        ⚠️ Note: {q.missingDataWarnings.join('; ')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* =================================================================== */}
      {/* STAGE 4: MANDATORY ATTACHMENTS & UPLOAD PACK                        */}
      {/* =================================================================== */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
            4
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Mandatory Attachments &amp; Upload Checklist
            </h2>
            <p className="text-xs text-slate-500">
              Most portals require uploading supporting documentation at the end of the form.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Card 1: Official Business Plan PDF */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <FileText className="h-4 w-4 text-indigo-600" />
                Official Grant Business Plan / Dossier PDF
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Pre-formatted for {activeGrant.agency} including all appendices.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onOpenBusinessPlanStudio}
                className="w-full border-indigo-200 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
              >
                Open Business Plan Studio &amp; Export
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Card 2: 3-Year Cashflow Spreadsheet */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <Layers className="h-4 w-4 text-emerald-600" />
                3-Year Financial Projections &amp; Cashflow
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Integrated Profit &amp; Loss, Balance Sheet, and Monthly Cashflow.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onNavigateToModule('MOD_J_FINANCE', 1)}
                className="w-full border-emerald-200 text-xs font-semibold text-emerald-800 hover:bg-emerald-50"
              >
                Open Financial Projections (Module J)
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Card 3: 3 Independent Supplier Quotes */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <Paperclip className="h-4 w-4 text-violet-600" />
                3 Independent Written Supplier Quotes
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Required for any capital item or dev quote over €5k / £5k.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onNavigateToModule('MOD_E_OPERATIONS', 2)}
                className="w-full border-violet-200 text-xs font-semibold text-violet-800 hover:bg-violet-50"
              >
                Open Equipment &amp; Quotes Concierge (Module E)
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Card 4: Tax Clearance (eTC) Verification */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <ShieldCheck className="h-4 w-4 text-amber-600" />
                Tax Clearance (eTC) &amp; Bank Statement
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Required to drawdown any grant approved by the state.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onNavigateToModule('MOD_G_LAUNCHPAD', 3)}
                className="w-full border-amber-200 text-xs font-semibold text-amber-900 hover:bg-amber-50"
              >
                Review Launchpad &amp; Bank Setup (Module G)
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
