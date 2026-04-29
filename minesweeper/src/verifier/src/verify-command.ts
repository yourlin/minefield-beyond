import * as fs from 'node:fs';
import { BinaryLevelCodec } from '../../core/binary/binary-codec.js';
import { ConstraintSolver } from '../../core/solver/solver.js';
import { TopologyRegistry } from '../../core/topology/topology-registry.js';
import { MechanismType } from '../../core/mechanism/types.js';
import type { LevelData } from '../../core/types/level.js';
import type { SolverInput, SolverResult } from '../../core/solver/types.js';

/**
 * Result of verifying a single level file.
 */
export interface VerifyResult {
  /** File path that was verified. */
  readonly filePath: string;
  /** Whether verification succeeded (unique solution found). */
  readonly success: boolean;
  /** Human-readable summary message. */
  readonly message: string;
  /** The solver result, if solving was attempted. */
  readonly solverResult?: SolverResult;
}

/**
 * Build a SolverInput from a decoded LevelData.
 *
 * For the verifier, all non-mine cells are treated as "revealed"
 * with their true neighbor mine counts (or FuzzyHint ranges).
 */
function buildSolverInput(level: LevelData): SolverInput {
  const topology = TopologyRegistry.create(
    level.topologyType,
    level.topologyConfig,
  );

  const mineSet = new Set(level.minePositions);
  const revealedCells = new Map<number, number | { min: number; max: number }>();

  // Build a lookup for mechanism configs by cellId
  const mechMap = new Map(
    level.mechanismConfigs.map((m) => [m.cellId, m.config]),
  );

  for (const cellId of level.cells) {
    if (mineSet.has(cellId)) continue;

    const neighbors = topology.neighbors(cellId);
    const mineNeighborCount = neighbors.filter((n) => mineSet.has(n)).length;

    const mechConfig = mechMap.get(cellId);
    if (mechConfig?.type === MechanismType.FuzzyHint) {
      const offset = mechConfig.offset;
      revealedCells.set(cellId, {
        min: Math.max(0, mineNeighborCount - offset),
        max: mineNeighborCount + offset,
      });
    } else {
      // Exact number (including DelayedReveal, which is equivalent)
      revealedCells.set(cellId, mineNeighborCount);
    }
  }

  return {
    topology,
    revealedCells,
    mineCount: level.minePositions.length,
  };
}

/**
 * Verify a single .mswp level file.
 *
 * @param filePath - Path to the .mswp file.
 * @returns The verification result.
 */
export function verifyFile(filePath: string): VerifyResult {
  // Read file
  let buffer: ArrayBuffer;
  try {
    const data = fs.readFileSync(filePath);
    buffer = data.buffer.slice(
      data.byteOffset,
      data.byteOffset + data.byteLength,
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      filePath,
      success: false,
      message: `❌ Failed to read file: ${msg}`,
    };
  }

  // Validate format
  const codec = new BinaryLevelCodec();
  const validation = codec.validate(buffer);
  if (!validation.valid) {
    return {
      filePath,
      success: false,
      message: `❌ Invalid file format: ${validation.errors.join('; ')}`,
    };
  }

  // Decode
  let level: LevelData;
  try {
    level = codec.decode(buffer);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      filePath,
      success: false,
      message: `❌ Failed to decode: ${msg}`,
    };
  }

  // Build solver input and solve
  const input = buildSolverInput(level);
  const solver = new ConstraintSolver();
  const result = solver.solve(input);

  switch (result.kind) {
    case 'unique':
      return {
        filePath,
        success: true,
        message: `✅ 唯一解已验证 — ${level.metadata.name} (${level.cells.length} cells, ${level.minePositions.length} mines)`,
        solverResult: result,
      };
    case 'multiple':
      return {
        filePath,
        success: false,
        message: `❌ 非唯一解 — ${result.solutions.length} 个可能解，差异位置: [${result.differingCells.join(', ')}]`,
        solverResult: result,
      };
    case 'unsolvable':
      return {
        filePath,
        success: false,
        message: `❌ 无解 — ${result.reason}`,
        solverResult: result,
      };
  }
}
