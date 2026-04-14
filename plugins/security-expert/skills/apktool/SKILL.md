---
name: apktool
description: "当需要解包 APK、查看 AndroidManifest、资源文件或 smali，并对重打包链路做验证时使用。"
---

# APK 解包与资源分析

## 适用场景
- 需要分析 Manifest、资源、签名配置、网络安全配置或 smali 入口。
- 需要和 [jadx](../jadx/SKILL.md) 配合，分别看 Java 视图与资源/字节码细节。
- 需要验证修改资源后能否重新打包并安装。

## 核心约束
- 保留原始 APK，不在原文件上直接改。
- 先解包看结构，再决定是否改 smali 或资源。
- 重打包后必须重新签名并核验安装链路。
- 把资源层问题与运行时逻辑问题分开处理。

## 代码模式
```bash
apktool d app.apk -o app-decoded
apktool b app-decoded -o app-rebuilt.apk
apksigner verify --print-certs app-rebuilt.apk
```

## 检查清单
- 确认 APK 是否多 dex、是否包含 split 包、是否开启资源混淆。
- 检查 AndroidManifest、network_security_config、provider/exported 状态。
- 修改 smali 前定位调用链和资源引用。
- 重打包后验证签名、安装和运行日志。

## 反模式
- 只看反编译 Java，不看 Manifest 与资源。
- 改了 smali 但不重签名就直接安装。
- 把反编译失败当成 APK 损坏，而不是工具局限。
