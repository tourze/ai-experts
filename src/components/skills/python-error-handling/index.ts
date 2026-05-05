import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
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
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
