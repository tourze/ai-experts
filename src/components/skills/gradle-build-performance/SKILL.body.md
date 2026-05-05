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
