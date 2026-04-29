import type { IStorage } from './storage.js';

/** Total number of levels in the game. */
const TOTAL_LEVELS = 30;

/** Storage key for progress data. */
const PROGRESS_KEY = 'progress';

/** Storage key for settings. */
const SETTINGS_KEY = 'settings';

/**
 * Per-level progress data.
 */
export interface LevelProgress {
  /** Whether this level is unlocked. */
  readonly unlocked: boolean;
  /** Whether this level has been completed. */
  readonly completed: boolean;
  /** Best completion time in milliseconds (null if never completed). */
  readonly bestTime: number | null;
  /** Total number of attempts. */
  readonly attempts: number;
}

/**
 * Full progress data for all levels.
 */
export interface GameProgress {
  readonly levels: readonly LevelProgress[];
}

/**
 * User settings.
 */
export interface GameSettings {
  readonly soundEnabled: boolean;
  readonly reducedMotion: boolean;
}

/**
 * Default progress: only level 1 unlocked.
 */
function defaultProgress(): GameProgress {
  const levels: LevelProgress[] = [];
  for (let i = 0; i < TOTAL_LEVELS; i++) {
    levels.push({
      unlocked: i === 0,
      completed: false,
      bestTime: null,
      attempts: 0,
    });
  }
  return { levels };
}

/**
 * Default settings.
 */
function defaultSettings(): GameSettings {
  return { soundEnabled: true, reducedMotion: false };
}

/**
 * Validates that a progress object has the expected shape.
 */
function isValidProgress(data: unknown): data is GameProgress {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  if (!Array.isArray(obj.levels)) return false;
  if (obj.levels.length !== TOTAL_LEVELS) return false;
  for (const level of obj.levels) {
    if (typeof level !== 'object' || level === null) return false;
    const l = level as Record<string, unknown>;
    if (typeof l.unlocked !== 'boolean') return false;
    if (typeof l.completed !== 'boolean') return false;
    if (typeof l.attempts !== 'number') return false;
    if (l.bestTime !== null && typeof l.bestTime !== 'number') return false;
  }
  return true;
}

/**
 * Type-safe progress and settings manager.
 *
 * Wraps IStorage with domain-specific read/write methods.
 * Gracefully degrades to defaults on corrupted data (NFR15).
 */
export class ProgressManager {
  constructor(private readonly storage: IStorage) {}

  /**
   * Load progress, falling back to defaults on corruption.
   */
  getProgress(): GameProgress {
    const data = this.storage.get<GameProgress>(PROGRESS_KEY);
    if (data && isValidProgress(data)) {
      return data;
    }
    // Corrupted or missing — return defaults
    return defaultProgress();
  }

  /**
   * Save progress.
   */
  saveProgress(progress: GameProgress): void {
    this.storage.set(PROGRESS_KEY, progress);
  }

  /**
   * Get progress for a specific level (0-indexed).
   */
  getLevelProgress(levelIndex: number): LevelProgress {
    const progress = this.getProgress();
    return progress.levels[levelIndex] ?? {
      unlocked: false,
      completed: false,
      bestTime: null,
      attempts: 0,
    };
  }

  /**
   * Record a level completion.
   * Updates best time, marks as completed, unlocks next level.
   */
  recordCompletion(levelIndex: number, timeMs: number): void {
    if (levelIndex < 0 || levelIndex >= TOTAL_LEVELS) return;

    const progress = this.getProgress();
    const levels = [...progress.levels.map((l) => ({ ...l }))];

    const current = levels[levelIndex];
    levels[levelIndex] = {
      ...current,
      completed: true,
      bestTime:
        current.bestTime === null
          ? timeMs
          : Math.min(current.bestTime, timeMs),
      attempts: current.attempts + 1,
    };

    // Unlock next level
    if (levelIndex + 1 < TOTAL_LEVELS) {
      levels[levelIndex + 1] = {
        ...levels[levelIndex + 1],
        unlocked: true,
      };
    }

    this.saveProgress({ levels });
  }

  /**
   * Record a level attempt (failure).
   */
  recordAttempt(levelIndex: number): void {
    if (levelIndex < 0 || levelIndex >= TOTAL_LEVELS) return;

    const progress = this.getProgress();
    const levels = [...progress.levels.map((l) => ({ ...l }))];

    levels[levelIndex] = {
      ...levels[levelIndex],
      attempts: levels[levelIndex].attempts + 1,
    };

    this.saveProgress({ levels });
  }

  /**
   * Load settings, falling back to defaults.
   */
  getSettings(): GameSettings {
    const data = this.storage.get<GameSettings>(SETTINGS_KEY);
    if (
      data &&
      typeof data === 'object' &&
      typeof data.soundEnabled === 'boolean'
    ) {
      return {
        soundEnabled: data.soundEnabled,
        reducedMotion: data.reducedMotion ?? false,
      };
    }
    return defaultSettings();
  }

  /**
   * Save settings.
   */
  saveSettings(settings: GameSettings): void {
    this.storage.set(SETTINGS_KEY, settings);
  }

  /**
   * Reset all progress to defaults.
   */
  resetProgress(): void {
    this.saveProgress(defaultProgress());
  }
}
