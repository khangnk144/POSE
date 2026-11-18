'use client';

import { PictogramSelect } from '@/components/ui/pictogram-select';
import { FilterChip } from '@/components/ui/chip';
import { PEOPLE_COUNTS, POSTURES, SCENES } from '@/lib/types/pose';
import { PEOPLE_COUNT_HINTS, POSTURE_HINTS } from '@/lib/types/pose-hints';
import { PEOPLE_COUNT_LABELS, POSTURE_LABELS, SCENE_LABELS } from '@/lib/types/pose-labels';
import type { SectionProps } from './basics-section';
import { FlashField } from './flash-field';
import { pictogramOptions } from './pictogram-options';
import { TagInput } from './tag-input';

const PEOPLE_OPTIONS = pictogramOptions('people', PEOPLE_COUNTS, PEOPLE_COUNT_LABELS, PEOPLE_COUNT_HINTS);
const POSTURE_OPTIONS = pictogramOptions('posture', POSTURES, POSTURE_LABELS, POSTURE_HINTS);

/** "Phân loại": people, posture (pictures), scenes (fixed chips) and tags (free text). */
export function ClassifySection({ values, set, flash, tagSuggestions }: SectionProps & { tagSuggestions: string[] }) {
  return (
    <section id="section-tags" aria-labelledby="classify-heading" className="flex scroll-mt-[68px] flex-col gap-4">
      <h2 id="classify-heading" className="font-display text-[17px] font-bold">Phân loại</h2>
      <FlashField field="peopleCount" flash={flash}>
        <PictogramSelect
          question="Mấy người trong ảnh?"
          options={PEOPLE_OPTIONS}
          value={values.peopleCount}
          aiFilled={flash.has('peopleCount')}
          onChange={(v) => set('peopleCount', v)}
        />
      </FlashField>
      <FlashField field="posture" flash={flash}>
        <PictogramSelect
          question="Tư thế chính"
          options={POSTURE_OPTIONS}
          value={values.posture}
          aiFilled={flash.has('posture')}
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
