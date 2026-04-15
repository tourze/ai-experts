# TypeScript Spec 定义

## 基本结构

```typescript
// src/NativeDeviceInfo.ts
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  // 同步方法 —— 阻塞 JS 线程，仅用于极快操作
  getDeviceModel(): string;

  // 异步方法 —— 推荐方式
  getBatteryLevel(): Promise<number>;

  // 带复杂参数
  setConfig(config: {
    enableLogging: boolean;
    maxRetries: number;
    tags: string[];
  }): Promise<boolean>;

  // 回调方式（仅在需要多次回调时使用，否则优先 Promise）
  onDeviceShake(callback: () => void): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('DeviceInfo');
```

## package.json codegenConfig

```json
{
  "name": "react-native-device-info",
  "version": "1.0.0",
  "codegenConfig": {
    "name": "DeviceInfoSpec",
    "type": "modules",
    "jsSrcsDir": "src",
    "android": {
      "javaPackageName": "com.example.deviceinfo"
    }
  }
}
```

## 类型映射表

| TypeScript | Android (Kotlin) | iOS (Objective-C) |
|---|---|---|
| `string` | `String` | `NSString *` |
| `number` | `Double` | `NSNumber *` / `double` |
| `boolean` | `Boolean` | `BOOL` |
| `Object` (typed) | `ReadableMap` | `NSDictionary *` |
| `Array` (typed) | `ReadableArray` | `NSArray *` |
| `Promise<T>` | `Promise` | `RCTPromiseResolveBlock` + `RCTPromiseRejectBlock` |
| `() => void` | `Callback` | `RCTResponseSenderBlock` |

## 注意事项

- `getEnforcing` 在模块未注册时立即崩溃，有助于暴露注册问题；不要用 `get()` 做静默 null 回退。
- Spec 文件名必须以 `Native` 开头（如 `NativeDeviceInfo.ts`），Codegen 按此约定扫描。
- 修改 Spec 后必须重新运行 Codegen（`cd android && ./gradlew generateCodegenArtifactsFromSchema`）。
