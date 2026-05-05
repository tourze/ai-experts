import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const laravelVerificationSkill = defineSkill({
  id: "laravel-verification",
  fullName: "Laravel 验证循环",
  description: "当用户提到 Laravel 自检、发版前检查、CI 流水线、composer audit、phpstan、pint 或 migrate --pretend 时使用。",
  useCases: [
    "提交 PR 前、重构后、依赖升级后、预发布前需要跑一套完整的 Laravel 验证。",
    "需要把“本地能跑”提升为“格式、静态分析、测试、迁移和运行时配置都过关”。",
    "需要把验证命令落到 CI 或交接文档中。",
    "代码级实现和安全基线分别参考 [laravel-patterns](../laravel-patterns/SKILL.md) 与 [laravel-security](../laravel-security/SKILL.md)。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
