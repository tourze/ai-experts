# Tauri v2 插件开发代码模式

## 模式 1：最小插件脚手架（Rust + JS 绑定）

```bash
cargo tauri plugin new my-plugin
```

**Rust 插件入口：**
```rust
// tauri-plugin-my-plugin/src/lib.rs
use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime,
};

mod commands;

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("my-plugin")
        .invoke_handler(tauri::generate_handler![
            commands::ping,
            commands::echo,
        ])
        .build()
}
```

**命令实现：**
```rust
// tauri-plugin-my-plugin/src/commands.rs
use tauri::command;

#[command]
pub async fn ping() -> String {
    "pong".to_string()
}

#[command]
pub async fn echo(message: String) -> String {
    message
}
```

**JS 绑定：**
```typescript
// tauri-plugin-my-plugin/guest-js/index.ts
import { invoke } from "@tauri-apps/api/core";

export async function ping(): Promise<string> {
  return invoke<string>("plugin:my-plugin|ping");
}

export async function echo(message: string): Promise<string> {
  return invoke<string>("plugin:my-plugin|echo", { message });
}
```

**宿主应用注册：**
```rust
// src-tauri/src/lib.rs
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_my_plugin::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

---

## 模式 2：平台特定代码（桌面 vs 移动）

**公共 trait + 平台选择：**
```rust
// tauri-plugin-biometric/src/lib.rs
use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime,
};

mod commands;

#[cfg(desktop)]
mod desktop;
#[cfg(mobile)]
mod mobile;

pub trait BiometricExt {
    fn is_available(&self) -> bool;
    fn authenticate(&self, reason: String) -> Result<bool, String>;
}

#[cfg(desktop)]
use desktop::Biometric;
#[cfg(mobile)]
use mobile::Biometric;

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("biometric")
        .setup(|app, _api| {
            app.manage(Biometric::new());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::check_available,
            commands::authenticate,
        ])
        .build()
}
```

**桌面实现：**
```rust
// tauri-plugin-biometric/src/desktop.rs
use crate::BiometricExt;

pub struct Biometric;

impl Biometric {
    pub fn new() -> Self { Self }
}

impl BiometricExt for Biometric {
    fn is_available(&self) -> bool {
        cfg!(target_os = "macos")
    }

    fn authenticate(&self, _reason: String) -> Result<bool, String> {
        #[cfg(target_os = "macos")]
        { Ok(true) } // Call LocalAuthentication via objc
        #[cfg(not(target_os = "macos"))]
        { Err("Not available".into()) }
    }
}
```

**移动实现：**
```rust
// tauri-plugin-biometric/src/mobile.rs
use crate::BiometricExt;

pub struct Biometric;

impl Biometric {
    pub fn new() -> Self { Self }
}

impl BiometricExt for Biometric {
    fn is_available(&self) -> bool { true }

    fn authenticate(&self, _reason: String) -> Result<bool, String> {
        Ok(true) // Call native API via JNI / Swift bridge
    }
}
```

**命令层：**
```rust
// tauri-plugin-biometric/src/commands.rs
use tauri::{command, State};
use crate::{Biometric, BiometricExt};

#[command]
pub fn check_available(bio: State<'_, Biometric>) -> bool {
    bio.is_available()
}

#[command]
pub fn authenticate(reason: String, bio: State<'_, Biometric>) -> Result<bool, String> {
    bio.authenticate(reason)
}
```

---

## 模式 3：带配置与独立状态的插件

**Builder 模式配置：**
```rust
// tauri-plugin-analytics/src/lib.rs
use std::sync::Mutex;
use tauri::{
    plugin::{Builder, TauriPlugin},
    Manager, Runtime,
};

pub struct AnalyticsConfig {
    pub endpoint: String,
    pub api_key: String,
    pub batch_size: usize,
}

pub struct AnalyticsState {
    config: AnalyticsConfig,
    queue: Mutex<Vec<serde_json::Value>>,
}

pub struct AnalyticsBuilder {
    config: AnalyticsConfig,
}

impl AnalyticsBuilder {
    pub fn new(endpoint: impl Into<String>, api_key: impl Into<String>) -> Self {
        Self {
            config: AnalyticsConfig {
                endpoint: endpoint.into(),
                api_key: api_key.into(),
                batch_size: 20,
            },
        }
    }

    pub fn batch_size(mut self, size: usize) -> Self {
        self.config.batch_size = size;
        self
    }

    pub fn build<R: Runtime>(self) -> TauriPlugin<R> {
        Builder::new("analytics")
            .setup(move |app, _api| {
                app.manage(AnalyticsState {
                    config: self.config,
                    queue: Mutex::new(Vec::new()),
                });
                Ok(())
            })
            .on_event(|app, event| {
                if let tauri::RunEvent::Exit = event {
                    if let Some(state) = app.try_state::<AnalyticsState>() {
                        let queue = state.queue.lock().unwrap();
                        if !queue.is_empty() {
                            // Flush remaining events
                        }
                    }
                }
            })
            .build()
    }
}
```

**宿主注册：**
```rust
tauri::Builder::default()
    .plugin(
        tauri_plugin_analytics::AnalyticsBuilder::new(
            "https://analytics.example.com/v1/events",
            "ak_prod_xxxx",
        )
        .batch_size(50)
        .build(),
    )
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
```

---

## 模式 4：插件权限定义

```toml
# permissions/default.toml
[default]
description = "Default permissions for analytics plugin"
permissions = ["allow-track-event"]
```

```toml
# permissions/allow-track-event.toml
[[permission]]
identifier = "allow-track-event"
description = "Allow tracking analytics events"
commands.allow = ["track_event"]
```

```toml
# permissions/allow-flush.toml
[[permission]]
identifier = "allow-flush"
description = "Allow manually flushing analytics queue"
commands.allow = ["flush"]
```

```toml
# permissions/full.toml
[[set]]
identifier = "full"
description = "Full analytics permissions"
permissions = ["allow-track-event", "allow-flush"]
```

**宿主 capability 引用：**
```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "main-window",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "analytics:default",
    "analytics:allow-flush"
  ]
}
```
