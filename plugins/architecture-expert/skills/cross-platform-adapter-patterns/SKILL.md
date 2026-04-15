---
name: cross-platform-adapter-patterns
description: "在设计跨平台应用的平台抽象层、适配器接口、运行时分支和 monorepo 组织时使用；覆盖 React Native、Tauri、Web 等多目标平台的共享与隔离策略。"
---

# cross-platform-adapter-patterns

## 适用场景
- 需要让同一套业务逻辑运行在多个平台上，或设计共享包与平台包的边界。
- 交叉引用：边界分析配合 `seam-ripper`；架构蓝图配合 `architecture-blueprint-generator`。

## 核心约束
- 领域逻辑必须平台无关；平台代码只存在于 adapter 层。
- 接口定义在共享包；每个平台独立实现，平台包之间禁止互引。
- 平台检测只出现在边界（入口、DI 容器），不渗透到业务逻辑。
- 文件扩展名分叉是构建时机制；`Platform.select` 仅用于值选择。
- 适配器不得将平台原语泄漏到共享层。
- 平台不支持某能力时必须返回类型化错误或明确降级值。

## 代码模式
- 按需读取 `references/adapter-interface.md`、`references/rust-cfg-abstraction.md`、`references/di-container.md`、`references/monorepo-layout.md`。

## 检查清单
- `shared-core` 是否零平台导入。
- 适配器注册是否集中在 app 入口。
- 依赖方向是否单向：`apps -> platform-* -> shared-core`。

## 反模式
- 在共享包中直接 import 平台模块。
- 业务逻辑里散落 `if (Platform.OS === 'ios')`。
- 平台包互相依赖或所有平台代码挤在一个文件用 `switch` 选择。
