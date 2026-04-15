---
name: symfony-bundle-architecture
description: 设计和审查 Symfony Bundle 的目录结构、DI Extension、CompilerPass、服务配置与 Bundle 间依赖声明
---

# Symfony Bundle Architecture

## 适用场景

- 新建或审查 Bundle 的 Extension、services.yaml、CompilerPass 和依赖声明。
- Bundle 间依赖混乱、可选依赖缺失、Monorepo 多 Bundle 协作。
- Entity 设计联动 [doctrine-entity-patterns](../doctrine-entity-patterns/SKILL.md)；代码示例和调试命令见 [reference.md](reference.md)。

## 核心约束

- Bundle 类只做：声明依赖 + 注册 CompilerPass。
- Extension `load()` 只加载配置文件，不直接构造服务。
- services.yaml 用 `autowire` + `autoconfigure` + 按命名空间 `resource` 扫描；禁用 `exclude`。
- CompilerPass 仅用于标签和配置无法完成的操作，必须 `hasDefinition()` 前置检查。
- Bundle 间依赖必须显式声明，不靠加载顺序。

## 代码模式

见 [reference.md](reference.md) 中的 Bundle 类、Extension、services.yaml、CompilerPass 和标签收集完整示例。

## 检查清单

- Bundle 类是否只含 `build()` 和依赖声明。
- Extension 是否通过 FileLocator + Loader 加载配置。
- services.yaml 是否按命名空间分组 `resource`。
- CompilerPass 是否做了存在性前置检查。
- Bundle 间依赖是否显式声明，可选依赖是否有降级。

## 反模式

- Extension `load()` 里做数据库查询或 HTTP 调用。
- 用 `exclude` 排除文件而非 `resource` 显式声明。
- 依赖另一个 Bundle 但不声明。
- 一个 CompilerPass 混合多种职责。
- 所有服务标记 `public: true`。
