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
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
