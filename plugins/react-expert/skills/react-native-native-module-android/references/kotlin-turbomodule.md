# 基础 Kotlin TurboModule

## 完整实现

```kotlin
// android/src/main/java/com/example/clipboard/ClipboardModule.kt
package com.example.clipboard

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableNativeMap
import kotlinx.coroutines.*

class ClipboardModule(reactContext: ReactApplicationContext) :
    NativeClipboardSpec(reactContext) {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun getName(): String = NAME

    // 同步方法
    override fun hasClipboardContent(): Boolean {
        val cm = reactApplicationContext
            .getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        return cm.hasPrimaryClip()
    }

    // 异步方法
    override fun getClipboardText(promise: Promise) {
        scope.launch {
            try {
                val cm = reactApplicationContext
                    .getSystemService(Context.CLIPBOARD_SERVICE)
                    as ClipboardManager
                val text = cm.primaryClip
                    ?.getItemAt(0)
                    ?.text
                    ?.toString() ?: ""
                promise.resolve(text)
            } catch (e: Exception) {
                promise.reject("CLIPBOARD_ERROR", e.message, e)
            }
        }
    }

    // 带复杂参数和返回值
    override fun setClipboardContent(content: ReadableMap, promise: Promise) {
        scope.launch {
            try {
                val text = content.getString("text") ?: ""
                val label = content.getString("label") ?: "Copied"
                val cm = reactApplicationContext
                    .getSystemService(Context.CLIPBOARD_SERVICE)
                    as ClipboardManager
                val clip = ClipData.newPlainText(label, text)
                cm.setPrimaryClip(clip)

                val result = WritableNativeMap().apply {
                    putBoolean("success", true)
                    putInt("length", text.length)
                }
                promise.resolve(result)
            } catch (e: Exception) {
                promise.reject("CLIPBOARD_SET_ERROR", e.message, e)
            }
        }
    }

    override fun invalidate() {
        scope.cancel()
        super.invalidate()
    }

    companion object {
        const val NAME = "Clipboard"
    }
}
```

## 类型映射

| Spec 类型 | Kotlin 参数类型 | 读取方法 |
|---|---|---|
| `string` | `String` | 直接使用 |
| `number` | `Double` | `.toInt()` 转换 |
| `boolean` | `Boolean` | 直接使用 |
| `Object` | `ReadableMap` | `.getString()`, `.getInt()`, `.getBoolean()` |
| `Array` | `ReadableArray` | `.getString(i)`, `.getInt(i)` |
| `Promise<T>` | `Promise` | `.resolve()`, `.reject()` |

## 关键点

- 继承 `NativeClipboardSpec`（Codegen 生成的基类），不要继承 `ReactContextBaseJavaModule`。
- 耗时操作用 `scope.launch { ... }` 转到 `Dispatchers.IO`。
- `invalidate()` 中必须 `scope.cancel()`，否则模块销毁后协程仍在运行。
- `Promise.reject` 三个参数：error code（字符串）、message、原始 Exception。
