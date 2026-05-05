import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const runningDecisionProcessesSkill = defineSkill({
  id: "running-decision-processes",
  fullName: "决策流程",
  description: "当用户要推进高风险决策、解决分析瘫痪、对齐多方意见或建立 DACI/RAPID 等决策机制时使用；帮助把模糊争论变成可执行流程。",
  useCases: [
    "多方分歧、迟迟无法拍板、需要明确决策人和输入边界。",
    "需要补充经验参考时可阅读 [references/guest-insights.md](references/guest-insights.md)。",
    "做失败预演或事前验尸（pre-mortem）时，可配合 `inversion-strategist` 与 [planning-under-uncertainty](../planning-under-uncertainty/SKILL.md)。",
    "需要把争议证据转成先验、后验、行动阈值和敏感性报告时，配合 `what-if-oracle`。",
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
      summary: "Reference material for running-decision-processes.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
