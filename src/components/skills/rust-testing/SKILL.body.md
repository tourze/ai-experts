## 测试类型速查

| 类型 | 位置 | 编译方式 | 适合 |
|------|------|----------|------|
| 单元测试 | `#[cfg(test)] mod tests` | 同 crate | 内部逻辑 |
| 集成测试 | `tests/*.rs` | 独立 crate | 公共 API |
| 文档测试 | `/// ` 代码块 | 独立 crate | 示例 + 回归 |
| Snapshot | `#[test]` + `insta::assert_snapshot!` | 同 crate | 复杂输出 |

代码示例见 [chapter_05.md](references/chapter_05.md)。
