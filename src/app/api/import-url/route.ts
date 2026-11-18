import { z } from 'zod';
import { getCurrentProfile } from '@/lib/supabase/session';
import { ImportError, type ImportErrorCode } from './guarded-fetch';
import { importImage } from './import-image';

export const runtime = 'nodejs';

const bodySchema = z.object({ url: z.string().trim().min(1).max(2048) });

const STATUS: Record<ImportErrorCode, number> = {
  invalid_url: 400,
  blocked: 400,
  not_image: 422,
  too_large: 413,
  fetch_failed: 502,
  timeout: 504,
};

function json(body: Record<string, string>, status: number) {
  return Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
}

/** POST { url } -> image bytes. Signed-in team members only; the fetch goes through the SSRF guard. */
export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return json({ error: 'unauthorized' }, 401);

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: 'invalid_url', message: 'Thiếu link ảnh' }, 400);

  try {
    const { bytes, contentType } = await importImage(parsed.data.url);
    return new Response(Buffer.from(bytes), {
      headers: { 'content-type': contentType, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' },
    });
  } catch (err) {
    if (err instanceof ImportError) return json({ error: err.code, message: err.message }, STATUS[err.code]);
    return json({ error: 'fetch_failed', message: 'Không tải được từ link này' }, 502);
  }
}
