import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { PoseForm } from '@/components/pose-form/pose-form';
import { fetchPoseForEdit, fetchTagSuggestions } from '@/components/pose-form/fetch-form-data';
import { isAiConfigured } from '@/lib/ai/ai-availability';

export const metadata: Metadata = { title: 'Sửa dáng' };

/** `?focus=camera|steps` opens the details on that section; anything else is ignored. */
function parseFocus(value: string | string[] | undefined): 'camera' | 'steps' | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v === 'camera' || v === 'steps' ? v : undefined;
}

export default async function EditPosePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ focus?: string | string[] }>;
}) {
  const [{ id }, { focus }] = await Promise.all([params, searchParams]);
  if (!z.string().uuid().safeParse(id).success) notFound();

  const [pose, tagSuggestions] = await Promise.all([fetchPoseForEdit(id), fetchTagSuggestions()]);
  if (!pose) notFound();

  return (
    <PoseForm
      mode="edit"
      poseId={id}
      initialValues={pose.values}
      initialImages={pose.images}
      focus={parseFocus(focus)}
      aiEnabled={isAiConfigured()}
      tagSuggestions={tagSuggestions}
    />
  );
}
