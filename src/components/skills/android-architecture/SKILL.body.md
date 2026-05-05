# Android 现代架构

## 适用场景

* 设计或重构 Android 应用架构
* 搭建新项目的模块结构
* 配置 Hilt 依赖注入
* 评审代码的分层合理性

## 核心分层

依赖方向严格**单向向内**：UI → Domain → Data。禁止反向依赖。

- **UI 层**：Activity / Fragment / Composable / ViewModel。ViewModel 通过 `StateFlow` 暴露状态；禁止直接依赖 Data 层实现。
- **Domain 层**（可选但推荐）：UseCase / Domain Model。**必须纯 Kotlin**，无 `android.*` 导入；依赖 Repository 接口。
- **Data 层**：Repository 实现 / DataSource / Retrofit / Room。Repository 通过接口暴露，`suspend` 函数必须 main-safe。

```kotlin
// Domain 层 UseCase — 纯 Kotlin，无 Android 依赖
class GetLatestNewsUseCase(
    private val newsRepository: NewsRepository // 接口，非实现
) {
    suspend operator fun invoke(): List<News> {
        return newsRepository.getLatestNews()
            .filter { it.isPublished }
    }
}
```

### Data 层

* **职责**：管理数据的获取、缓存、持久化
* **组件**：Repository 实现、Remote/Local DataSource
* Repository 通过接口暴露给 Domain 层
* `suspend` 函数必须 **main-safe**（内部通过 `withContext(Dispatchers.IO)` 切线程）

```kotlin
class NewsRepositoryImpl(
    private val remote: NewsRemoteDataSource,
    private val local: NewsLocalDataSource,
    private val io: CoroutineDispatcher = Dispatchers.IO
) : NewsRepository {
    override suspend fun getLatestNews() = withContext(io) {
        runCatching { remote.fetchNews().also { local.cacheNews(it) } }
            .getOrElse { local.getCachedNews() }
    }
}
```

## Hilt 依赖注入

### 基础注解

| 注解 | 用途 |
|------|------|
| `@HiltAndroidApp` | Application 类 |
| `@AndroidEntryPoint` | Activity / Fragment |
| `@HiltViewModel` | ViewModel（配合 `@Inject constructor`） |
| `@Module @InstallIn` | 提供依赖的模块 |

### Module 编写规则

* 接口绑定用 `@Binds`（abstract class）— 比 `@Provides` 更轻量
* 第三方库实例化用 `@Provides`（object class）
* app 级单例用 `@InstallIn(SingletonComponent::class)` + `@Singleton`

```kotlin
// 接口绑定用 @Binds（abstract class）
@Module @InstallIn(SingletonComponent::class)
abstract class DataModule {
    @Binds abstract fun bindNewsRepository(impl: NewsRepositoryImpl): NewsRepository
}

// 第三方实例用 @Provides（object class）
@Module @InstallIn(SingletonComponent::class)
object NetworkModule {
    @Provides @Singleton
    fun provideRetrofit(): Retrofit = Retrofit.Builder().baseUrl(BASE_URL).build()
}
```

## 多模块策略

生产级推荐：`:app` → `:feature:*` → `:core:ui` / `:core:domain` / `:core:data` / `:core:model`。

关键规则：
- Feature 之间**禁止互相依赖**，只依赖 `:core:*`
- `:core:model` / `:core:domain` 是纯 Kotlin 模块，无 Android 依赖
- 每个 Feature 独立提供自己的 Hilt Module

## 检查清单

- [ ] Domain 层无 `android.*` 导入
- [ ] Repository 的 `suspend` 函数 main-safe（内部 `withContext` 切线程）
- [ ] ViewModel 通过 `StateFlow` 向 UI 暴露状态
- [ ] `MutableStateFlow` / `MutableSharedFlow` 不对外暴露（通过 `.asStateFlow()` 转为只读）
- [ ] Hilt Module 中接口绑定用 `@Binds`，仅第三方实例用 `@Provides`
- [ ] Feature 模块不互相依赖，只依赖 `:core:*`
- [ ] 依赖方向单向向内，无循环依赖

## 反模式

### FAIL: Domain 层依赖 Android

```kotlin
// :core:domain/GetUserUseCase.kt
import android.content.Context  // 污染 Domain 层
class GetUserUseCase(private val context: Context) { ... }
```

### PASS: Domain 层纯 Kotlin

```kotlin
class GetUserUseCase(private val userRepository: UserRepository) {
    suspend operator fun invoke(id: String): User = userRepository.getUser(id)
}
// 资源读取放到 Data 层实现，Domain 层只依赖接口
```

### FAIL: ViewModel 暴露可变状态

```kotlin
class NewsViewModel : ViewModel() {
    val uiState = MutableStateFlow(NewsUiState())  // UI 可以直接改！
}
```

### PASS: 只读 StateFlow

```kotlin
class NewsViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(NewsUiState())
    val uiState: StateFlow<NewsUiState> = _uiState.asStateFlow()
}
```
