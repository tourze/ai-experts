# iOS 二进制分析命令 Runbook

## 提取 IPA

```bash
unzip -o app.ipa -d extracted/
BINARY="extracted/Payload/App.app/App"
plutil -p "extracted/Payload/App.app/Info.plist"
```

## Class Dump

```bash
ipsw class-dump "$BINARY" > headers.h
ipsw class-dump "$BINARY" -o headers/
```

## 结构分析

1. 读 Info.plist：CFBundleIdentifier、NSAppTransportSecurity、URL schemes、权限声明。
2. 读 entitlements：`codesign -d --entitlements - "$BINARY"`。
3. 扫描头文件：定位 ViewController、API / Network / Service 类、Manager / Repository 类。
4. 识别架构模式：MVC、MVVM、VIPER 或自定义分层。

## 调用链追踪

```bash
rg -n 'URLSession|Alamofire|Moya|AFNetworking' headers/
strings "$BINARY" | rg 'https?://|/api/|/v[0-9]/'
rg -n 'Bearer|Authorization|token|OAuth' headers/
```

## 深入分析

```bash
otool -L "$BINARY"
otool -ov "$BINARY" | head
rizin -qc "aaa; afl" "$BINARY"
```
