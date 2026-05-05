import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const uxWritingSkill = defineSkill({
  id: "ux-writing",
  description: "当用户要写或审按钮标签、错误消息、空态文案、表单 helper text、确认对话框、onboarding 提示或任何界面内微文案时使用。适合\"按钮写什么\"\"错误提示太生硬\"\"空态怎么写\"\"Submit 还是 Save\"等场景。",
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
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for ux-writing.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
