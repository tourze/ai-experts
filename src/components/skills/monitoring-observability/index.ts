import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
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
      get id() {
        return logAnalyzerSkill.id;
      },
      reason: "需要沿日志追根溯源时，参阅 `log-analyzer`。",
    },
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
