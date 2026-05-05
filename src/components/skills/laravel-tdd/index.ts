import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const laravelTddSkill = defineSkill({
  id: "laravel-tdd",
  fullName: "Laravel TDD 工作流",
  description: "当用户提到 Laravel 测试、Pest、PHPUnit、RefreshDatabase、Queue::fake 或 HTTP fake 时使用。非 Laravel 的 PHP 项目改用 `php-testing`。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for laravel-tdd.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
