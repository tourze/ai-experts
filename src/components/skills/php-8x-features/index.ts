import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const phpXFeaturesSkill = defineSkill({
  id: "php-8x-features",
  fullName: "PHP 8.x 现代语言特性",
  description: "当需要在 PHP 8.1-8.3+ 项目中使用 `readonly class`、backed enum、`match`、命名参数、构造器提升、交叉类型、DNF 类型、`#[\\Override]` 等现代语法特性时使用。",
  useCases: [
    "新建 PHP 类、函数或模块，需要选择合适的 PHP 8.x 语言特性。",
    "把遗留 PHP 5/7 代码升级到 PHP 8.1-8.3+ 的现代写法。",
    "在 readonly class、枚举、match、交叉类型之间做取舍。",
    "需要快速查阅某个 PHP 8.x 特性的正确用法。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "advanced-types-and-attributes",
      source: new URL("./references/advanced-types-and-attributes.md", import.meta.url),
      target: "references/advanced-types-and-attributes.md",
      title: "advanced-types-and-attributes.md",
      summary: "Reference material for php-8x-features.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
