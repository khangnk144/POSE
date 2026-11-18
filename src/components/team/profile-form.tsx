'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils/cn';
import { AVATAR_COLORS, AVATAR_EMOJIS, updateOwnProfile } from '@/lib/team/team-actions';

type Props = { userId: string; displayName: string; avatarEmoji: string; avatarColor: string };

const SWATCH: Record<string, string> = {
  'avatar-1': 'bg-avatar-1',
  'avatar-2': 'bg-avatar-2',
  'avatar-3': 'bg-avatar-3',
  'avatar-4': 'bg-avatar-4',
  'avatar-5': 'bg-avatar-5',
  'avatar-6': 'bg-avatar-6',
  'avatar-7': 'bg-avatar-7',
  'avatar-8': 'bg-avatar-8',
};

/** Edit own display name, avatar emoji and avatar colour. */
export function ProfileForm({ userId, ...initial }: Props) {
  const [name, setName] = useState(initial.displayName);
  const [emoji, setEmoji] = useState(initial.avatarEmoji);
  const [color, setColor] = useState(initial.avatarColor);
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const showToast = useToast();

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    setSaving(true);
    try {
      await updateOwnProfile(userId, {
        displayName: name,
        avatarEmoji: emoji as (typeof AVATAR_EMOJIS)[number],
        avatarColor: color as (typeof AVATAR_COLORS)[number],
      });
      showToast('Đã lưu hồ sơ.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chưa lưu được, bạn thử lại nha.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-5">
      <div className="flex justify-center">
        <Avatar emoji={emoji} color={color} name={name || 'bạn'} size="xl" />
      </div>
      <Input label="Tên hiển thị" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} error={error} />

      <fieldset>
        <legend className="mb-2 text-[13px] font-medium">Biểu tượng</legend>
        <div className="grid grid-cols-8 gap-1">
          {AVATAR_EMOJIS.map((em) => (
            <button
              key={em}
              type="button"
              aria-label={`Chọn ${em}`}
              aria-pressed={emoji === em}
              onClick={() => setEmoji(em)}
              className={cn(
                'flex size-11 items-center justify-center rounded-md text-2xl',
                emoji === em ? 'bg-primary-soft ring-2 ring-primary' : 'hover:bg-surface-3',
              )}
            >
              {em}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-[13px] font-medium">Màu nền</legend>
        <div className="flex flex-wrap gap-2">
          {AVATAR_COLORS.map((c, i) => (
            <button
              key={c}
              type="button"
              aria-label={`Màu ${i + 1}`}
              aria-pressed={color === c}
              onClick={() => setColor(c)}
              className={cn('size-11 rounded-full', SWATCH[c], color === c && 'ring-2 ring-primary ring-offset-2 ring-offset-bg')}
            />
          ))}
        </div>
      </fieldset>

      <Button type="submit" loading={saving} loadingLabel="Đang lưu…">
        Lưu hồ sơ
      </Button>
    </form>
  );
}
