# Story 4.4: 关卡资源加载与中断恢复

Status: done

## Story
As a 玩家, I want 关卡文件快速加载，且浏览器中断不丢失当前状态。

## Tasks / Subtasks
- [x] LevelManager 关卡加载编排
- [x] saveState() 保存当前游戏状态到 IStorage
- [x] getSavedState() 读取保存的状态
- [x] hasSavedState() / clearSavedState()
- [x] handleCompletion / handleFailure 编排
- [x] pauseGame / resumeGame 编排
- [x] 单元测试覆盖

## Dev Notes
SavedGameState 包含 levelIndex、cellStates、elapsedMs。状态恢复（将 cellStates 应用回 BoardModel）需要在 UI 层实现，因为需要重新加载关卡文件并创建新的 BoardModel。

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6
### Completion Notes List
- LevelManager 编排 BoardModel + TimerManager + ProgressManager
- saveState 序列化所有格子状态和计时器 elapsed
- getSavedState 带基本类型验证
- handleCompletion/handleFailure 自动记录进度并清除保存状态
### File List
- `src/game/logic/level-manager.ts`
- `src/game/logic/level-manager.test.ts`
