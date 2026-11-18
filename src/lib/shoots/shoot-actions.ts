import { z } from 'zod';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';

export const shootInputSchema = z.object({
  name: z.string().trim().min(1, 'Bạn đặt tên buổi chụp nha.').max(120, 'Tên dài quá, tối đa 120 ký tự.'),
  shootDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  placeId: z.string().uuid().nullable().optional(),
});
export type ShootInput = z.input<typeof shootInputSchema>;

function parse(input: ShootInput) {
  const r = shootInputSchema.safeParse(input);
  if (!r.success) throw new Error(r.error.issues[0]?.message ?? 'Thông tin buổi chụp chưa hợp lệ.');
  return { name: r.data.name, shoot_date: r.data.shootDate ?? null, place_id: r.data.placeId ?? null };
}

/** @returns the new shoot id. */
export async function createShoot(input: ShootInput): Promise<string> {
  const { data, error } = await createSupabaseBrowserClient().from('shoots').insert(parse(input)).select('id').single();
  if (error) throw new Error(error.message);
  return data.id;
}

export async function updateShoot(id: string, input: ShootInput): Promise<void> {
  const { error } = await createSupabaseBrowserClient().from('shoots').update(parse(input)).eq('id', id);
  if (error) throw new Error(error.message);
}

/** Creator or admin only (RLS); a filtered-out delete is reported as an error. */
export async function deleteShoot(id: string): Promise<void> {
  const { data, error } = await createSupabaseBrowserClient().from('shoots').delete().eq('id', id).select('id');
  if (error) throw new Error(error.message);
  if (data.length === 0) throw new Error('Chỉ người tạo hoặc admin mới xoá được buổi chụp này.');
}

export type ShootOption = { id: string; name: string; shootDate: string | null };

/** Browser-side: shoots for the "add to shoot" sheet, newest first. */
export async function listShootOptions(): Promise<ShootOption[]> {
  const { data, error } = await createSupabaseBrowserClient()
    .from('shoots')
    .select('id, name, shoot_date')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data.map((s) => ({ id: s.id, name: s.name, shootDate: s.shoot_date }));
}
