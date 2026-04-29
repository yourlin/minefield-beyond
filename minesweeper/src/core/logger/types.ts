/**
 * Minimal logging interface for the minesweeper engine.
 *
 * Implementations may write to the browser console, a remote service,
 * or simply discard messages (useful in tests).
 */
export interface ILogger {
  /**
   * Log a warning message.
   *
   * @param message - Human-readable warning text.
   * @param context - Optional structured data for diagnostics.
   */
  warn(message: string, context?: Record<string, unknown>): void;

  /**
   * Log an error message.
   *
   * @param message - Human-readable error text.
   * @param error - Optional originating `Error` instance.
   * @param context - Optional structured data for diagnostics.
   */
  error(message: string, error?: Error, context?: Record<string, unknown>): void;
}
