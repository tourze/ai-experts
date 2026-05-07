import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { firstPrinciplesDecomposerSkill } from "../first-principles-decomposer/index";
import { fishboneDiagramSkill } from "../fishbone-diagram/index";
import { scientificBrainstormingSkill } from "../scientific-brainstorming/index";

export const mckinseyStepSkill = defineSkill({
  id: "mckinsey-7-step",
  fullName: "麦肯锡七步成诗法",
  description: "当用户要系统性解决复杂业务问题、做咨询式分析或结构化拆解方案时使用。简单选择题或已知答案的确认性提问不适用。",
  useCases: [
    "面对模糊的业务问题，需要结构化拆解到可执行方案。",
    "咨询式问题解决：从假设出发，用数据验证。",
    "与 `first-principles-decomposer` 配合：第一性原理拆假设，七步法走全流程。",
  ],
  constraints: [
    "七步是循环不是直线——假设不成立时必须退回重来。",
    "**步骤 2（分解问题）是成败关键**：MECE 原则必须严格遵守（相互独立、完全穷举）。",
    "步骤 3（确定关键问题）用 80/20 法则聚焦 2-3 个关键驱动因素，不是面面俱到。",
    "**假设驱动**：先假设后验证，不是先收集所有数据再总结。没有假设的分析 = 没有方向 = 信息过载。",
    "最终方案必须有金字塔结构（结论先行），不是流水账。",
  ],
  checklist: [
    "问题陈述具体可回答，不是\"如何做得更好\"。",
    "分解遵循 MECE，无遗漏无重叠。",
    "聚焦了 2-3 个关键问题，不是什么都分析。",
    "假设驱动：先假设后验证。",
    "最终方案有金字塔结构（结论先行）。",
  ],
  relatedSkills: [
    {
      get id() {
        return scientificBrainstormingSkill.id;
      },
      reason: "需要创意发散：七步法是收敛式分析，创意发散用 `scientific-brainstorming`。",
    },
    {
      get id() {
        return firstPrinciplesDecomposerSkill.id;
      },
      reason: "与 `first-principles-decomposer` 配合：第一性原理拆假设，七步法走全流程。",
    },
    {
      get id() {
        return fishboneDiagramSkill.id;
      },
      reason: "步骤 2 需要根因或问题结构拆解时用 `fishbone-diagram`；问题和方案都已明确、只需一次性行动计划时，参考 fishbone-diagram 的 5W2H reference。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "没有假设的分析",
      pass: "假设驱动",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "定义问题：把宽泛诉求改写成具体、可回答、有边界的问题，并列出成功标准。",
      "分解问题：用 MECE 结构拆成互斥且穷尽的子问题；根因型问题可联动 `fishbone-diagram`。",
      "确定关键问题：用 80/20 聚焦 2-3 个最可能改变结论的驱动因素，不平均用力。",
      "制定工作计划：为每个关键问题写假设、所需证据、验证方法和优先级。",
      "展开分析：围绕假设收集数据和事实，区分证据、推断和待验证假设。",
      "综合结论：验证或推翻初始假设，必要时回到前面步骤重新分解。",
      "形成建议：用金字塔结构输出结论、理由、证据和可执行下一步。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "问题陈述和成功标准。",
      "MECE 问题树与关键驱动因素。",
      "假设-证据-验证计划矩阵。",
      "结论先行的建议、风险和下一步行动。",
    ],
  }),
});
