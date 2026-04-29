import { MinesweeperError } from './base-error.js';

/**
 * Error thrown when loading or parsing a level file fails.
 *
 * Examples: corrupted binary data, unsupported format version,
 * missing required fields.
 */
export class LevelLoadError extends MinesweeperError {
  constructor(message: string) {
    super(message, 'LEVEL_LOAD_ERROR');
  }
}
