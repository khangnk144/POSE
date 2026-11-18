'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, ChevronRight, MapPin, Plus, X } from 'lucide-react';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils/cn';
import { createPlace, listPlaceOptions, type PlaceOption } from '@/lib/places/place-actions';
import { filterPlaces } from '@/lib/places/place-search';
import { PlaceForm } from './place-form';

export type PlacePickerProps = {
  /** Selected place id, or null when none. */
  value: string | null;
  /** Called with the new place id (existing or just created), or null when cleared. */
  onChange: (placeId: string | null) => void;
};

/**
 * Field that lets the user pick a saved place or create one (name, address, Maps link)
 * from a bottom sheet. Used by the pose form.
 */
export function PlacePicker({ value, onChange }: PlacePickerProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'list' | 'create'>('list');
  const [query, setQuery] = useState('');
  const [places, setPlaces] = useState<PlaceOption[]>([]);
  const [loadError, setLoadError] = useState(false);
  const showToast = useToast();

  const load = useCallback(async () => {
    try {
      setPlaces(await listPlaceOptions());
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    listPlaceOptions()
      .then((list) => !cancelled && setPlaces(list))
      .catch(() => !cancelled && setLoadError(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = places.find((p) => p.id === value) ?? null;
  const visible = filterPlaces(places, query);

  function close() {
    setOpen(false);
    setMode('list');
    setQuery('');
  }

  function choose(id: string | null) {
    onChange(id);
    close();
  }

  return (
    <div>
      <span className="mb-1.5 block text-[13px] font-medium">Địa điểm</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className="flex min-h-12 flex-1 items-center gap-2 rounded-sm border border-border-strong bg-surface px-3.5 text-left"
        >
          <MapPin className="size-5 shrink-0 text-text-2" aria-hidden />
          <span className={cn('min-w-0 flex-1 truncate', !selected && 'text-text-3')}>
            {selected ? selected.name : value ? 'Đang tải…' : 'Chọn địa điểm'}
          </span>
          <ChevronRight className="size-5 shrink-0 text-text-3" aria-hidden />
        </button>
        {value ? (
          <button
            type="button"
            aria-label="Bỏ chọn địa điểm"
            onClick={() => onChange(null)}
            className="flex size-11 items-center justify-center rounded-full hover:bg-surface-3"
          >
            <X className="size-5" aria-hidden />
          </button>
        ) : null}
      </div>

      <BottomSheet
        open={open}
        onOpenChange={(o) => (o ? setOpen(true) : close())}
        title={mode === 'create' ? 'Địa điểm mới' : 'Chọn địa điểm'}
      >
        {mode === 'create' ? (
          <PlaceForm
            compact
            submitLabel="Lưu và chọn"
            initial={{ name: query }}
            onSubmit={async (input) => {
              const id = await createPlace(input);
              await load();
              showToast('Đã thêm địa điểm.');
              choose(id);
            }}
          />
        ) : (
          <div className="flex flex-col gap-3">
            <input
              type="search"
              aria-label="Tìm địa điểm đã lưu"
              placeholder="Tìm địa điểm đã lưu"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-12 w-full rounded-sm border border-border-strong bg-surface px-3.5 placeholder:text-text-3"
            />
            {loadError ? (
              <p role="alert" className="text-sm text-danger">
                Chưa tải được danh sách địa điểm.{' '}
                <button type="button" className="font-semibold underline" onClick={() => void load()}>
                  Thử lại
                </button>
              </p>
            ) : null}
            <ul className="flex flex-col">
              {visible.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => choose(p.id)}
                    className="flex min-h-14 w-full items-center gap-3 rounded-sm px-2 text-left hover:bg-surface-2"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{p.name}</span>
                      {p.address ? <span className="block truncate text-sm text-text-2">{p.address}</span> : null}
                    </span>
                    {p.id === value ? <Check className="size-5 text-primary" aria-label="Đang chọn" /> : null}
                  </button>
                </li>
              ))}
            </ul>
            {!loadError && visible.length === 0 ? (
              <p className="py-2 text-center text-sm text-text-2">
                {places.length === 0 ? 'Chưa có địa điểm nào.' : 'Không thấy địa điểm này.'}
              </p>
            ) : null}
            <Button variant="secondary" onClick={() => setMode('create')}>
              <Plus className="size-5" aria-hidden />
              {query.trim() ? `Tạo "${query.trim()}"` : 'Tạo địa điểm mới'}
            </Button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
