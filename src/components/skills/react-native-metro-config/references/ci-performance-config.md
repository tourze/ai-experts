# CI 与本地开发差异化配置

## 环境感知配置

```javascript
// metro.config.js
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const os = require('os');

const defaultConfig = getDefaultConfig(__dirname);

const isCI = process.env.CI === 'true';
const cpuCount = os.cpus().length;

const config = {
  maxWorkers: isCI
    ? Math.min(cpuCount, 4)
    : Math.max(cpuCount - 1, 1),

  cacheStores: isCI ? [] : undefined,

  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: !__DEV__,
      },
    }),

    minifierConfig: isCI
      ? {
          compress: { reduce_funcs: false },
          output: { ascii_only: true },
        }
      : undefined,
  },

  resolver: {
    sourceExts: defaultConfig.resolver.sourceExts,
    blockList: isCI
      ? [
          /.*\/__tests__\/.*/,
          /.*\/__mocks__\/.*/,
          /.*\/\.storybook\/.*/,
          /.*\/e2e\/.*/,
        ]
      : [],
  },
};

module.exports = mergeConfig(defaultConfig, config);
```

## CI vs 本地差异总结

| 配置项 | 本地开发 | CI |
|---|---|---|
| `maxWorkers` | CPU - 1 | min(CPU, 4) |
| `cacheStores` | 默认（文件系统缓存） | `[]`（禁用，避免缓存污染） |
| `inlineRequires` | false（调试友好） | true（启动性能） |
| `blockList` | 最小化 | 排除测试/storybook/e2e |
| `minifierConfig` | 默认 | 自定义压缩选项 |

## inlineRequires 注意事项

- 开启后模块不再在 bundle 加载时全部初始化，而是在首次 `require` 时按需初始化。
- 依赖模块级副作用（如全局 polyfill 注册）的代码可能在 inline 后行为变化。
- 建议：生产环境开启，但每次开启/关闭后做完整功能回归。

## 关键点

- CI 环境 `maxWorkers` 过高会触发 OOM killer，2-4 是安全区间。
- CI 禁用缓存可避免跨构建的缓存污染问题。
- `blockList` 在 CI 中可更激进，排除测试和文档目录加速解析。
