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
