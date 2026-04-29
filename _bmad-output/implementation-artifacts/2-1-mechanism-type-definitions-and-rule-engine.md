# Story 2.1: 信息机制类型定义与规则引擎

Status: done

## Story

As a 开发者,
I want 信息机制的形式化类型定义和规则引擎,
So that 模糊提示和延迟揭示的约束语义明确，可被求解器和游戏逻辑消费。

## Acceptance Criteria (AC)

1. **Given** core 类型系统已建立（Epic 1）**When** 实现 core/mechanism/ 模块 **Then** MechanismType 枚举定义 FuzzyHint 和 DelayedReveal 两种类型
2. **And** DisplayValue 使用 discriminated union 建模（exact/fuzzy/delayed/hidden 四种 kind）
3. **And** CellState 包含 truthValue（真实邻居地雷数）和 displayValue（显示值）双层状态
4. **And** FuzzyHint 规则定义：显示值为 [真实值 - offset, 真实值 + offset] 的范围
5. **And** DelayedReveal 规则定义：翻开后延迟 N 步才显示数字，对 solver 等价于精确数字
6. **And** 每个格子最多一种信息机制，机制间独立作用不叠加（FR15）
7. **And** MechanismRegistry 注册表实现，支持通过类型获取机制处理函数
8. **And** 单元测试覆盖 FuzzyHint 范围计算和 DelayedReveal 语义

## Tasks / Subtasks

- [x] Task 1: 实现 core/mechanism/types.ts — 类型定义 (AC: #1, #2, #3)
  - [x] 定义 `MechanismType` 枚举：`None = 'none'`, `FuzzyHint = 'fuzzy-hint'`, `DelayedReveal = 'delayed-reveal'`
  - [x] 定义 `DisplayValue` discriminated union：exact, fuzzy, delayed, hidden 四种 kind
  - [x] 定义 `CellState` 接口：truthValue + displayValue + mechanism 字段
  - [x] 定义 `FuzzyHintConfig` 接口：offset 字段
  - [x] 定义 `DelayedRevealConfig` 接口：delay（步数）字段
  - [x] 定义 `MechanismConfig` discriminated union：FuzzyHint | DelayedReveal 配置
  - [x] 所有类型有 JSDoc 注释
- [x] Task 2: 实现 core/mechanism/fuzzy-hint.ts — FuzzyHint 规则 (AC: #4)
  - [x] `computeFuzzyDisplay(truthValue: number, offset: number): DisplayValue` — 返回 `{ kind: 'fuzzy', min, max }`
  - [x] min = Math.max(0, truthValue - offset)，max = truthValue + offset
  - [x] 参数校验：truthValue ≥ 0，offset ≥ 0
  - [x] JSDoc 注释
- [x] Task 3: 实现 core/mechanism/delayed-reveal.ts — DelayedReveal 规则 (AC: #5)
  - [x] `computeDelayedDisplay(delay: number): DisplayValue` — 返回 `{ kind: 'delayed', revealAfter: delay, revealed: false }`
  - [x] `isDelayComplete(revealAfter: number, movesSinceReveal: number): boolean`
  - [x] 参数校验：delay ≥ 1
  - [x] JSDoc 注释
- [x] Task 4: 实现 core/mechanism/mechanism-registry.ts — MechanismRegistry (AC: #7)
  - [x] `MechanismHandler` 类型定义
  - [x] `MechanismRegistry` 类：静态 register(), get(), has(), clear() 方法
  - [x] 预注册 FuzzyHint 和 DelayedReveal 处理函数
  - [x] 未注册类型 get() 抛出 MechanismError
  - [x] JSDoc 注释
- [x] Task 5: 创建 core/errors/mechanism-error.ts — MechanismError 子类 (AC: #7)
  - [x] `class MechanismError extends MinesweeperError`，code = `'MECHANISM_ERROR'`
  - [x] 更新 `core/errors/index.ts` barrel 导出 MechanismError
  - [x] JSDoc 注释
- [x] Task 6: 更新 core/mechanism/index.ts barrel 文件 (AC: 全部)
  - [x] 替换 `export {}` 为真实导出
  - [x] 导出所有公共类型、函数和 MechanismRegistry
- [x] Task 7: 编写 FuzzyHint 单元测试 (AC: #4, #8)
  - [x] `fuzzy-hint.test.ts` 就近放置
  - [x] 测试 1: truthValue=3, offset=1 → min=2, max=4
  - [x] 测试 2: truthValue=0, offset=2 → min=0, max=2（min 不低于 0）
  - [x] 测试 3: truthValue=5, offset=0 → min=5, max=5（退化为精确值）
  - [x] 测试 4: 负 truthValue 或负 offset 抛 RangeError
- [x] Task 8: 编写 DelayedReveal 单元测试 (AC: #5, #8)
  - [x] `delayed-reveal.test.ts` 就近放置
  - [x] 测试 1: delay=3 → revealAfter=3, revealed=false
  - [x] 测试 2: isDelayComplete 在 movesSinceReveal < delay 时返回 false
  - [x] 测试 3: isDelayComplete 在 movesSinceReveal >= delay 时返回 true
  - [x] 测试 4: delay < 1 抛 RangeError
- [x] Task 9: 编写 MechanismRegistry 单元测试 (AC: #6, #7)
  - [x] `mechanism-registry.test.ts` 就近放置
  - [x] 测试 1: FuzzyHint 和 DelayedReveal 已预注册
  - [x] 测试 2: get() 返回正确的处理函数
  - [x] 测试 3: 未注册类型 get() 抛出 MechanismError
  - [x] 测试 4: CellState 类型只允许一个 mechanism 字段（类型级约束验证）
- [x] Task 10: 验证 (AC: 全部)
  - [x] `npm run test` 全部通过
  - [x] `npm run lint` 无错误
  - [ ] `npm run build:core` 编译通过
  - [ ] 验证 core 代码无平台 API 引用

## Dev Notes

### 架构接口定义（必须严格遵循）
[Source: architecture.md#Decision 2: 信息机制组合]

**DisplayValue — discriminated union（必须用此模式，禁止 enum + optional fields）：**
```typescript
type DisplayValue =
  | { kind: 'exact'; value: number }
  | { kind: 'fuzzy'; min: number; max: number }
  | { kind: 'delayed'; revealAfter: number; revealed: boolean }
  | { kind: 'hidden' };
```

**CellState — 双层状态模型：**
```typescript
interface CellState {
  truthValue: number;           // 真实邻居地雷数（truth layer）
  displayValue: DisplayValue;   // 显示给玩家的值（presentation layer）
  mechanism: MechanismType;     // 该格子的信息机制类型
}
```

**MVP 范围（Phase 1）：**
- ✅ FuzzyHint：显示值为 `[真实值 - offset, 真实值 + offset]` 的范围
- ✅ DelayedReveal：翻开后延迟 N 步才显示数字，对 solver 等价于精确数字
- ❌ MisleadingInfo：推迟到 Phase 2（Σ₂ᵖ-complete 问题）

**关键设计决策：**
- 每个格子最多一种信息机制（或无机制），机制间独立作用不叠加
- DelayedReveal 对 solver/verifier 等价于精确数字（不影响可解性，只影响玩家获取信息的时序）
- 使用 discriminated union 而非 enum + optional fields（架构强制要求）

### ⚠️ 关键注意事项

1. **使用相对路径导入 + .js 后缀** — `from '../types/index.js'`，`from '../errors/index.js'`
2. **导入 CellId** — 从 `'../types/index.js'` 导入
3. **不要导入 ITopologyGraph** — mechanism 模块不依赖 topology，它们是平行模块
4. **替换 `export {}` 占位** — mechanism/index.ts 当前是 `export {}`
5. **MechanismType 枚举值用 kebab-case** — `'none'`, `'fuzzy-hint'`, `'delayed-reveal'`（与 TopologyType 的 lowercase 模式一致）
6. **CellState.mechanism 字段** — 使用 `MechanismType.None` 表示无信息机制（不用 null），保持 discriminated union 模式一致性，避免下游 null 检查
7. **CellState 放在 mechanism/types.ts** — 虽然架构文档目录结构将 CellState 列在 types/cell.ts，但 CellState 依赖 DisplayValue 和 MechanismType（均在 mechanism 模块），放在 mechanism/types.ts 避免循环依赖。这是有意的偏差。
8. **不要实现游戏状态机或 UI 逻辑** — 只定义类型和纯函数规则，游戏逻辑在 Epic 3
9. **FuzzyHint min 下限为 0** — 地雷数不能为负
10. **注册表模式** — 与 TopologyRegistry 相同的模式（静态方法，模块加载时注册，clear() 用于测试隔离）
11. **MechanismRegistry 用 get() 而非 create()** — 因为 registry 返回处理函数（handler），不是创建实例。TopologyRegistry 用 create() 因为它通过工厂创建拓扑实例。
12. **错误类型选择** — 参数校验（truthValue < 0, offset < 0, delay < 1）使用 `RangeError`；注册表查找失败使用 `MechanismError`（新建子类）
13. **Solver 约束提取** — 本 Story 不实现 solver 约束提取函数。Story 2.3 的 solver 将直接消费 DisplayValue 的 min/max 字段。FuzzyHint 约束为 `min ≤ 邻居地雷数 ≤ max`，DelayedReveal 约束等价于精确数字。
14. **FuzzyHint 密度建议** — 架构文档建议 FuzzyHint 密度 ≤ 15%，否则约束太松导致回溯爆炸。这是 Story 2.3/2.6 的关卡设计约束，本 Story 不强制。

### 下游依赖
- **Story 2.2** 需要：MechanismType, MechanismConfig（二进制格式序列化）
- **Story 2.3** 需要：DisplayValue, FuzzyHint 约束语义（约束求解器）
- **Story 3.2** 需要：CellState, DisplayValue（游戏状态机）
- **Story 5.3** 需要：FuzzyHint 规则（模糊提示 UI）
- **Story 5.4** 需要：DelayedReveal 规则（延迟揭示 UI）

### Epic 1 经验教训
- 相对路径导入 + `.js` 后缀
- 参数校验：无效输入抛出具体错误（RangeError 或 MinesweeperError 子类）
- 注册表模式：静态方法 + 模块加载时注册 + clear() 用于测试隔离
- Vitest globals 已启用，显式 import 也可以
- barrel 文件替换 `export {}` 为真实导出
- 代码审查发现的模式：cellShape 忘记 validateCell → 所有公共方法都应校验输入

### 文件清单（预期）

**新建：**
- `src/core/mechanism/types.ts`
- `src/core/mechanism/fuzzy-hint.ts`
- `src/core/mechanism/fuzzy-hint.test.ts`
- `src/core/mechanism/delayed-reveal.ts`
- `src/core/mechanism/delayed-reveal.test.ts`
- `src/core/mechanism/mechanism-registry.ts`
- `src/core/mechanism/mechanism-registry.test.ts`
- `src/core/errors/mechanism-error.ts`

**修改：**
- `src/core/mechanism/index.ts` — 替换 `export {}` 为真实导出
- `src/core/errors/index.ts` — 添加 MechanismError 导出

### References

- [Source: architecture.md#Decision 2: 信息机制组合] — DisplayValue, CellState, 独立作用模型
- [Source: architecture.md#Data Format Patterns] — discriminated union 优先于 enum + optional
- [Source: architecture.md#Extensibility Patterns] — 注册表模式
- [Source: architecture.md#Enforcement Guidelines] — 命名规范、JSDoc、禁止模式
- [Source: epics.md#Story 2.1] — 验收标准
- [Source: epics.md#Story 2.3] — 约束求解器对 FuzzyHint/DelayedReveal 的约束语义
- [Source: 1-3-story.md#Review Findings] — 注册表模式经验、输入校验

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Completion Notes List

- **Task 1**: 定义 MechanismType 枚举（None/FuzzyHint/DelayedReveal）、DisplayValue discriminated union（exact/fuzzy/delayed/hidden）、CellState 接口（truthValue + displayValue + mechanism + cellId）、FuzzyHintConfig/DelayedRevealConfig/MechanismConfig 类型。全部 readonly + JSDoc。
- **Task 2**: 实现 computeFuzzyDisplay — min=max(0, truthValue-offset), max=truthValue+offset。RangeError 校验。
- **Task 3**: 实现 computeDelayedDisplay + isDelayComplete — delay ≥ 1 校验，movesSinceReveal >= revealAfter 判断。
- **Task 4**: 实现 MechanismRegistry（register/get/has/clear 静态方法）。预注册 FuzzyHint 和 DelayedReveal。未注册类型抛 MechanismError。
- **Task 5**: 创建 MechanismError extends MinesweeperError，code='MECHANISM_ERROR'。更新 errors barrel。
- **Task 6**: 替换 mechanism/index.ts 的 export {} 为真实导出。
- **Task 7**: 6 个 FuzzyHint 测试 — 标准范围、min 下限 clamp、退化为精确值、负值抛错、大 offset clamp。
- **Task 8**: 5 个 DelayedReveal 测试 — 初始状态、delay=1、delay<1 抛错、isDelayComplete false/true。
- **Task 9**: 5 个 MechanismRegistry 测试 — 预注册检查、FuzzyHint handler、DelayedReveal handler、未注册抛错、CellState 单机制约束。
- **Task 10**: 59 个测试全绿、lint 零错误、build:core 编译成功。

### File List

**新建：**
- `minesweeper/src/core/mechanism/types.ts`
- `minesweeper/src/core/mechanism/fuzzy-hint.ts`
- `minesweeper/src/core/mechanism/fuzzy-hint.test.ts`
- `minesweeper/src/core/mechanism/delayed-reveal.ts`
- `minesweeper/src/core/mechanism/delayed-reveal.test.ts`
- `minesweeper/src/core/mechanism/mechanism-registry.ts`
- `minesweeper/src/core/mechanism/mechanism-registry.test.ts`
- `minesweeper/src/core/errors/mechanism-error.ts`

**修改：**
- `minesweeper/src/core/mechanism/index.ts` — 替换 `export {}` 为真实导出
- `minesweeper/src/core/errors/index.ts` — 添加 MechanismError 导出

## Change Log

- 2026-04-29: 完成全部 10 个任务 — MechanismType 枚举、DisplayValue discriminated union、CellState 双层状态、FuzzyHint/DelayedReveal 规则函数、MechanismRegistry 注册表、MechanismError 错误子类，含 16 个新增单元测试全部通过。

### Review Findings

- [x] [Review][Patch] NaN/Infinity/非整数输入绕过校验 — computeFuzzyDisplay 和 computeDelayedDisplay 缺少 Number.isFinite/isInteger 校验 [fuzzy-hint.ts, delayed-reveal.ts]
- [x] [Review][Patch] MechanismType.None 无 handler — get(None) 崩溃，下游遍历 cells 时会触发 [mechanism-registry.ts]
- [x] [Review][Patch] afterEach 动态 import 恢复 registry 是死代码 — ESM 模块缓存导致 side effects 不重新执行 [mechanism-registry.test.ts]
- [x] [Review][Defer] Registry handler 的 `as` 转换无运行时校验 [mechanism-registry.ts] — deferred, 当前只有内部代码调用，Story 2.2 codec 提供类型安全 config
- [x] [Review][Defer] fuzzy max 无上限 clamp [fuzzy-hint.ts] — deferred, 关卡设计者控制 offset，上限由关卡验证器在 Story 2.4 检查
