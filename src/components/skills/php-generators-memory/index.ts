import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineReference,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
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
  checklist: [
    "当前内存问题是否来自全量数组、`file()` / `range()` / `fetchAll()`、或上游 API 一次性返回。",
    "调用方是否只需要单次顺序遍历；如果需要排序、分页跳转、随机访问或重复遍历，数组或专用集合可能更清晰。",
    "生成器内部是否避免累积无界状态，例如 `$items[] = ...`、缓存全部中间结果、拼接超大字符串。",
    "是否有 `try` / `finally` 释放文件句柄、数据库游标、锁或外部连接。",
    "是否保留了键名语义：需要定位来源行、页码、业务 ID 时使用 `yield $key => $value`。",
    "是否用 `memory_get_peak_usage()` 或等价 profiling 在目标数据量上验证，而不是只凭代码观感判断。",
    "PHPDoc 是否表达元素类型，例如 `\\Generator<int, User>` 或 `iterable<User>`，避免静态分析退回 `mixed`。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "先组大数组再返回",
      pass: "边生成边消费",
    }),
    defineAntiPattern({
      fail: "立刻转回数组",
      pass: "下游保持流式处理",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先确认内存问题是否来自全量数组、一次性读取大文件、fetchAll、range 或上游 API 全量返回。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "只有调用方能单次顺序消费且不需要随机访问 / 重复遍历时，才用生成器替代数组。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "持有文件句柄、游标、锁或网络连接的生成器必须用 `try` / `finally` 清理资源。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "逐行读取、分页展开和 `getReturn()` 示例读取 `generator-patterns`。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "当前内存热点、可流式处理边界和不适合生成器的消费需求。",
      "`iterable` / `\\Generator` 返回合同、键名语义和资源清理策略。",
      "峰值内存验证命令、PHPDoc 元素类型和回归风险。",
    ],
  }),
  references: [
    defineReference({
      id: "generator-patterns",
      source: new URL("./references/generator-patterns.md", import.meta.url),
      target: "references/generator-patterns.md",
      title: "PHP 生成器内存模式",
      summary: "大文件逐行读取、分页数据流式展开和 Generator::getReturn 示例。",
      loadWhen: "需要快速用 PHP generator 改写大数组或大文件处理时读取。",
    }),
  ],
});
