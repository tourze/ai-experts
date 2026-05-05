import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const fishboneDiagramSkill = defineSkill({
  id: "fishbone-diagram",
  fullName: "鱼骨图（因果分析图）",
  description: "当用户要用鱼骨图、Ishikawa 或 5 Whys 做根因分析和因果排查时使用。",
  useCases: [
    "复杂问题的根因分析：避免\"头痛医头\"。",
    "质量问题排查、故障诊断、流程改进。",
    "与 [mckinsey-7-step](../mckinsey-7-step/SKILL.md) 配合：七步法的第二步（分解问题）可以用鱼骨图。问题定义阶段的补充工具见 [references/five-w-two-h.md](references/five-w-two-h.md)。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "five-w-two-h",
      source: new URL("./references/five-w-two-h.md", import.meta.url),
      target: "references/five-w-two-h.md",
      title: "five-w-two-h.md",
      summary: "Reference material for fishbone-diagram.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
