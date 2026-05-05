import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAsset,
  defineReference,
  defineSkill,
} from "../../sdk";

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
      summary: "Reference material for algo-visualization.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "iron-rules",
      source: new URL("./references/iron-rules.md", import.meta.url),
      target: "references/iron-rules.md",
      title: "iron-rules.md",
      summary: "Reference material for algo-visualization.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "page-skeleton",
      source: new URL("./references/page-skeleton.md", import.meta.url),
      target: "references/page-skeleton.md",
      title: "page-skeleton.md",
      summary: "Reference material for algo-visualization.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "plantuml-ascii",
      source: new URL("./references/plantuml-ascii.md", import.meta.url),
      target: "references/plantuml-ascii.md",
      title: "plantuml-ascii.md",
      summary: "Reference material for algo-visualization.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "rationalizations",
      source: new URL("./references/rationalizations.md", import.meta.url),
      target: "references/rationalizations.md",
      title: "rationalizations.md",
      summary: "Reference material for algo-visualization.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "source",
      source: new URL("./references/SOURCE.md", import.meta.url),
      target: "references/SOURCE.md",
      title: "SOURCE.md",
      summary: "Reference material for algo-visualization.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "steps-shapes",
      source: new URL("./references/steps-shapes.md", import.meta.url),
      target: "references/steps-shapes.md",
      title: "steps-shapes.md",
      summary: "Reference material for algo-visualization.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
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
