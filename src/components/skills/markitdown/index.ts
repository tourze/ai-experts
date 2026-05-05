import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAsset,
  defineReference,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk.js";

export const markitdownSkill = defineSkill({
  id: "markitdown",
  description: "当用户要用 MarkItDown 把 Office、图片、HTML、音频或其他源文件抽取成 .md 文本时使用，适合批量转换和 AI 图片描述增强。",
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
      id: "batch-convert",
      entry: new URL("./scripts/batch_convert.mjs", import.meta.url),
      target: "scripts/batch_convert.mjs",
      runtime: "node",
      bundle: false,
      description: "Script batch_convert.mjs.",
    }),
    defineSkillScript({
      id: "convert-literature",
      entry: new URL("./scripts/convert_literature.mjs", import.meta.url),
      target: "scripts/convert_literature.mjs",
      runtime: "node",
      bundle: false,
      description: "Script convert_literature.mjs.",
    }),
    defineSkillScript({
      id: "convert-with-ai",
      entry: new URL("./scripts/convert_with_ai.mjs", import.meta.url),
      target: "scripts/convert_with_ai.mjs",
      runtime: "node",
      bundle: false,
      description: "Script convert_with_ai.mjs.",
    }),
    defineSkillScript({
      id: "markitdown-runtime",
      entry: new URL("./scripts/markitdown_runtime.mjs", import.meta.url),
      target: "scripts/markitdown_runtime.mjs",
      runtime: "node",
      bundle: false,
      description: "Script markitdown_runtime.mjs.",
    })
  ],
  references: [
    defineReference({
      id: "api-reference",
      source: new URL("./references/api_reference.md", import.meta.url),
      target: "references/api_reference.md",
      title: "api_reference.md",
      summary: "Reference material for markitdown.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "file-formats",
      source: new URL("./references/file_formats.md", import.meta.url),
      target: "references/file_formats.md",
      title: "file_formats.md",
      summary: "Reference material for markitdown.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for markitdown.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
  assets: [
    defineAsset({
      id: "example-usage",
      source: new URL("./assets/example_usage.md", import.meta.url),
      target: "assets/example_usage.md",
    })
  ],
});
