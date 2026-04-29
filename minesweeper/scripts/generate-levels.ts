/**
 * Level generation using cube coordinates for mathematically exact hex shapes.
 *
 * Shapes are defined in cube coordinate space (q, r, s where q+r+s=0),
 * then converted to offset coordinates for storage.
 *
 * Reference: https://www.redblobgames.com/grids/hexagons/
 *
 * Usage: npx tsx scripts/generate-levels.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as url from 'node:url';
import { HexTopology } from '../src/core/topology/hex-topology.js';
import { TorusTopology } from '../src/core/topology/torus-topology.js';
import { TriangleTopology } from '../src/core/topology/triangle-topology.js';
import { BinaryLevelCodec } from '../src/core/binary/binary-codec.js';
import { TopologyType } from '../src/core/topology/types.js';
import type { ITopologyGraph } from '../src/core/topology/types.js';
import type { LevelData } from '../src/core/types/level.js';

import '../src/core/topology/topology-registry.js';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

// ============================================================
// Cube coordinate hex shapes
// ============================================================

interface CubeCoord { q: number; r: number; s: number; }

/** Generate all hexes within radius N of origin (hexagonal shape). */
function hexagonShape(N: number): CubeCoord[] {
  const results: CubeCoord[] = [];
  for (let q = -N; q <= N; q++) {
    for (let r = Math.max(-N, -q - N); r <= Math.min(N, -q + N); r++) {
      results.push({ q, r, s: -q - r });
    }
  }
  return results;
}

/** Diamond/rhombus: |q| + |r| <= N */
function diamondShape(N: number): CubeCoord[] {
  const results: CubeCoord[] = [];
  for (let q = -N; q <= N; q++) {
    for (let r = -N; r <= N; r++) {
      const s = -q - r;
      if (Math.abs(q) + Math.abs(r) + Math.abs(s) <= 2 * N) {
        // This is actually the same as hexagon. Use a different metric:
        // Diamond in offset space = |q| + |r| <= N
        if (Math.abs(q) + Math.abs(r) <= N) {
          results.push({ q, r, s: -q - r });
        }
      }
    }
  }
  return results;
}

/** Triangle pointing down: q >= 0, r >= 0, s >= -N */
function triangleShape(N: number): CubeCoord[] {
  const results: CubeCoord[] = [];
  for (let q = 0; q <= N; q++) {
    for (let r = 0; r <= N - q; r++) {
      results.push({ q, r, s: -q - r });
    }
  }
  return results;
}

/** Inverted triangle: q <= 0, r <= 0, s <= N */
function invertedTriangleShape(N: number): CubeCoord[] {
  const results: CubeCoord[] = [];
  for (let q = -N; q <= 0; q++) {
    for (let r = -N - q; r <= 0; r++) {
      results.push({ q, r, s: -q - r });
    }
  }
  return results;
}

/** Hourglass: two triangles joined at tips */
function hourglassShape(N: number): CubeCoord[] {
  const results = new Set<string>();
  const add = (c: CubeCoord) => results.add(`${c.q},${c.r}`);

  // Top half: inverted triangle (wide at top, narrow at middle)
  for (let q = -N; q <= N; q++) {
    for (let r = Math.max(-N, -q - N); r <= Math.min(N, -q + N); r++) {
      const s = -q - r;
      const dist = Math.max(Math.abs(q), Math.abs(r), Math.abs(s));
      // Keep cells that are far from center vertically OR close to center
      const vertDist = Math.abs(r);
      const horizDist = Math.max(Math.abs(q), Math.abs(s));
      const maxWidth = N - Math.round((N - 1) * (1 - vertDist / N));
      if (horizDist <= maxWidth && dist <= N) {
        add({ q, r, s });
      }
    }
  }

  return [...results].map((key) => {
    const [q, r] = key.split(',').map(Number);
    return { q, r, s: -q - r };
  });
}

/** Cross/plus shape */
function crossShape(N: number, armWidth: number): CubeCoord[] {
  const results = new Set<string>();
  const add = (c: CubeCoord) => results.add(`${c.q},${c.r}`);

  for (let q = -N; q <= N; q++) {
    for (let r = Math.max(-N, -q - N); r <= Math.min(N, -q + N); r++) {
      const s = -q - r;
      // Horizontal arm: |r| <= armWidth
      if (Math.abs(r) <= armWidth && Math.abs(q) <= N) add({ q, r, s });
      // Vertical arm: |q| <= armWidth
      if (Math.abs(q) <= armWidth && Math.abs(r) <= N) add({ q, r, s });
    }
  }

  return [...results].map((key) => {
    const [q, r] = key.split(',').map(Number);
    return { q, r, s: -q - r };
  });
}

/** Convert cube coords to odd-r offset, find bounding box, return cell IDs */
function cubeToLevel(
  cubeCoords: CubeCoord[],
): { cells: number[]; rows: number; cols: number } {
  // Convert cube to odd-r offset
  const offsets = cubeCoords.map((c) => {
    const col = c.q + Math.floor((c.r - (c.r & 1)) / 2);
    const row = c.r;
    return { row, col };
  });

  // Find bounding box
  let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
  for (const o of offsets) {
    minR = Math.min(minR, o.row); maxR = Math.max(maxR, o.row);
    minC = Math.min(minC, o.col); maxC = Math.max(maxC, o.col);
  }

  const rows = maxR - minR + 1;
  const cols = maxC - minC + 1;

  // Shift to 0-based and compute cell IDs
  const cells = offsets.map((o) => (o.row - minR) * cols + (o.col - minC));
  cells.sort((a, b) => a - b);

  return { cells, rows, cols };
}

// ============================================================
// Level generation
// ============================================================

type ShapeType = 'rectangle' | 'hexagon' | 'diamond' | 'triangle' | 'invertedTriangle' | 'hourglass' | 'cross';

interface LevelSpec {
  name: string;
  topoType: TopologyType;
  shape: ShapeType;
  /** For hex shapes: radius N. For rectangle: rows. */
  size: number;
  /** For rectangle: cols. For cross: arm width. */
  size2?: number;
  mineCount: number;
  difficulty: number;
}

function generateLevel(spec: LevelSpec): LevelData {
  let cells: number[];
  let rows: number;
  let cols: number;

  if (spec.topoType === TopologyType.Hexagonal && spec.shape !== 'rectangle') {
    // Use cube coordinate shapes
    let cubeCoords: CubeCoord[];
    const N = spec.size;

    switch (spec.shape) {
      case 'hexagon': cubeCoords = hexagonShape(N); break;
      case 'diamond': cubeCoords = diamondShape(N); break;
      case 'triangle': cubeCoords = triangleShape(N); break;
      case 'invertedTriangle': cubeCoords = invertedTriangleShape(N); break;
      case 'hourglass': cubeCoords = hourglassShape(N); break;
      case 'cross': cubeCoords = crossShape(N, spec.size2 ?? 1); break;
      default: cubeCoords = hexagonShape(N);
    }

    const result = cubeToLevel(cubeCoords);
    cells = result.cells;
    rows = result.rows;
    cols = result.cols;
  } else {
    // Rectangle or non-hex topology
    rows = spec.size;
    cols = spec.size2 ?? spec.size;
    cells = Array.from({ length: rows * cols }, (_, i) => i);
  }

  // Create topology for adjacency
  let topo: ITopologyGraph;
  if (spec.topoType === TopologyType.Torus) {
    topo = new TorusTopology({ rows, cols });
  } else if (spec.topoType === TopologyType.Triangle) {
    topo = new TriangleTopology({ rows, cols });
  } else {
    topo = new HexTopology({ rows, cols });
  }

  // Build adjacency
  const includedSet = new Set(cells);
  const allCellSet = new Set(topo.cells());
  const validCells = cells.filter((c) => allCellSet.has(c));
  const adjacency: Record<number, readonly number[]> = {};
  for (const cellId of validCells) {
    adjacency[cellId] = topo.neighbors(cellId).filter((n) => includedSet.has(n));
  }

  return {
    metadata: { name: spec.name, author: 'Linyesh', difficulty: spec.difficulty },
    topologyType: spec.topoType,
    topologyConfig: { rows, cols },
    cells: validCells,
    adjacency,
    minePositions: validCells.slice(0, spec.mineCount),
    mechanismConfigs: [],
  };
}

// ============================================================
// Level definitions
// ============================================================

const HEX_LEVELS: LevelSpec[] = [
  // size = radius for shaped, rows for rectangle
  { name: '初识六边形',   topoType: TopologyType.Hexagonal, shape: 'rectangle',        size: 5,  size2: 5,  mineCount: 4,  difficulty: 1 },
  { name: '菱形棋盘',     topoType: TopologyType.Hexagonal, shape: 'diamond',           size: 3,             mineCount: 5,  difficulty: 1 },
  { name: '六角阵地',     topoType: TopologyType.Hexagonal, shape: 'hexagon',           size: 3,             mineCount: 8,  difficulty: 2 },
  { name: '三角阵地',     topoType: TopologyType.Hexagonal, shape: 'triangle',          size: 6,             mineCount: 5,  difficulty: 2 },
  { name: '倒三角挑战',   topoType: TopologyType.Hexagonal, shape: 'invertedTriangle',  size: 6,             mineCount: 5,  difficulty: 3 },
  { name: '大菱形',       topoType: TopologyType.Hexagonal, shape: 'diamond',           size: 5,             mineCount: 12, difficulty: 3 },
  { name: '十字雷区',     topoType: TopologyType.Hexagonal, shape: 'cross',             size: 5, size2: 1,   mineCount: 10, difficulty: 4 },
  { name: '六角堡垒',     topoType: TopologyType.Hexagonal, shape: 'hexagon',           size: 5,             mineCount: 18, difficulty: 4 },
  { name: '巨型菱形',     topoType: TopologyType.Hexagonal, shape: 'diamond',           size: 7,             mineCount: 25, difficulty: 5 },
  { name: '六边形大师',   topoType: TopologyType.Hexagonal, shape: 'hexagon',           size: 6,             mineCount: 30, difficulty: 5 },
];

const TORUS_LEVELS: LevelSpec[] = [
  { name: '环面入门',     topoType: TopologyType.Torus, shape: 'rectangle', size: 4,  size2: 5,  mineCount: 4,  difficulty: 1 },
  { name: '无边世界',     topoType: TopologyType.Torus, shape: 'rectangle', size: 5,  size2: 5,  mineCount: 5,  difficulty: 1 },
  { name: '环绕探索',     topoType: TopologyType.Torus, shape: 'rectangle', size: 5,  size2: 6,  mineCount: 6,  difficulty: 2 },
  { name: '四面楚歌',     topoType: TopologyType.Torus, shape: 'rectangle', size: 6,  size2: 6,  mineCount: 8,  difficulty: 2 },
  { name: '环面迷阵',     topoType: TopologyType.Torus, shape: 'rectangle', size: 6,  size2: 7,  mineCount: 10, difficulty: 3 },
  { name: '环面风暴',     topoType: TopologyType.Torus, shape: 'rectangle', size: 7,  size2: 7,  mineCount: 12, difficulty: 3 },
  { name: '无尽雷场',     topoType: TopologyType.Torus, shape: 'rectangle', size: 7,  size2: 8,  mineCount: 14, difficulty: 4 },
  { name: '环面深渊',     topoType: TopologyType.Torus, shape: 'rectangle', size: 8,  size2: 9,  mineCount: 18, difficulty: 4 },
  { name: '环面噩梦',     topoType: TopologyType.Torus, shape: 'rectangle', size: 9,  size2: 9,  mineCount: 22, difficulty: 5 },
  { name: '环面大师',     topoType: TopologyType.Torus, shape: 'rectangle', size: 9,  size2: 10, mineCount: 25, difficulty: 5 },
];

const TRI_LEVELS: LevelSpec[] = [
  { name: '三角初探',     topoType: TopologyType.Triangle, shape: 'rectangle', size: 5,  size2: 10, mineCount: 5,  difficulty: 1 },
  { name: '锐角思维',     topoType: TopologyType.Triangle, shape: 'rectangle', size: 6,  size2: 12, mineCount: 8,  difficulty: 1 },
  { name: '三角迷宫',     topoType: TopologyType.Triangle, shape: 'rectangle', size: 7,  size2: 14, mineCount: 12, difficulty: 2 },
  { name: '三角扩展',     topoType: TopologyType.Triangle, shape: 'rectangle', size: 8,  size2: 14, mineCount: 16, difficulty: 2 },
  { name: '三角陷阱',     topoType: TopologyType.Triangle, shape: 'rectangle', size: 9,  size2: 16, mineCount: 20, difficulty: 3 },
  { name: '三角风暴',     topoType: TopologyType.Triangle, shape: 'rectangle', size: 9,  size2: 18, mineCount: 24, difficulty: 3 },
  { name: '三角深渊',     topoType: TopologyType.Triangle, shape: 'rectangle', size: 10, size2: 20, mineCount: 28, difficulty: 4 },
  { name: '三角雷区',     topoType: TopologyType.Triangle, shape: 'rectangle', size: 11, size2: 20, mineCount: 32, difficulty: 4 },
  { name: '三角噩梦',     topoType: TopologyType.Triangle, shape: 'rectangle', size: 12, size2: 22, mineCount: 38, difficulty: 5 },
  { name: '三角大师',     topoType: TopologyType.Triangle, shape: 'rectangle', size: 13, size2: 24, mineCount: 45, difficulty: 5 },
];

const ALL_CATEGORIES = [
  { prefix: 'hex', label: '六边形', specs: HEX_LEVELS },
  { prefix: 'torus', label: '环面', specs: TORUS_LEVELS },
  { prefix: 'tri', label: '三角形', specs: TRI_LEVELS },
];

// ============================================================
// Main
// ============================================================

const outputDir = path.resolve(__dirname, '../levels');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
for (const f of fs.readdirSync(outputDir)) {
  if (f.endsWith('.mswp') || f.endsWith('.json')) fs.unlinkSync(path.join(outputDir, f));
}

console.log('🎮 生成关卡集...\n');

const codec = new BinaryLevelCodec();
let total = 0;

for (const cat of ALL_CATEGORIES) {
  console.log(`── ${cat.label} ──`);
  for (let i = 0; i < cat.specs.length; i++) {
    const spec = cat.specs[i];
    const level = generateLevel(spec);
    const buffer = codec.encode(level);
    const filename = `${cat.prefix}-${String(i + 1).padStart(2, '0')}.mswp`;
    fs.writeFileSync(path.join(outputDir, filename), Buffer.from(buffer));
    console.log(`  ✅ ${String(i + 1).padStart(2)}. ${spec.name} [${spec.shape}] (${level.cells.length} cells, ${spec.mineCount} mines)`);
    total++;
  }
  console.log('');
}

console.log(`✅ 全部 ${total} 关生成完成！`);
