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
  constraints: [
    "保持红绿重构循环：先写失败测试，再做最小实现，再清理结构。",
    "优先用 Pest 写新测试；只有项目已有 PHPUnit 约定或需要特定基类时才回退 PHPUnit。",
    "触库测试默认 `RefreshDatabase`；外部副作用默认 `Queue::fake()`、`Event::fake()`、`Http::fake()`。",
    "一个测试只验证一个行为边界：成功、授权失败、验证失败、外部依赖失败分开覆盖。",
    "覆盖率只是结果，不是借口；关键路径没有断言细节时，80% 也可能毫无意义。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
