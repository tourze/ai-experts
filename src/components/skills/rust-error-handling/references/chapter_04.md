# 第 4 章 - 错误处理

Rust 强制执行严格的错误处理方法，但*如何*处理错误决定了你的代码是感觉符合人体工程学、一致且安全——还是晦涩且痛苦。本章深入探讨了在库和二进制可执行文件中建模和管理可失败操作的最佳实践。

> 即使你决定使用 `unwrap` 或 `expect` 让应用崩溃，Rust 也迫使你显式声明这一点。

## 4.1 优先使用 `Result`，避免 panic 🫨

Rust 有一个强大的类型来包裹可失败数据：[`Result<T, E>`](https://doc.rust-lang.org/std/result/)，这允许我们根据需求处理错误情况并据此管理应用状态。

* 如果你的函数可能失败，优先返回一个 `Result`：
```rust
fn divide(x: f64, y: f64) -> Result<f64, DivisionError> {
    if y == 0.0 {
        Err(DivisionError::DividedByZero)
    } else {
        Ok(x / y)
    }
}
```

* 仅在不可恢复条件下使用 `panic!`——通常是测试、断言、缺陷或因某些明确原因需要崩溃应用的情况。
* 有 3 个相关宏可以在适当条件下替代 `panic!`：
    * `todo!`，类似于 panic，但提示编译器你已意识到存在缺失代码。
    * `unreachable!`，你已经推理过代码块并确信条件 `xyz` 是不可能的，如果它变得可能，你希望被提示。
    * `unimplemented!`，特别适用于提示某个块尚未实现及其原因。

## 4.2 在生产环境中避免 `unwrap`/`expect`

虽然 `expect` 优于 `unwrap`，因为它可以包含上下文，但应避免在生产代码中使用，因为有更智能的替代方案。考虑到这一点，它们应在以下场景中使用：
- 在测试、断言或测试辅助函数中。
- 当失败不可能时。
- 当更智能的选项无法处理特定情况时。

### 🚨 处理 `unwrap`/`expect` 的替代方法：

* 如果你的 `Result`（或 `Option`）在 `Result::Err` 的情况下可以有一个预定义的提前返回值，且不需要知道 `Err` 的值，使用 `let Ok(..) = else { return ... }` 模式，因为它有助于展平函数：
```rust
let Ok(json) = serde_json::from_str(&input) else {
    return Err(MyError::InvalidJson);
}
```
* 如果你的 `Result`（或 `Option`）在 `Result::Err` 的情况下需要错误恢复，且不需要知道 `Err` 的值，使用 `if let Ok(..) else { ... }` 模式：
```rust
if let Ok(json) = serde_json::from_str(&input) else {
    ...
} else {
    Err(do_something_with_input(&input))
}
```
* 需要处理 `Option::None` 值的函数建议返回 `Result<T, E>`，其中 `E` 是 crate 或模块级别的错误，如上面的示例所示。
* 最后，`unwrap_or`、`unwrap_or_else` 或 `unwrap_or_default`，这些函数帮助您创建处理未初始化值的退出替代方案。

## 4.3 使用 `thiserror` 处理 Crate 级别错误

手动派生 Error 是冗长且容易出错的，Rust 生态系统有一个非常好的 crate 来帮助解决这个问题，`thiserror`。它允许您轻松创建实现 `From` trait 以及简单错误消息（`Display`）的错误类型，改善开发者体验，同时与 `?` 无缝协作并集成 `std::error::Error`：

```rust
#[derive(Debug, thiserror::Error)]
pub enum MyError {
    #[error("Network Timeout")]
    Timeout,
    #[error("Invalid data: {0}")]
    InvalidData(String),
    #[error(transparent)]
    Serialization(#[from] serde_json::Error),
    #[error("Invalid request information. Header: {headers}, Metadata: {metadata}")]
    InvalidRequest {
        headers: Headers,
        metadata: Metadata
    }
}
```

### 错误层次结构和包装

对于分层系统，最佳实践是使用带有 `#[from]` 的嵌套 `enum/struct` 错误：

```rust
use crate::database::DbError;
use crate::external_services::ExternalHttpError;

#[derive(Debug, thiserror::Error)]
pub enum ServiceError {
    #[error("Database handler error: {0}")]
    Db(#[from] DbError),
    #[error("External services error: {0}")]
    ExternalServices(#[from] ExternalHttpError)
}
```

## 4.4 为二进制可执行文件保留 `anyhow`

`anyhow` 是一个出色的 crate，对于刚开始并需要加速的项目非常有用。然而，存在一个转折点，它只是痛苦地通过你的代码传播，考虑到这一点，`anyhow` 仅推荐用于**二进制可执行文件**，在需要符合人体工程学的错误处理且不需要精确的错误类型时：

```rust
use anyhow::{Context, Result, anyhow};

fn main() -> Result<()> {
    let content = std::fs::read_to_string("config.json")
        .context("Failed to read config file")?;
    Config::from_str(&content)
        .map_err(|err| anyhow!("Config parsing error: {err}"))
}
```

### 🚨 `Anyhow` 陷阱

* 在整个代码库中保持 `context` 和 `anyhow` 字符串最新比保持 `thiserror` 消息更难，因为你没有一个单一的入口点。
* `anyhow::Result` 会擦除调用者可能需要的上下文，因此避免在库中使用它。
* 测试辅助函数可以使用 `anyhow`，几乎没有问题。

## 4.5 使用 `?` 传播错误

优先使用 `?` 而非冗长的替代方案，如 `match` 链：
```rust
fn handle_request(req: &Request) -> Result<ValidatedRequest, MyError> {
    validate_headers(req)?;
    validate_body_format(req)?;
    validate_credentials(req)?;
    let body = Body::try_from(req)?;

    Ok(ValidatedRequest::try_from((req, body))?)
}
```

> 如果需要错误恢复，使用 `or_else`、`map_err`、`if let Ok(..) else`。要**检查或记录错误**，使用 `inspect_err`。

## 4.6 单元测试应练习错误处理

虽然许多错误不实现 PartialEq 和 Eq，这使得直接进行断言变得困难，但可以通过 `format!` 或 `to_string()` 检查错误消息，使错误有意义并通过测试验证：

```rust
#[test]
fn error_does_not_implement_partial_eq() {
    let err = divide(10., 0.0).unwrap_err();
    assert_eq!(err.to_string(), "division by zero");
}

#[test]
fn error_implements_partial_eq() {
    let err = process(my_value).unwrap_err();

    assert_eq!(
        err,
        MyError {
            ..
        }
    )
}
```

## 4.7 重要主题

### 自定义错误 Struct

有时你不需要 enum 来处理错误，因为你的模块只有一种错误类型。这可以通过 `struct Errors` 解决：

```rust
#[derive(Debug, thiserror::Error, PartialEq)]
#[error("Request failed with code `{code}`: {message}")]
struct HttpError {
    code: u16,
    message: String
}
```

### 异步错误

当使用异步运行时（如 Tokio）时，确保你的错误在需要时实现 `Send + Sync + 'static`，特别是在任务中或跨 `.await` 边界时：

```rust
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    ...
    Ok(())
}
```

> 避免在库中使用 `Box<dyn std::error::Error>`，除非确实需要
