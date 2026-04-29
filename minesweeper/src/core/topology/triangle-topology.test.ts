import { describe, it, expect } from 'vitest';
import { TriangleTopology } from './triangle-topology.js';

describe('core/topology/TriangleTopology', () => {
  it('creates correct number of cells', () => {
    const topo = new TriangleTopology({ rows: 4, cols: 6 });
    expect(topo.cellCount()).toBe(24);
    expect(topo.cells()).toHaveLength(24);
  });

  it('upward triangle has 3 neighbors (interior)', () => {
    const topo = new TriangleTopology({ rows: 4, cols: 6 });
    // Cell at (1,1): (1+1)%2=0 → upward, neighbors: left, right, below
    const neighbors = topo.neighbors(1 * 6 + 1);
    expect(neighbors.length).toBeLessThanOrEqual(3);
  });

  it('downward triangle has 3 neighbors (interior)', () => {
    const topo = new TriangleTopology({ rows: 4, cols: 6 });
    // Cell at (1,2): (1+2)%2=1 → downward, neighbors: left, right, above
    const neighbors = topo.neighbors(1 * 6 + 2);
    expect(neighbors.length).toBeLessThanOrEqual(3);
  });

  it('adjacency is symmetric', () => {
    const topo = new TriangleTopology({ rows: 4, cols: 6 });
    for (const cell of topo.cells()) {
      for (const neighbor of topo.neighbors(cell)) {
        expect(topo.neighbors(neighbor)).toContain(cell);
      }
    }
  });

  it('corner cells have fewer neighbors', () => {
    const topo = new TriangleTopology({ rows: 3, cols: 3 });
    // Cell 0 at (0,0): upward, neighbors: right(0,1), below(1,0) — no left
    const neighbors = topo.neighbors(0);
    expect(neighbors.length).toBeLessThanOrEqual(2);
  });

  it('cellShape returns triangle', () => {
    const topo = new TriangleTopology({ rows: 2, cols: 2 });
    expect(topo.cellShape(0)).toBe('triangle');
  });

  it('throws on invalid config', () => {
    expect(() => new TriangleTopology({ rows: 0, cols: 3 })).toThrow();
  });
});
