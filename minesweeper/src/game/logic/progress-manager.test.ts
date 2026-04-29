import { describe, it, expect } from 'vitest';
import { ProgressManager } from './progress-manager.js';
import { MemoryStorage } from './storage.js';

describe('game/logic/ProgressManager', () => {
  it('returns default progress with only level 1 unlocked', () => {
    const pm = new ProgressManager(new MemoryStorage());
    const progress = pm.getProgress();

    expect(progress.levels).toHaveLength(30);
    expect(progress.levels[0].unlocked).toBe(true);
    expect(progress.levels[1].unlocked).toBe(false);
    expect(progress.levels[0].completed).toBe(false);
  });

  it('records completion and unlocks next level', () => {
    const pm = new ProgressManager(new MemoryStorage());
    pm.recordCompletion(0, 5000);

    const progress = pm.getProgress();
    expect(progress.levels[0].completed).toBe(true);
    expect(progress.levels[0].bestTime).toBe(5000);
    expect(progress.levels[0].attempts).toBe(1);
    expect(progress.levels[1].unlocked).toBe(true);
  });

  it('updates best time on faster completion', () => {
    const pm = new ProgressManager(new MemoryStorage());
    pm.recordCompletion(0, 5000);
    pm.recordCompletion(0, 3000);

    expect(pm.getLevelProgress(0).bestTime).toBe(3000);
    expect(pm.getLevelProgress(0).attempts).toBe(2);
  });

  it('does not overwrite best time with slower completion', () => {
    const pm = new ProgressManager(new MemoryStorage());
    pm.recordCompletion(0, 3000);
    pm.recordCompletion(0, 5000);

    expect(pm.getLevelProgress(0).bestTime).toBe(3000);
  });

  it('records attempt on failure', () => {
    const pm = new ProgressManager(new MemoryStorage());
    pm.recordAttempt(0);
    pm.recordAttempt(0);

    expect(pm.getLevelProgress(0).attempts).toBe(2);
    expect(pm.getLevelProgress(0).completed).toBe(false);
  });

  it('degrades to defaults on corrupted data', () => {
    const storage = new MemoryStorage();
    storage.set('progress', 'not valid progress');
    const pm = new ProgressManager(storage);

    const progress = pm.getProgress();
    expect(progress.levels).toHaveLength(30);
    expect(progress.levels[0].unlocked).toBe(true);
  });

  it('degrades to defaults on missing data', () => {
    const pm = new ProgressManager(new MemoryStorage());
    const progress = pm.getProgress();
    expect(progress.levels[0].unlocked).toBe(true);
  });

  it('saves and loads settings', () => {
    const pm = new ProgressManager(new MemoryStorage());
    pm.saveSettings({ soundEnabled: false, reducedMotion: true });

    const settings = pm.getSettings();
    expect(settings.soundEnabled).toBe(false);
    expect(settings.reducedMotion).toBe(true);
  });

  it('returns default settings when none saved', () => {
    const pm = new ProgressManager(new MemoryStorage());
    const settings = pm.getSettings();
    expect(settings.soundEnabled).toBe(true);
    expect(settings.reducedMotion).toBe(false);
  });

  it('resetProgress restores defaults', () => {
    const pm = new ProgressManager(new MemoryStorage());
    pm.recordCompletion(0, 5000);
    pm.recordCompletion(1, 8000);
    pm.resetProgress();

    const progress = pm.getProgress();
    expect(progress.levels[0].completed).toBe(false);
    expect(progress.levels[1].unlocked).toBe(false);
  });

  it('does not crash when completing last level', () => {
    const pm = new ProgressManager(new MemoryStorage());
    for (let i = 0; i < 29; i++) {
      pm.recordCompletion(i, 1000);
    }
    pm.recordCompletion(29, 2000);
    expect(pm.getLevelProgress(29).completed).toBe(true);
  });
});
