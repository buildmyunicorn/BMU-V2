'use client';

import React from 'react';
import { Cloud, Check, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface AutosaveStatusIndicatorProps {
  status: AutosaveStatus;
  lastSavedAt?: Date | null;
  onRetry?: () => void;
  className?: string;
}

export function AutosaveStatusIndicator({
  status,
  lastSavedAt,
  onRetry,
  className = '',
}: AutosaveStatusIndicatorProps) {
  // Format the time as HH:mm:ss if available
  const formattedTime = lastSavedAt
    ? lastSavedAt.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : null;

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all ${
        status === 'saving'
          ? 'border-slate-200 bg-emerald-50/80 text-emerald-800 shadow-2xs'
          : status === 'error'
            ? 'border-amber-300 bg-amber-50 text-amber-800'
            : status === 'saved'
              ? 'border-emerald-200/70 bg-emerald-50/60 text-emerald-800'
              : 'border-slate-200/80 bg-slate-50/80 text-slate-500'
      } ${className}`}
      title={
        formattedTime
          ? `Autosave active. Last saved to cloud at ${formattedTime}.`
          : 'Autosave active: changes are automatically saved to your cloud plan.'
      }
    >
      {status === 'saving' && (
        <>
          <Loader2 className="h-3 w-3 animate-spin text-emerald-700" />
          <span className="font-semibold text-emerald-700">Saving...</span>
        </>
      )}

      {status === 'saved' && (
        <>
          <span className="flex h-3 w-3 items-center justify-center rounded-full bg-emerald-600 text-white">
            <Check className="h-2 w-2 stroke-[3]" />
          </span>
          <span className="text-emerald-800">
            Saved
            {formattedTime && (
              <span className="ml-1 hidden text-[10px] text-emerald-700/80 xl:inline">
                {formattedTime}
              </span>
            )}
          </span>
        </>
      )}

      {status === 'error' && (
        <>
          <AlertTriangle className="h-3 w-3 text-amber-600" />
          <span className="text-amber-800">Save issue</span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="ml-1 inline-flex items-center gap-0.5 rounded px-1 text-[10px] font-bold text-amber-900 underline hover:bg-amber-100"
            >
              <RefreshCw className="h-2.5 w-2.5" /> Retry
            </button>
          )}
        </>
      )}

      {status === 'idle' && (
        <>
          <Cloud className="h-3 w-3 text-slate-400" />
          <span className="hidden text-slate-500 sm:inline">Autosave on</span>
        </>
      )}
    </div>
  );
}
