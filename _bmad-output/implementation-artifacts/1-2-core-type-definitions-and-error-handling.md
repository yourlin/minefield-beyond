# Story 1.2: 核心类型定义与错误处理基础

Status: done

## Story

As a 开发者,
I want core 层的共享类型定义和错误处理基类,
So that 所有模块使用统一的类型系统和错误处理模式。

## Acceptance Criteria (AC)

1. **Given** 项目结构已初始化（Story 1.1）**When** 实现 core/types/ 和 core/errors/ 模块 **Then** CellId、Point2D、ValidationResult 等共享类型定义完成
2. **And** MinesweeperError 基类及 TopologyError、LevelLoadError、SolverError、StorageError 子类实现
3. **And** core/logger/ 的 ILogger 接口和 ConsoleLogger 实现完成
4. **And** core/random/ 的 IRandom 接口和 SeededRandom 实现完成，给定相同 seed 产生相同序列
5. **And** 所有类型和接口有 JSDoc 注释
6. **And** core 代码零平台依赖（不引入 cc、document、process）
7. **And** 单元测试覆盖 SeededRandom 的确定性验证：相同 seed 产生相同序列、不同 seed 产生不同序列、序列分布基本均匀性检验

## Tasks / Subtasks

- [x] Task 1: 实现 core/types/cell.ts — CellId 类型 (AC: #1)
  - [x] 定义 `CellId = number` 类型别名，带 JSDoc
  - [x] 更新 `core/types/index.ts` barrel 导出 CellId
- [x] Task 2: 实现 core/types/level.ts — LevelData 和 LevelMetadata 类型壳 (AC: #1)
  - [x] 定义 `LevelMetadata` 接口（name, author, difficulty 等基础字段），带 JSDoc
  - [x] 定义 `LevelData` 接口壳（metadata 字段 + 注释说明完整字段在 Story 2.2 定义），带 JSDoc
  - [x] 更新 `core/types/index.ts` barrel 导出
- [x] Task 3: 实现 core/errors/ — 错误类层次 (AC: #2)
  - [x] `base-error.ts`: `abstract class MinesweeperError extends Error`，含 `readonly code: string`，构造函数设置 `this.name = this.constructor.name`
  - [x] `topology-error.ts`: `class TopologyError extends MinesweeperError`，code = `'TOPOLOGY_ERROR'`
  - [x] `level-load-error.ts`: `class LevelLoadError extends MinesweeperError`，code = `'LEVEL_LOAD_ERROR'`
  - [x] `solver-error.ts`: `class SolverError extends MinesweeperError`，code = `'SOLVER_ERROR'`
  - [x] `storage-error.ts`: `class StorageError extends MinesweeperError`，code = `'STORAGE_ERROR'`
  - [x] 更新 `core/errors/index.ts` barrel（替换 `export {}`）
  - [x] 所有类有 JSDoc 注释
- [x] Task 4: 实现 core/logger/ — ILogger 接口和 ConsoleLogger (AC: #3)
  - [x] `types.ts`: `ILogger` 接口定义 `warn(message, context?)` 和 `error(message, error?, context?)` 方法
  - [x] `console-logger.ts`: `ConsoleLogger implements ILogger`，使用 `// eslint-disable-next-line no-console` 调用 console.warn/console.error
  - [x] 更新 `core/logger/index.ts` barrel（替换 `export {}`）
  - [x] 所有接口和类有 JSDoc 注释
- [x] Task 5: 实现 core/random/ — IRandom 接口和 SeededRandom (AC: #4)
  - [x] `types.ts`: `IRandom` 接口定义 `next(): number` 返回 [0,1) 和 `nextInt(min, max): number`
  - [x] `seeded-random.ts`: `SeededRandom implements IRandom`，基于 seed 的确定性 PRNG（如 mulberry32 或 xoshiro128）
  - [x] 禁止使用 `Math.random()`，使用纯算术实现
  - [x] 更新 `core/random/index.ts` barrel（替换 `export {}`）
  - [x] 所有接口和类有 JSDoc 注释
- [x] Task 6: 编写 SeededRandom 单元测试 (AC: #7)
  - [x] `seeded-random.test.ts` 就近放置
  - [x] 测试 1: 相同 seed 产生相同序列（创建两个实例，验证 N 次 next() 结果一致）
  - [x] 测试 2: 不同 seed 产生不同序列
  - [x] 测试 3: nextInt(min, max) 返回值在 [min, max] 范围内
  - [x] 测试 4: 序列分布基本均匀性（10000 次采样，10 个桶，每桶偏差 < 5%）
- [x] Task 7: 编写错误类单元测试 (AC: #2)
  - [x] `base-error.test.ts`: 验证子类 name 属性、code 属性、instanceof 链
  - [x] 验证每个子类的 code 值正确
- [x] Task 8: 验证 (AC: #5, #6)
  - [x] `npm run test` 全部通过
  - [x] `npm run lint` 无错误（特别验证 no-console 规则在 ConsoleLogger 中正确处理）
  - [x] `npm run build:core` 编译通过
  - [x] 验证 core 代码无平台 API 引用

## Dev Notes

### 架构接口定义（必须严格遵循）
[Source: architecture.md#Error Handling Patterns, #Game-Specific Patterns]

**MinesweeperError 基类：**
```typescript
abstract class MinesweeperError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = this.constructor.name;
  }
}
```

**ILogger 接口：**
```typescript
interface ILogger {
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, error?: Error, context?: Record<string, unknown>): void;
}
```

**IRandom 接口：**
```typescript
interface IRandom {
  next(): number;       // [0, 1)
  nextInt(min: number, max: number): number;
}
```

### ⚠️ 关键注意事项

1. **no-console ESLint 规则** — Story 1.1 代码审查决定在 core 中限制 console。`ConsoleLogger` 是唯一允许使用 console 的地方，必须用 `// eslint-disable-next-line no-console` 注释。
2. **不要定义 DisplayValue/CellState/MechanismType** — 这些属于 Story 2.1（core/mechanism/types.ts）。Story 1.2 只定义 `CellId`。
3. **使用相对路径导入** — core 内部文件之间使用相对路径（如 `'../errors/index.js'`），不使用 `@core/*`，避免 tsc 编译输出问题（Story 1.1 Review Defer 项）。
4. **import 路径带 .js 后缀** — 遵循 Story 1.1 建立的模式（`from './common.js'`）。
5. **替换 `export {}` 占位** — Story 1.1 在空 barrel 文件中放了 `export {}`，本 Story 需要替换为真实导出。
6. **SeededRandom 算法选择** — 推荐 mulberry32（简单、快速、分布良好）或 xoshiro128**（更高质量）。不要使用 LCG（分布差）。
7. **LevelData/LevelMetadata 是类型壳** — 只定义基础结构，完整字段在 Story 2.2 中补充。

### 下游依赖
- **Story 1.3** 需要：`CellId`、`Point2D`、`TopologyError`、`IRandom`、`ILogger`
- **Story 2.1** 需要：`CellId`、`ValidationResult`、`MinesweeperError`、`ILogger`

### Story 1.1 经验教训
- 空 barrel 文件必须有 `export {}`（已修复），本 Story 替换为真实导出
- ESLint v9 flat config（`eslint.config.mjs`），不是 `.eslintrc.cjs`
- 依赖版本使用 `~` 紧约束
- Vitest globals 已启用，测试中无需 import describe/it/expect

### 文件清单（预期）

**新建：**
- `src/core/types/cell.ts`
- `src/core/types/level.ts`
- `src/core/errors/base-error.ts`
- `src/core/errors/base-error.test.ts`
- `src/core/errors/topology-error.ts`
- `src/core/errors/level-load-error.ts`
- `src/core/errors/solver-error.ts`
- `src/core/errors/storage-error.ts`
- `src/core/logger/types.ts`
- `src/core/logger/console-logger.ts`
- `src/core/random/types.ts`
- `src/core/random/seeded-random.ts`
- `src/core/random/seeded-random.test.ts`

**修改：**
- `src/core/types/index.ts` — 添加 cell.ts 和 level.ts 导出
- `src/core/errors/index.ts` — 替换 `export {}` 为真实导出
- `src/core/logger/index.ts` — 替换 `export {}` 为真实导出
- `src/core/random/index.ts` — 替换 `export {}` 为真实导出

### References

- [Source: architecture.md#Error Handling Patterns] — MinesweeperError 层次结构
- [Source: architecture.md#Game-Specific Patterns] — IRandom、ILogger 接口定义
- [Source: architecture.md#Data Format Patterns] — Discriminated Union 模式
- [Source: architecture.md#Enforcement Guidelines] — 命名规范、JSDoc、禁止模式
- [Source: architecture.md#Complete Project Directory Structure] — 文件路径
- [Source: epics.md#Story 1.2] — 验收标准
- [Source: 1-1-story.md#Review Findings] — no-console 决策、相对路径导入

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Completion Notes List

- **Task 1**: 定义 `CellId = number` 类型别名，带完整 JSDoc，更新 barrel 导出。
- **Task 2**: 定义 `LevelMetadata`（name, author, difficulty）和 `LevelData`（metadata 字段）接口壳，带 JSDoc 注释说明完整字段在 Story 2.2 补充。
- **Task 3**: 实现完整错误类层次 — `MinesweeperError` 抽象基类 + 4 个具体子类（TopologyError, LevelLoadError, SolverError, StorageError），每个子类有唯一 code 字符串，全部带 JSDoc。替换了 `export {}` 占位。
- **Task 4**: 实现 `ILogger` 接口（warn/error 方法）和 `ConsoleLogger` 实现，使用 `eslint-disable-next-line no-console` 逐行禁用 no-console 规则。替换了 `export {}` 占位。
- **Task 5**: 实现 `IRandom` 接口（next/nextInt 方法）和 `SeededRandom`（基于 mulberry32 算法），纯算术实现无 Math.random() 依赖。替换了 `export {}` 占位。
- **Task 6**: 编写 4 个 SeededRandom 测试 — 确定性验证、不同 seed 差异性、nextInt 范围验证、10000 次采样均匀分布检验（10 桶，偏差 < 5%）。
- **Task 7**: 编写 6 个错误类测试 — 验证每个子类的 name/code/message 属性、instanceof 链（MinesweeperError + Error）、子类间互斥性。
- **Task 8**: 全部验证通过 — 13 个测试全绿、lint 零错误、build:core 编译成功、core 代码无平台 API 引用。
- 所有文件使用相对路径导入 + `.js` 后缀，遵循 Story 1.1 建立的模式。

### File List

**新建：**
- `minesweeper/src/core/types/cell.ts`
- `minesweeper/src/core/types/level.ts`
- `minesweeper/src/core/errors/base-error.ts`
- `minesweeper/src/core/errors/base-error.test.ts`
- `minesweeper/src/core/errors/topology-error.ts`
- `minesweeper/src/core/errors/level-load-error.ts`
- `minesweeper/src/core/errors/solver-error.ts`
- `minesweeper/src/core/errors/storage-error.ts`
- `minesweeper/src/core/logger/types.ts`
- `minesweeper/src/core/logger/console-logger.ts`
- `minesweeper/src/core/random/types.ts`
- `minesweeper/src/core/random/seeded-random.ts`
- `minesweeper/src/core/random/seeded-random.test.ts`

**修改：**
- `minesweeper/src/core/types/index.ts` — 添加 CellId 和 LevelMetadata/LevelData 导出
- `minesweeper/src/core/errors/index.ts` — 替换 `export {}` 为真实导出
- `minesweeper/src/core/logger/index.ts` — 替换 `export {}` 为真实导出
- `minesweeper/src/core/random/index.ts` — 替换 `export {}` 为真实导出

### Review Findings

- [x] [Review][Patch] `nextInt` min > max 时返回越界值 — 无参数校验，min > max 时静默返回合约外的值 [seeded-random.ts]
- [x] [Review][Patch] Seed NaN/Infinity/float 静默强制转换 — `seed | 0` 将 NaN/Infinity/float 静默转为有效 seed，不同输入可能产生相同序列 [seeded-random.ts]
- [x] [Review][Patch] `ConsoleLogger.error()` 丢弃 context — 当 error 为 undefined 但 context 有值时，context 被静默丢弃 [console-logger.ts]
- [x] [Review][Patch] 缺少边界 seed 测试 — 无 seed 0、负数、MAX_SAFE_INTEGER 的测试覆盖 [seeded-random.test.ts]
- [x] [Review][Patch] 缺少 nextInt(n,n) 单值范围测试 — 退化但有效的边界情况未测试 [seeded-random.test.ts]
- [x] [Review][Defer] `nextInt` 浮点参数返回非整数 [seeded-random.ts] — deferred, IRandom 接口的 number 类型是架构定义，运行时验证超出本 Story 范围
- [x] [Review][Defer] `LevelMetadata.difficulty` 接受 NaN/Infinity/负数 [level.ts] — deferred, 类型壳的完整验证在 Story 2.2 实现

## Change Log

- 2026-04-28: 完成全部 8 个任务 — 核心类型定义（CellId, LevelMetadata, LevelData）、错误类层次（MinesweeperError + 4 子类）、ILogger/ConsoleLogger、IRandom/SeededRandom，含 13 个单元测试全部通过。
- 2026-04-29: 代码审查修复 — 5 个 patch 全部应用：nextInt 参数校验、seed 有限性校验、ConsoleLogger.error context 分支修复、边界 seed 测试、nextInt(n,n) 测试。测试数 13→20。
