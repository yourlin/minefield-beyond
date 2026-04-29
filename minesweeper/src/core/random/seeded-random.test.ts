import { describe, it, expect } from 'vitest';
import { SeededRandom } from './seeded-random.js';

describe('core/random/SeededRandom', () => {
  it('produces the same sequence for the same seed', () => {
    const a = new SeededRandom(42);
    const b = new SeededRandom(42);
    const count = 100;

    for (let i = 0; i < count; i++) {
      expect(a.next()).toBe(b.next());
    }
  });

  it('produces different sequences for different seeds', () => {
    const a = new SeededRandom(1);
    const b = new SeededRandom(2);
    const count = 20;

    let allSame = true;
    for (let i = 0; i < count; i++) {
      if (a.next() !== b.next()) {
        allSame = false;
        break;
      }
    }

    expect(allSame).toBe(false);
  });

  it('nextInt returns values within [min, max]', () => {
    const rng = new SeededRandom(123);
    const min = 5;
    const max = 15;
    const count = 1000;

    for (let i = 0; i < count; i++) {
      const value = rng.nextInt(min, max);
      expect(value).toBeGreaterThanOrEqual(min);
      expect(value).toBeLessThanOrEqual(max);
      expect(Number.isInteger(value)).toBe(true);
    }
  });

  it('next() values are approximately uniformly distributed', () => {
    const rng = new SeededRandom(999);
    const sampleCount = 10000;
    const bucketCount = 10;
    const buckets = new Array<number>(bucketCount).fill(0);

    for (let i = 0; i < sampleCount; i++) {
      const value = rng.next();
      // value should be in [0, 1)
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);

      const bucketIndex = Math.min(Math.floor(value * bucketCount), bucketCount - 1);
      buckets[bucketIndex]++;
    }

    const expected = sampleCount / bucketCount; // 1000 per bucket
    const maxDeviation = 0.05; // 5%

    for (let i = 0; i < bucketCount; i++) {
      const deviation = Math.abs(buckets[i] - expected) / expected;
      expect(deviation).toBeLessThan(maxDeviation);
    }
  });

  it('works correctly with seed 0', () => {
    const a = new SeededRandom(0);
    const b = new SeededRandom(0);

    for (let i = 0; i < 20; i++) {
      const val = a.next();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
      expect(val).toBe(b.next());
    }
  });

  it('works correctly with negative seeds', () => {
    const a = new SeededRandom(-1);
    const b = new SeededRandom(-1);

    for (let i = 0; i < 20; i++) {
      expect(a.next()).toBe(b.next());
    }

    // negative seed produces different sequence than positive
    const c = new SeededRandom(-1);
    const d = new SeededRandom(1);
    let allSame = true;
    for (let i = 0; i < 20; i++) {
      if (c.next() !== d.next()) {
        allSame = false;
        break;
      }
    }
    expect(allSame).toBe(false);
  });

  it('handles large seeds via 32-bit truncation', () => {
    const rng = new SeededRandom(2 ** 31 - 1); // max positive 32-bit int

    // just verify they produce valid output
    for (let i = 0; i < 20; i++) {
      const val = rng.next();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }

    // max 32-bit int should differ from seed 0
    const c = new SeededRandom(0);
    const d = new SeededRandom(2 ** 31 - 1);
    let allSame = true;
    for (let i = 0; i < 20; i++) {
      if (c.next() !== d.next()) {
        allSame = false;
        break;
      }
    }
    expect(allSame).toBe(false);
  });

  it('throws on NaN seed', () => {
    expect(() => new SeededRandom(NaN)).toThrow(RangeError);
  });

  it('throws on Infinity seed', () => {
    expect(() => new SeededRandom(Infinity)).toThrow(RangeError);
    expect(() => new SeededRandom(-Infinity)).toThrow(RangeError);
  });

  it('nextInt returns min when min === max', () => {
    const rng = new SeededRandom(42);
    for (let i = 0; i < 100; i++) {
      expect(rng.nextInt(7, 7)).toBe(7);
    }
  });

  it('nextInt throws when min > max', () => {
    const rng = new SeededRandom(42);
    expect(() => rng.nextInt(10, 5)).toThrow(RangeError);
  });
});
