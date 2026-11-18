'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LINES = [
  'Đang ngắm cảnh của bạn…',
  'Đang xem nắng chiếu hướng nào…',
  'Đang lục thư viện tìm dáng hợp…',
  'Sắp xong rồi, đợi mình xíu nha ✨',
];

/** Step 2: scene photo with a scanning band, rotating copy every 2.5s, and a cancel button. */
export function SuggestWaiting({ previewUrl, onCancel }: { previewUrl: string; onCancel: () => void }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const t = setInterval(() => setI((n) => Math.min(n + 1, LINES.length - 1)), 2500);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="flex flex-col items-center gap-5 py-4" aria-busy="true">
      <div className="relative w-full max-w-xs overflow-hidden rounded-xl shadow-md">
        {/* eslint-disable-next-line @next/next/no-img-element -- local blob URL, not optimizable */}
        <img src={previewUrl} alt="Ảnh cảnh bạn vừa chụp" className="max-h-[48vh] w-full object-cover" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-transparent via-ai-soft/70 to-transparent motion-safe:animate-pulse" />
      </div>
      <div aria-hidden className="flex size-16 items-center justify-center rounded-full bg-ai-soft text-ai">
        <Sparkles className="size-8 motion-safe:animate-spin" />
      </div>
      <p role="status" aria-live="polite" className="text-center font-medium text-text">
        {LINES[i]}
      </p>
      <Button variant="secondary" onClick={onCancel}>
        Huỷ
      </Button>
    </section>
  );
}
