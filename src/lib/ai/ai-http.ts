/** Client-side helpers shared by the AI request functions. Safe to import in the browser. */

export type AiErrorCode =
  | 'ai_quota'
  | 'ai_disabled'
  | 'ai_timeout'
  | 'ai_busy'
  | 'ai_failed'
  | 'scene_unclear'
  | 'invalid_image'
  | 'unauthorized'
  | 'network'
  | 'aborted';

/** `message` equals `code` so callers can switch on either. */
export class AiClientError extends Error {
  constructor(
    readonly code: AiErrorCode,
    /** Optional human text from the model (scene_unclear). */
    readonly detail?: string,
  ) {
    super(code);
    this.name = 'AiClientError';
  }
}

const SERVER_CODES: Record<string, AiErrorCode> = {
  ai_not_configured: 'ai_disabled',
  ai_quota: 'ai_quota',
  ai_timeout: 'ai_timeout',
  ai_busy: 'ai_busy',
  scene_unclear: 'scene_unclear',
  invalid_images: 'invalid_image',
  invalid_image: 'invalid_image',
  unauthorized: 'unauthorized',
};

/** POST to an AI route and return the parsed JSON, or throw an AiClientError. */
export async function postAi<T>(url: string, init: { body: BodyInit; headers?: HeadersInit; signal?: AbortSignal }): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { method: 'POST', ...init });
  } catch (e) {
    if (init.signal?.aborted || (e instanceof DOMException && e.name === 'AbortError')) throw new AiClientError('aborted');
    throw new AiClientError('network');
  }
  if (res.ok) {
    try {
      return (await res.json()) as T;
    } catch {
      throw new AiClientError('ai_failed');
    }
  }
  const body = (await res.json().catch(() => null)) as { error?: string; message?: string } | null;
  throw new AiClientError(SERVER_CODES[body?.error ?? ''] ?? 'ai_failed', body?.message);
}
