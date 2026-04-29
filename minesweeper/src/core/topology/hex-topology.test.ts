import { describe, it, expect } from 'vitest';
import { HexTopology } from './hex-topology.js';
import { TopologyError } from '../errors/index.js';

describe('core/topology/HexTopology', () => {
  const grid5x5 = new HexTopology({ rows: 5, cols: 5 });

  // --- Task 5, Test 1: center cell has 6 neighbors ---
  it('center cell of 5×5 grid has 6 neighbors', () => {
    // Cell at row=2, col=2 → cellId = 2*5+2 = 12
    const neighbors = grid5x5.neighbors(12);
    expect(neighbors).toHaveLength(6);
  });

  // --- Task 5, Test 2: edge cell has < 6 neighbors ---
  it('edge cell (non-corner) has fewer than 6 neighbors', () => {
    // Cell at row=0, col=2 → cellId = 0*5+2 = 2 (top edge, middle)
    const neighbors = grid5x5.neighbors(2);
    expect(neighbors.length).toBeLessThan(6);
    expect(neighbors.length).toBeGreaterThanOrEqual(2);
  });

  // --- Task 5, Test 3: corner cell has 2 or 3 neighbors ---
  it('corner cells have 2 or 3 neighbors', () => {
    // Top-left: row=0, col=0 → cellId=0
    const topLeft = grid5x5.neighbors(0);
    expect(topLeft.length).toBeLessThanOrEqual(3);
    expect(topLeft.length).toBeGreaterThanOrEqual(2);

    // Top-right: row=0, col=4 → cellId=4
    const topRight = grid5x5.neighbors(4);
    expect(topRight.length).toBeLessThanOrEqual(3);
    expect(topRight.length).toBeGreaterThanOrEqual(2);

    // Bottom-left: row=4, col=0 → cellId=20
    const bottomLeft = grid5x5.neighbors(20);
    expect(bottomLeft.length).toBeLessThanOrEqual(3);
    expect(bottomLeft.length).toBeGreaterThanOrEqual(2);

    // Bottom-right: row=4, col=4 → cellId=24
    const bottomRight = grid5x5.neighbors(24);
    expect(bottomRight.length).toBeLessThanOrEqual(3);
    expect(bottomRight.length).toBeGreaterThanOrEqual(2);
  });

  // --- Task 5, Test 4: adjacency symmetry ---
  it('adjacency is symmetric: if A neighbors B then B neighbors A', () => {
    const allCells = grid5x5.cells();
    for (const cell of allCells) {
      const neighbors = grid5x5.neighbors(cell);
      for (const neighbor of neighbors) {
        const reverseNeighbors = grid5x5.neighbors(neighbor);
        expect(reverseNeighbors).toContain(cell);
      }
    }
  });

  // --- Task 5, Test 5: cellCount ---
  it('cellCount() returns rows * cols', () => {
    expect(grid5x5.cellCount()).toBe(25);
    const grid3x4 = new HexTopology({ rows: 3, cols: 4 });
    expect(grid3x4.cellCount()).toBe(12);
  });

  // --- Task 5, Test 6: cells() returns correct unique IDs ---
  it('cells() returns correct number of unique CellIds', () => {
    const allCells = grid5x5.cells();
    expect(allCells).toHaveLength(25);
    const unique = new Set(allCells);
    expect(unique.size).toBe(25);
    // All IDs should be in [0, 24]
    for (const cell of allCells) {
      expect(cell).toBeGreaterThanOrEqual(0);
      expect(cell).toBeLessThan(25);
    }
  });

  // --- Task 5, Test 7: neighbors() throws on invalid cell ---
  it('neighbors() throws TopologyError for invalid cell ID', () => {
    expect(() => grid5x5.neighbors(-1)).toThrow(TopologyError);
    expect(() => grid5x5.neighbors(25)).toThrow(TopologyError);
    expect(() => grid5x5.neighbors(1.5)).toThrow(TopologyError);
    expect(() => grid5x5.neighbors(NaN)).toThrow(TopologyError);
  });

  // --- Task 5, Test 8: cellShape ---
  it('cellShape() returns "hexagon" for all cells', () => {
    for (const cell of grid5x5.cells()) {
      expect(grid5x5.cellShape(cell)).toBe('hexagon');
    }
  });

  // --- Task 5, Test 9: cellCenter returns reasonable Point2D ---
  it('cellCenter() returns Point2D with non-negative coordinates', () => {
    for (const cell of grid5x5.cells()) {
      const center = grid5x5.cellCenter(cell);
      expect(center.x).toBeGreaterThanOrEqual(0);
      expect(center.y).toBeGreaterThanOrEqual(0);
      expect(typeof center.x).toBe('number');
      expect(typeof center.y).toBe('number');
    }
  });

  // --- Task 5, Test 10: cellAt round-trips with cellCenter ---
  it('cellAt() returns correct cell for cellCenter coordinates', () => {
    for (const cell of grid5x5.cells()) {
      const center = grid5x5.cellCenter(cell);
      const found = grid5x5.cellAt(center.x, center.y);
      expect(found).toBe(cell);
    }
  });

  // --- Additional edge cases ---
  it('cellAt() returns null for coordinates far outside the grid', () => {
    const result = grid5x5.cellAt(-1000, -1000);
    expect(result).toBeNull();
  });

  it('constructor throws on invalid config', () => {
    expect(() => new HexTopology({ rows: 0, cols: 5 })).toThrow(TopologyError);
    expect(() => new HexTopology({ rows: 5, cols: -1 })).toThrow(TopologyError);
    expect(() => new HexTopology({ rows: 1.5, cols: 3 })).toThrow(TopologyError);
  });

  it('1×1 grid has a single cell with 0 neighbors', () => {
    const tiny = new HexTopology({ rows: 1, cols: 1 });
    expect(tiny.cellCount()).toBe(1);
    expect(tiny.cells()).toEqual([0]);
    expect(tiny.neighbors(0)).toEqual([]);
  });

  // --- Review patch: 1×N and N×1 grids ---
  it('1×5 single-row grid has correct adjacency', () => {
    const row = new HexTopology({ rows: 1, cols: 5 });
    expect(row.cellCount()).toBe(5);
    // In a single row (row 0, even), neighbors are only left/right
    expect(row.neighbors(0)).toHaveLength(1); // only right neighbor
    expect(row.neighbors(2)).toHaveLength(2); // left and right
    expect(row.neighbors(4)).toHaveLength(1); // only left neighbor
    // Symmetry still holds
    for (const cell of row.cells()) {
      for (const n of row.neighbors(cell)) {
        expect(row.neighbors(n)).toContain(cell);
      }
    }
  });

  it('5×1 single-column grid has correct adjacency', () => {
    const col = new HexTopology({ rows: 5, cols: 1 });
    expect(col.cellCount()).toBe(5);
    // Symmetry holds
    for (const cell of col.cells()) {
      for (const n of col.neighbors(cell)) {
        expect(col.neighbors(n)).toContain(cell);
      }
    }
  });

  // --- Review patch: exact neighbor set verification ---
  it('known cell has exact expected neighbors (3×3 grid, center)', () => {
    const grid3x3 = new HexTopology({ rows: 3, cols: 3 });
    // Center cell: row=1, col=1 → cellId = 1*3+1 = 4 (odd row)
    const neighbors = grid3x3.neighbors(4);
    expect(neighbors).toHaveLength(6);
    // For odd row (row=1), col=1, ODD_ROW_OFFSETS applied:
    // [+1,0]→(1,2)=5, [-1,0]→(1,0)=3, [0,-1]→(0,1)=1, [+1,-1]→(0,2)=2, [0,+1]→(2,1)=7, [+1,+1]→(2,2)=8
    const expected = new Set([5, 3, 1, 2, 7, 8]);
    expect(new Set(neighbors)).toEqual(expected);
  });

  // --- Review patch: cellAt boundary test ---
  it('cellAt() returns correct cell near hex boundary between two cells', () => {
    const grid = new HexTopology({ rows: 3, cols: 3 });
    // Get centers of two adjacent cells
    const center0 = grid.cellCenter(0); // row=0, col=0
    const center1 = grid.cellCenter(1); // row=0, col=1
    // Midpoint between them — should resolve to one of the two
    const midX = (center0.x + center1.x) / 2;
    const midY = (center0.y + center1.y) / 2;
    const result = grid.cellAt(midX, midY);
    expect(result === 0 || result === 1).toBe(true);
  });

  it('cellAt() does not return null for points near hex edges', () => {
    const grid = new HexTopology({ rows: 3, cols: 3 });
    // Test a point slightly offset from center — should still hit the cell
    const center = grid.cellCenter(4); // center cell
    const result = grid.cellAt(center.x + 20, center.y + 10);
    // Should hit some cell (center or neighbor), not null
    expect(result).not.toBeNull();
  });
});
