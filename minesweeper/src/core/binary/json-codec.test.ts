import { describe, it, expect } from 'vitest';
import { JsonLevelCodec } from './json-codec.js';
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

describe('core/binary/JsonLevelCodec', () => {
  const codec = new JsonLevelCodec();

  // --- Test 1: 基本 round-trip ---
  it('round-trips a basic level', () => {
    const level = makeLevel();
    const buffer = codec.encode(level);
    const decoded = codec.decode(buffer);

    expect(decoded).toEqual(level);
  });

  // --- Test 2: 含 mechanism 的 round-trip ---
  it('round-trips a level with mechanisms', () => {
    const level = makeLevel({
      cells: [0, 1, 2],
      adjacency: { 0: [1], 1: [0, 2], 2: [1] },
      minePositions: [2],
      mechanismConfigs: [
        { cellId: 0, config: { type: MechanismType.FuzzyHint, offset: 1 } },
        { cellId: 1, config: { type: MechanismType.DelayedReveal, delay: 3 } },
      ],
    });

    const buffer = codec.encode(level);
    const decoded = codec.decode(buffer);

    expect(decoded).toEqual(level);
  });

  // --- Test 3: validate() 对无效 JSON 返回错误 ---
  it('validate() returns error for invalid JSON', () => {
    const badJson = new TextEncoder().encode('not valid json {{{');
    const result = codec.validate(badJson.buffer as ArrayBuffer);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('valid JSON'))).toBe(true);
  });

  // --- Additional: validate() returns error for missing fields ---
  it('validate() returns error for missing required fields', () => {
    const partial = new TextEncoder().encode(JSON.stringify({ metadata: {} }));
    const result = codec.validate(partial.buffer as ArrayBuffer);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Missing required field'))).toBe(true);
  });

  // --- Additional: validate() returns valid for correct data ---
  it('validate() returns valid: true for correct data', () => {
    const level = makeLevel();
    const buffer = codec.encode(level);
    const result = codec.validate(buffer);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  // --- Additional: decode() throws LevelLoadError for invalid data ---
  it('decode() throws LevelLoadError for invalid JSON buffer', () => {
    const badBuffer = new TextEncoder().encode('not json');
    expect(() => codec.decode(badBuffer.buffer as ArrayBuffer)).toThrow(LevelLoadError);
  });

  // --- Additional: validate() returns error for array root ---
  it('validate() returns error for JSON array root', () => {
    const arr = new TextEncoder().encode('[]');
    const result = codec.validate(arr.buffer as ArrayBuffer);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('object'))).toBe(true);
  });

  // --- Additional: round-trip preserves UTF-8 metadata ---
  it('round-trips with UTF-8 metadata', () => {
    const level = makeLevel({
      metadata: { name: '测试关卡', author: '开发者', difficulty: 3 },
    });
    const buffer = codec.encode(level);
    const decoded = codec.decode(buffer);
    expect(decoded.metadata.name).toBe('测试关卡');
    expect(decoded.metadata.author).toBe('开发者');
  });

  // --- Review fix: validate checks field types ---
  it('validate() returns error when cells is not an array', () => {
    const bad = new TextEncoder().encode(JSON.stringify({
      metadata: { name: 'x', author: 'y', difficulty: 1 },
      topologyType: 'hexagonal',
      topologyConfig: {},
      cells: 'not-an-array',
      adjacency: {},
      minePositions: [],
      mechanismConfigs: [],
    }));
    const result = codec.validate(bad.buffer as ArrayBuffer);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('cells must be an array'))).toBe(true);
  });

  it('validate() returns error when metadata is an array', () => {
    const bad = new TextEncoder().encode(JSON.stringify({
      metadata: [1, 2, 3],
      topologyType: 'hexagonal',
      topologyConfig: {},
      cells: [],
      adjacency: {},
      minePositions: [],
      mechanismConfigs: [],
    }));
    const result = codec.validate(bad.buffer as ArrayBuffer);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('metadata must be a plain object'))).toBe(true);
  });
});
