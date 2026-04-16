---
name: android-coroutines
description: 当用户要在 Android 上使用 Kotlin Coroutines、结构化并发、Flow、生命周期集成或协程异常处理时使用。
---

# Android Coroutines 专家

## 适用场景

* 实现 API / 数据库的异步调用
* 后台任务处理（文件 I/O、计算密集型）
* 修复线程 / 任务相关的内存泄漏
* 将回调 / Listener 转换为 Coroutines
* 实现 ViewModel 的 UI 状态管理
* 编写 Coroutine 相关的单元测试

## 核心约束（9 条硬规则）

### 1. Dispatcher 注入（可测试性）

* **禁止**在类内部硬编码 `Dispatchers.IO` / `Dispatchers.Default`
* **必须**通过构造函数注入 `CoroutineDispatcher`，默认值可设为 `Dispatchers.IO`

```kotlin
// ✅ 可注入、可替换
class UserRepository(private val io: CoroutineDispatcher = Dispatchers.IO) {
    suspend fun getUser() = withContext(io) { /* ... */ }
}
// ❌ 硬编码 → 测试无法替换
class UserRepository { suspend fun getUser() = withContext(Dispatchers.IO) { /* ... */ } }
```

### 2. Main-Safety

* Data / Domain 层的所有 `suspend` 函数必须 **main-safe**
* 调用方（ViewModel）可以在 `Dispatchers.Main` 上直接调用，不阻塞 UI
* 一次性调用暴露为 `suspend`，数据变更暴露为 `Flow`

### 3. 生命周期安全收集

* **禁止**在 `lifecycleScope.launch` 或 `launchWhenStarted`（已废弃）中直接 collect Flow
* **必须**使用 `repeatOnLifecycle(Lifecycle.State.STARTED)`

```kotlin
// ✅ 正确：生命周期安全
viewLifecycleOwner.lifecycleScope.launch {
    viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
        viewModel.uiState.collect { state -> renderUi(state) }
    }
}
```

### 4. ViewModel Scope

* 在 ViewModel 中使用 `viewModelScope` 启动 Coroutine
* ViewModel 不向 View 暴露 `suspend` 函数 — 暴露 `StateFlow` 或 `SharedFlow`

### 5. 可变状态封装

* **禁止**公开暴露 `MutableStateFlow` 或 `MutableSharedFlow`
* 通过 `.asStateFlow()` 或类型向上转换为只读 `StateFlow` / `Flow`

```kotlin
class NewsViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(NewsUiState())
    val uiState: StateFlow<NewsUiState> = _uiState.asStateFlow()
}
```

### 6. 禁用 GlobalScope

* **禁止**使用 `GlobalScope` — 破坏结构化并发，导致泄漏
* 需要超出当前 Scope 存活的任务，注入一个绑定 Application 生命周期的 `applicationScope`

### 7. 异常处理

* **禁止**在通用 `catch (e: Exception)` 中吞掉 `CancellationException` — 必须重新抛出
* `runCatching` 仅在显式重抛 `CancellationException` 时可用
* `CoroutineExceptionHandler` 只对顶层 `launch` 有效，对 `async` 和子 Coroutine 无效

```kotlin
try { repository.fetchData() }
catch (e: CancellationException) { throw e } // 必须重抛
catch (e: Exception) { handleError(e) }
```

### 8. 协作式取消

* Coroutine 的取消是**协作式**的 — 不会自动中断
* 紧密循环（处理大列表、读文件）中**必须**调用 `ensureActive()` 或 `yield()`
* `delay()`、`withContext()` 等标准函数已内置取消检查

```kotlin
suspend fun processLargeList(items: List<Item>) = coroutineScope {
    for (item in items) { ensureActive(); process(item) }
}
```

### 9. 回调转换

* 使用 `callbackFlow` 将回调 API 转为 Flow，块末尾**必须** `awaitClose` 注销监听

```kotlin
fun locationUpdates(): Flow<Location> = callbackFlow {
    val cb = object : LocationCallback() {
        override fun onLocationResult(r: LocationResult) { trySend(r.lastLocation) }
    }
    client.requestLocationUpdates(request, cb, Looper.getMainLooper())
    awaitClose { client.removeLocationUpdates(cb) }
}
```

## 代码模式

### Repository + Flow

```kotlin
class NewsRepository(
    private val remote: NewsRemoteDataSource,
    private val io: CoroutineDispatcher = Dispatchers.IO
) {
    val newsUpdates: Flow<List<News>> = flow { emit(remote.fetchLatestNews()) }.flowOn(io)
}
```

### 并行执行

```kotlin
suspend fun loadDashboardData() = coroutineScope {
    val user = async { userRepo.getUser() }
    val feed = async { feedRepo.getFeed() }
    DashboardData(user.await(), feed.await())
}
```

### 测试

```kotlin
@Test fun testViewModel() = runTest {
    val vm = MyViewModel(StandardTestDispatcher(testScheduler))
    vm.loadData(); advanceUntilIdle()
    assertEquals(expected, vm.uiState.value)
}
```

## 反模式

### FAIL: lifecycleScope 裸 collect

```kotlin
lifecycleScope.launch {
    viewModel.uiState.collect { render(it) }
    // App 进后台仍持续收集，浪费电量和网络
}
```

### PASS: repeatOnLifecycle

```kotlin
viewLifecycleOwner.lifecycleScope.launch {
    viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
        viewModel.uiState.collect { render(it) }
    }
}
```

### FAIL: catch 吞掉 CancellationException

```kotlin
try { repo.fetch() }
catch (e: Exception) { handleError(e) } // 取消信号被当普通错误处理，破坏取消传播
```

### PASS: 重抛 CancellationException

```kotlin
try { repo.fetch() }
catch (e: CancellationException) { throw e } // 必须重抛
catch (e: Exception) { handleError(e) }
```

| 其他 | 问题 | 正确方式 |
|------|------|----------|
| `GlobalScope.launch` | 泄漏，无法取消 | `viewModelScope` 或注入 `applicationScope` |
| 硬编码 `Dispatchers.IO` | 测试无法替换 | 构造函数注入 Dispatcher |
| 暴露 `MutableStateFlow` | 外部可改 | `.asStateFlow()` |
