import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const pythonBackgroundJobsSkill = defineSkill({
  id: "python-background-jobs",
  fullName: "Python 后台任务",
  description: "当用户要实现任务队列、worker、重试、幂等、死信队列或把长任务从请求链路中解耦时使用。",
  useCases: [
    "HTTP 请求不能同步等待的导出、通知、上传处理、第三方回调等任务。",
    "需要队列、worker、重试、幂等和状态跟踪。",
    "需要把“接单”和“执行”解耦，避免请求线程长时间占用。",
    "任务编排涉及异步执行细节时，联动 [async-python-patterns](../async-python-patterns/SKILL.md)。",
    "任务失败治理、异常分层和错误映射时，联动 [python-error-handling](../python-error-handling/SKILL.md)。",
    "需要为 job 增加可观测性时，联动 [python-observability](../python-observability/SKILL.md)。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
