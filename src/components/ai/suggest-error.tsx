'use client';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import type { AiErrorCode } from '@/lib/ai/ai-http';

type Copy = { illustration: string; title: string; description?: string; retry?: string };

function copyFor(code: AiErrorCode, detail?: string): Copy {
  switch (code) {
    case 'ai_quota':
      return { illustration: '🌙', title: 'Hôm nay hết lượt AI rồi', description: 'Mai quay lại nha, lượt AI sẽ được làm mới.' };
    case 'scene_unclear':
      return {
        illustration: '🌫️',
        title: 'Ảnh chưa rõ cảnh',
        description: detail || 'Ảnh hơi tối hoặc mờ, mình chưa nhìn ra cảnh. Bạn chụp lại gần chỗ sáng hơn nhé.',
        retry: 'Chụp lại',
      };
    case 'network':
      return { illustration: '🔌', title: 'Mạng đang chập chờn', description: 'Kiểm tra kết nối rồi thử lại nha.', retry: 'Thử lại' };
    case 'invalid_image':
      return { illustration: '🖼️', title: 'Ảnh này mình chưa đọc được', description: 'Bạn thử chọn ảnh khác nhé.', retry: 'Chọn ảnh khác' };
    case 'ai_disabled':
      return { illustration: '🔑', title: 'AI đang tạm khoá', description: 'Nhờ admin thêm ANTHROPIC_API_KEY nha.' };
    default:
      return { illustration: '🔌', title: 'AI đang bận xíu, bạn thử lại nhé', retry: 'Thử lại' };
  }
}

/** One friendly state per failure kind (design.md section 6.6). */
export function SuggestError({
  code,
  detail,
  onRetry,
  onNewPhoto,
}: {
  code: AiErrorCode;
  detail?: string;
  onRetry: () => void;
  onNewPhoto: () => void;
}) {
  const copy = copyFor(code, detail);
  // Transient errors retry the same photo; unclear/invalid photos need a new one instead.
  const retryAction = code === 'scene_unclear' || code === 'invalid_image' ? onNewPhoto : onRetry;
  return (
    <div role="alert">
      <EmptyState
        illustration={copy.illustration}
        title={copy.title}
        description={copy.description}
        action={
          <div className="flex flex-col gap-2">
            {copy.retry ? <Button onClick={retryAction}>{copy.retry}</Button> : null}
            <Button variant="text" onClick={onNewPhoto}>
              Chụp cảnh khác
            </Button>
          </div>
        }
      />
    </div>
  );
}
