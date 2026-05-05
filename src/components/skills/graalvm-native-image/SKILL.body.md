## 代码模式

```xml
<!-- Maven: 将 native 构建隔离在独立 profile -->
<profile>
  <id>native</id>
  <build>
    <plugins>
      <plugin>
        <groupId>org.graalvm.buildtools</groupId>
        <artifactId>native-maven-plugin</artifactId>
        <version>0.10.6</version>
        <extensions>true</extensions>
      </plugin>
    </plugins>
  </build>
</profile>
```

```kotlin
// Gradle Kotlin DSL
plugins {
    id("org.graalvm.buildtools.native") version "0.10.6"
}

graalvmNative {
    binaries.named("main") {
        imageName.set(project.name)
        buildArgs.add("--no-fallback")
    }
}
```

```java
// Spring Boot 3.x：优先使用 RuntimeHints 注册反射
public final class UserRuntimeHints implements RuntimeHintsRegistrar {
    @Override
    public void registerHints(RuntimeHints hints, ClassLoader classLoader) {
        hints.reflection().registerType(UserDto.class, builder -> builder.withMembers());
    }
}
```

```bash
# 失败时先保留完整日志，再逐项修复
./mvnw -Pnative package 2>&1 | tee native-build.log
# 或
./gradlew nativeCompile 2>&1 | tee native-build.log
```
