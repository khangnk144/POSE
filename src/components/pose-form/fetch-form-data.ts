import 'server-only';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import type { ExistingImage } from './form-image';
import type { FormValues } from './form-values';
import { rowToFormValues } from './pose-row-mapping';

const SIGNED_URL_SECONDS = 60 * 60;

/**
 * Tags already used by poses, most used first (the PostgREST equivalent of
 * `select distinct unnest(tags)`, ordered by frequency). Failure just means no suggestions.
 */
export async function fetchTagSuggestions(limit = 100): Promise<string[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from('poses').select('tags').limit(2000);
  if (error || !data) return [];
  const counts = new Map<string, number>();
  for (const { tags } of data) for (const t of tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'vi'))
    .slice(0, limit)
    .map(([tag]) => tag);
}

export type PoseForEdit = { values: FormValues; images: ExistingImage[] };

/** Loads a pose and its images (thumbs as signed URLs) for the edit form; null when missing. */
export async function fetchPoseForEdit(poseId: string): Promise<PoseForEdit | null> {
  const supabase = await createSupabaseServerClient();
  const [poseRes, imagesRes] = await Promise.all([
    supabase.from('poses').select('*').eq('id', poseId).maybeSingle(),
    supabase.from('pose_images').select('*').eq('pose_id', poseId).order('position'),
  ]);
  if (poseRes.error) throw new Error(poseRes.error.message);
  if (imagesRes.error) throw new Error(imagesRes.error.message);
  if (!poseRes.data) return null;

  const rows = imagesRes.data ?? [];
  const signed = rows.length
    ? await supabase.storage.from('pose-images').createSignedUrls(
        rows.map((r) => r.thumb_path),
        SIGNED_URL_SECONDS,
      )
    : { data: [], error: null };
  if (signed.error) throw new Error(signed.error.message);

  const urlByPath = new Map((signed.data ?? []).map((s) => [s.path, s.signedUrl]));
  const images: ExistingImage[] = rows.map((r) => ({
    kind: 'existing',
    id: r.id,
    fullPath: r.full_path,
    thumbPath: r.thumb_path,
    width: r.width,
    height: r.height,
    dominantColor: r.dominant_color,
    previewUrl: urlByPath.get(r.thumb_path) ?? '',
  }));
  return { values: rowToFormValues(poseRes.data), images };
}
