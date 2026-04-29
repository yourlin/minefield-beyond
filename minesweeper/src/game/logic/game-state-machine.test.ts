import { describe, it, expect } from 'vitest';
import { GameStateMachine } from './game-state-machine.js';

describe('game/logic/GameStateMachine', () => {
  it('starts in notStarted phase', () => {
    const sm = new GameStateMachine();
    expect(sm.state.phase).toBe('notStarted');
  });

  it('transitions to playing on startPlaying()', () => {
    const sm = new GameStateMachine();
    sm.startPlaying();
    expect(sm.state.phase).toBe('playing');
  });

  it('increments move count', () => {
    const sm = new GameStateMachine();
    sm.startPlaying();
    sm.incrementMoves();
    sm.incrementMoves();
    expect(sm.state.phase === 'playing' && sm.state.moveCount).toBe(2);
  });

  it('transitions to success', () => {
    const sm = new GameStateMachine();
    sm.startPlaying();
    sm.succeed();
    expect(sm.state.phase).toBe('success');
  });

  it('transitions to failed with mine cell', () => {
    const sm = new GameStateMachine();
    sm.startPlaying();
    sm.fail(42);
    expect(sm.state.phase).toBe('failed');
    if (sm.state.phase === 'failed') {
      expect(sm.state.mineHit).toBe(42);
    }
  });

  it('transitions to paused and back', () => {
    const sm = new GameStateMachine();
    sm.startPlaying();
    sm.incrementMoves();
    sm.pause();
    expect(sm.state.phase).toBe('paused');
    sm.resume();
    expect(sm.state.phase).toBe('playing');
    if (sm.state.phase === 'playing') {
      expect(sm.state.moveCount).toBe(1);
    }
  });

  it('resets to notStarted', () => {
    const sm = new GameStateMachine();
    sm.startPlaying();
    sm.fail(0);
    sm.reset();
    expect(sm.state.phase).toBe('notStarted');
  });

  it('ignores startPlaying when already playing', () => {
    const sm = new GameStateMachine();
    sm.startPlaying();
    sm.incrementMoves();
    sm.startPlaying(); // should be no-op
    if (sm.state.phase === 'playing') {
      expect(sm.state.moveCount).toBe(1);
    }
  });
});
