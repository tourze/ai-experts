# Gradle Codegen 配置

## build.gradle 配置

```groovy
// android/build.gradle（模块级）
plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
    id("com.facebook.react")
}

android {
    namespace = "com.example.clipboard"
    compileSdk = 34

    defaultConfig {
        minSdk = 24
    }

    sourceSets {
        main {
            java.srcDirs += "build/generated/source/codegen/java"
        }
    }
}

react {
    codegenConfig {
        name = "ClipboardSpec"
        codegenJavaPackageName = "com.example.clipboard"
    }
}

dependencies {
    implementation("com.facebook.react:react-android")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
}
```

## 手动触发 Codegen

```bash
# 从项目根目录
cd android && ./gradlew generateCodegenArtifactsFromSchema

# 生成的文件位置
# android/build/generated/source/codegen/java/com/example/clipboard/
#   NativeClipboardSpec.java
```

## 在 MainApplication 中注册 Package

```kotlin
// android/app/src/main/java/com/example/app/MainApplication.kt
class MainApplication : Application(), ReactApplication {
    override val reactNativeHost: ReactNativeHost =
        object : DefaultReactNativeHost(this) {
            override fun getPackages(): List<ReactPackage> =
                PackageList(this).packages.apply {
                    add(ClipboardPackage())
                }

            override fun getJSMainModuleName(): String = "index"

            override val isNewArchEnabled: Boolean
                get() = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED

            override val isHermesEnabled: Boolean
                get() = BuildConfig.IS_HERMES_ENABLED
        }
}
```

## Codegen 常见问题

| 问题 | 原因 | 解决 |
|---|---|---|
| 找不到 `NativeClipboardSpec` | Codegen 未运行 | `./gradlew generateCodegenArtifactsFromSchema` |
| Codegen 静默跳过 | `package.json` 中 `codegenConfig` 缺失或拼错 | 检查 `name`、`type`、`jsSrcsDir` |
| 生成的方法签名不匹配 | Spec 改了但没重新生成 | 清除 build 目录后重新生成 |
| `javaPackageName` 不对 | Gradle 和 package.json 中的包名不一致 | 两处保持一致 |

## 关键点

- `react { codegenConfig { ... } }` 在 Gradle 中配置，与 `package.json` 的 `codegenConfig` 配合使用。
- `sourceSets.main.java.srcDirs` 必须包含 Codegen 输出目录，否则 IDE 找不到生成的基类。
- 每次修改 TypeScript Spec 后都要重新运行 Codegen。
