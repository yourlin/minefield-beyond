import type { DisplayValue } from './types.js';

/**
 * Compute the fuzzy display value for a cell.
 *
 * The displayed range is `[max(0, truthValue - offset), truthValue + offset]`.
 * When `offset` is 0 the range collapses to a single value (equivalent to exact).
 *
 * @param truthValue - Real neighbor mine count (must be >= 0).
 * @param offset - Symmetric offset applied around the truth value (must be >= 0).
 * @returns A `DisplayValue` with `kind: 'fuzzy'`.
 * @throws {RangeError} If `truthValue` or `offset` is negative.
 */
export function computeFuzzyDisplay(truthValue: number, offset: number): DisplayValue {
  if (!Number.isFinite(truthValue) || !Number.isInteger(truthValue) || truthValue < 0) {
    throw new RangeError(
      `computeFuzzyDisplay: truthValue must be a non-negative integer, got ${truthValue}`,
    );
  }
  if (!Number.isFinite(offset) || !Number.isInteger(offset) || offset < 0) {
    throw new RangeError(
      `computeFuzzyDisplay: offset must be a non-negative integer, got ${offset}`,
    );
  }
  return {
    kind: 'fuzzy',
    min: Math.max(0, truthValue - offset),
    max: truthValue + offset,
  };
}
