'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';

type Errors = { email?: string; password?: string; code?: string; name?: string; form?: string };

const NETWORK_ERROR = 'Mạng đang chập chờn. Kiểm tra kết nối rồi thử lại nha.';

/**
 * Sign up + join the team with an invite code. If the visitor is already signed in
 * (e.g. an earlier attempt failed on the code), only name and code are asked.
 */
export function JoinForm({ hasSession, initialCode }: { hasSession: boolean; initialCode: string }) {
  const router = useRouter();
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get('email') ?? '').trim();
    const password = String(form.get('password') ?? '');
    const name = String(form.get('name') ?? '').trim();
    const code = String(form.get('code') ?? '').trim();

    if (!name) return setErrors({ name: 'Nhập tên hiển thị nhé.' });
    if (!code) return setErrors({ code: 'Nhập mã mời của team nhé.' });
    if (!hasSession && password.length < 6) {
      return setErrors({ password: 'Mật khẩu cần ít nhất 6 ký tự.' });
    }

    setErrors({});
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      if (!hasSession) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
          setErrors(
            /registered|already/i.test(error.message)
              ? { email: 'Email này đã có tài khoản. Bạn đăng nhập nhé.' }
              : { form: error.message },
          );
          return;
        }
        if (!data.session) {
          setErrors({ form: 'Mình đã gửi email xác nhận. Bạn xác nhận xong rồi đăng nhập nhé.' });
          return;
        }
      }
      const { error: joinError } = await supabase.rpc('join_team', {
        invite_code: code,
        display_name: name,
      });
      if (joinError) {
        setErrors(
          joinError.message.includes('invalid_invite_code')
            ? { code: 'Mã này chưa đúng, bạn hỏi lại trưởng nhóm nhé.' }
            : joinError.message.includes('already_member')
              ? {}
              : { form: 'Chưa tham gia được. Bạn thử lại nha.' },
        );
        if (!joinError.message.includes('already_member')) return;
      }
      router.replace('/');
      router.refresh();
    } catch {
      setErrors({ form: NETWORK_ERROR });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <h2 className="font-display text-[22px] font-bold">Tham gia team</h2>
      {hasSession ? null : (
        <>
          <Input name="email" type="email" label="Email" autoComplete="email" required error={errors.email} />
          <Input
            name="password"
            type="password"
            label="Mật khẩu"
            autoComplete="new-password"
            required
            hint="Ít nhất 6 ký tự"
            error={errors.password}
          />
        </>
      )}
      <Input name="name" label="Tên hiển thị" autoComplete="nickname" maxLength={40} required error={errors.name} />
      <Input
        name="code"
        label="Mã mời"
        defaultValue={initialCode}
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        className="uppercase tracking-widest"
        required
        error={errors.code}
      />
      {errors.form ? <p role="alert" className="text-sm text-danger">{errors.form}</p> : null}
      <Button type="submit" loading={loading} loadingLabel="Đang tham gia…">
        Vào team
      </Button>
      <p className="text-center text-sm text-text-2">
        Đã có tài khoản?{' '}
        <Link href="/login" className="inline-flex min-h-11 items-center font-semibold text-primary">
          Đăng nhập
        </Link>
      </p>
    </form>
  );
}
