import { describe, it, expect, afterEach } from 'vitest';
import { TopologyRegistry } from './topology-registry.js';
import { TopologyType } from './types.js';
import { HexTopology } from './hex-topology.js';
import { TriangleTopology } from './triangle-topology.js';
import { TorusTopology } from './torus-topology.js';
import { IrregularTopology } from './irregular-topology.js';
import { MixedTopology } from './mixed-topology.js';
import type { HexConfig } from './types.js';
import type { TriangleConfig } from './triangle-topology.js';
import type { TorusConfig } from './torus-topology.js';
import type { IrregularConfig } from './irregular-topology.js';
import type { MixedConfig } from './mixed-topology.js';
import { TopologyError } from '../errors/index.js';

describe('core/topology/TopologyRegistry', () => {
  // Re-register all topologies after tests that clear
  afterEach(() => {
    if (!TopologyRegistry.has(TopologyType.Hexagonal)) {
      TopologyRegistry.register(TopologyType.Hexagonal, (c) => new HexTopology(c as HexConfig));
    }
    if (!TopologyRegistry.has(TopologyType.Triangle)) {
      TopologyRegistry.register(TopologyType.Triangle, (c) => new TriangleTopology(c as TriangleConfig));
    }
    if (!TopologyRegistry.has(TopologyType.Torus)) {
      TopologyRegistry.register(TopologyType.Torus, (c) => new TorusTopology(c as TorusConfig));
    }
    if (!TopologyRegistry.has(TopologyType.Irregular)) {
      TopologyRegistry.register(TopologyType.Irregular, (c) => new IrregularTopology(c as IrregularConfig));
    }
    if (!TopologyRegistry.has(TopologyType.Mixed)) {
      TopologyRegistry.register(TopologyType.Mixed, (c) => new MixedTopology(c as MixedConfig));
    }
  });

  // --- Test 1: has() returns true after registration ---
  it('has() returns true for registered topology type', () => {
    expect(TopologyRegistry.has(TopologyType.Hexagonal)).toBe(true);
  });

  // --- Test 2: create() returns correct topology instance ---
  it('create() returns a working HexTopology instance', () => {
    const topo = TopologyRegistry.create(TopologyType.Hexagonal, { rows: 3, cols: 3 });
    expect(topo.cellCount()).toBe(9);
    expect(topo.cells()).toHaveLength(9);
    expect(topo.neighbors(4)).toHaveLength(6); // center of 3×3
  });

  // --- Test 3: create() throws for unregistered type ---
  it('create() throws TopologyError for unregistered type', () => {
    expect(() => TopologyRegistry.create(TopologyType.Triangle, {})).toThrow(TopologyError);
  });

  // --- Test 4: All built-in topologies are pre-registered ---
  it('all built-in topologies are pre-registered at module load', () => {
    expect(TopologyRegistry.has(TopologyType.Hexagonal)).toBe(true);
    expect(TopologyRegistry.has(TopologyType.Triangle)).toBe(true);
    expect(TopologyRegistry.has(TopologyType.Torus)).toBe(true);
    expect(TopologyRegistry.has(TopologyType.Irregular)).toBe(true);
    expect(TopologyRegistry.has(TopologyType.Mixed)).toBe(true);
  });

  // --- Test 5: clear() removes all registrations ---
  it('clear() removes all registrations', () => {
    TopologyRegistry.clear();
    expect(TopologyRegistry.has(TopologyType.Hexagonal)).toBe(false);
    // afterEach will re-register
  });
});
