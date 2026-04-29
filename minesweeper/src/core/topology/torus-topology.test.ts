import { describe, it, expect } from 'vitest';
import { TorusTopology } from './torus-topology.js';

describe('core/topology/TorusTopology', () => {
  it('creates correct number of cells', () => {
    const topo = new TorusTopology({ rows: 4, cols: 5 });
    expect(topo.cellCount()).toBe(20);
  });

  it('every cell has exactly 8 neighbors', () => {
    const topo = new TorusTopology({ rows: 4, cols: 5 });
    for (const cell of topo.cells()) {
      expect(topo.neighbors(cell)).toHaveLength(8);
    }
  });

  it('wrap-around: top-left corner connects to bottom-right', () => {
    const topo = new TorusTopology({ rows: 4, cols: 5 });
    // Cell (0,0) should have neighbor (3,4) — bottom-right corner via wrap
    const neighbors = topo.neighbors(0);
    const bottomRight = 3 * 5 + 4;
    expect(neighbors).toContain(bottomRight);
  });

  it('wrap-around: bottom-right connects to top-left', () => {
    const topo = new TorusTopology({ rows: 4, cols: 5 });
    const bottomRight = 3 * 5 + 4;
    const neighbors = topo.neighbors(bottomRight);
    expect(neighbors).toContain(0);
  });

  it('adjacency is symmetric', () => {
    const topo = new TorusTopology({ rows: 3, cols: 3 });
    for (const cell of topo.cells()) {
      for (const neighbor of topo.neighbors(cell)) {
        expect(topo.neighbors(neighbor)).toContain(cell);
      }
    }
  });

  it('cellShape returns rectangle', () => {
    const topo = new TorusTopology({ rows: 2, cols: 2 });
    expect(topo.cellShape(0)).toBe('rectangle');
  });

  it('throws on invalid config (rows < 2)', () => {
    expect(() => new TorusTopology({ rows: 1, cols: 3 })).toThrow();
  });
});
