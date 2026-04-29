# Minefield Beyond

> A high-challenge minesweeper variant with non-traditional board topologies and innovative information mechanics.

[中文文档](./README.zh-CN.md)

## Play

🎮 **[Play Online](https://yourlin.github.io/minefield-beyond/)**

## What Makes This Different

Traditional minesweeper is built on a rectangular grid with fixed 8-neighbor adjacency. This game turns the board topology itself into a variable:

- **Hexagonal** — 6 neighbors, multiple board shapes generated via cube coordinates (diamond, hexagon, triangle, cross, etc.)
- **Torus** — Edges wrap around, no safe corners
- **Triangle** — 3 or 12 neighbors depending on orientation

Combined with information mechanics like **fuzzy hints** (range values) and **delayed reveal**, every level demands you rebuild your spatial reasoning from scratch.

### Key Design Principles

- **Mines placed at runtime** — On first click, mines are randomly placed with a guaranteed safe zone around the clicked cell and its neighbors
- **30 levels** across 3 topology categories (10 each), with smooth difficulty progression
- **Level files store shape, not mines** — Binary MSWP format contains board topology and mine count only
- **Progress persisted** via localStorage

## Project Structure

```
├── minesweeper/           # Game source code
│   ├── src/
│   │   ├── core/          # Shared library — zero dependencies, browser + Node.js
│   │   │   ├── topology/  # Hex, Torus, Triangle topologies
│   │   │   ├── mechanism/ # FuzzyHint, DelayedReveal
│   │   │   ├── solver/    # Constraint propagation + backtracking
│   │   │   ├── binary/    # MSWP binary codec
│   │   │   ├── types/     # CellId, LevelData, ValidationResult
│   │   │   ├── errors/    # MinesweeperError hierarchy
│   │   │   └── random/    # IRandom + SeededRandom
│   │   ├── game/          # Game runtime — Vite + Canvas API
│   │   ├── reader/        # Level reader — Vite + Canvas API
│   │   └── verifier/      # Solvability verifier — Node.js CLI
│   ├── levels/            # Generated .mswp level files (30 levels)
│   └── scripts/           # Level generation script
├── _bmad-output/          # Planning artifacts (PRD, architecture, epics)
└── .github/workflows/     # CI/CD (GitHub Pages deployment)
```

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| TypeScript 5.9 | Language (strict mode) |
| Vite 8 | Dev server + production build |
| Canvas API | Game rendering (auto-scaling) |
| Web Audio API | Sound effects |
| Vitest 4 | Testing (198 tests) |
| ESLint + Prettier | Code quality |
| localStorage | Progress persistence |

## Getting Started

```bash
cd minesweeper
npm install
npm run dev:game     # Start game dev server
```

### Other Commands

```bash
npm test             # Run all tests
npm run build:game   # Production build
npm run dev:reader   # Start level reader dev server
npx tsx scripts/generate-levels.ts  # Regenerate 30 levels
```

## Architecture

The project follows a strict dependency direction: `game → core`, `reader → core`, `verifier → core`. The `core/` library has zero external dependencies and runs in both browser and Node.js.

Key architectural decisions:
- **Registry pattern** for topology and mechanism extensibility
- **Discriminated unions** over enums + optional fields
- **Immutable constraints** in the solver
- **Cube coordinates** for mathematically symmetric hex shapes
- **Custom error hierarchy** with graceful degradation

## Level Format

Levels use a custom binary format (MSWP):
- Magic number: `0x4D 0x53 0x57 0x50`
- Version byte: `0x01`
- Contains: topology type, shape parameters, cell definitions, mine count
- Does NOT contain mine positions (placed at runtime)

## License

MIT
