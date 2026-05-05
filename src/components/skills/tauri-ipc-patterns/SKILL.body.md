## 适用场景
- 自定义错误类型替代 `Result<T, String>`
- 判别联合事件、多窗口精确路由
- `Channel<T>` 高频推送、二进制零拷贝
- 自定义命令权限定义、批量命令优化

## 核心约束
- 错误类型必须 impl `serde::Serialize`，序列化为结构体非纯字符串
- 事件枚举用 `#[serde(tag = "event", content = "data")]`
- `Channel<T>` 单命令高频流；`emit()` 广播；`invoke()` 请求-响应
- 权限标识符遵循 `<plugin>:<action>-<command>` 约定
- 多窗口必须 `emit_to()` / `emit_filter()` 精确路由
- 二进制用 `tauri::ipc::Request/Response` 零拷贝
- 超 1ms 同步命令必须改 async
- 批量模式单次 invoke 传操作数组减少往返

## 代码模式

- [高级 IPC 模式](references/ipc-advanced-patterns.md)

## 检查清单
- 错误是否序列化为结构化 JSON？
- 事件枚举与前端 TS 类型一一对应？
- 权限文件在 `permissions/` 并被 capability 引用？

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
