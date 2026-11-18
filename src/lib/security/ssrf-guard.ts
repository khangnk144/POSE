import dns from 'node:dns';
import net from 'node:net';

/**
 * SSRF guard for server-side fetches of user supplied URLs.
 * - `assertPublicHttpsUrl`: syntax check (https only, no credentials, port 443) and, for IP
 *   literals, a range check.
 * - `guardedLookup`: DNS lookup for node:https `lookup` option. It runs at connect time, so
 *   the address that is checked is the address that is connected to (no DNS-rebinding gap).
 * Anything unparseable is treated as blocked (fail closed).
 */

export class SsrfError extends Error {
  constructor(
    readonly code: 'invalid_url' | 'blocked',
    message: string,
  ) {
    super(message);
    this.name = 'SsrfError';
  }
}

function parseIpv4(ip: string): number[] | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  const nums = parts.map((p) => (/^\d{1,3}$/.test(p) ? Number(p) : NaN));
  return nums.every((n) => n >= 0 && n <= 255) ? nums : null;
}

function isBlockedIpv4([a, b, c]: number[]): boolean {
  return (
    a === 0 || // "this" network
    a === 10 ||
    (a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT
    a === 127 ||
    (a === 169 && b === 254) || // link-local, cloud metadata
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && (c === 0 || c === 2)) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224 // multicast, reserved, broadcast
  );
}

/** Parses an IPv6 literal to 8 16-bit groups, or null when malformed. */
function parseIpv6(input: string): number[] | null {
  const ip = input.split('%')[0]; // drop zone id
  let tail: number[] = [];
  let head = ip;
  const lastColon = ip.lastIndexOf(':');
  if (ip.includes('.')) {
    const v4 = parseIpv4(ip.slice(lastColon + 1));
    if (!v4) return null;
    tail = [(v4[0] << 8) | v4[1], (v4[2] << 8) | v4[3]];
    head = ip.slice(0, lastColon + 1) + '0:0'; // placeholder keeps group counting simple
  }
  const halves = head.split('::');
  if (halves.length > 2) return null;
  const toGroups = (s: string) => (s === '' ? [] : s.split(':'));
  const left = toGroups(halves[0]);
  const right = halves.length === 2 ? toGroups(halves[1]) : [];
  const missing = 8 - left.length - right.length;
  if (halves.length === 2 ? missing < 1 : missing !== 0) return null;
  const all = [...left, ...Array<string>(halves.length === 2 ? missing : 0).fill('0'), ...right];
  if (all.length !== 8) return null;
  const groups = all.map((g) => (/^[0-9a-f]{1,4}$/i.test(g) ? parseInt(g, 16) : NaN));
  if (groups.some(Number.isNaN)) return null;
  if (tail.length) [groups[6], groups[7]] = tail;
  return groups;
}

function v4FromGroups(hi: number, lo: number): number[] {
  return [hi >> 8, hi & 255, lo >> 8, lo & 255];
}

function isBlockedIpv6(g: number[]): boolean {
  const allZeroUpTo = (n: number) => g.slice(0, n).every((x) => x === 0);
  if (allZeroUpTo(7) && g[7] <= 1) return true; // :: and ::1
  if (allZeroUpTo(5) && g[5] === 0xffff) return isBlockedIpv4(v4FromGroups(g[6], g[7])); // ::ffff:a.b.c.d
  if (allZeroUpTo(6)) return true; // deprecated IPv4-compatible ::a.b.c.d
  if (g[0] === 0x64 && g[1] === 0xff9b && g.slice(2, 6).every((x) => x === 0)) {
    return isBlockedIpv4(v4FromGroups(g[6], g[7])); // NAT64
  }
  if (g[0] === 0x2002) return isBlockedIpv4(v4FromGroups(g[1], g[2])); // 6to4
  return (
    (g[0] & 0xfe00) === 0xfc00 || // unique local fc00::/7
    (g[0] & 0xffc0) === 0xfe80 || // link-local
    (g[0] & 0xffc0) === 0xfec0 || // deprecated site-local
    (g[0] & 0xff00) === 0xff00 || // multicast
    (g[0] === 0x2001 && g[1] === 0) || // Teredo
    (g[0] === 0x2001 && g[1] === 0xdb8) || // documentation
    (g[0] === 0x100 && g.slice(1, 4).every((x) => x === 0)) // discard-only
  );
}

/** True when `ip` is private, loopback, link-local, metadata, multicast, reserved or malformed. */
export function isBlockedIp(ip: string): boolean {
  const host = ip.startsWith('[') && ip.endsWith(']') ? ip.slice(1, -1) : ip;
  const family = net.isIP(host);
  if (family === 4) {
    const v4 = parseIpv4(host);
    return !v4 || isBlockedIpv4(v4);
  }
  if (family === 6) {
    const v6 = parseIpv6(host);
    return !v6 || isBlockedIpv6(v6);
  }
  return true;
}

/**
 * Validates a user supplied URL and returns it parsed. Throws SsrfError.
 * Only https on port 443 without credentials; IP literals must be public.
 */
export function assertPublicHttpsUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new SsrfError('invalid_url', 'URL không hợp lệ');
  }
  if (url.protocol !== 'https:') throw new SsrfError('blocked', 'Chỉ nhận link https');
  if (url.username || url.password) throw new SsrfError('blocked', 'URL có thông tin đăng nhập');
  if (url.port && url.port !== '443') throw new SsrfError('blocked', 'Cổng không được phép');
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (!host || host.endsWith('.localhost') || host === 'localhost') {
    throw new SsrfError('blocked', 'Địa chỉ không được phép');
  }
  if (net.isIP(host) && isBlockedIp(host)) throw new SsrfError('blocked', 'Địa chỉ nội bộ bị chặn');
  return url;
}

type ResolveFn = (hostname: string) => Promise<{ address: string; family: number }[]>;

const defaultResolve: ResolveFn = (hostname) => dns.promises.lookup(hostname, { all: true, verbatim: true });

/** Resolves `hostname` and throws SsrfError unless every returned address is public. */
export async function resolvePublicAddresses(
  hostname: string,
  resolve: ResolveFn = defaultResolve,
): Promise<{ address: string; family: number }[]> {
  const addresses = await resolve(hostname);
  if (addresses.length === 0) throw new SsrfError('blocked', 'Không phân giải được tên miền');
  if (addresses.some((a) => isBlockedIp(a.address))) {
    throw new SsrfError('blocked', 'Tên miền trỏ về địa chỉ nội bộ');
  }
  return addresses;
}

/** Drop-in for the `lookup` option of https.request that refuses non-public addresses. */
export function guardedLookup(
  hostname: string,
  options: dns.LookupOptions,
  callback: (err: NodeJS.ErrnoException | null, address: string | dns.LookupAddress[], family?: number) => void,
): void {
  resolvePublicAddresses(hostname)
    .then((addresses) => {
      if (options.all) callback(null, addresses);
      else callback(null, addresses[0].address, addresses[0].family);
    })
    .catch((err: unknown) => callback(err as NodeJS.ErrnoException, '', 0));
}
