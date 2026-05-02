---
name: ios-binary-analysis
description: "当需要提取和分析 iOS IPA、Mach-O 二进制、dylib 或 framework，做类 dump 和调用链追踪时使用。"
---

# iOS 二进制分析

## 适用场景
- 需要从 IPA 中提取 Mach-O 并用 ipsw class-dump 获取类/方法声明。
- 需要追踪 ViewController → ViewModel → Service → API 的调用链。
- 需要与 [frida-dynamic-analysis](../frida-dynamic-analysis/SKILL.md) 配合做运行时验证。
- 需要与 [anti-reversing-techniques](../binary-analysis-patterns/SKILL.md) 联动分析保护逻辑。

## 核心约束
- 先用 ipsw class-dump（不是旧版 class-dump），它支持 Swift 和现代 ARM64e。
- Fat binary 先用 `lipo -thin arm64` 提取目标架构。
- class-dump 输出只是头文件，不包含实现——需要结合 strings 和反汇编工具交叉验证。
- 区分 app 代码和 framework 代码：第三方 framework 通常在 `Frameworks/` 目录下。

## 实施步骤

### 步骤 1：提取 IPA

```bash
unzip -o app.ipa -d extracted/
# 主二进制
BINARY="extracted/Payload/App.app/App"
# Info.plist
plutil -p "extracted/Payload/App.app/Info.plist"
```

### 步骤 2：Class dump

```bash
ipsw class-dump "$BINARY" > headers.h
# 或导出到目录
ipsw class-dump "$BINARY" -o headers/
```

### 步骤 3：分析结构

1. **读 Info.plist**：CFBundleIdentifier、NSAppTransportSecurity、URL schemes、权限声明。
2. **读 entitlements**：`codesign -d --entitlements - "$BINARY"`。
3. **扫描头文件**：定位 ViewController、API/Network/Service 类、Manager/Repository 类。
4. **识别架构模式**：MVC（VC 直接网络调用）、MVVM（ViewModel）、VIPER（Interactor/Presenter）。

### 步骤 4：追踪调用链

```bash
# 搜索网络层
rg -n 'URLSession|Alamofire|Moya|AFNetworking' headers/
# 搜索 API 端点
strings "$BINARY" | rg 'https?://|/api/|/v[0-9]/'
# 搜索认证相关
rg -n 'Bearer|Authorization|token|OAuth' headers/
```

### 步骤 5：用 otool/rizin 深入

```bash
otool -L "$BINARY"           # 链接的动态库
otool -ov "$BINARY" | head   # ObjC 元数据
rizin -qc "aaa; afl" "$BINARY"  # 函数列表
```

## 检查清单
- 确认 ipsw 已安装（`brew install blacktop/tap/ipsw`）。
- FairPlay DRM 加密的 IPA 需要先解密（`otool -l binary | grep cryptid`，cryptid=1 表示加密）。
- Swift 混淆后类名为乱码时用 `swift-demangle` 还原。
- 列出 `Frameworks/` 下所有第三方 framework 及其版本。

## 反模式

### FAIL: 用旧版 class-dump

```bash
class-dump App  # 旧版 class-dump
# → 对 Swift 类输出为空
# → 对 ARM64e (A12+) 直接 crash
```

### PASS: 用 ipsw class-dump

```bash
ipsw class-dump App
# → 支持 Swift 类
# → 支持 ARM64e
# → 输出 @protocol / @interface / @property 完整声明
```
