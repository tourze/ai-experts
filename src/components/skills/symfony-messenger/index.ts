import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineReference,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { doctrineBatchProcessingSkill } from "../doctrine-batch-processing/index";
import { symfonyVotersSkill } from "../symfony-voters/index";

export const symfonyMessengerSkill = defineSkill({
  id: "symfony-messenger",
  fullName: "Symfony Messenger",
  description: "当用户要设计或修复 Symfony Messenger 异步消息处理、重试、失败队列或消费者时使用。",
  useCases: [
    "新增或审查 Symfony Messenger 消息、Handler、Transport、Failure Transport 与消费命令。",
    "消息重复消费、失败重试、毒消息堆积、路由错误或同步/异步边界不清。",
    "需要在异步处理里协调数据库写入、外部 API 调用和最终一致性。",
    "如果 Handler 里涉及批量写库，可联动 `doctrine-batch-processing`；如果消息执行前后要做权限判断，可联动 `symfony-voters`。",
    "更细的命令与失败模式读取 `operations-reference`。",
  ],
  constraints: [
    "默认按至少一次投递设计，不要假设“绝不会重复消费”。",
    "Handler 必须幂等，外部副作用必须可重放、可跳过或可去重。",
    "消息契约一旦落到队列，就要考虑向后兼容；不要随意改构造参数含义。",
    "失败传输、重试退避和消费监控必须显式配置，不能靠默认值碰运气。",
    "重活要异步，鉴权和输入校验要在入队前完成，不要把无效消息塞进队列后再兜底。",
  ],
  checklist: [
    "消息是否只携带稳定、可序列化、可重试的数据，而不是整个实体对象。",
    "Handler 是否显式处理幂等、重试、超时和外部依赖失败。",
    "`messenger.yaml` 是否配置了路由、失败传输和合理的 retry strategy。",
    "消费命令、失败队列查看与重放命令是否被纳入运维手册。",
    "如果消息会触发写库或第三方回调，是否有 request id / 去重键 / outbox 等证据链。",
  ],
  relatedSkills: [
    {
      get id() {
        return symfonyVotersSkill.id;
      },
      reason: "消息入队前后需要权限判断、资源归属或授权矩阵时联动。",
    },
    {
      get id() {
        return doctrineBatchProcessingSkill.id;
      },
      reason: "Handler 内涉及批量写库、回填或 Doctrine UnitOfWork 控制时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "Entity 塞进消息体",
      pass: "只传 ID 和稳定字段",
    }),
    defineAntiPattern({
      fail: "Handler 无幂等保护",
      pass: "去重键 + 幂等",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认同步 / 异步边界、消息字段、序列化兼容性、外部副作用、失败传输和消费监控。",
      "消息只携带稳定可序列化数据，Handler 必须有幂等键、超时、重试和外部依赖失败处理。",
      "messenger.yaml 显式配置 routing、failure_transport 和 retry_strategy，不依赖默认值。",
      "消息类、Handler 和配置示例读取 `message-handler-patterns`；消费命令和失败模式读取 `operations-reference`。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "消息合同、Handler 幂等、transport routing、失败队列和重试策略。",
      "消费者命令、失败重放、监控和运维手册建议。",
      "需要补的重复投递、失败传输和外部副作用测试。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "message-handler-patterns",
      source: new URL("./references/message-handler-patterns.md", import.meta.url),
      target: "references/message-handler-patterns.md",
      title: "Symfony Messenger 消息模式",
      summary: "readonly message、AsMessageHandler 和 messenger.yaml transport 配置示例。",
      loadWhen: "需要快速实现 Symfony Messenger 消息、Handler 或 transport 配置时读取。",
    }),
    defineReference({
      id: "operations-reference",
      source: new URL("./references/operations-reference.md", import.meta.url),
      target: "references/operations-reference.md",
      title: "Symfony Messenger 运维参考",
      summary: "Messenger 配置、Handler、消费命令、失败队列恢复和失败模式。",
      loadWhen: "需要 Messenger 消费、失败恢复、排障命令或完整配置时读取。",
    }),
  ],
});
