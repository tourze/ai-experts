import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const monitoringObservabilitySkill = defineSkill({
  id: "monitoring-observability",
  fullName: "监控与可观测性",
  description: "当用户需要设计指标、日志、告警、健康检查或可观测性基线时使用。",
  useCases: [
    "新系统上线前补齐监控、日志和告警基线。",
    "现网性能或稳定性问题需要补证据链。",
    "需要定义 Golden Signals、SLO、告警阈值和 runbook 入口。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "service-monitor",
      source: new URL("./references/service-monitor.md", import.meta.url),
      target: "references/service-monitor.md",
      title: "service-monitor.md",
      summary: "Reference material for monitoring-observability.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
