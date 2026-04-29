import type { IStorage } from './storage.js';
import type { TopologyType } from '../../core/topology/types.js';
import type { MechanismType } from '../../core/mechanism/types.js';

/** Storage key for tutorial completion state. */
const TUTORIAL_KEY = 'tutorial_seen';

/**
 * Tracks which tutorials the player has seen.
 * Persists to storage so tutorials don't repeat.
 */
export class TutorialManager {
  private seen: Set<string>;

  constructor(private readonly storage: IStorage) {
    const data = storage.get<string[]>(TUTORIAL_KEY);
    this.seen = new Set(Array.isArray(data) ? data : []);
  }

  /**
   * Check if the player needs a tutorial for this topology type.
   */
  needsTopologyTutorial(type: TopologyType): boolean {
    return !this.seen.has(`topo:${type}`);
  }

  /**
   * Check if the player needs a tutorial for this mechanism type.
   */
  needsMechanismTutorial(type: MechanismType): boolean {
    return !this.seen.has(`mech:${type}`);
  }

  /**
   * Mark a topology tutorial as seen.
   */
  markTopologySeen(type: TopologyType): void {
    this.seen.add(`topo:${type}`);
    this.save();
  }

  /**
   * Mark a mechanism tutorial as seen.
   */
  markMechanismSeen(type: MechanismType): void {
    this.seen.add(`mech:${type}`);
    this.save();
  }

  /**
   * Skip all tutorials.
   */
  skipAll(): void {
    // Mark all known types as seen
    this.seen.add('skip_all');
    this.save();
  }

  /**
   * Check if all tutorials are skipped.
   */
  isAllSkipped(): boolean {
    return this.seen.has('skip_all');
  }

  private save(): void {
    this.storage.set(TUTORIAL_KEY, [...this.seen]);
  }
}
