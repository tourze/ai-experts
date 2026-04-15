# Rust Proc Macro Patterns - 代码模式

## 模式 1

### Derive Macro 自动实现 Trait

`my-derive/Cargo.toml`：

```toml
[package]
name = "my-derive"
version = "0.1.0"
edition = "2021"

[lib]
proc-macro = true

[dependencies]
syn = { version = "2", features = ["full"] }
quote = "1"
proc-macro2 = "1"
```

`my-derive/src/lib.rs`：

```rust
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput};

/// Derive `Describe` to auto-generate a `describe()` method
/// that returns a string listing all field names.
#[proc_macro_derive(Describe)]
pub fn derive_describe(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);
    let name = &input.ident;

    let fields = match &input.data {
        syn::Data::Struct(data) => match &data.fields {
            syn::Fields::Named(named) => named
                .named
                .iter()
                .map(|f| f.ident.as_ref().unwrap().to_string())
                .collect::<Vec<_>>(),
            _ => {
                return syn::Error::new_spanned(
                    name,
                    "Describe only supports structs with named fields",
                )
                .to_compile_error()
                .into();
            }
        },
        _ => {
            return syn::Error::new_spanned(name, "Describe only supports structs")
                .to_compile_error()
                .into();
        }
    };

    let field_list = fields.join(", ");
    let desc = format!("{name} {{ {field_list} }}");

    let expanded = quote! {
        impl #name {
            pub fn describe(&self) -> &'static str {
                #desc
            }
        }
    };

    expanded.into()
}
```

使用方：

```rust
use my_derive::Describe;

#[derive(Describe)]
struct User {
    name: String,
    age: u32,
}

fn main() {
    let u = User { name: "Alice".into(), age: 30 };
    // prints: "User { name, age }"
    println!("{}", u.describe());
}
```

## 模式 2

### Attribute Macro 添加函数计时

```rust
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, ItemFn};

/// Wraps a function body with elapsed-time measurement.
/// Prints the function name and duration to stderr.
#[proc_macro_attribute]
pub fn timed(_attr: TokenStream, item: TokenStream) -> TokenStream {
    let input = parse_macro_input!(item as ItemFn);
    let fn_name = &input.sig.ident;
    let fn_name_str = fn_name.to_string();
    let vis = &input.vis;
    let sig = &input.sig;
    let block = &input.block;
    let attrs = &input.attrs;

    let expanded = quote! {
        #(#attrs)*
        #vis #sig {
            let __start = ::std::time::Instant::now();
            let __result = (|| #block)();
            let __elapsed = __start.elapsed();
            eprintln!("[timed] {} took {:?}", #fn_name_str, __elapsed);
            __result
        }
    };

    expanded.into()
}
```

使用方：

```rust
use my_macros::timed;

#[timed]
fn compute(n: u64) -> u64 {
    (0..n).sum()
}

fn main() {
    let result = compute(1_000_000);
    println!("result = {result}");
    // stderr: [timed] compute took 1.23ms
}
```

## 模式 3

### 带 Span 的错误报告

```rust
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput, Fields};

#[proc_macro_derive(Validate)]
pub fn derive_validate(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);
    let name = &input.ident;

    let fields = match &input.data {
        syn::Data::Struct(syn::DataStruct {
            fields: Fields::Named(named),
            ..
        }) => &named.named,
        _ => {
            return syn::Error::new_spanned(
                &input.ident,
                "Validate can only be derived for structs with named fields",
            )
            .to_compile_error()
            .into();
        }
    };

    if fields.is_empty() {
        return syn::Error::new_spanned(
            name,
            "Validate requires at least one field to validate",
        )
        .to_compile_error()
        .into();
    }

    // Check every field is a supported type.
    for field in fields.iter() {
        let ty = &field.ty;
        let ty_str = quote!(#ty).to_string();

        if ty_str.contains("HashMap") {
            // Error span points to the problematic field type,
            // not the whole struct.
            return syn::Error::new_spanned(
                ty,
                "Validate does not support HashMap fields; \
                 use a Vec of key-value pairs instead",
            )
            .to_compile_error()
            .into();
        }
    }

    let expanded = quote! {
        impl #name {
            pub fn validate(&self) -> bool {
                true // placeholder
            }
        }
    };

    expanded.into()
}
```

## 模式 4

### trybuild 编译测试

目录结构：

```
my-derive/
  tests/
    ui.rs
    ui/
      pass_basic.rs
      fail_enum.rs
      fail_enum.stderr
```

`tests/ui.rs`：

```rust
#[test]
fn ui_tests() {
    let t = trybuild::TestCases::new();
    t.pass("tests/ui/pass_*.rs");
    t.compile_fail("tests/ui/fail_*.rs");
}
```

`tests/ui/pass_basic.rs`（应编译通过）：

```rust
use my_derive::Describe;

#[derive(Describe)]
struct Point {
    x: f64,
    y: f64,
}

fn main() {
    let p = Point { x: 1.0, y: 2.0 };
    assert_eq!(p.describe(), "Point { x, y }");
}
```

`tests/ui/fail_enum.rs`（应编译失败）：

```rust
use my_derive::Describe;

#[derive(Describe)]
enum Color {
    Red,
    Blue,
}

fn main() {}
```

`tests/ui/fail_enum.stderr`（预期错误）：

```
error: Describe only supports structs
 --> tests/ui/fail_enum.rs:3:10
  |
3 | #[derive(Describe)]
  |          ^^^^^^^^
```
