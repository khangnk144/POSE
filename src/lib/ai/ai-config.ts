import 'server-only';

export const DEFAULT_AI_MODEL = 'claude-haiku-5-5';
export const DEFAULT_DAILY_LIMIT = 40;

/** Model used by both AI routes. Override with AI_MODEL (e.g. claude-sonnet-5-5 for more detail at ~14x the cost). */
export function getAiModel(): string {
  return process.env.AI_MODEL?.trim() || DEFAULT_AI_MODEL;
}

/** Per-user daily call cap. Invalid or non-positive AI_DAILY_LIMIT_PER_USER falls back to 40. */
export function getDailyLimit(): number {
  const n = Number.parseInt(process.env.AI_DAILY_LIMIT_PER_USER ?? '', 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_DAILY_LIMIT;
}

/**
 * Hard ceiling for one Claude call; the UI also promises an error after 30s. The client does not
 * retry (maxRetries: 0), so one call is the whole budget and stays below the routes' maxDuration (60s).
 */
export const CLAUDE_TIMEOUT_MS = 40_000;
