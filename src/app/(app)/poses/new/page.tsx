import type { Metadata } from 'next';
import { PoseForm } from '@/components/pose-form/pose-form';
import { fetchTagSuggestions } from '@/components/pose-form/fetch-form-data';
import { isAiConfigured } from '@/lib/ai/ai-availability';

export const metadata: Metadata = { title: 'Thêm dáng' };

export default async function NewPosePage() {
  const tagSuggestions = await fetchTagSuggestions();
  return <PoseForm mode="create" aiEnabled={isAiConfigured()} tagSuggestions={tagSuggestions} />;
}
