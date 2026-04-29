# Story 5.1: Triangle and Torus Topology Implementation

Status: done

## Summary
Implemented TriangleTopology with 3-neighbor edge-sharing adjacency and TorusTopology with 8-neighbor wrap-around Moore neighborhood. Both topologies are fully functional with correct neighbor calculations, mine placement, and flood-fill reveal logic. Registered in TopologyRegistry for runtime selection.

## Files
- src/topologies/triangle-topology.ts
- src/topologies/torus-topology.ts
- src/topologies/triangle-topology.test.ts
- src/topologies/torus-topology.test.ts
- src/topologies/topology-registry.ts (updated)
