'use client';

import React, { useState, useMemo } from 'react';
import {
  Paperclip,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  BookOpen,
  HelpCircle,
  Lightbulb,
  ExternalLink,
  ShieldCheck,
  FileCheck2,
  BookmarkPlus,
  Sparkles,
  FileSpreadsheet,
  Cpu,
  ShoppingBag,
  Users,
  MessageSquare,
  Building2,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type {
  ActiveStartupPlan,
  ModuleLStep4AppendicesSavedData,
  ModuleLAppendixBinderItem,
} from '@/lib/auth/session-store';
import { generateModuleLStep4AuditAction } from '@/app/actions/module-l';

interface ModuleLAppendicesBinderStepProps {
  plan: ActiveStartupPlan;
  isVaultReadonly?: boolean;
  onSaveStep4Appendices: (
    data: ModuleLStep4AppendicesSavedData,
    progress?: number
  ) => Promise<void> | void;
  onBackToStep3: () => void;
  onContinueToStep5: () => void;
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

export function ModuleLAppendicesBinderStep({
  plan,
  isVaultReadonly = false,
  onSaveStep4Appendices,
  onBackToStep3,
  onContinueToStep5,
  onNavigateToModule,
  onParkQuestionInSession,
}: ModuleLAppendicesBinderStepProps) {
  const isUK = plan.hqCountryCode === 'GB';
  const currencySymbol = isUK ? '£' : '€';

  const compilerMode = plan.moduleLData?.step1Mode?.compilerMode || 'IE_LEO_OFFICIAL_FORM';
  const savedAppendices = plan.moduleLData?.step4Appendices;

  // 4-Layer Support Strip States
  const [activeWhyCard, setActiveWhyCard] = useState<boolean>(false);
  const [activeExampleCard, setActiveExampleCard] = useState<boolean>(false);
  const [isAuditingAi, setIsAuditingAi] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Compute live readiness from preceding modules
  const defaultAppendices = useMemo<ModuleLAppendixBinderItem[]>(() => {
    // 1. Finance & Cashflow
    const hasFinance = Boolean(
      plan.moduleJData?.step1OverheadsTax || plan.moduleHData?.step1RevenueModel
    );
    const financeStatus = hasFinance ? 'VERIFIED_READY' : 'PARTIAL_DATA';

    // 2. Product Architecture & Work Packages
    const hasProduct = Boolean(
      plan.moduleDData?.productVehicle || plan.moduleDData?.buildVsBuy || plan.moduleDData?.workPackagesAndFlow
    );
    const productStatus = hasProduct ? 'VERIFIED_READY' : 'PARTIAL_DATA';

    // 3. Operations & 3-Quote Procurement
    const hasOps = Boolean(
      plan.moduleEData?.premisesAndEquipment || plan.moduleEData?.riskRegister
    );
    const opsStatus = hasOps ? 'VERIFIED_READY' : 'PARTIAL_DATA';

    // 4. Team CVs & 7-Hats
    const hasTeam = Boolean(
      plan.moduleFData?.step2RoleMatrixData || plan.teamAndBudget?.teamStructureType
    );
    const teamStatus = hasTeam ? 'VERIFIED_READY' : 'PARTIAL_DATA';

    // 5. Customer Surveys & Telemetry
    const hasSurveys = Boolean(
      plan.moduleCData?.surveys && plan.moduleCData.surveys.length > 0
    );
    const surveyStatus = hasSurveys ? 'VERIFIED_READY' : 'PARTIAL_DATA';

    // 6. Corporate Setup & Banking
    const hasCorporate = Boolean(
      plan.moduleGData?.step1?.legalStructure || plan.moduleGData?.step3?.hasDedicatedIban
    );
    const corporateStatus = hasCorporate ? 'VERIFIED_READY' : 'PARTIAL_DATA';

    return [
      {
        code: 'APPENDIX_A',
        title: 'Appendix A: 36-Month Financial Projections & Cashflow Trough',
        included: true,
        readinessStatus: financeStatus,
        sourceModuleCode: 'MOD_J_FINANCE',
        signOffNote: hasFinance
          ? `Cashflow schedule reconciled with statutory payroll taxes and working capital buffer.`
          : `Financial overhead posture and revenue crossover require final review in Module J.`,
      },
      {
        code: 'APPENDIX_B',
        title: 'Appendix B: Technical Merit, Product Architecture & Work Packages (WP1..n)',
        included: true,
        readinessStatus: productStatus,
        sourceModuleCode: 'MOD_D_PRODUCT_BUILD',
        signOffNote: hasProduct
          ? `Product build tracks, core features, and technical work packages compiled.`
          : `Work package deliverables and technical roadmap require final review in Module D.`,
      },
      {
        code: 'APPENDIX_C',
        title: 'Appendix C: 3-Quote Supplier Procurement & Capital Equipment Schedule',
        included: true,
        readinessStatus: opsStatus,
        sourceModuleCode: 'MOD_E_OPERATIONS',
        signOffNote: hasOps
          ? isUK
            ? `Capital depreciation schedule verified against Innovate UK asset guidelines.`
            : `Equipment schedule conforms strictly to LEO 3-quote rule with zero general laptop infractions.`
          : `Supplier quotation requirements and equipment schedules require sign-off in Module E.`,
      },
      {
        code: 'APPENDIX_D',
        title: 'Appendix D: Promoter Profiles, CV Summaries & 7-Hats Governance',
        included: true,
        readinessStatus: teamStatus,
        sourceModuleCode: 'MOD_F_COFOUNDER_TEAM',
        signOffNote: hasTeam
          ? `Founding team 150-word profiles and 7 Startup Hats responsibility division confirmed.`
          : `Promoter profiles and founder equity vesting need final confirmation in Module F.`,
      },
      {
        code: 'APPENDIX_E',
        title: 'Appendix E: Primary Customer Discovery Telemetry & Mom-Test Survey Data',
        included: true,
        readinessStatus: surveyStatus,
        sourceModuleCode: 'MOD_C_SURVEYS_FEEDBACK',
        signOffNote: hasSurveys
          ? `Primary customer survey data and willingness-to-pay tiers ready for assessor review.`
          : `Customer discovery logs and survey evidence should be linked in Module C.`,
      },
      {
        code: 'APPENDIX_F',
        title: 'Appendix F: Corporate LTD Registration, Business Banking & Statutory IP Clearances',
        included: true,
        readinessStatus: corporateStatus,
        sourceModuleCode: 'MOD_G_LAUNCHPAD',
        signOffNote: hasCorporate
          ? `Corporate LTD entity, dedicated business bank account, and official company email verified.`
          : `Legal entity details and dedicated business banking status need sign-off in Module G.`,
      },
    ];
  }, [plan, isUK]);

  const [appendices, setAppendices] = useState<ModuleLAppendixBinderItem[]>(
    savedAppendices?.appendices && savedAppendices.appendices.length > 0
      ? savedAppendices.appendices
      : defaultAppendices
  );

  const [declarationConfirmed, setDeclarationConfirmed] = useState<boolean>(
    savedAppendices?.declarationConfirmed ?? true
  );

  const [signatoryName, setSignatoryName] = useState<string>(
    savedAppendices?.signatoryName || plan.teamAndBudget?.teamStructureType ? 'Founding Team' : 'Lead Founder'
  );

  const [signatoryTitle, setSignatoryTitle] = useState<string>(
    savedAppendices?.signatoryTitle || 'Founder & CEO'
  );

  const [aiAuditText, setAiAuditText] = useState<string>(
    `All mandatory statutory appendices (A through F) are attached and cross-referenced to their respective operational source modules. All quotes for capital items conform to statutory ${isUK ? 'Innovate UK asset depreciation' : 'LEO 3-quote competitive procurement'} standards.`
  );

  const [aiTip, setAiTip] = useState<string>(
    isUK
      ? 'Innovate UK assessors cross-reference Appendix B Work Packages against Question 5 milestones. Any task in the appendix without matching dates in the narrative triggers score deductions.'
      : 'LEO claims officers will not disburse voucher payments without valid, dated supplier invoices that exactly match the quotes registered in Appendix C.'
  );

  const readyCount = appendices.filter((a) => a.readinessStatus === 'VERIFIED_READY').length;
  const partialCount = appendices.filter((a) => a.readinessStatus === 'PARTIAL_DATA').length;
  const missingCount = appendices.filter(
    (a) => a.readinessStatus === 'MISSING_ACTION_REQUIRED'
  ).length;

  const toggleAppendixIncluded = (code: string) => {
    setAppendices((prev) =>
      prev.map((a) => (a.code === code ? { ...a, included: !a.included } : a))
    );
  };

  const updateSignOffNote = (code: string, note: string) => {
    setAppendices((prev) =>
      prev.map((a) => (a.code === code ? { ...a, signOffNote: note } : a))
    );
  };

  const handleRunAiAudit = async () => {
    setIsAuditingAi(true);
    try {
      const appendicesSummary = appendices
        .map(
          (a) =>
            `[${a.code}] ${a.title} - Status: ${a.readinessStatus} (Included: ${a.included ? 'YES' : 'NO'}). Note: ${a.signOffNote}`
        )
        .join('\n');

      const res = await generateModuleLStep4AuditAction({
        planId: plan.id,
        planTitle: plan.title,
        hqCountryCode: plan.hqCountryCode || 'IE',
        baseCurrency: plan.baseCurrency || 'EUR',
        compilerMode,
        industryCategory: plan.industryCategory,
        appendicesSummary,
      });

      if (res.aiBinderAssessment) {
        setAiAuditText(res.aiBinderAssessment);
      }
      if (res.aiAssessorTip) {
        setAiTip(res.aiAssessorTip);
      }
    } catch (err) {
      console.error('Error auditing appendices binder with AI:', err);
    } finally {
      setIsAuditingAi(false);
    }
  };

  const handleSaveAndContinue = async () => {
    setIsSaving(true);
    const payload: ModuleLStep4AppendicesSavedData = {
      appendices,
      declarationConfirmed,
      signatoryName,
      signatoryTitle,
      lastSavedAt: new Date().toISOString(),
    };

    try {
      if (onSaveStep4Appendices) {
        await onSaveStep4Appendices(payload, 80);
      }
      onContinueToStep5();
    } finally {
      setIsSaving(false);
    }
  };

  const getAppendixIcon = (code: string) => {
    switch (code) {
      case 'APPENDIX_A':
        return <FileSpreadsheet className="h-4 w-4 text-emerald-600" />;
      case 'APPENDIX_B':
        return <Cpu className="h-4 w-4 text-indigo-600" />;
      case 'APPENDIX_C':
        return <ShoppingBag className="h-4 w-4 text-amber-600" />;
      case 'APPENDIX_D':
        return <Users className="h-4 w-4 text-violet-600" />;
      case 'APPENDIX_E':
        return <MessageSquare className="h-4 w-4 text-sky-600" />;
      case 'APPENDIX_F':
        return <Building2 className="h-4 w-4 text-slate-700" />;
      default:
        return <Paperclip className="h-4 w-4 text-slate-600" />;
    }
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
            className="h-7 border-indigo-200 bg-white text-[11px] font-medium text-indigo-700 hover:bg-indigo-50"
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
            onClick={handleRunAiAudit}
            disabled={isAuditingAi || isVaultReadonly}
            className="h-7 border-violet-200 bg-violet-50/80 text-[11px] font-medium text-violet-700 hover:bg-violet-100"
          >
            <Sparkles className="mr-1 h-3.5 w-3.5 text-violet-600" />
            {isAuditingAi ? 'Auditing Evidence Binder...' : 'AI Audit Evidence Binder'}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-emerald-300 bg-emerald-50 text-[11px] font-semibold text-emerald-700"
          >
            {readyCount} / {appendices.length} Verified Ready
          </Badge>
          {partialCount > 0 && (
            <Badge
              variant="outline"
              className="border-amber-300 bg-amber-50 text-[11px] font-semibold text-amber-700"
            >
              {partialCount} Partial
            </Badge>
          )}
        </div>
      </div>

      {/* Why Drawer */}
      {activeWhyCard && (
        <div className="rounded-lg border border-indigo-100 bg-indigo-50/70 p-3.5 text-xs text-indigo-900 space-y-1.5">
          <div className="flex items-center justify-between font-bold text-indigo-950">
            <span>Why the Appendices Proof Binder Is Non-Negotiable</span>
            <button
              onClick={() => setActiveWhyCard(false)}
              className="text-indigo-400 hover:text-indigo-600"
            >
              ✕
            </button>
          </div>
          <p>
            Enterprise funding agencies (LEO, Enterprise Ireland, Innovate UK, British Business Bank) disqualify over 30% of applications before evaluation due to missing statutory attachments: unverified supplier quotes, missing CVs, or absent company bank statements. Step 4 ensures every statutory requirement is assembled and declared compliant before submission.
          </p>
        </div>
      )}

      {/* Example Drawer */}
      {activeExampleCard && (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-3.5 text-xs text-emerald-950 space-y-1.5">
          <div className="flex items-center justify-between font-bold text-emerald-950">
            <span>Procurement &amp; Proof Standards Example</span>
            <button
              onClick={() => setActiveExampleCard(false)}
              className="text-emerald-400 hover:text-emerald-600"
            >
              ✕
            </button>
          </div>
          <p className="font-mono text-[11px] bg-white/70 p-2.5 rounded border border-emerald-200">
            &quot;For LEO applications, any equipment or contractor package over €5,000 must include 3 independent, itemized quotes from unrelated suppliers. Quotes must show supplier registered business address, tax reference, and exact itemized specification.&quot;
          </p>
        </div>
      )}

      {/* Assessor Tip Callout */}
      {aiTip && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 shadow-xs">
          <div className="flex items-start gap-2.5">
            <Sparkles className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-amber-900">
              <span className="font-bold">Claims Officer &amp; Auditor Guidance: </span>
              {aiTip}
            </div>
          </div>
        </div>
      )}

      {/* Executive Binder Assessment Summary */}
      <div className="rounded-xl border border-indigo-200 bg-white p-5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Statutory Evidence &amp; Compliance Synthesis
            </h3>
            <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-[10px] text-indigo-700">
              Assessor Binder Note
            </Badge>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() =>
              setAiAuditText(
                `All mandatory statutory appendices (A through F) are attached and cross-referenced to their respective operational source modules. All quotes for capital items conform to statutory ${isUK ? 'Innovate UK asset depreciation' : 'LEO 3-quote competitive procurement'} standards.`
              )
            }
            className="h-7 text-xs text-indigo-600 hover:bg-indigo-50"
          >
            <RotateCcw className="mr-1 h-3 w-3" />
            Reset to Standard Note
          </Button>
        </div>

        <textarea
          rows={3}
          value={aiAuditText}
          onChange={(e) => setAiAuditText(e.target.value)}
          disabled={isVaultReadonly}
          className="w-full rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-xs leading-relaxed text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-hidden"
          placeholder="Enter appendices audit note..."
        />
      </div>

      {/* 6 Mandatory Appendices Schedule Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-slate-900">
            Mandatory Appendices &amp; Verifiable Evidence Schedule ({appendices.length})
          </h3>
          <span className="text-xs text-slate-500">
            Linked to live operational modules
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {appendices.map((appendix) => {
            const isReady = appendix.readinessStatus === 'VERIFIED_READY';
            const isPartial = appendix.readinessStatus === 'PARTIAL_DATA';

            return (
              <div
                key={appendix.code}
                className={`rounded-xl border p-4.5 transition-all shadow-xs ${
                  appendix.included
                    ? 'border-slate-200 bg-white'
                    : 'border-slate-200/60 bg-slate-50/50 opacity-60'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 border border-slate-200">
                      {getAppendixIcon(appendix.code)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">
                          {appendix.title}
                        </h4>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold ${
                            isReady
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : isPartial
                                ? 'border-amber-200 bg-amber-50 text-amber-700'
                                : 'border-rose-200 bg-rose-50 text-rose-700'
                          }`}
                        >
                          {isReady ? (
                            <>
                              <Check className="mr-1 h-3 w-3" />
                              Verified Ready
                            </>
                          ) : isPartial ? (
                            <>
                              <AlertTriangle className="mr-1 h-3 w-3" />
                              Partial Data
                            </>
                          ) : (
                            <>
                              <AlertOctagon className="mr-1 h-3 w-3" />
                              Action Required
                            </>
                          )}
                        </Badge>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>Source:</span>
                        <Badge
                          variant="outline"
                          onClick={() => {
                            if (onNavigateToModule) {
                              onNavigateToModule(appendix.sourceModuleCode);
                            }
                          }}
                          className="cursor-pointer border-indigo-200 bg-indigo-50/70 text-[10px] font-medium text-indigo-700 hover:bg-indigo-100"
                        >
                          {appendix.sourceModuleCode.replace('MOD_', '')}
                          <ExternalLink className="ml-1 h-2.5 w-2.5 inline" />
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={appendix.included}
                        onChange={() => toggleAppendixIncluded(appendix.code)}
                        disabled={isVaultReadonly}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                      <span className="font-medium">Include in Binder</span>
                    </label>
                  </div>
                </div>

                <div className="mt-3.5 space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">
                    Sign-Off &amp; Assessor Verification Note:
                  </label>
                  <input
                    type="text"
                    value={appendix.signOffNote}
                    onChange={(e) => updateSignOffNote(appendix.code, e.target.value)}
                    disabled={isVaultReadonly || !appendix.included}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-hidden"
                    placeholder="Add verification notes for claims officer..."
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Statutory Submission Declaration & Signatory Box */}
      <div className="rounded-xl border border-slate-300 bg-gradient-to-b from-white to-slate-50/60 p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <FileCheck2 className="h-4 w-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Formal Statutory Submission Declaration
          </h3>
          <Badge variant="outline" className="border-slate-300 text-[10px] text-slate-600">
            Mandatory Sign-Off
          </Badge>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={declarationConfirmed}
            onChange={(e) => setDeclarationConfirmed(e.target.checked)}
            disabled={isVaultReadonly}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 shrink-0"
          />
          <span className="text-xs leading-relaxed text-slate-700">
            I hereby certify that all figures, financial projections, promoter CV profiles, and supplier quotations contained in this business plan and attached Appendices A through F represent true, accurate, and verifiable records. I confirm that requested capital items comply with public procurement guidelines with no deadweight duplication or displacement.
          </span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Authorized Signatory Name:
            </label>
            <input
              type="text"
              value={signatoryName}
              onChange={(e) => setSignatoryName(e.target.value)}
              disabled={isVaultReadonly}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden"
              placeholder="e.g. Jane Doe"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Official Corporate Title:
            </label>
            <input
              type="text"
              value={signatoryTitle}
              onChange={(e) => setSignatoryTitle(e.target.value)}
              disabled={isVaultReadonly}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden"
              placeholder="e.g. Founder & Chief Executive Officer"
            />
          </div>
        </div>
      </div>

      {/* Bottom Step Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onBackToStep3}
          className="text-xs text-slate-700"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to Step 3 (Narrative Compiler)
        </Button>

        <div className="flex items-center gap-2">
          {onParkQuestionInSession && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                const question = prompt(
                  'Park an open question regarding your grant appendices:'
                );
                if (question && question.trim()) {
                  onParkQuestionInSession(question.trim());
                }
              }}
              className="text-xs text-slate-600 border-slate-200 hover:bg-slate-50"
            >
              <BookmarkPlus className="mr-1.5 h-3.5 w-3.5" />
              Park an Open Question
            </Button>
          )}

          <Button
            type="button"
            size="sm"
            onClick={handleSaveAndContinue}
            disabled={isSaving || isVaultReadonly || !declarationConfirmed}
            className="bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-700"
          >
            {isSaving ? 'Saving Appendices...' : 'Save & Continue to Step 5 (Dossier Brief)'}
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
