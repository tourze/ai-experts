## 必经门禁

| 步骤 | skill | 检查什么 |
|------|-------|---------|
| 1 | react-native-design | 架构基线：导航结构、样式组织、平台适配、安全区域 |
| 2 | react-native-js-performance | 性能基线：JS thread 占用、FlatList 配置、掉帧热点 |
| 3 | evidence-quality-framework | 每条结论标注事实/推断/假设 |

## 场景路由

| 触发信号 | 使用 skill | 检查项 | 输出 |
|---------|-----------|--------|------|
| `FlatList`/`SectionList`/`FlashList`/列表渲染 | react-native-js-performance | key、windowing、memoization、JS thread 掉帧、FPS | 列表性能审计 |
| `NavigationContainer`/`Stack`/`Tab`/`deep link` | react-native-design | 导航层级、生命周期、deep link 解析、内存泄漏 | 导航审计 |
| 手势/动画/`Animated`/`Reanimated`/`Gesture` | react-native-design | 手势冲突、动画性能、JS/Native 线程分配 | 交互审计 |
| `Platform.OS`/`.ios.`/`.android.`/平台分叉 | react-native-platform-fork | 分叉粒度、共享代码比例、平台特定配置 | 平台分叉审计 |
| `TurboModule`/`TurboModuleRegistry`/`codegenConfig` | react-native-turbomodule | New Architecture 迁移、TurboModule 注册、codegen 配置 | 原生模块审计 |
| `metro.config`/bundle/打包配置 | react-native-metro-config | Metro 配置、watchFolders、resolver、bundle 体积 | 构建配置审计 |
| `detox`/E2E/`device.`/`element(` | detox-mobile-test | 测试稳定性、matcher 策略、CI 设备配置、flaky test | E2E 测试审计 |

## 编排顺序

1. 门禁：react-native-design → react-native-js-performance → 确认基线
2. 路由：按 diff 内容匹配场景路由表，逐项深入
3. 证据：每条发现绑定 文件:行 + 代码片段
4. 标注：事实/推断/假设
5. 排序：安全 > 正确性 > 影响面 > 执行成本
