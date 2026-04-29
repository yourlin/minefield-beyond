# Story 2.4: 可解性验证器 CLI

Status: done

## Story

As a 关卡设计者,
I want 一个命令行工具来验证关卡文件的可解性,
So that 我可以在设计关卡时快速验证唯一解。

## Acceptance Criteria (AC)

1. **Given** 约束求解器和二进制 codec 已实现（Story 2.2, Story 2.3）**When** 实现 src/verifier/ CLI 应用 **Then** CLI 接受二进制关卡文件路径作为输入（FR57）
2. **And** 加载文件、解析关卡数据、运行求解器验证唯一解
3. **And** 唯一解确认时输出 "✅ 唯一解已验证" 及解的摘要
4. **And** 非唯一解时输出 "❌ 存在 N 个可能解" 及差异位置（FR58）
5. **And** 文件损坏/格式错误时输出明确错误信息
6. **And** 支持 batch-verify 模式：验证目录下所有 .mswp 文件
7. **And** verifier 通过 @core/* paths 别名引用共享代码库
8. **And** tsc 编译 + node 运行

## Tasks / Subtasks

- [x] Task 1: 创建 src/verifier/tsconfig.json (AC: #7, #8)
  - [x] 继承根 tsconfig.json
  - [x] 设置 outDir, rootDir
  - [x] 配置 paths 别名 @core/* → src/core/*
  - [x] target: ES2020, module: ES2020
- [x] Task 2: 实现 src/verifier/src/verify-command.ts — 单文件验证 (AC: #1, #2, #3, #4, #5)
  - [x] 读取 .mswp 文件为 ArrayBuffer
  - [x] 使用 BinaryLevelCodec.validate() 检查格式
  - [x] 使用 BinaryLevelCodec.decode() 解析关卡数据
  - [x] 构建 SolverInput（从 LevelData 提取 topology, revealedCells, mineCount）
  - [x] 注意：验证器需要知道哪些格子是"已翻开"的 — 对于验证器来说，所有非地雷格子都视为已翻开
  - [x] 使用 ConstraintSolver.solve() 验证
  - [x] 格式化输出结果
- [x] Task 3: 实现 src/verifier/src/batch-verify.ts — 批量验证 (AC: #6)
  - [x] 扫描目录下所有 .mswp 文件
  - [x] 逐个验证并汇总结果
  - [x] 输出汇总报告
- [x] Task 4: 实现 src/verifier/src/cli.ts — CLI 入口 (AC: 全部)
  - [x] 解析命令行参数（文件路径或目录路径）
  - [x] 单文件模式 vs 批量模式
  - [x] 错误处理和退出码
- [x] Task 5: 实现 src/verifier/src/main.ts — 程序入口
  - [x] shebang 行
  - [x] 调用 cli.ts
- [x] Task 6: 编写验证器测试 (AC: #2, #3, #4, #5)
  - [x] 测试 1: 验证有效的唯一解关卡
  - [x] 测试 2: 验证非唯一解关卡
  - [x] 测试 3: 验证损坏文件的错误处理
- [x] Task 7: 验证 (AC: 全部)
  - [x] tsc 编译通过
  - [x] node 运行通过
  - [x] `npm run lint` 无错误

## Dev Notes

### 验证器架构

验证器是一个 Node.js CLI 工具，位于 `src/verifier/`。它使用 core 层的共享代码（BinaryLevelCodec, ConstraintSolver, TopologyRegistry）来验证关卡文件。

**关键设计决策：**
- 验证器需要从 LevelData 构建 SolverInput
- 对于验证器来说，所有非地雷格子都视为"已翻开"
- 需要使用 TopologyRegistry 从 topologyType + topologyConfig 创建拓扑实例
- 需要从拓扑实例获取每个非地雷格子的邻居地雷数作为约束

### SolverInput 构建逻辑

```typescript
// 从 LevelData 构建 SolverInput
function buildSolverInput(level: LevelData): SolverInput {
  const topology = TopologyRegistry.create(level.topologyType, level.topologyConfig);
  const mineSet = new Set(level.minePositions);
  const revealedCells = new Map();
  
  for (const cellId of level.cells) {
    if (mineSet.has(cellId)) continue;
    const mineNeighborCount = topology.neighbors(cellId).filter(n => mineSet.has(n)).length;
    // 检查 mechanismConfigs 是否有 FuzzyHint
    const mechEntry = level.mechanismConfigs.find(m => m.cellId === cellId);
    if (mechEntry?.config.type === 'fuzzy-hint') {
      revealedCells.set(cellId, { min: mineNeighborCount - mechEntry.config.offset, max: mineNeighborCount + mechEntry.config.offset });
    } else {
      revealedCells.set(cellId, mineNeighborCount);
    }
  }
  
  return { topology, revealedCells, mineCount: level.minePositions.length };
}
```

### ⚠️ 关键注意事项

1. **verifier 可以使用 Node.js API** — fs, path, process
2. **使用相对路径导入 core** — 由于 verifier 有自己的 tsconfig，需要配置 paths 别名
3. **TopologyRegistry 需要已注册** — 确保 hex-topology 等已注册（import 触发副作用）
4. **退出码** — 0 = 唯一解, 1 = 非唯一解/无解, 2 = 文件错误

### 下游依赖
- **Story 2.6** 需要：verifier CLI（验证测试关卡）

### References

- [Source: architecture.md#Decision 3: 约束求解器] — solver 接口
- [Source: architecture.md#Project Structure] — verifier 目录结构
- [Source: epics.md#Story 2.4] — 验收标准

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Completion Notes List

- **Task 1**: 创建 verifier/tsconfig.json，继承根 tsconfig，配置 outDir/rootDir/paths，安装 @types/node。
- **Task 2**: 实现 verify-command.ts — 读取 .mswp 文件、BinaryLevelCodec 验证/解码、从 LevelData 构建 SolverInput（所有非地雷格子视为已翻开，FuzzyHint 转为范围约束）、ConstraintSolver 求解、格式化输出。
- **Task 3**: 实现 batch-verify.ts — 扫描目录下 .mswp 文件、逐个验证、汇总结果。
- **Task 4**: 实现 cli.ts — 解析命令行参数、单文件/批量模式、退出码（0=唯一解, 1=失败, 2=用法错误）。确保 TopologyRegistry 通过副作用导入已注册。
- **Task 5**: 实现 main.ts — shebang 行 + 调用 cli.run()。
- **Task 6**: 验证器测试 — 4 个测试覆盖唯一解验证、损坏文件处理、缺失文件处理。
- **Task 7**: tsc 编译通过，106 个测试全部通过，lint 无错误。

### Change Log

- 2026-04-29: Story 2.4 完整实现 — 可解性验证器 CLI

### File List

**新建：**
- `src/verifier/tsconfig.json` — verifier TypeScript 配置
- `src/verifier/src/verify-command.ts` — 单文件验证逻辑
- `src/verifier/src/verify-command.test.ts` — 验证器测试（4 用例）
- `src/verifier/src/batch-verify.ts` — 批量验证
- `src/verifier/src/cli.ts` — CLI 入口
- `src/verifier/src/main.ts` — 程序入口

**修改：**
- `vitest.config.ts` — 添加 verifier 测试路径
- `package.json` — 添加 @types/node 依赖
