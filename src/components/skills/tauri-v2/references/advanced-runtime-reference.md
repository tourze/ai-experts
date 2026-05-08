# Tauri v2+ 高级运行时参考

## 目录

- 系统托盘（`TrayIconBuilder`）
- Sidecar（外部二进制文件）
- Deep Links（`tauri-plugin-deep-link`）
- 自定义协议

> 涵盖系统托盘集成、sidecar 进程、deep links 和自定义协议。
> *最后验证日期：2026-04-02。查看官方 Tauri v2+ 文档了解更新。*

**另见：**
- [plugin-reference.md](plugin-reference.md) — 插件安装和权限
- [capabilities-reference.md](capabilities-reference.md) — 能力/权限模型

## 第一节：系统托盘（`TrayIconBuilder`）

> **v2 变更：** v1 中的 `SystemTray` 在 v2 中被 `TrayIconBuilder` 取代。不要使用 `SystemTray`。

```rust
// 在 lib.rs 的 run() 函数中，setup hook 内：
use tauri::{
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};

tauri::Builder::default()
    .setup(|app| {
        let tray = TrayIconBuilder::new()
            .icon(app.default_window_icon().unwrap().clone())
            .tooltip("My App")
            .on_tray_icon_event(|tray, event| {
                if let TrayIconEvent::Click {
                    button: MouseButton::Left,
                    button_state: MouseButtonState::Up,
                    ..
                } = event
                {
                    let app = tray.app_handle();
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            })
            .build(app)?;
        Ok(())
    })
```

显示托盘菜单示例：

```rust
use tauri::menu::{Menu, MenuItem};

let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
let menu = Menu::with_items(app, &[&quit_item])?;
let tray = TrayIconBuilder::new()
    .icon(app.default_window_icon().unwrap().clone())
    .menu(&menu)
    .on_menu_event(|app, event| match event.id.as_ref() {
        "quit" => app.exit(0),
        _ => {}
    })
    .build(app)?;
```

平台说明：
- **macOS：** 托盘图标出现在菜单栏；支持模板图像
- **Windows：** 托盘图标在系统托盘中；点击事件与 macOS 不同
- **Linux：** 托盘支持因桌面环境而异（需要 `libappindicator` 或 `libayatana-appindicator`）

## 第二节：Sidecar（外部二进制文件）

显示捆绑可执行文件的配置和用法：

```json
// tauri.conf.json
{
  "bundle": {
    "externalBin": [
      "binaries/my-sidecar"
    ]
  }
}
```

所需的能力权限：

```json
{
  "permissions": [
    {
      "identifier": "shell:allow-execute",
      "allow": [
        { "name": "my-sidecar", "args": true, "sidecar": true }
      ]
    }
  ]
}
```

执行 sidecar 的 Rust 代码：

```rust
use tauri_plugin_shell::ShellExt;

#[tauri::command]
async fn run_sidecar(app: tauri::AppHandle) -> Result<String, String> {
    let output = app.shell()
        .sidecar("my-sidecar")
        .map_err(|e| e.to_string())?
        .args(["--flag", "value"])
        .output()
        .await
        .map_err(|e| e.to_string())?;
    
    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}
```

二进制文件命名约定（用于跨平台打包）：
- **macOS（Intel）：** `my-sidecar-x86_64-apple-darwin`
- **macOS（ARM）：** `my-sidecar-aarch64-apple-darwin`
- **Windows：** `my-sidecar-x86_64-pc-windows-msvc.exe`
- **Linux：** `my-sidecar-x86_64-unknown-linux-gnu`

## 第三节：Deep Links（`tauri-plugin-deep-link`）

```bash
cargo tauri add deep-link
```

tauri.conf.json 中的配置：

```json
{
  "plugins": {
    "deep-link": {
      "mobile": [
        { "scheme": "myapp" }
      ],
      "desktop": [
        { "schemes": ["myapp"] }
      ]
    }
  }
}
```

能力：

```json
{ "permissions": ["deep-link:default"] }
```

在 Rust 中处理 deep links：

```rust
use tauri_plugin_deep_link::DeepLinkExt;

app.deep_link().on_open_url(|event| {
    println!("Deep link: {:?}", event.urls());
});
```

平台说明：
- **macOS：** 自动在 Info.plist 中注册 URL scheme
- **Windows：** 安装时创建注册表项
- **Linux：** 需要更新 .desktop 文件
- **iOS/Android：** 分别在各自的平台文件中配置（AndroidManifest.xml 或 Info.plist）

## 第四节：自定义协议

> **适用范围说明：** 自定义协议（`tauri://` 以及通过 `invoke_filter` 或 `asset_protocol` 实现的自定义 scheme）是更高级的功能。主要的官方模式是用于提供本地文件的内置 `asset` 协议。自定义协议处理器需要仔细考虑安全性。

显示 asset 协议访问（最常见的用例）：

```json
// tauri.conf.json
{
  "app": {
    "security": {
      "assetScope": ["$APPDATA/assets/**", "$RESOURCE/**"]
    }
  }
}
```

```typescript
// 通过 asset 协议访问本地文件
const imgSrc = convertFileSrc('/path/to/image.png');
```

注意：完整的自定义协议注册（`tauri::Builder::register_uri_scheme_protocol`）是可用的，但截至 2026-04-02，在官方 v2+ 文档中记载不完整。提供本地文件时优先使用 asset 协议。
