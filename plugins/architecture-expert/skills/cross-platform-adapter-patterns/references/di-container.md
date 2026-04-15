# 依赖注入容器 — 应用启动时注册平台适配器

## 容器定义

```typescript
// packages/shared-core/src/di.ts
import type { StorageAdapter } from './storage';
import type { NotificationAdapter } from './notification';

interface PlatformServices {
  storage: StorageAdapter;
  notification: NotificationAdapter;
  // 新平台能力在这里声明，所有平台同步实现
}

let services: PlatformServices | null = null;

export function registerPlatform(impl: PlatformServices): void {
  if (services) throw new Error('平台服务已注册，不可重复注册');
  services = Object.freeze({ ...impl });
}

export function getPlatform(): PlatformServices {
  if (!services) throw new Error('平台服务未注册，请在入口处调用 registerPlatform()');
  return services;
}
```

## 入口注册示例

```typescript
// apps/tauri-app/src/main.ts
import { registerPlatform } from '@myapp/shared-core';
import { TauriStorageAdapter } from '@myapp/platform-tauri';
import { TauriNotificationAdapter } from '@myapp/platform-tauri';

registerPlatform({
  storage: new TauriStorageAdapter(),
  notification: new TauriNotificationAdapter(),
});
// 之后所有共享逻辑通过 getPlatform().storage 访问
```

```typescript
// apps/mobile/src/index.ts
import { registerPlatform } from '@myapp/shared-core';
import { RNStorageAdapter, RNNotificationAdapter } from '@myapp/platform-rn';

registerPlatform({
  storage: new RNStorageAdapter(),
  notification: new RNNotificationAdapter(),
});
```

## 测试中替换

```typescript
// packages/shared-core/src/__tests__/settings.test.ts
import { registerPlatform, getPlatform } from '../di';

beforeEach(() => {
  // 测试用 mock 适配器
  registerPlatform({
    storage: {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
    },
    notification: {
      send: vi.fn().mockResolvedValue(undefined),
    },
  });
});
```

## 要点

- 注册一次、冻结、全局只读访问。
- 业务逻辑调用 `getPlatform().storage`，不关心底层平台。
- 测试通过注入 mock 适配器实现隔离，无需启动真实平台环境。
- 新增平台能力只需在 `PlatformServices` 接口中声明，TypeScript 编译器强制所有入口同步实现。
