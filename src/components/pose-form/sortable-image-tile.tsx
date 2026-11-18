'use client';

import { useSortable } from '@dnd-kit/sortable';
import { GripVertical, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { FormImage } from './form-image';

/** One image in the picker: drag handle (bottom left), remove button (top right), "Ảnh bìa" badge on the first. */
export function SortableImageTile({
  image,
  index,
  onRemove,
  uploadProgress,
}: {
  image: FormImage;
  index: number;
  onRemove: () => void;
  /** 0..1 while saving, undefined otherwise. */
  uploadProgress?: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: image.id });
  const color = image.kind === 'existing' ? image.dominantColor : image.processed.dominantColor;

  return (
    <li
      ref={setNodeRef}
      data-image-id={image.id}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition,
        backgroundColor: color ?? 'var(--surface-3)',
      }}
      className={cn(
        'relative aspect-[3/4] overflow-hidden rounded-md border border-border',
        isDragging && 'z-10 shadow-fab opacity-90',
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- blob/signed URLs, already resized */}
      <img src={image.previewUrl} alt={`Ảnh ${index + 1}`} className="size-full object-cover" draggable={false} />
      {index === 0 ? (
        <span className="absolute left-2 top-2 rounded-full bg-scrim px-2 py-0.5 text-xs font-medium text-white">
          Ảnh bìa
        </span>
      ) : null}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Xoá ảnh ${index + 1}`}
        className="absolute right-0 top-0 inline-flex size-11 items-center justify-center"
      >
        <span className="inline-flex size-7 items-center justify-center rounded-full bg-scrim text-white">
          <X className="size-4" aria-hidden />
        </span>
      </button>
      <button
        type="button"
        aria-label={`Kéo để đổi thứ tự ảnh ${index + 1}`}
        className="absolute bottom-0 left-0 inline-flex size-11 touch-none items-center justify-center"
        {...attributes}
        {...listeners}
      >
        <span className="inline-flex size-7 items-center justify-center rounded-full bg-scrim text-white">
          <GripVertical className="size-4" aria-hidden />
        </span>
      </button>
      {uploadProgress !== undefined ? (
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-surface-3" role="progressbar" aria-valuenow={Math.round(uploadProgress * 100)} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-primary transition-[width]" style={{ width: `${uploadProgress * 100}%` }} />
        </div>
      ) : null}
    </li>
  );
}
