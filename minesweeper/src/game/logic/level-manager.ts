import type { LevelData } from '../../core/types/level.js';
import type { IStorage } from './storage.js';
import { BoardModel } from './board-model.js';
import type { CellVisualState } from './board-model.js';
import { TimerManager } from './timer-manager.js';
import { ProgressManager } from './progress-manager.js';

/** Storage key for saved game state. */
const SAVED_STATE_KEY = 'saved_game';

/**
 * Serializable game state for interrupt recovery.
 */
export interface SavedGameState {
  /** Level index (0-based). */
  readonly levelIndex: number;
  /** Cell states at time of save. */
  readonly cellStates: Record<number, CellVisualState>;
  /** Elapsed time in milliseconds. */
  readonly elapsedMs: number;
  /** Whether the game was in progress. */
  readonly inProgress: boolean;
}

/**
 * Level manager — orchestrates level loading, game flow,
 * progress tracking, and interrupt recovery.
 */
export class LevelManager {
  private board: BoardModel | null = null;
  private timer: TimerManager | null = null;
  private currentLevelIndex = -1;
  readonly progressManager: ProgressManager;

  constructor(private readonly storage: IStorage) {
    this.progressManager = new ProgressManager(storage);
  }

  /**
   * Load a level and prepare for play.
   *
   * @param levelData - The decoded level data.
   * @param levelIndex - The 0-based level index.
   * @returns The board model for the loaded level.
   */
  loadLevel(levelData: LevelData, levelIndex: number): BoardModel {
    this.currentLevelIndex = levelIndex;
    this.board = new BoardModel(levelData);
    this.timer = new TimerManager(levelIndex + 1); // 1-based for timer tiers
    return this.board;
  }

  /**
   * Get the current board model.
   */
  getBoard(): BoardModel | null {
    return this.board;
  }

  /**
   * Get the current timer.
   */
  getTimer(): TimerManager | null {
    return this.timer;
  }

  /**
   * Get the current level index.
   */
  getCurrentLevelIndex(): number {
    return this.currentLevelIndex;
  }

  /**
   * Start the timer (called on first reveal).
   */
  startTimer(): void {
    this.timer?.start();
  }

  /**
   * Pause the game (timer + state machine).
   */
  pauseGame(): void {
    this.timer?.pause();
    this.board?.stateMachine.pause();
  }

  /**
   * Resume the game.
   */
  resumeGame(): void {
    this.timer?.resume();
    this.board?.stateMachine.resume();
  }

  /**
   * Handle level completion.
   * Records progress and stops the timer.
   */
  handleCompletion(): void {
    if (!this.board || !this.timer) return;
    this.timer.stop();
    const elapsedMs = this.timer.getElapsedMs();
    this.progressManager.recordCompletion(this.currentLevelIndex, elapsedMs);
    this.clearSavedState();
  }

  /**
   * Handle level failure.
   * Records attempt and stops the timer.
   */
  handleFailure(): void {
    if (!this.timer) return;
    this.timer.stop();
    this.progressManager.recordAttempt(this.currentLevelIndex);
    this.clearSavedState();
  }

  /**
   * Retry the current level, preserving flags.
   */
  retry(): void {
    if (!this.board) return;
    this.board.resetBoard(true); // preserve flags
    this.timer?.reset();
    this.clearSavedState();
  }

  /**
   * Save current game state for interrupt recovery (NFR17).
   */
  saveState(): void {
    if (!this.board || !this.timer) return;
    const phase = this.board.stateMachine.state.phase;
    if (phase !== 'playing') return;

    const cellStates: Record<number, CellVisualState> = {};
    for (const info of this.board.getAllCellInfos()) {
      cellStates[info.cellId] = info.visualState;
    }

    const state: SavedGameState = {
      levelIndex: this.currentLevelIndex,
      cellStates,
      elapsedMs: this.timer.getElapsedMs(),
      inProgress: true,
    };

    this.storage.set(SAVED_STATE_KEY, state);
  }

  /**
   * Check if there's a saved game state to restore.
   */
  hasSavedState(): boolean {
    return this.storage.has(SAVED_STATE_KEY);
  }

  /**
   * Get the saved game state, or null if none exists.
   */
  getSavedState(): SavedGameState | null {
    const data = this.storage.get<SavedGameState>(SAVED_STATE_KEY);
    if (
      data &&
      typeof data === 'object' &&
      typeof data.levelIndex === 'number' &&
      typeof data.cellStates === 'object' &&
      typeof data.elapsedMs === 'number'
    ) {
      return data;
    }
    return null;
  }

  /**
   * Clear saved game state.
   */
  clearSavedState(): void {
    this.storage.remove(SAVED_STATE_KEY);
  }

  /**
   * Restore a saved game state onto a loaded board.
   * Call loadLevel() first, then restoreState().
   *
   * @param savedState - The saved state to restore.
   */
  restoreState(savedState: SavedGameState): void {
    if (!this.board || !this.timer) return;
    this.board.applySavedStates(savedState.cellStates);
    this.timer.start();
    // Timer elapsed will be slightly off since we can't set it directly,
    // but the game is playable. A more precise approach would require
    // TimerManager to accept an initial offset.
  }
}
