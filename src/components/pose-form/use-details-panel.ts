'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { DETAILS_TOGGLE_ID } from './details-toggle';

export type FocusTarget = 'camera' | 'steps';

/** First control of a section: the first picture option, the first step input, else "Thêm bước". */
const FIRST_CONTROL: Record<FocusTarget, string> = {
  camera: '[role="radio"]',
  steps: 'input[aria-label^="Bước"], [data-add-step]',
};

function scrollTo(el: HTMLElement) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
}

type Reveal = { id: string; focus: boolean };

/**
 * Open/closed state of "Thêm chi tiết" plus scrolling. Starts open when `initialOpen` or when
 * the page was opened with `?focus=camera|steps` (then that section is scrolled to and its first
 * control focused). `reveal` opens the panel and scrolls to an element once it is visible.
 */
export function useDetailsPanel({ initialOpen, focus }: { initialOpen: boolean; focus?: FocusTarget }) {
  const [open, setOpen] = useState(initialOpen || focus !== undefined);
  const [pending, setPending] = useState<Reveal | null>(null);
  const handled = useRef<Reveal | null>(null);

  const toggle = useCallback(() => setOpen((o) => !o), []);
  const reveal = useCallback((id: string, focusIt = false) => {
    setOpen(true);
    setPending({ id, focus: focusIt }); // a new object each call, so repeated reveals re-run the effect
  }, []);
  const revealToggle = useCallback(() => reveal(DETAILS_TOGGLE_ID), [reveal]);

  useEffect(() => {
    if (!pending || !open || handled.current === pending) return;
    handled.current = pending;
    const el = document.getElementById(pending.id);
    if (el) {
      scrollTo(el);
      if (pending.focus) el.focus({ preventScroll: true });
    }
  }, [pending, open]);

  useEffect(() => {
    if (!focus) return;
    const section = document.getElementById(`section-${focus}`);
    if (!section) return;
    scrollTo(section);
    section.querySelector<HTMLElement>(FIRST_CONTROL[focus])?.focus({ preventScroll: true });
  }, [focus]);

  return { open, toggle, reveal, revealToggle };
}
