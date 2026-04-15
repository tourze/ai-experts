---
name: gradle-build-performance
description: 当 Gradle 构建变慢、需要排查配置阶段或执行阶段瓶颈时使用。
---

# Gradle 构建性能

## 适用场景

- `clean build`、增量构建或 CI 构建明显变慢。
- 需要判断瓶颈在配置阶段、任务执行阶段还是依赖解析阶段。
- 想启用 Configuration Cache、Build Cache、并行构建或迁移 `kapt` 到 `ksp`。
- Native Image 构建链路过慢时，可与 [graalvm-native-image](../graalvm-native-image/SKILL.md) 配合使用。

## 核心约束

- 先测基线，再动配置：至少记录一次 clean build 和一次增量 build。
- 一次只做一个优化：不允许批量改 5 个参数后再猜是哪一个生效。
- 优先使用 Build Scan / `--profile` 证据定位，不靠感觉拍脑袋。
- 任何缓存类优化都要确认兼容性和 cache miss 原因，不能只看开关是否打开。

## 代码模式

```bash
# 生成 Build Scan
./gradlew assembleDebug --scan

# 生成本地 profile 报告
./gradlew assembleDebug --profile
```

```properties
# gradle.properties
org.gradle.configuration-cache=true
org.gradle.configuration-cache.problems=warn
org.gradle.caching=true
org.gradle.parallel=true
org.gradle.jvmargs=-Xmx4g -XX:+UseParallelGC
```

```kotlin
// 延迟创建任务，避免配置期膨胀
tasks.register("generateApiDocs") {
    group = "documentation"
    doLast {
        println("generate docs")
    }
}
```

```kotlin
// 避免配置期文件 I/O
val versionProvider = providers
    .fileContents(layout.projectDirectory.file("version.txt"))
    .asText
```

## 检查清单

- 是否分别记录了 clean build、增量 build 和 CI build 的耗时。
- 是否明确区分初始化、配置、执行、依赖解析四个阶段的瓶颈。
- 是否检查了 `kapt`、自定义 task、动态依赖、配置期 I/O 和仓库顺序。
- 如果打开了 Configuration Cache，是否确认不兼容插件与告警项。
- 如果优化的是 CI，是否同步检查了远端缓存命中率和 JDK/Gradle 版本一致性。

## 反模式

- 只看总耗时，不看 Build Scan 时间线。
- 一次性打开所有缓存、并行和 JVM 参数，然后无法归因收益。
- 把 `build.gradle(.kts)` 里的重型逻辑继续留在配置期。
- 用 `+` 或动态版本依赖，导致每次构建都重新解析。
