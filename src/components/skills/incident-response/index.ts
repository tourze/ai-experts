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
  constraints: [
    "先只读排查，再提出修复；未经确认不重启或改配置。",
    "每次只验证一个假设，记录证据与反证。",
    "时间线优先：先建时间线再下结论；禁止跳过时间线直接猜根因。",
    "止血先于根因修复：先执行可逆止血，根因修复进 follow-up。",
    "区分根因与触发因素：「让事故可能的脆弱性」≠「这次触发的具体动作」。",
    "时间线按 UTC 排序；本地时间显式标注时区。",
    "报告中不暴露生产 secret/token；引用日志时脱敏。",
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
