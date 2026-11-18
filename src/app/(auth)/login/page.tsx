import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/auth/login-form';
import { getCurrentProfile } from '@/lib/supabase/session';

export const metadata: Metadata = { title: 'Đăng nhập' };

export default async function LoginPage() {
  if (await getCurrentProfile()) redirect('/');
  return <LoginForm />;
}
