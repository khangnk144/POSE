import type { Metadata } from 'next';
import { AddShootButton } from '@/components/shoot/add-shoot-button';
import { ShootCard } from '@/components/shoot/shoot-card';
import { EmptyState } from '@/components/ui/empty-state';
import { listShoots } from '@/lib/shoots/shoot-queries';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';

export const metadata: Metadata = { title: 'Buổi chụp' };

export default async function ShootsPage() {
  const supabase = await createSupabaseServerClient();
  const shoots = await listShoots(supabase);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-[22px] font-bold leading-[30px]">Buổi chụp</h1>
        <AddShootButton />
      </div>
      {shoots.length === 0 ? (
        <EmptyState
          illustration="🎞️"
          title="Chưa có buổi chụp nào"
          description="Tạo một buổi chụp, thêm các dáng muốn thử rồi lướt qua từng dáng khi đang chụp."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {shoots.map((s) => (
            <ShootCard key={s.id} shoot={s} />
          ))}
        </ul>
      )}
    </div>
  );
}
