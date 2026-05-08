# React Native 原生层性能

## 适用场景

- 应用启动慢，需要测量和优化 TTI（Time to Interactive）。
- 需要理解 React Native 线程模型（JS 线程、UI 线程、Native Modules 线程）。
- 原生内存泄漏定位，需要使用 Xcode Instruments 或 Android Profiler。
- TurboModules 性能评估、View Flattening 优化。
- Android 16KB 页面对齐合规。
- JS 线程性能问题优先联动 [react-native-js-performance](../SKILL.md)。
- 包体积问题优先联动 [react-native-bundle-size](../../react-native-metro-config/references/react-native-bundle-size.md)。
- 版本升级相关任务优先联动 [upgrading-react-native](../../react-native-metro-config/references/upgrading-react-native.md)。

## 核心约束

- 量化 = TTI 毫秒数或 Instruments/Profiler 的火焰图截图，不是"感觉启动快了"。
- 只用 release 构建做真实性能判断；debug 构建加载了大量调试基础设施，结论完全失真。
- JS 线程慢和原生层慢的症状相似（都表现为卡顿），但排查工具和解法完全不同。如果 Perf Monitor 的 JS FPS 正常但 UI 仍然卡，问题在原生层。
- 优先使用原生 SDK 而非 JS polyfill——原生代码不走 Bridge，但要评估双平台维护成本。

## 诊断路径

按症状定位原因，先处理首选项，无效再看次选：

| 症状 | 默认怀疑 | 首选参考 | 次选 |
|------|---------|---------|------|
| 冷启动 > 3s | 原生模块同步初始化过多 | [native-measure-tti](./native-measure-tti.md) | [native-threading-model](./native-threading-model.md) |
| 页面切换卡但 JS FPS 正常 | View 层级过深 | [native-view-flattening](./native-view-flattening.md) | [native-profiling](./native-profiling.md) |
| 内存持续上涨不释放 | 原生对象泄漏（Timer/Observer/Listener） | [native-memory-leaks](./native-memory-leaks.md) | [native-memory-patterns](./native-memory-patterns.md) |
| 原生模块调用延迟高 | 同步方法阻塞 JS 线程 | [native-turbo-modules](./native-turbo-modules.md) | [native-threading-model](./native-threading-model.md) |
| JS polyfill 性能不足 | 应替换为原生 SDK | [native-sdks-over-polyfills](./native-sdks-over-polyfills.md) | [native-platform-setup](./native-platform-setup.md) |
| Google Play 上架被拒 | Android 16KB 页面对齐 | [native-android-16kb-alignment](./native-android-16kb-alignment.md) | — |

iOS 用 Xcode Instruments（Time Profiler / Allocations），Android 用 Android Studio Profiler。详见 [native-profiling](./native-profiling.md)。

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

### FAIL: debug 包结论

```
"启动 8 秒，太慢了"
→ 实际 release 包启动 1.2 秒
→ debug 包加载 dev bundle / 远程加载 / 大量调试基础设施
```

### PASS: release 真机测

```bash
# iOS
xcodebuild -workspace ios/MyApp.xcworkspace -scheme MyApp -configuration Release
# 安装真机后用 react-native-performance 标 TTI
# Android
./gradlew :app:assembleRelease
adb install app-release.apk
adb shell am start -W com.myapp/.MainActivity  # WaitTime = 启动毫秒
```

### FAIL: 用 JS 工具查原生卡

```
Perf Monitor JS FPS = 60，UI FPS = 20
"还是 JS 慢，再优化 useMemo"
→ 实际：原生 ScrollView 嵌套 4 层 + onScroll 同步打回 JS
```

### PASS: 区分线程

```
Perf Monitor 显示 JS 60 / UI 20 → 问题在原生层
→ Xcode Time Profiler / Android Studio Profiler
→ 找到 RCTScrollEvent 占主线程 80%
→ 移除嵌套或改 onScroll passive
```

### FAIL: 忽略 Android 16KB 对齐

```bash
# 提交 Google Play
# "Your app does not support 16 KB page sizes"
# 上架被拒，紧急修依赖
```

### PASS: 上架前检查

```bash
# 检查所有 .so 是否 16KB 对齐
zipalign -c -P 16 -v 4 app-release.apk
# 不通过的依赖：升级或换包
# 编译参数：android.bundle.enableUncompressedNativeLibs = false 时需 16KB ELF
```