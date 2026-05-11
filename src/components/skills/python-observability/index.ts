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
      get skill() {
        return pythonBackgroundJobsSkill;
      },
      reason: "后台任务监控和重试治理时，联动 `python-background-jobs`。",
    },
    {
      get skill() {
        return pythonTestingPatternsSkill;
      },
      reason: "需要把失败路径覆盖进测试时，联动 `python-testing-patterns`。",
    },
    {
      get skill() {
        return asyncPythonPatternsSkill;
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
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先确认请求入口、外部调用、任务边界、失败路径、敏感字段和现有日志字段。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "结构化日志固定 `event`、`request_id`、`elapsed_ms` 等键名，错误日志带堆栈和业务标签。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "指标覆盖吞吐、延迟、错误率和队列长度；trace/span 边界要贴近真实业务边界。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "logging context manager 和耗时字段示例读取 `logging-patterns`。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "关键链路的日志字段、指标、trace/span 和 profile / alert 缺口。",
      "请求上下文、错误标签、耗时记录和脱敏策略。",
      "需要补的失败路径测试和 dashboard / alert 建议。",
    ],
  }),
  references: [
    defineReference({
      id: "logging-patterns",
      source: new URL("./references/logging-patterns.md", import.meta.url),
      target: "references/logging-patterns.md",
      title: "Python 结构化日志模式",
      summary: "logging、contextmanager 耗时记录和稳定业务字段示例。",
      loadWhen: "需要快速给 Python 代码补结构化日志和耗时观测时读取。",
    }),
  ],
});
