import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineReference,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { webPerformanceDiagnosisSkill } from "../web-performance-diagnosis/index";

export const bundleOptimizationSkill = defineSkill({
  id: "bundle-optimization",
  fullName: "Bundle 体积优化",
  description:
    "当需要减小前端 bundle、做代码分割、消除 barrel imports、tree shaking 或按用户意图预加载时使用。",
  useCases: [
    "首屏加载慢，需要减小初始 bundle 体积以改善 TTI 和 LCP。",
    "需要对重型组件做动态导入 / 代码分割。",
    "项目使用 barrel exports（index.ts 重导出），导致 tree shaking 失效。",
    "需要基于用户行为意图预加载即将用到的模块。",
    "性能指标层面可联动 `web-performance-diagnosis`。",
    "这套 skill 是规则索引；需要细节时直接打开对应 `references/rules/*.md` 文件。",
  ],
  constraints: [
    "先量化：用 bundle analyzer 确认哪些模块占比最大，再决定拆分策略。",
    "动态导入只用在真正重型的、非首屏必须的组件上，不要滥用。",
    "消除 barrel imports 时优先改成 direct path imports，而不是靠打包器 sideEffects 配置。",
    "预加载（preload）只用在高概率用户路径上，避免浪费带宽。",
  ],
  checklist: [
    "是否用 bundle analyzer 确认了最大的几个模块？",
    "首屏不需要的重型组件是否已动态导入？",
    "是否消除了 barrel imports 改为 direct path？",
    "第三方库是否按需加载而不是全量引入？",
    "预加载是否只用在高概率路径上？",
    "改动前后是否有 bundle size 对比？",
  ],
  relatedSkills: [
    {
      get id() {
        return webPerformanceDiagnosisSkill.id;
      },
      reason: "bundle 体积问题需要落到 LCP、INP、瀑布流或质量审计指标时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "滥动态导入",
      pass: "仅重型组件",
    }),
    defineAntiPattern({
      fail: "只看 gzip 体积",
      pass: "三个指标都看",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先用 bundle analyzer 量化最大模块、入口 chunk、初始 JS、gzip/brotli 和 parse/execute 成本。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "把 barrel imports 改成 direct path imports，重型且非首屏必需的组件改为动态导入。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "第三方库按需加载，preload 只用于高概率路径，避免为了体积拆分破坏首屏体验。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "barrel import 和 dynamic import 示例读取 `bundle-code-patterns`；专项规则读取 `bundle-rules`。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "bundle analyzer 结论、最大模块和入口 chunk 风险。",
      "direct import、dynamic import、tree shaking、第三方延迟和 preload 建议。",
      "改动前后 bundle size / LCP / TTI / INP 验证方式。",
    ],
  }),
  references: [
    defineReference({
      id: "bundle-code-patterns",
      source: new URL("./references/bundle-code-patterns.md", import.meta.url),
      target: "references/bundle-code-patterns.md",
      title: "Bundle 优化代码模式",
      summary: "barrel import 改 direct path import、重型组件动态导入和 bundle 规则索引。",
      loadWhen: "需要快速修复前端 bundle 体积、barrel import 或动态导入问题时读取。",
    }),
    defineReference({
      id: "bundle-rules",
      source: new URL("./references/rules/", import.meta.url),
      target: "references/rules",
      title: "Bundle Optimization Rules",
      summary: "barrel imports、dynamic import、条件分支、第三方延迟和 preload 专项规则。",
      loadWhen: "需要按具体 bundle 优化场景读取专项规则时读取。",
    }),
  ],
});
