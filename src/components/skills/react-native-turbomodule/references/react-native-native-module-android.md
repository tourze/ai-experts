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

- [Kotlin TurboModule](./kotlin-turbomodule.md)
- [TurboReactPackage 注册](./turbo-react-package.md)
- [Activity 与系统服务](./activity-system-services.md)
- [Gradle Codegen](./gradle-codegen.md)

## 检查清单

- `className` 是否为完整限定名？
- `invalidate()` 是否取消协程 scope？
- Codegen 配置是否与 Spec 模块名匹配？

## 反模式

### FAIL: className 填短名

```kotlin
ReactModuleInfo(
    "MyModule", "MyModule",  // ← 短名
    false, false, false, true
)
// 运行时：TurboModuleRegistry.getEnforcing → "MyModule not found"
```

### PASS: 完整限定类名

```kotlin
ReactModuleInfo(
    "MyModule",
    "com.myapp.modules.MyModuleImpl",  // ← FQCN
    false, false, false, true
)
```

### FAIL: getModule 做 I/O

```kotlin
override fun getModule(name: String, ctx: ReactApplicationContext): NativeModule? {
    val config = httpClient.fetch("/config")  // 网络调用
    return MyModuleImpl(ctx, config)
}
// 首次调用模块 → JS 线程阻塞数百 ms
```

### PASS: 懒加载 + 后台线程

```kotlin
override fun getModule(name: String, ctx: ReactApplicationContext): NativeModule? {
    return MyModuleImpl(ctx)  // 仅构造，不做 I/O
}

// MyModuleImpl 内部
@ReactMethod
fun loadConfig(promise: Promise) {
    moduleScope.launch(Dispatchers.IO) {
        val config = httpClient.fetch("/config")
        promise.resolve(config)
    }
}
```

### FAIL: 协程未取消

```kotlin
private val scope = CoroutineScope(Dispatchers.Main)
@ReactMethod fun longTask(promise: Promise) {
    scope.launch { delay(10_000); promise.resolve(...) }
}
// 模块销毁后任务仍跑 → 调 promise → "Cannot send to disposed bridge"
```

### PASS: invalidate 取消

```kotlin
private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())
override fun invalidate() {
    scope.cancel()
    super.invalidate()
}
```