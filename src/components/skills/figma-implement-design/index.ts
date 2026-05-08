import {
  InvocationPolicy,
  Platform,
  defineAsset,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
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
    "已拿到设计上下文和截图，而不是只看链接标题。",
    "已确认目标节点范围，避免整页与局部混淆。",
    "已复用现有组件、token、图标包装器和布局约定。",
    "默认态、交互态、异常态都与设计稿一致。",
    "所有导入资产都来自 Figma 返回结果或项目既有资源。",
    "实现后已在真实断点下复查间距、换行和溢出。",
  ],
  relatedSkills: [
    {
      get id() {
        return shadcnUiSkill.id;
      },
      reason: "设计稿落地到 shadcn/ui 组件、主题或配置时联动。",
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
      reason: "需要把 Figma token、组件状态和视觉语言映射到项目设计系统时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "复制 Figma 生成代码",
      pass: "翻译到项目 token",
    }),
    defineAntiPattern({
      fail: "凭截图猜布局",
      pass: "先拿结构化数据",
    }),
    defineAntiPattern({
      fail: "只做默认态",
      pass: "状态全覆盖",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先解析 fileKey/nodeId 或读取桌面当前选区，确认目标节点范围，避免整页和局部混淆。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "先获取结构化 design context，再获取 screenshot 做视觉对照；没有设计上下文不开始实现。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "下载 Figma 返回的图片/SVG 资产，并映射到项目组件、token、图标包装器、样式体系和路由约定。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "先还原布局、层级、默认/hover/focus/disabled/loading/异常态，再做动效和工程抽象；完成后用 frontend-design-review 复核。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "目标 Figma 节点、结构化设计数据、截图对照、导入资产和实现范围。",
      "项目组件/token 映射、状态覆盖、响应式断点、间距/换行/溢出复查结果。",
      "实现文件、验证方式、与设计稿偏差和需要设计确认的问题。",
    ],
  }),
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
