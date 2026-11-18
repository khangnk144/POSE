import { afterEach, describe, expect, it, vi } from 'vitest';
import { requestAutofill } from './autofill-client';

const ID = '0a1b2c3d-1111-4222-8333-444455556666';

function stubFetch() {
  const fetchMock = vi.fn(async () => Response.json({ draft: { title: 'x' } }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}
const lastInit = (fetchMock: ReturnType<typeof stubFetch>) =>
  (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];

afterEach(() => vi.unstubAllGlobals());

describe('requestAutofill caption', () => {
  it('sends the caption in the JSON body when only stored images are used', async () => {
    const fetchMock = stubFetch();
    await expect(requestAutofill([{ imageId: ID }], 'Đặt máy ngang hông')).resolves.toEqual({ title: 'x' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(lastInit(fetchMock).body as string)).toEqual({ imageIds: [ID], caption: 'Đặt máy ngang hông' });
  });

  it('sends the caption as a form field when a fresh file is uploaded', async () => {
    const fetchMock = stubFetch();
    await requestAutofill([{ file: new Blob(['x'], { type: 'image/jpeg' }) }, { imageId: ID }], 'zoom 2x');
    const form = lastInit(fetchMock).body as FormData;
    expect(form.get('caption')).toBe('zoom 2x');
    expect(form.getAll('imageIds')).toEqual([ID]);
    expect(form.getAll('image')).toHaveLength(1);
  });

  it('omits the caption when there is none', async () => {
    const fetchMock = stubFetch();
    await requestAutofill([{ imageId: ID }]);
    expect(JSON.parse(lastInit(fetchMock).body as string)).toEqual({ imageIds: [ID] });
    await requestAutofill([{ file: new Blob(['x']) }]);
    const [, init] = fetchMock.mock.calls[1] as unknown as [string, RequestInit];
    expect((init.body as FormData).has('caption')).toBe(false);
  });
});
