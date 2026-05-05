import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const leadResearchAssistantSkill = defineSkill({
  id: "lead-research-assistant",
  fullName: "线索研究（lead-research-assistant）",
  description: "在需要定义 ICP、寻找高质量目标客户、筛选公司名单，或深挖已有账号的联系人与买家信号时使用。",
  useCases: [
    "从产品定位倒推出最值得优先接触的公司类型、岗位和行业。",
    "需要生成第一批外联名单，而不是只做宽泛市场分析。",
    "需要把 ICP、痛点、触达理由和下一步动作串成一份可执行清单。",
    "已经有候选公司或行业，需要进一步找联系人和 buyer intent。",
    "需要整理公司背景、岗位分布、公开项目、招聘信息或技术栈信号。",
    "需要把公开线索整成销售可直接使用的调研卡片。",
  ],
  constraints: [
    "先确认产品、客单价、成交周期和理想客户，再开始筛名单。",
    "输出必须包含筛选理由，不能只给一串公司名。",
    "联系建议要基于公开信息与角色职责，不编造邮箱、手机号或内部数据。",
    "只使用公开信息与合理推断，不伪造私人联系方式或内部状态。",
    "联系人发现与公司研究要拆开汇报，避免把猜测写成事实。",
    "明确标注事实、公开信号、推测结论、信息日期和置信度。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "account-research-guide",
      source: new URL("./references/account-research-guide.md", import.meta.url),
      target: "references/account-research-guide.md",
      title: "account-research-guide.md",
      summary: "Reference material for lead-research-assistant.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
