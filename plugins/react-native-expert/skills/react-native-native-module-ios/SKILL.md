---
name: react-native-native-module-ios
description: "当用户要用 ObjC/Swift 实现 React Native iOS 原生模块或 TurboModule 时使用。用户提到 iOS 原生模块、ObjC++ TurboModule、podspec、Swift 桥接时触发。"
---

# iOS 原生模块开发

## 适用场景

- 用 ObjC++ 实现 RN TurboModule 或桥接 iOS 框架时。
- 需要 Swift 模块通过桥接头文件暴露给 RN 时。
- 配置 podspec 和 Codegen 依赖时。

## 核心约束

- `#ifdef RCT_NEW_ARCH_ENABLED` 中实现 `getTurboModule:`；遗漏则新架构不可用。
- 模块须实现 `RCTTurboModule` + `RCTBridgeModule` 协议。
- 实现文件必须用 `.mm`；`.m` 无法包含 C++ 代码。
- Swift 需 `@objc` + 桥接头；纯 Swift TurboModule 不受支持。
- 主线程操作用 `requiresMainQueueSetup` 或 `dispatch_async`。
- `RCTPromiseResolveBlock/RejectBlock` 任意线程可调，但只能调一次。
- podspec 须调用 `install_modules_dependencies(s)` 并声明框架依赖。

## 代码模式

- [ObjC++ TurboModule](references/objcpp-turbomodule.md)
- [getTurboModule 实现](references/get-turbo-module-impl.md)
- [Swift 桥接](references/swift-bridging.md)
- [CocoaPods podspec](references/cocoapods-podspec.md)

## 检查清单

- `getTurboModule:` 是否在 `#ifdef` 保护内？
- Promise 回调是否保证只调一次？
- podspec 是否含 `install_modules_dependencies`？

## 反模式

- 用 `.m` 写 `getTurboModule:`，C++ 语法报错。
- 遗漏 `#ifdef`，旧架构编译找不到头文件。
- `ResolveBlock` 被调两次，JS Promise 异常。
- 遗漏 `install_modules_dependencies`，编译失败。
