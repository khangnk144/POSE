// No 0/O/1/I/L so a code read aloud or typed from a screenshot is hard to get wrong.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const LENGTH = 8;

/** Random invite code (8 chars) using the Web Crypto RNG; rejection sampling avoids modulo bias. */
export function generateInviteCode(random: (bytes: Uint8Array) => Uint8Array = (b) => crypto.getRandomValues(b)): string {
  const limit = 256 - (256 % ALPHABET.length);
  let out = '';
  while (out.length < LENGTH) {
    for (const byte of random(new Uint8Array(LENGTH * 2))) {
      if (byte < limit && out.length < LENGTH) out += ALPHABET[byte % ALPHABET.length];
    }
  }
  return out;
}
