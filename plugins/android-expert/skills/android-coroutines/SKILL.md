---
name: android-coroutines
description: 当用户要在 Android 上使用 Kotlin Coroutines、结构化并发、Flow、生命周期集成或协程异常处理时使用。
---

# Android Coroutines

## 适用场景

- 实现 API/数据库的异步调用、后台任务处理。
- 修复线程/任务相关的内存泄漏。
- 将回调/Listener 转换为 Coroutines。
- 实现 ViewModel 的 UI 状态管理。

通用并发原则（不阻塞异步上下文、限制并发、传播取消、不共享可变状态、超时所有外部调用、优雅停机）见 architecture-expert 的 concurrency-patterns skill。

## Kotlin/Android 特有约束

- **Dispatcher 注入**：禁止硬编码 `Dispatchers.IO`，必须通过构造函数注入 `CoroutineDispatcher`。
- **Main-Safety**：Data/Domain 层的所有 `suspend` 函数必须 main-safe。
- **生命周期安全收集**：必须使用 `repeatOnLifecycle(Lifecycle.State.STARTED)`。
- **禁用 GlobalScope**：破坏结构化并发，导致泄漏。
- **协作式取消**：紧密循环中必须调用 `ensureActive()` 或 `yield()`。
- **异常处理**：禁止在通用 `catch (e: Exception)` 中吞掉 `CancellationException`。

## Kotlin 代码模式

### Dispatcher 注入

```kotlin
class UserRepository(private val io: CoroutineDispatcher = Dispatchers.IO) {
    suspend fun getUser() = withContext(io) { /* ... */ }
}
```

### 生命周期安全收集

```kotlin
viewLifecycleOwner.lifecycleScope.launch {
    viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
        viewModel.uiState.collect { state -> renderUi(state) }
    }
}
```

### 协作式取消

```kotlin
suspend fun processLargeList(items: List<Item>) = coroutineScope {
    for (item in items) { ensureActive(); process(item) }
}
```

### 回调转 Flow

```kotlin
fun locationUpdates(): Flow<Location> = callbackFlow {
    val cb = object : LocationCallback() {
        override fun onLocationResult(r: LocationResult) { trySend(r.lastLocation) }
    }
    client.requestLocationUpdates(request, cb, Looper.getMainLooper())
    awaitClose { client.removeLocationUpdates(cb) }
}
```

完整代码见 [references/advanced-patterns.md](references/advanced-patterns.md)。

## 反模式速查

| 反模式 | 正确方式 |
|------|----------|
| `lifecycleScope.launch` 裸 collect | `repeatOnLifecycle(STARTED)` |
| `catch (e: Exception)` 吞掉取消 | 先 catch `CancellationException` 重抛 |
| `GlobalScope.launch` | `viewModelScope` 或注入 `applicationScope` |
| 硬编码 `Dispatchers.IO` | 构造函数注入 Dispatcher |
| 暴露 `MutableStateFlow` | `.asStateFlow()` |
