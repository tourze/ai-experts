---
name: react-native-metro-config
description: "当用户要配置或排查 React Native Metro 打包器时使用。用户提到 Metro 配置、watchFolders、inlineRequires、打包慢、自定义 resolver 时触发。"
---

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

- 遗漏 `watchFolders` 后以为 Metro 有 bug。
- 视频扩展名放入 `sourceExts`，Metro 按 JS 解析报错。
- CI 与本地用相同 `maxWorkers`，OOM 频繁。
- `blockList` 过宽误排业务目录。
