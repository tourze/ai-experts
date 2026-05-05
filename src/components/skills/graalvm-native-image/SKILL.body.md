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

## 反模式

### FAIL: 用宽泛配置掩盖问题

```json
{
  "reflect-config.json": [
    { "name": "java.lang.**", "allDeclaredMethods": true,
      "allDeclaredConstructors": true, "allDeclaredFields": true },
    { "name": "com.example.**", "allDeclaredMethods": true, ... }
  ]
}
// 镜像从 50MB 膨胀到 250MB
// 任何后续问题都被这个"通配符地毯"掩盖
```

### PASS: 精确到类

```java
// Spring Boot 3.x：用 RuntimeHints
public final class UserRuntimeHints implements RuntimeHintsRegistrar {
    @Override
    public void registerHints(RuntimeHints hints, ClassLoader cl) {
        hints.reflection().registerType(UserDto.class,
            MemberCategory.INVOKE_DECLARED_CONSTRUCTORS,
            MemberCategory.INVOKE_DECLARED_METHODS);
        hints.reflection().registerType(OrderDto.class, ...);
    }
}
// 只注册真正需要反射的类，体积可控
```

### FAIL: 不看日志就改配置

```bash
./mvnw -Pnative package  # 失败
# 立即添加 5 个 reflect-config + 3 个 resource-config + tracing agent
# 仍然失败
# 实际：第一个错误是 Java 版本不对，跟反射无关
```

### PASS: 看第一条阻塞错误

```bash
./mvnw -Pnative package 2>&1 | tee build.log
grep -i "error" build.log | head -5
# 发现：Java 17 vs GraalVM 21 不兼容 → 升级 JDK
# 重跑 → 第二个错误才是真正的反射问题
```
