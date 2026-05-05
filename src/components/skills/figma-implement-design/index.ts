import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAsset,
  defineSkill,
} from "../../sdk";

export const figmaImplementDesignSkill = defineSkill({
  id: "figma-implement-design",
  fullName: "Figma 设计实现",
  description: "当用户提供 Figma 链接、要求 1:1 还原界面、或需要根据设计稿实现组件或页面时使用。",
  useCases: [
    "用户给出 Figma 链接，希望实现单个组件、模块或整页。",
    "需要依据 Figma Dev Mode 或 MCP 数据做像素级还原。",
    "需要把 Figma 输出映射到现有设计系统、组件库和路由约定。",
    "需要从设计稿提取图片、图标、布局、间距和状态变化。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
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
