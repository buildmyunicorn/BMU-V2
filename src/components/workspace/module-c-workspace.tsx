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
  QrCode,
  Download,
  Printer,
  Share2,
  Send,
  Smartphone,
  PhoneCall,
  Video,
  Coffee,
  Quote,
  ChevronDown,
  ChevronUp,
  Pencil,
  Flame,
  Calendar,
  Mic,
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
  type SurveyOutreachTemplates,
  type OutreachChannelType,
  type SavedCustomerInterviewLog,
  type InterviewChannelType,
  type InterviewSignalBadgeType,
  type InterviewCommitmentOutcomeType,
} from '@/lib/auth/session-store';
import {
  getCountryRulePack,
  type SupportedCountryCode,
} from '@/lib/localization';
import type { BlindSpotItem } from '@/db/schema';
import {
  buildDynamicModuleCBlindSpots,
  hasModuleCValidationData,
} from '@/lib/ai/module-c-blindspots';
import {
  buildModuleCMarkdownBrief,
  buildModuleCStandaloneHtmlDocument,
  formatInterviewChannel,
  formatInterviewCommitment,
  INTERVIEW_SIGNAL_LABELS,
  type ModuleCBriefData,
} from '@/lib/export/module-c-brief';
import { getFounderSurveyResponsesBySlugAction } from '@/app/actions/module-c';
import {
  generateQrCodeMatrix,
  generateQrCodeSvgString,
} from '@/lib/qr-code';

export interface ModuleCWorkspaceProps {
  plan: ActiveStartupPlan;
  selectedCountry: SupportedCountryCode;
  isVaultReadonly: boolean;
  founderName?: string;
  whiteLabelEnabled?: boolean;
  onSaveSurvey: (
    survey: SavedValidationSurvey,
    allSurveys: SavedValidationSurvey[]
  ) => Promise<void>;
  onDeleteSurvey: (
    surveyId: string,
    publicSlug: string,
    remainingSurveys: SavedValidationSurvey[]
  ) => Promise<void>;
  onSaveInterviewLogs: (
    interviewLogs: SavedCustomerInterviewLog[],
    activeSurveySlug?: string
  ) => Promise<void>;
  onSaveModuleCBlindSpots?: (
    thingsToConsider: BlindSpotItem[]
  ) => Promise<void>;
  onExtractMomTestInterviewWithAi: (params: {
    intervieweeNameOrRole: string;
    channel: InterviewChannelType;
    otherChannelText?: string;
    rawNotes: string;
  }) => Promise<{
    keyTakeaway: string;
    verbatimQuote: string;
    workaroundAndSpend: string;
    painScore1To5: number;
    commitmentOutcome: InterviewCommitmentOutcomeType;
    otherCommitmentText?: string;
    signalBadge: InterviewSignalBadgeType;
    momTestCoachingNote: string;
  } | null>;
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
    interviewLogs?: SavedCustomerInterviewLog[];
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

const OUTREACH_CHANNEL_OPTIONS: Array<{
  code: OutreachChannelType;
  label: string;
  subtitle: string;
  bestFor: string;
}> = [
  {
    code: 'LINKEDIN_DM',
    label: 'LinkedIn / Warm DM',
    subtitle: 'Short 1-on-1 message to peers or target buyers',
    bestFor: 'Highest response rate (40–60%)',
  },
  {
    code: 'COMMUNITY_POST',
    label: 'Reddit / Slack / FB Group',
    subtitle: 'Moderator-safe research post (zero self-promotion)',
    bestFor: '10–30 responses fast',
  },
  {
    code: 'WHATSAPP_SMS',
    label: 'WhatsApp / SMS Blurb',
    subtitle: '2-sentence quick ask for contacts & group chats',
    bestFor: 'Instant mobile replies',
  },
  {
    code: 'COLD_EMAIL',
    label: 'Short Cold / Warm Email',
    subtitle: 'Subject line + 4-line body for industry contacts',
    bestFor: 'B2B & professional leads',
  },
  {
    code: 'IN_PERSON_PITCH',
    label: 'In-Person + QR Script',
    subtitle: '10-second verbal opener before showing your QR code',
    bestFor: 'Events, coffee shops & campus',
  },
  {
    code: 'OTHER',
    label: 'Other / Custom Channel',
    subtitle: 'Write & save a custom template for your own channel',
    bestFor: 'Newsletter, Discord, Forum, etc.',
  },
];

const INTERVIEW_CHANNEL_OPTIONS: Array<{
  code: InterviewChannelType;
  label: string;
  subtitle: string;
}> = [
  {
    code: 'ZOOM_VIDEO',
    label: 'Zoom / Google Meet',
    subtitle: 'Screen-share or video discovery call',
  },
  {
    code: 'IN_PERSON_COFFEE',
    label: 'In-Person / Coffee',
    subtitle: 'Face-to-face chat at their workplace or cafe',
  },
  {
    code: 'PHONE_CALL',
    label: 'Phone Call',
    subtitle: '10–15 min voice call',
  },
  {
    code: 'LINKEDIN_DM_CHAT',
    label: 'LinkedIn / Voice Note / DM',
    subtitle: 'Back-and-forth async DM or voice notes',
  },
  {
    code: 'OTHER',
    label: 'Other / Custom Channel',
    subtitle: 'Specify your own conversation channel',
  },
];

const INTERVIEW_COMMITMENT_OPTIONS: Array<{
  code: InterviewCommitmentOutcomeType;
  label: string;
  subtitle: string;
  defaultSignal: InterviewSignalBadgeType;
}> = [
  {
    code: 'ASKED_TO_PILOT_OR_BUY',
    label: '🔥 Asked to Pilot / Pre-Order / Buy',
    subtitle: 'Strongest Mom-Test advancement: offered money, pilot, or calendar time',
    defaultSignal: 'STRONG_SIGNAL',
  },
  {
    code: 'INTRODUCED_PEERS',
    label: '🤝 Introduced Peers / Co-Workers',
    subtitle: 'Put their reputation on the line by introducing others with the problem',
    defaultSignal: 'STRONG_SIGNAL',
  },
  {
    code: 'SHARED_DEEP_WORKFLOW_PAIN',
    label: '✅ Shared Real Past Pain & Spend',
    subtitle: 'Walked through a specific recent breakdown and current workaround',
    defaultSignal: 'STRONG_SIGNAL',
  },
  {
    code: 'POLITE_COMPLIMENTS_ONLY',
    label: '⚠️ Polite Compliments Only ("Cool Idea!")',
    subtitle: 'Said nice things about your concept without concrete past pain or commitment',
    defaultSignal: 'POLITE_FLUFF',
  },
  {
    code: 'NOT_TARGET_PERSONA',
    label: '🚫 Disqualified / Not Target Persona',
    subtitle: 'Useful disqualification — helped narrow who NOT to target',
    defaultSignal: 'MIXED_SIGNAL',
  },
  {
    code: 'OTHER',
    label: '✨ Other / Custom Outcome',
    subtitle: 'Describe a custom outcome or follow-up step from the conversation',
    defaultSignal: 'MIXED_SIGNAL',
  },
];

function buildLiveCallCheatSheetPrompts(
  plan: ActiveStartupPlan,
  survey?: SavedValidationSurvey
): Array<{ title: string; question: string; whyItWorks: string }> {
  const { audiencePhrase, topicPhrase } = deriveNaturalTopicForOutreach(
    plan,
    survey || {
      id: 'default',
      planId: plan.id,
      title: plan.title,
      publicSlug: 'survey',
      introDescription: '',
      focusAreas: [],
      questions: [],
      collectLeadEmails: true,
      waitlistIncentiveText: '',
      isActive: true,
      responses: [],
      createdAt: '',
      updatedAt: '',
    }
  );

  return [
    {
      title: '1. Anchor in the Last Time It Happened (Past Behavior)',
      question: `"Can you walk me through the very last time you dealt with ${topicPhrase}? What happened step by step?"`,
      whyItWorks:
        'Replaces generic opinions ("I usually...") with a real, concrete recent event.',
    },
    {
      title: '2. Probe the Hardest / Most Frustrating Part',
      question: `"What was the most frustrating or time-consuming part of that workflow? How long did it take?"`,
      whyItWorks:
        'Measures real time/emotional cost so you know whether this is a 5/5 urgent problem or a minor annoyance.',
    },
    {
      title: '3. Uncover Current Workarounds & Budget Reality',
      question: `"How are you and other ${audiencePhrase} working around this today? Have you paid for any tools, templates, or extra hours to fix it?"`,
      whyItWorks:
        'If they already spend money or cobble together spreadsheets, they have proven willingness to pay.',
    },
    {
      title: '4. Why Existing Tools Fall Short',
      question: `"Have you tried looking for another solution in the last 6 months? What stopped you from switching or sticking with it?"`,
      whyItWorks:
        'Reveals switching friction and your exact competitive wedge for Module B & Module D.',
    },
    {
      title: '5. The Mom-Test Advancement Ask (End of Call)',
      question: `"If we put together a focused V1 that solves [their #1 pain], would you be open to testing a 14-day pilot next month — and is there one peer dealing with this who we should speak with?"`,
      whyItWorks:
        'Separates polite compliments ("Sounds cool!") from real skin-in-the-game commitment.',
    },
  ];
}

function deriveNaturalTopicForOutreach(
  plan: ActiveStartupPlan,
  survey: SavedValidationSurvey
): { audiencePhrase: string; topicPhrase: string } {
  const rawAudience =
    plan.moduleBData?.beachhead?.beachheadSegment ||
    plan.moduleBData?.beachhead?.decisionMakerRole ||
    plan.conceptCanvas?.targetCustomer ||
    'founders and operators';

  const cleanAudience = rawAudience
    .replace(/^(we target|our target customer is|target customer:)\s*/i, '')
    .split(/[.;\n]/)[0]
    .trim()
    .slice(0, 65)
    .toLowerCase();

  const audiencePhrase = cleanAudience || 'people in this space';

  const rawIdea = `${plan.title} ${plan.oneLinerSummary || ''} ${
    plan.conceptCanvas?.coreProblem || ''
  } ${survey.title || ''}`.toLowerCase();

  let topicPhrase = 'day-to-day workflows and bottlenecks';
  if (/founder|startup|idea|unicorn|launch|pitch|grant/.test(rawIdea)) {
    topicPhrase =
      'turning an early startup idea into a validated business plan';
  } else if (/clinic|patient|medical|health|dentist|doctor|care/.test(rawIdea)) {
    topicPhrase = 'patient scheduling, admin handoffs, and clinic workflows';
  } else if (/invoice|finance|tax|accounting|bookkeep|expense|payroll/.test(rawIdea)) {
    topicPhrase = 'invoicing, cashflow tracking, and monthly admin';
  } else if (/hire|recruit|hr|candidate|onboarding|staff|shift/.test(rawIdea)) {
    topicPhrase = 'hiring, shift scheduling, and team onboarding';
  } else if (/property|tenant|landlord|estate|lease|maintenance/.test(rawIdea)) {
    topicPhrase = 'managing properties, tenant requests, and maintenance';
  } else if (/ecommerce|shopify|inventory|order|shipping|retail/.test(rawIdea)) {
    topicPhrase = 'fulfilling orders, inventory tracking, and customer returns';
  } else if (survey.title && survey.title.trim().length > 4) {
    topicPhrase = survey.title
      .replace(/survey|discovery|validation|questions/gi, '')
      .replace(/[:\-–—]+$/, '')
      .trim()
      .toLowerCase();
  }

  return { audiencePhrase, topicPhrase };
}

function buildDefaultOutreachTemplates(
  plan: ActiveStartupPlan,
  survey: SavedValidationSurvey
): SurveyOutreachTemplates {
  const { audiencePhrase, topicPhrase } = deriveNaturalTopicForOutreach(
    plan,
    survey
  );
  const qCount = Math.max(survey.questions.length, 5);

  return {
    linkedinDm: `Hey [Name] — hope your week is going well! Quick question: I'm doing some independent research into how ${audiencePhrase} currently handle ${topicPhrase}.\n\nI'm not selling anything — just running a ${qCount}-question anonymous Mom-Test survey (takes under 60 seconds, no login required).\n\nWould love your honest perspective if you have a spare minute:\n{{SURVEY_LINK}}\n\nHappy to share the aggregated findings with you once we wrap up!`,
    communityPost: `Hi everyone — I'm researching how ${audiencePhrase} deal with ${topicPhrase} in the real world (what actually works vs. what wastes time).\n\nNothing to sell or pitch here! I put together a quick ${qCount}-question anonymous survey that takes ~60 seconds with zero login:\n{{SURVEY_LINK}}\n\nIf you've dealt with this recently, I'd be super grateful for your candid input — and I'll post a full summary of the results back in this thread next week. Thanks!`,
    whatsappBlurb: `Hey! 👋 Doing a quick 60-second research survey on how people handle ${topicPhrase} (only ${qCount} quick questions, no login needed). Would love your honest take if you have a spare minute: {{SURVEY_LINK}}`,
    coldEmailSubject: `Quick 60-sec question on ${topicPhrase}`,
    coldEmailBody: `Hi [Name],\n\nI'm speaking with ${audiencePhrase} to better understand the biggest day-to-day frustrations around ${topicPhrase}.\n\nNot pitching anything — if you have 60 seconds, could you share your honest experience in this ${qCount}-question anonymous survey?\n\n{{SURVEY_LINK}}\n\nThanks so much in advance,\n[Your Name]`,
    inPersonPitch: `"Excuse me — do you have 45 seconds? We're researching how people handle ${topicPhrase}. No login or email required — if you scan this QR code with your phone camera, it's just ${qCount} quick taps!"`,
    customChannelName: '',
    customChannelMessage: `We're researching how ${audiencePhrase} handle ${topicPhrase}. Take our 60-second anonymous survey (no login required): {{SURVEY_LINK}}`,
    qrFlyerHeadline:
      survey.title.trim() || `Got 60 Seconds? Share Your Honest Experience`,
    qrFlyerSubtext: `Scan with your phone camera • ${qCount} quick questions • No login required`,
    lastGeneratedAt: new Date().toISOString(),
  };
}

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
  selectedCountry,
  isVaultReadonly,
  founderName = 'Founder',
  whiteLabelEnabled = false,
  onSaveSurvey,
  onDeleteSurvey,
  onSaveInterviewLogs,
  onSaveModuleCBlindSpots,
  onExtractMomTestInterviewWithAi,
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

  // Top-level Module C section: 'SURVEYS' vs standalone 'INTERVIEWS'
  const [activeModuleCSection, setActiveModuleCSection] = useState<
    'SURVEYS' | 'INTERVIEWS'
  >('SURVEYS');

  // Survey sub-view tab: 'BUILDER' vs 'OUTREACH' vs 'INSIGHTS'
  const [activeViewTab, setActiveViewTab] = useState<
    'BUILDER' | 'OUTREACH' | 'INSIGHTS'
  >('BUILDER');
  // Active channel inside 'OUTREACH' tab
  const [selectedOutreachChannel, setSelectedOutreachChannel] =
    useState<OutreachChannelType>('LINKEDIN_DM');
  const [copiedChannelCode, setCopiedChannelCode] = useState<string | null>(
    null
  );
  // Results sub-tab inside 'INSIGHTS': 'SUMMARY' | 'QUESTIONS' | 'LEADS'
  const [activeInsightsSubTab, setActiveInsightsSubTab] = useState<
    'SUMMARY' | 'QUESTIONS' | 'LEADS'
  >('QUESTIONS');

  // 1-on-1 Customer Interviews state (persisted in plan.moduleCData.interviewLogs & mirrored to activeSurvey)
  const [interviewLogs, setInterviewLogs] = useState<SavedCustomerInterviewLog[]>(
    () =>
      plan.moduleCData?.interviewLogs &&
      plan.moduleCData.interviewLogs.length > 0
        ? plan.moduleCData.interviewLogs
        : activeSurvey?.interviewLogs || []
  );
  const interviewLogsRef = useRef<SavedCustomerInterviewLog[]>(interviewLogs);
  interviewLogsRef.current = interviewLogs;

  useEffect(() => {
    const incomingLogs =
      plan.moduleCData?.interviewLogs &&
      plan.moduleCData.interviewLogs.length > 0
        ? plan.moduleCData.interviewLogs
        : activeSurvey?.interviewLogs || [];
    if (incomingLogs.length > 0 && interviewLogsRef.current.length === 0) {
      setInterviewLogs(incomingLogs);
    }
  }, [plan.id, plan.moduleCData?.interviewLogs, activeSurvey?.interviewLogs]);

  // 1-on-1 Interview Logger Form State
  const [editingInterviewId, setEditingInterviewId] = useState<string | null>(
    null
  );
  const [intervieweeNameOrRole, setIntervieweeNameOrRole] =
    useState<string>('');
  const [intervieweeEmail, setIntervieweeEmail] = useState<string>('');
  const [interviewDate, setInterviewDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [interviewChannel, setInterviewChannel] =
    useState<InterviewChannelType>('ZOOM_VIDEO');
  const [otherInterviewChannelText, setOtherInterviewChannelText] =
    useState<string>('');
  const [interviewRawNotes, setInterviewRawNotes] = useState<string>('');
  const [interviewKeyTakeaway, setInterviewKeyTakeaway] = useState<string>('');
  const [interviewVerbatimQuote, setInterviewVerbatimQuote] =
    useState<string>('');
  const [interviewWorkaroundAndSpend, setInterviewWorkaroundAndSpend] =
    useState<string>('');
  const [interviewPainScore, setInterviewPainScore] = useState<number>(4);
  const [interviewCommitment, setInterviewCommitment] =
    useState<InterviewCommitmentOutcomeType>('SHARED_DEEP_WORKFLOW_PAIN');
  const [otherInterviewCommitmentText, setOtherInterviewCommitmentText] =
    useState<string>('');
  const [interviewSignalBadge, setInterviewSignalBadge] =
    useState<InterviewSignalBadgeType>('STRONG_SIGNAL');
  const [interviewMomTestCoachingNote, setInterviewMomTestCoachingNote] =
    useState<string>('');
  const [linkedWaitlistResponseId, setLinkedWaitlistResponseId] = useState<
    string | undefined
  >(undefined);
  const [isExtractingInterviewAi, setIsExtractingInterviewAi] =
    useState<boolean>(false);
  const [showLiveCallCheatSheet, setShowLiveCallCheatSheet] =
    useState<boolean>(false);

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
  const [showWhyCard, setShowWhyCard] = useState<boolean>(false);
  const [parkQuestionDraft, setParkQuestionDraft] = useState<string>('');
  const [showParkInput, setShowParkInput] = useState<boolean>(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState<boolean>(false);

  // Focused Window / Studio Modals for Surveys & 1-on-1 Interviews
  const [isSurveyStudioOpen, setIsSurveyStudioOpen] = useState<boolean>(false);
  const [isInterviewModalOpen, setIsInterviewModalOpen] =
    useState<boolean>(false);

  // Step Accordion State (GEMINI.md Section 6 Standard:
  // Step 1 = Surveys, Step 2 = 1-on-1 Interviews, Step 3 = Blind-Spot Review, Step 4 = Overview Brief)
  const [openStep, setOpenStep] = useState<number | 'ALL'>(() => {
    const hasValidSurvey = surveys.some((s) => s.questions.length > 0);
    if (!hasValidSurvey) return 1;
    if (interviewLogs.length === 0) return 2;
    return 1;
  });

  const scrollToStep = (stepNum: number) => {
    setOpenStep(stepNum);
    if (typeof document !== 'undefined') {
      setTimeout(() => {
        const el = document.getElementById(`module-c-step-${stepNum}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 60);
    }
  };

  const openSurveyInStudio = (
    survey: SavedValidationSurvey,
    initialTab: 'BUILDER' | 'OUTREACH' | 'INSIGHTS' = 'BUILDER',
    openAiSelector = false
  ) => {
    activeSurveyRef.current = survey;
    setActiveSurveyId(survey.id);
    setActiveModuleCSection('SURVEYS');
    setActiveViewTab(initialTab);
    setShowAiFocusSelector(openAiSelector);
    setShowPublishConfirm(false);
    setIsSurveyStudioOpen(true);
    if (initialTab === 'INSIGHTS') {
      setTimeout(() => {
        void handleSyncLiveResponses(true);
      }, 40);
    }
  };

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
      const cloudRes = await getFounderSurveyResponsesBySlugAction({
        planId: plan.id,
        publicSlug: currentActive.publicSlug,
      });

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

  // 1. CREATE NEW BLANK SURVEY (OPENS DIRECTLY IN SURVEY STUDIO WINDOW)
  const handleCreateNewBlankSurvey = async (openAiBuilder = false) => {
    if (isVaultReadonly) return;
    const currentAll = surveysRef.current;
    const newBlank = createBlankSurvey(plan, currentAll.length + 1);
    const nextSurveys = [...currentAll, newBlank];
    surveysRef.current = nextSurveys;
    activeSurveyRef.current = newBlank;
    setSurveys(nextSurveys);
    setActiveSurveyId(newBlank.id);
    setActiveModuleCSection('SURVEYS');
    setActiveViewTab('BUILDER');
    setShowAiFocusSelector(openAiBuilder);
    setShowPublishConfirm(false);
    setIsSurveyStudioOpen(true);
    await onSaveSurvey(newBlank, nextSurveys);
    setStatusBanner(
      '✨ Created a fresh survey in Survey Studio! Add questions manually or click "Build with AI" to pick your focus.'
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

  // 2. DELETE SURVEY BY ID OR CURRENT SURVEY
  const handleDeleteSurveyById = async (targetSurvey?: SavedValidationSurvey) => {
    const surveyToDelete = targetSurvey || activeSurvey;
    if (!surveyToDelete || isVaultReadonly) return;
    const deletedTitle = surveyToDelete.title.trim() || 'Untitled Survey';
    const deletedId = surveyToDelete.id;
    const deletedSlug = surveyToDelete.publicSlug;

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
      setIsSurveyStudioOpen(false);
      await onDeleteSurvey(deletedId, deletedSlug, []);
      setStatusBanner(
        `🗑️ Deleted "${deletedTitle}". You now have 0 surveys — click "+ Create New Survey" whenever you're ready to start one.`
      );
      return;
    }

    const nextActive =
      activeSurvey?.id === deletedId
        ? remaining[0]
        : activeSurvey || remaining[0];
    surveysRef.current = remaining;
    activeSurveyRef.current = nextActive;
    setSurveys(remaining);
    setActiveSurveyId(nextActive.id);
    if (activeSurvey?.id === deletedId) {
      setIsSurveyStudioOpen(false);
    }
    await onDeleteSurvey(deletedId, deletedSlug, remaining);
    setStatusBanner(`🗑️ Deleted survey "${deletedTitle}".`);
  };

  const handleDeleteCurrentSurvey = async () => {
    await handleDeleteSurveyById(activeSurvey);
  };

  const handleToggleSurveyActiveById = async (
    targetSurvey: SavedValidationSurvey
  ) => {
    if (isVaultReadonly) return;
    const updated: SavedValidationSurvey = {
      ...targetSurvey,
      isActive: !targetSurvey.isActive,
      updatedAt: new Date().toISOString(),
    };
    const nextSurveys = surveysRef.current.map((s) =>
      s.id === targetSurvey.id ? updated : s
    );
    surveysRef.current = nextSurveys;
    if (activeSurveyRef.current?.id === targetSurvey.id) {
      activeSurveyRef.current = updated;
    }
    setSurveys(nextSurveys);
    await onSaveSurvey(updated, nextSurveys);
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
      interviewLogs: interviewLogsRef.current,
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

  // 9. RUN AI INSIGHTS SYNTHESIS ON CURRENT RESPONSES + 1-ON-1 INTERVIEWS
  const handleRunAiAnalysis = async () => {
    if (
      !activeSurvey ||
      (activeSurvey.responses.length === 0 &&
        interviewLogsRef.current.length === 0)
    ) {
      return;
    }
    setIsAnalyzingInsights(true);
    setActiveInsightsSubTab('SUMMARY');
    try {
      const insights = await onAnalyzeResultsWithAi({
        surveyTitle: activeSurvey.title || plan.title,
        questions: activeSurvey.questions,
        responses: activeSurvey.responses,
        interviewLogs: interviewLogsRef.current,
      });
      if (insights) {
        await updateActiveSurvey(
          (curr) => ({
            ...curr,
            aiInsightsSummary: insights,
          }),
          '✨ AI Signal vs. Polite Noise analysis updated (synthesizing surveys + 1-on-1 interviews)!'
        );
      }
    } finally {
      setIsAnalyzingInsights(false);
    }
  };

  // 10. 1-ON-1 CUSTOMER INTERVIEW LOGGER HANDLERS
  const persistInterviewLogs = async (
    nextLogs: SavedCustomerInterviewLog[],
    statusMsg?: string
  ) => {
    interviewLogsRef.current = nextLogs;
    setInterviewLogs(nextLogs);

    if (onSaveInterviewLogs) {
      await onSaveInterviewLogs(nextLogs);
    }

    if (activeSurveyRef.current) {
      await updateActiveSurvey((curr) => ({
        ...curr,
        interviewLogs: nextLogs,
      }));
    }

    if (statusMsg) {
      setStatusBanner(statusMsg);
    }
  };

  const resetInterviewForm = () => {
    setEditingInterviewId(null);
    setIntervieweeNameOrRole('');
    setIntervieweeEmail('');
    setInterviewDate(new Date().toISOString().slice(0, 10));
    setInterviewChannel('ZOOM_VIDEO');
    setOtherInterviewChannelText('');
    setInterviewRawNotes('');
    setInterviewKeyTakeaway('');
    setInterviewVerbatimQuote('');
    setInterviewWorkaroundAndSpend('');
    setInterviewPainScore(4);
    setInterviewCommitment('SHARED_DEEP_WORKFLOW_PAIN');
    setOtherInterviewCommitmentText('');
    setInterviewSignalBadge('STRONG_SIGNAL');
    setInterviewMomTestCoachingNote('');
    setLinkedWaitlistResponseId(undefined);
  };

  const handleExtractInterviewWithAi = async () => {
    if (!interviewRawNotes.trim() || !onExtractMomTestInterviewWithAi) return;
    setIsExtractingInterviewAi(true);
    try {
      const extracted = await onExtractMomTestInterviewWithAi({
        intervieweeNameOrRole:
          intervieweeNameOrRole.trim() || 'Target Customer',
        channel: interviewChannel,
        otherChannelText: otherInterviewChannelText.trim() || undefined,
        rawNotes: interviewRawNotes.trim(),
      });
      if (extracted) {
        setInterviewKeyTakeaway(extracted.keyTakeaway);
        setInterviewVerbatimQuote(extracted.verbatimQuote);
        setInterviewWorkaroundAndSpend(extracted.workaroundAndSpend);
        setInterviewPainScore(extracted.painScore1To5);
        setInterviewCommitment(extracted.commitmentOutcome);
        if (extracted.otherCommitmentText) {
          setOtherInterviewCommitmentText(extracted.otherCommitmentText);
        }
        setInterviewSignalBadge(extracted.signalBadge);
        setInterviewMomTestCoachingNote(extracted.momTestCoachingNote);
        setStatusBanner(
          '✨ AI Mom-Test Extractor structured your call notes and graded the signal vs. polite noise!'
        );
      }
    } finally {
      setIsExtractingInterviewAi(false);
    }
  };

  const handleSaveInterviewLog = async () => {
    if (isVaultReadonly) return;
    const cleanName = intervieweeNameOrRole.trim() || 'Discovery Interviewee';
    const cleanRaw = interviewRawNotes.trim();
    const cleanTakeaway =
      interviewKeyTakeaway.trim() ||
      cleanRaw.split(/[.!?\n]/)[0]?.slice(0, 160) ||
      'Logged 1-on-1 discovery conversation.';

    const entry: SavedCustomerInterviewLog = {
      id:
        editingInterviewId ||
        `intv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      intervieweeNameOrRole: cleanName,
      intervieweeEmail: intervieweeEmail.trim() || undefined,
      date: interviewDate || new Date().toISOString().slice(0, 10),
      channel: interviewChannel,
      otherChannelText:
        interviewChannel === 'OTHER'
          ? otherInterviewChannelText.trim() || 'Custom Channel'
          : undefined,
      rawNotes: cleanRaw || cleanTakeaway,
      keyTakeaway: cleanTakeaway,
      verbatimQuote: interviewVerbatimQuote.trim() || cleanRaw.slice(0, 220),
      workaroundAndSpend:
        interviewWorkaroundAndSpend.trim() ||
        'Not specified yet — ask about current tools/spend on follow-up.',
      painScore1To5: interviewPainScore,
      commitmentOutcome: interviewCommitment,
      otherCommitmentText:
        interviewCommitment === 'OTHER'
          ? otherInterviewCommitmentText.trim() || 'Custom follow-up step'
          : undefined,
      signalBadge: interviewSignalBadge,
      momTestCoachingNote: interviewMomTestCoachingNote.trim() || undefined,
      linkedResponseId: linkedWaitlistResponseId,
      createdAt: new Date().toISOString(),
    };

    const existingList = interviewLogsRef.current;
    const nextLogs = editingInterviewId
      ? existingList.map((item) =>
          item.id === editingInterviewId ? entry : item
        )
      : [entry, ...existingList];

    await persistInterviewLogs(
      nextLogs,
      editingInterviewId
        ? `✅ Updated 1-on-1 interview log for ${cleanName}!`
        : `🎙️ Saved 1-on-1 customer interview log for ${cleanName}!`
    );
    resetInterviewForm();
    setIsInterviewModalOpen(false);
  };

  const handleEditInterviewLog = (log: SavedCustomerInterviewLog) => {
    setEditingInterviewId(log.id);
    setIntervieweeNameOrRole(log.intervieweeNameOrRole);
    setIntervieweeEmail(log.intervieweeEmail || '');
    setInterviewDate(log.date);
    setInterviewChannel(log.channel);
    setOtherInterviewChannelText(log.otherChannelText || '');
    setInterviewRawNotes(log.rawNotes);
    setInterviewKeyTakeaway(log.keyTakeaway);
    setInterviewVerbatimQuote(log.verbatimQuote || '');
    setInterviewWorkaroundAndSpend(log.workaroundAndSpend || '');
    setInterviewPainScore(log.painScore1To5);
    setInterviewCommitment(log.commitmentOutcome);
    setOtherInterviewCommitmentText(log.otherCommitmentText || '');
    setInterviewSignalBadge(log.signalBadge);
    setInterviewMomTestCoachingNote(log.momTestCoachingNote || '');
    setLinkedWaitlistResponseId(log.linkedResponseId);
    setIsInterviewModalOpen(true);
  };

  const handleDeleteInterviewLog = async (id: string) => {
    if (isVaultReadonly) return;
    const nextLogs = interviewLogsRef.current.filter((item) => item.id !== id);
    if (editingInterviewId === id) {
      resetInterviewForm();
    }
    await persistInterviewLogs(nextLogs, '🗑️ Deleted 1-on-1 interview log.');
  };

  const handleStartInterviewFromWaitlistLead = (lead: SavedSurveyResponse) => {
    resetInterviewForm();
    setIntervieweeNameOrRole(
      lead.respondentNameOrRole || 'Early-Bird Waitlist Lead'
    );
    setIntervieweeEmail(lead.respondentEmail || '');
    setLinkedWaitlistResponseId(lead.id);

    // Summarize their survey answers into the raw notes starter so the founder has context during the call
    const answerLines: string[] = [];
    for (const q of activeSurvey?.questions || []) {
      const ans = lead.answers[q.id];
      if (!ans) continue;
      if (ans.openText?.trim()) {
        answerLines.push(
          `• Survey Story (${q.questionText}): "${ans.openText.trim()}"`
        );
      } else if (typeof ans.scaleValue === 'number') {
        answerLines.push(
          `• Survey Scale (${q.questionText}): ${ans.scaleValue}/5`
        );
      } else if (ans.selectedOption) {
        const val =
          ans.selectedOption === 'OTHER'
            ? `Other: ${ans.otherText || ''}`
            : ans.selectedOption;
        answerLines.push(`• Survey Choice (${q.questionText}): ${val}`);
      } else if (ans.selectedOptions && ans.selectedOptions.length > 0) {
        answerLines.push(
          `• Survey Multi-Select (${q.questionText}): ${ans.selectedOptions.join(', ')}`
        );
      }
    }

    if (answerLines.length > 0) {
      setInterviewRawNotes(
        `[Context from Survey Submission]\n${answerLines.join('\n')}\n\n[Live 1-on-1 Call Notes]\n`
      );
    }

    setIsSurveyStudioOpen(false);
    setActiveModuleCSection('INTERVIEWS');
    setOpenStep((prev) => (prev === 'ALL' ? 'ALL' : 2));
    setIsInterviewModalOpen(true);
    setStatusBanner(
      `🎙️ Pre-filled 1-on-1 Interview Logger for ${
        lead.respondentNameOrRole || lead.respondentEmail || 'Waitlist Lead'
      } with their survey answers!`
    );
  };

  const handleSimulateSampleInterviews = async () => {
    if (isVaultReadonly) return;
    const firstCompName =
      plan.moduleBData?.competitorsAndStatusQuo?.competitors?.find((c) =>
        c.name?.trim()
      )?.name || 'their legacy tool';
    const shortProblemRef =
      (
        plan.conceptCanvas?.coreProblem ||
        plan.brainDumpText ||
        'this workflow bottleneck'
      )
        .trim()
        .slice(0, 70) || 'this workflow bottleneck';

    const now = Date.now();
    const simulatedInterviews: SavedCustomerInterviewLog[] = [
      {
        id: `sim-intv-${now}-1`,
        intervieweeNameOrRole: 'Aoife Kelly (Head of Operations)',
        intervieweeEmail: 'aoife.kelly@example.ie',
        date: new Date(now - 86400_000 * 2).toISOString().slice(0, 10),
        channel: 'ZOOM_VIDEO',
        rawNotes: `Spoke for 20 mins on Zoom. Last Thursday her team lost 4 hours reconciling ${shortProblemRef} across 3 spreadsheets and ${firstCompName}. She pays €190/month for ${firstCompName} plus ~6 hours/week of manual admin. Asked if she can pilot our V1 with 2 team members next month and offered to introduce us to another operations lead.`,
        keyTakeaway: `Loses 4–6 hours every week reconciling ${shortProblemRef} manually despite paying €190/mo for ${firstCompName}; ready to pilot V1 next month.`,
        verbatimQuote: `Last Thursday we spent four hours fixing a single batch by hand because ${firstCompName} doesn't catch handoff errors—if you automate just that step, I'll pay for a pilot tomorrow.`,
        workaroundAndSpend: `Pays €190/mo for ${firstCompName} + ~6 hrs/week of manual Google Sheets reconciliation.`,
        painScore1To5: 5,
        commitmentOutcome: 'ASKED_TO_PILOT_OR_BUY',
        signalBadge: 'STRONG_SIGNAL',
        momTestCoachingNote:
          'Textbook Mom-Test gold: anchored in last Thursday, quantified current spend (€190/mo + 6 hrs/wk), and secured a concrete pilot commitment.',
        isSimulated: true,
        createdAt: new Date(now - 86400_000 * 2).toISOString(),
      },
      {
        id: `sim-intv-${now}-2`,
        intervieweeNameOrRole: 'David Connolly (Founder / Director)',
        intervieweeEmail: 'david@example.co.uk',
        date: new Date(now - 86400_000).toISOString().slice(0, 10),
        channel: 'IN_PERSON_COFFEE',
        rawNotes: `Met for coffee. Walked through how they currently handle ${shortProblemRef} using WhatsApp groups and shared folders. Missed a key client deadline two weeks ago. Introduced us to two other founders in his network who complain about the exact same issue.`,
        keyTakeaway: `Relies on fragile WhatsApp + shared folder handoffs that caused a missed deadline two weeks ago; warm-introduced 2 peer founders.`,
        verbatimQuote: `Right now everything lives in three different WhatsApp threads—two weeks ago a client request slipped through the cracks and cost us the renewal.`,
        workaroundAndSpend: `WhatsApp threads + shared Google Drive folders + Friday afternoon manual audit.`,
        painScore1To5: 4,
        commitmentOutcome: 'INTRODUCED_PEERS',
        signalBadge: 'STRONG_SIGNAL',
        momTestCoachingNote:
          'Strong validation: reputation commitment (warm peer intros) + concrete story of a lost renewal two weeks ago.',
        isSimulated: true,
        createdAt: new Date(now - 86400_000).toISOString(),
      },
      {
        id: `sim-intv-${now}-3`,
        intervieweeNameOrRole: 'Rachel Byrne (Freelance Consultant)',
        date: new Date(now).toISOString().slice(0, 10),
        channel: 'PHONE_CALL',
        rawNotes: `10-min phone call. Said the idea sounds super cool and modern, and she'd "definitely check it out when it launches," but admitted she only deals with ${shortProblemRef} once a quarter and just uses a free template.`,
        keyTakeaway: `Polite compliments ("sounds super cool"), but only encounters the problem once a quarter and uses a free template—not our high-urgency beachhead.`,
        verbatimQuote: `Your app sounds really slick and I'd definitely take a look when you launch, though for me it only comes up once every few months.`,
        workaroundAndSpend: `Free template once a quarter (€0 spend).`,
        painScore1To5: 2,
        commitmentOutcome: 'POLITE_COMPLIMENTS_ONLY',
        signalBadge: 'POLITE_FLUFF',
        momTestCoachingNote:
          'Classic "Mom Test" polite fluff trap! Notice how she praised the idea ("sounds really slick") while having zero urgency or spend. Great filter—focus V1 on higher-frequency teams like Aoife and David instead.',
        isSimulated: true,
        createdAt: new Date(now).toISOString(),
      },
    ];

    const merged = [
      ...simulatedInterviews,
      ...interviewLogsRef.current.filter((i) => !i.isSimulated),
    ];
    await persistInterviewLogs(
      merged,
      '🧪 Simulated 3 realistic 1-on-1 customer interviews (2 Strong Signal + 1 Polite Fluff filter)!'
    );
  };

  const handleClearSimulatedInterviews = async () => {
    if (isVaultReadonly) return;
    const realOnly = interviewLogsRef.current.filter((i) => !i.isSimulated);
    await persistInterviewLogs(
      realOnly,
      'Cleared simulated 1-on-1 interviews.'
    );
  };

  const getPublicSurveyFullUrl = (slug?: string): string => {
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://startuppreflight.com';
    return `${origin}/v/${slug || activeSurvey?.publicSlug || 'survey'}`;
  };

  const handleCopyPublicLink = (slugOverride?: string) => {
    const targetSlug =
      typeof slugOverride === 'string' && slugOverride
        ? slugOverride
        : activeSurvey?.publicSlug;
    if (!targetSlug) return;
    const fullUrl = getPublicSurveyFullUrl(targetSlug);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(fullUrl);
    }
    setCopiedLinkSlug(targetSlug);
    setTimeout(() => setCopiedLinkSlug(null), 2500);
  };

  // Resolve outreach templates (saved or auto-generated from plan + survey context)
  const effectiveOutreachTemplates: SurveyOutreachTemplates | null =
    activeSurvey
      ? {
          ...buildDefaultOutreachTemplates(plan, activeSurvey),
          ...(activeSurvey.outreachTemplates || {}),
        }
      : null;

  const handleUpdateOutreachTemplates = (
    patch: Partial<SurveyOutreachTemplates>
  ) => {
    if (!activeSurvey || isVaultReadonly) return;
    const base =
      activeSurvey.outreachTemplates ||
      buildDefaultOutreachTemplates(plan, activeSurvey);
    const updatedTemplates: SurveyOutreachTemplates = {
      ...base,
      ...patch,
    };
    void updateActiveSurvey((curr) => ({
      ...curr,
      outreachTemplates: updatedTemplates,
    }));
  };

  const handleRegenerateOutreachTemplates = async () => {
    if (!activeSurvey || isVaultReadonly) return;
    const fresh = buildDefaultOutreachTemplates(plan, activeSurvey);
    await updateActiveSurvey(
      (curr) => ({
        ...curr,
        outreachTemplates: {
          ...fresh,
          customChannelName: curr.outreachTemplates?.customChannelName || '',
        },
      }),
      '✨ Refreshed all outreach templates & QR flyer copy using your latest survey and startup context!'
    );
  };

  const injectLiveLink = (rawTemplate: string): string => {
    const fullUrl = getPublicSurveyFullUrl(activeSurvey?.publicSlug);
    if (rawTemplate.includes('{{SURVEY_LINK}}')) {
      return rawTemplate.replace(/\{\{SURVEY_LINK\}\}/g, fullUrl);
    }
    return `${rawTemplate.trim()}\n\n${fullUrl}`;
  };

  const handleCopyOutreachMessage = (code: string, rawText: string) => {
    const finalMessage =
      code === 'IN_PERSON_PITCH' ? rawText : injectLiveLink(rawText);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(finalMessage);
    }
    setCopiedChannelCode(code);
    setTimeout(() => setCopiedChannelCode(null), 2500);
  };

  // Download High-Res PNG QR Code (1024x1024)
  const handleDownloadQrPng = () => {
    if (!activeSurvey || typeof document === 'undefined') return;
    const fullUrl = getPublicSurveyFullUrl(activeSurvey.publicSlug);
    const matrix = generateQrCodeMatrix(fullUrl);
    const n = matrix.length;
    const quiet = 4;
    const totalModules = n + quiet * 2;
    const canvasSize = 1024;
    const scale = canvasSize / totalModules;

    const canvas = document.createElement('canvas');
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    ctx.fillStyle = '#0f172a';
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (matrix[r][c]) {
          const x = Math.floor((c + quiet) * scale);
          const y = Math.floor((r + quiet) * scale);
          const w = Math.ceil(scale);
          const h = Math.ceil(scale);
          ctx.fillRect(x, y, w, h);
        }
      }
    }

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `qr-${activeSurvey.publicSlug}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setStatusBanner(
      `📥 Downloaded high-resolution QR code (qr-${activeSurvey.publicSlug}.png)!`
    );
  };

  // Download Vector SVG QR Code
  const handleDownloadQrSvg = () => {
    if (!activeSurvey || typeof document === 'undefined') return;
    const fullUrl = getPublicSurveyFullUrl(activeSurvey.publicSlug);
    const svgString = generateQrCodeSvgString(fullUrl, {
      sizePx: 1024,
      quietZoneModules: 4,
    });
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `qr-${activeSurvey.publicSlug}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
    setStatusBanner(
      `📥 Downloaded scalable vector QR code (qr-${activeSurvey.publicSlug}.svg)!`
    );
  };

  // Print 1-Page Event / Coffee-Shop Flyer with QR Code
  const handlePrintQrFlyer = () => {
    if (!activeSurvey || typeof window === 'undefined') return;
    const fullUrl = getPublicSurveyFullUrl(activeSurvey.publicSlug);
    const svgMarkup = generateQrCodeSvgString(fullUrl, {
      sizePx: 340,
      quietZoneModules: 3,
    });
    const headline =
      effectiveOutreachTemplates?.qrFlyerHeadline?.trim() ||
      activeSurvey.title.trim() ||
      'Got 60 Seconds? Share Your Honest Feedback';
    const subtext =
      effectiveOutreachTemplates?.qrFlyerSubtext?.trim() ||
      `Scan with your phone camera • ${Math.max(
        activeSurvey.questions.length,
        5
      )} quick questions • No login required`;
    const incentive = activeSurvey.collectLeadEmails
      ? activeSurvey.waitlistIncentiveText.trim()
      : '';

    const escapeHtml = (str: string) =>
      str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const printWin = window.open('', '_blank', 'width=850,height=1050');
    if (!printWin) {
      setStatusBanner(
        '⚠️ Pop-up blocked by browser. Allow pop-ups to print the QR flyer.'
      );
      return;
    }

    printWin.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(plan.title)} — Survey QR Flyer</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      padding: 36px;
      display: flex;
      justify-content: center;
    }
    .flyer {
      width: 100%;
      max-width: 680px;
      border: 3px solid #1e1b4b;
      border-radius: 28px;
      padding: 44px 40px;
      text-align: center;
    }
    .badge {
      display: inline-block;
      background: #eef2ff;
      color: #3730a3;
      border: 1px solid #c7d2fe;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 6px 16px;
      border-radius: 999px;
      margin-bottom: 18px;
    }
    h1 {
      font-size: 32px;
      line-height: 1.2;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 12px;
    }
    .subtext {
      font-size: 17px;
      line-height: 1.5;
      color: #475569;
      max-width: 520px;
      margin: 0 auto 28px auto;
    }
    .qr-box {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      background: #f8fafc;
      border: 2px dashed #6366f1;
      border-radius: 24px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .scan-cta {
      margin-top: 12px;
      font-size: 14px;
      font-weight: 700;
      color: #312e81;
    }
    .url-pill {
      display: inline-block;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 15px;
      font-weight: 700;
      color: #1e1b4b;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 10px 20px;
      border-radius: 12px;
      margin-bottom: 22px;
      word-break: break-all;
    }
    .incentive {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
      font-size: 14px;
      font-weight: 600;
      padding: 14px 20px;
      border-radius: 14px;
      max-width: 520px;
      margin: 0 auto 18px auto;
    }
    .footer {
      font-size: 12px;
      color: #64748b;
      margin-top: 10px;
    }
    @media print {
      body { padding: 0; }
      .flyer { border-width: 2px; }
    }
  </style>
</head>
<body>
  <div class="flyer">
    <div class="badge">${escapeHtml(plan.title)} • Customer Research</div>
    <h1>${escapeHtml(headline)}</h1>
    <p class="subtext">${escapeHtml(subtext)}</p>
    <div class="qr-box">
      ${svgMarkup}
      <div class="scan-cta">📱 Point Your Phone Camera Here to Open</div>
    </div>
    <div>
      <div class="url-pill">${escapeHtml(fullUrl)}</div>
    </div>
    ${
      incentive
        ? `<div class="incentive">🎁 ${escapeHtml(incentive)}</div>`
        : ''
    }
    <div class="footer">100% Anonymous Option • Zero Login Required • Takes Under 60 Seconds</div>
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 250);
    };
  </script>
</body>
</html>`);
    printWin.document.close();
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

  // =========================================================================
  // MODULE C BLIND-SPOT REVIEW & EXPORTABLE VALIDATION BRIEF (GATED)
  // =========================================================================
  const countryPack = getCountryRulePack(selectedCountry);
  const currency = countryPack.defaultCurrency;
  const [showBriefPreview, setShowBriefPreview] = useState<boolean>(true);
  const [briefCopied, setBriefCopied] = useState<boolean>(false);
  const [isSavingComplete, setIsSavingComplete] = useState<boolean>(false);

  const briefGeneratedDate = new Date().toLocaleDateString('en-IE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // Strict Gating: Do NOT run blind-spot checker or allow document creation
  // if there are no surveys (with questions) and no 1-on-1 interviews.
  const validSurveys = surveys.filter((s) => s.questions.length > 0);
  const hasValidationActivity = hasModuleCValidationData(
    surveys,
    interviewLogs
  );

  const allResponsesAcrossSurveys = validSurveys.flatMap(
    (s) => s.responses || []
  );
  const realResponsesAcrossSurveys = allResponsesAcrossSurveys.filter(
    (r) => !r.isSimulated
  );
  const waitlistAcrossSurveys = allResponsesAcrossSurveys.filter(
    (r) => r.joinedWaitlist && Boolean(r.respondentEmail?.trim())
  );

  const liveThingsToConsider: BlindSpotItem[] = hasValidationActivity
    ? buildDynamicModuleCBlindSpots({
        planTitle: plan.title,
        industryCategory: plan.industryCategory,
        hqCountryCode: selectedCountry,
        exportPotential: plan.exportPotential,
        conceptCanvas: plan.conceptCanvas,
        moduleBData: plan.moduleBData,
        surveys,
        activeSurvey,
        interviewLogs,
      })
    : [];

  const moduleCReadinessSteps = [
    {
      stepNumber: 1,
      label: 'Customer Validation Survey',
      isComplete: validSurveys.length > 0,
      summary:
        validSurveys.length > 0
          ? `${validSurveys.length} survey(s) • ${validSurveys.filter((s) => s.isPublished).length} published & locked`
          : 'Optional if running 1-on-1 calls — or create a Mom-Test survey above',
    },
    {
      stepNumber: 2,
      label: '1-on-1 Customer Discovery Interviews',
      isComplete: interviewLogs.length > 0,
      summary:
        interviewLogs.length > 0
          ? `${interviewLogs.length} 1-on-1 call(s) logged (Avg Pain ${(interviewLogs.reduce((acc, i) => acc + i.painScore1To5, 0) / interviewLogs.length).toFixed(1)}/5)`
          : 'Log at least 1–3 live customer interviews to capture verbatim quotes',
    },
    {
      stepNumber: 3,
      label: 'Responses & Early-Bird Waitlist Signal',
      isComplete:
        allResponsesAcrossSurveys.length > 0 || interviewLogs.length > 0,
      summary:
        allResponsesAcrossSurveys.length > 0 || interviewLogs.length > 0
          ? `${realResponsesAcrossSurveys.length} real survey response(s) • ${waitlistAcrossSurveys.length} waitlist lead(s) • ${interviewLogs.length} call(s)`
          : 'Share your survey link or log a 1-on-1 call to collect evidence',
    },
    {
      stepNumber: 4,
      label: 'Co-Founder Blind-Spot Review',
      isComplete: hasValidationActivity && liveThingsToConsider.length >= 6,
      summary: hasValidationActivity
        ? `${liveThingsToConsider.length} tailored validation blind-spot cards active`
        : 'Unlocks automatically once you create a survey or log a 1-on-1 interview',
    },
  ];

  const moduleCBriefData: ModuleCBriefData = {
    planTitle: plan.title,
    founderName,
    industryCategory: plan.industryCategory,
    hqCountryCode: selectedCountry,
    targetMarkets: plan.targetMarketsArray,
    conceptCanvas: plan.conceptCanvas,
    moduleBData: plan.moduleBData,
    surveys,
    activeSurvey,
    interviewLogs,
    thingsToConsider: liveThingsToConsider,
    whiteLabelEnabled,
  };

  const handleSaveModuleCComplete = async () => {
    if (isVaultReadonly || !hasValidationActivity) return;
    setIsSavingComplete(true);
    try {
      if (activeSurvey) {
        await onSaveSurvey(activeSurvey, surveys);
      }
      await onSaveInterviewLogs(interviewLogs, activeSurvey?.publicSlug);
      if (onSaveModuleCBlindSpots) {
        await onSaveModuleCBlindSpots(liveThingsToConsider);
      }
      setStatusBanner(
        '✅ All Module C Surveys, 1-on-1 Interviews & Blind-Spot Review saved!'
      );
    } finally {
      setIsSavingComplete(false);
    }
  };

  const handleCopyModuleCBrief = () => {
    if (!hasValidationActivity) return;
    const md = buildModuleCMarkdownBrief(moduleCBriefData);
    if (!md) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(md);
      setBriefCopied(true);
      setTimeout(() => setBriefCopied(false), 2500);
    }
  };

  const handleDownloadModuleCBriefHtml = () => {
    if (!hasValidationActivity) return;
    if (!isVaultReadonly) {
      handleSaveModuleCComplete().catch(() => {});
    }
    const htmlContent = buildModuleCStandaloneHtmlDocument(moduleCBriefData);
    if (!htmlContent) return;
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeSlug =
      plan.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'startup';
    link.href = url;
    link.download = `${safeSlug}-customer-validation-brief.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintModuleCBriefPdf = () => {
    if (!hasValidationActivity) return;
    if (!isVaultReadonly) {
      handleSaveModuleCComplete().catch(() => {});
    }
    const htmlContent = buildModuleCStandaloneHtmlDocument(moduleCBriefData);
    if (!htmlContent) return;
    const printWin = window.open('', '_blank', 'width=960,height=800');
    if (!printWin) return;
    printWin.document.open();
    printWin.document.write(htmlContent);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      printWin.print();
    }, 250);
  };

  const isStep1Complete = validSurveys.length > 0;
  const isStep2Complete = interviewLogs.length > 0;
  const isStep3Complete =
    hasValidationActivity && liveThingsToConsider.length >= 6;
  const completedCoreStepsCount =
    (isStep1Complete ? 1 : 0) +
    (isStep2Complete ? 1 : 0) +
    (isStep3Complete ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* =================================================================== */}
      {/* MODULE C TOP HEADER BANNER (GEMINI.md SECTION 6 STANDARD)           */}
      {/* =================================================================== */}
      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-950 via-indigo-900 to-violet-900 p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-indigo-400/40 bg-indigo-500/30 text-indigo-100">
                Module C • Customer Surveys, 1-on-1 Calls &amp; Validation Brief
              </Badge>
              <Badge className="border-emerald-400/30 bg-emerald-500/20 text-emerald-200">
                <ShieldCheck className="mr-1 h-3 w-3" />
                Zero-Login Shareable Survey Links
              </Badge>
              <Badge className="border-white/20 bg-white/10 text-xs text-indigo-100">
                {completedCoreStepsCount} of 3 Core Steps Ready
              </Badge>
            </div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              Module C: Customer Validation Surveys &amp; 1-on-1 Discovery Hub
            </h1>
            <p className="max-w-2xl text-xs text-indigo-100/90 sm:text-sm">
              Launch focused <em>Mom-Test</em> customer surveys in their own
              studio window for{' '}
              <strong className="text-white">{plan.title}</strong>, log live
              1-on-1 customer calls, and compile your validation brief.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setOpenStep((prev) =>
                  prev === 'ALL'
                    ? !isStep1Complete
                      ? 1
                      : !isStep2Complete
                        ? 2
                        : 1
                    : 'ALL'
                )
              }
              className="shrink-0 border-indigo-300/50 bg-indigo-800/50 text-xs text-white hover:bg-indigo-700/60"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-200" />
              {openStep === 'ALL' ? 'Focus Step-by-Step' : 'Expand All Steps'}
            </Button>
            {openStep !== 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpenStep(0)}
                className="shrink-0 border-indigo-300/50 bg-indigo-950/60 text-xs text-indigo-100 hover:bg-indigo-800/60"
              >
                <ChevronUp className="h-3.5 w-3.5 text-indigo-200" />
                Collapse All
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowWhyCard(!showWhyCard)}
              className="shrink-0 border-indigo-400/40 bg-white/10 text-xs text-white hover:bg-white/20"
            >
              <HelpCircle className="h-3.5 w-3.5 text-indigo-200" />
              {showWhyCard ? 'Hide Mom-Test Tips' : 'Why The Mom Test?'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowParkInput(!showParkInput)}
              className="shrink-0 border-amber-400/40 bg-amber-500/20 text-xs text-amber-100 hover:bg-amber-500/30"
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
              className="flex-1 border-indigo-700 bg-white text-base text-slate-900 sm:text-xs"
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

        {/* 4-Step Navigation Strip (Matches Module B & Module D 100%) */}
        <div className="mt-5 grid grid-cols-1 gap-2 border-t border-indigo-800/70 pt-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              step: 'Step 1',
              title: `Customer Surveys (${surveys.length})`,
              targetId: 'module-c-step-1',
              stepNum: 1,
              done: isStep1Complete,
            },
            {
              step: 'Step 2',
              title: `1-on-1 Interviews (${interviewLogs.length})`,
              targetId: 'module-c-step-2',
              stepNum: 2,
              done: isStep2Complete,
            },
            {
              step: 'Step 3',
              title: 'Blind-Spot Review',
              targetId: 'module-c-step-3',
              stepNum: 3,
              done: isStep3Complete,
            },
            {
              step: 'Overview',
              title: 'Validation Brief',
              targetId: 'module-c-step-4',
              stepNum: 4,
              done: hasValidationActivity,
            },
          ].map((item, idx, arr) => {
            const firstIncompleteIdx = arr.findIndex((s) => !s.done);
            const isStepOpen =
              openStep === 'ALL'
                ? firstIncompleteIdx === -1
                  ? idx === arr.length - 1
                  : idx === firstIncompleteIdx
                : openStep === item.stepNum;
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => scrollToStep(item.stepNum)}
                className={`rounded-xl border px-3 py-2 text-left text-xs transition-all hover:border-white/50 hover:bg-white/15 ${
                  isStepOpen
                    ? 'border-amber-300/80 bg-white/20 text-white shadow-xs ring-1 ring-amber-300/50'
                    : item.done
                      ? 'border-emerald-400/40 bg-emerald-950/30 text-emerald-100'
                      : 'border-indigo-800/60 bg-indigo-950/40 text-indigo-300/70'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span>{item.step}</span>
                  {item.done ? (
                    <Check className="h-3.5 w-3.5 text-emerald-300" />
                  ) : isStepOpen ? (
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                  ) : null}
                </div>
                <div className="mt-0.5 truncate text-[11px]">{item.title}</div>
              </button>
            );
          })}
        </div>
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
      {/* STEP 1: CUSTOMER VALIDATION SURVEYS (OVERVIEW TILES GRID)           */}
      {/* =================================================================== */}
      {openStep !== 'ALL' && openStep !== 1 ? (
        <div
          id="module-c-step-1"
          onClick={() => setOpenStep(1)}
          className="group scroll-mt-24 cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  isStep1Complete
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 text-white'
                }`}
              >
                {isStep1Complete ? <Check className="h-4 w-4" /> : '1'}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-sm font-bold text-slate-900">
                    Step 1: Customer Validation Surveys
                  </h2>
                  {isStep1Complete ? (
                    <Badge variant="success" className="shrink-0 text-[10px]">
                      Completed
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      In Progress
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {surveys.length > 0
                    ? `${surveys.length} survey(s) • ${allResponsesAcrossSurveys.length} total response(s) • ${waitlistAcrossSurveys.length} waitlist lead(s)`
                    : 'Create bias-free Mom-Test surveys and share zero-login customer links'}
                </p>
              </div>
            </div>
            <div className="ml-3 flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 text-xs font-semibold text-indigo-600 group-hover:bg-indigo-50"
              >
                Edit Step
                <ChevronDown className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          id="module-c-step-1"
          className="scroll-mt-24 space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-xs"
        >
          {/* Step 1 Expanded Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <span
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  isStep1Complete
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 text-white'
                }`}
              >
                {isStep1Complete ? <Check className="h-4 w-4" /> : '1'}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">
                    Step 1: Customer Validation Surveys
                  </h2>
                  {isStep1Complete ? (
                    <Badge variant="success" className="shrink-0 text-[10px]">
                      Completed
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      In Progress
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Each survey below is shown as a clean overview tile. Click{' '}
                  <strong>&ldquo;Open Survey Studio&rdquo;</strong> on any tile
                  to build questions, grab your QR code &amp; outreach links, or
                  analyze responses in a dedicated window.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                disabled={isVaultReadonly}
                onClick={() => void handleCreateNewBlankSurvey(true)}
                className="shrink-0 bg-gradient-to-r from-indigo-600 to-violet-600 text-xs text-white hover:from-indigo-700 hover:to-violet-700"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Build New Survey with AI
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isVaultReadonly}
                onClick={() => void handleCreateNewBlankSurvey(false)}
                className="shrink-0 border-indigo-200 bg-indigo-50/70 text-xs font-semibold text-indigo-800 hover:bg-indigo-100"
              >
                <Plus className="h-3.5 w-3.5 text-indigo-600" />
                New Blank Survey
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenStep(0);
                }}
                className="shrink-0 text-xs text-slate-500 hover:text-slate-800"
              >
                Collapse Step
                <ChevronUp className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Survey Overview Tiles Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {surveys.map((s, idx) => {
              const sResponses = s.responses?.length || 0;
              const sRealResponses = (s.responses || []).filter(
                (r) => !r.isSimulated
              ).length;
              const sWaitlist = (s.responses || []).filter(
                (r) =>
                  r.joinedWaitlist ||
                  Boolean(r.respondentEmail && r.respondentEmail.includes('@'))
              ).length;
              const sSignalScore =
                s.aiInsightsSummary?.signalScoreOutOf100 ?? null;

              return (
                <div
                  key={s.id}
                  onClick={() => openSurveyInStudio(s, 'BUILDER')}
                  className="group relative flex cursor-pointer flex-col justify-between rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-indigo-50/25 p-5 shadow-2xs transition-all hover:border-indigo-400 hover:shadow-md"
                >
                  <div className="space-y-3">
                    {/* Top Row: Badges + Active Toggle + Delete */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge className="bg-indigo-100 text-[10px] font-bold text-indigo-900">
                          Survey #{idx + 1}
                        </Badge>
                        {s.isPublished ? (
                          <Badge className="border-emerald-300 bg-emerald-100 text-[10px] font-bold text-emerald-900">
                            <Lock className="mr-1 h-2.5 w-2.5 text-emerald-700" />
                            Published &amp; Locked
                          </Badge>
                        ) : (
                          <Badge className="border-amber-300 bg-amber-100 text-[10px] font-bold text-amber-900">
                            Draft (Editable)
                          </Badge>
                        )}
                        <button
                          type="button"
                          disabled={isVaultReadonly}
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleToggleSurveyActiveById(s);
                          }}
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition-all ${
                            s.isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          {s.isActive ? '● Accepting Responses' : '○ Paused'}
                        </button>
                      </div>

                      <button
                        type="button"
                        disabled={isVaultReadonly}
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleDeleteSurveyById(s);
                        }}
                        title="Delete survey"
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Title & Subtitle */}
                    <div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-700">
                        {s.title.trim() || `Survey #${idx + 1} (Untitled Draft)`}
                      </h3>
                      <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">
                        {s.introDescription?.trim() ||
                          (s.questions.length > 0
                            ? `${s.questions.length} Mom-Test validation question(s) ready to share.`
                            : 'Blank survey draft — open Survey Studio to add questions manually or with AI.')}
                      </p>
                    </div>

                    {/* Shareable Public Link Strip */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center justify-between gap-2 rounded-xl border border-slate-200/90 bg-slate-50/90 px-3 py-1.5 text-xs"
                    >
                      <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-indigo-700">
                        <Share2 className="h-3 w-3 shrink-0 text-slate-400" />
                        <span className="truncate font-semibold">
                          Survey Link: {s.publicSlug}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleCopyPublicLink(s.publicSlug)}
                          className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-indigo-50 hover:text-indigo-700"
                        >
                          {copiedLinkSlug === s.publicSlug ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-600" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3 text-slate-500" />
                              Copy Link
                            </>
                          )}
                        </button>
                        <Link
                          href={`/v/${s.publicSlug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[11px] font-semibold text-indigo-700 ring-1 ring-slate-200 hover:bg-indigo-50"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Open Page
                        </Link>
                      </div>
                    </div>

                    {/* 4 Mini Metrics Strip */}
                    <div className="grid grid-cols-3 gap-2 pt-1 sm:grid-cols-4">
                      <div className="rounded-xl border border-slate-200/80 bg-white px-2.5 py-2 text-center">
                        <div className="text-sm font-extrabold text-slate-900">
                          {s.questions.length}
                        </div>
                        <div className="text-[10px] font-medium text-slate-500">
                          Questions
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200/80 bg-white px-2.5 py-2 text-center">
                        <div className="text-sm font-extrabold text-indigo-700">
                          {sResponses}
                        </div>
                        <div className="text-[10px] font-medium text-slate-500">
                          {sRealResponses > 0
                            ? `${sRealResponses} Real Resp`
                            : 'Responses'}
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200/80 bg-white px-2.5 py-2 text-center">
                        <div className="text-sm font-extrabold text-emerald-700">
                          {sWaitlist}
                        </div>
                        <div className="text-[10px] font-medium text-slate-500">
                          Waitlist Leads
                        </div>
                      </div>
                      <div className="hidden rounded-xl border border-slate-200/80 bg-white px-2.5 py-2 text-center sm:block">
                        <div className="text-sm font-extrabold text-violet-700">
                          {sSignalScore !== null ? `${sSignalScore}/100` : '—'}
                        </div>
                        <div className="text-[10px] font-medium text-slate-500">
                          AI Signal
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tile Footer Action Buttons */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3.5"
                  >
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => openSurveyInStudio(s, 'BUILDER')}
                      className="bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700"
                    >
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                      Open Survey Studio
                    </Button>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openSurveyInStudio(s, 'OUTREACH')}
                        className="h-8 border-violet-200 bg-violet-50/70 px-2.5 text-xs font-semibold text-violet-800 hover:bg-violet-100"
                      >
                        <QrCode className="h-3.5 w-3.5 text-violet-700" />
                        Share &amp; QR
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openSurveyInStudio(s, 'INSIGHTS')}
                        className="h-8 border-emerald-200 bg-emerald-50/70 px-2.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100"
                      >
                        <BarChart3 className="h-3.5 w-3.5 text-emerald-700" />
                        Results ({sResponses})
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* + Create New Survey Overview Tile */}
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/30 p-6 text-center transition-all hover:border-indigo-400 hover:bg-indigo-50/60">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
                <Plus className="h-5 w-5" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-900">
                Create a New Customer Survey
              </h3>
              <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-600">
                Each survey opens in its own focused window where you can build
                questions, print a QR flyer, and analyze responses.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={isVaultReadonly}
                  onClick={() => void handleCreateNewBlankSurvey(true)}
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 text-xs text-white hover:from-indigo-700 hover:to-violet-700"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Build with AI Co-Pilot
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isVaultReadonly}
                  onClick={() => void handleCreateNewBlankSurvey(false)}
                  className="bg-white text-xs font-semibold text-indigo-800 hover:bg-indigo-50"
                >
                  <Plus className="h-3.5 w-3.5 text-indigo-600" />
                  Start Blank Survey
                </Button>
              </div>
            </div>
          </div>

          {/* Step 1 Bottom Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <div className="text-xs text-slate-500">
              💡 Tip: Click any survey tile above to open its full Survey Studio
              window.
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => scrollToStep(2)}
                className="bg-indigo-600 text-xs text-white hover:bg-indigo-700"
              >
                Next Step: 1-on-1 Interviews
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* FOCUSED SURVEY STUDIO MODAL WINDOW (SURVEYMONKEY / TYPEFORM STYLE)  */}
      {/* =================================================================== */}
      {isSurveyStudioOpen && activeSurvey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-2 backdrop-blur-xs sm:p-4 lg:p-6">
          <div className="relative flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-indigo-200 bg-slate-50 shadow-2xl">
            {/* STUDIO STICKY TOP HEADER BAR */}
            <div className="border-b border-slate-200 bg-white px-4 py-3.5 shadow-2xs sm:px-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Left: Back to Tiles + Survey Switcher + Slug & Status */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSurveyStudioOpen(false)}
                    className="border-slate-300 bg-slate-50 text-xs font-bold text-slate-800 hover:bg-slate-100"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Survey Tiles
                  </Button>

                  {surveys.length > 1 && (
                    <select
                      value={activeSurvey.id}
                      onChange={(e) => {
                        const found = surveys.find(
                          (s) => s.id === e.target.value
                        );
                        if (found) {
                          activeSurveyRef.current = found;
                          setActiveSurveyId(found.id);
                          setShowAiFocusSelector(false);
                          setShowPublishConfirm(false);
                        }
                      }}
                      className="rounded-lg border border-indigo-200 bg-indigo-50/70 px-2.5 py-1.5 text-base font-bold text-indigo-950 focus:outline-hidden sm:text-xs"
                    >
                      {surveys.map((s, idx) => (
                        <option key={s.id} value={s.id}>
                          Survey #{idx + 1}:{' '}
                          {s.title.trim() || 'Untitled Survey'}
                        </option>
                      ))}
                    </select>
                  )}

                  <div className="flex items-center rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs text-slate-700">
                    <span className="mr-1.5 font-semibold text-slate-500">
                      Link Name:
                    </span>
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
                      className="w-36 bg-transparent font-mono text-base font-semibold text-indigo-700 focus:outline-hidden disabled:cursor-not-allowed disabled:text-slate-500 sm:w-48 sm:text-xs"
                    />
                  </div>

                  {isSurveyPublished ? (
                    <Badge className="border-emerald-300 bg-emerald-100 text-[11px] font-bold text-emerald-900">
                      <Lock className="mr-1 h-3 w-3 text-emerald-700" />
                      Published &amp; Locked
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

                {/* Right: Publish & Lock + Copy Link + Preview + Close */}
                <div className="flex flex-wrap items-center gap-2">
                  {!isSurveyPublished && (
                    <Button
                      type="button"
                      size="sm"
                      disabled={
                        isVaultReadonly || activeSurvey.questions.length === 0
                      }
                      onClick={() => setShowPublishConfirm(true)}
                      className="bg-emerald-600 text-xs text-white shadow-2xs hover:bg-emerald-700"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      Publish &amp; Lock Survey
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyPublicLink()}
                    className="text-xs"
                  >
                    {copiedLinkSlug === activeSurvey.publicSlug ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        Copied Link!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-slate-600" />
                        Copy Link
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
                      className="border-indigo-200 bg-indigo-50/70 text-xs text-indigo-700 hover:bg-indigo-100"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {isSurveyPublished ? 'Open Live Survey' : 'Preview Survey'}
                    </Button>
                  </Link>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setIsSurveyStudioOpen(false)}
                    className="bg-slate-900 text-xs font-bold text-white hover:bg-slate-800"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Done
                  </Button>
                </div>
              </div>

              {/* INLINE PUBLISH & LOCK CONFIRMATION PROMPT */}
              {showPublishConfirm && !isSurveyPublished && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-emerald-400 bg-emerald-50/95 p-3.5 text-xs text-emerald-950">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                      <Lock className="h-4 w-4 text-emerald-700" />
                      <span>Publish &amp; Permanently Lock This Survey?</span>
                    </div>
                    <p className="max-w-2xl text-[11px] leading-relaxed text-emerald-800">
                      Once published, your{' '}
                      <strong>
                        {activeSurvey.questions.length} question
                        {activeSurvey.questions.length === 1 ? '' : 's'} and
                        answer choices cannot be edited
                      </strong>
                      . This guarantees that nobody can alter questions
                      afterwards to make results look more favorable—keeping
                      your data 100% credible for co-founders, grants, and
                      investors.
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

              {/* 3-STEP PIPELINE NAVIGATION BAR INSIDE SURVEY STUDIO */}
              <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
                  <button
                    type="button"
                    onClick={() => setActiveViewTab('BUILDER')}
                    className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all sm:justify-start ${
                      activeViewTab === 'BUILDER'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                    }`}
                  >
                    {isSurveyPublished ? (
                      <Lock className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <span>
                      1. Build Questions ({activeSurvey.questions.length}
                      {isSurveyPublished ? ' • Locked' : ''})
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveViewTab('OUTREACH')}
                    className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all sm:justify-start ${
                      activeViewTab === 'OUTREACH'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                    }`}
                  >
                    <QrCode className="h-3.5 w-3.5 shrink-0" />
                    <span>2. Share &amp; QR Kit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveViewTab('INSIGHTS');
                      void handleSyncLiveResponses(true);
                    }}
                    className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all sm:justify-start ${
                      activeViewTab === 'INSIGHTS'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                    }`}
                  >
                    <BarChart3 className="h-3.5 w-3.5 shrink-0" />
                    <span>3. Results &amp; AI Insights</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] ${
                        activeViewTab === 'INSIGHTS'
                          ? 'bg-indigo-800 text-indigo-100'
                          : 'bg-white text-indigo-700'
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
                      onClick={() =>
                        setShowAiFocusSelector(!showAiFocusSelector)
                      }
                      className="bg-gradient-to-r from-indigo-600 to-violet-600 text-xs text-white hover:from-indigo-700 hover:to-violet-700"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {showAiFocusSelector
                        ? 'Close AI Focus Selector'
                        : 'Build Questions with AI'}
                    </Button>
                  )}

                  {activeViewTab === 'BUILDER' && isSurveyPublished && (
                    <Badge className="border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-900">
                      <Lock className="mr-1.5 h-3.5 w-3.5 text-emerald-700" />
                      Questions Locked for Result Integrity
                    </Badge>
                  )}

                  {activeViewTab === 'OUTREACH' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isVaultReadonly}
                      onClick={handleRegenerateOutreachTemplates}
                      className="text-xs"
                    >
                      <Wand2 className="h-3.5 w-3.5 text-indigo-600" />
                      Refresh Copy from Idea Context
                    </Button>
                  )}

                  {activeViewTab === 'INSIGHTS' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isSyncingResponses}
                      onClick={() => handleSyncLiveResponses(false)}
                      className="text-xs"
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
            </div>

            {/* STUDIO SCROLLABLE BODY */}
            <div className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
              {/* =========================================================== */}
              {/* TAB 1: ULTRA-SIMPLE SURVEY BUILDER                          */}
              {/* =========================================================== */}
              {activeViewTab === 'BUILDER' && (
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
                onClick={() => handleCreateNewBlankSurvey()}
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
                  Short Welcome Note (Shown at the top of your public survey page)
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
                  more favorable. Once locked, share your public survey link
                  with confidence.
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
      {/* TAB 2: OUTREACH DISTRIBUTION KIT + PRINTABLE QR CODE                */}
      {/* =================================================================== */}
      {activeViewTab === 'OUTREACH' && effectiveOutreachTemplates && (
          <div className="space-y-6">
            {/* Top Guidance Banner */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 via-white to-violet-50 p-4 shadow-2xs">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">
                    Outreach Distribution Kit &amp; Printable QR Code Studio
                  </span>
                  <Badge className="bg-indigo-100 text-[10px] font-bold text-indigo-800">
                    Tailored to {plan.title}
                  </Badge>
                </div>
                <p className="max-w-2xl text-xs text-slate-600">
                  Zero-pitch, <em>Mom Test</em>-friendly outreach messages with
                  your live shareable survey link automatically injected, plus a
                  downloadable &amp; printable QR code flyer for in-person
                  discovery.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyPublicLink()}
                  className="bg-white text-xs"
                >
                  {copiedLinkSlug === activeSurvey.publicSlug ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      Copied Survey URL!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-slate-600" />
                      Copy Direct URL
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handlePrintQrFlyer}
                  className="bg-indigo-600 text-xs text-white hover:bg-indigo-700"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print 1-Page QR Flyer
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* ============================================================= */}
              {/* LEFT COLUMN (7 COLS): READY-TO-SEND OUTREACH TEMPLATES        */}
              {/* ============================================================= */}
              <div className="space-y-4 lg:col-span-7">
                <Card className="border-slate-200 shadow-2xs">
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                          <Send className="h-4 w-4 text-indigo-600" />
                          1. Ready-to-Send Outreach Messages
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-600">
                          Select a channel below, customize the wording if you
                          like, and click <strong>Copy Message</strong> (your
                          live survey link is inserted automatically).
                        </CardDescription>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isVaultReadonly}
                        onClick={handleRegenerateOutreachTemplates}
                        className="text-xs"
                      >
                        <RefreshCw className="h-3.5 w-3.5 text-indigo-600" />
                        Reset to Smart Defaults
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Channel Selector Tiles (Includes OTHER per GEMINI.md Rule 1.5) */}
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {OUTREACH_CHANNEL_OPTIONS.map((ch) => {
                        const isSelected = selectedOutreachChannel === ch.code;
                        return (
                          <button
                            key={ch.code}
                            type="button"
                            onClick={() => setSelectedOutreachChannel(ch.code)}
                            className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-600/20'
                                : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/60'
                            }`}
                          >
                            <div className="flex w-full items-center justify-between gap-2">
                              <span className="text-xs font-bold text-slate-900">
                                {ch.label}
                              </span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  isSelected
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {ch.bestFor}
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] text-slate-600">
                              {ch.subtitle}
                            </p>
                          </button>
                        );
                      })}
                    </div>

                    {/* Active Channel Template Editor + 1-Click Copy */}
                    {(() => {
                      const activeMeta =
                        OUTREACH_CHANNEL_OPTIONS.find(
                          (c) => c.code === selectedOutreachChannel
                        ) || OUTREACH_CHANNEL_OPTIONS[0];

                      let currentRawText = '';
                      if (selectedOutreachChannel === 'LINKEDIN_DM') {
                        currentRawText = effectiveOutreachTemplates.linkedinDm;
                      } else if (selectedOutreachChannel === 'COMMUNITY_POST') {
                        currentRawText =
                          effectiveOutreachTemplates.communityPost;
                      } else if (selectedOutreachChannel === 'WHATSAPP_SMS') {
                        currentRawText =
                          effectiveOutreachTemplates.whatsappBlurb;
                      } else if (selectedOutreachChannel === 'COLD_EMAIL') {
                        currentRawText =
                          effectiveOutreachTemplates.coldEmailBody || '';
                      } else if (
                        selectedOutreachChannel === 'IN_PERSON_PITCH'
                      ) {
                        currentRawText =
                          effectiveOutreachTemplates.inPersonPitch || '';
                      } else {
                        currentRawText =
                          effectiveOutreachTemplates.customChannelMessage || '';
                      }

                      const resolvedPreview =
                        selectedOutreachChannel === 'IN_PERSON_PITCH'
                          ? currentRawText
                          : injectLiveLink(currentRawText);

                      return (
                        <div className="space-y-3 rounded-2xl border border-indigo-200 bg-slate-50/70 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <div className="text-xs font-bold text-indigo-950 sm:text-sm">
                                {activeMeta.label}
                              </div>
                              <div className="text-[11px] text-slate-600">
                                Use{' '}
                                <code className="rounded bg-white px-1 py-0.5 font-mono text-[10px] text-indigo-700">
                                  {'{{SURVEY_LINK}}'}
                                </code>{' '}
                                anywhere in your message to auto-insert your
                                live link.
                              </div>
                            </div>

                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                const textToCopy =
                                  selectedOutreachChannel === 'COLD_EMAIL' &&
                                  effectiveOutreachTemplates.coldEmailSubject
                                    ? `Subject: ${
                                        effectiveOutreachTemplates.coldEmailSubject
                                      }\n\n${injectLiveLink(currentRawText)}`
                                    : currentRawText;
                                handleCopyOutreachMessage(
                                  selectedOutreachChannel,
                                  textToCopy
                                );
                              }}
                              className="bg-indigo-600 text-xs text-white hover:bg-indigo-700"
                            >
                              {copiedChannelCode === selectedOutreachChannel ? (
                                <>
                                  <Check className="h-3.5 w-3.5 text-emerald-300" />
                                  Copied with Live Survey Link!
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5" />
                                  Copy Ready-to-Send Message
                                </>
                              )}
                            </Button>
                          </div>

                          {/* Inline custom channel name when OTHER is selected (GEMINI.md Rule 1.5) */}
                          {selectedOutreachChannel === 'OTHER' && (
                            <div>
                              <label className="mb-1 block text-xs font-semibold text-slate-700">
                                Custom Outreach Channel Name:
                              </label>
                              <Input
                                disabled={isVaultReadonly}
                                value={
                                  effectiveOutreachTemplates.customChannelName ||
                                  ''
                                }
                                onChange={(e) =>
                                  handleUpdateOutreachTemplates({
                                    customChannelName: e.target.value,
                                  })
                                }
                                placeholder="e.g., Substack Newsletter, IndieHackers Forum, Local Meetup Group..."
                                className="bg-white text-xs"
                              />
                            </div>
                          )}

                          {/* Email Subject line when COLD_EMAIL is selected */}
                          {selectedOutreachChannel === 'COLD_EMAIL' && (
                            <div>
                              <label className="mb-1 block text-xs font-semibold text-slate-700">
                                Email Subject Line:
                              </label>
                              <Input
                                disabled={isVaultReadonly}
                                value={
                                  effectiveOutreachTemplates.coldEmailSubject ||
                                  ''
                                }
                                onChange={(e) =>
                                  handleUpdateOutreachTemplates({
                                    coldEmailSubject: e.target.value,
                                  })
                                }
                                placeholder="Quick 60-sec question..."
                                className="bg-white text-xs font-medium"
                              />
                            </div>
                          )}

                          {/* Editable Message Template */}
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-700">
                              Editable Message Template:
                            </label>
                            <textarea
                              rows={6}
                              disabled={isVaultReadonly}
                              value={currentRawText}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (selectedOutreachChannel === 'LINKEDIN_DM') {
                                  handleUpdateOutreachTemplates({
                                    linkedinDm: val,
                                  });
                                } else if (
                                  selectedOutreachChannel === 'COMMUNITY_POST'
                                ) {
                                  handleUpdateOutreachTemplates({
                                    communityPost: val,
                                  });
                                } else if (
                                  selectedOutreachChannel === 'WHATSAPP_SMS'
                                ) {
                                  handleUpdateOutreachTemplates({
                                    whatsappBlurb: val,
                                  });
                                } else if (
                                  selectedOutreachChannel === 'COLD_EMAIL'
                                ) {
                                  handleUpdateOutreachTemplates({
                                    coldEmailBody: val,
                                  });
                                } else if (
                                  selectedOutreachChannel === 'IN_PERSON_PITCH'
                                ) {
                                  handleUpdateOutreachTemplates({
                                    inPersonPitch: val,
                                  });
                                } else {
                                  handleUpdateOutreachTemplates({
                                    customChannelMessage: val,
                                  });
                                }
                              }}
                              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs leading-relaxed text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                            />
                          </div>

                          {/* Live Preview Box showing injected URL */}
                          <div className="rounded-xl border border-indigo-200/80 bg-white p-3">
                            <div className="mb-1 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                              <span>
                                Live Preview (What Your Recipient Sees)
                              </span>
                              <span className="font-mono text-[10px] font-normal text-slate-500">
                                Link included ✓
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-800">
                              {resolvedPreview}
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>

              {/* ============================================================= */}
              {/* RIGHT COLUMN (5 COLS): PRINTABLE QR CODE & FLYER STUDIO       */}
              {/* ============================================================= */}
              <div className="space-y-4 lg:col-span-5">
                <Card className="border-indigo-200 shadow-2xs">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                          <QrCode className="h-4 w-4 text-indigo-600" />
                          2. Printable QR Code &amp; Event Flyer
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-600">
                          Scan with any phone camera to open your public survey
                          page with zero login.
                        </CardDescription>
                      </div>
                      <Badge className="bg-emerald-100 text-[10px] font-bold text-emerald-900">
                        <Smartphone className="mr-1 h-3 w-3" />
                        Instant Scan
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Live Printable Flyer Preview Card */}
                    <div className="flex flex-col items-center rounded-2xl border-2 border-indigo-950 bg-gradient-to-b from-white via-slate-50/50 to-indigo-50/40 p-5 text-center shadow-xs">
                      <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-800">
                        {plan.title} • Customer Research
                      </span>

                      <h3 className="mt-2.5 text-base font-extrabold leading-snug text-slate-900 sm:text-lg">
                        {effectiveOutreachTemplates.qrFlyerHeadline ||
                          activeSurvey.title.trim() ||
                          'Got 60 Seconds? Share Your Honest Experience'}
                      </h3>

                      <p className="mt-1 max-w-xs text-xs text-slate-600">
                        {effectiveOutreachTemplates.qrFlyerSubtext ||
                          `Scan with your phone camera • ${Math.max(
                            activeSurvey.questions.length,
                            5
                          )} quick questions • No login required`}
                      </p>

                      {/* Crisp Vector SVG QR Code */}
                      <div className="my-4 flex flex-col items-center rounded-2xl border-2 border-dashed border-indigo-300 bg-white p-4 shadow-2xs">
                        {(() => {
                          const fullUrl = getPublicSurveyFullUrl(
                            activeSurvey.publicSlug
                          );
                          const matrix = generateQrCodeMatrix(fullUrl);
                          const n = matrix.length;
                          const quiet = 3;
                          const totalModules = n + quiet * 2;
                          return (
                            <svg
                              viewBox={`0 0 ${totalModules} ${totalModules}`}
                              className="h-48 w-48 sm:h-52 sm:w-52"
                              shapeRendering="crispEdges"
                              role="img"
                              aria-label={`QR Code for ${fullUrl}`}
                            >
                              <rect
                                width={totalModules}
                                height={totalModules}
                                fill="#ffffff"
                              />
                              {matrix.map((row, rIdx) =>
                                row.map((isDark, cIdx) =>
                                  isDark ? (
                                    <rect
                                      key={`${rIdx}-${cIdx}`}
                                      x={cIdx + quiet}
                                      y={rIdx + quiet}
                                      width={1.03}
                                      height={1.03}
                                      fill="#0f172a"
                                    />
                                  ) : null
                                )
                              )}
                            </svg>
                          );
                        })()}
                        <span className="mt-2 text-[11px] font-bold text-indigo-900">
                          📱 Point Phone Camera to Open Survey
                        </span>
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-white px-3 py-1 font-mono text-[11px] font-semibold text-indigo-900">
                        {getPublicSurveyFullUrl(activeSurvey.publicSlug)}
                      </div>

                      {activeSurvey.collectLeadEmails &&
                        activeSurvey.waitlistIncentiveText.trim() && (
                          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/90 px-3 py-2 text-[11px] font-medium text-emerald-900">
                            🎁 {activeSurvey.waitlistIncentiveText}
                          </div>
                        )}
                    </div>

                    {/* Customize Flyer Headline & Subtext */}
                    <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                      <div className="text-xs font-bold text-slate-800">
                        Customize Printable QR Poster Text:
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                          Poster Headline:
                        </label>
                        <Input
                          disabled={isVaultReadonly}
                          value={
                            effectiveOutreachTemplates.qrFlyerHeadline || ''
                          }
                          onChange={(e) =>
                            handleUpdateOutreachTemplates({
                              qrFlyerHeadline: e.target.value,
                            })
                          }
                          placeholder="Got 60 Seconds? Share Your Honest Experience"
                          className="bg-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                          Poster Subtext / Call-to-Action:
                        </label>
                        <Input
                          disabled={isVaultReadonly}
                          value={
                            effectiveOutreachTemplates.qrFlyerSubtext || ''
                          }
                          onChange={(e) =>
                            handleUpdateOutreachTemplates({
                              qrFlyerSubtext: e.target.value,
                            })
                          }
                          placeholder="Scan with your phone camera • 5 quick questions • No login required"
                          className="bg-white text-xs"
                        />
                      </div>
                    </div>

                    {/* Download & Print Buttons */}
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadQrPng}
                        className="w-full text-xs font-semibold"
                      >
                        <Download className="h-3.5 w-3.5 text-indigo-600" />
                        Download PNG
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadQrSvg}
                        className="w-full text-xs font-semibold"
                      >
                        <Download className="h-3.5 w-3.5 text-violet-600" />
                        Download SVG
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        onClick={handlePrintQrFlyer}
                        className="w-full bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-700"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        Print Flyer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

      {/* =================================================================== */}
      {/* TAB 3: SURVEY RESULTS & AI "SIGNAL VS. NOISE" INSIGHTS ENGINE       */}
      {/* =================================================================== */}
      {activeViewTab === 'INSIGHTS' && (
        <div className="space-y-6">
          {/* Top Simulation & AI Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 via-white to-violet-50 p-4 shadow-2xs">
            <div className="space-y-0.5">
              <div className="text-sm font-bold text-slate-900">
                Survey &amp; Interview Results — Mom-Test Insights Engine
              </div>
              <p className="text-xs text-slate-600">
                Share your public survey link with real prospects, log 1-on-1
                calls, or simulate 5 sample responses to test your charts &amp;
                AI insights right now.
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
                  (totalResponses === 0 && interviewLogs.length === 0) ||
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
                    : 'Emails captured on your public survey'}
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
                    Open Public Survey Page
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
                      {waitlistResponses.map((lead) => {
                        const alreadyLoggedCall = interviewLogs.some(
                          (i) =>
                            i.linkedResponseId === lead.id ||
                            (lead.respondentEmail &&
                              i.intervieweeEmail?.toLowerCase() ===
                                lead.respondentEmail.toLowerCase())
                        );
                        return (
                          <div
                            key={lead.id}
                            className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-xs"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-slate-900">
                                {lead.respondentNameOrRole || 'Early-Bird Lead'}
                              </span>
                              {lead.respondentEmail && (
                                <span className="font-mono text-indigo-700">
                                  {lead.respondentEmail}
                                </span>
                              )}
                              {lead.isSimulated && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px]"
                                >
                                  Simulated Sample
                                </Badge>
                              )}
                              {alreadyLoggedCall && (
                                <Badge className="bg-emerald-100 text-[10px] font-bold text-emerald-900">
                                  ✓ 1-on-1 Call Logged
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-slate-400">
                                {new Date(
                                  lead.submittedAt
                                ).toLocaleDateString()}
                              </span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isVaultReadonly}
                                onClick={() =>
                                  handleStartInterviewFromWaitlistLead(lead)
                                }
                                className="h-7 border-indigo-200 bg-indigo-50/70 px-2.5 text-[11px] font-semibold text-indigo-800 hover:bg-indigo-100"
                              >
                                <Mic className="h-3 w-3 text-indigo-600" />
                                Log 1-on-1 Call
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
              )}
            </>
          )}
        </div>
      )}
            </div>

            {/* STUDIO STICKY BOTTOM FOOTER BAR */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSurveyStudioOpen(false)}
                  className="text-xs font-semibold"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to Survey Tiles
                </Button>

                {!isVaultReadonly && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteSurveyById(activeSurvey)}
                    className="border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Survey
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {activeViewTab === 'BUILDER' && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setActiveViewTab('OUTREACH')}
                    className="bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700"
                  >
                    <QrCode className="h-3.5 w-3.5" />
                    Next: Share &amp; QR Kit
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                )}

                {activeViewTab === 'OUTREACH' && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setActiveViewTab('INSIGHTS');
                      void handleSyncLiveResponses(true);
                    }}
                    className="bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700"
                  >
                    <BarChart3 className="h-3.5 w-3.5" />
                    Next: Results &amp; AI Insights ({totalResponses})
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                )}

                {activeViewTab === 'INSIGHTS' && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setIsSurveyStudioOpen(false)}
                    className="bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Done — Back to Overview Tiles
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* STEP 2: 1-ON-1 CUSTOMER DISCOVERY INTERVIEWS (OVERVIEW TILES GRID)  */}
      {/* =================================================================== */}
      {openStep !== 'ALL' && openStep !== 2 ? (
        <div
          id="module-c-step-2"
          onClick={() => setOpenStep(2)}
          className="group scroll-mt-24 cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                  isStep2Complete ? 'bg-emerald-600' : 'bg-indigo-600'
                }`}
              >
                {isStep2Complete ? (
                  <Check className="h-4 w-4" />
                ) : (
                  '2'
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-bold text-slate-900">
                    Step 2: 1-on-1 Customer Discovery Interviews
                  </span>
                  <Badge
                    variant={isStep2Complete ? 'success' : 'outline'}
                    className="shrink-0 text-[10px]"
                  >
                    {isStep2Complete ? 'Completed' : 'In Progress'}
                  </Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {interviewLogs.length > 0
                    ? `${interviewLogs.length} 1-on-1 interview(s) logged • ${
                        interviewLogs.filter(
                          (i) => i.signalBadge === 'STRONG_SIGNAL'
                        ).length
                      } Strong Signal • ${
                        interviewLogs.filter(
                          (i) => i.signalBadge === 'POLITE_FLUFF'
                        ).length
                      } Polite Fluff filtered`
                    : 'No 1-on-1 customer calls logged yet — log a Zoom/coffee chat or simulate 3 sample calls'}
                </p>
              </div>
            </div>
            <div className="ml-3 flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 text-xs font-semibold text-indigo-700 group-hover:bg-indigo-50"
              >
                Edit Step
                <ChevronDown className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          id="module-c-step-2"
          className="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-6 shadow-xs"
        >
          {/* Step 2 Header */}
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <span
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                  isStep2Complete ? 'bg-emerald-600' : 'bg-indigo-600'
                }`}
              >
                {isStep2Complete ? (
                  <Check className="h-4 w-4" />
                ) : (
                  '2'
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                    Step 2: 1-on-1 Customer Discovery Interviews
                  </h2>
                  <Badge
                    variant={isStep2Complete ? 'success' : 'outline'}
                    className="shrink-0 text-[10px]"
                  >
                    {isStep2Complete ? 'Completed' : 'In Progress'}
                  </Badge>
                  {interviewLogs.length > 0 && (
                    <Badge className="shrink-0 border-emerald-300 bg-emerald-100 text-[10px] font-bold text-emerald-900">
                      {
                        interviewLogs.filter(
                          (i) => i.signalBadge === 'STRONG_SIGNAL'
                        ).length
                      }{' '}
                      Strong Signal •{' '}
                      {
                        interviewLogs.filter(
                          (i) => i.signalBadge === 'POLITE_FLUFF'
                        ).length
                      }{' '}
                      Polite Fluff Filtered
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Surveys tell you <em>what</em> is happening; 5 to 10 live
                  1-on-1 conversations tell you <em>why</em>—and uncover exact
                  pricing, workarounds, and pilot commitments. Click{' '}
                  <strong>&ldquo;+ Log 1-on-1 Interview&rdquo;</strong> to open
                  the focused AI Mom-Test Extractor window.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                disabled={isVaultReadonly}
                onClick={() => {
                  resetInterviewForm();
                  setIsInterviewModalOpen(true);
                }}
                className="shrink-0 bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Log 1-on-1 Interview
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenStep(0);
                }}
                className="shrink-0 text-xs text-slate-500 hover:text-slate-800"
              >
                Collapse Step
                <ChevronUp className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="mt-5 space-y-5">
            {/* Quick Action Bar: Live Call Cheat Sheet + Simulate Sample Calls */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-200/80 bg-indigo-50/40 p-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setShowLiveCallCheatSheet(!showLiveCallCheatSheet)
                  }
                  className="border-indigo-200 bg-white text-xs font-semibold text-indigo-800 hover:bg-indigo-50"
                >
                  <FileText className="h-3.5 w-3.5 text-indigo-600" />
                  {showLiveCallCheatSheet
                    ? 'Hide Live Call Cheat Sheet'
                    : 'Show 5 Mom-Test Call Prompts'}
                  {showLiveCallCheatSheet ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </Button>

                <span className="text-xs text-slate-600">
                  Going on a Zoom or coffee chat? Open the 5 non-leading prompts
                  to ask on your call.
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isVaultReadonly}
                  onClick={handleSimulateSampleInterviews}
                  className="border-indigo-300 bg-white text-xs text-indigo-700 hover:bg-indigo-50"
                >
                  <FlaskConical className="h-3.5 w-3.5" />
                  Simulate 3 Sample Calls
                </Button>

                {interviewLogs.some((i) => i.isSimulated) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isVaultReadonly}
                    onClick={handleClearSimulatedInterviews}
                    className="bg-white text-xs text-slate-600"
                  >
                    Clear Simulated
                  </Button>
                )}
              </div>
            </div>

            {showLiveCallCheatSheet && (
              <div className="rounded-xl border border-indigo-200/80 bg-white p-4 shadow-2xs">
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                    🎙️ Live Call Cheat Sheet — 5 Questions to Ask on Your Call
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Keep this open during Zoom or coffee chats
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2.5 md:grid-cols-5">
                  {buildLiveCallCheatSheetPrompts(plan, activeSurvey).map(
                    (item, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs"
                      >
                        <div className="space-y-1.5">
                          <div className="font-bold text-indigo-950">
                            {item.title}
                          </div>
                          <p className="font-medium italic leading-relaxed text-slate-800">
                            {item.question}
                          </p>
                        </div>
                        <p className="mt-2 border-t border-slate-200/80 pt-1.5 text-[10px] leading-snug text-slate-500">
                          💡 {item.whyItWorks}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* 1-ON-1 INTERVIEWS OVERVIEW TILES GRID */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {interviewLogs.map((log) => {
                const channelLabel =
                  log.channel === 'OTHER'
                    ? log.otherChannelText || 'Custom Channel'
                    : INTERVIEW_CHANNEL_OPTIONS.find(
                        (c) => c.code === log.channel
                      )?.label || log.channel;
                const commitmentLabel =
                  log.commitmentOutcome === 'OTHER'
                    ? `✨ ${log.otherCommitmentText || 'Custom Outcome'}`
                    : INTERVIEW_COMMITMENT_OPTIONS.find(
                        (c) => c.code === log.commitmentOutcome
                      )?.label || log.commitmentOutcome;

                return (
                  <div
                    key={log.id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs transition-all hover:border-indigo-300 hover:shadow-md"
                  >
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-sm font-bold text-slate-900">
                              {log.intervieweeNameOrRole}
                            </span>
                            {log.isSimulated && (
                              <Badge variant="secondary" className="text-[10px]">
                                Simulated
                              </Badge>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {channelLabel} • {log.date}
                            {log.intervieweeEmail
                              ? ` • ${log.intervieweeEmail}`
                              : ''}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Badge
                            className={`text-[10px] font-bold ${
                              log.signalBadge === 'STRONG_SIGNAL'
                                ? 'bg-emerald-100 text-emerald-900'
                                : log.signalBadge === 'POLITE_FLUFF'
                                  ? 'bg-rose-100 text-rose-900'
                                  : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {log.signalBadge === 'STRONG_SIGNAL'
                              ? '🔥 Strong Signal'
                              : log.signalBadge === 'POLITE_FLUFF'
                                ? '⚠️ Polite Fluff'
                                : '⚖️ Mixed Signal'}
                          </Badge>
                          <Badge className="bg-indigo-50 text-[10px] font-bold text-indigo-800">
                            Pain: {log.painScore1To5}/5
                          </Badge>
                        </div>
                      </div>

                      <p className="text-xs font-medium leading-relaxed text-slate-800">
                        {log.keyTakeaway}
                      </p>

                      {log.verbatimQuote && (
                        <div className="rounded-xl border border-slate-200/90 bg-slate-50 p-2.5 text-[11px] italic text-slate-700">
                          &ldquo;{log.verbatimQuote}&rdquo;
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                        <span>
                          <strong>Workaround/Spend:</strong>{' '}
                          {log.workaroundAndSpend}
                        </span>
                      </div>

                      {log.momTestCoachingNote && (
                        <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 px-2.5 py-1.5 text-[11px] text-indigo-950">
                          💡 {log.momTestCoachingNote}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
                      <span className="text-[11px] font-semibold text-indigo-900">
                        {commitmentLabel}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isVaultReadonly}
                          onClick={() => handleEditInterviewLog(log)}
                          className="h-7 px-2.5 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-50"
                        >
                          Edit in Logger
                        </Button>
                        <button
                          type="button"
                          disabled={isVaultReadonly}
                          onClick={() => handleDeleteInterviewLog(log.id)}
                          className="rounded-lg px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* + LOG NEW 1-ON-1 INTERVIEW TILE */}
              <button
                type="button"
                disabled={isVaultReadonly}
                onClick={() => {
                  resetInterviewForm();
                  setIsInterviewModalOpen(true);
                }}
                className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-6 text-center transition-all hover:border-indigo-400 hover:bg-indigo-50/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
                  <Mic className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-bold text-slate-900">
                    + Log a 1-on-1 Customer Interview
                  </div>
                  <p className="max-w-xs text-xs leading-relaxed text-slate-500">
                    Open the focused Interview Logger window to paste raw call
                    notes and let AI extract Mom-Test signal, quotes, and pain
                    scores.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Step 2 Bottom Toolbar */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => scrollToStep(1)}
              className="text-xs font-semibold"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Previous: Step 1 (Customer Surveys)
            </Button>

            <div className="flex flex-wrap items-center gap-2">
              {activeSurvey && interviewLogs.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    openSurveyInStudio(activeSurvey, 'INSIGHTS', false);
                    void handleRunAiAnalysis();
                  }}
                  className="border-indigo-200 bg-indigo-50/70 text-xs font-semibold text-indigo-800 hover:bg-indigo-100"
                >
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                  Synthesize Calls in Survey Insights
                </Button>
              )}

              <Button
                type="button"
                size="sm"
                onClick={() => scrollToStep(3)}
                className="bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700"
              >
                Next Step: Validation Brief &amp; Blind Spots
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* FOCUSED 1-ON-1 INTERVIEW LOGGER MODAL WINDOW                        */}
      {/* =================================================================== */}
      {isInterviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-2 backdrop-blur-xs sm:p-4 lg:p-6">
          <div className="relative flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-2xl">
            {/* Modal Sticky Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
                  <Mic className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingInterviewId
                      ? 'Edit 1-on-1 Customer Interview Log'
                      : 'Log a 1-on-1 Customer Conversation'}
                  </h3>
                  <p className="text-xs text-slate-600">
                    Paste raw notes or voice-memo transcripts first, then click{' '}
                    <strong>&ldquo;Extract with AI Mom-Test Filter&rdquo;</strong>{' '}
                    to auto-fill the structured fields.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    resetInterviewForm();
                    setIsInterviewModalOpen(false);
                  }}
                  className="text-xs font-semibold"
                >
                  Cancel
                </Button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
              {/* Row 1: Name/Role, Email, Date */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Person Name &amp; Role *
                  </label>
                  <Input
                    disabled={isVaultReadonly}
                    value={intervieweeNameOrRole}
                    onChange={(e) => setIntervieweeNameOrRole(e.target.value)}
                    placeholder="e.g., Sarah Jenkins (Clinic Owner)"
                    className="text-base sm:text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Email / Contact (Optional)
                  </label>
                  <Input
                    disabled={isVaultReadonly}
                    value={intervieweeEmail}
                    onChange={(e) => setIntervieweeEmail(e.target.value)}
                    placeholder="sarah@example.com"
                    className="text-base sm:text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Conversation Date
                  </label>
                  <Input
                    type="date"
                    disabled={isVaultReadonly}
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    className="text-base sm:text-xs"
                  />
                </div>
              </div>

              {/* Row 2: Conversation Channel Selector (with OTHER per GEMINI.md Rule 1.5) */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Conversation Channel:
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {INTERVIEW_CHANNEL_OPTIONS.map((ch) => {
                    const isSelected = interviewChannel === ch.code;
                    return (
                      <button
                        key={ch.code}
                        type="button"
                        disabled={isVaultReadonly}
                        onClick={() => setInterviewChannel(ch.code)}
                        className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/90 text-indigo-950 ring-1 ring-indigo-600'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300'
                        }`}
                      >
                        <span className="text-xs font-bold">{ch.label}</span>
                        <span className="mt-0.5 text-[10px] leading-tight text-slate-500">
                          {ch.subtitle}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {interviewChannel === 'OTHER' && (
                  <div className="pt-1">
                    <Input
                      disabled={isVaultReadonly}
                      value={otherInterviewChannelText}
                      onChange={(e) =>
                        setOtherInterviewChannelText(e.target.value)
                      }
                      placeholder="Specify custom channel (e.g., Trade Show Floor, WhatsApp Call, Slack Huddle)..."
                      className="border-indigo-300 bg-indigo-50/30 text-base sm:text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Row 3: Raw Messy Call Notes + AI Mom-Test Extractor Button */}
              <div className="space-y-2 rounded-2xl border border-indigo-200 bg-indigo-50/40 p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-bold text-indigo-950">
                      1. Brain-Dump Raw Call Notes or Transcript
                    </label>
                    <p className="text-[11px] text-slate-600">
                      Jot down messy bullet points from the conversation—what
                      broke last week, what tools they pay for today, and what
                      they said at the end.
                    </p>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    disabled={
                      isVaultReadonly ||
                      !interviewRawNotes.trim() ||
                      isExtractingInterviewAi
                    }
                    onClick={handleExtractInterviewWithAi}
                    className="bg-gradient-to-r from-indigo-600 to-violet-600 text-xs text-white hover:from-indigo-700 hover:to-violet-700"
                  >
                    {isExtractingInterviewAi ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Extracting Mom-Test Signal...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        Extract with AI Mom-Test Filter
                      </>
                    )}
                  </Button>
                </div>

                <textarea
                  rows={5}
                  disabled={isVaultReadonly}
                  value={interviewRawNotes}
                  onChange={(e) => setInterviewRawNotes(e.target.value)}
                  placeholder="e.g., Spoke with Sarah for 15 mins. Last Tuesday her clinic lost 3 hours chasing patient intake forms across email and Excel. They pay €140/mo for an older tool but staff hate using it. She asked if she can test our V1 next month with 2 receptionists..."
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-base leading-relaxed text-slate-900 focus:border-indigo-500 focus:outline-hidden sm:text-xs"
                />
              </div>

              {/* Row 4: Structured Takeaways (Auto-filled by AI or manually editable) */}
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    2. Structured Mom-Test Proof (Auto-Filled by AI or Edit
                    Directly)
                  </span>
                  <div className="flex items-center gap-1.5">
                    {(
                      [
                        {
                          code: 'STRONG_SIGNAL',
                          label: '🔥 Strong Signal',
                          activeCls:
                            'bg-emerald-600 text-white border-emerald-600',
                        },
                        {
                          code: 'MIXED_SIGNAL',
                          label: '⚖️ Mixed Signal',
                          activeCls:
                            'bg-amber-500 text-slate-950 border-amber-500',
                        },
                        {
                          code: 'POLITE_FLUFF',
                          label: '⚠️ Polite Fluff',
                          activeCls: 'bg-rose-600 text-white border-rose-600',
                        },
                      ] as const
                    ).map((b) => (
                      <button
                        key={b.code}
                        type="button"
                        disabled={isVaultReadonly}
                        onClick={() => setInterviewSignalBadge(b.code)}
                        className={`rounded-lg border px-2 py-1 text-[10px] font-bold transition-all ${
                          interviewSignalBadge === b.code
                            ? b.activeCls
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Key Takeaway (1-Sentence Summary of Past Behavior &amp;
                    Pain):
                  </label>
                  <Input
                    disabled={isVaultReadonly}
                    value={interviewKeyTakeaway}
                    onChange={(e) => setInterviewKeyTakeaway(e.target.value)}
                    placeholder="e.g., Loses 3 hours every week chasing intake forms manually despite paying €140/mo for legacy software."
                    className="bg-white text-base sm:text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Best Verbatim Customer Quote:
                    </label>
                    <textarea
                      rows={2}
                      disabled={isVaultReadonly}
                      value={interviewVerbatimQuote}
                      onChange={(e) =>
                        setInterviewVerbatimQuote(e.target.value)
                      }
                      placeholder='"Last Tuesday we spent 3 hours fixing a single batch by hand..."'
                      className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-base text-slate-900 focus:border-indigo-500 focus:outline-hidden sm:text-xs"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Current Workaround &amp; Monthly Spend:
                    </label>
                    <textarea
                      rows={2}
                      disabled={isVaultReadonly}
                      value={interviewWorkaroundAndSpend}
                      onChange={(e) =>
                        setInterviewWorkaroundAndSpend(e.target.value)
                      }
                      placeholder="e.g., Shared Excel tracker + €140/mo legacy software + 3 hrs/wk admin."
                      className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-base text-slate-900 focus:border-indigo-500 focus:outline-hidden sm:text-xs"
                    />
                  </div>
                </div>

                {/* Pain / Urgency 1-5 Selector */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Observed Pain / Urgency Level (1 = Minor annoyance, 5 =
                    Hair-on-fire problem):
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        type="button"
                        disabled={isVaultReadonly}
                        onClick={() => setInterviewPainScore(score)}
                        className={`rounded-xl border py-2 text-center text-xs font-bold transition-all ${
                          interviewPainScore === score
                            ? 'border-indigo-600 bg-indigo-600 text-white shadow-2xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300'
                        }`}
                      >
                        {score} / 5
                      </button>
                    ))}
                  </div>
                </div>

                {/* Commitment / Next-Step Outcome Selector (with OTHER per GEMINI.md Rule 1.5) */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Commitment / Call Outcome (Skin in the Game):
                  </label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {INTERVIEW_COMMITMENT_OPTIONS.map((opt) => {
                      const isSelected = interviewCommitment === opt.code;
                      return (
                        <button
                          key={opt.code}
                          type="button"
                          disabled={isVaultReadonly}
                          onClick={() => {
                            setInterviewCommitment(opt.code);
                            setInterviewSignalBadge(opt.defaultSignal);
                          }}
                          className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition-all ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/90 text-indigo-950 ring-1 ring-indigo-600'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300'
                          }`}
                        >
                          <span className="text-xs font-bold">{opt.label}</span>
                          <span className="mt-0.5 text-[10px] leading-snug text-slate-500">
                            {opt.subtitle}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {interviewCommitment === 'OTHER' && (
                    <div className="pt-1">
                      <Input
                        disabled={isVaultReadonly}
                        value={otherInterviewCommitmentText}
                        onChange={(e) =>
                          setOtherInterviewCommitmentText(e.target.value)
                        }
                        placeholder="Describe custom outcome or commitment (e.g., Invited us to observe their team workflow next Tuesday)..."
                        className="border-indigo-300 bg-white text-base sm:text-xs"
                      />
                    </div>
                  )}
                </div>

                {interviewMomTestCoachingNote && (
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50/80 p-3 text-xs text-indigo-950">
                    <span className="font-bold">
                      💡 AI Mom-Test Coaching Note:{' '}
                    </span>
                    {interviewMomTestCoachingNote}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Sticky Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  resetInterviewForm();
                  setIsInterviewModalOpen(false);
                }}
                className="text-xs font-semibold"
              >
                Cancel
              </Button>

              <Button
                type="button"
                size="sm"
                disabled={
                  isVaultReadonly ||
                  (!intervieweeNameOrRole.trim() &&
                    !interviewRawNotes.trim() &&
                    !interviewKeyTakeaway.trim())
                }
                onClick={handleSaveInterviewLog}
                className="bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700"
              >
                <CheckCircle2 className="h-4 w-4" />
                {editingInterviewId
                  ? 'Update 1-on-1 Interview Log'
                  : 'Save 1-on-1 Interview to Evidence Log'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* STEP 3: CONSTRUCTIVE "THINGS TO CONSIDER" (BLIND-SPOT REVIEW)       */}
      {/* (Matches Module B Step 5 Collapsible Card 100%)                     */}
      {/* =================================================================== */}
      {openStep !== 'ALL' && openStep !== 3 ? (
        <div
          id="module-c-step-3"
          onClick={() => setOpenStep(3)}
          className="group scroll-mt-24 cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                  isStep3Complete ? 'bg-emerald-600' : 'bg-indigo-600'
                }`}
              >
                {isStep3Complete ? <Check className="h-4 w-4" /> : '3'}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-sm font-bold text-slate-900">
                    Step 3: Constructive &ldquo;Things to Consider&rdquo; (Blind-Spot Review)
                  </h2>
                  {isStep3Complete ? (
                    <Badge variant="success" className="shrink-0 text-[10px]">
                      Completed
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      In Progress
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {hasValidationActivity
                    ? `6 tailored Co-Founder Blind-Spot cards synthesizing your ${validSurveys.length} survey(s) & ${interviewLogs.length} 1-on-1 call(s)`
                    : 'Create at least 1 survey or log 1 customer interview to unlock your 6 Co-Founder Blind-Spot cards'}
                </p>
              </div>
            </div>
            <div className="ml-3 flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 text-xs font-semibold text-indigo-700 group-hover:bg-indigo-50"
              >
                Edit Step
                <ChevronDown className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          id="module-c-step-3"
          className="scroll-mt-24 space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-xs"
        >
          {/* Step 3 Expanded Header */}
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <span
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                  isStep3Complete ? 'bg-emerald-600' : 'bg-indigo-600'
                }`}
              >
                {isStep3Complete ? <Check className="h-4 w-4" /> : '3'}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                    Step 3: Constructive &ldquo;Things to Consider&rdquo; (Blind-Spot Review)
                  </h2>
                  {isStep3Complete ? (
                    <Badge variant="success" className="shrink-0 text-[10px]">
                      Completed
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      In Progress
                    </Badge>
                  )}
                  <Badge variant="warning" className="shrink-0 text-[10px]">
                    Supportive Co-Founder Audit • 6 Cards
                  </Badge>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Before you move into <strong>Module D (Product &amp; V1 Scope)</strong>,
                  review 6 constructive blind-spot checks synthesizing your{' '}
                  <strong>{validSurveys.length} survey(s)</strong>,{' '}
                  <strong>{allResponsesAcrossSurveys.length} response(s)</strong>,{' '}
                  <strong>{interviewLogs.length} 1-on-1 interview(s)</strong>, and{' '}
                  <strong>{countryPack.countryName}</strong> grant readiness.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenStep(0);
                }}
                className="shrink-0 text-xs text-slate-500 hover:text-slate-800"
              >
                Collapse Step
                <ChevronUp className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {!hasValidationActivity ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-amber-300 bg-amber-50/50 p-4 text-xs text-slate-700">
              <div className="max-w-2xl leading-relaxed">
                <strong>🔒 Requires 1+ Survey or 1-on-1 Interview:</strong> We
                never generate a fake blind-spot audit when you have zero
                surveys and zero 1-on-1 interviews. Start by building a Mom-Test
                survey in Step 1 or logging your first 1-on-1 discovery chat in
                Step 2!
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => scrollToStep(1)}
                  className="border-indigo-200 bg-white text-xs font-semibold text-indigo-800 hover:bg-indigo-50"
                >
                  <FileText className="h-3.5 w-3.5 text-indigo-600" />
                  Go to Step 1: Surveys
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    scrollToStep(2);
                    resetInterviewForm();
                    setIsInterviewModalOpen(true);
                  }}
                  className="bg-indigo-600 text-xs text-white hover:bg-indigo-700"
                >
                  <Mic className="h-3.5 w-3.5" />
                  Log a 1-on-1 Interview
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {liveThingsToConsider.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col justify-between rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/40 via-white to-white p-4 shadow-2xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant={
                          item.severity === 'WARNING' ? 'warning' : 'secondary'
                        }
                        className="text-[10px]"
                      >
                        {item.category}
                      </Badge>
                      <span className="text-[11px] font-semibold text-amber-700">
                        {item.severity === 'WARNING'
                          ? '⚠️ Key Blind Spot'
                          : '💡 Opportunity'}
                      </span>
                    </div>
                    <h4 className="mt-2 text-sm font-bold text-slate-900">
                      {item.title}
                    </h4>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                      {item.explanation}
                    </p>
                  </div>

                  {item.suggestedAction && (
                    <div className="mt-3 rounded-lg bg-indigo-50/70 px-3 py-2 text-xs text-indigo-950">
                      <strong className="font-semibold text-indigo-700">
                        Suggested Action:{' '}
                      </strong>
                      {item.suggestedAction}
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-end border-t border-slate-100 pt-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        onParkQuestion(
                          `[Module C - ${item.category}] ${item.title}: ${item.suggestedAction || item.explanation}`
                        )
                      }
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 hover:text-amber-950"
                    >
                      <BookmarkPlus className="h-3.5 w-3.5 text-amber-600" />
                      Park in Open Questions
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 3 Bottom Save & Next Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => scrollToStep(2)}
              className="text-xs font-semibold"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Previous: Step 2 (1-on-1 Interviews)
            </Button>

            <div className="flex flex-wrap items-center gap-2">
              {!isVaultReadonly && hasValidationActivity && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSavingComplete}
                  onClick={handleSaveModuleCComplete}
                >
                  {isSavingComplete ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      Save Module C Progress
                    </>
                  )}
                </Button>
              )}

              <Button
                type="button"
                size="sm"
                onClick={() => scrollToStep(4)}
                className="bg-slate-900 text-xs font-bold text-white hover:bg-slate-800"
              >
                Next: Validation Brief &amp; Export
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* STEP 4 (OVERVIEW): CUSTOMER VALIDATION & INTERVIEW BRIEF            */}
      {/* (Matches Module B Step 6 Overview Brief Card 100%)                  */}
      {/* =================================================================== */}
      {openStep !== 'ALL' && openStep !== 4 ? (
        <div
          id="module-c-step-4"
          onClick={() => setOpenStep(4)}
          className="group scroll-mt-24 cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                  completedCoreStepsCount === 3
                    ? 'bg-emerald-600'
                    : 'bg-indigo-600'
                }`}
              >
                <FileText className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-bold text-slate-900">
                    Customer Validation &amp; Interview Brief (Executive Summary)
                  </span>
                  <Badge
                    variant={
                      completedCoreStepsCount === 3 ? 'success' : 'secondary'
                    }
                    className="shrink-0 text-[10px]"
                  >
                    {completedCoreStepsCount}/3 Sections Ready
                  </Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {hasValidationActivity
                    ? `Your complete Module C survey results, 1-on-1 call log & waitlist brief — ready to view, print to PDF, or export.`
                    : 'Create at least 1 survey or log 1 customer interview to unlock your Validation Brief'}
                </p>
              </div>
            </div>
            <div className="ml-3 flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 text-xs font-semibold text-indigo-700 group-hover:bg-indigo-50"
              >
                Open Overview
                <ChevronDown className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Card
          id="module-c-step-4"
          className="scroll-mt-24 rounded-xl border border-indigo-200 bg-gradient-to-br from-white via-indigo-50/30 to-violet-50/40 p-6 shadow-sm"
        >
          {/* Overview Step Header */}
          <div className="flex items-start justify-between gap-4 border-b border-indigo-100 pb-4">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                  completedCoreStepsCount === 3
                    ? 'bg-emerald-600'
                    : 'bg-indigo-600'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">
                    Customer Validation &amp; Interview Brief
                  </h2>
                  <Badge
                    variant={
                      completedCoreStepsCount === 3 ? 'success' : 'secondary'
                    }
                    className="shrink-0 text-[10px]"
                  >
                    {completedCoreStepsCount}/3 Sections Ready
                  </Badge>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Everything you captured across Steps 1–3 is compiled below
                  into a clean executive summary document you can download,
                  print to PDF, or share with a co-founder, mentor, or grant
                  advisor before moving into Module D.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {hasValidationActivity && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBriefPreview(!showBriefPreview)}
                  className="text-xs"
                >
                  <Eye className="h-3.5 w-3.5 text-indigo-600" />
                  {showBriefPreview
                    ? 'Hide Live Preview'
                    : 'Show Live Preview'}
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenStep(0);
                }}
                className="shrink-0 text-xs text-slate-500 hover:text-slate-800"
              >
                Collapse Step
                <ChevronUp className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <CardContent className="space-y-5 px-0 pb-0 pt-4">
            {/* Readiness Checklist Strip */}
            <div className="rounded-xl border border-indigo-100 bg-white p-4 shadow-2xs">
              <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-bold uppercase tracking-wider text-slate-700">
                  Module C Validation Readiness Checklist (Steps 1–3 Included in
                  Your Brief)
                </span>
                <span className="font-semibold text-indigo-700">
                  {moduleCReadinessSteps.filter((s) => s.isComplete).length}/4
                  Validation Pillars Active
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                {moduleCReadinessSteps.map((step) => (
                  <div
                    key={step.stepNumber}
                    className={`flex items-start gap-2 rounded-xl border p-3 text-xs ${
                      step.isComplete
                        ? 'border-emerald-200 bg-emerald-50/40 text-emerald-950'
                        : 'border-amber-200 bg-amber-50/40 text-amber-950'
                    }`}
                  >
                    <CheckCircle2
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        step.isComplete ? 'text-emerald-600' : 'text-amber-500'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold">
                        {step.stepNumber}. {step.label}
                      </div>
                      <div className="mt-0.5 truncate text-[11px] opacity-85">
                        {step.summary}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {!hasValidationActivity ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-amber-300 bg-amber-50/50 p-4 text-xs text-slate-700">
                <div className="max-w-2xl leading-relaxed">
                  <strong>🔒 Validation Brief Locked:</strong> Create at least 1
                  survey in Step 1 or log at least 1 customer interview in Step
                  2 to unlock your printable Validation Brief.
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => scrollToStep(1)}
                    className="border-indigo-200 bg-white text-xs font-semibold text-indigo-800 hover:bg-indigo-50"
                  >
                    Go to Step 1: Surveys
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      scrollToStep(2);
                      resetInterviewForm();
                      setIsInterviewModalOpen(true);
                    }}
                    className="bg-indigo-600 text-xs text-white hover:bg-indigo-700"
                  >
                    Log a 1-on-1 Interview
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* LIVE DOCUMENT PREVIEW (Matches Module A & Module B Document Shell) */}
                {showBriefPreview && (
                  <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
                    {/* Document Top Header Bar */}
                    <div className="border-b-2 border-indigo-600 bg-slate-50/70 px-6 py-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                            {whiteLabelEnabled
                              ? 'MODULE C CUSTOMER VALIDATION & INTERVIEW BRIEF'
                              : 'STARTUP PREFLIGHT • MODULE C CUSTOMER VALIDATION & INTERVIEW BRIEF'}
                          </div>
                          <h3 className="mt-1 text-xl font-extrabold text-slate-900">
                            {plan.title}
                          </h3>
                          <p className="mt-0.5 text-xs text-slate-600">
                            Prepared for <strong>{founderName}</strong> •{' '}
                            {countryPack.countryName} ({currency}) •{' '}
                            {plan.industryCategory}
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-right text-xs text-slate-600">
                          <div>
                            <strong>Date:</strong> {briefGeneratedDate}
                          </div>
                          <div>
                            <strong>Validation Track:</strong>{' '}
                            {validSurveys.length} Survey(s) •{' '}
                            {interviewLogs.length} 1-on-1 Call(s)
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Document Body Sections */}
                    <div className="divide-y divide-slate-200 px-6 py-5 text-xs">
                      {/* Section 1: Primary Market Validation Snapshot */}
                      <div className="pb-5">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                          1. Primary Market Validation Snapshot
                        </div>
                        <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3">
                            <div className="text-[10px] font-bold uppercase text-indigo-700">
                              Customer Surveys
                            </div>
                            <div className="mt-1 text-sm font-extrabold text-indigo-950">
                              {validSurveys.length} Survey
                              {validSurveys.length === 1 ? '' : 's'}
                            </div>
                            <div className="mt-1 text-[11px] text-indigo-900/80">
                              {validSurveys.filter((s) => s.isPublished).length}{' '}
                              Published &amp; Locked
                            </div>
                          </div>

                          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                            <div className="text-[10px] font-bold uppercase text-emerald-700">
                              Survey Responses
                            </div>
                            <div className="mt-1 text-sm font-extrabold text-emerald-950">
                              {realResponsesAcrossSurveys.length} Real (
                              {allResponsesAcrossSurveys.length} Total)
                            </div>
                            <div className="mt-1 text-[11px] text-emerald-900/80">
                              {allResponsesAcrossSurveys.length -
                                realResponsesAcrossSurveys.length}{' '}
                              simulated sample(s)
                            </div>
                          </div>

                          <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-3">
                            <div className="text-[10px] font-bold uppercase text-violet-700">
                              1-on-1 Discovery Calls
                            </div>
                            <div className="mt-1 text-sm font-extrabold text-violet-950">
                              {interviewLogs.length} Logged
                            </div>
                            <div className="mt-1 text-[11px] text-violet-900/80">
                              Avg Customer Pain:{' '}
                              {interviewLogs.length > 0
                                ? `${(
                                    interviewLogs.reduce(
                                      (acc, i) => acc + i.painScore1To5,
                                      0
                                    ) / interviewLogs.length
                                  ).toFixed(1)}/5`
                                : 'N/A'}
                            </div>
                          </div>

                          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3">
                            <div className="text-[10px] font-bold uppercase text-amber-800">
                              Early-Bird Waitlist
                            </div>
                            <div className="mt-1 text-sm font-extrabold text-amber-950">
                              {waitlistAcrossSurveys.length} Lead
                              {waitlistAcrossSurveys.length === 1 ? '' : 's'}
                            </div>
                            <div className="mt-1 text-[11px] text-amber-900/80">
                              Feeds Module D &amp; Module I
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Customer Validation Surveys */}
                      <div className="py-5">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                          2. Customer Validation Surveys &amp; AI Signal Synthesis
                        </div>
                        {validSurveys.length === 0 ? (
                          <div className="mt-2.5 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-slate-500">
                            No customer surveys created yet (validating via
                            1-on-1 customer interviews).
                          </div>
                        ) : (
                          <div className="mt-2.5 space-y-3">
                            {validSurveys.map((survey, sIdx) => {
                              const sReal = survey.responses.filter(
                                (r) => !r.isSimulated
                              ).length;
                              const sWaitlist = survey.responses.filter(
                                (r) =>
                                  r.joinedWaitlist &&
                                  Boolean(r.respondentEmail?.trim())
                              ).length;
                              return (
                                <div
                                  key={survey.id}
                                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                      <span className="text-[10px] font-bold uppercase text-indigo-600">
                                        Survey #{sIdx + 1}
                                      </span>
                                      <div className="text-sm font-bold text-slate-900">
                                        {survey.title}
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <Badge
                                        className={
                                          survey.isPublished
                                            ? 'bg-emerald-100 text-[10px] text-emerald-900'
                                            : 'bg-amber-100 text-[10px] text-amber-900'
                                        }
                                      >
                                        {survey.isPublished
                                          ? '🔒 Published & Locked'
                                          : 'Draft'}
                                      </Badge>
                                      <Badge
                                        variant="secondary"
                                        className="text-[10px]"
                                      >
                                        {survey.questions.length} Questions •{' '}
                                        {survey.responses.length} Responses (
                                        {sReal} Real) • {sWaitlist} Waitlist
                                      </Badge>
                                    </div>
                                  </div>

                                  {survey.aiInsightsSummary && (
                                    <div className="mt-2.5 rounded-lg border border-indigo-200 bg-indigo-50/70 p-2.5 text-[11px] text-indigo-950">
                                      <div>
                                        <strong>
                                          AI Signal Score (
                                          {
                                            survey.aiInsightsSummary
                                              .signalScoreOutOf100
                                          }
                                          /100):
                                        </strong>{' '}
                                        {
                                          survey.aiInsightsSummary
                                            .headlineTakeaway
                                        }
                                      </div>
                                      <div className="mt-1 text-indigo-900/90">
                                        <strong>
                                          Recommended V1 Action (Feeds Module D):
                                        </strong>{' '}
                                        {
                                          survey.aiInsightsSummary
                                            .recommendedNextAction
                                        }
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Section 3: 1-on-1 Customer Discovery Interviews */}
                      <div className="py-5">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                          3. 1-on-1 Customer Discovery Interview Log (
                          {interviewLogs.length})
                        </div>
                        {interviewLogs.length === 0 ? (
                          <div className="mt-2.5 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-slate-500">
                            No 1-on-1 customer interviews logged yet.
                          </div>
                        ) : (
                          <div className="mt-2.5 grid grid-cols-1 gap-2.5 md:grid-cols-2">
                            {interviewLogs.map((log) => (
                              <div
                                key={log.id}
                                className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <div className="font-bold text-slate-900">
                                      {log.intervieweeNameOrRole}
                                    </div>
                                    <div className="text-[11px] text-slate-500">
                                      {log.date} • {formatInterviewChannel(log)}
                                    </div>
                                  </div>
                                  <Badge
                                    variant={
                                      log.signalBadge === 'STRONG_SIGNAL'
                                        ? 'success'
                                        : log.signalBadge === 'MIXED_SIGNAL'
                                          ? 'warning'
                                          : 'secondary'
                                    }
                                    className="text-[10px]"
                                  >
                                    Pain {log.painScore1To5}/5 •{' '}
                                    {INTERVIEW_SIGNAL_LABELS[log.signalBadge]}
                                  </Badge>
                                </div>
                                <p className="mt-1.5 text-[11px] font-medium text-slate-800">
                                  {log.keyTakeaway}
                                </p>
                                {log.verbatimQuote?.trim() && (
                                  <p className="mt-1 text-[11px] italic text-slate-600">
                                    &ldquo;{log.verbatimQuote.trim()}&rdquo;
                                  </p>
                                )}
                                <div className="mt-1.5 text-[10px] font-semibold text-indigo-700">
                                  Outcome: {formatInterviewCommitment(log)}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Section 4: Co-Founder Blind-Spot Takeaways */}
                      <div className="pt-5">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                          4. Co-Founder Blind-Spot Review (&ldquo;Things to
                          Consider&rdquo;)
                        </div>
                        <div className="mt-2.5 grid grid-cols-1 gap-2.5 md:grid-cols-2">
                          {liveThingsToConsider.map((item) => (
                            <div
                              key={item.id}
                              className="rounded-xl border border-slate-200 bg-slate-50/60 p-3"
                            >
                              <div className="font-bold text-slate-900">
                                {item.title}
                              </div>
                              <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                                {item.suggestedAction || item.explanation}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bottom Action Bar: Copy, Download HTML, Print/Save PDF */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-200 bg-white px-4 py-3.5 shadow-2xs">
                  <div className="text-xs text-slate-600">
                    📥{' '}
                    <strong>
                      Take your Customer Validation &amp; Interview Brief with
                      you:
                    </strong>{' '}
                    Download a standalone file, print/save as PDF, or copy for
                    grant &amp; accelerator applications.
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopyModuleCBrief}
                    >
                      {briefCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          Copied to Clipboard!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-slate-600" />
                          Copy Summary
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadModuleCBriefHtml}
                    >
                      <Download className="h-3.5 w-3.5 text-indigo-600" />
                      Download Brief (.html)
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      onClick={handlePrintModuleCBriefPdf}
                      className="bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      Print / Save as PDF
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Handoff Footer CTA into Module D (Matches Module B Dark Footer Bar 100%) */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-900 px-4 py-3.5 text-white">
              <div className="text-xs">
                <span className="font-semibold text-indigo-300">
                  Ready to scope V1 of {plan.title} based on real customer
                  evidence?
                </span>{' '}
                Your validated pain points, workaround spend, and{' '}
                <strong>{waitlistAcrossSurveys.length} waitlist leads</strong>{' '}
                will automatically feed into{' '}
                <strong>
                  Module D (Product Vehicle &amp; Ruthless V1 Feature Filter)
                </strong>
                .
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onBackToModuleB}
                  className="border-slate-700 bg-slate-800 text-xs text-slate-200 hover:bg-slate-700"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to Module B
                </Button>
                {onContinueToModuleD && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={async () => {
                      await handleSaveModuleCComplete();
                      onContinueToModuleD();
                    }}
                    className="bg-indigo-600 text-white hover:bg-indigo-500"
                  >
                    Continue to Module D
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
