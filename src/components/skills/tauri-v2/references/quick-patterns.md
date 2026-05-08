# Tauri v2 快速代码模式

## 模式 1：`main.rs` 薄入口，`lib.rs` 负责命令注册

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

## 模式 2：capability JSON 与窗口获取

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

## 继续展开

- 插件 + capability 注册：见 [plugin-reference.md](./plugin-reference.md) 和 [capabilities-reference.md](./capabilities-reference.md)。
- `Channel<T>` 流式消息、`State<T>` 共享状态、窗口访问：见 [ipc-patterns.md](./ipc-patterns.md) 和 [advanced-runtime-reference.md](./advanced-runtime-reference.md)。
