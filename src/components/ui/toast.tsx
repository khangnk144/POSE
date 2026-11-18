'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

type ToastOptions = {
  /** `error` toasts use role="alert". */
  kind?: 'info' | 'error';
  /** Optional action such as "Hoàn tác"; extends the lifetime to 5s. */
  action?: { label: string; onClick: () => void };
};

type ToastState = ToastOptions & { id: number; message: string };

const ToastContext = createContext<((message: string, options?: ToastOptions) => void) | null>(null);

/** Returns `showToast(message, options?)`. Only one toast is visible; a new one replaces the old. */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const counter = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => setToast(null), []);

  const show = useCallback((message: string, options: ToastOptions = {}) => {
    if (timer.current) clearTimeout(timer.current);
    counter.current += 1;
    setToast({ id: counter.current, message, ...options });
    timer.current = setTimeout(dismiss, options.action ? 5000 : 3000);
  }, [dismiss]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 z-[60] flex justify-center px-4"
        style={{ bottom: 'calc(var(--tab-bar-h) + 88px + env(safe-area-inset-bottom))' }}
      >
        {toast ? (
          <div
            key={toast.id}
            role={toast.kind === 'error' ? 'alert' : 'status'}
            className="pointer-events-auto flex max-w-sm items-center gap-3 rounded-full bg-toast-bg px-4 py-3 text-sm text-toast-text shadow-lg"
            style={{ animation: 'toast-in var(--dur-base) var(--ease-out)' }}
          >
            {toast.kind === 'error' ? <AlertTriangle className="size-4 shrink-0" aria-hidden /> : null}
            <span>{toast.message}</span>
            {toast.action ? (
              <button
                type="button"
                className="min-h-11 shrink-0 font-semibold underline"
                onClick={() => {
                  toast.action?.onClick();
                  dismiss();
                }}
              >
                {toast.action.label}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </ToastContext.Provider>
  );
}
