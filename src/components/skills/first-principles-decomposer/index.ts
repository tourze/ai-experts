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
import { crossPollinationEngineSkill } from "../cross-pollination-engine/index";

export const firstPrinciplesDecomposerSkill = defineSkill({
  id: "first-principles-decomposer",
  fullName: "第一性原理解构器",
  description: "当需要用第一性原理拆解事实层、识别隐含假设、重建问题边界、从零推导方案时使用。",
  useCases: [
    "用户说“从第一性原理重想”“从头来过”“我们是不是默认了太多”。",
    "现有做法很复杂、很贵，或者“行业都这么做”的理由站不住。",
    "需要挑战既有框架、重新定义问题或重建方案。",
    "分解后可配合 [inversion-strategist](references/inversion-strategist.md) 反推失败路径。",
    "需要借别的行业做类比时，可接 `cross-pollination-engine`。",
  ],
  constraints: [
    "先用一句话定义问题，再开始拆，不要一边拆一边换题。",
    "明确区分“假设”和“事实”；竞品做法、行业惯例、客户原话都不是天然事实。",
    "通过连续追问“为什么”，一直挖到不可再压缩的约束、物理事实、用户底层需求或制度条件。",
    "重建方案时，只能引用已验证的基础事实，不能偷偷把旧方案的默认前提带回来。",
    "最后必须对比“重建方案 vs. 常规方案”，让差异可见。",
    "需要更完整方法时，参考 [详细框架](references/framework.md)、[示例集](references/examples.md) 和 [组合框架](references/integrated-frameworks.md)。",
  ],
  checklist: [
    "问题是否已经收敛成一句清晰陈述。",
    "是否至少列出了 3 个待挑战的关键假设。",
    "基础事实是否真的不可再压缩、不可轻易反驳。",
    "新方案是否只建立在这些事实之上。",
    "是否说明了和常规做法的差别与收益。",
    "是否给出后续验证点或最小实验。",
  ],
  relatedSkills: [
    {
      get id() {
        return crossPollinationEngineSkill.id;
      },
      reason: "需要借别的行业做类比时，可接 `cross-pollination-engine`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "行业标准当事实",
      pass: "拆到不可再压缩的物理层",
    }),
    defineAntiPattern({
      fail: "替代症状不解决根需求",
      pass: "追问到底层需求",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先用一句话定义问题、现有做法和要挑战的边界；问题没收敛前不要进入推导。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "列出至少 3 个关键假设，并逐个区分事实、推断、行业惯例、竞品做法和客户原话。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "连续追问为什么，直到触达不可轻易反驳的物理事实、制度条件、用户底层需求或资源约束。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "只基于基础事实重建最小可行解，并对比常规方案：少了什么、保留什么、为什么更合理、下一步如何验证。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "一句话问题陈述、现有做法、假设清单和挑战点。",
      "基础事实、证据强度、不可再压缩约束和被剔除的默认前提。",
      "重建方案、与常规方案对比、收益、风险和最小验证实验。",
    ],
  }),
  references: [
    defineReference({
      id: "examples",
      source: new URL("./references/examples.md", import.meta.url),
      target: "references/examples.md",
      title: "examples.md",
      summary: "第一性原理解构的完整示例集，展示从原始问题到基础事实的拆解过程。",
      loadWhen: "需要参考完整拆解示例来理解第一性原理方法的应用方式时读取。",
    }),
    defineReference({
      id: "framework",
      source: new URL("./references/framework.md", import.meta.url),
      target: "references/framework.md",
      title: "framework.md",
      summary: "第一性原理解构的详细框架步骤，包括事实层拆解、假设识别和方案重建。",
      loadWhen: "需要执行完整的第一性原理解构流程或学习拆解方法论时读取。",
    }),
    defineReference({
      id: "integrated-frameworks",
      source: new URL("./references/integrated-frameworks.md", import.meta.url),
      target: "references/integrated-frameworks.md",
      title: "integrated-frameworks.md",
      summary: "第一性原理与其他思维框架（如反向推理）的组合使用方法。",
      loadWhen: "需要将第一性原理与其他方法论结合使用以解决复杂问题时读取。",
    }),
    defineReference({
      id: "inversion-strategist",
      source: new URL("./references/inversion-strategist.md", import.meta.url),
      target: "references/inversion-strategist.md",
      title: "inversion-strategist.md",
      summary: "反向推理（inversion）方法的核心概念与实践指南。",
      loadWhen: "需要从失败路径反向推导解决方案或配合第一性原理使用反向思维时读取。",
    }),
    defineReference({
      id: "pre-mortem-examples",
      source: new URL("./references/pre-mortem-examples.md", import.meta.url),
      target: "references/pre-mortem-examples.md",
      title: "pre-mortem-examples.md",
      summary: "上线前和项目启动前的 pre-mortem 失败预演示例集合。",
      loadWhen: "需要参考 pre-mortem 的结构化示例来快速落地失败推演时读取。",
    }),
    defineReference({
      id: "pre-mortem-framework",
      source: new URL("./references/pre-mortem-framework.md", import.meta.url),
      target: "references/pre-mortem-framework.md",
      title: "pre-mortem-framework.md",
      summary: "pre-mortem 失败预演的标准步骤、输出模板和质量门槛。",
      loadWhen: "需要系统执行 pre-mortem 风险推演并落到行动时读取。",
    }),
  ],
});
