import type { CellId } from './cell.js';
import type { MechanismConfig } from '../mechanism/types.js';
import type { TopologyType } from '../topology/types.js';

/**
 * Metadata describing a level's identity and difficulty.
 *
 * Contains human-readable information about a level that is
 * independent of the level's actual cell/topology data.
 */
export interface LevelMetadata {
  /** Display name of the level. */
  readonly name: string;
  /** Author who created the level. */
  readonly author: string;
  /** Difficulty rating (higher = harder). */
  readonly difficulty: number;
}

/**
 * Adjacency lookup table mapping each cell to its neighbor cell IDs.
 *
 * Uses `Record` instead of `Map` for direct JSON/binary serialization.
 */
export type LevelAdjacency = Record<number, readonly number[]>;

/**
 * Associates a mechanism configuration with a specific cell.
 *
 * Each entry binds one cell to its information mechanism parameters.
 */
export interface LevelMechanismEntry {
  /** The cell this mechanism applies to. */
  readonly cellId: CellId;
  /** Mechanism-specific configuration (discriminated union). */
  readonly config: MechanismConfig;
}

/**
 * Top-level container for a single level's complete data.
 *
 * Uses plain objects and arrays (not Map/Set) for straightforward
 * serialization in both binary and JSON codecs.
 */
export interface LevelData {
  /** Descriptive metadata for this level. */
  readonly metadata: LevelMetadata;
  /** Topology type identifier (e.g. 'hexagonal'). */
  readonly topologyType: TopologyType;
  /** Topology-specific configuration (e.g. { rows: 5, cols: 5 }). */
  readonly topologyConfig: Record<string, number>;
  /** Ordered list of all cell IDs in this level. */
  readonly cells: readonly CellId[];
  /** Adjacency table: cellId → neighbor cellIds. */
  readonly adjacency: LevelAdjacency;
  /** Positions of all mines. */
  readonly minePositions: readonly CellId[];
  /** Information mechanism configurations per cell. */
  readonly mechanismConfigs: readonly LevelMechanismEntry[];
  /** Optional cell screen positions for irregular/mixed topologies. */
  readonly cellPositions?: ReadonlyArray<{ readonly x: number; readonly y: number }>;
}
