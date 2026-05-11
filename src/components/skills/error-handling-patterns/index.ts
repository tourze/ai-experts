import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { goErrorHandlingSkill } from "../go-error-handling/index";
import { phpErrorHandlingSkill } from "../php-error-handling/index";
import { pythonErrorHandlingSkill } from "../python-error-handling/index";
import { rustErrorHandlingSkill } from "../rust-error-handling/index";

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
  checklist: [
    "是否明确了错误分类（验证/业务/外部）和传播路径。",
    "是否定义了重试、超时、熔断和补偿边界。",
    "错误是否携带了诊断所需的上下文与关联 ID。",
    "是否对部分失败给出可解释的降级策略。",
    "用户可见消息是否不包含内部实现细节。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "吞异常 + 通用错误码",
      pass: "分层捕获 + 保留上下文",
    }),
    defineAntiPattern({
      fail: "第三方异常直接暴露",
      pass: "映射到应用层错误",
    }),
    defineAntiPattern({
      fail: "无条件重试",
      pass: "有界重试 + 退避 + 幂等前提",
    }),
  ],
  relatedSkills: [
    {
      get skill() {
        return goErrorHandlingSkill;
      },
      reason: "Go 项目需要落地错误包装、sentinel / typed error、panic 边界或 context 取消语义时联动。",
    },
    {
      get skill() {
        return pythonErrorHandlingSkill;
      },
      reason: "Python 项目需要设计异常层级、错误映射、重试边界或异步失败传播时联动。",
    },
    {
      get skill() {
        return rustErrorHandlingSkill;
      },
      reason: "Rust 项目需要在 `Result`、`thiserror`、`anyhow` 和错误枚举之间取舍时联动。",
    },
    {
      get skill() {
        return phpErrorHandlingSkill;
      },
      reason: "PHP 项目需要定义异常层级、输入校验错误、框架边界映射或 PHPUnit 失败路径时联动。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先列出调用边界、外部依赖、用户可见接口和批处理单位，识别每类错误的责任方。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "按验证错误、业务错误、外部系统错误和未知错误分层，定义对外错误码、用户消息和内部日志字段。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "只捕获能处理的异常；可恢复错误加有界重试、退避、幂等键和熔断/降级条件。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "批处理和异步任务要汇总部分失败，返回 succeeded/failed/retryable，不因单条坏数据丢整批。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "最后反查调用点和测试，确认错误语义、重试边界、关联 ID 和用户消息都被覆盖。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "错误分类表：类型、触发条件、对外暴露、内部上下文、调用方处理方式。",
      "重试/退避/幂等/熔断边界，以及哪些错误必须直接传播。",
      "批处理失败汇总结构、用户可见消息、日志字段、测试用例和兼容性风险。",
    ],
  }),
});
