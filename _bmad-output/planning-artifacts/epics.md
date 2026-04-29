---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/architecture.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
---

# 高挑战性扫雷游戏 - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for 高挑战性扫雷游戏, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

- FR1: 游戏引擎可以渲染六边形网格棋盘并正确计算 6 邻居邻接关系
- FR2: 游戏引擎可以渲染不规则图形棋盘并正确计算可变数量的邻接关系
- FR3: 游戏引擎可以渲染环面拓扑棋盘，边缘格子与对侧边缘格子正确相连
- FR4: 游戏引擎可以渲染三角形网格棋盘并正确计算 3/12 邻居邻接关系
- FR5: 游戏引擎可以渲染混合拓扑棋盘（同一关卡内包含多种拓扑区域）
- FR6: 所有拓扑类型通过统一的抽象接口提供邻接查询能力（给定 cell，返回其所有邻居）
- FR7: 混合拓扑的接缝处邻接关系有明确的组合规则定义
- FR8: 每种拓扑类型定义从逻辑坐标到屏幕坐标的映射规则（含环面的 wrap-around 视觉提示）
- FR9: 不同拓扑下的点击/触摸坐标可以正确映射到对应的逻辑 cell（拓扑适配的 hit-test）
- FR10: 玩家翻开格子后可以看到模糊提示（数字范围值，如"1-3"），表示周围地雷数在该范围内
- FR11: 玩家翻开格子后，数字信息可以延迟指定回合数后才显示
- FR12: 关卡可以包含少量误导信息格子（显示的数字与实际不符），且误导格子比例不超过 5%（⏸️ 推迟到 Phase 2）
- FR13: 玩家在死因回顾中可以看到哪些格子包含误导信息（⏸️ 推迟到 Phase 2）
- FR14: 每种信息机制有形式化的语义定义：模糊提示为"真实值 ± 偏移量"的范围；延迟揭示为"翻开后延迟 N 步才显示数字"；误导信息为"显示值与真实值不同的固定标记"
- FR15: 多种信息机制同时作用于同一关卡时，其组合行为有明确定义（独立作用，不叠加）
- FR16: 延迟揭示期间，格子显示明确的"等待中"视觉状态
- FR17: 玩家可以通过鼠标左键（桌面端）或点击（移动端）翻开未标记的格子
- FR18: 玩家可以通过鼠标右键（桌面端）或长按（移动端）标记/取消标记疑似地雷的格子
- FR19: 玩家翻开安全格子时，系统自动展开相邻的无雷区域
- FR20: 玩家踩雷时，游戏立即结束并显示失败反馈
- FR21: 玩家在移动端可以通过缩放和平移手势操作棋盘
- FR22: 玩家可以撤销最近一次标记操作（防误操作，不可撤销翻开操作）
- FR23: 游戏提供暂停功能，暂停时棋盘被遮蔽，计时器停止
- FR24: 玩家切换浏览器标签页或手机来电时，游戏自动暂停
- FR25: 每种格子状态（未翻开、已翻开、已标记、延迟等待中、模糊提示、误导格）有明确区分的视觉表现
- FR26: 格子状态转换时有过渡动画（翻开、标记、踩雷）
- FR27: 游戏提供基础音效反馈：翻开格子、标记地雷、踩雷失败、通关成功
- FR28: 玩家可以在设置中开关音效
- FR29: 玩家可以在关卡选择界面查看所有 10 个关卡及其解锁状态
- FR30: 玩家通关当前关卡后，下一关自动解锁
- FR31: 玩家可以重玩任何已解锁的关卡
- FR32: 每关显示分层计时器（教学关 2 分钟 / 中段 5 分钟 / 硬核 8 分钟上限）
- FR33: 玩家可以无限次重试当前关卡，重试时保留已有的推理标记
- FR34: 玩家通关后可以看到通关动画和完成反馈
- FR35: 玩家的关卡解锁进度自动持久化保存，关闭浏览器后不丢失
- FR36: 关卡选择界面显示每关的最佳通关时间和尝试次数
- FR37: 每个关卡有明确的状态生命周期：未开始 → 进行中 → 成功/失败，状态转换触发对应的 UI 和逻辑响应
- FR38: 玩家首次遇到新拓扑类型时，系统提供交互式引导（如高亮第一步操作）
- FR39: 玩家首次遇到新信息机制时，系统提供交互式引导说明新规则
- FR40: 玩家可以在游戏中随时查看当前关卡的规则卡片（不强制弹出）
- FR41: 规则卡片展示当前关卡的拓扑类型和信息机制规则
- FR42: 交互式引导可以被跳过，且跳过后不再重复出现
- FR43: 玩家踩雷后可以看到包含爆炸动画和地雷位置高亮的失败反馈
- FR44: 玩家踩雷后可以进入死因回顾界面，查看完整的地雷分布
- FR45: 死因回顾界面标注玩家的推理错误位置
- FR46: 死因回顾界面明确标注误导信息格子（如果当前关卡包含该机制）（⏸️ 推迟到 Phase 2）
- FR47: 死因回顾界面可以展示正确的解题路径（唯一解的推理链）
- FR48: 玩家可以从死因回顾界面直接重试当前关卡
- FR49: 关卡数据以自定义二进制格式存储，包含 magic number 和版本字节
- FR50: 二进制格式有完整的字段规范：拓扑类型标识、格子定义、邻接表/矩阵、地雷位置、信息机制类型和参数
- FR51: 二进制格式存储棋盘拓扑定义、地雷布局、信息机制参数
- FR52: 关卡阅读器可以加载二进制关卡文件并可视化展示棋盘布局
- FR53: 关卡阅读器可以展示邻接关系和信息机制参数
- FR54: 关卡阅读器可以模拟游戏过程（逐步翻开格子查看结果）
- FR55: 关卡阅读器对损坏、截断或版本不匹配的文件给出明确错误信息
- FR56: 离线可解性验证器可以验证给定关卡在其特定信息机制规则下存在唯一解
- FR57: 可解性验证器接受地雷布局和信息机制规则集作为输入
- FR58: 可解性验证器在验证失败时输出具体原因（如"存在 2 个可能解"并给出差异位置）
- FR59: 游戏运行时、关卡阅读器和可解性验证器共享同一套拓扑邻接计算和二进制格式解析代码库
- FR60: 游戏可以构建为静态 Web 资源并部署到任意静态服务器
- FR61: 游戏在 Chrome 桌面端和移动端浏览器上可正常运行
- FR62: 游戏提供一个简单的 HTML 落地页（含游戏描述和启动按钮）
- FR63: 关卡文件作为游戏资源打包在应用内，随应用一起加载

### NonFunctional Requirements

- NFR1: 玩家点击格子到视觉反馈的响应延迟 < 100ms（所有拓扑类型）
- NFR2: 游戏帧率在所有关卡中保持 ≥ 30fps
- NFR3: 游戏首次加载时间 < 3s（Chrome 桌面端，含引擎和关卡资源）
- NFR4: 关卡切换时间 < 1s（包括二进制文件解析和棋盘渲染）
- NFR5: 自动展开无雷区域的连锁反应在 200ms 内完成视觉呈现（通过动画帧计数验证）
- NFR6: 每关内存使用不超过 50MB，避免浏览器 OOM
- NFR7: 离线可解性验证器对单个关卡的验证时间 < 30s
- NFR8: 格子状态使用高对比度配色，满足 WCAG 2.1 AA 级对比度标准（4.5:1）
- NFR9: 数字和范围提示字体大小在移动端不小于 14px 等效
- NFR10: 不依赖纯色彩区分关键信息（格子状态同时使用形状或图标辅助区分）
- NFR11: 拓扑邻接计算、二进制格式解析作为独立共享模块，运行时/阅读器/验证器共用
- NFR12: 新增一种拓扑类型只需实现统一接口，不需要修改现有拓扑代码
- NFR13: 新增一种信息机制只需实现规则定义接口，不需要修改验证器核心逻辑
- NFR14: 代码遵循 TypeScript 严格模式，启用 strict 编译选项
- NFR15: localStorage 进度数据损坏时，游戏降级为全部关卡锁定状态（第 1 关除外），不崩溃
- NFR16: 二进制关卡文件加载失败时，显示明确错误信息并返回关卡选择界面，不崩溃
- NFR17: 浏览器标签页切换或手机来电导致的中断不丢失当前关卡状态

### Additional Requirements

**来自架构文档的技术需求：**

- AR1: 项目采用方案 C（单包 + 内部目录隔离），目录结构为 src/core/、src/game/、src/reader/、src/verifier/，依赖方向单向（game/reader/verifier → core）
- AR2: core 层零依赖，纯 TypeScript，浏览器 + Node.js 同构，禁止引入 document、process 等平台 API
- AR3: 拓扑抽象层采用分层接口设计：ITopologyGraph（纯逻辑层）+ ITopologyRenderer（渲染层扩展）
- AR4: 信息机制采用独立作用模型，每个格子最多一种机制，使用 discriminated union（DisplayValue）建模
- AR5: 误导信息（MisleadingInfo）机制推迟到 Phase 2（Σ₂ᵖ-complete 问题），MVP 仅含 FuzzyHint + DelayedReveal
- AR6: 约束求解器采用约束传播 + 回溯搜索算法，需做连通分量分割和弧一致性预处理
- AR7: 关卡数据采用极简自定义二进制格式 + ILevelCodec 抽象层（BinaryLevelCodec + JsonLevelCodec）
- AR8: 状态持久化采用 IStorage 抽象接口，localStorage 为默认实现
- AR9: 游戏状态管理采用城墙模式（内部可变 + 边界不可变）+ Command 日志法（死因回顾回放）
- AR10: game 使用 Vite + Canvas API 渲染，通过相对路径导入 core
- AR12: Starter Template 初始化作为第一个实现 Story：创建目录结构 + 配置文件（tsconfig、vitest、eslint、prettier）

### UX Design Requirements

- UX-DR1: 实现假设标记（Pencil Marks）功能——玩家可在格子上标注"可能是雷"（❓黄色）和"可能安全"（●蓝色）两种假设状态，辅助模糊提示下的推理过程
- UX-DR2: 实现翻开预览机制（移动端）——手指按下但未抬起时（150ms 后触发），高亮目标格子及其所有邻居，给玩家确认窗口防止误触
- UX-DR3: 实现桌面端悬停反馈——鼠标悬停格子时即时高亮目标格子及其邻居，强化决策张力感
- UX-DR4: 实现死因回顾 4 步渐进式揭示系统——① 地雷位置高亮 → ② 玩家推理正确区域标绿 → ③ 推理断裂点标红+说明 → ④ 可选查看完整推理链
- UX-DR5: 实现 ReviewStepNav 组件——死因回顾步骤导航，点击步骤标签切换揭示层级
- UX-DR6: 实现"先体验后命名"的交互式教学系统——通过受限棋盘让玩家自己发现规则变化，而非文字弹窗解释
- UX-DR7: 实现教学覆盖层（TutorialOverlay）——半透明遮罩 + 高亮区域 + 教学卡片 + 手指动画引导，完成操作后自动消失
- UX-DR8: 实现规则卡片（RuleCard）——含拓扑/机制的迷你格子示例，点击规则按钮弹出，点击外部收起
- UX-DR9: 实现标记冲突提示——新翻开的数字与已有假设标记矛盾时，冲突区域橙色边框闪烁（300ms × 2）
- UX-DR10: 实现通关庆祝流程——全棋盘亮起动画（从翻开点向外扩散 500ms）→ 成绩面板滑入（时间+尝试次数）→ 2s 后下一关预览卡片从底部滑入
- UX-DR11: 实现棋盘展开动画——进入关卡时棋盘从中心向外扩展（0.5s）
- UX-DR12: 实现连续失败情感缓冲——同一关连续失败 3 次以上时，提供可选提示（高亮一个安全起始区域）
- UX-DR13: 实现拓扑主题色系统——六边形蓝绿、三角形橙黄、环面紫色、不规则绿色、混合渐变，通过设计令牌管理
- UX-DR14: 实现 CellNode 组件——支持 8 种状态（unrevealed/revealed/flagged/pencil-mine/pencil-safe/delayed/fuzzy/mine），颜色+图标双重编码
- UX-DR15: 实现移动端底部工具栏（MobileToolbar）——撤销标记、假设模式切换、规则卡片、暂停，每按钮 ≥ 44×44px
- UX-DR16: 实现桌面端键盘导航——Tab 在格子间移动，Enter 翻开，Space 标记，方向键导航邻居，P 切换假设模式，R 查看规则，Esc 关闭/暂停
- UX-DR17: 实现动画减弱支持——尊重 prefers-reduced-motion 设置 + 提供关闭动画选项
- UX-DR18: 实现第 10 关完整成就回顾——所有关卡通关数据汇总 + "你征服了所有规则"终极反馈

### FR Coverage Map

- FR1: Epic 1 - 六边形网格渲染与邻接计算
- FR2: Epic 5 - 不规则图形棋盘渲染与邻接计算
- FR3: Epic 5 - 环面拓扑棋盘渲染
- FR4: Epic 5 - 三角形网格棋盘渲染与邻接计算
- FR5: Epic 5 - 混合拓扑棋盘渲染
- FR6: Epic 1 - 统一拓扑抽象接口（ITopologyGraph）
- FR7: Epic 5 - 混合拓扑接缝邻接规则
- FR8: Epic 3 - 逻辑坐标到屏幕坐标映射
- FR9: Epic 3 - 拓扑适配的 hit-test
- FR10: Epic 5 - 模糊提示（范围值）
- FR11: Epic 5 - 延迟揭示
- FR12: Phase 2 - 误导信息格子（推迟）
- FR13: Phase 2 - 死因回顾中标注误导格（推迟）
- FR14: Epic 2 - 信息机制形式化语义定义
- FR15: Epic 2 - 信息机制组合行为定义
- FR16: Epic 5 - 延迟揭示等待中视觉状态
- FR17: Epic 3 - 鼠标左键/点击翻开格子
- FR18: Epic 3 - 鼠标右键/长按标记地雷
- FR19: Epic 3 - 自动展开相邻无雷区域
- FR20: Epic 3 - 踩雷游戏结束与失败反馈
- FR21: Epic 8 - 移动端缩放和平移手势
- FR22: Epic 3 - 撤销最近一次标记操作
- FR23: Epic 7 - 暂停功能与棋盘遮蔽
- FR24: Epic 7 - 切换标签页/来电自动暂停
- FR25: Epic 3 - 格子状态视觉区分
- FR26: Epic 3 - 格子状态过渡动画
- FR27: Epic 7 - 基础音效反馈
- FR28: Epic 7 - 音效开关设置
- FR29: Epic 4 - 关卡选择界面
- FR30: Epic 4 - 通关后下一关自动解锁
- FR31: Epic 4 - 重玩已解锁关卡
- FR32: Epic 4 - 分层计时器
- FR33: Epic 4 - 无限重试与保留推理标记
- FR34: Epic 7 - 通关动画和完成反馈
- FR35: Epic 4 - 关卡解锁进度持久化
- FR36: Epic 4 - 最佳通关时间和尝试次数显示
- FR37: Epic 3 - 关卡状态生命周期
- FR38: Epic 6 - 新拓扑交互式引导
- FR39: Epic 6 - 新信息机制交互式引导
- FR40: Epic 6 - 随时查看规则卡片
- FR41: Epic 6 - 规则卡片内容展示
- FR42: Epic 6 - 引导可跳过且不重复
- FR43: Epic 6 - 踩雷失败反馈（爆炸动画+地雷高亮）
- FR44: Epic 6 - 死因回顾界面
- FR45: Epic 6 - 死因回顾标注推理错误位置
- FR46: Phase 2 - 死因回顾标注误导格（推迟）
- FR47: Epic 6 - 死因回顾展示解题路径
- FR48: Epic 6 - 死因回顾直接重试
- FR49: Epic 2 - 二进制格式 magic number + 版本字节
- FR50: Epic 2 - 二进制格式完整字段规范
- FR51: Epic 2 - 二进制格式存储内容
- FR52: Epic 2 - 关卡阅读器加载与可视化
- FR53: Epic 2 - 关卡阅读器展示邻接和信息机制参数
- FR54: Epic 2 - 关卡阅读器模拟游戏过程
- FR55: Epic 2 - 关卡阅读器错误处理
- FR56: Epic 2 - 可解性验证器验证唯一解
- FR57: Epic 2 - 验证器输入规范
- FR58: Epic 2 - 验证器失败原因输出
- FR59: Epic 1 - 共享代码库（拓扑邻接+格式解析）
- FR60: Epic 8 - 静态 Web 资源构建与部署
- FR61: Epic 8 - Chrome 桌面端和移动端运行
- FR62: Epic 8 - HTML 落地页
- FR63: Epic 4 - 关卡文件作为游戏资源打包

## Epic List

### Epic 1: 项目基础设施与核心拓扑引擎
开发者可以在完整的项目结构中开发，核心拓扑抽象层可用，第一个拓扑（六边形）的邻接计算经过验证，共享代码库架构建立。
**FRs:** FR6, FR1, FR59
**ARs:** AR1, AR2, AR3, AR10, AR11, AR12
**NFRs:** NFR11, NFR12, NFR14

### Epic 2: 关卡数据管线与可解性验证
关卡设计者可以用二进制格式定义关卡、验证唯一解、用阅读器可视化检查——完整的关卡设计工作流可用。
**FRs:** FR14, FR15, FR49, FR50, FR51, FR52, FR53, FR54, FR55, FR56, FR57, FR58
**ARs:** AR4, AR5, AR6, AR7
**NFRs:** NFR7, NFR13

### Epic 3: 核心游戏循环（六边形单关可玩）
玩家可以在六边形棋盘上完成一局完整的扫雷游戏——翻开格子、标记地雷、自动展开、踩雷失败、通关成功，桌面端鼠标交互完整。
**FRs:** FR8, FR9, FR17, FR18, FR19, FR20, FR22, FR25, FR26, FR37
**ARs:** AR9
**NFRs:** NFR1, NFR2, NFR5, NFR6

### Epic 4: 关卡流程与进度管理
玩家可以在关卡选择界面浏览 10 个关卡、解锁进度、重玩已解锁关卡、无限重试并保留标记，进度跨会话持久化。
**FRs:** FR29, FR30, FR31, FR32, FR33, FR35, FR36, FR63
**ARs:** AR8
**NFRs:** NFR4, NFR15, NFR16, NFR17

### Epic 5: 信息机制与多拓扑扩展
玩家可以体验模糊提示和延迟揭示两种信息机制，以及三角形、环面、不规则、混合拓扑——10 关的全部规则变化可用。
**FRs:** FR2, FR3, FR4, FR5, FR7, FR10, FR11, FR16
**UX-DRs:** UX-DR1, UX-DR9, UX-DR13, UX-DR14

### Epic 6: 教学引导与失败反馈系统
玩家首次遇到新拓扑/信息机制时获得交互式引导，踩雷后通过 4 步渐进式死因回顾理解错误，连续失败时获得情感缓冲——完整的学习与恢复体验。
**FRs:** FR38, FR39, FR40, FR41, FR42, FR43, FR44, FR45, FR47, FR48
**UX-DRs:** UX-DR4, UX-DR5, UX-DR6, UX-DR7, UX-DR8, UX-DR12

### Epic 7: 视觉打磨、音效与通关体验
玩家体验完整的视觉反馈（悬停高亮、过渡动画、棋盘展开）、音效系统、通关庆祝流程和第 10 关成就回顾——情感体验完整。
**FRs:** FR23, FR24, FR27, FR28, FR34
**UX-DRs:** UX-DR3, UX-DR10, UX-DR11, UX-DR17, UX-DR18
**NFRs:** NFR8, NFR9, NFR10

### Epic 8: 移动端适配与部署发布
玩家可以在 Chrome 移动端流畅游玩（触摸翻开、长按标记、缩放平移、翻开预览），游戏部署为静态 Web 资源并可通过落地页访问。
**FRs:** FR21, FR60, FR61, FR62
**UX-DRs:** UX-DR2, UX-DR15, UX-DR16
**NFRs:** NFR3

### Phase 2 Deferred Requirements

以下需求因架构决策（误导信息机制为 Σ₂ᵖ-complete 问题）明确推迟到 Phase 2，MVP 不实现：

- **FR12:** 关卡可以包含少量误导信息格子（显示的数字与实际不符），且误导格子比例不超过 5%
- **FR13:** 玩家在死因回顾中可以看到哪些格子包含误导信息
- **FR46:** 死因回顾界面明确标注误导信息格子（如果当前关卡包含该机制）

**推迟原因：** 误导信息机制下的唯一解验证是 Σ₂ᵖ-complete 问题——玩家不知道哪些格子在骗人，可以将任何不匹配的数字归类为"误导"，从而构造多个自洽解释。Phase 2 可能的降级方案包括：公开误导格数量给玩家（降为 NP-hard）、已知骗子模式、或用模糊提示替代。

## Epic 1: 项目基础设施与核心拓扑引擎

开发者可以在完整的项目结构中开发，核心拓扑抽象层可用，第一个拓扑（六边形）的邻接计算经过验证，共享代码库架构建立。

### Story 1.1: 项目初始化与目录结构搭建

As a 开发者,
I want 一个完整的项目目录结构和开发工具链配置,
So that 我可以在统一的代码规范下开始开发所有模块。

**Acceptance Criteria:**

**Given** 一个空的项目目录
**When** 执行项目初始化
**Then** 创建 src/core/、src/game/、src/reader/、src/verifier/ 目录结构
**And** tsconfig.json 配置 strict: true + paths 别名（@core/* → src/core/*）
**And** vitest.config.ts 配置完成，可运行测试
**And** ESLint + Prettier 配置完成，含 import 规则约束依赖方向
**And** package.json 包含所有开发依赖（typescript、vitest、eslint、prettier、vite）
**And** .gitignore 包含 node_modules、build、dist

### Story 1.2: 核心类型定义与错误处理基础

As a 开发者,
I want core 层的共享类型定义和错误处理基类,
So that 所有模块使用统一的类型系统和错误处理模式。

**Acceptance Criteria:**

**Given** 项目结构已初始化（Story 1.1）
**When** 实现 core/types/ 和 core/errors/ 模块
**Then** CellId、Point2D、ValidationResult 等共享类型定义完成
**And** MinesweeperError 基类及 TopologyError、LevelLoadError、SolverError、StorageError 子类实现
**And** core/logger/ 的 ILogger 接口和 ConsoleLogger 实现完成
**And** core/random/ 的 IRandom 接口和 SeededRandom 实现完成，给定相同 seed 产生相同序列
**And** 所有类型和接口有 JSDoc 注释
**And** core 代码零平台依赖（不引入 document、process）
**And** 单元测试覆盖 SeededRandom 的确定性验证：相同 seed 产生相同序列、不同 seed 产生不同序列、序列分布基本均匀性检验

### Story 1.3: 拓扑抽象接口与六边形拓扑实现

As a 开发者,
I want 统一的拓扑抽象接口和第一个拓扑（六边形）的完整实现,
So that 后续所有拓扑类型可以通过实现相同接口扩展，且六边形邻接计算经过验证。

**Acceptance Criteria:**

**Given** core 类型定义已完成（Story 1.2）
**When** 实现 ITopologyGraph 和 ITopologyRenderer 接口及 HexTopology
**Then** ITopologyGraph 接口定义 cells()、neighbors()、cellCount() 方法
**And** ITopologyRenderer 扩展 ITopologyGraph，增加 cellShape()、cellCenter()、cellAt() 方法
**And** HexTopology 正确计算六边形网格的 6 邻居邻接关系
**And** 边缘和角落格子的邻居数量正确（< 6）
**And** 邻接数据预计算为邻接表，neighbors() 查询 O(1)
**And** TopologyRegistry 注册表实现，可通过 TopologyType 获取拓扑工厂函数
**And** 单元测试覆盖：中心格子 6 邻居、边缘格子邻居数、角落格子邻居数、邻接对称性（A 是 B 的邻居则 B 是 A 的邻居）
**And** barrel 文件（index.ts）正确导出公共 API

## Epic 2: 关卡数据管线与可解性验证

关卡设计者可以用二进制格式定义关卡、验证唯一解、用阅读器可视化检查——完整的关卡设计工作流可用。

### Story 2.1: 信息机制类型定义与规则引擎

As a 开发者,
I want 信息机制的形式化类型定义和规则引擎,
So that 模糊提示和延迟揭示的约束语义明确，可被求解器和游戏逻辑消费。

**Acceptance Criteria:**

**Given** core 类型系统已建立（Epic 1）
**When** 实现 core/mechanism/ 模块
**Then** MechanismType 枚举定义 FuzzyHint 和 DelayedReveal 两种类型
**And** DisplayValue 使用 discriminated union 建模（exact/fuzzy/delayed/hidden 四种 kind）
**And** CellState 包含 truthValue（真实邻居地雷数）和 displayValue（显示值）双层状态
**And** FuzzyHint 规则定义：显示值为 [真实值 - offset, 真实值 + offset] 的范围
**And** DelayedReveal 规则定义：翻开后延迟 N 步才显示数字，对 solver 等价于精确数字
**And** 每个格子最多一种信息机制，机制间独立作用不叠加（FR15）
**And** MechanismRegistry 注册表实现，支持通过类型获取机制处理函数
**And** 单元测试覆盖 FuzzyHint 范围计算和 DelayedReveal 语义

### Story 2.2: 二进制关卡格式与 Codec 抽象层

As a 关卡设计者,
I want 一套完整的二进制关卡文件格式和编解码工具,
So that 我可以将关卡数据序列化为紧凑的二进制文件，并在各工具间共享。

**Acceptance Criteria:**

**Given** 拓扑类型和信息机制类型已定义（Story 1.3, Story 2.1）
**When** 实现 core/binary/ 模块
**Then** LevelData 类型定义完整：拓扑类型标识、格子定义、邻接数据、地雷位置、信息机制类型和参数、元数据
**And** 二进制格式以 4 字节 Magic Number "MSWP" + 1 字节版本号 0x01 开头
**And** ILevelCodec 接口定义 encode()、decode()、validate() 方法
**And** BinaryLevelCodec 实现完整的二进制编解码（使用 DataView）
**And** JsonLevelCodec 实现人类可读的 JSON 编解码（开发调试用）
**And** round-trip 测试：encode → decode 后数据完全一致（覆盖：空关卡、最大规模 200 格子、所有拓扑类型、所有信息机制类型）
**And** validate() 对损坏、截断或版本不匹配的文件返回明确错误信息（FR55）
**And** 常量 MAGIC_NUMBER 和 VERSION_BYTE 定义在 constants.ts 中，不硬编码

### Story 2.3: 约束求解器实现

As a 关卡设计者,
I want 一个可解性验证器核心算法,
So that 我可以验证任何关卡在其信息机制规则下是否存在唯一解。

**Acceptance Criteria:**

**Given** 拓扑接口和信息机制规则已定义（Story 1.3, Story 2.1）
**When** 实现 core/solver/ 模块
**Then** 约束传播算法根据已知数字（含 FuzzyHint 范围约束）缩小每个未知格子的可能性
**And** 回溯搜索在约束传播无法继续时假设格子状态并递归验证
**And** 唯一解验证：找到第一个解后继续搜索，找到第二个解则报告"非唯一解"
**And** 连通分量分割：独立区域分别求解，避免搜索空间爆炸
**And** 弧一致性（arc consistency）预处理
**And** FuzzyHint 约束为 min ≤ 邻居地雷数 ≤ max
**And** DelayedReveal 约束与精确数字相同
**And** SolverResult 包含：是否唯一解、解的内容、失败时的具体原因和差异位置（FR58）
**And** 单元测试覆盖：5×5 六边形 + 精确数字唯一解、5×5 六边形 + FuzzyHint 唯一解、非唯一解检测、无解检测
**And** 验证时间在 200 格子规模下 < 30s（NFR7）

### Story 2.4: 可解性验证器 CLI

As a 关卡设计者,
I want 一个命令行工具来验证关卡文件的可解性,
So that 我可以在设计关卡时快速验证唯一解。

**Acceptance Criteria:**

**Given** 约束求解器和二进制 codec 已实现（Story 2.2, Story 2.3）
**When** 实现 src/verifier/ CLI 应用
**Then** CLI 接受二进制关卡文件路径作为输入（FR57）
**And** 加载文件、解析关卡数据、运行求解器验证唯一解
**And** 唯一解确认时输出 "✅ 唯一解已验证" 及解的摘要
**And** 非唯一解时输出 "❌ 存在 N 个可能解" 及差异位置（FR58）
**And** 文件损坏/格式错误时输出明确错误信息
**And** 支持 batch-verify 模式：验证目录下所有 .mswp 文件
**And** verifier 通过 @core/* paths 别名引用共享代码库
**And** tsc 编译 + node 运行

### Story 2.5: 关卡阅读器 Web 应用

As a 关卡设计者,
I want 一个 Web 端关卡阅读器来可视化和模拟关卡,
So that 我可以直观检查棋盘布局、邻接关系和信息机制参数。

**Acceptance Criteria:**

**Given** 二进制 codec 和拓扑渲染接口已实现（Story 2.2, Story 1.3）
**When** 实现 src/reader/ Vite + Canvas Web 应用
**Then** 用户可以通过文件选择器加载 .mswp 二进制关卡文件（FR52）
**And** 棋盘布局使用 Canvas API 可视化渲染，格子位置和形状正确
**And** 信息面板展示关卡元数据：拓扑类型、格子数、地雷数、信息机制参数（FR53）
**And** 邻接关系可视化：点击格子高亮其所有邻居
**And** 模拟模式：逐步翻开格子查看结果（显示 truthValue 或 displayValue）（FR54）
**And** 文件加载失败时显示明确错误信息（FR55）
**And** reader 通过 @core/* paths 别名引用共享代码库
**And** Vite 开发服务器可正常启动和热更新

### Story 2.6: 创建开发验证用关卡集

As a 开发者,
I want 一组可用的测试关卡文件,
So that 从 Epic 3 开始的所有游戏功能可以端到端验证。

**Acceptance Criteria:**

**Given** 二进制 codec 和可解性验证器已实现（Story 2.2, Story 2.4）
**When** 创建开发验证用关卡集
**Then** 至少创建 3 个六边形拓扑关卡：简单（5×5，2 颗雷）、中等（7×7，8 颗雷）、困难（9×9，15 颗雷）
**And** 所有关卡通过可解性验证器验证唯一解
**And** 关卡文件以 .mswp 格式保存到 src/game/assets/resources/levels/（或临时开发目录）
**And** 关卡阅读器可正确加载和可视化这些关卡
**And** 后续 Epic 5 实现新拓扑时补充对应拓扑的测试关卡

## Epic 3: 核心游戏循环（六边形单关可玩）

玩家可以在六边形棋盘上完成一局完整的扫雷游戏——翻开格子、标记地雷、自动展开、踩雷失败、通关成功，桌面端鼠标交互完整。

### Story 3.1: 项目初始化与棋盘渲染

As a 玩家,
I want 在浏览器中看到一个正确渲染的六边形扫雷棋盘,
So that 我可以直观地看到游戏界面并理解棋盘布局。

**Acceptance Criteria:**

**Given** core 拓扑引擎已实现（Epic 1）
**When** 启动游戏 Web 应用
**Then** game 目录结构正确创建，Vite 开发服务器可启动
**And** GameRenderer 根据 HexTopology 的 cellCenter() 正确排列格子
**And** Canvas 渲染六边形格子，未翻开状态显示为浅灰色
**And** 逻辑坐标到屏幕坐标映射正确，格子间距均匀（FR8）
**And** 棋盘在桌面端浏览器居中显示

### Story 3.2: 游戏状态机与格子翻开交互

As a 玩家,
I want 点击格子翻开它并看到数字,
So that 我可以获取推理信息来判断地雷位置。

**Acceptance Criteria:**

**Given** 棋盘已渲染且关卡数据已加载
**When** 玩家鼠标左键点击一个未翻开的格子
**Then** hit-test 正确将屏幕坐标映射到六边形逻辑 cell（FR9）
**And** GameStateMachine 从 notStarted 转换为 playing 状态（首次点击时）（FR37）
**And** 格子翻开后显示邻居地雷数（精确数字），视觉状态从未翻开变为已翻开（FR25）
**And** 翻开动画（翻转效果）在 100ms 内完成
**And** 点击到视觉反馈的响应延迟 < 100ms（NFR1）
**And** CommandLog 记录每步操作（{action: 'reveal', cellId}）用于后续死因回顾
**And** CommandLog 有单元测试验证记录和回放的正确性（记录操作序列 → 回放后状态一致）

### Story 3.3: 自动展开与标记操作

As a 玩家,
I want 翻开安全区域时自动展开相邻格子，并能标记疑似地雷,
So that 我可以高效推进游戏并记录推理结果。

**Acceptance Criteria:**

**Given** 格子翻开交互已实现（Story 3.2）
**When** 玩家翻开一个邻居地雷数为 0 的格子
**Then** BFS 自动展开所有相邻的无雷区域，直到遇到有数字的格子（FR19）
**And** 展开以波纹动画呈现（从翻开点向外扩散），200ms 内完成视觉呈现（NFR5）
**And** BFS 热路径内部使用可变数据结构，零分配（城墙模式）

**Given** 棋盘处于 playing 状态
**When** 玩家鼠标右键点击一个未翻开的格子
**Then** 格子切换为已标记状态，显示旗帜图标（FR18, FR25）
**And** 再次右键点击取消标记

**Given** 玩家已标记至少一个格子
**When** 玩家执行撤销操作
**Then** 最近一次标记操作被撤销（FR22）
**And** 撤销不影响翻开操作（翻开不可撤销）

### Story 3.4: 踩雷失败与通关判定

As a 玩家,
I want 踩雷时看到失败反馈，所有安全格子翻开时看到通关成功,
So that 我能清楚知道游戏结果。

**Acceptance Criteria:**

**Given** 游戏处于 playing 状态
**When** 玩家翻开一个地雷格子
**Then** 游戏立即结束，GameStateMachine 转换为 failed 状态（FR20, FR37）
**And** 踩雷格子显示地雷图标 + 红色背景 + 短暂震动动画（FR25, FR26）
**And** 所有其他地雷位置高亮显示

**Given** 游戏处于 playing 状态
**When** 所有非地雷格子都已翻开
**Then** 游戏结束，GameStateMachine 转换为 success 状态（FR37）
**And** 所有格子变为已翻开状态（视觉上全部亮起），显示基础通关反馈（用时 + "通关成功"文字）
**And** 完整的通关庆祝动画在 Epic 7 中实现，此处提供可替换的基础版本

**Given** 游戏处于 failed 或 success 状态
**When** 玩家选择重试
**Then** 棋盘重置为初始状态，可重新开始游戏

## Epic 4: 关卡流程与进度管理

玩家可以在关卡选择界面浏览 10 个关卡、解锁进度、重玩已解锁关卡、无限重试并保留标记，进度跨会话持久化。

### Story 4.1: 存储抽象层与进度持久化

As a 玩家,
I want 我的游戏进度在关闭浏览器后不丢失,
So that 我下次打开游戏时可以继续之前的进度。

**Acceptance Criteria:**

**Given** 游戏需要持久化存储能力
**When** 实现 IStorage 接口和 LocalStorageAdapter
**Then** IStorage 接口定义 get/set/has/remove/clear 方法
**And** LocalStorageAdapter 使用 JSON 序列化/反序列化到 localStorage
**And** 存储内容包括：关卡解锁进度、每关最佳通关时间、尝试次数、音效开关偏好
**And** localStorage 数据损坏时降级为初始状态（仅第 1 关解锁），不崩溃（NFR15）
**And** 读取失败时 catch 并返回默认值，不崩溃
**And** ProgressManager 封装进度读写逻辑，对外提供类型安全的 API
**And** 单元测试覆盖：正常读写、数据损坏降级、缺失 key 返回默认值

### Story 4.2: 关卡选择界面

As a 玩家,
I want 一个关卡选择界面来浏览所有关卡并选择要玩的关卡,
So that 我可以自由选择已解锁的关卡进行游戏。

**Acceptance Criteria:**

**Given** 进度持久化已实现（Story 4.1）
**When** 玩家进入关卡选择界面
**Then** 显示 10 个关卡卡片（LevelCard），每个卡片显示关卡编号和拓扑图标（FR29）
**And** 已通关关卡显示绿色边框 + 最佳通关时间 + 尝试次数（FR36）
**And** 当前可玩关卡显示主色边框 + 发光效果
**And** 未解锁关卡显示半透明 + 锁图标，不可点击
**And** 初始状态仅第 1 关解锁
**And** 玩家可以点击任何已解锁关卡进入游戏（FR31）
**And** LevelSelect 场景与 GamePlay 场景之间的切换流畅

### Story 4.3: 关卡解锁、重试与计时器

As a 玩家,
I want 通关后自动解锁下一关，失败后可以无限重试并保留标记,
So that 我可以持续推进游戏且不丢失推理成果。

**Acceptance Criteria:**

**Given** 玩家在某关卡通关
**When** 通关判定触发
**Then** 下一关自动解锁，进度持久化保存（FR30, FR35）
**And** 关卡选择界面更新解锁状态

**Given** 玩家在某关卡失败
**When** 玩家选择重试
**Then** 棋盘重置但保留所有已有的推理标记（旗帜标记）（FR33）
**And** 重试次数不限
**And** 标记保留机制预留扩展点，Epic 5 实现假设标记后可无缝支持假设标记的保留

**Given** 玩家进入任意关卡
**When** 游戏开始（首次翻开格子）
**Then** 分层计时器启动：教学关（1-3）上限 2 分钟、中段关卡（4-7）上限 5 分钟、硬核关（8-10）上限 8 分钟（FR32）
**And** 计时器在界面上可见
**And** 通关时记录用时并与最佳成绩比较

### Story 4.4: 关卡资源加载与中断恢复

As a 玩家,
I want 关卡文件快速加载，且浏览器中断不丢失当前状态,
So that 我的游戏体验流畅且不会因意外中断而丢失进度。

**Acceptance Criteria:**

**Given** 玩家选择进入某关卡
**When** 关卡加载
**Then** 二进制关卡文件从游戏资源中加载并解析（FR63）
**And** 关卡切换时间 < 1s（含文件解析和棋盘渲染）（NFR4）
**And** 加载失败时显示明确错误信息并返回关卡选择界面（NFR16）

**Given** 玩家正在游戏中
**When** 浏览器标签页切换或手机来电
**Then** 当前关卡状态（棋盘状态、标记、计时器）保存到 IStorage（NFR17）
**And** 返回游戏时恢复到中断前的状态

## Epic 5: 信息机制与多拓扑扩展

玩家可以体验模糊提示和延迟揭示两种信息机制，以及三角形、环面、不规则、混合拓扑——10 关的全部规则变化可用。

### Story 5.1: 三角形与环面拓扑实现

As a 玩家,
I want 在三角形和环面棋盘上玩扫雷,
So that 我可以体验不同的空间推理挑战。

**Acceptance Criteria:**

**Given** 拓扑抽象接口和注册表已实现（Epic 1）
**When** 实现 TriangleTopology 和 TorusTopology
**Then** TriangleTopology 正确计算三角形网格的邻接关系（正三角 3 邻居、倒三角 12 邻居或按具体规则）（FR4）
**And** TorusTopology 实现矩形网格的环面拓扑，边缘格子与对侧边缘格子正确相连（FR3）
**And** 环面拓扑的邻接数据包含 wrapAxis 边类型标记，供渲染器绘制 wrap-around 视觉提示
**And** 两种拓扑的 ITopologyRenderer 实现完整：cellShape()、cellCenter()、cellAt()
**And** BoardRenderer 可渲染三角形和环面棋盘，格子形状和间距正确
**And** 环面棋盘边缘有发光连线视觉提示，指示 wrap-around 关系
**And** 两种拓扑注册到 TopologyRegistry
**And** 单元测试覆盖：邻接对称性、边缘格子邻居数、环面 wrap-around 邻接正确性

### Story 5.2: 不规则与混合拓扑实现

As a 玩家,
I want 在不规则图形和混合拓扑棋盘上玩扫雷,
So that 我可以面对更复杂的空间推理挑战。

**Acceptance Criteria:**

**Given** 拓扑抽象接口已实现（Epic 1）
**When** 实现 IrregularTopology 和 MixedTopology
**Then** IrregularTopology 支持可变数量邻接关系的多边形格子（FR2）
**And** MixedTopology 支持同一关卡内包含多种拓扑区域（FR5）
**And** 混合拓扑的接缝处邻接关系有明确的组合规则定义（FR7）
**And** 两种拓扑的 ITopologyRenderer 实现完整
**And** BoardRenderer 可渲染不规则和混合棋盘
**And** 不规则格子的 hit-test 正确处理非标准多边形区域
**And** 两种拓扑注册到 TopologyRegistry
**And** 单元测试覆盖：可变邻居数、混合拓扑接缝邻接、hit-test 精度

### Story 5.3: 模糊提示机制与假设标记

As a 玩家,
I want 在包含模糊提示的关卡中使用假设标记辅助推理,
So that 我可以在信息不确定时管理推理过程，避免工作记忆溢出。

**Acceptance Criteria:**

**Given** 信息机制规则引擎已实现（Epic 2 Story 2.1）
**When** 玩家翻开一个带有 FuzzyHint 机制的格子
**Then** GameStateMachine 和 BoardRenderer 扩展以支持 DisplayValue 的所有 kind（exact/fuzzy/delayed/hidden），不仅限于 exact
**And** 格子显示范围值（如"1-3"）而非精确数字（FR10）
**And** 范围值使用波浪下划线视觉标识，与精确数字区分（UX-DR14）
**And** 格子背景色为已翻开状态色

**Given** 游戏处于 playing 状态
**When** 玩家激活假设标记模式
**Then** 玩家可以在未翻开格子上标注"可能是雷"（❓黄色背景）或"可能安全"（●蓝色背景）（UX-DR1）
**And** 假设标记与旗帜标记互斥（同一格子只能有一种标记）
**And** 假设标记可以切换和取消
**And** 重试时保留假设标记（与旗帜标记一起保留）

**Given** 玩家翻开一个格子后
**When** 新翻开的数字与周围已有假设标记产生逻辑矛盾
**Then** 冲突区域的格子边框橙色闪烁（300ms × 2）提示矛盾（UX-DR9）

### Story 5.4: 延迟揭示机制与拓扑主题色

As a 玩家,
I want 体验延迟揭示机制并通过视觉主题色区分不同拓扑,
So that 我可以理解延迟信息的含义，并在视觉上感知规则空间的变化。

**Acceptance Criteria:**

**Given** 信息机制规则引擎已实现（Epic 2 Story 2.1）
**When** 玩家翻开一个带有 DelayedReveal 机制的格子
**Then** 格子显示沙漏图标 ⏳ + 倒计时数字，表示"等待中"状态（FR11, FR16）
**And** 延迟等待中的格子背景色为紫色系（UX-DR14）
**And** 玩家翻开其他 N 个格子后，延迟格子的数字自动淡入替换沙漏
**And** 延迟揭示期间格子不可交互

**Given** 游戏加载不同拓扑类型的关卡
**When** 棋盘渲染
**Then** 六边形关卡使用蓝绿色系主题（UX-DR13）
**And** 三角形关卡使用橙黄色系主题
**And** 环面关卡使用紫色系主题
**And** 不规则关卡使用绿色系主题
**And** 混合拓扑关卡使用渐变色主题
**And** 主题色通过设计令牌系统管理，影响关卡标题栏和格子边框

## Epic 6: 教学引导与失败反馈系统

玩家首次遇到新拓扑/信息机制时获得交互式引导，踩雷后通过 4 步渐进式死因回顾理解错误，连续失败时获得情感缓冲——完整的学习与恢复体验。

### Story 6.1: 交互式教学引导系统

As a 玩家,
I want 首次遇到新拓扑或信息机制时获得交互式引导,
So that 我可以在 30 秒内理解新规则并开始推理。

**Acceptance Criteria:**

**Given** 玩家首次进入包含新拓扑类型的关卡
**When** 棋盘展开后
**Then** TutorialOverlay 自动启动：半透明遮罩（60% 黑色）+ 高亮一个格子及其所有邻居（FR38, UX-DR7）
**And** 手指/箭头动画引导玩家点击高亮格子
**And** 玩家完成引导操作后覆盖层自动消失
**And** 教学采用"先体验后命名"范式——通过受限棋盘让玩家自己发现规则变化（UX-DR6）

**Given** 玩家首次进入包含新信息机制的关卡
**When** 棋盘展开后
**Then** 用 2-3 格的迷你演示展示机制效果（如模糊提示的范围值含义）（FR39）
**And** 引导完成后规则卡片图标短暂闪烁，提示玩家可随时查阅

**Given** 教学引导正在显示
**When** 玩家点击"跳过引导"
**Then** 引导立即消失，不再对该拓扑/机制重复出现（FR42）
**And** 跳过状态持久化保存

### Story 6.2: 规则卡片

As a 玩家,
I want 随时查看当前关卡的规则说明,
So that 我在推理过程中可以确认规则细节而不打断思路。

**Acceptance Criteria:**

**Given** 游戏处于 playing 状态
**When** 玩家点击规则按钮（📖 图标）
**Then** RuleCard 以覆盖层形式弹出（60% 黑色遮罩）（FR40）
**And** 规则卡片展示当前关卡的拓扑类型名称和邻接规则说明（FR41）
**And** 规则卡片展示当前关卡的信息机制规则说明（如有）
**And** 规则卡片包含迷你格子示例，直观展示邻居关系和机制效果（UX-DR8）
**And** 点击遮罩区域或关闭按钮收起规则卡片
**And** 规则卡片不强制弹出，仅在玩家主动查看时显示

### Story 6.3: 踩雷失败反馈与死因回顾

As a 玩家,
I want 踩雷后看到清晰的失败反馈并进入死因回顾,
So that 我可以理解自己的推理错误而非仅仅看到"你输了"。

**Acceptance Criteria:**

**Given** 玩家踩雷
**When** 失败判定触发
**Then** 踩雷格子显示爆炸动画（300ms）+ 地雷图标 + 所有地雷位置高亮（FR43）
**And** 0.5s 后自动过渡到死因回顾界面（不停留在爆炸画面上）

**Given** 玩家进入死因回顾界面
**When** 死因回顾加载
**Then** 渐进式揭示 4 步（UX-DR4）：
**And** ① 地雷位置高亮（红色标记）（FR44）
**And** ② 玩家推理正确的区域标绿（肯定已有成果）（FR45）
**And** ③ 推理断裂点标红 + 文字说明"从这里开始推理链断了"（FR45）
**And** ④ 可选查看完整推理链（唯一解的推理路径）（FR47）

**Given** 死因回顾界面
**When** 玩家使用 ReviewStepNav 组件
**Then** 点击步骤标签可在 4 个揭示层级间切换（UX-DR5）
**And** 棋盘同步更新对应层级的视觉状态

**Given** 死因回顾界面
**When** 玩家点击"重试本关"
**Then** 直接重试当前关卡，保留推理标记（FR48）

### Story 6.4: 连续失败情感缓冲

As a 玩家,
I want 连续失败多次后获得可选的提示帮助,
So that 我不会因为持续挫败而放弃游戏。

**Acceptance Criteria:**

**Given** 玩家在同一关卡连续失败 3 次以上
**When** 第 4 次及之后的死因回顾界面加载
**Then** 死因回顾界面额外显示"需要一点帮助吗？"的可选提示入口（UX-DR12）
**And** 提示内容为高亮一个安全的起始区域（不直接揭示答案）

**Given** 玩家选择接受提示
**When** 重试关卡
**Then** 提示的安全起始区域在棋盘上以柔和高亮标识
**And** 提示不影响通关判定和成绩记录

**Given** 玩家选择拒绝提示
**When** 重试关卡
**Then** 正常重试，无额外提示
**And** 后续失败仍可选择接受提示

## Epic 7: 视觉打磨、音效与通关体验

玩家体验完整的视觉反馈（悬停高亮、过渡动画、棋盘展开）、音效系统、通关庆祝流程和第 10 关成就回顾——情感体验完整。

### Story 7.1: 暂停系统与自动暂停

As a 玩家,
I want 手动暂停游戏或在切换标签页时自动暂停,
So that 我的游戏状态和计时器不会因为中断而受影响。

**Acceptance Criteria:**

**Given** 游戏处于 playing 状态
**When** 玩家点击暂停按钮（⏸ 图标）
**Then** GameStateMachine 转换为 paused 状态（FR23）
**And** 棋盘被 80% 黑色遮罩遮蔽（棋盘不可见，防止暂停时观察）
**And** 计时器停止
**And** 显示"继续游戏"按钮

**Given** 游戏处于 playing 状态
**When** 玩家切换浏览器标签页或手机来电
**Then** 游戏自动暂停（FR24）
**And** 返回标签页时显示暂停界面

**Given** 游戏处于 paused 状态
**When** 玩家点击"继续游戏"
**Then** 遮罩消失，棋盘恢复可见，计时器继续

### Story 7.2: 悬停反馈与棋盘展开动画

As a 玩家,
I want 鼠标悬停时看到格子和邻居高亮，进入关卡时看到棋盘展开动画,
So that 我的每次操作都有视觉反馈，游戏体验更有生命力。

**Acceptance Criteria:**

**Given** 游戏处于 playing 状态（桌面端）
**When** 鼠标悬停在一个未翻开的格子上
**Then** 目标格子及其所有邻居即时高亮（主色发光边框）（UX-DR3）
**And** 悬停格子微缩放 1.05x
**And** 鼠标移开后高亮立即消失

**Given** 玩家进入任意关卡
**When** 关卡加载完成
**Then** 棋盘从中心向外扩展动画（0.5s）（UX-DR11）
**And** 动画完成后棋盘进入可交互状态

**Given** 玩家开启了动画减弱设置或系统 prefers-reduced-motion 生效
**When** 进入关卡或悬停格子
**Then** 棋盘展开动画替换为简单淡入（UX-DR17）
**And** 悬停高亮保留但去除缩放效果

### Story 7.3: 音效系统

As a 玩家,
I want 游戏操作有音效反馈,
So that 我的操作体验更丰富，关键时刻有听觉强化。

**Acceptance Criteria:**

**Given** 游戏运行中
**When** 玩家翻开安全格子
**Then** 播放翻开音效（清脆短促）（FR27）

**Given** 游戏运行中
**When** 玩家标记地雷
**Then** 播放标记音效（轻柔确认音）（FR27）

**Given** 玩家踩雷
**When** 失败判定触发
**Then** 播放踩雷音效（爆炸/警告音）（FR27）

**Given** 玩家通关
**When** 通关判定触发
**Then** 播放通关音效（胜利/成就音）（FR27）

**Given** 玩家进入设置
**When** 切换音效开关
**Then** 音效全局开启或关闭（FR28）
**And** 音效偏好持久化保存到 IStorage

### Story 7.4: 通关庆祝与成就回顾

As a 玩家,
I want 通关时看到庆祝动画和成绩反馈，第 10 关通关后看到完整成就回顾,
So that 我获得满足感和成就感。

**Acceptance Criteria:**

**Given** 玩家通关某关卡（非第 10 关）
**When** 通关判定触发
**Then** 全棋盘亮起动画（从最后翻开点向外扩散，500ms）（FR34, UX-DR10）
**And** 成绩面板从底部滑入（300ms），显示通关时间和尝试次数
**And** 2s 后下一关预览卡片从底部滑入（拓扑轮廓 + "第 N 关"标签）
**And** 玩家可一键进入下一关或返回关卡选择

**Given** 玩家通关第 10 关
**When** 通关判定触发
**Then** 显示完整成就回顾界面（UX-DR18）
**And** 汇总所有 10 关的通关数据（每关用时、尝试次数）
**And** 显示"你征服了所有规则"终极反馈
**And** 玩家可返回关卡选择界面重玩任意关卡

### Story 7.5: 无障碍视觉合规

As a 玩家,
I want 游戏的色彩和视觉设计满足无障碍标准,
So that 色觉障碍用户也能正常游玩。

**Acceptance Criteria:**

**Given** 游戏的所有界面
**When** 检查色彩对比度
**Then** 所有文字与背景对比度 ≥ 4.5:1（WCAG 2.1 AA）（NFR8）
**And** 数字和范围提示字体在移动端不小于 14px（NFR9）

**Given** 游戏的所有格子状态
**When** 检查视觉区分方式
**Then** 所有格子状态同时使用颜色 + 图标/形状辅助区分（NFR10）
**And** 不依赖纯色彩传达关键信息

**Given** 玩家偏好设置
**When** 玩家开启动画减弱选项
**Then** 所有过渡动画替换为简单淡入淡出或直接切换（UX-DR17）
**And** 设置持久化保存

## Epic 8: 移动端适配与部署发布

玩家可以在 Chrome 移动端流畅游玩（触摸翻开、长按标记、缩放平移、翻开预览），游戏部署为静态 Web 资源并可通过落地页访问。

### Story 8.1: 移动端触摸交互适配

As a 移动端玩家,
I want 通过触摸操作流畅地翻开格子、标记地雷和导航棋盘,
So that 我在手机上也能获得良好的游戏体验。

**Acceptance Criteria:**

**Given** 玩家在 Chrome 移动端打开游戏
**When** 玩家点击一个未翻开的格子
**Then** 格子被翻开（与桌面端左键行为一致）

**Given** 玩家在移动端
**When** 玩家长按一个未翻开的格子（≥ 300ms）
**Then** 格子切换标记状态（与桌面端右键行为一致）

**Given** 玩家在移动端
**When** 玩家双指缩放或平移
**Then** 棋盘流畅缩放和平移（FR21）
**And** 缩放/平移手势不与翻开/标记操作冲突
**And** 缩放有最小/最大限制，防止棋盘过小或过大

**Given** 玩家在移动端按下但未抬起手指（150ms 后）
**When** 翻开预览触发
**Then** 目标格子及其所有邻居高亮显示（UX-DR2）
**And** 玩家抬起手指时执行翻开操作
**And** 玩家滑动手指离开格子时取消操作（防误触）

### Story 8.2: 移动端工具栏

As a 移动端玩家,
I want 一个便捷的底部工具栏,
So that 我可以快速访问常用操作而不遮挡棋盘。

**Acceptance Criteria:**

**Given** 玩家在移动端游戏中
**When** 游戏界面加载
**Then** 底部显示固定工具栏（MobileToolbar）（UX-DR15）
**And** 工具栏包含：撤销标记、假设模式切换、规则卡片、暂停按钮
**And** 每个按钮触摸区域 ≥ 44×44px
**And** 工具栏不遮挡棋盘核心区域

### Story 8.3: 桌面端键盘导航

As a 桌面端玩家,
I want 通过键盘完整操作游戏,
So that 我可以不依赖鼠标进行游戏，提升无障碍体验。

**Acceptance Criteria:**

**Given** 玩家在桌面端游戏中
**When** 使用键盘操作
**Then** Tab/Shift+Tab 在格子间移动焦点（UX-DR16）
**And** 方向键在邻居间移动（适配当前拓扑的邻接关系）
**And** Enter 翻开当前焦点格子
**And** Space 标记/取消标记当前焦点格子
**And** P 切换假设标记模式
**And** R 打开/关闭规则卡片
**And** Esc 关闭覆盖层或暂停游戏
**And** 键盘聚焦的格子有蓝绿发光边框指示

### Story 8.4: 静态部署与落地页

As a 玩家,
I want 通过一个链接访问游戏落地页并启动游戏,
So that 我可以方便地开始游玩和分享给朋友。

**Acceptance Criteria:**

**Given** 游戏开发完成
**When** 执行构建命令
**Then** Vite 构建输出静态 Web 资源（HTML + JS + 资源文件）（FR60）
**And** 构建产物可部署到任意静态服务器（itch.io、GitHub Pages 等）

**Given** 用户访问游戏 URL
**When** 落地页加载
**Then** 显示简单的 HTML 落地页：游戏标题、简短描述、截图、"开始游戏"按钮（FR62）
**And** 落地页包含基础 Open Graph meta 标签（标题、描述、图片）用于社交分享
**And** 点击"开始游戏"加载游戏

**Given** 用户在 Chrome 桌面端或移动端访问
**When** 游戏加载
**Then** 游戏在两种平台上正常运行（FR61）
**And** 首次加载时间 < 3s（Chrome 桌面端）（NFR3）
**And** Canvas 根据屏幕尺寸自适应（桌面端 SHOW_ALL / 移动端 FIXED_WIDTH）
