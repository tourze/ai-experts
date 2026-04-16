---
name: react-native-turbomodule
description: "当用户要创建或迁移 React Native 0.76+ TurboModule 时使用。用户提到 TurboModule、TurboModuleRegistry、Codegen、codegenConfig 时触发。"
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

### FAIL: Spec 用 any

```ts
export interface Spec extends TurboModule {
  load(params: any): Promise<any>;  // 任意类型
}
// Codegen 输出 NSObject* / Object → 失去类型保护
// 业务传错字段名也不报错
```

### PASS: 精确类型

```ts
export type LoadParams = { id: string; locale: string };
export type LoadResult = { name: string; age: number };
export interface Spec extends TurboModule {
  load(params: LoadParams): Promise<LoadResult>;
}
// Codegen 生成强类型 ObjC++/Kotlin 接口
```

### FAIL: Spec 改了不跑 Codegen

```
1. Spec.ts 加字段 `email: string`
2. JS 调 load({id, locale, email})
3. iOS 端 ObjC++ 接口仍是旧定义
4. 运行时 → "method signature mismatch" 崩溃
```

### PASS: Spec 改 → Codegen 重跑

```bash
# iOS（pod install 触发）
cd ios && pod install
# Android（Gradle 同步）
./gradlew :app:generateCodegenArtifactsFromSchema
```

### FAIL: getModule 阻塞

```kotlin
override fun getModule(name: String, ctx: ReactApplicationContext): NativeModule? {
    return MyModule(ctx, loadConfigSync())  // 同步 I/O
}
// 首次 require 模块 → JS 等数百 ms
```

### PASS: 懒加载

```kotlin
override fun getModule(name: String, ctx: ReactApplicationContext) = MyModule(ctx)

// MyModule 内
@ReactMethod fun setup(promise: Promise) {
    scope.launch { promise.resolve(loadConfig()) }
}
```
