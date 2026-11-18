import { Avatar } from '@/components/ui/avatar';

export type MemberView = {
  id: string;
  displayName: string;
  avatarEmoji: string;
  avatarColor: string;
  role: 'admin' | 'member';
};

/** Team members, admins first. */
export function MemberList({ members, meId }: { members: MemberView[]; meId: string }) {
  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
      {members.map((m) => (
        <li key={m.id} className="flex min-h-14 items-center gap-3 px-4 py-2">
          <Avatar emoji={m.avatarEmoji} color={m.avatarColor} name={m.displayName} size="lg" />
          <span className="min-w-0 flex-1 truncate font-medium">
            {m.displayName}
            {m.id === meId ? <span className="font-normal text-text-2"> (bạn)</span> : null}
          </span>
          {m.role === 'admin' ? (
            <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">Admin</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
