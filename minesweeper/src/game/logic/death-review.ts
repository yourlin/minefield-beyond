import type { CellId } from '../../core/types/index.js';
import type { BoardModel } from './board-model.js';

/**
 * Death review step — progressive reveal of what went wrong.
 */
export type DeathReviewStep = 1 | 2 | 3 | 4;

/**
 * Data for each death review step.
 */
export interface DeathReviewData {
  /** Step 1: Mine positions. */
  readonly minePositions: readonly CellId[];
  /** Step 2: Cells the player correctly identified (revealed safe cells). */
  readonly correctCells: readonly CellId[];
  /** Step 3: The cell where reasoning broke down (the mine that was hit). */
  readonly breakPoint: CellId;
  /** Step 4: Full solution — all cells with their mine/safe status. */
  readonly fullSolution: ReadonlyMap<CellId, boolean>;
}

/**
 * Build death review data from a failed board state.
 */
export function buildDeathReview(board: BoardModel): DeathReviewData {
  const level = board.level;
  const mineSet = new Set(level.minePositions);

  // Step 1: Mine positions
  const minePositions = [...level.minePositions];

  // Step 2: Correctly revealed safe cells
  const correctCells: CellId[] = [];
  for (const info of board.getAllCellInfos()) {
    if (info.visualState === 'revealed' && !info.isMine) {
      correctCells.push(info.cellId);
    }
  }

  // Step 3: Break point — the mine that was hit
  const state = board.stateMachine.state;
  const breakPoint = state.phase === 'failed' ? state.mineHit : minePositions[0];

  // Step 4: Full solution
  const fullSolution = new Map<CellId, boolean>();
  for (const cellId of level.cells) {
    fullSolution.set(cellId, mineSet.has(cellId));
  }

  return { minePositions, correctCells, breakPoint, fullSolution };
}

/**
 * Get the number of consecutive failures for a level.
 */
export function getConsecutiveFailures(
  attempts: number,
  completed: boolean,
): number {
  // If never completed, all attempts are failures
  // If completed before, only count attempts since last completion
  // Simplified: just return attempts if not completed
  return completed ? 0 : attempts;
}

/**
 * Check if the player should be offered a hint (3+ consecutive failures).
 */
export function shouldOfferHint(consecutiveFailures: number): boolean {
  return consecutiveFailures >= 3;
}
