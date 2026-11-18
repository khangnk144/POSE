import type { Metadata } from 'next';
import Link from 'next/link';
import { InviteCodePanel } from '@/components/team/invite-code-panel';
import { MemberList, type MemberView } from '@/components/team/member-list';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { requireMember } from '@/lib/supabase/session';

export const metadata: Metadata = { title: 'Team' };

export default async function TeamPage() {
  const me = await requireMember();
  const supabase = await createSupabaseServerClient();

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_emoji, avatar_color, role, created_at')
    .order('created_at');
  if (error) throw new Error(error.message);

  const members: MemberView[] = profiles
    .map((p) => ({
      id: p.id,
      displayName: p.display_name,
      avatarEmoji: p.avatar_emoji,
      avatarColor: p.avatar_color,
      role: p.role as 'admin' | 'member',
    }))
    .sort((a, b) => Number(b.role === 'admin') - Number(a.role === 'admin'));

  // RLS only returns this row for admins; members never receive the code.
  let inviteCode: string | null = null;
  if (me.role === 'admin') {
    const { data } = await supabase.from('team_settings').select('invite_code').eq('id', 1).maybeSingle();
    inviteCode = data?.invite_code ?? null;
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-bold leading-[30px]">Team</h1>
          <p className="text-sm text-text-2">{members.length} thành viên</p>
        </div>
        <Link href="/profile" className="inline-flex min-h-11 items-center px-3 font-semibold text-primary">
          Sửa hồ sơ
        </Link>
      </div>
      <MemberList members={members} meId={me.id} />
      {inviteCode ? <InviteCodePanel initialCode={inviteCode} /> : null}
    </div>
  );
}
