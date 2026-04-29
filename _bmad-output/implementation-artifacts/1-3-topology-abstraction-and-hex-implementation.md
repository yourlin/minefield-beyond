# Story 1.3: 拓扑抽象接口与六边形拓扑实现

Status: done

## Story

As a 开发者,
I want 统一的拓扑抽象接口和第一个拓扑（六边形）的完整实现,
So that 后续所有拓扑类型可以通过实现相同接口扩展，且六边形邻接计算经过验证。

## Acceptance Criteria (AC)

1. **Given** core 类型定义已完成（Story 1.2）**When** 实现 ITopologyGraph 和 ITopologyRenderer 接口及 HexTopology **Then** ITopologyGraph 接口定义 cells()、neighbors()、cellCount() 方法
2. **And** ITopologyRenderer 扩展 ITopologyGraph，增加 cellShape()、cellCenter()、cellAt() 方法
3. **And** HexTopology 正确计算六边形网格的 6 邻居邻接关系
4. **And** 边缘和角落格子的邻居数量正确（< 6）
5. **And** 邻接数据预计算为邻接表，neighbors() 查询 O(1)
6. **And** TopologyRegistry 注册表实现，可通过 TopologyType 获取拓扑工厂函数
7. **And** 单元测试覆盖：中心格子 6 邻居、边缘格子邻居数、角落格子邻居数、邻接对称性（A 是 B 的邻居则 B 是 A 的邻居）
8. **And** barrel 文件（index.ts）正确导出公共 API

## Tasks / Subtasks

- [x] Task 1: 实现 core/topology/types.ts — 接口和类型定义 (AC: #1, #2)
  - [x] 定义 `CellShape` 类型：`'hexagon' | 'triangle' | 'rectangle' | 'polygon'`
  - [x] 定义 `TopologyType` 枚举：Hexagonal, Triangle, Torus, Irregular, Mixed
  - [x] 定义 `ITopologyGraph<CellId = number>` 接口：cells(), neighbors(), cellCount()
  - [x] 定义 `ITopologyRenderer<CellId = number>` 接口：extends ITopologyGraph，增加 cellShape(), cellCenter(), cellAt()
  - [x] 定义 `HexConfig` 接口：rows, cols（六边形网格配置）
  - [x] 所有接口和类型有 JSDoc 注释
- [x] Task 2: 实现 core/topology/hex-topology.ts — HexTopology 类 (AC: #3, #4, #5)
  - [x] `class HexTopology implements ITopologyRenderer`
  - [x] 构造函数接受 `HexConfig`（rows, cols），预计算邻接表
  - [x] 内部使用 offset 坐标（col, row）→ CellId 映射：`cellId = row * cols + col`
  - [x] 六边形邻居计算：偶数行和奇数行的邻居偏移不同（flat-top 或 pointy-top 选其一，保持一致）
  - [x] `cells()` 返回所有 CellId 数组
  - [x] `neighbors(cell)` 从预计算邻接表 O(1) 查询，无效 cell 抛出 TopologyError
  - [x] `cellCount()` 返回 rows * cols
  - [x] `cellShape()` 返回 `'hexagon'`
  - [x] `cellCenter(cell)` 返回 Point2D 屏幕坐标（基于 hex 几何计算）
  - [x] `cellAt(screenX, screenY)` 实现 hex hit-test，返回 CellId | null
  - [x] 所有方法有 JSDoc 注释
- [x] Task 3: 实现 core/topology/topology-registry.ts — TopologyRegistry (AC: #6)
  - [x] `TopologyFactory` 类型定义：`(config: unknown) => ITopologyGraph`
  - [x] `TopologyRegistry` 类：静态 register(), create(), has() 方法
  - [x] create() 对未注册类型抛出 TopologyError
  - [x] 在模块加载时注册 HexTopology 工厂
  - [x] JSDoc 注释
- [x] Task 4: 更新 core/topology/index.ts barrel 文件 (AC: #8)
  - [x] 替换 `export {}` 为真实导出
  - [x] 导出：ITopologyGraph, ITopologyRenderer, CellShape, TopologyType, HexTopology, HexConfig, TopologyRegistry
- [x] Task 5: 编写 HexTopology 单元测试 (AC: #7)
  - [x] `hex-topology.test.ts` 就近放置
  - [x] 测试 1: 5×5 网格中心格子有 6 个邻居
  - [x] 测试 2: 边缘格子（非角落）邻居数 < 6（具体数取决于位置）
  - [x] 测试 3: 角落格子邻居数（2 或 3）
  - [x] 测试 4: 邻接对称性 — 遍历所有格子，验证 A 是 B 的邻居则 B 是 A 的邻居
  - [x] 测试 5: cellCount() 返回 rows * cols
  - [x] 测试 6: cells() 返回正确数量的唯一 CellId
  - [x] 测试 7: neighbors() 对无效 CellId 抛出 TopologyError
  - [x] 测试 8: cellShape() 返回 'hexagon'
  - [x] 测试 9: cellCenter() 返回合理的 Point2D 坐标
  - [x] 测试 10: cellAt() 对 cellCenter 返回的坐标能正确反查到原 cell
- [x] Task 6: 编写 TopologyRegistry 单元测试 (AC: #6)
  - [x] `topology-registry.test.ts` 就近放置
  - [x] 测试 1: 注册后 has() 返回 true
  - [x] 测试 2: create() 返回正确的拓扑实例
  - [x] 测试 3: 未注册类型 create() 抛出 TopologyError
  - [x] 测试 4: HexTopology 已预注册
- [x] Task 7: 验证 (AC: 全部)
  - [x] `npm run test` 全部通过
  - [x] `npm run lint` 无错误
  - [x] `npm run build:core` 编译通过
  - [x] 验证 core 代码无平台 API 引用

## Dev Notes

### 架构接口定义（必须严格遵循）
[Source: architecture.md#Decision 1: 拓扑抽象层]

**ITopologyGraph — 纯逻辑层（core/solver/verifier 依赖）：**
```typescript
interface ITopologyGraph<CellId = number> {
  cells(): CellId[];
  neighbors(cell: CellId): CellId[];
  cellCount(): number;
}
```

**ITopologyRenderer — 渲染层（game/reader 使用）：**
```typescript
interface ITopologyRenderer<CellId = number> extends ITopologyGraph<CellId> {
  cellShape(cell: CellId): CellShape;
  cellCenter(cell: CellId): Point2D;
  cellAt(screenX: number, screenY: number): CellId | null;
}
```

**CellShape 类型：**
```typescript
type CellShape = 'hexagon' | 'triangle' | 'rectangle' | 'polygon';
```

**TopologyType 枚举：**
```typescript
enum TopologyType {
  Hexagonal = 'hexagonal',
  Triangle = 'triangle',
  Torus = 'torus',
  Irregular = 'irregular',
  Mixed = 'mixed',
}
```

**TopologyRegistry 注册表模式：**
```typescript
type TopologyFactory = (config: unknown) => ITopologyGraph;

class TopologyRegistry {
  private static factories = new Map<TopologyType, TopologyFactory>();
  static register(type: TopologyType, factory: TopologyFactory): void;
  static create(type: TopologyType, config: unknown): ITopologyGraph;
  static has(type: TopologyType): boolean;
}
```

### 六边形网格实现指南

**坐标系统选择：** 使用 offset 坐标（col, row），CellId = row * cols + col。这是最直观的网格布局方式。

**邻居计算（pointy-top hex，odd-r offset）：**
- 偶数行邻居偏移：`[[-1,0],[+1,0],[0,-1],[+1,-1],[0,+1],[+1,+1]]`（或类似，取决于 flat-top vs pointy-top）
- 奇数行邻居偏移：`[[-1,0],[+1,0],[-1,-1],[0,-1],[-1,+1],[0,+1]]`
- 注意：必须选择一种 hex 方向（flat-top 或 pointy-top）并保持一致
- 边界检查：col ∈ [0, cols-1]，row ∈ [0, rows-1]

**邻接表预计算：** 构造时遍历所有格子，计算邻居并存入 `Map<CellId, CellId[]>`。neighbors() 直接查表返回。

**cellCenter 计算（pointy-top hex 示例）：**
```
x = col * hexWidth + (row % 2 === 1 ? hexWidth / 2 : 0)
y = row * hexHeight * 0.75
```
其中 hexWidth 和 hexHeight 基于 hex 边长计算。使用合理的默认边长（如 30px）。

**cellAt hit-test：** 反向计算 — 从屏幕坐标估算最近的 hex 格子，然后检查距离。可以用 "pixel to hex" 标准算法。

### ⚠️ 关键注意事项

1. **使用相对路径导入 + .js 后缀** — 遵循 Story 1.1/1.2 建立的模式（`from '../types/index.js'`），不使用 `@core/*`。
2. **导入 CellId 和 Point2D** — 从 `'../types/index.js'` 导入，不要重新定义。
3. **导入 TopologyError** — 从 `'../errors/index.js'` 导入。
4. **替换 `export {}` 占位** — topology/index.ts 当前是 `export {}`，需替换为真实导出。
5. **不要定义 DisplayValue/CellState/MechanismType** — 这些属于 Story 2.1。
6. **不要实现其他拓扑** — 只实现 HexTopology。TriangleTopology 等在 Story 5.1。
7. **TopologyRegistry 使用静态方法** — 全局单例模式，不需要实例化。
8. **Vitest globals 已启用** — 测试中无需 import describe/it/expect（但显式 import 也可以，Story 1.2 的模式）。
9. **no-console ESLint 规则** — core 中禁止 console，如需日志使用 ILogger。
10. **neighbors() 对无效 cell 的行为** — 抛出 TopologyError，不要静默返回空数组。

### 下游依赖
- **Story 2.1** 需要：ITopologyGraph（信息机制规则引擎）
- **Story 2.2** 需要：TopologyType（二进制格式拓扑类型标识）
- **Story 2.3** 需要：ITopologyGraph（约束求解器）
- **Story 3.1** 需要：ITopologyRenderer, HexTopology（Cocos Creator 棋盘渲染）
- **Story 5.1** 需要：ITopologyGraph, ITopologyRenderer 接口（三角形/环面拓扑实现）

### Story 1.1 + 1.2 经验教训
- 空 barrel 文件必须有 `export {}`（已修复），本 Story 替换为真实导出
- ESLint v9 flat config（`eslint.config.mjs`），不是 `.eslintrc.cjs`
- 依赖版本使用 `~` 紧约束
- Vitest globals 已启用
- 相对路径导入 + `.js` 后缀（`from './types.js'`）
- SeededRandom 代码审查：添加了参数校验（min > max 抛 RangeError，NaN/Infinity seed 抛 RangeError）— 本 Story 也应对无效输入做校验
- ConsoleLogger 代码审查：修复了 context 丢弃 bug — 注意分支逻辑完整性

### 文件清单（预期）

**新建：**
- `src/core/topology/types.ts`
- `src/core/topology/hex-topology.ts`
- `src/core/topology/hex-topology.test.ts`
- `src/core/topology/topology-registry.ts`
- `src/core/topology/topology-registry.test.ts`

**修改：**
- `src/core/topology/index.ts` — 替换 `export {}` 为真实导出

### References

- [Source: architecture.md#Decision 1: 拓扑抽象层] — ITopologyGraph, ITopologyRenderer 接口定义
- [Source: architecture.md#Extensibility Patterns] — TopologyRegistry 注册表模式
- [Source: architecture.md#Naming Patterns] — 文件命名 kebab-case，类 PascalCase
- [Source: architecture.md#Enforcement Guidelines] — core 零依赖，JSDoc，禁止模式
- [Source: architecture.md#Complete Project Directory Structure] — topology/ 目录结构
- [Source: epics.md#Story 1.3] — 验收标准
- [Source: epics.md#Story 5.1] — 下游拓扑扩展需求
- [Source: 1-2-story.md#Review Findings] — 参数校验模式

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Completion Notes List

- **Task 1**: 定义 CellShape 联合类型、TopologyType 枚举（5 种拓扑）、ITopologyGraph 接口（cells/neighbors/cellCount）、ITopologyRenderer 接口（extends ITopologyGraph + cellShape/cellCenter/cellAt）、HexConfig 接口。全部带 JSDoc。
- **Task 2**: 实现 HexTopology（pointy-top, odd-r offset 坐标系）。构造时预计算邻接表和 cell 中心坐标。偶数行/奇数行使用不同邻居偏移。neighbors() O(1) 查表。cellAt() 使用最近中心点 + 距离阈值 hit-test。无效 cell 抛出 TopologyError。构造函数校验 rows/cols 为正整数。
- **Task 3**: 实现 TopologyRegistry（静态方法：register/create/has/clear）。模块加载时自动注册 HexTopology 工厂。未注册类型 create() 抛出 TopologyError。
- **Task 4**: 替换 topology/index.ts 的 `export {}` 为真实导出（ITopologyGraph, ITopologyRenderer, CellShape, TopologyType, HexTopology, HexConfig, TopologyRegistry, TopologyFactory）。
- **Task 5**: 编写 13 个 HexTopology 测试 — 中心格子 6 邻居、边缘格子 < 6、角落格子 2-3、邻接对称性（全格子遍历）、cellCount、cells 唯一性、无效 cell 抛错、cellShape、cellCenter 坐标合理性、cellAt 往返验证、远距离 null、无效 config 抛错、1×1 网格边界。
- **Task 6**: 编写 5 个 TopologyRegistry 测试 — has() 注册检查、create() 实例验证、未注册类型抛错、预注册状态、clear() 清除。
- **Task 7**: 全部验证通过 — 38 个测试全绿、lint 零错误、build:core 编译成功、零平台依赖。

### File List

**新建：**
- `minesweeper/src/core/topology/types.ts`
- `minesweeper/src/core/topology/hex-topology.ts`
- `minesweeper/src/core/topology/hex-topology.test.ts`
- `minesweeper/src/core/topology/topology-registry.ts`
- `minesweeper/src/core/topology/topology-registry.test.ts`

**修改：**
- `minesweeper/src/core/topology/index.ts` — 替换 `export {}` 为真实导出

## Change Log

- 2026-04-29: 完成全部 7 个任务 — 拓扑抽象接口（ITopologyGraph, ITopologyRenderer）、HexTopology（pointy-top odd-r offset）、TopologyRegistry 注册表、38 个单元测试全部通过。

### Review Findings

- [x] [Review][Patch] `cellShape()` 不校验 cell ID — 其他 cell 查询方法都调用 validateCell()，cellShape 跳过了 [hex-topology.ts]
- [x] [Review][Patch] `cellAt()` hit-test 使用内切圆半径，hex 角落有死区 — 阈值 (hexWidth/2)² ≈ 25.98² 小于外接圆半径 30²，角落点击不响应 [hex-topology.ts]
- [x] [Review][Patch] 缺少 1×N 和 N×1 网格测试 — 单行/单列网格的偶奇行偏移边界未覆盖 [hex-topology.test.ts]
- [x] [Review][Patch] 缺少 cellAt 边界测试 — 只测了中心点和远距离，未测 hex 边界附近 [hex-topology.test.ts]
- [x] [Review][Patch] 缺少精确邻居集验证测试 — 对称性测试通过但未验证具体邻居 ID 正确性 [hex-topology.test.ts]
- [x] [Review][Defer] `cellAt()` O(n) 暴力扫描 [hex-topology.ts] — deferred, 当前规模 ≤200 cells 无性能风险，Story 3.1 可优化
- [x] [Review][Defer] TopologyRegistry.create() 返回 ITopologyGraph 丢失 ITopologyRenderer [topology-registry.ts] — deferred, 架构设计选择，下游可直接构造 HexTopology
- [x] [Review][Defer] TopologyRegistry.register() 静默覆盖已有注册 [topology-registry.ts] — deferred, 当前只有一个拓扑注册
