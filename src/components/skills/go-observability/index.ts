import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";
import { goPerformanceSkill } from "../go-performance/index";
import { goTroubleshootingSkill } from "../go-troubleshooting/index";

export const goObservabilitySkill = defineSkill({
  id: "go-observability",
  fullName: "go-observability",
  description: "当 Go 代码需要日志、指标、链路追踪、告警或可观测性体系建设时使用。",
  useCases: [
    "选型或实施日志（slog）、指标（Prometheus）、链路追踪（OpenTelemetry）、profiling、告警。",
    "需要在多条信号间做关联：日志带 trace ID、指标带 exemplar。",
    "从 `log.Printf` 迁移到结构化日志，或从零搭建可观测性体系。",
    "性能优化中的 pprof/profile → `go-performance`；生产异常排查 → `go-troubleshooting`。",
  ],
  constraints: [
    "**结构化优先**：所有日志必须用 `slog` 结构化输出，禁止 `fmt.Println` / `log.Printf` 进入生产。",
    "**信号关联**：日志注入 trace_id 和 span_id；指标 exemplar 关联到 trace。三条信号必须能通过 trace ID 串联。",
    "**告警面向症状**：告警基于用户可感知的症状（错误率、延迟 P99），不基于内部原因（goroutine 数量、缓存命中率）。",
    "**日志级别纪律**：DEBUG 开发时用、生产默认 INFO 起步、ERROR 只放需要人工介入的事件。WARN 放可自动恢复的异常。",
    "**高吞吐采样**：热路径日志用采样 Handler 降低 I/O；指标用 histogram 而非全量日志统计。",
    "**PII 脱敏**：日志 Handler 层统一拦截敏感字段，不在业务代码逐处处理。",
  ],
  relatedSkills: [
    {
      get id() {
        return goTroubleshootingSkill.id;
      },
      reason: "性能优化中的 pprof/profile → `go-performance`；生产异常排查 → `go-troubleshooting`。",
    },
    {
      get id() {
        return goPerformanceSkill.id;
      },
      reason: "性能优化中的 pprof/profile → `go-performance`；生产异常排查 → `go-troubleshooting`。",
    },
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
      summary: "Go 结构化日志规范：slog 使用、日志级别纪律、采样与 PII 脱敏。",
      loadWhen: "需要设计结构化日志策略或从 log.Printf 迁移到 slog 时读取。",
    }),
  ],
});
