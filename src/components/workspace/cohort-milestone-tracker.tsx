'use client';

import React, { useState, useEffect } from 'react';
import {
  Gift,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Building2,
  Check,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ModuleCode } from '@/lib/entitlements';
import {
  getCohortMilestoneStateForPlanAction,
  type CohortMilestonePlanState,
  type CohortMilestoneClaimDossier,
  type CohortMilestoneExecutiveSummary,
} from '@/app/actions/cohort-milestone-claim';
import { CohortMilestoneClaimModal } from '@/components/workspace/cohort-milestone-claim-modal';

interface CohortMilestoneTrackerProps {
  planId: string;
  hqCountryCode: string;
  founderName: string;
  founderEmail: string;
  cohortCode?: string;
  isDashboardOpen: boolean;
  moduleProgressList: Array<{
    code: ModuleCode;
    short: string;
    title: string;
    progress: number;
    allowed: boolean;
  }>;
  prefilledDomainFromLaunchpad?: string;
  prefilledEmailFromLaunchpad?: string;
  executiveSummary: CohortMilestoneExecutiveSummary;
  onNavigateToModule: (modCode: ModuleCode) => void;
}

const SHORT_MOD_NAMES: Record<string, string> = {
  MOD_A_IDEATION: 'Mod A: Ideation',
  MOD_B_MARKET: 'Mod B: Market',
  MOD_C_SURVEYS_FEEDBACK: 'Mod C: Surveys',
  MOD_D_PRODUCT_BUILD: 'Mod D: Product',
  MOD_E_OPERATIONS: 'Mod E: Operations',
  MOD_F_COFOUNDER_TEAM: 'Mod F: Team',
  MOD_G_LAUNCHPAD: 'Mod G: Launchpad',
  MOD_H_REVENUE: 'Mod H: Revenue',
  MOD_I_MARKETING: 'Mod I: Marketing',
  MOD_J_FINANCE: 'Mod J: Finance',
  MOD_K_GRANTS_FUNDING: 'Mod K: Grants',
  MOD_L_BUSINESS_PLAN: 'Mod L: Business Plan',
};

export function CohortMilestoneTracker({
  planId,
  hqCountryCode,
  founderName,
  founderEmail,
  cohortCode,
  isDashboardOpen,
  moduleProgressList,
  prefilledDomainFromLaunchpad,
  prefilledEmailFromLaunchpad,
  executiveSummary,
  onNavigateToModule,
}: CohortMilestoneTrackerProps) {
  const [cohortState, setCohortState] =
    useState<CohortMilestonePlanState | null>(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isCompactExpanded, setIsCompactExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCohortMilestoneStateForPlanAction(planId, {
      cohortCode,
      userEmail: founderEmail,
    })
      .then((res) => {
        if (!cancelled && res.ok) {
          setCohortState(res);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [planId, cohortCode, founderEmail]);

  if (!cohortState?.enrolledInCohort || !cohortState.cohort) {
    return null;
  }

  const { cohort, claimState } = cohortState;
  const { milestoneConfig } = cohort;

  // Build live progress map from workspace modules
  const moduleProgressMap: Record<string, number> = {};
  for (const item of moduleProgressList) {
    moduleProgressMap[item.code] = item.progress;
  }

  const requiredModules =
    milestoneConfig.requiredModules &&
    milestoneConfig.requiredModules.length > 0
      ? milestoneConfig.requiredModules
      : [
          'MOD_A_IDEATION',
          'MOD_B_MARKET',
          'MOD_C_SURVEYS_FEEDBACK',
          'MOD_D_PRODUCT_BUILD',
        ];

  const completedRequiredModules = requiredModules.filter(
    (code) => (moduleProgressMap[code] ?? 0) >= 50
  );

  const nextIncompleteModuleCode = requiredModules.find(
    (code) => (moduleProgressMap[code] ?? 0) < 50
  ) as ModuleCode | undefined;

  const overallMilestoneProgress =
    requiredModules.length > 0
      ? Math.round(
          requiredModules.reduce(
            (sum, code) => sum + (moduleProgressMap[code] ?? 0),
            0
          ) / requiredModules.length
        )
      : 0;

  const requiredThreshold = milestoneConfig.requiredProgressPercent || 50;

  const isClaimed =
    claimState?.status === 'CLAIMED_PARTNER_NOTIFIED' ||
    claimState?.status === 'REWARD_ACTIVATED';

  const isEligibleToClaim =
    !isClaimed &&
    overallMilestoneProgress >= requiredThreshold &&
    completedRequiredModules.length === requiredModules.length;

  function handleClaimSuccess(dossier: CohortMilestoneClaimDossier) {
    setCohortState((prev) =>
      prev
        ? {
            ...prev,
            claimState: {
              status: 'CLAIMED_PARTNER_NOTIFIED',
              claimedAtIso: dossier.claimedAtIso,
              verifiedDomain: dossier.verifiedDomain,
              verifiedWorkEmail: dossier.verifiedWorkEmail,
              dossier,
            },
          }
        : prev
    );
  }

  const resolvedInitialDomain =
    claimState?.verifiedDomain ||
    cohortState.prefilledDomain ||
    prefilledDomainFromLaunchpad ||
    '';

  const resolvedInitialWorkEmail =
    claimState?.verifiedWorkEmail ||
    prefilledEmailFromLaunchpad ||
    cohortState.prefilledWorkEmail ||
    founderEmail;

  // If milestone gate is disabled for this cohort, show a clean enrollment badge strip
  if (!milestoneConfig.enabled) {
    if (!isDashboardOpen) return null;
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-200 bg-indigo-50/70 px-4 py-3 text-xs text-indigo-950 no-print print:hidden">
        <div className="flex items-center gap-2.5">
          <Building2 className="h-4 w-4 shrink-0 text-indigo-600" />
          <span>
            Enrolled in <strong>{cohort.organizationName}</strong> —{' '}
            <strong>{cohort.name}</strong> (Code:{' '}
            <code className="font-mono font-bold">{cohort.inviteCode}</code>)
          </span>
        </div>
        <Badge className="bg-indigo-600 text-[10px] text-white">
          Institutional Cohort Pass Active
        </Badge>
      </div>
    );
  }

  return (
    <>
      {isDashboardOpen ? (
        /* FULL DASHBOARD PARTNER MILESTONE CARD */
        <div
          className={`rounded-2xl border p-5 shadow-xs transition-all sm:p-6 no-print print:hidden ${
            isClaimed
              ? 'border-emerald-300 bg-gradient-to-r from-emerald-50/90 via-white to-teal-50/60'
              : isEligibleToClaim
                ? 'border-emerald-400 bg-gradient-to-r from-indigo-950 via-indigo-900 to-emerald-950 text-white shadow-md'
                : 'border-indigo-200/90 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white'
          }`}
        >
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div className="space-y-2 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  className={
                    isClaimed
                      ? 'bg-emerald-600 text-[10px] font-bold text-white'
                      : isEligibleToClaim
                        ? 'border-emerald-400/50 bg-emerald-500/20 text-[10px] font-bold text-emerald-200'
                        : 'border-indigo-400/40 bg-indigo-500/20 text-[10px] font-bold text-indigo-200'
                  }
                >
                  {isClaimed
                    ? '✓ Partner Verification Dispatched'
                    : isEligibleToClaim
                      ? '🎁 Milestone Reached — Ready to Claim'
                      : `${cohort.organizationName} Partner Program`}
                </Badge>
                <span
                  className={`text-xs font-medium ${
                    isClaimed ? 'text-slate-600' : 'text-indigo-200'
                  }`}
                >
                  {cohort.name} • Code:{' '}
                  <code className="font-mono font-bold">
                    {cohort.inviteCode}
                  </code>
                </span>
              </div>

              <h2
                className={`text-lg font-extrabold tracking-tight sm:text-xl ${
                  isClaimed ? 'text-slate-900' : 'text-white'
                }`}
              >
                {milestoneConfig.rewardLabel}
              </h2>

              <p
                className={`max-w-2xl text-xs leading-relaxed ${
                  isClaimed ? 'text-slate-600' : 'text-indigo-100/90'
                }`}
              >
                {isClaimed ? (
                  <>
                    Submitted for{' '}
                    <strong>{executiveSummary.startupTitle}</strong> (
                    <code className="font-mono">
                      https://{claimState?.verifiedDomain}
                    </code>{' '}
                    •{' '}
                    <code className="font-mono">
                      {claimState?.verifiedWorkEmail}
                    </code>
                    ). The <strong>{cohort.organizationName}</strong> team has
                    received your verified readiness dossier.
                  </>
                ) : isEligibleToClaim ? (
                  <>
                    You have reached{' '}
                    <strong>{overallMilestoneProgress}% readiness</strong> and
                    completed all {requiredModules.length} required validation
                    modules! Click below to verify your official company domain
                    &amp; work email and dispatch your claim to{' '}
                    <strong>{cohort.organizationName}</strong>.
                  </>
                ) : (
                  <>
                    Complete at least <strong>{requiredThreshold}%</strong> across
                    your required onboarding modules ({completedRequiredModules.length}{' '}
                    of {requiredModules.length} complete) to unlock{' '}
                    <strong>{milestoneConfig.rewardLabel}</strong> from{' '}
                    <strong>{cohort.organizationName}</strong>.
                  </>
                )}
              </p>
            </div>

            {/* Right Action Cluster */}
            <div className="flex shrink-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
              {isClaimed ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsClaimModalOpen(true)}
                  className="border-emerald-300 bg-white text-xs font-bold text-emerald-900 hover:bg-emerald-50"
                >
                  <ShieldCheck className="mr-1.5 h-4 w-4 text-emerald-600" />
                  View Submitted Claim Dossier
                </Button>
              ) : isEligibleToClaim ? (
                <Button
                  type="button"
                  size="lg"
                  onClick={() => setIsClaimModalOpen(true)}
                  className="bg-emerald-500 px-5 text-xs font-extrabold text-slate-950 shadow-lg hover:bg-emerald-400"
                >
                  <Gift className="mr-2 h-4 w-4" />
                  Click to Claim: {milestoneConfig.rewardLabel}
                </Button>
              ) : (
                nextIncompleteModuleCode && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      onNavigateToModule(nextIncompleteModuleCode)
                    }
                    className="bg-white px-4 text-xs font-bold text-indigo-950 hover:bg-indigo-50"
                  >
                    Continue{' '}
                    {SHORT_MOD_NAMES[nextIncompleteModuleCode] ||
                      nextIncompleteModuleCode}
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                )
              )}
            </div>
          </div>

          {/* Progress Bar & Interactive Module Requirement Pills */}
          <div
            className={`mt-4 border-t pt-4 ${
              isClaimed ? 'border-emerald-200/80' : 'border-white/15'
            }`}
          >
            <div className="mb-2 flex items-center justify-between text-xs">
              <span
                className={`font-semibold ${
                  isClaimed ? 'text-slate-700' : 'text-indigo-100'
                }`}
              >
                Milestone Gate Readiness:{' '}
                <strong>{overallMilestoneProgress}%</strong> (Target:{' '}
                {requiredThreshold}%)
              </span>
              <span
                className={`text-[11px] font-medium ${
                  isClaimed ? 'text-emerald-700' : 'text-indigo-200'
                }`}
              >
                {completedRequiredModules.length} / {requiredModules.length}{' '}
                Required Modules Qualified (≥50% each)
              </span>
            </div>

            <div
              className={`h-2 w-full overflow-hidden rounded-full ${
                isClaimed ? 'bg-emerald-100' : 'bg-white/15'
              }`}
            >
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isClaimed || isEligibleToClaim
                    ? 'bg-emerald-400'
                    : 'bg-indigo-400'
                }`}
                style={{
                  width: `${Math.min(100, Math.max(6, overallMilestoneProgress))}%`,
                }}
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {requiredModules.map((modCode) => {
                const pct = moduleProgressMap[modCode] ?? 0;
                const isModQualified = pct >= 50;
                return (
                  <button
                    key={modCode}
                    type="button"
                    onClick={() => onNavigateToModule(modCode as ModuleCode)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
                      isClaimed
                        ? 'border-emerald-200 bg-white text-emerald-900 hover:bg-emerald-50'
                        : isModQualified
                          ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30'
                          : 'border-white/15 bg-white/10 text-indigo-100 hover:bg-white/20'
                    }`}
                  >
                    {isModQualified ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    ) : (
                      <Clock className="h-3.5 w-3.5 shrink-0 text-amber-300" />
                    )}
                    <span>{SHORT_MOD_NAMES[modCode] || modCode}</span>
                    <span className="opacity-80">({pct}%)</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* SLIM COLLAPSIBLE STRIP WHEN INSIDE MODULE WORKSPACE */
        <div
          className={`rounded-xl border px-3.5 py-2.5 shadow-2xs transition-all sm:px-4 no-print print:hidden ${
            isClaimed
              ? 'border-emerald-200 bg-emerald-50/90 text-emerald-950'
              : isEligibleToClaim
                ? 'border-emerald-300 bg-gradient-to-r from-indigo-950 to-emerald-950 text-white'
                : 'border-indigo-200 bg-indigo-50/75 text-indigo-950'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <Gift
                className={`h-4 w-4 shrink-0 ${
                  isClaimed
                    ? 'text-emerald-600'
                    : isEligibleToClaim
                      ? 'text-emerald-300'
                      : 'text-indigo-600'
                }`}
              />
              <span className="truncate text-xs font-bold">
                {cohort.organizationName}: {milestoneConfig.rewardLabel}
              </span>
              <Badge
                variant="secondary"
                className={`text-[10px] font-bold ${
                  isClaimed
                    ? 'bg-emerald-100 text-emerald-800'
                    : isEligibleToClaim
                      ? 'bg-emerald-500/25 text-emerald-200'
                      : 'bg-white text-indigo-800'
                }`}
              >
                {isClaimed
                  ? '✓ Claim Sent'
                  : `${overallMilestoneProgress}% / ${requiredThreshold}%`}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              {isClaimed ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsClaimModalOpen(true)}
                  className="h-7 px-2.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
                >
                  View Receipt
                </Button>
              ) : isEligibleToClaim ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setIsClaimModalOpen(true)}
                  className="h-7 bg-emerald-400 px-3 text-xs font-extrabold text-slate-950 hover:bg-emerald-300"
                >
                  🎁 Claim Reward Now
                </Button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCompactExpanded(!isCompactExpanded)}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100/70"
                >
                  <span>
                    {completedRequiredModules.length}/{requiredModules.length}{' '}
                    Modules
                  </span>
                  {isCompactExpanded ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
            </div>
          </div>

          {isCompactExpanded && !isClaimed && (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-indigo-200/60 pt-2.5">
              {requiredModules.map((modCode) => {
                const pct = moduleProgressMap[modCode] ?? 0;
                const isModQualified = pct >= 50;
                return (
                  <button
                    key={modCode}
                    type="button"
                    onClick={() => onNavigateToModule(modCode as ModuleCode)}
                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                      isModQualified
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                        : 'border-indigo-200 bg-white text-indigo-900 hover:bg-indigo-50'
                    }`}
                  >
                    {isModQualified && (
                      <Check className="h-3 w-3 text-emerald-600" />
                    )}
                    <span>{SHORT_MOD_NAMES[modCode] || modCode}</span>
                    <span>({pct}%)</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Click-to-Claim Verification & Dossier Modal */}
      <CohortMilestoneClaimModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        planId={planId}
        hqCountryCode={hqCountryCode}
        founderName={founderName}
        founderEmail={founderEmail}
        cohortCode={cohortCode || cohort.inviteCode}
        cohort={cohort}
        existingClaimDossier={claimState?.dossier}
        initialDomain={resolvedInitialDomain}
        initialWorkEmail={resolvedInitialWorkEmail}
        overallProgressPercent={overallMilestoneProgress}
        moduleProgressMap={moduleProgressMap}
        executiveSummary={executiveSummary}
        onClaimSuccess={handleClaimSuccess}
      />
    </>
  );
}
