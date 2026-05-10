# Tauri v2 补充说明

本目录是 `tauri-v2` skill 的运行时资料源。正式入口由结构化字段生成到 `SKILL.md`；本 README 只保留人工维护的快速索引，避免和生成正文重复。

## 使用边界

- 面向 Tauri v2+，覆盖 `src-tauri/`、`tauri.conf.json`、`Cargo.toml`、命令注册、IPC、capability、插件权限、移动端和更新分发。
- 新建骨架或排查问题时，先读生成后的 `SKILL.md`，再按任务专题打开 `references/` 下的文件。
- 版本细节以当前项目依赖和官方 Tauri 文档为准；不要只凭本 README 的日期或示例判断可用性。

## 参考资料

| 文件 | 用途 |
|------|------|
| [`references/quick-patterns.md`](references/quick-patterns.md) | `main.rs` / `lib.rs` 分层、命令注册、前端 `invoke()` 和 capability 示例。 |
| [`references/capabilities-reference.md`](references/capabilities-reference.md) | capability、permission、scope、多窗口目标和权限拒绝排查。 |
| [`references/ipc-patterns.md`](references/ipc-patterns.md) | `invoke()`、事件、`Channel<T>` 的选择和注册规则。 |
| [`references/plugin-reference.md`](references/plugin-reference.md) | 官方插件安装、Rust 注册、JS 包和权限配置。 |
| [`references/updater-distribution-reference.md`](references/updater-distribution-reference.md) | 签名、更新端点、平台分发和 CI 发布。 |
| [`references/advanced-runtime-reference.md`](references/advanced-runtime-reference.md) | 托盘、sidecar、deep link、自定义协议和后台任务。 |
| [`references/README.md`](references/README.md) | 专题索引和阅读顺序。 |

## 验证提示

- 修改 Tauri 应用时优先运行 `cargo tauri info`，再运行目标平台的 `cargo tauri dev` / `cargo tauri build` 或移动端命令。
- 涉及插件时同时检查三处：Cargo 依赖、`lib.rs` 注册、`src-tauri/capabilities/*.json` 权限和 scope。
- 涉及前端 IPC 类型时，把参数、返回值和事件 payload 当作跨语言合同处理。
