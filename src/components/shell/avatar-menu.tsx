'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { FileEdit, Heart, LogOut, User, Users } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/toast';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import type { ShellProfile } from './app-shell';

const LINKS = [
  { href: '/?fav=1', label: 'Yêu thích', icon: Heart },
  { href: '/?status=draft', label: 'Nháp', icon: FileEdit },
  { href: '/team', label: 'Team', icon: Users },
  { href: '/profile', label: 'Hồ sơ', icon: User },
] as const;

/** Header avatar that opens the secondary menu (favorites, drafts, team, profile, sign out). */
export function AvatarMenu({ profile }: { profile: ShellProfile }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const showToast = useToast();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function signOut() {
    const { error } = await createSupabaseBrowserClient().auth.signOut();
    if (error) {
      showToast('Chưa đăng xuất được. Bạn thử lại nha.', { kind: 'error' });
      return;
    }
    setOpen(false);
    router.replace('/login');
    router.refresh();
  }

  const itemClass = 'flex min-h-11 w-full items-center gap-3 rounded-sm px-3 text-left text-[15px] hover:bg-surface-2';

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="Mở menu tài khoản"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex size-11 items-center justify-center rounded-full"
      >
        <Avatar emoji={profile.avatarEmoji} color={profile.avatarColor} name={profile.displayName} />
      </button>
      {open ? (
        <div
          role="menu"
          aria-label="Menu tài khoản"
          className="absolute right-0 top-12 z-50 w-56 rounded-md border border-border bg-surface p-1 shadow-lg"
        >
          <p className="truncate px-3 py-2 text-sm font-semibold">{profile.displayName}</p>
          {LINKS.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} role="menuitem" onClick={() => setOpen(false)} className={itemClass}>
              <Icon className="size-5 text-text-2" aria-hidden />
              {label}
            </Link>
          ))}
          <button type="button" role="menuitem" onClick={signOut} className={itemClass}>
            <LogOut className="size-5 text-text-2" aria-hidden />
            Đăng xuất
          </button>
        </div>
      ) : null}
    </div>
  );
}
