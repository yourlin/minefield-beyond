import { MinesweeperError } from './base-error.js';

/**
 * Error thrown when a mechanism operation fails.
 *
 * Examples: unknown mechanism type in registry lookup,
 * invalid mechanism configuration.
 */
export class MechanismError extends MinesweeperError {
  constructor(message: string) {
    super(message, 'MECHANISM_ERROR');
  }
}
