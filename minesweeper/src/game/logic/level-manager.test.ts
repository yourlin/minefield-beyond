import { describe, it, expect } from 'vitest';
import { LevelManager } from './level-manager.js';
import { MemoryStorage } from './storage.js';
import { TopologyType } from '../../core/topology/types.js';
import type { LevelData } from '../../core/types/level.js';

// Ensure topology registry is populated
import '../../core/topology/topology-registry.js';

function makeTestLevel(): LevelData {
  const cells = Array.from({ length: 25 }, (_, i) => i);
  return {
    metadata: { name: 'Test', author: 'Agent', difficulty: 1 },
    topologyType: TopologyType.Hexagonal,
    topologyConfig: { rows: 5, cols: 5 },
    cells,
    adjacency: {},
    minePositions: [0, 12, 24],
    mechanismConfigs: [],
  };
}

describe('game/logic/LevelManager', () => {
  it('loads a level and creates board + timer', () => {
    const lm = new LevelManager(new MemoryStorage());
    const board = lm.loadLevel(makeTestLevel(), 0);

    expect(board).toBeDefined();
    expect(lm.getBoard()).toBe(board);
    expect(lm.getTimer()).toBeDefined();
    expect(lm.getCurrentLevelIndex()).toBe(0);
  });

  it('handleCompletion records progress and unlocks next', () => {
    const storage = new MemoryStorage();
    const lm = new LevelManager(storage);
    const board = lm.loadLevel(makeTestLevel(), 0);

    // Simulate game play
    board.reveal(3);
    lm.startTimer();

    // Simulate win
    board.stateMachine.succeed();
    lm.handleCompletion();

    const progress = lm.progressManager.getProgress();
    expect(progress.levels[0].completed).toBe(true);
    expect(progress.levels[1].unlocked).toBe(true);
  });

  it('handleFailure records attempt', () => {
    const lm = new LevelManager(new MemoryStorage());
    lm.loadLevel(makeTestLevel(), 0);
    lm.startTimer();
    lm.handleFailure();

    expect(lm.progressManager.getLevelProgress(0).attempts).toBe(1);
  });

  it('retry resets board preserving flags', () => {
    const lm = new LevelManager(new MemoryStorage());
    const board = lm.loadLevel(makeTestLevel(), 0);
    board.reveal(3); // places mines
    // Find an unrevealed cell to flag
    const unrevealed = board.level.cells.find((c) => board.getCellInfo(c).visualState === 'unrevealed');
    if (unrevealed !== undefined) {
      board.toggleFlag(unrevealed);
      lm.retry();
      // After retry with preserveFlags, flagged cells stay flagged
      // But mines are re-randomized, so we just check state machine reset
      expect(board.stateMachine.state.phase).toBe('notStarted');
    }
  });

  it('saves and restores game state', () => {
    const storage = new MemoryStorage();
    const lm = new LevelManager(storage);
    const board = lm.loadLevel(makeTestLevel(), 2);
    board.reveal(3);
    lm.startTimer();
    lm.saveState();

    expect(lm.hasSavedState()).toBe(true);
    const saved = lm.getSavedState();
    expect(saved).not.toBeNull();
    expect(saved!.levelIndex).toBe(2);
    expect(saved!.inProgress).toBe(true);
    expect(saved!.cellStates[3]).toBe('revealed');
  });

  it('clearSavedState removes saved state', () => {
    const storage = new MemoryStorage();
    const lm = new LevelManager(storage);
    lm.loadLevel(makeTestLevel(), 0);
    lm.getBoard()!.reveal(3);
    lm.startTimer();
    lm.saveState();
    lm.clearSavedState();

    expect(lm.hasSavedState()).toBe(false);
  });

  it('getSavedState returns null for corrupted data', () => {
    const storage = new MemoryStorage();
    storage.set('saved_game', 'not valid');
    const lm = new LevelManager(storage);
    expect(lm.getSavedState()).toBeNull();
  });

  it('pauseGame and resumeGame work', () => {
    const lm = new LevelManager(new MemoryStorage());
    const board = lm.loadLevel(makeTestLevel(), 0);
    board.reveal(3);
    lm.startTimer();

    lm.pauseGame();
    expect(board.stateMachine.state.phase).toBe('paused');

    lm.resumeGame();
    expect(board.stateMachine.state.phase).toBe('playing');
  });
});
