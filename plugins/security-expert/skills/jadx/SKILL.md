---
name: jadx
description: "当需要把 Android APK 或 DEX 反编译为可读 Java/Kotlin 代码，并搜索敏感逻辑时使用。"
---

# APK 反编译与源码审计

## 适用场景
- 需要快速查看移动端业务逻辑、硬编码密钥、接口调用和反调试逻辑。
- 需要与 [apktool](../apktool/SKILL.md) 配合，对照 Manifest、资源与 smali。
- 需要为 [api-fuzzing-bug-bounty](../api-fuzzing-bug-bounty/SKILL.md) 提供移动端接口线索。

## 核心约束
- 先只读反编译，再决定是否修改 smali 或资源。
- 区分反编译器伪代码与真实字节码行为，关键逻辑回看 smali。
- 搜索命中要回到调用链确认上下文。
- 保留包名、版本号、签名和哈希信息。

## 代码模式
```bash
jadx -d app-code app.apk
rg -n 'API_KEY|Bearer |Authorization|token|secret' app-code/sources
rg -n 'TrustManager|HostnameVerifier|setJavaScriptEnabled' app-code/sources
```

## 检查清单
- 确认反编译目录、sources/resources 和多 dex 结构。
- 搜索网络层、证书校验、存储、日志和调试开关。
- 对关键命中回看调用链和构造参数。
- 必要时用 smali 交叉验证。

## 反模式
- 搜索到字符串就直接下结论。
- 完全忽略混淆和内联导致的假阴性。
- 只看 Java 结果，不回看 smali 或资源。
