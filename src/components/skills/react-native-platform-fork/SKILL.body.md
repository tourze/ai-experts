# 跨平台代码组织

## 适用场景

- 需要为 iOS/Android/Web/Tauri 提供不同实现时。
- 业务代码中 `Platform.OS` 判断散落各处需收敛时。
- 配置 Metro 解析自定义平台（Tauri、macOS）时。

## 核心约束

- 平台分叉放边界层；业务组件只导入平台无关接口。
- `.native.ts` 覆盖 iOS+Android；仅两者真正不同时才拆 `.ios.ts`/`.android.ts`。
- 共享类型定义放平台无关文件，所有变体导入同一份。
- `Platform.select` 用于值选择，不用于控制流。
- Tauri 用 `.tauri.ts`，需在 Metro/Vite 配置自定义解析。
- 不直接 `import './foo.ios'`；通过 `index.ts` 让 bundler 解析。
- 测试从边界文件导入，不直接导入平台文件。

## 代码模式

- [边界文件模式](references/boundary-file-pattern.md)
- [Platform.select 值分叉](references/platform-select-values.md)
- [适配器接口](references/adapter-interface.md)
- [Metro 自定义平台](references/metro-custom-platforms.md)

## 检查清单

- 业务组件是否零 `Platform.OS` 判断？
- 平台变体是否都从 `index.ts` 导出？
- 自定义平台是否已配置 Metro resolver？

## 反模式

### FAIL: 业务组件散射 Platform.OS

```tsx
function HomeScreen() {
  if (Platform.OS === 'ios') {
    return <IOSHeader />;
  }
  if (Platform.OS === 'android') {
    return <AndroidHeader />;
  }
  return <Header
    style={Platform.OS === 'ios' ? styles.ios : styles.android}
    ...  // 同一文件 5 处判断
  />;
}
```

### PASS: 边界文件 + index 导出

```
Header/
  index.ts          → export { Header } from './Header'
  Header.ios.tsx    → iOS 实现
  Header.android.tsx → Android 实现
  Header.web.tsx    → Web 实现
```
```tsx
// 业务组件
import { Header } from './Header';  // 0 平台判断
```

### FAIL: iOS/Android 一致也拆

```
Storage.ios.ts
Storage.android.ts  ← 内容完全一样
// 改一处要改两处
```

### PASS: native 兜底

```
Storage.native.ts   ← iOS + Android 共用
Storage.web.ts      ← Web 单独实现
```

### FAIL: Platform.select 放大段逻辑

```tsx
const handler = Platform.select({
  ios: () => {
    // 30 行代码：定位、权限、错误处理...
    return geolocation.getCurrentPosition(...);
  },
  android: () => {
    // 30 行代码：完全不同的实现
  },
});
```

### PASS: Platform.select 只选值

```tsx
// 选值 OK
const padding = Platform.select({ ios: 20, android: 16 });

// 选实现 → 走边界文件
import { getCurrentPosition } from './geo';  // geo.ios.ts / geo.android.ts
```
