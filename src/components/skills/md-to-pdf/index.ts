import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk";

export const mdToPdfSkill = defineSkill({
  id: "md-to-pdf",
  fullName: "Markdown 转 PDF",
  description: "当用户要将 .md 文稿渲染成可打印 PDF 时使用，支持 Mermaid、KaTeX、代码块、表格、自定义 CSS、页边距和页码。",
  useCases: [
    "用户明确要求把 `.md` 渲染成 `.pdf`，而不是只生成 HTML 或截图。",
    "文档中包含 Mermaid、LaTeX 数学公式、代码块、表格或脚注。",
    "需要 A4、Letter、横向版式、页码、额外 CSS 等排版控制。",
    "若文档内容本身还没写好，先用 [markdown-mermaid-writing](../markdown-mermaid-writing/SKILL.md) 产出源文档。",
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
