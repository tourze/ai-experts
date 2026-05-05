import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const uxWritingSkill = defineSkill({
  id: "ux-writing",
  fullName: "UX 微文案",
  description: "当用户要写或审按钮标签、错误消息、空态文案、表单 helper text、确认对话框、onboarding 提示或任何界面内微文案时使用。适合\"按钮写什么\"\"错误提示太生硬\"\"空态怎么写\"\"Submit 还是 Save\"等场景。",
  useCases: [
    "按钮标签（Submit / Save / Continue 还是具体动词）",
    "错误消息、空态、表单 helper、确认对话框",
    "Onboarding 首次提示、敏感操作措辞（删除/支付/注销）",
    "与 `product-design-critic` 联动评审文案。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "copy-patterns",
      source: new URL("./references/copy-patterns.md", import.meta.url),
      target: "references/copy-patterns.md",
      title: "copy-patterns.md",
      summary: "Reference material for ux-writing.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
