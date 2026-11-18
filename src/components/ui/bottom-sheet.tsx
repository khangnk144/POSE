'use client';

import { Drawer } from 'vaul';
import { X } from 'lucide-react';
import { IconButton } from './icon-button';

/**
 * Bottom sheet built on vaul: drag down / tap overlay / Esc / close button to dismiss,
 * focus is trapped and restored by the library. Controlled via `open`/`onOpenChange`.
 */
export function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  footer,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Sticky action area (kept above the safe-area inset). */
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-overlay" />
        <Drawer.Content
          className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[90vh] w-full max-w-xl flex-col rounded-t-xl bg-surface shadow-lg outline-none"
          aria-describedby={description ? undefined : undefined}
        >
          <div aria-hidden className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-border-strong/40" />
          <div className="flex items-center justify-between gap-2 px-4 pt-1">
            <Drawer.Title className="font-display text-[17px] font-bold">{title}</Drawer.Title>
            <Drawer.Close asChild>
              <IconButton label="Đóng">
                <X className="size-5" aria-hidden />
              </IconButton>
            </Drawer.Close>
          </div>
          {description ? (
            <Drawer.Description className="px-4 text-sm text-text-2">{description}</Drawer.Description>
          ) : null}
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">{children}</div>
          {footer ? (
            <div className="border-t border-border px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {footer}
            </div>
          ) : (
            <div className="h-[env(safe-area-inset-bottom)]" />
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
