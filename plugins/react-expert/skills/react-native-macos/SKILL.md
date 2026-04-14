---
name: react-native-macos
description: 适用于基于 react-native-macos 构建桌面应用、处理 AppKit 集成、多窗口、菜单栏、键鼠输入与 iOS 到 macOS 移植。用户提到 react-native-macos、AppKit、macOS 桌面端、Platform.OS === 'macos' 时使用。
---

# React Native macOS

## 适用场景

- 要用 `react-native-macos` 构建真正的 macOS 桌面应用。
- 需要处理菜单栏、多窗口、键盘快捷键、鼠标悬停、拖放、焦点环等桌面能力。
- 需要把现有 iOS / React Native 应用移植到 macOS。
- 需要在 JS 层和 AppKit 原生模块之间划清边界。

## 核心约束

- 把 macOS 当成桌面端，而不是“放大的 iPad”；交互模型和窗口管理完全不同。
- 平台差异优先收敛到 `.macos.tsx`、边界组件或清晰的 `Platform.select` 分支。
- 原生能力进入 AppKit 层时，要隔离在独立模块，不要把 Objective-C/Swift 细节泄漏到业务组件。
- 文件系统、网络、沙箱权限和 entitlements 必须显式配置，不能靠硬编码路径绕过。
- 版本选择要和 React Native minor 对齐；升级时联动 [upgrading-react-native](../upgrading-react-native/SKILL.md)。

## 代码模式

```tsx
import { Platform, StyleSheet, Text, View } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Platform.OS === "macos" ? 24 : 16,
  },
  sidebar: {
    width: Platform.OS === "macos" ? 280 : "100%",
  },
});

export function SettingsLayout() {
  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <Text>Preferences</Text>
      </View>
    </View>
  );
}
```

```md
按任务加载这些参考文件：

- [references/setup-project-init.md](references/setup-project-init.md)
- [references/platform-specific-code.md](references/platform-specific-code.md)
- [references/macos-specific-props.md](references/macos-specific-props.md)
- [references/native-modules-appkit.md](references/native-modules-appkit.md)
- [references/input-keyboard-mouse-drag.md](references/input-keyboard-mouse-drag.md)
- [references/window-menu-toolbar.md](references/window-menu-toolbar.md)
- [references/porting-ios-to-macos.md](references/porting-ios-to-macos.md)
- [references/perf-debug.md](references/perf-debug.md)
```

```bash
# 常用命令
npx react-native run-macos
npx react-native build-macos
xed -b macos
```

## 检查清单

- [ ] `react-native` 与 `react-native-macos` minor 版本是否对齐？
- [ ] 平台差异是否集中在边界，而不是在业务 JSX 中散射？
- [ ] 多窗口、菜单、快捷键、鼠标交互是否按桌面端心智设计？
- [ ] 原生模块是否隔离在清晰的 AppKit 边界内？
- [ ] 沙箱、ATS、文件访问授权与 entitlements 是否已确认？
- [ ] 从 iOS 移植时，是否重新审视了焦点、hover、窗口尺寸和工具栏行为？

## 反模式

- 把 macOS 当成“自动兼容的 iOS”，不重审交互与窗口模型。
- 在业务组件里到处写 `Platform.OS === "macos"`，最后没人能维护。
- 直接在原生模块里执行未校验命令或访问未授权路径。
- 复用 iOS 手势和导航模式，却忽略键盘、鼠标和多窗口场景。
- 升级 React Native 时只看 JS 依赖，不看 Xcode / CocoaPods / AppKit 兼容性。
