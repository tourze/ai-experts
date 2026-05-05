import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const incidentResponseSkill = defineSkill({
  id: "incident-response",
  fullName: "事故响应",
  description: "当用户反馈服务异常、性能下降、报错、中断、告警升级或需要事故响应协助时使用。",
  useCases: [
    "线上服务异常、性能下降、报错或中断。",
    "需要从症状快速分类为服务、性能、网络、认证或数据问题。",
    "事故复盘前还原完整时间线和决策链。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "anti-patterns",
      source: new URL("./references/anti-patterns.md", import.meta.url),
      target: "references/anti-patterns.md",
      title: "anti-patterns.md",
      summary: "Reference material for incident-response.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "time-line-template",
      source: new URL("./references/time-line-template.md", import.meta.url),
      target: "references/time-line-template.md",
      title: "time-line-template.md",
      summary: "Reference material for incident-response.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
