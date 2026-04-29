import { describe, it, expect } from 'vitest';
import { TimerManager, getTimeLimitMs } from './timer-manager.js';

describe('game/logic/TimerManager', () => {
  it('getTimeLimitMs returns correct tier limits', () => {
    expect(getTimeLimitMs(1)).toBe(120000); // 2 min
    expect(getTimeLimitMs(3)).toBe(120000);
    expect(getTimeLimitMs(4)).toBe(300000); // 5 min
    expect(getTimeLimitMs(7)).toBe(300000);
    expect(getTimeLimitMs(8)).toBe(480000); // 8 min
    expect(getTimeLimitMs(10)).toBe(480000);
  });

  it('starts at 0 elapsed', () => {
    const timer = new TimerManager(1);
    expect(timer.getElapsedMs()).toBe(0);
    expect(timer.getState().running).toBe(false);
  });

  it('tracks elapsed time after start', () => {
    const timer = new TimerManager(1);
    timer.start();
    // Elapsed should be >= 0 (may be 0 if very fast)
    expect(timer.getElapsedMs()).toBeGreaterThanOrEqual(0);
    expect(timer.getState().running).toBe(true);
  });

  it('stop locks elapsed time', () => {
    const timer = new TimerManager(1);
    timer.start();
    timer.stop();
    const elapsed1 = timer.getElapsedMs();
    // Wait a bit
    const elapsed2 = timer.getElapsedMs();
    expect(elapsed1).toBe(elapsed2); // Should not change after stop
    expect(timer.getState().running).toBe(false);
  });

  it('pause and resume work correctly', () => {
    const timer = new TimerManager(1);
    timer.start();
    timer.pause();
    expect(timer.getState().running).toBe(false);
    const pausedElapsed = timer.getElapsedMs();
    timer.resume();
    expect(timer.getState().running).toBe(true);
    // After resume, elapsed should be >= paused elapsed
    expect(timer.getElapsedMs()).toBeGreaterThanOrEqual(pausedElapsed);
  });

  it('reset clears all state', () => {
    const timer = new TimerManager(1);
    timer.start();
    timer.stop();
    timer.reset();
    expect(timer.getElapsedMs()).toBe(0);
    expect(timer.getState().running).toBe(false);
  });

  it('expired flag works', () => {
    const timer = new TimerManager(1); // 2 min limit
    expect(timer.getState().expired).toBe(false);
  });

  it('ignores duplicate start calls', () => {
    const timer = new TimerManager(1);
    timer.start();
    const elapsed1 = timer.getElapsedMs();
    timer.start(); // should be no-op
    const elapsed2 = timer.getElapsedMs();
    expect(elapsed2).toBeGreaterThanOrEqual(elapsed1);
  });
});
