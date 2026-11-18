'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { SuggestCapture } from './suggest-capture';
import { SuggestError } from './suggest-error';
import { SuggestResult } from './suggest-result';
import { SuggestWaiting } from './suggest-waiting';
import { AiClientError, type AiErrorCode } from '@/lib/ai/ai-http';
import { shrinkToJpeg } from '@/lib/ai/shrink-image';
import { requestSuggest, type SuggestResponse } from '@/lib/ai/suggest-client';
import { getPoseCardsByIds } from '@/lib/poses/pose-card-query';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import type { PeopleCount, PoseCardData } from '@/lib/types/pose';

type View =
  | { step: 'capture' }
  | { step: 'waiting' }
  | { step: 'result'; data: SuggestResponse; cards: PoseCardData[]; cardsFailed: boolean }
  | { step: 'error'; code: AiErrorCode; detail?: string };

/**
 * "AI gợi ý dáng" flow. The paid call only starts when the user picks a photo or taps
 * "Gợi ý lại"; nothing runs on load. With `aiEnabled=false` it stays on the locked capture step.
 */
export function SuggestScreen({ aiEnabled }: { aiEnabled: boolean }) {
  const [view, setView] = useState<View>({ step: 'capture' });
  const [people, setPeople] = useState<PeopleCount | undefined>();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const photo = useRef<Blob | null>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => () => abort.current?.abort(), []);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const run = useCallback(async (blob: Blob, peopleCount: PeopleCount | undefined) => {
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setView({ step: 'waiting' });
    try {
      const data = await requestSuggest(blob, peopleCount, controller.signal);
      let cards: PoseCardData[] = [];
      let cardsFailed = false;
      if (data.matches.length > 0) {
        try {
          cards = await getPoseCardsByIds(createSupabaseBrowserClient(), data.matches.map((m) => m.poseId));
        } catch {
          cardsFailed = true;
        }
      }
      setView({ step: 'result', data, cards, cardsFailed });
    } catch (e) {
      if (controller.signal.aborted) return; // user cancelled: handled by cancel()
      const err = e instanceof AiClientError ? e : new AiClientError('ai_failed');
      setView({ step: 'error', code: err.code, detail: err.detail });
    }
  }, []);

  const onPick = useCallback(
    async (file: File) => {
      try {
        const blob = await shrinkToJpeg(file);
        photo.current = blob;
        setPreviewUrl(URL.createObjectURL(blob));
        await run(blob, people);
      } catch (e) {
        const code = e instanceof AiClientError ? e.code : 'invalid_image';
        setView({ step: 'error', code });
      }
    },
    [people, run],
  );

  const newPhoto = useCallback(() => {
    abort.current?.abort();
    photo.current = null;
    setPreviewUrl(null);
    setView({ step: 'capture' });
  }, []);

  const retry = useCallback(() => {
    if (photo.current) void run(photo.current, people);
    else newPhoto();
  }, [newPhoto, people, run]);

  if (view.step === 'waiting' && previewUrl) return <SuggestWaiting previewUrl={previewUrl} onCancel={newPhoto} />;
  if (view.step === 'result' && previewUrl) {
    return (
      <SuggestResult
        previewUrl={previewUrl}
        data={view.data}
        cards={view.cards}
        cardsFailed={view.cardsFailed}
        onRetry={retry}
        onNewPhoto={newPhoto}
      />
    );
  }
  if (view.step === 'error') return <SuggestError code={view.code} detail={view.detail} onRetry={retry} onNewPhoto={newPhoto} />;
  return <SuggestCapture aiEnabled={aiEnabled} people={people} onPeopleChange={setPeople} onPick={onPick} />;
}
