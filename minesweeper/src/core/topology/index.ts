// core/topology — barrel file
// Topology abstraction interfaces and implementations

export type { ITopologyGraph, ITopologyRenderer, HexConfig } from './types.js';
export { TopologyType } from './types.js';
export type { CellShape } from './types.js';
export { HexTopology } from './hex-topology.js';
export { TriangleTopology } from './triangle-topology.js';
export type { TriangleConfig } from './triangle-topology.js';
export { TorusTopology } from './torus-topology.js';
export type { TorusConfig } from './torus-topology.js';
export { IrregularTopology } from './irregular-topology.js';
export type { IrregularConfig } from './irregular-topology.js';
export { MixedTopology } from './mixed-topology.js';
export type { MixedConfig } from './mixed-topology.js';
export { TopologyRegistry } from './topology-registry.js';
export type { TopologyFactory } from './topology-registry.js';
