# JS 消费端封装

## 类型安全的封装层

```typescript
// src/deviceInfo.ts
import NativeDeviceInfo from './NativeDeviceInfo';

export async function getBatteryLevel(): Promise<number> {
  return NativeDeviceInfo.getBatteryLevel();
}

export function getDeviceModel(): string {
  return NativeDeviceInfo.getDeviceModel();
}

export async function setConfig(options: {
  enableLogging?: boolean;
  maxRetries?: number;
  tags?: string[];
}): Promise<boolean> {
  return NativeDeviceInfo.setConfig({
    enableLogging: options.enableLogging ?? false,
    maxRetries: options.maxRetries ?? 3,
    tags: options.tags ?? [],
  });
}
```

## 设计原则

- 封装层提供默认值和参数校验，Spec 接口保持原始映射。
- 可选参数在封装层处理，Spec 中的参数都是必填的。
- 封装层是添加 JSDoc、参数转换和错误包装的正确位置。
- 不要在封装层中缓存原生模块引用以外的状态；状态留在原生侧。
