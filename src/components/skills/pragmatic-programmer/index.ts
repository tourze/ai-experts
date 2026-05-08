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
import { refactoringPatternsSkill } from "../refactoring-patterns/index";
import { softwareDesignSkill } from "../software-design/index";

export const pragmaticProgrammerSkill = defineSkill({
  id: "pragmatic-programmer",
  fullName: "pragmatic-programmer",
  description: "当用户要用务实工程原则判断抽象是否过度、DRY/YAGNI 取舍、tracer bullet 路径或协作方式时使用。",
  useCases: [
    "适合方案取舍、代码评审、流程纠偏和开发习惯校准。",
    "适合回答“现在该用多重抽象、该不该一次做大、如何降低不可逆决策”。",
    "适合把务实原则转成当前决策的最小可验证动作。",
  ],
  constraints: [
    "原则是为了降低复杂度和反馈成本，不是为了凑口号。",
    "DRY 只消灭真正重复的知识，不要把相似但不同的逻辑强行合并。",
    "示踪弹用于快速打通主路径，不代表可以跳过质量或收尾。",
    "任何不可逆决策都要先验证边界，再决定是否承诺。",
  ],
  checklist: [
    "是否识别了重复知识、耦合边界和不可逆决策。",
    "是否选择了最小可验证路径，而不是一次赌大。",
    "是否说明了原则对当前实现的具体影响。",
    "是否保留了后续演进空间。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "DRY 当过度抽象借口",
      pass: "只 DRY 真重复",
    }),
    defineAntiPattern({
      fail: "示踪弹 = 临时代码堆",
      pass: "可演进的最小路径",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  relatedSkills: [
    {
      get id() {
        return refactoringPatternsSkill.id;
      },
      reason: "原则判断需要落到具体重构手法、代码异味或重构序列时联动。",
    },
    {
      get id() {
        return softwareDesignSkill.id;
      },
      reason: "需要从耦合、抽象、复杂度或设计原则层面治理方案时联动。",
    },
  ],
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先明确当前决策、约束、不可逆点、反馈周期和要避免的复杂度。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "按问题读取 reference：估算读 `estimation-portfolio`，示踪弹读 `tracer-bullets`，DRY/正交性读 `dry-orthogonality`，契约读 `contracts-assertions`，破窗读 `broken-windows`。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "判断重复是否是真正重复的知识，避免把相似但不同的逻辑强行合并。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "设计最小可验证路径；示踪弹必须能演进，不能变成无质量边界的临时代码。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "对不可逆决策读取 `reversibility`，先验证边界再承诺。",
      }),
      defineWorkflowStep({
        id: "step-6",
        label: "输出原则如何改变本次选择，以及今天该做的最小动作。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "当前决策、约束、反馈周期和不可逆点。",
      "相关务实原则及适用/不适用理由。",
      "最小可验证路径、边界验证和保留的演进空间。",
      "今天要做的动作、避免的过度抽象和后续复审点。",
    ],
  }),
  references: [
    defineReference({
      id: "broken-windows",
      source: new URL("./references/broken-windows.md", import.meta.url),
      target: "references/broken-windows.md",
      title: "broken-windows.md",
      summary: "\"破窗\"理论在软件开发中的体现及应对策略。",
      loadWhen: "需要判断代码库中哪些小问题会演变成架构腐烂时读取。",
    }),
    defineReference({
      id: "contracts-assertions",
      source: new URL("./references/contracts-assertions.md", import.meta.url),
      target: "references/contracts-assertions.md",
      title: "contracts-assertions.md",
      summary: "按合约设计与断言式编程的实践指南。",
      loadWhen: "需要设计代码合约或使用断言增强代码健壮性时读取。",
    }),
    defineReference({
      id: "dry-orthogonality",
      source: new URL("./references/dry-orthogonality.md", import.meta.url),
      target: "references/dry-orthogonality.md",
      title: "dry-orthogonality.md",
      summary: "DRY 原则与正交性的权衡方法和实践要点。",
      loadWhen: "需要判断哪些重复应该消除、哪些相似但不同的逻辑应保留时读取。",
    }),
    defineReference({
      id: "estimation-portfolio",
      source: new URL("./references/estimation-portfolio.md", import.meta.url),
      target: "references/estimation-portfolio.md",
      title: "estimation-portfolio.md",
      summary: "估算方法与投资组合思维的结合应用。",
      loadWhen: "需要对不确定任务做估算或评估估算风险时读取。",
    }),
    defineReference({
      id: "reversibility",
      source: new URL("./references/reversibility.md", import.meta.url),
      target: "references/reversibility.md",
      title: "reversibility.md",
      summary: "可逆决策与不可逆决策的识别方法和风险管理策略。",
      loadWhen: "需要判断当前决策是否可逆以及如何降低不可逆决策风险时读取。",
    }),
    defineReference({
      id: "tracer-bullets",
      source: new URL("./references/tracer-bullets.md", import.meta.url),
      target: "references/tracer-bullets.md",
      title: "tracer-bullets.md",
      summary: "示踪弹开发方法的实践指南，通过端到端快速验证主路径。",
      loadWhen: "需要设计快速验证路径或打通端到端主路径时读取。",
    }),
  ],
});
