# Tauri v2+ 更新器与分发参考

## 目录

- 第 1 部分：更新器（tauri-plugin-updater）
- 第 2 部分：分发与签名
- 第 3 部分：打包配置

> **签名对于生产环境更新是强制性的。** 未签名的工件将被 Tauri 更新器拒绝。生产环境更新端点必须使用 HTTPS。

## 第 1 部分：更新器（tauri-plugin-updater）

### 安装
```bash
cargo tauri add updater
```

### 配置（tauri.conf.json）
```json
{
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": ["https://your-server.com/update/{{target}}/{{current_version}}"],
      "pubkey": "BASE64_PUBLIC_KEY_HERE",
      "dialog": true
    }
  }
}
```
- **Endpoints：** HTTPS URL 数组。
- **Pubkey：** Base64 编码的公钥。
- **Dialog：** 布尔值，是否显示内置更新对话框。
- **HTTPS：** 生产环境中端点必须使用 HTTPS。

### 密钥生成
```bash
cargo tauri signer generate -w ~/.tauri/myapp.key
```
输出：私钥文件 + 公钥字符串。
- 安全存储私钥。切勿提交到仓库。
- 为 CI/CD 设置 `TAURI_SIGNING_PRIVATE_KEY` 环境变量。
- 如果密钥已加密，设置 `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`。
- 将公钥添加到 `tauri.conf.json` 的 `plugins.updater.pubkey`。

### 签名构建
```bash
TAURI_SIGNING_PRIVATE_KEY=... cargo tauri build
```
生成：安装程序文件 + `.sig` 签名文件。
两个文件都必须从你的更新服务器提供。

### 更新服务器响应格式
更新端点必须返回以下 JSON 格式：
```json
{
  "version": "1.0.1",
  "notes": "Bug fixes",
  "pub_date": "2026-04-02T00:00:00Z",
  "platforms": {
    "darwin-aarch64": {
      "signature": "<content of .sig file>",
      "url": "https://your-server/MyApp_1.0.1_aarch64.dmg"
    },
    "windows-x86_64": {
      "signature": "<content of .sig file>",
      "url": "https://your-server/MyApp_1.0.1_x64-setup.exe"
    }
  }
}
```

### 能力权限
updater 插件需要能力权限：`updater:default`

### 在代码中检查更新
```rust
use tauri_plugin_updater::UpdaterExt;

#[tauri::command]
async fn check_for_updates(app: tauri::AppHandle) -> Result<String, String> {
    let update = app.updater().map_err(|e| e.to_string())?
        .check().await.map_err(|e| e.to_string())?;
    
    if let Some(update) = update {
        update.download_and_install(|_, _| {}, || {})
            .await.map_err(|e| e.to_string())?;
        Ok("Updated".to_string())
    } else {
        Ok("Already up to date".to_string())
    }
}
```

## 第 2 部分：分发与签名

### macOS
- 代码签名需要 Apple Developer 证书。
- 在 Mac App Store 之外分发需要公证。
- **环境变量：** `APPLE_CERTIFICATE`、`APPLE_CERTIFICATE_PASSWORD`、`APPLE_SIGNING_IDENTITY`、`APPLE_ID`、`APPLE_PASSWORD`、`APPLE_TEAM_ID`。
- 命令：设置环境变量后，`cargo tauri build` 处理签名/公证。
- **包类型：** `.dmg`、`.app`。
- macOS 的 arm64（Apple Silicon）和 x86_64 包是分开的。

### Windows
- 代码签名需要代码签名证书（EV 或 OV）。
- 不签名时，用户会看到 SmartScreen 警告。
- 自签名证书仅适用于开发。
- **签名的环境变量：** 通过 `TAURI_WINDOWS_SIGNING_CERTIFICATE` 或自定义脚本。
- **包类型：** `.msi`（WiX）、`.exe`（NSIS）。
- 在 `tauri.conf.json` 中设置 `bundle.windows.certificateThumbprint` 以直接配置证书。

### Linux
- 没有强制性的代码签名，但发行版打包很重要。
- **包类型：** `.deb`（Debian/Ubuntu）、`.rpm`（Fedora/RHEL）、`.AppImage`（通用）。
- AppImage 可移植但未签名。
- 对于商店分发：使用相应的商店 SDK。

## 第 3 部分：打包配置
`tauri.conf.json` 中的关键 `bundle` 部分：
```json
{
  "bundle": {
    "active": true,
    "targets": "all",
    "identifier": "com.example.myapp",
    "icon": ["icons/32x32.png", "icons/icon.icns", "icons/icon.ico"],
    "resources": [],
    "copyright": "",
    "category": "Utility",
    "shortDescription": "",
    "longDescription": ""
  }
}
```

> *最后验证日期：2026-04-02。查看 [updater 插件更新日志](https://github.com/tauri-apps/plugins-workspace/blob/v2/plugins/updater/CHANGELOG.md)了解签名/密钥格式的任何更新。*
