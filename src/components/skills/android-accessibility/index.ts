import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const androidAccessibilitySkill = defineSkill({
  id: "android-accessibility",
  fullName: "Android 无障碍审计",
  description: "当用户要审计或修复 Android 无障碍、TalkBack、触摸目标、对比度或焦点管理时使用。",
  useCases: [
    "审计或修复 Compose / View 的无障碍问题",
    "TalkBack 播报不正确、缺失或冗余",
    "触摸目标过小导致误触",
    "色彩对比度不达标",
    "键盘 / Switch Access 无法操作",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "advanced-patterns",
      source: new URL("./references/advanced-patterns.md", import.meta.url),
      target: "references/advanced-patterns.md",
      title: "advanced-patterns.md",
      summary: "Reference material for android-accessibility.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
