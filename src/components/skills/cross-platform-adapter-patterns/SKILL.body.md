## 核心约束
- 领域逻辑必须平台无关；平台代码只存在于 adapter 层。
- 接口定义在共享包；每个平台独立实现，平台包之间禁止互引。
- 平台检测只出现在边界（入口、DI 容器），不渗透到业务逻辑。
- 文件扩展名分叉是构建时机制；`Platform.select` 仅用于值选择。
- 适配器不得将平台原语泄漏到共享层。
- 平台不支持某能力时必须返回类型化错误或明确降级值。

## 代码模式
- 按需读取 `references/adapter-interface.md`、`references/rust-cfg-abstraction.md`、`references/di-container.md`、`references/monorepo-layout.md`。

## 检查清单
- `shared-core` 是否零平台导入。
- 适配器注册是否集中在 app 入口。
- 依赖方向是否单向：`apps -> platform-* -> shared-core`。

## 反模式

### FAIL: 共享包 import 平台

```ts
// packages/shared-core/src/storage.ts
import { AsyncStorage } from 'react-native';  // ← 平台原语泄漏
export function save(key, value) { AsyncStorage.setItem(...); }
// 同一份 shared-core 无法在 web/electron 下编译
```

### PASS: 接口在共享 / 实现在平台

```ts
// packages/shared-core/src/storage.ts
export interface Storage { get(k: string): Promise<string | null>; set(k, v): Promise<void>; }

// platform-rn/src/storage.ts
import { AsyncStorage } from 'react-native';
export const rnStorage: Storage = { get: ..., set: ... };

// platform-web/src/storage.ts
export const webStorage: Storage = { get: k => Promise.resolve(localStorage.getItem(k)), set: ... };

// apps/mobile/src/main.ts
container.register('storage', rnStorage);
```

### FAIL: 平台包互相依赖

```
packages/platform-ios/utils.ts   import from '../platform-android/utils'
packages/platform-android/utils.ts  import from '../platform-ios/utils'
→ 循环依赖 / 编译崩
```

### PASS: 共享层兜底

```
平台包只能 import shared-core
两个平台包都不能互相 import
共用工具放 shared-core/utils
```
