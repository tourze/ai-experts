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
  constraints: [
    "只有调用方能顺序消费数据、且不需要随机访问或多次遍历时，才用 `yield` 替代数组。",
    "含 `yield` 的函数被调用时返回 `\\Generator` 对象；函数体到迭代开始才执行。不要把它当成普通返回值直接输出或传给只接受数组的 API。",
    "不要在下游立刻 `iterator_to_array()`，除非数据量有明确上界；这会把内存优势重新吃掉。",
    "持有文件句柄、游标、锁或网络连接的生成器必须用 `try` / `finally` 清理资源，兼容调用方提前 `break`。",
    "`return` 在生成器里表示最终返回值，只能通过 `Generator::getReturn()` 读取，不会成为 `foreach` 的元素。",
    "对外 API 优先标注 `iterable` 表达消费契约；需要暴露 `send()`、`throw()`、`getReturn()` 等生成器能力时才返回 `\\Generator`。",
    "与 ORM 大批量写入、`flush()` / `clear()`、事务边界相关的问题，优先交给对应框架的批处理 skill，不在语言层硬套生成器。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
