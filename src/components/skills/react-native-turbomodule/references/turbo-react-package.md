# TurboReactPackage 注册

## 完整实现

```kotlin
// android/src/main/java/com/example/clipboard/ClipboardPackage.kt
package com.example.clipboard

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class ClipboardPackage : TurboReactPackage() {

    override fun getModule(
        name: String,
        reactContext: ReactApplicationContext
    ): NativeModule? {
        return when (name) {
            ClipboardModule.NAME -> ClipboardModule(reactContext)
            else -> null
        }
    }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        return ReactModuleInfoProvider {
            mapOf(
                ClipboardModule.NAME to ReactModuleInfo(
                    ClipboardModule.NAME,                         // name
                    "com.example.clipboard.ClipboardModule",      // className
                    false,  // canOverrideExistingModule
                    false,  // needsEagerInit
                    false,  // isCxxModule
                    true    // isTurboModule
                )
            )
        }
    }
}
```

## ReactModuleInfo 参数说明

| 参数 | 类型 | 说明 |
|---|---|---|
| `name` | String | JS 侧模块名，与 `getName()` 返回值一致 |
| `className` | String | **完整限定类名**（含包名），不是短名 |
| `canOverrideExistingModule` | Boolean | 通常 `false` |
| `needsEagerInit` | Boolean | `false` 启用懒加载，`true` 立即初始化 |
| `isCxxModule` | Boolean | 纯 C++ 模块为 `true`，Kotlin 模块为 `false` |
| `isTurboModule` | Boolean | **必须为 `true`** |

## 多模块注册

```kotlin
class MyAppPackage : TurboReactPackage() {
    override fun getModule(
        name: String,
        reactContext: ReactApplicationContext
    ): NativeModule? {
        return when (name) {
            ClipboardModule.NAME -> ClipboardModule(reactContext)
            ShareModule.NAME -> ShareModule(reactContext)
            else -> null
        }
    }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        return ReactModuleInfoProvider {
            mapOf(
                ClipboardModule.NAME to ReactModuleInfo(
                    ClipboardModule.NAME,
                    "com.example.clipboard.ClipboardModule",
                    false, false, false, true
                ),
                ShareModule.NAME to ReactModuleInfo(
                    ShareModule.NAME,
                    "com.example.share.ShareModule",
                    false, false, false, true
                ),
            )
        }
    }
}
```

## 常见错误

- `className` 填 `"ClipboardModule"` 而非 `"com.example.clipboard.ClipboardModule"`：模块注册后找不到。
- `isTurboModule` 填 `false`：模块不走 JSI 通道，退回旧 Bridge。
- `getModule()` 中做数据库/网络操作：首次 JS 调用卡住。
