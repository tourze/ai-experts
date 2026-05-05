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
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for obsidian-bases.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
