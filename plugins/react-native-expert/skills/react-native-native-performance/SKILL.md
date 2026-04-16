---
name: react-native-native-performance
description: 当用户要排查或优化 React Native 原生层性能时使用。用户提到 TTI、启动慢、原生线程、Xcode Instruments、Android Profiler、原生内存泄漏、TurboModules、View Flattening、16KB 对齐时触发。
---

# React Native 原生层性能

## 适用场景

- 应用启动慢，需要测量和优化 TTI（Time to Interactive）。
- 需要理解 React Native 线程模型（JS 线程、UI 线程、Native Modules 线程）。
- 原生内存泄漏定位，需要使用 Xcode Instruments 或 Android Profiler。
- TurboModules 性能评估、View Flattening 优化。
- Android 16KB 页面对齐合规。
- JS 线程性能问题优先联动 [react-native-js-performance](../react-native-js-performance/SKILL.md)。
- 包体积问题优先联动 [react-native-bundle-size](../react-native-bundle-size/SKILL.md)。
- 版本升级相关任务优先联动 [upgrading-react-native](../upgrading-react-native/SKILL.md)。

## 核心约束

- 量化 = TTI 毫秒数或 Instruments/Profiler 的火焰图截图，不是"感觉启动快了"。
- 只用 release 构建做真实性能判断；debug 构建加载了大量调试基础设施，结论完全失真。
- JS 线程慢和原生层慢的症状相似（都表现为卡顿），但排查工具和解法完全不同。如果 Perf Monitor 的 JS FPS 正常但 UI 仍然卡，问题在原生层。
- 优先使用原生 SDK 而非 JS polyfill——原生代码不走 Bridge，但要评估双平台维护成本。

## 诊断路径

按症状定位原因，先处理首选项，无效再看次选：

| 症状 | 默认怀疑 | 首选参考 | 次选 |
|------|---------|---------|------|
| 冷启动 > 3s | 原生模块同步初始化过多 | [native-measure-tti](references/native-measure-tti.md) | [native-threading-model](references/native-threading-model.md) |
| 页面切换卡但 JS FPS 正常 | View 层级过深 | [native-view-flattening](references/native-view-flattening.md) | [native-profiling](references/native-profiling.md) |
| 内存持续上涨不释放 | 原生对象泄漏（Timer/Observer/Listener） | [native-memory-leaks](references/native-memory-leaks.md) | [native-memory-patterns](references/native-memory-patterns.md) |
| 原生模块调用延迟高 | 同步方法阻塞 JS 线程 | [native-turbo-modules](references/native-turbo-modules.md) | [native-threading-model](references/native-threading-model.md) |
| JS polyfill 性能不足 | 应替换为原生 SDK | [native-sdks-over-polyfills](references/native-sdks-over-polyfills.md) | [native-platform-setup](references/native-platform-setup.md) |
| Google Play 上架被拒 | Android 16KB 页面对齐 | [native-android-16kb-alignment](references/native-android-16kb-alignment.md) | — |

iOS 用 Xcode Instruments（Time Profiler / Allocations），Android 用 Android Studio Profiler。详见 [native-profiling](references/native-profiling.md)。

## 代码模式

```tsx
// 标记 TTI — 放在首屏可交互的组件里
import performance from 'react-native-performance';

useEffect(() => {
  performance.mark('screenInteractive');
}, []);
```

## 检查清单

- [ ] 是否用 Instruments/Profiler 记录了优化前后的 TTI 或内存数据？
- [ ] 是否在 release 构建、真机上复测？
- [ ] 是否确认问题在原生层而非 JS 线程（Perf Monitor JS FPS 正常）？
- [ ] 原生模块是否避免了同步阻塞 JS 线程的方法？
- [ ] Android 第三方库是否满足 16KB 页面对齐要求？
- [ ] 是否优先使用原生 SDK 而非 JS polyfill？

## 反模式

- 升级后把性能回退归因于"React Native 就这样"，不做 profiler 与 bundle diff。
- 不区分 JS 线程和原生线程的瓶颈，用错误的工具排查。
- 在 debug 包里看见启动慢就直接下结论，不做 release 复测。
- 为了减包随意删 polyfill，却不验证 Hermes 能力与原生 SDK 覆盖。
- 忽略 Android 16KB 对齐要求，上架后被 Google Play 拒绝。
