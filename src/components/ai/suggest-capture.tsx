'use client';

import { Camera, ImagePlus } from 'lucide-react';
import { PhotoPickButton } from './photo-pick-button';
import { FeatureLockedHint } from '@/components/ui/feature-locked-hint';
import { SegmentedSelect } from '@/components/ui/segmented-select';
import { PEOPLE_COUNT_LABELS } from '@/lib/types/pose-labels';
import { PEOPLE_COUNTS, type PeopleCount } from '@/lib/types/pose';

const PEOPLE_OPTIONS = PEOPLE_COUNTS.map((value) => ({ value, label: PEOPLE_COUNT_LABELS[value] }));

/** Step 1: choose a scene photo. Locked (faded buttons + hint, no error) when no API key. */
export function SuggestCapture({
  aiEnabled,
  people,
  onPeopleChange,
  onPick,
}: {
  aiEnabled: boolean;
  people: PeopleCount | undefined;
  onPeopleChange: (value: PeopleCount | undefined) => void;
  onPick: (file: File) => void;
}) {
  return (
    <section className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-[22px] font-bold leading-[30px]">Chụp cảnh bạn đang đứng</h1>
        <p className="text-text-2">Mình sẽ nhìn cảnh rồi gợi ý dáng hợp trong thư viện.</p>
      </header>

      <div className="flex flex-col gap-3">
        <PhotoPickButton label="Chụp ảnh" icon={Camera} capture variant="primary" disabled={!aiEnabled} onPick={onPick} />
        <PhotoPickButton label="Chọn từ máy" icon={ImagePlus} variant="secondary" disabled={!aiEnabled} onPick={onPick} />
        {aiEnabled ? null : <FeatureLockedHint />}
      </div>

      <SegmentedSelect label="Chụp mấy người? (không bắt buộc)" options={PEOPLE_OPTIONS} value={people} onChange={onPeopleChange} />

      <p className="text-[13px] text-text-3">Mẹo nhỏ: chụp rộng một chút để AI thấy cả ánh sáng nha.</p>
    </section>
  );
}
