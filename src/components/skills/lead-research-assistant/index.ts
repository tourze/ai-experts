import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
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
  checklist: [
    "是否明确了行业、公司规模、区域和购买角色。",
    "是否解释了每个目标为何进入名单。",
    "是否给出了可执行的外联切入点而非空泛描述。",
    "是否把“适合试单”和“适合长期跟进”的目标区分开。",
    "是否区分事实、公开信号和推测结论。",
    "是否给出可执行的联系人顺序与切入点。",
    "是否说明信号的新鲜度和可信度。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "没 ICP 撒大网",
      pass: "窄 ICP",
    }),
    defineAntiPattern({
      fail: "只给公司名",
      pass: "公司 + 触发 + 切入",
    }),
    defineAntiPattern({
      fail: "只挖联系人",
      pass: "角色 + 决策 map",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认产品、客单价、成交周期、目标行业、公司规模、区域、购买角色和理想客户定义。",
      "从 ICP 到首批账号时，逐家公司说明触发信号、适配原因、建议联系人角色和首次切入角度。",
      "已有账号深挖时读取 account-research-guide，拆分公司背景、阶段信号、岗位分布、公开项目、招聘和技术栈线索。",
      "联系人发现与公司研究分开汇报；公开事实、公开信号、推测结论、信息日期和置信度必须分层标注。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "目标账号清单：公司、触发信号、适配原因、建议联系人、首次切入角度和优先级。",
      "单账号调研卡片：阶段信号、关键岗位、买家痛点、切入点、风险和后续动作。",
      "事实/信号/推测/置信度分层，以及适合试单和适合长期跟进的目标区分。",
    ],
  }),
  references: [
    defineReference({
      id: "account-research-guide",
      source: new URL("./references/account-research-guide.md", import.meta.url),
      target: "references/account-research-guide.md",
      title: "account-research-guide.md",
      summary: "客户账户调研的完整框架和操作步骤，涵盖公司背景、联系人策略和买家信号挖掘。",
      loadWhen: "需要深入了解单个目标公司的背景、组织结构或寻找具体联系人时读取。",
    }),
  ],
});
