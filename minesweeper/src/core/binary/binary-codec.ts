import type { ILevelCodec } from './codec-types.js';
import type { LevelData, ValidationResult, LevelMechanismEntry } from '../types/index.js';
import { TopologyType } from '../topology/types.js';
import { MechanismType } from '../mechanism/types.js';
import type { MechanismConfig } from '../mechanism/types.js';
import { LevelLoadError } from '../errors/level-load-error.js';
import { MAGIC_NUMBER, VERSION_BYTE } from './constants.js';

/**
 * Ordered list of TopologyType values for binary index mapping.
 * The index in this array is the byte value stored in the binary format.
 */
const TOPOLOGY_INDEX: readonly TopologyType[] = [
  TopologyType.Hexagonal,
  TopologyType.Triangle,
  TopologyType.Torus,
  TopologyType.Irregular,
  TopologyType.Mixed,
];

/**
 * Ordered list of serializable MechanismType values for binary index mapping.
 * The index in this array is the byte value stored in the binary format.
 *
 * `MechanismType.None` is excluded — it represents the absence of a mechanism
 * and never appears in `LevelData.mechanismConfigs`.
 */
const MECHANISM_INDEX: readonly MechanismType[] = [
  MechanismType.FuzzyHint,
  MechanismType.DelayedReveal,
];

/** Maximum byte length for a Uint16-encoded string or count. */
const MAX_UINT16 = 0xffff;

/**
 * Minimum valid binary file size: 4 (magic) + 1 (version) = 5 bytes.
 */
const MIN_HEADER_SIZE = 5;

/**
 * Encode a UTF-8 string into a Uint8Array.
 */
function encodeString(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * Decode a UTF-8 string from a Uint8Array slice.
 */
function decodeString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

/**
 * Binary level codec using DataView for reading/writing `.mswp` files.
 *
 * Format layout (all multi-byte integers are big-endian):
 *
 * ```
 * Header:   [4B magic "MSWP"] [1B version]
 * Metadata: [2B nameLen] [nB name] [2B authorLen] [nB author] [1B difficulty]
 * Topology: [1B type] [2B configCount] [per entry: 2B keyLen + nB key + 4B value]
 * Cells:    [4B count] [per cell: 4B id]
 * Adjacency:[per cell: 2B neighborCount + per neighbor: 4B id]
 * Mines:    [4B count] [per mine: 4B id]
 * Mechanisms:[4B count] [per mech: 4B cellId + 1B type + variable config]
 * ```
 */
export class BinaryLevelCodec implements ILevelCodec {
  /**
   * Serialize a level to a binary `.mswp` buffer.
   *
   * @param level - The level data to encode.
   * @returns An ArrayBuffer containing the serialized level.
   * @throws {LevelLoadError} If the level data contains values that cannot
   *   be represented in the binary format (e.g. string too long, difficulty
   *   out of Uint8 range, topology config value not representable as Float32).
   */
  encode(level: LevelData): ArrayBuffer {
    // --- Input validation ---
    const nameBytes = encodeString(level.metadata.name);
    const authorBytes = encodeString(level.metadata.author);

    if (nameBytes.length > MAX_UINT16) {
      throw new LevelLoadError(
        `Level name too long: ${nameBytes.length} UTF-8 bytes exceeds Uint16 max (${MAX_UINT16})`,
      );
    }
    if (authorBytes.length > MAX_UINT16) {
      throw new LevelLoadError(
        `Level author too long: ${authorBytes.length} UTF-8 bytes exceeds Uint16 max (${MAX_UINT16})`,
      );
    }

    const { difficulty } = level.metadata;
    if (!Number.isInteger(difficulty) || difficulty < 0 || difficulty > 255) {
      throw new LevelLoadError(
        `Difficulty must be an integer in [0, 255], got ${difficulty}`,
      );
    }

    const configEntries = Object.entries(level.topologyConfig);
    const configKeyBytes = configEntries.map(([key]) => encodeString(key));

    for (let i = 0; i < configEntries.length; i++) {
      const [key, value] = configEntries[i];
      if (!Number.isFinite(value)) {
        throw new LevelLoadError(
          `Topology config value for '${key}' is not finite: ${value}`,
        );
      }
      if (Math.fround(value) !== value) {
        throw new LevelLoadError(
          `Topology config value for '${key}' loses precision in Float32: ${value} → ${Math.fround(value)}`,
        );
      }
      if (configKeyBytes[i].length > MAX_UINT16) {
        throw new LevelLoadError(
          `Topology config key '${key}' too long: ${configKeyBytes[i].length} UTF-8 bytes exceeds Uint16 max`,
        );
      }
    }

    // --- Size calculation ---
    let size = 0;
    // Header
    size += 4 + 1;
    // Metadata
    size += 2 + nameBytes.length + 2 + authorBytes.length + 1;
    // Topology type + config
    size += 1 + 2;
    for (const keyBytes of configKeyBytes) {
      size += 2 + keyBytes.length + 4;
    }
    // Cells
    size += 4 + level.cells.length * 4;
    // Adjacency (per cell: 2B count + neighbors * 4B)
    for (const cellId of level.cells) {
      const neighbors = level.adjacency[cellId] ?? [];
      size += 2 + neighbors.length * 4;
    }
    // Mines
    size += 4 + level.minePositions.length * 4;
    // Mechanisms
    size += 4;
    for (const entry of level.mechanismConfigs) {
      size += 4 + 1; // cellId + type byte
      size += this.mechanismConfigSize(entry.config);
    }

    const buffer = new ArrayBuffer(size);
    const view = new DataView(buffer);
    const bytes = new Uint8Array(buffer);
    let offset = 0;

    // --- Header ---
    for (const b of MAGIC_NUMBER) {
      view.setUint8(offset++, b);
    }
    view.setUint8(offset++, VERSION_BYTE);

    // --- Metadata ---
    view.setUint16(offset, nameBytes.length);
    offset += 2;
    bytes.set(nameBytes, offset);
    offset += nameBytes.length;

    view.setUint16(offset, authorBytes.length);
    offset += 2;
    bytes.set(authorBytes, offset);
    offset += authorBytes.length;

    view.setUint8(offset++, difficulty);

    // --- Topology ---
    const topoIndex = TOPOLOGY_INDEX.indexOf(level.topologyType);
    if (topoIndex === -1) {
      throw new LevelLoadError(`Unknown topology type: ${level.topologyType}`);
    }
    view.setUint8(offset++, topoIndex);

    view.setUint16(offset, configEntries.length);
    offset += 2;
    for (let i = 0; i < configEntries.length; i++) {
      const keyBytes = configKeyBytes[i];
      view.setUint16(offset, keyBytes.length);
      offset += 2;
      bytes.set(keyBytes, offset);
      offset += keyBytes.length;
      view.setFloat32(offset, configEntries[i][1]);
      offset += 4;
    }

    // --- Cells ---
    view.setUint32(offset, level.cells.length);
    offset += 4;
    for (const cellId of level.cells) {
      view.setUint32(offset, cellId);
      offset += 4;
    }

    // --- Adjacency ---
    for (const cellId of level.cells) {
      const neighbors = level.adjacency[cellId] ?? [];
      view.setUint16(offset, neighbors.length);
      offset += 2;
      for (const n of neighbors) {
        view.setUint32(offset, n);
        offset += 4;
      }
    }

    // --- Mines ---
    view.setUint32(offset, level.minePositions.length);
    offset += 4;
    for (const mineId of level.minePositions) {
      view.setUint32(offset, mineId);
      offset += 4;
    }

    // --- Mechanisms ---
    view.setUint32(offset, level.mechanismConfigs.length);
    offset += 4;
    for (const entry of level.mechanismConfigs) {
      view.setUint32(offset, entry.cellId);
      offset += 4;
      offset = this.writeMechanismConfig(view, offset, entry.config);
    }

    return buffer;
  }

  /**
   * Deserialize a level from a binary `.mswp` buffer.
   *
   * @param buffer - The buffer to decode.
   * @returns The deserialized level data.
   * @throws {LevelLoadError} If the buffer is invalid.
   */
  decode(buffer: ArrayBuffer): LevelData {
    const validation = this.validate(buffer);
    if (!validation.valid) {
      throw new LevelLoadError(
        `Invalid binary level data: ${validation.errors.join('; ')}`,
      );
    }

    const view = new DataView(buffer);
    const bytes = new Uint8Array(buffer);
    let offset = MIN_HEADER_SIZE; // skip magic + version

    // --- Metadata ---
    const nameLen = view.getUint16(offset);
    offset += 2;
    const name = decodeString(bytes.slice(offset, offset + nameLen));
    offset += nameLen;

    const authorLen = view.getUint16(offset);
    offset += 2;
    const author = decodeString(bytes.slice(offset, offset + authorLen));
    offset += authorLen;

    const difficulty = view.getUint8(offset++);

    // --- Topology ---
    const topoIndex = view.getUint8(offset++);
    const topologyType = TOPOLOGY_INDEX[topoIndex];

    const configCount = view.getUint16(offset);
    offset += 2;
    const topologyConfig: Record<string, number> = {};
    for (let i = 0; i < configCount; i++) {
      const keyLen = view.getUint16(offset);
      offset += 2;
      const key = decodeString(bytes.slice(offset, offset + keyLen));
      offset += keyLen;
      topologyConfig[key] = view.getFloat32(offset);
      offset += 4;
    }

    // --- Cells ---
    const cellCount = view.getUint32(offset);
    offset += 4;
    const cells: number[] = [];
    for (let i = 0; i < cellCount; i++) {
      cells.push(view.getUint32(offset));
      offset += 4;
    }

    // --- Adjacency ---
    const adjacency: Record<number, readonly number[]> = {};
    for (const cellId of cells) {
      const neighborCount = view.getUint16(offset);
      offset += 2;
      const neighbors: number[] = [];
      for (let j = 0; j < neighborCount; j++) {
        neighbors.push(view.getUint32(offset));
        offset += 4;
      }
      adjacency[cellId] = neighbors;
    }

    // --- Mines ---
    const mineCount = view.getUint32(offset);
    offset += 4;
    const minePositions: number[] = [];
    for (let i = 0; i < mineCount; i++) {
      minePositions.push(view.getUint32(offset));
      offset += 4;
    }

    // --- Mechanisms ---
    const mechCount = view.getUint32(offset);
    offset += 4;
    const mechanismConfigs: LevelMechanismEntry[] = [];
    for (let i = 0; i < mechCount; i++) {
      const cellId = view.getUint32(offset);
      offset += 4;
      const { config, newOffset } = this.readMechanismConfig(view, offset);
      offset = newOffset;
      mechanismConfigs.push({ cellId, config });
    }

    return {
      metadata: { name, author, difficulty },
      topologyType,
      topologyConfig,
      cells,
      adjacency,
      minePositions,
      mechanismConfigs,
    };
  }

  /**
   * Validate a binary buffer without fully decoding it.
   *
   * Checks magic number, version, minimum size, and structural integrity.
   * Does not throw — returns a result object.
   *
   * @param buffer - The buffer to validate.
   * @returns Validation result with `valid` flag and error messages.
   */
  validate(buffer: ArrayBuffer): ValidationResult {
    const errors: string[] = [];

    if (buffer.byteLength < MIN_HEADER_SIZE) {
      errors.push(
        `Buffer too short: expected at least ${MIN_HEADER_SIZE} bytes, got ${buffer.byteLength}`,
      );
      return { valid: false, errors };
    }

    const view = new DataView(buffer);

    // Check magic number
    for (let i = 0; i < MAGIC_NUMBER.length; i++) {
      if (view.getUint8(i) !== MAGIC_NUMBER[i]) {
        errors.push(
          `Invalid magic number at byte ${i}: expected 0x${MAGIC_NUMBER[i].toString(16).padStart(2, '0')}, got 0x${view.getUint8(i).toString(16).padStart(2, '0')}`,
        );
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    // Check version
    const version = view.getUint8(4);
    if (version !== VERSION_BYTE) {
      errors.push(
        `Unsupported version: expected 0x${VERSION_BYTE.toString(16).padStart(2, '0')}, got 0x${version.toString(16).padStart(2, '0')}`,
      );
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    // Try to walk the buffer to check structural integrity
    try {
      this.walkBuffer(view);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`Data integrity error: ${msg}`);
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Walk the buffer to verify structural integrity without building objects.
   * Throws on any out-of-bounds or invalid data.
   */
  private walkBuffer(view: DataView): void {
    const bufLen = view.byteLength;
    let offset = MIN_HEADER_SIZE;

    const ensureBytes = (need: number): void => {
      if (offset + need > bufLen) {
        throw new Error(
          `Unexpected end of data at offset ${offset}: need ${need} bytes, ${bufLen - offset} remaining`,
        );
      }
    };

    // Metadata
    ensureBytes(2);
    const nameLen = view.getUint16(offset);
    offset += 2;
    ensureBytes(nameLen);
    offset += nameLen;

    ensureBytes(2);
    const authorLen = view.getUint16(offset);
    offset += 2;
    ensureBytes(authorLen);
    offset += authorLen;

    ensureBytes(1);
    offset += 1; // difficulty

    // Topology
    ensureBytes(1);
    const topoIndex = view.getUint8(offset);
    offset += 1;
    if (topoIndex >= TOPOLOGY_INDEX.length) {
      throw new Error(`Invalid topology type index: ${topoIndex}`);
    }

    ensureBytes(2);
    const configCount = view.getUint16(offset);
    offset += 2;
    for (let i = 0; i < configCount; i++) {
      ensureBytes(2);
      const keyLen = view.getUint16(offset);
      offset += 2;
      ensureBytes(keyLen + 4);
      offset += keyLen + 4;
    }

    // Cells
    ensureBytes(4);
    const cellCount = view.getUint32(offset);
    offset += 4;
    ensureBytes(cellCount * 4);
    offset += cellCount * 4;

    // Adjacency
    for (let i = 0; i < cellCount; i++) {
      ensureBytes(2);
      const neighborCount = view.getUint16(offset);
      offset += 2;
      ensureBytes(neighborCount * 4);
      offset += neighborCount * 4;
    }

    // Mines
    ensureBytes(4);
    const mineCount = view.getUint32(offset);
    offset += 4;
    ensureBytes(mineCount * 4);
    offset += mineCount * 4;

    // Mechanisms
    ensureBytes(4);
    const mechCount = view.getUint32(offset);
    offset += 4;
    for (let i = 0; i < mechCount; i++) {
      ensureBytes(4 + 1);
      offset += 4; // cellId
      const mechType = view.getUint8(offset);
      offset += 1;
      if (mechType >= MECHANISM_INDEX.length) {
        throw new Error(`Invalid mechanism type index: ${mechType}`);
      }
      const mType = MECHANISM_INDEX[mechType];
      switch (mType) {
        case MechanismType.FuzzyHint:
          ensureBytes(4);
          offset += 4;
          break;
        case MechanismType.DelayedReveal:
          ensureBytes(4);
          offset += 4;
          break;
      }
    }

    // Verify buffer is fully consumed — no trailing bytes
    if (offset !== bufLen) {
      throw new Error(
        `${bufLen - offset} unexpected trailing bytes after offset ${offset}`,
      );
    }
  }

  /**
   * Compute the byte size of a mechanism config's variable data
   * (excludes the 1-byte type tag, which is accounted for separately).
   */
  private mechanismConfigSize(config: MechanismConfig): number {
    switch (config.type) {
      case MechanismType.FuzzyHint:
        return 4; // offset (uint32)
      case MechanismType.DelayedReveal:
        return 4; // delay (uint32)
    }
  }

  /**
   * Write a mechanism config to the buffer.
   * Returns the new offset after writing.
   *
   * @throws {LevelLoadError} If the mechanism type is not in the binary index.
   */
  private writeMechanismConfig(
    view: DataView,
    offset: number,
    config: MechanismConfig,
  ): number {
    const mechIndex = MECHANISM_INDEX.indexOf(config.type);
    if (mechIndex === -1) {
      throw new LevelLoadError(`Unknown mechanism type: ${config.type}`);
    }
    view.setUint8(offset++, mechIndex);

    switch (config.type) {
      case MechanismType.FuzzyHint:
        view.setUint32(offset, config.offset);
        offset += 4;
        break;
      case MechanismType.DelayedReveal:
        view.setUint32(offset, config.delay);
        offset += 4;
        break;
    }

    return offset;
  }

  /**
   * Read a mechanism config from the buffer.
   * Returns the config and the new offset.
   */
  private readMechanismConfig(
    view: DataView,
    offset: number,
  ): { config: MechanismConfig; newOffset: number } {
    const mechIndex = view.getUint8(offset++);
    const mechType = MECHANISM_INDEX[mechIndex];

    switch (mechType) {
      case MechanismType.FuzzyHint: {
        const mechOffset = view.getUint32(offset);
        offset += 4;
        return {
          config: { type: MechanismType.FuzzyHint, offset: mechOffset },
          newOffset: offset,
        };
      }
      case MechanismType.DelayedReveal: {
        const delay = view.getUint32(offset);
        offset += 4;
        return {
          config: { type: MechanismType.DelayedReveal, delay },
          newOffset: offset,
        };
      }
      default:
        throw new LevelLoadError(`Unsupported mechanism type index: ${mechIndex}`);
    }
  }
}
