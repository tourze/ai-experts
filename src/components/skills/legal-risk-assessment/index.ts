import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const legalRiskAssessmentSkill = defineSkill({
  id: "legal-risk-assessment",
  fullName: "法律风险评估",
  description: "当需要评估合同、合规、劳动或争议事项的法律风险时使用。",
  useCases: [
    "评估合同偏离标准条款、监管变化、数据事件、劳动争议、知识产权争议、董事会敏感事项的法律暴露。",
    "为业务、法务、管理层提供统一的 `severity × likelihood` 口径，决定接受、缓释、升级或外部律师介入。",
    "事项涉及个人信息、跨境传输、监管申报时，参考 [references/gdpr-data-handling.md](references/gdpr-data-handling.md)。",
    "事项来源于招聘、用工、离职文件或 HR 政策时，参考 [references/employment-contract-templates.md](references/employment-contract-templates.md)。",
  ],
  constraints: [
    "这是内部评估框架，不替代法律意见；结论必须明确区分“已知事实”“假设”“风险判断”“缓释建议”，不能把猜测写成定论。",
    "风险分数只是排序工具，不是免责工具；任何 `critical` 或涉及董事高管责任、刑事风险、强监管、核心产品停摆的事项都应越级处理。",
    "严重度必须结合交易金额、业务关键度、法域监管强度、可执行性和声誉冲击；概率必须基于触发条件、先例和当前状态，而不是主观乐观。",
    "评估输出至少包含：风险描述、触发路径、严重度、概率、当前控制、缓释方案、剩余风险、升级建议和复审时间。",
    "对外部律师的使用要写清范围：是做本地法确认、专项争议处理、监管申报还是“背书式复核”，避免范围失控。",
  ],
  checklist: [
    "是否明确列出了已知事实、缺失事实、关键假设和法域范围，而不是把背景与结论混成一段描述。",
    "严重度是否覆盖金钱损失、业务中断、监管处罚、声誉影响、管理层责任与救济成本。",
    "概率是否基于触发条件、合同文本、监管先例、对手方行为模式和当前控制缺口，而不是“感觉不会出事”。",
    "是否写清了最小缓释动作、负责人、时限、复审频率，以及风险分数变化的条件。",
    "是否识别了必须升级的信号：政府调查、诉讼/仲裁、数据事件、核心产品侵权指控、董事高管责任、跨境强监管冲突。",
    "如果事项来自数据或劳动文档，是否已经联动隐私或 HR 文档技能，保证上下游事实口径一致。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "employment-contract-templates",
      source: new URL("./references/employment-contract-templates.md", import.meta.url),
      target: "references/employment-contract-templates.md",
      title: "employment-contract-templates.md",
      summary: "Reference material for legal-risk-assessment.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "gdpr-data-handling",
      source: new URL("./references/gdpr-data-handling.md", import.meta.url),
      target: "references/gdpr-data-handling.md",
      title: "gdpr-data-handling.md",
      summary: "Reference material for legal-risk-assessment.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
