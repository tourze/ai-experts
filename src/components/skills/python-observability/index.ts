import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";
import { asyncPythonPatternsSkill } from "../async-python-patterns/index";
import { pythonBackgroundJobsSkill } from "../python-background-jobs/index";
import { pythonTestingPatternsSkill } from "../python-testing-patterns/index";

export const pythonObservabilitySkill = defineSkill({
  id: "python-observability",
  fullName: "Python 可观测性",
  description: "当用户要给 Python 服务补结构化日志、指标、trace、请求上下文和故障定位能力时使用。",
  useCases: [
    "API、worker、定时任务需要补日志、指标和链路追踪。",
    "线上问题只能“猜”，需要把请求上下文和耗时显式打出来。",
    "需要统一日志字段、trace ID、错误标签和关键业务指标。",
    "异步链路上下文透传时，联动 `async-python-patterns`。",
    "后台任务监控和重试治理时，联动 `python-background-jobs`。",
    "需要把失败路径覆盖进测试时，联动 `python-testing-patterns`。",
  ],
  constraints: [
    "默认使用结构化日志，不依赖随手 `print()`。",
    "日志键名要稳定，例如 `event`、`request_id`、`elapsed_ms`，不要一处一个命名。",
    "指标和 trace 要围绕边界事件布点，不要在纯函数内部滥打点。",
    "严禁记录密码、token、身份证号等敏感数据。",
    "错误日志必须带足够上下文，但不能把整份大对象原样倾倒进日志。",
  ],
  checklist: [
    "每条关键链路都能定位到请求入口、外部调用和失败位置。",
    "日志字段在不同模块中保持一致，便于检索和聚合。",
    "指标覆盖了吞吐、延迟、错误率和关键队列长度。",
    "trace/span 的边界与真实业务边界一致，而不是随手乱切。",
    "敏感字段已脱敏或根本不写入日志。",
  ],
  relatedSkills: [
    {
      get id() {
        return pythonBackgroundJobsSkill.id;
      },
      reason: "后台任务监控和重试治理时，联动 `python-background-jobs`。",
    },
    {
      get id() {
        return pythonTestingPatternsSkill.id;
      },
      reason: "需要把失败路径覆盖进测试时，联动 `python-testing-patterns`。",
    },
    {
      get id() {
        return asyncPythonPatternsSkill.id;
      },
      reason: "异步链路上下文透传时，联动 `async-python-patterns`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "自然语言 + 无字段",
      pass: "结构化字段",
    }),
    defineAntiPattern({
      fail: "失败只打 str(error)",
      pass: "堆栈 + 业务标签",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
