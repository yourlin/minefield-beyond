import type { CellId } from '../types/index.js';
import type { ITopologyGraph } from '../topology/types.js';
import type { CellConstraintValue } from './types.js';

/**
 * Domain value for an unknown cell: mine, safe, or both (unknown).
 * Represented as a bitmask for fast operations.
 */
const MINE = 1;
const SAFE = 2;
const BOTH = MINE | SAFE;

/**
 * A constraint from a revealed cell: the number of mines among
 * its neighbors must be in [originalMin, originalMax].
 *
 * The original min/max are immutable. Current effective values are
 * recomputed from the live domain state each time the constraint
 * is evaluated, avoiding double-subtraction bugs.
 */
interface Constraint {
  /** The revealed cell that generated this constraint. */
  readonly sourceCellId: CellId;
  /** All neighbor cell IDs that were unknown at construction time. */
  readonly neighborCells: readonly CellId[];
  /** Original minimum mines among these neighbors. */
  readonly originalMin: number;
  /** Original maximum mines among these neighbors. */
  readonly originalMax: number;
}

/**
 * Result of constraint propagation.
 */
export interface PropagationResult {
  /** Domain for each unknown cell (MINE, SAFE, or BOTH). */
  readonly domains: Map<CellId, number>;
  /** Whether a contradiction was found. */
  readonly contradiction: boolean;
  /** Reason for contradiction, if any. */
  readonly contradictionReason?: string;
}

/**
 * Constraint propagation engine using AC-3-style arc consistency.
 *
 * Maintains domains for unknown cells and propagates constraints
 * until no further reductions are possible or a contradiction is found.
 */
export class ConstraintPropagator {
  private domains: Map<CellId, number>;
  private constraints: Constraint[];
  private cellToConstraints: Map<CellId, number[]>;
  private initialContradiction: string | null = null;

  /**
   * Create a propagator from solver input.
   *
   * @param topology - The topology graph.
   * @param revealedCells - Revealed cells with their constraint values.
   * @param unknownCells - Cells whose mine/safe status is unknown.
   * @param totalMines - Total mine count for the board (or partition).
   * @param knownMineCount - Number of mines already determined.
   */
  constructor(
    private readonly topology: ITopologyGraph,
    revealedCells: ReadonlyMap<CellId, CellConstraintValue>,
    unknownCells: readonly CellId[],
    private readonly totalMines: number,
    private readonly knownMineCount: number,
  ) {
    // Initialize domains: all unknown cells start as BOTH
    this.domains = new Map<CellId, number>();
    for (const cellId of unknownCells) {
      this.domains.set(cellId, BOTH);
    }

    // Build constraints from revealed cells
    this.constraints = [];
    this.cellToConstraints = new Map<CellId, number[]>();

    for (const [cellId, value] of revealedCells) {
      const neighbors = topology.neighbors(cellId);
      const unknownNeighbors: CellId[] = [];

      for (const n of neighbors) {
        if (this.domains.has(n)) {
          unknownNeighbors.push(n);
        }
        // Revealed neighbors are safe (not mines) — no adjustment needed
      }

      // Determine min/max from the constraint value
      let min: number;
      let max: number;
      if (typeof value === 'number') {
        min = value;
        max = value;
      } else {
        min = value.min;
        max = value.max;
      }

      // Clamp to valid range
      min = Math.max(0, min);
      max = Math.min(unknownNeighbors.length, max);

      if (unknownNeighbors.length === 0) {
        // All neighbors are known — check if constraint is satisfied
        if (min > 0) {
          this.initialContradiction =
            `Cell ${cellId} requires at least ${min} mines among neighbors, but all neighbors are determined safe`;
        }
        continue;
      }

      const constraintIdx = this.constraints.length;
      this.constraints.push({
        sourceCellId: cellId,
        neighborCells: unknownNeighbors,
        originalMin: min,
        originalMax: max,
      });

      for (const n of unknownNeighbors) {
        let indices = this.cellToConstraints.get(n);
        if (!indices) {
          indices = [];
          this.cellToConstraints.set(n, indices);
        }
        indices.push(constraintIdx);
      }
    }
  }

  /**
   * Run constraint propagation until fixpoint or contradiction.
   *
   * @returns The propagation result with domains and contradiction status.
   */
  propagate(): PropagationResult {
    // Check for contradictions detected during construction
    if (this.initialContradiction) {
      return {
        domains: this.domains,
        contradiction: true,
        contradictionReason: this.initialContradiction,
      };
    }

    let changed = true;

    while (changed) {
      changed = false;

      // Local constraint propagation
      const localResult = this.propagateLocalConstraints();
      if (localResult === 'contradiction') {
        return {
          domains: this.domains,
          contradiction: true,
          contradictionReason: 'Contradiction during local constraint propagation',
        };
      }
      if (localResult === 'changed') {
        changed = true;
      }

      // Global mine count constraint
      const globalResult = this.propagateGlobalMineCount();
      if (globalResult === 'contradiction') {
        return {
          domains: this.domains,
          contradiction: true,
          contradictionReason: 'Global mine count constraint violated',
        };
      }
      if (globalResult === 'changed') {
        changed = true;
      }
    }

    return { domains: this.domains, contradiction: false };
  }

  /**
   * Run local constraint propagation until fixpoint.
   */
  private propagateLocalConstraints(): 'unchanged' | 'changed' | 'contradiction' {
    const queue: number[] = [];
    for (let i = 0; i < this.constraints.length; i++) {
      queue.push(i);
    }
    const inQueue = new Set<number>(queue);
    let anyChanged = false;

    while (queue.length > 0) {
      const ci = queue.shift()!;
      inQueue.delete(ci);

      const constraint = this.constraints[ci];
      const result = this.evaluateConstraint(constraint);

      if (result === 'contradiction') {
        return 'contradiction';
      }

      if (result === 'changed') {
        anyChanged = true;
        // Re-enqueue constraints affected by changed cells
        for (const n of constraint.neighborCells) {
          const related = this.cellToConstraints.get(n);
          if (related) {
            for (const ri of related) {
              if (ri !== ci && !inQueue.has(ri)) {
                queue.push(ri);
                inQueue.add(ri);
              }
            }
          }
        }
      }
    }

    return anyChanged ? 'changed' : 'unchanged';
  }

  /**
   * Evaluate a single constraint against current domains.
   *
   * Recomputes effective min/max from the original values and current
   * domain state — no mutable min/max to avoid double-subtraction.
   */
  private evaluateConstraint(
    constraint: Constraint,
  ): 'unchanged' | 'changed' | 'contradiction' {
    // Recompute effective min/max from current domain state
    let determinedMines = 0;
    const undetermined: CellId[] = [];

    for (const n of constraint.neighborCells) {
      const domain = this.domains.get(n);
      if (domain === MINE) {
        determinedMines++;
      } else if (domain === BOTH) {
        undetermined.push(n);
      } else if (domain === undefined || domain === 0) {
        // Domain empty — contradiction
        return 'contradiction';
      }
      // SAFE cells are skipped (not mines, not undetermined)
    }

    const effectiveMin = Math.max(0, constraint.originalMin - determinedMines);
    const effectiveMax = constraint.originalMax - determinedMines;
    const unknownCount = undetermined.length;

    // Check for contradiction
    if (effectiveMin > unknownCount) {
      return 'contradiction';
    }
    if (effectiveMax < 0) {
      return 'contradiction';
    }

    let changed = false;

    // If effectiveMin === unknownCount, all undetermined must be mines
    if (effectiveMin === unknownCount && unknownCount > 0) {
      for (const n of undetermined) {
        if (this.domains.get(n) === BOTH) {
          this.domains.set(n, MINE);
          changed = true;
        }
      }
    }

    // If effectiveMax === 0, all undetermined must be safe
    if (effectiveMax === 0 && unknownCount > 0) {
      for (const n of undetermined) {
        if (this.domains.get(n) === BOTH) {
          this.domains.set(n, SAFE);
          changed = true;
        }
      }
    }

    return changed ? 'changed' : 'unchanged';
  }

  /**
   * Apply global mine count constraint.
   */
  private propagateGlobalMineCount(): 'unchanged' | 'changed' | 'contradiction' {
    let currentMines = this.knownMineCount;
    const undetermined: CellId[] = [];

    for (const [cellId, domain] of this.domains) {
      if (domain === MINE) {
        currentMines++;
      } else if (domain === BOTH) {
        undetermined.push(cellId);
      }
    }

    const remainingMines = this.totalMines - currentMines;

    if (remainingMines < 0) {
      return 'contradiction';
    }
    if (remainingMines > undetermined.length) {
      return 'contradiction';
    }

    let changed = false;

    // If remaining mines === undetermined count, all undetermined are mines
    if (remainingMines === undetermined.length && undetermined.length > 0) {
      for (const cellId of undetermined) {
        this.domains.set(cellId, MINE);
        changed = true;
      }
    }

    // If remaining mines === 0, all undetermined are safe
    if (remainingMines === 0 && undetermined.length > 0) {
      for (const cellId of undetermined) {
        this.domains.set(cellId, SAFE);
        changed = true;
      }
    }

    return changed ? 'changed' : 'unchanged';
  }

  /**
   * Get the current domain for a cell.
   */
  getDomain(cellId: CellId): number {
    return this.domains.get(cellId) ?? 0;
  }

  /**
   * Get a snapshot of all domains.
   */
  getDomains(): ReadonlyMap<CellId, number> {
    return this.domains;
  }

  /**
   * Clone this propagator's state for backtracking.
   */
  clone(): ConstraintPropagator {
    const cloned = new ConstraintPropagator(
      this.topology,
      new Map(), // empty — we'll override state below
      [],
      this.totalMines,
      this.knownMineCount,
    );
    cloned.domains = new Map(this.domains);
    // Constraints are immutable (originalMin/originalMax never change),
    // so we can share the constraint objects. Only domains are mutable.
    cloned.constraints = this.constraints;
    cloned.cellToConstraints = this.cellToConstraints;
    cloned.initialContradiction = null; // already checked
    return cloned;
  }

  /**
   * Set a cell's domain to a specific value and re-propagate.
   *
   * @returns Whether propagation succeeded (no contradiction).
   */
  assign(cellId: CellId, value: typeof MINE | typeof SAFE): boolean {
    this.domains.set(cellId, value);
    const result = this.propagate();
    return !result.contradiction;
  }
}

/** Domain constant: cell is a mine. */
export { MINE, SAFE, BOTH };
