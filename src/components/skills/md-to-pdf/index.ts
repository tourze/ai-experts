import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk";
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
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  scriptRoots: [
    defineSkillScriptRoot({
      source: new URL("./scripts/", import.meta.url),
      target: "scripts",
    }),
  ],
  scripts: [
    defineSkillScript({
      id: "katex-render",
      entry: new URL("./scripts/katex_render.mjs", import.meta.url),
      target: "scripts/katex_render.mjs",
      runtime: "node",
      bundle: false,
      description: "Script katex_render.mjs.",
    }),
    defineSkillScript({
      id: "md-to-pdf",
      entry: new URL("./scripts/md_to_pdf.py", import.meta.url),
      target: "scripts/md_to_pdf.py",
      runtime: "python3",
      bundle: false,
      description: "Script md_to_pdf.py.",
    }),
    defineSkillScript({
      id: "setup",
      entry: new URL("./scripts/setup.mjs", import.meta.url),
      target: "scripts/setup.mjs",
      runtime: "node",
      bundle: false,
      description: "Script setup.mjs.",
    })
  ],
});
