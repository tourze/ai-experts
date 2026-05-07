import {
  InvocationPolicy,
  Platform,
  defineAsset,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { procedureUse, canvasDesignBaoyuArticleIllustratorBuildBatch, canvasDesignConceptToImageRenderToImage, canvasDesignConceptToVideoAddAudio, canvasDesignConceptToVideoRenderVideo } from "../../procedures/index";

export const canvasDesignSkill = defineSkill({
  id: "canvas-design",
  fullName: "画布设计",
  description: "当用户要做海报、封面、艺术化静态画面、editorial poster、visual composition 或一页高完成度视觉作品时使用。",
  useCases: [
    "需要海报、封面、单页视觉稿、展览感静态作品。",
    "用户要的是“设计作品”而不是流程图、截图或动画。",
    "需要先写设计哲学，再把哲学表达成最终画面。",
    "如果目标是结构化信息图，参考信息图设计方法。",
    "如果目标是动画或解释视频，参考视频生成工具。",
  ],
  constraints: [
    "整个流程只产出三类文件：设计哲学 `.md`、最终 `.png`、最终 `.pdf`。",
    "先写设计哲学，再开始画面表达；不能跳过第一步直接做图。",
    "设计哲学不是模板说明书，而是审美方向、空间秩序、配色语言和工艺标准。",
    "输出必须是单页作品，默认 90% 视觉、10% 必要文字。",
    "字体优先使用本目录 `canvas-fonts/` 中已有字体；需要额外字体时，只能为了作品质量引入，不能随手套默认系统字。",
    "严禁复刻现实艺术家或品牌现成视觉语言；只能做原创重构。",
  ],
  checklist: [
    "设计哲学已落盘，且不是空泛口号。",
    "最终成品只有一页，元素没有越界或互相覆盖。",
    "文字是视觉元素的一部分，不是大段说明文。",
    "使用的字体、色彩、纹理和留白都服务于同一审美方向。",
    "导出的成品文件和哲学文件同时存在。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "跳过哲学直接画",
      pass: "先写 philosophy",
    }),
    defineAntiPattern({
      fail: "通用 AI 审美",
      pass: "原创重构",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先产出 philosophy.md，包含运动/流派名称、4-6 段审美阐述，以及空间、色彩、节奏、材质、排版和工艺约束。",
      "确认画布尺寸、边距、主视觉、次级视觉、字体组合、字号层级和导出格式。",
      "优先使用 canvas-fonts 中的字体；按作品气质选择 InstrumentSans、IBMPlexSerif、JetBrainsMono、GeistMono、BigShoulders 或 Tektur 等字族。",
      "把设计哲学转成单页成品，默认 90% 视觉、10% 必要文字，避免说明文堆叠。",
      "需要 PNG 时用 concept-to-image 渲染；需要视频时先渲染帧序列再用 ffmpeg 合成和加音频。",
      "最后确认 philosophy.md 与最终 png/pdf/video 同时存在，元素不越界、不重叠且没有复刻现实品牌或艺术家。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "philosophy.md：审美方向、空间秩序、配色语言、材质、排版和工艺标准。",
      "单页视觉成品：尺寸、边距、主/次视觉、字体层级、色彩与导出格式。",
      "渲染产物、使用的 procedure、字体选择、质量检查和原创性说明。",
    ],
  }),
  procedures: [
    procedureUse(canvasDesignBaoyuArticleIllustratorBuildBatch),
    procedureUse(canvasDesignConceptToImageRenderToImage),
    procedureUse(canvasDesignConceptToVideoAddAudio),
    procedureUse(canvasDesignConceptToVideoRenderVideo),
  ],
  assets: [
    defineAsset({
      id: "concept-to-image-template",
      source: new URL("./assets/concept-to-image-template.html", import.meta.url),
      target: "assets/concept-to-image-template.html",
    })
  ],
});
