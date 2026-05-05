import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const revopsSkill = defineSkill({
  id: "revops",
  fullName: "收入运营体系（revops）",
  description: "当用户要设计收入运营体系、线索生命周期、MQL/SQL、lead scoring、CRM 自动化、线索路由或营销销售交接时使用。",
  useCases: [
    "搭建营销、销售、客户成功之间的统一收入引擎",
    "定义线索生命周期、MQL/SQL 标准、评分模型和路由规则",
    "设计营销-销售交接 SLA 和 CRM 自动化",
    "诊断漏斗漏损、交接断裂或数据质量问题",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "scoring-and-pipeline",
      source: new URL("./references/scoring-and-pipeline.md", import.meta.url),
      target: "references/scoring-and-pipeline.md",
      title: "scoring-and-pipeline.md",
      summary: "Reference material for revops.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
