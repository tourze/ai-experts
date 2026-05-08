# Tauri v2+ 插件参考

## 目录

- 通用安装模式
- File System
- Dialog
- Shell
- HTTP
- Store
- Clipboard Manager
- Notification
- Global Shortcut
- Updater
- Deep Link
- Opener
- Process

**重要提示：** 安装插件不是流程的结束。当你使用 `cargo tauri add <plugin>` 时，插件的默认权限通常会自动添加；非默认权限、自定义作用域、远程 URL 访问、多窗口定位和手动安装流程仍然需要在 `src-tauri/capabilities/` 下显式进行能力审查。

*最后验证日期：2026-04-02。当安装流程或权限名称发生变化时，请查看官方插件更新日志。*

## 通用安装模式

对于大多数官方插件，首选安装方法是使用 Tauri CLI：

```bash
cargo tauri add <plugin-name>
```

此命令自动执行：
1. 将 Rust crate 添加到 `src-tauri/Cargo.toml`。
2. 将 JS/TS 包添加到 `package.json`（如适用）。
3. 尝试将插件连接到你的项目中，但你仍应在生成后手动验证 `src-tauri/src/lib.rs` 注册和 `src-tauri/capabilities/*.json`。

## 1. 文件系统（`tauri-plugin-fs`）

访问本地文件系统。

**安装：**
```bash
cargo tauri add fs
```

**Rust 注册**（在 `src-tauri/src/lib.rs` 中）：
```rust
.plugin(tauri_plugin_fs::init())
```

**JS 包：** `@tauri-apps/plugin-fs`

**能力权限**（添加到 `src-tauri/capabilities/*.json`）：
```json
{
  "permissions": ["fs:default"]
}
```

**常见权限：**
- `fs:allow-read-file`：读取文件内容。
- `fs:allow-write-file`：写入/创建文件。
- `fs:allow-read-dir`：列出目录内容。
- `fs:allow-exists`：检查路径是否存在。

**作用域：**
路径访问受作用域限制。常用变量：`$APPDATA`、`$HOME`、`$DOCUMENTS`、`$DOWNLOADS`。
**交叉参考：** 查看 [capabilities-reference.md](capabilities-reference.md) 了解作用域示例。

## 2. 对话框（`tauri-plugin-dialog`）

用于文件选择和消息的原生系统对话框。

**安装：**
```bash
cargo tauri add dialog
```

**Rust 注册**（在 `src-tauri/src/lib.rs` 中）：
```rust
.plugin(tauri_plugin_dialog::init())
```

**JS 包：** `@tauri-apps/plugin-dialog`

**能力权限**（添加到 `src-tauri/capabilities/*.json`）：
```json
{
  "permissions": ["dialog:default"]
}
```

**常见权限：**
- `dialog:allow-open`：打开文件/目录选择器。
- `dialog:allow-save`：保存文件选择器。
- `dialog:allow-message`：显示消息框。
- `dialog:allow-ask`：显示询问对话框（是/否）。

## 3. Shell（`tauri-plugin-shell`）

生成子进程或打开 URL。

**安装：**
```bash
cargo tauri add shell
```

**Rust 注册**（在 `src-tauri/src/lib.rs` 中）：
```rust
.plugin(tauri_plugin_shell::init())
```

**JS 包：** `@tauri-apps/plugin-shell`

**能力权限**（添加到 `src-tauri/capabilities/*.json`）：
```json
{
  "permissions": ["shell:default"]
}
```

**常见权限：**
- `shell:allow-open`：在默认浏览器中打开 URL。
- `shell:allow-execute`：执行任意程序（需要严格的作用域限制）。

**作用域：**
`allow-execute` 需要在能力文件中定义特定的程序和允许的参数。
**交叉参考：** 查看 [capabilities-reference.md](capabilities-reference.md) 了解 shell 作用域示例。

## 4. HTTP（`tauri-plugin-http`）

从 Rust 后端执行 HTTP 请求（绕过 CORS）。

**安装：**
```bash
cargo tauri add http
```

**Rust 注册**（在 `src-tauri/src/lib.rs` 中）：
```rust
.plugin(tauri_plugin_http::init())
```

**JS 包：** `@tauri-apps/plugin-http`

**能力权限**（添加到 `src-tauri/capabilities/*.json`）：
```json
{
  "permissions": ["http:default"]
}
```

**常见权限：**
- `http:default`：基本的请求/响应能力。

**作用域：**
访问可以限制到特定域或 URL 模式。
**交叉参考：** 查看 [capabilities-reference.md](capabilities-reference.md) 了解 URL 作用域示例。

## 5. Store（`tauri-plugin-store`）

简单的键值持久化存储。

**安装：**
```bash
cargo tauri add store
```

**Rust 注册**（在 `src-tauri/src/lib.rs` 中）：
```rust
.plugin(tauri_plugin_store::Builder::default().build())
```

**JS 包：** `@tauri-apps/plugin-store`

**能力权限**（添加到 `src-tauri/capabilities/*.json`）：
```json
{
  "permissions": ["store:default"]
}
```

**常见权限：**
- `store:allow-get`：检索值。
- `store:allow-set`：保存值。
- `store:allow-load`：从磁盘加载 store。

## 6. 剪贴板（`tauri-plugin-clipboard-manager`）

读取和写入系统剪贴板。

**安装：**
```bash
cargo tauri add clipboard-manager
```

**Rust 注册**（在 `src-tauri/src/lib.rs` 中）：
```rust
.plugin(tauri_plugin_clipboard_manager::init())
```

**JS 包：** `@tauri-apps/plugin-clipboard-manager`

**能力权限**（添加到 `src-tauri/capabilities/*.json`）：
```json
{
  "permissions": ["clipboard-manager:default"]
}
```

**常见权限：**
- `clipboard-manager:allow-read`：读取剪贴板内容。
- `clipboard-manager:allow-write`：写入剪贴板。

## 7. 通知（`tauri-plugin-notification`）

发送原生桌面通知。

**安装：**
```bash
cargo tauri add notification
```

**Rust 注册**（在 `src-tauri/src/lib.rs` 中）：
```rust
.plugin(tauri_plugin_notification::init())
```

**JS 包：** `@tauri-apps/plugin-notification`

**能力权限**（添加到 `src-tauri/capabilities/*.json`）：
```json
{
  "permissions": ["notification:default"]
}
```

**常见权限：**
- `notification:allow-send`：触发通知。
- `notification:allow-request-permission`：检查/请求用户权限。

## 8. 全局快捷键（`tauri-plugin-global-shortcut`）

注册系统范围的键盘快捷键。

**安装：**
```bash
cargo tauri add global-shortcut
```

**Rust 注册**（在 `src-tauri/src/lib.rs` 中）：
```rust
.plugin(tauri_plugin_global_shortcut::Builder::new().build())
```

**JS 包：** `@tauri-apps/plugin-global-shortcut`

**能力权限**（添加到 `src-tauri/capabilities/*.json`）：
```json
{
  "permissions": ["global-shortcut:default"]
}
```

**常见权限：**
- `global-shortcut:allow-register`：注册新的快捷键。
- `global-shortcut:allow-is-registered`：检查快捷键是否激活。

**注意：** 仅限桌面端。

## 9. 更新器（`tauri-plugin-updater`）

自动化应用更新。

**安装：**
```bash
cargo tauri add updater
```

**Rust 注册**（在 `src-tauri/src/lib.rs` 中）：
```rust
.plugin(tauri_plugin_updater::Builder::new().build())
```

**JS 包：** `@tauri-apps/plugin-updater`

**能力权限**（添加到 `src-tauri/capabilities/*.json`）：
```json
{
  "permissions": ["updater:default"]
}
```

**常见权限：**
- `updater:allow-check`：检查更新。
- `updater:allow-download-and-install`：执行更新。

**注意：** 需要代码签名和更新服务器/静态 JSON。
**交叉参考：** 查看 [updater-distribution-reference.md](updater-distribution-reference.md) 了解签名要求。

## 10. Deep Link（`tauri-plugin-deep-link`）

注册和处理自定义 URL scheme（例如 `myapp://`）。

**安装：**
```bash
cargo tauri add deep-link
```

**Rust 注册**（在 `src-tauri/src/lib.rs` 中）：
```rust
.plugin(tauri_plugin_deep_link::init())
```

**JS 包：** `@tauri-apps/plugin-deep-link`

**能力权限**（添加到 `src-tauri/capabilities/*.json`）：
```json
{
  "permissions": ["deep-link:default"]
}
```

**常见权限：**
- `deep-link:allow-get-current-url`：检索启动应用的 URL。

## 11. Opener（`tauri-plugin-opener`）

使用系统默认应用打开文件或 URL。替换许多 v2 用例中的 `shell:open`。

**安装：**
```bash
cargo tauri add opener
```

**Rust 注册**（在 `src-tauri/src/lib.rs` 中）：
```rust
.plugin(tauri_plugin_opener::init())
```

**JS 包：** `@tauri-apps/plugin-opener`

**能力权限**（添加到 `src-tauri/capabilities/*.json`）：
```json
{
  "permissions": ["opener:default"]
}
```

**常见权限：**
- `opener:allow-open-url`：打开网站 URL。
- `opener:allow-open-path`：使用关联应用打开本地文件路径。

## 12. 进程（`tauri-plugin-process`）

控制应用进程（重启、退出）。

**安装：**
```bash
cargo tauri add process
```

**Rust 注册**（在 `src-tauri/src/lib.rs` 中）：
```rust
.plugin(tauri_plugin_process::init())
```

**JS 包：** `@tauri-apps/plugin-process`

**能力权限**（添加到 `src-tauri/capabilities/*.json`）：
```json
{
  "permissions": ["process:default"]
}
```

**常见权限：**
- `process:allow-restart`：重启应用。
- `process:allow-exit`：以编程方式退出应用。

---

**另见：** [能力参考](capabilities-reference.md)了解安全模型 | [更新器/分发](updater-distribution-reference.md)了解 updater 插件部署 | [高级运行时](advanced-runtime-reference.md)了解 tray、sidecar 和 deep-link 插件
