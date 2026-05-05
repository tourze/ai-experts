import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const phpGeneratorsMemorySkill = defineSkill({
  id: "php-generators-memory",
  fullName: "PHP 生成器与内存优化",
  description: "当用户要在 PHP 中使用 `yield` / `Generator` 做流式处理、降低大数组内存占用、读取大文件/CSV/分页数据，或排查 `yield` 与 `return` 行为差异时使用。",
  useCases: [
    "代码正在构造大数组、一次性读取大文件、批量读取分页 API，导致内存上涨或触发 `memory_limit`。",
    "需要把生产者改成边生成边消费，例如 CSV 导入、日志扫描、导出流水线、分页接口聚合。",
    "需要解释 `yield`、`return`、`Generator`、`foreach`、`yield from` 和 `getReturn()` 的行为差异。",
    "需要判断某段代码应该返回 `array`、`iterable` 还是 `\\Generator`。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
