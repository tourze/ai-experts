# Android Kotlin 实现

## TurboModule 实现

```kotlin
// android/src/main/java/com/example/deviceinfo/DeviceInfoModule.kt
package com.example.deviceinfo

import android.os.BatteryManager
import android.os.Build
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.example.deviceinfo.NativeDeviceInfoSpec

class DeviceInfoModule(reactContext: ReactApplicationContext) :
    NativeDeviceInfoSpec(reactContext) {

    override fun getName(): String = NAME

    override fun getDeviceModel(): String {
        return "${Build.MANUFACTURER} ${Build.MODEL}"
    }

    override fun getBatteryLevel(promise: Promise) {
        try {
            val bm = reactApplicationContext
                .getSystemService(android.content.Context.BATTERY_SERVICE)
                as BatteryManager
            val level = bm.getIntProperty(
                BatteryManager.BATTERY_PROPERTY_CAPACITY
            )
            promise.resolve(level.toDouble())
        } catch (e: Exception) {
            promise.reject("BATTERY_ERROR", e.message, e)
        }
    }

    override fun setConfig(config: ReadableMap, promise: Promise) {
        val enableLogging = config.getBoolean("enableLogging")
        val maxRetries = config.getInt("maxRetries")
        val tags = config.getArray("tags")
        // ... 业务逻辑
        promise.resolve(true)
    }

    override fun onDeviceShake(callback: com.facebook.react.bridge.Callback) {
        // 注册传感器监听，触发时回调
    }

    companion object {
        const val NAME = "DeviceInfo"
    }
}
```

## TurboReactPackage 注册

```kotlin
// android/src/main/java/com/example/deviceinfo/DeviceInfoPackage.kt
package com.example.deviceinfo

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class DeviceInfoPackage : TurboReactPackage() {

    override fun getModule(
        name: String,
        reactContext: ReactApplicationContext
    ): NativeModule? {
        return if (name == DeviceInfoModule.NAME) {
            DeviceInfoModule(reactContext)
        } else {
            null
        }
    }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        return ReactModuleInfoProvider {
            mapOf(
                DeviceInfoModule.NAME to ReactModuleInfo(
                    DeviceInfoModule.NAME,                        // name
                    "com.example.deviceinfo.DeviceInfoModule",    // className（完整限定名）
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

## 关键点

- `className` 必须是完整限定类名（含包名），填短名会导致模块查找失败。
- `needsEagerInit` 保持 `false` 以启用懒加载，不要在 `getModule()` 中做耗时操作。
- `isTurboModule` 必须为 `true`，否则不走 JSI 通道。
