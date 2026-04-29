import { describe, it, expect } from 'vitest';
import { ConstraintPropagator, SAFE } from './constraint-propagation.js';
import { HexTopology } from '../topology/hex-topology.js';

describe('core/solver/ConstraintPropagator', () => {
  // --- Test 1: exact number constraint — center cell 0 means all neighbors safe ---
  it('propagates exact 0 constraint: all neighbors marked safe', () => {
    const topo = new HexTopology({ rows: 3, cols: 3 });
    // Cell 4 is center of 3×3, has 6 neighbors
    const revealedCells = new Map<number, number | { min: number; max: number }>();
    revealedCells.set(4, 0); // center cell has 0 mines around it

    const allCells = topo.cells();
    const unknownCells = allCells.filter((c) => c !== 4);

    const propagator = new ConstraintPropagator(topo, revealedCells, unknownCells, 0, 0);
    const result = propagator.propagate();

    expect(result.contradiction).toBe(false);

    // All neighbors of cell 4 should be SAFE
    const neighbors = topo.neighbors(4);
    for (const n of neighbors) {
      expect(propagator.getDomain(n)).toBe(SAFE);
    }
  });

  // --- Test 2: FuzzyHint constraint propagation ---
  it('propagates FuzzyHint range constraint', () => {
    const topo = new HexTopology({ rows: 3, cols: 3 });
    // Cell 4 (center) has fuzzy hint {min: 2, max: 2} — exactly 2 mines among 6 neighbors
    // Cell 0 (corner) has exact 0 — its neighbors are safe
    const revealedCells = new Map<number, number | { min: number; max: number }>();
    revealedCells.set(4, { min: 2, max: 2 });
    revealedCells.set(0, 0);

    const allCells = topo.cells();
    const unknownCells = allCells.filter((c) => !revealedCells.has(c));

    const propagator = new ConstraintPropagator(topo, revealedCells, unknownCells, 2, 0);
    const result = propagator.propagate();

    expect(result.contradiction).toBe(false);

    // Neighbors of cell 0 should be SAFE
    const neighbors0 = topo.neighbors(0);
    for (const n of neighbors0) {
      if (!revealedCells.has(n)) {
        expect(propagator.getDomain(n)).toBe(SAFE);
      }
    }
  });

  // --- Test 3: contradiction detection ---
  it('detects contradiction when constraints are impossible', () => {
    const topo = new HexTopology({ rows: 1, cols: 2 });
    // 2 cells: 0 and 1, they are neighbors
    // Cell 0 revealed with value 1 (1 mine among neighbors)
    // Cell 1 is unknown
    // But mineCount = 0 — contradiction
    const revealedCells = new Map<number, number | { min: number; max: number }>();
    revealedCells.set(0, 1);

    const unknownCells = [1];

    const propagator = new ConstraintPropagator(topo, revealedCells, unknownCells, 0, 0);
    const result = propagator.propagate();

    // Should detect contradiction: cell 0 says 1 mine, but global says 0 mines
    expect(result.contradiction).toBe(true);
  });

  // --- Test 4: cascading propagation ---
  it('cascades propagation when a cell is determined', () => {
    const topo = new HexTopology({ rows: 3, cols: 3 });
    // Cell 0 (corner, ~2 neighbors) has exact 1
    // Cell 1 (edge, ~3 neighbors) has exact 0 — its neighbors are safe
    // This should cascade: cell 1's neighbors become safe, which may
    // help resolve cell 0's constraint
    const revealedCells = new Map<number, number | { min: number; max: number }>();
    revealedCells.set(1, 0); // all neighbors of cell 1 are safe

    const allCells = topo.cells();
    const unknownCells = allCells.filter((c) => !revealedCells.has(c));

    const propagator = new ConstraintPropagator(topo, revealedCells, unknownCells, 0, 0);
    const result = propagator.propagate();

    expect(result.contradiction).toBe(false);

    // Neighbors of cell 1 should be SAFE
    const neighbors1 = topo.neighbors(1);
    for (const n of neighbors1) {
      if (!revealedCells.has(n)) {
        expect(propagator.getDomain(n)).toBe(SAFE);
      }
    }
  });
});
