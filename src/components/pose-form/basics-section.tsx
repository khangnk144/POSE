'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils/cn';
import { FlashField } from './flash-field';
import type { FieldKey, FormValues } from './form-values';

export type SectionProps = {
  values: FormValues;
  set: <K extends FieldKey>(key: K, value: FormValues[K]) => void;
  flash: ReadonlySet<FieldKey>;
  errors: Partial<Record<FieldKey, string>>;
};

export const MAX_CAPTION = 2000;
const COUNTER_FROM = 1600;

/** The two quick fields: title (required) and the caption/notes box the AI reads together with the photo. */
export function BasicsSection({ values, set, flash, errors, aiRunning }: SectionProps & { aiRunning: boolean }) {
  const showToast = useToast();
  const length = values.description.length;
  return (
    <div className="flex flex-col gap-4">
      <FlashField field="title" flash={flash}>
        <Input
          label="Tên dáng *"
          value={values.title}
          maxLength={160}
          placeholder="vd: Ngồi sofa nhìn ra cửa sổ"
          error={errors.title}
          className={cn(aiRunning && !values.title.trim() && 'animate-pulse bg-ai-soft')}
          onChange={(e) => set('title', e.target.value)}
        />
      </FlashField>
      <FlashField field="description" flash={flash}>
        <Textarea
          label="Ghi chú / caption từ video"
          value={values.description}
          maxLength={MAX_CAPTION}
          placeholder={'Dán caption hoặc mẹo trong video vào đây. vd: "Đặt máy ngang hông, zoom 2x, nghiêng vai về phía máy cho mặt nhỏ nha các bà 📸"'}
          hint={length >= COUNTER_FROM ? `${length}/${MAX_CAPTION}` : 'Không có thì bỏ trống cũng được.'}
          className="min-h-[84px] max-h-[216px] text-base [field-sizing:content]"
          onPaste={(e) => {
            const el = e.currentTarget;
            const selected = el.selectionEnd - el.selectionStart;
            if (length - selected + e.clipboardData.getData('text').length > MAX_CAPTION) {
              showToast('Caption dài quá nên mình cắt còn 2000 ký tự nhé.');
            }
          }}
          onChange={(e) => set('description', e.target.value)}
        />
      </FlashField>
    </div>
  );
}
