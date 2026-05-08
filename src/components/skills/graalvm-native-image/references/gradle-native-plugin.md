# Gradle GraalVM Native Build Tools 插件

使用 Native Build Tools 插件构建 GraalVM native image 的完整 Gradle 配置。

## 目录

1. [插件设置](#插件设置)
2. [配置选项](#配置选项)
3. [Spring Boot Gradle 集成](#spring-boot-gradle-集成)
4. [在 Native 模式下测试](#在-native-模式下测试)
5. [多项目构建](#多项目构建)

---

## 插件设置

### Kotlin DSL（`build.gradle.kts`）

```kotlin
plugins {
    java
    id("org.graalvm.buildtools.native") version "0.10.6"
}

graalvmNative {
    binaries {
        named("main") {
            imageName.set(project.name)
            mainClass.set("com.example.Application")
            buildArgs.add("--no-fallback")
            buildArgs.add("-H:+ReportExceptionStackTraces")
            javaLauncher.set(javaToolchains.launcherFor {
                languageVersion.set(JavaLanguageVersion.of(21))
                vendor.set(JvmVendorSpec.matching("GraalVM"))
            })
        }
    }
}
```

### Groovy DSL（`build.gradle`）

```groovy
plugins {
    id 'java'
    id 'org.graalvm.buildtools.native' version '0.10.6'
}

graalvmNative {
    binaries {
        main {
            imageName = project.name
            mainClass = 'com.example.Application'
            buildArgs.add('--no-fallback')
            buildArgs.add('-H:+ReportExceptionStackTraces')
        }
    }
}
```

使用以下命令构建：

```bash
./gradlew nativeCompile
```

原生可执行文件生成在 `build/native/nativeCompile/` 目录中。

## 配置选项

### Binary 配置

```kotlin
graalvmNative {
    binaries {
        named("main") {
            imageName.set(project.name)
            mainClass.set("com.example.Application")

            // 构建参数
            buildArgs.addAll(
                "--no-fallback",
                "-H:+ReportExceptionStackTraces",
                "--enable-https",
                "-J-Xmx8g"
            )

            // 快速构建模式（构建更快，运行时更慢——仅开发用）
            quickBuild.set(false)

            // 构建时输出富文本
            richOutput.set(true)

            // 详细输出
            verbose.set(true)

            // 资源包含
            resources {
                autodetect()
                includedPatterns.add("application.*")
                includedPatterns.add("META-INF/.*")
            }
        }
    }

    // GraalVM metadata 仓库
    metadataRepository {
        enabled.set(true)
        version.set("0.3.14")
    }

    // 工具链检测
    toolchainDetection.set(true)
}
```

### Java 工具链配置

```kotlin
java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(21))
    }
}

graalvmNative {
    binaries {
        named("main") {
            javaLauncher.set(javaToolchains.launcherFor {
                languageVersion.set(JavaLanguageVersion.of(21))
                vendor.set(JvmVendorSpec.matching("GraalVM Community"))
            })
        }
    }
}
```

## Spring Boot Gradle 集成

对于使用 Gradle 的 Spring Boot 3.x 项目：

```kotlin
plugins {
    java
    id("org.springframework.boot") version "3.4.1"
    id("io.spring.dependency-management") version "1.1.7"
    id("org.graalvm.buildtools.native") version "0.10.6"
}

// 当检测到 GraalVM Native Image 插件时，
// Spring Boot 插件会自动配置 AOT 处理
```

构建命令：

```bash
# 编译为原生可执行文件
./gradlew nativeCompile

# 使用 Cloud Native Buildpacks 构建 OCI 镜像
./gradlew bootBuildImage

# 运行原生可执行文件
./build/native/nativeCompile/<app-name>

# 仅运行 AOT 处理
./gradlew processAot
```

### 自定义 AOT 配置

```kotlin
tasks.withType<org.springframework.boot.gradle.tasks.aot.ProcessAot>().configureEach {
    args("--spring.profiles.active=prod")
}

graalvmNative {
    binaries {
        named("main") {
            buildArgs.addAll(
                "--no-fallback",
                "-H:+ReportExceptionStackTraces"
            )
        }
    }
}
```

## 在 Native 模式下测试

运行编译为原生可执行文件的 JUnit 测试：

```bash
./gradlew nativeTest
```

配置 test binary：

```kotlin
graalvmNative {
    binaries {
        named("test") {
            buildArgs.addAll(
                "--no-fallback",
                "-H:+ReportExceptionStackTraces"
            )
        }
    }

    // 配置测试支持
    testSupport.set(true)
}
```

## 多项目构建

对于多项目 Gradle 构建，仅在可执行子项目中应用插件：

```kotlin
// settings.gradle.kts
pluginManagement {
    plugins {
        id("org.graalvm.buildtools.native") version "0.10.6"
    }
}

// app/build.gradle.kts（可执行子项目）
plugins {
    id("org.graalvm.buildtools.native")
}

graalvmNative {
    binaries {
        named("main") {
            imageName.set("my-app")
            mainClass.set("com.example.Application")
        }
    }
}
```
