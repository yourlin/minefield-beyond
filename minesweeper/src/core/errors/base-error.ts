/**
 * Abstract base class for all domain-specific errors in the minesweeper engine.
 *
 * Every concrete error subclass must provide a unique `code` string that
 * allows programmatic identification without relying on `instanceof` across
 * module boundaries.
 */
export abstract class MinesweeperError extends Error {
  /**
   * @param message - Human-readable description of the error.
   * @param code - Machine-readable error code (e.g. `'TOPOLOGY_ERROR'`).
   */
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}
