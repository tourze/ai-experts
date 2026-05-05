import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const techDebtSkill = defineSkill({
  id: "tech-debt",
  fullName: "tech-debt",
  description: "在需要盘点代码健康状况、识别和排序技术债、制定治理策略、重构路线图或债务预算时使用。",
  useCases: [
    "适合代码健康盘点、重构优先级排序和维护 backlog 整理。",
    "适合回答“先还哪些债最划算、为什么”。",
    "适合遗留系统治理、重构路线图、债务预算争取和版本节奏协调。",
    "交叉引用：落到代码整改时配合 `complexity-reducer` 或 `refactoring-patterns`。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "guest-insights",
      source: new URL("./references/guest-insights.md", import.meta.url),
      target: "references/guest-insights.md",
      title: "guest-insights.md",
      summary: "Reference material for tech-debt.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
