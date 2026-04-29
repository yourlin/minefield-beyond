import type { CellId } from '../types/index.js';
import type { ITopologyGraph } from '../topology/types.js';
import type { CellConstraintValue } from './types.js';

/**
 * A connected component of unknown cells that share constraints.
 */
export interface Component {
  /** Unknown cells in this component. */
  readonly unknownCells: readonly CellId[];
  /** Revealed cells that constrain this component. */
  readonly revealedCells: ReadonlyMap<CellId, CellConstraintValue>;
}

/**
 * Split unknown cells into independent connected components.
 *
 * Two unknown cells belong to the same component if they share
 * at least one revealed constraint cell as a neighbor, or are
 * transitively connected through other unknown cells that share
 * constraint neighbors.
 *
 * @param topology - The topology graph.
 * @param revealedCells - Revealed cells with their constraint values.
 * @param unknownCells - Cells whose mine/safe status is unknown.
 * @returns Array of independent components.
 */
export function findConnectedComponents(
  topology: ITopologyGraph,
  revealedCells: ReadonlyMap<CellId, CellConstraintValue>,
  unknownCells: readonly CellId[],
): Component[] {
  if (unknownCells.length === 0) {
    return [];
  }

  const unknownSet = new Set(unknownCells);
  const visited = new Set<CellId>();
  const components: Component[] = [];

  // Build a mapping: unknown cell → set of revealed constraint neighbors
  const unknownToRevealed = new Map<CellId, CellId[]>();
  for (const cellId of unknownCells) {
    const revealedNeighbors: CellId[] = [];
    for (const n of topology.neighbors(cellId)) {
      if (revealedCells.has(n)) {
        revealedNeighbors.push(n);
      }
    }
    unknownToRevealed.set(cellId, revealedNeighbors);
  }

  // Build a mapping: revealed cell → set of unknown neighbors
  const revealedToUnknown = new Map<CellId, CellId[]>();
  for (const [cellId] of revealedCells) {
    const unknownNeighbors: CellId[] = [];
    for (const n of topology.neighbors(cellId)) {
      if (unknownSet.has(n)) {
        unknownNeighbors.push(n);
      }
    }
    if (unknownNeighbors.length > 0) {
      revealedToUnknown.set(cellId, unknownNeighbors);
    }
  }

  // BFS to find connected components
  for (const startCell of unknownCells) {
    if (visited.has(startCell)) {
      continue;
    }

    const componentUnknowns: CellId[] = [];
    const componentRevealed = new Set<CellId>();
    const queue: CellId[] = [startCell];
    visited.add(startCell);

    while (queue.length > 0) {
      const cell = queue.shift()!;
      componentUnknowns.push(cell);

      // Find revealed neighbors of this unknown cell
      const revealedNeighbors = unknownToRevealed.get(cell) ?? [];
      for (const revealedId of revealedNeighbors) {
        componentRevealed.add(revealedId);

        // Find other unknown neighbors of this revealed cell
        const otherUnknowns = revealedToUnknown.get(revealedId) ?? [];
        for (const otherUnknown of otherUnknowns) {
          if (!visited.has(otherUnknown)) {
            visited.add(otherUnknown);
            queue.push(otherUnknown);
          }
        }
      }

      // Also connect through direct unknown-unknown adjacency
      for (const n of topology.neighbors(cell)) {
        if (unknownSet.has(n) && !visited.has(n)) {
          visited.add(n);
          queue.push(n);
        }
      }
    }

    // Build the revealed cells map for this component
    const componentRevealedMap = new Map<CellId, CellConstraintValue>();
    for (const revealedId of componentRevealed) {
      const value = revealedCells.get(revealedId);
      if (value !== undefined) {
        componentRevealedMap.set(revealedId, value);
      }
    }

    components.push({
      unknownCells: componentUnknowns,
      revealedCells: componentRevealedMap,
    });
  }

  return components;
}
