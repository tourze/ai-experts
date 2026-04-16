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

### FAIL: 一次开启所有优化

```properties
# gradle.properties — 一次性
org.gradle.configuration-cache=true
org.gradle.caching=true
org.gradle.parallel=true
org.gradle.workers.max=16
org.gradle.jvmargs=-Xmx8g -XX:+UseG1GC ...
```
```
build 时间从 2min 变 1min30s
→ 哪个优化起作用？回退哪个安全？无法归因
→ 某个 plugin 不兼容 configuration-cache，CI 间歇性失败
```

### PASS: 一次一个 + 测量

```bash
# 基线
./gradlew assembleDebug --profile  # 报告 1: 2min00s
# 改 1：开 build cache
./gradlew assembleDebug --profile  # 报告 2: 1min45s（-15s）
# 改 2：开 parallel
./gradlew assembleDebug --profile  # 报告 3: 1min20s（-25s）
# 改 3：开 configuration-cache
./gradlew assembleDebug --profile  # 报告 4: 1min05s（-15s）
# 每步可独立确认收益和兼容性
```

### FAIL: 配置期重型 I/O

```kotlin
// build.gradle.kts (配置期)
val version = File("version.txt").readText()  // 每次配置都读
val gitSha = "git rev-parse HEAD".runCommand()  // 每次都 fork 进程
```

### PASS: Provider 延迟到执行期

```kotlin
val versionProvider = providers.fileContents(
    layout.projectDirectory.file("version.txt")
).asText
val gitProvider = providers.exec {
    commandLine("git", "rev-parse", "HEAD")
}.standardOutput.asText
// 只在真正需要时才读取
```
