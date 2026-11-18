import type { SupabaseClient } from '@supabase/supabase-js';
import type { PoseDraft } from '@/lib/schemas/pose-draft-schema';
import type { Database } from '@/lib/types/database';

type DraftIdea = Partial<PoseDraft> & { title: string };

/**
 * Save an AI idea as a draft pose (no images). Runs as the signed-in member (RLS applies;
 * `created_by` defaults to the caller). Returns the new pose id.
 */
export async function saveIdeaAsDraft(supabase: SupabaseClient<Database>, idea: DraftIdea): Promise<string> {
  const { data, error } = await supabase
    .from('poses')
    .insert({
      title: idea.title,
      status: 'draft',
      description: idea.description ?? null,
      people_count: idea.peopleCount ?? null,
      posture: idea.posture ?? null,
      scenes: idea.scenes ?? [],
      tags: idea.tags ?? [],
      camera_height: idea.cameraHeight ?? null,
      camera_tilt: idea.cameraTilt ?? null,
      zoom: idea.zoom ?? null,
      orientation: idea.orientation ?? null,
      photographer_position: idea.photographerPosition ?? null,
      distance_m: idea.distanceM ?? null,
      grid: idea.grid ?? null,
      model_steps: idea.modelSteps ?? [],
      tips: idea.tips ?? null,
    })
    .select('id')
    .single();
  if (error || !data) throw new Error(error?.message ?? 'insert failed');
  return data.id;
}
