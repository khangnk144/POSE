'use client';

import { useEffect, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { Avatar } from '@/components/ui/avatar';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { listOnlineUsers, PRESENCE_CHANNEL, splitVisible, type PresenceUser } from '@/lib/team/presence';

/**
 * Overlapping avatars of teammates who are online right now (max 5, then "+N").
 * Self-contained: loads the viewer's own profile, joins a Realtime presence channel while the tab is
 * visible and leaves it when the tab is hidden or closed. Renders nothing until someone else is online.
 */
export function OnlineAvatarStack() {
  const [users, setUsers] = useState<PresenceUser[]>([]);
  const [meId, setMeId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let channel: RealtimeChannel | null = null;
    let me: PresenceUser | null = null;
    let disposed = false;

    function join() {
      if (channel || !me || disposed || document.visibilityState !== 'visible') return;
      const self = me;
      const ch = supabase.channel(PRESENCE_CHANNEL, { config: { presence: { key: self.id, enabled: true } } });
      ch.on('presence', { event: 'sync' }, () => setUsers(listOnlineUsers(ch.presenceState(), self.id)));
      ch.subscribe((status) => {
        if (status === 'SUBSCRIBED') void ch.track(self);
      });
      channel = ch;
    }

    function leave() {
      if (!channel) return;
      const ch = channel;
      channel = null;
      void ch.untrack().finally(() => void supabase.removeChannel(ch));
      setUsers([]);
    }

    const onVisibility = () => (document.visibilityState === 'visible' ? join() : leave());

    async function start() {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId || disposed) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_emoji, avatar_color')
        .eq('id', userId)
        .maybeSingle();
      if (!profile || disposed) return;
      me = { id: profile.id, name: profile.display_name, emoji: profile.avatar_emoji, color: profile.avatar_color };
      setMeId(profile.id);
      join();
    }

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', leave);
    window.addEventListener('pageshow', join);
    void start();

    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', leave);
      window.removeEventListener('pageshow', join);
      leave();
    };
  }, []);

  if (!meId || users.length < 2) return null;
  const { visible, overflow } = splitVisible(users);

  return (
    <div
      role="group"
      aria-label={`${users.length} người đang online`}
      data-testid="online-avatar-stack"
      className="flex items-center -space-x-2"
    >
      {visible.map((u) => (
        <span key={u.id} title={u.id === meId ? `${u.name} (bạn)` : u.name} data-presence-user={u.id}>
          <Avatar emoji={u.emoji} color={u.color} name={u.name} className="ring-2 ring-bg" />
        </span>
      ))}
      {overflow > 0 ? (
        <span
          aria-label={`và ${overflow} người nữa`}
          className="z-10 inline-flex size-8 items-center justify-center rounded-full bg-surface-3 text-xs font-semibold text-text-2 ring-2 ring-bg"
        >
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}
