'use client';

import { useState } from 'react';
import { Copy, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { rotateInviteCode } from '@/lib/team/team-actions';

/** Admin-only: shows the invite code with copy and rotate. The server page only renders it for admins. */
export function InviteCodePanel({ initialCode }: { initialCode: string }) {
  const [code, setCode] = useState(initialCode);
  const [busy, setBusy] = useState(false);
  const showToast = useToast();

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      showToast('Đã chép mã mời.');
    } catch {
      showToast('Chưa chép được, bạn chọn mã rồi chép tay nha.', { kind: 'error' });
    }
  }

  async function rotate() {
    if (!window.confirm('Đổi mã mời? Mã cũ sẽ không dùng được nữa.')) return;
    setBusy(true);
    try {
      setCode(await rotateInviteCode());
      showToast('Đã đổi mã mời mới.');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Chưa đổi được mã mời.', { kind: 'error' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="invite-title" className="rounded-lg border border-border bg-surface p-4">
      <h2 id="invite-title" className="font-display text-[17px] font-bold">
        Mã mời
      </h2>
      <p className="mt-1 text-sm text-text-2">Chỉ admin thấy mã này. Gửi cho bạn bè để họ vào team.</p>
      <p
        data-testid="invite-code"
        className="mt-3 select-all rounded-md bg-surface-2 py-3 text-center font-display text-2xl font-bold tracking-[0.2em]"
      >
        {code}
      </p>
      <div className="mt-3 flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={copy}>
          <Copy className="size-4" aria-hidden /> Chép mã
        </Button>
        <Button variant="secondary" className="flex-1" onClick={rotate} loading={busy} loadingLabel="Đang đổi…">
          <RefreshCw className="size-4" aria-hidden /> Đổi mã
        </Button>
      </div>
    </section>
  );
}
