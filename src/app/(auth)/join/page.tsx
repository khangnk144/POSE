import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { JoinForm } from '@/components/auth/join-form';
import { getCurrentProfile, getCurrentUserId } from '@/lib/supabase/session';

export const metadata: Metadata = { title: 'Tham gia team' };

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  if (await getCurrentProfile()) redirect('/');
  const hasSession = (await getCurrentUserId()) !== null;
  const { code } = await searchParams;
  return <JoinForm hasSession={hasSession} initialCode={code?.slice(0, 16) ?? ''} />;
}
