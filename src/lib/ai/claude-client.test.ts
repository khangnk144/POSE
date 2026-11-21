import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import Anthropic from '@anthropic-ai/sdk';
import { AiCallError, mapSdkError, readJsonAnswer } from './claude-client';

describe('readJsonAnswer', () => {
  const msg = (text: string, stopReason = 'end_turn') =>
    ({ stop_reason: stopReason, content: [{ type: 'text', text }] }) as Parameters<typeof readJsonAnswer>[0];
  const fence = '`'.repeat(3);

  it('parses a bare JSON object', () => {
    expect(readJsonAnswer(msg('{"title":"x"}'))).toEqual({ title: 'x' });
  });

  it('parses JSON wrapped in a markdown fence or stray words', () => {
    expect(readJsonAnswer(msg(`Đây nhé:\n${fence}json\n{"title":"Ngồi sofa"}\n${fence}`))).toEqual({ title: 'Ngồi sofa' });
  });

  it('reads only text blocks (ignores thinking blocks)', () => {
    const m = { stop_reason: 'end_turn', content: [{ type: 'thinking' }, { type: 'text', text: '{"a":1}' }] } as Parameters<
      typeof readJsonAnswer
    >[0];
    expect(readJsonAnswer(m)).toEqual({ a: 1 });
  });

  it('throws bad_output for missing or broken JSON', () => {
    expect(() => readJsonAnswer(msg('không có json'))).toThrow(AiCallError);
    expect(() => readJsonAnswer(msg('{"title": '))).toThrow(AiCallError);
  });

  it('throws bad_output when cut off at max_tokens or refused', () => {
    expect(() => readJsonAnswer(msg('{"title":"x"}', 'max_tokens'))).toThrow(/max_tokens/);
    expect(() => readJsonAnswer(msg('', 'refusal'))).toThrow(/refused/);
  });
});

describe('mapSdkError', () => {
  it("keeps Anthropic's explanation for a 400 so the server log says why", () => {
    const body = { type: 'error', error: { type: 'invalid_request_error', message: 'Your credit balance is too low' } };
    const err = mapSdkError(Anthropic.APIError.generate(400, body, undefined, new Headers()));
    expect(err.kind).toBe('upstream');
    expect(err.message).toContain('claude api status 400');
    expect(err.message).toContain('invalid_request_error');
    expect(err.message).toContain('Your credit balance is too low');
  });

  it('treats overload as busy', () => {
    const err = mapSdkError(Anthropic.APIError.generate(529, undefined, undefined, new Headers()));
    expect(err.kind).toBe('busy');
  });
});
