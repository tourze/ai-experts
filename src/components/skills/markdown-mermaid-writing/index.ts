import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAsset,
  defineReference,
  defineSkill,
} from "../../sdk";
import { mdToPdfSkill } from "../md-to-pdf/index";

export const markdownMermaidWritingSkill = defineSkill({
  id: "markdown-mermaid-writing",
  fullName: "Markdown 与 Mermaid 写作",
  description: "当用户要用 Markdown 和 Mermaid 产出报告、技术文档、研究材料、决策记录或图表型说明时使用。该技能把文本化文档和文本化图示作为默认交付标准。",
  useCases: [
    "需要用纯文本格式维护文档，并希望图表可审阅、可 diff、可版本管理。",
    "用户要写技术方案、研究报告、状态汇报、PR 描述、决策记录或展示稿。",
    "文档中需要流程图、时序图、状态图、甘特图、ER 图等 Mermaid 图示。",
    "若不仅要源码，还要主题化 SVG 或终端 ASCII 成品图，继续使用 [pretty-mermaid](references/pretty-mermaid.md)。",
    "若最终要导出 PDF，可继续使用 `md-to-pdf`。",
  ],
  constraints: [
    "先确定文档类型，再选模板和图表；不要先画图后找地方塞进去。",
    "Markdown 与 Mermaid 都要走已有样式规范，避免同仓库里出现多套写法。",
    "图要服务于结论，不要为了“好看”而堆无效形状。",
    "复杂主题先拆成多个小图，不要把所有逻辑塞进一张图。",
  ],
  checklist: [
    "是否先选好了模板，而不是每次从空白页开始。",
    "是否读取了对应的样式指南，保证标题、列表、图表命名一致。",
    "图表是否真正回答了读者问题，而不是只是把文字搬成方框。",
    "交付前是否检查了 Mermaid 代码块的语法与节点命名。",
  ],
  relatedSkills: [
    {
      get id() {
        return mdToPdfSkill.id;
      },
      reason: "若最终要导出 PDF，可继续使用 `md-to-pdf`。",
    },
  ],
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
  ],
  assets: [
    defineAsset({
      id: "examples",
      source: new URL("./assets/examples/", import.meta.url),
      target: "assets/examples",
    })
  ],
});
