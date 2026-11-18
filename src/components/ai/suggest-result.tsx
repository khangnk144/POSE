'use client';

import { Camera, MapPin, Sun } from 'lucide-react';
import { IdeaCard } from './idea-card';
import { Button } from '@/components/ui/button';
import type { SuggestResponse } from '@/lib/ai/suggest-client';
import { PoseCardGrid } from '@/components/pose/pose-card-grid';
import type { PoseCardData } from '@/lib/types/pose';

/** Step 3: scene summary, matching poses from the library, new ideas, and the two footer actions. */
export function SuggestResult({
  previewUrl,
  data,
  cards,
  cardsFailed,
  onRetry,
  onNewPhoto,
}: {
  previewUrl: string;
  data: SuggestResponse;
  cards: PoseCardData[];
  cardsFailed: boolean;
  onRetry: () => void;
  onNewPhoto: () => void;
}) {
  const { scene, matches, ideas } = data;
  const notes: Record<string, string> = {};
  matches.forEach((m, i) => {
    const text = m.cameraTip ? `${m.reason} · Mẹo: ${m.cameraTip}` : m.reason;
    notes[m.poseId] = i === 0 ? `Hợp nhất: ${text}` : text;
  });
  const rows = [
    { icon: MapPin, label: 'Bối cảnh', text: [scene.summary, ...scene.setting].filter(Boolean).join(' · ') },
    { icon: Sun, label: 'Ánh sáng', text: scene.light },
    { icon: Camera, label: 'Gợi ý góc', text: scene.tips.join(' ') },
  ].filter((r) => r.text);

  return (
    <div className="flex flex-col gap-6" aria-live="polite">
      <section className="flex gap-3 rounded-lg bg-surface p-3 shadow-sm" aria-label="Cảnh của bạn">
        {/* eslint-disable-next-line @next/next/no-img-element -- local blob URL, not optimizable */}
        <img src={previewUrl} alt="Ảnh cảnh bạn vừa chụp" className="h-24 w-20 shrink-0 rounded-md object-cover" />
        <div className="flex min-w-0 flex-col gap-1.5">
          <h2 className="font-display text-[17px] font-bold">Cảnh của bạn</h2>
          {rows.map(({ icon: Icon, label, text }) => (
            <p key={label} className="flex items-start gap-1.5 text-[13px] text-text-2">
              <Icon className="mt-0.5 size-3.5 shrink-0" aria-label={label} />
              <span>{text}</span>
            </p>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-[17px] font-bold">Dáng hợp nhất trong thư viện</h2>
        {matches.length === 0 ? (
          <p className="text-text-2">Thư viện chưa có dáng hợp cảnh này, thử ý tưởng mới bên dưới nhé.</p>
        ) : cardsFailed ? (
          <p className="text-text-2">Mình tìm được {matches.length} dáng hợp nhưng chưa tải được thẻ dáng. Bạn thử lại nhé.</p>
        ) : (
          <PoseCardGrid poses={cards} notes={notes} />
        )}
      </section>

      {ideas.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-[17px] font-bold">Ý tưởng mới ✨</h2>
          {ideas.map((idea, i) => (
            <IdeaCard key={`${i}-${idea.title}`} idea={idea} />
          ))}
        </section>
      ) : null}

      <div className="flex flex-col gap-2 pb-4">
        <Button variant="secondary" onClick={onRetry}>
          Gợi ý lại
        </Button>
        <Button variant="text" onClick={onNewPhoto}>
          Chụp cảnh khác
        </Button>
      </div>
    </div>
  );
}
