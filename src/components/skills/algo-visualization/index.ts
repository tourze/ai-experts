import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAsset,
  defineReference,
  defineSkill,
} from "../../sdk";
import { canvasDesignSkill } from "../canvas-design/index";

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
    "只在本 skill 的适用场景内使用；任务不匹配时先澄清或转向更合适的 skill。",
    "执行时遵循正文中的流程、红线、检查清单和必要参考资料，不用未经验证的假设替代证据。",
    "不适用场景：静态图导出（PNG/SVG）转 `canvas-design`；动画视频使用视频生成工具；业务数据图表转 `data-visualization`；流程图/时序图/状态图转 `markdown-mermaid-writing`。",
  ],
  relatedSkills: [
    {
      get id() {
        return canvasDesignSkill.id;
      },
      reason: "一页艺术化静态画面 → `canvas-design`。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
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
