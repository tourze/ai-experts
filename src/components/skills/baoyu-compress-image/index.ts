import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk";

export const baoyuCompressImageSkill = defineSkill({
  id: "baoyu-compress-image",
  description: "当用户要压缩图片、转成 WebP 或导出更小的 PNG/JPEG 时使用。",
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
      id: "main",
      entry: new URL("./scripts/main.mjs", import.meta.url),
      target: "scripts/main.mjs",
      runtime: "node",
      bundle: false,
      description: "Script main.mjs.",
    })
  ],
  references: [
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for baoyu-compress-image.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
