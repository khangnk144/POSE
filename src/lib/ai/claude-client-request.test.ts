import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { callClaudeJson } from './claude-client';

// SYNTHETIC response shaped like the Messages API reply, not a recorded one: this test checks
// the request we send (current models reject forced tool_choice with a 400).
const reply = {
  id: 'msg_x',
  type: 'message',
  role: 'assistant',
  model: 'claude-sonnet-5-5',
  content: [{ type: 'text', text: '{"title":"Ngồi sofa"}' }],
  stop_reason: 'end_turn',
  stop_sequence: null,
  usage: { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
};

let sentBody: Record<string, unknown> | undefined;

beforeEach(() => {
  vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');
  sentBody = undefined;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url: unknown, init?: { body?: string }) => {
      sentBody = JSON.parse(init?.body ?? '{}');
      return new Response(JSON.stringify(reply), { status: 200, headers: { 'content-type': 'application/json' } });
    }),
  );
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('callClaudeJson request', () => {
  it('asks for structured JSON output instead of a forced tool call, and parses the answer', async () => {
    const { output, usage } = await callClaudeJson({
      system: 'sys',
      userText: 'hi',
      images: [{ mediaType: 'image/jpeg', base64: 'AAAA' }],
      schema: { type: 'object', properties: { title: { type: 'string' }, h: { type: ['string', 'null'], enum: ['lower', null] } } },
      maxTokens: 8000,
      effort: 'low',
    });

    expect(sentBody).toBeDefined();
    expect(sentBody).not.toHaveProperty('tools');
    expect(sentBody).not.toHaveProperty('tool_choice');
    const config = sentBody?.output_config as { effort: string; format: { type: string; schema: Record<string, unknown> } };
    expect(config.effort).toBe('low');
    expect(config.format.type).toBe('json_schema');
    expect(config.format.schema.additionalProperties).toBe(false);
    expect(output).toEqual({ title: 'Ngồi sofa' });
    expect(usage.inputTokens).toBe(10);
  });
});
