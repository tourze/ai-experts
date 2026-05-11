import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineReference,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { iosHigDesignSkill } from "../ios-hig-design/index";
import { swiftuiUiPatternsSkill } from "../swiftui-ui-patterns/index";

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
    "需要展开规则时读取 `references/agent-instructions.md`、`references/rules/_sections.md` 和 `references/metadata.json`。",
  ],
  relatedSkills: [
    {
      get skill() {
        return iosHigDesignSkill;
      },
      reason: "目标平台转为 iPhone、iPad 或需要比较移动端 HIG 差异时联动。",
    },
    {
      get skill() {
        return swiftuiUiPatternsSkill;
      },
      reason: "需要把 macOS 设计落到 SwiftUI 导航、窗口、工具栏或设置实现时联动。",
    },
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
  sourceDir: new URL("./", import.meta.url),
  references: [
    defineReference({
      id: "agent-instructions",
      source: new URL("./references/agent-instructions.md", import.meta.url),
      title: "macOS Guidelines Reference",
      summary: "macOS HIG 适用场景、优先级、规则类别和禁止事项。",
      loadWhen: "需要快速理解 macOS HIG 桌面设计要求时读取。",
    }),
    defineReference({
      id: "section-index",
      source: new URL("./references/rules/_sections.md", import.meta.url),
      target: "references/rules/_sections.md",
      title: "macOS HIG Section Index",
      summary: "11 个 macOS HIG 类别和 62 条规则的速查索引。",
      loadWhen: "需要按菜单栏、窗口、工具栏、键盘、指针等类别展开规则时读取。",
    }),
    defineReference({
      id: "metadata",
      source: new URL("./references/metadata.json", import.meta.url),
      title: "macOS Guidelines Metadata",
      summary: "版本、组织、摘要和 Apple 官方参考链接。",
      loadWhen: "需要核对资料范围、版本和官方链接时读取。",
    }),
  ],
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先确认产品是原生 macOS、Mac Catalyst 还是跨平台桌面，并列出核心桌面任务。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "设计菜单栏、Settings、常用命令、快捷键和上下文菜单；命令不要只藏在悬浮按钮。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "设置主窗口最小尺寸、默认尺寸、可调整大小、全屏和多窗口策略。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "用 NavigationSplitView、侧边栏、工具栏、搜索和右键菜单组织桌面工作流。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "检查指针、拖拽、键盘导航和桌面多窗口预期，不按 iPhone 交互假设设计 Mac。",
      }),
      defineWorkflowStep({
        id: "step-6",
        label: "需要实现示例时输出 SwiftUI WindowGroup、Settings、commands、defaultSize、toolbar 和 split view 方案。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "macOS 界面结构、菜单栏/设置/命令/快捷键/上下文菜单设计。",
      "窗口尺寸、窗口层级、侧边栏、工具栏、搜索和多窗口策略。",
      "SwiftUI/AppKit 实现提示、HIG 风险、与 iOS/iPad 或 SwiftUI 模式的联动点。",
    ],
  }),
});
