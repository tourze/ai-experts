import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const proposalWriterSkill = defineSkill({
  id: "proposal-writer",
  fullName: "提案撰写",
  description: "当用户要撰写商业提案、合作方案、销售报价说明、伙伴关系文档、企业级方案、RFP 响应或带 ROI 论证的咨询式材料时使用。该技能强调问题定义、价值主张、实施计划和成交导向的文字表达。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "proposal-review",
      source: new URL("./references/proposal-review.md", import.meta.url),
      target: "references/proposal-review.md",
      title: "proposal-review.md",
      summary: "Reference material for proposal-writer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for proposal-writer.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
