import { describe, expect, it } from 'vitest';
import { listOnlineUsers, splitVisible } from './presence';

const u = (id: string, name: string) => ({ id, name, emoji: '🐱', color: 'avatar-2' });

describe('listOnlineUsers', () => {
  it('puts the viewer first and sorts the rest by name', () => {
    const state = { b: [u('b', 'Mai')], a: [u('a', 'An')], me: [u('me', 'Zed')] };
    expect(listOnlineUsers(state, 'me').map((x) => x.id)).toEqual(['me', 'a', 'b']);
  });

  it('collapses several tabs of the same user into one', () => {
    const state = { a: [u('a', 'An'), u('a', 'An')], a2: [u('a', 'An')] };
    expect(listOnlineUsers(state, null)).toHaveLength(1);
  });

  it('drops malformed payloads and fills missing look with defaults', () => {
    const state = { x: [{}, { id: 'p' }, { id: 'q', name: 'Q' }] };
    expect(listOnlineUsers(state, null)).toEqual([{ id: 'q', name: 'Q', emoji: '🐼', color: 'avatar-1' }]);
  });
});

describe('splitVisible', () => {
  const many = Array.from({ length: 8 }, (_, i) => u(String(i), `n${i}`));
  it('caps at 5 and reports the overflow', () => {
    const { visible, overflow } = splitVisible(many);
    expect(visible).toHaveLength(5);
    expect(overflow).toBe(3);
  });
  it('has no overflow at or below the cap', () => {
    expect(splitVisible(many.slice(0, 5)).overflow).toBe(0);
    expect(splitVisible([]).visible).toEqual([]);
  });
});
