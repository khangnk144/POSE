import { describe, expect, it } from 'vitest';
import { checkCronAuth } from './cron-auth';

describe('checkCronAuth', () => {
  it('accepts the exact bearer secret', () => {
    expect(checkCronAuth('Bearer s3cret-value', 's3cret-value')).toBe('ok');
  });
  it('rejects a missing, wrong, differently cased or unprefixed header', () => {
    expect(checkCronAuth(null, 's3cret-value')).toBe('unauthorized');
    expect(checkCronAuth('Bearer nope', 's3cret-value')).toBe('unauthorized');
    expect(checkCronAuth('bearer s3cret-value', 's3cret-value')).toBe('unauthorized');
    expect(checkCronAuth('s3cret-value', 's3cret-value')).toBe('unauthorized');
    expect(checkCronAuth('Bearer s3cret-value-longer', 's3cret-value')).toBe('unauthorized');
  });
  it('reports not_configured when the secret is unset or empty, even for "Bearer "', () => {
    expect(checkCronAuth('Bearer ', undefined)).toBe('not_configured');
    expect(checkCronAuth('Bearer ', '')).toBe('not_configured');
  });
});
