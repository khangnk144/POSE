import https from 'node:https';
import { SsrfError, assertPublicHttpsUrl, guardedLookup } from '@/lib/security/ssrf-guard';

export const MAX_REDIRECTS = 3;
export const TIMEOUT_MS = 10_000;

export type ImportErrorCode =
  | 'invalid_url'
  | 'blocked'
  | 'too_large'
  | 'not_image'
  | 'fetch_failed'
  | 'timeout';

export class ImportError extends Error {
  constructor(
    readonly code: ImportErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ImportError';
  }
}

export type GuardedResponse = {
  status: number;
  headers: Record<string, string | string[] | undefined>;
  body: AsyncIterable<Uint8Array>;
  destroy: () => void;
};

/** One HTTP GET without redirect handling. Swappable in tests. */
export type Transport = (url: URL, signal: AbortSignal) => Promise<GuardedResponse>;

/** Real transport: node:https with a connect-time DNS check (guardedLookup). */
export const httpsTransport: Transport = (url, signal) =>
  new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: 'GET',
        lookup: guardedLookup,
        signal,
        headers: {
          'user-agent': 'Mozilla/5.0 (compatible; PoseXinhImporter/1.0)',
          accept: 'image/*,text/html;q=0.8',
        },
      },
      (res) =>
        resolve({
          status: res.statusCode ?? 0,
          headers: res.headers,
          body: res,
          destroy: () => res.destroy(),
        }),
    );
    req.on('error', reject);
    req.end();
  });

/** Maps low-level errors to ImportError (SSRF refusals keep their meaning). */
export function toImportError(err: unknown, signal?: AbortSignal): ImportError {
  if (err instanceof ImportError) return err;
  if (err instanceof SsrfError) return new ImportError(err.code, err.message);
  if (signal?.aborted) return new ImportError('timeout', 'Tải ảnh quá lâu');
  return new ImportError('fetch_failed', 'Không tải được từ link này');
}

/**
 * GET `rawUrl`, following at most MAX_REDIRECTS redirects. Every hop is re-validated
 * (https only, public IP literals); hostnames are checked again by the transport's DNS lookup.
 */
export async function fetchFollowingRedirects(
  rawUrl: string,
  signal: AbortSignal,
  transport: Transport = httpsTransport,
): Promise<{ res: GuardedResponse; finalUrl: URL }> {
  let url: URL;
  try {
    url = assertPublicHttpsUrl(rawUrl);
  } catch (err) {
    throw toImportError(err);
  }
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    let res: GuardedResponse;
    try {
      res = await transport(url, signal);
    } catch (err) {
      throw toImportError(err, signal);
    }
    const location = res.headers.location;
    if (res.status >= 300 && res.status < 400 && typeof location === 'string') {
      res.destroy();
      if (hop === MAX_REDIRECTS) throw new ImportError('fetch_failed', 'Link chuyển hướng quá nhiều lần');
      try {
        url = assertPublicHttpsUrl(new URL(location, url).toString());
      } catch (err) {
        throw toImportError(err);
      }
      continue;
    }
    return { res, finalUrl: url };
  }
  throw new ImportError('fetch_failed', 'Link chuyển hướng quá nhiều lần');
}

/**
 * Reads the body into memory. Past `maxBytes` it either throws `too_large` or, with
 * `truncate`, stops and returns what it has. Enforced while streaming, so a lying or
 * missing Content-Length cannot bypass it.
 */
export async function readLimited(
  res: GuardedResponse,
  maxBytes: number,
  opts: { truncate?: boolean; signal?: AbortSignal } = {},
): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for await (const chunk of res.body) {
      total += chunk.byteLength;
      if (total > maxBytes) {
        res.destroy();
        if (!opts.truncate) throw new ImportError('too_large', 'Ảnh lớn hơn 10 MB');
        chunks.push(chunk.subarray(0, chunk.byteLength - (total - maxBytes)));
        total = maxBytes;
        break;
      }
      chunks.push(chunk);
    }
  } catch (err) {
    res.destroy();
    throw toImportError(err, opts.signal);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}
