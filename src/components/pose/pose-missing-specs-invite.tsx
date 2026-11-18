import Link from 'next/link';
import { Pencil } from 'lucide-react';
import type { SpecGaps } from '@/lib/poses/missing-specs';

const COPY = {
  both: { text: 'Dáng này mới có ảnh thôi. Bạn biết cách chụp thì bổ sung nha', button: 'Bổ sung chi tiết', focus: 'camera' },
  camera: { text: 'Chưa có cách cầm máy, bạn biết thì bổ sung nha', button: 'Bổ sung cách cầm máy', focus: 'camera' },
  steps: { text: 'Chưa có các bước tạo dáng, bạn biết thì bổ sung nha', button: 'Thêm bước tạo dáng', focus: 'steps' },
} as const;

/** Which invitation(s) belong at the camera-spec slot and at the steps slot of the detail page. */
export function inviteSlots(gaps: SpecGaps): { atSpec: keyof typeof COPY | null; atSteps: keyof typeof COPY | null } {
  if (gaps.camera && gaps.steps) return { atSpec: 'both', atSteps: null };
  return { atSpec: gaps.camera ? 'camera' : null, atSteps: gaps.steps ? 'steps' : null };
}

/** Invitation shown where the missing section would be; the button opens the edit form on that section. */
export function PoseMissingSpecsInvite({ poseId, kind }: { poseId: string; kind: keyof typeof COPY }) {
  const copy = COPY[kind];
  return (
    <section
      aria-label="Cần bổ sung"
      className="flex flex-col items-start gap-3 rounded-md border border-dashed border-border-strong bg-surface-2 p-4"
    >
      <p className="text-text">
        {copy.text} <span aria-hidden>✍️</span>
      </p>
      <Link
        href={`/poses/${poseId}/edit?focus=${copy.focus}`}
        className="inline-flex h-12 items-center gap-2 rounded-full border-[1.5px] border-border-strong bg-surface px-5 font-semibold text-text"
      >
        <Pencil className="size-5" aria-hidden />
        {copy.button}
      </Link>
    </section>
  );
}
