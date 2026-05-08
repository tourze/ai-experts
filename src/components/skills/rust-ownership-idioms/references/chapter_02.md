# 第 2 章 - Clippy 与 Lint 规范

确保 `cargo clippy` 已随你的 Rust 编译器安装，在终端中为 Rust 项目运行 `cargo clippy -V`，你应该会看到类似 `clippy 0.1.86 (05f9846f89 2025-03-31)` 的输出。如果终端未能显示 clippy 版本，请运行以下命令 `rustup update && rustup component add clippy`。

Clippy 文档可在[此处](https://doc.rust-lang.org/clippy/usage.html)找到。

## 2.1 为什么要关注 lint？

Rust 编译器是一个强大的工具，可以捕获许多错误。然而，一些更深入的分析需要额外的工具，这就是 `cargo clippy` 发挥作用的地方。Clippy 检查的内容包括：
* 性能陷阱。
* 风格问题。
* 冗余代码。
* 潜在缺陷。
* 非惯用 Rust。

## 2.2 始终运行 `cargo clippy`

将以下内容添加到你的日常工作流中：

```shell
$ cargo clippy --all-targets --all-features --locked -- -D warnings
```

* `--all-targets`：检查库、测试、基准测试和示例。
* `--all-features`：检查所有启用功能下的代码，自动解决功能冲突。
* `--locked`：要求 `Cargo.lock` 是最新的，可通过 `$ cargo update` 解决。
* `-D warnings`：将警告视为错误

可能添加的额外元素：

* `-- -W clippy::pedantic`：较为严格或有偶尔误报的 lint。
* `-- -W clippy::nursery`：可选择添加以检查仍在开发中的新 lint。
* ❗ 将此添加到你的 Makefile、Justfile、xtask 或 CI 流水线中。

> ApolloGraphQL 的示例
>
> 在 `Router` 项目中有一个配置了 linting 的 `xtask`，可以通过 `cargo xtask lint` 执行。

## 2.3 需要关注的重要 Clippy Lint

| Lint 名称 | 原因 | 链接 |
| --------- | ----| -----|
| `redundant_clone` | 检测不必要的 `clone`，有性能影响 | [链接 (nursery + perf)](https://rust-lang.github.io/rust-clippy/master/#redundant_clone) |
| `needless_borrow` 组 | 移除冗余的 `&` 借用 | [链接 (style)](https://rust-lang.github.io/rust-clippy/master/#needless_borrow) |
| `map_unwrap_or` / `map_or` | 简化嵌套的 `Option/Result` 处理 | [`map_unwrap_or`](https://rust-lang.github.io/rust-clippy/master/#map_unwrap_or) [`unnecessary_map_or`](https://rust-lang.github.io/rust-clippy/master/#unnecessary_map_or) [`unnecessary_result_map_or_else`](https://rust-lang.github.io/rust-clippy/master/#unnecessary_result_map_or_else) |
| `manual_ok_or` | 建议使用 `.ok_or_else` 替代 `match` | [链接 (style)](https://rust-lang.github.io/rust-clippy/master/#manual_ok_or) |
| `large_enum_variant` | 警告 enum 有非常大的变体，对内存不利。建议 `Box` 化 | [链接 (perf)](https://rust-lang.github.io/rust-clippy/master/#large_enum_variant) |
| `unnecessary_wraps` | 如果你的函数总是返回 `Some` 或 `Ok`，则不需要 `Option`/`Result` | [链接 (pedantic)](https://rust-lang.github.io/rust-clippy/master/#unnecessary_wraps) |
| `clone_on_copy` | 捕获在 `Copy` 类型（如 `u32` 和 `bool`）上的意外 `.clone()` | [链接 (complexity)](https://rust-lang.github.io/rust-clippy/master/#clone_on_copy) |
| `needless_collect` | 防止在不需要分配时收集和分配迭代器 | [链接 (nursery)](https://rust-lang.github.io/rust-clippy/master/#needless_collect) |

## 2.4 修复警告，不要静音！

**永远不要**使用 `#[allow(clippy::lint_something)]`，除非：

* 你**真正理解**为什么会出现警告，并且有理由认为这样做更好。
* 你**记录**了为什么被忽略。
* ❗ 不要使用 `allow`，而使用 `expect`，如果 lint 不再适用，它会给出警告：`#[expect(clippy::lint_something)]`。

### 示例：

```rust
// 优先选择更快的匹配而非大小效率
#[expect(clippy::large_enum_variant)]
enum Message {
    Code(u8),
    Content([u8; 1024]),
}
```

> 修复方案是：
> 
> ```rust
> // 优先选择更快的匹配而非大小效率
> #[expect(clippy::large_enum_variant)]
> enum Message {
>     Code(u8),
>     Content(Box<[u8; 1024]>),
> }
> ```

### 处理误报

有时即使你的代码正确，Clippy 也会报错，在这些情况下有两种解决方案：
1. 尝试重构代码，以改进警告。
2. **本地**使用 `#[expect(clippy::lint_name)]` 覆盖 lint，并附上原因注释。
3. 避免全局覆盖，除非是核心 crate 问题，一个很好的例子是 Bevy Engine，它有一组默认应该允许的 lint。

## 2.5 配置工作空间/包 lint

在你的 `Cargo.toml` 文件中，可以确定哪些 lint 以及它们的优先级。如果有两个或更多冲突的 lint，将选择优先级较高的。包的示例配置：

```toml
[lints.rust]
future-incompatible = "warn"
nonstandard_style = "deny"

[lints.clippy]
all = { level = "deny", priority = 10 }
redundant_clone = { level = "deny", priority = 9 }
manual_while_let_some = { level = "deny", priority = 4 }
pedantic = { level = "warn", priority = 3 }
```

对于工作空间：

```toml
[workspace.lints.rust]
future-incompatible = "warn"
nonstandard_style = "deny"

[workspace.lints.clippy]
all = { level = "deny", priority = 10 }
redundant_clone = { level = "deny", priority = 9 }
manual_while_let_some = { level = "deny", priority = 4 }
pedantic = { level = "warn", priority = 3 }
```
