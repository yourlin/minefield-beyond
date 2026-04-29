/**
 * Timer tier configuration.
 *
 * Levels 1-3: tutorial (2 min), 4-7: mid (5 min), 8-10: hardcore (8 min).
 */
const TIER_LIMITS: readonly { readonly maxLevel: number; readonly limitMs: number }[] = [
  { maxLevel: 3, limitMs: 2 * 60 * 1000 },
  { maxLevel: 7, limitMs: 5 * 60 * 1000 },
  { maxLevel: 10, limitMs: 8 * 60 * 1000 },
];

/**
 * Get the time limit for a level (1-indexed).
 */
export function getTimeLimitMs(levelNumber: number): number {
  for (const tier of TIER_LIMITS) {
    if (levelNumber <= tier.maxLevel) {
      return tier.limitMs;
    }
  }
  return TIER_LIMITS[TIER_LIMITS.length - 1].limitMs;
}

/**
 * Timer state.
 */
export interface TimerState {
  /** Whether the timer is running. */
  readonly running: boolean;
  /** Elapsed time in milliseconds. */
  readonly elapsedMs: number;
  /** Time limit in milliseconds. */
  readonly limitMs: number;
  /** Whether the time limit has been exceeded. */
  readonly expired: boolean;
}

/**
 * Game timer with pause/resume support.
 *
 * Uses wall-clock time for accuracy. Pause subtracts
 * pause duration from the effective start time.
 */
export class TimerManager {
  private startTime: number | null = null;
  private pauseTime: number | null = null;
  private totalPausedMs = 0;
  private stopped = false;
  private finalElapsed: number | null = null;
  readonly limitMs: number;

  constructor(levelNumber: number) {
    this.limitMs = getTimeLimitMs(levelNumber);
  }

  /**
   * Start the timer.
   */
  start(): void {
    if (this.startTime !== null) return;
    this.startTime = Date.now();
    this.stopped = false;
  }

  /**
   * Pause the timer.
   */
  pause(): void {
    if (this.startTime === null || this.pauseTime !== null || this.stopped) return;
    this.pauseTime = Date.now();
  }

  /**
   * Resume the timer.
   */
  resume(): void {
    if (this.pauseTime === null || this.stopped) return;
    this.totalPausedMs += Date.now() - this.pauseTime;
    this.pauseTime = null;
  }

  /**
   * Stop the timer and lock the elapsed time.
   */
  stop(): void {
    if (this.stopped || this.startTime === null) return;
    this.finalElapsed = this.getElapsedMs();
    this.stopped = true;
  }

  /**
   * Get the current elapsed time in milliseconds.
   */
  getElapsedMs(): number {
    if (this.finalElapsed !== null) return this.finalElapsed;
    if (this.startTime === null) return 0;
    const now = this.pauseTime ?? Date.now();
    return Math.max(0, now - this.startTime - this.totalPausedMs);
  }

  /**
   * Get the full timer state.
   */
  getState(): TimerState {
    const elapsedMs = this.getElapsedMs();
    return {
      running: this.startTime !== null && this.pauseTime === null && !this.stopped,
      elapsedMs,
      limitMs: this.limitMs,
      expired: elapsedMs >= this.limitMs,
    };
  }

  /**
   * Reset the timer.
   */
  reset(): void {
    this.startTime = null;
    this.pauseTime = null;
    this.totalPausedMs = 0;
    this.stopped = false;
    this.finalElapsed = null;
  }
}
