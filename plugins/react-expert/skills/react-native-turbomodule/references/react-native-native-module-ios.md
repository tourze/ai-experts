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

### FAIL: .m 写 getTurboModule

```objc
// MyModule.m  ← 错误后缀
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:... {
    // error: expected '(' before '<' token
    // C++ 头文件无法在 .m 中编译
}
```

### PASS: .mm 文件

```objc
// MyModule.mm  ← ObjC++
#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
    return std::make_shared<facebook::react::NativeMyModuleSpecJSI>(params);
}
#endif
```

### FAIL: Promise 调两次

```objc
RCT_EXPORT_METHOD(load:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    [api request:^(NSError *err, NSData *data) {
        if (err) reject(@"err", err.description, err);
        resolve(data);  // err 时也跑到这里 → 双调！
    }];
}
// JS：UnhandledPromiseRejection: settled multiple times
```

### PASS: 互斥分支 + return

```objc
[api request:^(NSError *err, NSData *data) {
    if (err) {
        reject(@"err", err.description, err);
        return;
    }
    resolve(data);
}];
```

### FAIL: 漏 install_modules_dependencies

```ruby
# MyModule.podspec
Pod::Spec.new do |s|
  s.dependency "React-Core"
  # 缺 install_modules_dependencies
end
# pod install → 编译时报 "ReactCommon/TurboModule not found"
```

### PASS: 完整 podspec

```ruby
Pod::Spec.new do |s|
  s.dependency "React-Core"
  install_modules_dependencies(s)  # 自动接 TurboModule + Codegen
end
```