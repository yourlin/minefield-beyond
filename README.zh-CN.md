# Minefield Beyond — 高挑战性扫雷游戏

> 多拓扑棋盘 × 创新信息机制的扫雷变体，规则在变，逻辑永远成立。

[English](./README.md)

## 在线游玩

🎮 **[点击开始](https://yourlin.github.io/minefield-beyond/)**

## 有什么不同

传统扫雷建立在矩形网格的固定 8 邻居邻接关系上。这款游戏将棋盘拓扑本身变成了变量：

- **六边形（Hex）** — 6 邻居，通过 cube coordinates 生成多种棋盘形状（菱形、六角形、三角形、十字等）
- **环面（Torus）** — 边缘环绕相连，没有安全角落
- **三角形（Triangle）** — 根据朝向有 3 或 12 个邻居

配合**模糊提示**（范围值）和**延迟揭示**等信息机制，每一关都要求你重建空间推理模型。

### 核心设计理念

- **运行时地雷放置** — 首次点击时随机放置地雷，点击位置及其邻居保证安全无雷
- **30 关**，分 3 个拓扑类别（每类 10 关），难度平滑递进
- **关卡文件只存形状，不存地雷** — MSWP 二进制格式仅包含棋盘拓扑和地雷数量
- **进度持久化** — 通过 localStorage 保存解锁进度和最佳成绩

## 项目结构

```
├── minesweeper/           # 游戏源代码
│   ├── src/
│   │   ├── core/          # 共享核心库 — 零依赖，浏览器 + Node.js 通用
│   │   │   ├── topology/  # 六边形、环面、三角形拓扑
│   │   │   ├── mechanism/ # 模糊提示、延迟揭示
│   │   │   ├── solver/    # 约束传播 + 回溯求解器
│   │   │   ├── binary/    # MSWP 二进制编解码
│   │   │   ├── types/     # CellId、LevelData、ValidationResult
│   │   │   ├── errors/    # MinesweeperError 错误层次
│   │   │   └── random/    # IRandom + SeededRandom
│   │   ├── game/          # 游戏运行时 — Vite + Canvas API
│   │   ├── reader/        # 关卡阅读器 — Vite + Canvas API
│   │   └── verifier/      # 可解性验证器 — Node.js CLI
│   ├── levels/            # 生成的 .mswp 关卡文件（30 关）
│   └── scripts/           # 关卡生成脚本
├── _bmad-output/          # 规划产物（PRD、架构文档、史诗）
└── .github/workflows/     # CI/CD（GitHub Pages 自动部署）
```

## 技术栈

| 技术 | 用途 |
|------|------|
| TypeScript 5.9 | 开发语言（严格模式） |
| Vite 8 | 开发服务器 + 生产构建 |
| Canvas API | 游戏渲染（自动缩放） |
| Web Audio API | 音效 |
| Vitest 4 | 测试（198 个测试用例） |
| ESLint + Prettier | 代码质量 |
| localStorage | 进度持久化 |

## 快速开始

```bash
cd minesweeper
npm install
npm run dev:game     # 启动游戏开发服务器
```

### 其他命令

```bash
npm test             # 运行全部测试
npm run build:game   # 生产构建
npm run dev:reader   # 启动关卡阅读器开发服务器
npx tsx scripts/generate-levels.ts  # 重新生成 30 个关卡
```

## 架构

项目遵循严格的依赖方向：`game → core`、`reader → core`、`verifier → core`。`core/` 库零外部依赖，可在浏览器和 Node.js 中运行。

关键架构决策：
- **注册表模式** — 拓扑和信息机制的可扩展性
- **可辨识联合类型** — 替代枚举 + 可选字段
- **不可变约束** — 求解器中 originalMin/originalMax 不可变
- **Cube coordinates** — 数学上精确对称的六边形形状
- **自定义错误层次** — 优雅降级

## 关卡格式

关卡使用自定义二进制格式（MSWP）：
- Magic number：`0x4D 0x53 0x57 0x50`
- 版本字节：`0x01`
- 包含：拓扑类型、形状参数、格子定义、地雷数量
- 不包含地雷位置（运行时放置）

## 许可证

MIT
