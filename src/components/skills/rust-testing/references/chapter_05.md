# 第 5 章 - 自动化测试

> 测试不仅是为了正确性。它们是人们首先查看以了解你的代码如何工作的地方。

* Rust 中的测试使用属性宏 `#[test]` 声明。大多数代码编辑器可以单独编译和运行在宏下声明的函数或函数块。
* 测试可以使用 `#[cfg(test)]` 具有特殊的编译标志。如果包含 `#[test]`，也可以在代码编辑器中执行，这是模拟复杂函数或覆盖 trait 的好方法。

## 5.1 测试作为活文档

在 Rust 中，如同许多其他语言一样，测试通常展示函数是如何被使用的。如果一个测试清晰且有针对性的，它通常比阅读函数体更有帮助，当与其他测试结合时，它们作为活文档。

### 使用描述性名称

> 在单元测试名称中，我们应该看到以下内容：
> * `unit_of_work`：我们调用的*函数*。将要执行的**操作**。这通常是测试 `mod` 的名称，其中被测函数所在。
```rust
#[cfg(test)] 
mod test { 
    mod function_name { 
        #[test] 
        fn returns_y_when_x() { ... } 
    } 
}
```
> * `expected_behavior`：我们需要验证测试正常工作的一组**断言**。
> * `state_that_the_test_will_check`：特定测试用例的总体**安排**或设置。

#### ❌ 不要使用通用名称作为测试名称
```rust
#[test]
fn test_add_happy_path() {
    assert_eq!(add(2, 2), 4);
}
```
#### ✅ 使用像句子一样可读的名称，描述所需行为
> 另外，如果你的函数有太多测试，你可以将它们分组在一个 `mod` 中，使其更易于阅读和导航。

```rust
// 选项 1
#[test]
fn process_should_return_blob_when_larger_than_b() {
    let a = setup_a_to_be_xyz();
    let b = Some(2);
    let expected = MyExpectedStruct { ... };

    let result = process(a, b).unwrap();

    assert_eq!(result, expected);
}

// 选项 2
mod process {
    #[test]
    fn should_return_blob_when_larger_than_b() {
        let a = setup_a_to_be_xyz();
        let b = Some(2);
        let expected = MyExpectedStruct { ... };

        let result = process(a, b).unwrap();

        assert_eq!(result, expected);
    }
}
```

> 执行 `cargo test` 时，每个选项的测试输出将如下所示：
> 选项 1：`process_should_return_blob_when_larger_than_b`。
> 选项 2：`process::should_return_blob_when_larger_than_b`。

### 使用模块组织

大多数 IDE 可以一起运行单个模块的所有测试。
输出中的测试名称也将包含模块的名称。
总的来说，这意味着你可以使用模块名称将相关测试分组在一起：

```rust
#[cfg(test)]
mod test { // IDE 将在此处提供 ▶️ 按钮

    mod process {
        #[test] // IDE 将在此处提供 ▶️ 按钮
        fn returns_error_xyz_when_b_is_negative() {
            let a = setup_a_to_be_xyz();
            let b = Some(-5);
            let expected = MyError::Xyz;
            
            let result = process(a, b).unwrap_err();
            
            assert_eq!(result, expected);
        }

        #[test] // IDE 将在此处提供 ▶️ 按钮
        fn returns_invalid_input_error_when_a_and_b_not_present() {
            let a = None;
            let b = None;
            let expected = MyError::InvalidInput;

            let result = process(a, b).unwrap_err();

            assert_eq!(result, expected);
        }
    }
}
```

### 每个函数只测试一个行为

为了保持测试清晰，它们应该描述该单元所做的*一件*事情。
这使得更容易理解为什么测试失败。

#### ❌ 不要在同一测试中测试多个事项
```rust
fn test_thing_parser(...) {
    assert!(Thing::parse("abcd").is_ok());
    assert!(Thing::parse("ABCD").is_err());
}
```

#### ✅ 每个测试测试一件事
```rust
#[cfg(test)]
mod test_thing_parser {
    #[test]
    fn lowercase_letters_are_valid() {
        assert!(
            Thing::parse("abcd").is_ok(),
            // 像 `eprintln`、`format` 和 `println` 宏一样工作
            "Thing parse error: {:?}", 
            Thing::parse("abcd").unwrap_err()
        );
    }

    #[test]
    fn capital_letters_are_invalid() {
        assert!(Thing::parse("ABCD").is_err());
    }
}
```

> `Ok` 场景应该有 `Err` 情况的 `eprintln`。

### 每个测试使用很少的（理想情况是一个）断言

当每个测试有多个断言时，更难理解预期行为，并且
通常需要多次迭代来修复失败的测试，因为你需要逐个处理断言。

❌ 不要在一个测试中包含多个断言：

```rust
#[test]
fn test_valid_inputs() {
    assert!(the_function("a").is_ok());
    assert!(the_function("ab").is_ok());
    assert!(the_function("ba").is_ok());
    assert!(the_function("bab").is_ok());
}
```

如果你在测试不同的行为，创建多个测试，每个带有描述性名称。
为了避免样板代码，使用共享设置函数或 [rstest](https://crates.io/crates/rstest) 用例，*并带有描述性测试名称*：
```rust
#[rstest]
#[case::single("a")]
#[case::first_letter("ab")]
#[case::last_letter("ba")]
#[case::in_the_middle("bab")]
fn the_function_accepts_all_strings_with_a(#[case] input: &str) {
    assert!(the_function(input).is_ok());
}
```

> 使用 `rstest` 时的注意事项
>
> * 对于 IDE 和人类来说，运行/定位特定测试都更难。
> * 期望与条件命名的视觉顺序颠倒（期望在前）。

## 5.2 在文档中添加测试示例

我们将在后面深入探讨文档，因此在本节中，我们只是简要介绍如何在文档中添加测试。Rustdoc 可以使用 `///` 将示例转换为可执行的测试，这有几个优点：

* 这些测试通过 `cargo test` 运行，**但不会**通过 `cargo nextest run` 运行。如果使用 `nextest`，确保单独运行 `cargo t --doc`。
* 它们既作为文档又作为正确性检查，并且由于编译器检查它们，它们会随着变更保持更新。
* 没有额外的测试样板代码。你可以通过在行前添加 `#` 来轻松隐藏测试部分。
* ❗ 文档测试和其他非面向公众的测试之间存在重复没有关系。

```rust
/// 将任意两个数值相加的辅助函数。
/// 此函数根据类型和数值的大小推断出正确的解析类型。
/// 
/// # Examples
/// 
/// ```rust
/// # use crate_name::generic_add;
/// use num::numeric;
/// 
/// # assert_eq!(
/// generic_add(5.2, 4) // => 9.2
/// # , 9.2)
/// 
/// # assert_eq!(
/// generic_add(2, 2.0) // => 4
/// # , 4)
/// ```
```

这段文档代码看起来像：
```rust
use num::numeric;

generic_add(5.2, 4) // => 9.2
generic_add(2, 2.0) // => 4
```

## 5.3 单元测试 vs 集成测试 vs 文档测试

一般来说，在不深入*测试金字塔命名*的情况下，Rust 有 3 组测试：

### 单元测试

与被测单元在同一**模块**中的测试，这允许测试运行器访问私有函数和父级 `use` 声明。如果需要，它们也可以从其他模块消费 `pub(crate)` 函数。单元测试可以更专注于**实现和边界情况检查**。

* 它们应该尽可能简单，测试一个状态和一个行为。KISS 原则。
* 它们应该测试错误和边界情况。
* 同一单元的不同测试可以合并到单个 `#[cfg(test)] mod test_unit_of_work {...}` 下，允许为不同的 `units_of_work` 设置多个子模块。
* 尽量将外部状态/副作用保持在对 API 的最小范围内，并将这些测试集中在 `mod.rs` 文件中。
* 尚未完全实现的测试可以使用 `#[ignore = "optional message"]` 属性忽略。
* 故意 panic 的测试应使用属性 `#[should_panic]` 注释。

```rust
#[cfg(test)]
mod unit_of_work_tests {
    use super::*;

    #[test]
    fn unit_state_behavior() {
        let expected = ...;
        let result = ...;
        assert_eq!(result, expected, "由于 {} 而失败", result - expected);
    }
}
```

### 集成测试

放在 `tests/` 目录下的测试，它们完全外部于你的库，并使用与任何其他代码相同的代码，无法访问私有和 crate 级别函数，这意味着它们**只能测试**你的**公共 API** 上的函数。

> 它们的目的是测试代码的多个部分是否能够正确协同工作，独立正确工作的代码单元在集成时可能出现问题。

* 测试正常路径和常见用例。
* 允许外部状态和副作用，[testcontainers](https://rust.testcontainers.org/) 可能有帮助。
* 如果测试二进制文件，尝试将**可执行文件**和**函数**分别拆分到 `src/main.rs` 和 `src/lib.rs` 中。

```
├── Cargo.lock 
├── Cargo.toml 
├── src 
│   └── lib.rs 
└── tests 
    ├── mod.rs 
    ├── common 
    │   └── mod.rs 
    └── integration_test.rs
```

### 文档测试

如[第 5.2 节](#52-在文档中添加测试示例)所述，文档测试应有正常路径、一般公共 API 用法以及改进文档的更强大属性，如用于代码块的自定义 CSS。

### 属性：

* `ignore`：告诉 Rust 忽略代码，通常不推荐，如果你只想要代码格式化的文本，使用 `text`。
* `should_panic`：告诉 Rust 编译器此示例块将 panic。
* `no_run`：编译但不执行代码，类似于 `cargo check`。在处理用于文档的副作用时非常有用。
* `compile_fail`：测试 rustdoc 此块应导致编译失败，在你想展示错误用例时很重要。

## 5.4 如何使用 `assert!`

Rust 提供了 2 个用于断言的宏：
* `assert!` 用于断言布尔值，如 `assert!(value.is_ok(), "'value' is not Ok: {value:?}")`
* `assert_eq!` 用于检查两个不同值之间的相等性：`assert_eq!(result, expected, "'result' differs from 'expected': {}", result.diff(expected))`。

### 🚨 `assert!` 提醒
* Rust 断言支持格式化字符串，如前面的示例，这些字符串会在失败时打印，因此添加实际状态及其与预期的差异是一个好习惯。
* 如果你不关心精确的模式匹配值，使用 `matches!` 结合 `assert!` 可能是一个不错的替代方案。
```rust
assert!(matches!(error, MyError::BadInput(_), "Expected `BadInput`, found {error}"));
```
* 明智地使用 `#[should_panic]`。仅当 panic 是预期行为时才应使用，优先使用 Result 而非 panic。
* 还有其他可以增强测试体验的工具，如：
    * [`rstest`](https://crates.io/crates/rstest)：基于 fixture 的测试框架，使用过程宏。
    * [`pretty_assertions`](https://crates.io/crates/pretty_assertions)：覆盖 `assert_eq` 和 `assert_ne`，并创建它们之间的彩色差异。

## 5.5 使用 `cargo insta` 进行快照测试

> 当正确性是视觉或结构性的时，快照比断言更能说明问题。

1. 添加到你的依赖项：
```toml
insta = { version = "1.42.2", features = ["yaml"] }
```
> 对于大多数实际应用，建议使用可序列化值的 YAML 快照。这是因为它们在版本控制和差异查看器中看起来最好，并支持编辑。要使用此功能，请启用 insta 的 yaml 功能。

2. 为了获得更好的审查体验，添加 CLI `cargo install cargo-insta`。

3. 编写一个简单的测试：
```rust
fn split_words(s: &str) -> Vec<&str> {
    s.split_whitespace().collect()
}

#[test]
fn test_split_words() {
    let words = split_words("hello from the other side");
    insta::assert_yaml_snapshot!(words);
}
```

4. 运行 `cargo insta test` 执行，`cargo insta review` 审查冲突。

要了解更多关于 `cargo insta` 的信息，请查看其[文档](https://insta.rs/docs/quickstart/)，因为它是一个非常完整且文档齐全的工具。

### 什么是快照测试？

快照测试将你的输出（文本、Json、HTML、YAML 等）与保存的"黄金"版本进行比较。在未来的运行中，如果输出发生变化，测试将失败，除非经过人工批准。它非常适合：
* 生成代码。
* 序列化复杂数据。
* 渲染的 HTML。
* CLI 输出。

#### ❌ 不适合快照测试的内容
* 非常稳定、仅涉及数值或小型结构化数据的相关逻辑（优先使用 `assert_eq!`）。
* 关键路径逻辑（优先使用精确的单元测试）。
* 不稳定的测试、随机生成的输出，除非经过编辑。
* 外部资源的快照，使用 mock 和 stub。

## 5.6 ✅ 快照最佳实践

* 命名快照，它会给快照文件有意义的名称，例如 `snapshots/this_is_a_named_snapshot.snap`
```rust
assert_snapshot!("this_is_a_named_snapshot", output);
```

* 保持快照小巧清晰。
```rust
// ✅ 最佳情况：
assert_snapshot!("app_config/http", whole_app_config.http);

// ❌ 最坏情况：
assert_snapshot!("app_config", whole_app_config); // 巨大的对象
```

> #### 🚨 避免对巨大对象进行快照
> 巨大的对象变得难以审查和推理。

* 避免对简单类型（原始类型、扁平 enum、小型 struct）进行快照：
```rust
// ✅ 更好：
assert_eq!(meaning_of_life, 42);

// ❌ 过度杀伤：
assert_snapshot!("the_meaning_of_life", meaning_of_life); // meaning_of_life == 42
```

* 对不稳定的字段使用[编辑](https://insta.rs/docs/redactions/)（随机生成、时间戳、uuid 等）：
```rust
use insta::assert_json_snapshot;

#[test]
fn endpoint_get_user_data() {
    let data = http::client.get_user_data();
    assert_json_snapshot!(
        "endpoints/subroute/get_user_data",
        data,
        ".created_at" => "[timestamp]",
        ".id" => "[uuid]"
    );
}
```
* 将快照提交到 git。它们将存储在 `snapshots/` 中，与你的测试一起。
* 在接受之前仔细审查变更。
