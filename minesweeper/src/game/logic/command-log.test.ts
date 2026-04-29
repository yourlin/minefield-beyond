import { describe, it, expect } from 'vitest';
import { CommandLog } from './command-log.js';

describe('game/logic/CommandLog', () => {
  it('records and retrieves commands', () => {
    const log = new CommandLog();
    log.push({ action: 'reveal', cellId: 0 });
    log.push({ action: 'flag', cellId: 1 });

    expect(log.length).toBe(2);
    expect(log.getAll()).toEqual([
      { action: 'reveal', cellId: 0 },
      { action: 'flag', cellId: 1 },
    ]);
  });

  it('returns last command', () => {
    const log = new CommandLog();
    log.push({ action: 'reveal', cellId: 5 });
    expect(log.last()).toEqual({ action: 'reveal', cellId: 5 });
  });

  it('returns undefined for last() on empty log', () => {
    const log = new CommandLog();
    expect(log.last()).toBeUndefined();
  });

  it('popLast removes and returns last command', () => {
    const log = new CommandLog();
    log.push({ action: 'reveal', cellId: 0 });
    log.push({ action: 'flag', cellId: 1 });

    const cmd = log.popLast();
    expect(cmd).toEqual({ action: 'flag', cellId: 1 });
    expect(log.length).toBe(1);
  });

  it('popLast returns undefined on empty log', () => {
    const log = new CommandLog();
    expect(log.popLast()).toBeUndefined();
  });

  it('clear removes all commands', () => {
    const log = new CommandLog();
    log.push({ action: 'reveal', cellId: 0 });
    log.push({ action: 'flag', cellId: 1 });
    log.clear();
    expect(log.length).toBe(0);
    expect(log.getAll()).toEqual([]);
  });

  it('replay: recorded sequence can reconstruct state', () => {
    const log = new CommandLog();
    const actions = [
      { action: 'reveal' as const, cellId: 0 },
      { action: 'reveal' as const, cellId: 1 },
      { action: 'flag' as const, cellId: 5 },
      { action: 'reveal' as const, cellId: 2 },
    ];

    for (const a of actions) {
      log.push(a);
    }

    // Replay: verify sequence matches
    const replayed = log.getAll();
    expect(replayed).toEqual(actions);
  });
});
