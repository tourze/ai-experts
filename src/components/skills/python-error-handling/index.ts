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

export const pythonErrorHandlingSkill = defineSkill({
  id: "python-error-handling",
  fullName: "Python 错误处理",
  description: "当用户要设计 Python 异常层级、输入校验、部分失败治理或规范 try/except 纪律时使用。",
  useCases: [
    "API、CLI、任务 worker 需要稳定处理坏输入和外部依赖失败。",
    "需要建立统一异常层级、错误码和用户可见错误映射。",
    "批处理场景要区分\"全部失败\"和\"部分失败\"。",
  ],
  constraints: [
    "先定义错误边界，再写 `try/except`；不要一上来就全局兜底。",
    "只捕获你能处理的异常类型；其余异常保留堆栈继续抛出。",
    "验证错误、业务错误、外部系统错误要分层，不要全塞进 `ValueError`。",
  ],
  checklist: [
    "是否定义了清晰的异常层级和边界映射。",
    "只捕获可恢复错误。",
    "错误信息不泄露内部实现细节。",
    "批处理保留了成功项、失败项和失败原因。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "吞异常返回 None",
      pass: "按类型分别处理",
    }),
    defineAntiPattern({
      fail: "第三方异常直接暴露",
      pass: "映射到应用层错误",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "设计 Python 异常层级、错误边界、输入校验、外部依赖映射、批处理部分失败和用户可见错误响应。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "先划清错误边界：输入验证、业务规则、外部依赖、系统故障和批处理部分失败。",
      "只捕获能处理的异常，应用层异常向外映射为稳定 code/message，内部异常保留堆栈。",
      "批处理要保留成功项、失败项和失败原因，不用一个布尔值盖住全部结果。",
      "异常层级和 ErrorResponse 代码模式读取 `error-contract-patterns`。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "异常层级、捕获边界、错误码和用户可见消息映射。",
      "外部异常包装、批处理失败模型和堆栈保留策略。",
      "需要补的错误路径测试和敏感信息泄露检查。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "error-contract-patterns",
      source: new URL("./references/error-contract-patterns.md", import.meta.url),
      target: "references/error-contract-patterns.md",
      title: "Python 错误合同模式",
      summary: "应用层异常、校验异常、外部依赖异常和 ErrorResponse 映射示例。",
      loadWhen: "需要快速定义 Python 异常层级或错误响应合同时读取。",
    }),
  ],
});
