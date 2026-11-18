import { z } from 'zod';
import { poseGridSchema, type PoseDraft } from '@/lib/schemas/pose-draft-schema';
import {
  CAMERA_HEIGHTS,
  CAMERA_TILTS,
  ORIENTATIONS,
  PEOPLE_COUNTS,
  POSTURES,
  SCENES,
  ZOOMS,
} from '@/lib/types/pose';

/**
 * Turns raw model tool input (untrusted JSON) into app data. Every field is validated on its own:
 * an invalid field is dropped, never fails the whole answer.
 */

export const MAX_MATCHES = 8;
export const MAX_IDEAS = 3;

const str = (max: number) => z.string().trim().min(1).max(max);

/** Keep valid items of an array, drop the rest, drop duplicates, cap the length. */
function listOf<T extends string>(item: z.ZodType<T>, max: number) {
  return z.array(z.unknown()).transform((items) => {
    const out: T[] = [];
    for (const it of items) {
      const r = item.safeParse(it);
      if (r.success && !out.includes(r.data)) out.push(r.data);
      if (out.length >= max) break;
    }
    return out;
  });
}

const fieldSchemas = {
  title: str(160),
  description: str(2000),
  peopleCount: z.enum(PEOPLE_COUNTS),
  posture: z.enum(POSTURES),
  scenes: listOf(z.enum(SCENES), 12),
  tags: listOf(str(40), 20),
  cameraHeight: z.enum(CAMERA_HEIGHTS),
  cameraTilt: z.enum(CAMERA_TILTS),
  zoom: z.enum(ZOOMS),
  orientation: z.enum(ORIENTATIONS),
  photographerPosition: str(300),
  distanceM: z.number().min(0).max(99.9).transform((n) => Math.round(n * 10) / 10),
  grid: poseGridSchema,
  modelSteps: listOf(str(300), 12),
  tips: str(1000),
} as const;

/** Validate model output for a pose; returns only the fields that passed. */
export function parsePoseFields(raw: unknown): Partial<PoseDraft> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {};
  const input = raw as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [key, schema] of Object.entries(fieldSchemas)) {
    if (!(key in input)) continue;
    const r = schema.safeParse(input[key]);
    if (!r.success) continue;
    // Empty lists carry no information; leave the field absent so the form stays untouched.
    if (Array.isArray(r.data) && r.data.length === 0) continue;
    out[key] = r.data;
  }
  return out as Partial<PoseDraft>;
}

export type SuggestScene = { summary: string; light: string; setting: string[]; tips: string[] };
export type SuggestMatch = { poseId: string; reason: string; cameraTip?: string };
export type SuggestIdea = Partial<PoseDraft> & { title: string; status: 'draft' };
export type SuggestResult =
  | { clear: false; reason: string }
  | { clear: true; scene: SuggestScene; matches: SuggestMatch[]; ideas: SuggestIdea[] };

const matchSchema = z.object({
  ref: z.number().int(),
  reason: str(240),
  cameraTip: str(240).optional().catch(undefined),
});

/**
 * @param refToPoseId maps the short catalog numbers shown to the model to real pose ids.
 *   Numbers missing from the map (hallucinated) are dropped, so only existing published
 *   poses can ever reach the client.
 */
export function parseSuggestOutput(
  raw: unknown,
  refToPoseId: ReadonlyMap<number, string>,
): SuggestResult {
  const input = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;

  if (input.sceneClear === false) {
    const why = str(300).safeParse(input.unclearReason);
    return { clear: false, reason: why.success ? why.data : '' };
  }

  const rawScene = (typeof input.scene === 'object' && input.scene !== null ? input.scene : {}) as Record<string, unknown>;
  const summary = str(400).safeParse(rawScene.summary);
  const light = str(300).safeParse(rawScene.light);
  const setting = listOf(str(60), 8).safeParse(rawScene.setting);
  const tips = listOf(str(240), 6).safeParse(rawScene.tips);
  const scene: SuggestScene = {
    summary: summary.success ? summary.data : '',
    light: light.success ? light.data : '',
    setting: setting.success ? setting.data : [],
    tips: tips.success ? tips.data : [],
  };

  const matches: SuggestMatch[] = [];
  const seen = new Set<string>();
  for (const item of Array.isArray(input.matches) ? input.matches : []) {
    const m = matchSchema.safeParse(item);
    if (!m.success) continue;
    const poseId = refToPoseId.get(m.data.ref);
    if (!poseId || seen.has(poseId)) continue;
    seen.add(poseId);
    matches.push({ poseId, reason: m.data.reason, ...(m.data.cameraTip ? { cameraTip: m.data.cameraTip } : {}) });
    if (matches.length >= MAX_MATCHES) break;
  }

  const ideas: SuggestIdea[] = [];
  for (const item of Array.isArray(input.ideas) ? input.ideas : []) {
    const fields = parsePoseFields(item);
    if (!fields.title) continue;
    ideas.push({ ...fields, title: fields.title, status: 'draft' });
    if (ideas.length >= MAX_IDEAS) break;
  }

  return { clear: true, scene, matches, ideas };
}
