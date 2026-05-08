# Quarkus & Micronaut Native Image 支持

原生优先的 Java 框架与 GraalVM Native Image 的配置模式。

## 目录

1. [Quarkus 原生构建](#quarkus-原生构建)
2. [Quarkus 配置](#quarkus-配置)
3. [Micronaut 原生构建](#micronaut-原生构建)
4. [Micronaut 配置](#micronaut-配置)
5. [对比](#对比)

---

## Quarkus 原生构建

Quarkus 设计为原生优先，几乎不需要 GraalVM 特定配置。

### 构建原生可执行文件

```bash
# 使用 Maven（Quarkus Maven 插件处理原生构建）
./mvnw package -Dnative

# 使用 Gradle
./gradlew build -Dquarkus.native.enabled=true

# 使用 Quarkus CLI
quarkus build --native
```

### 容器构建（无需本地 GraalVM）

```bash
# 在容器中构建（使用 Mandrel/GraalVM 镜像）
./mvnw package -Dnative -Dquarkus.native.container-build=true

# 指定自定义构建器镜像
./mvnw package -Dnative \
    -Dquarkus.native.container-build=true \
    -Dquarkus.native.builder-image=quay.io/quarkus/ubi-quarkus-mandrel-builder-image:jdk-21
```

### 多阶段 Dockerfile

```dockerfile
FROM quay.io/quarkus/ubi-quarkus-mandrel-builder-image:jdk-21 AS builder
COPY --chown=quarkus:quarkus mvnw /code/mvnw
COPY --chown=quarkus:quarkus .mvn /code/.mvn
COPY --chown=quarkus:quarkus pom.xml /code/
COPY --chown=quarkus:quarkus src /code/src
USER quarkus
WORKDIR /code
RUN ./mvnw package -Dnative -DskipTests

FROM quay.io/quarkus/quarkus-micro-image:2.0
WORKDIR /work/
COPY --from=builder /code/target/*-runner /work/application
RUN chmod 775 /work/application
EXPOSE 8080
CMD ["./application", "-Dquarkus.http.host=0.0.0.0"]
```

## Quarkus 配置

### application.properties

```properties
# 原生镜像构建选项
quarkus.native.additional-build-args=--no-fallback,-H:+ReportExceptionStackTraces

# 资源包含
quarkus.native.resources.includes=templates/**,META-INF/resources/**

# 启用 HTTPS 支持
quarkus.native.enable-https-url-handler=true

# 构建内存
quarkus.native.native-image-xmx=8g
```

### 注册反射

Quarkus 提供了注册反射类的注解：

```java
import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public class MyDto {
    private String name;
    private int age;
    // 构造器、getter、setter
}

// 注册多个类（包含嵌套类型）
@RegisterForReflection(targets = {MyDto.class, OrderDto.class},
                       serialization = true)
public class ReflectionConfig {
}
```

### 测试原生构建

```java
import io.quarkus.test.junit.QuarkusIntegrationTest;

@QuarkusIntegrationTest
public class NativeMyResourceIT {

    @Test
    public void testHelloEndpoint() {
        given()
            .when().get("/hello")
            .then()
            .statusCode(200)
            .body(is("Hello"));
    }
}
```

运行原生集成测试：

```bash
./mvnw verify -Dnative
```

---

## Micronaut 原生构建

Micronaut 使用编译时依赖注入和 AOT 处理，与 GraalVM 高度兼容。

### 构建原生可执行文件

```bash
# 使用 Maven
./mvnw package -Dpackaging=native-image

# 使用 Gradle
./gradlew nativeCompile

# 使用 Micronaut CLI
mn create-app --build=gradle --jdk=21 --features=graalvm myapp
```

### Gradle 配置

```kotlin
plugins {
    id("io.micronaut.application") version "4.4.4"
    id("org.graalvm.buildtools.native") version "0.10.6"
}

micronaut {
    runtime("netty")
    testRuntime("junit5")
    processing {
        incremental(true)
        annotations("com.example.*")
    }
}

graalvmNative {
    binaries {
        named("main") {
            buildArgs.add("--no-fallback")
        }
    }
}
```

### Maven 配置

```xml
<plugin>
    <groupId>io.micronaut.maven</groupId>
    <artifactId>micronaut-maven-plugin</artifactId>
    <configuration>
        <configFile>aot-${packaging}.properties</configFile>
    </configuration>
</plugin>

<profiles>
    <profile>
        <id>native</id>
        <properties>
            <packaging>native-image</packaging>
            <micronaut.runtime>netty</micronaut.runtime>
        </properties>
    </profile>
</profiles>
```

## Micronaut 配置

### 注册反射

Micronaut 最小化反射使用，但在需要时：

```java
import io.micronaut.core.annotation.ReflectiveAccess;

@ReflectiveAccess
public class MyDto {
    private String name;
    private int age;
}

// 或使用 @Introspected 进行 Bean 内省（推荐）
import io.micronaut.core.annotation.Introspected;

@Introspected
public class MyDto {
    private String name;
    private int age;
}
```

### 资源包含

在 `src/main/resources/META-INF/native-image/resource-config.json` 中：

```json
{
  "resources": {
    "includes": [
      {"pattern": "application\\.yml"},
      {"pattern": "logback\\.xml"},
      {"pattern": "META-INF/.*"}
    ]
  }
}
```

### Docker 构建

```bash
# 使用 Micronaut Gradle 插件
./gradlew dockerBuildNative

# 多阶段 Dockerfile
FROM ghcr.io/graalvm/native-image-community:21 AS builder
WORKDIR /app
COPY . .
RUN ./gradlew nativeCompile --no-daemon

FROM debian:bookworm-slim
COPY --from=builder /app/build/native/nativeCompile/myapp /app/myapp
EXPOSE 8080
ENTRYPOINT ["/app/myapp"]
```

---

## 对比

| 特性 | Quarkus | Micronaut |
|---------|---------|-----------|
| DI 方式 | 构建时 ArC | 编译时注解处理器 |
| 原生构建命令 | `./mvnw package -Dnative` | `./gradlew nativeCompile` |
| 反射注解 | `@RegisterForReflection` | `@Introspected` / `@ReflectiveAccess` |
| 容器构建 | 内置容器构建支持 | Docker 插件 |
| 开发模式 | `quarkus dev`（热重载） | `mn run` + 重启 |
| 原生启动时间 | ~10-50ms | ~10-50ms |
| 典型 RSS | ~20-50MB | ~20-50MB |
| GraalVM 版本 | Mandrel（Red Hat 发行版） | GraalVM CE/EE |
