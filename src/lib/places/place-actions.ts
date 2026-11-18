import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { placeInputSchema, type PlaceInput } from './place-schema';

export type PlaceOption = { id: string; name: string; address: string | null };

function parse(input: PlaceInput) {
  const result = placeInputSchema.safeParse(input);
  if (!result.success) throw new Error(result.error.issues[0]?.message ?? 'Thông tin địa điểm chưa hợp lệ.');
  const { name, address, mapsUrl, note } = result.data;
  return { name, address: address ?? null, maps_url: mapsUrl ?? null, note: note ?? null };
}

/** Browser-side: saved places for pickers, A-Z by name. */
export async function listPlaceOptions(): Promise<PlaceOption[]> {
  const { data, error } = await createSupabaseBrowserClient()
    .from('places')
    .select('id, name, address')
    .order('name');
  if (error) throw new Error(error.message);
  return data;
}

/** @returns the new place id. @throws on validation or request failure. */
export async function createPlace(input: PlaceInput): Promise<string> {
  const { data, error } = await createSupabaseBrowserClient()
    .from('places')
    .insert(parse(input))
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

export async function updatePlace(id: string, input: PlaceInput): Promise<void> {
  const { error } = await createSupabaseBrowserClient().from('places').update(parse(input)).eq('id', id);
  if (error) throw new Error(error.message);
}

/**
 * Allowed for the creator or an admin (RLS). A delete filtered out by RLS returns 0 rows, which is
 * reported as an error so the UI does not claim success.
 */
export async function deletePlace(id: string): Promise<void> {
  const { data, error } = await createSupabaseBrowserClient().from('places').delete().eq('id', id).select('id');
  if (error) throw new Error(error.message);
  if (data.length === 0) throw new Error('Chỉ người tạo hoặc admin mới xoá được địa điểm này.');
}
