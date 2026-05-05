import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";

export const obsidianBasesSkill = defineSkill({
  id: "obsidian-bases",
  fullName: "Obsidian Bases",
  description: "当用户要新建、修复或重构 Obsidian Bases 的 `.base` 文件时使用。",
  useCases: [
    "用户要新建、修复或重构 `.base` 文件。",
    "用户要定义 Bases 的 `filters`、`formulas`、`properties`、`summaries` 或 `views`。",
    "用户要做 table / list / cards / map 视图切换，或想把 Base 嵌入笔记。",
    "用户要把某个查询逻辑从 Dataview 风格思路改写成官方 Bases 语法。",
    "如果用户要通过命令行查询或操作 Base 条目，使用 Obsidian CLI 工具。",
  ],
  constraints: [
    "`.base` 文件必须是合法 YAML。Bases 没有 Dataview / SQL 风格的 `from`、`source` 段，结果集完全由 `filters` 决定。",
    "全局 `filters` 和视图级 `filters` 在求值时会用 `AND` 拼接；不要把同一条件在两层重复堆叠。",
    "属性分三类：笔记属性 `note.foo` 或简写 `foo`、文件属性 `file.*`、公式属性 `formula.*`。",
    "日期相减返回的是“毫秒差”，不是带 `.days` / `.hours` 字段的 Duration 对象；只有显式用 `duration(\"1d\")` 这类值时才是在做 duration 运算。",
    "`this.file.*` 的含义取决于展示位置：主内容区指向 base 文件本身；嵌入时指向嵌入它的文件；侧边栏里指向主内容区活动文件。",
    "`file.backlinks` 性能较重，且 Vault 变化后不会自动刷新；能用 `file.hasLink(this.file)` 做反向查询时，优先用后者。",
    "`map` 视图需要额外安装官方 Maps 插件；不要把 map 当成默认可用布局。",
    "常用函数速查见 [FUNCTIONS_REFERENCE.md](references/FUNCTIONS_REFERENCE.md)，完整能力以官方文档为准。",
  ],
  checklist: [
    "文件后缀是否为 `.base`，并且整份 YAML 已通过基本语法校验。",
    "有没有混入 `from`、`source`、`where` 这类 Dataview / SQL 心智残留。",
    "`formula.X` 在 `order`、`properties`、`summaries` 里被引用前，是否已在 `formulas` 中定义。",
    "日期计算是否按“毫秒差”处理，而不是继续写 `.days` / `.hours` 这类旧语义。",
    "过滤表达式与公式字符串是否正确加引号，避免 YAML 因 `:`、引号嵌套或运算符而解析失败。",
    "使用 `this.file.*` 时，是否确认了 Base 当前是在主区、嵌入块还是侧栏。",
    "需要反链语义时，是否优先考虑 `file.hasLink(this.file)` 而不是直接依赖 `file.backlinks`。",
    "使用 `map` 视图时，是否已明确说明需要安装 Maps 插件。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "Dataview 心智残留：Bases 没有 `from` / `where`；整个文件解析失败。",
      pass: "用 filters",
    }),
    defineAntiPattern({
      fail: "日期当 Duration 对象：减法返回毫秒数，没有 `.days` 字段。",
      pass: "显式毫秒转换",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "functions-reference",
      source: new URL("./references/FUNCTIONS_REFERENCE.md", import.meta.url),
      target: "references/FUNCTIONS_REFERENCE.md",
      title: "FUNCTIONS_REFERENCE.md",
      summary: "Reference material for obsidian-bases.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "obsidian-cli",
      source: new URL("./references/obsidian-cli.md", import.meta.url),
      target: "references/obsidian-cli.md",
      title: "obsidian-cli.md",
      summary: "Reference material for obsidian-bases.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
