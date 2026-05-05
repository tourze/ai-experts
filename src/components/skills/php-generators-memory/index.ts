import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const phpGeneratorsMemorySkill = defineSkill({
  id: "php-generators-memory",
  description: "当用户要在 PHP 中使用 `yield` / `Generator` 做流式处理、降低大数组内存占用、读取大文件/CSV/分页数据，或排查 `yield` 与 `return` 行为差异时使用。",
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
      summary: "Eval cases for php-generators-memory.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
