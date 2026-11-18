import type { Metadata } from 'next';
import { ProfileForm } from '@/components/team/profile-form';
import { requireMember } from '@/lib/supabase/session';

export const metadata: Metadata = { title: 'Hồ sơ' };

export default async function ProfilePage() {
  const me = await requireMember();
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <h1 className="font-display text-[22px] font-bold leading-[30px]">Hồ sơ</h1>
      <ProfileForm
        userId={me.id}
        displayName={me.display_name}
        avatarEmoji={me.avatar_emoji}
        avatarColor={me.avatar_color}
      />
    </div>
  );
}
