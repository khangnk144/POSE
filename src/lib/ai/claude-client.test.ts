import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { AiCallError, extractToolInput } from './claude-client';

// SYNTHETIC message shapes (see Message / ToolUseBlock in the SDK types), not recorded responses.
const toolUse = (input: unknown, name = 'fill_pose') => ({
  type: 'tool_use',
  id: 'toolu_x',
  name,
  input,
  caller: { type: 'direct' },
});
const text = { type: 'text', text: 'hi', citations: null };

describe('extractToolInput', () => {
  it('returns the input of the named tool_use block', () => {
    const msg = { stop_reason: 'tool_use', content: [text, toolUse({ title: 'x' })] };
    expect(extractToolInput(msg as never, 'fill_pose')).toEqual({ title: 'x' });
  });

  it('throws bad_output when the tool was not called', () => {
    const msg = { stop_reason: 'end_turn', content: [text] };
    expect(() => extractToolInput(msg as never, 'fill_pose')).toThrow(AiCallError);
  });

  it('throws bad_output when the answer was cut off at max_tokens', () => {
    const msg = { stop_reason: 'max_tokens', content: [toolUse({ title: 'x' })] };
    expect(() => extractToolInput(msg as never, 'fill_pose')).toThrow(/max_tokens/);
  });

  it('ignores tool_use blocks for other tools', () => {
    const msg = { stop_reason: 'tool_use', content: [toolUse({}, 'other')] };
    expect(() => extractToolInput(msg as never, 'fill_pose')).toThrow(AiCallError);
  });
});
