import { describe, it, expect } from 'vitest';
import { ConstraintSolver } from './solver.js';
import { HexTopology } from '../topology/hex-topology.js';
import type { SolverInput } from './types.js';

/**
 * Helper: build a solver input from a hex grid with known mine positions.
 * Reveals all non-mine cells with their exact neighbor mine counts.
 */
function buildHexInput(
  rows: number,
  cols: number,
  minePositions: number[],
  fuzzyHintCells?: Map<number, { min: number; max: number }>,
): SolverInput {
  const topo = new HexTopology({ rows, cols });
  const mineSet = new Set(minePositions);
  const revealedCells = new Map<number, number | { min: number; max: number }>();

  for (const cellId of topo.cells()) {
    if (mineSet.has(cellId)) continue;

    // Count mine neighbors
    const neighbors = topo.neighbors(cellId);
    const mineNeighborCount = neighbors.filter((n) => mineSet.has(n)).length;

    if (fuzzyHintCells?.has(cellId)) {
      revealedCells.set(cellId, fuzzyHintCells.get(cellId)!);
    } else {
      revealedCells.set(cellId, mineNeighborCount);
    }
  }

  return { topology: topo, revealedCells, mineCount: minePositions.length };
}

describe('core/solver/ConstraintSolver', () => {
  const solver = new ConstraintSolver();

  // --- Test 1: 5×5 hex + exact numbers → unique solution ---
  it('finds unique solution for 5×5 hex with exact numbers', () => {
    // 5×5 hex grid, mines at positions 3, 12, 20
    const input = buildHexInput(5, 5, [3, 12, 20]);
    const result = solver.solve(input);

    expect(result.kind).toBe('unique');
    if (result.kind === 'unique') {
      // Verify the solution matches our mine positions
      const mineSet = new Set([3, 12, 20]);
      for (const assignment of result.solution) {
        expect(assignment.isMine).toBe(mineSet.has(assignment.cellId));
      }
    }
  });

  // --- Test 2: 5×5 hex + FuzzyHint → unique solution ---
  it('finds unique solution for 5×5 hex with FuzzyHint', () => {
    // 5×5 hex grid, mines at positions 6, 18
    // Some cells use fuzzy hints instead of exact numbers
    const topo = new HexTopology({ rows: 5, cols: 5 });
    const mineSet = new Set([6, 18]);

    // Build revealed cells — some with fuzzy hints
    const revealedCells = new Map<number, number | { min: number; max: number }>();
    const fuzzyTargets = new Set([7, 11]); // These cells get fuzzy hints

    for (const cellId of topo.cells()) {
      if (mineSet.has(cellId)) continue;

      const neighbors = topo.neighbors(cellId);
      const mineNeighborCount = neighbors.filter((n) => mineSet.has(n)).length;

      if (fuzzyTargets.has(cellId)) {
        // Fuzzy hint: exact value ± 0 (still unique)
        revealedCells.set(cellId, { min: mineNeighborCount, max: mineNeighborCount });
      } else {
        revealedCells.set(cellId, mineNeighborCount);
      }
    }

    const input: SolverInput = { topology: topo, revealedCells, mineCount: 2 };
    const result = solver.solve(input);

    expect(result.kind).toBe('unique');
    if (result.kind === 'unique') {
      for (const assignment of result.solution) {
        expect(assignment.isMine).toBe(mineSet.has(assignment.cellId));
      }
    }
  });

  // --- Test 3: non-unique solution detection ---
  it('detects non-unique solution and reports differing cells', () => {
    // 1×3 hex grid: cells 0, 1, 2
    // Cell 1 revealed with value 1 (1 mine among neighbors)
    // Mines could be at 0 or 2 — not unique
    const topo = new HexTopology({ rows: 1, cols: 3 });
    const revealedCells = new Map<number, number | { min: number; max: number }>();
    revealedCells.set(1, 1);

    const input: SolverInput = { topology: topo, revealedCells, mineCount: 1 };
    const result = solver.solve(input);

    expect(result.kind).toBe('multiple');
    if (result.kind === 'multiple') {
      expect(result.solutions.length).toBe(2);
      expect(result.differingCells.length).toBeGreaterThan(0);
    }
  });

  // --- Test 4: unsolvable detection ---
  it('detects unsolvable board', () => {
    // 1×2 hex grid: cells 0, 1
    // Cell 0 revealed with value 0 (no mines among neighbors)
    // But mineCount = 1 — cell 1 must be a mine
    // Cell 0 says 0 mines among neighbors, but cell 1 is its neighbor
    // Contradiction!
    const topo = new HexTopology({ rows: 1, cols: 2 });
    const revealedCells = new Map<number, number | { min: number; max: number }>();
    revealedCells.set(0, 0); // 0 mines among neighbors

    const input: SolverInput = { topology: topo, revealedCells, mineCount: 1 };
    const result = solver.solve(input);

    expect(result.kind).toBe('unsolvable');
  });

  // --- Test 5: connected component splitting ---
  it('handles independent regions via connected components', () => {
    // 5×5 hex grid with mines at 0 and 24 (opposite corners)
    // These are far apart and should form independent components
    const input = buildHexInput(5, 5, [0, 24]);
    const result = solver.solve(input);

    expect(result.kind).toBe('unique');
    if (result.kind === 'unique') {
      const mineSet = new Set([0, 24]);
      for (const assignment of result.solution) {
        expect(assignment.isMine).toBe(mineSet.has(assignment.cellId));
      }
    }
  });

  // --- Test 6: 200 cells performance test (< 30s) ---
  it('solves 200-cell board within 30 seconds', () => {
    // 10×20 hex grid = 200 cells, 15 mines
    const minePositions = [5, 15, 25, 35, 45, 55, 65, 75, 85, 95, 105, 115, 125, 135, 145];
    const input = buildHexInput(10, 20, minePositions);

    const start = performance.now();
    const result = solver.solve(input);
    const elapsed = performance.now() - start;

    expect(result.kind).toBe('unique');
    expect(elapsed).toBeLessThan(30000); // < 30s
  });

  // --- Additional: all cells revealed, no mines ---
  it('handles trivial case: all cells revealed, 0 mines', () => {
    const topo = new HexTopology({ rows: 2, cols: 2 });
    const revealedCells = new Map<number, number | { min: number; max: number }>();
    for (const cellId of topo.cells()) {
      revealedCells.set(cellId, 0);
    }

    const input: SolverInput = { topology: topo, revealedCells, mineCount: 0 };
    const result = solver.solve(input);

    expect(result.kind).toBe('unique');
    if (result.kind === 'unique') {
      expect(result.solution).toHaveLength(0);
    }
  });

  // --- Additional: single mine, single unknown ---
  it('solves single unknown cell with 1 mine', () => {
    const topo = new HexTopology({ rows: 1, cols: 2 });
    const revealedCells = new Map<number, number | { min: number; max: number }>();
    revealedCells.set(0, 1); // 1 mine among neighbors

    const input: SolverInput = { topology: topo, revealedCells, mineCount: 1 };
    const result = solver.solve(input);

    expect(result.kind).toBe('unique');
    if (result.kind === 'unique') {
      expect(result.solution).toHaveLength(1);
      expect(result.solution[0].cellId).toBe(1);
      expect(result.solution[0].isMine).toBe(true);
    }
  });
});
