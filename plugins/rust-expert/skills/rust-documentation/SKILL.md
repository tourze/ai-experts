---
name: rust-documentation
description: 当用户要编写 Rust 公共 API 文档、配置 rustdoc lint、区分注释与文档、或补齐 Safety/Errors/Panics 段落时使用。
---

# Rust 文档规范

## 适用场景

- 为公共 API 编写 `///` 文档。
- 区分注释（`//` 解释 why）和文档（`///` 解释 what/how）。
- 补齐 `# Safety`、`# Errors`、`# Panics`、`# Examples` 段落。
- 配置 `#![warn(missing_docs)]` 或 `rustdoc` lint。

## 核心约束

- 注释只解释"为什么"；代码应该自解释"是什么"。
- `///` 文档解释"做什么、怎么用、失败条件"。
- 公共函数必须有文档；`# Errors` 列出返回 `Err` 的条件。
- `unsafe fn` 必须有 `# Safety` 段落说明调用方需满足的前置条件。
- 可能 panic 的函数必须有 `# Panics` 段落。
- `# Examples` 中的代码块是可执行的文档测试——必须能编译通过。
- 用 `//!` 写模块级文档，放在文件顶部。

## 文档段落速查

| 段落 | 何时需要 | 内容 |
|------|----------|------|
| 摘要行 | 所有公共项 | 一句话说明功能 |
| `# Examples` | 非显而易见的 API | 可运行的使用示例 |
| `# Errors` | 返回 `Result` 时 | 列出每种 `Err` 变体的触发条件 |
| `# Panics` | 可能 panic 时 | 说明触发 panic 的输入 |
| `# Safety` | `unsafe fn` | 调用方必须满足的不变量 |

代码示例见 [chapter_08.md](references/chapter_08.md)。

## 检查清单

- 公共 API 是否都有 `///` 文档？
- 返回 `Result` 的函数是否有 `# Errors`？
- `unsafe fn` 是否有 `# Safety`？
- 注释是否在解释"为什么"而不是翻译代码？
- 联动：[rust-pro](../rust-pro/SKILL.md) · [rust-testing](../rust-testing/SKILL.md)

## 反模式

- 注释写成代码翻译：`// increment i` 没有价值。
- `# Safety` 写"caller must ensure safety"——没有说明具体不变量。
- 文档测试中用 `# fn main()` 隐藏了所有重要代码。
- 把实现细节写进公共文档——用户不需要知道内部数据结构。
