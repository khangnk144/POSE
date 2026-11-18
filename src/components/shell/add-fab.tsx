'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Plus, Sparkles, SquarePlus } from 'lucide-react';
import { BottomSheet } from '@/components/ui/bottom-sheet';

/** Floating "+" button above the tab bar; opens a two-choice sheet. */
export function AddFab() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const itemClass = 'flex min-h-14 items-center gap-3 rounded-md px-3 text-[15px] font-semibold hover:bg-surface-2';

  return (
    <>
      <button
        type="button"
        aria-label="Thêm"
        onClick={() => setOpen(true)}
        className="fixed right-4 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-fab transition-transform duration-[var(--dur-fast)] active:scale-[0.94]"
        style={{ bottom: 'calc(var(--tab-bar-h) + 16px + env(safe-area-inset-bottom))' }}
      >
        <Plus className="size-6" aria-hidden />
      </button>
      <BottomSheet open={open} onOpenChange={setOpen} title="Thêm gì nè?">
        <div className="flex flex-col gap-1">
          <Link href="/poses/new" onClick={close} className={itemClass}>
            <SquarePlus className="size-6 text-primary" aria-hidden />
            Thêm dáng mới
          </Link>
          <Link href="/suggest" onClick={close} className={itemClass}>
            <Sparkles className="size-6 text-ai" aria-hidden />
            <span><span aria-hidden>✨ </span>AI gợi ý dáng</span>
          </Link>
        </div>
      </BottomSheet>
    </>
  );
}
