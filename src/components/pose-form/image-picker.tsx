'use client';

import { useRef, useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { ClipboardPaste, ImagePlus, Link2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type FormImage, MAX_IMAGES } from './form-image';
import { SortableImageTile } from './sortable-image-tile';
import type { useImageIntake } from './use-image-intake';

type Intake = ReturnType<typeof useImageIntake>;

/**
 * Up to 5 images: pick from device, paste from clipboard or from a link, drag to reorder
 * (the first one is the cover) and remove.
 */
export function ImagePicker({
  images,
  onChange,
  onRemove,
  intake,
  progress,
  disabled,
}: {
  images: FormImage[];
  onChange: (images: FormImage[]) => void;
  onRemove: (image: FormImage) => void;
  intake: Intake;
  /** Upload progress per image id while saving. */
  progress: Record<string, number>;
  disabled: boolean;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [link, setLink] = useState('');
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = images.findIndex((i) => i.id === active.id);
    const to = images.findIndex((i) => i.id === over.id);
    if (from >= 0 && to >= 0) onChange(arrayMove(images, from, to));
  };

  const submitLink = async () => {
    const url = link.trim();
    if (!url) return;
    if (await intake.addFromUrl(url)) setLink('');
  };

  const lockAdd = disabled || intake.full;

  return (
    <section aria-labelledby="images-heading" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 id="images-heading" className="font-display text-[17px] font-bold">Ảnh</h2>
        <span className="text-xs text-text-2">{images.length}/{MAX_IMAGES} · ảnh đầu là ảnh bìa</span>
      </div>

      {images.length + intake.processing > 0 ? (
        <DndContext id="image-sortable" sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={images.map((i) => i.id)} strategy={rectSortingStrategy}>
            <ul className="grid grid-cols-3 gap-2" aria-label="Danh sách ảnh">
              {images.map((img, i) => (
                <SortableImageTile
                  key={img.id}
                  image={img}
                  index={i}
                  onRemove={() => onRemove(img)}
                  uploadProgress={progress[img.id]}
                />
              ))}
              {Array.from({ length: intake.processing }, (_, i) => (
                <li
                  key={`processing-${i}`}
                  className="flex aspect-[3/4] items-center justify-center rounded-md bg-surface-3"
                  aria-label="Đang xử lý ảnh"
                >
                  <Loader2 className="size-6 animate-spin text-text-2" aria-hidden />
                </li>
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          hidden
          data-testid="pose-image-input"
          onChange={(e) => {
            void intake.addFiles(Array.from(e.target.files ?? []));
            e.target.value = '';
          }}
        />
        <Button variant="secondary" disabled={lockAdd} onClick={() => fileInput.current?.click()}>
          <ImagePlus className="size-5" aria-hidden />
          Chọn từ máy
        </Button>
        <Button variant="secondary" disabled={lockAdd} onClick={() => void intake.pasteFromClipboard()}>
          <ClipboardPaste className="size-5" aria-hidden />
          Dán ảnh
        </Button>
      </div>

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            label="Dán link ảnh hoặc trang (Pinterest...)"
            type="url"
            inputMode="url"
            placeholder="https://"
            value={link}
            disabled={lockAdd}
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault(); // Enter here must not submit the pose form
                void submitLink();
              }
            }}
          />
        </div>
        <Button
          variant="secondary"
          disabled={lockAdd || link.trim() === ''}
          loading={intake.busyLink}
          onClick={() => void submitLink()}
          aria-label="Lấy ảnh từ link"
        >
          <Link2 className="size-5" aria-hidden />
          Lấy
        </Button>
      </div>
      <p className="text-xs text-text-2">
        Instagram/TikTok hay chặn link. Với hai nguồn này, chụp màn hình rồi chọn từ máy nhé.
      </p>
    </section>
  );
}
