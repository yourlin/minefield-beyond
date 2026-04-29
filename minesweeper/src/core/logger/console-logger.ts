import type { ILogger } from './types.js';

/**
 * Logger implementation that writes to the browser / Node console.
 *
 * This is the **only** place in `core/` where `console` usage is permitted.
 * The `no-console` ESLint rule is selectively disabled per call-site.
 */
export class ConsoleLogger implements ILogger {
  /** @inheritdoc */
  warn(message: string, context?: Record<string, unknown>): void {
    if (context) {
      // eslint-disable-next-line no-console
      console.warn(message, context);
    } else {
      // eslint-disable-next-line no-console
      console.warn(message);
    }
  }

  /** @inheritdoc */
  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    if (error && context) {
      // eslint-disable-next-line no-console
      console.error(message, error, context);
    } else if (error) {
      // eslint-disable-next-line no-console
      console.error(message, error);
    } else if (context) {
      // eslint-disable-next-line no-console
      console.error(message, context);
    } else {
      // eslint-disable-next-line no-console
      console.error(message);
    }
  }
}
