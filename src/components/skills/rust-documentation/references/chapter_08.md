# 第 8 章 - 注释 vs 文档

> 清晰的代码胜过清晰的注释。然而，当原因不明显时，直接说明——或链接到可以阅读更多上下文的地方。

## 8.1 注释 vs 文档：了解区别

| 目的 | 使用 `// comment` | 使用 `/// doc` 或 `//! crate doc` |
|-------------- |------------------------------------------- |---------------------------------------------------------------- |
| 描述原因 | ✅ 是 - 解释棘手的推理 | ❌ 不适合文档 |
| 描述 API | ❌ 无用 | ✅ 是 - 公共接口、用法、细节、错误、panic |
| 可维护性 | 🚨 经常过时且难以推理 | ✅ 与代码绑定，出现在生成的文档中，可以运行测试用例 |
| 可见性 | 仅本地开发 | 导出给用户和工具，如 `cargo doc` |

## 8.2 何时使用注释

当某些内容无法在代码中清晰表达时，使用 `//` 注释（双斜线），例如：
* **安全保障**，其中一些可以通过代码条件更好地表达。
* 变通方案或**优化**。
* 遗留或**平台特定**行为。其中一些可以通过 `#[cfg(..)]` 表达。
* 链接到**设计文档**或 **ADR**。
* 不明显但需要明确的假设或**陷阱**。

> 给你的注释命名！例如，关于安全保障的注释应以 `// SAFETY: ...` 开头。

### ✅ 好的注释：
```rust
// SAFETY: 调用者保证 `ptr` 非空且对齐
unsafe { std::ptr::copy_nonoverlapping(src, dst, len); }
```

### ✅ 设计上下文注释：
```rust
// CONTEXT: 在子图间复用根证书存储以避免重复的 OS 调用：
// [ADR-12](link/to/adr-12): MacOS 上的 TLS 性能
```

## 8.3 注释何时会妨碍

避免以下注释：
* 重述显而易见的内容（`// 将 i 加 1 用于下一次循环`）。
* 随时间推移会过时。
* 没有操作的 `TODO`（链接到某个版本化的 issue）。
* 可以通过更好的命名或更小的函数替代。

### ❌ 不好的注释：
```rust
fn compute(counter: &mut usize) {
    // 加 1
    *counter += 1;
}
```

### ❌ 太长或过时
```rust
// 最初于 2028 年为某个已不存在的平台编写
```

## 8.4 不要编写活文档（活注释）

将注释作为"活文档"是一个**危险的迷思**，因为注释**不是免费的**：
* 它们会**腐化**——没有人编译注释。
* 它们会**误导**——读者通常不加批判地假设它们是真实的，例如"其他开发者比我更了解这个代码"。
* 它们会**过时**——除非与代码一起维护，否则它们会变得不相关。
* 它们是**噪音**——注释可能用多个不必要的行杂乱你的代码。

如果某些内容值得在 PR 之外存在，请将其放在：
* **ADR**（架构设计记录）中。
* 设计文档中。
* **在代码中记录**，通过使用类型、文档注释、示例、将代码块重命名为清晰的函数。
* 添加测试来覆盖和解释变更。

> ### 🚨 如果你找到一个注释，**在上下文中阅读它**。它还有意义吗？如果没有，删除或更新它，或寻求帮助。注释应该让你在意。

## 8.5 用代码替换注释

与其长篇注释块，不如将逻辑拆分为命名的辅助函数：

#### ❌ 注释的代码块：
```rust
fn save_user(&self) -> Result<(), MyError> {
    // 检查用户是否已认证
    if self.is_authenticated() {
        // 序列化用户数据
        let data = serde_json::to_string(self)?;
        // 写入文件
        std::fs::write(self.path(), data)?;
    }
}
```
**✅ 提取以提高清晰度**：

```rust
fn save_auth_user(&self) -> Result<PathBuf, MyError> {
    if self.is_authenticated() {
        let path = self.path();
        let serialized_user = serde_json::to_string(self)?;
        std::fs::write(path, serialized_user)?;
        Ok(path)
    } else {
        Err(MyError::UserNotAuthenticated)
    }
}
```

## 8.6 `TODO` 应该变成 issue

不要在代码库中散布没有负责人的 `// TODO:`。相反：
1. 提交 GitHub Issue 或 Jira 工单。（公共仓库优先使用 GitHub issues）。
2. 在代码中引用该 issue：

```rust
// TODO(issue #42): 在缺陷修复后移除变通方案
```

这使得 `TODO` 可追踪、可操作，并对所有人可见。

## 8.7 何时使用文档注释

使用 `///` 文档注释来记录：
* 所有**公共函数、struct、trait、enum**。
* 它们的用途、用法和行为。
* 开发者需要了解如何正确使用的任何内容。
* 与 `Errors` 和 `Panics` 相关的上下文。
* 大量的示例。

### ✅ 好的文档注释：

```rust
/// 从磁盘加载 [`User`] 配置文件
/// 
/// # Error
/// - 如果文件缺失，返回 [`MyError`] 的 [`MyError::FileNotFound`]。
/// - 如果内容不是有效的 Json，返回 [`MyError`] 的 [`MyError::InvalidJson`]。
fn load_user(path: &Path) -> Result<User, MyError> {...}
```

**文档注释还可以包含示例、链接甚至测试：**

```rust
/// 返回任何数的整数部分的平方。
/// 平方限制在 `u128` 内。
/// 
/// # Examples
/// 
/// ```rust
/// assert_eq!(square(4.3), 16)
/// ```
fn square(x: impl ToInt) -> u128 { ... }
```

## 8.8 Rust 文档：如何、何时与为何

Rust 通过 rustdoc 提供**一流的文档工具**，使文档化代码成为编写惯用且可维护 Rust 的关键部分。有一些与文档相关的 lint 可以帮助文档化，例如：

| Lint | 描述 |
|-------------- |------------------------------------------- |
| [missing_docs](https://doc.rust-lang.org/rustdoc/lints.html#missing_docs) | 警告公共函数、struct、const、enum 缺少文档 |
| [broken_intra_doc_links](https://doc.rust-lang.org/rustdoc/lints.html#broken_intra_doc_links) | 检测内部文档链接是否已损坏。当内容被重命名时特别有用。 |
| [empty_docs](https://rust-lang.github.io/rust-clippy/master/#empty_docs) | 不允许空文档——防止绕过 `missing_docs` |
| [missing_panics_doc](https://rust-lang.github.io/rust-clippy/master/#missing_panics_doc) | 如果函数可能 panic，警告文档应有 `# Panics` 部分 |
| [missing_errors_doc](https://rust-lang.github.io/rust-clippy/master/#missing_errors_doc) | 如果函数返回一个 `Result`，警告文档应有 `# Errors` 部分说明 `Err` 条件 |
| [missing_safety_doc](https://rust-lang.github.io/rust-clippy/master/#missing_safety_doc) | 如果面向公共的函数包含可见的 unsafe 块，警告文档应有 `# Safety` 部分 |

### `///` 和 `//!` 的区别

| 样式 | 用于 | 范围 | 示例 |
|---------- |------------------------------ |------------------------------------------- |---------------------------------------------------------------- |
| `///` | 行文档注释 | 公共项，如 struct、fn、enum、const | 文档化、给出上下文和用法给 `fn`、`struct`、`enum` 等 |
| `//!` | 模块级文档注释 | 模块或整个 crate | 解释 crate/模块用途，含常见用例和快速入门 |

### `///` 项级别文档

对函数、struct、trait、enum、const 等使用 `///`：

```rust
/// 将两个数相加。
///
/// # Examples
///
/// ```
/// let result = my_crate::add(2, 3);
/// assert_eq!(result, 5);
/// ```
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}
```
* ✅ 编写清晰描述性的**它做什么**和**如何使用**。
* ✅ 使用 `# Examples` 部分更好地说明**如何使用**。
* ✅ 优先编写可以通过 `cargo test` 测试的示例，即使你需要用 `#` 开头来隐藏其输出：
```rust
/// ```
/// let result = my_crate::add(2, 3);
/// # assert_eq!(result, 5);
/// ```
```
* ✅ 在相关时使用 `# Panics`、`# Errors` 和 `# Safety` 部分。
* 为类型添加相关上下文。

### `//!` 模块/Crate 级别文档

当你想记录**模块或 crate 的用途**时使用 `//!`。它放置在 `lib.rs` 或 `mod.rs` 文件的顶部，例如 `engine/mod.rs`：
```rust
//! 此模块实现了一个自定义的国际象棋引擎。
//! 
//! 它处理棋盘状态、走法生成和将军检测。
//! 
//! # Example
//! ```
//! let board = chess::engine::Board::default();
//! assert!(board.is_valid());
//! ```
```

## 8.9 文档覆盖检查清单

📦 Crate 级别 (lib.rs)
- [ ] 顶部的 `//!` 文档说明**该 crate 的功能**和**它解决的问题**。
- [ ] 包含 crate 级别的 `# Examples` 或指向模块的指引。

📁 模块 (mod.rs 或内联)
- [ ] `//!` 文档说明**此模块的用途**、其**导出项**和**不变条件**。
- [ ] 避免在重新导出的项上重复文档注释，除非需要澄清。

🧱 Struct、Enum、Trait
- `///` 文档说明：
    - [ ] 此类型扮演的角色。
    - [ ] 不变条件或预期。
    - [ ] 构造或用法示例。
- [ ] 考虑使用 [`#[non_exhaustive]`](https://doc.rust-lang.org/reference/attributes/type_system.html#the-non_exhaustive-attribute)，如果外部用户可能对其进行 match。

🔧 函数和方法
- `///` 文档覆盖：
    - [ ] 功能。
    - [ ] 参数及其含义。
    - [ ] 返回值行为。
    - [ ] 边界情况（`# Panics`、`# Errors`）。
    - [ ] 用法示例，`# Examples`。

📑 Trait
- [ ] 说明 trait 的**用途**（标记？动态分发？）。
- [ ] 每个方法的文档——包括**何时/为什么**实现它。
- [ ] 清晰记录默认实现的方法以及何时覆盖。

📦 公共常量
- [ ] 文档说明它们配置什么以及何时使用。

### 📌 最佳实践
* ✅ 慷慨使用示例——它们兼作测试用例。
* ✅ 优先清晰而非正式——文档是为人类而非机器编写的。
* ✅ 优先使用文档注释解释用法，实现细节留给代码注释（如果需要）。
* ✅ 经常使用 `cargo doc --open` 检查输出。
* ✅ 如果你想要强制完整的文档覆盖，在顶层模块中添加 `#![deny(missing_docs)]` 和其他相关文档 lint。
