# TypeScript 适配器接口 + 多平台实现

定义共享接口，每个平台提供独立实现。以存储适配器为例。

## 共享接口

```typescript
// packages/shared-core/src/storage.ts
export interface StorageAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface PlatformCapabilities {
  biometricAuth: boolean;
  secureStorage: boolean;
  fileSystem: boolean;
  notifications: boolean;
}

// 统一错误类型，不暴露平台细节
export class StorageError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'NOT_FOUND'
      | 'QUOTA_EXCEEDED'
      | 'PERMISSION_DENIED'
      | 'UNSUPPORTED',
  ) {
    super(message);
    this.name = 'StorageError';
  }
}
```

## Web 实现

```typescript
// packages/platform-web/src/storage.ts
import { StorageAdapter, StorageError } from '@myapp/shared-core';

export class WebStorageAdapter implements StorageAdapter {
  async get(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key);
    } catch {
      throw new StorageError('localStorage 不可用', 'PERMISSION_DENIED');
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch {
      throw new StorageError('存储配额已满', 'QUOTA_EXCEEDED');
    }
  }

  async remove(key: string): Promise<void> {
    localStorage.removeItem(key);
  }
  async clear(): Promise<void> {
    localStorage.clear();
  }
}
```

## Tauri 实现

```typescript
// packages/platform-tauri/src/storage.ts
import { StorageAdapter } from '@myapp/shared-core';
import { Store } from '@tauri-apps/plugin-store';

export class TauriStorageAdapter implements StorageAdapter {
  private store: Store;

  constructor(path: string = 'app_store.bin') {
    this.store = new Store(path);
  }

  async get(key: string): Promise<string | null> {
    return (await this.store.get<string>(key)) ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    await this.store.set(key, value);
    await this.store.save();
  }

  async remove(key: string): Promise<void> {
    await this.store.delete(key);
    await this.store.save();
  }

  async clear(): Promise<void> {
    await this.store.clear();
    await this.store.save();
  }
}
```

## React Native 实现

```typescript
// packages/platform-rn/src/storage.ts
import { StorageAdapter } from '@myapp/shared-core';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class RNStorageAdapter implements StorageAdapter {
  async get(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  }

  async set(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  }

  async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }

  async clear(): Promise<void> {
    await AsyncStorage.clear();
  }
}
```

## 要点

- 接口在 `shared-core` 中定义，零平台依赖。
- 每个平台实现 `implements StorageAdapter`，编译器保证接口完整性。
- 错误类型统一为 `StorageError`，不暴露 `DOMException`、`AsyncStorageError` 等平台细节。
- 平台实现之间无互相引用。
