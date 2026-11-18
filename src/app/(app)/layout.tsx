import { AppShell } from '@/components/shell/app-shell';
import { requireMember } from '@/lib/supabase/session';

/** Every page under (app) needs a signed-in team member: others are redirected. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireMember();
  return (
    <AppShell
      profile={{
        displayName: profile.display_name,
        avatarEmoji: profile.avatar_emoji,
        avatarColor: profile.avatar_color,
        role: profile.role as 'admin' | 'member',
      }}
    >
      {children}
    </AppShell>
  );
}
