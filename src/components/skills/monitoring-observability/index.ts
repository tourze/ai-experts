import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { logAnalyzerSkill } from "../log-analyzer/index";

export const monitoringObservabilitySkill = defineSkill({
  id: "monitoring-observability",
  fullName: "监控与可观测性",
  description: "当用户需要设计指标、日志、告警、健康检查或可观测性基线时使用。",
  useCases: [
    "新系统上线前补齐监控、日志和告警基线。",
    "现网性能或稳定性问题需要补证据链。",
    "需要定义 Golden Signals、SLO、告警阈值和 runbook 入口。",
  ],
  constraints: [
    "先定义业务目标和告警接收人，再定义指标与阈值。",
    "指标标签必须控制基数，禁止把用户 ID、订单号这类高基数字段当 label。",
    "日志默认结构化输出，严禁记录密码、令牌和原始密钥。",
    "健康检查要区分 `live`、`ready`、依赖降级和完全不可用。",
    "日志级别纪律：开发环境可用 DEBUG；生产环境默认 INFO，仅需人工介入的事件用 ERROR，WARN 用于即将越限的信号。",
    "指标和 trace 围绕系统边界事件布点（入站请求、出站调用、队列消费、定时任务触发），内部纯计算不单独布点。",
  ],
  checklist: [
    "是否覆盖延迟、流量、错误率、饱和度四类核心信号。",
    "是否为关键依赖提供健康检查和降级语义。",
    "是否定义告警等级、通知对象、静默窗口与 runbook 链接。",
    "是否确认日志字段、trace id、request id 的一致性。",
    "服务健康检查的 curl/nc/pg_isready/redis-cli 探测细节见 [references/service-monitor.md](references/service-monitor.md)。",
  ],
  relatedSkills: [
    {
      get skill() {
        return logAnalyzerSkill;
      },
      reason: "需要沿日志追根溯源时，参阅 `log-analyzer`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "高基数标签：100 万用户 × 10 个 path = 1000 万时间序列，Prometheus OOM。",
      pass: "控制标签基数：user_id 放日志里用 trace_id 关联，不放指标标签。",
    }),
    defineAntiPattern({
      fail: "只有系统指标",
      pass: "业务指标 + 系统指标",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先确认业务目标、SLO、告警接收人、升级路径和系统边界事件。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "围绕延迟、流量、错误率、饱和度定义指标；控制标签基数，不把 user_id、订单号等放进 label。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "结构化日志保留 trace/request id，生产默认 INFO；ERROR 只用于需要人工介入的事件，敏感字段必须脱敏。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "健康检查区分 live、ready、依赖降级和不可用；服务探测细节读取 service-monitor reference。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "Golden Signals、SLO、指标标签、日志字段、trace/request id 和健康检查语义。",
      "告警规则、等级、通知对象、静默窗口、runbook 链接和降级策略。",
      "高基数风险、敏感日志风险、边界事件覆盖缺口和后续验证点。",
    ],
  }),
  references: [
    defineReference({
      id: "service-monitor",
      source: new URL("./references/service-monitor.md", import.meta.url),
      target: "references/service-monitor.md",
      title: "service-monitor.md",
      summary: "服务健康检查的探测配置方法，包括 curl、nc、pg_isready、redis-cli 等具体检测细节和告警阈值建议。",
      loadWhen: "需要配置具体服务的健康检查探测命令或定义告警阈值时读取。",
    }),
  ],
});
