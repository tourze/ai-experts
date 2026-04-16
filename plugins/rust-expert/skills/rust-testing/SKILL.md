---
name: rust-testing
description: 当用户要编写或重构 Rust 测试时使用；涉及测试命名、单元/集成/文档测试、断言模式、cargo-insta snapshot 或测试组织时触发。
---

# Rust 测试

## 适用场景

- 编写新的单元测试、集成测试或文档测试。
- 重构测试：改善命名、减少重复、消除脆弱断言。
- 引入或使用 cargo-insta 做 snapshot 测试。
- 组织 `tests/` 目录、test crate 或 benchmark。

## 核心约束

- 测试名表达输入、条件与预期结果，如 `parse_port_rejects_zero`。
- 每个测试只验证一个行为。
- `#[should_panic]` 只在确实测试 panic 路径时使用；错误路径用 `assert!(result.is_err())`。
- 文档测试（`///` 中的代码块）同时充当活文档和回归保护。
- snapshot 测试（cargo-insta）适合输出结构复杂的场景；更新 snapshot 前必须人工审查 diff。
- 集成测试放 `tests/` 目录，每个文件是独立编译 crate。

## 测试类型速查

| 类型 | 位置 | 编译方式 | 适合 |
|------|------|----------|------|
| 单元测试 | `#[cfg(test)] mod tests` | 同 crate | 内部逻辑 |
| 集成测试 | `tests/*.rs` | 独立 crate | 公共 API |
| 文档测试 | `/// ` 代码块 | 独立 crate | 示例 + 回归 |
| Snapshot | `#[test]` + `insta::assert_snapshot!` | 同 crate | 复杂输出 |

代码示例见 [chapter_05.md](references/chapter_05.md)。

## 检查清单

- 测试名是否准确表达输入、条件与预期结果？
- 是否存在 `assert!(true)` 或 `assert_eq!(result, result)` 这类空断言？
- 公共 API 是否有文档测试？
- 联动：[rust-ownership-idioms](../rust-ownership-idioms/SKILL.md) · [rust-error-handling](../rust-error-handling/SKILL.md)

## 反模式

- 测试名只写 `test_it_works`、`test1`，看不出行为。
- 一个测试验证多个不相关行为。
- snapshot 自动 accept 不审 diff。
- 集成测试放 `src/` 内部——无法验证公共 API 边界。
