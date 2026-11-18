import type { Metadata } from 'next';
import { SuggestScreen } from '@/components/ai/suggest-screen';
import { isAiConfigured } from '@/lib/ai/ai-availability';

export const metadata: Metadata = { title: 'AI gợi ý dáng' };

// Reads env at request time so adding the API key unlocks the tab without a rebuild.
export const dynamic = 'force-dynamic';

export default function SuggestPage() {
  return <SuggestScreen aiEnabled={isAiConfigured()} />;
}
