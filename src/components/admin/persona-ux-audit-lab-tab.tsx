'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bot,
  Sparkles,
  Smartphone,
  Tablet,
  Laptop,
  SlidersHorizontal,
  Copy,
  Check,
  Play,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  BookOpen,
  Layers,
  Bug,
  RefreshCw,
  FileCode2,
  Eye,
  X,
  UserCheck,
  Gauge,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ModuleCode } from '@/lib/entitlements';
import {
  loadBmuSession,
  saveBmuSession,
  exitPersonaPreviewAndRestoreRealPlans,
} from '@/lib/auth/session-store';
import type {
  SupportModuleScope,
  SupportTicketPriority,
  SupportTicketType,
} from '@/lib/support-tracker-store';
import {
  PERSONA_ARCHETYPES,
  COMPREHENSION_LEVELS,
  AUDIT_VIEWPORTS,
  PLATFORM_MODULES_CATALOG,
  buildSeededPersonaStartupPlan,
  generateAntigravityFixPromptForFinding,
  generateAntigravityBatchFixPrompt,
  generateUnfinishedModuleBuildPrompt,
  type PersonaArchetypeId,
  type ComprehensionLevelId,
  type AuditViewportId,
  type AuditIssueCategory,
  type PersonaAuditReport,
  type PersonaAuditFinding,
  type ModuleAuditSummaryItem,
} from '@/lib/personas/persona-audit-engine';
import { runPersonaPlatformAuditAction } from '@/app/actions/persona-audit';

interface PersonaUxAuditLabTabProps {
  onCreateSupportTicket: (input: {
    ticketType: SupportTicketType;
    customTypeText?: string | null;
    priority: SupportTicketPriority;
    moduleScope: SupportModuleScope;
    stepContext?: string | null;
    pageUrl?: string | null;
    title: string;
    description: string;
    expectedBehavior?: string | null;
    adminNotes?: string | null;
  }) => Promise<void>;
  onNotify: (type: 'success' | 'warning', text: string) => void;
}

export function PersonaUxAuditLabTab({
  onCreateSupportTicket,
  onNotify,
}: PersonaUxAuditLabTabProps) {
  const router = useRouter();

  // Controls State
  const [selectedPersonaId, setSelectedPersonaId] =
    useState<PersonaArchetypeId>('AOIFE_IE_FOOD');
  const [selectedComprehensionId, setSelectedComprehensionId] =
    useState<ComprehensionLevelId>('L1_EVERYDAY');
  const [selectedViewportFilter, setSelectedViewportFilter] = useState<
    AuditViewportId | 'ALL_VIEWPORTS'
  >('ALL_VIEWPORTS');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<
    ModuleCode | 'ALL'
  >('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<
    AuditIssueCategory | 'ALL'
  >('ALL');
  const [hideUnfinishedScaffolds, setHideUnfinishedScaffolds] =
    useState<boolean>(false);

  // Audit Report State
  const [auditReport, setAuditReport] = useState<PersonaAuditReport | null>(
    null
  );
  const [isRunningAudit, setIsRunningAudit] = useState<boolean>(false);
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const [loggedTicketIds, setLoggedTicketIds] = useState<string[]>([]);
  const [activePromptPreview, setActivePromptPreview] = useState<{
    title: string;
    promptText: string;
  } | null>(null);

  const activePersona = useMemo(
    () =>
      PERSONA_ARCHETYPES.find((p) => p.id === selectedPersonaId) ||
      PERSONA_ARCHETYPES[0],
    [selectedPersonaId]
  );

  const activeComprehension = useMemo(
    () =>
      COMPREHENSION_LEVELS.find((c) => c.id === selectedComprehensionId) ||
      COMPREHENSION_LEVELS[0],
    [selectedComprehensionId]
  );

  async function executePlatformAudit(
    personaId = selectedPersonaId,
    comprehensionId = selectedComprehensionId
  ) {
    setIsRunningAudit(true);
    try {
      const res = await runPersonaPlatformAuditAction({
        personaId,
        comprehensionId,
        viewports: ['MOBILE_375', 'TABLET_768', 'LAPTOP_1366'],
      });
      if (res.ok && res.report) {
        setAuditReport(res.report);
      }
    } finally {
      setIsRunningAudit(false);
    }
  }

  useEffect(() => {
    executePlatformAudit(selectedPersonaId, selectedComprehensionId);
  }, [selectedPersonaId, selectedComprehensionId]);

  const filteredFindings = useMemo(() => {
    if (!auditReport) return [];
    return auditReport.findings.filter((f) => {
      if (
        hideUnfinishedScaffolds &&
        f.category === 'UNFINISHED_MODULE_SPEC'
      ) {
        return false;
      }
      if (
        selectedModuleFilter !== 'ALL' &&
        f.moduleCode !== selectedModuleFilter
      ) {
        return false;
      }
      if (
        selectedCategoryFilter !== 'ALL' &&
        f.category !== selectedCategoryFilter
      ) {
        return false;
      }
      if (
        selectedViewportFilter !== 'ALL_VIEWPORTS' &&
        f.viewport !== 'ALL_VIEWPORTS' &&
        f.viewport !== selectedViewportFilter
      ) {
        return false;
      }
      return true;
    });
  }, [
    auditReport,
    hideUnfinishedScaffolds,
    selectedModuleFilter,
    selectedCategoryFilter,
    selectedViewportFilter,
  ]);

  async function handleCopyText(id: string, text: string, label: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopiedPromptId(id);
      setTimeout(() => {
        setCopiedPromptId((prev) => (prev === id ? null : prev));
      }, 2500);
      onNotify('success', `Copied ${label} to clipboard — ready to paste into Antigravity.`);
    }
  }

  function handleSeedAndOpenPersonaInWorkspace(targetModule?: ModuleCode) {
    const seededPlan = buildSeededPersonaStartupPlan(
      activePersona.id,
      activeComprehension.id
    );
    const currentSession = loadBmuSession();

    // Replace existing plan with same ID or prepend it
    const otherPlans = (currentSession.plans || []).filter(
      (p) => p.id !== seededPlan.id
    );

    const updatedSession = {
      ...currentSession,
      entitlement: {
        ...currentSession.entitlement,
        // Ensure admin testing persona has full access to all modules A-L
        planType: 'APPSUMO_LTD' as const,
        stackedCodesCount: Math.max(
          currentSession.entitlement.stackedCodesCount || 0,
          3
        ),
        maxStartupPlans: Math.max(
          currentSession.entitlement.maxStartupPlans || 1,
          25
        ),
        maxSeatsPerPlan: Math.max(
          currentSession.entitlement.maxSeatsPerPlan || 1,
          5
        ),
        whiteLabelExportEnabled: true,
        isVaultReadonly: false,
      },
      plans: [seededPlan, ...otherPlans],
      activePlanId: seededPlan.id,
    };

    saveBmuSession(updatedSession);
    onNotify(
      'success',
      `Seeded "${seededPlan.title}" in isolated Persona Sandbox (${activeComprehension.shortBadge}). Your real plan remains untouched.`
    );

    const destination = targetModule
      ? `/workspace?persona_preview=1&module=${targetModule}`
      : '/workspace?persona_preview=1';
    router.push(destination);
  }

  function handleRestoreRealFounderPlan() {
    const restored = exitPersonaPreviewAndRestoreRealPlans();
    const activeReal =
      restored.plans.find((p) => p.id === restored.activePlanId) ||
      restored.plans[0];
    onNotify(
      'success',
      `Restored your real startup plan ("${activeReal?.title || 'My Startup Plan'}") and removed synthetic test persona plans.`
    );
    router.push('/workspace');
  }

  async function handleLogFindingToBugTracker(finding: PersonaAuditFinding) {
    const modCat = PLATFORM_MODULES_CATALOG.find(
      (m) => m.code === finding.moduleCode
    );
    const fixPrompt = generateAntigravityFixPromptForFinding(
      finding,
      activePersona,
      activeComprehension
    );

    await onCreateSupportTicket({
      ticketType:
        finding.category === 'VIEWPORT_RESPONSIVE' ||
        finding.category === 'FORMATTING_TYPOGRAPHY'
          ? 'IMPROVEMENT'
          : finding.category === 'COMPREHENSION_JARGON'
            ? 'AI_PROMPT_TUNING'
            : 'BUG',
      priority:
        finding.severity === 'CRITICAL'
          ? 'HIGH'
          : finding.severity === 'IMPORTANT'
            ? 'MEDIUM'
            : 'LOW',
      moduleScope: modCat?.supportScope || 'GLOBAL',
      stepContext: `${finding.stepLabel} (${finding.viewport} • ${activeComprehension.shortBadge})`,
      pageUrl: `/workspace?module=${finding.moduleCode}`,
      title: `[Persona Lab • ${activePersona.name}] ${finding.title}`,
      description: `${finding.personaFirstPersonQuote}\n\nTechnical Finding: ${finding.technicalFinding}`,
      expectedBehavior: finding.recommendedFix,
      adminNotes: fixPrompt,
    });

    setLoggedTicketIds((prev) => [...prev, finding.id]);
  }

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-400/40">
                Synthetic Founder &amp; UX Audit Engine
              </Badge>
              <Badge className="bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/40">
                4-Level Intelligence Lever (L1–L4)
              </Badge>
              <Badge className="bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/40">
                Mobile 375px • Tablet 768px • Laptop 1366px
              </Badge>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Persona &amp; Comprehension UX Lab + Antigravity Prompt Generator
            </h1>
            <p className="text-xs leading-relaxed text-indigo-100/90 sm:text-sm">
              Walk through Startup Preflight as different founder archetypes, adjust the{' '}
              <strong className="text-white">Comprehension / Business Literacy Lever (L1–L4)</strong>,
              check responsive formatting across <strong className="text-white">Mobile, Tablet, and Laptop</strong>,
              and generate 1-click <strong className="text-white">Antigravity Fix Prompts</strong>. Unfinished modules are automatically detected as scaffolds so they never break the checker.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              size="sm"
              onClick={() => handleSeedAndOpenPersonaInWorkspace()}
              className="bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-500"
            >
              <Play className="mr-1.5 h-3.5 w-3.5" />
              Preview {activePersona.name.split(' ')[0]}’s Sandbox in Workspace
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRestoreRealFounderPlan}
              className="border-amber-400/50 bg-amber-500/20 text-xs font-semibold text-amber-100 hover:bg-amber-500/30"
            >
              Restore My Real Plan
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                executePlatformAudit(selectedPersonaId, selectedComprehensionId)
              }
              disabled={isRunningAudit}
              className="border-indigo-400/40 bg-white/10 text-xs text-white hover:bg-white/20"
            >
              <RefreshCw
                className={`mr-1.5 h-3.5 w-3.5 ${isRunningAudit ? 'animate-spin' : ''}`}
              />
              Re-Scan Live Codebase
            </Button>
          </div>
        </div>
      </div>

      {/* Control Grid: 1. Persona Selector | 2. Intelligence Lever (L1-L4) | 3. Viewport Matrix */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* 1. Founder Persona Selector (5 cols) */}
        <Card className="border-slate-200 lg:col-span-5">
          <CardHeader className="border-b border-slate-100 pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <UserCheck className="h-4 w-4 text-indigo-600" />
                1. Choose Synthetic Founder Persona
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">
                {activePersona.hqCountryCode} • {activePersona.baseCurrency}
              </Badge>
            </div>
            <CardDescription className="text-xs text-slate-500">
              Each persona stress-tests different business models, grants, and edge cases.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 p-4">
            {PERSONA_ARCHETYPES.map((persona) => {
              const isSelected = persona.id === selectedPersonaId;
              return (
                <button
                  key={persona.id}
                  type="button"
                  onClick={() => setSelectedPersonaId(persona.id)}
                  className={`w-full rounded-xl border p-3 text-left transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-600'
                      : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {persona.avatarInitials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-bold text-slate-900">
                          {persona.shortLabel}
                        </div>
                        <div className="truncate text-[11px] text-slate-500">
                          {persona.businessTitle}
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="shrink-0 text-[10px] border-slate-300 text-slate-600"
                    >
                      {persona.teamStructure === 'CO_FOUNDERS'
                        ? 'Co-Founders'
                        : persona.teamStructure === 'LOOKING_FOR_COFOUNDER'
                          ? 'Seeking Co-Founder'
                          : 'Solo'}
                    </Badge>
                  </div>
                </button>
              );
            })}

            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
              <div className="font-semibold text-slate-800">
                What {activePersona.name} Stress-Tests:
              </div>
              <ul className="mt-1.5 space-y-1 text-[11px] text-slate-600">
                {activePersona.whatTheyStressTest.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* 2. Comprehension / Intelligence Lever (L1 - L4) (4 cols) */}
        <Card className="border-slate-200 lg:col-span-4">
          <CardHeader className="border-b border-slate-100 pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Gauge className="h-4 w-4 text-indigo-600" />
                2. Intelligence &amp; Literacy Lever
              </CardTitle>
              <Badge className="bg-indigo-600 text-white text-[10px]">
                {activeComprehension.shortBadge}
              </Badge>
            </div>
            <CardDescription className="text-xs text-slate-500">
              Not everyone logs in with startup/finance fluency. Slide from L1 (Plain-English) to L4 (Assessor).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 p-4">
            {COMPREHENSION_LEVELS.map((level) => {
              const isSelected = level.id === selectedComprehensionId;
              return (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => setSelectedComprehensionId(level.id)}
                  className={`w-full rounded-xl border p-3 text-left transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-600'
                      : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {level.label}
                    </span>
                    <Badge
                      variant="outline"
                      className={`shrink-0 text-[10px] ${
                        level.jargonTolerance === 'ZERO'
                          ? 'border-rose-300 bg-rose-50 text-rose-800'
                          : level.jargonTolerance === 'LOW'
                            ? 'border-amber-300 bg-amber-50 text-amber-800'
                            : 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      }`}
                    >
                      Jargon: {level.jargonTolerance}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[11px] leading-snug text-slate-600">
                    {level.personaMindset}
                  </p>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* 3. Device Viewport Matrix & Master Prompt Actions (3 cols) */}
        <Card className="border-slate-200 lg:col-span-3">
          <CardHeader className="border-b border-slate-100 pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Smartphone className="h-4 w-4 text-indigo-600" />
              3. Screen Sizes &amp; Fix Prompts
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Filter by Mobile, Tablet, or Laptop and generate Antigravity prompts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => setSelectedViewportFilter('ALL_VIEWPORTS')}
                className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                  selectedViewportFilter === 'ALL_VIEWPORTS'
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>All 3 Screen Sizes</span>
                <span className="text-[10px] opacity-80">375px • 768px • 1366px</span>
              </button>

              {AUDIT_VIEWPORTS.map((vp) => {
                const isSelected = selectedViewportFilter === vp.id;
                const IconComp =
                  vp.id === 'MOBILE_375'
                    ? Smartphone
                    : vp.id === 'TABLET_768'
                      ? Tablet
                      : Laptop;
                return (
                  <button
                    key={vp.id}
                    type="button"
                    onClick={() => setSelectedViewportFilter(vp.id)}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-xs transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 font-bold text-indigo-950 ring-1 ring-indigo-600'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <IconComp className="h-3.5 w-3.5 text-indigo-600" />
                      <span>{vp.label}</span>
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {vp.widthPx}px
                    </span>
                  </button>
                );
              })}
            </div>

            {auditReport && (
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-indigo-950">
                    Live Modules Health Score
                  </span>
                  <span className="text-base font-bold text-indigo-700">
                    {auditReport.overallHealthScore}/100
                  </span>
                </div>
                <div className="text-[11px] text-slate-600">
                  <strong>Readability:</strong>{' '}
                  {auditReport.readabilitySummary.estimatedReadingGrade}
                </div>
                {auditReport.readabilitySummary.flaggedTerms.length > 0 && (
                  <div className="text-[11px] text-rose-700">
                    <strong>Jargon Flagged ({activeComprehension.shortBadge}):</strong>{' '}
                    {auditReport.readabilitySummary.flaggedTerms.join(', ')}
                  </div>
                )}
              </div>
            )}

            {auditReport && (
              <div className="space-y-2 pt-1">
                <Button
                  size="sm"
                  onClick={() => {
                    const prompt = generateAntigravityBatchFixPrompt({
                      report: auditReport,
                      moduleFilter: selectedModuleFilter,
                      categoryFilter: selectedCategoryFilter,
                    });
                    handleCopyText(
                      'batch-all',
                      prompt,
                      `Batch Antigravity Fix Prompt (${filteredFindings.length} items)`
                    );
                  }}
                  className="w-full bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-500"
                >
                  {copiedPromptId === 'batch-all' ? (
                    <>
                      <Check className="mr-1.5 h-3.5 w-3.5" />
                      Copied Batch Fix Prompt!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1.5 h-3.5 w-3.5" />
                      Copy Batch Fix Prompt ({filteredFindings.length})
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const prompt = generateAntigravityBatchFixPrompt({
                      report: auditReport,
                      moduleFilter: selectedModuleFilter,
                      categoryFilter: 'COMPREHENSION_JARGON',
                    });
                    setActivePromptPreview({
                      title: `Plain-English Copy & Tooltip Upgrade Prompt (${activeComprehension.shortBadge})`,
                      promptText: prompt,
                    });
                  }}
                  className="w-full text-xs"
                >
                  <Sparkles className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
                  Preview {activeComprehension.shortBadge} Copy Prompt
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 12-Module Build & Audit Status Matrix (Handles Live vs Unfinished Modules Gracefully!) */}
      {auditReport && (
        <Card className="border-slate-200">
          <CardHeader className="border-b border-slate-100 pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  All 12 Modules (A–L) — Live Audit &amp; Unfinished Module Readiness Matrix
                </CardTitle>
                <CardDescription className="mt-0.5 text-xs text-slate-500">
                  Click any module to filter its findings, open it in the Workspace as {activePersona.name}, or copy its Fix / Build Prompt.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={selectedModuleFilter === 'ALL' ? 'default' : 'outline'}
                  onClick={() => setSelectedModuleFilter('ALL')}
                  className="h-8 text-xs"
                >
                  Show All Modules
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setHideUnfinishedScaffolds((prev) => !prev)
                  }
                  className="h-8 text-xs"
                >
                  {hideUnfinishedScaffolds
                    ? 'Showing Live Modules Only'
                    : 'Hide Unfinished Scaffolds'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {auditReport.moduleSummaries.map((mod) => {
                const isSelected = selectedModuleFilter === mod.moduleCode;
                const isUnfinished = mod.buildStatus === 'SCAFFOLD_UNFINISHED';
                return (
                  <div
                    key={mod.moduleCode}
                    className={`flex flex-col justify-between rounded-xl border p-3.5 transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                        : isUnfinished
                          ? 'border-dashed border-slate-300 bg-slate-50/70'
                          : 'border-slate-200 bg-white hover:border-indigo-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedModuleFilter(
                              isSelected ? 'ALL' : mod.moduleCode
                            )
                          }
                          className="text-left text-xs font-bold text-slate-900 hover:text-indigo-600"
                        >
                          {mod.shortName}: {mod.title}
                        </button>
                        {isUnfinished ? (
                          <Badge
                            variant="outline"
                            className="shrink-0 border-amber-300 bg-amber-50 text-[10px] text-amber-800"
                          >
                            Scaffold / To Build
                          </Badge>
                        ) : (
                          <Badge className="shrink-0 bg-emerald-100 text-[10px] text-emerald-800">
                            Live ({mod.detectedStepsCount} Steps)
                          </Badge>
                        )}
                      </div>

                      {isUnfinished ? (
                        <p className="mt-2 text-[11px] text-slate-500">
                          Not built as a standalone workspace yet. Does not penalize live score. Click below to copy the full Build Spec Prompt when ready.
                        </p>
                      ) : (
                        <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-[11px]">
                          <div className="rounded-lg bg-slate-50 px-2 py-1">
                            <span className="text-slate-500">Clarity:</span>{' '}
                            <strong className="text-slate-900">
                              {mod.clarityScore}%
                            </strong>
                          </div>
                          <div className="rounded-lg bg-slate-50 px-2 py-1">
                            <span className="text-slate-500">Viewports:</span>{' '}
                            <strong className="text-slate-900">
                              {mod.viewportScore}%
                            </strong>
                          </div>
                          <div className="rounded-lg bg-slate-50 px-2 py-1">
                            <span className="text-slate-500">Formatting:</span>{' '}
                            <strong className="text-slate-900">
                              {mod.formattingScore}%
                            </strong>
                          </div>
                          <div className="rounded-lg bg-slate-50 px-2 py-1">
                            <span className="text-slate-500">OTHER Pill:</span>{' '}
                            <strong
                              className={
                                mod.hasOtherOptionCoverage
                                  ? 'text-emerald-700'
                                  : 'text-rose-600'
                              }
                            >
                              {mod.hasOtherOptionCoverage ? 'Yes' : 'Missing'}
                            </strong>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-1.5 border-t border-slate-100 pt-2.5">
                      {isUnfinished ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const buildPrompt =
                              generateUnfinishedModuleBuildPrompt(
                                mod,
                                activePersona,
                                activeComprehension
                              );
                            handleCopyText(
                              `build-${mod.moduleCode}`,
                              buildPrompt,
                              `${mod.shortName} Build-to-Standard Prompt`
                            );
                          }}
                          className="h-7 w-full text-[11px] font-medium text-indigo-700 hover:bg-indigo-50"
                        >
                          <Copy className="mr-1 h-3 w-3" />
                          Copy Build-to-Standard Prompt
                        </Button>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setSelectedModuleFilter(
                                isSelected ? 'ALL' : mod.moduleCode
                              )
                            }
                            className="h-7 px-2 text-[11px] text-slate-700"
                          >
                            {mod.issuesCount} Finding(s)
                          </Button>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const prompt =
                                  generateAntigravityBatchFixPrompt({
                                    report: auditReport,
                                    moduleFilter: mod.moduleCode,
                                  });
                                handleCopyText(
                                  `mod-fix-${mod.moduleCode}`,
                                  prompt,
                                  `${mod.shortName} Fix Prompt`
                                );
                              }}
                              className="h-7 px-2 text-[11px] text-indigo-700"
                            >
                              <Copy className="mr-1 h-3 w-3" />
                              Fix Prompt
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleSeedAndOpenPersonaInWorkspace(
                                  mod.moduleCode
                                )
                              }
                              className="h-7 px-2 text-[11px]"
                              title={`Open ${mod.shortName} as ${activePersona.name}`}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prompt Preview Modal / Drawer */}
      {activePromptPreview && (
        <Card className="border-indigo-300 bg-indigo-50/40 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b border-indigo-100 pb-3">
            <div>
              <CardTitle className="text-sm font-bold text-indigo-950">
                {activePromptPreview.title}
              </CardTitle>
              <CardDescription className="text-xs text-indigo-800">
                Copy and paste this directly into Antigravity chat to apply the fixes automatically.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() =>
                  handleCopyText(
                    'preview-modal-copy',
                    activePromptPreview.promptText,
                    activePromptPreview.title
                  )
                }
                className="bg-indigo-600 text-xs text-white hover:bg-indigo-500"
              >
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                Copy Prompt
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setActivePromptPreview(null)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-900 p-4 font-mono text-xs text-slate-100">
              {activePromptPreview.promptText}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Detailed Findings List with 1-Click Fix Prompts */}
      <Card className="border-slate-200">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Detailed Persona, Comprehension &amp; Viewport Findings ({filteredFindings.length})
              </CardTitle>
              <CardDescription className="mt-0.5 text-xs text-slate-500">
                Audited as <strong>{activePersona.name}</strong> at{' '}
                <strong>{activeComprehension.label}</strong> across Mobile (375px), Tablet (768px), and Laptop (1366px).
              </CardDescription>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'ALL', label: 'All Categories' },
                  { id: 'COMPREHENSION_JARGON', label: 'Jargon & Clarity' },
                  { id: 'VIEWPORT_RESPONSIVE', label: 'Mobile / Tablet / Laptop' },
                  { id: 'PERSONA_MODEL_FIT', label: 'Persona Fit' },
                  { id: 'EDGE_CASE_OTHER_OPTION', label: '"OTHER" Option' },
                  { id: 'UNFINISHED_MODULE_SPEC', label: 'Unfinished Scaffolds' },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(cat.id)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                    selectedCategoryFilter === cat.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-4">
          {filteredFindings.length === 0 ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-8 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
              <h3 className="mt-2 text-sm font-bold text-slate-900">
                Zero Issues Found for Current Filter!
              </h3>
              <p className="mt-1 text-xs text-slate-600">
                Try switching the Comprehension Lever to L1 (Everyday Plain-English) or selecting All Modules.
              </p>
            </div>
          ) : (
            filteredFindings.map((finding) => {
              const singleFixPrompt = generateAntigravityFixPromptForFinding(
                finding,
                activePersona,
                activeComprehension
              );
              const isCopied = copiedPromptId === finding.id;
              const isLogged = loggedTicketIds.includes(finding.id);

              return (
                <div
                  key={finding.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs transition-all hover:border-indigo-200"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          className={`text-[10px] ${
                            finding.severity === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : finding.severity === 'IMPORTANT'
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-indigo-100 text-indigo-800 border-indigo-300'
                          }`}
                        >
                          {finding.severity}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {finding.moduleShortName} • {finding.stepLabel}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-[10px] border-slate-300 text-slate-700"
                        >
                          {finding.viewport === 'ALL_VIEWPORTS'
                            ? 'All Screens (375px / 768px / 1366px)'
                            : finding.viewport}
                        </Badge>
                        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                          {finding.targetFilePath}
                        </code>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 pt-1">
                        {finding.title}
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        onClick={() =>
                          handleCopyText(
                            finding.id,
                            singleFixPrompt,
                            `Fix Prompt for ${finding.moduleShortName}`
                          )
                        }
                        className="h-8 bg-indigo-600 px-3 text-xs font-semibold text-white hover:bg-indigo-500"
                      >
                        {isCopied ? (
                          <>
                            <Check className="mr-1.5 h-3.5 w-3.5" />
                            Copied Fix Prompt
                          </>
                        ) : (
                          <>
                            <Copy className="mr-1.5 h-3.5 w-3.5" />
                            Copy Antigravity Fix Prompt
                          </>
                        )}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setActivePromptPreview({
                            title: `Fix Prompt: ${finding.title}`,
                            promptText: singleFixPrompt,
                          })
                        }
                        className="h-8 px-2.5 text-xs"
                      >
                        <Eye className="mr-1 h-3.5 w-3.5" />
                        View Prompt
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isLogged}
                        onClick={() => handleLogFindingToBugTracker(finding)}
                        className="h-8 px-2.5 text-xs"
                      >
                        {isLogged ? (
                          <>
                            <Check className="mr-1 h-3.5 w-3.5 text-emerald-600" />
                            Logged
                          </>
                        ) : (
                          <>
                            <Bug className="mr-1 h-3.5 w-3.5 text-amber-600" />
                            Send to Bug Tracker
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Persona First-Person Quote */}
                  <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50/50 px-3.5 py-2.5 text-xs italic text-indigo-950">
                    <strong>
                      {activePersona.name} ({activeComprehension.shortBadge}):
                    </strong>{' '}
                    “{finding.personaFirstPersonQuote}”
                  </div>

                  {/* Technical & Recommended Fix */}
                  <div className="mt-3 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                      <div className="font-semibold text-slate-700">
                        Technical &amp; Layout Finding:
                      </div>
                      <p className="mt-1 text-slate-600">
                        {finding.technicalFinding}
                      </p>
                    </div>
                    <div className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-3">
                      <div className="font-semibold text-emerald-900">
                        Recommended Fix:
                      </div>
                      <p className="mt-1 text-emerald-800">
                        {finding.recommendedFix}
                      </p>
                      {finding.suggestedPlainEnglishCopy && (
                        <div className="mt-2 rounded bg-white/80 p-2 font-mono text-[11px] text-slate-800 border border-emerald-200">
                          <strong>Suggested L1/L2 Copy:</strong>{' '}
                          {finding.suggestedPlainEnglishCopy}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
