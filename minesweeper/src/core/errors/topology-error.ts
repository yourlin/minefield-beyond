import { MinesweeperError } from './base-error.js';

/**
 * Error thrown when a topology operation fails.
 *
 * Examples: invalid cell coordinates, unsupported topology type,
 * neighbour lookup on a non-existent cell.
 */
export class TopologyError extends MinesweeperError {
  constructor(message: string) {
    super(message, 'TOPOLOGY_ERROR');
  }
}
