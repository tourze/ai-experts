# 第 1 章 - 编码风格与惯用法

## 1.1 优先借用而非克隆

Rust 的所有权系统鼓励**借用**（`&T`）而不是**克隆**（`T.clone()`）。
> ❗ 性能建议

### ✅ 何时使用 `Clone`：

* 你需要修改对象同时保留原始对象（不可变快照）。
* 当你使用 `Arc` 或 `Rc` 指针时。
* 当数据在线程间共享时，通常是 `Arc`。
* 避免对非性能关键代码进行大规模重构。
* 当缓存结果时（下面的简单示例）：
```rust
fn get_config(&self) -> Config {
    self.cached_config.clone()
}
```
* 当底层 API 期望所有权数据时。

### 🚨 要避免的 `Clone` 陷阱：

* 在循环内自动克隆 `.map(|x| x.clone)`，优先在迭代器末尾调用 `.cloned()` 或 `.copied()`。
* 克隆大型数据结构如 `Vec<T>` 或 `HashMap<K, V>`。
* 因为 API 设计不佳而克隆，而不是调整生命周期。
* 优先使用 `&[T]` 而不是 `Vec<T>` 或 `&Vec<T>`。
* 优先使用 `&str` 或 `&String` 而不是 `String`。
* 优先使用 `&T` 而不是 `T`。
* 克隆引用参数，如果你需要所有权，应在参数中显式声明以供调用者了解。示例：
```rust
fn take_a_borrow(thing: &Thing) {
    let thing_cloned = thing.clone(); // 调用者本应该传递所有权
}
```

### ✅ 优先借用：
```rust
fn process(name: &str) {
    println!("Hello {name}");
}

let user = String::from("foo");
process(&user);
```

### ❌ 避免冗余克隆：
```rust
fn process_string(name: String) {
    println!("Hello {name}");
}

let user = String::from("foo");
process(user.clone()); // 不必要的克隆
```

## 1.2 何时传值？（Copy trait）

并非所有类型都应该通过引用（`&T`）传递。如果一个类型**很小**且**复制成本很低**，通常最好**传值**。Rust 通过 `Copy` trait 使其显式化。

### ✅ 何时传值（使用 `Copy`）：
* 类型**实现了** `Copy`（`u32`、`bool`、`f32`、小型 struct）。
* 移动值的成本可以忽略不计。

```rust
fn increment(x: u32) -> u32 {
    x + 1
}

let num = 1;
let new_num = increment(num); // 此后 `num` 仍然可用
```

### ❓ 哪些 struct 应该是 `Copy`？
* 考虑在自己的类型上声明 `Copy` 的情况：
* 所有字段本身都是 `Copy`。
* struct **很小**，最多 2（也许 3）个字或 24 字节（每个字 64 位/8 字节）。
* struct **表示"纯数据对象"**，不涉及所有权的资源（无堆分配。例如：`Vec` 和 `String`）。

❗**Rust 数组是栈分配的。** 这意味着如果其底层类型是 `Copy`，它们可以被复制，但这会在程序栈上分配，很容易导致栈溢出。更多信息见[第 3 章 - 栈 vs 堆](./chapter_03.md#33-栈-vs-堆-大小要明智)

供参考，每个基本类型的大小（字节）：

#### 整数：

| 类型 | 大小 |
|------------- |---------- |
| i8 u8 | 1 字节 |
| i16 u16 | 2 字节 |
| i32 u32 | 4 字节 |
| i64 u64 | 8 字节 |
| isize usize | 架构相关 |
| i128 u128 | 16 字节 |

#### 浮点：

| 类型 | 大小 |
|---------- |---------- |
| f32 | 4 字节 |
| f64 | 8 字节 |

#### 其他：

| 类型 | 大小 |
|---------- |---------- |
| bool | 1 字节 |
| char | 4 字节 |

### ✅ 适合派生 `Copy` 的 struct：
```rust
#[derive(Debug, Copy, Clone)]
struct Point {
    x: f32,
    y: f32,
    z: f32
}
```

### ❌ 不适合派生 `Copy` 的 struct：
```rust
#[derive(Debug, Clone)]
struct BadIdea {
    age: i32,
    name: String, // String 不是 `Copy`
}
```

### ❓ 哪些 Enum 应该是 `Copy`？
* 如果你的 enum 像标签和原子一样使用。
* enum 的所有负载都是 `Copy`。
* **❗Enum 的大小取决于其最大元素。**

### ✅ 适合派生 `Copy` 的 Enum：
```rust
#[derive(Debug, Copy, Clone)]
enum Direction {
    North,
    South,
    East,
    West,
}
```

## 1.3 处理 `Option<T>` 和 `Result<T, E>`
Rust 1.65 引入了更安全的方式来解包 Option 和 Result 类型，使用 `let Some(x) = … else { … }` 或 `let Ok(x) = … else { … }` 模式。当你有一个默认的 `return` 值、`continue` 或 `break` 的默认 else 情况时非常有用。它允许在缺失情况是**预期且正常的**、而非异常时提前返回。

### ✅ 每种模式匹配的使用场景：

* 当你想要对内部类型 `T` 和 `E` 进行模式匹配时使用 `match`：
```rust
match self {
    Ok(Direction::South) => { … },
    Ok(Direction::North) => { … },
    Ok(Direction::East) => { … },
    Ok(Direction::West) => { … },
    Err(E::One) => { … },
    Err(E::Two) => { … },
}

match self {
    Some(3|5) => { … }
    Some(x) if x > 10 => { … }
    Some(x) => { … }
    None => { … }
}
```

* 当你的类型被转换为更复杂的内容时（如 `Result<T, E>` 变为 `Result<Option<T>, E>`）使用 `match`：
```rust
match self {
    Ok(t) => Ok(Some(t)),
    Err(E::Empty) => Ok(None),
    Err(err) => Err(err),
}
```

* 当发散代码不需要知道失败的模式匹配或不需要额外计算时，使用 `let PATTERN = EXPRESSION else { DIVERGING_CODE; }`：
```rust
let Some(&Direction::North) = self.direction.as_ref() else {
    return Err(DirectionNotAvailable(self.direction));
}
```

* 当你想在模式匹配中 `break` 或 `continue` 时，使用 `let PATTERN = EXPRESSION else { DIVERGING_CODE; }`：
```rust
for x in self {
    let Some(x) = x else {
        continue;
    }
}
```

* 当 `DIVERGING_CODE` 需要额外计算时，使用 `if let PATTERN = EXPRESSION else { DIVERGING_CODE; }`：
```rust
if let Some(x) = self.next() {
    // 计算
} else {
    // 当 `None/Err` 或不匹配时的计算
}
```

❗**如果你不关心 `Err` 情况的值，请使用 `?` 将 `Err` 传播给调用者。**

### ❌ 不恰当的 Option/Result 模式匹配：

* Result 和 Option 之间的转换（优先使用 `.ok()`、`.ok_or()` 和 `ok_or_else()`）：
```rust
match self {
    Ok(t) => Some(t),
    Err(_) => None
}
```

* 当发散代码是默认值或预计算值时使用 `if let PATTERN = EXPRESSION else { DIVERGING_CODE; }`（优先使用 `let PATTERN = EXPRESSION else { DIVERGING_CODE; }`）：
```rust
if let Some(values) = self.next() {
    // 计算
    (Some(..), values)
} else {
    (None, Vec::new())
}
```

* 在测试之外使用 `unwrap` 或 `expect`：
```rust
let port = config.port.unwrap();
```

## 1.4 防止过早分配

当处理诸如 `or`、`map_or`、`unwrap_or`、`ok_or` 等函数时，考虑它们有需要内存分配的特殊情况，比如创建新字符串、创建集合甚至调用管理状态的函数，因此它们可以使用对应的 `_else` 版本替代：

### ✅ 好的情况

```rust
let x = None;
assert_eq!(x.ok_or(ParseError::ValueAbsent), Err(ParseError::ValueAbsent));

let x = None;
assert_eq!(x.ok_or_else(|| ParseError::ValueAbsent(format!("this is a value {x}"))), Err(ParseError::ValueAbsent));

let x: Result<_, &str> = Ok("foo");
assert_eq!(x.map_or(42, |v| v.len()), 3);

let x : Result<_, String> = Ok("foo");
assert_eq!(x.map_or_else(|e|format!("Error: {e}"), |v| v.len()), 3);

let x = "1,2,3,4";
assert_eq!(x.parse_to_option_vec.unwrap_or_else(Vec::new), Ok(vec![1, 2, 3, 4]));
```

### ❌ 不好的情况

```rust
let x : Result<_, String> = Ok("foo");
assert_eq!(x.map_or(format!("Error with uninformed content"), |v| v.len()), 3);

let x = "1,2,3,4";
assert_eq!(x.parse_to_option_vec.unwrap_or(Vec::new()), Ok(vec![1, 2, 3, 4])); // 可以用 `.unwrap_or_default` 替代

let x = None;
assert_eq!(x.ok_or(ParseError::ValueAbsent(format!("this is a value {x}"))), Err(ParseError::ValueAbsent));
```

### 映射 Err

当处理 Result::Err 时，有时需要记录并将 Err 转换为更抽象或更详细的错误，这可以通过 `inspect_err` 和 `map_err` 完成：

```rust
let x = Err(ParseError::InvalidContent(...));

x
    .inspect_err(|err| tracing::error!("function_name: {err}"))
    .map_err(|err| GeneralError::from(("function_name", err)))?;
```

## 1.5 迭代器：`.iter` vs `for`

首先我们需要了解每种方式的基本循环。考虑以下问题，我们需要对 0 到 10 之间的所有偶数加 1 后求和：

* `for`：
```rust
let mut sum = 0;
for x in 0..=10 {
    if x % 2 == 0 {
        sum += x + 1;
    }
}
```

* `iter`：
```rust
let sum: i32 = (0..=10)
    .filter(|x| x % 2 == 0)
    .map(|x| x + 1)
    .sum();
```

> 两种版本实现相同功能，都是正确且符合惯用法的，但各自在不同场景下表现更佳。

### 何时优先使用 `for` 循环
* 当你需要**提前退出**（`break`、`continue`、`return`）时。
* **简单迭代**带副作用（例如日志、IO）
    * 日志可以在 `Iterator` 中使用 `inspect` 和 `inspect_err` 函数正确完成。
* 当可读性比简洁性或链式调用更重要时。

#### 示例：
```rust
for value in &mut value {
    if *value == 0 {
        break;
    }
    *value += fancy_equation();
}
```

### 何时优先使用 `iterator` 循环（`.iter()` 和 `.into_iter()`）
* 当你**转换集合**或 `Option/Result` 时。
* 你可以优雅地**组合多个步骤**。
* 不需要提前退出。
* 你需要通过 `.enumerate` 支持索引值。
```rust
let values: Vec<_> = vec.into_iter()
    .enumerate()
    .filter(|(_index, value)| value % 2 == 0)
    .map(|(index, value)| value % index)
    .collect()
```
* 你需要使用集合的函数如 `.windows` 或 `chunks`。
* 你需要合并来自多个源的数据且不想分配多个集合。
* 迭代器可以与 `for` 循环结合：
```rust
for value in vec.iter().enumerate()
    .filter(|(index, value)| value % index == 0) {
    // ...
}
```

> #### ❗记住：迭代器是惰性的
>
> * `.iter`、`.map`、`.filter` 在你调用其消费者之前不会做任何事情，例如 `.collect`、`.sum`、`.for_each`。
> * **惰性求值**意味着迭代器链在编译时被融合成一个循环。

### 🚨 要避免的反模式

* 不要链式调用不格式化。优先每个链式函数单独一行，使用正确的缩进（`rustfmt` 应该处理这个问题）。
* 不要链式调用使代码不可读。
* 避免不必要地收集/分配一个集合（例如 vector）只是为了在稍后更大的操作或另一次迭代中丢弃它。
* 优先使用 `iter` 而不是 `into_iter`，除非你不需要集合的所有权。
* 对于内部类型实现 `Copy` 的集合（如 `Vec<i32>`），优先使用 `iter` 而不是 `into_iter`。
* 对于求和，优先使用 `.sum` 而不是 `.fold`。`.sum` 专门用于求和值，编译器知道可以在该方面进行优化，而 fold 有一个黑盒闭包需要在每一步应用。如果你需要加上一个初始值，只需在表达式中添加 `let my_sum = [1, 2, 3].sum() + 3`。

## 1.6 注释：上下文而非杂乱

> "上下文解释为什么，而非什么或如何"

编写良好的 Rust 代码，配合表达力强的类型和良好的命名，通常不言自明。许多高质量代码库依靠**很少或没有注释**也能良好运作。这是件好事。

尽管如此，**有些时候仅靠代码是不够的**——当存在性能怪癖、外部约束或非明显的权衡时，需要给读者一个提示。在这些情况下，一个简洁的注释可以节省数小时的困惑或搜索 git 历史的时间。

### ✅ 好的注释

* 安全问题：
```rust
// SAFETY: 我们已经检查过指针有效且非空。@Function xyz。
unsafe { std::ptr::copy_nonoverlapping(src, dst, len); }
```

* 性能怪癖：
```rust
// 此算法是快速平方根近似
const THREE_HALVES: f32 = 1.5;
fn q_rsqrt(number: f32 ) -> f32 {
    let mut i: i32 = number.to_bits() as i32;
    i = 0x5F375A86_i32.wrapping_sub(i >> 1);
    let y = f32::from_bits(i as u32);
    y * (THREE_HALVES - (number * 0.5 * y * y))
}
```

* 清晰的代码胜过注释。然而，当原因不明显时，直接说明——或链接到出处：
```rust
// PERF: 为每个子图生成根存储导致 MacOS 上 TLS 启动延迟高
// 此方案作为缓存替代。参见：[ADR-123](link/to/adr-123)
let subgraph_tls_root_store: RootCertStore = configuration
    .tls
    .subgraph
    .all
    .create_certificate_store()
    .transpose()?
    .unwrap_or_else(crate::services::http::HttpClientService::native_roots_store);
```

### ❌ 不好的注释

* 长篇文字解释：长注释和多行注释
```rust
// Lorem Ipsum is simply dummy text of the printing and typesetting industry. 
// Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, 
// when an unknown printer took a galley
fn do_something_odd() {
    …
}
```
> 如果是在描述函数，优先使用 `/// doc` 注释。

* 可以更好地表示为函数或显而易见的内容
```rust
fn computation() {
    // 将 i 加 1
    i += 1;
}
```

### ✅ 拆分长函数而非加长注释

如果你发现自己在函数中写了很长的注释来解释"什么"、"如何"或"每个步骤"，可能是时候拆分了。因此建议重构。这不仅有利于可读性，也有利于可测试性：

#### ❌ 与其：
```rust
fn process_request(request: T) {
    // 我们需要先验证请求，因为边界情况 x, y, z
    // 因为 payload 只有在有效时才能被解码
    // 然后我们可以在 payload 上执行授权
    // 最后，使用经过授权的 payload 分派给处理器
}
```

#### ✅ 优先：
```rust
fn process_request(request: T) -> Result<(), Error> {
    validate_request_headers(&request)?;
    let payload = decode_payload(&request);
    authorize(&payload)?;
    dispatch_to_handler(payload)
}

#[cfg(test)]
mod tests {
    #[test]
    fn validate_request_happy_path() { ... }

    #[test]
    fn validate_request_fails_on_x() { ... }

    #[test]
    fn validate_request_fails_on_y() { ... }

    #[test]
    fn decode_validated_request() { ... }

    #[test]
    fn authorize_payload_xyz() { ... }
}
```

让**结构**和**命名**取代注释，并用**测试作为活文档**增强文档质量。

### 📝 TODO 不是注释——正确跟踪它们

避免在代码中留下挥之不去的 `// TODO: Lorem Ipsum` 注释。相反：
* 将它们转化为 Jira 或 GitHub Issues。
* 如果需要，在代码中引用该 issue，在 issue 中引用代码，以避免将来的混淆。

```rust
// 参见 issue #123：支持 hyper 2.0
```

这有助于保持代码整洁，确保任务不被遗忘。

### 注释作为活文档

将注释称为"活文档"时有几个陷阱：
* 代码在演进。
* 上下文在变化。
* 注释会过时。
* 大量长注释让人不想阅读。
* 团队变得不敢删除无关的注释。

如果你找到一个注释，**不要盲目相信它**。在上下文中阅读它。如果它是错误或过时的，修复或删除它。误导性的注释比没有注释更糟糕。

> 注释应该让你在意——它们需要重新验证，就像过时的测试一样。

当需要更深入的论证时，优先：
* **链接到设计文档或 ADR**，业务逻辑适合放在设计文档中，而性能权衡适合放在 ADR 中。
* 将运行时示例和用法文档移入 Rust 文档中，`/// doc comment`，它们可以在那里被测试并通过 `cargo doc` 等工具保持最新。

> 文档注释和文档测试，`///` 和 `//!` 参见[第 8 章 - 注释 vs 文档](./chapter_08.md)

## 1.7 导入声明

不同的语言有不同的 import 排序方式，在 Rust 生态系统中，[标准方式](https://github.com/rust-lang/rustfmt/issues/4107)是：

- `std`（`core`、`alloc` 也属此类）。
- 外部 crate（在你的 Cargo.toml `[dependencies]` 中的内容）。
- 工作空间 crate（工作空间成员 crate）。
- 本模块 `super::`。
- 本模块 `crate::`。

```rust
// std
use std::sync::Arc;

// 外部 crate
use chrono::Utc;
use juniper::{FieldError, FieldResult};
use uuid::Uuid;

// crate 代码位于工作空间中
use broker::database::PooledConnection;

// super:: / crate::
use super::schema::{Context, Payload};
use super::update::convert_publish_payload;
use crate::models::Event;
```

一些企业方案选择在 `std` 之后包含其核心包，因此所有以企业名称开头的外部包位于其他包之前：

```rust
// std
use std::sync::Arc;

// 企业外部 crate
use enterprise_crate_name::some_module::SomeThing;

// 外部 crate
use chrono::Utc;
use juniper::{FieldError, FieldResult};
use uuid::Uuid;

// crate 代码位于工作空间中
use broker::database::PooledConnection;

// super:: / crate::
use super::schema::{Context, Payload};
use super::update::convert_publish_payload;
use crate::models::Event;
```

避免手动控制的一种方法是使用 `rustfmt.toml` 中的以下参数：

```toml
reorder_imports = true
imports_granularity = "Crate"
group_imports = "StdExternalCrate"
```

> 从 Rust 版本 1.88 开始，需要使用 nightly 版本的 rustfmt 来正确重新排序代码：`cargo +nightly fmt`。
