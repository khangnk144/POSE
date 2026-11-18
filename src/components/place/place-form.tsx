'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { placeInputSchema, type PlaceInput } from '@/lib/places/place-schema';

type Values = { name: string; address: string; mapsUrl: string; note: string };

const EMPTY: Values = { name: '', address: '', mapsUrl: '', note: '' };

/**
 * Place fields with inline validation. `onSubmit` may throw: the message is shown under the form.
 * `compact` hides the note field (quick create from the picker).
 */
export function PlaceForm({
  initial,
  submitLabel,
  compact = false,
  onSubmit,
}: {
  initial?: Partial<Values>;
  submitLabel: string;
  compact?: boolean;
  onSubmit: (input: PlaceInput) => Promise<void>;
}) {
  const [values, setValues] = useState<Values>({ ...EMPTY, ...initial });
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const set = (key: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    setFormError(undefined);
    const parsed = placeInputSchema.safeParse(values);
    if (!parsed.success) {
      const next: Partial<Record<keyof Values, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof Values;
        next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Chưa lưu được, bạn thử lại nha.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <Input label="Tên địa điểm" value={values.name} onChange={set('name')} error={errors.name} maxLength={120} autoComplete="off" />
      <Input label="Địa chỉ" value={values.address} onChange={set('address')} error={errors.address} maxLength={300} autoComplete="off" />
      <Input
        label="Link Google Maps"
        type="url"
        inputMode="url"
        value={values.mapsUrl}
        onChange={set('mapsUrl')}
        error={errors.mapsUrl}
        hint="Không bắt buộc. Để trống thì app tự tìm theo tên và địa chỉ."
        autoComplete="off"
      />
      {compact ? null : <Textarea label="Ghi chú" value={values.note} onChange={set('note')} error={errors.note} maxLength={500} />}
      {formError ? (
        <p role="alert" className="text-sm text-danger">
          {formError}
        </p>
      ) : null}
      <Button type="submit" loading={saving} loadingLabel="Đang lưu…">
        {submitLabel}
      </Button>
    </form>
  );
}
