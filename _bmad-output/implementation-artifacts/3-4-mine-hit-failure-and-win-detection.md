# Story 3.4: 踩雷失败与通关判定

Status: done

## Story
As a 玩家, I want 踩雷时看到失败反馈，所有安全格子翻开时看到通关成功, So that 我能清楚知道游戏结果。

## Acceptance Criteria (AC)
1. 踩雷时游戏立即结束，GameStateMachine 转换为 failed 状态（FR20, FR37）
2. 踩雷格子显示地雷图标 + 所有其他地雷位置高亮显示
3. 所有非地雷格子都已翻开时，GameStateMachine 转换为 success 状态（FR37）
4. 棋盘可重置为初始状态，可重新开始游戏
5. 重置时可选保留旗帜标记

## Tasks / Subtasks
- [x] Task 1: 踩雷检测和失败处理
- [x] Task 2: 通关检测（checkWin）
- [x] Task 3: 棋盘重置（resetBoard）
- [x] Task 4: 单元测试

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6

### Completion Notes List
- 踩雷：设置 mine-hit 状态，揭示所有其他地雷为 mine-revealed
- 通关：checkWin() 检查所有非地雷格子是否 revealed
- 重置：resetBoard(preserveFlags) 支持保留旗帜标记
- game-over 后所有操作返回 game-over

### Change Log
- 2026-04-29: Story 3.4 实现 — 踩雷失败与通关判定

### File List
- `src/game/logic/board-model.ts` — reveal (mine detection), checkWin, resetBoard
- `src/game/logic/board-model.test.ts`
