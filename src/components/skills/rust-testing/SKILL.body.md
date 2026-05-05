## 测试类型速查

| 类型 | 位置 | 编译方式 | 适合 |
|------|------|----------|------|
| 单元测试 | `#[cfg(test)] mod tests` | 同 crate | 内部逻辑 |
| 集成测试 | `tests/*.rs` | 独立 crate | 公共 API |
| 文档测试 | `/// ` 代码块 | 独立 crate | 示例 + 回归 |
| Snapshot | `#[test]` + `insta::assert_snapshot!` | 同 crate | 复杂输出 |

代码示例见 [chapter_05.md](references/chapter_05.md)。

## 反模式

### FAIL: 测试名看不出行为

```rust
#[test]
fn test_it_works() {
    assert!(parse_port("8080").is_ok());
}
```

→ 失败报 `test_it_works failed`，仍不知道测什么。

### PASS: 描述输入+条件+预期

```rust
#[test] fn parse_port_accepts_valid_numeric_string() { ... }
#[test] fn parse_port_rejects_zero() { ... }
#[test] fn parse_port_rejects_non_numeric() { ... }
```

### FAIL: snapshot 自动 accept

```bash
cargo insta test --accept  # 不看 diff 直接接受 → 失去回归保护
```

### PASS: 人工审查

```bash
cargo insta test     # 失败展示 diff
cargo insta review   # 逐条看 → 合理才 accept
```
