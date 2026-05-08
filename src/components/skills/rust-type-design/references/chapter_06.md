# 第 6 章 - 泛型、动态分发与静态分发

> 能静态则静态，需动态才动态

Rust 允许以两种方式处理多态代码：
* **泛型 / 静态分发**：编译时，按使用场景单态化。
* **Trait 对象 / 动态分发**：运行时 vtable，单一实现。

理解这些权衡可以让你编写更快、更小、更灵活的代码。

## 6.1 [泛型](https://doc.rust-lang.org/book/ch10-00-generics.html)

每种编程语言都有有效处理概念重复的工具。在 Rust 中，一种这样的工具是泛型：具体类型或其他属性的抽象占位符。我们可以在不知道编译和运行时代码中具体类型的情况下，表达泛型的行为或它们与其他泛型的关系。

我们使用泛型来创建函数签名或 struct 等项目的定义，然后可以与许多不同的具体数据类型一起使用。首先看看如何使用泛型定义函数、struct、enum 和方法。泛型也可以用于实现类型状态模式，并将 struct 的功能约束到某些预期类型，更多关于类型状态的内容见[第 7 章](./chapter_07.md)。

[通过示例学习泛型](https://doc.rust-lang.org/rust-by-example/generics.html)。

### 泛型性能

你可能想知道使用泛型类型参数是否有运行时成本。好消息是，使用泛型类型不会使程序比使用具体类型运行得更慢。Rust 通过在编译时对使用泛型的代码执行单态化来实现这一点。单态化是将泛型代码转换为特定代码的过程，通过在编译时填充使用的具体类型来实现。编译器检查所有出现的泛型参数，并为泛型代码被调用时使用的具体类型生成代码。

## 6.2 静态分发：`impl Trait` 或 `<T: Trait>`

静态分发本质上是泛型的约束版本，一个 trait 约束的泛型，在编译时能够检查你的泛型是否满足声明的 trait。

### ✅ 最适合：
* 你想要**零运行时成本**，通过支付编译时成本。
* 你需要**紧密循环或高性能**。
* 你的类型在**编译时已知**。
* 你处理的是**单一使用的实现**（单态化）。

### 🏎️ 示例：带泛型的高性能函数
```rust
fn specialized_sum<T: MyTrait, U: Iterator<Item = T>>(iter: U) -> T {
    iter.map(|x| x.random_mapping()).sum()
}

// 或者，等效的更现代写法
fn specialized_sum<T: MyTrait>(iter: impl Iterator<Item = T>) -> T {
    iter.map(|x| x.random_mapping()).sum()
}
```

这会被编译成每次使用的**专用机器码**，快速且内联。

## 6.3 动态分发：`dyn Trait`

通常动态分发与某种指针或引用一起使用，如 `Box<dyn Trait>`、`Arc<dyn Trait>` 或 `&dyn trait`。

### ✅ 最适合：
* 你绝对需要运行时多态。
* 你需要**在一个集合中存储不同的实现**。
* 你想**将内部实现隐藏在稳定的接口后面**。
* 你在编写**插件风格的架构**。

> ❗ 更接近面向对象语言中的做法，可能有一些相关的重型成本。可以避免泛型，让你混合实现相同 trait 的类型。

### 🚚 示例：异构集合

```rust
trait Animal {
    fn greet(&self) -> String;
}

struct Dog;
impl Animal for Dog {
    fn greet(&self) -> String {
        "woof".to_string()
    }
}

struct Cat;
impl Animal for Cat {
    fn greet(&self) -> String {
        "meow".to_string()
    }
}

fn all_animals_greeting(animals: Vec<Box<dyn Animal>>) {
    for animal in animals {
        println!("{}", animal.greet())
    }
}
```

## 6.4 权衡总结

| | 静态分发 (impl Trait) | 动态分发 (dyn Trait) |
|------------------- |------------------------------ |---------------------------------- |
| 性能 | ✅ 更快，内联 | ❌ 更慢：vtable 间接调用 |
| 编译时间 | ❌ 更慢：单态化 | ✅ 更快：共享代码 |
| 二进制大小 | ❌ 更大：按类型生成代码 | ✅ 更小 |
| 灵活性 | ❌ 严格，一次一种类型 | ✅ 可以在集合中混合类型 |
| 在 trait fn() 中使用 | ❌ Trait 必须是对象安全的 | ✅ 适用于 trait 对象 |
| 错误 | ✅ 更清晰 | ❌ 类型擦除会混淆错误信息 |

* 当你控制调用点且需要性能时，优先使用泛型/静态分发。
* 当你需要抽象、插件或混合类型时，使用动态分发。🚨 有运行时成本。
* 如果你不确定，从泛型开始，添加 trait 约束——然后在灵活性比速度更重要时使用 `Box<dyn Trait>`。

> 在你的 trait 需要放在指针后面之前，优先使用静态分发。

## 6.5 动态分发最佳实践

动态分发 `Ptr<dyn Trait>` 是一个强大的工具，但也有显著的性能权衡。只有在**类型擦除或运行时多态**至关重要时才应该使用它。了解何时需要 Trait 对象很重要：

### ✅ 使用动态分发当：

* 你需要在集合中使用异构类型：
```rust
fn all_animals_greeting(animals: Vec<Box<dyn Animal>>) {
    for animal in animals {
        println!("{}", animal.greet())
    }
}
```

* 你想要运行时插件或可热替换的组件。
* 你想要从调用者那里抽象内部实现（库设计）。

### ❌ 避免动态分发当：

* 你控制具体类型。
* 你正在编写性能关键路径上的代码。
* 你可以用其他方式表达相同的逻辑，同时保持简洁，例如泛型。

## 6.6 🚨 Trait 对象使用要点

* 当你不需要所有权时，优先使用 `&dyn Trait` 而不是 `Box<dyn Trait>`。
* 使用 `Arc<dyn Trait>` 实现跨线程共享访问。
* 如果 trait 有返回 `Self` 的方法，不要使用 `dyn Trait`。
* **避免过早装箱**。除非你确定有益或必要（递归），否则不要在 struct 内部装箱。
```rust
// ✅ 尽可能使用泛型
struct Renderer<B: Backend> {
    backend: B
}

// ❌ 过早装箱
struct Renderer {
    backend: Box<dyn Backend> // 过早装箱
}
```
* 如果你必须在公共 API 中暴露 `dyn trait`，在边界处进行 `Box`，而不是内部。
* **对象安全**：你只能从对象安全的 trait 创建 `dyn Traits`：
    * 它**没有泛型方法**。
    * 它不要求 `Self: Sized`。
    * 所有方法签名使用 `&self`、`&mut self` 或 `self`。
    ```rust
    // ✅ 对象安全
    trait Runnable {
        fn run(&self);
    }

    // ❌ 非对象安全
    trait Factory {
        fn create<T>() -> T; // 不允许泛型方法
    }
    ```
