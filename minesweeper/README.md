# 高挑战性扫雷游戏

多拓扑 × 多信息机制 × 确定性可解的扫雷变体游戏。

## 项目结构

```
src/
├── core/          # 共享核心库（零依赖，纯 TypeScript）
│   ├── topology/  # 拓扑抽象接口与实现
│   ├── mechanism/ # 信息机制类型与规则引擎
│   ├── solver/    # 约束求解器
│   ├── binary/    # 二进制关卡格式 codec
│   ├── types/     # 共享类型定义
│   ├── random/    # 确定性随机接口
│   ├── errors/    # 自定义错误类层次
│   └── logger/    # 日志接口
├── game/          # 游戏运行时（Vite + Canvas）
│   └── logic/     # 游戏逻辑层（纯 TS，不依赖渲染）
├── reader/        # 关卡阅读器（Vite + Canvas）
└── verifier/      # 可解性验证器（Node.js CLI）
```

## 开发命令

```bash
npm test            # 运行测试（单次）
npm run test:watch  # 运行测试（监听模式）
npm run lint        # ESLint 检查
npm run format      # Prettier 格式化
npm run build:core  # 编译 core 模块
npm run dev:game    # 启动游戏开发服务器
npm run dev:reader  # 启动关卡阅读器开发服务器
```

## 技术栈

- TypeScript 5.9 (strict mode)
- Vitest 4.x (测试)
- ESLint + Prettier (代码质量)
- Vite (开发服务器 + 构建)
- Canvas API (游戏渲染)
