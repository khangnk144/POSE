import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { MAX_CAPTION_CHARS, readAutofillInput } from './autofill-input';

const ID = '0a1b2c3d-1111-4222-8333-444455556666';
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 1, 2, 3]);

const json = (body: unknown) =>
  new Request('http://localhost/api/ai/autofill', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
const multipart = (form: FormData) => new Request('http://localhost/api/ai/autofill', { method: 'POST', body: form });

describe('readAutofillInput caption', () => {
  it('reads and trims the caption from JSON', async () => {
    const input = await readAutofillInput(json({ imageIds: [ID], caption: '  zoom 2x  ' }));
    expect(input?.caption).toBe('zoom 2x');
  });

  it('treats a blank or missing caption as none', async () => {
    expect((await readAutofillInput(json({ imageIds: [ID], caption: '   ' })))?.caption).toBeUndefined();
    expect((await readAutofillInput(json({ imageIds: [ID] })))?.caption).toBeUndefined();
  });

  it('accepts exactly the cap and rejects one character more', async () => {
    const ok = await readAutofillInput(json({ imageIds: [ID], caption: 'a'.repeat(MAX_CAPTION_CHARS) }));
    expect(ok?.caption).toHaveLength(MAX_CAPTION_CHARS);
    expect(await readAutofillInput(json({ imageIds: [ID], caption: 'a'.repeat(MAX_CAPTION_CHARS + 1) }))).toBeNull();
  });

  it('rejects a caption that is not a string', async () => {
    expect(await readAutofillInput(json({ imageIds: [ID], caption: { text: 'x' } }))).toBeNull();
    expect(await readAutofillInput(json({ imageIds: [ID], caption: 5 }))).toBeNull();
  });

  it('reads the caption from multipart together with image files', async () => {
    const form = new FormData();
    form.append('caption', 'nghiêng vai');
    form.append('image', new Blob([JPEG], { type: 'image/jpeg' }), 'a.jpg');
    const input = await readAutofillInput(multipart(form));
    expect(input?.caption).toBe('nghiêng vai');
    expect(input?.files).toHaveLength(1);
  });

  it('rejects an over-long caption in multipart and a file posted as caption', async () => {
    const long = new FormData();
    long.append('caption', 'a'.repeat(MAX_CAPTION_CHARS + 1));
    long.append('image', new Blob([JPEG]), 'a.jpg');
    expect(await readAutofillInput(multipart(long))).toBeNull();

    const file = new FormData();
    file.append('caption', new Blob(['x']), 'c.txt');
    file.append('image', new Blob([JPEG]), 'a.jpg');
    expect(await readAutofillInput(multipart(file))).toBeNull();
  });
});
