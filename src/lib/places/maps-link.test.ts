import { describe, expect, it } from 'vitest';
import { buildMapsUrl, isHttpUrl } from './maps-link';

describe('isHttpUrl', () => {
  it('accepts http and https only', () => {
    expect(isHttpUrl('https://maps.app.goo.gl/abc')).toBe(true);
    expect(isHttpUrl('http://example.com')).toBe(true);
    expect(isHttpUrl('javascript:alert(1)')).toBe(false);
    expect(isHttpUrl('not a url')).toBe(false);
    expect(isHttpUrl('')).toBe(false);
    expect(isHttpUrl(null)).toBe(false);
  });
});

describe('buildMapsUrl', () => {
  it('prefers the saved maps link', () => {
    expect(buildMapsUrl({ name: 'Cafe', address: 'x', mapsUrl: ' https://maps.app.goo.gl/abc ' })).toBe(
      'https://maps.app.goo.gl/abc',
    );
  });

  it('falls back to a search URL with name and address, URL-encoded', () => {
    expect(buildMapsUrl({ name: 'Cà phê Đồi', address: '12 Lê Lợi, Đà Lạt' })).toBe(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Cà phê Đồi, 12 Lê Lợi, Đà Lạt')}`,
    );
  });

  it('uses only the name when there is no address', () => {
    expect(buildMapsUrl({ name: 'Hồ Gươm', address: '  ' })).toBe(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Hồ Gươm')}`,
    );
  });

  it('ignores an unsafe saved link', () => {
    const url = buildMapsUrl({ name: 'A', mapsUrl: 'javascript:alert(1)' });
    expect(url.startsWith('https://www.google.com/maps/search/')).toBe(true);
  });
});
