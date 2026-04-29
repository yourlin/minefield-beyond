import { describe, it, expect, afterEach } from 'vitest';
import { MechanismRegistry } from './mechanism-registry.js';
import { MechanismType } from './types.js';
import type { CellState } from './types.js';
import { MechanismError } from '../errors/mechanism-error.js';
import { computeFuzzyDisplay } from './fuzzy-hint.js';
import { computeDelayedDisplay } from './delayed-reveal.js';

describe('core/mechanism/MechanismRegistry', () => {
  afterEach(() => {
    // ESM modules are cached — dynamic re-import won't re-run side effects.
    // Explicitly re-register built-in handlers if cleared.
    if (!MechanismRegistry.has(MechanismType.FuzzyHint)) {
      MechanismRegistry.register(
        MechanismType.FuzzyHint,
        (truthValue, config) => {
          const { offset } = config as { offset: number };
          return computeFuzzyDisplay(truthValue, offset);
        },
      );
    }
    if (!MechanismRegistry.has(MechanismType.DelayedReveal)) {
      MechanismRegistry.register(
        MechanismType.DelayedReveal,
        (_truthValue, config) => {
          const { delay } = config as { delay: number };
          return computeDelayedDisplay(delay);
        },
      );
    }
    if (!MechanismRegistry.has(MechanismType.None)) {
      MechanismRegistry.register(
        MechanismType.None,
        (truthValue) => ({ kind: 'exact', value: truthValue }),
      );
    }
  });

  it('FuzzyHint, DelayedReveal, and None are pre-registered', () => {
    expect(MechanismRegistry.has(MechanismType.FuzzyHint)).toBe(true);
    expect(MechanismRegistry.has(MechanismType.DelayedReveal)).toBe(true);
    expect(MechanismRegistry.has(MechanismType.None)).toBe(true);
  });

  it('get() returns a working FuzzyHint handler', () => {
    const handler = MechanismRegistry.get(MechanismType.FuzzyHint);
    const result = handler(3, { offset: 1 });
    expect(result).toEqual({ kind: 'fuzzy', min: 2, max: 4 });
  });

  it('get() returns a working DelayedReveal handler', () => {
    const handler = MechanismRegistry.get(MechanismType.DelayedReveal);
    const result = handler(5, { delay: 2 });
    expect(result).toEqual({ kind: 'delayed', revealAfter: 2, revealed: false });
  });

  it('get() throws MechanismError for unregistered type', () => {
    expect(() => MechanismRegistry.get('nonexistent' as MechanismType)).toThrow(MechanismError);
  });

  it('get() returns a working None handler (exact value pass-through)', () => {
    const handler = MechanismRegistry.get(MechanismType.None);
    const result = handler(4, {});
    expect(result).toEqual({ kind: 'exact', value: 4 });
  });

  it('CellState type enforces single mechanism per cell', () => {
    // Type-level constraint: CellState.mechanism is MechanismType (not an array)
    const cell: CellState = {
      cellId: 0,
      truthValue: 3,
      displayValue: { kind: 'fuzzy', min: 2, max: 4 },
      mechanism: MechanismType.FuzzyHint,
    };
    expect(cell.mechanism).toBe(MechanismType.FuzzyHint);

    const noMechanism: CellState = {
      cellId: 1,
      truthValue: 2,
      displayValue: { kind: 'exact', value: 2 },
      mechanism: MechanismType.None,
    };
    expect(noMechanism.mechanism).toBe(MechanismType.None);
  });
});
