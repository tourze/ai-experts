# Tauri v2

## 适用场景

- 需要搭建或调整 `src-tauri/` 目录、`tauri.conf.json`、`Cargo.toml`、`lib.rs` / `main.rs` 分层时使用。
- 需要实现前端 `invoke()` 调 Rust 命令、Rust 向前端发事件、或者用 `Channel<T>` 推送高频流式消息时使用。
- 需要接入官方插件、确认 `cargo tauri add <plugin>` 后的注册步骤、capability 写法、权限范围和多窗口目标时使用。
- 需要排查 “命令找不到”“权限拒绝”“桌面可用、移动端失效”“白屏”“签名/更新失败” 这类 Tauri 特有问题时使用。
- 需要和其它技能联动时：
  `rust-best-practices` 负责 Rust 代码风格与错误处理，
  `rust-async-patterns` 负责异步并发与后台任务，
  `typescript-magician` 负责前端类型边界，
  `react-server-components` 负责 React 前端分层。
- 需要展开专题时优先查这些参考文档：
  [Capabilities](references/capabilities-reference.md)、
  [IPC Patterns](references/ipc-patterns.md)、
  [Plugin Reference](references/plugin-reference.md)、
  [Updater & Distribution](references/updater-distribution-reference.md)、
  [Advanced Runtime](references/advanced-runtime-reference.md)。

## 核心约束

- `src-tauri/src/main.rs` 只保留薄入口；真正的构建器、命令注册、插件注册和状态注入都放在 `src-tauri/src/lib.rs::run()`。
- 面向移动端时，`lib.rs::run()` 必须带 `#[cfg_attr(mobile, tauri::mobile_entry_point)]`；不要把核心逻辑写死在 `main()`。
- 每个 `#[tauri::command]` 都必须出现在 `tauri::generate_handler![...]` 中；漏注册时前端会得到 “command not found”。
- `async` 命令参数一律使用拥有所有权的类型，例如 `String`、结构体、`Vec<T>`；不要在异步命令里使用 `&str` 之类借用类型。
- 自定义 `#[tauri::command]` 默认可以被调用；capability 主要约束核心 API、插件权限、远程 URL 和你主动收紧的命令集。不要误以为 “所有命令都必须先写 capability”。
- 官方插件通过 `cargo tauri add <plugin>` 安装时，默认 permission 常常会被 CLI 自动加入；但非默认 permission、自定义 scope、多窗口目标、手工安装场景仍然必须显式检查 `src-tauri/capabilities/*.json`。
- 共享可变状态用 `Mutex<T>` / `RwLock<T>` 包裹，并保证 `State<T>` 的泛型与 `.manage(...)` 注入的真实类型完全一致。
- 所有桌面专属能力都要先核对平台支持矩阵；系统托盘、多窗口标签、部分 shell 功能经常需要 `#[cfg(desktop)]` 或运行时分支。

## 代码模式

### 模式 1：`main.rs` 保持薄入口，`lib.rs` 负责命令注册

```rust
// src-tauri/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    app_lib::run();
}
```

```rust
// src-tauri/src/lib.rs
#[tauri::command]
async fn greet(name: String) -> Result<String, String> {
    Ok(format!("Hello, {name}!"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

```typescript
import { invoke } from "@tauri-apps/api/core";

const greeting = await invoke<string>("greet", { name: "World" });
console.log(greeting);
```

### 模式 2：capability JSON 与窗口获取

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "main-capability",
  "windows": ["main"],
  "permissions": [
    "core:event:default",
    "core:webview:default",
    "shell:allow-open"
  ]
}
```

```rust
#[tauri::command]
fn focus_main_window(app: tauri::AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "main window not found".to_string())?;

    window.set_focus().map_err(|err| err.to_string())
}
```

### 模式 3-4

- 插件 + capability 注册：见 [plugin-reference.md](references/plugin-reference.md) 和 [capabilities-reference.md](references/capabilities-reference.md)
- `Channel<T>` 流式消息、`State<T>` 共享状态、窗口访问：见 [ipc-patterns.md](references/ipc-patterns.md) 和 [advanced-runtime-reference.md](references/advanced-runtime-reference.md)

## 检查清单

- `main.rs` 是否只做入口转发，`lib.rs` 是否承载了 `run()`、命令注册和插件注册？
- 每个命令是否都进入了 `tauri::generate_handler![...]`，异步参数是否全部为拥有所有权的类型？
- 前端是否统一使用 `@tauri-apps/api/core`、`@tauri-apps/api/event` 等 v2 API，而不是遗留的 v1 导入路径？
- 如果调用的是核心 JS API 或插件 JS API，是否核对了 `src-tauri/capabilities/*.json` 里的默认 permission、额外 permission 与 scope？
- 插件安装后是否同时验证了三件事：Cargo 依赖、`lib.rs` 注册、capability/权限目标窗口？
- 长耗时逻辑是否避开 UI 线程阻塞，`Channel<T>` / 事件 / `invoke()` 的 IPC 选择是否和吞吐量匹配？
- `State<T>` 的类型是否与 `.manage(...)` 注入保持完全一致，锁的粒度是否足够小？
- 是否先核对目标插件或 API 的桌面 / Android / iOS 支持矩阵，再决定是否需要 `#[cfg(desktop)]` / `#[cfg(mobile)]`？
- 交付前是否运行 `cargo tauri info`、目标平台构建命令，并检查 `beforeDevCommand` / `beforeBuildCommand`、签名和更新配置？

## 反模式

### FAIL: 全部逻辑塞 main.rs

```rust
// src-tauri/src/main.rs
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![cmd1, cmd2, cmd3])
        .run(tauri::generate_context!())
        .expect("error");
}
// 移动端 entry_point 在 lib.rs，main.rs 不会被调用
// → iOS/Android 上所有命令、插件、state 都不存在
```

### PASS: main 薄入口 + lib.rs::run()

```rust
// main.rs（仅桌面入口转发）
fn main() { app_lib::run(); }

// lib.rs（桌面 + 移动共用）
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![cmd1, cmd2, cmd3])
        .run(tauri::generate_context!())
        .expect("error");
}
```

### FAIL: 异步命令用借用参数

```rust
#[tauri::command]
async fn process(content: &str) -> Result<String, String> {  // 编译错误
    Ok(content.to_uppercase())
}
// error: lifetime may not live long enough
// async fn 不能持有非 'static 借用
```

### PASS: 拥有所有权类型

```rust
#[tauri::command]
async fn process(content: String) -> Result<String, String> {
    Ok(content.to_uppercase())
}
// String 拥有所有权，可跨 await 边界
```

### FAIL: v1 时代 import

```typescript
// 旧版会从 legacy tauri entrypoint 导入 invoke
import { appWindow } from "@tauri-apps/api/window";  // ← v1 全局窗口
```

### PASS: v2 模块化路径

```typescript
import { invoke } from "@tauri-apps/api/core";       // v2
import { getCurrentWindow } from "@tauri-apps/api/window";  // v2
import { listen } from "@tauri-apps/api/event";
```

### FAIL: 桌面通过 = 移动通过

```rust
#[tauri::command]
fn create_tray() -> Result<(), String> {
    use tauri::tray::TrayIconBuilder;  // 移动端无系统托盘
    TrayIconBuilder::new().build(...).map_err(|e| e.to_string())?;
    Ok(())
}
```

### PASS: 平台分支

```rust
#[tauri::command]
#[cfg(desktop)]
fn create_tray() -> Result<(), String> {
    TrayIconBuilder::new().build(...).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
#[cfg(mobile)]
fn create_tray() -> Result<(), String> {
    Err("System tray not supported on mobile".into())
}
```
