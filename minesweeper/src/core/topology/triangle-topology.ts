import type { CellId, Point2D } from '../types/index.js';
import { TopologyError } from '../errors/index.js';
import type { ITopologyRenderer, CellShape } from './types.js';

/**
 * Configuration for a triangular grid topology.
 */
export interface TriangleConfig {
  /** Number of rows. */
  readonly rows: number;
  /** Number of columns. */
  readonly cols: number;
}

/** Triangle side length in logical pixels. */
const TRI_SIZE = 36;
const TRI_HEIGHT = TRI_SIZE * Math.sqrt(3) / 2;

/**
 * Triangular grid topology.
 *
 * Cells alternate between upward-pointing (▲) and downward-pointing (▽).
 * A cell at (row, col) is upward if (row + col) is even, downward if odd.
 *
 * Upward triangles share edges with 3 neighbors:
 *   - left (row, col-1), right (row, col+1), below (row+1, col)
 * Downward triangles share edges with 3 neighbors:
 *   - left (row, col-1), right (row, col+1), above (row-1, col)
 *
 * CellId = row * cols + col.
 */
export class TriangleTopology implements ITopologyRenderer {
  private readonly rows: number;
  private readonly cols: number;
  private readonly totalCells: number;
  private readonly adjacencyTable: ReadonlyArray<readonly CellId[]>;
  private readonly centers: ReadonlyArray<Readonly<Point2D>>;

  constructor(config: TriangleConfig) {
    if (
      !Number.isInteger(config.rows) || !Number.isInteger(config.cols) ||
      config.rows < 1 || config.cols < 1
    ) {
      throw new TopologyError(
        `TriangleTopology: rows and cols must be positive integers, got rows=${config.rows}, cols=${config.cols}`,
      );
    }

    this.rows = config.rows;
    this.cols = config.cols;
    this.totalCells = config.rows * config.cols;

    const centers: Point2D[] = [];
    const table: CellId[][] = [];

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        centers.push(this.computeCenter(r, c));
        table.push(this.computeNeighbors(r, c));
      }
    }

    this.centers = centers;
    this.adjacencyTable = table;
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
    return 'triangle';
  }

  cellCenter(cell: CellId): Point2D {
    this.validateCell(cell);
    return this.centers[cell];
  }

  cellAt(screenX: number, screenY: number): CellId | null {
    let bestCell: CellId | null = null;
    let bestDist = Infinity;
    for (let i = 0; i < this.totalCells; i++) {
      const c = this.centers[i];
      const dx = screenX - c.x;
      const dy = screenY - c.y;
      const dist = dx * dx + dy * dy;
      if (dist < bestDist) {
        bestDist = dist;
        bestCell = i;
      }
    }
    const maxDist = (TRI_SIZE * 0.7) ** 2;
    return bestCell !== null && bestDist <= maxDist ? bestCell : null;
  }

  private isUpward(row: number, col: number): boolean {
    return (row + col) % 2 === 0;
  }

  private computeCenter(row: number, col: number): Point2D {
    const x = col * TRI_SIZE / 2;
    const yBase = row * TRI_HEIGHT;
    const y = this.isUpward(row, col) ? yBase + TRI_HEIGHT * 2 / 3 : yBase + TRI_HEIGHT / 3;
    return { x, y };
  }

  private computeNeighbors(row: number, col: number): CellId[] {
    const result: CellId[] = [];
    const addIfValid = (r: number, c: number) => {
      if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
        result.push(r * this.cols + c);
      }
    };

    // Left and right neighbors (shared edge)
    addIfValid(row, col - 1);
    addIfValid(row, col + 1);

    // Third neighbor depends on orientation
    if (this.isUpward(row, col)) {
      addIfValid(row + 1, col); // below
    } else {
      addIfValid(row - 1, col); // above
    }

    return result;
  }

  private validateCell(cell: CellId): void {
    if (!Number.isInteger(cell) || cell < 0 || cell >= this.totalCells) {
      throw new TopologyError(
        `TriangleTopology: invalid cell ID ${cell}, expected integer in [0, ${this.totalCells - 1}]`,
      );
    }
  }
}
