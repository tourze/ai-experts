---
name: react-native-platform-fork
description: "React Native 跨平台代码组织：平台文件扩展名、Platform.select、边界层抽象与 Metro 自定义平台解析。用户提到平台分叉、跨端代码、.native.ts、.tauri.ts 时使用。"
---

# 跨平台代码组织

## 适用场景

- 需要为 iOS/Android/Web/Tauri 提供不同实现时。
- 业务代码中 `Platform.OS` 判断散落各处需收敛时。
- 配置 Metro 解析自定义平台（Tauri、macOS）时。

## 核心约束

- 平台分叉放边界层；业务组件只导入平台无关接口。
- `.native.ts` 覆盖 iOS+Android；仅两者真正不同时才拆 `.ios.ts`/`.android.ts`。
- 共享类型定义放平台无关文件，所有变体导入同一份。
- `Platform.select` 用于值选择，不用于控制流。
- Tauri 用 `.tauri.ts`，需在 Metro/Vite 配置自定义解析。
- 不直接 `import './foo.ios'`；通过 `index.ts` 让 bundler 解析。
- 测试从边界文件导入，不直接导入平台文件。

## 代码模式

- [边界文件模式](references/boundary-file-pattern.md)
- [Platform.select 值分叉](references/platform-select-values.md)
- [适配器接口](references/adapter-interface.md)
- [Metro 自定义平台](references/metro-custom-platforms.md)

## 检查清单

- 业务组件是否零 `Platform.OS` 判断？
- 平台变体是否都从 `index.ts` 导出？
- 自定义平台是否已配置 Metro resolver？

## 反模式

- 业务组件到处 `if (Platform.OS === 'ios')`。
- iOS/Android 一致却拆两文件增加维护负担。
- 直接 `import './storage.native'` 绕过 bundler。
- `Platform.select` 中放大段逻辑和副作用。
