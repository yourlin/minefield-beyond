# Story 3.2: 游戏状态机与格子翻开交互

Status: done

## Story
As a 玩家, I want 点击格子翻开它并看到数字, So that 我可以获取推理信息来判断地雷位置。

## Acceptance Criteria (AC)
1. hit-test 正确将屏幕坐标映射到六边形逻辑 cell（FR9）
2. GameStateMachine 从 notStarted 转换为 playing 状态（首次点击时）（FR37）
3. 格子翻开后显示邻居地雷数，视觉状态从未翻开变为已翻开（FR25）
4. CommandLog 记录每步操作用于后续死因回顾
5. CommandLog 有单元测试验证记录和回放的正确性

## Tasks / Subtasks
- [x] Task 1: GameStateMachine — 状态转换（notStarted→playing→success/failed/paused）
- [x] Task 2: CommandLog — 命令记录和回放
- [x] Task 3: BoardModel.reveal() — 格子翻开逻辑
- [x] Task 4: 单元测试覆盖所有 AC

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6

### Completion Notes List
- 实现 GameStateMachine（discriminated union 状态，不可变状态对象）
- 实现 CommandLog（append-only 日志，popLast 用于 undo）
- 实现 BoardModel.reveal()（mine 检测、状态转换、命令记录）
- 代码审查修复：moveCount 改为 readonly，undo 添加 phase guard

### Change Log
- 2026-04-29: Story 3.2 实现 — 游戏状态机与格子翻开
- 2026-04-29: 代码审查修复 — moveCount 不可变、undo phase guard

### File List
- `src/game/logic/game-state-machine.ts`
- `src/game/logic/game-state-machine.test.ts`
- `src/game/logic/command-log.ts`
- `src/game/logic/command-log.test.ts`
- `src/game/logic/board-model.ts`
- `src/game/logic/board-model.test.ts`
