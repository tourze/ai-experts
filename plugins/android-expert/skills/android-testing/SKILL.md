---
name: android-testing
description: 当用户要为 Android 写单元测试、Hilt 集成测试、Roborazzi 截图测试或 Compose 测试时使用。
---

# Android 测试策略

## 适用场景

* 为 ViewModel / Repository / UseCase 编写单元测试
* 配置 Hilt 集成测试环境
* 搭建 Roborazzi 截图回归测试
* 编写 Compose UI 测试

## 测试金字塔

```
        ╱ UI / 截图测试 ╲         数量少，覆盖关键页面
       ╱  集成测试        ╲       Room DAO、Retrofit + MockWebServer
      ╱   单元测试          ╲     ViewModel、Repository、UseCase（最多）
```

* **单元测试**：快速、隔离逻辑（ViewModel、Repository、UseCase）
* **集成测试**：验证组件交互（Room DAO、网络层 + MockWebServer）
* **UI / 截图测试**：验证 UI 正确性（Compose + Roborazzi）

## 依赖配置（libs.versions.toml）

```toml
[libraries]
junit4 = { module = "junit:junit", version = "4.13.2" }
kotlinx-coroutines-test = { group = "org.jetbrains.kotlinx", name = "kotlinx-coroutines-test", version.ref = "kotlinxCoroutines" }
androidx-test-ext-junit = { group = "androidx.test.ext", name = "junit", version = "1.1.5" }
espresso-core = { group = "androidx.test.espresso", name = "espresso-core", version = "3.5.1" }
compose-ui-test = { group = "androidx.compose.ui", name = "ui-test-junit4" }
hilt-android-testing = { group = "com.google.dagger", name = "hilt-android-testing", version.ref = "hilt" }
roborazzi = { group = "io.github.takahirom.roborazzi", name = "roborazzi", version.ref = "roborazzi" }

[plugins]
roborazzi = { id = "io.github.takahirom.roborazzi", version.ref = "roborazzi" }
```

## 单元测试模式

### ViewModel 测试

```kotlin
@Test
fun `加载新闻成功时更新 UI 状态`() = runTest {
    // Arrange — 注入 TestDispatcher 控制时序
    val testDispatcher = StandardTestDispatcher(testScheduler)
    val fakeRepository = FakeNewsRepository(testNews)
    val viewModel = NewsViewModel(
        getLatestNewsUseCase = GetLatestNewsUseCase(fakeRepository),
        ioDispatcher = testDispatcher
    )

    // Act
    viewModel.loadNews()
    advanceUntilIdle()

    // Assert
    val state = viewModel.uiState.value
    assertTrue(state is NewsUiState.Success)
    assertEquals(testNews, (state as NewsUiState.Success).news)
}
```

### Repository 测试

```kotlin
@Test
fun `网络失败时回退到本地缓存`() = runTest {
    val remoteSource = FakeRemoteDataSource(shouldFail = true)
    val localSource = FakeLocalDataSource(cachedNews)
    val repository = NewsRepositoryImpl(remoteSource, localSource, UnconfinedTestDispatcher())

    val result = repository.getLatestNews()

    assertEquals(cachedNews, result)
}
```

## Hilt 集成测试

```kotlin
@HiltAndroidTest
class NewsDaoTest {

    @get:Rule
    var hiltRule = HiltAndroidRule(this)

    @Inject
    lateinit var database: AppDatabase
    private lateinit var dao: NewsDao

    @Before
    fun setup() {
        hiltRule.inject()
        dao = database.newsDao()
    }

    @Test
    fun `插入并查询新闻`() = runTest {
        dao.insertAll(testNewsEntities)
        val result = dao.getAll()
        assertEquals(testNewsEntities.size, result.size)
    }
}
```

**配置要点：**
* 测试类标注 `@HiltAndroidTest`
* 使用 `HiltAndroidRule` 管理注入生命周期
* 测试用 Database 通过 Hilt `@TestInstallIn` 替换为内存数据库

## 截图测试（Roborazzi）

Roborazzi 在 JVM 上运行（无需模拟器），适合 CI 环境。

### 配置

```kotlin
// build.gradle.kts
plugins {
    alias(libs.plugins.roborazzi)
}
```

### 编写截图测试

```kotlin
@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [33], qualifiers = RobolectricDeviceQualifiers.Pixel5)
class NewsScreenScreenshotTest {

    @get:Rule
    val composeTestRule = createAndroidComposeRule<ComponentActivity>()

    @Test
    fun captureNewsScreen() {
        composeTestRule.setContent {
            AppTheme {
                NewsScreen(
                    uiState = NewsUiState.Success(testNews)
                )
            }
        }
        composeTestRule.onRoot().captureRoboImage()
    }
}
```

### 运行命令

| 命令 | 用途 |
|------|------|
| `./gradlew recordRoborazziDebug` | 录制基准截图 |
| `./gradlew verifyRoborazziDebug` | 对比验证（CI 使用） |
| `./gradlew compareRoborazziDebug` | 生成差异报告 |

## Compose UI 测试

```kotlin
@Test
fun `点击新闻项导航到详情`() {
    composeTestRule.setContent {
        AppTheme {
            NewsListScreen(
                news = testNews,
                onNewsClick = { clickedId = it }
            )
        }
    }

    composeTestRule
        .onNodeWithText(testNews.first().title)
        .performClick()

    assertEquals(testNews.first().id, clickedId)
}
```

## 检查清单

- [ ] ViewModel 测试注入 `TestDispatcher`，不依赖真实线程
- [ ] Repository 测试覆盖正常路径和异常回退路径
- [ ] Hilt 测试用 `@TestInstallIn` 替换真实依赖
- [ ] 关键页面有 Roborazzi 截图测试
- [ ] CI 配置 `verifyRoborazziDebug` 任务
- [ ] Compose 测试通过语义（文本、testTag）查找节点，不用坐标
