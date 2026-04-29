import type { LevelData } from '../types/index.js';
import type { ValidationResult } from '../types/index.js';

/**
 * Codec interface for encoding and decoding level data.
 *
 * Implementations handle a specific serialization format
 * (e.g. binary `.mswp` or human-readable JSON).
 */
export interface ILevelCodec {
  /**
   * Serialize a level to a binary buffer.
   *
   * @param level - The level data to encode.
   * @returns An ArrayBuffer containing the serialized level.
   */
  encode(level: LevelData): ArrayBuffer;

  /**
   * Deserialize a level from a binary buffer.
   *
   * @param buffer - The buffer to decode.
   * @returns The deserialized level data.
   * @throws {LevelLoadError} If the buffer contains invalid data.
   */
  decode(buffer: ArrayBuffer): LevelData;

  /**
   * Validate a buffer without fully decoding it.
   *
   * Returns a result object instead of throwing, allowing callers
   * to inspect errors without exception handling.
   *
   * @param buffer - The buffer to validate.
   * @returns Validation result with `valid` flag and error messages.
   */
  validate(buffer: ArrayBuffer): ValidationResult;
}
