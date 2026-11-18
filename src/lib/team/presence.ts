/** Pure logic for the "who is online" avatar stack. */

export type PresenceUser = {
  id: string;
  name: string;
  emoji: string;
  color: string;
};

/** Shape of `channel.presenceState()`: presence key -> list of payloads (one per open tab). */
export type PresenceStateLike = Record<string, ReadonlyArray<Partial<PresenceUser>>>;

export const PRESENCE_CHANNEL = 'team-presence';
export const MAX_VISIBLE_AVATARS = 5;

/**
 * Flattens presence state into unique users: the viewer first, the rest A-Z by name.
 * Entries with a missing id or name are dropped (malformed payloads from other clients).
 */
export function listOnlineUsers(state: PresenceStateLike, meId: string | null): PresenceUser[] {
  const byId = new Map<string, PresenceUser>();
  for (const metas of Object.values(state)) {
    for (const m of metas) {
      if (typeof m.id !== 'string' || typeof m.name !== 'string' || byId.has(m.id)) continue;
      byId.set(m.id, {
        id: m.id,
        name: m.name,
        emoji: typeof m.emoji === 'string' ? m.emoji : '🐼',
        color: typeof m.color === 'string' ? m.color : 'avatar-1',
      });
    }
  }
  return [...byId.values()].sort((a, b) => {
    if (a.id === meId) return -1;
    if (b.id === meId) return 1;
    return a.name.localeCompare(b.name, 'vi');
  });
}

/** Splits users into the avatars to show (at most `max`) and the "+N" overflow count. */
export function splitVisible(users: PresenceUser[], max = MAX_VISIBLE_AVATARS) {
  return { visible: users.slice(0, max), overflow: Math.max(0, users.length - max) };
}
