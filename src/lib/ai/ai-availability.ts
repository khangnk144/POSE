import 'server-only';

/**
 * True when an Anthropic API key is configured. Server-only: call it from a server
 * component or route handler and pass the boolean down (e.g. as `aiEnabled`).
 * Never expose the key itself.
 */
export function isAiConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}
