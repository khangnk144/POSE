'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlaceFormSheet } from './place-form-sheet';

export function AddPlaceButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} className="min-h-11 px-4">
        <Plus className="size-5" aria-hidden /> Thêm địa điểm
      </Button>
      {open ? <PlaceFormSheet open={open} onOpenChange={setOpen} /> : null}
    </>
  );
}
