import { TopologyError } from '../errors/index.js';
import type { ITopologyGraph } from './types.js';
import { TopologyType } from './types.js';
import { HexTopology } from './hex-topology.js';
import type { HexConfig } from './types.js';
import { TriangleTopology } from './triangle-topology.js';
import type { TriangleConfig } from './triangle-topology.js';
import { TorusTopology } from './torus-topology.js';
import type { TorusConfig } from './torus-topology.js';
import { IrregularTopology } from './irregular-topology.js';
import type { IrregularConfig } from './irregular-topology.js';
import { MixedTopology } from './mixed-topology.js';
import type { MixedConfig } from './mixed-topology.js';

/**
 * Factory function that creates a topology instance from a configuration object.
 */
export type TopologyFactory = (config: unknown) => ITopologyGraph;

/**
 * Global registry for topology factories.
 *
 * New topology types register themselves here. Consumers call
 * `create()` with a `TopologyType` and config to obtain an instance.
 *
 * This follows the registry/plugin pattern — adding a new topology
 * requires only implementing the interface and registering the factory,
 * without modifying existing topology code.
 */
export class TopologyRegistry {
  private static factories = new Map<TopologyType, TopologyFactory>();

  /**
   * Register a factory for a topology type.
   *
   * @param type - The topology type key.
   * @param factory - Factory function that creates the topology.
   */
  static register(type: TopologyType, factory: TopologyFactory): void {
    TopologyRegistry.factories.set(type, factory);
  }

  /**
   * Create a topology instance.
   *
   * @param type - The topology type to create.
   * @param config - Configuration passed to the factory.
   * @throws {TopologyError} If no factory is registered for the given type.
   */
  static create(type: TopologyType, config: unknown): ITopologyGraph {
    const factory = TopologyRegistry.factories.get(type);
    if (!factory) {
      throw new TopologyError(`TopologyRegistry: unknown topology type '${type}'`);
    }
    return factory(config);
  }

  /**
   * Check whether a factory is registered for the given type.
   *
   * @param type - The topology type to check.
   */
  static has(type: TopologyType): boolean {
    return TopologyRegistry.factories.has(type);
  }

  /**
   * Remove all registered factories. Useful for test isolation.
   */
  static clear(): void {
    TopologyRegistry.factories.clear();
  }
}

// Register built-in topologies
TopologyRegistry.register(
  TopologyType.Hexagonal,
  (config) => new HexTopology(config as HexConfig),
);

TopologyRegistry.register(
  TopologyType.Triangle,
  (config) => new TriangleTopology(config as TriangleConfig),
);

TopologyRegistry.register(
  TopologyType.Torus,
  (config) => new TorusTopology(config as TorusConfig),
);

TopologyRegistry.register(
  TopologyType.Irregular,
  (config) => new IrregularTopology(config as IrregularConfig),
);

TopologyRegistry.register(
  TopologyType.Mixed,
  (config) => new MixedTopology(config as MixedConfig),
);
