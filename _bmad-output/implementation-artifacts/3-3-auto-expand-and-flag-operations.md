# Story 3.3: 自动展开与标记操作

Status: done

## Story
As a 玩家, I want 翻开安全区域时自动展开相邻格子，并能标记疑似地雷, So that 我可以高效推进游戏并记录推理结果。

## Acceptance Criteria (AC)
1. BFS 自动展开所有相邻的无雷区域，直到遇到有数字的格子（FR19）
2. BFS 热路径内部使用可变数据结构，零分配（城墙模式）
3. 格子切换为已标记状态（FR18, FR25）
4. 最近一次标记操作可撤销（FR22）
5. 撤销不影响翻开操作（翻开不可撤销）

## Tasks / Subtasks
- [x] Task 1: BFS 自动展开（bfsReveal）
- [x] Task 2: 标记切换（toggleFlag）
- [x] Task 3: 撤销标记（undoLastFlag）
- [x] Task 4: 单元测试

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6

### Completion Notes List
- BFS 使用 queue + visited Set，内部可变（城墙模式）
- 标记切换：unrevealed↔flagged，不能标记已翻开格子
- 撤销：只撤销最后一个命令（如果是 flag/unflag），不跨越 reveal 命令
- 代码审查修复：undo 不再跨越 reveal 命令回溯旧 flag

### Change Log
- 2026-04-29: Story 3.3 实现 — 自动展开与标记操作
- 2026-04-29: 代码审查修复 — undo 只撤销最后一个命令

### File List
- `src/game/logic/board-model.ts` — bfsReveal, toggleFlag, undoLastFlag
- `src/game/logic/board-model.test.ts`
