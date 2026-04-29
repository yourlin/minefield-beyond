---
project_name: '高挑战性扫雷游戏'
user_name: 'Linyesh'
date: '2026-04-29'
updated: '2026-04-29'
---

# Project Context for AI Agents

_Critical rules and patterns for implementing code in this project._

---

## Technology Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| TypeScript | ~5.9 | Language (strict mode) |
| Vite | ^8.0 | Dev server + production build (game, reader) |
| Vitest | ~4.1 | Testing (198 tests, 26 files) |
| ESLint | ~9.39 | Linting |
| Prettier | ~3.8 | Formatting |
| Canvas API | native | Game + reader rendering |
| Web Audio API | native | Sound effects |
| localStorage | native | Progress persistence |

**No game engine.** Rendering uses browser-native Canvas API with auto-scaling.

## Project Structure

```
minesweeper/
├── src/
│   ├── core/           # Shared library — ZERO dependencies, browser + Node.js
│   │   ├── topology/   # 5 topologies: Hex, Triangle, Torus, Irregular, Mixed
│   │   ├── mechanism/  # FuzzyHint, DelayedReveal
│   │   ├── solver/     # Constraint propagation + backtracking
│   │   ├── binary/     # MSWP binary codec + JSON codec
│   │   ├── types/      # CellId, LevelData, ValidationResult
│   │   ├── errors/     # MinesweeperError hierarchy
│   │   ├── random/     # IRandom + SeededRandom
│   │   └── logger/     # ILogger + ConsoleLogger
│   ├── game/           # Game runtime — Vite + Canvas
│   │   ├── logic/      # Pure TS game logic (no browser APIs)
│   │   ├── src/        # Canvas rendering + DOM + app entry
│   │   └── public/     # Static assets (level files)
│   ├── reader/         # Level reader — Vite + Canvas
│   └── verifier/       # Solvability verifier — Node.js CLI
├── levels/             # Generated .mswp level files (30 levels)
├── scripts/            # Level generation script
└── dist/               # Build output
```

**Dependency direction:** `game → core`, `reader → core`, `verifier → core`. Never reverse.

## Game Design

### Levels
- **30 levels** across 3 topology categories (10 each)
- **Hex levels** use cube coordinate shapes: rectangle, diamond, hexagon, triangle, invertedTriangle, cross
- **Torus levels** are all rectangular (wrap-around edges)
- **Triangle levels** are all rectangular
- **Mines are placed at runtime** on first click (not stored in level files)
- First click is always safe (mine-free zone around clicked cell + neighbors)
- Level files store board shape + mine count; `minePositions` array is just a count indicator

### Shape Generation (cube coordinates)
Hex shapes are defined in cube coordinate space (q, r, s where q+r+s=0), then converted to odd-r offset for storage. This guarantees mathematical symmetry.

```typescript
// Hexagon shape: all hexes within radius N
for (q = -N; q <= N; q++)
  for (r = max(-N, -q-N); r <= min(N, -q+N); r++)
    add(q, r, -q-r)
```

### Progress Persistence
- Uses `LocalStorageAdapter` (localStorage with `mswp_` prefix)
- Stores: level unlock progress, best times, attempt counts, settings
- Corrupted data degrades to defaults (only level 1 unlocked)
- Dev mode: `?dev` URL param unlocks all levels

## Critical Rules

### 1. core/ is ZERO-dependency
- No `document`, `window`, `process`, `localStorage`, `Canvas`, `fetch`
- No npm dependencies — pure TypeScript only
- Must work in both browser and Node.js
- All public APIs exported through barrel files (`index.ts`)

### 2. Import paths use `.js` suffix
Required by ES module resolution with `"type": "module"`.
```typescript
import { HexTopology } from '../topology/hex-topology.js';
```

### 3. game/logic/ has no browser APIs
Pure TypeScript game logic. Only `src/game/src/` may use Canvas/DOM.

### 4. Discriminated unions, not enums + optional fields
```typescript
type SolverResult =
  | { kind: 'unique'; solution: CellAssignment[] }
  | { kind: 'multiple'; solutions: CellAssignment[][]; differingCells: CellId[] }
  | { kind: 'unsolvable'; reason: string };
```

### 5. Registry pattern for extensibility
All 5 topologies and 2 mechanisms are pre-registered at module load time.

### 6. Hex topology: pointy-top odd-r offset
- Even rows: diagonal neighbors shift LEFT (col-1)
- Odd rows: diagonal neighbors shift RIGHT (col+1)
- CellId = row × cols + col

### 7. Binary format: MSWP header
`0x4D 0x53 0x57 0x50` + version `0x01`. Big-endian. Constants in `core/binary/constants.ts`.

### 8. Solver: immutable constraints
`originalMin`/`originalMax` never mutated. Effective values recomputed each evaluation.

### 9. Error handling: custom classes, no empty catch
Hierarchy: `MinesweeperError` → `TopologyError`, `LevelLoadError`, `SolverError`, `StorageError`, `MechanismError`.

### 10. No Math.random()
Use `IRandom` interface (`SeededRandom`) for deterministic results.

### 11. validate() returns result, decode() throws
Codecs: `validate()` returns `{ valid, errors }`. `decode()` throws `LevelLoadError`.

### 12. BoardModel uses TopologyRegistry, not level.adjacency
`level.adjacency` is for serialization only. Game logic creates topology via registry.

### 13. Runtime mine placement
`BoardModel.placeMines(safeCell)` is called on first reveal. Mines are NOT read from `level.minePositions` — that field only stores the count.

### 14. Shaped boards filter cells
`BoardModel` has `includedCells: Set<CellId>` — only cells in `level.cells` are playable. Neighbors are filtered through this set.

### 15. Canvas renderer auto-scales
`GameRenderer` computes scale factor to fit board in canvas. All drawing sizes (hex, rect, triangle, fonts, line widths) multiply by `this.scale`.

## Naming Conventions

| What | Convention | Example |
|------|-----------|---------|
| Files | kebab-case | `hex-topology.ts` |
| Tests | co-located `.test.ts` | `hex-topology.test.ts` |
| Classes | PascalCase | `HexTopology` |
| Interfaces | I-prefix | `ITopologyGraph` |
| Types | PascalCase | `CellVisualState` |
| Enums | PascalCase.PascalCase | `TopologyType.Hexagonal` |
| Constants | UPPER_SNAKE | `MAGIC_NUMBER` |

## Key Commands

```bash
npm test                              # 198 tests
npm run lint                          # ESLint
npm run build:core                    # Compile core
npm run dev:game                      # Game dev server
npm run build:game                    # Production build
npx tsx scripts/generate-levels.ts    # Regenerate 30 levels
```
