'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Bot,
  HelpCircle,
  Copy,
  Check,
  ArrowRight,
  Send,
  Loader2,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
  RotateCcw,
  Sliders,
  Compass,
  Briefcase,
  Layers,
  ChevronRight,
  TrendingUp,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { ActiveStartupPlan } from '@/lib/auth/session-store';
import {
  askStartupPlanAction,
  type AskStartupAnswer,
  type AskStartupPersona,
  type AskStartupCitation,
} from '@/app/actions/ask-startup';

export interface AskMyStartupViewProps {
  plan: ActiveStartupPlan;
  founderName?: string;
  initialPrompt?: string;
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
  onBackToDashboard?: () => void;
  onOpenMasterDocument?: () => void;
  onOpenBusinessPlanStudio?: () => void;
}

const PERSONA_OPTIONS: Array<{
  id: AskStartupPersona;
  label: string;
  badge: string;
  icon: React.ElementType;
  description: string;
}> = [
  {
    id: 'ELEVATOR_PITCH',
    label: 'Elevator Pitch / Plain English',
    badge: '150-Word Ready',
    icon: Lightbulb,
    description: 'Crisp, jargon-free answers perfect for introductions, networking, or website copy.',
  },
  {
    id: 'INVESTOR_DUE_DILIGENCE',
    label: 'Investor Due Diligence',
    badge: 'VC & Angel',
    icon: TrendingUp,
    description: 'Metrics-driven, focusing on moat, beachhead wedge, unit economics, and TAM/SAM/SOM.',
  },
  {
    id: 'GRANT_ASSESSOR',
    label: 'Grant & Enterprise Assessor',
    badge: 'IE LEO / UK Innovate',
    icon: Compass,
    description: 'Additionality, regional job creation, export growth, and de-risking posture.',
  },
  {
    id: 'BANK_LENDER',
    label: 'Bank Manager / Loan Underwriter',
    badge: 'BBB / MFI Loan',
    icon: Briefcase,
    description: 'Conservative cashflow, working capital buffer, debt repayment, and asset cover.',
  },
  {
    id: 'EXECUTIVE_COFOUNDER',
    label: 'Supportive Co-Founder Audit',
    badge: 'Blind-Spot Check',
    icon: Bot,
    description: 'Unfiltered, constructive feedback highlighting execution bottlenecks and plan gaps.',
  },
];

const QUICK_STARTER_PROMPTS = [
  {
    title: 'Describe my startup in 150 words',
    category: 'ELEVATOR',
    persona: 'ELEVATOR_PITCH' as AskStartupPersona,
    prompt: 'Describe my startup in 150 words cleanly and compellingly.',
  },
  {
    title: 'What is our beachhead customer and unfair advantage?',
    category: 'INVESTOR',
    persona: 'INVESTOR_DUE_DILIGENCE' as AskStartupPersona,
    prompt: 'Who is our beachhead customer persona and what is our defensible unfair advantage against competitors?',
  },
  {
    title: 'What are our Year 1–3 breakeven & unit economics?',
    category: 'FINANCE',
    persona: 'INVESTOR_DUE_DILIGENCE' as AskStartupPersona,
    prompt: 'What are our pricing structure, gross margins, and breakeven customer volume according to our model?',
  },
  {
    title: 'What are our primary operational risks and mitigations?',
    category: 'DUE DILIGENCE',
    persona: 'GRANT_ASSESSOR' as AskStartupPersona,
    prompt: 'What are our top operational and supply chain risks and what mitigation plans do we have in place?',
  },
  {
    title: 'What is our funding requirement and runway?',
    category: 'FUNDING',
    persona: 'BANK_LENDER' as AskStartupPersona,
    prompt: 'What is our projected funding gap/cashflow trough, capital needed, and how will it be deployed?',
  },
  {
    title: 'What proof and customer validation do we currently have?',
    category: 'TRACTION',
    persona: 'INVESTOR_DUE_DILIGENCE' as AskStartupPersona,
    prompt: 'Summarize the customer surveys, waitlist numbers, and interview validation we have captured to date.',
  },
];

function FormattedAnswerBlock({ text }: { text: string }) {
  const paragraphs = text.split(/\n\n+/);

  const renderInline = (str: string) => {
    const parts = str.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-4 text-sm sm:text-base leading-relaxed text-slate-800 bg-slate-50/70 rounded-xl p-5 border border-slate-200/80">
      {paragraphs.map((para, idx) => {
        const trimmed = para.trim();
        if (!trimmed) return null;

        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={idx} className="text-base font-bold text-slate-900 pt-1">
              {renderInline(trimmed.replace(/^###\s+/, ''))}
            </h3>
          );
        }

        const lines = trimmed.split('\n');
        const isList = lines.length > 1 && lines.every((l) => /^([-*•]|\d+\.)\s+/.test(l.trim()));

        if (isList) {
          return (
            <ul key={idx} className="space-y-2 pl-1 my-2">
              {lines.map((line, lIdx) => {
                const bulletClean = line.trim().replace(/^([-*•]|\d+\.)\s+/, '');
                return (
                  <li key={lIdx} className="flex items-start gap-2.5">
                    <span className="text-indigo-600 font-bold shrink-0 mt-0.5">•</span>
                    <span>{renderInline(bulletClean)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        return (
          <p key={idx} className="leading-relaxed">
            {renderInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

export function AskMyStartupView({
  plan,
  founderName,
  initialPrompt,
  isVaultReadonly = false,
  onNavigateToModule,
  onBackToDashboard,
  onOpenMasterDocument,
  onOpenBusinessPlanStudio,
}: AskMyStartupViewProps) {
  const [questionInput, setQuestionInput] = useState(initialPrompt || '');
  const [selectedPersona, setSelectedPersona] = useState<AskStartupPersona>('INVESTOR_DUE_DILIGENCE');
  const [isLoading, setIsLoading] = useState(false);
  const [activeAnswer, setActiveAnswer] = useState<AskStartupAnswer | null>(null);
  const [history, setHistory] = useState<AskStartupAnswer[]>([]);
  const [copiedMode, setCopiedMode] = useState<'MARKDOWN' | 'EMAIL' | 'BULLETS' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasExecutedInitialRef = React.useRef(false);

  const activePersonaConfig =
    PERSONA_OPTIONS.find((p) => p.id === selectedPersona) || PERSONA_OPTIONS[1];

  const handleAsk = async (customPrompt?: string, forcePersona?: AskStartupPersona) => {
    const q = (customPrompt || questionInput).trim();
    if (!q || isLoading) return;

    const personaToUse = forcePersona || selectedPersona;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await askStartupPlanAction({
        planId: plan.id,
        question: q,
        persona: personaToUse,
        planSnapshot: plan,
      });

      if (res.success && res.answer) {
        setActiveAnswer(res.answer);
        setHistory((prev) => [res.answer!, ...prev.filter((item) => item.id !== res.answer!.id)]);
        if (!customPrompt) {
          setQuestionInput('');
        }
      } else {
        setErrorMessage(res.error || 'Failed to analyze question against your startup plan.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'A network error occurred while consulting your startup plan.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim() && !hasExecutedInitialRef.current) {
      hasExecutedInitialRef.current = true;
      setQuestionInput(initialPrompt);
      const isElevator = /150\s*words?|elevator\s*pitch|summarize\s*my\s*startup/i.test(initialPrompt);
      const persona = isElevator ? 'ELEVATOR_PITCH' : 'INVESTOR_DUE_DILIGENCE';
      if (isElevator) {
        setSelectedPersona('ELEVATOR_PITCH');
      }
      handleAsk(initialPrompt, persona);
    }
  }, [initialPrompt]);

  const stripFormatting = (str: string): string => {
    return str
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .trim();
  };

  const copyToClipboard = (text: string, mode: 'MARKDOWN' | 'EMAIL' | 'BULLETS') => {
    const cleanText = stripFormatting(text);
    navigator.clipboard.writeText(cleanText);
    setCopiedMode(mode);
    setTimeout(() => setCopiedMode(null), 2200);
  };

  const formatAsEmail = (ans: AskStartupAnswer) => {
    const cleanBody = stripFormatting(ans.answerMarkdown);
    return `Hi,\n\nRegarding your question ("${ans.question}"):\n\n${cleanBody}\n\nHope this clarifies our position.\n\nBest regards,\n${founderName || 'Founder'}, ${plan.title || 'Startup'}`;
  };

  const formatAsKeyPoints = (ans: AskStartupAnswer) => {
    const cleanBody = stripFormatting(ans.answerMarkdown);
    const lines = cleanBody
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.startsWith('-') || l.startsWith('*') || l.startsWith('•') || /^\d+\./.test(l));

    if (lines.length > 0) {
      return lines.join('\n');
    }
    return cleanBody;
  };

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Header Banner */}
      <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-indigo-500/30 text-indigo-200 border-indigo-400/40 px-2.5 py-0.5 text-xs font-semibold">
                <Sparkles className="mr-1.5 h-3.5 w-3.5 text-indigo-300" />
                Executive Co-Pilot
              </Badge>
              <Badge variant="outline" className="border-indigo-300/30 text-indigo-200 text-xs">
                Zero-Hallucination Grounding
              </Badge>
              <Badge variant="outline" className="border-emerald-400/40 text-emerald-300 text-xs">
                Active Plan: {plan.title || 'Untitled Startup'}
              </Badge>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Ask My Startup
            </h1>
            <p className="max-w-2xl text-xs text-indigo-100/90 sm:text-sm leading-relaxed">
              Query anything about your business plan, pricing models, market validation, or grant
              readiness. Answers are strictly grounded in your active plan data across Modules A–L.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {onBackToDashboard && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBackToDashboard}
                className="border-indigo-400/40 bg-white/10 text-xs text-white hover:bg-white/20 hover:text-white"
              >
                ← Return to Dashboard
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Query Console Card */}
      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/70 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Bot className="h-5 w-5 text-indigo-600" />
                Founder Query Console
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Type any question from an investor, grant assessor, bank manager, or yourself.
              </CardDescription>
            </div>

            {/* Persona Selector Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline">
                Answer Lens:
              </span>
              {PERSONA_OPTIONS.map((p) => {
                const isSelected = selectedPersona === p.id;
                const IconComponent = p.icon;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPersona(p.id)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <IconComponent className="h-3.5 w-3.5" />
                    <span>{p.label.split('/')[0].trim()}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 space-y-5">
          {/* Active Lens Description Strip */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-2.5 text-xs text-indigo-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <activePersonaConfig.icon className="h-4 w-4 text-indigo-600 shrink-0" />
              <span>
                <strong>{activePersonaConfig.label}:</strong> {activePersonaConfig.description}
              </span>
            </div>
            <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 text-[10px] hidden md:inline-flex">
              {activePersonaConfig.badge}
            </Badge>
          </div>

          {/* Query Input Area */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk();
            }}
            className="space-y-3"
          >
            <div className="relative">
              <textarea
                value={questionInput}
                onChange={(e) => setQuestionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAsk();
                  }
                }}
                placeholder="Ask anything (e.g. 'Describe my startup in 150 words', 'What is our Year 2 breakeven customer count?', or 'What is our defensibility?')..."
                rows={3}
                disabled={isLoading}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
              />

              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                <Button
                  type="submit"
                  disabled={isLoading || !questionInput.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 h-9 rounded-lg shadow-sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      Analyzing Plan...
                    </>
                  ) : (
                    <>
                      <Send className="mr-1.5 h-3.5 w-3.5" />
                      Ask Co-Pilot
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Press <strong>Enter</strong> to submit · <strong>Shift + Enter</strong> for line break</span>
              <span>Off-topic trivia & general queries are filtered automatically</span>
            </div>
          </form>

          {/* Quick Starter Pills */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
              Suggested High-Impact Questions
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {QUICK_STARTER_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    setSelectedPersona(p.persona);
                    handleAsk(p.prompt, p.persona);
                  }}
                  className="flex flex-col text-left rounded-xl border border-slate-200/90 bg-white p-3 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                      {p.category}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 group-hover:text-indigo-700 mt-1 line-clamp-2">
                    {p.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {errorMessage && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-900">Query Notice</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* 3. Active Answer Display */}
      {activeAnswer && (
        <div className="space-y-6">
          <Card
            className={`rounded-2xl border shadow-md overflow-hidden ${
              activeAnswer.isOffTopic
                ? 'border-amber-300 bg-amber-50/20'
                : 'border-indigo-200/80 bg-white'
            }`}
          >
            {/* Top Toolbar */}
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-indigo-50/40 p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {activeAnswer.isOffTopic ? (
                      <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs font-semibold">
                        <ShieldAlert className="mr-1 h-3.5 w-3.5 text-amber-600" />
                        Boundary Guardrail Alert
                      </Badge>
                    ) : (
                      <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-xs font-semibold">
                        <Sparkles className="mr-1 h-3.5 w-3.5 text-indigo-600" />
                        Grounded Startup Answer
                      </Badge>
                    )}
                    <Badge variant="outline" className="border-slate-200 text-slate-600 text-xs">
                      {activeAnswer.wordCount} Words
                    </Badge>
                    <Badge variant="outline" className="border-slate-200 text-slate-500 text-xs hidden sm:inline-flex">
                      Engine: {activeAnswer.aiEngineUsed}
                    </Badge>
                  </div>
                  <h2 className="text-base font-bold text-slate-900 mt-2">
                    &ldquo;{activeAnswer.question}&rdquo;
                  </h2>
                </div>

                {/* 1-Click Copy Actions */}
                {!activeAnswer.isOffTopic && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(activeAnswer.answerMarkdown, 'MARKDOWN')}
                      className="h-8 text-xs font-medium border-slate-200 hover:bg-slate-50"
                    >
                      {copiedMode === 'MARKDOWN' ? (
                        <>
                          <Check className="mr-1 h-3.5 w-3.5 text-emerald-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-1 h-3.5 w-3.5 text-slate-500" />
                          Copy Text
                        </>
                      )}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(formatAsEmail(activeAnswer), 'EMAIL')}
                      className="h-8 text-xs font-medium border-slate-200 hover:bg-slate-50"
                    >
                      {copiedMode === 'EMAIL' ? (
                        <>
                          <Check className="mr-1 h-3.5 w-3.5 text-emerald-600" />
                          Copied Email!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-1 h-3.5 w-3.5 text-slate-500" />
                          Copy as Email
                        </>
                      )}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(formatAsKeyPoints(activeAnswer), 'BULLETS')}
                      className="h-8 text-xs font-medium border-slate-200 hover:bg-slate-50"
                    >
                      {copiedMode === 'BULLETS' ? (
                        <>
                          <Check className="mr-1 h-3.5 w-3.5 text-emerald-600" />
                          Copied Bullets!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-1 h-3.5 w-3.5 text-slate-500" />
                          Copy Bullets
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Formatted Markdown Answer */}
              <FormattedAnswerBlock text={activeAnswer.answerMarkdown} />

              {/* Citations & Source Modules */}
              {activeAnswer.citations && activeAnswer.citations.length > 0 && (
                <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-indigo-600" />
                      Plan Citations & Data Sources
                    </span>
                    <span className="text-[11px] text-slate-400">Click to jump into module</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {activeAnswer.citations.map((c, i) => (
                      <div
                        key={i}
                        onClick={() => onNavigateToModule(c.moduleCode as any)}
                        className="cursor-pointer rounded-lg border border-slate-200 bg-white p-3 hover:border-indigo-400 hover:shadow-xs transition-all flex items-start justify-between group"
                      >
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {c.moduleName}
                          </p>
                          <p className="text-[11px] text-slate-500">{c.relevance}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-600 shrink-0 mt-0.5 transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detected Gaps in Plan */}
              {activeAnswer.detectedGaps && activeAnswer.detectedGaps.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-2">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                    Missing Plan Data Detected
                  </span>
                  <ul className="space-y-1 text-xs text-amber-800 list-disc list-inside">
                    {activeAnswer.detectedGaps.map((gap, i) => (
                      <li key={i}>{gap}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Follow-up Prompts */}
              {activeAnswer.suggestedFollowUps && activeAnswer.suggestedFollowUps.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <Lightbulb className="h-3.5 w-3.5 text-indigo-500" />
                    Recommended Next Questions:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {activeAnswer.suggestedFollowUps.map((prompt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setQuestionInput(prompt);
                          handleAsk(prompt);
                        }}
                        className="rounded-lg border border-indigo-100 bg-indigo-50/50 px-3 py-1.5 text-xs text-indigo-800 hover:bg-indigo-100 hover:text-indigo-900 transition-all text-left"
                      >
                        + {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 4. Query History Strip */}
      {history.length > 1 && (
        <div className="space-y-3 pt-6 border-t border-slate-200">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-slate-400" />
            Previous Session Questions ({history.length})
          </h3>
          <div className="space-y-2">
            {history.slice(1).map((item) => (
              <div
                key={item.id}
                onClick={() => setActiveAnswer(item)}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3.5 hover:border-indigo-300 hover:bg-slate-50 transition-all flex items-center justify-between"
              >
                <div className="space-y-0.5 truncate pr-4">
                  <p className="text-xs font-bold text-slate-800 truncate">&ldquo;{item.question}&rdquo;</p>
                  <p className="text-[11px] text-slate-500 truncate">
                    Lens: {item.persona} · {item.wordCount} words · {item.citations.length} cited modules
                  </p>
                </div>
                <Button size="sm" variant="ghost" className="h-7 text-xs text-indigo-600 shrink-0">
                  View Answer →
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
