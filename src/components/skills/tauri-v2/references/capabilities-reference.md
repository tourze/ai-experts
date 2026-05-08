# Tauri v2+ 能力与权限参考

## 目录

- 安全模型：v1 vs v2
- 概述
- 能力文件结构
- 核心权限
- 插件权限
- 作用域
- 权限集
- 窗口和 Webview 定位
- 能力最佳实践
- 常见能力模式
- 反模式

## 安全模型：v1 vs v2

Tauri v2 用基于能力的安全模型取代了 v1 的 `allowlist`。在 v1 中，你在 `tauri.conf.json` 的 `allowlist` 中列出允许的 API 调用。在 v2 中，必须通过 `src-tauri/capabilities/` 中的能力文件显式授予权限。

**三层安全模型：**
- **能力（Capability）**：一个命名的权限集合，作用于特定的窗口/webview。位于 `src-tauri/capabilities/*.json`。
- **权限（Permission）**：授予访问特定命令或功能的标识符（例如 `fs:allow-read-file`）。按插件定义。
- **作用域（Scope）**：权限的可选约束，限制其可以访问的内容（例如仅允许 `$APPDATA/*` 路径）。是权限对象的一部分。

## 概述

Tauri v2+ 使用基于能力的安全模型。能力控制对核心 API、插件权限、远程 URL 以及你显式限定的任何命令集的访问。在 `generate_handler![]` 中注册的普通 `#[tauri::command]` 函数仍然可调用，除非你通过权限或远程访问规则进行限制。

*最后验证日期：2026-04-02。当能力语义或权限名称发生变化时，请查看官方 Tauri 更新日志。*

## 能力文件结构

位置：`src-tauri/capabilities/`

```json
{
    "$schema": "../gen/schemas/desktop-schema.json",
    "identifier": "capability-name",
    "description": "What this capability allows",
    "windows": ["main", "settings"],
    "webviews": [],
    "permissions": [
        "core:default",
        "plugin-name:permission-name"
    ]
}
```

## 核心权限

### 前端使用核心 API 时的常见权限

```json
{
    "permissions": [
        "core:default",
        "core:window:default",
        "core:event:default"
    ]
}
```

### 窗口权限

| 权限 | 描述 |
|------|------|
| `core:window:default` | 基本窗口操作 |
| `core:window:allow-close` | 允许关闭窗口 |
| `core:window:allow-set-title` | 允许更改窗口标题 |
| `core:window:allow-minimize` | 允许最小化 |
| `core:window:allow-maximize` | 允许最大化 |
| `core:window:allow-set-size` | 允许调整大小 |
| `core:window:allow-set-position` | 允许重新定位 |
| `core:window:allow-set-fullscreen` | 允许切换全屏 |

### 事件权限

| 权限 | 描述 |
|------|------|
| `core:event:default` | 基本事件监听 |
| `core:event:allow-emit` | 允许发出事件 |
| `core:event:allow-listen` | 允许监听事件 |

## 插件权限

### 文件系统（`tauri-plugin-fs`）

```json
{
    "permissions": [
        "fs:default",
        "fs:allow-read-dir",
        "fs:allow-read-file",
        "fs:allow-write-file",
        "fs:allow-create-dir",
        "fs:allow-remove-file",
        "fs:allow-rename"
    ]
}
```

**带作用域：**
```json
{
    "permissions": [
        {
            "identifier": "fs:allow-read-file",
            "allow": [
                { "path": "$APPDATA/*" },
                { "path": "$HOME/Documents/*" }
            ]
        }
    ]
}
```

### 对话框（`tauri-plugin-dialog`）

```json
{
    "permissions": [
        "dialog:default",
        "dialog:allow-open",
        "dialog:allow-save",
        "dialog:allow-message",
        "dialog:allow-ask",
        "dialog:allow-confirm"
    ]
}
```

### Shell（`tauri-plugin-shell`）

```json
{
    "permissions": [
        "shell:default",
        "shell:allow-open",
        "shell:allow-execute"
    ]
}
```

**带作用域的 Execute：**
```json
{
    "permissions": [
        {
            "identifier": "shell:allow-execute",
            "allow": [
                { "name": "git", "args": true },
                { "name": "npm", "args": ["install", "run"] }
            ]
        }
    ]
}
```

### HTTP（`tauri-plugin-http`）

```json
{
    "permissions": [
        "http:default"
    ]
}
```

**带 URL 作用域：**
```json
{
    "permissions": [
        {
            "identifier": "http:default",
            "allow": [
                { "url": "https://api.example.com/*" },
                { "url": "https://*.myapp.com/*" }
            ]
        }
    ]
}
```

### Store（`tauri-plugin-store`）

```json
{
    "permissions": [
        "store:default",
        "store:allow-get",
        "store:allow-set",
        "store:allow-delete",
        "store:allow-keys",
        "store:allow-clear"
    ]
}
```

### 剪贴板（`tauri-plugin-clipboard-manager`）

```json
{
    "permissions": [
        "clipboard-manager:default",
        "clipboard-manager:allow-read",
        "clipboard-manager:allow-write"
    ]
}
```

### 通知（`tauri-plugin-notification`）

```json
{
    "permissions": [
        "notification:default",
        "notification:allow-send",
        "notification:allow-request-permission"
    ]
}
```

### 全局快捷键（`tauri-plugin-global-shortcut`）

```json
{
    "permissions": [
        "global-shortcut:default",
        "global-shortcut:allow-register",
        "global-shortcut:allow-unregister"
    ]
}
```

## 权限集

权限集允许将多个权限分组为一个可重用的标识符。你可以使用插件提供的预设权限集（如 `fs:default`），或在 `src-tauri/permissions/` 中定义自己的权限集。

```json
{
  "permissions": [
    "fs:default",          // 权限集：包含常见 fs 操作
    "fs:allow-read-file",  // 单个权限：特定操作
    {
      "identifier": "fs:allow-read-file",  // 带作用域的权限
      "allow": [{ "path": "$APPDATA/*" }]
    }
  ]
}
```

## 平台特定能力

```json
{
    "identifier": "desktop-only",
    "platforms": ["linux", "macos", "windows"],
    "permissions": ["global-shortcut:default"]
}
```

```json
{
    "identifier": "mobile-only",
    "platforms": ["iOS", "android"],
    "permissions": ["biometric:default", "haptics:default"]
}
```

## 窗口和 Webview 定位

能力通过标签应用到特定的窗口和 webview。一个窗口或 webview 可以属于多个能力，此时它们的权限会合并。

```json
{
  "identifier": "main-window-cap",
  "windows": ["main"],        // 按窗口标签定位
  "webviews": [],             // 或者定位特定 webview
  "permissions": ["core:default", "fs:default"]
}
```

## 远程 URL 访问

允许从远程 URL 调用 Tauri 命令：

```json
{
    "identifier": "remote-access",
    "remote": {
        "urls": ["https://*.myapp.com"]
    },
    "permissions": ["http:default"]
}
```

## 自定义权限文件

在 `src-tauri/permissions/` 中创建自定义权限：

**`custom.toml`：**
```toml
[[permission]]
identifier = "allow-home-documents"
description = "Allow access to home documents"
commands.allow = ["read_file", "write_file"]

[[scope.allow]]
path = "$HOME/Documents/**"
```

在能力中引用：
```json
{
    "permissions": ["custom:allow-home-documents"]
}
```

## 能力最佳实践

1. **最小权限原则**：只授予所需权限
2. **使用作用域**：将文件/URL 访问限制到特定路径
3. **分离能力**：为不同功能创建聚焦的能力文件
4. **平台特定**：对平台特定功能使用平台过滤
5. **记录说明**：添加描述解释为什么需要权限

**另见：** [插件参考](./plugin-reference.md)查看插件特定的权限字符串 | [高级运行时](./advanced-runtime-reference.md)查看 tray/sidecar 能力

## 反模式：盲目信任默认权限

`cargo tauri add <plugin>` 通常会自动添加插件的默认权限，但这 **不包括** 非默认权限、自定义作用域、远程 URL 或窗口特定的能力定位。在假设插件已就绪之前，始终重新检查生成的能力文件。

## 常见能力模式

### 使用前端核心 API 的最小应用

```json
{
    "identifier": "minimal",
    "windows": ["main"],
    "permissions": ["core:default"]
}
```

### 文件管理器

```json
{
    "identifier": "file-manager",
    "windows": ["main"],
    "permissions": [
        "core:default",
        "fs:default",
        "dialog:allow-open",
        "dialog:allow-save"
    ]
}
```

### 联网应用

```json
{
    "identifier": "web-app",
    "windows": ["main"],
    "permissions": [
        "core:default",
        "http:default",
        "shell:allow-open"
    ]
}
```

### 完整桌面应用

```json
{
    "identifier": "full-desktop",
    "windows": ["main"],
    "permissions": [
        "core:default",
        "core:window:default",
        "core:event:default",
        "fs:default",
        "dialog:default",
        "shell:default",
        "clipboard-manager:default",
        "notification:default",
        "global-shortcut:default",
        "store:default"
    ]
}
```
