import { describe, it, expect } from 'vitest';
import { MinesweeperError } from './base-error.js';
import { TopologyError } from './topology-error.js';
import { LevelLoadError } from './level-load-error.js';
import { SolverError } from './solver-error.js';
import { StorageError } from './storage-error.js';

describe('core/errors/MinesweeperError hierarchy', () => {
  it('TopologyError has correct name, code, and message', () => {
    const err = new TopologyError('invalid cell');
    expect(err.name).toBe('TopologyError');
    expect(err.code).toBe('TOPOLOGY_ERROR');
    expect(err.message).toBe('invalid cell');
  });

  it('LevelLoadError has correct name, code, and message', () => {
    const err = new LevelLoadError('bad format');
    expect(err.name).toBe('LevelLoadError');
    expect(err.code).toBe('LEVEL_LOAD_ERROR');
    expect(err.message).toBe('bad format');
  });

  it('SolverError has correct name, code, and message', () => {
    const err = new SolverError('no solution');
    expect(err.name).toBe('SolverError');
    expect(err.code).toBe('SOLVER_ERROR');
    expect(err.message).toBe('no solution');
  });

  it('StorageError has correct name, code, and message', () => {
    const err = new StorageError('quota exceeded');
    expect(err.name).toBe('StorageError');
    expect(err.code).toBe('STORAGE_ERROR');
    expect(err.message).toBe('quota exceeded');
  });

  it('all subclasses are instanceof MinesweeperError and Error', () => {
    const errors = [
      new TopologyError('t'),
      new LevelLoadError('l'),
      new SolverError('s'),
      new StorageError('st'),
    ];

    for (const err of errors) {
      expect(err).toBeInstanceOf(MinesweeperError);
      expect(err).toBeInstanceOf(Error);
    }
  });

  it('each subclass is not instanceof the other subclasses', () => {
    const topology = new TopologyError('t');
    expect(topology).not.toBeInstanceOf(LevelLoadError);
    expect(topology).not.toBeInstanceOf(SolverError);
    expect(topology).not.toBeInstanceOf(StorageError);
  });
});
