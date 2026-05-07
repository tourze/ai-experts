import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { procedureUse, webPerformanceDiagnosisAnalyze } from "../../procedures/index";

import { bundleOptimizationSkill } from "../bundle-optimization/index";
import { frontendDesignReviewSkill } from "../frontend-design-review/index";
import { reactPerformanceSkill } from "../react-performance/index";
import { reactServerComponentsSkill } from "../react-server-components/index";
import { responsiveDesignSkill } from "../responsive-design/index";

export const webPerformanceDiagnosisSkill = defineSkill({
  id: "web-performance-diagnosis",
  fullName: "Web 性能诊断",
  description: "当用户要系统诊断 Web 前端性能瓶颈、修复或优化 Core Web Vitals（LCP/INP/CLS）、建立性能预算、做跨层（网络→渲染→运行时）性能分析、审计网站质量、消除请求瀑布流或解决 hydration/浏览器渲染模式问题时使用。",
  useCases: [
    "性能回归排查、跨层瓶颈定位、性能预算建立",
    "LCP/INP/CLS 单项指标深度优化与反模式修复",
    "质量审计（性能 / a11y / SEO / best practices）",
    "请求瀑布流消除、Suspense 边界优化",
    "浏览器渲染模式（hydration / resource hints / content-visibility / 事件监听）",
  ],
  constraints: [
    "先看观测数据再下钻代码；禁止不看数据直接猜瓶颈。",
    "先区分实验室数据和真实用户数据：`Lighthouse` 用来定位，`field data` 用来验收。",
    "区分场景：首屏 / 后续路由 / 交互 / 长会话，不混用结论。",
    "区分 React 渲染问题与浏览器渲染问题。",
    "审计结果按 P0/P1/P2 排序，每条附着验证方式。",
    "瀑布流消除：先画依赖图，有依赖才串行，其余并行。",
    "Hydration 修复不能引入视觉闪烁；scroll/resize 必须 passive: true。",
    "LCP 元素必须尽早被浏览器发现；不要把它藏在懒加载、轮播或客户端二次渲染之后。",
    "INP 问题优先查主线程长任务、同步计算、重排重绘和阻塞事件处理。",
    "CLS 只能靠稳定布局解决，不能靠\"加载更快\"掩盖。",
  ],
  checklist: [
    "已覆盖性能、a11y、SEO、best practices 四维度。",
    "问题按 P0/P1/P2 排序，每条指向具体页面/文件/元素。",
    "已区分 lab 与 RUM 数据口径。",
    "LCP 四段分解、INP 三段分解是否完成？",
    "LCP 元素已确认且存在于初始 HTML，图片/字体已 preload。",
    "事件处理链路无长任务；关键交互在低端设备和慢网下也可用。",
    "图片、视频、广告、嵌入内容都已声明尺寸或 `aspect-ratio`。",
    "无依赖请求已 Promise.all 并行化；hydration 无闪烁。",
    "修复后同时复测实验室数据与真实用户数据。",
  ],
  relatedSkills: [
    {
      get id() {
        return responsiveDesignSkill.id;
      },
      reason: "性能问题涉及响应式图片、尺寸预留、移动端布局或小屏内容密度时联动。",
    },
    {
      get id() {
        return frontendDesignReviewSkill.id;
      },
      reason: "性能修复会影响视觉层级、交互清晰度、可访问性或设计系统一致性时联动。",
    },
    {
      get id() {
        return bundleOptimizationSkill.id;
      },
      reason: "诊断指向 JS 体积、代码分割、tree shaking 或第三方脚本加载时联动。",
    },
    {
      get id() {
        return reactPerformanceSkill.id;
      },
      reason: "瓶颈来自 React re-render、memo、外部 store 订阅或组件渲染成本时联动。",
    },
    {
      get id() {
        return reactServerComponentsSkill.id;
      },
      reason: "瓶颈来自 RSC 边界、Server Actions、请求瀑布或序列化成本时联动。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先区分 lab / RUM 数据、页面场景、设备网络和目标指标，不看数据不猜瓶颈。",
      "按网络层、渲染层、运行时分段定位 LCP、INP、CLS、瀑布流、hydration 和长任务。",
      "每条发现按 P0/P1/P2 排序，绑定页面、元素、文件、证据和复测方式。",
      "三段式概览读取 `diagnosis-overview`；深度流程、CWV、质量审计和瀑布流读取对应 references。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "lab / RUM 数据口径、目标场景、瓶颈分层和优先级。",
      "LCP / INP / CLS / 瀑布流 / hydration / bundle / React 的具体发现与修复建议。",
      "性能预算、复测命令、真实用户验证和剩余风险。",
    ],
  }),
  procedures: [
    procedureUse(webPerformanceDiagnosisAnalyze),
  ],
  references: [
    defineReference({
      id: "diagnosis-overview",
      source: new URL("./references/diagnosis-overview.md", import.meta.url),
      target: "references/diagnosis-overview.md",
      title: "Web 性能诊断概览",
      summary: "网络层、渲染层、运行时三段式诊断、CWV 深度优化、质量审计和瀑布流入口。",
      loadWhen: "需要快速建立 Web 性能诊断路径和引用后续资料时读取。",
    }),
    defineReference({
      id: "anti-patterns",
      source: new URL("./references/anti-patterns.md", import.meta.url),
      target: "references/anti-patterns.md",
      title: "anti-patterns.md",
      summary: "Web 性能优化的常见反模式，包括错误归因、无效优化和重复劳动。",
      loadWhen: "需要确认当前优化方向没有落入常见性能误区时读取。",
    }),
    defineReference({
      id: "cwv-patterns",
      source: new URL("./references/cwv-patterns.md", import.meta.url),
      target: "references/cwv-patterns.md",
      title: "cwv-patterns.md",
      summary: "Core Web Vitals（LCP/INP/CLS）的深度优化模式与高级修复技巧。",
      loadWhen: "需要对单项 CWV 指标做深度优化或排查复杂性能根因时读取。",
    }),
    defineReference({
      id: "diagnosis-detail",
      source: new URL("./references/diagnosis-detail.md", import.meta.url),
      target: "references/diagnosis-detail.md",
      title: "diagnosis-detail.md",
      summary: "Web 性能诊断方法论，包括性能问题定位流程和数据分析框架。",
      loadWhen: "需要系统性的诊断流程指导来定位未知性能瓶颈时读取。",
    }),
    defineReference({
      id: "lcp-optimization",
      source: new URL("./references/LCP-optimization.md", import.meta.url),
      target: "references/LCP-optimization.md",
      title: "LCP-optimization.md",
      summary: "LCP（Largest Contentful Paint）的详细优化策略，包括 LCP 四段分解。",
      loadWhen: "需要系统优化 LCP 指标或排查 LCP 元素被延迟发现时读取。",
    }),
    defineReference({
      id: "quality-audit",
      source: new URL("./references/quality-audit.md", import.meta.url),
      target: "references/quality-audit.md",
      title: "quality-audit.md",
      summary: "网站质量审计指南，覆盖性能、无障碍、SEO 和最佳实践四个维度。",
      loadWhen: "需要做全面的网站质量审计并输出 P0/P1/P2 排序结果时读取。",
    }),
    defineReference({
      id: "rendering-and-waterfall",
      source: new URL("./references/rendering-and-waterfall.md", import.meta.url),
      target: "references/rendering-and-waterfall.md",
      title: "rendering-and-waterfall.md",
      summary: "浏览器渲染流程与请求瀑布流的分析方法和优化模式。",
      loadWhen: "需要分析请求瀑布流、消除串行依赖或优化渲染路径时读取。",
    }),
    defineReference({
      id: "rules-rendering",
      source: new URL("./references/rules-rendering/", import.meta.url),
      target: "references/rules-rendering",
      title: "rules-rendering",
      summary: "浏览器渲染优化的检查规则与自动化检测脚本集合。",
      loadWhen: "需要按规则列表逐项检查渲染性能问题时读取。",
    }),
    defineReference({
      id: "rules-waterfall",
      source: new URL("./references/rules-waterfall/", import.meta.url),
      target: "references/rules-waterfall",
      title: "rules-waterfall",
      summary: "请求瀑布流优化的检查规则与自动化检测脚本集合。",
      loadWhen: "需要按规则列表逐项检查请求瀑布流问题时读取。",
    }),
  ],
});
