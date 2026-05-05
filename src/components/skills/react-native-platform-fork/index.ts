import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";

export const reactNativePlatformForkSkill = defineSkill({
  id: "react-native-platform-fork",
  fullName: "跨平台代码组织",
  description: "当用户要组织 React Native 跨平台代码或配置平台分叉时使用。用户提到平台分叉、跨端代码、.native.ts、.tauri.ts、Platform.select 时触发。",
  useCases: [
    "需要为 iOS/Android/Web/Tauri 提供不同实现时。",
    "业务代码中 `Platform.OS` 判断散落各处需收敛时。",
    "配置 Metro 解析自定义平台（Tauri、macOS）时。",
  ],
  constraints: [
    "平台分叉放边界层；业务组件只导入平台无关接口。",
    "`.native.ts` 覆盖 iOS+Android；仅两者真正不同时才拆 `.ios.ts`/`.android.ts`。",
    "共享类型定义放平台无关文件，所有变体导入同一份。",
    "`Platform.select` 用于值选择，不用于控制流。",
    "Tauri 用 `.tauri.ts`，需在 Metro/Vite 配置自定义解析。",
    "不直接 `import './foo.ios'`；通过 `index.ts` 让 bundler 解析。",
    "测试从边界文件导入，不直接导入平台文件。",
  ],
  checklist: [
    "业务组件是否零 `Platform.OS` 判断？",
    "平台变体是否都从 `index.ts` 导出？",
    "自定义平台是否已配置 Metro resolver？",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "业务组件散射 Platform.OS",
      pass: "边界文件 + index 导出",
    }),
    defineAntiPattern({
      fail: "iOS/Android 一致也拆",
      pass: "native 兜底",
    }),
    defineAntiPattern({
      fail: "Platform.select 放大段逻辑",
      pass: "Platform.select 只选值",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "adapter-interface",
      source: new URL("./references/adapter-interface.md", import.meta.url),
      target: "references/adapter-interface.md",
      title: "adapter-interface.md",
      summary: "Reference material for react-native-platform-fork.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "boundary-file-pattern",
      source: new URL("./references/boundary-file-pattern.md", import.meta.url),
      target: "references/boundary-file-pattern.md",
      title: "boundary-file-pattern.md",
      summary: "Reference material for react-native-platform-fork.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "metro-custom-platforms",
      source: new URL("./references/metro-custom-platforms.md", import.meta.url),
      target: "references/metro-custom-platforms.md",
      title: "metro-custom-platforms.md",
      summary: "Reference material for react-native-platform-fork.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "platform-select-values",
      source: new URL("./references/platform-select-values.md", import.meta.url),
      target: "references/platform-select-values.md",
      title: "platform-select-values.md",
      summary: "Reference material for react-native-platform-fork.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "react-native-macos",
      source: new URL("./references/react-native-macos.md", import.meta.url),
      target: "references/react-native-macos.md",
      title: "react-native-macos.md",
      summary: "Reference material for react-native-platform-fork.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
