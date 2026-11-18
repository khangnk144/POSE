'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { poseDraftSchema } from '@/lib/schemas/pose-draft-schema';
import { AiFillButton } from './ai-fill-button';
import { BasicsSection } from './basics-section';
import { SOURCE_URL_FIELD_ID } from './extras-section';
import { type ExistingImage, type FormImage } from './form-image';
import {
  countDetailValues,
  DETAIL_KEYS,
  EMPTY_VALUES,
  type FieldKey,
  type FormValues,
  toDraftInput,
} from './form-values';
import { ImagePicker } from './image-picker';
import { PoseDetailsPanel } from './pose-details-panel';
import { createPose, updatePose } from './save-pose';
import { useAiAutofill } from './use-ai-autofill';
import { type FocusTarget, useDetailsPanel } from './use-details-panel';
import { useImageIntake } from './use-image-intake';
import { usePoseFormState } from './use-pose-form-state';

export type PoseFormProps = {
  aiEnabled: boolean;
  /** Existing tags used by other poses, most used first. */
  tagSuggestions: string[];
} & (
  | { mode: 'create' }
  | {
      mode: 'edit';
      poseId: string;
      initialValues: FormValues;
      initialImages: ExistingImage[];
      /** `?focus=` of the edit page: opens the details and jumps to that section. */
      focus?: FocusTarget;
    }
);

/** Add / edit pose form. Images are processed on pick and uploaded only when saved. */
export function PoseForm(props: PoseFormProps) {
  const { aiEnabled, tagSuggestions } = props;
  const isEdit = props.mode === 'edit';
  const router = useRouter();
  const showToast = useToast();
  const { values, set: setValue, applyAi, flash, dirty } = usePoseFormState(isEdit ? props.initialValues : EMPTY_VALUES);
  const [aiFilled, setAiFilled] = useState(0);
  const set: typeof setValue = useCallback(
    (key, value) => {
      setAiFilled(0);
      setValue(key, value);
    },
    [setValue],
  );
  const panel = useDetailsPanel({
    initialOpen: isEdit && countDetailValues(props.initialValues) > 0,
    focus: isEdit ? props.focus : undefined,
  });
  const { revealToggle } = panel;
  const [images, setImages] = useState<FormImage[]>(isEdit ? props.initialImages : []);
  const [removed, setRemoved] = useState<ExistingImage[]>([]);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const intake = useImageIntake(images, setImages);
  const onAiFilled = useCallback(
    (filled: FieldKey[]) => {
      const inDetails = filled.filter((key) => (DETAIL_KEYS as readonly FieldKey[]).includes(key)).length;
      setAiFilled(inDetails);
      if (inDetails > 0) revealToggle();
    },
    [revealToggle],
  );
  const ai = useAiAutofill(images, values.description, applyAi, onAiFilled);
  const leaving = useRef(false);
  const blobUrls = useRef<string[]>([]);

  useEffect(() => {
    blobUrls.current = images.flatMap((i) => (i.kind === 'new' ? [i.previewUrl] : []));
  }, [images]);
  useEffect(() => () => blobUrls.current.forEach((u) => URL.revokeObjectURL(u)), []);

  const hasChanges = dirty || removed.length > 0 || images.some((i) => i.kind === 'new');
  useEffect(() => {
    if (!hasChanges) return;
    const warn = (e: BeforeUnloadEvent) => {
      if (!leaving.current) e.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [hasChanges]);

  const removeImage = (img: FormImage) => {
    setImages((list) => list.filter((i) => i.id !== img.id));
    if (img.kind === 'existing') setRemoved((r) => [...r, img]);
    else URL.revokeObjectURL(img.previewUrl);
  };

  const goBack = () => router.push(isEdit ? `/poses/${props.poseId}` : '/');
  const cancel = () => {
    if (hasChanges && !window.confirm('Bỏ những thay đổi chưa lưu?')) return;
    leaving.current = true;
    goBack();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const parsed = poseDraftSchema.safeParse(toDraftInput(values));
    if (!parsed.success) {
      const next: Partial<Record<FieldKey, string>> = {};
      for (const issue of parsed.error.issues) next[issue.path[0] as FieldKey] ??= issue.message;
      setErrors(next);
      if (next.sourceUrl) panel.reveal(SOURCE_URL_FIELD_ID, true);
      showToast('Kiểm tra lại các ô báo đỏ nhé', { kind: 'error' });
      return;
    }
    setErrors({});
    if (intake.processing > 0) return showToast('Đợi ảnh xử lý xong rồi lưu nhé', { kind: 'error' });
    if (parsed.data.status === 'published' && images.length === 0) {
      return showToast('Thêm ít nhất 1 ảnh nhé. Chưa có ảnh thì mở "Thêm chi tiết" rồi chọn Nháp.', { kind: 'error' });
    }

    setSaving(true);
    const onProgress = (id: string, f: number) => setProgress((p) => ({ ...p, [id]: f }));
    try {
      const supabase = createSupabaseBrowserClient();
      let id: string;
      if (props.mode === 'edit') {
        await updatePose(supabase, props.poseId, parsed.data, images, removed, onProgress);
        id = props.poseId;
      } else {
        id = await createPose(supabase, parsed.data, images, onProgress);
      }
      leaving.current = true;
      showToast('Đã lưu dáng 💗');
      router.push(`/poses/${id}`);
      router.refresh();
    } catch (err) {
      console.error('Save pose failed', err);
      showToast('Chưa lưu được dáng. Kiểm tra mạng rồi thử lại nhé', { kind: 'error' });
      setProgress({});
      setSaving(false);
    }
  };

  const cover = images[0]?.previewUrl ?? null;
  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-8" aria-busy={saving}>
      <h1 className="font-display text-[22px] font-bold leading-[30px]">{isEdit ? 'Sửa dáng' : 'Thêm dáng'}</h1>
      <div className="flex flex-col gap-4">
        <ImagePicker
          images={images}
          onChange={setImages}
          onRemove={removeImage}
          intake={intake}
          progress={progress}
          disabled={saving}
        />
        <BasicsSection values={values} set={set} flash={flash} errors={errors} aiRunning={ai.running} />
        <AiFillButton
          aiEnabled={aiEnabled}
          hasImages={images.length > 0}
          hasCaption={values.description.trim() !== ''}
          running={ai.running}
          onClick={ai.run}
        />
      </div>
      <PoseDetailsPanel
        open={panel.open}
        onToggle={panel.toggle}
        aiRunning={ai.running}
        aiFilled={aiFilled}
        values={values}
        set={set}
        flash={flash}
        errors={errors}
        tagSuggestions={tagSuggestions}
        coverUrl={cover}
      />
      <div className="sticky bottom-0 z-20 -mx-4 flex gap-3 border-t border-border bg-bg/95 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 backdrop-blur">
        <Button variant="secondary" onClick={cancel} disabled={saving}>
          Huỷ
        </Button>
        <Button type="submit" className="flex-1" loading={saving} loadingLabel="Đang lưu…">
          {isEdit ? 'Lưu thay đổi' : 'Lưu dáng'}
        </Button>
      </div>
    </form>
  );
}
