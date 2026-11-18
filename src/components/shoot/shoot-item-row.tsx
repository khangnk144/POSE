'use client';

import { useSortable } from '@dnd-kit/sortable';
import { Check, GripVertical, ImageOff, Trash2 } from 'lucide-react';
import type { ShootItemView } from '@/lib/shoots/shoot-queries';
import { cn } from '@/lib/utils/cn';

/** One sortable row of the shot list: drag handle, thumbnail, title, done tick, remove. */
export function ShootItemRow({
  item,
  onToggleDone,
  onRemove,
}: {
  item: ShootItemView;
  onToggleDone: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: item.poseId,
  });

  return (
    <li
      ref={setNodeRef}
      data-testid="shoot-item"
      style={{ transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined, transition }}
      className={cn(
        'flex items-center gap-1 rounded-lg border border-border bg-surface pr-1',
        isDragging && 'z-10 shadow-lg',
      )}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        aria-label={`Kéo để sắp xếp ${item.title}`}
        className="flex size-11 shrink-0 touch-none items-center justify-center text-text-3"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-5" aria-hidden />
      </button>
      <span
        className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-3 text-text-3"
        style={item.dominantColor ? { backgroundColor: item.dominantColor } : undefined}
      >
        {item.thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- signed storage URL
          <img src={item.thumbUrl} alt="" className="size-full object-cover" loading="lazy" draggable={false} />
        ) : (
          <ImageOff className="size-5" aria-hidden />
        )}
      </span>
      <span className={cn('mx-2 min-w-0 flex-1 truncate font-medium', item.done && 'text-text-3 line-through')}>
        {item.title}
      </span>
      <button
        type="button"
        role="checkbox"
        aria-checked={item.done}
        aria-label={`Đã chụp ${item.title}`}
        onClick={onToggleDone}
        className="flex size-11 shrink-0 items-center justify-center"
      >
        <span
          className={cn(
            'flex size-7 items-center justify-center rounded-full border-2',
            item.done ? 'border-success bg-success text-on-primary' : 'border-border-strong',
          )}
        >
          {item.done ? <Check className="size-4" aria-hidden /> : null}
        </span>
      </button>
      <button
        type="button"
        aria-label={`Bỏ ${item.title} khỏi buổi chụp`}
        onClick={onRemove}
        className="flex size-11 shrink-0 items-center justify-center text-text-3 hover:text-danger"
      >
        <Trash2 className="size-5" aria-hidden />
      </button>
    </li>
  );
}
