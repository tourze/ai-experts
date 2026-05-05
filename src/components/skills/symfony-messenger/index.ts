import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const symfonyMessengerSkill = defineSkill({
  id: "symfony-messenger",
  fullName: "Symfony Messenger",
  description: "当用户要设计或修复 Symfony Messenger 异步消息处理、重试、失败队列或消费者时使用。",
  useCases: [
    "新增或审查 Symfony Messenger 消息、Handler、Transport、Failure Transport 与消费命令。",
    "消息重复消费、失败重试、毒消息堆积、路由错误或同步/异步边界不清。",
    "需要在异步处理里协调数据库写入、外部 API 调用和最终一致性。",
    "如果 Handler 里涉及批量写库，可联动 [doctrine-batch-processing](../doctrine-batch-processing/SKILL.md)；如果消息执行前后要做权限判断，可联动 [symfony-voters](../symfony-voters/SKILL.md)。",
    "更细的命令与失败模式见 [reference.md](reference.md)。",
  ],
  constraints: [
    "默认按至少一次投递设计，不要假设“绝不会重复消费”。",
    "Handler 必须幂等，外部副作用必须可重放、可跳过或可去重。",
    "消息契约一旦落到队列，就要考虑向后兼容；不要随意改构造参数含义。",
    "失败传输、重试退避和消费监控必须显式配置，不能靠默认值碰运气。",
    "重活要异步，鉴权和输入校验要在入队前完成，不要把无效消息塞进队列后再兜底。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
