import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const phpXFeaturesSkill = defineSkill({
  id: "php-8x-features",
  description: "当需要在 PHP 8.1-8.3+ 项目中使用 `readonly class`、backed enum、`match`、命名参数、构造器提升、交叉类型、DNF 类型、`#[\\Override]` 等现代语法特性时使用。",
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
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for php-8x-features.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
