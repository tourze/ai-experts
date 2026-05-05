## 代码模式

- [高级 IPC 模式](references/ipc-advanced-patterns.md)

## 反模式

### FAIL: String 错误

```rust
#[tauri::command]
fn save_file(path: String) -> Result<(), String> {
    fs::write(path, data).map_err(|e| e.to_string()) // 前端只能 match 字符串
}
```

### PASS: 结构化错误

```rust
#[derive(serde::Serialize)]
#[serde(tag = "kind", content = "message")]
enum AppError { NotFound(String), PermissionDenied(String), Io(String) }

#[tauri::command]
fn save_file(path: String) -> Result<(), AppError> { ... } // 前端 if (err.kind === 'PermissionDenied')
```

### FAIL: emit 广播隐私数据

```rust
app.emit("user-profile", &sensitive_profile)?; // 所有窗口都能收到
```

### PASS: emit_to 精确路由

```rust
app.emit_to("main-window", "user-profile", &profile)?; // 只给目标窗口
```

详见 [references/](references/)。
