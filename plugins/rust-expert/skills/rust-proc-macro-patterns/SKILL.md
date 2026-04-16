---
name: rust-proc-macro-patterns
description: 当用户需要开发 Rust 过程宏时使用；涉及 derive macro、attribute macro、syn/quote 或 proc-macro2 时触发。
---

# Rust Proc Macro Patterns

## 适用场景

- 编写 derive macro 自动实现 trait。
- 编写 attribute macro 注入日志、校验等代码。
- 排查宏编译错误或 Span 定位不准。
- 用 trybuild 编写编译通过/失败测试。

## 核心约束

1. `[lib]` 设 `proc-macro = true`。
2. 用 syn 2.x + quote + proc-macro2。
3. 不 panic；错误用 `compile_error!` + 正确 Span。
4. derive macro 只追加 impl，不修改原始 item。
5. attribute macro 可修改 item，须文档说明。
6. trybuild 覆盖通过和失败两类测试。
7. 核心逻辑放独立辅助 crate 方便单测。
8. `cargo expand` 调试展开结果。

## 代码模式

- [Derive macro 实现 trait](references/patterns.md#模式-1)
- [Attribute macro 函数计时](references/patterns.md#模式-2)
- [带 Span 的错误报告](references/patterns.md#模式-3)
- [trybuild 编译测试](references/patterns.md#模式-4)

## 检查清单

- `proc-macro = true` 已设？用 syn 2.x？
- 错误路径返回 `compile_error!` 而非 panic？Span 指向有意义位置？

## 反模式

### FAIL: 宏内 panic

```rust
#[proc_macro_derive(MyTrait)]
pub fn derive(input: TokenStream) -> TokenStream {
    let ast = syn::parse(input).unwrap();  // 解析失败 panic
    if !is_struct(&ast) {
        panic!("MyTrait only works on structs");
    }
    ...
}
// 编译错误：error: proc macro panicked
//          help: message: MyTrait only works on structs
// 用户看不到自己代码的问题位置
```

### PASS: compile_error! + Span

```rust
#[proc_macro_derive(MyTrait)]
pub fn derive(input: TokenStream) -> TokenStream {
    let ast = match syn::parse::<DeriveInput>(input) {
        Ok(a) => a,
        Err(e) => return e.to_compile_error().into(),
    };
    if !matches!(ast.data, syn::Data::Struct(_)) {
        return syn::Error::new_spanned(&ast.ident, "MyTrait 只支持 struct")
            .to_compile_error().into();
    }
    ...
}
// 编译错误指向用户代码的具体类型名
```

### FAIL: 全用 call_site() Span

```rust
quote_spanned! { Span::call_site() =>
    impl Trait for #name { ... }
}
// 错误指向宏调用点，看不出是哪个字段有问题
```

### PASS: 字段级 Span

```rust
for field in fields {
    let span = field.span();  // ← 字段自己的 span
    quote_spanned! { span =>
        validate_field::<#field_type>();
    }
}
// 错误精确指向出问题的字段定义
```
