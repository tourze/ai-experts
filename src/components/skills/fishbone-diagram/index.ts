import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillGoal,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { firstPrinciplesDecomposerSkill } from "../first-principles-decomposer/index";
import { mckinseyStepSkill } from "../mckinsey-7-step/index";
import { priorityJudgeSkill } from "../priority-judge/index";

export const fishboneDiagramSkill = defineSkill({
  id: "fishbone-diagram",
  fullName: "鱼骨图（因果分析图）",
  description: "当用户要用鱼骨图、Ishikawa 或 5 Whys 做根因分析和因果排查时使用。",
  useCases: [
    "复杂问题的根因分析：避免\"头痛医头\"。",
    "质量问题排查、故障诊断、流程改进。",
    "与 `mckinsey-7-step` 配合：七步法的第二步（分解问题）可以用鱼骨图。问题定义阶段的补充工具见 [references/five-w-two-h.md](references/five-w-two-h.md)。",
  ],
  constraints: [
    "主要类别（大骨）按场景选择：\n- 制造业：人/机/料/法/环（5M）\n- 服务业：人员/流程/政策/设备/外部\n- 软件/产品：产品/技术/运营/市场/组织",
    "每个原因要追问\"为什么\"至少 **2-3 层深度**——第一层谁都能写，根因在第二三层。",
    "最终必须**锁定 1-3 个根本原因**，不是列一堆然后结束。",
    "根因要有验证方法（如何确认这是真正的根因），不是猜测。",
  ],
  checklist: [
    "主要类别覆盖全面（至少 4 个维度）。",
    "每个原因至少追问了 2 层\"为什么\"。",
    "最终锁定了 1-3 个根本原因。",
    "根因有验证方法，不是猜测。",
  ],
  relatedSkills: [
    {
      get id() {
        return firstPrinciplesDecomposerSkill.id;
      },
      label: "inversion-strategist",
      reason: "系统性风险预判：鱼骨图分析已发生的问题，未来风险预判与事前验尸用 `inversion-strategist`。",
    },
    {
      get id() {
        return mckinseyStepSkill.id;
      },
      reason: "与 `mckinsey-7-step` 配合：七步法的第二步（分解问题）可以用鱼骨图。问题定义阶段的补充工具见 references/five-w-two-h.md。",
    },
    {
      get id() {
        return priorityJudgeSkill.id;
      },
      reason: "原因已知只需排优先级：鱼骨图是发散找原因的工具，原因已知时直接用 `priority-judge` 排序。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "只列第一层",
      pass: "追问到根因",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "把一个已发生的问题拆成可验证的因果树，找到 1-3 个最可能的根因，并给出验证动作。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "先界定问题：现象、影响对象、时间范围、地点/系统边界、当前证据；范围不清时读取 `five-w-two-h` reference 辅助定义。",
      "选择大骨类别：制造业用人/机/料/法/环，服务业用人员/流程/政策/设备/外部，软件/产品用产品/技术/运营/市场/组织。",
      "在每个类别下列出第一层可能原因，并标注已有证据、推断和未知项。",
      "对高可疑原因连续追问 2-3 层“为什么”，直到落到可改变、可验证的机制或条件。",
      "合并重复原因，区分症状、近因和根因；避免把负责人、团队或单个事件当作终点。",
      "按影响、证据强度、可验证性和可干预性筛出 1-3 个根本原因。",
      "为每个候选根因设计验证方法：要看什么数据、做什么实验、找谁确认、成功/失败判据是什么。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "问题定义：现象、边界、影响和已知证据。",
      "鱼骨结构：大骨类别、原因层级和证据标注。",
      "根因候选：1-3 个，分别说明证据、假设和反证风险。",
      "验证计划：验证动作、负责人/输入、判据和下一步。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "five-w-two-h",
      source: new URL("./references/five-w-two-h.md", import.meta.url),
      target: "references/five-w-two-h.md",
      title: "five-w-two-h.md",
      summary: "5W2H 问题定义方法，用于鱼骨图分析前的问题范围界定。",
      loadWhen: "需要在鱼骨图分析前用结构化提问清晰界定问题范围时读取。",
    }),
  ],
});
