import type { IRandom } from './types.js';

/**
 * Deterministic PRNG based on the **mulberry32** algorithm.
 *
 * Mulberry32 is a simple 32-bit state generator with good distribution
 * properties and a period of 2^32. It is well-suited for game-level
 * generation where cryptographic strength is unnecessary.
 *
 * @see https://gist.github.com/tommyettinger/46a874533244883189143505d203312c
 */
export class SeededRandom implements IRandom {
  /** Internal 32-bit state. */
  private state: number;

  /**
   * Create a new deterministic PRNG.
   *
   * @param seed - Any integer. The same seed always produces the same sequence.
   */
  constructor(seed: number) {
    if (!Number.isFinite(seed)) {
      throw new RangeError(
        `SeededRandom: seed must be a finite number, got ${seed}`,
      );
    }
    this.state = seed | 0; // coerce to 32-bit integer
  }

  /** @inheritdoc */
  next(): number {
    // mulberry32 core
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  }

  /** @inheritdoc */
  nextInt(min: number, max: number): number {
    if (min > max) {
      throw new RangeError(
        `SeededRandom.nextInt: min (${min}) must be <= max (${max})`,
      );
    }
    const range = max - min + 1;
    return min + Math.floor(this.next() * range);
  }
}
