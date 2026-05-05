# Android Testing Dependencies

下面这份依赖清单用于把 `android-testing` 里的测试链路配齐到一个可运行基线。

## JVM / 单元测试

- `junit:junit`
- `org.jetbrains.kotlinx:kotlinx-coroutines-test`
- `androidx.arch.core:core-testing`

## Android Instrumentation / Compose

- `androidx.test.ext:junit`
- `androidx.test.espresso:espresso-core`
- `androidx.compose.ui:ui-test-junit4`
- `androidx.compose.ui:ui-test-manifest`

## Hilt 测试

- `com.google.dagger:hilt-android-testing`
- `kaptAndroidTest` / `kspAndroidTest` 对应编译器

## 截图测试

- `io.github.takahirom.roborazzi:roborazzi`
- 按需补 `robolectric`

## 示例

```toml
[libraries]
junit4 = "junit:junit:4.13.2"
coroutines-test = "org.jetbrains.kotlinx:kotlinx-coroutines-test:1.8.1"
androidx-test-ext-junit = "androidx.test.ext:junit:1.2.1"
espresso-core = "androidx.test.espresso:espresso-core:3.6.1"
compose-ui-test = "androidx.compose.ui:ui-test-junit4:1.7.0"
hilt-android-testing = "com.google.dagger:hilt-android-testing:2.52"
roborazzi = "io.github.takahirom.roborazzi:roborazzi:1.14.0"
```
