'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Plus,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  ArrowUp,
  ArrowDown,
  ShieldCheck,
  AlertTriangle,
  Wand2,
  BarChart3,
  MessageSquare,
  Users,
  Loader2,
  HelpCircle,
  Lightbulb,
  BookmarkPlus,
  ArrowLeft,
  ArrowRight,
  SlidersHorizontal,
  FlaskConical,
  RefreshCw,
  Mail,
  CheckCircle2,
  X,
  FileText,
  Eye,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  deduplicateSurveyResponses,
  loadPublicSurveyFromLocalRegistry,
  removePublicSurveyFromLocalRegistry,
  type ActiveStartupPlan,
  type SavedValidationSurvey,
  type SurveyQuestionItem,
  type SurveyQuestionType,
  type SurveyFocusAreaType,
  type SavedSurveyResponse,
  type SurveyResponseAnswerValue,
  type SurveyAiInsightsSummary,
} from '@/lib/auth/session-store';
import type { SupportedCountryCode } from '@/lib/localization';
import { getPublicSurveyBySlugAction } from '@/app/actions/module-c';

export interface ModuleCWorkspaceProps {
  plan: ActiveStartupPlan;
  selectedCountry: SupportedCountryCode;
  isVaultReadonly: boolean;
  onSaveSurvey: (
    survey: SavedValidationSurvey,
    allSurveys: SavedValidationSurvey[]
  ) => Promise<void>;
  onDeleteSurvey: (
    surveyId: string,
    publicSlug: string,
    remainingSurveys: SavedValidationSurvey[]
  ) => Promise<void>;
  onGenerateSurveyWithAi: (params: {
    focusAreas: SurveyFocusAreaType[];
    otherFocusAreaText?: string;
    customAiFocusPrompt?: string;
    questionCount: number;
  }) => Promise<{
    title: string;
    introDescription: string;
    waitlistIncentiveText: string;
    questions: SurveyQuestionItem[];
    engineMode: 'gemini-2.5-flash' | 'smart-synthesizer';
  } | null>;
  onCheckMomTestQuestionWithAi: (params: {
    questionText: string;
    questionType: SurveyQuestionType;
    currentOptions?: string[];
  }) => Promise<{
    momTestPassed: boolean;
    momTestFeedback: string;
    momTestSuggestedRewrite: string;
    suggestedOptions?: string[];
  } | null>;
  onSuggestNextQuestionWithAi: (params: {
    existingQuestions: SurveyQuestionItem[];
    focusAreas?: SurveyFocusAreaType[];
  }) => Promise<SurveyQuestionItem | null>;
  onAnalyzeResultsWithAi: (params: {
    surveyTitle: string;
    questions: SurveyQuestionItem[];
    responses: SavedSurveyResponse[];
  }) => Promise<SurveyAiInsightsSummary | null>;
  onParkQuestion: (questionText: string) => Promise<void>;
  onBackToModuleB: () => void;
  onContinueToModuleD?: () => void;
}

const FOCUS_AREA_OPTIONS: Array<{
  code: SurveyFocusAreaType;
  title: string;
  subtitle: string;
}> = [
  {
    code: 'PROBLEM_AND_PAIN',
    title: 'Problem & Pain Intensity',
    subtitle: 'Verify if they actually experience this problem and how often',
  },
  {
    code: 'CURRENT_WORKAROUNDS',
    title: 'Current Workarounds & Frustrations',
    subtitle: 'Discover what tools or manual habits they use today',
  },
  {
    code: 'PAST_SPENDING_BUDGET',
    title: 'Past Spending & Budget Reality',
    subtitle: 'Learn what they already pay to solve or work around this',
  },
  {
    code: 'WORKFLOW_AND_HABITS',
    title: 'Day-to-Day Workflow & Habits',
    subtitle: 'Understand when and how this bottleneck happens in their week',
  },
  {
    code: 'FEATURE_PRIORITIES',
    title: 'Most Valuable Outcome',
    subtitle: 'Find out which single improvement matters #1 before building V1',
  },
  {
    code: 'OTHER',
    title: 'Other / Custom Focus',
    subtitle: 'Type your own specific discovery angle or hypothesis',
  },
];

const QUESTION_TYPE_OPTIONS: Array<{
  type: SurveyQuestionType;
  label: string;
  badge: string;
}> = [
  {
    type: 'MULTIPLE_CHOICE',
    label: 'Single Choice',
    badge: 'Pick 1 + Optional Other',
  },
  {
    type: 'MULTI_SELECT',
    label: 'Multi-Select',
    badge: 'Check All + Optional Other',
  },
  {
    type: 'SCALE_1_5',
    label: '1–5 Rating Scale',
    badge: 'Pain / Urgency Score',
  },
  {
    type: 'OPEN_TEXT',
    label: 'Short Open Text',
    badge: 'Real Stories & Quotes',
  },
];

function slugifySurveyText(raw: string, suffixNumber: number): string {
  const base = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
  return `${base || 'customer-survey'}-${suffixNumber}`;
}

function createBlankSurvey(
  plan: ActiveStartupPlan,
  surveyNumber: number
): SavedValidationSurvey {
  const nowIso = new Date().toISOString();
  const uniqueSuffix = `${surveyNumber}-${Math.random().toString(36).slice(2, 5)}`;
  const slugBase = slugifySurveyText(plan.title || 'startup', surveyNumber);
  return {
    id: `survey-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    planId: plan.id,
    publicSlug: `${slugBase}-${uniqueSuffix}`,
    title: '',
    introDescription: '',
    isActive: true,
    isPublished: false,
    collectLeadEmails: true,
    waitlistIncentiveText:
      'Want early access when we launch (plus 30% early-bird discount)? Drop your email below:',
    focusAreas: ['PROBLEM_AND_PAIN', 'CURRENT_WORKAROUNDS'],
    otherFocusAreaText: '',
    customAiFocusPrompt: '',
    questions: [],
    responses: [],
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

export function ModuleCWorkspace({
  plan,
  isVaultReadonly,
  onSaveSurvey,
  onDeleteSurvey,
  onGenerateSurveyWithAi,
  onCheckMomTestQuestionWithAi,
  onSuggestNextQuestionWithAi,
  onAnalyzeResultsWithAi,
  onParkQuestion,
  onBackToModuleB,
  onContinueToModuleD,
}: ModuleCWorkspaceProps) {
  // Initialize surveys list from saved plan data (can be empty [] if none exist or all were deleted)
  const [surveys, setSurveys] = useState<SavedValidationSurvey[]>(() => {
    const existing = plan.moduleCData?.surveys || [];
    return existing.map((s) => ({
      ...s,
      responses: deduplicateSurveyResponses(s.responses || []),
    }));
  });

  const [activeSurveyId, setActiveSurveyId] = useState<string>(() => {
    const existing = plan.moduleCData?.surveys || [];
    if (existing.length > 0) {
      return plan.moduleCData?.activeSurveyId || existing[0].id;
    }
    return '';
  });

  // Ensure activeSurveyId always points to a valid survey when surveys exist
  const activeSurvey =
    surveys.find((s) => s.id === activeSurveyId) || surveys[0];

  // Keep refs to live state so window focus/storage listeners and async callbacks never read stale closures
  const surveysRef = useRef<SavedValidationSurvey[]>(surveys);
  surveysRef.current = surveys;
  const activeSurveyRef = useRef<SavedValidationSurvey | undefined>(activeSurvey);
  activeSurveyRef.current = activeSurvey;

  useEffect(() => {
    if (activeSurvey && activeSurvey.id !== activeSurveyId) {
      setActiveSurveyId(activeSurvey.id);
    } else if (!activeSurvey && activeSurveyId) {
      setActiveSurveyId('');
    }
  }, [activeSurvey, activeSurveyId]);

  // Hydrate / merge surveys when plan.id or plan.moduleCData arrives from localStorage or Cloud SQL
  useEffect(() => {
    if (!plan.moduleCData) return;
    const incomingSurveys = plan.moduleCData.surveys || [];

    if (incomingSurveys.length === 0) {
      setSurveys([]);
      setActiveSurveyId('');
      return;
    }

    setSurveys((prev) => {
      if (prev.length === 0) {
        if (plan.moduleCData?.activeSurveyId) {
          setActiveSurveyId(plan.moduleCData.activeSurveyId);
        } else if (incomingSurveys[0]?.id) {
          setActiveSurveyId(incomingSurveys[0].id);
        }
        return incomingSurveys.map((s) => ({
          ...s,
          responses: deduplicateSurveyResponses(s.responses || []),
        }));
      }

      // Build lookup of current in-memory state by slug, then map strictly over incomingSurveys
      // so deleted surveys are never resurrected while in-memory edits/responses on existing surveys are preserved
      const prevBySlug = new Map<string, SavedValidationSurvey>();
      for (const s of prev) {
        prevBySlug.set(s.publicSlug, s);
      }

      return incomingSurveys.map((inc) => {
        const curr = prevBySlug.get(inc.publicSlug);
        if (!curr) {
          return {
            ...inc,
            responses: deduplicateSurveyResponses(inc.responses || []),
          };
        }
        const mergedResponses = deduplicateSurveyResponses([
          ...(inc.responses || []),
          ...(curr.responses || []),
        ]);
        return {
          ...curr,
          ...inc,
          title: curr.title.trim() || inc.title,
          isPublished: Boolean(curr.isPublished || inc.isPublished),
          publishedAt: curr.publishedAt || inc.publishedAt,
          questions:
            curr.questions.length >= inc.questions.length &&
            curr.questions.length > 0
              ? curr.questions
              : inc.questions,
          responses: mergedResponses,
          aiInsightsSummary: curr.aiInsightsSummary || inc.aiInsightsSummary,
        };
      });
    });
  }, [plan.id, plan.moduleCData]);

  // Sub-view tab: 'BUILDER' vs 'INSIGHTS'
  const [activeViewTab, setActiveViewTab] = useState<'BUILDER' | 'INSIGHTS'>(
    'BUILDER'
  );
  // Results sub-tab inside 'INSIGHTS': 'SUMMARY' | 'QUESTIONS' | 'LEADS'
  const [activeInsightsSubTab, setActiveInsightsSubTab] = useState<
    'SUMMARY' | 'QUESTIONS' | 'LEADS'
  >('QUESTIONS');

  // AI Focus Prompt drawer/card state (opened when user clicks "Build with AI")
  const [showAiFocusSelector, setShowAiFocusSelector] = useState<boolean>(false);
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<
    SurveyFocusAreaType[]
  >(['PROBLEM_AND_PAIN', 'CURRENT_WORKAROUNDS']);
  const [otherFocusAreaText, setOtherFocusAreaText] = useState<string>('');
  const [customAiFocusPrompt, setCustomAiFocusPrompt] = useState<string>('');
  const [desiredQuestionCount, setDesiredQuestionCount] = useState<number>(5);
  const [isGeneratingSurveyWithAi, setIsGeneratingSurveyWithAi] =
    useState<boolean>(false);

  // Per-question AI Mom-Test check loading state
  const [checkingQuestionId, setCheckingQuestionId] = useState<string | null>(
    null
  );
  const [isSuggestingQuestion, setIsSuggestingQuestion] =
    useState<boolean>(false);
  const [isAnalyzingInsights, setIsAnalyzingInsights] =
    useState<boolean>(false);
  const [isSyncingResponses, setIsSyncingResponses] = useState<boolean>(false);

  // Copy link & feedback banners
  const [copiedLinkSlug, setCopiedLinkSlug] = useState<string | null>(null);
  const [copiedEmails, setCopiedEmails] = useState<boolean>(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [showWhyCard, setShowWhyCard] = useState<boolean>(true);
  const [parkQuestionDraft, setParkQuestionDraft] = useState<string>('');
  const [showParkInput, setShowParkInput] = useState<boolean>(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState<boolean>(false);

  // Whether the active survey is published & permanently locked against question/option edits
  const isSurveyPublished = Boolean(activeSurvey?.isPublished);
  const isSurveyLocked = isVaultReadonly || isSurveyPublished;

  // Helper to update the active survey in state & persist immediately (always reads live refs)
  const updateActiveSurvey = async (
    updater: (current: SavedValidationSurvey) => SavedValidationSurvey,
    statusMessage?: string
  ) => {
    const currentActive = activeSurveyRef.current;
    const currentAll = surveysRef.current;
    if (!currentActive) return;

    const rawUpdated = updater(currentActive);
    const updatedSurvey: SavedValidationSurvey = {
      ...rawUpdated,
      responses: deduplicateSurveyResponses(rawUpdated.responses || []),
      updatedAt: new Date().toISOString(),
    };
    const nextSurveys = currentAll.map((s) =>
      s.id === currentActive.id ? updatedSurvey : s
    );
    surveysRef.current = nextSurveys;
    activeSurveyRef.current = updatedSurvey;
    setSurveys(nextSurveys);
    await onSaveSurvey(updatedSurvey, nextSurveys);
    if (statusMessage) {
      setStatusBanner(statusMessage);
    }
  };

  // Sync live responses from local registry & Cloud SQL when switching to Insights or focusing window
  const handleSyncLiveResponses = async (silent = false) => {
    const currentActive = activeSurveyRef.current;
    if (!currentActive) return;
    if (!silent) setIsSyncingResponses(true);

    try {
      const localCopy = loadPublicSurveyFromLocalRegistry(
        currentActive.publicSlug
      );
      const cloudRes = await getPublicSurveyBySlugAction(
        currentActive.publicSlug
      );

      // Re-read currentActive after await in case questions/title changed while fetching
      const latestActive = activeSurveyRef.current || currentActive;

      const mergedList = deduplicateSurveyResponses([
        ...(cloudRes.survey?.responses || []),
        ...(latestActive.responses || []),
        ...(localCopy?.responses || []),
      ]);

      const restoredQuestions =
        latestActive.questions.length > 0
          ? latestActive.questions
          : (localCopy?.questions?.length || 0) > 0
            ? localCopy!.questions
            : cloudRes.survey?.questions || [];

      const currentIds = (latestActive.responses || [])
        .map((r) => r.id)
        .join(',');
      const mergedIds = mergedList.map((r) => r.id).join(',');

      const hasResponseChanges =
        mergedList.length !== (latestActive.responses || []).length ||
        currentIds !== mergedIds;
      const needsQuestionRestore =
        latestActive.questions.length === 0 && restoredQuestions.length > 0;

      if (hasResponseChanges || needsQuestionRestore) {
        await updateActiveSurvey(
          (curr) => ({
            ...curr,
            title:
              curr.title.trim() ||
              localCopy?.title ||
              cloudRes.survey?.title ||
              curr.title,
            isPublished: Boolean(
              curr.isPublished ||
                localCopy?.isPublished ||
                cloudRes.survey?.isPublished
            ),
            publishedAt:
              curr.publishedAt ||
              localCopy?.publishedAt ||
              cloudRes.survey?.publishedAt,
            questions:
              curr.questions.length > 0 ? curr.questions : restoredQuestions,
            responses: mergedList,
            aiInsightsSummary:
              curr.aiInsightsSummary ||
              localCopy?.aiInsightsSummary ||
              cloudRes.survey?.aiInsightsSummary,
          }),
          !silent
            ? `✅ Synced ${mergedList.length} total response(s) from public link!`
            : undefined
        );
      } else if (!silent) {
        setStatusBanner(
          `✓ Up to date (${mergedList.length} response${mergedList.length === 1 ? '' : 's'}).`
        );
      }
    } finally {
      if (!silent) setIsSyncingResponses(false);
    }
  };

  useEffect(() => {
    void handleSyncLiveResponses(true);
    const onFocus = () => {
      void handleSyncLiveResponses(true);
    };
    window.addEventListener('focus', onFocus);
    window.addEventListener('storage', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('storage', onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSurvey?.publicSlug]);

  // 1. CREATE NEW BLANK SURVEY
  const handleCreateNewBlankSurvey = async () => {
    if (isVaultReadonly) return;
    const currentAll = surveysRef.current;
    const newBlank = createBlankSurvey(plan, currentAll.length + 1);
    const nextSurveys = [...currentAll, newBlank];
    surveysRef.current = nextSurveys;
    activeSurveyRef.current = newBlank;
    setSurveys(nextSurveys);
    setActiveSurveyId(newBlank.id);
    setActiveViewTab('BUILDER');
    setShowAiFocusSelector(false);
    setShowPublishConfirm(false);
    await onSaveSurvey(newBlank, nextSurveys);
    setStatusBanner(
      '✨ Created a fresh blank survey! Add questions manually or click "Build with AI" to pick your focus.'
    );
  };

  // 1B. PUBLISH & LOCK SURVEY (PERMANENT TAMPER-PROOF LOCK)
  const handlePublishAndLockSurvey = async () => {
    if (!activeSurvey || isSurveyLocked) return;
    if (activeSurvey.questions.length === 0) {
      setStatusBanner(
        '⚠️ Add at least 1 question before publishing and locking your survey.'
      );
      return;
    }
    const nowIso = new Date().toISOString();
    await updateActiveSurvey(
      (curr) => ({
        ...curr,
        title: curr.title.trim() || `${plan.title}: Customer Discovery Survey`,
        isPublished: true,
        publishedAt: nowIso,
        isActive: true,
      }),
      '🔒 Survey published & permanently locked! Questions and answer options can no longer be edited so your results remain 100% tamper-proof.'
    );
    setShowPublishConfirm(false);
    setShowAiFocusSelector(false);
  };

  // 2. DELETE SURVEY (CAN DELETE ANY SURVEY, INCLUDING THE LAST ONE TO REVERT TO NONE)
  const handleDeleteCurrentSurvey = async () => {
    if (!activeSurvey || isVaultReadonly) return;
    const deletedTitle = activeSurvey.title.trim() || 'Untitled Survey';
    const deletedId = activeSurvey.id;
    const deletedSlug = activeSurvey.publicSlug;

    removePublicSurveyFromLocalRegistry(deletedSlug);

    const currentAll = surveysRef.current;
    const remaining = currentAll.filter((s) => s.id !== deletedId);
    setShowAiFocusSelector(false);
    setShowPublishConfirm(false);

    if (remaining.length === 0) {
      surveysRef.current = [];
      activeSurveyRef.current = undefined;
      setSurveys([]);
      setActiveSurveyId('');
      await onDeleteSurvey(deletedId, deletedSlug, []);
      setStatusBanner(
        `🗑️ Deleted "${deletedTitle}". You now have 0 surveys — click "+ Create New Survey" whenever you're ready to start one.`
      );
      return;
    }

    surveysRef.current = remaining;
    activeSurveyRef.current = remaining[0];
    setSurveys(remaining);
    setActiveSurveyId(remaining[0].id);
    await onDeleteSurvey(deletedId, deletedSlug, remaining);
    setStatusBanner(`🗑️ Deleted survey "${deletedTitle}".`);
  };

  // 3. TOGGLE AI FOCUS AREA PILL
  const handleToggleFocusArea = (code: SurveyFocusAreaType) => {
    setSelectedFocusAreas((prev) => {
      if (prev.includes(code)) {
        return prev.length > 1 ? prev.filter((item) => item !== code) : prev;
      }
      return [...prev, code];
    });
  };

  // 4. GENERATE SURVEY QUESTIONS WITH AI (AFTER USER SELECTS FOCUS)
  const handleRunGenerateWithAi = async () => {
    if (!activeSurvey || isSurveyLocked) return;
    setIsGeneratingSurveyWithAi(true);
    setStatusBanner(null);

    try {
      const generated = await onGenerateSurveyWithAi({
        focusAreas: selectedFocusAreas,
        otherFocusAreaText: selectedFocusAreas.includes('OTHER')
          ? otherFocusAreaText
          : undefined,
        customAiFocusPrompt: customAiFocusPrompt.trim() || undefined,
        questionCount: desiredQuestionCount,
      });

      if (generated) {
        await updateActiveSurvey(
          (curr) => {
            const hasLegacyIntroQuote = /currently handle "/i.test(
              curr.introDescription
            );
            return {
              ...curr,
              title: curr.title.trim() || generated.title,
              introDescription:
                !curr.introDescription.trim() || hasLegacyIntroQuote
                  ? generated.introDescription
                  : curr.introDescription,
              waitlistIncentiveText:
                curr.waitlistIncentiveText.trim() ||
                generated.waitlistIncentiveText,
              focusAreas: selectedFocusAreas,
              otherFocusAreaText: selectedFocusAreas.includes('OTHER')
                ? otherFocusAreaText
                : '',
              customAiFocusPrompt: customAiFocusPrompt.trim(),
              questions: generated.questions,
            };
          },
          `✨ Generated ${generated.questions.length} context-shaped Mom-Test questions tailored to your idea!`
        );
        setShowAiFocusSelector(false);
      }
    } finally {
      setIsGeneratingSurveyWithAi(false);
    }
  };

  // Automatically upgrade any existing draft survey that still has legacy verbatim-quoted questions
  useEffect(() => {
    if (!activeSurvey || isSurveyLocked) return;
    const hasLegacyCopyPasteQuestion = activeSurvey.questions.some((q) =>
      /frustration around:\s*"|When dealing with\s*"|dealt with\s*"Help/i.test(
        q.questionText
      )
    );
    if (hasLegacyCopyPasteQuestion && !isGeneratingSurveyWithAi) {
      void handleRunGenerateWithAi();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSurvey?.id]);

  // 5. QUESTION CRUD HELPERS
  const handleAddManualQuestion = async (
    defaultType: SurveyQuestionType = 'MULTIPLE_CHOICE'
  ) => {
    if (!activeSurvey || isSurveyLocked) return;
    const newQ: SurveyQuestionItem = {
      id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      questionText: '',
      type: defaultType,
      options:
        defaultType === 'MULTIPLE_CHOICE' || defaultType === 'MULTI_SELECT'
          ? ['Option 1', 'Option 2', 'Option 3']
          : undefined,
      allowOther:
        defaultType === 'MULTIPLE_CHOICE' || defaultType === 'MULTI_SELECT'
          ? true
          : undefined,
      scaleMinLabel:
        defaultType === 'SCALE_1_5' ? '1 = Minor annoyance' : undefined,
      scaleMaxLabel:
        defaultType === 'SCALE_1_5' ? '5 = Urgent problem' : undefined,
      momTestPassed: true,
    };

    await updateActiveSurvey((curr) => ({
      ...curr,
      questions: [...curr.questions, newQ],
    }));
  };

  const handleUpdateQuestion = (
    questionId: string,
    patch: Partial<SurveyQuestionItem>
  ) => {
    if (!activeSurvey || isSurveyLocked) return;
    const nextQuestions = activeSurvey.questions.map((q) => {
      if (q.id !== questionId) return q;
      const updated = { ...q, ...patch };
      if (
        (updated.type === 'MULTIPLE_CHOICE' ||
          updated.type === 'MULTI_SELECT') &&
        (!updated.options || updated.options.length === 0)
      ) {
        updated.options = ['Option 1', 'Option 2', 'Option 3'];
        if (updated.allowOther === undefined) {
          updated.allowOther = true;
        }
      }
      if (updated.type === 'SCALE_1_5') {
        updated.scaleMinLabel = updated.scaleMinLabel || '1 = Minor annoyance';
        updated.scaleMaxLabel = updated.scaleMaxLabel || '5 = Urgent problem';
      }
      return updated;
    });

    updateActiveSurvey((curr) => ({
      ...curr,
      questions: nextQuestions,
    }));
  };

  const handleMoveQuestion = (index: number, direction: 'UP' | 'DOWN') => {
    if (!activeSurvey || isSurveyLocked) return;
    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= activeSurvey.questions.length) return;
    const copy = [...activeSurvey.questions];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, moved);
    updateActiveSurvey((curr) => ({
      ...curr,
      questions: copy,
    }));
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (!activeSurvey || isSurveyLocked) return;
    updateActiveSurvey((curr) => ({
      ...curr,
      questions: curr.questions.filter((q) => q.id !== questionId),
    }));
  };

  // 6. PER-QUESTION MOM TEST AI CHECK & REWRITE
  const handleCheckQuestionMomTest = async (q: SurveyQuestionItem) => {
    if (!q.questionText.trim() || isSurveyLocked) return;
    setCheckingQuestionId(q.id);
    try {
      const checkRes = await onCheckMomTestQuestionWithAi({
        questionText: q.questionText,
        questionType: q.type,
        currentOptions: q.options,
      });
      if (checkRes) {
        handleUpdateQuestion(q.id, {
          momTestPassed: checkRes.momTestPassed,
          momTestFeedback: checkRes.momTestFeedback,
          momTestSuggestedRewrite: checkRes.momTestSuggestedRewrite,
          ...(checkRes.suggestedOptions && checkRes.suggestedOptions.length >= 2
            ? { options: checkRes.suggestedOptions }
            : {}),
        });
      }
    } finally {
      setCheckingQuestionId(null);
    }
  };

  // 7. SUGGEST 1 MORE QUESTION WITH AI
  const handleSuggestOneMoreQuestion = async () => {
    if (!activeSurvey || isSurveyLocked) return;
    setIsSuggestingQuestion(true);
    try {
      const suggested = await onSuggestNextQuestionWithAi({
        existingQuestions: activeSurvey.questions,
        focusAreas: activeSurvey.focusAreas,
      });
      if (suggested) {
        await updateActiveSurvey(
          (curr) => ({
            ...curr,
            questions: [...curr.questions, suggested],
          }),
          '✨ Added a new Mom-Test question to your survey!'
        );
      }
    } finally {
      setIsSuggestingQuestion(false);
    }
  };

  // 8. SIMULATE 5 SAMPLE RESPONSES FOR INSTANT INSIGHTS PREVIEW
  const handleSimulateSampleResponses = async () => {
    if (!activeSurvey || activeSurvey.questions.length === 0) return;

    const firstCompName =
      plan.moduleBData?.competitorsAndStatusQuo?.competitors?.find((c) =>
        c.name?.trim()
      )?.name || 'an off-the-shelf tool';
    const firstCompWeakness =
      plan.moduleBData?.competitorsAndStatusQuo?.competitors?.find((c) =>
        c.whereTheyFallShort?.trim()
      )?.whereTheyFallShort || 'my team found it way too complicated';
    const shortProblemRef =
      (
        plan.conceptCanvas?.coreProblem ||
        plan.brainDumpText ||
        'this workflow'
      )
        .trim()
        .slice(0, 75) || 'this workflow';

    const samplePersonas = [
      {
        name: 'Liam O’Connor (Operations Lead)',
        email: 'liam.oconnor@example.ie',
        waitlist: true,
        scaleBias: 5,
        story: `Last Tuesday we spent almost 3 hours dealing with "${shortProblemRef}" across spreadsheets and WhatsApp. One missed step cost us a client deadline.`,
        otherWriteIn: `Custom spreadsheet tracker + ${firstCompName} export that keeps breaking`,
      },
      {
        name: 'Sarah Jenkins (Founder / Owner)',
        email: 'sarah@example.co.uk',
        waitlist: true,
        scaleBias: 4,
        story: `Every Friday afternoon goes into double-checking this by hand. We tried ${firstCompName} 6 months ago, but ${firstCompWeakness}.`,
        otherWriteIn: '',
      },
      {
        name: 'Anonymous Respondent',
        email: '',
        waitlist: false,
        scaleBias: 4,
        story:
          'Honestly the hardest part is when two people update the workflow at the same time and nobody knows which version is accurate.',
        otherWriteIn: '',
      },
      {
        name: 'Claire Walsh (Manager)',
        email: 'claire.w@example.com',
        waitlist: true,
        scaleBias: 5,
        story:
          'Happened yesterday morning—had to redo the whole batch from scratch because our current workaround missed two critical details.',
        otherWriteIn: 'Shared Google Sheet + manual email check-ins',
      },
      {
        name: 'Mark D.',
        email: '',
        waitlist: false,
        scaleBias: 3,
        story: `It comes up a couple of times a month. Right now we put up with the manual steps because switching away from ${firstCompName} feels risky.`,
        otherWriteIn: '',
      },
    ];

    const simulatedBatch: SavedSurveyResponse[] = samplePersonas.map(
      (p, idx) => {
        const ansMap: Record<string, SurveyResponseAnswerValue> = {};
        for (const q of activeSurvey.questions) {
          if (q.type === 'MULTIPLE_CHOICE') {
            const opts = q.options || ['Option 1', 'Option 2'];
            if (idx === 0 && q.allowOther !== false && p.otherWriteIn) {
              ansMap[q.id] = {
                selectedOption: 'OTHER',
                otherText: p.otherWriteIn,
              };
            } else {
              // Weight toward first two options for realistic clustering
              const pickIdx = idx % 2 === 0 ? 0 : Math.min(1, opts.length - 1);
              ansMap[q.id] = {
                selectedOption: opts[pickIdx],
              };
            }
          } else if (q.type === 'MULTI_SELECT') {
            const opts = q.options || ['Option 1', 'Option 2', 'Option 3'];
            const chosen = [opts[0]];
            if (opts[1] && idx % 2 === 0) chosen.push(opts[1]);
            if (idx === 3 && q.allowOther !== false && p.otherWriteIn) {
              chosen.push('OTHER');
            }
            ansMap[q.id] = {
              selectedOptions: chosen,
              otherText:
                idx === 3 && p.otherWriteIn ? p.otherWriteIn : undefined,
            };
          } else if (q.type === 'SCALE_1_5') {
            ansMap[q.id] = {
              scaleValue: p.scaleBias,
            };
          } else if (q.type === 'OPEN_TEXT') {
            ansMap[q.id] = {
              openText: p.story,
            };
          }
        }

        return {
          id: `sim-resp-${Date.now()}-${idx}`,
          surveyId: activeSurvey.id,
          answers: ansMap,
          respondentNameOrRole: p.name,
          respondentEmail: p.email || undefined,
          joinedWaitlist: p.waitlist,
          isSimulated: true,
          submittedAt: new Date(Date.now() - idx * 3600_000).toISOString(),
        };
      }
    );

    const nextResponses = [
      ...simulatedBatch,
      ...(activeSurvey.responses || []),
    ];

    const insights = await onAnalyzeResultsWithAi({
      surveyTitle: activeSurvey.title || plan.title,
      questions: activeSurvey.questions,
      responses: nextResponses,
    });

    await updateActiveSurvey(
      (curr) => ({
        ...curr,
        responses: nextResponses,
        aiInsightsSummary: insights || curr.aiInsightsSummary,
      }),
      '🧪 Simulated 5 realistic responses and generated your AI Signal vs. Noise Insights!'
    );
    setActiveViewTab('INSIGHTS');
  };

  const handleClearSimulatedResponses = async () => {
    if (!activeSurvey) return;
    const realOnly = (activeSurvey.responses || []).filter(
      (r) => !r.isSimulated
    );
    await updateActiveSurvey(
      (curr) => ({
        ...curr,
        responses: realOnly,
        aiInsightsSummary:
          realOnly.length === 0 ? undefined : curr.aiInsightsSummary,
      }),
      'Cleared simulated test responses.'
    );
  };

  // 9. RUN AI INSIGHTS SYNTHESIS ON CURRENT RESPONSES
  const handleRunAiAnalysis = async () => {
    if (!activeSurvey || activeSurvey.responses.length === 0) return;
    setIsAnalyzingInsights(true);
    setActiveInsightsSubTab('SUMMARY');
    try {
      const insights = await onAnalyzeResultsWithAi({
        surveyTitle: activeSurvey.title || plan.title,
        questions: activeSurvey.questions,
        responses: activeSurvey.responses,
      });
      if (insights) {
        await updateActiveSurvey(
          (curr) => ({
            ...curr,
            aiInsightsSummary: insights,
          }),
          '✨ AI Signal vs. Polite Noise analysis updated!'
        );
      }
    } finally {
      setIsAnalyzingInsights(false);
    }
  };

  const handleCopyPublicLink = () => {
    if (!activeSurvey) return;
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://buildmyunicorn.com';
    const fullUrl = `${origin}/v/${activeSurvey.publicSlug}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(fullUrl);
    }
    setCopiedLinkSlug(activeSurvey.publicSlug);
    setTimeout(() => setCopiedLinkSlug(null), 2500);
  };

  // Compute summary metrics for activeSurvey
  const totalResponses = activeSurvey?.responses?.length || 0;
  const waitlistResponses = (activeSurvey?.responses || []).filter(
    (r) =>
      r.joinedWaitlist ||
      Boolean(r.respondentEmail && r.respondentEmail.includes('@'))
  );
  const hasSimulatedResponses = (activeSurvey?.responses || []).some(
    (r) => r.isSimulated
  );

  // Average across all SCALE_1_5 questions
  let overallScaleSum = 0;
  let overallScaleCount = 0;
  for (const q of activeSurvey?.questions || []) {
    if (q.type === 'SCALE_1_5') {
      for (const r of activeSurvey?.responses || []) {
        const val = r.answers[q.id]?.scaleValue;
        if (typeof val === 'number') {
          overallScaleSum += val;
          overallScaleCount += 1;
        }
      }
    }
  }
  const overallAvgScale =
    overallScaleCount > 0
      ? Number((overallScaleSum / overallScaleCount).toFixed(1))
      : null;

  return (
    <div className="space-y-6">
      {/* =================================================================== */}
      {/* MODULE C TOP HEADER BANNER                                          */}
      {/* =================================================================== */}
      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-950 via-indigo-900 to-violet-900 p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-indigo-400/40 bg-indigo-500/30 text-indigo-100">
                Module C • Customer Surveys, Mom-Test Co-Pilot &amp; Insights
              </Badge>
              <Badge className="border-emerald-400/30 bg-emerald-500/20 text-emerald-200">
                <ShieldCheck className="mr-1 h-3 w-3" />
                Zero-Login Public Survey Links (/v/[slug])
              </Badge>
            </div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              Module C: Customer Validation Survey Builder &amp; Insights Engine
            </h1>
            <p className="max-w-2xl text-xs text-indigo-100/90 sm:text-sm">
              Create multiple targeted surveys for{' '}
              <strong className="text-white">{plan.title}</strong>, use AI to
              build or rewrite questions using <em>The Mom Test</em>, share a
              no-login link with anyone, and turn responses into clear insights.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowWhyCard(!showWhyCard)}
              className="border-indigo-400/40 bg-white/10 text-xs text-white hover:bg-white/20"
            >
              <HelpCircle className="h-3.5 w-3.5 text-indigo-200" />
              {showWhyCard ? 'Hide Mom-Test Tips' : 'Why The Mom Test?'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowParkInput(!showParkInput)}
              className="border-amber-400/40 bg-amber-500/20 text-xs text-amber-100 hover:bg-amber-500/30"
            >
              <BookmarkPlus className="h-3.5 w-3.5 text-amber-300" />
              Park Open Question
            </Button>
          </div>
        </div>

        {showWhyCard && (
          <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-indigo-700/70 bg-indigo-950/60 p-4 text-xs text-indigo-100 md:grid-cols-3">
            <div className="flex items-start gap-2.5">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
              <div>
                <strong className="text-white">
                  Rule #1: Never ask &ldquo;Would you buy my app?&rdquo;
                </strong>
                <p className="mt-0.5 text-[11px] text-indigo-200/90">
                  Friends and strangers will say &ldquo;Yes!&rdquo; just to be
                  polite. Ask about their past 30 days of real behavior instead.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
              <div>
                <strong className="text-white">
                  Rule #2: Uncover current workarounds &amp; spend
                </strong>
                <p className="mt-0.5 text-[11px] text-indigo-200/90">
                  If someone isn&apos;t already spending time, money, or
                  spreadsheet effort working around the problem, they rarely pay
                  for a new solution.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-indigo-300" />
              <div>
                <strong className="text-white">
                  Rule #3: Keep it under 60 seconds (No Login)
                </strong>
                <p className="mt-0.5 text-[11px] text-indigo-200/90">
                  4 to 6 sharp questions on a single page gets 3× higher
                  completion rates than long multi-page forms.
                </p>
              </div>
            </div>
          </div>
        )}

        {showParkInput && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-amber-400/40 bg-indigo-950/80 p-3">
            <Input
              value={parkQuestionDraft}
              onChange={(e) => setParkQuestionDraft(e.target.value)}
              placeholder="e.g., Should we survey clinic receptionists separately from clinic owners?"
              className="flex-1 border-indigo-700 bg-white text-xs text-slate-900"
            />
            <Button
              type="button"
              size="sm"
              onClick={async () => {
                if (!parkQuestionDraft.trim()) return;
                await onParkQuestion(parkQuestionDraft.trim());
                setParkQuestionDraft('');
                setShowParkInput(false);
                setStatusBanner(
                  '📌 Question parked in your Open Questions Parking Lot!'
                );
              }}
              className="bg-amber-500 text-slate-950 hover:bg-amber-400"
            >
              Save to Parking Lot
            </Button>
          </div>
        )}
      </div>

      {/* Status Notification Banner */}
      {statusBanner && (
        <div className="flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50/90 px-4 py-2.5 text-xs font-medium text-indigo-950">
          <span>{statusBanner}</span>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className="text-indigo-500 hover:text-indigo-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* =================================================================== */}
      {/* MULTI-SURVEY SWITCHER BAR + "+ CREATE NEW SURVEY"                   */}
      {/* =================================================================== */}
      <Card className="border-slate-200 shadow-2xs">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Your Surveys ({surveys.length}):
              </span>
              {surveys.length === 0 ? (
                <span className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-1 text-xs text-slate-500">
                  No surveys created yet
                </span>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  {surveys.map((s, idx) => {
                    const isSelected = s.id === activeSurvey?.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          activeSurveyRef.current = s;
                          setActiveSurveyId(s.id);
                          setShowAiFocusSelector(false);
                          setShowPublishConfirm(false);
                        }}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-600 text-white shadow-2xs'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-indigo-300 hover:bg-white'
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            s.isActive ? 'bg-emerald-400' : 'bg-slate-400'
                          }`}
                        />
                        <span className="max-w-[180px] truncate">
                          {s.title.trim() || `Survey #${idx + 1} (Blank)`}
                        </span>
                        {s.isPublished ? (
                          <span
                            className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                              isSelected
                                ? 'bg-emerald-500/30 text-emerald-100'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                            title="Published & permanently locked against question edits"
                          >
                            <Lock className="h-2.5 w-2.5" />
                            Published
                          </span>
                        ) : (
                          <span
                            className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                              isSelected
                                ? 'bg-amber-400/30 text-amber-100'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            Draft
                          </span>
                        )}
                        <span
                          className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                            isSelected
                              ? 'bg-indigo-800 text-indigo-100'
                              : 'bg-slate-200/80 text-slate-600'
                          }`}
                        >
                          {s.responses?.length || 0} resp
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                disabled={isVaultReadonly}
                onClick={handleCreateNewBlankSurvey}
                className="bg-indigo-600 text-white hover:bg-indigo-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Create New Survey
              </Button>
            </div>
          </div>

          {/* PUBLIC SHAREABLE NO-LOGIN LINK BAR FOR ACTIVE SURVEY */}
          {activeSurvey && (
            <div className="mt-3.5 space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-slate-700">
                    Public No-Login Link:
                  </span>
                  <div className="flex items-center rounded-lg border border-slate-300 bg-white px-2.5 py-1 font-mono text-xs text-slate-700">
                    <span className="text-slate-400">/v/</span>
                    <input
                      type="text"
                      disabled={isSurveyLocked}
                      value={activeSurvey.publicSlug}
                      onChange={(e) => {
                        const clean = e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-_]/g, '-');
                        updateActiveSurvey((curr) => ({
                          ...curr,
                          publicSlug: clean || 'survey',
                        }));
                      }}
                      className="w-44 bg-transparent font-semibold text-indigo-700 focus:outline-hidden disabled:cursor-not-allowed disabled:text-slate-500 sm:w-56"
                    />
                  </div>
                  {isSurveyPublished ? (
                    <Badge className="border-emerald-300 bg-emerald-100 text-[11px] font-bold text-emerald-900">
                      <Lock className="mr-1 h-3 w-3 text-emerald-700" />
                      Published &amp; Locked (Tamper-Proof)
                    </Badge>
                  ) : (
                    <Badge className="border-amber-300 bg-amber-100 text-[11px] font-bold text-amber-900">
                      Draft Mode (Editable)
                    </Badge>
                  )}
                  <button
                    type="button"
                    disabled={isVaultReadonly}
                    onClick={() =>
                      updateActiveSurvey((curr) => ({
                        ...curr,
                        isActive: !curr.isActive,
                      }))
                    }
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-all ${
                      activeSurvey.isActive
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {activeSurvey.isActive
                      ? '● Accepting Responses'
                      : '○ Paused'}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {!isSurveyPublished && (
                    <Button
                      type="button"
                      size="sm"
                      disabled={
                        isVaultReadonly || activeSurvey.questions.length === 0
                      }
                      onClick={() => setShowPublishConfirm(true)}
                      className="bg-emerald-600 text-white shadow-2xs hover:bg-emerald-700"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      Publish &amp; Lock Survey
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyPublicLink}
                  >
                    {copiedLinkSlug === activeSurvey.publicSlug ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        Copied Link!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-slate-600" />
                        Copy Shareable Link
                      </>
                    )}
                  </Button>

                  <Link
                    href={`/v/${activeSurvey.publicSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-indigo-200 bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {isSurveyPublished
                        ? 'Open Live Survey'
                        : 'Preview Survey'}
                    </Button>
                  </Link>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isVaultReadonly}
                    onClick={handleDeleteCurrentSurvey}
                    className="border-rose-200 text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Survey
                  </Button>
                </div>
              </div>

              {/* INLINE PUBLISH & LOCK CONFIRMATION PROMPT */}
              {showPublishConfirm && !isSurveyPublished && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-emerald-400 bg-emerald-50/95 p-3.5 text-xs text-emerald-950">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                      <Lock className="h-4 w-4 text-emerald-700" />
                      <span>
                        Publish &amp; Permanently Lock This Survey?
                      </span>
                    </div>
                    <p className="max-w-2xl text-[11px] leading-relaxed text-emerald-800">
                      Once published, your{' '}
                      <strong>
                        {activeSurvey.questions.length} question
                        {activeSurvey.questions.length === 1 ? '' : 's'} and
                        answer choices cannot be edited
                      </strong>
                      . This guarantees that nobody can alter questions
                      afterwards to make results look more favorable—keeping your
                      data 100% credible for co-founders, grants, and investors.
                      (You can always create a new survey later!)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPublishConfirm(false)}
                      className="bg-white text-xs"
                    >
                      Keep Editing Draft
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handlePublishAndLockSurvey}
                      className="bg-emerald-700 text-xs text-white hover:bg-emerald-800"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      Confirm Publish &amp; Lock
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* =================================================================== */}
      {/* EMPTY STATE WHEN 0 SURVEYS EXIST                                    */}
      {/* =================================================================== */}
      {!activeSurvey && (
        <Card className="border-2 border-dashed border-slate-300 bg-slate-50/70">
          <CardContent className="flex flex-col items-center justify-center p-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-base font-bold text-slate-900">
              No Customer Validation Surveys Active
            </h3>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-600">
              Click <strong>&ldquo;+ Create New Survey&rdquo;</strong> below to
              open a fresh blank survey canvas, then either add questions
              manually or generate bias-free <em>Mom Test</em> questions with
              AI.
            </p>
            <div className="mt-4">
              <Button
                type="button"
                size="sm"
                disabled={isVaultReadonly}
                onClick={handleCreateNewBlankSurvey}
                className="bg-indigo-600 text-white hover:bg-indigo-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Create New Survey
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* =================================================================== */}
      {/* SUB-NAVIGATION TABS: 1. SURVEY BUILDER vs 2. RESULTS & AI INSIGHTS  */}
      {/* =================================================================== */}
      {activeSurvey && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveViewTab('BUILDER')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all sm:text-sm ${
                activeViewTab === 'BUILDER'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {isSurveyPublished ? (
                <Lock className="h-4 w-4" />
              ) : (
                <SlidersHorizontal className="h-4 w-4" />
              )}
              1. Survey Questions ({activeSurvey.questions.length}
              {isSurveyPublished ? ' • Locked' : ' Questions'})
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveViewTab('INSIGHTS');
                handleSyncLiveResponses(true);
              }}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all sm:text-sm ${
                activeViewTab === 'INSIGHTS'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              2. Results &amp; AI Insights
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] ${
                  activeViewTab === 'INSIGHTS'
                    ? 'bg-indigo-800 text-indigo-100'
                    : 'bg-indigo-50 text-indigo-700'
                }`}
              >
                {totalResponses}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeViewTab === 'BUILDER' && !isSurveyPublished && (
              <Button
                type="button"
                size="sm"
                disabled={isSurveyLocked}
                onClick={() => setShowAiFocusSelector(!showAiFocusSelector)}
                className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {showAiFocusSelector
                  ? 'Close AI Focus Selector'
                  : 'Build Questions with AI'}
              </Button>
            )}

            {activeViewTab === 'BUILDER' && isSurveyPublished && (
              <Badge className="border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-900">
                <Lock className="mr-1.5 h-3.5 w-3.5 text-emerald-700" />
                Questions Locked for Result Integrity
              </Badge>
            )}

            {activeViewTab === 'INSIGHTS' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSyncingResponses}
                onClick={() => handleSyncLiveResponses(false)}
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${
                    isSyncingResponses ? 'animate-spin' : ''
                  }`}
                />
                Sync Live Responses
              </Button>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 1: ULTRA-SIMPLE SURVEY BUILDER                                  */}
      {/* =================================================================== */}
      {activeSurvey && activeViewTab === 'BUILDER' && (
        <div className="space-y-5">
          {/* TAMPER-PROOF PUBLISHED LOCK BANNER */}
          {isSurveyPublished && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-300 bg-gradient-to-r from-emerald-50 via-teal-50/70 to-white p-4 text-xs text-emerald-950 shadow-2xs">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <Lock className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2 font-bold text-emerald-950 sm:text-sm">
                    <span>
                      Published &amp; Locked Survey — Tamper-Proof Audit Mode
                    </span>
                    {activeSurvey.publishedAt && (
                      <Badge
                        variant="outline"
                        className="border-emerald-300 bg-white text-[10px] font-semibold text-emerald-800"
                      >
                        Locked{' '}
                        {new Date(activeSurvey.publishedAt).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>
                  <p className="max-w-2xl text-[11px] leading-relaxed text-emerald-800">
                    This survey is published and permanently locked for editing
                    so questions or options cannot be altered to skew results.
                    Want to test a new set of questions? Click{' '}
                    <strong>&ldquo;+ Create New Survey&rdquo;</strong> to start
                    a fresh draft.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isVaultReadonly}
                onClick={handleCreateNewBlankSurvey}
                className="border-emerald-300 bg-white text-xs font-bold text-emerald-900 hover:bg-emerald-100"
              >
                <Plus className="h-3.5 w-3.5" />
                Create New Survey
              </Button>
            </div>
          )}
          {/* AI FOCUS SELECTOR MODAL / CARD (WHEN USER CLICKS "BUILD WITH AI") */}
          {showAiFocusSelector && (
            <Card className="border-2 border-indigo-400 bg-gradient-to-b from-indigo-50/90 via-white to-white shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Badge className="bg-indigo-600 text-white">
                      <Sparkles className="mr-1 h-3 w-3" />
                      Mom-Test AI Survey Builder
                    </Badge>
                    <CardTitle className="mt-2 text-base font-bold text-slate-900 sm:text-lg">
                      What would you like this survey to focus on?
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-600">
                      Pick one or more discovery goals below. AI will combine
                      your <strong>{plan.title}</strong> Module A &amp; Module B
                      data with <em>The Mom Test</em> rules to generate tailored,
                      non-leading questions right inside your survey.
                    </CardDescription>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAiFocusSelector(false)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Live Module A + Module B Context Pill Card */}
                <div className="rounded-xl border border-indigo-200 bg-white/95 p-3 shadow-2xs">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold tracking-wide text-indigo-700 uppercase">
                      Tailored to Your Module 1 &amp; Module 2 Context
                    </span>
                    <Badge
                      variant="outline"
                      className="border-emerald-200 bg-emerald-50 text-[10px] font-semibold text-emerald-700"
                    >
                      Synced Live
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                    <div className="rounded-lg bg-slate-50 px-2.5 py-1.5">
                      <span className="font-semibold text-slate-500">
                        Beachhead Persona (Mod A/B):{' '}
                      </span>
                      <span className="font-bold text-slate-800">
                        {plan.moduleBData?.beachhead?.beachheadSegment ||
                          plan.conceptCanvas?.targetCustomer ||
                          'Target customer from Module A'}
                      </span>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-2.5 py-1.5">
                      <span className="font-semibold text-slate-500">
                        Core Problem (Mod A):{' '}
                      </span>
                      <span className="font-bold text-slate-800">
                        {(
                          plan.conceptCanvas?.coreProblem ||
                          plan.brainDumpText ||
                          'Core workflow friction'
                        ).slice(0, 90)}
                      </span>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-2.5 py-1.5">
                      <span className="font-semibold text-slate-500">
                        Named Alternatives (Mod B):{' '}
                      </span>
                      <span className="font-bold text-slate-800">
                        {plan.moduleBData?.competitorsAndStatusQuo?.competitors
                          ?.filter((c) => c.name?.trim())
                          .map((c) => c.name)
                          .join(', ') || 'Manual spreadsheets & status quo'}
                      </span>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-2.5 py-1.5">
                      <span className="font-semibold text-slate-500">
                        Price &amp; Trigger Anchor (Mod B):{' '}
                      </span>
                      <span className="font-bold text-slate-800">
                        {plan.moduleBData?.marketSizing?.segments?.[0]
                          ?.pricePerCustomerInput
                          ? `${plan.baseCurrency} ${plan.moduleBData.marketSizing.segments[0].pricePerCustomerInput} (${plan.moduleBData.marketSizing.segments[0].billingCadence?.replace(/_/g, ' ') || 'annual'})`
                          : plan.moduleBData?.beachhead?.buyingTriggerNotes ||
                            'Anchored to your Module B market model'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Focus Area Selectable Tiles (Including OTHER per Rule 5) */}
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {FOCUS_AREA_OPTIONS.map((item) => {
                    const isSelected = selectedFocusAreas.includes(item.code);
                    return (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => handleToggleFocusArea(item.code)}
                        className={`flex flex-col justify-between rounded-xl border p-3 text-left transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/90 ring-1 ring-indigo-600'
                            : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50/70'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {item.title}
                          </span>
                          <span
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="h-2.5 w-2.5" />}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] leading-snug text-slate-500">
                          {item.subtitle}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Inline custom input when 'OTHER' focus is selected */}
                {selectedFocusAreas.includes('OTHER') && (
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3">
                    <label className="mb-1 block text-xs font-bold text-indigo-950">
                      Describe your custom focus area:
                    </label>
                    <Input
                      value={otherFocusAreaText}
                      onChange={(e) => setOtherFocusAreaText(e.target.value)}
                      placeholder="e.g., How busy parents coordinate after-school pickups and last-minute schedule changes"
                      className="bg-white text-xs"
                    />
                  </div>
                )}

                {/* Optional Specific Angle + Question Count Selector */}
                <div className="grid grid-cols-1 gap-3 pt-1 md:grid-cols-3">
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Any specific audience detail or question you want included?
                      (Optional)
                    </label>
                    <Input
                      value={customAiFocusPrompt}
                      onChange={(e) => setCustomAiFocusPrompt(e.target.value)}
                      placeholder="e.g., Ask independent coffee shop owners how they track daily food waste"
                      className="bg-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Number of Questions:
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { count: 4, label: '4 (45s)' },
                        { count: 5, label: '5 (60s)' },
                        { count: 7, label: '7 (Deep)' },
                      ].map((opt) => (
                        <button
                          key={opt.count}
                          type="button"
                          onClick={() => setDesiredQuestionCount(opt.count)}
                          className={`rounded-lg border py-2 text-xs font-bold transition-all ${
                            desiredQuestionCount === opt.count
                              ? 'border-indigo-600 bg-indigo-600 text-white'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-indigo-100 pt-3">
                  <span className="text-[11px] text-slate-500">
                    💡 All generated questions are 100% editable afterwards.
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAiFocusSelector(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={isGeneratingSurveyWithAi}
                      onClick={handleRunGenerateWithAi}
                      className="bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      {isGeneratingSurveyWithAi ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Building Mom-Test Questions...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-3.5 w-3.5" />
                          Generate {desiredQuestionCount} Mom-Test Questions
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SURVEY TITLE & INTRO CARD */}
          <Card className="border-slate-200 shadow-2xs">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900">
                    Survey Title &amp; Welcome Intro
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Keep it friendly and low-pressure—tell respondents
                    you&apos;re researching their workflow, not pitching a
                    product.
                  </CardDescription>
                </div>
                {isSurveyPublished && (
                  <Badge
                    variant="outline"
                    className="border-emerald-300 bg-emerald-50 text-[10px] font-bold text-emerald-800"
                  >
                    <Lock className="mr-1 h-3 w-3" />
                    Read-Only (Published)
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Survey Title
                </label>
                <Input
                  disabled={isSurveyLocked}
                  value={activeSurvey.title}
                  onChange={(e) => {
                    if (isSurveyLocked) return;
                    updateActiveSurvey((curr) => ({
                      ...curr,
                      title: e.target.value,
                    }));
                  }}
                  placeholder={`e.g., ${plan.title}: 60-Second Workflow & Frustrations Check`}
                  className="text-sm font-medium"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Short Welcome Note (Shown at top of /v/{activeSurvey.publicSlug})
                </label>
                <textarea
                  rows={2}
                  disabled={isSurveyLocked}
                  value={activeSurvey.introDescription}
                  onChange={(e) => {
                    if (isSurveyLocked) return;
                    updateActiveSurvey((curr) => ({
                      ...curr,
                      introDescription: e.target.value,
                    }));
                  }}
                  placeholder="e.g., Hi! We're researching how people handle this workflow today and what causes the biggest headaches. Takes ~60 seconds — no login or sales pitch!"
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-600"
                />
              </div>
            </CardContent>
          </Card>

          {/* BLANK SURVEY CANVAS STATE (WHEN QUESTIONS === 0) */}
          {activeSurvey.questions.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-indigo-200 bg-gradient-to-b from-white to-indigo-50/40 p-8 text-center shadow-2xs">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-base font-bold text-slate-900">
                Your Blank Survey Canvas is Ready
              </h3>
              <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-600">
                Start adding questions manually one by one, or let our{' '}
                <strong>Mom-Test AI Co-Pilot</strong> ask what you want to focus
                on and draft bias-free questions for you.
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <Button
                  type="button"
                  disabled={isSurveyLocked}
                  onClick={() => setShowAiFocusSelector(true)}
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-xs hover:from-indigo-700 hover:to-violet-700"
                >
                  <Sparkles className="h-4 w-4" />
                  Build Questions with AI (Choose Focus)
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  disabled={isSurveyLocked}
                  onClick={() => handleAddManualQuestion('MULTIPLE_CHOICE')}
                >
                  <Plus className="h-4 w-4" />
                  Add First Question Manually
                </Button>
              </div>
            </div>
          ) : (
            /* QUESTIONS LIST STACK */
            <div className="space-y-4">
              {activeSurvey.questions.map((q, qIdx) => {
                const isCheckingThis = checkingQuestionId === q.id;
                return (
                  <Card
                    key={q.id}
                    className={`border-slate-200 transition-all ${
                      isSurveyPublished
                        ? 'bg-slate-50/40'
                        : 'hover:border-indigo-200'
                    }`}
                  >
                    <CardContent className="space-y-4 p-5">
                      {/* Question Card Top Row: Number, Question Type Selector Pills & Reorder/Delete */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                            {qIdx + 1}
                          </span>
                          <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1">
                            {QUESTION_TYPE_OPTIONS.map((tOpt) => {
                              const activeType = q.type === tOpt.type;
                              return (
                                <button
                                  key={tOpt.type}
                                  type="button"
                                  disabled={isSurveyLocked}
                                  onClick={() =>
                                    handleUpdateQuestion(q.id, {
                                      type: tOpt.type,
                                    })
                                  }
                                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all disabled:cursor-not-allowed ${
                                    activeType
                                      ? 'bg-white text-indigo-700 shadow-2xs'
                                      : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  {tOpt.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {!isSurveyPublished ? (
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={
                                isSurveyLocked ||
                                isCheckingThis ||
                                !q.questionText.trim()
                              }
                              onClick={() => handleCheckQuestionMomTest(q)}
                              className="h-7 border-indigo-200 bg-indigo-50/70 px-2.5 text-[11px] text-indigo-700 hover:bg-indigo-100"
                            >
                              {isCheckingThis ? (
                                <>
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Checking...
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="h-3 w-3" />
                                  Mom-Test Check
                                </>
                              )}
                            </Button>

                            <button
                              type="button"
                              disabled={isSurveyLocked || qIdx === 0}
                              onClick={() => handleMoveQuestion(qIdx, 'UP')}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                              title="Move question up"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={
                                isSurveyLocked ||
                                qIdx === activeSurvey.questions.length - 1
                              }
                              onClick={() => handleMoveQuestion(qIdx, 'DOWN')}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                              title="Move question down"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={isSurveyLocked}
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                              title="Delete question"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-emerald-200 bg-emerald-50 text-[10px] font-semibold text-emerald-800"
                          >
                            <Lock className="mr-1 h-2.5 w-2.5" />
                            Locked
                          </Badge>
                        )}
                      </div>

                      {/* Question Prompt Input */}
                      <div>
                        <Input
                          disabled={isSurveyLocked}
                          value={q.questionText}
                          onChange={(e) =>
                            handleUpdateQuestion(q.id, {
                              questionText: e.target.value,
                            })
                          }
                          placeholder="Type your question (e.g., Thinking back over the last month, how often did you deal with...)"
                          className="text-sm font-semibold text-slate-900"
                        />
                      </div>

                      {/* MOM-TEST AI FEEDBACK & 1-CLICK REWRITE BANNER */}
                      {(q.momTestFeedback || q.momTestSuggestedRewrite) && (
                        <div
                          className={`rounded-xl border p-3 text-xs ${
                            q.momTestPassed
                              ? 'border-emerald-200 bg-emerald-50/70 text-emerald-950'
                              : 'border-amber-300 bg-amber-50/90 text-amber-950'
                          }`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 font-bold">
                                {q.momTestPassed ? (
                                  <>
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                    <span>Mom-Test Approved</span>
                                  </>
                                ) : (
                                  <>
                                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                                    <span>Mom-Test Coaching Suggestion</span>
                                  </>
                                )}
                              </div>
                              {q.momTestFeedback && (
                                <p className="text-[11px] leading-relaxed opacity-90">
                                  {q.momTestFeedback}
                                </p>
                              )}
                              {!isSurveyPublished &&
                                q.momTestSuggestedRewrite &&
                                q.momTestSuggestedRewrite !== q.questionText && (
                                  <div className="mt-1.5 rounded-lg bg-white/80 p-2 text-[11px] font-medium text-slate-800 ring-1 ring-black/5">
                                    Suggested Rewrite:{' '}
                                    <strong>
                                      &ldquo;{q.momTestSuggestedRewrite}&rdquo;
                                    </strong>
                                  </div>
                                )}
                            </div>

                            {!isSurveyPublished &&
                              q.momTestSuggestedRewrite &&
                              q.momTestSuggestedRewrite !== q.questionText && (
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={isSurveyLocked}
                                  onClick={() =>
                                    handleUpdateQuestion(q.id, {
                                      questionText: q.momTestSuggestedRewrite!,
                                      momTestPassed: true,
                                      momTestFeedback:
                                        'Mom-Test Approved: Rewritten to focus on concrete past behavior.',
                                      momTestSuggestedRewrite: undefined,
                                    })
                                  }
                                  className="h-7 bg-indigo-600 text-[11px] text-white hover:bg-indigo-700"
                                >
                                  <Wand2 className="h-3 w-3" />
                                  Use This Rewrite
                                </Button>
                              )}
                          </div>
                        </div>
                      )}

                      {/* TYPE-SPECIFIC CONFIGURATION: OPTIONS OR SCALE LABELS */}
                      {(q.type === 'MULTIPLE_CHOICE' ||
                        q.type === 'MULTI_SELECT') && (
                        <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                            <span>
                              Answer Choices (
                              {q.type === 'MULTI_SELECT'
                                ? 'Respondents can select multiple'
                                : 'Respondents pick one'}
                              ):
                            </span>
                            <label className="flex cursor-pointer items-center gap-1.5 text-[11px] font-medium text-indigo-700">
                              <input
                                type="checkbox"
                                disabled={isSurveyLocked}
                                checked={q.allowOther !== false}
                                onChange={(e) =>
                                  handleUpdateQuestion(q.id, {
                                    allowOther: e.target.checked,
                                  })
                                }
                                className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600"
                              />
                              <span>
                                Include &ldquo;Other (write-in)&rdquo; option
                              </span>
                            </label>
                          </div>

                          <div className="space-y-1.5">
                            {(q.options || []).map((optText, optIdx) => (
                              <div
                                key={optIdx}
                                className="flex items-center gap-2"
                              >
                                <span className="text-xs font-bold text-slate-400">
                                  {q.type === 'MULTI_SELECT' ? '☐' : '○'}
                                </span>
                                <Input
                                  disabled={isSurveyLocked}
                                  value={optText}
                                  onChange={(e) => {
                                    const nextOpts = [...(q.options || [])];
                                    nextOpts[optIdx] = e.target.value;
                                    handleUpdateQuestion(q.id, {
                                      options: nextOpts,
                                    });
                                  }}
                                  className="h-8 bg-white text-xs"
                                />
                                {!isSurveyPublished &&
                                  (q.options || []).length > 2 && (
                                    <button
                                      type="button"
                                      disabled={isSurveyLocked}
                                      onClick={() => {
                                        const nextOpts = (
                                          q.options || []
                                        ).filter((_, i) => i !== optIdx);
                                        handleUpdateQuestion(q.id, {
                                          options: nextOpts,
                                        });
                                      }}
                                      className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-rose-600"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                              </div>
                            ))}
                          </div>

                          {!isSurveyPublished && (
                            <div className="pt-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isSurveyLocked}
                                onClick={() => {
                                  const nextOpts = [
                                    ...(q.options || []),
                                    `Option ${(q.options?.length || 0) + 1}`,
                                  ];
                                  handleUpdateQuestion(q.id, {
                                    options: nextOpts,
                                  });
                                }}
                                className="h-7 text-[11px]"
                              >
                                <Plus className="h-3 w-3" />
                                Add Option
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {q.type === 'SCALE_1_5' && (
                        <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 sm:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                              Low End Label (Score = 1)
                            </label>
                            <Input
                              disabled={isSurveyLocked}
                              value={q.scaleMinLabel || ''}
                              onChange={(e) =>
                                handleUpdateQuestion(q.id, {
                                  scaleMinLabel: e.target.value,
                                })
                              }
                              placeholder="1 = Not painful at all"
                              className="h-8 bg-white text-xs"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                              High End Label (Score = 5)
                            </label>
                            <Input
                              disabled={isSurveyLocked}
                              value={q.scaleMaxLabel || ''}
                              onChange={(e) =>
                                handleUpdateQuestion(q.id, {
                                  scaleMaxLabel: e.target.value,
                                })
                              }
                              placeholder="5 = Urgent daily headache"
                              className="h-8 bg-white text-xs"
                            />
                          </div>
                        </div>
                      )}

                      {q.type === 'OPEN_TEXT' && (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-[11px] text-slate-500">
                          Respondents will see a clean open text box to share
                          their real story or workflow in their own words.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {/* ADD QUESTION / SUGGEST NEXT QUESTION TOOLBAR (ONLY WHEN IN DRAFT MODE) */}
              {!isSurveyPublished && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/40 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isSurveyLocked}
                      onClick={() => handleAddManualQuestion('MULTIPLE_CHOICE')}
                      className="bg-white"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Single Choice
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isSurveyLocked}
                      onClick={() => handleAddManualQuestion('MULTI_SELECT')}
                      className="bg-white"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Multi-Select
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isSurveyLocked}
                      onClick={() => handleAddManualQuestion('SCALE_1_5')}
                      className="bg-white"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add 1–5 Scale
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isSurveyLocked}
                      onClick={() => handleAddManualQuestion('OPEN_TEXT')}
                      className="bg-white"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Open Text
                    </Button>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    disabled={isSurveyLocked || isSuggestingQuestion}
                    onClick={handleSuggestOneMoreQuestion}
                    className="bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    {isSuggestingQuestion ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Suggesting...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        + Suggest 1 Question with AI
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* EARLY-BIRD WAITLIST OPT-IN FOOTER CONFIG */}
          <Card className="border-slate-200 shadow-2xs">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex cursor-pointer items-center gap-2.5 text-xs font-bold text-slate-900 sm:text-sm">
                  <input
                    type="checkbox"
                    disabled={isSurveyLocked}
                    checked={activeSurvey.collectLeadEmails}
                    onChange={(e) => {
                      if (isSurveyLocked) return;
                      updateActiveSurvey((curr) => ({
                        ...curr,
                        collectLeadEmails: e.target.checked,
                      }));
                    }}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                  />
                  <span>
                    Ask respondents to join your Early-Bird Waitlist at the end
                    of the survey
                  </span>
                </label>
                <Badge className="bg-emerald-50 text-emerald-800">
                  Optional for respondents (keeps survey 100% frictionless)
                </Badge>
              </div>

              {activeSurvey.collectLeadEmails && (
                <div className="mt-3">
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Early-Bird Waitlist Incentive Message:
                  </label>
                  <Input
                    disabled={isSurveyLocked}
                    value={activeSurvey.waitlistIncentiveText}
                    onChange={(e) => {
                      if (isSurveyLocked) return;
                      updateActiveSurvey((curr) => ({
                        ...curr,
                        waitlistIncentiveText: e.target.value,
                      }));
                    }}
                    placeholder="e.g., Want early beta access + 30% off at launch? Drop your email below:"
                    className="text-xs"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* BOTTOM PUBLISH & LOCK CALL-TO-ACTION CARD WHEN DRAFT HAS QUESTIONS */}
          {!isSurveyPublished && activeSurvey.questions.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-emerald-200 bg-gradient-to-r from-emerald-50/90 via-white to-teal-50/70 p-5 shadow-2xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-bold text-emerald-950">
                  <Lock className="h-4 w-4 text-emerald-700" />
                  <span>
                    Ready to Share? Publish &amp; Lock Survey for Tamper-Proof
                    Results
                  </span>
                </div>
                <p className="max-w-2xl text-xs leading-relaxed text-slate-600">
                  Publishing locks your{' '}
                  <strong>
                    {activeSurvey.questions.length} question
                    {activeSurvey.questions.length === 1 ? '' : 's'}
                  </strong>{' '}
                  so nobody can change questions later to make the results look
                  more favorable. Once locked, share your{' '}
                  <code className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-emerald-900">
                    /v/{activeSurvey.publicSlug}
                  </code>{' '}
                  link with confidence.
                </p>
              </div>
              <Button
                type="button"
                disabled={isVaultReadonly}
                onClick={handlePublishAndLockSurvey}
                className="bg-emerald-600 text-white shadow-xs hover:bg-emerald-700"
              >
                <Lock className="h-4 w-4" />
                Publish &amp; Lock Survey Now
              </Button>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: SURVEY RESULTS & AI "SIGNAL VS. NOISE" INSIGHTS ENGINE       */}
      {/* =================================================================== */}
      {activeSurvey && activeViewTab === 'INSIGHTS' && (
        <div className="space-y-6">
          {/* Top Simulation & AI Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 via-white to-violet-50 p-4 shadow-2xs">
            <div className="space-y-0.5">
              <div className="text-sm font-bold text-slate-900">
                Survey Results &amp; Mom-Test Insights Engine
              </div>
              <p className="text-xs text-slate-600">
                Share{' '}
                <code className="rounded bg-indigo-100 px-1.5 py-0.5 font-mono text-indigo-900">
                  /v/{activeSurvey.publicSlug}
                </code>{' '}
                with real prospects, or simulate 5 realistic sample responses to
                test your charts &amp; AI insights right now.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={
                  isVaultReadonly || activeSurvey.questions.length === 0
                }
                onClick={handleSimulateSampleResponses}
                className="border-indigo-300 bg-white text-indigo-700 hover:bg-indigo-50"
              >
                <FlaskConical className="h-3.5 w-3.5" />
                Simulate 5 Sample Responses
              </Button>

              {hasSimulatedResponses && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isVaultReadonly}
                  onClick={handleClearSimulatedResponses}
                  className="text-xs text-slate-600"
                >
                  Clear Test Data
                </Button>
              )}

              <Button
                type="button"
                size="sm"
                disabled={
                  isVaultReadonly ||
                  totalResponses === 0 ||
                  isAnalyzingInsights
                }
                onClick={handleRunAiAnalysis}
                className="bg-indigo-600 text-white hover:bg-indigo-700"
              >
                {isAnalyzingInsights ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Analyzing Signal...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Analyze Results with AI
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* 4 KPI Summary Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card
              onClick={() => setActiveInsightsSubTab('QUESTIONS')}
              className="cursor-pointer border-slate-200 shadow-2xs transition-colors hover:border-indigo-300"
            >
              <CardContent className="p-4">
                <div className="text-[11px] font-bold uppercase text-slate-400">
                  Total Responses
                </div>
                <div className="mt-1 text-2xl font-extrabold text-slate-900">
                  {totalResponses}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500">
                  {totalResponses >= 10
                    ? '✓ Strong discovery sample'
                    : 'Target: 10–15 responses'}
                </div>
              </CardContent>
            </Card>

            <Card
              onClick={() => setActiveInsightsSubTab('LEADS')}
              className="cursor-pointer border-slate-200 shadow-2xs transition-colors hover:border-emerald-300"
            >
              <CardContent className="p-4">
                <div className="text-[11px] font-bold uppercase text-slate-400">
                  Early-Bird Waitlist Leads
                </div>
                <div className="mt-1 text-2xl font-extrabold text-emerald-700">
                  {waitlistResponses.length}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500">
                  {totalResponses > 0
                    ? `${Math.round((waitlistResponses.length / totalResponses) * 100)}% opt-in rate`
                    : 'Emails captured on /v/[slug]'}
                </div>
              </CardContent>
            </Card>

            <Card
              onClick={() => setActiveInsightsSubTab('QUESTIONS')}
              className="cursor-pointer border-slate-200 shadow-2xs transition-colors hover:border-indigo-300"
            >
              <CardContent className="p-4">
                <div className="text-[11px] font-bold uppercase text-slate-400">
                  Avg Pain / Urgency (1–5)
                </div>
                <div className="mt-1 text-2xl font-extrabold text-indigo-700">
                  {overallAvgScale !== null ? `${overallAvgScale} / 5.0` : '—'}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500">
                  {overallAvgScale !== null && overallAvgScale >= 3.8
                    ? '🔥 High urgency signal'
                    : 'Across 1–5 scale questions'}
                </div>
              </CardContent>
            </Card>

            <Card
              onClick={() => setActiveInsightsSubTab('SUMMARY')}
              className="cursor-pointer border-slate-200 shadow-2xs transition-colors hover:border-violet-300"
            >
              <CardContent className="p-4">
                <div className="text-[11px] font-bold uppercase text-slate-400">
                  AI Signal Score
                </div>
                <div className="mt-1 text-2xl font-extrabold text-violet-700">
                  {activeSurvey.aiInsightsSummary
                    ? `${activeSurvey.aiInsightsSummary.signalScoreOutOf100}/100`
                    : '—'}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500">
                  Signal vs. Polite Noise
                </div>
              </CardContent>
            </Card>
          </div>

          {/* EMPTY RESPONSES STATE */}
          {totalResponses === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-base font-bold text-slate-900">
                No Responses Recorded Yet
              </h3>
              <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-600">
                Open your public survey link in a new tab to submit a test
                response, or click{' '}
                <strong>&ldquo;Simulate 5 Sample Responses&rdquo;</strong>{' '}
                above to preview the visual charts and AI Insights Engine.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href={`/v/${activeSurvey.publicSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-indigo-200 text-indigo-700"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open /v/{activeSurvey.publicSlug}
                  </Button>
                </Link>
                <Button
                  type="button"
                  size="sm"
                  disabled={activeSurvey.questions.length === 0}
                  onClick={handleSimulateSampleResponses}
                  className="bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  <FlaskConical className="h-3.5 w-3.5" />
                  Simulate 5 Sample Responses
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* SUB-TABS FOR RESULTS: 1. QUESTION BREAKDOWN | 2. AI SIGNAL SUMMARY | 3. WAITLIST LEADS */}
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
                <button
                  type="button"
                  onClick={() => setActiveInsightsSubTab('QUESTIONS')}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                    activeInsightsSubTab === 'QUESTIONS'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  Question Breakdown ({activeSurvey.questions.length})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveInsightsSubTab('SUMMARY')}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                    activeInsightsSubTab === 'SUMMARY'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  AI Signal vs. Noise Summary
                  {activeSurvey.aiInsightsSummary && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                        activeInsightsSubTab === 'SUMMARY'
                          ? 'bg-indigo-500 text-white'
                          : 'bg-indigo-50 text-indigo-700'
                      }`}
                    >
                      {activeSurvey.aiInsightsSummary.signalScoreOutOf100}/100
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveInsightsSubTab('LEADS')}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                    activeInsightsSubTab === 'LEADS'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Mail className="h-3.5 w-3.5" />
                  Early-Bird Waitlist Leads
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                      activeInsightsSubTab === 'LEADS'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {waitlistResponses.length}
                  </span>
                </button>
              </div>

              {/* SUB-TAB 1: AI SIGNAL VS. NOISE INSIGHTS SYNTHESIS CARD */}
              {activeInsightsSubTab === 'SUMMARY' && (
                <div>
                  {activeSurvey.aiInsightsSummary ? (
                    <Card className="border-indigo-200 bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 text-white shadow-md">
                      <CardContent className="space-y-4 p-6">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <Badge className="border-indigo-400/40 bg-indigo-500/30 text-indigo-100">
                              <Sparkles className="mr-1 h-3 w-3" />
                              AI &ldquo;Signal vs. Polite Noise&rdquo; Synthesis
                            </Badge>
                            <h3 className="mt-2 text-lg font-bold text-white">
                              {activeSurvey.aiInsightsSummary.headlineTakeaway}
                            </h3>
                          </div>
                          <div className="rounded-2xl border border-indigo-400/30 bg-white/10 px-4 py-2 text-center">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">
                              Validation Signal
                            </div>
                            <div className="text-xl font-extrabold text-emerald-300">
                              {
                                activeSurvey.aiInsightsSummary
                                  .signalScoreOutOf100
                              }
                              /100
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          {/* Validated Pain Points */}
                          <div className="rounded-xl border border-emerald-400/30 bg-emerald-950/30 p-4">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                              <CheckCircle2 className="h-4 w-4" />
                              Validated Pain &amp; Workflow Signals
                            </div>
                            <ul className="mt-2.5 space-y-2 text-xs text-indigo-100">
                              {activeSurvey.aiInsightsSummary.validatedPainPoints.map(
                                (pt, idx) => (
                                  <li key={idx} className="leading-relaxed">
                                    • {pt}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>

                          {/* Politeness Warnings / Blind Spots */}
                          <div className="rounded-xl border border-amber-400/30 bg-amber-950/30 p-4">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                              <AlertTriangle className="h-4 w-4" />
                              Mom-Test Politeness &amp; Blind-Spot Checks
                            </div>
                            <ul className="mt-2.5 space-y-2 text-xs text-indigo-100">
                              {activeSurvey.aiInsightsSummary.politenessAlertOrRisks.map(
                                (warn, idx) => (
                                  <li key={idx} className="leading-relaxed">
                                    • {warn}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        </div>

                        <div className="rounded-xl border border-indigo-400/30 bg-white/10 p-3.5 text-xs">
                          <span className="font-bold text-emerald-300">
                            Recommended Next Action:{' '}
                          </span>
                          <span className="text-indigo-100">
                            {
                              activeSurvey.aiInsightsSummary
                                .recommendedNextAction
                            }
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border-dashed border-indigo-200 bg-white">
                      <CardContent className="p-8 text-center">
                        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                          <Sparkles className="h-5 w-5" />
                        </div>
                        <h4 className="mt-3 text-sm font-bold text-slate-900">
                          Ready to Analyze Your {totalResponses} Responses
                        </h4>
                        <p className="mx-auto mt-1 max-w-md text-xs text-slate-600">
                          Click below to synthesize your responses into a
                          Mom-Test &ldquo;Signal vs. Polite Noise&rdquo; report.
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          disabled={isVaultReadonly || isAnalyzingInsights}
                          onClick={handleRunAiAnalysis}
                          className="mt-4 bg-indigo-600 text-white hover:bg-indigo-700"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          Analyze Results with AI
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* SUB-TAB 2: VISUAL QUESTION-BY-QUESTION BREAKDOWN CARDS */}
              {activeInsightsSubTab === 'QUESTIONS' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Question-by-Question Breakdown ({activeSurvey.questions.length})
                </h3>

                {activeSurvey.questions.map((q, qIdx) => {
                  // Compute stats for this question across activeSurvey.responses
                  if (
                    q.type === 'MULTIPLE_CHOICE' ||
                    q.type === 'MULTI_SELECT'
                  ) {
                    const counts: Record<string, number> = {};
                    for (const opt of q.options || []) {
                      counts[opt] = 0;
                    }
                    let otherCount = 0;
                    const otherTexts: string[] = [];
                    let answeredTotal = 0;

                    for (const r of activeSurvey.responses) {
                      const ans = r.answers[q.id];
                      if (!ans) continue;
                      if (
                        q.type === 'MULTIPLE_CHOICE' &&
                        ans.selectedOption
                      ) {
                        answeredTotal += 1;
                        if (ans.selectedOption === 'OTHER') {
                          otherCount += 1;
                          if (ans.otherText?.trim()) {
                            otherTexts.push(ans.otherText.trim());
                          }
                        } else {
                          counts[ans.selectedOption] =
                            (counts[ans.selectedOption] || 0) + 1;
                        }
                      } else if (
                        q.type === 'MULTI_SELECT' &&
                        Array.isArray(ans.selectedOptions) &&
                        ans.selectedOptions.length > 0
                      ) {
                        answeredTotal += 1;
                        for (const sel of ans.selectedOptions) {
                          if (sel === 'OTHER') {
                            otherCount += 1;
                            if (ans.otherText?.trim()) {
                              otherTexts.push(ans.otherText.trim());
                            }
                          } else {
                            counts[sel] = (counts[sel] || 0) + 1;
                          }
                        }
                      }
                    }

                    return (
                      <Card key={q.id} className="border-slate-200 shadow-2xs">
                        <CardContent className="space-y-3 p-5">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-800">
                                {qIdx + 1}
                              </span>
                              <div>
                                <div className="text-sm font-bold text-slate-900">
                                  {q.questionText}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  {q.type === 'MULTI_SELECT'
                                    ? 'Multi-Select'
                                    : 'Single Choice'}{' '}
                                  • {answeredTotal} answered
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2.5 pt-1">
                            {Object.entries(counts).map(([optLabel, count]) => {
                              const pct =
                                answeredTotal > 0
                                  ? Math.round((count / answeredTotal) * 100)
                                  : 0;
                              return (
                                <div key={optLabel} className="space-y-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="font-medium text-slate-800">
                                      {optLabel}
                                    </span>
                                    <span className="font-bold text-slate-700">
                                      {count} ({pct}%)
                                    </span>
                                  </div>
                                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                                    <div
                                      className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}

                            {otherCount > 0 && (
                              <div className="space-y-1.5 pt-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-medium text-indigo-800">
                                    ✨ Other (Write-in answers)
                                  </span>
                                  <span className="font-bold text-indigo-800">
                                    {otherCount} (
                                    {answeredTotal > 0
                                      ? Math.round(
                                          (otherCount / answeredTotal) * 100
                                        )
                                      : 0}
                                    %)
                                  </span>
                                </div>
                                {otherTexts.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                    {otherTexts.map((txt, idx) => (
                                      <span
                                        key={idx}
                                        className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-950"
                                      >
                                        &ldquo;{txt}&rdquo;
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }

                  if (q.type === 'SCALE_1_5') {
                    const dist: Record<number, number> = {
                      1: 0,
                      2: 0,
                      3: 0,
                      4: 0,
                      5: 0,
                    };
                    let sum = 0;
                    let count = 0;
                    for (const r of activeSurvey.responses) {
                      const val = r.answers[q.id]?.scaleValue;
                      if (typeof val === 'number' && val >= 1 && val <= 5) {
                        dist[val] = (dist[val] || 0) + 1;
                        sum += val;
                        count += 1;
                      }
                    }
                    const avg =
                      count > 0 ? Number((sum / count).toFixed(1)) : 0;

                    return (
                      <Card key={q.id} className="border-slate-200 shadow-2xs">
                        <CardContent className="space-y-3 p-5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-start gap-2.5">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-800">
                                {qIdx + 1}
                              </span>
                              <div>
                                <div className="text-sm font-bold text-slate-900">
                                  {q.questionText}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  1–5 Rating Scale • {count} answered
                                </div>
                              </div>
                            </div>

                            <Badge className="bg-indigo-600 px-3 py-1 text-xs font-bold text-white">
                              Avg: {avg} / 5.0
                            </Badge>
                          </div>

                          <div className="grid grid-cols-5 gap-2 pt-2">
                            {[1, 2, 3, 4, 5].map((score) => {
                              const tally = dist[score] || 0;
                              const pct =
                                count > 0
                                  ? Math.round((tally / count) * 100)
                                  : 0;
                              return (
                                <div
                                  key={score}
                                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-center"
                                >
                                  <div className="text-xs font-bold text-slate-700">
                                    Score {score}
                                  </div>
                                  <div className="mt-1 text-base font-extrabold text-indigo-700">
                                    {tally}
                                  </div>
                                  <div className="text-[10px] text-slate-500">
                                    {pct}%
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }

                  // OPEN_TEXT quotes
                  const quotes = activeSurvey.responses
                    .map((r) => ({
                      text: r.answers[q.id]?.openText?.trim() || '',
                      author: r.respondentNameOrRole || 'Anonymous Respondent',
                      waitlist: r.joinedWaitlist,
                      email: r.respondentEmail,
                    }))
                    .filter((item) => item.text.length > 0);

                  return (
                    <Card key={q.id} className="border-slate-200 shadow-2xs">
                      <CardContent className="space-y-3 p-5">
                        <div className="flex items-start gap-2.5">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-800">
                            {qIdx + 1}
                          </span>
                          <div>
                            <div className="text-sm font-bold text-slate-900">
                              {q.questionText}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Open-Text Verbatim Stories • {quotes.length}{' '}
                              responses
                            </div>
                          </div>
                        </div>

                        {quotes.length === 0 ? (
                          <div className="text-xs text-slate-400">
                            No written responses yet.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-2.5 pt-1 md:grid-cols-2">
                            {quotes.map((qt, idx) => (
                              <div
                                key={idx}
                                className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs"
                              >
                                <p className="italic leading-relaxed text-slate-800">
                                  &ldquo;{qt.text}&rdquo;
                                </p>
                                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                                  <span className="font-semibold text-slate-700">
                                    — {qt.author}
                                  </span>
                                  {qt.waitlist && (
                                    <Badge className="bg-emerald-100 text-[10px] text-emerald-800">
                                      Joined Waitlist
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              )}

              {/* SUB-TAB 3: EARLY-BIRD WAITLIST LEADS TABLE */}
              {activeInsightsSubTab === 'LEADS' && (
              <Card className="border-emerald-200 bg-emerald-50/30 shadow-2xs">
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-900">
                        <Mail className="h-4 w-4 text-emerald-600" />
                        Early-Bird Waitlist &amp; High-Intent Leads (
                        {waitlistResponses.length})
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-600">
                        Respondents who opted into your early-bird waitlist at
                        the end of the survey. Reach out to them first for
                        1-on-1 discovery calls or beta onboarding!
                      </CardDescription>
                    </div>

                    {waitlistResponses.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const emails = waitlistResponses
                            .map((r) => r.respondentEmail)
                            .filter(Boolean)
                            .join(', ');
                          if (
                            typeof navigator !== 'undefined' &&
                            navigator.clipboard
                          ) {
                            navigator.clipboard.writeText(emails);
                          }
                          setCopiedEmails(true);
                          setTimeout(() => setCopiedEmails(false), 2500);
                        }}
                        className="bg-white text-xs"
                      >
                        {copiedEmails ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            Copied Emails!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            Copy All Emails
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {waitlistResponses.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-emerald-200 bg-white p-4 text-center text-xs text-slate-500">
                      No waitlist emails captured yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
                      {waitlistResponses.map((lead) => (
                        <div
                          key={lead.id}
                          className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900">
                              {lead.respondentNameOrRole || 'Early-Bird Lead'}
                            </span>
                            {lead.respondentEmail && (
                              <span className="ml-2 font-mono text-indigo-700">
                                {lead.respondentEmail}
                              </span>
                            )}
                            {lead.isSimulated && (
                              <Badge
                                variant="secondary"
                                className="ml-2 text-[10px]"
                              >
                                Simulated Sample
                              </Badge>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {new Date(lead.submittedAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* BOTTOM NAVIGATION BAR (BACK TO MODULE B / CONTINUE)                 */}
      {/* =================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onBackToModuleB}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Module B (Market &amp; Competitors)
        </Button>

        <div className="flex items-center gap-2">
          {activeSurvey && activeViewTab === 'BUILDER' ? (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setActiveViewTab('INSIGHTS');
                handleSyncLiveResponses(true);
              }}
              className="bg-indigo-600 text-white hover:bg-indigo-700"
            >
              View Results &amp; AI Insights ({totalResponses})
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            onContinueToModuleD && (
              <Button
                type="button"
                size="sm"
                onClick={onContinueToModuleD}
                className="bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Save &amp; Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
