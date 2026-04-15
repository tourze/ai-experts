---
name: react-native-native-module-android
description: "当用户要用 Kotlin 实现 React Native Android 原生模块或 TurboModule 时使用。用户提到 Android 原生模块、Kotlin TurboModule、Gradle codegen 时触发。"
---

# Android 原生模块开发

## 适用场景

- 用 Kotlin 实现 RN TurboModule 或桥接 Android SDK 时。
- 配置 Gradle Codegen 生成 Spec 基类时。
- 排查模块注册失败、线程安全或生命周期问题时。

## 核心约束

- 继承 Codegen Spec 基类，不用废弃 `ReactContextBaseJavaModule`。
- 注册用 `TurboReactPackage.getModule()` + `getReactModuleInfoProvider()`。
- `ReactModuleInfo.className` 必须是完整限定类名，`isTurboModule = true`。
- 原生方法默认跑 JS 线程；耗时用 `Dispatchers.IO`。
- `Promise.resolve/reject` 任意线程可调；`ReadableMap` 创建须同线程。
- Gradle `react { codegenConfig { ... } }` 定义模块名和包名。
- 访问 `currentActivity` 前 null 检查。

## 代码模式

- [Kotlin TurboModule](references/kotlin-turbomodule.md)
- [TurboReactPackage 注册](references/turbo-react-package.md)
- [Activity 与系统服务](references/activity-system-services.md)
- [Gradle Codegen](references/gradle-codegen.md)

## 检查清单

- `className` 是否为完整限定名？
- `invalidate()` 是否取消协程 scope？
- Codegen 配置是否与 Spec 模块名匹配？

## 反模式

- `className` 填短名，注册后找不到。
- `getModule()` 中做网络操作，卡住 JS。
- 未取消协程 scope，模块销毁后仍回调。
- `WritableNativeMap` 跨线程传递触发断言。
