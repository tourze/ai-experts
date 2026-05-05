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
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
