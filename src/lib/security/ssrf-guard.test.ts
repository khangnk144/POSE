import { describe, expect, it } from 'vitest';
import {
  SsrfError,
  assertPublicHttpsUrl,
  guardedLookup,
  isBlockedIp,
  resolvePublicAddresses,
} from './ssrf-guard';

describe('isBlockedIp', () => {
  it.each([
    ['0.0.0.0'],
    ['10.0.0.1'],
    ['10.255.255.255'],
    ['100.64.0.1'],
    ['127.0.0.1'],
    ['127.1.2.3'],
    ['169.254.169.254'],
    ['172.16.0.1'],
    ['172.31.255.255'],
    ['192.168.1.1'],
    ['192.0.0.1'],
    ['198.18.0.1'],
    ['224.0.0.1'],
    ['255.255.255.255'],
    ['::'],
    ['::1'],
    ['[::1]'],
    ['fc00::1'],
    ['fd12:3456::1'],
    ['fe80::1'],
    ['fe80::1%eth0'],
    ['ff02::1'],
    ['::ffff:127.0.0.1'],
    ['::ffff:7f00:1'],
    ['::ffff:10.0.0.1'],
    ['::ffff:169.254.169.254'],
    ['64:ff9b::7f00:1'],
    ['2002:7f00:1::1'],
    ['2001:db8::1'],
    ['fd00:ec2::254'],
    ['not-an-ip'],
    ['999.1.1.1'],
  ])('blocks %s', (ip) => {
    expect(isBlockedIp(ip)).toBe(true);
  });

  it.each([
    ['8.8.8.8'],
    ['1.1.1.1'],
    ['172.15.0.1'],
    ['172.32.0.1'],
    ['100.63.0.1'],
    ['93.184.216.34'],
    ['2606:4700:4700::1111'],
    ['2001:4860:4860::8888'],
    ['::ffff:8.8.8.8'],
  ])('allows public %s', (ip) => {
    expect(isBlockedIp(ip)).toBe(false);
  });
});

describe('assertPublicHttpsUrl', () => {
  it.each([
    ['http://example.com/a.jpg', 'plain http'],
    ['https://127.0.0.1/a.jpg', 'loopback'],
    ['https://10.1.2.3/a.jpg', 'private 10.x'],
    ['https://169.254.169.254/latest/meta-data', 'cloud metadata'],
    ['https://[::1]/a.jpg', 'IPv6 loopback'],
    ['https://[::ffff:127.0.0.1]/a.jpg', 'IPv4-mapped loopback'],
    ['https://2130706433/a.jpg', 'decimal loopback'],
    ['https://0x7f.1/a.jpg', 'hex loopback'],
    ['https://localhost/a.jpg', 'localhost'],
    ['https://app.localhost/a.jpg', 'localhost subdomain'],
    ['https://user:pw@example.com/a.jpg', 'credentials'],
    ['https://example.com:8443/a.jpg', 'non-443 port'],
    ['ftp://example.com/a.jpg', 'ftp'],
    ['file:///etc/passwd', 'file'],
    ['javascript:alert(1)', 'javascript'],
  ])('rejects %s (%s)', (url) => {
    expect(() => assertPublicHttpsUrl(url)).toThrow(SsrfError);
  });

  it('rejects garbage as invalid_url', () => {
    try {
      assertPublicHttpsUrl('not a url');
      expect.unreachable();
    } catch (e) {
      expect((e as SsrfError).code).toBe('invalid_url');
    }
  });

  it('accepts a public https image URL', () => {
    expect(assertPublicHttpsUrl('https://images.example.com/a.jpg?x=1').hostname).toBe('images.example.com');
    expect(assertPublicHttpsUrl('https://8.8.8.8/a.jpg').hostname).toBe('8.8.8.8');
  });
});

describe('resolvePublicAddresses / guardedLookup', () => {
  const resolveTo = (...addresses: string[]) => async () =>
    addresses.map((address) => ({ address, family: address.includes(':') ? 6 : 4 }));

  it('blocks a domain that resolves to a private IP', async () => {
    await expect(resolvePublicAddresses('evil.example', resolveTo('10.0.0.5'))).rejects.toThrow(SsrfError);
  });

  it('blocks when any resolved address is private (mixed answer)', async () => {
    await expect(resolvePublicAddresses('evil.example', resolveTo('8.8.8.8', '127.0.0.1'))).rejects.toThrow(
      SsrfError,
    );
  });

  it('blocks a domain that resolves to nothing', async () => {
    await expect(resolvePublicAddresses('empty.example', resolveTo())).rejects.toThrow(SsrfError);
  });

  it('allows a domain that resolves to public IPs only', async () => {
    await expect(resolvePublicAddresses('ok.example', resolveTo('93.184.216.34'))).resolves.toHaveLength(1);
  });

  it('guardedLookup refuses a hostname that resolves to loopback (localhost via DNS)', async () => {
    const err = await new Promise<unknown>((resolve) => {
      guardedLookup('localhost', { all: true }, (e) => resolve(e));
    });
    expect(err).toBeInstanceOf(SsrfError);
  });
});
