# Tauri v2+ IPC 模式参考

## 目录

- 概述
- IPC 决策框架
- Commands（invoke）
- Events
- 类型化流式 Channels
- 状态管理
- 跨 IPC 的错误处理
- 窗口访问和应用句柄
- IPC 选择指南

## 概述

Tauri v2+ 提供三种 IPC 原语：
1. **Commands**：请求-响应（最常用）
2. **Events**：即发即弃的通知
3. **Channels**：高频流式传输

**另见：** [能力参考](capabilities-reference.md)查看权限设置 | [插件参考](plugin-reference.md)查看插件特定 IPC

*最后验证日期：2026-04-02。当 IPC API 时序至关重要时，请查看官方 Tauri 更新日志。*

## IPC 决策框架

### Commands：请求-响应
在以下情况下使用 `invoke()`：
- 前端需要从 Rust 获取数据（获取、计算、查询）
- 前端触发操作并需要结果
- 需要错误处理（返回 `Result<T, E>`）
- **方向：前端 → Rust → 前端**（请求/响应）

### Events：即发即弃的通知
在以下情况下使用 `emit()`/`listen()`：
- Rust 需要通知前端后台事件
- 多个窗口需要接收相同通知
- 广播不需要确认的状态变化
- **方向：双向**（但每次 emit 是单向的）
- **重要：** Events 是即发即弃的——没有确认或响应通道

### Channels：类型化流式传输
在以下情况下使用 `Channel<T>`：
- 长时间运行操作的高频进度更新
- 从 Rust 向前端流式传输数据
- 强类型判别消息流
- **方向：Rust → 前端**（仅流式）
- **与 Events 的关键区别：** Channels 限定在单个命令调用内；events 是全局的

## Commands（invoke）

### 基本 Command

**Rust：**
```rust
#[tauri::command]
fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}

// Register in builder
tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![greet])
```

**前端：**
```typescript
import { invoke } from '@tauri-apps/api/core';

const result = await invoke<string>('greet', { name: 'World' });
```

### 带多个参数的 Command

**Rust：**
```rust
#[tauri::command]
fn calculate(a: i32, b: i32, operation: String) -> i32 {
    match operation.as_str() {
        "add" => a + b,
        "sub" => a - b,
        "mul" => a * b,
        "div" => a / b,
        _ => 0,
    }
}
```

**前端：**
```typescript
const result = await invoke<number>('calculate', {
    a: 10,
    b: 5,
    operation: 'add'
});
```

### 异步 Command

**Rust：**
```rust
#[tauri::command]
async fn fetch_data(url: String) -> Result<String, String> {
    // Use owned types (String, not &str) in async commands
    let response = reqwest::get(&url)
        .await
        .map_err(|e| e.to_string())?;

    response.text()
        .await
        .map_err(|e| e.to_string())
}
```

**前端：**
```typescript
try {
    const data = await invoke<string>('fetch_data', { url: 'https://api.example.com' });
} catch (error) {
    console.error('Failed:', error);
}
```

### 带 Result 错误处理的 Command

**Rust：**
```rust
use thiserror::Error;

#[derive(Debug, Error)]
enum AppError {
    #[error("File not found: {0}")]
    NotFound(String),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Permission denied")]
    PermissionDenied,
}

impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where S: serde::ser::Serializer {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

#[tauri::command]
fn read_config(path: String) -> Result<Config, AppError> {
    if !std::path::Path::new(&path).exists() {
        return Err(AppError::NotFound(path));
    }
    // ...
}
```

**前端：**
```typescript
try {
    const config = await invoke<Config>('read_config', { path: '/config.json' });
} catch (error) {
    // error is the serialized error string
    console.error('Config error:', error);
}
```

### 带状态的 Command

**Rust：**
```rust
use std::sync::Mutex;
use tauri::State;

struct AppState {
    counter: u32,
    items: Vec<String>,
}

#[tauri::command]
fn get_count(state: State<'_, Mutex<AppState>>) -> u32 {
    state.lock().unwrap().counter
}

#[tauri::command]
fn increment(state: State<'_, Mutex<AppState>>) -> u32 {
    let mut s = state.lock().unwrap();
    s.counter += 1;
    s.counter
}

#[tauri::command]
fn add_item(item: String, state: State<'_, Mutex<AppState>>) {
    state.lock().unwrap().items.push(item);
}

// In builder:
tauri::Builder::default()
    .manage(Mutex::new(AppState { counter: 0, items: vec![] }))
    .invoke_handler(tauri::generate_handler![get_count, increment, add_item])
```

### 带窗口访问的 Command

**Rust：**
```rust
use tauri::{WebviewWindow, AppHandle};

#[tauri::command]
fn get_window_info(window: WebviewWindow) -> String {
    format!("Window label: {}", window.label())
}

#[tauri::command]
fn create_window(app: AppHandle) -> Result<(), String> {
    tauri::WebviewWindowBuilder::new(
        &app,
        "new-window",
        tauri::WebviewUrl::App("index.html".into())
    )
    .title("New Window")
    .build()
    .map_err(|e| e.to_string())?;
    Ok(())
}
```

### 带原始二进制数据的 Command

**Rust：**
```rust
use tauri::ipc::Response;

#[tauri::command]
fn read_binary_file(path: String) -> Result<Response, String> {
    let data = std::fs::read(&path).map_err(|e| e.to_string())?;
    Ok(Response::new(data)) // Avoids JSON serialization overhead
}

#[tauri::command]
fn upload_file(request: tauri::ipc::Request) -> Result<(), String> {
    let tauri::ipc::InvokeBody::Raw(data) = request.body() else {
        return Err("Expected raw body".into());
    };
    std::fs::write("upload.bin", data).map_err(|e| e.to_string())
}
```

**前端：**
```typescript
// Reading binary
const data = await invoke<ArrayBuffer>('read_binary_file', { path: '/file.bin' });

// Uploading binary
const fileData = new Uint8Array([1, 2, 3, 4]);
await invoke('upload_file', fileData);
```

---

## Events

> **需要导入 trait：** `use tauri::Emitter;` 以在 `AppHandle`/`WebviewWindow` 上调用 `.emit()`。`use tauri::Listener;` 以在 `App`/`AppHandle` 上调用 `.listen()`。这些 trait 必须在作用域内。

### 从 Rust 向前端 Emit

**Rust：**
```rust
use tauri::Emitter;

#[tauri::command]
fn start_background_task(app: tauri::AppHandle) {
    std::thread::spawn(move || {
        for i in 0..100 {
            std::thread::sleep(std::time::Duration::from_millis(100));
            app.emit("progress", i).unwrap();
        }
        app.emit("complete", "Task finished").unwrap();
    });
}

// Emit to specific window
#[tauri::command]
fn notify_window(app: tauri::AppHandle, window_label: String, message: String) {
    app.emit_to(&window_label, "notification", message).unwrap();
}
```

**前端：**
```typescript
import { listen, once } from '@tauri-apps/api/event';

// Listen continuously
const unlisten = await listen<number>('progress', (event) => {
    console.log(`Progress: ${event.payload}%`);
});

// Listen once
await once<string>('complete', (event) => {
    console.log(event.payload);
});

// Clean up when done
unlisten();
```

### 从前端向 Rust Emit

**前端：**
```typescript
import { emit } from '@tauri-apps/api/event';

await emit('user-action', { action: 'click', target: 'button' });
```

**Rust（在 setup 或 command 中）：**
```rust
use tauri::Listener;

fn setup_listeners(app: &tauri::App) {
    app.listen("user-action", |event| {
        println!("User action: {:?}", event.payload());
    });
}
```

### 窗口特定 Events

**Rust：**
```rust
use tauri::{Emitter, WebviewWindow};

#[tauri::command]
fn emit_to_window(window: WebviewWindow, message: String) {
    window.emit("window-message", message).unwrap();
}
```

---

## 类型化流式 Channels

`Channel<TSend>` 是一个类型化流式原语。类型参数 `TSend` 定义了可以发送的消息。Rust 和 TypeScript 必须在形状上保持一致：
- Rust：`Channel<MyEvent>` 其中 `MyEvent: serde::Serialize + Clone`
- 前端：`new Channel<MyEvent>()` 带有匹配的 TypeScript 类型
- 在 enum 上使用 `#[serde(tag = "event", content = "data")]` 实现判别联合模式。

**Rust：**
```rust
use tauri::ipc::Channel;

#[derive(Clone, serde::Serialize)]
struct ProgressUpdate {
    current: u32,
    total: u32,
    message: String,
}

#[tauri::command]
async fn process_files(
    files: Vec<String>,
    on_progress: Channel<ProgressUpdate>
) -> Result<(), String> {
    let total = files.len() as u32;

    for (i, file) in files.iter().enumerate() {
        // Process file...
        on_progress.send(ProgressUpdate {
            current: i as u32 + 1,
            total,
            message: format!("Processing {}", file),
        }).unwrap();
    }

    Ok(())
}
```

**前端：**
```typescript
import { invoke, Channel } from '@tauri-apps/api/core';

interface ProgressUpdate {
    current: number;
    total: number;
    message: string;
}

const channel = new Channel<ProgressUpdate>();
channel.onmessage = (update) => {
    const percent = (update.current / update.total) * 100;
    console.log(`${percent}% - ${update.message}`);
};

await invoke('process_files', {
    files: ['file1.txt', 'file2.txt'],
    onProgress: channel
});
```

### 标签联合 Events（判别式）

**Rust：**
```rust
use tauri::ipc::Channel;

#[derive(Clone, serde::Serialize)]
#[serde(tag = "event", content = "data")]
enum DownloadEvent {
    Started { url: String, size: u64 },
    Progress { downloaded: u64, total: u64 },
    Complete { path: String },
    Error { message: String },
}

#[tauri::command]
async fn download_file(
    url: String,
    on_event: Channel<DownloadEvent>
) -> Result<String, String> {
    on_event.send(DownloadEvent::Started {
        url: url.clone(),
        size: 1000,
    }).unwrap();

    for i in 0..=100 {
        on_event.send(DownloadEvent::Progress {
            downloaded: i * 10,
            total: 1000,
        }).unwrap();
        tokio::time::sleep(std::time::Duration::from_millis(10)).await;
    }

    let path = "/downloads/file.zip".to_string();
    on_event.send(DownloadEvent::Complete {
        path: path.clone(),
    }).unwrap();

    Ok(path)
}
```

**前端：**
```typescript
import { invoke, Channel } from '@tauri-apps/api/core';

type DownloadEvent =
    | { event: 'Started'; data: { url: string; size: number } }
    | { event: 'Progress'; data: { downloaded: number; total: number } }
    | { event: 'Complete'; data: { path: string } }
    | { event: 'Error'; data: { message: string } };

const channel = new Channel<DownloadEvent>();
channel.onmessage = (msg) => {
    switch (msg.event) {
        case 'Started':
            console.log(`Starting download: ${msg.data.url} (${msg.data.size} bytes)`);
            break;
        case 'Progress':
            const percent = (msg.data.downloaded / msg.data.total) * 100;
            console.log(`Download: ${percent.toFixed(1)}%`);
            break;
        case 'Complete':
            console.log(`Downloaded to: ${msg.data.path}`);
            break;
        case 'Error':
            console.error(`Download failed: ${msg.data.message}`);
            break;
    }
};

const path = await invoke<string>('download_file', {
    url: 'https://example.com/file.zip',
    onEvent: channel
});
```

---

## IPC 选择指南

| 模式 | 用例 | 方向 | 频率 |
|------|------|------|------|
| **Commands** | 请求-响应、数据获取 | 前端 → Rust | 一次性 |
| **Events** | 通知、状态变更 | 双向 | 低-中 |
| **Channels** | 进度更新、流式数据 | Rust → 前端 | 高 |

### 何时使用每种方式

**Commands（invoke）**
- 从 Rust 获取数据
- 执行操作并返回结果
- CRUD 操作
- 最常见的模式

**Events（emit/listen）**
- 通知 UI 后台变更
- 广播到多个窗口
- 即发即弃的通知
- 系统事件（窗口关闭、最小化）

**Channels**
- 文件下载/上传进度
- 带更新的长时间运行操作
- 流式日志输出
- 实时数据推送
