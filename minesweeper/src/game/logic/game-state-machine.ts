import type { CellId } from '../../core/types/index.js';

/**
 * Game level state — discriminated union for exhaustive handling.
 */
export type LevelState =
  | { readonly phase: 'notStarted' }
  | { readonly phase: 'playing'; readonly startTime: number; readonly moveCount: number }
  | { readonly phase: 'paused'; readonly pauseTime: number; readonly playState: { readonly startTime: number; readonly moveCount: number } }
  | { readonly phase: 'success'; readonly completionTime: number; readonly moveCount: number }
  | { readonly phase: 'failed'; readonly mineHit: CellId; readonly moveCount: number };

/**
 * Game state machine managing level lifecycle transitions.
 *
 * Transitions:
 * - notStarted → playing (first reveal)
 * - playing → paused (pause)
 * - paused → playing (resume)
 * - playing → success (all safe cells revealed)
 * - playing → failed (mine hit)
 */
export class GameStateMachine {
  private _state: LevelState = { phase: 'notStarted' };

  /**
   * Get the current state.
   */
  get state(): LevelState {
    return this._state;
  }

  /**
   * Transition to playing state on first action.
   * No-op if already playing.
   */
  startPlaying(): void {
    if (this._state.phase === 'notStarted') {
      this._state = { phase: 'playing', startTime: Date.now(), moveCount: 0 };
    }
  }

  /**
   * Increment move count. Must be in playing state.
   */
  incrementMoves(): void {
    if (this._state.phase === 'playing') {
      this._state = { ...this._state, moveCount: this._state.moveCount + 1 };
    }
  }

  /**
   * Transition to success state.
   */
  succeed(): void {
    if (this._state.phase === 'playing') {
      const elapsed = Date.now() - this._state.startTime;
      this._state = {
        phase: 'success',
        completionTime: elapsed,
        moveCount: this._state.moveCount,
      };
    }
  }

  /**
   * Transition to failed state.
   */
  fail(mineHit: CellId): void {
    if (this._state.phase === 'playing') {
      this._state = {
        phase: 'failed',
        mineHit,
        moveCount: this._state.moveCount,
      };
    }
  }

  /**
   * Pause the game.
   */
  pause(): void {
    if (this._state.phase === 'playing') {
      this._state = {
        phase: 'paused',
        pauseTime: Date.now(),
        playState: {
          startTime: this._state.startTime,
          moveCount: this._state.moveCount,
        },
      };
    }
  }

  /**
   * Resume from pause.
   */
  resume(): void {
    if (this._state.phase === 'paused') {
      const pauseDuration = Date.now() - this._state.pauseTime;
      this._state = {
        phase: 'playing',
        startTime: this._state.playState.startTime + pauseDuration,
        moveCount: this._state.playState.moveCount,
      };
    }
  }

  /**
   * Reset to initial state.
   */
  reset(): void {
    this._state = { phase: 'notStarted' };
  }
}
