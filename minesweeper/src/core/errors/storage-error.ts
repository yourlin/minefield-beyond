import { MinesweeperError } from './base-error.js';

/**
 * Error thrown when a storage operation fails.
 *
 * Examples: quota exceeded, corrupted save data,
 * storage backend unavailable.
 */
export class StorageError extends MinesweeperError {
  constructor(message: string) {
    super(message, 'STORAGE_ERROR');
  }
}
