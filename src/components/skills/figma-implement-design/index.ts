import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAsset,
  defineReference,
  defineSkill,
} from "../../sdk";

export const figmaImplementDesignSkill = defineSkill({
  id: "figma-implement-design",
  fullName: "Figma 设计实现",
  description: "当用户提供 Figma 链接、要求 1:1 还原界面、或需要根据设计稿实现组件或页面时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for figma-implement-design.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
  assets: [
    defineAsset({
      id: "figma-small",
      source: new URL("./assets/figma-small.svg", import.meta.url),
      target: "assets/figma-small.svg",
    }),
    defineAsset({
      id: "figma",
      source: new URL("./assets/figma.png", import.meta.url),
      target: "assets/figma.png",
    }),
    defineAsset({
      id: "icon",
      source: new URL("./assets/icon.svg", import.meta.url),
      target: "assets/icon.svg",
    })
  ],
});
