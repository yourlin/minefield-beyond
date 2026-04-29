import { describe, it, expect } from 'vitest';
import { BinaryLevelCodec } from './binary-codec.js';
import { VERSION_BYTE } from './constants.js';
import { TopologyType } from '../topology/types.js';
import { MechanismType } from '../mechanism/types.js';
import { LevelLoadError } from '../errors/level-load-error.js';
import type { LevelData } from '../types/index.js';

/**
 * Helper: create a minimal level with the given parameters.
 */
function makeLevel(overrides: Partial<LevelData> = {}): LevelData {
  return {
    metadata: { name: 'Test', author: 'Agent', difficulty: 1 },
    topologyType: TopologyType.Hexagonal,
    topologyConfig: { rows: 1, cols: 1 },
    cells: [0],
    adjacency: { 0: [] },
    minePositions: [],
    mechanismConfigs: [],
    ...overrides,
  };
}

describe('core/binary/BinaryLevelCodec', () => {
  const codec = new BinaryLevelCodec();

  // --- Test 1: 最小关卡 round-trip (1 cell, 0 mines, no mechanisms) ---
  it('round-trips a minimal level (1 cell, 0 mines, no mechanisms)', () => {
    const level = makeLevel();
    const buffer = codec.encode(level);
    const decoded = codec.decode(buffer);

    expect(decoded.metadata).toEqual(level.metadata);
    expect(decoded.topologyType).toBe(level.topologyType);
    expect(decoded.topologyConfig).toEqual(level.topologyConfig);
    expect(decoded.cells).toEqual(level.cells);
    expect(decoded.adjacency).toEqual(level.adjacency);
    expect(decoded.minePositions).toEqual(level.minePositions);
    expect(decoded.mechanismConfigs).toEqual(level.mechanismConfigs);
  });

  // --- Test 2: 中等关卡 round-trip (25 cells hex, 5 mines, FuzzyHint + DelayedReveal) ---
  it('round-trips a medium level (25 cells, 5 mines, FuzzyHint + DelayedReveal)', () => {
    const cells = Array.from({ length: 25 }, (_, i) => i);
    const adjacency: Record<number, readonly number[]> = {};
    for (const c of cells) {
      // Simple adjacency: each cell connects to its immediate neighbors
      adjacency[c] = cells.filter(
        (n) => n !== c && Math.abs(n - c) <= 1,
      );
    }

    const level = makeLevel({
      topologyConfig: { rows: 5, cols: 5 },
      cells,
      adjacency,
      minePositions: [3, 7, 12, 18, 22],
      mechanismConfigs: [
        { cellId: 1, config: { type: MechanismType.FuzzyHint, offset: 2 } },
        { cellId: 10, config: { type: MechanismType.DelayedReveal, delay: 3 } },
      ],
    });

    const buffer = codec.encode(level);
    const decoded = codec.decode(buffer);

    expect(decoded).toEqual(level);
  });

  // --- Test 3: 最大规模 round-trip (200 cells) ---
  it('round-trips a large level (200 cells)', () => {
    const cells = Array.from({ length: 200 }, (_, i) => i);
    const adjacency: Record<number, readonly number[]> = {};
    for (const c of cells) {
      // Each cell has up to 6 neighbors (hex-like)
      adjacency[c] = cells.filter(
        (n) => n !== c && Math.abs(n - c) <= 3 && Math.abs(n - c) >= 1,
      ).slice(0, 6);
    }

    const level = makeLevel({
      metadata: { name: 'Large Level', author: 'Tester', difficulty: 5 },
      topologyConfig: { rows: 10, cols: 20 },
      cells,
      adjacency,
      minePositions: cells.filter((c) => c % 7 === 0), // ~28 mines
      mechanismConfigs: [
        { cellId: 5, config: { type: MechanismType.FuzzyHint, offset: 1 } },
        { cellId: 50, config: { type: MechanismType.DelayedReveal, delay: 5 } },
        { cellId: 150, config: { type: MechanismType.FuzzyHint, offset: 3 } },
      ],
    });

    const buffer = codec.encode(level);
    const decoded = codec.decode(buffer);

    expect(decoded).toEqual(level);
  });

  // --- Test 4: validate() 对截断数据返回错误 ---
  it('validate() returns error for truncated data', () => {
    const level = makeLevel();
    const buffer = codec.encode(level);
    // Truncate to just the header
    const truncated = buffer.slice(0, 6);
    const result = codec.validate(truncated);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.includes('end of data') || e.includes('integrity'))).toBe(true);
  });

  // --- Test 5: validate() 对错误 magic number 返回错误 ---
  it('validate() returns error for wrong magic number', () => {
    const level = makeLevel();
    const buffer = codec.encode(level);
    const bytes = new Uint8Array(buffer);
    bytes[0] = 0x00; // corrupt first magic byte
    const result = codec.validate(buffer);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('magic number'))).toBe(true);
  });

  // --- Test 6: validate() 对版本不匹配返回错误 ---
  it('validate() returns error for version mismatch', () => {
    const level = makeLevel();
    const buffer = codec.encode(level);
    const bytes = new Uint8Array(buffer);
    bytes[4] = 0xFF; // set unsupported version
    const result = codec.validate(buffer);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('version'))).toBe(true);
  });

  // --- Test 7: validate() 对有效数据返回 valid: true ---
  it('validate() returns valid: true for valid data', () => {
    const level = makeLevel();
    const buffer = codec.encode(level);
    const result = codec.validate(buffer);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  // --- Additional: decode() throws LevelLoadError for invalid data ---
  it('decode() throws LevelLoadError for invalid buffer', () => {
    const badBuffer = new ArrayBuffer(3); // too short
    expect(() => codec.decode(badBuffer)).toThrow(LevelLoadError);
  });

  // --- Additional: round-trip with all topology types ---
  it('round-trips with different topology types', () => {
    for (const topoType of [
      TopologyType.Hexagonal,
      TopologyType.Triangle,
      TopologyType.Torus,
      TopologyType.Irregular,
      TopologyType.Mixed,
    ]) {
      const level = makeLevel({ topologyType: topoType });
      const buffer = codec.encode(level);
      const decoded = codec.decode(buffer);
      expect(decoded.topologyType).toBe(topoType);
    }
  });

  // --- Additional: round-trip with all mechanism types ---
  it('round-trips with all mechanism types', () => {
    const level = makeLevel({
      cells: [0, 1],
      adjacency: { 0: [1], 1: [0] },
      mechanismConfigs: [
        { cellId: 0, config: { type: MechanismType.FuzzyHint, offset: 2 } },
        { cellId: 1, config: { type: MechanismType.DelayedReveal, delay: 4 } },
      ],
    });

    const buffer = codec.encode(level);
    const decoded = codec.decode(buffer);
    expect(decoded.mechanismConfigs).toEqual(level.mechanismConfigs);
  });

  // --- Additional: binary header starts with MSWP + version ---
  it('encoded buffer starts with MSWP magic and version byte', () => {
    const level = makeLevel();
    const buffer = codec.encode(level);
    const bytes = new Uint8Array(buffer);

    expect(bytes[0]).toBe(0x4d); // M
    expect(bytes[1]).toBe(0x53); // S
    expect(bytes[2]).toBe(0x57); // W
    expect(bytes[3]).toBe(0x50); // P
    expect(bytes[4]).toBe(VERSION_BYTE);
  });

  // --- Additional: validate() on empty buffer ---
  it('validate() returns error for empty buffer', () => {
    const result = codec.validate(new ArrayBuffer(0));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('too short'))).toBe(true);
  });

  // --- Additional: round-trip with UTF-8 metadata ---
  it('round-trips with UTF-8 metadata (Chinese characters)', () => {
    const level = makeLevel({
      metadata: { name: '测试关卡', author: '开发者', difficulty: 3 },
    });
    const buffer = codec.encode(level);
    const decoded = codec.decode(buffer);
    expect(decoded.metadata.name).toBe('测试关卡');
    expect(decoded.metadata.author).toBe('开发者');
  });

  // --- Review fix: encode rejects difficulty out of Uint8 range ---
  it('encode() throws for difficulty > 255', () => {
    const level = makeLevel({
      metadata: { name: 'Test', author: 'Agent', difficulty: 256 },
    });
    expect(() => codec.encode(level)).toThrow(LevelLoadError);
  });

  it('encode() throws for negative difficulty', () => {
    const level = makeLevel({
      metadata: { name: 'Test', author: 'Agent', difficulty: -1 },
    });
    expect(() => codec.encode(level)).toThrow(LevelLoadError);
  });

  it('encode() throws for non-integer difficulty', () => {
    const level = makeLevel({
      metadata: { name: 'Test', author: 'Agent', difficulty: 2.5 },
    });
    expect(() => codec.encode(level)).toThrow(LevelLoadError);
  });

  // --- Review fix: encode rejects Float32-lossy config values ---
  it('encode() throws for topology config value that loses Float32 precision', () => {
    const level = makeLevel({
      topologyConfig: { rows: 16777217 }, // first integer not representable in float32
    });
    expect(() => codec.encode(level)).toThrow(LevelLoadError);
  });

  // --- Review fix: validate rejects trailing bytes ---
  it('validate() returns error for buffer with trailing bytes', () => {
    const level = makeLevel();
    const buffer = codec.encode(level);
    // Append extra bytes
    const extended = new Uint8Array(buffer.byteLength + 5);
    extended.set(new Uint8Array(buffer));
    const result = codec.validate(extended.buffer);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('trailing bytes'))).toBe(true);
  });
});
