import { Lock } from 'lucide-react';

/**
 * Hint rendered right under a disabled AI button when no ANTHROPIC_API_KEY is set.
 * Always visible (no tooltip: mobile has no hover).
 */
export function FeatureLockedHint({
  message = '🔑 AI đang tạm khoá vì chưa cài API key. Nhờ admin thêm ANTHROPIC_API_KEY nha.',
}: {
  message?: string;
}) {
  return (
    <p role="note" className="flex items-start gap-1.5 text-xs text-text-2">
      <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      <span>{message}</span>
    </p>
  );
}
