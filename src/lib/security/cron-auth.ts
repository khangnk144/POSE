import { createHash, timingSafeEqual } from 'node:crypto';

export type CronAuthResult = 'ok' | 'unauthorized' | 'not_configured';

const digest = (value: string) => createHash('sha256').update(value).digest();

/**
 * Checks `Authorization: Bearer <CRON_SECRET>` (the header Vercel Cron sends). Both sides are
 * hashed first so the constant-time compare works for any length without leaking it.
 */
export function checkCronAuth(authorization: string | null, secret: string | undefined): CronAuthResult {
  if (!secret) return 'not_configured';
  if (!authorization) return 'unauthorized';
  return timingSafeEqual(digest(authorization), digest(`Bearer ${secret}`)) ? 'ok' : 'unauthorized';
}
