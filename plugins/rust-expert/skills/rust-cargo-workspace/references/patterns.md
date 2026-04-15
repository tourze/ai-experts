# Rust Cargo Workspace - 代码模式

## 模式 1

### Workspace Cargo.toml 与成员配置

根目录 `Cargo.toml`：

```toml
[workspace]
members = [
    "crates/core",
    "crates/api",
    "crates/cli",
    "crates/test-harness",
]
resolver = "2"

[workspace.package]
edition = "2021"
rust-version = "1.75"
license = "MIT OR Apache-2.0"
repository = "https://github.com/example/myproject"

[workspace.dependencies]
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tokio = { version = "1", features = ["macros", "rt-multi-thread"] }
thiserror = "2"
anyhow = "1"
tracing = "0.1"

# Internal crates referenced by path
myproject-core = { path = "crates/core" }
myproject-api = { path = "crates/api" }
```

成员 `crates/api/Cargo.toml`：

```toml
[package]
name = "myproject-api"
version = "0.1.0"
edition.workspace = true
rust-version.workspace = true
license.workspace = true

[dependencies]
myproject-core.workspace = true
serde.workspace = true
serde_json.workspace = true
tokio.workspace = true
thiserror.workspace = true
tracing.workspace = true
```

## 模式 2

### Feature flag 跨 Crate 组合

`crates/core/Cargo.toml`：

```toml
[package]
name = "myproject-core"
version = "0.1.0"
edition.workspace = true

[features]
default = []
postgres = ["dep:sqlx"]
sqlite = ["dep:sqlx"]
tracing = ["dep:tracing"]

[dependencies]
sqlx = { version = "0.8", features = ["runtime-tokio"], optional = true }
tracing = { workspace = true, optional = true }
```

`crates/cli/Cargo.toml` 组合上游 feature：

```toml
[package]
name = "myproject-cli"
version = "0.1.0"
edition.workspace = true

[features]
default = ["postgres"]
postgres = ["myproject-core/postgres"]
sqlite = ["myproject-core/sqlite"]
full = ["postgres", "sqlite"]

[dependencies]
myproject-core = { workspace = true }
anyhow.workspace = true
tokio.workspace = true
```

`crates/core/src/lib.rs`：

```rust
/// Database module, available when `postgres` or `sqlite` is enabled.
#[cfg(any(feature = "postgres", feature = "sqlite"))]
pub mod db {
    pub fn pool_size() -> usize {
        10
    }
}

/// Emit trace events when the `tracing` feature is active.
#[cfg(feature = "tracing")]
pub fn log_startup() {
    tracing::info!("core initialized");
}

#[cfg(not(feature = "tracing"))]
pub fn log_startup() {
    // no-op when tracing is disabled
}

/// Always available regardless of features.
pub fn version() -> &'static str {
    env!("CARGO_PKG_VERSION")
}
```

## 模式 3

### build.rs 编译时代码生成

`crates/core/build.rs`：

```rust
use std::env;
use std::fs;
use std::path::Path;

fn main() {
    let out_dir = env::var("OUT_DIR").expect("OUT_DIR not set");
    let dest = Path::new(&out_dir).join("build_info.rs");

    let profile = env::var("PROFILE").unwrap_or_else(|_| "unknown".into());
    let target = env::var("TARGET").unwrap_or_else(|_| "unknown".into());

    let content = format!(
        r#"
/// Build profile: debug or release.
pub const BUILD_PROFILE: &str = "{profile}";

/// Target triple this binary was compiled for.
pub const BUILD_TARGET: &str = "{target}";
"#,
    );

    fs::write(&dest, content).expect("failed to write build_info.rs");

    // Only re-run when build.rs itself changes.
    println!("cargo::rerun-if-changed=build.rs");
}
```

`crates/core/src/lib.rs` 中引用：

```rust
include!(concat!(env!("OUT_DIR"), "/build_info.rs"));

pub fn build_summary() -> String {
    format!("profile={BUILD_PROFILE} target={BUILD_TARGET}")
}
```

## 模式 4

### CI Workflow

GitHub Actions 示例：

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

env:
  CARGO_TERM_COLOR: always
  RUSTFLAGS: "-D warnings"

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: dtolnay/rust-toolchain@stable
        with:
          components: rustfmt, clippy

      - uses: Swatinem/rust-cache@v2
        with:
          shared-key: "workspace"

      - name: Format check
        run: cargo fmt --all -- --check

      - name: Clippy
        run: cargo clippy --workspace --all-targets --all-features

      - name: Test
        run: cargo test --workspace --all-features

      - name: Doc
        run: cargo doc --workspace --no-deps --all-features
        env:
          RUSTDOCFLAGS: "-D warnings"
```
