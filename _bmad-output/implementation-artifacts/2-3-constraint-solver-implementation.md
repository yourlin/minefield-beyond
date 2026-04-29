# Story 2.3: 约束求解器实现

Status: done

## Story

As a 关卡设计者,
I want 一个可解性验证器核心算法,
So that 我可以验证任何关卡在其信息机制规则下是否存在唯一解。

## Acceptance Criteria (AC)

1. **Given** 拓扑接口和信息机制规则已定义（Story 1.3, Story 2.1）**When** 实现 core/solver/ 模块 **Then** 约束传播算法根据已知数字（含 FuzzyHint 范围约束）缩小每个未知格子的可能性
2. **And** 回溯搜索在约束传播无法继续时假设格子状态并递归验证
3. **And** 唯一解验证：找到第一个解后继续搜索，找到第二个解则报告"非唯一解"
4. **And** 连通分量分割：独立区域分别求解，避免搜索空间爆炸
5. **And** 弧一致性（arc consistency）预处理
6. **And** FuzzyHint 约束为 min ≤ 邻居地雷数 ≤ max
7. **And** DelayedReveal 约束与精确数字相同
8. **And** SolverResult 包含：是否唯一解、解的内容、失败时的具体原因和差异位置（FR58）
9. **And** 单元测试覆盖：5×5 六边形 + 精确数字唯一解、5×5 六边形 + FuzzyHint 唯一解、非唯一解检测、无解检测
10. **And** 验证时间在 200 格子规模下 < 30s（NFR7）

## Tasks / Subtasks

- [x] Task 1: 创建 core/solver/types.ts — SolverResult 和相关类型 (AC: #8)
  - [x] 定义 `CellAssignment` 类型：cellId + isMine (boolean)
  - [x] 定义 `SolverResult` discriminated union：unique / multiple / unsolvable
  - [x] unique: solution (CellAssignment[])
  - [x] multiple: solutions (CellAssignment[][])（最多保留前 2 个解）+ differingCells (CellId[])
  - [x] unsolvable: reason (string)
  - [x] 定义 `SolverInput` 接口：topology (ITopologyGraph), revealedCells (Map<CellId, number | {min, max}>), mineCount (number)
  - [x] JSDoc 注释
- [x] Task 2: 实现 core/solver/constraint-propagation.ts — 约束传播 (AC: #1, #5, #6, #7)
  - [x] `ConstraintPropagator` 类：接收 SolverInput，维护每个未知格子的 domain（{mine, safe}）
  - [x] 初始化：已翻开格子标记为 safe，根据 revealedCells 建立约束
  - [x] 精确数字约束：邻居中地雷数 === value
  - [x] FuzzyHint 约束：min ≤ 邻居中地雷数 ≤ max
  - [x] DelayedReveal 约束：与精确数字相同
  - [x] 弧一致性（AC-3 算法）：反复传播直到无变化
  - [x] 当某格子 domain 缩减为单值时，触发级联传播
  - [x] 返回传播后的 domain 状态和是否发现矛盾
  - [x] JSDoc 注释
- [x] Task 3: 实现 core/solver/backtrack-search.ts — 回溯搜索 (AC: #2, #3)
  - [x] `BacktrackSearch` 类：接收传播后的 domain 状态
  - [x] 选择分支变量：选 domain 大小 > 1 的格子（优先选约束最多的）
  - [x] 假设格子为 mine → 传播 → 递归
  - [x] 假设格子为 safe → 传播 → 递归
  - [x] 找到第一个解后继续搜索第二个解
  - [x] 找到第二个解时记录差异位置并停止
  - [x] 矛盾时回溯
  - [x] JSDoc 注释
- [x] Task 4: 实现 core/solver/connected-components.ts — 连通分量分割 (AC: #4)
  - [x] `findConnectedComponents` 函数：基于拓扑邻接和已翻开格子，将未知区域分割为独立分量
  - [x] 每个分量独立求解，结果合并
  - [x] 如果任一分量无解，整体无解
  - [x] 如果任一分量多解，整体多解
  - [x] JSDoc 注释
- [x] Task 5: 实现 core/solver/solver.ts — 组合入口 (AC: 全部)
  - [x] `ConstraintSolver` 类：实现完整求解流程
  - [x] solve(input: SolverInput): SolverResult
  - [x] 流程：连通分量分割 → 每个分量约束传播 → 需要时回溯搜索 → 合并结果
  - [x] 全局地雷数约束：总地雷数 === input.mineCount
  - [x] JSDoc 注释
- [x] Task 6: 更新 core/solver/index.ts barrel 文件
  - [x] 替换 `export {}` 为真实导出
  - [x] 导出 ConstraintSolver, SolverResult, SolverInput, CellAssignment
- [x] Task 7: 编写约束传播单元测试 (AC: #1, #5, #6, #7)
  - [x] `constraint-propagation.test.ts` 就近放置
  - [x] 测试 1: 精确数字约束传播（3×3 hex，中心格子数字 0 → 所有邻居标记 safe）
  - [x] 测试 2: FuzzyHint 约束传播（范围约束缩减 domain）
  - [x] 测试 3: 矛盾检测（不可能的约束组合）
  - [x] 测试 4: 级联传播（一个格子确定后触发邻居约束更新）
- [x] Task 8: 编写回溯搜索单元测试 (AC: #2, #3)
  - [x] `backtrack-search.test.ts` 就近放置
  - [x] 测试 1: 简单回溯找到唯一解
  - [x] 测试 2: 找到两个解后停止并报告差异
- [x] Task 9: 编写 solver 集成测试 (AC: #9, #10)
  - [x] `solver.test.ts` 就近放置
  - [x] 测试 1: 5×5 六边形 + 精确数字唯一解
  - [x] 测试 2: 5×5 六边形 + FuzzyHint 唯一解
  - [x] 测试 3: 非唯一解检测（返回差异位置）
  - [x] 测试 4: 无解检测
  - [x] 测试 5: 连通分量分割验证（两个独立区域）
  - [x] 测试 6: 200 格子规模性能测试（< 30s）
- [x] Task 10: 验证 (AC: 全部)
  - [x] `npm run test` 全部通过
  - [x] `npm run lint` 无错误
  - [x] `npm run build:core` 编译通过
  - [x] 验证 core 代码无平台 API 引用

## Dev Notes

### 架构接口定义（必须严格遵循）
[Source: architecture.md#Decision 3: 约束求解器]

**算法概要：**
1. 初始化：每个未知格子标记为 {可能是雷, 可能安全}
2. 约束传播：根据已知数字（含信息机制变换后的约束）缩小可能性
3. 回溯搜索：当约束传播无法继续时，假设某格子状态并递归验证
4. 唯一解验证：找到第一个解后继续搜索，如果找到第二个解则报告"非唯一解"

**信息机制对约束的影响（MVP 范围）：**
- FuzzyHint：约束变为 `min ≤ 邻居地雷数 ≤ max`（范围约束）
- DelayedReveal：约束与精确数字相同（不影响可解性）

**性能优化要求：**
- 必须做连通分量分割——独立区域分别求解
- 必须做 arc consistency（弧一致性）预处理
- 可选优化：从边界格子开始约束传播

### SolverInput 设计说明

```typescript
interface SolverInput {
  /** 拓扑图（提供邻接查询） */
  readonly topology: ITopologyGraph;
  /** 已翻开格子的约束：cellId → 精确值 number 或范围 {min, max} */
  readonly revealedCells: ReadonlyMap<CellId, number | { min: number; max: number }>;
  /** 总地雷数 */
  readonly mineCount: number;
}
```

**注意：** revealedCells 的值类型：
- `number` — 精确数字（包括 DelayedReveal，对 solver 等价于精确数字）
- `{ min, max }` — FuzzyHint 范围约束

### SolverResult 设计说明

```typescript
type SolverResult =
  | { readonly kind: 'unique'; readonly solution: readonly CellAssignment[] }
  | { readonly kind: 'multiple'; readonly solutions: readonly (readonly CellAssignment[])[]; readonly differingCells: readonly CellId[] }
  | { readonly kind: 'unsolvable'; readonly reason: string };

interface CellAssignment {
  readonly cellId: CellId;
  readonly isMine: boolean;
}
```

### 约束传播算法细节

**AC-3 弧一致性：**
1. 对每个已翻开格子 c，建立约束：c 的未知邻居中地雷数在 [min, max] 范围内
2. 如果某约束的 min === 未知邻居数 → 所有未知邻居都是雷
3. 如果某约束的 max === 0 → 所有未知邻居都安全
4. 当某格子 domain 缩减为单值时，更新所有相关约束并重新传播
5. 重复直到无变化或发现矛盾

**矛盾检测：**
- 某格子 domain 为空（既不能是雷也不能是安全）
- 某约束的 min > 未知邻居中可能是雷的数量
- 某约束的 max < 未知邻居中确定是雷的数量

### 连通分量分割

将未知格子按拓扑邻接关系分割为独立分量。两个未知格子属于同一分量当且仅当它们共享至少一个已翻开的约束格子，或通过其他未知格子间接相连。

每个分量独立求解，结果合并：
- 所有分量唯一解 → 整体唯一解
- 任一分量多解 → 整体多解
- 任一分量无解 → 整体无解

### ⚠️ 关键注意事项

1. **使用相对路径导入 + .js 后缀** — `from '../types/index.js'`，`from '../topology/types.js'`
2. **SolverResult 使用 discriminated union** — 不用 enum + optional fields
3. **错误类型** — solver 内部矛盾用 SolverError
4. **不引入外部依赖** — 纯 TypeScript 实现
5. **城墙模式** — 内部可变数据结构（性能），对外返回不可变结果
6. **全局地雷数约束** — 除了局部约束，还需要验证总地雷数 === mineCount
7. **revealedCells 使用 ReadonlyMap** — 不用 Record，因为 key 是 number（CellId）
8. **ITopologyGraph 依赖** — solver 只依赖逻辑层接口，不依赖渲染层

### 下游依赖
- **Story 2.4** 需要：ConstraintSolver（CLI 验证器）
- **Story 2.6** 需要：ConstraintSolver（验证测试关卡唯一解）
- **Story 6.3** 需要：solver 的推理链（死因回顾展示解题路径）

### Epic 1 + Story 2.1/2.2 经验教训
- 相对路径导入 + `.js` 后缀
- 参数校验：Number.isFinite + Number.isInteger
- 注册表模式：静态方法 + 模块加载时注册 + clear() 用于测试隔离
- discriminated union 模式（不用 enum + optional fields）
- afterEach 中显式重新注册（不用动态 import，ESM 缓存问题）
- 所有公共方法需要 JSDoc
- barrel 文件替换 `export {}` 为真实导出
- encode 时验证输入边界（Story 2.2 审查发现）
- validate() 返回 ValidationResult 不抛异常，decode() 对无效数据抛异常

### 文件清单（预期）

**新建：**
- `src/core/solver/types.ts`
- `src/core/solver/constraint-propagation.ts`
- `src/core/solver/constraint-propagation.test.ts`
- `src/core/solver/backtrack-search.ts`
- `src/core/solver/backtrack-search.test.ts`
- `src/core/solver/connected-components.ts`
- `src/core/solver/connected-components.test.ts`（可选，集成测试覆盖）
- `src/core/solver/solver.ts`
- `src/core/solver/solver.test.ts`

**修改：**
- `src/core/solver/index.ts` — 替换 `export {}` 为真实导出

### References

- [Source: architecture.md#Decision 3: 约束求解器] — 算法概要、性能优化要求
- [Source: architecture.md#Decision 2: 信息机制组合] — FuzzyHint/DelayedReveal 约束语义
- [Source: epics.md#Story 2.3] — 验收标准
- [Source: 2-2-story.md#Review Findings] — 输入验证、Float32 精度

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Completion Notes List

- **Task 1**: 创建 types.ts，定义 CellAssignment、CellConstraintValue、SolverInput、SolverResult（discriminated union: unique/multiple/unsolvable）。
- **Task 2**: 实现 ConstraintPropagator，使用 AC-3 弧一致性算法。domain 用位掩码（MINE=1, SAFE=2, BOTH=3）表示。支持精确数字和 FuzzyHint 范围约束。包含全局地雷数约束传播。支持 clone() 用于回溯。
- **Task 3**: 实现 BacktrackSearch，找到最多 2 个解后停止。记录差异位置。使用 propagator.clone() + assign() 进行分支。
- **Task 4**: 实现 findConnectedComponents，BFS 分割未知格子为独立分量。通过共享约束格子和直接邻接关系连接。
- **Task 5**: 实现 ConstraintSolver 组合入口。单分量直接求解，多分量分别求解后合并。全局地雷数约束在合并时验证。
- **Task 6**: 更新 barrel 文件，导出所有公共 API。
- **Task 7**: 约束传播测试 — 4 个测试覆盖精确数字传播、FuzzyHint 传播、矛盾检测、级联传播。
- **Task 8**: 回溯搜索测试 — 2 个测试覆盖唯一解搜索和多解差异报告。
- **Task 9**: Solver 集成测试 — 8 个测试覆盖 5×5 精确数字唯一解、FuzzyHint 唯一解、非唯一解检测、无解检测、连通分量分割、200 格子性能测试、全部翻开边界情况、单格子边界情况。
- **Task 10**: 全部 102 个测试通过（13 个测试文件），lint 无错误，build:core 编译通过，core 代码无平台 API 引用。

### Change Log

- 2026-04-29: Story 2.3 完整实现 — 约束求解器（约束传播 + 回溯搜索 + 连通分量分割）
- 2026-04-29: 代码审查修复 — 4 项 HIGH 修复（约束 min/max 双重扣减、初始矛盾静默丢弃、全局约束未反馈局部传播、约束不可变重构）

### Review Findings

- [x] [Review][Patch] 约束 min/max 双重扣减 — propagateConstraint() 每次调用都从 constraint.min 减去 determinedMines，导致累积错误。修复：约束存储 originalMin/originalMax 不可变值，每次评估时从当前 domain 状态重新计算 [constraint-propagation.ts]
- [x] [Review][Patch] 初始矛盾静默丢弃 — 构造函数中当所有邻居已确定但约束要求地雷时，矛盾被跳过。修复：记录 initialContradiction，propagate() 开始时检查 [constraint-propagation.ts]
- [x] [Review][Patch] 全局约束未反馈局部传播 — propagateGlobalMineCount() 只运行一次，结果不触发局部约束重新评估。修复：外层循环交替运行局部和全局传播直到不动点 [constraint-propagation.ts]
- [x] [Review][Patch] clone() 可共享不可变约束 — 约束现在是不可变的（originalMin/originalMax），clone 只需复制 domains [constraint-propagation.ts]

### File List

**新建：**
- `src/core/solver/types.ts` — SolverResult, SolverInput, CellAssignment, CellConstraintValue
- `src/core/solver/constraint-propagation.ts` — ConstraintPropagator (AC-3 弧一致性)
- `src/core/solver/constraint-propagation.test.ts` — 约束传播测试（4 用例）
- `src/core/solver/backtrack-search.ts` — BacktrackSearch（回溯搜索）
- `src/core/solver/backtrack-search.test.ts` — 回溯搜索测试（2 用例）
- `src/core/solver/connected-components.ts` — findConnectedComponents（连通分量分割）
- `src/core/solver/solver.ts` — ConstraintSolver（组合入口）
- `src/core/solver/solver.test.ts` — Solver 集成测试（8 用例）

**修改：**
- `src/core/solver/index.ts` — 替换 `export {}` 为真实导出
