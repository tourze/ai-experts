import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const phpTestingSkill = defineSkill({
  id: "php-testing",
  description: "当用户编写、审查或重构 PHP 测试、PHPUnit/Pest 用例或测试配置时使用。Laravel 项目改用 `laravel-tdd`。",
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
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for php-testing.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
