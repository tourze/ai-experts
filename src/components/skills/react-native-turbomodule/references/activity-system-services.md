# 访问 Activity 和系统服务

## Activity 交互示例

```kotlin
// android/src/main/java/com/example/share/ShareModule.kt
package com.example.share

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext

class ShareModule(reactContext: ReactApplicationContext) :
    NativeShareSpec(reactContext) {

    private var pendingPromise: Promise? = null

    private val activityEventListener = object : BaseActivityEventListener() {
        override fun onActivityResult(
            activity: Activity?,
            requestCode: Int,
            resultCode: Int,
            data: Intent?
        ) {
            if (requestCode == SHARE_REQUEST_CODE) {
                pendingPromise?.resolve(resultCode == Activity.RESULT_OK)
                pendingPromise = null
            }
        }
    }

    init {
        reactContext.addActivityEventListener(activityEventListener)
    }

    override fun getName(): String = NAME

    override fun shareText(text: String, title: String, promise: Promise) {
        val activity = currentActivity
        if (activity == null) {
            promise.reject(
                "NO_ACTIVITY",
                "Activity is not available. Is the app in background?"
            )
            return
        }

        pendingPromise = promise

        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_TEXT, text)
            putExtra(Intent.EXTRA_TITLE, title)
        }
        activity.startActivityForResult(
            Intent.createChooser(intent, title),
            SHARE_REQUEST_CODE
        )
    }

    override fun openAppSettings(promise: Promise) {
        val activity = currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "Activity is not available")
            return
        }

        val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
            data = Uri.fromParts("package", activity.packageName, null)
        }
        activity.startActivity(intent)
        promise.resolve(true)
    }

    override fun invalidate() {
        reactApplicationContext.removeActivityEventListener(activityEventListener)
        super.invalidate()
    }

    companion object {
        const val NAME = "Share"
        private const val SHARE_REQUEST_CODE = 1001
    }
}
```

## 常用系统服务

```kotlin
// 获取系统服务的通用模式
val clipboardManager = reactApplicationContext
    .getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager

val batteryManager = reactApplicationContext
    .getSystemService(Context.BATTERY_SERVICE) as BatteryManager

val connectivityManager = reactApplicationContext
    .getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager

val vibrator = reactApplicationContext
    .getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
```

## 关键点

- `currentActivity` 在 `onHostDestroy` 后为 null，调用前**必须** null 检查。
- `ActivityEventListener` 在 `invalidate()` 中移除，防止内存泄漏。
- `startActivityForResult` 的结果通过 `BaseActivityEventListener.onActivityResult` 接收。
- 使用 `reactApplicationContext`（Application Context）获取系统服务；仅在需要 UI 交互时使用 `currentActivity`。
