import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { ShootDetailView } from '@/components/shoot/shoot-detail-view';
import { getShoot } from '@/lib/shoots/shoot-queries';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { requireMember } from '@/lib/supabase/session';

export const metadata: Metadata = { title: 'Chi tiết buổi chụp' };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ShootDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const me = await requireMember();
  const supabase = await createSupabaseServerClient();
  const shoot = await getShoot(supabase, id);
  if (!shoot) notFound();

  return (
    <div className="flex flex-col gap-2">
      <Link href="/shoots" className="inline-flex min-h-11 items-center gap-1 self-start text-text-2">
        <ChevronLeft className="size-5" aria-hidden /> Buổi chụp
      </Link>
      <ShootDetailView shoot={shoot} canDelete={me.role === 'admin' || me.id === shoot.createdBy} />
    </div>
  );
}
