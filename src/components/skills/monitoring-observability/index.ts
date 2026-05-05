import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const monitoringObservabilitySkill = defineSkill({
  id: "monitoring-observability",
  description: "当用户需要设计指标、日志、告警、健康检查或可观测性基线时使用。",
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
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for monitoring-observability.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
