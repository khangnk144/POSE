import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { PoseForm } from '@/components/pose-form/pose-form';
import { fetchPoseForEdit, fetchTagSuggestions } from '@/components/pose-form/fetch-form-data';
import { isAiConfigured } from '@/lib/ai/ai-availability';

export const metadata: Metadata = { title: 'Sửa dáng' };

export default async function EditPosePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();

  const [pose, tagSuggestions] = await Promise.all([fetchPoseForEdit(id), fetchTagSuggestions()]);
  if (!pose) notFound();

  return (
    <PoseForm
      mode="edit"
      poseId={id}
      initialValues={pose.values}
      initialImages={pose.images}
      aiEnabled={isAiConfigured()}
      tagSuggestions={tagSuggestions}
    />
  );
}
