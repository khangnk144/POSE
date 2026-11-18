import { checkCronAuth } from '@/lib/security/cron-auth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin-client';

/**
 * Daily keep-alive (Vercel Cron): one cheap query so the free Supabase project is not paused for
 * inactivity. Needs `Authorization: Bearer <CRON_SECRET>`; nothing touches the DB without it.
 */
export async function GET(request: Request): Promise<Response> {
  const auth = checkCronAuth(request.headers.get('authorization'), process.env.CRON_SECRET);
  if (auth === 'not_configured') return Response.json({ ok: false, error: 'cron_not_configured' }, { status: 503 });
  if (auth === 'unauthorized') return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  try {
    const { error } = await createSupabaseAdminClient().from('team_settings').select('id', { head: true }).limit(1);
    if (error) throw new Error(error.message);
    return Response.json({ ok: true });
  } catch (e) {
    console.error('[health] database check failed', e);
    return Response.json({ ok: false, error: 'database_unavailable' }, { status: 503 });
  }
}
