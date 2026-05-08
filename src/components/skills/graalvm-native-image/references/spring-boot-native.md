# Spring Boot Native Image 支持

将 Spring Boot 3.x 应用程序构建为 GraalVM native image 的完整指南，包括 AOT 处理。

## 目录

1. [前提条件](#前提条件)
2. [AOT 处理](#aot-处理)
3. [RuntimeHints 注册](#runtimehints-注册)
4. [常用注解](#常用注解)
5. [原生环境中的条件 Bean](#原生环境中的条件-bean)
6. [测试原生应用](#测试原生应用)
7. [Cloud Native Buildpacks](#cloud-native-buildpacks)

---

## 前提条件

- Spring Boot 3.0+（推荐：3.4+）
- GraalVM JDK 21+ 或安装了 `native-image` 的 GraalVM CE
- Native Build Tools 插件（Maven 或 Gradle）

Spring Boot 3.x 提供了一流的 GraalVM Native Image 支持。`spring-boot-starter-parent` 包含一个 `native` profile，带有所有必要配置。

## AOT 处理

Spring Boot AOT 处理在构建时生成优化代码，替代运行时反射：

**AOT 的作用：**
- 在构建时评估 `@Conditional` 注解
- 将 Bean 定义生成为源代码
- 为剩余的动态访问创建反射提示
- 预先计算组件扫描和自动配置

**重要约束：**
- Bean 定义必须在构建时固定
- `@Profile` 条件在 AOT 期间评估——活动 profile 必须在构建时指定
- `@ConditionalOnProperty` 在构建时评估
- 类路径在 AOT 处理和运行时之间必须保持一致

### 在构建时配置活动 Profile

```xml
<!-- Maven -->
<plugin>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-maven-plugin</artifactId>
    <executions>
        <execution>
            <id>process-aot</id>
            <configuration>
                <profiles>prod</profiles>
            </configuration>
        </execution>
    </executions>
</plugin>
```

```kotlin
// Gradle
tasks.withType<org.springframework.boot.gradle.tasks.aot.ProcessAot>().configureEach {
    args("--spring.profiles.active=prod")
}
```

## RuntimeHints 注册

当 Spring Boot 的自动提示检测不足时，手动注册提示：

### 使用 `RuntimeHintsRegistrar`

```java
import org.springframework.aot.hint.RuntimeHints;
import org.springframework.aot.hint.RuntimeHintsRegistrar;
import org.springframework.context.annotation.ImportRuntimeHints;

@ImportRuntimeHints(MyRuntimeHints.class)
@Configuration
public class AppConfig {
    // ...
}

public class MyRuntimeHints implements RuntimeHintsRegistrar {

    @Override
    public void registerHints(RuntimeHints hints, ClassLoader classLoader) {
        // 注册反射
        hints.reflection()
            .registerType(MyDto.class,
                builder -> builder
                    .withMembers(MemberCategory.INVOKE_DECLARED_CONSTRUCTORS,
                                 MemberCategory.INVOKE_DECLARED_METHODS,
                                 MemberCategory.DECLARED_FIELDS));

        // 注册资源
        hints.resources()
            .registerPattern("templates/*.html")
            .registerPattern("static/**");

        // 注册序列化
        hints.serialization()
            .registerType(MySerializableClass.class);

        // 注册代理
        hints.proxies()
            .registerJdkProxy(MyInterface.class);
    }
}
```

### 使用 `@RegisterReflectionForBinding`

一种便利注解，用于为 DTO 和数据类注册反射提示：

```java
@RestController
@RegisterReflectionForBinding({UserDto.class, OrderDto.class, AddressDto.class})
public class UserController {

    @GetMapping("/users/{id}")
    public UserDto getUser(@PathVariable Long id) {
        return userService.findById(id);
    }
}
```

### 使用 `@Reflective`

标记单个类以注册反射：

```java
@Reflective
public class MyDto {
    private String name;
    private int age;
    // getter、setter、构造器
}
```

## 常用注解

| 注解 | 用途 |
|-----------|---------|
| `@RegisterReflectionForBinding` | 注册 DTO 的反射（构造器、方法、字段） |
| `@Reflective` | 标记一个类进行反射注册 |
| `@ImportRuntimeHints` | 导入 `RuntimeHintsRegistrar` 实现 |
| `@AotTestAttributes` | 在 AOT 处理期间提供测试属性 |

## 原生环境中的条件 Bean

使用 `@Conditional` 注解的 Bean 在 AOT 处理期间于构建时评估：

```java
// 这个有效——条件在构建时解析
@Configuration
@Profile("prod")
public class ProdConfig {
    @Bean
    public DataSource dataSource() { /* ... */ }
}

// 这要求属性在构建时可用
@Configuration
@ConditionalOnProperty(name = "feature.enabled", havingValue = "true")
public class FeatureConfig {
    @Bean
    public FeatureService featureService() { /* ... */ }
}
```

**最佳实践：** 对于原生镜像，优先使用环境变量而非属性进行运行时切换的配置。

## 测试原生应用

### 原生测试执行

在原生模式下运行 JUnit 测试以验证 AOT 编译的测试：

```bash
# Maven
./mvnw -Pnative test

# Gradle
./gradlew nativeTest
```

### 测试特定的 AOT 处理

```bash
# Maven
./mvnw -Pnative spring-boot:process-test-aot

# Gradle
./gradlew processTestAot
```

### RuntimeHints 测试

在不构建原生镜像的情况下验证 RuntimeHints 是否正确注册：

```java
import org.springframework.aot.hint.RuntimeHints;
import org.springframework.aot.hint.predicate.RuntimeHintsPredicates;

@Test
void shouldRegisterHints() {
    RuntimeHints hints = new RuntimeHints();
    new MyRuntimeHints().registerHints(hints, getClass().getClassLoader());

    assertThat(RuntimeHintsPredicates.reflection()
        .onType(MyDto.class)
        .withMemberCategories(MemberCategory.INVOKE_DECLARED_CONSTRUCTORS))
        .accepts(hints);

    assertThat(RuntimeHintsPredicates.resource()
        .forResource("templates/index.html"))
        .accepts(hints);
}
```

## Cloud Native Buildpacks

使用 Paketo Buildpacks 构建 OCI 镜像（无需本地 GraalVM 安装）：

```bash
# Maven
./mvnw -Pnative spring-boot:build-image \
    -Dspring-boot.build-image.imageName=myapp:native

# Gradle
./gradlew bootBuildImage \
    --imageName=myapp:native
```

在 `pom.xml` 中配置构建器：

```xml
<plugin>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-maven-plugin</artifactId>
    <configuration>
        <image>
            <builder>paketobuildpacks/builder-jammy-tiny:latest</builder>
            <env>
                <BP_NATIVE_IMAGE>true</BP_NATIVE_IMAGE>
                <BP_NATIVE_IMAGE_BUILD_ARGUMENTS>
                    --no-fallback -H:+ReportExceptionStackTraces
                </BP_NATIVE_IMAGE_BUILD_ARGUMENTS>
            </env>
        </image>
    </configuration>
</plugin>
```
