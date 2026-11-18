import { describe, expect, it, vi } from 'vitest';
import { ImportError, type GuardedResponse, type Transport } from './guarded-fetch';
import { MAX_HTML_BYTES, MAX_IMAGE_BYTES, importImage } from './import-image';
import { extractOgImage } from './og-image';

type Fake = { status?: number; headers?: Record<string, string>; chunks?: Uint8Array[] };

/** Transport serving canned responses by URL, recording every URL it was asked for. */
function fakeTransport(routes: Record<string, Fake>) {
  const requested: string[] = [];
  const transport: Transport = async (url) => {
    requested.push(url.toString());
    const r = routes[url.toString()];
    if (!r) throw new Error(`unexpected request to ${url}`);
    const res: GuardedResponse = {
      status: r.status ?? 200,
      headers: r.headers ?? {},
      body: (async function* () {
        for (const c of r.chunks ?? []) yield c;
      })(),
      destroy: vi.fn(),
    };
    return res;
  };
  return { transport, requested };
}

const bytes = (n: number, fill = 1) => new Uint8Array(n).fill(fill);
const img = (extra: Record<string, string> = {}) => ({
  headers: { 'content-type': 'image/jpeg', ...extra },
  chunks: [bytes(100)],
});
const redirect = (to: string): Fake => ({ status: 302, headers: { location: to } });
const html = (body: string): Fake => ({
  headers: { 'content-type': 'text/html; charset=utf-8' },
  chunks: [new TextEncoder().encode(body)],
});

async function codeOf(p: Promise<unknown>): Promise<string> {
  try {
    await p;
  } catch (e) {
    return e instanceof ImportError ? e.code : `other:${String(e)}`;
  }
  return 'no-error';
}

describe('importImage', () => {
  it('downloads a public https image', async () => {
    const { transport } = fakeTransport({ 'https://cdn.example.com/a.jpg': img() });
    const out = await importImage('https://cdn.example.com/a.jpg', transport);
    expect(out.contentType).toBe('image/jpeg');
    expect(out.bytes.byteLength).toBe(100);
  });

  it.each([
    'http://cdn.example.com/a.jpg',
    'https://127.0.0.1/a.jpg',
    'https://10.0.0.1/a.jpg',
    'https://169.254.169.254/latest/meta-data/',
    'https://[::1]/a.jpg',
  ])('blocks %s before any request is made', async (url) => {
    const { transport, requested } = fakeTransport({});
    expect(await codeOf(importImage(url, transport))).toMatch(/^(blocked|invalid_url)$/);
    expect(requested).toEqual([]);
  });

  it('blocks a redirect to a private IP literal', async () => {
    const { transport, requested } = fakeTransport({
      'https://cdn.example.com/a.jpg': redirect('https://169.254.169.254/latest/meta-data/'),
    });
    expect(await codeOf(importImage('https://cdn.example.com/a.jpg', transport))).toBe('blocked');
    expect(requested).toEqual(['https://cdn.example.com/a.jpg']);
  });

  it('blocks a redirect downgrading to http', async () => {
    const { transport } = fakeTransport({ 'https://cdn.example.com/a.jpg': redirect('http://cdn.example.com/b.jpg') });
    expect(await codeOf(importImage('https://cdn.example.com/a.jpg', transport))).toBe('blocked');
  });

  it('follows up to 3 redirects and rejects the 4th', async () => {
    const ok = fakeTransport({
      'https://a.example.com/1': redirect('/2'),
      'https://a.example.com/2': redirect('/3'),
      'https://a.example.com/3': redirect('/4'),
      'https://a.example.com/4': img(),
    });
    await expect(importImage('https://a.example.com/1', ok.transport)).resolves.toBeDefined();

    const tooMany = fakeTransport({
      'https://a.example.com/1': redirect('/2'),
      'https://a.example.com/2': redirect('/3'),
      'https://a.example.com/3': redirect('/4'),
      'https://a.example.com/4': redirect('/5'),
      'https://a.example.com/5': img(),
    });
    expect(await codeOf(importImage('https://a.example.com/1', tooMany.transport))).toBe('fetch_failed');
  });

  it('rejects non-image content types, including svg', async () => {
    for (const type of ['application/json', 'image/svg+xml', 'application/octet-stream']) {
      const { transport } = fakeTransport({ 'https://x.example.com/a': { headers: { 'content-type': type }, chunks: [bytes(5)] } });
      expect(await codeOf(importImage('https://x.example.com/a', transport))).toBe('not_image');
    }
  });

  it('rejects by Content-Length over 10 MB without reading the body', async () => {
    const { transport } = fakeTransport({
      'https://x.example.com/a.jpg': img({ 'content-length': String(MAX_IMAGE_BYTES + 1) }),
    });
    expect(await codeOf(importImage('https://x.example.com/a.jpg', transport))).toBe('too_large');
  });

  it('enforces the 10 MB cap while streaming when Content-Length is missing or lies', async () => {
    const chunk = bytes(1024 * 1024);
    const { transport } = fakeTransport({
      'https://x.example.com/a.jpg': {
        headers: { 'content-type': 'image/png', 'content-length': '10' },
        chunks: Array.from({ length: 11 }, () => chunk),
      },
    });
    expect(await codeOf(importImage('https://x.example.com/a.jpg', transport))).toBe('too_large');
  });

  it('accepts exactly 10 MB', async () => {
    const { transport } = fakeTransport({
      'https://x.example.com/a.jpg': { headers: { 'content-type': 'image/webp' }, chunks: [bytes(MAX_IMAGE_BYTES)] },
    });
    const out = await importImage('https://x.example.com/a.jpg', transport);
    expect(out.bytes.byteLength).toBe(MAX_IMAGE_BYTES);
  });

  it('takes og:image from an HTML page and fetches it through the same guard', async () => {
    const { transport, requested } = fakeTransport({
      'https://pin.example.com/pin/1': html('<head><meta property="og:image" content="https://cdn.example.com/p.jpg"></head>'),
      'https://cdn.example.com/p.jpg': img(),
    });
    const out = await importImage('https://pin.example.com/pin/1', transport);
    expect(out.contentType).toBe('image/jpeg');
    expect(requested).toEqual(['https://pin.example.com/pin/1', 'https://cdn.example.com/p.jpg']);
  });

  it('blocks an og:image that points at a private address', async () => {
    const { transport, requested } = fakeTransport({
      'https://pin.example.com/pin/1': html('<meta property="og:image" content="https://192.168.0.1/x.jpg">'),
    });
    expect(await codeOf(importImage('https://pin.example.com/pin/1', transport))).toBe('blocked');
    expect(requested).toEqual(['https://pin.example.com/pin/1']);
  });

  it('does not follow an og:image that is itself an HTML page', async () => {
    const { transport } = fakeTransport({
      'https://pin.example.com/1': html('<meta property="og:image" content="https://pin.example.com/2">'),
      'https://pin.example.com/2': html('<meta property="og:image" content="https://pin.example.com/3">'),
    });
    expect(await codeOf(importImage('https://pin.example.com/1', transport))).toBe('not_image');
  });

  it('reports a page without og:image as not_image', async () => {
    const { transport } = fakeTransport({ 'https://pin.example.com/1': html('<html><title>x</title></html>') });
    expect(await codeOf(importImage('https://pin.example.com/1', transport))).toBe('not_image');
  });

  it('reads at most 1 MB of HTML (og:image after the cap is ignored)', async () => {
    const filler = new TextEncoder().encode(' '.repeat(MAX_HTML_BYTES));
    const late = new TextEncoder().encode('<meta property="og:image" content="https://cdn.example.com/p.jpg">');
    const { transport } = fakeTransport({
      'https://pin.example.com/1': { headers: { 'content-type': 'text/html' }, chunks: [filler, late] },
    });
    expect(await codeOf(importImage('https://pin.example.com/1', transport))).toBe('not_image');
  });

  it('maps a non-200 answer to fetch_failed', async () => {
    const { transport } = fakeTransport({ 'https://x.example.com/a.jpg': { status: 404, headers: { 'content-type': 'image/jpeg' } } });
    expect(await codeOf(importImage('https://x.example.com/a.jpg', transport))).toBe('fetch_failed');
  });

  it('times out when the transport never answers', async () => {
    const transport: Transport = (_url, signal) =>
      new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('aborted'))));
    expect(await codeOf(importImage('https://slow.example.com/a.jpg', transport, 20))).toBe('timeout');
  });
});

describe('extractOgImage', () => {
  const base = new URL('https://site.example.com/a/b');
  it('handles attribute order, quotes, entities and relative URLs', () => {
    expect(extractOgImage('<meta content="/img/x.jpg?a=1&amp;b=2" property="og:image">', base)).toBe(
      'https://site.example.com/img/x.jpg?a=1&b=2',
    );
    expect(extractOgImage("<meta name='twitter:image' content='https://c.example.com/t.png'>", base)).toBe(
      'https://c.example.com/t.png',
    );
  });
  it('prefers og:image over twitter:image and returns null when absent', () => {
    expect(
      extractOgImage(
        '<meta name="twitter:image" content="https://c.example.com/t.png"><meta property="og:image" content="https://c.example.com/o.png">',
        base,
      ),
    ).toBe('https://c.example.com/o.png');
    expect(extractOgImage('<meta name="description" content="hi">', base)).toBeNull();
  });
});
