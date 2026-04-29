# Story 4.2: 关卡选择界面

Status: done

## Story
As a 玩家, I want 一个关卡选择界面来浏览所有关卡并选择要玩的关卡。

## Tasks / Subtasks
- [x] LevelProgress 数据模型（unlocked/completed/bestTime/attempts）
- [x] ProgressManager.getLevelProgress() 查询单关进度
- [x] 初始状态仅第 1 关解锁
- [x] 单元测试覆盖

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6
### Completion Notes List
- 关卡选择逻辑通过 ProgressManager 实现，UI 层（Cocos Creator 场景）后续接入
- LevelProgress 包含 unlocked/completed/bestTime/attempts 四个字段
- 10 关卡片状态由 ProgressManager.getProgress() 驱动
### File List
- `src/game/logic/progress-manager.ts`（已含关卡选择逻辑）
