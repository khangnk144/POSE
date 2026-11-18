'use client';

import type { SectionProps } from './basics-section';
import { CameraSection } from './camera-section';
import { ClassifySection } from './classify-section';
import { DETAILS_PANEL_ID, DetailsToggle } from './details-toggle';
import { ExtrasSection } from './extras-section';
import { countDetailValues } from './form-values';
import { StepsSection } from './steps-section';

/**
 * "Thêm chi tiết (không bắt buộc)": everything except title and caption. The content stays
 * mounted while collapsed (hidden), so values and errors are kept.
 */
export function PoseDetailsPanel({
  open,
  onToggle,
  aiRunning,
  aiFilled,
  tagSuggestions,
  coverUrl,
  ...section
}: SectionProps & {
  open: boolean;
  onToggle: () => void;
  aiRunning: boolean;
  aiFilled: number;
  tagSuggestions: string[];
  coverUrl: string | null;
}) {
  return (
    <div className="flex flex-col gap-4">
      <DetailsToggle
        open={open}
        onToggle={onToggle}
        filledCount={countDetailValues(section.values)}
        aiRunning={aiRunning}
        aiFilled={aiFilled}
      />
      <div id={DETAILS_PANEL_ID} role="group" aria-label="Chi tiết không bắt buộc" hidden={!open} className="flex flex-col gap-8">
        <p className="text-sm text-text-2">Không biết mục nào thì cứ để &quot;Không rõ&quot;, sau này bổ sung cũng được.</p>
        <CameraSection {...section} coverUrl={coverUrl} />
        <StepsSection {...section} />
        <ClassifySection {...section} tagSuggestions={tagSuggestions} />
        <ExtrasSection {...section} />
      </div>
    </div>
  );
}
