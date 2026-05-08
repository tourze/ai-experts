# React Native 包体积优化

## 适用场景

- JS bundle 体积过大，需要定位哪些依赖占了空间。
- 需要评估 tree shaking、barrel exports 消除、R8 代码缩减等优化手段。
- 需要区分 JS bundle、原生二进制和图片/字体资源三类体积问题。
- 要评估某个第三方库引入后的体积代价。
- 版本升级相关任务优先联动 [upgrading-react-native](./upgrading-react-native.md)。
- JS 线程性能问题优先联动 [react-native-js-performance](../../react-native-js-performance/SKILL.md)。
- 原生层性能问题优先联动 [react-native-native-performance](../../react-native-js-performance/references/react-native-native-performance.md)。

## 核心约束

- 量化 = KB/MB 数字，不是体感。优化前后必须有 `source-map-explorer` 或 Expo Atlas 的截图/数据对比。
- 只用 release 构建做分析；debug 构建包含 dev-only 代码和未 minify 的 bundle，结论失真。
- 包体积是三个独立问题：JS bundle、图片/字体资源、原生二进制，各有不同的工具链和优化路径，不要混为一谈。
- 远程代码分发要验证来源可信性和完整性；第三方依赖要评估供应链安全。

## 诊断路径

先定位瓶颈在哪一层，再加载对应参考文件：

| 症状 | 首选参考 | 次选 | 说明 |
|------|---------|------|------|
| 总包 > 30MB 且 JS bundle 占比 > 50% | [bundle-analyze-js](./bundle-analyze-js.md) | [bundle-barrel-exports](./bundle-barrel-exports.md) → [bundle-tree-shaking](./bundle-tree-shaking.md) | JS 层是主要问题，先看哪个依赖占了空间 |
| 总包 > 30MB 但 JS bundle 占比 < 30% | [bundle-analyze-app](./bundle-analyze-app.md) | [bundle-native-assets](./bundle-native-assets.md) → [bundle-r8-android](./bundle-r8-android.md) | 原生层或资源是主要问题 |
| 某个库占比异常大 | [bundle-library-size](./bundle-library-size.md) | [bundle-barrel-exports](./bundle-barrel-exports.md) | 评估替代方案或按需导入 |
| 启动时 JS 解析耗时长 | [bundle-hermes-mmap](./bundle-hermes-mmap.md) | [bundle-code-splitting](./bundle-code-splitting.md) | Hermes bytecode mmap 可减少解析开销 |
| 版本升级后包体积突增 | [bundle-analyze-js](./bundle-analyze-js.md) | [bundle-tree-shaking](./bundle-tree-shaking.md) | diff 前后 source map 找新增 |

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

### FAIL: 没数据就改

```bash
"包好像变大了，删几个依赖看看"
→ 删了 lodash → 业务崩
→ 实际：lodash 占 12KB，真正大头是 moment 占 240KB
```

### PASS: source-map-explorer 定位

```bash
npx react-native bundle --dev false --minify true \
  --bundle-output /tmp/main.jsbundle --sourcemap-output /tmp/main.jsbundle.map
npx source-map-explorer /tmp/main.jsbundle
# 输出每个依赖的精确占比，定位到真正瓶颈
```

### FAIL: 只看 JS bundle

```
JS bundle 5MB → 优化到 3MB
APK 还是 80MB
原因：原生依赖（OpenCV / TensorFlow）占 60MB，没人看
```

### PASS: 三层独立测量

```bash
# 1. JS bundle (source-map-explorer)
# 2. APK 解压看 lib/ 目录原生 .so
unzip -l app-release.apk | grep -E '\.so$' | sort -k1 -n
# 3. assets/ 资源
```

### FAIL: barrel export 抹杀 tree shaking

```js
// utils/index.ts
export * from './a';  // 导出整个 a.ts
export * from './b';
// 业务用 import { x } from 'utils' → bundle 拉入 a.ts + b.ts 全部
```

### PASS: 直接路径 import

```js
import { x } from 'utils/a';
// bundle 仅含 a.ts，b.ts 自动 tree-shake
```