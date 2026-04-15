# Tauri v2 构建与分发代码模式

## 模式 1：完整 bundle 配置（图标、资源、sidecar）

```json
// src-tauri/tauri.conf.json
{
  "productName": "MyApp",
  "version": "1.0.0",
  "identifier": "com.example.myapp",
  "build": {
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:5173",
    "beforeBuildCommand": "npm run build",
    "frontendDist": "../dist"
  },
  "app": {
    "security": {
      "csp": "default-src 'self'; img-src 'self' asset: https://asset.localhost; style-src 'self' 'unsafe-inline'"
    },
    "windows": [
      {
        "title": "MyApp",
        "width": 1200,
        "height": 800,
        "minWidth": 800,
        "minHeight": 600
      }
    ]
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "resources": [
      "resources/templates/*",
      "resources/dictionaries/*.dat"
    ],
    "externalBin": [
      "binaries/ffmpeg"
    ],
    "copyright": "Copyright (c) 2026 Example Inc.",
    "category": "Productivity",
    "shortDescription": "A productivity app built with Tauri",
    "macOS": {
      "entitlements": null,
      "signingIdentity": null,
      "minimumSystemVersion": "10.15"
    },
    "windows": {
      "certificateThumbprint": null,
      "digestAlgorithm": "sha256",
      "timestampUrl": "http://timestamp.digicert.com",
      "nsis": { "installMode": "both" }
    },
    "linux": {
      "deb": {
        "depends": ["libwebkit2gtk-4.1-0", "libgtk-3-0"],
        "section": "utils"
      },
      "appimage": { "bundleMediaFramework": true }
    }
  }
}
```

**运行时访问打包资源：**
```rust
use tauri::Manager;

#[tauri::command]
async fn load_template(app: tauri::AppHandle, name: String) -> Result<String, String> {
    let resource_path = app
        .path()
        .resolve(
            format!("resources/templates/{name}"),
            tauri::path::BaseDirectory::Resource,
        )
        .map_err(|e| e.to_string())?;
    tokio::fs::read_to_string(resource_path)
        .await
        .map_err(|e| e.to_string())
}
```

---

## 模式 2：GitHub Actions 多平台构建 + 签名 + 发布

```yaml
# .github/workflows/release.yml
name: Release
on:
  push:
    tags: ["v*"]

permissions:
  contents: write

jobs:
  build:
    strategy:
      fail-fast: false
      matrix:
        include:
          - platform: macos-latest
            args: "--target aarch64-apple-darwin"
            rust_target: aarch64-apple-darwin
          - platform: macos-latest
            args: "--target x86_64-apple-darwin"
            rust_target: x86_64-apple-darwin
          - platform: ubuntu-22.04
            args: ""
            rust_target: x86_64-unknown-linux-gnu
          - platform: windows-latest
            args: ""
            rust_target: x86_64-pc-windows-msvc

    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install Rust toolchain
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: ${{ matrix.rust_target }}

      - name: Cache Rust compilation
        uses: actions/cache@v4
        with:
          path: |
            ~/.cargo/registry
            ~/.cargo/git
            src-tauri/target
          key: rust-${{ matrix.rust_target }}-${{ hashFiles('src-tauri/Cargo.lock') }}
          restore-keys: |
            rust-${{ matrix.rust_target }}-

      - name: Install Linux dependencies
        if: matrix.platform == 'ubuntu-22.04'
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf

      - name: Install frontend dependencies
        run: npm ci

      - name: Build Tauri app
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
          TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
          APPLE_CERTIFICATE: ${{ secrets.APPLE_CERTIFICATE }}
          APPLE_CERTIFICATE_PASSWORD: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}
          APPLE_SIGNING_IDENTITY: ${{ secrets.APPLE_SIGNING_IDENTITY }}
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_PASSWORD: ${{ secrets.APPLE_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
        with:
          tagName: ${{ github.ref_name }}
          releaseName: "v__VERSION__"
          releaseBody: "See the assets to download this version."
          releaseDraft: true
          prerelease: false
          args: ${{ matrix.args }}
```

---

## 模式 3：自动更新配置与密钥管理

**生成密钥对：**
```bash
cargo tauri signer generate -w ~/.tauri/myapp.key
# Store private key as CI secret: TAURI_SIGNING_PRIVATE_KEY
```

**tauri.conf.json 更新段：**
```json
{
  "plugins": {
    "updater": {
      "active": true,
      "dialog": false,
      "endpoints": [
        "https://releases.example.com/myapp/{{target}}/{{current_version}}"
      ],
      "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIH..."
    }
  }
}
```

**Rust 检查与安装更新：**
```rust
use tauri_plugin_updater::UpdaterExt;

#[tauri::command]
async fn check_update(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let update = app.updater().map_err(|e| e.to_string())?
        .check().await.map_err(|e| e.to_string())?;
    match update {
        Some(u) => Ok(Some(u.version.clone())),
        None => Ok(None),
    }
}

#[tauri::command]
async fn install_update(app: tauri::AppHandle) -> Result<(), String> {
    let update = app.updater().map_err(|e| e.to_string())?
        .check().await.map_err(|e| e.to_string())?;
    if let Some(update) = update {
        update.download_and_install(|dl, total| {
            println!("Downloaded {dl} / {total:?}");
        }, || {
            println!("Installing...");
        }).await.map_err(|e| e.to_string())?;
    }
    Ok(())
}
```

**更新服务器响应格式：**
```json
{
  "version": "1.1.0",
  "notes": "Bug fixes and performance improvements",
  "pub_date": "2026-04-15T00:00:00Z",
  "platforms": {
    "darwin-aarch64": {
      "signature": "<content of .sig file>",
      "url": "https://releases.example.com/myapp/v1.1.0/MyApp_aarch64.dmg"
    },
    "windows-x86_64": {
      "signature": "<content of .sig file>",
      "url": "https://releases.example.com/myapp/v1.1.0/MyApp_x64-setup.exe"
    }
  }
}
```

---

## 模式 4：构建优化（体积 + 启动速度）

**Cargo release profile：**
```toml
# src-tauri/Cargo.toml
[profile.release]
panic = "abort"
codegen-units = 1
lto = true
opt-level = "s"
strip = true
```

**Vite 前端优化：**
```javascript
// vite.config.ts
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "esnext",
    minify: "terser",
    rollupOptions: {
      output: { manualChunks: undefined },
    },
    reportCompressedSize: false,
  },
});
```

**检查产物体积：**
```bash
cargo bloat --release --crates
du -sh src-tauri/target/release/bundle/*
```
