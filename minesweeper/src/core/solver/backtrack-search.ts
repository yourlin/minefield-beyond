import type { CellId } from '../types/index.js';
import type { CellAssignment } from './types.js';
import { ConstraintPropagator, MINE, SAFE, BOTH } from './constraint-propagation.js';

/**
 * Result of a backtracking search.
 */
export interface BacktrackResult {
  /** Number of solutions found (0, 1, or 2). */
  readonly solutionCount: number;
  /** The solutions found (at most 2). */
  readonly solutions: readonly (readonly CellAssignment[])[];
  /** Cells that differ between solutions (if multiple). */
  readonly differingCells: readonly CellId[];
}

/**
 * Backtracking search over constraint propagation states.
 *
 * Finds up to 2 solutions. If 2 are found, records the differing
 * cells and stops — we only need to know uniqueness, not enumerate all.
 */
export class BacktrackSearch {
  private solutions: (readonly CellAssignment[])[] = [];

  /**
   * Run backtracking search on the given propagator state.
   *
   * @param propagator - A propagator with domains already propagated.
   * @returns The search result with solutions and differing cells.
   */
  search(propagator: ConstraintPropagator): BacktrackResult {
    this.solutions = [];
    this.backtrack(propagator);

    if (this.solutions.length === 0) {
      return { solutionCount: 0, solutions: [], differingCells: [] };
    }

    if (this.solutions.length === 1) {
      return { solutionCount: 1, solutions: this.solutions, differingCells: [] };
    }

    // Find differing cells between the two solutions
    const sol1 = this.solutions[0];
    const sol2 = this.solutions[1];
    const map1 = new Map<CellId, boolean>();
    for (const a of sol1) {
      map1.set(a.cellId, a.isMine);
    }

    const differingCells: CellId[] = [];
    for (const a of sol2) {
      const v1 = map1.get(a.cellId);
      if (v1 !== a.isMine) {
        differingCells.push(a.cellId);
      }
    }

    return { solutionCount: 2, solutions: this.solutions, differingCells };
  }

  /**
   * Recursive backtracking.
   *
   * @returns true if we should stop searching (found 2 solutions).
   */
  private backtrack(propagator: ConstraintPropagator): boolean {
    // Find the first undetermined cell (domain === BOTH)
    // Prefer cells with more constraints (heuristic: pick any BOTH cell)
    const domains = propagator.getDomains();
    let branchCell: CellId | null = null;

    for (const [cellId, domain] of domains) {
      if (domain === BOTH) {
        branchCell = cellId;
        break;
      }
    }

    if (branchCell === null) {
      // All cells determined — this is a solution
      const solution = this.extractSolution(domains);
      this.solutions.push(solution);
      return this.solutions.length >= 2;
    }

    // Try MINE first
    const mineClone = propagator.clone();
    if (mineClone.assign(branchCell, MINE)) {
      if (this.backtrack(mineClone)) {
        return true;
      }
    }

    // Try SAFE
    const safeClone = propagator.clone();
    if (safeClone.assign(branchCell, SAFE)) {
      if (this.backtrack(safeClone)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Extract a solution from fully determined domains.
   */
  private extractSolution(
    domains: ReadonlyMap<CellId, number>,
  ): readonly CellAssignment[] {
    const assignments: CellAssignment[] = [];
    for (const [cellId, domain] of domains) {
      assignments.push({ cellId, isMine: domain === MINE });
    }
    return assignments;
  }
}
