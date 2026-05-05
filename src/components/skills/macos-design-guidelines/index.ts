import {
  InvocationPolicy,
  KnownTool,
  Platform,
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
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
