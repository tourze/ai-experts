# Tauri v2 高级 IPC 代码模式

## 模式 1：自定义错误类型与 From 转换

依赖：`thiserror = "2"`, `serde = { version = "1", features = ["derive"] }`

**Rust 错误定义：**
```rust
// src-tauri/src/error.rs
use serde::Serialize;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("not found: {0}")]
    NotFound(String),
    #[error("permission denied: {0}")]
    PermissionDenied(String),
    #[error("io: {0}")]
    Io(#[from] std::io::Error),
    #[error("json: {0}")]
    Json(#[from] serde_json::Error),
}

// Serialize as structured object, NOT plain string
impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut s = serializer.serialize_struct("AppError", 2)?;
        let (code, msg) = match self {
            Self::NotFound(m) => ("NOT_FOUND", m.clone()),
            Self::PermissionDenied(m) => ("PERMISSION_DENIED", m.clone()),
            Self::Io(e) => ("IO_ERROR", e.to_string()),
            Self::Json(e) => ("JSON_ERROR", e.to_string()),
        };
        s.serialize_field("code", code)?;
        s.serialize_field("message", &msg)?;
        s.end()
    }
}
```

**命令使用：**
```rust
// src-tauri/src/commands.rs
use crate::error::AppError;

#[tauri::command]
async fn read_config(path: String) -> Result<serde_json::Value, AppError> {
    let content = tokio::fs::read_to_string(&path).await?; // From<io::Error>
    let config: serde_json::Value = serde_json::from_str(&content)?; // From<serde_json::Error>
    Ok(config)
}
```

**前端按错误码分支：**
```typescript
interface AppError {
  code: "NOT_FOUND" | "PERMISSION_DENIED" | "IO_ERROR" | "JSON_ERROR";
  message: string;
}

try {
  const config = await invoke<Record<string, unknown>>("read_config", {
    path: "/app/config.json",
  });
} catch (raw) {
  const err = raw as AppError;
  if (err.code === "NOT_FOUND") {
    console.warn("Config missing, using defaults");
  }
}
```

---

## 模式 2：判别联合事件 + 多窗口精确路由

**Rust 事件定义与路由：**
```rust
// src-tauri/src/events.rs
use tauri::{AppHandle, Emitter};

#[derive(Clone, serde::Serialize)]
#[serde(tag = "event", content = "data")]
pub enum AppEvent {
    FileChanged { path: String, kind: String },
    SyncProgress { done: u32, total: u32 },
    Notification { title: String, body: String },
}

/// Broadcast to all windows
pub fn broadcast(app: &AppHandle, event: &AppEvent) {
    app.emit("app-event", event).unwrap();
}

/// Send to specific window only
pub fn send_to_window(app: &AppHandle, label: &str, event: &AppEvent) {
    app.emit_to(label, "app-event", event).unwrap();
}

/// Send to windows matching a filter
pub fn send_filtered(app: &AppHandle, event: &AppEvent) {
    app.emit_filter("app-event", event, |target| {
        target.label().starts_with("editor")
    })
    .unwrap();
}
```

**前端类型安全监听：**
```typescript
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

type AppEvent =
  | { event: "FileChanged"; data: { path: string; kind: string } }
  | { event: "SyncProgress"; data: { done: number; total: number } }
  | { event: "Notification"; data: { title: string; body: string } };

export async function onAppEvent(
  handler: (event: AppEvent) => void
): Promise<UnlistenFn> {
  return listen<AppEvent>("app-event", (e) => {
    handler(e.payload);
  });
}
```

---

## 模式 3：自定义命令权限定义

**权限文件：**
```toml
# src-tauri/permissions/read-config.toml
[[permission]]
identifier = "allow-read-config"
description = "Allow reading application configuration files"
commands.allow = ["read_config"]

[[permission]]
identifier = "deny-read-config"
description = "Deny reading application configuration files"
commands.deny = ["read_config"]
```

```toml
# src-tauri/permissions/admin-ops.toml
[[permission]]
identifier = "allow-admin-ops"
description = "Allow admin operations: reset, export, import"
commands.allow = ["reset_database", "export_data", "import_data"]

[[scope.allow]]
path = "$APPDATA/exports/**"
```

```toml
# src-tauri/permissions/default.toml
[default]
description = "Default permission set for the app"
permissions = ["allow-read-config"]
```

**Capability 引用：**
```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "main-window",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "allow-read-config",
    "allow-admin-ops"
  ]
}
```

---

## 模式 4：批量命令减少 IPC 往返

**Rust 批量处理：**
```rust
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
#[serde(tag = "action")]
enum BatchOp {
    GetItem { key: String },
    SetItem { key: String, value: serde_json::Value },
    DeleteItem { key: String },
}

#[derive(Serialize)]
#[serde(tag = "status")]
enum BatchResult {
    Ok { index: usize, data: serde_json::Value },
    Err { index: usize, message: String },
}

#[tauri::command]
async fn batch(
    ops: Vec<BatchOp>,
    state: tauri::State<'_, std::sync::Mutex<std::collections::HashMap<String, serde_json::Value>>>,
) -> Vec<BatchResult> {
    let mut store = state.lock().unwrap();
    ops.into_iter()
        .enumerate()
        .map(|(i, op)| match op {
            BatchOp::GetItem { key } => match store.get(&key) {
                Some(v) => BatchResult::Ok { index: i, data: v.clone() },
                None => BatchResult::Err { index: i, message: "not found".into() },
            },
            BatchOp::SetItem { key, value } => {
                store.insert(key, value);
                BatchResult::Ok { index: i, data: serde_json::Value::Null }
            }
            BatchOp::DeleteItem { key } => {
                store.remove(&key);
                BatchResult::Ok { index: i, data: serde_json::Value::Null }
            }
        })
        .collect()
}
```

**前端批量调用：**
```typescript
import { invoke } from "@tauri-apps/api/core";

type BatchOp =
  | { action: "GetItem"; key: string }
  | { action: "SetItem"; key: string; value: unknown }
  | { action: "DeleteItem"; key: string };

type BatchResult =
  | { status: "Ok"; index: number; data: unknown }
  | { status: "Err"; index: number; message: string };

export async function batchInvoke(ops: BatchOp[]): Promise<BatchResult[]> {
  return invoke<BatchResult[]>("batch", { ops });
}

// Single IPC round-trip for multiple operations
const results = await batchInvoke([
  { action: "SetItem", key: "theme", value: "dark" },
  { action: "SetItem", key: "locale", value: "zh-CN" },
  { action: "GetItem", key: "theme" },
]);
```
