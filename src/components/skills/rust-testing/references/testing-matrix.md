# Rust 测试类型速查

| 类型 | 位置 | 编译方式 | 适合 |
|------|------|----------|------|
| 单元测试 | `#[cfg(test)] mod tests` | 同 crate | 内部逻辑、私有函数。 |
| 集成测试 | `tests/*.rs` | 独立 crate | 公共 API、跨模块行为。 |
| 文档测试 | `///` 代码块 | 独立 crate | 示例、活文档、回归保护。 |
| Snapshot | `#[test]` + `insta::assert_snapshot!` | 同 crate | 复杂输出、格式化文本、CLI 输出。 |

更新 snapshot 前必须人工审查 diff；错误路径优先断言 `Result`，不要滥用 `#[should_panic]`。
