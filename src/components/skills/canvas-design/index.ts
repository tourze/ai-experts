import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAsset,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";
import { scriptUse } from "../../scripts/index";

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
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  scripts: [
    scriptUse("canvas-design-baoyu-article-illustrator-build-batch"),
    scriptUse("canvas-design-concept-to-image-render-to-image"),
    scriptUse("canvas-design-concept-to-video-add-audio"),
    scriptUse("canvas-design-concept-to-video-render-video"),
  ],
  assets: [
    defineAsset({
      id: "concept-to-image-template",
      source: new URL("./assets/concept-to-image-template.html", import.meta.url),
      target: "assets/concept-to-image-template.html",
    })
  ],
});
