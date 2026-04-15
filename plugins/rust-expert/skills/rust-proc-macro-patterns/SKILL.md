---
name: rust-proc-macro-patterns
description: 用于 Rust 过程宏开发；当任务涉及 derive macro、attribute macro、syn/quote、proc-macro2 Span、trybuild 测试或 cargo-expand 调试时触发。
---

# Rust Proc Macro Patterns

## 适用场景

- 编写 derive macro 自动实现 trait。
- 编写 attribute macro 注入日志、校验等代码。
- 排查宏编译错误或 Span 定位不准。
- 用 trybuild 编写编译通过/失败测试。

## 核心约束

1. `[lib]` 设 `proc-macro = true`。
2. 用 syn 2.x + quote + proc-macro2。
3. 不 panic；错误用 `compile_error!` + 正确 Span。
4. derive macro 只追加 impl，不修改原始 item。
5. attribute macro 可修改 item，须文档说明。
6. trybuild 覆盖通过和失败两类测试。
7. 核心逻辑放独立辅助 crate 方便单测。
8. `cargo expand` 调试展开结果。

## 代码模式

- [Derive macro 实现 trait](references/patterns.md#模式-1)
- [Attribute macro 函数计时](references/patterns.md#模式-2)
- [带 Span 的错误报告](references/patterns.md#模式-3)
- [trybuild 编译测试](references/patterns.md#模式-4)

## 检查清单

- `proc-macro = true` 已设？用 syn 2.x？
- 错误路径返回 `compile_error!` 而非 panic？Span 指向有意义位置？

## 反模式

- 宏内 `panic!`：用户只看到 "proc macro panicked"。
- Span 全 `call_site()`：无法定位出错位置。
- derive macro 修改 item：Rust 不允许。
- 不测失败路径：用错时错误不可理解。
