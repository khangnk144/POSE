'use client';

import { useCallback, useRef, useState } from 'react';
import { requestAutofill } from '@/lib/ai/autofill-client';
import { makeAiJpeg } from '@/lib/images/process-image';
import type { PoseDraft } from '@/lib/schemas/pose-draft-schema';
import type { AutofillImage } from '@/lib/types/pose';
import { useToast } from '@/components/ui/toast';
import type { FormImage } from './form-image';
import type { FieldKey } from './form-values';

const MAX_AI_IMAGES = 3;

function messageFor(err: unknown): string {
  const code = err instanceof Error ? err.message : '';
  if (code === 'ai_quota') return 'Hôm nay hết lượt AI rồi. Bạn nhập tay tiếp nhé';
  if (code === 'ai_disabled') return 'AI đang tạm khoá vì chưa cài API key';
  return 'AI chưa trả lời được. Bạn nhập tay hoặc thử lại sau nhé';
}

/** Uploaded images go by id; fresh ones are sent as a <=1024px JPEG. */
async function toAutofillImages(images: FormImage[]): Promise<AutofillImage[]> {
  return Promise.all(
    images.slice(0, MAX_AI_IMAGES).map(
      async (img): Promise<AutofillImage> =>
        img.kind === 'existing' ? { imageId: img.id } : { file: await makeAiJpeg(img.processed.full) },
    ),
  );
}

/**
 * "AI điền giúp": calls the API only when `run` is invoked by a button press, never
 * automatically. A second press while running is ignored. The caption box text (if any) is sent
 * along as data; one press is one quota unit. `onFilled` gets the keys the AI filled.
 */
export function useAiAutofill(
  images: FormImage[],
  caption: string,
  applyAi: (ai: Partial<PoseDraft>) => FieldKey[],
  onFilled: (filled: FieldKey[]) => void,
) {
  const showToast = useToast();
  const [running, setRunning] = useState(false);
  const busy = useRef(false);

  const run = useCallback(async () => {
    if (busy.current || images.length === 0) return;
    busy.current = true;
    setRunning(true);
    try {
      const ai = await requestAutofill(await toAutofillImages(images), caption.trim() || undefined);
      const filled = applyAi(ai);
      onFilled(filled);
      showToast(
        filled.length > 0
          ? `AI đã điền ${filled.length} mục, bạn xem lại nhé ✨`
          : 'AI chưa nhìn ra thêm gì. Bạn điền tay hoặc để sau nhé.',
      );
    } catch (err) {
      showToast(messageFor(err), { kind: 'error' });
    } finally {
      busy.current = false;
      setRunning(false);
    }
  }, [applyAi, caption, images, onFilled, showToast]);

  return { running, run };
}
