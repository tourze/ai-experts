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

核心依赖：`junit4`、`kotlinx-coroutines-test`、`androidx-test-ext-junit`、`espresso-core`、`compose-ui-test`、`hilt-android-testing`、`roborazzi`。完整配置见 [references/dependencies.md](references/dependencies.md)。

## 单元测试模式

### ViewModel 测试

```kotlin
@Test fun loadSuccess() = runTest {
    val dispatcher = StandardTestDispatcher(testScheduler)
    val vm = NewsViewModel(GetLatestNewsUseCase(FakeNewsRepository(testNews)), dispatcher)
    vm.loadNews(); advanceUntilIdle()
    assertTrue(vm.uiState.value is NewsUiState.Success)
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
