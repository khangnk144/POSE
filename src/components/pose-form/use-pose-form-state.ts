'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PoseDraft } from '@/lib/schemas/pose-draft-schema';
import type { FieldKey, FormValues } from './form-values';
import { initialLockedFields, mergeAiDraft } from './merge-ai-draft';

const FLASH_MS = 1600;

/**
 * Form values plus dirty tracking. `set` marks a field as touched; `applyAi` merges an AI
 * answer into untouched fields only and flashes the ones it filled.
 */
export function usePoseFormState(initial: FormValues) {
  const [values, setValues] = useState(initial);
  const [flash, setFlash] = useState<ReadonlySet<FieldKey>>(new Set());
  const locked = useRef<Set<FieldKey>>(initialLockedFields(initial));
  const [touchedAny, setTouchedAny] = useState(false);
  const valuesRef = useRef(values);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    valuesRef.current = values;
  }, [values]);
  useEffect(() => () => { if (flashTimer.current) clearTimeout(flashTimer.current); }, []);

  const set = useCallback(<K extends FieldKey>(key: K, value: FormValues[K]) => {
    locked.current.add(key);
    setTouchedAny(true);
    setValues((v) => ({ ...v, [key]: value }));
  }, []);

  /** Returns the keys that were filled. */
  const applyAi = useCallback((ai: Partial<PoseDraft>): FieldKey[] => {
    const { values: next, filled } = mergeAiDraft(valuesRef.current, ai, locked.current);
    if (filled.length > 0) {
      setValues(next);
      setTouchedAny(true);
      setFlash(new Set(filled));
      if (flashTimer.current) clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setFlash(new Set()), FLASH_MS);
    }
    return filled;
  }, []);

  return { values, set, applyAi, flash, dirty: touchedAny };
}
