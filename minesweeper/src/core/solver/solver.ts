import type { CellId } from '../types/index.js';
import type { SolverInput, SolverResult, CellAssignment } from './types.js';
import type { ITopologyGraph } from '../topology/types.js';
import { ConstraintPropagator, MINE, BOTH } from './constraint-propagation.js';
import { BacktrackSearch } from './backtrack-search.js';
import { findConnectedComponents } from './connected-components.js';

/**
 * Constraint solver for minesweeper solvability verification.
 *
 * Verifies whether a given board configuration has a unique solution
 * under the specified information mechanism constraints.
 *
 * Algorithm:
 * 1. Split unknown cells into connected components.
 * 2. For each component: constraint propagation → backtracking if needed.
 * 3. Merge results: all unique → unique; any multiple → multiple; any unsolvable → unsolvable.
 */
export class ConstraintSolver {
  /**
   * Solve the given board configuration.
   *
   * @param input - The solver input (topology, revealed cells, mine count).
   * @returns The solver result indicating uniqueness, multiplicity, or unsolvability.
   */
  solve(input: SolverInput): SolverResult {
    const { topology, revealedCells, mineCount } = input;

    // Determine unknown cells (not revealed)
    const allCells = topology.cells();
    const revealedSet = new Set(revealedCells.keys());
    const unknownCells = allCells.filter((c) => !revealedSet.has(c));

    if (unknownCells.length === 0) {
      // All cells revealed — check if mine count matches
      if (mineCount === 0) {
        return { kind: 'unique', solution: [] };
      }
      return { kind: 'unsolvable', reason: `Expected ${mineCount} mines but all cells are revealed` };
    }

    // Split into connected components
    const components = findConnectedComponents(topology, revealedCells, unknownCells);

    if (components.length === 0) {
      return { kind: 'unsolvable', reason: 'No unknown cells to solve' };
    }

    // Solve each component
    const componentResults: { solution: readonly CellAssignment[]; minesUsed: number }[] = [];
    let totalMinesAssigned = 0;

    // For single component, use full mine count
    // For multiple components, we need to distribute mines
    if (components.length === 1) {
      const result = this.solveComponent(
        topology,
        components[0].revealedCells,
        components[0].unknownCells,
        mineCount,
        0,
      );

      if (result.kind !== 'unique') {
        return result;
      }

      return result;
    }

    // Multiple components: solve each independently
    // First pass: propagate each component to determine fixed mines

    for (const component of components) {
      // For each component, we don't know the exact mine count.
      // We need to find all valid mine counts for each component.
      // Simplified approach: solve with backtracking, checking global constraint at the end.
      const result = this.solveComponentFlexible(
        topology,
        component.revealedCells,
        component.unknownCells,
      );

      if (result.kind === 'unsolvable') {
        return result;
      }

      if (result.kind === 'multiple') {
        return result;
      }

      componentResults.push({
        solution: result.solution,
        minesUsed: result.solution.filter((a) => a.isMine).length,
      });
      totalMinesAssigned += result.solution.filter((a) => a.isMine).length;
    }

    // Check global mine count
    if (totalMinesAssigned !== mineCount) {
      return {
        kind: 'unsolvable',
        reason: `Component solutions assign ${totalMinesAssigned} mines, expected ${mineCount}`,
      };
    }

    // Merge solutions
    const mergedSolution: CellAssignment[] = [];
    for (const cr of componentResults) {
      mergedSolution.push(...cr.solution);
    }

    return { kind: 'unique', solution: mergedSolution };
  }

  /**
   * Solve a single component with a known mine count.
   */
  private solveComponent(
    topology: ITopologyGraph,
    revealedCells: ReadonlyMap<CellId, number | { min: number; max: number }>,
    unknownCells: readonly CellId[],
    mineCount: number,
    knownMineCount: number,
  ): SolverResult {
    const propagator = new ConstraintPropagator(
      topology,
      revealedCells,
      unknownCells,
      mineCount,
      knownMineCount,
    );

    const propResult = propagator.propagate();

    if (propResult.contradiction) {
      return {
        kind: 'unsolvable',
        reason: propResult.contradictionReason ?? 'Contradiction during propagation',
      };
    }

    // Check if all cells are determined
    let allDetermined = true;
    for (const [, domain] of propResult.domains) {
      if (domain === BOTH) {
        allDetermined = false;
        break;
      }
    }

    if (allDetermined) {
      // Verify mine count
      let mines = knownMineCount;
      const solution: CellAssignment[] = [];
      for (const [cellId, domain] of propResult.domains) {
        const isMine = domain === MINE;
        if (isMine) mines++;
        solution.push({ cellId, isMine });
      }

      if (mines !== mineCount) {
        return {
          kind: 'unsolvable',
          reason: `Propagation determined ${mines} mines, expected ${mineCount}`,
        };
      }

      return { kind: 'unique', solution };
    }

    // Need backtracking
    const searcher = new BacktrackSearch();
    const searchResult = searcher.search(propagator);

    if (searchResult.solutionCount === 0) {
      return { kind: 'unsolvable', reason: 'No solution found during backtracking' };
    }

    if (searchResult.solutionCount === 1) {
      return { kind: 'unique', solution: searchResult.solutions[0] };
    }

    return {
      kind: 'multiple',
      solutions: searchResult.solutions,
      differingCells: searchResult.differingCells,
    };
  }

  /**
   * Solve a component without a fixed mine count (for multi-component boards).
   * Uses constraint propagation + backtracking without global mine constraint.
   */
  private solveComponentFlexible(
    topology: ITopologyGraph,
    revealedCells: ReadonlyMap<CellId, number | { min: number; max: number }>,
    unknownCells: readonly CellId[],
  ): SolverResult {
    // Use a large mine count to avoid global constraint interference
    // The global constraint will be checked after all components are solved
    const maxPossibleMines = unknownCells.length;

    const propagator = new ConstraintPropagator(
      topology,
      revealedCells,
      unknownCells,
      maxPossibleMines,
      0,
    );

    const propResult = propagator.propagate();

    if (propResult.contradiction) {
      return {
        kind: 'unsolvable',
        reason: propResult.contradictionReason ?? 'Contradiction during propagation',
      };
    }

    // Check if all cells are determined
    let allDetermined = true;
    for (const [, domain] of propResult.domains) {
      if (domain === BOTH) {
        allDetermined = false;
        break;
      }
    }

    if (allDetermined) {
      const solution: CellAssignment[] = [];
      for (const [cellId, domain] of propResult.domains) {
        solution.push({ cellId, isMine: domain === MINE });
      }
      return { kind: 'unique', solution };
    }

    // Need backtracking
    const searcher = new BacktrackSearch();
    const searchResult = searcher.search(propagator);

    if (searchResult.solutionCount === 0) {
      return { kind: 'unsolvable', reason: 'No solution found during backtracking' };
    }

    if (searchResult.solutionCount === 1) {
      return { kind: 'unique', solution: searchResult.solutions[0] };
    }

    return {
      kind: 'multiple',
      solutions: searchResult.solutions,
      differingCells: searchResult.differingCells,
    };
  }
}
