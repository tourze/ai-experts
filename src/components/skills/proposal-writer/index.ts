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
  useCases: [
    "用户需要从零开始写商业提案、项目方案、渠道合作或服务报价文档。",
    "面向企业客户、采购方、管理层或投资委员会输出正式提案，覆盖 RFP 响应与 ROI 论证。",
    "目标是\"写出能发给客户的文本\"，不是只做提纲。",
    "交付物可以是长文档、Word 方案、PPT 结构稿或销售跟进材料。",
    "已经具备一部分背景材料，但需要把它们组织成对外表达。",
    "若前置研究还没完成，先用 [consulting-analysis](../consulting-analysis/SKILL.md) 补齐事实基础。",
  ],
  constraints: [
    "必须围绕客户问题、目标和成交动作写作，不要把公司介绍写成主角。",
    "结构要完整：背景、问题、方案、价值、实施、商务条款。",
    "没有证据的业绩、案例、统计数字、节约金额不能写；案例和承诺按证据强弱分层。",
    "报价、范围、里程碑、假设与排除项必须成套出现，不能只写价格。",
    "文案要服务成交动作，例如预约评审、签试点、进入采购流程或签约节点。",
    "企业级提案要明确客户决策链、预算区间和采购阶段。",
  ],
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
  ],
});
