import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAsset,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk";

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
      id: "baoyu-article-illustrator-build-batch",
      entry: new URL("./scripts/baoyu-article-illustrator-build-batch.mjs", import.meta.url),
      target: "scripts/baoyu-article-illustrator-build-batch.mjs",
      runtime: "node",
      bundle: false,
      description: "Script baoyu-article-illustrator-build-batch.mjs.",
    }),
    defineSkillScript({
      id: "concept-to-image-render-to-image",
      entry: new URL("./scripts/concept-to-image-render_to_image.mjs", import.meta.url),
      target: "scripts/concept-to-image-render_to_image.mjs",
      runtime: "node",
      bundle: false,
      description: "Script concept-to-image-render_to_image.mjs.",
    }),
    defineSkillScript({
      id: "concept-to-video-add-audio",
      entry: new URL("./scripts/concept-to-video-add_audio.mjs", import.meta.url),
      target: "scripts/concept-to-video-add_audio.mjs",
      runtime: "node",
      bundle: false,
      description: "Script concept-to-video-add_audio.mjs.",
    }),
    defineSkillScript({
      id: "concept-to-video-render-video",
      entry: new URL("./scripts/concept-to-video-render_video.mjs", import.meta.url),
      target: "scripts/concept-to-video-render_video.mjs",
      runtime: "node",
      bundle: false,
      description: "Script concept-to-video-render_video.mjs.",
    })
  ],
  assets: [
    defineAsset({
      id: "concept-to-image-template",
      source: new URL("./assets/concept-to-image-template.html", import.meta.url),
      target: "assets/concept-to-image-template.html",
    })
  ],
});
