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
