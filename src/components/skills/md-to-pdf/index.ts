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
import { procedureUse, mdToPdfKatexRender, mdToPdfMdToPdf, mdToPdfSetup } from "../../procedures/index";

import { markdownMermaidWritingSkill } from "../markdown-mermaid-writing/index";

export const mdToPdfSkill = defineSkill({
  id: "md-to-pdf",
  fullName: "Markdown 转 PDF",
  description: "当用户要将 .md 文稿渲染成可打印 PDF 时使用，支持 Mermaid、KaTeX、代码块、表格、自定义 CSS、页边距和页码。",
  useCases: [
    "用户明确要求把 `.md` 渲染成 `.pdf`，而不是只生成 HTML 或截图。",
    "文档中包含 Mermaid、LaTeX 数学公式、代码块、表格或脚注。",
    "需要 A4、Letter、横向版式、页码、额外 CSS 等排版控制。",
    "若文档内容本身还没写好，先用 `markdown-mermaid-writing` 产出源文档。",
  ],
  constraints: [
    "先检查依赖，再开始渲染；不要等到最后一步才发现 `pandoc` 或 `mmdc` 缺失。",
    "对大文档优先走默认管线，只有在确认依赖不足时才使用 `--no-mermaid` 或 `--no-math` 降级。",
    "自定义 CSS 只能叠加，不要覆盖掉基础排版到不可读。",
    "交付前至少抽查目录、图表、数学公式和分页效果。",
  ],
  checklist: [
    "是否已确认 `pandoc`、`mmdc`、`node + katex`、`playwright` 可用。",
    "是否按需设置 `--format`、`--margin`、`--header-footer` 和 `--css`。",
    "Mermaid 与数学公式是否都成功渲染，没有留下源代码片段。",
    "输出 PDF 是否抽查了首尾页、宽表格、长代码块和分页位置。",
    "若只是要生成 Word 或 PPT，请不要误用本技能。",
  ],
  relatedSkills: [
    {
      get id() {
        return markdownMermaidWritingSkill.id;
      },
      reason: "若文档内容本身还没写好，先用 `markdown-mermaid-writing` 产出源文档。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "不检查依赖",
      pass: "setup → render",
    }),
    defineAntiPattern({
      fail: "重型 CSS 覆盖",
      pass: "增量调整",
    }),
    defineAntiPattern({
      fail: "怪渲染器不修源",
      pass: "修源文件",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先确认源 `.md`、目标 `.pdf`、纸张格式、页边距、页眉页脚、CSS 和是否包含 Mermaid/数学公式。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "先调用 `md-to-pdf-setup` 做依赖检查；需要排版细节时读取 README 和示例文档资源。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "用 `md-to-pdf-md-to-pdf` 执行渲染；只有依赖缺失且用户接受降级时才使用无 Mermaid 或无数学公式路径。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "交付前抽查首尾页、目录、宽表格、长代码块、Mermaid、数学公式和分页位置。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "依赖检查结果、渲染参数、源文件路径和输出 PDF 路径。",
      "Mermaid/KaTeX/表格/代码块/分页抽查结果，以及是否发生降级渲染。",
      "失败时的缺失依赖、源 Markdown 修复建议和可重跑命令。",
    ],
  }),
  procedures: [
    procedureUse(mdToPdfKatexRender),
    procedureUse(mdToPdfMdToPdf),
    procedureUse(mdToPdfSetup),
  ],
  references: [
    defineReference({
      id: "test-document",
      source: new URL("./references/test-document.md", import.meta.url),
      target: "references/test-document.md",
      title: "Feature Test Document",
      summary: "覆盖 Mermaid、数学公式、表格、代码块、脚注和分页的 Markdown 示例。",
      loadWhen: "需要验证渲染管线或构造覆盖多种 Markdown 特性的样例输入时读取。",
    }),
  ],
});
