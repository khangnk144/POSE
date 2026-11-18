'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { FilterChip } from '@/components/ui/chip';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { countPoses } from '@/lib/poses/pose-card-query';
import type { PoseFilters } from '@/lib/types/pose';
import { ChipGroup, EnumFilterGroups } from './pose-filter-groups';
import { FilterSwitch } from './pose-filter-switch';

type Option = { id: string; label: string };
type Options = { places: Option[]; people: Option[] } | 'loading' | 'error';

/** Count of poses matching the draft filters; `null` while counting. */
function useLiveCount(open: boolean, draft: PoseFilters) {
  const [state, setState] = useState<{ key: string; count: number | null }>({ key: '', count: null });
  const key = JSON.stringify(draft);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      countPoses(createSupabaseBrowserClient(), draft)
        .then((count) => !cancelled && setState({ key, count }))
        .catch(() => !cancelled && setState({ key, count: -1 }));
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // `key` is the serialised draft; depending on the object itself would refetch on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, key]);

  return state.key === key ? state.count : null;
}

function useFilterOptions(open: boolean, reloadToken: number): Options {
  const [options, setOptions] = useState<Options>('loading');

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const supabase = createSupabaseBrowserClient();
    Promise.all([
      supabase.from('places').select('id,name').order('name'),
      supabase.from('profiles').select('id,display_name,avatar_emoji').order('display_name'),
    ]).then(([places, profiles]) => {
      if (cancelled) return;
      if (places.error || profiles.error) return setOptions('error');
      setOptions({
        places: places.data.map((p) => ({ id: p.id, label: p.name })),
        people: profiles.data.map((p) => ({ id: p.id, label: `${p.avatar_emoji} ${p.display_name}` })),
      });
    });
    return () => {
      cancelled = true;
    };
  }, [open, reloadToken]);

  return options;
}

/**
 * Filter bottom sheet (remount it with a new `key` per opening to restart from the applied filters).
 * Changes stay in a local draft and apply on "Xem N dáng"; closing the sheet
 * discards them (design 6.3).
 */
export function PoseFilterSheet({
  open,
  onOpenChange,
  filters,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: PoseFilters;
  onApply: (next: PoseFilters) => void;
}) {
  const [draft, setDraft] = useState<PoseFilters>(filters);
  const [reloadToken, setReloadToken] = useState(0);
  const options = useFilterOptions(open, reloadToken);
  const count = useLiveCount(open, draft);

  const reset = () => setDraft({ q: filters.q, status: filters.status });
  const empty = count === 0;

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Bộ lọc"
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" onClick={reset} className="shrink-0">
            Đặt lại
          </Button>
          <Button
            className="flex-1"
            disabled={empty || count === -1}
            onClick={() => {
              onApply(draft);
              onOpenChange(false);
            }}
          >
            {count === null ? (
              <Loader2 className="size-4 animate-spin" aria-label="Đang đếm" />
            ) : empty ? (
              'Không có dáng nào'
            ) : count === -1 ? (
              'Không đếm được'
            ) : (
              `Xem ${count} dáng`
            )}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <FilterSwitch
          title="Chỉ dáng yêu thích"
          checked={draft.favoritesOnly ?? false}
          onChange={(on) => setDraft({ ...draft, favoritesOnly: on ? true : undefined })}
        />
        <FilterSwitch
          title="Cần bổ sung"
          description="Dáng chưa có cách cầm máy hoặc các bước tạo dáng"
          checked={draft.needsDetails ?? false}
          onChange={(on) => setDraft({ ...draft, needsDetails: on ? true : undefined })}
        />

        <EnumFilterGroups value={draft} onChange={setDraft} />

        {typeof options === 'string' ? (
          <p className="text-sm text-text-2">
            {options === 'loading' ? (
              'Đang tải địa điểm và người đăng…'
            ) : (
              <button type="button" className="min-h-11 underline" onClick={() => setReloadToken((n) => n + 1)}>
                Không tải được địa điểm, chạm để thử lại
              </button>
            )}
          </p>
        ) : (
          <>
            {options.places.length ? (
              <ChipGroup label="Địa điểm" hint="chọn một">
                {options.places.map((place) => (
                  <FilterChip
                    key={place.id}
                    mode="radio"
                    selected={draft.placeId === place.id}
                    onToggle={() => setDraft({ ...draft, placeId: draft.placeId === place.id ? undefined : place.id })}
                  >
                    {place.label}
                  </FilterChip>
                ))}
              </ChipGroup>
            ) : null}
            <ChipGroup label="Người đăng" hint="chọn một">
              {options.people.map((person) => (
                <FilterChip
                  key={person.id}
                  mode="radio"
                  selected={draft.createdBy === person.id}
                  onToggle={() => setDraft({ ...draft, createdBy: draft.createdBy === person.id ? undefined : person.id })}
                >
                  {person.label}
                </FilterChip>
              ))}
            </ChipGroup>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
