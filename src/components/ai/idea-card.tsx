'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CameraChip } from '@/components/ui/chip';
import { useToast } from '@/components/ui/toast';
import { saveIdeaAsDraft } from '@/lib/ai/save-idea-as-draft';
import type { SuggestResponse } from '@/lib/ai/suggest-client';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import {
  CAMERA_HEIGHT_LABELS,
  CAMERA_TILT_LABELS,
  POSTURE_LABELS,
} from '@/lib/types/pose-labels';

type Idea = SuggestResponse['ideas'][number];

/** Text-only AI idea with a "Lưu thành dáng nháp" button (inserts a draft pose, no image). */
export function IdeaCard({ idea }: { idea: Idea }) {
  const router = useRouter();
  const showToast = useToast();
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    try {
      const id = await saveIdeaAsDraft(createSupabaseBrowserClient(), idea);
      setSavedId(id);
      showToast('Đã lưu nháp', { action: { label: 'Mở', onClick: () => router.push(`/poses/${id}`) } });
    } catch {
      showToast('Chưa lưu được nháp. Bạn thử lại nhé.', { kind: 'error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="flex flex-col gap-3 rounded-lg border border-dashed border-ai bg-ai-soft p-4">
      <h3 className="font-display text-[17px] font-bold">
        <Sparkles className="mr-1 inline size-4 text-ai" aria-hidden />
        {idea.title}
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {idea.posture ? <CameraChip>{POSTURE_LABELS[idea.posture]}</CameraChip> : null}
        {idea.cameraHeight ? <CameraChip>{CAMERA_HEIGHT_LABELS[idea.cameraHeight]}</CameraChip> : null}
        {idea.cameraTilt ? <CameraChip>{CAMERA_TILT_LABELS[idea.cameraTilt]}</CameraChip> : null}
        {idea.zoom ? <CameraChip tone="zoom">{idea.zoom}</CameraChip> : null}
      </div>
      {idea.modelSteps && idea.modelSteps.length > 0 ? (
        <ol className="list-decimal space-y-1 pl-5 text-[14px] text-text">
          {idea.modelSteps.slice(0, 3).map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      ) : null}
      <Button variant="secondary" onClick={save} loading={saving} loadingLabel="Đang lưu…" disabled={savedId !== null}>
        {savedId ? 'Đã lưu nháp' : 'Lưu thành dáng nháp'}
      </Button>
    </article>
  );
}
