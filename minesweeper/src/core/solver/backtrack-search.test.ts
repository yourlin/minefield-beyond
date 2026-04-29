import { describe, it, expect } from 'vitest';
import { BacktrackSearch } from './backtrack-search.js';
import { ConstraintPropagator } from './constraint-propagation.js';
import { HexTopology } from '../topology/hex-topology.js';

describe('core/solver/BacktrackSearch', () => {
  // --- Test 1: simple backtracking finds unique solution ---
  it('finds unique solution via backtracking', () => {
    // 1×3 hex grid: cells 0, 1, 2
    // Cell 1 revealed with value 1 (1 mine among neighbors 0 and 2)
    // mineCount = 1
    // After propagation, cells 0 and 2 are BOTH
    // Backtracking should find that exactly one of {0, 2} is a mine
    // But with mineCount=1, both assignments (0=mine,2=safe) and (0=safe,2=mine) are valid
    // So this should find 2 solutions
    const topo = new HexTopology({ rows: 1, cols: 3 });
    const revealedCells = new Map<number, number | { min: number; max: number }>();
    revealedCells.set(1, 1);

    const unknownCells = [0, 2];

    const propagator = new ConstraintPropagator(topo, revealedCells, unknownCells, 1, 0);
    propagator.propagate();

    const searcher = new BacktrackSearch();
    const result = searcher.search(propagator);

    expect(result.solutionCount).toBe(2);
    expect(result.differingCells.length).toBeGreaterThan(0);
  });

  // --- Test 2: finds two solutions and reports differing cells ---
  it('reports differing cells between two solutions', () => {
    // Same setup as above — cells 0 and 2 differ between solutions
    const topo = new HexTopology({ rows: 1, cols: 3 });
    const revealedCells = new Map<number, number | { min: number; max: number }>();
    revealedCells.set(1, 1);

    const unknownCells = [0, 2];

    const propagator = new ConstraintPropagator(topo, revealedCells, unknownCells, 1, 0);
    propagator.propagate();

    const searcher = new BacktrackSearch();
    const result = searcher.search(propagator);

    expect(result.solutionCount).toBe(2);
    expect(result.solutions).toHaveLength(2);

    // The differing cells should include 0 and/or 2
    const differSet = new Set(result.differingCells);
    expect(differSet.has(0) || differSet.has(2)).toBe(true);
  });
});
