import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const pptGenerateSkill = defineSkill({
  id: "ppt-generate",
  fullName: "PPT 端到端生成",
  description: "当用户要从零生成演示文稿、从文档/主题生成 PPT、或要求 AI 端到端制作幻灯片时使用。",
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
      summary: "Reference material for ppt-generate.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "page-types",
      source: new URL("./references/page-types.md", import.meta.url),
      target: "references/page-types.md",
      title: "page-types.md",
      summary: "Reference material for ppt-generate.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "ppt-visual",
      source: new URL("./references/ppt-visual.md", import.meta.url),
      target: "references/ppt-visual.md",
      title: "ppt-visual.md",
      summary: "Reference material for ppt-generate.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "pptx",
      source: new URL("./references/pptx.md", import.meta.url),
      target: "references/pptx.md",
      title: "pptx.md",
      summary: "Reference material for ppt-generate.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "spec-lock-template",
      source: new URL("./references/spec-lock-template.md", import.meta.url),
      target: "references/spec-lock-template.md",
      title: "spec-lock-template.md",
      summary: "Reference material for ppt-generate.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for ppt-generate.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
