---
name: react-native-macos-power
description: react-native-macos 的内部参考入口。仅列出引用文件与使用策略，不作为直接触发的 skill。
---

# React Native macOS 参考索引

## 适用场景

- 需要按任务类型定位 `react-native-macos` 的细分参考文档。

## 核心约束

- 只按需加载单个参考文件，不要一次把全部 `references/` 塞进上下文。

## 代码模式

- 初始化项目：`references/setup-project-init.md`
- 平台分支：`references/platform-specific-code.md`
- macOS 专有 props：`references/macos-specific-props.md`
- 原生模块：`references/native-modules-appkit.md`
- 输入系统：`references/input-keyboard-mouse-drag.md`
- 窗口菜单：`references/window-menu-toolbar.md`
- iOS 迁移：`references/porting-ios-to-macos.md`
- 性能调试：`references/perf-debug.md`

## 检查清单

- [ ] 当前任务是否已经定位到单一参考文件？

## 反模式

- 把所有参考文档一次性加载进上下文。
