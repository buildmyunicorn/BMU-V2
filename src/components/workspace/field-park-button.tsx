'use client';

import React, { useState } from 'react';
import { BookmarkPlus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface FieldParkButtonProps {
  moduleCode: string;
  stepNumber: number;
  fieldId: string;
  questionLabel: string;
  suggestedAction?: string;
  onPark?: (questionText: string) => void;
  onParked?: (questionText: string) => void;
  planId?: string;
  disabled?: boolean;
  className?: string;
  size?: 'xs' | 'sm';
}

/**
 * Standardized inline question-level parking button.
 * Encodes [Module X Step Y #field-id] prefix into question text
 * so clicking the parked question deep-links directly to the field.
 */
export function FieldParkButton({
  moduleCode,
  stepNumber,
  fieldId,
  questionLabel,
  suggestedAction,
  onPark,
  onParked,
  planId,
  disabled = false,
  className = '',
  size = 'xs',
}: FieldParkButtonProps) {
  const [justParked, setJustParked] = useState(false);

  const handlePark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || justParked) return;

    // Build the deep-linkable structured question text:
    // Format: [Module B Step 1 #field-id] Question Label: Action/details
    const modLetter = moduleCode.replace('MOD_', '').replace(/_.*/, '');
    const prefix = `[Module ${modLetter} Step ${stepNumber} #${fieldId}]`;
    const details = suggestedAction ? ` - ${suggestedAction}` : '';
    const fullText = `${prefix} ${questionLabel}${details}`;

    const parkFn = onPark || onParked;
    if (parkFn) {
      parkFn(fullText);
    }
    setJustParked(true);
    setTimeout(() => setJustParked(false), 2800);
  };

  const isSmall = size === 'xs';

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={disabled}
      onClick={handlePark}
      title="Not sure yet? Park this specific question in your Parking Lot to decide later"
      className={`h-6 px-2 text-[11px] font-medium transition-colors ${
        justParked
          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          : 'text-slate-500 hover:bg-amber-50 hover:text-amber-800'
      } ${className}`}
    >
      {justParked ? (
        <>
          <Check className="mr-1 h-3 w-3 text-emerald-600" />
          <span className="text-emerald-700 font-semibold">Parked</span>
        </>
      ) : (
        <>
          <BookmarkPlus className="mr-1 h-3 w-3 text-amber-600/80" />
          <span>Park Question</span>
        </>
      )}
    </Button>
  );
}

/**
 * Smoothly scrolls to a DOM element, retrying if necessary until mounted,
 * pulses it with the sovereign attention highlight animation, and focuses it.
 */
export function scrollAndHighlightElement(
  targetId?: string,
  maxAttempts = 30,
  intervalMs = 50
) {
  if (typeof window === 'undefined' || !targetId) return;
  let attempts = 0;
  const timer = setInterval(() => {
    attempts++;
    const el = document.getElementById(targetId);
    if (el) {
      clearInterval(timer);
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.remove('attention-highlight');
      // Force DOM reflow to re-trigger CSS animation
      void el.offsetWidth;
      el.classList.add('attention-highlight');
      if (
        typeof (el as HTMLElement).focus === 'function' &&
        (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')
      ) {
        (el as HTMLElement).focus({ preventScroll: true });
      } else {
        const childInput = el.querySelector<HTMLInputElement | HTMLTextAreaElement>(
          'input:not([type="hidden"]), textarea'
        );
        if (childInput && typeof childInput.focus === 'function') {
          childInput.focus({ preventScroll: true });
        }
      }
      setTimeout(() => {
        el.classList.remove('attention-highlight');
      }, 3000);
    } else if (attempts >= maxAttempts) {
      clearInterval(timer);
    }
  }, intervalMs);
}

