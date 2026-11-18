import { z } from 'zod';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { generateInviteCode } from './invite-code';

export const AVATAR_COLORS = [
  'avatar-1',
  'avatar-2',
  'avatar-3',
  'avatar-4',
  'avatar-5',
  'avatar-6',
  'avatar-7',
  'avatar-8',
] as const;

export const AVATAR_EMOJIS = [
  '🐼', '🐱', '🐶', '🐰', '🦊', '🐻', '🐨', '🐯',
  '🦁', '🐸', '🐵', '🐧', '🐥', '🦄', '🐙', '🦋',
  '🌸', '🌻', '🍓', '🍑', '🍋', '🥑', '🍩', '🧋',
] as const;

export const profileInputSchema = z.object({
  displayName: z.string().trim().min(1, 'Bạn nhập tên hiển thị nha.').max(40, 'Tên dài quá, tối đa 40 ký tự.'),
  avatarEmoji: z.enum(AVATAR_EMOJIS),
  avatarColor: z.enum(AVATAR_COLORS),
});
export type ProfileInput = z.infer<typeof profileInputSchema>;

/** Update the signed-in user's own name and avatar (RLS + column grant: role cannot change). */
export async function updateOwnProfile(userId: string, input: ProfileInput): Promise<void> {
  const r = profileInputSchema.safeParse(input);
  if (!r.success) throw new Error(r.error.issues[0]?.message ?? 'Hồ sơ chưa hợp lệ.');
  const { data, error } = await createSupabaseBrowserClient()
    .from('profiles')
    .update({ display_name: r.data.displayName, avatar_emoji: r.data.avatarEmoji, avatar_color: r.data.avatarColor })
    .eq('id', userId)
    .select('id');
  if (error) throw new Error(error.message);
  if (data.length === 0) throw new Error('Không lưu được hồ sơ.');
}

/** Admin only (RLS): replaces the invite code and returns the new one. */
export async function rotateInviteCode(): Promise<string> {
  const code = generateInviteCode();
  const { data, error } = await createSupabaseBrowserClient()
    .from('team_settings')
    .update({ invite_code: code })
    .eq('id', 1)
    .select('invite_code');
  if (error) throw new Error(error.message);
  if (data.length === 0) throw new Error('Chỉ admin mới đổi được mã mời.');
  return data[0].invite_code;
}
