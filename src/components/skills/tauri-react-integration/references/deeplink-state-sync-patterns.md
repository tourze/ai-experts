# Tauri v2 + React 深链接与状态同步

## 模式 3：React Router + Tauri 深链接

**Rust 端转发：**
```rust
use tauri::{Emitter, Manager};
use tauri_plugin_deep_link::DeepLinkExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_deep_link::init())
        .setup(|app| {
            let handle = app.handle().clone();
            app.deep_link().on_open_url(move |event| {
                if let Some(url) = event.urls().first() {
                    handle.emit("deep-link", url.to_string()).unwrap();
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**tauri.conf.json：**
```json
{ "plugins": { "deep-link": { "desktop": [{ "schemes": ["myapp"] }] } } }
```

**React 路由处理：**
```tsx
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { useTauriEvent } from "./hooks/useTauriEvent";

function DeepLinkHandler() {
  const navigate = useNavigate();
  useTauriEvent<string>("deep-link", (url) => {
    try {
      const parsed = new URL(url);
      navigate(parsed.pathname.replace(/^\/\//, "/"));
    } catch { console.warn("Invalid deep link:", url); }
  });
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <DeepLinkHandler />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/notes/:id" element={<NoteDetail />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 模式 4：Rust-React 状态同步

**Rust 端：**
```rust
use std::sync::Mutex;
use tauri::{Emitter, State};

#[derive(Clone, serde::Serialize)]
struct AppSettings { theme: String, language: String, auto_save: bool }

#[tauri::command]
fn get_settings(state: State<'_, Mutex<AppSettings>>) -> AppSettings {
    state.lock().unwrap().clone()
}

#[tauri::command]
fn update_settings(
    patch: serde_json::Value,
    state: State<'_, Mutex<AppSettings>>,
    app: tauri::AppHandle,
) -> Result<AppSettings, String> {
    let mut s = state.lock().unwrap();
    if let Some(v) = patch.get("theme").and_then(|v| v.as_str()) { s.theme = v.into(); }
    if let Some(v) = patch.get("language").and_then(|v| v.as_str()) { s.language = v.into(); }
    if let Some(v) = patch.get("autoSave").and_then(|v| v.as_bool()) { s.auto_save = v; }
    let updated = s.clone();
    app.emit("settings-changed", &updated).unwrap();
    Ok(updated)
}
```

**Zustand store + 事件同步：**
```typescript
import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

interface AppSettings { theme: string; language: string; auto_save: boolean; }

interface SettingsStore {
  settings: AppSettings | null;
  fetch: () => Promise<void>;
  update: (patch: Partial<AppSettings>) => Promise<void>;
  _sync: (s: AppSettings) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: null,
  fetch: async () => { set({ settings: await invoke<AppSettings>("get_settings") }); },
  update: async (patch) => { set({ settings: await invoke<AppSettings>("update_settings", { patch }) }); },
  _sync: (s) => set({ settings: s }),
}));
```

**根组件挂载：**
```tsx
import { useEffect } from "react";
import { useTauriEvent } from "../hooks/useTauriEvent";
import { useSettingsStore } from "../stores/useSettingsStore";

export function SettingsSync() {
  const fetch = useSettingsStore((s) => s.fetch);
  const sync = useSettingsStore((s) => s._sync);
  useEffect(() => { fetch(); }, [fetch]);
  useTauriEvent<{ theme: string; language: string; auto_save: boolean }>(
    "settings-changed", sync
  );
  return null;
}
```
