'use client';

import { useEffect } from 'react';

/**
 * Keeps the screen on while `active`, using the Screen Wake Lock API when the browser has it.
 * The browser drops the lock whenever the tab is hidden, so it is requested again on return.
 * Unsupported or refused (e.g. low battery) is silent: shooting mode works without it.
 */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;
    let sentinel: WakeLockSentinel | null = null;
    let disposed = false;

    async function acquire() {
      if (disposed || document.visibilityState !== 'visible') return;
      try {
        sentinel = await navigator.wakeLock.request('screen');
        if (disposed) void sentinel.release();
      } catch {
        sentinel = null;
      }
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void acquire();
    };

    void acquire();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', onVisibility);
      void sentinel?.release().catch(() => undefined);
    };
  }, [active]);
}
