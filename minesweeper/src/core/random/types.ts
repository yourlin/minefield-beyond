/**
 * Deterministic random number generator interface.
 *
 * Implementations must be seedable so that identical seeds produce
 * identical sequences, enabling reproducible level generation and
 * solver behaviour.
 */
export interface IRandom {
  /**
   * Return the next pseudo-random floating-point number in `[0, 1)`.
   */
  next(): number;

  /**
   * Return the next pseudo-random integer in the inclusive range `[min, max]`.
   *
   * @param min - Lower bound (inclusive).
   * @param max - Upper bound (inclusive).
   */
  nextInt(min: number, max: number): number;
}
