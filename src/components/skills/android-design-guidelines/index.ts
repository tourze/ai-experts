import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const androidDesignGuidelinesSkill = defineSkill({
  id: "android-design-guidelines",
  fullName: "Android 平台设计规范 — Material Design 3",
  description: "当用户要构建或评审 Android UI、应用 Material Design 3 规范、动态颜色、Compose 组件或自适应布局时使用。",
  useCases: [
    "构建或评审 Android UI 代码（Jetpack Compose / XML）",
    "实现 Material You / 动态颜色",
    "设计导航、布局或组件架构",
    "审计无障碍或平台合规性",
  ],
  constraints: [
    "只在本 skill 的适用场景内使用；任务不匹配时先澄清或转向更合适的 skill。",
    "执行时遵循正文中的流程、红线、检查清单和必要参考资料，不用未经验证的假设替代证据。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "rules-4-to-10",
      source: new URL("./references/rules-4-to-10.md", import.meta.url),
      target: "references/rules-4-to-10.md",
      title: "rules-4-to-10.md",
      summary: "Reference material for android-design-guidelines.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
