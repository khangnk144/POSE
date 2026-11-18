import type { PoseDraft } from '@/lib/schemas/pose-draft-schema';
import { SCENES } from '@/lib/types/pose';
import { type FieldKey, type FormValues, hasValue } from './form-values';

/** Fields AI may fill. Status, place and source are the team's call, never the model's. */
export const AI_FIELDS = [
  'title',
  'description',
  'peopleCount',
  'posture',
  'scenes',
  'tags',
  'cameraHeight',
  'cameraTilt',
  'zoom',
  'orientation',
  'photographerPosition',
  'distanceM',
  'grid',
  'modelSteps',
  'tips',
] as const satisfies readonly FieldKey[];

/** Fields the user has typed in or that came with the saved pose: AI must not overwrite them. */
export function initialLockedFields(values: FormValues): Set<FieldKey> {
  const locked = new Set<FieldKey>();
  for (const key of Object.keys(values) as FieldKey[]) if (hasValue(values, key)) locked.add(key);
  return locked;
}

function dedupe(list: string[]): string[] {
  const seen = new Set<string>();
  return list.filter((s) => {
    const k = s.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** Normalised AI value for `key`, or undefined when unusable. */
function pickAiValue(key: (typeof AI_FIELDS)[number], ai: Partial<PoseDraft>): unknown {
  const v = ai[key];
  if (v === undefined || v === null) return undefined;
  if (typeof v === 'string') return v.trim() === '' ? undefined : v.trim();
  if (key === 'scenes') {
    const known = (v as string[]).filter((s) => (SCENES as readonly string[]).includes(s));
    return known.length ? dedupe(known) : undefined;
  }
  if (Array.isArray(v)) {
    const clean = v.map((s) => String(s).trim()).filter(Boolean);
    return clean.length ? (key === 'tags' ? dedupe(clean) : clean) : undefined;
  }
  if (typeof v === 'number' && !Number.isFinite(v)) return undefined;
  return v;
}

/**
 * Merges an AI answer into the form. A field is only written when the user has not
 * touched it (`locked` holds touched + pre-filled fields). Returns the new values and the
 * keys that were filled, so the UI can highlight them.
 */
export function mergeAiDraft(
  values: FormValues,
  ai: Partial<PoseDraft>,
  locked: ReadonlySet<FieldKey>,
): { values: FormValues; filled: FieldKey[] } {
  const next: Record<string, unknown> = { ...values };
  const filled: FieldKey[] = [];
  for (const key of AI_FIELDS) {
    if (locked.has(key)) continue;
    const value = pickAiValue(key, ai);
    if (value === undefined) continue;
    next[key] = value;
    filled.push(key);
  }
  return { values: next as FormValues, filled };
}
