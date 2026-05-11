import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineReference,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { goPerformanceSkill } from "../go-performance/index";
import { goTroubleshootingSkill } from "../go-troubleshooting/index";

export const goObservabilitySkill = defineSkill({
  id: "go-observability",
  fullName: "Go 可观测性",
  description: "当 Go 代码需要日志、指标、链路追踪、告警或可观测性体系建设时使用。",
  useCases: [
    "选型或实施日志（slog）、指标（Prometheus）、链路追踪（OpenTelemetry）、profiling、告警。",
    "需要在多条信号间做关联：日志带 trace ID、指标带 exemplar。",
    "从 `log.Printf` 迁移到结构化日志，或从零搭建可观测性体系。",
  ],
  constraints: [
    "**结构化优先**：所有日志必须用 `slog` 结构化输出，禁止 `fmt.Println` / `log.Printf` 进入生产。",
    "**信号关联**：日志注入 trace_id 和 span_id；指标 exemplar 关联到 trace。三条信号必须能通过 trace ID 串联。",
    "**告警面向症状**：告警基于用户可感知的症状（错误率、延迟 P99），不基于内部原因（goroutine 数量、缓存命中率）。",
    "**日志级别纪律**：DEBUG 开发时用、生产默认 INFO 起步、ERROR 只放需要人工介入的事件。WARN 放可自动恢复的异常。",
    "**高吞吐采样**：热路径日志用采样 Handler 降低 I/O；指标用 histogram 而非全量日志统计。",
    "**PII 脱敏**：日志 Handler 层统一拦截敏感字段，不在业务代码逐处处理。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "用 log.Printf 写生产日志。",
      pass: "迁移到 slog.Info，携带结构化字段。",
    }),
    defineAntiPattern({
      fail: "日志不带 trace_id。",
      pass: "slog Handler 自动注入 trace/span ID。",
    }),
    defineAntiPattern({
      fail: "指标用 histogram 但桶不合理。",
      pass: "先看数据分布再配 buckets，或用 prometheus.DefBuckets 起步。",
    }),
    defineAntiPattern({
      fail: "告警基于 goroutine 数量。",
      pass: "改为基于错误率或延迟 P99 的症状告警。",
    }),
    defineAntiPattern({
      fail: "每个请求打多条 INFO 日志。",
      pass: "热路径用 DEBUG 或采样 Handler。",
    }),
    defineAntiPattern({
      fail: "手动拼接日志字段 fmt.Sprintf。",
      pass: "用 slog.With 预置上下文字段。",
    }),
    defineAntiPattern({
      fail: "指标 label 基数爆炸（user_id 等）。",
      pass: "label 只用低基数枚举值。",
    }),
  ],
  relatedSkills: [
    {
      get skill() {
        return goTroubleshootingSkill;
      },
      reason: "性能优化中的 pprof/profile → `go-performance`；生产异常排查 → `go-troubleshooting`。",
    },
    {
      get skill() {
        return goPerformanceSkill;
      },
      reason: "性能优化中的 pprof/profile → `go-performance`；生产异常排查 → `go-troubleshooting`。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先确认服务边界、关键 SLO、已有日志 / 指标 / trace / profile 和告警来源。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "按五大信号补齐事件、趋势、调用链、性能采样和症状告警，不用单一日志代替观测体系。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "迁移 slog 时先拆字段、注入 trace_id / span_id、设置 JSON handler 和采样策略。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "五大信号和 slog 迁移读取 `signals-and-migration`；日志细节读取 `logging`。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "logs / metrics / traces / profiles / alerts 覆盖矩阵和缺口。",
      "slog 迁移步骤、字段规范、trace 注入和采样建议。",
      "需要新增的仪表盘、告警和性能 profile 入口。",
    ],
  }),
  references: [
    defineReference({
      id: "signals-and-migration",
      source: new URL("./references/signals-and-migration.md", import.meta.url),
      target: "references/signals-and-migration.md",
      title: "Go 可观测性信号与 slog 迁移",
      summary: "Logs、Metrics、Traces、Profiles、Alerts 五大信号职责和 log.Printf 到 slog 的迁移路径。",
      loadWhen: "需要快速规划 Go 服务观测体系或 slog 迁移时读取。",
    }),
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
