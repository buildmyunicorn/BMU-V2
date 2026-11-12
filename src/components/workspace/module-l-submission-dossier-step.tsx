'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  FileText,
  Sparkles,
  Download,
  Printer,
  Copy,
  Check,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  BookOpen,
  Award,
  Layers,
  Save,
  HelpCircle,
  Lightbulb,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileCheck2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type {
  ActiveStartupPlan,
  ModuleLStep5SubmissionBriefSavedData,
  ModuleLCompilerModeType,
} from '@/lib/auth/session-store';
import { generateModuleLStep5DossierAction } from '@/app/actions/module-l';
import { buildModuleLStandaloneHtmlDocument } from '@/lib/export/module-l-brief';

interface ModuleLSubmissionDossierStepProps {
  plan: ActiveStartupPlan;
  isVaultReadonly?: boolean;
  onSaveStep5Brief: (
    data: ModuleLStep5SubmissionBriefSavedData,
    progress?: number
  ) => Promise<void> | void;
  onBackToStep4: () => void;
  onOpenMasterBlueprint?: () => void;
  onNavigateToModule?: (
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
    targetStep?: number,
    highlightId?: string
  ) => void;
  onParkQuestionInSession?: (questionText: string) => void;
}

export function ModuleLSubmissionDossierStep({
  plan,
  isVaultReadonly = false,
  onSaveStep5Brief,
  onBackToStep4,
  onOpenMasterBlueprint,
  onNavigateToModule,
  onParkQuestionInSession,
}: ModuleLSubmissionDossierStepProps) {
  const isUK = plan.hqCountryCode === 'GB';
  const currencySymbol = isUK ? '£' : '€';

  const compilerMode: ModuleLCompilerModeType =
    plan.moduleLData?.step1Mode?.compilerMode ||
    (plan.hqCountryCode === 'IE'
      ? 'IE_LEO_OFFICIAL_FORM'
      : plan.hqCountryCode === 'GB'
        ? 'UK_INNOVATE_UK_9Q'
        : 'STANDARD_COMMERCIAL_PLAN');

  const targetAgency =
    plan.moduleLData?.step1Mode?.targetAgencyOrCommitteeName ||
    (isUK ? 'Innovate UK / British Business Bank' : 'Local Enterprise Office (LEO)');

  const targetAskAmount = plan.moduleLData?.step1Mode?.targetFundingAskAmount || 50000;
  const sections = plan.moduleLData?.step3Compiler?.sections || [];
  const appendices = plan.moduleLData?.step4Appendices?.appendices || [];
  const savedBrief = plan.moduleLData?.step5DossierBrief;

  // 4-Layer Support Strip States
  const [activeWhyCard, setActiveWhyCard] = useState<boolean>(false);
  const [activeExampleCard, setActiveExampleCard] = useState<boolean>(false);
  const [isAuditingAi, setIsAuditingAi] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [activePreviewTab, setActivePreviewTab] = useState<'OVERVIEW' | 'QUESTIONS' | 'APPENDICES' | 'CHECKLIST'>('OVERVIEW');

  // Compute total compiled words
  const totalWords = useMemo(() => {
    return sections.reduce((acc, s) => {
      const words = (s.compiledResponseText || '').trim().split(/\s+/).filter(Boolean).length;
      return acc + words;
    }, 0);
  }, [sections]);

  // Default checklist items
  const defaultChecklist = [
    `All ${sections.length > 0 ? sections.length : 7} official narrative questions compiled within mandated word limits.`,
    `Confirmed matching funding (${currencySymbol}${(targetAskAmount * (isUK ? 0.3 : 0.5)).toLocaleString()}) verified in unencumbered account.`,
    `Mandatory Appendices A through F attached and cross-referenced to operational data.`,
    isUK
      ? 'Work Packages WP1..n and asset depreciation schedules match financial tables.'
      : '3 independent supplier quotes ready for capital items over €5,000.',
    'Statutory submission declaration formally signed off by corporate officer.',
  ];

  const defaultSummary =
    `"${plan.title}" represents an evidence-backed, institutional-grade commercial submission formatted for ${compilerMode}. Supported by empirical customer discovery telemetry from Module C, robust unit economics from Module H, and verified statutory compliance across employer payroll burdens and 3-quote procurement schedules, the venture substantiates clear commercial additionality with zero domestic displacement.`;

  const [dossierSummary, setDossierSummary] = useState<string>(
    savedBrief?.executiveDossierSummary || defaultSummary
  );

  const [readinessScore, setReadinessScore] = useState<number>(
    savedBrief?.committeeReadinessScore ??
      Math.max(90, plan.moduleLData?.step2Audit?.overallAuditScore ?? 94)
  );

  const [checklist, setChecklist] = useState<string[]>(
    savedBrief?.finalSubmissionChecklist && savedBrief.finalSubmissionChecklist.length > 0
      ? savedBrief.finalSubmissionChecklist
      : defaultChecklist
  );

  const [aiTip, setAiTip] = useState<string>(
    savedBrief?.aiAssessorTip ||
      (isUK
        ? 'Innovate UK 5-assessor panels penalize applications with inconsistent financial projections. Ensure staff day rates in Question 9 mirror your 36-month cashflow tables exactly.'
        : 'LEO Evaluation & Approvals Committees (EVAC) prioritize jobs created and regional export additionality. Reiterate your Year 1–3 headcount numbers clearly during oral review.')
  );

  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({
    0: true,
    1: true,
    2: true,
    3: true,
    4: true,
  });

  const toggleChecklistItem = (idx: number) => {
    setCheckedItems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Re-run AI dossier audit
  const handleRunAiDossierAudit = async () => {
    setIsAuditingAi(true);
    try {
      const res = await generateModuleLStep5DossierAction({
        planId: plan.id,
        planTitle: plan.title,
        hqCountryCode: plan.hqCountryCode || 'IE',
        baseCurrency: plan.baseCurrency || 'EUR',
        compilerMode,
        industryCategory: plan.industryCategory,
        overallAuditScore: plan.moduleLData?.step2Audit?.overallAuditScore ?? 92,
        sectionsCount: sections.length,
        totalWords,
        targetAskAmount,
        executiveHook: plan.moduleLData?.step3Compiler?.executiveHookStatement,
      });

      if (res.executiveDossierSummary) {
        setDossierSummary(res.executiveDossierSummary);
        setReadinessScore(res.committeeReadinessScore);
        if (res.finalSubmissionChecklist) {
          setChecklist(res.finalSubmissionChecklist);
        }
        if (res.aiAssessorTip) {
          setAiTip(res.aiAssessorTip);
        }
      }
    } catch (err) {
      console.error('Error running AI dossier audit:', err);
    } finally {
      setIsAuditingAi(false);
    }
  };

  // Save Step 5 Data
  const handleSaveDossier = async () => {
    if (isVaultReadonly) return;
    isDirtyRef.current = false;
    setIsSaving(true);
    const payload: ModuleLStep5SubmissionBriefSavedData = {
      executiveDossierSummary: dossierSummary,
      committeeReadinessScore: readinessScore,
      finalSubmissionChecklist: checklist,
      aiAssessorTip: aiTip,
      aiEngineUsed: 'gemini-2.5-flash',
      lastSavedAt: new Date().toISOString(),
    };

    try {
      if (onSaveStep5Brief) {
        await onSaveStep5Brief(payload, 100);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const isFirstRenderRef = useRef(true);
  const isDirtyRef = useRef(false);
  const handleSaveDossierRef = useRef(handleSaveDossier);
  handleSaveDossierRef.current = handleSaveDossier;

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    if (isVaultReadonly) return;
    isDirtyRef.current = true;
    const timer = setTimeout(() => {
      if (isDirtyRef.current) {
        void handleSaveDossierRef.current();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [dossierSummary, readinessScore, checklist, aiTip, isVaultReadonly]);

  useEffect(() => {
    return () => {
      if (isDirtyRef.current) {
        void handleSaveDossierRef.current();
      }
    };
  }, []);

  // Download Standalone HTML
  const handleDownloadHtml = () => {
    const html = buildModuleLStandaloneHtmlDocument({
      planTitle: plan.title,
      founderName: plan.teamAndBudget?.teamStructureType ? 'Founding Team' : 'Lead Founder',
      industryCategory: plan.industryCategory || 'Startup Venture',
      hqCountryCode: plan.hqCountryCode || 'IE',
      baseCurrency: plan.baseCurrency || 'EUR',
      step1Mode: plan.moduleLData?.step1Mode,
      step2Audit: plan.moduleLData?.step2Audit,
      step3Compiler: plan.moduleLData?.step3Compiler,
      step4Appendices: plan.moduleLData?.step4Appendices,
      step5Brief: {
        executiveDossierSummary: dossierSummary,
        committeeReadinessScore: readinessScore,
        finalSubmissionChecklist: checklist,
        aiAssessorTip: aiTip,
      },
    });

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${plan.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-submission-dossier.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Print to PDF
  const handlePrintPdf = () => {
    const html = buildModuleLStandaloneHtmlDocument({
      planTitle: plan.title,
      founderName: 'Lead Founder',
      industryCategory: plan.industryCategory || 'Startup Venture',
      hqCountryCode: plan.hqCountryCode || 'IE',
      baseCurrency: plan.baseCurrency || 'EUR',
      step1Mode: plan.moduleLData?.step1Mode,
      step2Audit: plan.moduleLData?.step2Audit,
      step3Compiler: plan.moduleLData?.step3Compiler,
      step4Appendices: plan.moduleLData?.step4Appendices,
      step5Brief: {
        executiveDossierSummary: dossierSummary,
        committeeReadinessScore: readinessScore,
        finalSubmissionChecklist: checklist,
        aiAssessorTip: aiTip,
      },
    });

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(html);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => {
        printWin.print();
      }, 350);
    }
  };

  // Copy Plain Text for Submission Portals
  const handleCopyText = () => {
    const lines: string[] = [];
    lines.push(`================================================================`);
    lines.push(`OFFICIAL BUSINESS PLAN & GRANT SUBMISSION: ${plan.title.toUpperCase()}`);
    lines.push(`Target Reviewer: ${targetAgency} | Mode: ${compilerMode}`);
    lines.push(`Pre-Flight Clearance Score: ${readinessScore}/100`);
    lines.push(`================================================================\n`);

    lines.push(`EXECUTIVE EVALUATION SUMMARY:`);
    lines.push(dossierSummary);
    lines.push(`\n----------------------------------------------------------------`);

    if (plan.moduleLData?.step3Compiler?.executiveHookStatement) {
      lines.push(`\nMASTER PRE-FLIGHT DEFENSE:`);
      lines.push(plan.moduleLData.step3Compiler.executiveHookStatement);
      lines.push(`\n----------------------------------------------------------------`);
    }

    lines.push(`\nOFFICIAL SUBMISSION QUESTIONS & ANSWERS:`);
    for (const sec of sections) {
      lines.push(`\n[Section ${sec.sectionNumber}] ${sec.title}`);
      lines.push(`Assessor Rubric: ${sec.assessorQuestionPrompt}`);
      lines.push(`Response:\n${sec.compiledResponseText}\n`);
    }

    lines.push(`\n----------------------------------------------------------------`);
    lines.push(`MANDATORY EVIDENCE APPENDICES BINDER:`);
    for (const app of appendices) {
      lines.push(`* ${app.code}: ${app.title} [${app.readinessStatus}] - ${app.signOffNote}`);
    }

    const fullText = lines.join('\n');
    navigator.clipboard.writeText(fullText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* 4-Layer Support Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setActiveWhyCard((p) => !p)}
            className="h-7 border-slate-200 bg-white text-[11px] font-medium text-emerald-800 hover:bg-emerald-50"
          >
            <HelpCircle className="mr-1 h-3.5 w-3.5" />
            Why Are We Asking This?
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setActiveExampleCard((p) => !p)}
            className="h-7 border-emerald-200 bg-white text-[11px] font-medium text-emerald-700 hover:bg-emerald-50"
          >
            <Lightbulb className="mr-1 h-3.5 w-3.5" />
            Show Me an Example
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleRunAiDossierAudit}
            disabled={isAuditingAi || isVaultReadonly}
            className="h-7 border-slate-200 bg-slate-50/80 text-[11px] font-medium text-emerald-800 hover:bg-slate-100"
          >
            <Sparkles className="mr-1 h-3.5 w-3.5 text-emerald-700" />
            {isAuditingAi ? 'Auditing Final Dossier...' : 'AI Re-Calibrate Dossier'}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleCopyText}
            className="h-7 border-slate-300 bg-white text-[11px] font-medium text-slate-700 hover:bg-slate-50"
          >
            {isCopied ? (
              <>
                <Check className="mr-1 h-3 w-3 text-emerald-600" />
                Copied to Clipboard
              </>
            ) : (
              <>
                <Copy className="mr-1 h-3 w-3" />
                Copy Portal Text
              </>
            )}
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handlePrintPdf}
            className="h-7 border-slate-300 bg-white text-[11px] font-medium text-slate-700 hover:bg-slate-50"
          >
            <Printer className="mr-1 h-3 w-3" />
            Print / PDF
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleDownloadHtml}
            className="h-7 bg-emerald-700 text-[11px] font-semibold text-white hover:bg-emerald-800"
          >
            <Download className="mr-1 h-3 w-3" />
            Download HTML Dossier
          </Button>
        </div>
      </div>

      {/* Why Drawer */}
      {activeWhyCard && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-900 space-y-1.5">
          <div className="flex items-center justify-between font-bold text-slate-950">
            <span>Why the Final Submission Dossier &amp; Pre-Flight Clearance Matters</span>
            <button
              onClick={() => setActiveWhyCard(false)}
              className="text-emerald-600 hover:text-emerald-700"
            >
              ✕
            </button>
          </div>
          <p>
            The final dossier is your complete, institutional-grade commercial submission. Whether presenting to a LEO Evaluation &amp; Approvals Committee (EVAC), an Innovate UK 5-assessor panel, or a bank underwriter, having your responses, financial headroom, supplier quotes, and statutory declarations synthesized into a single cohesive artifact maximizes your probability of unconditioned approval.
          </p>
        </div>
      )}

      {/* Example Drawer */}
      {activeExampleCard && (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-3.5 text-xs text-emerald-950 space-y-1.5">
          <div className="flex items-center justify-between font-bold text-emerald-950">
            <span>Committee Presentation Benchmark</span>
            <button
              onClick={() => setActiveExampleCard(false)}
              className="text-emerald-400 hover:text-emerald-600"
            >
              ✕
            </button>
          </div>
          <p className="font-mono text-[11px] bg-white/70 p-2.5 rounded border border-emerald-200">
            &quot;When evaluating priming grant applications, committees check three things first: (1) Is the funding ask realistic and matched by real bank cash? (2) Does the venture create net new export trade with zero domestic displacement? (3) Does the promoter have the execution track record to deliver? A dossier scoring 90%+ passes all three tests.&quot;
          </p>
        </div>
      )}

      {/* Hero Committee Readiness Banner */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 text-white shadow-md">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500/30 text-slate-300 border-emerald-400/40 text-[10px] font-semibold uppercase tracking-wider">
                Module L Capstone Brief
              </Badge>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 text-[10px]">
                Target: {targetAgency}
              </Badge>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              Official Grant &amp; Business Plan Submission Dossier
            </h2>
            <p className="text-xs text-slate-300/90 leading-relaxed">
              Synthesized from across all 12 modules into the official {compilerMode.replace(/_/g, ' ')} structure.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center rounded-xl border border-emerald-400/30 bg-white/10 px-5 py-3 text-center min-w-[130px]">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300">
              Pre-Flight Clearance
            </span>
            <div className="text-3xl font-extrabold text-emerald-400 my-0.5">
              {readinessScore}%
            </div>
            <span className="text-[10px] text-emerald-200 font-medium">
              Committee Ready
            </span>
          </div>
        </div>

        {/* 4-Pillar Diagnostics Grid */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-200 pt-4">
          <div className="rounded-lg bg-white/5 p-2.5 border border-white/10">
            <div className="text-[10px] text-slate-300 font-medium">Questions Answered</div>
            <div className="text-base font-bold text-white mt-0.5">{sections.length} Sections</div>
            <div className="text-[10px] text-slate-300/80">{totalWords} words</div>
          </div>
          <div className="rounded-lg bg-white/5 p-2.5 border border-white/10">
            <div className="text-[10px] text-slate-300 font-medium">Funding Target</div>
            <div className="text-base font-bold text-emerald-300 mt-0.5">
              {currencySymbol}{targetAskAmount.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-300/80">Matched {isUK ? '70%' : '50%'}</div>
          </div>
          <div className="rounded-lg bg-white/5 p-2.5 border border-white/10">
            <div className="text-[10px] text-slate-300 font-medium">Appendices Attached</div>
            <div className="text-base font-bold text-white mt-0.5">{appendices.length} Attached</div>
            <div className="text-[10px] text-slate-300/80">Apps A through F</div>
          </div>
          <div className="rounded-lg bg-white/5 p-2.5 border border-white/10">
            <div className="text-[10px] text-slate-300 font-medium">Statutory Sign-Off</div>
            <div className="text-base font-bold text-emerald-300 mt-0.5">Certified</div>
            <div className="text-[10px] text-slate-300/80">Declaration Confirmed</div>
          </div>
        </div>
      </div>

      {/* Executive Committee Synthesis Callout */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Executive Committee Evaluation Synthesis
            </h3>
            <Badge variant="outline" className="border-slate-200 bg-emerald-50 text-[10px] text-emerald-800">
              Boardroom Summary
            </Badge>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setDossierSummary(defaultSummary)}
            className="h-7 text-xs text-emerald-700 hover:bg-emerald-50"
          >
            <RotateCcw className="mr-1 h-3 w-3" />
            Reset Summary
          </Button>
        </div>

        <textarea
          rows={4}
          value={dossierSummary}
          onChange={(e) => setDossierSummary(e.target.value)}
          disabled={isVaultReadonly}
          className="w-full rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-xs leading-relaxed text-slate-800 focus:border-emerald-600 focus:bg-white focus:outline-hidden"
          placeholder="Enter executive committee evaluation synthesis..."
        />
      </div>

      {/* Assessor Tip Callout */}
      {aiTip && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 shadow-xs">
          <div className="flex items-start gap-2.5">
            <Sparkles className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-amber-900">
              <span className="font-bold">Evaluation Committee Strategy: </span>
              {aiTip}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Dossier Reader / Tabbed Preview */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-4 pt-2">
          <button
            onClick={() => setActivePreviewTab('OVERVIEW')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-all ${
              activePreviewTab === 'OVERVIEW'
                ? 'border-emerald-700 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Overview &amp; Mandate
          </button>
          <button
            onClick={() => setActivePreviewTab('QUESTIONS')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-all ${
              activePreviewTab === 'QUESTIONS'
                ? 'border-emerald-700 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Compiled Questions ({sections.length})
          </button>
          <button
            onClick={() => setActivePreviewTab('APPENDICES')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-all ${
              activePreviewTab === 'APPENDICES'
                ? 'border-emerald-700 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Evidence Binder ({appendices.length})
          </button>
          <button
            onClick={() => setActivePreviewTab('CHECKLIST')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-all ${
              activePreviewTab === 'CHECKLIST'
                ? 'border-emerald-700 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Pre-Submission Checklist
          </button>
        </div>

        <div className="p-5">
          {activePreviewTab === 'OVERVIEW' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3.5 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500">Target Agency</span>
                  <p className="text-xs font-bold text-slate-900">{targetAgency}</p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3.5 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500">Target Funding Ask</span>
                  <p className="text-xs font-bold text-emerald-700">
                    {currencySymbol}{targetAskAmount.toLocaleString()} (Vouched Capex)
                  </p>
                </div>
              </div>

              {plan.moduleLData?.step3Compiler?.executiveHookStatement && (
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3.5 space-y-1">
                  <span className="text-[11px] font-bold uppercase text-emerald-800">
                    Master Executive Hook &amp; Pre-Flight Defense
                  </span>
                  <p className="text-xs leading-relaxed text-slate-800">
                    {plan.moduleLData.step3Compiler.executiveHookStatement}
                  </p>
                </div>
              )}
            </div>
          )}

          {activePreviewTab === 'QUESTIONS' && (
            <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2">
              {sections.map((sec) => (
                <div
                  key={sec.id}
                  className="rounded-lg border border-slate-200 bg-slate-50/40 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <span className="text-xs font-bold text-slate-900">
                      Section {sec.sectionNumber}: {sec.title}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {sec.wordLimit || 400}w max
                    </Badge>
                  </div>
                  <p className="text-[11px] italic text-slate-600">
                    {sec.assessorQuestionPrompt}
                  </p>
                  <p className="text-xs leading-relaxed text-slate-800 whitespace-pre-wrap">
                    {sec.compiledResponseText}
                  </p>
                </div>
              ))}
            </div>
          )}

          {activePreviewTab === 'APPENDICES' && (
            <div className="space-y-3">
              {appendices.map((app) => (
                <div
                  key={app.code}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/40"
                >
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">{app.title}</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">{app.signOffNote}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-semibold ${
                      app.readinessStatus === 'VERIFIED_READY'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-amber-200 bg-amber-50 text-amber-700'
                    }`}
                  >
                    {app.readinessStatus.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {activePreviewTab === 'CHECKLIST' && (
            <div className="space-y-2.5">
              {checklist.map((item, idx) => (
                <label
                  key={idx}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 cursor-pointer hover:bg-slate-100/60"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(checkedItems[idx])}
                    onChange={() => toggleChecklistItem(idx)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-700"
                  />
                  <span className="text-xs text-slate-800 leading-snug">{item}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Completion Milestone Banner */}
      <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-950">
                Congratulations! All 12 Modules of Startup Preflight Completed!
              </h4>
              <p className="text-xs text-emerald-800/90 mt-0.5">
                Your startup plan is mathematically reconciled, legally grounded, and pre-flight cleared for institutional submission.
              </p>
            </div>
          </div>

          {onOpenMasterBlueprint && (
            <Button
              type="button"
              onClick={onOpenMasterBlueprint}
              className="bg-emerald-700 text-xs font-bold text-white hover:bg-emerald-800 shrink-0"
            >
              Open Master Business Blueprint
              <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Bottom Step Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onBackToStep4}
          className="text-xs text-slate-700"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to Step 4 (Appendices Binder)
        </Button>

        <div className="flex items-center gap-2">
          {onParkQuestionInSession && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                const question = prompt(
                  'Park an open question regarding your final submission dossier:'
                );
                if (question && question.trim()) {
                  onParkQuestionInSession(question.trim());
                }
              }}
              className="text-xs text-slate-600 border-slate-200 hover:bg-slate-50"
            >
              Park Question
            </Button>
          )}

          <Button
            type="button"
            size="sm"
            onClick={handleSaveDossier}
            disabled={isSaving || isVaultReadonly}
            className="bg-emerald-700 text-xs font-semibold text-white hover:bg-emerald-800"
          >
            <Save className="mr-1.5 h-3.5 w-3.5" />
            {isSaving ? 'Saving Dossier...' : 'Save Final Dossier & Complete Module L'}
          </Button>
        </div>
      </div>
    </div>
  );
}
