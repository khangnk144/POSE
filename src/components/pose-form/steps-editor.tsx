'use client';

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const MAX_STEPS = 12;
const idOf = (i: number) => `step-${i}`;

function StepRow({
  index,
  value,
  onChange,
  onRemove,
}: {
  index: number;
  value: string;
  onChange: (v: string) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: idOf(index) });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined, transition }}
      className={cn('flex items-center gap-1 rounded-md bg-surface', isDragging && 'z-10 shadow-fab')}
    >
      <button
        type="button"
        aria-label={`Kéo để đổi thứ tự bước ${index + 1}`}
        className="inline-flex size-11 shrink-0 touch-none items-center justify-center text-text-2"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-5" aria-hidden />
      </button>
      <span className="w-5 shrink-0 text-center text-sm font-semibold text-text-2" aria-hidden>{index + 1}</span>
      <input
        value={value}
        maxLength={300}
        aria-label={`Bước ${index + 1}`}
        placeholder="vd: Nghiêng người 45°, tay chạm tóc"
        onChange={(e) => onChange(e.target.value)}
        className="h-12 min-w-0 flex-1 rounded-sm border border-border-strong bg-surface px-3 text-text placeholder:text-text-3"
      />
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Xoá bước ${index + 1}`}
        className="inline-flex size-11 shrink-0 items-center justify-center text-text-2"
      >
        <Trash2 className="size-5" aria-hidden />
      </button>
    </li>
  );
}

/** Pose instructions for the model: add, edit, drag to reorder, remove (max 12). */
export function StepsEditor({ steps, onChange }: { steps: string[]; onChange: (steps: string[]) => void }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = steps.findIndex((_, i) => idOf(i) === active.id);
    const to = steps.findIndex((_, i) => idOf(i) === over.id);
    if (from >= 0 && to >= 0) onChange(arrayMove(steps, from, to));
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[13px] font-medium text-text">Các bước tạo dáng</span>
      <DndContext id="steps-sortable" sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={steps.map((_, i) => idOf(i))} strategy={verticalListSortingStrategy}>
          <ol className="flex flex-col gap-2">
            {steps.map((s, i) => (
              <StepRow
                key={idOf(i)}
                index={i}
                value={s}
                onChange={(v) => onChange(steps.map((x, j) => (j === i ? v : x)))}
                onRemove={() => onChange(steps.filter((_, j) => j !== i))}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
      {steps.length < MAX_STEPS ? (
        <button
          type="button"
          onClick={() => onChange([...steps, ''])}
          className="inline-flex min-h-11 items-center gap-1.5 self-start font-semibold text-primary"
        >
          <Plus className="size-5" aria-hidden />
          Thêm bước
        </button>
      ) : null}
    </div>
  );
}
