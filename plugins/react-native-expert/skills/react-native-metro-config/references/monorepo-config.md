# Monorepo Metro 配置

## 完整配置

```javascript
// metro.config.js（Monorepo 项目）
const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const defaultConfig = getDefaultConfig(projectRoot);

const sharedPackages = {
  '@myapp/shared-ui': path.resolve(monorepoRoot, 'packages/shared-ui'),
  '@myapp/core': path.resolve(monorepoRoot, 'packages/core'),
  '@myapp/utils': path.resolve(monorepoRoot, 'packages/utils'),
};

const config = {
  watchFolders: [
    monorepoRoot,
    ...Object.values(sharedPackages),
  ],

  resolver: {
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(monorepoRoot, 'node_modules'),
    ],

    extraNodeModules: {
      ...sharedPackages,
      // 关键：确保共享包使用 app 的 react / react-native
      'react': path.resolve(projectRoot, 'node_modules/react'),
      'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
    },

    blockList: [
      /.*\/packages\/backend\/.*/,
      /.*\/\.git\/.*/,
      /.*\/build\/.*/,
    ],
  },

  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};

module.exports = mergeConfig(defaultConfig, config);
```

## 常见问题

| 问题 | 原因 | 解决 |
|---|---|---|
| 修改共享包不触发热更新 | `watchFolders` 遗漏 | 加入 monorepoRoot 和包目录 |
| `Invalid hook call` | react 多实例 | `extraNodeModules` 锁定 react 路径 |
| `Unable to resolve module` | hoisting 导致路径偏移 | `nodeModulesPaths` 加入根 node_modules |
| 打包极慢 | 监视了 backend、.git 等目录 | `blockList` 排除不相关目录 |

## 关键点

- `watchFolders` 中的路径必须是绝对路径。
- `extraNodeModules` 中的 `react` 和 `react-native` 指向 app 本地版本是最关键的一步；共享包各带自己的 react 副本会导致 hooks 报错。
- `blockList` 使用正则数组；写得过宽可能误排业务代码。
