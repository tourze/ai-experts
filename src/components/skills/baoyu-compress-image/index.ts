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
  constraints: [
    "使用 Node.js 直接运行 `scripts/main.mjs`。",
    "`--output` 只支持单文件输入；目录批处理时禁止传自定义输出路径。",
    "默认 `--keep=false`，表示成功转码后删除原文件；只有显式加 `--keep` 才保留源文件。",
    "目录模式默认不递归；需要跨子目录时必须显式加 `--recursive`。",
    "压缩后端按“系统工具优先、`sharp` 兜底”顺序选择；如果没有任何后端，先补依赖再运行。",
  ],
  checklist: [
    "已确认输入是单文件还是目录。",
    "目录模式下没有误传 `--output`。",
    "`quality` 在 `0-100` 范围内。",
    "选择的输出格式与后缀一致：`webp`、`png`、`jpeg`。",
    "若未传 `--keep`，已确认源文件会在成功转码后删除。",
    "若需要链到文章配图流程，先做图片生成再做统一压缩。",
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
