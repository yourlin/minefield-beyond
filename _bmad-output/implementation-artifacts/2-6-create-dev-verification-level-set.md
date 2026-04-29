# Story 2.6: 创建开发验证用关卡集

Status: done

## Story

As a 开发者,
I want 一组可用的测试关卡文件,
So that 从 Epic 3 开始的所有游戏功能可以端到端验证。

## Acceptance Criteria (AC)

1. **Given** 二进制 codec 和可解性验证器已实现 **When** 创建开发验证用关卡集 **Then** 至少创建 3 个六边形拓扑关卡：简单（5×5，2 颗雷）、中等（7×7，8 颗雷）、困难（9×9，15 颗雷）
2. **And** 所有关卡通过可解性验证器验证唯一解
3. **And** 关卡文件以 .mswp 格式保存到开发目录
4. **And** 关卡阅读器可正确加载和可视化这些关卡

## Tasks / Subtasks

- [x] Task 1: 创建关卡生成脚本 (AC: #1, #2, #3)
  - [x] scripts/generate-levels.ts — 生成测试关卡
  - [x] 使用 HexTopology 创建棋盘
  - [x] 使用 SeededRandom 确定性放置地雷
  - [x] 使用 ConstraintSolver 验证唯一解
  - [x] 使用 BinaryLevelCodec 编码为 .mswp
  - [x] 保存到 levels/ 目录
- [x] Task 2: 生成 3 个六边形关卡 (AC: #1, #2)
  - [x] 简单: 5×5, 2 mines
  - [x] 中等: 7×7, 8 mines
  - [x] 困难: 9×9, 15 mines
  - [x] 所有关卡通过唯一解验证
- [x] Task 3: 验证 (AC: 全部)
  - [x] 关卡文件存在且格式正确
  - [x] `npm run test` 全部通过
  - [x] `npm run lint` 无错误

## Dev Notes

### 关卡生成策略
使用 SeededRandom 确定性放置地雷，然后用 ConstraintSolver 验证唯一解。如果不唯一，换一个 seed 重试。

### ⚠️ 关键注意事项
1. 生成脚本是 Node.js 脚本，可以使用 fs/path
2. 使用 SeededRandom 保证可重复性
3. 必须验证唯一解后才保存

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Completion Notes List

- **Task 1**: 创建 scripts/generate-levels.ts — 使用 HexTopology + SeededRandom 确定性放置地雷，ConstraintSolver 验证唯一解，BinaryLevelCodec 编码为 .mswp。
- **Task 2**: 生成 3 个六边形关卡：简单 5×5/2mines (seed=100)、中等 7×7/8mines (seed=200)、困难 9×9/15mines (seed=300)。全部通过唯一解验证。
- **Task 3**: 添加 level-files.test.ts 验证所有 .mswp 文件格式正确且唯一解。107 个测试全部通过，lint 无错误。

### Change Log

- 2026-04-29: Story 2.6 完整实现 — 创建开发验证用关卡集

### File List

**新建：**
- `scripts/generate-levels.ts` — 关卡生成脚本
- `levels/level-01-5x5.mswp` — 简单关卡 (670 bytes)
- `levels/level-02-7x7.mswp` — 中等关卡 (1350 bytes)
- `levels/level-03-9x9.mswp` — 困难关卡 (2274 bytes)
- `src/core/solver/level-files.test.ts` — 关卡文件验证测试
