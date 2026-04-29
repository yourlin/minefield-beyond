---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/prd-validation-report.md'
workflowType: 'architecture'
lastStep: 8
status: 'complete'
completedAt: '2026-04-27'
project_name: '高挑战性扫雷游戏'
user_name: 'Linyesh'
date: '2026-04-27'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**功能需求（62 条 FR）：**

| 能力域 | FR 数量 | 架构含义 |
|--------|---------|---------|
| 棋盘拓扑系统 | 9 | 需要统一的图抽象层，支持 5 种拓扑类型的邻接计算、坐标映射和 hit-test |
| 信息机制系统 | 7 | 需要独立的规则引擎，支持 3 种机制的形式化语义定义和组合行为 |
| 游戏核心交互 | 8 | 需要输入适配层（鼠标/触摸）、状态机（格子生命周期）、自动展开算法 |
| 视觉与音效反馈 | 4 | 需要状态驱动的渲染管线和音频管理器 |
| 关卡流程管理 | 8 | 需要关卡状态机、进度持久化、计时器系统 |
| 教学与引导系统 | 5 | 需要可配置的引导框架，按关卡触发不同教学内容 |
| 失败反馈与死因回顾 | 6 | 需要游戏状态快照和解题路径回放能力，支持分层揭示 |
| 关卡数据与工具链 | 11 | 需要二进制格式规范、共享解析库、独立的阅读器和验证器应用 |
| 部署与分发 | 4 | 静态 Web 部署，Vite 构建管线 |

**非功能需求（17 条 NFR）驱动的架构决策：**

- **性能（NFR1-7）：** 交互响应 < 100ms 要求邻接查询预计算或 O(1) 查表；内存 ≤ 50MB 要求紧凑数据结构；验证器 < 30s 要求高效的约束求解算法
- **可访问性（NFR8-10）：** 高对比度配色、最小字体、非纯色彩区分 — 影响渲染层的视觉设计系统
- **可维护性（NFR11-14）：** 共享模块独立、新拓扑/信息机制仅需实现接口 — 强制要求插件式架构和 TypeScript 严格模式
- **可靠性（NFR15-17）：** 数据损坏降级、加载失败恢复、中断状态保持 — 要求防御性编程和状态持久化策略

### Scale & Complexity

- **主要领域：** Web 游戏（TypeScript + Vite + Canvas API）
- **复杂度级别：** 中等偏高 — 产品形态简单（单人离线游戏），但核心算法涉及图论和约束求解
- **预估架构组件数：** 约 12-15 个主要模块
- **三个独立产物：** 游戏运行时、关卡阅读器（开发工具）、可解性验证器（离线工具）

### Technical Constraints & Dependencies

1. **渲染约束：** 浏览器原生 Canvas API 渲染，UI 使用 HTML/CSS。无引擎依赖，非标准拓扑通过自定义绘制函数实现
2. **语言约束：** TypeScript 严格模式（strict: true）
3. **平台约束：** Chrome 桌面端 + Chrome 移动端，需适配鼠标和触摸两种输入
4. **部署约束：** 静态 Web 资源，可托管在 itch.io 或任意静态服务器
5. **开发约束：** 单人开发（Linyesh），需要高度模块化以管理复杂度，避免过重的构建系统开销
6. **共享代码约束：** 拓扑邻接 + 格式解析必须在三个产物间共享（FR59），core 层必须零引擎依赖

### Cross-Cutting Concerns Identified

1. **拓扑抽象层** — 贯穿渲染、交互（hit-test）、游戏逻辑（邻接查询）、验证器（约束求解）、关卡阅读器（可视化）
2. **二进制序列化** — 贯穿关卡文件生成、游戏运行时加载、阅读器加载、验证器输入
3. **信息机制规则引擎** — 贯穿游戏逻辑（数字显示）、验证器（可解性证明）、死因回顾（信息还原）
4. **输入适配** — 桌面端鼠标 vs 移动端触摸，贯穿所有交互组件
5. **状态持久化** — 关卡进度、设置偏好、游戏中断恢复
6. **双层状态模型** — truth layer（真实地雷数）与 presentation layer（显示给玩家的数字）的分离，贯穿游戏逻辑、误导信息机制、死因回顾

### Party Mode 洞察（多角色架构审查）

#### 技术风险优先级（专家共识）

| 优先级 | 风险项 | 说明 |
|--------|--------|------|
| **P0** | 约束求解器 | 在任意拓扑 × 任意信息机制组合下证明唯一解，搜索空间可能爆炸。必须先原型验证（建议：hex + fuzzy hint，5×5 棋盘）。误导信息的"唯一解"语义必须在架构阶段锁定 |
| **P1** | 二进制关卡格式 | 三个产物的数据契约，变更成本随时间指数增长。需要 round-trip 测试保障。格式设计必须前置 |
| **P1** | 混合拓扑接缝规则 | 两种拓扑区域的邻接组合规则是数学问题，不是接口能解决的。必须在架构阶段定义 |
| **P2** | ~~Cocos Creator 非标准拓扑渲染~~ | **已解决** — 改用 Canvas API，无引擎限制 |
| **P2** | 环面视觉映射 | 边缘 wrap-around 如何呈现给玩家，必须在架构阶段锁定 |

#### 架构级设计洞察

**代码组织（Amelia）：**
- `core/` 零依赖共享层（纯 TS，浏览器 + Node.js 同构）
- `game/`、`reader/`、`verifier/` 单向依赖 core
- 用 TypeScript paths + 独立 tsconfig 强制边界
- 不需要 monorepo 工具链（npm workspace / lerna），目录分离即可

**游戏体验架构约束（Samus Shepard）：**
- 死因回顾需要分层揭示架构（地雷位置 → 信息充分区域 → 完整推理链），需要每步信息状态快照
- 教学系统需要"先体验后命名"的可配置受限棋盘状态，不只是文字覆盖层
- 第 4 关难度跳跃需要缓冲设计
- 计时器可见性影响情感基调，需要架构决策
- 通关到下一关的过渡窗口是"再来一关"冲动的关键

**待锁定的架构决策（Winston）：**
- ~~关卡阅读器是否需要 Cocos2D？~~ **已决策** — reader 使用 Vite + Canvas，game 也使用 Vite + Canvas
- 62 条 FR 建议先做垂直切片（1 拓扑 + 1 机制 + 3 关）验证完整游戏循环
- 性能目标在正常棋盘规模下基本不是风险

## Starter Template Evaluation

### Primary Technology Domain

Web 游戏（TypeScript + Vite + Canvas API），含独立的 Web 端开发工具（关卡阅读器）和 CLI 工具（可解性验证器）。

### 方案评估过程

**最终方案：方案 C — 单包 + 内部目录隔离 + Vite 构建。**

原始设计评估了 Cocos Creator 作为游戏引擎，但在实现过程中发现：
1. Cocos Creator 需要独立的 IDE 环境，增加了开发复杂度
2. 游戏的渲染需求（六边形/三角形/矩形格子）用 Canvas API 完全可以满足
3. 去掉引擎依赖后，game 和 reader 可以共享相同的 Vite + Canvas 技术栈

**决策变更：从 Cocos Creator 迁移到纯 Canvas API。** 理由：降低开发复杂度，消除引擎 IDE 依赖，统一构建工具链（全部使用 Vite）。

### 选定方案：方案 C — 单包 + 内部目录隔离 + Vite

**项目结构：**

```
minesweeper/
├── src/
│   ├── core/                    # 共享核心库（零依赖，纯 TS）
│   │   ├── topology/            # ITopology 接口 + 各拓扑实现
│   │   ├── mechanism/           # IMechanism 接口 + 各机制实现
│   │   ├── solver/              # 约束求解器
│   │   ├── binary/              # 二进制 codec
│   │   └── types/               # 共享类型定义
│   ├── game/                    # 游戏运行时（Vite + Canvas）
│   │   ├── logic/               # 游戏逻辑（纯 TS，不依赖渲染）
│   │   ├── src/                 # 渲染层（Canvas API + DOM）
│   │   ├── public/levels/       # 关卡文件（.mswp）
│   │   ├── index.html
│   │   └── vite.config.ts
│   ├── reader/                  # 关卡阅读器（Vite + Canvas Web 应用）
│   │   ├── src/
│   │   └── index.html
│   └── verifier/                # 可解性验证器（Node.js CLI）
│       └── src/
├── levels/                      # 生成的关卡文件（源）
├── scripts/                     # 关卡生成脚本
├── tsconfig.json                # 统一配置，strict: true + paths 别名
├── package.json
└── vitest.config.ts
```

**依赖方向（通过约定 + ESLint 规则强制）：**
```
game ──→ core
reader ──→ core
verifier ──→ core
core ──→ （无外部依赖）
```

**game 内部结构：**
- `logic/` — 纯 TypeScript 游戏逻辑（BoardModel、GameStateMachine、CommandLog、ProgressManager、TimerManager），不依赖任何渲染 API，完全可测试
- `src/` — Canvas 渲染层（GameRenderer、GameApp），依赖浏览器 Canvas/DOM API
- 判断标准：删掉 Canvas 还有意义 → `logic/`；需要 Canvas → `src/`

### 架构决策（由 Starter 确定）

**语言 & 运行时：**
- TypeScript 5.x，strict 模式
- core：纯 TypeScript，浏览器 + Node.js 同构（无平台特有 API）
- game：Vite + Canvas API（浏览器原生渲染）
- reader：Vite + Canvas API
- verifier：Node.js CLI（tsc 编译 + node 运行）

**构建工具：**
- core：tsc 直接编译
- game：Vite（开发服务器 + 生产构建）
- reader：Vite
- verifier：tsc

**测试框架：**
- Vitest（core、game/logic、reader、verifier 统一使用）
- game/logic 层完全可测试（不依赖 Canvas/DOM）
- core 覆盖率目标 > 90%

**代码质量：**
- ESLint + @typescript-eslint（含 import 规则约束依赖方向）
- Prettier（代码格式化）
- eslint-config-prettier（避免规则冲突）

**TypeScript 配置：**
- 根级 tsconfig.json：strict: true + paths 别名（`@core/*`）
- core 的 target/module：ES2020（兼容所有消费者）
- game/reader 各有独立 tsconfig，继承根级配置

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions（阻塞实现）：**
1. 拓扑抽象层设计 — 整个系统的数学基础
2. 信息机制组合模型 — 决定游戏逻辑和验证器的核心行为
3. 约束求解器算法 — P0 技术风险，决定产品承诺是否可兑现

**Important Decisions（塑造架构）：**
4. 关卡数据格式 — 三个产物的数据契约
5. 状态持久化策略 — 影响可靠性和可扩展性

**Deferred Decisions（Post-MVP）：**
- 误导信息（MisleadingInfo）机制 — 推迟到 Phase 2（见下方说明）
- 社区关卡编辑器的数据交换格式
- 排行榜后端架构
- 3D 拓扑渲染策略

### Decision 1: 拓扑抽象层 — 分层接口

**决策：** 采用分层接口设计，逻辑层与渲染层分离。

**接口定义：**

```typescript
// 纯逻辑层（core 使用，solver/verifier 依赖此接口）
interface ITopologyGraph<CellId = number> {
  cells(): CellId[];
  neighbors(cell: CellId): CellId[];
  cellCount(): number;
}

// 渲染层（game/reader 使用，扩展逻辑层）
interface ITopologyRenderer<CellId = number> extends ITopologyGraph<CellId> {
  cellShape(cell: CellId): CellShape;
  cellCenter(cell: CellId): Point2D;
  cellAt(screenX: number, screenY: number): CellId | null;
}
```

**补充说明（Party Mode 洞察）：**
- 全局雷数（totalMines）作为 Level 元数据传入 solver，不放在拓扑接口上
- 环面拓扑的邻接数据需要 `wrapAxis` 边类型标记，供渲染器绘制 wrap-around 视觉提示
- hit-test（`cellAt`）放在 `ITopologyRenderer` 中是合理的：渲染器拥有屏幕几何信息，是 hit-test 的自然归属
- 可选优化：`getBorderCells()` 方法用于 solver 热路径（从边界格子开始约束传播效率更高）

**Rationale：**
- core/solver/verifier 只依赖 `ITopologyGraph`，不引入渲染概念
- game/reader 使用 `ITopologyRenderer`，获得坐标映射和 hit-test 能力
- 新增拓扑类型只需实现两个接口，满足 NFR12 的可扩展性要求
- 邻接数据预计算为邻接表，查询 O(1)，满足 NFR1 的 <100ms 响应要求

**Affects：** core/topology/、game 渲染层、reader 可视化、solver、verifier

### Decision 2: 信息机制组合 — 独立作用模型（MVP 范围调整）

**决策：** 每个格子最多只能有一种信息机制（或无机制），机制之间不叠加。

**MVP 范围（Phase 1）：**
- ✅ FuzzyHint（模糊提示）：显示值为 `[真实值 - offset, 真实值 + offset]` 的范围
- ✅ DelayedReveal（延迟揭示）：翻开后延迟 N 步才显示数字
- ❌ MisleadingInfo（误导信息）：**推迟到 Phase 2**

**误导信息推迟理由（Party Mode 关键发现）：**
玩家视角的唯一解验证是 Σ₂ᵖ-complete 问题——玩家不知道哪些格子在骗人，可以将任何不匹配的数字归类为"误导"，从而构造多个自洽解释。这系统性地破坏了唯一性保证。

Phase 2 可能的降级方案：
1. 公开误导格数量 k 给玩家（降为 NP-hard，可用 SAT 求解）
2. 已知骗子模式（格子明确标记为不可信）
3. 用模糊提示替代误导（范围数字，完全可验证）

**双层状态模型：**

```typescript
type DisplayValue =
  | { kind: 'exact'; value: number }
  | { kind: 'fuzzy'; min: number; max: number }
  | { kind: 'delayed'; revealAfter: number; revealed: boolean }
  | { kind: 'hidden' };  // 未翻开

interface CellState {
  truthValue: number;           // 真实邻居地雷数（truth layer）
  displayValue: DisplayValue;   // 显示给玩家的值（presentation layer）
  mechanism: MechanismType;     // 该格子的信息机制类型
}
```

**DelayedReveal 建模细化（Party Mode 洞察）：**
延迟揭示不是值变换，是可见性/时序问题。对 solver/verifier 来说等价于精确数字（不影响可解性），但运行时需要追踪倒计时状态。使用 discriminated union 而非 enum + 可选字段。

**Rationale：**
- 简化验证器逻辑：每个格子的约束独立计算
- 简化死因回顾：truth layer 直接揭示即可
- 降低组合爆炸风险：不需要处理机制叠加的边界情况
- MVP 聚焦拓扑变化 + 模糊提示 + 延迟揭示，验证核心体验

**Affects：** core/mechanism/、solver 约束规则、game 显示逻辑、死因回顾系统

### Decision 3: 约束求解器 — 约束传播 + 回溯搜索

**决策：** 采用约束传播 + 回溯搜索算法，类似数独求解器的经典方法。

**算法概要：**
1. 初始化：每个未知格子标记为 {可能是雷, 可能安全}
2. 约束传播：根据已知数字（含信息机制变换后的约束）缩小可能性
3. 回溯搜索：当约束传播无法继续时，假设某格子状态并递归验证
4. 唯一解验证：找到第一个解后继续搜索，如果找到第二个解则报告"非唯一解"

**信息机制对约束的影响（MVP 范围）：**
- FuzzyHint：约束变为 `min ≤ 邻居地雷数 ≤ max`（范围约束）
- DelayedReveal：约束与精确数字相同（不影响可解性，只影响玩家获取信息的时序）

**性能优化要求（Party Mode 洞察）：**
- 必须做连通分量分割——独立区域分别求解
- 必须做 arc consistency（弧一致性）预处理
- FuzzyHint 密度建议 ≤ 15%，否则约束太松，回溯爆炸
- 可选优化：从边界格子开始约束传播

**性能预期：**
- 10 关棋盘规模（预估最大 ~200 格子），约束传播 + 回溯在此规模下 < 30s（NFR7）
- 如果未来扩展到更大棋盘或加入误导机制，可升级到 CSP/SAT 求解器

**Rationale：**
- 算法成熟，实现复杂度可控
- 对当前棋盘规模和 MVP 机制集性能充足
- 不引入外部依赖（纯 TypeScript 实现）
- 保留升级到 CSP/SAT 的路径

**Affects：** core/solver/、verifier CLI

### Decision 4: 关卡数据格式 — 极简自定义二进制 + Codec 抽象层

**决策：** 遵循 PRD 要求（FR49），实现极简自定义二进制格式，同时通过 codec 抽象层支持开发调试。

**格式设计：**
```
[4字节 Magic Number: "MSWP"]
[1字节 版本号: 0x01]
[关卡数据: 拓扑类型 + 格子定义 + 邻接数据 + 地雷位置 + 信息机制参数 + 元数据]
```

实现成本约 100 行 TypeScript（DataView 读写），无外部依赖。

**Codec 抽象层：**

```typescript
interface ILevelCodec {
  encode(level: LevelData): ArrayBuffer;
  decode(buffer: ArrayBuffer): LevelData;
  validate(buffer: ArrayBuffer): ValidationResult;
}
```

- `BinaryLevelCodec`：生产环境使用，遵循二进制格式规范
- `JsonLevelCodec`：开发调试使用，人类可读，可通过配置切换

**为什么不用 FlatBuffers（Party Mode 决策修正）：**
- 10 关 × 200 格，总数据量 < 50KB，零拷贝反序列化无可感知性能差异
- FlatBuffers 带来 .fbs schema 文件、flatc 代码生成步骤、不可读的调试体验
- 极简自定义格式实现成本更低，完全满足 PRD 要求
- codec 抽象层保留了未来迁移到更复杂格式的路径

**Rationale：**
- 遵循 PRD 的二进制格式要求（FR49）
- magic number + 版本字节为 Phase 2-3 社区关卡编辑器打基础
- codec 抽象层兼顾生产需求和开发体验
- 实现简单，单人开发者可快速完成

**Affects：** core/binary/、game 资源加载、reader 文件解析、verifier 输入

### Decision 5: 状态持久化 — 抽象存储层

**决策：** 定义 `IStorage` 接口，localStorage 作为默认实现。

**接口定义：**

```typescript
interface IStorage {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  has(key: string): boolean;
  remove(key: string): void;
  clear(): void;
}
```

**默认实现：** `LocalStorageAdapter` — JSON 序列化/反序列化到 localStorage。

**存储内容：**
- 关卡解锁进度
- 每关最佳通关时间和尝试次数
- 音效开关偏好
- 当前关卡中断状态（用于恢复）

**降级策略（NFR15）：**
- 数据损坏时降级为初始状态（仅第 1 关解锁）
- 读取失败时 catch 并返回默认值，不崩溃

**Rationale：**
- 抽象层成本极低（一个接口 + 一个实现类）
- 满足 PRD 验证报告建议（FR35 去除 localStorage 实现泄漏）
- 未来可扩展到 IndexedDB（大数据量）或云存储（排行榜）

**Affects：** game 进度管理、设置系统

### Decision Impact Analysis

**修正后的实现顺序（Party Mode 共识）：**
1. `ITopologyGraph` 接口 + 第一个拓扑实现（hex）→ 验证抽象层设计
2. 信息机制规则定义（FuzzyHint + DelayedReveal 的约束语义）→ 为 solver 提供输入
3. 约束求解器原型（hex + 精确数字 + FuzzyHint）→ 验证 P0 技术风险
4. 极简二进制格式 + codec 抽象层 → 建立数据契约
5. `ITopologyRenderer` + 游戏渲染 → 第一个可玩关卡
6. `IStorage` + 进度持久化 → 完整游戏循环

**跨组件依赖：**
- 拓扑抽象层是所有其他决策的基础
- 信息机制的约束语义必须在 solver 之前定义（避免返工）
- 二进制格式 schema 依赖拓扑和信息机制的类型定义
- 双层状态模型（truthValue/displayValue）贯穿游戏逻辑、死因回顾和验证器
- codec 抽象层贯穿三个产物

**MVP 范围确认：**
- ✅ 5 种拓扑类型（hex、triangle、torus、irregular、mixed）
- ✅ 2 种信息机制（FuzzyHint、DelayedReveal）
- ❌ MisleadingInfo → Phase 2
- ✅ 10 关线性递进（使用拓扑变化 + 模糊提示 + 延迟揭示组合创造难度曲线）

## Implementation Patterns & Consistency Rules

### Naming Patterns

**文件与目录命名：**
- 文件名：kebab-case — `hex-topology.ts`, `fuzzy-hint.ts`, `binary-codec.ts`
- 目录名：kebab-case — `src/core/topology/`, `src/core/mechanism/`
- 测试文件：与源文件同名 + `.test.ts`，就近放置 — `hex-topology.test.ts`

**代码命名：**

| 类别 | 规范 | 示例 |
|------|------|------|
| 类 | PascalCase | `HexTopology`, `ConstraintSolver` |
| 接口 | I 前缀 + PascalCase | `ITopologyGraph`, `IStorage`, `ILevelCodec` |
| 类型别名 | PascalCase | `CellState`, `DisplayValue`, `LevelData` |
| 枚举 | PascalCase 名 + PascalCase 成员 | `TopologyType.Hexagonal`, `MechanismType.FuzzyHint` |
| 函数/方法 | camelCase | `getNeighbors()`, `validateLevel()` |
| 变量 | camelCase | `cellCount`, `minePositions` |
| 常量 | UPPER_SNAKE_CASE | `MAGIC_NUMBER`, `MAX_MINE_RATIO`, `VERSION_BYTE` |
| 泛型参数 | 单字母大写或描述性 PascalCase | `<CellId>`, `<T>` |

### Structure Patterns

**测试文件位置：co-located（就近放置）**

```
src/core/topology/
├── hex-topology.ts
├── hex-topology.test.ts
├── torus-topology.ts
├── torus-topology.test.ts
└── index.ts
```

**模块导出：barrel 文件（index.ts）**

每个子目录一个 `index.ts` 统一导出公共 API。消费方通过目录导入：`import { HexTopology } from '@core/topology'`。内部实现细节不通过 index.ts 导出。测试文件不被 barrel 导出，且在 tsconfig 的 exclude 中排除。

**game 内部结构（两层）：**

```
src/game/
├── logic/               # 游戏逻辑（不依赖渲染，纯 TS，可测试）
│   ├── board-model.ts
│   ├── game-state-machine.ts
│   ├── command-log.ts
│   ├── progress-manager.ts
│   ├── timer-manager.ts
│   ├── level-manager.ts
│   ├── tutorial-manager.ts
│   ├── death-review.ts
│   ├── audio-manager.ts
│   ├── theme.ts
│   └── storage.ts
├── src/                 # 渲染层（Canvas API + DOM）
│   ├── game-renderer.ts
│   ├── app.ts
│   └── main.ts
├── public/levels/       # 关卡文件（.mswp）
├── index.html
├── style.css
└── vite.config.ts
```

判断标准：删掉 Canvas/DOM 还有意义 → `logic/`；需要浏览器 API → `src/`。

### Error Handling Patterns

**自定义 Error 类层次结构：**

```typescript
abstract class MinesweeperError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

class LevelLoadError extends MinesweeperError { /* code: 'LEVEL_LOAD_ERROR' */ }
class TopologyError extends MinesweeperError { /* code: 'TOPOLOGY_ERROR' */ }
class StorageError extends MinesweeperError { /* code: 'STORAGE_ERROR' */ }
class SolverError extends MinesweeperError { /* code: 'SOLVER_ERROR' */ }
```

**规则：**
- core 层抛出具体错误类型，不吞异常
- game 层在边界处 catch 并降级（如 NFR15 localStorage 损坏降级）
- 所有 catch 块必须处理错误或重新抛出，禁止空 catch

### Data Format Patterns

**Discriminated Union 优先于 enum + 可选字段：**

```typescript
// ✅ Good — discriminated union，编译期穷举检查
type DisplayValue =
  | { kind: 'exact'; value: number }
  | { kind: 'fuzzy'; min: number; max: number }
  | { kind: 'delayed'; revealAfter: number; revealed: boolean }
  | { kind: 'hidden' };

// ❌ Avoid — enum + optional fields
```

### State Management Patterns

**城墙模式（内部可变 + 边界不可变）：**

游戏状态内部使用可变数据结构（热路径零分配），对外暴露不可变快照接口：

- BFS 自动展开等热路径：内部原地修改数组/Uint8Array
- 死因回顾：使用 **Command 日志法**——记录每步操作（`{action: 'reveal', cellId: 42}`），回放时重新执行，而非存储全量状态快照
- 对外 API 返回不可变视图（按需生成）

**游戏状态机：**

```typescript
type LevelState =
  | { phase: 'notStarted' }
  | { phase: 'playing'; startTime: number; moveCount: number }
  | { phase: 'paused'; pauseTime: number }
  | { phase: 'success'; completionTime: number }
  | { phase: 'failed'; mineHit: CellId };
```

状态转换通过纯函数，不允许跳跃。

### Communication Patterns

**类型安全事件总线：**

```typescript
type GameEvents = {
  'cell:revealed': { cellId: number; value: DisplayValue };
  'cell:flagged': { cellId: number };
  'level:completed': { time: number };
  'level:failed': { mineHit: number };
};
```

game 内部通信用类型安全事件，避免字符串拼写错误。

### Extensibility Patterns

**注册表模式：**

```typescript
const topologyRegistry = new Map<TopologyType, (config: TopologyConfig) => ITopologyGraph>();
topologyRegistry.set(TopologyType.Hexagonal, (c) => new HexTopology(c));
```

新增拓扑/信息机制通过注册表注入，不修改现有代码。

### Game-Specific Patterns

**确定性随机接口（P0）：**

```typescript
interface IRandom {
  next(): number;       // [0, 1)
  nextInt(min: number, max: number): number;
}
```

关卡生成和验证器需要确定性随机（给定 seed 产生相同结果）。测试可重复性的基础。

**对象池：**

Canvas 渲染不需要对象池（每帧重绘），但如果未来迁移到 WebGL/引擎，200 个 CellNode 预热可避免关卡切换时的实例化开销。

**输入防抖 + 长按识别：**

移动端点击揭开 vs 长按标旗，时间阈值 300ms。桌面端鼠标左键/右键无需防抖。

**日志接口（极简）：**

```typescript
interface ILogger {
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, error?: Error, context?: Record<string, unknown>): void;
}
```

game 用 `console.warn`/`console.error`，verifier 用 `console`，均通过 `ILogger` 适配。

### Testing Patterns

**测试 fixture 工厂：**

```typescript
function createTestTopology(config?: Partial<HexConfig>): HexTopology { ... }
function createTestLevel(overrides?: Partial<LevelData>): LevelData { ... }
```

避免每个测试文件重复构造测试数据。

### Enforcement Guidelines

**All AI Agents MUST：**
1. 遵循上述命名规范，不引入其他命名风格
2. core 目录下的代码禁止引入任何平台特有 API（`document`, `window`, `process` 等）
3. 新增拓扑/信息机制必须通过注册表模式，不修改现有代码
4. 所有公共接口必须有 JSDoc 注释
5. 使用 discriminated union 而非 enum + 可选字段
6. BFS 热路径内部可变，对外暴露不可变视图
7. 错误处理使用自定义 Error 类，禁止空 catch
8. 使用 `IRandom` 接口保证确定性随机，禁止直接调用 `Math.random()`
9. game 中 `logic/` 层禁止引入浏览器 API（`document`, `window`, `Canvas` 等）

**Anti-Patterns（禁止）：**
- ❌ core 中引入平台 API（`document`, `window`, `process`, `Canvas`）
- ❌ 空 catch 块（`catch (e) {}`）
- ❌ 使用 `any` 类型
- ❌ 在 barrel 文件中导出内部实现细节
- ❌ 硬编码 magic number 或版本号
- ❌ 直接调用 `Math.random()`（使用 `IRandom`）
- ❌ 在 BFS 热路径中使用 spread 创建新数组

## Project Structure & Boundaries

### Complete Project Directory Structure

```
minesweeper/
├── README.md
├── package.json
├── tsconfig.json                          # strict: true + paths 别名
├── vitest.config.ts
├── .eslintrc.cjs
├── .prettierrc
├── .gitignore
├── scripts/
│   └── generate-levels.ts                 # 关卡生成脚本
├── levels/                                # 生成的关卡文件（.mswp）
│
├── src/
│   ├── core/                              # 共享核心库（零依赖，纯 TS）
│   │   ├── topology/
│   │   │   ├── types.ts                   # ITopologyGraph, ITopologyRenderer, CellShape
│   │   │   ├── hex-topology.ts
│   │   │   ├── triangle-topology.ts
│   │   │   ├── torus-topology.ts
│   │   │   ├── irregular-topology.ts
│   │   │   ├── mixed-topology.ts
│   │   │   ├── topology-registry.ts
│   │   │   └── index.ts
│   │   ├── mechanism/
│   │   │   ├── types.ts                   # MechanismType, DisplayValue
│   │   │   ├── fuzzy-hint.ts
│   │   │   ├── delayed-reveal.ts
│   │   │   ├── mechanism-registry.ts
│   │   │   └── index.ts
│   │   ├── solver/
│   │   │   ├── types.ts                   # SolverResult, SolverInput
│   │   │   ├── constraint-propagation.ts
│   │   │   ├── backtrack-search.ts
│   │   │   ├── connected-components.ts
│   │   │   ├── solver.ts
│   │   │   └── index.ts
│   │   ├── binary/
│   │   │   ├── constants.ts               # MAGIC_NUMBER, VERSION_BYTE
│   │   │   ├── codec-types.ts             # ILevelCodec 接口
│   │   │   ├── binary-codec.ts
│   │   │   ├── json-codec.ts
│   │   │   └── index.ts
│   │   ├── types/
│   │   │   ├── cell.ts                    # CellId
│   │   │   ├── level.ts                   # LevelData, LevelMetadata
│   │   │   ├── common.ts                  # Point2D, ValidationResult
│   │   │   └── index.ts
│   │   ├── random/
│   │   │   ├── types.ts                   # IRandom 接口
│   │   │   ├── seeded-random.ts
│   │   │   └── index.ts
│   │   ├── errors/
│   │   │   ├── base-error.ts
│   │   │   ├── level-load-error.ts
│   │   │   ├── topology-error.ts
│   │   │   ├── solver-error.ts
│   │   │   ├── storage-error.ts
│   │   │   ├── mechanism-error.ts
│   │   │   └── index.ts
│   │   ├── logger/
│   │   │   ├── types.ts
│   │   │   ├── console-logger.ts
│   │   │   └── index.ts
│   │   └── index.ts                       # core 顶层 barrel
│   │
│   ├── game/                              # 游戏运行时（Vite + Canvas）
│   │   ├── logic/                         # 游戏逻辑（纯 TS，可测试）
│   │   │   ├── board-model.ts             # 棋盘数据模型
│   │   │   ├── game-state-machine.ts      # 游戏状态机
│   │   │   ├── command-log.ts             # 命令日志（死因回顾）
│   │   │   ├── progress-manager.ts        # 进度管理
│   │   │   ├── timer-manager.ts           # 分层计时器
│   │   │   ├── level-manager.ts           # 关卡编排
│   │   │   ├── tutorial-manager.ts        # 教学引导
│   │   │   ├── death-review.ts            # 死因回顾
│   │   │   ├── audio-manager.ts           # 音效（Web Audio）
│   │   │   ├── theme.ts                   # 拓扑主题色
│   │   │   └── storage.ts                 # IStorage + 实现
│   │   ├── src/                           # 渲染层（Canvas + DOM）
│   │   │   ├── game-renderer.ts           # Canvas 棋盘渲染
│   │   │   ├── app.ts                     # 游戏应用入口
│   │   │   └── main.ts                    # Vite 入口
│   │   ├── public/levels/                 # 关卡文件（.mswp）
│   │   ├── index.html
│   │   ├── style.css
│   │   └── vite.config.ts
│   │
│   ├── reader/                            # 关卡阅读器（Vite + Canvas）
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── renderer/canvas-renderer.ts
│   │   │   ├── ui/file-loader.ts
│   │   │   ├── ui/info-panel.ts
│   │   │   ├── ui/simulation-controls.ts
│   │   │   └── app.ts
│   │   ├── index.html
│   │   ├── style.css
│   │   └── vite.config.ts
│   │
│   └── verifier/                          # 可解性验证器（Node.js CLI）
│       ├── src/
│       │   ├── main.ts
│       │   ├── cli.ts
│       │   ├── verify-command.ts
│       │   └── batch-verify.ts
│       └── tsconfig.json
```

### Architectural Boundaries

**core 边界（最严格）：**
- 零外部依赖，纯 TypeScript
- 禁止引入 `document`、`process`、`window` 等平台 API
- 浏览器 + Node.js 同构
- 所有公共接口通过 barrel 文件导出

**game 内部边界：**
- `logic/` → 纯 TypeScript，禁止引入浏览器 API（`document`, `window`, `Canvas`），可引用 `core/`
- `src/` → 渲染层，可使用浏览器 API（Canvas、DOM），引用 `logic/` 和 `core/`

**reader/verifier 边界：**
- 通过 TypeScript paths 别名引用 `@core/*`
- reader 可使用浏览器 API（Canvas、DOM）
- verifier 可使用 Node.js API（fs、path、process）

### Requirements to Structure Mapping

| FR 类别 | 主要目录 | 关键文件 |
|---------|---------|---------|
| 棋盘拓扑系统 (FR1-9) | `core/topology/` | 各拓扑实现 + types.ts |
| 信息机制系统 (FR10-16) | `core/mechanism/` | fuzzy-hint.ts, delayed-reveal.ts |
| 游戏核心交互 (FR17-24) | `game/logic/`, `game/src/` | BoardModel, GameRenderer |
| 视觉与音效 (FR25-28) | `game/src/`, `game/logic/` | GameRenderer, AudioManager |
| 关卡流程管理 (FR29-37) | `game/logic/` | LevelManager, ProgressManager, TimerManager |
| 教学与引导 (FR38-42) | `game/logic/` | TutorialManager |
| 失败反馈与死因回顾 (FR43-48) | `game/logic/` | DeathReview, CommandLog |
| 关卡数据与工具链 (FR49-59) | `core/binary/`, `reader/`, `verifier/` | codec, renderer, CLI |
| 部署与分发 (FR60-63) | `game/` Vite 构建输出 | vite build |

### Data Flow

```
关卡设计 → verifier（验证唯一解）→ 二进制文件（.mswp）
                                         ↓
                              game（加载 + 游戏运行时）
                                         ↓
                              reader（可视化 + 模拟）
```

**游戏运行时数据流：**
```
玩家输入（click/contextmenu）→ GameApp → BoardModel → CommandLog
                                              ↓
                                    GameRenderer ← BoardModel.getAllCellInfos()
                                              ↓
                                    （踩雷）→ DeathReview ← CommandLog
```

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility：**
- TypeScript strict + Vite + Canvas API：完全兼容，无引擎限制
- 方案 C（单包 + paths 别名）+ Vite：兼容。game 和 reader 都使用 Vite，共享相同的构建工具链
- 极简二进制格式 + ILevelCodec 抽象：一致。BinaryLevelCodec 和 JsonLevelCodec 共享接口
- 约束传播 + 回溯 + 分层拓扑接口：一致。solver 只依赖 ITopologyGraph
- 城墙模式 + Command 日志：一致。热路径性能和死因回顾功能兼顾

**无矛盾决策。**

**Pattern Consistency：** 命名规范统一，接口使用 I 前缀，类型使用 discriminated union，注册表模式统一用于扩展，错误处理统一使用自定义 Error 类层次。

**Structure Alignment：** 项目结构完整支持所有架构决策，core/game/reader/verifier 边界清晰，game 内部 logic/src 两层结构与依赖规则一致。

### Requirements Coverage Validation

**功能需求覆盖（62 条 FR）：**

| FR 范围 | 覆盖状态 | 说明 |
|---------|---------|------|
| FR1-9 棋盘拓扑 | ✅ 完全覆盖 | ITopologyGraph + 5 种拓扑实现 |
| FR10-11 模糊提示 + 延迟揭示 | ✅ 完全覆盖 | core/mechanism/ + DisplayValue union |
| FR12-13 误导信息 | ⏸️ 推迟到 Phase 2 | Σ₂ᵖ-complete 问题，降级方案已记录 |
| FR14-16 机制语义 | ✅ 覆盖 MVP 范围 | FuzzyHint + DelayedReveal 语义已定义 |
| FR17-24 核心交互 | ✅ 完全覆盖 | InputTranslator + GameStateMachine |
| FR25-28 视觉音效 | ✅ 完全覆盖 | BoardRenderer + AudioManager |
| FR29-37 关卡流程 | ✅ 完全覆盖 | LevelManager + ProgressManager + IStorage |
| FR38-42 教学引导 | ✅ 完全覆盖 | TutorialOverlay + RuleCard |
| FR43-48 死因回顾 | ✅ 完全覆盖 | CommandLog + DeathReviewPresenter |
| FR49-59 工具链 | ✅ 完全覆盖 | binary codec + reader + verifier |
| FR60-63 部署 | ✅ 完全覆盖 | Vite 静态构建 |

**非功能需求覆盖（17 条 NFR）：**

| NFR | 覆盖状态 | 架构支撑 |
|-----|---------|---------|
| NFR1 交互 <100ms | ✅ | 预计算邻接表 O(1)，城墙模式零分配 |
| NFR2 ≥30fps | ✅ | 对象池 + 帧预算意识 |
| NFR3 首次加载 <3s | ✅ | 静态资源，Vite 构建优化 |
| NFR4 关卡切换 <1s | ✅ | 极简二进制格式，DataView 解析 |
| NFR5 展开 200ms | ✅ | RevealAnimationSequencer 波纹动画 |
| NFR6 内存 ≤50MB | ✅ | 紧凑数据结构，对象池复用 |
| NFR7 验证器 <30s | ✅ | 约束传播 + 回溯 + 连通分量分割 |
| NFR8-10 可访问性 | ⚠️ 部分 | 架构支持，具体配色/字体在实现阶段 |
| NFR11-14 可维护性 | ✅ | 分层接口 + 注册表模式 + strict 模式 |
| NFR15-17 可靠性 | ✅ | IStorage 降级策略 + 错误处理层次 |

### Gap Analysis Results

**无 Critical Gap。**

**Important Gaps（建议在实现早期补充）：**
1. 各拓扑类型的邻接规范文档（`docs/topology-specs/`）需要在实现对应拓扑前编写
2. 二进制格式详细字段规范（`docs/binary-format-spec.md`）需要在实现 codec 前编写
3. 环面 wrap-around 视觉映射方案需要在实现 torus 渲染前确定

**Nice-to-Have Gaps：**
1. CI/CD 配置（单人项目可后补）
2. 性能基准测试框架
3. 关卡设计指南文档

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] 项目上下文深入分析（含 Party Mode 多角色审查）
- [x] 规模和复杂度评估
- [x] 技术约束识别（Canvas API 渲染）
- [x] 跨切关注点映射（6 项）

**✅ Architectural Decisions**
- [x] 5 项关键决策已记录（含版本、理由、影响）
- [x] 技术栈完整指定
- [x] MVP 范围调整（误导信息推迟）
- [x] 实现顺序确定

**✅ Implementation Patterns**
- [x] 命名规范建立
- [x] 结构模式定义（含 game logic/src 两层结构）
- [x] 通信模式指定（类型安全事件总线）
- [x] 过程模式记录（错误处理、状态管理、城墙模式）
- [x] 游戏特有模式（IRandom、对象池、输入防抖）

**✅ Project Structure**
- [x] 完整目录结构定义
- [x] 组件边界建立
- [x] 集成点映射
- [x] FR → 目录映射完成

### Architecture Readiness Assessment

**Overall Status：READY FOR IMPLEMENTATION**

**Confidence Level：高**

**Key Strengths：**
- 分层拓扑接口设计干净，逻辑与渲染完全解耦
- Party Mode 发现并解决了误导信息机制的 Σ₂ᵖ-complete 问题，避免了实现阶段的重大返工
- 城墙模式 + Command 日志兼顾了性能和死因回顾功能
- 方案 C 的简洁结构适合单人开发，Vite 统一构建工具链
- codec 抽象层兼顾了 PRD 的二进制要求和开发调试体验
- 从 Cocos Creator 迁移到 Canvas API 消除了引擎 IDE 依赖，降低了开发门槛

**Areas for Future Enhancement：**
- Phase 2 误导信息机制（需要 SAT 求解器或降级方案）
- 迁移到 pnpm workspace（core API 稳定后）
- 社区关卡编辑器的数据交换协议
- WebGL 渲染升级（如果 Canvas 性能不足）

### Implementation Handoff

**AI Agent Guidelines：**
- 严格遵循本文档中的所有架构决策
- 使用实现模式中定义的命名和结构规范
- 尊重项目结构和边界（特别是 core 的零依赖约束）
- 所有架构问题参考本文档

**First Implementation Priority：**
1. 项目初始化（目录结构 + 配置文件）
2. `ITopologyGraph` 接口 + `HexTopology` 实现 + 测试
3. 信息机制约束语义定义（FuzzyHint + DelayedReveal）
4. 约束求解器原型（hex + 精确数字 + FuzzyHint，5×5 棋盘）→ 验证 P0 风险
5. 二进制格式 + codec 抽象层 → 建立数据契约
6. Canvas 游戏渲染 → 第一个可玩关卡
