import type { CellId } from '../../core/types/index.js';
import type { LevelData } from '../../core/types/level.js';
import type { ITopologyGraph } from '../../core/topology/types.js';
import { TopologyType } from '../../core/topology/types.js';
import { TopologyRegistry } from '../../core/topology/topology-registry.js';
import { IrregularTopology } from '../../core/topology/irregular-topology.js';
import { MixedTopology } from '../../core/topology/mixed-topology.js';
import { MechanismType } from '../../core/mechanism/types.js';
import { GameStateMachine } from './game-state-machine.js';
import { CommandLog } from './command-log.js';

import '../../core/topology/topology-registry.js';

export type CellVisualState = 'unrevealed' | 'revealed' | 'flagged' | 'pencil-mine' | 'pencil-safe' | 'mine-hit' | 'mine-revealed';

export interface CellInfo {
  readonly cellId: CellId;
  readonly visualState: CellVisualState;
  readonly mineNeighborCount: number;
  readonly isMine: boolean;
  readonly mechanismDisplay?: string;
}

export type RevealResult =
  | { readonly kind: 'safe'; readonly revealedCells: readonly CellId[] }
  | { readonly kind: 'mine'; readonly mineCell: CellId }
  | { readonly kind: 'already-revealed' }
  | { readonly kind: 'flagged' }
  | { readonly kind: 'game-over' };

/**
 * Board model with runtime mine placement.
 *
 * Mines are placed randomly on the first reveal, guaranteeing the
 * first clicked cell and its neighbors are safe (classic minesweeper behavior).
 */
export class BoardModel {
  private readonly topology: ITopologyGraph;
  private mineSet: Set<CellId> = new Set();
  private mineNeighborCounts: Map<CellId, number> = new Map();
  private readonly cellStates: Map<CellId, CellVisualState>;
  private readonly mechMap: Map<CellId, { type: string; offset?: number; delay?: number }>;
  private minesPlaced = false;
  private readonly mineCount: number;
  private readonly includedCells: Set<CellId>;

  readonly stateMachine: GameStateMachine;
  readonly commandLog: CommandLog;
  readonly level: LevelData;

  constructor(level: LevelData) {
    this.level = level;
    this.mineCount = level.minePositions.length;

    if (level.cellPositions && (level.topologyType === TopologyType.Irregular || level.topologyType === TopologyType.Mixed)) {
      const adjArray = level.cells.map((c) => level.adjacency[c] ?? []);
      if (level.topologyType === TopologyType.Mixed) {
        const shapes = level.cells.map(() => 'polygon' as const);
        this.topology = new MixedTopology({ positions: level.cellPositions, adjacency: adjArray, shapes });
      } else {
        this.topology = new IrregularTopology({ positions: level.cellPositions, adjacency: adjArray });
      }
    } else {
      this.topology = TopologyRegistry.create(level.topologyType, level.topologyConfig);
    }

    this.stateMachine = new GameStateMachine();
    this.commandLog = new CommandLog();

    // Build set of included cells for neighbor filtering
    this.includedCells = new Set(level.cells);

    this.cellStates = new Map();
    for (const cellId of level.cells) {
      this.cellStates.set(cellId, 'unrevealed');
    }

    this.mechMap = new Map();
    for (const entry of level.mechanismConfigs) {
      if (entry.config.type === MechanismType.FuzzyHint) {
        this.mechMap.set(entry.cellId, { type: 'fuzzy', offset: entry.config.offset });
      } else if (entry.config.type === MechanismType.DelayedReveal) {
        this.mechMap.set(entry.cellId, { type: 'delayed', delay: entry.config.delay });
      }
    }
  }

  /**
   * Place mines randomly, avoiding the safe cell and its neighbors.
   * Called on first reveal to guarantee the first click is safe.
   */
  private placeMines(safeCell: CellId): void {
    const safeNeighbors = this.topology.neighbors(safeCell).filter((n) => this.includedCells.has(n));
    const safeZone = new Set<CellId>([safeCell, ...safeNeighbors]);
    const candidates = this.level.cells.filter((c) => !safeZone.has(c));

    // Fisher-Yates shuffle
    const shuffled = [...candidates];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // If not enough candidates outside safe zone, allow some safe-zone neighbors
    const needed = Math.min(this.mineCount, shuffled.length);
    const minePositions = shuffled.slice(0, needed);

    // If we still need more mines (very small board), add from safe zone neighbors (not the clicked cell itself)
    if (minePositions.length < this.mineCount) {
      const extraCandidates = [...safeZone].filter((c) => c !== safeCell);
      for (const c of extraCandidates) {
        if (minePositions.length >= this.mineCount) break;
        minePositions.push(c);
      }
    }

    this.mineSet = new Set(minePositions);

    // Compute neighbor counts
    this.mineNeighborCounts = new Map();
    for (const cellId of this.level.cells) {
      const count = this.topology.neighbors(cellId)
        .filter((n) => this.includedCells.has(n) && this.mineSet.has(n)).length;
      this.mineNeighborCounts.set(cellId, count);
    }

    this.minesPlaced = true;
  }

  reveal(cellId: CellId): RevealResult {
    const phase = this.stateMachine.state.phase;
    if (phase === 'success' || phase === 'failed') {
      return { kind: 'game-over' };
    }

    const currentState = this.cellStates.get(cellId);
    if (currentState === 'revealed') {
      return { kind: 'already-revealed' };
    }
    if (currentState === 'flagged') {
      return { kind: 'flagged' };
    }
    if (currentState !== 'unrevealed' && currentState !== 'pencil-mine' && currentState !== 'pencil-safe') {
      return { kind: 'already-revealed' };
    }

    // Place mines on first reveal — guarantees first click is safe
    if (!this.minesPlaced) {
      this.placeMines(cellId);
    }

    this.stateMachine.startPlaying();
    this.stateMachine.incrementMoves();
    this.commandLog.push({ action: 'reveal', cellId });

    if (this.mineSet.has(cellId)) {
      this.cellStates.set(cellId, 'mine-hit');
      for (const mineId of this.mineSet) {
        if (mineId !== cellId) {
          this.cellStates.set(mineId, 'mine-revealed');
        }
      }
      this.stateMachine.fail(cellId);
      return { kind: 'mine', mineCell: cellId };
    }

    const revealedCells = this.bfsReveal(cellId);

    if (this.checkWin()) {
      for (const mineId of this.mineSet) {
        this.cellStates.set(mineId, 'mine-revealed');
      }
      this.stateMachine.succeed();
    }

    return { kind: 'safe', revealedCells };
  }

  toggleFlag(cellId: CellId): boolean {
    const phase = this.stateMachine.state.phase;
    if (phase !== 'playing' && phase !== 'notStarted') return false;
    this.stateMachine.startPlaying();

    const currentState = this.cellStates.get(cellId);
    if (currentState === 'unrevealed') {
      this.cellStates.set(cellId, 'flagged');
      this.commandLog.push({ action: 'flag', cellId });
      return true;
    }
    if (currentState === 'flagged') {
      this.cellStates.set(cellId, 'unrevealed');
      this.commandLog.push({ action: 'unflag', cellId });
      return true;
    }
    return false;
  }

  undoLastFlag(): boolean {
    const phase = this.stateMachine.state.phase;
    if (phase !== 'playing') return false;

    const lastCmd = this.commandLog.last();
    if (!lastCmd || (lastCmd.action !== 'flag' && lastCmd.action !== 'unflag')) return false;

    this.commandLog.popLast();
    if (lastCmd.action === 'flag') {
      this.cellStates.set(lastCmd.cellId, 'unrevealed');
    } else if (lastCmd.action === 'unflag') {
      this.cellStates.set(lastCmd.cellId, 'flagged');
    }
    return true;
  }

  setPencilMark(cellId: CellId, mark: 'pencil-mine' | 'pencil-safe'): boolean {
    const phase = this.stateMachine.state.phase;
    if (phase !== 'playing' && phase !== 'notStarted') return false;
    this.stateMachine.startPlaying();

    const currentState = this.cellStates.get(cellId);
    if (currentState === 'revealed' || currentState === 'mine-hit' || currentState === 'mine-revealed') return false;
    if (currentState === mark) {
      this.cellStates.set(cellId, 'unrevealed');
      return true;
    }
    this.cellStates.set(cellId, mark);
    return true;
  }

  getCellInfo(cellId: CellId): CellInfo {
    const visualState = this.cellStates.get(cellId) ?? 'unrevealed';
    const mineNeighborCount = this.mineNeighborCounts.get(cellId) ?? 0;
    const isMine = this.mineSet.has(cellId);

    let mechanismDisplay: string | undefined;
    const mech = this.mechMap.get(cellId);
    if (mech && visualState === 'revealed') {
      if (mech.type === 'fuzzy' && mech.offset !== undefined) {
        const min = Math.max(0, mineNeighborCount - mech.offset);
        const max = mineNeighborCount + mech.offset;
        mechanismDisplay = `${min}-${max}`;
      } else if (mech.type === 'delayed') {
        mechanismDisplay = `⏳${mineNeighborCount}`;
      }
    }

    return { cellId, visualState, mineNeighborCount, isMine, mechanismDisplay };
  }

  getAllCellInfos(): readonly CellInfo[] {
    return this.level.cells.map((cellId) => this.getCellInfo(cellId));
  }

  getTopology(): ITopologyGraph {
    return this.topology;
  }

  getMineCount(): number {
    return this.mineCount;
  }

  applySavedStates(cellStates: Record<number, CellVisualState>): void {
    for (const [cellIdStr, state] of Object.entries(cellStates)) {
      const cellId = Number(cellIdStr);
      if (this.cellStates.has(cellId)) {
        this.cellStates.set(cellId, state);
      }
    }
    this.stateMachine.startPlaying();
  }

  /**
   * Reset the board — re-randomizes mines on next first click.
   */
  resetBoard(preserveFlags = false): void {
    const preservedCells = preserveFlags
      ? new Map(
          this.level.cells
            .filter((c) => {
              const s = this.cellStates.get(c);
              return s === 'flagged' || s === 'pencil-mine' || s === 'pencil-safe';
            })
            .map((c) => [c, this.cellStates.get(c)!] as const),
        )
      : new Map<CellId, CellVisualState>();

    for (const cellId of this.level.cells) {
      this.cellStates.set(cellId, preservedCells.get(cellId) ?? 'unrevealed');
    }

    // Reset mines — will be re-placed on next first click
    this.mineSet = new Set();
    this.mineNeighborCounts = new Map();
    this.minesPlaced = false;

    this.commandLog.clear();
    this.stateMachine.reset();
  }

  private bfsReveal(startCell: CellId): CellId[] {
    const revealed: CellId[] = [];
    const queue: CellId[] = [startCell];
    const visited = new Set<CellId>([startCell]);

    while (queue.length > 0) {
      const cell = queue.shift()!;
      this.cellStates.set(cell, 'revealed');
      revealed.push(cell);

      const count = this.mineNeighborCounts.get(cell) ?? 0;
      if (count === 0) {
        for (const neighbor of this.topology.neighbors(cell)) {
          if (!visited.has(neighbor) && this.includedCells.has(neighbor) && !this.mineSet.has(neighbor)) {
            const neighborState = this.cellStates.get(neighbor);
            if (neighborState === 'unrevealed' || neighborState === 'pencil-mine' || neighborState === 'pencil-safe') {
              visited.add(neighbor);
              queue.push(neighbor);
            }
          }
        }
      }
    }

    return revealed;
  }

  private checkWin(): boolean {
    for (const cellId of this.level.cells) {
      if (this.mineSet.has(cellId)) continue;
      if (this.cellStates.get(cellId) !== 'revealed') return false;
    }
    return true;
  }
}
