'use client';

import { Button } from '@/components/ui/button';
import { FeatureLockedHint } from '@/components/ui/feature-locked-hint';

/**
 * "AI điền giúp". Enabled only when AI is configured, there is at least one image and no
 * request is running. When AI is not configured the locked hint is always shown below.
 */
export function AiFillButton({
  aiEnabled,
  hasImages,
  running,
  onClick,
}: {
  aiEnabled: boolean;
  hasImages: boolean;
  running: boolean;
  onClick: () => void;
}) {
  const disabled = !aiEnabled || !hasImages || running;
  return (
    <div className="flex flex-col gap-1.5">
      <Button
        variant="ai"
        disabled={disabled}
        loading={running}
        loadingLabel="AI đang xem ảnh…"
        onClick={onClick}
        className="self-start"
      >
        <span aria-hidden>✨</span> AI điền giúp
      </Button>
      {!aiEnabled ? (
        <FeatureLockedHint />
      ) : !hasImages ? (
        <p className="text-xs text-text-2">Thêm ít nhất 1 ảnh để AI điền giúp nhé.</p>
      ) : null}
    </div>
  );
}
