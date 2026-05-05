import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";

export const macosDesignGuidelinesSkill = defineSkill({
  id: "macos-design-guidelines",
  fullName: "macOS HIG 设计",
  description: "当用户要按 macOS HIG 设计桌面界面、菜单栏、窗口层级、工具栏、侧边栏、键盘快捷键或指针交互时使用。",
  useCases: [
    "设计或评审 macOS 的 SwiftUI / AppKit 界面。",
    "用户提到菜单栏、窗口、多窗口、工具栏、快捷键、侧边栏或 Mac Catalyst 桌面体验。",
    "需要把 iPad 式界面改回真正符合 Mac 习惯的桌面产品。",
  ],
  constraints: [
    "菜单栏、窗口管理和键盘快捷键是 Mac 的一等入口，优先级高于视觉装饰。",
    "主窗口必须可调整大小，并给出合理的最小尺寸与默认尺寸。",
    "常见命令应该进入标准菜单或工具栏，不要藏在悬浮按钮里。",
    "Mac 用户默认期待右键、拖拽、多窗口和键盘导航，不要按 iPhone 的交互假设来设计。",
  ],
  checklist: [
    "是否提供标准菜单、设置入口、常用快捷键和上下文菜单。",
    "主窗口是否支持调整大小、全屏和多窗口，而不是被固定成移动端画布。",
    "侧边栏、工具栏、搜索和右键菜单是否体现桌面工作流。",
    "需要展开规则时读取记忆文件、`rules/_sections.md` 和 `metadata.json`。",
    "交叉引用：iPhone / iPad 体验看 `ios-hig-design`；SwiftUI 具体实现看 `swiftui-ui-patterns`。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "TabBar 直接搬上 Mac",
      pass: "NavigationSplitView",
    }),
    defineAntiPattern({
      fail: "命令只在悬浮按钮",
      pass: "命令进菜单 + 快捷键",
    }),
    defineAntiPattern({
      fail: "窗口固定尺寸",
      pass: "min + default + 可调",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
