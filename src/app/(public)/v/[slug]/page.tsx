'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Send,
  AlertCircle,
  Loader2,
  Check,
  Gift,
  RotateCcw,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  loadPublicSurveyFromLocalRegistry,
  appendResponseToLocalRegistryAndSession,
  type SavedValidationSurvey,
  type SurveyResponseAnswerValue,
  type SavedSurveyResponse,
} from '@/lib/auth/session-store';
import {
  getPublicSurveyBySlugAction,
  submitPublicSurveyResponseAction,
} from '@/app/actions/module-c';

export default function PublicValidationSurveyPage() {
  const params = useParams<{ slug: string }>();
  const rawSlug = Array.isArray(params?.slug)
    ? params.slug[0]
    : params?.slug || '';
  const cleanSlug = decodeURIComponent(rawSlug).trim();

  const [loading, setLoading] = useState(true);
  const [survey, setSurvey] = useState<
    (SavedValidationSurvey & { planTitle?: string }) | null
  >(null);

  // Respondent answers state keyed by question.id
  const [answers, setAnswers] = useState<
    Record<string, SurveyResponseAnswerValue>
  >({});
  const [respondentNameOrRole, setRespondentNameOrRole] = useState('');
  const [respondentEmail, setRespondentEmail] = useState('');
  const [joinedWaitlist, setJoinedWaitlist] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function fetchSurvey() {
      setLoading(true);
      // 1. Check local browser registry first for instant preview / same-browser updates
      const localMatch = loadPublicSurveyFromLocalRegistry(cleanSlug);

      // 2. Also query Cloud SQL for public respondents on other devices
      const cloudRes = await getPublicSurveyBySlugAction(cleanSlug);

      if (!active) return;

      if (localMatch && cloudRes.found && cloudRes.survey) {
        // Prefer whichever has questions or was updated most recently
        const chosen =
          localMatch.questions.length >= cloudRes.survey.questions.length
            ? localMatch
            : cloudRes.survey;
        setSurvey({
          ...chosen,
          isPublished: Boolean(
            localMatch.isPublished || cloudRes.survey.isPublished
          ),
          publishedAt: localMatch.publishedAt || cloudRes.survey.publishedAt,
        });
      } else if (localMatch) {
        setSurvey(localMatch);
      } else if (cloudRes.found && cloudRes.survey) {
        setSurvey(cloudRes.survey);
      } else {
        setSurvey(null);
      }
      setLoading(false);
    }

    if (cleanSlug) {
      fetchSurvey();
    } else {
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [cleanSlug]);

  const handleSelectSingleChoice = (questionId: string, option: string) => {
    setValidationError(null);
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        selectedOption: option,
      },
    }));
  };

  const handleToggleMultiSelect = (questionId: string, option: string) => {
    setValidationError(null);
    setAnswers((prev) => {
      const currentList = prev[questionId]?.selectedOptions || [];
      const exists = currentList.includes(option);
      const nextList = exists
        ? currentList.filter((item) => item !== option)
        : [...currentList, option];
      return {
        ...prev,
        [questionId]: {
          ...prev[questionId],
          selectedOptions: nextList,
        },
      };
    });
  };

  const handleOtherTextChange = (questionId: string, text: string) => {
    setValidationError(null);
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        otherText: text,
      },
    }));
  };

  const handleScaleSelect = (questionId: string, val: number) => {
    setValidationError(null);
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        scaleValue: val,
      },
    }));
  };

  const handleOpenTextChange = (questionId: string, text: string) => {
    setValidationError(null);
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        openText: text,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!survey) return;

    // Ensure at least one question was answered
    const answeredCount = survey.questions.filter((q) => {
      const ans = answers[q.id];
      if (!ans) return false;
      if (q.type === 'MULTIPLE_CHOICE') return Boolean(ans.selectedOption);
      if (q.type === 'MULTI_SELECT')
        return (ans.selectedOptions?.length || 0) > 0;
      if (q.type === 'SCALE_1_5') return typeof ans.scaleValue === 'number';
      if (q.type === 'OPEN_TEXT') return Boolean(ans.openText?.trim());
      return false;
    }).length;

    if (answeredCount === 0 && survey.questions.length > 0) {
      setValidationError(
        'Please answer at least one question before submitting your feedback.'
      );
      return;
    }

    setSubmitting(true);
    setValidationError(null);

    const clientRespId = `resp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newResponse: SavedSurveyResponse = {
      id: clientRespId,
      clientResponseId: clientRespId,
      surveyId: survey.id,
      answers,
      respondentNameOrRole: respondentNameOrRole.trim() || undefined,
      respondentEmail: respondentEmail.trim() || undefined,
      joinedWaitlist:
        joinedWaitlist || Boolean(respondentEmail.trim().includes('@')),
      isSimulated: false,
      submittedAt: new Date().toISOString(),
    };

    // 1. Save to PostgreSQL Cloud SQL first so we get the authoritative UUID
    const submitRes = await submitPublicSurveyResponseAction({
      publicSlug: cleanSlug,
      response: newResponse,
    });

    const finalResponse: SavedSurveyResponse = {
      ...newResponse,
      id: submitRes.savedResponseId || newResponse.id,
      clientResponseId: clientRespId,
    };

    // 2. Save to local registry & session with the exact same ID so same-browser tabs never duplicate
    appendResponseToLocalRegistryAndSession(cleanSlug, finalResponse);

    setSubmitting(false);
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetForAnotherResponse = () => {
    setAnswers({});
    setRespondentNameOrRole('');
    setRespondentEmail('');
    setJoinedWaitlist(false);
    setSubmitted(false);
    setValidationError(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6">
        <div className="flex items-center gap-2.5 text-sm font-medium text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
          Loading survey...
        </div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-lg font-bold text-slate-900">
            Survey Link Not Found
          </h1>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
            We couldn&apos;t find an active survey at{' '}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-800">
              /v/{cleanSlug}
            </code>
            . Make sure the survey has been saved in your Module C Survey
            Builder.
          </p>
          <div className="mt-5">
            <Link href="/workspace">
              <Button size="sm" className="bg-indigo-600 text-white hover:bg-indigo-700">
                Return to Founder Workspace
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!survey.isActive) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
            <Clock className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-lg font-bold text-slate-900">
            This Survey is Currently Paused
          </h1>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
            The founder of <strong>{survey.title}</strong> has paused new
            responses for now. Thank you for stopping by!
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-indigo-50/60 via-white to-slate-50 p-6">
        <div className="w-full max-w-lg rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-lg">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <Badge className="mt-4 bg-emerald-100 text-emerald-800">
            Response Recorded
          </Badge>
          <h1 className="mt-2 text-xl font-bold text-slate-900">
            Thank you for sharing your honest feedback!
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            Your answers help shape{' '}
            <strong>{survey.planTitle || survey.title}</strong> around real
            experiences instead of guesswork.
            {respondentEmail.trim() && (
              <span className="mt-1 block font-medium text-emerald-700">
                ✓ You&apos;re on the early-bird list ({respondentEmail.trim()}).
              </span>
            )}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 border-t border-slate-100 pt-5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetForAnotherResponse}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Submit Another Response
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/50 via-slate-50 to-white px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-2xl">
        {/* Top Trust Strip */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-medium text-indigo-700">
            <Clock className="h-3.5 w-3.5" />
            <span>Takes ~60 seconds • Zero login required</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>100% Confidential Discovery Survey</span>
          </div>
        </div>

        {/* Survey Header Card */}
        <div className=" rounded-2xl border border-indigo-200/80 bg-gradient-to-r from-indigo-950 via-indigo-900 to-violet-900 p-6 text-white shadow-md sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-indigo-400/40 bg-indigo-500/30 text-[11px] text-indigo-100">
              Customer Discovery &amp; Feedback
            </Badge>
            {survey.isPublished ? (
              <Badge className="border-emerald-400/40 bg-emerald-500/25 text-[11px] text-emerald-100">
                <Lock className="mr-1 h-3 w-3" />
                Verified &amp; Locked Questions
              </Badge>
            ) : (
              <Badge className="border-amber-400/40 bg-amber-500/25 text-[11px] text-amber-100">
                Draft Preview Mode
              </Badge>
            )}
          </div>
          <h1 className="mt-2.5 text-xl font-bold tracking-tight sm:text-2xl">
            {survey.title || 'Quick Customer Feedback Survey'}
          </h1>
          {survey.introDescription && (
            <p className="mt-2 text-xs leading-relaxed text-indigo-100/90 sm:text-sm">
              {survey.introDescription}
            </p>
          )}
        </div>

        {/* Questions Single-Page Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {survey.questions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-xs text-slate-500">
              No questions have been added to this survey yet.
            </div>
          ) : (
            survey.questions.map((q, idx) => {
              const currentAns = answers[q.id] || {};
              const isOtherSelectedSingle =
                currentAns.selectedOption === 'OTHER';
              const isOtherSelectedMulti = (
                currentAns.selectedOptions || []
              ).includes('OTHER');

              return (
                <div
                  key={q.id}
                  className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition-all hover:border-indigo-200 sm:p-6"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-800">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <label className="block text-sm font-bold leading-snug text-slate-900 sm:text-base">
                        {q.questionText || `Question ${idx + 1}`}
                      </label>
                      {q.type === 'MULTI_SELECT' && (
                        <span className="mt-0.5 block text-[11px] text-slate-500">
                          Select all options that apply to you
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 1. MULTIPLE_CHOICE (Single Select) */}
                  {q.type === 'MULTIPLE_CHOICE' && (
                    <div className="mt-4 space-y-2 sm:pl-9">
                      {(q.options || []).map((opt) => {
                        const selected = currentAns.selectedOption === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleSelectSingleChoice(q.id, opt)}
                            className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-xs font-medium transition-all sm:text-sm ${
                              selected
                                ? 'border-indigo-600 bg-indigo-50/90 text-indigo-950 ring-1 ring-indigo-600'
                                : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:border-slate-300 hover:bg-slate-100/70'
                            }`}
                          >
                            <span>{opt}</span>
                            <span
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                                selected
                                  ? 'border-indigo-600 bg-indigo-600 text-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {selected && <Check className="h-2.5 w-2.5" />}
                            </span>
                          </button>
                        );
                      })}

                      {q.allowOther !== false && (
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleSelectSingleChoice(q.id, 'OTHER')
                            }
                            className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-xs font-medium transition-all sm:text-sm ${
                              isOtherSelectedSingle
                                ? 'border-indigo-600 bg-indigo-50/90 text-indigo-950 ring-1 ring-indigo-600'
                                : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:border-slate-300 hover:bg-slate-100/70'
                            }`}
                          >
                            <span>Other (please specify)</span>
                            <span
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                                isOtherSelectedSingle
                                  ? 'border-indigo-600 bg-indigo-600 text-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isOtherSelectedSingle && (
                                <Check className="h-2.5 w-2.5" />
                              )}
                            </span>
                          </button>

                          {isOtherSelectedSingle && (
                            <Input
                              value={currentAns.otherText || ''}
                              onChange={(e) =>
                                handleOtherTextChange(q.id, e.target.value)
                              }
                              placeholder="Type your own answer..."
                              className="border-indigo-300 bg-white text-base sm:text-xs"
                              autoFocus
                            />
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. MULTI_SELECT (Checkboxes) */}
                  {q.type === 'MULTI_SELECT' && (
                    <div className="mt-4 space-y-2 sm:pl-9">
                      {(q.options || []).map((opt) => {
                        const selected = (
                          currentAns.selectedOptions || []
                        ).includes(opt);
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleToggleMultiSelect(q.id, opt)}
                            className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-xs font-medium transition-all sm:text-sm ${
                              selected
                                ? 'border-indigo-600 bg-indigo-50/90 text-indigo-950 ring-1 ring-indigo-600'
                                : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:border-slate-300 hover:bg-slate-100/70'
                            }`}
                          >
                            <span>{opt}</span>
                            <span
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md border ${
                                selected
                                  ? 'border-indigo-600 bg-indigo-600 text-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {selected && <Check className="h-2.5 w-2.5" />}
                            </span>
                          </button>
                        );
                      })}

                      {q.allowOther !== false && (
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleMultiSelect(q.id, 'OTHER')
                            }
                            className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-xs font-medium transition-all sm:text-sm ${
                              isOtherSelectedMulti
                                ? 'border-indigo-600 bg-indigo-50/90 text-indigo-950 ring-1 ring-indigo-600'
                                : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:border-slate-300 hover:bg-slate-100/70'
                            }`}
                          >
                            <span>Other (please specify)</span>
                            <span
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md border ${
                                isOtherSelectedMulti
                                  ? 'border-indigo-600 bg-indigo-600 text-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isOtherSelectedMulti && (
                                <Check className="h-2.5 w-2.5" />
                              )}
                            </span>
                          </button>

                          {isOtherSelectedMulti && (
                            <Input
                              value={currentAns.otherText || ''}
                              onChange={(e) =>
                                handleOtherTextChange(q.id, e.target.value)
                              }
                              placeholder="Type your own answer..."
                              className="border-indigo-300 bg-white text-base sm:text-xs"
                              autoFocus
                            />
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. SCALE_1_5 (1 to 5 Rating Scale) */}
                  {q.type === 'SCALE_1_5' && (
                    <div className="mt-4 sm:pl-9">
                      <div className="grid grid-cols-5 gap-2">
                        {[1, 2, 3, 4, 5].map((num) => {
                          const selected = currentAns.scaleValue === num;
                          return (
                            <button
                              key={num}
                              type="button"
                              onClick={() => handleScaleSelect(q.id, num)}
                              className={`flex flex-col items-center justify-center rounded-xl border py-3 text-sm font-bold transition-all ${
                                selected
                                  ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-300'
                                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50'
                              }`}
                            >
                              <span>{num}</span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2 text-[11px] font-medium text-slate-500">
                        <span>{q.scaleMinLabel || '1 = Low / Not painful'}</span>
                        <span className="text-right">{q.scaleMaxLabel || '5 = High / Very urgent'}</span>
                      </div>
                    </div>
                  )}

                  {/* 4. OPEN_TEXT (Short Story / Workaround Textarea) */}
                  {q.type === 'OPEN_TEXT' && (
                    <div className="mt-4 sm:pl-9">
                      <textarea
                        rows={3}
                        value={currentAns.openText || ''}
                        onChange={(e) =>
                          handleOpenTextChange(q.id, e.target.value)
                        }
                        placeholder="Share a quick example or how you handle this today..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-hidden sm:text-sm"
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Optional Early-Bird Waitlist & Respondent Info Card */}
          {survey.collectLeadEmails && (
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5 shadow-2xs sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
                  <Gift className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-indigo-950">
                    Optional: Join the Early-Bird Waitlist
                  </div>
                  <p className="mt-0.5 text-xs text-indigo-900/80">
                    {survey.waitlistIncentiveText ||
                      'Leave your email if you would like early beta access or a launch discount (100% optional — leave blank to stay anonymous).'}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-indigo-950">
                    Your Name or Role (Optional)
                  </label>
                  <Input
                    value={respondentNameOrRole}
                    onChange={(e) => setRespondentNameOrRole(e.target.value)}
                    placeholder="e.g., Sarah • Clinic Owner"
                    className="bg-white text-base sm:text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-indigo-950">
                    Email for Early-Bird Access (Optional)
                  </label>
                  <Input
                    type="email"
                    value={respondentEmail}
                    onChange={(e) => {
                      setRespondentEmail(e.target.value);
                      if (e.target.value.includes('@')) {
                        setJoinedWaitlist(true);
                      }
                    }}
                    placeholder="you@example.com"
                    className="bg-white text-base sm:text-xs"
                  />
                </div>
              </div>

              <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs font-medium text-indigo-950">
                <input
                  type="checkbox"
                  checked={joinedWaitlist}
                  onChange={(e) => setJoinedWaitlist(e.target.checked)}
                  className="h-4 w-4 rounded border-indigo-300 text-indigo-600"
                />
                <span>
                  Yes, notify me when early access launches (no spam, ever).
                </span>
              </label>
            </div>
          )}

          {validationError && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-900">
              ⚠️ {validationError}
            </div>
          )}

          {/* Submit Bar */}
          <div className="flex flex-col-reverse items-stretch justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:gap-4 sm:px-6">
            <div className="text-center text-xs text-slate-500 sm:text-left">
              Powered by{' '}
              <span className="font-semibold text-slate-800">
                Startup Preflight
              </span>{' '}
              • No login required
            </div>
            <Button
              type="submit"
              disabled={submitting || survey.questions.length === 0}
              className="w-full bg-indigo-600 py-2.5 text-white hover:bg-indigo-700 sm:w-auto sm:px-6 sm:py-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Feedback
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
