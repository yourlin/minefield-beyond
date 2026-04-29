# Story 1.1: 项目初始化与目录结构搭建

Status: done

## Story

As a 开发者,
I want 一个完整的项目目录结构和开发工具链配置,
So that 我可以在统一的代码规范下开始开发所有模块。

## Acceptance Criteria (AC)

1. **Given** 一个空的项目目录 **When** 执行项目初始化 **Then** 创建 `src/core/`、`src/reader/`、`src/verifier/` 目录结构（`src/game/` 由 Cocos Dashboard 在 Story 3.1 中创建，此处不创建）
2. **And** `tsconfig.json` 配置 `strict: true` + paths 别名（`@core/*` → `src/core/*`），target/module 为 ES2020
3. **And** `vitest.config.ts` 配置完成，可运行 `src/core/` 下的 `.test.ts` 文件
4. **And** ESLint + Prettier 配置完成，含 import 规则约束依赖方向（core 禁止引入 `cc`/`document`/`process`/`window`）
5. **And** `package.json` 包含所有开发依赖（typescript、vitest、eslint、prettier 及相关插件）
6. **And** `.gitignore` 包含 `node_modules`、`build`、`dist`、`src/game/assets/scripts/core/`
7. **And** `scripts/sync-core.sh` 脚本实现 core 编译 → rsync 同步 → 孤儿 .meta 清理（实际验证在 Story 3.1）

## Tasks / Subtasks

- [x] Task 1: 创建项目根目录和 package.json (AC: #1, #5)
  - [x] `npm init -y` 初始化
  - [x] 安装开发依赖：`typescript vitest eslint prettier eslint-config-prettier @typescript-eslint/eslint-plugin @typescript-eslint/parser`
  - [x] 添加 npm scripts：`"test": "vitest run"`, `"test:watch": "vitest"`, `"lint": "eslint src/"`, `"format": "prettier --write src/"`, `"build:core": "tsc -p src/core/tsconfig.json"`, `"sync": "bash scripts/sync-core.sh"`
- [x] Task 2: 创建完整目录结构 (AC: #1)
  - [x] `src/core/` 及子目录：`topology/`, `mechanism/`, `solver/`, `binary/`, `types/`, `random/`, `errors/`, `logger/`
  - [x] `src/reader/src/` 及子目录：`renderer/`, `ui/`
  - [x] `src/verifier/src/`
  - [x] `scripts/`
  - [x] `docs/topology-specs/`
  - [x] 每个 core 子目录放置空 `index.ts` barrel 文件（导出占位）
  - [x] `src/core/index.ts` 顶层 barrel
- [x] Task 3: 配置 tsconfig.json (AC: #2)
  - [x] `strict: true`
  - [x] `target: "ES2020"`, `module: "ES2020"`, `moduleResolution: "bundler"`
  - [x] `paths: { "@core/*": ["src/core/*"] }`
  - [x] `baseUrl: "."`
  - [x] `outDir: "dist"`
  - [x] `exclude: ["**/*.test.ts", "src/game/**"]`
- [x] Task 4: 配置 vitest.config.ts (AC: #3)
  - [x] resolve paths 别名 `@core/*`
  - [x] include `src/core/**/*.test.ts`
  - [x] 创建一个 `src/core/types/common.ts` 占位文件 + `src/core/types/common.test.ts` 冒烟测试，验证 vitest 可运行
- [x] Task 5: 配置 ESLint (AC: #4)
  - [x] `eslint.config.mjs` 使用 `@typescript-eslint/parser`（ESLint v9 flat config）
  - [x] 启用 `@typescript-eslint/eslint-plugin` 推荐规则
  - [x] 配置 `eslint-config-prettier` 避免冲突
  - [x] 添加 `no-restricted-globals` + `no-restricted-imports` 规则：core 目录禁止 `cc`、`document`、`process`、`window`
  - [x] 禁止 `any` 类型（`@typescript-eslint/no-explicit-any: error`）
- [x] Task 6: 配置 Prettier (AC: #4)
  - [x] `.prettierrc`：`singleQuote: true`, `trailingComma: "all"`, `printWidth: 100`, `semi: true`
- [x] Task 7: 配置 .gitignore (AC: #6)
  - [x] `node_modules/`, `dist/`, `build/`, `src/game/assets/scripts/core/`, `.DS_Store`, `*.log`
- [x] Task 8: 创建 sync-core.sh (AC: #7)
  - [x] tsc 编译 core
  - [x] rsync 同步到 `src/game/assets/scripts/core/`
  - [x] 清理孤儿 .meta 文件
  - [x] `chmod +x scripts/sync-core.sh`
- [x] Task 9: 创建 README.md
  - [x] 项目名称、简述、目录结构说明、开发命令列表
- [x] Task 10: 验证
  - [x] `npm run test` 通过冒烟测试
  - [x] `npm run lint` 无错误
  - [x] `npm run format` 无变更（代码已格式化）

## Dev Notes

### 架构决策：方案 C — 单包 + 内部目录隔离
[Source: architecture.md#Starter Template Evaluation]

项目采用单包结构而非 monorepo。原因：单人开发优先降低构建复杂度，Cocos Creator 与 pnpm workspace 兼容性风险不值得在项目初期承担。

### 依赖方向（强制）
```
game ──→ core
reader ──→ core
verifier ──→ core
core ──→ （零外部依赖）
```

core 层是最严格的边界：零外部依赖，纯 TypeScript，浏览器 + Node.js 同构。禁止引入 `cc`、`document`、`process`、`window`。

### 命名规范
[Source: architecture.md#Naming Patterns]

- 文件名：kebab-case（`hex-topology.ts`）
- 目录名：kebab-case（`src/core/topology/`）
- 测试文件：同名 + `.test.ts`，就近放置
- 类：PascalCase；接口：I 前缀 + PascalCase；常量：UPPER_SNAKE_CASE
- barrel 文件（index.ts）统一导出公共 API，不导出内部实现

### ⚠️ 关键注意事项

1. **不要创建 `src/game/`** — 该目录由 Cocos Dashboard 在 Story 3.1 中创建。sync-core.sh 中引用的目标路径此时不存在，这是预期行为。
2. **不要安装 Cocos Creator 相关依赖** — 游戏引擎依赖在 Story 3.1 中处理。
3. **不要初始化 Vite（reader）** — reader 的 Vite 初始化在 Story 2.5 中处理。此处只创建目录结构。
4. **TypeScript 版本** — 使用 `~5.9.0`（当前最新稳定版）。
5. **Vitest 版本** — 使用 `^4.1.0`（当前最新稳定版）。
6. **ESLint import 规则** — 必须配置 `no-restricted-imports` 阻止 core 引入平台 API，这是架构边界的编译期保障。

### sync-core.sh 脚本完整内容
[Source: architecture.md#Testing Patterns]

```bash
#!/bin/bash
# scripts/sync-core.sh — core → game 同步脚本
# 编译 core TypeScript → 同步到 Cocos Creator 项目 → 清理孤儿 .meta

set -e

echo "🔨 Compiling core..."
tsc -p src/core/tsconfig.json

echo "📦 Syncing to game/assets/scripts/core/..."
rsync -av --delete dist/core/ src/game/assets/scripts/core/

echo "🧹 Cleaning orphan .meta files..."
cd src/game/assets/scripts/core/
find . -name '*.meta' | while read meta; do
  src="${meta%.meta}"
  [ ! -e "$src" ] && rm "$meta" && echo "  Removed orphan: $meta"
done

echo "✅ Sync complete"
```

### core 子目录的 tsconfig.json
core 需要独立的 tsconfig 用于 `tsc -p` 编译：
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "../../dist/core",
    "rootDir": ".",
    "declaration": true
  },
  "include": ["./**/*.ts"],
  "exclude": ["./**/*.test.ts"]
}
```

### Project Structure Notes

本 Story 创建的目录结构严格遵循架构文档定义。后续 Story 在此基础上填充代码：
- Story 1.2 → `core/types/`, `core/errors/`, `core/logger/`, `core/random/`
- Story 1.3 → `core/topology/`
- Story 2.1 → `core/mechanism/`
- Story 2.2 → `core/binary/`
- Story 2.3 → `core/solver/`

### References

- [Source: architecture.md#Starter Template Evaluation] — 方案 C 决策和初始化命令
- [Source: architecture.md#Complete Project Directory Structure] — 完整目录结构
- [Source: architecture.md#Implementation Patterns & Consistency Rules] — 命名规范和模式
- [Source: architecture.md#Enforcement Guidelines] — AI Agent 必须遵循的规则
- [Source: epics.md#Story 1.1] — 验收标准
- [Source: epics.md#Story 1.2, Story 1.3] — 后续 Story 对本 Story 的依赖

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Completion Notes List

- ✅ 项目根目录 `minesweeper/` 创建完成
- ✅ package.json 含所有 dev 依赖（typescript ~5.9.0, vitest ^4.1.5, eslint ^9.x, prettier ^3.x）和 npm scripts
- ✅ 目录结构完整：core（8 子目录）、reader/src（2 子目录）、verifier/src、scripts、docs/topology-specs
- ✅ tsconfig.json：strict: true, ES2020 target, @core/* paths 别名
- ✅ src/core/tsconfig.json：独立编译配置，输出到 dist/core，含 declaration
- ✅ vitest.config.ts：@core 别名解析，globals: true，冒烟测试 3/3 通过
- ✅ eslint.config.mjs：ESLint v9 flat config，core 边界强制（no-restricted-globals + no-restricted-imports），no-explicit-any: error
- ✅ .prettierrc：singleQuote, trailingComma all, printWidth 100
- ✅ .gitignore：node_modules, dist, build, src/game/assets/scripts/core/
- ✅ scripts/sync-core.sh：tsc 编译 → rsync 同步 → 孤儿 .meta 清理，chmod +x
- ✅ README.md：项目简介、目录结构、开发命令
- ✅ 所有 core 子目录含 barrel index.ts
- ✅ src/core/types/common.ts 含 Point2D 和 ValidationResult 类型定义（带 JSDoc）
- ✅ 冒烟测试验证 vitest + paths 别名 + TypeScript strict 全部工作正常
- 注意：ESLint 使用 v9 flat config（eslint.config.mjs）而非 .eslintrc.cjs，因为 ESLint v9 已弃用旧格式

### Change Log

- 2026-04-28: Story 1.1 完成 — 项目初始化，完整目录结构，所有工具链配置，冒烟测试通过
- 2026-04-28: Code Review — 10 findings (1 decision, 6 patch, 3 defer)

### Review Findings

- [x] [Review][Decision] 是否在 core 中限制 `console` 使用 — 决定：现在限制，已添加 `no-console: error`
- [x] [Review][Patch] `export *` from empty barrels 导致 `build:core` 编译失败 [src/core/index.ts] — 已修复：添加 `export {}`
- [x] [Review][Patch] `sync-core.sh` 使用裸 `tsc` 命令而非 `npx tsc` [scripts/sync-core.sh:8] — 已修复
- [x] [Review][Patch] `sync-core.sh` `read` 缺少 `-r` 标志，变量未加引号 [scripts/sync-core.sh:13-16] — 已修复：`IFS= read -r`，if 块替代 &&
- [x] [Review][Patch] Vitest include 范围为 `src/**` 而非 spec 要求的 `src/core/**` [vitest.config.ts:11] — 已修复
- [x] [Review][Patch] 6 个依赖使用 `^` 范围而非架构要求的紧约束范围 [package.json] — 已修复：全部改为 `~`
- [x] [Review][Patch] 空目录缺少 `.gitkeep` 文件，git clone 后丢失 [docs/topology-specs/, src/reader/src/*, src/verifier/src/] — 已修复
- [x] [Review][Defer] `@core/*` path alias 在 tsc 编译输出中不会被重写 — 推迟，Story 2.5/3.1 需要 bundler 处理
- [x] [Review][Defer] `@core/*` 在 core sub-tsconfig 中形成自引用别名 — 推迟，core 代码不会使用 @core 导入
- [x] [Review][Defer] `rsync --delete` 可能删除引擎管理的文件 — 推迟，src/game/ 在 Story 3.1 才创建

### File List

- minesweeper/package.json (NEW)
- minesweeper/package-lock.json (NEW)
- minesweeper/tsconfig.json (NEW)
- minesweeper/src/core/tsconfig.json (NEW)
- minesweeper/vitest.config.ts (NEW)
- minesweeper/eslint.config.mjs (NEW)
- minesweeper/.prettierrc (NEW)
- minesweeper/.gitignore (NEW)
- minesweeper/README.md (NEW)
- minesweeper/scripts/sync-core.sh (NEW)
- minesweeper/src/core/index.ts (NEW)
- minesweeper/src/core/topology/index.ts (NEW)
- minesweeper/src/core/mechanism/index.ts (NEW)
- minesweeper/src/core/solver/index.ts (NEW)
- minesweeper/src/core/binary/index.ts (NEW)
- minesweeper/src/core/types/index.ts (NEW)
- minesweeper/src/core/types/common.ts (NEW)
- minesweeper/src/core/types/common.test.ts (NEW)
- minesweeper/src/core/random/index.ts (NEW)
- minesweeper/src/core/errors/index.ts (NEW)
- minesweeper/src/core/logger/index.ts (NEW)
