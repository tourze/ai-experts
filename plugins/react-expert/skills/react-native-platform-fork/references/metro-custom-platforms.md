# Metro 自定义平台扩展名解析

## Metro 配置

```javascript
// metro.config.js
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    // 平台特定扩展名在前，通用在后
    sourceExts: [
      'tauri.ts', 'tauri.tsx', 'tauri.js', 'tauri.jsx',
      'macos.ts', 'macos.tsx', 'macos.js', 'macos.jsx',
      ...defaultConfig.resolver.sourceExts,
    ],
    // 注册自定义平台标识
    platforms: [...defaultConfig.resolver.platforms, 'tauri', 'macos'],
  },
};

module.exports = mergeConfig(defaultConfig, config);
```

## 构建命令

```json
{
  "scripts": {
    "start:ios": "react-native start --platform ios",
    "start:android": "react-native start --platform android",
    "start:macos": "react-native start --platform macos",
    "build:tauri": "vite build --config vite.tauri.config.ts"
  }
}
```

## Vite 配置（Tauri 端）

```typescript
// vite.tauri.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: [
      '.tauri.tsx', '.tauri.ts', '.tauri.js',
      '.web.tsx', '.web.ts', '.web.js',
      '.tsx', '.ts', '.js',
    ],
    alias: {
      'react-native': 'react-native-web',
    },
  },
});
```

## 解析优先级

Metro 构建 iOS 时的解析顺序：
1. `foo.ios.ts`
2. `foo.native.ts`
3. `foo.ts`

Metro 构建自定义平台 `tauri` 时：
1. `foo.tauri.ts`
2. `foo.native.ts`（注意：native 仍作为 fallback）
3. `foo.ts`

## 关键点

- 自定义平台扩展名必须在 `sourceExts` 中注册，否则 Metro 直接忽略对应文件。
- `platforms` 数组告诉 Metro 哪些是合法的平台标识，用于 `--platform` 参数。
- Tauri 走 Vite 而非 Metro 时，需在 Vite `resolve.extensions` 中配置等价的优先级。
