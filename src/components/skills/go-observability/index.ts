import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const goObservabilitySkill = defineSkill({
  id: "go-observability",
  fullName: "go-observability",
  description: "当 Go 代码需要日志、指标、链路追踪、告警或可观测性体系建设时使用。",
  useCases: [
    "选型或实施日志（slog）、指标（Prometheus）、链路追踪（OpenTelemetry）、profiling、告警。",
    "需要在多条信号间做关联：日志带 trace ID、指标带 exemplar。",
    "从 `log.Printf` 迁移到结构化日志，或从零搭建可观测性体系。",
    "性能优化中的 pprof/profile → [go-performance](../go-performance/SKILL.md)；生产异常排查 → [go-troubleshooting](../go-troubleshooting/SKILL.md)。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "logging",
      source: new URL("./references/logging.md", import.meta.url),
      target: "references/logging.md",
      title: "logging.md",
      summary: "Reference material for go-observability.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
