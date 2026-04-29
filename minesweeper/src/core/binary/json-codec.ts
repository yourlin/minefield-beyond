import type { ILevelCodec } from './codec-types.js';
import type { LevelData, ValidationResult } from '../types/index.js';
import { LevelLoadError } from '../errors/level-load-error.js';

/**
 * Human-readable JSON codec for level data.
 *
 * Intended for development and debugging — produces readable output
 * at the cost of larger file sizes compared to `BinaryLevelCodec`.
 *
 * Since `LevelData` uses plain objects and arrays (no Map/Set),
 * JSON serialization is straightforward.
 */
export class JsonLevelCodec implements ILevelCodec {
  /**
   * Serialize a level to a JSON-encoded ArrayBuffer.
   *
   * @param level - The level data to encode.
   * @returns An ArrayBuffer containing the UTF-8 JSON string.
   */
  encode(level: LevelData): ArrayBuffer {
    const json = JSON.stringify(level);
    const encoded = new TextEncoder().encode(json);
    return encoded.buffer.slice(
      encoded.byteOffset,
      encoded.byteOffset + encoded.byteLength,
    );
  }

  /**
   * Deserialize a level from a JSON-encoded ArrayBuffer.
   *
   * @param buffer - The buffer to decode.
   * @returns The deserialized level data.
   * @throws {LevelLoadError} If the buffer contains invalid JSON or missing fields.
   */
  decode(buffer: ArrayBuffer): LevelData {
    const { valid, errors, parsed } = this.validateInternal(buffer);
    if (!valid || !parsed) {
      throw new LevelLoadError(
        `Invalid JSON level data: ${errors.join('; ')}`,
      );
    }
    return parsed as LevelData;
  }

  /**
   * Validate a JSON buffer without fully constructing the level.
   *
   * Checks that the buffer contains valid JSON with the required
   * top-level fields and correct types.
   *
   * @param buffer - The buffer to validate.
   * @returns Validation result with `valid` flag and error messages.
   */
  validate(buffer: ArrayBuffer): ValidationResult {
    const { valid, errors } = this.validateInternal(buffer);
    return { valid, errors };
  }

  /**
   * Internal validation that also returns the parsed object to avoid
   * double-parsing in `decode()`.
   */
  private validateInternal(buffer: ArrayBuffer): {
    valid: boolean;
    errors: string[];
    parsed: unknown;
  } {
    const errors: string[] = [];

    let text: string;
    try {
      text = new TextDecoder().decode(buffer);
    } catch {
      errors.push('Buffer is not valid UTF-8');
      return { valid: false, errors, parsed: null };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      errors.push('Buffer does not contain valid JSON');
      return { valid: false, errors, parsed: null };
    }

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      errors.push('JSON root must be an object');
      return { valid: false, errors, parsed: null };
    }

    const obj = parsed as Record<string, unknown>;

    const requiredFields = [
      'metadata',
      'topologyType',
      'topologyConfig',
      'cells',
      'adjacency',
      'minePositions',
      'mechanismConfigs',
    ];

    for (const field of requiredFields) {
      if (!(field in obj)) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors, parsed: null };
    }

    // Validate metadata sub-fields
    if (
      typeof obj.metadata !== 'object' ||
      obj.metadata === null ||
      Array.isArray(obj.metadata)
    ) {
      errors.push('metadata must be a plain object');
    } else {
      const meta = obj.metadata as Record<string, unknown>;
      if (typeof meta.name !== 'string') {
        errors.push('metadata.name must be a string');
      }
      if (typeof meta.author !== 'string') {
        errors.push('metadata.author must be a string');
      }
      if (typeof meta.difficulty !== 'number') {
        errors.push('metadata.difficulty must be a number');
      }
    }

    // Validate field types
    if (typeof obj.topologyType !== 'string') {
      errors.push('topologyType must be a string');
    }
    if (
      typeof obj.topologyConfig !== 'object' ||
      obj.topologyConfig === null ||
      Array.isArray(obj.topologyConfig)
    ) {
      errors.push('topologyConfig must be a plain object');
    }
    if (!Array.isArray(obj.cells)) {
      errors.push('cells must be an array');
    }
    if (
      typeof obj.adjacency !== 'object' ||
      obj.adjacency === null ||
      Array.isArray(obj.adjacency)
    ) {
      errors.push('adjacency must be a plain object');
    }
    if (!Array.isArray(obj.minePositions)) {
      errors.push('minePositions must be an array');
    }
    if (!Array.isArray(obj.mechanismConfigs)) {
      errors.push('mechanismConfigs must be an array');
    }

    return { valid: errors.length === 0, errors, parsed: errors.length === 0 ? parsed : null };
  }
}
