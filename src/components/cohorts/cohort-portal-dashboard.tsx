'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Users,
  Target,
  Copy,
  ExternalLink,
  FileText,
  Check,
  Gift,
  Search,
  MessageSquare,
  ShieldCheck,
  ArrowUpRight,
  ArrowRight,
  Layers,
  RefreshCw,
  Building2,
  Globe,
  Mail,
  HelpCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type {
  CohortPortalData,
  CohortPortalStartup,
} from '@/app/actions/cohort-portal';
import {
  updateCohortStartupMentorNoteAction,
  reviewCohortMilestoneClaimAction,
} from '@/app/actions/cohort-portal';

interface CohortPortalDashboardProps {
  initialData: CohortPortalData;
}

export function CohortPortalDashboard({ initialData }: CohortPortalDashboardProps) {
  const [data, setData] = useState<CohortPortalData>(initialData);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const isCohortEmpty = data.startups.length === 0;
  const currentStartups =
    isCohortEmpty && isPreviewMode && data.sampleStartups
      ? data.sampleStartups
      : data.startups;

  const [selectedStartupId, setSelectedStartupId] = useState<string>(
    currentStartups[0]?.id || ''
  );

  // Group counts of ventures per founder to show multi-venture badges
  const founderPlanCounts = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const s of currentStartups) {
      const key = (s.founderEmail || s.founders || '').toLowerCase().trim();
      if (key) {
        map.set(key, (map.get(key) || 0) + 1);
      }
    }
    return map;
  }, [currentStartups]);

  // Sync selected startup if preview mode toggles
  React.useEffect(() => {
    if (currentStartups.length > 0 && !currentStartups.some((s) => s.id === selectedStartupId)) {
      setSelectedStartupId(currentStartups[0]?.id || '');
    }
  }, [currentStartups, selectedStartupId]);

  const [filter, setFilter] = useState<
    'ALL' | 'GRANT_READY' | 'ON_TRACK' | 'NEEDS_ATTENTION' | 'MILESTONE_CLAIMED'
  >('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Mentor Note state
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Approval state
  const [isApproving, setIsApproving] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Dynamic Aggregates based on active view
  const effectiveAggregates =
    isCohortEmpty && isPreviewMode && data.sampleStartups
      ? {
          totalStartups: data.sampleStartups.length,
          averageBatchProgress: Math.round(
            data.sampleStartups.reduce((sum, s) => sum + s.overallProgress, 0) /
              data.sampleStartups.length
          ),
          grantReadyCount: data.sampleStartups.filter((s) => s.overallProgress >= 80).length,
          customerSignalsTotal: data.sampleStartups.reduce(
            (sum, s) => sum + s.surveyResponsesCount,
            0
          ),
          milestoneClaimsPendingCount: data.sampleStartups.filter(
            (s) => s.milestoneStatus === 'CLAIMED_PARTNER_NOTIFIED'
          ).length,
          milestoneClaimsApprovedCount: data.sampleStartups.filter(
            (s) => s.milestoneStatus === 'REWARD_ACTIVATED'
          ).length,
          attentionNeededCount: data.sampleStartups.filter(
            (s) => s.status === 'NEEDS_ATTENTION'
          ).length,
        }
      : data.aggregates;

  // Filtered Startups
  const filteredStartups = currentStartups.filter((s) => {
    // Category / Status Filter
    if (filter === 'GRANT_READY' && s.status !== 'GRANT_READY') return false;
    if (filter === 'ON_TRACK' && s.status !== 'ON_TRACK') return false;
    if (filter === 'NEEDS_ATTENTION' && s.status !== 'NEEDS_ATTENTION') return false;
    if (
      filter === 'MILESTONE_CLAIMED' &&
      s.milestoneStatus !== 'CLAIMED_PARTNER_NOTIFIED' &&
      s.milestoneStatus !== 'REWARD_ACTIVATED'
    ) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = s.name.toLowerCase().includes(q);
      const matchFounders = s.founders.toLowerCase().includes(q);
      const matchCategory = s.category.toLowerCase().includes(q);
      const matchOneLiner = s.oneLiner.toLowerCase().includes(q);
      return matchName || matchFounders || matchCategory || matchOneLiner;
    }

    return true;
  });

  // Active Startup (prefers selected startup within filtered list, falling back to first visible)
  const activeStartup =
    filteredStartups.find((s) => s.id === selectedStartupId) ||
    filteredStartups[0] ||
    currentStartups[0];

  // Set note text when startup changes
  React.useEffect(() => {
    if (activeStartup) {
      setNoteText(activeStartup.mentorNotes || '');
      setEditingNote(false);
    }
  }, [activeStartup?.id]);

  const magicOnboardingUrl = `https://startuppreflight.com/register?cohort=${data.cohort.inviteCode}`;

  function triggerNotify(type: 'success' | 'error', message: string) {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  }

  // Handle Save Mentor Note
  async function handleSaveMentorNote() {
    if (!activeStartup) return;
    setIsSavingNote(true);
    try {
      const res = await updateCohortStartupMentorNoteAction({
        planId: activeStartup.id,
        mentorNote: noteText,
      });

      if (res.success) {
        // Update local state
        setData((prev) => ({
          ...prev,
          startups: prev.startups.map((s) =>
            s.id === activeStartup.id ? { ...s, mentorNotes: noteText } : s
          ),
        }));
        setEditingNote(false);
        triggerNotify('success', 'Mentor intelligence note saved successfully.');
      } else {
        triggerNotify('error', res.error || 'Failed to save mentor note.');
      }
    } catch {
      triggerNotify('error', 'An unexpected error occurred while saving.');
    } finally {
      setIsSavingNote(false);
    }
  }

  // Handle Milestone Approval
  async function handleApproveMilestone(planId: string) {
    setIsApproving(true);
    try {
      const res = await reviewCohortMilestoneClaimAction({
        planId,
        decision: 'APPROVE',
        approvalNotes: 'Approved by Cohort Director via Institutional Command Center.',
      });

      if (res.success) {
        setData((prev) => ({
          ...prev,
          startups: prev.startups.map((s) =>
            s.id === planId
              ? {
                  ...s,
                  milestoneStatus: 'REWARD_ACTIVATED',
                  status: 'MILESTONE_CLAIMED',
                  statusBadge: {
                    label: 'Milestone Activated 🎁',
                    bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                    dot: 'bg-emerald-500',
                  },
                }
              : s
          ),
        }));
        triggerNotify('success', 'Milestone Reward approved & activated! Founder has been notified.');
      } else {
        triggerNotify('error', res.error || 'Failed to approve milestone.');
      }
    } catch {
      triggerNotify('error', 'Unexpected error approving milestone.');
    } finally {
      setIsApproving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-indigo-600 selection:text-white">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/95 px-4 py-3 text-xs shadow-2xl backdrop-blur-md animate-in slide-in-from-top-2">
          {notification.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
          )}
          <span className="text-slate-200 font-medium">{notification.message}</span>
        </div>
      )}

      {/* Top Banner if Demo Route */}
      {data.isSampleData && (
        <div className="border-b border-indigo-500/30 bg-gradient-to-r from-indigo-950/80 via-slate-900 to-indigo-950/80 px-4 py-2.5 text-xs text-indigo-200 sm:px-6">
          <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
              <span className="font-semibold text-white">Interactive Demo Mode:</span>
              <span>
                Simulated NovaUCD &amp; Trinity Tangent venture batch command center.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(magicOnboardingUrl);
                  triggerNotify('success', `Copied registration link: ${magicOnboardingUrl}`);
                }}
                className="h-7 text-[11px] border-indigo-400/40 bg-indigo-500/10 text-indigo-200 hover:bg-indigo-500/20"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy Batch Onboarding Link
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Top Banner if User explicitly toggled Preview Mode on an empty cohort */}
      {isCohortEmpty && isPreviewMode && (
        <div className="border-b border-purple-500/30 bg-gradient-to-r from-purple-950/90 via-slate-900 to-purple-950/90 px-4 py-2.5 text-xs text-purple-200 sm:px-6">
          <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Eye className="h-3.5 w-3.5 text-purple-400 shrink-0" />
              <span className="font-semibold text-white">Sample Batch Preview Active:</span>
              <span>
                Viewing simulated startup data to test filters and inspection features. 
                Your live cohort (<strong className="text-white">{data.cohort.name}</strong>) currently has 0 registered startups.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsPreviewMode(false)}
                className="h-7 text-[11px] border-purple-400/40 bg-purple-500/20 text-purple-200 hover:bg-purple-500/30"
              >
                <EyeOff className="h-3 w-3 mr-1" />
                Exit Preview Mode
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">
        {/* Navigation & Header Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 shadow-xs">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                  {data.cohort.organizationName}
                </span>
                <span className="text-slate-600">•</span>
                <Badge
                  variant="outline"
                  className="border-indigo-500/40 bg-indigo-500/10 text-indigo-300 text-[10px] font-mono"
                >
                  {data.cohort.intakeType === 'ROLLING' ? '⚡ Rolling Intake' : '📅 Fixed Batch'}
                </Badge>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {data.cohort.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(magicOnboardingUrl);
                triggerNotify('success', `Copied Magic Link: ${magicOnboardingUrl}`);
              }}
              className="h-8 text-xs border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1 text-indigo-400" />
              Onboarding Link
            </Button>

            <Link href="/admin">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-slate-400 hover:text-white hover:bg-slate-800"
              >
                Admin Studio ↗
              </Button>
            </Link>
          </div>
        </div>

        {/* Interactive Command Center SaaS Card */}
        <div className="rounded-2xl border border-slate-700 bg-slate-950/90 shadow-2xl overflow-hidden backdrop-blur-xl">
          {/* Window Chrome Header */}
          <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
              </div>
              <div className="hidden h-4 w-px bg-slate-700 sm:block" />
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <Target className="h-4 w-4 text-indigo-400" />
                <span>Director Command Center</span>
                <Badge className="bg-indigo-600/30 text-indigo-300 border-indigo-500/40 text-[10px] font-mono">
                  {effectiveAggregates.totalStartups} Startups Enrolled
                  {isCohortEmpty && isPreviewMode ? ' (Preview)' : ''}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="hidden sm:inline">Last Synced: Real-Time</span>
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>

          {/* Top 4 Batch Metric Cards */}
          <div className="grid grid-cols-2 gap-px border-b border-slate-800 bg-slate-800/60 lg:grid-cols-4">
            {/* Metric 1 */}
            <div className="bg-slate-950 p-4 sm:p-5">
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Average Batch Progress
              </div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-white">
                  {effectiveAggregates.averageBatchProgress}%
                </span>
                <span className="text-[11px] font-semibold text-emerald-400">
                  {effectiveAggregates.totalStartups} active
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                  style={{ width: `${effectiveAggregates.averageBatchProgress}%` }}
                />
              </div>
            </div>

            {/* Metric 2 */}
            <div className="bg-slate-950 p-4 sm:p-5">
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Grant Pre-Flight Ready
              </div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-white">
                  {effectiveAggregates.grantReadyCount} / {effectiveAggregates.totalStartups}
                </span>
                <span className="text-[11px] text-slate-400">LEO &amp; Innovate UK</span>
              </div>
              <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>Zero 3-quote non-compliances</span>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="bg-slate-950 p-4 sm:p-5">
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Customer Signals Collected
              </div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-white">
                  {effectiveAggregates.customerSignalsTotal.toLocaleString()}
                </span>
                <span className="text-[11px] text-slate-400">responses</span>
              </div>
              <div className="mt-2 text-[11px] text-indigo-300">
                Across verified <code className="text-slate-300">/v/[slug]</code> Mom-Test surveys
              </div>
            </div>

            {/* Metric 4 */}
            <div className="bg-slate-950 p-4 sm:p-5">
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Milestone Rewards &amp; Alerts
              </div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-amber-400">
                  {effectiveAggregates.milestoneClaimsPendingCount + effectiveAggregates.attentionNeededCount} Active
                </span>
                <span className="text-[11px] text-slate-400">review queue</span>
              </div>
              <div className="mt-2 text-[11px] text-amber-300/90 flex items-center gap-1">
                <Gift className="h-3 w-3 text-amber-400" />
                <span>{effectiveAggregates.milestoneClaimsPendingCount} claims ready for director approval</span>
              </div>
            </div>
          </div>

          {/* Cohort Content: Empty State vs Live Batch Command Center */}
          {isCohortEmpty && !isPreviewMode ? (
            <div className="p-8 sm:p-14 border-t border-slate-800 bg-slate-950/70 flex flex-col items-center justify-center max-w-3xl mx-auto space-y-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 shadow-inner">
                <GraduationCap className="h-8 w-8" />
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Cohort Provisioned &amp; Ready for Founders
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  No Startups Enrolled in {data.cohort.name} Yet
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
                  Your cohort is live. Share your magic onboarding registration link with founders. Once they register, their real-time 12-module progress, customer survey signals, and milestone claim dossiers will stream here automatically.
                </p>
              </div>

              {/* Magic Link Box */}
              <div className="w-full rounded-xl border border-slate-700 bg-slate-900/90 p-4 sm:p-5 text-left space-y-3 shadow-lg">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-indigo-400" />
                    Magic Founder Onboarding Link
                  </span>
                  <span className="font-mono text-indigo-300 text-[11px] bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/60">
                    Code: {data.cohort.inviteCode}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={magicOnboardingUrl}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono text-slate-200 select-all focus:outline-none"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(magicOnboardingUrl);
                      triggerNotify('success', `Copied registration link: ${magicOnboardingUrl}`);
                    }}
                    className="h-9 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shrink-0"
                  >
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    Copy Link
                  </Button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                  <span>Capacity: <strong className="text-slate-200">{data.cohort.maxSeats} Seats</strong></span>
                  <span>Intake: <strong className="text-slate-200">{data.cohort.intakeType === 'ROLLING' ? 'Rolling Intake' : 'Fixed Batch'}</strong></span>
                  <span>Access: <strong className="text-slate-200">{data.cohort.accessDurationMonths} Months</strong></span>
                  {data.cohort.milestoneConfig && (
                    <span>
                      Milestone Gate: <strong className="text-indigo-300">{data.cohort.milestoneConfig.requiredProgressPercent}% Progress</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* 3 Steps Guide */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full text-left pt-2">
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3.5 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600/30 text-indigo-400 text-[10px] font-bold">1</span>
                    <span className="text-xs font-semibold text-white">Share Magic Link</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Founders register with code <code className="text-indigo-300">{data.cohort.inviteCode}</code> pre-filled and locked to your cohort.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3.5 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600/30 text-indigo-400 text-[10px] font-bold">2</span>
                    <span className="text-xs font-semibold text-white">Track Telemetry</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Watch customer survey signals, unit economics, and team alignment stream in.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3.5 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600/30 text-indigo-400 text-[10px] font-bold">3</span>
                    <span className="text-xs font-semibold text-white">Activate Rewards</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Review verified company domains and approve Google Cloud credits or grants with 1 click.
                  </p>
                </div>
              </div>

              {/* Optional Demo Preview Toggle */}
              {data.sampleStartups && data.sampleStartups.length > 0 && (
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsPreviewMode(true)}
                    className="text-xs border-slate-700 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1.5 text-indigo-400" />
                    Preview Command Center with 5 Sample Startups
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Filter and Search Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/60 p-4 sm:px-6">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFilter('ALL')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      filter === 'ALL'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-800/80 text-slate-400 hover:text-white'
                    }`}
                  >
                    All Startups ({currentStartups.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter('GRANT_READY')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      filter === 'GRANT_READY'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-800/80 text-slate-400 hover:text-white'
                    }`}
                  >
                    Grant-Ready ({effectiveAggregates.grantReadyCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter('ON_TRACK')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      filter === 'ON_TRACK'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-800/80 text-slate-400 hover:text-white'
                    }`}
                  >
                    In Progress ({currentStartups.filter((s) => s.status === 'ON_TRACK').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter('NEEDS_ATTENTION')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      filter === 'NEEDS_ATTENTION'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-800/80 text-slate-400 hover:text-white'
                    }`}
                  >
                    Needs Attention ({effectiveAggregates.attentionNeededCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter('MILESTONE_CLAIMED')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      filter === 'MILESTONE_CLAIMED'
                        ? 'bg-violet-600 text-white shadow-xs'
                        : 'bg-slate-800/80 text-slate-400 hover:text-white'
                    }`}
                  >
                    Milestone Claims ({effectiveAggregates.milestoneClaimsPendingCount + effectiveAggregates.milestoneClaimsApprovedCount})
                  </button>
                </div>

                <div className="w-full sm:w-64 relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Filter startup or founder..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

          {/* Main Interactive Grid: Startup Horizontal Bars (Left) + Selected Startup Dossier (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
            {/* Startups List with Horizontal Progress Graphs (7 cols) */}
            <div className="lg:col-span-7 divide-y divide-slate-800/70 overflow-hidden">
              <div className="bg-slate-900/40 px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:grid sm:grid-cols-12 gap-2">
                <div className="col-span-5">Startup &amp; Founders</div>
                <div className="col-span-4">12-Module Milestone Progress</div>
                <div className="col-span-3 text-right">Underwriting Status</div>
              </div>

              {filteredStartups.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No startups match the selected filter.
                </div>
              ) : (
                filteredStartups.map((startup) => {
                  const isSelected = activeStartup && startup.id === activeStartup.id;
                  const founderKey = (startup.founderEmail || startup.founders || '').toLowerCase().trim();
                  const ventureCount = founderPlanCounts.get(founderKey) || 1;
                  return (
                    <div
                      key={startup.id}
                      onClick={() => setSelectedStartupId(startup.id)}
                      className={`cursor-pointer p-4 transition ${
                        isSelected
                          ? 'bg-indigo-950/40 border-l-4 border-indigo-500'
                          : 'hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex flex-col gap-2.5 sm:grid sm:grid-cols-12 sm:items-center sm:gap-2">
                        {/* Startup Name & Founders */}
                        <div className="sm:col-span-5">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white ${startup.avatarBg}`}
                            >
                              {startup.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="truncate text-xs font-bold text-white">
                                  {startup.name}
                                </span>
                                {ventureCount > 1 && (
                                  <span
                                    className="inline-flex items-center gap-1 rounded bg-indigo-900/60 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-300 border border-indigo-700/50 shrink-0"
                                    title={`${startup.founders} has ${ventureCount} ventures enrolled in this batch`}
                                  >
                                    <Layers className="h-2.5 w-2.5" />
                                    {ventureCount} Ventures
                                  </span>
                                )}
                              </div>
                              <p className="truncate text-[11px] text-slate-400">
                                {startup.founders}
                              </p>
                              <p className="truncate text-[10px] text-indigo-300/80">
                                {startup.grantFocus}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Horizontal Progress Graph */}
                        <div className="sm:col-span-4">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-slate-200">
                              {startup.overallProgress}% Complete
                            </span>
                            <span className="text-[10px] text-slate-400 truncate max-w-[110px]">
                              {startup.currentModuleName.split(':')[0]}
                            </span>
                          </div>
                          {/* Segmented / Smooth Horizontal Progress Bar */}
                          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                startup.overallProgress === 100
                                  ? 'bg-emerald-500'
                                  : startup.status === 'NEEDS_ATTENTION'
                                    ? 'bg-amber-500'
                                    : startup.overallProgress > 70
                                      ? 'bg-indigo-500'
                                      : 'bg-blue-500'
                              }`}
                              style={{ width: `${startup.overallProgress}%` }}
                            />
                          </div>
                          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                            <span>Mod 1: Canvas</span>
                            <span>Mod 12: Grant</span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="sm:col-span-3 sm:text-right">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                              startup.status === 'GRANT_READY'
                                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                                : startup.status === 'NEEDS_ATTENTION'
                                  ? 'bg-amber-950/80 text-amber-300 border border-amber-700/60'
                                  : startup.milestoneStatus === 'CLAIMED_PARTNER_NOTIFIED'
                                    ? 'bg-amber-950/80 text-amber-300 border border-amber-700/60'
                                    : startup.milestoneStatus === 'REWARD_ACTIVATED'
                                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                                      : 'bg-indigo-950/80 text-indigo-300 border border-indigo-700/60'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                startup.status === 'GRANT_READY' || startup.milestoneStatus === 'REWARD_ACTIVATED'
                                  ? 'bg-emerald-400'
                                  : startup.status === 'NEEDS_ATTENTION' || startup.milestoneStatus === 'CLAIMED_PARTNER_NOTIFIED'
                                    ? 'bg-amber-400'
                                    : 'bg-indigo-400'
                              }`}
                            />
                            {startup.milestoneStatus === 'CLAIMED_PARTNER_NOTIFIED'
                              ? 'Claim Pending'
                              : startup.milestoneStatus === 'REWARD_ACTIVATED'
                                ? 'Reward Active'
                                : startup.status === 'GRANT_READY'
                                  ? 'Grant-Ready'
                                  : startup.status === 'NEEDS_ATTENTION'
                                    ? 'Alert: Equity'
                                    : 'In Progress'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Selected Startup Dossier Inspector (5 cols) */}
            {activeStartup ? (
              <div className="lg:col-span-5 bg-slate-950 p-5 sm:p-6 flex flex-col justify-between space-y-6">
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white ${activeStartup.avatarBg}`}
                      >
                        {activeStartup.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white">
                            {activeStartup.name}
                          </h3>
                          <Badge variant="outline" className="border-slate-700 text-slate-300 text-[10px]">
                            {activeStartup.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400">{activeStartup.founders}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Target Grant</div>
                      <div className="text-xs font-bold text-emerald-400">
                        {activeStartup.targetGrantAmount}
                      </div>
                    </div>
                  </div>

                  {/* Executive Concept */}
                  <div className="mt-4 rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 text-xs leading-relaxed text-slate-300">
                    <span className="font-semibold text-slate-200">Executive Concept:</span>{' '}
                    {activeStartup.oneLiner}
                  </div>

                  {/* Milestone Reward Gate Banner & Action */}
                  {data.cohort.milestoneConfig && (
                    <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-950/30 p-3 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-300 flex items-center gap-1.5 text-[11px]">
                          <Gift className="h-3.5 w-3.5 text-amber-400" />
                          <span>{data.cohort.milestoneConfig.rewardLabel}</span>
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            activeStartup.milestoneStatus === 'REWARD_ACTIVATED'
                              ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                              : activeStartup.milestoneStatus === 'CLAIMED_PARTNER_NOTIFIED'
                                ? 'border-amber-500/50 bg-amber-500/10 text-amber-300'
                                : 'border-slate-700 text-slate-400'
                          }`}
                        >
                          {activeStartup.milestoneStatus === 'REWARD_ACTIVATED'
                            ? 'Approved & Activated'
                            : activeStartup.milestoneStatus === 'CLAIMED_PARTNER_NOTIFIED'
                              ? 'Submitted for Review'
                              : 'In Progress'}
                        </Badge>
                      </div>

                      {/* Verified Work Email & Domain Details */}
                      {(activeStartup.verifiedDomain || activeStartup.verifiedWorkEmail) && (
                        <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-300">
                          {activeStartup.verifiedDomain && (
                            <div className="flex items-center gap-1 text-slate-300">
                              <Globe className="h-3 w-3 text-indigo-400" />
                              <span className="font-mono text-[10px] truncate">{activeStartup.verifiedDomain}</span>
                            </div>
                          )}
                          {activeStartup.verifiedWorkEmail && (
                            <div className="flex items-center gap-1 text-slate-300">
                              <Mail className="h-3 w-3 text-emerald-400" />
                              <span className="font-mono text-[10px] truncate">{activeStartup.verifiedWorkEmail}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Director Approval Button if Claimed and Pending */}
                      {activeStartup.milestoneStatus === 'CLAIMED_PARTNER_NOTIFIED' && (
                        <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between gap-2">
                          <span className="text-[11px] text-amber-200">
                            Founder claimed milestone reward.
                          </span>
                          <Button
                            type="button"
                            size="sm"
                            disabled={isApproving}
                            onClick={() => handleApproveMilestone(activeStartup.id)}
                            className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            {isApproving ? 'Activating...' : 'Approve & Activate Perk'}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 6-Module Milestone Progress Bars */}
                  <div className="mt-5 space-y-2.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Module Milestones
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div>
                        <div className="flex justify-between text-[11px] text-slate-300">
                          <span>1. Concept Canvas &amp; Market (A–B)</span>
                          <span className="font-mono text-emerald-400">
                            {activeStartup.modulesBreakdown.ideation}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${activeStartup.modulesBreakdown.ideation}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] text-slate-300">
                          <span>2. Customer Survey &amp; Mom-Test (C)</span>
                          <span className="font-mono text-indigo-400">
                            {activeStartup.modulesBreakdown.surveys}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${activeStartup.modulesBreakdown.surveys}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] text-slate-300">
                          <span>3. Product Build &amp; 3-Quote Concierge (D–E)</span>
                          <span className="font-mono text-blue-400">
                            {activeStartup.modulesBreakdown.product}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${activeStartup.modulesBreakdown.product}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] text-slate-300">
                          <span>4. Co-Founder Alignment &amp; Survival Budget (F)</span>
                          <span
                            className={`font-mono ${
                              activeStartup.modulesBreakdown.team < 60
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {activeStartup.modulesBreakdown.team}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              activeStartup.modulesBreakdown.team < 60
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${activeStartup.modulesBreakdown.team}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] text-slate-300">
                          <span>5. Pocket Profit 3-Yr Financials &amp; Cashflow (H–J)</span>
                          <span className="font-mono text-violet-400">
                            {activeStartup.modulesBreakdown.financials}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-violet-500 rounded-full"
                            style={{ width: `${activeStartup.modulesBreakdown.financials}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] text-slate-300">
                          <span>6. Official Grant Mode &amp; Audit (K–L)</span>
                          <span className="font-mono text-purple-400">
                            {activeStartup.modulesBreakdown.grantPack}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500 rounded-full"
                            style={{ width: `${activeStartup.modulesBreakdown.grantPack}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer Validation Proof Box */}
                  <div className="mt-5 space-y-2.5">
                    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-2.5 text-xs">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">
                        Customer Validation Proof
                      </div>
                      <div className="mt-0.5 text-slate-200">
                        <strong>{activeStartup.surveyResponsesCount} verified responses</strong> ·{' '}
                        {activeStartup.willingnessToPay}
                      </div>
                    </div>

                    {/* Mentor Intelligence Note / Edit Box */}
                    <div
                      className={`rounded-lg border p-2.5 text-xs ${
                        activeStartup.status === 'NEEDS_ATTENTION'
                          ? 'border-amber-700/60 bg-amber-950/40 text-amber-200'
                          : 'border-slate-800 bg-slate-900/50 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <span>Director &amp; Mentor Intelligence Note</span>
                        {!editingNote && (
                          <button
                            type="button"
                            onClick={() => setEditingNote(true)}
                            className="text-indigo-400 hover:text-indigo-300 lowercase text-[10px] font-sans"
                          >
                            [edit note]
                          </button>
                        )}
                      </div>

                      {editingNote ? (
                        <div className="mt-2 space-y-2">
                          <Textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Add your mentor observation or next step for this startup..."
                            rows={3}
                            className="text-xs bg-slate-950 border-slate-700 text-white placeholder-slate-500"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingNote(false)}
                              className="h-6 text-[10px] text-slate-400 hover:text-white"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              disabled={isSavingNote}
                              onClick={handleSaveMentorNote}
                              className="h-6 text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white"
                            >
                              {isSavingNote ? 'Saving...' : 'Save Note'}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-1 leading-relaxed">
                          {activeStartup.mentorNotes ||
                            activeStartup.mentorFlag ||
                            'No notes logged yet. Click [edit note] to record mentor observations or actions.'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div className="text-slate-400 text-[11px]">
                    Founder: <span className="text-slate-200">{activeStartup.founderEmail || activeStartup.founders}</span>
                  </div>
                  <Link
                    href={`/cohort-portal/${data.cohort.id}/startups/${activeStartup.id}`}
                  >
                    <Button
                      size="sm"
                      className="h-8 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
                    >
                      <FileText className="mr-1.5 h-3.5 w-3.5" />
                      <span>View Master Document</span>
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="lg:col-span-5 p-8 text-center text-xs text-slate-400">
                Select a startup to inspect its dossier.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  </div>
</div>
  );
}
