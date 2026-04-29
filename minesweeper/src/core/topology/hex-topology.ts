import type { CellId, Point2D } from '../types/index.js';
import { TopologyError } from '../errors/index.js';
import type { ITopologyRenderer, CellShape, HexConfig } from './types.js';

/**
 * Hex neighbor offsets for **pointy-top, odd-r offset** coordinates.
 *
 * Even rows and odd rows have different column offsets because
 * odd rows are shifted half a hex-width to the right.
 */
const EVEN_ROW_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [+1, 0],
  [-1, 0],
  [0, -1],
  [-1, -1],
  [0, +1],
  [-1, +1],
];

const ODD_ROW_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [+1, 0],
  [-1, 0],
  [0, -1],
  [+1, -1],
  [0, +1],
  [+1, +1],
];

/** Default hex side length in logical pixels. */
const DEFAULT_HEX_SIZE = 30;

/**
 * Hexagonal grid topology using **pointy-top, odd-r offset** coordinates.
 *
 * Cells are laid out in a rectangular grid of `rows × cols`.
 * Each cell has up to 6 neighbors. Edge and corner cells have fewer.
 *
 * CellId mapping: `cellId = row * cols + col`.
 *
 * Adjacency is pre-computed at construction time for O(1) neighbor queries.
 */
export class HexTopology implements ITopologyRenderer {
  private readonly rows: number;
  private readonly cols: number;
  private readonly totalCells: number;
  private readonly adjacencyTable: ReadonlyArray<readonly CellId[]>;
  private readonly centers: ReadonlyArray<Readonly<Point2D>>;
  private readonly hexWidth: number;
  private readonly hexHeight: number;

  /**
   * Create a new hexagonal grid topology.
   *
   * @param config - Grid dimensions (rows and cols must be positive integers).
   * @throws {TopologyError} If rows or cols are not positive integers.
   */
  constructor(config: HexConfig) {
    if (
      !Number.isInteger(config.rows) ||
      !Number.isInteger(config.cols) ||
      config.rows < 1 ||
      config.cols < 1
    ) {
      throw new TopologyError(
        `HexTopology: rows and cols must be positive integers, got rows=${config.rows}, cols=${config.cols}`,
      );
    }

    this.rows = config.rows;
    this.cols = config.cols;
    this.totalCells = config.rows * config.cols;

    // Pointy-top hex geometry
    this.hexWidth = Math.sqrt(3) * DEFAULT_HEX_SIZE;
    this.hexHeight = 2 * DEFAULT_HEX_SIZE;

    // Pre-compute centers
    const centers: Point2D[] = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        centers.push(this.computeCenter(r, c));
      }
    }
    this.centers = centers;

    // Pre-compute adjacency table
    const table: CellId[][] = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        table.push(this.computeNeighbors(r, c));
      }
    }
    this.adjacencyTable = table;
  }

  /** @inheritdoc */
  cells(): CellId[] {
    const result: CellId[] = [];
    for (let i = 0; i < this.totalCells; i++) {
      result.push(i);
    }
    return result;
  }

  /** @inheritdoc */
  neighbors(cell: CellId): CellId[] {
    this.validateCell(cell);
    return [...this.adjacencyTable[cell]];
  }

  /** @inheritdoc */
  cellCount(): number {
    return this.totalCells;
  }

  /** @inheritdoc */
  cellShape(cell: CellId): CellShape {
    this.validateCell(cell);
    return 'hexagon';
  }

  /** @inheritdoc */
  cellCenter(cell: CellId): Point2D {
    this.validateCell(cell);
    return this.centers[cell];
  }

  /** @inheritdoc */
  cellAt(screenX: number, screenY: number): CellId | null {
    // Find the closest cell center to the given screen point
    let bestCell: CellId | null = null;
    let bestDist = Infinity;

    for (let i = 0; i < this.totalCells; i++) {
      const center = this.centers[i];
      const dx = screenX - center.x;
      const dy = screenY - center.y;
      const dist = dx * dx + dy * dy;
      if (dist < bestDist) {
        bestDist = dist;
        bestCell = i;
      }
    }

    // Check if the closest cell is within the hex boundary
    // For pointy-top hex, the circumradius (vertex distance) is DEFAULT_HEX_SIZE
    const circumRadiusSq = DEFAULT_HEX_SIZE * DEFAULT_HEX_SIZE;
    if (bestCell !== null && bestDist <= circumRadiusSq) {
      return bestCell;
    }

    return null;
  }

  /**
   * Validate that a cell ID is within bounds.
   *
   * @throws {TopologyError} If the cell ID is invalid.
   */
  private validateCell(cell: CellId): void {
    if (!Number.isInteger(cell) || cell < 0 || cell >= this.totalCells) {
      throw new TopologyError(
        `HexTopology: invalid cell ID ${cell}, expected integer in [0, ${this.totalCells - 1}]`,
      );
    }
  }

  /**
   * Compute the screen-space center of a cell at grid position (row, col).
   */
  private computeCenter(row: number, col: number): Point2D {
    const x = col * this.hexWidth + (row % 2 === 1 ? this.hexWidth / 2 : 0);
    const y = row * this.hexHeight * 0.75;
    return { x, y };
  }

  /**
   * Compute neighbor CellIds for a cell at grid position (row, col).
   */
  private computeNeighbors(row: number, col: number): CellId[] {
    const offsets = row % 2 === 0 ? EVEN_ROW_OFFSETS : ODD_ROW_OFFSETS;
    const result: CellId[] = [];

    for (const [dc, dr] of offsets) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
        result.push(nr * this.cols + nc);
      }
    }

    return result;
  }
}
