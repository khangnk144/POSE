'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShootFormSheet } from './shoot-form-sheet';

export function AddShootButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} className="min-h-11 px-4">
        <Plus className="size-5" aria-hidden /> Buổi chụp mới
      </Button>
      {open ? <ShootFormSheet open={open} onOpenChange={setOpen} /> : null}
    </>
  );
}
