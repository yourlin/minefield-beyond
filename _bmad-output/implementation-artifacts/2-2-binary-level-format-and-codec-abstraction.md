# Story 2.2: 二进制关卡格式与 Codec 抽象层

Status: done

## Story

As a 关卡设计者,
I want 一套完整的二进制关卡文件格式和编解码工具,
So that 我可以将关卡数据序列化为紧凑的二进制文件，并在各工具间共享。

## Acceptance Criteria (AC)

1. **Given** 拓扑类型和信息机制类型已定义（Story 1.3, Story 2.1）**When** 实现 core/binary/ 模块 **Then** LevelData 类型定义完整：拓扑类型标识、格子定义、邻接数据、地雷位置、信息机制类型和参数、元数据
2. **And** 二进制格式以 4 字节 Magic Number "MSWP" + 1 字节版本号 0x01 开头
3. **And** ILevelCodec 接口定义 encode()、decode()、validate() 方法
4. **And** BinaryLevelCodec 实现完整的二进制编解码（使用 DataView）
5. **And** JsonLevelCodec 实现人类可读的 JSON 编解码（开发调试用）
6. **And** round-trip 测试：encode → decode 后数据完全一致（覆盖：空关卡、最大规模 200 格子、所有拓扑类型、所有信息机制类型）
7. **And** validate() 对损坏、截断或版本不匹配的文件返回明确错误信息（FR55）
8. **And** 常量 MAGIC_NUMBER 和 VERSION_BYTE 定义在 constants.ts 中，不硬编码

## Tasks / Subtasks

- [x] Task 1: 扩展 core/types/level.ts — 完整 LevelData 类型 (AC: #1)
  - [x] 扩展 `LevelData` 接口：添加 topologyType, cells, adjacency, minePositions, mechanismConfigs 字段
  - [x] 定义 `LevelAdjacency` 类型：Record<number, number[]>（序列化友好的邻接表）
  - [x] 定义 `LevelMechanismEntry` 接口：cellId + MechanismConfig
  - [x] 更新 `core/types/index.ts` barrel 导出新类型
  - [x] JSDoc 注释
- [x] Task 2: 创建 core/binary/constants.ts — 格式常量 (AC: #2, #8)
  - [x] `MAGIC_NUMBER` = `[0x4D, 0x53, 0x57, 0x50]`（"MSWP" ASCII）
  - [x] `VERSION_BYTE` = `0x01`
  - [x] JSDoc 注释
- [x] Task 3: 创建 core/binary/codec-types.ts — ILevelCodec 接口 (AC: #3)
  - [x] `ILevelCodec` 接口：encode(level: LevelData): ArrayBuffer, decode(buffer: ArrayBuffer): LevelData, validate(buffer: ArrayBuffer): ValidationResult
  - [x] JSDoc 注释
- [x] Task 4: 实现 core/binary/binary-codec.ts — BinaryLevelCodec (AC: #4)
  - [x] `class BinaryLevelCodec implements ILevelCodec`
  - [x] encode: 写入 magic + version + topology type + topology config + cell count + adjacency + mine positions + mechanism data + metadata
  - [x] decode: 读取并验证 magic + version，解析所有字段
  - [x] validate: 检查 magic number、version、最小长度、数据完整性
  - [x] 使用 DataView 进行二进制读写
  - [x] 无效数据抛出 LevelLoadError
  - [x] JSDoc 注释
- [x] Task 5: 实现 core/binary/json-codec.ts — JsonLevelCodec (AC: #5)
  - [x] `class JsonLevelCodec implements ILevelCodec`
  - [x] encode: JSON.stringify（Map/Set 转为 Array/Object）
  - [x] decode: JSON.parse（Array/Object 转回 Map/Set）
  - [x] validate: 检查 JSON 结构完整性
  - [x] JSDoc 注释
- [x] Task 6: 更新 core/binary/index.ts barrel 文件
  - [x] 替换 `export {}` 为真实导出
  - [x] 导出 ILevelCodec, BinaryLevelCodec, JsonLevelCodec, MAGIC_NUMBER, VERSION_BYTE
- [x] Task 7: 编写 BinaryLevelCodec round-trip 测试 (AC: #6, #7)
  - [x] `binary-codec.test.ts` 就近放置
  - [x] 测试 1: 最小关卡 round-trip（1 cell, 0 mines, no mechanisms）
  - [x] 测试 2: 中等关卡 round-trip（25 cells hex, 5 mines, FuzzyHint + DelayedReveal）
  - [x] 测试 3: 最大规模 round-trip（200 cells）
  - [x] 测试 4: validate() 对截断数据返回错误
  - [x] 测试 5: validate() 对错误 magic number 返回错误
  - [x] 测试 6: validate() 对版本不匹配返回错误
  - [x] 测试 7: validate() 对有效数据返回 valid: true
- [x] Task 8: 编写 JsonLevelCodec round-trip 测试 (AC: #5, #6)
  - [x] `json-codec.test.ts` 就近放置
  - [x] 测试 1: 基本 round-trip
  - [x] 测试 2: 含 mechanism 的 round-trip
  - [x] 测试 3: validate() 对无效 JSON 返回错误
- [x] Task 9: 验证 (AC: 全部)
  - [x] `npm run test` 全部通过
  - [x] `npm run lint` 无错误
  - [x] `npm run build:core` 编译通过
  - [x] 验证 core 代码无平台 API 引用

## Dev Notes

### 架构接口定义（必须严格遵循）
[Source: architecture.md#Decision 4: 关卡数据格式]

**ILevelCodec 接口：**
```typescript
interface ILevelCodec {
  encode(level: LevelData): ArrayBuffer;
  decode(buffer: ArrayBuffer): LevelData;
  validate(buffer: ArrayBuffer): ValidationResult;
}
```

**二进制格式头部：**
```
[4字节 Magic Number: 0x4D 0x53 0x57 0x50 ("MSWP")]
[1字节 版本号: 0x01]
```

### LevelData 完整定义（扩展 Story 1.2 的类型壳）

```typescript
interface LevelData {
  readonly metadata: LevelMetadata;
  readonly topologyType: TopologyType;
  readonly topologyConfig: Record<string, number>;  // e.g. { rows: 5, cols: 5 }
  readonly cells: readonly CellId[];
  readonly adjacency: Record<number, readonly number[]>;  // CellId → neighbor CellIds
  readonly minePositions: readonly CellId[];
  readonly mechanismConfigs: readonly LevelMechanismEntry[];
}

interface LevelMechanismEntry {
  readonly cellId: CellId;
  readonly config: MechanismConfig;
}
```

**注意：** 使用 plain objects/arrays 而非 Map/Set，因为 Map/Set 不能直接 JSON 序列化。这简化了 JsonLevelCodec 实现，也让 BinaryLevelCodec 的序列化更直接。

### 二进制格式字段布局（建议）

```
Header:
  [4B] magic: "MSWP"
  [1B] version: 0x01

Metadata:
  [2B] nameLength (uint16)
  [nB] name (UTF-8)
  [2B] authorLength (uint16)
  [nB] author (UTF-8)
  [1B] difficulty (uint8)

Topology:
  [1B] topologyType (enum index)
  [2B] configEntryCount (uint16)
  [per entry: 2B keyLength + nB key + 4B value(float32)]

Cells:
  [4B] cellCount (uint32)
  [per cell: 4B cellId (uint32)]

Adjacency:
  [per cell: 2B neighborCount (uint16) + per neighbor: 4B cellId (uint32)]

Mines:
  [4B] mineCount (uint32)
  [per mine: 4B cellId (uint32)]

Mechanisms:
  [4B] mechanismCount (uint32)
  [per mechanism: 4B cellId (uint32) + 1B type (enum) + variable config data]
    FuzzyHint: [4B offset (uint32)]
    DelayedReveal: [4B delay (uint32)]
```

### ⚠️ 关键注意事项

1. **使用相对路径导入 + .js 后缀** — `from '../types/index.js'`，`from '../mechanism/index.js'`，`from '../topology/index.js'`
2. **LevelData 使用 plain objects** — 不用 Map/Set，用 Record 和 Array，方便序列化
3. **扩展而非重写 level.ts** — Story 1.2 定义了 LevelMetadata 和 LevelData 壳，本 Story 扩展 LevelData 添加完整字段
4. **常量不硬编码** — MAGIC_NUMBER 和 VERSION_BYTE 必须从 constants.ts 导入
5. **validate() 返回 ValidationResult** — 不抛异常，返回 `{ valid: boolean, errors: string[] }`
6. **decode() 对无效数据抛 LevelLoadError** — validate 返回结果，decode 抛异常
7. **DataView 用于二进制读写** — 不用 TextEncoder/TextDecoder（可能不在所有环境可用），用 DataView + 手动 UTF-8 编码
8. **TextEncoder/TextDecoder 可用** — ES2020 target 下浏览器和 Node.js 都支持，可以用于字符串编码
9. **错误类型** — 格式错误用 LevelLoadError（已存在），不需要新建错误子类
10. **TopologyType 序列化** — 枚举值是字符串（'hexagonal' 等），二进制中用 1 字节索引映射

### 下游依赖
- **Story 2.3** 需要：LevelData（约束求解器输入）
- **Story 2.4** 需要：BinaryLevelCodec（CLI 加载 .mswp 文件）
- **Story 2.5** 需要：BinaryLevelCodec + JsonLevelCodec（阅读器加载文件）
- **Story 2.6** 需要：BinaryLevelCodec（创建测试关卡文件）
- **Story 3.1** 需要：BinaryLevelCodec（游戏运行时加载关卡）

### Epic 1 + Story 2.1 经验教训
- 相对路径导入 + `.js` 后缀
- 参数校验：Number.isFinite + Number.isInteger（Story 2.1 审查发现）
- 注册表模式：静态方法 + 模块加载时注册 + clear() 用于测试隔离
- discriminated union 模式（不用 enum + optional fields）
- afterEach 中显式重新注册（不用动态 import，ESM 缓存问题）
- 所有公共方法需要 JSDoc
- barrel 文件替换 `export {}` 为真实导出

### 文件清单（预期）

**新建：**
- `src/core/binary/constants.ts`
- `src/core/binary/codec-types.ts`
- `src/core/binary/binary-codec.ts`
- `src/core/binary/binary-codec.test.ts`
- `src/core/binary/json-codec.ts`
- `src/core/binary/json-codec.test.ts`

**修改：**
- `src/core/types/level.ts` — 扩展 LevelData，添加 LevelMechanismEntry
- `src/core/types/index.ts` — 添加新类型导出
- `src/core/binary/index.ts` — 替换 `export {}` 为真实导出

### References

- [Source: architecture.md#Decision 4: 关卡数据格式] — ILevelCodec, 二进制格式规范
- [Source: architecture.md#Data Format Patterns] — discriminated union 模式
- [Source: architecture.md#Error Handling Patterns] — LevelLoadError
- [Source: architecture.md#Complete Project Directory Structure] — binary/ 目录结构
- [Source: epics.md#Story 2.2] — 验收标准
- [Source: 2-1-story.md#Review Findings] — 参数校验、ESM 缓存问题

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Completion Notes List

- **Task 1**: 扩展 LevelData 接口，添加 topologyType, topologyConfig, cells, adjacency, minePositions, mechanismConfigs 字段。新增 LevelAdjacency 类型别名和 LevelMechanismEntry 接口。更新 barrel 导出。使用 plain objects/arrays 而非 Map/Set，方便序列化。
- **Task 2**: 创建 constants.ts，定义 MAGIC_NUMBER ([0x4D, 0x53, 0x57, 0x50]) 和 VERSION_BYTE (0x01)，带完整 JSDoc。
- **Task 3**: 创建 codec-types.ts，定义 ILevelCodec 接口（encode/decode/validate），带完整 JSDoc。
- **Task 4**: 实现 BinaryLevelCodec，使用 DataView 进行大端序二进制读写。格式布局：Header → Metadata → Topology → Cells → Adjacency → Mines → Mechanisms。validate() 返回 ValidationResult（不抛异常），decode() 对无效数据抛 LevelLoadError。内部 walkBuffer() 方法验证数据完整性。TopologyType 和 MechanismType 使用索引映射进行序列化。
- **Task 5**: 实现 JsonLevelCodec，使用 JSON.stringify/parse。validate() 检查 JSON 语法、顶层字段完整性和 metadata 子字段类型。
- **Task 6**: 更新 barrel 文件，导出所有公共 API。
- **Task 7**: BinaryLevelCodec 测试 — 12 个测试用例覆盖：最小/中等/大规模 round-trip、截断/错误 magic/版本不匹配的 validate 错误、有效数据 validate、所有拓扑类型、所有机制类型、UTF-8 元数据、空 buffer。
- **Task 8**: JsonLevelCodec 测试 — 8 个测试用例覆盖：基本/含机制 round-trip、无效 JSON/缺失字段/数组根的 validate 错误、有效数据 validate、UTF-8 元数据。
- **Task 9**: 全部 81 个测试通过（10 个测试文件），lint 无错误，build:core 编译通过，core 代码无平台 API 引用。

### Change Log

- 2026-04-29: Story 2.2 完整实现 — 二进制关卡格式与 Codec 抽象层
- 2026-04-29: 代码审查修复 — 7 项 patch 修复（输入验证、MechanismType.None 索引修正、尾部字节检测、JSON 深度验证、消除双重解析）

### Review Findings

- [x] [Review][Patch] MechanismType.None 不应出现在 MECHANISM_INDEX — 从索引中移除 None，修复 validate/decode 不一致 [binary-codec.ts]
- [x] [Review][Patch] Float32 精度丢失 — encode 时验证 topologyConfig 值可通过 Math.fround() 往返 [binary-codec.ts]
- [x] [Review][Patch] difficulty 无边界检查 — encode 时验证 difficulty 为 [0,255] 整数 [binary-codec.ts]
- [x] [Review][Patch] Uint16 字符串长度溢出 — encode 时验证 name/author/key 长度不超过 65535 [binary-codec.ts]
- [x] [Review][Patch] walkBuffer 不检查尾部字节 — 添加 offset === bufLen 检查 [binary-codec.ts]
- [x] [Review][Patch] JsonLevelCodec.validate() 过于浅层 — 添加 cells/adjacency/topologyType 等字段类型检查 [json-codec.ts]
- [x] [Review][Patch] JsonLevelCodec.decode() 双重解析 — 重构为 validateInternal() 返回解析结果，消除重复 JSON.parse [json-codec.ts]
- [x] [Review][Patch] walkBuffer 未使用的 _bytes 参数 — 移除 [binary-codec.ts]

### File List

**新建：**
- `src/core/binary/constants.ts` — MAGIC_NUMBER, VERSION_BYTE 常量
- `src/core/binary/codec-types.ts` — ILevelCodec 接口定义
- `src/core/binary/binary-codec.ts` — BinaryLevelCodec 实现
- `src/core/binary/binary-codec.test.ts` — BinaryLevelCodec 测试（12 用例）
- `src/core/binary/json-codec.ts` — JsonLevelCodec 实现
- `src/core/binary/json-codec.test.ts` — JsonLevelCodec 测试（8 用例）

**修改：**
- `src/core/types/level.ts` — 扩展 LevelData，添加 LevelAdjacency, LevelMechanismEntry
- `src/core/types/index.ts` — 添加 LevelAdjacency, LevelMechanismEntry 导出
- `src/core/binary/index.ts` — 替换 `export {}` 为真实导出
