import { describe, it, expect } from 'vitest';
import { computeFuzzyDisplay } from './fuzzy-hint.js';

describe('core/mechanism/computeFuzzyDisplay', () => {
  it('truthValue=3, offset=1 → min=2, max=4', () => {
    const result = computeFuzzyDisplay(3, 1);
    expect(result).toEqual({ kind: 'fuzzy', min: 2, max: 4 });
  });

  it('truthValue=0, offset=2 → min=0, max=2 (min clamped to 0)', () => {
    const result = computeFuzzyDisplay(0, 2);
    expect(result).toEqual({ kind: 'fuzzy', min: 0, max: 2 });
  });

  it('truthValue=5, offset=0 → min=5, max=5 (degenerates to exact)', () => {
    const result = computeFuzzyDisplay(5, 0);
    expect(result).toEqual({ kind: 'fuzzy', min: 5, max: 5 });
  });

  it('throws RangeError for negative truthValue', () => {
    expect(() => computeFuzzyDisplay(-1, 1)).toThrow(RangeError);
  });

  it('throws RangeError for negative offset', () => {
    expect(() => computeFuzzyDisplay(3, -1)).toThrow(RangeError);
  });

  it('truthValue=1, offset=3 → min=0, max=4 (min clamped)', () => {
    const result = computeFuzzyDisplay(1, 3);
    expect(result).toEqual({ kind: 'fuzzy', min: 0, max: 4 });
  });
});
