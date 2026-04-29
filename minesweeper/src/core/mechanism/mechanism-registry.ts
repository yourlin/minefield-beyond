import { MechanismType } from './types.js';
import type { DisplayValue } from './types.js';
import { MechanismError } from '../errors/mechanism-error.js';
import { computeFuzzyDisplay } from './fuzzy-hint.js';
import { computeDelayedDisplay } from './delayed-reveal.js';

/**
 * A function that computes the initial `DisplayValue` for a cell
 * given its truth value and mechanism-specific configuration.
 *
 * @param truthValue - Real neighbor mine count.
 * @param config - Mechanism-specific parameters (e.g. offset, delay).
 */
export type MechanismHandler = (truthValue: number, config: unknown) => DisplayValue;

/**
 * Global registry for mechanism handler functions.
 *
 * Consumers call `get()` with a `MechanismType` to retrieve the
 * handler function, then invoke it with truth value and config.
 *
 * Unlike `TopologyRegistry.create()` which creates instances via factory,
 * `MechanismRegistry.get()` returns a reusable handler function — mechanisms
 * are stateless transformations, not stateful objects.
 */
export class MechanismRegistry {
  private static handlers = new Map<MechanismType, MechanismHandler>();

  /**
   * Register a handler for a mechanism type.
   *
   * @param type - The mechanism type key.
   * @param handler - Handler function that computes display values.
   */
  static register(type: MechanismType, handler: MechanismHandler): void {
    MechanismRegistry.handlers.set(type, handler);
  }

  /**
   * Retrieve the handler for a mechanism type.
   *
   * @param type - The mechanism type to look up.
   * @throws {MechanismError} If no handler is registered for the given type.
   */
  static get(type: MechanismType): MechanismHandler {
    const handler = MechanismRegistry.handlers.get(type);
    if (!handler) {
      throw new MechanismError(`MechanismRegistry: unknown mechanism type '${type}'`);
    }
    return handler;
  }

  /**
   * Check whether a handler is registered for the given type.
   *
   * @param type - The mechanism type to check.
   */
  static has(type: MechanismType): boolean {
    return MechanismRegistry.handlers.has(type);
  }

  /**
   * Remove all registered handlers. Useful for test isolation.
   */
  static clear(): void {
    MechanismRegistry.handlers.clear();
  }
}

// Register built-in mechanisms
MechanismRegistry.register(
  MechanismType.None,
  (truthValue) => ({ kind: 'exact', value: truthValue }),
);

MechanismRegistry.register(
  MechanismType.FuzzyHint,
  (truthValue, config) => {
    const { offset } = config as { offset: number };
    return computeFuzzyDisplay(truthValue, offset);
  },
);

MechanismRegistry.register(
  MechanismType.DelayedReveal,
  (_truthValue, config) => {
    const { delay } = config as { delay: number };
    return computeDelayedDisplay(delay);
  },
);
