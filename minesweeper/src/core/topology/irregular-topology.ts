import type { CellId, Point2D } from '../types/index.js';
import { TopologyError } from '../errors/index.js';
import type { ITopologyRenderer, CellShape } from './types.js';

/**
 * Configuration for an irregular topology — fully custom adjacency and positions.
 */
export interface IrregularConfig {
  /** Cell positions (screen coordinates). */
  readonly positions: ReadonlyArray<Readonly<Point2D>>;
  /** Adjacency list: index i → array of neighbor cell IDs. */
  readonly adjacency: ReadonlyArray<readonly number[]>;
}

/**
 * Irregular topology with arbitrary cell positions and adjacency.
 *
 * Used for non-standard board layouts where cells have variable
 * numbers of neighbors and arbitrary positions.
 */
export class IrregularTopology implements ITopologyRenderer {
  private readonly positions: ReadonlyArray<Readonly<Point2D>>;
  private readonly adjacencyTable: ReadonlyArray<readonly CellId[]>;
  private readonly totalCells: number;

  constructor(config: IrregularConfig) {
    if (config.positions.length === 0) {
      throw new TopologyError('IrregularTopology: must have at least 1 cell');
    }
    if (config.positions.length !== config.adjacency.length) {
      throw new TopologyError(
        `IrregularTopology: positions (${config.positions.length}) and adjacency (${config.adjacency.length}) must have same length`,
      );
    }

    this.positions = config.positions;
    this.adjacencyTable = config.adjacency;
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

  cellShape(_cell: CellId): CellShape {
    return 'polygon';
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
    const maxDist = 900; // 30px radius
    return bestCell !== null && bestDist <= maxDist ? bestCell : null;
  }

  private validateCell(cell: CellId): void {
    if (!Number.isInteger(cell) || cell < 0 || cell >= this.totalCells) {
      throw new TopologyError(
        `IrregularTopology: invalid cell ID ${cell}, expected integer in [0, ${this.totalCells - 1}]`,
      );
    }
  }
}
