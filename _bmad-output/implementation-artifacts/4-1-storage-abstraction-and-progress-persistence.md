# Story 4.1: 存储抽象层与进度持久化

Status: done

## Story
As a 玩家, I want 我的游戏进度在关闭浏览器后不丢失, So that 我下次打开游戏时可以继续之前的进度。

## Tasks / Subtasks
- [x] IStorage 接口定义 get/set/has/remove/clear
- [x] MemoryStorage 测试实现
- [x] LocalStorageAdapter 实现（JSON 序列化，NFR15 降级）
- [x] ProgressManager 封装进度读写
- [x] 数据损坏降级到默认值
- [x] 单元测试覆盖

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6
### Completion Notes List
- IStorage 接口 + MemoryStorage（测试用）+ LocalStorageAdapter（生产用，带 prefix 隔离）
- ProgressManager：10 关进度管理，recordCompletion 自动解锁下一关，bestTime 取最小值
- isValidProgress 验证器：检查 levels 数组长度、字段类型（含 bestTime null/number 检查）
- 代码审查修复：recordCompletion/recordAttempt 添加 bounds check，isValidProgress 添加 bestTime 验证
### Change Log
- 2026-04-29: Story 4.1 实现
- 2026-04-29: 代码审查修复
### File List
- `src/game/logic/storage.ts`
- `src/game/logic/storage.test.ts`
- `src/game/logic/progress-manager.ts`
- `src/game/logic/progress-manager.test.ts`
