import { cn } from '@/lib/utils/cn';

/** Centered "nothing here" block: illustration slot, title, one sentence, one action. */
export function EmptyState({
  title,
  description,
  action,
  illustration,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  illustration?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center gap-3 px-6 py-12 text-center', className)}>
      <div
        aria-hidden
        className="flex size-40 items-center justify-center rounded-full bg-primary-soft text-5xl"
      >
        {illustration ?? '📷'}
      </div>
      <h2 className="font-display text-[17px] font-bold">{title}</h2>
      {description ? <p className="max-w-xs text-text-2">{description}</p> : null}
      {action}
    </div>
  );
}
