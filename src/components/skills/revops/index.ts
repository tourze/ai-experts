import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillGoal,
  defineSkillOutputs,
  defineSkillWorkflow,
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
    "MQL 定义包含画像+意图双重门槛",
    "交接 SLA 4h/48h 并有超时升级",
    "评分含显性、隐性、负分三类且有衰减",
    "路由有兜底升级逻辑",
    "Pipeline 阶段有客观进入标准",
    "核心指标仪表盘三方可见",
    "季度数据健康审计",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "只看数量不看质量 → MQL 注水，销售不信任",
      pass: "用质量、转化率和销售接受率共同衡量线索。",
    }),
    defineAntiPattern({
      fail: "交接无 SLA → 线索冷掉",
      pass: "定义 MQL 到 SQL 交接 SLA、责任人和超时提醒。",
    }),
    defineAntiPattern({
      fail: "评分不衰减 → 旧行为虚高",
      pass: "评分加入时间衰减和负向行为。",
    }),
    defineAntiPattern({
      fail: "先买工具再定流程 → 自动化放大坏流程",
      pass: "先固化流程与口径，再用工具自动化。",
    }),
    defineAntiPattern({
      fail: "影子 Pipeline → 口径不一致",
      pass: "统一 Pipeline 阶段定义、字段和报表口径。",
    }),
    defineAntiPattern({
      fail: "丢单不复盘 → 同因反复丢单",
      pass: "建立丢单原因复盘和异议库更新节奏。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "设计或诊断收入运营体系，把线索生命周期、评分、MQL/SQL、路由、SLA、Pipeline、CRM 自动化和数据治理对齐到统一收入引擎。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "先定义线索生命周期：Subscriber、Lead、MQL、SQL、Opportunity、Customer、Evangelist，以及每阶段客观进入标准。",
      "建立 lead scoring：显性 fit、隐性 engagement、负分和时间衰减三类规则缺一不可；细节读取 scoring-and-pipeline。",
      "设计 MQL 到 SQL 交接 SLA：4 小时内首次联系，48 小时内 qualify/reject 并记录原因。",
      "设计路由和兜底：轮询、区域、账户或技能优先，主负责人未响应时转备选并通知管理者。",
      "管理 Pipeline：阶段推进要有客观标准，停留超阶段均值 2 倍触发复盘，丢单必须记录原因。",
      "最后落 CRM 自动化和数据治理：生命周期升级、任务、SLA 告警、阶段通知、赢输触发、去重、必填字段和季度审计。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "线索生命周期、MQL/SQL 定义、评分模型、路由规则和 SLA。",
      "Pipeline 阶段标准、停滞复盘规则、丢单原因分类和 CRM 自动化清单。",
      "核心指标仪表盘：Lead→MQL、MQL→SQL、SQL→Opp、LTV:CAC、speed-to-lead、win rate 和 pipeline velocity。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "scoring-and-pipeline",
      source: new URL("./references/scoring-and-pipeline.md", import.meta.url),
      target: "references/scoring-and-pipeline.md",
      title: "scoring-and-pipeline.md",
      summary: "线索评分模型、Pipeline 阶段标准定义与交接 SLA 模板。",
      loadWhen: "需要设计 MQL/SQL 评分模型、定义 Pipeline 阶段或配置 CRM 交接规则时读取。",
    }),
  ],
});
