'use client';

import { usePathname } from 'next/navigation';
import { OnlineAvatarStack } from '@/components/team/online-avatar-stack';
import { Logo } from '@/components/ui/logo';
import { AddFab } from './add-fab';
import { AvatarMenu } from './avatar-menu';
import { BottomTabBar } from './bottom-tab-bar';

export type ShellProfile = {
  displayName: string;
  avatarEmoji: string;
  avatarColor: string;
  role: 'admin' | 'member';
};

/** Routes that use the full screen (own sticky action bar): no tab bar or FAB there. */
const IMMERSIVE_ROUTES = [/^\/poses\/new$/, /^\/poses\/[^/]+\/edit$/];
/** Pose detail has its own bottom action bar, which the FAB would cover. */
const NO_FAB_ROUTES = [/^\/poses\/[^/]+$/];

/**
 * Mobile app frame: sticky header (logo + avatar menu), content, bottom tab bar, FAB.
 * Pages render inside `children` and should not add their own header.
 */
export function AppShell({ profile, children }: { profile: ShellProfile; children: React.ReactNode }) {
  const pathname = usePathname();
  const immersive = IMMERSIVE_ROUTES.some((re) => re.test(pathname));
  const showFab = !NO_FAB_ROUTES.some((re) => re.test(pathname));

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-bg/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur">
        <Logo size={28} />
        <div className="flex items-center gap-2">
          <OnlineAvatarStack />
          <AvatarMenu profile={profile} />
        </div>
      </header>
      <main
        className="mx-auto w-full max-w-[1200px] flex-1 px-4 pt-4 md:px-6"
        style={{ paddingBottom: immersive ? 24 : 'calc(var(--tab-bar-h) + 88px + env(safe-area-inset-bottom))' }}
      >
        {children}
      </main>
      {immersive ? null : (
        <>
          <BottomTabBar />
          {showFab ? <AddFab /> : null}
        </>
      )}
    </div>
  );
}
