import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
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
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
