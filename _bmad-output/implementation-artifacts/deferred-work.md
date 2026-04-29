# Deferred Work

## Deferred from: code review of 1-2-core-type-definitions-and-error-handling (2026-04-29)

- `nextInt` 浮点参数返回非整数 [seeded-random.ts] — IRandom 接口的 number 类型是架构定义，运行时验证超出本 Story 范围。考虑在未来 Story 中添加参数校验或使用品牌类型。
- `LevelMetadata.difficulty` 接受 NaN/Infinity/负数 [level.ts] — 类型壳的完整验证在 Story 2.2 实现时处理。

## Deferred from: code review of 1-3-topology-abstraction-and-hex-implementation (2026-04-29)

- `cellAt()` O(n) 暴力扫描 [hex-topology.ts] — 当前规模 ≤200 cells 无性能风险，Story 3.1 渲染时可用 O(1) pixel-to-hex 算法优化。
- TopologyRegistry.create() 返回 ITopologyGraph 丢失 ITopologyRenderer [topology-registry.ts] — 架构设计选择，下游 Story 3.1 可直接构造 HexTopology 获取渲染接口。
- TopologyRegistry.register() 静默覆盖已有注册 [topology-registry.ts] — 当前只有一个拓扑注册，风险极低。未来多拓扑时可添加 override 标志。

## Deferred from: code review of 2-1-mechanism-type-definitions-and-rule-engine (2026-04-29)

- Registry handler 的 `as` 转换无运行时校验 [mechanism-registry.ts] — 当前只有内部代码调用，Story 2.2 codec 提供类型安全 config。
- fuzzy max 无上限 clamp [fuzzy-hint.ts] — 关卡设计者控制 offset，上限由关卡验证器在 Story 2.4 检查。
