import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { procedureUse, complexityReducerComplexityReport } from "../../procedures/index";
import { codeReviewSkill } from "../code-review/index";
import { refactoringChecklistSkill } from "../refactoring-checklist/index";
import { refactoringPatternsSkill } from "../refactoring-patterns/index";
import { softwareDesignSkill } from "../software-design/index";

export const complexityReducerSkill = defineSkill({
  id: "complexity-reducer",
  fullName: "复杂度识别与简化",
  description: "当代码过于复杂、嵌套太深、函数太长、耦合严重，或用户要求简化代码、清理命名、降低复杂度时使用。",
  useCases: [
    "代码能跑但难以理解、修改和测试。",
    "函数超长、嵌套超深、参数超多、条件超复杂。",
    "上线前做可维护性整理，而不是功能性重写。",
  ],
  constraints: [
    "目标是降低认知复杂度，不是减少行数。",
    "先定位复杂度来源，再决定策略。",
    "每次简化保持行为不变——这是重构不是重写。",
    "本质复杂度（业务规则就是复杂的）不强行简化逻辑，而是改善组织。",
    "简化后必须更容易理解，不是更\"巧妙\"。",
  ],
  checklist: [
    "已识别最主要的复杂度来源",
    "简化策略与来源匹配",
    "每次简化保持行为不变",
    "简化后更容易理解（不只是更短）",
    "没有引入新复杂度（如过度抽象）",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "为减少行数牺牲可读性：一行做了过滤、计算、归并三件事，无法断点调试，出错无法定位。",
      pass: "分步命名，每步可验证",
    }),
    defineAntiPattern({
      fail: "只移动复杂度不消除",
      pass: "用查找表消除分支",
    }),
  ],
  relatedSkills: [
    {
      get id() {
        return refactoringChecklistSkill.id;
      },
      reason: "需要按重构纪律控制行为不变、步长和验证顺序时联动。",
    },
    {
      get id() {
        return refactoringPatternsSkill.id;
      },
      reason: "需要选择具体重构手法或替换复杂结构时联动。",
    },
    {
      get id() {
        return codeReviewSkill.id;
      },
      reason: "复杂度问题来自审查发现或需要复核可维护性风险时联动。",
    },
    {
      get id() {
        return softwareDesignSkill.id;
      },
      reason: "复杂度来自职责边界、抽象层次或模块设计问题时联动。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先用阅读或 `complexity-reducer-complexity-report` 定位嵌套、长函数、参数爆炸、布尔组合、特性嫉妒、原始类型偏执或条件过长。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "按问题、最小重构动作、风险、验证方式组织计划；语言细节读取对应 language reference，通用手法读取 patterns reference。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "每次只处理一个主要来源：深嵌套优先 guard clause，长函数按段落抽取，过多参数改参数对象或拆分，复杂条件抽命名布尔或查找表。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "每步后跑测试或最小验证，关闭任务前读取 verification checklist 和 task-closure reference。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "复杂度来源清单、定量/定性证据、排序和最小重构动作。",
      "行为不变验证方式、测试结果、风险和回滚点。",
      "简化前后可读性对比，以及仍属于业务本质复杂度的部分。",
    ],
  }),
  procedures: [
    procedureUse(complexityReducerComplexityReport, {
      label: "分析代码复杂度",
      when: "需要定量评估代码库中函数的认知复杂度和嵌套深度。",
      reason: "定量揭示认知复杂度热点，避免全凭直觉猜测哪段代码最需要简化。",
    }),
  ],
  references: [
    defineReference({
      id: "go",
      source: new URL("./references/go.md", import.meta.url),
      target: "references/go.md",
      title: "go.md",
      summary: "Go 语言代码复杂度简化模式与常见简化技术。",
      loadWhen: "需要简化 Go 代码的复杂函数或降低嵌套层次时读取。",
    }),
    defineReference({
      id: "patterns",
      source: new URL("./references/patterns.md", import.meta.url),
      target: "references/patterns.md",
      title: "patterns.md",
      summary: "通用代码复杂度简化模式：查找表、策略模式、分步命名等通用技术。",
      loadWhen: "需要参考语言无关的复杂度简化策略时读取。",
    }),
    defineReference({
      id: "python",
      source: new URL("./references/python.md", import.meta.url),
      target: "references/python.md",
      title: "python.md",
      summary: "Python 代码复杂度简化模式与语言特性简化技巧。",
      loadWhen: "需要简化 Python 代码的条件分支或过深嵌套时读取。",
    }),
    defineReference({
      id: "rust",
      source: new URL("./references/rust.md", import.meta.url),
      target: "references/rust.md",
      title: "rust.md",
      summary: "Rust 代码复杂度简化模式与所有权模型下的简化技术。",
      loadWhen: "需要简化 Rust 代码的复杂泛型约束或降低 match 嵌套时读取。",
    }),
    defineReference({
      id: "task-closure",
      source: new URL("./references/task-closure.md", import.meta.url),
      target: "references/task-closure.md",
      title: "task-closure.md",
      summary: "简化任务的闭环确认流程：简化前后对比与可维护性验证。",
      loadWhen: "需要确认简化操作已完成并可安全关闭任务时读取。",
    }),
    defineReference({
      id: "typescript",
      source: new URL("./references/typescript.md", import.meta.url),
      target: "references/typescript.md",
      title: "typescript.md",
      summary: "TypeScript 代码复杂度简化模式与类型系统辅助简化策略。",
      loadWhen: "需要简化 TypeScript 代码的复杂类型推导或过长的函数时读取。",
    }),
    defineReference({
      id: "verification-checklist",
      source: new URL("./references/verification-checklist.md", import.meta.url),
      target: "references/verification-checklist.md",
      title: "verification-checklist.md",
      summary: "代码简化完成前的验证检查清单：行为不变性、可理解性与测试覆盖。",
      loadWhen: "需要在关闭简化任务前逐项验证改动质量时读取。",
    }),
  ],
});
