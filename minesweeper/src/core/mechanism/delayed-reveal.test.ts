import { describe, it, expect } from 'vitest';
import { computeDelayedDisplay, isDelayComplete } from './delayed-reveal.js';

describe('core/mechanism/computeDelayedDisplay', () => {
  it('delay=3 → revealAfter=3, revealed=false', () => {
    const result = computeDelayedDisplay(3);
    expect(result).toEqual({ kind: 'delayed', revealAfter: 3, revealed: false });
  });

  it('delay=1 → revealAfter=1, revealed=false', () => {
    const result = computeDelayedDisplay(1);
    expect(result).toEqual({ kind: 'delayed', revealAfter: 1, revealed: false });
  });

  it('throws RangeError for delay < 1', () => {
    expect(() => computeDelayedDisplay(0)).toThrow(RangeError);
    expect(() => computeDelayedDisplay(-1)).toThrow(RangeError);
  });
});

describe('core/mechanism/isDelayComplete', () => {
  it('returns false when movesSinceReveal < revealAfter', () => {
    expect(isDelayComplete(3, 0)).toBe(false);
    expect(isDelayComplete(3, 1)).toBe(false);
    expect(isDelayComplete(3, 2)).toBe(false);
  });

  it('returns true when movesSinceReveal >= revealAfter', () => {
    expect(isDelayComplete(3, 3)).toBe(true);
    expect(isDelayComplete(3, 4)).toBe(true);
    expect(isDelayComplete(1, 1)).toBe(true);
  });
});
