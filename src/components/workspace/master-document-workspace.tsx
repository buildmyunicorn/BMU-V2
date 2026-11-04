'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  Printer,
  Download,
  Copy,
  Check,
  Pencil,
  Save,
  ShieldCheck,
  Compass,
  BarChart3,
  MessageSquare,
  Wrench,
  Briefcase,
  Users,
  DollarSign,
  Megaphone,
  Scale,
  ArrowUpRight,
  Loader2,
  Eye,
  Lock,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPlanCurrency } from '@/lib/localization';
import type { BlindSpotItem } from '@/db/schema';
import type { ModuleCode } from '@/lib/entitlements';
import type {
  ActiveStartupPlan,
  SavedConceptCanvas,
  SavedFounderMotivation,
  SavedTeamAndBudget,
  SavedFounderRealityCheck,
  SavedMasterDocumentData,
} from '@/lib/auth/session-store';
import {
  formatInterviewChannel,
  formatInterviewCommitment,
  INTERVIEW_SIGNAL_LABELS,
} from '@/lib/export/module-c-brief';
import {
  extractMasterDocumentVerifiedFacts,
  buildDeterministicMasterStory,
  buildMasterDocumentMarkdown,
  buildMasterDocumentStandaloneHtml,
  sanitizeSurveyTerminologyForReader,
} from '@/lib/export/master-document-brief';

export interface MasterDocumentWorkspaceProps {
  plan: ActiveStartupPlan;
  founderName: string;
  brainDumpText: string;
  conceptCanvas: SavedConceptCanvas;
  founderMotivation: SavedFounderMotivation;
  teamAndBudget: SavedTeamAndBudget;
  founderRealityCheck: SavedFounderRealityCheck;
  moduleABlindSpots: BlindSpotItem[];
  whiteLabelEnabled?: boolean;
  isVaultReadonly?: boolean;
  onJumpToModule: (moduleCode: ModuleCode) => void;
  onSaveMasterDocumentData: (data: SavedMasterDocumentData) => Promise<void>;
  onWeaveStoryWithAi: (
    facts: ReturnType<typeof extractMasterDocumentVerifiedFacts>
  ) => Promise<{
    allowed: boolean;
    reason?: string;
    story: SavedMasterDocumentData;
    engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
  }>;
}

export function MasterDocumentWorkspace({
  plan,
  founderName,
  brainDumpText,
  conceptCanvas,
  founderMotivation,
  teamAndBudget,
  founderRealityCheck,
  moduleABlindSpots,
  whiteLabelEnabled = false,
  isVaultReadonly = false,
  onJumpToModule,
  onSaveMasterDocumentData,
  onWeaveStoryWithAi,
}: MasterDocumentWorkspaceProps) {
  const facts = extractMasterDocumentVerifiedFacts({
    plan,
    founderName,
    brainDumpText,
    conceptCanvas,
    founderMotivation,
    teamAndBudget,
    founderRealityCheck,
    moduleABlindSpots,
    whiteLabelEnabled,
  });

  const deterministicStory = buildDeterministicMasterStory(facts);

  // If the user has custom-edited or AI-weaved the story, use that; otherwise use live deterministic story
  const effectiveStory: SavedMasterDocumentData = plan.masterDocumentData
    ?.paragraph1OpportunityAndMarket
    ? {
        ...deterministicStory,
        ...plan.masterDocumentData,
        paragraph1OpportunityAndMarket: sanitizeSurveyTerminologyForReader(
          plan.masterDocumentData.paragraph1OpportunityAndMarket
        ),
        paragraph2ValidationAndProduct: sanitizeSurveyTerminologyForReader(
          plan.masterDocumentData.paragraph2ValidationAndProduct
        ),
        paragraph3OperationsAndExecution: sanitizeSurveyTerminologyForReader(
          plan.masterDocumentData.paragraph3OperationsAndExecution
        ),
        paragraph1Sources: deterministicStory.paragraph1Sources,
        paragraph2Sources: deterministicStory.paragraph2Sources,
        paragraph3Sources: deterministicStory.paragraph3Sources,
      }
    : deterministicStory;

  const [showUpcomingRoadmap, setShowUpcomingRoadmap] = useState<boolean>(
    Boolean(plan.masterDocumentData?.showUpcomingChaptersRoadmap)
  );
  const [isEditingStory, setIsEditingStory] = useState(false);
  const [draftP1, setDraftP1] = useState(
    effectiveStory.paragraph1OpportunityAndMarket
  );
  const [draftP2, setDraftP2] = useState(
    effectiveStory.paragraph2ValidationAndProduct
  );
  const [draftP3, setDraftP3] = useState(
    effectiveStory.paragraph3OperationsAndExecution
  );
  const [isWeavingStory, setIsWeavingStory] = useState(false);
  const [isSavingStory, setIsSavingStory] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditingStory) {
      setDraftP1(effectiveStory.paragraph1OpportunityAndMarket);
      setDraftP2(effectiveStory.paragraph2ValidationAndProduct);
      setDraftP3(effectiveStory.paragraph3OperationsAndExecution);
    }
  }, [
    plan.id,
    effectiveStory.paragraph1OpportunityAndMarket,
    effectiveStory.paragraph2ValidationAndProduct,
    effectiveStory.paragraph3OperationsAndExecution,
    isEditingStory,
  ]);

  function scrollToAnchor(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  async function handleWeaveWithAi() {
    setIsWeavingStory(true);
    setStatusBanner(null);
    try {
      const res = await onWeaveStoryWithAi(facts);
      if (res.allowed) {
        setDraftP1(res.story.paragraph1OpportunityAndMarket);
        setDraftP2(res.story.paragraph2ValidationAndProduct);
        setDraftP3(res.story.paragraph3OperationsAndExecution);
        setIsEditingStory(false);
        setStatusBanner(
          res.engineMode === 'gemini-2.5-flash'
            ? '✨ Cohesive Executive Story woven strictly from your saved inputs (Zero-Hallucination Verified)!'
            : '✨ Cohesive Executive Story updated from your verified workspace inputs!'
        );
      }
    } finally {
      setIsWeavingStory(false);
    }
  }

  async function handleSaveCustomStory() {
    setIsSavingStory(true);
    setStatusBanner(null);
    try {
      const updated: SavedMasterDocumentData = {
        ...effectiveStory,
        paragraph1OpportunityAndMarket:
          sanitizeSurveyTerminologyForReader(draftP1.trim()) ||
          deterministicStory.paragraph1OpportunityAndMarket,
        paragraph2ValidationAndProduct:
          sanitizeSurveyTerminologyForReader(draftP2.trim()) ||
          deterministicStory.paragraph2ValidationAndProduct,
        paragraph3OperationsAndExecution:
          sanitizeSurveyTerminologyForReader(draftP3.trim()) ||
          deterministicStory.paragraph3OperationsAndExecution,
        isCustomEdited: true,
        showUpcomingChaptersRoadmap: showUpcomingRoadmap,
        lastWeavedAt: new Date().toISOString(),
      };
      await onSaveMasterDocumentData(updated);
      setIsEditingStory(false);
      setStatusBanner('✅ Your Executive Story edits have been saved!');
    } finally {
      setIsSavingStory(false);
    }
  }

  async function handleToggleRoadmap(nextVal: boolean) {
    setShowUpcomingRoadmap(nextVal);
    await onSaveMasterDocumentData({
      ...effectiveStory,
      showUpcomingChaptersRoadmap: nextVal,
    }).catch(() => {});
  }

  function handleDownloadHtml() {
    const htmlContent = buildMasterDocumentStandaloneHtml({
      plan,
      founderName,
      brainDumpText,
      conceptCanvas,
      founderMotivation,
      teamAndBudget,
      founderRealityCheck,
      moduleABlindSpots,
      whiteLabelEnabled,
      story: effectiveStory,
      showUpcomingChaptersRoadmap: showUpcomingRoadmap,
    });
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeSlug =
      plan.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'startup';
    link.href = url;
    link.download = `${safeSlug}-master-business-blueprint.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStatusBanner(
      '📄 Downloaded your standalone Living Master Business Blueprint (.html)!'
    );
  }

  function handlePrintPdf() {
    const htmlContent = buildMasterDocumentStandaloneHtml({
      plan,
      founderName,
      brainDumpText,
      conceptCanvas,
      founderMotivation,
      teamAndBudget,
      founderRealityCheck,
      moduleABlindSpots,
      whiteLabelEnabled,
      story: effectiveStory,
      showUpcomingChaptersRoadmap: showUpcomingRoadmap,
    });
    const printWindow = window.open('', '_blank', 'width=980,height=820');
    if (!printWindow) {
      handleDownloadHtml();
      return;
    }
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }

  async function handleCopyMarkdown() {
    const md = buildMasterDocumentMarkdown({
      plan,
      founderName,
      brainDumpText,
      conceptCanvas,
      founderMotivation,
      teamAndBudget,
      founderRealityCheck,
      moduleABlindSpots,
      whiteLabelEnabled,
      story: effectiveStory,
      showUpcomingChaptersRoadmap: showUpcomingRoadmap,
    });
    try {
      await navigator.clipboard.writeText(md);
      setCopiedMarkdown(true);
      setStatusBanner(
        '📋 Copied your complete Living Master Business Blueprint to clipboard!'
      );
      setTimeout(() => setCopiedMarkdown(false), 3000);
    } catch {
      // Clipboard fallback
    }
  }

  const formattedDate = new Date().toLocaleDateString('en-IE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* =================================================================== */}
      {/* TOP MASTER DOCUMENT CONTROL BAR & CHAPTER JUMP NAVIGATION           */}
      {/* =================================================================== */}
      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 p-5 text-white shadow-md sm:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/25 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-indigo-200 ring-1 ring-indigo-400/30">
                <FileText className="h-3.5 w-3.5 text-indigo-300" />
                Living Master Blueprint
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-200 ring-1 ring-emerald-400/30">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                Zero-Hallucination Verified
              </span>
              <span className="text-xs text-slate-300">
                {facts.activeChaptersCount} of 12 Chapters Active (
                {facts.overallCompletionPercent}% Assembled)
              </span>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
              {facts.planTitle} — Whole-Picture Master Document
            </h1>
            <p className="text-xs text-slate-300 sm:text-sm">
              Prepared by <span className="font-semibold text-white">{facts.founderName}</span> •{' '}
              HQ: <span className="font-semibold text-white">{facts.countryName} ({facts.currency})</span> •{' '}
              Sector: <span className="font-semibold text-white">{facts.industryCategory}</span> •{' '}
              Updated {formattedDate}
            </p>
          </div>

          {/* Export Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onJumpToModule('MOD_L_BUSINESS_PLAN')}
              className="border-emerald-400/50 bg-emerald-500/20 text-xs font-bold text-emerald-100 hover:bg-emerald-500/30"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5 text-emerald-300" />
              Open Official Compiler (Mod L)
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handlePrintPdf}
              className="bg-white text-xs font-bold text-indigo-950 hover:bg-indigo-50"
            >
              <Printer className="mr-1.5 h-3.5 w-3.5 text-indigo-700" />
              Print / Save PDF
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleDownloadHtml}
              className="border-indigo-400/40 bg-indigo-900/40 text-xs text-white hover:bg-indigo-800/60"
            >
              <Download className="mr-1.5 h-3.5 w-3.5 text-indigo-200" />
              Download .HTML
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleCopyMarkdown}
              className="border-indigo-400/40 bg-indigo-900/40 text-xs text-white hover:bg-indigo-800/60"
            >
              {copiedMarkdown ? (
                <>
                  <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-300" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 h-3.5 w-3.5 text-indigo-200" />
                  Copy Markdown
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Chapter Jump Bar & Unstarted Chapters Toggle */}
        <div className="mt-4 flex flex-col justify-between gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-indigo-300">
              Jump to:
            </span>
            <button
              type="button"
              onClick={() => scrollToAnchor('master-doc-snapshot')}
              className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-white/20"
            >
              1. Executive Snapshot
            </button>
            <button
              type="button"
              onClick={() => scrollToAnchor('master-doc-story')}
              className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-white/20"
            >
              2. Cohesive Story
            </button>
            {facts.hasModuleA && (
              <button
                type="button"
                onClick={() => scrollToAnchor('master-doc-ch-a')}
                className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-100 ring-1 ring-emerald-400/30 transition hover:bg-emerald-500/30"
              >
                Ch 1: Concept (A)
              </button>
            )}
            {facts.hasModuleB && (
              <button
                type="button"
                onClick={() => scrollToAnchor('master-doc-ch-b')}
                className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-100 ring-1 ring-emerald-400/30 transition hover:bg-emerald-500/30"
              >
                Ch 2: Market (B)
              </button>
            )}
            {facts.hasModuleC && (
              <button
                type="button"
                onClick={() => scrollToAnchor('master-doc-ch-c')}
                className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-100 ring-1 ring-emerald-400/30 transition hover:bg-emerald-500/30"
              >
                Ch 3: Validation (C)
              </button>
            )}
            {facts.hasModuleD && (
              <button
                type="button"
                onClick={() => scrollToAnchor('master-doc-ch-d')}
                className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-100 ring-1 ring-emerald-400/30 transition hover:bg-emerald-500/30"
              >
                Ch 4: Product (D)
              </button>
            )}
            {facts.hasModuleE && (
              <button
                type="button"
                onClick={() => scrollToAnchor('master-doc-ch-e')}
                className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-100 ring-1 ring-emerald-400/30 transition hover:bg-emerald-500/30"
              >
                Ch 5: Operations (E)
              </button>
            )}
            {facts.hasModuleF && (
              <button
                type="button"
                onClick={() => scrollToAnchor('master-doc-ch-f')}
                className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-100 ring-1 ring-emerald-400/30 transition hover:bg-emerald-500/30"
              >
                Ch 6: Team (F)
              </button>
            )}
            {facts.hasModuleG && (
              <button
                type="button"
                onClick={() => scrollToAnchor('master-doc-ch-g')}
                className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-100 ring-1 ring-emerald-400/30 transition hover:bg-emerald-500/30"
              >
                Ch 7: Launchpad (G)
              </button>
            )}
            {facts.hasModuleH && (
              <button
                type="button"
                onClick={() => scrollToAnchor('master-doc-ch-h')}
                className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-100 ring-1 ring-emerald-400/30 transition hover:bg-emerald-500/30"
              >
                Ch 8: Revenue (H)
              </button>
            )}
            {facts.hasModuleI && (
              <button
                type="button"
                onClick={() => scrollToAnchor('master-doc-ch-i')}
                className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-100 ring-1 ring-emerald-400/30 transition hover:bg-emerald-500/30"
              >
                Ch 9: Marketing (I)
              </button>
            )}
            {facts.hasModuleJ && (
              <button
                type="button"
                onClick={() => scrollToAnchor('master-doc-ch-j')}
                className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-100 ring-1 ring-emerald-400/30 transition hover:bg-emerald-500/30"
              >
                Ch 10: Finance (J)
              </button>
            )}
            {facts.hasModuleK && (
              <button
                type="button"
                onClick={() => scrollToAnchor('master-doc-ch-k')}
                className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-100 ring-1 ring-emerald-400/30 transition hover:bg-emerald-500/30"
              >
                Ch 11: Grants (K)
              </button>
            )}
            {facts.hasModuleL && (
              <button
                type="button"
                onClick={() => scrollToAnchor('master-doc-ch12')}
                className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-100 ring-1 ring-emerald-400/30 transition hover:bg-emerald-500/30"
              >
                Ch 12: Compiler (L)
              </button>
            )}
          </div>
        </div>
      </div>

      {statusBanner && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-900 shadow-2xs">
          <span>{statusBanner}</span>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className="ml-3 text-emerald-700 hover:text-emerald-950"
          >
            ✕
          </button>
        </div>
      )}

      {/* =================================================================== */}
      {/* SECTION 1: 1-PAGE EXECUTIVE SNAPSHOT (100% DETERMINISTIC BENTO)     */}
      {/* =================================================================== */}
      <section
        id="master-doc-snapshot"
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6"
      >
        <div className="mb-4 flex flex-col justify-between gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-950 text-xs font-extrabold text-white">
              1
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                1-Page Executive Snapshot (Modules A–L)
              </h2>
              <p className="text-xs text-slate-500">
                100% deterministic summary pulled directly from your saved inputs across all 12 modules (Modules A–L).
              </p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="w-fit bg-slate-100 text-[11px] text-slate-700"
          >
            <ShieldCheck className="mr-1 h-3.5 w-3.5 text-indigo-600" />
            Direct Workspace Facts Only
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Card A: Concept & Founder Fit */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                  <Compass className="h-4 w-4" />
                  🎯 Concept &amp; Founder Fit (Module A)
                </span>
                <button
                  type="button"
                  onClick={() => onJumpToModule('MOD_A_IDEATION')}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  <Pencil className="h-3 w-3" />
                  Edit in Module A
                </button>
              </div>
              <dl className="space-y-2 text-sm text-slate-700">
                <div>
                  <dt className="inline font-semibold text-slate-900">Problem: </dt>
                  <dd className="inline">
                    {facts.coreProblem || 'Not yet entered in Module A.'}
                  </dd>
                </div>
                <div>
                  <dt className="inline font-semibold text-slate-900">Target Buyer: </dt>
                  <dd className="inline">
                    {facts.targetCustomer || 'Not yet entered in Module A.'}
                  </dd>
                </div>
                <div>
                  <dt className="inline font-semibold text-slate-900">Proposed Solution: </dt>
                  <dd className="inline">
                    {facts.proposedSolution || 'Not yet entered in Module A.'}
                  </dd>
                </div>
                <div>
                  <dt className="inline font-semibold text-slate-900">Founder Fit &amp; Budget: </dt>
                  <dd className="inline">
                    {[
                      facts.teamStructureLabel,
                      facts.weeklyHoursLabel,
                      facts.startingBudgetLabel,
                    ]
                      .filter(Boolean)
                      .join(' • ') || 'Not yet specified'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Card B: Market & Competitive Wedge */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                  <BarChart3 className="h-4 w-4" />
                  📊 Market &amp; Wedge (Module B)
                </span>
                <button
                  type="button"
                  onClick={() => onJumpToModule('MOD_B_MARKET')}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  <Pencil className="h-3 w-3" />
                  {facts.hasModuleB ? 'Edit in Module B' : 'Start Module B'}
                </button>
              </div>
              {facts.hasModuleB ? (
                <dl className="space-y-2 text-sm text-slate-700">
                  <div>
                    <dt className="inline font-semibold text-slate-900">Beachhead Buyer: </dt>
                    <dd className="inline">
                      {facts.beachheadSegment || '—'}{' '}
                      {facts.buyerModelLabel ? `(${facts.buyerModelLabel})` : ''}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold text-slate-900">Why Buyers Switch: </dt>
                    <dd className="inline">
                      {facts.whySwitchOneSentence || '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold text-slate-900">
                      Mapped Alternatives ({facts.competitorsCount}):{' '}
                    </dt>
                    <dd className="inline">
                      {facts.competitorNames.slice(0, 4).join(', ') || 'None listed'}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold text-slate-900">
                      Year 1–2 Target (SOM):{' '}
                    </dt>
                    <dd className="inline font-bold text-indigo-900">
                      {facts.somFormatted ? `${facts.somFormatted}/yr` : 'Not calculated yet'}
                    </dd>
                    {facts.samFormatted && (
                      <span className="text-slate-500">
                        {' '}
                        • Reachable SAM: {facts.samFormatted}/yr
                      </span>
                    )}
                  </div>
                </dl>
              ) : (
                <p className="text-sm italic text-slate-500">
                  Not yet populated. Complete Module B to add your beachhead persona, competitors, and bottom-up SOM/SAM market sizing.
                </p>
              )}
            </div>
          </div>

          {/* Card C: Customer Validation Proof (Plain English — no /v/[slug]) */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                  <MessageSquare className="h-4 w-4" />
                  💬 Validation Proof (Module C)
                </span>
                <button
                  type="button"
                  onClick={() => onJumpToModule('MOD_C_SURVEYS_FEEDBACK')}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  <Pencil className="h-3 w-3" />
                  {facts.hasModuleC ? 'Edit in Module C' : 'Start Module C'}
                </button>
              </div>
              {facts.hasModuleC ? (
                <dl className="space-y-2 text-sm text-slate-700">
                  <div>
                    <dt className="inline font-semibold text-slate-900">
                      Public Validation Surveys:{' '}
                    </dt>
                    <dd className="inline">
                      <span className="font-bold text-slate-900">
                        {facts.totalSurveyResponses}
                      </span>{' '}
                      response(s) across {facts.surveysCount} survey(s) (
                      <span className="font-semibold text-emerald-700">
                        {facts.waitlistOptInsCount} early waitlist signup(s)
                      </span>
                      )
                    </dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold text-slate-900">
                      1-on-1 Customer Interviews:{' '}
                    </dt>
                    <dd className="inline">
                      <span className="font-bold text-slate-900">
                        {facts.interviewsCount}
                      </span>{' '}
                      logged ({facts.strongSignalInterviewsCount} Strong Signal
                      {facts.avgInterviewPainScore
                        ? ` • ${facts.avgInterviewPainScore}/5 avg urgency`
                        : ''}
                      )
                    </dd>
                  </div>
                  {(facts.surveyHeadlineInsight || facts.sampleCustomerQuote) && (
                    <div>
                      <dt className="inline font-semibold text-slate-900">
                        Verified Signal:{' '}
                      </dt>
                      <dd className="inline">
                        {facts.surveyHeadlineInsight ||
                          `"${facts.sampleCustomerQuote}"`}
                      </dd>
                    </div>
                  )}
                </dl>
              ) : (
                <p className="text-sm italic text-slate-500">
                  Not yet populated. Use Module C to launch public validation surveys, collect waitlist leads, and log 1-on-1 customer interviews.
                </p>
              )}
            </div>
          </div>

          {/* Card D: What We're Building (Product & Scope) */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                  <Wrench className="h-4 w-4" />
                  🛠️ What We&apos;re Building (Module D)
                </span>
                <button
                  type="button"
                  onClick={() => onJumpToModule('MOD_D_PRODUCT_BUILD')}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  <Pencil className="h-3 w-3" />
                  {facts.hasModuleD ? 'Edit in Module D' : 'Start Module D'}
                </button>
              </div>
              {facts.hasModuleD ? (
                <dl className="space-y-2 text-sm text-slate-700">
                  <div>
                    <dt className="inline font-semibold text-slate-900">Product Vehicle: </dt>
                    <dd className="inline">
                      {facts.formFactorLabel || facts.productTrackLabel || '—'}{' '}
                      {facts.launchTimelineLabel
                        ? `• Target Launch: ${facts.launchTimelineLabel}`
                        : ''}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold text-slate-900">Channel Mix: </dt>
                    <dd className="inline">
                      {facts.ownedChannelsSharePercent}% Owned Direct /{' '}
                      {facts.rentedChannelsSharePercent}% Partner &amp; Rented
                    </dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold text-slate-900">
                      V1 Must-Haves ({facts.v1MustHaveTitles.length}):{' '}
                    </dt>
                    <dd className="inline">
                      {facts.v1MustHaveTitles.slice(0, 4).join(', ') || '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold text-slate-900">
                      Work Packages ({facts.workPackagesCount}):{' '}
                    </dt>
                    <dd className="inline font-semibold text-slate-900">
                      {formatPlanCurrency(
                        facts.totalWorkPackagesCost,
                        facts.currency
                      )}{' '}
                      estimated V1 build budget
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm italic text-slate-500">
                  Not yet populated. Complete Module D to define your product vehicle, channel strategy, V1 feature filter, and work packages.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Full-Width Card E: Operations, Equipment & Risk Posture */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-700">
              <Briefcase className="h-4 w-4" />
              ⚙️ Operations, Equipment &amp; Risk Posture (Module E)
            </span>
            <button
              type="button"
              onClick={() => onJumpToModule('MOD_E_OPERATIONS')}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
            >
              <Pencil className="h-3 w-3" />
              {facts.hasModuleE ? 'Edit in Module E' : 'Start Module E'}
            </button>
          </div>
          {facts.hasModuleE ? (
            <div className="grid grid-cols-1 gap-3 text-sm text-slate-700 md:grid-cols-3">
              <div>
                <div className="font-semibold text-slate-900">
                  Fulfillment &amp; Unit Capacity
                </div>
                <p className="mt-0.5">
                  {facts.fulfillmentModeLabel || '—'} • SLA:{' '}
                  {facts.turnaroundSlaLabel || '—'} •{' '}
                  <span className="font-semibold text-slate-900">
                    {facts.totalActiveMinutesPerOrder} mins
                  </span>{' '}
                  &amp;{' '}
                  <span className="font-semibold text-slate-900">
                    {formatPlanCurrency(
                      facts.totalDirectVariableCostPerOrder,
                      facts.currency
                    )}
                  </span>
                  /order (~{facts.maxWeeklyOrdersCapacity} orders/wk ceiling)
                </p>
              </div>
              <div>
                <div className="font-semibold text-slate-900">
                  Premises &amp; Equipment Schedule
                </div>
                <p className="mt-0.5">
                  {facts.premisesModeLabel || '—'} (
                  {formatPlanCurrency(facts.monthlyPremisesCost, facts.currency)}
                  /mo overhead) •{' '}
                  <span className="font-semibold text-slate-900">
                    {facts.equipmentItemsCount} asset(s)
                  </span>{' '}
                  totaling{' '}
                  <span className="font-semibold text-slate-900">
                    {formatPlanCurrency(
                      facts.totalEquipmentCapexExVat,
                      facts.currency
                    )}
                  </span>{' '}
                  ex-VAT
                </p>
              </div>
              <div>
                <div className="font-semibold text-slate-900">
                  Risk, QC &amp; Compliance Posture
                </div>
                <p className="mt-0.5">
                  {facts.riskItemsCount} formal project risk(s) •{' '}
                  {facts.qcCheckpointsCount} QC gate(s) •{' '}
                  {facts.complianceItemsCount} compliance item(s)
                  {facts.topRiskTitleAndMitigation
                    ? ` • Top risk: ${facts.topRiskTitleAndMitigation}`
                    : ''}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm italic text-slate-500">
              Not yet populated. Complete Module E to add your order fulfillment stages, equipment schedule, and 4-category project risk register.
            </p>
          )}
        </div>

        {/* Grid for Modules F, G, H, I, J, K */}
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Card F: Team, Survival Budget & 3-Year Hiring Plan */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                  <Users className="h-4 w-4" />
                  👥 Team, Survival &amp; Hiring (Module F)
                </span>
                <button
                  type="button"
                  onClick={() => onJumpToModule('MOD_F_COFOUNDER_TEAM')}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  <Pencil className="h-3 w-3" />
                  {facts.hasModuleF ? 'Edit in Module F' : 'Start Module F'}
                </button>
              </div>
              {facts.hasModuleF ? (
                <dl className="space-y-2 text-sm text-slate-700">
                  <div>
                    <dt className="inline font-semibold text-slate-900">Team Posture: </dt>
                    <dd className="inline">
                      {facts.teamStructurePostureLabel || '—'} ({facts.teamMembersCount} promoter(s) • {facts.hatsAssignedCount}/7 Startup Hats covered)
                    </dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold text-slate-900">Personal Survival Burn: </dt>
                    <dd className="inline">
                      {formatPlanCurrency(facts.monthlyNetSurvivalBurnTotal, facts.currency)}/mo net burn •{' '}
                      {formatPlanCurrency(facts.personalSavingsBufferTotal, facts.currency)} personal savings buffer
                    </dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold text-slate-900">3-Year Job Creation: </dt>
                    <dd className="inline font-semibold text-indigo-900">
                      {facts.plannedHiresCount} planned hire(s) mapped • {facts.advisorsCount} advisor(s)
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm italic text-slate-500">
                  Not yet populated. Complete Module F to add 150-word promoter profiles, personal survival budgets, 7 Startup Hats, and your 3-year hiring plan.
                </p>
              )}
            </div>
          </div>

          {/* Card G: Getting Set Up — Launchpad & Operations Readiness */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                  <ShieldCheck className="h-4 w-4" />
                  🚀 Launchpad &amp; Ops Setup (Module G)
                </span>
                <button
                  type="button"
                  onClick={() => onJumpToModule('MOD_G_LAUNCHPAD')}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  <Pencil className="h-3 w-3" />
                  {facts.hasModuleG ? 'Edit in Module G' : 'Start Module G'}
                </button>
              </div>
              {facts.hasModuleG ? (
                <dl className="space-y-2 text-sm text-slate-700">
                  <div>
                    <dt className="inline font-semibold text-slate-900">Ops Readiness Score: </dt>
                    <dd className="inline font-bold text-emerald-700">
                      {facts.opsReadinessPercent}% Ready across 6 pillars
                    </dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold text-slate-900">Legal Entity &amp; Domain: </dt>
                    <dd className="inline">
                      {facts.legalEntityStructureLabel || '—'}
                      {facts.registeredEntityName ? ` (${facts.registeredEntityName})` : ''} •{' '}
                      {facts.primaryDomain || 'Domain pending'}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold text-slate-900">Banking &amp; Bookkeeping: </dt>
                    <dd className="inline">
                      {facts.bankProviderLabel || 'Bank pending'}{' '}
                      {facts.hasDedicatedIban ? '(Dedicated IBAN)' : ''} •{' '}
                      {facts.accountingSoftwareLabel || 'Accounting pending'}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm italic text-slate-500">
                  Not yet populated. Complete Module G to track your 0–100% Operations Readiness across Incorporation, Domain/Email, Banking, Accounting, Insurance, and Legal/IP.
                </p>
              )}
            </div>
          </div>

          {/* Card H: Revenue Model, Pricing & 3-Year Pocket Profit */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                  <DollarSign className="h-4 w-4" />
                  💰 Pricing &amp; Pocket Profit (Module H)
                </span>
                <button
                  type="button"
                  onClick={() => onJumpToModule('MOD_H_REVENUE')}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  <Pencil className="h-3 w-3" />
                  {facts.hasModuleH ? 'Edit in Module H' : 'Start Module H'}
                </button>
              </div>
              {facts.hasModuleH ? (
                <dl className="space-y-2 text-sm text-slate-700">
                  <div>
                    <dt className="inline font-semibold text-slate-900">Revenue Vehicle &amp; Price: </dt>
                    <dd className="inline">
                      {facts.revenueModelVehicleLabel || '—'} ({facts.pricingTiersCount} tier(s) •{' '}
                      {formatPlanCurrency(facts.blendedAveragePriceNet, facts.currency)} blended net price)
                    </dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold text-slate-900">Year 1 Turnover &amp; Pocket Profit: </dt>
                    <dd className="inline font-bold text-indigo-900">
                      {formatPlanCurrency(facts.year1ProjectedNetTurnover, facts.currency)} Y1 net turnover ({facts.year1TargetCustomers} customers) →{' '}
                      {formatPlanCurrency(facts.year1PocketProfitNet, facts.currency)} Y1 Pocket Profit
                    </dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold text-slate-900">Y2–Y3 Trajectory &amp; Sales Motion: </dt>
                    <dd className="inline">
                      Y2: {formatPlanCurrency(facts.year2ProjectedNetTurnover, facts.currency)} • Y3:{' '}
                      {formatPlanCurrency(facts.year3ProjectedNetTurnover, facts.currency)} ({facts.primarySalesMotionLabel || '—'})
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm italic text-slate-500">
                  Not yet populated. Complete Module H to model your pricing tiers, written sales assumptions, and 3-year Pocket Profit breakeven.
                </p>
              )}
            </div>
          </div>

          {/* Card I: Marketing, 4Ps & First 10 Customers */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                  <Megaphone className="h-4 w-4" />
                  📣 Marketing, 4Ps &amp; First 10 (Module I)
                </span>
                <button
                  type="button"
                  onClick={() => onJumpToModule('MOD_I_MARKETING')}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  <Pencil className="h-3 w-3" />
                  {facts.hasModuleI ? 'Edit in Module I' : 'Start Module I'}
                </button>
              </div>
              {facts.hasModuleI ? (
                <dl className="space-y-2 text-sm text-slate-700">
                  <div>
                    <dt className="inline font-semibold text-slate-900">Elevator Hook: </dt>
                    <dd className="inline">{facts.elevatorHook140 || '—'}</dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold text-slate-900">First 10 Customers Playbook: </dt>
                    <dd className="inline">
                      {facts.first10ArchetypeLabel || '—'} ({facts.first10ProspectsCount} named prospects •{' '}
                      {facts.committedOrPilotProspectsCount} active pilot/committed)
                    </dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold text-slate-900">Unit Economics &amp; Budget: </dt>
                    <dd className="inline font-semibold text-slate-900">
                      {formatPlanCurrency(facts.monthlyMarketingBudget, facts.currency)}/mo budget • CAC:{' '}
                      {formatPlanCurrency(facts.calculatedCashCac, facts.currency)} • LTV:{' '}
                      {formatPlanCurrency(facts.calculatedLtv, facts.currency)} ({facts.calculatedLtvToCacRatio}x LTV:CAC)
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm italic text-slate-500">
                  Not yet populated. Complete Module I to build your brand positioning, 4Ps strategy, First 10 Customers tracker, and CAC/LTV marketing budget.
                </p>
              )}
            </div>
          </div>

          {/* Card J: 36-Month Financial Builder & Cashflow Trough */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                  <Scale className="h-4 w-4" />
                  📈 36-Month Financials &amp; Cashflow (Module J)
                </span>
                <button
                  type="button"
                  onClick={() => onJumpToModule('MOD_J_FINANCE')}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  <Pencil className="h-3 w-3" />
                  {facts.hasModuleJ ? 'Edit in Module J' : 'Start Module J'}
                </button>
              </div>
              {facts.hasModuleJ ? (
                <dl className="space-y-2 text-sm text-slate-700">
                  <div>
                    <dt className="inline font-semibold text-slate-900">Operating Cost Posture: </dt>
                    <dd className="inline">
                      {facts.operatingCostPostureLabel || '—'} ({formatPlanCurrency(facts.monthlyFixedOverheadsTotal, facts.currency)}/mo fixed overheads)
                    </dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold text-slate-900">Payroll &amp; Working Capital: </dt>
                    <dd className="inline">
                      {formatPlanCurrency(facts.monthlyFounderDrawingsYear1, facts.currency)}/mo founder drawings •{' '}
                      {formatPlanCurrency(facts.monthlyTeamSalariesYear1, facts.currency)}/mo Y1 team salaries •{' '}
                      {facts.customerCollectionTimingLabel || '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold text-slate-900">Day-1 Cash &amp; External Funding: </dt>
                    <dd className="inline font-semibold text-indigo-900">
                      {formatPlanCurrency(facts.startingCashBalanceDay1, facts.currency)} starting cash +{' '}
                      {formatPlanCurrency(facts.totalExternalFundingMapped, facts.currency)} external capital ({facts.primaryFundingStrategyLabel || '—'})
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm italic text-slate-500">
                  Not yet populated. Complete Module J to configure localized overheads, working capital timing, and your 36-month cashflow trough.
                </p>
              )}
            </div>
          </div>

          {/* Card K: Non-Dilutive Grants, Capital Stack & Tax Relief */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                  <Sparkles className="h-4 w-4" />
                  🏛️ Grants, Loans &amp; Tax Relief (Module K)
                </span>
                <button
                  type="button"
                  onClick={() => onJumpToModule('MOD_K_GRANTS_FUNDING')}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  <Pencil className="h-3 w-3" />
                  {facts.hasModuleK ? 'Edit in Module K' : 'Start Module K'}
                </button>
              </div>
              {facts.hasModuleK ? (
                <dl className="space-y-2 text-sm text-slate-700">
                  <div>
                    <dt className="inline font-semibold text-slate-900">Lead Programme &amp; Readiness: </dt>
                    <dd className="inline font-bold text-emerald-700">
                      {facts.selectedGrantKey || '—'} ({facts.overallAssessorReadinessScore}/100 Assessor Readiness)
                    </dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold text-slate-900">Capital Stack ({formatPlanCurrency(facts.totalTargetFundingGap, facts.currency)} Target): </dt>
                    <dd className="inline">
                      Cash: {formatPlanCurrency(facts.skinInTheGameCash, facts.currency)} ({facts.skinInTheGamePercent}%) • Grants:{' '}
                      {formatPlanCurrency(facts.totalGrantsAllocated, facts.currency)} • Loans:{' '}
                      {formatPlanCurrency(facts.totalLoansAllocated, facts.currency)} • Equity:{' '}
                      {formatPlanCurrency(facts.totalAngelAllocated, facts.currency)}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold text-slate-900">Reimbursement Bridge &amp; Tax Relief: </dt>
                    <dd className="inline">
                      {facts.bridgeStrategyLabel || '—'} ({facts.isAssessorLiquidityCompliant ? 'Liquidity Compliant' : 'Gap Flagged'}) •{' '}
                      {facts.primaryTaxScheme} ({formatPlanCurrency(facts.targetReliefRaiseAmount, facts.currency)})
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm italic text-slate-500">
                  Not yet populated. Complete Module K to score IE/UK grant readiness, build your non-dilutive capital stack, and verify reimbursement bridge liquidity.
                </p>
              )}
            </div>
          </div>

          {/* Card L: Official Grant & Business Plan Compiler */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                  <FileText className="h-4 w-4" />
                  📑 Grant &amp; Plan Compiler (Module L)
                </span>
                <button
                  type="button"
                  onClick={() => onJumpToModule('MOD_L_BUSINESS_PLAN')}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  <Pencil className="h-3 w-3" />
                  {facts.hasModuleL ? 'Edit in Module L' : 'Start Module L'}
                </button>
              </div>
              {facts.hasModuleL ? (
                <dl className="space-y-2 text-sm text-slate-700">
                  <div>
                    <dt className="inline font-semibold text-slate-900">Mode &amp; Committee: </dt>
                    <dd className="inline font-medium text-indigo-900">
                      {facts.compilerModeLabel} ({facts.targetAgencyOrCommitteeName})
                    </dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold text-slate-900">Contradiction Audit Score: </dt>
                    <dd className="inline font-bold text-emerald-700">
                      {facts.contradictionAuditScore}/100 Pre-Flight Clearance ({facts.auditPassedCount} Passed, {facts.auditWarningCount} Warnings)
                    </dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold text-slate-900">Narrative &amp; Proof Binder: </dt>
                    <dd className="inline">
                      {facts.compiledSectionsCount} question(s) compiled (~{facts.totalCompiledWordCount.toLocaleString()} words) •{' '}
                      {facts.appendicesReadyCount}/{facts.totalAppendicesCount} appendices ready ({facts.committeeReadinessScore}/100 Committee Ready)
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm italic text-slate-500">
                  Not yet compiled. Complete Module L to run your Pre-Flight Contradiction Audit, auto-compile official submission narratives, and assemble Appendices A–F.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* SECTION 2: COHESIVE EXECUTIVE STORY (STRICT ZERO-HALLUCINATION)     */}
      {/* =================================================================== */}
      <section
        id="master-doc-story"
        className="rounded-2xl border border-indigo-200 bg-white p-5 shadow-xs sm:p-6"
      >
        <div className="mb-4 flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-950 text-xs font-extrabold text-white">
              2
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                  Cohesive Executive Story (Modules A–K)
                </h2>
                <Badge className="bg-emerald-50 text-[10px] font-semibold text-emerald-800 border-emerald-200">
                  <Lock className="mr-1 h-3 w-3 text-emerald-600" />
                  Zero-Hallucination Grounded
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Weaves your verified inputs across Modules A–K into a smooth 3-paragraph narrative without inventing a single fact.
              </p>
            </div>
          </div>

          {!isVaultReadonly && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleWeaveWithAi}
                disabled={isWeavingStory}
                className="bg-gradient-to-r from-indigo-600 to-violet-600 text-xs text-white hover:from-indigo-700 hover:to-violet-700"
              >
                {isWeavingStory ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Weaving from Saved Facts...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    Weave / Refresh Story from Saved Inputs
                  </>
                )}
              </Button>
              {!isEditingStory ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditingStory(true)}
                  className="text-xs"
                >
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Edit Story Text
                </Button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveCustomStory}
                    disabled={isSavingStory}
                    className="bg-emerald-600 text-xs text-white hover:bg-emerald-700"
                  >
                    <Save className="mr-1.5 h-3.5 w-3.5" />
                    {isSavingStory ? 'Saving...' : 'Save Story'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsEditingStory(false);
                      setDraftP1(effectiveStory.paragraph1OpportunityAndMarket);
                      setDraftP2(effectiveStory.paragraph2ValidationAndProduct);
                      setDraftP3(effectiveStory.paragraph3OperationsAndExecution);
                    }}
                    className="text-xs text-slate-600"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Paragraph 1 */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-700">
              Paragraph 1 • The Opportunity, Customer Pain &amp; Market Wedge
            </div>
            {isEditingStory ? (
              <textarea
                rows={4}
                value={draftP1}
                onChange={(e) => setDraftP1(e.target.value)}
                className="w-full rounded-lg border border-indigo-200 bg-white p-3 text-base leading-relaxed text-slate-800 focus:border-indigo-500 focus:outline-hidden sm:text-sm"
              />
            ) : (
              <p className="text-sm leading-relaxed text-slate-800">
                {effectiveStory.paragraph1OpportunityAndMarket}
              </p>
            )}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500">
                🔒 Grounded strictly in:
              </span>
              {effectiveStory.paragraph1Sources.map((src) => (
                <span
                  key={src}
                  className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-800 ring-1 ring-indigo-200/80"
                >
                  {src}
                </span>
              ))}
            </div>
          </div>

          {/* Paragraph 2 */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-700">
              Paragraph 2 • Customer Validation &amp; V1 Product Architecture
            </div>
            {isEditingStory ? (
              <textarea
                rows={4}
                value={draftP2}
                onChange={(e) => setDraftP2(e.target.value)}
                className="w-full rounded-lg border border-indigo-200 bg-white p-3 text-base leading-relaxed text-slate-800 focus:border-indigo-500 focus:outline-hidden sm:text-sm"
              />
            ) : (
              <p className="text-sm leading-relaxed text-slate-800">
                {effectiveStory.paragraph2ValidationAndProduct}
              </p>
            )}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500">
                🔒 Grounded strictly in:
              </span>
              {effectiveStory.paragraph2Sources.map((src) => (
                <span
                  key={src}
                  className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-800 ring-1 ring-indigo-200/80"
                >
                  {src}
                </span>
              ))}
            </div>
          </div>

          {/* Paragraph 3 */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-700">
              Paragraph 3 • Operational Execution, Unit Delivery &amp; De-Risking
            </div>
            {isEditingStory ? (
              <textarea
                rows={4}
                value={draftP3}
                onChange={(e) => setDraftP3(e.target.value)}
                className="w-full rounded-lg border border-indigo-200 bg-white p-3 text-base leading-relaxed text-slate-800 focus:border-indigo-500 focus:outline-hidden sm:text-sm"
              />
            ) : (
              <p className="text-sm leading-relaxed text-slate-800">
                {effectiveStory.paragraph3OperationsAndExecution}
              </p>
            )}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500">
                🔒 Grounded strictly in:
              </span>
              {effectiveStory.paragraph3Sources.map((src) => (
                <span
                  key={src}
                  className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-800 ring-1 ring-indigo-200/80"
                >
                  {src}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* CHAPTER 1: IDEATION, CONCEPT CANVAS & FOUNDER FIT (MODULE A)        */}
      {/* =================================================================== */}
      {facts.hasModuleA && (
        <section
          id="master-doc-ch-a"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6"
        >
          <div className="mb-4 flex flex-col justify-between gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-extrabold text-white">
                A
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                  Chapter 1: Ideation, Concept Canvas &amp; Founder Fit
                </h2>
                <p className="text-xs text-slate-500">
                  Core problem, target customer, proposed solution, and founder non-negotiables.
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onJumpToModule('MOD_A_IDEATION')}
              className="w-fit text-xs text-indigo-700"
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit in Module A
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                1. Core Problem
              </div>
              <p className="mt-1 text-sm leading-relaxed text-slate-800">
                {facts.coreProblem || '—'}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                2. Target Customer
              </div>
              <p className="mt-1 text-sm leading-relaxed text-slate-800">
                {facts.targetCustomer || '—'}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                3. Proposed Solution
              </div>
              <p className="mt-1 text-sm leading-relaxed text-slate-800">
                {facts.proposedSolution || '—'}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                4. Unfair Advantage &amp; Why You
              </div>
              <p className="mt-1 text-sm leading-relaxed text-slate-800">
                {facts.unfairAdvantage || '—'}
              </p>
            </div>
          </div>

          <div className="mt-3.5 grid grid-cols-1 gap-3.5 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                5. Revenue &amp; Grant Fit
              </div>
              <p className="mt-1 text-sm text-slate-700">
                {facts.revenueAndGrantFit || '—'}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Ambition, Team &amp; Starting Budget
              </div>
              <p className="mt-1 text-sm text-slate-700">
                <span className="font-semibold text-slate-900">
                  {facts.motivationLabel || 'Founder'}
                </span>{' '}
                • {facts.weeklyHoursLabel || '—'} • {facts.teamStructureLabel || '—'} •{' '}
                <span className="font-semibold text-indigo-700">
                  {facts.startingBudgetLabel || '—'}
                </span>
              </p>
              {facts.twelveMonthSuccessVision && (
                <p className="mt-1 text-xs text-slate-600">
                  12-Mo Vision: {facts.twelveMonthSuccessVision}
                </p>
              )}
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Non-Negotiables &amp; Reality Check
              </div>
              <p className="mt-1 text-sm text-slate-700">
                <span className="font-semibold text-slate-900">Dealbreakers:</span>{' '}
                {facts.dealbreakersList.length > 0
                  ? facts.dealbreakersList.join(', ')
                  : 'None specified'}
              </p>
              {facts.biggestWorryNotes && (
                <p className="mt-1 text-xs text-slate-600">
                  #1 Worry: {facts.biggestWorryNotes}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* =================================================================== */}
      {/* CHAPTER 2: MARKET INTELLIGENCE, COMPETITORS & WEDGE (MODULE B)      */}
      {/* =================================================================== */}
      {facts.hasModuleB && plan.moduleBData && (
        <section
          id="master-doc-ch-b"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6"
        >
          <div className="mb-4 flex flex-col justify-between gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-extrabold text-white">
                B
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                  Chapter 2: Market Intelligence, Competitors &amp; Wedge
                </h2>
                <p className="text-xs text-slate-500">
                  Beachhead buyer, competitive alternatives, bottom-up market sizing (SOM/SAM/TAM), and unfair wedge.
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onJumpToModule('MOD_B_MARKET')}
              className="w-fit text-xs text-indigo-700"
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit in Module B
            </Button>
          </div>

          {/* Market Sizing Trio */}
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                Year 1–2 Revenue Target (SOM)
              </div>
              <div className="mt-1 text-lg font-extrabold text-indigo-950">
                {facts.somFormatted ? `${facts.somFormatted}/yr` : '—'}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Reachable Market in Target Geographies (SAM)
              </div>
              <div className="mt-1 text-lg font-extrabold text-slate-900">
                {facts.samFormatted ? `${facts.samFormatted}/yr` : '—'}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Wider Long-Term Opportunity (TAM)
              </div>
              <div className="mt-1 text-lg font-extrabold text-slate-900">
                {facts.tamFormatted ? `${facts.tamFormatted}/yr` : '—'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Beachhead Persona &amp; Buying Trigger
              </div>
              <p>
                <span className="font-semibold text-slate-900">Segment:</span>{' '}
                {facts.beachheadSegment || '—'} ({facts.buyerModelLabel || '—'})
              </p>
              {facts.decisionMakerRole && (
                <p className="mt-1">
                  <span className="font-semibold text-slate-900">Decision-Maker:</span>{' '}
                  {facts.decisionMakerRole}
                </p>
              )}
              {facts.buyingTriggerNotes && (
                <p className="mt-1">
                  <span className="font-semibold text-slate-900">Buying Trigger:</span>{' '}
                  {facts.buyingTriggerNotes}
                </p>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Why Customers Switch &amp; Competitive Wedge
              </div>
              <p>
                <span className="font-semibold text-slate-900">Why Switch:</span>{' '}
                {facts.whySwitchOneSentence || '—'}
              </p>
              {facts.competitiveEdgeSummary && (
                <p className="mt-1">
                  <span className="font-semibold text-slate-900">Competitive Edge:</span>{' '}
                  {facts.competitiveEdgeSummary}
                </p>
              )}
            </div>
          </div>

          {/* Competitors Table */}
          {(plan.moduleBData.competitorsAndStatusQuo?.competitors?.length ?? 0) >
            0 && (
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[600px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    <th className="px-3.5 py-2.5">Competitor / Alternative</th>
                    <th className="px-3.5 py-2.5">Typical Price</th>
                    <th className="px-3.5 py-2.5">What They Do Well</th>
                    <th className="px-3.5 py-2.5">Where They Fall Short</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {plan.moduleBData.competitorsAndStatusQuo!.competitors.map(
                    (c) => (
                      <tr key={c.id} className="bg-white">
                        <td className="px-3.5 py-2.5 font-semibold text-slate-900">
                          {c.name || 'Competitor'}
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-700">
                          {c.typicalPriceText || '—'}
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-700">
                          {c.whatTheyDoWell || '—'}
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-700">
                          {c.whereTheyFallShort || '—'}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* =================================================================== */}
      {/* CHAPTER 3: PUBLIC VALIDATION SURVEYS & INTERVIEWS (MODULE C)        */}
      {/* =================================================================== */}
      {facts.hasModuleC && plan.moduleCData && (
        <section
          id="master-doc-ch-c"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6"
        >
          <div className="mb-4 flex flex-col justify-between gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-extrabold text-white">
                C
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                  Chapter 3: Public Validation Surveys, Waitlist &amp; 1-on-1 Interviews
                </h2>
                <p className="text-xs text-slate-500">
                  Direct customer evidence from public validation surveys, early waitlist signups, and 1-on-1 discovery calls.
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onJumpToModule('MOD_C_SURVEYS_FEEDBACK')}
              className="w-fit text-xs text-indigo-700"
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit in Module C
            </Button>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Public Survey Responses
              </div>
              <div className="mt-1 text-lg font-extrabold text-slate-900">
                {facts.totalSurveyResponses} Response(s)
              </div>
              <div className="text-[11px] text-slate-500">
                Across {facts.surveysCount} public validation survey(s)
              </div>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                Early Waitlist Opt-Ins
              </div>
              <div className="mt-1 text-lg font-extrabold text-emerald-950">
                {facts.waitlistOptInsCount} Lead(s)
              </div>
              <div className="text-[11px] text-emerald-700">
                Opted in via public validation survey
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                1-on-1 Customer Interviews
              </div>
              <div className="mt-1 text-lg font-extrabold text-slate-900">
                {facts.interviewsCount} Logged
              </div>
              <div className="text-[11px] text-slate-500">
                {facts.strongSignalInterviewsCount} Strong Signal
                {facts.avgInterviewPainScore
                  ? ` • ${facts.avgInterviewPainScore}/5 avg pain`
                  : ''}
              </div>
            </div>
          </div>

          {facts.topValidatedPainPoints.length > 0 && (
            <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Verified Customer Pain Points &amp; Survey Takeaways
              </div>
              <ul className="list-disc space-y-1 pl-4 text-sm text-slate-700">
                {facts.topValidatedPainPoints.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
            </div>
          )}

          {(plan.moduleCData.interviewLogs?.length ?? 0) > 0 && (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[600px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    <th className="px-3.5 py-2.5">Interviewee / Role</th>
                    <th className="px-3.5 py-2.5">Channel</th>
                    <th className="px-3.5 py-2.5">Pain (1–5)</th>
                    <th className="px-3.5 py-2.5">Key Takeaway</th>
                    <th className="px-3.5 py-2.5">Commitment Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {plan.moduleCData.interviewLogs!.map((log) => (
                    <tr key={log.id} className="bg-white">
                      <td className="px-3.5 py-2.5 font-semibold text-slate-900">
                        {log.intervieweeNameOrRole}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-600">
                        {formatInterviewChannel(log)}
                      </td>
                      <td className="px-3.5 py-2.5 font-bold text-indigo-900">
                        {log.painScore1To5}/5
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-700">
                        {sanitizeSurveyTerminologyForReader(
                          log.keyTakeaway || '—'
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-700">
                        {formatInterviewCommitment(log)} (
                        {INTERVIEW_SIGNAL_LABELS[log.signalBadge] ||
                          log.signalBadge}
                        )
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* =================================================================== */}
      {/* CHAPTER 4: PRODUCT VEHICLE, V1 SCOPE & WORK PACKAGES (MODULE D)     */}
      {/* =================================================================== */}
      {facts.hasModuleD && plan.moduleDData && (
        <section
          id="master-doc-ch-d"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6"
        >
          <div className="mb-4 flex flex-col justify-between gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-extrabold text-white">
                D
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                  Chapter 4: Product Vehicle, V1 Scope &amp; Work Packages
                </h2>
                <p className="text-xs text-slate-500">
                  Product form factor, Own vs. Rent channel split, ruthless V1 scope filter, and execution work packages.
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onJumpToModule('MOD_D_PRODUCT_BUILD')}
              className="w-fit text-xs text-indigo-700"
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit in Module D
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Product Vehicle &amp; Customer Aha Moment
              </div>
              <p>
                <span className="font-semibold text-slate-900">Vehicle:</span>{' '}
                {facts.formFactorLabel || facts.productTrackLabel || '—'}
              </p>
              <p className="mt-1">
                <span className="font-semibold text-slate-900">V1 Build Approach:</span>{' '}
                {facts.prototypeApproachLabel || '—'} (
                {facts.launchTimelineLabel || '—'})
              </p>
              {facts.ahaMomentNarrative && (
                <p className="mt-1">
                  <span className="font-semibold text-slate-900">Aha Moment:</span>{' '}
                  {facts.ahaMomentNarrative}
                </p>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Channel Strategy &amp; V1 Scope Discipline
              </div>
              <p>
                <span className="font-semibold text-slate-900">Channel Split:</span>{' '}
                {facts.ownedChannelsSharePercent}% Owned Direct /{' '}
                {facts.rentedChannelsSharePercent}% Rented &amp; Partner
              </p>
              <p className="mt-1">
                <span className="font-semibold text-slate-900">
                  V1 Must-Haves ({facts.v1MustHaveTitles.length}):
                </span>{' '}
                {facts.v1MustHaveTitles.join(', ') || '—'}
              </p>
              {facts.deferredPostV1Titles.length > 0 && (
                <p className="mt-1">
                  <span className="font-semibold text-slate-900">
                    Deferred Post-V1 ({facts.deferredPostV1Titles.length}):
                  </span>{' '}
                  {facts.deferredPostV1Titles.join(', ')}
                </p>
              )}
            </div>
          </div>

          {(plan.moduleDData.workPackagesAndFlow?.workPackages?.length ?? 0) >
            0 && (
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[600px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    <th className="px-3.5 py-2.5">WP</th>
                    <th className="px-3.5 py-2.5">Work Package Title</th>
                    <th className="px-3.5 py-2.5">Estimated Cost</th>
                    <th className="px-3.5 py-2.5">Deliverable Milestone &amp; Proof</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {plan.moduleDData.workPackagesAndFlow!.workPackages.map(
                    (wp) => (
                      <tr key={wp.id} className="bg-white">
                        <td className="px-3.5 py-2.5 font-bold text-indigo-900">
                          {wp.wpCode}
                        </td>
                        <td className="px-3.5 py-2.5 font-semibold text-slate-900">
                          {wp.title}
                        </td>
                        <td className="px-3.5 py-2.5 font-semibold text-slate-800">
                          {formatPlanCurrency(
                            wp.estimatedCostAmount,
                            facts.currency
                          )}
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-700">
                          {wp.deliverableMilestoneProof ||
                            wp.deliverableMilestone ||
                            '—'}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* =================================================================== */}
      {/* CHAPTER 5: OPERATIONS, EQUIPMENT & RISK REGISTER (MODULE E)         */}
      {/* =================================================================== */}
      {facts.hasModuleE && plan.moduleEData && (
        <section
          id="master-doc-ch-e"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6"
        >
          <div className="mb-4 flex flex-col justify-between gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-extrabold text-white">
                E
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                  Chapter 5: Operations, Premises, Equipment &amp; Risk Register
                </h2>
                <p className="text-xs text-slate-500">
                  Order fulfillment lifecycle, premises &amp; equipment CapEx schedule, quality control, and 4-category project risk register.
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onJumpToModule('MOD_E_OPERATIONS')}
              className="w-fit text-xs text-indigo-700"
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit in Module E
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Fulfillment Blueprint &amp; Unit Capacity
              </div>
              <p>
                <span className="font-semibold text-slate-900">Mode:</span>{' '}
                {facts.fulfillmentModeLabel || '—'}
              </p>
              <p className="mt-1">
                <span className="font-semibold text-slate-900">Turnaround SLA:</span>{' '}
                {facts.turnaroundSlaLabel || '—'}
              </p>
              <p className="mt-1">
                <span className="font-semibold text-slate-900">
                  Unit Order Effort &amp; Variable Cost:
                </span>{' '}
                {facts.totalActiveMinutesPerOrder} active mins/order •{' '}
                {formatPlanCurrency(
                  facts.totalDirectVariableCostPerOrder,
                  facts.currency
                )}
                /order (~{facts.maxWeeklyOrdersCapacity} orders/wk ceiling)
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Premises, Equipment Schedule &amp; Governance
              </div>
              <p>
                <span className="font-semibold text-slate-900">Premises Setup:</span>{' '}
                {facts.premisesModeLabel || '—'} (
                {formatPlanCurrency(facts.monthlyPremisesCost, facts.currency)}
                /month overhead)
              </p>
              <p className="mt-1">
                <span className="font-semibold text-slate-900">
                  Equipment Schedule ({facts.equipmentItemsCount} item(s)):
                </span>{' '}
                {formatPlanCurrency(
                  facts.totalEquipmentCapexExVat,
                  facts.currency
                )}{' '}
                total ex-VAT
              </p>
              <p className="mt-1">
                <span className="font-semibold text-slate-900">
                  Quality &amp; Regulatory:
                </span>{' '}
                {facts.qcCheckpointsCount} QC gate(s) •{' '}
                {facts.complianceItemsCount} compliance requirement(s)
              </p>
            </div>
          </div>

          {(plan.moduleEData.riskRegister?.riskItems?.length ?? 0) > 0 && (
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[600px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    <th className="px-3.5 py-2.5">Category</th>
                    <th className="px-3.5 py-2.5">Risk Title</th>
                    <th className="px-3.5 py-2.5">Gross → Residual</th>
                    <th className="px-3.5 py-2.5">Mitigation &amp; Contingency Plan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {plan.moduleEData.riskRegister!.riskItems.map((risk) => (
                    <tr key={risk.id} className="bg-white">
                      <td className="px-3.5 py-2.5 font-semibold text-slate-600">
                        {risk.riskCategory}
                      </td>
                      <td className="px-3.5 py-2.5 font-semibold text-slate-900">
                        {risk.riskTitle}
                      </td>
                      <td className="px-3.5 py-2.5 font-bold text-indigo-900">
                        {risk.grossRiskScore}/25 → {risk.residualRiskRating}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-700">
                        {risk.mitigationAndContingencyPlan}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* =================================================================== */}
      {/* CHAPTER 6: TEAM, SURVIVAL BUDGET & 3-YEAR HIRING PLAN (MODULE F)    */}
      {/* =================================================================== */}
      {facts.hasModuleF && plan.moduleFData && (
        <section
          id="master-doc-ch-f"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6"
        >
          <div className="mb-4 flex flex-col justify-between gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-extrabold text-white">
                F
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                  Chapter 6: Founding Team, Personal Survival Budget &amp; 3-Year Hiring Plan
                </h2>
                <p className="text-xs text-slate-500">
                  150-word promoter profiles, 7 Startup Hats coverage, personal survival burn, and 3-year job creation roadmap.
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onJumpToModule('MOD_F_COFOUNDER_TEAM')}
              className="w-fit text-xs text-indigo-700"
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit in Module F
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Team Structure &amp; Governance
              </div>
              <p>
                <span className="font-semibold text-slate-900">Structure Posture:</span>{' '}
                {facts.teamStructurePostureLabel || '—'} ({facts.teamMembersCount} promoter(s))
              </p>
              <p className="mt-1">
                <span className="font-semibold text-slate-900">7 Startup Hats Assigned:</span>{' '}
                {facts.hatsAssignedCount}/7 core functional domains • {facts.advisorsCount} external advisor(s)
              </p>
              <p className="mt-1">
                <span className="font-semibold text-slate-900">Co-Founder Alignment:</span>{' '}
                {facts.alignmentResponsesCount} alignment questionnaire response(s) logged
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Personal Survival Budget &amp; Hiring Plan
              </div>
              <p>
                <span className="font-semibold text-slate-900">Monthly Net Survival Burn:</span>{' '}
                {formatPlanCurrency(facts.monthlyNetSurvivalBurnTotal, facts.currency)}/month
              </p>
              <p className="mt-1">
                <span className="font-semibold text-slate-900">Personal Savings Buffer:</span>{' '}
                {formatPlanCurrency(facts.personalSavingsBufferTotal, facts.currency)}
              </p>
              <p className="mt-1">
                <span className="font-semibold text-slate-900">3-Year Job Creation:</span>{' '}
                {facts.plannedHiresCount} planned hire(s) scheduled across Years 1–3
              </p>
            </div>
          </div>

          {facts.teamMemberSummaries.length > 0 && (
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[600px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    <th className="px-3.5 py-2.5">Promoter</th>
                    <th className="px-3.5 py-2.5">Role Title</th>
                    <th className="px-3.5 py-2.5">Equity &amp; Commitment</th>
                    <th className="px-3.5 py-2.5">150-Word Promoter Bio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {facts.teamMemberSummaries.map((tm, idx) => (
                    <tr key={`${tm.name}-${idx}`} className="bg-white">
                      <td className="px-3.5 py-2.5 font-bold text-slate-900">{tm.name}</td>
                      <td className="px-3.5 py-2.5 font-semibold text-indigo-900">{tm.roleTitle}</td>
                      <td className="px-3.5 py-2.5 text-slate-700">
                        {tm.equityPercent}% equity • {tm.weeklyHours} hrs/wk
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-700">{tm.bio150Words || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {facts.plannedHiresSummaries.length > 0 && (
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[600px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    <th className="px-3.5 py-2.5">Planned Role Title</th>
                    <th className="px-3.5 py-2.5">Target Quarter</th>
                    <th className="px-3.5 py-2.5">Employment Type</th>
                    <th className="px-3.5 py-2.5">Annual Gross Salary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {facts.plannedHiresSummaries.map((h, idx) => (
                    <tr key={`${h.roleTitle}-${idx}`} className="bg-white">
                      <td className="px-3.5 py-2.5 font-semibold text-slate-900">{h.roleTitle}</td>
                      <td className="px-3.5 py-2.5 font-bold text-indigo-900">{h.targetQuarter}</td>
                      <td className="px-3.5 py-2.5 text-slate-600">{h.employmentType}</td>
                      <td className="px-3.5 py-2.5 font-semibold text-slate-800">
                        {formatPlanCurrency(h.annualGrossSalary, facts.currency)}/yr
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* =================================================================== */}
      {/* CHAPTER 7: GETTING SET UP — LAUNCHPAD & OPS READINESS (MODULE G)    */}
      {/* =================================================================== */}
      {facts.hasModuleG && plan.moduleGData && (
        <section
          id="master-doc-ch-g"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6"
        >
          <div className="mb-4 flex flex-col justify-between gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-extrabold text-white">
                G
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                  Chapter 7: Getting Set Up — Launchpad &amp; Operations Readiness ({facts.opsReadinessPercent}% Ready)
                </h2>
                <p className="text-xs text-slate-500">
                  Incorporation, domain &amp; official email, business banking, bookkeeping/VAT, statutory insurance, and IP/GDPR compliance.
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onJumpToModule('MOD_G_LAUNCHPAD')}
              className="w-fit text-xs text-indigo-700"
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit in Module G
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                1. Legal Entity &amp; 2. Domain/Email
              </div>
              <p>
                <span className="font-semibold text-slate-900">Structure:</span>{' '}
                {facts.legalEntityStructureLabel || '—'}
                {facts.registeredEntityName ? ` (${facts.registeredEntityName})` : ''}
                {facts.registrationNumber ? ` • Reg #${facts.registrationNumber}` : ''}
              </p>
              <p className="mt-1">
                <span className="font-semibold text-slate-900">Domain &amp; Email:</span>{' '}
                {facts.primaryDomain || '—'} • {facts.officialBusinessEmail || '—'}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                3. Banking &amp; 4. Bookkeeping/VAT
              </div>
              <p>
                <span className="font-semibold text-slate-900">Business Bank:</span>{' '}
                {facts.bankProviderLabel || '—'}{' '}
                {facts.hasDedicatedIban ? '(Dedicated Business IBAN)' : ''}
              </p>
              <p className="mt-1">
                <span className="font-semibold text-slate-900">Accounting &amp; VAT:</span>{' '}
                {facts.accountingSoftwareLabel || '—'} • {facts.vatStatusLabel || '—'}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                5. Insurance &amp; 6. Legal/IP/GDPR
              </div>
              <p>
                <span className="font-semibold text-slate-900">Insurance Policies:</span>{' '}
                {facts.insurancesActiveList.join(', ') || 'Pending'}
              </p>
              <p className="mt-1">
                <span className="font-semibold text-slate-900">Legal &amp; IP Baseline:</span>{' '}
                {facts.legalComplianceItemsActiveList.join(', ') || 'Pending'}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* =================================================================== */}
      {/* CHAPTER 8: PRICING ARCHITECT & POCKET PROFIT BREAKEVEN (MODULE H)   */}
      {/* =================================================================== */}
      {facts.hasModuleH && plan.moduleHData && (
        <section
          id="master-doc-ch-h"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6"
        >
          <div className="mb-4 flex flex-col justify-between gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-extrabold text-white">
                H
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                  Chapter 8: Revenue Model, Pricing Architect &amp; 3-Year Pocket Profit Breakeven
                </h2>
                <p className="text-xs text-slate-500">
                  Pricing tiers, written sales velocity assumptions, and 3-year Pocket Profit trajectory net of COGS and friction costs.
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onJumpToModule('MOD_H_REVENUE')}
              className="w-fit text-xs text-indigo-700"
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit in Module H
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Revenue Vehicle &amp; Sales Velocity
              </div>
              <p>
                <span className="font-semibold text-slate-900">Revenue Vehicle:</span>{' '}
                {facts.revenueModelVehicleLabel || '—'}
                {facts.valueMetric ? ` (Value Metric: ${facts.valueMetric})` : ''}
              </p>
              <p className="mt-1">
                <span className="font-semibold text-slate-900">Blended Net Price:</span>{' '}
                {formatPlanCurrency(facts.blendedAveragePriceNet, facts.currency)} across {facts.pricingTiersCount} tier(s)
              </p>
              <p className="mt-1">
                <span className="font-semibold text-slate-900">Sales Motion &amp; Cycle:</span>{' '}
                {facts.primarySalesMotionLabel || '—'} • {facts.salesCycleDays}-day cycle ({facts.expectedConversionRatePercent}% conversion)
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                3-Year Turnover &amp; Pocket Profit Trajectory
              </div>
              <p>
                <span className="font-semibold text-slate-900">Year 1 Target:</span>{' '}
                {facts.year1TargetCustomers} customers →{' '}
                <span className="font-bold text-indigo-900">
                  {formatPlanCurrency(facts.year1ProjectedNetTurnover, facts.currency)}
                </span>{' '}
                net turnover ({formatPlanCurrency(facts.year1PocketProfitNet, facts.currency)} Pocket Profit)
              </p>
              <p className="mt-1">
                <span className="font-semibold text-slate-900">Year 2 Projected Net Turnover:</span>{' '}
                {formatPlanCurrency(facts.year2ProjectedNetTurnover, facts.currency)}
              </p>
              <p className="mt-1">
                <span className="font-semibold text-slate-900">Year 3 Projected Net Turnover:</span>{' '}
                {formatPlanCurrency(facts.year3ProjectedNetTurnover, facts.currency)}
              </p>
            </div>
          </div>

          {facts.pricingTiersSummaries.length > 0 && (
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[600px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    <th className="px-3.5 py-2.5">Pricing Tier</th>
                    <th className="px-3.5 py-2.5">Net Price (Ex-Tax)</th>
                    <th className="px-3.5 py-2.5">Billing Cadence</th>
                    <th className="px-3.5 py-2.5">Pocket Contribution Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {facts.pricingTiersSummaries.map((tier, idx) => (
                    <tr key={`${tier.name}-${idx}`} className="bg-white">
                      <td className="px-3.5 py-2.5 font-bold text-slate-900">{tier.name}</td>
                      <td className="px-3.5 py-2.5 font-semibold text-indigo-900">
                        {formatPlanCurrency(tier.priceNetOfTax, facts.currency)}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-600">{tier.billingFrequency}</td>
                      <td className="px-3.5 py-2.5 font-semibold text-emerald-700">
                        {tier.pocketProfitMarginPercent}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* =================================================================== */}
      {/* CHAPTER 9: MARKETING, 4PS & FIRST 10 CUSTOMERS (MODULE I)           */}
      {/* =================================================================== */}
      {facts.hasModuleI && plan.moduleIData && (
        <section
          id="master-doc-ch-i"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6"
        >
          <div className="mb-4 flex flex-col justify-between gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-extrabold text-white">
                I
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                  Chapter 9: Brand Positioning, 4Ps Strategy, First 10 Customers &amp; Marketing Budget
                </h2>
                <p className="text-xs text-slate-500">
                  Positioning hook, 4Ps commercial architecture, First 10 Customers pipeline, and reverse-engineered CAC/LTV unit economics.
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onJumpToModule('MOD_I_MARKETING')}
              className="w-fit text-xs text-indigo-700"
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit in Module I
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Brand Positioning &amp; First 10 Customers Playbook
              </div>
              <p>
                <span className="font-semibold text-slate-900">140-Char Elevator Hook:</span>{' '}
                {facts.elevatorHook140 || '—'}
              </p>
              <p className="mt-1">
                <span className="font-semibold text-slate-900">Positioning Statement:</span>{' '}
                {facts.positioningFormulaSummary || '—'}
              </p>
              <p className="mt-1">
                <span className="font-semibold text-slate-900">First 10 Customers Playbook:</span>{' '}
                {facts.first10ArchetypeLabel || '—'} ({facts.first10ProspectsCount} named prospects •{' '}
                {facts.committedOrPilotProspectsCount} active pilot/committed)
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Reverse-Engineered Marketing Budget &amp; CAC/LTV
              </div>
              <p>
                <span className="font-semibold text-slate-900">Monthly Marketing Budget:</span>{' '}
                {formatPlanCurrency(facts.monthlyMarketingBudget, facts.currency)}/month
              </p>
              <p className="mt-1">
                <span className="font-semibold text-slate-900">Customer Acquisition Cost (CAC):</span>{' '}
                {formatPlanCurrency(facts.calculatedCashCac, facts.currency)} •{' '}
                <span className="font-semibold text-slate-900">LTV:</span>{' '}
                {formatPlanCurrency(facts.calculatedLtv, facts.currency)}
              </p>
              <p className="mt-1">
                <span className="font-semibold text-slate-900">LTV:CAC Ratio &amp; Payback:</span>{' '}
                <span className="font-bold text-indigo-900">{facts.calculatedLtvToCacRatio}x</span> •{' '}
                {facts.calculatedPaybackMonths} month(s) CAC payback
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-sm">
              <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                P1 • Product Strategy
              </div>
              <p className="mt-1 text-slate-700">{facts.fourPsSummary.productP1 || '—'}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-sm">
              <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                P2 • Price Positioning
              </div>
              <p className="mt-1 text-slate-700">{facts.fourPsSummary.priceP2 || '—'}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-sm">
              <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                P3 • Place &amp; Channels
              </div>
              <p className="mt-1 text-slate-700">{facts.fourPsSummary.placeP3 || '—'}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-sm">
              <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                P4 • Promotion Motion
              </div>
              <p className="mt-1 text-slate-700">{facts.fourPsSummary.promotionP4 || '—'}</p>
            </div>
          </div>
        </section>
      )}

      {/* =================================================================== */}
      {/* CHAPTER 10: 36-MONTH FINANCIAL BUILDER & CASHFLOW TROUGH (MODULE J) */}
      {/* =================================================================== */}
      {facts.hasModuleJ && plan.moduleJData && (
        <section
          id="master-doc-ch-j"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6"
        >
          <div className="mb-4 flex flex-col justify-between gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-extrabold text-white">
                J
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                  Chapter 10: 36-Month Financial Builder, Overheads, Working Capital &amp; Cashflow Trough
                </h2>
                <p className="text-xs text-slate-500">
                  Localized overhead posture, Year 1 payroll/drawings, debtor/creditor working capital timing, and 36-month funding runway.
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onJumpToModule('MOD_J_FINANCE')}
              className="w-fit text-xs text-indigo-700"
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit in Module J
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Fixed Overheads &amp; Year 1 Payroll Posture
              </div>
              <p>
                <span className="font-semibold text-slate-900">Operating Cost Posture:</span>{' '}
                {facts.operatingCostPostureLabel || '—'}
              </p>
              <p className="mt-1">
                <span className="font-semibold text-slate-900">Monthly Fixed Overheads:</span>{' '}
                {formatPlanCurrency(facts.monthlyFixedOverheadsTotal, facts.currency)}/month
              </p>
              <p className="mt-1">
                <span className="font-semibold text-slate-900">Y1 Founder Drawings &amp; Team Payroll:</span>{' '}
                {formatPlanCurrency(facts.monthlyFounderDrawingsYear1, facts.currency)}/mo drawings •{' '}
                {formatPlanCurrency(facts.monthlyTeamSalariesYear1, facts.currency)}/mo team salaries
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Working Capital &amp; Funding Runway
              </div>
              <p>
                <span className="font-semibold text-slate-900">Customer Collection Timing:</span>{' '}
                {facts.customerCollectionTimingLabel || '—'}
              </p>
              <p className="mt-1">
                <span className="font-semibold text-slate-900">Primary Funding Strategy:</span>{' '}
                {facts.primaryFundingStrategyLabel || '—'}
              </p>
              <p className="mt-1">
                <span className="font-semibold text-slate-900">Starting Cash &amp; External Capital:</span>{' '}
                {formatPlanCurrency(facts.startingCashBalanceDay1, facts.currency)} Day-1 cash +{' '}
                {formatPlanCurrency(facts.totalExternalFundingMapped, facts.currency)} external funding
              </p>
            </div>
          </div>

          {facts.writtenFinancialAssumptionsBlock && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-700">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                Written Financial Assumptions Notes
              </div>
              <p className="leading-relaxed">{facts.writtenFinancialAssumptionsBlock}</p>
            </div>
          )}
        </section>
      )}

      {/* =================================================================== */}
      {/* CHAPTER 11: GRANTS, CAPITAL STACK & TAX RELIEF (MODULE K)           */}
      {/* =================================================================== */}
      {facts.hasModuleK && plan.moduleKData && (
        <section
          id="master-doc-ch-k"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6"
        >
          <div className="mb-4 flex flex-col justify-between gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-extrabold text-white">
                K
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                  Chapter 11: Non-Dilutive Grants, Capital Stack, Reimbursement Bridge &amp; Tax Relief
                </h2>
                <p className="text-xs text-slate-500">
                  Grant readiness scorer, matched funding capital stack, reimbursement cashflow bridge, and investor/R&amp;D tax relief.
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onJumpToModule('MOD_K_GRANTS_FUNDING')}
              className="w-fit text-xs text-indigo-700"
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit in Module K
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Lead Programme &amp; Matched Capital Stack
              </div>
              <p>
                <span className="font-semibold text-slate-900">Lead Programme:</span>{' '}
                <span className="font-bold text-indigo-900">{facts.selectedGrantKey || '—'}</span>{' '}
                ({facts.overallAssessorReadinessScore}/100 Assessor Readiness)
              </p>
              <p className="mt-1">
                <span className="font-semibold text-slate-900">
                  Target Capital Stack ({formatPlanCurrency(facts.totalTargetFundingGap, facts.currency)}):
                </span>{' '}
                Founder Cash: {formatPlanCurrency(facts.skinInTheGameCash, facts.currency)} ({facts.skinInTheGamePercent}%) •{' '}
                Grants: {formatPlanCurrency(facts.totalGrantsAllocated, facts.currency)} •{' '}
                Loans: {formatPlanCurrency(facts.totalLoansAllocated, facts.currency)} •{' '}
                Equity: {formatPlanCurrency(facts.totalAngelAllocated, facts.currency)} ({facts.projectedEquityDilutionPercent}% dilution)
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Reimbursement Cashflow Bridge &amp; Tax Relief
              </div>
              <p>
                <span className="font-semibold text-slate-900">Reimbursement Turnaround &amp; Bridge:</span>{' '}
                {facts.grantReimbursementTurnaroundWeeks} weeks lag • {facts.bridgeStrategyLabel || '—'} (
                <span className={facts.isAssessorLiquidityCompliant ? 'font-bold text-emerald-700' : 'font-bold text-amber-700'}>
                  {facts.isAssessorLiquidityCompliant ? 'Assessor Liquidity Compliant' : 'Liquidity Gap Flagged'}
                </span>
                )
              </p>
              <p className="mt-1">
                <span className="font-semibold text-slate-900">Tax Relief &amp; Advance Assurance:</span>{' '}
                {facts.primaryTaxScheme} ({formatPlanCurrency(facts.targetReliefRaiseAmount, facts.currency)} target raise •{' '}
                Status: {facts.advanceAssuranceStatus})
              </p>
            </div>
          </div>

          {facts.executiveFundingSummaryNarrative && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-700">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                Executive Funding &amp; Non-Dilutive Strategy Narrative
              </div>
              <p className="leading-relaxed">{facts.executiveFundingSummaryNarrative}</p>
            </div>
          )}
        </section>
      )}

      {/* =================================================================== */}
      {/* CHAPTER 12: OFFICIAL GRANT & BUSINESS PLAN COMPILER (MODULE L)      */}
      {/* =================================================================== */}
      {facts.hasModuleL ? (
        <section
          id="master-doc-ch12"
          className="rounded-2xl border border-indigo-200 bg-white p-5 shadow-xs sm:p-6"
        >
          <div className="mb-4 flex flex-col justify-between gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-950 text-xs font-extrabold text-white">
                12
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                  Chapter 12: Interactive Business Plan &amp; Grant Compiler (Module L)
                </h2>
                <p className="text-xs text-slate-500">
                  Pre-Flight Contradiction Audit, official grant narrative compiler &amp; mandatory proof binder.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onJumpToModule('MOD_L_BUSINESS_PLAN')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit in Module L
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Compiler Mode &amp; Objective
              </div>
              <p>
                <span className="font-semibold text-slate-900">Mode:</span>{' '}
                <span className="font-bold text-indigo-900">{facts.compilerModeLabel}</span>
              </p>
              <p className="mt-1">
                <span className="font-semibold text-slate-900">Target Committee:</span>{' '}
                {facts.targetAgencyOrCommitteeName} ({formatPlanCurrency(facts.targetFundingAskAmount, facts.currency)} ask • {facts.submissionObjectiveLabel})
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Pre-Flight Contradiction Audit &amp; Readiness
              </div>
              <p>
                <span className="font-semibold text-slate-900">Audit Score:</span>{' '}
                <span className="font-bold text-emerald-700">{facts.contradictionAuditScore}/100 Pre-Flight Clearance</span>{' '}
                ({facts.auditPassedCount} Passed, {facts.auditWarningCount} Warnings, {facts.auditCriticalCount} Critical)
              </p>
              <p className="mt-1">
                <span className="font-semibold text-slate-900">Dossier Readiness:</span>{' '}
                {facts.compiledSectionsCount} question(s) compiled (~{facts.totalCompiledWordCount.toLocaleString()} words) •{' '}
                {facts.appendicesReadyCount}/{facts.totalAppendicesCount} proof appendices ready (
                <span className="font-bold text-indigo-700">{facts.committeeReadinessScore}/100 Committee Ready</span>)
              </p>
            </div>
          </div>

          {facts.executiveHookStatement && (
            <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 text-xs text-indigo-950">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                Executive Hook Statement
              </div>
              <p className="italic leading-relaxed">"{facts.executiveHookStatement}"</p>
            </div>
          )}

          {facts.preFlightDefenseSummary && (
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-700">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Pre-Flight Assessor Defense Statement
              </div>
              <p className="leading-relaxed">{facts.preFlightDefenseSummary}</p>
            </div>
          )}

          {facts.executiveDossierSummary && (
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-700">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                Official Submission Dossier Executive Brief
              </div>
              <p className="leading-relaxed">{facts.executiveDossierSummary}</p>
            </div>
          )}
        </section>
      ) : (
        <section className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 via-white to-emerald-50/60 p-5 shadow-xs sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                Module L • Official Grant &amp; Business Plan Compiler
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Ready to compile your official LEO, Innovate UK, Start Up Loans, or SEIS/EIS pack?
              </h3>
              <p className="text-xs text-slate-600">
                Module L auto-compiles all 11 foundation chapters (Modules A–K) into official submission templates with live proof blocks and Pre-Flight Contradiction &amp; Grant Audit.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => onJumpToModule('MOD_L_BUSINESS_PLAN')}
              className="shrink-0 bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700"
            >
              Open Module L Compiler
              <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
