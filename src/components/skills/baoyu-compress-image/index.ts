import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
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
    "使用 Node.js 直接运行 `baoyu-compress-image-main` procedure。",
    "`--output` 只支持单文件输入；目录批处理时禁止传自定义输出路径。",
    "默认保留源文件；只有用户明确确认源文件可删除后才传 `--delete-original`。",
    "默认不会覆盖已存在的输出文件；只有确认目标可替换后才传 `--overwrite`。",
    "目录模式默认不递归；需要跨子目录时必须显式加 `--recursive`。",
    "压缩后端按“系统工具优先、`sharp` 兜底”顺序选择；如果没有任何后端，先补依赖再运行。",
  ],
  checklist: [
    "已确认输入是单文件还是目录。",
    "目录模式下没有误传 `--output`。",
    "`quality` 在 `0-100` 范围内。",
    "选择的输出格式与后缀一致：`webp`、`png`、`jpeg`。",
    "若传 `--delete-original`，已确认源文件会在成功转码后删除。",
    "若传 `--overwrite`，已确认目标输出文件可替换。",
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
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先确认输入是单文件还是目录、目标格式、quality、是否递归和是否需要保留源文件。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "调用 baoyu-compress-image-main；单文件可传 output，目录批处理禁止传自定义 output。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "默认保留原文件且不覆盖输出；只有用户明确确认删除或替换时才传 --delete-original / --overwrite。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "目录默认不递归，需要跨子目录时显式传 --recursive；输出格式必须与后缀一致。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "压缩后检查 input、output、ratio 和失败项；全部失败时按错误处理，不输出空摘要。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "输入类型、输出格式、quality、keep/recursive/output 参数和实际执行的 procedure。",
      "每个文件的 input、output、压缩比例、后端选择和失败原因。",
      "源文件删除/输出覆盖风险、批处理限制和需要补依赖的压缩后端问题。",
    ],
  }),
  procedures: [
    procedureUse(baoyuCompressImageMain, {
      label: "压缩图片",
      when: "需要将单张或一批图片压缩为更小的体积或转换格式。",
      reason: "自动选择最优压缩后端完成转码，避免手写 imagemagick/ffmpeg 命令链。",
    }),
  ],
});
