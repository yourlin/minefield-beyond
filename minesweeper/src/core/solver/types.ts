import type { CellId } from '../types/index.js';
import type { ITopologyGraph } from '../topology/types.js';

/**
 * Assignment of a single cell as mine or safe.
 */
export interface CellAssignment {
  /** The cell this assignment applies to. */
  readonly cellId: CellId;
  /** Whether this cell is a mine. */
  readonly isMine: boolean;
}

/**
 * Constraint for a revealed cell.
 *
 * - `number` — exact mine count among neighbors (includes DelayedReveal).
 * - `{ min, max }` — FuzzyHint range constraint.
 */
export type CellConstraintValue = number | { readonly min: number; readonly max: number };

/**
 * Input to the constraint solver.
 */
export interface SolverInput {
  /** Topology graph providing adjacency queries. */
  readonly topology: ITopologyGraph;
  /** Revealed cells with their constraint values. */
  readonly revealedCells: ReadonlyMap<CellId, CellConstraintValue>;
  /** Total number of mines on the board. */
  readonly mineCount: number;
}

/**
 * Result of the constraint solver.
 *
 * Discriminated union on `kind`:
 * - `unique` — exactly one solution exists.
 * - `multiple` — two or more solutions exist (up to 2 retained).
 * - `unsolvable` — no valid solution exists.
 */
export type SolverResult =
  | {
      readonly kind: 'unique';
      readonly solution: readonly CellAssignment[];
    }
  | {
      readonly kind: 'multiple';
      readonly solutions: readonly (readonly CellAssignment[])[];
      readonly differingCells: readonly CellId[];
    }
  | {
      readonly kind: 'unsolvable';
      readonly reason: string;
    };
