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
