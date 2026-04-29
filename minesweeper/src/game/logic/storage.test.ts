import { describe, it, expect } from 'vitest';
import { MemoryStorage } from './storage.js';

describe('game/logic/MemoryStorage', () => {
  it('stores and retrieves values', () => {
    const s = new MemoryStorage();
    s.set('key', { a: 1 });
    expect(s.get('key')).toEqual({ a: 1 });
  });

  it('returns null for missing keys', () => {
    const s = new MemoryStorage();
    expect(s.get('missing')).toBeNull();
  });

  it('has() returns correct status', () => {
    const s = new MemoryStorage();
    expect(s.has('key')).toBe(false);
    s.set('key', 42);
    expect(s.has('key')).toBe(true);
  });

  it('remove() deletes a key', () => {
    const s = new MemoryStorage();
    s.set('key', 'value');
    s.remove('key');
    expect(s.get('key')).toBeNull();
  });

  it('clear() removes all keys', () => {
    const s = new MemoryStorage();
    s.set('a', 1);
    s.set('b', 2);
    s.clear();
    expect(s.get('a')).toBeNull();
    expect(s.get('b')).toBeNull();
  });

  it('handles corrupted JSON gracefully', () => {
    const s = new MemoryStorage();
    // Directly set invalid JSON via the internal map
    (s as unknown as { data: Map<string, string> }).data.set('bad', '{invalid');
    expect(s.get('bad')).toBeNull();
  });
});
