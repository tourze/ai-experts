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
  constraints: [
    "**单一事实源**：CRM 为主记录系统，不允许影子 pipeline",
    "**先定义再自动化**：无业务定义不上自动化",
    "**衡量每个交接**：营销→SDR→AE→CS 每个交接点有 SLA",
    "**收入团队对齐**：三方共享指标仪表盘和目标定义",
  ],
  checklist: [
    "[ ] MQL 定义包含画像+意图双重门槛",
    "[ ] 交接 SLA 4h/48h 并有超时升级",
    "[ ] 评分含显性、隐性、负分三类且有衰减",
    "[ ] 路由有兜底升级逻辑",
    "[ ] Pipeline 阶段有客观进入标准",
    "[ ] 核心指标仪表盘三方可见",
    "[ ] 季度数据健康审计",
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
