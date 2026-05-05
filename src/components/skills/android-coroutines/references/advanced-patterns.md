# Android Coroutines 进阶模式

本文件是 Android Coroutines SKILL.md 的拆分内容，包含代码模式与反模式的完整代码。

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

## 反模式详解

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
