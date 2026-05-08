import {
  InvocationPolicy,
  Platform,
  defineAsset,
  defineReference,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { canvasDesignSkill } from "../canvas-design/index";
import { dataVisualizationSkill } from "../data-visualization/index";
import { markdownMermaidWritingSkill } from "../markdown-mermaid-writing/index";

export const algoVisualizationSkill = defineSkill({
  id: "algo-visualization",
  fullName: "交互式算法可视化教学页",
  description: "当用户要把数据结构、算法或代码执行过程做成交互式教学可视化页面时使用。普通数据图表或流程图不适用。",
  useCases: [
    "PDF / 教材 → 知识点讲解页面（数据结构、算法）。",
    "主题（\"演示快排\"、\"做个堆动画\"）→ 教学加可视化页面。",
    "代码 / 算法 → 逐步执行动画，每步标注当前执行行。",
    "概念对比（BST vs Heap、BFS vs DFS）→ 并排 SVG。",
    "输出物：**单文件 HTML**，CSS/JS 内联，可直接打开。",
  ],
  constraints: [
    "输出必须是单文件 HTML，CSS/JS 内联，可直接打开；普通静态图、业务数据图表和流程图不走本 skill。",
    "正文为主：80% 以上是 `<p>` 与 `<h2>/<h3>`，callout 整页不超过 4 个。",
    "SVG 不重叠：相邻圆心距至少 56px，父子 y 间距至少 60px，viewBox 高度按最大节点 y+r+40 计算。",
    "涉及代码时每个 step 必须有 `line` 字段，代码面板和动画双面板联动，并在 render 末尾调用高亮函数。",
    "每个概念配 SVG，节奏是讲完概念、紧跟 SVG、再接文字；整页静态 SVG 数不少于交互动画数。",
    "assets 三件套必须原样读取；boilerplate.js 只能按块摘取，不能整文件复制导致重复声明 `steps`。",
  ],
  relatedSkills: [
    {
      get id() {
        return canvasDesignSkill.id;
      },
      reason: "用户要的是一页艺术化静态画面、PNG/SVG 或非交互式视觉稿时联动。",
    },
    {
      get id() {
        return dataVisualizationSkill.id;
      },
      reason: "用户要的是业务数据图表、指标看板或统计可视化，而不是算法教学页时联动。",
    },
    {
      get id() {
        return markdownMermaidWritingSkill.id;
      },
      reason: "用户要的是流程图、时序图、状态图或 Mermaid 文档图示时联动。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先判断输入类型：PDF/教材、无代码算法主题、含代码执行过程或概念对比，并选择对应页面骨架。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "按来源脉络组织内容：有 PDF 时顺原文页面和例子，无来源时按是什么、怎么工作、实例、总结。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "先读取 iron-rules，再读取 page-skeleton、steps-shapes、rationalizations；需要堆示例时读取 heap_overview。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "根据数据形态选 JS 模板：数组+完全二叉树用 A，不规则树用 B，纯数组用 C；代码联动必须带 line 和 hlLines。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "嵌入 assets 时按块摘取工具函数、模板、可选高亮、键盘导航和自己的 steps，避免重复顶层变量。",
      }),
      defineWorkflowStep({
        id: "step-6",
        label: "生成后检查 SVG 间距、viewBox、高亮联动、静态/交互比例、可直接打开和来源引用。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "单文件 HTML、输入类型判断、骨架选择、JS 模板选择和来源脉络说明。",
      "概念正文、静态 SVG、交互 steps、代码联动 line 字段、颜色语义和键盘导航。",
      "自检结果：铁律合规、SVG 不重叠、viewBox 正确、无重复 `steps` 声明、引用 SOURCE。",
    ],
  }),
  references: [
    defineReference({
      id: "heap-overview",
      source: new URL("./references/heap_overview.html", import.meta.url),
      target: "references/heap_overview.html",
      title: "heap_overview.html",
      summary: "堆数据结构可视化可运行 HTML 示例。",
      loadWhen: "需要生成堆相关的交互式可视化教学页面时读取。",
    }),
    defineReference({
      id: "iron-rules",
      source: new URL("./references/iron-rules.md", import.meta.url),
      target: "references/iron-rules.md",
      title: "iron-rules.md",
      summary: "交互式可视化页面设计铁律：交互原则与不可违反的约束。",
      loadWhen: "需要确保可视化页面满足交互式教学核心规范时读取。",
    }),
    defineReference({
      id: "page-skeleton",
      source: new URL("./references/page-skeleton.md", import.meta.url),
      target: "references/page-skeleton.md",
      title: "page-skeleton.md",
      summary: "交互式算法可视化页面的 HTML 骨架结构与基本模板。",
      loadWhen: "需要构建可视化页面基础 HTML 结构时读取。",
    }),
    defineReference({
      id: "plantuml-ascii",
      source: new URL("./references/plantuml-ascii.md", import.meta.url),
      target: "references/plantuml-ascii.md",
      title: "plantuml-ascii.md",
      summary: "PlantUML 与 ASCII 图形转换工具及使用指南。",
      loadWhen: "需要将 PlantUML 图转换为纯文本 ASCII 图形时读取。",
    }),
    defineReference({
      id: "rationalizations",
      source: new URL("./references/rationalizations.md", import.meta.url),
      target: "references/rationalizations.md",
      title: "rationalizations.md",
      summary: "可视化开发中的常见合理化借口与现实后果。",
      loadWhen: "模型或用户想跳过某些规范、走捷径完成可视化时读取。",
    }),
    defineReference({
      id: "source",
      source: new URL("./references/SOURCE.md", import.meta.url),
      target: "references/SOURCE.md",
      title: "SOURCE.md",
      summary: "Skill 参考资料与资产来源说明及引用规范。",
      loadWhen: "需要了解本 skill 资料出处或引用规则时读取。",
    }),
    defineReference({
      id: "steps-shapes",
      source: new URL("./references/steps-shapes.md", import.meta.url),
      target: "references/steps-shapes.md",
      title: "steps-shapes.md",
      summary: "算法步骤可视化动画设计与 SVG 形状绘制规范。",
      loadWhen: "需要设计算法分步执行动画或逐步标注当前执行行时读取。",
    }),
  ],
  assets: [
    defineAsset({
      id: "animation-html",
      source: new URL("./assets/animation-html.html", import.meta.url),
      target: "assets/animation-html.html",
    }),
    defineAsset({
      id: "base",
      source: new URL("./assets/base.css", import.meta.url),
      target: "assets/base.css",
    }),
    defineAsset({
      id: "boilerplate",
      source: new URL("./assets/boilerplate.js", import.meta.url),
      target: "assets/boilerplate.js",
    })
  ],
});
