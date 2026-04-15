---
name: rust-error-handling
description: 当用户要设计 Rust 错误类型、选择 thiserror 还是 anyhow、规范 Result 用法、消除 unwrap 或在 async 边界传播错误时使用。
---

# Rust 错误处理

## 适用场景

- 设计库或应用的错误类型层级。
- 在 thiserror（库）和 anyhow（二进制入口）之间做选择。
- 消除生产代码中的 `unwrap()` / `expect()`。
- 在 async 边界正确传播和转换错误。

## 核心约束

- 库 crate 暴露稳定、可匹配的错误类型（用 `thiserror`）。
- 应用二进制入口才适合 `anyhow::Result` 兜底。
- `unwrap()` / `expect()` 只在测试、脚本和进程启动 fail-fast 中使用，且须注明原因。
- `?` 操作符是传播首选；手动 `match` 只在需要转换或添加上下文时。
- 错误信息小写开头、不带句号——遵循 Rust 社区惯例。
- 公共函数的 `# Errors` 文档段落解释什么条件下返回哪种错误。

## 错误类型选择

| 场景 | 推荐 | 原因 |
|------|------|------|
| 库公共 API | `thiserror` 自定义 enum | 调用方可 match |
| 应用 main/CLI | `anyhow::Result` | 快速聚合，不需下游匹配 |
| 内部模块 | 自定义 struct/enum | 保持可控 |
| 原型/脚本 | `anyhow` 或 `unwrap` | 速度优先 |

代码示例见 [chapter_04.md](references/chapter_04.md)。

## 检查清单

- 错误类型是否让调用方有机会恢复，还是被过早揉成字符串？
- 库 crate 是否暴露了 `anyhow`？应该只在二进制入口出现。
- `unwrap()` 是否都有合理理由或限制在测试中？
- 联动：[rust-pro](../rust-pro/SKILL.md) · [rust-testing](../rust-testing/SKILL.md) · [rust-async-patterns](../rust-async-patterns/SKILL.md)

## 反模式

- 库代码返回 `anyhow::Result`：调用方无法稳定匹配错误类别。
- 用 `panic!` / `unwrap()` 代替输入校验。
- 错误信息大写开头或带句号。
- 把所有错误塞进一个 `StringError(String)` 变体。
