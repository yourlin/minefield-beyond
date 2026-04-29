import { MinesweeperError } from './base-error.js';

/**
 * Error thrown when the constraint solver encounters an unrecoverable problem.
 *
 * Examples: unsolvable board configuration, solver timeout,
 * internal contradiction in constraint propagation.
 */
export class SolverError extends MinesweeperError {
  constructor(message: string) {
    super(message, 'SOLVER_ERROR');
  }
}
