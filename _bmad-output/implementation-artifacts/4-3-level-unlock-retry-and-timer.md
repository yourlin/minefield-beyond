# Story 4.3: 关卡解锁、重试与计时器

Status: done

## Story
As a 玩家, I want 通关后自动解锁下一关，失败后可以无限重试并保留标记。

## Tasks / Subtasks
- [x] recordCompletion 自动解锁下一关
- [x] retry 保留旗帜标记
- [x] TimerManager 分层计时器（教学 2min / 中段 5min / 硬核 8min）
- [x] 计时器 pause/resume/stop/reset
- [x] 单元测试覆盖

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6
### Completion Notes List
- TimerManager：wall-clock 计时，pause 累计暂停时间，stop 锁定 elapsed
- 分层计时器：getTimeLimitMs(levelNumber) 按关卡编号返回时间上限
- retry 调用 BoardModel.resetBoard(true) 保留旗帜
- 代码审查修复：resume() 添加 stopped guard，getElapsedMs() 添加 Math.max(0, ...)
### File List
- `src/game/logic/timer-manager.ts`
- `src/game/logic/timer-manager.test.ts`
