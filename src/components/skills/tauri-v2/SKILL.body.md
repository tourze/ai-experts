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
