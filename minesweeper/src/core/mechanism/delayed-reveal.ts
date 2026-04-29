import type { DisplayValue } from './types.js';

/**
 * Compute the initial delayed-reveal display value for a cell.
 *
 * The cell starts in a "waiting" state. After `delay` moves the
 * number is revealed (tracked externally by the game state machine).
 *
 * @param delay - Number of moves to wait before revealing (must be >= 1).
 * @returns A `DisplayValue` with `kind: 'delayed'` and `revealed: false`.
 * @throws {RangeError} If `delay` is less than 1.
 */
export function computeDelayedDisplay(delay: number): DisplayValue {
  if (!Number.isFinite(delay) || !Number.isInteger(delay) || delay < 1) {
    throw new RangeError(
      `computeDelayedDisplay: delay must be a positive integer, got ${delay}`,
    );
  }
  return {
    kind: 'delayed',
    revealAfter: delay,
    revealed: false,
  };
}

/**
 * Check whether a delayed-reveal cell's countdown has completed.
 *
 * @param revealAfter - The delay threshold from the cell's display value.
 * @param movesSinceReveal - Number of moves made since this cell was revealed.
 * @returns `true` if the number should now be shown.
 */
export function isDelayComplete(revealAfter: number, movesSinceReveal: number): boolean {
  return movesSinceReveal >= revealAfter;
}
