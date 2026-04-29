import { describe, it, expect } from 'vitest';
import { buildDeathReview, shouldOfferHint, getConsecutiveFailures } from './death-review.js';
import { BoardModel } from './board-model.js';
import { TopologyType } from '../../core/topology/types.js';
import type { LevelData } from '../../core/types/level.js';

import '../../core/topology/topology-registry.js';

function makeLevel(): LevelData {
  return {
    metadata: { name: 'Test', author: 'Agent', difficulty: 1 },
    topologyType: TopologyType.Hexagonal,
    topologyConfig: { rows: 3, cols: 3 },
    cells: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    adjacency: { 0: [1, 3], 1: [0, 2, 3, 4], 2: [1, 4, 5], 3: [0, 1, 4, 6], 4: [1, 2, 3, 5, 6, 7], 5: [2, 4, 7, 8], 6: [3, 4, 7], 7: [4, 5, 6, 8], 8: [5, 7] },
    minePositions: [0, 8],
    mechanismConfigs: [],
  };
}

describe('game/logic/death-review', () => {
  it('buildDeathReview returns mine positions', () => {
    const board = new BoardModel(makeLevel());
    board.reveal(4); // safe
    board.reveal(0); // mine hit
    const review = buildDeathReview(board);

    expect(review.minePositions).toContain(0);
    expect(review.minePositions).toContain(8);
    expect(review.breakPoint).toBe(0);
  });

  it('buildDeathReview identifies correct cells', () => {
    const board = new BoardModel(makeLevel());
    board.reveal(4);
    board.reveal(0); // mine
    const review = buildDeathReview(board);

    expect(review.correctCells).toContain(4);
    expect(review.correctCells).not.toContain(0);
  });

  it('fullSolution maps all cells', () => {
    const board = new BoardModel(makeLevel());
    board.reveal(0);
    const review = buildDeathReview(board);

    expect(review.fullSolution.size).toBe(9);
    expect(review.fullSolution.get(0)).toBe(true); // mine
    expect(review.fullSolution.get(4)).toBe(false); // safe
  });

  it('shouldOfferHint returns true after 3 failures', () => {
    expect(shouldOfferHint(2)).toBe(false);
    expect(shouldOfferHint(3)).toBe(true);
    expect(shouldOfferHint(5)).toBe(true);
  });

  it('getConsecutiveFailures returns attempts if not completed', () => {
    expect(getConsecutiveFailures(4, false)).toBe(4);
    expect(getConsecutiveFailures(4, true)).toBe(0);
  });
});
