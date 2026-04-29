import type { CellId, Point2D } from '../types/index.js';
import { TopologyError } from '../errors/index.js';
import type { ITopologyRenderer, CellShape } from './types.js';

/**
 * Configuration for a torus (wrap-around rectangular grid) topology.
 */
export interface TorusConfig {
  /** Number of rows. */
  readonly rows: number;
  /** Number of columns. */
  readonly cols: number;
}

/** Cell size in logical pixels. */
const CELL_SIZE = 40;

/**
 * Torus topology — rectangular grid where edges wrap around.
 *
 * Top edge connects to bottom edge, left edge connects to right edge.
 * Every cell has exactly 8 neighbors (Moore neighborhood with wrapping).
 *
 * CellId = row * cols + col.
 */
export class TorusTopology implements ITopologyRenderer {
  private readonly rows: number;
  private readonly cols: number;
  private readonly totalCells: number;
  private readonly adjacencyTable: ReadonlyArray<readonly CellId[]>;
  private readonly centers: ReadonlyArray<Readonly<Point2D>>;

  constructor(config: TorusConfig) {
    if (
      !Number.isInteger(config.rows) || !Number.isInteger(config.cols) ||
      config.rows < 2 || config.cols < 2
    ) {
      throw new TopologyError(
        `TorusTopology: rows and cols must be integers >= 2, got rows=${config.rows}, cols=${config.cols}`,
      );
    }

    this.rows = config.rows;
    this.cols = config.cols;
    this.totalCells = config.rows * config.cols;

    const centers: Point2D[] = [];
    const table: CellId[][] = [];

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        centers.push({ x: c * CELL_SIZE, y: r * CELL_SIZE });
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
    return 'rectangle';
  }

  cellCenter(cell: CellId): Point2D {
    this.validateCell(cell);
    return this.centers[cell];
  }

  cellAt(screenX: number, screenY: number): CellId | null {
    const col = Math.round(screenX / CELL_SIZE);
    const row = Math.round(screenY / CELL_SIZE);
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return null;
    const dx = screenX - col * CELL_SIZE;
    const dy = screenY - row * CELL_SIZE;
    if (Math.abs(dx) > CELL_SIZE / 2 || Math.abs(dy) > CELL_SIZE / 2) return null;
    return row * this.cols + col;
  }

  /**
   * Compute 8 neighbors with wrap-around (Moore neighborhood on torus).
   */
  private computeNeighbors(row: number, col: number): CellId[] {
    const result: CellId[] = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = ((row + dr) % this.rows + this.rows) % this.rows;
        const nc = ((col + dc) % this.cols + this.cols) % this.cols;
        result.push(nr * this.cols + nc);
      }
    }
    return result;
  }

  private validateCell(cell: CellId): void {
    if (!Number.isInteger(cell) || cell < 0 || cell >= this.totalCells) {
      throw new TopologyError(
        `TorusTopology: invalid cell ID ${cell}, expected integer in [0, ${this.totalCells - 1}]`,
      );
    }
  }
}
