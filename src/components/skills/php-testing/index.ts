import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const phpTestingSkill = defineSkill({
  id: "php-testing",
  fullName: "PHP 测试",
  description: "当用户编写、审查或重构 PHP 测试、PHPUnit/Pest 用例或测试配置时使用。Laravel 项目改用 `laravel-tdd`。",
  useCases: [
    "编写新的 PHPUnit / Pest 测试类、测试方法和测试夹具。",
    "审查或重构已有测试，降低脆弱断言、过度 Mock 和复制粘贴。",
    "统一 `#[Test]`、数据提供者、覆盖率边界与测试分组。",
    "调整 `phpunit.xml` 的严格模式、套件划分和覆盖率策略。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "examples",
      source: new URL("./references/examples.md", import.meta.url),
      target: "references/examples.md",
      title: "examples.md",
      summary: "Reference material for php-testing.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
