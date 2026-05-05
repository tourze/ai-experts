# Rust 错误处理

## 适用场景

- 设计库或应用的错误类型层级。
- 在 thiserror（库）和 anyhow（二进制入口）之间做选择。
- 消除生产代码中的 `unwrap()` / `expect()`。
- 在 async 边界正确传播和转换错误。

通用错误处理原则（三层模型、重试边界、部分失败）见 architecture-expert 的 error-handling-patterns skill。

## Rust 特有约束

- 库 crate 暴露稳定、可匹配的错误类型（用 `thiserror`）。
- 应用二进制入口才适合 `anyhow::Result` 兜底。
- `unwrap()` / `expect()` 只在测试、脚本和进程启动 fail-fast 中使用。
- `?` 操作符是传播首选；手动 `match` 只在需要转换或添加上下文时。
- 错误信息小写开头、不带句号。
- 公共函数的 `# Errors` 文档段落解释什么条件下返回哪种错误。

## 错误类型选择

| 场景 | 推荐 | 原因 |
|------|------|------|
| 库公共 API | `thiserror` 自定义 enum | 调用方可 match |
| 应用 main/CLI | `anyhow::Result` | 快速聚合，不需下游匹配 |
| 内部模块 | 自定义 struct/enum | 保持可控 |
| 原型/脚本 | `anyhow` 或 `unwrap` | 速度优先 |

代码示例见 [chapter_04.md](references/chapter_04.md)。

联动：[rust-ownership-idioms](../rust-ownership-idioms/SKILL.md) · [rust-testing](../rust-testing/SKILL.md) · [rust-async-patterns](../rust-async-patterns/SKILL.md)

## 反模式

### FAIL: 库 crate 暴露 anyhow

```rust
// lib.rs — 调用方无法 match 错误类型
pub fn parse(input: &str) -> anyhow::Result<Config> { ... }
```

### PASS: 库用 thiserror，二进制用 anyhow

```rust
// lib.rs
#[derive(Debug, thiserror::Error)]
pub enum ParseError {
    #[error("invalid format at line {line}")]
    InvalidFormat { line: usize },
    #[error("missing field: {0}")]
    MissingField(String),
}
pub fn parse(input: &str) -> Result<Config, ParseError> { ... }

// main.rs — 二进制入口用 anyhow 聚合
fn main() -> anyhow::Result<()> { ... }
```

### FAIL: unwrap 代替校验

```rust
let port: u16 = env::var("PORT").unwrap().parse().unwrap();
```

### PASS: 传播错误 + 上下文

```rust
let port: u16 = env::var("PORT")
    .context("PORT env var not set")?
    .parse()
    .context("PORT must be a valid u16")?;
```
