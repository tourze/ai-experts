import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const bundleOptimizationSkill = defineSkill({
  id: "bundle-optimization",
  fullName: "Bundle 体积优化",
  description: "当需要减小前端 bundle、做代码分割、消除 barrel imports、tree shaking 或按用户意图预加载时使用。",
  useCases: [
    "首屏加载慢，需要减小初始 bundle 体积以改善 TTI 和 LCP。",
    "需要对重型组件做动态导入 / 代码分割。",
    "项目使用 barrel exports（index.ts 重导出），导致 tree shaking 失效。",
    "需要基于用户行为意图预加载即将用到的模块。",
    "性能指标层面可联动 [web-performance-diagnosis](../web-performance-diagnosis/SKILL.md)。",
    "这套 skill 是规则索引；需要细节时直接打开对应 `rules/*.md` 文件。",
  ],
  constraints: [
    "先量化：用 bundle analyzer 确认哪些模块占比最大，再决定拆分策略。",
    "动态导入只用在真正重型的、非首屏必须的组件上，不要滥用。",
    "消除 barrel imports 时优先改成 direct path imports，而不是靠打包器 sideEffects 配置。",
    "预加载（preload）只用在高概率用户路径上，避免浪费带宽。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
