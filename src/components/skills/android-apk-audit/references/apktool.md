
# APK 解包与资源分析

## 适用场景
- 需要分析 Manifest、资源、签名配置、网络安全配置或 smali 入口。
- 需要和 [jadx](jadx.md) 配合，分别看 Java 视图与资源/字节码细节。
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

### FAIL: 改 smali 不重签

```bash
apktool b app-decoded -o app-modified.apk
adb install app-modified.apk
# INSTALL_PARSE_FAILED_NO_CERTIFICATES
# Android 拒绝未签名 APK
```

### PASS: 重签 + 验证

```bash
apktool b app-decoded -o app-modified.apk
apksigner sign --ks debug.keystore --ks-pass pass:android app-modified.apk
apksigner verify --print-certs app-modified.apk
adb install app-modified.apk
```

### FAIL: 只看 Java 不看 Manifest

```
反编译 → grep "API_KEY" → 没找到 → "没有硬编码密钥"
→ 实际：API_KEY 在 res/values/strings.xml 或 AndroidManifest meta-data
→ 漏报关键泄漏
```

### PASS: 全面扫描

```bash
apktool d app.apk -o decoded
# Java/smali
rg "API_KEY|secret|token" decoded/smali
# 资源
rg -i "key|secret|token" decoded/res/values/
# Manifest meta-data
xmllint --xpath '//meta-data' decoded/AndroidManifest.xml
```
