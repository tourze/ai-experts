import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const researchNoteWrapSkill = defineSkill({
  id: "research-note-wrap",
  description: "当用户要把当前调研或分析会话压成高密度 Markdown 结论笔记时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "anti-patterns",
      source: new URL("./references/anti-patterns.md", import.meta.url),
      target: "references/anti-patterns.md",
      title: "anti-patterns.md",
      summary: "Reference material for research-note-wrap.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "citation-validator",
      source: new URL("./references/citation-validator.md", import.meta.url),
      target: "references/citation-validator.md",
      title: "citation-validator.md",
      summary: "Reference material for research-note-wrap.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "output-template",
      source: new URL("./references/output-template.md", import.meta.url),
      target: "references/output-template.md",
      title: "output-template.md",
      summary: "Reference material for research-note-wrap.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for research-note-wrap.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
