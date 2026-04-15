# react-native-expert

React Native 专家插件，覆盖性能优化、TurboModule、JSI 绑定、原生模块开发、Metro 配置、跨平台代码组织、版本升级与 Detox E2E 测试。

## Skills

| Skill | 用途 |
|-------|------|
| `react-native-best-practices` | React Native FPS/TTI/包体积/内存优化 |
| `react-native-design` | 样式、导航、手势、Reanimated 动画 |
| `react-native-jsi-bridge` | C++ JSI 直接绑定：HostObject、零拷贝 |
| `react-native-macos` | react-native-macos 桌面应用 |
| `react-native-metro-config` | Metro 配置：watchFolders、自定义 resolver、CI 调优 |
| `react-native-native-module-android` | Android 原生模块：Kotlin TurboModule、Gradle codegen |
| `react-native-native-module-ios` | iOS 原生模块：ObjC++ TurboModule、Swift 桥接 |
| `react-native-platform-fork` | 跨平台代码组织：.native.ts/.ios.ts 分叉规范 |
| `react-native-turbomodule` | TurboModule 开发：Spec、codegen、Android/iOS 实现 |
| `upgrading-react-native` | React Native / Expo SDK 版本升级 |
| `detox-mobile-test` | Detox E2E 测试 |

## Hooks

| 事件 | Hook | 作用 |
|------|------|------|
| SessionStart | `env-detector` | 探测 React Native / Expo 版本与状态管理库 |

## 依赖

本插件依赖 `react-expert`，后者提供 React 组件组合、Hooks、性能优化等基础 skill。

## 安装

```bash
claude plugin install react-native-expert@ai-experts
claude plugin install react-native-expert@ai-experts --scope project
```

## 卸载

```bash
claude plugin uninstall react-native-expert
claude plugin uninstall react-native-expert --scope project
```

## 校验

```bash
node --check plugins/react-native-expert/hooks/dispatch.mjs
node --test plugins/react-native-expert/tests/*.test.mjs
```
