'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { AutosaveStatus } from '@/components/workspace/autosave-status-indicator';

export interface UseAutosaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void> | void;
  debounceMs?: number;
  isReadonly?: boolean;
  storageKey?: string;
  onStatusChange?: (status: AutosaveStatus, lastSavedAt?: Date) => void;
  enabled?: boolean;
}

export interface UseAutosaveResult {
  saveStatus: AutosaveStatus;
  lastSavedAt: Date | null;
  flush: () => Promise<void>;
  isDirty: boolean;
}

export function useAutosave<T>({
  data,
  onSave,
  debounceMs = 1200,
  isReadonly = false,
  storageKey,
  onStatusChange,
  enabled = true,
}: UseAutosaveOptions<T>): UseAutosaveResult {
  const [saveStatus, setSaveStatus] = useState<AutosaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const isFirstRender = useRef(true);
  const isDirtyRef = useRef(false);
  const isSavingRef = useRef(false);
  const dataRef = useRef(data);
  dataRef.current = data;

  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  const onStatusChangeRef = useRef(onStatusChange);
  onStatusChangeRef.current = onStatusChange;

  const updateStatus = useCallback((status: AutosaveStatus, date?: Date) => {
    setSaveStatus(status);
    if (date) setLastSavedAt(date);
    if (onStatusChangeRef.current) {
      onStatusChangeRef.current(status, date);
    }
  }, []);

  const flush = useCallback(async () => {
    if (isReadonly || !enabled || !isDirtyRef.current || isSavingRef.current) {
      return;
    }

    try {
      isSavingRef.current = true;
      updateStatus('saving');

      await onSaveRef.current(dataRef.current);

      isDirtyRef.current = false;
      setIsDirty(false);
      const now = new Date();
      updateStatus('saved', now);
    } catch (err) {
      console.error('Autosave flush failed:', err);
      updateStatus('error');
    } finally {
      isSavingRef.current = false;
    }
  }, [isReadonly, enabled, updateStatus]);

  // Handle data updates and debounced save
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (isReadonly || !enabled) return;

    // Mark as dirty
    isDirtyRef.current = true;
    setIsDirty(true);

    // Immediate local storage backup
    if (storageKey && typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(
          storageKey,
          JSON.stringify({
            data,
            timestamp: new Date().toISOString(),
          })
        );
      } catch {
        // Safe quota ignore
      }
    }

    updateStatus('saving');

    const timer = setTimeout(() => {
      flush();
    }, debounceMs);

    return () => {
      clearTimeout(timer);
    };
  }, [data, debounceMs, isReadonly, enabled, storageKey, updateStatus, flush]);

  // Flush on unmount so switching modules/steps never loses in-flight edits
  useEffect(() => {
    return () => {
      if (isDirtyRef.current && !isSavingRef.current && !isReadonly && enabled) {
        // Fire and forget on unmount
        void onSaveRef.current(dataRef.current);
      }
    };
  }, [isReadonly, enabled]);

  return {
    saveStatus,
    lastSavedAt,
    flush,
    isDirty,
  };
}
