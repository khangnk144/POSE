import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import Anthropic from '@anthropic-ai/sdk';
import { AiCallError, mapSdkError, readStructuredOutput } from './claude-client';

describe('readStructuredOutput', () => {
  it('returns the parsed JSON answer', () => {
    expect(readStructuredOutput({ stop_reason: 'end_turn', parsed_output: { title: 'x' } })).toEqual({ title: 'x' });
  });

  it('throws bad_output when there is no structured output', () => {
    expect(() => readStructuredOutput({ stop_reason: 'end_turn', parsed_output: null })).toThrow(AiCallError);
  });

  it('throws bad_output when the answer was cut off at max_tokens', () => {
    expect(() => readStructuredOutput({ stop_reason: 'max_tokens', parsed_output: { title: 'x' } })).toThrow(/max_tokens/);
  });

  it('throws bad_output when the model refused', () => {
    expect(() => readStructuredOutput({ stop_reason: 'refusal', parsed_output: null })).toThrow(/refused/);
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
