# Android 架构代码模式

## 核心分层

依赖方向严格单向向内：UI -> Domain -> Data。禁止反向依赖。

- UI 层：Activity / Fragment / Composable / ViewModel。ViewModel 通过 `StateFlow` 暴露状态；禁止直接依赖 Data 层实现。
- Domain 层：UseCase / Domain Model。必须纯 Kotlin，无 `android.*` 导入；依赖 Repository 接口。
- Data 层：Repository 实现 / DataSource / Retrofit / Room。Repository 通过接口暴露，`suspend` 函数必须 main-safe。

## Domain 层 UseCase

```kotlin
class GetLatestNewsUseCase(
    private val newsRepository: NewsRepository,
) {
    suspend operator fun invoke(): List<News> {
        return newsRepository.getLatestNews()
            .filter { it.isPublished }
    }
}
```

## Data 层 Repository

Data 层负责数据获取、缓存和持久化。Repository 实现可以依赖 Remote / Local DataSource，但暴露给内层的是接口。

```kotlin
class NewsRepositoryImpl(
    private val remote: NewsRemoteDataSource,
    private val local: NewsLocalDataSource,
    private val io: CoroutineDispatcher = Dispatchers.IO,
) : NewsRepository {
    override suspend fun getLatestNews() = withContext(io) {
        runCatching { remote.fetchNews().also { local.cacheNews(it) } }
            .getOrElse { local.getCachedNews() }
    }
}
```

## Hilt 依赖注入

| 注解 | 用途 |
|------|------|
| `@HiltAndroidApp` | Application 类 |
| `@AndroidEntryPoint` | Activity / Fragment |
| `@HiltViewModel` | ViewModel（配合 `@Inject constructor`） |
| `@Module @InstallIn` | 提供依赖的模块 |

## Module 编写规则

- 接口绑定用 `@Binds`（abstract class），比 `@Provides` 更轻量。
- 第三方库实例化用 `@Provides`（object class）。
- app 级单例用 `@InstallIn(SingletonComponent::class)` + `@Singleton`。

```kotlin
@Module
@InstallIn(SingletonComponent::class)
abstract class DataModule {
    @Binds
    abstract fun bindNewsRepository(impl: NewsRepositoryImpl): NewsRepository
}

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    @Provides
    @Singleton
    fun provideRetrofit(): Retrofit = Retrofit.Builder()
        .baseUrl(BASE_URL)
        .build()
}
```

## 多模块策略

生产级推荐：`:app` -> `:feature:*` -> `:core:ui` / `:core:domain` / `:core:data` / `:core:model`。

关键规则：

- Feature 之间禁止互相依赖，只依赖 `:core:*`。
- `:core:model` / `:core:domain` 是纯 Kotlin 模块，无 Android 依赖。
- 每个 Feature 独立提供自己的 Hilt Module。
