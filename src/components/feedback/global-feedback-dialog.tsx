'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  MessageSquare,
  Bug,
  Sparkles,
  HelpCircle,
  Heart,
  X,
  Loader2,
  CheckCircle2,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  detectDeviceTelemetry,
  type DeviceTelemetry,
} from '@/lib/telemetry/device-detector';
import { submitFeedbackAction } from '@/app/actions/feedback';
import type {
  SupportTicketType,
  SupportModuleScope,
} from '@/lib/support-tracker-store';

export interface GlobalFeedbackTriggerProps {
  variant?: 'header-pill' | 'nav-link' | 'ghost-icon' | 'compact';
  activeModule?: string;
  activeStepContext?: string;
  planId?: string;
  planTitle?: string;
  userEmail?: string;
  userName?: string;
  className?: string;
}

export function GlobalFeedbackButton({
  variant = 'header-pill',
  activeModule = 'GLOBAL',
  activeStepContext,
  planId,
  planTitle,
  userEmail,
  userName,
  className = '',
}: GlobalFeedbackTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {variant === 'header-pill' && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setIsOpen(true)}
          title="Report a bug or give feedback"
          className={`h-8 border-slate-200/90 bg-emerald-50/70 px-2.5 text-xs font-semibold text-emerald-800 shadow-2xs transition-all hover:border-emerald-300 hover:bg-slate-100/90 ${className}`}
        >
          <MessageSquare className="h-3.5 w-3.5 text-emerald-700 sm:mr-1.5" />
          <span className="hidden sm:inline">Feedback</span>
          <span className="ml-1 hidden rounded-full bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-900 lg:inline">
            Beta
          </span>
        </Button>
      )}

      {variant === 'nav-link' && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 transition hover:bg-slate-100/90 hover:text-slate-900 ${className}`}
        >
          <MessageSquare className="h-3.5 w-3.5 text-emerald-700" />
          Feedback
        </button>
      )}

      {variant === 'compact' && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setIsOpen(true)}
          title="Give Feedback"
          className={`h-7 px-2 text-xs font-medium text-slate-600 hover:text-emerald-700 ${className}`}
        >
          <MessageSquare className="mr-1 h-3.5 w-3.5" />
          Feedback
        </Button>
      )}

      {variant === 'ghost-icon' && (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => setIsOpen(true)}
          title="Report Bug / Feedback"
          className={`h-8 w-8 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-emerald-700 ${className}`}
        >
          <MessageSquare className="h-4 w-4" />
        </Button>
      )}

      <GlobalFeedbackModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        activeModule={activeModule}
        activeStepContext={activeStepContext}
        planId={planId}
        planTitle={planTitle}
        userEmail={userEmail}
        userName={userName}
      />
    </>
  );
}

interface GlobalFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeModule?: string;
  activeStepContext?: string;
  planId?: string;
  planTitle?: string;
  userEmail?: string;
  userName?: string;
}

export function GlobalFeedbackModal({
  isOpen,
  onClose,
  activeModule = 'GLOBAL',
  activeStepContext,
  planId,
  planTitle,
  userEmail,
  userName,
}: GlobalFeedbackModalProps) {
  const [ticketType, setTicketType] = useState<SupportTicketType>('BUG');
  const [description, setDescription] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [telemetry, setTelemetry] = useState<DeviceTelemetry | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTelemetry(detectDeviceTelemetry());
      setIsSubmitted(false);
      setErrorMessage(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const currentPath =
    typeof window !== 'undefined' ? window.location.pathname : '/';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMessage('Please describe what happened or what you would like to see.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const oneLineDesc = description.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
      const res = await submitFeedbackAction({
        ticketType,
        priority: ticketType === 'BUG' ? 'HIGH' : 'MEDIUM',
        moduleScope: (activeModule as SupportModuleScope) || 'GLOBAL',
        stepContext: activeStepContext || null,
        pageUrl: currentPath,
        planId: planId || null,
        planTitle: planTitle || null,
        title: `${ticketType === 'BUG' ? 'Bug Report' : ticketType === 'IMPROVEMENT' ? 'Feature Idea' : 'Feedback'}: ${oneLineDesc.slice(0, 50)}...`,
        description: description.trim(),
        expectedBehavior: expectedBehavior.trim() || null,
        reporterEmail: userEmail || customEmail.trim() || null,
        reporterName: userName || null,
        deviceInfo: telemetry?.summary || null,
        deviceMetadata: telemetry
          ? {
              deviceType: telemetry.deviceType,
              os: telemetry.os,
              browser: telemetry.browser,
              screenResolution: telemetry.screenResolution,
              viewport: telemetry.viewport,
              isTouch: telemetry.isTouch,
              pixelRatio: telemetry.pixelRatio,
              orientation: telemetry.orientation,
            }
          : null,
      });

      if (!res.ok) {
        setErrorMessage(res.error || 'Failed to send feedback. Please try again.');
        setIsSubmitting(false);
        return;
      }

      setIsSubmitted(true);
      setTimeout(() => {
        setDescription('');
        setExpectedBehavior('');
        setCustomEmail('');
        onClose();
      }, 1800);
    } catch {
      setErrorMessage('Network error submitting feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const categoryOptions: Array<{
    type: SupportTicketType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    description: string;
  }> = [
    {
      type: 'BUG',
      label: 'Bug / Broken',
      icon: Bug,
      color: 'rose',
      description: 'Something didn’t work or looked broken',
    },
    {
      type: 'IMPROVEMENT',
      label: 'Idea / Feature',
      icon: Sparkles,
      color: 'emerald',
      description: 'A feature or workflow you’d love to see',
    },
    {
      type: 'USER_SUPPORT',
      label: 'Confusing / Help',
      icon: HelpCircle,
      color: 'amber',
      description: 'A question or confusing instruction',
    },
    {
      type: 'OTHER',
      label: 'General Note',
      icon: Heart,
      color: 'emerald',
      description: 'Love something or general feedback',
    },
  ];

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 sm:p-6 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="relative my-auto w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
        >
          <X className="h-4 w-4" />
        </button>

        {isSubmitted ? (
          <div className="py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-lg font-bold text-slate-900">
              Feedback Received!
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              Thank you for helping us polish Startup Preflight. We review and
              act on every note directly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-emerald-800">
                  <MessageSquare className="h-4 w-4" />
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Give Feedback or Report a Bug
                </h3>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Found a glitch or have an idea? Let us know so we can fix or
                improve it right away.
              </p>
            </div>

            {/* Category Selector */}
            <div>
              <Label className="mb-1.5 block text-xs font-semibold text-slate-700">
                What type of feedback is this?
              </Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {categoryOptions.map((opt) => {
                  const Icon = opt.icon;
                  const active = ticketType === opt.type;
                  return (
                    <button
                      key={opt.type}
                      type="button"
                      onClick={() => setTicketType(opt.type)}
                      className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition-all ${
                        active
                          ? 'border-emerald-700 bg-emerald-50/70 ring-2 ring-emerald-700/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 ${
                          active ? 'text-emerald-700' : 'text-slate-500'
                        }`}
                      />
                      <span
                        className={`mt-1 text-xs font-bold ${
                          active ? 'text-slate-950' : 'text-slate-700'
                        }`}
                      >
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description Textarea */}
            <div>
              <Label className="mb-1 block text-xs font-semibold text-slate-700">
                {ticketType === 'BUG'
                  ? 'What happened?'
                  : ticketType === 'IMPROVEMENT'
                    ? 'What would you like to see?'
                    : 'What’s on your mind?'}
              </Label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  ticketType === 'BUG'
                    ? 'e.g., When I clicked "Calculate Breakeven" on my phone, the button stayed spinning and didn’t update the table...'
                    : ticketType === 'IMPROVEMENT'
                      ? 'e.g., It would be great to export this specific table as a CSV or have a dark mode toggle...'
                      : 'Share your questions, feedback, or thoughts...'
                }
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden sm:text-xs"
              />
            </div>

            {/* Expected Behavior (Shown for bugs) */}
            {ticketType === 'BUG' && (
              <div>
                <Label className="mb-1 block text-xs font-semibold text-slate-700">
                  What did you expect to happen?{' '}
                  <span className="font-normal text-slate-400">(Optional)</span>
                </Label>
                <Input
                  type="text"
                  value={expectedBehavior}
                  onChange={(e) => setExpectedBehavior(e.target.value)}
                  placeholder="e.g., The table should refresh with Year 1 numbers"
                  className="text-base sm:text-xs"
                />
              </div>
            )}

            {/* Optional Email (if user not logged in) */}
            {!userEmail && (
              <div>
                <Label className="mb-1 block text-xs font-semibold text-slate-700">
                  Your Email{' '}
                  <span className="font-normal text-slate-400">
                    (Optional — so we can follow up with you)
                  </span>
                </Label>
                <Input
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="founder@example.com"
                  className="text-base sm:text-xs"
                />
              </div>
            )}

            {errorMessage && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs font-medium text-rose-700">
                {errorMessage}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={isSubmitting}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || !description.trim()}
                className="bg-emerald-700 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-800"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-1.5 h-3.5 w-3.5" />
                    Send Feedback
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
