import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAsset,
  defineReference,
  defineSkill,
} from "../../sdk";

export const markdownMermaidWritingSkill = defineSkill({
  id: "markdown-mermaid-writing",
  fullName: "Markdown 与 Mermaid 写作",
  description: "当用户要用 Markdown 和 Mermaid 产出报告、技术文档、研究材料、决策记录或图表型说明时使用。该技能把文本化文档和文本化图示作为默认交付标准。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "diagrams",
      source: new URL("./references/diagrams/", import.meta.url),
      target: "references/diagrams",
      title: "diagrams",
      summary: "Reference material for markdown-mermaid-writing.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "markdown-style-guide",
      source: new URL("./references/markdown_style_guide.md", import.meta.url),
      target: "references/markdown_style_guide.md",
      title: "markdown_style_guide.md",
      summary: "Reference material for markdown-mermaid-writing.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "mermaid-style-guide",
      source: new URL("./references/mermaid_style_guide.md", import.meta.url),
      target: "references/mermaid_style_guide.md",
      title: "mermaid_style_guide.md",
      summary: "Reference material for markdown-mermaid-writing.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "pretty-mermaid",
      source: new URL("./references/pretty-mermaid.md", import.meta.url),
      target: "references/pretty-mermaid.md",
      title: "pretty-mermaid.md",
      summary: "Reference material for markdown-mermaid-writing.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for markdown-mermaid-writing.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
  assets: [
    defineAsset({
      id: "examples",
      source: new URL("./assets/examples/", import.meta.url),
      target: "assets/examples",
    })
  ],
});
