# 边界文件模式

## 类型定义（平台无关）

```typescript
// src/storage/storage.types.ts
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}
```

## Web 实现

```typescript
// src/storage/index.ts（Web 平台默认）
import type { StorageAdapter } from './storage.types';

const webStorage: StorageAdapter = {
  async getItem(key) {
    return localStorage.getItem(key);
  },
  async setItem(key, value) {
    localStorage.setItem(key, value);
  },
  async removeItem(key) {
    localStorage.removeItem(key);
  },
  async clear() {
    localStorage.clear();
  },
};

export default webStorage;
```

## Native 实现（iOS + Android 共享）

```typescript
// src/storage/index.native.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StorageAdapter } from './storage.types';

const nativeStorage: StorageAdapter = {
  async getItem(key) {
    return AsyncStorage.getItem(key);
  },
  async setItem(key, value) {
    await AsyncStorage.setItem(key, value);
  },
  async removeItem(key) {
    await AsyncStorage.removeItem(key);
  },
  async clear() {
    await AsyncStorage.clear();
  },
};

export default nativeStorage;
```

## Tauri 桌面端实现

```typescript
// src/storage/index.tauri.ts
import { Store } from '@tauri-apps/plugin-store';
import type { StorageAdapter } from './storage.types';

let store: Store | null = null;

async function getStore(): Promise<Store> {
  if (!store) {
    store = await Store.load('settings.json');
  }
  return store;
}

const tauriStorage: StorageAdapter = {
  async getItem(key) {
    const s = await getStore();
    return (await s.get<string>(key)) ?? null;
  },
  async setItem(key, value) {
    const s = await getStore();
    await s.set(key, value);
    await s.save();
  },
  async removeItem(key) {
    const s = await getStore();
    await s.delete(key);
    await s.save();
  },
  async clear() {
    const s = await getStore();
    await s.clear();
    await s.save();
  },
};

export default tauriStorage;
```

## 业务代码消费

```typescript
// 业务代码只导入边界，不关心平台
import storage from '../storage';

async function loadUserPreferences() {
  const raw = await storage.getItem('user_prefs');
  return raw ? JSON.parse(raw) : {};
}
```

## 解析优先级

Bundler 按如下顺序解析 `import from '../storage'`：

1. `index.ios.ts` / `index.android.ts`（当平台匹配时）
2. `index.native.ts`（iOS 和 Android 共享）
3. `index.tauri.ts`（需自定义 Metro/Vite 配置）
4. `index.ts`（默认，通常为 Web）
