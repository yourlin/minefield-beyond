# Story 2.5: 关卡阅读器 Web 应用

Status: done

## Story

As a 关卡设计者,
I want 一个 Web 端关卡阅读器来可视化和模拟关卡,
So that 我可以直观检查棋盘布局、邻接关系和信息机制参数。

## Acceptance Criteria (AC)

1. **Given** 二进制 codec 和拓扑渲染接口已实现 **When** 实现 src/reader/ Vite + Canvas Web 应用 **Then** 用户可以通过文件选择器加载 .mswp 二进制关卡文件（FR52）
2. **And** 棋盘布局使用 Canvas API 可视化渲染，格子位置和形状正确
3. **And** 信息面板展示关卡元数据：拓扑类型、格子数、地雷数、信息机制参数（FR53）
4. **And** 邻接关系可视化：点击格子高亮其所有邻居
5. **And** 模拟模式：逐步翻开格子查看结果（显示 truthValue 或 displayValue）（FR54）
6. **And** 文件加载失败时显示明确错误信息（FR55）
7. **And** reader 引用 core 共享代码库
8. **And** Vite 开发服务器可正常启动

## Tasks / Subtasks

- [x] Task 1: 初始化 Vite 项目结构 (AC: #7, #8)
  - [x] 创建 src/reader/index.html
  - [x] 创建 src/reader/style.css
  - [x] 创建 src/reader/vite.config.ts
  - [x] 创建 src/reader/tsconfig.json
- [x] Task 2: 实现 Canvas 渲染器 (AC: #2)
  - [x] src/reader/src/renderer/canvas-renderer.ts — 棋盘渲染
  - [x] 绘制六边形格子（pointy-top）
  - [x] 格子状态着色（未翻开/已翻开/地雷/高亮）
  - [x] 显示格子数字
- [x] Task 3: 实现 UI 组件 (AC: #1, #3, #4, #5, #6)
  - [x] src/reader/src/ui/file-loader.ts — 文件选择器
  - [x] src/reader/src/ui/info-panel.ts — 信息面板
  - [x] src/reader/src/ui/simulation-controls.ts — 模拟控件
- [x] Task 4: 实现主应用 (AC: 全部)
  - [x] src/reader/src/app.ts — 应用入口，连接所有组件
  - [x] src/reader/src/main.ts — Vite 入口
- [x] Task 5: 验证 (AC: 全部)
  - [x] `npm run lint` 无错误
  - [x] Vite 开发服务器可启动

## Dev Notes

### 架构说明
reader 是一个独立的 Vite + Canvas Web 应用，位于 src/reader/。它使用 core 层的 BinaryLevelCodec、TopologyRegistry、HexTopology 来加载和渲染关卡。

### HexTopology 渲染参数
- DEFAULT_HEX_SIZE = 30（circumradius）
- hexWidth = sqrt(3) * 30 ≈ 51.96
- hexHeight = 60
- pointy-top, odd-r offset 坐标

### ⚠️ 关键注意事项
1. reader 可以使用浏览器 API（Canvas, DOM）
2. 使用相对路径导入 core — `../../core/...`
3. TopologyRegistry 需要已注册（import 触发副作用）
4. Vite 配置需要 resolve alias 指向 core

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Completion Notes List

- **Task 1**: 创建 Vite 项目结构 — index.html、style.css、vite.config.ts（resolve alias 指向 core）、tsconfig.json（含 DOM lib）。
- **Task 2**: 实现 CanvasRenderer — pointy-top 六边形绘制、格子状态着色（unrevealed/revealed/mine/highlighted）、数字显示（精确/模糊/延迟）、hit-test、自动居中。
- **Task 3**: 实现 UI 组件 — file-loader（FileReader + BinaryLevelCodec 验证/解码）、info-panel（关卡元数据展示）、simulation-controls（显示全部/重置/显示地雷）。
- **Task 4**: 实现主应用 — app.ts 连接所有组件，Canvas 点击处理（高亮邻居 + 翻开 + 显示详情）。
- **Task 5**: 106 个测试全部通过，lint 无错误，tsc 编译通过。

### Change Log

- 2026-04-29: Story 2.5 完整实现 — 关卡阅读器 Web 应用

### File List

**新建：**
- `src/reader/index.html` — HTML 入口
- `src/reader/style.css` — 样式
- `src/reader/vite.config.ts` — Vite 配置
- `src/reader/tsconfig.json` — TypeScript 配置
- `src/reader/src/renderer/canvas-renderer.ts` — Canvas 棋盘渲染器
- `src/reader/src/ui/file-loader.ts` — 文件加载器
- `src/reader/src/ui/info-panel.ts` — 信息面板
- `src/reader/src/ui/simulation-controls.ts` — 模拟控件
- `src/reader/src/app.ts` — 应用入口
- `src/reader/src/main.ts` — Vite 入口
