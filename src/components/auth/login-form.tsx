'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError(undefined);
    setLoading(true);
    try {
      const { error: authError } = await createSupabaseBrowserClient().auth.signInWithPassword({
        email: String(form.get('email') ?? '').trim(),
        password: String(form.get('password') ?? ''),
      });
      if (authError) {
        setError(
          authError.status && authError.status >= 500
            ? 'Mạng đang chập chờn. Kiểm tra kết nối rồi thử lại nha.'
            : 'Email hoặc mật khẩu chưa đúng.',
        );
        return;
      }
      router.replace('/');
      router.refresh();
    } catch {
      setError('Mạng đang chập chờn. Kiểm tra kết nối rồi thử lại nha.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate={false}>
      <h2 className="font-display text-[22px] font-bold">Đăng nhập</h2>
      <Input name="email" type="email" label="Email" autoComplete="email" required />
      <Input
        name="password"
        type="password"
        label="Mật khẩu"
        autoComplete="current-password"
        required
        error={error}
      />
      <Button type="submit" loading={loading} loadingLabel="Đang vào…">
        Đăng nhập
      </Button>
      <p className="text-center text-sm text-text-2">
        Chưa có tài khoản?{' '}
        <Link href="/join" className="inline-flex min-h-11 items-center font-semibold text-primary">
          Tham gia team
        </Link>
      </p>
    </form>
  );
}
