import type { CellId, Point2D } from '../types/index.js';
import { TopologyError } from '../errors/index.js';
import type { ITopologyRenderer, CellShape } from './types.js';

/**
 * Configuration for a mixed topology — combines multiple topology regions.
 *
 * Same structure as IrregularConfig but with per-cell shape info.
 */
export interface MixedConfig {
  /** Cell positions (screen coordinates). */
  readonly positions: ReadonlyArray<Readonly<Point2D>>;
  /** Adjacency list: index i → array of neighbor cell IDs. */
  readonly adjacency: ReadonlyArray<readonly number[]>;
  /** Per-cell shape. */
  readonly shapes: ReadonlyArray<CellShape>;
}

/**
 * Mixed topology — combines cells of different shapes in one board.
 *
 * Seam adjacency (connections between different topology regions)
 * is defined explicitly in the adjacency list.
 */
export class MixedTopology implements ITopologyRenderer {
  private readonly positions: ReadonlyArray<Readonly<Point2D>>;
  private readonly adjacencyTable: ReadonlyArray<readonly CellId[]>;
  private readonly shapeTable: ReadonlyArray<CellShape>;
  private readonly totalCells: number;

  constructor(config: MixedConfig) {
    if (config.positions.length === 0) {
      throw new TopologyError('MixedTopology: must have at least 1 cell');
    }
    if (
      config.positions.length !== config.adjacency.length ||
      config.positions.length !== config.shapes.length
    ) {
      throw new TopologyError('MixedTopology: positions, adjacency, and shapes must have same length');
    }

    this.positions = config.positions;
    this.adjacencyTable = config.adjacency;
    this.shapeTable = config.shapes;
    this.totalCells = config.positions.length;
  }

  cells(): CellId[] {
    return Array.from({ length: this.totalCells }, (_, i) => i);
  }

  neighbors(cell: CellId): CellId[] {
    this.validateCell(cell);
    return [...this.adjacencyTable[cell]];
  }

  cellCount(): number {
    return this.totalCells;
  }

  cellShape(cell: CellId): CellShape {
    this.validateCell(cell);
    return this.shapeTable[cell];
  }

  cellCenter(cell: CellId): Point2D {
    this.validateCell(cell);
    return this.positions[cell];
  }

  cellAt(screenX: number, screenY: number): CellId | null {
    let bestCell: CellId | null = null;
    let bestDist = Infinity;
    for (let i = 0; i < this.totalCells; i++) {
      const p = this.positions[i];
      const dx = screenX - p.x;
      const dy = screenY - p.y;
      const dist = dx * dx + dy * dy;
      if (dist < bestDist) {
        bestDist = dist;
        bestCell = i;
      }
    }
    const maxDist = 900;
    return bestCell !== null && bestDist <= maxDist ? bestCell : null;
  }

  private validateCell(cell: CellId): void {
    if (!Number.isInteger(cell) || cell < 0 || cell >= this.totalCells) {
      throw new TopologyError(
        `MixedTopology: invalid cell ID ${cell}, expected integer in [0, ${this.totalCells - 1}]`,
      );
    }
  }
}
