import { describe, it, expect } from 'vitest';
import { TutorialManager } from './tutorial-manager.js';
import { MemoryStorage } from './storage.js';
import { TopologyType } from '../../core/topology/types.js';
import { MechanismType } from '../../core/mechanism/types.js';

describe('game/logic/TutorialManager', () => {
  it('needs tutorial for unseen topology', () => {
    const tm = new TutorialManager(new MemoryStorage());
    expect(tm.needsTopologyTutorial(TopologyType.Hexagonal)).toBe(true);
  });

  it('does not need tutorial after marking seen', () => {
    const tm = new TutorialManager(new MemoryStorage());
    tm.markTopologySeen(TopologyType.Hexagonal);
    expect(tm.needsTopologyTutorial(TopologyType.Hexagonal)).toBe(false);
  });

  it('persists across instances', () => {
    const storage = new MemoryStorage();
    const tm1 = new TutorialManager(storage);
    tm1.markTopologySeen(TopologyType.Triangle);

    const tm2 = new TutorialManager(storage);
    expect(tm2.needsTopologyTutorial(TopologyType.Triangle)).toBe(false);
  });

  it('tracks mechanism tutorials separately', () => {
    const tm = new TutorialManager(new MemoryStorage());
    tm.markMechanismSeen(MechanismType.FuzzyHint);
    expect(tm.needsMechanismTutorial(MechanismType.FuzzyHint)).toBe(false);
    expect(tm.needsMechanismTutorial(MechanismType.DelayedReveal)).toBe(true);
  });

  it('skipAll marks everything as skipped', () => {
    const tm = new TutorialManager(new MemoryStorage());
    tm.skipAll();
    expect(tm.isAllSkipped()).toBe(true);
  });
});
