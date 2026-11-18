import { cn } from '@/lib/utils/cn';

const COLORS: Record<string, string> = {
  'avatar-1': 'bg-avatar-1',
  'avatar-2': 'bg-avatar-2',
  'avatar-3': 'bg-avatar-3',
  'avatar-4': 'bg-avatar-4',
  'avatar-5': 'bg-avatar-5',
  'avatar-6': 'bg-avatar-6',
  'avatar-7': 'bg-avatar-7',
  'avatar-8': 'bg-avatar-8',
};

const SIZES = { sm: 'size-6 text-xs', md: 'size-8 text-lg', lg: 'size-11 text-2xl', xl: 'size-24 text-5xl' };

/** Round emoji avatar on a pastel background (`avatarColor` is `avatar-1`..`avatar-8`). */
export function Avatar({
  emoji,
  color,
  name,
  size = 'md',
  className,
}: {
  emoji: string;
  color: string;
  /** Used for the accessible label, e.g. "Avatar của Linh". */
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label={`Avatar của ${name}`}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full',
        COLORS[color] ?? 'bg-avatar-1',
        SIZES[size],
        className,
      )}
    >
      <span aria-hidden>{emoji}</span>
    </span>
  );
}
