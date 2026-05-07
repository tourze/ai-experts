import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineReference,
  defineSkill,
  defineSkillGoal,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { asyncPythonPatternsSkill } from "../async-python-patterns/index";
import { pythonErrorHandlingSkill } from "../python-error-handling/index";
import { pythonObservabilitySkill } from "../python-observability/index";

export const pythonBackgroundJobsSkill = defineSkill({
  id: "python-background-jobs",
  fullName: "Python 后台任务",
  description: "当用户要实现任务队列、worker、重试、幂等、死信队列或把长任务从请求链路中解耦时使用。",
  useCases: [
    "HTTP 请求不能同步等待的导出、通知、上传处理、第三方回调等任务。",
    "需要队列、worker、重试、幂等和状态跟踪。",
    "需要把“接单”和“执行”解耦，避免请求线程长时间占用。",
    "任务编排涉及异步执行细节时，联动 `async-python-patterns`。",
    "任务失败治理、异常分层和错误映射时，联动 `python-error-handling`。",
    "需要为 job 增加可观测性时，联动 `python-observability`。",
  ],
  constraints: [
    "请求入口先返回 `job_id`，不要把长任务伪装成同步接口。",
    "任务处理必须幂等，默认假设“至少一次投递”而不是“恰好一次”。",
    "状态机要显式：`pending -> running -> succeeded/failed`，不要靠日志猜状态。",
    "重试只适用于瞬时错误；永久错误要尽早落失败或死信队列。",
    "入队参数必须是稳定、可序列化、可回放的数据，不要把活对象直接塞进队列。",
  ],
  checklist: [
    "任务是否能在重复投递、进程重启和超时重试下安全重放。",
    "是否有 `job_id`、状态表和失败原因，而不是只有 worker 日志。",
    "是否区分了瞬时错误、永久错误和人工介入错误。",
    "是否定义了超时、最大重试次数和死信兜底。",
    "上游 API 是否只承担接单，不承担实际重活。",
  ],
  relatedSkills: [
    {
      get id() {
        return pythonErrorHandlingSkill.id;
      },
      reason: "任务失败治理、异常分层和错误映射时，联动 `python-error-handling`。",
    },
    {
      get id() {
        return pythonObservabilitySkill.id;
      },
      reason: "需要为 job 增加可观测性时，联动 `python-observability`。",
    },
    {
      get id() {
        return asyncPythonPatternsSkill.id;
      },
      reason: "任务编排涉及异步执行细节时，联动 `async-python-patterns`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "请求里 await 长任务",
      pass: "立即返回 job_id",
    }),
    defineAntiPattern({
      fail: "无业务幂等键",
      pass: "idempotency_key",
    }),
    defineAntiPattern({
      fail: "无限重试",
      pass: "区分错误类型",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "把 Python 长任务从请求链路中解耦，设计 job 状态机、队列消息、worker、重试、幂等和死信兜底。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认上游接单 API、任务 payload、幂等键、状态表、worker 数量、超时和重试策略。",
      "入口只返回 `job_id`，worker 读取稳定可序列化 payload，状态机显式记录 pending/running/succeeded/failed。",
      "瞬时错误才重试，永久错误落失败或死信；任务执行要可重放。",
      "Job dataclass、状态枚举和 QueueBackend 协议示例读取 `job-model-patterns`。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "job_id、payload、状态机、幂等键和队列边界设计。",
      "worker 执行、重试、死信、超时和失败原因记录方案。",
      "需要补的重放测试、失败测试和可观测性字段。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "job-model-patterns",
      source: new URL("./references/job-model-patterns.md", import.meta.url),
      target: "references/job-model-patterns.md",
      title: "Python 后台任务模型",
      summary: "Job 状态枚举、dataclass payload 和 QueueBackend 协议示例。",
      loadWhen: "需要快速定义 Python 后台任务数据模型和入队边界时读取。",
    }),
  ],
});
