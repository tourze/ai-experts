---
name: tauri-build-packaging
description: "在构建、签名、分发 Tauri 应用时使用：bundle 配置、平台目标、代码签名与公证、自动更新、sidecar 打包、CI/CD、体积优化。涉及 cargo tauri build、签名密钥、externalBin、CI 矩阵时触发。"
---

# Tauri v2 构建与分发

## 适用场景
- 配置 bundle 段（图标、资源、sidecar、安装器）
- macOS 公证、Windows Authenticode 签名
- `tauri-plugin-updater` 自动更新
- GitHub Actions 多平台 CI/CD
- 产物体积优化

## 核心约束
- 签名密钥绝不提交仓库；CI secrets 注入
- macOS 需 Developer ID + Notarization
- Windows 需 EV/OV 证书过 SmartScreen
- Updater 密钥用 `cargo tauri signer generate`；私钥存 CI，公钥写 conf
- Sidecar 遵循 `name-{target_triple}` 命名
- `bundle.resources` 运行时通过 `resolve_resource()` 访问
- 干净环境测试构建产物
- CI 分别缓存 `target/` 和 `node_modules/`

## 代码模式

- [构建打包模式](references/build-packaging-patterns.md)

## 检查清单
- 仓库无 `.key` 文件？
- macOS 完整签名链？Windows 有证书？
- Updater pubkey 已填入？端点 HTTPS？
- Release profile 开启 LTO + strip？

## 反模式
- 私钥写 `.env` 并提交
- macOS 只签名不公证
- CI 不缓存 Rust 编译
- Sidecar 不加 target triple
- Release 不开 LTO

详见 [references/](references/)。
