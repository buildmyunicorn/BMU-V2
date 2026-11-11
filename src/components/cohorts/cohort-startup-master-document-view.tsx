'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  GraduationCap,
  Sparkles,
  Printer,
  Download,
  Copy,
  Check,
  Gift,
  Save,
  MessageSquare,
  Globe,
  Mail,
  Layers,
  ChevronDown,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type {
  CohortStartupMasterDocumentData,
  CohortFounderPlanSummary,
} from '@/app/actions/cohort-portal';
import {
  updateCohortStartupMentorNoteAction,
  reviewCohortMilestoneClaimAction,
} from '@/app/actions/cohort-portal';
import { MasterDocumentWorkspace } from '@/components/workspace/master-document-workspace';
import {
  buildMasterDocumentStandaloneHtml,
  buildMasterDocumentMarkdown,
} from '@/lib/export/master-document-brief';

export interface CohortStartupMasterDocumentViewProps {
  data: CohortStartupMasterDocumentData;
}

export function CohortStartupMasterDocumentView({
  data,
}: CohortStartupMasterDocumentViewProps) {
  const router = useRouter();

  // Mentor Note State
  const [mentorNote, setMentorNote] = useState<string>(
    data.startup.mentorNotes || ''
  );
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteSavedMessage, setNoteSavedMessage] = useState<string | null>(null);

  // Milestone Approval State
  const [milestoneStatus, setMilestoneStatus] = useState<string>(
    data.startup.milestoneStatus || 'IN_PROGRESS'
  );
  const [isApprovingMilestone, setIsApprovingMilestone] = useState(false);
  const [milestoneApprovedMessage, setMilestoneApprovedMessage] = useState<
    string | null
  >(null);

  // Action status
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);

  // Venture Switcher
  const handleVentureChange = (targetPlanId: string) => {
    if (!targetPlanId || targetPlanId === data.plan.id) return;
    const cohortSlugOrId = data.cohort.id;
    router.push(`/cohort-portal/${cohortSlugOrId}/startups/${targetPlanId}`);
  };

  // Save Mentor Note Action
  const handleSaveMentorNote = async () => {
    try {
      setIsSavingNote(true);
      setNoteSavedMessage(null);
      const res = await updateCohortStartupMentorNoteAction({
        planId: data.plan.id,
        mentorNote,
      });
      if (res.success) {
        setNoteSavedMessage('Saved note to cohort intelligence log.');
        setTimeout(() => setNoteSavedMessage(null), 3500);
      } else {
        alert(res.error || 'Failed to save mentor note.');
      }
    } catch {
      alert('Network error while saving note.');
    } finally {
      setIsSavingNote(false);
    }
  };

  // Approve Milestone Reward Action
  const handleApproveMilestone = async () => {
    try {
      setIsApprovingMilestone(true);
      const res = await reviewCohortMilestoneClaimAction({
        planId: data.plan.id,
        decision: 'APPROVE',
        approvalNotes: 'Approved via Master Document review portal.',
      });
      if (res.success) {
        setMilestoneStatus('REWARD_ACTIVATED');
        setMilestoneApprovedMessage('Perk activated successfully!');
        setTimeout(() => setMilestoneApprovedMessage(null), 4000);
      } else {
        alert(res.error || 'Failed to approve milestone.');
      }
    } catch {
      alert('Network error approving milestone.');
    } finally {
      setIsApprovingMilestone(false);
    }
  };

  // Download Standalone HTML
  const handleDownloadHtml = () => {
    const htmlContent = buildMasterDocumentStandaloneHtml({
      plan: data.plan,
      founderName: data.startup.founders,
      brainDumpText: data.plan.brainDumpText || '',
      conceptCanvas: data.plan.conceptCanvas || {
        coreProblem: '',
        targetCustomer: '',
        proposedSolution: '',
        unfairAdvantage: '',
        revenueAndGrantFit: '',
      },
      founderMotivation: data.plan.founderMotivation || {
        primaryMotivation: 'SCALE_STARTUP',
        weeklyHoursAvailable: '40_PLUS_HRS',
        twelveMonthSuccessVision: '',
      },
      teamAndBudget: data.plan.teamAndBudget || {
        teamStructureType: 'SOLO_FOUNDER',
        skillCoverage: 'BUILD_IN_HOUSE',
        startingBudgetBracket: 'UNDER_1K',
        teamAndFundingNotes: '',
      },
      founderRealityCheck: data.plan.founderRealityCheck || {
        industryConnection: 'LIVED_IT_INSIDER',
        personalIncomeUrgency: 'NO_RUSH_12M_PLUS',
        dealbreakers: [],
        growthTradeoff: 'BOOTSTRAP_100_CONTROL',
        biggestWorryPreset: 'WILL_THEY_PAY',
        biggestWorryNotes: '',
      },
      moduleABlindSpots: data.plan.thingsToConsider || [],
      whiteLabelEnabled: false,
      story: data.story,
      showUpcomingChaptersRoadmap: true,
    });

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeSlug =
      data.plan.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'startup';
    link.href = url;
    link.download = `${safeSlug}-cohort-master-document.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Print PDF
  const handlePrintPdf = () => {
    window.print();
  };

  // Copy Markdown
  const handleCopyMarkdown = async () => {
    const md = buildMasterDocumentMarkdown({
      plan: data.plan,
      founderName: data.startup.founders,
      brainDumpText: data.plan.brainDumpText || '',
      conceptCanvas: data.plan.conceptCanvas || {
        coreProblem: '',
        targetCustomer: '',
        proposedSolution: '',
        unfairAdvantage: '',
        revenueAndGrantFit: '',
      },
      founderMotivation: data.plan.founderMotivation || {
        primaryMotivation: 'SCALE_STARTUP',
        weeklyHoursAvailable: '40_PLUS_HRS',
        twelveMonthSuccessVision: '',
      },
      teamAndBudget: data.plan.teamAndBudget || {
        teamStructureType: 'SOLO_FOUNDER',
        skillCoverage: 'BUILD_IN_HOUSE',
        startingBudgetBracket: 'UNDER_1K',
        teamAndFundingNotes: '',
      },
      founderRealityCheck: data.plan.founderRealityCheck || {
        industryConnection: 'LIVED_IT_INSIDER',
        personalIncomeUrgency: 'NO_RUSH_12M_PLUS',
        dealbreakers: [],
        growthTradeoff: 'BOOTSTRAP_100_CONTROL',
        biggestWorryPreset: 'WILL_THEY_PAY',
        biggestWorryNotes: '',
      },
      moduleABlindSpots: data.plan.thingsToConsider || [],
      whiteLabelEnabled: false,
      story: data.story,
      showUpcomingChaptersRoadmap: true,
    });

    try {
      await navigator.clipboard.writeText(md);
      setCopiedMarkdown(true);
      setTimeout(() => setCopiedMarkdown(false), 2500);
    } catch {
      // Fallback
    }
  };

  const cohortBackUrl = `/cohort-portal/${data.cohort.id}`;

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100">
      {/* =================================================================== */}
      {/* 1. STICKY TOP COHORT DIRECTOR COMMAND HEADER                        */}
      {/* =================================================================== */}
      <header className="print:hidden sticky top-0 z-40 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          {/* Left Cluster: Back Button + Breadcrumb */}
          <div className="flex items-center gap-3">
            <Link href={cohortBackUrl}>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 gap-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Cohort Command Center</span>
              </Button>
            </Link>

            <span className="hidden text-slate-600 sm:inline">/</span>

            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-xs font-medium text-slate-400">
                {data.cohort.organizationName || data.cohort.name}
              </span>
              <span className="text-slate-600">›</span>
              <span className="text-xs font-bold text-white">
                {data.plan.title}
              </span>
            </div>
          </div>

          {/* Center / Right: Venture Switcher + Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Multi-Venture Switcher Dropdown (if founder has > 1 plans in cohort) */}
            {data.founderPlans && data.founderPlans.length > 1 ? (
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2 py-1 text-xs">
                <Layers className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                <span className="hidden text-[11px] text-slate-400 lg:inline">
                  Venture:
                </span>
                <select
                  aria-label="Switch Venture Plan"
                  value={data.plan.id}
                  onChange={(e) => handleVentureChange(e.target.value)}
                  className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
                >
                  {data.founderPlans.map((p: CohortFounderPlanSummary) => (
                    <option
                      key={p.id}
                      value={p.id}
                      className="bg-slate-900 text-white"
                    >
                      {p.title} {p.isPivot ? '(Pivot)' : '(Primary)'} —{' '}
                      {p.overallProgress}%
                    </option>
                  ))}
                </select>
                <Badge
                  variant="outline"
                  className="ml-1 border-indigo-500/40 bg-indigo-500/10 text-[10px] text-indigo-300"
                >
                  {data.founderPlans.length} in Batch
                </Badge>
              </div>
            ) : (
              <Badge
                variant="outline"
                className="border-slate-700 bg-slate-800 text-[11px] text-slate-300"
              >
                {data.plan.isPivot ? 'Pivoted Venture' : 'Primary Venture'}
              </Badge>
            )}

            {/* Print / Save PDF */}
            <Button
              size="sm"
              onClick={handlePrintPdf}
              className="h-8 bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              <Printer className="mr-1.5 h-3.5 w-3.5" />
              <span>Print / PDF</span>
            </Button>

            {/* Standalone HTML Brief */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadHtml}
              className="h-8 border-slate-700 bg-slate-800 text-xs text-slate-200 hover:bg-slate-700 hover:text-white"
            >
              <Download className="mr-1.5 h-3.5 w-3.5 text-indigo-300" />
              <span className="hidden sm:inline">Download</span> .HTML
            </Button>

            {/* Copy Markdown */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyMarkdown}
              className="h-8 border-slate-700 bg-slate-800 text-xs text-slate-200 hover:bg-slate-700 hover:text-white"
            >
              {copiedMarkdown ? (
                <>
                  <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Copy</span> MD
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* =================================================================== */}
      {/* 2. MAIN CONTENT CONTAINER                                           */}
      {/* =================================================================== */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
        {/* Top Mentor Context Banner */}
        <div className="print:hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg backdrop-blur-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            {/* Founder Identity & Batch Details */}
            <div className="flex items-center gap-3">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-base font-bold text-white shadow-md ${data.startup.avatarBg}`}
              >
                {data.startup.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg font-bold text-white sm:text-xl">
                    {data.plan.title}
                  </h1>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-semibold ${data.startup.statusBadge.bg}`}
                  >
                    <span
                      className={`mr-1.5 h-1.5 w-1.5 rounded-full ${data.startup.statusBadge.dot}`}
                    />
                    {data.startup.statusBadge.label}
                  </Badge>
                  {data.plan.isPivot && (
                    <Badge
                      variant="outline"
                      className="border-amber-500/40 bg-amber-500/10 text-[10px] text-amber-300"
                    >
                      Pivoted Venture
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-400">
                  Founder:{' '}
                  <span className="font-semibold text-slate-200">
                    {data.startup.founders}
                  </span>{' '}
                  ({data.startup.founderEmail || 'Cohort Participant'}) •{' '}
                  <span>HQ: {data.facts.countryName}</span> •{' '}
                  <span className="text-emerald-400 font-mono">
                    {data.startup.surveyResponsesCount} Verified Survey Proofs
                  </span>
                </p>
              </div>
            </div>

            {/* Quick Metrics Cluster */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-2 text-right">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Target Grant / Capital
                </div>
                <div className="text-sm font-bold text-emerald-400 font-mono">
                  {data.startup.targetGrantAmount}
                </div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-2 text-right">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Blueprint Progress
                </div>
                <div className="text-sm font-bold text-indigo-400 font-mono">
                  {data.facts.overallCompletionPercent}% Assembled
                </div>
              </div>
            </div>
          </div>

          {/* Verified Work Email & Domain Details (if available) */}
          {(data.startup.verifiedDomain || data.startup.verifiedWorkEmail) && (
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-800/80 pt-3 text-xs text-slate-300">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Verified Infrastructure:
              </span>
              {data.startup.verifiedDomain && (
                <div className="flex items-center gap-1 text-slate-200">
                  <Globe className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="font-mono text-xs">
                    {data.startup.verifiedDomain}
                  </span>
                </div>
              )}
              {data.startup.verifiedWorkEmail && (
                <div className="flex items-center gap-1 text-slate-200">
                  <Mail className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="font-mono text-xs">
                    {data.startup.verifiedWorkEmail}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Milestone Claim & Approval Action Banner */}
        {milestoneStatus === 'CLAIMED_PARTNER_NOTIFIED' && (
          <div className="print:hidden rounded-2xl border border-amber-500/50 bg-amber-950/40 p-4 sm:p-5 shadow-lg">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-amber-400" />
                  <span className="font-bold text-amber-200 text-sm">
                    Founder Has Claimed Batch Milestone Perk
                  </span>
                  <Badge
                    variant="outline"
                    className="border-amber-500/60 bg-amber-500/20 text-amber-200 text-[10px]"
                  >
                    Action Needed
                  </Badge>
                </div>
                <p className="text-xs text-amber-300/80 max-w-2xl leading-relaxed">
                  The founder verified domain and email infrastructure and
                  requested their batch cloud credits / sponsor perk. Review
                  their Master Document below to ensure minimum completion, then
                  click approve to activate their reward code.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  disabled={isApprovingMilestone}
                  onClick={handleApproveMilestone}
                  className="h-8 bg-emerald-600 font-semibold text-xs text-white hover:bg-emerald-500 shadow-sm"
                >
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                  {isApprovingMilestone
                    ? 'Activating...'
                    : 'Approve & Activate Perk'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Milestone Approved Banner */}
        {(milestoneStatus === 'REWARD_ACTIVATED' ||
          milestoneApprovedMessage) && (
          <div className="print:hidden rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3 text-xs text-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-400" />
              <span>
                Batch Milestone Reward Approved and Activated for this startup.
              </span>
            </div>
            <Badge
              variant="outline"
              className="border-emerald-500/50 bg-emerald-500/20 text-emerald-300 text-[10px]"
            >
              Perk Active
            </Badge>
          </div>
        )}

        {/* Director & Mentor Intelligence Notes Card */}
        <div className="print:hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-indigo-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Director &amp; Mentor Private Notes
              </h2>
              <span className="text-[11px] text-slate-400">
                (Visible only to Cohort Staff &amp; Mentors)
              </span>
            </div>
            {noteSavedMessage && (
              <span className="text-xs font-semibold text-emerald-400 animate-pulse">
                ✓ {noteSavedMessage}
              </span>
            )}
          </div>
          <div className="mt-3">
            <textarea
              aria-label="Mentor Notes"
              rows={3}
              value={mentorNote}
              onChange={(e) => setMentorNote(e.target.value)}
              placeholder="Record 1-on-1 mentor observations, grant readiness red flags, pilot milestone targets, or next session action items for this startup..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="mt-2.5 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Auto-saved notes appear in the cohort batch leaderboard export.
              </span>
              <Button
                size="sm"
                disabled={isSavingNote}
                onClick={handleSaveMentorNote}
                className="h-7 bg-indigo-600 px-3 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                <Save className="mr-1.5 h-3 w-3" />
                {isSavingNote ? 'Saving...' : 'Save Mentor Note'}
              </Button>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 3. THE MASTER DOCUMENT WORKSPACE (READ-ONLY FOR DIRECTORS/MENTORS) */}
        {/* ================================================================= */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-2 sm:p-4 shadow-xl">
          <MasterDocumentWorkspace
            plan={data.plan}
            founderName={data.startup.founders || 'Founder'}
            brainDumpText={data.plan.brainDumpText || ''}
            conceptCanvas={
              data.plan.conceptCanvas || {
                coreProblem: '',
                targetCustomer: '',
                proposedSolution: '',
                unfairAdvantage: '',
                revenueAndGrantFit: '',
              }
            }
            founderMotivation={
              data.plan.founderMotivation || {
                primaryMotivation: 'SCALE_STARTUP',
                weeklyHoursAvailable: '40_PLUS_HRS',
                twelveMonthSuccessVision: '',
              }
            }
            teamAndBudget={
              data.plan.teamAndBudget || {
                teamStructureType: 'SOLO_FOUNDER',
                skillCoverage: 'BUILD_IN_HOUSE',
                startingBudgetBracket: 'UNDER_1K',
                teamAndFundingNotes: '',
              }
            }
            founderRealityCheck={
              data.plan.founderRealityCheck || {
                industryConnection: 'LIVED_IT_INSIDER',
                personalIncomeUrgency: 'NO_RUSH_12M_PLUS',
                dealbreakers: [],
                growthTradeoff: 'BOOTSTRAP_100_CONTROL',
                biggestWorryPreset: 'WILL_THEY_PAY',
                biggestWorryNotes: '',
              }
            }
            moduleABlindSpots={data.plan.thingsToConsider || []}
            whiteLabelEnabled={false}
            isVaultReadonly={true}
            isMentorView={true}
            onJumpToModule={(moduleCode) => {
              window.open(
                `/workspace?planId=${data.plan.id}&module=${moduleCode}`,
                '_blank'
              );
            }}
            onSaveMasterDocumentData={async () => {
              // Read-only in director review mode
            }}
            onWeaveStoryWithAi={async () => ({
              allowed: false,
              reason: 'Read-only mentor review mode',
              story: data.story,
              engineMode: 'smart-synthesizer',
            })}
          />
        </div>
      </main>
    </div>
  );
}
