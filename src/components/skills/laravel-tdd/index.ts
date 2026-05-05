import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const laravelTddSkill = defineSkill({
  id: "laravel-tdd",
  fullName: "Laravel TDD 工作流",
  description: "当用户提到 Laravel 测试、Pest、PHPUnit、RefreshDatabase、Queue::fake 或 HTTP fake 时使用。非 Laravel 的 PHP 项目改用 `php-testing`。",
  useCases: [
    "Laravel 新功能、Bug 修复、重构、授权规则或副作用链路需要先写测试再实现。",
    "需要测试 HTTP 端点、Eloquent 模型、策略、队列作业、通知和 Sanctum 认证。",
    "需要把回归范围从“手点一下”提升到可重复执行的自动化验证。",
    "发布前整体验证看 [laravel-verification](../laravel-verification/SKILL.md)，实现边界约束看 [laravel-patterns](../laravel-patterns/SKILL.md)。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
