# 自定义平台扩展名配置

## Metro 配置

```javascript
// metro.config.js
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    platforms: [
      ...defaultConfig.resolver.platforms, // ['ios', 'android']
      'macos',
      'windows',
      'tauri',
    ],

    sourceExts: (() => {
      const customExts = [];
      const baseExts = ['ts', 'tsx', 'js', 'jsx'];
      const customPlatforms = ['tauri', 'macos', 'windows'];

      for (const platform of customPlatforms) {
        for (const ext of baseExts) {
          customExts.push(`${platform}.${ext}`);
        }
      }

      // 自定义平台在前，默认在后
      return [...customExts, ...defaultConfig.resolver.sourceExts];
    })(),

    // 自定义资源扩展名
    assetExts: [
      ...defaultConfig.resolver.assetExts,
      'lottie',
      'glb',
      'gltf',
    ],
  },
};

module.exports = mergeConfig(defaultConfig, config);
```

## sourceExts vs assetExts

| 扩展名类别 | 放入 | 行为 |
|---|---|---|
| 代码文件（.ts, .tsx, .js） | `sourceExts` | Metro 作为 JS 解析和转换 |
| 资源文件（.png, .jpg, .lottie） | `assetExts` | Metro 作为静态资源处理 |
| 错误：视频放入 sourceExts | - | Metro 按 JS 解析，报语法错误 |

## 关键点

- 新资源类型（.lottie, .glb）必须显式加入 `assetExts`。
- 同一扩展名不能同时出现在 `sourceExts` 和 `assetExts` 中。
- 自定义 `sourceExts` 顺序决定解析优先级：平台特定在前，通用在后。
