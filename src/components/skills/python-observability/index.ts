import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const pythonObservabilitySkill = defineSkill({
  id: "python-observability",
  fullName: "Python 可观测性",
  description: "当用户要给 Python 服务补结构化日志、指标、trace、请求上下文和故障定位能力时使用。",
  useCases: [
    "API、worker、定时任务需要补日志、指标和链路追踪。",
    "线上问题只能“猜”，需要把请求上下文和耗时显式打出来。",
    "需要统一日志字段、trace ID、错误标签和关键业务指标。",
    "异步链路上下文透传时，联动 [async-python-patterns](../async-python-patterns/SKILL.md)。",
    "后台任务监控和重试治理时，联动 [python-background-jobs](../python-background-jobs/SKILL.md)。",
    "需要把失败路径覆盖进测试时，联动 [python-testing-patterns](../python-testing-patterns/SKILL.md)。",
  ],
  constraints: [
    "默认使用结构化日志，不依赖随手 `print()`。",
    "日志键名要稳定，例如 `event`、`request_id`、`elapsed_ms`，不要一处一个命名。",
    "指标和 trace 要围绕边界事件布点，不要在纯函数内部滥打点。",
    "严禁记录密码、token、身份证号等敏感数据。",
    "错误日志必须带足够上下文，但不能把整份大对象原样倾倒进日志。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
