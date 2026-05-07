import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { procedureUse, baoyuCompressImageMain } from "../../procedures/index";

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
    "使用 Node.js 直接运行 `procedure baoyu-compress-image-main`。",
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
  antiPatterns: [
    defineAntiPattern({
      fail: "误删源文件",
      pass: "--keep 显式",
    }),
    defineAntiPattern({
      fail: "批处理传 --output",
      pass: "单/批分清",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认输入是单文件还是目录、目标格式、quality、是否递归和是否需要保留源文件。",
      "调用 baoyu-compress-image-main；单文件可传 output，目录批处理禁止传自定义 output。",
      "默认 keep=false，成功转码后会删除原文件；只有用户明确要求保留时才传 --keep。",
      "目录默认不递归，需要跨子目录时显式传 --recursive；输出格式必须与后缀一致。",
      "压缩后检查 input、output、ratio 和失败项；全部失败时按错误处理，不输出空摘要。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "输入类型、输出格式、quality、keep/recursive/output 参数和实际执行的 procedure。",
      "每个文件的 input、output、压缩比例、后端选择和失败原因。",
      "源文件删除风险、批处理限制和需要补依赖的压缩后端问题。",
    ],
  }),
  tools: [],
  procedures: [
    procedureUse(baoyuCompressImageMain),
  ],
});
