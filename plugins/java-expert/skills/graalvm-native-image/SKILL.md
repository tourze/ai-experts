---
name: graalvm-native-image
description: 当需要构建或排障 GraalVM Native Image 时使用。
---

# GraalVM Native Image

## 适用场景

- 需要把 JVM 应用编译成原生可执行文件，以降低冷启动和内存占用。
- Native build 失败，报 `ClassNotFoundException`、反射、资源、代理或序列化相关错误。
- 要为 Spring Boot、Quarkus、Micronaut 或纯 Java 项目补齐原生镜像配置。
- 如果构建时间本身是主要问题，联动 [gradle-build-performance](../gradle-build-performance/SKILL.md)。

## 核心约束

- 先识别环境，再改配置：必须先确认构建工具、框架、Java 版本和失败日志，再决定 Maven/Gradle 路线。
- 一次只修一个失败类别：先处理最早的原生构建错误，不要同时追加多份 metadata。
- 元数据位置必须清晰：优先使用 `META-INF/native-image/<group>/<artifact>/` 下的配置。
- Spring Boot 3.x 优先 `RuntimeHints`；只有第三方库或无法代码注册时才退回 JSON metadata。
- 若引用更细节的构建片段，直接跳到：
  [Maven Native Profile](references/maven-native-profile.md)、
  [Gradle Native Plugin](references/gradle-native-plugin.md)、
  [Spring Boot Native](references/spring-boot-native.md)、
  [Quarkus / Micronaut](references/quarkus-micronaut-native.md)、
  [Reflection / Resource Config](references/reflection-resource-config.md)、
  [Tracing Agent](references/tracing-agent.md)。

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

## 检查清单

- 是否确认了 Java 版本、构建工具和框架种类。
- 是否先跑出完整 native build 日志，并针对第一条阻断错误修复。
- 是否区分了反射、资源、代理、序列化、JNI 这几类 reachability metadata。
- Spring Boot 项目是否优先评估 `RuntimeHints`，而不是先堆 JSON。
- 构建成功后是否验证了启动、健康检查、启动时长和 RSS，而不只看“编译过了”。

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
