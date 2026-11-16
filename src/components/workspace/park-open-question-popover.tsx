'use client';

import React, { useEffect, useState } from 'react';
import { BookmarkPlus, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  parkOpenQuestionAction,
  type OpenQuestionModuleCode,
} from '@/app/actions/module-a';

export interface ParkOpenQuestionPopoverProps {
  planId: string;
  moduleCode: OpenQuestionModuleCode;
  stepNumber?: number;
  stepLabel?: string;
  suggestedQuestion?: string;
  defaultQuestion?: string;
  onParked?: (questionText: string) => void;
  onParkQuestion?: (questionText: string) => void | Promise<void>;
  disabled?: boolean;
  buttonLabel?: string;
  buttonClassName?: string;
  align?: 'start' | 'end';
}

export function ParkOpenQuestionPopover({
  planId,
  moduleCode,
  stepNumber,
  stepLabel,
  suggestedQuestion,
  defaultQuestion,
  onParked,
  onParkQuestion,
  disabled = false,
  buttonLabel = 'Not Sure Yet? Park Question',
  buttonClassName,
  align = 'start',
}: ParkOpenQuestionPopoverProps) {
  const initialQuestion =
    suggestedQuestion ??
    defaultQuestion ??
    'Confirm this detail with our mentor, advisor, or accountant before finalizing.';
  const [isOpen, setIsOpen] = useState(false);
  const [draftQuestion, setDraftQuestion] = useState(initialQuestion);
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setDraftQuestion(initialQuestion);
    }
  }, [initialQuestion, isOpen]);

  const handleSave = async () => {
    const trimmed = draftQuestion.trim();
    if (!trimmed || isSaving || disabled) return;

    const prefixed =
      stepNumber && !trimmed.toLowerCase().startsWith('[step')
        ? `[Step ${stepNumber}] ${trimmed}`
        : stepLabel && !trimmed.startsWith('[')
          ? `[${stepLabel}] ${trimmed}`
          : trimmed;

    setIsSaving(true);
    try {
      await parkOpenQuestionAction({
        planId,
        sourceModule: moduleCode,
        questionText: prefixed,
      });
      onParked?.(prefixed);
      await onParkQuestion?.(prefixed);
      setIsOpen(false);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2400);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative inline-block">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={
          buttonClassName ||
          'h-7 border-slate-200 bg-white text-[11px] font-medium text-slate-700 hover:bg-slate-50'
        }
      >
        {justSaved ? (
          <>
            <Check className="mr-1 h-3.5 w-3.5 text-emerald-700" />
            <span className="text-emerald-800">Saved to Open Questions</span>
          </>
        ) : (
          <>
            <BookmarkPlus className="mr-1 h-3.5 w-3.5 text-slate-600" />
            {buttonLabel}
          </>
        )}
      </Button>

      {isOpen && (
        <div
          className={`mt-2 w-full min-w-[280px] max-w-md rounded-xl border border-slate-200 bg-white p-3.5 shadow-md sm:absolute sm:z-30 sm:w-96 ${
            align === 'end' ? 'sm:right-0' : 'sm:left-0'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-slate-900">
                Park in Open Questions
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600">
                What do you need to check or ask a mentor/accountant later?
                (Pre-filled with a suggestion—edit freely)
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close park question popover"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <textarea
            rows={3}
            value={draftQuestion}
            onChange={(e) => setDraftQuestion(e.target.value)}
            placeholder="What do you need to check or ask a mentor/accountant later?"
            className="mt-2.5 w-full rounded-lg border border-slate-300 bg-slate-50/60 p-2.5 text-base leading-relaxed text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none sm:text-xs"
          />

          <div className="mt-2.5 flex items-center justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="h-7 px-2.5 text-xs text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!draftQuestion.trim() || isSaving}
              onClick={handleSave}
              className="h-7 bg-emerald-700 px-3 text-xs font-semibold text-white hover:bg-emerald-800"
            >
              {isSaving ? 'Saving...' : 'Save to Parking Lot'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
