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
import { complexityReducerSkill } from "../complexity-reducer/index";
import { refactoringChecklistSkill } from "../refactoring-checklist/index";
import { softwareDesignSkill } from "../software-design/index";

export const refactoringPatternsSkill = defineSkill({
  id: "refactoring-patterns",
  fullName: "refactoring-patterns",
  description: "当用户要选择命名化重构手法、处理代码异味或在不改行为下改结构时使用。纯格式整理或单次重命名不需要。",
  useCases: [
    "适合需要明确\"该用哪个重构动作、按什么顺序做\"的情况。",
    "适合在复杂函数、重复逻辑、条件分支和数据组织问题上做精准整改。",
    "本 skill 只回答「该选哪个手法、动作序列怎么排」；流程门禁另行检查测试基线、范围界定和回滚。",
  ],
  constraints: [
    "重构默认不改行为；若必须改行为，要明确拆成“重构”和“行为变更”两步。",
    "优先选最小、安全、可验证的重构序列，而不是一次跳大步。",
    "必须先识别异味，再选手法；不要为了秀技巧强行套模式。",
    "没有验证路径的高风险重构，默认不能一次完成。",
  ],
  checklist: [
    "是否先说清楚代码异味和目标状态。",
    "是否给出可落地的重构序列而非抽象建议。",
    "是否标记需要补测试或人工验证的高风险步骤。",
    "是否避免把多个重构意图塞进一次改动。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "重构和功能变更混在一个 commit：无法区分哪个改动导致回归，也无法安全回滚。",
      pass: "先重构再变更，分 commit",
    }),
    defineAntiPattern({
      fail: "不知道问题就先抽方法：拆出的函数没有业务含义，只是机械分割，读者要跳转更多次。",
      pass: "先识别异味再选手法",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  relatedSkills: [
    {
      get id() {
        return complexityReducerSkill.id;
      },
      reason: "需要先降低函数、模块或调用链复杂度，再选择具体重构手法时联动。",
    },
    {
      get id() {
        return softwareDesignSkill.id;
      },
      reason: "需要按设计原则、抽象边界或耦合方向校验重构目标时联动。",
    },
    {
      get id() {
        return refactoringChecklistSkill.id;
      },
      reason: "重构前需要检查测试基线、范围界定、行为变更隔离和回滚方案时联动。",
    },
  ],
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先说明代码异味、目标状态、行为是否保持不变，以及验证路径。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "读取 `smell-catalog` reference 归类异味，不为了套模式强行重构。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "按问题读取动作库：函数组合读 `composing-methods`，职责搬移读 `moving-features`，数据整理读 `organizing-data`，条件简化读 `simplifying-conditionals`。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "需要排序完整步骤时读取 `refactoring-workflow` reference；遗留代码隔离测试时读取 `seam-ripper`。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "把重构和行为变更拆成两步，优先选择小步、安全、可回滚的动作序列。",
      }),
      defineWorkflowStep({
        id: "step-6",
        label: "标记需要补测试、人工验证或拆 commit 的高风险步骤。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "代码异味、证据和目标结构。",
      "选用的重构手法及选择理由。",
      "小步重构序列、验证点和回滚点。",
      "需要补测试或拆分提交的风险提示。",
    ],
  }),
  references: [
    defineReference({
      id: "composing-methods",
      source: new URL("./references/composing-methods.md", import.meta.url),
      target: "references/composing-methods.md",
      title: "composing-methods.md",
      summary: "Extract Method、Inline Method、Introduce Parameter Object 等组合方法的各种手法详解。",
      loadWhen: "需要选择具体的函数组合手法（提取/内联/拆分）时读取。",
    }),
    defineReference({
      id: "moving-features",
      source: new URL("./references/moving-features.md", import.meta.url),
      target: "references/moving-features.md",
      title: "moving-features.md",
      summary: "Move Field、Move Method、Extract Class 等在不同模块间移动职责的手法。",
      loadWhen: "需要在类/模块之间移动字段、方法或拆分职责时读取。",
    }),
    defineReference({
      id: "organizing-data",
      source: new URL("./references/organizing-data.md", import.meta.url),
      target: "references/organizing-data.md",
      title: "organizing-data.md",
      summary: "Replace Magic Number with Constant、Encapsulate Field、Change Value to Reference 等数据组织手法。",
      loadWhen: "需要重构数据结构、封装字段或替换魔法值为常量时读取。",
    }),
    defineReference({
      id: "refactoring-workflow",
      source: new URL("./references/refactoring-workflow.md", import.meta.url),
      target: "references/refactoring-workflow.md",
      title: "refactoring-workflow.md",
      summary: "重构的完整工作流：识别异味→选择手法→应用→测试→提交的迭代过程。",
      loadWhen: "需要设计重构步骤序列或理解重构的完整执行流程时读取。",
    }),
    defineReference({
      id: "seam-ripper",
      source: new URL("./references/seam-ripper.md", import.meta.url),
      target: "references/seam-ripper.md",
      title: "seam-ripper.md",
      summary: "接缝剥离技术：在不修改原代码前提下插入测试桩的方法。",
      loadWhen: "需要在遗留代码中安全插入测试桩或构建测试隔离边界时读取。",
    }),
    defineReference({
      id: "simplifying-conditionals",
      source: new URL("./references/simplifying-conditionals.md", import.meta.url),
      target: "references/simplifying-conditionals.md",
      title: "simplifying-conditionals.md",
      summary: "Decompose Conditional、Consolidate Conditional、Replace Nested Conditional 等简化条件逻辑的手法。",
      loadWhen: "需要拆分或简化复杂的条件表达式时读取。",
    }),
    defineReference({
      id: "smell-catalog",
      source: new URL("./references/smell-catalog.md", import.meta.url),
      target: "references/smell-catalog.md",
      title: "smell-catalog.md",
      summary: "常见代码异味（Long Method、Large Class、Switch Statement 等）的诊断标准与对应重构手法对照表。",
      loadWhen: "需要识别代码异味或确定当前代码属于哪种异味类型时读取。",
    }),
  ],
});
