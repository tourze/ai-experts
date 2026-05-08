# Tauri v2 参考

Tauri v2 开发的深入参考文档。当主 [`SKILL.md`](../SKILL.md) 快速入门不够用时使用这些文档。

## 参考文件

| 文件 | 描述 | 关键主题 |
|------|------|----------|
| [`capabilities-reference.md`](capabilities-reference.md) | **安全与权限** | 能力文件、权限、作用域、v1 与 v2 模型 |
| [`ipc-patterns.md`](ipc-patterns.md) | **IPC 决策框架** | Commands vs Events vs Channels、类型化 `Channel<T>` |
| [`plugin-reference.md`](plugin-reference.md) | **官方插件** | 注册、JS 包和必需的能力权限 |
| [`updater-distribution-reference.md`](updater-distribution-reference.md) | **更新器与分发** | 签名、HTTPS 端点、macOS/Windows/Linux 打包 |
| [`advanced-runtime-reference.md`](advanced-runtime-reference.md) | **高级运行时** | `TrayIconBuilder`、sidecar、deep links、自定义协议 |

## 导航指南

- **刚接触 Tauri v2 安全？** → 从 [`capabilities-reference.md`](capabilities-reference.md) 开始，了解强制性的能力模型。
- **选择 IPC 方法？** → 查看 [`ipc-patterns.md`](ipc-patterns.md) 中的"Commands vs Events vs Channels"决策矩阵。
- **添加插件？** → 查看 [`plugin-reference.md`](plugin-reference.md)，了解 CLI 可能自动添加的默认权限，以及你仍需要自行声明的额外权限字符串或作用域。
- **准备发布生产版本？** → 查看 [`updater-distribution-reference.md`](updater-distribution-reference.md)，了解强制签名和更新服务器要求。
- **托盘图标、sidecar 或 deep link？** → 查看 [`advanced-runtime-reference.md`](advanced-runtime-reference.md)，了解 v2 特定的实现方式。

*最后验证日期：2026-04-02。查看[官方 Tauri 更新日志](https://github.com/tauri-apps/tauri/blob/dev/crates/tauri/CHANGELOG.md)了解最新更新。*
