---
name: android-architecture
description: 现代 Android 应用架构指南，覆盖 Clean Architecture 分层、Hilt 依赖注入和多模块策略。
---

# Android 现代架构

## 适用场景

* 设计或重构 Android 应用架构
* 搭建新项目的模块结构
* 配置 Hilt 依赖注入
* 评审代码的分层合理性

## 核心分层

依赖方向严格**单向向内**：UI → Domain → Data。禁止反向依赖。

```
┌─────────────────────────────────────────────────┐
│  UI Layer (Presentation)                        │
│  Activity / Fragment / Composable / ViewModel   │
├─────────────────────────────────────────────────┤
│  Domain Layer [可选但推荐]                       │
│  UseCase / Domain Model（纯 Kotlin，零 Android）  │
├─────────────────────────────────────────────────┤
│  Data Layer                                     │
│  Repository 实现 / DataSource / Retrofit / Room │
└─────────────────────────────────────────────────┘
```

### UI 层

* **职责**：展示数据、处理用户交互
* **组件**：Activity、Fragment、Composable、ViewModel
* ViewModel 通过 `StateFlow` 向 UI 暴露状态
* **禁止**直接依赖 Data 层实现细节（只能通过 Domain 层的接口）

### Domain 层

* **职责**：封装可复用的业务规则
* **组件**：UseCase（如 `GetLatestNewsUseCase`）、Domain Model（纯 Kotlin data class）
* **必须是纯 Kotlin** — 不允许出现任何 `android.*` 导入
* 依赖 Repository 接口，不依赖具体实现

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
    private val remoteDataSource: NewsRemoteDataSource,
    private val localDataSource: NewsLocalDataSource,
    private val ioDispatcher: CoroutineDispatcher = Dispatchers.IO
) : NewsRepository {
    override suspend fun getLatestNews(): List<News> = withContext(ioDispatcher) {
        try {
            val remote = remoteDataSource.fetchNews()
            localDataSource.cacheNews(remote)
            remote
        } catch (e: IOException) {
            localDataSource.getCachedNews()
        }
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
// 接口绑定 — 优先用 @Binds
@Module
@InstallIn(SingletonComponent::class)
abstract class DataModule {
    @Binds
    abstract fun bindNewsRepository(impl: NewsRepositoryImpl): NewsRepository
}

// 第三方实例化 — 必须用 @Provides
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    @Provides
    @Singleton
    fun provideRetrofit(): Retrofit = Retrofit.Builder()
        .baseUrl(BASE_URL)
        .addConverterFactory(GsonConverterFactory.create())
        .build()
}
```

## 多模块策略

生产级应用推荐以下模块划分，加速增量编译并强制分离关注点：

```
:app                    主入口，串联各 feature
:core:model             共享 Domain Model（纯 Kotlin）
:core:data              Repository、DataSource、数据库、网络
:core:domain            UseCase 与 Repository 接口
:core:ui                共享 Composable、Theme、资源
:feature:[name]         独立功能模块（自含 UI + ViewModel）
                        依赖 :core:domain 和 :core:ui
```

**关键规则：**
* Feature 模块之间**禁止**互相依赖，只允许依赖 `:core:*`
* `:core:model` 和 `:core:domain` 是纯 Kotlin 模块，不包含 Android 依赖
* 每个 Feature 模块独立提供自己的 Hilt Module

## 检查清单

- [ ] Domain 层无 `android.*` 导入
- [ ] Repository 的 `suspend` 函数 main-safe（内部 `withContext` 切线程）
- [ ] ViewModel 通过 `StateFlow` 向 UI 暴露状态
- [ ] `MutableStateFlow` / `MutableSharedFlow` 不对外暴露（通过 `.asStateFlow()` 转为只读）
- [ ] Hilt Module 中接口绑定用 `@Binds`，仅第三方实例用 `@Provides`
- [ ] Feature 模块不互相依赖，只依赖 `:core:*`
- [ ] 依赖方向单向向内，无循环依赖
