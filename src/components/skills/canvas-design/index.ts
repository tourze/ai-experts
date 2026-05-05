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
