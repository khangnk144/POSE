import { describe, expect, it } from 'vitest';
import { generateInviteCode } from './invite-code';

describe('generateInviteCode', () => {
  it('returns 8 unambiguous uppercase characters', () => {
    for (let i = 0; i < 50; i++) expect(generateInviteCode()).toMatch(/^[A-HJKMNP-Z2-9]{8}$/);
  });

  it('skips bytes that would bias the alphabet and keeps drawing', () => {
    let calls = 0;
    const code = generateInviteCode((bytes) => {
      calls += 1;
      return calls === 1 ? bytes.fill(255) : bytes.fill(0);
    });
    expect(code).toBe('AAAAAAAA');
    expect(calls).toBe(2);
  });
});
