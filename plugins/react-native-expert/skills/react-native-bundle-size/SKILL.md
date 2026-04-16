---
name: react-native-bundle-size
description: 当用户要分析或优化 React Native 包体积时使用。用户提到 JS bundle 大、tree shaking、barrel exports、R8、Hermes bytecode、source-map-explorer、包体积膨胀、依赖瘦身时触发。
---

# React Native 包体积优化

## 适用场景

- JS bundle 体积过大，需要定位哪些依赖占了空间。
- 需要评估 tree shaking、barrel exports 消除、R8 代码缩减等优化手段。
- 需要区分 JS bundle、原生二进制和图片/字体资源三类体积问题。
- 要评估某个第三方库引入后的体积代价。
- 版本升级相关任务优先联动 [upgrading-react-native](../upgrading-react-native/SKILL.md)。
- JS 线程性能问题优先联动 [react-native-js-performance](../react-native-js-performance/SKILL.md)。
- 原生层性能问题优先联动 [react-native-native-performance](../react-native-native-performance/SKILL.md)。

## 核心约束

- 量化 = KB/MB 数字，不是体感。优化前后必须有 `source-map-explorer` 或 Expo Atlas 的截图/数据对比。
- 只用 release 构建做分析；debug 构建包含 dev-only 代码和未 minify 的 bundle，结论失真。
- 包体积是三个独立问题：JS bundle、图片/字体资源、原生二进制，各有不同的工具链和优化路径，不要混为一谈。
- 远程代码分发要验证来源可信性和完整性；第三方依赖要评估供应链安全。

## 诊断路径

先定位瓶颈在哪一层，再加载对应参考文件：

| 症状 | 首选参考 | 次选 | 说明 |
|------|---------|------|------|
| 总包 > 30MB 且 JS bundle 占比 > 50% | [bundle-analyze-js](references/bundle-analyze-js.md) | [bundle-barrel-exports](references/bundle-barrel-exports.md) → [bundle-tree-shaking](references/bundle-tree-shaking.md) | JS 层是主要问题，先看哪个依赖占了空间 |
| 总包 > 30MB 但 JS bundle 占比 < 30% | [bundle-analyze-app](references/bundle-analyze-app.md) | [bundle-native-assets](references/bundle-native-assets.md) → [bundle-r8-android](references/bundle-r8-android.md) | 原生层或资源是主要问题 |
| 某个库占比异常大 | [bundle-library-size](references/bundle-library-size.md) | [bundle-barrel-exports](references/bundle-barrel-exports.md) | 评估替代方案或按需导入 |
| 启动时 JS 解析耗时长 | [bundle-hermes-mmap](references/bundle-hermes-mmap.md) | [bundle-code-splitting](references/bundle-code-splitting.md) | Hermes bytecode mmap 可减少解析开销 |
| 版本升级后包体积突增 | [bundle-analyze-js](references/bundle-analyze-js.md) | [bundle-tree-shaking](references/bundle-tree-shaking.md) | diff 前后 source map 找新增 |

不确定瓶颈在哪一层时，先跑下面的命令拿到 JS bundle 大小和总包大小：

```bash
# 生成生产 bundle 并分析 JS 体积
npx react-native bundle \
  --entry-file index.js \
  --platform ios \
  --dev false \
  --minify true \
  --bundle-output /tmp/main.jsbundle \
  --sourcemap-output /tmp/main.jsbundle.map

npx source-map-explorer /tmp/main.jsbundle --no-border-checks
```

## 检查清单

- [ ] 是否记录了优化前后的 bundle size 数据（KB 数字，不是"感觉小了"）？
- [ ] 是否在 release 构建下做分析？
- [ ] 是否区分了 JS bundle、图片/字体资源与原生依赖的各自占比？
- [ ] barrel exports 是否已消除或做了 tree shaking？
- [ ] 新引入的第三方库是否用 `bundle-library-size` 评估了体积代价？
- [ ] Android 是否启用了 R8 代码缩减？

## 反模式

- 没有任何测量数据，就盲目删依赖或拆包。
- 只看 JS bundle 大小，忽略原生二进制和资源文件的体积。
- 为了减包随意删 polyfill，却不验证 Hermes 能力覆盖。
- 开启远程分包但不验证下载来源的可信性与完整性。
- 用 barrel exports 重导出整个库，tree shaking 形同虚设。
