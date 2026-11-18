'use client';

import { Textarea } from '@/components/ui/textarea';
import type { SectionProps } from './basics-section';
import { FlashField } from './flash-field';
import { StepsEditor } from './steps-editor';

/** "Cách tạo dáng": the model steps and tips for the photographer. */
export function StepsSection({ values, set, flash }: SectionProps) {
  return (
    <section id="section-steps" aria-labelledby="steps-heading" className="flex scroll-mt-[68px] flex-col gap-4">
      <h2 id="steps-heading" className="font-display text-[17px] font-bold">Cách tạo dáng</h2>
      <FlashField field="modelSteps" flash={flash}>
        <StepsEditor steps={values.modelSteps} onChange={(s) => set('modelSteps', s)} />
      </FlashField>
      <FlashField field="tips" flash={flash}>
        <Textarea
          label="Mẹo cho người chụp"
          value={values.tips}
          maxLength={1000}
          onChange={(e) => set('tips', e.target.value)}
        />
      </FlashField>
    </section>
  );
}
