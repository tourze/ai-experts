# 第 3 章 - 性能思维

性能工作的**黄金法则**：

> 不要猜测，要测量。

Rust 代码通常已经相当快——在没有证据的情况下不要"优化"。只有在找到瓶颈后才进行优化。

### 良好的第一步
* 在构建时使用 `--release` 标志（可能听起来有些愚蠢，但经常听到人们抱怨他们的 Rust 代码比他们的 X 语言代码慢，而 99% 的情况是因为他们没有使用 `--release` 标志）。
* `$ cargo clippy -- -D clippy::perf` 为你提供关于性能最佳实践的重要提示。
* [`cargo bench`](https://doc.rust-lang.org/cargo/commands/cargo-bench.html) 是一个 cargo 工具，用于创建微基准测试和测试不同的代码解决方案。编写一个测试场景，将你的解决方案与原始代码进行基准测试，如果你的改进超过 5%，可能是一个不错的性能改进。
* [`cargo flamegraph`](https://github.com/flamegraph-rs/flamegraph) 一个强大的 Rust 代码分析器。对于 MacOS，[samply](https://github.com/mstange/samply) 可能是更好的 DX 选择。

> #### 进一步阅读基准测试：
> - [How to build a Custom Benchmarking Harness in Rust](https://bencher.dev/learn/benchmarking/rust/custom-harness/)

## 3.1 Flamegraph（火焰图）

Flamegraph 帮助你可视化 CPU 在每个任务上花费了多少时间。

```shell
# 安装 flamegraph
cargo install flamegraph

# cargo 支持通过 cargo-flamegraph 二进制文件提供！
# 默认对 cargo run --release 进行分析
cargo flamegraph

# 默认使用 `--release` profile，
# 但你可以覆盖：
cargo flamegraph --dev

# 如果你想分析特定的二进制文件：
cargo flamegraph --bin=stress2

# 分析单元测试。
# 注意如果 `--unit-test` 是最后一个标志，则需要一个分隔的 `--`。
cargo flamegraph --unit-test -- test::in::package::with::single::crate
cargo flamegraph --unit-test crate_name -- test::in::package::with::multiple:crate

# 分析集成测试。
cargo flamegraph --test test_name

# 运行 criterion 基准测试
# 注意最后一个 --bench 对于 `criterion 0.3` 在基准测试模式下运行是必需的，而不是测试模式。
cargo flamegraph --bench some_benchmark --features some_features -- --bench

# 运行工作空间示例
cargo flamegraph --example some_example --features some_features
```

> ❗ 始终在启用 `--release` 的情况下运行你的分析，`--dev` 标志不切实际，因为它没有启用优化。

结果看起来像一个火焰图，其中：

* `y 轴`显示**栈深度数**。在查看火焰图时，程序的主函数将更靠近底部，被调用的函数堆叠在上面，它们调用的函数再堆叠在上面。

* `每个框的宽度`显示该函数**在 CPU 上或作为调用栈一部分的总时间**。如果一个函数的框比其他函数宽，这意味着它每次执行消耗的 CPU 比其它函数多，或者它被调用的次数比其它函数多。

> ❗**每个框的颜色**没有特殊意义，**是随机选择的**。

### 🚨 记住
* 厚栈：CPU 使用率高
* 薄栈：强度低（廉价）

## 3.2 避免冗余克隆

> 克隆是廉价的……**直到它不是**

在第 1 章的[优先借用而非克隆](../../rust-ownership-idioms/references/chapter_01.md#11-优先借用而非克隆)和第 2 章的[需要关注的重要 Clippy Lint](../../rust-ownership-idioms/references/chapter_02.md#23-需要关注的重要-clippy-lint)中，我们提到了克隆的影响和相关的 clippy lint [`redundant_clone`](https://rust-lang.github.io/rust-clippy/master/#redundant_clone)，因此在本节中，我们将探讨一下"何时传递所有权"。

* 🚨 如果你真的需要克隆，留到最后一刻。

### 何时传递所有权？

* 只有在真正需要一个新的拥有副本时才使用 `.clone()`。几个示例：
    * Crate API 设计需要所有权数据。
    * 已重载 `std::ops` 但仍需要旧数据的所有权：
    ```rust
    use std::ops::Add;

    #[derive(Debug, Copy, Clone, PartialEq)]
    struct Point {
        x: i32,
        y: i32,
    }

    impl Add for Point {
        type Output = Self;

        fn add(self, other: Self) -> Self {
            Self {
                x: self.x + other.x,
                y: self.y + other.y,
            }
        }
    }

    assert_eq!(Point { x: 1, y: 0 } + Point { x: 2, y: 3 },
               Point { x: 3, y: 3 });
    ```
    * 需要进行比较快照或由于 API 需要数据的多个拥有实例。
    ```rust
    fn snapshot(a: &MyValue, b:&MyValue) -> MyValueDiff {
        a - b
    }

    impl Sub for MyValue {
        type Output = MyValueDiff;

        fn sub(self, other: Self) -> MyValue {
            ...
        }
    }

    fn main() {
        let mut a = MyValue::default();
        let b = a.clone();

        a.magical_update();
        println!("{:?}", snapshot(&a, &b));
    }
    ```
* 你拥有引用计数指针（`Arc, Rc`）。
* 你拥有小型的 struct，它们太大而不能 `Copy`，但成本与 `std::collections` 相当。一个例子是 HTTP 客户端，如 `hyper_util::client::legacy::Client`，克隆它允许你共享连接池。
* 你有一个链式 struct 修改器，需要拥有的可变性，一些**构建器**需要拥有的可变性，但大多数自定义构建器可以通过 `pub fn with_xyz(&mut self, value: Xyz) -> &mut Self` 完成。
```rust
// 内联 `HashMap` 插入扩展

fn insert_owned(mut self, key: K, value: V) -> Self {
    self.insert(key, value);
    self
}
```
* 所有权也可以是建模业务逻辑/状态的好方法。例如：
```rust
let not_validated: String = ...;// 某个用户来源
let validated = Validate::try_from(not_validated)?;
// 从技术上讲，`try_from` 可能不需要所有权，但获取它让我们可以对意图建模
```

### 何时**不**传递所有权？

* 优先采用引用的 API 设计（`fn process(values: &[T])`），而不是所有权（`fn process(values: Vec<T>)`）。
* 如果你只需要对元素的读访问，优先使用 `.iter` 或切片：
```rust
for item in &some_vec {
    ...
}
```
* 你需要修改由另一个线程拥有的数据，使用 `&mut MyStruct`。

### 使用 `Cow` 处理"可能所有权"数据

有时你实际上不需要所有权数据，但从 API 角度来看并不明确，因此使用 [`std::borrow::Cow`](https://doc.rust-lang.org/std/borrow/enum.Cow.html) 是有效处理这种情况的一种方式：

```rust
use std::borrow::Cow;

fn hello_greet(name: Cow<'_, str>) {
    println!("Hello {name}");
}

hello_greet(Cow::Borrowed("Julia"));
hello_greet(Cow::Owned("Naomi".to_string()));
```

## 3.3 栈 vs 堆：大小要明智！

### ✅ 良好实践

* 将小型类型（`impl Copy`、`usize`、`bool` 等）**保持在栈上**。
* 避免通过值传递或转移所有权传递大型类型（`> 512 字节`）。优先使用引用传递（例如 `&T` 和 `&mut T`）。
* 堆分配递归数据结构：
```rust
enum OctreeNode<T> {
    Node(T),
    Children(Box<[Node<T>; 8]>),
}
```
* 通过值返回小型类型，实现 `Copy` 或廉价 Cloned 的类型通过值返回效率高（例如 `struct Vector2 {x: f32, y: f32}`）。

### ❗ 注意

* 仅在基准测试证明有益时使用 `#[inline]`，Rust 在**没有**提示的情况下已经非常擅长内联。
* 避免大型栈分配，对它们进行装箱。例如 `let buffer: Box<[u8; 65536]> = Box::new(..)` 会先在栈上分配 `[u8; 65536]` 然后装箱，一个非 const 的解决方案是 `let buffer: Box<[u8]> = vec![0; 65536].into_boxed_slice()`。
* 对于大型 `const` 数组，考虑使用 [crate smallvec](https://docs.rs/smallvec/latest/smallvec/)，它的行为类似于数组，但足够智能以在堆上分配大型数组。

## 3.4 迭代器和零成本抽象

Rust 迭代器是惰性的，但最终会被编译成非常高效紧凑的循环，仅在消费时被调用。链式调用 `.filter()`、`.map()`、`.rev()`、`.skip()`、`.take()`、`.collect()` 通常不会增加额外成本，编译器能够很好地推断如何优化它们。
* 在处理集合时，优先使用 `iterator` 而不是手动 `for` 循环，编译器可以比手动更好地优化它们。
* 调用 `.iter()` 仅创建对原始集合的**引用**，这允许你持有同一集合的多个迭代器。

#### ❗ 避免创建中间集合，除非确实需要：

* 考虑 `process` 接受一个 `iterator`。
* ❌ 不好——无用的中间集合：
```rust
let doubled: Vec<_> = items.iter().map(|x| x * 2).collect();
process(doubled);
```
* ✅ 好——传递迭代器（`fn process(arg: impl Iterator<Item = T>)`）：
```rust
let doubled_iter = items.iter().map(|x| x * 2);
process(doubled_iter);
```
