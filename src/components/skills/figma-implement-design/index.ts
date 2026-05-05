import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAsset,
  defineSkill,
} from "../../sdk";
import { designSystemPatternsSkill } from "../design-system-patterns/index";
import { frontendDesignReviewSkill } from "../frontend-design-review/index";
import { shadcnUiSkill } from "../shadcn-ui/index";

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
  constraints: [
    "没有设计上下文就不要开写。先拿结构化设计数据，再拿截图做对照。",
    "先还原布局、层级和状态，再做动效和工程抽象。",
    "不要把 Figma 自动生成代码原样落库；必须翻译成项目现有规范。",
    "设计稿资产以 Figma 提供的内容为准，不要私自替换为别的图标包或占位图。",
    "遇到设计系统已有组件时先复用，再决定是否新建。",
    "实现完成后，用 `frontend-design-review` 复核视觉与交互一致性。",
  ],
  checklist: [
    "[ ] 已拿到设计上下文和截图，而不是只看链接标题。",
    "[ ] 已确认目标节点范围，避免整页与局部混淆。",
    "[ ] 已复用现有组件、token、图标包装器和布局约定。",
    "[ ] 默认态、交互态、异常态都与设计稿一致。",
    "[ ] 所有导入资产都来自 Figma 返回结果或项目既有资源。",
    "[ ] 实现后已在真实断点下复查间距、换行和溢出。",
  ],
  relatedSkills: [
    {
      get id() {
        return shadcnUiSkill.id;
      },
      reason: "`shadcn-ui`。",
    },
    {
      get id() {
        return frontendDesignReviewSkill.id;
      },
      reason: "实现完成后，用 `frontend-design-review` 复核视觉与交互一致性。",
    },
    {
      get id() {
        return designSystemPatternsSkill.id;
      },
      reason: "`design-system-patterns`",
    },
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
