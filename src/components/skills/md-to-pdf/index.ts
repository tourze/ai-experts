import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk.js";

export const mdToPdfSkill = defineSkill({
  id: "md-to-pdf",
  description: "当用户要将 .md 文稿渲染成可打印 PDF 时使用，支持 Mermaid、KaTeX、代码块、表格、自定义 CSS、页边距和页码。",
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
  references: [
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for md-to-pdf.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
