import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const phpTypeSafetySkill = defineSkill({
  id: "php-type-safety",
  fullName: "PHP 类型安全",
  description: "当用户要配置 PHPStan 或 Psalm、补 array shapes 和泛型标注、使用条件返回类型、做类型收窄或消除 mixed，以及新增、补写或重构 PHPDoc 时使用。",
  useCases: [
    "配置或提升 PHPStan / Psalm 的检查级别。",
    "为数组补 `array{key: type}` 结构或 `@template` 泛型标注。",
    "用条件返回类型、`@phpstan-assert` 或 `assert()` 做类型收窄。",
    "消除代码中的 `mixed`、`@var` 强转和 `@phpstan-ignore` 压制。",
    "为现有 PHP 代码补写或收敛 `/** */` 文档块。",
    "审查 PHPDoc 是否重复签名，或遗漏数组结构、异常、业务约束等关键信息。",
    "在框架代码、DTO、值对象、仓库与服务层中统一文档风格。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "advanced-patterns",
      source: new URL("./references/advanced-patterns.md", import.meta.url),
      target: "references/advanced-patterns.md",
      title: "advanced-patterns.md",
      summary: "Reference material for php-type-safety.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "patterns",
      source: new URL("./references/patterns.md", import.meta.url),
      target: "references/patterns.md",
      title: "patterns.md",
      summary: "Reference material for php-type-safety.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
