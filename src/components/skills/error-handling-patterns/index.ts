import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const errorHandlingPatternsSkill = defineSkill({
  id: "error-handling-patterns",
  fullName: "错误处理模式",
  description: "在需要设计异常传播、Result 风格错误、局部降级、重试边界和错误分层时使用。语言无关的通用错误处理规范。",
  useCases: [
    "API 设计、后台任务、批处理、异步工作流和跨服务调用。",
    "需要统一错误语义、错误映射和兜底策略。",
    "各语言落地时加载对应语言 skill：`go-error-handling`、`python-error-handling`、`rust-error-handling`、`php-error-handling`。",
  ],
  constraints: [
    "**错误三层模型**\n| 层 | 含义 | 对外暴露 | 处理策略 |\n|----|------|---------|---------|\n| 验证错误 | 输入不合法 | 具体错误码 + 用户消息 | 调用方修正后重试 |\n| 业务错误 | 规则违反（如重复、余额不足） | 业务语义错误码 | 调用方按业务逻辑处理 |\n| 外部系统错误 | 依赖故障（DB/网络/第三方） | 通用\"服务不可用\" | 重试 / 熔断 / 降级 |",
    "**通用约束**\n- 不吞异常：如果不能处理，必须传播给调用方。\n- 只捕获你能处理的异常类型；其余保留堆栈继续抛出。\n- 用户可见消息与内部调试细节分离，禁止把原始异常/堆栈/SQL/路径暴露到接口层。\n- 重试必须有边界、有幂等前提、有退避策略，不得无条件重试。\n- 批处理要支持部分失败汇总，不因一条坏数据丢掉整批。\n- 库/SDK 对外暴露可匹配的错误类型，让调用方能按类型分支处理。\n- 对外 API 的错误语义是合同，修改前要反查调用点和测试。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
