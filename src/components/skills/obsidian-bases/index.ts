import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
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
