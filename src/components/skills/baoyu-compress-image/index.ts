import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk";

export const baoyuCompressImageSkill = defineSkill({
  id: "baoyu-compress-image",
  fullName: "图片压缩器",
  description: "当用户要压缩图片、转成 WebP 或导出更小的 PNG/JPEG 时使用。",
  useCases: [
    "单张图片需要压成更小的 `webp`、`png` 或 `jpeg`。",
    "一整个目录里的说明图、插图需要批量减重。",
    "文章配图生成后，需要在提交前统一压缩。",
    "如果目标是重新设计图片内容而不是压缩体积，参考图片设计相关方法。",
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
      id: "main",
      entry: new URL("./scripts/main.mjs", import.meta.url),
      target: "scripts/main.mjs",
      runtime: "node",
      bundle: false,
      description: "Script main.mjs.",
    })
  ],
});
