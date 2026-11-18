'use client';

import { FilterChip } from '@/components/ui/chip';
import { Input } from '@/components/ui/input';
import { SegmentedSelect } from '@/components/ui/segmented-select';
import { Textarea } from '@/components/ui/textarea';
import { PEOPLE_COUNT_LABELS, POSTURE_LABELS, SCENE_LABELS } from '@/lib/types/pose-labels';
import { PEOPLE_COUNTS, POSE_STATUSES, POSTURES, SCENES, type PoseStatus } from '@/lib/types/pose';
import { FlashField } from './flash-field';
import type { FieldKey, FormValues } from './form-values';
import { TagInput } from './tag-input';

export type SectionProps = {
  values: FormValues;
  set: <K extends FieldKey>(key: K, value: FormValues[K]) => void;
  flash: ReadonlySet<FieldKey>;
  errors: Partial<Record<FieldKey, string>>;
};

const STATUS_LABELS: Record<PoseStatus, string> = { published: 'Đã đăng', draft: 'Nháp' };
const options = <T extends string>(list: readonly T[], labels: Record<T, string>) =>
  list.map((value) => ({ value, label: labels[value] }));

/** Title, description, visibility, people, posture, scenes (fixed chips) and tags (free text). */
export function BasicsSection({
  values,
  set,
  flash,
  errors,
  tagSuggestions,
}: SectionProps & { tagSuggestions: string[] }) {
  return (
    <section aria-labelledby="basics-heading" className="flex flex-col gap-4">
      <h2 id="basics-heading" className="font-display text-[17px] font-bold">Thông tin dáng</h2>
      <FlashField field="title" flash={flash}>
        <Input
          label="Tên dáng *"
          value={values.title}
          maxLength={160}
          placeholder="vd: Ngồi sofa nhìn ra cửa sổ"
          error={errors.title}
          onChange={(e) => set('title', e.target.value)}
        />
      </FlashField>
      <FlashField field="description" flash={flash}>
        <Textarea
          label="Mô tả"
          value={values.description}
          maxLength={2000}
          onChange={(e) => set('description', e.target.value)}
        />
      </FlashField>
      <SegmentedSelect
        label="Hiển thị"
        allowClear={false}
        options={options(POSE_STATUSES, STATUS_LABELS)}
        value={values.status}
        onChange={(v) => v && set('status', v)}
      />
      <FlashField field="peopleCount" flash={flash}>
        <SegmentedSelect
          label="Số người"
          options={options(PEOPLE_COUNTS, PEOPLE_COUNT_LABELS)}
          value={values.peopleCount}
          onChange={(v) => set('peopleCount', v)}
        />
      </FlashField>
      <FlashField field="posture" flash={flash}>
        <SegmentedSelect
          label="Tư thế"
          options={options(POSTURES, POSTURE_LABELS)}
          value={values.posture}
          onChange={(v) => set('posture', v)}
        />
      </FlashField>
      <FlashField field="scenes" flash={flash}>
        <div role="group" aria-label="Bối cảnh" className="flex flex-col gap-0.5">
          <span className="text-[13px] font-medium text-text">Bối cảnh</span>
          <div className="-mx-0.5 flex flex-wrap gap-x-2">
            {SCENES.map((scene) => {
              const on = values.scenes.includes(scene);
              return (
                <FilterChip
                  key={scene}
                  selected={on}
                  onToggle={() => set('scenes', on ? values.scenes.filter((s) => s !== scene) : [...values.scenes, scene])}
                >
                  {SCENE_LABELS[scene]}
                </FilterChip>
              );
            })}
          </div>
        </div>
      </FlashField>
      <FlashField field="tags" flash={flash}>
        <TagInput tags={values.tags} onChange={(t) => set('tags', t)} suggestions={tagSuggestions} />
      </FlashField>
    </section>
  );
}
