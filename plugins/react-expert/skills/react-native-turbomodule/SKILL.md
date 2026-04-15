---
name: react-native-turbomodule
description: "React Native 0.76+ TurboModule 开发：Spec 定义、Codegen、Android Kotlin / iOS ObjC++ 实现。用户提到 TurboModule、TurboModuleRegistry、Codegen、codegenConfig 时使用。"
---

# TurboModule 开发

## 适用场景

- 为 RN 0.76+ New Architecture 创建原生模块时。
- 从旧 NativeModules 迁移到 TurboModule 时。
- 需要定义 Spec、配置 Codegen 或排查类型不匹配崩溃时。

## 核心约束

- Spec 导出 `interface Spec extends TurboModule`，类型必须精确。
- `package.json` 的 `codegenConfig` 须含 `name`、`type: "modules"`、`jsSrcsDir`。
- Android：继承 Codegen 基类 + `TurboReactPackage`；禁用废弃 `ReactPackage`。
- iOS：`.mm` 中 `#ifdef RCT_NEW_ARCH_ENABLED` 实现 `getTurboModule:`。
- 只用 `TurboModuleRegistry.getEnforcing<Spec>()`，不做 null 回退。
- 异步返回 Promise；同步阻塞 JS 线程，仅限微秒级。
- 参数类型与 Spec 不匹配时运行时崩溃而非编译报错。

## 代码模式

- [Spec 定义](references/spec-definition.md)
- [Android Kotlin 实现](references/android-kotlin-impl.md)
- [iOS ObjC++ 实现](references/ios-objcpp-impl.md)
- [JS 消费层封装](references/js-consumer-wrapper.md)

## 检查清单

- Spec 类型是否精确，无 `any` / `Object`？
- Codegen 是否重跑以匹配最新 Spec？
- `ReactModuleInfo.className` 是否为完整限定类名？

## 反模式

- Spec 用 `any`，绑定不可靠。
- `className` 填短名而非完整限定类名。
- `getModule()` 中做耗时 I/O，拖慢首调。
- Spec 改了不重跑 Codegen，崩溃。
