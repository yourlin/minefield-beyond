import type { CellId } from '../types/index.js';
import type { Point2D } from '../types/index.js';

/**
 * Visual shape of a cell on the board.
 *
 * Used by renderers to determine how to draw each cell.
 */
export type CellShape = 'hexagon' | 'triangle' | 'rectangle' | 'polygon';

/**
 * Identifies a topology type for registry lookup.
 *
 * Each topology implementation registers itself under one of these keys.
 */
export enum TopologyType {
  Hexagonal = 'hexagonal',
  Triangle = 'triangle',
  Torus = 'torus',
  Irregular = 'irregular',
  Mixed = 'mixed',
}

/**
 * Pure logic layer for topology — provides cell enumeration and adjacency queries.
 *
 * core, solver, and verifier depend only on this interface.
 * No rendering or coordinate concepts are exposed here.
 *
 * @typeParam CellId - Unique cell identifier type (defaults to `number`).
 */
export interface ITopologyGraph<C = CellId> {
  /** Return an array of all cell IDs in this topology. */
  cells(): C[];

  /**
   * Return the neighbor cell IDs for the given cell.
   *
   * Must be O(1) — backed by a pre-computed adjacency table.
   *
   * @param cell - The cell to query.
   * @throws {TopologyError} If `cell` is not a valid ID in this topology.
   */
  neighbors(cell: C): C[];

  /** Return the total number of cells. */
  cellCount(): number;
}

/**
 * Rendering layer for topology — extends logic layer with coordinate mapping.
 *
 * game and reader use this interface to position cells on screen
 * and perform hit-testing from screen coordinates back to cells.
 *
 * @typeParam CellId - Unique cell identifier type (defaults to `number`).
 */
export interface ITopologyRenderer<C = CellId> extends ITopologyGraph<C> {
  /**
   * Return the visual shape of the given cell.
   *
   * @param cell - The cell to query.
   */
  cellShape(cell: C): CellShape;

  /**
   * Return the screen-space center point of the given cell.
   *
   * @param cell - The cell to query.
   */
  cellCenter(cell: C): Point2D;

  /**
   * Hit-test: find which cell (if any) contains the given screen coordinate.
   *
   * @param screenX - X coordinate in screen space.
   * @param screenY - Y coordinate in screen space.
   * @returns The cell ID, or `null` if no cell contains the point.
   */
  cellAt(screenX: number, screenY: number): C | null;
}

/**
 * Configuration for a hexagonal grid topology.
 */
export interface HexConfig {
  /** Number of rows in the hex grid. */
  readonly rows: number;
  /** Number of columns in the hex grid. */
  readonly cols: number;
}
