'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bug,
  Plus,
  X,
  CheckCircle2,
  Copy,
  ExternalLink,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { createSupportTicketAction } from '@/app/actions/admin';
import {
  isLocalTestingEnvironment,
  upsertLocalSupportTicket,
  formatSupportTicketAsAiPrompt,
  SUPPORT_TICKET_TYPE_OPTIONS,
  SUPPORT_PRIORITY_OPTIONS,
  SUPPORT_MODULE_SCOPE_OPTIONS,
  type SupportTicketType,
  type SupportTicketPriority,
  type SupportModuleScope,
  type SupportTicketRecord,
} from '@/lib/support-tracker-store';

interface LocalBugCaptureWidgetProps {
  activeModule: string;
  activeStepContext?: string;
  planId: string;
  planTitle: string;
  userEmail?: string;
}

export function LocalBugCaptureWidget({
  activeModule,
  activeStepContext,
  planId,
  planTitle,
  userEmail,
}: LocalBugCaptureWidgetProps) {
  const [isLocalEnv, setIsLocalEnv] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const [ticketType, setTicketType] = useState<SupportTicketType>('BUG');
  const [customTypeText, setCustomTypeText] = useState<string>('');
  const [priority, setPriority] = useState<SupportTicketPriority>('MEDIUM');
  const [moduleScope, setModuleScope] = useState<SupportModuleScope>('GLOBAL');
  const [stepContext, setStepContext] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [expectedBehavior, setExpectedBehavior] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedTicket, setSavedTicket] = useState<SupportTicketRecord | null>(
    null
  );
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);

  useEffect(() => {
    setIsLocalEnv(isLocalTestingEnvironment());
  }, []);

  // Pre-populate Module & Step Context whenever modal opens
  function handleOpenModal() {
    const matchedModule = SUPPORT_MODULE_SCOPE_OPTIONS.find(
      (m) => m.value === activeModule
    )
      ? (activeModule as SupportModuleScope)
      : 'GLOBAL';
    setModuleScope(matchedModule);
    setStepContext(activeStepContext || '');
    setSavedTicket(null);
    setCopiedPrompt(false);
    setIsOpen(true);
  }

  // Strictly hidden on non-local deployments
  if (!isLocalEnv) {
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSaving(true);
    try {
      const pageUrl =
        typeof window !== 'undefined' ? window.location.pathname : '/workspace';
      const res = await createSupportTicketAction({
        source: 'ADMIN_TRACKER',
        ticketType,
        customTypeText:
          ticketType === 'OTHER' ? customTypeText.trim() || null : null,
        priority,
        moduleScope,
        stepContext: stepContext.trim() || null,
        pageUrl,
        planId,
        planTitle,
        reporterEmail: userEmail || 'local-admin@startuppreflight.com',
        title: title.trim(),
        description: description.trim(),
        expectedBehavior: expectedBehavior.trim() || null,
      });

      if (res.ok && res.ticket) {
        upsertLocalSupportTicket(res.ticket);
        setSavedTicket(res.ticket);
        setTitle('');
        setDescription('');
        setExpectedBehavior('');
        if (ticketType === 'OTHER') {
          setCustomTypeText('');
        }
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCopyPrompt() {
    if (!savedTicket) return;
    const text = formatSupportTicketAsAiPrompt(savedTicket);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch {
      // Ignore clipboard error
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleOpenModal}
        title="Local QA Only: Log a Bug or Improvement to the Admin Support Tracker"
        className="border-amber-300 bg-amber-50/90 px-2.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 sm:px-3"
      >
        <Bug className="h-3.5 w-3.5 text-amber-600" />
        <span className="hidden sm:inline">Log Bug / Idea</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3.5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                    <Bug className="h-4 w-4" />
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Quick-Log Bug or Improvement
                  </h3>
                  <Badge variant="warning" className="text-[10px]">
                    Local QA Only
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Saves directly to your{' '}
                  <strong>/admin Support &amp; Bug Tracker</strong> with your
                  current module and plan context attached.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {savedTicket ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-emerald-950">
                  <div className="flex items-center gap-2 text-sm font-bold text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Saved to Admin Support &amp; Bug Tracker!
                  </div>
                  <p className="mt-1 text-xs text-emerald-800">
                    <strong>{savedTicket.title}</strong> ({savedTicket.priority}{' '}
                    • {savedTicket.moduleScope}
                    {savedTicket.stepContext
                      ? ` • ${savedTicket.stepContext}`
                      : ''}
                    )
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopyPrompt}
                      className="border-indigo-200 bg-indigo-50 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                    >
                      {copiedPrompt ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          Copied AI Prompt!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Copy AI Fix Prompt
                        </>
                      )}
                    </Button>

                    <Link href="/admin?tab=support">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        View in /admin
                      </Button>
                    </Link>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSavedTicket(null)}
                      className="text-xs"
                    >
                      + Log Another
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                      className="bg-indigo-600 text-xs text-white hover:bg-indigo-700"
                    >
                      Back to Testing
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
                {/* Type Selector Pills (including OTHER) */}
                <div>
                  <Label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Type
                  </Label>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    {SUPPORT_TICKET_TYPE_OPTIONS.filter(
                      (t) => t.value !== 'USER_SUPPORT'
                    ).map((opt) => {
                      const active = ticketType === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setTicketType(opt.value)}
                          className={`rounded-lg border px-2.5 py-2 text-left text-xs font-semibold transition-all ${
                            active
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-950 ring-1 ring-indigo-500/30'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  {ticketType === 'OTHER' && (
                    <Input
                      type="text"
                      value={customTypeText}
                      onChange={(e) => setCustomTypeText(e.target.value)}
                      placeholder="Custom category name..."
                      className="mt-2 text-base sm:text-xs"
                    />
                  )}
                </div>

                {/* Priority & Auto-Captured Module/Step */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="mb-1 block text-xs font-semibold text-slate-700">
                      Module (Auto-Detected)
                    </Label>
                    <select
                      value={moduleScope}
                      onChange={(e) =>
                        setModuleScope(e.target.value as SupportModuleScope)
                      }
                      className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-base text-slate-900 sm:text-xs"
                    >
                      {SUPPORT_MODULE_SCOPE_OPTIONS.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.shortBadge}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label className="mb-1 block text-xs font-semibold text-slate-700">
                      Step / Sub-Tab Context
                    </Label>
                    <Input
                      type="text"
                      value={stepContext}
                      onChange={(e) => setStepContext(e.target.value)}
                      placeholder="e.g., Step 3 or Blind-Spot Review"
                      className="text-base sm:text-xs"
                    />
                  </div>
                </div>

                <div>
                  <Label className="mb-1 block text-xs font-semibold text-slate-700">
                    Priority
                  </Label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {SUPPORT_PRIORITY_OPTIONS.map((p) => {
                      const active = priority === p.value;
                      return (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setPriority(p.value)}
                          className={`rounded-lg border py-1.5 text-center text-[11px] font-semibold transition-colors ${
                            active
                              ? p.value === 'CRITICAL'
                                ? 'border-rose-600 bg-rose-600 text-white'
                                : p.value === 'HIGH'
                                  ? 'border-amber-500 bg-amber-500 text-white'
                                  : 'border-indigo-600 bg-indigo-600 text-white'
                              : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {p.value}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <Label className="mb-1 block text-xs font-semibold text-slate-700">
                    Short Summary Title *
                  </Label>
                  <Input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What broke or needs improvement?"
                    className="text-base sm:text-xs"
                  />
                </div>

                <div>
                  <Label className="mb-1 block text-xs font-semibold text-slate-700">
                    Details / What You Observed *
                  </Label>
                  <textarea
                    required
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the bug or idea so you remember all the context later..."
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-base text-slate-900 focus:border-indigo-500 focus:outline-hidden sm:text-xs"
                  />
                </div>

                <div>
                  <Label className="mb-1 block text-xs font-semibold text-slate-700">
                    Expected / Desired Fix (Optional)
                  </Label>
                  <Input
                    type="text"
                    value={expectedBehavior}
                    onChange={(e) => setExpectedBehavior(e.target.value)}
                    placeholder="How should it work instead?"
                    className="text-base sm:text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSaving}
                    className="bg-indigo-600 text-xs text-white hover:bg-indigo-700"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {isSaving ? 'Saving...' : 'Save to Bug Tracker'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
