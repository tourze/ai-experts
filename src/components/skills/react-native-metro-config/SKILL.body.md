# Metro 配置

## 适用场景

- 配置 Monorepo 下 Metro 的路径解析和包发现时。
- 添加自定义平台扩展名（.tauri.ts、.macos.ts）时。
- 排查热更新失效、模块找不到或 CI 打包 OOM 时。

## 核心约束

- `inlineRequires: true` 改变初始化顺序，须充分回归测试。
- `watchFolders` 必须含 Monorepo 根和所有 symlink 包目录。
- `extraNodeModules` 用绝对路径；`react` 须指向 app 本地版本。
- 自定义 `sourceExts` 平台特定在前、通用在后。
- 不在 `assetExts` 中的扩展名会被当 JS 解析。
- CI 中 `maxWorkers` 控制在 2-4 避免 OOM。
- `import()` 不支持计算路径，须静态字符串。

## 代码模式

- [Monorepo 配置](references/monorepo-config.md)
- [自定义平台扩展](references/custom-platform-exts.md)
- [CI 性能优化](references/ci-performance-config.md)

## 检查清单

- `watchFolders` 是否覆盖所有 symlink 包？
- `react`/`react-native` 是否唯一解析到 app 版本？
- CI `maxWorkers` 是否已调低？

## 反模式

### FAIL: monorepo 漏 watchFolders

```js
// metro.config.js
module.exports = { /* 默认 */ };
// monorepo 中 packages/shared 改动 → Metro 不重新打包
// 开发者："Metro 热更新坏了"
```

### PASS: 显式 watchFolders

```js
const path = require('path');
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');
module.exports = {
  watchFolders: [monorepoRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(monorepoRoot, 'node_modules'),
    ],
  },
};
```

### FAIL: 视频塞 sourceExts

```js
sourceExts: [...defaultSourceExts, 'mp4', 'mov'],
// Metro 把 .mp4 当 JS 解析 → SyntaxError: Unexpected token
```

### PASS: assetExts

```js
const { assetExts, sourceExts } = defaultConfig.resolver;
config.resolver.assetExts = [...assetExts, 'mp4', 'mov'];
config.resolver.sourceExts = sourceExts;
```

### FAIL: CI 不限 maxWorkers

```js
// 本地 16 核 → maxWorkers: 14 OK
// CI runner 4 核 8GB → 同配置 → OOM kill
```

### PASS: 按环境分

```js
config.maxWorkers = process.env.CI ? 2 : undefined;
```
